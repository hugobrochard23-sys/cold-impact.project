/* v295/v296 : NIVEAU 2 : LE SOL DE LA JUNGLE. Un seul sol continu (meme texture d'herbe, meme couleur lissee partout) :
 *  - les TERRASSES de berge (de la falaise jusqu'a 150 m de l'axe) : bandes de maillage qui suivent le fleuve, a la hauteur exacte du sommet de la falaise (la collision reste celle des boites des rives) ;
 *  - les COLLINES au-dela (plus de 150 m) : une surface continue (distance a la trajectoire) qui monte en collines qui se succedent, redescendent en vallons et saturent en hauteur : on peut toujours aller plus loin ;
 *  - quelques domes d'arbres instancies sur les collines, et un controle de collision exact avec cette meme surface. */
(function () {
  const EVO = CC.EVO, R = EVO && EVO.riv, T3 = THREE; if (!R || !EVO.oc) return;
  const { WY, LA, mixf } = R, ss = EVO.oc.ss;
  const D0 = -224, D1 = LA + 300, STEP = 8, SB = 110, S1 = 150, SMAX = 540, GRID = 32;
  const fr = (v) => v - Math.floor(v), hsh = (a, b) => fr(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  const topAt = (d, sg) => R.topAt(d, sg);
  setTimeout(() => { R.gcolor = gcolor; }, 0);   // v299 : la nappe de falaise (zones_river_cliffs.js) reprend exactement la couleur de l'herbe des terrasses
  const nz = (x, z) => 0.5 + 0.5 * (Math.sin(x * 0.0113 + z * 0.0171) * 0.5 + Math.sin(x * 0.0271 - z * 0.0131 + 1.3) * 0.3 + Math.sin(x * 0.0511 + z * 0.0433) * 0.2);
  const GR = ['#3a8a3e', '#448f40', '#357f38', '#4a9444'].map((h) => new T3.Color(h)), GD = new T3.Color('#2a6a30'), cTmp = new T3.Color();
  // couleur du sol, lissee et identique partout (terrasses et collines)
  const gcolor = (x, z, out) => {
    const n1 = nz(x * 1.3, z * 1.3), n2 = nz(x * 0.55 + 90, z * 0.55 - 40), q = 0.5 + 0.5 * Math.sin(x * 0.041 + Math.sin(z * 0.027) * 2.1) * Math.sin(z * 0.045 + Math.sin(x * 0.02) * 1.8);
    out.copy(GR[2]).lerp(GR[3], n1).lerp(GR[1], n2 * 0.5); if (q < 0.34) out.lerp(GD, (0.34 - q) * 1.3); return out;
  };
  // collines : la hauteur monte vite puis sature ; le bruit fait des collines et des vallons qui se succedent
  const prof = (s, x, z, d) => {
    if (s < S1) return -0.2;
    const u = s - S1, k = 1 - ss(LA + 120, D1, d), A = 58 * (1 - Math.exp(-u / 130)), n = nz(x * 0.9 + 17, z * 0.9);
    return k * (A * (0.4 + 0.6 * n) + 7 * (1 - Math.exp(-u / 50)) * Math.sin(x * 0.034 + z * 0.026 + 2) + 4 * Math.sin(x * 0.07 - z * 0.05));
  };
  const build = (run) => {
    const n = Math.round((D1 - D0) / STEP) + 1, px = new Float32Array(n), pz = new Float32Array(n), tx = new Float32Array(n), tz = new Float32Array(n), d = new Float32Array(n);
    for (let i = 0; i < n; i++) { const dd = D0 + i * STEP, a = run.T.at(dd, 0, 0), b = run.T.at(dd + 2, 0, 0), l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; px[i] = a[0]; pz[i] = a[2]; tx[i] = (b[0] - a[0]) / l; tz[i] = (b[2] - a[2]) / l; d[i] = dd; }
    return { n, px, pz, tx, tz, d };
  };
  const out = { s: 0, d: 0, sg: 1, ok: false, y: 0 };
  const probe = (H, x, z, i0, i1) => {
    let bi = -1, bd = 1e12; for (let i = Math.max(0, i0); i <= Math.min(H.n - 1, i1); i++) { const dx = x - H.px[i], dz = z - H.pz[i], q = dx * dx + dz * dz; if (q < bd) { bd = q; bi = i; } }
    out.ok = false; if (bi < 0) return out;
    const dx = x - H.px[bi], dz = z - H.pz[bi], along = dx * H.tx[bi] + dz * H.tz[bi];
    if ((bi === H.n - 1 && along > 0) || (bi === 0 && along < 0)) return out;
    out.s = Math.sqrt(bd); out.d = H.d[bi]; out.sg = (dx * -H.tz[bi] + dz * H.tx[bi]) >= 0 ? 1 : -1; out.ok = true;
    out.y = topAt(out.d, out.sg) + prof(out.s, x, z, out.d); return out;
  };
  const grassMat = () => new T3.MeshLambertMaterial({ map: CC.Textures.get('evoGrass'), vertexColors: true, side: T3.DoubleSide });
  // terrasses : bandes qui suivent le fleuve, de la falaise (ou du mur de depart) a 150 m de l'axe
  const strip = (run, mat) => {
    const pos = [], col = [], uv = [], ix = []; let nv = 0;
    const row = (d, sg, lats, yOff) => { const y = topAt(d, sg) + yOff, base = nv; for (const lat of lats) { const p = run.T.at(d, sg * lat, 0); pos.push(p[0], y, p[2]); uv.push(p[0] / 7, p[2] / 7); gcolor(p[0], p[2], cTmp); col.push(cTmp.r, cTmp.g, cTmp.b); nv++; } return base; };
    for (const sg of [-1, 1]) {
      let prev = -1, nl = 0;
      for (let d = D0; d <= LA + 1; d += (d < 60 ? 14 : 10)) {
        const lats = d < 67 ? [132, 141, 150] : (() => { const l0 = R.faceX(d) + 5.0, t = [0, 0.05, 0.15, 0.35, 0.65, 1]; return t.map((q) => l0 + (150 - l0) * q); })();
        if (prev >= 0 && lats.length !== nl) prev = -1;
        nl = lats.length; const b = row(d, sg, lats, d < 67 ? 0.35 : 0.04);
        if (prev >= 0) for (let j = 0; j < nl - 1; j++) { const a = prev + j, bb = a + 1, c = b + j, e = c + 1; const ay = (pos[3 * bb] - pos[3 * a]) * (pos[3 * c + 2] - pos[3 * a + 2]) - (pos[3 * bb + 2] - pos[3 * a + 2]) * (pos[3 * c] - pos[3 * a]); if (ay >= 0) ix.push(a, c, bb, bb, c, e); else ix.push(a, bb, c, bb, e, c); }   // enroulement : la face regarde toujours vers le haut
        prev = b;
      }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals();
    const m = new T3.Mesh(g, mat); m.frustumCulled = false; return m;
  };
  const make = (g, run) => {
    const H = build(run), mat = grassMat(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < H.n; i++) { x0 = Math.min(x0, H.px[i]); x1 = Math.max(x1, H.px[i]); z0 = Math.min(z0, H.pz[i]); z1 = Math.max(z1, H.pz[i]); }
    x0 = Math.floor((x0 - SMAX) / GRID) * GRID; x1 = Math.ceil((x1 + SMAX) / GRID) * GRID; z0 = Math.floor((z0 - SMAX) / GRID) * GRID; z1 = Math.ceil((z1 + SMAX) / GRID) * GRID;
    const nx = Math.round((x1 - x0) / GRID) + 1, nzz = Math.round((z1 - z0) / GRID) + 1, ys = new Float32Array(nx * nzz), ss_ = new Float32Array(nx * nzz);
    for (let j = 0; j < nzz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * GRID, z = z0 + j * GRID, k = j * nx + i; probe(H, x, z, 0, H.n - 1);
      if (!out.ok || out.s > SMAX) { ys[k] = -1e9; ss_[k] = out.ok ? out.s : -1; continue; }
      ys[k] = out.y; ss_[k] = out.s;
    }
    const pos = [], col = [], uv = [], ix = [], map = new Int32Array(nx * nzz).fill(-1); let nv = 0;
    const vert = (k, i, j) => { if (map[k] < 0) { map[k] = nv++; const x = x0 + i * GRID, z = z0 + j * GRID; pos.push(x, ys[k], z); uv.push(x / 7, z / 7); gcolor(x, z, cTmp); col.push(cTmp.r, cTmp.g, cTmp.b); } return map[k]; };
    for (let j = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k00 = j * nx + i, k10 = k00 + 1, k01 = k00 + nx, k11 = k01 + 1; let ok = true;
      for (const k of [k00, k10, k01, k11]) if (ys[k] < -1e8 || ss_[k] < SB) ok = false; if (!ok) continue;
      const a = vert(k00, i, j), b = vert(k10, i + 1, j), c = vert(k01, i, j + 1), d = vert(k11, i + 1, j + 1); ix.push(a, c, b, b, c, d);
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(ix); geo.computeVertexNormals();
    const grp = new T3.Group(), mesh = new T3.Mesh(geo, mat); mesh.frustumCulled = false; grp.add(mesh); const st = strip(run, mat); grp.add(st);
    // domes d'arbres sur les collines (une seule instance, 20 facettes chacun)
    const NT = 220, ico = CC.Trees.padGeometry(9), inst = new T3.InstancedMesh(ico, new T3.MeshLambertMaterial({ color: '#ffffff', vertexColors: true }), NT), M = new T3.Matrix4(), Qn = new T3.Quaternion(), Sc = new T3.Vector3(), Pp = new T3.Vector3(), Cc = new T3.Color();
    let ni = 0; for (let t = 0; t < NT * 6 && ni < NT; t++) {
      const x = x0 + hsh(t, 1.3) * (x1 - x0), z = z0 + hsh(t, 7.9) * (z1 - z0); probe(H, x, z, 0, H.n - 1); if (!out.ok || out.s < S1 + 22 || out.s > SMAX - 30) continue;
      const rad = 9 + 8 * hsh(t, 3.1), y = out.y + rad * 0.5; Qn.setFromEuler(new T3.Euler(0, hsh(t, 6) * 6.28, 0)); Sc.set(rad * (0.9 + 0.3 * hsh(t, 2)), rad * (0.9 + 0.3 * hsh(t, 4)), rad * (0.9 + 0.3 * hsh(t, 9))); Pp.set(x, y, z);
      M.compose(Pp, Qn, Sc); inst.setMatrixAt(ni, M); Cc.setHSL(0.3 + 0.04 * hsh(t, 11), 0.42 + 0.12 * hsh(t, 12), 0.26 + 0.1 * hsh(t, 13)); inst.setColorAt(ni, Cc); ni++;
    }
    inst.count = ni; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; inst.frustumCulled = false; inst.count = 0;   // v300 : plus de domes d'arbres plats sur les collines (feuilles flottantes sans tronc)
    g.scene.add(grp); return { grp, H, mesh, st, inst };
  };
  EVO.hillAt = (g, x, z) => { const h = g._hill; if (!h) return null; probe(h.H, x, z, 0, h.H.n - 1); return out.ok ? { s: out.s, y: out.y, d: out.d } : null; };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt); const run = g.endlessRun;
    if (!run || !EVO.isS2() || !g.evo || g.evo.preview) { if (g._hill) g._hill.grp.visible = false; return; }
    if (g._hillRun !== run) { g._hillRun = run; if (g._hill) { g.scene.remove(g._hill.grp); g._hill.mesh.geometry.dispose(); g._hill.st.geometry.dispose(); g._hill.inst.dispose(); } g._hill = make(g, run); }
    const h = g._hill; h.grp.visible = run.dist < D1 + 160;
    const rk = g.rocket; if (g.state !== 'FLIGHT' || !rk || !rk.active || run.dist < D0 || run.dist > D1) return;
    const i = Math.round((run.dist - D0) / STEP); probe(h.H, rk.pos.x, rk.pos.z, i - 90, i + 90);
    if (out.ok && out.s > S1 && rk.pos.y < out.y + 0.6) g.onRocketCrash('wall', rk.pos.clone(), new T3.Vector3(0, 1, 0));
  };
})();
