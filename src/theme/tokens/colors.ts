/**
 * Primitive color palette.
 *
 * Raw, brand-level color scales — the single source of truth for every color
 * in the app. Components must NEVER import this file directly: they consume
 * semantic colors from the active theme (`useTheme().colors`), which maps
 * these primitives per color scheme. This indirection is what makes dark
 * mode, high-contrast themes, and future re-brands zero-cost for feature code.
 */
export const palette = {
  // Brand — deep wine burgundy.
  wine50: '#FBF0F3',
  wine100: '#F5DCE3',
  wine200: '#E8B3C2',
  wine300: '#D5849D',
  wine400: '#BC5578',
  wine500: '#9E3459',
  wine600: '#822344',
  wine700: '#651934',
  wine800: '#491223',
  wine900: '#310B17',

  // Accent — aged gold (spirits / premium tier).
  gold100: '#FAF1DC',
  gold200: '#F2E0B4',
  gold300: '#E5C97F',
  gold400: '#D4AF37',
  gold500: '#B8952A',
  gold600: '#8F7420',
  gold800: '#453711',

  // Neutrals — slightly warm to sit well with the brand hues.
  neutral0: '#FFFFFF',
  neutral50: '#FAF9F7',
  neutral100: '#F3F1EE',
  neutral200: '#E5E2DD',
  neutral300: '#CFCBC4',
  neutral400: '#A8A39B',
  neutral500: '#7E7A72',
  neutral600: '#5C5852',
  neutral700: '#3F3C38',
  neutral800: '#2A2724',
  neutral900: '#1C1A18',
  neutral950: '#121110',
  neutral1000: '#000000',

  // Feedback — success.
  green100: '#E3F4E8',
  green400: '#4CAF6E',
  green500: '#2E8B57',
  green700: '#1F6B41',
  green900: '#123B26',

  // Feedback — danger.
  red100: '#FCE8E8',
  red400: '#E0605E',
  red500: '#CC3B39',
  red700: '#A02220',
  red900: '#4A1413',

  // Feedback — warning.
  amber100: '#FDF3E0',
  amber400: '#E8A93D',
  amber500: '#D18F1F',
  amber700: '#9C6A12',
  amber900: '#4A320B',

  // Feedback — info.
  blue100: '#E5F0FB',
  blue400: '#4C8FDB',
  blue500: '#2F73C4',
  blue700: '#1F569A',
  blue900: '#122C4E',
} as const;

export type PaletteColor = keyof typeof palette;
