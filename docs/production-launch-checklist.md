# Prioritized production launch checklist

Verdict as of 13 November 2026: **NOT READY**. See the [Phase 4 investigation and five-run results](phase4-performance-report.md). The [Phase 3 report](phase3-performance-report.md) and [earlier QA report](production-readiness-qa.md) are retained as historical evidence. Nothing has been deployed, published or merged.

## P0 — Owner decisions before release preparation

- [ ] **Confirm the real production HTTPS origin**, including www/non-www preference and any existing locale/path policy. Keep `productionUrl: null` in `site.config.json` until confirmed. Then set that property to the actual origin string, without a path, query, credentials or port. Never use a sample or preview hostname as production metadata.
- [ ] **Supply and approve legal content**: legal entity, applicable jurisdiction, privacy contact, hosting/email handling, retention and any other required provisions. Replace the existing pending content only with approved material. Keep legal pages noindex and excluded from the sitemap until their approval status is explicitly changed.
- [ ] **Approve service scope and public contact details**. Confirm the existing recipient email, the new descriptions based on the supplied strategy, support boundaries and commercial process. Keep testimonials, statistics, partner badges, office/address details and client case studies unpublished unless verified and authorized.
- [ ] **Purchase/confirm the official business mailbox and choose contact behavior**. Keep the existing recipient and disclosed manual email draft until confirmed, or explicitly authorize a real submission integration. Automatic delivery is not currently configured or verified.

## P1 — Targeted engineering and validation before sign-off

- [ ] Complete independent mobile performance validation on stable hardware. Phase 4 kept application code unchanged: mobile scores 71/86/77/83/87 (median 83), median LCP 1.355s, TBT 679ms, CLS 0.01204. Native text shaping/layout, Chrome content extraction and host/browser waiting are measured costs. Use a pinned standalone audit environment, record whether browser extraction runs, and retain a code change only after matched timing and visual evidence. Do not remove approved text, typography or animations to game scores.
- [x] Investigate whether the desktop decline persists. Five unchanged-code desktop scores are 81/100/100/100/88 (median 100, TBT 38ms); a fixed decline to 78 was not reproduced. Both service controls have five-run medians of 100 on both devices. This completes the reproducibility investigation, not mobile/production sign-off; slow outliers and host variability remain documented.
- [x] Self-host/preload the original licensed fonts and remove the remote font waterfall. Final homepage cold-load triplet CLS is 0/0/0 and LCP 1.35–1.36s. Font failure/fallback and physical-device checks remain in the QA item below.
- [x] Align visible Play/Pause and accessible action names with decorative CSS glyphs. Both states work; the Lighthouse label diagnostic passes in every selected final report. Full assistive-technology coverage remains open.
- [ ] Test mobile reduced-motion behavior, font failure/fallback, focus visibility, the contact flow and menu on a physical phone and intended desktop browsers. Automated Accessibility 100 is not full conformance evidence.
- [ ] After entering the confirmed origin, run the following locally. These commands **do not deploy**:

```powershell
npm run build:production
npm run check
npm run audit:seo
npm run dev
```

- [ ] In another terminal, set `PREVIEW_URL` to the URL actually printed by that server and run `node scripts/crawl.mjs`. Verify the generated sitemap contains exactly the 13 current canonical content URLs, excludes noindex legal pages and matches every self-canonical. Add any later-approved pages only after rechecking the route list.
- [ ] Inspect each generated canonical, `og:url`, absolute OG/Twitter image URL and WebSite/BreadcrumbList item. Verify the real sharing PNG returns 200 with the correct content type, dimensions and preview. Revalidate final schema with Schema.org/Google tooling as appropriate; do not promise FAQ or Service rich results.
- [ ] Prepare the **approved host configuration** for review: HTTPS and preferred-host redirect, `/index.html` → `/` preserving query parameters, unchanged `.html` service routes, real 404s and direct reloads. Reuse any established slash/locale policy rather than creating a guessed one.
- [ ] Review compression, caching, asset headers and HTTPS/security behavior on the actual staging host. The loopback server uses `no-store` and does not prove CDN performance. Preserve staging noindex; never remove it solely to improve an audit score.
- [ ] Verify public content indexability on the actual approved production host at launch: no staging-only noindex header or public-page block. Privacy/Terms remain noindex until approved. `robots.txt` must reference only the real, live sitemap.
- [ ] Confirm the release file allowlist. Publish only approved generated HTML, scripts/styles, assets, robots and generated sitemap. **Exclude** `.git`, source/config, `docs/`, `qa/`, tests, package metadata and preview server files from static hosting.

## Contact-specific acceptance

- [ ] For manual drafts: approve the email address and wording, test a real supported mail app, verify body encoding and explain that the visitor must send. A draft or frontend toast is not evidence of delivery.
- [ ] For automatic sending, if separately authorized: configure an HTTPS endpoint without client-side secrets; add server validation, rate limiting/spam controls and suitable CORS. Update approved privacy disclosures. Test valid delivery, malformed input, rejection, timeout, retry and mailbox receipt using owner-approved test recipients. Record actual receipt before claiming automatic email delivery.
- [ ] Decide whether the general e-commerce CTA should retain Shopify categorization or select the existing neutral discussion option.

## P2 — Follow-up and launch authorization

- [ ] Reassess compression/minification and unused-CSS opportunities after the primary homepage issue is profiled. Avoid broad styling changes for small score gains.
- [ ] Keep the blog as an unpublished roadmap until researched copy, real author/date and approval are available. Do not turn demo concepts into client evidence.
- [ ] Review final diff, checks, real-host screenshots and Lighthouse reports. Require a clean acceptance record for the agreed release scope; preserve unrelated working changes.
- [ ] **Obtain explicit approval before deployment, publishing or merging.** This checklist and the prior SEO implementation do not provide that approval.
- [ ] After separately authorized deployment, verify live routes, contact behavior, canonical/redirects, sharing images, robots, sitemap and public indexability. Confirm private source/QA paths are unavailable.
- [ ] With separate authorization, verify the real Search Console property, submit the real sitemap and monitor coverage and real-user CWV/INP as data becomes available. Do not promise rankings or infer field CWV from lab scores.

Release sign-off requires the owner decisions, targeted fixes and real-host checks above. None of the unchecked items is considered complete merely because the local build passes.
