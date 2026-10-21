/* v144 : NIVEAU 2 — « OPERATION TRIDENT » : l'océan. La mer est à y = 0 ; le fond est à -90 m (+ le relief des scènes). Acte 1 : SOUS L'EAU (récif, épaves, canyon et baleine,
 * cheminée de lumière qui remonte à la surface). Acte 2 : A LA SURFACE (flotte, porte-avions à traverser, tempête). Acte 3 : la plateforme et l'interception du missile balistique.
 * Tout est posé avec les outils du niveau 1 (S.bx, S.cyl, foe…) ; les êtres vivants et les machines sont des objets animés (evo_dyn.js). */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe;
  if (!EVO || !EVO.on || !foe || !EVO.addDyn) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const rr = (a, b) => a + Math.random() * (b - a);
  Z.PROFILE.ocean = { elev: -90, vol: 130, y: [-90, 520], amp: 0.5 };
  Z.meta.ocean = { label: 'OCEAN', envs: ['campagneDay'], ground: 'sand', groundTint: '#b8ab86', wall: () => ({ mat: 'sand', tint: '#8a8a7a' }), obstacle: 'rock', obstacleTint: '#8a8a7a' };
  const OC = Z.defs.ocean = { signature: 'abysses', scenes: {}, dress() {} };
  if (CC.Roster && CC.Roster.ZONE) CC.Roster.ZONE.ocean = { ground: ['boat'], air: ['mine', 'sub'] };
  const lam = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e } : { color: c });
  const basic = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  const mb = (grp, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };
  const SANDS = ['#a89c7e', '#9c9074', '#b0a485', '#948a6e'], DEEP = ['#2d516d', '#3d6a85', '#3d6a85', '#558199', '#1f3a51'], CORAL = ['#d0719e', '#dc8963', '#9680c9'];
  const yrel = (S, dc, yw) => yw - S.T.base(dc);                 // hauteur mondiale → hauteur relative au fond
  const sea = (S, dc) => -S.T.base(dc);                           // la surface, relative au fond
  const wpin = (fn) => (T, sc) => ({ lx: 0, fy: (d) => fn(d, sc) - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 });
  EVO.oc = { yrel, sea, wpin, pk, rr, ss, lam, basic, mb, SANDS, DEEP, CORAL, OC };

  Z.oceanSurface = (S, d0, d1, hw, amp) => Z.evoWaves(S, d0, d1, hw, -Z.PROFILE.ocean.elev, 'waterSurf', '#7fd0ee', amp === undefined ? 0.5 : amp);
  // ---------- éléments de décor ----------
  const rock = (S, dc, lx, y, s, r, gray) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, DEEP), noMoss: true, shade: '#3f5a5a' }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const KELPC = [['#0f5c40', '#23845c'], ['#136a4a', '#2f9068'], ['#187a55', '#3da474']];   // v191 : verts naturels, sans fluo
  const kelp = (S, dc, lx, r) => { const p = S.at(dc, lx, 0), n = 3 + Math.floor(r() * 2), cc = pk(r, KELPC); for (let k = 0; k < n; k++) Z.addSway(S, p[0] + r.between([-1.4, 1.4]), p[1] - 0.1, p[2] + r.between([-1.4, 1.4]), r.between([3.5, 10]), r.between([1.5, 2.8]), cc[0], cc[1]); };   // v191 : pousses plus courtes et plus larges (feuilles)
  const coral = (S, dc, lx, r) => {   // v192 : colonie : un eventail de lames inclinees + deux branches ramifiees ; teinte unique par colonie
    const c = 'col:' + pk(r, CORAL), c2 = 'col:' + pk(r, CORAL), p = r() < 0.5;
    if (p) { for (let k = 0; k < 5; k++) S.bxr(dc, lx + (k - 2) * 0.5, 1.7 + Math.abs(k - 2) * -0.12, 0.3, 3.3 - Math.abs(k - 2) * 0.4, 1.7, c, undefined, (k - 2) * 20, 0, false); }
    else { for (let k = 0; k < 3; k++) { const a = r.between([-30, 30]); S.bxr(dc + (k - 1) * 0.8, lx + r.between([-0.6, 0.6]), 1.5, 0.55, 3, 0.55, c, undefined, a, 0, false); S.bxr(dc + (k - 1) * 0.8, lx + r.between([-1, 1]) + a * 0.03, 3.2, 0.4, 1.8, 0.4, c2, undefined, a * 1.6, 0, false); } }
    S.cyl(dc, lx, 0, 1.3, 0.7, 'col:#4d6a78', undefined, 7, 1.0, false);   // socle de roche
  };
  const RUC = ['#4a7090', '#3f6784', '#557f9e', '#3a5f7a'], RUL = ['#6498b4', '#5a8aa8'], RUD = ['#24445f', '#2d5470'];
  const ruin = (S, dc, lx, r) => {   // v192 : colonnade en ruine : colonnes (certaines brisees) a chapiteau, soubassement, pan de mur effondre, debris
    const n = 3 + Math.floor(r() * 3), sg = lx < 0 ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const x = dc + k * 6, y = lx + r.between([-0.8, 0.8]), c = 'col:' + pk(r, RUC), broken = r() < 0.4, h = broken ? r.between([2.5, 5]) : r.between([8, 12]);
      S.bx(x, y, 0.5, 3.4, 1.0, 3.4, 'col:' + pk(r, RUD), undefined, false);
      S.cyl(x, y, 1, 1.05, h, c, undefined, 8, 0.85, false);
      if (!broken) { S.cyl(x, y, 1 + h, 1.45, 0.7, 'col:' + pk(r, RUL), undefined, 8, 1.45, false); }
      else S.bxr(x + r.between([2, 3.5]), y + sg * r.between([1.5, 3]), 0.9, 1.9, 1.7, 3.2 + r() * 2, c, undefined, r.between([-12, 12]), r.between([-40, 40]), false);
    }
    for (let j = 0; j < 3; j++) S.bx(dc + n * 6 + 1 + j * 3.4, lx + sg * 4, 1 + j * 0.55, 3.2, 2 + j * 1.1 - (j === 2 ? 1.4 : 0), 1.5, 'col:' + pk(r, RUC), undefined, false);
    for (let j = 0; j < 4; j++) S.bxr(dc + r.between([0, n * 6]), lx + sg * r.between([3, 7]), 0.5, r.between([0.8, 1.6]), 0.8, r.between([0.9, 1.8]), 'col:' + pk(r, RUD), undefined, r.between([-20, 20]), r.between([0, 90]), false);
  };
  const wreck = (S, dc, lx, r, len) => {
    const L = len || 60, roll = r.between([-25, 25]), yaw = r.between([-30, 30]);
    S.bxr(dc, lx, 6, 12, 5, L, 'col:#3a3a38', undefined, roll, yaw, true); S.bxr(dc, lx - 3, 9.5, 6, 5, L * 0.8, 'col:#4a4640', undefined, roll, yaw, true);
    for (let k = 0; k < 7; k++) S.bxr(dc + (k - 3) * L / 8, lx, 14, 0.7, 7, 0.7, 'col:#5a4a38', undefined, roll, yaw, false);   // côtes de la coque, à nu
    S.bxr(dc - L * 0.3, lx + 6, 14, 6, 12, 8, 'col:#4a4a46', undefined, roll * 0.5, yaw, true);
    S.cyl(dc + L * 0.2, lx + 3, 8, 2, 14, 'col:#5a4a38', undefined, 8, 1.4, false);
    for (let k = 0; k < 4; k++) S.glow(dc + (k - 1.5) * L / 6, lx, 8, '#7affc8', 6);
  };
  const shaft = (S, dc, lx, depth) => {
    const p = S.at(dc, lx, depth * 0.5), m = new T3.Mesh(new T3.CylinderGeometry(7, 17, depth, 10, 1, true), new T3.MeshBasicMaterial({ color: '#cff2ff', transparent: true, opacity: rr(0.04, 0.07), blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }));
    m.position.set(p[0], p[1], p[2]); m.rotation.z = rr(-0.1, 0.1); if (S.inClip(dc)) S.b.root.add(m);
  };
  // banc de poissons : N petits poissons qui tournent ensemble
  const school = (S, dc, lx, yw, n, col) => {
    const g = new T3.Group(), fish = [], m = lam(col || '#b8d0dc', '#203038');
    for (let i = 0; i < n; i++) { const f = new T3.Mesh(new T3.ConeGeometry(0.4, 1.8, 5), m); f.rotation.x = Math.PI / 2; const h = new T3.Group(); h.add(f); h.userData = { ph: rr(0, 6.28), r: rr(3, 13), y: rr(-5, 5), s: rr(0.6, 1.2) }; g.add(h); fish.push(h); }
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0);
    EVO.addDyn(g, (t) => { for (const h of fish) { const u = h.userData, a = t * u.s * 0.7 + u.ph; h.position.set(Math.cos(a) * u.r, u.y + Math.sin(a * 1.7) * 2, Math.sin(a) * u.r * 0.7); h.rotation.y = -a + Math.PI; } g.position.y += Math.sin(t * 0.4 + dc) * 0.02; }, [], { near: 340 });
  };
  // méduses lumineuses : sphères qui pulsent
  const jelly = (S, dc, lx, yw, col) => {
    const g = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(2.4, 12, 8, 0, 6.283, 0, Math.PI / 2), basic(col || '#7affff', { transparent: true, opacity: 0.8, fog: false })); g.add(body);
    for (let k = 0; k < 6; k++) { const t = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.02, 6, 4), basic(col || '#7affff', { transparent: true, opacity: 0.5 })); const a = k * 1.047; t.position.set(Math.cos(a) * 1.4, -3, Math.sin(a) * 1.4); g.add(t); }
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); S.glow(dc, lx, yrel(S, dc, yw), col || '#7affff', 14);
    EVO.addDyn(g, (t) => { const k = 1 + 0.18 * Math.sin(t * 2 + dc); body.scale.set(k, 1 / k, k); g.position.y += Math.sin(t * 0.8 + dc) * 0.03; }, [], { near: 320 });
  };
  // la baleine : un colosse qui vient en sens inverse dans le canyon, queue qui bat (corps = 3 boîtes de collision)
  EVO.oc.whale = (S, dc, lx, yw, speed) => {
    const g = new T3.Group(), body = lam('#44586a'), belly = lam('#b4c0c8'), fin = lam('#36485a');
    const b = new T3.Mesh(new T3.SphereGeometry(1, 20, 14), body); b.scale.set(9, 8, 32); g.add(b);
    const bl = new T3.Mesh(new T3.SphereGeometry(1, 16, 10), belly); bl.scale.set(8.2, 6, 30); bl.position.y = -2.4; g.add(bl);
    const hd = new T3.Mesh(new T3.SphereGeometry(1, 16, 12), body); hd.scale.set(8.2, 7, 12); hd.position.set(0, 0.6, 26); g.add(hd);
    for (const s of [-1, 1]) { mb(g, 14, 0.8, 5, fin, s * 11, -4, 14).rotation.z = s * 0.35; const e = new T3.Mesh(new T3.SphereGeometry(0.7, 8, 6), basic('#05090c')); e.position.set(s * 6.8, 1.4, 30); g.add(e); }
    const tail = new T3.Group(); tail.position.z = -30; g.add(tail); const tb = new T3.Mesh(new T3.SphereGeometry(1, 12, 8), body); tb.scale.set(4, 3.4, 12); tb.position.z = -6; tail.add(tb); mb(tail, 22, 0.8, 7, fin, 0, 0, -14);
    const cols = [EVO.colBox(g, 15, 14, 30, 0, 0, -4), EVO.colBox(g, 14, 12, 24, 0, 0.6, 20), EVO.colBox(g, 8, 8, 14, 0, 0, -26)];
    const T = S.T, st = { d: dc, ph: rr(0, 6) };
    pos0(S, g, dc, lx, yrel(S, dc, yw));
    EVO.addDyn(g, (t, dt, game) => {
      st.d -= (speed || 7) * dt; const p = T.at(st.d, lx + Math.sin(t * 0.25) * 12, yrel(S, st.d, yw) + Math.sin(t * 0.3) * 4), q = T.at(st.d - 6, lx + Math.sin(t * 0.25) * 12, yrel(S, st.d - 6, yw));
      g.position.set(p[0], p[1], p[2]); g.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]);
      tail.rotation.x = Math.sin(t * 1.6 + st.ph) * 0.28; tail.rotation.y = Math.sin(t * 0.8 + st.ph) * 0.1; g.rotation.z = Math.sin(t * 0.5) * 0.04;
      if (game.rocket && game.rocket.active && !st.sang && g.position.distanceTo(game.rocket.pos) < 220) { st.sang = 1; game.audio.play('whale', g.position); }
    }, cols, { near: 9999, span: 9999 });
    return g;
  };
  function pos0(S, g, dc, lx, y) { const p = S.at(dc, lx, y); g.position.set(p[0], p[1], p[2]); if (S.inClip(dc)) S.b.root.add(g); }
  // arche de roche à traverser
  const arch = (S, dc, lx, y, w, h, r) => { rock(S, dc, lx - w / 2 - 6, 0, 14, r); rock(S, dc, lx + w / 2 + 6, 0, 14, r); for (let k = 0; k < 5; k++) rock(S, dc + r.between([-3, 3]), lx + (k - 2) * (w / 4), y + h + 5, r.between([8, 13]), r); };

  // ===== ABYSSES (1380 m) : le missile sort du tube ; récif, épaves et mines, canyon et baleine, cheminée de lumière qui remonte à la surface
  const L1 = 1380;
  OC.scenes.abysses = { len: [L1, L1], noDoor: true, noChaos: true, seabed: true, gw: 125,
    sub: [{ u: 0, key: 'recif', name: 'LE RECIF' }, { u: 0.33, key: 'epaves', name: 'LES EPAVES' }, { u: 0.64, key: 'canyon', name: 'LE CANYON' }, { u: 0.92, key: 'cheminee', name: 'LA REMONTEE' }],
    pin: wpin((d, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return mix3(u); }),
    relief(T, sc) { let lo = 0, hi = 0; const fn = (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return 40 * ss(0, 0.06, u) - 12 * ss(0.36, 0.6, u) - 80 * ss(0.64, 0.8, u) + 125 * ss(0.9, 0.99, u) + 4 * Math.sin(d / 37) * ss(0.06, 0.2, u) * (1 - ss(0.8, 0.9, u)); }; for (let d = sc.d0; d <= sc.d1; d += 4) { const v = fn(d); lo = Math.min(lo, v); hi = Math.max(hi, v); } sc.rlo = lo; sc.rhi = hi; return { fn, max: Math.max(-lo, hi) }; },
    ground: (d, lx, c, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0), dep = U.clamp(-(d * 0 + 0) , 0, 1); const base = new T3.Color('#8fa88a'), lit = new T3.Color('#aec79a'), shade = new T3.Color('#566f64'), vari = new T3.Color('#788f6a'); c.copy(base).lerp(lit, 0.5 + 0.5 * Math.sin(lx * 0.045 + d * 0.021) * Math.sin(d * 0.034 - lx * 0.017 + 1.3)).lerp(vari, 0.35 + 0.35 * Math.sin(d * 0.013 + lx * 0.02)).lerp(shade, ss(0.3, 0.78, u) * (1 - ss(0.92, 1, u))); c.multiplyScalar(0.96 + 0.05 * Math.sin(lx * 0.31 + d * 0.12) * Math.sin(d * 0.27 - lx * 0.11)); },   // v190 : sable clair a plaques turquoise + rides
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      Z.oceanSurface(S, S.d0 + 10, S.d1, 140);
      // lumière du jour qui descend : des faisceaux, nombreux au récif, de plus en plus rares
      for (let i = 0; i < 40; i++) { const u = i / 40, dc = d(u * 0.9 + 0.02), lx = (i % 2 ? 1 : -1) * rr(8, 90); S.item(dc, () => shaft(S, dc, lx, sea(S, dc) * 0.98)); }
      // --- récif : coraux, varech, rochers, bancs de poissons, deux arches
      for (const sg of [-1, 1]) S.rows(d(0.02), d(0.34), 7, 0.9, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + sg * r.between([14, 100]); const k = r(); if (k < 0.14) coral(S, dc, lx, r); else if (k < 0.45) kelp(S, dc, lx, r); else rock(S, dc, lx, 0, r.between([3, 9]), r, pk(r, DEEP)); }));
      for (const sg of [-1, 1]) S.rows(d(0.34), d(0.62), 14, 0.8, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + sg * r.between([20, 110]); if (r() < 0.6) rock(S, dc, lx, 0, r.between([4, 12]), r); else kelp(S, dc, lx, r); }));
      for (const [u, sg] of [[0.05, 1], [0.15, -1], [0.22, 1], [0.3, -1]]) S.item(d(u), (r) => ruin(S, d(u), sg * r.between([34, 58]), r));   // v192 : ruines hors du couloir (decor sans collision)
      for (const [u, sg] of [[0.4, 1], [0.52, -1], [0.58, 1]]) S.item(d(u), (r) => ruin(S, d(u), sg * r.between([46, 70]), r));
      S.item(d(0.1), (r) => arch(S, d(0.1), 0, yrel(S, d(0.1), -34) - 6, 44, 30, r)); S.item(d(0.24), (r) => arch(S, d(0.24), 8, yrel(S, d(0.24), -36) - 6, 48, 30, r));
      for (let i = 0; i < 6; i++) S.item(d(0.06 + i * 0.05), () => school(S, d(0.06 + i * 0.05), (i % 2 ? 1 : -1) * 22, -26 - (i % 3) * 8, 26));
      for (let i = 0; i < 5; i++) S.item(d(0.04 + i * 0.06), (r) => { const dc = d(0.04 + i * 0.06), lx = (i % 2 ? 1 : -1) * r.between([24, 60]); for (let k = 0; k < 3; k++) S.bx(dc + k * 3, lx + k * 2, 3 + k * 2, 4 - k, 5 + k * 3, 3, 'col:' + pk(r, ['#2f5470', '#3a6585', '#264760']), undefined, true); });
      // --- épaves : trois coques couchées, chaînes de mines, un sous-marin ennemi
      S.item(d(0.38), (r) => wreck(S, d(0.38), -30, r, 70)); S.item(d(0.48), (r) => wreck(S, d(0.48), 26, r, 90)); S.item(d(0.57), (r) => wreck(S, d(0.57), -22, r, 60));
      for (let i = 0; i < 9; i++) { const dc = d(0.36 + i * 0.03); S.item(dc, (r) => { const lx = (i % 2 ? 1 : -1) * r.between([8, 36]), yw = -30 - (i % 3) * 6; S.cyl(dc, lx, 0, 0.14, Math.max(2, yrel(S, dc, yw)), 'col:#34342e', undefined, 5, 0.14, false); }); }
      for (let i = 0; i < 6; i++) { const dc = d(0.3 + i * 0.06); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 14, yrel(S, dc, -28 - (i % 3) * 5), { name: 'MINE', keep: i < 2 }); }
      foe(S, 'sub', d(0.52), 6, yrel(S, d(0.52), -40), { name: 'SOUS-MARIN', hp: 2, armed: true, keep: true });
      for (let i = 0; i < 4; i++) S.item(d(0.34 + i * 0.07), () => school(S, d(0.34 + i * 0.07), (i % 2 ? -1 : 1) * 30, -34, 22, '#d8e0a0'));
      // --- canyon : parois de roche, méduses lumineuses, la baleine qui vient en face
      for (const sg of [-1, 1]) S.rows(d(0.6), d(0.94), 9, 0.7, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + sg * r.between([36, 58]); rock(S, dc, lx, 0, r.between([14, 26]), r, pk(r, DEEP)); if (r() < 0.5) rock(S, dc, lx + sg * 3, 24, r.between([12, 20]), r, pk(r, DEEP)); if (r() < 0.55) rock(S, dc, lx + sg * 5, 46, r.between([12, 22]), r, pk(r, DEEP)); }));
      for (let i = 0; i < 16; i++) { const dc = d(0.64 + i * 0.018); S.item(dc, (r) => jelly(S, dc, r.between([-40, 40]), r.between([-100, -50]), pk(r, ['#7affff', '#ff8aff', '#8affa8']))); }
      S.item(d(0.7), (r) => { for (let k = 0; k < 24; k++) S.glow(d(0.66 + k * 0.01), (k % 2 ? 1 : -1) * 44, yrel(S, d(0.66 + k * 0.01), -70) + r.between([-12, 12]), '#5affd8', 9); });
      EVO.oc.whale(S, d(0.82), 0, -92, 6.5);
      foe(S, 'sub', d(0.7), -14, yrel(S, d(0.7), -76), { name: 'SOUS-MARIN', hp: 3, armed: true, keep: true }); foe(S, 'mine', d(0.76), 16, yrel(S, d(0.76), -70), { name: 'MINE', keep: true });
      // --- cheminée de lumière : les parois se resserrent, la surface scintille au-dessus
      for (const sg of [-1, 1]) S.rows(d(0.93), d(0.995), 10, 0.5, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + sg * r.between([26, 34]); rock(S, dc, lx, 0, r.between([14, 22]), r); rock(S, dc, lx + sg * 2, 22, r.between([12, 18]), r); }));
      for (let i = 0; i < 8; i++) { const dc = d(0.93 + i * 0.008); S.item(dc, () => shaft(S, dc, (i % 2 ? 1 : -1) * 14, sea(S, dc) * 0.98)); }
      S.item(d(0.992), () => { const dc = d(0.992), lx = S.lane(dc).lx, y = sea(S, dc); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; S.bx(dc, lx + Math.cos(a) * 16, y + Math.sin(a) * 16, 3.2, 3.2, 3, 'emis:#cff8ff', undefined, false); } S.glow(dc, lx, y, '#cff8ff', 90); });
    } };
  function mix3(u) {   // altitude mondiale de la trajectoire en fonction de la progression dans l'acte 1
    if (u < 0.33) return -30 - 6 * Math.sin(u * 40);
    if (u < 0.64) return -40 - 5 * Math.sin(u * 30);
    if (u < 0.9) return -80 + 12 * ss(0.64, 0.7, u) * 0 - 6 * Math.sin(u * 22);
    return -80 + 88 * ss(0.9, 0.995, u);
  }
})();
