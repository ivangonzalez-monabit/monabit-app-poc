/** @typedef {import('./types.js').ClientConfigSeed} ClientConfigSeed */

/** @type {Record<string, ClientConfigSeed>} */
export const clientsBySlug = {
  'banco-union': {
    slug: 'banco-union',
    appName: 'Banco Unión',
    packageName: 'com.bancounion.app',
    splash: {
      backgroundColor: '#1495E0',
      imageWidth: 80,
    },
    colors: {
      primary: '#1495E0',
      secondary: '#FFFFFF',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    typography: {
      fontFamily: 'BrandFont',
    },
    featureFlags: {
      documentCapture: true,
    },
  },
  'banco-aurelia': {
    slug: 'banco-aurelia',
    appName: 'Banco Aurelia',
    packageName: 'com.bancoaurelia.app',
    splash: {
      backgroundColor: '#0C3D4C',
      imageWidth: 76,
    },
    colors: {
      primary: '#0C3D4C',
      secondary: '#D4A017',
      background: '#F5F9FA',
      text: '#0A1F26',
    },
    typography: {
      fontFamily: 'BrandFont',
    },
    featureFlags: {
      documentCapture: false,
    },
  },
};

const defaultAssetPaths = {
  icon: 'icon.png',
  splash: 'splash.png',
  logo: 'logo.png',
  font: 'font.ttf',
};

/** @type {Record<string, typeof defaultAssetPaths>} */
export const assetPathsBySlug = Object.fromEntries(
  Object.keys(clientsBySlug).map((slug) => [slug, defaultAssetPaths]),
);
