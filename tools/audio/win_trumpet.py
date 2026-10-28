#!/usr/bin/env python3
"""Win cue v2: FM-synth trumpet fanfare, Genesis style, dark/cold triumph. A minor -> A major.
Usage: python3 win_trumpet.py <out.mp3>
"""
import sys, subprocess, numpy as np
import fmsynth as fs

SR = 48000
fs.SR = SR
BPM = 96
B = 60 / BPM


def trumpet(note, dur, vel=1.0, detune=0.0, vib=True):
    """FM brass: 1:1 carrier/modulator; modulation index tracks the amplitude envelope (brighter as it swells),
    pitch scoop at attack, delayed vibrato, a little operator feedback for the rasp."""
    n = int(dur * SR); t = np.arange(n) / SR
    f0 = fs.midi(note) * (1 + detune)
    scoop = 1 - 0.018 * np.exp(-t / 0.035)                       # starts ~30 cents flat
    vibr = 1 + (0.0045 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.25) / 0.3, 0, 1) if vib else 0)
    f = f0 * scoop * vibr
    ph = 2 * np.pi * np.cumsum(f) / SR
    amp = np.minimum(1, t / 0.045) * (0.82 + 0.18 * np.exp(-6 * t))
    amp *= np.clip((dur - t) / 0.08, 0, 1)
    idx = 0.6 + 3.4 * amp * vel                                   # brightness follows loudness
    mod = np.sin(ph)
    mod = np.sin(ph + 0.55 * mod)                                 # feedback-ish rasp
    car = np.sin(ph + idx * mod)
    return car * amp * vel


def timp(note, dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = fs.midi(note) * (1 + 0.05 * np.exp(-30 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph + 1.5 * np.exp(-8 * t) * np.sin(ph * 1.5)) * np.exp(-3.5 * t)


def snare_roll(L, R, start, beats, gain):
    step = B / 8
    k = int(beats * B / step)
    for i in range(k):
        g = gain * (0.35 + 0.65 * i / k)
        s = fs.noise_hit(0.06, 45, hp=False)
        fs.place(L, s, start + i * step, g); fs.place(R, s, start + i * step + 0.003, g)


def main(out):
    dur = 15.5
    L = np.zeros(int(dur * SR)); R = L.copy()

    def tp(note, beat, length, vel=1.0):
        t0 = beat * B
        a = trumpet(note, length * B * 0.95, vel)
        b = trumpet(note, length * B * 0.95, vel * 0.8, detune=0.0035)  # second trumpet, slightly sharp
        fs.place(L, a, t0, 0.20); fs.place(R, a, t0 + 0.01, 0.13)
        fs.place(R, b, t0 + 0.006, 0.18); fs.place(L, b, t0 + 0.016, 0.10)

    def lowbrass(notes, beat, length, vel=0.8):
        for nn in notes:
            s = trumpet(nn, length * B * 0.97, vel, vib=False)
            fs.place(L, s, beat * B, 0.10); fs.place(R, s, beat * B + 0.012, 0.10)

    # snare roll lead-in
    snare_roll(L, R, 0, 2, 0.18)
    # bar 1-2: call (A minor), low brass under it
    A4, B4, C5, D5, E5, G5, A5, Cs5, E4 = 69, 71, 72, 74, 76, 79, 81, 73, 64
    lowbrass([45, 52], 2, 4)
    for nn, bt, ln in [(A4, 2, 0.5), (A4, 2.5, 0.5), (E5, 3, 1.5), (D5, 4.5, 0.5), (C5, 5, 0.5), (B4, 5.5, 0.5)]:
        tp(nn, bt, ln)
    fs.place(L, timp(33), 2 * B, 0.5); fs.place(R, timp(33), 2 * B, 0.5)
    # bar 2-3: answer over F, then G
    lowbrass([41, 48], 6, 2); lowbrass([43, 50], 8, 2)
    for nn, bt, ln in [(C5, 6, 1), (A4, 7, 1), (D5, 8, 0.5), (E5, 8.5, 0.5), (G5, 9, 1)]:
        tp(nn, bt, ln)
    fs.place(L, timp(29), 6 * B, 0.45); fs.place(R, timp(31), 8 * B, 0.45)
    snare_roll(L, R, 9 * B, 1, 0.22)
    # bar 4+: resolution to A major, held — the "cold" triumph
    lowbrass([45, 52, 57], 10, 8, 0.9)
    for nn, bt, ln in [(A4, 10, 0.5), (Cs5, 10.5, 0.5), (E5, 11, 0.5), (A5, 11.5, 7)]:
        tp(nn, bt, ln, 1.0)
    tp(Cs5 + 12 - 12, 11.5, 7, 0.6)                 # harmony third under the top A
    fs.place(L, timp(33, 2.5), 10 * B, 0.6); fs.place(R, timp(33, 2.5), 10 * B, 0.6)
    fs.place(L, fs.kick(0.6), 10 * B, 0.8); fs.place(R, fs.kick(0.6), 10 * B, 0.8)
    for i, nn in enumerate([A5, Cs5 + 12, E5 + 12, A5 + 12]):   # bells sparkle at the end
        s = fs.fm(fs.midi(nn), 2.5, ratio=3.5, index=4, idx_decay=3, d=0.6, s=0.2, r=1.0)
        fs.place(L, s, (11.5 + i * 0.5) * B, 0.06); fs.place(R, s, (11.5 + i * 0.5) * B + 0.02, 0.06)

    L = fs.delay(L, 0.42, 0.42, 0.28); R = fs.delay(R, 0.40, 0.42, 0.28)
    st = fs.normalize(np.stack([fs.lofi(L, 28000, 10), fs.lofi(R, 28000, 10)], axis=1))
    # gentle fade at the end
    fade = int(1.2 * SR); st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    raw = st.astype('<f4').tobytes()
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', '-b:a', '192k', out],
                   input=raw, check=True)
    print('[ok]', out)


if __name__ == '__main__':
    main(sys.argv[1])
