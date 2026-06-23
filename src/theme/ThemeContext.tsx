/**
 * Theme context — provides light/dark mode toggling across the app.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { lightTheme, darkTheme, AppTheme, palette } from './theme';

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

/** Semantic colors that adapt to light/dark mode. */
export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
}

const LIGHT_COLORS: ThemeColors = {
  bg: palette.snow,
  surface: palette.white,
  surfaceAlt: palette.fog,
  text: palette.ink,
  textMuted: palette.gray,
  border: palette.cloud,
  primary: palette.primary,
};

const DARK_COLORS: ThemeColors = {
  bg: '#15162A',
  surface: '#1E1F38',
  surfaceAlt: '#2A2C48',
  text: '#ECEDF5',
  textMuted: '#A9ADC9',
  border: '#3A3C5C',
  primary: palette.primaryLight,
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

/** Returns the active semantic color set for the current theme mode. */
export const useColors = (): ThemeColors => {
  const { isDark } = useThemeMode();
  return isDark ? DARK_COLORS : LIGHT_COLORS;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);

  const value = useMemo(
    () => ({
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme,
    }),
    [isDark, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
