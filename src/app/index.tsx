import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  Shield,
  Activity,
  Bell,
  Play,
  Square,
  BarChart2,
  Clock,
  Calendar,
  Zap,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  Keyboard,
  FileCode,
  Laptop,
  CheckCircle2,
  Wifi,
  Database,
  Link,
  User,
  Home,
  Sliders,
  LogOut,
  Info,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Animated components for Reanimated SVG animations
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function HomeScreen() {
  return <DashboardScreen />;
}

import { useShield } from '@/context/ShieldContext';

function DashboardScreen() {
  const {
    focusScore = 0,
    velocity: velocityScore = 0,
    activeActivity = 'Idle',
    typingSpeed = 0,
    codeChanges = 0,
    windowConsistency: windowActivity = 0,
    queue = [],
    notifications = [],
    analytics = {
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
    },
    demoModeActive: isDemoMode = false,
    startDemoSimulation,
    stopDemoSimulation,
    releaseAll,
    criticalAlertActive = false,
    isLoading = false,
  } = useShield() || {};

  const [isFocusMode, setIsFocusMode] = useState(false);

  const clampedFocusScore = typeof focusScore === 'number' && !isNaN(focusScore)
    ? Math.max(0, Math.min(100, focusScore))
    : 0;

  const focusState = clampedFocusScore >= 85 ? 'Deep Focus' : clampedFocusScore >= 75 ? 'Focused' : clampedFocusScore >= 50 ? 'Normal' : clampedFocusScore >= 30 ? 'Distracted' : 'Idle';
  const queueCount = (queue || []).length;
  const notificationsBlocked = (analytics || {}).blockedNotif || 0;
  const criticalAlerts = (analytics || {}).criticalAlerts || 0;
  const deepFocusMins = (analytics || {}).deepFocusMinutes || 0;
  const deepFocusTime = Math.floor(deepFocusMins / 60) + 'h ' + (deepFocusMins % 60) + 'm';
  const productivityScore = (analytics || {}).productivityScore || 0;

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Toast notification for user actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync timeline with notifications block events
  const timeline = useMemo(() => {
    return notifications.slice(0, 4).map((n) => ({
      id: n.id,
      time: n.time,
      title: n.status === 'Critical' ? 'Critical Alert Allowed' : n.status === 'Blocked' ? 'Notification Intercepted' : 'Notification Allowed',
      desc: n.message,
      type: n.status === 'Critical' ? 'warning' : n.status === 'Blocked' ? 'block' : 'success',
    }));
  }, [notifications]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Quick Action Handlers
  const handleToggleFocusMode = () => {
    if (isDemoMode) {
      stopDemoSimulation();
      showToast('Demo Simulation Stopped');
    } else {
      startDemoSimulation();
      showToast('Demo Simulation Started');
    }
  };

  const handleReleaseQueue = () => {
    if (queueCount === 0) {
      showToast('Queue is empty');
      return;
    }
    releaseAll();
    showToast('Attention queue flushed and notifications released');
  };

  const handleRefreshData = () => {
    showToast('Telemetry refreshed from local backend engine');
  };

  // 4. Shared Animation Values
  const pulseOpacity = useSharedValue(0.6);
  const wave1Translation = useSharedValue(0);
  const wave2Translation = useSharedValue(0);
  const waveScaleY = useSharedValue(1);

  // Focus score gauge progress animation
  const focusScoreShared = useSharedValue(85);

  useEffect(() => {
    focusScoreShared.value = withTiming(clampedFocusScore, { duration: 1000, easing: Easing.out(Easing.quad) });
  }, [clampedFocusScore]);

  // Pulsing telemetry glow effect
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  // Continuous Wave horizontal scroll animation
  useEffect(() => {
    wave1Translation.value = withRepeat(
      withTiming(-300, { duration: 7000, easing: Easing.linear }),
      -1,
      false
    );
    wave2Translation.value = withRepeat(
      withTiming(300, { duration: 9000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Wave amplitude adjusts dynamically to focus score (calmer wave for higher score, chaotic for lower score)
  useEffect(() => {
    const targetScale = 1.6 - (clampedFocusScore / 100); // 0.6 (flat/calm) to 1.6 (turbulent)
    waveScaleY.value = withTiming(targetScale, { duration: 1200 });
  }, [clampedFocusScore]);

  // Derived gauge path calculations
  const RADIUS = 70;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  
  const animatedGaugeProps = useAnimatedProps(() => {
    const scoreVal = typeof focusScoreShared.value === 'number' && !isNaN(focusScoreShared.value)
      ? Math.max(0, Math.min(100, focusScoreShared.value))
      : 0;
    const strokeOffset = CIRCUMFERENCE * (1 - scoreVal / 100);
    return {
      strokeDashoffset: strokeOffset,
    };
  });

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const waveContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: waveScaleY.value }],
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: wave1Translation.value }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -wave2Translation.value }],
  }));

  // Helper to determine focus score colors
  const getFocusColors = (score: number) => {
    if (score >= 80) return { primary: '#3B82F6', secondary: '#8B5CF6', text: '#A855F7', label: 'Deep Focus', track: 'rgba(139, 92, 246, 0.15)' };
    if (score >= 60) return { primary: '#06B6D4', secondary: '#3B82F6', text: '#3B82F6', label: 'Focused', track: 'rgba(59, 130, 246, 0.15)' };
    if (score >= 40) return { primary: '#10B981', secondary: '#06B6D4', text: '#10B981', label: 'Normal', track: 'rgba(16, 185, 129, 0.15)' };
    if (score >= 20) return { primary: '#F59E0B', secondary: '#EF4444', text: '#F59E0B', label: 'Distracted', track: 'rgba(245, 158, 11, 0.15)' };
    return { primary: '#EF4444', secondary: '#B91C1C', text: '#EF4444', label: 'Idle', track: 'rgba(239, 68, 68, 0.15)' };
  };

  const focusColors = getFocusColors(clampedFocusScore);

  return (
    <LinearGradient
      colors={['#07080D', '#0F0E23', '#1A0C2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER SECTION */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello, Commander</Text>
            <View style={styles.dateTimeRow}>
              <Clock size={13} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>{currentTime}</Text>
              <Text style={styles.dateDivider}>|</Text>
              <Calendar size={13} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
          </View>

          {/* User Profile Avatar with monitoring status border ring */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              style={styles.avatarBorder}>
              <View style={styles.avatarInner}>
                <User size={22} color="#FFF" />
              </View>
            </LinearGradient>
            {/* Status dot */}
            <AnimatedView style={[styles.statusDot, pulseStyle]} />
          </View>
        </View>

        {/* Global monitoring bar */}
        <View style={styles.monitoringBar}>
          <View style={styles.monitoringIndicator}>
            <View style={[styles.indicatorLight, { backgroundColor: '#10B981' }]} />
            <Text style={styles.monitoringText}>Shield Monitoring Active</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <TouchableOpacity onPress={handleRefreshData} style={styles.syncBtn}>
              <Activity size={14} color="#A855F7" />
              <Text style={styles.syncText}>Sync</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TOAST POPUP */}
        {toastMessage && (
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toastContainer}>
            <Info size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </LinearGradient>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {/* FOCUS SCORE CIRCULAR GAUGE */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Live Focus Score</Text>
            
            <View style={styles.gaugeContainer}>
              <Svg width={180} height={180} viewBox="0 0 160 160">
                <Defs>
                  <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={focusColors.primary} />
                    <Stop offset="100%" stopColor={focusColors.secondary} />
                  </SvgGradient>
                </Defs>
                
                {/* Background Track Circle */}
                <Circle
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="8"
                />
                
                {/* Score highlight glow track */}
                <Circle
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="transparent"
                  stroke={focusColors.track}
                  strokeWidth="16"
                />

                {/* Animated progress circle */}
                <AnimatedCircle
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="transparent"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="10"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  strokeLinecap="round"
                  animatedProps={animatedGaugeProps}
                  transform={`rotate(-90 80 80)`}
                />
              </Svg>

              {/* Gauge central text overlay */}
              <View style={styles.gaugeCenterText}>
                <Text style={styles.gaugeScore}>{Math.round(clampedFocusScore)}</Text>
                <Text style={[styles.gaugeState, { color: focusColors.text }]}>{focusState.toUpperCase()}</Text>
              </View>
            </View>

            {/* Score interpretation */}
            <View style={styles.gaugeFooter}>
              <Shield size={16} color={focusColors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.gaugeFooterText}>
                Current status is <Text style={{ color: focusColors.primary, fontWeight: '700' }}>{focusState}</Text>
              </Text>
            </View>
          </View>

          {/* WEEKLY PROGRESS & DAILY GOAL */}
          <View style={styles.glassCardNoPadding}>
            <View style={styles.waveHeader}>
              <View>
                <Text style={styles.waveTitle}>Weekly Progress</Text>
                <Text style={styles.waveSubtitle}>Tracking your deep work goals</Text>
              </View>
              <TrendingUp size={18} color="#3B82F6" />
            </View>
            <View style={{ padding: 20 }}>
              <View style={styles.progressItem}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Daily Goal Progress</Text>
                  <Text style={styles.progressValue}>{(clampedFocusScore / 100 * 100).toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${clampedFocusScore}%`, backgroundColor: '#3B82F6' }]} />
                </View>
              </View>
            </View>
          </View>



          {/* AI INSIGHT CARD */}
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']}
            style={styles.aiInsightCard}>
            <View style={styles.row}>
              <Sparkles size={18} color="#D946EF" style={{ marginRight: 8 }} />
              <Text style={styles.aiTitle}>Productivity Trend</Text>
            </View>
            <View style={styles.aiMetricsRow}>
              <View style={styles.aiMetricCell}>
                <Text style={styles.aiMetricLabel}>Today's Productivity</Text>
                <Text style={styles.aiMetricVal}>Excellent</Text>
              </View>
              <View style={styles.aiMetricCell}>
                <Text style={styles.aiMetricLabel}>Diverted Interruptions</Text>
                <Text style={styles.aiMetricValPink}>{notificationsBlocked + 12}</Text>
              </View>
            </View>
            <View style={styles.aiDivider} />
            <Text style={styles.aiRecommendationTitle}>Recommendation</Text>
            <Text style={styles.aiRecommendationText}>
              Your deep focus is trending 15% higher than yesterday. Avoid opening communication client suites. We recommend continuing deep focus for another 35 minutes to complete your current task.
            </Text>
          </LinearGradient>

          {/* TODAY'S SUMMARY GRID */}
          <Text style={styles.sectionHeading}>Today's Summary</Text>
          <View style={styles.summaryGrid}>
            
            {/* Card 1 */}
            <View style={styles.summaryGridCard}>
              <Clock size={16} color="#3B82F6" style={{ marginBottom: 8 }} />
              <Text style={styles.gridCardValue}>{deepFocusTime}</Text>
              <Text style={styles.gridCardLabel}>Deep Focus Time</Text>
            </View>

            {/* Card 2 */}
            <View style={styles.summaryGridCard}>
              <Shield size={16} color="#10B981" style={{ marginBottom: 8 }} />
              <Text style={styles.gridCardValue}>{notificationsBlocked}</Text>
              <Text style={styles.gridCardLabel}>Blocked Pings</Text>
            </View>

            {/* Card 3 */}
            <View style={styles.summaryGridCard}>
              <AlertTriangle size={16} color="#EF4444" style={{ marginBottom: 8 }} />
              <Text style={styles.gridCardValue}>{criticalAlerts}</Text>
              <Text style={styles.gridCardLabel}>Allowed Alerts</Text>
            </View>

            {/* Card 4 */}
            <View style={styles.summaryGridCard}>
              <Layers size={16} color="#F59E0B" style={{ marginBottom: 8 }} />
              <Text style={styles.gridCardValue}>{queueCount}</Text>
              <Text style={styles.gridCardLabel}>Queued Logs</Text>
            </View>

            {/* Card 5 - Full Width Grid Card */}
            <View style={[styles.summaryGridCard, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
              <View style={styles.row}>
                <TrendingUp size={20} color="#10B981" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.gridCardLabel}>Overall Productivity Rating</Text>
                  <Text style={styles.productivityStatus}>Above baseline average</Text>
                </View>
              </View>
              <Text style={styles.gridCardLargeValue}>{productivityScore}%</Text>
            </View>

          </View>

          {/* QUICK ACTIONS SECTION */}
          <Text style={styles.sectionHeading}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            
            <TouchableOpacity
              onPress={handleToggleFocusMode}
              style={[styles.actionButton, isDemoMode ? styles.actionActive : styles.actionInactive]}>
              {isDemoMode ? (
                <Square size={16} color="#FFF" style={{ marginRight: 8 }} />
              ) : (
                <Play size={16} color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.actionBtnText}>
                {isDemoMode ? 'Stop Demo' : 'Start Demo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleFocusMode}
              style={[styles.actionButton, isFocusMode ? styles.actionActivePurple : styles.actionInactive]}>
              <Shield size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>
                {isFocusMode ? 'Focus Active' : 'Focus Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReleaseQueue}
              style={[styles.actionButton, styles.actionInactive]}>
              <Layers size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Release Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => showToast('Redirecting to Analytics metrics tab...')}
              style={[styles.actionButton, styles.actionInactive]}>
              <BarChart2 size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>View Analytics</Text>
            </TouchableOpacity>

          </View>



          {/* RECENT ACTIVITY TIMELINE */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Recent Focus Timeline</Text>
            <View style={styles.timelineContainer}>
              {timeline.map((item, index) => (
                <View key={item.id} style={styles.timelineItem}>
                  
                  {/* Left timeline indicators */}
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <View style={styles.timelineLineWrapper}>
                      <View style={[styles.timelineNode, 
                        item.type === 'success' ? styles.nodeSuccess :
                        item.type === 'warning' ? styles.nodeWarning : styles.nodeBlock
                      ]} />
                      {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                  </View>

                  {/* Right timeline details */}
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitleText}>{item.title}</Text>
                    <Text style={styles.timelineDescText}>{item.desc}</Text>
                  </View>

                </View>
              ))}
            </View>
          </View>

          {/* Footer warning */}
          <View style={styles.footerInfo}>
            <CheckCircle2 size={12} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>Cognitive Shield v1.0.0 Enterprise • Secure Sandbox Mode</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dateDivider: {
    color: '#334155',
    marginHorizontal: 8,
    fontSize: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    padding: 2,
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1B4B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0B0C10',
  },
  monitoringBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  monitoringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorLight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  monitoringText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  syncText: {
    color: '#D8B4FE',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 130,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 12,
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
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 150, // Space for floating bottom navigation
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
  glassCardNoPadding: {
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    position: 'relative',
  },
  gaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeScore: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  gaugeState: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: -2,
    letterSpacing: 1.5,
  },
  gaugeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    marginTop: 5,
  },
  gaugeFooterText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  waveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  waveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  waveSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  waveContainer: {
    height: 100,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'flex-end',
  },
  waveOffsetWrapper: {
    width: 800,
    height: 100,
    position: 'absolute',
    bottom: 0,
  },
  waveVector: {
    position: 'absolute',
    bottom: 0,
    width: 800,
    height: 100,
  },
  waveOverlay: {
    position: 'absolute',
    left: 20,
    bottom: 12,
    zIndex: 10,
  },
  waveStateValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  waveStateLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  velocityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  velocityDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeText: {
    color: '#D8B4FE',
    fontSize: 11,
    fontWeight: '800',
  },
  progressItem: {
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  progressValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiInsightCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.2)',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#D946EF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  aiMetricsRow: {
    flexDirection: 'row',
    marginTop: 15,
  },
  aiMetricCell: {
    flex: 1,
  },
  aiMetricLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  aiMetricVal: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  aiMetricValPink: {
    color: '#D946EF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  aiDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  aiRecommendationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D946EF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiRecommendationText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 14,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryGridCard: {
    width: '48%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  gridCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  gridCardLargeValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10B981',
  },
  gridCardLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  productivityStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionActive: {
    backgroundColor: '#EF4444',
    borderColor: '#F87171',
  },
  actionActivePurple: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  actionInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusList: {
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  statusStateOk: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusStateInfo: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '800',
  },
  statusStateWarning: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  statusIndicatorPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  timelineContainer: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    flexDirection: 'row',
    width: 75,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 42,
    textAlign: 'right',
    marginTop: 2,
  },
  timelineLineWrapper: {
    alignItems: 'center',
    width: 33,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#0F0E23',
  },
  nodeSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  nodeWarning: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  nodeBlock: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    top: 16,
    bottom: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 4,
  },
  timelineTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  timelineDescText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  blurFallback: {
    backgroundColor: 'rgba(15, 17, 30, 0.85)',
  },
  bottomTabInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 4,
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#EC4899',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  activeTabIndicator: {
    width: 14,
    height: 3,
    backgroundColor: '#A855F7',
    borderRadius: 1.5,
    position: 'absolute',
    bottom: -6,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
