/* v368 : PARCOURS DE COURSE : une trajectoire 3D continue (virages permanents, descente, vide visible) decrite par une suite de segments.
 * Le decor du jeu (prairie, camp...) reste celui des scenes existantes ; on ne change que la forme de la piste : cap, pente, hauteur au-dessus du sol,
 * largeur du couloir. Le couloir est dessine avec un sol et des murs de couleur unie (aucune texture). Sans E.course actif, rien ne change. */
(function () {
  const E = CC.EVO; if (!E || !E.on || !CC.Endless || !CC.Endless.Track) return;
  const T3 = THREE, U = CC.U, DEG = Math.PI / 180;
  E.course = null;
  // segs : [longueur m, virage total en degres (+ = droite), pente (m de descente par m), hauteur de la piste au-dessus du sol, demi-largeur du couloir]
  E.mkCourse = (segs, opt) => {
    opt = opt || {}; let tot = 0; for (const s of segs) tot += s[0];
    const N = Math.ceil(tot) + 700, rate = new Float32Array(N), slope = new Float32Array(N), lift = new Float32Array(N), hw = new Float32Array(N), wh = new Float32Array(N);
    let i = 0; for (const s of segs) { const n = Math.round(s[0]); for (let k = 0; k < n && i < N; k++, i++) { rate[i] = s[1] * DEG / s[0]; slope[i] = s[2]; lift[i] = s[3]; hw[i] = s[4]; wh[i] = s[5] === undefined ? 6.5 : s[5]; } }
    const last = segs[segs.length - 1]; for (; i < N; i++) { rate[i] = 0; slope[i] = last[2] * 0.2; lift[i] = last[3]; hw[i] = last[4]; wh[i] = last[5] === undefined ? 6.5 : last[5]; }
    const smooth = (a, w) => { const b = new Float32Array(a.length); let acc = 0, cnt = 0; const get = (k) => a[Math.max(0, Math.min(a.length - 1, k))]; for (let k = -w; k <= w; k++) { acc += get(k); cnt++; } for (let k = 0; k < a.length; k++) { b[k] = acc / cnt; acc += get(k + w + 1) - get(k - w); } return b; };
    const rS = smooth(smooth(rate, 22), 22), sS = smooth(smooth(slope, 18), 18), lS = smooth(smooth(lift, 26), 26), hS = smooth(hw, 22), wS = smooth(wh, 14);
    const th = new Float32Array(N + 1), rel = new Float32Array(N + 1); for (let k = 0; k < N; k++) { th[k + 1] = th[k] + rS[k]; rel[k + 1] = rel[k] - sS[k]; }
    const at = (A, d) => { if (d <= 0) return A[0]; const k = Math.min(N - 1, Math.floor(d)), f = Math.min(1, d - k); return A[k] + (A[k + 1 < A.length ? k + 1 : k] - A[k]) * f; };
    const lf = (A) => (d) => { if (d <= 0) return A[0]; const k = Math.min(N - 2, Math.floor(d)); return A[k] + (A[k + 1] - A[k]) * (d - k); };
    return { len: tot, th: (d) => at(th, d), rel: (d) => at(rel, d), lift: lf(lS), hw: lf(hS), wh: lf(wS), rate: lf(rS), slope: lf(sS), fl: opt.fl || 5.6 };
  };
  const TP = CC.Endless.Track.prototype, _th = TP.theta, _rel = TP.rel, _lx = TP.laneX, _ly = TP.laneY, _cx = TP.cx, _vol = TP.vol, _env = TP.env;
  TP.theta = function (d) { return E.course ? E.course.th(d) : _th.call(this, d); };
  TP.rel = function (d) { return E.course ? E.course.rel(d) : _rel.call(this, d); };
  TP.laneX = function (d) { return E.course ? 0 : _lx.call(this, d); };
  TP.laneY = function (d) { return E.course ? E.course.lift(d) : _ly.call(this, d); };
  TP.cx = function (d) { return E.course ? 0 : _cx.call(this, d); };
  TP.vol = function (d) { return E.course ? E.course.hw(Math.max(0, d)) + 140 : _vol.call(this, d); };   // les murs du monde sont loin derriere le couloir

  TP.env = function (zi) { const e = _env.call(this, zi); if (E.course && e && !e._crs) { e._crs = 1; if (e.fog) e.fog.color = '#c4e2f8'; if (e.sky) { e.sky.top = '#3f9bf0'; e.sky.horizon = '#d4ecff'; e.sky.bottom = '#b9dcf6'; } } return e; };   // ciel bleu clair (au lieu du gris-vert)
  if (CC.Pieces && CC.Pieces.far) { const _far = CC.Pieces.far; CC.Pieces.far = function () { if (!E.course) return _far.apply(this, arguments); }; }   // pas de grandes silhouettes grises au loin : on voit la prairie loin en dessous

  // le sol : une bande verte etroite sous le couloir (un sol large se replie sur lui-meme dans les virages serres : grandes facettes grises)
  { const Z = CC.Zones, defs = Z && Z.defs && Z.defs.campagne; if (defs) for (const k of Object.keys(defs.scenes)) { const sc = defs.scenes[k]; if (!sc || Object.getOwnPropertyDescriptor(sc, '__crs')) continue; const g0 = sc.gw; try { Object.defineProperty(sc, '__crs', { value: 1 }); Object.defineProperty(sc, 'gw', { configurable: true, enumerable: true, get() { return E.course ? 44 : g0; }, set(v) { /* fixe */ } }); } catch (e) { /* ignore */ } } }

  // le couloir : un sol bleu a tirets, des murs bleu et blanc ; tout en couleurs unies (pas de texture)
  const C_FLOOR = new T3.Color('#2f6fd8'), C_DASH = new T3.Color('#cfe6ff'), C_W1 = new T3.Color('#ffffff'), C_W2 = new T3.Color('#2f8cff'), C_EDGE = new T3.Color('#ffd23a');
  E.buildCorridor = (T, course, d0, d1, grp) => {
    const STEP = 3, n = Math.ceil((d1 - d0) / STEP) + 1, pos = [], col = [], idx = [];
    const vert = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
    const strip = (rows) => { for (let k = 0; k < rows.length - 1; k++) { const a = rows[k], b = rows[k + 1]; idx.push(a[0], a[1], b[0], a[1], b[1], b[0]); } };
    const floorRows = [[], [], [], []], wallL = [], wallR = [], capL = [], capR = [];
    // 3 bandes de sol : bord gauche, centre (tirets), bord droit
    const edge = [[], [], [], []];
    for (let k = 0; k < n; k++) {
      const d = d0 + k * STEP, w = course.hw(d) + 0.9, y0 = T.laneY(d) - course.fl, yt = T.laneY(d) + course.wh(d), dash = (Math.floor(d / 9) % 2) === 0, wc = (Math.floor(d / 12) % 2) === 0 ? C_W1 : C_W2;
      const cl = dash ? C_DASH : C_FLOOR;
      const pL = T.at(d, -w, y0), pl = T.at(d, -1.1, y0), pr = T.at(d, 1.1, y0), pR = T.at(d, w, y0);
      floorRows[0].push([vert(pL, C_EDGE), vert(pl, C_FLOOR)]); floorRows[1].push([vert(pl, cl), vert(pr, cl)]); floorRows[2].push([vert(pr, C_FLOOR), vert(pR, C_EDGE)]);
      wallL.push([vert(pL, wc), vert(T.at(d, -w, yt), wc)]); wallR.push([vert(pR, wc), vert(T.at(d, w, yt), wc)]);
    }
    const quad = (rows) => { for (let k = 0; k < rows.length - 1; k++) { const a = rows[k], b = rows[k + 1]; idx.push(a[0], b[0], a[1], a[1], b[0], b[1]); } };
    quad(floorRows[0]); quad(floorRows[1]); quad(floorRows[2]); quad(wallL); quad(wallR);
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; grp.add(m); return m;
  };
})();
