/* v145 : NIVEAU 2, suite — acte 2 À LA SURFACE (balises, mines, flotte, PORTE-AVIONS dont on traverse le hangar sur toute sa longueur, récifs et arches), la TEMPETE
 * (trombes, éclairs, rafales, épave en flammes), la PLATEFORME ennemie et l'INTERCEPTION : le missile balistique s'allume, monte, et il faut le rattraper. */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, O = EVO && EVO.oc;
  if (!EVO || !EVO.on || !O || !Z.defs.ocean) return;
  const { yrel, sea, wpin, pk, rr, ss, lam, basic, mb } = O, OC = Z.defs.ocean, SC = OC.scenes;
  const GREY = ['#8a8e92', '#7a7e82', '#9a9ea2'], ROCK = ['#6a6e70', '#5e6264', '#767a7a', '#54585a'];
  const rock = (S, dc, lx, y, s, r, g) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: g || pk(r, ROCK), noMoss: true }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const lamp = (S, dc, lx, y, col, size) => { S.bx(dc, lx, y, 1.2, 0.35, 0.8, 'emis:' + (col || '#ffe2a8'), undefined, false); S.glow(dc, lx, y - 0.3, col || '#ffe2a8', size || 12); };
  // pile de rochers qui sort de la mer (pilier), avec ou sans arche
  const stack = (S, dc, lx, h, r) => { const sy = sea(S, dc); for (let y = -12; y < h; y += 14) rock(S, dc + r.between([-2, 2]), lx + r.between([-2, 2]), sy + y, r.between([16, 26]) * (1 - y / (h * 2.2)), r); };
  const buoy = (S, dc, lx, col) => { const sy = sea(S, dc); S.cyl(dc, lx, sy - 1, 1.3, 4, 'col:' + col, undefined, 8, 0.9, true); S.bx(dc, lx, sy + 3.5, 0.5, 2.6, 0.5, 'col:#44484c', undefined, false); lamp(S, dc, lx, sy + 5.2, col === '#d8402c' ? '#ff3a2a' : '#3aff6a', 18); };
  // navire de guerre : coque effilée (l'étrave vers la fusée), superstructure, mât, radar, tourelle
  const ship = (S, dc, lx, len, tint, o) => {
    o = o || {}; const sy = sea(S, dc);
    for (let k = 0; k * 20 < len; k++) { const d1 = dc - len / 2 + k * 20 + 10; S.item(d1, (r) => { const bow = k * 20 < 40 ? 0.45 + 0.55 * (k * 20) / 40 : 1; S.bx(d1, lx, sy + 1.6, 15 * bow, 9.5, 20.2, 'col:' + (tint || '#4b5159'), undefined, true); S.bx(d1, lx, sy + 6.6, 15.2 * bow, 0.6, 20.2, 'col:#6a7078', undefined, false); S.bx(d1, lx, sy - 1, 15.4 * bow, 1.4, 20.2, 'col:#a8322a', undefined, false); }); }
    S.item(dc, (r) => { const hx = len * 0.28; S.bx(dc + hx, lx, sy + 11, 10, 7, len * 0.3, 'col:#8a9098', undefined, true); S.bx(dc + hx, lx, sy + 16.5, 7, 4.4, len * 0.14, 'col:#9aa0a8', undefined, true); S.cyl(dc + hx, lx, sy + 18, 0.5, 20, 'col:#5a5e66', undefined, 6, 0.4, false); S.bx(dc + hx, lx, sy + 31, 6, 0.5, 2.4, 'col:#aab', undefined, false); S.bx(dc + hx - len * 0.12, lx, sy + 8.5, 5, 3, 6, 'col:#6a7078', undefined, true); lamp(S, dc + hx, lx, sy + 40, '#ff3a2a', 16); if (o.fire) { for (let k = 0; k < 6; k++) { S.bx(dc + hx + (k - 3) * 6, lx + r.between([-4, 4]), sy + 9 + r.between([0, 8]), 3, 4, 3, 'emis:' + pk(r, ['#ff7a2a', '#ffa03a']), undefined, false); S.glow(dc + hx + (k - 3) * 6, lx, sy + 12, '#ff8a3a', 30); } } });
  };
  EVO.oc.ship = ship;

  // ===== LA FLOTTE (1700 m)
  const LS = 1700;
  SC.surface = { len: [LS, LS], noDoor: true, noChaos: true, gw: 125, seabed: true, turns: [[0.04, 0.2, 14], [0.5, 0.7, -10]],
    sub: [{ u: 0, key: 'surface', name: 'LA SURFACE' }, { u: 0.22, key: 'flotte', name: 'LA FLOTTE' }, { u: 0.5, key: 'porte', name: 'LE PORTE-AVIONS' }, { u: 0.74, key: 'recifs', name: 'LES RECIFS' }],
    pin: wpin((d, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return u > 0.485 && u < 0.715 ? 22 : 15 + 4 * Math.sin(d / 70) + (u < 0.06 ? 8 * (1 - u / 0.06) : 0); }),
    ground: (d, lx, c) => { c.set('#2e5a68'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T, sy = sea(S, S.d0 + 10);
      Z.oceanSurface(S, S.d0, S.d1, 140, 1.1);
      // sortie de l'eau : des oiseaux de mer, des roches
      for (let i = 0; i < 14; i++) S.item(d(0.01 + i * 0.012), (r) => { const dc = d(0.01 + i * 0.012), lx = (i % 2 ? 1 : -1) * r.between([10, 70]); S.cyl(dc, lx, sea(S, dc) - 3, 0.5, 4, 'col:#e8e8e4', undefined, 6, 0.1, false); });
      // balises : deux files qui dessinent un chenal qui serpente
      for (let i = 0; i < 18; i++) { const u = 0.06 + i * 0.01, dc = d(u), cx = 22 * Math.sin(u * 60); S.item(dc, () => { buoy(S, dc, cx - 22, '#d8402c'); buoy(S, dc, cx + 22, '#2ca85a'); }); }
      for (let i = 0; i < 5; i++) { const dc = d(0.1 + i * 0.026); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 12, sea(S, dc) + 2.4, { name: 'MINE', keep: i < 3 }); }
      foe(S, 'boat', d(0.17), 8, sea(S, d(0.17)) + 0.8, { name: 'VEDETTE', path: 100, speed: 15, keep: true });
      // la flotte : trois bâtiments en ligne de chaque côté, étraves vers nous ; des tourelles qui tirent
      for (const [u, lx, len, fire] of [[0.27, -48, 110, false], [0.31, 52, 100, false], [0.36, -56, 120, false], [0.41, 50, 104, true], [0.45, -50, 96, false]]) { const dc = d(u); ship(S, dc, lx, len, undefined, { fire }); }
      foe(S, 'aaturret', d(0.3), -48, sea(S, d(0.3)) + 8.6, { name: 'TOURELLE', armed: true, fixed: true, keep: true }); foe(S, 'aaturret', d(0.38), 52, sea(S, d(0.38)) + 8.6, { name: 'TOURELLE', armed: true, fixed: true, keep: true }); foe(S, 'aaturret', d(0.44), -50, sea(S, d(0.44)) + 8.6, { name: 'TOURELLE', armed: true, fixed: true });
      foe(S, 'boat', d(0.33), 10, sea(S, d(0.33)) + 0.8, { name: 'VEDETTE', path: 90, speed: 17 }); foe(S, 'hover', d(0.4), -8, sea(S, d(0.4)) + 1.6, { name: 'AEROGLISSEUR', path: 100, speed: 20 });
      foe(S, 'heli', d(0.36), 0, sea(S, d(0.36)) + 34, { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -34, y), SS.at(dc + 24, 0, y + 6), SS.at(dc, 34, y), SS.at(dc - 24, 0, y + 6)], speed: 13 });
      // --- le PORTE-AVIONS : une coque de 340 m ; son hangar est ouvert aux deux bouts, on le traverse sur toute sa longueur
      const c0 = d(0.5), CL = 340, FL = sea(S, c0) + 8, CEIL = sea(S, c0) + 40, HW = 36;
      for (let k = 0; k * 20 < CL; k++) { const dc = c0 + k * 20 + 10; S.item(dc, (r) => {
        for (const sg of [-1, 1]) { S.bx(dc, sg * (HW + 2), (FL - (sea(S, dc) - 12) + (CEIL - FL)) / 2 + (sea(S, dc) - 12) - 0, 4, CEIL - (sea(S, dc) - 12) + 4, 20.4, 'col:#5a6068', undefined, true); S.bx(dc, sg * (HW - 0.2), FL + 0.6, 0.4, 1.2, 20.4, 'hazard', undefined, false); }
        S.bx(dc, 0, FL - 1, 2 * HW, 2, 20.4, 'col:#4a4e54', undefined, true); S.bx(dc, 0, FL + 0.05, 1.2, 0.1, 20.4, 'col:#e8d23a', undefined, false, { shadow: false });
        S.bx(dc, 0, CEIL + 1.5, 150, 3, 20.4, 'col:#6a7078', undefined, true); if (k % 2 === 0) S.bx(dc, 0, CEIL + 3.1, 1, 0.1, 10, 'col:#e8e8e4', undefined, false, { shadow: false });
        for (const sx of [-1, 0, 1]) S.bx(dc, sx * 20, CEIL - 0.5, 1, 1, 20.4, 'col:#42464c', undefined, false);
        if (k % 2 === 1) { for (const sx of [-14, 14]) { S.bx(dc, sx, CEIL - 1.1, 8, 0.3, 1.6, 'emis:#fff6dc', undefined, false); S.glow(dc, sx, CEIL - 2, '#fff6dc', 26); } }
        // avions parqués, caisses, tracteurs contre les parois (le milieu reste libre sur 40 m)
        if (k % 2 === 0) { const sg = (k / 2) % 2 ? 1 : -1, lx = sg * 27; S.bx(dc, lx, FL + 1.5, 3, 2.4, 16, 'col:#9a9ea2', undefined, true); S.bx(dc, lx, FL + 1.2, 15, 0.5, 5, 'col:#8a8e92', undefined, true); S.bx(dc - 6, lx, FL + 3.2, 0.5, 4, 3, 'col:#8a8e92', undefined, true); S.bx(dc + 5, lx, FL + 2.6, 2.8, 1, 2.4, 'emis:#7ac8ff', undefined, false); }
        else if (r() < 0.7) { const sg = r() < 0.5 ? -1 : 1; S.bx(dc, sg * 30, FL + 1.4, 5, 2.8, 5, 'planks', '#a8793c', true); S.bx(dc + 4, sg * 30, FL + 1.4, 4, 2.8, 4, 'col:#3a5a8a', undefined, true); }
      }); }
      S.item(c0 + CL / 2 - 60, (r) => { const dc = c0 + CL / 2 - 60; S.bx(dc, 46, 56, 14, 112, 36, 'col:#8a9098', undefined, true); S.bx(dc, 46, 100, 16, 6, 30, 'col:#9aa0a8', undefined, true); S.cyl(dc, 46, 112, 0.8, 20, 'col:#5a5e66', undefined, 6, 0.4, false); for (let j = 0; j < 9; j++) S.bx(dc - 7.2, 46, 20 + j * 10, 0.5, 2.2, 22, 'emis:#ffd890', undefined, false); lamp(S, dc, 46, 134, '#ff3a2a', 24); });
      foe(S, 'jet', d(0.55), 24, FL + 3.8, { name: 'CHASSEUR', hp: 2, armed: false, drift: 0, fixed: true, keep: true }); foe(S, 'jet', d(0.61), -24, FL + 3.8, { name: 'CHASSEUR', hp: 2, armed: false, drift: 0, fixed: true, keep: true }); foe(S, 'tug', d(0.58), 0, FL + 1.6, { name: 'TRACTEUR', path: 80, speed: 14, keep: true }); foe(S, 'aaturret', d(0.67), -20, FL + 2.5, { name: 'TOURELLE', armed: true, fixed: true, keep: true });
      // --- les récifs : des pitons de roche et des arches au-dessus de la mer, des oiseaux
      for (const [u, lx] of [[0.77, -52], [0.8, 56], [0.85, -50], [0.9, 54]]) S.item(d(u), (r) => stack(S, d(u), lx, 70 + r.between([0, 40]), r));
      for (const [u, lx] of [[0.82, 6], [0.88, -6]]) S.item(d(u), (r) => { const dc = d(u), s0 = sea(S, dc); for (const sg of [-1, 1]) stack(S, dc, lx + sg * 34, 56, r); for (let k = 0; k < 4; k++) rock(S, dc + r.between([-3, 3]), lx + (k - 1.5) * 20, s0 + 54, r.between([14, 20]), r); });
      foe(S, 'boat', d(0.79), 6, sea(S, d(0.79)) + 0.8, { name: 'VEDETTE', path: 110, speed: 18 }); foe(S, 'rib', d(0.86), -8, sea(S, d(0.86)) + 0.8, { name: 'CANOT', path: 100, speed: 20 }); foe(S, 'heli', d(0.92), 0, sea(S, d(0.92)) + 40, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -30, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 30, y), SS.at(dc - 22, 0, y + 6)], speed: 13 });
    } };

  // ===== LA TEMPETE (1000 m)
  const LT = 1000;
  SC.tempete = { len: [LT, LT], noDoor: true, noChaos: true, gw: 125, seabed: true, turns: [[0.1, 0.4, -16], [0.45, 0.8, 18]],
    pin: wpin((d, sc) => 26 + 6 * Math.sin(d / 55)), ground: (d, lx, c) => { c.set('#243c46'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      Z.oceanSurface(S, S.d0, S.d1, 140, 3.2);
      // trombes d'eau : des colonnes de brume qui tournent et glissent d'un bord à l'autre, des vagues déferlantes
      for (let i = 0; i < 6; i++) { const dc = d(0.12 + i * 0.13), lx0 = (i % 2 ? 1 : -1) * 30; S.item(dc, () => waterspout(S, dc, lx0, i)); }
      foe(S, 'destroyer', d(0.3), -52, sea(S, d(0.3)) + 9, { name: 'DESTROYER', hp: 3, armed: true, fixed: true, keep: true });
      S.item(d(0.55), () => { const dc = d(0.55); ship(S, dc, 54, 130, '#3a3a3a', { fire: true }); S.item(dc, () => {}); });
      S.item(d(0.7), () => { const dc = d(0.7); ship(S, dc, -54, 100, '#3a3a3a', { fire: true }); });
      foe(S, 'heli', d(0.38), 0, sea(S, d(0.38)) + 38, { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -34, y), SS.at(dc + 24, 0, y + 6), SS.at(dc, 34, y), SS.at(dc - 24, 0, y + 6)], speed: 14 });
      foe(S, 'aaturret', d(0.6), 52, sea(S, d(0.6)) + 8.6, { name: 'TOURELLE', armed: true, fixed: true, keep: true }); foe(S, 'boat', d(0.46), 6, sea(S, d(0.46)) + 1, { name: 'VEDETTE', path: 100, speed: 19 }); foe(S, 'hover', d(0.8), -4, sea(S, d(0.8)) + 1.6, { name: 'AEROGLISSEUR', path: 100, speed: 22 }); foe(S, 'jet', d(0.9), 0, sea(S, d(0.9)) + 26, { name: 'CHASSEUR', path: 150, speed: 34, keep: true });
      for (let i = 0; i < 10; i++) { const dc = d(0.04 + i * 0.09); S.item(dc, (r) => { const lx = (i % 2 ? -1 : 1) * r.between([26, 60]); for (let k = 0; k < 5; k++) S.bx(dc + k * 3, lx, sea(S, dc) + 1 + k, 6, 1.6, 3, 'col:#e8eef0', undefined, false); }); }
    } };
  function waterspout(S, dc, lx0, i) {
    const g = new T3.Group(), mat = new T3.MeshBasicMaterial({ color: '#8a96a0', transparent: true, opacity: 0.55, depthWrite: false, side: T3.DoubleSide, fog: true });
    const sy = sea(S, dc), c = new T3.Mesh(new T3.CylinderGeometry(22, 5, 130, 14, 4, true), mat); c.position.y = 65; g.add(c);
    const c2 = new T3.Mesh(new T3.CylinderGeometry(14, 3.4, 120, 12, 3, true), new T3.MeshBasicMaterial({ color: '#d8e4ee', transparent: true, opacity: 0.35, depthWrite: false, side: T3.DoubleSide })); c2.position.y = 62; g.add(c2);
    const spray = new T3.Mesh(new T3.CylinderGeometry(16, 20, 5, 14, 1, true), new T3.MeshBasicMaterial({ color: '#e8f2f8', transparent: true, opacity: 0.5, depthWrite: false, side: T3.DoubleSide })); spray.position.y = 2; g.add(spray);
    const col = EVO.colBox(g, 11, 124, 11, 0, 62, 0);
    const p = S.at(dc, lx0, sy); g.position.set(p[0], p[1], p[2]); S.b.root.add(g);
    EVO.addDyn(g, (t) => { c.rotation.y = t * 1.6 + i; c2.rotation.y = -t * 2.1; const sw = Math.sin(t * 0.22 + i * 1.7); const q = S.T.at(dc, lx0 + sw * 34, sy); g.position.set(q[0], q[1], q[2]); col.position.x = 0; spray.scale.setScalar(1 + 0.15 * Math.sin(t * 5)); }, [col], { near: 400 });
  }

  // ===== LA PLATEFORME (600 m) et L'INTERCEPTION (900 m)
  // la plateforme est à DROITE de la trajectoire (lx = +34) : on passe à gauche d'elle (lx = -40), on la voit s'allumer, puis on se cale derrière le missile qui monte
  const LP = 600, LA = 900, PX = 34, LANEX = -40;
  const laneI = (h) => 16 + 0.5 * Math.max(0, h) + 16 * ss(0, 200, h);   // altitude mondiale de la trajectoire derrière la plateforme (h = distance après la plateforme)
  const laneXI = (h) => LANEX * (1 - ss(40, 520, h));
  O.laneI = laneI;
  const dPlat = () => { const P = EVO.scenePos('plateforme'); return P ? P.d0 + 0.8 * P.len : 1e9; };
  SC.plateforme = { len: [LP, LP], noDoor: true, noChaos: true, gw: 125, seabed: true, turns: [],
    sub: [{ u: 0, key: 'plateforme', name: 'LA PLATEFORME' }],
    pin: (T, sc) => { const dP = sc.d0 + 0.8 * (sc.d1 - sc.d0); return { lx: 0, fx: (d) => (d < dP ? LANEX * ss(dP - 360, dP - 160, d) : laneXI(d - dP)), fy: (d) => (d < dP ? 16 + 3 * Math.sin(d / 50) : laneI(d - dP)) - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }; },
    ground: (d, lx, c) => { c.set('#243c46'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, dP = d(0.8), sy = sea(S, dP);
      Z.oceanSurface(S, S.d0, S.d1, 140, 2);
      for (let i = 0; i < 4; i++) { const dc = d(0.08 + i * 0.07); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 10, sea(S, dc) + 2.4, { name: 'MINE', keep: true }); }
      foe(S, 'destroyer', d(0.3), 52, sea(S, d(0.3)) + 9, { name: 'DESTROYER', hp: 3, armed: true, fixed: true, keep: true }); foe(S, 'boat', d(0.36), -6, sea(S, d(0.36)) + 1, { name: 'VEDETTE', path: 90, speed: 20, keep: true }); foe(S, 'heli', d(0.5), 0, sea(S, d(0.5)) + 40, { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -30, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 30, y), SS.at(dc - 22, 0, y + 6)], speed: 14 });
      S.item(dP, (r) => {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { S.cyl(dP + sz * 42, PX + sx * 42, sy - 40, 3.4, 80, 'col:#5a626c', undefined, 12, 3.6, true); for (let k = 0; k < 5; k++) S.bx(dP + sz * 42, PX + sx * 42, sy + 2 + k * 10, 8.6, 1.2, 8.6, 'col:#c8a028', undefined, false); }
        S.bx(dP, PX, sy + 28, 120, 6, 120, 'col:#5a626c', undefined, true); S.bx(dP, PX, sy + 31.2, 124, 1.4, 124, 'col:#c8a028', undefined, false);
        S.bx(dP - 38, PX - 38, sy + 40, 34, 20, 30, 'col:#2a2e34', undefined, true); S.bx(dP + 36, PX + 36, sy + 36, 28, 8, 34, 'col:#5a626c', undefined, true); S.cyl(dP - 38, PX - 38, sy + 50, 2, 22, 'col:#5a626c', undefined, 8, 2, false);
        for (let k = 0; k < 4; k++) S.bx(dP - 9 + (k % 2) * 18, PX - 9 + (k >> 1) * 18, sy + 66, 3, 72, 3, 'col:#5a626c', undefined, true); for (let j = 0; j < 7; j++) S.bx(dP, PX, sy + 38 + j * 9.5, 22, 1.6, 22, 'col:#c8a028', undefined, false);
        for (let k = 0; k < 8; k++) lamp(S, dP + (k - 3.5) * 14, PX + (k % 2 ? 1 : -1) * 56, sy + 34, k % 2 ? '#ff3a2a' : '#ffd890', 22);
        S.glow(dP, PX, sy + 70, '#ff3a2a', 30);
      });
      O.icbm(S, dP, sy);
      S.reserve(dP, PX, 130, 130);
      foe(S, 'aaturret', d(0.7), -62, sea(S, d(0.7)) + 8.6, { name: 'TOURELLE', armed: true, fixed: true, keep: true }); foe(S, 'aaturret', d(0.74), 30, sea(S, d(0.74)) + 8.6, { name: 'TOURELLE', armed: true, fixed: true, keep: true });
    } };
  // le missile balistique : il s'allume quand la fusée est à 400 m de la plateforme, monte à la verticale puis se cale SUR LA TRAJECTOIRE (la même que celle de la fusée) ;
  // sa vitesse suit celle de la fusée (60 %, jamais moins de 20 m/s) : on le rattrape toujours, mais il faut bien suivre
  O.icbm = (S, dP, sy) => {
    const G = new T3.Group(), body = lam('#eef0f4'), red = lam('#c8352a'), dk = lam('#2a2e34');
    const m = new T3.Group(); G.add(m);
    const cy = (rt, rb, h, mt, y) => { const o = new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, 18), mt); o.position.y = y; m.add(o); return o; };
    cy(5.2, 5.2, 66, body, 33); cy(0.4, 5.2, 24, body, 78); cy(0.4, 2.2, 6, red, 93); cy(5.3, 5.3, 6, red, 52); cy(5.3, 5.3, 2.4, dk, 3);
    for (let k = 0; k < 4; k++) { const f = mb(m, 1.2, 14, 9, body, Math.cos(k * 1.571) * 6.6, 8, Math.sin(k * 1.571) * 6.6); f.rotation.y = -k * 1.571; }
    const fl = new T3.Mesh(new T3.ConeGeometry(4.6, 40, 12, 1, true), new T3.MeshBasicMaterial({ color: '#ffb040', transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); fl.rotation.x = Math.PI; fl.position.y = -18; fl.visible = false; m.add(fl);
    m.position.y = -48;   // l'axe du groupe est au centre du missile (collision et orientation)
    const col = EVO.colBox(G, 24, 110, 24, 0, 0, 0);
    const p = S.at(dP, PX, sy + 34 + 48); G.position.set(p[0], p[1], p[2]); S.b.root.add(G);
    const st = { on: false, t: 0, h: 0, v: 0, done: false }, T = S.T, prev = new V().copy(G.position), _d = new V(), UP = new V(0, 1, 0);
    EVO.addDyn(G, (t, dt, g) => {
      const rk = g.rocket, run = g.endlessRun; if (!rk || !run || st.done) return;
      if (!st.on && g.state === 'FLIGHT' && run.dist > dP - 220) { st.on = true; g.audio.play('alarm'); g.audio.play('reactorHit'); g.audio.play('rumble'); g.rig.shake = Math.max(g.rig.shake, 1.2); g.flash = 0.5; g.flashColor = '#ffd0a0'; CC.L1.msg(g, '!', 1.4, '#ff6a50'); fl.visible = true; g.scene.add(G); }   // il quitte le tronçon du décor (qui sera détruit derrière la fusée)
      if (!st.on) return;
      st.t += dt; const vp = Math.max(30, rk.vel.length()), tgt = Math.max(20, Math.min(52, vp * 0.6)); st.v += Math.max(-14 * dt, Math.min(14 * dt, tgt * Math.min(1, st.t / 3) - st.v));
      if (st.t > 1.2) st.h += st.v * 0.95 * dt;
      const k = ss(1.0, 8.5, st.t), dd = dP + st.h, yl = k > 0.6 ? Math.max(70, Math.min(rk.pos.y + 24, Math.max(rk.pos.y - 24, laneI(st.h)))) : laneI(st.h); st.ys = st.ys === undefined ? yl : st.ys + (yl - st.ys) * Math.min(1, dt * 1.1);   // si la fusée a du retard, il reste à portée (+/- 24 m)
      const yw = (1 - k) * (34 + 48 + 7 * st.t * st.t) + k * st.ys, ln = (1 - k) * PX + k * T.laneX(dd), q = T.at(dd, ln, yw - T.base(dd));
      G.position.set(q[0], q[1], q[2]);
      _d.copy(G.position).sub(prev); if (_d.lengthSq() > 0.0004) { _d.normalize(); G.quaternion.slerp(new T3.Quaternion().setFromUnitVectors(UP, _d), 0.2); } prev.copy(G.position);
      fl.scale.set(1 + 0.15 * Math.random(), 1 + 0.4 * Math.random(), 1 + 0.15 * Math.random());
      if (Math.random() < 0.9) g.effects.sparks.emit({ pos: G.position.clone().addScaledVector(new V(0, -1, 0).applyQuaternion(G.quaternion), 50), vel: new V(rr(-1, 1), rr(-1, 0), rr(-1, 1)).multiplyScalar(rr(6, 22)), life: rr(0.6, 1.8), s0: 3, s1: 7, s2: 1, cols: g.effects.pal.ember, drag: 1.2, grav: 2, a: 0.9, fout: 0.5 });
      if (st.h > 1100) { st.done = true; G.visible = false; }
    }, [col], { near: 99999, span: 99999, hit: (g, dd) => { if (st.done || !st.on) return false; st.done = true; G.visible = false; O.icbmDie(g, G.position.clone()); return true; } });
  };
  O.icbmDie = (g, p) => {
    const fx = g.effects; for (let i = 0; i < 9; i++) setTimeout(() => { try { fx.explosion(p.clone().add(new V(rr(-26, 26), rr(-40, 40), rr(-26, 26))), null, true, i % 2 ? 'cyan' : 'orange'); g.audio.play('boom', p); g.audio.play('boomSmall', p); g.rig.shake = 1.5; } catch (e) { /* ignoré */ } }, i * 130);
    g.hitStop = 0.9; g.hitScale = 0.25; g.chromaBurst = 0.04; g.flash = 0.7; g.flashColor = '#ffffff'; if (EVO.coinBurst) EVO.coinBurst(g, p, 60);
    EVO.finishRun(g);
  };
  SC.ascension = { len: [LA, LA], noDoor: true, noChaos: true, gw: 125, seabed: true, turns: [],
    sub: [{ u: 0, key: 'ascension', name: 'L INTERCEPTION' }],
    pin: (T, sc) => { const dP = dPlat(); return { lx: 0, fx: (d) => laneXI(d - dP), fy: (d) => laneI(d - dP) - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }; },
    ground: (d, lx, c) => { c.set('#243c46'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      Z.oceanSurface(S, S.d0, S.d0 + 140, 140, 2);
      // des cellules d'orage (colonnes sombres) et des anneaux de nuages à traverser
      for (let i = 0; i < 9; i++) { const dc = d(0.12 + i * 0.09), y = laneI(dc - dPlat()); S.item(dc, () => cloudRing(S, dc, y, i)); }
      for (let i = 0; i < 6; i++) { const dc = d(0.2 + i * 0.12); foe(S, 'jet', dc, S.T.laneX(dc) + (i % 2 ? 1 : -1) * 22, yrel(S, dc, laneI(dc - dPlat()) + 4), { name: 'CHASSEUR', path: 120, speed: 38, keep: i < 3 }); }
    } };
  function cloudRing(S, dc, yw, i) {
    const g = new T3.Group(); const lx = S.T.laneX(dc);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, o = new T3.Mesh(new T3.SphereGeometry(rr(9, 15), 8, 6), new T3.MeshBasicMaterial({ color: i % 2 ? '#4a5260' : '#6a7480', transparent: true, opacity: 0.8, fog: true })); o.position.set(Math.cos(a) * 34, Math.sin(a) * 34, rr(-6, 6)); g.add(o); }
    const p = S.at(dc, lx, yrel(S, dc, yw)); g.position.set(p[0], p[1], p[2]); g.rotation.y = CC.U.deg ? 0 : 0; const q = S.T.at(dc - 6, lx, yrel(S, dc - 6, yw)); g.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]); S.b.root.add(g);
    const cols = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; cols.push(EVO.colBox(g, 22, 22, 18, Math.cos(a) * 34, Math.sin(a) * 34, 0)); }
    EVO.addDyn(g, (t) => { g.rotation.z = t * 0.12 * (i % 2 ? 1 : -1); }, cols, { near: 500 });
  }
})();
