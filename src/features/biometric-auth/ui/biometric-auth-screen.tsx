import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBiometricAuth } from '@/features/biometric-auth/model/use-biometric-auth';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, Spacing } from '@/shared/ui/theme';

export function BiometricAuthScreen() {
  const { authenticate, result, isLoading } = useBiometricAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">Biometría</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Prueba autenticación con Face ID, Touch ID o huella.
          </ThemedText>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={authenticate}
            disabled={isLoading}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              {isLoading ? 'Autenticando...' : 'Autenticar'}
            </ThemedText>
          </Pressable>

          {result ? <ThemedText style={styles.result}>{result}</ThemedText> : null}
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
  result: {
    marginTop: Spacing.two,
  },
});
