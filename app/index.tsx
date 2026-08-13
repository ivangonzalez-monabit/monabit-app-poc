import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  },
  {
    href: '/secure-storage' as const,
    title: 'Secure Storage',
    description: 'Escritura y lectura cifrada',
  },
] as const;

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              MonaBit Foundation
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Capacidades nativas esenciales para validar el stack antes de producto.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.grid}>
            {CAPABILITIES.map((capability) => (
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
  header: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    lineHeight: 22,
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
