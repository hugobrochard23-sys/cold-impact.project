/* v325 : NIVEAU 2 : LE DECOR LOINTAIN DU DELTA ET DU PORT. Au-dela des berges (150 m de l'axe) il n'y avait rien : on voyait le vide a cote de la fusee. Une surface continue prolonge les berges
 * (collines de jungle dans le delta, terrain bas et skyline de blocs dans le port) jusqu'a l'horizon de brume, avec un controle de collision exact avec cette meme surface.
 * Meme methode que zones_river_hills.js : la hauteur depend de la distance a la trajectoire (aucun repli dans les virages), une grille, un seul maillage + une seule instance de blocs. */
(function () {
  const EVO = CC.EVO, R = EVO && EVO.riv, T3 = THREE; if (!R || !EVO.oc || !R.D3 || !R.D4) return;
  const { mixf } = R, ss = EVO.oc.ss, D3 = R.D3, D4 = R.D4, LD = R.LD, LP = R.LP, WYS = -112 - R.DROP;
  const D0 = D3 - 80, D1 = D4 + 70, STEP = 8, SB = 138, S1 = 150, SMAX = 500, GRID = 30, L0 = D3 + LD;
  const fr = (v) => v - Math.floor(v), hsh = (a, b) => fr(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  const nz = (x, z) => 0.5 + 0.5 * (Math.sin(x * 0.0113 + z * 0.0171) * 0.5 + Math.sin(x * 0.0271 - z * 0.0131 + 1.3) * 0.3 + Math.sin(x * 0.0511 + z * 0.0433) * 0.2);
  // hauteur du sommet de la berge (la meme que celle des zones : delta puis port)
  const topAt = (d, sg) => { const u = d - D3; if (u < LD) return mixf(-84, WYS + 9 + 3 * Math.sin(d / 41 + sg), ss(24, 120, u)); return WYS + 6.5; };
  const portW = (d) => ss(L0 - 40, L0 + 80, d) * (1 - ss(L0 + LP - 200, L0 + LP - 100, d));   // 1 dans le port (quais), 0 dans le delta et la rade
  const GJ = ['#3a8a3e', '#448f40', '#357f38', '#4a9444'].map((h) => new T3.Color(h)), GP = new T3.Color('#6a6e68'), GP2 = new T3.Color('#58605c'), cT = new T3.Color();
  const color = (x, z, d, out) => {
    const n1 = nz(x * 1.3, z * 1.3), n2 = nz(x * 0.55 + 90, z * 0.55 - 40); out.copy(GJ[2]).lerp(GJ[3], n1).lerp(GJ[1], n2 * 0.5);
    const w = portW(d); if (w > 0) out.lerp(cT.copy(GP).lerp(GP2, n1), w); return out;
  };
  const prof = (s, x, z, d) => {
    if (s < S1) return -0.3 - (S1 - s) * 0.02;
    const u = s - S1, w = portW(d), k = ss(D3 - 30, D3 + 40, d) * (1 - ss(D4 - 20, D4 + 60, d)), A = (58 - 36 * w) * (1 - Math.exp(-u / 130)), n = nz(x * 0.9 + 17, z * 0.9);
    const flat = 1 - w * Math.exp(-u / 70);   // le port : terre plate au bord, les collines viennent apres les blocs
    return k * flat * (A * (0.4 + 0.6 * n) + 6 * (1 - Math.exp(-u / 50)) * Math.sin(x * 0.034 + z * 0.026 + 2) + 3 * Math.sin(x * 0.07 - z * 0.05));
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
  const make = (g, run) => {
    const H = build(run); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < H.n; i++) { x0 = Math.min(x0, H.px[i]); x1 = Math.max(x1, H.px[i]); z0 = Math.min(z0, H.pz[i]); z1 = Math.max(z1, H.pz[i]); }
    x0 = Math.floor((x0 - SMAX) / GRID) * GRID; x1 = Math.ceil((x1 + SMAX) / GRID) * GRID; z0 = Math.floor((z0 - SMAX) / GRID) * GRID; z1 = Math.ceil((z1 + SMAX) / GRID) * GRID;
    const nx = Math.round((x1 - x0) / GRID) + 1, nzz = Math.round((z1 - z0) / GRID) + 1, ys = new Float32Array(nx * nzz), ss_ = new Float32Array(nx * nzz), dd_ = new Float32Array(nx * nzz);
    for (let j = 0; j < nzz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * GRID, z = z0 + j * GRID, k = j * nx + i; probe(H, x, z, 0, H.n - 1);
      if (!out.ok || out.s > SMAX) { ys[k] = -1e9; ss_[k] = out.ok ? out.s : -1; continue; }
      ys[k] = out.y; ss_[k] = out.s; dd_[k] = out.d;
    }
    const pos = [], col = [], uv = [], ix = [], map = new Int32Array(nx * nzz).fill(-1); let nv = 0;
    const vert = (k, i, j) => { if (map[k] < 0) { map[k] = nv++; const x = x0 + i * GRID, z = z0 + j * GRID; pos.push(x, ys[k], z); uv.push(x / 7, z / 7); color(x, z, dd_[k], cT); col.push(cT.r, cT.g, cT.b); } return map[k]; };
    for (let j = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k00 = j * nx + i, k10 = k00 + 1, k01 = k00 + nx, k11 = k01 + 1; let ok = true;
      for (const k of [k00, k10, k01, k11]) if (ys[k] < -1e8 || ss_[k] < SB) ok = false; if (!ok) continue;
      const a = vert(k00, i, j), b = vert(k10, i + 1, j), c = vert(k01, i, j + 1), d = vert(k11, i + 1, j + 1); ix.push(a, c, b, b, c, d);
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(ix); geo.computeVertexNormals();
    const grp = new T3.Group(), mesh = new T3.Mesh(geo, new T3.MeshLambertMaterial({ map: CC.Textures.get('evoGrass'), vertexColors: true, side: T3.DoubleSide })); mesh.frustumCulled = false; grp.add(mesh);
    // skyline du port : blocs de bureaux et d'entrepots (une seule instance) sur la terre plate, loin des quais
    const NB = 150, inst = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: '#ffffff' }), NB), M = new T3.Matrix4(), Qn = new T3.Quaternion(), Sc = new T3.Vector3(), Pp = new T3.Vector3(), Cc = new T3.Color();
    const PAL = ['#8a929a', '#9aa0a4', '#7a8490', '#a89c8c', '#6e7884', '#b4b0a4'];
    let nb = 0; for (let t = 0; t < NB * 12 && nb < NB; t++) {
      const dd = L0 + 20 + hsh(t, 1.7) * (LP - 200), sg = hsh(t, 5.3) < 0.5 ? -1 : 1, lat = 168 + hsh(t, 8.1) * 200, p = run.T.at(dd, sg * lat, 0); probe(H, p[0], p[2], 0, H.n - 1);
      if (!out.ok || out.s < S1 + 14 || out.s > 400 || out.d < L0 + 10 || out.d > L0 + LP - 190) continue;
      const w = 12 + 22 * hsh(t, 2.2), h = (7 + 30 * Math.pow(hsh(t, 3.9), 2)) * (0.7 + 0.6 * ss(160, 300, out.s)), dp = 12 + 22 * hsh(t, 4.4), yaw = Math.atan2(-H.tz[Math.round((out.d - D0) / STEP)], H.tx[Math.round((out.d - D0) / STEP)]);
      Qn.setFromEuler(new T3.Euler(0, yaw, 0)); Sc.set(w, h + 4, dp); Pp.set(p[0], out.y + h / 2 - 2, p[2]); M.compose(Pp, Qn, Sc); inst.setMatrixAt(nb, M); Cc.set(PAL[Math.floor(hsh(t, 6.6) * PAL.length)]).multiplyScalar(0.85 + 0.25 * hsh(t, 9.1)); inst.setColorAt(nb, Cc); nb++;
    }
    inst.count = nb; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; inst.frustumCulled = false; grp.add(inst);
    g.scene.add(grp); return { grp, H, mesh, inst };
  };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt); const run = g.endlessRun;
    if (!run || !EVO.isS2() || !g.evo || g.evo.preview) { if (g._far) g._far.grp.visible = false; return; }
    if (g._farRun !== run) { g._farRun = run; if (g._far) { g.scene.remove(g._far.grp); g._far.mesh.geometry.dispose(); g._far.inst.dispose(); g._far = null; } }
    if (!g._far) { if (run.dist < D0 - 340) return; g._far = make(g, run); }   // construit quand on approche (pas pendant les premieres zones)
    const h = g._far; h.grp.visible = run.dist > D0 - 400 && run.dist < D1 + 160;
    const rk = g.rocket; if (g.state !== 'FLIGHT' || !rk || !rk.active || run.dist < D0 || run.dist > D1) return;
    const i = Math.round((run.dist - D0) / STEP); probe(h.H, rk.pos.x, rk.pos.z, i - 60, i + 60);
    if (out.ok && out.s > S1 + 1 && rk.pos.y < out.y + 0.6) g.onRocketCrash('wall', rk.pos.clone(), new T3.Vector3(0, 1, 0));
  };
})();
