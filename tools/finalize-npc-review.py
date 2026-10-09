"""Publish the actual Chromium recording, trimming only the loading prelude."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/characters/npc-phase4/review'
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/workspace/artifacts/npc-phase4/npc-motion.webm')
duration = float(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', str(source)
], text=True).strip())
# Probe the middle of the canvas, excluding UI and loading notices. Require
# a lit backdrop plus the actual darker body in five consecutive frames.
raw = subprocess.check_output([
    'ffmpeg', '-v', 'error', '-i', str(source), '-vf',
    'fps=5,crop=360:640:270:160,scale=60:96',
    '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'
])
stride = 60 * 96 * 3
ready = []
for i in range(len(raw) // stride):
    frame = raw[i * stride:(i + 1) * stride]
    pixels = zip(frame[0::3], frame[1::3], frame[2::3])
    dark = sum(max(pixel) < 115 for pixel in pixels) / (60 * 96)
    ready.append(sum(frame) / stride > 130 and .05 < dark < .6)
first = next((i for i in range(len(ready) - 4) if all(ready[i:i + 5])), None)
if first is None:
    raise RuntimeError('No visible character found in Chromium recording')
# fps resampling may select a source frame up to half an interval later.
# Start one interval after detection so the first encoded frame is visible.
trim = (first + 1) / 5
target = OUT / 'npc-motion.mp4'
subprocess.run([
    'ffmpeg', '-v', 'error', '-ss', str(trim), '-i', str(source),
    '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', str(target)
], check=True)
timeline = {
    'source': str(source),
    'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sourceDurationSeconds': duration,
    'trimmedLoadingSeconds': trim,
    'method': 'First five consecutive canvas samples with a visible character',
    'sampleIntervalSeconds': .2,
    'recordedContent': 'Actual PlayCanvas 2.23.0 in Chromium; three NPCs and their three clips',
    'otherEdits': 'None; recording transcoded to H.264',
    'gameIntegrated': False
}
(OUT / 'recording-timeline.json').write_text(json.dumps(timeline, indent=2) + '\n')
print(json.dumps(timeline, indent=2))
