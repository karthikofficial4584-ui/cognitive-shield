import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Shield,
  Activity,
  Bell,
  Search,
  Trash2,
  Archive,
  Check,
  X,
  Star,
  Zap,
  Info,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  User,
  ChevronDown,
  ChevronUp,
  Cpu,
  Mail,
  MessageSquare,
  FileCode,
  GitPullRequest,
  Play,
  Pause,
  RotateCcw,
  Volume2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Reanimated components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function NotificationsRoute() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationCenterScreen />
    </GestureHandlerRootView>
  );
}

// Notification interface
interface NotificationLog {
  id: string;
  sender: string;
  app: 'Slack' | 'Teams' | 'Email' | 'Jira' | 'GitHub' | 'PagerDuty';
  title: string;
  message: string;
  time: string;
  date: 'Today' | 'Yesterday' | 'This Week';
  urgency: number; // 0.0 - 1.0
  focusScore: number; // Focus Score at arrival
  decision: 'Allowed' | 'Blocked' | 'Queued' | 'Critical';
  reason: string;
  queuePosition?: number;
}

import { useShield } from '@/context/ShieldContext';

function NotificationCenterScreen() {
  const {
    focusScore,
    queue,
    notifications: contextNotifications,
    analytics,
    triggerManualAlert,
    releaseTop,
    deleteQueueItem,
  } = useShield();

  // Config parameters
  const urgencyThreshold = 0.5;
  const criticalThreshold = 0.85;

  const notifications = useMemo(() => {
    return contextNotifications.map((n) => {
      let decision: 'Allowed' | 'Blocked' | 'Queued' | 'Critical' = 'Allowed';
      if (n.status === 'Blocked') {
        const isQueued = queue.some(q => q.id === n.id);
        decision = isQueued ? 'Queued' : 'Blocked';
      } else if (n.status === 'Critical') {
        decision = 'Critical';
      }

      const appName = n.sender.toLowerCase().includes('slack') ? 'Slack' :
                    n.sender.toLowerCase().includes('teams') ? 'Teams' :
                    n.sender.toLowerCase().includes('github') ? 'GitHub' :
                    n.sender.toLowerCase().includes('pagerduty') ? 'PagerDuty' :
                    n.sender.toLowerCase().includes('jira') ? 'Jira' : 'Email';

      return {
        id: n.id,
        sender: n.sender,
        app: appName as any,
        title: n.title,
        message: n.message,
        time: n.time,
        date: 'Today' as const,
        urgency: n.urgencyScore,
        focusScore: n.focusScore,
        decision,
        reason: n.decisionText,
        queuePosition: queue.find(q => q.id === n.id)?.queuePosition,
      };
    });
  }, [contextNotifications, queue]);

  // Expansion tracker
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  // Filter chips selection
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Allowed' | 'Blocked' | 'Critical' | 'Queued'>('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'All' | 'Today' | 'This Week'>('All');
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeEngineStep, setActiveEngineStep] = useState<number | null>(null);
  const [simulatedNotification, setSimulatedNotification] = useState<Omit<NotificationLog, 'id' | 'time'> | null>(null);

  // Stats derived state
  const stats = useMemo(() => {
    const todayLogs = notifications.filter(n => n.date === 'Today');
    return {
      allowedToday: todayLogs.filter(n => n.decision === 'Allowed' || n.decision === 'Critical').length,
      blockedToday: todayLogs.filter(n => n.decision === 'Blocked').length,
      criticalAlerts: notifications.filter(n => n.decision === 'Critical').length,
      avgUrgency: !notifications || notifications.length === 0 ? 0 : parseFloat((notifications.reduce((acc, curr) => acc + (curr.urgency ?? 0), 0) / notifications.length).toFixed(2)),
      queueSize: notifications.filter(n => n.decision === 'Queued').length,
    };
  }, [notifications]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 2. Shared animation loops
  const pulseOpacity = useSharedValue(0.6);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Flowchart indicator paths (glow steps)
  const engineStepOpacity = [
    useSharedValue(0.2), // Incoming
    useSharedValue(0.2), // Focus check
    useSharedValue(0.2), // Urgency classification
    useSharedValue(0.2), // Decision Engine
    useSharedValue(0.2), // Final Allowed/Blocked
  ];

  // 3. Search and filter logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // 1. Status Filter
      if (selectedFilter !== 'All' && n.decision !== selectedFilter) return false;

      // 2. Time Filter
      if (selectedTimeFilter !== 'All') {
        if (selectedTimeFilter === 'Today' && n.date !== 'Today') return false;
        if (selectedTimeFilter === 'This Week' && n.date !== 'Today' && n.date !== 'This Week') return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesMessage = n.message.toLowerCase().includes(query);
        const matchesSender = n.sender.toLowerCase().includes(query);
        const matchesDecision = n.decision.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage && !matchesSender && !matchesDecision) return false;
      }

      return true;
    });
  }, [notifications, selectedFilter, selectedTimeFilter, searchQuery]);

  // Expand helper
  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(prev => prev.filter(item => item !== id));
    } else {
      setExpandedIds(prev => [...prev, id]);
    }
  };

  // 4. Swipe Handlers
  const handleArchiveNotification = (id: string) => {
    deleteQueueItem(id);
    showToast('Notification archived successfully');
  };

  const handleReleaseQueuedNotification = (id: string) => {
    releaseTop();
    showToast('Queued notification released to inbox');
  };

  const handleMarkImportant = (id: string) => {
    showToast('Notification marked as important');
  };

  // 5. Simulation Runner
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulationSequence = () => {
    if (isSimulating) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      setIsSimulating(false);
      setActiveEngineStep(null);
      setSimulatedNotification(null);
      showToast('Simulation stopped');
      return;
    }

    setIsSimulating(true);
    showToast('Demo Simulation active - incoming logs every 8s');

    const samplePool: Omit<NotificationLog, 'id' | 'time'>[] = [
      {
        sender: 'Slack',
        app: 'Slack',
        title: 'Team lunch next Friday?',
        message: 'Sarah: Hey Commander, are we on for lunch next Friday or rescheduling?',
        date: 'Today',
        urgency: 0.18,
        focusScore: 92,
        decision: 'Blocked',
        reason: 'Blocked: Urgency (0.18) falls below Deep Focus override threshold (0.75).',
      },
      {
        sender: 'PagerDuty',
        app: 'PagerDuty',
        title: 'ALERT: API Gateway High Latency',
        message: 'System: Endpoint /auth response latency spiked above 1200ms in ap-south.',
        date: 'Today',
        urgency: 0.89,
        focusScore: 92,
        decision: 'Critical',
        reason: 'Allowed as CRITICAL: urgent system metric warning bypasses neural dampeners.',
      },
      {
        sender: 'GitHub',
        app: 'GitHub',
        title: 'Security Vulnerability Alert',
        message: 'Security Audit: Critical patch advisory for yarn dependencies (CVE-2026).',
        date: 'Today',
        urgency: 0.82,
        focusScore: 85,
        decision: 'Allowed',
        reason: 'Allowed: Security advisory priority bypass overrides active filter block.',
      },
      {
        sender: 'Microsoft Teams',
        app: 'Teams',
        title: 'CEO: quick question on Board deck',
        message: 'CEO: Commander, do you have the focus scoring charts ready for the slide pack?',
        date: 'Today',
        urgency: 0.72,
        focusScore: 85,
        decision: 'Queued',
        reason: 'Queued: Urgency (0.72) is high but user is in deep focus. Delayed in cache (#2).',
        queuePosition: 2,
      },
      {
        sender: 'Email',
        app: 'Email',
        title: 'Promo: Upgrade your database server',
        message: 'CloudHost: Upgrade today to save 20% on virtual private compute nodes.',
        date: 'Today',
        urgency: 0.02,
        focusScore: 68,
        decision: 'Blocked',
        reason: 'Blocked: Low urgency marketing alert.',
      },
    ];

    let poolIndex = 0;

    const runStepAnimation = (mockNotif: typeof samplePool[0]) => {
      // Step-by-step pipeline animation
      setSimulatedNotification(mockNotif);
      
      let currentStep = 0;
      setActiveEngineStep(0);

      // Pulse the steps sequentially
      const stepTimer = setInterval(() => {
        currentStep++;
        if (currentStep < 5) {
          setActiveEngineStep(currentStep);
          // Animate opacity of active step
          engineStepOpacity[currentStep].value = 0.2;
          engineStepOpacity[currentStep].value = withTiming(1, { duration: 300 });
        } else {
          clearInterval(stepTimer);
          
          // Complete pipeline logic - append notification to centralized list!
          triggerManualAlert(mockNotif.app, mockNotif.title, mockNotif.message, mockNotif.urgency);
          setActiveEngineStep(null);
          setSimulatedNotification(null);
          showToast(`Intercepted Alert Logged`);
        }
      }, 1000);
    };

    // Run first immediately
    runStepAnimation(samplePool[poolIndex]);
    poolIndex = (poolIndex + 1) % samplePool.length;

    // Tick every 8 seconds
    simulationIntervalRef.current = setInterval(() => {
      runStepAnimation(samplePool[poolIndex]);
      poolIndex = (poolIndex + 1) % samplePool.length;
    }, 8000);
  };

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  const handleReleaseAllQueue = () => {
    if (queue.length === 0) {
      showToast('Queue is empty');
      return;
    }
    releaseTop();
    showToast(`Released notifications to inbox`);
  };

  // Reusable BADGE colors helper
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Allowed': return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10B981', label: 'ALLOWED' };
      case 'Blocked': return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', text: '#EF4444', label: 'BLOCKED' };
      case 'Queued': return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', text: '#F59E0B', label: 'QUEUED' };
      default: return { bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.35)', text: '#C084FC', label: 'CRITICAL' };
    }
  };

  const getAppIcon = (app: string) => {
    switch (app) {
      case 'Slack': return <MessageSquare size={16} color="#FFF" />;
      case 'Teams': return <Volume2 size={16} color="#FFF" />;
      case 'GitHub': return <GitPullRequest size={16} color="#FFF" />;
      case 'PagerDuty': return <AlertTriangle size={16} color="#FFF" />;
      case 'Jira': return <FileCode size={16} color="#FFF" />;
      default: return <Mail size={16} color="#FFF" />;
    }
  };

  return (
    <LinearGradient
      colors={['#07080D', '#0F0E23', '#1A0C2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        
        {/* TOP HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Notification Center</Text>
            <View style={styles.monitoringRow}>
              <AnimatedView style={[styles.indicatorLight, pulseStyle, { backgroundColor: '#10B981' }]} />
              <Text style={styles.monitoringText}>Live Shield Active</Text>
            </View>
          </View>

          {/* Stats quick displays */}
          <View style={styles.headerMetricsRow}>
            <View style={styles.headerMetricBadge}>
              <Sparkles size={11} color="#A855F7" style={{ marginRight: 4 }} />
              <Text style={styles.badgeLabel}>Focus: 85</Text>
            </View>
            <View style={[styles.headerMetricBadge, { marginLeft: 8 }]}>
              <Layers size={11} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.badgeLabel}>Queue: {stats.queueSize}</Text>
            </View>
          </View>
        </View>

        {/* TOAST POPUP */}
        {toastMessage && (
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toastContainer}>
            <Info size={14} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </LinearGradient>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {/* AI DECISION ENGINE CARD (VISUAL PIPELINE) */}
          <View style={styles.glassCard}>
            <View style={styles.engineHeader}>
              <View style={styles.row}>
                <Cpu size={16} color="#A855F7" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>AI Decision Shield Pipeline</Text>
              </View>
              {isSimulating && (
                <View style={styles.simRunningBadge}>
                  <Text style={styles.simRunningText}>PIPELINE ACTIVE</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.engineDesc}>
              Incoming alerts traverse cognitive filters. Higher Focus Scores enforce stricter blocking.
            </Text>

            {/* Visual Flow chart */}
            <View style={styles.flowchartContainer}>
              
              {/* Step 1: Input */}
              <View style={[styles.flowchartNode, 
                activeEngineStep === 0 ? styles.nodeGlowBlue : null
              ]}>
                <Bell size={13} color={activeEngineStep === 0 ? '#3B82F6' : '#94A3B8'} />
                <Text style={[styles.flowLabel, activeEngineStep === 0 ? styles.textActive : null]}>INCOMING</Text>
              </View>

              <ArrowRight size={12} color="rgba(255,255,255,0.2)" />

              {/* Step 2: Focus Check */}
              <View style={[styles.flowchartNode, 
                activeEngineStep === 1 ? styles.nodeGlowViolet : null
              ]}>
                <Activity size={13} color={activeEngineStep === 1 ? '#8B5CF6' : '#94A3B8'} />
                <Text style={[styles.flowLabel, activeEngineStep === 1 ? styles.textActive : null]}>FOCUS CHECK</Text>
              </View>

              <ArrowRight size={12} color="rgba(255,255,255,0.2)" />

              {/* Step 3: Classification */}
              <View style={[styles.flowchartNode, 
                activeEngineStep === 2 ? styles.nodeGlowPink : null
              ]}>
                <Sparkles size={13} color={activeEngineStep === 2 ? '#D946EF' : '#94A3B8'} />
                <Text style={[styles.flowLabel, activeEngineStep === 2 ? styles.textActive : null]}>URGENCY</Text>
              </View>

              <ArrowRight size={12} color="rgba(255,255,255,0.2)" />

              {/* Step 4: Decision */}
              <View style={[styles.flowchartNode, 
                activeEngineStep === 3 ? styles.nodeGlowAmber : null
              ]}>
                <Cpu size={13} color={activeEngineStep === 3 ? '#F59E0B' : '#94A3B8'} />
                <Text style={[styles.flowLabel, activeEngineStep === 3 ? styles.textActive : null]}>ENGINE</Text>
              </View>

              <ArrowRight size={12} color="rgba(255,255,255,0.2)" />

              {/* Step 5: Final Result */}
              <View style={[styles.flowchartNode, 
                activeEngineStep === 4 ? (
                  simulatedNotification?.decision === 'Blocked' ? styles.nodeGlowRed : styles.nodeGlowGreen
                ) : null
              ]}>
                <Shield size={13} color={activeEngineStep === 4 ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.flowLabel, activeEngineStep === 4 ? styles.textActive : null]}>OUTCOME</Text>
              </View>

            </View>

            {/* Display active pipeline simulation details */}
            {activeEngineStep !== null && simulatedNotification && (
              <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                style={styles.engineLogsBox}>
                <Text style={styles.engineLogsTitle}>PIPELINE PROCESS LOGS</Text>
                
                {activeEngineStep >= 0 && (
                  <Text style={styles.logText}>• [Incoming] App: {simulatedNotification.sender} | Title: "{simulatedNotification.title}"</Text>
                )}
                {activeEngineStep >= 1 && (
                  <Text style={styles.logText}>• [Focus Check] Current Focus Score threshold: {simulatedNotification.focusScore}</Text>
                )}
                {activeEngineStep >= 2 && (
                  <Text style={styles.logText}>• [Urgency Rating] Calculated Urgency Weight: {simulatedNotification.urgency} / 1.0</Text>
                )}
                {activeEngineStep >= 3 && (
                  <Text style={styles.logText}>• [Engine Rules] Filter rule evaluating parameters...</Text>
                )}
                {activeEngineStep >= 4 && (
                  <Text style={[styles.logText, { color: simulatedNotification.decision === 'Blocked' ? '#EF4444' : '#10B981', fontWeight: '700' }]}>
                    • [Outcome] DECISION: {simulatedNotification.decision.toUpperCase()} | {simulatedNotification.reason}
                  </Text>
                )}
              </LinearGradient>
            )}

          </View>

          {/* STATISTICS GRID */}
          <View style={styles.statsGrid}>
            
            <View style={styles.statCard}>
              <Check size={14} color="#10B981" />
              <Text style={styles.statVal}>{stats.allowedToday}</Text>
              <Text style={styles.statLabel}>Allowed Today</Text>
            </View>

            <View style={styles.statCard}>
              <X size={14} color="#EF4444" />
              <Text style={styles.statVal}>{stats.blockedToday}</Text>
              <Text style={styles.statLabel}>Blocked Today</Text>
            </View>

            <View style={styles.statCard}>
              <AlertTriangle size={14} color="#A855F7" />
              <Text style={styles.statVal}>{stats.criticalAlerts}</Text>
              <Text style={styles.statLabel}>Critical Alerts</Text>
            </View>

            <View style={styles.statCard}>
              <Zap size={14} color="#06B6D4" />
              <Text style={styles.statVal}>{stats.avgUrgency}</Text>
              <Text style={styles.statLabel}>Avg Urgency</Text>
            </View>

            <View style={[styles.statCard, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 }]}>
              <View style={styles.row}>
                <Layers size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.statLabel}>Active Queued Notifications Cache</Text>
              </View>
              <Text style={styles.statValOrange}>{stats.queueSize} items</Text>
            </View>

          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#64748B" style={{ marginLeft: 12, marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search App, priority, content keyword..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />
            {searchQuery.trim() !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 12 }}>
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTERS (CHIPS) */}
          <View style={styles.filterWrapper}>
            <Text style={styles.filterSectionTitle}>Status Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
              
              <TouchableOpacity
                onPress={() => setSelectedFilter('All')}
                style={[styles.filterChip, selectedFilter === 'All' ? styles.chipActiveBlue : styles.chipInactive]}>
                <Text style={[styles.chipText, selectedFilter === 'All' ? styles.textActive : null]}>All ({notifications.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedFilter('Allowed')}
                style={[styles.filterChip, selectedFilter === 'Allowed' ? styles.chipActiveGreen : styles.chipInactive]}>
                <Text style={[styles.chipText, selectedFilter === 'Allowed' ? styles.textActive : null]}>
                  Allowed ({notifications.filter(n => n.decision === 'Allowed').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedFilter('Blocked')}
                style={[styles.filterChip, selectedFilter === 'Blocked' ? styles.chipActiveRed : styles.chipInactive]}>
                <Text style={[styles.chipText, selectedFilter === 'Blocked' ? styles.textActive : null]}>
                  Blocked ({notifications.filter(n => n.decision === 'Blocked').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedFilter('Queued')}
                style={[styles.filterChip, selectedFilter === 'Queued' ? styles.chipActiveOrange : styles.chipInactive]}>
                <Text style={[styles.chipText, selectedFilter === 'Queued' ? styles.textActive : null]}>
                  Queued ({notifications.filter(n => n.decision === 'Queued').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedFilter('Critical')}
                style={[styles.filterChip, selectedFilter === 'Critical' ? styles.chipActivePurple : styles.chipInactive]}>
                <Text style={[styles.chipText, selectedFilter === 'Critical' ? styles.textActive : null]}>
                  Critical ({notifications.filter(n => n.decision === 'Critical').length})
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>

          <View style={styles.filterWrapper}>
            <Text style={styles.filterSectionTitle}>Time Frame</Text>
            <View style={styles.timeFilterRow}>
              
              <TouchableOpacity
                onPress={() => setSelectedTimeFilter('All')}
                style={[styles.timeChip, selectedTimeFilter === 'All' ? styles.timeChipActive : null]}>
                <Text style={[styles.timeChipText, selectedTimeFilter === 'All' ? styles.timeChipTextActive : null]}>Any Time</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTimeFilter('Today')}
                style={[styles.timeChip, selectedTimeFilter === 'Today' ? styles.timeChipActive : null]}>
                <Text style={[styles.timeChipText, selectedTimeFilter === 'Today' ? styles.timeChipTextActive : null]}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTimeFilter('This Week')}
                style={[styles.timeChip, selectedTimeFilter === 'This Week' ? styles.timeChipActive : null]}>
                <Text style={[styles.timeChipText, selectedTimeFilter === 'This Week' ? styles.timeChipTextActive : null]}>This Week</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* NOTIFICATION LOGS LIST */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionHeading}>Filtered Logs ({filteredNotifications.length})</Text>
            <Text style={styles.swipeTipText}>Swipe Left to Delete • Swipe Right to Release/Star</Text>
          </View>

          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={24} color="#64748B" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No notifications match your current filter settings.</Text>
            </View>
          ) : (
            filteredNotifications.map((item) => {
              const isExpanded = expandedIds.includes(item.id);
              const badge = getDecisionBadge(item.decision);
              
              return (
                <SwipeableNotificationCard
                  key={item.id}
                  onSwipeLeft={() => handleArchiveNotification(item.id)}
                  onSwipeRight={() => {
                    if (item.decision === 'Queued') {
                      handleReleaseQueuedNotification(item.id);
                    } else {
                      handleMarkImportant(item.id);
                    }
                  }}>
                  
                  {/* Actual card UI */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(item.id)}
                    style={[styles.notifCard, 
                      item.decision === 'Allowed' ? styles.cardBorderAllowed :
                      item.decision === 'Blocked' ? styles.cardBorderBlocked :
                      item.decision === 'Queued' ? styles.cardBorderQueued : styles.cardBorderCritical
                    ]}>
                    
                    {/* Top line */}
                    <View style={styles.cardHeader}>
                      <View style={styles.row}>
                        <LinearGradient
                          colors={['#1E1B4B', '#311042']}
                          style={styles.appIconWrapper}>
                          {getAppIcon(item.app)}
                        </LinearGradient>
                        <View>
                          <Text style={styles.cardSourceText}>{item.sender}</Text>
                          <Text style={styles.cardTimeText}>{item.time} • {item.date}</Text>
                        </View>
                      </View>

                      {/* Decision Badges */}
                      <View style={[styles.badgeContainer, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    {/* Content line */}
                    <Text style={styles.cardTitleText}>{item.title}</Text>
                    <Text style={styles.cardMsgText} numberOfLines={isExpanded ? undefined : 2}>
                      {item.message}
                    </Text>

                    {/* Summary ratings line */}
                    <View style={styles.cardSummaryRow}>
                      <View style={styles.row}>
                        <Zap size={11} color="#06B6D4" style={{ marginRight: 4 }} />
                        <Text style={styles.cardMetricText}>Urgency: {item.urgency}</Text>
                      </View>
                      <View style={[styles.row, { marginLeft: 12 }]}>
                        <Activity size={11} color="#A855F7" style={{ marginRight: 4 }} />
                        <Text style={styles.cardMetricText}>Focus: {item.focusScore}</Text>
                      </View>
                      {item.queuePosition && (
                        <View style={[styles.row, { marginLeft: 12 }]}>
                          <Layers size={11} color="#F59E0B" style={{ marginRight: 4 }} />
                          <Text style={styles.queuePosText}>Pos: #{item.queuePosition}</Text>
                        </View>
                      )}
                      
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {isExpanded ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                      </View>
                    </View>

                    {/* EXPANDABLE DETAILS AREA */}
                    {isExpanded && (
                      <AnimatedView style={styles.expandedDetails}>
                        <View style={styles.expandedDivider} />
                        
                        <Text style={styles.expandedHeading}>AI FILTER ANALYSIS</Text>
                        <Text style={styles.expandedReasonText}>{item.reason}</Text>

                        {/* Formula details */}
                        <View style={styles.mathExplanationBox}>
                          <Text style={styles.mathExpHeader}>Mathematical Filter Logic</Text>
                          <Text style={styles.mathExpCode}>
                            Urgency ({item.urgency}) {item.decision === 'Blocked' || item.decision === 'Queued' ? '<' : '≥'} FocusFactor ({(item.focusScore / 100).toFixed(2)})²
                          </Text>
                          <Text style={styles.mathExpCode}>
                            Decision = {item.decision.toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.expandedTimelineRow}>
                          <View style={styles.timelineItemCell}>
                            <Text style={styles.cellLabel}>Arrival Time</Text>
                            <Text style={styles.cellVal}>{item.time}:02</Text>
                          </View>
                          <View style={styles.timelineItemCell}>
                            <Text style={styles.cellLabel}>Bypass Rules</Text>
                            <Text style={styles.cellVal}>
                              {item.decision === 'Critical' ? 'EMERGENCY FORCE' : 'STANDARD EVAL'}
                            </Text>
                          </View>
                        </View>

                        {item.decision === 'Queued' && (
                          <TouchableOpacity
                            onPress={() => handleReleaseQueuedNotification(item.id)}
                            style={styles.expandedReleaseBtn}>
                            <Check size={14} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={styles.releaseBtnText}>Release Queue to Inbox</Text>
                          </TouchableOpacity>
                        )}

                      </AnimatedView>
                    )}

                  </TouchableOpacity>
                </SwipeableNotificationCard>
              );
            })
          )}

          {/* Footer details */}
          <View style={styles.footerWarning}>
            <Clock size={11} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.footerWarningText}>Shield active logs are cached locally in safe sandbox mode</Text>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* FLOATING ACTION ACTION GRID (FAB) */}
      <View style={styles.floatingActionArea}>
        
        {/* Simulation trigger */}
        <TouchableOpacity
          onPress={startSimulationSequence}
          style={[styles.floatingActionBtn, isSimulating ? styles.fabActiveRed : styles.fabInactive]}>
          {isSimulating ? (
            <Pause size={18} color="#FFF" />
          ) : (
            <Play size={18} color="#FFF" />
          )}
          <Text style={styles.fabLabelText}>
            {isSimulating ? 'Pause Sim' : 'Sim Mode'}
          </Text>
        </TouchableOpacity>

        {/* Release all trigger */}
        <TouchableOpacity
          onPress={handleReleaseAllQueue}
          style={[styles.floatingActionBtn, styles.fabInactive, { marginLeft: 10 }]}>
          <Layers size={18} color="#FFF" />
          <Text style={styles.fabLabelText}>Flush Queue</Text>
        </TouchableOpacity>

      </View>

    </LinearGradient>
  );
}

// Swipeable Component Wrapper using GestureDetector
interface SwipeableWrapperProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

function SwipeableNotificationCard({ children, onSwipeLeft, onSwipeRight }: SwipeableWrapperProps) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // trigger dragging only on horizontal shifts to prevent scroll lock
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -130) {
        translateX.value = withTiming(-width, {}, () => {
          runOnJS(onSwipeLeft)();
          translateX.value = 0;
        });
      } else if (event.translationX > 130) {
        translateX.value = withTiming(width, {}, () => {
          runOnJS(onSwipeRight)();
          translateX.value = 0;
        });
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftOpacity = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));

  const rightOpacity = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  return (
    <View style={styles.swipeContainer}>
      
      {/* Background action elements */}
      <AnimatedView style={[styles.swipeBackdropLeft, leftOpacity]}>
        <View style={styles.backdropInnerLeft}>
          <Check size={16} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.backdropText}>Release / Star</Text>
        </View>
      </AnimatedView>

      <AnimatedView style={[styles.swipeBackdropRight, rightOpacity]}>
        <View style={styles.backdropInnerRight}>
          <Text style={styles.backdropText}>Archive / Delete</Text>
          <Trash2 size={16} color="#FFF" style={{ marginLeft: 6 }} />
        </View>
      </AnimatedView>

      <GestureDetector gesture={panGesture}>
        <AnimatedView style={[styles.swipeContentWrapper, animatedStyle]}>
          {children}
        </AnimatedView>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 15,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  monitoringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  indicatorLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  monitoringText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  headerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeLabel: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 120,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130, // Past float buttons
  },
  glassCard: {
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  engineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  simRunningBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  simRunningText: {
    color: '#C084FC',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  engineDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  flowchartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  flowchartNode: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  flowLabel: {
    fontSize: 7.5,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 4,
  },
  nodeGlowBlue: { borderColor: '#3B82F6', shadowColor: '#3B82F6', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  nodeGlowViolet: { borderColor: '#8B5CF6', shadowColor: '#8B5CF6', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  nodeGlowPink: { borderColor: '#D946EF', shadowColor: '#D946EF', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(217, 70, 239, 0.1)' },
  nodeGlowAmber: { borderColor: '#F59E0B', shadowColor: '#F59E0B', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  nodeGlowGreen: { borderColor: '#10B981', shadowColor: '#10B981', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  nodeGlowRed: { borderColor: '#EF4444', shadowColor: '#EF4444', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  textActive: { color: '#FFF' },
  engineLogsBox: {
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  engineLogsTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A855F7',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  logText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 14,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '23%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  statValOrange: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    paddingRight: 10,
  },
  filterWrapper: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  filterChipsScroll: {
    paddingBottom: 4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
  },
  chipActiveBlue: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' },
  chipActiveGreen: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  chipActiveRed: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)' },
  chipActiveOrange: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.25)' },
  chipActivePurple: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' },
  chipInactive: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' },
  chipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  timeFilterRow: {
    flexDirection: 'row',
  },
  timeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
  },
  timeChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#C084FC',
  },
  timeChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  timeChipTextActive: {
    color: '#FFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  swipeTipText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: 'rgba(20, 22, 38, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  swipeContentWrapper: {
    zIndex: 5,
  },
  swipeBackdropLeft: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#10B981',
    borderRadius: 20,
    justifyContent: 'center',
    paddingLeft: 20,
    zIndex: 1,
  },
  swipeBackdropRight: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    zIndex: 1,
  },
  backdropInnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backdropInnerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backdropText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notifCard: {
    backgroundColor: 'rgba(20, 22, 38, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cardBorderAllowed: { borderColor: 'rgba(16, 185, 129, 0.15)', borderLeftWidth: 4, borderLeftColor: '#10B981' },
  cardBorderBlocked: { borderColor: 'rgba(239, 68, 68, 0.12)', borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  cardBorderQueued: { borderColor: 'rgba(245, 158, 11, 0.12)', borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  cardBorderCritical: { borderColor: 'rgba(168, 85, 247, 0.18)', borderLeftWidth: 4, borderLeftColor: '#A855F7' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSourceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cardTimeText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTitleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardMsgText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
  },
  cardMetricText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  queuePosText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '800',
  },
  expandedDetails: {
    marginTop: 8,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  expandedHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A855F7',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  expandedReasonText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    fontWeight: '500',
  },
  mathExplanationBox: {
    backgroundColor: '#090A0F',
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mathExpHeader: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    marginBottom: 4,
  },
  mathExpCode: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    marginBottom: 2,
  },
  expandedTimelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  timelineItemCell: {
    flex: 1,
  },
  cellLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  cellVal: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
    marginTop: 2,
  },
  expandedReleaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  releaseBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  footerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  footerWarningText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  floatingActionArea: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 999,
  },
  floatingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  fabActiveRed: {
    backgroundColor: '#EF4444',
    borderColor: '#F87171',
  },
  fabInactive: {
    backgroundColor: '#1E1B4B',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fabLabelText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
