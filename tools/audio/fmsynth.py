#!/usr/bin/env python3
"""Genesis-style (YM2612-like FM + PSG noise) demo renderer for Global Ideology.
Original composition. Renders main loop, win and lose cues to WAV, then MP3 via ffmpeg.
Usage: python3 fmsynth.py <out_dir>
"""
import sys, os, subprocess
import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a=0.005, d=0.1, s=0.6, r=0.1, length=None):
    length = length or n / SR
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    dmask = (t >= a) & (t < a + d)
    e = np.where(dmask, 1 - (1 - s) * (t - a) / max(d, 1e-6), e)
    e = np.where(t >= a + d, s, e)
    rel = t > length - r
    e = np.where(rel, e * np.clip((length - t) / max(r, 1e-6), 0, 1), e)
    return e


def fm(freq, dur, ratio=1.0, index=2.0, idx_decay=6.0, fb=0.0, a=0.003, d=0.15, s=0.5, r=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod_env = index * np.exp(-idx_decay * t)
    mod = np.sin(2 * np.pi * freq * ratio * t)
    if fb:
        mod = np.sin(2 * np.pi * freq * ratio * t + fb * mod)
    car = np.sin(2 * np.pi * freq * t + mod_env * mod)
    return car * env_adsr(n, a, d, s, r, dur)


def kick(dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-28 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-7 * t) * 1.1


def noise_hit(dur, decay, hp=True):
    n = int(dur * SR)
    # PSG-like noise: sample-and-hold at lower rate
    step = 3
    x = np.repeat(rng.choice([-1.0, 1.0], n // step + 1), step)[:n]
    if hp:
        x = np.diff(np.concatenate([[0], x]))
    return x * np.exp(-decay * np.arange(n) / SR)


def snare(dur=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-25 * t)
    return 0.5 * tone + 0.45 * noise_hit(dur, 18, hp=False)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def lofi(x, crush_rate=26000, bits=10):
    # Genesis DAC flavour: sample-and-hold decimation + mild quantisation
    step = SR / crush_rate
    idx = (np.floor(np.arange(len(x)) / step) * step).astype(int)
    x = x[np.clip(idx, 0, len(x) - 1)]
    q = 2 ** (bits - 1)
    return np.round(x * q) / q


def delay(x, t=0.375, fb=0.35, mix=0.25):
    d = int(t * SR); y = x.copy()
    for k in range(1, 5):
        g = (fb ** k) * mix
        y[d * k:] += x[: len(x) - d * k] * g
    return y


def stereo(l, r):
    return np.stack([l, r], axis=1)


def normalize(st, peak=0.89):
    m = np.max(np.abs(st)) or 1
    return st / m * peak


def write(path, st):
    import wave
    data = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------- MAIN LOOP: D minor, 100 BPM, 16 bars ----------------
def main_loop():
    bpm = 100; beat = 60 / bpm; bar = 4 * beat; bars = 16
    L = np.zeros(int(bars * bar * SR) + SR); R = L.copy()
    roots = [38, 38, 34, 36] * 4          # D2 D2 Bb1 C2 progression (i i VI VII)
    bass_pat = [0, None, 0, 12, None, 0, 7, None, 0, None, 0, 12, None, 3, None, 10]  # 16ths
    for b in range(bars):
        t0 = b * bar
        # drums
        for q in range(4):
            place(L, kick(), t0 + q * beat, 0.9); place(R, kick(), t0 + q * beat, 0.9)
        for q in (1, 3):
            if b >= 2:
                s = snare(); place(L, s, t0 + q * beat, 0.35); place(R, s, t0 + q * beat, 0.45)
        for e in range(8):
            if b >= 1:
                h = noise_hit(0.05, 70 if e % 2 else 120)
                place(L if e % 2 else R, h, t0 + e * beat / 2 + beat / 4, 0.12)
        # FM slap bass
        root = roots[b]
        for i, step in enumerate(bass_pat):
            if step is None:
                continue
            n = fm(midi(root + step), beat / 4 * 0.95, ratio=1.0, index=3.2, idx_decay=14, fb=0.6, d=0.08, s=0.4)
            place(L, n, t0 + i * beat / 4, 0.32); place(R, n, t0 + i * beat / 4, 0.32)
        # dark pad (detuned FM, slow)
        chord = {38: [50, 53, 57], 34: [46, 50, 53], 36: [48, 52, 55]}[root]
        if b >= 4:
            for k, nn in enumerate(chord):
                p = fm(midi(nn) * (1.003 if k % 2 else 0.997), bar, ratio=2.0, index=0.8, idx_decay=0.5, a=0.4, d=0.5, s=0.7, r=0.6)
                place(L if k != 1 else R, p, t0, 0.07); place(R if k != 1 else L, p, t0, 0.04)
        # FM bell lead, sparse, bars 8-15
        if b >= 8:
            mel = {0: [(0, 62), (1.5, 65), (3, 64)], 1: [(0, 62), (2, 57)], 2: [(0, 58), (1.5, 62), (3, 60)], 3: [(0, 60), (2, 64)]}[b % 4]
            for when, nn in mel:
                bell = fm(midi(nn + 12), beat * 1.4, ratio=3.5, index=4, idx_decay=5, d=0.4, s=0.15, r=0.3)
                place(L, bell, t0 + when * beat, 0.10); place(R, bell, t0 + when * beat + 0.012, 0.08)
    n = int(bars * bar * SR)
    L, R = delay(L[:n]), delay(R[:n], t=0.36)
    return normalize(stereo(lofi(L), lofi(R)))


# ---------------- WIN: cold triumph, D minor -> F major lift, ~14 s ----------------
def win_cue():
    bpm = 100; beat = 60 / bpm
    dur = 14; L = np.zeros(int(dur * SR)); R = L.copy()
    seq = [(0, [50, 53, 57]), (2, [46, 50, 53]), (4, [48, 52, 55]), (6, [53, 57, 60, 65])]
    for bt, ch in seq:
        for k, nn in enumerate(ch):
            brass = fm(midi(nn), beat * (2 if bt < 6 else 10), ratio=1.0, index=2.2, idx_decay=1.5, fb=0.4, a=0.02, d=0.3, s=0.7, r=1.5)
            place(L, brass, bt * beat + k * 0.01, 0.12); place(R, brass, bt * beat + k * 0.015, 0.12)
        place(L, kick(0.6), bt * beat, 0.9); place(R, kick(0.6), bt * beat, 0.9)
    for i, nn in enumerate([65, 69, 72, 77]):
        bell = fm(midi(nn + 12), 3, ratio=3.5, index=4, idx_decay=3, d=0.6, s=0.2, r=1.0)
        place(L, bell, 6 * beat + i * beat / 2, 0.09); place(R, bell, 6 * beat + i * beat / 2 + 0.02, 0.09)
    L, R = delay(L, 0.45, 0.45, 0.3), delay(R, 0.43, 0.45, 0.3)
    return normalize(stereo(lofi(L), lofi(R)))


# ---------------- LOSE: slow descent, detuned, ~14 s ----------------
def lose_cue():
    dur = 14; L = np.zeros(int(dur * SR)); R = L.copy()
    beat = 60 / 70
    line = [62, 61, 60, 58, 57, 55, 53, 50]
    for i, nn in enumerate(line):
        t = i * beat
        v = fm(midi(nn) * (1 - 0.004 * i), beat * 1.8, ratio=2.0, index=1.5, idx_decay=1.0, fb=0.2, a=0.05, d=0.4, s=0.5, r=0.6)
        place(L, v, t, 0.18); place(R, v, t + 0.02, 0.14)
        if i % 2 == 0:
            place(L, kick(0.8), t, 0.6); place(R, kick(0.8), t, 0.6)
    drone = fm(midi(38), dur - 1, ratio=0.5, index=1.2, idx_decay=0.2, a=1.0, d=1, s=0.8, r=3)
    place(L, drone, 0.5, 0.25); place(R, drone * 0.9, 0.5, 0.25)
    place(L, noise_hit(4, 1.2, hp=False) * 0.3, len(line) * beat, 0.3)
    L, R = delay(L, 0.6, 0.5, 0.35), delay(R, 0.57, 0.5, 0.35)
    return normalize(stereo(lofi(L, 22000, 9), lofi(R, 22000, 9)))


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(out, exist_ok=True)
    for name, fn in (('gi-main-loop-demo', main_loop), ('gi-win-demo', win_cue), ('gi-lose-demo', lose_cue)):
        wav = os.path.join(out, name + '.wav'); mp3 = os.path.join(out, name + '.mp3')
        write(wav, fn())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-b:a', '160k', mp3], check=True)
        os.remove(wav)
        print('[ok]', mp3, os.path.getsize(mp3) // 1024, 'KB')
