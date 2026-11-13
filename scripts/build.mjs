import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { services, faqs } from '../content/services.mjs';
import { homeMeta, hubMeta, aboutMeta, faqMeta, hubIntro, hubSections, hubOutro, aboutIntro, aboutSections } from '../content/pages.mjs';
import { escapeHTML as e, productionOrigin, applyMetadata } from './seo.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const origin = productionOrigin(config.productionUrl);
if (process.argv.includes('--production') && !origin) throw new Error('Production build blocked: supply the owner-confirmed productionUrl in site.config.json. Nothing was written.');
const read = file => readFile(path.join(root, file), 'utf8');
const write = (file, text) => writeFile(path.join(root, file), text + '\n');
let home = await read('index.html');
const head = home.match(/<head>[\s\S]*?<\/head>/)[0].replace(/\s*<!-- seo:begin -->[\s\S]*?<!-- seo:end -->/g, '').replace('<script src="script.js" defer></script>', '<script src="navigation.js" defer></script>');
const baseHeader = home.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
const baseFooter = home.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
const iconDefinitions = home.match(/<svg class="icon-definitions"[\s\S]*?<\/svg>/)[0];
const lookup = slug => services.find(service => service.slug === slug);
const serviceLink = (slug, prefix = '') => `<a href="${prefix}services/${slug}.html">${e(lookup(slug).name)}</a>`;
const paras = texts => texts.map(text => `<p>${e(text)}</p>`).join('\n');
const faqList = (prefix, heading = 'h3') => `<div class="faq-list">${faqs.map((faq, index) => `<details class="faq-item" name="questions"${index === 0 ? ' open' : ''}><summary><${heading}>${e(faq.question)}</${heading}><span class="detail-plus" aria-hidden="true">+</span></summary><div class="faq-answer"><p>${e(faq.answer)}</p><a class="detail-link" href="${prefix}${faq.slug ? `services/${faq.slug}.html` : faq.href}">${e(faq.label)} ↗</a></div></details>`).join('\n')}</div>`;
const crumbs = (items, prefix) => `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map(([name, route], index) => `<li>${index === items.length - 1 ? `<span aria-current="page">${e(name)}</span>` : `<a href="${route === '/' ? prefix + 'index.html' : prefix + route.slice(1)}">${e(name)}</a>`}</li>`).join('')}</ol></nav>`;
function pageHTML(page, content, prefix = '') {
  const header = baseHeader.replace(/(<a\b[^>]*href=")#/g, `$1${prefix}index.html#`).replaceAll(`href="${prefix}index.html#about"`, `href="${prefix}about.html"`).replaceAll(`href="${prefix}index.html#capabilities"`, `href="${prefix}services.html"`);
  const footer = baseFooter.replace(/(<a\b[^>]*href=")#/g, `$1${prefix}index.html#`).replace(/href="(?!https?:|mailto:|#)([^\"]+\.html(?:#[^\"]*)?)"/g, (match, url) => url.startsWith(prefix) && prefix ? match : `href="${prefix}${url}"`);
const html = `<!DOCTYPE html>\n<html lang="en">\n${head.replaceAll('href="assets/fonts/', `href="${prefix}assets/fonts/`).replace('href="styles.css"', `href="${prefix}styles.css"`).replace('src="navigation.js"', `src="${prefix}navigation.js"`)}\n<body>${iconDefinitions}<a class="skip-link" href="#main">Skip to content</a>\n${header}\n<main id="main" tabindex="-1" class="content-page container">${crumbs(page.crumbs, prefix)}<div class="eyebrow">CODETOSCALE / ${page.service ? 'SERVICES' : 'EXPLORE'}</div><h1>${e(page.h1)}</h1>${content}</main>\n${footer}\n</body></html>`;
  return applyMetadata(html, page, origin);
}
const pages = [{ route: '/', ...homeMeta }];
const hub = { route: '/services.html', ...hubMeta, crumbs: [['Home', '/'], ['Services', '/services.html']] };
await write('services.html', pageHTML(hub, `<p class="page-intro">${e(hubIntro)}</p><div class="service-categories hub-categories">${hubSections.map(([title, text, slugs]) => `<section class="service-category"><h2>${e(title)}</h2><p>${e(text)}</p><ul class="content-links">${slugs.map(slug => `<li>${serviceLink(slug)}</li>`).join('')}</ul></section>`).join('')}</div><section class="reading-content"><h2>A clear project conversation</h2><p>${e(hubOutro)}</p></section><div class="page-actions"><a class="button" href="index.html#contact">Discuss your project ↗</a></div>`));
pages.push(hub);
await mkdir(path.join(root, 'services'), { recursive: true });
for (const service of services) {
  const page = { ...service, route: `/services/${service.slug}.html`, service, crumbs: [['Home', '/'], ['Services', '/services.html'], [service.name, `/services/${service.slug}.html`]] };
  const content = `<p class="page-intro">${e(service.intro)}</p><div class="page-actions"><a class="button" href="../index.html?service=${encodeURIComponent(service.inquiry)}#contact">Discuss your project ↗</a></div><div class="reading-content">${service.sections.map(([title, ...texts]) => `<section><h2>${e(title)}</h2>${paras(texts)}</section>`).join('\n')}<section><h2>A useful question</h2><h3>${e(service.question)}</h3><p>${e(service.answer)}</p></section><aside class="related-services" aria-label="Related services"><h2>Explore related services</h2><ul class="content-links">${service.related.map(slug => `<li>${serviceLink(slug, '../')}</li>`).join('')}</ul><a href="../services.html">View all services ↗</a></aside><div class="page-actions"><a class="button" href="../index.html?service=${encodeURIComponent(service.inquiry)}#contact">Send a project brief ↗</a><a class="text-button" href="../faq.html">Project questions ↗</a></div></div>`;
  await write(`services/${service.slug}.html`, pageHTML(page, content, '../'));
  pages.push(page);
}
const about = { route: '/about.html', ...aboutMeta, crumbs: [['Home', '/'], ['About', '/about.html']] };
await write('about.html', pageHTML(about, `<p class="page-intro">${e(aboutIntro)}</p><div class="reading-content">${aboutSections.map(([title, ...texts]) => `<section><h2>${e(title)}</h2>${paras(texts)}</section>`).join('')}<ul class="content-links"><li><a href="services.html">Explore our services</a></li><li><a href="index.html#workflow">See our working process</a></li><li><a href="index.html#projects">View the labeled concept studies</a></li></ul><div class="page-actions"><a class="button" href="index.html#contact">Contact our team ↗</a></div></div>`));
pages.push(about);
const faq = { route: '/faq.html', ...faqMeta, faqs, crumbs: [['Home', '/'], ['FAQ', '/faq.html']] };
await write('faq.html', pageHTML(faq, `<p class="page-intro">A starting point for discussing platforms, scope, support and the decisions that shape a project. Specific commitments belong in your agreed project scope.</p><section class="reading-content" aria-label="Project questions">${faqList('', 'h2')}</section><div class="page-actions"><a class="button" href="index.html#contact">Ask our team ↗</a><a href="services.html">Explore all services ↗</a></div>`));
pages.push(faq);
// Keep the homepage FAQ and published FAQ schema on the same editorial source.
home = home.replace(/(<section class="section faq"[\s\S]*?)<div class="faq-list">[\s\S]*?(\n\s*<\/div>\n\s*<\/section>)/, `$1${faqList('')}$2`);
const detailTargets = ['shopify-development', 'woocommerce-development', 'ecommerce-development', 'ecommerce-development', 'ecommerce-development', 'ecommerce-development', 'ecommerce-development', 'ecommerce-development', 'custom-software-development', 'custom-software-development', 'crm-integration', 'custom-software-development', 'custom-software-development', 'custom-software-development', 'custom-software-development', 'custom-software-development'];
let detailIndex = 0;
home = home.replace(/<details class="service-detail"[\s\S]*?<\/details>/g, block => {
  const slug = detailTargets[detailIndex++];
  return block.replace(/\s*<a class="service-page-link"[\s\S]*?<\/a>/g, '')
    .replace(/Learn more \/ discuss your needs/g, 'Discuss your needs')
    .replace('</p>', `</p>\n                    <a class="service-page-link" href="services/${slug}.html">Explore ${e(lookup(slug).name.toLowerCase())} ↗</a>`);
});
home = applyMetadata(home, pages[0], origin);
await write('index.html', home.trimEnd());
for (const file of ['privacy.html', 'terms.html']) {
  const html = await read(file);
  // Preserve the original legal metadata as text. Reading it back from generated
  // HTML would repeatedly encode the ampersand in the Terms title.
  const legal = file === 'privacy.html'
    ? { title: 'Privacy notice | CodeToScale', description: 'How the CodeToScale website prepares inquiry email drafts, loads locally hosted fonts and identifies privacy information awaiting owner review.' }
    : { title: 'Terms & conditions | CodeToScale', description: 'CodeToScale terms publication status and project agreement information.' };
  await write(file, applyMetadata(html, { route: `/${file}`, ...legal }, origin).trimEnd());
}
await write('robots.txt', `# Local preview additionally sends X-Robots-Tag: noindex.\nUser-agent: *\nAllow: /\n${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : '# Sitemap withheld until the production origin is confirmed.\n'}`);
if (origin) {
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>${e(origin + page.route)}</loc></url>`).join('')}</urlset>`);
} else {
  // This single known generated file is safe to remove; never emit guessed URLs.
  await rm(path.join(root, 'sitemap.xml'), { force: true });
}
await mkdir(path.join(root, 'qa/seo'), { recursive: true });
await write('qa/seo/route-manifest.json', JSON.stringify(pages.map(({ route, title, description, h1 }) => ({ route, title, description, h1 })), null, 2));
console.log(`Generated ${pages.length} public content pages; legal content preserved. ${origin ? 'Production URL metadata and sitemap generated.' : 'LOCAL REVIEW: production URL missing; canonical URLs and sitemap withheld.'}`);
