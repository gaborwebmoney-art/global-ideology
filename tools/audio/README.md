# Game audio sources (v10.24)

Original Genesis-style FM music, rendered offline with numpy (`pip install numpy librosa`, ffmpeg on PATH).

| File in `audio/` | How it was made |
|---|---|
| `music-main.mp3` | Pavel's AI-generated main loop (A pedal, 99.4 BPM, 160 s) + FM e-piano stabs and FM bells: `python3 analyze.py <track.mp3>` (writes `beats.npy`), then `python3 overlay.py <track.mp3> beats.npy <out.mp3>`; re-encoded at 112 kbps |
| `win.mp3` | `python3 win_trumpet.py <out.mp3>` (FM trumpet fanfare, A minor → A major), loudness-normalised with ffmpeg `acompressor` + `loudnorm=I=-15` |
| `lose.mp3` | `python3 fmsynth.py <dir>` → `gi-lose-demo.mp3` |

Sound effects are not files: they are synthesised in the game (`GIAudio` in index.html, FM oscillators via Web Audio).
Run the scripts from this folder (they import `fmsynth`).
