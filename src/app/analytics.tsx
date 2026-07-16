import React, { useState, useEffect, useMemo } from 'react';
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
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Shield,
  Activity,
  Bell,
  Sparkles,
  Zap,
  Clock,
  Layers,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Calendar,
  Share2,
  FileText,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  Cpu,
  Keyboard,
  FileCode,
  Laptop,
  Flame,
  X,
  Award,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Reanimated custom components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function AnalyticsRoute() {
  return <AnalyticsDashboard />;
}

// Reusable CountUp component using RequestAnimationFrame for smooth cross-platform 60 FPS transitions
interface CountUpProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  style?: any;
}

function CountUpText({ value, suffix = '', prefix = '', duration = 800, style }: CountUpProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setCurrent(0);
      return;
    }
    const increment = end / (duration / 16); // ~60 FPS update

    let frameId: number;
    const count = () => {
      start += increment;
      if (start >= end) {
        setCurrent(end);
      } else {
        setCurrent(Math.floor(start));
        frameId = requestAnimationFrame(count);
      }
    };

    frameId = requestAnimationFrame(count);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <Text style={style}>{prefix}{current}{suffix}</Text>;
}

import { useShield } from '@/context/ShieldContext';

interface FocusTrendChartProps {
  graphWidth: number;
  graphHeight: number;
  areaPathData: string;
  pathData: string;
  focusScores: number[];
  xLabel: string[];
}

const FocusTrendChart = React.memo(function FocusTrendChart({
  graphWidth,
  graphHeight,
  areaPathData,
  pathData,
  focusScores,
  xLabel,
}: FocusTrendChartProps) {
  return (
    <View style={styles.chartContainer}>
      <Svg width={graphWidth} height={graphHeight}>
        <Defs>
          <SvgGradient id="curveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </SvgGradient>
          <SvgGradient id="curveLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8B5CF6" />
            <Stop offset="100%" stopColor="#3B82F6" />
          </SvgGradient>
        </Defs>

        {/* Grid guidelines */}
        <Line x1="0" y1={graphHeight * 0.25} x2={graphWidth} y2={graphHeight * 0.25} stroke="rgba(255,255,255,0.02)" />
        <Line x1="0" y1={graphHeight * 0.5} x2={graphWidth} y2={graphHeight * 0.5} stroke="rgba(255,255,255,0.02)" />
        <Line x1="0" y1={graphHeight * 0.75} x2={graphWidth} y2={graphHeight * 0.75} stroke="rgba(255,255,255,0.02)" />

        {/* Graph Fill Area */}
        {areaPathData ? <Path d={areaPathData} fill="url(#curveAreaGrad)" /> : null}

        {/* Line Curve Path */}
        {pathData ? <Path d={pathData} fill="none" stroke="url(#curveLineGrad)" strokeWidth="3" /> : null}

        {/* Vertices dot circles */}
        {focusScores && focusScores.length > 1 ? focusScores.map((score: number, index: number) => {
          const x = (index / (focusScores.length - 1)) * graphWidth;
          const y = graphHeight - ((score ?? 0) / 100) * graphHeight;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="3.5"
              fill="#FFF"
              stroke="#8B5CF6"
              strokeWidth="1.5"
            />
          );
        }) : focusScores && focusScores.length === 1 ? (
          <Circle
            cx={0}
            cy={graphHeight - ((focusScores[0] ?? 0) / 100) * graphHeight}
            r="3.5"
            fill="#FFF"
            stroke="#8B5CF6"
            strokeWidth="1.5"
          />
        ) : null}
      </Svg>
    </View>
  );
});

interface FocusHeatmapProps {
  heatmapRows: string[];
  heatmapCols: string[];
  heatmapData: number[][];
}

const FocusHeatmap = React.memo(function FocusHeatmap({
  heatmapRows,
  heatmapCols,
  heatmapData,
}: FocusHeatmapProps) {
  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 4: return '#A855F7';
      case 3: return '#6366F1';
      case 2: return '#3B82F6';
      case 1: return '#06B6D4';
      default: return 'rgba(255,255,255,0.03)';
    }
  };

  return (
    <View style={styles.heatmapWrapper}>
      {/* Columns Header (Hours) */}
      <View style={styles.heatmapHoursHeader}>
        <View style={{ width: 35 }} />
        {heatmapCols.map((col, idx) => (
          <Text key={idx} style={styles.heatmapHeaderColText}>{col}</Text>
        ))}
      </View>

      {/* Rows Grid */}
      {heatmapRows.map((rowLabel, rowIndex) => (
        <View key={rowIndex} style={styles.heatmapRow}>
          <Text style={styles.heatmapRowText}>{rowLabel}</Text>
          
          {heatmapData[rowIndex].map((level, colIndex) => {
            const color = getHeatmapColor(level);
            return (
              <View
                key={colIndex}
                style={[styles.heatmapCell, { backgroundColor: color }]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'Today' | 'This Week' | 'This Month'>('Today');
  const { analytics: liveAnalytics, isLoading: isFetching } = useShield();
  const [chartsVisible, setChartsVisible] = useState(false);

  useEffect(() => {
    // Delay rendering of heavy charts to avoid transition stutters
    const timer = setTimeout(() => {
      setChartsVisible(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const report = useMemo(() => {
    if (dateRange === 'Today') {
      return liveAnalytics;
    }
    if (dateRange === 'This Week') {
      return {
        productivityScore: 88,
        focusTrend: '+12% vs last week',
        deepFocusMinutes: 1320,
        preventedInteractions: 245,
        savedMinutes: 980,
        focusEfficiency: 89,
        allowedNotif: 58,
        blockedNotif: 187,
        criticalAlerts: 14,
        queuedNotif: 62,
        releasedNotif: 48,
        avgQueueTime: 18,
        avgVelocity: 79,
        typingTrend: '+6% WPM',
        codeChangesTrend: '+1,240 lines',
        consistencyIndex: 87,
        attentionStability: 92,
        switchesPrevented: 245,
        weeklyImprovement: 12.0,
      };
    }
    return {
      productivityScore: 84,
      focusTrend: '+4% vs last month',
      deepFocusMinutes: 5240,
      preventedInteractions: 984,
      savedMinutes: 3936,
      focusEfficiency: 86,
      allowedNotif: 210,
      blockedNotif: 720,
      criticalAlerts: 48,
      queuedNotif: 284,
      releasedNotif: 215,
      avgQueueTime: 22,
      avgVelocity: 76,
      typingTrend: '+4% WPM',
      codeChangesTrend: '+4,890 lines',
      consistencyIndex: 82,
      attentionStability: 89,
      switchesPrevented: 984,
      weeklyImprovement: 4.8,
    };
  }, [dateRange, liveAnalytics]);

  // Shared values
  const refreshRotation = useSharedValue(0);
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

  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshRotation.value}deg` }],
  }));

  // Trigger loading spinner + icon spin
  const handleRefresh = () => {
    refreshRotation.value = 0;
    refreshRotation.value = withTiming(360, { duration: 800, easing: Easing.linear }, (finished) => {
      if (finished) {
        refreshRotation.value = 0;
      }
    });
  };

  const handleExport = (format: 'pdf' | 'csv' | 'share') => {
    handleRefresh(); // Visual feedback
    alert(`Exporting Analytics as ${format.toUpperCase()}...`);
  };

  // Mock data for graphs depending on date range
  const focusScores = useMemo(() => {
    if (dateRange === 'Today') return [72, 85, 78, 92, 84, 88, 92, 95];
    if (dateRange === 'This Week') return [65, 72, 80, 78, 85, 90, 88];
    return [70, 72, 75, 78, 77, 82, 80, 84, 86, 85, 88, 84];
  }, [dateRange]);

  const xLabel = useMemo(() => {
    if (dateRange === 'Today') return ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];
    if (dateRange === 'This Week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }, [dateRange]);

  // Graph Width Calculations
  const graphWidth = width - 80;
  const graphHeight = 110;

  const pathData = useMemo(() => {
    if (!focusScores || focusScores.length < 2) return '';
    const points = focusScores.map((score: number, index: number) => {
      const x = (index / (focusScores.length - 1)) * graphWidth;
      const y = graphHeight - ((score ?? 0) / 100) * graphHeight;
      return { x, y };
    });

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
  }, [focusScores, graphWidth]);

  const areaPathData = useMemo(() => {
    const linePath = pathData;
    if (!linePath) return '';
    return `${linePath} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z`;
  }, [pathData, graphWidth]);

  // Heatmap block data
  // Representing 5 weekdays (rows) and 8 focus slots (columns)
  const heatmapRows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const heatmapCols = ['9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p'];
  const heatmapData = [
    [2, 3, 4, 1, 0, 3, 4, 3], // Mon
    [3, 4, 4, 2, 1, 4, 3, 2], // Tue
    [4, 4, 3, 1, 0, 2, 4, 4], // Wed
    [2, 3, 4, 2, 1, 3, 3, 3], // Thu
    [3, 4, 4, 1, 0, 4, 4, 2], // Fri
  ];

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 4: return '#A855F7'; // Deep Peak Focus (Purple)
      case 3: return '#6366F1'; // Focused (Indigo)
      case 2: return '#3B82F6'; // Normal (Blue)
      case 1: return '#06B6D4'; // Light (Cyan)
      default: return 'rgba(255,255,255,0.03)'; // Idle/Break
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
            <Text style={styles.headerTitle}>Analytics Dashboard</Text>
            <Text style={styles.headerSubtitle}>Cognitive telemetry analysis reports</Text>
          </View>

          {/* Refresh Action */}
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <AnimatedView style={refreshStyle}>
              <RotateCw size={16} color="#A855F7" />
            </AnimatedView>
          </TouchableOpacity>
        </View>

        {/* DATE RANGE SELECTOR */}
        <View style={styles.rangeSelectorContainer}>
          <TouchableOpacity
            onPress={() => setDateRange('Today')}
            style={[styles.rangeTab, dateRange === 'Today' ? styles.rangeTabActive : null]}>
            <Text style={[styles.rangeTabText, dateRange === 'Today' ? styles.rangeTabTextActive : null]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDateRange('This Week')}
            style={[styles.rangeTab, dateRange === 'This Week' ? styles.rangeTabActive : null]}>
            <Text style={[styles.rangeTabText, dateRange === 'This Week' ? styles.rangeTabTextActive : null]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDateRange('This Month')}
            style={[styles.rangeTab, dateRange === 'This Month' ? styles.rangeTabActive : null]}>
            <Text style={[styles.rangeTabText, dateRange === 'This Month' ? styles.rangeTabTextActive : null]}>This Month</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {/* TOP SUMMARY MINI CARDS */}
          <View style={styles.summaryMiniCardsRow}>
            
            <View style={styles.summaryMiniCard}>
              <Text style={styles.miniCardLabel}>PRODUCTIVITY</Text>
              <CountUpText value={report.productivityScore} suffix="%" style={styles.miniCardValue} />
              <View style={styles.miniCardTrendRow}>
                <TrendingUp size={11} color="#10B981" style={{ marginRight: 3 }} />
                <Text style={styles.miniCardTrendText}>{report.focusTrend}</Text>
              </View>
            </View>

            <View style={styles.summaryMiniCard}>
              <Text style={styles.miniCardLabel}>SAVED INTERVALS</Text>
              <CountUpText value={report.switchesPrevented} suffix=" pings" style={styles.miniCardValue} />
              <View style={styles.miniCardTrendRow}>
                <Shield size={11} color="#3B82F6" style={{ marginRight: 3 }} />
                <Text style={styles.miniCardTrendBlue}>Shield protected</Text>
              </View>
            </View>

          </View>

          {/* FOCUS TREND CHART */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.row}>
                <Activity size={16} color="#A855F7" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Focus Trend Curve</Text>
              </View>
              {isFetching && <ActivityIndicator size="small" color="#A855F7" />}
            </View>
            <Text style={styles.chartDesc}>
              Average focus index over the selected timeframe. Focus is normalized against baseline productivity indicators.
            </Text>

            {/* SVG Line Graph */}
            {chartsVisible ? (
              <FocusTrendChart
                graphWidth={graphWidth}
                graphHeight={graphHeight}
                areaPathData={areaPathData}
                pathData={pathData}
                focusScores={focusScores}
                xLabel={xLabel}
              />
            ) : (
              <View style={[styles.chartContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            )}

            {/* X Labels grid */}
            <View style={styles.chartXLabelsRow}>
              {xLabel.map((lbl: string, idx: number) => (
                <Text key={idx} style={styles.xLabelText}>{lbl}</Text>
              ))}
            </View>
          </View>

          {/* FOCUS HEATMAP GRID */}
          <View style={styles.glassCard}>
            <View style={styles.row}>
              <Calendar size={16} color="#06B6D4" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Focus Heatmap distribution</Text>
            </View>
            <Text style={styles.chartDesc}>
              Weekly hour-by-hour developer attention intensity grid (9:00 AM – 5:00 PM).
            </Text>

            {/* Heatmap Layout */}
            {chartsVisible ? (
              <FocusHeatmap
                heatmapRows={heatmapRows}
                heatmapCols={heatmapCols}
                heatmapData={heatmapData}
              />
            ) : (
              <View style={[styles.heatmapWrapper, { height: 130, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#06B6D4" />
              </View>
            )}

            {/* Legend block indicators */}
            <View style={styles.heatmapLegendRow}>
              <Text style={styles.heatmapLegendLabel}>Focus intensity:</Text>
              <View style={styles.row}>
                <View style={[styles.legendIndicatorCell, { backgroundColor: 'rgba(255,255,255,0.03)' }]} />
                <Text style={styles.legendIndicatorText}>Break</Text>
                <View style={[styles.legendIndicatorCell, { backgroundColor: '#06B6D4', marginLeft: 8 }]} />
                <Text style={styles.legendIndicatorText}>Light</Text>
                <View style={[styles.legendIndicatorCell, { backgroundColor: '#3B82F6', marginLeft: 8 }]} />
                <Text style={styles.legendIndicatorText}>Normal</Text>
                <View style={[styles.legendIndicatorCell, { backgroundColor: '#6366F1', marginLeft: 8 }]} />
                <Text style={styles.legendIndicatorText}>Focus</Text>
                <View style={[styles.legendIndicatorCell, { backgroundColor: '#A855F7', marginLeft: 8 }]} />
                <Text style={styles.legendIndicatorText}>Peak</Text>
              </View>
            </View>

          </View>

          {/* PRODUCTIVITY METRICS */}
          <Text style={styles.sectionHeading}>Productivity Analytics</Text>
          <View style={styles.statsCardGrid}>
            
            <View style={styles.statsCardCell}>
              <Clock size={16} color="#3B82F6" style={{ marginBottom: 6 }} />
              <CountUpText value={Math.floor(report.deepFocusMinutes / 60)} suffix="h" style={styles.statsCardVal} />
              <CountUpText value={report.deepFocusMinutes % 60} suffix="m" style={styles.statsCardSubVal} />
              <Text style={styles.statsCardLabel}>Deep Work block</Text>
            </View>

            <View style={styles.statsCardCell}>
              <Shield size={16} color="#10B981" style={{ marginBottom: 6 }} />
              <CountUpText value={report.preventedInteractions} style={styles.statsCardVal} />
              <Text style={styles.statsCardLabel}>Pings Blocked</Text>
            </View>

            <View style={styles.statsCardCell}>
              <Award size={16} color="#F59E0B" style={{ marginBottom: 6 }} />
              <CountUpText value={Math.floor(report.savedMinutes / 60)} suffix="h" style={styles.statsCardVal} />
              <CountUpText value={report.savedMinutes % 60} suffix="m" style={styles.statsCardSubVal} />
              <Text style={styles.statsCardLabel}>Saved Focus Time</Text>
            </View>

            <View style={styles.statsCardCell}>
              <TrendingUp size={16} color="#D946EF" style={{ marginBottom: 6 }} />
              <CountUpText value={report.focusEfficiency} suffix="%" style={styles.statsCardVal} />
              <Text style={styles.statsCardLabel}>Focus Efficiency</Text>
            </View>

          </View>

          {/* NOTIFICATION LOG INTERCEPTS */}
          <Text style={styles.sectionHeading}>Notification Block Audits</Text>
          <View style={styles.statsCardGrid}>
            
            <View style={styles.statsCardCell}>
              <CheckCircle2 size={15} color="#10B981" style={{ marginBottom: 6 }} />
              <CountUpText value={report.allowedNotif} style={styles.statsCardVal} />
              <Text style={styles.statsCardLabel}>Allowed alerts</Text>
            </View>

            <View style={styles.statsCardCell}>
              <X size={15} color="#EF4444" style={{ marginBottom: 6 }} />
              <CountUpText value={report.blockedNotif} style={styles.statsCardVal} />
              <Text style={styles.statsCardLabel}>Blocked alerts</Text>
            </View>

            <View style={styles.statsCardCell}>
              <AlertTriangle size={15} color="#A855F7" style={{ marginBottom: 6 }} />
              <CountUpText value={report.criticalAlerts} style={styles.statsCardVal} />
              <Text style={styles.statsCardLabel}>Critical alerts</Text>
            </View>

            <View style={styles.statsCardCell}>
              <Layers size={15} color="#F59E0B" style={{ marginBottom: 6 }} />
              <CountUpText value={report.queuedNotif} style={styles.statsCardVal} />
              <Text style={styles.statsCardLabel}>Queued logs</Text>
            </View>

          </View>

          {/* COGNITIVE PERFORMANCE TRENDS */}
          <View style={styles.glassCard}>
            <View style={styles.row}>
              <Cpu size={16} color="#8B5CF6" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Cognitive Velocity metrics</Text>
            </View>
            <Text style={styles.chartDesc}>
              Quantified developer output rate, editor retention, and typing rhythm indexes.
            </Text>

            <View style={styles.cognitiveList}>
              
              <View style={styles.cognitiveRow}>
                <View style={styles.row}>
                  <Keyboard size={14} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={styles.cognitiveLabel}>Avg Typing Velocity</Text>
                </View>
                <Text style={styles.cognitiveVal}>{report.typingTrend}</Text>
              </View>

              <View style={styles.cognitiveRow}>
                <View style={styles.row}>
                  <FileCode size={14} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text style={styles.cognitiveLabel}>Modifications Trend</Text>
                </View>
                <Text style={styles.cognitiveVal}>{report.codeChangesTrend}</Text>
              </View>

              <View style={styles.cognitiveRow}>
                <View style={styles.row}>
                  <Laptop size={14} color="#D946EF" style={{ marginRight: 8 }} />
                  <Text style={styles.cognitiveLabel}>Workspace consistency</Text>
                </View>
                <Text style={styles.cognitiveVal}>{report.consistencyIndex}% retention</Text>
              </View>

              <View style={styles.cognitiveRow}>
                <View style={styles.row}>
                  <Activity size={14} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={styles.cognitiveLabel}>Attention stability vector</Text>
                </View>
                <Text style={styles.cognitiveVal}>{report.attentionStability}% rating</Text>
              </View>

            </View>
          </View>

          {/* CARBON & CONTEXT IMPACT CARD */}
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.15)', 'rgba(59, 130, 246, 0.05)']}
            style={styles.impactCard}>
            <View style={styles.row}>
              <Flame size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.impactTitle}>Developer Context Impact</Text>
            </View>
            <Text style={styles.impactDesc}>
              Estimates efficiency savings gained by blocking context switches.
            </Text>

            <View style={styles.impactGrid}>
              
              <View style={styles.impactCell}>
                <Text style={styles.impactCellLabel}>Switches Prevented</Text>
                <CountUpText value={report.switchesPrevented} style={styles.impactCellValGreen} />
              </View>

              <View style={styles.impactCell}>
                <Text style={styles.impactCellLabel}>Minutes Saved</Text>
                <CountUpText value={report.savedMinutes} suffix=" min" style={styles.impactCellValGreen} />
              </View>

              <View style={styles.impactCell}>
                <Text style={styles.impactCellLabel}>Weekly Gains</Text>
                <Text style={styles.impactCellValCyan}>+{report.weeklyImprovement}%</Text>
              </View>

            </View>

            <View style={styles.impactDivider} />
            <Text style={styles.impactSummaryText}>
              By buffering low-severity notifications in the queue, you preserved {report.savedMinutes} minutes of raw cognitive deep focus state, avoiding typical context re-entry lag.
            </Text>
          </LinearGradient>

          {/* AI INSIGHTS CARD */}
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.15)', 'rgba(217, 70, 239, 0.05)']}
            style={styles.aiCard}>
            <View style={styles.row}>
              <Sparkles size={16} color="#D946EF" style={{ marginRight: 8 }} />
              <Text style={styles.aiTitle}>AI Productivity Insights</Text>
            </View>

            <View style={styles.aiList}>
              <View style={styles.aiRow}>
                <Text style={styles.aiLabel}>Peak Focus Window</Text>
                <Text style={styles.aiValue}>9:00 AM – 11:30 AM</Text>
              </View>
              <View style={styles.aiRow}>
                <Text style={styles.aiLabel}>Distraction Peaks</Text>
                <Text style={styles.aiValuePink}>2:00 PM – 3:00 PM</Text>
              </View>
              <View style={styles.aiDivider} />
              <Text style={styles.aiRecommendationTitle}>Recommendation</Text>
              <Text style={styles.aiRecommendationText}>
                Your cognitive metrics show peak code modification velocity before 12 PM. We recommend scheduling all collaborative team syncs and alignment blocks after 3:00 PM to isolate your optimal focus windows.
              </Text>
            </View>
          </LinearGradient>

          {/* EXPORT OPTIONS PANEL */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Export Analytics Report</Text>
            <Text style={styles.chartDesc}>
              Compile cognitive efficiency metrics to share with your leadership dashboard.
            </Text>

            <View style={styles.exportRow}>
              
              <TouchableOpacity
                onPress={() => handleExport('pdf')}
                style={styles.exportBtn}>
                <FileText size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.exportBtnText}>PDF Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleExport('csv')}
                style={styles.exportBtn}>
                <FileSpreadsheet size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.exportBtnText}>CSV Sheet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleExport('share')}
                style={[styles.exportBtn, styles.btnActivePurple]}>
                <Share2 size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.exportBtnText}>Share</Text>
              </TouchableOpacity>

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
    paddingBottom: 10,
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  rangeTabActive: {
    backgroundColor: '#8B5CF6',
  },
  rangeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  rangeTabTextActive: {
    color: '#FFF',
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
  summaryMiniCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryMiniCard: {
    width: '48%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  miniCardLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  miniCardValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  miniCardTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  miniCardTrendText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  miniCardTrendBlue: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
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
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  chartDesc: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 12,
  },
  chartContainer: {
    marginVertical: 10,
  },
  chartXLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  xLabelText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  heatmapWrapper: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  heatmapHoursHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  heatmapHeaderColText: {
    flex: 1,
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heatmapRowText: {
    width: 35,
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  heatmapCell: {
    flex: 1,
    height: 18,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  heatmapLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
    marginTop: 15,
  },
  heatmapLegendLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  legendIndicatorCell: {
    width: 10,
    height: 10,
    borderRadius: 2.5,
  },
  legendIndicatorText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 3,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    marginTop: 6,
  },
  statsCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsCardCell: {
    width: '48%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 16,
  },
  statsCardVal: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  statsCardSubVal: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  statsCardLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  cognitiveList: {
    marginTop: 8,
  },
  cognitiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  cognitiveLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  cognitiveVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  impactCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 20,
    marginBottom: 16,
  },
  impactTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  impactDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  impactCell: {
    flex: 1,
  },
  impactCellLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  impactCellValGreen: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  impactCellValCyan: {
    color: '#06B6D4',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  impactDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  impactSummaryText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    fontWeight: '500',
  },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    padding: 20,
    marginBottom: 20,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  aiList: {
    marginTop: 12,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aiLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  aiValue: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '800',
  },
  aiValuePink: {
    color: '#D946EF',
    fontSize: 12,
    fontWeight: '800',
  },
  aiDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 10,
  },
  aiRecommendationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D946EF',
    textTransform: 'uppercase',
  },
  aiRecommendationText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  exportBtn: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 11,
  },
  btnActivePurple: {
    backgroundColor: '#8B5CF6',
    borderColor: '#C084FC',
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
