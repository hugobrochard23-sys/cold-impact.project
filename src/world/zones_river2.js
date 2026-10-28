/* v281 : NIVEAU 2, ZONE 2 — « LE BARRAGE ». Le lac derriere le barrage (bouees, mines, brume), le mur de beton colossal et sa prise d'eau a grille, la galerie noyee, le grand HALL qui plonge
 * de 64 m (nervures d'acier, lumieres), les deux turbines qui tournent, le canal de fuite, puis la sortie en plein jour dans le canyon aval : deux ecluses a portes entrouvertes, grues, conteneurs,
 * canonnieres, jusqu'a la LIGNE D'ARRIVEE. Cotes absolues (voir zones_river.js). */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, TR = CC.Trees, R = EVO && EVO.riv;
  if (!R) return;
  const SC = Z.defs.ocean.scenes, { pk, ss } = EVO.oc;
  const { WY, BED, LA, LB, LF, EXIT, A, absAt, SEAB, plant, slab, lampS, water, curtain, hsh, GREEN, WALL, STONE, rel, mixf } = R;
  const OUT = 150;
  for (const k of ['camp', 'fleuve', 'gorges', 'lagune']) { EVO.SCENE_MOOD[k] = 'jungle'; EVO.SCENE_AUDIO[k] = 'evoDay'; }
  for (const [k, m, a] of [['barrage', 'dam', 'evoDay'], ['lac', 'dam', 'evoDay'], ['conduite', 'pit', 'evoMine'], ['hall', 'pit', 'evoMine'], ['canal', 'dam', 'evoDusk']]) { EVO.SCENE_MOOD[k] = m; EVO.SCENE_AUDIO[k] = a; }
  // ---- cotes du barrage (u = distance depuis le debut de la zone 2)
  const U_DAM = 300, U_GAL = 360, U_HALL = 480, U_TURB = 700, U_TAIL = 780, U_MOUTH = 1010, U_FIN = 1500;
  const FLOOR_GAL = -86, FLOOR_TAIL = -150, CREST = -10, H_GAL = 36, H_HALL = 40, H_TAIL = 38;
  const lakeDep = () => 38;
  const BED2 = (d) => {
    const u = d - LA;
    if (u < U_DAM - 30) return -54 - lakeDep(d);
    if (u < U_HALL) return mixf(-54 - lakeDep(d), FLOOR_GAL, ss(U_DAM - 30, U_DAM + 20, u));
    if (u < U_MOUTH) return mixf(FLOOR_GAL, FLOOR_TAIL, ss(U_HALL, U_TAIL - 40, u));
    const w = -112 - (26 + 3 * Math.sin(d / 41));
    return mixf(FLOOR_TAIL, w, ss(U_MOUTH, U_MOUTH + 70, u));
  };
  R.setBed2(BED2);
  const HWt = (u) => (u < U_HALL ? 24 : u < U_TURB + 90 ? mixf(24, 32, ss(U_HALL, U_HALL + 40, u)) : mixf(32, 24, ss(U_TURB + 80, U_TAIL, u)));   // demi-largeur de la galerie / du hall / du canal de fuite
  const HWc = (d) => 40 + 5 * Math.sin(d / 57);                                                                                                  // demi-largeur du canyon aval
  const Hroof = (u) => (u < U_HALL ? H_GAL : u < U_TAIL ? H_HALL : H_TAIL);
  const ceilAbs = (d) => { const u = d - LA; return u < U_HALL ? FLOOR_GAL + H_GAL : BED2(d) + Hroof(u); };
  const pathY = (d) => { const u = d - LA; if (u < U_DAM - 60) return WY(d) - 5; if (u < U_MOUTH + 40) return BED2(d) + mixf(18, 5.5, ss(U_TAIL - 70, U_TAIL - 20, u)); return WY(d) - 4.5; };

  EVO.riv.pathY = (d) => (d >= LA ? pathY(d) : R.PATH(d));
  SC.barrage = { len: [LB, LB], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'lac', name: 'LE LAC' }, { u: U_DAM / LB, key: 'conduite', name: 'LA CONDUITE' }, { u: U_HALL / LB, key: 'hall', name: 'LE HALL' }, { u: U_MOUTH / LB, key: 'canal', name: 'LE CANAL' }],
    turns: [[0.02, 0.18, 10], [0.7, 0.8, -22], [0.82, 0.93, 20]],
    pin: (T, sc) => ({ lx: 0, fy: (d) => pathY(d) - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => BED2(d) - SEAB); },
    ground: (d, lx, c, sc) => { const u = d - LA; if (u > U_DAM - 30 && u < U_MOUTH + 10) { c.set('#5a6068').multiplyScalar(0.9 + 0.1 * Math.sin(lx * 0.4 + d * 0.3)); return; } const base = new T3.Color('#5e5236'), silt = new T3.Color('#7a6c48'); c.copy(base).lerp(silt, 0.4 + 0.4 * Math.sin(d * 0.03 + lx * 0.05)); c.multiplyScalar(0.8 + 0.1 * Math.sin(lx * 0.23 + d * 0.13)); },
    build(S) {
      const d0 = S.d0, d = (u) => d0 + u, L = S.len;
      // --- le lac : eau, rives, brume, mines, bouees
      water(S, d(0), d(U_DAM), 80, -54); water(S, d(U_DAM), d(U_HALL + 60), 26, -54, 0.12);
      for (let u = 6; u < U_DAM - 4; u += 14) S.item(d(u), (r) => {
        const dc = d(u);
        for (const sg of [-1, 1]) {
          const hwv = mixf(66, 62, u / U_DAM), face = hwv + r.between([-1, 2]), top = WY(dc) + 26 + 3 * Math.sin(dc / 53 + sg), bed = BED(dc), mid = (bed - 6 + top) / 2, wd = OUT - face;
          S.bx(dc, sg * (face + wd / 2), A(S, dc, mid), wd, top - bed + 6, 14.9, 'jrock', pk(r, WALL), true); S.bx(dc, sg * (face + wd / 2), A(S, dc, top + 0.25), wd, 0.5, 14.9, 'evoGrass', pk(r, GREEN), true);
          if (r() < 0.45) plant(S, TR.jungle, dc + r.between([-5, 5]), sg * (face + r.between([6, 30])), top + 0.2, r.between([20, 32]), r, {}); if (r() < 0.4) plant(S, TR.palm, dc + r.between([-5, 5]), sg * (face + r.between([2, 8])), top + 0.2, r.between([9, 14]), r, {});
          for (let k = 0; k < 1; k++) plant(S, r() < 0.5 ? TR.fern : TR.bigleaf, dc + r.between([-6, 6]), sg * (face + r.between([1, 20])), top + 0.2, r.between([1.6, 2.6]), r);
          if (r() < 0.5) plant(S, TR.reeds, dc + r.between([-5, 5]), sg * (face - r.between([0.4, 2.4])), WY(dc) - 0.3, r.between([1.6, 2.6]), r);
        }
      });
      for (let k = 0; k < 7; k++) { const u = 40 + k * 34; foe(S, 'mine', d(u), (k % 2 ? 1 : -1) * 24, WY(d(u)) - BED(d(u)) - 2.5, { name: 'MINE', keep: k < 2 }); }
      // bouees de balisage et barrage flottant (billes de bois)
      S.item(d(150), (r) => { for (let k = -5; k <= 5; k++) { if (Math.abs(k) < 1.5) continue; const x = k * 11; S.cyl(d(150), x, A(S, d(150), -54.5), 0.9, 1.2, 'col:#d8c070', undefined, 8, 0.9, true); S.cyl(d(150), x, A(S, d(150), -53.5), 0.2, 2.6, 'metal', '#4a4e54', 5, 0.2, false); S.bx(d(150), x, A(S, d(150), -50.9), 0.5, 0.5, 0.5, 'emis:#ff3a2a', undefined, false); } for (const [a, b] of [[-6.5, -52], [1.5, 6.5], [52, 66]]) S.bx(d(150), (a + b) / 2, A(S, d(150), -54.2), Math.abs(b - a), 1.0, 1.2, 'bark', '#5e4630', false); });
      foe(S, 'gunboat', d(100), -14, WY(d(100)) + 0.5 - BED(d(100)), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      foe(S, 'gunboat', d(210), 14, WY(d(210)) + 0.5 - BED(d(210)), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      // --- LE BARRAGE : mur de beton, prise d'eau a grille, tours de vannes, crete, tour de controle
      S.item(d(U_DAM + 30), (r) => {
        const dc = d(U_DAM + 30), bot = -100, portW = 44;
        for (const sg of [-1, 1]) S.bx(dc, sg * (portW / 2 + (OUT - portW / 2) / 2), A(S, dc, (bot + CREST) / 2), OUT - portW / 2, CREST - bot, 62, 'concreteDark', '#8a8e90', true);
        S.bx(dc, 0, A(S, dc, (FLOOR_GAL + H_GAL + CREST) / 2), portW + 0.2, CREST - FLOOR_GAL - H_GAL, 62, 'concreteDark', '#8a8e90', true);
        const f = dc - 31.2;   // face amont : joints de dilatation, lignes de coulage, grille de prise d'eau, tours de vannes
        for (let k = -4; k <= 4; k++) S.bx(f, k * 14, A(S, dc, (bot + CREST) / 2), 0.5, CREST - bot, 0.3, 'col:#4a4e50', undefined, false);
        for (let y = -90; y < CREST; y += 9) S.bx(f, 0, A(S, dc, y), 2 * OUT, 0.4, 0.3, 'col:#5a5e60', undefined, false);
        for (const sg of [-1, 1]) { S.bx(f - 2.6, sg * (portW / 2 + 5), A(S, dc, (FLOOR_GAL + CREST) / 2 + 2), 6, CREST - FLOOR_GAL + 4, 5.2, 'concrete', '#a8acae', true); S.bx(f - 2.6, sg * (portW / 2 + 5), A(S, dc, CREST + 4.6), 7, 3, 6.4, 'concrete', '#b4b8ba', true); lampS(S, f - 5.4, sg * (portW / 2 + 5), A(S, dc, CREST + 3.4), '#ffd23a', 18); }
        {   // v302 : la grille de la prise d'eau S'OUVRE toute seule quand la fusee s'approche (feux rouges -> verts, herse qui monte, message) ; elle n'a jamais eu de collision
          const gp = new T3.Group(), door = new T3.Group(), bm = new T3.MeshLambertMaterial({ color: '#4a5056' }), lampR = new T3.MeshBasicMaterial({ color: '#ff3a2a' }), zf = f - 0.6 - dc, bw = 0.4;
          for (let k = -9; k <= 9; k++) { const m = new T3.Mesh(new T3.BoxGeometry(bw, H_GAL, bw), bm); m.position.set(k * 2.4, (FLOOR_GAL + FLOOR_GAL + H_GAL) / 2, zf); door.add(m); }
          for (let y = FLOOR_GAL + 4; y < FLOOR_GAL + H_GAL; y += 6) { const m = new T3.Mesh(new T3.BoxGeometry(portW, 0.6, 0.5), bm); m.position.set(0, y, zf); door.add(m); }
          gp.add(door);
          for (const sx of [-1, 1]) for (const yy of [FLOOR_GAL + 10, FLOOR_GAL + 22, FLOOR_GAL + 34]) { const m = new T3.Mesh(new T3.BoxGeometry(1.6, 1.6, 1.0), lampR); m.position.set(sx * (portW / 2 + 1.6), yy, zf - 0.2); gp.add(m); }
          gp.position.y = 0; EVO.placeGroup(S, gp, dc, 0, A(S, dc, 0), 0);
          EVO.addDyn(gp, (t, dt, g) => { const run = g.endlessRun, dist = run ? run.dist : 0, k = ss(f - 210, f - 100, dist); door.position.y = k * (H_GAL - 0.5); lampR.color.set(k > 0.08 ? '#4aff6a' : '#ff3a2a'); }, [], { near: 420, span: 140 });
        }
        S.bx(f - 0.2, 0, A(S, dc, FLOOR_GAL + H_GAL + 2.6), portW + 6, 5.2, 1.2, 'hazard', undefined, false);
        // crete : route, garde-corps, lampadaires, tour de controle, portique de vannes
        S.bx(dc, 0, A(S, dc, CREST + 0.5), 2 * OUT, 1.0, 20, 'asphalt', '#46484c', true); for (const sg of [-1, 1]) S.bx(dc + sg * 9.6, 0, A(S, dc, CREST + 1.7), 2 * OUT, 1.4, 0.5, 'concrete', '#c0c4c6', true);
        for (let k = -8; k <= 8; k++) { S.cyl(dc - 8.5, k * 14, A(S, dc, CREST + 1), 0.22, 9, 'metal', '#7a8088', 6, 0.16, false); lampS(S, dc - 8.5, k * 14, A(S, dc, CREST + 10), '#fff1c8', 7); }
        S.bx(dc + 4, -44, A(S, dc, CREST + 14), 18, 26, 12, 'concrete', '#c8ccce', true); S.bx(dc - 2.2, -44, A(S, dc, CREST + 20), 18.2, 6, 0.4, 'glass', undefined, false); S.bx(dc + 4, -44, A(S, dc, CREST + 28.5), 20, 1.2, 14, 'concrete', '#9aa0a2', true); S.cyl(dc + 4, -44, A(S, dc, CREST + 29), 0.3, 18, 'metal', '#8a9096', 5, 0.15, false); lampS(S, dc + 4, -44, A(S, dc, CREST + 47), '#ff3a2a', 16);
        for (let k = -3; k <= 3; k++) { if (Math.abs(k) < 1) continue; S.bx(dc, k * 24, A(S, dc, CREST + 5), 5, 8, 6, 'concrete', '#a8acae', true); S.bx(dc, k * 24, A(S, dc, CREST + 9.5), 7, 1.0, 20, 'metal', '#c8362a', false); }
        S.bx(dc, 56, A(S, dc, CREST + 3), 12, 5, 8, 'corrugated', '#7a8a6a', true);
      });
      // --- galerie, hall, turbines, canal de fuite (le conduit est noye : il n'y a pas de ciel)
      tunnel(S, d);
      // --- LE CANYON AVAL : parois, ecluses, grues, conteneurs, canonnieres
      for (let u = U_MOUTH + 6; u < L - 6; u += 14) S.item(d(u), (r) => {
        const dc = d(u);
        for (const sg of [-1, 1]) {
          const hwv = HWc(dc), face = hwv + r.between([-1, 2]), top = WY(dc) + 30 + 3 * Math.sin(dc / 47 + sg), bed = BED(dc), mid = (bed - 6 + top) / 2, wd = OUT - face;
          S.bx(dc, sg * (face + wd / 2), A(S, dc, mid), wd, top - bed + 6, 14.9, u < U_MOUTH + 60 ? 'concreteDark' : 'jrock', u < U_MOUTH + 60 ? '#8a8e90' : pk(r, WALL), true); S.bx(dc, sg * (face + wd / 2), A(S, dc, top + 0.25), wd, 0.5, 14.9, 'evoGrass', pk(r, GREEN), true);
          if (r() < 0.5) plant(S, TR.jungle, dc + r.between([-5, 5]), sg * (face + r.between([6, 28])), top + 0.2, r.between([20, 34]), r, {}); if (r() < 0.4) plant(S, TR.palm, dc + r.between([-5, 5]), sg * (face + r.between([2, 8])), top + 0.2, r.between([9, 14]), r, {});
          for (let k = 0; k < 1; k++) plant(S, r() < 0.5 ? TR.fern : TR.bigleaf, dc + r.between([-6, 6]), sg * (face + r.between([1, 20])), top + 0.2, r.between([1.6, 2.6]), r);
          if (r() < 0.5) plant(S, TR.reeds, dc + r.between([-5, 5]), sg * (face - r.between([0.4, 2.4])), WY(dc) - 0.3, r.between([1.6, 2.6]), r);
          const nl = 1 + Math.floor(r() * 2); for (let k = 0; k < nl; k++) { const yl = WY(dc) + r.between([3, 22]), th = r.between([1.1, 2.4]), ext = r.between([1.2, 3.2]); S.bx(dc + r.between([-4, 4]), sg * (face - ext / 2 + 0.2), A(S, dc, yl), ext, th, r.between([5, 11]), 'jrock', pk(r, STONE), true); }
        }
      });
      water(S, d(U_MOUTH - 2), d(L), 70, -112);
      for (const [u, off] of [[1170, 7], [1340, -7]]) S.item(d(u), (r) => lock(S, d(u), off, r));
      S.item(d(1255), (r) => cranes(S, d(1255), r));
      foe(S, 'gunboat', d(1080), -8, WY(d(1080)) + 0.5 - BED(d(1080)), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      foe(S, 'gunboat', d(1280), 10, WY(d(1280)) + 0.5 - BED(d(1280)), { name: 'CANONNIERE', hp: 5, armed: true, keep: true });
      foe(S, 'aaturret', d(1190), HWc(d(1190)) - 6, A(S, d(1190), WY(d(1190)) + 11.2), { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      foe(S, 'aaturret', d(1360), -(HWc(d(1360)) - 6), A(S, d(1360), WY(d(1360)) + 11.2), { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      foe(S, 'heli', d(1400), 0, WY(d(1400)) + 20 - BED(d(1400)), { name: 'HELICO', armed: true, keep: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -16, y), SS.at(dc + 24, 0, y + 5), SS.at(dc, 16, y), SS.at(dc - 24, 0, y + 5)], speed: 12 });
      // --- la ligne d'arrivee : un immense mur a damiers, sans collision
    } };
  SC.arrivee = { len: [LF, LF], noDoor: true, noChaos: true, gw: 125, grass: false,
    pin: (T, sc) => ({ lx: 0, fy: (d) => WY(d) - 4.5 - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => -112 - 26 - SEAB); },
    ground: (d, lx, c) => { c.set('#6a5c3e'); },
    build(S) {
      water(S, S.d0, S.d1, 70, -112);
      for (let u = 6; u < LF - 6; u += 14) S.item(S.d0 + u, (r) => { const dc = S.d0 + u; for (const sg of [-1, 1]) { const face = 44 + r.between([-1, 2]), top = -112 + 28, bed = -138, wd = OUT - face; S.bx(dc, sg * (face + wd / 2), A(S, dc, (bed - 6 + top) / 2), wd, top - bed + 6, 14.9, 'jrock', pk(r, WALL), true); S.bx(dc, sg * (face + wd / 2), A(S, dc, top + 0.25), wd, 0.5, 14.9, 'evoGrass', pk(r, GREEN), true); if (r() < 0.7) plant(S, TR.jungle, dc, sg * (face + r.between([6, 28])), top + 0.2, r.between([20, 32]), r, {}); } });
    } };

  // ---- la ligne d'arrivee
  function finishLine(S, dm) {
    if (!EVO.placeGroup || !S.inClip(dm)) return; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const cx2 = cv.getContext('2d'); cx2.fillStyle = '#ffffff'; cx2.fillRect(0, 0, 64, 64); cx2.fillStyle = '#111111'; cx2.fillRect(0, 0, 32, 32); cx2.fillRect(32, 32, 32, 32);
    const W2 = 1600, H2 = 1000, sq = 14, tx = new T3.CanvasTexture(cv); tx.wrapS = tx.wrapT = T3.RepeatWrapping; tx.repeat.set(W2 / (2 * sq), H2 / (2 * sq)); tx.magFilter = T3.NearestFilter;
    const grp = new T3.Group(), pl = new T3.Mesh(new T3.PlaneGeometry(W2, H2), new T3.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0.55, side: T3.DoubleSide, depthWrite: false, fog: false })); pl.position.set(0, H2 / 2 - 60, 0); grp.add(pl);
    EVO.placeGroup(S, grp, dm, S.lane(dm).lx, 0, 0);
  }
  EVO.riv.finishD = 1e9; EVO.riv.finishLine = finishLine; EVO.riv.lam = lam; EVO.riv.HWc = HWc;   // v287 : l'arrivee est maintenant au bout de la base sous-marine (zones_river4)
  const _tkf = EVO.tick;
  EVO.tick = (g, dt) => { _tkf(g, dt); const run = g.endlessRun; if (run && EVO.isS2() && g.evo && !g.evo.preview && g.state === 'FLIGHT' && g.rocket.active) { } if (EVO.isS2() && g.evo && !g.evo.preview && run && !g.evoFinish && g.state === 'FLIGHT' && g.rocket.active && run.dist > EVO.riv.finishD && EVO.finishRun) EVO.finishRun(g); };

  // ---- le tunnel : galerie d'entree, hall en descente, canal de fuite ; boucles de 12 m
  function tunnel(S, d) {
    // nervures d'acier : un portique (deux montants, une traverse, une bande jaune) tous les 24 m ; lumieres le long du plafond
    for (let u = U_DAM + 62; u < U_MOUTH; u += 12) S.item(d(u), (rr) => {
      const dc = d(u), hw = HWt(u), fl = BED(dc), ce = ceilAbs(dc), mid = (fl + ce) / 2, H = ce - fl, rib = Math.round((u - U_DAM) / 12) % 2 === 0;
      for (const sg of [-1, 1]) S.bx(dc, sg * (hw + 8), A(S, dc, mid), 16, H + 10, 12.8, 'concreteDark', pk(rr, ['#7a7e80', '#72767a', '#80848a']), true);
      slab(S, dc, 0, A(S, dc, ce) + 4.5, 2 * (hw + 16), 9, 12.8, 'concreteDark', '#6c7074', true);
      if (rib) { for (const sg of [-1, 1]) S.bx(dc, sg * (hw - 1.2), A(S, dc, mid), 2.4, H, 1.6, 'metal', '#d8a828', false); slab(S, dc, 0, A(S, dc, ce) - 1.4, 2 * hw, 2.4, 1.6, 'metal', '#d8a828', false); slab(S, dc, 0, A(S, dc, ce) - 2.7, 2 * hw - 4, 0.3, 1.7, 'hazard', undefined, false); for (const sg of [-1, 1]) lampS(S, dc, sg * (hw - 3), A(S, dc, fl) + 4, u < U_HALL + 30 ? '#ffd9a0' : '#7be8ff', 14); }
      else { for (const sg of [-1, 1]) { slab(S, dc, sg * (hw - 4), A(S, dc, ce) - 0.5, 1.2, 0.5, 6, 'emis:#e8f4ff', undefined, false); } }
      for (const sg of [-1, 1]) for (let k = 1; k < 4; k++) S.bx(dc, sg * (hw - 0.6), A(S, dc, fl + k * H / 4 + 0.6 * (k % 2)), 0.7, 0.7, 12.4, 'metal', k === 2 ? '#c8362a' : k === 1 ? '#3a78b8' : '#8a9096', false);   // tuyauteries le long des parois
      if (u > U_HALL && u < U_TURB - 10 && u % 36 === 0) for (const sg of [-1, 1]) { S.cyl(dc, sg * (hw - 5), A(S, dc, fl), 2.2, H, 'metal', '#a8b0b8', 12, 2.2, true); S.bx(dc, sg * (hw - 5), A(S, dc, fl + H * 0.35), 5.4, 0.9, 5.4, 'hazard', undefined, false); }   // colonnes de conduites
    });
    // grosses conduites horizontales qui traversent le hall sous le plafond, et un pont roulant
    for (let u = U_HALL + 30; u < U_TURB - 20; u += 72) S.item(d(u), (rr) => {
      const dc = d(u), hw = HWt(u), ce = ceilAbs(dc), p = absAt(S, dc, 0, A(S, dc, ce - 7));
      const g = new T3.CylinderGeometry(3.0, 3.0, 2 * hw, 14); g.rotateZ(Math.PI / 2); const q = new T3.Quaternion().setFromEuler(new T3.Euler(0, U.deg(S.yaw(dc)), 0, 'YXZ'));
      S.b.addGeometry(g, new V(p[0], p[1], p[2]), q, null, 'metal', pk(rr, ['#3a78b8', '#c8362a', '#d8a828']), [2 * hw / 6, 1]); g.dispose();
      for (const sg of [-1, 1]) S.bx(dc, sg * (hw - 3), A(S, dc, ce - 7), 1.2, 7, 4.2, 'metal', '#5a6068', false);
      S.bx(dc, 0, A(S, dc, ce - 4.2), 2 * hw, 0.5, 5.4, 'hazard', undefined, false);
    });
    // cloison de fond de la prise d'eau (portes de vanne ouvertes)
    S.item(d(U_GAL + 10), (rr) => { const dc = d(U_GAL + 10); for (const sg of [-1, 1]) { S.bx(dc, sg * 17, A(S, dc, -68), 6, 36, 3, 'metal', '#4a5058', true); S.bx(dc, sg * 17, A(S, dc, -50), 7, 2, 3.4, 'hazard', undefined, false); } S.bx(dc, 0, A(S, dc, -49), 40, 3, 3, 'metal', '#4a5058', true); });
    // turbines : deux rotors a trois pales, sens inverses, centres sur les deux moities du hall
    const T0 = d(U_TURB);
    for (const [sg, spd] of [[-1, 1.0], [1, -0.9]]) {
      const lx = sg * 16, dc = T0 + (sg > 0 ? 18 : 0);
      S.item(dc, () => {
        const g = new T3.Group(), steel = lam('#e0a828'), dark = lam('#2c3036'), hz = lam('#c8362a'), cols = [];
        const hub = new T3.Mesh(new T3.CylinderGeometry(3.6, 4.4, 4.8, 14), dark); hub.rotation.x = Math.PI / 2; g.add(hub); const cap = new T3.Mesh(new T3.ConeGeometry(3.4, 3.8, 14), lam('#a8b0b8')); cap.rotation.x = -Math.PI / 2; cap.position.z = -4.2; g.add(cap);
        for (let k = 0; k < 3; k++) { const bl = new T3.Group(); bl.rotation.z = k * Math.PI * 2 / 3; g.add(bl); const body = new T3.Mesh(new T3.BoxGeometry(3.8, 15.5, 1.3), steel); body.position.set(0, 10.5, 0); bl.add(body); const tip = new T3.Mesh(new T3.BoxGeometry(4.0, 2.4, 1.5), hz); tip.position.set(0, 17.6, 0); bl.add(tip); const rim = new T3.Mesh(new T3.BoxGeometry(0.3, 14.5, 1.4), lam('#fff2c0')); rim.position.set(1.95, 10.6, 0); bl.add(rim); cols.push(EVO.colBox(bl, 4.2, 16.5, 2.2, 0, 10.8, 0)); }
        const p = absAt(S, dc, lx, A(S, dc, BED(dc) + 20)); g.position.set(p[0], p[1], p[2]); g.rotation.y = U.deg(S.yaw(dc)); S.b.root.add(g);
        EVO.addDyn(g, (t) => { g.rotation.z = t * spd; }, cols, { near: 460, span: 60 });
        S.bx(dc + 3.6, lx, A(S, dc, BED(dc) + 20), 33, 1.4, 1.4, 'metal', '#3a4046', false); S.bx(dc + 3.6, lx, A(S, dc, BED(dc) + 20), 1.4, 36, 1.4, 'metal', '#3a4046', false);
        lampS(S, dc - 6, lx, A(S, dc, BED(dc) + 20), '#ff8a2a', 30);
      });
    }
    // vannes de garde du canal de fuite : trois grandes lames suspendues au plafond qui montent et descendent ; elles ne ferment jamais tout : une fente reste toujours au ras du sol (8 m)
    [[835, 0.0], [910, 2.1], [985, 4.2]].forEach(([u, ph]) => S.item(d(u), () => {
      const dc = d(u), hw = HWt(u), ce = ceilAbs(dc), fl = BED(dc), g = new T3.Group(), body = lam('#d8a828'), dk = lam('#2c3036'), lampM = new T3.MeshBasicMaterial({ color: '#4aff6a' }), cols = [];
      g.add(new T3.Mesh(new T3.BoxGeometry(2 * hw - 1, 30, 3), body)); for (let k = -4; k <= 4; k++) { const st = new T3.Mesh(new T3.BoxGeometry(2.4, 30.2, 3.1), dk); st.position.x = k * (hw * 0.22); st.rotation.z = 0.0; g.add(st); }
      for (const sg of [-1, 1]) { const lp = new T3.Mesh(new T3.BoxGeometry(1.2, 1.2, 3.4), lampM); lp.position.set(sg * (hw - 3), 14, 0); g.add(lp); }
      cols.push(EVO.colBox(g, 2 * hw - 1, 30, 3, 0, 0, 0));
      const p = absAt(S, dc, 0, A(S, dc, ce)); g.position.set(p[0], ce - 19 + 15, p[2]); g.rotation.y = U.deg(S.yaw(dc)); S.b.root.add(g);
      // guides lateraux et carter au plafond
      for (const sg of [-1, 1]) S.bx(dc, sg * (hw - 0.4), A(S, dc, (fl + ce) / 2), 1.4, ce - fl, 4.4, 'metal', '#3a4046', false);
      S.bx(dc, 0, A(S, dc, ce - 1), 2 * hw, 2, 5, 'hazard', undefined, false);
      EVO.addDyn(g, (t) => { const b = ce - 19 + 11 * Math.sin(t * 0.95 + ph), low = b - fl < 17; g.position.y = b + 15; lampM.color.set(low ? '#ff3a2a' : '#4aff6a'); }, cols, { near: 420, span: 20 });
    }));
    S.item(T0 - 16, () => { for (const sg of [-1, 1]) S.bx(T0 - 16, sg * 31, A(S, T0, BED(T0) + 20), 4, 40, 6, 'concreteDark', '#6a6e70', true); });
    // v286 : defenses du barrage : mines dans la galerie et le canal, tourelles de paroi sur consoles dans le hall et le canal de fuite
    for (const [u, sg, y] of [[392, -1, 13], [412, 1, 19], [432, -1, 16], [452, 1, 12], [840, 1, 11], [872, -1, 15], [900, 1, 9], [950, -1, 12], [980, 1, 15]]) foe(S, 'mine', d(u), sg * (u < 470 ? 9 : 11), y, { name: 'MINE', keep: true });
    for (const [u, sg] of [[535, 1], [585, -1], [635, 1], [675, -1], [850, -1], [925, 1], [995, -1]]) {
      const dc = d(u), hw = HWt(u), ry = u < U_TAIL ? 13 : 11;
      S.item(dc, () => { S.bx(dc, sg * (hw - 1.6), A(S, dc, BED(dc) + ry - 2), 3.4, 1.2, 4.2, 'metal', '#4a5058', false); S.bx(dc, sg * (hw - 0.9), A(S, dc, BED(dc) + ry - 4), 1.8, 5, 1.8, 'metal', '#3a4046', false); lampS(S, dc, sg * (hw - 3.2), A(S, dc, BED(dc)) + ry + 3.4, '#ff5a3a', 12); });
      foe(S, 'aaturret', dc, sg * (hw - 4.2), ry + 1.6, { name: 'TOURELLE', armed: true, keep: true, fixed: true });
    }
    // sortie du canal de fuite : portail d'arche dans la paroi du canyon
    S.item(d(U_MOUTH), (rr) => { const dc = d(U_MOUTH); S.wall(dc, -OUT, OUT, A(S, dc, BED(dc) - 8), A(S, dc, -112 + 52), 18, 'concreteDark', '#8a8e90', { lx: 0, yc: A(S, dc, BED(dc) + 18), w: 54, h: 40 }); for (const sg of [-1, 1]) { S.bx(dc - 9.4, sg * 28, A(S, dc, BED(dc) + 20), 3, 44, 2, 'hazard', undefined, false); lampS(S, dc - 10.6, sg * 28, A(S, dc, BED(dc) + 36), '#ffd23a', 24); } });
  }
  function lam(c) { return new T3.MeshLambertMaterial({ color: c }); }

  // ---- une ecluse : deux murs de chambre, portes pivotantes entrouvertes (une breche de 26 m decalee), tours de manoeuvre, passerelle
  function lock(S, dm, off, r) {
    const hw = HWc(dm), wy = WY(dm), top = wy + 12, bed = BED(dm);
    for (const sg of [-1, 1]) {
      const inner = off + sg * 13, outer = sg * (hw + 6);   // le mur va de la breche a la paroi du canyon
      S.bx(dm, (inner + outer) / 2, A(S, dm, (bed - 4 + top) / 2), Math.abs(outer - inner), top - bed + 4, 12, 'concreteDark', pk(r, ['#9a9ea0', '#8e9294']), true);
      S.bx(dm, (inner + outer) / 2, A(S, dm, top + 0.6), Math.abs(outer - inner) + 1, 1.2, 13, 'concrete', '#b8bcbe', true);
      for (let k = 0; k < 3; k++) S.bx(dm - 6.2, (inner + outer) / 2 + (k - 1) * 8, A(S, dm, wy + 3 + k * 2.5), 0.4, 0.5, 0.4, 'col:#c8362a', undefined, false);
      S.bx(dm, inner, A(S, dm, top + 6), 6, 10, 8, 'concrete', '#c4c8ca', true); S.bx(dm - 4.1, inner, A(S, dm, top + 7), 3.4, 2.4, 0.2, 'glass', undefined, false); lampS(S, dm, inner, A(S, dm, top + 11.8), '#ff3a2a', 16);
      for (const q of [-1, 0, 1]) S.bx(dm, inner + sg * (4 + q * 0.0), A(S, dm, top + 1.9), 0.14, 1.3, 11.5, 'metal', '#7a8088', false);
      for (let k = 0; k < 5; k++) S.cyl(dm - 5 + k * 2.5, sg * (hw + 1), A(S, dm, top), 0.25, 1.4, 'metal', '#8a9096', 5, 0.25, false);
      S.bx(dm + 7, (inner + outer) / 2, A(S, dm, top + 1.5), Math.abs(outer - inner) * 0.6, 2.6, 2.6, 'corrugated', '#c8a028', true);   // conteneur d'outillage
      S.bx(dm, (inner + outer) / 2 + sg * 6, A(S, dm, top + 4.5), 4, 4, 4, 'corrugated', '#2a6a8a', false);
    }
    S.bxr(dm, off, A(S, dm, top + 8.8), 30, 0.8, 1.4, 'metal', '#c8362a', 0, 0, false);   // portique de signalisation au-dessus de la breche
    lampS(S, dm - 1, off - 9, A(S, dm, top + 8.0), '#4aff6a', 14); lampS(S, dm - 1, off + 9, A(S, dm, top + 8.0), '#4aff6a', 14);
  }
  // grues a portique sur les quais et piles de conteneurs
  function cranes(S, dm, r) {
    const hw = HWc(dm), wy = WY(dm), cols = ['#c8362a', '#2a6a8a', '#d8a020', '#3a7a46', '#6a4a8a', '#c8c8c8'];
    for (const sg of [-1, 1]) {
      const x = sg * (hw + 14), y0 = wy + 30;
      for (const q of [-1, 1]) for (const e of [-1, 1]) S.bx(dm + q * 12, x + e * 6, A(S, dm, y0 + 15), 1.8, 30, 1.8, 'metal', '#c88a1a', true);
      S.bx(dm, x, A(S, dm, y0 + 30.5), 16, 2.2, 28, 'metal', '#c88a1a', true); S.bx(dm, x - sg * 20, A(S, dm, y0 + 31.5), 36, 1.6, 2.2, 'metal', '#c88a1a', true); S.bx(dm, x - sg * 40, A(S, dm, y0 + 28), 0.2, 6, 0.2, 'col:#2a2a2a', undefined, false); S.bx(dm, x - sg * 40, A(S, dm, y0 + 24.5), 2.4, 0.8, 4, 'col:#c8362a', undefined, false);
      S.bx(dm, x, A(S, dm, y0 + 33), 5, 4, 7, 'concrete', '#c8c8c4', true); lampS(S, dm, x, A(S, dm, y0 + 36.4), '#ff3a2a', 14);
      for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) S.bx(dm + (k - 1.5) * 7, x + sg * (8 + j * 4), A(S, dm, y0 + 1.4), 6.4, 2.6, 2.5, 'corrugated', pk(r, cols), true);
    }
  }
})();
