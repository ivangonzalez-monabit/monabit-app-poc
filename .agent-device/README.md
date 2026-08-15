# Pruebas E2E con agent-device (PoC)

Misma cobertura que Maestro: smoke de Home y flujo Guía de marca → Secure Storage. [agent-device](https://github.com/callstack/agent-device) es **caja negra** (XCTest / ADB): abre la app ya instalada, sin SDK en el binario.

Los flujos están en `.ad` (replay determinista, sin IA en CI). Evidencia: JUnit, screenshots, y video con `--record-video`.

Requiere **Node ≥ 22.12** (esta máquina cumple). Docs: [Replay & E2E](https://oss.callstack.com/agent-device/docs/replay-e2e), [Commands](https://oss.callstack.com/agent-device/docs/commands).

## Requisitos

```bash
npx agent-device doctor
```

Simulador/emulador booteado y la app instalada (`com.bancounion.app` u otro `APP_ID`).

Los `.ad` declaran `context platform=ios`. Para Android, cambia esa línea a `android` o duplica los archivos; `npm run test:e2e:ad` con `AD_PLATFORM=android` **omite** scripts cuyo `context platform` no coincida.

## Identificadores

| Variable | Default iOS | Default Android |
| --- | --- | --- |
| `APP_ID` (gana) | `com.ivangonzalez-monabit.monabit` | `com.ivangonzalezmonabit.monabit` |
| `IOS_APP_ID` / `ANDROID_APP_ID` | idem | idem |
| `AD_DEVICE` | Nombre de `agent-device devices` (`iPhone 17`), **no** el UDID |
| `AD_UDID` | UDID de iOS (`--udid`). Si `AD_DEVICE` parece un UUID, el runner lo manda como `--udid`. |

White-label:

```bash
npx agent-device devices --platform ios

APP_ID=com.bancounion.app AD_DEVICE="iPhone 17" npm run test:e2e:ad
```

O con UDID:

```bash
APP_ID=com.bancounion.app AD_UDID=406F908E-EE39-4FD5-A418-F820303A37D7 npm run test:e2e:ad
```

## Flujos

| Archivo | Qué cubre |
| --- | --- |
| `01_smoke.ad` | `open --relaunch`, `wait text` + selectores `role`+`label` (Home tiene dos nodos "Home"). |
| `02_main_flow.ad` | Guía de marca → tab **Storage** → `fill` del único `textfield` (el placeholder no está en el árbol AX) → celdas Guardar/Leer. El éxito incluye `✅`; se espera `Token de prueba guardado`. |

En `.ad`, un selector con espacios va como un solo argumento JSON-quoted, p. ej. `press "role=\"button\" label=\"Ver guía de marca\""`. No pongas `--settle` justo después: el lexer se traga el flag. `wait 'text="Foundation"'` busca el literal `text="Foundation"`; usa `wait text "Foundation"`.

## Comandos

```bash
npm run test:e2e:ad
npm run test:e2e:ad:record
```

CLI directo:

```bash
npx agent-device test .agent-device \
  --platform ios \
  --device "iPhone 17" \
  --artifacts-dir agent-device-reports/2026-08-14T19-49-12 \
  --reporter default \
  --reporter junit:agent-device-reports/2026-08-14T19-49-12/junit.xml \
  -e APP_ID=com.bancounion.app \
  --record-video
```

`npm run test:e2e:ad` crea una carpeta por corrida con hora local (`YYYY-MM-DDTHH-mm-ss`). `--record-video` escribe `recording.mp4` **en cada intento** ahí.

## Reportes (`./agent-device-reports/<fecha>/`)

| Ruta | Contenido |
| --- | --- |
| `junit.xml` | Suite JUnit (duración, pass/fail). |
| `<flow>/…/recording.mp4` | Video si usaste `:record`. |
| `…/replay.ad`, `result.txt`, `replay-timing.ndjson` | Plan ejecutado y timings. |
| Screenshots (`smoke-home.png`, etc.) | Pedidos en el `.ad`; caen en el dir de artifacts del intento (o `agent-device-reports/` si corres `replay` a mano). |
| En fallo | `REPLAY_DIVERGENCE`: paso, línea, snapshot y sugerencias de selector. |

Opcional: los YAML de Maestro se pueden lanzar con `agent-device replay flow.yaml --maestro` (subconjunto; `startRecording` de Maestro no aplica — usa `--record-video`).
