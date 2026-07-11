import type { ViewStyle } from 'react-native';

/**
 * Elevation tokens.
 *
 * Each level bundles iOS shadow properties and the Android `elevation`
 * value; each platform ignores the other's keys. Dark themes should lean on
 * surface color contrast (`surfaceElevated`) rather than shadows — shadows
 * are nearly invisible on dark backgrounds.
 */
export const elevation = {
  none: {},
  /** Resting cards, list rows. */
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  /** Raised cards, sticky headers. */
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  /** Floating action buttons, popovers. */
  level3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  /** Modals, bottom sheets. */
  level4: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

export type ElevationToken = keyof typeof elevation;
