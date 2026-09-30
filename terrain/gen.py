"""Procedural fictional world map for Global Ideology (viewBox 1000x580).
Outputs terrain.json with SVG path data: land, shelves, contours, mountains, territories, borders."""
import json, numpy as np
from scipy import ndimage
from skimage import measure

W, H, S = 1000, 580, 2            # map size, raster step (px per cell)
PAD = 40
gx, gy = np.meshgrid(np.arange(-PAD, W + PAD + S, S, dtype=float), np.arange(-PAD, H + PAD + S, S, dtype=float))
rng = np.random.default_rng(7)

def fbm(octaves=5, base=0.012, seed=0):
    r = np.random.default_rng(seed); out = np.zeros_like(gx); amp = 1; tot = 0
    for o in range(octaves):
        f = base * 2 ** o
        n = r.standard_normal((int(H * f) + 3, int(W * f) + 3))
        z = ndimage.zoom(n, (gx.shape[0] / n.shape[0], gx.shape[1] / n.shape[1]), order=3)[:gx.shape[0], :gx.shape[1]]
        out += amp * z; tot += amp; amp *= 0.5
    return out / tot

N1, N2 = fbm(seed=1), fbm(seed=2, base=0.02)

POS = {  # country centres (x, y); Nippon moved slightly SE to clear Sinopeia's coast
 'borealis': (150, 95), 'aethelgard': (205, 220), 'laplata': (290, 450), 'isolde': (395, 55), 'guldor': (430, 128),
 'celestia': (480, 240), 'helvetia': (555, 205), 'pannonia': (615, 155), 'koryn': (755, 95), 'tavaro': (665, 305),
 'kestria': (545, 430), 'bharat': (780, 345), 'sinopeia': (860, 225), 'juche': (935, 120), 'nippon': (962, 292), 'pinguinia': (470, 545)}

LANDMASSES = {
 'west': [(150,95,78),(105,70,55),(225,78,50),(205,220,88),(148,175,62),(262,168,55),(240,292,48),(205,332,32),(92,140,45),(292,92,34),(60,95,30)],
 'south': [(290,452,58),(268,400,40),(312,500,40),(298,538,24),(248,452,33),(332,418,28),(280,360,22)],
 'eurasia': [(488,242,48),(530,202,50),(560,165,45),(615,150,60),(680,110,60),(755,90,72),(830,88,62),(895,105,45),(938,118,28),
             (850,228,70),(800,200,60),(700,205,58),(665,300,50),(742,282,52),(782,348,66),(792,412,36),(722,368,36),
             (640,95,40),(690,215,40),(630,340,26),(612,362,22),
             (545,428,58),(520,392,40),(578,385,38),(560,472,44),(600,425,34),(500,445,34),(585,500,24)],
 'guldor': [(430,128,30),(417,106,18),(440,152,12)],
 'isolde': [(395,55,17),(408,47,10)],
 'nippon': [(962,292,22),(975,265,14),(948,318,13)],
 'ice': [(400,582,30),(450,574,34),(500,578,40),(560,580,36),(620,582,30),(680,586,26),(350,590,24)],
 'isl1': [(868,402,11)], 'isl2': [(888,424,7)], 'isl3': [(338,318,8)], 'isl4': [(352,334,6)], 'isl5': [(652,482,12)],
 'isl6': [(58,302,10)], 'isl7': [(975,190,8)], 'isl8': [(705,440,6)],
}

def field(blobs, noise=13, k=22):
    # smooth union of circle SDFs, displaced by fractal noise; returns >1 on land (to keep the 1.0 threshold API)
    d = None
    for x, y, r in blobs:
        di = np.hypot(gx - x, gy - y) - r
        if d is None: d = di
        else:
            h = np.clip(0.5 + 0.5 * (di - d) / k, 0, 1)
            d = di * (1 - h) + d * h - k * h * (1 - h)
    d = d + noise * N1 * (1 + 0.6 * N2)
    d[:2, :] = d[-2:, :] = 99; d[:, :2] = d[:, -2:] = 99      # force sea on the padded frame so every coast closes
    return 1 - d / 40

FIELDS = {k: field(v) for k, v in LANDMASSES.items()}
LAKES = [(765, 238, 28)]
for lx, ly, lr in LAKES:
    FIELDS['eurasia'] = np.minimum(FIELDS['eurasia'], 1 - (lr - np.hypot(gx - lx, gy - ly) + 6 * N2) / 40)

land = np.zeros_like(gx, bool)
for f in FIELDS.values(): land |= f > 1

def contours(mask_or_field, level, simplify=0.6, min_len=6):
    out = []
    for c in measure.find_contours(mask_or_field, level):
        if len(c) < min_len: continue
        c = measure.approximate_polygon(c, simplify)
        pts = [(round(p[1] * S - PAD, 1), round(p[0] * S - PAD, 1)) for p in c]
        out.append(pts)
    return out

def path(polys, close=True):
    return ' '.join('M' + 'L'.join(f'{x:g},{y:g}' for x, y in p) + ('Z' if close else '') for p in polys)

res = {}
res['land'] = path(sum((contours(f, 1.0) for f in FIELDS.values()), []))
FMAX = np.max(np.stack(list(FIELDS.values())), axis=0)
res['shelf1'] = path(contours(FMAX, 0.7))
res['shelf2'] = path(contours(FMAX, 0.4, simplify=0.9))

# --- elevation: land body + mountain ridges ---
RIDGES = [
 [(95,55),(88,120),(118,200),(165,280),(200,330)],          # western cordillera (Aethelgard/Borealis)
 [(252,385),(255,450),(275,520)],                            # La Plata spine
 [(700,240),(760,262),(820,275),(855,285)],                  # great range between Tavaro/Bharat and Sinopeia
 [(575,178),(600,195),(628,205)],                            # alps (Helvetia/Pannonia)
 [(705,55),(712,110),(705,150)],                             # Koryn ridge
 [(598,388),(605,440),(598,480)],                            # Kestria rift
 [(440,105),(452,150)], [(958,270),(965,305)],               # island highlands
]
def seg_dist(px, py, a, b):
    ax, ay = a; bx, by = b; dx, dy = bx - ax, by - ay
    t = np.clip(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1)
    return np.hypot(px - (ax + t * dx), py - (ay + t * dy))
ridge = np.zeros_like(gx)
for rl in RIDGES:
    d = np.min([seg_dist(gx, gy, rl[i], rl[i + 1]) for i in range(len(rl) - 1)], axis=0)
    ridge = np.maximum(ridge, np.exp(-(d / 26) ** 2))
dist_in = ndimage.distance_transform_edt(land) * S
elev = np.where(land, np.clip(dist_in / 60, 0, 1) * 0.35 + ridge * (0.75 + 0.25 * N2), 0)
elev = ndimage.gaussian_filter(elev, 1.2)
res['contours'] = [path(contours(np.where(land, elev, 0), lv, simplify=0.8, min_len=10)) for lv in (0.25, 0.4, 0.55, 0.7, 0.85)]

# mountain glyphs: small peaks spaced along ridges
peaks = []
for rl in RIDGES:
    for i in range(len(rl) - 1):
        (ax, ay), (bx, by) = rl[i], rl[i + 1]
        n = max(1, int(np.hypot(bx - ax, by - ay) / 16))
        for k in range(n):
            t = (k + 0.5) / n; x = ax + t * (bx - ax) + rng.normal(0, 3); y = ay + t * (by - ay) + rng.normal(0, 3)
            s = 5 + rng.random() * 3
            peaks.append((round(x, 1), round(y, 1), round(s, 1)))
res['peaks'] = peaks

# --- territories: noisy Voronoi of country seeds per landmass (extra seeds shape the borders) ---
SEEDS = {k: [v] for k, v in POS.items()}
SEEDS.update({
 'koryn': [(755, 95), (680, 80), (840, 70), (720, 160), (640, 60), (668, 205)],
 'celestia': [(480, 240), (505, 185)],
 'tavaro': [(665, 305), (690, 250), (640, 340)],
 'sinopeia': [(860, 225), (890, 170), (840, 285)],
 'bharat': [(780, 345), (790, 410), (740, 330), (755, 295)],
 'kestria': [(545, 430), (560, 480), (520, 395)],
 'aethelgard': [(205, 220), (240, 300), (270, 170)],
 'borealis': [(150, 95), (80, 80), (240, 70)],
})
LAND_OF = {'borealis':'west','aethelgard':'west','laplata':'south','isolde':'isolde','guldor':'guldor','nippon':'nippon','pinguinia':'ice'}
ids = list(POS)
owner = np.full(gx.shape, -1)
best = np.full(gx.shape, np.inf)
warp_x, warp_y = N1 * 22, N2 * 22
for i, cid in enumerate(ids):
    lm = LAND_OF.get(cid, 'eurasia'); mask = FIELDS[lm] > 1
    for sx, sy in SEEDS[cid]:
        d = np.hypot(gx + warp_x - sx, gy + warp_y - sy)
        upd = mask & (d < best)
        best[upd] = d[upd]; owner[upd] = i
terr, borders = {}, []
for i, cid in enumerate(ids):
    m = ndimage.gaussian_filter((owner == i).astype(float), 0.8)
    terr[cid] = path(contours(m, 0.5, simplify=0.7))
res['territories'] = terr
# internal borders: owner changes between neighbouring land cells
edge = np.zeros_like(land)
edge[:, 1:] |= (owner[:, 1:] != owner[:, :-1]) & (owner[:, 1:] >= 0) & (owner[:, :-1] >= 0)
edge[1:, :] |= (owner[1:, :] != owner[:-1, :]) & (owner[1:, :] >= 0) & (owner[:-1, :] >= 0)
res['borders'] = path(contours(ndimage.gaussian_filter(edge.astype(float), 0.9), 0.25, simplify=0.8, min_len=4))

# --- validation: land adjacency must equal the game's BORDERS ---
adj = set()
for a, b in [(owner[:, 1:], owner[:, :-1]), (owner[1:, :], owner[:-1, :])]:
    m = (a != b) & (a >= 0) & (b >= 0)
    for x, y in set(zip(a[m].tolist(), b[m].tolist())): adj.add(tuple(sorted((ids[x], ids[y]))))
BORDERS = [("borealis","aethelgard"),("celestia","helvetia"),("helvetia","pannonia"),("celestia","pannonia"),("pannonia","koryn"),("koryn","tavaro"),("koryn","sinopeia"),("koryn","juche"),("sinopeia","juche"),("sinopeia","bharat"),("bharat","tavaro"),("tavaro","kestria")]
want = {tuple(sorted(b)) for b in BORDERS}
res['check'] = {'missing': sorted(want - adj), 'extra': sorted(adj - want)}
# every country centre on its own land
res['centreCheck'] = {cid: bool(owner[int((POS[cid][1] + PAD) / S), int((POS[cid][0] + PAD) / S)] == i) for i, cid in enumerate(ids)}
res['pos'] = POS
json.dump(res, open('terrain.json', 'w'))
print(res['check']); print({k: v for k, v in res['centreCheck'].items() if not v})
print('bytes', len(json.dumps(res)))
def where(a_id, b_id):
    ia, ib = ids.index(a_id), ids.index(b_id); pts = []
    m = ((owner[:, 1:] == ia) & (owner[:, :-1] == ib)) | ((owner[:, 1:] == ib) & (owner[:, :-1] == ia))
    ys, xs = np.nonzero(m); return [(int(x * S - PAD), int(y * S - PAD)) for x, y in zip(xs[::5], ys[::5])][:8]
import sys
for a, b in res['check']['extra']: print(a, b, where(a, b))
