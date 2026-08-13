import { Stack } from 'expo-router';

import { useTheme } from '@/shared/lib/hooks/use-theme';

export default function HomeLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: theme.fontFamily },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="brand-guide" options={{ title: 'Guía gráfica' }} />
    </Stack>
  );
}
