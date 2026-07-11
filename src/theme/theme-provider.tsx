import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme, type ThemeMode } from './themes';

/**
 * `system` follows the OS color scheme; explicit modes override it. The
 * Settings feature will persist the user's choice and pass it down here.
 */
export type ThemePreference = ThemeMode | 'system';

interface AppThemeProviderProps {
  preference?: ThemePreference;
}

const ThemeContext = createContext<AppTheme>(lightTheme);

export function AppThemeProvider({
  preference = 'system',
  children,
}: PropsWithChildren<AppThemeProviderProps>) {
  const systemScheme = useColorScheme();

  const resolvedMode: ThemeMode =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Access the active theme. Safe default (light) outside a provider keeps tests trivial. */
export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}

/**
 * Build memoized theme-dependent styles.
 *
 * The `factory` MUST be declared at module scope (stable identity) so the
 * memo only recomputes on theme changes:
 *
 * ```tsx
 * const createStyles = (theme: AppTheme) =>
 *   StyleSheet.create({ root: { backgroundColor: theme.colors.surface } });
 *
 * function Card() {
 *   const styles = useThemedStyles(createStyles);
 *   ...
 * }
 * ```
 */
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
