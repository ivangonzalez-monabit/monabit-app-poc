import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { assetPathsBySlug } from '../src/clients.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');

/** @param {string} hex */
function hexToRgb(hex) {
  const normalized = hex.replace('#', '');

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    alpha: 1,
  };
}

/** @param {string} outputPath @param {{ r: number, g: number, b: number, alpha: number }} color @param {string} label */
async function writeSquareIcon(outputPath, color, label) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: color,
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <circle cx="128" cy="128" r="88" fill="rgba(255,255,255,0.2)"/>
            <text x="128" y="140" text-anchor="middle" font-size="48" font-family="Arial, sans-serif" fill="#ffffff" font-weight="700">
              ${label}
            </text>
          </svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(outputPath);
}

/** @param {string} outputPath @param {{ r: number, g: number, b: number, alpha: number }} color @param {string} accent */
async function writeSplashMark(outputPath, color, accent) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const accentRgb = hexToRgb(accent);

  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <circle cx="128" cy="128" r="72" fill="rgb(${color.r},${color.g},${color.b})"/>
            <circle cx="128" cy="128" r="40" fill="rgb(${accentRgb.r},${accentRgb.g},${accentRgb.b})"/>
          </svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(outputPath);
}

const clients = [
  {
    slug: 'banco-union',
    primary: '#1495E0',
    accent: '#FFFFFF',
    label: 'U',
  },
  {
    slug: 'banco-aurelia',
    primary: '#0C3D4C',
    accent: '#D4A017',
    label: 'A',
  },
];

for (const client of clients) {
  const paths = assetPathsBySlug[client.slug];
  const clientDir = path.join(assetsDir, client.slug);
  const primary = hexToRgb(client.primary);

  await writeSquareIcon(path.join(clientDir, paths.icon), primary, client.label);
  await writeSplashMark(path.join(clientDir, paths.splash), primary, client.accent);
  await writeSquareIcon(path.join(clientDir, paths.logo), primary, client.label);

  console.log(`Generated placeholder assets for ${client.slug}`);
}
