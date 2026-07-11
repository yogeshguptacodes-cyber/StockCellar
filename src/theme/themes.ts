import { motion } from './tokens/animation';
import { palette } from './tokens/colors';
import { elevation } from './tokens/elevation';
import { radius } from './tokens/radius';
import { layout, spacing } from './tokens/spacing';
import { typography } from './tokens/typography';

export type ThemeMode = 'light' | 'dark';

/**
 * Semantic color contract.
 *
 * Components style themselves against these ROLES, never against raw palette
 * values. Adding a theme (high-contrast, seasonal brand) means providing one
 * more mapping — zero component changes.
 */
export interface ThemeColors {
  // Surfaces
  readonly background: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly surfaceElevated: string;

  // Borders & separators
  readonly border: string;
  readonly borderStrong: string;

  // Text
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textDisabled: string;
  readonly textInverse: string;
  readonly textLink: string;

  // Brand
  readonly primary: string;
  readonly primaryPressed: string;
  readonly primaryMuted: string;
  readonly onPrimary: string;
  readonly accent: string;
  readonly accentMuted: string;
  readonly onAccent: string;

  // Feedback
  readonly success: string;
  readonly successMuted: string;
  readonly warning: string;
  readonly warningMuted: string;
  readonly danger: string;
  readonly dangerPressed: string;
  readonly dangerMuted: string;
  readonly info: string;
  readonly infoMuted: string;

  // Effects
  readonly overlay: string;
  readonly skeletonBase: string;
  readonly skeletonHighlight: string;
}

export interface AppTheme {
  readonly mode: ThemeMode;
  readonly colors: ThemeColors;
  readonly typography: typeof typography;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly elevation: typeof elevation;
  readonly motion: typeof motion;
  readonly layout: typeof layout;
}

/** Scale tokens are theme-independent; only colors vary per mode. */
const baseTokens = {
  typography,
  spacing,
  radius,
  elevation,
  motion,
  layout,
} as const;

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: palette.neutral50,
    surface: palette.neutral0,
    surfaceMuted: palette.neutral100,
    surfaceElevated: palette.neutral0,

    border: palette.neutral200,
    borderStrong: palette.neutral300,

    textPrimary: palette.neutral900,
    textSecondary: palette.neutral600,
    textTertiary: palette.neutral500,
    textDisabled: palette.neutral400,
    textInverse: palette.neutral0,
    textLink: palette.wine600,

    primary: palette.wine600,
    primaryPressed: palette.wine700,
    primaryMuted: palette.wine100,
    onPrimary: palette.neutral0,
    accent: palette.gold400,
    accentMuted: palette.gold100,
    onAccent: palette.neutral900,

    success: palette.green500,
    successMuted: palette.green100,
    warning: palette.amber500,
    warningMuted: palette.amber100,
    danger: palette.red500,
    dangerPressed: palette.red700,
    dangerMuted: palette.red100,
    info: palette.blue500,
    infoMuted: palette.blue100,

    overlay: 'rgba(0, 0, 0, 0.5)',
    skeletonBase: palette.neutral200,
    skeletonHighlight: palette.neutral100,
  },
  ...baseTokens,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: palette.neutral950,
    surface: palette.neutral900,
    surfaceMuted: palette.neutral800,
    surfaceElevated: palette.neutral800,

    border: palette.neutral700,
    borderStrong: palette.neutral600,

    textPrimary: palette.neutral50,
    textSecondary: palette.neutral300,
    textTertiary: palette.neutral500,
    textDisabled: palette.neutral600,
    textInverse: palette.neutral900,
    textLink: palette.wine300,

    primary: palette.wine400,
    primaryPressed: palette.wine300,
    primaryMuted: palette.wine900,
    onPrimary: palette.neutral0,
    accent: palette.gold400,
    accentMuted: palette.gold800,
    onAccent: palette.neutral900,

    success: palette.green400,
    successMuted: palette.green900,
    warning: palette.amber400,
    warningMuted: palette.amber900,
    danger: palette.red400,
    dangerPressed: palette.red500,
    dangerMuted: palette.red900,
    info: palette.blue400,
    infoMuted: palette.blue900,

    overlay: 'rgba(0, 0, 0, 0.6)',
    skeletonBase: palette.neutral800,
    skeletonHighlight: palette.neutral700,
  },
  ...baseTokens,
};
