// Assembly: layout per format, camera, and the single seekable timeline.
(function () {
  const QG = window.QG;
  const { prog, ease, lerp, clamp, track } = QG;
  const params = new URLSearchParams(location.search);
  const FMT = params.get('fmt') === '916' ? '916' : '45';

  // Relative layout: same scenes, two canvases.
  const LAYOUTS = {
    '45': {
      W: 1080, H: 1350, pxPerPt: 1.5, anchorMargin: 34,
      states: {
        lock:  { cx: 540, top: 318, s: 0.72, o: 1 },
        chat:  { cx: 540, top: 286, s: 1.0,  o: 1 },
        panel: { cx: 730, top: 300, s: 0.86, o: 1 },
        proof: { cx: 452, top: 290, s: 0.9,  o: 1 },
        out:   { cx: 540, top: 1500, s: 0.72, o: 0 },
      },
      cap: { top: 66 }, side: { top: 300 }, hookRow: 590, end: { top: 480 },
    },
    '916': {
      W: 1080, H: 1920, pxPerPt: 1.727, anchorMargin: 60,
      states: {
        lock:  { cx: 540, top: 470, s: 0.76, o: 1 },
        chat:  { cx: 540, top: 430, s: 1.0,  o: 1 },
        panel: { cx: 716, top: 450, s: 0.78, o: 1 },
        proof: { cx: 452, top: 450, s: 0.84, o: 1 },
        out:   { cx: 540, top: 2100, s: 0.76, o: 0 },
      },
      cap: { top: 150 }, side: { top: 470 }, hookRow: 800, end: { top: 700 },
    },
  };
  const LY = LAYOUTS[FMT];

  async function boot() {
    const data = await (await fetch('data/timeline.json')).json();
    // per-agent glow rgb
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
    for (const k in data.agents) data.agents[k].glow = hex(data.agents[k].color);

    const root = document.getElementById('root');
    root.dataset.width = LY.W; root.dataset.height = LY.H;
    root.style.width = LY.W + 'px'; root.style.height = LY.H + 'px';
    document.documentElement.style.setProperty('--W', LY.W + 'px');
    document.documentElement.style.setProperty('--H', LY.H + 'px');
    document.documentElement.style.setProperty('--capTop', LY.cap.top + 'px');
    document.documentElement.style.setProperty('--sideTop', LY.side.top + 'px');
    document.documentElement.style.setProperty('--hookRow', LY.hookRow + 'px');
    document.documentElement.style.setProperty('--endTop', LY.end.top + 'px');
    root.classList.add('fmt-' + FMT);

    const bg = document.getElementById('bg');
    const cam = document.getElementById('cam');
    const P = QG.phone.build(cam, data);
    const chat = QG.chat.build(P.content, data);
    const capScrim = QG.el('div', 'capscrim');
    root.appendChild(capScrim);
    const C = QG.overlay.buildCaptions(root);
    const H = QG.overlay.buildHook(root, data);
    const Q = QG.overlay.buildQuests(root, data);
    const R = QG.overlay.buildRouting(root, data);
    const Lb = QG.overlay.buildLabels(root, data);
    const E = QG.overlay.buildEnd(root, data);

    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
    QG.chat.measure(chat);

    const chatState = LY.states.chat;
    const anchor = (LY.H - LY.anchorMargin - chatState.top) / (LY.pxPerPt * chatState.s);
    const scrollAt = QG.chat.scrollTrack(chat, anchor);

    const geoTrack = track(
      data.phoneStates.map((p) => ({ at: p.at, value: LY.states[p.state], dur: p.dur, ease: ease.inOut })),
      LY.states.lock
    );
    const lockness = track(
      data.phoneStates.map((p) => ({ at: p.at, value: p.state === 'lock' ? 1 : 0, dur: p.dur + 0.2 })), 1
    );

    function render(t) {
      const g = geoTrack(t);
      const k = LY.pxPerPt * g.s;
      const B = QG.phone.BEZEL;
      const X = g.cx - (QG.phone.SW / 2 + B) * k;
      const Y = g.top - B * k;
      P.phone.style.transform = `translate(${X.toFixed(2)}px, ${Y.toFixed(2)}px) scale(${k.toFixed(5)})`;
      P.phone.style.opacity = g.o.toFixed(3);

      // camera: continuous slow breathing zoom + punch-ins on key moments
      let z = 1 + 0.014 * Math.sin((2 * Math.PI * t) / 9) + 0.006 * Math.sin((2 * Math.PI * t) / 3.7);
      let px = g.cx, py = LY.H * 0.6;
      let wmax = 0;
      for (const L of data.locks) {
        if (!L.cardAt) continue;
        const from = L.cardAt + 0.12, to = L.dive + 0.42;
        const w = ease.inOut(prog(t, from, 0.32)) * (1 - ease.inOut(prog(t, to - 0.42, 0.42)));
        if (w <= 0) continue;
        const ls = LY.states.lock, lk = LY.pxPerPt * ls.s;
        const cyPt = (L.rect[1] + L.rect[3]) / 2 / 3;
        const fy = ls.top + (cyPt + QG.phone.BEZEL - QG.phone.BEZEL) * lk;
        z *= 1 + 0.42 * w;
        wmax = Math.max(wmax, w);
        py = lerp(py, fy, w);
        px = lerp(px, ls.cx, w);
      }
      for (const pu of data.punches) {
        const w = ease.inOut(prog(t, pu.from, 0.35)) * (1 - ease.inOut(prog(t, pu.to - 0.4, 0.4)));
        if (w <= 0) continue;
        wmax = Math.max(wmax, w * Math.min(1, (pu.scale - 1) / 0.1));
        z *= 1 + (pu.scale - 1) * w;
        const fy = pu.focus * LY.H;
        py = lerp(py, fy, w);
        if (pu.fx != null) px = lerp(px, g.cx + (pu.fx - 0.5) * QG.phone.SW * k, w);
      }
      capScrim.style.opacity = clamp(wmax).toFixed(3);
      cam.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) scale(${z.toFixed(5)}) translate(${(-px).toFixed(1)}px, ${(-py).toFixed(1)}px)`;

      let nudge = 0;
      for (const n of data.nudges || []) {
        const w = ease.inOut(prog(t, n.from, 0.35)) * (1 - ease.inOut(prog(t, n.to - 0.4, 0.4)));
        nudge += n.dy * w;
      }
      const scroll = scrollAt(t) + nudge;
      const typing = QG.chat.render(chat, t, { scroll, screenH: QG.phone.SH, agents: data.agents });
      QG.phone.render(P, data, t, { scroll, typing });

      // background warms to copper on lock screens
      const lk = clamp(lockness(t));
      bg.style.setProperty('--lock', lk.toFixed(3));

      QG.overlay.renderCaptions(C, data, t);
      QG.overlay.renderHook(H, data, t);
      QG.overlay.renderQuests(Q, data, t);
      QG.overlay.renderRouting(R, data, t);
      QG.overlay.renderLabels(Lb, data, t, { top: g.top, k, left: g.cx - (QG.phone.SW / 2) * k, right: g.cx + (QG.phone.SW / 2) * k, W: LY.W });
      QG.overlay.renderEnd(E, data, t);
    }

    // Sound cues, derived from the same data the picture uses.
    const cues = [];
    data.hook.select.forEach((s) => cues.push({ at: s.at, sfx: 'select' }));
    data.locks.forEach((L, i) => {
      if (i > 0) cues.push({ at: L.in, sfx: 'whoosh' });
      if (L.cardAt) cues.push({ at: L.cardAt, sfx: 'notif' });
      cues.push({ at: L.dive, sfx: 'dive' });
    });
    data.clocks.forEach((c) => cues.push({ at: c.at, sfx: 'tick' }));
    data.messages.forEach((m) => cues.push({ at: m.at, sfx: m.from === 'me' ? 'sent' : 'pop' }));
    data.quests.events.forEach((e) => {
      if (e.op === 'show') cues.push({ at: e.at, sfx: 'panel' });
      if (e.op === 'set' && e.state === 'new') cues.push({ at: e.at, sfx: 'quest_new' });
      if (e.op === 'set' && e.state === 'done') cues.push({ at: e.at, sfx: 'check' });
      if (e.op === 'set' && e.state === 'cancel') cues.push({ at: e.at, sfx: 'cancel' });
      if (e.op === 'blink') cues.push({ at: e.at, sfx: 'blink' });
      if (e.op === 'clear') cues.push({ at: e.at, sfx: 'quest_done' });
    });
    cues.push({ at: data.routing.at + 0.35, sfx: 'route' }, { at: data.routing.at + 1.15, sfx: 'route' });
    cues.push({ at: 41.75, sfx: 'huh' });
    cues.push({ at: data.proof.at, sfx: 'whoosh' }, { at: data.end.at, sfx: 'whoosh' }, { at: data.end.ctaAt, sfx: 'cta' });
    data.proof.labels.forEach((l) => cues.push({ at: l.at, sfx: 'label' }));

    const duration = data.meta.duration;
    let cur = 0;
    const tl = {
      duration: () => duration,
      time: () => cur,
      seek: (t) => { cur = Math.max(0, Math.min(duration, t)); render(cur); return tl; },
      pause: () => tl,
      play: () => tl,
      totalDuration: () => duration,
      progress: (p) => tl.seek(p * duration),
    };
    window.__timelines = window.__timelines || {};
    window.__timelines['qg-central'] = tl;
    window.__seek = (t) => tl.seek(t);
    window.__qgCues = cues.sort((a, b) => a.at - b.at);
    window.__qgMeta = { duration, fps: data.meta.fps, W: LY.W, H: LY.H, fmt: FMT };
    tl.seek(params.has('t') ? +params.get('t') : 0);
    window.__ready = true;
  }
  boot().catch((e) => { document.body.dataset.error = String(e && e.stack || e); console.error(e); });
})();
