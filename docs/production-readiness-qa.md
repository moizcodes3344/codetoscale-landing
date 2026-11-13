# Final production-readiness QA

**Verdict: NOT READY for production. Local review is ready; nothing was deployed, published, merged or committed.**

Date: 12 November 2026, Asia/Karachi. Branch: `codex/seo-executive-summary`. This is a fresh QA pass following the SEO implementation, not a redevelopment. Product HTML/CSS/JavaScript, content, contact destinations and legal copy were not edited. Only this report, the launch checklist and `qa/production-readiness/` evidence were added. The existing generator was run; 29 application files were hash-checked afterward and remained unchanged through QA. Earlier uncommitted work remains intact.

## Release blockers and findings

| Priority | Finding | Evidence / required resolution |
| --- | --- | --- |
| P0 | Preferred production domain is unconfirmed | `site.config.json` still contains `productionUrl: null`. No self-canonicals, absolute OG image URLs, WebSite/breadcrumb URL data or sitemap are emitted. The production build correctly refuses to write. Owner must confirm the actual HTTPS origin, preferred host and existing host routing policy. |
| P0 | Privacy and Terms are not approved production policies | Both pages remain `noindex, follow` and explicitly pending. Terms still contains publication instructions. Owner-approved legal identity, jurisdiction, data handling/retention and hosting/email-provider disclosures are required. No replacement legal wording was fabricated. |
| P1 | Mobile homepage has a repeatable lab performance problem | Lighthouse Performance 52 and 53; LCP 3.29/3.61s; TBT 3,485/3,382ms. Both runs warned that the host CPU is slower than expected. Investigate on a representative mobile device and calibrated lab environment before sign-off. Do not dismiss the results or claim a field CWV pass. |
| P1 | Font-related homepage layout shift | First mobile run CLS 0.143, attributed by Lighthouse to the Plus Jakarta Sans font loading and moving `.hero-visual`; repeat CLS 0.036. Review font fallback metrics/loading and reserve a stable hero layout while preserving the design. Confirm with cold-load measurements after any fix. |
| P1 | Motion-control visible label and accessible name disagree | Lighthouse `label-content-name-mismatch` identifies `.log-toggle` (`PAUSE Ⅱ` versus the longer aria-label). The source also changes visible text to PLAY while its accessible name begins Resume. Align the spoken and visible action labels and hide decorative glyphs from the accessible name in a separate targeted fix. Accessibility score 100 does not erase this diagnostic. |
| P1 | Production hosting behavior remains unverified | The local server uses a public-file allowlist, correct static paths and `Cache-Control: no-store`; no real CDN, HTTPS redirects, compression, cache policy or response headers are configured here. Validate those on the approved host, including correct removal of staging noindex only for approved production pages. |
| P2 | General e-commerce inquiry is categorized as Shopify | Its primary CTA works but preselects Shopify because the existing form has no generic e-commerce option. Consider mapping it to the existing neutral discussion option, or approve the current lead categorization. No change was made in this QA-only pass. |
| P2 | Optional delivery expectations need owner confirmation | Current form creates an email draft; there is no configured submission endpoint. This is accurately disclosed. Retain this behavior unless the owner wants and authorizes a separately tested delivery integration. |

No design or performance fixes were applied during this QA request. The findings are concrete follow-up work, not claims of completed remediation. The [prioritized launch checklist](production-launch-checklist.md) gives exact finalization steps and acceptance evidence.

## Build, scripts and Git review

| Check | Fresh result |
| --- | --- |
| `git branch --show-current` | `codex/seo-executive-summary` |
| `git status --short` | Existing modified `index.html`, `script.js`, `styles.css` plus existing untracked site/content/docs/assets/tests retained. No reset/stash/merge/commit/push. |
| `git diff`, `git diff --numstat` | Reviewed the existing homepage, scripts and styling changes. Diff against the initial commit includes earlier work; it is not the change set for this QA pass. The three tracked file counts remained 1136/97, 91/6 and 865/19 added/deleted lines. |
| `npm run build` | PASS: 13 content pages regenerated, visible legal copy retained; domain-dependent output withheld. |
| `npm run check` | PASS: **69/69**, including JS syntax, all-page structure/links, metadata, schema/FAQ agreement, service form options, real HTTP routes, redirect and private-file rejection. |
| Lint / typecheck | No separate lint or typecheck scripts exist. The real `check` script is used; no invented script is claimed. |
| `npm run audit:seo` | PASS: all 15 pages inventoried. |
| `node qa/production-readiness/audit-source.mjs` | PASS: 15 unique titles/descriptions, one H1 each, truthfulness/form/config/asset checks recorded. |
| `npm run build:production` equivalent guard | EXPECTED BLOCK: missing production origin; **zero page writes**. Full stderr and exit 1 captured in `source-audit.json`. |
| Live crawl | PASS: **15 pages, 83 unique local targets, 25 HTTP requests, zero errors**. |
| `git diff --check` | PASS; Git reports LF/CRLF normalization notices, not whitespace failures. |
| Source preservation | PASS: 29 application-file hashes unchanged after the audit snapshot; `source-preservation.json`. |

Node 24.18.0 ran the existing project scripts. Lighthouse 13.6.0 was downloaded into npm's tool cache with approval; no project dependency, lockfile or package script was added or changed. The audit uses installed headless Chrome 157.0.0.0 with isolated profiles, not the user's signed-in tabs.

## Measured Lighthouse results

Actual target: **http://127.0.0.1:4173**, printed by the existing `npm run dev` server. The prebuilt static HTML and assets were served directly, without a framework development overlay or SPA fallback. The local preview retained `X-Robots-Tag: noindex, nofollow`; that protection was not disabled to increase scores. This reproduces static route behavior, not unconfigured production hosting/CDN performance.

| Page | Mode | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Desktop | 94 | 100 | 100 | 66 | 0.86s | 1.18s | 121ms | 0.00049 |
| `/` | Mobile, first | 52 | 100 | 100 | 66 | 2.07s | 3.29s | 3,485ms | 0.14251 |
| `/` | Mobile, repeat | 53 | 100 | 100 | 66 | 2.65s | 3.61s | 3,382ms | 0.03591 |
| `/services/shopify-development.html` | Desktop | 99 | 100 | 100 | 63 | 0.78s | 0.78s | 0ms | 0.01909 |
| `/services/shopify-development.html` | Mobile | 99 | 100 | 100 | 63 | 1.77s | 1.77s | 0ms | 0 |
| `/services/seo-content-marketing.html` | Desktop | 99 | 100 | 100 | 63 | 0.78s | 0.78s | 0ms | 0.00247 |
| `/services/seo-content-marketing.html` | Mobile | 99 | 100 | 100 | 63 | 1.77s | 1.77s | 0ms | 0 |

All seven reports completed with exit 0 and no Lighthouse runtime error. Each has raw JSON and standalone HTML under `qa/production-readiness/lighthouse/`; `lighthouse-summary.json` includes exact numeric values, environment, warnings and failed-audit details. Values above are rounded from raw numeric metrics, rather than substituted estimated improvements.

Mobile used Lighthouse's default simulated 412×823 viewport, 150ms RTT, 1638.4Kbps throughput and 4× CPU slowdown. Desktop used `--preset=desktop`. Slow-host-CPU warnings appeared on both homepage mobile runs and Shopify mobile. The repeat was run after browser interaction work ended; neither result was discarded. This is a small lab sample, not a median-of-many benchmark or physical-phone measurement.

The only failed weighted SEO audit in each report was **`is-crawlable`**, caused by the intentional preview response header. Differing applicable audit sets account for differing 63/66 scores. These are the actual staging scores, not adjusted production predictions. Missing production canonicals/absolute sharing URLs are separate release blockers even where Lighthouse does not penalize them.

Homepage trace review: roughly 8s main-thread work in the first mobile run, including 3.57s Style & Layout and 3.85s Other; script evaluation was about 123ms. The largest tasks were document/unattributable work. This does not justify blaming a large JavaScript bundle or rewriting the site. Profile font swaps, hero rendering and layout/reveal read-write work before choosing a focused fix. Compression/minification and unused-CSS diagnostics are secondary follow-up items for the actual hosting/build pipeline.

LCP and CLS here are **lab observations**. TBT is a lab responsiveness diagnostic, **not INP**. Field INP and a real-user CWV assessment are unavailable without a confirmed live property and sufficient traffic. No field CWV pass, ranking outcome or production score is claimed. For interpretation, see [Lighthouse scoring guidance](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) and the [official CLI documentation](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md).

Reproduction from the repository after starting the actual preview (use its printed URL if the port differs):

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm exec --yes --package=lighthouse@13.6.0 -- lighthouse http://127.0.0.1:4173/ --output=json --output=html --output-path=qa/production-readiness/lighthouse/home-mobile --chrome-flags="--headless=new --no-first-run --disable-extensions" --only-categories=performance,accessibility,best-practices,seo --max-wait-for-load=45000 --quiet
```

For desktop add `--preset=desktop`; change the local path and output filename for the two service pages. Existing report files should be copied or given new output names before rerunning so this evidence is retained. No sample production domain is needed or permitted.

## Route, layout and interaction QA

All 15 public HTML URLs were directly opened and explicitly reloaded in the real browser: home, services, About, FAQ, Privacy, Terms and all nine individual services. All loaded the expected title, one H1 and initial HTML copy. All 15 were checked at **375, 425, 768, 1024 and 1440px**, height 1000px: **75 combinations, no document-level horizontal overflow**. `layouts.json` and `rendered.json` record this fresh pass. The browser reserves scrollbar width; client widths therefore differ from viewport widths. No overflow-hiding change was made.

The live crawl verified internal destinations, fragments, scripts/styles, inline symbols and image URLs. The existing Node suite also checked GET/HEAD behavior, `/index.html` → `/` query preservation, unknown/private/config/test paths returning 404, invalid encoding returning 400, and unsupported POST returning 405. These are preview-server results; production host redirects and exclusion of source/QA files still need verification.

Fresh manual/browser checks:

- Mobile menus on home, hub, Shopify, About and FAQ opened, isolated the background with inert, wrapped Shift+Tab and closed on Escape with focus restored. Desktop resize cleared the open-menu state, scroll lock and main inert state.
- Skip-to-main focused the main landmark. Technology tabs updated all four panels; ArrowDown and Home keyboard handling were exercised.
- All 16 native service disclosures were toggled (two initially open closed; 14 opened), both concept disclosures opened, and all seven FAQs were exercised with single-open behavior. Hero Pause changed its pressed state.
- All nine detailed-service primary CTAs were activated in the browser and reached the existing contact form, retaining the query through the home redirect and selecting the expected option.
- Both concept images loaded at natural width 1000 with their descriptive demo alts. A project-section screenshot records the visible demo disclaimer. The 1200×630, 35,202-byte OG PNG was inspected and is not cropped or falsely attributed to client work.
- No application console warnings/errors were returned across the inspected flows. Mail-client launch policy rejection is recorded separately below; it is not described as a successful launch.

Screenshots: desktop/mobile captures for home, hub, Shopify, About and FAQ; project disclaimer capture; Lighthouse final screenshots. Browser viewport screenshots can retain scroll position; full-page content captures and the Lighthouse homepage final screenshots provide top-of-page context. Evidence is under `qa/production-readiness/screenshots/`.

Accessibility scores are automated results for the audited load states, not WCAG certification. Reduced-motion CSS/JS was reviewed; OS preference emulation, full screen-reader testing, physical mobile devices and cross-browser certification were not performed. The label mismatch remains open despite the 100 automated category score.

## Contact form: separate conclusion

**Current behavior: prepares an email draft. It does not automatically send or store a submission.**

The form retains `action="mailto:moiz21892@gmail.com"`, `data-email="moiz21892@gmail.com"` and `data-endpoint=""`. JavaScript constructs an encoded `mailto:` URL and a visible retry link. No configured HTTPS endpoint, server handler or successful automatic-delivery test exists.

Empty required fields failed native validation and focused name. Whitespace-only name/message produced custom errors and marked those two fields invalid. After valid dummy QA values, the page generated the expected recipient, subject, service, budget and CRLF-separated body, correctly encoding `&`. Fields were retained and the feedback explained that sending must be completed in the visitor's email application.

The browser security policy **blocked launching the email client**. That blocked action was not retried or bypassed. Read-only inspection of the already-generated draft link verified the payload. No email was sent, no recipient mailbox delivery was tested, and no real provider integration is implied. Full evidence: `contact-form.json`.

If the owner keeps draft-based inquiries, confirm the recipient and approve the manual-send wording, then test a genuine mail client on supported devices. If automatic submission is wanted, treat the endpoint, server validation/spam controls, provider disclosure and delivered-mail testing as a separately authorized integration; a frontend success message alone is not proof of delivery.

## Metadata, schema, legal and content integrity

Fresh source and rendered inspection found 15 unique static titles, 15 unique descriptions and one H1 per page, without duplicate head tags or broken internal URLs. Descriptions, Open Graph and Twitter text describe the page. JSON-LD parsed successfully; all nine Service descriptions/providers match their source content, and FAQ questions/answers exactly match the seven visible entries. Organization facts use the existing brand/email. There are no fabricated Review/AggregateRating/Offer/address/phone/credential fields.

Canonical and indexability state is intentionally incomplete:

- Production origin remains null, so **zero guessed canonicals or absolute OG URLs** were generated. The sharing image itself exists and loads, but a live sharing-card fetch is untested until a real origin is supplied.
- Public content source HTML has no noindex meta. The local preview applies `X-Robots-Tag: noindex, nofollow` to all served files. Privacy/Terms additionally retain their own noindex meta.
- `robots.txt` allows crawling and does not reference a nonexistent sitemap. `sitemap.xml` is absent while the origin is unknown. Inspection of the generator confirms that, after origin confirmation, it emits the 13 canonical content URLs and excludes the two noindex legal pages. Actual domain-based sitemap, canonical, WebSite and BreadcrumbList output must be checked after configuration; no placeholder-output test was introduced in this pass.
- Local schema tests passed. The earlier implementation's external Schema.org result is historical evidence; it was not represented as a fresh external validator run. Revalidate the final domain-dependent output after configuration. No Google rich-result eligibility or appearance is promised.

Content audit retained the original two concepts with explicit **demo / not commissioned** labels, including illustrative data disclaimers. No fictional testimonials, quantified company results, founding history, physical address, certification or partner badge was found presented as fact. Named technology/tool capability statements match the existing repository/owner-provided strategy; delivery expertise itself still needs owner sign-off and was not independently proven by this QA. Magento, mobile app delivery, standalone email/SMS marketing and fictional case studies remain unpublished. The country references describe target audiences rather than an invented office. Existing inquiry budget ranges are not service price quotes.

Privacy and Terms remain pending. No legal language, jurisdiction or data-retention commitment was invented. Their current noindex status is not a substitute for obtaining approved content before presenting them as finished policies.

## Evidence and scope limits

New evidence directory: `qa/production-readiness/` contains 7 Lighthouse JSON reports and 7 standalone HTML reports, combined metrics/diagnostics, source/metadata inventory, hashes/preservation check, fresh crawl, 75 layout measurements, rendered heads, keyboard/control results, contact-form evidence and screenshots. No raw Lighthouse report was uploaded or published.

Remaining unverified items: actual production host/domain/redirects/cache/compression/security headers; final absolute sharing URLs and sitemap; domain-dependent rich data; approved legal content; real mail-client behavior and mailbox receipt; field CWV/INP; physical-phone and full assistive-technology behavior. These remain open, not silently counted as passes.

**NOT READY for production.** The implementation is preserved and reviewable. Resolve P0 decisions and P1 findings, rerun the affected measurements, then obtain explicit deployment authorization. This QA pass does not authorize publishing, deploying or merging.
