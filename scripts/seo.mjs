export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export const jsonLD = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')}</script>`;

export function productionOrigin(value) {
  if (value === null || value === undefined || value === '') return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.port || !url.hostname.includes('.') || /(^|\.)(localhost|example\.(com|org|net)|invalid|test)$/.test(url.hostname) || /^\d+(\.\d+){3}$/.test(url.hostname) || /yourdomain|placeholder/i.test(url.hostname)) {
    throw new Error('productionUrl must be the owner-confirmed HTTPS production origin, without a path, query, credentials or port.');
  }
  return url.origin;
}

export function seoBlock(page, origin) {
  const organization = { '@type': 'Organization', name: 'CodeToScale', email: 'moiz21892@gmail.com', ...(origin ? { '@id': `${origin}/#organization`, url: `${origin}/` } : {}) };
  const graph = [];
  if (page.route === '/') {
    graph.push(organization);
    if (origin) graph.push({ '@type': 'WebSite', '@id': `${origin}/#website`, name: 'CodeToScale', url: `${origin}/`, publisher: { '@id': `${origin}/#organization` } });
  }
  if (page.service) graph.push({ '@type': 'Service', name: page.service.name, serviceType: page.service.name, description: page.service.intro, provider: organization, ...(origin ? { url: origin + page.route, '@id': origin + page.route + '#service' } : {}) });
  if (page.faqs) graph.push({ '@type': 'FAQPage', mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) });
  if (origin && page.crumbs) graph.push({ '@type': 'BreadcrumbList', itemListElement: page.crumbs.map(([name, route], index) => ({ '@type': 'ListItem', position: index + 1, name, item: origin + route })) });
  return `<!-- seo:begin -->
    ${origin ? `<link rel="canonical" href="${escapeHTML(origin + page.route)}">\n    <meta property="og:url" content="${escapeHTML(origin + page.route)}">\n    <meta property="og:image" content="${origin}/assets/social-card.png">\n    <meta name="twitter:image" content="${origin}/assets/social-card.png">` : '<!-- Production origin unconfigured: canonical, sharing URLs and sitemap withheld. -->'}
    <meta property="og:site_name" content="CodeToScale">
    ${origin ? '<meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">\n    <meta property="og:image:alt" content="CodeToScale: E-commerce and custom software agency">\n    <meta name="twitter:image:alt" content="CodeToScale: E-commerce and custom software agency">' : ''}
    ${graph.length ? jsonLD({ '@context': 'https://schema.org', '@graph': graph }) : ''}
    <!-- seo:end -->`;
}

export function applyMetadata(html, page, origin) {
  return html.replace(/\s*<!-- seo:begin -->[\s\S]*?<!-- seo:end -->/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHTML(page.title)}</title>`)
    .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)/g, `$1${escapeHTML(page.description)}$2`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(">)/g, `$1${escapeHTML(page.title)}$2`)
    .replace(/\s*<\/head>/, `\n    ${seoBlock(page, origin)}\n  </head>`)
    .replace(/[ \t]+$/gm, '');
}
