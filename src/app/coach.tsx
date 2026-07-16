import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Sparkles,
  Target,
  TrendingUp,
  Brain,
  Clock,
  Smartphone,
  Shield,
  Layers,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/api';

const { width } = Dimensions.get('window');
const AnimatedView = Animated.createAnimatedComponent(View);

// Reusable CountUp component
function CountUpText({ value, suffix = '', prefix = '', duration = 800, style }: { value: number, suffix?: string, prefix?: string, duration?: number, style?: any }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setCurrent(0);
      return;
    }
    const increment = end / (duration / 16); 
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

export default function CoachScreen() {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['coach', timeframe],
    queryFn: () => coachService.fetchCoachData(timeframe),
    staleTime: 1000 * 60 * 5, 
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getBurnoutColor = (risk: string) => {
    if (risk === 'High') return '#EF4444';
    if (risk === 'Medium') return '#F59E0B';
    return '#10B981';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'Improving') return '#10B981';
    if (trend === 'Declining') return '#EF4444';
    return '#3B82F6';
  };

  if (isError) {
    return (
      <LinearGradient colors={['#07080D', '#0F0E23', '#1A0C2F']} style={styles.container}>
        <SafeAreaView style={styles.centerArea}>
          <AlertTriangle color="#EF4444" size={48} />
          <Text style={styles.errorText}>Failed to load AI Coach data</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
            <Text style={styles.headerTitle}>AI Productivity Coach</Text>
            <Text style={styles.headerSubtitle}>Intelligent behavior analysis & recommendations</Text>
          </View>
        </View>

        {/* TIMEFRAME SELECTOR */}
        <View style={styles.rangeSelectorContainer}>
          {(['today', 'week', 'month'] as const).map(tf => (
            <TouchableOpacity
              key={tf}
              onPress={() => setTimeframe(tf)}
              style={[styles.rangeTab, timeframe === tf && styles.rangeTabActive]}>
              <Text style={[styles.rangeTabText, timeframe === tf && styles.rangeTabTextActive]}>
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && !data ? (
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color="#A855F7" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#A855F7" />
            }
          >
            {/* OVERALL SCORES */}
            <AnimatedView entering={FadeInUp.delay(100).springify()} style={styles.scoreCardsRow}>
              <View style={styles.mainScoreCard}>
                <Sparkles size={20} color="#D946EF" style={{ marginBottom: 8 }} />
                <CountUpText value={data.overall_ai_score} style={styles.mainScoreVal} />
                <Text style={styles.mainScoreLabel}>Overall AI Score</Text>
              </View>
              <View style={styles.mainScoreCard}>
                <Target size={20} color="#3B82F6" style={{ marginBottom: 8 }} />
                <CountUpText value={data.productivity_score} style={styles.mainScoreVal} />
                <Text style={styles.mainScoreLabel}>Productivity</Text>
              </View>
            </AnimatedView>

            {/* AI RECOMMENDATIONS */}
            <AnimatedView entering={FadeInUp.delay(200).springify()} style={styles.glassCard}>
              <View style={styles.row}>
                <Brain size={18} color="#D946EF" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>AI Recommendations</Text>
              </View>
              <View style={styles.recsList}>
                {data.ai_recommendations.map((rec: string, idx: number) => (
                  <View key={idx} style={styles.recItem}>
                    <View style={styles.recDot} />
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </AnimatedView>

            {/* KEY METRICS GRID */}
            <Text style={styles.sectionHeading}>Behavioral Analysis</Text>
            <View style={styles.statsCardGrid}>
              
              <AnimatedView entering={FadeInUp.delay(300).springify()} style={styles.statsCardCell}>
                <TrendingUp size={16} color={getTrendColor(data.focus_trend)} style={{ marginBottom: 6 }} />
                <Text style={[styles.statsTextVal, { color: getTrendColor(data.focus_trend) }]}>{data.focus_trend}</Text>
                <Text style={styles.statsCardLabel}>Focus Trend</Text>
              </AnimatedView>

              <AnimatedView entering={FadeInUp.delay(350).springify()} style={styles.statsCardCell}>
                <Activity size={16} color={getBurnoutColor(data.burnout_risk)} style={{ marginBottom: 6 }} />
                <Text style={[styles.statsTextVal, { color: getBurnoutColor(data.burnout_risk) }]}>{data.burnout_risk}</Text>
                <Text style={styles.statsCardLabel}>Burnout Risk</Text>
              </AnimatedView>

              <AnimatedView entering={FadeInUp.delay(400).springify()} style={styles.statsCardCell}>
                <Clock size={16} color="#8B5CF6" style={{ marginBottom: 6 }} />
                <CountUpText value={Math.floor(data.deep_work_duration_minutes / 60)} suffix="h" style={styles.statsCardVal} />
                <CountUpText value={data.deep_work_duration_minutes % 60} suffix="m" style={styles.statsCardSubVal} />
                <Text style={styles.statsCardLabel}>Deep Work</Text>
              </AnimatedView>

              <AnimatedView entering={FadeInUp.delay(450).springify()} style={styles.statsCardCell}>
                <Shield size={16} color="#10B981" style={{ marginBottom: 6 }} />
                <CountUpText value={data.saved_interruptions} style={styles.statsCardVal} />
                <Text style={styles.statsCardLabel}>Saved Interruptions</Text>
              </AnimatedView>

            </View>

            {/* INSIGHTS */}
            <AnimatedView entering={FadeInUp.delay(500).springify()} style={styles.glassCard}>
              <View style={styles.row}>
                <Zap size={18} color="#06B6D4" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Deeper Insights</Text>
              </View>

              <View style={styles.insightRow}>
                <View style={styles.row}>
                  <Clock size={15} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={styles.insightLabel}>Peak Focus Hours</Text>
                </View>
                <View>
                  {data.peak_focus_hours.map((h: string, i: number) => (
                    <Text key={i} style={styles.insightVal}>{h}</Text>
                  ))}
                  {data.peak_focus_hours.length === 0 && <Text style={styles.insightVal}>N/A</Text>}
                </View>
              </View>

              <View style={styles.insightRow}>
                <View style={styles.row}>
                  <Smartphone size={15} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={styles.insightLabel}>Most Distracting Apps</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {data.most_distracting_apps.map((a: string, i: number) => (
                    <Text key={i} style={styles.insightValRed}>{a}</Text>
                  ))}
                  {data.most_distracting_apps.length === 0 && <Text style={styles.insightVal}>None</Text>}
                </View>
              </View>

              <View style={[styles.insightRow, { borderBottomWidth: 0 }]}>
                <View style={styles.row}>
                  <Layers size={15} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={styles.insightLabel}>Queue Efficiency</Text>
                </View>
                <Text style={styles.insightValGreen}>{data.queue_efficiency}%</Text>
              </View>

            </AnimatedView>
          </ScrollView>
        )}
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
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  scoreCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainScoreCard: {
    width: '48%',
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.15)',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#D946EF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  mainScoreVal: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  mainScoreLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  recsList: {
    marginTop: 15,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D946EF',
    marginTop: 6,
    marginRight: 10,
  },
  recText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
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
  statsTextVal: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
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
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  insightLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  insightVal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'right'
  },
  insightValRed: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'right'
  },
  insightValGreen: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
