/**
 * Spacing tokens — 4pt base grid.
 *
 * All margins, paddings, and gaps must come from this scale. If a design
 * calls for an off-scale value, that is a design-system conversation, not a
 * hardcoded number in a component.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/**
 * Layout constants shared across screens. Kept beside spacing because they
 * express the same "no magic numbers" contract at page level.
 */
export const layout = {
  /** Minimum accessible touch target (Apple HIG / Material). */
  minTouchTarget: 44,
  /** Default horizontal padding for screen content. */
  screenPaddingHorizontal: spacing.lg,
  /** Max content width so tablet/web layouts don't stretch line lengths. */
  maxContentWidth: 640,
} as const;
