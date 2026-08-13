import { useFonts } from 'expo-font';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { brandFontSources } from '@/_app/config/brand-font';
import { FeatureFlagsProvider } from '@/_app/providers/feature-flags-provider';
import { QueryProvider } from '@/_app/providers/query-provider';
import { ThemeProvider } from '@/_app/providers/theme-provider';
import { useFeatureFlags } from '@/shared/lib/hooks/use-feature-flags';

SplashScreen.preventAutoHideAsync();

function AppTabs() {
  const { documentCapture } = useFeatureFlags();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="biometric-auth">
        <NativeTabs.Trigger.Icon sf="faceid" md="fingerprint" />
        <NativeTabs.Trigger.Label>Biometría</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="location">
        <NativeTabs.Trigger.Icon sf="location.fill" md="location_on" />
        <NativeTabs.Trigger.Label>Ubicación</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="document-capture" hidden={!documentCapture}>
        <NativeTabs.Trigger.Icon sf="doc.fill" md="description" />
        <NativeTabs.Trigger.Label>Documentos</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="secure-storage">
        <NativeTabs.Trigger.Icon sf="lock.fill" md="lock" />
        <NativeTabs.Trigger.Label>Storage</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(brandFontSources);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
