# CodeToScale quality assurance audit

Audit date: 11 November 2026 (Asia/Karachi).

The existing HTML/CSS/JavaScript site was audited and repaired in place. All sections, service offerings, original contact address, service tabs, disclosures, and contact delivery options were preserved. The charcoal-and-lime identity remains intact. No dependencies were installed and no hosting or production settings were changed.

## Scope and method

All three pages (`index.html`, `privacy.html`, and `terms.html`) were opened in the Codex in-app browser through the local HTTP preview. Each was rendered at 1440, 1024, 768, 425, and 375 CSS pixels wide, with a 1000px viewport height. The work included browser screenshots, rendered element measurements, real pointer and keyboard interactions, console inspection, source review, and automated checks. These are browser viewport tests, not tests on physical phones or a cross-browser certification.

Evidence:

- `qa/layouts.json`: final measurements for all 15 page/width combinations.
- `qa/browser-results.json`: interaction coverage and explicit test limitations.
- `qa/skip-navigation.json`: keyboard focus results for every page.
- `qa/contrast.json`: eight rendered text/background contrast samples.
- `qa/screenshots/`: full-page captures at every requested width, plus focused desktop and mobile evidence.

## Issues discovered and fixes

| # | Issue | Fix and verification |
| --- | --- | --- |
| 1 | The hero's first phrase unexpectedly occupied two lines on desktop and tablet, creating four headline lines. | Adjusted the existing responsive font sizes and tracking. Browser measurements confirm one line per hero span at all five widths. |
| 2 | Content-heavy capability and process cards were cramped in two columns at 375/425px, with very small technology labels. | Switched capability, benefit, and process grids to one column at 450px and below; increased body, title, and tag readability. Inspected the phone section captures and checked rendered overflow. |
| 3 | The 425px form still used narrow paired inputs, unlike the 375px layout. | Kept form rows in one column at 450px and below. Final browser measurements show full-width fields at both phone widths. |
| 4 | Pausing motion, dismissing notifications, and several footer links had unnecessarily small interaction areas. | Enlarged the hero pause and footer targets to at least 32px and the toast close button to 44px. Preserved their appearance, labels, and actions. |
| 5 | The open mobile navigation trapped Tab focus but left the obscured page available to assistive navigation. | Made main content, footer, skip link, and other header links inert while the menu is open. Browser checks confirmed isolation, focus wrapping, and restoration after closing or resizing to desktop. Previous inert states are preserved. |
| 6 | Whitespace-only form errors did not identify the invalid fields or move focus to a correction target. | Added native custom validity, `aria-invalid`, error styling, descriptions, a message-length hint, and first-invalid-field focus. Tested whitespace-only, empty, invalid-email, and short-message cases in the browser. |
| 7 | Correcting an invalid form could leave a stale red error message visible. | Clear obsolete feedback when marked field errors have been corrected. Browser retest confirmed no invalid fields, no stale `aria-invalid`, and hidden/empty feedback after valid editing. |
| 8 | The inquiry form lacked a named form landmark. | Added the accessible name “Project inquiry”; verified it in the browser accessibility snapshot. |
| 9 | Side-by-side service-category headings and footer links became uneven when tablet text wrapped. | Reserved matching heading space at the tablet breakpoint and used the existing cards as flex columns. At 768px both headings measured 58px high and both category footer links ended at the same document position. |
| 10 | Project concept tags and disclosure buttons sat at different heights when descriptions wrapped differently. | Made existing project cards flex columns and allowed their description area to fill remaining space. Closed project disclosure tops match at 1440, 1024, and 768px. Phone projects remain intentionally stacked. |
| 11 | Privacy and terms social descriptions repeated the homepage pitch. | Made Open Graph and Twitter descriptions match each supporting page's own meta description. Verified in the browser at every width. Existing unique titles and draft-page `noindex, follow` directives were preserved. |
| 12 | Browser theme and favicon colors used older color values rather than the current palette. | Synchronized their values with the existing charcoal background and lime accent on all pages. |
| 13 | The skip link scrolled to the main content but left keyboard focus on the body. | Added `tabindex="-1"` to each main destination. Browser retests confirm `#main` receives focus on all three pages. |

No sections or working interactions were removed. The changes to layout are responsive and alignment corrections, not a rebuild.

## Responsive results

The browser reserves a 15px vertical scrollbar. Therefore its content width is 15px smaller than the requested CSS viewport width. `scrollWidth` equaled `clientWidth` for every tested page, so there was no document-level horizontal scrolling.

| Viewport | Content width | Home scroll width | Privacy scroll width | Terms scroll width |
| ---: | ---: | ---: | ---: | ---: |
| 1440 | 1425 | 1425 | 1425 | 1425 |
| 1024 | 1009 | 1009 | 1009 | 1009 |
| 768 | 753 | 753 | 753 | 753 |
| 425 | 410 | 410 | 410 | 410 |
| 375 | 360 | 360 | 360 | 360 |

The final homepage DOM scans also found no visible content protruding beyond the content viewport. All reveal targets had become visible during scroll coverage. Images loaded successfully when their lazy-loading region was reached.

## Functional browser results

| Area | Actual verification |
| --- | --- |
| Navigation and CTAs | 41 header, mobile-menu, footer, and CTA activations; destinations confirmed. One immediate hash assertion was rechecked successfully after navigation settled. |
| Service/project shortcuts | 28 capability, service-detail, project, and module links; matching contact-service prefills and anchor destinations confirmed. |
| Supporting pages | Seven cross-page routes exercised, including footer policy links, return-home links, and links to the inquiry section. |
| Service tabs | All four modules activated; title, panel association, CTA, and service updated. Horizontal ArrowRight/Home and desktop ArrowDown/Home keyboard behavior checked. |
| Mobile menu | Open, close, Escape, Shift+Tab wrapping, Tab wrapping, selecting an anchor, focus handoff, background isolation, and desktop-resize cleanup exercised. |
| Service disclosures | All 16 opened/closed with pointer and Enter-key interactions. |
| FAQs | All seven expanded; the single-open accordion behavior was observed. |
| Project concepts | Both disclosure controls opened and their inquiry links selected the correct service. These remain labeled concepts, not live client products. |
| Form validation | Empty required fields, malformed email, whitespace-only name/message, short message, first-error focus, error descriptions, correction recovery, and removal of stale feedback tested. |
| Email draft | Valid test data produced the correct recipient, encoded subject, and CRLF-separated encoded body, including special characters. The retry link and retained form values were inspected directly in the browser. No email was sent. |
| Motion | Hero pause/resume changed animation play state correctly. Decorative motion paused when the hero moved offscreen. Scroll reveals appeared during browsing. |
| Skip navigation | Main-content focus confirmed on all three pages after the fix. |
| Console | No application warnings or JavaScript errors were returned by the browser console log inspection during the tested flows. |

Several pointer commands raced ongoing smooth scrolling or encountered browser-control timeouts. Their resulting state was inspected; affected internal links were retested using keyboard activation and URL waits. Those automation errors are not reported as application console errors or evidence of broken links. The long capture run that timed out was repeated in bounded calls, and the final 15-entry measurement file was saved successfully.

## SEO, accessibility, and performance review

- Each page has a unique title, a meaningful meta description, one primary heading, an English language declaration, and viewport metadata. The heading hierarchy and semantic sections were reviewed.
- Both concept images have descriptive alt text, explicit 1000×680 dimensions, lazy loading, and asynchronous decoding. They are local SVGs totaling approximately 10.7 KiB. Browser observations confirmed they were deferred before the portfolio region and loaded once reached.
- Internal links and SVG references resolve. Draft legal pages remain excluded from indexing until owner information is supplied.
- Eight rendered text contrast samples ranged from 7.15:1 to 17.32:1, above 4.5:1 for those sampled pairs. This is a sample check, not a claim that every state or every decorative label has been certified.
- Keyboard focus indicators, native disclosure semantics, tab state/association, menu focus isolation, form labels, and accessible ID references were checked. Three regression checks were added for accessible ID references, bringing the suite from 13 to 16 tests.
- Reduced-motion handling exists in both CSS and JavaScript. It removes CSS animations/transitions and smooth scrolling, reveals content, and defaults simulated logs to paused. This implementation was reviewed in source; the operating-system preference was **not toggled or emulated** in this browser session.
- No framework, animation library, image CDN, or tracking dependency was added. Motion primarily changes transforms/opacity and uses observers instead of continuous scroll handlers. Existing background/offscreen pausing was observed.
- Google Fonts remains an external presentation dependency. No Lighthouse score, throttled-network measurement, LCP/CLS/INP score, or production Core Web Vitals result is claimed.

## Remaining issues and verification limits

1. **Mail-app handoff:** Browser security blocked launching the `mailto:` URL. Draft generation is verified; opening a configured email client and delivery are not. The user must send the draft in their own client. No workaround or external send was attempted.
2. **Direct form delivery:** No HTTPS inquiry backend is configured. The existing optional integration remains available but has not been tested against a real provider. The UI honestly states that it prepares an email.
3. **Legal content:** Terms are an explicit publication placeholder; privacy information still needs the owner's legal identity, jurisdiction, retention, hosting, and provider details. Neither page should be treated as approved production legal text.
4. **Company evidence:** Statistics, social profiles, and genuine case studies still need verified owner content. Testimonials remain omitted rather than fabricated. Existing placeholder sections were preserved as requested.
5. **Production SEO:** The production domain is unknown, so canonical URLs, `og:url`, and a domain-specific sitemap remain unset. They must be completed when the real domain is supplied.
6. **Coverage:** Reduced-motion preference emulation, physical devices, other browser engines, screen-reader operation, zoom testing, and a measured production performance audit remain outside the verified browser results above.

No unresolved broken layout, application console error, or dead internal navigation link was reproduced in the tested viewport matrix and flows. This does not waive the remaining owner information or coverage limits.

## Files changed in this audit

- `index.html`: accessible inquiry form name/descriptions/hint, focusable skip destination, palette metadata.
- `styles.css`: hero sizing, phone grids and form rows, card alignment, target sizes, validation styles.
- `script.js`: mobile-menu background isolation and accessible form validation/recovery.
- `privacy.html`, `terms.html`: supporting-page metadata, palette metadata, focusable skip destinations.
- `tests/site.test.mjs`: accessible reference checks for all three pages.
- `README.md`: current audit results and instructions.
- `QA-AUDIT.md` and `qa/`: report, JSON evidence, and browser screenshots.

## Re-run

```sh
npm run check
npm run dev
```

Open http://127.0.0.1:4173. If that port is occupied, set `PORT` to another value before starting the server. No installation or build step is required. The audit preview used port 4186 and was stopped after verification.

Final automated result: **16 passed, 0 failed**, including all 13 original checks. JavaScript syntax validation and `git diff --check` also passed.
