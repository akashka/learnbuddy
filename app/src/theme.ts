/**
 * LearnBuddy App Design System
 * Aligned with docs/BRAND-GUIDELINES.md
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base scale for responsive sizing (design based on 375px width)
const scale = SCREEN_WIDTH / 375;
const verticalScale = SCREEN_HEIGHT / 812;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale * size - size) * factor;

export const moderateVerticalScale = (size: number, factor = 0.5) =>
  size + (verticalScale * size - size) * factor;

// Spacing scale (4pt grid) - per brand guidelines
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius - per brand guidelines (sm: 4px, DEFAULT: 8px, lg: 12px, xl: 16px)
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Colors - LearnBuddy brand palette per BRAND-GUIDELINES.md
export const colors = {
  // Primary (brand-600, brand-700, brand-800)
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  primaryLight: '#6366f1',
  // Accent - warm amber for CTAs (use sparingly)
  accent: '#f59e0b',
  accentDark: '#d97706',
  // Semantic
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  // Surfaces - per brand guidelines
  background: '#fafbff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  // Text
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  // Borders
  border: '#c7d2fe',
  borderLight: '#e0e7ff',
  // Brand palette for components
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
} as const;

// Typography - per brand guidelines (DM Sans, Outfit)
export const typography = {
  h1: { fontSize: moderateScale(28), fontWeight: '800' as const },
  h2: { fontSize: moderateScale(24), fontWeight: '700' as const },
  h3: { fontSize: moderateScale(20), fontWeight: '600' as const },
  body: { fontSize: moderateScale(16), fontWeight: '400' as const },
  bodySmall: { fontSize: moderateScale(14), fontWeight: '400' as const },
  caption: { fontSize: moderateScale(12), fontWeight: '400' as const },
  button: { fontSize: moderateScale(16), fontWeight: '600' as const },
} as const;

// Shadow (platform-specific)
export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
  default: {},
});

export const shadowMd = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
  },
  default: {},
});
