"""Content-only static HTML inventory; no site mutation or external requests."""
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'qa' / 'content-audit'
clean = lambda value: re.sub(r'\s+', ' ', value).strip()

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.skip = 0
        self.title_active = False
        self.title = ''
        self.main = []
        self.headings = []
        self.heading = None
        self.paragraphs = []
        self.paragraph = None
        self.links = []
        self.link = None
        self.meta = []
        self.ids = []
        self.images = []
        self.schema = []
        self.schema_active = False
        self.schema_text = ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'main': self.in_main = True
        if tag in ('script', 'style'):
            self.skip += 1
            if tag == 'script' and a.get('type') == 'application/ld+json':
                self.schema_active = True
                self.schema_text = ''
        if tag == 'title': self.title_active = True
        if tag == 'meta': self.meta.append(a)
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'img': self.images.append(a)
        if self.in_main and re.fullmatch(r'h[1-6]', tag):
            self.heading = {'level': int(tag[1]), 'text': '', 'line': self.getpos()[0]}
        if tag == 'span' and self.heading is not None and 'hero-line' in a.get('class', '').split():
            self.heading['text'] += ' '  # These spans are displayed as block lines.
        if self.in_main and tag == 'p': self.paragraph = ''
        if tag == 'a': self.link = {'href': a.get('href', ''), 'text': '', 'main': self.in_main, 'line': self.getpos()[0], 'service': a.get('data-service')}
        if tag in ('br', 'p', 'section', 'div') and self.in_main:
            self.main.append(' ')
            if self.heading is not None: self.heading['text'] += ' '

    def handle_data(self, data):
        if self.schema_active: self.schema_text += data
        if self.skip: return
        if self.title_active: self.title += data
        if self.in_main: self.main.append(data)
        if self.heading is not None: self.heading['text'] += data
        if self.paragraph is not None: self.paragraph += data
        if self.link is not None: self.link['text'] += data

    def handle_endtag(self, tag):
        if tag == 'title': self.title_active = False
        if tag in ('script', 'style'):
            if self.schema_active and tag == 'script':
                self.schema.append(json.loads(self.schema_text))
                self.schema_active = False
            self.skip = max(0, self.skip - 1)
        if self.heading is not None and re.fullmatch(r'h[1-6]', tag):
            self.heading['text'] = clean(self.heading['text'])
            self.headings.append(self.heading)
            self.heading = None
        if tag == 'p' and self.paragraph is not None:
            self.paragraphs.append(clean(self.paragraph))
            self.paragraph = None
        if tag == 'a' and self.link is not None:
            self.link['text'] = clean(self.link['text'])
            self.links.append(self.link)
            self.link = None
        if tag == 'main': self.in_main = False

files = [ROOT / 'index.html', ROOT / 'services.html', *sorted((ROOT / 'services').glob('*.html')), ROOT / 'about.html', ROOT / 'faq.html', ROOT / 'privacy.html', ROOT / 'terms.html']
rows = []
for file in files:
    page = Page()
    entry_copy = OUT / 'before' / file.relative_to(ROOT)
    source_file = entry_copy if '--entry' in __import__('sys').argv and entry_copy.exists() else file
    html = source_file.read_text(encoding='utf-8')
    page.feed(html)
    meta = lambda name: [m.get('content', '') for m in page.meta if m.get('name', m.get('property')) == name]
    levels = [h['level'] for h in page.headings]
    row = {
        'file': file.relative_to(ROOT).as_posix(),
        'route': '/' if file.name == 'index.html' else '/' + file.relative_to(ROOT).as_posix(),
        'sha256': hashlib.sha256(source_file.read_bytes()).hexdigest(),
        'title': clean(page.title), 'description': meta('description'),
        'titleLength': len(clean(page.title)), 'descriptionLength': [len(d) for d in meta('description')],
        'headings': page.headings, 'headingJumps': [page.headings[i] for i in range(1, len(levels)) if levels[i] > levels[i - 1] + 1],
        'mainText': clean(' '.join(page.main)), 'paragraphs': page.paragraphs,
        'wordCount': len(clean(' '.join(page.main)).split()), 'links': page.links,
        'images': page.images, 'robots': meta('robots'), 'schema': page.schema,
        'geography': re.findall(r'[^.!?]*\b(?:Pakistan|worldwide|international|global|headquarter)[^.!?]*[.!?]?', clean(' '.join(page.main)), re.I),
    }
    rows.append(row)

duplicates = defaultdict(list)
for row in rows:
    for paragraph in set(row['paragraphs']):
        if len(paragraph.split()) >= 15: duplicates[paragraph].append(row['route'])
result = {
    'pages': rows,
    'duplicateParagraphs': [{'text': p, 'routes': routes} for p, routes in duplicates.items() if len(routes) > 1],
    'summary': {
        'pages': len(rows), 'uniqueTitles': len(set(r['title'] for r in rows)),
        'uniqueDescriptions': len(set(r['description'][0] for r in rows)),
        'h1Errors': [r['route'] for r in rows if sum(h['level'] == 1 for h in r['headings']) != 1],
        'headingJumps': {r['route']: r['headingJumps'] for r in rows if r['headingJumps']},
    },
}
import sys
name = sys.argv[1] if len(sys.argv) > 1 else 'inventory'
if not re.fullmatch(r'[a-z-]+', name): raise ValueError('Invalid evidence name')
(OUT / (name + '.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / (name + '-reading.txt')).write_text('\n\n'.join(f"=== {r['route']} ===\nTITLE: {r['title']}\nDESCRIPTION: {r['description'][0]}\n" + '\n'.join(f"H{h['level']}: {h['text']}" for h in r['headings']) + '\n\n' + r['mainText'] for r in rows), encoding='utf-8')
print(json.dumps(result['summary'], ensure_ascii=False, indent=2))
