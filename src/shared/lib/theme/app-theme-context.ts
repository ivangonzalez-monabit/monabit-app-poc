import { createContext } from 'react';

import { Colors, Fonts, type ThemeColor } from '@/shared/ui/theme';

export type AppTheme = {
  [K in ThemeColor]: string;
} & {
  primary: string;
  secondary: string;
  fontFamily: string;
};

export const defaultLightTheme: AppTheme = {
  ...Colors.light,
  primary: '#208AEF',
  secondary: '#0274DF',
  fontFamily: Fonts?.sans ?? 'System',
};

export const defaultDarkTheme: AppTheme = {
  ...Colors.dark,
  primary: '#208AEF',
  secondary: '#0274DF',
  fontFamily: Fonts?.sans ?? 'System',
};

export type AppThemes = {
  light: AppTheme;
  dark: AppTheme;
};

export const defaultAppThemes: AppThemes = {
  light: defaultLightTheme,
  dark: defaultDarkTheme,
};

export const AppThemeContext = createContext<AppThemes | null>(null);
