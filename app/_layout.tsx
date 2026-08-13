import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import AppTabs from '@/_app/navigation/app-tabs';
import { FeatureFlagsProvider } from '@/_app/providers/feature-flags-provider';
import { QueryProvider } from '@/_app/providers/query-provider';
import { ThemeProvider } from '@/_app/providers/theme-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <QueryProvider>
        <FeatureFlagsProvider>
          <AppTabs />
        </FeatureFlagsProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
