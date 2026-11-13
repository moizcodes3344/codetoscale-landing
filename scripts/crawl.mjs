import { readFile, writeFile } from 'node:fs/promises';
import { services } from '../content/services.mjs';
const base = process.env.PREVIEW_URL;
if (!base || !/^http:\/\/127\.0\.0\.1:\d+\/?$/.test(base)) throw new Error('Set PREVIEW_URL to the running loopback preview URL.');
const routes = ['/', '/services.html', '/about.html', '/faq.html', '/privacy.html', '/terms.html', ...services.map(s => `/services/${s.slug}.html`)];
const responses = new Map();
const targets = new Set();
const errors = [];
const summary = [];
async function get(url) {
  const key = url.origin + url.pathname + url.search;
  if (!responses.has(key)) {
    const response = await fetch(key);
    responses.set(key, { status: response.status, type: response.headers.get('content-type'), robots: response.headers.get('x-robots-tag'), text: await response.text() });
  }
  return responses.get(key);
}
for (const route of routes) {
  const url = new URL(route, base);
  const result = await get(url);
  if (result.status !== 200) errors.push(`${route}: HTTP ${result.status}`);
  const title = [...result.text.matchAll(/<title>(.*?)<\/title>/g)];
  const description = [...result.text.matchAll(/<meta name="description" content="([^"]+)"/g)];
  const h1 = [...result.text.matchAll(/<h1\b/g)];
  if (title.length !== 1 || description.length !== 1 || h1.length !== 1) errors.push(`${route}: metadata/H1 count mismatch`);
  summary.push({ route, status: result.status, title: title[0]?.[1], description: description[0]?.[1], h1Count: h1.length, previewRobots: result.robots });
  for (const [, target] of result.text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const link = new URL(target.replaceAll('&amp;', '&'), url);
    if (link.origin !== url.origin) continue;
    targets.add(link.href);
  }
}
for (const target of targets) {
  const url = new URL(target);
  const result = await get(url);
  if (result.status !== 200) errors.push(`${target}: HTTP ${result.status}`);
  if (url.hash && result.type?.includes('html') && !result.text.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) errors.push(`${target}: missing fragment`);
}
const config = JSON.parse(await readFile('site.config.json', 'utf8'));
if (config.productionUrl) {
  const sitemap = await get(new URL('/sitemap.xml', base));
  const expected = routes.filter(r => !['/privacy.html', '/terms.html'].includes(r)).map(r => config.productionUrl.replace(/\/$/, '') + r);
  const found = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (sitemap.status !== 200 || [...new Set([...expected, ...found])].length !== expected.length || found.length !== expected.length) errors.push('Sitemap routes do not match public canonical routes');
}
const result = { pages: summary.length, uniqueLocalTargets: targets.size, requests: responses.size, errors, summary, sitemap: config.productionUrl ? 'checked' : 'withheld: production domain unconfirmed' };
await writeFile('qa/seo/crawl.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ pages: result.pages, uniqueLocalTargets: result.uniqueLocalTargets, requests: result.requests, errors, sitemap: result.sitemap }, null, 2));
if (errors.length) process.exitCode = 1;
