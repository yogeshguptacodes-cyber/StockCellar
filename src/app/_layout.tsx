import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { container } from '@/core/di/container';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { SnackbarHost } from '@/shared/components/ui';
import { AppThemeProvider, useTheme } from '@/theme';

/**
 * Bridges the design-system theme into React Navigation so native navigator
 * surfaces (headers, transitions, backgrounds) match the active theme.
 */
function useNavigationTheme(): NavigationTheme {
  const theme = useTheme();

  return useMemo(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme]);
}

function RootNavigator() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Session details' }} />
      </Stack>
      <SnackbarHost />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const themePreference = useSettingsStore((state) => state.themePreference);
  const hydrate = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    container.analytics.track({ name: 'app_open' });
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppThemeProvider preference={themePreference}>
        <ErrorBoundary>
          <RootNavigator />
        </ErrorBoundary>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
