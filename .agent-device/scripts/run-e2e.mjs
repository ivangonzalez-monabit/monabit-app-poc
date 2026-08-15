#!/usr/bin/env node
/**
 * Runs agent-device .ad flows and writes artifacts under
 * ./agent-device-reports/<YYYY-MM-DDTHH-mm-ss>/.
 *
 * Env:
 *   APP_ID           Bundle id / package (highest priority)
 *   ANDROID_APP_ID   Default Android package
 *   IOS_APP_ID       Default iOS bundle id
 *   AD_PLATFORM      ios | android (default ios; must match context platform= in the .ad files)
 *   AD_DEVICE        Simulator/emulator *name* from `agent-device devices` (e.g. "iPhone 17")
 *   AD_UDID          iOS UDID (`--udid`). If AD_DEVICE looks like a UUID, it is sent as --udid.
 *
 * Flags:
 *   --record         Record each attempt to recording.mp4
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FLOWS_DIR = path.join(ROOT, '.agent-device');
const REPORTS_ROOT = path.join(ROOT, 'agent-device-reports');
const BIN = path.join(ROOT, 'node_modules', '.bin', 'agent-device');

function runFolderName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

const DEFAULT_ANDROID_APP_ID = 'com.ivangonzalezmonabit.monabit';
const DEFAULT_IOS_APP_ID = 'com.ivangonzalez-monabit.monabit';

function resolvePlatform() {
  const platform = (process.env.AD_PLATFORM || 'ios').toLowerCase();
  return platform === 'android' ? 'android' : 'ios';
}

const IOS_UDID_RE =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;

function resolveAppId(platform) {
  if (process.env.APP_ID) {
    return process.env.APP_ID;
  }
  if (platform === 'android') {
    return process.env.ANDROID_APP_ID || DEFAULT_ANDROID_APP_ID;
  }
  return process.env.IOS_APP_ID || DEFAULT_IOS_APP_ID;
}

function main() {
  const record = process.argv.includes('--record');
  const platform = resolvePlatform();
  const appId = resolveAppId(platform);
  const deviceName = process.env.AD_DEVICE;
  const udid = process.env.AD_UDID || (IOS_UDID_RE.test(deviceName || '') ? deviceName : undefined);
  const namedDevice = udid ? undefined : deviceName;

  const reportsDir = path.join(REPORTS_ROOT, runFolderName());
  const junitPath = path.join(reportsDir, 'junit.xml');
  fs.mkdirSync(reportsDir, { recursive: true });

  if (!fs.existsSync(BIN)) {
    console.error('agent-device CLI not found. Run npm install.');
    process.exit(1);
  }

  const args = [
    'test',
    FLOWS_DIR,
    '--platform',
    platform,
    '--artifacts-dir',
    reportsDir,
    '--reporter',
    'default',
    '--reporter',
    `junit:${junitPath}`,
    '-e',
    `APP_ID=${appId}`,
  ];

  if (udid) {
    args.push('--udid', udid);
  } else if (namedDevice) {
    args.push('--device', namedDevice);
  }
  if (record) {
    args.push('--record-video');
  }

  console.log(
    `Running agent-device with APP_ID=${appId} platform=${platform}` +
      `${namedDevice ? ` device=${namedDevice}` : ''}` +
      `${udid ? ` udid=${udid}` : ''}` +
      `${record ? ' (video recording on)' : ''}`,
  );

  const result = spawnSync(BIN, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  console.log(`JUnit report: ${path.relative(ROOT, junitPath)}`);
  console.log(`Artifacts: ${path.relative(ROOT, reportsDir)}`);
  process.exit(result.status === null ? 1 : result.status);
}

main();
