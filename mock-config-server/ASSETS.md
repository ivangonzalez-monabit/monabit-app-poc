# Inventario de assets por cliente

Tres PNG por marca, **todos en la misma carpeta** (sin subcarpetas).

## Estructura

```
mock-config-server/assets/
└── {slug}/
    ├── icon.png      # Ícono de launcher (build-time)
    ├── splash.png    # Mark centrado del splash (build-time)
    └── logo.png      # Logo in-app (runtime)
```

URLs: `http://localhost:4000/assets/{slug}/icon.png` (etc.)

---

## Mapa: asset → destino

| Archivo | Campo en `/config/:slug` | Destino |
| ------- | ------------------------ | ------- |
| `icon.png` | `icon.url` | `app.json` → `expo.icon` |
| `splash.png` | `splash.image.url` | `expo-splash-screen` → `image` |
| — | `splash.backgroundColor` | `expo-splash-screen` → `backgroundColor` |
| — | `splash.image.width` | `expo-splash-screen` → `imageWidth` |
| `logo.png` | `brand.logo.url` | `brand.config.ts` → `logo` (runtime) |

---

## Especificaciones

| Archivo | Descripción | Spec |
| ------- | ----------- | ---- |
| `icon.png` | Ícono en el launcher | 1024×1024 PNG opaco |
| `splash.png` | Mark centrado al abrir la app | PNG transparente, ~512×512 |
| `logo.png` | Logo dentro de la app | PNG transparente, 256–512 px |

---

## Checklist

### `banco-union`
- [ ] `assets/banco-union/icon.png`
- [ ] `assets/banco-union/splash.png`
- [ ] `assets/banco-union/logo.png`

### `banco-aurelia`
- [ ] `assets/banco-aurelia/icon.png`
- [ ] `assets/banco-aurelia/splash.png`
- [ ] `assets/banco-aurelia/logo.png`
