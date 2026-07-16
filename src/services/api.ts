import axios from 'axios';
import { router } from 'expo-router';

// Get API base URL and mode from Expo Environment Variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const IS_BACKEND_MODE = process.env.EXPO_PUBLIC_API_MODE === 'backend';

console.log(`[Cognitive Shield API] Mode: ${IS_BACKEND_MODE ? 'Backend' : 'Mock (Sandbox)'} | Base URL: ${API_URL}`);

// 1. Centralized Axios client representing backend connection
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const getAuthToken = () => authToken;

// Request/Response Interceptor for simulation and offline modes
let isOffline = false;

export const setOfflineMode = (offline: boolean) => {
  isOffline = offline;
};

export const getOfflineMode = () => isOffline;

apiClient.interceptors.request.use(
  async (config) => {
    if (isOffline) {
      throw new Error('Network Offline. Shield running in Local Cache Mode.');
    }
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      setAuthToken(null);
      // Gracefully redirect to login on 401 without crashing
      router.replace('/login' as any);
    }
    if (error.response && error.response.data && error.response.data.detail) {
      console.error('API Error:', error.response.data.detail);
    }
    return Promise.reject(error);
  }
);

// Basic retry wrapper for API calls
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs * 1.5);
  }
}

// Helper to determine if we should hit backend or return mock
const shouldHitBackend = () => IS_BACKEND_MODE && !isOffline;

// Helper to prevent requests without token
const hasToken = () => !!getAuthToken();

// 2. Endpoint Services Mapping
export const authService = {
  login: async (username: string, password?: string) => {
    if (shouldHitBackend()) {
      const params = new URLSearchParams();
      params.append('username', username);
      if (password) params.append('password', password);
      
      const response = await apiClient.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if (response.data && response.data.access_token) {
        setAuthToken(response.data.access_token);
      }
      return response.data;
    }
    return withRetry(async () => {
      const token = 'mock-jwt-shield-token-100';
      setAuthToken(token);
      return { token, user: { email: username, name: 'Commander Karthik', role: 'Lead Architect' } };
    });
  },
  logout: async () => {
    setAuthToken(null);
    return { success: true };
  },
};

export const userService = {
  getProfile: async () => {
    if (!hasToken()) return null;
    if (shouldHitBackend()) {
      const response = await apiClient.get('/auth/me');
      return response.data;
    }
    return withRetry(async () => {
      // Mock GET /auth/me
      return {
        name: 'Commander Karthik',
        role: 'Lead Systems Architect',
        email: 'karthik@cognitiveshield.io',
        phone: '+1 (555) 019-2834',
        memberSince: 'July 2026',
        streak: 12,
        unlockedBadges: ['1', '2', '3'],
      };
    });
  },
};

export const focusService = {
  getScore: async () => {
    if (!hasToken()) return { focusScore: 0, state: 'Idle' };
    if (shouldHitBackend()) {
      const response = await apiClient.get('/focus/latest');
      return response.data;
    }
    return { focusScore: 88, state: 'Focused' };
  },
  updateThresholds: async (focusThreshold: number, urgencyThreshold: number) => {
    if (shouldHitBackend()) {
      const response = await apiClient.put('/settings', { focusThreshold, urgencyThreshold });
      return response.data;
    }
    return { success: true, focusThreshold, urgencyThreshold };
  },
};

export const telemetryService = {
  streamActivity: async (wpm: number, changes: number, retention: number) => {
    if (!hasToken()) return { velocity: 0 };
    if (shouldHitBackend()) {
      const response = await apiClient.post('/telemetry', {
        typing_speed: wpm,
        code_changes: changes,
        window_consistency: retention,
        mouse_activity: 0,
        active_window: "VS Code"
      });
      return response.data;
    }
    return { velocity: 0.3 * wpm + 0.5 * changes + 0.2 * retention };
  },
};

export const notificationsService = {
  fetchLogs: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/notifications/logs');
      return response.data;
    }
    return [];
  },
  bypassUrgency: async (id: string) => {
    // No backend endpoint exists for bypassUrgency by ID.
    // Return mock success to prevent network errors.
    return { success: true, id };
  },
};

export const queueService = {
  fetchQueue: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/queue');
      return response.data;
    }
    return [];
  },
  releaseOne: async (id: string) => {
    if (shouldHitBackend()) {
      const response = await apiClient.post(`/queue/release/${id}`);
      return response.data;
    }
    return { success: true, id };
  },
  releaseAll: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/queue/release-all');
      return response.data;
    }
    return { success: true };
  },
  clearQueue: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.delete('/queue');
      return response.data;
    }
    return { success: true };
  },
};

export const analyticsService = {
  fetchReport: async (range: string) => {
    if (!hasToken()) return { range, timestamp: Date.now() };
    if (shouldHitBackend()) {
      let endpoint = '/analytics';
      if (range === 'today') endpoint = '/analytics/today';
      else if (range === 'week') endpoint = '/analytics/week';
      else if (range === 'month') endpoint = '/analytics/month';
      else if (range === 'daily') endpoint = '/analytics/daily';
      
      const response = await apiClient.get(endpoint);
      return response.data;
    }
    return { range, timestamp: Date.now() };
  },
};

export const digestService = {
  generateDigest: async () => {
    if (!hasToken()) return null;
    if (shouldHitBackend()) {
      const response = await apiClient.post('/digest/generate');
      return response.data;
    }
    return {
      id: `digest-${Date.now()}`,
      user_id: 'mock-user',
      summary: 'You received 5 notifications while in Deep Focus.\n\n• Slack — 2 messages\n• Teams — 1 message\n• Email — 1 message\n• PagerDuty — 1 message\n\nMost important:\nSystem: Production Server Down',
      notification_count: 5,
      highest_urgency: 0.95,
      time_saved_minutes: 10,
      app_grouping: { Slack: 2, Teams: 1, Email: 1, PagerDuty: 1 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  getLatest: async () => {
    if (!hasToken()) return null;
    if (shouldHitBackend()) {
      const response = await apiClient.get('/digest/latest');
      return response.data;
    }
    return null;
  },
  getHistory: async (limit = 20) => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get(`/digest/history?limit=${limit}`);
      return response.data;
    }
    return [];
  },
};

export const timelineService = {
  fetchTimeline: async (params?: { event_type?: string; event_date?: string; limit?: number; offset?: number }) => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/timeline', { params });
      return response.data;
    }
    return getMockTimeline(params);
  },
  fetchToday: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/timeline/today');
      return response.data;
    }
    return getMockTimeline({ limit: 10 });
  },
  fetchWeek: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/timeline/week');
      return response.data;
    }
    return getMockTimeline({ limit: 30 });
  },
  fetchDemo: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/timeline/demo');
      return response.data;
    }
    return getMockTimeline({ limit: 15 });
  },
};

function getMockTimeline(params?: any) {
  const events = [
    {
      id: "ev-1",
      user_id: "mock-user",
      event_type: "Demo Started",
      title: "Demo Started",
      description: "Developer demo simulation started.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      metadata_json: JSON.stringify({ status: "started" }),
    },
    {
      id: "ev-2",
      user_id: "mock-user",
      event_type: "Coding Started",
      title: "Coding Started",
      description: "Developer started typing (WPM: 40) and editing files.",
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      metadata_json: JSON.stringify({ wpm: 40, code_changes: 15 }),
    },
    {
      id: "ev-3",
      user_id: "mock-user",
      event_type: "Velocity Changed",
      title: "Velocity: 42.5%",
      description: "Development speed is now at 42.5% with WPM: 40.",
      timestamp: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
      metadata_json: JSON.stringify({ velocity: 42.5, wpm: 40 }),
    },
    {
      id: "ev-4",
      user_id: "mock-user",
      event_type: "Focus Score Changed",
      title: "Focus Score: 65 (Focused)",
      description: "Attention protection adjusted to Focused state.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      metadata_json: JSON.stringify({ focus_score: 65, state: "Focused" }),
    },
    {
      id: "ev-5",
      user_id: "mock-user",
      event_type: "Notification Received",
      title: "Notification from Alice",
      description: "Received incoming notification 'Lunch?' via Slack.",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      metadata_json: JSON.stringify({ app_name: "Slack", sender: "Alice", title: "Lunch?", urgency_score: 0.4 }),
    },
    {
      id: "ev-6",
      user_id: "mock-user",
      event_type: "Notification Allowed",
      title: "Allowed notification: Lunch?",
      description: "Notification from Alice was delivered to the user directly.",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      metadata_json: JSON.stringify({ app_name: "Slack", sender: "Alice", title: "Lunch?", urgency_score: 0.4, focus_score: 65 }),
    },
    {
      id: "ev-7",
      user_id: "mock-user",
      event_type: "Coding Started",
      title: "Coding Started",
      description: "Developer typing speed increased significantly (WPM: 110).",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      metadata_json: JSON.stringify({ wpm: 110, code_changes: 95 }),
    },
    {
      id: "ev-8",
      user_id: "mock-user",
      event_type: "Focus Score Changed",
      title: "Focus Score: 88 (Deep Focus)",
      description: "Attention protection adjusted to Deep Focus state.",
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      metadata_json: JSON.stringify({ focus_score: 88, state: "Deep Focus" }),
    },
    {
      id: "ev-9",
      user_id: "mock-user",
      event_type: "Notification Received",
      title: "Notification from Manager",
      description: "Received incoming notification 'Stand-up Reminder' via Slack.",
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      metadata_json: JSON.stringify({ app_name: "Slack", sender: "Manager", title: "Stand-up Reminder", urgency_score: 0.5 }),
    },
    {
      id: "ev-10",
      user_id: "mock-user",
      event_type: "Notification Queued",
      title: "Queued notification: Stand-up Reminder",
      description: "Notification from Manager was queued due to focus level 88.",
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      metadata_json: JSON.stringify({ app_name: "Slack", sender: "Manager", title: "Stand-up Reminder", urgency_score: 0.5, focus_score: 88 }),
    },
    {
      id: "ev-11",
      user_id: "mock-user",
      event_type: "Notification Received",
      title: "Notification from System",
      description: "Received incoming notification 'Production Server Down' via PagerDuty.",
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      metadata_json: JSON.stringify({ app_name: "PagerDuty", sender: "System", title: "Production Server Down", urgency_score: 0.95 }),
    },
    {
      id: "ev-12",
      user_id: "mock-user",
      event_type: "Notification Allowed",
      title: "Allowed notification: Production Server Down",
      description: "Critical notification from System was delivered directly.",
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      metadata_json: JSON.stringify({ app_name: "PagerDuty", sender: "System", title: "Production Server Down", urgency_score: 0.95, focus_score: 88 }),
    },
    {
      id: "ev-13",
      user_id: "mock-user",
      event_type: "Queue Released",
      title: "Queue Released",
      description: "Released all 1 notification from queue.",
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      metadata_json: JSON.stringify({ count: 1 }),
    },
    {
      id: "ev-14",
      user_id: "mock-user",
      event_type: "Digest Generated",
      title: "AI Digest Generated",
      description: "Compiled AI summary for 3 notifications. Saved 6 minutes.",
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      metadata_json: JSON.stringify({ notification_count: 3, time_saved_minutes: 6 }),
    },
    {
      id: "ev-15",
      user_id: "mock-user",
      event_type: "Demo Finished",
      title: "Demo Finished",
      description: "Developer demo simulation finished successfully.",
      timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      metadata_json: JSON.stringify({ status: "completed" }),
    }
  ];

  let filtered = events;
  if (params?.event_type) {
    filtered = filtered.filter(e => e.event_type === params.event_type);
  }
  const offset = params?.offset || 0;
  const limit = params?.limit || 100;
  return filtered.slice(offset, offset + limit);
}
