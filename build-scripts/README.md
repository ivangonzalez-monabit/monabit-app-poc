# Build Scripts

Scripts locales para simular el pipeline multimarca (fase 2): fetch de config, personalización, prebuild Android, APK release e instalación en emulador.

## Requisitos

- Node.js 18+
- Git working tree **limpio** (sin cambios sin commitear)
- Backend mock corriendo (`mock-config-server/`)
- Emulador Android **ya abierto**
- Dependencias del repo instaladas (`npm install` en la raíz)

## Uso

1. Levantá el mock server:

```bash
cd mock-config-server
npm run start
```

2. Desde la raíz del repo, con el emulador Android abierto:

```bash
node build-scripts/build-client.js --slug banco-aurelia
```

Otros slugs disponibles: `banco-union`.

### URL del backend

Por defecto usa `http://localhost:4000`. Para cambiarla:

```bash
node build-scripts/build-client.js --slug banco-union --config-url http://10.0.2.2:4000
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
5. Actualiza `app.json` (`name`, `android.package`, splash plugin) y `brand.config.ts` / `brand-font.ts`
6. `npx expo prebuild --clean --platform android`
7. `npx expo run:android --variant release`
8. Copia el APK a `dist/<slug>-<timestamp>.apk`
9. Revierte solo los archivos que tocó, borra `android/`/`ios/` y la carpeta temporal
10. Verifica que `git status` vuelva a estar limpio

## Salida

- APK persistente en `./dist/` (ignorado por git)
- Resumen en consola con slug, ruta del APK y confirmación de repo limpio

## Notas

- Solo Android en esta POC (no iOS).
- Si falla en cualquier paso, intenta limpiar lo modificado antes de salir.
- El APK release esperado queda en `android/app/build/outputs/apk/release/app-release.apk` antes de copiarse a `dist/`.
