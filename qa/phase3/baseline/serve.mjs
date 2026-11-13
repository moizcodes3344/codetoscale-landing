import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { services } from './content/services.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const allowed = new Set(['index.html', 'services.html', 'about.html', 'faq.html', 'privacy.html', 'terms.html', 'styles.css', 'script.js', 'navigation.js', 'robots.txt', 'sitemap.xml', 'assets/commerce-concept.svg', 'assets/software-concept.svg', 'assets/social-card.png', ...services.map(service => `services/${service.slug}.html`)]);

export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/index.html') {
        const search = new URL(request.url, 'http://localhost').search;
        response.writeHead(301, { Location: '/' + search }).end();
        return;
      }
      const file = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!allowed.has(file)) {
        response.writeHead(404).end('Not found');
        return;
      }
      const content = await readFile(path.join(root, file));
      response.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404).end('Unable to serve this request');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  createPreviewServer().listen(port, '127.0.0.1', () => console.log(`CodeToScale preview: http://127.0.0.1:${port}`));
}
