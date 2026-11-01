// Chapter 6: history. A long thread runs through nine scenes; a year slider walks along it. No logos or trade dress.
// Sources are listed in history.json. Dates that historians dispute are hedged here as they are there.
import { THREE, M, clamp, lerp, smooth, cyl, fluff, makePlant, rng, fitNarrow, tallView, hairs, link } from '../cotton.js';
import { tube, box, torus, swarm } from '../kit.js';

const STOPS = [
  { y: -5500, d: 'c. 5500 BCE', t: 'Mehrgarh, Balochistan', x: 'Mineralised cotton threads on a copper bead from a Neolithic burial. Whether the plant was yet domesticated is unknown.' },
  { y: -2500, d: 'c. 2500 BCE', t: 'Mohenjo-daro', x: 'A woven fragment preserved by metal salts on a silver vessel, which the excavators identified with caution as cotton.' },
  { y: 60, d: 'c. 1st century', t: 'Roman trade', x: 'A sailor\'s guide, the Periplus, lists cotton cloth of all kinds and muslins shipped from Indian ports.' },
  { y: 1350, d: 'by c. 1350', t: 'Charkha and charkhi', x: 'The first clear Indian mention of the spinning wheel is debated: 12th century to c. 1350. Roller gins are older still.' },
  { y: 1700, d: 'c. 1700', t: 'Dhaka muslin', x: 'Handspun from phuti karpas, in counts above 300. Indian cloth clothes much of the world, and Britain bans it at home (1700, 1721).' },
  { y: 1794, d: '1760s to 1830s', t: 'Company, Lancashire and the gin', x: 'The East India Company coerces Bengal weavers. Lancashire machines undercut them. Whitney\'s gin of 1794 makes US slave cotton pay.' },
  { y: 1860, d: '1860', t: 'American slavery', x: 'The census counts nearly 4 million people enslaved in the US. Their forced labour grew the raw cotton Lancashire\'s mills ran on.' },
  { y: 1854, d: '1854 to 1982', t: 'The Bombay mills', x: 'Bombay\'s first mill in 1854 grows into a city of mills, then the great strike of 1982 to 83.' },
  { y: 1920, d: 'from 1920', t: 'Gandhi and khadi', x: 'The charkha becomes the symbol of freedom. Foreign cloth is boycotted. Spinners\' association formed in 1925.' },
  { y: 2002, d: '2002', t: 'Bt cotton', x: 'The GEAC approves India\'s first genetically modified crop. Its story is still being argued over.' },
];
const SP = 6.2;
const VWS = STOPS.map((_, i) => ({ pos: [i * SP + 0.6, 3.1, 7.6], target: [i * SP + 0.4, 1.75, 0] }));
const VW = (i) => VWS[i];
const TL = (i) => ({ pos: [i * SP + 0.5, 2.6, 5.0], target: [i * SP, 2.0, 0] });
const REEL = [
  { ms: 5400, caption: 'Hand-spun muslin from Dhaka was so fine it took yarn counts above 300, then colonial rule and machines undercut Bengal\'s weavers.', set: { stop: 4 }, view: VW(4), tall: TL(4), spin: -0.15 },
  { ms: 5000, caption: 'Whitney\'s gin of 1794 made cotton pay in America, and slavery grew to nearly 4 million people by 1860.', set: { stop: 6 }, view: VW(6), tall: TL(6), spin: 0.15 },
];

export default {
  id: 'past',
  short: 'Thread of history',
  title: 'A thread through history',
  subtitle: 'Cotton clothed the world from India, then became the crop of empire, slavery and freedom.',
  view: VW(4),
  learn: `<p><b>India's first gift.</b> The oldest cotton evidence in the Old World comes from <b>Mehrgarh</b> (now Pakistan): threads on a copper bead from the 6th millennium BCE. People in Peru used a separate cotton at about a similar age. Harappan cities later wove it. Roman-era traders shipped cloth from Indian ports.</p>
    <p><b>The tools.</b> The roller gin (<b>charkhi</b>) and the <b>charkha</b> came to India early, though exact dates are argued. By the 1600s Indian cloth was traded across Asia, Africa and Europe. <b>Dhaka muslin</b>, spun from a local cotton called phuti karpas, was famous for its fineness.</p>
    <p><b>Empire.</b> Britain banned most Indian cotton cloth at home (the Calico Acts of 1700 and 1721). After 1757 the <b>East India Company</b> controlled Bengal's trade, and weavers were forced into its contracts and debts. Then Lancashire's machines and one-way tariffs flooded India with cheap cloth. Bengal's fine weaving collapsed. Historians still argue over how far handlooms as a whole declined: Tirthankar Roy shows many adapted and survived, while others stress the destruction. The story that weavers' thumbs were cut off has been rejected by historians as a misreading of a 1772 report. The coercion itself is documented.</p>
    <p><b>Slavery.</b> Whitney's saw gin (patent 1794) made short-staple upland cotton cheap to clean. Planters pushed west, and <b>enslaved people</b> grew from about 700,000 in 1790 to nearly 4 million in 1860. Lancashire's mills ran on the cotton they were forced to grow. There is no gentle way to say it.</p>
    <p><b>Back to India.</b> When Bombay's first mill opened in 1854, Indian capital joined in. It grew to a city of mills, and the strike of 1982 to 83 helped end them. <b>Gandhi</b> made the charkha and <b>khadi</b> a political act: boycott foreign cloth, spin your own. And in 2002 came <b>Bt cotton</b>.</p>
    <p class="tip"><b>Try it:</b> step through the stops. The full timeline is on this box's history page.</p>`,
  terms: [
    { t: 'Charkha', d: 'A hand-turned spinning wheel.' },
    { t: 'Charkhi', d: 'The Indian roller gin, also called the churka.' },
    { t: 'Khadi', d: 'Cloth both hand-spun and hand-woven. A symbol of India\'s freedom movement.' },
    { t: 'Muslin', d: 'Very fine, light cotton cloth. Named, by one account, after Mosul, though it was Bengal\'s that became most famous.' },
    { t: 'Calico Acts', d: 'British laws of 1700 and 1721 restricting imported Indian cottons.' },
  ],
  defaults: { stop: 4 },
  controls: [{ key: 'stop', type: 'range', label: 'Walk along the thread', min: 0, max: STOPS.length - 1, step: 1, fmt: (v) => STOPS[Math.round(v)].d }],
  quiz: [
    { q: 'Where is the oldest known cotton in the Old World from?', options: ['Egypt', 'Mehrgarh, in present-day Pakistan', 'Manchester', 'China'], answer: 1, why: 'Threads found on a copper bead in a Neolithic burial date to the 6th millennium BCE.' },
    { q: 'What did Eli Whitney\'s gin do to slavery in the USA?', options: ['Ended it', 'Had no effect', 'Made upland cotton profitable, and slavery grew', 'Moved it to Canada'], answer: 2, why: 'Cheap ginning made short-staple cotton pay, so plantations spread west and the number of enslaved people rose to nearly 4 million by 1860.' },
    { q: 'Why did Gandhi promote the charkha?', options: ['It was a sport', 'Home spinning gave work and independence from British cloth', 'It was faster than mills', 'It was a religious rule'], answer: 1, why: 'Khadi offered income in villages and a way to refuse imported cloth: a tool and a symbol together.' },
  ],
  reel: REEL,

  build({ stage }) {
    const root = stage.root, wood = M.matte(0x7a5a3a), lint = M.matte(0xf4efe2), steel = M.metal(0xb9bec8), brick = M.matte(0x8c4a35), dark = M.matte(0x22262f), copper = M.metal(0xc4703a, { roughness: 0.45 });
    const plinth = box(STOPS.length * SP + 6, 0.16, 5, M.matte(0x1b1f28)); plinth.position.set(((STOPS.length - 1) * SP) / 2, 0.08, 0); root.add(plinth);
    // The thread.
    const pts = []; for (let i = -1; i <= (STOPS.length) * 4; i++) { const x = (i * SP) / 4; pts.push(new THREE.Vector3(x, 0.32 + Math.sin(i * 0.9) * 0.08, 1.9 + Math.sin(i * 0.6) * 0.25)); }
    root.add(tube(pts, 0.045, lint, false, 300));
    const grp = (i) => { const g = new THREE.Group(); g.position.x = i * SP; root.add(g); return g; };
    // 0 Copper bead with thread
    { const g = grp(0); const bead = torus(0.55, 0.28, copper); bead.position.set(0, 1.9, 0); bead.rotation.x = 0.5; g.add(bead); const t = tube([[-1.7, 2.3, 0.1], [-0.6, 2.0, 0.1], [0, 1.9, 0], [0.6, 1.8, -0.1], [1.8, 1.4, 0.0]], 0.05, M.matte(0xa8c090), false, 40); g.add(t); const c = box(2.8, 0.5, 2.0, M.matte(0x705a3d)); c.position.set(0, 0.4, 0); g.add(c); }
    // 1 Silver vessel with woven fragment
    { const g = grp(1); const pts2 = [[0, 0], [0.7, 0.05], [0.95, 0.6], [0.85, 1.4], [0.5, 1.8], [0.55, 2.15]].map(([r, y]) => new THREE.Vector2(r, y)); const v = new THREE.Mesh(new THREE.LatheGeometry(pts2, 36), M.metal(0xc8ccd4, { side: THREE.DoubleSide, roughness: 0.4 })); v.position.y = 0.16; v.castShadow = true; g.add(v);
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#7b6d52'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#c5b78a'; x.lineWidth = 3; for (let i = 0; i < 128; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide })); f.position.set(0.1, 1.1, 0.96); g.add(f); }
    // 2 A trading ship with bales
    { const g = grp(2); const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14, 0, 6.3, Math.PI / 2, Math.PI / 2), wood); hull.scale.set(2.2, 0.75, 0.75); hull.position.y = 1.05; hull.castShadow = true; g.add(hull); const mast = cyl(0, 2.2, 0, 0.05, 2.5, wood, 'y'); g.add(mast); const sail = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.5, 8, 4), M.matte(0xefe7d3, { side: THREE.DoubleSide })); sail.position.set(0, 2.5, 0.1); g.add(sail); [-0.8, 0, 0.8].forEach((x) => { const b = box(0.55, 0.42, 0.55, M.matte(0xdccfa8)); b.position.set(x, 1.2, 0); g.add(b); }); }
    // 3 Charkha (wheel + spindle) and charkhi (rollers) side by side
    let wheel; { const g = grp(3); wheel = new THREE.Group(); wheel.position.set(-0.7, 1.7, 0); g.add(wheel);
      wheel.add(torus(1.05, 0.04, wood)); for (let i = 0; i < 8; i++) { const r = box(2.1, 0.05, 0.05, wood); r.rotation.z = (i * Math.PI) / 8; wheel.add(r); } const stand = box(0.14, 1.7, 0.14, wood); stand.position.set(-0.7, 0.9, 0); g.add(stand); const base = box(4, 0.12, 1, wood); base.position.set(0.3, 0.2, 0); g.add(base);
      const sp = cyl(1.15, 0.95, 0, 0.025, 0.9, steel, 'x'); g.add(sp); const yarn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.34, 12), lint); yarn.rotation.z = Math.PI / 2; yarn.position.set(1.15, 0.95, 0); g.add(yarn);
      const r1 = cyl(1.0, 2.15, 0, 0.13, 1.1, wood), r2 = cyl(1.0, 2.42, 0, 0.13, 1.1, wood); g.add(r1, r2); [[0.75], [1.25]].forEach(([x]) => { const p = box(0.08, 2.4, 0.08, wood); p.position.set(x, 1.4, 0.55); g.add(p); }); const puff = fluff(0.34, 16, 3); puff.position.set(0.55, 2.28, 0); g.add(puff); }
    // 4 Muslin: a sheer cloth drawn through a ring
    { const g = grp(4); const ring = torus(0.28, 0.03, M.metal(0xe8c76a)); ring.position.set(0, 2.1, 0); g.add(ring); const geo = new THREE.PlaneGeometry(3.6, 2.8, 30, 22), P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), k = 0.16 + Math.abs(y - 0.0) * 0.35; const X = x * k * 0.55; P.setX(i, X + Math.sin(x * 4) * 0.02); P.setZ(i, Math.sin(x * 7 + y) * (0.09 + k * 0.12)); } geo.computeVertexNormals(); const cl = new THREE.Mesh(geo, M.clear(0xfaf5e8, 0.42, { depthWrite: false })); cl.position.set(0, 2.1, 0); g.add(cl); const lamp = fluff(0.34, 16, 15); lamp.position.set(-1.6, 0.48, 0.4); g.add(lamp); }
    // 5 Lancashire mill and the saw gin
    { const g = grp(5); const m = box(2.3, 1.6, 1.4, brick); m.position.set(-0.8, 1.0, 0); g.add(m); const ch = cyl(-2.1, 1.7, 0, 0.17, 3.0, brick, 'y'); g.add(ch); for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const w = box(0.26, 0.3, 0.02, M.glow(0xffc65a)); w.position.set(-1.65 + c * 0.56, 0.75 + r * 0.6, 0.71); g.add(w); }
      for (let i = 0; i < 6; i++) { const d = cyl(1.4, 1.2, -0.5 + i * 0.2, 0.55, 0.03, steel, 'z', 24); g.add(d); } const hop = box(1.3, 0.12, 1.4, wood); hop.position.set(1.4, 0.55, 0); g.add(hop); const ct = fluff(0.42, 16, 7); ct.position.set(1.05, 1.95, 0); g.add(ct); }
    // 6 A cotton row and many small standing figures: plain markers, not caricatures
    { const g = grp(6); const pl = makePlant({ h: 2.6, seed: 5, bolls: 6 }); pl.position.set(-1.8, 0.16, -0.5); g.add(pl); const pl2 = makePlant({ h: 2.5, seed: 8, bolls: 6 }); pl2.position.set(1.9, 0.16, -0.7); g.add(pl2);
      const N = 42, head = swarm(N, new THREE.SphereGeometry(0.06, 8, 6), M.matte(0x8c8c90)), body = swarm(N, new THREE.CapsuleGeometry(0.05, 0.16, 3, 6), M.matte(0x6e6e76)); const R = rng(7); for (let i = 0; i < N; i++) { const x = -1.9 + (i % 14) * 0.3 + R() * 0.03, z = 0.1 + Math.floor(i / 14) * 0.35; head.place(i, [x, 0.53, z], null); body.place(i, [x, 0.32, z], null); } head.done(); body.done(); g.add(head, body); }
    // 7 Bombay mills
    { const g = grp(7); [[-1.4, 1.2, 1.0], [0.1, 1.5, 1.1], [1.5, 1.1, 1.1]].forEach(([x, h, w], i) => { const m = box(w * 1.3, h, 1.2, M.matte(i % 2 ? 0x8c6a4a : 0x7a7a70)); m.position.set(x, h / 2 + 0.16, -0.2); g.add(m); const c = cyl(x - 0.4, h + 0.9, -0.2, 0.08, 1.5, brick, 'y'); g.add(c); }); }
    // 8 Khadi and the charkha: a smaller book-style charkha and a folded length of cloth
    let wheel2; { const g = grp(8); wheel2 = new THREE.Group(); wheel2.position.set(-0.6, 1.5, 0); g.add(wheel2); wheel2.add(torus(1.0, 0.05, wood)); for (let i = 0; i < 6; i++) { const r = box(2.0, 0.05, 0.05, wood); r.rotation.z = (i * Math.PI) / 6; wheel2.add(r); } const s = box(0.14, 1.4, 0.14, wood); s.position.set(-0.6, 0.8, 0); g.add(s); const b = box(3.3, 0.12, 1.1, wood); b.position.set(0.2, 0.22, 0); g.add(b); [0, 1, 2, 3].forEach((i) => { const c = box(1.2, 0.1, 0.8, M.matte(0xefe7d3)); c.position.set(1.2, 0.33 + i * 0.1, 0); g.add(c); }); const y = tube([[-0.6, 2.5, 0], [0.2, 1.4, 0], [1.0, 1.0, 0]], 0.012, lint, false, 12); g.add(y); }
    // 9 Bt plant with a marked gene: a DNA-like helix above it
    { const g = grp(9); const p = makePlant({ h: 3.3, seed: 12 }); p.position.set(-0.7, 0.16, 0); g.add(p); const pts3 = []; for (let i = 0; i <= 60; i++) { const a = i * 0.34; pts3.push([1.5 + Math.cos(a) * 0.18, 0.9 + i * 0.038, Math.sin(a) * 0.18]); } g.add(tube(pts3, 0.03, M.glow(0x6fd0ff), false, 120)); const pts4 = pts3.map(([x, y, z], i) => { const a = i * 0.34 + 3.14; return [1.5 + Math.cos(a) * 0.18, y, Math.sin(a) * 0.18]; }); g.add(tube(pts4, 0.03, M.glow(0xff7a59), false, 120)); }

    const labels = STOPS.map((st, i) => { const l = stage.label(`${st.d}: ${st.t}`, [i * SP + 0.4, 0.62, 2.3], root, 'hot'); return l; });
    let last = -1;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const i = clamp(Math.round(s.stop), 0, STOPS.length - 1);
        if (last !== i) { if (last !== -1) stage.setView(VW(i).pos, VW(i).target, 1); last = i; }
        tallView(stage, REEL);
        fitNarrow(stage, []);
        labels.forEach((l, k) => { l.visible = k === i; });
        wheel.rotation.z -= 1.4 * dt; wheel2.rotation.z -= 1.2 * dt;
      },
      readout: (s) => { const st = STOPS[Math.round(s.stop)]; return `<div class="big">${st.t}</div><div class="row"><span>When</span><b>${st.d}</b></div><div style="max-width:320px;margin-top:6px">${st.x}</div>`; },
    };
  },
};
