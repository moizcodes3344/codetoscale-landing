# Phase 3 — performance and technical QA

**NOT READY — REMAINING ISSUES. Nothing deployed, published, merged or committed.**

12 November 2026; branch `codex/seo-executive-summary`. The existing dirty checkout was retained. This pass makes targeted font, rendering and accessibility changes; it does not redesign the website or change approved service copy. The production domain and official business mailbox have not been purchased. `productionUrl` remains null.

The mobile homepage LCP and CLS targets are met in the final three lab runs. Performance and TBT targets are **not** met. The final desktop score is below the earlier baseline and needs further investigation. Passing structural tests does not clear these findings.

## Root causes and implemented changes

| Finding from diagnostics | Change | Evidence and limit |
| --- | --- | --- |
| External Google Fonts CSS and a subsequent font waterfall delayed text rendering. The homepage LCP candidate was `.hero-description`, not an image. The fresh entry baseline had 3.31s LCP; its LCP render delay was about 2.96s. | Bundle the exact original Plus Jakarta Sans and Fira Code Latin WOFF2 files, retain their SIL OFL licenses, preload both, and define the existing families/weights locally with `font-display: swap`. Remove remote font stylesheet/preconnect links on all 15 pages. | Final LCP 1.35–1.36s. No external font requests. Two local fonts total 63,612 bytes; correct WOFF2 signature and MIME checked. Families, sizes, weights and colors remain unchanged. |
| Reveal initialization mixed `getBoundingClientRect()` reads with class/style writes over the long homepage. The baseline trace contained a 647ms Layout involving 1,668 objects; Lighthouse identified the reveal read as a forced-reflow call site. | Use the existing IntersectionObserver directly for reveal visibility; retain reveal transitions and stagger delays. Remove startup geometry reads. | Final forced-reflow insight contains no attributed items. This removes that call pattern, not all browser layout work. |
| The initial page rendered a large amount of offscreen content. | Progressively apply `content-visibility: auto` with remembered intrinsic size to below-hero sections and the footer. No-JS, unsupported browsers, fragment entry and print retain normal rendering. | A diagnostic trace reduced one initial Layout to 445 objects. The final trace still has an expensive 558ms Layout over those objects. This is a partial improvement, not a resolved TBT target. |
| Skipped section sizes can interfere with anchor destinations. | Opt in only on unfragmented loads; resolve sizes once before native anchor clicks. Hash entry bypasses containment. Preserve hrefs and native smooth scrolling. | Real desktop/mobile navigation and direct fragment entry checked. Raw early/in-flight scroll samples are retained, not counted as successful settled navigation. |
| Duplicate hero observers and repeated unchanged DOM/style writes caused avoidable invalidation. The terminal is below the first mobile viewport even while hero copy is visible. | Cache decorative nodes, make state writes idempotent, observe the actual terminal and scene separately, pause logs while the terminal is offscreen, and pause decorative loops until the scene is substantially visible or the tab is backgrounded. Keep reduced-motion and no-IntersectionObserver fallbacks. | Mobile logs stayed unchanged over a timer period offscreen, resumed in view, and desktop logs/animations ran normally. Play/Pause still controls both. No animations or design features were removed. |
| Visible `PLAY` versus accessible `Resume`, plus decorative glyph text, failed label-in-name. | Match the accessible action to Play/Pause; paint the unchanged decorative symbols with CSS. | `label-content-name-mismatch` score **1** in every selected final report. Both states checked in the browser. Earlier unsuccessful glyph variants remain diagnostic evidence only. |
| Font swaps contributed to baseline CLS up to 0.143. | Load the same fonts locally and early. Retain existing hero dimensions and project-image aspect ratios. | Final homepage triplet CLS **0 / 0 / 0**. Service samples also zero. Font-failure scenarios and physical-device testing remain untested. |

Other investigations: no animation framework, third-party tracking or large application bundle was found. There are no scroll/resize JavaScript handlers repeatedly measuring the document; existing media queries and IntersectionObservers handle those changes. CSS hero/reveal effects remain. The stylesheet remains render-blocking, but final LCP meets target; blindly inlining/splitting it was not justified by the remaining CPU bottleneck. Project SVGs are below the fold, lazy-loaded and dimensioned; no critical hero image was lazily loaded or recompressed. Actual hosting compression/cache behavior is unconfigured and was not simulated as a production result.

Technique references: [layout read/write costs](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing), [font loading](https://web.dev/articles/optimize-webfont-loading), and [content visibility](https://web.dev/articles/content-visibility). These explain implementation choices; measured results below come from this repository's local reports.

## Measured Lighthouse results

Actual website preview: `http://127.0.0.1:4173`, as printed by `npm run dev`. Static files were served without a framework development overlay or SPA fallback. The loopback server retained `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` throughout. No production origin was substituted.

Lighthouse **13.6.0**, installed Chrome **157**, serialized runs with isolated profiles; no project dependencies added. Mobile: default simulated 412×823, 150ms RTT, 1638.4Kbps, 4× CPU slowdown. Desktop: `--preset=desktop`. Final homepage mobile reports are exactly **`home-mobile-audit-1/2/3`**, collected after closing our temporary browser QA tabs. They are not selected from the highest-scoring experiments.

| Homepage measurement | Performance | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: |
| Earlier production QA mobile 1 | 52 | 3.29s | 3,485ms | 0.143 |
| Earlier production QA mobile 2 | 53 | 3.61s | 3,382ms | 0.036 |
| Fresh Phase 3 entry baseline | 56 | 3.31s | 3,675ms | 0.036 |
| Final mobile 1 | 68 | 1.365s | 3,370ms | 0 |
| Final mobile 2 | 70 | 1.353s | 2,842ms | 0 |
| Final mobile 3 | 68 | 1.357s | 4,430ms | 0 |
| **Final mobile median** | **68** | **1.357s** | **3,370ms** | **0** |
| Earlier production QA desktop | 94 | 1.184s | 121ms | 0.00049 |
| Final desktop | 78 | 0.573s | 493ms | 0 |
| Untouched snapshot, later same-host desktop control | 91 | 1.185s | 176ms | 0.00041 |

Medians are computed separately for each metric. Median mobile FCP is 1.357s; Speed Index is 3.797s. All selected homepage reports: Accessibility **100**, Best Practices **100**, SEO **66**. Target results: Performance ≥90 **FAIL**; LCP ≤2.5s **PASS**; TBT ≤200ms **FAIL**; CLS ≤0.1 **PASS**. The isolated diagnostic score of 90 is not a repeatable final pass.

| Representative page | Mode | Before / after Performance | After LCP | After TBT | After CLS |
| --- | --- | ---: | ---: | ---: | ---: |
| Shopify | Mobile | 99 / 99 | 1.053s | 103ms | 0 |
| Shopify | Desktop | 99 / 100 | 0.291s | 0ms | 0 |
| SEO & Content Marketing | Mobile | 99 / 91 | 1.054s | 367ms | 0 |
| SEO & Content Marketing | Desktop | 99 / 95 | 0.290s | 189ms | 0 |

Service Accessibility/Best Practices are **100/100**, SEO **63**. Service reports use the final shared styling and font assets. Subsequent changes only to homepage motion scheduling do not execute on service pages. The SEO service mobile TBT also exceeds 200ms; its lower Performance score remains a finding, not a cleared regression.

### Remaining bottleneck and measurement limitations

Final mobile run 3 reports about **3.95s Style & Layout**, **4.25s Other**, and **74ms Script Evaluation** in Lighthouse's main-thread breakdown. The raw Chrome trace includes a **595ms task containing a 558ms Layout**, with only about 11ms EvaluateScript; another 703ms task has no useful nested attribution. Later layouts include 145ms and 124ms. This supports continued work on renderer/layout cost. It does **not** establish that every unattributed task is caused by an animation, or that a JavaScript rewrite would solve it. Raw trace: `qa/phase3/lighthouse/home-mobile-audit-3-0.trace.json`; reduction: `final-trace-summary.json`.

All final mobile samples warn about a slower-than-expected host CPU. Their benchmark indices were **592 / 481 / 721.5**; desktop was 774, whereas the later untouched control was 1420. A read-only OS observation found **84% host CPU load while no Lighthouse audit was running** on an Intel i5-6300U. This limits causal comparisons across runs; it does not erase the poor measurements. User applications were not terminated or reconfigured. All intermediate reports, including worse results and discarded staging/containment experiments, remain in the archive. `measurements.json` enumerates them separately from the selected final triplet.

The initial control server was unreachable under restricted loopback permissions and produced a Chrome load-error report; its zero scores are **invalid measurements**, retained separately. Repeating with permitted loopback networking loaded the untouched snapshot successfully. No browser warning or certificate check was bypassed. The valid control's different CPU calibration prevents treating it as a matched A/B proof. The desktop and SEO-service score reductions remain unresolved until paired captures on stable hardware establish their cause.

These are lab LCP/CLS and TBT observations, not field Core Web Vitals certification. **TBT is not INP.** No physical-phone, field INP or real-user percentile result exists. See [official Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) and [CPU throttling guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md#cpu-throttling).

## Tests, routes, visual and functional QA

| Check | Final result |
| --- | --- |
| `npm run build` | PASS: 13 content pages generated; legal bodies preserved; domain-dependent output withheld. |
| `npm run check` | **PASS 70/70**, JS syntax plus structural, metadata, source integrity and real HTTP tests. Initial restricted run: 69/70, one loopback `EACCES`; rerun with local networking passed. |
| Lint/typecheck | No separate scripts exist. No invented checks are claimed. |
| `npm run audit:seo` | PASS: 15 pages, one H1 each, unique titles/descriptions. |
| `node qa/phase3/audit-source.mjs` | PASS: no duplicate head tags, valid JSON-LD, no empty placeholder links, local OG asset 1200×630. |
| Guarded production build | Expected rejection, exit 1 because origin is null; **zero page writes**, recorded by source audit. |
| Live `node scripts/crawl.mjs` | **15 pages, 85 unique local targets, 27 requests, zero errors**, including new fonts. |
| Direct route loads/reloads | Existing 15-page browser pass retained and rechecked during this phase; services are actual static HTML, not a home fallback. HTTP checks also exercise all routes. |
| Responsive geometry | **75 combinations**: 15 pages × 375/425/768/1024/1440px; zero document horizontal overflow and one H1 each. |
| Menu/tabs/CTAs | Mobile menu inert isolation, keyboard wrap/Escape, technology keyboard tabs, service prefill and native validation checked; final motion visibility and Pause/Play states checked after the last JS change. |
| Console | No application errors/warnings returned in inspected final flows. This is not a guarantee for every browser. |
| `git diff --check` | PASS; line-ending normalization notices only. Git diff and the smaller entry-snapshot diffs reviewed. |
| Preservation | Service/About/FAQ content sources, navigation.js, SEO generator, config, robots, package scripts and existing structural tests unchanged. Contact-handler block byte-for-byte unchanged. All 15 titles/descriptions unchanged. |

Screenshots: `qa/phase3/screenshots/home-375.jpg` and `home-1440.jpg`, inspected for the retained charcoal/lime styling, typography, hero alignment and controls. The complete route viewport records are in `layouts-final.json`; metadata in `source-audit.json`/`rendered.json`. Final component scheduling is in `component-visibility-final.json`. No CSS/layout edits followed the 75-view pass; only homepage state/timer writes changed, followed by desktop/mobile interaction checks.

Real navigation evidence: `native-navigation-final.json` plus `settled-home-final.json`. One mobile Home sample was taken before smooth scrolling settled; the settled reading reached y=0. Earlier raw hash-navigation/in-flight samples are retained as diagnostics and are not silently counted as passes. Direct fragment entry was also checked with containment disabled. No working URLs were changed.

Visual review found no new clipping or overlap in the inspected states. Full screen-reader coverage, OS reduced-motion emulation, font failure, cross-browser certification and physical-device testing remain open. Source-reviewed reduced-motion and no-JS fallbacks are preserved.

## SEO, truthfulness and contact protection

Every failing **weighted Lighthouse SEO audit**, individually: **`is-crawlable` only**, on the homepage, Shopify and SEO service, in both device modes and all three final homepage samples. Cause: intentional preview `X-Robots-Tag: noindex, nofollow`. `seo-audits.json` includes each report and audit details. Different applicable audits explain the 66/63 category scores. The protection was not removed or discounted from reported scores.

Separate domain-dependent release omissions remain: no guessed canonicals, `og:url`, absolute OG/Twitter images, WebSite/Breadcrumb URL fields or sitemap. `robots.txt` is unchanged and does not advertise an absent sitemap. The guarded generator will produce the 13 approved canonical content URLs after an actual origin is supplied; Privacy/Terms stay excluded/noindex. The existing 1200×630 OG PNG loads locally, but external share fetches and final-domain schema/URLs are untested. Organization/Service/visible FAQ data remains truthful and locally valid; no ratings, invented address or new schema claims were added. Service/Organization markup is not a promise of a Google rich-result feature or FAQ rich snippets.

Demo projects retain explicit demo/not-commissioned labels and illustrative-data disclosures. No fictional client work, testimonials, performance figures, credentials, office/contact details or unsupported service pages were introduced. Approved copy and navigation are retained. Existing capability statements still need owner verification; no delivery credentials were independently proven by this pass.

**The contact form prepares an email draft; it does not automatically send.** Its existing `mailto:moiz21892@gmail.com`, recipient and empty `data-endpoint` remain intact. Native invalid-form feedback and service selection were checked. Prior draft payload evidence is retained in `qa/production-readiness/contact-form.json`; launching the external mail client was blocked by browser policy and was not bypassed. No automatic delivery or mailbox receipt is claimed. The future official business mailbox remains an owner decision. General e-commerce currently prefills Shopify as before; change to the neutral discussion option only after that categorization decision is confirmed.

Privacy and Terms remain pending/noindex. The only visible Privacy edit corrects the factual font notice to reflect local hosting; it creates no new legal promise. Terms legal body is unchanged. Neither is represented as an approved policy.

## Page-by-page status

`DONE` means checked local implementation, not production approval. Domain/hosting-dependent acceptance remains blocked for every page.

| Route | Status | Scope / outstanding work |
| --- | --- | --- |
| `/` | PARTIAL | Font/LCP/CLS and motion-label fixes checked; repeatable Performance/TBT and desktop regression unresolved. |
| `/services.html` | DONE | Shared local fonts, metadata, direct route and responsive checks. |
| `/services/ecommerce-development.html` | DONE | Same; existing inquiry categorization retained for owner decision. |
| `/services/shopify-development.html` | DONE | Mobile/desktop Lighthouse 99/100; local QA passed. |
| `/services/woocommerce-development.html` | DONE | Shared technical changes; route/responsive checks; no separate Lighthouse score claimed. |
| `/services/custom-software-development.html` | DONE | Same. |
| `/services/saas-development.html` | DONE | Same. |
| `/services/crm-integration.html` | DONE | Same. |
| `/services/digital-marketing.html` | DONE | Same. |
| `/services/seo-content-marketing.html` | PARTIAL | Local QA passed; mobile TBT 367ms and score reduction need stable-hardware recheck. |
| `/services/social-media-marketing.html` | DONE | Shared technical changes and local route/responsive checks. |
| `/about.html` | DONE | Approved copy preserved; shared technical checks. |
| `/faq.html` | DONE | Visible Q&A/schema preserved; shared technical checks. |
| `/privacy.html` | BLOCKED | Local font notice corrected; approved legal information still required. |
| `/terms.html` | BLOCKED | Approved legal content required; pending status retained. |

## Every implementation/document file changed in this phase

| File(s) | Change |
| --- | --- |
| `index.html` | Local font preloads, containment opt-in, motion button action text. |
| `styles.css` | Local font faces; progressive rendering/print fallback; decorative control glyphs. |
| `script.js` | Remove reveal geometry reads; preserve anchors; component visibility/timers and idempotent writes; matching accessible labels. |
| `serve.mjs` | Allow only the two new font assets and serve `font/woff2`; existing preview restrictions retained. |
| `scripts/build.mjs` | Preserve correct relative font preloads in generated child routes. |
| `tests/seo.test.mjs` | Add local font/preload/license validation and HTTP font assertions. |
| `services.html`, `about.html`, `faq.html` | Regenerated shared head only; content and metadata unchanged. |
| `services/ecommerce-development.html`, `services/shopify-development.html`, `services/woocommerce-development.html` | Same generated head update. |
| `services/custom-software-development.html`, `services/saas-development.html`, `services/crm-integration.html` | Same generated head update. |
| `services/digital-marketing.html`, `services/seo-content-marketing.html`, `services/social-media-marketing.html` | Same generated head update. |
| `privacy.html` | Local font/head changes and factual font notice correction; pending legal status retained. |
| `terms.html` | Local font/head changes; legal body unchanged. |
| `assets/fonts/plus-jakarta-sans-latin.woff2`, `assets/fonts/fira-code-latin.woff2` | Original licensed font bytes, self-hosted. |
| `assets/fonts/plus-jakarta-sans-OFL.txt`, `assets/fonts/fira-code-OFL.txt` | Original font license notices. |
| `README.md` | Local font/performance facts and current report link. |
| `docs/production-launch-checklist.md` | Updated fix status and remaining acceptance steps. |
| `docs/phase3-performance-report.md` | This report. |

Audit-generated `qa/seo/inventory.json` and `qa/seo/crawl.json` were refreshed by existing scripts; the final crawl was also copied to Phase 3 evidence. New `qa/phase3/` contains entry snapshots, raw traces/reports/screenshots, diagnostics, source/preservation records, `audit-source.mjs`, `control-preview.mjs` (loopback-only diagnostic), and `summarize.mjs` (report reduction). Do not upload this evidence directory. `measurements.json` lists all report paths; `changed-files.json` records final implementation hashes. Older production-readiness report/evidence remains historical and unchanged.

## Prioritized remaining acceptance and owner decisions

1. **P1 engineering, still open:** capture matched baseline/current traces on an idle calibrated machine and a representative phone. Keep default comparable throttling. Isolate the initial 558ms Layout and later layout invalidations without removing visible animations; verify the desktop and SEO-service reductions. Preserve all results, then run three homepage mobile samples again. Required evidence is Performance ≥90 and TBT ≤200ms where reasonably achievable, or a reviewed concrete remaining renderer limitation. Current evidence does not justify sign-off.
2. **P0 domain and hosting, owner-blocked:** purchase/confirm the actual HTTPS origin and preferred www/slash/locale policy. Then set only that confirmed `productionUrl` in `site.config.json`; run `npm run build:production`, `npm run check`, `npm run audit:seo` and the live crawl locally. Inspect every canonical, sharing URL, schema URL and the 13-entry sitemap. Review the chosen host's HTTPS/redirects, direct `.html` reloads, real 404s, private-file exclusion, compression and caching. Keep preview/staging noindex. Do not remove protection until the actual approved production host is confirmed and release is separately authorized.
3. **P0 legal, owner-blocked:** supply approved Privacy/Terms and legal identity/provider/data handling details. Keep pending status and noindex until approval. Recheck actual hosting/email disclosures after those providers are selected.
4. **P0 contact, owner-blocked:** purchase/confirm the official mailbox and intended draft-based versus automatic inquiry behavior. Preserve the existing address until confirmed. For drafts, test a real supported mail app and manual send. For automatic delivery, separately authorize/configure an HTTPS handler with server validation/spam controls and verify mailbox receipt before claiming delivery. Update legal disclosures accordingly.
5. **P1 QA:** physical-device, reduced-motion, screen-reader/focus, font fallback and intended-browser checks; repeat affected visual/routes/form tests after further fixes. Use the updated [launch checklist](production-launch-checklist.md).
6. **Release:** review the final diff and evidence; obtain explicit permission before merge/publish/deploy. After a separately authorized release, verify live URL/indexing/contact behavior and only then perform separately authorized Search Console setup/submission. No ranking guarantee or field CWV claim is made.

**NOT READY — REMAINING ISSUES.** The implemented changes are available for review, with existing SEO content, branding and contact behavior preserved. Performance targets and owner-dependent release requirements remain open.
