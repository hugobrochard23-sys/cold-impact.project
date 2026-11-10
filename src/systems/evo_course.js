/* v369 : PARCOURS DE COURSE : une trajectoire 3D continue (virages permanents, descente, vide visible) decrite par une suite de segments.
 * - le couloir (sol bleu a tirets, murs bleu et blanc, bords jaunes) est en couleurs unies (aucune texture) ;
 * - un decor a nous (arbres, rochers du jeu) sur une bande verte etroite loin sous la piste ; pas d'ennemis de decor, pas de silhouettes grises ;
 * - des obstacles dans le couloir (pilier, portique, barre), des blocs chance, des RACCOURCIS (une ouverture dans le mur, on vole librement jusqu'a l'entree) ;
 * - la piste peut repasser sous elle-meme (le sol de la piste est loin au-dessus).
 * Sans E.course actif, rien ne change. */
(function () {
  const E = CC.EVO; if (!E || !E.on || !CC.Endless || !CC.Endless.Track) return;
  const T3 = THREE, U = CC.U, DEG = Math.PI / 180;
  E.course = null;
  // segs : [longueur m, virage total en degres (+ = droite), pente (m de descente par m), hauteur de la piste au-dessus du sol, demi-largeur du couloir, hauteur des murs]
  E.mkCourse = (segs, opt) => {
    opt = opt || {}; let tot = 0; for (const s of segs) tot += s[0];
    const N = Math.ceil(tot) + 700, rate = new Float32Array(N), slope = new Float32Array(N), lift = new Float32Array(N), hw = new Float32Array(N), wh = new Float32Array(N), starts = [];
    let i = 0; for (const s of segs) { const n = Math.round(s[0]); starts.push(i); for (let k = 0; k < n && i < N; k++, i++) { rate[i] = s[1] * DEG / s[0]; slope[i] = s[2]; lift[i] = s[3]; hw[i] = s[4]; wh[i] = s[5] === undefined ? 6.5 : s[5]; } }
    const last = segs[segs.length - 1]; for (; i < N; i++) { rate[i] = 0; slope[i] = last[2] * 0.2; lift[i] = last[3]; hw[i] = last[4]; wh[i] = last[5] === undefined ? 6.5 : last[5]; }
    const smooth = (a, w) => { const b = new Float32Array(a.length); let acc = 0, cnt = 0; const get = (k) => a[Math.max(0, Math.min(a.length - 1, k))]; for (let k = -w; k <= w; k++) { acc += get(k); cnt++; } for (let k = 0; k < a.length; k++) { b[k] = acc / cnt; acc += get(k + w + 1) - get(k - w); } return b; };
    const rS = smooth(smooth(rate, 22), 22), sS = smooth(smooth(slope, opt.sw || 18), opt.sw || 18), lS = smooth(smooth(lift, 26), 26), hS = smooth(hw, 22), wS = smooth(wh, 14);
    const th = new Float32Array(N + 1), rel = new Float32Array(N + 1), px = new Float32Array(N + 1), pz = new Float32Array(N + 1);
    for (let k = 0; k < N; k++) { th[k + 1] = th[k] + rS[k]; rel[k + 1] = rel[k] - sS[k]; px[k + 1] = px[k] + Math.sin(th[k] + rS[k] / 2); pz[k + 1] = pz[k] - Math.cos(th[k] + rS[k] / 2); }
    const at = (A, d) => { if (d <= 0) return A[0]; const k = Math.min(N - 1, Math.floor(d)), f = Math.min(1, d - k); return A[k] + (A[k + 1 < A.length ? k + 1 : k] - A[k]) * f; };
    const lf = (A) => (d) => { if (d <= 0) return A[0]; const k = Math.min(N - 2, Math.floor(d)); return A[k] + (A[k + 1] - A[k]) * (d - k); };
    const C = { len: tot, th: (d) => at(th, d), rel: (d) => at(rel, d), lift: lf(lS), hw: lf(hS), wh: lf(wS), rate: lf(rS), slope: lf(sS), fl: opt.fl || 5.6, segs, starts, N,
      plan: (d) => [at(px, d), at(pz, d)], y: (d) => at(rel, d) + lf(lS)(d), obst: [], blocks: [], cuts: [] };
    return C;
  };
  // ---- obstacles, blocs chance et raccourcis (generes de facon deterministe a partir de la forme) ----
  let _s = 1; const rnd = () => (_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cutOK = (C, dA, dB, side) => {   // le trajet libre de la sortie A a l'entree B : droit, pas trop vers l'arriere, pas de croisement du couloir
    const a = C.plan(dA), b = C.plan(dB), ya = C.y(dA), yb = C.y(dB), dx = b[0] - a[0], dz = b[1] - a[1], ch = Math.hypot(dx, dz); if (ch < 70) return null;
    const tA = [Math.sin(C.th(dA)), -Math.cos(C.th(dA))], tB = [Math.sin(C.th(dB)), -Math.cos(C.th(dB))], u = [dx / ch, dz / ch];
    const angA = Math.acos(U.clamp(tA[0] * u[0] + tA[1] * u[1], -1, 1)) / DEG, angB = Math.acos(U.clamp(tB[0] * u[0] + tB[1] * u[1], -1, 1)) / DEG;
    if (angA > 62 || angB > 55) return null; if ((dB - dA) - ch < 90) return null;
    const drop = ya - yb, pitch = Math.atan2(drop, ch) / DEG; if (pitch < -8 || pitch > 38) return null;
    for (let t = 0.06; t < 0.95; t += 0.03) {   // la ligne ne traverse pas le couloir (meme hauteur, hors des deux ouvertures)
      const x = a[0] + dx * t, z = a[1] + dz * t, y = ya - drop * t;
      for (let d = 0; d < C.len + 20; d += 6) { if (Math.abs(d - dA) < 36 || Math.abs(d - dB) < 36) continue; const q = C.plan(d); if (Math.hypot(q[0] - x, q[1] - z) < C.hw(d) + 6 && Math.abs(C.y(d) - y) < 14) return null; }
    }
    return { dA, dB, side, len: 16, chord: ch, angA, angB, pitch };
  };
  E.courseExtras = (C, seed) => {
    _s = (seed || 7) >>> 0; C.obst = []; C.blocks = []; C.cuts = [];
    // raccourcis : on cherche des paires (sortie, entree) qui font gagner du chemin
    const found = [];
    for (let dA = 160; dA < C.len - 330; dA += 12) for (let dB = dA + 120; dB < Math.min(C.len - 150, dA + 460); dB += 12) {
      for (const side of [-1, 1]) { const th0 = C.th(dA + 40) - C.th(dA - 10); if (th0 * side < 0.04) continue; const c = cutOK(C, dA, dB, side); if (c) { c.gain = (dB - dA) - c.chord; found.push(c); } }
    }
    found.sort((a, b) => b.gain - a.gain); const used = [];
    for (const c of found) { if (C.cuts.length >= 2) break; if (used.some((u) => c.dB > u.dA - 60 && c.dA < u.dB + 60)) continue; C.cuts.push(c); used.push(c); }
    C.cuts.sort((a, b) => a.dA - b.dA);
    const inCut = (d, m) => C.cuts.some((c) => Math.abs(d - c.dA - 8) < 46 + (m || 0) || Math.abs(d - c.dB - 8) < 46 + (m || 0));
    const kinds = ['pilier', 'portique', 'barre', 'pilier', 'portique', 'barre', 'portique'];
    let ki = 0;
    for (let d = 250; d < C.len - 230; d += 118 + Math.floor(rnd() * 40)) {
      if (inCut(d, 8) || C.hw(d) < 6.5) continue; const hw = C.hw(d), kind = kinds[ki++ % kinds.length], x = (rnd() < 0.5 ? -1 : 1) * hw * (0.25 + 0.3 * rnd());
      C.obst.push({ d, kind, x, yc: kind === 'portique' ? -0.5 + rnd() * 3 : 0, dd: kind === 'pilier' ? 3.4 : 2.4 });
    }
    for (let d = 190; d < C.len - 200; d += 150 + Math.floor(rnd() * 50)) {
      if (inCut(d, 0) || C.obst.some((o) => Math.abs(o.d - d) < 40) || C.hw(d) < 6) continue;
      const hw = C.hw(d), xs = hw > 9 ? [-hw * 0.45, 0, hw * 0.45] : [-hw * 0.4, hw * 0.4]; for (const x of xs) C.blocks.push({ d, x, y: 0.2 });
    }
    return C;
  };
  // boites des obstacles dans le repere de la piste : [x0, x1, y0, y1] (en largeur et en hauteur par rapport a la piste)
  E.obstBoxes = (C, o) => {
    const hw = C.hw(o.d) + 0.9, lo = -C.fl, hi = C.wh(o.d);
    if (o.kind === 'pilier') return [[o.x - 1.7, o.x + 1.7, lo, hi]];
    if (o.kind === 'barre') return [[-hw, hw, 0.4, 2.3]];
    return [[-hw, o.x - 4.2, lo, hi], [o.x + 4.2, hw, lo, hi], [o.x - 4.2, o.x + 4.2, lo, o.yc - 3.2], [o.x - 4.2, o.x + 4.2, o.yc + 3.2, hi]];
  };
  E.obstHit = (C, o, relx, rely, r) => { for (const b of E.obstBoxes(C, o)) if (relx > b[0] - r && relx < b[1] + r && rely > b[2] - r && rely < b[3] + r) return true; return false; };
  E.cutAt = (C, d) => { for (const c of C.cuts) if (d > c.dA - 4 && d < c.dA + c.len + 4) return c; return null; };

  const TP = CC.Endless.Track.prototype, _th = TP.theta, _rel = TP.rel, _lx = TP.laneX, _ly = TP.laneY, _cx = TP.cx, _vol = TP.vol, _env = TP.env;
  TP.theta = function (d) { return E.course ? E.course.th(d) : _th.call(this, d); };
  TP.rel = function (d) { return E.course ? E.course.rel(d) : _rel.call(this, d); };
  TP.laneX = function (d) { return E.course ? 0 : _lx.call(this, d); };
  TP.laneY = function (d) { return E.course ? E.course.lift(d) : _ly.call(this, d); };
  TP.cx = function (d) { return E.course ? 0 : _cx.call(this, d); };
  TP.vol = function (d) { return E.course ? E.course.hw(Math.max(0, d)) + 140 : _vol.call(this, d); };   // les murs du monde sont loin derriere le couloir
  TP.env = function (zi) { const e = _env.call(this, zi); if (E.course && e && !e._crs) { e._crs = 1; if (e.fog) e.fog.color = '#c4e2f8'; if (e.sky) { e.sky.top = '#3f9bf0'; e.sky.horizon = '#d4ecff'; e.sky.bottom = '#b9dcf6'; } } return e; };   // ciel bleu clair (au lieu du gris-vert)
  if (CC.Pieces && CC.Pieces.far) { const _far = CC.Pieces.far; CC.Pieces.far = function () { if (!E.course) return _far.apply(this, arguments); }; }   // pas de grandes silhouettes grises au loin

  { let nh = !!E.noHorizon; try { Object.defineProperty(E, 'noHorizon', { configurable: true, get() { return !!E.course || nh; }, set(v) { nh = v; } }); } catch (e) { /* ignore */ } }   // pas d'anneau d'horizon (collines et pins peints) : on est loin au-dessus du sol
  if (CC.Scenery && CC.Scenery.side) { const _sd = CC.Scenery.side; CC.Scenery.side = function () { if (!E.course) return _sd.apply(this, arguments); }; }   // pas de grands blocs gris sur les cotes
  if (CC.Zones && CC.Zones.backdrop) { const _bd = CC.Zones.backdrop; CC.Zones.backdrop = function () { if (!E.course) return _bd.apply(this, arguments); }; }
  { const Z = CC.Zones, D = Z && Z.defs && Z.defs.campagne;   // les « grandes falaises » de 1000 m de haut de chaque cote de la prairie (skyCliffs) : coupees, on voit le ciel et la prairie
    if (D && D.dress) { const _dr = D.dress; D.dress = function (S) { if (!E.course) return _dr.apply(this, arguments); if (E.course.isle) return; S.bxr = function () { return null; }; return _dr.apply(this, arguments); }; } }   // v370 : on ne rend pas bxr : les falaises sont creees plus tard (S.item differe) et seraient revenues
  // le decor : des scenes a nous (campagne) : arbres et rochers du jeu sur la bande verte, jamais dans le couloir ; aucun ennemi
  { const Z = CC.Zones, D = Z && Z.defs && Z.defs.campagne, TR = CC.Trees;
    if (D && TR) {
      const GR = ['#8d8a80', '#85837a', '#948f84', '#7e7b72'];
      const def = { len: [300, 300], noDoor: true, noChaos: true, gw: 44, build(S) {
        const C = E.course; if (!C) return;
        for (const sg of [-1, 1]) {
          S.rows(S.d0 + 6, S.d1, 11, 0.9, (dc) => S.item(dc, (r) => {
            const hw = C.hw(dc), lx = sg * (hw + r.between([4, 40])), h = r.between([11, 26]), p = S.at(dc, lx, 0);
            if (Math.abs(lx) < hw + 8 && C.lift(dc) - C.fl < h + 4) return;   // jamais d'arbre dans le couloir
            if (r() < 0.45) TR.conifer(S.b, p[0], p[1], p[2], h, r, {}); else TR.broadleaf(S.b, p[0], p[1], p[2], h * 0.85, r, {});
          }));
          S.rows(S.d0 + 4, S.d1, 24, 0.8, (dc) => S.item(dc, (r) => {
            const hw = C.hw(dc), lx = sg * (hw + r.between([6, 36])), s = r.between([2.5, 6]), p = S.at(dc, lx, 0);
            if (Math.abs(lx) < hw + 8 && C.lift(dc) - C.fl < s * 2 + 3) return;
            TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: GR[Math.floor(r() * GR.length)], noMoss: true });
          }));
        }
      } };
      for (let i = 0; i < 10; i++) D.scenes['crs' + i] = Object.assign({}, def);
      D.scenes.crsI = Object.assign({}, def, { gw: 170 });   // l'ile : la prairie large loin sous la piste
      E.courseScenes = Array.from({ length: 10 }, (_, i) => 'crs' + i);
    } }

  // ---- le couloir : un sol bleu a tirets, des murs bleu et blanc, des ouvertures de raccourci ----
  const C_FLOOR = new T3.Color('#2f6fd8'), C_DASH = new T3.Color('#cfe6ff'), C_W1 = new T3.Color('#ffffff'), C_W2 = new T3.Color('#2f8cff'), C_EDGE = new T3.Color('#ffd23a'), C_OUT = new T3.Color('#ff7a1a'), C_IN = new T3.Color('#43e05a');
  E.buildCorridor = (T, course, d0, d1, grp) => {
    const STEP = 3, n = Math.ceil((d1 - d0) / STEP) + 1, pos = [], col = [], idx = [];
    const vert = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
    const F = [[], [], []], WL = [], WR = [], ds = [];
    for (let k = 0; k < n; k++) {
      const d = d0 + k * STEP, w = course.hw(d) + 0.9, y0 = T.laneY(d) - course.fl, yt = T.laneY(d) + course.wh(d), dash = (Math.floor(d / 9) % 2) === 0, wc = (Math.floor(d / 12) % 2) === 0 ? C_W1 : C_W2, cl = dash ? C_DASH : C_FLOOR;
      ds.push(d);
      const pL = T.at(d, -w, y0), pl = T.at(d, -1.1, y0), pr = T.at(d, 1.1, y0), pR = T.at(d, w, y0);
      F[0].push([vert(pL, C_EDGE), vert(pl, C_FLOOR)]); F[1].push([vert(pl, cl), vert(pr, cl)]); F[2].push([vert(pr, C_FLOOR), vert(pR, C_EDGE)]);
      let cL = wc, cR = wc; for (const c of course.cuts) { const nearA = d > c.dA - 7 && d < c.dA + c.len + 7, nearB = d > c.dB - 7 && d < c.dB + c.len + 7; if (nearA) { if (c.side < 0) cL = C_OUT; else cR = C_OUT; } if (nearB) { if (c.side < 0) cL = C_IN; else cR = C_IN; } }
      WL.push([vert(pL, cL), vert(T.at(d, -w, yt), cL)]); WR.push([vert(pR, cR), vert(T.at(d, w, yt), cR)]);
    }
    const quad = (rows, skip) => { for (let k = 0; k < rows.length - 1; k++) { if (skip && skip(ds[k], ds[k + 1])) continue; const a = rows[k], b = rows[k + 1]; idx.push(a[0], b[0], a[1], a[1], b[0], b[1]); } };
    const open = (side) => (d0_, d1_) => course.cuts.some((c) => c.side === side && ((d0_ >= c.dA && d1_ <= c.dA + c.len + 3) || (d0_ >= c.dB && d1_ <= c.dB + c.len + 3)));
    quad(F[0]); quad(F[1]); quad(F[2]); quad(WL, open(-1)); quad(WR, open(1));
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; grp.add(m); return m;
  };
  const _fw = new T3.Vector3(), _pp = new T3.Vector3();
  const laneGroup = (T, d, grp) => { const g = new T3.Group(), p = T.at(d, 0, T.laneY(d)), q = T.at(d + 3, 0, T.laneY(d)); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); grp.add(g); return g; };   // +Z local = devant ; +X local = GAUCHE
  const box = (w, h, dd, col) => new T3.Mesh(new T3.BoxGeometry(w, h, dd), new T3.MeshLambertMaterial({ color: col }));
  // les obstacles, les blocs chance et les guides de raccourci
  E.buildCourseProps = (T, course, grp) => {
    const out = { blocks: [], obst: [] };
    for (const o of course.obst) {
      const g = laneGroup(T, o.d, grp), col = o.kind === 'pilier' ? '#ff7a1a' : o.kind === 'barre' ? '#ffd23a' : '#ff3b30';
      for (const b of E.obstBoxes(course, o)) { const w = b[1] - b[0], h = b[3] - b[2], m = box(w, h, o.dd, col); m.position.set(-(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, 0); g.add(m); }
      if (o.kind === 'portique') { const f = box(8.4 + 0.8, 0.5, o.dd + 0.4, '#ffffff'); f.position.set(-o.x, o.yc + 3.2, 0); g.add(f); const f2 = f.clone(); f2.position.y = o.yc - 3.2; g.add(f2); }
      out.obst.push(o);
    }
    for (const bl of course.blocks) {
      const g = laneGroup(T, bl.d, grp), m = box(2.4, 2.4, 2.4, '#ffc21a'); m.material = new T3.MeshBasicMaterial({ color: '#ffc21a' }); g.add(m);
      const inner = box(1.5, 1.5, 1.5, '#ffffff'); inner.material = new T3.MeshBasicMaterial({ color: '#ff4fd8' }); m.add(inner); inner.rotation.set(0.6, 0.6, 0);
      g.position.add(_fw.set(0, 0, 0)); const q = T.at(bl.d, bl.x, T.laneY(bl.d) + bl.y); g.position.set(q[0], q[1], q[2]); out.blocks.push({ d: bl.d, x: bl.x, y: bl.y, g, m, taken: false });
    }
    for (const c of course.cuts) {   // l'entree : un grand anneau vert ; le trajet : des fleches
      const g = laneGroup(T, c.dB + c.len / 2, grp), ring = new T3.Mesh(new T3.TorusGeometry(Math.max(7, course.hw(c.dB) + 1.5), 0.5, 8, 40), new T3.MeshBasicMaterial({ color: '#43e05a' })); g.add(ring);
      const a = T.at(c.dA + c.len / 2, 0, T.laneY(c.dA)), b = T.at(c.dB + c.len / 2, 0, T.laneY(c.dB + c.len / 2));
      for (let k = 1; k <= 4; k++) { const t = k / 5, ar = CC.Models.guideArrow(); ar.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); ar.lookAt(b[0], b[1], b[2]); ar.scale.setScalar(2.2); grp.add(ar); }
    }
    return out;
  };
})();
