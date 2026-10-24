/* v240 : NIVEAU 2 — « OPERATION POSEIDON », actes 1 et 2 : LA COTE (plateau de lancement militaire, rampe INCLINEE vers le bas : le propulseur pousse la fusee dans un long conduit qui plonge dans la mer)
 * puis LE BASSIN (base sous-marine inondee : sous-marins en cale seche, portiques, torpilles, chaines de mines, DEUX VOIES qui se separent puis se rejoignent, sas etanche ouvert sur la haute mer).
 * Les scenes se posent avec les memes outils que le reste du niveau 2 (zones_ocean.js) : le sol suit relief(), la fusee suit pin(). */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, O = EVO && EVO.oc;
  if (!EVO || !EVO.on || !O || !Z.defs.ocean) return;
  const { yrel, wpin, pk, rr, ss, lam, basic, mb } = O, TR = CC.Trees, OC = Z.defs.ocean, SC = OC.scenes;
  const LC = 340, LB = 520, SEAB = -90;
  // sol de la cote (monde) : plateau a +40 derriere la rampe (le hangar est a d = -40), puis pente DROITE a -19 degres qui commence a d = -50, sous le hangar (le tir passe a plus de 4 m au-dessus du sol), puis plancher a -60
  const SL = 0.344, FLOOR = -60;
  const gAt = (d) => { const s = 40 - SL * Math.max(0, d + 50) - FLOOR; return FLOOR + (s < 0 ? 0 : s < 6 ? s * s / 12 : s - 3); };
  const GW = (u) => gAt(u * LC);
  EVO.preRel = (d) => (EVO.seaLevel !== undefined && d <= 0 ? gAt(d) - SEAB : 0);   // le plateau de depart existe aussi avant la premiere scene (la rampe est a d = -40)
  // --- depart du niveau 2 : sur la falaise, rampe inclinee vers le bas
  EVO.launchY = () => 40.9;
  EVO.padPitch = () => (EVO.isS2() ? -19 : null);
  const SGN = 1;
  // boite posee sur la pente : inclinee comme le sol (tilt = angle du sol sous la boite)
  const slab = (S, dc, lx, y, w, h, dd, mat, tint, collide, extra) => {
    if (!S.inClip(dc)) return null; const T = S.T, a = Math.atan2(T.base(dc + 4) - T.base(dc - 4), 8) * 180 / Math.PI;
    return S.b.box(Object.assign({ p: T.at(dc, lx, y), s: [w, h, dd], r: [-SGN * a, S.yaw(dc), 0], mat, tint, collide: collide !== false }, extra || {}));
  };
  const lampS = (S, dc, lx, y, col, size) => { S.bx(dc, lx, y, 1.2, 0.4, 1.2, 'emis:' + col, undefined, false); S.glow(dc, lx, y, col, size || 10); };

  // ============================================ LA COTE (340 m) ============================================
  SC.cote = { len: [LC, LC], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'cote', name: 'LA COTE' }, { u: 0.3, key: 'conduit', name: 'LE CONDUIT' }],
    pin: wpin((d, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return GW(u) + 8; }),
    relief(T, sc) { let lo = 1e9, hi = -1e9; const fn = (d) => { const u = U.clamp((d - sc.d0) / (sc.d1 - sc.d0), 0, 1); return GW(u) - SEAB; }; for (let d = sc.d0; d <= sc.d1; d += 4) { const v = fn(d); lo = Math.min(lo, v); hi = Math.max(hi, v); } sc.rlo = lo; sc.rhi = hi; return { fn, max: Math.max(Math.abs(lo), Math.abs(hi)) }; },
    ground: (d, lx, c, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0), base = new T3.Color('#5f6a74'), rock = new T3.Color('#4a5560'), wet = new T3.Color('#2a4452'); c.copy(base).lerp(rock, ss(0.1, 0.35, u)).lerp(wet, ss(0.55, 0.95, u)); c.multiplyScalar(0.95 + 0.06 * Math.sin(lx * 0.3 + d * 0.11) * Math.sin(d * 0.21 - lx * 0.09)); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      Z.oceanSurface(S, S.d0, S.d1, 140, 0.8);
      // --- plateau : dalle de beton, hangars, reservoirs, mat radar qui tourne, projecteurs
      
      for (const [u, sg] of [[0.03, -1], [0.09, 1], [0.14, -1]]) S.item(d(u), (r) => { const dc = d(u), lx = sg * r.between([46, 52]); S.bx(dc, lx, 8, 26, 16, 34, 'col:#6f7c70', undefined, true); S.bx(dc, lx - sg * 13.2, 6, 0.8, 11, 20, 'col:#2a2e34', undefined, false); S.bx(dc, lx, 16.4, 27, 1.2, 35, 'col:#5a6660', undefined, false); lampS(S, dc, lx - sg * 13.4, 13.5, '#ffd9a0', 22); });
      for (const [u, sg] of [[0.0, 1], [0.05, 1], [0.1, 1]]) S.item(d(u), () => { const dc = d(u), lx = sg * 40; S.cyl(dc, lx, 0, 5.5, 11, 'col:#9aa3ab', undefined, 12, 5.5, true); S.cyl(dc, lx, 11, 5.8, 1.2, 'col:#6c747c', undefined, 12, 4, false); });
      S.item(d(0.16), () => {   // radar : mat + antenne tournante
        const dc = d(0.16), lx = -34; S.cyl(dc, lx, 0, 0.9, 22, 'col:#8a929a', undefined, 8, 0.7, true); const g = new T3.Group(), m = lam('#c9d0d6'); mb(g, 22, 1.2, 1.2, m, 0, 0, 0); mb(g, 20, 6, 0.6, m, 0, 3.4, 0); mb(g, 2.4, 2.4, 2.4, lam('#5a636c'), 0, -1.4, 0);
        EVO.placeGroup(S, g, dc, lx, 25, 0); EVO.addDyn(g, (t) => { g.rotation.y = t * 1.3; }, [], { near: 500 }); S.glow(dc, lx, 28, '#ff5a3a', 8); });
      for (let k = 0; k < 6; k++) S.item(d(0.0 + k * 0.035), () => { const dc = d(0.0 + k * 0.035), sg = k % 2 ? 1 : -1; S.cyl(dc, sg * 33, 0, 0.5, 14, 'col:#555d66', undefined, 6, 0.4, true); lampS(S, dc, sg * 33, 14.5, '#fff1c8', 26); });
      foe(S, 'aaturret', d(0.17), 20, 0, { name: 'TOURELLE', armed: true, fixed: true, keep: true });
      foe(S, 'heli', d(0.15), 0, 22, { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 24, 0, y + 4), SS.at(dc, 26, y), SS.at(dc - 24, 0, y + 4)], speed: 13 });
      // --- le CONDUIT : un tunnel de lancement incline, qui descend vers la mer ; il est PAR DESSUS le sol (le sol est son plancher)
      const U0 = 0.15, N = Math.floor((1 - U0) * L / 8);
      for (let k = 0; k <= N; k++) {
        const dc = d(U0) + k * 8, u = (dc - S.d0) / L;
        S.item(dc, () => {
          const lx = S.lane(dc).lx, half = 21.5, top = 23.5;
          for (const sg of [-1, 1]) slab(S, dc, lx + sg * half, 12, 3, 28, 8.6, 'col:#59656f', undefined, true);
          slab(S, dc, lx, top, 46, 3, 8.6, 'col:#4a5560', undefined, true);
          if (k % 2 === 0) { for (const sg of [-1, 1]) { lampS(S, dc, lx + sg * (half - 2), 12, k % 6 === 0 ? '#ff9a3a' : '#7be8ff', 11); } slab(S, dc, lx, top - 1.9, 40, 0.5, 1.2, 'emis:#e8f4ff', undefined, false); }
          if (k % 4 === 0) { slab(S, dc, lx, top - 1, 44, 1.6, 1.4, 'col:#c9a028', undefined, false); for (const sg of [-1, 1]) slab(S, dc, lx + sg * (half - 1.8), 11, 1.2, 22, 1.4, 'col:#c9a028', undefined, false); }
          if (u > 0.55) { slab(S, dc, lx, 0.25, 28, 0.4, 7, 'col:#3a5a70', undefined, false, { render: u > 0.62 }); }
        });
      }
      for (let dc = d(0.04); dc < d(0.15); dc += 8) S.item(dc, () => {
        const lx = S.lane(dc).lx, k = Math.round((dc - d(0.04)) / 8);
        slab(S, dc, lx, 0.12, 26, 0.24, 8.6, 'col:#707882', undefined, false);
        for (const sg of [-1, 1]) slab(S, dc, lx + sg * 12.4, 0.3, 1.2, 0.1, 8.6, 'emis:#ffd23a', undefined, false);
        slab(S, dc, lx, 0.3, 8, 0.1, 1.4, 'emis:#ff9a3a', undefined, false, { render: k % 2 === 0 });
        if (k > 0) { slab(S, dc, lx - 3, 0.3, 6, 0.1, 0.9, 'emis:#ff9a3a', undefined, false); slab(S, dc, lx + 3, 0.3, 6, 0.1, 0.9, 'emis:#ff9a3a', undefined, false); }
      });
      // portail d'entree du conduit : deux piliers, un linteau marque de bandes de danger
      S.item(d(U0), () => { const dc = d(U0) - 4, lx = S.lane(dc).lx; for (const sg of [-1, 1]) slab(S, dc, lx + sg * 25, 15, 6, 34, 6, 'col:#6f7c88', undefined, true); slab(S, dc, lx, 31, 56, 6, 6, 'col:#59656f', undefined, true); slab(S, dc - 3.2, lx, 27.6, 50, 1.2, 0.8, 'emis:#ff9a3a', undefined, false); S.glow(dc, lx, 24, '#ffb060', 90); });
      foe(S, 'aaturret', d(0.4), -16, 0, { name: 'TOURELLE', armed: true, fixed: true, keep: true }); foe(S, 'aaturret', d(0.62), 16, 0, { name: 'TOURELLE', armed: true, fixed: true, keep: true });
    } };

  // ============================================ LE BASSIN (520 m) ============================================
  const HW = 64, CEIL = 22, PART = [0.36, 0.8];
  SC.bassin = { len: [LB, LB], noDoor: true, noChaos: true, seabed: true, gw: 125,
    sub: [{ u: 0, key: 'bassin', name: 'LE BASSIN' }, { u: 0.34, key: 'fourche', name: 'LA FOURCHE' }, { u: 0.84, key: 'sas', name: 'LE SAS' }],
    pin: wpin((d, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -52 + 17 * ss(0, 0.3, u) + 5 * ss(0.85, 1, u); }),
    relief(T, sc) { const fn = (d) => { const u = U.clamp((d - sc.d0) / (sc.d1 - sc.d0), 0, 1); return 30 * (1 - ss(0, 0.25, u)); }; sc.rlo = 0; sc.rhi = 30; return { fn, max: 30 }; },
    ground: (d, lx, c) => { c.set('#53606a'); c.multiplyScalar(0.94 + 0.08 * Math.sin(lx * 0.4 + d * 0.13) * Math.sin(d * 0.23 - lx * 0.12)); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T, cy = (dc) => yrel(S, dc, CEIL);
      Z.oceanSurface(S, S.d0, S.d1, 140, 0.5);
      // coque du bassin : murs lateraux, plafond a rails lumineux, nervures
      for (let dc = S.d0 + 4; dc < S.d1 - 40; dc += 20) S.item(dc, (r) => {
        const lx = S.lane(dc).lx, c = cy(dc), u = (dc - S.d0) / L;
        for (const sg of [-1, 1]) { S.bx(dc, lx + sg * (HW + 2), (c - 4) / 2 + 1, 4, c + 10, 20.4, 'col:#6a7a87', undefined, true); S.bx(dc, lx + sg * (HW - 1.4), (c - 4) / 2 + 1, 3, c + 8, 3, 'col:#8795a2', undefined, true); S.bx(dc, lx + sg * (HW - 0.5), 10, 1.4, 1.6, 18, 'emis:#7be8ff', undefined, false); S.bx(dc, lx + sg * (HW - 0.5), 34, 1.4, 1.6, 18, 'emis:#7be8ff', undefined, false); }
        S.bx(dc, lx, c + 1.5, HW * 2 + 8, 3, 20.4, 'col:#3a4651', undefined, true); S.bx(dc, lx, c - 0.5, HW * 2 - 6, 0.6, 3, 'emis:#e8f4ff', undefined, false);
        if (u > 0.04 && u < 0.78) S.bx(dc, lx, c - 5, HW * 2 - 4, 2.2, 3, 'col:#b9a24a', undefined, false);   // portique (rail de pont roulant)
        S.glow(dc, lx, c - 2, '#cfeaff', 60);
        for (const sg of [-1, 1]) { S.bx(dc, lx + sg * 22, 0.5, 0.9, 0.5, 2.4, 'emis:#ffb347', undefined, false); S.glow(dc, lx + sg * 22, 1.2, '#ffb347', 9); }
      });
      S.item(d(0.015), () => { const dc = d(0.015), lx = S.lane(dc).lx, c = cy(dc); for (const sg of [-1, 1]) { S.bx(dc, lx + sg * 40, (c + 10) / 2 - 4, 36, c + 18, 6, 'col:#59656f', undefined, true); S.bx(dc - 3.2, lx + sg * 21.8, 20, 2, 40, 1.2, 'hazard', undefined, false); } S.bx(dc, lx, c + 3, 46, 8, 6, 'col:#59656f', undefined, true); for (let k = 0; k < 6; k++) S.bx(dc - 3.4, lx - 17 + k * 6.8, c - 2, 2.6, 0.7, 0.7, 'emis:#ff9a3a', undefined, false); S.glow(dc, lx, c - 3, '#ffb060', 90); });
      // sous-marins en cale seche, le long des murs : coques longues sur berceaux, tours, helices
      const dockSub = (u, lx, sc, v) => S.item(d(u), () => {
        const dc = d(u), y = yrel(S, dc, -80), len = 13.7 * sc, m = CC.BossModels.sub(4, v); m.scale.setScalar(sc); EVO.placeGroup(S, m, dc, lx, y, Math.PI);
        S.b.box({ p: T.at(dc, lx, y + 1.7 * sc), s: [4.4 * sc, 4.6 * sc, len * 0.95], r: [0, S.yaw(dc), 0], render: false, collide: true });
        for (const k of [-0.32, 0, 0.32]) { S.bx(dc + k * len, lx, 3, 2.2 * sc, 6, 2, 'col:#8a97a2', undefined, true); S.bx(dc + k * len, lx, 0.8, 3.4 * sc, 1.6, 3, 'col:#c9a028', undefined, false); }
        S.glow(dc, lx, y + 3 * sc, '#cfeaff', 36);
      });
      dockSub(0.1, -44, 5.2, 1); dockSub(0.2, 44, 5.6, 0); dockSub(0.52, -48, 5, 2); dockSub(0.66, 48, 5.4, 1);
      // grues : portiques qui enjambent le bassin
      for (const u of [0.07, 0.17, 0.46]) S.item(d(u), (r) => { const dc = d(u), c = cy(dc); for (const sg of [-1, 1]) S.bx(dc, sg * (HW - 6), (c - 4) / 2, 3, c, 3, 'col:#c9a028', undefined, true); S.bx(dc, 0, c - 2, HW * 2 - 8, 3, 4, 'col:#c9a028', undefined, true); S.bx(dc, 8, c - 8, 1, 12, 1, 'col:#555e66', undefined, false); S.bx(dc, 8, c - 14.5, 3, 2, 3, 'col:#222a30', undefined, false); });
      // torpilles sur chariots, caisses, projecteurs, mines suspendues
      for (let i = 0; i < 14; i++) { const u = 0.04 + i * 0.05, dc = d(u), sg = i % 2 ? 1 : -1; S.item(dc, (r) => { const lx = sg * r.between([54, 60]), y0 = yrel(S, dc, -86); for (let k = 0; k < 3; k++) S.cyl(dc + k * 2.2, lx, y0 + 1.8, 0.9, 11, 'col:' + pk(r, ['#8a98a4', '#6c7a86']), undefined, 8, 0.9, false); S.bx(dc, lx, y0 + 0.6, 8, 1.2, 12, 'col:#3a444c', undefined, true); }); }
      for (let i = 0; i < 9; i++) { const dc = d(0.1 + i * 0.09); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 14, yrel(S, dc, -42 - (i % 3) * 5), { name: 'MINE', keep: i < 3 }); }
      // ===== LA FOURCHE : un mur central separe le bassin en deux voies ; a gauche le tunnel des torpilles (etroit, arme), a droite la grande cale (large, epave)
      const p0 = d(PART[0]), p1 = d(PART[1]);
      for (let dc = p0; dc < p1; dc += 20) S.item(dc, () => {
        const lx0 = S.lane(dc).lx, c = cy(dc);
        S.bx(dc, lx0, (c - 4) / 2 + 2, 8, c + 8, 20.4, 'col:#4b5963', undefined, true);                       // mur central
        S.bx(dc, lx0 - 30, (c - 4) / 2 + 2, 4, c + 8, 20.4, 'col:#4b5963', undefined, true);                  // mur du tunnel de gauche (voie etroite)
        S.bx(dc, lx0 - 5.2, 20, 0.5, 1.4, 18, 'emis:#ff9a3a', undefined, false); S.bx(dc, lx0 - 25, 20, 0.5, 1.4, 18, 'emis:#ff9a3a', undefined, false);
        S.bx(dc, lx0 + 5.2, 20, 0.5, 1.4, 18, 'emis:#7be8ff', undefined, false);
      });
      // panneaux d'entree des deux voies : chevrons orange a gauche, cyan a droite
      S.item(d(0.3), () => { const dc = d(0.3), lx = S.lane(dc).lx, c = cy(dc); for (let k = 0; k < 3; k++) { S.bx(dc + k * 4, lx - 18, c - 10, 12, 1.4, 1, 'emis:#ff9a3a', undefined, false); S.bx(dc + k * 4, lx + 22, c - 10, 12, 1.4, 1, 'emis:#7be8ff', undefined, false); } S.glow(dc, lx - 18, c - 10, '#ff9a3a', 60); S.glow(dc, lx + 22, c - 10, '#7be8ff', 60); });
      for (let u = 0.36; u < 0.82; u += 0.02) { const dc = d(u); S.item(dc, () => { const lx0 = S.lane(dc).lx; S.bx(dc, lx0 - 17, 0.3, 3.4, 0.3, 9, 'emis:#ff9a3a', undefined, false); S.bx(dc, lx0 + 22, 0.3, 3.4, 0.3, 9, 'emis:#7be8ff', undefined, false); }); }
      // voie de gauche : tourelles et mines rapprochees (plus de combats, plus de pieces)
      for (let i = 0; i < 4; i++) { const dc = d(0.42 + i * 0.09); foe(S, 'mine', dc, -17, yrel(S, dc, -44 - (i % 2) * 6), { name: 'MINE', keep: true }); }
      foe(S, 'sub', d(0.5), -17, yrel(S, d(0.5), -52), { name: 'SOUS-MARIN', hp: 2, armed: true, keep: true }); foe(S, 'sub', d(0.68), -17, yrel(S, d(0.68), -48), { name: 'SOUS-MARIN', hp: 2, armed: true, keep: true });
      // voie de droite : la grande cale, une epave de porte-avions eventree, un seul garde
      S.item(d(0.55), (r) => { const dc = d(0.55), lx = 38; S.bxr(dc, lx, yrel(S, dc, -64), 20, 12, 56, 'col:#3a3a38', undefined, 12, 8, true); S.bxr(dc + 10, lx + 6, yrel(S, dc, -56), 8, 8, 24, 'col:#4a4640', undefined, 12, 8, true); for (let k = 0; k < 6; k++) S.glow(dc + (k - 2.5) * 8, lx, yrel(S, dc, -60), '#7affc8', 8); });
      foe(S, 'sub', d(0.6), 28, yrel(S, d(0.6), -42), { name: 'SOUS-MARIN', hp: 3, armed: true, keep: true });
      // ===== LE SAS : une grande porte etanche, ouverte ; la lumiere de la haute mer au bout
      S.item(d(0.9), () => {
        const dc = d(0.9), lx = S.lane(dc).lx, c = cy(dc);
        for (const sg of [-1, 1]) { S.bx(dc, lx + sg * 40, (c - 4) / 2 + 1, 36, c + 8, 14, 'col:#59656f', undefined, true); S.bx(dc - 6, lx + sg * 21.4, (c - 4) / 2 + 1, 2.2, c + 4, 4, 'col:#c9a028', undefined, true); S.bx(dc, lx + sg * 21.4, c * 0.5, 0.8, c * 0.9, 0.8, 'hazard', undefined, false); }
        S.bx(dc, lx, c + 2, 60, 6, 14, 'col:#59656f', undefined, true); for (let k = 0; k < 6; k++) S.bx(dc - 7.4, lx - 22 + k * 8.8, c - 1.2, 3, 0.8, 0.8, 'emis:#6aff9a', undefined, false);
        S.glow(dc, lx, yrel(S, dc, -34), '#9fe8ff', 120);
      });
      for (let k = 0; k < 8; k++) S.item(d(0.93 + k * 0.007), () => { const dc = d(0.93 + k * 0.007), lx = (k % 2 ? 1 : -1) * 22; S.bx(dc, lx, yrel(S, dc, -34), 1, 22, 1, 'emis:#9fe8ff', undefined, false); });
    } };

  O.slab = slab; O.lampS = lampS;
})();
