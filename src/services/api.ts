import axios from 'axios';
import { router } from 'expo-router';

// Get API base URL and mode from Expo Environment Variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const IS_BACKEND_MODE = process.env.EXPO_PUBLIC_API_MODE === 'backend';

console.log(`[Cognitive Shield API] Mode: ${IS_BACKEND_MODE ? 'Backend' : 'Sandbox'} | Base URL: ${API_URL}`);

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
    
    if (error.config && error.config.skipErrorLog) {
      // Suppress logging to console for expected client errors (e.g. 404 on getLatestDigest)
    } else if (error.response && error.response.data && error.response.data.detail) {
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

// Helper to determine if we should hit backend or return local fallback
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
      const token = 'local-jwt-shield-token-100';
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
      const data = response.data;
      if (data) {
        return {
          ...data,
          memberSince: data.member_since ?? data.memberSince ?? 'Jul 2026',
        };
      }
      return data;
    }
    return withRetry(async () => {
      // Local fallback GET /auth/me
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
      const data = response.data;
      if (data) {
        return {
          focusScore: data.focus_score ?? data.focusScore ?? 0,
          state: data.focus_state ?? data.state ?? 'Normal',
        };
      }
      return data;
    }
    return { focusScore: 88, state: 'Focused' };
  },
  getHistory: async (limit = 15) => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get(`/focus/history?limit=${limit}`);
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => item.focus_score ?? item.focusScore ?? 0);
      }
      return [];
    }
    return [75, 80, 82, 85, 78, 80, 83, 85];
  },
  getSettings: async () => {
    if (!hasToken()) return null;
    if (shouldHitBackend()) {
      const response = await apiClient.get('/settings');
      return response.data;
    }
    return null;
  },
  updateThresholds: async (
    focusThreshold: number,
    urgencyThreshold: number,
    extraSettings?: {
      enableNotif?: boolean;
      criticalAlerts?: boolean;
      soundEnabled?: boolean;
      vibrationEnabled?: boolean;
      queueAutoRelease?: boolean;
    }
  ) => {
    if (shouldHitBackend()) {
      const response = await apiClient.put('/settings', {
        focus_threshold: focusThreshold,
        urgency_threshold: urgencyThreshold,
        enable_notif: extraSettings?.enableNotif,
        critical_alerts: extraSettings?.criticalAlerts,
        sound_enabled: extraSettings?.soundEnabled,
        vibration_enabled: extraSettings?.vibrationEnabled,
        queue_auto_release: extraSettings?.queueAutoRelease,
      });
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
  getHistory: async (limit = 10) => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get(`/telemetry/history?limit=${limit}`);
      return response.data;
    }
    return [];
  },
};

export const notificationsService = {
  fetchLogs: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/notifications/logs');
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          id: item.id,
          sender: item.sender,
          app: item.app_name ?? item.app ?? 'System',
          title: item.title,
          message: item.message,
          time: item.created_at ? new Date(item.created_at).toTimeString().slice(0, 5) : '00:00',
          status: item.status ?? 'Allowed',
          urgencyScore: item.urgency_score ?? 0,
          focusScore: item.focus_score_at_arrival ?? 0,
          decisionText: item.decision_text ?? '',
        }));
      }
      return [];
    }
    return [];
  },
  bypassUrgency: async (id: string) => {
    // No backend endpoint exists for bypassUrgency by ID.
    // Return local success to prevent network errors.
    return { success: true, id };
  },
};

export const queueService = {
  fetchQueue: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/queue');
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          id: item.id,
          sender: item.sender,
          app: item.app_name ?? item.app ?? 'System',
          title: item.title,
          message: item.message,
          timeReceived: item.created_at ? new Date(item.created_at).toTimeString().slice(0, 5) : '00:00',
          focusScore: item.focus_score_at_arrival ?? item.focusScore ?? 0,
          urgencyScore: item.urgency_score ?? item.urgencyScore ?? 0,
          estReleaseTime: item.est_release_time ?? item.estReleaseTime ?? '5 mins',
          queuePosition: item.queue_position ?? item.queuePosition ?? 1,
          reason: item.reason ?? `Blocked because Focus Score was ${item.focus_score_at_arrival ?? 0} and Urgency was ${item.urgency_score ?? 0}.`,
          status: item.status ?? 'Queued',
        }));
      }
      return [];
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
  releaseTop: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/queue/release-top');
      return response.data;
    }
    return { success: true };
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
  deleteItem: async (id: string) => {
    if (shouldHitBackend()) {
      const response = await apiClient.delete(`/queue/${id}`);
      return response.data;
    }
    return { success: true, id };
  },
  pause: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/queue/pause');
      return response.data;
    }
    return { success: true };
  },
  resume: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/queue/resume');
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
    return null;
  },
  getLatest: async () => {
    if (!hasToken()) return null;
    if (shouldHitBackend()) {
      const response = await apiClient.get('/digest/latest', {
        validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        skipErrorLog: true,
      } as any);

      if (response.status === 404) {
        if (response.data && response.data.detail === 'No digests generated yet.') {
          return null; // Gracefully return null empty state
        }
        throw new Error(response.data?.detail || 'Not Found');
      }

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
    return [];
  },
  fetchToday: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/timeline/today');
      return response.data;
    }
    return [];
  },
  fetchWeek: async () => {
    if (!hasToken()) return [];
    if (shouldHitBackend()) {
      const response = await apiClient.get('/timeline/week');
      return response.data;
    }
    return [];
  },
};
