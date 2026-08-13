import { DarkTheme, DefaultTheme, ThemeProvider as RouterThemeProvider } from 'expo-router';
import { type PropsWithChildren } from 'react';

import { useColorScheme } from '@/shared/lib/hooks/use-color-scheme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  return (
    <RouterThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
    </RouterThemeProvider>
  );
}
