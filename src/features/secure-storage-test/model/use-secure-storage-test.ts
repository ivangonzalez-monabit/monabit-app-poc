import { useCallback, useState } from 'react';

import { getSecureItem, setSecureItem } from '@/shared/lib/secure-storage';

const TEST_KEY = 'foundation_test_token';
const TEST_VALUE = 'monabit-foundation-token';

export function useSecureStorageTest() {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveTestToken = useCallback(async (customValue?: string) => {
    setIsLoading(true);
    setError(null);
    setValue(null);

    try {
      const valueToSave = customValue?.trim() || TEST_VALUE;
      await setSecureItem(TEST_KEY, valueToSave);
      setValue('✅ Token de prueba guardado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      setError(`❌ Falló al guardar: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const readTestToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setValue(null);

    try {
      const storedValue = await getSecureItem(TEST_KEY);
      if (!storedValue) {
        setError('❌ No hay token guardado');
        return;
      }

      setValue(storedValue);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      setError(`❌ Falló al leer: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { saveTestToken, readTestToken, value, error, isLoading };
}
