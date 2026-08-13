# Mock Config Server

Backend mock de configuración por cliente. Expone build config — nombre, package, ícono, splash, logo, colores, tipografía y feature flags.

Independiente de la app Expo (`src/`).

## Instalación

```bash
cd mock-config-server
npm install
npm run generate-assets   # placeholders (3 PNG por cliente)
npm run start             # 0.0.0.0:4000
```

## Endpoint

```
GET /config/:slug
```

| Slug            | App           | Package                |
| --------------- | ------------- | ---------------------- |
| `banco-union`   | Banco Unión   | `com.bancounion.app`   |
| `banco-aurelia` | Banco Aurelia | `com.bancoaurelia.app` |

```bash
curl -s http://localhost:4000/config/banco-aurelia | jq
```

### Respuesta (ejemplo)

```json
{
  "slug": "banco-aurelia",
  "appName": "Banco Aurelia",
  "packageName": "com.bancoaurelia.app",
  "icon": { "url": "http://localhost:4000/assets/banco-aurelia/icon.png" },
  "splash": {
    "backgroundColor": "#0C3D4C",
    "image": { "url": ".../splash.png", "width": 76 }
  },
  "brand": { "logo": { "url": ".../logo.png" } },
  "colors": { "primary": "#0C3D4C", "secondary": "#D4A017", "background": "#F5F9FA", "text": "#0A1F26" },
  "typography": { "fontFamily": "Roboto" },
  "featureFlags": { "documentCapture": false }
}
```

404: `{ "error": "Client not found", "slug": "..." }`

### Assets por cliente

```
assets/{slug}/icon.png
assets/{slug}/splash.png
assets/{slug}/logo.png
```

Detalle en [ASSETS.md](./ASSETS.md).

## Variables de entorno

| Variable   | Default                 |
| ---------- | ----------------------- |
| `PORT`     | `4000`                  |
| `HOST`     | `0.0.0.0`               |
| `BASE_URL` | `http://localhost:4000` |

## Android (fase 2)

Desde emulador Android, usa `10.0.2.2` en lugar de `localhost`:
`http://10.0.2.2:4000/config/banco-aurelia`
