import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  SlideInRight,
  FadeIn,
} from 'react-native-reanimated';
import {
  Shield,
  Bell,
  Search,
  X,
  Check,
  Zap,
  Info,
  Clock,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  FileCode,
  GitPullRequest,
  Volume2,
  Filter,
  SortAsc,
  SortDesc,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react-native';

import { useShield } from '@/context/ShieldContext';

const { width } = Dimensions.get('window');
const AnimatedView = Animated.createAnimatedComponent(View);

// ─── Types ────────────────────────────────────────────────────────────────────

type DecisionStatus = 'Allowed' | 'Blocked' | 'Queued' | 'Critical' | 'Released';
type TimeFilter = 'Any Time' | 'Today' | 'Yesterday' | 'This Week' | 'This Month';
type SortField = 'time' | 'priority' | 'status';
type SortDir = 'asc' | 'desc';

interface NotifRow {
  id: string;
  time: string;            // HH:MM
  timestamp: Date;
  app: string;
  sender: string;
  title: string;
  body: string;
  priority: number;        // 0.0–1.0
  decision: DecisionStatus;
  reason: string;
  releasedTime?: string;
  focusScore: number;
}

// ─── Badge helper ─────────────────────────────────────────────────────────────

const BADGE: Record<DecisionStatus, { bg: string; border: string; text: string; dot: string }> = {
  Allowed:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#10B981', dot: '#10B981' },
  Blocked:  { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',  text: '#EF4444', dot: '#EF4444' },
  Queued:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)', text: '#F59E0B', dot: '#F59E0B' },
  Critical: { bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.35)', text: '#C084FC', dot: '#A855F7' },
  Released: { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)', text: '#60A5FA', dot: '#3B82F6' },
};

function StatusBadge({ status }: { status: DecisionStatus }) {
  const b = BADGE[status] ?? BADGE.Allowed;
  return (
    <View style={[ss.badge, { backgroundColor: b.bg, borderColor: b.border }]}>
      <View style={[ss.badgeDot, { backgroundColor: b.dot }]} />
      <Text style={[ss.badgeText, { color: b.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

// ─── App Icon ─────────────────────────────────────────────────────────────────

function AppIcon({ app }: { app: string }) {
  const lower = app.toLowerCase();
  const Icon =
    lower.includes('slack')     ? MessageSquare :
    lower.includes('teams')     ? Volume2 :
    lower.includes('github')    ? GitPullRequest :
    lower.includes('pagerduty') ? AlertTriangle :
    lower.includes('jira')      ? FileCode :
    Mail;
  const color =
    lower.includes('slack')     ? '#4ADE80' :
    lower.includes('teams')     ? '#60A5FA' :
    lower.includes('github')    ? '#E2E8F0' :
    lower.includes('pagerduty') ? '#F87171' :
    lower.includes('jira')      ? '#818CF8' :
    '#C084FC';
  return (
    <View style={[ss.appIcon, { borderColor: color + '44' }]}>
      <Icon size={13} color={color} />
    </View>
  );
}

// ─── Priority bar ─────────────────────────────────────────────────────────────

function PriorityBar({ value }: { value: number }) {
  const pct = Math.min(1, Math.max(0, value));
  const color = pct > 0.8 ? '#EF4444' : pct > 0.5 ? '#F59E0B' : '#10B981';
  return (
    <View style={ss.priBarBg}>
      <View style={[ss.priBarFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const glow = useSharedValue(0.4);
  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0.4, { duration: 1800 })), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={ss.emptyWrap}>
      <AnimatedView style={[ss.emptyGlow, glowStyle]} />
      <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
        <G>
          <Path
            d="M36 6L8 20v16c0 16.57 11.89 32.06 28 36 16.11-3.94 28-19.43 28-36V20L36 6z"
            fill="rgba(139,92,246,0.15)"
            stroke="rgba(139,92,246,0.5)"
            strokeWidth="1.5"
          />
          <Path
            d="M36 14L14 26v12c0 12.43 8.92 24.05 22 27 13.08-2.95 22-14.57 22-27V26L36 14z"
            fill="rgba(139,92,246,0.08)"
          />
          <Check
            size={22}
            color="#8B5CF6"
            style={{ position: 'absolute', top: 25, left: 25 } as any}
          />
        </G>
      </Svg>
      <Text style={ss.emptyTitle}>Shield is Watching</Text>
      <Text style={ss.emptyBody}>
        Your Cognitive Shield has not intercepted any{'\n'}notifications matching this filter.
      </Text>
    </View>
  );
}

// ─── Details Drawer ───────────────────────────────────────────────────────────

function DetailsDrawer({ item, onClose }: { item: NotifRow; onClose: () => void }) {
  const b = BADGE[item.decision] ?? BADGE.Allowed;
  const drawerAnim = useSharedValue(0);
  useEffect(() => {
    drawerAnim.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, []);
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - drawerAnim.value) * 420 }],
    opacity: drawerAnim.value,
  }));

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={ss.overlay} onPress={onClose} />
      <AnimatedView style={[ss.drawer, drawerStyle]}>
        <LinearGradient colors={['#0D0B1E', '#1A0C2F']} style={ss.drawerInner}>
          {/* Header */}
          <View style={ss.drawerHeader}>
            <Text style={ss.drawerTitle}>Notification Details</Text>
            <TouchableOpacity onPress={onClose} style={ss.drawerCloseBtn}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* App + Title */}
            <View style={ss.drawerAppRow}>
              <AppIcon app={item.app} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.drawerAppName}>{item.app}</Text>
                <Text style={ss.drawerSender}>{item.sender}</Text>
              </View>
              <StatusBadge status={item.decision} />
            </View>

            {/* Title */}
            <Text style={ss.drawerFieldLabel}>TITLE</Text>
            <Text style={ss.drawerFieldValue}>{item.title}</Text>

            {/* Body */}
            <Text style={ss.drawerFieldLabel}>BODY</Text>
            <View style={ss.drawerBodyBox}>
              <Text style={ss.drawerBodyText}>{item.body}</Text>
            </View>

            {/* Metadata grid */}
            <View style={ss.drawerGrid}>
              <View style={ss.drawerGridCell}>
                <Text style={ss.drawerCellLabel}>PRIORITY</Text>
                <Text style={[ss.drawerCellValue, { color: item.priority > 0.8 ? '#EF4444' : item.priority > 0.5 ? '#F59E0B' : '#10B981' }]}>
                  {Math.round(item.priority * 100)}%
                </Text>
                <PriorityBar value={item.priority} />
              </View>
              <View style={ss.drawerGridCell}>
                <Text style={ss.drawerCellLabel}>FOCUS AT ARRIVAL</Text>
                <Text style={ss.drawerCellValue}>{item.focusScore}</Text>
              </View>
              <View style={ss.drawerGridCell}>
                <Text style={ss.drawerCellLabel}>DECISION</Text>
                <Text style={[ss.drawerCellValue, { color: b.text }]}>{item.decision}</Text>
              </View>
              <View style={ss.drawerGridCell}>
                <Text style={ss.drawerCellLabel}>TIMESTAMP</Text>
                <Text style={ss.drawerCellValue}>{item.timestamp.toLocaleString()}</Text>
              </View>
              {item.releasedTime && (
                <View style={[ss.drawerGridCell, { width: '100%' }]}>
                  <Text style={ss.drawerCellLabel}>RELEASED TIME</Text>
                  <Text style={ss.drawerCellValue}>{item.releasedTime}</Text>
                </View>
              )}
            </View>

            {/* Reason */}
            <Text style={ss.drawerFieldLabel}>SHIELD REASON</Text>
            <View style={[ss.drawerBodyBox, { borderColor: b.border, backgroundColor: b.bg }]}>
              <Info size={12} color={b.text} style={{ marginBottom: 4 }} />
              <Text style={[ss.drawerBodyText, { color: b.text }]}>{item.reason || 'No reason recorded.'}</Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </AnimatedView>
    </Modal>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 52;

function TableRow({
  item,
  isEven,
  onPress,
}: {
  item: NotifRow;
  isEven: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[ss.tableRow, isEven ? ss.tableRowEven : ss.tableRowOdd]}>
      {/* Time */}
      <View style={[ss.cell, ss.cellTime]}>
        <Text style={ss.cellTimeText}>{item.time}</Text>
      </View>
      {/* App */}
      <View style={[ss.cell, ss.cellApp]}>
        <View style={ss.cellAppInner}>
          <AppIcon app={item.app} />
          <Text style={ss.cellAppText} numberOfLines={1}>{item.app}</Text>
        </View>
      </View>
      {/* Title */}
      <View style={[ss.cell, ss.cellTitle]}>
        <Text style={ss.cellTitleText} numberOfLines={2}>{item.title}</Text>
      </View>
      {/* Priority */}
      <View style={[ss.cell, ss.cellPriority]}>
        <PriorityBar value={item.priority} />
        <Text style={ss.cellPriorityPct}>{Math.round(item.priority * 100)}%</Text>
      </View>
      {/* Status */}
      <View style={[ss.cell, ss.cellStatus]}>
        <StatusBadge status={item.decision} />
      </View>
      {/* Reason */}
      <View style={[ss.cell, ss.cellReason]}>
        <Text style={ss.cellReasonText} numberOfLines={2}>{item.reason || '—'}</Text>
      </View>
      {/* Actions */}
      <View style={[ss.cell, ss.cellActions]}>
        <TouchableOpacity onPress={onPress} style={ss.detailsBtn}>
          <ChevronRight size={13} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Sort Header Cell ─────────────────────────────────────────────────────────

function SortCell({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  style,
}: {
  label: string;
  field: SortField | null;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  style?: any;
}) {
  const active = field === sortField;
  return (
    <TouchableOpacity
      style={[ss.thCell, style]}
      onPress={() => field && onSort(field)}
      disabled={!field}>
      <Text style={[ss.thText, active && ss.thTextActive]}>{label}</Text>
      {field && (
        active
          ? (sortDir === 'asc' ? <ChevronUp size={10} color="#8B5CF6" /> : <ChevronDown size={10} color="#8B5CF6" />)
          : <ArrowUpDown size={10} color="#475569" />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsRoute() {
  return <NotificationLogsScreen />;
}

function NotificationLogsScreen() {
  const { notifications: ctxNotifs, queue, focusScore, releaseTop, deleteQueueItem } = useShield();

  // Map context notifications to our table rows
  const allRows = useMemo<NotifRow[]>(() => {
    return ctxNotifs.map((n) => {
      const isQueued = queue.some((q) => q.id === n.id);
      let decision: DecisionStatus =
        n.status === 'Critical' ? 'Critical' :
        n.status === 'Blocked' && isQueued ? 'Queued' :
        n.status === 'Blocked' ? 'Blocked' :
        'Allowed';

      const appName =
        n.sender.toLowerCase().includes('slack')     ? 'Slack' :
        n.sender.toLowerCase().includes('teams')     ? 'Teams' :
        n.sender.toLowerCase().includes('github')    ? 'GitHub' :
        n.sender.toLowerCase().includes('pagerduty') ? 'PagerDuty' :
        n.sender.toLowerCase().includes('jira')      ? 'Jira' :
        n.sender.toLowerCase().includes('email')     ? 'Email' :
        n.sender;

      const ts = new Date(); // fallback
      return {
        id: n.id,
        time: n.time,
        timestamp: ts,
        app: appName,
        sender: n.sender,
        title: n.title,
        body: n.message,
        priority: n.urgencyScore,
        decision,
        reason: n.decisionText,
        focusScore: n.focusScore,
      };
    });
  }, [ctxNotifs, queue]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'All'>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Any Time');
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedRow, setSelectedRow] = useState<NotifRow | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live-update indicator
  const [pulseNew, setPulseNew] = useState(false);
  const prevCount = useRef(allRows.length);
  useEffect(() => {
    if (allRows.length > prevCount.current) {
      setPulseNew(true);
      setTimeout(() => setPulseNew(false), 1500);
    }
    prevCount.current = allRows.length;
  }, [allRows.length]);

  const pulseOp = useSharedValue(0.5);
  useEffect(() => {
    pulseOp.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.3, { duration: 900 })), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOp.value }));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const isInTimeWindow = useCallback((row: NotifRow): boolean => {
    if (timeFilter === 'Any Time') return true;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const ts = row.timestamp;
    if (timeFilter === 'Today') return ts >= today;
    if (timeFilter === 'Yesterday') return ts >= yesterday && ts < today;
    if (timeFilter === 'This Week') return ts >= weekAgo;
    if (timeFilter === 'This Month') return ts >= monthAgo;
    return true;
  }, [timeFilter]);

  // ── Computed rows ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = allRows;
    if (statusFilter !== 'All') rows = rows.filter((r) => r.decision === statusFilter);
    rows = rows.filter(isInTimeWindow);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.app.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.sender.toLowerCase().includes(q)
      );
    }
    // Sort
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'time') cmp = a.timestamp.getTime() - b.timestamp.getTime();
      else if (sortField === 'priority') cmp = a.priority - b.priority;
      else if (sortField === 'status') cmp = a.decision.localeCompare(b.decision);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [allRows, statusFilter, timeFilter, search, sortField, sortDir, isInTimeWindow]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: allRows.length,
    allowed: allRows.filter((r) => r.decision === 'Allowed').length,
    blocked: allRows.filter((r) => r.decision === 'Blocked').length,
    queued: allRows.filter((r) => r.decision === 'Queued').length,
    critical: allRows.filter((r) => r.decision === 'Critical').length,
  }), [allRows]);

  const STATUS_FILTERS: (DecisionStatus | 'All')[] = ['All', 'Allowed', 'Blocked', 'Queued', 'Critical', 'Released'];
  const TIME_FILTERS: TimeFilter[] = ['Any Time', 'Today', 'Yesterday', 'This Week', 'This Month'];

  const chipStyle = (active: boolean, decision?: DecisionStatus | 'All') => {
    if (!active) return [ss.chip, ss.chipOff];
    if (decision === 'Allowed') return [ss.chip, ss.chipGreen];
    if (decision === 'Blocked') return [ss.chip, ss.chipRed];
    if (decision === 'Queued') return [ss.chip, ss.chipAmber];
    if (decision === 'Critical') return [ss.chip, ss.chipPurple];
    if (decision === 'Released') return [ss.chip, ss.chipBlue];
    return [ss.chip, ss.chipDefault];
  };

  return (
    <LinearGradient colors={['#07080D', '#0F0E23', '#1A0C2F']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={ss.header}>
          <View>
            <Text style={ss.headerTitle}>Notification Logs</Text>
            <View style={ss.liveRow}>
              <AnimatedView style={[ss.liveDot, pulseStyle, { backgroundColor: pulseNew ? '#F59E0B' : '#10B981' }]} />
              <Text style={ss.liveText}>{pulseNew ? 'New notification received' : 'Live Shield Active'}</Text>
            </View>
          </View>
          <View style={ss.statPills}>
            {[
              { label: `${stats.allowed} Allowed`, color: '#10B981' },
              { label: `${stats.blocked} Blocked`, color: '#EF4444' },
              { label: `${stats.critical} Critical`, color: '#A855F7' },
            ].map((s) => (
              <View key={s.label} style={[ss.statPill, { borderColor: s.color + '44' }]}>
                <Text style={[ss.statPillText, { color: s.color }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {toastMsg && (
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={ss.toast}>
            <Info size={13} color="#FFF" style={{ marginRight: 7 }} />
            <Text style={ss.toastText}>{toastMsg}</Text>
          </LinearGradient>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scroll}>

          {/* ── Search ───────────────────────────────────────────────────── */}
          <View style={ss.searchWrap}>
            <Search size={15} color="#475569" style={{ marginLeft: 12, marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by app, title, keyword…"
              placeholderTextColor="#475569"
              style={ss.searchInput}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 10 }}>
                <X size={13} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Status Filters ───────────────────────────────────────────── */}
          <Text style={ss.sectionLabel}>STATUS FILTER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={ss.chipRow}>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={chipStyle(statusFilter === f, f)}
                  onPress={() => setStatusFilter(f)}>
                  <Text style={[ss.chipText, statusFilter === f && { color: '#FFF' }]}>
                    {f === 'All' ? `All (${stats.total})` : f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* ── Time Filters ─────────────────────────────────────────────── */}
          <Text style={ss.sectionLabel}>TIME RANGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            <View style={ss.chipRow}>
              {TIME_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[ss.chip, timeFilter === f ? ss.chipDefault : ss.chipOff]}
                  onPress={() => setTimeFilter(f)}>
                  <Text style={[ss.chipText, timeFilter === f && { color: '#FFF' }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* ── Table Header ─────────────────────────────────────────────── */}
          <View style={ss.tableContainer}>
            {/* Column header */}
            <View style={ss.tableHead}>
              <SortCell label="TIME"     field="time"     sortField={sortField} sortDir={sortDir} onSort={handleSort} style={ss.cellTime} />
              <SortCell label="APP"      field={null}     sortField={sortField} sortDir={sortDir} onSort={handleSort} style={ss.cellApp} />
              <SortCell label="TITLE"    field={null}     sortField={sortField} sortDir={sortDir} onSort={handleSort} style={ss.cellTitle} />
              <SortCell label="PRIORITY" field="priority" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={ss.cellPriority} />
              <SortCell label="STATUS"   field="status"   sortField={sortField} sortDir={sortDir} onSort={handleSort} style={ss.cellStatus} />
              <SortCell label="REASON"   field={null}     sortField={sortField} sortDir={sortDir} onSort={handleSort} style={ss.cellReason} />
              <View style={[ss.thCell, ss.cellActions]}>
                <Text style={ss.thText}>ACTIONS</Text>
              </View>
            </View>

            {/* Rows or Empty */}
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((item, idx) => (
                <TableRow
                  key={item.id}
                  item={item}
                  isEven={idx % 2 === 0}
                  onPress={() => setSelectedRow(item)}
                />
              ))
            )}
          </View>

          {/* Footer */}
          <View style={ss.footer}>
            <Clock size={10} color="#334155" style={{ marginRight: 5 }} />
            <Text style={ss.footerText}>
              Showing {filtered.length} of {allRows.length} logged notifications · Live WebSocket stream active
            </Text>
          </View>
        </ScrollView>

        {/* ── Flush Queue FAB ──────────────────────────────────────────────── */}
        <View style={ss.fab}>
          <TouchableOpacity
            style={ss.fabBtn}
            onPress={() => {
              if (queue.length === 0) { showToast('Queue is empty'); return; }
              releaseTop();
              showToast('Released top queued notification');
            }}>
            <Layers size={15} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={ss.fabText}>Flush Queue ({queue.length})</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* ── Details Drawer ───────────────────────────────────────────────── */}
      {selectedRow && (
        <DetailsDrawer item={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLASS = {
  backgroundColor: 'rgba(15,14,35,0.75)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
};

const ss = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  liveText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  statPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 200 },
  statPill: {
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 7, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statPillText: { fontSize: 9, fontWeight: '800' },

  // Toast
  toast: {
    position: 'absolute', top: Platform.OS === 'ios' ? 90 : 110,
    left: 20, right: 20, borderRadius: 12, zIndex: 9999,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 14,
  },
  toastText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    ...GLASS, borderRadius: 13, height: 42, marginBottom: 16,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 12, fontWeight: '500' },

  // Section label
  sectionLabel: {
    fontSize: 9, fontWeight: '800', color: '#334155',
    letterSpacing: 1, marginBottom: 8,
  },

  // Chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 9,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center',
  },
  chipOff:     { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' },
  chipDefault: { backgroundColor: 'rgba(99,102,241,0.2)',   borderColor: 'rgba(99,102,241,0.4)' },
  chipGreen:   { backgroundColor: 'rgba(16,185,129,0.18)',  borderColor: 'rgba(16,185,129,0.35)' },
  chipRed:     { backgroundColor: 'rgba(239,68,68,0.15)',   borderColor: 'rgba(239,68,68,0.3)' },
  chipAmber:   { backgroundColor: 'rgba(245,158,11,0.15)',  borderColor: 'rgba(245,158,11,0.3)' },
  chipPurple:  { backgroundColor: 'rgba(168,85,247,0.2)',   borderColor: 'rgba(168,85,247,0.4)' },
  chipBlue:    { backgroundColor: 'rgba(59,130,246,0.18)',  borderColor: 'rgba(59,130,246,0.35)' },
  chipText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  // Table container
  tableContainer: { ...GLASS, borderRadius: 18, overflow: 'hidden', marginBottom: 12 },

  // Table head
  tableHead: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
  },
  thCell: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8,
  },
  thText: { fontSize: 8.5, fontWeight: '800', color: '#475569', letterSpacing: 0.6 },
  thTextActive: { color: '#8B5CF6' },

  // Column widths
  cellTime:     { width: 54 },
  cellApp:      { width: 80 },
  cellTitle:    { flex: 1, minWidth: 100 },
  cellPriority: { width: 72 },
  cellStatus:   { width: 88 },
  cellReason:   { flex: 1, minWidth: 90 },
  cellActions:  { width: 48, justifyContent: 'center', alignItems: 'center' },

  // Table row
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tableRowEven: { backgroundColor: 'rgba(255,255,255,0.01)' },
  tableRowOdd:  { backgroundColor: 'rgba(0,0,0,0.1)' },

  // Cells
  cell: { paddingVertical: 8, paddingHorizontal: 8, justifyContent: 'center' },
  cellTimeText: { fontSize: 10, color: '#64748B', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  cellAppInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cellAppText: { fontSize: 10, color: '#E2E8F0', fontWeight: '700', flex: 1 },
  cellTitleText: { fontSize: 11, color: '#CBD5E1', fontWeight: '600', lineHeight: 15 },
  cellPriorityPct: { fontSize: 9, color: '#64748B', fontWeight: '700', marginTop: 2 },
  cellReasonText: { fontSize: 9.5, color: '#64748B', lineHeight: 13 },

  // Actions
  detailsBtn: {
    width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
  },

  // App icon
  appIcon: {
    width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
  },

  // Badge
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6, borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  // Priority bar
  priBarBg: { height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 2 },
  priBarFill: { height: 4, borderRadius: 4 },

  // Empty state
  emptyWrap: {
    paddingVertical: 60, alignItems: 'center', paddingHorizontal: 30,
  },
  emptyGlow: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(139,92,246,0.12)',
    top: 30,
  },
  emptyTitle: { color: '#E2E8F0', fontSize: 15, fontWeight: '800', marginTop: 18, marginBottom: 8 },
  emptyBody: { color: '#475569', fontSize: 11, textAlign: 'center', lineHeight: 17, fontWeight: '500' },

  // Details drawer
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, right: 0,
    width: Math.min(400, width * 0.88),
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerInner: { flex: 1, paddingTop: Platform.OS === 'ios' ? 52 : 36, paddingBottom: 24 },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 4,
  },
  drawerTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  drawerCloseBtn: {
    width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  drawerAppRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  drawerAppName: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  drawerSender: { fontSize: 10, color: '#64748B', marginTop: 1 },
  drawerFieldLabel: {
    fontSize: 8.5, fontWeight: '800', color: '#334155',
    letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 14, marginBottom: 4,
  },
  drawerFieldValue: { fontSize: 13, fontWeight: '700', color: '#E2E8F0', paddingHorizontal: 20 },
  drawerBodyBox: {
    marginHorizontal: 20, borderRadius: 10, padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  drawerBodyText: { fontSize: 12, color: '#CBD5E1', lineHeight: 18, fontWeight: '500' },
  drawerGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 14, gap: 8, marginTop: 10,
  },
  drawerGridCell: {
    width: '46%', backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10, padding: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  drawerCellLabel: { fontSize: 8, fontWeight: '800', color: '#334155', letterSpacing: 0.8, marginBottom: 3 },
  drawerCellValue: { fontSize: 12, fontWeight: '700', color: '#E2E8F0' },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16,
  },
  footerText: { fontSize: 9, color: '#334155', fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute', bottom: 18, left: 20, right: 20,
    alignItems: 'center', zIndex: 99,
  },
  fabBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 18,
    backgroundColor: '#1E1B4B', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
