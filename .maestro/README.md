# Pruebas E2E con Maestro (PoC)

Esta carpeta contiene los flujos Maestro de la prueba de concepto. Ejecutan la app en un emulador/simulador, capturan evidencias (screenshots y video) y escriben reportes estructurados en `./e2e-reports/maestro/`.

## Identificadores de la app

| Plataforma | Variable | Valor por defecto (`app.json`) |
| --- | --- | --- |
| Android | `ANDROID_APP_ID` / `APP_ID` | `com.ivangonzalezmonabit.monabit` |
| iOS | `IOS_APP_ID` / `APP_ID` | `com.ivangonzalez-monabit.monabit` |

`APP_ID` tiene prioridad sobre las variables por plataforma. Los builds white-label (por ejemplo `com.bancounion.app`) deben pasar el identificador del binario instalado.

## Requisitos previos

1. **Maestro CLI** instalado y en `PATH`:

   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   maestro --version
   ```

   Documentación: [Installing Maestro](https://docs.maestro.dev/getting-started/installing-maestro).

2. **App ya corriendo en el dispositivo** (dev client / `expo start`, o un binario de `dist/`). Los `testID` son props de React Native: no tocan Android/iOS nativo. Con Metro basta recargar JS (Fast Refresh o `r` en el bundler). Solo hay que **reconstruir el APK/IPA** si pruebas un binario release, porque el JS va embebido.

3. **Emulador Android o simulador iOS activo**. Maestro usa el dispositivo conectado:

   ```bash
   maestro list-devices
   ```

4. Node.js (ya requerido por el repo) para los scripts `npm run test:e2e:maestro*`.

## Flujos

| Archivo | Qué cubre |
| --- | --- |
| `01_smoke_test.yaml` | Lanza la app, espera Home y verifica elementos clave (`testID`). |
| `02_main_flow.yaml` | Home → Guía de marca → Home → Secure Storage (guardar y leer un token). |

Los flujos usan **texto visible en viewport**. En Home el tab es `Storage`; la card `Secure Storage` queda bajo el fold en iPhone 17 y Maestro no la considera visible. Un `testID` solo aparece como `id:` si ese JS está en el binario que corre.

## Comandos

### Android (por defecto)

```bash
export ANDROID_APP_ID=com.ivangonzalezmonabit.monabit
npm run test:e2e:maestro
```

Con video de evidencia:

```bash
ANDROID_APP_ID=com.ivangonzalezmonabit.monabit npm run test:e2e:maestro:record
```

### iOS (simulador ya booteado)

`maestro list-devices` lista **modelos que Maestro puede crear** (`iPhone-17`). `--device` / `--udid` piden el **UDID del simulador conectado**, no ese slug. Por eso ` --device iPhone-17` falla aunque el sim esté Booted.

```bash
xcrun simctl list devices booted
```

Con un iPhone 17 booteado:

```bash
maestro --platform ios --udid 406F908E-EE39-4FD5-A418-F820303A37D7 test .maestro \
  --config .maestro/config.yaml \
  -e APP_ID=com.ivangonzalez-monabit.monabit
```

O vía npm:

```bash
MAESTRO_PLATFORM=ios \
MAESTRO_UDID=406F908E-EE39-4FD5-A418-F820303A37D7 \
APP_ID=com.ivangonzalez-monabit.monabit \
npm run test:e2e:maestro
```

Si solo hay un simulador iOS booteado, a veces basta `--platform ios` sin UDID. `iPhone-17` solo sirve para `maestro start-device --platform ios --device-model iPhone-17`, no para `test`.

### Maestro CLI directo

```bash
maestro test .maestro \
  --config .maestro/config.yaml \
  --format junit \
  --output e2e-reports/maestro/junit.xml \
  --test-output-dir e2e-reports/maestro \
  --debug-output e2e-reports/maestro/debug \
  -e APP_ID=com.ivangonzalezmonabit.monabit \
  -e RECORD_VIDEO=false
```

En un fallo, Maestro guarda automáticamente screenshot y jerarquía de vista del paso que falló (no hace falta un `takeScreenshot` extra).

## Reportes y evidencias (`./e2e-reports/maestro/`)

| Ruta | Contenido |
| --- | --- |
| `junit.xml` | Reporte JUnit para CI (flujo, duración, PASSED/FAILED). |
| `latest-summary.json` | Resumen JSON por flujo y **por paso** (`status`, `duration`, error del paso que falló). |
| `videos/` | Copias planas `.mp4`. Solo se llenan con `npm run test:e2e:maestro:record` o `npm run test:e2e:maestro:collect-videos`. El CLI de Maestro **no** escribe aquí. |
| `debug/` | `maestro.log` de la sesión. |
| `<timestamp>/<flow>/commands.json` | Desglose nativo de Maestro: cada comando, estado, duración y artefactos. |
| `<timestamp>/<flow>/screenshots/` | Screenshot automático del **paso que falló**. |
| `<timestamp>/<flow>/screen-hierarchy/` | Jerarquía de UI del fallo (por qué no matcheó un selector). |
| `<timestamp>/<flow>/takeScreenshot/` | Capturas pedidas en el YAML (evidencia de pasos OK). |
| `<timestamp>/<flow>/startRecording/` | Video original de cada flujo (`01_smoke_test.mp4`, `02_main_flow.mp4`) cuando pasas `-e RECORD_VIDEO=true`. |

Si una prueba falla, mira en este orden: `latest-summary.json` → `failedStep` → screenshot en `screenshots/` → video en `<timestamp>/<flow>/startRecording/`.

Tras un `maestro test ... -e RECORD_VIDEO=true` a mano:

```bash
npm run test:e2e:maestro:collect-videos
```

Eso copia los `.mp4` a `e2e-reports/maestro/videos/`.
