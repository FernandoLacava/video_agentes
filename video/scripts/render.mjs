// Frame-accurate renderer for the composition (seek → screenshot → ffmpeg).
// Usage:
//   node scripts/render.mjs snapshot --fmt 45 --at 1,2.5,10 --out snapshots
//   node scripts/render.mjs render   --fmt 45 --out out/_video_45.mp4 [--quality draft|delivery] [--from 0 --to 63.5]
//   node scripts/render.mjs cues     --out out/cues.json
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(3).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const mode = process.argv[2];
const fmt = args.fmt || '45';

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const W = 1080, H = fmt === '916' ? 1920 : 1350;
const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e));
await page.goto(`http://127.0.0.1:${port}/index.html?fmt=${fmt}`);
await page.waitForFunction(() => window.__ready || document.body.dataset.error, null, { timeout: 60000 });
const err = await page.evaluate(() => document.body.dataset.error);
if (err) { console.error(err); process.exit(1); }
const meta = await page.evaluate(() => window.__qgMeta);

async function shot(t, type = 'png', quality) {
  await page.evaluate((t) => window.__seek(t), t);
  return page.screenshot({ type, quality, clip: { x: 0, y: 0, width: W, height: H } });
}

if (mode === 'snapshot') {
  const out = path.resolve(ROOT, args.out || 'snapshots');
  fs.mkdirSync(out, { recursive: true });
  for (const t of args.at.split(',').map(Number)) {
    const buf = await shot(t);
    const f = path.join(out, `${fmt}_${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(f, buf);
    console.log(f);
  }
} else if (mode === 'cues') {
  const cues = await page.evaluate(() => window.__qgCues);
  fs.writeFileSync(path.resolve(ROOT, args.out || 'out/cues.json'), JSON.stringify({ duration: meta.duration, cues }, null, 1));
  console.log('cues', cues.length);
} else if (mode === 'render') {
  const fps = meta.fps;
  const from = +(args.from || 0), to = +(args.to || meta.duration);
  const n = Math.round((to - from) * fps);
  const quality = args.quality || 'draft';
  const out = path.resolve(ROOT, args.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const enc = quality === 'delivery'
    ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-tune', 'animation']
    : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22'];
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...enc, '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = from + i / fps;
    const buf = await shot(t, 'jpeg', quality === 'delivery' ? 98 : 90);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close();
server.close();
