/**
 * Border radius tokens.
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  /** Fully rounded — pills, avatars, FABs. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
