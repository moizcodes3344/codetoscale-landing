# CodeToScale website

A responsive, static corporate website built on the original HTML, CSS, and vanilla JavaScript architecture. A dependency-free Node generator now prepares the service pages and SEO metadata. There is no framework, application backend, or third-party JavaScript dependency. Generated HTML is included for local review.

## Run

Install Node.js 20 or newer, then run from this directory:

```sh
npm run dev
```

Open the URL printed by the server (default http://127.0.0.1:4173). The preview is loopback-only and returns `X-Robots-Tag: noindex, nofollow`. To choose another port in PowerShell:

```powershell
$env:PORT = '4186'
npm run dev
```

Stop the server with Ctrl+C. `npm install` is unnecessary: there are no dependencies. You can also open `index.html` directly, though a local HTTP server more closely resembles production hosting.

## Check

```sh
npm run check
```

The checks validate JavaScript syntax, HTML nesting, unique IDs, local links, image assets and dimensions, metadata, service-to-form mappings, complete section coverage, honest demo labels, and reduced-motion support. They do not replace real browser testing.

Latest SEO work: [implementation report](docs/seo-implementation-report.md), [keyword map](docs/seo-keyword-map.md), and [editorial roadmap](docs/seo-blog-roadmap.md). The earlier [QA-AUDIT.md](QA-AUDIT.md) describes the pre-SEO work and is retained as historical evidence. Current evidence is in `qa/seo/`.

After editing `content/services.mjs`, `content/pages.mjs`, the homepage or shared styling, run `npm run build`, then `npm run check`. `npm run audit:seo` writes a source inventory. For a live HTTP crawl, set `PREVIEW_URL` to the running server's printed loopback URL and run `node scripts/crawl.mjs`. The HTTP checks require permission for loopback networking in restricted environments. There is no separate lint or typecheck script.

Manual browser checks:

- At 1440, 1024, 768, 425, and 375px widths, check navigation, hero, cards, project mockups, form, and footer for clipping or horizontal overflow.
- Open and close the mobile menu. Check Escape, the Tab/Shift+Tab focus loop, and selecting an anchor.
- Use every navigation and CTA link. Service shortcuts should select the matching inquiry service.
- Test the four technology tabs with click, arrow keys, Home, and End. The mobile tabs use left/right; desktop uses up/down.
- Expand service details, both project concepts, and all FAQ questions with mouse and keyboard.
- Toggle the hero's Pause/Play control. Enable the operating system's reduced-motion setting and confirm that animated entrances and smooth scrolling stop.
- Complete an invalid form and verify native validation. Complete a valid form using test details and check the generated email draft without sending it.
- Check privacy and terms pages, browser console errors, network requests, and contrast in the deployment browser. Use Lighthouse for a measured performance/accessibility assessment.

Browser QA was completed using the in-app browser. Generated email-draft content was verified, but browser security blocked launching a mail client. Reduced-motion behavior was reviewed in source without emulating the OS preference. The [Phase 4 investigation](docs/phase4-performance-report.md) records five mobile/desktop Lighthouse runs per representative page, trace attribution and remaining measurement limitations; the [Phase 3 report](docs/phase3-performance-report.md) is historical evidence. Physical-device and cross-browser certification are not claimed. Raw evidence is in `qa/`.

## Content and architecture

- `index.html`: hero, About, six capability cards, 16 service disclosures in two categories, accessible technology explorer, benefits, six process steps, two labeled portfolio concepts, seven FAQs, final CTA, inquiry form, footer. Unsupported statistics and social-link placeholders have been removed.
- `services.html`, `services/*.html`, `about.html`, `faq.html`: generated static content pages using shared branding, navigation, footer, breadcrumbs and contextual links.
- `content/`: editable service, FAQ, hub and About copy. The homepage FAQ and FAQ schema share one source.
- `scripts/build.mjs`, `scripts/seo.mjs`: static generation and centralized SEO. `site.config.json` intentionally has no production URL until the owner confirms it.
- `navigation.js`: keyboard-accessible shared navigation for the new content pages. The homepage retains its original script and richer interactions.
- `styles.css`: shared tokens, typography, components, responsive breakpoints, focus styles, motion, and print styles.
- `script.js`: existing menu, keyboard tab controls, service prefills, illustrative runtime, email draft/HTTPS delivery, plus progressive scroll reveals and motion controls.
- `assets/commerce-concept.svg`, `assets/software-concept.svg`: original local vector interface studies. They are fictional examples, not working products or client case studies.
- `privacy.html`: factual implementation notice with owner-specific information still required.
- `terms.html`: explicitly labeled terms publication placeholder.
- `serve.mjs`: loopback-only development server; only public website files are served.
- `tests/site.test.mjs`: dependency-free structural regression checks.

## Contact integration

The original address, `moiz21892@gmail.com`, is preserved. With `data-endpoint=""` on `#project-form`, the form prepares a prefilled `mailto:` draft. **The visitor must review and send the email in their mail app. The site does not send it automatically.** A retry link remains visible in case no mail client opens. No inquiry is stored by the website in this mode.

To enable direct delivery, supply an HTTPS JSON handler and set `data-endpoint` on the form. It receives `name`, `email`, `service`, `budget`, and `message` in a POST body and must return a successful HTTP status only after accepting the inquiry. A third-party handler must allow your deployed origin via CORS. Implement server-side validation, rate limiting, and suitable spam controls; the client-side honeypot is not a substitute. The UI handles success, non-2xx responses, connection failures, and a 15-second timeout.

Update the privacy notice when enabling delivery. Never place API credentials in frontend files. The direct-delivery path is preserved but has no configured backend and was not tested against a real provider.

## Owner information still needed

1. Confirm service scope and the existing email address. Platforms displayed in the toolkit come from the original site's service descriptions; no new stack expertise is implied.
2. Provide approved company biography, legal identity, location if public, and genuine social profile URLs.
3. Verified company figures are optional; the unsupported statistics section is now unpublished.
4. Provide real project details, approved screenshots, and publication permissions. Both concepts are intentionally labeled as demos.
5. Supply genuine testimonials and permission to publish them. Testimonials were omitted instead of fabricated.
6. Provide approved terms and complete privacy details, including jurisdiction, retention, hosting, and email handling. The terms placeholder is not a production agreement.
7. Supply the preferred HTTPS production origin, including the chosen www/non-www host. Put that confirmed origin in `site.config.json`, then run `npm run build:production` locally to generate canonicals, sharing image URLs, sitemap references, WebSite and breadcrumb URL data. This command does not deploy. It currently stops before writing because the domain is unknown. Preserve existing `.html` URLs; configure the production host's `/index.html` to `/` redirect separately after its policy is confirmed. The legal information pages remain `noindex, follow` while incomplete.
8. Optionally provide an inquiry backend as described above.

## Motion and performance

CSS handles staggered hero entrances, subtle finite floating elements, orbit movement, button feedback, navigation underlines, project-image transitions, and disclosure entrances. A single shared IntersectionObserver reveals sections and cards once with short stagger delays. The hero's Pause/Play control pauses decorative motion and logs. Offscreen/background animations and logs are paused; reduced-motion preferences are respected at load and when changed.

The project previews are local SVGs with reserved aspect ratios and lazy loading. Icons are a shared inline SVG symbol set. No animation library, image CDN, analytics, or tracking was added. The existing Plus Jakarta Sans and Fira Code fonts are now bundled in `assets/fonts/`, with their original SIL OFL licenses, and preloaded from the website's own host. There are no external font requests. Long offscreen sections use progressive `content-visibility` rendering; their HTML, anchors, focus navigation and reveal animations remain available, with normal rendering in unsupported browsers and print. See `docs/phase3-performance-report.md` for measurements and verification limits.

## Deployment

No deployment is authorized in this task. After owner review and domain/legal decisions, the eventual public file set is `index.html`, `services.html`, `services/*.html`, `about.html`, `faq.html`, reviewed legal pages, `styles.css`, `script.js`, `navigation.js`, `robots.txt`, the generated production `sitemap.xml`, and `assets/`. Keep relative paths and `.html` slugs. Do not upload source scripts, config, docs, tests or `qa/`. Keep staging noindex through hosting headers; remove staging-only protection only on the approved production host. See the report's rollout checklist. This work has not published or changed any hosting integration.
