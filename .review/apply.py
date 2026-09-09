"""Apply the locally validated source edits, rejecting any before/after mismatch."""
import hashlib
from pathlib import Path
import runpy

root = Path.cwd().resolve()
for patch in ['.review/patch-small.py', '.review/patch-world.py']:
    for item in runpy.run_path(patch)['FILES']:
        relative = item['path']
        assert relative.startswith(('client/src/', 'docs/')) or relative == 'package.json', relative
        path = (root / relative).resolve()
        assert root in path.parents, relative
        original = path.read_text(encoding='utf-8') if path.exists() else ''
        digest = lambda text: hashlib.sha256(text.encode('utf-8')).hexdigest()
        if digest(original) == item['after']:
            print('Already verified:', relative)
            continue
        assert digest(original) == item['before'], ('Unexpected baseline', relative, digest(original))
        result = original
        previous_end = 0
        for start, end, addition in item['edits']:
            assert previous_end <= start <= end <= len(original), relative
            previous_end = end
        for start, end, addition in reversed(item['edits']):
            result = result[:start] + addition + result[end:]
        assert digest(result) == item['after'], ('Unexpected patched content', relative, digest(result))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(result, encoding='utf-8')
        print('Verified:', relative)
