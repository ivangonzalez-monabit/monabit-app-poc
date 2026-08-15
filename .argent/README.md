# Pruebas E2E con Argent (PoC)

Misma cobertura que Maestro / agent-device: smoke de Home y flujo Guía de marca → Secure Storage. [Argent](https://github.com/software-mansion/argent) (Software Mansion) es **caja negra** para este PoC: `argent flow run` abre la app ya instalada y resuelve selectores sobre el árbol nativo (UIView / accessibility), sin SDK en el binario y sin LLM en CI.

Los flujos están en `.argent/flows/*.yaml` (replay determinista). Evidencia: JSON por paso, JUnit, screenshots, y video con `--record` (`ffmpeg` requerido).

Requiere **Node ≥ 20.12**. Docs: [Argent](https://argent.swmansion.com), [Expo + Argent](https://docs.expo.dev/agents/argent/).

## Requisitos

```bash
npx argent --help
```

Simulador/emulador booteado y la app instalada (`com.bancounion.app` u otro `APP_ID`). Para video: `brew install ffmpeg`.

No hace falta `argent init` (eso registra MCP/skills en el editor). Este PoC usa solo el CLI local de `devDependencies`.

## Identificadores

| Variable | Default iOS | Default Android |
| --- | --- | --- |
| `APP_ID` (gana) | `com.ivangonzalez-monabit.monabit` | `com.ivangonzalezmonabit.monabit` |
| `IOS_APP_ID` / `ANDROID_APP_ID` | idem | idem |
| `ARGENT_PLATFORM` | `ios` | `android` |
| `ARGENT_DEVICE` | Nombre o UDID/serial de `argent run list-devices` | |
| `ARGENT_UDID` | Id explícito (`--device`) | |

White-label:

```bash
npx argent run list-devices --json

APP_ID=com.bancounion.app ARGENT_DEVICE="iPhone 17" npm run test:e2e:argent
```

## Flujos

| Archivo | Qué cubre |
| --- | --- |
| `01_smoke.yaml` | `launch` + Home (`Foundation`, CTA, card Biometría). No afirma los labels de `NativeTabs` (`Home` / `Storage`): a menudo no están en el árbol UIView que usa el runner. |
| `02_main_flow.yaml` | Guía de marca → swipe desde el borde (back de iOS; los labels de `NativeTabs` y el botón `< index` no están en el árbol UIView del runner) → card **Secure Storage** (`scroll-to`) → escribir `argent-e2e-token` en el campo → Guardar/Leer y afirmar ese valor. |

Selectores por **texto** (el `testID` de RN a menudo no llega al árbol AX del binario white-label). En iOS no uses `role` copiado de `describe` (AX vs UIView). El `TextInput` de Secure Storage no tiene label AX: `type into: { role: AXTextField }` pica un frame local (cerca de la status bar) y no escribe; el flujo pica el campo (~`0.50, 0.26` en iPhone 17) y usa `keyboard`. `snapshot:` es visual regression (baselines); aquí las capturas son `tool: screenshot` (evidencia, no veredicto).

## Comandos

```bash
npm run test:e2e:argent
npm run test:e2e:argent:record
```

CLI directo:

```bash
npx argent flow run .argent/flows/01_smoke.yaml \
  --platform ios \
  --device "<UDID>" \
  --json \
  --output argent-reports/manual
```

`npm run test:e2e:argent` crea una carpeta por corrida con hora local (`YYYY-MM-DDTHH-mm-ss`). `:record` llama `screen-recording-start` / `stop` alrededor de cada flujo.

## Reportes (`./argent-reports/<fecha>/`)

| Ruta | Contenido |
| --- | --- |
| `junit.xml` | Suite JUnit (duración, pass/fail). |
| `summary.json` | Resumen por flujo. |
| `<flow>/report.json` | Informe nativo: cada paso `pass`/`fail`/`skip`/`error` + `reason`. |
| `<flow>/screenshot-*.png` | Capturas de `tool: screenshot` (si Argent materializa `hostPath`). |
| `<flow>/recording.mp4` | Video si usaste `:record`. |
| `--output` | Imágenes de `snapshot` fallido (baseline/current/diff), si algún día se añaden. |

Si una prueba falla, mira `summary.json` → `report.json` (primer paso `fail`/`error`) → screenshot/video.

Los artefactos no se trackean en git (`argent-reports/`).
