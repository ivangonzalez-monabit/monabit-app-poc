import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

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
          <NativeTabs>
            <NativeTabs.Trigger name="index">
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

            <NativeTabs.Trigger name="document-capture">
              <NativeTabs.Trigger.Icon sf="doc.fill" md="description" />
              <NativeTabs.Trigger.Label>Documentos</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="secure-storage">
              <NativeTabs.Trigger.Icon sf="lock.fill" md="lock" />
              <NativeTabs.Trigger.Label>Storage</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        </FeatureFlagsProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
