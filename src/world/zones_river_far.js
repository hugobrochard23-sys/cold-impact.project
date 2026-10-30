/* v325 : NIVEAU 2 : LE DECOR LOINTAIN DU DELTA ET DU PORT. Au-dela des berges (150 m de l'axe) il n'y avait rien : on voyait le vide a cote de la fusee. Une surface continue prolonge les berges
 * (collines de jungle dans le delta, terrain bas et skyline de blocs dans le port) jusqu'a l'horizon de brume, avec un controle de collision exact avec cette meme surface.
 * Meme methode que zones_river_hills.js : la hauteur depend de la distance a la trajectoire (aucun repli dans les virages), une grille, un seul maillage + une seule instance de blocs. */
(function () {
  const EVO = CC.EVO, R = EVO && EVO.riv, T3 = THREE; if (!R || !EVO.oc || !R.D3 || !R.D4) return;
  const { mixf } = R, ss = EVO.oc.ss, D3 = R.D3, D4 = R.D4, LD = R.LD, LP = R.LP, WYS = -112 - R.DROP;
  const LA = R.LA, D0 = LA + 200, D1 = (R.DEND || D4 + 2700) + 40, STEP = 8, SB = 138, S1 = 150, SMAX = 500, GRID = 30, L0 = D3 + LD;
  const fr = (v) => v - Math.floor(v), hsh = (a, b) => fr(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  const nz = (x, z) => 0.5 + 0.5 * (Math.sin(x * 0.0113 + z * 0.0171) * 0.5 + Math.sin(x * 0.0271 - z * 0.0131 + 1.3) * 0.3 + Math.sin(x * 0.0511 + z * 0.0433) * 0.2);
  // hauteur du sommet de la berge (la meme que celle des zones : delta puis port)
  const EX = LA + 1010, LID0 = D4 + 40, LEND = D1 - 40, inCap = (d) => (d >= LA + 330 && d <= EX) || (d >= LID0 && d <= LEND), topAt = (d, sg) => { if (d < D3) { const u2 = d - LA; if (u2 >= 1010) return R.topAt(Math.max(d, EX + 8), sg); return mixf(R.topAt(d, sg), mixf(-10, -86, ss(900, 1010, u2)), ss(300, 360, u2)); } const u = d - D3; if (u < LD) return mixf(-84, WYS + 9 + 3 * Math.sin(d / 41 + sg), ss(24, 120, u)); if (d >= D4) return mixf(WYS + 6.5, WYS + 260, ss(D4 + 40, D4 + 100, d)); return WYS + 6.5; };   // v329 : au-dela de D4 la mer entre sous une MONTAGNE (falaise de 250 m) : impossible de survoler la fosse, il faut plonger
  const portW = (d) => ss(L0 - 40, L0 + 80, d) * (1 - ss(L0 + LP - 200, L0 + LP - 100, d));   // 1 dans le port (quais), 0 dans le delta et la rade
  const GJ = ['#3a8a3e', '#448f40', '#357f38', '#4a9444'].map((h) => new T3.Color(h)), GP = new T3.Color('#6a6e68'), GP2 = new T3.Color('#58605c'), cT = new T3.Color();
  const ROCKM = new T3.Color('#68707a'), color = (x, z, d, out) => {
    const n1 = nz(x * 1.3, z * 1.3), n2 = nz(x * 0.55 + 90, z * 0.55 - 40); out.copy(GJ[2]).lerp(GJ[3], n1).lerp(GJ[1], n2 * 0.5);
    const w = portW(d); if (w > 0) out.lerp(cT.copy(GP).lerp(GP2, n1), w); return out;
  };
  const prof = (s, x, z, d) => {
    if (s < S1) return -0.3 - (S1 - s) * 0.02;
    const u = s - S1, w = portW(d), k = 1, A = (58 - 36 * w) * (1 - Math.exp(-u / 130)), n = nz(x * 0.9 + 17, z * 0.9);
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
    out.y = topAt(out.d, out.sg) + (out.s < S1 && inCap(out.d) ? -0.3 : prof(out.s, x, z, out.d)); return out;
  };
  const make = function* (g, run, tick) {   // generateur : le calcul (grille de probes, skyline) est reparti sur plusieurs images (pas de pic de plusieurs dizaines de ms)
    const H = build(run); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < H.n; i++) { x0 = Math.min(x0, H.px[i]); x1 = Math.max(x1, H.px[i]); z0 = Math.min(z0, H.pz[i]); z1 = Math.max(z1, H.pz[i]); }
    x0 = Math.floor((x0 - SMAX) / GRID) * GRID; x1 = Math.ceil((x1 + SMAX) / GRID) * GRID; z0 = Math.floor((z0 - SMAX) / GRID) * GRID; z1 = Math.ceil((z1 + SMAX) / GRID) * GRID;
    const nx = Math.round((x1 - x0) / GRID) + 1, nzz = Math.round((z1 - z0) / GRID) + 1, ys = new Float32Array(nx * nzz), ss_ = new Float32Array(nx * nzz), dd_ = new Float32Array(nx * nzz);
    for (let j = 0; j < nzz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * GRID, z = z0 + j * GRID, k = j * nx + i; probe(H, x, z, 0, H.n - 1);
      if (!out.ok || out.s > SMAX) { ys[k] = -1e9; ss_[k] = out.ok ? out.s : -1; continue; }
      ys[k] = out.y; ss_[k] = out.s; dd_[k] = out.d;
      if (i === nx - 1 && tick()) yield;
    }
    const pos = [], col = [], uv = [], ix = [], ixL = [], map = new Int32Array(nx * nzz).fill(-1); let nv = 0;
    const vert = (k, i, j) => { if (map[k] < 0) { map[k] = nv++; const x = x0 + i * GRID, z = z0 + j * GRID; pos.push(x, (ss_[k] < SB && dd_[k] >= LID0 - 70 && dd_[k] < LID0 + 10 ? mixf(WYS - 40, ys[k], ss(LID0 - 30, LID0 + 10, dd_[k])) : ys[k] - (ss_[k] < SB && !inCap(dd_[k]) ? 3 : 0)) - 2 * (1 - ss(LA + 240, LA + 300, dd_[k])), z); uv.push(x / 7, z / 7); color(x, z, dd_[k], cT); if (dd_[k] >= D4 - 40) cT.lerp(ROCKM, ss(WYS + 20, WYS + 110, ys[k])); col.push(cT.r, cT.g, cT.b); } return map[k]; };
    for (let j = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k00 = j * nx + i, k10 = k00 + 1, k01 = k00 + nx, k11 = k01 + 1; let ok = true;
      let far = false, cap = false; for (const k of [k00, k10, k01, k11]) { if (ys[k] < -1e8) ok = false; else if (ss_[k] >= SB) far = true; } const dm = (dd_[k00] + dd_[k10] + dd_[k01] + dd_[k11]) / 4; cap = inCap(dm) || (dm >= LID0 - 45 && dm < LID0); if (dm < LA + 235) ok = false; if (!ok || !(far || cap)) continue;   // cap : le dessus du barrage et de la galerie (entre le mur et la sortie du canal) est couvert de colline   // v328 : plus de trous au bord de la berge : une maille touche la berge des qu'un de ses coins est assez loin (les coins proches sont rabaisses sous la berge)
      const a = vert(k00, i, j), b = vert(k10, i + 1, j), c = vert(k01, i, j + 1), d = vert(k11, i + 1, j + 1); (cap ? ixL : ix).push(a, c, b, b, c, d);   // les mailles du dessus du barrage et du plafond de la fosse forment un maillage a part (dessous sombre)
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(ix.concat(ixL)); geo.computeVertexNormals(); geo.setIndex(ix);
    const grp = new T3.Group(), mesh = new T3.Mesh(geo, new T3.MeshLambertMaterial({ map: CC.Textures.get('evoGrass'), vertexColors: true, side: T3.DoubleSide })); mesh.frustumCulled = false; grp.add(mesh);
    if (ixL.length) { const gl = new T3.BufferGeometry(); for (const k in geo.attributes) gl.setAttribute(k, geo.attributes[k]); gl.setIndex(ixL); const ml = new T3.Mesh(gl, new T3.MeshLambertMaterial({ map: CC.Textures.get('evoGrass'), vertexColors: true, side: T3.FrontSide })), mb = new T3.Mesh(gl, new T3.MeshLambertMaterial({ color: '#2c3036', side: T3.BackSide })); ml.frustumCulled = mb.frustumCulled = false; grp.add(ml); grp.add(mb); }
    // skyline du port : blocs de bureaux et d'entrepots (une seule instance) sur la terre plate, loin des quais
    const NB = 150, inst = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: '#ffffff' }), NB), M = new T3.Matrix4(), Qn = new T3.Quaternion(), Sc = new T3.Vector3(), Pp = new T3.Vector3(), Cc = new T3.Color();
    const PAL = ['#8a929a', '#9aa0a4', '#7a8490', '#a89c8c', '#6e7884', '#b4b0a4'];
    let nb = 0; for (let t = 0; t < NB * 12 && nb < NB; t++) {
      const dd = L0 + 20 + hsh(t, 1.7) * (LP - 200), sg = hsh(t, 5.3) < 0.5 ? -1 : 1, lat = 168 + hsh(t, 8.1) * 200, p = run.T.at(dd, sg * lat, 0); probe(H, p[0], p[2], 0, H.n - 1);
      if (!out.ok || out.s < S1 + 14 || out.s > 400 || out.d < L0 + 10 || out.d > L0 + LP - 190) continue;
      if (t % 40 === 0 && tick()) yield;
      const w = 12 + 22 * hsh(t, 2.2), h = (7 + 30 * Math.pow(hsh(t, 3.9), 2)) * (0.7 + 0.6 * ss(160, 300, out.s)), dp = 12 + 22 * hsh(t, 4.4), yaw = Math.atan2(-H.tz[Math.round((out.d - D0) / STEP)], H.tx[Math.round((out.d - D0) / STEP)]);
      Qn.setFromEuler(new T3.Euler(0, yaw, 0)); Sc.set(w, h + 4, dp); Pp.set(p[0], out.y + h / 2 - 2, p[2]); M.compose(Pp, Qn, Sc); inst.setMatrixAt(nb, M); Cc.set(PAL[Math.floor(hsh(t, 6.6) * PAL.length)]).multiplyScalar(0.85 + 0.25 * hsh(t, 9.1)); inst.setColorAt(nb, Cc); nb++;
    }
    inst.count = nb; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; inst.frustumCulled = false; grp.add(inst);
    // v328 : les berges de la mangrove (du bord du fleuve jusqu'a 152 m) : une nappe lisse (face de roche + dessus d'herbe) a la place des marches de boites ; les boites ne servent plus qu'a la collision
    if (R.HWd) {
      const wp = [], wc = [], tp = [], tc = [], tu = [], wi = [], ti = [], NC = Math.ceil((LD + 6) / 3), RK = [new T3.Color('#6e6656'), new T3.Color('#857c6a')], Ck = new T3.Color();
      for (const sg of [-1, 1]) {
        const bw = wp.length / 3, bt = tp.length / 3;
        for (let c = 0; c <= NC; c++) {
          const u = Math.min(c * 3, LD + 6), dd = D3 + u, top = topAt(dd, sg), a = run.T.at(dd, sg * (R.HWd(u) + 0.5), 0), b = run.T.at(dd, sg * 152, 0), q = nz(dd * 0.9, sg * 7);
          Ck.copy(RK[0]).lerp(RK[1], q); wp.push(a[0], WYS - 6, a[2], a[0], top, a[2]); wc.push(Ck.r * 0.55, Ck.g * 0.55, Ck.b * 0.55, Ck.r, Ck.g, Ck.b);
          for (const p of [a, b]) { tp.push(p[0], top, p[2]); tu.push(p[0] / 7, p[2] / 7); color(p[0], p[2], dd, cT); tc.push(cT.r, cT.g, cT.b); }
          if (c < NC) { const k = c * 2; wi.push(bw + k, bw + k + 1, bw + k + 2, bw + k + 1, bw + k + 3, bw + k + 2); ti.push(bt + k, bt + k + 1, bt + k + 2, bt + k + 1, bt + k + 3, bt + k + 2); }
        }
      }
      const gw = new T3.BufferGeometry(); gw.setAttribute('position', new T3.Float32BufferAttribute(wp, 3)); gw.setAttribute('color', new T3.Float32BufferAttribute(wc, 3)); gw.setIndex(wi); gw.computeVertexNormals();
      const gt = new T3.BufferGeometry(); gt.setAttribute('position', new T3.Float32BufferAttribute(tp, 3)); gt.setAttribute('color', new T3.Float32BufferAttribute(tc, 3)); gt.setAttribute('uv', new T3.Float32BufferAttribute(tu, 2)); gt.setIndex(ti); gt.computeVertexNormals();
      const mw = new T3.Mesh(gw, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })), mt = new T3.Mesh(gt, mesh.material); mw.frustumCulled = mt.frustumCulled = false; grp.add(mw); grp.add(mt);
    }
    g.scene.add(grp); return { grp, H, mesh, inst };
  };
  // v329 : hauteur du sol du decor (pour l'ombre de la fusee) : le dessus du barrage, les collines, les berges lisses du delta
  (EVO.terrain = EVO.terrain || []).push((g, x, z) => {
    const h = g._far, run = g.endlessRun; if (!h || !run || !h.grp.visible || run.dist < D0 - 100 || run.dist > D1 + 100) return null;
    const i = Math.round((run.dist - D0) / STEP); probe(h.H, x, z, i - 60, i + 60); if (!out.ok) return null;
    return out.s >= S1 || inCap(out.d) || (out.d >= D3 && out.d <= L0 + 6 && out.s >= R.HWd(Math.max(0, out.d - D3)) + 0.5) ? out.y : null;
  });
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt); const run = g.endlessRun;
    if (!run || !EVO.isS2() || !g.evo || g.evo.preview) { if (g._far) g._far.grp.visible = false; return; }
    if (g._farRun !== run) { g._farRun = run; if (g._far) { g.scene.remove(g._far.grp); g._far.grp.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); g._far.inst.dispose(); g._far = null; } if (g._farJob) { g._farJob.return(); g._farJob = null; } }
    if (!g._far) {   // construit petit a petit des le debut de la partie (il n'est utile qu'a D0 - 400)
      if (!g._farJob) g._farJob = make(g, run, () => performance.now() - g._farT0 > 2);
      g._farT0 = performance.now(); const r = g._farJob.next(); if (window.__GSTEPS) window.__GSTEPS.push([-1, r.done ? 1 : 0, performance.now() - g._farT0]); if (r.done) { g._far = r.value; g._farJob = null; } else return;
    }
    const h = g._far; h.grp.visible = run.dist > D0 - 400 && run.dist < D1 + 160;
    const rk = g.rocket; if (g.state !== 'FLIGHT' || !rk || !rk.active || run.dist < D0 || run.dist > D1) return;
    const i = Math.round((run.dist - D0) / STEP); probe(h.H, rk.pos.x, rk.pos.z, i - 60, i + 60);
    if (out.ok) {
      const y = rk.pos.y, lid = out.d >= LID0 && out.s <= S1 + 1;   // sous la montagne de la fosse : on ne peut voler qu'a moins de 8 m au-dessus de l'eau
      if (lid ? (y > WYS + 8 && y < out.y + 0.6) : out.s > S1 + 1 ? y < out.y + 0.6 : inCap(out.d) && y < out.y + 0.6 && y > out.y - 3.5) g.onRocketCrash('wall', rk.pos.clone(), new T3.Vector3(0, 1, 0));
    }
  };
})();
