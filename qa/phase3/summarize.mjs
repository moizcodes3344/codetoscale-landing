// Local report reduction only. Does not run browsers, build or publish.
import { readFile, readdir, writeFile } from 'node:fs/promises';
const metricIDs = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];
async function summarize(path) {
  const report = JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
  const seoRefs = report.categories.seo.auditRefs.filter(a => a.weight > 0);
  return {
    report: path, url: report.requestedUrl, fetched: report.fetchTime,
    lighthouseVersion: report.lighthouseVersion, runtimeError: report.runtimeError || null,
    scores: Object.fromEntries(Object.entries(report.categories).map(([id, c]) => [id, c.score === null ? null : Math.round(c.score * 100)])),
    metrics: Object.fromEntries(metricIDs.map(id => [id, report.audits[id]?.numericValue ?? null])),
    benchmarkIndex: report.environment.benchmarkIndex,
    warnings: report.runWarnings, throttling: report.configSettings.throttling,
    motionLabelAudit: report.audits['label-content-name-mismatch']?.score ?? null,
    failedWeightedSEO: seoRefs.filter(a => report.audits[a.id]?.score === 0).map(a => ({ id: a.id, title: report.audits[a.id].title, details: report.audits[a.id].details })),
  };
}
const mobileNames = [1, 2, 3].map(n => `lighthouse/home-mobile-audit-${n}.report.json`);
const mobile = await Promise.all(mobileNames.map(summarize));
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const medians = {
  performance: median(mobile.map(r => r.scores.performance)),
  ...Object.fromEntries(metricIDs.map(id => [id, median(mobile.map(r => r.metrics[id]))])),
};
const services = await Promise.all(['shopify-mobile-release', 'shopify-desktop-release', 'seo-mobile-final', 'seo-desktop-final'].map(name => summarize(`lighthouse/${name}.report.json`)));
const desktop = await summarize('lighthouse/home-desktop-audit.report.json');
const baselines = await Promise.all(['baseline/home-mobile.report.json', 'baseline/control-desktop-network-enabled.report.json'].map(summarize));
const archive = await Promise.all((await readdir(new URL('lighthouse/', import.meta.url))).filter(n => n.endsWith('.report.json')).sort().map(n => summarize('lighthouse/' + n)));
const result = {
  verdict: 'NOT READY — REMAINING ISSUES',
  selectedFinalMobile: mobile, mobileMedians: medians, selectedFinalDesktop: desktop,
  representativeServices: services, entryBaselines: baselines,
  interpretation: 'Final mobile audit-1/2/3 form the reported triplet, not the best runs from the archive. Same settings; variable host load and slow-CPU warnings limit causal comparisons. Service reports use the final shared styles and font assets; later homepage-only script scheduling does not run on service pages. Lab TBT is not field INP.',
  archive,
};
await writeFile(new URL('measurements.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
await writeFile(new URL('final-mobile-measurements.json', import.meta.url), JSON.stringify({ runs: mobile, medians, targets: { performance: 90, lcpMS: 2500, tbtMS: 200, cls: .1 }, passed: { performance: medians.performance >= 90, lcp: medians['largest-contentful-paint'] <= 2500, tbt: medians['total-blocking-time'] <= 200, cls: medians['cumulative-layout-shift'] <= .1 } }, null, 2) + '\n');
await writeFile(new URL('seo-audits.json', import.meta.url), JSON.stringify([ ...mobile, desktop, ...services ].map(({ report, scores, failedWeightedSEO }) => ({ report, score: scores.seo, failedWeightedSEO, explanation: 'is-crawlable fails because the loopback preview intentionally sends X-Robots-Tag: noindex, nofollow. Do not remove this protection to raise the score.' })), null, 2) + '\n');
console.log(JSON.stringify({ mobileMedians: medians, desktop: desktop.scores, services: services.map(r => ({ report: r.report, scores: r.scores })) }, null, 2));
