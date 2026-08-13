import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // Official FSD convention for file-based routers (Expo Router, Next.js App Router).
      'fsd/typo-in-layer-name': 'off',
      // Scaffold slices — not yet implemented.
      'fsd/insignificant-slice': 'off',
      'fsd/no-segmentless-slices': 'off',
    },
  },
  {
    files: ['./src/_app/**'],
    rules: {
      // _app folder name is required for Expo Router; filesystem treats it as sliced.
      'fsd/no-segments-on-sliced-layers': 'off',
      'fsd/no-segmentless-slices': 'off',
    },
  },
  {
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
]);
