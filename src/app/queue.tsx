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
  runOnJS,
  LinearTransition,
  FadeInUp,
  FadeOutRight,
} from 'react-native-reanimated';
import {
  Shield,
  Activity,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  User,
  Sliders,
  Check,
  X,
  ChevronRight,
  Info,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp,
  Database,
  Link,
  Wifi,
  Mail,
  MessageSquare,
  FileCode,
  Volume2,
  GitPullRequest,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Reanimated custom components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function QueueRoute() {
  return <QueueManagerScreen />;
}

// Queued item structure
interface QueuedItem {
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

import { useShield } from '@/context/ShieldContext';

function QueueManagerScreen() {
  const {
    focusScore,
    queue,
    analytics,
    demoModeActive: isSimulating,
    startDemoSimulation,
    stopDemoSimulation,
    releaseTop,
    releaseAll,
    clearQueue,
    deleteQueueItem,
    isQueuePaused,
    togglePauseQueue,
  } = useShield();

  const releaseThreshold = 75;

  // 1. Core States
  const [selectedItemId, setSelectedItemId] = useState<string>('1');

  // Stats derived state
  const stats = useMemo(() => {
    return {
      avgWaitTime: queue.length > 0 ? `${queue.length * 3 + 2} mins` : '0 mins',
      longestWait: queue.length > 0 ? `${queue.length * 5} mins` : '0 mins',
      currentQueue: queue.length,
      releasedToday: analytics.releasedNotif,
      savedInterruptions: analytics.switchesPrevented,
    };
  }, [queue, analytics]);

  const selectedItem = useMemo(() => {
    return queue.find(item => item.id === selectedItemId) || queue[0];
  }, [queue, selectedItemId]);

  // Success checklist trigger (all items released)
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Derive status
  const queueStatus = queue.length === 0 ? 'Empty' : (focusScore < 75 ? 'Releasing' : 'Locked');

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

  // 3. Queue Release Logic & Simulation
  const handleReleaseOne = () => {
    if (queue.length === 0) {
      showToast('Queue is empty');
      return;
    }
    const targetItem = queue[0];
    showToast(`Released: ${targetItem.sender}`);
    releaseTop();
  };

  const handleReleaseAll = () => {
    if (queue.length === 0) {
      showToast('Queue is empty');
      return;
    }
    showToast(`Releasing all ${queue.length} notifications...`);
    releaseAll();
    setTimeout(() => {
      setShowSuccessAnim(true);
    }, 600);
  };

  const handleClearQueue = () => {
    if (queue.length === 0) {
      showToast('Queue is empty');
      return;
    }
    clearQueue();
    showToast('Queue cleared successfully');
  };

  const handleDeleteItem = (id: string) => {
    deleteQueueItem(id);
    showToast('Notification deleted from queue');
  };

  const handleTogglePauseQueue = () => {
    togglePauseQueue();
    if (!isQueuePaused) {
      showToast('Queue Locked manually');
    } else {
      showToast('Queue Resumed');
    }
  };

  const startSimulationSequence = () => {
    if (isSimulating) {
      stopDemoSimulation();
      showToast('Simulation stopped');
    } else {
      setShowSuccessAnim(false);
      startDemoSimulation();
      showToast('Simulation started - Focus level dropping');
    }
  };

  const handleResetQueue = () => {
    stopDemoSimulation();
    setShowSuccessAnim(false);
    showToast('Queue reset complete');
  };

  // Reusable badge color picker
  const getQueueStatusGlow = (status: string) => {
    if (isQueuePaused) return { color: '#EF4444', label: 'QUEUE PAUSED', bg: 'rgba(239, 68, 68, 0.15)' };
    switch (status) {
      case 'Locked': return { color: '#F59E0B', label: 'QUEUE LOCKED', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'Releasing': return { color: '#10B981', label: 'RELEASING', bg: 'rgba(16, 185, 129, 0.15)' };
      default: return { color: '#3B82F6', label: 'EMPTY', bg: 'rgba(59, 130, 246, 0.15)' };
    }
  };

  const statusGlow = getQueueStatusGlow(queueStatus);

  const getAppIcon = (app: string) => {
    switch (app) {
      case 'Slack': return <MessageSquare size={14} color="#FFF" />;
      case 'Teams': return <Volume2 size={14} color="#FFF" />;
      case 'GitHub': return <GitPullRequest size={14} color="#FFF" />;
      case 'PagerDuty': return <AlertTriangle size={14} color="#FFF" />;
      case 'Jira': return <FileCode size={14} color="#FFF" />;
      default: return <Mail size={14} color="#FFF" />;
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
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Attention Queue</Text>
            <Text style={styles.headerSubtitle}>Intelligent buffer manager for distracted states</Text>
          </View>

          {/* Status badges */}
          <View style={styles.headerRight}>
            <View style={styles.headerStatBadge}>
              <Zap size={11} color="#A855F7" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>Focus: {focusScore}</Text>
            </View>
            <View style={[styles.headerStatBadge, { marginLeft: 8 }]}>
              <Layers size={11} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>Size: {queue.length}</Text>
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

          {/* LOCK STATUS PANEL */}
          <View style={styles.glassCard}>
            <View style={styles.lockRow}>
              
              {/* Left description */}
              <View style={styles.row}>
                <View style={styles.lockIconWrapper}>
                  {queueStatus === 'Locked' || isQueuePaused ? (
                    <Lock size={20} color={isQueuePaused ? '#EF4444' : '#F59E0B'} />
                  ) : (
                    <Unlock size={20} color="#10B981" />
                  )}
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.lockStateTitle}>Gate Access Status</Text>
                  <View style={styles.row}>
                    <AnimatedView style={[styles.lockStatusDot, pulseStyle, { backgroundColor: statusGlow.color }]} />
                    <Text style={[styles.lockStatusText, { color: statusGlow.color }]}>{statusGlow.label}</Text>
                  </View>
                </View>
              </View>

              {/* Right score display */}
              <View style={styles.lockScoreCol}>
                <Text style={styles.lockScoreVal}>{focusScore}</Text>
                <Text style={styles.lockScoreLabel}>FOCUS SCORE</Text>
              </View>

            </View>

            {/* Threshold progress bar */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressRowLabels}>
                <Text style={styles.progressLabel}>Auto Release Threshold (75 Score)</Text>
                <Text style={styles.progressValue}>{focusScore} / 100</Text>
              </View>
              <View style={styles.progressBarBg}>
                {/* Visual line marker representing the 75 threshold */}
                <View style={[styles.progressBarFill, { width: `${focusScore}%`, backgroundColor: focusScore > 75 ? '#F59E0B' : '#10B981' }]} />
                <View style={styles.thresholdMarker} />
              </View>
            </View>

          </View>

          {/* SIMULATION AUTO RELEASE PANEL */}
          <View style={styles.glassCard}>
            <View style={styles.engineHeader}>
              <View style={styles.row}>
                <Sparkles size={16} color="#A855F7" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Auto-Release Simulation Engine</Text>
              </View>
              {isSimulating && (
                <View style={styles.simBadge}>
                  <Text style={styles.simBadgeText}>AUTO PIPELINE RUNNING</Text>
                </View>
              )}
            </View>
            <Text style={styles.engineDesc}>
              Demonstrates automatic unlocking when Focus Score decays due to user task switching or context breaks.
            </Text>

            <View style={styles.simFlowchart}>
              <View style={[styles.flowNode, focusScore === 88 ? styles.flowNodeActiveBlue : null]}>
                <Text style={styles.flowNodeScore}>88</Text>
                <Text style={styles.flowNodeLabel}>Focused</Text>
              </View>
              <ArrowRight size={12} color="rgba(255,255,255,0.2)" />
              <View style={[styles.flowNode, focusScore === 82 ? styles.flowNodeActiveBlue : null]}>
                <Text style={styles.flowNodeScore}>82</Text>
                <Text style={styles.flowNodeLabel}>Context Shift</Text>
              </View>
              <ArrowRight size={12} color="rgba(255,255,255,0.2)" />
              <View style={[styles.flowNode, focusScore <= 74 ? styles.flowNodeActiveGreen : null]}>
                <Text style={styles.flowNodeScore}>74</Text>
                <Text style={styles.flowNodeLabel}>Release Point</Text>
              </View>
            </View>

            {/* Sim Control Buttons */}
            <View style={styles.simButtonsRow}>
              
              <TouchableOpacity
                onPress={startSimulationSequence}
                style={[styles.btnSim, isSimulating ? styles.btnSimActive : styles.btnSimInactive]}>
                {isSimulating ? (
                  <>
                    <Pause size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnSimText}>Stop Auto Sim</Text>
                  </>
                ) : (
                  <>
                    <Play size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnSimText}>Start Auto Sim</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetQueue}
                style={[styles.btnSim, styles.btnOutline]}>
                <RotateCcw size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnSimText}>Reset Queue</Text>
              </TouchableOpacity>

            </View>

          </View>

          {/* QUEUE CONTROL BUTTONS */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Queue Manual Override</Text>
            <Text style={styles.controlDesc}>
              Bypass automatic decay rules and release or clear cache values immediately.
            </Text>

            <View style={styles.manualButtonsRow}>
              
              <TouchableOpacity
                onPress={handleReleaseOne}
                style={styles.manualBtn}>
                <Check size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.manualBtnText}>Release Top</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReleaseAll}
                style={styles.manualBtn}>
                <Layers size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.manualBtnText}>Release All</Text>
              </TouchableOpacity>

            </View>

            <View style={[styles.manualButtonsRow, { marginTop: 12 }]}>
              
              <TouchableOpacity
                onPress={handleTogglePauseQueue}
                style={[styles.manualBtnAction, isQueuePaused ? styles.btnActionActive : styles.btnActionInactive]}>
                <Pause size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.manualBtnText}>{isQueuePaused ? 'Resume Lock' : 'Pause Lock'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearQueue}
                style={[styles.manualBtnAction, styles.btnActionClear]}>
                <Trash2 size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.manualBtnText}>Clear Queue</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* AI RECOMMENDATION BOX */}
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.12)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.aiCard}>
            <View style={styles.row}>
              <Sparkles size={16} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.aiTitle}>AI Shield Queue Recommendation</Text>
            </View>
            <Text style={styles.aiText}>
              Queue will automatically release after focus score drops below 75. Based on typing cadence trend, the estimated auto-release is in <Text style={{ color: '#F59E0B', fontWeight: '800' }}>6 minutes</Text>. We recommend ignoring Slack pings until then.
            </Text>
          </LinearGradient>

          {/* VISUAL VERTICAL QUEUE */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionHeading}>Buffered Queue List ({queue.length})</Text>
            <Text style={styles.sectionSub}>Tapping a card displays lifetime timeline status below</Text>
          </View>

          {showSuccessAnim && (
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.successContainer}>
              <CheckCircle2 size={24} color="#10B981" style={{ marginBottom: 6 }} />
              <Text style={styles.successTitle}>QUEUE FLUSHED SUCCESSFULLY</Text>
              <Text style={styles.successText}>All buffered notifications delivered to target client suites.</Text>
            </LinearGradient>
          )}

          {queue.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Layers size={24} color="#64748B" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>Attention queue is empty. Shield is monitoring workspace.</Text>
            </View>
          ) : (
            <View style={styles.queueCardList}>
              {queue.map((item) => (
                <AnimatedView
                  key={item.id}
                  entering={FadeInUp.duration(400)}
                  exiting={FadeOutRight.duration(300)}
                  layout={LinearTransition.springify()}>
                  
                  <TouchableOpacity
                    onPress={() => setSelectedItemId(item.id)}
                    style={[styles.queueCard, 
                      selectedItemId === item.id ? styles.queueCardActive : styles.queueCardInactive,
                      item.status === 'Released' ? styles.queueCardReleased : null
                    ]}>
                    
                    {/* Top row */}
                    <View style={styles.cardHeader}>
                      <View style={styles.row}>
                        <LinearGradient
                          colors={['#1E1B4B', '#3B0764']}
                          style={styles.appIconBorder}>
                          {getAppIcon(item.app)}
                        </LinearGradient>
                        <View>
                          <Text style={styles.cardSenderText}>{item.sender}</Text>
                          <Text style={styles.cardTimeText}>Received: {item.timeReceived}</Text>
                        </View>
                      </View>

                      {/* Queue position badge */}
                      <View style={styles.queuePosBadge}>
                        <Text style={styles.queuePosText}>#{item.queuePosition}</Text>
                      </View>
                    </View>

                    {/* Content */}
                    <Text style={styles.cardTitleText}>{item.title}</Text>
                    <Text style={styles.cardMsgText} numberOfLines={1}>{item.message}</Text>

                    {/* Footer values */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardFooterMetric}>Focus: {item.focusScore}</Text>
                      <Text style={styles.cardFooterMetric}>Urgency: {item.urgencyScore}</Text>
                      <Text style={styles.cardFooterRelease}>Release: {item.estReleaseTime}</Text>

                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item.id)}
                        style={styles.cardDeleteBtn}>
                        <Trash2 size={12} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Display block reason if selected */}
                    {selectedItemId === item.id && (
                      <View style={styles.cardReasonBox}>
                        <Text style={styles.reasonHeading}>BLOCK REASON</Text>
                        <Text style={styles.reasonText}>{item.reason}</Text>
                      </View>
                    )}

                  </TouchableOpacity>

                </AnimatedView>
              ))}
            </View>
          )}

          {/* LIFETIME TIMELINE FOR SELECTED ITEM */}
          {selectedItem && (
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>Selected Item Lifecycle Timeline</Text>
              <Text style={styles.timelineDesc}>App: {selectedItem.sender} | Title: "{selectedItem.title}"</Text>
              
              <View style={styles.timelineTimeline}>
                
                {/* Node 1: Received */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineStepLeft}>
                    <View style={[styles.timelineNode, styles.nodeActiveGreen]}>
                      <Check size={8} color="#FFF" />
                    </View>
                    <View style={styles.timelineVerticalLine} />
                  </View>
                  <View style={styles.timelineStepRight}>
                    <Text style={styles.timelineStepTitle}>Notification Intercepted</Text>
                    <Text style={styles.timelineStepSub}>Logged at {selectedItem.timeReceived}</Text>
                  </View>
                </View>

                {/* Node 2: Blocked / Queued */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineStepLeft}>
                    <View style={[styles.timelineNode, styles.nodeActiveOrange]}>
                      <Check size={8} color="#FFF" />
                    </View>
                    <View style={styles.timelineVerticalLine} />
                  </View>
                  <View style={styles.timelineStepRight}>
                    <Text style={styles.timelineStepTitle}>Queued to Shield Buffer</Text>
                    <Text style={styles.timelineStepSub}>
                      Blocked: Focus Score {selectedItem.focusScore} exceeds Urgency threshold.
                    </Text>
                  </View>
                </View>

                {/* Node 3: Waiting */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineStepLeft}>
                    <View style={[styles.timelineNode, 
                      selectedItem.status === 'Queued' ? styles.nodeGlowYellow : styles.nodeActiveGreen
                    ]}>
                      {selectedItem.status !== 'Queued' ? <Check size={8} color="#FFF" /> : null}
                    </View>
                    <View style={styles.timelineVerticalLine} />
                  </View>
                  <View style={styles.timelineStepRight}>
                    <Text style={styles.timelineStepTitle}>Waiting in Cache</Text>
                    <Text style={styles.timelineStepSub}>
                      {selectedItem.status === 'Queued' ? `Position: #${selectedItem.queuePosition} in attention queue` : 'Buffer period completed'}
                    </Text>
                  </View>
                </View>

                {/* Node 4: Released */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineStepLeft}>
                    <View style={[styles.timelineNode, 
                      selectedItem.status === 'Released' ? styles.nodeGlowGreen : styles.nodeInactive
                    ]} />
                    <View style={styles.timelineVerticalLine} />
                  </View>
                  <View style={styles.timelineStepRight}>
                    <Text style={[styles.timelineStepTitle, selectedItem.status === 'Released' ? styles.textActiveGreen : styles.textDim]}>
                      Released from Shield
                    </Text>
                    <Text style={styles.timelineStepSub}>
                      {selectedItem.status === 'Released' ? 'Released via manual override / decay override' : 'Pending focus score threshold drop'}
                    </Text>
                  </View>
                </View>

                {/* Node 5: Delivered */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineStepLeft}>
                    <View style={[styles.timelineNode, styles.nodeInactive]} />
                  </View>
                  <View style={styles.timelineStepRight}>
                    <Text style={[styles.timelineStepTitle, styles.textDim]}>Delivered to User</Text>
                    <Text style={styles.timelineStepSub}>Pending endpoint notification flush</Text>
                  </View>
                </View>

              </View>
            </View>
          )}

          {/* QUEUE ANALYTICS */}
          <Text style={styles.sectionHeading}>Queue Operations Analytics</Text>
          <View style={styles.analyticsGrid}>
            
            <View style={styles.analyticCard}>
              <Clock size={16} color="#3B82F6" style={{ marginBottom: 6 }} />
              <Text style={styles.analyticVal}>{stats.avgWaitTime}</Text>
              <Text style={styles.analyticLabel}>Avg Wait Time</Text>
            </View>

            <View style={styles.analyticCard}>
              <AlertTriangle size={16} color="#EF4444" style={{ marginBottom: 6 }} />
              <Text style={styles.analyticVal}>{stats.longestWait}</Text>
              <Text style={styles.analyticLabel}>Longest Wait</Text>
            </View>

            <View style={styles.analyticCard}>
              <Layers size={16} color="#F59E0B" style={{ marginBottom: 6 }} />
              <Text style={styles.analyticVal}>{stats.currentQueue}</Text>
              <Text style={styles.analyticLabel}>Current Queue</Text>
            </View>

            <View style={styles.analyticCard}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 6 }} />
              <Text style={styles.analyticVal}>{stats.releasedToday}</Text>
              <Text style={styles.analyticLabel}>Released Today</Text>
            </View>

            {/* Saved Interruptions Full Width Card */}
            <View style={[styles.analyticCard, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 }]}>
              <View style={styles.row}>
                <Shield size={20} color="#10B981" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.analyticLabel}>Total Interruption Pings Blocked</Text>
                  <Text style={styles.savedScoreText}>Optimal focus preservation</Text>
                </View>
              </View>
              <Text style={styles.savedScoreVal}>{stats.savedInterruptions}</Text>
            </View>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
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
    paddingBottom: 120, // PAST FLOATING NAVIGATION
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
  lockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockStateTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  lockStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  lockStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockScoreCol: {
    alignItems: 'flex-end',
  },
  lockScoreVal: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  lockScoreLabel: {
    fontSize: 8.5,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarWrapper: {
    marginTop: 18,
  },
  progressRowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  thresholdMarker: {
    position: 'absolute',
    left: '75%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#EF4444',
  },
  engineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  simBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  simBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
  },
  engineDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  simFlowchart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  flowNode: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  flowNodeActiveBlue: { borderColor: '#3B82F6', shadowColor: '#3B82F6', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  flowNodeActiveGreen: { borderColor: '#10B981', shadowColor: '#10B981', shadowRadius: 6, shadowOpacity: 0.5, elevation: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  flowNodeScore: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  flowNodeLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  simButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnSim: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnSimActive: { backgroundColor: '#EF4444' },
  btnSimInactive: { backgroundColor: '#3B82F6' },
  btnOutline: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnSimText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  controlDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  manualButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  manualBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 12,
  },
  manualBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  manualBtnAction: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnActionActive: {
    backgroundColor: '#EF4444',
  },
  btnActionInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnActionClear: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 20,
    marginBottom: 20,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  aiText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginTop: 6,
    fontWeight: '500',
  },
  listHeaderRow: {
    marginBottom: 12,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  successContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successText: {
    color: '#E2E8F0',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
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
  },
  queueCardList: {
    marginBottom: 10,
  },
  queueCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  queueCardActive: {
    backgroundColor: 'rgba(30, 28, 50, 0.85)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  queueCardInactive: {
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 4,
    borderLeftColor: '#475569',
  },
  queueCardReleased: {
    opacity: 0.2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIconBorder: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardSenderText: {
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
  queuePosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
  },
  queuePosText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitleText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardMsgText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
    marginTop: 10,
  },
  cardFooterMetric: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
    marginRight: 12,
  },
  cardFooterRelease: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardDeleteBtn: {
    marginLeft: 'auto',
    padding: 2,
  },
  cardReasonBox: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  reasonHeading: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 15,
  },
  timelineDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 16,
  },
  timelineTimeline: {
    marginTop: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineStepLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2.5,
    borderColor: '#0F0E23',
  },
  nodeActiveGreen: { backgroundColor: '#10B981', borderColor: '#0F0E23' },
  nodeActiveOrange: { backgroundColor: '#F59E0B', borderColor: '#0F0E23' },
  nodeGlowYellow: { backgroundColor: '#EAB308', shadowColor: '#EAB308', shadowRadius: 6, shadowOpacity: 0.8, borderColor: '#0F0E23' },
  nodeGlowGreen: { backgroundColor: '#10B981', shadowColor: '#10B981', shadowRadius: 6, shadowOpacity: 0.8, borderColor: '#0F0E23' },
  nodeInactive: { backgroundColor: '#334155', borderColor: '#0F0E23' },
  timelineVerticalLine: {
    width: 1.5,
    position: 'absolute',
    top: 14,
    bottom: -18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  timelineStepRight: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  timelineStepSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 14,
  },
  textActiveGreen: { color: '#10B981' },
  textDim: { color: '#64748B' },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analyticCard: {
    width: '48%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  analyticVal: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  analyticLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  savedScoreVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10B981',
  },
  savedScoreText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 1,
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
