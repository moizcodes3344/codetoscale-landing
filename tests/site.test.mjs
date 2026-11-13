import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { services } from '../content/services.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['index.html', 'services.html', 'about.html', 'faq.html', 'privacy.html', 'terms.html', ...services.map(service => `services/${service.slug}.html`)];
const documents = new Map(await Promise.all(pages.map(async file => [file, await readFile(path.join(root, file), 'utf8')])));
const home = documents.get('index.html');

for (const [file, html] of documents) {
  test(`${file}: unique IDs, descriptive metadata, and one primary heading`, () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'Duplicate element IDs');
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<title>[^<]{15,90}<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{40,200}">/);
    assert.match(html, /<meta name="viewport"/);
  });

  test(`${file}: HTML elements are correctly nested`, () => {
    const source = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const stack = [];
    for (const match of source.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
      const [tag, closing, name] = match;
      const lower = name.toLowerCase();
      if (voidTags.has(lower) || tag.endsWith('/>')) continue;
      if (closing) assert.equal(stack.pop(), lower, `Unexpected closing ${tag}`);
      else stack.push(lower);
    }
    assert.deepEqual(stack, [], 'Unclosed elements');
  });

  test(`${file}: local links, symbols, and assets resolve`, async () => {
    for (const [, target] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|data:)/.test(target)) continue;
      assert.notEqual(target, '#', 'Empty link');
      const url = new URL(target, `https://local.test/${file}`);
      const pathname = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
      const fragment = url.hash.slice(1);
      const targetPage = documents.get(pathname);
      if (fragment) assert.ok(targetPage?.includes(`id="${fragment}"`), `Missing target: ${target}`);
      if (pathname) assert.ok((await stat(path.join(root, pathname))).isFile(), `Missing file: ${target}`);
    }
  });

  test(`${file}: accessible names and descriptions reference existing elements`, () => {
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const [, targets] of html.matchAll(/\b(?:aria-labelledby|aria-describedby|aria-controls|for)="([^"]+)"/g)) {
      for (const target of targets.split(/\s+/)) assert.ok(ids.has(target), `Missing accessible reference: ${target}`);
    }
  });
}

test('All expected sections and complete service categories are present', () => {
  for (const id of ['home', 'about', 'capabilities', 'services', 'ecommerce', 'software', 'technology', 'advantages', 'workflow', 'projects', 'faq', 'contact']) {
    assert.ok(home.includes(`id="${id}"`), `Missing section ${id}`);
  }
  assert.equal((home.match(/class="service-detail"/g) || []).length, 16);
  assert.equal((home.match(/class="faq-item"/g) || []).length, 7);
  assert.equal((home.match(/class="workflow-step(?: step-highlight)?"/g) || []).length, 6);
});

test('Service shortcuts map to existing contact form choices', () => {
  const decode = value => value.replaceAll('&amp;', '&');
  const options = [...home.matchAll(/<option(?:\s[^>]*)?>([^<]+)<\/option>/g)].map(match => decode(match[1]));
  for (const [, service] of home.matchAll(/data-service="([^"]+)"/g)) assert.ok(options.includes(decode(service)), `Missing service option: ${service}`);
  for (const [, labelTarget] of home.matchAll(/<label for="([^"]+)"/g)) assert.ok(home.includes(`id="${labelTarget}"`));
  assert.match(home, /data-endpoint=""/);
  assert.match(home, /Opens a prefilled email/);
});

test('Concepts are clearly labeled; unsupported statistics stay unpublished; images reserve their space', () => {
  assert.match(home, /These are demos, not commissioned client projects/);
  assert.doesNotMatch(home, /Verified figure coming soon|Social profiles: awaiting|metrics-section/);
  assert.doesNotMatch(home, /50<span>\+|99\.9|0% Bottlenecks|Infinite Scalability|24\/7 Monitoring/);
  for (const [image] of home.matchAll(/<img\b[^>]+>/g)) {
    assert.match(image, /alt="[^"]{20,}"/);
    assert.match(image, /width="\d+"/);
    assert.match(image, /height="\d+"/);
    assert.match(image, /loading="lazy"/);
  }
});

test('Motion and accessibility enhancements preserve fallback content', async () => {
  const css = await readFile(path.join(root, 'styles.css'), 'utf8');
  const js = await readFile(path.join(root, 'script.js'), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.reveal-pending \{ opacity: 1 !important/);
  assert.match(home, /class="skip-link"/);
  assert.match(home, /aria-controls="mobile-menu"/);
  assert.match(js, /hero motion and simulated runtime logs/);
  assert.match(js, /if \(!endpoint\)/);
  assert.match(js, /response\.ok/);
  assert.match(js, /AbortController/);
  assert.match(js, /event\.key === 'Escape'/);
});
