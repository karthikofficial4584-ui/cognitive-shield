import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  setOfflineMode as setApiOfflineMode,
  userService,
  focusService,
  telemetryService,
  notificationsService,
  queueService,
  analyticsService 
} from '../services/api';

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
  focusHistory: number[];

  // Lists and stats
  queue: ShieldQueuedItem[];
  setQueue: React.Dispatch<React.SetStateAction<ShieldQueuedItem[]>>;
  notifications: ShieldNotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<ShieldNotificationItem[]>>;
  analytics: ShieldAnalytics;
  setAnalytics: React.Dispatch<React.SetStateAction<ShieldAnalytics>>;

  // Connection/Demo modes
  isOffline: boolean;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  demoModeActive: boolean;
  demoStepText: string;
  criticalAlertActive: boolean;
  setCriticalAlertActive: (val: boolean) => void;

  // Actions
  startDemoSimulation: () => void;
  stopDemoSimulation: () => void;
  releaseTop: () => void;
  releaseAll: () => void;
  clearQueue: () => void;
  deleteQueueItem: (id: string) => void;
  triggerManualAlert: (app: any, title: string, message: string, urgency: number) => void;
  toggleOfflineMode: () => void;
  fetchLatestState: () => Promise<void>;

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
  const [focusScore, setFocusScore] = useState(88);
  const [focusHistory, setFocusHistory] = useState<number[]>([76, 78, 77, 80, 81, 79, 82, 83, 80, 82, 84, 85, 83, 81, 82]);

  useEffect(() => {
    setFocusHistory(prev => {
      // Prevent consecutive duplicate entries and cap size at 15
      if (prev[prev.length - 1] === focusScore) return prev;
      return [...prev.slice(1), focusScore];
    });
  }, [focusScore]);
  const [velocity, setVelocity] = useState(84);
  const [activeActivity, setActiveActivity] = useState('Deep Focus Coding');
  const [typingSpeed, setTypingSpeed] = useState(74);
  const [codeChanges, setCodeChanges] = useState(88);
  const [windowConsistency, setWindowConsistency] = useState(90);

  // 2. Queue list
  const [queue, setQueue] = useState<ShieldQueuedItem[]>([
    {
      id: '1',
      sender: 'Slack',
      app: 'Slack',
      title: 'Dave: taco lunch?',
      message: 'Dave: Hey Commander! Grab lunch at 12:15? Tacos down the street are really good.',
      timeReceived: '22:30',
      focusScore: 85,
      urgencyScore: 0.12,
      estReleaseTime: '6 mins',
      queuePosition: 1,
      reason: 'Blocked because Focus Score was 85 and urgency was 0.12.',
      status: 'Queued',
    },
    {
      id: '2',
      sender: 'Microsoft Teams',
      app: 'Teams',
      title: 'Product Sync Update',
      message: 'Sarah: Please post your progress updates in channel before the sync meeting.',
      timeReceived: '22:15',
      focusScore: 90,
      urgencyScore: 0.25,
      estReleaseTime: '12 mins',
      queuePosition: 2,
      reason: 'Blocked because Focus Score was 90 and urgency was 0.25.',
      status: 'Queued',
    },
    {
      id: '3',
      sender: 'GitHub',
      app: 'GitHub',
      title: 'PR #42 Approved',
      message: 'Reviewer: Approved changes in features/auth. Ready for merge.',
      timeReceived: '21:55',
      focusScore: 78,
      urgencyScore: 0.45,
      estReleaseTime: '3 mins',
      queuePosition: 3,
      reason: 'Blocked because Focus Score was 78 and urgency was 0.45.',
      status: 'Queued',
    },
  ]);

  // 3. Notification Block logs
  const [notifications, setNotifications] = useState<ShieldNotificationItem[]>([
    {
      id: 'n-1',
      sender: 'Jira',
      title: 'Ticket Assigned: SEC-904',
      message: 'Jirabot: SEC-904 CSS styling bug was assigned to you with high priority.',
      time: '21:00',
      status: 'Allowed',
      urgencyScore: 0.88,
      focusScore: 82,
      decisionText: 'Allowed: Urgency 0.88 exceeds Focus Score 82. Priority bypass.',
    },
    {
      id: 'n-2',
      sender: 'Slack',
      title: 'Dave: taco lunch?',
      message: 'Dave: Hey Commander! Grab lunch at 12:15?',
      time: '22:30',
      status: 'Blocked',
      urgencyScore: 0.12,
      focusScore: 85,
      decisionText: 'Blocked: Focus Score 85 exceeds Urgency 0.12. Queued to buffer.',
    },
  ]);

  // 4. Analytics metrics
  const [analytics, setAnalytics] = useState<ShieldAnalytics>({
    productivityScore: 92,
    focusTrend: '+8% vs yesterday',
    deepFocusMinutes: 252,
    preventedInteractions: 42,
    savedMinutes: 180,
    focusEfficiency: 94,
    allowedNotif: 8,
    blockedNotif: 34,
    criticalAlerts: 2,
    queuedNotif: 12,
    releasedNotif: 10,
    avgQueueTime: 14,
    avgVelocity: 84,
    typingTrend: '+12% WPM',
    codeChangesTrend: '+142 lines',
    consistencyIndex: 91,
    attentionStability: 96,
    switchesPrevented: 42,
    weeklyImprovement: 8.5,
  });

  // 5. System States
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(false);
  const [demoStepText, setDemoStepText] = useState('Simulation Offline');
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

  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state from backend if Online Mode is active
  const fetchLatestState = async () => {
    if (IS_BACKEND_MODE && !isOffline) {
      try {
        setIsLoading(true);
        // Fetch current score
        const scoreData = await focusService.getScore();
        if (scoreData) {
          setFocusScore(scoreData.focusScore);
        }
        // Fetch queue
        const queueData = await queueService.fetchQueue();
        if (queueData && Array.isArray(queueData)) {
          setQueue(queueData);
        }
        // Fetch notifications
        const notifData = await notificationsService.fetchLogs();
        if (notifData && Array.isArray(notifData)) {
          setNotifications(notifData);
        }
        // Fetch profile/settings
        const profile = await userService.getProfile();
        if (profile) {
          setFocusThreshold(profile.focusThreshold ?? 75);
          setUrgencyThreshold(profile.urgencyThreshold ?? 0.85);
        }
      } catch (error) {
        console.error('[ShieldContext] Error fetching backend state:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLatestState();
  }, [isOffline]);

  // Toggle offline simulator
  const toggleOfflineMode = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    setApiOfflineMode(nextState);
  };

  // Helper trigger notifications
  const triggerManualAlert = (
    app: 'Slack' | 'Teams' | 'Email' | 'Jira' | 'GitHub' | 'PagerDuty',
    title: string,
    message: string,
    urgency: number
  ) => {
    const newId = `manual-${Date.now()}`;
    const formattedTime = new Date().toTimeString().slice(0, 5);

    // Sync via API if backend mode active
    if (IS_BACKEND_MODE && !isOffline) {
      if (urgency >= urgencyThreshold) {
        notificationsService.bypassUrgency(newId).catch(console.error);
      }
    }

    if (urgency >= urgencyThreshold) {
      // Critical bypasses
      const alertItem: ShieldNotificationItem = {
        id: newId,
        sender: app,
        title,
        message,
        time: formattedTime,
        status: 'Critical',
        urgencyScore: urgency,
        focusScore,
        decisionText: `CRITICAL BYPASS: Urgency ${urgency} triggers direct alarm override.`,
      };
      setNotifications(prev => [alertItem, ...prev]);
      setCriticalAlertActive(true);
      setTimeout(() => setCriticalAlertActive(false), 5000);
      
      setAnalytics(prev => ({
        ...prev,
        criticalAlerts: prev.criticalAlerts + 1,
        allowedNotif: prev.allowedNotif + 1,
      }));
    } else if (focusScore > urgency * 100) {
      // Block and queue
      const blockItem: ShieldQueuedItem = {
        id: newId,
        sender: app,
        app,
        title,
        message,
        timeReceived: formattedTime,
        focusScore,
        urgencyScore: urgency,
        estReleaseTime: '6 mins',
        queuePosition: queue.length + 1,
        reason: `Blocked because Focus Score was ${focusScore} and urgency was ${urgency}.`,
        status: 'Queued',
      };
      setQueue(prev => [...prev, blockItem]);

      const logItem: ShieldNotificationItem = {
        id: newId,
        sender: app,
        title,
        message,
        time: formattedTime,
        status: 'Blocked',
        urgencyScore: urgency,
        focusScore,
        decisionText: `Blocked: Focus Score ${focusScore} exceeds Urgency ${urgency}. Queued.`,
      };
      setNotifications(prev => [logItem, ...prev]);

      setAnalytics(prev => ({
        ...prev,
        blockedNotif: prev.blockedNotif + 1,
        queuedNotif: prev.queuedNotif + 1,
        switchesPrevented: prev.switchesPrevented + 1,
        preventedInteractions: prev.preventedInteractions + 1,
      }));
    } else {
      // Allow alert
      const allowItem: ShieldNotificationItem = {
        id: newId,
        sender: app,
        title,
        message,
        time: formattedTime,
        status: 'Allowed',
        urgencyScore: urgency,
        focusScore,
        decisionText: `Allowed: Urgency ${urgency} overrides Focus Score ${focusScore}. Delivered.`,
      };
      setNotifications(prev => [allowItem, ...prev]);

      setAnalytics(prev => ({
        ...prev,
        allowedNotif: prev.allowedNotif + 1,
      }));
    }
  };

  // Queue actions
  const releaseTop = async () => {
    if (queue.length === 0) return;
    const target = queue[0];
    
    if (IS_BACKEND_MODE && !isOffline) {
      try {
        await queueService.releaseOne(target.id);
      } catch (e) {
        console.error('[ShieldContext] Error releasing top item from backend:', e);
      }
    }

    setQueue(prev => prev.map((item, idx) => {
      if (idx === 0) return { ...item, status: 'Released' as const };
      return item;
    }));

    setTimeout(() => {
      setQueue(prev => prev.filter(item => item.id !== target.id).map((item, idx) => ({ ...item, queuePosition: idx + 1 })));
      setAnalytics(prev => ({
        ...prev,
        releasedNotif: prev.releasedNotif + 1,
        queuedNotif: Math.max(0, prev.queuedNotif - 1),
      }));
    }, 450);
  };

  const releaseAll = async () => {
    if (queue.length === 0) return;

    if (IS_BACKEND_MODE && !isOffline) {
      try {
        await queueService.releaseAll();
      } catch (e) {
        console.error('[ShieldContext] Error releasing all from backend:', e);
      }
    }

    setQueue(prev => prev.map(item => ({ ...item, status: 'Released' as const })));
    setTimeout(() => {
      const releaseCount = queue.length;
      setQueue([]);
      setAnalytics(prev => ({
        ...prev,
        releasedNotif: prev.releasedNotif + releaseCount,
        queuedNotif: 0,
      }));
    }, 600);
  };

  const clearQueue = async () => {
    if (IS_BACKEND_MODE && !isOffline) {
      try {
        await queueService.clearQueue();
      } catch (e) {
        console.error('[ShieldContext] Error clearing queue from backend:', e);
      }
    }
    setQueue([]);
    setAnalytics(prev => ({ ...prev, queuedNotif: 0 }));
  };

  const deleteQueueItem = async (id: string) => {
    if (IS_BACKEND_MODE && !isOffline) {
      try {
        await queueService.releaseOne(id); // Delete is mapped to releaseOne/resolve in API mock
      } catch (e) {
        console.error('[ShieldContext] Error deleting queue item from backend:', e);
      }
    }
    setQueue(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, queuePosition: idx + 1 })));
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

  // Demo Simulation Logic Steps:
  const startDemoSimulation = () => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    setDemoModeActive(true);
    setIsLoading(true);

    let step = 0;
    setDemoStepText('Initializing sandbox telemetry...');

    // Trigger fake loading skeletons
    setTimeout(() => {
      setIsLoading(false);
      setFocusScore(20);
      setVelocity(10);
      setTypingSpeed(5);
      setCodeChanges(0);
      setWindowConsistency(30);
      setActiveActivity('Developer Idle');
      setDemoStepText('Developer Idle (Focus = 20)');
    }, 1200);

    demoTimerRef.current = setInterval(() => {
      step++;
      
      if (step === 1) {
        setActiveActivity('Coding workspace init');
        setTypingSpeed(45);
        setCodeChanges(25);
        setWindowConsistency(65);
        setVelocity(54);
        setFocusScore(35);
        setDemoStepText('Developer starts coding: Telemetry starts rising');
      } else if (step === 2) {
        setTypingSpeed(78);
        setCodeChanges(62);
        setWindowConsistency(88);
        setVelocity(76);
        setFocusScore(54);
        setActiveActivity('Deep Focus sprint');
        setDemoStepText('Coding sprint: Focus score climbs to 54');
      } else if (step === 3) {
        setFocusScore(72);
        setDemoStepText('Tunnel-vision retention: Focus score reaches 72');
      } else if (step === 4) {
        setFocusScore(88);
        setTypingSpeed(86);
        setCodeChanges(94);
        setWindowConsistency(95);
        setVelocity(89);
        setActiveActivity('Deep Flow State');
        setDemoStepText('Peak Deep Focus unlocked (Focus score = 88)');
      } else if (step === 5) {
        setDemoStepText('Incoming Alert: Slack ping blocked by gate threshold');
        triggerManualAlert('Slack', 'Dave: Lunch today?', 'Commander! Grab tacos at 12:15?', 0.12);
      } else if (step === 6) {
        setDemoStepText('Incoming Alert: MS Teams status update buffered');
        triggerManualAlert('Teams', 'Sarah: Status update', 'Sarah requests sync status update logs.', 0.25);
      } else if (step === 7) {
        setDemoStepText('EMERGENCY CRITICAL BYPASS: RED SYSTEM OVERRIDE');
        triggerManualAlert('PagerDuty', 'ALERT: Production down', 'Red Alert: Main SQL client database connection timeout.', 0.99);
      } else if (step === 8) {
        setActiveActivity('Investigating Emergency Alert');
        setTypingSpeed(0);
        setCodeChanges(0);
        setWindowConsistency(100);
        setVelocity(30);
        setDemoStepText('Developer stops coding: focus score begins to decay');
      } else if (step === 9) {
        setFocusScore(80);
        setDemoStepText('Decaying focus curve: score drops to 80');
      } else if (step === 10) {
        setFocusScore(72);
        setDemoStepText('Focus drops below 75 threshold. Queue auto-unlocks!');
      } else if (step === 11) {
        setDemoStepText('Auto-releasing buffered Slack alert to client');
        releaseTop();
      } else if (step === 12) {
        setDemoStepText('Auto-releasing buffered Teams alert to client');
        releaseTop();
      } else if (step >= 13) {
        clearInterval(demoTimerRef.current!);
        setDemoModeActive(false);
        setDemoStepText('Simulation Finished. System stats normalized.');
        
        setAnalytics(prev => ({
          ...prev,
          deepFocusMinutes: prev.deepFocusMinutes + 25,
          savedMinutes: prev.savedMinutes + 12,
          productivityScore: 94,
        }));
      }
    }, 2800);
  };

  const stopDemoSimulation = () => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    setDemoModeActive(false);
    setCriticalAlertActive(false);
    setDemoStepText('Simulation Terminated Manual.');
  };

  useEffect(() => {
    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, []);

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
        demoModeActive,
        demoStepText,
        criticalAlertActive,
        setCriticalAlertActive,
        startDemoSimulation,
        stopDemoSimulation,
        releaseTop,
        releaseAll,
        clearQueue,
        deleteQueueItem,
        triggerManualAlert,
        toggleOfflineMode,
        fetchLatestState,

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
      }}>
      {children}
    </ShieldContext.Provider>
  );
}
