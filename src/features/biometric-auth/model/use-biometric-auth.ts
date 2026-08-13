import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useState } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  not_enrolled: 'biometría no enrolada',
  user_cancel: 'cancelado por el usuario',
  app_cancel: 'cancelado por la app',
  not_available: 'no disponible en este dispositivo',
  lockout: 'demasiados intentos fallidos',
  no_space: 'sin espacio en el dispositivo',
  timeout: 'tiempo de espera agotado',
  unable_to_process: 'no se pudo procesar',
  unknown: 'error desconocido',
  system_cancel: 'cancelado por el sistema',
  user_fallback: 'el usuario eligió alternativa',
  invalid_context: 'contexto inválido',
  passcode_not_set: 'código de acceso no configurado',
  authentication_failed: 'autenticación fallida',
};

function getErrorMessage(error: string): string {
  return ERROR_MESSAGES[error] ?? error;
}

export function useBiometricAuth() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setResult('❌ Falló: hardware biométrico no disponible');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setResult('❌ Falló: biometría no enrolada');
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar con biometría',
        cancelLabel: 'Cancelar',
      });

      if (authResult.success) {
        setResult('✅ Autenticado');
        return;
      }

      const reason = authResult.error ? getErrorMessage(authResult.error) : 'autenticación fallida';
      setResult(`❌ Falló: ${reason}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      setResult(`❌ Falló: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { authenticate, result, isLoading };
}
