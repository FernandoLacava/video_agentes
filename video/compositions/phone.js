// Phone frame + everything inside the screen except the chat bubbles:
// status bar, Telegram header, input bar, wallpaper, real lock screens with the
// notification card sliding in, the clock transition, and the real recording (proof).
(function () {
  const { el, clamp, prog, ease, lerp, hash } = window.QG;
  const SW = 440, SH = 956, BEZEL = 11;
  const PX = SW / 1320; // print px -> pt

  function wallpaperSVG() {
    // Deterministic doodle tile in the spirit of Telegram's default pattern.
    const shapes = [];
    const T = 260;
    for (let i = 0; i < 26; i++) {
      const x = (hash(i * 7.1) * T).toFixed(1), y = (hash(i * 3.7 + 9) * T).toFixed(1);
      const r = 5 + hash(i * 1.3) * 9, kind = i % 6, rot = (hash(i * 9.9) * 360).toFixed(0);
      let d = '';
      if (kind === 0) d = `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}"/>`;
      if (kind === 1) d = `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 ${-r} L${r * 0.3} ${-r * 0.3} L${r} 0 L${r * 0.3} ${r * 0.3} L0 ${r} L${-r * 0.3} ${r * 0.3} L${-r} 0 L${-r * 0.3} ${-r * 0.3} Z"/>`;
      if (kind === 2) d = `<path transform="translate(${x} ${y}) rotate(${rot})" d="M${-r} 0 q${r / 2} ${-r} ${r} 0 t${r} 0 t${r} 0"/>`;
      if (kind === 3) d = `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 ${r * 0.35} C ${-r} ${-r * 0.4}, ${-r * 0.4} ${-r}, 0 ${-r * 0.35} C ${r * 0.4} ${-r}, ${r} ${-r * 0.4}, 0 ${r * 0.35} Z"/>`;
      if (kind === 4) d = `<rect transform="translate(${x} ${y}) rotate(${rot})" x="${-r / 2}" y="${-r / 2}" width="${r}" height="${r}" rx="2"/>`;
      if (kind === 5) d = `<path transform="translate(${x} ${y}) rotate(${rot})" d="M${-r} ${r * 0.6} L0 ${-r * 0.8} L${r} ${r * 0.6} Z"/>`;
      shapes.push(d);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${shapes.join('')}</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  const ICONS = {
    bell: '<svg viewBox="0 0 20 20" class="ic-bell"><path d="M10 3a4.5 4.5 0 0 0-4.5 4.5V11L4 13.5h12L14.5 11V7.5A4.5 4.5 0 0 0 10 3zM8.2 15.2a1.9 1.9 0 0 0 3.6 0" fill="currentColor"/><path d="M3 3l14 14" stroke="#000" stroke-width="3"/><path d="M3 3l14 14" stroke="currentColor" stroke-width="1.6"/></svg>',
    signal: '<svg viewBox="0 0 22 14" class="ic-sig"><rect x="0" y="9" width="4" height="5" rx="1"/><rect x="6" y="6" width="4" height="8" rx="1"/><rect x="12" y="3" width="4" height="11" rx="1"/><rect x="18" y="0" width="4" height="14" rx="1"/></svg>',
    wifi: '<svg viewBox="0 0 20 14" class="ic-wifi"><path d="M10 13.5l2.6-3.1a4 4 0 0 0-5.2 0z"/><path d="M3.8 6.6a9 9 0 0 1 12.4 0l-1.8 2.1a6.3 6.3 0 0 0-8.8 0z"/><path d="M0.6 3.3a13.6 13.6 0 0 1 18.8 0l-1.7 2a11 11 0 0 0-15.4 0z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clip: '<svg viewBox="0 0 24 24"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  function statusBar() {
    const s = el('div', 'sbar');
    s.innerHTML = `<div class="sb-l"><span class="sb-time">07:01</span>${ICONS.bell}</div>
      <div class="sb-r">${ICONS.signal}${ICONS.wifi}<span class="batt"><span class="bn">82</span></span><span class="bcap"></span></div>`;
    return s;
  }

  function build(host, data) {
    const phone = el('div', 'phone');
    const screen = el('div', 'screen');
    phone.appendChild(screen);

    // chat wrapper (wallpaper + scrolling content + chrome)
    const chatWrap = el('div', 'chatwrap');
    const wall = el('div', 'wall');
    wall.style.backgroundImage = wallpaperSVG();
    chatWrap.appendChild(wall);
    chatWrap.appendChild(el('div', 'wall-tint'));
    const content = el('div', 'content');
    chatWrap.appendChild(content);
    const chrome = el('div', 'chrome');
    chrome.appendChild(el('div', 'scrim'));
    const sb = statusBar();
    chrome.appendChild(sb);
    const hdr = el('div', 'hdr');
    const grp = Object.values(data.agents).map((a) => `<img src="${a.avatar}">`).join('');
    hdr.innerHTML = `<div class="pill round back">${ICONS.back}</div>
      <div class="pill title"><div class="tt">QG Central</div><div class="ts2">5 members</div></div>
      <div class="pill round gav"><div class="grid4">${grp}</div></div>`;
    chrome.appendChild(hdr);
    const input = el('div', 'inputbar');
    input.innerHTML = `<div class="pill round">${ICONS.clip}</div><div class="pill msg">Message</div><div class="pill round">${ICONS.mic}</div>`;
    chrome.appendChild(input);
    chatWrap.appendChild(chrome);

    // lock screens
    const lockL = el('div', 'locklayer');
    const locks = data.locks.map((L) => {
      const g = el('div', 'lock');
      const base = el('img', 'lk-base');
      base.src = L.base || L.img;
      g.appendChild(base);
      let card = null;
      if (L.card) {
        card = el('img', 'lk-card');
        card.src = L.card;
        const [x0, y0, x1, y1] = L.rect;
        Object.assign(card.style, { left: x0 * PX + 'px', top: y0 * PX + 'px', width: (x1 - x0) * PX + 'px', height: (y1 - y0) * PX + 'px' });
        g.appendChild(card);
      }
      lockL.appendChild(g);
      return { L, g, card };
    });

    // clock transition overlay
    const clock = el('div', 'clockfx');
    clock.innerHTML = '<div class="cf-scrim"></div><div class="cf-box"><div class="cf-old"></div><div class="cf-new"></div></div>';

    // proof (real recording)
    const proof = el('div', 'proof');
    const P = data.proof;
    const frameImgs = {};
    const needed = new Set();
    P.seq.forEach((s) => { for (let i = s.from; i <= s.to; i++) needed.add(i); });
    const home = el('img', 'pf');
    home.src = P.home.img;
    proof.appendChild(home);
    needed.forEach((i) => {
      const im = el('img', 'pf');
      im.src = P.frames.replace('%03d', String(i).padStart(3, '0'));
      proof.appendChild(im);
      frameImgs[i] = im;
    });
    (P.cover || []).forEach((y) => {
      const c = el('div', 'pcover');
      P._covers = P._covers || [];
      P._covers.push(c);
      c.style.top = ((y / 2346) * 956 - 8).toFixed(1) + 'px';
      proof.appendChild(c);
    });
    const cover = statusBar();
    cover.classList.add('cover');
    proof.appendChild(cover);

    screen.appendChild(lockL);
    screen.appendChild(chatWrap);
    screen.appendChild(clock);
    screen.appendChild(proof);
    phone.appendChild(el('div', 'island'));
    host.appendChild(phone);

    return { phone, screen, chatWrap, content, sb, cover, hdr, locks, clock, proof, home, frameImgs, wall };
  }

  function setStatus(sbEl, time, batt) {
    sbEl.querySelector('.sb-time').textContent = time;
    const b = sbEl.querySelector('.batt');
    b.querySelector('.bn').textContent = batt;
    b.dataset.level = batt <= 12 ? 'red' : batt <= 20 ? 'yellow' : 'ok';
    b.style.setProperty('--fill', batt + '%');
  }

  function activeAt(list, t) {
    let cur = null;
    for (const x of list) if (t >= x.at) cur = x;
    return cur;
  }

  function render(P, data, t, ctx) {
    // status bar
    const st = activeAt(data.status, t);
    if (st && P._st !== st) { setStatus(P.sb, st.time, st.batt); P._st = st; }
    // header subtitle (typing)
    const sub = P.hdr.querySelector('.ts2');
    const txt = ctx.typing ? `${data.agents[ctx.typing.m.from].name.split(' ')[0]} está digitando…` : '5 members';
    if (sub.textContent !== txt) sub.textContent = txt;
    sub.classList.toggle('typing', !!ctx.typing);

    // chat content scroll + wallpaper parallax
    P.content.style.transform = `translateY(${(-ctx.scroll).toFixed(2)}px)`;
    P.wall.style.backgroundPosition = `0 ${(-ctx.scroll * 0.25).toFixed(1)}px`;

    // locks
    let chatVis = 1, chatClip = null, lockAny = false;
    P.locks.forEach(({ L, g, card }, i) => {
      const end = L.dive + 0.5;
      if (t < L.in || t >= end) { g.style.visibility = 'hidden'; return; }
      lockAny = true;
      g.style.visibility = 'visible';
      const pin = i === 0 ? 1 : ease.out(prog(t, L.in, 0.15));
      const [x0, y0, x1, y1] = L.rect;
      const cx = ((x0 + x1) / 2) * PX, cy = ((y0 + y1) / 2) * PX;
      const dp = ease.inOut(prog(t, L.dive, 0.45));
      const sc = lerp(1.05, 1, pin) * lerp(1, 1.35, dp);
      g.style.transformOrigin = `${cx}px ${cy}px`;
      g.style.transform = `scale(${sc.toFixed(4)})`;
      g.style.opacity = '1';
      if (card) {
        const cp = prog(t, L.cardAt, 0.45);
        const y = (1 - ease.back(cp)) * 220;
        card.style.transform = `translateY(${y.toFixed(1)}px)`;
        card.style.opacity = clamp(cp * 4).toFixed(3);
      }
      // chat visibility around this lock
      if (i > 0 && t < L.dive) chatVis = Math.min(chatVis, 1 - pin);
      if (t < L.dive) { if (i === 0) chatVis = 0; }
      else {
        // dive: chat grows out of the notification card
        const r = lerp(16, 55, dp);
        const ins = [y0 * PX, SW - x1 * PX, SH - y1 * PX, x0 * PX].map((v) => (v * (1 - dp)).toFixed(1));
        chatClip = `inset(${ins[0]}px ${ins[1]}px ${ins[2]}px ${ins[3]}px round ${r.toFixed(1)}px)`;
        chatVis = clamp(dp * 5);
      }
    });
    P.chatWrap.style.opacity = chatVis.toFixed(3);
    P.chatWrap.style.clipPath = chatClip || 'none';

    // clock transitions (max 0.4s)
    const ck = data.clocks.find((c) => t >= c.at && t < c.at + 0.42);
    if (ck) {
      const p = prog(t, ck.at, 0.4);
      P.clock.style.visibility = 'visible';
      P.clock.querySelector('.cf-scrim').style.opacity = (Math.sin(Math.PI * p) * 0.82).toFixed(3);
      const box = P.clock.querySelector('.cf-box');
      box.style.opacity = Math.sin(Math.PI * p).toFixed(3);
      box.style.transform = `scale(${lerp(0.92, 1.04, p).toFixed(3)})`;
      const o = P.clock.querySelector('.cf-old'), n = P.clock.querySelector('.cf-new');
      o.textContent = ck.from; n.textContent = ck.to;
      const rp = ease.inOut(clamp((p - 0.18) / 0.5));
      o.style.transform = `translateY(${(-60 * rp).toFixed(1)}px)`; o.style.opacity = (1 - rp).toFixed(3);
      n.style.transform = `translateY(${(60 * (1 - rp)).toFixed(1)}px)`; n.style.opacity = rp.toFixed(3);
    } else P.clock.style.visibility = 'hidden';

    // proof
    const PR = data.proof;
    if (t >= PR.at && t < data.end.at + 0.6) {
      P.proof.style.visibility = 'visible';
      P.proof.style.opacity = ease.out(prog(t, PR.at, 0.18)).toFixed(3);
      let frame = null;
      for (const s of PR.seq) if (t >= s.at) {
        const k = s.to === s.from ? 0 : Math.min(1, (t - s.at) / s.dur);
        frame = Math.round(lerp(s.from, s.to, k));
      }
      const showHome = t < PR.home.until;
      P.home.style.visibility = showHome ? 'visible' : 'hidden';
      for (const k in P.frameImgs) P.frameImgs[k].style.visibility = !showHome && +k === frame ? 'visible' : 'hidden';
      P.proof.querySelectorAll('.pcover').forEach((c) => (c.style.visibility = !showHome && frame === 20 ? 'visible' : 'hidden'));
      if (!P._cov) { setStatus(P.cover, PR.statusCover.time, PR.statusCover.batt); P._cov = 1; }
    } else P.proof.style.visibility = 'hidden';

    return { lockAny };
  }

  window.QG.phone = { build, render, SW, SH, BEZEL, PX };
})();
