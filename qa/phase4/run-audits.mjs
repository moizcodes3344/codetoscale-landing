// Local Lighthouse measurement harness. No dependencies installed or site edits.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = 'C:/Users/user/AppData/Local/npm-cache/_npx/ba16b138af87a83e/node_modules/lighthouse/cli/index.js';
const base = process.env.PREVIEW_URL;
if (!base || new URL(base).hostname !== '127.0.0.1') throw new Error('Set PREVIEW_URL to the actual loopback preview URL.');
const batch = process.argv[2] || 'baseline';
if (!/^[a-z0-9-]+$/.test(batch)) throw new Error('Invalid evidence batch name');
const rounds = Number(process.argv[3] || 5);
if (!Number.isInteger(rounds) || rounds < 1 || rounds > 5) throw new Error('Use 1–5 rounds.');
const cases = [
  ['home', '/'], ['shopify', '/services/shopify-development.html'],
  ['seo', '/services/seo-content-marketing.html'],
];
const records = [];
await mkdir(new URL(batch + '/', import.meta.url), { recursive: true });
function command(executable, args) {
  return new Promise(resolve => {
    const child = spawn(executable, args, { cwd: root, windowsHide: true, env: process.env });
    let stdout = '', stderr = '';
    child.stdout.on('data', b => { stdout += b; });
    child.stderr.on('data', b => { stderr += b; });
    child.once('error', error => resolve({ exit: null, stderr: String(error), stdout }));
    child.once('close', exit => resolve({ exit, stdout, stderr }));
  });
}
async function cpu() {
  const r = await command('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-CimInstance Win32_Processor | Select-Object Name,LoadPercentage,CurrentClockSpeed,MaxClockSpeed | ConvertTo-Json -Compress']);
  try { return JSON.parse(r.stdout); } catch { return { error: r.stderr }; }
}
for (let round = 1; round <= rounds; round++) {
  // Reverse page/device ordering on alternate rounds to expose time-order bias.
  const pages = round % 2 ? cases : [...cases].reverse();
  const modes = round % 2 ? ['mobile', 'desktop'] : ['desktop', 'mobile'];
  for (const [page, route] of pages) for (const mode of modes) {
    const name = `${page}-${mode}-${round}`;
    const stem = `qa/phase4/${batch}/${name}`;
    const record = { name, round, page, route, mode, started: new Date().toISOString(), cpuBefore: await cpu() };
    console.log(JSON.stringify({ starting: name, cpu: record.cpuBefore.LoadPercentage }));
    const args = [cli, new URL(route, base).href, '--output=json', '--output=html', `--output-path=${stem}`,
      '--chrome-flags=--headless=new --no-first-run --disable-extensions --remote-debugging-address=127.0.0.1',
      '--only-categories=performance,accessibility,best-practices,seo', '--max-wait-for-load=45000', '--quiet'];
    if (mode === 'desktop') args.push('--preset=desktop');
    if (round === 1) args.push('--save-assets');
    record.command = [process.execPath, ...args];
    Object.assign(record, await command(process.execPath, args));
    record.cpuAfter = await cpu();
    record.finished = new Date().toISOString();
    try {
      const report = JSON.parse(await readFile(new URL(`${batch}/${name}.report.json`, import.meta.url), 'utf8'));
      record.runtimeError = report.runtimeError || null;
      record.scores = Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, v.score === null ? null : Math.round(v.score * 100)]));
      record.metrics = Object.fromEntries(['largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'first-contentful-paint', 'speed-index'].map(k => [k, report.audits[k]?.numericValue ?? null]));
      record.benchmarkIndex = report.environment.benchmarkIndex;
      record.warnings = report.runWarnings;
      record.settings = report.configSettings;
    } catch (error) { record.readError = String(error); }
    records.push(record);
    await writeFile(new URL(`${batch}/runs.json`, import.meta.url), JSON.stringify(records, null, 2) + '\n');
    console.log(JSON.stringify({ finished: name, exit: record.exit, score: record.scores?.performance, metrics: record.metrics, benchmark: record.benchmarkIndex, cpuAfter: record.cpuAfter.LoadPercentage }));
  }
}
