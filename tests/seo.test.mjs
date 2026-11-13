import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { services, faqs } from '../content/services.mjs';
import { applyMetadata, jsonLD, productionOrigin, seoBlock } from '../scripts/seo.mjs';
import { createPreviewServer } from '../serve.mjs';

const files = ['index.html', 'services.html', 'about.html', 'faq.html', 'privacy.html', 'terms.html', ...services.map(s => `services/${s.slug}.html`)];
const docs = await Promise.all(files.map(file => readFile(new URL('../' + file, import.meta.url), 'utf8')));
const config = JSON.parse(await readFile(new URL('../site.config.json', import.meta.url), 'utf8'));

test('Local font preloads resolve to licensed WOFF2 assets on every page', async () => {
  for (const [index, html] of docs.entries()) {
    assert.doesNotMatch(html, /<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/);
    const preloads = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin>/g)];
    assert.equal(preloads.length, 2, files[index]);
    for (const [, href] of preloads) {
      const font = await readFile(new URL(href, new URL('../' + files[index], import.meta.url)));
      assert.equal(font.subarray(0, 4).toString(), 'wOF2');
    }
  }
  for (const license of ['plus-jakarta-sans-OFL.txt', 'fira-code-OFL.txt']) assert.match(await readFile(new URL('../assets/fonts/' + license, import.meta.url), 'utf8'), /SIL OPEN FONT LICENSE/);
});

test('Every public page has unique static metadata and no duplicated SEO tags', () => {
  for (const pattern of [/<title>(.*?)<\/title>/g, /<meta name="description" content="([^"]+)"/g]) {
    const values = docs.map(html => { const matches = [...html.matchAll(pattern)]; assert.equal(matches.length, 1); return matches[0][1]; });
    assert.equal(new Set(values).size, values.length);
  }
  docs.forEach((html, index) => {
    assert.doesNotMatch(html, /name="keywords"|yourdomain\.com|\[Client [AB]\]|AggregateRating|"@type":"Review"/);
    assert.doesNotMatch(html, /&amp;amp;/, 'Metadata must not be repeatedly HTML-encoded');
    assert.equal((html.match(/<meta property="og:title"/g) || []).length, 1);
    assert.equal((html.match(/<meta name="twitter:title"/g) || []).length, 1);
    assert.equal((html.match(/<meta charset=/g) || []).length, 1);
    assert.equal((html.match(/<meta name="viewport"/g) || []).length, 1);
    for (const [, href] of html.matchAll(/<use href="([^"]+)"/g)) assert.ok(href.startsWith('#'), 'Inline icons must use same-document symbols');
    if (!['privacy.html', 'terms.html'].includes(files[index])) assert.doesNotMatch(html, /<meta name="robots" content="noindex/);
    else assert.match(html, /<meta name="robots" content="noindex, follow">/);
    if (!config.productionUrl) assert.doesNotMatch(html, /rel="canonical"|property="og:url"/);
    for (const [, data] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.equal(JSON.parse(data)['@context'], 'https://schema.org');
  });
});

test('Service pages describe distinct offerings with truthful Service schema and complete links', () => {
  for (const service of services) {
    const html = docs[files.indexOf(`services/${service.slug}.html`)];
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const entity = graph.find(n => n['@type'] === 'Service');
    assert.equal(entity.serviceType, service.name);
    assert.equal(entity.description, service.intro);
    assert.equal(entity.provider.name, 'CodeToScale');
    assert.match(html, /<nav class="breadcrumbs" aria-label="Breadcrumb">/);
    assert.match(html, /href="\.\.\/services\.html"/);
    assert.match(html, /href="\.\.\/index\.html\?service=[^"]+#contact"/);
    assert.ok(docs[0].includes(`<option>${service.inquiry.replaceAll('&', '&amp;')}</option>`) || docs[0].includes(`<option>${service.inquiry}</option>`), 'CTA service must match an existing form option');
    const words = [service.intro, ...service.sections.flat(), service.question, service.answer].join(' ').split(/\s+/).length;
    assert.ok(words >= 400 && words <= 650, `${service.slug}: ${words} useful words`);
  }
});

test('Visible FAQ content and schema agree exactly; homepage uses the same questions', () => {
  const html = docs[files.indexOf('faq.html')];
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const schema = graph.find(n => n['@type'] === 'FAQPage');
  assert.equal(schema.mainEntity.length, 7);
  for (const [index, faq] of faqs.entries()) {
    assert.equal(schema.mainEntity[index].name, faq.question);
    assert.equal(schema.mainEntity[index].acceptedAnswer.text, faq.answer);
    assert.ok(html.includes(faq.question));
    assert.ok(docs[0].includes(faq.question));
  }
});

test('Production metadata is generated from an explicit origin and remains idempotent', () => {
  // Reserved test origin is only passed in memory; never written into website output.
  const origin = 'https://owner-confirmed.test';
  const page = { route: '/services/shopify-development.html', title: 'Shopify & stores', description: 'A useful description for a real store.', service: services[1], crumbs: [['Home', '/'], ['Services', '/services.html'], ['Shopify development', '/services/shopify-development.html']] };
  const source = '<head><title>Original</title><meta name="description" content="Original"><meta property="og:title" content="Original"><meta property="og:description" content="Original"></head>';
  const result = applyMetadata(source, page, origin);
  assert.equal(applyMetadata(result, page, origin), result);
  assert.match(result, /rel="canonical" href="https:\/\/owner-confirmed\.test\/services\/shopify-development\.html"/);
  const graph = JSON.parse(seoBlock(page, origin).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const trail = graph.find(n => n['@type'] === 'BreadcrumbList').itemListElement;
  assert.equal(trail.length, 3);
  assert.equal(trail.at(-1).item, origin + page.route);
  assert.equal(productionOrigin(null), null);
  for (const bad of ['http://company.com', 'https://yourdomain.com', 'https://example.com', 'https://localhost', 'https://127.0.0.1', 'https://company.com/subpath', 'https://company.com/?token=value']) assert.throws(() => productionOrigin(bad));
  assert.doesNotMatch(jsonLD({ text: '</script><script>alert(1)</script>' }), /<script>alert/);
});

test('Loopback preview serves every public page and blocks source, test and config files', async () => {
  const server = createPreviewServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const file of files) {
      const response = await fetch(base + '/' + (file === 'index.html' ? '' : file));
      assert.equal(response.status, 200, file);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.match(await response.text(), /<h1\b/);
    }
    for (const file of ['.git/config', 'site.config.json', 'docs/seo-keyword-map.md', 'qa/seo/baseline/index.html', 'content/services.mjs', 'package.json']) assert.equal((await fetch(`${base}/${file}`)).status, 404);
    const redirect = await fetch(base + '/index.html?service=Custom%20Software%20Development', { redirect: 'manual' });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), '/?service=Custom%20Software%20Development');
    assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/%E0%A4%A')).status, 400);
    assert.equal((await fetch(base + '/robots.txt')).status, 200);
    for (const font of ['plus-jakarta-sans-latin.woff2', 'fira-code-latin.woff2']) {
      const response = await fetch(base + '/assets/fonts/' + font);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'font/woff2');
      assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 4).toString(), 'wOF2');
    }
    if (!config.productionUrl) {
      assert.equal((await fetch(base + '/sitemap.xml')).status, 404);
      await assert.rejects(access(new URL('../sitemap.xml', import.meta.url)));
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
