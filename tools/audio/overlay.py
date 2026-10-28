#!/usr/bin/env python3
"""Adds FM keys (electric-piano style) and FM bells onto Pavel's AI main loop, locked to its beat grid.
Usage: python3 overlay.py <in.mp3> <beats.npy> <out.mp3>
"""
import sys, subprocess, numpy as np
import fmsynth as fs

SR = 48000
fs.SR = SR


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).copy()


def epiano(freq, dur):
    # Genesis-style FM e-piano: body (1:1) + tine (14:1, fast decay)
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * freq * t + 1.6 * np.exp(-4 * t) * np.sin(2 * np.pi * freq * t))
    tine = np.sin(2 * np.pi * freq * t + 0.9 * np.exp(-30 * t) * np.sin(2 * np.pi * freq * 14 * t))
    env = np.minimum(1, t / 0.004) * np.exp(-2.2 * t)
    tail = np.clip((dur - t) / 0.05, 0, 1)
    return (0.75 * body + 0.35 * tine) * env * tail


def bell(freq, dur):
    return fs.fm(freq, dur, ratio=3.5, index=4, idx_decay=5, d=0.4, s=0.15, r=0.3)


def main(src, beats_path, out):
    song = load(src)
    beats = np.load(beats_path)
    N = len(song)
    L = np.zeros(N + SR * 4); R = L.copy()
    # beat grid: detected beats, extended with the median spacing; bar 1 starts on detected beat index 2
    ibi = float(np.median(np.diff(beats)))
    grid = list(beats)
    while grid[-1] + ibi < N / SR:
        grid.append(grid[-1] + ibi)
    grid = np.array(grid[2:])
    nbars = len(grid) // 4

    def at(bar, beat):  # beat may be fractional
        i = bar * 4 + int(beat)
        if i + 1 >= len(grid):
            return None
        return grid[i] + (beat - int(beat)) * (grid[i + 1] - grid[i])

    A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5 = 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81
    # keys: minor-pentatonic voicings over the A pedal, 4-bar cycle
    keys_cycle = [[A3, C4, E4], [A3, D4, E4], [G4 - 12, C4, E4], [A3, C4, D4]]
    keys_rhythm = [0, 1.5, 2.5, 3.5]          # offbeat stabs
    bell_phr = [
        [(0, E5), (1.5, G5), (3, A5)], [(0, G5), (2, E5)],
        [(0, D5), (1.5, E5), (3, C5)], [(0, D5), (2, A4)],
    ]
    for b in range(nbars):
        last = b >= nbars - 2                  # thin out at the loop seam
        sect_break = 36 <= b < 44
        if b >= 16 and not last:
            ch = keys_cycle[b % 4]
            for k, bt in enumerate(keys_rhythm):
                if sect_break and k % 2:
                    continue
                t0 = at(b, bt)
                if t0 is None:
                    continue
                for j, nn in enumerate(ch):
                    s = epiano(fs.midi(nn), 0.55)
                    fs.place(L, s, t0 + j * 0.004, 0.09 if j != 1 else 0.06)
                    fs.place(R, s, t0 + j * 0.006, 0.06 if j != 1 else 0.09)
        if b >= 8 and not last:
            for bt, nn in bell_phr[b % 4]:
                if sect_break and bt > 0:
                    continue
                t0 = at(b, bt)
                if t0 is None:
                    continue
                s = bell(fs.midi(nn + 12), ibi * 1.4)
                fs.place(L, s, t0, 0.10); fs.place(R, s, t0 + 0.012, 0.08)

    L = fs.delay(L, ibi * 0.75, 0.35, 0.25)[:N]
    R = fs.delay(R, ibi * 0.75 - 0.015, 0.35, 0.25)[:N]
    layer = np.stack([fs.lofi(L), fs.lofi(R)], axis=1)
    # level: layer RMS at ~38% of the song's RMS (≈ -8 dB under the track)
    target = 0.38 * np.sqrt(np.mean(song ** 2))
    layer *= target / (np.sqrt(np.mean(layer[layer.any(axis=1)] ** 2)) + 1e-9)
    mix = song + layer
    peak = np.max(np.abs(mix))
    if peak > 0.97:
        mix *= 0.97 / peak
    raw = mix.astype('<f4').tobytes()
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-',
                    '-b:a', '192k', out], input=raw, check=True)
    print('[ok]', out, 'bars', nbars, 'bar1 at', round(grid[0], 3), 's, ibi', round(ibi, 4), 'peak', round(float(peak), 3))


if __name__ == '__main__':
    main(*sys.argv[1:4])
