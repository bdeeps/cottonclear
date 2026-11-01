// Chapter 5: growing it. A field block on black soil, with four views: land, Bt, water, figures.
// Sources: Rajya Sabha reply (MoS Textiles) via IANS 24 Jul 2026 read at source; ICAC 2025 water paper read at source;
// Kranthi & Stone 2020 abstract read at source; MSP from a search summary of the Cabinet decision of 13 May 2026;
// NCRB ADSI 2023 from search summaries (the news page could not be opened). Resistance curve: resistanceCurve() in cotton.js, illustrative.
import { THREE, M, clamp, lerp, resistanceCurve, WATER, MSP, board, panelBg, title, axes, plot, dot, COL, wrap, rng, fitNarrow, tallView, placeBoards, link, hairs, fmtN } from '../cotton.js';
import { swarm, box } from '../kit.js';

const LEAF_G = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(-0.5, 0.1, -0.5, 0.6, 0, 1); s.bezierCurveTo(0.5, 0.6, 0.5, 0.1, 0, 0); const g = new THREE.ShapeGeometry(s, 4); g.translate(0, -0.3, 0); return g; })();
const REEL = [
  { ms: 5400, caption: 'A Bt plant makes its own insect poison, but with too little refuge the pink bollworm evolves around it.', set: { view: 'bt', toxins: 1 }, anim: { refuge: [0, 20] }, view: { pos: [-2.0, 6.5, 13.0], target: [-0.6, 2.0, 0] }, tall: { pos: [-0.4, 7.4, 12.4], target: [-0.4, 4.4, 0] }, spin: 0.15 },
];

export default {
  id: 'growing',
  short: 'Growing it',
  title: 'Growing cotton',
  subtitle: 'Heat, deep black soil, the monsoon, a worm that outran a gene, and the people who carry the risk.',
  view: { pos: [-1.0, 6.6, 15.0], target: [0.2, 2.2, 0] },
  learn: `<p><b>Land.</b> Cotton likes long, warm, frost-free seasons and plenty of sun. In India much of it grows on the <b>black cotton soils</b> (vertisols) of Maharashtra, Gujarat, Telangana and Madhya Pradesh. They swell when wet, crack when dry, and hold water deep down. Vidarbha and Marathwada farm cotton mainly on rain.</p>
    <p><b>Pests and Bt.</b> Bollworm caterpillars eat the bolls. <b>Bt cotton</b> carries a gene from a soil bacterium, <i>Bacillus thuringiensis</i>, and makes a protein that kills them. India's regulator, the GEAC, approved it in 2002, and a two-toxin version, Bollgard II, in 2006.</p>
    <p><b>What happened.</b> The honest picture is mixed. Insecticide use and bollworm damage fell at first. Yields rose in the same years, but researchers disagree on how much was due to Bt: Kranthi and Stone (2020) find it a "poor indicator of yield trends", and link gains to fertiliser and other inputs, while Kathage and Qaim (2012), following 533 farmers, credit Bt with a 24% yield gain per acre. The <b>pink bollworm</b> evolved resistance: first to one toxin in Gujarat by about 2010, then to both. Non-target pests surged, and by that study farmers now spend more on pesticides than before Bt.</p>
    <p><b>Why refuges.</b> Plant some non-Bt cotton and susceptible worms survive to dilute the resistant ones. Indian packs carried refuge seed, but often little of it was planted.</p>
    <p><b>Water.</b> You will see figures from 7,000 to over 20,000 litres per kg. They differ by method and by place. Most of it is rain that would have fallen anyway. ICAC's 2020 to 2024 study gives India about 10,400 litres per kg of lint, but only about 710 from irrigation use. ICAC speaks for cotton-growing governments, so read its framing with that in mind. Where water is short, even blue water matters.</p>
    <p><b>People.</b> Spraying can poison people: in 2017 cotton sprayers in Yavatmal were poisoned and many died. Children have worked in cottonseed fields; the US Department of Labor lists it, and Telangana began an ILO mapping project. NCRB counted 10,786 suicides in India's farming sector in 2023, of which 4,690 were farmers and 6,096 farm labourers. NCRB data does not record crop. Peer-reviewed work stresses debt, crop failure and many other causes, and does not agree that Bt itself is to blame: causation is debated. If this touches you, India's Tele MANAS line is 14416.</p>
    <p class="tip"><b>Try it:</b> set the refuge to zero, and watch how soon the worms take over the model. Then add a second toxin.</p>`,
  terms: [
    { t: 'Vertisol', d: 'Heavy clay soil that swells when wet and cracks when dry. In India: black cotton soil.' },
    { t: 'Bt cotton', d: 'Cotton given a bacterial gene, so it makes a protein toxic to certain caterpillars.' },
    { t: 'Refuge', d: 'Non-Bt plants grown nearby so that susceptible insects survive and mate with resistant ones.' },
    { t: 'Blue and green water', d: 'Green is rain held in soil. Blue is water drawn from rivers or ground.' },
    { t: 'MSP', d: 'Minimum Support Price: the floor at which India\'s government agencies buy a crop. The Cotton Corporation of India does this for cotton.' },
    { t: 'Lakh bale', d: 'A hundred thousand bales. An Indian bale is 170 kg of lint.' },
  ],
  defaults: { view: 'bt', refuge: 5, toxins: 1, rain: 0.5 },
  controls: [
    { key: 'view', type: 'seg', label: 'Look at', options: [{ v: 'land', label: 'Land' }, { v: 'bt', label: 'Bt' }, { v: 'water', label: 'Water' }, { v: 'facts', label: 'Figures' }] },
    { key: 'refuge', type: 'range', label: 'Refuge planted', min: 0, max: 40, step: 1, ends: ['none', 'lots'], fmt: (v) => v + '% of the field' },
    { key: 'toxins', type: 'seg', label: 'Bt toxins (model)', options: [{ v: 1, label: 'One' }, { v: 2, label: 'Two' }] },
    { key: 'rain', type: 'range', label: 'Rain showing', min: 0, max: 1, step: 0.01, ends: ['dry', 'monsoon'], fmt: (v) => Math.round(v * 100) + '%' },
  ],
  quiz: [
    { q: 'What happened to Bt cotton and the pink bollworm in India?', options: ['The worm died out', 'The worm evolved resistance', 'Bt stopped being grown in 2003', 'Nothing changed'], answer: 1, why: 'Survival on one-toxin Bt was reported in Gujarat about 2010, and later on two-toxin cotton as well.' },
    { q: 'Why does most of the water in India\'s cotton figure not come from irrigation?', options: ['Cotton needs no water', 'Most Indian cotton land is rainfed', 'It is all recycled', 'It is a typing error'], answer: 1, why: 'ICAC puts about 36% of India\'s cotton area as irrigated, so most of the water used comes from rain.' },
    { q: 'What can honestly be said of Bt cotton and farmer suicides?', options: ['Bt proven as the cause', 'Bt proven to have no link at all', 'Causes are many, and how much Bt mattered is debated', 'No farmers are affected'], answer: 2, why: 'NCRB data does not record crop. Peer-reviewed studies point to debt, weather and more, and do not settle one single cause.' },
  ],
  reel: REEL,

  build({ stage }) {
    const root = stage.root, R = rng(3);
    // Soil block.
    const soilTex = document.createElement('canvas'); soilTex.width = soilTex.height = 512;
    { const g = soilTex.getContext('2d'); g.fillStyle = '#17120f'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#030303'; g.lineWidth = 3; for (let i = 0; i < 70; i++) { let x = R() * 512, y = R() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 70; y += (R() - 0.5) * 70; g.lineTo(x, y); } g.stroke(); } }
    const tex = new THREE.CanvasTexture(soilTex); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1.4);
    const soilTop = new THREE.Mesh(new THREE.BoxGeometry(14, 1.8, 7), [M.matte(0x241b16), M.matte(0x241b16), M.matte(0xffffff, { map: tex }), M.matte(0x120e0c), M.matte(0x241b16), M.matte(0x241b16)]);
    soilTop.position.y = -0.9; soilTop.receiveShadow = true; root.add(soilTop);
    // Plants, instanced: stems, leaves, open-boll puffs, in rows along X, with refuge rows at the back.
    const ROWS = 5, COLS = 14, N = ROWS * COLS;
    const stems = swarm(N, new THREE.CylinderGeometry(0.03, 0.05, 1, 6), M.matte(0x5a4630));
    const LEAFN = N * 7, leaves = new THREE.InstancedMesh(LEAF_G, M.matte(0xffffff, { side: THREE.DoubleSide }), LEAFN); leaves.castShadow = true;
    const puffs = swarm(N * 3, new THREE.IcosahedronGeometry(0.17, 1), M.matte(0xf6f2e8));
    root.add(stems, leaves, puffs);
    const o = new THREE.Object3D(), plants = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = -6.2 + c * 0.95 + (R() - 0.5) * 0.15, z = -2.6 + r * 1.3, h = 2.2 + R() * 0.7;
      const pl = { x, z, h, r, c, seed: R() }; plants.push(pl);
      const i = plants.length - 1;
      stems.place(i, [x, h / 2, z], null); o.position.set(x, h / 2, z); o.rotation.set(0, 0, 0); o.scale.set(1, h, 1); o.updateMatrix(); stems.setMatrixAt(i, o.matrix);
      for (let k = 0; k < 7; k++) { const a = k * 2.4 + R(), yy = h * (0.25 + (k / 7) * 0.72), d = 0.34 + (1 - k / 7) * 0.36; o.position.set(x + Math.cos(a) * d, yy, z + Math.sin(a) * d); o.rotation.set(-1 + R() * 0.5, a, R()); o.scale.setScalar(0.58 + R() * 0.2); o.updateMatrix(); leaves.setMatrixAt(i * 7 + k, o.matrix); }
      for (let k = 0; k < 3; k++) { const a = R() * 6.28, yy = h * (0.45 + R() * 0.45), d = 0.25 + R() * 0.25; puffs.place(i * 3 + k, [x + Math.cos(a) * d, yy, z + Math.sin(a) * d], null, 0.8 + R() * 0.5); }
    }
    stems.done(); puffs.done(); leaves.instanceMatrix.needsUpdate = true;
    // Caterpillars, pink.
    const NW = 60, worms = swarm(NW, new THREE.CapsuleGeometry(0.055, 0.2, 4, 8), M.plastic(0xff6f9f)); root.add(worms);
    const Wm = Array.from({ length: NW }, (_, i) => ({ p: plants[(i * 37) % N], a: R() * 6.28, y: 0.4 + R() * 0.55, order: R() }));
    // Rain.
    const NR = 170, rain = swarm(NR, new THREE.CylinderGeometry(0.012, 0.012, 0.32, 5), M.glow(0x8ec8ff, { transparent: true, opacity: 0.75 })); root.add(rain);
    const Rn = Array.from({ length: NR }, () => ({ x: (R() - 0.5) * 13, y: R() * 8, z: (R() - 0.5) * 6.4 }));
    // Soil water shown as a band in the cross-section at the front.
    const sw = box(14.04, 1, 0.04, M.clear(0x3d7fd0, 0.45, { depthWrite: false })); sw.position.set(0, -0.8, 3.52); root.add(sw);
    // A board that changes with the view.
    let snap = null;
    const bd = board(root, 6.2, 3.96, 560, 358, (g, w, h) => {
      panelBg(g, w, h);
      if (!snap) return;
      if (snap.view === 'bt') {
        title(g, 'Resistance gene in the worms', 'Illustrative, tuned to 8 years at a 5% refuge');
        const A = axes(g, { x0: 74, x1: w - 26, y0: h - 36, y1: 76, xMin: 0, xMax: 30, yMin: 0, yMax: 100, xTicks: [0, 10, 20, 30], yTicks: [0, 50, 100], xFmt: (v) => v + ' y', yFmt: (v) => v + '%' });
        const cur = resistanceCurve(snap.refuge, snap.toxins);
        plot(g, resistanceCurve(0, 1).pts.map(([x, y]) => [x, y * 100]), A.X, A.Y, 'rgba(255,255,255,.25)', 3);
        plot(g, cur.pts.map(([x, y]) => [x, y * 100]), A.X, A.Y, COL.hot, 5);
        g.strokeStyle = COL.ok; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(A.X(8), 76); g.lineTo(A.X(8), h - 36); g.stroke(); g.setLineDash([]);
        g.fillStyle = COL.ok; g.font = '18px sans-serif'; g.fillText('India: about 8 years, one toxin', A.X(8) + 8, 96);
      } else if (snap.view === 'water') {
        title(g, 'Litres of water per kg of lint', 'ICAC study, 5-year mean 2020–2024');
        const rows = [['India', WATER.india], ['World', WATER.world]];
        const x0 = 90, W = w - x0 - 20, max = 11000; g.font = '20px sans-serif';
        rows.forEach(([nm, d], i) => {
          const y = 78 + i * 92, rW = (d.rain / max) * W, bW = (d.blue / max) * W;
          g.fillStyle = COL.text; g.fillText(nm, 20, y + 27);
          g.fillStyle = '#4a9b6d'; g.fillRect(x0, y, rW, 40); g.fillStyle = '#4b92e6'; g.fillRect(x0 + rW, y, bW, 40);
          g.fillStyle = COL.text; g.fillText(`${fmtN(d.rain + d.blue)} L: ${fmtN(d.rain)} rain, ${fmtN(d.blue)} blue`, x0, y + 66);
        });
        g.fillStyle = 'rgba(255,255,255,.72)'; g.font = '19px sans-serif';
        wrap(g, `Irrigated share of India's cotton area: ${Math.round((WATER.india.irrigated / WATER.india.area) * 100)}%. Older studies differ: figures depend on method, year and place.`, 20, 288, w - 40, 25);
      } else if (snap.view === 'facts') {
        title(g, 'India, from official figures');
        g.font = '18px sans-serif'; let y = 70; const line = (a, b) => { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(a, 20, y); g.fillStyle = COL.heat; const tw = g.measureText(b).width; g.fillText(b, w - 20 - tw, y); y += 32; };
        line('Production 2020-21', '352.48 lakh bales'); line('Production 2025-26', '290.91 lakh bales'); line('Area 2020-21', '132.85 lakh ha'); line('Area 2025-26', '114.82 lakh ha'); line('Yield range', '428–451 kg/ha'); line('World mean yield (ICAC)', '786 kg/ha');
        line(`MSP ${MSP.year}, medium staple`, `₹${fmtN(MSP.medium)}/quintal`); line(`MSP ${MSP.year}, long staple`, `₹${fmtN(MSP.long)}/quintal`);
        g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '15px sans-serif'; g.fillText('Largest area of any country; second to China in output (USDA, ICAC).', 20, h - 12);
      } else {
        title(g, 'What cotton asks of the land');
        g.font = '19px sans-serif'; g.fillStyle = COL.text; let y = 72;
        ['Frost-free for about 6 months', 'Warm: flower to open boll, about 850 heat units', 'Plenty of sun during flowering and boll fill', 'Water when bolls are filling; dry when they open', 'Black soil cracks in the dry months and stores water deep'].forEach((t) => { g.fillStyle = COL.leaf; g.fillText('•', 20, y); g.fillStyle = COL.text; y = wrap(g, t, 42, y, w - 70, 25) + 6; });
        g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; wrap(g, 'Cotton zones of India: North (irrigated), Central and South (largely rainfed).', 20, h - 34, w - 40, 21);
      }
    }, [4.1, 5.6, -3.6]);
    bd.mesh.rotation.y = -0.15;
    const col = new THREE.Color(), Bt = new THREE.Color(0x2c6a34), Ref = new THREE.Color(0x8aa630);
    const lRef = stage.label('Refuge rows: not Bt', [-4.4, 3.2, 2.6], root, 'hot');
    const lSoil = stage.label('Black cotton soil holds water deep', [-3.6, -1.2, 3.7]);
    const lWorm = stage.label('Pink bollworm', [-1.2, 3.3, 0.4]);
    let lastKey = '', t = 0, refuged = -1, wp = 0;

    return {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        tallView(stage, REEL);
        const tall = placeBoards(stage, [bd], { x: -0.4, top: 8.1, scale: 1.25, z: 0 });
        fitNarrow(stage, [lSoil, lWorm]);
        // Refuge rows are lighter green: as a share of the plants.
        const nRef = Math.round((s.refuge / 100) * N);
        if (refuged !== nRef) { refuged = nRef; plants.forEach((p, i) => { const isRef = (ROWS - 1 - p.r) * COLS + p.c < nRef; col.copy(isRef ? Ref : Bt); for (let k = 0; k < 7; k++) leaves.setColorAt(i * 7 + k, col); }); leaves.instanceColor.needsUpdate = true; lRef.visible = nRef > 0; }
        const cur = resistanceCurve(s.refuge, s.toxins), y10 = cur.pts.find((p) => p[0] >= 10)?.[1] ?? 0;
        const showW = s.view === 'bt', count = showW ? Math.round(clamp(0.12 + y10, 0, 1) * NW) : 0; wp = t;
        for (let i = 0; i < NW; i++) { const w = Wm[i]; if (i >= count) { worms.place(i, [0, -5, 0], null, 0.001); continue; } const a = w.a + t * 0.2, d = 0.42; worms.place(i, [w.p.x + Math.cos(a) * d, w.p.h * w.y, w.p.z + Math.sin(a) * d], [0, a, Math.PI / 2 + Math.sin(t * 2 + i) * 0.2], 1); } worms.done();
        lWorm.visible = showW && stage.host.clientWidth >= 560;
        const on = s.view === 'water' || s.view === 'land' ? s.rain : 0;
        for (let i = 0; i < NR; i++) { const d = Rn[i]; d.y -= dt * 8; if (d.y < 0) d.y += 8; rain.place(i, [d.x, d.y, d.z], null, i / NR < on ? 1 : 0.001); } rain.done();
        sw.scale.y = lerp(0.2, 1.6, s.rain); sw.position.y = -1.8 + (lerp(0.2, 1.6, s.rain)) / 2 + 0.02; sw.visible = s.view !== 'bt';
        const key = [s.view, s.refuge, s.toxins].join();
        if (key !== lastKey) { lastKey = key; snap = { view: s.view, refuge: s.refuge, toxins: s.toxins }; bd.redraw(); }
      },
      readout: (s) => {
        if (s.view === 'bt') { const c = resistanceCurve(s.refuge, s.toxins); return `<div class="big">Half resistant: ${c.half === null ? 'not in 30 years' : `about year ${c.half.toFixed(1)}`}</div><div class="row"><span>Refuge</span><b>${s.refuge}%, ${s.toxins === 1 ? 'one toxin' : 'two toxins'}</b></div><div class="row"><span>Model only</span><b>one gene, three generations a year</b></div>`; }
        if (s.view === 'water') return `<div class="big">India: ${fmtN(WATER.india.rain + WATER.india.blue)} L per kg lint</div><div class="row"><span>Rain / irrigation used</span><b>${fmtN(WATER.india.rain)} / ${fmtN(WATER.india.blue)}</b></div><div class="row"><span>Irrigation applied</span><b>${fmtN(WATER.india.applied)} L/kg</b></div><div class="row"><span>India's lint yield</span><b>${WATER.india.yield} kg/ha</b></div>`;
        if (s.view === 'facts') return `<div class="big">290.91 lakh bales in 2025-26</div><div class="row"><span>That is</span><b>${(290.91e5 * 170 / 1e9).toFixed(2)} million tonnes</b></div><div class="row"><span>Yield it implies</span><b>${Math.round(290.91e5 * 170 / 114.82e5)} kg/ha</b></div>`;
        return `<div class="big">Warm, sunny, deep soil</div><div class="row"><span>Irrigated share, India</span><b>${Math.round((WATER.india.irrigated / WATER.india.area) * 100)}%</b></div><div class="row"><span>Rainfed share, world</span><b>56%</b></div>`;
      },
    };
  },
};
