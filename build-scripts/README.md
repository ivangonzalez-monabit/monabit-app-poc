# Build Scripts

Scripts locales para simular el pipeline multimarca: fetch de config, personalización, prebuild, binario Release e instalación en emulador/simulador.

## Requisitos

- Node.js 18+
- Git working tree **limpio** (sin cambios sin commitear)
- Backend mock corriendo (`mock-config-server/`)
- Dependencias del repo instaladas (`npm install` en la raíz)
- **Android:** emulador ya abierto
- **iOS:** macOS, Xcode y un Simulator ya abierto

## Uso

1. Levantá el mock server:

```bash
cd mock-config-server
npm run start
```

2. Desde la raíz del repo:

```bash
# Android (default)
node build-scripts/build-client.js --slug banco-aurelia --platform android

# iOS Simulator, configuración Release (sin Metro)
node build-scripts/build-client.js --slug banco-aurelia --platform ios
```

Otros slugs disponibles: `banco-union`.

Si omitís `--platform`, usa `android`.

### URL del backend

Por defecto usa `http://localhost:4000`. Para cambiarla:

```bash
node build-scripts/build-client.js --slug banco-union --platform android --config-url http://10.0.2.2:4000
```

## Qué hace el script

1. Verifica `git status --porcelain` vacío
2. Fetch `GET /config/:slug`
3. Descarga ícono, splash, logo y fuente a una carpeta temporal del sistema
4. Sobrescribe assets locales existentes:
   - `assets/images/icon.png`
   - `assets/images/splash-icon.png`
   - `assets/images/logo.png`
   - `assets/fonts/font.ttf`
5. Actualiza `app.json` (`name`, `slug`, `scheme`, `android.package`, `ios.bundleIdentifier`, ícono iOS, splash plugin) y `brand.config.ts` / `brand-font.ts`
6. `npx expo prebuild --clean --platform <android|ios>`
7. Compila Release e instala:
   - Android: `npx expo run:android --variant release`
   - iOS: `npx expo run:ios --configuration Release --no-bundler`
8. Copia el artefacto a `dist/<slug>-<timestamp>.apk` o `dist/<slug>-<timestamp>.app`
9. Revierte solo los archivos que tocó, borra `android/`/`ios/` y carpetas temporales
10. Verifica que `git status` vuelva a estar limpio

## Salida

- Artefacto persistente en `./dist/` (ignorado por git)
- Resumen en consola con slug, plataforma, ruta del artefacto y confirmación de repo limpio

## Notas

- El APK release esperado queda en `android/app/build/outputs/apk/release/app-release.apk` antes de copiarse a `dist/`.
- El `.app` de iOS es el bundle del Simulator (Release, unsigned). No es un `.ipa` de App Store.
- En iOS el script apunta `ios.icon` al PNG de cliente (`assets/images/icon.png`) para no quedarse con `assets/expo.icon` de MonaBit.
- Si ves campos faltantes en el config (`scheme`, `bundleIdentifier`, `typography.font.url`), el mock server que corre en `:4000` es una versión vieja. Reinicialo desde `mock-config-server/` (`Ctrl+C` y `npm run start`).

```bash
curl -s http://localhost:4000/config/banco-aurelia | jq '{slug, scheme, packageName, bundleIdentifier, typography}'
```

Deep links por cliente usan el `scheme` del config (ej. `banco-aurelia://brand-guide`).
