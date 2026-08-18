#!/usr/bin/env node
/**
 * Runs Argent YAML flows and writes artifacts under
 * ./e2e-reports/argent/<YYYY-MM-DDTHH-mm-ss>/.
 *
 * Env:
 *   APP_ID             Bundle id / package (highest priority; applied to both platforms)
 *   ANDROID_APP_ID     Default Android package
 *   IOS_APP_ID         Default iOS bundle id
 *   ARGENT_PLATFORM    ios | android (default ios)
 *   ARGENT_DEVICE      Simulator/emulator name or UDID/serial from `argent run list-devices`
 *   ARGENT_UDID        Explicit device id (`--device`)
 *
 * Flags:
 *   --record           Screen-record each flow (needs ffmpeg)
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FLOWS_DIR = path.join(ROOT, '.argent', 'flows');
const REPORTS_ROOT = path.join(ROOT, 'e2e-reports', 'argent');
const BIN = path.join(ROOT, 'node_modules', '.bin', 'argent');

const DEFAULT_ANDROID_APP_ID = 'com.ivangonzalezmonabit.monabit';
const DEFAULT_IOS_APP_ID = 'com.ivangonzalez-monabit.monabit';
const IOS_UDID_RE =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;

function runFolderName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

function resolvePlatform() {
  const platform = (process.env.ARGENT_PLATFORM || 'ios').toLowerCase();
  return platform === 'android' ? 'android' : 'ios';
}

function resolveAppIds() {
  if (process.env.APP_ID) {
    return { ios: process.env.APP_ID, android: process.env.APP_ID };
  }
  return {
    ios: process.env.IOS_APP_ID || DEFAULT_IOS_APP_ID,
    android: process.env.ANDROID_APP_ID || DEFAULT_ANDROID_APP_ID,
  };
}

function listFlowFiles() {
  return fs
    .readdirSync(FLOWS_DIR)
    .filter((name) => name.endsWith('.yaml'))
    .sort()
    .map((name) => path.join(FLOWS_DIR, name));
}

function substituteAppIds(yaml, appIds) {
  return yaml
    .replace(/ios:\s*com\.ivangonzalez-monabit\.monabit/g, `ios: ${appIds.ios}`)
    .replace(/android:\s*com\.ivangonzalezmonabit\.monabit/g, `android: ${appIds.android}`);
}

function argent(args, options = {}) {
  return spawnSync(BIN, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    ...options,
  });
}

function parseJsonOutput(stdout) {
  const text = (stdout || '').trim();
  if (!text) {
    return null;
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function deviceId(entry) {
  return entry.udid || entry.serial || entry.id || '';
}

function resolveDeviceId(platform, requested) {
  if (!requested) {
    return undefined;
  }
  if (platform === 'ios' && IOS_UDID_RE.test(requested)) {
    return requested;
  }
  if (platform === 'android' && requested.startsWith('emulator-')) {
    return requested;
  }

  const listed = argent(['run', 'list-devices', '--json'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const payload = parseJsonOutput(listed.stdout);
  const devices = payload?.devices || [];
  const matches = devices.filter((device) => {
    if ((device.platform || '').toLowerCase() !== platform) {
      return false;
    }
    const id = deviceId(device);
    const name = String(device.name || device.avdName || '');
    return id === requested || name === requested;
  });
  const booted = matches.find((device) => {
    const state = String(device.state || device.status || '').toLowerCase();
    return state.includes('boot') || state === 'online' || device.booted === true;
  });
  const chosen = booted || matches[0];
  return chosen ? deviceId(chosen) : requested;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function writeJunit(filePath, suiteName, results) {
  const failed = results.filter((result) => !result.ok).length;
  const cases = results
    .map((result) => {
      const name = xmlEscape(result.name);
      const time = ((result.durationMs || 0) / 1000).toFixed(3);
      if (result.ok) {
        return `    <testcase name="${name}" time="${time}"/>`;
      }
      const message = xmlEscape(result.error || 'flow failed');
      return `    <testcase name="${name}" time="${time}">\n      <failure message="${message}"/>\n    </testcase>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="${xmlEscape(suiteName)}" tests="${results.length}" failures="${failed}">
${cases}
</testsuite>
`;
  fs.writeFileSync(filePath, xml);
}

function copyIfExists(source, dest) {
  if (!source || !fs.existsSync(source)) {
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  return true;
}

function collectImagePaths(value, acc = []) {
  if (!value) {
    return acc;
  }
  if (typeof value === 'string' && /\.(png|jpe?g|webp)$/i.test(value) && fs.existsSync(value)) {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectImagePaths(item, acc);
    }
    return acc;
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'hostPath' && typeof nested === 'string' && fs.existsSync(nested)) {
        acc.push(nested);
      } else {
        collectImagePaths(nested, acc);
      }
    }
  }
  return acc;
}

function firstFailedStep(report) {
  const steps = report?.steps || [];
  return steps.find((step) => step.status === 'fail' || step.status === 'error');
}

function main() {
  const record = process.argv.includes('--record');
  const platform = resolvePlatform();
  const appIds = resolveAppIds();
  const requestedDevice = process.env.ARGENT_UDID || process.env.ARGENT_DEVICE;
  const device = resolveDeviceId(platform, requestedDevice);
  const reportsDir = path.join(REPORTS_ROOT, runFolderName());
  const junitPath = path.join(reportsDir, 'junit.xml');
  const summaryPath = path.join(reportsDir, 'summary.json');
  fs.mkdirSync(reportsDir, { recursive: true });

  if (!fs.existsSync(BIN)) {
    console.error('Argent CLI not found. Run npm install.');
    process.exit(1);
  }

  const flowFiles = listFlowFiles();
  if (flowFiles.length === 0) {
    console.error(`No YAML flows in ${path.relative(ROOT, FLOWS_DIR)}`);
    process.exit(1);
  }

  console.log(
    `Running Argent with ios=${appIds.ios} android=${appIds.android} platform=${platform}` +
      `${device ? ` device=${device}` : ''}` +
      `${record ? ' (video recording on)' : ''}`,
  );

  const results = [];

  for (const flowFile of flowFiles) {
    const flowName = path.basename(flowFile, '.yaml');
    const flowDir = path.join(reportsDir, flowName);
    fs.mkdirSync(flowDir, { recursive: true });
    const preparedFlow = path.join(flowDir, `${flowName}.yaml`);
    fs.writeFileSync(preparedFlow, substituteAppIds(fs.readFileSync(flowFile, 'utf8'), appIds));

    if (record) {
      if (!device) {
        console.error('Recording needs ARGENT_DEVICE or ARGENT_UDID so Argent can target the simulator.');
        process.exit(1);
      }
      const start = argent(
        ['run', 'screen-recording-start', '--udid', device, '--timeLimitSeconds', '180', '--json'],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );
      if (start.status !== 0) {
        console.error(start.stderr || start.stdout || 'screen-recording-start failed');
        process.exit(start.status === null ? 1 : start.status);
      }
    }

    const args = ['flow', 'run', preparedFlow, '--platform', platform, '--json', '--output', flowDir];
    if (device) {
      args.push('--device', device);
    }

    const started = Date.now();
    const run = argent(args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const durationMs = Date.now() - started;
    const report = parseJsonOutput(run.stdout) || parseJsonOutput(run.stderr);
    fs.writeFileSync(path.join(flowDir, 'report.json'), `${JSON.stringify(report ?? { stdout: run.stdout, stderr: run.stderr }, null, 2)}\n`);
    if (run.stdout) {
      process.stderr.write(run.stdout);
    }
    if (run.stderr) {
      process.stderr.write(run.stderr);
    }

    if (record && device) {
      const stop = argent(['run', 'screen-recording-stop', '--udid', device, '--json'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const stopPayload = parseJsonOutput(stop.stdout);
      const videoPath = stopPayload?.video?.hostPath || stopPayload?.video?.path;
      copyIfExists(videoPath, path.join(flowDir, 'recording.mp4'));
      if (stop.status !== 0) {
        console.error(stop.stderr || 'screen-recording-stop failed');
      }
    }

    const images = collectImagePaths(report);
    images.forEach((imagePath, index) => {
      copyIfExists(imagePath, path.join(flowDir, `screenshot-${index + 1}${path.extname(imagePath)}`));
    });

    const failedStep = firstFailedStep(report);
    const ok = Boolean(report?.ok) && run.status === 0;
    const error = ok
      ? undefined
      : failedStep?.reason || failedStep?.message || report?.error || run.stderr?.trim() || 'flow failed';
    results.push({ name: flowName, ok, durationMs, error, report });
    console.log(`${ok ? '✓' : '⨯'} ${flowName} ${(durationMs / 1000).toFixed(2)}s${error ? `\n    ${error}` : ''}`);
  }

  writeJunit(junitPath, 'argent-e2e', results);
  fs.writeFileSync(
    summaryPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        platform,
        device: device || null,
        appIds,
        status: results.every((result) => result.ok) ? 'PASSED' : 'FAILED',
        flows: results.map(({ name, ok, durationMs, error }) => ({ name, ok, durationMs, error })),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`JUnit report: ${path.relative(ROOT, junitPath)}`);
  console.log(`Summary: ${path.relative(ROOT, summaryPath)}`);
  console.log(`Artifacts: ${path.relative(ROOT, reportsDir)}`);
  process.exit(results.every((result) => result.ok) ? 0 : 1);
}

main();
