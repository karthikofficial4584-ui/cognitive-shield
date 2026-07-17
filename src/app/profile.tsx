import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
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
  User,
  Sliders,
  Check,
  X,
  ChevronRight,
  Info,
  Lock,
  Unlock,
  Volume2,
  Phone,
  Mail,
  Calendar,
  Award,
  Settings,
  Eye,
  SlidersHorizontal,
  LogOut,
  HelpCircle,
  Bug,
  MessageSquare,
  Bookmark,
  Trash2,
  CheckCircle2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Reanimated custom components
const AnimatedView = Animated.createAnimatedComponent(View);

export default function ProfileRoute() {
  return <ProfileSettingsScreen />;
}

// Switch Component
interface GlassSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  activeColor?: string;
}

function GlassSwitch({ value, onValueChange, activeColor = '#A855F7' }: GlassSwitchProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        switchStyles.track,
        value ? { backgroundColor: activeColor, borderColor: 'rgba(255,255,255,0.1)' } : switchStyles.trackInactive
      ]}>
      <View style={[
        switchStyles.thumb,
        value ? switchStyles.thumbActive : switchStyles.thumbInactive
      ]} />
    </TouchableOpacity>
  );
}

const switchStyles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  thumbInactive: {
    alignSelf: 'flex-start',
  },
});

import { useShield } from '@/context/ShieldContext';
import { useAuth } from '@/context/AuthContext';

function ProfileSettingsScreen() {
  const { logout } = useAuth();
  const {
    analytics,
    isOffline,
    toggleOfflineMode,
    focusThreshold,
    setFocusThreshold,
    urgencyThreshold,
    setUrgencyThreshold,
    enableNotif,
    setEnableNotif,
    criticalAlerts,
    setCriticalAlerts,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    queueAutoRelease,
    setQueueAutoRelease,
    darkMode,
    setDarkMode,
    accentColor,
    setAccentColor,
    animationsEnabled,
    setAnimationsEnabled,
    fontSize,
    setFontSize,
    dataCollection,
    setDataCollection,
    telemetryPermission,
    setTelemetryPermission,
    analyticsSharing,
    setAnalyticsSharing,
  } = useShield();

  const memberSince = 'Jul 2026';
  const streakCount = 12;
  const deepWorkHours = Math.floor(analytics.deepFocusMinutes / 60) + 'h ' + (analytics.deepFocusMinutes % 60) + 'm';
  const productivityScore = analytics.productivityScore;

  // Achievements Unlocked Dialog State
  const [activeAchievement, setActiveAchievement] = useState<{ title: string; desc: string; icon: string } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const getAccentHex = () => {
    switch (accentColor) {
      case 'Blue': return '#3B82F6';
      case 'Emerald': return '#10B981';
      case 'Rose': return '#F43F5E';
      default: return '#A855F7';
    }
  };

  const activeColor = getAccentHex();

  // Reset actions
  const handleDeleteData = () => {
    showToast('Local cached telemetry logs deleted successfully');
  };

  const handleLogout = async () => {
    showToast('Google account logged out. Sandbox active.');
    await logout();
  };

  const handleDeleteAccount = () => {
    showToast('Delete account query queued. Security verification required.');
  };

  const handleEditProfile = () => {
    showToast('Profile editing panel triggered');
  };

  // Achievements pool
  const achievements = [
    { id: '1', title: 'Deep Focus Master', icon: '🏆', desc: 'Maintained deep focus block over 3 hours.', unlocked: true },
    { id: '2', title: 'Zero Interruptions', icon: '⚡', desc: 'Blocked all incoming pings during focus sprint.', unlocked: true },
    { id: '3', title: 'Attention Guardian', icon: '🧠', desc: 'Maintained focus above 80 for 5 consecutive days.', unlocked: true },
    { id: '4', title: 'Productivity Hero', icon: '🚀', desc: 'Achieved 95% productivity metric baseline.', unlocked: false },
    { id: '5', title: '100 Focus Sessions', icon: '🥇', desc: 'Successfully completed 100 focus blocks.', unlocked: false },
  ];

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
            <Text style={styles.headerTitle}>Identity Hub</Text>
            <Text style={styles.headerSubtitle}>User profile and security configurations</Text>
          </View>
          <Settings size={20} color="#A855F7" />
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

          {/* USER AVATAR & BASIC DETAILS WORKSPACE */}
          <View style={styles.glassCard}>
            <View style={styles.profileBasicRow}>
              
              {/* Futuristic Cyberpunk avatar */}
              <View style={styles.avatarBorderGlow}>
                <LinearGradient
                  colors={[activeColor, '#6366F1']}
                  style={styles.avatarGradient}>
                  <View style={styles.avatarInner}>
                    <User size={36} color="#FFF" />
                  </View>
                </LinearGradient>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              </View>

              <View style={styles.profileTextCol}>
                <Text style={styles.profileName}>Commander Karthik</Text>
                <Text style={styles.profileRole}>Lead Systems Architect</Text>
                
                <View style={styles.profileMetaRow}>
                  <Mail size={11} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.profileMetaText}>karthik@cognitiveshield.io</Text>
                </View>
                
                <View style={styles.profileMetaRow}>
                  <Phone size={11} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.profileMetaText}>+1 (555) 019-2834</Text>
                </View>

                <View style={styles.profileMetaRow}>
                  <Calendar size={11} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.profileMetaText}>Member since: {memberSince}</Text>
                </View>
                <View style={styles.profileMetaRow}>
                  <Shield size={11} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.profileMetaText}>Windows Agent: Active</Text>
                </View>
                <View style={styles.profileMetaRow}>
                  <Activity size={11} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.profileMetaText}>Last Sync: Just now</Text>
                </View>

              </View>

            </View>

            {/* Quick edit button */}
            <TouchableOpacity onPress={handleEditProfile} style={[styles.btnEditProfile, { borderColor: activeColor }]}>
              <Text style={[styles.editProfileText, { color: activeColor }]}>Edit Profile Identity</Text>
            </TouchableOpacity>

            <View style={styles.statsDivider} />

            {/* Metrics grid */}
            <View style={styles.profileStatsRow}>
              
              <View style={styles.profileStatCell}>
                <Text style={styles.statLabel}>STREAK</Text>
                <Text style={styles.statVal}>{streakCount} Days</Text>
              </View>

              <View style={styles.profileStatCell}>
                <Text style={styles.statLabel}>DEEP WORK</Text>
                <Text style={styles.statVal}>{deepWorkHours}</Text>
              </View>

              <View style={styles.profileStatCell}>
                <Text style={styles.statLabel}>PRODUCTIVITY</Text>
                <Text style={styles.statVal}>{productivityScore}%</Text>
              </View>
            </View>
          </View>

          {/* TODAY'S ACHIEVEMENT */}
          <Text style={styles.sectionHeading}>Today's Achievement</Text>
          <View style={[styles.glassCard, { borderColor: '#10B981', borderWidth: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
            <View style={styles.row}>
              <Award size={22} color="#10B981" style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                  {analytics.deepFocusMinutes >= 90 ? 'Deep Work Hero' : 'Focus Apprentice'}
                </Text>
                <Text style={{ fontSize: 12, color: '#10B981', marginTop: 2, fontWeight: '600' }}>
                  {analytics.deepFocusMinutes} Minutes Focus
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(16, 185, 129, 0.2)' }}>
              <View style={styles.row}>
                <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: '#E2E8F0', fontWeight: '500' }}>
                  {analytics.allowedNotif === 0 ? 'Zero Distractions Allowed' : `${analytics.preventedInteractions} Interruptions Blocked`}
                </Text>
              </View>
            </View>
          </View>

          {/* ACHIEVEMENT BADGES */}
          <Text style={styles.sectionHeading}>Unlocked Achievements</Text>
          <View style={styles.achievementsCard}>
            <Text style={styles.achievementsCardDesc}>
              Achievements unlocked based on focus preservation efficiency metrics.
            </Text>
            
            <View style={styles.badgeListRow}>
              {achievements.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveAchievement({ title: item.title, desc: item.desc, icon: item.icon })}
                  style={[styles.badgeItem, item.unlocked ? styles.badgeItemUnlocked : styles.badgeItemLocked]}>
                  <Text style={styles.badgeIcon}>{item.icon}</Text>
                  <Text style={[styles.badgeItemText, item.unlocked ? styles.textActive : styles.textLocked]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.unlocked ? (
                    <View style={styles.badgeCheckedDot}>
                      <Check size={8} color="#FFF" />
                    </View>
                  ) : (
                    <View style={styles.badgeLockedDot}>
                      <Lock size={8} color="#64748B" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Achievement detail modal box */}
            {activeAchievement && (
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.12)', 'rgba(59, 130, 246, 0.04)']}
                style={styles.achievementDetailBox}>
                <View style={styles.row}>
                  <Award size={18} color="#A855F7" style={{ marginRight: 8 }} />
                  <Text style={styles.detailTitle}>{activeAchievement.title}</Text>
                </View>
                <Text style={styles.detailDesc}>{activeAchievement.desc}</Text>
                <TouchableOpacity onPress={() => setActiveAchievement(null)} style={styles.btnDismissDetail}>
                  <Text style={styles.dismissDetailText}>Dismiss Details</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

          </View>

          {/* ACCOUNT SETTINGS */}
          <Text style={styles.sectionHeading}>Account</Text>
          <View style={styles.glassCard}>
            
            <View style={styles.sliderItem}>
              <View style={styles.sliderLabelRow}>
                <View style={styles.row}>
                  <Shield size={14} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text style={styles.settingLabel}>Focus Gate Score Threshold</Text>
                </View>
                <Text style={[styles.settingVal, { color: activeColor }]}>{focusThreshold}</Text>
              </View>
              
              <Text style={styles.settingDesc}>
                Score above which non-critical alerts are queued. Currently: {focusThreshold}.
              </Text>

              {/* Custom Sliders Row values (Tapping selects the value) */}
              <View style={styles.sliderTrackValues}>
                {[50, 60, 70, 75, 80, 85, 90, 95].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setFocusThreshold(val)}
                    style={[
                      styles.sliderButtonCell,
                      focusThreshold === val ? { backgroundColor: activeColor } : null
                    ]}>
                    <Text style={[styles.sliderButtonText, focusThreshold === val ? styles.textActive : null]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sliderItem}>
              <View style={styles.sliderLabelRow}>
                <View style={styles.row}>
                  <Zap size={14} color="#A855F7" style={{ marginRight: 6 }} />
                  <Text style={styles.settingLabel}>Urgency Override Factor</Text>
                </View>
                <Text style={[styles.settingVal, { color: activeColor }]}>{urgencyThreshold.toFixed(2)}</Text>
              </View>

              <Text style={styles.settingDesc}>
                Calculated message urgency threshold allowing overrides. Currently: {urgencyThreshold.toFixed(2)}.
              </Text>

              <View style={styles.sliderTrackValues}>
                {[0.50, 0.60, 0.70, 0.80, 0.85, 0.90, 0.95].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setUrgencyThreshold(val)}
                    style={[
                      styles.sliderButtonCell,
                      urgencyThreshold === val ? { backgroundColor: activeColor } : null
                    ]}>
                    <Text style={[styles.sliderButtonText, urgencyThreshold === val ? styles.textActive : null]}>
                      {val.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>

          <Text style={styles.sectionHeading}>Notifications (Account)</Text>
          <View style={styles.glassCard}>
            
            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Enable Notification Intercept</Text>
                <Text style={styles.settingDesc}>Bypasses the cognitive shield daemon logs if disengaged.</Text>
              </View>
              <GlassSwitch value={enableNotif} onValueChange={setEnableNotif} activeColor={activeColor} />
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Critical System Alert Bypass</Text>
                <Text style={styles.settingDesc}>Emergency server downtime notifications override shield gate.</Text>
              </View>
              <GlassSwitch value={criticalAlerts} onValueChange={setCriticalAlerts} activeColor={activeColor} />
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Audible alert chirps</Text>
                <Text style={styles.settingDesc}>Play dynamic audio tones during allowed notifications.</Text>
              </View>
              <GlassSwitch value={soundEnabled} onValueChange={setSoundEnabled} activeColor={activeColor} />
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Haptic vibration buzz</Text>
                <Text style={styles.settingDesc}>Trigger physical feedback pulses for priority events.</Text>
              </View>
              <GlassSwitch value={vibrationEnabled} onValueChange={setVibrationEnabled} activeColor={activeColor} />
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Queue Auto-Release Override</Text>
                <Text style={styles.settingDesc}>Release queue as soon as focus decays below threshold.</Text>
              </View>
              <GlassSwitch value={queueAutoRelease} onValueChange={setQueueAutoRelease} activeColor={activeColor} />
            </View>

          </View>

          {/* APPEARANCE */}
          <Text style={styles.sectionHeading}>Appearance</Text>
          <View style={styles.glassCard}>
            
            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Interface Dark Mode</Text>
                <Text style={styles.settingDesc}>Enforces premium low-blue-light cybersecurity styling.</Text>
              </View>
              <GlassSwitch value={darkMode} onValueChange={setDarkMode} activeColor={activeColor} />
            </View>

            <View style={styles.accentColorsWrapper}>
              <Text style={styles.toggleLabel}>Visual Accent Color</Text>
              <View style={styles.accentsRow}>
                {['Purple', 'Blue', 'Emerald', 'Rose'].map((colorName) => {
                  const colorsHex: Record<string, string> = { Purple: '#A855F7', Blue: '#3B82F6', Emerald: '#10B981', Rose: '#F43F5E' };
                  const isSelected = accentColor === colorName;
                  return (
                    <TouchableOpacity
                      key={colorName}
                      onPress={() => setAccentColor(colorName as any)}
                      style={[
                        styles.accentColorCell,
                        isSelected ? { borderColor: '#FFF', borderWidth: 2 } : null,
                        { backgroundColor: colorsHex[colorName] }
                      ]}>
                      {isSelected && <Check size={12} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>60 FPS fluid animations</Text>
                <Text style={styles.settingDesc}>Enable Reanimated transitions across widgets.</Text>
              </View>
              <GlassSwitch value={animationsEnabled} onValueChange={setAnimationsEnabled} activeColor={activeColor} />
            </View>

            <View style={styles.fontSizesWrapper}>
              <Text style={styles.toggleLabel}>System Font Scale</Text>
              <View style={styles.fontSizesRow}>
                {['Small', 'Medium', 'Large'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setFontSize(size as any)}
                    style={[
                      styles.fontSizeBtn,
                      fontSize === size ? { backgroundColor: activeColor } : null
                    ]}>
                    <Text style={[styles.fontSizeBtnText, fontSize === size ? styles.textActive : null]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>

          {/* PRIVACY */}
          <Text style={styles.sectionHeading}>Privacy</Text>
          <View style={styles.glassCard}>
            
            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Local Data Logging Collection</Text>
                <Text style={styles.settingDesc}>Buffer intercepted notifications history cache locally.</Text>
              </View>
              <GlassSwitch value={dataCollection} onValueChange={setDataCollection} activeColor={activeColor} />
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Telemetry Keyboard daemon</Text>
                <Text style={styles.settingDesc}>Allow monitoring user WPM velocity indexes.</Text>
              </View>
              <GlassSwitch value={telemetryPermission} onValueChange={setTelemetryPermission} activeColor={activeColor} />
            </View>

            <View style={styles.settingToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Offline Cache Mode</Text>
                <Text style={styles.settingDesc}>Enforces local cached telemetry updates without backend endpoints sync.</Text>
              </View>
              <GlassSwitch value={isOffline} onValueChange={toggleOfflineMode} activeColor={activeColor} />
            </View>

            <TouchableOpacity onPress={handleDeleteData} style={[styles.btnDangerAction, { marginTop: 12 }]}>
              <Trash2 size={14} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.dangerActionText}>Delete Local Cached Logs</Text>
            </TouchableOpacity>

          </View>

          {/* SECURITY & LINKED ACCOUNTS */}
          <Text style={styles.sectionHeading}>Security (Account)</Text>
          <View style={styles.glassCard}>
            
            <View style={styles.securityRow}>
              <View style={styles.row}>
                <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.securityLabel}>Google Account link</Text>
                  <Text style={styles.securitySub}>Connected (karthik@cognitiveshield.io)</Text>
                </View>
              </View>
              <Text style={styles.securityBadgeOk}>SECURE</Text>
            </View>

            <View style={styles.securityRow}>
              <View style={styles.row}>
                <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.securityLabel}>Email Address Identity</Text>
                  <Text style={styles.securitySub}>Verified Primary Node</Text>
                </View>
              </View>
              <Text style={styles.securityBadgeOk}>SECURE</Text>
            </View>

            <View style={styles.securityRow}>
              <View style={styles.row}>
                <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.securityLabel}>Phone Number Verify</Text>
                  <Text style={styles.securitySub}>SMS Two-Factor active (+1 555-019-2834)</Text>
                </View>
              </View>
              <Text style={styles.securityBadgeOk}>SECURE</Text>
            </View>



          </View>

          {/* HELP & SUPPORT */}
          <Text style={styles.sectionHeading}>Support</Text>
          <View style={styles.glassCard}>
            
            <TouchableOpacity onPress={() => showToast('Redirecting to FAQ index...')} style={styles.helpItemRow}>
              <View style={styles.row}>
                <HelpCircle size={15} color="#3B82F6" style={{ marginRight: 10 }} />
                <Text style={styles.helpLabel}>FAQ Documentation</Text>
              </View>
              <ChevronRight size={14} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => showToast('Opening direct support channel...')} style={styles.helpItemRow}>
              <View style={styles.row}>
                <MessageSquare size={15} color="#8B5CF6" style={{ marginRight: 10 }} />
                <Text style={styles.helpLabel}>Contact Operator node</Text>
              </View>
              <ChevronRight size={14} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => showToast('Bug report template loaded')} style={[styles.helpItemRow, { borderBottomWidth: 0 }]}>
              <View style={styles.row}>
                <Bug size={15} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.helpLabel}>Report Telemetry Bug</Text>
              </View>
              <ChevronRight size={14} color="#64748B" />
            </TouchableOpacity>

          </View>

          {/* ABOUT APP INFO */}
          <Text style={styles.sectionHeading}>About</Text>
          <View style={styles.glassCard}>
            <View style={styles.aboutHeader}>
              <Shield size={22} color={activeColor} />
              <Text style={styles.aboutTitle}>Cognitive Shield</Text>
            </View>
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>Application Version</Text>
              <Text style={styles.aboutMetaVal}>1.0.0 (Enterprise Sandbox)</Text>
            </View>
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>Build Sequence Number</Text>
              <Text style={styles.aboutMetaVal}>100.12-release</Text>
            </View>
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>Open Source Node Licenses</Text>
              <Text style={styles.aboutLink}>View licenses</Text>
            </View>
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>Operator Terms of Service</Text>
              <Text style={styles.aboutLink}>Read terms</Text>
            </View>
            <View style={[styles.aboutMetaRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.aboutMetaLabel}>Shield Privacy Policy</Text>
              <Text style={styles.aboutLink}>Read privacy</Text>
            </View>
          </View>

          <View style={styles.footerBranding}>
            <Shield size={12} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.footerBrandingText}>COGNITIVE SHIELD v1.0.0</Text>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={[styles.btnOutlineAction, { marginTop: 16, borderColor: '#EF4444' }]}>
            <LogOut size={14} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={[styles.outlineActionText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>

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
  profileBasicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorderGlow: {
    position: 'relative',
    marginRight: 18,
  },
  avatarGradient: {
    padding: 2.5,
    borderRadius: 36,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 67,
    height: 67,
    borderRadius: 33.5,
    backgroundColor: '#1E1B4B',
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#0B0C10',
  },
  profileTextCol: {
    flex: 1,
  },
  profileName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileRole: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileMetaText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '500',
  },
  btnEditProfile: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  editProfileText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileStatCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statVal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    marginTop: 6,
  },
  achievementsCard: {
    backgroundColor: 'rgba(20, 22, 38, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 20,
    marginBottom: 16,
  },
  achievementsCardDesc: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 16,
  },
  badgeListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    position: 'relative',
  },
  badgeItemUnlocked: {
    borderColor: 'rgba(168, 85, 247, 0.2)',
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
  },
  badgeItemLocked: {
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  badgeItemText: {
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
    paddingRight: 6,
  },
  badgeCheckedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLockedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementDetailBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    padding: 14,
    marginTop: 6,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  detailDesc: {
    fontSize: 11.5,
    color: '#E2E8F0',
    lineHeight: 16,
    marginTop: 4,
    fontWeight: '500',
  },
  btnDismissDetail: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  dismissDetailText: {
    color: '#A855F7',
    fontSize: 10.5,
    fontWeight: '800',
  },
  sliderItem: {
    marginBottom: 18,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  settingVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  settingDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 10,
  },
  sliderTrackValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 2,
  },
  sliderButtonCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  sliderButtonText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  toggleLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  accentColorsWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  accentsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  accentColorCell: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizesWrapper: {
    paddingVertical: 12,
  },
  fontSizesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: 2,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fontSizeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  fontSizeBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  btnDangerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  dangerActionText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '800',
  },
  btnOutlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  outlineActionText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  securityLabel: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  securitySub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  securityBadgeOk: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
  },
  helpItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  helpLabel: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  aboutMetaLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  aboutMetaVal: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  aboutLink: {
    color: '#3B82F6',
    fontSize: 11.5,
    fontWeight: '700',
  },
  footerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  footerBrandingText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textActive: { color: '#FFF' },
  textLocked: { color: '#64748B' },
});
