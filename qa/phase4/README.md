# Phase 4 local evidence

The website's Phase 3 application files were frozen during this investigation.
`entry/hashes.json` is the entry snapshot; `preservation.json` is the final check.

- `baseline/`: five rounds, homepage/Shopify/SEO, mobile and desktop: **30 actual reports**. `runs.json` records execution order, exact commands, CPU observations, exit codes and settings. `summary.json` includes every valid sample and per-metric medians. Round 1 also retains raw Chrome traces and network logs.
- `home-mobile-diagnostic*`: separate higher-detail trace with font, Blink, IPC, invalidation and V8 sampling categories. **Excluded from baseline medians.** No website changes or browser protection changes were used.
- `diagnostic-attribution.json`: exact native font/layout, browser content extraction and site callback costs. Nested event times overlap and must not be summed.
- `phase3-thread-timing.json`: wall time versus thread CPU in the previous final mobile trace.
- `layouts.json`, `interactions.json`, `console.json`, `screenshots/`: fresh browser checks. A first large browser batch timed out; only the recovered, incrementally saved checks count as completed evidence.
- `tests.json`, `crawl.json`: fresh automated and local HTTP results.

Reproduce after starting the existing preview and using its printed loopback URL:

```powershell
$env:PREVIEW_URL = 'http://127.0.0.1:4173'
node qa/phase4/run-audits.mjs new-baseline 5
node qa/phase4/summarize.mjs new-baseline
```

The harness uses the already-cached official Lighthouse 13.6.0 tool at the recorded machine-local path. It installs no package. Run on an idle machine with intended browser tooling; do not collect concurrent Lighthouse runs. Keep default throttling and preview noindex. Do not overwrite historical batches. Raw reports contain local URLs; this directory is private QA evidence and must not be deployed.
