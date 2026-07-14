import axios from 'axios';

// 1. Centralized Axios client representing future backend connection
export const apiClient = axios.create({
  baseURL: 'https://api.cognitiveshield.io/v1',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request/Response Interceptor for simulation, retry, and offline modes
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

// 2. Endpoint Services Mapping
export const authService = {
  login: async (email: string) => {
    return withRetry(async () => {
      // Mock POST /auth/login
      return { token: 'mock-jwt-shield-token-100', user: { email, name: 'Commander Karthik', role: 'Lead Architect' } };
    });
  },
  logout: async () => {
    return { success: true };
  },
};

export const userService = {
  getProfile: async () => {
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
    return { focusScore: 88, state: 'Focused' };
  },
  updateThresholds: async (focusThreshold: number, urgencyThreshold: number) => {
    // Mock PUT /settings
    return { success: true, focusThreshold, urgencyThreshold };
  },
};

export const telemetryService = {
  streamActivity: async (wpm: number, changes: number, retention: number) => {
    // Mock POST /telemetry
    return { velocity: 0.3 * wpm + 0.5 * changes + 0.2 * retention };
  },
};

export const notificationsService = {
  fetchLogs: async () => {
    // Mock GET /notifications
    return [];
  },
  bypassUrgency: async (id: string) => {
    // Mock POST /notifications/bypass
    return { success: true, id };
  },
};

export const queueService = {
  fetchQueue: async () => {
    // Mock GET /queue
    return [];
  },
  releaseOne: async (id: string) => {
    // Mock POST /queue/release
    return { success: true, id };
  },
  releaseAll: async () => {
    // Mock POST /queue/release-all
    return { success: true };
  },
  clearQueue: async () => {
    // Mock DELETE /queue
    return { success: true };
  },
};

export const analyticsService = {
  fetchReport: async (range: string) => {
    // Mock GET /analytics
    return { range, timestamp: Date.now() };
  },
};
