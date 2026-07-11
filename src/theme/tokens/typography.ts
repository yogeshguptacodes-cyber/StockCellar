import { Platform, type TextStyle } from 'react-native';

/**
 * Typography tokens.
 *
 * Named text variants consumed by the design system's `Text` component and,
 * exceptionally, by low-level UI. Font sizes/line heights follow a modular
 * scale tuned for dense inventory UIs; variants (not raw sizes) are the API
 * so Dynamic Type and re-scaling can be introduced in one place.
 */
export const fontFamilies = {
  sans: Platform.select({ android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const typography = {
  /** Hero numbers / splash branding. */
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.4,
  },
  /** Screen titles. */
  headline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  /** Section titles, card headers. */
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  },
  /** List item titles, emphasized rows. */
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  },
  /** Default reading text. */
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  },
  /** Emphasized body text. */
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  },
  /** Form labels, buttons, tab labels. */
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  },
  /** Timestamps, helper text, badges. */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.2,
  },
  /** SKUs, quantities in tabular contexts, technical identifiers. */
  code: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
    fontFamily: fontFamilies.mono,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
