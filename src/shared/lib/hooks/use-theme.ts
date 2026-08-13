import { useContext } from 'react';

import { useColorScheme } from '@/shared/lib/hooks/use-color-scheme';
import {
  AppThemeContext,
  defaultAppThemes,
  type AppTheme,
} from '@/shared/lib/theme/app-theme-context';

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const themeKey = scheme === 'unspecified' ? 'light' : scheme;
  const themes = useContext(AppThemeContext) ?? defaultAppThemes;

  return themes[themeKey];
}
