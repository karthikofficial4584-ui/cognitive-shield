import axios from 'axios';

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
    return config;
  },
  (error) => Promise.reject(error)
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

// 2. Endpoint Services Mapping
export const authService = {
  login: async (email: string) => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/auth/login', { email });
      return response.data;
    }
    return withRetry(async () => {
      // Mock POST /auth/login
      return { token: 'mock-jwt-shield-token-100', user: { email, name: 'Commander Karthik', role: 'Lead Architect' } };
    });
  },
  logout: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    }
    return { success: true };
  },
};

export const userService = {
  getProfile: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.get('/user/profile');
      return response.data;
    }
    return withRetry(async () => {
      // Mock GET /user/profile
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
    if (shouldHitBackend()) {
      const response = await apiClient.get('/focus/score');
      return response.data;
    }
    return { focusScore: 88, state: 'Focused' };
  },
  updateThresholds: async (focusThreshold: number, urgencyThreshold: number) => {
    if (shouldHitBackend()) {
      const response = await apiClient.put('/settings', { focusThreshold, urgencyThreshold });
      return response.data;
    }
    // Mock PUT /settings
    return { success: true, focusThreshold, urgencyThreshold };
  },
};

export const telemetryService = {
  streamActivity: async (wpm: number, changes: number, retention: number) => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/telemetry', { wpm, changes, retention });
      return response.data;
    }
    // Mock POST /telemetry
    return { velocity: 0.3 * wpm + 0.5 * changes + 0.2 * retention };
  },
};

export const notificationsService = {
  fetchLogs: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.get('/notifications');
      return response.data;
    }
    // Mock GET /notifications
    return [];
  },
  bypassUrgency: async (id: string) => {
    if (shouldHitBackend()) {
      const response = await apiClient.post(`/notifications/${id}/bypass`);
      return response.data;
    }
    // Mock POST /notifications/bypass
    return { success: true, id };
  },
};

export const queueService = {
  fetchQueue: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.get('/queue');
      return response.data;
    }
    // Mock GET /queue
    return [];
  },
  releaseOne: async (id: string) => {
    if (shouldHitBackend()) {
      const response = await apiClient.post(`/queue/${id}/release`);
      return response.data;
    }
    // Mock POST /queue/release
    return { success: true, id };
  },
  releaseAll: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.post('/queue/release-all');
      return response.data;
    }
    // Mock POST /queue/release-all
    return { success: true };
  },
  clearQueue: async () => {
    if (shouldHitBackend()) {
      const response = await apiClient.delete('/queue');
      return response.data;
    }
    // Mock DELETE /queue
    return { success: true };
  },
};

export const analyticsService = {
  fetchReport: async (range: string) => {
    if (shouldHitBackend()) {
      const response = await apiClient.get(`/analytics?range=${range}`);
      return response.data;
    }
    // Mock GET /analytics
    return { range, timestamp: Date.now() };
  },
};

export const coachService = {
  fetchCoachData: async (timeframe: 'today' | 'week' | 'month' = 'today') => {
    if (shouldHitBackend()) {
      const response = await apiClient.get(`/coach/${timeframe}`);
      return response.data;
    }
    // Mock Data
    return withRetry(async () => {
      return {
        overall_ai_score: 85,
        productivity_score: 88,
        focus_trend: "Improving",
        burnout_risk: "Low",
        peak_focus_hours: ["09:00 - 11:00", "14:00 - 15:00"],
        most_distracting_apps: ["Slack", "Discord"],
        deep_work_duration_minutes: 120,
        saved_interruptions: 15,
        queue_efficiency: 95,
        ai_recommendations: [
          "Your most productive period is between 9 AM and 11 AM.",
          "Consider scheduling meetings after your peak focus hours.",
          "Take a short break after long deep-focus sessions.",
          "Reduce notifications from your most distracting application."
        ]
      };
    });
  }
};
