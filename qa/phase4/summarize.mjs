import { readFile, writeFile } from 'node:fs/promises';
const batch = process.argv[2] || 'baseline';
if (!/^[a-z0-9-]+$/.test(batch)) throw new Error('Invalid batch');
const runs = JSON.parse(await readFile(new URL(`${batch}/runs.json`, import.meta.url), 'utf8'));
const median = values => { const a = [...values].sort((a, b) => a - b); const mid = Math.floor(a.length / 2); return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2; };
const groups = [];
for (const page of ['home', 'shopify', 'seo']) for (const mode of ['mobile', 'desktop']) {
  const rows = runs.filter(r => r.page === page && r.mode === mode);
  if (!rows.length) continue;
  const valid = rows.filter(r => r.exit === 0 && !r.runtimeError && r.metrics['total-blocking-time'] !== null);
  const allSettings = [...new Set(valid.map(r => JSON.stringify({ method: r.settings.throttlingMethod, throttling: r.settings.throttling, screenEmulation: r.settings.screenEmulation, formFactor: r.settings.formFactor })))];
  groups.push({ page, mode, count: rows.length, valid: valid.length, comparableSettings: allSettings.length === 1, settings: valid[0]?.settings,
    runs: rows.map(r => ({ name: r.name, performance: r.scores?.performance, metrics: r.metrics, benchmark: r.benchmarkIndex, cpuBefore: r.cpuBefore.LoadPercentage, cpuAfter: r.cpuAfter.LoadPercentage, warnings: r.warnings, runtimeError: r.runtimeError })),
    medians: valid.length ? { performance: median(valid.map(r => r.scores.performance)), ...Object.fromEntries(Object.keys(valid[0].metrics).map(k => [k, median(valid.map(r => r.metrics[k]))])), benchmarkIndex: median(valid.map(r => r.benchmarkIndex)) } : null,
    range: valid.length ? { performance: [Math.min(...valid.map(r => r.scores.performance)), Math.max(...valid.map(r => r.scores.performance))], tbt: [Math.min(...valid.map(r => r.metrics['total-blocking-time'])), Math.max(...valid.map(r => r.metrics['total-blocking-time']))], benchmark: [Math.min(...valid.map(r => r.benchmarkIndex)), Math.max(...valid.map(r => r.benchmarkIndex))] } : null,
  });
}
await writeFile(new URL(`${batch}/summary.json`, import.meta.url), JSON.stringify({ batch, runs: runs.length, note: 'Every valid run included. Medians per metric; same settings do not guarantee identical host load. No field INP claim.', groups }, null, 2) + '\n');
console.log(JSON.stringify(groups.map(({ page, mode, count, medians, range, comparableSettings }) => ({ page, mode, count, medians, range, comparableSettings })), null, 2));
