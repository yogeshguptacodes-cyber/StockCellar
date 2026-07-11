/**
 * Theme module — public API.
 *
 * Feature code imports from `@/theme` only; internal file layout is free to
 * evolve without breaking consumers.
 */
export {
  AppThemeProvider,
  useTheme,
  useThemedStyles,
  type ThemePreference,
} from './theme-provider';
export { darkTheme, lightTheme, type AppTheme, type ThemeColors, type ThemeMode } from './themes';
export * from './tokens';
