import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot, useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

import { ShieldProvider } from '@/context/ShieldContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/error-boundary';

// Polyfill stylesheet shadow properties to boxShadow on web to silence deprecation warnings
if (Platform.OS === 'web') {
  const originalCreate = StyleSheet.create;
  StyleSheet.create = function (styles: any) {
    const newStyles = { ...styles };
    for (const key in newStyles) {
      if (newStyles[key]) {
        const style = { ...newStyles[key] };
        if (
          'shadowColor' in style ||
          'shadowOffset' in style ||
          'shadowOpacity' in style ||
          'shadowRadius' in style
        ) {
          const color = style.shadowColor || '#000000';
          const offset = style.shadowOffset || { width: 0, height: 0 };
          const opacity = style.shadowOpacity !== undefined ? style.shadowOpacity : 1;
          const radius = style.shadowRadius !== undefined ? style.shadowRadius : 0;

          let rgb = '0, 0, 0';
          if (typeof color === 'string') {
            if (color.startsWith('#')) {
              let hex = color.replace('#', '');
              if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
              }
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                rgb = `${r}, ${g}, ${b}`;
              }
              style.boxShadow = `${offset.width}px ${offset.height}px ${radius}px rgba(${rgb}, ${opacity})`;
            } else if (color.startsWith('rgb') || color.startsWith('rgba')) {
              style.boxShadow = `${offset.width}px ${offset.height}px ${radius}px ${color}`;
            } else {
              style.boxShadow = `${offset.width}px ${offset.height}px ${radius}px ${color}`;
            }
          } else {
            style.boxShadow = `${offset.width}px ${offset.height}px ${radius}px rgba(0, 0, 0, ${opacity})`;
          }

          delete style.shadowColor;
          delete style.shadowOffset;
          delete style.shadowOpacity;
          delete style.shadowRadius;
          delete style.elevation;
        }
        newStyles[key] = style;
      }
    }
    return originalCreate(newStyles);
  };
}

SplashScreen.preventAutoHideAsync();

// Unify query client at the root level to share cached state across tabs
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RootApp() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

function AuthStack() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </ThemeProvider>
  );
}

function NavigationGate() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <LinearGradient colors={['#07080D', '#0F0E23', '#1A0C2F']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Initializing Cognitive Shield...</Text>
      </LinearGradient>
    );
  }

  const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

  if (isAuthenticated) {
    return (
      <ShieldProvider>
        <RootApp />
      </ShieldProvider>
    );
  }

  // To prevent mounting protected routes (e.g. index.tsx) during redirect,
  // do not render Slot if we are not on login/register pages yet.
  if (!inAuthGroup) {
    return (
      <LinearGradient colors={['#07080D', '#0F0E23', '#1A0C2F']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </LinearGradient>
    );
  }

  return <AuthStack />;
}

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationGate />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

