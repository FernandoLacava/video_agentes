#!/usr/bin/env bash
# audio + mux only (picture already rendered): scripts/mux.sh <45|916> <out.mp4>
set -euo pipefail
cd "$(dirname "$0")/.."
FMT=$1; OUT=$2
node scripts/render.mjs cues --out out/cues.json
python3 -I scripts/audio.py out/cues.json out/mix.wav
ffmpeg -y -v error -i "out/_picture_$FMT.mp4" -i out/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-16:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.79:level=false:attack=2:release=40" -c:a aac -b:a 192k \
  -movflags +faststart -shortest "$OUT"
echo "built $OUT"
