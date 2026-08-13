import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export type LocationReading = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

function normalizeNullable(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value < 0) {
    return null;
  }

  return value;
}

export function formatNullable(value: number | null, unit?: string): string {
  if (value === null) {
    return 'N/A';
  }

  return unit ? `${value} ${unit}` : String(value);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function useLocationCapture() {
  const [reading, setReading] = useState<LocationReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setReading(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('❌ Falló: permiso de ubicación denegado');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setReading({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: normalizeNullable(position.coords.altitude),
        accuracy: normalizeNullable(position.coords.accuracy),
        altitudeAccuracy: normalizeNullable(position.coords.altitudeAccuracy),
        heading: normalizeNullable(position.coords.heading),
        speed: normalizeNullable(position.coords.speed),
        timestamp: position.timestamp,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      setError(`❌ Falló: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getLocation, reading, error, isLoading };
}
