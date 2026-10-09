#!/usr/bin/env bash
# contact sheets, one frame every 0.5s: scripts/contact.sh in.mp4 outdir
set -euo pipefail
IN=$1; OUT=$2; rm -rf "$OUT"; mkdir -p "$OUT/f"
ffmpeg -v error -i "$IN" -vf "fps=2,scale=270:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=15:fontcolor=yellow:box=1:boxcolor=black" "$OUT/f/c_%03d.jpg"
python3 -I - "$OUT" <<'PY'
import sys,glob
from PIL import Image
o=sys.argv[1]; fs=sorted(glob.glob(o+'/f/*.jpg')); w,h=Image.open(fs[0]).size
for s in range(0,len(fs),24):
    ch=fs[s:s+24]; W=Image.new('RGB',(w*6,h*4))
    for i,f in enumerate(ch): W.paste(Image.open(f),((i%6)*w,(i//6)*h))
    W.save(f'{o}/sheet_{s//24:02d}.jpg',quality=85)
PY
rm -rf "$OUT/f"; ls "$OUT"
