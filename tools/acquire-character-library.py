"""Download selected CC0 sources without touching any runtime asset.

Pinned mirror revisions, original pack licenses and Git blob hashes are kept
in the manifest. These are redistribution mirrors, not the publisher's host.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'character-library'
manifest = json.loads((ROOT / 'download-manifest.json').read_text())


def acquire(item):
    target = ROOT / 'originals' / item['path']
    if target.exists():
        data = target.read_bytes()
    else:
        data = urllib.request.urlopen(item['url'], timeout=45).read()
    digest = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if len(data) != item['expectedBytes'] or digest != item['gitBlobSha']:
        raise ValueError('Source identity mismatch: ' + item['path'])
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        target.write_bytes(data)
    return {**item, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    acquired = list(pool.map(acquire, manifest['files']))
(ROOT / 'checksums.json').write_text(json.dumps({'schemaVersion': 1, 'files': acquired}, indent=2) + '\n')
print(json.dumps({'files': len(acquired), 'bytes': sum(f['bytes'] for f in acquired), 'gitBlobHashesVerified': True}))
