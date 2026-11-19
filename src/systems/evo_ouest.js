/* v446 : NIVEAU 8 « LE FAR WEST » (?lv=8) — pilotage libre du niveau 1 (comme le niveau 7) : la fusee vole ou on vise ; la voie ne sert qu'a savoir ou on en est.
 * C'est LE RELIEF qui fait tourner : on part du haut d'une MESA, on plonge du haut de la falaise dans LE GRAND CANYON qui serpente (arches naturelles, ponts de corde,
 * eboulements, cascade), le canyon se separe en DEUX PASSES autour d'une butte (en haut : corniches et arches ; en bas : la riviere et la roue a aubes), on entre dans
 * LA MINE D'OR (galeries, etais, lampes, wagonnets qui foncent sur nous, grande salle au filon dore et roue a godets), on remonte par LA CHEMINEE (plateformes de bois),
 * on debouche dans LA VALLEE DES TOURBILLONS (immense : cheminees de fee, saguaros, tourbillons de sable qui poussent, rochers qui roulent), on longe LE PONT DU TRAIN
 * au-dessus d'une gorge (on double le train a vapeur, fers a cheval dores = boost) et on finit dans LA VILLE FANTOME ou attend LA LOCOMOTIVE BLINDEE (3 coups dans la cible).
 * Regles : ce qui touche = exactement ce qu'on voit (relief + pieces du decor), rien d'invisible ; virages larges ; pas d'animaux ; chaque objet au sol a son ombre. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn || !CC.Rocket) return;
  const on8 = (g) => !!(g && g.evo && !g.evo.preview && EVO.stage && EVO.stage(g) === 8);
  const isS8 = EVO.isS8 = () => !!(EVO.stage && CC.game && EVO.stage(CC.game) === 8);
  const RK = 0.55, rr = (a, b) => a + Math.random() * (b - a);
  const _a = new V(), _b = new V(), _c = new V(), _d = new V(), _q2 = new T3.Quaternion(), _m = new T3.Matrix4();
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  let L = null;

  // ============================== LA FUSEE DU FAR WEST, le carburant, les pieces ==============================
  for (let i = 0; i < 4; i++) CC.Skins.byId['evoO' + i] = { id: 'evoO' + i, name: 'evoO' + i, short: 'evoO' + i, tier: 'base', price: 0, tierLabel: '', c: { body: '#a8723a', nose: '#c8302a', tip: '#f2c41a', band: '#3a3a40', fin: '#7a4e26', nozzle: '#3a3a3a' }, flame: ['#ffb04a', '#ffc04a', '#ff9a3a', '#ffe08a'][i], build: 'ouest', stage: i, dims: { r: 0.1, len: 1, noseLen: 0.3, noseR: 0.02, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, parts: [] };
  { const _ob = EVO.ownBody; EVO.ownBody = () => _ob() || isS8(); }
  { const _as = EVO.applySkin; EVO.applySkin = (g) => { if (!isS8()) return _as(g); const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoO' + r.tier)); EVO.attachParts(g); }; }
  { const RK8 = ['TONNEAU DE DYNAMITE', 'FUSEE DILIGENCE', 'LOCOMOTIVE-FUSEE', 'FUSEE DU CHERCHEUR D OR'], _rk = EVO.rocket; EVO.rocket = (n) => { const r = _rk(n); if (isS8()) r.name = RK8[r.tier]; return r; }; }
  EVO.fuel8 = (rk, la) => 28 + 1.6 * rk + 1.2 * la + [0, 16, 48, 115][Math.min(3, Math.floor(rk / 5))];
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); if (!isS8() || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket, f = EVO.fuel8(S.rk || 0, S.la || 0); rk.fuelMax = f * 1.15; rk.fuel = (g.evoAimLast && g.evoAimLast.zone === 'gold') ? f * 1.15 : f; }; }
  { const _dp = EVO.distPay; EVO.distPay = (g, dist) => (isS8() ? 0.45 * (0.15 / (8450 / 6910)) * (1 + 2 * Math.min(1, dist / 7000)) : _dp ? _dp(g, dist) : 1); }
  { const _nk = EVO.noKill; EVO.noKill = (g) => on8(g) || (_nk ? _nk(g) : false); }
  // le monde physique du niveau 1 est coupe : seuls le relief et le decor du Far West comptent
  if (CC.World) { const _sw = CC.World.prototype.sweep; CC.World.prototype.sweep = function (p0, p1, r, filter) { if (L && L.PA && CC.game && on8(CC.game)) return null; return _sw.call(this, p0, p1, r, filter); }; }
  // LES COLLISIONS AVEC LE DECOR : chaque piece visible enregistree arrete la fusee (on glisse en la frolant, on s'ecrase de face)
  const _cv = new V(), _cw = new V(), _cn = new V();
  const colAdd = (mesh, parts) => { if (L) (L.colPend = L.colPend || []).push([mesh, parts]); };
  function colBuild() { const C = 40, HS = new Map(); L.grp.updateMatrixWorld(true);
    for (const [m, parts] of L.colPend || []) for (const q of parts) { if (!q.g.boundingBox) q.g.computeBoundingBox(); const bb0 = q.g.boundingBox, sz = bb0.getSize(_cv); if (Math.max(sz.x, sz.y, sz.z) < 3) continue;
      const M = new T3.Matrix4().compose(new V().fromArray(q.p), new T3.Quaternion().setFromEuler(new T3.Euler().fromArray(q.r ? [q.r[0], q.r[1], q.r[2]] : [0, 0, 0])), new V().fromArray(q.s || [1, 1, 1])), W = new T3.Matrix4().multiplyMatrices(m.matrixWorld, M);
      const P = { W, inv: W.clone().invert(), bb: bb0.clone().expandByScalar(-0.3) }; if (P.bb.isEmpty()) continue; const wb = bb0.clone().applyMatrix4(W);
      for (let i = Math.floor(wb.min.x / C); i <= Math.floor(wb.max.x / C); i++) for (let k = Math.floor(wb.min.z / C); k <= Math.floor(wb.max.z / C); k++) { const kk = i + ',' + k; let a = HS.get(kk); if (!a) HS.set(kk, a = []); a.push(P); } }
    L.colH = HS; L.colC = C; L.colPend = null; }
  function colAt(p) { if (!L.colH) return null; const C = L.colC, a = L.colH.get(Math.floor(p.x / C) + ',' + Math.floor(p.z / C)); if (!a) return null;
    for (const P of a) { _cv.copy(p).applyMatrix4(P.inv); const b = P.bb; if (!b.containsPoint(_cv)) continue;
      const d = [_cv.x - b.min.x, b.max.x - _cv.x, _cv.y - b.min.y, b.max.y - _cv.y, _cv.z - b.min.z, b.max.z - _cv.z]; let i = 0; for (let k = 1; k < 6; k++) if (d[k] < d[i]) i = k;
      const ax = i >> 1, sg = i & 1 ? 1 : -1; _cw.copy(_cv); if (ax === 0) _cw.x = sg > 0 ? b.max.x + 0.6 : b.min.x - 0.6; else if (ax === 1) _cw.y = sg > 0 ? b.max.y + 0.6 : b.min.y - 0.6; else _cw.z = sg > 0 ? b.max.z + 0.6 : b.min.z - 0.6;
      _cn.set(ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0).transformDirection(P.W); return { out: _cw.clone().applyMatrix4(P.W), n: _cn.clone() }; }
    return null; }

  // ============================== LE RELIEF : mesa, canyon, mine, vallee, gorge, ville ==============================
  const MESA = 240, WE = 7000, BX = 34, DECK = 150;   // le pont du train : 34 m a droite de la voie, tablier a 150 m (le niveau de la vallee)
  const WC0 = 420, WF0 = 2250, WF1 = 3000, WM0 = 3150, WG0 = 3430, WG1 = 3670, WM1 = 3800, WV0 = 4200, WV1 = 5250, WT0 = 6250;
  const hsh = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1 + 5.3, y * 2.1 + 9.1) * 0.3 + vn(x * 4.3 + 11.7, y * 4.3 + 3.9) * 0.15;
  const KEY = (K, w) => { if (w <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (w <= K[i + 1][0]) return K[i][1] + (K[i + 1][1] - K[i][1]) * ss(K[i][0], K[i + 1][0], w); return K[K.length - 1][1]; };
  // la voie (centre du vol) : le canyon serpente, la mine est droite, la vallee ondule, la gorge longe le pont
  const KU = [[0, 0], [420, 0], [800, -110], [1200, 110], [1600, -100], [2000, 100], [2250, 0], [2620, 70], [3000, 0], [4200, 0], [4550, -120], [4900, 120], [5250, 0], [5650, -70], [6050, 50], [6250, 0], [7000, 0]];
  const KY = [[0, MESA + 2.2], [150, MESA + 10], [400, MESA + 24], [800, 60], [1000, 45], [1300, 95], [1600, 50], [1900, 110], [2250, 60], [2620, 40], [3000, 40], [3150, 30], [3800, 30], [4200, 205], [4600, 195], [5000, 215], [5250, 205], [5450, 140], [6150, 140], [6330, 172], [7000, 172]];
  // lissage : aucun virage plus serre qu'un rayon de 200 m (de cote) et 130 m (en hauteur)
  const SMH = 10, SMN = Math.ceil(WE / SMH) + 1, SU = new Float32Array(SMN), SY = new Float32Array(SMN);
  { for (let i = 0; i < SMN; i++) { SU[i] = KEY(KU, i * SMH); SY[i] = KEY(KY, i * SMH); }
    const h2 = SMH * SMH; for (let it = 0; it < 30000; it++) { let bad = 0; for (let i = 3; i < SMN - 1; i++) { const lu = SU[i - 1] + SU[i + 1] - 2 * SU[i], ly = SY[i - 1] + SY[i + 1] - 2 * SY[i]; if (Math.hypot(lu / h2 * 200, ly / h2 * 130) > 1) { bad++; SU[i] += lu * 0.5; SY[i] += ly * 0.5; } } if (!bad) break; } }
  const SMI = (A, w) => { const u = Math.min(Math.max(w / SMH, 0), SMN - 1.0001), i = Math.floor(u), f = u - i; return A[i] + (A[i + 1] - A[i]) * f; };
  const pathU = (w) => SMI(SU, w), pathY = (w) => SMI(SY, w);
  // le profil : hauteur du plateau, fond, demi-largeur du fond, largeur de la paroi
  const TOPK = [[-600, MESA], [2950, MESA], [3100, 330], [4150, 330], [4350, 300], [5150, 300], [5250, DECK], [7800, DECK]];
  const FLK = [[-600, 0], [3820, 0], [4180, DECK], [5240, DECK], [5300, -120], [6120, -120], [6300, DECK], [7800, DECK]];
  const HWK = [[-600, 0], [400, 0], [440, 90], [2950, 85], [3060, 38], [3420, 38], [3450, 120], [3650, 120], [3680, 38], [3800, 38], [3840, 44], [4120, 44], [4300, 650], [5150, 650], [5260, 140], [6120, 140], [6300, 700], [7800, 700]];
  const RUNK = [[-600, 60], [400, 60], [440, 40], [2950, 40], [3060, 14], [3800, 14], [3840, 22], [4120, 22], [4300, 200], [5150, 200], [5260, 50], [6120, 50], [6300, 200], [7800, 200]];
  const hwB = (w) => KEY(HWK, w) + (w > 470 && w < 2950 ? 20 * Math.sin(w / 160) : 0), floorW = (w) => KEY(FLK, w), topW = (w) => KEY(TOPK, w);
  // les parois en strates : des corniches (paliers) entre des pans raides
  const strata = (t) => { const q = t * 4, k = Math.floor(q), f = q - k; return 0.55 * Math.min(1, (k + ss(0.3, 0.7, f)) / 4) + 0.45 * t; };
  const riverW = (w) => (w > 440 && w < 3060) || (w > 5290 && w < 6130);
  const chan = (ad, hb, run, fl, top, w) => { if (ad < hb) { let h = fl; if (riverW(w) && ad < hb * 0.32) h -= 3 * (1 - ad / (hb * 0.32)); return h; } if (ad < hb + run) return fl + (top - fl) * strata((ad - hb) / run); return top; };
  const offL = (w) => -175 * Math.sin(Math.PI * U.clamp((w - WF0) / (WF1 - WF0), 0, 1));   // la passe du haut (a gauche de la voie)
  // les buttes au loin (sommet plat, flancs raides) : jamais pres du chemin
  const BUT = []; { const R = (k) => hsh(k * 1.7, 3.1); for (let k = 0; k < 70; k++) { const w = -400 + R(k) * 8200, sd = R(k + 100) < 0.5 ? -1 : 1, d = sd * (420 + R(k + 200) * 2300), u = pathU(U.clamp(w, 0, WE)) + d, need = hwB(U.clamp(w, 0, WE)) + 260;
      if (Math.abs(d) < need) continue; BUT.push([u, w, 60 + R(k + 300) * 160, 330 + R(k + 400) * 200]); } }
  function H(u, w) {
    const wc = U.clamp(w, -600, WE + 800), d = u - pathU(U.clamp(w, 0, WE)), top0 = topW(wc), fl = floorW(wc), flat = ss(40, 160, Math.hypot(u, w));
    const top = top0 + 14 * (fbm(u * 0.01, w * 0.01) - 0.5) * flat + (wc > WV0 ? 12 * (fbm(u * 0.004, w * 0.004) - 0.5) : 0);
    let h = chan(Math.abs(d), hwB(wc), KEY(RUNK, wc), fl + (fl >= DECK - 1 && Math.abs(d) > 30 ? 8 * (fbm(u * 0.008, w * 0.008) - 0.5) : 0), top, wc);
    if (w > WF0 && w < WF1) h = Math.min(h, chan(Math.abs(d - offL(w)), 46, 26, 60, top, 0));
    h = top + (h - top) * ss(400, 430, w);
    for (const b of BUT) { const dd = Math.hypot(u - b[0], (w - b[1]) * 0.8); if (dd < b[2] + 50) h = Math.max(h, b[3] * (1 - ss(b[2] - 10, b[2] + 50, dd))); }
    return h;
  }
  const CPL = []; for (let w = 0; w <= WE; w += 25) CPL.push([pathU(w), pathY(w), w]);
  const LOC = (() => { const cv = new T3.CatmullRomCurve3(CPL.map((q) => new V(q[0], q[1], q[2])), false, 'centripetal', 0.5), len = cv.getLength(), N = Math.ceil(len / 2), P = cv.getSpacedPoints(N);
    return { len, sAtW: (w) => { for (let i = 0; i <= N; i++) if (P[i].z >= w) return i * len / N; return len; } }; })();
  const sW = (w) => Math.round(LOC.sAtW(w));
  const ZN = [[0, sW(WC0), 'wmesa', 'LA MESA', '#ffd27a', 'open'], [sW(WC0), sW(WF0), 'wcanyon', 'LE GRAND CANYON', '#ffb07a', 'open'], [sW(WF0), sW(WF1), 'wfourche', 'LES DEUX PASSES', '#ffc89a', 'open'],
    [sW(WF1), sW(WM1), 'wmine', 'LA MINE D OR', '#ffd04a', 'open'], [sW(WM1), sW(WV0), 'wcheminee', 'LA CHEMINEE', '#fff2a0', 'boost'], [sW(WV0), sW(WV1), 'wvallee', 'LA VALLEE DES TOURBILLONS', '#f8e0a0', 'open'],
    [sW(WV1), sW(WT0), 'wpont', 'LE PONT DU TRAIN', '#ffb04a', 'open'], [sW(WT0), 1e9, 'wville', 'LA VILLE FANTOME', '#ff9a7a', 'open']];
  const zoneAt = (s) => { for (let i = ZN.length - 1; i >= 0; i--) if (s >= ZN[i][0]) return i; return 0; };
  // l'ambiance (en w) : [w, ciel haut, horizon, brume, brume proche, brume loin, lumiere]
  const MOOD = [[0, '#5a7ac8', '#ffc890', '#f0b888', 600, 4200, 1.0], [500, '#4a86d8', '#ffe0b0', '#f0c8a0', 500, 3800, 1.05], [2950, '#4a86d8', '#ffe0b0', '#f0c8a0', 500, 3800, 1.05],
    [3130, '#2a1e18', '#3a2a1e', '#2a1e16', 90, 520, 0.5], [3800, '#2a1e18', '#3a2a1e', '#2a1e16', 90, 520, 0.5], [3950, '#8a6a4a', '#c8a070', '#a8845c', 250, 1400, 0.8],
    [4250, '#5a96e0', '#f8e0b8', '#f0d0a8', 700, 4800, 1.1], [5150, '#5a96e0', '#f8e0b8', '#f0d0a8', 700, 4800, 1.1], [5400, '#6a8ad0', '#ffd090', '#f0b880', 600, 4200, 1.05],
    [6150, '#6a8ad0', '#ffd090', '#f0b880', 600, 4200, 1.05], [6400, '#4a3a7a', '#ff9a5a', '#e8906a', 500, 3600, 0.92], [1e9, '#4a3a7a', '#ff9a5a', '#e8906a', 500, 3600, 0.92]];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color(), _c4 = new T3.Color();
  function moodAt(w) { let i = 0; while (i < MOOD.length - 2 && w > MOOD[i + 1][0]) i++; const A = MOOD[i], B = MOOD[i + 1], t = ss(A[0], B[0], w);
    return { top: _c1.set(A[1]).lerp(_c4.set(B[1]), t).clone(), hor: _c2.set(A[2]).lerp(_c4.set(B[2]), t).clone(), fog: _c3.set(A[3]).lerp(_c4.set(B[3]), t).clone(), near: U.lerp(A[4], B[4], t), far: U.lerp(A[5], B[5], t), li: U.lerp(A[6], B[6], t) }; }

  // ============================== OUTILS ==============================
  function buildPath(P0, F0) {
    const Y = new V(0, 1, 0), R0 = new V().crossVectors(F0, Y).normalize(), W = (q) => new V().copy(P0).addScaledVector(R0, q[0]).addScaledVector(Y, q[1]).addScaledVector(F0, q[2]);
    const curve = new T3.CatmullRomCurve3(CPL.map(W), false, 'centripetal', 0.5), len = curve.getLength(), N = Math.ceil(len / 2), P = curve.getSpacedPoints(N), step = len / N, T = [], UP = [];
    for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; T.push(new V().subVectors(b, a).normalize()); }
    for (let i = 0; i <= N; i++) UP.push(new V().copy(Y).addScaledVector(T[i], -Y.dot(T[i])).normalize());
    const fr = (s, o) => { const u = U.clamp(s / step, 0, N - 1e-4), i = Math.floor(u), f = u - i; o = o || {}; o.p = (o.p || new V()).lerpVectors(P[i], P[i + 1], f); o.t = (o.t || new V()).lerpVectors(T[i], T[i + 1], f).normalize(); o.u = (o.u || new V()).lerpVectors(UP[i], UP[i + 1], f).normalize(); o.r = (o.r || new V()).crossVectors(o.t, o.u).normalize(); return o; };
    const loc = (p) => { const dx = p.x - P0.x, dz = p.z - P0.z; return [dx * R0.x + dz * R0.z, dx * F0.x + dz * F0.z]; };
    const sAtW = (w) => { for (let i = 0; i <= N; i++) { const q = loc(P[i]); if (q[1] >= w) return i * step; } return len; };
    return { O: P0, F0, R0, len, step, N, P, T, fr, W, loc, sAtW };
  }
  const frameQ = (F, out) => out.setFromRotationMatrix(_m.makeBasis(F.r, F.u, _d.copy(F.t).negate()));
  const _PF = {};
  function placeAt(PA, o, s, x, y, zf) { const F = PA.fr(s, _PF); o.position.copy(F.p).addScaledVector(F.r, x || 0).addScaledVector(F.u, y || 0).addScaledVector(F.t, zf || 0); frameQ(F, o.quaternion); return o; }
  // un repere POSE A PLAT (x a droite de la voie, y vertical, z vers la fusee) : pour ce qui tient au sol (ponts, arches, maisons)
  function holdFlat(PA, grp, s) { const F = PA.fr(s), o = new T3.Group(), tf = new V(F.t.x, 0, F.t.z).normalize(), r = new V().crossVectors(tf, new V(0, 1, 0)).normalize(); o.position.copy(F.p); o.quaternion.setFromRotationMatrix(new T3.Matrix4().makeBasis(r, new V(0, 1, 0), tf.clone().negate())); grp.add(o); o.updateMatrixWorld(true); o.userData.F = F; return o; }
  const glowS = (size, col, op) => { const s = EVO.boss2Kit ? EVO.boss2Kit.glow(size, col) : new T3.Object3D(); if (s.material) s.material.opacity = op === undefined ? 1 : op; return s; };
  const nseg = (s) => Math.max(1, Math.min(120, Math.ceil(s / 18)));
  const SB = (x, y, z) => new T3.BoxGeometry(x, y, z, nseg(x), nseg(y), nseg(z));
  const CYG = (r0, r1, h, n) => new T3.CylinderGeometry(r0, r1, h, n || 12, nseg(h));
  function bake(parts) { const K = EVO.foireKit; if (K && K.bake) { const m = K.bake(parts); if (m.material) { m.material = m.material.clone(); m.material.color.setScalar(0.8); } return m; }
    const grp = new T3.Group(); for (const q of parts) { const m = new T3.Mesh(q.g, lam(q.c)); m.position.fromArray(q.p); if (q.r) m.rotation.fromArray(q.r); if (q.s) m.scale.fromArray(q.s); grp.add(m); } return grp; }
  const pC = (P, x, y, z, r0, r1, h, c, n, r) => P.push({ g: CYG(r0, r1, h, n), c, p: [x, y, z], r });
  const pS = (P, x, y, z, rad, c, s) => P.push({ g: new T3.SphereGeometry(rad, 12, 9), c, p: [x, y, z], s });
  const pX = (P, x, y, z, sx, sy, sz, c, r) => P.push({ g: SB(sx, sy, sz), c, p: [x, y, z], r });
  let DOT = null; const dotTex = () => { if (DOT) return DOT; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); DOT = new T3.CanvasTexture(c); return DOT; };
  let SHT = null; const shadowTex = () => { if (SHT) return SHT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); SHT = new T3.CanvasTexture(c); return SHT; };
  const lumpGeo = (sx, sy, sz, seed, det, amp) => { const g = new T3.IcosahedronGeometry(1, det || 2), P = g.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).normalize(); const w = 1 + amp * (Math.sin(q.x * 3.1 + seed) * Math.cos(q.y * 2.7 + seed * 1.7) + 0.6 * Math.sin(q.z * 5.3 + seed * 2.3) * Math.cos(q.x * 4.1 + seed) + 0.35 * Math.sin((q.x + q.y + q.z) * 9 + seed)); P.setXYZ(i, q.x * w * sx, q.y * w * sy, q.z * w * sz); } g.computeVertexNormals(); return g; };
  function waterTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#d8eef6'; x.fillRect(0, 0, 64, 256);
    for (let k = 0; k < 70; k++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(120,180,210,0.6)'; x.fillRect(rr(0, 64), rr(0, 256), rr(2, 6), rr(30, 120)); }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; return t; }
  let PUF = null; const puffTex = () => { if (PUF) return PUF; const c = document.createElement('canvas'); c.width = c.height = 128; const px = c.getContext('2d'); for (let k = 0; k < 9; k++) { const cx = 64 + (Math.random() - 0.5) * 60, cy = 70 + (Math.random() - 0.5) * 34, r = 22 + Math.random() * 18, gr = px.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); px.fillStyle = gr; px.fillRect(0, 0, 128, 128); } PUF = new T3.CanvasTexture(c); return PUF; };
  const cloudMat = (tex) => new T3.ShaderMaterial({ uniforms: { uMap: { value: tex }, uOp: { value: 0.7 }, uFar: { value: 5000 }, uC: { value: new T3.Color('#fff4e8') } },
    vertexShader: 'varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float sc = length(instanceMatrix[0].xyz); c.xy += position.xy * sc; vD = -c.z; gl_Position = projectionMatrix * c; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uOp; uniform float uFar; uniform vec3 uC; varying vec2 vUv; varying float vD; void main(){ float a = texture2D(uMap, vUv).a; vec3 c = mix(uC * 0.86, uC, smoothstep(0.15, 0.85, vUv.y)); float k = uOp * smoothstep(20.0, 140.0, vD) * (1.0 - smoothstep(uFar * 0.6, uFar, vD)); if (a * k < 0.01) discard; gl_FragColor = vec4(c, a * k); }',
    transparent: true, depthWrite: false, fog: false });
  const ROCK = ['#b8603a', '#c8744a', '#a85434', '#d08a58'], WOOD = ['#8a5a32', '#a06a3a', '#7a4a28', '#b07a46'];

  // ============================== LE SOL (strates, sable, riviere, galeries, rue) ==============================
  function terrain(PA, grp) {
    const P0 = PA.O, R0 = PA.R0, F0 = PA.F0, Dn = []; for (let d = 0; d <= 150; d += 5) Dn.push(d); for (let d = 160; d <= 300; d += 10) Dn.push(d); { let d = 300, st = 14; while (d < 2700) { d += st; st *= 1.16; Dn.push(Math.round(d)); } }
    const D = [...Dn.slice(1).reverse().map((d) => -d), ...Dn], nc = D.length, rows = []; for (let w = -600; w <= WE + 1500; w += (w > 380 && w < 460) ? 4 : 10) rows.push(w); const nr = rows.length;
    const pos = new Float32Array(nr * nc * 3), col = new Float32Array(nr * nc * 3), idx = [], c = new T3.Color(), HR = new Float32Array(nc);
    const C_ = (h) => new T3.Color(h), PAL = ['#c8643a', '#d8844a', '#b4502e', '#e2a868', '#c87444', '#f0c890', '#a84a2a', '#d89a5a'].map(C_);
    const K = { sand: C_('#e6c08a'), sand2: C_('#d8ae74'), riv: C_('#3a7aa8'), riv2: C_('#6aa8c8'), mine: C_('#5a4434'), top: C_('#d8a468'), top2: C_('#c48a52'), sage: C_('#8a9a5a'), street: C_('#e8cc98'), gorge: C_('#a85a34') };
    for (let j = 0; j < nr; j++) { const w = rows[j], wc = U.clamp(w, 0, WE), pu = pathU(wc), fl = floorW(U.clamp(w, -600, WE + 800)), hb = hwB(U.clamp(w, -600, WE + 800));
      for (let i = 0; i < nc; i++) HR[i] = H(pu + D[i], w);
      for (let i = 0; i < nc; i++) { const d = D[i], u = pu + d, h = HR[i], k = (j * nc + i) * 3, i0 = Math.max(0, i - 1), i1 = Math.min(nc - 1, i + 1), sl = Math.abs(HR[i1] - HR[i0]) / Math.max(1, D[i1] - D[i0]);
        pos[k] = P0.x + R0.x * u + F0.x * w; pos[k + 1] = P0.y + h; pos[k + 2] = P0.z + R0.z * u + F0.z * w;
        const nz = fbm(u * 0.02, w * 0.02);
        if (sl < 0.4) {
          if (h < fl + 4 && Math.abs(d) < hb + 4 && w > 430) { c.copy(K.sand).lerp(K.sand2, nz); if (riverW(w) && Math.abs(d) < hb * 0.34) c.copy(K.riv).lerp(K.riv2, ss(0.4, 0.8, fbm(u * 0.05, w * 0.012))); if (w > 3080 && w < 3820) c.copy(K.mine).multiplyScalar(0.8 + 0.4 * nz); if (fl < -60) c.lerp(K.gorge, 0.3); }
          else { c.copy(K.top).lerp(K.top2, nz); if (hsh(Math.floor(u / 7), Math.floor(w / 7)) < 0.07) c.copy(K.sage); }
          if (w > WT0 + 40 && Math.abs(d) < 18) c.copy(K.street).multiplyScalar(0.92 + 0.12 * nz);
        } else { c.copy(PAL[((Math.floor((h + 14 * fbm(u * 0.006, w * 0.006)) / 16) % 8) + 8) % 8]).multiplyScalar(1.02 - 0.18 * Math.min(1, sl / 4) + 0.1 * (nz - 0.5)); if (w > 3080 && w < 3820) c.multiplyScalar(0.55); }
        const j2 = 0.95 + 0.1 * hsh(i * 3.1, j * 1.7); col[k] = c.r * j2; col[k + 1] = c.g * j2; col[k + 2] = c.b * j2; } }
    for (let j = 0; j < nr - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c2 = a + nc, d2 = c2 + 1; idx.push(a, c2, b, b, c2, d2); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    { const n = geo.attributes.normal; let up = 0; for (let i = 0; i < n.count; i += 97) up += n.getY(i); if (up < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } geo.setIndex(idx); geo.computeVertexNormals(); } }
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true })); m.material.color.setScalar(0.7); m.frustumCulled = false; grp.add(m); L.ground = m;
  }
  const gH = (x, z) => { const q = L.PA.loc(_c.set(x, 0, z)); return L.PA.O.y + H(q[0], q[1]); };
  const atUW = (u, w, dy) => new V().copy(L.PA.O).addScaledVector(L.PA.R0, u).addScaledVector(L.PA.F0, w).setY(L.PA.O.y + H(u, w) + (dy || 0));

  // ============================== LES OMBRES (en lot) ==============================
  const SHAD = [];
  const shad = (p, r) => SHAD.push([p.x, p.y, p.z, r]);
  const shUW = (u, w, r) => shad(atUW(u, w), r);
  function batches(grp) { const o = new T3.Object3D();
    if (SHAD.length) { const sm = new T3.InstancedMesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#2a1810' }), SHAD.length);
      SHAD.forEach((s, i) => { o.position.set(s[0] + s[3] * 0.2, s[1] + 0.25, s[2] + s[3] * 0.15); o.scale.set(s[3], 1, s[3]); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.renderOrder = 1; sm.frustumCulled = false; grp.add(sm); } }

  // ============================== LES OBJETS DU FAR WEST (pieces locales : x, y = hauteur au-dessus du pied, z) ==============================
  const saguaro = (P, x, y, z, h, seed) => { const r = Math.max(1, h * 0.065), G = '#4f8a3c', G2 = '#3e7230'; pC(P, x, y + h / 2, z, r, r * 1.12, h, G, 10); pS(P, x, y + h, z, r, G);
    const na = 1 + Math.floor(hsh(seed, 2) * 3); for (let k = 0; k < na; k++) { const sd = (k % 2 ? -1 : 1) * (hsh(seed, k) < 0.5 ? 1 : -1), ay = y + h * (0.35 + 0.12 * k + 0.1 * hsh(seed, k + 5)), al = h * (0.22 + 0.14 * hsh(seed, k + 9)), az = z + (hsh(seed, k + 7) - 0.5) * r * 2;
      pC(P, x + sd * r * 1.6, ay, az, r * 0.7, r * 0.7, r * 2.2, G2, 8, [0, 0, Math.PI / 2]); pC(P, x + sd * r * 2.6, ay + al / 2, az, r * 0.7, r * 0.75, al, G, 8); pS(P, x + sd * r * 2.6, ay + al, az, r * 0.7, G); } };
  const hoodoo = (P, x, y, z, h, seed) => { let yy = y, r = h * 0.16; const n = 3 + Math.floor(hsh(seed, 1) * 2); for (let k = 0; k < n; k++) { const hh = h / n; P.push({ g: lumpGeo(r, hh * 0.62, r, seed + k, 1, 0.12), c: ROCK[(k + Math.floor(seed)) % 4], p: [x, yy + hh / 2, z] }); yy += hh * 0.9; r *= 0.78; }
    P.push({ g: lumpGeo(r * 2.2, h * 0.07, r * 2, seed + 9, 1, 0.15), c: '#7a4a2c', p: [x + r * 0.3, yy + h * 0.04, z] }); };
  const rockL = (P, x, y, z, s, seed) => P.push({ g: lumpGeo(s, s * 0.7, s * 0.9, seed, 1, 0.18), c: ROCK[Math.floor(hsh(seed, 3) * 4)], p: [x, y + s * 0.4, z], r: [0, seed, 0] });
  const barrel = (P, x, y, z, k) => { k = k || 1; pC(P, x, y + 1.5 * k, z, 1.1 * k, 1.1 * k, 3 * k, '#8a5a32', 12); for (const dy of [0.5, 1.5, 2.5]) pC(P, x, y + dy * k, z, 1.16 * k, 1.16 * k, 0.25 * k, '#3a3a40', 12); };
  const crate = (P, x, y, z, a, tnt) => { pX(P, x, y + a / 2, z, a, a, a, tnt ? '#b8302a' : '#a8783e'); for (const sd of [-1, 1]) pX(P, x, y + a / 2, z + sd * (a / 2 + 0.05), a * 0.95, a * 0.14, 0.12, '#6a4422'); if (tnt) for (let k = 0; k < 3; k++) pC(P, x - a * 0.25 + k * a * 0.25, y + a + 0.3, z, 0.25, 0.25, 0.7, '#e8302a', 8, [Math.PI / 2, 0, 0]); };
  // un chariot bache (axe le long de z)
  const wagon = (P, x, y, z) => { pX(P, x, y + 3, z, 6, 1.6, 12, '#8a5a32'); for (const sd of [-1, 1]) pX(P, x + sd * 3, y + 4, z, 0.4, 2.2, 12, '#7a4a28');
    for (let k = 0; k < 3; k++) P.push({ g: new T3.CylinderGeometry(3.2, 3.2, 3.6, 16, 1, true, -Math.PI / 2, Math.PI), c: '#f0e8d4', p: [x, y + 4, z - 4 + k * 4], r: [Math.PI / 2, 0, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { pC(P, x + sx * 3.4, y + 1.8, z + sz * 4, 1.8, 1.8, 0.4, '#5a3a20', 14, [0, 0, Math.PI / 2]); } pX(P, x, y + 2.4, z - 8, 0.3, 0.3, 5, '#5a3a20', [0.25, 0, 0]); };
  // une eolienne de pompage : la roue tourne (L.spinR)
  const windmill = (grp, p, ry) => { const pw = grp.localToWorld(p.clone()); const g = new T3.Group(), P = []; g.position.copy(p); g.rotation.y = ry; grp.add(g); const H2 = 24;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pX(P, sx * 2.2, H2 / 2, sz * 2.2, 0.5, H2 + 0.5, 0.5, '#8a6a4a', [sz * 0.08, 0, -sx * 0.08]);
    for (let k = 1; k < 4; k++) for (const sz of [-1, 1]) pX(P, 0, k * 6, sz * (2.2 - k * 0.35), 4.4 - k * 0.7, 0.3, 0.3, '#8a6a4a');
    pX(P, 0, H2 + 0.5, 0, 2, 1.4, 2.6, '#5a5a62'); pX(P, 0, H2 + 0.8, 3.5, 0.3, 2.4, 5, '#c8302a'); pC(P, 3, 3, 2, 3, 3, 6, '#9aa4ae', 16);   // la girouette, le reservoir
    const m = bake(P); g.add(m); colAdd(m, P.slice(0, 4));
    const wh = new T3.Group(); wh.position.set(0, H2 + 0.5, -1.6); g.add(wh); const Q = []; for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; Q.push({ g: new T3.BoxGeometry(0.7, 4.2, 0.12), c: '#e8e2d4', p: [Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0], r: [0, 0.3, a - Math.PI / 2] }); } wh.add(bake(Q)); (L.spinR = L.spinR || []).push(wh); shad(pw, 6); };
  // une maison de la ville (facade en faux-front tournee vers +z), largeur bw, profondeur bd, hauteur bh
  const building = (P, bw, bd, bh, c1, c2, sign) => { pX(P, 0, bh / 2, -bd / 2, bw, bh, bd, c1); pX(P, 0, bh + 3, 0.6, bw, 6, 1.2, c1); pX(P, 0, bh + 6.3, 0.6, bw + 0.8, 0.6, 1.6, c2);   // le corps, le faux-front
    pX(P, 0, bh * 0.45, 4.5, bw, 0.5, 9, '#6a4a2c', [0.12, 0, 0]); for (const sx of [-1, 1]) pX(P, sx * (bw / 2 - 0.6), bh * 0.22, 8.4, 0.5, bh * 0.44, 0.5, '#6a4a2c');   // l'auvent et ses poteaux
    pX(P, 0, 0.3, 4.5, bw, 0.6, 9, '#8a6a46'); pX(P, 0, bh * 0.2, 0.1, 3.2, bh * 0.4, 0.3, '#3a2616'); for (const sx of [-1, 1]) { pX(P, sx * bw * 0.3, bh * 0.22, 0.12, 2.6, 3, 0.3, '#2a2a34'); pX(P, sx * bw * 0.3, bh * 0.7, 0.12, 2.6, 3, 0.3, '#2a2a34'); }
    if (sign) pX(P, 0, bh + 3, 1.3, bw * 0.7, 2.6, 0.3, sign); };

  function decor(g, PA, grp) {
    const HG = new T3.Group(); HG.position.copy(PA.O); HG.rotation.y = Math.atan2(-PA.F0.x, -PA.F0.z); grp.add(HG); L.HG = HG; HG.updateMatrixWorld(true);
    const P = [], PC = [], at = (u, w) => H(u, w), sAt = (w) => PA.sAtW(w);
    const near = (u, w, m) => Math.abs(u - pathU(U.clamp(w, 0, WE))) < m;
    // les CACTUS en bouquets sur les plateaux, les pentes douces, la vallee, autour de la ville (jamais en rang)
    for (let k = 0; k < 120; k++) { const w = rr(-300, WE + 900), cu = pathU(U.clamp(w, 0, WE)) + (Math.random() < 0.5 ? -1 : 1) * rr(30, 1100), n = 2 + Math.floor(Math.random() * 6);
      for (let j = 0; j < n; j++) { const u = cu + rr(-45, 45), ww = w + rr(-45, 45); if (near(u, ww, 26)) continue; const h = at(u, ww); if (Math.abs(at(u + 4, ww) - h) > 3 || Math.abs(at(u, ww + 4) - h) > 3) continue; if (ww > WF1 + 50 && ww < WV0 && near(u, ww, 300)) continue; if (ww > WT0 - 20 && near(u, ww, 75)) continue;
        const hh = rr(9, 24); saguaro(Math.random() < 0.85 ? PC : P, u, h, -ww, hh, k * 7 + j); shUW(u, ww, hh * 0.25); } }
    // des ROCHERS et des BUISSONS secs
    for (let k = 0; k < 420; k++) { const w = rr(-300, WE + 900), u = pathU(U.clamp(w, 0, WE)) + (Math.random() < 0.5 ? -1 : 1) * rr(20, 900); if (near(u, w, 18)) continue; const h = at(u, w); if (w > WF1 + 50 && w < WV0 && near(u, w, 300)) continue;
      if (Math.random() < 0.55) { const s = rr(2, 9); rockL(s > 4 ? PC : P, u, h, -w, s, k); if (s > 5) shUW(u, w, s); } else P.push({ g: lumpGeo(rr(1.5, 3), 1.2, rr(1.5, 3), k, 1, 0.3), c: ['#9a8a5a', '#8a7a4a', '#a89a6a'][k % 3], p: [u, h + 0.8, -w] }); }
    // LA MESA : le ranch du depart (eolienne, abreuvoir, chariots, barriere, tonneaux) et le pas de tir
    windmill(HG, new V(-60, at(-60, 60), -60), 0.6); wagon(PC, 55, at(55, 40), -40); wagon(PC, -80, at(-80, 160), -160);
    for (let k = 0; k < 16; k++) { const u = -110 + k * 9, w = -40; pX(P, u, at(u, w) + 2.5, -w, 0.5, 5, 0.5, '#7a5a3a'); pX(P, u + 4.5, at(u, w) + 3.6, -w, 9, 0.4, 0.3, '#8a6a46'); pX(P, u + 4.5, at(u, w) + 1.8, -w, 9, 0.4, 0.3, '#8a6a46'); }
    pX(PC, -48, at(-48, 80) + 1, -80, 10, 2, 3, '#7a5a3a'); for (const [u, w] of [[30, 10], [33, 14], [-28, 30], [70, 90], [72, 94]]) barrel(PC, u, at(u, w), -w); crate(PC, -24, at(-24, 20), -20, 3, true); crate(PC, -27, at(-27, 22), -22, 2.4, false);
    // LE GRAND CANYON : la cascade (au bord d'une paroi), des cheminees de fee au pied des parois
    L.wTex = waterTex();
    for (const [w, sd] of [[1800, -1], [5700, 1]]) { const hb = hwB(w), u = pathU(w) + sd * (hb + 6), top = at(pathU(w) + sd * (hb + 60), w), fl = floorW(w), hh = top - fl;
      const m = new T3.Mesh(new T3.PlaneGeometry(16, hh, 1, 8), new T3.MeshBasicMaterial({ map: L.wTex, transparent: true, opacity: 0.85, depthWrite: false, side: T3.DoubleSide })); m.position.set(u, fl + hh / 2, -w); m.rotation.y = Math.PI / 2; HG.add(m); (L.falls = L.falls || []).push({ p: new V(u, fl + 2, -w), w }); }
    for (let k = 0; k < 60; k++) { const w = rr(480, WF1), sd = Math.random() < 0.5 ? -1 : 1, hb = hwB(w), u = pathU(w) + sd * rr(hb * 0.55, hb - 4); if (near(u, w, 40)) continue; const h = at(u, w); const hh = rr(18, 55); hoodoo(PC, u, h, -w, hh, k); shUW(u, w, hh * 0.2); }
    // LA VALLEE : des forets de cheminees de fee (pres du chemin pour sentir la vitesse, et au loin), des chariots, des eoliennes
    for (let k = 0; k < 140; k++) { const w = rr(WV0 + 40, WV1 - 20), sd = Math.random() < 0.5 ? -1 : 1, u = pathU(w) + sd * (Math.random() < 0.4 ? rr(45, 140) : rr(140, 600)); const h = at(u, w), hh = rr(25, 110); hoodoo(PC, u, h, -w, hh, k + 300); shUW(u, w, hh * 0.18); }
    for (const [u, w] of [[-260, 4400], [300, 4700], [-200, 5050]]) windmill(HG, new V(pathU(w) + u, at(pathU(w) + u, w), -w), rr(0, 6));
    for (const [u, w] of [[-120, 4500], [160, 4880], [90, 5150]]) wagon(PC, pathU(w) + u, at(pathU(w) + u, w), -w);
    { const hm = bake(P); HG.add(hm); } { const cm = bake(PC); HG.add(cm); colAdd(cm, PC); }
  }

  // ============================== LE CIEL ==============================
  function sky(g, PA, grp) {
    const S = new T3.Group(); L.sky = S; g.scene.add(S); if (EVO.boss2Kit) { const sun = EVO.boss2Kit.glow(520, '#fff0c8'); sun.renderOrder = -9; S.add(sun); L.sun = sun; }
    const M = cloudMat(puffTex()), P = []; for (let k = 0; k < 90; k++) { const w = rr(-500, WE + 3000), d = rr(-3000, 3000); const p = new V().copy(PA.O).addScaledVector(PA.R0, pathU(U.clamp(w, 0, WE)) + d).addScaledVector(PA.F0, w); P.push([p.x, PA.O.y + rr(800, 1400), p.z, rr(220, 480)]); }
    const im = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), M, P.length), o = new T3.Object3D(); P.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.scale.setScalar(q[3]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.frustumCulled = false; im.renderOrder = 4; grp.add(im); L.cloudIM = im;
  }

  // ============================== LES ETINCELLES (ennemis abattus, boss, arrivee) ==============================
  const FWC = ['#ff5a4a', '#ffd04a', '#ffb04a', '#ffffff', '#ff8a3a', '#f2c41a'];
  function fwPool(grp) { L.fw = []; for (let k = 0; k < 12; k++) { const n = 140, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const p = new T3.Points(geo, new T3.PointsMaterial({ size: 1.8, map: dotTex(), transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; p.visible = false; grp.add(p); L.fw.push({ p, pos, vel: new Float32Array(n * 3), t: 99, life: 2.2, n, gr: 7 }); } }
  function burst(c, col, sc, kind) { if (!L.fw) return; let F = L.fw.find((f) => f.t > f.life); if (!F) F = L.fw.reduce((a, b) => (a.t > b.t ? a : b)); sc = sc || 1;
    const ring = kind === 'ring', sp = 16 * sc, ax = new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize();
    for (let i = 0; i < F.n; i++) { let x, y, z; if (ring) { const a = i / F.n * 6.283; _a.set(Math.cos(a), Math.sin(a), 0); _b.copy(_a).applyAxisAngle(_c.set(1, 0, 0), ax.x * 1.4).applyAxisAngle(_d.set(0, 1, 0), ax.y * 3); x = _b.x; y = _b.y; z = _b.z; } else { const u = rr(-1, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); x = Math.cos(a) * q; y = u; z = Math.sin(a) * q; }
      const k = sp * (ring ? 1 : rr(0.5, 1)); F.vel[i * 3] = x * k; F.vel[i * 3 + 1] = y * k + 4; F.vel[i * 3 + 2] = z * k; F.pos[i * 3] = c.x; F.pos[i * 3 + 1] = c.y; F.pos[i * 3 + 2] = c.z; }
    F.t = 0; F.life = 2.2; F.p.material.color.set(col); F.p.material.size = 1.8 * sc; F.p.material.opacity = 1; F.p.visible = true; F.p.geometry.attributes.position.needsUpdate = true; }
  function fwTick(dt) { for (const F of L.fw) { if (F.t > F.life) { if (F.p.visible) F.p.visible = false; continue; } F.t += dt; const dr = Math.exp(-dt * 2.2), P = F.pos, Vv = F.vel;
    for (let i = 0; i < F.n * 3; i += 3) { Vv[i] *= dr; Vv[i + 1] = Vv[i + 1] * dr - F.gr * dt; Vv[i + 2] *= dr; P[i] += Vv[i] * dt; P[i + 1] += Vv[i + 1] * dt; P[i + 2] += Vv[i + 2] * dt; }
    F.p.material.opacity = 1 - ss(F.life * 0.5, F.life, F.t); F.p.geometry.attributes.position.needsUpdate = true; } }

  // ============================== LES EPREUVES : arches, ponts de corde, eboulements, roues, mine, cheminee, tourbillons, pont du train, ville ==============================
  const FORG = 0.4;
  function obstacles(g, PA, grp) {
    const OB = [], sAt = (w) => PA.sAtW(w), RKF = RK - FORG, flat = (w) => holdFlat(PA, grp, sAt(w));
    const ground = (s, x) => { const F = PA.fr(s), p = new V().copy(F.p).addScaledVector(F.r, x); return { p, gy: gH(p.x, p.z), F }; };
    const gyAt = (h, x) => { _a.set(x, 0, 0).applyMatrix4(h.matrixWorld); return gH(_a.x, _a.z) - h.position.y; };   // le sol sous un point x d'un repere a plat (en y local)
    const stat = (h, P, colP) => { const m = bake(P); h.add(m); h.updateMatrixWorld(true); colAdd(m, colP || P); return m; };
    const M = { frame: bas('#ffd23a', { fog: false }), gold: lam('#ffd040', { emissive: '#6a4a08' }) };
    L.spin = []; L.carts = []; L.devils = []; L.rolls = []; L.boostR = [];
    // UNE ARCHE NATURELLE en voussoirs (chaque bloc est une piece : on passe dessous ou dessus) ; apex : hauteur du sommet (au-dessus de la voie)
    const arch = (w, apex, th, cA) => { const h = flat(w), hb = hwB(w), ax = hb + 26, yc = gyAt(h, 0) + 8, ay = Math.max(20, apex + PA.O.y - h.position.y - yc), P = [], N = 16;
      for (let k = 0; k < N; k++) { const a0 = Math.PI * k / N, a1 = Math.PI * (k + 1) / N, x0 = Math.cos(a0) * ax, y0 = yc + Math.sin(a0) * ay, x1 = Math.cos(a1) * ax, y1 = yc + Math.sin(a1) * ay, ln = Math.hypot(x1 - x0, y1 - y0) + 2.5;
        P.push({ g: SB(ln, th, 22), c: cA || ROCK[k % 4], p: [(x0 + x1) / 2, (y0 + y1) / 2, 0], r: [0, 0, Math.atan2(y1 - y0, x1 - x0)] }); }
      for (const sd of [-1, 1]) P.push({ g: lumpGeo(26, 30, 18, w + sd, 1, 0.15), c: ROCK[2], p: [sd * ax, yc + 4, 0] });
      stat(h, P, P.slice(0, N)); };
    // UN PONT DE CORDE d'une paroi a l'autre (tablier qui pend, cordes), a la hauteur y (repere a plat)
    const rope = (w, yA) => { const h = flat(w), y = yA + PA.O.y - h.position.y, hb = hwB(w), ax = hb + 30, P = [], C = [], N = 8;
      for (let k = 0; k < N; k++) { const x0 = -ax + 2 * ax * k / N, x1 = -ax + 2 * ax * (k + 1) / N, sag = (x) => y - 9 * (1 - (x / ax) * (x / ax)); const y0 = sag(x0), y1 = sag(x1); const q = { g: SB(Math.hypot(x1 - x0, y1 - y0) + 0.5, 1.6, 6), c: WOOD[k % 4], p: [(x0 + x1) / 2, (y0 + y1) / 2, 0], r: [0, 0, Math.atan2(y1 - y0, x1 - x0)] }; P.push(q); C.push(q);
        for (const sd of [-1, 1]) P.push({ g: new T3.CylinderGeometry(0.18, 0.18, Math.hypot(x1 - x0, y1 - y0) + 0.5, 5), c: '#c8a870', p: [(x0 + x1) / 2, (y0 + y1) / 2 + 4, sd * 3], r: [0, 0, Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2] }); }
      for (let k = 0; k <= 2 * N; k++) { const x = -ax + ax * k / N; for (const sd of [-1, 1]) P.push({ g: new T3.CylinderGeometry(0.12, 0.12, 4, 4), c: '#c8a870', p: [x, y - 9 * (1 - (x / ax) * (x / ax)) + 2, sd * 3] }); }
      stat(h, P, C); };
    // UN EBOULEMENT : un rocher tombe du haut de la paroi et rebondit au fond, encore et encore (repere de la voie)
    const rockfall = (w, bx, R, per, ph) => { const s = sAt(w), h = new T3.Group(); placeAt(PA, h, s); grp.add(h); const G = ground(s, bx), b = G.gy - G.F.p.y, top = gH(G.p.x, G.p.z) + 260 - G.F.p.y;
      const m = new T3.Mesh(lumpGeo(R, R * 0.85, R, w, 1, 0.18), lam(ROCK[1])); h.add(m); const yAt = (t) => { const f = (((t + ph) / per) % 1 + 1) % 1; return f < 0.7 ? top - (top - b - R) * (f / 0.7) * (f / 0.7) : b + R + 30 * Math.sin(Math.PI * (f - 0.7) / 0.3) * (1 - (f - 0.7) / 0.3); };
      OB.push({ s, th: R + 0.5, kind: 'eboulis', upd: (t) => { m.position.set(bx, yAt(t), 0); m.rotation.x = t * 3; }, hit: (x, y, t) => Math.hypot(x - bx, y - yAt(t)) < R + RKF }); };
    // UNE ROUE qui tourne face a la fusee, centree en (cx, cy) : pales en secteurs, on passe entre elles (ou a cote)
    const wheel = (w, cx, cy, nb, R, bw, spd, cols, kind, legs) => { const s = sAt(w), h = new T3.Group(); placeAt(PA, h, s); grp.add(h); const rot = new T3.Group(); rot.position.set(cx, cy, 0); h.add(rot); const hub = Math.max(4, R * 0.1);
      for (let k = 0; k < nb; k++) { const sh = new T3.Shape(), a0 = -bw / 2, a1 = bw / 2; sh.moveTo(Math.cos(a0) * hub, Math.sin(a0) * hub); sh.absarc(0, 0, R, a0, a1, false); sh.lineTo(Math.cos(a1) * hub, Math.sin(a1) * hub); sh.absarc(0, 0, hub, a1, a0, true);
        const m = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false, curveSegments: 12 }), lam(cols[k % cols.length], { side: T3.DoubleSide })); m.rotation.z = k * 6.2832 / nb; rot.add(m); }
      const rim = new T3.Mesh(new T3.TorusGeometry(R, 1.2, 8, 48), lam('#5a3a20')); rot.add(rim); rot.add(new T3.Mesh(new T3.CylinderGeometry(hub, hub, 6, 18).rotateX(Math.PI / 2), lam('#3a3a40')));
      if (legs) { const G = ground(s, cx), b = G.gy - G.F.p.y; for (const sd of [-1, 1]) { const l = new T3.Mesh(new T3.BoxGeometry(2.4, cy - b + 4, 2.4), lam('#6a4a2c')); l.position.set(cx + sd * hub * 0.6, (cy + b) / 2, -6); l.rotation.z = sd * 0.08; h.add(l); } }
      const ang = (t) => spd * t; L.spin.push({ s, o: rot, ang });
      OB.push({ s, th: 2.6, kind, hit: (x, y, t) => { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy); if (r < hub + RKF) return true; if (r > R + 1.2 + RKF) return false; if (Math.abs(r - R) < 1.2 + RKF) return true;
        let ph = Math.atan2(dy, dx) - ang(t); for (let k = 0; k < nb; k++) { let d = ph - k * 6.2832 / nb; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < bw / 2 + RKF / Math.max(r, 1)) return true; } return false; } }); };
    // UN WAGONNET de mine qui roule sur les rails VERS la fusee (entre les s a et b)
    const cartGeo = () => { const P = []; pX(P, 0, 4.2, 0, 7, 4.4, 10, '#6a6a72'); pX(P, 0, 6.6, 0, 7.4, 0.6, 10.4, '#4a4a52'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) pC(P, sx * 3.2, 1.6, sz * 3.2, 1.5, 1.5, 0.8, '#2a2a30', 12, [0, 0, Math.PI / 2]); for (let k = 0; k < 5; k++) pS(P, rr(-2.5, 2.5), 7.2, rr(-3.5, 3.5), rr(1, 1.8), k % 2 ? '#ffd040' : '#8a7a6a'); return bake(P); };
    const carts = (a, b, n, v) => { for (let k = 0; k < n; k++) { const m = cartGeo(); m.visible = false; grp.add(m); L.carts.push({ a: sAt(a), b: sAt(b), ph: k / n, v, m, s: 0, on: false }); } OB.push({ s: sAt(a) + 80, th: 0, kind: 'wagon', hit: () => false }); };
    // LES FERS A CHEVAL DORES : on passe dedans = boost
    const RG = (() => { const g = new T3.TorusGeometry(6.5, 1.3, 10, 32, Math.PI * 1.6); g.rotateZ(-Math.PI * 0.3 - Math.PI / 2); return g; })();
    const horseshoe = (w, x, y) => { const s = sAt(w), h = new T3.Group(); placeAt(PA, h, s); grp.add(h); const m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(RG, lam('#ffc83a', { emissive: '#8a5a08', emissiveIntensity: 0.6 }))); m.add(glowS(22, '#ffe08a', 0.5)); L.boostR.push({ s, x, y, m, done: false }); };
    // ---------- LE GRAND CANYON ----------
    arch(900, pathY(900) + 30); rope(1100, pathY(1100) - 22); rockfall(1250, -22, 7, 3.2, 0); rockfall(1270, 26, 6, 2.6, 1.3);
    arch(1450, pathY(1450) - 26, 14); rope(1650, pathY(1650) + 24); arch(1950, pathY(1950) + 34); arch(1990, pathY(1990) - 30, 10, '#a85434'); rope(2150, pathY(2150) - 20); rockfall(2080, 10, 8, 3.0, 0.6);
    // ---------- LES DEUX PASSES : en bas la riviere (roue a aubes, pont de corde), en haut les corniches (arches basses, cheminees de fee) ----------
    wheel(2620, 0, 0, 8, 40, 0.34, 0.55, WOOD, 'roue', true); rope(2470, pathY(2470) + 20); rockfall(2840, -14, 7, 2.8, 0.4);
    { for (const [w, dy] of [[2450, 46], [2650, 26], [2820, 52]]) { const h = flat(w), xo = offL(w), y0 = gyAt(h, xo), P = [], N = 10, ax = 70, ay = dy; for (let k = 0; k < N; k++) { const a0 = Math.PI * k / N, a1 = Math.PI * (k + 1) / N, x0 = xo + Math.cos(a0) * ax, yy0 = y0 + Math.sin(a0) * ay, x1 = xo + Math.cos(a1) * ax, yy1 = y0 + Math.sin(a1) * ay; P.push({ g: SB(Math.hypot(x1 - x0, yy1 - yy0) + 2.5, 9, 16), c: ROCK[k % 4], p: [(x0 + x1) / 2, (yy0 + yy1) / 2, 0], r: [0, 0, Math.atan2(yy1 - yy0, x1 - x0)] }); } stat(h, P); } }
    // ---------- LA MINE D'OR : le portail, la roche au-dessus des galeries, les etais, les lampes, les rails, les wagonnets, la grande salle ----------
    { const Wd = '#6a4a2c', Wd2 = '#4a321e';
      for (let w = WM0; w < WM1; w += 50) { const big = w + 25 > WG0 && w + 25 < WG1, h = flat(w + 25), fy = gyAt(h, 0), roof = fy + (big ? 150 : 70), half = big ? 140 : 62, P = [];
        P.push({ g: SB(half * 2, 330 + 40 - roof - h.position.y + PA.O.y, 52), c: '#5a4030', p: [0, (roof + 330 + 40 + PA.O.y - h.position.y) / 2, 0] }); stat(h, P); }
      for (let w = WM0; w < WM1; w += 45) { const h = flat(w), big = w > WG0 && w < WG1, fy = gyAt(h, 0), roof = fy + (big ? 150 : 70), P = [], C = [];
        if (!big) { for (const sd of [-1, 1]) { const q = { g: SB(2.6, roof - fy, 2.6), c: Wd, p: [sd * 33, (roof + fy) / 2, 0] }; P.push(q); C.push(q); } const q = { g: SB(70, 3, 3), c: Wd2, p: [0, roof - 3, 0] }; P.push(q); C.push(q); for (const sd of [-1, 1]) P.push({ g: SB(6, 1.2, 1.2), c: Wd, p: [sd * 29.5, roof - 6, 0], r: [0, 0, sd * 0.7] }); }
        P.push({ g: SB(0.5, 0.3, 45), c: '#9aa4ae', p: [-2.2, fy + 0.4, -22] }, { g: SB(0.5, 0.3, 45), c: '#9aa4ae', p: [2.2, fy + 0.4, -22] }); for (let k = 0; k < 9; k++) P.push({ g: SB(6.4, 0.4, 1.2), c: Wd2, p: [0, fy + 0.15, -k * 5] });   // les rails
        stat(h, P, C); const sd = (Math.round(w / 45) % 2) ? 1 : -1, lp = new V(sd * (big ? 60 : 28), roof - (big ? 20 : 9), 0); const lmp = new T3.Mesh(new T3.SphereGeometry(1.1, 10, 8), bas('#ffd890')); lmp.position.copy(lp); h.add(lmp); const gw = glowS(big ? 60 : 36, '#ffb050', 0.75); gw.position.copy(lp); h.add(gw); }
      // le portail d'entree (poutres, enseigne), les caisses de dynamite
      { const h = flat(WM0 - 4), fy = gyAt(h, 0), P = [], C = []; for (const sd of [-1, 1]) { const q = { g: SB(5, 74, 5), c: Wd, p: [sd * 36, fy + 37, 0] }; P.push(q); C.push(q); } { const q = { g: SB(84, 6, 6), c: Wd2, p: [0, fy + 72, 0] }; P.push(q); C.push(q); } P.push({ g: SB(40, 8, 1), c: '#c8a060', p: [0, fy + 82, 1] }, { g: SB(36, 1.2, 1.2), c: '#3a2616', p: [0, fy + 82, 1.6] });
        for (const sd of [-1, 1]) { crate(P, sd * 26, fy, 6, 4, true); barrel(P, sd * 22, fy, 10); } stat(h, P, C); }
      // la grande salle : le filon dore (cristaux), les tas de minerai, la roue a godets
      { const Q = [], h = flat((WG0 + WG1) / 2); for (let k = 0; k < 90; k++) { const zz = rr(-120, 120), sd = Math.random() < 0.5 ? -1 : 1, x = sd * rr(100, 132), y0 = gyAt(h, x) + rr(4, 120); Q.push({ g: new T3.OctahedronGeometry(rr(2, 5), 0), c: '#ffd040', p: [x, y0, zz], r: [rr(0, 3), rr(0, 3), rr(0, 3)], s: [1, rr(1.4, 2.4), 1] }); }
        const m = bake(Q); m.material = M.gold; h.add(m); for (let k = 0; k < 8; k++) { const gw = glowS(70, '#ffc840', 0.35); gw.position.set((k % 2 ? 1 : -1) * 110, gyAt(h, 0) + 40 + (k % 3) * 30, -110 + k * 30); h.add(gw); } }
      wheel((WG0 + WG1) / 2, 0, 42, 10, 54, 0.26, 0.5, ['#7a5a3a', '#6a4a2c'], 'godets', true);
      carts(WM0 + 60, WG0 - 20, 2, 26); carts(WG1 + 20, WM1 - 10, 2, 30); }
    // ---------- LA CHEMINEE : des plateformes de bois en quinconce (on serpente de l'une a l'autre en montant) ----------
    for (const [w, sd] of [[3880, 1], [3960, -1], [4040, 1], [4120, -1]]) { const h = flat(w), y = pathY(w) - h.position.y + PA.O.y + 4, P = [], C = [], hb = hwB(w) + 10;
      const q = { g: SB(hb + 8, 3, 26), c: WOOD[1], p: [sd * (hb - (hb + 8) / 2), y, 0] }; P.push(q); C.push(q); for (let k = 0; k < 4; k++) P.push({ g: SB(1.6, 14, 1.6), c: WOOD[2], p: [sd * (hb - 4 - k * 9), y - 8, 0], r: [0, 0, sd * 0.6] }); for (const x of [sd * 8, sd * 20]) { barrel(P, x, y + 1.5, -6); } stat(h, P, C); }
    // ---------- LA VALLEE DES TOURBILLONS : rochers qui roulent, tourbillons de sable ----------
    const roller = (w, R, per, ph) => { const s = sAt(w), h = new T3.Group(); placeAt(PA, h, s); grp.add(h); const G = ground(s, 0), b = G.gy - G.F.p.y, m = new T3.Mesh(lumpGeo(R, R, R, w, 1, 0.12), lam(ROCK[0])); h.add(m);
      const sh = new T3.Mesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#2a1810' })); sh.scale.setScalar(R * 1.2); h.add(sh);
      const tx = (t) => { const f = ((t + ph) / per % 1 + 1) % 1, k = f < 0.5 ? f * 2 : 2 - f * 2; return -170 + 340 * ss(0, 1, k); };
      L.rolls.push({ s, m, sh, tx, b, R }); OB.push({ s, th: R, kind: 'rocher', upd: (t) => { const x = tx(t), gb = (() => { const q = ground(s, x); return q.gy - q.F.p.y; })(); m.position.set(x, gb + R * 0.9, 0); m.rotation.z = -x / R; sh.position.set(x, gb + 0.3, 0); }, hit: (x, y, t) => { const bx = tx(t), q = ground(s, bx); return Math.hypot(x - bx, y - (q.gy - q.F.p.y + R * 0.9)) < R + RKF; } }); };
    roller(4480, 11, 7, 0); roller(4760, 13, 8, 2); roller(4990, 10, 6, 1); roller(5120, 12, 7.5, 3.4);
    const devil = (w, x0, amp, per) => { const s = sAt(w), n = 300, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const ph = new Float32Array(n * 3); for (let i = 0; i < n; i++) { ph[i * 3] = rr(0, 6.28); ph[i * 3 + 1] = Math.pow(Math.random(), 0.8); ph[i * 3 + 2] = rr(0.6, 1.4); }
      const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#d8b080', size: 2.6, map: dotTex(), transparent: true, opacity: 0.75, depthWrite: false })); p.frustumCulled = false; grp.add(p);
      const cone = new T3.Mesh(new T3.CylinderGeometry(26, 5, 120, 20, 1, true), new T3.MeshBasicMaterial({ color: '#d8b080', transparent: true, opacity: 0.16, depthWrite: false, side: T3.DoubleSide })); grp.add(cone);
      L.devils.push({ s, x0, amp, per, p, ph, n, cone, x: x0 }); OB.push({ s: s - 40, th: 0, kind: 'tourbillon', hit: () => false }); };
    devil(4380, -40, 50, 9); devil(4640, 30, 60, 11); devil(4880, -10, 70, 10); devil(5100, 20, 40, 8);
    // ---------- LE PONT DU TRAIN : piles en treillis au-dessus de la gorge, tablier, rails ; fers a cheval dores sous le tablier ----------
    { const s0 = sAt(WV1 - 30), s1 = sAt(WT0 + 30), stp = 36; for (let s = s0; s < s1; s += stp) { const h = holdFlat(PA, grp, s), dy = DECK + PA.O.y - h.position.y, fy = gyAt(h, BX), P = [], C = [], Hh = dy - fy;
        if (Hh > 6) { for (const sd of [-1, 1]) { const xt = BX + sd * 5, xb = BX + sd * (5 + Hh * 0.1), q = { g: SB(1.8, Math.hypot(Hh, xb - xt), 1.8), c: '#6a4a2c', p: [(xt + xb) / 2, fy + Hh / 2, 0], r: [0, 0, Math.atan2(xt - xb, Hh)] }; P.push(q); C.push(q); }
          for (let y = fy + 12; y < dy - 8; y += 26) { const sp = 5 + (dy - y) * 0.1, sp2 = 5 + (dy - y - 20) * 0.1; for (const sd of [-1, 1]) P.push({ g: SB(Math.hypot(sp + sp2, 20), 0.9, 0.9), c: '#7a5434', p: [BX, y + 10, sd * 0.6], r: [0, 0, sd * Math.atan2(20, sp + sp2)] }); P.push({ g: SB(sp * 2, 0.9, 0.9), c: '#7a5434', p: [BX, y, 0] }); } }
        const q = { g: SB(12, 2.4, stp + 0.5), c: '#7a5434', p: [BX, dy - 1.2, -stp / 2] }; P.push(q); C.push(q); for (const sd of [-1, 1]) P.push({ g: SB(0.5, 0.5, stp + 0.5), c: '#9aa4ae', p: [BX + sd * 2.2, dy + 0.3, -stp / 2] }); for (let k = 0; k < 7; k++) P.push({ g: SB(6.4, 0.5, 1.2), c: '#4a321e', p: [BX, dy + 0.1, -k * stp / 7] });
        stat(h, P, C); }
      for (const [w, x, y] of [[5420, -6, -8], [5560, 10, 4], [5700, 0, -6], [5840, -12, 2], [5980, 6, -4]]) horseshoe(w, x, y); }
    // le train a vapeur (locomotive, tender, voitures) qui file sur le pont
    { const mk = (P) => { const m = bake(P); grp.add(m); m.visible = false; return m; }, cars = [];
      { const P = []; pC(P, 0, 6.5, -2, 3.2, 3.2, 16, '#2a2a30', 18, [Math.PI / 2, 0, 0]); for (const z of [-8, -2, 4]) pC(P, 0, 6.5, z, 3.35, 3.35, 0.6, '#c8a040', 18, [Math.PI / 2, 0, 0]); pC(P, 0, 12, -7.5, 1.2, 2.2, 5, '#2a2a30', 12); pX(P, 0, 8, 8, 6.4, 8, 6, '#a8302a'); pX(P, 0, 12.4, 8, 7, 0.8, 7, '#2a2a30');
        for (const sd of [-1, 1]) for (const z of [-6, -1, 4]) pC(P, sd * 3, 2.6, z, 2.4, 2.4, 0.6, '#c8302a', 14, [0, 0, Math.PI / 2]); pS(P, 0, 7, -10.4, 1.4, '#fff4c0'); pX(P, 0, 2, -11, 6, 2, 2, '#c8302a', [0.5, 0, 0]); cars.push({ m: mk(P), off: 0, len: 22 }); }
      { const P = []; pX(P, 0, 5, 0, 6.4, 6, 10, '#2a2a30'); pX(P, 0, 8.4, 0, 5, 1.6, 8, '#1a1a1e'); for (const sd of [-1, 1]) for (const z of [-3, 3]) pC(P, sd * 3, 1.8, z, 1.6, 1.6, 0.6, '#c8302a', 12, [0, 0, Math.PI / 2]); cars.push({ m: mk(P), off: 17, len: 11 }); }
      for (let k = 0; k < 4; k++) { const P = [], cc = ['#a8302a', '#2a6a4a', '#c8a040', '#3a5a8a'][k]; pX(P, 0, 6, 0, 6.6, 7, 16, cc); pX(P, 0, 10, 0, 7.4, 1, 17, '#3a2a20', [0, 0, 0]); for (let j = 0; j < 4; j++) for (const sd of [-1, 1]) pX(P, sd * 3.32, 7, -6 + j * 4, 0.1, 2.4, 2.4, '#f0d890');
        for (const sd of [-1, 1]) for (const z of [-5, 5]) pC(P, sd * 3, 1.8, z, 1.6, 1.6, 0.6, '#2a2a30', 12, [0, 0, Math.PI / 2]); cars.push({ m: mk(P), off: 31 + k * 18, len: 17 }); }
      L.train = { cars, s: 0, v: 60, on: false, done: false, sEnd: sAt(WT0 + 20) }; OB.push({ s: sAt(WV1 + 80), th: 0, kind: 'train', hit: () => false }); }
    // ---------- LA VILLE FANTOME : la rue (rails du boss au milieu), les maisons a faux-front, le chateau d'eau, l'eglise, la banderole, les tonneaux qui roulent ----------
    { const s0 = sAt(WT0 + 60), s1 = PA.len - 120, CL = [['#a87850', '#5a4030', '#e8d8a0'], ['#8a6440', '#3a2a1a', '#c8302a'], ['#c89a6a', '#6a4a2c', '#2a6a4a'], ['#b0603a', '#4a3020', '#f2c41a'], ['#9a8a7a', '#4a4040', '#e8e0d0']];
      for (const sd of [-1, 1]) { let s = s0 + (sd > 0 ? 10 : 30); while (s < s1) { const bw = rr(14, 22), bd = rr(14, 20), bh = rr(10, 17), cl = CL[Math.floor(Math.random() * CL.length)], h = holdFlat(PA, grp, s + bw / 2), x = sd * 24, gy = gyAt(h, x), P = [];
          const g2 = new T3.Group(); g2.position.set(x, gy, 0); g2.rotation.y = -sd * Math.PI / 2; h.add(g2); building(P, bw, bd, bh, cl[0], cl[1], Math.random() < 0.7 ? cl[2] : null); if (Math.random() < 0.6) barrel(P, bw * 0.3, 0, 7.5); const m = bake(P); g2.add(m); g2.updateMatrixWorld(true); colAdd(m, P.slice(0, 3)); shad(_a.set(0, 0, 0).applyMatrix4(g2.matrixWorld).clone(), bw * 0.4);
          s += bw + rr(4, 12); } }
      // les rails du boss au milieu de la rue
      for (let s = s0 - 40; s < PA.len - 20; s += 30) { const h = holdFlat(PA, grp, s), gy = gyAt(h, 0), P = []; for (const sd of [-1, 1]) P.push({ g: SB(0.5, 0.5, 30.5), c: '#9aa4ae', p: [sd * 2.2, gy + 0.6, -15] }); for (let k = 0; k < 6; k++) P.push({ g: SB(6.4, 0.5, 1.2), c: '#4a321e', p: [0, gy + 0.2, -k * 5] }); h.add(bake(P)); }
      { const h = holdFlat(PA, grp, sAt(WT0 + 260)), x = 46, gy = gyAt(h, x), P = []; for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push({ g: SB(1.2, 30, 1.2), c: '#6a4a2c', p: [x + sx * 4, gy + 15, sz * 4] }); P.push({ g: CYG(6, 6, 9, 18), c: '#8a6440', p: [x, gy + 34.5, 0] }, { g: new T3.ConeGeometry(7, 4, 18), c: '#5a4030', p: [x, gy + 41, 0] }); stat(h, P); shad(_a.set(x, gy, 0).applyMatrix4(h.matrixWorld).clone(), 9); }
      { const h = holdFlat(PA, grp, PA.len - 150), x = -40, gy = gyAt(h, x), P = []; pX(P, x, gy + 9, -10, 22, 18, 30, '#e8e0d0'); P.push({ g: new T3.ConeGeometry(17, 10, 4), c: '#5a4030', p: [x, gy + 23, -10], r: [0, Math.PI / 4, 0] }); pX(P, x, gy + 26, 4, 7, 16, 7, '#e8e0d0'); P.push({ g: new T3.ConeGeometry(5.5, 9, 4), c: '#5a4030', p: [x, gy + 38.5, 4], r: [0, Math.PI / 4, 0] }); pX(P, x, gy + 45, 4, 0.5, 4, 0.5, '#3a2616'); pX(P, x, gy + 45.5, 4, 2.4, 0.5, 0.5, '#3a2616'); stat(h, P); }
      { const h = holdFlat(PA, grp, sAt(WT0 + 420)), gy = gyAt(h, 0), P = [], C = []; for (const sd of [-1, 1]) { const q = { g: SB(1.4, 34, 1.4), c: '#6a4a2c', p: [sd * 22, gy + 17, 0] }; P.push(q); C.push(q); } const q = { g: SB(40, 4, 0.6), c: '#e8d8a0', p: [0, gy + 30, 0] }; P.push(q); C.push(q); P.push({ g: SB(40.6, 0.6, 0.8), c: '#c8302a', p: [0, gy + 32, 0] }, { g: SB(40.6, 0.6, 0.8), c: '#c8302a', p: [0, gy + 28, 0] }); stat(h, P, C); }
      // les tonneaux qui roulent dans la rue vers la fusee
      for (let k = 0; k < 4; k++) { const P = []; pC(P, 0, 0, 0, 2.2, 2.2, 5, '#8a5a32', 14, [0, 0, Math.PI / 2]); for (const dx of [-1.6, 0, 1.6]) pC(P, dx, 0, 0, 2.32, 2.32, 0.4, '#3a3a40', 14, [0, 0, Math.PI / 2]); const m = bake(P); m.visible = false; grp.add(m); L.carts.push({ a: sAt(WT0 + 120), b: sAt(WT0 + 560), ph: k / 4, v: 34, m, s: 0, on: false, barrel: true, lane: [-10, 8, -4, 12][k] }); }
      OB.push({ s: sAt(WT0 + 140), th: 0, kind: 'tonneau', hit: () => false }); }
    L.OB = OB; L.O = OB;
    // l'ARRIVEE : le portail du ranch (deux troncs, une poutre, l'enseigne qui pend)
    { const h = holdFlat(PA, grp, PA.len - 70), gy = gyAt(h, 0), P = [], C = []; for (const sd of [-1, 1]) { const q = { g: CYG(1.6, 1.9, 44, 10), c: '#6a4a2c', p: [sd * 34, gy + 22, 0] }; P.push(q); C.push(q); } { const q = { g: SB(76, 3, 3), c: '#5a3a20', p: [0, gy + 42, 0] }; P.push(q); C.push(q); }
      P.push({ g: SB(30, 7, 0.8), c: '#e8d8a0', p: [0, gy + 34, 0.6] }); for (let k = 0; k < 12; k++) P.push({ g: SB(2.2, 2.2, 0.9), c: k % 2 ? '#1e2026' : '#f4f2ec', p: [-12.1 + k * 2.2, gy + 34, 1.1] }); for (const sd of [-1, 1]) P.push({ g: SB(0.2, 4, 0.2), c: '#3a2616', p: [sd * 12, gy + 39.5, 0.6] }); stat(h, P, C);
      for (const sd of [-1, 1]) { const gw = glowS(40, '#fff0a0', 0.5); gw.position.set(sd * 34, gy + 44, 0); h.add(gw); } }
  }

  // ============================== LES ENNEMIS : ballons de bandits (on fonce dedans), batons de dynamite (on les evite) ==============================
  function balloonMesh(big) { const g = new T3.Group(), k = big ? 1.6 : 1, cA = big ? '#f2c41a' : '#e8302a', cB = big ? '#c8302a' : '#f4ecd8';
    for (let j = 0; j < 8; j++) { const m = new T3.Mesh(new T3.SphereGeometry(4 * k, 8, 12, j / 8 * 6.283, 6.283 / 8), lam(j % 2 ? cA : cB, { emissive: '#201008' })); m.scale.y = 1.25; m.position.y = 4 * k; g.add(m); }
    const bk = new T3.Mesh(new T3.BoxGeometry(2 * k, 1.6 * k, 2 * k), lam('#8a5a32')); bk.position.y = -2.6 * k; g.add(bk); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const r = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.06, 2.6 * k, 4), lam('#c8a870')); r.position.set(sx * 0.9 * k, -0.9 * k, sz * 0.9 * k); g.add(r); }
    for (let j = 0; j < 3; j++) { const d = new T3.Mesh(new T3.CylinderGeometry(0.25 * k, 0.25 * k, 1.6 * k, 6), lam('#e8302a')); d.position.set(-0.5 * k + j * 0.5 * k, -4 * k, 0); g.add(d); }
    g.add(glowS(big ? 14 : 9, '#ffe0a0', 0.2)); return g; }
  function enemies(g, PA, grp) {
    L.sent = []; L.chase = []; L.bul = []; const sAt = (w) => PA.sAtW(w);
    const sent = (w, x, y, big) => { const m = balloonMesh(big); grp.add(m); L.sent.push({ s: sAt(w), x, y, m, alive: true, fT: rr(0.8, 2), ph: rr(0, 6), big }); };
    for (const [w, x, y] of [[250, 20, 15], [350, -25, 5], [700, 0, 20], [1050, -30, 10], [1400, 25, 25], [1750, -20, -10], [2100, 30, 20], [2500, -20, 15], [2850, 20, 5], [4350, -30, 25], [4550, 40, 10], [4800, -20, 30], [5050, 30, -10], [5500, -20, 20], [5800, 10, -15], [6100, -30, 10], [6450, 15, 15], [6650, -15, 20]]) sent(w, x, y, false);
    for (const [w, x, y] of [[1500, -40, 30], [4700, 0, 40]]) sent(w, x, y, true);
    for (const [a, b, n] of [[sAt(4300), sAt(5050), 2], [sAt(5400), sAt(6100), 2]]) for (let k = 0; k < n; k++) { const m = balloonMesh(false); m.visible = false; grp.add(m); L.chase.push({ a, b, k, n, m, ds: 260, fT: 1 + k * 0.6, ph: k * 2.1, on: false, x: 0, y: 0 }); }
    const dB = new T3.CylinderGeometry(0.3, 0.3, 2, 8).rotateX(Math.PI / 2), mR = lam('#e8302a', { emissive: '#3a0604' });
    for (let i = 0; i < 24; i++) { const m = new T3.Group(), body = new T3.Group(); m.add(body); body.add(new T3.Mesh(dB, mR)); const sp = glowS(4, '#ffd060', 0.9); sp.position.z = -1.2; body.add(sp); m.visible = false; grp.add(m); L.bul.push({ m, body, on: false, s: 0, x: 0, y: 0, vs: 0, vx: 0, vy: 0, t: 0 }); }
  }
  const fire = (g, s, x, y) => { const b = L.bul.find((q) => !q.on); if (!b) return; const vs = -18, tau = Math.max(0.6, (s - L.s) / Math.max(20, L.v - vs)), a = rr(0, 6.28), off = Math.random() < 0.2 ? rr(0.6, 1.6) : rr(2.6, 5);
    Object.assign(b, { on: true, s, x, y, vs, vx: (L.x + Math.cos(a) * off - x) / tau, vy: (L.y + Math.sin(a) * off - y) / tau, t: 0 }); b.m.visible = true; g.audio.play('whoosh'); };
  const missileHit = (g, rk) => { rk.vel.multiplyScalar(0.75); L.inv = 0.6; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); burst(rk.pos.clone(), '#ff8a4a', 0.4); g.audio.play('boomSmall', rk.pos); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.2; g.flashColor = '#ffb070'; (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' }); };
  function killFx(g, rk, p, big) { const fx = g.effects, up = new V(0, 1, 0), vel = rk.vel ? rk.vel.clone() : new V(0, 0, -30), c = p.clone();
    fx.explosion(c, null, true, 'orange'); fx.ring(c, up, 2, 26, 0.6, '#ffd060', 0.95); fx.ring(c, vel.clone().normalize(), 1, 20, 0.5, '#ffffff', 0.85); fx.flash(c, '#ffb040', 8, 90, 0.35, '#ff5020');
    g.hitStop = 0.09; g.hitScale = 0.18; const sz = new V(5, 5, 1); fx.shatter(c, sz, vel, 'planks'); burst(c, FWC[Math.floor(Math.random() * FWC.length)], big ? 0.9 : 0.6); g.audio.play('boom'); g.audio.play('target'); g.rig.shake = Math.max(g.rig.shake, 0.9); g.flash = 0.18; g.flashColor = '#ffd090'; }
  const crash = (g, rk, n) => { g.onRocketCrash('wall', rk.pos.clone(), n); if (rk.active) { L.inv = 0.8; rk.vel.multiplyScalar(0.5); g.rig.shake = Math.max(g.rig.shake, 1); } };
  function play(g, rk, dt, s0) {
    const t = L.t;
    for (const d of L.sent) { if (!d.alive) continue; const ds = d.s - L.s;
      if (ds > 40 && ds < 200) { d.fT -= dt; if (d.fT <= 0) { d.fT = 2.0; fire(g, d.s, d.x, d.y); } }
      if (d.s >= s0 - 3 && d.s <= L.s + 3 && Math.hypot(L.x - d.x, L.y - d.y) < (d.big ? 8 : 5.5)) { d.alive = false; d.m.visible = false; const p = d.m.position.clone(); killFx(g, rk, p, d.big);
        const ev = g.evo, S = EVO.save(g), c = Math.round((d.big ? 140 : 90) * EVO.mult(S.cm) * (EVO.COIN_K || 1)); if (ev) { ev.kills++; ev.coins += c; } if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + (d.big ? 1.2 : 0.7));
        (g.killPops = g.killPops || []).push({ p: p.clone(), t0: performance.now(), txt: '+' + c }); } }
    { const HINT = { eboulis: 'EBOULEMENT ! ATTENTION AUX ROCHERS', roue: 'LA ROUE A AUBES TOURNE : PASSE ENTRE LES PALES', godets: 'LA ROUE A GODETS TOURNE !', wagon: 'WAGONNETS EN APPROCHE : MONTE OU ECARTE-TOI', rocher: 'ROCHERS QUI ROULENT !', tourbillon: 'TOURBILLON DE SABLE : IL TE POUSSE !', train: 'LE TRAIN ! DOUBLE-LE (FERS A CHEVAL = BOOST)', tonneau: 'TONNEAUX QUI ROULENT DANS LA RUE !' }; L.seen = L.seen || {};
      if (!L.hintT || L.t > L.hintT) { for (const o of L.O) { const ds = o.s - L.s; if (ds > 40 && ds < 190 && HINT[o.kind] && !L.seen[o.kind]) { L.seen[o.kind] = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, HINT[o.kind], 2.2, '#ffe0a0'); break; } }
        if (!L.seen.plane) { const d = L.sent.find((q) => q.alive && q.s - L.s > 50 && q.s - L.s < 200); if (d) { L.seen.plane = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, 'BALLON DE BANDITS : FONCE DEDANS !', 2.4, '#ff6a5a'); } } } }
    bossPlay(g, rk, dt);
    for (const c of L.chase) { const on = L.s > c.a && L.s < c.b; if (on && !c.on) { c.on = true; c.ds = 260; c.m.visible = true; if (c.k === 0) { if (CC.L1) CC.L1.msg(g, 'BALLONS DE BANDITS EN APPROCHE !', 2, '#ff6a5a'); g.audio.play('alarm'); } }
      if (!c.on) continue; const want = on ? 46 + c.k * 12 + 6 * Math.sin(t * 0.7 + c.ph) : 420; c.ds += (want - c.ds) * Math.min(1, dt * (on ? 1.4 : 0.6));
      c.x = Math.cos(t * 0.55 + c.ph) * (10 + 6 * Math.sin(t * 0.3 + c.k)); c.y = 8 + Math.sin(t * 0.7 + c.ph * 1.3) * 8;
      if (on && c.ds < 90) { c.fT -= dt; if (c.fT <= 0) { c.fT = 1.7 + c.n * 0.25; fire(g, L.s + c.ds, c.x, c.y); } }
      if (!on && c.ds > 400) { c.on = false; c.m.visible = false; } }
    for (const b of L.bul) { if (!b.on) continue; b.t += dt; b.s += b.vs * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > 4 || b.s < L.s - 20) { b.on = false; b.m.visible = false; continue; }
      if (Math.abs(b.s - L.s) < 2 && Math.hypot(b.x - L.x, b.y - L.y) < 1.4 && L.inv <= 0) { b.on = false; b.m.visible = false; missileHit(g, rk); } }
    for (const B of L.boostR) { if (B.done || B.s < s0 - 1 || B.s > L.s + 1) continue; B.done = true; if (Math.hypot(L.x - B.x, L.y - B.y) < 6.5) { L.boostT = 2.6; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 1); g.audio.play('boostOn'); g.audio.play('whoosh'); if (g.feed) g.feed('FER A CHEVAL : BOOST !', '#ffc23a'); g.flash = 0.15; g.flashColor = '#ffe08a'; burst(B.m.getWorldPosition(new V()), '#ffd04a', 0.5); } }
    // les wagonnets et les tonneaux qui roulent vers la fusee
    if (L.inv <= 0) for (const c of L.carts) if (c.on && Math.abs(c.s - L.s) < (c.barrel ? 3 : 6)) { const G = PA0fr(c.s), lx = c.barrel ? c.lane : 0; if (Math.abs(L.x - lx) < (c.barrel ? 3.2 : 4.4) && L.y < G + (c.barrel ? 4.6 : 8)) { crash(g, rk, L.PA.fr(L.s).t.clone().negate()); break; } }
    // le train : on touche la locomotive ou une voiture
    { const T = L.train; if (T && T.on && L.inv <= 0) { const F = L.PA.fr(T.s), dy = DECK + L.PA.O.y - F.p.y; for (const c of T.cars) { const cs = T.s - c.off; if (Math.abs(L.s - cs) < c.len / 2 && Math.abs(L.x - BX) < 4 && L.y > dy - 0.5 && L.y < dy + 12.5) { crash(g, rk, L.PA.fr(L.s).t.clone().negate()); break; } } } }
    // les tourbillons de sable : ils poussent et soulevent la fusee (pas de crash)
    for (const D of L.devils) { const ds = L.s - D.s; if (Math.abs(ds) > 26) continue; const dx = L.x - D.x; if (Math.abs(dx) < 24) { const F = L.PA.fr(L.s), k = 1 - Math.abs(dx) / 24; rk.vel.addScaledVector(F.r, (dx >= 0 ? 1 : -1) * 55 * k * dt).addScaledVector(F.u, 30 * k * dt); g.rig.shake = Math.max(g.rig.shake, 0.5 * k); if (!D.hit) { D.hit = 1; if (g.feed) g.feed('TOURBILLON !', '#d8b080'); g.audio.play('whoosh'); } } }
  }
  const PA0fr = (s) => { const F = L.PA.fr(s); return gH(F.p.x, F.p.z) - F.p.y; };   // le sol sous la voie (en y local)
  const _zA = new V(0, 0, 1);
  function animate(g, dt) {
    const PA = L.PA, t = L.t;
    for (const o of L.OB) if (o.upd && Math.abs(o.s - L.s) < 700) o.upd(t);
    for (const d of L.sent) { const near = d.alive && d.s - L.s < 330 && d.s - L.s > -80; d.m.visible = near; if (!near) continue; placeAt(PA, d.m, d.s, d.x + Math.sin(t * 0.9 + d.ph) * 1.2, d.y + Math.sin(t * 1.4 + d.ph) * 1.0); d.m.rotateY(t * 0.3 + d.ph); }
    for (const c of L.chase) if (c.on) { placeAt(PA, c.m, L.s + c.ds, c.x, c.y); c.m.rotateY(t * 0.5); }
    for (const b of L.bul) if (b.on) { placeAt(PA, b.m, b.s, b.x, b.y); b.body.quaternion.setFromUnitVectors(_zA, _d.set(b.vx, b.vy, -b.vs).normalize()); b.body.rotateX(L.t * 9); }
    for (const B of L.boostR) { B.m.rotation.z = Math.sin(t * 1.5 + B.s) * 0.35; B.m.rotation.y = Math.sin(t * 0.9 + B.s) * 0.3; }
    for (const q of L.spin) if (Math.abs(q.s - L.s) < 700) q.o.rotation.z = q.ang(t);
    if (L.spinR) for (const wh of L.spinR) wh.rotation.z = t * 2.2;
    // les wagonnets / tonneaux
    for (const c of L.carts) { const span = c.b - c.a, s = c.b - (((t * c.v / span) + c.ph) % 1) * span; c.s = s; c.on = L.s > c.a - 300 && L.s < c.b + 20 && s > L.s - 30; c.m.visible = c.on; if (!c.on) continue;
      const gy = PA0fr(s); placeAt(PA, c.m, s, c.barrel ? c.lane : 0, gy + (c.barrel ? 2.3 : 0)); if (c.barrel) c.m.rotateX(-t * c.v / 2.2); else if (Math.random() < dt * 4) g.effects.smokePuff(c.m.position.clone(), new V(rr(-1, 1), 1, rr(-1, 1)), 1.2, 0.5); }
    // le train
    { const T = L.train; if (T) { if (!T.on && !T.done && L.started && L.s > T.sEnd - 2200 && L.s > L.PA.sAtW(WV1) - 80) { T.on = true; T.s = L.s + 160; for (const c of T.cars) c.m.visible = true; }
      if (T.on) { T.s += T.v * dt; const F = PA.fr(T.s), dy = DECK + PA.O.y - F.p.y; for (const c of T.cars) { const cs = T.s - c.off; c.m.visible = cs < T.sEnd; placeAt(PA, c.m, cs, BX, dy); }
        if (Math.random() < dt * 14) g.effects.smokePuff(placeAt(PA, _o8, T.s - 7.5, BX, dy + 15).position.clone(), new V(rr(-2, 2), rr(6, 10), rr(-2, 2)), 4, 2.2); if (T.s - 120 > T.sEnd) { T.on = false; T.done = true; for (const c of T.cars) c.m.visible = false; } } } }
    // les tourbillons : le nuage de sable tourne, le tourbillon se deplace
    for (const D of L.devils) { D.x = D.x0 + D.amp * Math.sin(t / D.per * 6.283); const vis = Math.abs(D.s - L.s) < 900; D.p.visible = D.cone.visible = vis; if (!vis) continue; const F = PA.fr(D.s), G = gH(F.p.x + F.r.x * D.x, F.p.z + F.r.z * D.x), c = _a.copy(F.p).addScaledVector(F.r, D.x); c.y = G;
      D.cone.position.set(c.x, G + 60, c.z); D.cone.rotation.y = t * 3; const P = D.p.geometry.attributes.position;
      for (let i = 0; i < D.n; i++) { const h = D.ph[i * 3 + 1], a = D.ph[i * 3] + t * (4 - 2 * h) * D.ph[i * 3 + 2], r = 4 + 24 * h; P.setXYZ(i, c.x + Math.cos(a) * r, G + h * 120, c.z + Math.sin(a) * r); } P.needsUpdate = true; }
  }
  const _o8 = new T3.Object3D();

  // ============================== LE BOSS : LA LOCOMOTIVE BLINDEE (sur les rails de la rue ; 3 coups dans la cible a l'arriere du tender) ==============================
  function bossBuild(g, PA, grp) {
    const m = new T3.Group(), P = [], BK = '#2a2a30', RD = '#b8302a', BR = '#c8a040', AR = '#6a7480';
    // l'arriere (+z) regarde la fusee : le tender et la cible ; la chaudiere et la cheminee devant (-z)
    P.push({ g: SB(8, 7, 12), c: AR, p: [0, 5.5, 8] }, { g: SB(8.4, 1, 12.4), c: BK, p: [0, 9.4, 8] });
    pC(P, 0, 7, -10, 3.8, 3.8, 22, BK, 18, [Math.PI / 2, 0, 0]); for (const z of [-18, -12, -6, 0]) pC(P, 0, 7, z, 4.1, 4.1, 0.8, BR, 18, [Math.PI / 2, 0, 0]);
    for (const sd of [-1, 1]) pX(P, sd * 4.4, 6, -10, 0.8, 6, 20, AR); pX(P, 0, 9, 3, 8.4, 9, 7, RD); pX(P, 0, 14, 3, 9, 1, 8, BK);
    pC(P, 0, 14.5, -17, 1.6, 2.8, 7, BK, 14); pC(P, 0, 18.5, -17, 3.2, 3.2, 1.2, BR, 14); pC(P, 0, 12, -10, 1.4, 1.4, 2.4, BR, 12);
    for (const sd of [-1, 1]) for (const z of [-16, -9, -2, 6, 11]) pC(P, sd * 3.6, 2.6, z, 2.6, 2.6, 0.8, RD, 16, [0, 0, Math.PI / 2]);
    pX(P, 0, 2.4, -22.5, 8, 3, 3, RD, [0.6, 0, 0]); pS(P, 0, 8, -21.5, 1.6, '#fff4c0');
    for (let k = 0; k < 8; k++) pS(P, -3 + (k % 4) * 2, k < 4 ? 8.6 : 2.6, 14.1, 0.4, BK);   // rivets
    m.add(bake(P)); L.bossJets = [];
    const tg = new T3.Group(); tg.position.set(0, 5.5, 14.2); m.add(tg); tg.add(new T3.Mesh(new T3.CircleGeometry(3.6, 40), lam('#f6f6f2', { emissive: '#3a3a3a', side: T3.DoubleSide })));
    for (const [r, w] of [[3.1, 0.4], [1.9, 0.4]]) { const o = new T3.Mesh(new T3.TorusGeometry(r, w, 8, 40), bas('#ff3a2a', { fog: false })); o.position.z = 0.1; tg.add(o); }
    { const o = new T3.Mesh(new T3.CircleGeometry(0.8, 20), bas('#ff3a2a', { fog: false, side: T3.DoubleSide })); o.position.z = 0.15; tg.add(o); }
    m.visible = false; grp.add(m);
    L.boss = { m, tg, s: 0, sT: 0, x: 0, y: 0, hp: 3, on: false, dead: false, deadT: 0, hitT: 0, fT: 2, cap: PA.len - 260, boomT: 0, s0: PA.sAtW(WT0 + 220) }; if (EVO.milBoss) EVO.milBoss(g, L.boss, 8);   // v451 : vrai engin militaire geant
  }
  function bossPlay(g, rk, dt) {
    const B = L.boss; if (!B || (B.dead && B.deadT > 3.5)) return;
    if (!B.on && L.s > B.s0 - 320) { B.on = true; B.s = B.sT = B.s0; B.m.visible = true; if (CC.L1) CC.L1.msg(g, 'BOSS : FONCE DANS LA CIBLE DE LA LOCOMOTIVE (3 COUPS)', 3, '#ff5a3a'); g.audio.play('robotAlarm'); }
    if (!B.on) return;
    if (B.dead) { B.deadT += dt; B.boomT -= dt; if (B.boomT <= 0 && B.deadT < 2.6) { B.boomT = 0.16; const p = B.m.position.clone().add(new V(rr(-6, 6), rr(0, 14), rr(-14, 14))); g.effects.explosion(p, null, false, 'orange'); burst(p, FWC[Math.floor(Math.random() * FWC.length)], 0.8); g.audio.play('boomSmall', p); }
      if (B.deadT > 2.6 && B.m.visible) { B.m.visible = false; g.flash = 0.6; g.flashColor = '#ffe0b0'; g.audio.play('boom'); g.rig.shake = 1.4; const fx = g.effects, c = B.m.position.clone(); fx.shatter(c, new V(10, 10, 20), new V(0, 10, 0), 'planks'); for (let k = 0; k < 8; k++) burst(c.clone().add(new V(rr(-30, 30), rr(0, 40), rr(-30, 30))), FWC[k % FWC.length], rr(1.2, 1.8), k % 3 === 1 ? 'ring' : null); } return; }
    B.hitT -= dt; B.s += (B.sT - B.s) * Math.min(1, dt * (B.hitT > 0 ? 2.5 : 1.2)); B.x = 0; B.y = PA0fr(B.s) + 5.5;
    const capped = B.sT >= B.cap - 1, ds = B.s - L.s, ph = 3 - B.hp;
    if (ds > 45 && ds < 280) { B.fT -= dt; if (B.fT <= 0) { B.fT = [1.5, 1.15, 0.9][ph]; fire(g, B.s - 17, 0, B.y + 14); if (ph >= 1) fire(g, B.s - 6, 5, B.y + 6); if (ph >= 2) fire(g, B.s - 6, -5, B.y + 6); } }
    if (B.hitT <= 0 && L.s > B.s - 8 && L.s < B.s + 18 && (capped || (B.hw && Math.abs(L.x - B.x) < B.hw && Math.abs(L.y - B.y) < B.hh) || Math.hypot(L.x - B.x, L.y - B.y) < 7 + RK)) {
      B.hp = capped ? 0 : B.hp - 1; B.hitT = 1.6; L.inv = 1.2; rk.vel.multiplyScalar(0.6); g.rig.shake = 1.2; g.flash = 0.35; g.flashColor = '#ffffff'; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); burst(rk.pos.clone(), '#ffd04a', 0.9, 'ring'); g.audio.play('reactorHit'); g.audio.play('boom');
      if (EVO.onBossHit) EVO.onBossHit(g, null); rk.fuel = Math.min(rk.fuelMax, rk.fuel + 6);
      if (B.hp <= 0) { B.dead = true; B.deadT = 0; if (CC.L1) CC.L1.msg(g, 'LOCOMOTIVE DETRUITE !', 3, '#ffe9a0'); g.audio.play('victory'); }
      else { B.sT = Math.min(B.cap, L.s + Math.min(260, Math.max(90, (B.cap - L.s) / B.hp)));   /* v452 : il recule de facon a laisser la place aux coups restants (plus de mort d office au bout de l arene) */ if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 2, '#ff9a5a'); }
      (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 3, 0)), t0: performance.now(), txt: B.hp > 0 ? '-1' : 'BOUM !' }); return; }
    if (L.s > B.s + 18 && !capped) { B.sT = Math.min(B.cap, L.s + 220); B.s = Math.max(B.s, L.s + 110); if (CC.L1) CC.L1.msg(g, 'ELLE REVIENT !  FONCE DEDANS', 1.6, '#ff6a5a'); }
  }
  function bossAnim(g, dt) { const B = L.boss; if (!B || !B.on || !B.m.visible) return; if (EVO.milAnim) EVO.milAnim(g, B, dt, L.t); if (!B.dead) { placeAt(L.PA, B.m, B.s, B.x, B.y - 5.5); } else { B.m.rotateZ(dt * 0.4); }
    B.tg.scale.setScalar(1 + 0.06 * Math.sin(L.t * 5));
    if (!B.dead && !B.mil && Math.random() < dt * 18) g.effects.smokePuff(_a.set(0, 19, -17).applyQuaternion(B.m.quaternion).add(B.m.position).clone(), new V(rr(-1, 1), rr(6, 10), rr(-1, 1)), 4, 1.6); }

  // ============================== LA FICHE DU NIVEAU 8 ==============================
  const CH8 = ZN.map((z) => [z[3], z[0], z[2]]);
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 8) || g.evoPreview) return _ld(g);
    EVO.chapters = CH8.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { const A = EVO.SCENE_AUDIO; A.wmesa = 'evoDawn'; A.wcanyon = 'evoDay'; A.wfourche = 'evoDay'; A.wmine = 'evoMine'; A.wcheminee = 'evoMine'; A.wvallee = 'evoDay'; A.wpont = 'evoDusk'; A.wville = 'evoBoss'; }
    return EVO.baseDef({ zone: 'campagne', len: Math.round(LOC.len - 60), scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 8808, bossEnt: null });
  };

  // ============================== CONSTRUCTION, PILOTAGE, CAMERA ==============================
  const dispose = (g) => { if (!L) return; for (const k of ['grp', 'sky', 'dust']) if (L[k]) g.scene.remove(L[k]); if (L.far0) { g.camera.far = L.far0; g.camera.updateProjectionMatrix(); } L = null; EVO.ouest = null; SHAD.length = 0; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); };
  function build(g) {
    const pad = g.pad, run = g.endlessRun, T = run.T, a = T.at(0, 0, 0), b = T.at(8, 0, 0), F0 = new V(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const O = (pad && pad.origin ? pad.origin.clone() : new V(a[0], a[1] + 2, a[2])), P0 = O.clone(); P0.y -= 2.2 + MESA;   // le dessus de la mesa : 2,2 m sous la fusee
    L = EVO.ouest = { t: 0, s: 0, x: 0, y: 0, v: 0, started: false, inv: 0, boostT: 0, bk: 0, zi: 0 };
    L.rkL = (EVO.rocketLen && EVO.rocketLen(g)) || 2.4; SHAD.length = 0;
    const PA = L.PA = buildPath(P0, F0), grp = L.grp = new T3.Group(); g.scene.add(grp); L.dbg = { ZN, zoneAt, gH, pathU, pathY, H, hwB, floorW };
    terrain(PA, grp); decor(g, PA, grp); obstacles(g, PA, grp); sky(g, PA, grp); enemies(g, PA, grp); bossBuild(g, PA, grp); fwPool(grp);
    // le pas de tir : une plateforme de planches sur deux caisses
    { const O2 = PA.fr(0).p, P = []; P.push({ g: SB(4, 0.6, L.rkL * 1.2), c: '#a8783e', p: [0, -1.9, 0] }); for (const sd of [-1, 1]) P.push({ g: SB(1.6, 1.4, 1.6), c: '#8a5a32', p: [sd * 1.4, -2.9, 0] }); const r = bake(P); r.position.copy(O2); r.quaternion.setFromRotationMatrix(_m.makeBasis(PA.R0, new V(0, 1, 0), _d.copy(PA.F0).negate())); grp.add(r); shad(new V(O2.x, O2.y - 2.2, O2.z), 3); }
    batches(grp); colBuild();
    grp.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (!m.isShaderMaterial && !m.fog && !(m.blending === T3.AdditiveBlending) && !(o.isPoints)) { m.fog = true; m.needsUpdate = true; } });
    { const n = 360, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#f0d0a0', size: 0.35, map: dotTex(), transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; g.scene.add(p); L.dust = p; L.dustInit = false; L.dph = new Float32Array(n); for (let i = 0; i < n; i++) L.dph[i] = rr(0, 6.28); }
    L.far0 = g.camera.far;
  }

  // LE PILOTAGE DU NIVEAU 1 : vol libre ; on touche le relief (sol : on glisse ; paroi : on glisse en la frolant, on s'ecrase de face) et le decor
  const _st = new V(), _sa = new V(), _p0 = new V(), _tn = new V();
  const terrN = (x, z) => { const e = 2.5; return _tn.set(-(gH(x + e, z) - gH(x - e, z)) / (2 * e), 1, -(gH(x, z + e) - gH(x, z - e)) / (2 * e)).normalize(); };
  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on8(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA; if (!L.started) { L.started = true; L.K = CC.EVO.spdK ? CC.EVO.spdK(this.game) : 1; L.s = 0; L.x = 0; L.y = 0; }
    const s0 = L.s, zi = zoneAt(L.s), Z = ZN[zi], boostZ = /boost/.test(Z[5]);
    if (zi !== L.zi) { L.zi = zi; if (CC.L1) CC.L1.msg(g, Z[3] + (boostZ ? ' !' : ''), 2.2, Z[4]); if (boostZ) { g.audio.play('boostOn'); g.audio.play('whoosh'); } else g.audio.play('jetPass'); }
    if (L.boostT > 0) L.boostT -= dt; if (L.inv > 0) L.inv -= dt;
    let inp = input; if (input && input.aimDir) { const Ft = PA.fr(L.s + 12).t, d = input.aimDir.dot(Ft); if (d < 0.34) inp = Object.assign({}, input, { aimDir: _sa.copy(input.aimDir).addScaledVector(Ft, 0.34 - d).normalize() }); }
    if (!(boostZ || L.boostT > 0)) this.fuel = Math.max(0, this.fuel - dt * (L.K || 1));
    const dry = this.fuel <= 0; if (dry && !L.dry) { L.dry = 1; if (CC.L1) CC.L1.msg(g, 'PLUS DE CARBURANT !', 2, '#ff6a5a'); g.audio.play('warnFuel'); } if (!dry) L.dry = 0;
    if (dry) inp = Object.assign({}, inp, { aimDir: new V().copy(this.fwd).setY(Math.min(this.fwd.y - 0.35, -0.65)).normalize() });   // v448 : a sec, le nez pique vers le sol (plus de long vol plane)
    const fu = this.fuel; if (dry) this.fuel = 0; _p0.copy(this.pos);
    _step.call(this, dt, inp); this.fuel = fu; if (!this.active) return;
    const vMax0 = L.boostT > 0 ? 150 : boostZ ? 130 : 90; const vMax = vMax0 * (L.K || 1);   // v449 : la vitesse monte avec la fusee L.bk += ((L.boostT > 0 ? 1 : boostZ ? 0.65 : 0) - L.bk) * Math.min(1, dt * 3);
    if (!dry) { const sp = this.vel.length(); if (sp > 1e-3) { const want = sp + (vMax - sp) * Math.min(1, dt * (sp < vMax ? 1.4 : 0.9)); this.vel.multiplyScalar(want / sp); } } else this.vel.y -= 14 * dt;   // v448 : a sec, plus de frein : la fusee pique et tombe (elle meurt au sol, jamais en l'air)
    // le ciel a une limite (on peut survoler les plateaux, pas s'envoler)
    if (this.pos.y > PA.O.y + 560) { this.pos.y = PA.O.y + 560; if (this.vel.y > 0) this.vel.y = 0; }
    // le relief
    { const G = gH(this.pos.x, this.pos.z) + 2; if (this.pos.y < G) { const n = terrN(this.pos.x, this.pos.z);
        if (n.y > 0.55) { if (dry) { crash(g, this, n.clone()); return; } this.pos.y = G; const vn = this.vel.dot(n); if (vn < 0) this.vel.addScaledVector(n, -vn); if (Math.random() < dt * 8) g.effects.smokePuff(this.pos.clone().add(_a.set(0, -1, 0)), new V(rr(-2, 2), rr(1, 3), rr(-2, 2)), 1.4, 0.9); }
        else { const vd = _a.copy(this.vel).normalize(), imp = Math.asin(U.clamp(-vd.dot(n), -1, 1)) * 57.3; this.pos.copy(_p0); if (this.pos.y < gH(this.pos.x, this.pos.z) + 2) this.pos.y = gH(this.pos.x, this.pos.z) + 2; const vn = this.vel.dot(n); if (vn < 0) this.vel.addScaledVector(n, -vn * 1.05);
          if ((imp >= 28 && L.inv <= 0) || dry) crash(g, this, n.clone()); else if (Math.random() < dt * 10) g.effects.smokePuff(this.pos.clone(), n.clone().multiplyScalar(3), 1.2, 0.7); if (!this.active) return; } } }
    // le decor
    { const H2 = colAt(this.pos); if (H2) { const vd = _a.copy(this.vel).normalize(), imp = Math.asin(U.clamp(-vd.dot(H2.n), -1, 1)) * 57.3; this.pos.copy(H2.out); const vn = this.vel.dot(H2.n);
        if ((imp < 28 || L.inv > 0) && !dry) { if (vn < 0) this.vel.addScaledVector(H2.n, -vn * 1.05); if (Math.random() < dt * 10) g.effects.smokePuff(this.pos.clone(), H2.n.clone().multiplyScalar(3), 1.2, 0.7); }
        else { if (vn < 0) this.vel.addScaledVector(H2.n, -vn * 1.5); crash(g, this, H2.n.clone()); if (!this.active) return; } } }
    // ou en est-on sur la voie
    for (let k = 0; k < 3; k++) { const F = PA.fr(L.s); L.s = U.clamp(L.s + U.clamp(_st.subVectors(this.pos, F.p).dot(F.t), -40, 40), 0, PA.len); }
    const F2 = PA.fr(L.s); _st.subVectors(this.pos, F2.p); L.x = _st.dot(F2.r); L.y = _st.dot(F2.u); L.v = this.vel.length(); this.speed = L.v;
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, L.s);
    if (L.inv <= 0 && L.OB && L.s > s0) for (const o of L.OB) { if (o.s + o.th < s0 || o.s - o.th > L.s) continue; if (o.hit(L.x, L.y, L.t)) { crash(g, this, F2.t.clone().negate()); break; } }
    if (this.active && L.sent) play(g, this, dt, s0);
    if (this.active && !dry && Math.random() < dt * 30) { const tier = EVO.rocket(EVO.save(g).rk).tier; g.effects.smokePuff(this.nozzle(new V()), this.fwd.clone().multiplyScalar(-rr(3, 8)).add(new V(rr(-1, 1), rr(-1, 1), rr(-1, 1))), tier === 2 ? 1.2 : 0.8, 0.6); }
    if (this.active && L.s > PA.len - 60 && (!L.boss || L.boss.dead) && !g.evoFinish && EVO.finishRun) { if (CC.L1) CC.L1.msg(g, 'ARRIVEE !', 2.6, '#ffe9a0'); for (let k = 0; k < 6; k++) burst(this.pos.clone().addScaledVector(this.fwd, 60).add(new V(rr(-40, 40), rr(10, 50), rr(-40, 40))), FWC[k % FWC.length], 1.4, k % 2 ? 'ring' : null); EVO.finishRun(g); }
  };

  // --- AU MENU : la fusee sur sa plateforme, en haut de la mesa ---
  function menuView(g, rig, dt) {
    const PA = L.PA, O = PA.fr(0).p, R0 = PA.R0, F0 = PA.F0, cam = rig.cam, rk = g.rocket, A = g.evoAnim, Y = new V(0, 1, 0), Lw = L.rkL;
    if (rk.mesh) { rk.mesh.visible = true; rk.mesh.position.copy(O); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(_a.crossVectors(Y, F0).normalize(), Y, F0)); }
    let p, look; const t = L.t;
    if (A && A.kind === 'tier') { const an = -1.1 + Math.sin(A.t * 0.5) * 0.35, D = U.clamp(2.8 * Lw, 4.5, 8); p = new V().copy(O).addScaledVector(R0, -Math.cos(an) * D).addScaledVector(F0, Math.sin(an) * D).addScaledVector(Y, Lw * 0.5); look = O.clone(); }
    else { const ch = g.evoAim ? (g.evoAim.lock ? 1 : g.evoAim.ch || 0) : 0, D = Math.max(1.3, Lw / 1.8); p = new V().copy(O).addScaledVector(R0, (2.6 - 0.6 * ch) * D).addScaledVector(F0, (-3.0 - 0.3 * Math.sin(t * 0.12)) * D).addScaledVector(Y, (1.0 - 0.2 * ch) * D); look = new V().copy(O).addScaledVector(R0, -0.5 * D).addScaledVector(F0, 0.6 * D).addScaledVector(Y, 0.6 * D);
      if (ch > 0.2) { p.x += (Math.random() - 0.5) * 0.12 * ch; p.y += (Math.random() - 0.5) * 0.12 * ch; } }
    if (!L.mc) { L.mc = p.clone(); L.ml = look.clone(); } const k = 1 - Math.exp(-dt * 4); L.mc.lerp(p, k); L.ml.lerp(look, k);
    cam.position.copy(L.mc); cam.up.set(0, 1, 0); cam.lookAt(L.ml); if (Math.abs(cam.fov - 55) > 0.01) { cam.fov = 55; cam.updateProjectionMatrix(); } if (cam.far < 9000) { cam.far = 9000; cam.updateProjectionMatrix(); } cam.updateMatrixWorld();
  }
  const _rup = CC.CameraRig.prototype.update;
  CC.CameraRig.prototype.update = function (dt) {
    _rup.call(this, dt); const g = this.game, rk = g.rocket;
    if (L && L.PA && on8(g) && !rk.active && (g.state === 'MENU' || g.state === 'AIM' || g.state === 'LAUNCH')) { menuView(g, this, dt); return; }
    if (!L || !L.PA || !on8(g) || !rk.active || g.state !== 'FLIGHT' || !L.started || (g.evoFinish && g.evoFinish.hold)) return;
    // la camera de poursuite du niveau 1 ; si elle passe dans une paroi, elle se rapproche de la fusee (jamais dans la roche)
    const cam = this.cam; if (cam.position.y < gH(cam.position.x, cam.position.z) + 1.5) { const p = cam.position; for (let k = 0; k < 10 && p.y < gH(p.x, p.z) + 1.5; k++) p.lerp(rk.pos, 0.25); if (p.y < gH(p.x, p.z) + 1.5) p.y = gH(p.x, p.z) + 1.5; cam.updateMatrixWorld(); }
    if (cam.far < 9000) { cam.far = 9000; cam.updateProjectionMatrix(); }
  };
  if (CC.Horizon) { const _hu = CC.Horizon.prototype.update; CC.Horizon.prototype.update = function (g) { if (L && on8(g)) { for (const m of [this.ring, this.glow, this.mtn]) if (m) m.visible = false; return; } return _hu.call(this, g); }; }
  // v448 : l'epave retombe (gravite normale) et se pose sur le relief du niveau (EVO.terrain) : plus d'epave qui flotte
  (EVO.terrain = EVO.terrain || []).push((g, x, z) => (isS8() && L && L.PA ? gH(x, z) : null));
  const wNow = () => { if (!L || !L.started) return 0; const q = L.PA.loc(L.PA.fr(L.s).p); return q[1]; };
  const inMine = (w) => w > WM0 - 30 && w < WM1 + 20;
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on8(g)) return;
    const w = wNow(), M = moodAt(w); L.M = M; const mine = inMine(w);
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(M.top); u.horizon.value.copy(M.hor); u.bottom.value.copy(M.fog); u.cloud.value = 0; }
    g.scene.fog.color.copy(M.fog); g.scene.fog.near = M.near; g.scene.fog.far = M.far;
    if (g.fogBase) { g.fogBase.near = M.near; g.fogBase.far = M.far; g.fogBase.color.copy(M.fog); }
    g.renderer.setClearColor(M.fog); if (g.stars) g.stars.visible = false; g.nightK = 0;
    if (g.postParams) { g.postParams.bloomStrength = mine ? 0.35 : 0.22; g.postParams.bloomThreshold = 0.85; g.postParams.vignette = mine ? 0.4 : 0.26; g.postParams.saturation = 1.14; g.postParams.contrast = 1.06; }
    g.ambient.intensity = (mine ? 0.42 : 0.27) * M.li + (mine ? 0.08 : 0.05); g.sun.intensity = (mine ? 0.25 : 0.98) * M.li;   /* v453 : plus de contraste dehors (moins delave) */ g.sun.color.set(mine ? '#ffb060' : w > 6200 ? '#ffc89a' : w > 5300 ? '#ffe0b0' : '#fff4e0');
  };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!on8(g) || !g.endlessRun || !g.endlessRun.T) return;
    if (!L) { try { build(g); } catch (e) { console.warn('ouest', e); L = null; return; } }
    const PA = L.PA, rk = g.rocket, cam = g.camera, s = L.started ? L.s : 0, w = wNow(); L.t += dt;
    bossAnim(g, dt); fwTick(dt);
    for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = false;
    for (const o of g.scene.children) if (o.name === 'level') o.visible = false; if (g.pad && g.pad.evoL) g.pad.evoL.visible = false; if (g.pad && g.pad.hangar) g.pad.hangar.visible = false;
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.flash = 0.25; g.flashColor = '#fff4d8'; if (CC.L1) CC.L1.msg(g, 'DECOLLAGE !', 1.6, '#ffd27a'); }
    animate(g, dt);
    if (L.wTex) L.wTex.offset.y += dt * 1.6;
    if (L.falls) for (const f of L.falls) if (Math.abs(f.w - w) < 500 && Math.random() < dt * 5) g.effects.smokePuff(L.HG.localToWorld(f.p.clone()).add(new V(rr(-6, 6), 0, rr(-6, 6))), new V(rr(-3, 3), rr(2, 5), rr(-3, 3)), 6, 1.6);
    const mine = inMine(w);
    if (L.cloudIM) L.cloudIM.visible = !mine;
    if (L.sky) { L.sky.position.copy(cam.position); if (L.sun) { L.sun.visible = !mine; const lo = w > 6200 ? 0.18 : w > 5300 ? 0.3 : 0.5; L.sun.position.copy(_b.copy(PA.F0).multiplyScalar(0.8).addScaledVector(PA.R0, 0.35).setY(lo).normalize()).multiplyScalar(3200); } }
    // la poussiere doree au soleil, les braises dans la mine
    if (L.dust) { const P = L.dust.geometry.attributes.position, n = P.count, D = L.dust.material, F = PA.fr(s), ctr = rk.active ? rk.pos : cam.position;
      D.color.set(mine ? '#ffb060' : '#f8dca8'); D.opacity = mine ? 0.8 : 0.5; D.size = mine ? 0.4 : 0.32; const fall = mine ? -0.6 : 0.15;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); const ph = L.dph[i]; _a.y -= fall * dt; _a.x += Math.sin(L.t * 0.7 + ph) * dt * 1.2; _a.z += Math.cos(L.t * 0.6 + ph) * dt * 1.2;
        if (!L.dustInit || _b.subVectors(_a, ctr).dot(F.t) < -10 || _b.length() > 120) { _a.copy(ctr).addScaledVector(F.t, L.dustInit && L.started ? rr(50, 110) : rr(-10, 110)).addScaledVector(F.r, rr(-40, 40)).addScaledVector(F.u, rr(-12, 30)); }
        P.setXYZ(i, _a.x, _a.y, _a.z); }
      L.dustInit = true; P.needsUpdate = true; L.dust.visible = mine; }
  };
})();
