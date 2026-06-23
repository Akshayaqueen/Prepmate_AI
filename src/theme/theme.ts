/**
 * PrepMate AI — Design System
 *
 * Central theme: color palette, typography, spacing, radii, shadows, gradients.
 * Used across all screens for a cohesive, elegant look.
 */

import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

// ─── Brand Palette ───────────────────────────────────────────────────────────

export const palette = {
  // Primary brand — indigo/violet
  primary: '#6C5CE7',
  primaryDark: '#5546D6',
  primaryLight: '#A29BFE',

  // Accents
  accent: '#00CEC9', // teal
  coral: '#FF6B6B',
  amber: '#FDCB6E',
  green: '#00B894',
  blue: '#0984E3',
  pink: '#FD79A8',

  // Neutrals
  ink: '#1A1B2E',
  slate: '#4A4E69',
  gray: '#6B7280',
  mist: '#9CA3AF',
  cloud: '#E5E7EB',
  fog: '#F1F3F8',
  snow: '#F7F8FC',
  white: '#FFFFFF',

  // Semantic
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#FF6B6B',
} as const;

// ─── Gradients ───────────────────────────────────────────────────────────────

export const gradients = {
  brand: ['#6C5CE7', '#8E7CFF'] as const,
  brandDeep: ['#5546D6', '#6C5CE7'] as const,
  sunset: ['#FF6B6B', '#FDCB6E'] as const,
  ocean: ['#0984E3', '#00CEC9'] as const,
  mint: ['#00B894', '#55EFC4'] as const,
  candy: ['#FD79A8', '#A29BFE'] as const,
  night: ['#2D3436', '#4A4E69'] as const,
};

/** Persona-specific gradient accents */
export const personaGradients = {
  friendly: ['#00B894', '#55EFC4'] as const,
  tough: ['#FF6B6B', '#FDA085'] as const,
  technical: ['#0984E3', '#6C5CE7'] as const,
};

/** Confidence category colors */
export const categoryColors = {
  needs_work: '#FF6B6B',
  developing: '#FDCB6E',
  competent: '#0984E3',
  confident: '#00B894',
};

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

// ─── Shadows (elevation presets) ─────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#1A1B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1B2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── Paper Themes ────────────────────────────────────────────────────────────

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    onPrimary: palette.white,
    primaryContainer: '#EAE7FF',
    onPrimaryContainer: palette.primaryDark,
    secondary: palette.accent,
    background: palette.snow,
    surface: palette.white,
    surfaceVariant: palette.fog,
    onSurface: palette.ink,
    onSurfaceVariant: palette.gray,
    outline: palette.cloud,
    error: palette.error,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.primaryLight,
    onPrimary: palette.ink,
    primaryContainer: '#3A3470',
    onPrimaryContainer: palette.primaryLight,
    secondary: palette.accent,
    background: '#15162A',
    surface: '#1E1F38',
    surfaceVariant: '#2A2C48',
    onSurface: '#ECEDF5',
    onSurfaceVariant: '#A9ADC9',
    outline: '#3A3C5C',
    error: palette.coral,
  },
};

export type AppTheme = MD3Theme;
