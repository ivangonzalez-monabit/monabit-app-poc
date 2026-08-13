# Inventario de assets por cliente

Cuatro archivos por marca, **todos en la misma carpeta**.

## Estructura

```
mock-config-server/assets/
└── {slug}/
    ├── icon.png      # Ícono de launcher (build-time)
    ├── splash.png    # Mark centrado del splash (build-time)
    ├── logo.png      # Logo in-app (runtime)
    └── font.ttf      # Fuente de marca (runtime + build-time)
```

---

## Mapa: asset → destino

| Archivo | Campo en `/config/:slug` | Destino |
| ------- | ------------------------ | ------- |
| `icon.png` | `icon.url` | `app.json` → `expo.icon` |
| `splash.png` | `splash.image.url` | `expo-splash-screen` → `image` |
| `logo.png` | `brand.logo.url` | `brand.config.ts` → `logo` |
| `font.ttf` | `typography.font.url` | `assets/fonts/font.ttf` + `useFonts` |
| — | `typography.fontFamily` | Nombre registrado en `useFonts` (ej. `BrandFont`) |

---

## Checklist

### `banco-union`
- [ ] `assets/banco-union/icon.png`
- [ ] `assets/banco-union/splash.png`
- [ ] `assets/banco-union/logo.png`
- [ ] `assets/banco-union/font.ttf`

### `banco-aurelia`
- [ ] `assets/banco-aurelia/icon.png`
- [ ] `assets/banco-aurelia/splash.png`
- [ ] `assets/banco-aurelia/logo.png`
- [ ] `assets/banco-aurelia/font.ttf`
