// Chapter 2 (centrepiece): one cell, 3 cm long. All numbers come from cellModel() in cotton.js.
// The hero cell is drawn with its length to scale against the others, but about 500 times too wide.
import { THREE, M, clamp, lerp, smooth, cellModel, cellRate, daysToOpen, KINDS, Ribbon, board, panelBg, title, axes, plot, dot, COL, fitNarrow, placeBoards, tallView, rng, link } from '../cotton.js';
import { swarm } from '../kit.js';

const YS = 0.235;   // scene units per millimetre
const VIEW = { pos: [3.0, 5.6, 16.6], target: [2.6, 4.2, 0] };
const REEL = [
  { ms: 5400, caption: 'From the day the flower opens, single seed cells grow to nearly 3 cm in about 20 days.', set: { T: 25, kind: 'upland' }, anim: { day: [0, 22] }, view: { pos: [3.0, 5.6, 16.5], target: [2.6, 4.2, 0] }, tall: { pos: [0.2, 7.0, 7.8], target: [0.2, 6.8, 0] }, spin: 0.12 },
  { ms: 5800, caption: 'Then it stops growing and fills with cellulose, one daily layer at a time, spiralling as it goes.', set: { T: 25, kind: 'upland' }, anim: { day: [22, 46] }, view: { pos: [2.8, 5.5, 16.4], target: [2.6, 4.2, 0] }, tall: { pos: [0.2, 7.0, 7.9], target: [0.2, 6.8, 0] }, spin: -0.12 },
  { ms: 5200, caption: 'The boll opens, the cell dies and dries, and the tube collapses into a twisted ribbon.', set: { T: 25, kind: 'upland' }, anim: { day: [46, 54] }, view: { pos: [0.4, 4.4, 8.6], target: [0.2, 4.0, 0] }, tall: { pos: [0.2, 6.9, 7.8], target: [0.2, 6.8, 0] }, spin: 0.25 },
];

export default {
  id: 'cell',
  short: 'One cell, 3 cm long',
  title: 'One cell, 3 cm long',
  subtitle: 'Twenty days of growing longer, thirty of filling up, then it dries and twists.',
  view: VIEW,
  learn: `<p>Most plant cells are far too small to see. A cotton fibre is one you can pick up with your fingers.</p>
    <p><b>Day 0: start.</b> On the day the flower opens, about one skin cell in four on the young seed balloons outward. Fuzz cells start later, around day 5 to 10.</p>
    <p><b>Days 0 to 20: longer.</b> Water pressure inflates the cell like a long thin balloon, while the wall keeps growing. Published work gives about <b>25 to 30 mm</b> for upland cotton after about 20 days. Sugar arrives as sucrose from the leaves.</p>
    <p><b>Days 20 to 45: thicker.</b> Length stops. Now enzymes on the cell's skin spin glucose into <b>cellulose</b>, laying it on the inside of the wall. It goes down in a <b>layer each day</b>, like a tree ring, in a spiral whose direction reverses every so often. By the end the fibre is about <b>90 to 95% cellulose</b>.</p>
    <p><b>Day 50: the twist.</b> The boll splits, the cell dies and water leaves. The round tube collapses into a flat ribbon, and the spiral layers wring it into many small twists, called <b>convolutions</b>. Those twists help fibres grip each other when they are spun.</p>
    <p>All these days move with temperature. Field agronomists count about 850 "heat units" from flower to open boll, or about 50 days at a mean of 25 °C. The dates here are a labelled model, not a promise for any one field.</p>
    <p class="tip"><b>Try it:</b> drag the days and watch the sap channel shrink as the wall fills it. Then cool the field to 20 °C and see how far behind the same date falls.</p>`,
  terms: [
    { t: 'Days after flowering', d: 'The clock for a boll, counted from the day its flower opens. Scientists write DPA, days post anthesis.' },
    { t: 'Elongation', d: 'The first phase, when a fibre grows longer but stays thin-walled.' },
    { t: 'Secondary wall', d: 'The layers of cellulose laid inside the first wall once length stops.' },
    { t: 'Convolution', d: 'A natural twist in a dried fibre, formed when the tube collapses.' },
    { t: 'Micronaire', d: 'A trade measure of mass per length. Too low means thin-walled, immature fibre.' },
    { t: 'Heat unit', d: 'A running score of warmth above a base temperature, used to forecast crop stages.' },
  ],
  defaults: { day: 12, T: 25, kind: 'upland' },
  controls: [
    { key: 'day', type: 'range', label: 'Days after flowering', min: 0, max: 90, step: 0.5, ends: ['flower', 'long after'], fmt: (v) => 'day ' + Math.round(v) },
    { key: 'T', type: 'range', label: 'Mean temperature', min: 20, max: 36, step: 0.5, ends: ['cool', 'hot'], fmt: (v) => v.toFixed(1) + ' °C' },
    { key: 'kind', type: 'seg', label: 'Kind of cotton', options: Object.entries(KINDS).map(([v, k]) => ({ v, label: k.name.split(' ')[0] })) },
  ],
  quiz: [
    { q: 'What happens first in a growing fibre?', options: ['The wall thickens, then it grows', 'It grows longer, then the wall thickens', 'It twists, then grows', 'It dries, then grows'], answer: 1, why: 'For about 20 days it elongates with a thin wall. Only then is cellulose laid down thickly inside.' },
    { q: 'Why does a dried fibre twist?', options: ['Wind twists it', 'The farmer twists it', 'The tube collapses as water leaves, and its spiral layers wring it', 'Insects twist it'], answer: 2, why: 'The spiralling cellulose layers cannot simply fold flat. As the lumen empties, they wring the ribbon into convolutions.' },
    { q: 'What is the mature fibre mostly made of?', options: ['Protein', 'Cellulose', 'Fat', 'Starch'], answer: 1, why: 'About 90 to 95% of it is cellulose, chains of glucose made from the sugar the leaves produce.' },
  ],
  reel: REEL,

  build({ stage }) {
    const root = stage.root;
    // The seed coat, seen as a huge curved surface.
    const coat = new THREE.Mesh(new THREE.SphereGeometry(9, 48, 18, 0, Math.PI * 2, 0, 0.62), M.matte(0x3a2c22, { roughness: 0.9, side: THREE.DoubleSide })); coat.position.y = -8.55; coat.receiveShadow = true; root.add(coat);
    const bumps = swarm(80, new THREE.SphereGeometry(0.2, 12, 8), M.matte(0x6e5540));
    const rnd = rng(8);
    for (let i = 0; i < 80; i++) { const a = rnd() * 6.28, d = 0.6 + rnd() * 3.8; const x = Math.cos(a) * d, z = Math.sin(a) * d; bumps.place(i, [x, -8.55 + Math.sqrt(81 - d * d) - 0.02, z], null, 0.7 + rnd() * 0.5); }
    bumps.done(); root.add(bumps);

    // The hero cell: outer wall (see-through while young) and lumen sap.
    const wallMat = M.clear(0xf6efd8, 0.42, { side: THREE.DoubleSide, roughness: 0.55, depthWrite: false });
    const sapMat = M.clear(0x6fd0ff, 0.65, { depthWrite: false });
    const hero = new Ribbon(wallMat, 28, 110), sap = new Ribbon(sapMat, 14, 50);
    root.add(hero.mesh, sap.mesh); hero.mesh.position.y = sap.mesh.position.y = 0.4;
    // Neighbours, thin and at different stages of the same clock.
    const nbrs = [[-1.0, -0.8, 0.85], [0.95, -1.0, 0.92], [1.2, 0.5, 0.8], [-1.35, 0.7, 0.95], [0.3, 1.25, 0.88], [-0.4, -1.6, 0.7]].map(([x, z, k], i) => {
      const r = new Ribbon(M.matte(0x9a9486, { side: THREE.DoubleSide }), 8, 30); r.mesh.position.set(x, 0.4, z); r.k = k; r.sway = 0.2 + (i % 3) * 0.2; root.add(r.mesh); return r;
    });
    // The spiral of cellulose fibrils on the hero: three helices of a thin line.
    const NH = 3, HP = 260, hLines = [];
    for (let i = 0; i < NH; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HP * 3), 3)); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.8 })); l.position.y = 0.4; l.frustumCulled = false; root.add(l); hLines.push(l); }
    // Glucose going up the sap channel.
    const NG = 50, gl = swarm(NG, new THREE.SphereGeometry(0.05, 8, 6), M.glow(0xffc65a)); root.add(gl);
    const G = Array.from({ length: NG }, (_, i) => ({ t: i / NG, a: i * 2.4 }));

    let snap = null, lastKey = '';
    const chart = board(root, 7.0, 3.6, 540, 278, (g, w, h) => {
      panelBg(g, w, h); title(g, 'The clock of one cell');
      if (!snap) return;
      const { day, T, kind } = snap, K = KINDS[kind];
      const maxD = 90, top = 72, bot = h - 38, x0 = 76, x1 = w - 22;
      const A = axes(g, { x0, x1, y0: bot, y1: top, xMin: 0, xMax: maxD, yMin: 0, yMax: 40, xTicks: [0, 20, 40, 60, 80], yTicks: [0, 10, 20, 30, 40], xFmt: (v) => 'd' + v, yFmt: (v) => v + ' mm' });
      const pL = [], pW = [];
      for (let d = 0; d <= maxD; d += 1) { const c = cellModel(d, T, kind); pL.push([d, c.L]); pW.push([d, (c.wall / 6) * 40]); }
      plot(g, pL, A.X, A.Y, COL.lint, 4); plot(g, pW, A.X, A.Y, COL.heat, 4);
      const c = cellModel(day, T, kind);
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(A.X(day), top); g.lineTo(A.X(day), bot); g.stroke();
      dot(g, A.X(day), A.Y(c.L), COL.lint); dot(g, A.X(day), A.Y((c.wall / 6) * 40), COL.heat);
      g.font = '19px sans-serif'; g.fillStyle = COL.lint; g.fillText('length', x0 + 6, top - 6); g.fillStyle = COL.heat; g.fillText('wall (top = 6 µm)', x0 + 76, top - 6);
      const dOpen = daysToOpen(T); if (dOpen < maxD) { g.strokeStyle = COL.ok; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(A.X(dOpen), top); g.lineTo(A.X(dOpen), bot); g.stroke(); g.setLineDash([]); g.fillStyle = COL.ok; g.fillText('opens', A.X(dOpen) + 6, bot - 10); }
    }, [5.7, 7.0, -0.6]);
    chart.mesh.rotation.y = -0.08;
    const slice = board(root, 3.5, 3.5, 320, 320, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Slice across it');
      if (!snap) return;
      const c = cellModel(snap.day, snap.T, snap.kind), cx = w / 2, cy = h / 2 + 22, S = 10, f = c.open;
      const ax = (r) => r * S * (1 + f * 0.35), by = (r) => r * S * (1 - f * 0.65);
      const ell = (r, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, ax(r), by(r), 0, 0, 7); g.fill(); };
      ell(c.R + 0.25, '#d8a65a'); ell(c.R, '#aec98a');
      const wr = c.R - c.prim; ell(wr, '#f3ead2');
      // Daily rings: one per day of wall-laying.
      const layers = Math.round(clamp((c.tau - 17) / 28, 0, 1) * 25);
      g.strokeStyle = 'rgba(120,90,40,.55)'; g.lineWidth = 1;
      for (let i = 1; i < layers; i++) { const r = wr - (c.wall * i) / layers; g.beginPath(); g.ellipse(cx, cy, ax(r), by(r), 0, 0, 7); g.stroke(); }
      ell(c.inner, f > 0.5 ? '#2a1f18' : '#5ec3ee');
      g.fillStyle = '#ffffffaa'; g.font = '18px sans-serif';
      g.fillText(`wall ${c.wall.toFixed(1)} µm`, 14, h - 14); g.fillText(`${layers} daily layers`, w - 136, h - 14);
    }, [7.2, 3.1, -0.6]);
    slice.mesh.rotation.y = -0.08;
    const lSeed = stage.label('Seed coat: about one cell in four becomes a fibre', [1.2, 0.05, 3.2]);
    const lStage = stage.label('', [0, 0, 0], root, 'hot'), lRule = stage.label('Length to scale, width far too big', [3.1, 0.75, 1.0]);

    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        tallView(stage, REEL);
        const tall = placeBoards(stage, [chart, slice], { x: 0.2, top: 12.2, gap: 3.5, scale: 0.86, z: 0.2 });
        const narrow = fitNarrow(stage, [lSeed, lRule]);
        if (tall) { chart.mesh.scale.setScalar(1.1); slice.mesh.scale.setScalar(0.85); }
        const c = cellModel(s.day, s.T, s.kind), H = Math.max(0.28, c.L * YS);
        const fill = clamp(c.wall / (KINDS[s.kind].Wmax || 1), 0, 1), dryK = smooth(c.open);
        const twist = dryK * 3.4, r = 0.3;
        hero.update(H, r, dryK, twist, 0.5 * dryK);
        // Sap channel narrows with the wall, then is gone.
        const inner = c.inner / c.R * r * 0.92;
        sap.mesh.visible = dryK < 0.95; sap.update(H * 0.985, inner * (1 - dryK * 0.9), 0, 0);
        wallMat.opacity = lerp(0.42, 1, Math.max(fill, dryK)); wallMat.depthWrite = wallMat.opacity > 0.8;
        nbrs.forEach((n, i) => { const cc = cellModel(s.day * n.k, s.T, s.kind), f = smooth(cc.open); n.update(Math.max(0.2, cc.L * YS * 0.92), 0.1, f, f * 4, n.sway * (0.3 + f)); });
        // Fibrils appear with the secondary wall.
        const showF = c.tau > 16; hLines.forEach((l, i) => {
          l.visible = showF && dryK < 0.6;
          if (!l.visible) return;
          const p = l.geometry.attributes.position.array, turns = 15 * (H / 9);
          for (let k = 0; k < HP; k++) {
            const t = k / (HP - 1), rev = Math.abs(((t * 4) % 2) - 1), a = (turns * 6.283 * rev) / 2 + (i * 6.283) / NH, y = t * H * clamp((c.tau - 16) / 25 + 0.2, 0, 1) ;
            p[k * 3] = Math.cos(a) * r * 1.01; p[k * 3 + 1] = y; p[k * 3 + 2] = Math.sin(a) * r * 1.01;
          }
          l.geometry.attributes.position.needsUpdate = true;
        });
        // Glucose rises while the cell is alive.
        const alive = dryK < 0.5;
        for (let i = 0; i < NG; i++) { const p = G[i]; p.t = (p.t + dt * 0.35) % 1; const rr = inner * 0.7, y = 0.4 + p.t * H, ar = p.a + p.t * 5; gl.place(i, [Math.cos(ar) * rr, y, Math.sin(ar) * rr], null, alive ? 0.7 + 0.5 * Math.sin(p.t * 3.14) : 0.001); }
        gl.done();
        lStage.position.set(-2.6, 0.4 + H * 0.72, 0.6); lStage.element.textContent = c.stage; lStage.visible = !narrow;
        const key = [s.day, s.T, s.kind].join();
        if (key !== lastKey) { lastKey = key; snap = { day: s.day, T: s.T, kind: s.kind }; chart.redraw(); slice.redraw(); }
      },
      readout: (s) => {
        const c = cellModel(s.day, s.T, s.kind), open = daysToOpen(s.T);
        return `<div class="big">Day ${Math.round(s.day)}</div>${c.stage}
          <div class="row"><span>Length (model)</span><b>${c.L.toFixed(1)} mm</b></div>
          <div class="row"><span>Wall (model)</span><b>${c.wall.toFixed(1)} µm</b></div>
          <div class="row"><span>Cellulose in the wall</span><b>${Math.round(c.cellulose * 100)}%</b></div>
          <div class="row"><span>Micronaire (model)</span><b>${c.mic.toFixed(1)}</b></div>
          <div class="row"><span>Boll opens at ${s.T.toFixed(1)} °C</span><b>about day ${Math.round(open)}</b></div>`;
      },
    };
  },
};
