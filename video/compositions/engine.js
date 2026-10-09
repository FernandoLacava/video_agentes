// Seekable, deterministic timing helpers (no clocks, no randomness).
(function () {
  const QG = (window.QG = window.QG || {});

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, start, dur) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur));

  const ease = {
    linear: (p) => p,
    inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    out: (p) => 1 - Math.pow(1 - p, 3),
    outQuart: (p) => 1 - Math.pow(1 - p, 4),
    in: (p) => p * p * p,
    // short spring: small overshoot then settle
    back: (p) => {
      const c1 = 1.9, c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    },
    // stepped (pixel-art feel)
    steps: (n) => (p) => Math.floor(p * n) / n,
  };

  // Piecewise "go to target" track: keys [{at, value, dur, ease}] ; value(t) eases
  // from wherever the track was at key.at toward key.value.
  function track(keys, initial) {
    const ks = keys.slice().sort((a, b) => a.at - b.at);
    const startVals = [];
    let v = initial;
    for (let i = 0; i < ks.length; i++) {
      // value at ks[i].at given previous keys
      v = evalUpTo(i, ks[i].at);
      startVals[i] = v;
    }
    function evalUpTo(n, t) {
      let val = initial;
      for (let i = 0; i < n; i++) {
        const k = ks[i];
        if (t < k.at) break;
        const from = startVals[i];
        const p = (k.ease || ease.inOut)(prog(t, k.at, k.dur));
        val = typeof from === 'object' ? mix(from, k.value, p) : lerp(from, k.value, p);
      }
      return val;
    }
    return (t) => evalUpTo(ks.length, t);
  }
  function mix(a, b, p) {
    const o = {};
    for (const key in b) o[key] = lerp(a[key] ?? b[key], b[key], p);
    return o;
  }

  // Deterministic hash -> [0,1)
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // Inline markup: **bold**, //italic//, __underline__, ==highlight==
  let markCounter = 0;
  function inline(text) {
    let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/==(.+?)==/g, (_, x) => `<span class="mark" data-mark>${x}</span>`);
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/\/\/(.+?)\/\//g, '<i>$1</i>');
    s = s.replace(/__(.+?)__/g, '<u>$1</u>');
    return s;
  }

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  Object.assign(QG, { clamp, lerp, prog, ease, track, hash, inline, el });
})();
