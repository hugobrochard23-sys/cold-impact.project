/* v370 : L'ILE (archipel, ile 1) pour la course (?mvp=r) : une vraie ile qui flotte dans le ciel, au-dessus de la prairie tres loin dessous.
 * - on DEMARRE sur l'ile (lanceur et hangar dessus) ; elle fait ~25 s de vol : route en S, descente par paliers (marches de pierre), ruisseau, chemin de terre qui contraste avec l'herbe ;
 * - le sol de l'ile est le sol du jeu (belle herbe, arbres et rochers du jeu) : la piste est a 11 m au-dessus ; dessous : roche qui s'effile (couleurs unies, aucune texture) ;
 * - pas de murs : sortir de l'ile = on tombe (la fusee pique, direction molle, le controle revient en revenant sur l'ile) ; rater l'ile = la prairie = mort ;
 * - des poteaux « COLD IMPACT CUP » et une arche de depart ; aucun batiment sur la route (un hangar a cote du depart) ; zero obstacle pour l'instant. */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mkCourse) return;
  const T3 = THREE, U = CC.U, Z = CC.Zones, TR = CC.Trees, D = Z && Z.defs && Z.defs.campagne; if (!D || !TR) return;
  const FLY = 11, TOP = 9;   // hauteur de la piste au-dessus du sol de l'ile, hauteur de la zone de vol
  // route : [longueur, virage (+ droite), pente (descente), hauteur de vol, demi-largeur du chemin, hauteur de la zone]
  E.isleShape = [[130, 0, 0, FLY, 17, TOP], [30, 0, 0.25, FLY, 17, TOP], [90, 0, 0, FLY, 17, TOP], [160, 70, 0, FLY, 17, TOP], [28, 0, 0.26, FLY, 17, TOP], [180, -95, 0, FLY, 17, TOP], [26, 0, 0.25, FLY, 17, TOP], [170, 70, 0, FLY, 17, TOP], [30, 0, 0.25, FLY, 17, TOP], [120, -30, 0, FLY, 17, TOP], [130, 0, 0, FLY, 24, TOP]];
  const S0 = -125, STREAMS = [330, 800];
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  // demi-largeur de l'ile le long de la route : bout arrondi au depart, large au depart, ondule ensuite, bout arrondi a l'arrivee
  const mkW = (dEnd) => (d) => {
    if (d <= S0 || d >= dEnd) return 0;
    let w = d < 120 ? 58 : 44 + 6 * Math.sin(d / 85) + 4 * Math.sin(d / 37 + 1) + (d < 260 ? 14 * (1 - (d - 120) / 140) : 0);
    if (d < -35) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d + 35) / (S0 + 35), 2)));
    if (d > dEnd - 70) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d - (dEnd - 70)) / 70, 2)));
    return w;
  };
  E.mkIsle = (shape) => {
    const C = E.mkCourse(shape, { fl: FLY, sw: 4 }), dEnd = C.len + 90, W = mkW(dEnd), risers = [];
    let a = 0; for (const s of shape) { if (s[2] >= 0.06) risers.push(a + s[0] * 0.5); a += s[0]; }
    C.isle = { W, dEnd, streams: STREAMS, risers, PY: C.rel(C.len) - 105 };   // PY : la prairie, tres loin dessous
    return C;
  };
  // la fusee est-elle dans la roche de l'ile ? (d : avance, x : lateral, y : hauteur absolue)
  const PROF = [[1, 0], [0.97, -1.4], [0.84, -8], [0.64, -18], [0.42, -30], [0.2, -42], [0, -52]];
  E.isleSolid = (C, T, d, x, y) => {
    const I = C.isle; if (!I) return false; const w = I.W(d); if (w <= 0) return false; const h = T.base(d) - y; if (h < 0.3 || h > 52) return false;
    let s = 0; for (let i = 1; i < PROF.length; i++) if (h <= -PROF[i][1]) { const p0 = PROF[i - 1], p1 = PROF[i]; s = p0[0] + (p1[0] - p0[0]) * (h + p0[1]) / (p1[1] - p0[1]); break; }
    return Math.abs(x) < w * s;
  };

  // ---- le decor de l'ile : scenes du jeu (herbe du sol du jeu, arbres et rochers du jeu, hangar en briques du jeu, ruisseau) ----
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const BR = ['#bba294', '#b09486', '#c4aa9c', '#ab9082'], RUST = ['#8a5a44', '#7a5a48', '#6a5240'], GR = ['#8d8a80', '#85837a', '#948f84', '#7e7b72'];
  const DIRT = new T3.Color('#b79a6b'), RIM = new T3.Color('#7d6a4a'), WATER = new T3.Color('#6fb4d8'), SAND = new T3.Color('#d9c48e');
  const tree = (S, dc, lx, r, h) => { const p = S.at(dc, lx, 0); if (r() < 0.45) TR.conifer(S.b, p[0], p[1], p[2], h, r, {}); else TR.broadleaf(S.b, p[0], p[1], p[2], h * 0.85, r, {}); };
  const rock = (S, dc, lx, s, r) => { const p = S.at(dc, lx, 0); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: pk(r, GR), noMoss: true }); };
  const hangar = (S, dc, lx) => {   // le hangar en briques du jeu, a cote du depart
    const len = 36, hw = 12, hh = 12;
    S.reserve(dc, lx, 2 * hw + 10, len + 10);
    S.item(dc, (r) => {
      const t = pk(r, BR);
      for (const s of [-1, 1]) { S.bx(dc, lx + s * (hw + 0.7), 3, 1.4, 6, len, 'brick', t, true); S.bx(dc, lx + s * (hw + 0.7), 10.5, 1.4, 3, len, 'brick', t, true); S.bx(dc, lx + s * (hw + 0.7), 7, 0.3, 3, len - 6, 'glass', undefined, false); }
      for (const e of [-1, 1]) S.wall(dc + e * len / 2, lx - hw - 1.4, lx + hw + 1.4, 0, hh + 2, 1.6, 'brick', t, { lx, yc: 5.5, w: 22, h: 11 });
      S.bx(dc, lx, hh + 0.4, 2 * hw + 3, 0.8, len + 2, 'corrugated', pk(r, RUST), true); S.bx(dc, lx, 0.14, 2 * hw, 0.3, len, 'concrete', '#a0a29e', false);
      for (let k = -1; k <= 1; k++) S.glow(dc + k * 11, lx, hh - 2.4, '#ffe2a8', 14);
    });
  };
  const sceneDef = {
    len: [300, 300], noDoor: true, noChaos: true, gw: 46,
    gwF: (d) => { const C = E.course; return C && C.isle ? C.isle.W(d) : 46; },   // le sol suit le contour de l'ile (zones_evo.js)
    ground: (d, lx, c) => {
      const C = E.course, I = C && C.isle; if (!I) return; const w = I.W(d), rd = 6 + 1.5 * Math.sin(d / 26), a = Math.abs(lx);
      if (a < rd) c.lerp(DIRT, 0.88); else if (a < rd + 2.4) c.lerp(DIRT, 0.3);   // le chemin de terre contraste avec l'herbe
      for (const sd of I.streams) { const q = Math.abs(d - sd); if (q < 7) c.lerp(WATER, 0.9); else if (q < 11) c.lerp(SAND, 0.65 * (1 - (q - 7) / 4)); }
      if (a > w - 4) c.lerp(RIM, Math.min(0.8, (a - (w - 4)) / 3));   // le bord de l'ile : terre
    },
    build(S) {
      const C = E.course; if (!C || !C.isle) return; const I = C.isle;
      if (S.d0 <= 40 && S.d1 > 40) hangar(S, 40, -36);
      for (const sg of [-1, 1]) {
        S.rows(S.d0 + 4, Math.min(S.d1, I.dEnd - 20), 13, 0.9, (dc) => S.item(dc, (r) => {   // arbres du jeu : jamais sur le chemin, jamais au bord du vide
          const w = I.W(dc); if (w < 30) return; const lx = sg * r.between([24, Math.max(26, w - 7)]); if (dc > -10 && dc < 78 && sg < 0 && lx < -16) return; for (const sd of I.streams) if (Math.abs(dc - sd) < 14) return;
          tree(S, dc, lx, r, r.between([9, 16]));
        }));
        S.rows(S.d0 + 6, Math.min(S.d1, I.dEnd - 20), 23, 0.8, (dc) => S.item(dc, (r) => { const w = I.W(dc); if (w < 24) return; rock(S, dc, sg * r.between([w - 10, w - 3]), r.between([2, 4.5]), r); }));   // rochers de bord
      }
      for (const dr of I.risers) if (dr >= S.d0 && dr < S.d1) { const w = I.W(dr), n = Math.floor(w / 6); for (let k = -n; k <= n; k++) S.item(dr + k * 0.01, (r) => rock(S, dr + 6, k * 6.2 + r.between([-1.5, 1.5]), r.between([1.8, 3]), r)); }   // les marches : une rangee de pierres en bas de chaque palier
      for (const sd of I.streams) if (sd >= S.d0 && sd < S.d1) Z.evoWaves(S, sd - 7, sd + 7, I.W(sd) - 1.5, C.rel(sd) + 0.2, 'waterSurf', '#7cc0e8', 0.4);
    },
  };
  for (let i = 0; i < 6; i++) D.scenes['crsI' + i] = Object.assign({}, sceneDef);
  E.isleScenes = Array.from({ length: 6 }, (_, i) => 'crsI' + i);

  // ---- ce qui n'est pas dans le decor du jeu : le dessous de l'ile, la prairie, les poteaux et l'arche ----
  const bodyMesh = (T, C) => {
    const I = C.isle, pos = [], col = [], rings = [], step = 6, ROCK = ['#9a8f80', '#85796b', '#6f655a', '#5c534b'], SOIL = '#7a5233', cc = new T3.Color();
    for (let d = S0; d <= I.dEnd + 0.1; d += step) {
      const w = I.W(d), y0 = T.base(d), ring = [];
      for (let k = 0; k < PROF.length; k++) for (const sg of (k === PROF.length - 1 ? [0] : [-1, 1])) {
        const jx = k < 2 ? 0 : (hash(d, k * 3 + sg) - 0.5) * 0.18, jy = k < 2 ? 0 : (hash(k, d + sg) - 0.5) * 4;
        const lx = sg * w * PROF[k][0] * (1 + jx), p = T.at(d, lx, PROF[k][1] + jy - (y0 - T.base(d)));
        ring.push({ k, sg, p });
      }
      rings.push(ring);
    }
    const push = (a, b, c, k) => { cc.set(k < 1 ? SOIL : ROCK[Math.min(3, Math.max(0, k - 1))]); const j = 1 + (hash(a.p[0], a.p[2]) - 0.5) * 0.28; for (const v of [a, b, c]) { pos.push(v.p[0], v.p[1], v.p[2]); col.push(cc.r * j, cc.g * j, cc.b * j); } };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1]; if (A.length !== B.length) continue;
      for (const sgn of [-1, 1]) {   // un cote a la fois : les anneaux sont [k=0 gauche, k=0 droite, k=1 gauche, ..., pointe]
        for (let k = 0; k < PROF.length - 1; k++) {
          const idx = (kk, s) => (kk === PROF.length - 1 ? A.length - 1 : kk * 2 + (s < 0 ? 0 : 1)), i0 = idx(k, sgn), i1 = idx(k + 1, sgn);
          push(A[i0], B[i0], A[i1], k); push(B[i0], B[i1], A[i1], k);
        }
      }
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; return m;
  };
  const prairie = (T, C) => {   // la prairie tres loin dessous : couleurs du sol du jeu
    const I = C.isle, N = 40, SZ = 2400, geo = new T3.PlaneGeometry(SZ, SZ, N, N); geo.rotateX(-Math.PI / 2);
    let sx = 0, sz = 0, n = 0; for (let d = 0; d < I.dEnd; d += 60) { const p = T.at(d, 0, 0); sx += p[0]; sz += p[2]; n++; } sx /= n; sz /= n;
    const p = geo.attributes.position, c = new Float32Array(p.count * 3), q = new T3.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + sx, z = p.getZ(i) + sz; Z.evoGcol(x, z, q); c[i * 3] = q.r; c[i * 3 + 1] = q.g; c[i * 3 + 2] = q.b; p.setXYZ(i, x, I.PY, z); }
    geo.setAttribute('color', new T3.BufferAttribute(c, 3)); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true })); m.frustumCulled = false; return m;
  };
  let _tex = null;
  const bannerTex = () => _tex || (_tex = (() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#7a3cf0'); gr.addColorStop(1, '#2f8cff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 160); g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 148, 512, 12);
    g.fillStyle = '#ffffff'; g.font = '800 62px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COLD IMPACT', 256, 62); g.fillStyle = '#ffd23a'; g.font = '800 46px Arial, sans-serif'; g.fillText('CUP', 256, 116);
    const t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t;
  })());
  const pole = (h, col) => new T3.Mesh(new T3.CylinderGeometry(0.28, 0.4, h, 8), new T3.MeshLambertMaterial({ color: col }));
  E.buildIsle = (T, C, grp) => {
    const I = C.isle, out = { isle: true, blocks: [], obst: [] };
    grp.add(bodyMesh(T, C)); grp.add(prairie(T, C));
    const bm = new T3.MeshBasicMaterial({ map: bannerTex(), side: T3.DoubleSide, fog: false });
    const place = (d, lx, objs) => { const y = T.base(d), p = T.at(d, lx, 0), q = T.at(d + 3, lx, 0), g = new T3.Group(); g.position.set(p[0], y, p[2]); g.lookAt(q[0], y, q[2]); grp.add(g); for (const o of objs) g.add(o); return g; };   // +Z = devant, +X = gauche
    for (let d = 90; d < C.len - 40; d += 70) for (const sg of [-1, 1]) {   // poteaux de course : un drapeau « COLD IMPACT CUP » tourne vers la fusee qui arrive
      if (I.W(d) < 30) continue; const lx = sg * 21, po = pole(11, '#e8e8f0'), fl = new T3.Mesh(new T3.PlaneGeometry(6.4, 2), bm); po.position.y = 5.5; fl.position.set(-sg * 3.3, 9.6, 0); fl.rotation.y = Math.PI;
      place(d, lx, [po, fl]);
    }
    { const pl = [pole(24, '#ffd23a'), pole(24, '#ffd23a')], ban = new T3.Mesh(new T3.PlaneGeometry(38, 11.8), bm); pl[0].position.set(19.5, 12, 0); pl[1].position.set(-19.5, 12, 0); ban.position.set(0, 20, 0); ban.rotation.y = Math.PI; place(-6, 0, [pl[0], pl[1], ban]); }   // l'arche de depart
    out.update = () => { };
    return out;
  };
})();
