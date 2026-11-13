# Phase 4 — targeted performance investigation

**Final status: NOT READY.** The investigation is ready to review, but mobile performance is not cleared for launch. Nothing was deployed, published, merged or committed. Production indexing was not changed.

13 November 2026, Asia/Karachi. Branch: `codex/seo-executive-summary`. Read first: the Phase 3 report, production launch checklist and complete Phase 3 measurement archive. The existing dirty checkout and branch were preserved.

## Decision and scope

**No application code was changed.** All 35 entry-snapshot files, including the Phase 3 implementation, remained byte-identical after the fresh build and investigation; only documentation is updated afterward. `qa/phase4/preservation.json` records the final comparison. The entry hashes also match every file in the Phase 3 change manifest. There are no typography, animation, content, navigation, service-page, form, metadata, indexing or hosting edits in Phase 4.

The five-run desktop median is **100**, with individual scores **81, 100, 100, 100, 88**, on unchanged application code. The earlier score of 78 is **not reproducible as a consistent regression**. That does not prove every earlier code change was harmless on every device. Mobile remains slower: **71, 86, 77, 83, 87**, median **83**, TBT median **679ms**. These are new measurements, **not a performance gain caused by a Phase 4 fix**.

The evidence identifies native text shaping/layout, browser-native content extraction, and substantial wall-time versus thread-CPU gaps. It does not identify a large site JavaScript function that justifies a rewrite, listener removal or animation removal. Changing the brand fonts or suppressing browser instrumentation simply to improve a score is not an accepted fix. A stable independent test environment is required before further application changes can be assessed reliably.

## Repeatable measurement setup

- Existing `npm run dev` printed **http://127.0.0.1:4173**. Real generated static HTML was served, without an SPA fallback or development overlay. No guessed production URL was used.
- Lighthouse **13.6.0**, official cached CLI; installed Google Chrome **157.0.0.0**, Windows, Intel i5-6300U. No package installation, dependency or lockfile change.
- **30 baseline audits:** 5 rounds × home/Shopify/SEO × mobile/desktop. Runs serialized, isolated Chrome profiles; page/device order reversed on alternate rounds. No browser UI QA, build or test suite ran concurrently with the baseline audits. Small trace/source inspections did occur; this is not a dedicated lab machine.
- Mobile: simulated throttling, **412×823**, DPR 1.75, **150ms RTT, 1638.4Kbps, 4× CPU**. Desktop: `--preset=desktop`, **1350×940**, DPR 1, **40ms RTT, 10240Kbps, 1× CPU**. `summary.json` confirms identical settings within every page/device group.
- Existing preview **`X-Robots-Tag: noindex, nofollow`** and **`Cache-Control: no-store`** retained. No warm-cache claim. Local preview is not proof of production HTTPS, compression or CDN caching.
- All 30 baseline reports exited 0 with no Lighthouse runtime error. Every valid sample is included. First-round traces were saved for all six cases. A **31st, higher-detail mobile trace** adds fonts/Blink/IPC/invalidation/V8 sampling categories and is excluded from baseline medians.
- Read-only processor load/clock snapshots before/after every run, exact commands, execution order and warnings are in `qa/phase4/baseline/runs.json`. User applications were not closed, reprioritized or reconfigured.

The real CLI is wrapped by `qa/phase4/run-audits.mjs`; `summarize.mjs` calculates each metric's median independently. `qa/phase4/README.md` gives local reproduction commands. `qa/phase4/measurements.json` combines the baseline, historical comparison and validation status. No score normalization or removal of slow samples is used.

## Individual homepage results

| Mobile run | Performance | LCP | TBT | CLS | CPU benchmark |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 71 | 1.361s | 2,113ms | 0 | 627.5 |
| 2 | 86 | 1.359s | 549ms | 0.01204 | 1301.5 |
| 3 | 77 | 1.355s | 1,028ms | 0 | 756.5 |
| 4 | 83 | 1.355s | 679ms | 0.01204 | 1160 |
| 5 | 87 | 1.354s | 512ms | 0.01204 | 1431 |
| **Median** | **83** | **1.355s** | **679ms** | **0.01204** | **1160** |

| Desktop run | Performance | LCP | TBT | CLS | CPU benchmark |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 81 | 0.556s | 413ms | 0 | 678.5 |
| 2 | 100 | 0.489s | 38ms | 0.00036 | 1209 |
| 3 | 100 | 0.470s | 12ms | 0.00036 | 1438.5 |
| 4 | 100 | 0.476s | 0ms | 0.00036 | 1366.5 |
| 5 | 88 | 0.558s | 275ms | 0.00036 | 686.5 |
| **Median** | **100** | **0.489s** | **38ms** | **0.00036** | **1209** |

All baseline reports have Accessibility **100** and Best Practices **100**. Home SEO **66**, service SEO **63**; the only failing weighted SEO audit is intentional preview **`is-crawlable`**, caused by the noindex HTTP header. These are actual preview scores, not projected production scores.

## Before / after investigation, with unchanged site code

| Mode / metric | Phase 3 final evidence | Phase 4 five-run median |
| --- | ---: | ---: |
| Mobile Performance | 68 median, 3 samples | 83 |
| Mobile LCP | 1.357s | 1.355s |
| Mobile TBT | 3,370ms | 679ms |
| Mobile CLS | 0 | 0.01204 |
| Desktop Performance | 78, 1 final sample; earlier 94 | 100 |
| Desktop LCP | 0.573s | 0.489s |
| Desktop TBT | 493ms | 38ms |
| Desktop CLS | 0 | 0.00036 |

This compares measurement sessions with different observed host conditions and sample counts. It is **not** a matched before/after optimization experiment. CLS is slightly higher than Phase 3 but below 0.1 in every current homepage sample; no layout change was made. The mobile 90/200ms targets are still unmet, including the least-blocked mobile sample at 512ms. Field CWV/INP and physical-phone behavior are not established by these lab results. TBT is not INP.

## Service controls

The following arrays list rounds 1–5. Full LCP/TBT/CLS values and settings for every sample are in `baseline/summary.json`.

| Control | Individual Performance | Individual TBT (ms, rounded) | Median LCP | Median TBT | Median CLS |
| --- | --- | --- | ---: | ---: | ---: |
| Shopify mobile | 100, 100, 100, 100, 94 | 0, 0, 0, 54, 281 | 1.053s | 0ms | 0 |
| Shopify desktop | 100, 100, 100, 100, 100 | 0, 0, 0, 0, 18 | 0.283s | 0ms | 0 |
| SEO mobile | 100, 100, 100, 100, 96 | 0, 0, 35, 0, 215 | 1.054s | 0ms | 0 |
| SEO desktop | 100, 100, 100, 100, 100 | 0, 1, 10, 0, 3 | 0.285s | 1ms | 0 |

These resolve the earlier SEO-service 91/95 scores as **nonpersistent in this five-run session**, not proof of a code repair. Both mobile controls also slowed in round 5, with benchmark indices 626.5/631.5, despite unchanged content and no heavy site script. The homepage is consistently more expensive than these simpler controls; environmental variation is not the entire explanation.

## Trace evidence and responsible operations

Raw trace durations below are **observed milliseconds**, not the simulated 4× Lighthouse totals. Nested timings overlap and must not be summed. `analyze-trace.mjs` writes reductions while retaining full original traces.

| Responsible operation | Measured cost | Interpretation |
| --- | --- | --- |
| `Document::FinishedParsing` → `Document::UpdateStyleAndLayout` → `LocalFrameView::performLayout` | Detailed capture: Layout **282.169ms wall / 246.739ms thread CPU**, 445 layout objects. Baseline mobile: **340.602 / 271.803ms**; desktop: **291.442 / 257.274ms**. | Real browser rendering cost during initial parsing, not a demonstrated long JavaScript function or repeated JS geometry-read loop. Root is the document, not a uniquely identified offending service/card. |
| `InlineNode::ShapeTextIncludingFirstLine` inside that initial Layout | **95 events, 180.214ms wall / 161.694ms CPU** in the detailed capture. | Text shaping is a substantial portion of the initial layout. This is native browser/font work using the retained typography. It does not justify changing fonts or content without a separately controlled benefit and visual comparison. |
| Font platform/cache work nested within layout/shaping | `FontCache::GetFontPlatformData`: 136 events, **70.134ms wall**. Sixteen font stream mappings: **56.119ms**. Two fallback-character calls: **19.755ms**. | Actual font/cache initialization, not an external font network waterfall. These times overlap with shaping; adding them would double-count. Fallback is not the dominant measured cost, so a speculative glyph replacement is not retained. |
| Chrome `AIPageContentAgent::ContentBuilder::Build` | **168.212ms wall / 151.2ms CPU**. Its call tree includes **119.416ms Layout** (1,394 dirty / 1,952 total objects) and **44.205ms UpdateLayoutTree** (1,040 elements). | Browser-native content extraction caused additional layout/style work during the audit, including offscreen content. This function is not in the website. The trace does not identify which client requested extraction; it is not attributed specifically to Codex or Lighthouse. |
| Unattributed renderer `RunTask` with almost no thread CPU | Phase 3: **702.527ms wall / 0.385ms CPU**. Fresh baseline mobile: **251.974 / 0.486ms**; desktop: **447.319 / 0.201ms**. Detailed capture also had **185.590 / 3.901ms**. | Predominantly waiting/descheduling rather than active JavaScript execution. CPU contention, synchronization and other waits cannot be separated fully by these traces. Calling all of this JavaScript work would be incorrect. |
| Website `script.js` initial `EvaluateScript` | Detailed capture **11.793ms wall / 10.765ms CPU**. | Startup script execution is a small part of the expensive initial task. Removing the technology explorer, form logic or animation controls would not be evidence-based. |
| `sceneObserver` callback (`script.js`, line 208) | **1.969ms**, the largest measured site callback in the detailed trace. Section navigation observer: **0.774ms**; terminal observer: **0.213ms**; reveal observer: **0.192ms**. | No measured long-running observer callback. Existing IntersectionObserver scheduling is preserved. |
| Timer callbacks | Two `TimerFire` events: **0.440ms / 0.388ms**. | No long timer execution found in the capture. These trace events alone do not prove which timer caused every downstream operation. No timer/feature removal is justified. |

Evidence paths: `qa/phase4/diagnostic-attribution.json`, `home-mobile-diagnostic-0.trace.json`, its `.analysis.json`, and the first-round home/control traces under `baseline/`. The detailed capture also contains V8 `ProfileChunk` samples; it was used for attribution rather than median scoring.

The first mobile Lighthouse report attributes about 2.59s to Style & Layout and 2.57s to Other, versus 77ms Script Evaluation in its simulated main-thread breakdown. Its forced-reflow insight contains no attributed call sites. The detailed trace identifies native parsing/layout and browser extraction behind substantial work. This does **not** mean zero forced style/layout exists anywhere: the parser and browser agent explicitly force lifecycle work, while no site JS read/write thrashing loop was demonstrated.

Source inspection confirms one local homepage script, about 20.6KB, no third-party script, animation framework, analytics or development overlay. Native CSS animations remain. No scroll/resize JavaScript measurement loop was found. `prepareAnchorNavigation()` deliberately resolves layout once for an actual anchor action; it is not called in an unfragmented Lighthouse load and was not blamed for startup TBT. Contact behavior and event listeners remain unchanged.

Interpretation sources: Chromium distinguishes [elapsed duration and thread CPU duration](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/trace-event-reading/). Chromium's [content-extraction implementation change](https://chromium.googlesource.com/chromium/src/+/64154b3895e788731c0095472df4881df78c38be) documents `AIPageContentAgent::ContentBuilder::Build` and lifecycle/display-lock handling. Lighthouse's [variability guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md) and [throttling guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md) explain why matching settings alone cannot eliminate host contention. The numerical costs above are from this project's captured traces, not those sources.

## What can and cannot be concluded

**Established:** the homepage has more real text/layout work than the service controls; native extraction adds a separately identifiable layout pass; site callbacks are short in the detailed capture; the same unchanged site can score 81 or 100 on desktop. Within this session homepage CPU benchmarks span **627.5–1438.5**, and before/after host load observations span **20–65%** across runs. Slow-host warnings and thread timing support a substantial environment contribution.

**Not established:** an exact percentage of TBT caused by competing host processes, a browser-agent-free end-user result, a persistent desktop code regression, or a specific safe CSS/JS edit with a repeatable benefit. The desktop low scores could not be reproduced consistently. Native extraction was observed but no browser feature/security/accessibility setting was disabled to produce a better score. No benchmark correction was applied. Font and layout work remains real even on faster runs.

**Recommended next experiment:** use an idle dedicated machine or CI worker, same pinned browser/Lighthouse versions, AC power and an unchanging power profile. Run ordinary standalone Lighthouse without simultaneous UI/AI-content extraction clients; inspect the trace to confirm whether extraction still occurs. Keep accessibility testing and browser security intact. Counterbalance five unchanged baseline/current runs, repeat the two service controls, and capture a physical midrange phone. If initial text layout remains excessive there, isolate its subtree/font costs in diagnostic copies and retain a code change only after matched timing and visual evidence. Do not tune the site to hide content from extraction tools or remove approved text/animations to game scoring.

## Fresh validation

| Check | Result |
| --- | --- |
| `npm run build` | PASS. Existing output idempotent: 13 content pages generated; legal bodies preserved, origin-dependent metadata withheld. |
| `npm run check` | **70/70 PASS**, including syntax, structural/SEO checks and actual loopback HTTP routes. |
| `git diff --check` | PASS; only existing LF/CRLF normalization notices. |
| `node scripts/crawl.mjs` against actual preview | **15 pages, 85 local targets, 27 requests, zero errors**. Sitemap correctly withheld pending origin. |
| Direct service reloads | Shopify and SEO routes explicitly opened and reloaded in the browser; expected page content/title loaded. HTTP suite covers all public routes. |
| Responsive geometry | **15 fresh combinations:** home, Shopify and SEO × **375, 425, 768, 1024, 1440px**. One H1 each and no document horizontal overflow. |
| Visual review | Fresh 375px and 1440px homepage screenshots inspected: retained branding, text, hero composition, controls and responsive layout. No new clipping/overlap observed. |
| Controls | Play/Pause action/pressed state; mobile menu background isolation/Escape; technology WooCommerce tab and Home key; service CTA→contact prefill; empty form focuses name with native validation. |
| Console | No warning/error entries returned in inspected final flows. |
| Source protection | Application hashes unchanged; approved copy, fonts, animations, navigation, form, config, robots and tests retained. No new dependencies. |

A first large browser automation batch stalled and reset its session. Its unsaved layout results are **not** counted. Recovery with small calls completed all 15 combinations, saving each record immediately. One stale accessibility index was refreshed before continuing. These tool failures were not silently treated as website test passes or as application console errors.

Files: `layouts.json`, `interactions.json`, `console.json`, `tests.json`, `crawl.json` and screenshots under `qa/phase4/`. Prior 75-view Phase 3 coverage is historical; it is not represented as a new 75-view pass. Full screen-reader, OS reduced-motion emulation, cross-browser certification, physical-device, font-failure and real mail-client delivery checks remain untested in this phase.

## Exact file changes

- **No application files changed.** Running the build produced identical application bytes.
- Updated `README.md`: point readers to this latest measured investigation.
- Updated `docs/production-launch-checklist.md`: distinguish the reproducibility finding from unresolved mobile performance and owner blockers.
- Added `docs/phase4-performance-report.md`: this report.
- Added `qa/phase4/run-audits.mjs`, `analyze-trace.mjs`, `summarize.mjs`, `README.md` and the raw evidence/snapshots described above. These are local diagnostic tools, never public website routes.
- The existing crawl command rewrote `qa/seo/crawl.json` with identical bytes to the Phase 3 final crawl; its result was copied to Phase 4 evidence. Prior Phase 3/production-readiness raw reports were not overwritten. `qa/phase4/changed-files.json` lists new evidence and changed documentation with hashes.

## Production dependencies and final status

The production domain, hosting and official business email are still unconfirmed/unpurchased. `productionUrl: null`, preview noindex, withheld canonicals/absolute sharing URLs/sitemap, and pending/noindex Privacy/Terms are retained. No guessed URLs or legal policies were generated. The form still prepares a draft to the existing recipient; **automatic email delivery and mailbox receipt are not configured or claimed**. No valid mail draft was sent or external mail-client block bypassed.

Before launch: obtain the real origin/host policy and approved legal content; confirm the mailbox and draft-versus-submission behavior; generate/review domain-dependent output locally; test actual host routing/cache/HTTPS and contact handling; finish independent mobile performance validation. Full steps remain in the [production launch checklist](production-launch-checklist.md). Deployment, publication, merge and Search Console activity each remain outside this authorization.

**NOT READY.** Local investigation and regression evidence are available for owner review. The desktop decline is variable rather than persistent; mobile performance remains unapproved, and the present host/tooling cannot establish a reliable application optimization benefit.
