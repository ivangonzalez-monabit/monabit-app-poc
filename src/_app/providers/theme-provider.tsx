import { DarkTheme, DefaultTheme, ThemeProvider as RouterThemeProvider } from 'expo-router';
import { type PropsWithChildren, useMemo } from 'react';

import { brandConfig } from '@/_app/config/brand.config';
import { useColorScheme } from '@/shared/lib/hooks/use-color-scheme';
import {
  AppThemeContext,
  type AppTheme,
  type AppThemes,
} from '@/shared/lib/theme/app-theme-context';
import { Colors } from '@/shared/ui/theme';

function buildTheme(scheme: 'light' | 'dark'): AppTheme {
  const base = Colors[scheme];

  return {
    ...base,
    text: scheme === 'light' ? brandConfig.colors.text : base.text,
    background: scheme === 'light' ? brandConfig.colors.background : base.background,
    primary: brandConfig.colors.primary,
    secondary: brandConfig.colors.secondary,
    fontFamily: brandConfig.typography.fontFamily,
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const themes = useMemo<AppThemes>(
    () => ({
      light: buildTheme('light'),
      dark: buildTheme('dark'),
    }),
    [],
  );

  return (
    <AppThemeContext.Provider value={themes}>
      <RouterThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {children}
      </RouterThemeProvider>
    </AppThemeContext.Provider>
  );
}
