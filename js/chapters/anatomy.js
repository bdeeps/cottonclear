// Chapter 1: the plant and the fibre. Plant on the left; on the right a boll, a seed and one fibre magnified.
// Layer names follow Jan et al. 2022 (PMC9101851) and Cotton Physiology ch. 26. Scales are deliberately different:
// the plant is about 1 m tall in life, a boll about 4 cm, a seed under 1 cm, a fibre about 15 µm across.
import { THREE, M, clamp, smooth, makePlant, makeBoll, makeSeed, makeFlower, link, fitNarrow, tallView, inReel } from '../cotton.js';
import { rod, spring, exploder } from '../kit.js';

const REEL = [
  { ms: 5600, caption: 'A cotton boll is a fruit, and every white strand in it is one single living cell.', set: { fruit: 'open', lint: true }, anim: { explode: [0, 1] }, view: { pos: [2.4, 5.0, 12.6], target: [1.4, 3.0, 0] }, tall: { pos: [2.6, 3.8, 7.4], target: [2.4, 3.0, 0] }, spin: 0.2 },
];

export default {
  id: 'anatomy',
  short: 'Plant and fibre',
  title: 'From plant to one fibre',
  subtitle: 'Cotton is a seed hair: one enormous cell, grown from the skin of a seed.',
  view: { pos: [2.0, 4.9, 14.2], target: [1.3, 3.1, 0] },
  learn: `<p><b>Cotton is a shrub</b> in the mallow family, the same family as bhindi and hibiscus. A cream flower opens and is pollinated. Then it drops its petals, and the ovary swells into a green capsule, the <b>boll</b>.</p>
    <p>Inside are about 30 seeds in three to five chambers. Each ripe seed wears a coat of hairs. The long hairs are the <b>lint</b> we spin. The short ones, stuck tight, are the <b>fuzz</b> (linters). Nearly all cotton that people wear is seed hair.</p>
    <p>The surprise is that <b>each hair is a single cell</b>, not a bundle. It starts as one skin cell of the seed. Magnified, it has a thin waxy <b>cuticle</b>, a <b>primary wall</b>, a <b>winding layer</b>, then a thick <b>secondary wall</b> of spiralling cellulose. In the middle runs a hollow channel, the <b>lumen</b>.</p>
    <p>India grows two main groups: the old <b>desi</b> cotton <i>Gossypium arboreum</i>, and American upland, <i>G. hirsutum</i>, which now covers most fields.</p>
    <p class="tip"><b>Try it:</b> open the boll with the slider, then pull the lint off the seed. What stays behind is fuzz.</p>`,
  terms: [
    { t: 'Boll', d: 'The cotton plant\'s fruit: a capsule that splits open when ripe.' },
    { t: 'Lint', d: 'The long seed hairs that are spun into thread.' },
    { t: 'Fuzz', d: 'Short hairs left on the seed after ginning. Also called linters.' },
    { t: 'Lumen', d: 'The hollow channel down the middle of a fibre, full of sap while it grows.' },
    { t: 'Secondary wall', d: 'The thick inner wall, almost pure cellulose, that gives a fibre its strength.' },
  ],
  defaults: { explode: 0.55, fruit: 'open', lint: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Open it up', min: 0, max: 1, step: 0.01, ends: ['closed', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'fruit', type: 'seg', label: 'Stage on the plant', options: [{ v: 'flower', label: 'Flower' }, { v: 'green', label: 'Green boll' }, { v: 'open', label: 'Open boll' }] },
    { key: 'lint', type: 'toggle', label: 'Lint on the seed' },
  ],
  quiz: [
    { q: 'What is a single cotton fibre?', options: ['A bundle of thousands of cells', 'One giant cell grown from the seed coat', 'A dried plant stem', 'A strand of protein'], answer: 1, why: 'Each fibre starts as one skin cell of the seed and grows out, up to thousands of times longer than it is wide.' },
    { q: 'Which part of the plant is a boll?', options: ['A leaf', 'A root', 'The fruit', 'A flower petal'], answer: 2, why: 'The ovary of the flower swells into the boll, a fruit that holds the seeds and splits when ripe.' },
    { q: 'What is left on a seed after the lint is pulled off?', options: ['Nothing at all', 'Short hairs called fuzz', 'A green skin', 'Silk'], answer: 1, why: 'The short fuzz, or linters, grip the seed much harder than lint does. Linters are used for things like paper and chemical cellulose.' },
  ],
  reel: REEL,

  build({ stage }) {
    const root = stage.root;
    const plant = makePlant({ h: 5.6, fruit: 'open' }); plant.position.set(-3.6, 0, 0); root.add(plant);
    const flowers = []; plant.spots.slice(2, 6).forEach((sp, i) => { const f = makeFlower(0.3); f.position.copy(sp); f.position.y += 0.2; f.rotation.set(0.4, i, 0.3); plant.add(f); flowers.push(f); });

    // The hero boll on a short stalk.
    const boll = makeBoll({ r: 1.05, seed: 11 }); boll.position.set(0.4, 3.2, 0); root.add(boll);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2, 10), M.matte(0x5a4630)); stalk.position.set(0.4, 1.0, 0); root.add(stalk);

    // A seed pulled out of one lock.
    const seed = makeSeed({ r: 0.5, seed: 7 }); seed.position.set(3.0, 4.5, 0); root.add(seed);

    // One fibre magnified, telescoped so that every layer shows. Axis along X.
    const fibre = new THREE.Group(); fibre.position.set(1.0, 0.95, 0.6); fibre.scale.setScalar(0.92); root.add(fibre);
    const R = 0.6;
    const layer = (x0, x1, r, mat) => { const m = rod(x0, x1, r, r, mat, 40); fibre.add(m); return m; };
    const lum = layer(0, 5.8, R * 0.26, M.matte(0x241a14));
    const sec = layer(0, 4.8, R * 0.72, M.matte(0xf3ead2, { roughness: 0.65 }));
    const win = layer(0, 3.8, R * 0.84, M.matte(0xd9c58d));
    const prim = layer(0, 2.9, R * 0.95, M.matte(0xaec98a));
    const cut = layer(0, 1.9, R, M.matte(0xd8a65a, { roughness: 0.3 }));
    const helix = (x0, x1, r, turns, color) => { const s = spring(x0, x1, r, 0.012, turns, M.glow(color)); s.castShadow = false; fibre.add(s); return s; };
    const h1 = helix(3.9, 4.8, R * 0.73, 3, 0x8d7a40), h1b = helix(2.9, 3.8, R * 0.85, 6, 0x7a5a20), h2 = helix(0.9, 2.9, R * 0.96, 7, 0x5e7f3f);
    const setFibre = exploder([{ obj: lum, off: [1.1, 0, 0] }, { obj: sec, off: [0.8, 0, 0] }, { obj: h1, off: [0.8, 0, 0] }, { obj: win, off: [0.45, 0, 0] }, { obj: h1b, off: [0.45, 0, 0] }, { obj: prim, off: [0.15, 0, 0] }, { obj: h2, off: [0.15, 0, 0] }, { obj: cut, off: [-0.25, 0, 0] }]);

    const L = (t, p, o = root, c = '') => stage.label(t, p, o, c);
    const ll = L('Lock of lint and seeds', [0.4, 4.9, 0.6]);
    const lPlant = L('Cotton plant, about 1 m', [-5.0, 1.4, 1.0]);
    const lSeed = L('Seed: lint and fuzz', [3.0, 5.85, 0], root, 'hot');
    const lOne = L('One fibre, thousands of times too wide', [4.6, 2.35, 0.2], root, 'hot');
    const parts = [L('Cuticle: wax', [0, -0.95, 0.6], fibre), L('Primary wall', [2.3, -1.0, 0.6], fibre), L('Winding layer', [4.0, -1.5, 0.6], fibre), L('Secondary wall: cellulose', [5.8, -0.95, 0.6], fibre), L('Lumen', [7.7, -0.3, 0.3], fibre)];

    const redo = { fruit: null };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        tallView(stage, REEL);
        fitNarrow(stage, [ll, lPlant, lOne, parts[1], parts[2]]);
        boll.set(s.explode);
        boll.locks.forEach((lk, i) => { const a = lk.userData.a, k = smooth((s.explode - 0.5) * 2); lk.position.x += Math.cos(a) * k * 0.42; lk.position.z += Math.sin(a) * k * 0.42; lk.position.y += k * 0.2; });
        setFibre(s.explode);
        seed.lint.visible = !!s.lint; seed.position.x = 2.2 + 0.8 * smooth(s.explode);
        seed.rotation.y += 0.2 * dt;
        if (redo.fruit !== s.fruit) { redo.fruit = s.fruit; plant.bolls.forEach((b, i) => { b.set(s.fruit === 'open' ? 1 : 0); b.visible = s.fruit !== 'flower' || i < 2; }); flowers.forEach((f) => { f.visible = s.fruit === 'flower'; }); }
        lSeed.element.textContent = s.lint ? 'Seed: lint and fuzz' : 'Seed: only fuzz left';
      },
      readout: (s) => `<div class="big">${s.fruit === 'flower' ? 'Day 0: the flower opens' : s.fruit === 'green' ? 'Green boll: fibres growing' : 'Open boll, about 50 days on'}</div>
        <div class="row"><span>One fibre, upland</span><b>25 to 30 mm long</b></div>
        <div class="row"><span>Across</span><b>about 15 µm</b></div>
        <div class="row"><span>Length over width</span><b>about ${(Math.round(28000 / 15 / 100) * 100).toLocaleString('en')} times</b></div>`,
    };
  },
};
