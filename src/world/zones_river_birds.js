/* v305 : OISEAUX du niveau 2. Deux especes modelisees plume par plume : l'ara (tete blanche, bec crochu bicolore, longue queue, ailes rouges / jaunes / bleues) dans la jungle et la lagune, la mouette (bec jaune a pointe rouge, ailes grises a bout noir) sur le lac, le delta et le port.
 * Chaque oiseau = 5 maillages seulement (corps, deux ailes interieures, deux ailes exterieures) : les plumes sont fusionnees par piece, les ailes battent en deux articulations (epaule, coude) avec un decalage de phase, le corps s'incline dans les virages.
 * Ils tournent en groupes au-dessus du fleuve et s'enfuient en montant quand la fusee passe tout pres. */
(function () {
  const EVO = CC.EVO, T3 = THREE, R = EVO && EVO.riv;
  if (!R || !R.WY) return;
  const hh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const c3 = (h) => { const c = new T3.Color(h); return [c.r, c.g, c.b]; };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // ---------- assemblage de pieces fusionnees (couleur par sommet, facettes plates) ----------
  const Parts = function () { this.P = []; this.C = []; };
  Parts.prototype.add = function (geo, m4, color, jit) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m4); const pa = g.attributes.position, loc = geo.index ? geo.toNonIndexed().attributes.position : geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const k = 1 + (jit || 0) * (hh(Math.floor(i / 3), this.P.length * 0.01 + 3.7) - 0.5), c = typeof color === 'function' ? color(loc.getX(i), loc.getY(i), loc.getZ(i)) : color; this.P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); this.C.push(c[0] * k, c[1] * k, c[2] * k); }
    g.dispose();
  };
  Parts.prototype.geo = function () { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(this.P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(this.C, 3)); g.computeVertexNormals(); return g; };
  // une plume : plate, le long de +X, largeur sur Z, nervure en relief, legere courbe vers le haut ; de la base (largeur 0.4) a la pointe
  const featherGeo = (len, wid, bend) => {
    const st = [[0, 0.32], [0.28, 0.5], [0.62, 0.44], [0.9, 0.22], [1, 0]], P = [], idx = [];
    for (const [t, w] of st) { const x = t * len, y = bend * t * t, hw = w * wid; if (w === 0) P.push([x, y + 0.004, 0]); else P.push([x, y, -hw], [x, y + 0.009, 0], [x, y, hw]); }
    const ix = []; let o = 0; const rows = []; for (const [t, w] of st) { if (w === 0) { rows.push([o]); o += 1; } else { rows.push([o, o + 1, o + 2]); o += 3; } }
    for (let r = 0; r < rows.length - 1; r++) { const a = rows[r], b = rows[r + 1]; if (b.length === 1) { ix.push(a[0], a[1], b[0], a[1], a[2], b[0]); } else { ix.push(a[0], a[1], b[0], a[1], b[1], b[0], a[1], a[2], b[1], a[2], b[2], b[1]); } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P.flat(), 3)); g.setIndex(ix); return g;
  };
  const M = new T3.Matrix4(), Mq = new T3.Matrix4(), Mt = new T3.Matrix4();
  // pose une plume : base (bx,by,bz), direction horizontale (angle a, 0 = +X, positif vers -Z), inclinaison p (rad, vers le bas), roulis r
  const feather = (parts, len, wid, bend, bx, by, bz, a, p, colFn) => { M.makeRotationY(a); Mq.makeRotationZ(-p); Mt.makeTranslation(bx, by, bz); M.multiply(Mq); M.premultiply(Mt); const g = featherGeo(len, wid, bend); parts.add(g, M, colFn ? (x, y, z) => colFn(x / len) : [1, 1, 1], 0.1); g.dispose(); };
  const sph = (parts, r, sx, sy, sz, x, y, z, color, seg) => { const g = new T3.SphereGeometry(r, seg || 8, 6); M.makeScale(sx, sy, sz); Mt.makeTranslation(x, y, z); M.premultiply(Mt); parts.add(g, M, color, 0.05); g.dispose(); };
  const cone = (parts, r, len, x, y, z, rx, ry, color, seg) => { const g = new T3.ConeGeometry(r, len, seg || 6); g.translate(0, len / 2, 0); M.makeRotationFromEuler(new T3.Euler(rx, ry, 0, 'YXZ')); Mt.makeTranslation(x, y, z); M.premultiply(Mt); parts.add(g, M, color, 0.06); g.dispose(); };

  // ---------- les deux especes ----------
  const SPECIES = {
    ara: { // couleurs : [corps, ventre, tete, joue, bec haut, bec bas, couvertures, secondaires, primaires, queue base, queue bout, oeil]
      body: c3('#d22a22'), belly: c3('#e8452a'), head: c3('#d22a22'), face: c3('#f4eee2'), beakU: c3('#f0e8d6'), beakL: c3('#2c2826'), cov: c3('#f2c22a'), sec: c3('#2a62c8'), pri: c3('#1f4ea8'), tailA: c3('#d22a22'), tailB: c3('#2a62c8'), eye: c3('#f2d24a'),
      span: 1.0, tailLen: 0.78, tailN: 5, beak: 1.0, hook: true, wing: 1.0, flap: 5.2, glide: 0.0, scale: 3.4 },
    mouette: {
      body: c3('#d6dadd'), belly: c3('#e6e9ec'), head: c3('#dde0e3'), face: c3('#e8eaec'), beakU: c3('#f2b52a'), beakL: c3('#f2b52a'), cov: c3('#aeb6c0'), sec: c3('#939ca8'), pri: c3('#26282c'), tailA: c3('#d6dadd'), tailB: c3('#d6dadd'), eye: c3('#2a2a2a'),
      span: 1.35, tailLen: 0.3, tailN: 5, beak: 0.8, hook: true, wing: 1.25, flap: 2.6, glide: 0.5, scale: 3.6 }
  };
  const cache = {};
  const build = (key) => {
    if (cache[key]) return cache[key]; const S = SPECIES[key], body = new Parts(), inner = new Parts(), outer = new Parts();
    // corps : fuseau, poitrine plus claire, cou, tete, bec, yeux, queue en eventail, pattes repliees
    sph(body, 1, 0.115, 0.115, 0.34, 0, 0, 0, (x, y, z) => lerp3(S.body, S.belly, Math.max(0, Math.min(1, 0.5 - y * 3.5))), 10);
    sph(body, 1, 0.085, 0.085, 0.14, 0, 0.045, 0.27, S.head, 8); sph(body, 1, 0.075, 0.075, 0.075, 0, 0.085, 0.36, S.head, 8);
    sph(body, 1, 0.045, 0.05, 0.05, 0.062, 0.085, 0.37, S.face, 6); sph(body, 1, 0.045, 0.05, 0.05, -0.062, 0.085, 0.37, S.face, 6);
    for (const sx of [-1, 1]) { sph(body, 1, 0.026, 0.026, 0.026, sx * 0.068, 0.1, 0.395, S.eye, 6); sph(body, 1, 0.014, 0.014, 0.014, sx * 0.083, 0.1, 0.405, [0.03, 0.03, 0.03], 5); }
    const bl = 0.17 * S.beak; cone(body, 0.052 * S.beak, bl, 0, 0.082, 0.415, Math.PI / 2 + 0.28, 0, S.beakU, 6);                 // bec : maxillaire
    if (S.hook) cone(body, 0.036 * S.beak, 0.09 * S.beak, 0, 0.082 - 0.045 * S.beak, 0.415 + bl * 0.9, Math.PI - 0.35, 0, S.beakU, 5);   // crochet
    cone(body, 0.042 * S.beak, bl * 0.8, 0, 0.056, 0.41, Math.PI / 2 + 0.05, 0, S.beakL, 5);                                          // mandibule
    for (let i = 0; i < S.tailN; i++) { const t = (i - (S.tailN - 1) / 2) / ((S.tailN - 1) / 2), ln = S.tailLen * (1 - 0.32 * Math.abs(t)), a = Math.PI / 2 + t * 0.26; feather(body, ln, 0.1, -0.03, 0, -0.01, -0.28, a, 0.08 + 0.05 * Math.abs(t), (u) => lerp3(S.tailA, S.tailB, u)); }
    for (const sx of [-1, 1]) { const g = new T3.CylinderGeometry(0.012, 0.01, 0.12, 4); M.makeRotationX(0.9); Mt.makeTranslation(sx * 0.045, -0.1, -0.05); M.premultiply(Mt); body.add(g, M, [0.35, 0.3, 0.28], 0.1); g.dispose(); }
    // aile en TROIS segments articules : bras (couvertures et tertiaires), avant-bras (secondaires), main (primaires en eventail) ; chaque segment est un maillage qui tourne autour de son articulation
    const sc = S.span * S.wing, E = 0.17 * sc, Wr = 0.4 * sc, up = new Parts(), fore = new Parts();
    { const g = new T3.BoxGeometry(E, 0.04, 0.2); g.translate(E / 2, 0, 0); up.add(g, new T3.Matrix4(), S.cov, 0.05); g.dispose(); }
    { const g = new T3.BoxGeometry(Wr - E, 0.035, 0.2); g.translate((Wr - E) / 2, 0, 0); fore.add(g, new T3.Matrix4(), S.cov, 0.05); g.dispose(); }
    for (let i = 0; i < 4; i++) { const t = i / 3; feather(up, (0.3 - 0.02 * t) * sc, 0.13, 0.02, 0.02 + t * E * 0.85, 0, -0.02, Math.PI / 2 - 0.1 - 0.2 * t, 0.05, (u) => lerp3(S.cov, S.sec, Math.min(1, u * 1.5))); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const t = i / 3; feather(up, (0.2 - r * 0.06) * sc, 0.11, 0.03, 0.03 + t * E * 0.8, 0.014 + r * 0.012, -0.015 - r * 0.02, Math.PI / 2 - 0.15 - 0.2 * t, 0.06, () => lerp3(S.cov, S.body, r * 0.35 + 0.15)); }
    for (let i = 0; i < 6; i++) { const t = i / 5; feather(fore, (0.4 - 0.03 * t) * sc, 0.13, 0.02, 0.02 + t * (Wr - E) * 0.95, 0, -0.02, Math.PI / 2 - 0.2 - 0.3 * t, 0.05 + 0.04 * t, (u) => lerp3(S.cov, S.sec, Math.min(1, u * 1.6))); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const t = i / 4; feather(fore, (0.2 - r * 0.06) * sc, 0.11, 0.03, 0.04 + t * (Wr - E) * 0.9, 0.014 + r * 0.012, -0.015 - r * 0.02, Math.PI / 2 - 0.25 - 0.3 * t, 0.06, () => lerp3(S.cov, S.body, r * 0.35 + 0.15)); }
    { const g = new T3.BoxGeometry(0.16 * sc, 0.03, 0.08); g.translate(0.08 * sc, 0, 0); outer.add(g, new T3.Matrix4(), S.cov, 0.05); g.dispose(); }
    for (let i = 0; i < 9; i++) { const t = i / 8, a = 0.08 + 0.95 * t; feather(outer, (0.5 + 0.1 * Math.sin(t * 2.4)) * sc * (1 - 0.15 * t), 0.092, 0.02, 0.02 + 0.07 * t * sc, 0, 0, a, 0.03 + 0.03 * (1 - t), (u) => lerp3(S.sec, S.pri, Math.min(1, u * 1.8 + 0.1))); }
    for (let i = 0; i < 6; i++) { const t = i / 5; feather(outer, 0.2 * sc, 0.1, 0.03, 0.02 + 0.1 * sc * t, 0.013, 0.01, 0.15 + 0.5 * t, 0.05, () => lerp3(S.cov, S.sec, 0.2)); }
    return (cache[key] = { S, geo: [body.geo(), up.geo(), fore.geo(), outer.geo()], E, arm: Wr - E });
  };
  const mat = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide });
  // v322 : les 7 maillages d'un oiseau (corps + 3 segments x 2 ailes) sont dessines par INSTANCIATION : un seul appel de dessin par piece et par espece pour tous les oiseaux
  // (avant : jusqu'a 63 appels de dessin dans le port). La hierarchie d'articulations reste la meme : chaque piece n'est plus qu'un repere dont la matrice est copiee dans l'instance.
  const INST = {};
  const instFor = (g, key) => {
    const I = INST[key] || (INST[key] = { parts: [], root: null }), b = build(key);
    if (I.root !== g._bd.root) {
      I.root = g._bd.root; I.parts = [0, 1, 2, 3].map((k) => { const m = new T3.InstancedMesh(b.geo[k], mat, 64); m.frustumCulled = false; m.count = 0; m.instanceMatrix.setUsage(T3.DynamicDrawUsage); g._bd.root.add(m); return m; });
    }
    return I;
  };
  const makeBird = (key) => {
    const b = build(key), S = b.S, root = new T3.Group(), pivot = new T3.Group(), pts = []; root.add(pivot); pivot.scale.setScalar(S.scale);
    const part = (k, parent) => { const o = new T3.Object3D(); parent.add(o); pts.push([k, o]); return o; };
    part(0, pivot);
    const wings = [];
    for (const sd of [1, -1]) { const sh = new T3.Group(); sh.position.set(0.075 * sd, 0.05, 0.06); sh.scale.x = sd; pivot.add(sh); part(1, sh); const el = new T3.Group(); el.position.set(b.E, 0, 0); sh.add(el); part(2, el); const wr = new T3.Group(); wr.position.set(b.arm, 0, 0); el.add(wr); part(3, wr); wings.push([sh, el, wr]); }
    return { root, pivot, wings, S, pts, key };
  };

  // ---------- les groupes d'oiseaux le long du fleuve ----------
  const spots = (run) => {
    const out = [], T = run.T, add = (d, key, n, ry) => { const lat = (hh(d, 5.1) - 0.5) * 2 * (ry || 30), h = 20 + hh(d, 9.3) * 22, c = T.at(d, lat, 0); out.push({ d, key, n, x: c[0], z: c[2], y: R.WY(d) + h, rad: 22 + hh(d, 2.2) * 26, spd: 9 + hh(d, 1.7) * 4, dir: hh(d, 7.7) < 0.5 ? 1 : -1, ph: hh(d, 4.4) * 6.28 }); };
    for (let d = 180; d < 1700; d += 150) add(d + Math.floor(hh(d, 1) * 50), 'ara', 2 + (hh(d, 3) < 0.5 ? 1 : 0), 30);
    for (const d of [1840, 1960]) add(d, 'mouette', 3, 30);
    for (const d of [2900, 3060, 3220]) add(d, 'mouette', 3, 24);
    for (let d = 3440; d < 4720; d += 120) add(d + Math.floor(hh(d, 1) * 40), 'mouette', 3 + (hh(d, 3) < 0.4 ? 1 : 0), 34);
    return out;
  };
  const MAXB = 9; let clk = 0;
  const update = (g, dt) => {
    const run = g.endlessRun, on = run && EVO.isS2() && g.evo && !g.evo.preview && g.state === 'FLIGHT';
    if (!on) { if (g._bd) g._bd.root.visible = false; return; }
    if (g._bdRun !== run) { g._bdRun = run; if (g._bd) { g.scene.remove(g._bd.root); } g._bd = { root: new T3.Group(), spots: spots(run), birds: [] }; g.scene.add(g._bd.root); }
    const B = g._bd; B.root.visible = true; clk += Math.min(dt, 0.05); const rk = g.rocket.pos, d0 = run.dist; let used = 0;
    const near = B.spots.filter((s) => s.d > d0 - 150 && s.d < d0 + 520).sort((a, b) => a.d - b.d);
    for (const s of B.spots) if (s.list && (s.d < d0 - 220 || s.d > d0 + 600)) for (const o of s.list) o.root.visible = false;
    for (const s of near) {
      if (used >= MAXB) { if (s.list) for (const o of s.list) o.root.visible = false; continue; }
      if (!s.list) { s.list = []; for (let i = 0; i < s.n; i++) { const o = makeBird(s.key); o.i = i; o.flee = 0; o.fx = 0; o.fz = 0; B.root.add(o.root); s.list.push(o); } }
      for (const o of s.list) {
        const i = o.i, th = s.ph + s.dir * (clk * s.spd / s.rad) + i * (6.28 / s.n) * 0.6 + (hh(s.d, i) - 0.5) * 0.5, rr = s.rad * (0.9 + 0.2 * hh(s.d, i + 8));
        let x = s.x + Math.cos(th) * rr, z = s.z + Math.sin(th) * rr, y = s.y + 2.4 * Math.sin(clk * 0.7 + i * 1.9 + s.ph) + i * 1.6;
        const vx = -Math.sin(th) * s.dir, vz = Math.cos(th) * s.dir, dxr = x - rk.x, dzr = z - rk.z, dyr = y - rk.y, dist = Math.hypot(dxr, dyr, dzr);
        if (dist < 95) o.flee = Math.min(1, o.flee + dt * 1.2); else o.flee = Math.max(0, o.flee - dt * 0.12);
        if (o.flee > 0.001) { const l = Math.hypot(dxr, dzr) || 1; o.fx += (dxr / l) * dt * 14 * o.flee; o.fz += (dzr / l) * dt * 14 * o.flee; }
        x += o.fx; z += o.fz; y += o.flee * 22;
        const head = Math.atan2(vx + o.fx * 0.02, vz + o.fz * 0.02), S = o.S, w = clk * S.flap * 6.28 + i * 1.3, burst = S.glide > 0 ? Math.max(0, Math.sin(clk * 0.6 + i * 2.1 + s.ph)) : 1, amp = (0.18 + 0.5 * (S.glide > 0 ? burst : 1)) * (1 + o.flee * 0.5);
        const fa = S.glide > 0 ? 0.25 + 0.75 * burst : 1, A = (0.8 * fa + 0.1) * (1 + o.flee * 0.35), c = Math.cos(w), s1 = Math.sin(w), s2 = Math.sin(w - 0.85), s3 = Math.sin(w - 1.7);
        o.root.position.set(x, y - 0.5 * S.scale * 0.35 * c * fa * (S.scale / 3.4), z); o.root.rotation.set(0, head, 0); o.pivot.rotation.z = 0.16 * s.dir; o.pivot.rotation.x = -0.1 - 0.12 * o.flee - 0.07 * fa * c;
        for (const [sh, el, wr] of o.wings) {
          const up = Math.max(0, c);   // montee : l'aile se replie (coude fléchi, main qui traîne) ; descente : l'aile se tend et balaie vers l'avant
          sh.rotation.z = 0.1 + A * s1; sh.rotation.y = -0.18 * c * fa; sh.rotation.x = 0.1 * s1 * fa;
          el.rotation.z = 0.7 * A * s2 - 0.1 - 0.5 * up * fa; el.rotation.y = 0.25 * up * fa;
          wr.rotation.z = 0.95 * A * s3 - 0.05 - 0.35 * up * fa; wr.rotation.y = 0.35 * Math.cos(w - 1.7) * fa;
        }
        o.root.visible = true; used++;
      }
    }
    // instances : une matrice par piece, pour les oiseaux visibles seulement
    const cnt = {};
    for (const s of B.spots) if (s.list) for (const o of s.list) { if (!o.root.visible) continue; const I = instFor(g, o.key); o.root.updateMatrixWorld(true); const c = cnt[o.key] || (cnt[o.key] = [0, 0, 0, 0]); for (const [k, ob] of o.pts) { if (c[k] < 64) I.parts[k].setMatrixAt(c[k]++, ob.matrixWorld); } }
    for (const key in INST) { const I = INST[key], c = cnt[key] || [0, 0, 0, 0]; for (let k = 0; k < 4; k++) { I.parts[k].count = c[k]; I.parts[k].instanceMatrix.needsUpdate = true; } }
  };
  // v322 : compile le programme des oiseaux instancies pendant l'ecran de chargement (sinon petit gel a la premiere vue d'un oiseau)
  EVO.birdsPrewarm = (g) => { try { const m = new T3.InstancedMesh(build('ara').geo[0], mat, 1); m.frustumCulled = false; g.scene.add(m); g.renderer.compile(g.scene, g.camera); g.scene.remove(m); } catch (err) { /* sans effet */ } };
  { const _fr = EVO.frame; EVO.frame = (g, dt) => { _fr(g, dt); update(g, dt); }; }
})();
