import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandConfig } from '@/_app/config/brand.config';
import { useFeatureFlags } from '@/shared/lib/hooks/use-feature-flags';
import { useTheme } from '@/shared/lib/hooks/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/ui/theme';

const CAPABILITIES = [
  {
    href: '/biometric-auth' as const,
    title: 'Biometría',
    description: 'Face ID, Touch ID o huella',
  },
  {
    href: '/location' as const,
    title: 'Ubicación',
    description: 'Latitud y longitud del dispositivo',
  },
  {
    href: '/document-capture' as const,
    title: 'Documentos',
    description: 'Cámara y selector de archivos',
    featureFlag: 'documentCapture' as const,
  },
  {
    href: '/secure-storage' as const,
    title: 'Secure Storage',
    description: 'Escritura y lectura cifrada',
  },
] as const;

export default function HomeScreen() {
  const theme = useTheme();
  const featureFlags = useFeatureFlags();

  const capabilities = CAPABILITIES.filter(
    (capability) =>
      !('featureFlag' in capability) || featureFlags[capability.featureFlag],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.brandHeader}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: theme.primary, borderColor: theme.secondary },
              ]}>
              <Image source={brandConfig.logo} style={styles.logo} contentFit="contain" />
            </View>
            <ThemedText type="title" style={styles.brandName}>
              {brandConfig.name}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.header}>
            <ThemedText type="smallBold" style={styles.foundationTitle}>
              Foundation
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Capacidades nativas esenciales para validar el stack antes de producto.
            </ThemedText>
          </ThemedView>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/brand-guide')}
            style={({ pressed }) => [
              styles.brandGuideButton,
              { backgroundColor: theme.primary, borderColor: theme.secondary },
              pressed && styles.cardPressed,
            ]}>
            <ThemedText type="smallBold" style={styles.brandGuideButtonText}>
              Ver guía de marca
            </ThemedText>
          </Pressable>

          <ThemedView style={styles.grid}>
            {capabilities.map((capability) => (
              <Link key={capability.href} href={capability.href} asChild>
                <Pressable style={({ pressed }) => [pressed && styles.cardPressed]}>
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText type="smallBold">{capability.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {capability.description}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </Link>
            ))}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: Spacing.three,
    borderWidth: 2,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
  },
  brandName: {
    fontSize: 36,
    lineHeight: 40,
    textAlign: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  foundationTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    lineHeight: 22,
  },
  brandGuideButton: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  brandGuideButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  grid: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  cardPressed: {
    opacity: 0.8,
  },
});
