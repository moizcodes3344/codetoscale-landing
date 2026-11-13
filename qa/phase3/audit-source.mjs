// Read-only release audit. Writes evidence here, never production URLs or pages.
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { services, faqs } from '../../content/services.mjs';

const files = ['index.html', 'services.html', 'about.html', 'faq.html', 'privacy.html', 'terms.html', ...services.map(s => `services/${s.slug}.html`)];
const text = html => html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const rows = [];
const hashes = {};
for (const file of files) {
  const html = await readFile(file, 'utf8');
  hashes[file] = createHash('sha256').update(html).digest('hex');
  rows.push({
    file,
    title: html.match(/<title>(.*?)<\/title>/)?.[1],
    titleCount: [...html.matchAll(/<title>/g)].length,
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1],
    descriptionCount: [...html.matchAll(/<meta name="description"/g)].length,
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m => text(m[1])),
    canonical: [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map(m => m[1]),
    robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || 'index, follow (default)',
    og: Object.fromEntries([...html.matchAll(/<meta property="(og:[^"]+)" content="([^"]*)"/g)].map(m => [m[1], m[2]])),
    twitter: Object.fromEntries([...html.matchAll(/<meta name="(twitter:[^"]+)" content="([^"]*)"/g)].map(m => [m[1], m[2]])),
    schema: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])),
    emptyLinks: [...html.matchAll(/href="(?:#|)"/g)].length,
    imageCount: [...html.matchAll(/<img\b/g)].length,
    imagesMissingAlt: [...html.matchAll(/<img\b[^>]*>/g)].filter(m => !/alt="[^"]*"/.test(m[0])).length
  });
}
for (const file of ['styles.css', 'script.js', 'navigation.js', 'content/services.mjs', 'content/pages.mjs', 'scripts/build.mjs', 'scripts/seo.mjs', 'site.config.json', 'robots.txt', 'serve.mjs', 'package.json', 'README.md', 'tests/site.test.mjs', 'tests/seo.test.mjs']) hashes[file] = createHash('sha256').update(await readFile(file)).digest('hex');
const config = JSON.parse(await readFile('site.config.json', 'utf8'));
const home = await readFile('index.html', 'utf8');
const png = await readFile('assets/social-card.png');
// Only exercise the non-writing rejection branch. A configured production build
// would mutate generated output and must be run separately, intentionally.
const productionBuild = config.productionUrl
  ? { status: null, stderr: 'Skipped: production origin is configured; this read-only audit does not regenerate production output.' }
  : spawnSync(process.execPath, ['scripts/build.mjs', '--production'], { encoding: 'utf8', windowsHide: true });
const changedByGuard = [];
for (const file of files) if (hashes[file] !== createHash('sha256').update(await readFile(file)).digest('hex')) changedByGuard.push(file);
const result = {
  files: rows,
  productionUrl: config.productionUrl,
  sitemapExists: await stat('sitemap.xml').then(() => true, () => false),
  robots: await readFile('robots.txt', 'utf8'),
  productionGuard: { exit: productionBuild.status, stderr: productionBuild.stderr, changedPages: changedByGuard },
  ogAsset: { path: 'assets/social-card.png', bytes: png.length, width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
  form: { endpoint: home.match(/data-endpoint="([^"]*)"/)?.[1], email: home.match(/data-email="([^"]*)"/)?.[1], action: home.match(/<form\b[^>]*action="([^"]*)"/)?.[1], fields: ['name', 'email', 'service', 'budget', 'message'], automaticDeliveryConfigured: Boolean(home.match(/data-endpoint="([^"]*)"/)?.[1]?.trim()) },
  disclosures: { serviceCount: [...home.matchAll(/class="service-detail"/g)].length, conceptCount: [...home.matchAll(/class="project-detail"/g)].length, faqCount: faqs.length, demoLabelPresent: home.includes('These are demos, not commissioned client projects'), metricsPlaceholdersPresent: /Verified figure coming soon|metrics-section/.test(home) }
};
await writeFile('qa/phase3/source-audit.json', JSON.stringify(result, null, 2) + '\n');
await writeFile('qa/phase3/application-hashes.json', JSON.stringify(hashes, null, 2) + '\n');
console.log(JSON.stringify({ pages: rows.length, uniqueTitles: new Set(rows.map(r => r.title)).size, uniqueDescriptions: new Set(rows.map(r => r.description)).size, h1Errors: rows.filter(r => r.h1.length !== 1).map(r => r.file), productionUrl: result.productionUrl, productionGuard: { exit: productionBuild.status, changedPages: changedByGuard }, sitemapExists: result.sitemapExists, ogAsset: result.ogAsset, form: result.form, disclosures: result.disclosures }, null, 2));
