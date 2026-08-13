import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSecureStorageTest } from '@/features/secure-storage-test/model/use-secure-storage-test';
import { useTheme } from '@/shared/lib/hooks/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, Colors, Spacing } from '@/shared/ui/theme';

export function SecureStorageTestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const theme = useTheme();
  const { saveTestToken, readTestToken, value, error, isLoading } = useSecureStorageTest();
  const [inputValue, setInputValue] = useState('');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">Secure Storage</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Prueba escritura y lectura cifrada con expo-secure-store.
          </ThemedText>

          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Valor personalizado (opcional)"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.backgroundSelected,
                backgroundColor: colors.backgroundElement,
                fontFamily: theme.fontFamily,
              },
            ]}
          />

          <ThemedView style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => saveTestToken(inputValue)}
              disabled={isLoading}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Guardar token de prueba
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={readTestToken}
              disabled={isLoading}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Leer token
              </ThemedText>
            </Pressable>
          </ThemedView>

          {value ? (
            <ThemedView type="backgroundElement" style={styles.resultBox}>
              <ThemedText type="code">{value}</ThemedText>
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
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  actions: {
    gap: Spacing.two,
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
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  error: {
    marginTop: Spacing.two,
  },
});
