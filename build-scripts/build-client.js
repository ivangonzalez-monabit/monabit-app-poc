#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_CONFIG_BASE_URL = 'http://localhost:4000';
const APK_SOURCE = path.join(REPO_ROOT, 'android/app/build/outputs/apk/release/app-release.apk');

const TARGET_PATHS = {
  appJson: 'app.json',
  brandConfig: 'src/_app/config/brand.config.ts',
  brandFont: 'src/_app/config/brand-font.ts',
  icon: 'assets/images/icon.png',
  splash: 'assets/images/splash-icon.png',
  logo: 'assets/images/logo.png',
  font: 'assets/fonts/font.ttf',
};

/** @type {{ slug?: string, configBaseUrl: string, tmpDir?: string, touchedPaths: string[], createdPaths: string[] }} */
const state = {
  configBaseUrl: DEFAULT_CONFIG_BASE_URL,
  touchedPaths: [],
  createdPaths: [],
};

function log(message) {
  console.log(message);
}

function fail(message, code = 1) {
  console.error(`\nError: ${message}`);
  process.exitCode = code;
}

function run(command, args, { allowFailure = false } = {}) {
  log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.status !== 0 && !allowFailure) {
    throw new Error(`Command failed with exit code ${result.status}: ${command} ${args.join(' ')}`);
  }

  return result;
}

function runGit(args, { allowFailure = false } = {}) {
  return run('git', args, { allowFailure });
}

function assertCleanGit(stepLabel) {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error('Unable to read git status.');
  }

  const output = result.stdout.trim();
  if (output) {
    throw new Error(
      `${stepLabel}: git working tree is not clean.\nCommit or stash your changes before running this script:\n${output}`,
    );
  }
}

function parseArgs(argv) {
  let slug;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--slug') {
      slug = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length);
      continue;
    }

    if (arg === '--config-url') {
      state.configBaseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--config-url=')) {
      state.configBaseUrl = arg.slice('--config-url='.length);
    }
  }

  if (!slug) {
    throw new Error('Missing required argument: --slug <client-slug>');
  }

  state.slug = slug;
}

function trackWrite(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);

  if (!fs.existsSync(absolutePath)) {
    state.createdPaths.push(relativePath);
  }

  if (!state.touchedPaths.includes(relativePath)) {
    state.touchedPaths.push(relativePath);
  }
}

async function fetchConfig(slug) {
  const baseUrl = state.configBaseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/config/${slug}`;
  log(`Fetching config from ${url}`);

  const response = await fetch(url);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Config fetch failed (${response.status}): ${body}`);
  }

  return JSON.parse(body);
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Asset download failed (${response.status}): ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, buffer);
}

async function downloadAssets(config) {
  state.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'monabit-build-'));
  log(`Downloading assets to ${state.tmpDir}`);

  const downloads = [
    { url: config.icon.url, filename: 'icon.png' },
    { url: config.splash.image.url, filename: 'splash.png' },
    { url: config.brand.logo.url, filename: 'logo.png' },
    { url: config.typography.font.url, filename: 'font.ttf' },
  ];

  /** @type {Record<string, string>} */
  const files = {};

  for (const item of downloads) {
    const destinationPath = path.join(state.tmpDir, item.filename);
    await downloadFile(item.url, destinationPath);
    files[item.filename] = destinationPath;
  }

  return files;
}

function copyDownloadedAsset(sourcePath, relativeTargetPath) {
  const targetPath = path.join(REPO_ROOT, relativeTargetPath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  trackWrite(relativeTargetPath);
}

function applyAppJson(config) {
  const relativePath = TARGET_PATHS.appJson;
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const appJson = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  appJson.expo.name = config.appName;
  appJson.expo.android.package = config.packageName;

  const splashPlugin = appJson.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );

  if (splashPlugin) {
    splashPlugin[1].backgroundColor = config.splash.backgroundColor;
    splashPlugin[1].imageWidth = config.splash.image.width;
  }

  fs.writeFileSync(absolutePath, `${JSON.stringify(appJson, null, 2)}\n`);
  trackWrite(relativePath);
}

function applyBrandFont(config) {
  const relativePath = TARGET_PATHS.brandFont;
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const contents = `export const brandFontFamily = '${config.typography.fontFamily}';

export const brandFontSources = {
  [brandFontFamily]: require('../../../assets/fonts/font.ttf'),
};
`;

  fs.writeFileSync(absolutePath, contents);
  trackWrite(relativePath);
}

function applyBrandConfig(config) {
  const relativePath = TARGET_PATHS.brandConfig;
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const contents = `import { type ImageSourcePropType } from 'react-native';

import { brandFontFamily } from '@/_app/config/brand-font';

export type BrandConfig = {
  name: string;
  logo: ImageSourcePropType;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
  };
  featureFlags: {
    documentCapture: boolean;
  };
};

export const brandConfig: BrandConfig = {
  name: ${JSON.stringify(config.appName)},
  logo: require('../../../assets/images/logo.png'),
  colors: {
    primary: ${JSON.stringify(config.colors.primary)},
    secondary: ${JSON.stringify(config.colors.secondary)},
    background: ${JSON.stringify(config.colors.background)},
    text: ${JSON.stringify(config.colors.text)},
  },
  typography: {
    fontFamily: brandFontFamily,
  },
  featureFlags: {
    documentCapture: ${config.featureFlags.documentCapture},
  },
};
`;

  fs.writeFileSync(absolutePath, contents);
  trackWrite(relativePath);
}

function applyRepoChanges(config, downloadedFiles) {
  copyDownloadedAsset(downloadedFiles['icon.png'], TARGET_PATHS.icon);
  copyDownloadedAsset(downloadedFiles['splash.png'], TARGET_PATHS.splash);
  copyDownloadedAsset(downloadedFiles['logo.png'], TARGET_PATHS.logo);
  copyDownloadedAsset(downloadedFiles['font.ttf'], TARGET_PATHS.font);

  applyAppJson(config);
  applyBrandFont(config);
  applyBrandConfig(config);
}

function runPrebuild() {
  run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android']);
}

function runReleaseBuild() {
  run('npx', ['expo', 'run:android', '--variant', 'release']);
}

function copyReleaseApk(slug) {
  if (!fs.existsSync(APK_SOURCE)) {
    throw new Error(`Release APK not found at ${APK_SOURCE}`);
  }

  const distDir = path.join(REPO_ROOT, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destinationPath = path.join(distDir, `${slug}-${timestamp}.apk`);
  fs.copyFileSync(APK_SOURCE, destinationPath);

  return destinationPath;
}

function isTrackedByGit(relativePath) {
  const result = spawnSync('git', ['ls-files', '--error-unmatch', relativePath], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
  });

  return result.status === 0;
}

function cleanup() {
  log('\nCleaning up repository changes...');

  const trackedTouchedPaths = state.touchedPaths.filter(isTrackedByGit);
  if (trackedTouchedPaths.length > 0) {
    runGit(['checkout', '--', ...trackedTouchedPaths]);
  }

  for (const relativePath of state.createdPaths) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.rmSync(absolutePath, { force: true });
    }
  }

  for (const relativePath of ['android', 'ios']) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.rmSync(absolutePath, { recursive: true, force: true });
    }
  }

  if (state.tmpDir && fs.existsSync(state.tmpDir)) {
    fs.rmSync(state.tmpDir, { recursive: true, force: true });
  }
}

function printFinalStatus(slug, apkPath) {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error('Unable to verify final git status.');
  }

  const dirtyOutput = result.stdout.trim();

  log('\nBuild summary');
  log(`- Client: ${slug}`);
  log(`- APK: ${apkPath}`);

  if (dirtyOutput) {
    fail(
      `Cleanup incomplete. Git working tree is still dirty:\n${dirtyOutput}`,
      1,
    );
    return;
  }

  log('- Repository: clean (git status --porcelain is empty)');
}

async function main() {
  parseArgs(process.argv.slice(2));
  const slug = state.slug;

  assertCleanGit('Pre-flight check');
  log(`Starting local build for "${slug}"`);

  let apkPath;

  try {
    const config = await fetchConfig(slug);
    const downloadedFiles = await downloadAssets(config);
    applyRepoChanges(config, downloadedFiles);
    runPrebuild();
    runReleaseBuild();
    apkPath = copyReleaseApk(slug);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error), 1);

    try {
      cleanup();
    } catch (cleanupError) {
      console.error(
        cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      );
    }

    return;
  }

  try {
    cleanup();
    printFinalStatus(slug, apkPath);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error), 1);
  }
}

main();
