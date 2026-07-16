import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Home as HomeIcon, Activity, Bell, Layers, BarChart2, User, ExternalLink as LinkIcon, Sparkles, Clock } from 'lucide-react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const isSidebar = width > 1024;

  return (
    <Tabs style={isSidebar ? styles.webLayoutSidebar : styles.webLayoutBottom}>
      <TabList asChild>
        <CustomTabList isSidebar={isSidebar}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton isSidebar={isSidebar}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton isSidebar={isSidebar}>Live Focus</TabButton>
          </TabTrigger>
          <TabTrigger name="notifications" href={"/notifications" as any} asChild>
            <TabButton isSidebar={isSidebar}>Notifications</TabButton>
          </TabTrigger>
          <TabTrigger name="queue" href={"/queue" as any} asChild>
            <TabButton isSidebar={isSidebar}>Queue</TabButton>
          </TabTrigger>
          <TabTrigger name="digest" href={"/digest" as any} asChild>
            <TabButton isSidebar={isSidebar}>Digest</TabButton>
          </TabTrigger>
          <TabTrigger name="timeline" href={"/timeline" as any} asChild>
            <TabButton isSidebar={isSidebar}>Timeline</TabButton>
          </TabTrigger>
          <TabTrigger name="analytics" href={"/analytics" as any} asChild>
            <TabButton isSidebar={isSidebar}>Analytics</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href={"/profile" as any} asChild>
            <TabButton isSidebar={isSidebar}>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={isSidebar ? styles.slotSidebar : styles.slotBottom} />
    </Tabs>
  );
}

function getIconForTab(name: string, color: string) {
  const size = 18;
  switch (name) {
    case 'Home': return <HomeIcon size={size} color={color} />;
    case 'Live Focus': return <Activity size={size} color={color} />;
    case 'Notifications': return <Bell size={size} color={color} />;
    case 'Queue': return <Layers size={size} color={color} />;
    case 'Digest': return <Sparkles size={size} color={color} />;
    case 'Timeline': return <Clock size={size} color={color} />;
    case 'Analytics': return <BarChart2 size={size} color={color} />;
    case 'Profile': return <User size={size} color={color} />;
    default: return null;
  }
}

export function TabButton({ children, isFocused, isSidebar, ...props }: TabTriggerSlotProps & { isSidebar?: boolean }) {
  const color = isFocused ? '#A855F7' : '#94A3B8';
  return (
    <Pressable {...props} style={({ pressed }) => [pressed && styles.pressed, isSidebar && { width: '100%' }]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.tabButtonView,
          isSidebar && styles.tabButtonSidebar,
          isFocused && styles.tabButtonActiveBorder
        ]}>
        {getIconForTab(String(children), color)}
        <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'} style={isSidebar && styles.tabButtonTextSidebar}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList({ children, isSidebar, ...props }: TabListProps & { isSidebar?: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  if (isSidebar) {
    return (
      <View {...props} style={styles.sidebarContainer}>
        <ThemedView type="backgroundElement" style={styles.sidebarInner}>
          <View style={styles.sidebarBrand}>
            <ThemedText type="smallBold" style={styles.brandTitleTextWeb}>
              🛡️ COGNITIVE SHIELD
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary" style={styles.brandSubtextWeb}>
              Enterprise Console
            </ThemedText>
          </View>

          <View style={styles.sidebarItems}>
            {children}
          </View>

          <View style={styles.sidebarFooter}>
            <ExternalLink href="https://docs.expo.dev" asChild>
              <Pressable style={styles.externalPressableSidebar}>
                <LinkIcon size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <ThemedText type="link" themeColor="textSecondary">Docs & Support</ThemedText>
              </Pressable>
            </ExternalLink>
          </View>
        </ThemedView>
      </View>
    );
  }

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Cognitive Shield
        </ThemedText>

        {children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link" style={{ marginRight: 4 }}>Docs</ThemedText>
            <LinkIcon size={12} color={colors.text} />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  webLayoutSidebar: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    backgroundColor: '#07080D',
  },
  webLayoutBottom: {
    flexDirection: 'column-reverse',
    height: '100%',
    width: '100%',
  },
  slotSidebar: {
    flex: 1,
    height: '100%',
  },
  slotBottom: {
    flex: 1,
    height: '100%',
  },
  sidebarContainer: {
    width: 250,
    height: '100%',
  },
  sidebarInner: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: Spacing.four,
  },
  brandTitleTextWeb: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  brandSubtextWeb: {
    fontSize: 10,
    marginTop: 4,
    color: '#94A3B8',
  },
  sidebarItems: {
    flex: 1,
    gap: Spacing.two,
  },
  sidebarFooter: {
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 100,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonSidebar: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    width: '100%',
    alignItems: 'center',
  },
  tabButtonActiveBorder: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
  },
  tabButtonTextSidebar: {
    marginLeft: Spacing.two,
    fontSize: 13,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.three,
  },
  externalPressableSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
