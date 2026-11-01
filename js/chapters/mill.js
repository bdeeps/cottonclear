// Chapter 4 (centrepiece): boll to cloth. Six stations along X; the station control moves the camera.
// Numbers from spinModel() and rawCotton() in cotton.js. Ginning outturn: average about 36% in India (ITMF Spinners
// Committee report on India, 2013); individual lines ran 30–41% in a rainfed trial. Bale 170 kg lint (Indian trade standard).
import { THREE, M, clamp, lerp, smooth, spinModel, rawCotton, ITEMS, micOfStaple, cyl, fluff, hairs, makePlant, board, panelBg, title, axes, plot, dot, COL, link, rng, fitNarrow, tallView, placeBoards, makeBoll, fmtN } from '../cotton.js';
import { swarm, box } from '../kit.js';

const DX = 8;
const VIEWS = [
  { pos: [0.4, 3.9, 11.2], target: [0.4, 2.4, 0] },
  { pos: [DX + 4.6, 5.2, 8.6], target: [DX, 2.3, 0] },
  { pos: [DX * 2 + 3.6, 5.2, 11.8], target: [DX * 2 + 0.7, 2.5, 0] },
  { pos: [DX * 3 + 3.2, 5.0, 8.8], target: [DX * 3, 2.3, 0] },
  { pos: [DX * 4 + 1.5, 4.0, 12.6], target: [DX * 4 + 1.5, 3.0, 0] },
  { pos: [DX * 5, 4.8, 10.6], target: [DX * 5, 2.4, 0] },
];
const TALL = VIEWS.map((v) => ({ pos: [v.target[0] + 1.8, v.target[1] + 1.4, 5.8], target: [v.target[0], v.target[1] + 0.3, 0] }));
TALL[4] = { pos: [DX * 4 + 1.2, 5.0, 7.4], target: [DX * 4 + 1.2, 4.6, 0] };
const STN = ['Pick', 'Gin', 'Card', 'Draw', 'Spin', 'Weave'];
const REEL = [
  { ms: 4800, caption: 'Pick the seed cotton, then the gin pulls the lint off the seed: about a third of the weight is lint.', set: { station: 1, gin: 'roller', got: 36 }, view: VIEWS[1], tall: TALL[1], spin: 0.15 },
  { ms: 6000, caption: 'Spinning adds twist. Twist presses fibres together, the pressure makes friction, and friction makes strength.', set: { station: 4, staple: 28, ne: 30, load: true }, anim: { alpha: [0.8, 4.2] }, view: VIEWS[4], tall: TALL[4], spin: 0.1 },
  ];

export default {
  id: 'mill',
  short: 'Boll to cloth',
  title: 'From boll to cloth',
  subtitle: 'Fibres barely 3 cm long become kilometres of thread. Twist is the trick.',
  view: VIEWS[4],
  learn: `<p><b>Pick.</b> In India most cotton is still picked by hand, often by women, several rounds a season. Machine pickers do the job in much of the USA and Australia.</p>
    <p><b>Gin.</b> The gin pulls lint from the seed. India's old <b>charkhi</b> (churka) squeezes it between two rollers, and modern roller gins still work on this idea. The <b>saw gin</b>, patented by Eli Whitney in 1794, tears it through a grid with toothed wheels. Roughly a <b>third</b> of seed cotton by weight is lint: Indian gins average about 36%. Most of the rest is seed, crushed for <b>cottonseed oil</b> and cattle cake, while fuzz goes into things like paper.</p>
    <p><b>Card and draw.</b> Wire teeth open the tufts and comb them roughly parallel into a soft rope called a <b>sliver</b>. Drawing frames pull several slivers together into one, evening them out, with rollers running faster and faster.</p>
    <p><b>Spin.</b> The key step. Fibres are short and slippery, so a loose bundle just pulls apart. <b>Twist</b> makes the outer fibres squeeze the inner ones when the yarn is pulled. That pressure makes <b>friction</b>, and the friction holds. Twist too much, though, and fibres lie at a steep angle and pull less along the yarn, so strength peaks and falls.</p>
    <p><b>Staple sets the limit.</b> A thin yarn has few fibres across. Longer fibres grip over more length, so they can spin a finer yarn. That is why long-staple cotton makes fine shirting. The count <b>Ne</b> says how fine: higher means thinner.</p>
    <p><b>Weave.</b> A loom lifts half the lengthwise threads (<b>warp</b>) and shoots a crosswise thread (<b>weft</b>) through. Finishing can follow: <b>mercerising</b> in strong alkali gives lustre (see ${link('acidbaseclear', 'AcidBaseClear')}).</p>
    <p class="tip"><b>Try it:</b> at Spin, drop the twist and watch the fibres slip. Then ask for 80s yarn from a short staple, and see what the model says.</p>`,
  terms: [
    { t: 'Ginning outturn', d: 'The share of seed cotton\'s weight that comes out as lint.' },
    { t: 'Sliver', d: 'A soft, untwisted rope of fibres made by carding and drawing.' },
    { t: 'Staple', d: 'The typical length of the fibres in a batch of cotton.' },
    { t: 'Yarn count (Ne)', d: 'How many 840-yard hanks weigh one pound. Higher count means finer yarn.' },
    { t: 'Twist multiplier', d: 'Turns per inch divided by the square root of the count: how twisted a yarn is, whatever its thickness.' },
    { t: 'Warp and weft', d: 'Warp threads run along the cloth. Weft threads cross them.' },
  ],
  defaults: { station: 4, gin: 'roller', got: 36, staple: 28, ne: 30, alpha: 4, load: true, item: 'shirt' },
  controls: [
    { key: 'station', type: 'seg', label: 'Go to', options: STN.map((l, v) => ({ v, label: l })) },
    { key: 'staple', type: 'range', label: 'Staple length', min: 20, max: 38, step: 0.5, ends: ['short', 'long'], fmt: (v) => v.toFixed(1) + ' mm' },
    { key: 'ne', type: 'range', label: 'Yarn count wanted', min: 6, max: 120, step: 1, ends: ['coarse', 'fine'], fmt: (v) => v + 's Ne' },
    { key: 'alpha', type: 'range', label: 'Twist multiplier', min: 0.5, max: 8, step: 0.1, ends: ['loose', 'tight'], fmt: (v) => v.toFixed(1) },
    { key: 'load', type: 'toggle', label: 'Pull on the yarn' },
    { key: 'gin', type: 'seg', label: 'Gin', options: [{ v: 'roller', label: 'Roller' }, { v: 'saw', label: 'Saw' }] },
    { key: 'got', type: 'range', label: 'Ginning outturn', min: 30, max: 42, step: 0.5, fmt: (v) => v.toFixed(1) + '% lint' },
    { key: 'item', type: 'seg', label: 'Make', options: [{ v: 'shirt', label: 'Shirt' }, { v: 'sari', label: 'Sari' }] },
  ],
  quiz: [
    { q: 'What does twist do for a yarn?', options: ['Makes it lighter', 'Squeezes fibres so friction holds them together', 'Glues them chemically', 'Bleaches them'], answer: 1, why: 'Under load a twisted yarn squeezes inward. The squeeze makes friction, and that holds short fibres in place.' },
    { q: 'Roughly how much of seed cotton by weight is lint?', options: ['About 5%', 'About a third', 'About 80%', 'All of it'], answer: 1, why: 'Indian gins average about 36%. Most of the rest is seed, which gives oil and cattle cake.' },
    { q: 'Why can long staple spin a finer yarn?', options: ['It is whiter', 'Each fibre overlaps its neighbours over more length, so fewer fibres across can still hold', 'It weighs more', 'It is wetter'], answer: 1, why: 'More overlap gives more total friction per fibre, so a thinner yarn with fewer fibres across will still hold together.' },
  ],
  reel: REEL,

  build({ stage }) {
    const root = stage.root, wood = M.matte(0x7a5a3a), iron = M.metal(0x8b93a0), steel = M.metal(0xc0c6d0, { roughness: 0.35 }), dark = M.matte(0x2a2f3a);
    const plinth = box(DX * 5 + 14, 0.2, 5, M.matte(0x1b1f28)); plinth.position.set(DX * 2.5, 0.1, 0); root.add(plinth);
    const name = (i, t) => stage.label(t, [DX * i + (i === 4 ? 1.5 : 0), 0.45, 2.4], root, 'hot');
    STN.forEach((t, i) => name(i, `${i + 1}. ${t}`));
    const R = rng(4);

    // 1 Pick: a plant, a sack and heaped seed cotton.
    const p0 = new THREE.Group(); p0.position.set(0, 0.2, 0); root.add(p0);
    const pl = makePlant({ h: 4.2, seed: 15 }); pl.position.x = -1.6; p0.add(pl);
    const sack = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.6, 20), M.matte(0xb99a6a)); sack.position.set(2.1, 0.8, 0); sack.castShadow = true; p0.add(sack);
    const heap = fluff(1.25, 60, 9); heap.position.set(2.1, 1.85, 0); heap.scale.y = 0.72; p0.add(heap);

    // 2 Gin: rollers or saw, with lint out right and seeds down.
    const gin = new THREE.Group(); gin.position.set(DX, 0.2, 0); root.add(gin);
    const frame = box(4.4, 0.25, 3, wood); frame.position.y = 1.5; gin.add(frame);
    [[-2, -1.3], [2, -1.3], [-2, 1.3], [2, 1.3]].forEach(([x, z]) => { const l = box(0.25, 1.5, 0.25, wood); l.position.set(x, 0.75, z); gin.add(l); });
    const rA = cyl(0, 3.2, 0, 0.5, 2.8, steel), rB = cyl(0, 2.2, 0, 0.5, 2.8, wood);
    const roller = new THREE.Group(); roller.add(rA, rB); gin.add(roller);
    const saw = new THREE.Group(); gin.add(saw);
    const NS = 9; const sawDisks = [];
    for (let i = 0; i < NS; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 28), iron); d.geometry.rotateX(Math.PI / 2); d.position.set(0, 2.7, -1.2 + (i * 2.4) / (NS - 1)); saw.add(d); sawDisks.push(d); }
    const inPile = fluff(0.72, 40, 21); inPile.position.set(-1.45, 2.7, 0); gin.add(inPile);
    const outPile = fluff(0.78, 40, 22); outPile.position.set(1.6, 2.45, 0); gin.add(outPile);
    const NSD = 18, seeds = swarm(NSD, new THREE.SphereGeometry(0.1, 10, 8), M.matte(0x2b211b)); seeds.scale.set(1, 1, 1); gin.add(seeds);
    const Sd = Array.from({ length: NSD }, (_, i) => ({ t: i / NSD, z: (R() - 0.5) * 2.2, dx: (R() - 0.5) * 0.3 }));
    const NF = 40, lintFly = swarm(NF, new THREE.SphereGeometry(0.07, 8, 6), M.matte(0xf6f2e8)); gin.add(lintFly);
    const Lf = Array.from({ length: NF }, (_, i) => ({ t: i / NF, z: (R() - 0.5) * 2.4 }));
    const lLint = stage.label('Lint', [2, 3.8, 0.4], gin), lSeed = stage.label('Seed falls away', [0.1, 0.7, 1.7], gin);

    // 3 Card: main cylinder, flats, doffer, web into a sliver.
    const card = new THREE.Group(); card.position.set(DX * 2, 0.2, 0); root.add(card);
    const main = cyl(-0.3, 2.6, 0, 1.75, 2.8, iron), doffer = cyl(2.25, 2.0, 0, 0.8, 2.8, steel), lick = cyl(-2.55, 1.8, 0, 0.55, 2.8, dark);
    card.add(main, doffer, lick);
    const teeth = (m, r, n) => { const s = swarm(n, new THREE.ConeGeometry(0.03, 0.11, 5), M.metal(0xdde2ea)); for (let i = 0; i < n; i++) { const a = R() * 6.28, z = (R() - 0.5) * 2.7; s.place(i, [Math.cos(a) * (r + 0.04), Math.sin(a) * (r + 0.04), z], [0, 0, a - Math.PI / 2], 1); } s.done(); m.add(s); s.position.set(0, 0, 0); return s; };
    const tM = teeth(new THREE.Group(), 1.75, 340); tM.position.set(-0.3, 2.6, 0); card.add(tM); const tD = teeth(new THREE.Group(), 0.8, 150); tD.position.set(2.25, 2.0, 0); card.add(tD);
    const web = box(1.6, 0.03, 2.6, M.clear(0xffffff, 0.55)); web.position.set(3.6, 1.8, 0); card.add(web);
    const sliverMat = M.matte(0xf6f2e8);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 20), M.plastic(0x3b6fb5)); can.position.set(4.4, 0.75, 0); card.add(can);
    const sl = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(3.9, 1.8, 0), new THREE.Vector3(4.3, 1.75, 0), new THREE.Vector3(4.4, 1.45, 0)]), 16, 0.13, 8), sliverMat); card.add(sl);
    const NCF = 26, cardFib = hairs(NCF, 0.018, M.matte(0xf6f2e8)); card.add(cardFib);
    stage.label('Wire teeth comb the tufts', [3.6, 3.4, 0], card);

    // 4 Draw: pairs of rollers running faster along the line.
    const draw = new THREE.Group(); draw.position.set(DX * 3, 0.2, 0); root.add(draw);
    const stand = box(5.6, 0.3, 2.6, dark); stand.position.y = 1.65; draw.add(stand);
    const pairs = [];
    [-2.1, -0.7, 0.7, 2.1].forEach((x, i) => { const a = cyl(x, 2.55, 0, 0.32, 2.4, steel), b = cyl(x, 2.0 + 0.12, 0, 0.32, 2.4, wood); draw.add(a, b); pairs.push({ a, b, w: [1, 1.6, 2.4, 6][i] }); });
    const NSL = 6, slivers = []; for (let i = 0; i < NSL; i++) { const z = -0.9 + i * 0.36; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), sliverMat); m.rotation.z = Math.PI / 2; m.position.set(-3.1, 2.34, z); draw.add(m); slivers.push(m); }
    const outS = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 10), sliverMat); outS.rotation.z = Math.PI / 2; outS.position.set(3.1, 2.34, 0); draw.add(outS);
    const thin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 1.6), M.clear(0xffffff, 0.55)); thin.position.set(0, 2.34, 0); draw.add(thin);
    const lDraw = stage.label('Six slivers in, one even sliver out', [0.3, 3.5, 0.4], draw);

    // 5 Spin: a ring spindle and, above, the yarn close up with its fibres on a helix.
    const spin = new THREE.Group(); spin.position.set(DX * 4 + 1.5, 0.2, 0); root.add(spin);
    const spX = -3.6;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 32), steel); ring.rotation.x = Math.PI / 2; ring.position.set(spX, 1.8, 0); spin.add(ring);
    const bobbin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 2.4, 14), M.matte(0xd9c9a8)); bobbin.position.set(spX, 1.7, 0); spin.add(bobbin);
    const cop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 1.0, 18), M.matte(0xf6f2e8)); cop.position.set(spX, 1.3, 0); spin.add(cop);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), steel); eye.position.set(spX, 3.5, 0); spin.add(eye);
    const NB = 40, balloon = hairs(NB, 0.009, M.matte(0xf6f2e8)); spin.add(balloon);
    const lSp = stage.label('Ring spindle', [spX, 3.82, 0], spin);
    const fZ = 0.35, NFib = 14, NSeg = 26, yarnFib = hairs(NFib * NSeg, 0.03, M.matte(0xf6efd6), 6); yarnFib.position.set(0, 3.9, fZ); spin.add(yarnFib);
    const Fi = Array.from({ length: NFib }, (_, i) => ({ a: (i * 6.283) / 7 + (i % 2) * 0.4, r: i % 2 ? 0.58 : 0.26, x0: -3.0 + ((i * 0.618) % 1) * 3.4 }));
    const clampA = cyl(-3.3, 3.9, fZ, 0.2, 1.3, steel, 'y'), clampB = cyl(3.1, 3.9, fZ, 0.2, 1.3, steel, 'y'); spin.add(clampA, clampB);
    const bigL = stage.label('', [2.6, 5.25, fZ], spin, 'hot');
    let snap = null;
    const chart = board(spin, 6.2, 2.5, 620, 250, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Strength (cN/tex) against twist multiplier', 'Model: friction grip × thread angle');
      if (!snap) return;
      const top = 76, bot = h - 34, A = axes(g, { x0: 60, x1: w - 30, y0: bot, y1: top, xMin: 0.5, xMax: 8, yMin: 0, yMax: 24, xTicks: [2, 4, 6, 8], yTicks: [0, 10, 20] });
      const pts = []; let best = [0, 0]; for (let a = 0.5; a <= 8; a += 0.1) { const m = spinModel(snap.staple, snap.ne, a); pts.push([a, m.ten]); if (m.ten > best[1]) best = [a, m.ten]; }
      plot(g, pts, A.X, A.Y, COL.heat, 4); const m = spinModel(snap.staple, snap.ne, snap.alpha); dot(g, A.X(snap.alpha), A.Y(m.ten), COL.hot, 9);
      g.fillStyle = COL.ok; g.font = '18px sans-serif'; g.fillText(`peak near ${best[0].toFixed(1)}`, A.X(best[0]) - 34, A.Y(best[1]) - 12);
    }, [0, 1.65, -0.55]);

    // 6 Weave: warp threads, two heddles, a shuttle and growing cloth.
    const loom = new THREE.Group(); loom.position.set(DX * 5, 0.2, 0); root.add(loom);
    const beamB = cyl(0, 3.0, -3, 0.2, 5, wood, 'x'), beamF = cyl(0, 1.3, 2.2, 0.2, 5, wood, 'x'); loom.add(beamB, beamF);
    [[-2.6, -3], [2.6, -3], [-2.6, 2.2], [2.6, 2.2]].forEach(([x, z]) => { const l = box(0.18, z < 0 ? 3 : 1.3, 0.18, wood); l.position.set(x, z < 0 ? 1.5 : 0.65, z); loom.add(l); });
    const NWa = 34, warp = hairs(NWa * 2, 0.012, M.matte(0xefe7d3)); loom.add(warp);
    const NWe = 26, weft = swarm(NWe, new THREE.CylinderGeometry(0.018, 0.018, 4.6, 6), M.matte(0xf4c28a)); loom.add(weft);
    const hd = box(4.8, 0.08, 0.08, dark), hd2 = box(4.8, 0.08, 0.08, dark); loom.add(hd, hd2);
    const shuttle = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 6, 12), M.plastic(0xc49bff)); shuttle.rotation.z = Math.PI / 2; loom.add(shuttle);
    const reed = box(5, 0.9, 0.05, M.clear(0xffffff, 0.2)); loom.add(reed);
    const lWarp = stage.label('Warp', [-2.2, 2.75, -1.8], loom), lWeft = stage.label('Weft', [2.8, 2.1, 0], loom, 'hot');

    let last = null, t = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (last !== s.station) { if (last !== null) stage.setView(VIEWS[s.station].pos, VIEWS[s.station].target, 1); last = s.station; }
        tallView(stage, REEL);
        placeBoards(stage, [chart], { x: 0, top: 7.6, scale: 1.0, z: 0.4 });
        const narrow = fitNarrow(stage, [lSp, lDraw, lSeed]);
        // Gin
        roller.visible = s.gin === 'roller'; saw.visible = s.gin === 'saw';
        rA.rotation.z += 2.2 * dt; rB.rotation.z -= 2.2 * dt; sawDisks.forEach((d) => { d.rotation.z -= 3 * dt; });
        for (let i = 0; i < NSD; i++) { const p = Sd[i]; p.t = (p.t + dt * 0.34) % 1; const k = p.t; seeds.place(i, [-0.6 + p.dx, 2.45 - k * 2.2, p.z], null, 1); } seeds.done();
        const share = s.got / 100, nL = Math.round(clamp(share / 0.42, 0, 1) * NF);
        for (let i = 0; i < NF; i++) { const p = Lf[i]; p.t = (p.t + dt * 0.5) % 1; lintFly.place(i, [-0.3 + p.t * 2, 2.72 + Math.sin(p.t * 9 + i) * 0.12, p.z], null, i < nL ? 1 : 0.001); } lintFly.done();
        // Card
        main.rotation.z -= 1.2 * dt; tM.rotation.z = main.rotation.z; doffer.rotation.z += 0.5 * dt; tD.rotation.z = doffer.rotation.z; lick.rotation.z += 2 * dt;
        for (let i = 0; i < NCF; i++) { const u = (i * 0.27 + t * 0.2) % 1, ang = Math.PI - u * Math.PI * 1.1, ca = Math.cos(ang), sa = Math.sin(ang), rr = 1.88, z = -1.2 + (i * 0.73) % 2.4; const tang = lerp(0.9, 0.05, u); cardFib.seg(i, [-0.3 + ca * rr, 2.6 + sa * rr, z], [-0.3 + ca * rr - sa * 0.3 + tang * 0.2, 2.6 + sa * rr + ca * 0.3 + tang * 0.2, z + tang * 0.2]); } cardFib.done();
        // Draw
        pairs.forEach((p) => { p.a.rotation.z -= p.w * 1.3 * dt; p.b.rotation.z += p.w * 1.3 * dt; });
        // Spin: the yarn close up, fibres on a helix with their angle set by the real model.
        const m = spinModel(s.staple, s.ne, s.alpha), tanT = Math.tan(m.theta), rFor = 0.72;
        const turnsPerUnit = tanT / (2 * Math.PI * rFor) * 2.4;
        const slip = s.load ? clamp(1 - m.grip * 1.1, 0, 1) * 0.5 : 0;
        slipK = approachK(slipK, slip, dt);
        for (let i = 0; i < NFib; i++) {
          const f = Fi[i], dir = i % 2 ? 1 : -1, off = dir * slipK * 1.1, Lf2 = (s.staple / 28) * 3.0;
          for (let k = 0; k < NSeg; k++) {
            const u0 = k / NSeg, u1 = (k + 1) / NSeg, x0 = f.x0 + off + u0 * Lf2, x1 = f.x0 + off + u1 * Lf2;
            const R0 = f.r * (s.load ? 1 - 0.12 * m.grip : 1);
            const P = (x) => [x, Math.cos(f.a + x * turnsPerUnit * 6.283) * R0, Math.sin(f.a + x * turnsPerUnit * 6.283) * R0];
            yarnFib.seg(i * NSeg + k, P(x0), P(x1), 1);
          }
        }
        yarnFib.done();
        bigL.element.textContent = `Thread angle ${(m.theta * 57.3).toFixed(0)}°${s.load && m.grip < 0.6 ? ': fibres slipping' : s.load ? ': friction holds' : ''}`;
        for (let i = 0; i < NB; i++) { const u0 = i / NB, u1 = (i + 1) / NB, r = (u) => Math.sin(u * 3.14) * 0.42, a = (u) => t * 12 + u * 2; const P = (u) => [spX + Math.cos(a(u)) * (r(u) + 0.02), 1.9 + u * 1.6, Math.sin(a(u)) * (r(u) + 0.02)]; balloon.seg(i, P(u0), P(u1), 1); } balloon.done();
        bobbin.rotation.y += 6 * dt; cop.rotation.y += 6 * dt;
        if (Math.abs((snap?.staple ?? -1) - s.staple) + Math.abs((snap?.ne ?? -1) - s.ne) + Math.abs((snap?.alpha ?? -1) - s.alpha) > 0.001) { snap = { staple: s.staple, ne: s.ne, alpha: s.alpha }; chart.redraw(); }
        // Weave: plain weave, the heddles swap each pick.
        const cyc = (t * 0.55) % 2, phase = cyc < 1 ? 0 : 1, sw = Math.sin(((cyc % 1)) * Math.PI);
        const fell = 0.8;
        for (let i = 0; i < NWa; i++) {
          const x = -2.3 + (i * 4.6) / (NWa - 1), up = (i % 2) === phase, hy = 2.15 + (up ? 0.35 : -0.35) * Math.min(1, sw * 2);
          warp.seg(i * 2, [x, 3.0, -3], [x, hy, -0.9]); warp.seg(i * 2 + 1, [x, hy, -0.9], [x, 2.02, fell]);
        }
        warp.done();
        hd.position.set(0, 2.5, -0.9); hd2.position.set(0, 1.8, -0.9);
        const beat = (cyc % 1) > 0.8 ? ((cyc % 1) - 0.8) / 0.2 : 0;
        reed.position.set(0, 2.1, lerp(-0.1, fell, beat));
        const sx = lerp(-2.7, 2.7, phase ? 1 - ((cyc % 1) / 0.8) : (cyc % 1) / 0.8);
        shuttle.position.set(clamp(sx, -2.7, 2.7), 2.15, -0.25);
        for (let i = 0; i < NWe; i++) weft.place(i, [0, 2.02 - i * 0.012, fell + i * 0.052], [0, 0, Math.PI / 2], 1); weft.done();
        lWarp.visible = lWeft.visible = !narrow;
      },
      readout: (s) => {
        const r = rawCotton(s.item, s.got), m = spinModel(s.staple, s.ne, s.alpha);
        if (s.station <= 1) return `<div class="big">${s.got.toFixed(1)}% of it is lint</div>
          <div class="row"><span>100 kg of seed cotton gives</span><b>${s.got.toFixed(0)} kg lint</b></div>
          <div class="row"><span>A 170 kg bale needs</span><b>${fmtN(170 / (s.got / 100))} kg seed cotton</b></div>
          <div class="row"><span>Gin</span><b>${s.gin === 'roller' ? 'roller: gentler, for longer staple' : 'saw: faster, for upland'}</b></div>`;
        if (s.station === 2 || s.station === 3) return `<div class="big">From tangle to rope</div>
          <div class="row"><span>Draft of the drawing frame</span><b>6: six in, one out</b></div>
          <div class="row"><span>Staple you chose</span><b>${s.staple.toFixed(1)} mm</b></div>
          <div class="row"><span>Fibres typically (model)</span><b>${micOfStaple(s.staple).toFixed(1)} micronaire</b></div>`;
        if (s.station === 5) return `<div class="big">${ITEMS[s.item].name}: about ${fmtN(Math.round(r.bolls / 10) * 10)} bolls</div>
          <div class="row"><span>Cloth (estimate)</span><b>${fmtN(r.g)} g</b></div>
          <div class="row"><span>Lint needed</span><b>${fmtN(r.lint)} g</b></div>
          <div class="row"><span>Seed cotton picked</span><b>${(r.seed / 1000).toFixed(2)} kg</b></div>
          <div class="row"><span>Cottonseed and trash left</span><b>${(r.cottonseed / 1000).toFixed(2)} kg</b></div>`;
        return `<div class="big">${s.ne}s yarn: ${m.spinnable ? `<span class="ok">spins</span>` : `<span class="no">too fine</span>`}</div>
          <div class="row"><span>Linear density</span><b>${m.tex.toFixed(1)} tex</b></div>
          <div class="row"><span>Fibres across / minimum (model)</span><b>${m.n.toFixed(0)} / ${m.nMin.toFixed(0)}</b></div>
          <div class="row"><span>Finest for this staple (model)</span><b>about ${m.maxNe.toFixed(0)}s</b></div>
          <div class="row"><span>Twist</span><b>${m.tpi.toFixed(1)} turns per inch</b></div>
          <div class="row"><span>Strength (model)</span><b>${m.ten.toFixed(1)} cN/tex</b></div>`;
      },
    };
  },
};
let slipK = 0;
function approachK(v, target, dt) { return v + (target - v) * (1 - Math.exp(-2.4 * dt)); }
