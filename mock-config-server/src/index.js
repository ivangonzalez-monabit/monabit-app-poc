import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assetPathsBySlug, clientsBySlug } from './clients.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const app = express();

app.use('/assets', express.static(ASSETS_DIR));

/**
 * @param {string} slug
 * @param {string} relativePath
 */
function assetUrl(slug, relativePath) {
  const baseUrl = BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/assets/${slug}/${relativePath}`;
}

/**
 * @param {string} slug
 * @param {import('./clients.js').clientsBySlug[string]} client
 */
function buildClientConfig(slug, client) {
  const paths = assetPathsBySlug[slug];

  return {
    slug: client.slug,
    appName: client.appName,
    packageName: client.packageName,
    icon: {
      url: assetUrl(slug, paths.icon),
    },
    splash: {
      backgroundColor: client.splash.backgroundColor,
      image: {
        url: assetUrl(slug, paths.splash),
        width: client.splash.imageWidth,
      },
    },
    brand: {
      logo: { url: assetUrl(slug, paths.logo) },
    },
    colors: client.colors,
    typography: client.typography,
    featureFlags: client.featureFlags,
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: Object.keys(clientsBySlug) });
});

app.get('/config/:slug', (req, res) => {
  const { slug } = req.params;
  const client = clientsBySlug[slug];

  if (!client) {
    res.status(404).json({
      error: 'Client not found',
      slug,
    });
    return;
  }

  res.json(buildClientConfig(slug, client));
});

app.listen(PORT, HOST, () => {
  console.log(`Mock config server listening on http://${HOST}:${PORT}`);
  console.log(`Example: curl ${BASE_URL}/config/banco-union`);
});
