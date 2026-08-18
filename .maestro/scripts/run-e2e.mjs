#!/usr/bin/env node
/**
 * Runs Maestro E2E flows and writes CI-ready artifacts under ./e2e-reports/maestro.
 *
 * Env:
 *   APP_ID           Override bundle id / application id (highest priority)
 *   ANDROID_APP_ID   Default Android package (com.ivangonzalezmonabit.monabit)
 *   IOS_APP_ID       Default iOS bundle id (com.ivangonzalez-monabit.monabit)
 *   MAESTRO_PLATFORM ios | android — selects platform and App ID default
 *   MAESTRO_UDID     Booted simulator/emulator UDID (xcrun simctl list devices booted)
 *   MAESTRO_DEVICE   Same as --device: UDID of a *connected* device, not a list-devices model slug
 *
 * Flags:
 *   --record         Start in-flow screen recording (RECORD_VIDEO=true)
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FLOWS_DIR = path.join(ROOT, '.maestro');
const REPORTS_DIR = path.join(ROOT, 'e2e-reports', 'maestro');
const VIDEOS_DIR = path.join(REPORTS_DIR, 'videos');
const DEBUG_DIR = path.join(REPORTS_DIR, 'debug');
const JUNIT_PATH = path.join(REPORTS_DIR, 'junit.xml');
const SUMMARY_PATH = path.join(REPORTS_DIR, 'latest-summary.json');

const DEFAULT_ANDROID_APP_ID = 'com.ivangonzalezmonabit.monabit';
const DEFAULT_IOS_APP_ID = 'com.ivangonzalez-monabit.monabit';

function resolveAppId() {
  if (process.env.APP_ID) {
    return process.env.APP_ID;
  }

  const platform = (process.env.MAESTRO_PLATFORM || '').toLowerCase();
  if (platform === 'ios') {
    return process.env.IOS_APP_ID || DEFAULT_IOS_APP_ID;
  }

  return process.env.ANDROID_APP_ID || DEFAULT_ANDROID_APP_ID;
}

function maestroAvailable() {
  const result = spawnSync('maestro', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

function walkFiles(dir, matcher, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, acc);
    } else if (matcher(entry.name, fullPath)) {
      acc.push(fullPath);
    }
  }

  return acc;
}

function collectSummary() {
  const commandFiles = walkFiles(
    REPORTS_DIR,
    (name, fullPath) =>
      name === 'commands.json' && !fullPath.includes(`${path.sep}debug${path.sep}`),
  );

  const flows = commandFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    let commands = [];
    try {
      commands = JSON.parse(raw);
    } catch {
      commands = [];
    }

    const failed = commands.find((step) => {
      const status = String(step.status || step.result || '').toUpperCase();
      return status === 'FAILED' || status === 'ERROR' || Boolean(step.error);
    });

    const durationMs = commands.reduce((sum, step) => sum + (Number(step.duration) || 0), 0);
    const flowDir = path.dirname(filePath);
    const relativeFlowDir = path.relative(REPORTS_DIR, flowDir);

    return {
      flow: path.basename(flowDir),
      artifactDir: relativeFlowDir,
      status: failed ? 'FAILED' : 'PASSED',
      durationMs,
      failedStep: failed
        ? {
            sequenceNumber: failed.sequenceNumber ?? null,
            command: failed.command ?? failed.type ?? null,
            label: failed.label ?? failed.command?.label ?? null,
            status: failed.status ?? 'FAILED',
            duration: failed.duration ?? null,
            error: failed.error ?? failed.message ?? null,
          }
        : null,
      steps: commands.map((step, index) => ({
        sequenceNumber: step.sequenceNumber ?? index + 1,
        command: step.command ?? step.type ?? null,
        label: step.label ?? null,
        status: step.status ?? null,
        duration: step.duration ?? null,
        error: step.error ?? null,
      })),
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    status: flows.some((flow) => flow.status === 'FAILED') ? 'FAILED' : 'PASSED',
    junitReport: path.relative(ROOT, JUNIT_PATH),
    testOutputDir: path.relative(ROOT, REPORTS_DIR),
    flows,
  };

  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

function copyVideos() {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  const videos = walkFiles(REPORTS_DIR, (name, fullPath) => {
    if (!name.endsWith('.mp4')) {
      return false;
    }
    return !fullPath.startsWith(`${VIDEOS_DIR}${path.sep}`) && fullPath !== VIDEOS_DIR;
  });

  for (const videoPath of videos) {
    const relativeName = path.relative(REPORTS_DIR, videoPath).split(path.sep).join('__');
    fs.copyFileSync(videoPath, path.join(VIDEOS_DIR, relativeName));
  }

  return videos.length;
}

function main() {
  if (process.argv.includes('--collect-videos')) {
    const copiedVideos = copyVideos();
    console.log(`Copied ${copiedVideos} video(s) to ${path.relative(ROOT, VIDEOS_DIR)}`);
    process.exit(0);
  }

  const record = process.argv.includes('--record');
  const appId = resolveAppId();

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  fs.mkdirSync(DEBUG_DIR, { recursive: true });

  if (!maestroAvailable()) {
    console.error(
      [
        'Maestro CLI was not found in PATH.',
        'Install it with: curl -fsSL "https://get.maestro.mobile.dev" | bash',
        'Docs: https://docs.maestro.dev/getting-started/installing-maestro',
      ].join('\n'),
    );
    process.exit(1);
  }

  const platform = (process.env.MAESTRO_PLATFORM || '').toLowerCase();
  const device = process.env.MAESTRO_DEVICE;
  const udid = process.env.MAESTRO_UDID;
  const maestroArgs = [];

  if (platform === 'ios' || platform === 'android') {
    maestroArgs.push('--platform', platform);
  }
  if (udid) {
    maestroArgs.push('--udid', udid);
  } else if (device) {
    maestroArgs.push('--device', device);
  }

  const args = [
    ...maestroArgs,
    'test',
    FLOWS_DIR,
    '--config',
    path.join(FLOWS_DIR, 'config.yaml'),
    '--format',
    'junit',
    '--output',
    JUNIT_PATH,
    '--test-output-dir',
    REPORTS_DIR,
    '--debug-output',
    DEBUG_DIR,
    '--test-suite-name',
    'monabit-maestro-e2e',
    '-e',
    `APP_ID=${appId}`,
    '-e',
    `RECORD_VIDEO=${record ? 'true' : 'false'}`,
  ];

  const target = [
    platform && `platform=${platform}`,
    udid && `udid=${udid}`,
    !udid && device && `device=${device}`,
  ]
    .filter(Boolean)
    .join(' ');

  console.log(
    `Running Maestro with APP_ID=${appId}${target ? ` ${target}` : ''}${record ? ' (video recording on)' : ''}`,
  );

  const result = spawnSync('maestro', args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  const summary = collectSummary();
  const copiedVideos = copyVideos();

  console.log(`Wrote JUnit report: ${path.relative(ROOT, JUNIT_PATH)}`);
  console.log(`Wrote step summary: ${path.relative(ROOT, SUMMARY_PATH)}`);
  if (record || copiedVideos > 0) {
    console.log(`Copied ${copiedVideos} video(s) to ${path.relative(ROOT, VIDEOS_DIR)}`);
  }

  if (summary.status === 'FAILED') {
    for (const flow of summary.flows.filter((item) => item.status === 'FAILED')) {
      const step = flow.failedStep;
      console.error(
        `FAILED ${flow.flow}` +
          (step
            ? ` at step ${step.sequenceNumber} (${JSON.stringify(step.command)}): ${step.error}`
            : ''),
      );
    }
  }

  process.exit(result.status === null ? 1 : result.status);
}

main();
