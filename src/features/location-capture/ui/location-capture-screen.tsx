import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatNullable,
  formatTimestamp,
  useLocationCapture,
} from '@/features/location-capture/model/use-location-capture';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, Spacing } from '@/shared/ui/theme';

export function LocationCaptureScreen() {
  const { getLocation, reading, error, isLoading } = useLocationCapture();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">Ubicación</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Obtén coordenadas y metadatos crudos del dispositivo.
          </ThemedText>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={getLocation}
            disabled={isLoading}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              {isLoading ? 'Obteniendo...' : 'Obtener ubicación'}
            </ThemedText>
          </Pressable>

          {reading ? (
            <ThemedView type="backgroundElement" style={styles.resultBox}>
              <ThemedText type="code">lat: {reading.latitude}</ThemedText>
              <ThemedText type="code">lng: {reading.longitude}</ThemedText>
              <ThemedText type="code">
                altitud: {formatNullable(reading.altitude, 'm')}
              </ThemedText>
              <ThemedText type="code">
                precisión: {formatNullable(reading.accuracy, 'm')}
              </ThemedText>
              <ThemedText type="code">
                precisión altitud: {formatNullable(reading.altitudeAccuracy, 'm')}
              </ThemedText>
              <ThemedText type="code">
                rumbo: {formatNullable(reading.heading, '°')}
              </ThemedText>
              <ThemedText type="code">
                velocidad: {formatNullable(reading.speed, 'm/s')}
              </ThemedText>
              <ThemedText type="code">fecha: {formatTimestamp(reading.timestamp)}</ThemedText>
            </ThemedView>
          ) : null}

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
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
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  description: {
    lineHeight: 22,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
  },
  resultBox: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  error: {
    marginTop: Spacing.two,
  },
});
