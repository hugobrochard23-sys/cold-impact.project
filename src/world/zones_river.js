/* v281 : NIVEAU 2 REFAIT — « OPERATION CASCADE ». Un hydro-missile descend un fleuve de jungle jusqu'a l'ocean : on part d'une rampe militaire sur la colline, on retombe dans le fleuve, on file
 * entre des parois couvertes de vegetation, on saute les cascades, on traverse un temple en ruine, puis la lagune ou se dresse le BARRAGE (zone 2 : prise d'eau, conduite forcee,
 * hall des turbines, canal de fuite, canyon des ecluses). La suite (le delta, l'ocean, la fosse et la base sous-marine) viendra ensuite.
 * Les scenes se posent avec les memes outils que le niveau 1 (S.bx, S.cyl, S.ball, foe...) ; la vegetation vient de trees.js (T.jungle, T.palm, T.fern, T.bigleaf, T.reeds).
 * Cotes ABSOLUES partout : WY(d) = surface de l'eau, BED(d) = fond du fleuve (= sol du couloir), A(dc, y) = cote relative a ce sol. */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, O = EVO && EVO.oc, TR = CC.Trees;
  if (!EVO || !EVO.on || !O || !Z.defs.ocean || !TR || !TR.jungle) return;
  const OC = Z.defs.ocean, SC = OC.scenes, { pk, rr, ss, lam, basic, mb } = O;
  const SEAB = -90;                  // altitude de base de la zone « ocean » : cote absolue = rel + SEAB
  const LA = 1760, LB = 1560, LF = 360;   // longueurs : le fleuve, le barrage, l'arrivee
  const F1 = 600, F2 = 1180;         // distances des deux cascades
  const mixf = (a, b, t) => a + (b - a) * t;

  // ============================================== COTES ABSOLUES ==============================================
  // surface de l'eau : 0 en amont, -24 apres la 1re chute, -54 dans la lagune ; dans le barrage elle reste a -54 (le conduit est noye) puis tombe a -112 a la sortie du canal de fuite
  const EXIT = LA + 1010, DROP = 64, DROPD = LA + LB + 30;   // v304 : la GRANDE CHUTE a l'entree du delta : l'eau tombe de 64 m
  const WY = (d) => -24 * ss(F1, F1 + 20, d) - 30 * ss(F2, F2 + 22, d) - 58 * ss(EXIT, EXIT + 6, d) - DROP * ss(DROPD, DROPD + 6, d);
  // profondeur du fleuve
  const DEP = (d) => {
    let v = 17 + 2.5 * Math.sin(d / 47);
    v = mixf(v, 7, ss(470, 596, d)); v = mixf(v, 24, ss(F1 + 4, F1 + 34, d)); v = mixf(v, 10 + 2 * Math.sin(d / 19), ss(F1 + 90, F1 + 200, d));
    v = mixf(v, 7, ss(F2 - 110, F2 - 4, d)); v = mixf(v, 30, ss(F2 + 4, F2 + 40, d)); v = mixf(v, 38, ss(F2 + 140, F2 + 420, d));
    v += 17 * Math.exp(-Math.pow((d - 300) / 55, 2)) + 20 * Math.exp(-Math.pow((d - 820) / 50, 2));   // v286 : deux fosses profondes (sous le linteau de roche, sous la grotte)
    return v;
  };
  // demi-largeur du fleuve (m) : large et calme, gorge etroite, lagune
  const HW = (d) => {
    let v = mixf(40, 33, ss(120, 520, d)); v = mixf(v, 24 + 3 * Math.sin(d / 37), ss(F1 + 20, F1 + 130, d)); v = mixf(v, 17, ss(F2 - 130, F2 - 10, d)); v = mixf(v, 66, ss(F2 + 20, F2 + 190, d));
    return v;
  };
  const PL = 40, SLOPE = 0.344;       // plateau de depart et pente de la rampe (la rampe plonge a -19 degres a partir de d = -50)
  const A0 = (d) => (d < -50 ? PL : PL - SLOPE * (d + 50));
  const WYabs = (d) => WY(d);
  // fond du couloir (sol) : la colline de la rampe se fond dans le lit du fleuve entre d = 40 et d = 100
  let BED2 = null, BED3 = null;   // lit de la zone 2 (zones_river2 plus bas), puis des zones 3 et 4 (zones_river3/4), poses apres
  const BED = (d) => {
    if (d >= LA + LB && BED3) return BED3(d);
    if (d >= LA && BED2) return BED2(d);
    const bed = WY(d) - DEP(d);
    if (d <= 40) return A0(d);
    if (d < 100) return mixf(A0(d), bed, ss(40, 100, d));
    return bed;
  };
  const PATH = (d) => WY(d) - 4.2 - 15 * Math.exp(-Math.pow((d - 292) / 42, 2)) + 2.6 * ss(500, 590, d) * (1 - ss(F1 + 2, F1 + 16, d)) + 2.6 * ss(1070, F2 - 12, d) * (1 - ss(F2 + 2, F2 + 16, d));   // trajectoire guide : remonte pres de la surface avant les chutes
  const A = (S, dc, y) => y - S.T.base(dc);        // cote absolue -> relative au sol (a la distance dc)
  const absAt = (S, dc, lx, y) => S.at(dc, lx, A(S, dc, y));   // point du monde pour une cote absolue
  EVO.riv = { DROP, DROPD, WY, BED, HW, DEP, LA, LB, LF, F1, F2, EXIT, A, absAt, SEAB, PL, PATH };
  // le niveau 2 est ce nouveau fleuve : liste des scenes, fonction d'eau, plateau de depart plat
  EVO.SCENES2 = ['rapides', 'barrage', 'delta', 'havre', 'gouffre', 'sousmarin'];
  EVO.waterFn = (d) => WY(d);
  { const _pr = EVO.preRel; EVO.preRel = (d) => (EVO.seaLevel !== undefined && d <= 0 ? A0(d) - SEAB : (_pr ? _pr(d) : 0)); }
  EVO.launchY = () => 40.9;
  EVO.padPitch = () => (EVO.isS2() ? -19 : null);
  EVO.SCENE_MOOD.rapides = 'jungle'; EVO.SCENE_AUDIO.rapides = 'evoDay'; EVO.SCENE_MOOD.arrivee = 'sea'; EVO.SCENE_AUDIO.arrivee = 'evoDay';
  EVO.addMood('jungle', { top: '#3c8ef0', hor: '#c8e8fc', fog: '#c6e4f6', near: 90, far: 460, hemiS: '#eaf5fd', hemiG: '#5a8a58', hemiI: 0.8, amb: 0.26, sunC: '#fff0d0', sunI: 0.72, night: 0 });   // v296 : lumiere moins forte (le haut des arbres, des rochers et des collines n'est plus surexpose) ; v295 : vrai ciel bleu, brume bleutee (les collines lointaines passent au bleu)
  EVO.addMood('dam', { top: '#4a7aa8', hor: '#cfd8da', fog: '#9fb0b4', near: 120, far: 560, hemiS: '#dde8ec', hemiG: '#4a5a60', hemiI: 0.9, amb: 0.22, sunC: '#ffe8c0', sunI: 0.8, night: 0 });
  EVO.addMood('pit', { top: '#2c5470', hor: '#6aa0ba', fog: '#3f7a96', near: 40, far: 560, hemiS: '#d4eefa', hemiG: '#55747e', hemiI: 1.0, amb: 0.45, sunC: '#c8e4f0', sunI: 0.5, night: 0.2 });

  // ============================================== OUTILS ==============================================
  const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const lateral = (S, dc, sg, x) => sg * x;
  const rel = (sc, fn) => { let lo = 1e9, hi = -1e9; for (let d = sc.d0; d <= sc.d1; d += 4) { const v = fn(d); if (v < lo) lo = v; if (v > hi) hi = v; } sc.rlo = lo; sc.rhi = hi; return { fn, max: Math.max(Math.abs(lo), Math.abs(hi)) }; };
  const GREEN = ['#3a8a3e', '#448f40', '#357f38', '#4a9444'], WALL = ['#b4bca4', '#aab29a', '#bcc4ac', '#a0a890'], STONE = ['#c4c6b6', '#b8baaa', '#d0d0c0', '#aeb0a0'], TEMPLE = ['#d0d0bc', '#c4c4b0', '#d8d6c2', '#bcbca8'];
  // eau : surface a niveau constant sur [a, b] (cote absolue)
  const water = (S, a, b, hw, yAbs, amp) => Z.evoWaves(S, a, b, hw, yAbs - SEAB, 'waterSurf', '#74e2d0', amp === undefined ? 0.45 : amp, true);
  // rideau de cascade : nappe verticale blanche qui coule + embruns
  const curtain = (S, dc, hw, yTop, yBot) => {
    if (!S.inClip(dc)) return;
    const cols = Math.max(4, Math.round(hw / 3)), pos = [], uv = [], ix = [], rows = 4;
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) { const lx = -hw + 2 * hw * c / cols, y = mixf(yTop, yBot, r / rows), bulge = 1.2 * Math.sin(r / rows * 3.14) + 0.35 * Math.sin(c * 1.7 + r), p = absAt(S, dc + bulge, lx, y); pos.push(p[0], p[1], p[2]); uv.push(lx / 10, (yTop - y) / 7); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, q = a + cols + 1, e = q + 1; ix.push(a, q, b, b, q, e); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(ix); const g2 = g.toNonIndexed(); g.dispose(); g2.computeVertexNormals();
    S.b.addGeometry(g2, new V(), new T3.Quaternion(), null, 'waterSurf', '#f4fbff', [1, 1]); g2.dispose();
    for (let k = 0; k < 8; k++) S.bx(dc + 2 + k * 2.2, ((k * 53) % 9 - 4) / 4 * hw * 0.75, A(S, dc, yBot + 0.13 + k * 0.012), hw * (0.3 + 0.12 * (k % 3)), 0.05, 3 + (k % 4) * 1.6, 'col:#d6e3e7', undefined, false);   // v297 : ecume mate au pied de la chute
    for (let k = -1; k <= 1; k++) S.glow(dc + 6, k * hw / 1.6, A(S, dc, yBot + 3), '#4f6369', 36);   // vapeur douce, tres peu lumineuse
    for (let k = -3; k <= 3; k++) { S.glow(dc + 4, k * hw / 3.2, yBot - A(S, dc, 0) + A(S, dc, yBot) * 0 + 0, '#ffffff', 22); S.glow(dc + 2, k * hw / 3.4, A(S, dc, yBot + 3), '#eaf8ff', 30); }   // brume au pied
  };
  // pose un arbre/une plante sur la cote absolue y
  const plant = (S, fn, dc, lx, y, size, r, o) => { const p = absAt(S, dc, lx, y); fn(S.b, p[0], p[1], p[2], size, r, o || {}); };
  // boite sur la pente : suit l'inclinaison du sol (tilt = angle du sol sous la boite)
  const slab = (S, dc, lx, yRel, w, h, dd, mat, tint, collide, extra) => {
    if (!S.inClip(dc)) return null; const T = S.T, a = Math.atan2(T.base(dc + 4) - T.base(dc - 4), 8) * 180 / Math.PI;
    return S.b.box(Object.assign({ p: T.at(dc, lx, yRel), s: [w, h, dd], r: [-a, S.yaw(dc), 0], mat, tint, collide: collide !== false }, extra || {}));
  };
  const lampS = (S, dc, lx, yRel, col, size) => { S.bx(dc, lx, yRel, 0.9, 0.4, 0.9, 'emis:' + col, undefined, false); S.glow(dc, lx, yRel, col, size || 10); };
  // cascades : secousse, rafale d'air et message au franchissement de la crete (une fois par vol)
  { const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); g._f1 = g._f2 = 0; };
    const _tk = EVO.tick; EVO.tick = (g, dt) => { _tk(g, dt); const run = g.endlessRun; if (!run || !EVO.isS2() || !g.evo || g.evo.preview || g.state !== 'FLIGHT') return; const d = run.dist;
      for (const [k, f] of [['_f1', F1], ['_f2', F2]]) if (!g[k] && d > f + 3 && d < f + 60) { g[k] = 1; g.rig.shake = Math.max(g.rig.shake, 0.9); g.audio.play('whoosh'); if (CC.L1) CC.L1.msg(g, 'CASCADE !', 1.3, '#bff4ff'); g.flash = Math.max(g.flash || 0, 0.12); g.flashColor = '#e8fbff'; } }; }
  // v286 : la plateforme de lancement est FERMEE : falaise de jungle derriere le lanceur et parois de chaque cote jusqu'au fleuve (plus de vide autour de la rampe)
  { const _tl = EVO.tick;
    EVO.tick = (g, dt) => { _tl(g, dt); if (g.sun && g.sun.castShadow && EVO.isS2()) g.sun.castShadow = false; const run = g.endlessRun; if (!run || !EVO.isS2() || !g.evo || g.evo.preview) return;   // v298 : plus d'ombre portee des falaises sur la rampe, l'eau et la fusee (grande ombre en biais au lancement)
      if (g._lfRun !== run) { g._lfRun = run;   // v293 : la rampe de lancement (d = -50 a +12) n'avait pas de sol ; v294 : meme couleur, meme eclairage et meme materiau que le sol du fleuve (aucune coupure visible)
        if (g._lf) { g.scene.remove(g._lf); g._lf.geometry.dispose(); }
        const gf = Z.defs.ocean.scenes.rapides.ground, cc = new T3.Color(), nn = [0, 1, 0], pos = [], col = [], ix = [], ds = [], lxs = []; for (let d = -56; d <= 14.01; d += 3.5) ds.push(d); for (let lx = -126; lx <= 126.01; lx += 14) lxs.push(lx);
        for (const d of ds) for (const lx of lxs) { const p = run.T.at(d, lx, 0); pos.push(p[0], A0(d) - 0.25, p[2]); Z.evoGcol(p[0], p[2], cc); gf(d, lx, cc, null); col.push(cc.r, cc.g, cc.b); }
        for (let i = 0; i < ds.length - 1; i++) for (let j = 0; j < lxs.length - 1; j++) { const a = i * lxs.length + j, b = a + 1, c = a + lxs.length, e = c + 1; ix.push(a, c, b, b, c, e); }
        { const q0 = [pos[3 * ix[0]], pos[3 * ix[0] + 1], pos[3 * ix[0] + 2]], q1 = [pos[3 * ix[1]], pos[3 * ix[1] + 1], pos[3 * ix[1] + 2]], q2 = [pos[3 * ix[2]], pos[3 * ix[2] + 1], pos[3 * ix[2] + 2]];   // v298 : sens des triangles vers le haut (avec le materiau du sol a une seule face, la rampe etait invisible vue d'en haut : le trou du lanceur)
          if ((q1[2] - q0[2]) * (q2[0] - q0[0]) - (q1[0] - q0[0]) * (q2[2] - q0[2]) < 0) for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } }
        const fg = new T3.BufferGeometry(); fg.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); fg.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); fg.setIndex(ix); fg.computeVertexNormals();
        const na = fg.attributes.normal, po = fg.attributes.position; for (let i = 0; i < na.count; i++) { Z.evoRelN(po.getX(i), po.getZ(i), nn, na.getX(i), na.getY(i), na.getZ(i)); na.setXYZ(i, nn[0], nn[1], nn[2]); }
        g._lf = new T3.Mesh(fg, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); g._lfMat = false; g.scene.add(g._lf); }
      if (g._lf && !g._lfMat) { let m = null; g.scene.traverse((o) => { if (!m && o !== g._lf && o.isMesh && o.material && o.material.polygonOffset && o.material.vertexColors && o.material.color && o.material.color.getHex() === 0xfdfdfd) m = o.material; }); if (m) { g._lf.material = m; g._lfMat = true; } }
      if (g._lcRun !== run) { g._lcRun = run; if (g._lc) { g.scene.remove(g._lc); g._lc.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
        const cols = [], G = new T3.Group(), wm = new T3.MeshLambertMaterial({ color: '#5f7550' }), gm = new T3.MeshLambertMaterial({ color: '#3f8a3c' }), cm = [new T3.MeshLambertMaterial({ color: '#2f7a34' }), new T3.MeshLambertMaterial({ color: '#3a8a3c' })];
        const seg = (d, lx, w, dd, h) => { const a = run.T.at(d, lx, 0), b = run.T.at(d + 4, lx, 0), yaw = Math.atan2(b[0] - a[0], b[2] - a[2]), y0 = run.T.base(d) - 30; const m = new T3.Mesh(new T3.BoxGeometry(w, h + 30, dd), wm); m.position.set(a[0], y0 + (h + 30) / 2, a[2]); m.rotation.y = yaw; G.add(m); cols.push(EVO.colBox(m, w, h + 30, dd, 0, 0, 0)); const t = new T3.Mesh(new T3.BoxGeometry(w + 0.4, 0.6, dd + 0.4), gm); t.position.set(a[0], y0 + h + 30.3, a[2]); t.rotation.y = yaw; G.add(t);
          for (let k = 0; k < 2; k++) { const c = new T3.Mesh(new T3.SphereGeometry(7 + 6 * hsh(d, lx + k), 8, 6), cm[k]); c.scale.y = 0.7; c.position.set(a[0] + (hsh(lx, d + k) - 0.5) * w, y0 + h + 34, a[2] + (hsh(d + k, lx) - 0.5) * dd); G.add(c); } };
        for (let d = -214; d < 78; d += 14) for (const sg of [-1, 1]) seg(d, sg * 121, 22, 14.9, 74 + 2 * Math.sin(d / 9 + sg) - run.T.base(d));
        for (let lx = -128; lx <= 128; lx += 16) seg(-214, lx, 16.6, 20, 76 + 3 * Math.sin(lx / 17) - run.T.base(-214));
        wm.visible = gm.visible = cm[0].visible = cm[1].visible = false; if (EVO.riv.launchCliffs) G.add(EVO.riv.launchCliffs(run));   // v298 : la collision reste celle des boites, la vue est celle des falaises
        g.scene.add(G); g._lc = G; EVO.addDyn(G, null, cols, { span: 600 }); }
      if (g._lc) g._lc.visible = g.state === 'FLIGHT' && run.dist < 360; };   // v298 : les falaises du depart ne sont plus dessinees une fois loin
  }
  { const _fr = EVO.frame; EVO.frame = (g, dt) => { _fr(g, dt); if (g.sun && g.sun.castShadow && EVO.isS2()) g.sun.castShadow = false; }; }   // v299 : aucune ombre portee en niveau 2, meme avant le decollage
  EVO.riv.plant = plant; EVO.riv.slab = slab; EVO.riv.lampS = lampS; EVO.riv.water = water; EVO.riv.curtain = curtain; EVO.riv.hsh = hsh;
  EVO.riv.setBed2 = (f) => { BED2 = f; }; EVO.riv.setBed3 = (f) => { BED3 = f; };
  EVO.riv.GREEN = GREEN; EVO.riv.WALL = WALL; EVO.riv.STONE = STONE; EVO.riv.TEMPLE = TEMPLE; EVO.riv.rel = rel; EVO.riv.mixf = mixf;
})();
