// Recreated Telegram chat: bubbles (received / sent), code block, file attachment,
// typing indicator, block-by-block reveal and eased auto-scroll. Units are iOS points
// (the phone screen is 440 x 956 pt, the same logical size as the source prints).
(function () {
  const { el, inline, hash, clamp, prog, ease, lerp, track } = window.QG;

  const LINE = 21.5;
  const HEADER_BOTTOM = 112;

  // Generic placeholder for the blurred GPT prompt blocks: never the real prompt.
  const CODE_FILLER = [
    'Você vai me ajudar a executar o meu trabalho de', 'hoje. Contexto, papel, objetivo e prazos estão', 'descritos abaixo, em blocos curtos e objetivos.',
    '', 'Contexto: resumo da comanda do dia, o que já', 'foi feito ontem e o que ficou pendente para a', 'equipe resolver antes do próximo encontro.',
    '', 'Tarefas: 1. organizar a lista principal; 2. montar', 'a mensagem de continuidade; 3. propor o plano', 'de conteúdo; 4. listar riscos e responsáveis;',
    '5. registrar aprendizados e próximos passos.', '', 'Regras: use só as informações que eu fornecer,', 'não invente dados e avise quando faltar algo.',
    'Escreva em português, de forma objetiva.', '', 'Quando eu escrever "fechar o dia", gere um', 'relatório com cada tarefa marcada como feita,', 'parcial ou não feita e o que ficou pendente.',
    '', 'Formato da resposta: tópicos curtos, sem', 'introdução, com prazos no fim de cada item.'
  ];

  function lineNode(raw, ctx) {
    if (raw === '') return el('div', 'ln sp');
    if (raw.startsWith('!sk:')) {
      const n = +raw.slice(4);
      const wrap = el('div', 'skel');
      for (let i = 0; i < n; i++) {
        const w = i === n - 1 ? 35 + hash(ctx.seed + i) * 40 : 82 + hash(ctx.seed + i * 3) * 18;
        const bar = el('div', 'skbar');
        bar.style.width = w.toFixed(1) + '%';
        wrap.appendChild(bar);
      }
      ctx.seed += 17;
      return wrap;
    }
    if (raw.startsWith('!code:')) {
      const n = +raw.slice(6);
      const box = el('div', 'code');
      const inner = el('div', 'code-in');
      for (let i = 0; i < n; i++) inner.appendChild(el('div', 'cl', CODE_FILLER[(i + ctx.seed) % CODE_FILLER.length] || '&nbsp;'));
      box.appendChild(inner);
      box.appendChild(el('div', 'code-ic', '&lt;/&gt;'));
      ctx.seed += 5;
      return box;
    }
    if (raw.startsWith('>')) return el('div', 'ln link', inline(raw.slice(1)));
    if (raw.startsWith('## ')) return el('div', 'ln h2', inline('==' + raw.slice(3) + '=='));
    return el('div', 'ln', inline(raw));
  }

  function build(content, data) {
    const agents = data.agents;
    const msgs = [];
    const ctx = { seed: 3 };

    const top = el('div', 'chat-pad');
    content.appendChild(top);

    let prevFrom = null;
    data.messages.forEach((m, idx) => {
      const pre = [];
      if (m.dateChip) pre.push(content.appendChild(el('div', 'datechip', `<span>${m.dateChip}</span>`)));
      if (m.divider) {
        pre.push(content.appendChild(el('div', 'divider', m.divider)));
        prevFrom = null;
      }
      const recv = m.from !== 'me';
      const row = el('div', 'row ' + (recv ? 'recv' : 'sent') + (m.big ? ' big' : '') + (m.file ? ' hasfile' : ''));
      const bub = el('div', 'bubble');
      if (recv && m.showName !== false) {
        const nm = el('div', 'name', agents[m.from].name);
        nm.style.color = agents[m.from].color;
        bub.appendChild(nm);
      }
      if (m.file) {
        const f = el('div', 'file');
        f.innerHTML = `<div class="ficon"><svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="currentColor"/><path d="M14 2v5h5" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55"/></svg></div>
          <div class="fmeta"><div class="fname">${m.file.name}</div><div class="fsize">${m.file.size}</div></div>`;
        bub.appendChild(f);
      }
      const body = el('div', 'body');
      const lines = m.lines.map((raw) => {
        const n = lineNode(raw, ctx);
        body.appendChild(n);
        return n;
      });
      // trailing space for the time stamp
      const last = lines[lines.length - 1];
      if (last && last.classList.contains('ln')) last.appendChild(el('span', 'tspace' + (recv ? '' : ' me')));
      bub.appendChild(body);
      const ts = el('div', 'ts', m.time + (recv ? '' : ' <svg class="chk" viewBox="0 0 18 10"><path d="M1 5.5l3 3L10 1.5M7 8.5l1 0.8L16.5 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'));
      bub.appendChild(ts);
      row.appendChild(bub);

      let av = null;
      if (recv && m.avatar !== false) {
        av = el('img', 'av');
        av.src = agents[m.from].avatar;
        row.appendChild(av);
      }
      content.appendChild(row);
      const marks = Array.from(bub.querySelectorAll('[data-mark]'));
      msgs.push({ m, row, bub, av, lines, marks, recv, idx, pre });
      prevFrom = m.from;
    });
    content.appendChild(el('div', 'chat-tail'));

    const typing = el('div', 'row recv typing-row');
    typing.innerHTML = '<div class="bubble typing"><i></i><i></i><i></i></div>';
    const tav = el('img', 'av');
    typing.appendChild(tav);
    content.appendChild(typing);

    return { msgs, typing, tav };
  }

  function measure(chat) {
    for (const g of chat.msgs) {
      g.top = g.row.offsetTop;
      g.h = g.row.offsetHeight;
      const bubTop = g.bub.offsetTop;
      g.lineBottoms = g.lines.map((n) => bubTop + n.offsetTop + n.offsetHeight);
      g.lineTops = g.lines.map((n) => bubTop + n.offsetTop);
      g.full = g.h;
    }
  }

  // Revealed height of message g at time t (pt, relative to row top).
  function revealHeight(g, t) {
    const m = g.m;
    if (!m.reveal) return g.full;
    const steps = m.reveal;
    let h = 0;
    for (let i = 0; i < steps.length; i++) {
      const [lineIdx, at] = steps[i];
      if (t < at) break;
      const isLast = i === steps.length - 1 && lineIdx >= g.lines.length - 1;
      const target = isLast ? g.full : g.lineBottoms[lineIdx] + 8;
      const prev = h;
      const p = ease.out(prog(t, at, 0.28));
      h = lerp(i === 0 ? target : prev, target, p);
    }
    return h;
  }
  function fullyRevealedAt(g) {
    const m = g.m;
    if (!m.reveal) return m.at;
    return m.reveal[m.reveal.length - 1][1];
  }

  function scrollTrack(chat, anchor) {
    const keys = [];
    const viewTop = HEADER_BOTTOM + 8;
    const bottomTo = (y) => y - anchor;
    for (const g of chat.msgs) {
      const m = g.m;
      if (m.typing != null) keys.push({ at: m.typing, value: bottomTo(g.top + 44), dur: 0.35 });
      if (m.scroll) {
        for (const s of m.scroll) {
          const y = g.top + (g.lineTops[s.line] ?? 0);
          const screenY = viewTop + s.align * (anchor - viewTop);
          let v = y - screenY;
          if (s.align >= 0.97) v = bottomTo(g.top + g.full + 6);
          keys.push({ at: s.at, value: v, dur: s.dur });
        }
        continue;
      }
      if (m.reveal) {
        m.reveal.forEach(([li, at], i) => {
          const isLast = i === m.reveal.length - 1;
          const y = isLast ? g.top + g.full + 6 : g.top + g.lineBottoms[li] + 14;
          keys.push({ at, value: bottomTo(y), dur: 0.42 });
        });
      } else {
        keys.push({ at: m.at, value: bottomTo(g.top + g.full + 6), dur: 0.42 });
      }
    }
    keys.forEach((k) => (k.value = Math.max(0, k.value)));
    return track(keys, 0);
  }

  function render(chat, t, opts) {
    const { scroll, screenH, agents } = opts;
    let typingOn = null;
    for (const g of chat.msgs) {
      const m = g.m;
      const style = g.row.style;
      if (m.typing != null && t >= m.typing && t < m.at) typingOn = g;
      const preOn = t >= Math.min(m.at, m.typing ?? m.at);
      g.pre.forEach((n) => (n.style.visibility = preOn ? 'visible' : 'hidden'));
      if (t < m.at) {
        style.visibility = 'hidden';
        continue;
      }
      style.visibility = 'visible';
      // entrance spring
      const p = prog(t, m.at, 0.4);
      const s = lerp(0.9, 1, ease.back(p));
      const y = (1 - ease.out(p)) * 14;
      g.bub.style.transform = `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
      g.bub.style.opacity = clamp(p * 3).toFixed(3);
      // glow on the freshly arrived bubble
      const glow = Math.max(0, 1 - (t - fullyRevealedAt(g)) / 1.3) * (t >= m.at ? 1 : 0);
      const col = g.recv ? agents[m.from].glow : '120,90,255';
      g.bub.style.boxShadow = `0 2px 6px rgba(0,0,0,.35), 0 0 ${(22 * glow).toFixed(1)}px rgba(${col},${(0.55 * glow).toFixed(3)})`;
      // block-by-block reveal
      const h = revealHeight(g, t);
      const cut = Math.max(0, g.full - h);
      g.bub.style.clipPath = cut > 0.5 ? `inset(0 0 ${cut.toFixed(1)}px 0 round 18px)` : 'none';
      if (g.av) g.av.style.transform = `translateY(${(-cut).toFixed(1)}px)`;
      // sent bubble gradient fixed to the screen (Telegram behaviour)
      if (!g.recv) {
        const sy = g.top + g.bub.offsetTop - scroll;
        g.bub.style.backgroundPosition = `0 ${(-sy).toFixed(1)}px`;
      }
      // highlight sweeps
      if (m.marks) {
        g.marks.forEach((mk, i) => {
          const at = m.marks[Math.min(i, m.marks.length - 1)];
          const mp = ease.out(prog(t, at, 0.4));
          mk.style.setProperty('--p', mp.toFixed(3));
        });
      }
    }
    // typing indicator
    const ty = chat.typing;
    if (typingOn) {
      ty.style.visibility = 'visible';
      ty.style.top = typingOn.top + 'px';
      chat.tav.src = agents[typingOn.m.from].avatar;
      const tp = prog(t, typingOn.m.typing, 0.25);
      ty.style.opacity = ease.out(tp).toFixed(3);
      const dots = ty.querySelectorAll('i');
      dots.forEach((d, i) => {
        const ph = (t - typingOn.m.typing) * 6.5 - i * 0.9;
        const v = 0.5 + 0.5 * Math.sin(ph);
        d.style.opacity = (0.35 + 0.65 * v).toFixed(3);
        d.style.transform = `translateY(${(-2.2 * v).toFixed(2)}px)`;
      });
    } else ty.style.visibility = 'hidden';
    return typingOn;
  }

  window.QG.chat = { build, measure, scrollTrack, render, HEADER_BOTTOM };
})();
