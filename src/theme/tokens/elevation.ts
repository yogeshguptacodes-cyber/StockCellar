import type { ViewStyle } from 'react-native';

/**
 * Elevation tokens — deliberately soft. Premium UIs read as "calm": large
 * blur radii, low opacity, minimal offset. Each level bundles iOS shadow
 * properties and the Android `elevation` value; each platform ignores the
 * other's keys. Dark themes lean on surface color contrast instead.
 */
export const elevation = {
  none: {},
  /** Resting cards, list rows. */
  level1: {
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  /** Raised cards, sticky headers. */
  level2: {
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  /** Floating action buttons, popovers. */
  level3: {
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  /** Modals, bottom sheets. */
  level4: {
    shadowColor: '#1C1A18',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

export type ElevationToken = keyof typeof elevation;
