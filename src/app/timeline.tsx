import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshControl,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  Layout,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Clock,
  Play,
  Pause,
  FastForward,
  Rewind,
  RotateCcw,
  Coffee,
  Shield,
  Zap,
  Bell,
  Unlock,
  Layers,
  CheckCircle2,
  Trash2,
  FileText,
  Award,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Inbox,
  ChevronDown,
  Calendar,
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { timelineService } from '@/services/api';
import { useShield } from '@/context/ShieldContext';

const { width } = Dimensions.get('window');

// ─── Event Icons Config ──────────────────────────────────────────────────────
const EVENT_CONFIGS: Record<string, { icon: any; color: string; bg: string }> = {
  'Coding Started': { icon: Play, color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)' },
  'Coding Stopped': { icon: Coffee, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' },
  'Focus Score Changed': { icon: Shield, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  'Velocity Changed': { icon: Zap, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  'Notification Received': { icon: Bell, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  'Notification Allowed': { icon: Unlock, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  'Notification Queued': { icon: Layers, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  'Queue Released': { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  'Queue Cleared': { icon: Trash2, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  'Digest Generated': { icon: FileText, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  'Demo Started': { icon: Sparkles, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.2)' },
  'Demo Finished': { icon: Award, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' },
  'Break Suggested': { icon: Coffee, color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' },
  'Default': { icon: HelpCircle, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' },
};

function getEventConfig(type: string) {
  return EVENT_CONFIGS[type] || EVENT_CONFIGS.Default;
}

// ─── Helper: Format Timestamp to relative or local time ─────────────────────
function formatTime(timestamp: string) {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateGroup(timestamp: string) {
  try {
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  } catch {
    return 'Older';
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TimelineRoute() {
  const queryClient = useQueryClient();
  const { focusScore, queue } = useShield();

  // Filters & State
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'demo'>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(25);
  const [refreshing, setRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Reanimated shimmer effect
  const shimmerVal = useSharedValue(0.4);
  useEffect(() => {
    shimmerVal.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmerVal.value }));

  // Auto-refresh when global context state updates (FocusScore, Queue length changing)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['timeline'] });
  }, [focusScore, queue.length]);

  // Query config
  const queryKey = ['timeline', filterType, selectedEventType, limit];
  const queryFn = async () => {
    const eventTypeParam = selectedEventType === 'All' ? undefined : selectedEventType;
    
    switch (filterType) {
      case 'today':
        return timelineService.fetchToday();
      case 'week':
        return timelineService.fetchWeek();
      case 'demo':
        return timelineService.fetchDemo();
      case 'all':
      default:
        return timelineService.fetchTimeline({
          event_type: eventTypeParam,
          limit,
        });
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn,
    refetchInterval: 5000, // Polling auto refresh every 5 seconds
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const loadMore = () => {
    if (data && data.length >= limit) {
      setLimit(prev => prev + 25);
    }
  };

  // Client side Search filter logic
  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return data.filter(event => {
      const titleMatch = event.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || descMatch;
    });
  }, [data, searchQuery]);

  // Group events by date for timeline sectioning
  const groupedEvents = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredEvents.forEach(event => {
      const groupKey = formatDateGroup(event.timestamp);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });
    return Object.entries(groups);
  }, [filteredEvents]);

  // Unique event types for dropdown filtering
  const allEventTypes = [
    'All',
    'Coding Started',
    'Coding Stopped',
    'Focus Score Changed',
    'Velocity Changed',
    'Notification Received',
    'Notification Allowed',
    'Notification Queued',
    'Queue Released',
    'Queue Cleared',
    'Digest Generated',
    'Demo Started',
    'Demo Finished',
    'Break Suggested'
  ];

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#07080D" />
      <LinearGradient colors={['#07080D', '#0F1117', '#0D0E14']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* ─── Header ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconBox}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.25)', 'rgba(139, 92, 246, 0.08)']}
                style={styles.headerIconGradient}
              >
                <Clock size={22} color="#A855F7" />
              </LinearGradient>
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Focus Replay</Text>
              <Text style={styles.headerSubtitle}>Event timeline and session history</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} activeOpacity={0.7}>
              <RefreshCw size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── Search & Filters Section ────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.searchFilterContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search timeline events..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Time range selectors */}
          <View style={styles.filterRow}>
            {(['all', 'today', 'week', 'demo'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, filterType === tab && styles.filterTabActive]}
                onPress={() => {
                  setFilterType(tab);
                  setLimit(25);
                }}
              >
                <Text style={[styles.filterTabText, filterType === tab && styles.filterTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Event type selector (when filter is 'all') */}
          {filterType === 'all' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroller}
              contentContainerStyle={styles.typeScrollerContent}
            >
              {allEventTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, selectedEventType === type && styles.typeChipActive]}
                  onPress={() => setSelectedEventType(type)}
                >
                  <Text style={[styles.typeChipText, selectedEventType === type && styles.typeChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ─── Playback Controls ─────────────────────────────── */}
          <View style={styles.playbackControls}>
            <TouchableOpacity 
              style={styles.playbackBtn} 
              onPress={() => console.log('Rewind')}
            >
              <Rewind size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playbackBtnMain} 
              onPress={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause size={24} color="#FFF" />
              ) : (
                <Play size={24} color="#FFF" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playbackBtn} 
              onPress={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
            >
              <FastForward size={20} color="#94A3B8" />
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playbackBtn} 
              onPress={() => setIsPlaying(false)}
            >
              <RotateCcw size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── Scroll View Content ─────────────────────────────── */}
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
          {/* Loading view */}
          {isLoading && !data && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#A855F7" />
              <Text style={styles.loadingText}>Replaying focus sessions...</Text>
            </Animated.View>
          )}

          {/* Error view */}
          {isError && !data && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.errorCard}>
              <AlertTriangle size={32} color="#EF4444" />
              <Text style={styles.errorTitle}>Failed to load timeline</Text>
              <Text style={styles.errorSubtext}>{(error as any)?.message || 'Something went wrong.'}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Empty state */}
          {data && filteredEvents.length === 0 && (
            <Animated.View entering={FadeInUp.duration(600)} style={styles.emptyContainer}>
              <Inbox size={48} color="#64748B" />
              <Text style={styles.emptyTitle}>No Timeline Events</Text>
              <Text style={styles.emptySubtext}>
                No focus score updates, telemetry streams, or notifications matched your criteria.
              </Text>
            </Animated.View>
          )}

          {/* ─── Timeline Feed ───────────────────────────────────── */}
          {groupedEvents.map(([dateGroup, eventsList], groupIdx) => (
            <View key={dateGroup} style={styles.dateGroupContainer}>
              <Text style={styles.dateHeader}>{dateGroup}</Text>

              {eventsList.map((event, eventIdx) => {
                const config = getEventConfig(event.event_type);
                const IconComponent = config.icon;
                const isLastItem = groupIdx === groupedEvents.length - 1 && eventIdx === eventsList.length - 1;

                // Safely parse JSON metadata if available
                let metadata: Record<string, any> = {};
                if (event.metadata_json) {
                  try {
                    metadata = JSON.parse(event.metadata_json);
                  } catch (e) {
                    // Fail silently
                  }
                }

                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeInDown.delay(eventIdx * 80).duration(450)}
                    style={styles.timelineRow}
                  >
                    {/* Time Label on left */}
                    <View style={styles.timeLabelContainer}>
                      <Text style={styles.timeLabelText}>{formatTime(event.timestamp)}</Text>
                    </View>

                    {/* Node / Line Column */}
                    <View style={styles.nodeColumn}>
                      <View style={[styles.timelineNode, { backgroundColor: config.bg, borderColor: config.color }]}>
                        <IconComponent size={14} color={config.color} />
                      </View>
                      {!isLastItem && <View style={styles.timelineLine} />}
                    </View>

                    {/* Timeline Glass Card */}
                    <View style={styles.timelineCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{event.title}</Text>
                        <View style={[styles.eventTag, { backgroundColor: config.bg }]}>
                          <Text style={[styles.eventTagText, { color: config.color }]}>
                            {event.event_type}
                          </Text>
                        </View>
                      </View>

                      {event.description ? (
                        <Text style={styles.cardDesc}>{event.description}</Text>
                      ) : null}

                      {/* Render Dynamic Metadata Badges */}
                      {Object.keys(metadata).length > 0 && (
                        <View style={styles.metadataContainer}>
                          {Object.entries(metadata).map(([key, val]) => (
                            <View key={key} style={styles.metadataBadge}>
                              <Text style={styles.metadataKey}>{key}:</Text>
                              <Text style={styles.metadataVal}>{String(val)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          ))}

          {/* Load More Trigger */}
          {data && data.length >= limit && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.7}>
              <Text style={styles.loadMoreText}>Load Older Events</Text>
              <ChevronDown size={16} color="#A855F7" />
            </TouchableOpacity>
          )}

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
    paddingTop: 12,
  },

  // Header
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 8 : 12,
    marginBottom: 16,
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

  // Search & Filters
  searchFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  filterTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#E9D5FF',
  },
  typeScroller: {
    marginTop: 2,
  },
  typeScrollerContent: {
    gap: 8,
    paddingRight: 16,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  typeChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#A855F7',
  },
  typeChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  // Loading / Error
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Date sections
  dateGroupContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
    paddingLeft: 4,
  },

  // Timeline components
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeLabelContainer: {
    width: 65,
    paddingTop: 8,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timeLabelText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  nodeColumn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 2,
  },
  timelineLine: {
    width: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    position: 'absolute',
    top: 24,
    bottom: -16,
    zIndex: 1,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
    marginLeft: 4,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metadataBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  metadataKey: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metadataVal: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },

  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.12)',
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  loadMoreText: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 20,
  },
  playbackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  playbackBtnMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  speedText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    position: 'absolute',
    bottom: 2,
  },
});
