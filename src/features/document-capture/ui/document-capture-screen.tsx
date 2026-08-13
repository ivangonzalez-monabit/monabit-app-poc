import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDocumentCapture } from '@/features/document-capture/model/use-document-capture';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, Spacing } from '@/shared/ui/theme';

export function DocumentCaptureScreen() {
  const { takePhoto, pickFromGallery, pickDocument, file, error, isLoading } =
    useDocumentCapture();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">Documentos</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Captura una foto, elige desde galería o selecciona un documento.
          </ThemedText>

          <ThemedView style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={takePhoto}
              disabled={isLoading}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Tomar foto
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={pickFromGallery}
              disabled={isLoading}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Elegir desde galería
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={pickDocument}
              disabled={isLoading}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Elegir documento
              </ThemedText>
            </Pressable>
          </ThemedView>

          {file ? (
            <ThemedView type="backgroundElement" style={styles.resultBox}>
              {file.showImagePreview ? (
                <Image
                  source={{ uri: file.uri }}
                  style={styles.preview}
                  contentFit="cover"
                />
              ) : null}

              <ThemedText type="smallBold">Archivo capturado</ThemedText>
              <ThemedText type="code">nombre: {file.name}</ThemedText>
              <ThemedText type="code">
                tamaño: {file.size !== null ? `${file.size} bytes` : 'desconocido'}
              </ThemedText>
              <ThemedText type="code">
                tipo: {file.mimeType ?? 'desconocido'}
              </ThemedText>
              <ThemedText type="code" style={styles.uri}>
                uri: {file.uri}
              </ThemedText>
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
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: Spacing.two,
  },
  uri: {
    flexShrink: 1,
  },
  error: {
    marginTop: Spacing.two,
  },
});
