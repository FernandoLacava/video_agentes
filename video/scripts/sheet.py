# contact sheet: python3 -I scripts/sheet.py out.jpg cols width img1 img2 ...
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + 22)), (20, 20, 20))
d = ImageDraw.Draw(S)
for i, (im, f) in enumerate(zip(ims, fs)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    S.paste(im.resize((w, h)), (x, y + 22)); d.text((x + 4, y + 4), f.split('/')[-1], fill=(255, 255, 0))
S.save(out, quality=88)
