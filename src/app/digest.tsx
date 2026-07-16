import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInUp,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import {
  Shield,
  Sparkles,
  Clock,
  AlertTriangle,
  Bell,
  Zap,
  RotateCw,
  FileText,
  TrendingUp,
  ChevronRight,
  Inbox,
  Timer,
  BarChart3,
  Layers,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { digestService } from '@/services/api';
import { useShield } from '@/context/ShieldContext';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const { width } = Dimensions.get('window');

const AnimatedView = Animated.createAnimatedComponent(View);

// ─── Types ──────────────────────────────────────────────────────────────────
interface DigestData {
  id: string;
  user_id: string;
  summary: string;
  notification_count: number;
  highest_urgency: number;
  time_saved_minutes: number;
  app_grouping: Record<string, number>;
  created_at: string;
  updated_at: string;
}

// ─── App Icon Colors ────────────────────────────────────────────────────────
const APP_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Slack: { bg: 'rgba(74, 21, 75, 0.4)', text: '#E879F9', icon: '#D946EF' },
  Teams: { bg: 'rgba(37, 99, 235, 0.25)', text: '#60A5FA', icon: '#3B82F6' },
  Email: { bg: 'rgba(234, 88, 12, 0.25)', text: '#FB923C', icon: '#F97316' },
  Gmail: { bg: 'rgba(239, 68, 68, 0.25)', text: '#FCA5A5', icon: '#EF4444' },
  PagerDuty: { bg: 'rgba(22, 163, 74, 0.25)', text: '#4ADE80', icon: '#22C55E' },
  GitHub: { bg: 'rgba(148, 163, 184, 0.2)', text: '#CBD5E1', icon: '#94A3B8' },
  Jira: { bg: 'rgba(59, 130, 246, 0.25)', text: '#93C5FD', icon: '#3B82F6' },
  WhatsApp: { bg: 'rgba(34, 197, 94, 0.25)', text: '#86EFAC', icon: '#22C55E' },
  Default: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', icon: '#64748B' },
};

function getAppStyle(name: string) {
  return APP_COLORS[name] || APP_COLORS.Default;
}

// ─── Urgency Label ──────────────────────────────────────────────────────────
function getUrgencyLabel(score: number) {
  if (score >= 0.9) return { label: 'Critical', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
  if (score >= 0.7) return { label: 'High', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
  if (score >= 0.5) return { label: 'Medium', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
  return { label: 'Low', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)' };
}

// ─── CountUp Text ───────────────────────────────────────────────────────────
function CountUpText({ value, suffix = '', style }: { value: number; suffix?: string; style?: any }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setCurrent(0); return; }
    const inc = end / (600 / 16);
    let id: number;
    const count = () => {
      start += inc;
      if (start >= end) { setCurrent(end); } else { setCurrent(Math.floor(start)); id = requestAnimationFrame(count); }
    };
    id = requestAnimationFrame(count);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <Text style={style}>{current}{suffix}</Text>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════════════════════
export default function DigestRoute() {
  return <DigestScreen />;
}

function DigestScreen() {
  const { queue } = useShield();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Pulse animation for the generate button
  const pulseVal = useSharedValue(1);
  useEffect(() => {
    pulseVal.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseVal.value }] }));

  // Shimmer glow
  const glowVal = useSharedValue(0.3);
  useEffect(() => {
    glowVal.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowVal.value }));

  // ─── Queries ────────────────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  
  const {
    data: latestDigest,
    isLoading: isLoadingLatest,
    isError: isErrorLatest,
    error: errorLatest,
    refetch: refetchLatest,
  } = useQuery<DigestData | null>({
    queryKey: ['digest', 'latest'],
    queryFn: digestService.getLatest,
    retry: 2,
    enabled: isAuthenticated,
  });

  const {
    data: historyDigests,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<DigestData[]>({
    queryKey: ['digest', 'history'],
    queryFn: () => digestService.getHistory(10),
    retry: 2,
    enabled: isAuthenticated,
  });

  // ─── Generate Mutation ──────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: digestService.generateDigest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest'] });
    },
  });

  // ─── Auto refresh when queue empties after being populated ──────────────
  const prevQueueLen = React.useRef(queue.length);
  useEffect(() => {
    if (prevQueueLen.current > 0 && queue.length === 0) {
      // Queue was released — auto refresh digests
      queryClient.invalidateQueries({ queryKey: ['digest'] });
    }
    prevQueueLen.current = queue.length;
  }, [queue.length]);

  // ─── Pull to Refresh ───────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchLatest(), refetchHistory()]);
    setRefreshing(false);
  }, []);

  const hasDigest = !!latestDigest;
  const isLoading = isLoadingLatest || isLoadingHistory;

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#07080D" />
      <LinearGradient colors={['#07080D', '#0F1117', '#0D0E14']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#A855F7"
              colors={['#A855F7']}
              progressBackgroundColor="#1A1B23"
            />
          }
        >
          {/* ─── Header ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.duration(500)} style={styles.headerSection}>
            <View style={styles.headerRow}>
              <View style={styles.headerIconBox}>
                <LinearGradient
                  colors={['rgba(168, 85, 247, 0.25)', 'rgba(139, 92, 246, 0.08)']}
                  style={styles.headerIconGradient}
                >
                  <Sparkles size={22} color="#A855F7" />
                </LinearGradient>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>AI Digest</Text>
                <Text style={styles.headerSubtitle}>Smart notification summaries</Text>
              </View>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
                <RotateCw size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ─── Loading State ────────────────────────────────────── */}
          {isLoading && !hasDigest && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
              <View style={[styles.loadingCard, { gap: 16, alignItems: 'stretch' }]}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Skeleton height={28} width="60%" style={{ marginBottom: 10 }} />
                  <Skeleton height={14} width="40%" />
                </View>
                <Skeleton height={80} borderRadius={16} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Skeleton height={60} style={{ flex: 1 }} borderRadius={14} />
                  <Skeleton height={60} style={{ flex: 1 }} borderRadius={14} />
                  <Skeleton height={60} style={{ flex: 1 }} borderRadius={14} />
                </View>
                <Skeleton height={100} borderRadius={16} />
              </View>
            </Animated.View>
          )}

          {/* ─── Error State ─────────────────────────────────────── */}
          {isErrorLatest && !hasDigest && !isLoading && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
              <View style={styles.errorCard}>
                <View style={styles.errorIconCircle}>
                  <AlertTriangle size={28} color="#F59E0B" />
                </View>
                <Text style={styles.errorTitle}>Unable to load digest</Text>
                <Text style={styles.errorSubtext}>
                  {(errorLatest as any)?.message || 'Please try again later'}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetchLatest()} activeOpacity={0.7}>
                  <RotateCw size={14} color="#FFF" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ─── Empty State ─────────────────────────────────────── */}
          {!hasDigest && !isLoading && !isErrorLatest && (
            <Animated.View entering={FadeInUp.duration(600)} style={styles.stateContainer}>
              <View style={styles.emptyCard}>
                <AnimatedView style={glowStyle}>
                  <LinearGradient
                    colors={['rgba(168, 85, 247, 0.12)', 'rgba(59, 130, 246, 0.06)']}
                    style={styles.emptyIconCircle}
                  >
                    <Inbox size={40} color="#A855F7" />
                  </LinearGradient>
                </AnimatedView>
                <Text style={styles.emptyTitle}>No Digests Yet</Text>
                <Text style={styles.emptySubtext}>
                  When notifications are queued during Deep Focus, generate a smart summary to review them all at once.
                </Text>
                {queue.length > 0 && (
                  <View style={styles.emptyQueueHint}>
                    <Layers size={14} color="#A855F7" />
                    <Text style={styles.emptyQueueText}>
                      {queue.length} notification{queue.length !== 1 ? 's' : ''} currently queued
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ─── Generate Button ─────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.generateSection}>
            <AnimatedView style={pulseStyle}>
              <TouchableOpacity
                onPress={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                activeOpacity={0.8}
                style={styles.generateBtnOuter}
              >
                <LinearGradient
                  colors={['#7C3AED', '#A855F7', '#C084FC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateBtnGradient}
                >
                  {generateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Sparkles size={20} color="#FFF" />
                  )}
                  <Text style={styles.generateBtnText}>
                    {generateMutation.isPending ? 'Generating...' : 'Generate AI Digest'}
                  </Text>
                  {queue.length > 0 && (
                    <View style={styles.queueBadge}>
                      <Text style={styles.queueBadgeText}>
                        {queue.length}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </AnimatedView>
          </Animated.View>

          {/* ─── Latest Digest Card ──────────────────────────────── */}
          {hasDigest && latestDigest && (
            <Animated.View entering={FadeInUp.delay(100).duration(600)}>
              <DigestCard digest={latestDigest} isLatest />
            </Animated.View>
          )}

          {/* ─── History Section ──────────────────────────────────── */}
          {historyDigests && historyDigests.length > 1 && (
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <FileText size={16} color="#94A3B8" />
                <Text style={styles.historySectionTitle}>Previous Digests</Text>
              </View>
              {historyDigests.slice(1, 6).map((d, idx) => (
                <Animated.View key={d.id} entering={SlideInRight.delay(idx * 80).duration(400)}>
                  <DigestCard digest={d} />
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Bottom Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Digest Card Component
// ═══════════════════════════════════════════════════════════════════════════
function DigestCard({ digest, isLatest = false }: { digest: DigestData; isLatest?: boolean }) {
  const urgency = getUrgencyLabel(digest.highest_urgency);
  const createdDate = new Date(digest.created_at);
  const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = createdDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const appEntries = Object.entries(digest.app_grouping);

  // Parse summary into parts
  const summaryLines = digest.summary.split('\n').filter(l => l.trim());
  const headerLine = summaryLines[0] || 'AI Focus Summary Compiled';
  const bulletLines = summaryLines.filter(l => l.startsWith('•') || l.startsWith('-'));
  const importantIdx = summaryLines.findIndex(l => l.toLowerCase().includes('most important'));
  const importantLine = importantIdx >= 0 && summaryLines[importantIdx + 1]
    ? summaryLines[importantIdx + 1]
    : '';

  // Structured recommendations based on actual data
  const recommendationText = useMemo(() => {
    if (digest.highest_urgency >= 0.8) {
      return "Critical notifications were buffered to protect your cognitive flow. We recommend addressing the high-urgency alerts immediately, followed by standard team communications.";
    }
    return "Excellent focus stability maintained. Low-urgency messages were successfully deferred. We suggest taking a 5-minute cognitive rest before your next deep work session.";
  }, [digest.highest_urgency]);

  // Tomorrow's goal recommendation based on time saved
  const goalText = useMemo(() => {
    if (digest.time_saved_minutes >= 10) {
      return "Goal: Aim to protect at least 80% of your workspace interruptions tomorrow to surpass today's saved focus time.";
    }
    return "Goal: Isolate your morning peak window (9:00 AM – 11:30 AM) to maintain flow state and buffer all team chatter.";
  }, [digest.time_saved_minutes]);

  return (
    <View style={[styles.digestCard, isLatest && styles.digestCardLatest]}>
      {/* Glass border glow */}
      {isLatest && (
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.15)', 'rgba(59, 130, 246, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.digestCardGlow}
        />
      )}

      {/* Card Header */}
      <View style={styles.digestCardHeader}>
        <View style={styles.digestCardHeaderLeft}>
          {isLatest && (
            <View style={styles.latestBadge}>
              <Zap size={10} color="#A855F7" />
              <Text style={styles.latestBadgeText}>LATEST REPORT</Text>
            </View>
          )}
          <Text style={styles.digestCardDate}>{dateStr} · {timeStr}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
          <AlertTriangle size={10} color={urgency.color} />
          <Text style={[styles.urgencyBadgeText, { color: urgency.color }]}>{urgency.label}</Text>
        </View>
      </View>

      {/* SECTION 1: TODAY'S SUMMARY */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.sectionContentCard}>
          <Text style={styles.summaryHeaderText}>{headerLine}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Bell size={12} color="#A855F7" />
          <CountUpText value={digest.notification_count} style={styles.statPillValue} />
          <Text style={styles.statPillLabel}>Notifications</Text>
        </View>
        <View style={styles.statPill}>
          <Timer size={12} color="#22C55E" />
          <CountUpText value={digest.time_saved_minutes} suffix="m" style={styles.statPillValueGreen} />
          <Text style={styles.statPillLabel}>Time Saved</Text>
        </View>
        <View style={styles.statPill}>
          <TrendingUp size={12} color="#F59E0B" />
          <Text style={styles.statPillValue}>{(digest.highest_urgency * 100).toFixed(0)}%</Text>
          <Text style={styles.statPillLabel}>Max Urgency</Text>
        </View>
      </View>

      {/* SECTION 2: HIGHLIGHTS */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        <View style={[styles.sectionContentCard, { gap: 10 }]}>
          {appEntries.length > 0 && (
            <View style={styles.appGroupGrid}>
              {appEntries.map(([app, count]) => {
                const appStyle = getAppStyle(app);
                return (
                  <View key={app} style={[styles.appGroupChip, { backgroundColor: appStyle.bg }]}>
                    <View style={[styles.appGroupDot, { backgroundColor: appStyle.icon }]} />
                    <Text style={[styles.appGroupChipText, { color: appStyle.text }]}>{app}</Text>
                    <View style={styles.appGroupCountBadge}>
                      <Text style={styles.appGroupCountText}>{count}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {importantLine ? (
            <View style={styles.importantSection}>
              <View style={styles.importantHeader}>
                <AlertTriangle size={13} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.importantLabel}>Priority Warning</Text>
              </View>
              <Text style={styles.importantText}>{importantLine}</Text>
            </View>
          ) : null}

          {bulletLines.length > 0 && (
            <View style={{ marginTop: 6, gap: 4 }}>
              {bulletLines.map((line, idx) => (
                <Text key={idx} style={{ color: '#94A3B8', fontSize: 13, lineHeight: 18 }}>
                  {line}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* SECTION 3: RECOMMENDATIONS */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.08)', 'rgba(59, 130, 246, 0.03)']}
          style={styles.sectionContentCard}
        >
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Sparkles size={14} color="#A855F7" style={{ marginTop: 2 }} />
            <Text style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 19, flex: 1 }}>
              {recommendationText}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* SECTION 4: TOMORROW'S GOAL */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Tomorrow's Goal</Text>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.08)', 'rgba(16, 185, 129, 0.03)']}
          style={styles.sectionContentCard}
        >
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <TrendingUp size={14} color="#22C55E" style={{ marginTop: 2 }} />
            <Text style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '500' }}>
              {goalText}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#07080D',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 8 : 12,
  },

  // ─── Header ─────────────────────────────────────────────────
  headerSection: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    marginRight: 14,
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── State Containers ───────────────────────────────────────
  stateContainer: {
    marginBottom: 20,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },
  errorCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    padding: 32,
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
    gap: 6,
  },
  retryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Empty State ────────────────────────────────────────────
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 40,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  emptyQueueHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  emptyQueueText: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: '500',
  },

  // ─── Generate Button ────────────────────────────────────────
  generateSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  generateBtnOuter: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  generateBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  generateBtnTextDisabled: {
    color: '#64748B',
  },
  queueBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  queueBadgeDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  queueBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Digest Card ────────────────────────────────────────────
  digestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  digestCardLatest: {
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  digestCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  digestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  digestCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  latestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  latestBadgeText: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  digestCardDate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Summary ────────────────────────────────────────────────
  summaryHeaderText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },

  // ─── Stats Row ──────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statPillValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statPillValueGreen: {
    color: '#4ADE80',
    fontSize: 20,
    fontWeight: '800',
  },
  statPillLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ─── App Grouping ───────────────────────────────────────────
  appGroupSection: {
    marginBottom: 16,
  },
  appGroupTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  appGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  appGroupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appGroupChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appGroupCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  appGroupCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Important Section ──────────────────────────────────────
  importantSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.12)',
    padding: 14,
  },
  importantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  importantLabel: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  importantText: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ─── History Section ────────────────────────────────────────
  historySection: {
    marginTop: 8,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  historySectionTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  // ─── AI Section Layout Styles ────────────────────────────────
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#A855F7',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionContentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
});
