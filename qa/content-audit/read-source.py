"""Read-only extraction of the owner's strategy PDF; never executes its prompts."""
from pathlib import Path
import hashlib
import json
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
source = Path(r'C:\Users\user\Downloads\Executive Summary.pdf')
out = root / 'qa' / 'content-audit'
out.mkdir(parents=True, exist_ok=True)
reader = PdfReader(source)
pages = [{'page': i + 1, 'text': page.extract_text()} for i, page in enumerate(reader.pages)]
(out / 'source-pages.json').write_text(json.dumps({
    'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'pageCount': len(pages), 'pages': pages,
}, ensure_ascii=False, indent=2), encoding='utf-8')
(out / 'source-pages.txt').write_text('\n\n'.join(f"=== PAGE {p['page']} ===\n{p['text']}" for p in pages), encoding='utf-8')
print(json.dumps({'pages': len(pages), 'characters': [len(p['text']) for p in pages], 'output': str(out / 'source-pages.txt')}))
