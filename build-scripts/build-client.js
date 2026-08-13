#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_CONFIG_BASE_URL = 'http://localhost:4000';
const SUPPORTED_PLATFORMS = ['android', 'ios'];
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

/** @type {{ slug?: string, platform: 'android' | 'ios', configBaseUrl: string, tmpDir?: string, iosOutputDir?: string, touchedPaths: string[], createdPaths: string[] }} */
const state = {
  platform: 'android',
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
      continue;
    }

    if (arg === '--platform') {
      state.platform = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--platform=')) {
      state.platform = arg.slice('--platform='.length);
    }
  }

  if (!slug) {
    throw new Error('Missing required argument: --slug <client-slug>');
  }

  if (!SUPPORTED_PLATFORMS.includes(state.platform)) {
    throw new Error(
      `Invalid --platform "${state.platform}". Use one of: ${SUPPORTED_PLATFORMS.join(', ')}`,
    );
  }

  if (state.platform === 'ios' && process.platform !== 'darwin') {
    throw new Error('iOS builds require macOS with Xcode and a booted Simulator.');
  }

  state.slug = slug;
}

function trackWrite(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);

  if (!fs.existsSync(absolutePath) && !state.createdPaths.includes(relativePath)) {
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

  const config = JSON.parse(body);
  validateConfig(config);
  return config;
}

function validateConfig(config) {
  /** @type {string[]} */
  const missing = [];

  if (!config?.icon?.url) missing.push('icon.url');
  if (!config?.splash?.image?.url) missing.push('splash.image.url');
  if (!config?.brand?.logo?.url) missing.push('brand.logo.url');
  if (!config?.typography?.font?.url) missing.push('typography.font.url');
  if (!config?.slug) missing.push('slug');
  if (!config?.scheme) missing.push('scheme');
  if (!config?.appName) missing.push('appName');
  if (!config?.packageName) missing.push('packageName');
  if (!config?.bundleIdentifier) missing.push('bundleIdentifier');
  if (!config?.typography?.fontFamily) missing.push('typography.fontFamily');
  if (!config?.featureFlags) missing.push('featureFlags');

  if (missing.length > 0) {
    throw new Error(
      `Invalid config response: missing ${missing.join(', ')}. ` +
        'Restart mock-config-server so it returns the current contract (including typography.font.url).',
    );
  }
}

function getAssetDownloads(config) {
  return [
    { url: config.icon.url, filename: 'icon.png' },
    { url: config.splash.image.url, filename: 'splash.png' },
    { url: config.brand.logo.url, filename: 'logo.png' },
    { url: config.typography.font.url, filename: 'font.ttf' },
  ];
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

  const downloads = getAssetDownloads(config);

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
  trackWrite(relativeTargetPath);
  const targetPath = path.join(REPO_ROOT, relativeTargetPath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function applyAppJson(config) {
  const relativePath = TARGET_PATHS.appJson;
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const appJson = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  appJson.expo.name = config.appName;
  appJson.expo.slug = config.slug;
  appJson.expo.scheme = config.scheme;
  appJson.expo.android.package = config.packageName;
  appJson.expo.ios.bundleIdentifier = config.bundleIdentifier;
  appJson.expo.ios.icon = './assets/images/icon.png';

  const splashPlugin = appJson.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );

  if (splashPlugin) {
    splashPlugin[1].backgroundColor = config.splash.backgroundColor;
    splashPlugin[1].imageWidth = config.splash.image.width;
  }

  trackWrite(relativePath);
  fs.writeFileSync(absolutePath, `${JSON.stringify(appJson, null, 2)}\n`);
}

function applyBrandFont(config) {
  const relativePath = TARGET_PATHS.brandFont;
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const contents = `export const brandFontFamily = '${config.typography.fontFamily}';

export const brandFontSources = {
  [brandFontFamily]: require('../../../assets/fonts/font.ttf'),
};
`;

  trackWrite(relativePath);
  fs.writeFileSync(absolutePath, contents);
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

  trackWrite(relativePath);
  fs.writeFileSync(absolutePath, contents);
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
  run('npx', ['expo', 'prebuild', '--clean', '--platform', state.platform]);
}

function runReleaseBuild() {
  if (state.platform === 'ios') {
    state.iosOutputDir = path.join(REPO_ROOT, 'dist', '.ios-output');
    fs.rmSync(state.iosOutputDir, { recursive: true, force: true });
    fs.mkdirSync(state.iosOutputDir, { recursive: true });
    run('npx', [
      'expo',
      'run:ios',
      '--configuration',
      'Release',
      '--no-bundler',
      '--output',
      state.iosOutputDir,
    ]);
    return;
  }

  run('npx', ['expo', 'run:android', '--variant', 'release']);
}

function findIosAppBundle(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return null;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory() && entry.name.endsWith('.app')) {
      return entryPath;
    }

    if (entry.isDirectory()) {
      const nestedApp = findIosAppBundle(entryPath);
      if (nestedApp) {
        return nestedApp;
      }
    }
  }

  return null;
}

function copyReleaseArtifact(slug) {
  const distDir = path.join(REPO_ROOT, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (state.platform === 'ios') {
    const appSource = findIosAppBundle(state.iosOutputDir);
    if (!appSource) {
      throw new Error(`Release .app not found in ${state.iosOutputDir}`);
    }

    const destinationPath = path.join(distDir, `${slug}-${timestamp}.app`);
    fs.cpSync(appSource, destinationPath, { recursive: true });
    return destinationPath;
  }

  if (!fs.existsSync(APK_SOURCE)) {
    throw new Error(`Release APK not found at ${APK_SOURCE}`);
  }

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

  const untrackedPaths = [
    ...new Set([...state.createdPaths, ...state.touchedPaths.filter((relativePath) => !isTrackedByGit(relativePath))]),
  ];

  for (const relativePath of untrackedPaths) {
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

  if (state.iosOutputDir && fs.existsSync(state.iosOutputDir)) {
    fs.rmSync(state.iosOutputDir, { recursive: true, force: true });
  }
}

function printFinalStatus(slug, artifactPath) {
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
  log(`- Platform: ${state.platform}`);
  log(`- Artifact: ${artifactPath}`);

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
  log(`Starting local ${state.platform} build for "${slug}"`);

  let artifactPath;

  try {
    const config = await fetchConfig(slug);
    const downloadedFiles = await downloadAssets(config);
    applyRepoChanges(config, downloadedFiles);
    runPrebuild();
    runReleaseBuild();
    artifactPath = copyReleaseArtifact(slug);
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
    printFinalStatus(slug, artifactPath);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error), 1);
  }
}

main();
