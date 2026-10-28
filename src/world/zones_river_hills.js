/* v295 : NIVEAU 2 : COLLINES A L'INFINI de chaque cote du fleuve (rapides et lac du barrage). Au-dela des berges (plus de 130 m de la trajectoire), le terrain continue de monter en collines de jungle
 * jusqu'a l'horizon (la brume les fond dans le bleu) : le joueur ne voit plus jamais le bord du monde. Une seule surface continue (distance a la trajectoire), des dômes d'arbres instancies,
 * et un controle de collision exact avec cette meme surface (la roquette qui part sur le cote finit sur la colline). */
(function () {
  const EVO = CC.EVO, R = EVO && EVO.riv, T3 = THREE; if (!R || !EVO.oc) return;
  const { WY, LA, mixf } = R, ss = EVO.oc.ss;
  const D0 = -224, D1 = LA + 300, STEP = 8, SB = 110, S0 = 130, S1 = 150, SMAX = 540, GRID = 32;
  const topAt = (d, sg) => {
    if (d < 74) return 74 + 2 * Math.sin(d / 9 + sg);
    if (d < LA) return (d < 140 ? mixf(74, WY(d) + 26, ss(74, 140, d)) : WY(d) + 26) + 4 * Math.sin(d / 53 + sg * 1.7) + 2 * Math.sin(d / 17 + sg);
    return WY(d) + 26 + 3 * Math.sin(d / 53 + sg);
  };
  const nz = (x, z) => 0.5 + 0.5 * (Math.sin(x * 0.0113 + z * 0.0171) * 0.5 + Math.sin(x * 0.0271 - z * 0.0131 + 1.3) * 0.3 + Math.sin(x * 0.0511 + z * 0.0433) * 0.2);
  const prof = (s, x, z, d) => {
    if (s < S1) return -1 + (Math.max(s, S0) - S0) / (S1 - S0);
    const u = s - S1, k = 1 - ss(LA + 120, D1, d);
    return k * (u * (0.24 + 0.16 * nz(x * 0.7 + 40, z * 0.7)) + 9 * (1 - Math.exp(-u / 45)) * Math.sin(x * 0.031 + z * 0.023 + 2));
  };
  // echantillons de la trajectoire
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
  const hsh = (a, b) => { const q = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return q - Math.floor(q); };
  const make = (g, run) => {
    const H = build(run); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < H.n; i++) { x0 = Math.min(x0, H.px[i]); x1 = Math.max(x1, H.px[i]); z0 = Math.min(z0, H.pz[i]); z1 = Math.max(z1, H.pz[i]); }
    x0 = Math.floor((x0 - SMAX) / GRID) * GRID; x1 = Math.ceil((x1 + SMAX) / GRID) * GRID; z0 = Math.floor((z0 - SMAX) / GRID) * GRID; z1 = Math.ceil((z1 + SMAX) / GRID) * GRID;
    const nx = Math.round((x1 - x0) / GRID) + 1, nzz = Math.round((z1 - z0) / GRID) + 1, ys = new Float32Array(nx * nzz), ss_ = new Float32Array(nx * nzz), cols = new Float32Array(nx * nzz * 3);
    const c1 = new T3.Color('#34803a'), c2 = new T3.Color('#276a30'), c3 = new T3.Color('#4c9a40'), c4 = new T3.Color('#1a4d26'), cc = new T3.Color();
    for (let j = 0; j < nzz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * GRID, z = z0 + j * GRID, k = j * nx + i; probe(H, x, z, 0, H.n - 1);
      if (!out.ok || out.s > SMAX) { ys[k] = -1e9; ss_[k] = out.ok ? out.s : -1; continue; }
      ys[k] = out.y; ss_[k] = out.s; const n1 = nz(x * 1.7, z * 1.7), n2 = 0.5 + 0.5 * Math.sin(x * 0.09 + Math.sin(z * 0.06) * 2) * Math.sin(z * 0.08 + Math.sin(x * 0.05) * 2);
      cc.copy(c2).lerp(c1, n1).lerp(c3, Math.max(0, n2 - 0.55) * 1.4); if (n2 < 0.3) cc.lerp(c4, (0.3 - n2) * 1.6); cc.multiplyScalar(0.92 + 0.14 * hsh(i, j));
      cols[k * 3] = cc.r; cols[k * 3 + 1] = cc.g; cols[k * 3 + 2] = cc.b;
    }
    const pos = [], col = [], ix = [], map = new Int32Array(nx * nzz).fill(-1); let nv = 0;
    const vert = (k, i, j) => { if (map[k] < 0) { map[k] = nv++; pos.push(x0 + i * GRID, ys[k], z0 + j * GRID); col.push(cols[k * 3], cols[k * 3 + 1], cols[k * 3 + 2]); } return map[k]; };
    for (let j = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k00 = j * nx + i, k10 = k00 + 1, k01 = k00 + nx, k11 = k01 + 1, K = [k00, k10, k01, k11]; let ok = true;
      for (const k of K) if (ys[k] < -1e8 || ss_[k] < SB) ok = false; if (!ok) continue;
      const a = vert(k00, i, j), b = vert(k10, i + 1, j), c = vert(k01, i, j + 1), d = vert(k11, i + 1, j + 1); ix.push(a, c, b, b, c, d);
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(ix); geo.computeVertexNormals();
    const grp = new T3.Group(), mesh = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); mesh.frustumCulled = false; grp.add(mesh);
    // domes d'arbres sur les collines (une seule instance, 20 facettes chacun)
    const NT = 300, ico = new T3.IcosahedronGeometry(1, 0), inst = new T3.InstancedMesh(ico, new T3.MeshLambertMaterial({ color: '#ffffff' }), NT), M = new T3.Matrix4(), Qn = new T3.Quaternion(), Sc = new T3.Vector3(), Pp = new T3.Vector3(), Cc = new T3.Color();
    let ni = 0; for (let t = 0; t < NT * 6 && ni < NT; t++) {
      const x = x0 + hsh(t, 1.3) * (x1 - x0), z = z0 + hsh(t, 7.9) * (z1 - z0); probe(H, x, z, 0, H.n - 1); if (!out.ok || out.s < S1 + 22 || out.s > SMAX - 30) continue;
      const rad = 8 + 9 * hsh(t, 3.1), y = out.y + rad * 0.15; Qn.setFromEuler(new T3.Euler(hsh(t, 5) * 0.4, hsh(t, 6) * 6.28, hsh(t, 8) * 0.4)); Sc.set(rad * (0.9 + 0.3 * hsh(t, 2)), rad * (0.62 + 0.2 * hsh(t, 4)), rad * (0.9 + 0.3 * hsh(t, 9))); Pp.set(x, y, z);
      M.compose(Pp, Qn, Sc); inst.setMatrixAt(ni, M); Cc.setHSL(0.27 + 0.05 * hsh(t, 11), 0.5 + 0.2 * hsh(t, 12), 0.2 + 0.12 * hsh(t, 13)); inst.setColorAt(ni, Cc); ni++;
    }
    inst.count = ni; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; inst.frustumCulled = false; grp.add(inst);
    g.scene.add(grp); return { grp, H, mesh, inst };
  };
  EVO.hillAt = (g, x, z) => { const h = g._hill; if (!h) return null; probe(h.H, x, z, 0, h.H.n - 1); return out.ok ? { s: out.s, y: out.y, d: out.d } : null; };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt); const run = g.endlessRun;
    if (!run || !EVO.isS2() || !g.evo || g.evo.preview) { if (g._hill) g._hill.grp.visible = false; return; }
    if (g._hillRun !== run) { g._hillRun = run; if (g._hill) { g.scene.remove(g._hill.grp); g._hill.mesh.geometry.dispose(); g._hill.inst.dispose(); } g._hill = make(g, run); }
    const h = g._hill; h.grp.visible = run.dist < D1 + 160;
    const rk = g.rocket; if (g.state !== 'FLIGHT' || !rk || !rk.active || run.dist < D0 || run.dist > D1) return;
    const i = Math.round((run.dist - D0) / STEP); probe(h.H, rk.pos.x, rk.pos.z, i - 90, i + 90);
    if (out.ok && out.s > S1 && rk.pos.y < out.y + 0.6) g.onRocketCrash('wall', rk.pos.clone(), new T3.Vector3(0, 1, 0));
  };
})();
