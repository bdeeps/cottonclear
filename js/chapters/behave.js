// Chapter 3: why cotton behaves as it does. Chains of glucose, drawn with hydrogen bonds. A crystalline block
// (ordered, water stays out) joins a disordered stretch (water enters). Beside it, a cotton strip in a dish climbing by capillary action.
// Hydrogen bond about 21 kJ/mol, about 20 times weaker than a covalent O–H: same figures as BondClear and SteamPressClear.
// Regain: regainOf() in cotton.js (8.5% at 65% RH). Wet strength: textile references give about 10–20% stronger wet,
// 15% is used here. Jurin rise: h = 2γcosθ/(ρgr): water γ 0.072, ρ 1000; til oil γ 0.03, ρ 900 (DiyaClear).
// Other fibres: typical textile-table values (standard regain and wet/dry strength), rounded and marked typical.
import { THREE, M, clamp, lerp, smooth, regainOf, jurin, link, rng, fitNarrow, tallView, hairs } from '../cotton.js';
import { swarm, box } from '../kit.js';

const FIB = {
  cotton: { name: 'Cotton', regain: 8.5, wet: 1.15, chain: 'cellulose chains', col: 0xf1ede4 },
  silk: { name: 'Silk', regain: 11, wet: 0.82, chain: 'protein (fibroin) chains', col: 0xe6d2f0 },
  polyester: { name: 'Polyester', regain: 0.4, wet: 1.0, chain: 'polyester chains', col: 0x9ec3e6 },
};
const REEL = [
  { ms: 5600, caption: 'Cotton is glucose chains joined by hydrogen bonds. Water slips between the loose ones, so it drinks sweat and gets stronger wet.', set: { crease: false, fib: 'cotton' }, anim: { rh: [20, 100] }, view: { pos: [-1.0, 4.0, 11.2], target: [-1.3, 3.2, 0] }, tall: { pos: [-0.4, 3.8, 10.2], target: [-0.4, 3.2, 0] }, spin: 0.15 },
];

export default {
  id: 'behave',
  short: 'Why it feels like cotton',
  title: 'Why cotton behaves as it does',
  subtitle: 'Soft, thirsty, stronger wet, easy to crease: all from glucose chains and hydrogen bonds.',
  view: { pos: [0.1, 4.4, 13.8], target: [-0.3, 3.1, 0] },
  learn: `<p>Cellulose is a very long chain of <b>glucose</b> units, each with three <b>–OH</b> groups sticking out. Those groups reach across to neighbouring chains and form <b>hydrogen bonds</b>, about 21 kJ/mol each, about 20 times weaker than the bonds along a chain (see ${link('bondclear', 'BondClear')}). One is feeble. Millions together make a strong fibre.</p>
    <p><b>Thirsty.</b> In the neat crystalline parts, the chains are packed too tightly for water. In the looser parts, water molecules slip in and bond with the free –OH groups. Normal room air gives cotton about <b>8.5%</b> water by weight, and you do not feel it as damp. That is why a cotton shirt takes up sweat.</p>
    <p><b>Stronger wet.</b> Most fibres get weaker when wet. Cotton gets about <b>10 to 20% stronger</b>. The usual explanation: water loosens the disordered parts, the chains straighten and share the load more evenly. So wet cotton is safe to wring, though it stretches and takes longer to dry.</p>
    <p><b>Creases.</b> Crush cotton and the chains bend, and the hydrogen bonds re-form in the bent shape. Cotton has little spring-back, so the fold stays. Steam and heat undo it: ${link('steampressclear', 'SteamPressClear', 'creases')} shows how.</p>
    <p><b>Wicking.</b> Gaps between fibres are narrow, and water and oil cling to cellulose, so liquid climbs on its own. That is how a ${link('diyaclear', 'DiyaClear', 'wick')} wick pumps oil.</p>
    <p><b>Against silk.</b> ${link('silkclear', 'SilkClear')} is a protein, spun as one continuous thread by a caterpillar. Cotton is a plant sugar, grown as a short hair. Silk is typically a little weaker when wet.</p>
    <p class="tip"><b>Try it:</b> raise the humidity and watch where the water goes. Then crease the chains, and switch to polyester.</p>`,
  terms: [
    { t: 'Cellulose', d: 'A long chain of glucose units. The main stuff of cotton, wood and paper.' },
    { t: 'Hydrogen bond', d: 'A weak pull between a slightly positive hydrogen and an oxygen nearby.' },
    { t: 'Moisture regain', d: 'The water a dry fibre takes up from air, as a percentage of its dry weight.' },
    { t: 'Crystalline region', d: 'A part of the fibre where chains pack in a neat, tight order that water cannot enter.' },
    { t: 'Capillary action', d: 'A liquid creeping into narrow gaps by itself, even uphill.' },
  ],
  defaults: { rh: 65, crease: false, fib: 'cotton', liq: 'water' },
  controls: [
    { key: 'rh', type: 'range', label: 'Humidity of the air', min: 0, max: 100, step: 1, ends: ['bone dry', 'soaked'], fmt: (v) => v + '%' },
    { key: 'fib', type: 'seg', label: 'Compare the fibre', options: Object.entries(FIB).map(([v, f]) => ({ v, label: f.name })) },
    { key: 'crease', type: 'toggle', label: 'Crease the chains' },
    { key: 'liq', type: 'seg', label: 'Liquid in the dish', options: [{ v: 'water', label: 'Water' }, { v: 'oil', label: 'Til oil' }] },
  ],
  quiz: [
    { q: 'Where does water go in a cotton fibre?', options: ['Into the tight crystalline parts', 'Into the looser, disordered parts between chains', 'Only on the outside', 'Into the glucose rings'], answer: 1, why: 'Crystalline regions are packed too tightly. Water enters the disordered parts and bonds with free –OH groups.' },
    { q: 'What happens to cotton\'s strength when it is wet?', options: ['It falls by half', 'It rises by about 10 to 20%', 'It stays exactly the same', 'It dissolves'], answer: 1, why: 'Water lets disordered chains straighten and share the load, so wet cotton is somewhat stronger.' },
    { q: 'Why does a crease stay in cotton?', options: ['Chains snap', 'Hydrogen bonds re-form holding the chains in their bent shape', 'It melts', 'Air gets trapped'], answer: 1, why: 'The bonds let go and catch again in new places. Cotton has little spring to pull back.' },
  ],
  reel: REEL,

  build({ stage }) {
    const root = stage.root;
    // Chains: rows of hexagonal glucose rings along X, in a block. Left part neat, right part wavy.
    const NC = 5, NR = 16, rings = swarm(NC * NR, new THREE.TorusGeometry(0.21, 0.055, 8, 6), M.plastic(0xf1ede4));
    const links = swarm(NC * NR, new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), M.plastic(0xcab78a));
    const OH = swarm(NC * NR * 2, new THREE.SphereGeometry(0.075, 10, 8), M.plastic(0xff5a4a));
    root.add(rings, links, OH);
    const hb = hairs(NC * NR, 0.016, M.glow(0x7fb2ff));
    root.add(hb);
    const NW = 90, water = swarm(NW, new THREE.SphereGeometry(0.1, 10, 8), M.glow(0x6fd0ff));
    root.add(water);
    const rnd = rng(11), W = Array.from({ length: NW }, () => ({ u: rnd(), v: rnd(), a: rnd() * 6.28, z: (rnd() - 0.5) * 0.7 }));
    const plate = box(8.6, 0.14, 2.8, M.matte(0x20242e)); plate.position.set(-1.95, 0.65, 0); root.add(plate);

    // A strip in a dish climbing with capillary action, at the right. Scale 1 unit = 4 cm.
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.34, 32, 1, true), M.clear(0xcfe8ff, 0.3)); dish.position.set(4.3, 0.3, 0); root.add(dish);
    const liquidMat = M.clear(0x6fd0ff, 0.65, { depthWrite: false });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.9, 0.2, 32), liquidMat); liquid.position.set(4.3, 0.25, 0); root.add(liquid);
    const strip = box(0.6, 4.6, 0.04, M.matte(0xf4efe2)); strip.position.set(4.3, 2.5, 0); root.add(strip);
    const wet = box(0.62, 1, 0.06, M.clear(0x4aa8e0, 0.7, { depthWrite: false })); wet.position.set(4.3, 0.3, 0); root.add(wet);
    const bar = box(1.6, 0.08, 0.08, M.metal()); bar.position.set(4.3, 4.84, 0); root.add(bar);

    const lCr = stage.label('Crystalline: too tight for water', [-4.6, 0.95, 1.6]);
    const lAm = stage.label('Disordered: water gets in', [0.5, 5.65, 0.6], root, 'hot');
    const lHb = stage.label('Blue: hydrogen bonds', [0.4, 0.95, 1.6]);
    const lWick = stage.label('', [4.3, 5.2, 0], root, 'hot');
    let climb = 0.2, rest = 0, crK = 0;

    return {
      update(dt, s, t) {
        dt = Math.max(0, dt);
        tallView(stage, REEL);
        fitNarrow(stage, [lHb, lCr]);
        const F = FIB[s.fib];
        rings.material.color.setHex(F.col);
        crK = crK + (((s.crease ? 1 : 0) - crK) * (1 - Math.exp(-3 * dt)));
        let reg = F.regain * (regainOf(s.rh) / 8.5);
        const loose = clamp(s.rh / 100, 0, 1);
        const pos = (c, r) => {
          const u = r / (NR - 1), x = -5.7 + r * 0.5, y0 = 1.25 + c * 0.75;
          const am = smooth((u - 0.48) / 0.2);
          // Disordered part: chains wave and move apart with moisture.
          const wv = am * (0.17 + 0.2 * loose) * Math.sin(r * 1.5 + c * 1.9 + t * 0.6);
          const spread = am * loose * 0.22 * (c - 2);
          // The crease: the whole block folds at a line in the middle.
          const fold = crK * 0.75 * Math.max(0, u - 0.3);
          return [x, y0 + wv + spread + fold * 3.2 * (r - 4.8) * 0.3, Math.sin(c * 2.3 + r) * am * 0.28];
        };
        let i = 0, o = 0, h = 0;
        for (let c = 0; c < NC; c++) for (let r = 0; r < NR; r++) {
          const p = pos(c, r);
          rings.place(i, p, [Math.PI / 2 * 0 + 0, 0, r % 2 ? 0.5 : 0]);
          if (r < NR - 1) { const q = pos(c, r + 1), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], a = Math.atan2(q[1] - p[1], q[0] - p[0]); links.place(i, m, [0, 0, a - Math.PI / 2], 1); } else links.place(i, [0, -5, 0], null, 0.001);
          OH.place(o++, [p[0], p[1] + 0.26, p[2] + 0.05], null); OH.place(o++, [p[0], p[1] - 0.26, p[2] - 0.05], null);
          // Hydrogen bonds to the row above. In the disordered part, they let go as water arrives.
          if (c < NC - 1 && r % 1 === 0) {
            const q = pos(c + 1, r), u = r / (NR - 1), am = smooth((u - 0.48) / 0.2), broken = am * loose * 1.3 + (r % 3 === 0 ? 0.25 * am : 0);
            if ((broken > 0.7 + ((r * 7 + c * 3) % 5) * 0.08) && s.fib !== 'polyester') hb.hide(h); else if (s.fib === 'polyester') hb.hide(h); else hb.seg(h, [p[0], p[1] + 0.3, p[2]], [q[0], q[1] - 0.3, q[2]]);
          } else hb.hide(h);
          h++; i++;
        }
        rings.done(); links.done(); OH.done(); hb.done();
        // Water sits only in the disordered part, at a density given by regain.
        const nShow = Math.round(clamp(reg / 22, 0, 1) * NW);
        for (let k = 0; k < NW; k++) {
          const w = W[k];
          if (k >= nShow) { water.place(k, [0, -5, 0], null, 0.001); continue; }
          const r = 8.5 + w.u * 7, c = w.v * (NC - 1), a = pos(Math.floor(c), Math.floor(r)), j = Math.sin(t * 2 + w.a) * 0.04;
          water.place(k, [a[0] + j, a[1] + (c % 1) * 0.75 + j, w.z], null, 0.9);
        }
        water.done();
        // The wick: Washburn-style rise towards Jurin height, capped by the strip.
        const oil = s.liq === 'oil';
        liquidMat.color.setHex(oil ? 0xd9a53b : 0x6fd0ff); wet.material.color.setHex(oil ? 0xd9a53b : 0x4aa8e0);
        const hJ = jurin(oil ? 0.03 : 0.072, oil ? 900 : 1000, 40e-6), speed = oil ? 0.09 : 0.75;
        const target = Math.min(4.4, (hJ / 0.04));
        climb = Math.min(target, climb + (speed / Math.max(climb, 0.3)) * dt);
        rest += dt; if (rest > 26) { rest = 0; climb = 0.2; }
        wet.scale.y = climb; wet.position.y = 0.2 + climb / 2;
        lWick.element.textContent = `Could climb ${(hJ * 100).toFixed(0)} cm in 40 µm gaps`;
      },
      readout: (s) => {
        const F = FIB[s.fib], reg = F.regain * (regainOf(s.rh) / 8.5), wet = lerp(1, F.wet, smooth(s.rh / 100));
        return `<div class="big">${F.name}: ${reg.toFixed(1)}% water</div>
          <div class="row"><span>Made of</span><b>${F.chain}</b></div>
          <div class="row"><span>Strength now, against dry</span><b>${wet >= 1 ? '+' : '−'}${Math.abs(Math.round((wet - 1) * 100))}%</b></div>
          <div class="row"><span>Regain in normal air (typical)</span><b>${F.regain}%</b></div>`;
      },
    };
  },
};
