import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandConfig } from '@/_app/config/brand.config';
import { useFeatureFlags } from '@/shared/lib/hooks/use-feature-flags';
import { useTheme } from '@/shared/lib/hooks/use-theme';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/ui/theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

const COLOR_SWATCHES = [
  { key: 'primary', label: 'Primario' },
  { key: 'secondary', label: 'Secundario' },
  { key: 'background', label: 'Fondo' },
  { key: 'text', label: 'Texto' },
] as const;

const FEATURE_FLAG_LABELS: Record<keyof ReturnType<typeof useFeatureFlags>, string> = {
  documentCapture: 'Captura de documentos',
};

export default function BrandGuideScreen() {
  const theme = useTheme();
  const featureFlags = useFeatureFlags();

  return (
    <ThemedView style={styles.container} testID="brand-guide-screen">
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Tokens de marca cargados en runtime desde brand.config.ts.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.section}>
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

          <ThemedView style={styles.section} testID="brand-guide-colors">
            <ThemedText type="smallBold">Colores</ThemedText>
            <View style={styles.swatches}>
              {COLOR_SWATCHES.map(({ key, label }) => {
                const color = brandConfig.colors[key];

                return (
                  <View key={key} style={styles.swatchItem}>
                    <View style={[styles.swatch, { backgroundColor: color }]} />
                    <ThemedText type="smallBold">{label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {color}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Tipografía</ThemedText>
            <ThemedView type="backgroundElement" style={styles.typographySample}>
              <ThemedText style={styles.typographyHeading}>
                Heading — {brandConfig.typography.fontFamily}
              </ThemedText>
              <ThemedText style={styles.typographyBody}>
                Texto de cuerpo con la fuente de marca. MonaBit Foundation valida capacidades
                nativas antes de producto.
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="smallBold">Feature flags</ThemedText>
            <ThemedView type="backgroundElement" style={styles.flagsList}>
              {(Object.keys(featureFlags) as (keyof typeof featureFlags)[]).map((flagKey) => (
                <View key={flagKey} style={styles.flagRow}>
                  <ThemedText type="small">{FEATURE_FLAG_LABELS[flagKey] ?? flagKey}</ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    {featureFlags[flagKey] ? 'ON' : 'OFF'}
                  </ThemedText>
                </View>
              ))}
            </ThemedView>
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
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  description: {
    lineHeight: 22,
  },
  section: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  logoContainer: {
    width: 104,
    height: 104,
    borderRadius: Spacing.three,
    borderWidth: 2,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
  },
  brandName: {
    textAlign: 'center',
    fontSize: 36,
    lineHeight: 40,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  swatchItem: {
    width: '47%',
    gap: Spacing.one,
  },
  swatch: {
    height: 72,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000020',
  },
  typographySample: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  typographyHeading: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
  },
  typographyBody: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  flagsList: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
