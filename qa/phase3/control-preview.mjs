// Diagnostic only: serve the untouched Phase 3 entry snapshot for a same-host
// Lighthouse control. Never use this as a production server or upload qa/.
import http from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['baseline/index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['baseline/styles.css', 'text/css; charset=utf-8']],
  ['/script.js', ['baseline/script.js', 'text/javascript; charset=utf-8']],
  ['/assets/commerce-concept.svg', ['../../assets/commerce-concept.svg', 'image/svg+xml']],
  ['/assets/software-concept.svg', ['../../assets/software-concept.svg', 'image/svg+xml']],
]);
const server = http.createServer(async (request, response) => {
  const file = files.get(new URL(request.url, 'http://localhost').pathname);
  if (!file || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const bytes = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, {
      'Content-Type': file[1], 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow',
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(0, '127.0.0.1', () => console.log(`Baseline control: http://127.0.0.1:${server.address().port}`));
