import { readFile, writeFile } from 'node:fs/promises';
import { services } from '../content/services.mjs';
const baseline = process.argv.includes('--baseline');
const prefix = baseline ? 'qa/seo/baseline/' : '';
const files = baseline ? ['index.html', 'privacy.html', 'terms.html'] : ['index.html', 'services.html', ...services.map(s => `services/${s.slug}.html`), 'about.html', 'faq.html', 'privacy.html', 'terms.html'];
const text = html => html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const inventory = [];
for (const file of files) {
  const html = await readFile(prefix + file, 'utf8');
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || html;
  inventory.push({
    route: file === 'index.html' ? '/' : '/' + file,
    title: html.match(/<title>(.*?)<\/title>/)?.[1],
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1],
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m => text(m[1])),
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || null,
    robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || 'index, follow (default; preview HTTP header overrides)',
    mainWordCount: text(main).split(/\s+/).length,
    internalLinks: [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]).filter(href => !/^(https?:|mailto:)/.test(href)),
    jsonLD: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])),
    images: [...html.matchAll(/<img\b[^>]*>/g)].map(m => ({ src: m[0].match(/src="([^"]+)"/)?.[1], alt: m[0].match(/alt="([^"]*)"/)?.[1] }))
  });
}
await writeFile(`qa/seo/${baseline ? 'baseline/' : ''}inventory.json`, JSON.stringify(inventory, null, 2) + '\n');
console.log(inventory.map(p => `${p.route}: ${p.mainWordCount} main-content words; ${p.h1.length} H1; ${p.internalLinks.length} internal links; canonical ${p.canonical || 'PENDING DOMAIN'}`).join('\n'));
