import { readFile, writeFile } from 'node:fs/promises';
const input = process.argv[2];
if (!input) throw new Error('Pass a local Chrome trace JSON path.');
const trace = JSON.parse(await readFile(input, 'utf8'));
const events = trace.traceEvents;
const largestLayout = events.filter(e => e.name === 'Layout' && e.dur).sort((a, b) => b.dur - a.dur)[0];
if (!largestLayout) throw new Error('No Layout event in trace');
const main = events.filter(e => e.pid === largestLayout.pid && e.tid === largestLayout.tid);
const timing = e => ({ name: e.name, wallMS: e.dur / 1000, threadCPUms: e.tdur == null ? null : e.tdur / 1000, ts: e.ts, args: e.args });
const top = (name, limit = 8) => main.filter(e => e.name === name && e.dur).sort((a, b) => b.dur - a.dur).slice(0, limit).map(timing);
const longTasks = main.filter(e => e.name === 'RunTask' && e.dur > 50000).sort((a, b) => b.dur - a.dur).slice(0, 12).map(task => ({
  ...timing(task),
  inside: main.filter(e => e !== task && e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur && e.dur > 1000).sort((a, b) => b.dur - a.dur).slice(0, 18).map(timing),
}));
const categoryTotals = {};
for (const e of main.filter(e => e.dur && e.name !== 'RunTask')) {
  const row = categoryTotals[e.name] ||= { count: 0, wallMS: 0, threadCPUms: 0, maxWallMS: 0 };
  row.count++; row.wallMS += e.dur / 1000; row.threadCPUms += (e.tdur || 0) / 1000; row.maxWallMS = Math.max(row.maxWallMS, e.dur / 1000);
}
const result = {
  input, units: 'milliseconds except raw trace timestamps (microseconds)',
  note: 'Nested category totals overlap; do not sum them. Wall minus thread CPU can include waiting/descheduling and is not proof of a specific competing process.',
  environment: { hardware: trace.metadata?.['hardware-class'], nativeAccessibility: trace.metadata?.['accessibility-enabled-modes'] },
  longTasks, layouts: top('Layout'), scripts: top('EvaluateScript'), functions: top('FunctionCall'),
  timers: top('TimerFire'), callbacks: top('EventDispatch'), style: top('UpdateLayoutTree'),
  categoryTotals,
};
const out = input.replace(/\.trace\.json$/, '.analysis.json');
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output: out, topLayout: result.layouts[0], longestTasks: longTasks.slice(0, 3).map(t => ({ wallMS: t.wallMS, threadCPUms: t.threadCPUms, inside: t.inside.slice(0, 3).map(e => ({ name: e.name, wallMS: e.wallMS, threadCPUms: e.threadCPUms })) })) }, null, 2));
