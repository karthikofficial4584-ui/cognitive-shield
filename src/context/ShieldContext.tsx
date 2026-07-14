import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { setOfflineMode as setApiOfflineMode } from '../services/api';

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
  focusScore: number;
  velocity: number;
  activeActivity: string;
  typingSpeed: number;
  codeChanges: number;
  windowConsistency: number;
  queue: ShieldQueuedItem[];
  notifications: ShieldNotificationItem[];
  analytics: ShieldAnalytics;
  isOffline: boolean;
  isLoading: boolean;
  demoModeActive: boolean;
  demoStepText: string;
  criticalAlertActive: boolean;
  startDemoSimulation: () => void;
  stopDemoSimulation: () => void;
  releaseTop: () => void;
  releaseAll: () => void;
  clearQueue: () => void;
  deleteQueueItem: (id: string) => void;
  triggerManualAlert: (app: any, title: string, message: string, urgency: number) => void;
  toggleOfflineMode: () => void;
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
  // 1. Telemetry State
  const [focusScore, setFocusScore] = useState(88);
  const [velocity, setVelocity] = useState(84);
  const [activeActivity, setActiveActivity] = useState('Deep Focus Coding');
  const [typingSpeed, setTypingSpeed] = useState(74); // normalized WPM
  const [codeChanges, setCodeChanges] = useState(88); // normalized lines changed
  const [windowConsistency, setWindowConsistency] = useState(90); // retention index

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

  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    if (urgency >= 0.90) {
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
        decisionText: `CRITICAL BYPASS: Urgency ${urgency} triggers direct alarm overlay.`,
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
  const releaseTop = () => {
    if (queue.length === 0) return;
    const target = queue[0];
    
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

  const releaseAll = () => {
    if (queue.length === 0) return;
    setQueue(prev => prev.map(item => ({ ...item, status: 'Released' as const })));
    setTimeout(() => {
      setQueue([]);
      setAnalytics(prev => ({
        ...prev,
        releasedNotif: prev.releasedNotif + queue.length,
        queuedNotif: 0,
      }));
    }, 600);
  };

  const clearQueue = () => {
    setQueue([]);
    setAnalytics(prev => ({ ...prev, queuedNotif: 0 }));
  };

  const deleteQueueItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, queuePosition: idx + 1 })));
    setAnalytics(prev => ({
      ...prev,
      queuedNotif: Math.max(0, prev.queuedNotif - 1),
    }));
  };

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
        // Developer starts coding
        setActiveActivity('Coding workspace init');
        setTypingSpeed(45);
        setCodeChanges(25);
        setWindowConsistency(65);
        setVelocity(54);
        setFocusScore(35);
        setDemoStepText('Developer starts coding: Telemetry starts rising');
      } else if (step === 2) {
        // Focus increases
        setTypingSpeed(78);
        setCodeChanges(62);
        setWindowConsistency(88);
        setVelocity(76);
        setFocusScore(54);
        setActiveActivity('Deep Focus sprint');
        setDemoStepText('Coding sprint: Focus score climbs to 54');
      } else if (step === 3) {
        // Focus climbs more
        setFocusScore(72);
        setDemoStepText('Tunnel-vision retention: Focus score reaches 72');
      } else if (step === 4) {
        // Focus reaches 88
        setFocusScore(88);
        setTypingSpeed(86);
        setCodeChanges(94);
        setWindowConsistency(95);
        setVelocity(89);
        setActiveActivity('Deep Flow State');
        setDemoStepText('Peak Deep Focus unlocked (Focus score = 88)');
      } else if (step === 5) {
        // Slack notification arrives
        setDemoStepText('Incoming Alert: Slack ping blocked by gate threshold');
        triggerManualAlert('Slack', 'Dave: Lunch today?', 'Commander! Grab tacos at 12:15?', 0.12);
      } else if (step === 6) {
        // Teams notification arrives
        setDemoStepText('Incoming Alert: MS Teams status update buffered');
        triggerManualAlert('Teams', 'Sarah: Status update', 'Sarah requests sync status update logs.', 0.25);
      } else if (step === 7) {
        // Critical alerts arrives
        setDemoStepText('EMERGENCY CRITICAL BYPASS: RED SYSTEM OVERRIDE');
        triggerManualAlert('PagerDuty', 'ALERT: Production down', 'Red Alert: Main SQL client database connection timeout.', 0.99);
      } else if (step === 8) {
        // Developer stops coding to review alert
        setActiveActivity('Investigating Emergency Alert');
        setTypingSpeed(0);
        setCodeChanges(0);
        setWindowConsistency(100);
        setVelocity(30);
        setDemoStepText('Developer stops coding: focus score begins to decay');
      } else if (step === 9) {
        // Focus decays
        setFocusScore(80);
        setDemoStepText('Decaying focus curve: score drops to 80');
      } else if (step === 10) {
        // Focus score reaches 72 (below 75 unlock point)
        setFocusScore(72);
        setDemoStepText('Focus drops below 75 threshold. Queue auto-unlocks!');
      } else if (step === 11) {
        // Release queued items one by one
        setDemoStepText('Auto-releasing buffered Slack alert to client');
        releaseTop();
      } else if (step === 12) {
        setDemoStepText('Auto-releasing buffered Teams alert to client');
        releaseTop();
      } else if (step >= 13) {
        // Completed
        clearInterval(demoTimerRef.current!);
        setDemoModeActive(false);
        setDemoStepText('Simulation Finished. System stats normalized.');
        
        // Refresh analytics dashboard
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

  return (
    <ShieldContext.Provider
      value={{
        focusScore,
        velocity,
        activeActivity,
        typingSpeed,
        codeChanges,
        windowConsistency,
        queue,
        notifications,
        analytics,
        isOffline,
        isLoading,
        demoModeActive,
        demoStepText,
        criticalAlertActive,
        startDemoSimulation,
        stopDemoSimulation,
        releaseTop,
        releaseAll,
        clearQueue,
        deleteQueueItem,
        triggerManualAlert,
        toggleOfflineMode,
      }}>
      {children}
    </ShieldContext.Provider>
  );
}
