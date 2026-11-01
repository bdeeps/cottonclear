// CottonClear's shared models, drawing helpers and 3D parts.
// Every number used by a readout is computed here, with its source or the word "illustrative" beside it.
import { THREE, M, beam, clamp, lerp, smooth } from './kit.js';

export { THREE, M, clamp, lerp, smooth };

export const COL = { lint: '#f4efe2', hot: '#ff7a59', cold: '#6fb6ff', heat: '#ffb547', ok: '#5ce1a9', warn: '#ff5a6e', force: '#c49bff', text: '#e8eef8', hb: '#7fb2ff', leaf: '#6fbf73' };
export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;
export const inReel = () => document.body.classList.contains('gb-reel');
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const fmtN = (v, d = 0) => v.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
export { fmtN };

// ---------------------------------------------------------------- the cell model (chapter 2)
// Stages: initiation at flowering; elongation about 20 days to 25–30 mm in upland cotton (Jan et al. 2022,
// Int J Mol Sci 23:5004, PMC9101851); then wall thickening, with the mature wall reported at 3–6 µm;
// the fibre is fully formed at about 50 days (Springer BMC Genomics 2025 review of the stages).
// Timing: flower to open boll takes about 850 heat units in °F (DD60, Oklahoma State Extension handout),
// which is 472 °C-days above 15.6 °C, or 50 days at a mean of 25 °C. So "cell days" run at
//   rate = (T − 15.6) / 9.4, levelling off above 28 °C (a labelled simplification: the true response is
//   not a straight line, and heat units are a field rule of thumb, not a law).
// Length curve and wall curve are illustrative shapes fitted to those stage dates.
// Heat above 30 °C shortens the final length by 1.5% per °C: the direction is reported (a 38 °C vs 28 °C
// greenhouse study, Crop Journal 2026), the size here is illustrative. Cool nights thin the wall: below a
// 22 °C mean, 5% per °C, direction from Cotton Physiology ch. 24 (low density at low night temperature),
// size illustrative. Micronaire: 1 µg/inch = 39.4 mtex (a unit conversion).
export const KINDS = {
  desi: { name: 'Desi arboreum', Lmax: 20, Wmax: 4.0, D: 19, note: 'short, coarse and hardy' },
  upland: { name: 'Upland hirsutum', Lmax: 28, Wmax: 3.0, D: 15, note: 'most of the world\'s cotton' },
  els: { name: 'Extra-long', Lmax: 36, Wmax: 2.4, D: 13.5, note: 'G. barbadense, long and fine' },
};
export const cellRate = (T) => (Math.min(T, 28) - 15.6) / 9.4;
export const daysToOpen = (T) => 50 / cellRate(T);
const CELL_DENS = 1.5e6;     // g/m³, cellulose about 1.5 g/cm³
export function cellModel(day, T, kind = 'upland') {
  const k = KINDS[kind], tau = day * cellRate(T);
  const hot = clamp(1 - 0.015 * Math.max(0, T - 30), 0.7, 1), cool = clamp(1 - 0.05 * Math.max(0, 22 - T), 0.6, 1);
  const S = (x) => 1 / (1 + Math.exp(-(x - 10) / 2.3));
  const L = k.Lmax * hot * clamp((S(tau) - S(0)) / (S(26) - S(0)), 0, 1);
  const Wfull = k.Wmax * cool;
  const wall = Wfull * Math.pow(clamp((tau - 17) / 28, 0, 1), 0.9);
  const R = k.D / 2, prim = 0.2, inner = Math.max(0.5, R - prim - wall);
  const Ap = Math.PI * (R * R - (R - prim) * (R - prim));
  const As = Math.PI * ((R - prim) * (R - prim) - inner * inner);
  const cellulose = (0.3 * Ap + 0.99 * As) / (Ap + As);     // primary wall about 30% cellulose: illustrative figure
  const mtex = (As + Ap) * 1e-12 * CELL_DENS * 1000 * 1000 * 0.001 * 1000;  // µm² → mtex (mg per km)
  const mic = mtex / 39.4;
  const open = clamp((tau - 47) / 3, 0, 1);
  const stage = tau < 0.5 ? 'A bump on the seed coat' : tau < 17 ? 'Elongation: growing longer' : tau < 21 ? 'Changeover: the winding layer' : tau < 47 ? 'Thickening: cellulose, layer by layer' : open < 1 ? 'Boll opening: drying out' : 'Dry, collapsed and twisted';
  return { tau, L, wall, R, prim, inner, cellulose, mtex, mic, open, stage, massUg: mtex * L * 1e-3 };
}

// ---------------------------------------------------------------- spinning (chapter 4)
// Units: English cotton count Ne = hanks of 840 yards per pound, tex = 590.5 / Ne (a definition).
// Twist: turns per inch = αe √Ne, with twist multiplier αe usually about 3.5–4.5 for ring yarn (textbook practice).
// Spinning limit: a yarn needs a minimum number of fibres across. Labelled model, not a standard:
//   n_min = 95 (28 / staple)^2.8, calibrated so 20 mm desi reaches about 10s, 28 mm upland about 38s and
//   36 mm extra-long about 95s, the usual order of machine spinning. Fibre fineness by staple comes from typical micronaire.
// Strength: friction grip g = 1 − exp(−(αe/α0)²), α0 = 2.6 √(28/staple), times cos²(helix angle) for the
//   fibres lying off-axis. Yarn tenacity = 30 cN/tex (typical fibre) × 0.62 × g cos²θ: illustrative but
//   lands on the 15–20 cN/tex usual for ring yarn. Helix angle: tan θ = π d T, with packing 0.55, density 1.52 g/cm³.
export function micOfStaple(L) { return L <= 28 ? lerp(6.5, 4.2, (L - 20) / 8) : lerp(4.2, 3.4, (L - 28) / 8); }
export function spinModel(L, Ne, alpha) {
  const tex = 590.5 / Ne, fibreTex = micOfStaple(L) * 0.0394, n = tex / fibreTex;
  const nMin = 95 * Math.pow(28 / L, 2.8), maxNe = 590.5 / (nMin * fibreTex);
  const tpi = alpha * Math.sqrt(Ne), tpm = tpi * 39.37;
  const d = Math.sqrt((4 * tex) / (1000 * 1.52 * 0.55 * Math.PI));    // mm
  const theta = Math.atan(Math.PI * d * (tpm / 1000));
  const a0 = 2.6 * Math.sqrt(28 / L), grip = 1 - Math.exp(-((alpha / a0) ** 2));
  const rel = grip * Math.cos(theta) ** 2;
  const ten = 30 * 0.62 * rel;
  return { tex, fibreTex, n, nMin, maxNe, tpi, tpm, d, theta, grip, rel, ten, force: ten * tex, spinnable: Ne <= maxNe, kmPerKg: 1000 / tex };
}
// Raw cotton for a garment. An estimate with every step shown. Fabric: shirt 1.8 m² at 120 g/m², sari
// 5.5 × 1.15 m at 90 g/m². Waste: 12% in spinning, 5% in weaving. A boll: about 4 g of seed cotton. All illustrative typical values.
export const ITEMS = { shirt: { name: 'A cotton shirt', g: 1.8 * 120 }, sari: { name: 'A cotton sari', g: 5.5 * 1.15 * 90 } };
export function rawCotton(item, got) { const g = ITEMS[item].g, lint = g / (0.95 * 0.88), seed = lint / (got / 100); return { g, lint, seed, bolls: seed / 4, cottonseed: seed - lint }; }

// ---------------------------------------------------------------- resistance (chapter 5)
// Textbook one-gene selection, every value illustrative. Start: resistance allele frequency 0.1%. Larvae on Bt
// plants: susceptible survive 1%, heterozygotes by dominance h = 0.0075, resistant 100%. A refuge share r escapes selection.
// Three generations a year. Constants are calibrated so a 5% refuge gives about 8 years, the time reported for India's
// one-toxin cotton (Dhurua & Gujjar 2011; survival from about 2010). Two toxins: frequency starts at the square, with the
// same survival. In reality Bollgard II fell faster, as the worms already resisted its first toxin. It shows why
// refuges and stacked genes buy time, not when any real field fails.
export function resistanceCurve(refuge, toxins = 1, years = 30) {
  const r = refuge / 100, surv = 0.01, h = 0.0075, gens = 3;
  let p = toxins === 1 ? 0.001 : 0.001 * 0.001 * 4;
  const wSS = r + (1 - r) * surv, wRS = wSS + h * (1 - wSS), wRR = 1;
  const pts = [[0, p]]; let half = null;
  for (let g = 1; g <= years * gens; g++) {
    const q = 1 - p, W = p * p * wRR + 2 * p * q * wRS + q * q * wSS;
    p = (p * p * wRR + p * q * wRS) / W;
    pts.push([g / gens, p]);
    if (half === null && p >= 0.5) half = g / gens;
  }
  return { pts, half };
}
// Sorption of cotton at about 20 °C. Standard regain 8.5% at 65% RH (ISO 139 conditions, textile tables); the
// rest of the curve is the usual sigmoid shape, read as typical values.
const RH = [0, 20, 40, 65, 85, 95, 100], REG = [0, 3.5, 5.6, 8.5, 12, 16, 22];
export function regainOf(rh) { let i = 0; while (i < RH.length - 2 && rh > RH[i + 1]) i++; return lerp(REG[i], REG[i + 1], clamp((rh - RH[i]) / (RH[i + 1] - RH[i]), 0, 1)); }
// Jurin's law: h = 2γ cos θ / (ρ g r), the same law and same oil constants as DiyaClear.
export const jurin = (gamma, rho, r, cos = 1) => (2 * gamma * cos) / (rho * 9.81 * r);

// ---------------------------------------------------------------- official figures (chapter 5)
// Rajya Sabha reply by MoS Textiles, reported by IANS 24 July 2026 (read at source): 352.48 → 290.91 lakh bales,
// 132.85 → 114.82 lakh ha, productivity 428–451 kg/ha. Checked: 290.91 lakh × 170 kg / 114.82 lakh ha = 431 kg/ha.
// ICAC 2025 water paper, Tables 3 and 4 (read at source), 5-year means 2020–2024, litres per kg lint.
// The ICAC text prints 6,238 and 6,239 for the world total, but its table and its own two parts give 6,283.
export const WATER = {
  india: { name: 'India', rain: 9656, blue: 710, applied: 1987, yield: 441, area: 12526, irrigated: 4564 },
  world: { name: 'World', rain: 4690, blue: 1593, applied: 2158, yield: 786, area: 30980 },
};
export const MSP = { year: '2026-27', medium: 8267, long: 8667 };   // ₹ per quintal, Cabinet decision of 13 May 2026

// ---------------------------------------------------------------- boards
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); }
export function title(g, text, sub = '') { g.fillStyle = COL.text; g.font = 'bold 26px sans-serif'; g.fillText(text, 20, 36); if (sub) { g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.62)'; g.fillText(sub, 20, 62); } }
export function axes(g, { x0, x1, y0, y1, xMin, xMax, yMin, yMax, xTicks = [], yTicks = [], xFmt = String, yFmt = String }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0), Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.lineWidth = 1; g.font = '19px sans-serif';
  for (const t of xTicks) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillStyle = 'rgba(255,255,255,.65)'; g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillStyle = 'rgba(255,255,255,.65)'; g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  return { X, Y };
}
export function plot(g, pts, X, Y, col, wdt = 5) { if (pts.length < 2) return; g.strokeStyle = col; g.lineWidth = wdt; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
export function dot(g, x, y, col, r = 8) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
export function wrap(g, text, x, y, maxW, lh) { const words = text.split(' '); let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; }

// In the tall reel video, boards stack above the model, so the portrait frame is filled.
export function placeBoards(stage, boards, { x = 0, top = 9, gap = 3, scale = 1.1, z = 0 } = {}) {
  const tall = inReel() && stage.camera.aspect < 0.9;
  boards.forEach((b, i) => {
    if (!b.home) { b.home = b.mesh.position.clone(); b.homeRot = b.mesh.rotation.y; }
    if (tall) { b.mesh.position.set(x, top - i * gap, z); b.mesh.rotation.y = 0; b.mesh.scale.setScalar(scale); }
    else { b.mesh.position.copy(b.home); b.mesh.rotation.y = b.homeRot; b.mesh.scale.setScalar(1); }
  });
  return tall;
}
// On a phone the readout covers the top of the stage: shift the picture down and hide minor labels.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.16 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Reel scenes carry an optional `tall` view for the 1080×1920 video: narrow frames would otherwise back far off.
export function tallView(stage, reel) {
  if (!inReel() || stage.camera.aspect >= 0.9 || !stage.home) return;
  const r = reel.find((x) => x.view && x.tall && stage.home.pos === x.view.pos);
  if (r) stage.setView(r.tall.pos, r.tall.target, 0.01);
}

// ---------------------------------------------------------------- instanced lines
const UP = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
export function hairs(n, r, mat, seg = 5) {
  const g = new THREE.CylinderGeometry(r, r, 1, seg, 1, true), m = new THREE.InstancedMesh(g, mat, n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false;
  m.seg = (i, a, b, k = 1) => {
    _a.set(a[0], a[1], a[2]); _b.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const L = _b.length() || 1e-4; _q.setFromUnitVectors(UP, _b.clone().normalize());
    _s.set(k, L, k); _a.addScaledVector(_b, 0.5); _m.compose(_a, _q, _s); m.setMatrixAt(i, _m);
  };
  m.hide = (i) => { _m.makeScale(0, 0, 0); m.setMatrixAt(i, _m); };
  m.done = () => { m.instanceMatrix.needsUpdate = true; };
  return m;
}

// ---------------------------------------------------------------- plant parts
function leafGeometry() {
  const s = new THREE.Shape(); s.moveTo(0, 0);
  s.bezierCurveTo(-0.15, 0.1, -0.55, 0.15, -0.62, 0.45); s.bezierCurveTo(-0.42, 0.42, -0.34, 0.5, -0.3, 0.6);
  s.bezierCurveTo(-0.28, 0.8, -0.14, 0.92, 0, 1.08); s.bezierCurveTo(0.14, 0.92, 0.28, 0.8, 0.3, 0.6);
  s.bezierCurveTo(0.34, 0.5, 0.42, 0.42, 0.62, 0.45); s.bezierCurveTo(0.55, 0.15, 0.15, 0.1, 0, 0);
  return new THREE.ShapeGeometry(s, 6);
}
const LEAF = leafGeometry();
export function leaf(mat, size = 1) { const m = new THREE.Mesh(LEAF, mat); m.scale.setScalar(size); m.castShadow = true; return m; }

// A soft lump of lint: a cloud of overlapping, slightly squashed spheres.
export function fluff(r, n, seed = 3, color = 0xf6f2e8) {
  const rnd = rng(seed), g = new THREE.Group();
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), M.matte(color, { roughness: 1 }), n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, z = rnd() * 2 - 1, q = Math.sqrt(1 - z * z), d = r * Math.cbrt(rnd()) * 0.8;
    o.position.set(d * q * Math.cos(a), d * z, d * q * Math.sin(a));
    o.scale.setScalar(r * (0.2 + rnd() * 0.2)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
  }
  mesh.castShadow = true; g.add(mesh);
  return g;
}

// The boll: four segments of wall (the bur) that split and fold back, with a lock of lint in each.
export function makeBoll({ r = 1, seed = 5 } = {}) {
  const g = new THREE.Group(), segs = [], locks = [];
  const mat = M.matte(0x6f9a4a, { side: THREE.DoubleSide, roughness: 0.7 });
  const geo = new THREE.SphereGeometry(r, 18, 14, 0, Math.PI / 2 - 0.02, 0, Math.PI);
  geo.scale(0.92, 1.2, 0.92);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2, pivot = new THREE.Group(); pivot.position.y = -1.15 * r; pivot.rotation.y = -a;
    const hinge = new THREE.Group(); pivot.add(hinge);
    const m = new THREE.Mesh(geo, mat); m.position.y = 1.15 * r; m.castShadow = true; hinge.add(m);
    g.add(pivot); segs.push(hinge);
    const l = fluff(0.72 * r, 34, seed + i); l.userData.a = a + Math.PI / 4; g.add(l); locks.push(l);
  }
  // The calyx at the base.
  const cal = new THREE.Mesh(new THREE.ConeGeometry(0.55 * r, 0.5 * r, 16, 1, true), M.matte(0x4c7a3a, { side: THREE.DoubleSide })); cal.position.y = -1.15 * r; g.add(cal);
  const green = new THREE.Color(0x6f9a4a), brown = new THREE.Color(0x6b4a2c);
  g.set = (k) => {
    k = clamp(k, 0, 1);
    segs.forEach((h) => { h.rotation.z = 0; h.rotation.x = 0; h.rotation.set(0, 0, 0); h.rotateOnAxis(new THREE.Vector3(-Math.SQRT1_2, 0, Math.SQRT1_2).normalize(), -1.25 * k); });
    mat.color.lerpColors(green, brown, smooth(k * 1.3));
    locks.forEach((l) => { const a = l.userData.a, d = lerp(0.12, 0.55, k) * r; l.position.set(Math.cos(a) * d, lerp(-0.1, 0.25, k) * r, Math.sin(a) * d); l.scale.setScalar(lerp(0.75, 1.12, k)); l.visible = k > 0.02; });
  };
  g.segs = segs; g.locks = locks; g.set(0);
  return g;
}

// A flower: cream petals with a red spot; desi and hirsutum flowers open cream or yellow and turn pink after a day.
export function makeFlower(r = 0.5) {
  const g = new THREE.Group(), mat = M.matte(0xf6ecc0, { side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat); p.scale.set(0.62, 0.95, 0.16);
    const h = new THREE.Group(); h.rotation.y = (i * 2 * Math.PI) / 5; p.position.set(0, r * 0.75, r * 0.34); p.rotation.x = 0.55; h.add(p); g.add(h);
  }
  const col = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.1, r * 1.1, 8), M.matte(0xf0d060)); col.position.y = r * 0.55; g.add(col);
  g.mat = mat;
  return g;
}

// A cotton plant about waist-high, with a main stem, fruiting branches, leaves and fruit.
export function makePlant({ h = 5.2, seed = 9, fruit = 'open', bolls = 7 } = {}) {
  const g = new THREE.Group(), rnd = rng(seed);
  const stem = M.matte(0x5a4630), leafMat = M.matte(0x4f8f4c, { side: THREE.DoubleSide });
  g.add(beam([0, 0, 0], [0, h, 0], 0.09, stem, 8));
  const spots = [], items = [];
  const levels = 8;
  for (let i = 0; i < levels; i++) {
    const y = h * (0.22 + (0.74 * i) / levels), a = i * 2.4 + rnd(), len = (1 - i / levels) * 1.65 + 0.45;
    const end = [Math.cos(a) * len, y + 0.45, Math.sin(a) * len];
    g.add(beam([0, y, 0], end, 0.04, stem, 6));
    for (let k = 0; k < 2; k++) {
      const t = 0.5 + k * 0.5, lf = leaf(leafMat, 0.72 + rnd() * 0.32);
      lf.position.set(end[0] * t, y + 0.45 * t + 0.03, end[2] * t);
      lf.rotation.set(-1.0 - rnd() * 0.5, -a + 1.57 + (rnd() - 0.5), rnd() - 0.5); g.add(lf);
    }
    spots.push(new THREE.Vector3(end[0], end[1], end[2]));
  }
  for (let i = 0; i < Math.min(bolls, spots.length); i++) {
    const b = makeBoll({ r: 0.3, seed: seed + i * 7 });
    b.position.copy(spots[i]); b.position.y += 0.26; b.set(fruit === 'open' ? 1 : 0); g.add(b); items.push(b);
  }
  const tip = leaf(leafMat, 0.6); tip.position.y = h; tip.rotation.x = -0.6; g.add(tip);
  g.bolls = items; g.spots = spots;
  return g;
}

// A seed with long lint and short fuzz; lint and fuzz lengths in scene units.
export function makeSeed({ r = 0.55, nLint = 420, lintLen = 1.25, nFuzz = 300, fuzzLen = 0.13, seed = 4 } = {}) {
  const g = new THREE.Group(), rnd = rng(seed);
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), M.matte(0x2b211b, { roughness: 0.75 })); body.scale.set(0.72, 1.12, 0.72); body.castShadow = true; g.add(body);
  const lint = hairs(nLint * 3, 0.011, M.matte(0xf7f3e8)), fuzz = hairs(nFuzz, 0.012, M.matte(0xb9b49a));
  const dir = () => { const a = rnd() * 6.283, z = rnd() * 2 - 1, q = Math.sqrt(1 - z * z); return [q * Math.cos(a), z, q * Math.sin(a)]; };
  const surf = (d) => [d[0] * r * 0.72, d[1] * r * 1.12, d[2] * r * 0.72];
  for (let i = 0; i < nFuzz; i++) { const d = dir(), a = surf(d), b = [a[0] + d[0] * fuzzLen, a[1] + d[1] * fuzzLen, a[2] + d[2] * fuzzLen]; fuzz.seg(i, a, b); }
  // Lint fibres curl: three short segments each.
  for (let i = 0; i < nLint; i++) {
    const d = dir(); let p = surf(d), v = [...d];
    const L = lintLen * (0.7 + rnd() * 0.5) / 3;
    for (let k = 0; k < 3; k++) {
      v = [v[0] + (rnd() - 0.5) * 0.7, v[1] + (rnd() - 0.5) * 0.7 + 0.04, v[2] + (rnd() - 0.5) * 0.7];
      const n = Math.hypot(...v); const q = [p[0] + (v[0] / n) * L, p[1] + (v[1] / n) * L, p[2] + (v[2] / n) * L];
      lint.seg(i * 3 + k, p, q); p = q;
    }
  }
  lint.done(); fuzz.done(); g.add(lint, fuzz); g.lint = lint; g.fuzz = fuzz;
  return g;
}

// A ribbon fibre whose vertices are recomputed each frame: length, radius, how flat, and how twisted.
export class Ribbon {
  constructor(mat, ns = 18, nl = 90) {
    this.ns = ns; this.nl = nl;
    const pos = new Float32Array((ns + 1) * (nl + 1) * 3), idx = [];
    for (let j = 0; j < nl; j++) for (let i = 0; i < ns; i++) { const a = j * (ns + 1) + i, b = a + ns + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.castShadow = true;
  }
  update(L, r, flat, twist, sway = 0) {
    const { ns, nl } = this, p = this.mesh.geometry.attributes.position.array; let n = 0;
    for (let j = 0; j <= nl; j++) {
      const t = j / nl, y = t * L, phi = twist * y;
      const taper = Math.min(1, Math.sqrt(Math.max(0, (1 - t) * 18)) + 0.02) * (L < r * 2 ? 0.8 : 1);
      const a = r * taper * (1 + flat * 0.35), b = r * taper * (1 - flat * 0.72);
      const ox = Math.sin(t * 2.2) * sway * t, oz = Math.cos(t * 1.7) * sway * t * t;
      for (let i = 0; i <= ns; i++) {
        const th = (i / ns) * Math.PI * 2, x = a * Math.cos(th), z = b * Math.sin(th);
        p[n++] = ox + x * Math.cos(phi) - z * Math.sin(phi); p[n++] = y; p[n++] = oz + x * Math.sin(phi) + z * Math.cos(phi);
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.computeVertexNormals();
  }
}

// A row of rollers for the gin, card and drawing frame.
export function cyl(x, y, z, r, len, mat, axis = 'z', seg = 24) {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  if (axis === 'z') g.rotateX(Math.PI / 2); else if (axis === 'x') g.rotateZ(Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
