import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
  setOfflineMode as setApiOfflineMode,
  userService,
  focusService,
  telemetryService,
  notificationsService,
  queueService,
  analyticsService 
} from '../services/api';

export const mapAnalytics = (data: any): ShieldAnalytics => ({
  productivityScore: data.productivity_score ?? data.productivityScore ?? 0,
  focusTrend: data.focus_trend ?? data.focusTrend ?? '0%',
  deepFocusMinutes: data.deep_focus_minutes ?? data.deepFocusMinutes ?? 0,
  preventedInteractions: data.prevented_interactions ?? data.preventedInteractions ?? 0,
  savedMinutes: data.saved_minutes ?? data.savedMinutes ?? 0,
  focusEfficiency: data.focus_efficiency ?? data.focusEfficiency ?? 0,
  allowedNotif: data.allowed_notif ?? data.allowedNotif ?? 0,
  blockedNotif: data.blocked_notif ?? data.blockedNotif ?? 0,
  criticalAlerts: data.critical_alerts ?? data.criticalAlerts ?? 0,
  queuedNotif: data.queued_notif ?? data.queuedNotif ?? 0,
  releasedNotif: data.released_notif ?? data.releasedNotif ?? 0,
  avgQueueTime: data.avg_queue_time ?? data.avgQueueTime ?? 0,
  avgVelocity: data.avg_velocity ?? data.avgVelocity ?? 0,
  typingTrend: data.typing_trend ?? data.typingTrend ?? '0 WPM',
  codeChangesTrend: data.code_changes_trend ?? data.codeChangesTrend ?? '0 lines',
  consistencyIndex: data.consistency_index ?? data.consistencyIndex ?? data.window_consistency ?? data.windowConsistency ?? 0,
  attentionStability: data.attention_stability ?? data.attentionStability ?? 0,
  switchesPrevented: data.switches_prevented ?? data.switchesPrevented ?? 0,
  weeklyImprovement: data.weekly_improvement ?? data.weeklyImprovement ?? 0,
});

// Queued card item definition
export interface ShieldQueuedItem {
  id: string;
  sender: string;
  app: 'Slack' | 'Teams' | 'Email' | 'Jira' | 'GitHub' | 'PagerDuty';
  title: string;
  message: string;
  timeReceived: string;
  focusScore: number;
  urgencyScore: number;
  estReleaseTime: string;
  queuePosition: number;
  reason: string;
  status: 'Queued' | 'Releasing' | 'Released';
}

// Notification log item definition
export interface ShieldNotificationItem {
  id: string;
  sender: string;
  title: string;
  message: string;
  time: string;
  status: 'Allowed' | 'Blocked' | 'Critical';
  urgencyScore: number;
  focusScore: number;
  decisionText: string;
}

// Analytics metrics interface
export interface ShieldAnalytics {
  productivityScore: number;
  focusTrend: string;
  deepFocusMinutes: number;
  preventedInteractions: number;
  savedMinutes: number;
  focusEfficiency: number;
  allowedNotif: number;
  blockedNotif: number;
  criticalAlerts: number;
  queuedNotif: number;
  releasedNotif: number;
  avgQueueTime: number;
  avgVelocity: number;
  typingTrend: string;
  codeChangesTrend: string;
  consistencyIndex: number;
  attentionStability: number;
  switchesPrevented: number;
  weeklyImprovement: number;
}

interface ShieldContextProps {
  // Telemetry state
  focusScore: number;
  setFocusScore: (val: number) => void;
  velocity: number;
  setVelocity: (val: number) => void;
  activeActivity: string;
  setActiveActivity: (val: string) => void;
  typingSpeed: number;
  setTypingSpeed: (val: number) => void;
  codeChanges: number;
  setCodeChanges: (val: number) => void;
  windowConsistency: number;
  setWindowConsistency: (val: number) => void;
  mouseActivity: number;
  setMouseActivity: (val: number) => void;
  focusHistory: number[];
  hasReceivedTelemetry: boolean;

  // Lists and stats
  queue: ShieldQueuedItem[];
  setQueue: React.Dispatch<React.SetStateAction<ShieldQueuedItem[]>>;
  notifications: ShieldNotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<ShieldNotificationItem[]>>;
  analytics: ShieldAnalytics;
  setAnalytics: React.Dispatch<React.SetStateAction<ShieldAnalytics>>;

  // Connection modes
  isOffline: boolean;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  isRealFocusSessionActive: boolean;
  sessionStartTime: Date | null;
  windowsDndActive: boolean;
  criticalAlertActive: boolean;
  setCriticalAlertActive: (val: boolean) => void;

  // Actions
  startRealFocusSession: () => void;
  stopRealFocusSession: () => void;
  releaseTop: () => void;
  releaseAll: () => void;
  clearQueue: () => void;
  deleteQueueItem: (id: string) => void;
  toggleOfflineMode: () => void;
  fetchLatestState: () => Promise<void>;
  isQueuePaused: boolean;
  togglePauseQueue: () => void;

  // Global Settings (Unified and synchronized)
  focusThreshold: number;
  setFocusThreshold: (val: number) => void;
  urgencyThreshold: number;
  setUrgencyThreshold: (val: number) => void;
  enableNotif: boolean;
  setEnableNotif: (val: boolean) => void;
  criticalAlerts: boolean;
  setCriticalAlerts: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (val: boolean) => void;
  queueAutoRelease: boolean;
  setQueueAutoRelease: (val: boolean) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  accentColor: 'Purple' | 'Blue' | 'Emerald' | 'Rose';
  setAccentColor: (val: 'Purple' | 'Blue' | 'Emerald' | 'Rose') => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (val: boolean) => void;
  fontSize: 'Small' | 'Medium' | 'Large';
  setFontSize: (val: 'Small' | 'Medium' | 'Large') => void;
  dataCollection: boolean;
  setDataCollection: (val: boolean) => void;
  telemetryPermission: boolean;
  setTelemetryPermission: (val: boolean) => void;
  analyticsSharing: boolean;
  setAnalyticsSharing: (val: boolean) => void;
  connectionStatus: 'connected' | 'disconnected';
}

const ShieldContext = createContext<ShieldContextProps | undefined>(undefined);

export function useShield() {
  const context = useContext(ShieldContext);
  if (!context) {
    throw new Error('useShield must be used within a ShieldProvider');
  }
  return context;
}

export function ShieldProvider({ children }: { children: React.ReactNode }) {
  const IS_BACKEND_MODE = process.env.EXPO_PUBLIC_API_MODE === 'backend';

  // 1. Telemetry State
  const [focusScore, setFocusScore] = useState(0);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [hasReceivedTelemetry, setHasReceivedTelemetry] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const [velocity, setVelocity] = useState(0);
  const [activeActivity, setActiveActivity] = useState('Idle');
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [codeChanges, setCodeChanges] = useState(0);
  const [windowConsistency, setWindowConsistency] = useState(0);
  const [mouseActivity, setMouseActivity] = useState(0);

  // 2. Queue list
  const [queue, setQueue] = useState<ShieldQueuedItem[]>([]);
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  // 3. Notification Block logs
  const [notifications, setNotifications] = useState<ShieldNotificationItem[]>([]);

  // 4. Analytics metrics
  const [analytics, setAnalytics] = useState<ShieldAnalytics>({
    productivityScore: 0,
    focusTrend: '0%',
    deepFocusMinutes: 0,
    preventedInteractions: 0,
    savedMinutes: 0,
    focusEfficiency: 0,
    allowedNotif: 0,
    blockedNotif: 0,
    criticalAlerts: 0,
    queuedNotif: 0,
    releasedNotif: 0,
    avgQueueTime: 0,
    avgVelocity: 0,
    typingTrend: '0 WPM',
    codeChangesTrend: '0 lines',
    consistencyIndex: 0,
    attentionStability: 0,
    switchesPrevented: 0,
    weeklyImprovement: 0,
  });

  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRealFocusSessionActive, setIsRealFocusSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [windowsDndActive, setWindowsDndActive] = useState(false);
  const [criticalAlertActive, setCriticalAlertActive] = useState(false);

  // 6. Global Settings (Shared Config)
  const [focusThreshold, setFocusThreshold] = useState(75);
  const [urgencyThreshold, setUrgencyThreshold] = useState(0.85);
  const [enableNotif, setEnableNotif] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [queueAutoRelease, setQueueAutoRelease] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState<'Purple' | 'Blue' | 'Emerald' | 'Rose'>('Purple');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [dataCollection, setDataCollection] = useState(true);
  const [telemetryPermission, setTelemetryPermission] = useState(true);
  const [analyticsSharing, setAnalyticsSharing] = useState(false);

  const initialSettingsLoadedRef = useRef(false);

  // Sync state from backend if Online Mode is active
  const fetchLatestState = async () => {
    // Rely on isAuthenticated check
    if (IS_BACKEND_MODE && !isOffline) {
      try {
        setIsLoading(true);
        // Fetch current score
        const scoreData = await focusService.getScore();
        if (scoreData) {
          setFocusScore(typeof scoreData.focusScore === 'number' ? scoreData.focusScore : 0);
        }
        // Fetch queue
        const queueData = await queueService.fetchQueue();
        if (queueData && Array.isArray(queueData)) {
          setQueue(queueData.map(item => ({
            ...item,
            focusScore: item.focusScore ?? 0,
            urgencyScore: item.urgencyScore ?? 0,
          })));
        }
        // Fetch notifications
        const notifData = await notificationsService.fetchLogs();
        if (notifData && Array.isArray(notifData)) {
          setNotifications(notifData);
        }
        // Fetch focus score history
        const historyData = await focusService.getHistory(30);
        if (historyData && Array.isArray(historyData)) {
          setFocusHistory(historyData.reverse());
        }
        // Fetch daily analytics report
        const analyticsData = await analyticsService.fetchReport('daily');
        if (analyticsData) {
          setAnalytics(mapAnalytics(analyticsData));
        }
        // Fetch latest telemetry record
        const telemetryHistory = await telemetryService.getHistory(1);
        if (telemetryHistory && telemetryHistory.length > 0) {
          const latest = telemetryHistory[0];
          setTypingSpeed(latest.typing_speed ?? 0);
          setCodeChanges(latest.code_changes ?? 0);
          setWindowConsistency(latest.window_consistency ?? 0);
          setMouseActivity(latest.mouse_activity ?? 0);
          setActiveActivity(latest.active_window ?? 'Idle');
          setVelocity(latest.velocity ?? 0);
          setHasReceivedTelemetry(true);
        } else {
          setHasReceivedTelemetry(false);
        }
        // Fetch profile/settings
        const userSettings = await focusService.getSettings();
        if (userSettings) {
          initialSettingsLoadedRef.current = false;
          setFocusThreshold(userSettings.focus_threshold ?? userSettings.focusThreshold ?? 75);
          setUrgencyThreshold(userSettings.urgency_threshold ?? userSettings.urgencyThreshold ?? 0.85);
          if (userSettings.enable_notif !== undefined) setEnableNotif(userSettings.enable_notif);
          if (userSettings.critical_alerts !== undefined) setCriticalAlerts(userSettings.critical_alerts);
          if (userSettings.sound_enabled !== undefined) setSoundEnabled(userSettings.sound_enabled);
          if (userSettings.vibration_enabled !== undefined) setVibrationEnabled(userSettings.vibration_enabled);
          if (userSettings.queue_auto_release !== undefined) setQueueAutoRelease(userSettings.queue_auto_release);
          setTimeout(() => {
            initialSettingsLoadedRef.current = true;
          }, 100);
        }
      } catch (error) {
        console.error('[ShieldContext] Error fetching backend state:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Backend not available: show empty state
      setQueue([]);
      setNotifications([]);
      setFocusHistory([]);
      setHasReceivedTelemetry(false);
    }
  };

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchLatestState();
    }
  }, [isOffline, isAuthenticated]);

  // Maintain a ref to the session active state to avoid closure bugs in websocket callbacks
  const isRealFocusSessionActiveRef = useRef(isRealFocusSessionActive);
  useEffect(() => {
    isRealFocusSessionActiveRef.current = isRealFocusSessionActive;
  }, [isRealFocusSessionActive]);

  // 5. WebSocket and Fallback Polling connection logic
  useEffect(() => {
    if (!isAuthenticated || isOffline || !IS_BACKEND_MODE) {
      setConnectionStatus('disconnected');
      return;
    }

    const sockets: { [key: string]: WebSocket | null } = {
      focus: null,
      telemetry: null,
      queue: null,
      notifications: null,
      analytics: null,
    };

    const heartbeats: { [key: string]: ReturnType<typeof setTimeout> | null } = {
      focus: null,
      telemetry: null,
      queue: null,
      notifications: null,
      analytics: null,
    };

    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let isDestroyed = false;

    const getWsUrl = (channel: string) => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      let wsUrl = apiUrl.replace(/^http/, 'ws');
      if (wsUrl.includes('/api/v1')) {
        wsUrl = wsUrl.replace(/\/api\/v1\/?$/, '/ws');
      } else if (wsUrl.includes('/api')) {
        wsUrl = wsUrl.replace(/\/api\/?$/, '/ws');
      } else {
        wsUrl = wsUrl.endsWith('/') ? `${wsUrl}ws` : `${wsUrl}/ws`;
      }
      return `${wsUrl}/${channel}`;
    };

    const updateGlobalConnectionStatus = () => {
      const allConnected = Object.values(sockets).every(
        s => s !== null && s.readyState === WebSocket.OPEN
      );
      setConnectionStatus(allConnected ? 'connected' : 'disconnected');
    };

    const resetHeartbeat = (channel: string, ws: WebSocket) => {
      if (heartbeats[channel]) clearTimeout(heartbeats[channel]!);
      heartbeats[channel] = setTimeout(() => {
        console.warn(`[ShieldContext] No heartbeat received on channel ${channel} for 35s. Closing socket.`);
        ws.close();
      }, 35000);
    };

    const connectSocket = (channel: string) => {
      if (isDestroyed) return;

      try {
        const url = getWsUrl(channel);
        console.log(`[ShieldContext] Connecting to WebSocket for channel ${channel}: ${url}`);
        const ws = new WebSocket(url);
        sockets[channel] = ws;

        ws.onopen = () => {
          console.log(`[ShieldContext] WebSocket connected on channel ${channel}`);
          updateGlobalConnectionStatus();
          resetHeartbeat(channel, ws);
        };

        ws.onmessage = (event) => {
          resetHeartbeat(channel, ws);
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ping') {
              try {
                ws.send(JSON.stringify({ type: 'pong' }));
              } catch (e) {
                console.error(`[ShieldContext] Failed to send pong on channel ${channel}:`, e);
              }
              return;
            }

            console.log(`[ShieldContext] WS received on channel ${channel}:`, data);

            const eventName = data.event;
            const payload = data.payload;

            if (eventName === 'focus_update') {
              if (payload && typeof payload.focus_score === 'number') {
                const newScore = payload.focus_score;
                setFocusScore(newScore);
                setFocusHistory(prev => {
                  const updated = [...prev, newScore];
                  return updated.slice(-30);
                });
              }
            } else if (eventName === 'telemetry_update') {
              if (payload) {
                setTypingSpeed(payload.typing_speed ?? 0);
                setCodeChanges(payload.code_changes ?? 0);
                setWindowConsistency(payload.window_consistency ?? 0);
                setMouseActivity(payload.mouse_activity ?? 0);
                setActiveActivity(payload.active_window ?? 'Idle');
                const vel = payload.velocity ?? 0;
                setVelocity(vel);
                setHasReceivedTelemetry(true);
              }
            } else if (eventName === 'notification_update') {
              if (payload) {
                if (Array.isArray(payload)) {
                  const mappedNotifs = payload.map((item: any) => ({
                    id: item.id,
                    sender: item.sender,
                    title: item.title,
                    message: item.message,
                    time: item.created_at ? new Date(item.created_at).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
                    status: item.status ?? 'Allowed',
                    urgencyScore: item.urgency_score ?? 0,
                    focusScore: item.focus_score_at_arrival ?? 0,
                    decisionText: item.decision_text ?? '',
                  }));
                  setNotifications(mappedNotifs);
                } else {
                  const mappedNotif: ShieldNotificationItem = {
                    id: payload.id,
                    sender: payload.sender,
                    title: payload.title,
                    message: payload.message,
                    time: payload.created_at ? new Date(payload.created_at).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
                    status: payload.status ?? 'Allowed',
                    urgencyScore: payload.urgency_score ?? 0,
                    focusScore: payload.focus_score_at_arrival ?? 0,
                    decisionText: payload.decision_text ?? '',
                  };
                  setNotifications(prev => {
                    if (prev.some(item => item.id === mappedNotif.id)) return prev;
                    return [mappedNotif, ...prev];
                  });
                }
              }
            } else if (eventName === 'queue_update') {
              if (payload && Array.isArray(payload)) {
                const mappedQueue = payload.map((item: any) => ({
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
                setQueue(mappedQueue);
              }
            } else if (eventName === 'analytics_update') {
              if (payload) {
                setAnalytics(mapAnalytics(payload));
              }
            }
          } catch (e) {
            console.error(`[ShieldContext] Error parsing WebSocket message on channel ${channel}:`, e);
          }
        };

        ws.onerror = (error) => {
          console.error(`[ShieldContext] WebSocket error on channel ${channel}:`, error);
        };

        ws.onclose = () => {
          if (heartbeats[channel]) clearTimeout(heartbeats[channel]!);
          updateGlobalConnectionStatus();
          if (!isDestroyed) {
            console.log(`[ShieldContext] WebSocket closed on channel ${channel}. Reconnecting in 3 seconds...`);
            sockets[channel] = null;
            setTimeout(() => {
              connectSocket(channel);
            }, 3000);
          }
        };
      } catch (err) {
        console.error(`[ShieldContext] Failed to connect WebSocket for channel ${channel}:`, err);
        updateGlobalConnectionStatus();
        if (!isDestroyed) {
          setTimeout(() => {
            connectSocket(channel);
          }, 3000);
        }
      }
    };

    // Connect to all channels
    connectSocket('focus');
    connectSocket('telemetry');
    connectSocket('queue');
    connectSocket('notifications');
    connectSocket('analytics');

    // Polling loop fallback (runs every 5 seconds)
    const pollData = async () => {
      // Only poll if any socket is disconnected/not ready
      const anyDisconnected = Object.values(sockets).some(s => s === null || s.readyState !== WebSocket.OPEN);
      
      if (anyDisconnected) {
        console.log('[ShieldContext] Fallback polling active...');
        try {
          const scoreData = await focusService.getScore();
          if (scoreData) {
            const newScore = typeof scoreData.focusScore === 'number' ? scoreData.focusScore : 0;
            setFocusScore(newScore);
            setFocusHistory(prev => {
              const updated = [...prev, newScore];
              return updated.slice(-30);
            });
          }
          
          const queueData = await queueService.fetchQueue();
          if (queueData && Array.isArray(queueData)) {
            setQueue(queueData.map(item => ({
              ...item,
              focusScore: item.focusScore ?? 0,
              urgencyScore: item.urgencyScore ?? 0,
            })));
          }

          const notifData = await notificationsService.fetchLogs();
          if (notifData && Array.isArray(notifData)) {
            setNotifications(notifData);
          }

          const telemetryData = await telemetryService.getHistory(1);
          if (telemetryData && telemetryData.length > 0) {
            const latest = telemetryData[0];
            setTypingSpeed(latest.typing_speed ?? 0);
            setCodeChanges(latest.code_changes ?? 0);
            setWindowConsistency(latest.window_consistency ?? 0);
            setMouseActivity(latest.mouse_activity ?? 0);
            setActiveActivity(latest.active_window ?? 'Idle');
            setVelocity(latest.velocity ?? 0);
            setHasReceivedTelemetry(true);
          }

          const analyticsData = await analyticsService.fetchReport('daily');
          if (analyticsData) {
            setAnalytics(mapAnalytics(analyticsData));
          }
        } catch (e) {
          console.error('[ShieldContext] Fallback polling failed:', e);
        }
      }
    };

    pollingTimer = setInterval(pollData, 5000);

    return () => {
      isDestroyed = true;
      if (pollingTimer) clearInterval(pollingTimer);
      Object.keys(heartbeats).forEach(key => {
        if (heartbeats[key]) clearTimeout(heartbeats[key]!);
      });
      Object.keys(sockets).forEach(key => {
        const ws = sockets[key];
        if (ws) {
          ws.onclose = null;
          ws.close();
        }
      });
    };
  }, [isAuthenticated, isOffline]);

  // Synchronize settings changes to backend
  useEffect(() => {
    if (IS_BACKEND_MODE && !isOffline && isAuthenticated && initialSettingsLoadedRef.current) {
      const saveSettings = async () => {
        try {
          await focusService.updateThresholds(focusThreshold, urgencyThreshold, {
            enableNotif,
            criticalAlerts,
            soundEnabled,
            vibrationEnabled,
            queueAutoRelease,
          });
        } catch (e) {
          console.error('[ShieldContext] Failed to save settings to backend:', e);
        }
      };
      const timer = setTimeout(saveSettings, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    focusThreshold,
    urgencyThreshold,
    enableNotif,
    criticalAlerts,
    soundEnabled,
    vibrationEnabled,
    queueAutoRelease,
    isAuthenticated,
    isOffline,
  ]);

  // Toggle offline status
  const toggleOfflineMode = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    setApiOfflineMode(nextState);
  };

  const togglePauseQueue = async () => {
    const nextState = !isQueuePaused;
    setIsQueuePaused(nextState);

    if (IS_BACKEND_MODE && !isOffline) {
      try {
        if (nextState) {
          await queueService.pause();
        } else {
          await queueService.resume();
        }
        // Refresh queue
        const freshQueue = await queueService.fetchQueue();
        setQueue(freshQueue);
      } catch (e) {
        setIsQueuePaused(!nextState);
        console.error('[ShieldContext] Error toggling queue paused status:', e);
      }
    }
  };



  // Queue actions
  const releaseTop = async () => {
    if (queue.length === 0) return;
    const target = queue[0];
    
    // Optimistic Update
    const prevQueue = [...queue];
    const prevAnalytics = { ...analytics };

    setQueue(prev => prev.map((item, idx) => {
      if (idx === 0) return { ...item, status: 'Released' as const };
      return item;
    }));

    if (IS_BACKEND_MODE && !isOffline) {
      try {
        // Verify target exists in backend queue before calling release
        const latestQueue = await queueService.fetchQueue();
        const itemExists = latestQueue.some((item: any) => item.id === target.id);
        
        if (!itemExists) {
          console.log(`[ShieldContext] Synchronization Event: Queue item ${target.id} was already removed. Synchronizing state.`);
          setQueue(latestQueue);
          return;
        }

        try {
          await queueService.releaseOne(target.id);
        } catch (innerError: any) {
          if (innerError.response && innerError.response.status === 404) {
            console.log(`[ShieldContext] Synchronization Event: 404 on release for ${target.id}. Item was already removed.`);
            const freshQueue = await queueService.fetchQueue();
            setQueue(freshQueue);
            return;
          }
          throw innerError;
        }

        const freshQueue = await queueService.fetchQueue();
        setQueue(freshQueue);
      } catch (e) {
        // Rollback
        setQueue(prevQueue);
        setAnalytics(prevAnalytics);
        console.error('[ShieldContext] Error releasing top item from backend:', e);
        return;
      }
    } else {
      setTimeout(() => {
        setQueue(prev => prev.filter(item => item.id !== target.id).map((item, idx) => ({ ...item, queuePosition: idx + 1 })));
      }, 450);
    }

    setAnalytics(prev => ({
      ...prev,
      releasedNotif: prev.releasedNotif + 1,
      queuedNotif: Math.max(0, prev.queuedNotif - 1),
    }));
  };

  const releaseAll = async () => {
    if (queue.length === 0) return;

    // Optimistic Update
    const prevQueue = [...queue];
    const prevAnalytics = { ...analytics };

    setQueue([]);

    if (IS_BACKEND_MODE && !isOffline) {
      try {
        await queueService.releaseAll();
        const freshQueue = await queueService.fetchQueue();
        setQueue(freshQueue);
      } catch (e) {
        // Rollback
        setQueue(prevQueue);
        setAnalytics(prevAnalytics);
        console.error('[ShieldContext] Error releasing all from backend:', e);
        return;
      }
    }

    setAnalytics(prev => ({
      ...prev,
      releasedNotif: prev.releasedNotif + prevQueue.length,
      queuedNotif: 0,
    }));
  };

  const clearQueue = async () => {
    // Optimistic Update
    const prevQueue = [...queue];
    const prevAnalytics = { ...analytics };

    setQueue([]);

    if (IS_BACKEND_MODE && !isOffline) {
      try {
        await queueService.clearQueue();
        const freshQueue = await queueService.fetchQueue();
        setQueue(freshQueue);
      } catch (e) {
        // Rollback
        setQueue(prevQueue);
        setAnalytics(prevAnalytics);
        console.error('[ShieldContext] Error clearing queue from backend:', e);
        return;
      }
    }

    setAnalytics(prev => ({
      ...prev,
      queuedNotif: 0,
    }));
  };

  const deleteQueueItem = async (id: string) => {
    const target = queue.find(item => item.id === id);
    if (!target) return;

    // Optimistic Update
    const prevQueue = [...queue];
    const prevAnalytics = { ...analytics };

    setQueue(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, queuePosition: idx + 1 })));

    if (IS_BACKEND_MODE && !isOffline) {
      try {
        // Verify target exists in backend queue before calling delete
        const latestQueue = await queueService.fetchQueue();
        const itemExists = latestQueue.some((item: any) => item.id === id);
        
        if (!itemExists) {
          console.log(`[ShieldContext] Synchronization Event: Queue item ${id} was already removed. Synchronizing state.`);
          setQueue(latestQueue);
          return;
        }

        try {
          await queueService.deleteItem(id);
        } catch (innerError: any) {
          if (innerError.response && innerError.response.status === 404) {
            console.log(`[ShieldContext] Synchronization Event: 404 on delete for ${id}. Item was already removed.`);
            const freshQueue = await queueService.fetchQueue();
            setQueue(freshQueue);
            return;
          }
          throw innerError;
        }

        const freshQueue = await queueService.fetchQueue();
        setQueue(freshQueue);
      } catch (e) {
        // Rollback
        setQueue(prevQueue);
        setAnalytics(prevAnalytics);
        console.error('[ShieldContext] Error deleting queue item from backend:', e);
        return;
      }
    }

    setAnalytics(prev => ({
      ...prev,
      queuedNotif: Math.max(0, prev.queuedNotif - 1),
    }));
  };

  // Auto Release trigger when focusScore decays below focusThreshold
  useEffect(() => {
    if (queueAutoRelease && focusScore < focusThreshold && queue.length > 0) {
      const topItem = queue.find(q => q.status === 'Queued');
      if (topItem) {
        releaseTop();
      }
    }
  }, [focusScore, focusThreshold, queueAutoRelease, queue]);

  // Real Focus Session Controls
  const startRealFocusSession = () => {
    setIsRealFocusSessionActive(true);
    setSessionStartTime(new Date());
    setWindowsDndActive(true);
    setFocusHistory([]); // Clear history on start
    setHasReceivedTelemetry(false); // Reset to waiting state
  };

  const stopRealFocusSession = () => {
    setIsRealFocusSessionActive(false);
    setSessionStartTime(null);
    setWindowsDndActive(false);
    setFocusHistory([]); // Clear history on stop
    releaseAll(); // Flush queue at end of session
  };

  // Auto-activate Windows DND when focus score is high in normal operation
  useEffect(() => {
    if (focusScore >= focusThreshold) {
      setWindowsDndActive(true);
    } else {
      setWindowsDndActive(false);
    }
  }, [focusScore, focusThreshold]);

  return (
    <ShieldContext.Provider
      value={{
        focusScore,
        setFocusScore,
        velocity,
        setVelocity,
        activeActivity,
        setActiveActivity,
        typingSpeed,
        setTypingSpeed,
        codeChanges,
        setCodeChanges,
        windowConsistency,
        setWindowConsistency,
        mouseActivity,
        setMouseActivity,
        focusHistory,
        queue,
        setQueue,
        notifications,
        setNotifications,
        analytics,
        setAnalytics,
        isOffline,
        isLoading,
        setIsLoading,
        isRealFocusSessionActive,
        sessionStartTime,
        windowsDndActive,
        criticalAlertActive,
        setCriticalAlertActive,
        startRealFocusSession,
        stopRealFocusSession,
        releaseTop,
        releaseAll,
        clearQueue,
        deleteQueueItem,
        toggleOfflineMode,
        fetchLatestState,
        isQueuePaused,
        togglePauseQueue,

        // Settings (unified state)
        focusThreshold,
        setFocusThreshold,
        urgencyThreshold,
        setUrgencyThreshold,
        enableNotif,
        setEnableNotif,
        criticalAlerts,
        setCriticalAlerts,
        soundEnabled,
        setSoundEnabled,
        vibrationEnabled,
        setVibrationEnabled,
        queueAutoRelease,
        setQueueAutoRelease,
        darkMode,
        setDarkMode,
        accentColor,
        setAccentColor,
        animationsEnabled,
        setAnimationsEnabled,
        fontSize,
        setFontSize,
        dataCollection,
        setDataCollection,
        telemetryPermission,
        setTelemetryPermission,
        analyticsSharing,
        setAnalyticsSharing,
        hasReceivedTelemetry,
        connectionStatus,
      }}>
      {children}
    </ShieldContext.Provider>
  );
}
