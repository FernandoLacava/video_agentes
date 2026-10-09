// Everything outside the phone: background, captions, hook (character select),
// quest panel, routing animation, proof labels and the end card.
(function () {
  const { el, clamp, prog, ease, lerp } = window.QG;

  // ---------- captions ----------
  function buildCaptions(root) {
    const box = el('div', 'captions');
    const a = el('div', 'cap'), b = el('div', 'cap');
    box.append(a, b);
    root.appendChild(box);
    return { box, slots: [a, b] };
  }
  function fillCap(node, c) {
    const key = c.time + '|' + c.text;
    if (node._k === key) return;
    node._k = key;
    node.innerHTML = (c.time ? `<span class="chip">${c.time}</span>` : '') + `<span class="ctext">${c.text}</span>`;
  }
  function renderCaptions(C, data, t) {
    const caps = data.captions;
    let i = -1;
    for (let k = 0; k < caps.length; k++) if (t >= caps[k].at) i = k;
    const endOut = data.end.at;
    const [cur, prev] = C.slots;
    if (i < 0 || t >= endOut + 0.3) { cur.style.opacity = 0; prev.style.opacity = 0; return; }
    const c = caps[i];
    fillCap(cur, c);
    const p = prog(t, c.at + (i > 0 ? 0.08 : 0), 0.28);
    const outP = prog(t, endOut, 0.3);
    cur.style.opacity = (clamp(p * 1.6) * (1 - outP)).toFixed(3);
    cur.style.transform = `translateY(${((1 - ease.out(p)) * 22).toFixed(1)}px)`;
    if (i > 0 && t < c.at + 0.2) {
      fillCap(prev, caps[i - 1]);
      const q = prog(t, c.at, 0.09);
      prev.style.opacity = (1 - q).toFixed(3);
      prev.style.transform = `translateY(${(-18 * ease.in(q)).toFixed(1)}px)`;
    } else prev.style.opacity = 0;
  }

  // ---------- hook ----------
  function buildHook(root, data) {
    const h = el('div', 'hook');
    h.innerHTML = `<div class="hook-title">${data.hook.title.replace('4 agentes de IA', '<em>4 agentes de IA</em>')}</div>`;
    const row = el('div', 'select');
    const tiles = data.hook.select.map((s) => {
      const a = data.agents[s.agent];
      const tile = el('div', 'tile');
      tile.style.setProperty('--c', a.color);
      tile.innerHTML = `<div class="tframe"><img src="${a.avatar}"></div><div class="tname">${a.short}</div><div class="trole">${a.role}</div>`;
      row.appendChild(tile);
      return { s, tile };
    });
    h.appendChild(row);
    root.appendChild(h);
    return { h, tiles, title: h.querySelector('.hook-title'), row };
  }
  function renderHook(H, data, t) {
    const out = data.hook.out;
    if (t > out + 0.4) { H.h.style.visibility = 'hidden'; return; }
    H.h.style.visibility = 'visible';
    const op = ease.in(prog(t, out, 0.35));
    // title is legible from frame 0, settles slightly
    H.title.style.opacity = (1 - op).toFixed(3);
    H.title.style.transform = `translateY(${(-24 * op).toFixed(1)}px) scale(${lerp(1.025, 1, ease.out(prog(t, 0, 0.6))).toFixed(4)})`;
    H.tiles.forEach(({ s, tile }, i) => {
      const p = prog(t, s.at, 0.3);
      const sc = p <= 0 ? 0 : lerp(0.4, 1, ease.back(p));
      const flash = Math.max(0, 1 - (t - s.at) / 0.35);
      const o2 = ease.in(prog(t, out - 0.05 + i * 0.04, 0.3));
      tile.style.opacity = (clamp(p * 4) * (1 - o2)).toFixed(3);
      tile.style.transform = `translateY(${(30 * o2).toFixed(1)}px) scale(${sc.toFixed(4)})`;
      tile.style.setProperty('--flash', flash.toFixed(3));
      // "selected" cursor blinks on the last picked tile
      const sel = t >= s.at && (i === H.tiles.length - 1 || t < H.tiles[i + 1].s.at);
      tile.classList.toggle('sel', sel && Math.floor(t * 6) % 2 === 0);
    });
  }

  // ---------- quest panel ----------
  const STATE_TXT = { open: 'ABERTA', new: 'NOVA!', done: 'CONCLUÍDA', cancel: 'CANCELADA' };
  function buildQuests(root, data) {
    const q = el('div', 'quests');
    q.innerHTML = `<div class="qh"><span class="qsw"></span>QUESTS · ESTÁGIO</div><div class="qlist"></div><div class="qclear"></div>`;
    const list = q.querySelector('.qlist');
    const rows = {};
    data.quests.items.forEach((it) => {
      const r = el('div', 'qrow');
      r.innerHTML = `<div class="qtop"><span class="qbox"></span><span class="qid">#${it.id}</span><span class="qs"></span></div><div class="ql">${it.label}</div>`;
      list.appendChild(r);
      rows[it.id] = r;
    });
    root.appendChild(q);
    return { q, rows, clear: q.querySelector('.qclear') };
  }
  function renderQuests(Q, data, t) {
    const ev = data.quests.events;
    let shown = false, showAt = 0, hideAt = -1;
    const states = {}, setAt = {};
    let blink = 0, clearAt = null, clearText = '';
    for (const e of ev) {
      if (t < e.at) continue;
      if (e.op === 'show') { shown = true; showAt = e.at; }
      if (e.op === 'hide') { shown = false; hideAt = e.at; }
      if (e.op === 'set') { states[e.id] = e.state; setAt[e.id] = e.at; }
      if (e.op === 'blink' && t < e.until) blink = (Math.floor((t - e.at) * 5) % 2 === 0) ? 1 : 0.25;
      if (e.op === 'clear') { clearAt = e.at; clearText = e.text; }
    }
    let vis;
    if (shown) vis = ease.steps(5)(prog(t, showAt, 0.3));
    else vis = hideAt >= 0 ? 1 - ease.steps(5)(prog(t, hideAt, 0.3)) : 0;
    Q.q.style.visibility = vis > 0 ? 'visible' : 'hidden';
    Q.q.style.opacity = vis.toFixed(3);
    Q.q.style.transform = `translateX(${(-40 * (1 - vis)).toFixed(1)}px)`;
    Q.q.classList.toggle('blink', blink === 1);
    if (blink) Q.q.style.transform += ` scale(${blink === 1 ? 1.035 : 1})`;
    for (const id in Q.rows) {
      const r = Q.rows[id], s = states[id];
      if (!s) { r.style.display = 'none'; continue; }
      r.style.display = '';
      const p = prog(t, setAt[id], 0.25);
      r.style.opacity = (s === 'cancel' ? lerp(1, 0.55, p) : clamp(p * 3)).toFixed(3);
      r.dataset.state = s;
      const fl = Math.max(0, 1 - (t - setAt[id]) / 0.6);
      r.style.setProperty('--flash', fl.toFixed(3));
      r.style.transform = `translateX(${(s === 'open' || s === 'new' ? (1 - ease.back(p)) * -18 : 0).toFixed(1)}px)`;
      const lbl = r.querySelector('.qs');
      if (lbl.textContent !== STATE_TXT[s]) lbl.textContent = STATE_TXT[s];
      r.querySelector('.ql').style.setProperty('--strike', s === 'cancel' ? ease.out(p).toFixed(3) : 0);
    }
    if (clearAt != null) {
      const p = prog(t, clearAt, 0.35);
      Q.clear.textContent = clearText;
      Q.clear.style.opacity = clamp(p * 3).toFixed(3);
      Q.clear.style.transform = `scale(${lerp(1.5, 1, ease.back(p)).toFixed(3)})`;
      Q.q.classList.toggle('won', true);
      Q.q.style.setProperty('--won', Math.max(0, 1 - (t - clearAt) / 0.9).toFixed(3));
    } else { Q.clear.style.opacity = 0; Q.q.classList.toggle('won', false); }
  }

  // ---------- routing (only time the architecture shows) ----------
  function buildRouting(root, data) {
    const r = el('div', 'routing');
    const A = data.agents;
    r.innerHTML = `<div class="rh">ROTEAMENTO</div>
      <div class="rn you"><div class="rav fl">FL</div><div class="rl">VOCÊ</div></div>
      <div class="rlink l1"><span></span></div>
      <div class="rn mestre"><img class="rav" src="${A.mestre.avatar}"><div class="rl">MESTRE DAS ROTAS</div><div class="rs">lê e decide</div></div>
      <div class="rlink l2"><span></span></div>
      <div class="rn guer"><img class="rav" src="${A.guerreiro.avatar}"><div class="rl">GUERREIRO</div><div class="rs">responde</div></div>
      <div class="pkt"></div>`;
    root.appendChild(r);
    return { r, pkt: r.querySelector('.pkt'), you: r.querySelector('.you'), mestre: r.querySelector('.mestre'), guer: r.querySelector('.guer'), l1: r.querySelector('.l1'), l2: r.querySelector('.l2') };
  }
  function renderRouting(R, data, t) {
    const { at, until } = data.routing;
    if (t < at || t > until + 0.3) { R.r.style.visibility = 'hidden'; return null; }
    R.r.style.visibility = 'visible';
    const vin = ease.steps(4)(prog(t, at, 0.2)), vout = 1 - ease.steps(4)(prog(t, until, 0.3));
    R.r.style.opacity = Math.min(vin, vout).toFixed(3);
    const nodes = [R.you, R.mestre, R.guer];
    nodes.forEach((n, i) => {
      const p = prog(t, at + 0.05 + i * 0.12, 0.25);
      n.style.opacity = clamp(p * 3).toFixed(3);
      n.style.transform = `scale(${lerp(0.6, 1, ease.back(p)).toFixed(3)})`;
    });
    // packet: you -> mestre -> guerreiro
    const yY = R.you.offsetTop + 48, mY = R.mestre.offsetTop + 60, gY = R.guer.offsetTop + 60;
    const a1 = at + 0.55, a2 = a1 + 0.55, hold = 0.5, a3 = a2 + hold, a4 = a3 + 0.55;
    let y, phase = 0;
    if (t < a1) y = yY;
    else if (t < a2) { y = lerp(yY, mY, ease.inOut(prog(t, a1, 0.55))); phase = 1; }
    else if (t < a3) { y = mY; phase = 2; }
    else if (t < a4) { y = lerp(mY, gY, ease.inOut(prog(t, a3, 0.55))); phase = 3; }
    else { y = gY; phase = 4; }
    const stepY = Math.round(y / 6) * 6; // pixel-stepped motion
    R.pkt.style.transform = `translate(-50%, ${stepY.toFixed(0)}px)`;
    R.pkt.style.opacity = phase === 4 ? Math.max(0, 1 - (t - a4) / 0.25).toFixed(3) : (t >= at + 0.25 ? 1 : 0);
    R.l1.style.setProperty('--lit', phase >= 1 ? 1 : 0);
    R.l2.style.setProperty('--lit', phase >= 3 ? 1 : 0);
    R.mestre.classList.toggle('think', phase === 2);
    R.mestre.style.setProperty('--glow', phase === 2 ? 1 : 0);
    R.guer.style.setProperty('--glow', phase === 4 ? Math.max(0, 1 - (t - a4) / 0.7) : 0);
    R.l1.querySelector('span').style.backgroundPositionY = `${(t * 60) % 24}px`;
    R.l2.querySelector('span').style.backgroundPositionY = `${(t * 60) % 24}px`;
    return { phase };
  }

  // ---------- proof labels ----------
  function buildLabels(root, data) {
    const wrap = el('div', 'plabels');
    const items = data.proof.labels.map((l) => {
      const a = l.agent ? data.agents[l.agent] : { color: l.color, role: l.text };
      const n = el('div', 'plab');
      n.style.setProperty('--c', a.color);
      n.innerHTML = `<span class="arr"></span><span class="pr">${a.role}</span>`;
      wrap.appendChild(n);
      return { l, n };
    });
    const grid = data.proof.grid.items.map((g) => {
      const a = data.agents[g.agent];
      const n = el('div', 'glab');
      n.style.setProperty('--c', a.color);
      n.innerHTML = `<span class="gn">${a.short}</span><span class="gr">${a.role}</span>`;
      wrap.appendChild(n);
      return { g, n };
    });
    root.appendChild(wrap);
    return { wrap, items, grid };
  }
  function renderLabels(Lb, data, t, geo) {
    const out = data.proof.labelsOut;
    if (t < data.proof.at || t > data.end.at + 0.3) { Lb.wrap.style.visibility = 'hidden'; return; }
    Lb.wrap.style.visibility = 'visible';
    const oo = 1 - ease.in(prog(t, out, 0.25));
    Lb.items.forEach(({ l, n }) => {
      const p = prog(t, l.at, 0.28);
      const yScreen = (l.y / 2346) * 956; // pt
      const y = geo.top + yScreen * geo.k;
      n.style.top = (y - 24).toFixed(1) + 'px';
      n.style.left = (geo.right + 22).toFixed(1) + 'px';
      n.style.opacity = (clamp(p * 3) * oo).toFixed(3);
      n.style.transform = `translateX(${((1 - ease.back(p)) * 30).toFixed(1)}px)`;
    });
    const G = data.proof.grid;
    const go = 1 - ease.in(prog(t, data.end.at, 0.25));
    Lb.grid.forEach(({ g, n }, i) => {
      const p = prog(t, G.at + i * 0.1, 0.3);
      n.style.left = (geo.left + (g.x / 1080) * 440 * geo.k).toFixed(1) + 'px';
      n.style.top = (geo.top + (g.y / 2346) * 956 * geo.k).toFixed(1) + 'px';
      n.style.opacity = (clamp(p * 3) * go).toFixed(3);
      n.style.transform = `translate(-50%, -50%) scale(${lerp(0.5, 1, ease.back(p)).toFixed(3)})`;
    });
  }

  // ---------- Sewgu inset: the typo, next to the agent calling it out ----------
  function buildInset(root) {
    const n = el('div', 'inset');
    n.innerHTML = `<div class="in-h">você escreveu:</div><div class="in-b">Sewgu<span class="in-t">17:55</span></div><div class="in-arrow"></div>`;
    root.appendChild(n);
    return n;
  }
  function renderInset(n, data, t) {
    const m = data.messages.find((x) => x.hot != null);
    const nd = (data.nudges || [])[1];
    const from = m.hot - 0.15, to = nd ? nd.to - 0.3 : m.hot + 2;
    if (t < from || t > to + 0.25) { n.style.visibility = 'hidden'; return; }
    n.style.visibility = 'visible';
    const p = prog(t, from, 0.32), o = 1 - ease.in(prog(t, to, 0.25));
    n.style.opacity = (clamp(p * 3) * o).toFixed(3);
    n.style.transform = `translateY(${((1 - ease.back(p)) * -30).toFixed(1)}px) rotate(${lerp(-5, -2, ease.out(p)).toFixed(2)}deg)`;
  }

  // ---------- end card ----------
  function buildEnd(root, data) {
    const e = el('div', 'endcard');
    const ids = ['escudeiro', 'mago', 'guerreiro', 'mestre'];
    e.innerHTML = `<div class="qgt">QG CENTRAL</div><div class="party">${ids.map((id) => {
      const a = data.agents[id];
      return `<div class="pm" style="--c:${a.color}"><div class="pframe"><img src="${a.avatar}"></div><div class="pn">${a.short}</div></div>`;
    }).join('')}</div>
      <div class="stack">${data.end.stack.map((s) => `<span>${s}</span>`).join('<i>·</i>')}</div>
      <div class="cta">${data.end.cta.replace('Comenta aqui.', '<em>Comenta aqui.</em>')}</div>`;
    root.appendChild(e);
    return { e, qgt: e.querySelector('.qgt'), pms: Array.from(e.querySelectorAll('.pm')), stack: e.querySelector('.stack'), cta: e.querySelector('.cta') };
  }
  function renderEnd(E, data, t) {
    const at = data.end.at;
    if (t < at + 0.2) { E.e.style.visibility = 'hidden'; return; }
    E.e.style.visibility = 'visible';
    const qp = prog(t, at + 0.2, 0.3);
    E.qgt.style.opacity = ease.steps(4)(qp).toFixed(3);
    E.pms.forEach((pm, i) => {
      const p = prog(t, at + 0.3 + i * 0.12, 0.35);
      pm.style.opacity = clamp(p * 3).toFixed(3);
      pm.style.transform = `translateY(${((1 - ease.back(p)) * 40).toFixed(1)}px)`;
      // gentle idle bob, stepped like a sprite
      const bob = Math.floor((Math.sin((t - at) * 3 + i * 1.3) + 1) * 1.5) * 2;
      pm.querySelector('img').style.transform = `translateY(${-bob}px)`;
    });
    const sp = prog(t, data.end.stackAt, 0.4);
    E.stack.style.opacity = clamp(sp * 2).toFixed(3);
    E.stack.style.transform = `translateY(${((1 - ease.out(sp)) * 20).toFixed(1)}px)`;
    const cp = prog(t, data.end.ctaAt, 0.45);
    E.cta.style.opacity = clamp(cp * 2).toFixed(3);
    E.cta.style.transform = `translateY(${((1 - ease.out(cp)) * 24).toFixed(1)}px) scale(${lerp(0.96, 1, ease.back(cp)).toFixed(4)})`;
  }

  window.QG.overlay = {
    buildCaptions, renderCaptions, buildHook, renderHook, buildQuests, renderQuests,
    buildRouting, renderRouting, buildInset, renderInset, buildLabels, renderLabels, buildEnd, renderEnd,
  };
})();
