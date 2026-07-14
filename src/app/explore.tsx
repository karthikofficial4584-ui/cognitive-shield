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
} from 'react-native-reanimated';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Shield,
  Activity,
  Bell,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Zap,
  Cpu,
  Layers,
  Wifi,
  Database,
  Link,
  Keyboard,
  FileCode,
  Laptop,
  MousePointer,
  Sliders,
  Sparkles,
  Clock,
  Lock,
  Unlock,
  MessageSquare,
  Check,
  X,
  ChevronRight,
  Info,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Create local Query Client
const queryClient = new QueryClient();

// Reanimated custom components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

// Axios setup
const api = axios.create({
  baseURL: 'https://api.cognitiveshield.mock',
});

// Mock query function for future API
const fetchLiveTelemetryConfig = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    lambda: 0.15,
    deltaT: 1.0,
    kWeight: 0.3,
    cWeight: 0.5,
    aWeight: 0.2,
  };
};

export default function ExploreScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveFocusScreen />
    </QueryClientProvider>
  );
}

interface NotificationItem {
  id: string;
  sender: string;
  message: string;
  status: 'Allowed' | 'Blocked';
  timestamp: string;
}

import { useShield } from '@/context/ShieldContext';

function LiveFocusScreen() {
  const {
    focusScore,
    velocity: velocityVal,
    activeActivity: activeWindow,
    typingSpeed,
    codeChanges,
    windowConsistency,
    queue,
    notifications,
    analytics,
    demoModeActive: isSimulating,
    startDemoSimulation,
    stopDemoSimulation,
  } = useShield();

  // Math parameters
  const lambda = 0.15;
  const deltaT = 1.0;
  const wK = 0.3;
  const wC = 0.5;
  const wA = 0.2;

  const focusState = focusScore >= 80 ? 'Deep Focus' : focusScore >= 60 ? 'Focused' : focusScore >= 40 ? 'Normal' : focusScore >= 20 ? 'Distracted' : 'Idle';
  const mouseActivity = Math.max(10, Math.floor(velocityVal * 0.6));
  const kNorm = parseFloat((typingSpeed / 100).toFixed(2));
  const cNorm = parseFloat(Math.min(codeChanges / 250, 1.0).toFixed(2));
  const aNorm = parseFloat((windowConsistency / 100).toFixed(2));

  // Score History (15 seconds of logs)
  const [history, setHistory] = useState<number[]>([76, 78, 77, 80, 81, 79, 82, 83, 80, 82, 84, 85, 83, 81, 82]);

  useEffect(() => {
    setHistory(prev => {
      const nextHistory = [...prev.slice(1), focusScore];
      return nextHistory;
    });
  }, [focusScore]);

  // Sync timeline with block events
  const timeline = useMemo(() => {
    return notifications.slice(0, 4).map((n) => ({
      id: n.id,
      time: n.time,
      event: n.status === 'Blocked' ? `Blocked notification (${n.sender}: "${n.title}")` : `Allowed alert (${n.sender}: "${n.title}")`,
      type: n.status === 'Blocked' ? 'block' : 'alert',
    }));
  }, [notifications]);

  // Floating Notification overlay state
  const [currentNotification, setCurrentNotification] = useState<any | null>(null);
  const prevNotificationId = useRef<string | null>(null);

  // App notification counters
  const stats = useMemo(() => {
    return {
      blockedCount: analytics.blockedNotif,
      allowedCount: analytics.allowedNotif,
      stabilityRating: analytics.attentionStability,
      trend: '+12% over 1hr',
    };
  }, [analytics]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 3. Shared Animation Values
  const pulseOpacity = useSharedValue(0.6);
  const strokePercent = useSharedValue(0.82);

  // Notify Popup Animations
  const notifyOpacity = useSharedValue(0);
  const notifyY = useSharedValue(-20);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    strokePercent.value = withTiming(focusScore / 100, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [focusScore]);

  // Listening to incoming notification updates to show floating toast popup
  useEffect(() => {
    if (notifications.length > 0) {
      const topNotif = notifications[0];
      if (topNotif.id !== prevNotificationId.current) {
        prevNotificationId.current = topNotif.id;
        setCurrentNotification({
          id: topNotif.id,
          sender: topNotif.sender,
          message: topNotif.message,
          status: topNotif.status === 'Blocked' ? 'Blocked' : 'Allowed',
          timestamp: topNotif.time,
        });

        notifyOpacity.value = 1;
        notifyY.value = withSequence(withTiming(15, { duration: 400 }), withTiming(10, { duration: 200 }));

        const timer = setTimeout(() => {
          notifyOpacity.value = withTiming(0, { duration: 500 });
          notifyY.value = withTiming(-20, { duration: 500 });
          setCurrentNotification(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const getFocusStateColor = (state: string) => {
    switch (state) {
      case 'Deep Focus': return '#A855F7';
      case 'Focused': return '#3B82F6';
      case 'Normal': return '#10B981';
      case 'Distracted': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const handleToggleSimulation = () => {
    if (isSimulating) {
      stopDemoSimulation();
      showToast('Simulation Paused');
    } else {
      startDemoSimulation();
      showToast('Simulation Started');
    }
  };

  const handleResetSimulation = () => {
    stopDemoSimulation();
    showToast('Simulation Reset');
  };


  // Demo Command Boosts
  const handleIncreaseFocus = () => {
    startDemoSimulation();
    showToast('Demo Simulation Initiated');
  };

  const handleDecreaseFocus = () => {
    stopDemoSimulation();
    showToast('Simulation Halted');
  };


  // 5. Custom SVG Graph Rendering
  // The graph is width - 40, height is 120. We render 15 points.
  const graphWidth = width - 80;
  const graphHeight = 110;
  
  const pathData = useMemo(() => {
    if (history.length === 0) return '';
    const points = history.map((score, index) => {
      const x = (index / (history.length - 1)) * graphWidth;
      // Invert Y coordinate since SVG 0 is top
      const y = graphHeight - (score / 100) * graphHeight;
      return { x, y };
    });
    
    // Draw smooth cubic bezier lines
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [history, graphWidth]);

  // Gradient fill path data
  const areaPathData = useMemo(() => {
    const linePath = pathData;
    if (!linePath) return '';
    return `${linePath} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z`;
  }, [pathData, graphWidth]);

  // Derived gauge path calculations
  const RADIUS = 65;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const animatedGaugeProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - strokePercent.value),
    };
  });

  // Pulse style
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Toast Notify box style
  const notifyStyle = useAnimatedStyle(() => ({
    opacity: notifyOpacity.value,
    transform: [{ translateY: notifyY.value }],
  }));

  const focusStateColor = getFocusStateColor(focusState);

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
            <Text style={styles.headerTitle}>Live Focus Core</Text>
            <Text style={styles.headerSubtitle}>Real-time telemetry and mathematical model</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.indicatorLight, { backgroundColor: isSimulating ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.simText}>{isSimulating ? 'SIM RUNNING' : 'PAUSED'}</Text>
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

          {/* FLOATING NOTIFICATION PREVIEW CONTAINER */}
          {currentNotification && (
            <AnimatedView style={[styles.notificationAlertBox, notifyStyle, 
              currentNotification.status === 'Blocked' ? styles.alertBlockedBorder : styles.alertAllowedBorder
            ]}>
              <View style={styles.row}>
                {currentNotification.status === 'Blocked' ? (
                  <View style={styles.alertIconBlocked}>
                    <Lock size={14} color="#EF4444" />
                  </View>
                ) : (
                  <View style={styles.alertIconAllowed}>
                    <Unlock size={14} color="#10B981" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.alertSender}>{currentNotification.sender}</Text>
                    <Text style={styles.alertTime}>{currentNotification.timestamp}</Text>
                  </View>
                  <Text style={styles.alertMsg}>{currentNotification.message}</Text>
                </View>
              </View>
              <View style={styles.alertFooter}>
                <Shield size={10} color={currentNotification.status === 'Blocked' ? '#EF4444' : '#10B981'} style={{ marginRight: 4 }} />
                <Text style={[styles.alertStatusText, { color: currentNotification.status === 'Blocked' ? '#EF4444' : '#10B981' }]}>
                  {currentNotification.status === 'Blocked' ? 'COGNITIVE BLOCK EFFECTIVE' : 'CRITICAL PRIORITY DELIVERED'}
                </Text>
              </View>
            </AnimatedView>
          )}

          {/* SCORE CARD & GRAPH SPLIT CONTAINER */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Attention Metric Real-Time Graph</Text>
              <View style={styles.pulseContainer}>
                <AnimatedView style={[styles.pulseCircle, pulseStyle]} />
                <Text style={styles.pulseText}>1 SEC UPDATE</Text>
              </View>
            </View>

            {/* Circular Gauge and History Graph layout side-by-side */}
            <View style={styles.gaugeGraphRow}>
              
              {/* Circular Gauge */}
              <View style={styles.gaugeLeftColumn}>
                <Svg width={110} height={110} viewBox="0 0 140 140">
                  <Defs>
                    <SvgGradient id="liveGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#A855F7" />
                      <Stop offset="100%" stopColor="#3B82F6" />
                    </SvgGradient>
                  </Defs>
                  
                  <Circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="6"
                  />
                  
                  <AnimatedCircle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="transparent"
                    stroke="url(#liveGaugeGrad)"
                    strokeWidth="8"
                    strokeDasharray={`${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                    animatedProps={animatedGaugeProps}
                    transform={`rotate(-90 70 70)`}
                  />
                </Svg>

                <View style={styles.gaugeTextOverlay}>
                  <Text style={styles.gaugeScoreVal}>{focusScore}</Text>
                  <Text style={[styles.gaugeScoreLabel, { color: focusStateColor }]}>{focusState}</Text>
                </View>
              </View>

              {/* History Graph */}
              <View style={styles.graphRightColumn}>
                <Svg width={graphWidth} height={graphHeight}>
                  <Defs>
                    <SvgGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </SvgGradient>
                    <SvgGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#8B5CF6" />
                      <Stop offset="100%" stopColor="#3B82F6" />
                    </SvgGradient>
                  </Defs>

                  {/* Horizontal Grid lines */}
                  <Line x1="0" y1={graphHeight * 0.2} x2={graphWidth} y2={graphHeight * 0.2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <Line x1="0" y1={graphHeight * 0.5} x2={graphWidth} y2={graphHeight * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <Line x1="0" y1={graphHeight * 0.8} x2={graphWidth} y2={graphHeight * 0.8} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                  {/* Area Fill */}
                  {areaPathData ? <Path d={areaPathData} fill="url(#graphGradient)" /> : null}

                  {/* Line Path */}
                  {pathData ? <Path d={pathData} fill="none" stroke="url(#lineGrad)" strokeWidth="3" /> : null}

                  {/* Glowing last point dot */}
                  {history.length > 0 && (
                    <Circle
                      cx={graphWidth}
                      cy={graphHeight - (history[history.length - 1] / 100) * graphHeight}
                      r="4"
                      fill="#FFF"
                    />
                  )}
                </Svg>
              </View>

            </View>

            <View style={styles.chartLegendRow}>
              <Text style={styles.legendText}>15 SEC ATTENTION VECTOR SHIFT</Text>
              <Text style={styles.legendValue}>Avg: {Math.round(history.reduce((a,b)=>a+b,0)/history.length)}%</Text>
            </View>

          </View>

          {/* SIMULATION DEMO CONTROLS */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Simulation Control Panel</Text>
            <Text style={styles.controlDesc}>
              Simulate high cognitive workflows or distraction breaks to test the mathematical score engine.
            </Text>

            <View style={styles.controlBtnRow}>
              
              <TouchableOpacity
                onPress={handleToggleSimulation}
                style={[styles.btnControl, isSimulating ? styles.btnActiveRed : styles.btnActiveGreen]}>
                {isSimulating ? (
                  <>
                    <Pause size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Pause Sim</Text>
                  </>
                ) : (
                  <>
                    <Play size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Resume Sim</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetSimulation}
                style={[styles.btnControl, styles.btnOutline]}>
                <RotateCcw size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Reset</Text>
              </TouchableOpacity>

            </View>

            <View style={styles.controlActionRow}>
              
              <TouchableOpacity
                onPress={handleIncreaseFocus}
                style={[styles.btnAction, styles.btnBoostGreen]}>
                <Zap size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Boost Focus</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDecreaseFocus}
                style={[styles.btnAction, styles.btnDrainOrange]}>
                <AlertTriangle size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Drain Focus</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* MATHEMATICAL CALCULATION ENGINE SHELL */}
          <View style={styles.glassCard}>
            <View style={styles.row}>
              <Cpu size={16} color="#8B5CF6" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Mathematical Calculation Engine</Text>
            </View>
            <Text style={styles.formulaDesc}>
              Real-time update of the decay filtering algorithm and cognitive velocity score.
            </Text>

            {/* Formula box */}
            <View style={styles.shellTerminal}>
              
              {/* Formula display */}
              <View style={styles.shellHeader}>
                <Text style={styles.shellTitle}>COGNITIVE_SHIELD_SCORE_ENGINE_v1</Text>
              </View>

              <View style={styles.shellBody}>
                {/* Equations */}
                <Text style={styles.shellCodeGreen}># 1. Cognitive Velocity Formula</Text>
                <Text style={styles.shellCodeWhite}>
                  V = {wK}*k_norm + {wC}*c_norm + {wA}*a_norm
                </Text>
                <Text style={styles.shellCodeDim}>
                  V = {wK}*({kNorm}) + {wC}*({cNorm}) + {wA}*({aNorm})
                </Text>
                <Text style={styles.shellCodeCyan}>
                  V_result = {velocityVal}%
                </Text>

                <View style={styles.shellLine} />

                <Text style={styles.shellCodeGreen}># 2. Focus State Decay Formula</Text>
                <Text style={styles.shellCodeWhite}>
                  FS = FS_prev × exp(-λ*Δt) + (1 - exp(-λ*Δt)) × V
                </Text>
                <Text style={styles.shellCodeDim}>
                  FS = {focusScore} × e^(-{lambda}*1.0) + (1 - e^-0.15) × {velocityVal}
                </Text>
                <Text style={styles.shellCodeDim}>
                  FS = {focusScore} × 0.86 + 0.14 × {velocityVal}
                </Text>
                <Text style={styles.shellCodePurple}>
                  FS_result = {Math.round(focusScore)}
                </Text>

              </View>

            </View>
          </View>

          {/* TELEMETRY CARDS */}
          <Text style={styles.sectionHeading}>Live Input Telemetry</Text>
          <View style={styles.telemetryGrid}>
            
            {/* Card 1: Typing Speed */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryCardHeader}>
                <Keyboard size={15} color="#3B82F6" />
                <Text style={styles.telemetryTitle}>Typing Cadence</Text>
              </View>
              <Text style={styles.telemetryValue}>{typingSpeed} WPM</Text>
              <Text style={styles.telemetrySub}>Normalized: {kNorm}</Text>
            </View>

            {/* Card 2: Code Changes */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryCardHeader}>
                <FileCode size={15} color="#8B5CF6" />
                <Text style={styles.telemetryTitle}>Code Modifications</Text>
              </View>
              <Text style={styles.telemetryValue}>+{codeChanges} Lines</Text>
              <Text style={styles.telemetrySub}>Normalized: {cNorm}</Text>
            </View>

            {/* Card 3: Window Consistency */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryCardHeader}>
                <Laptop size={15} color="#06B6D4" />
                <Text style={styles.telemetryTitle}>App Retention</Text>
              </View>
              <Text style={styles.telemetryValue}>{windowConsistency}%</Text>
              <Text style={styles.telemetrySub}>Normalized: {aNorm}</Text>
            </View>

            {/* Card 4: Cognitive Velocity */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryCardHeader}>
                <TrendingUp size={15} color="#10B981" />
                <Text style={styles.telemetryTitle}>Velocity Vector</Text>
              </View>
              <Text style={styles.telemetryValue}>{velocityVal}%</Text>
              <Text style={styles.telemetrySub}>Target Threshold: 70%</Text>
            </View>

            {/* Card 5: Mouse Activity */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryCardHeader}>
                <MousePointer size={15} color="#D946EF" />
                <Text style={styles.telemetryTitle}>Input Intercepts</Text>
              </View>
              <Text style={styles.telemetryValue}>{mouseActivity}/min</Text>
              <Text style={styles.telemetrySub}>Active Clicks</Text>
            </View>

            {/* Card 6: Active Window */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryCardHeader}>
                <Layers size={15} color="#F59E0B" />
                <Text style={styles.telemetryTitle}>Focus Context</Text>
              </View>
              <Text style={styles.telemetryValueText} numberOfLines={1}>
                {activeWindow}
              </Text>
              <Text style={styles.telemetrySub}>Active App Workspace</Text>
            </View>

          </View>

          {/* AI ANALYSIS CARD */}
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.12)', 'rgba(6, 182, 212, 0.05)']}
            style={styles.aiCard}>
            <View style={styles.row}>
              <Sparkles size={16} color="#A855F7" style={{ marginRight: 8 }} />
              <Text style={styles.aiTitle}>AI Shield Attention Stability Analysis</Text>
            </View>

            <View style={styles.aiAnalysisGrid}>
              
              <View style={styles.aiAnalysisCell}>
                <Text style={styles.aiCellLabel}>Productivity Score</Text>
                <Text style={styles.aiCellValGreen}>Optimal</Text>
              </View>

              <View style={styles.aiAnalysisCell}>
                <Text style={styles.aiCellLabel}>Attention Stability</Text>
                <Text style={styles.aiCellValCyan}>{stats.stabilityRating}%</Text>
              </View>

              <View style={styles.aiAnalysisCell}>
                <Text style={styles.aiCellLabel}>Trend Matrix</Text>
                <Text style={styles.aiCellValPurple}>{stats.trend}</Text>
              </View>

            </View>

            <View style={styles.aiLine} />
            <Text style={styles.aiRecHeading}>System Recommendation</Text>
            <Text style={styles.aiRecText}>
              Telemetry shows consistent keyboard and workspace coordination. Attention stability index is optimal at {stats.stabilityRating}%. Keep up this cognitive pace for another 20 minutes to close out your deep work sprint window.
            </Text>
          </LinearGradient>

          {/* LIVE TELEMETRY STATUS */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Telemetry Daemon Nodes</Text>
            <View style={styles.telemetryStatusList}>
              
              <View style={styles.telemetryStatusRow}>
                <View style={styles.row}>
                  <Wifi size={14} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={styles.statusLabel}>Telemetry Stream Daemon</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.statusOkText}>CONNECTED</Text>
                  <AnimatedView style={[styles.statusGlowDot, pulseStyle, { backgroundColor: '#10B981' }]} />
                </View>
              </View>

              <View style={styles.telemetryStatusRow}>
                <View style={styles.row}>
                  <Database size={14} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={styles.statusLabel}>Local Shield Cache Node</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.statusOkText}>CONNECTED</Text>
                  <AnimatedView style={[styles.statusGlowDot, pulseStyle, { backgroundColor: '#3B82F6' }]} />
                </View>
              </View>

              <View style={styles.telemetryStatusRow}>
                <View style={styles.row}>
                  <Link size={14} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text style={styles.statusLabel}>Secure Gateway API Node</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.statusOkText}>CONNECTED</Text>
                  <AnimatedView style={[styles.statusGlowDot, pulseStyle, { backgroundColor: '#8B5CF6' }]} />
                </View>
              </View>

              <View style={styles.telemetryStatusRow}>
                <View style={styles.row}>
                  <Shield size={14} color="#D946EF" style={{ marginRight: 8 }} />
                  <Text style={styles.statusLabel}>Notification Interceptor Filter</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.statusOkText}>ACTIVE</Text>
                  <AnimatedView style={[styles.statusGlowDot, pulseStyle, { backgroundColor: '#D946EF' }]} />
                </View>
              </View>

              <View style={styles.telemetryStatusRow}>
                <View style={styles.row}>
                  <Layers size={14} color="#F59E0B" style={{ marginRight: 8 }} />
                  <Text style={styles.statusLabel}>Buffered Queue Cache Node</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.statusWarningText}>{stats.blockedCount} BLOCKED</Text>
                </View>
              </View>

            </View>
          </View>

          {/* ACTIVITY TIMELINE */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Live Event Streams</Text>
            <View style={styles.timelineContainer}>
              {timeline.map((item, index) => (
                <View key={item.id} style={styles.timelineItem}>
                  
                  {/* Left layout */}
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <View style={styles.timelineLineWrapper}>
                      <View style={[styles.timelineNode, 
                        item.type === 'success' ? styles.nodeSuccess :
                        item.type === 'focus' ? styles.nodeFocus :
                        item.type === 'block' ? styles.nodeBlock : styles.nodeAlert
                      ]} />
                      {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                  </View>

                  {/* Right Layout */}
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineText}>{item.event}</Text>
                  </View>

                </View>
              ))}
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  indicatorLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  simText: {
    color: '#FFF',
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
    paddingBottom: 120, // Space to scroll past floating bottom navigation
  },
  notificationAlertBox: {
    backgroundColor: 'rgba(15, 17, 30, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 5,
  },
  alertBlockedBorder: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  alertAllowedBorder: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  alertIconBlocked: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertIconAllowed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertSender: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  alertTime: {
    fontSize: 10,
    color: '#64748B',
  },
  alertMsg: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
    fontWeight: '500',
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  alertStatusText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pulseCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
    marginRight: 6,
  },
  pulseText: {
    color: '#D8B4FE',
    fontSize: 8.5,
    fontWeight: '800',
  },
  gaugeGraphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gaugeLeftColumn: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeScoreVal: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
  },
  gaugeScoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: -2,
    letterSpacing: 0.5,
  },
  graphRightColumn: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    marginTop: 15,
  },
  legendText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legendValue: {
    fontSize: 9,
    color: '#A855F7',
    fontWeight: '700',
  },
  controlDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 15,
  },
  controlBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  btnControl: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnActiveRed: {
    backgroundColor: '#EF4444',
  },
  btnActiveGreen: {
    backgroundColor: '#10B981',
  },
  btnOutline: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  controlActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnAction: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnBoostGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  btnDrainOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  formulaDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  shellTerminal: {
    backgroundColor: '#090A0F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  shellHeader: {
    backgroundColor: '#13141F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  shellTitle: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shellBody: {
    padding: 16,
  },
  shellCodeGreen: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    marginBottom: 2,
  },
  shellCodeWhite: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    marginBottom: 2,
    paddingLeft: 10,
  },
  shellCodeDim: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '500',
    marginBottom: 2,
    paddingLeft: 10,
  },
  shellCodeCyan: {
    color: '#06B6D4',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '800',
    marginBottom: 12,
    paddingLeft: 10,
  },
  shellCodePurple: {
    color: '#C084FC',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '800',
    paddingLeft: 10,
  },
  shellLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 14,
    marginTop: 10,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  telemetryCard: {
    width: '48%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
    marginBottom: 16,
  },
  telemetryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  telemetryTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
  telemetryValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  telemetryValueText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  telemetrySub: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    padding: 20,
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  aiAnalysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  aiAnalysisCell: {
    flex: 1,
  },
  aiCellLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  aiCellValGreen: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  aiCellValCyan: {
    color: '#06B6D4',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  aiCellValPurple: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  aiLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
  aiRecHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A855F7',
    textTransform: 'uppercase',
  },
  aiRecText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  telemetryStatusList: {
    marginTop: 10,
  },
  telemetryStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  statusLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  statusOkText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  statusWarningText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  statusGlowDot: {
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
    marginBottom: 12,
  },
  timelineLeft: {
    flexDirection: 'row',
    width: 65,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    width: 35,
    textAlign: 'right',
  },
  timelineLineWrapper: {
    alignItems: 'center',
    width: 30,
  },
  timelineNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    zIndex: 2,
  },
  nodeSuccess: { backgroundColor: '#10B981' },
  nodeFocus: { backgroundColor: '#A855F7' },
  nodeBlock: { backgroundColor: '#EF4444' },
  nodeAlert: { backgroundColor: '#F59E0B' },
  timelineLine: {
    width: 1.5,
    position: 'absolute',
    top: 12,
    bottom: -15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 4,
  },
  timelineText: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
