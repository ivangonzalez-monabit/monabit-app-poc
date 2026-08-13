import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

export type CapturedFile = {
  name: string;
  size: number | null;
  uri: string;
  mimeType: string | null;
  showImagePreview: boolean;
};

function getFileName(uri: string, fallbackName?: string | null): string {
  if (fallbackName) {
    return fallbackName;
  }

  return uri.split('/').pop() ?? 'archivo-desconocido';
}

function mapImageAsset(asset: ImagePicker.ImagePickerAsset): CapturedFile {
  return {
    name: getFileName(asset.uri, asset.fileName),
    size: asset.fileSize ?? null,
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    showImagePreview: true,
  };
}

export function useDocumentCapture() {
  const [file, setFile] = useState<CapturedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const takePhoto = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFile(null);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('❌ Falló: permiso de cámara denegado');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        setError('❌ Falló: captura cancelada');
        return;
      }

      setFile(mapImageAsset(result.assets[0]));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      setError(`❌ Falló: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFile(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('❌ Falló: permiso de galería denegado');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        setError('❌ Falló: selección cancelada');
        return;
      }

      setFile(mapImageAsset(result.assets[0]));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      setError(`❌ Falló: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickDocument = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFile(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        setError('❌ Falló: selección cancelada');
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? null;

      setFile({
        name: getFileName(asset.uri, asset.name),
        size: asset.size ?? null,
        uri: asset.uri,
        mimeType,
        showImagePreview: (mimeType ?? '').startsWith('image/'),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      setError(`❌ Falló: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { takePhoto, pickFromGallery, pickDocument, file, error, isLoading };
}
