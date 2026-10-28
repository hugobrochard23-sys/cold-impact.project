/* v287 : NIVEAU 2, ZONE 3 — « LE DELTA » puis « LE PORT » : le fleuve s'ouvre en delta (bras separes par des iles de mangrove, ponts bas a passer dessous ou dessus, virages), puis le port
 * militaire (quais, grues, entrepots, jetees en quinconce, cargos amarres, portique d'entree) ; l'eau est a -112 partout. Meme convention de cotes absolues que zones_river.js. */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, TR = CC.Trees, R = EVO && EVO.riv;
  if (!R || !Z.evoFoe) return;
  const SC = Z.defs.ocean.scenes, { pk, ss } = EVO.oc;
  const { WY, LA, LB, A, absAt, plant, slab, lampS, water, hsh, GREEN, WALL, STONE, rel, mixf } = R;
  const OUT = 150, D3 = LA + LB, LD = 800, LP = 700, D4 = D3 + LD + LP;
  const WYS = -112, SEAB = R.SEAB;
  R.D3 = D3; R.D4 = D4; R.LD = LD; R.LP = LP;
  // lit des zones 3 et 4 (la partie profonde est definie dans zones_river4) : delta et port = 24 a 32 m de fond
  const shallow = (d) => WYS - (24 + 5 * Math.sin(d / 53) + 3 * Math.sin(d / 17));
  R.shallow = shallow;
  let deep = null; R.setDeep = (f) => { deep = f; };
  const w2 = (d) => -112 - (26 + 3 * Math.sin(d / 41));
  R.setBed3((d) => (d >= D4 && deep ? deep(d) : mixf(w2(d), shallow(d), ss(D3, D3 + 60, d))));
  const BED = R.BED;
  for (const [k, m, a] of [['delta', 'sea', 'evoDay'], ['mangrove', 'sea', 'evoDay'], ['havre', 'sea', 'evoDusk'], ['quais', 'sea', 'evoDusk'], ['rade', 'sea', 'evoDusk']]) { EVO.SCENE_MOOD[k] = m; EVO.SCENE_AUDIO[k] = a; }
  const HWd = (u) => 46 + 6 * Math.sin(u / 61), HWp = (u) => 50 + 4 * Math.sin(u / 47) + 18 * ss(LP - 160, LP - 20, u);
  const fl = (S, dc, y) => A(S, dc, y);
  const lamC = (c) => new T3.MeshLambertMaterial({ color: c });
  const col = (S, dc, lx, y, w, h, dd, tint, collide) => S.bx(dc, lx, y, w, h, dd, 'col:' + tint, undefined, collide);

  // pont : tablier + piles espacees (on passe entre les piles, ou on saute par-dessus)
  function bridge(S, dc, hwv, deck, piers, r, big) {
    const span = 2 * (hwv + 12), th = big ? 4.4 : 3, bed = BED(dc);
    S.bx(dc, 0, fl(S, dc, deck), span, th, big ? 16 : 11, 'concrete', '#a4a6a2', true); S.bx(dc, 0, fl(S, dc, deck + th / 2 + 0.4), span, 0.7, big ? 16.4 : 11.4, 'asphalt', '#46484c', false);
    for (const sg of [-1, 1]) S.bx(dc + sg * (big ? 7.4 : 5), 0, fl(S, dc, deck + th / 2 + 1.1), span, 1.4, 0.5, 'concrete', '#c0c4c6', true);
    for (const x of piers) { S.bx(dc, x, fl(S, dc, (bed + deck) / 2), 3.8, deck - bed, big ? 11 : 7, 'concrete', '#8e908c', true); S.bx(dc, x, fl(S, dc, deck - th / 2 - 0.6), 5.4, 1.2, big ? 12 : 8, 'concrete', '#7e807c', false); }
    for (let k = -4; k <= 4; k++) lampS(S, dc - 6, k * (span / 9), fl(S, dc, deck + th / 2) + 5, '#fff1c8', 14);
  }
  // grue de quai : portique rouge a quatre pieds, fleche
  function crane(S, dc, lx, r) {
    const y0 = fl(S, dc, WYS + 6.5), sg = lx > 0 ? 1 : -1;
    for (const a of [-1, 1]) for (const b of [-1, 1]) S.bx(dc + a * 6, lx + b * 4.6, y0 + 15, 1.3, 30, 1.3, 'metal', '#c8362a', true);
    S.bx(dc, lx, y0 + 30.4, 11, 1.6, 15, 'metal', '#b02a20', true); S.bx(dc, lx - sg * 14, y0 + 33, 40, 1.8, 2, 'metal', '#d8402c', true); S.bx(dc, lx - sg * 35, y0 + 32, 2.4, 6, 2.4, 'metal', '#8a2a20', false);
    S.bx(dc, lx + sg * 12, y0 + 26, 1.2, 1.2, 1.2, 'emis:#ffcf40', undefined, false); lampS(S, dc, lx, y0 + 35.4, '#ff3a2a', 14);
  }
  // piles de conteneurs
  function stacks(S, dc, lx, n, r) {
    const cs = ['#c8362a', '#2a6ab8', '#d8a828', '#3a8a4a', '#8a5a2a', '#b8b8b0'];
    for (let i = 0; i < n; i++) { const hh = 1 + Math.floor(r() * 3); for (let k = 0; k < hh; k++) col(S, dc + (i % 3) * 3.1, lx + Math.floor(i / 3) * 6.4, fl(S, dc, WYS + 6.5) + 1.3 + k * 2.6, 6, 2.6, 2.5, cs[Math.floor(r() * cs.length)], true); }
  }
  // cargo amarre le long d'une rive : coque, proue, pont, cheminee
  function cargo(S, dc, lx, len, r) {
    const sg = lx > 0 ? 1 : -1, bot = WYS - 8, top = WYS + 8, mid = (bot + top) / 2, w = 17;
    S.bx(dc, lx, fl(S, dc, mid), w, top - bot, len, 'metal', '#3a3e46', true); S.bx(dc, lx, fl(S, dc, WYS + 1), w + 0.6, 1.8, len + 0.6, 'col:#c8362a', undefined, false);
    S.bx(dc - len / 2 - 3, lx, fl(S, dc, mid), w - 6, top - bot, 8, 'metal', '#3a3e46', true);
    S.bx(dc + len * 0.34, lx, fl(S, dc, top + 7), w - 4, 14, 18, 'metal', '#d8dadc', true); S.bx(dc + len * 0.34, lx, fl(S, dc, top + 15.5), w - 6, 3, 14, 'metal', '#8a8e94', false); S.cyl(dc + len * 0.4, lx, fl(S, dc, top + 14), 2.6, 9, 'metal', '#c8362a', 10, 2.2, true);
    for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) col(S, dc - len * 0.22 + k * 6.4, lx + (j - 1) * 4.6, fl(S, dc, top) + 1.3, 3.4, 2.6, 6, ['#c8362a', '#2a6ab8', '#d8a828', '#3a8a4a'][(k + j) % 4], true);
    lampS(S, dc + len * 0.34, lx, fl(S, dc, top + 17.5), '#ff3a2a', 14);
  }

  // ============================================== LE DELTA ==============================================
  SC.delta = { len: [LD, LD], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'delta', name: 'LE DELTA' }, { u: 0.55, key: 'mangrove', name: 'LA MANGROVE' }],
    turns: [[0.1, 0.24, -38], [0.34, 0.46, 34], [0.58, 0.72, -42], [0.78, 0.9, 30]],
    pin: (T, sc) => ({ lx: 0, fy: (d) => WYS - 5 - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => BED(d) - SEAB); },
    ground: (d, lx, c) => { c.set('#6a5c3e').lerp(new T3.Color('#4f7a3c'), 0.45 + 0.4 * Math.sin(d * 0.04 + lx * 0.06)); c.multiplyScalar(0.8 + 0.1 * Math.sin(lx * 0.2 + d * 0.11)); },
    build(S) {
      const d0 = S.d0, d = (u) => d0 + u;
      water(S, d0, d0 + LD, 80, WYS);
      // rives de mangrove : parois de roche basses, racines, roseaux, palmiers
      for (let u = 6; u < LD - 6; u += 14) S.item(d(u), (r) => {
        const dc = d(u);
        for (const sg of [-1, 1]) {
          const hwv = HWd(u) + r.between([-1.2, 2]), top = WYS + 9 + 3 * Math.sin(dc / 41 + sg), bed = BED(dc), wd = OUT - hwv;
          S.bx(dc, sg * (hwv + wd / 2), fl(S, dc, (bed - 6 + top) / 2), wd, top - bed + 6, 18, 'jrock', pk(r, WALL), true); S.bx(dc, sg * (hwv + wd / 2), fl(S, dc, top + 0.25), wd, 0.5, 18, 'evoGrass', pk(r, GREEN), true);
          for (let k = 0; k < 3; k++) S.cyl(dc + r.between([-6, 6]), sg * (hwv - r.between([0.2, 2.6])), fl(S, dc, WYS - 1), 0.28, r.between([2.4, 4.4]), 'bark', '#4a3820', 5, 0.18, false);
          if (r() < 0.7) plant(S, TR.reeds, dc + r.between([-5, 5]), sg * (hwv - r.between([0.4, 2.6])), WYS - 0.3, r.between([1.6, 2.8]), r);
          if (r() < 0.6) plant(S, TR.palm, dc + r.between([-5, 5]), sg * (hwv + r.between([2, 9])), top + 0.2, r.between([9, 15]), r, {});
          if (r() < 0.45) plant(S, TR.jungle, dc + r.between([-5, 5]), sg * (hwv + r.between([10, 40])), top + 0.2, r.between([20, 32]), r, {});
          if (r() < 0.6) plant(S, r() < 0.5 ? TR.fern : TR.bigleaf, dc + r.between([-6, 6]), sg * (hwv + r.between([0.8, 20])), top + 0.2, r.between([1.6, 2.8]), r);
        }
      });
      // les iles : blocs de roche couronnes de palmiers qui separent le fleuve en deux bras
      for (const [u, lx, w, dd] of [[110, -16, 20, 40], [250, 18, 22, 46], [330, -14, 18, 34], [470, 16, 22, 50], [600, -18, 20, 40], [700, 12, 20, 44], [760, -12, 16, 30]]) S.item(d(u), (r) => {
        const dc = d(u), top = WYS + 5 + r.between([0, 4]), bed = BED(dc);
        S.bx(dc, lx, fl(S, dc, (bed + top) / 2), w, top - bed, dd, 'jrock', pk(r, WALL), true); S.bx(dc, lx, fl(S, dc, top + 0.25), w + 0.4, 0.5, dd + 0.4, 'evoGrass', pk(r, GREEN), true);
        for (let k = 0; k < 3; k++) plant(S, TR.palm, dc + r.between([-dd / 3, dd / 3]), lx + r.between([-w / 3, w / 3]), top + 0.4, r.between([8, 13]), r, {});
        for (let k = 0; k < 4; k++) plant(S, TR.fern, dc + r.between([-dd / 3, dd / 3]), lx + r.between([-w / 3, w / 3]), top + 0.4, r.between([1.4, 2.4]), r);
        S.cyl(dc - dd / 2 - 1, lx + r.between([-5, 5]), fl(S, dc, WYS - 1), 0.3, 4, 'bark', '#4a3820', 5, 0.2, false);
      });
      // trois ponts : un pont de chemin de fer bas (on passe entre les piles ou on saute), un pont routier haut, un pont a deux piles
      S.item(d(210), (r) => bridge(S, d(210), HWd(210), WYS + 4.5, [-36, -12, 12, 36], r, false));
      S.item(d(530), (r) => bridge(S, d(530), HWd(530), WYS + 17, [0], r, true));
      S.item(d(675), (r) => bridge(S, d(675), HWd(675), WYS + 5.5, [-30, 0, 30], r, false));
      // ennemis
      for (const [u, lx] of [[150, 8], [300, -6], [420, 10], [560, -10], [720, 6]]) foe(S, 'gunboat', d(u), lx, WYS + 0.5 - BED(d(u)), { name: 'CANONNIERE', hp: 3, armed: true, keep: true });
      for (let k = 0; k < 8; k++) { const u = 80 + k * 95; foe(S, 'mine', d(u), (k % 2 ? 1 : -1) * 20, WYS - BED(d(u)) - 3, { name: 'MINE', keep: true }); }
      foe(S, 'aaturret', d(250), 18, fl(S, d(250), WYS + 6.5), { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      foe(S, 'aaturret', d(470), 16, fl(S, d(470), WYS + 6.5), { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      foe(S, 'aaturret', d(700), 12, fl(S, d(700), WYS + 6.5), { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      foe(S, 'heli', d(380), 0, WYS + 22 - BED(d(380)), { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -16, y), SS.at(dc + 24, 0, y + 5), SS.at(dc, 16, y), SS.at(dc - 24, 0, y + 5)], speed: 12 });
      foe(S, 'heli', d(640), 0, WYS + 22 - BED(d(640)), { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -16, y), SS.at(dc + 24, 0, y + 5), SS.at(dc, 16, y), SS.at(dc - 24, 0, y + 5)], speed: 12 });
      for (let k = 0; k < 20; k++) { const u = 30 + k * 38; S.glow(d(u), (k % 2 ? 1 : -1) * 22, fl(S, d(u), WYS + 3), '#eef6f0', 70); }
    } };

  // ============================================== LE PORT ==============================================
  const L0 = D3 + LD;
  SC.havre = { len: [LP, LP], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'havre', name: 'LE PORT' }, { u: 0.34, key: 'quais', name: 'LES QUAIS' }, { u: 0.8, key: 'rade', name: 'LA RADE' }],
    turns: [[0.14, 0.28, -34], [0.42, 0.56, 38], [0.64, 0.76, -30]],
    pin: (T, sc) => ({ lx: 0, fy: (d) => WYS - 5 - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => BED(d) - SEAB); },
    ground: (d, lx, c) => { c.set('#6e6a60'); c.multiplyScalar(0.85 + 0.1 * Math.sin(lx * 0.3 + d * 0.2)); },
    build(S) {
      const d0 = S.d0, d = (u) => d0 + u;
      water(S, d0, d0 + LP, 90, WYS);
      // quais de beton : mur vertical, bande d'asphalte, bollards, lampadaires, entrepots, conteneurs
      for (let u = 6; u < LP - 6; u += 14) S.item(d(u), (r) => {
        const dc = d(u), open = u > LP - 150;
        for (const sg of [-1, 1]) {
          const hwv = HWp(u) + r.between([-0.4, 0.8]), top = WYS + 6.5, bed = BED(dc), wd = OUT - hwv;
          S.bx(dc, sg * (hwv + wd / 2), fl(S, dc, (bed - 6 + top) / 2), wd, top - bed + 6, 18, 'concreteDark', open ? pk(r, WALL) : '#8a8c88', true); S.bx(dc, sg * (hwv + wd / 2), fl(S, dc, top + 0.15), wd, 0.3, 18, open ? 'evoGrass' : 'asphalt', open ? pk(r, GREEN) : '#4a4c50', true);
          if (!open) {
            S.bx(dc, sg * (hwv + 0.5), fl(S, dc, top + 0.9), 1, 1.2, 14, 'concrete', '#c0c4c6', true);
            if (u % 28 < 14) { S.cyl(dc, sg * (hwv + 3), fl(S, dc, top), 0.22, 9, 'metal', '#7a8088', 6, 0.16, false); lampS(S, dc, sg * (hwv + 3), fl(S, dc, top + 9), '#fff1c8', 18); }
            if (r() < 0.4) col(S, dc, sg * (hwv + 3.4), fl(S, dc, top + 1.4), 1.6, 1.6, 1.6, '#d8a828', false);
            if (r() < 0.5) { const bw = r.between([22, 34]), bh = r.between([10, 18]); S.bx(dc, sg * (hwv + 28 + bw / 2), fl(S, dc, top + bh / 2), bw, bh, r.between([20, 34]), 'corrugated', pk(r, ['#7a8a6a', '#8a8a82', '#6a7a8a']), true); }
            if (r() < 0.35) stacks(S, dc, sg * (hwv + 8), 3 + Math.floor(r() * 3), r);
          } else {
            if (r() < 0.6) plant(S, TR.palm, dc + r.between([-5, 5]), sg * (hwv + r.between([2, 9])), top + 0.2, r.between([9, 14]), r, {});
            if (r() < 0.4) plant(S, TR.jungle, dc + r.between([-5, 5]), sg * (hwv + r.between([10, 40])), top + 0.2, r.between([20, 30]), r, {});
          }
        }
      });
      for (const [u, sg] of [[70, 1], [150, -1], [240, 1], [330, -1], [430, 1], [520, -1]]) S.item(d(u), (r) => crane(S, d(u), sg * (HWp(u) + 6), r));
      // jetees en quinconce : on slalome ; cargos amarres
      for (const [u, sg, len] of [[110, 1, 38], [210, -1, 40], [320, 1, 36], [420, -1, 42], [500, 1, 38], [585, -1, 36]]) S.item(d(u), (r) => {
        const dc = d(u), hwv = HWp(u), top = WYS + 4.2, bed = BED(dc), x1 = sg * (hwv - len / 2 + 2);
        S.bx(dc, x1, fl(S, dc, (bed + top) / 2), len, top - bed, 8, 'concreteDark', '#7a7c78', true); S.bx(dc, x1, fl(S, dc, top + 0.15), len + 0.3, 0.3, 8.3, 'asphalt', '#4a4c50', true); S.bx(dc, sg * (hwv - len + 2), fl(S, dc, top + 1.2), 1.4, 2.4, 1.4, 'emis:#ff5a3a', undefined, false); S.glow(dc, sg * (hwv - len + 2), fl(S, dc, top + 2), '#ff5a3a', 18);
      });
      S.item(d(270), (r) => cargo(S, d(270), -(HWp(270) - 11), 96, r)); S.item(d(480), (r) => cargo(S, d(480), HWp(480) - 11, 104, r));
      // portique de la rade : deux tours et un pont de service au-dessus du chenal
      S.item(d(640), (r) => {
        const dc = d(640), hwv = HWp(640) + 6;
        for (const sg of [-1, 1]) { S.bx(dc, sg * hwv, fl(S, dc, WYS + 22), 8, 52, 8, 'concreteDark', '#8a8c88', true); lampS(S, dc - 4.4, sg * hwv, fl(S, dc, WYS + 40), '#ff3a2a', 18); }
        S.bx(dc, 0, fl(S, dc, WYS + 42), 2 * hwv, 3.6, 7, 'metal', '#c8362a', true); S.bx(dc, 0, fl(S, dc, WYS + 44.3), 2 * hwv, 1, 7.4, 'hazard', undefined, false); for (let k = -3; k <= 3; k++) lampS(S, dc - 4, k * hwv / 3.4, fl(S, dc, WYS + 40), '#fff1c8', 14);
      });
      // phares sur les digues de la rade
      for (const sg of [-1, 1]) S.item(d(690), (r) => { const dc = d(690), x = sg * (HWp(690) + 10); S.cyl(dc, x, fl(S, dc, WYS + 5), 3.4, 20, 'col:#e8eaec', undefined, 12, 2.4, true); S.cyl(dc, x, fl(S, dc, WYS + 22), 3.6, 2, 'col:#c8362a', undefined, 12, 3.6, false); lampS(S, dc, x, fl(S, dc, WYS + 26), '#fff6d0', 40); });
      // ennemis
      for (const [u, lx] of [[100, -8], [190, 10], [290, 8], [370, -10], [450, -6], [530, 8], [620, 4]]) foe(S, 'gunboat', d(u), lx, WYS + 0.5 - BED(d(u)), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      for (const [u, sg] of [[60, -1], [140, 1], [230, -1], [310, 1], [400, -1], [470, 1], [560, -1], [650, 1]]) foe(S, 'aaturret', d(u), sg * (HWp(u) + 3), fl(S, d(u), WYS + 7.4), { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      for (let k = 0; k < 8; k++) { const u = 50 + k * 80; foe(S, 'mine', d(u), (k % 2 ? 1 : -1) * 26, WYS - BED(d(u)) - 3, { name: 'MINE', keep: true }); }
      for (const u of [180, 360, 560]) foe(S, 'heli', d(u), 0, WYS + 24 - BED(d(u)), { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -18, y), SS.at(dc + 26, 0, y + 5), SS.at(dc, 18, y), SS.at(dc - 26, 0, y + 5)], speed: 12 });
      for (let k = 0; k < 18; k++) { const u = 20 + k * 38; S.glow(d(u), (k % 2 ? 1 : -1) * 24, fl(S, d(u), WYS + 3), '#eef6f0', 70); }
    } };
})();
