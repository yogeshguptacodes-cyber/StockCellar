/**
 * Motion tokens.
 *
 * Durations, easing curves, and spring presets shared by every animation in
 * the app (Reanimated, LayoutAnimation, CSS on web). Consistent motion is a
 * brand attribute — never inline ad-hoc durations in components.
 */
export const motion = {
  duration: {
    /** Micro-feedback: pressed states, checkbox ticks. */
    instant: 80,
    /** Small transitions: fades, highlights. */
    fast: 150,
    /** Standard transitions: list reorder, collapse/expand. */
    normal: 240,
    /** Large surfaces: sheets, modals, screen overlays. */
    slow: 400,
  },
  /** cubic-bezier control points `[x1, y1, x2, y2]`. */
  easing: {
    standard: [0.2, 0, 0, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
  },
  /** Reanimated `withSpring` presets. */
  spring: {
    gentle: { damping: 18, stiffness: 160, mass: 1 },
    snappy: { damping: 22, stiffness: 320, mass: 0.9 },
  },
} as const;

export type MotionDuration = keyof typeof motion.duration;
