/* v281 : NIVEAU 2, ZONE 1 — « LES RAPIDES » : le camp militaire de la colline (la rampe), le fleuve calme et ses ponts de lianes, la premiere cascade, les gorges aux rapides,
 * le temple en ruine et son pont de pierre, la seconde cascade, la lagune aux pitons de roche et l'aqueduc, le barrage qui se dresse au fond. Cotes absolues : voir zones_river.js. */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, TR = CC.Trees, R = EVO && EVO.riv;
  if (!R) return;
  const OC = Z.defs.ocean, SC = OC.scenes, { pk, ss } = EVO.oc;
  const { WY, BED, HW, DEP, LA, F1, F2, A, absAt, SEAB, plant, slab, lampS, water, curtain, hsh, GREEN, WALL, STONE, TEMPLE, rel, mixf } = R;
  const OUT = 150;
  const WOOD = ['#7a5a38', '#6e5232', '#86643e'], THATCH = ['#8f7a3c', '#7e6b34', '#9a8644'], RUST = ['#8a4a2a', '#7a4226', '#94562e'];
  const DRY = ['#6a7a4a', '#5e6e42'];

  // cylindre horizontal en travers du couloir (tronc, poutre) ; collision par une boite
  const cylH = (S, dc, lx, yAbs, r, len, mat, tint, collide, roll) => {
    if (!S.inClip(dc)) return; const p = absAt(S, dc, lx, yAbs), g = new T3.CylinderGeometry(r, r * 0.9, len, 9); g.rotateZ(Math.PI / 2);
    const q = new T3.Quaternion().setFromEuler(new T3.Euler(0, U.deg(S.yaw(dc)), roll || 0, 'YXZ')); S.b.addGeometry(g, new V(p[0], p[1], p[2]), q, null, mat, tint, [len / 8, 1]); g.dispose();
    if (collide !== false) S.b.box({ p, s: [len, r * 2.1, r * 2.1], r: [0, S.yaw(dc), 0], render: false });
  };
  // rocher pose sur une cote absolue, avec collision
  const rockC = (S, dc, lx, yAbs, s, r, gray, moss) => { const p = absAt(S, dc, lx, yAbs); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, STONE), noMoss: !moss }); S.b.box({ p: [p[0], p[1] + s * 0.55, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  // pilier de roche : du fond jusqu'a hTop (cote absolue), chapeau de roche moussue
  const pillar = (S, dc, lx, hTop, rad, r) => { const bed = BED(dc); S.cyl(dc, lx, A(S, dc, bed - 3), rad, hTop - bed + 3, 'jrock', pk(r, WALL), 8, rad * 0.8, true); rockC(S, dc, lx, hTop - 0.4, rad * 1.1, r, pk(r, STONE), true); };
  // cabane sur pilotis : plancher, murs de planches, toit de tole ou de chaume, porte, fenetre, echelle
  const hut = (S, dc, lx, yGround, r, o) => {
    o = o || {}; const w = o.w || r.between([5.5, 7.5]), d = o.d || r.between([5, 7]), h0 = o.stilt === undefined ? r.between([2.4, 4]) : o.stilt, wall = pk(r, WOOD), roof = o.roof || (r() < 0.5 ? 'corrugated' : 'planks'), rt = o.roofTint || (roof === 'corrugated' ? pk(r, RUST) : pk(r, THATCH));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.cyl(dc + sz * d * 0.42, lx + sx * w * 0.42, A(S, dc, yGround) - 0.6, 0.22, h0 + 0.8, 'bark', '#5a4328', 6, 0.2, true);
    S.bx(dc, lx, A(S, dc, yGround) + h0, w + 0.8, 0.3, d + 0.8, 'planks', '#8a6a44', true);
    S.bx(dc, lx, A(S, dc, yGround) + h0 + 1.55, w, 3.1, d, 'planks', wall, true);
    S.bx(dc - d / 2 - 0.02, lx - w * 0.2, A(S, dc, yGround) + h0 + 1.2, 1.4, 2.3, 0.1, 'col:#1c1a16', undefined, false); S.bx(dc + 0.5, lx + w / 2 + 0.03, A(S, dc, yGround) + h0 + 1.9, 0.1, 1.0, 1.3, 'col:#263238', undefined, false);
    S.bxr(dc, lx - w * 0.27, A(S, dc, yGround) + h0 + 3.55, w * 0.62, 0.22, d + 1.4, roof, rt, -24, 0, true); S.bxr(dc, lx + w * 0.27, A(S, dc, yGround) + h0 + 3.55, w * 0.62, 0.22, d + 1.4, roof, rt, 24, 0, true);
    S.bx(dc, lx, A(S, dc, yGround) + h0 + 4.15, 0.4, 0.3, d + 1.4, 'planks', '#5a4328', false);
    if (h0 > 1.2) { S.bxr(dc - d / 2 - 1.2, lx - w * 0.2, A(S, dc, yGround) + h0 * 0.5, 1.1, h0 * 1.15, 0.12, 'planks', '#7a5a38', 0, 0, false); }
  };
  // tour de guet : quatre pieux, plate-forme, garde-corps, toit, projecteur
  const tower = (S, dc, lx, yGround, hgt, r) => {
    const w = 5;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.cyl(dc + sz * w * 0.4, lx + sx * w * 0.4, A(S, dc, yGround) - 0.6, 0.3, hgt + 0.8, 'bark', '#5a4328', 6, 0.24, true);
    for (let k = 1; k < 4; k++) S.bx(dc, lx, A(S, dc, yGround) + k * hgt / 4, w * 0.9, 0.2, 0.2, 'planks', '#6a4a2c', false), S.bx(dc, lx, A(S, dc, yGround) + k * hgt / 4, 0.2, 0.2, w * 0.9, 'planks', '#6a4a2c', false);
    S.bx(dc, lx, A(S, dc, yGround) + hgt, w + 1.2, 0.3, w + 1.2, 'planks', '#8a6a44', true);
    for (const sx of [-1, 1]) { S.bx(dc, lx + sx * (w + 1) / 2, A(S, dc, yGround) + hgt + 0.7, 0.14, 1.0, w + 1.2, 'planks', '#5a4328', false); S.bx(dc + sx * (w + 1) / 2, lx, A(S, dc, yGround) + hgt + 0.7, w + 1.2, 1.0, 0.14, 'planks', '#5a4328', false); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.cyl(dc + sz * w * 0.5, lx + sx * w * 0.5, A(S, dc, yGround) + hgt, 0.12, 2.6, 'bark', '#4a3820', 5, 0.1, false);
    S.bxr(dc, lx, A(S, dc, yGround) + hgt + 2.8, w + 2.4, 0.2, w + 2.4, 'corrugated', pk(r, RUST), 0, 0, false);
    lampS(S, dc - w * 0.5, lx, A(S, dc, yGround) + hgt + 2.4, '#fff1c8', 22);
  };
  const crates = (S, dc, lx, yGround, r, n) => { for (let k = 0; k < n; k++) { const s = r.between([0.9, 1.5]); S.bx(dc + r.between([-2.5, 2.5]), lx + r.between([-2.5, 2.5]), A(S, dc, yGround) + s / 2, s, s, s, 'planks', pk(r, ['#5a6a3a', '#6a5a3a', '#7a6a4a']), true); } };
  const drums = (S, dc, lx, yGround, r, n) => { for (let k = 0; k < n; k++) { const c = pk(r, ['#8a2a1a', '#3a5a2a', '#2a3a6a']); S.cyl(dc + r.between([-2, 2]), lx + r.between([-2, 2]), A(S, dc, yGround), 0.42, 1.15, 'col:' + c, undefined, 9, 0.42, true); } };
  const sandbags = (S, dc, lx, yGround, len, r) => { for (let k = 0; k < 3; k++) S.bx(dc, lx, A(S, dc, yGround) + 0.3 + k * 0.5, len - k * 0.5, 0.5, 1.5, 'dirt', pk(r, ['#9a8a5a', '#8e7e4e', '#a49464']), true); };

  // ============================================== LE TEMPLE EN RUINE ==============================================
  // pyramide a gradins (5 etages) sur la rive droite, escalier central, sanctuaire au sommet, tetes sculptees, torches ; colonnade ecroulee et pont de pierre a trois arches
  const temple = (S, dc, sgn, yTerr, r) => {
    const lx0 = sgn * 58, tiers = [[46, 5.5], [38, 5.5], [30, 5.5], [22, 5.5], [14, 5]]; let y = yTerr;
    tiers.forEach(([w, h], i) => { const tint = pk(r, TEMPLE); S.bx(dc, lx0, A(S, dc, y) + h / 2, w, h, w, 'jrock', tint, true); S.bx(dc, lx0, A(S, dc, y) + h + 0.18, w + 0.9, 0.36, w + 0.9, 'concreteWarm', '#a8a696', false);
      for (let k = 0; k < 6; k++) S.bx(dc + r.between([-w / 2, w / 2]), lx0 - sgn * (w / 2 + 0.05), A(S, dc, y) + h * r.between([0.2, 0.8]), 0.1, r.between([0.6, 1.8]), r.between([1, 3]), 'col:#4a6a3a', undefined, false);   // mousses sur les gradins
      for (const e of [-1, 1]) for (let k = 0; k < 3; k++) { const q = (k - 1) * w * 0.3; S.bx(dc + e * (w / 2 + 0.2), lx0 + q, A(S, dc, y) + h * 0.55, 0.5, 1.6, 1.6, 'jrock', pk(r, STONE), false); }   // petits blocs sculptes sur la facade
      y += h; });
    for (let k = 0; k < 24; k++) S.bx(dc - 23 - k * 0.5 + 0.2, lx0, A(S, dc, yTerr) + 0.3 + k * 1.04, 8, 0.6, 0.55, 'concreteWarm', '#b6b4a2', true);   // grand escalier central, face au fleuve
    // sanctuaire : cella, porche a piliers, toit a degres, braseros
    const sy = y, c = lx0;
    S.bx(dc, c, A(S, dc, sy) + 3.2, 11, 6.4, 11, 'jrock', pk(r, TEMPLE), true); S.bx(dc - 5.6, c, A(S, dc, sy) + 2.6, 4.2, 5.2, 0.3, 'col:#0e1210', undefined, false);
    for (const q of [-4, -1.4, 1.4, 4]) S.cyl(dc - 6.8, c + q, A(S, dc, sy), 0.7, 5.6, 'jrock', '#b0ae9c', 8, 0.62, true);
    S.bx(dc - 6.8, c, A(S, dc, sy) + 5.9, 11.4, 0.7, 2.2, 'jrock', '#9a9886', true);
    for (let k = 0; k < 3; k++) S.bx(dc, c, A(S, dc, sy) + 6.7 + k * 1.2, 10 - k * 2.8, 1.2, 10 - k * 2.8, 'jrock', pk(r, TEMPLE), true);
    S.cyl(dc, c, A(S, dc, sy) + 10.3, 0.9, 2.6, 'jrock', '#bcb9a6', 8, 0.2, true);
    for (const q of [-5, 5]) { S.cyl(dc - 8.6, c + q, A(S, dc, sy), 0.6, 1.2, 'col:#3a3a3a', undefined, 8, 0.8, false); S.bx(dc - 8.6, c + q, A(S, dc, sy) + 1.5, 1.0, 0.5, 1.0, 'emis:#ff8a2a', undefined, false); S.glow(dc - 8.6, c + q, A(S, dc, sy) + 1.8, '#ff8a3a', 20); }
    // tetes sculptees colossales (deux, de part et d'autre de l'escalier, au pied de la 1re terrasse)
    for (const q of [-9, 9]) { const hy = A(S, dc, yTerr) + 5.5 + 3; S.bx(dc - 24, lx0 + q, hy, 4.6, 5.6, 4, 'jrock', '#a09e8c', true); S.bx(dc - 26.1, lx0 + q - 1.1, hy + 0.9, 1.0, 0.7, 0.5, 'col:#141612', undefined, false); S.bx(dc - 26.1, lx0 + q + 1.1, hy + 0.9, 1.0, 0.7, 0.5, 'col:#141612', undefined, false); S.bx(dc - 26.2, lx0 + q, hy - 0.4, 0.8, 1.4, 0.7, 'jrock', '#8e8c7a', false); S.bx(dc - 26.1, lx0 + q, hy - 1.7, 2.4, 0.5, 0.5, 'col:#141612', undefined, false); S.bx(dc - 24, lx0 + q, hy + 3.2, 5.0, 0.9, 4.4, 'jrock', '#7e9a58', false); }
    // colonnade ecroulee devant l'escalier
    for (let k = 0; k < 6; k++) { const q = -16 + k * 6.4 + r.between([-0.5, 0.5]), broken = k % 3 === 1, h = broken ? r.between([2, 4]) : 9; S.cyl(dc - 34 + r.between([-1, 1]), lx0 + q, A(S, dc, yTerr), 1.1, h, 'jrock', pk(r, STONE), 9, 0.95, true); if (!broken) S.bx(dc - 34, lx0 + q, A(S, dc, yTerr) + h + 0.5, 2.8, 0.9, 2.8, 'jrock', '#a8a694', true); }
    // vegetation sur les gradins
    for (let k = 0; k < 14; k++) { const lev = Math.floor(r() * 4), tw = tiers[lev][0], yy = yTerr + tiers.slice(0, lev + 1).reduce((a, b) => a + b[1], 0), px = lx0 + r.between([-tw / 2 + 2, tw / 2 - 2]), pz = dc + r.between([-tw / 2 + 2, tw / 2 - 2]); if (hsh(k, dc) < 0.5) plant(S, TR.fern, pz, px, yy + 0.2, r.between([1.4, 2.4]), r); else plant(S, TR.bigleaf, pz, px, yy + 0.2, r.between([1.2, 2]), r); }
  };
  // pont de pierre a arches (trois travees) au-dessus de la gorge
  const stoneBridge = (S, dc, hw, yDeck, r) => {
    const span = 2 * (hw + 8), t = 'jrock', tint = '#8e8c7a', n = 3;
    S.bx(dc, 0, A(S, dc, yDeck) - 0.9, span, 1.8, 7.5, t, tint, true);                          // tablier
    S.bx(dc, 0, A(S, dc, yDeck) + 0.35, span, 0.7, 8.4, 'concreteWarm', '#a8a694', false);       // dalles
    for (const e of [-1, 1]) { S.bx(dc + e * 3.5, 0, A(S, dc, yDeck) + 1.2, span, 1.3, 0.7, 'jrock', '#9a9886', true); for (let k = 0; k <= 12; k++) S.bx(dc + e * 3.5, -span / 2 + k * span / 12, A(S, dc, yDeck) + 0.4, 0.8, 0.9, 0.9, 'jrock', '#7e7c6c', false); }
    for (const x of [-hw * 0.52, hw * 0.52]) S.cyl(dc, x, A(S, dc, BED(dc) - 2), 2.6, yDeck - BED(dc) - 1, 'jrock', '#86847a', 9, 2.2, true);   // deux piles : le centre du fleuve reste libre
    for (let k = 0; k < 3; k++) S.bx(dc, (k - 1) * (hw * 0.8), A(S, dc, yDeck) - 3, hw * 0.55, 1.6, 7.0, 'jrock', '#7e7c6c', false);   // intrados des arches
    for (let k = 0; k < 5; k++) plant(S, TR.fern, dc + r.between([-3, 3]), r.between([-span / 2 + 6, span / 2 - 6]), yDeck + 1.0, r.between([1.2, 2.2]), r);
  };

  // portique de pierre en ruine en travers du fleuve (deux montants, linteau fendu, lianes) : on passe en dessous, au centre
  const ruinGate = (S, dc, hw, yTop, r) => {
    for (const sg of [-1, 1]) { const x = sg * (hw - 5.5); S.cyl(dc, x, A(S, dc, BED(dc) - 2), 3.0, yTop - BED(dc) + 2, 'jrock', pk(r, TEMPLE), 9, 2.7, true); S.bx(dc, x, A(S, dc, yTop + 1), 7, 2.2, 7, 'jrock', '#bcbca8', true); for (let k = 0; k < 3; k++) S.bx(dc - 3.2, x, A(S, dc, yTop - 4 - k * 5), 0.4, 1.2, 4.2, 'jrock', '#8a8a78', false); }
    S.bx(dc, -hw * 0.55, A(S, dc, yTop + 3.4), hw * 0.9, 2.4, 6.4, 'jrock', pk(r, TEMPLE), true); S.bx(dc, hw * 0.62, A(S, dc, yTop + 3.0), hw * 0.76, 2.4, 6.4, 'jrock', pk(r, TEMPLE), true);   // linteau fendu : le centre est libre
    for (let k = 0; k < 7; k++) S.bx(dc + r.between([-2, 2]), r.between([-hw, hw]), A(S, dc, yTop - r.between([0, 7])), 0.14, r.between([3, 9]), 0.14, 'col:#2e4a24', undefined, false);
    for (let k = 0; k < 6; k++) plant(S, TR.fern, dc + r.between([-2, 2]), r.between([-hw + 4, hw - 4]), yTop + 4.7, r.between([1.2, 2.2]), r);
    lampS(S, dc - 4, -(hw - 5.5), A(S, dc, yTop - 6), '#ff8a2a', 18); lampS(S, dc - 4, hw - 5.5, A(S, dc, yTop - 6), '#ff8a2a', 18);
  };
  // cascade laterale : un affluent qui se jette dans le fleuve du haut de la paroi
  const sideFall = (S, dc, sg, hw, top, r) => {
    const x = sg * (hw + 0.3), h = top - WY(dc);
    S.bx(dc, x, A(S, dc, (top + WY(dc)) / 2), 0.4, h, 6.5, 'waterSurf', '#f4fbff', false); S.bx(dc, x - sg * 1.4, A(S, dc, top - 1), 3.4, 1.8, 7.5, 'jrock', '#9a9a86', true);
    for (let k = 0; k < 4; k++) S.glow(dc, x - sg * 2, A(S, dc, WY(dc) + 0.6 + k * 2), '#ffffff', 16 - k * 2); S.ball(dc, x - sg * 3, A(S, dc, WY(dc) + 0.4), 3.2, 'waterSurf', '#e8f6ff', false, 0.5);
  };
  // gardien colossal assis : socle, jambes, torse, bras sur les genoux, tete a diademe etage, yeux creux ; un par rive de la lagune
  const guardian = (S, dc, sg, yBase, r) => {
    const x = sg * (HW(dc) + 11);   // il regarde vers l'amont, vers la fusee qui arrive
    const t = pk(r, TEMPLE), m = (w, h, d, lx, y, dd, tint) => S.bx(dc + dd, x + lx * sg, A(S, dc, yBase) + y, w, h, d, 'jrock', tint || t, true);
    m(16, 4, 16, 0, 2, 0, '#a8a894'); m(11, 1.4, 11, 0, 4.7, 0, '#bcbca8');
    for (const e of [-1, 1]) { m(4.4, 11, 4.6, e * 3.2, 11, 0); m(3.4, 3.2, 8, e * 3.2, 17.4, 0); }
    m(10.5, 12.5, 6.4, 0, 22.5, 0); m(13.5, 3.2, 6.8, 0, 29.4, 0);
    for (const e of [-1, 1]) { m(3.2, 3.2, 10, e * 7.4, 24.6, 0.6); m(3.4, 9, 3.4, e * 7.8, 21, 4.2); }
    m(5.6, 6.6, 5.6, 0, 34.2, 0); for (let k = 0; k < 4; k++) m(7.4 - k * 1.5, 1.5, 7.4 - k * 1.5, 0, 38.2 + k * 1.5, 0, '#c4c4b0');
    S.bx(dc - 3.2, x, A(S, dc, yBase) + 33.2, 4.2, 0.9, 0.4, 'col:#101412', undefined, false); S.bx(dc - 3.2, x, A(S, dc, yBase) + 34.8, 0.9, 2.4, 0.5, 'jrock', '#8e8e7c', false);
    for (const e of [-1, 1]) S.bx(dc - 3.1, x + e * 1.5, A(S, dc, yBase) + 36.2, 1.1, 0.9, 0.5, 'col:#101412', undefined, false);
    for (let k = 0; k < 8; k++) plant(S, TR.fern, dc + r.between([-6, 6]), x + sg * r.between([-5, 6]), yBase + r.between([0.2, 28]), r.between([1, 1.8]), r);
    lampS(S, dc + 2, x, A(S, dc, yBase) + 5.4, '#ffb04a', 22);
  };
  // ============================================== RAPIDES ==============================================
  SC.rapides = { len: [LA, LA], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'camp', name: 'LE CAMP' }, { u: 0.07, key: 'fleuve', name: 'LE FLEUVE' }, { u: 0.36, key: 'gorges', name: 'LES GORGES' }, { u: 0.7, key: 'lagune', name: 'LA LAGUNE' }],
    turns: [[0.05, 0.2, 14], [0.2, 0.33, -26], [0.4, 0.55, 24], [0.58, 0.68, -20], [0.76, 0.9, 18]],
    pin: (T, sc) => ({ lx: 0, fy: (d) => (d < 100 ? A0b(d) - 4 : R.PATH(d)) - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => BED(d) - SEAB); },
    ground: (d, lx, c, sc) => {
      const k = ss(70, 130, d), ax = Math.abs(lx), earth = new T3.Color('#8a6a3c'), moss = new T3.Color('#4f9a40'), sand = new T3.Color('#8a7a52'), silt = new T3.Color('#6a5e40');
      c.copy(moss).lerp(earth, ss(-8, 8, Math.abs(lx)) * 0 + (Math.abs(lx) < 9 ? 0.85 - 0.04 * Math.abs(lx) : 0.12 + 0.18 * Math.sin(lx * 0.07 + d * 0.05))); c.lerp(sand, k).lerp(silt, k * (0.25 + 0.3 * Math.sin(d * 0.021 + lx * 0.04) * 0.5 + 0.15 * ss(8, 60, ax)));
      c.multiplyScalar((0.66 + 0.09 * Math.sin(lx * 0.23 + d * 0.13) * Math.sin(d * 0.17 - lx * 0.05)) * (1 - 0.3 * k) + 0.3 * (1 - k)); },
    build(S) {
      const L = S.len, d0 = S.d0, T = S.T, gate = (u) => d0 + u * L;
      // --- l'eau : trois niveaux, deux rideaux de cascade
      water(S, 38, F1 + 3, 46, 0); water(S, F1 + 1, F2 + 3, 34, -24); water(S, F2 + 1, S.d1, 80, -54);
      S.item(F1 + 2, (r) => { curtain(S, F1 + 3, HW(F1) + 3, 0, -24); for (const k of [-0.86, -0.58, 0.58, 0.86]) rockC(S, F1 - 1 + r.between([-1, 1]), k * HW(F1), -6, r.between([2.4, 3.8]), r, pk(r, STONE), true); });
      S.item(F2 + 2, (r) => { curtain(S, F2 + 3, HW(F2) + 3, -24, -54); for (const k of [-0.86, -0.58, 0.58, 0.86]) rockC(S, F2 - 1 + r.between([-1, 1]), k * HW(F2), -30, r.between([2.4, 3.8]), r, pk(r, STONE), true); });
      // --- les rives : tranches de 14 m, paroi de roche, replats, couverture de jungle
      for (let dc = 74; dc < LA - 6; dc += 14) S.item(dc, (r) => {
        for (const sg of [-1, 1]) {
          const hwv = HW(dc), face = hwv + r.between([-1.2, 2.2]), top = (dc < 140 ? mixf(A0b(dc) + 10, WY(dc) + 26, ss(74, 140, dc)) : WY(dc) + 26) + 4 * Math.sin(dc / 53 + sg * 1.7) + 2 * Math.sin(dc / 17 + sg), bed = BED(dc), mid = (bed - 6 + top) / 2, hgt = top - bed + 6, wd = OUT - face;
          S.bx(dc, sg * (face + wd / 2), A(S, dc, mid), wd, hgt, 14.9, 'jrock', pk(r, WALL), true);
          S.bx(dc, sg * (face + wd / 2), A(S, dc, top + 0.25), wd, 0.5, 14.9, 'evoGrass', pk(r, GREEN), true);
          // corniches moussues sur la paroi
          const nl = 1 + Math.floor(r() * 2);
          for (let k = 0; k < nl; k++) { const yl = WY(dc) + r.between([3, Math.max(4, top - WY(dc) - 3)]), th = r.between([1.1, 2.4]), ext = r.between([1.2, 3.2]); S.bx(dc + r.between([-4, 4]), sg * (face - ext / 2 + 0.2), A(S, dc, yl), ext, th, r.between([5, 11]), 'jrock', pk(r, STONE), true); S.bx(dc, sg * (face - ext / 2 + 0.2), A(S, dc, yl + th / 2 + 0.12), ext + 0.2, 0.26, 4.5, 'evoGrass', pk(r, GREEN), false); if (r() < 0.7) plant(S, TR.fern, dc + r.between([-3, 3]), sg * (face - ext / 2), yl + th / 2 + 0.2, r.between([1.1, 2]), r); }
          // rochers a la ligne d'eau, roseaux
          if (r() < 0.55) rockC(S, dc + r.between([-5, 5]), sg * (face - r.between([0.8, 3.2])), WY(dc) - 1.2, r.between([1.8, 4]), r, pk(r, STONE), true);
          if (r() < 0.5) plant(S, TR.reeds, dc + r.between([-5, 5]), sg * (face - r.between([0.4, 2.4])), WY(dc) - 0.3, r.between([1.6, 2.6]), r);
          // vegetation du sommet : canopee, palmiers sur le bord, sous-bois
          if (r() < 0.62) plant(S, TR.jungle, dc + r.between([-5, 5]), sg * (face + r.between([6, 22])), top + 0.2, r.between([20, 34]), r, {});
          if (r() < 0.45) plant(S, TR.jungle, dc + r.between([-6, 6]), sg * (face + r.between([22, 70])), top + 0.2, r.between([22, 38]), r, { far: true });
          if (r() < 0.5) plant(S, TR.palm, dc + r.between([-5, 5]), sg * (face + r.between([1.8, 7])), top + 0.2, r.between([9, 15]), r, {});
          for (let k = 0; k < 2; k++) if (r() < 0.7) plant(S, r() < 0.5 ? TR.fern : TR.bigleaf, dc + r.between([-6, 6]), sg * (face + r.between([0.8, 24])), top + 0.2, r.between([1.6, 2.8]), r);
          // lianes qui pendent le long de la paroi
          if (r() < 0.55) { const vx = sg * (face - 0.15), vy = top - 0.5, vl = r.between([6, 16]); S.bx(dc + r.between([-5, 5]), vx, A(S, dc, vy - vl / 2), 0.14, vl, 0.14, 'col:#2e4a24', undefined, false); }
          // filets d'eau qui ruissellent sur la roche
          if (r() < 0.12) S.bx(dc, sg * (face - 0.1), A(S, dc, (top + WY(dc)) / 2), 0.12, top - WY(dc) - 1, 1.1, 'emis:#cfeeff', undefined, false);
        }
      });
      // --- LE CAMP (la colline de la rampe) : sol de jungle, piste de terre, cabanes sur pilotis, tours, mat radio, sacs de sable, caisses, futs, vegetation dense
      for (let dc = 4; dc < 104; dc += 10) S.item(dc, (r) => {
        for (let k = 0; k < 11; k++) { const sg = r() < 0.5 ? -1 : 1, lx = sg * (k < 4 ? r.between([4, 30]) : r.between([12, 110])), yy = BED(dc) + 0.5; const q = r(); if (q < 0.16 && Math.abs(lx) > 10) plant(S, TR.palm, dc + r.between([-5, 5]), lx, yy, r.between([8, 14]), r); else if (q < 0.34 && Math.abs(lx) > 13) rockC(S, dc + r.between([-5, 5]), lx, yy + 0.3, r.between([1.2, 3.2]), r, pk(r, STONE)); else plant(S, q < 0.7 ? TR.fern : TR.bigleaf, dc + r.between([-5, 5]), lx, yy, r.between([1.6, 3.0]), r); }
        if (dc > 6 && dc < 96) slab(S, dc, 0, 0.14, 5.2, 0.18, 7.5, 'hazard', undefined, false);   // v286 : piste de lancement balisee (rappels de vitesse sur la colline)
      });
      S.item(30, (r) => {
        for (const [dc, sg, lxx] of [[10, 1, 30], [44, 1, 40], [24, -1, 34], [58, -1, 48], [76, 1, 54]]) hut(S, dc, sg * lxx, BED(dc), r);
        tower(S, 6, 24, BED(6), 12, r); tower(S, 50, -30, BED(50), 14, r);
        S.cyl(18, -26, A(S, 18, BED(18)), 0.5, 30, 'metal', '#7a8088', 6, 0.3, true); for (let k = 1; k < 5; k++) S.bx(18, -26, A(S, 18, BED(18)) + k * 6, 3.4, 0.16, 0.16, 'metal', '#6a7078', false); lampS(S, 18, -26, A(S, 18, BED(18)) + 30.4, '#ff3a2a', 14);
        crates(S, 20, 30, BED(20), r, 5); drums(S, 36, -30, BED(36), r, 4); crates(S, 46, -34, BED(46), r, 4); sandbags(S, 4, -20, BED(4), 7, r); sandbags(S, 62, 22, BED(62), 8, r);
        for (let k = 0; k < 8; k++) plant(S, r() < 0.5 ? TR.palm : TR.jungle, r.between([4, 96]), (r() < 0.5 ? -1 : 1) * r.between([60, 110]), BED(48), r.between([14, 26]), r, { far: true });
      });
      foe(S, 'aaturret', 32, 28, 0, { name: 'TOURELLE', armed: true, keep: true });
      // --- LE FLEUVE : ponts, embarcadere, ilot, tronc
      S.item(150, (r) => { for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) hut(S, 150 + k * 16, sg * (HW(150) + 10 + r.between([0, 4])), WY(150) + 6, r, { stilt: 6 }); for (let k = 0; k < 4; k++) S.bx(150 + k * 9 - 12, (k % 2 ? 1 : -1) * (HW(150) - 4), A(S, 150, WY(150) + 0.1), 2.8, 0.5, 9, 'planks', '#6a4a2c', false); });
      S.item(250, (r) => ropeBridge(S, 250, HW(250), WY(250) + 14, r));
      S.item(410, (r) => { cylH(S, 410, 0, WY(410) + 10, 2.3, 2 * (HW(410) + 8), 'bark', '#6a5238', true, 0.04); for (let k = 0; k < 9; k++) plant(S, TR.fern, 410 + r.between([-1.5, 1.5]), r.between([-HW(410), HW(410)]), WY(410) + 12.1, r.between([1.2, 2.2]), r); for (let k = 0; k < 6; k++) S.bx(410 + r.between([-1, 1]), r.between([-HW(410), HW(410)]), A(S, 410, WY(410) + 8), 0.12, r.between([3, 7]), 0.12, 'col:#2e4a24', undefined, false); });
      S.item(480, (r) => { pillar(S, 480, -9, WY(480) + 3.5, 6.5, r); for (let k = 0; k < 3; k++) plant(S, TR.palm, 480 + r.between([-3, 3]), -9 + r.between([-3, 3]), WY(480) + 4.2, r.between([8, 12]), r); plant(S, TR.fern, 482, -6, WY(480) + 4.4, 2.0, r); S.bx(480, -9, A(S, 480, WY(480) + 4.8), 2.6, 1.6, 2.6, 'jrock', '#a8a694', true); });
      foe(S, 'gunboat', 330, -10, WY(330) + 0.5 - BED(330), { name: 'CANONNIERE', hp: 3, armed: true, keep: true });
      foe(S, 'mine', 520, 8, WY(520) - BED(520) - 2.5, { name: 'MINE' });
      S.item(190, (r) => ruinGate(S, 190, HW(190), WY(190) + 17, r)); S.item(350, (r) => sideFall(S, 350, 1, HW(350), WY(350) + 26, r)); S.item(530, (r) => sideFall(S, 530, -1, HW(530), WY(530) + 26, r));
      S.item(1040, (r) => { cylH(S, 1040, 0, WY(1040) + 15, 2.1, 2 * (HW(1040) + 8), 'bark', '#6a5238', true, -0.05); for (let k = 0; k < 7; k++) plant(S, TR.fern, 1040 + r.between([-1.5, 1.5]), r.between([-HW(1040), HW(1040)]), WY(1040) + 17, r.between([1.2, 2.2]), r); });
      S.item(1000, (r) => sideFall(S, 1000, -1, HW(1000), WY(1000) + 26, r)); S.item(1120, (r) => sideFall(S, 1120, 1, HW(1120), WY(1120) + 26, r));
      // --- LES GORGES : piliers, slalom de rochers, arche naturelle, le temple, son pont de pierre
      for (let dc = F1 + 52; dc < F2 - 70; dc += 46) S.item(dc, (r) => { const hwv = HW(dc), sg = hsh(dc, 3) < 0.5 ? -1 : 1; pillar(S, dc, sg * r.between([hwv * 0.25, hwv * 0.55]), WY(dc) + r.between([1.2, 4]), r.between([3, 5.2]), r); if (r() < 0.6) pillar(S, dc + 20, -sg * r.between([hwv * 0.2, hwv * 0.5]), WY(dc) + r.between([0.8, 3.2]), r.between([2.6, 4.2]), r); });
      // vestiges immerges : colonnes couchees, blocs a hieroglyphes, tetes de pierre au fond (decor hors du couloir central)
      for (let dc = 110; dc < LA - 80; dc += 38) S.item(dc, (r) => {
        const hwv = HW(dc), sg = hsh(dc, 9) < 0.5 ? -1 : 1, lx = sg * r.between([Math.max(10, hwv * 0.45), Math.max(12, hwv - 4)]), bed = BED(dc), k = r();
        if (k < 0.35) { for (let j = 0; j < 3; j++) S.cyl(dc + j * 4.2, lx + r.between([-1, 1]), A(S, dc, bed) - 0.6, 1.1, r.between([2, 5]), 'jrock', pk(r, TEMPLE), 9, 0.95, true); }
        else if (k < 0.7) { const y = A(S, dc, bed) + 1.4; S.bx(dc, lx, y, 3.6, 2.8, 3.6, 'jrock', pk(r, TEMPLE), true); S.bx(dc - 1.85, lx, y + 0.2, 0.3, 1.8, 1.6, 'col:#2a3a30', undefined, false); S.bx(dc - 1.85, lx - 1.1, y + 0.8, 0.3, 0.5, 0.5, 'col:#101614', undefined, false); S.bx(dc - 1.85, lx + 1.1, y + 0.8, 0.3, 0.5, 0.5, 'col:#101614', undefined, false); }
        else { rockC(S, dc, lx, bed, r.between([3, 6]), r, pk(r, STONE), false); rockC(S, dc + 5, lx + sg * 3, bed, r.between([1.6, 3]), r, pk(r, STONE), false); }
      });
      S.item(760, (r) => { const hwv = HW(760); for (const sg of [-1, 1]) { S.bx(760, sg * (hwv + 3), A(S, 760, WY(760) + 8), 7, 24, 12, 'jrock', pk(r, WALL), true); } S.bx(760, 0, A(S, 760, WY(760) + 24), 2 * (hwv + 6), 9, 13, 'jrock', '#77806c', true); for (let k = 0; k < 6; k++) plant(S, TR.fern, 760 + r.between([-4, 4]), r.between([-hwv, hwv]), WY(760) + 28.6, r.between([1.4, 2.4]), r); for (let k = 0; k < 4; k++) S.bx(760 + r.between([-5, 5]), r.between([-hwv, hwv]), A(S, 760, WY(760) + 17), 0.14, r.between([5, 9]), 0.14, 'col:#2e4a24', undefined, false); });
      S.item(880, (r) => temple(S, 880, 1, WY(880) + 28, r));
      S.item(930, (r) => stoneBridge(S, 930, HW(930), WY(930) + 25, r));
      foe(S, 'gunboat', 700, 6, WY(700) + 0.5 - BED(700), { name: 'CANONNIERE', hp: 3, armed: true, keep: true });
      foe(S, 'gunboat', 1010, -6, WY(1010) + 0.5 - BED(1010), { name: 'CANONNIERE', hp: 3, armed: true });
      foe(S, 'aaturret', 820, -(HW(820) + 6), A(S, 820, WY(820) + 14) , { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      foe(S, 'heli', 1060, 0, WY(1060) + 22 - BED(1060), { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -14, y), SS.at(dc + 24, 0, y + 5), SS.at(dc, 14, y), SS.at(dc - 24, 0, y + 5)], speed: 12 });
      // --- LA LAGUNE : pitons de roche couronnes de jungle, aqueduc, mines, brume ; le barrage au loin
      for (let dc = F2 + 90; dc < LA - 40; dc += 58) S.item(dc, (r) => { const sg = hsh(dc, 5) < 0.5 ? -1 : 1, hwv = HW(dc); const x = sg * r.between([hwv * 0.25, hwv * 0.75]), top = WY(dc) + r.between([14, 30]); pillar(S, dc, x, top, r.between([4.5, 7.5]), r); plant(S, TR.palm, dc, x, top + 1, r.between([8, 13]), r); plant(S, TR.fern, dc + 2, x + 2, top + 0.8, 2, r); for (let k = 0; k < 2; k++) S.bx(dc + r.between([-2, 2]), x + r.between([-3, 3]), A(S, dc, top - r.between([3, 9])), 0.14, r.between([3, 7]), 0.14, 'col:#2e4a24', undefined, false); });
      S.item(1320, (r) => guardian(S, 1320, -1, WY(1320) + 27, r)); S.item(1390, (r) => guardian(S, 1390, 1, WY(1390) + 27, r)); S.item(1610, (r) => ruinGate(S, 1610, HW(1610), WY(1610) + 22, r));
      S.item(1500, (r) => aqueduct(S, 1500, HW(1500), WY(1500) + 34, r));
      for (let k = 0; k < 5; k++) { const dc = 1290 + k * 78; foe(S, 'mine', dc, (k % 2 ? 1 : -1) * 22, WY(dc) - BED(dc) - 2.5, { name: 'MINE', keep: k < 2 }); }
      foe(S, 'gunboat', 1380, 0, WY(1380) + 0.5 - BED(1380), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      foe(S, 'gunboat', 1620, 12, WY(1620) + 0.5 - BED(1620), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      for (let k = 0; k < 24; k++) { const dc = F2 + 60 + k * 24; S.glow(dc, (k % 2 ? 1 : -1) * 20, A(S, dc, WY(dc) + 3), '#e8f6f0', 70); }
    } };
  const A0b = (d) => (d < -50 ? 40 : 40 - 0.344 * (d + 50));

  // pont de lianes : deux poteaux par rive, tablier de planches qui s'affaisse, cordes et suspentes
  function ropeBridge(S, dc, hw, y, r) {
    const span = 2 * (hw + 9), n = 16;
    for (const sg of [-1, 1]) { for (const e of [-1, 1]) S.cyl(dc + e * 1.6, sg * (hw + 5), A(S, dc, y) - 2, 0.42, 6.2, 'bark', '#5a4328', 7, 0.36, true); S.bx(dc, sg * (hw + 5), A(S, dc, y) + 3.9, 0.4, 0.3, 4.2, 'bark', '#4a3820', false); }
    for (let k = 0; k < n; k++) { const x0 = -span / 2 + k * span / n, sag = -2.2 * Math.sin((k + 0.5) / n * Math.PI), yy = y + sag + 0.0;
      S.bx(dc, x0 + span / n / 2, A(S, dc, yy), span / n * 0.86, 0.22, 2.7, 'planks', pk(r, ['#8a6a44', '#7a5a38']), k % 2 === 0);
      for (const e of [-1, 1]) { S.bx(dc + e * 1.4, x0 + span / n / 2, A(S, dc, yy + 1.15), span / n * 1.02, 0.1, 0.1, 'col:#4a3a22', undefined, false); if (k % 2 === 0) S.bx(dc + e * 1.4, x0 + span / n / 2, A(S, dc, yy + 0.6), 0.07, 1.1, 0.07, 'col:#4a3a22', undefined, false); } }
  }
  // aqueduc : deux rangees d'arches de pierre superposees au-dessus de la lagune
  function aqueduct(S, dc, hw, yTop, r) {
    const span = 2 * (hw + 14), nb = 8, bay = span / nb, tint = '#9a9886';
    S.bx(dc, 0, A(S, dc, yTop) + 0.5, span, 1.2, 9, 'jrock', '#8e8c7a', true); S.bx(dc, 0, A(S, dc, yTop) + 1.6, span, 1.0, 10, 'concreteWarm', '#a8a694', false);
    for (let k = 0; k < nb; k++) { const x = -span / 2 + (k + 0.5) * bay; S.bx(dc, x, A(S, dc, (BED(dc) + yTop - 1) / 2), 3.2, yTop - BED(dc) - 1, 7.2, 'jrock', tint, true); }
    for (let k = 0; k <= nb; k++) { const x = -span / 2 + k * bay; S.bx(dc, x, A(S, dc, yTop - 3.2), bay - 3.2, 2.6, 8.2, 'jrock', '#86847a', true); S.bx(dc, x, A(S, dc, WY(dc) + 12), bay - 3.2, 1.8, 8.2, 'jrock', '#86847a', false); }
    for (let k = 0; k < 10; k++) plant(S, TR.fern, dc + r.between([-3, 3]), r.between([-span / 2, span / 2]), yTop + 1.2, r.between([1.2, 2.2]), r);
  }
})();
