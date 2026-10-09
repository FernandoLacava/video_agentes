"""Synthesized SFX + a quiet lo-fi bed, mixed against the cue list exported by the
composition (scripts/render.mjs cues). Everything is generated here (no downloads).

usage: python3 -I scripts/audio.py out/cues.json out/mix.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)  # seeded: deterministic


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, a=0.004, r=0.08, hold=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    rel_start = a + hold
    e = e * np.where(t > rel_start, np.exp(-(t - rel_start) / max(r, 1e-4)), 1)
    return e


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X * g, len(x))


def sine(freq, dur, phase=0):
    t = t_axis(dur)
    if callable(freq):
        ph = 2 * np.pi * np.cumsum(freq(t)) / SR
    else:
        ph = 2 * np.pi * freq * t
    return np.sin(ph + phase)


def square(freq, dur, duty=0.5):
    t = t_axis(dur)
    ph = (freq * t) % 1.0
    s = np.where(ph < duty, 1.0, -1.0)
    return fft_filter(s, hi=7000)  # tame aliasing


def note(n):  # MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)


def seq(notes, step, dur_each=None, wave_fn=square, rel=0.05):
    dur_each = dur_each or step
    total = step * (len(notes) - 1) + dur_each + 0.2
    out = np.zeros(int(SR * total))
    for i, n in enumerate(notes):
        s = wave_fn(note(n), dur_each)
        s = s * env(len(s), a=0.003, r=rel, hold=dur_each * 0.4)
        k = int(i * step * SR)
        out[k:k + len(s)] += s
    return out


def noise(dur):
    return rng.standard_normal(int(SR * dur))


# ---------------- SFX ----------------
def sfx_pop():
    d = 0.09
    s = sine(lambda t: 950 + 500 * np.minimum(1, t / 0.04), d) * env(int(SR * d), a=0.002, r=0.03)
    c = fft_filter(noise(0.01), lo=2000, hi=8000) * env(int(SR * 0.01), a=0.0005, r=0.003) * 0.3
    s[: len(c)] += c
    return s * 0.55


def sfx_sent():
    d = 0.16
    w = fft_filter(noise(d), lo=1500, hi=6000) * env(int(SR * d), a=0.03, r=0.04) * 0.25
    s = sine(lambda t: 520 + 900 * np.minimum(1, t / 0.12), d) * env(int(SR * d), a=0.01, r=0.05) * 0.5
    return (w + s) * 0.7


def sfx_notif():
    out = np.zeros(int(SR * 0.6))
    for i, (f, amp) in enumerate([(1318.5, 0.5), (1975.5, 0.42)]):
        d = 0.45
        tt = t_axis(d)
        tone = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt) + 0.1 * np.sin(2 * np.pi * 3.01 * f * tt))
        tone *= env(len(tt), a=0.003, r=0.16) * amp
        k = int(i * 0.11 * SR)
        out[k:k + len(tone)] += tone
    return out * 0.6


def sfx_tick():
    out = np.zeros(int(SR * 0.3))
    for i, f in enumerate([3200, 2400]):
        c = fft_filter(noise(0.02), lo=f * 0.6, hi=f * 1.5) * env(int(SR * 0.02), a=0.0005, r=0.004)
        k = int(i * 0.13 * SR)
        out[k:k + len(c)] += c * 0.9
    return out


def sfx_whoosh(d=0.38, amp=0.35):
    n = noise(d)
    tt = t_axis(d)
    # crude sweep: blend a low-passed and a high-passed copy over time
    lo = fft_filter(n, lo=300, hi=1500)
    hi = fft_filter(n, lo=1500, hi=6000)
    k = tt / d
    s = lo * (1 - k) + hi * k
    e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    return s * e * amp


def sfx_dive():
    w = sfx_whoosh(0.42, 0.3)
    th = sine(lambda t: 140 - 80 * np.minimum(1, t / 0.2), 0.25) * env(int(SR * 0.25), a=0.005, r=0.08) * 0.35
    out = np.zeros(max(len(w), int(SR * 0.6)))
    out[: len(w)] += w
    k = int(0.3 * SR)
    out[k:k + len(th)] += th
    return out


def sfx_select():
    return seq([84, 91], 0.05, 0.05, rel=0.03) * 0.16


def sfx_panel():
    return seq([72, 76, 79], 0.055, 0.06, rel=0.03) * 0.14


def sfx_quest_new():
    return seq([72, 76, 79, 84, 88], 0.07, 0.08, rel=0.05) * 0.16


def sfx_quest_done():
    a = seq([79, 84, 88, 91], 0.09, 0.09, rel=0.05)
    b = seq([96], 0.1, 0.42, rel=0.25)
    out = np.zeros(len(a) + len(b))
    out[: len(a)] += a
    k = int(0.36 * SR)
    out[k:k + len(b)] += b
    return out * 0.16


def sfx_check():
    return seq([84, 88], 0.06, 0.07, rel=0.04) * 0.14


def sfx_cancel():
    return seq([60, 55], 0.05, 0.06, rel=0.03, wave_fn=lambda f, d: square(f, d, 0.25)) * 0.1


def sfx_blink():
    return seq([81, 81, 81], 0.2, 0.06, rel=0.03) * 0.11


def sfx_route():
    return seq([76, 83], 0.045, 0.05, rel=0.03, wave_fn=lambda f, d: square(f, d, 0.25)) * 0.12


def sfx_huh():
    d = 0.32
    s = square(1, d)  # placeholder length
    tt = t_axis(d)
    f = np.where(tt < 0.12, note(69), note(69) + (note(76) - note(69)) * np.clip((tt - 0.14) / 0.12, 0, 1))
    ph = np.cumsum(f) / SR % 1.0
    s = fft_filter(np.where(ph < 0.5, 1.0, -1.0), hi=6000) * env(len(tt), a=0.004, r=0.08, hold=0.18)
    gap = (tt > 0.12) & (tt < 0.15)
    s[gap] *= 0.0
    return s * 0.14


def sfx_label():
    return seq([88], 0.05, 0.045, rel=0.02) * 0.1


def sfx_cta():
    return sfx_notif() * 0.6


SFX = {k[4:]: v for k, v in globals().items() if k.startswith('sfx_')}


# ---------------- bed ----------------
def bed(duration, bpm=92):
    n = int(SR * duration)
    out = np.zeros(n + SR * 2)
    beat = 60 / bpm
    # Dm9 - G13 - Cmaj9 - Am9 (warm, unobtrusive)
    chords = [[50, 57, 60, 64, 65], [43, 53, 57, 59, 64], [48, 55, 59, 62, 64], [45, 55, 60, 64, 67]]
    bar = beat * 4
    t_all = np.arange(len(out)) / SR
    pad = np.zeros(len(out))
    i = 0
    while i * bar < duration + bar:
        ch = chords[i % 4]
        k0 = int(i * bar * SR)
        L = int(bar * SR * 1.15)
        tt = np.arange(L) / SR
        seg = np.zeros(L)
        for m in ch[1:]:
            for det in (-0.07, 0.07):
                f = note(m) * 2 ** (det / 12)
                seg += 2 * ((f * tt) % 1.0) - 1  # saw
        e = np.minimum(1, tt / 0.6) * np.minimum(1, np.maximum(0, (L / SR - tt) / 0.5))
        seg *= e
        end = min(len(pad), k0 + L)
        if end <= k0:
            break
        pad[k0:end] += seg[: end - k0]
        # bass on beats 1 and 3
        for b in (0, 2):
            kb = k0 + int(b * beat * SR)
            Lb = int(beat * 1.6 * SR)
            tb = np.arange(Lb) / SR
            bs = np.sin(2 * np.pi * note(ch[0] - 12) * tb) * np.exp(-tb / 0.5) * np.minimum(1, tb / 0.01)
            endb = min(len(pad), kb + Lb)
            if endb <= kb:
                continue
            out[kb:endb] += bs[: endb - kb] * 0.22
        i += 1
    pad = fft_filter(pad, lo=120, hi=1100) * 0.018
    # slow wobble (lo-fi)
    pad *= 1 + 0.08 * np.sin(2 * np.pi * 0.4 * t_all)
    out += pad
    # drums
    nb = int((duration + 2) / beat)
    for b in range(nb):
        k = int(b * beat * SR)
        if b % 2 == 0:  # soft kick
            L = int(0.25 * SR)
            tk = np.arange(L) / SR
            kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tk / 0.03)) * tk) * np.exp(-tk / 0.12)
            out[k:k + L] += kick[: max(0, min(L, len(out) - k))] * 0.4
        if b % 4 == 1 or b % 4 == 3:  # rim/snare, quiet
            L = int(0.12 * SR)
            sn = fft_filter(rng.standard_normal(L), lo=1500, hi=5000) * np.exp(-np.arange(L) / SR / 0.04)
            out[k:k + L] += sn[: max(0, min(L, len(out) - k))] * 0.05
        for h in (0, 0.5):  # hats
            kh = k + int(h * beat * SR)
            L = int(0.04 * SR)
            hh = fft_filter(rng.standard_normal(L), lo=7000, hi=14000) * np.exp(-np.arange(L) / SR / 0.012)
            if kh + L < len(out):
                out[kh:kh + L] += hh * (0.035 if h == 0 else 0.022)
    return out[:n]


def main():
    cues_path, out_path = sys.argv[1], sys.argv[2]
    data = json.load(open(cues_path))
    dur = data['duration']
    n = int(SR * dur)
    fx = np.zeros(n + SR * 2)
    cache = {}
    for c in data['cues']:
        name = c['sfx']
        if name not in cache:
            cache[name] = SFX[name]()
        s = cache[name]
        k = int(max(0.0, c['at']) * SR)
        e = min(len(fx), k + len(s))
        fx[k:e] += s[: e - k]
    fx = fx[:n]

    b = bed(dur)
    # duck the bed under effects (envelope follower on the fx bus)
    a = np.abs(fx)
    win = int(0.05 * SR)
    kern = np.ones(win) / win
    follow = np.convolve(a, kern, mode='same')
    follow = np.convolve(follow, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')
    duck = 1 - 0.5 * np.clip(follow / 0.05, 0, 1)
    b = b * duck
    # fades
    tt = np.arange(n) / SR
    fade = np.minimum(1, tt / 0.6) * np.clip((dur - tt) / 2.2, 0, 1)
    b *= fade
    mix = fx + b * 0.55
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.7 if peak > 0 else mix
    stereo = np.stack([mix, mix], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype('<i2')
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    # also write stems for measurement
    for name, sig in (('fx', fx / (peak or 1) * 0.7), ('bed', b * 0.55 / (peak or 1) * 0.7)):
        p = out_path.replace('.wav', f'_{name}.wav')
        pc = (np.clip(np.stack([sig, sig], 1), -1, 1) * 32767).astype('<i2')
        with wave.open(p, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pc.tobytes())
    print('wrote', out_path, 'cues', len(data['cues']))


if __name__ == '__main__':
    main()
