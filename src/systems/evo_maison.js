/* v438 : NIVEAU 7 « LA MAISON GEANTE » (?lv=7) — meme mecanique de voie 3D que les niveaux 4, 5 et 6 (s = distance sur la voie, x, y = ecart dans la section).
 * On est une FUSEE JOUET (bouteille a eau -> fusee en carton -> fusee telecommandee -> fusee en fer blanc) lancee du BUREAU d'un enfant, a l'echelle d'un jouet :
 * tout est 150 fois plus grand (un crayon fait 26 m, la table 112 m de haut, le plafond 375 m). On plonge du bureau dans LA CHAMBRE (murs de briques a trou,
 * crayons couches, sous le lit entre les piles de livres), on traverse LA SALLE DE JEUX (boucles de circuit orange a enfiler = boost, tours de cubes, viaduc,
 * le petit train qui traverse), LE COULOIR (barrieres d'enfant, balles qui rebondissent, portes), LA CUISINE (sous la table entre les pieds de chaise,
 * lampes qui balancent), on monte vers LA FENETRE OUVERTE et on sort dans LE JARDIN geant (herbes, tournesols, jets d'arrosage), ou attend LE ROBOT JOUET.
 * Le sol est un champ de hauteur H(u, w) (u a droite, w en avant) ; la maison (murs, plafonds, meubles) est construite dans le repere du depart (x = u, z = -w),
 * en boites decoupees en petits morceaux : la courbure du monde (curve.js) se fait sommet par sommet. Pas d'animaux. Chaque element pose au sol a son ombre. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn || !CC.Rocket) return;
  const on7 = (g) => !!(g && g.evo && !g.evo.preview && EVO.stage && EVO.stage(g) === 7);
  const isS7 = EVO.isS7 = () => !!(EVO.stage && CC.game && EVO.stage(CC.game) === 7);
  const ROPEN = 30, RK = 0.55, rr = (a, b) => a + Math.random() * (b - a);
  const _a = new V(), _b = new V(), _c = new V(), _d = new V(), _q = new T3.Quaternion(), _q2 = new T3.Quaternion(), _m = new T3.Matrix4();
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  let L = null;

  // ============================== LA FUSEE JOUET, le carburant, les pieces ==============================
  for (let i = 0; i < 4; i++) CC.Skins.byId['evoJ' + i] = { id: 'evoJ' + i, name: 'evoJ' + i, short: 'evoJ' + i, tier: 'base', price: 0, tierLabel: '', c: { body: '#f4f2ec', nose: '#ff7a1a', tip: '#f2c41a', band: '#1e2026', fin: '#d8302a', nozzle: '#3a3a3a' }, flame: ['#cfeaff', '#ffc04a', '#ff9a3a', '#ffe08a'][i], build: 'jouet', stage: i, dims: { r: 0.1, len: 1, noseLen: 0.3, noseR: 0.02, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, parts: [] };
  { const _ob = EVO.ownBody; EVO.ownBody = () => _ob() || isS7(); }
  { const _as = EVO.applySkin; EVO.applySkin = (g) => { if (!isS7()) return _as(g); const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoJ' + r.tier)); EVO.attachParts(g); }; }
  { const RK7 = ['BOUTEILLE A EAU', 'FUSEE EN CARTON', 'FUSEE TELECOMMANDEE', 'FUSEE EN FER BLANC'], _rk = EVO.rocket; EVO.rocket = (n) => { const r = _rk(n); if (isS7()) r.name = RK7[r.tier]; return r; }; }
  // la bouteille a eau se vide dans la chambre, chaque palier donne un gros bond (la fusee en fer blanc finit le niveau) ; les boucles et les anneaux rechargent un peu
  EVO.fuel7 = (rk, la) => 28 + 1.6 * rk + 1.2 * la + [0, 16, 48, 115][Math.min(3, Math.floor(rk / 5))];
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); if (!isS7() || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket, f = EVO.fuel7(S.rk || 0, S.la || 0); rk.fuelMax = f * 1.15; rk.fuel = (g.evoAimLast && g.evoAimLast.zone === 'gold') ? f * 1.15 : f; }; }
  { const _dp = EVO.distPay; EVO.distPay = (g, dist) => (isS7() ? 0.45 * (0.15 / (8450 / 6910)) * (1 + 2 * Math.min(1, dist / 6400)) : _dp ? _dp(g, dist) : 1); }
  { const _nk = EVO.noKill; EVO.noKill = (g) => on7(g) || (_nk ? _nk(g) : false); }
  // v443 : au niveau 7, le monde physique du niveau 1 (son sol, ses decors caches sous la maison) est coupe : seule la maison compte
  if (CC.World) { const _sw = CC.World.prototype.sweep; CC.World.prototype.sweep = function (p0, p1, r, filter) { if (L && L.PA && CC.game && on7(CC.game)) return null; return _sw.call(this, p0, p1, r, filter); }; }
  // v443 : LES COLLISIONS AVEC LA MAISON : chaque piece visible du decor (murs, plafonds, portes, fenetre, meubles, jouets) arrete la fusee, rien d'invisible.
  // On glisse quand on la frole, on s'ecrase quand on la prend de face (comme au niveau 1).
  const _cv = new V(), _cw = new V(), _cn = new V();
  const colAdd = (mesh, parts) => { if (L) (L.colPend = L.colPend || []).push([mesh, parts]); };
  function colBuild() { const C = 40, HS = new Map(); L.grp.updateMatrixWorld(true);
    for (const [m, parts] of L.colPend || []) for (const q of parts) { if (!q.g.boundingBox) q.g.computeBoundingBox(); const bb0 = q.g.boundingBox, sz = bb0.getSize(_cv); if (Math.max(sz.x, sz.y, sz.z) < 3) continue;
      const M = new T3.Matrix4().compose(new V().fromArray(q.p), new T3.Quaternion().setFromEuler(new T3.Euler().fromArray(q.r ? [q.r[0], q.r[1], q.r[2]] : [0, 0, 0])), new V().fromArray(q.s || [1, 1, 1])), W = new T3.Matrix4().multiplyMatrices(m.matrixWorld, M);
      const P = { W, inv: W.clone().invert(), bb: bb0.clone().expandByScalar(-0.3) }; if (P.bb.isEmpty()) continue; const wb = bb0.clone().applyMatrix4(W);
      for (let i = Math.floor(wb.min.x / C); i <= Math.floor(wb.max.x / C); i++) for (let k = Math.floor(wb.min.z / C); k <= Math.floor(wb.max.z / C); k++) { const kk = i + ',' + k; let a = HS.get(kk); if (!a) HS.set(kk, a = []); a.push(P); } }
    L.colH = HS; L.colC = C; L.colPend = null; }
  // la piece touchee : on renvoie le point ressorti par la face la plus proche et la normale de cette face (ou null)
  function colAt(p) { if (!L.colH) return null; const C = L.colC, a = L.colH.get(Math.floor(p.x / C) + ',' + Math.floor(p.z / C)); if (!a) return null;
    for (const P of a) { _cv.copy(p).applyMatrix4(P.inv); const b = P.bb; if (!b.containsPoint(_cv)) continue;
      const d = [_cv.x - b.min.x, b.max.x - _cv.x, _cv.y - b.min.y, b.max.y - _cv.y, _cv.z - b.min.z, b.max.z - _cv.z]; let i = 0; for (let k = 1; k < 6; k++) if (d[k] < d[i]) i = k;
      const ax = i >> 1, sg = i & 1 ? 1 : -1; _cw.copy(_cv); if (ax === 0) _cw.x = sg > 0 ? b.max.x + 0.6 : b.min.x - 0.6; else if (ax === 1) _cw.y = sg > 0 ? b.max.y + 0.6 : b.min.y - 0.6; else _cw.z = sg > 0 ? b.max.z + 0.6 : b.min.z - 0.6;
      _cn.set(ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0).transformDirection(P.W); return { out: _cw.clone().applyMatrix4(P.W), n: _cn.clone() }; }
    return null; }

  // ============================== LA MAISON : les pieces, le relief, la voie ==============================
  const DESK = 112, CEIL = 375, CNT = 135, IL0 = 4560, IL1 = 4910, ILW = 72;   // v441 : l'ilot de cuisine (w de IL0 a IL1, u de -ILW a ILW)
  const WB = 300, WL = 1700, WJ = 2900, WCO = 3700, WK = 4950, WF = 5400, WE = 6400;
  // les pieces : [debut, fin, demi-largeur, couleur des murs]
  const ROOMS = [[-420, WL, 340, '#a8cce8'], [WL, WJ, 420, '#f2d684'], [WJ, WCO, 80, '#e6d8bc'], [WCO, WF, 420, '#dcebe2']];
  const hsh = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1 + 5.3, y * 2.1 + 9.1) * 0.3 + vn(x * 4.3 + 11.7, y * 4.3 + 3.9) * 0.15;
  // v439 : LE TRACE : des points de passage [w, valeur] relies en douceur (pente nulle a chaque point : c'est la qu'on pose ce qui pend ou se tient debout)
  // on plonge du bureau, on rase le tapis, on passe sous le lit, on remonte vers le ventilateur ; on fait des S entre les boucles, on monte a la regle qui tourne,
  // on replonge au train ; le couloir ondule de haut en bas ; on rase le carrelage sous la table, on saute sur le plan de travail, on monte a la fenetre, on plonge dans l'herbe
  const KEY = (K, w) => { if (w <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (w <= K[i + 1][0]) return K[i][1] + (K[i + 1][1] - K[i][1]) * ss(K[i][0], K[i + 1][0], w); return K[K.length - 1][1]; };
  const KU = [[0, 0], [300, 0], [500, -50], [760, 0], [1130, 0], [1420, 90], [1720, 0], [1990, -100], [2270, 0], [2560, 100], [2900, 0], [3150, 25], [3450, -25], [3700, 0], [5450, 0], [5640, -90], [5900, 40], [6150, -30], [6400, 0]];
  const KY = [[0, DESK + 2.2], [140, DESK + 8], [300, DESK + 12], [620, 30], [780, 18], [1110, 18], [1450, 150], [1750, 150], [2000, 34], [2160, 34], [2450, 150], [2700, 40], [2950, 140], [3200, 70], [3450, 170], [3700, 110], [3900, 18], [4260, 18],
    [4540, CNT + 34], [4900, CNT + 34], [5390, 240], [5450, 240], [5700, 75], [6400, 75]];
  // v441 : LE LISSAGE : le rayon de chaque virage reste au moins deux fois plus grand que la zone de vol (et jamais moins de 100 m).
  // Sinon le repere de la voie se replie sur lui-meme : les murs traversent la zone de vol de biais (on voit un mur la ou on passe) et la camera pivote d'un coup.
  const SMH = 10, SMN = Math.ceil(WE / SMH) + 1, SU = new Float32Array(SMN), SY = new Float32Array(SMN);
  { const HZ = [[0, 300, 30, 16], [300, 700, 55, 60], [700, 1130, 22, 13], [1130, 2900, 55, 60], [2900, 3700, 42, 60], [3700, 3790, 55, 60], [3790, 4320, 22, 13], [4320, 4900, 24, 26], [4900, 5400, 40, 40], [5400, 1e9, 55, 60]], RU = new Float32Array(SMN), RY = new Float32Array(SMN);
    for (let i = 0; i < SMN; i++) { const w = i * SMH; SU[i] = KEY(KU, w); SY[i] = KEY(KY, w); let hx = 0, hy = 0; for (const z of HZ) if (z[1] > w - 100 && z[0] < w + 100) { hx = Math.max(hx, z[2]); hy = Math.max(hy, z[3]); } RU[i] = Math.max(2.2 * hx, 100); RY[i] = Math.max(2.2 * hy, 100); }
    const h2 = SMH * SMH; for (let it = 0; it < 20000; it++) { let bad = 0; for (let i = 3; i < SMN - 1; i++) { const lu = SU[i - 1] + SU[i + 1] - 2 * SU[i], ly = SY[i - 1] + SY[i + 1] - 2 * SY[i]; if (Math.hypot(lu / h2 * RU[i], ly / h2 * RY[i]) > 1) { bad++; SU[i] += lu * 0.5; SY[i] += ly * 0.5; } } if (!bad) break; } }
  const SMI = (A, w) => { const u = Math.min(Math.max(w / SMH, 0), SMN - 1.0001), i = Math.floor(u), f = u - i; return A[i] + (A[i + 1] - A[i]) * f; };
  const pathU = (w) => SMI(SU, w), pathY = (w) => SMI(SY, w);
  const deskK = (u, w) => ss(-270, -262, w) * (1 - ss(307, 309, w)) * (1 - ss(226, 234, Math.abs(u)));
  const cntK = (u, w) => ss(330, 336, Math.abs(u)) * ss(3846, 3854, w) * (1 - ss(5380, 5388, w));   // les plans de travail (le frigo et l'entree avant)
  function H(u, w) {
    let h = DESK * deskK(u, w);
    if (w > WF - 20) { const ad = Math.abs(u - pathU(w)); h += 5 * (fbm(u * 0.02, w * 0.02) - 0.5) * ss(30, 80, ad) + 120 * ss(800, 1300, ad) * (0.5 + fbm(u * 0.003, w * 0.003)); }
    return h;
  }
  const CPL = []; for (let w = 0; w <= WE; w += 25) CPL.push([pathU(w), pathY(w), w]);
  const LOC = (() => { const cv = new T3.CatmullRomCurve3(CPL.map((q) => new V(q[0], q[1], q[2])), false, 'centripetal', 0.5), len = cv.getLength(), N = Math.ceil(len / 2), P = cv.getSpacedPoints(N);
    return { len, sAtW: (w) => { for (let i = 0; i <= N; i++) if (P[i].z >= w) return i * len / N; return len; } }; })();
  const sW = (w) => Math.round(LOC.sAtW(w));
  const ZN = [[0, sW(WB), 'mbureau', 'LE BUREAU', '#ffd27a', 'pad'], [sW(WB), sW(700), 'mchambre', 'LA CHAMBRE', '#9ad8ff', 'open'], [sW(700), sW(1130), 'mlit', 'SOUS LE LIT', '#c8b0ff', 'low'], [sW(1130), sW(WL), 'mventilo', 'LE GRAND VENTILATEUR', '#8ae0ff', 'open'],
    [sW(WL), sW(WJ), 'mjeux', 'LA SALLE DE JEUX', '#ffb04a', 'open'], [sW(WJ), sW(WCO), 'mcouloir', 'LE COULOIR', '#f2dca8', 'corr'], [sW(WCO), sW(3790), 'mcuisine', 'LA CUISINE', '#a8ffd0', 'open'], [sW(3790), sW(4320), 'mtable', 'SOUS LA TABLE', '#ffd27a', 'low'],
    [sW(4320), sW(4900), 'mplan', 'LE PLAN DE TRAVAIL', '#ff9a7a', 'counter'], [sW(4900), sW(WF), 'mfenetre', 'LA FENETRE OUVERTE', '#fff2a0', 'boost'], [sW(WF), 1e9, 'mjardin', 'LE JARDIN', '#9aff6a', 'open']];
  const zoneAt = (s) => { for (let i = ZN.length - 1; i >= 0; i--) if (s >= ZN[i][0]) return i; return 0; };
  // l'ambiance (en w) : [w, ciel haut, horizon, brume, brume proche, brume loin, lumiere]
  const MOOD = [[0, '#e8d4b4', '#f0dcc0', '#e4d0b0', 420, 2300, 0.95], [740, '#e8d4b4', '#f0dcc0', '#e4d0b0', 420, 2300, 0.95], [800, '#8a7a64', '#9a8a70', '#8a7a62', 160, 900, 0.55], [1080, '#8a7a64', '#9a8a70', '#8a7a62', 160, 900, 0.55], [1150, '#e0d4bc', '#ecdcc4', '#dccdb4', 420, 2200, 0.95],
    [WL - 80, '#e0d4bc', '#ecdcc4', '#dccdb4', 420, 2200, 0.95], [WL + 120, '#f0dca4', '#f4e4b4', '#e8d49c', 420, 2300, 1.0], [WJ - 80, '#f0dca4', '#f4e4b4', '#e8d49c', 420, 2300, 1.0],
    [WJ + 100, '#bcaa8a', '#c8b898', '#b4a486', 200, 1100, 0.8], [WCO - 60, '#bcaa8a', '#c8b898', '#b4a486', 200, 1100, 0.8], [WCO + 150, '#d4e2da', '#e2ece4', '#d0ddd4', 420, 2300, 0.95], [4300, '#c8d6ce', '#d8e4dc', '#c4d2ca', 300, 1600, 0.75], [4460, '#d4e2da', '#e2ece4', '#d0ddd4', 420, 2300, 0.95], [WK + 200, '#e2ece6', '#eef4ee', '#dce6e0', 460, 2600, 1.05],
    [WF + 80, '#3a8ae0', '#d6ecff', '#c4e0f6', 420, 3400, 1.1], [1e9, '#3a8ae0', '#d6ecff', '#c4e0f6', 420, 3400, 1.1]];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color(), _c4 = new T3.Color();
  function moodAt(w) { let i = 0; while (i < MOOD.length - 2 && w > MOOD[i + 1][0]) i++; const A = MOOD[i], B = MOOD[i + 1], t = ss(A[0], B[0], w);
    return { top: _c1.set(A[1]).lerp(_c4.set(B[1]), t).clone(), hor: _c2.set(A[2]).lerp(_c4.set(B[2]), t).clone(), fog: _c3.set(A[3]).lerp(_c4.set(B[3]), t).clone(), near: U.lerp(A[4], B[4], t), far: U.lerp(A[5], B[5], t), li: U.lerp(A[6], B[6], t) }; }

  // ============================== OUTILS ==============================
  function buildPath(P0, F0) {
    const Y = new V(0, 1, 0), R0 = new V().crossVectors(F0, Y).normalize(), W = (q) => new V().copy(P0).addScaledVector(R0, q[0]).addScaledVector(Y, q[1]).addScaledVector(F0, q[2]);
    const curve = new T3.CatmullRomCurve3(CPL.map(W), false, 'centripetal', 0.5), len = curve.getLength(), N = Math.ceil(len / 2), P = curve.getSpacedPoints(N), step = len / N, T = [], UP = [], RT = [];
    for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; T.push(new V().subVectors(b, a).normalize()); }
    for (let i = 0; i <= N; i++) { const up = new V().copy(Y).addScaledVector(T[i], -Y.dot(T[i])).normalize(); UP.push(up); RT.push(new V().crossVectors(T[i], up).normalize()); }
    const fr = (s, o) => { const u = U.clamp(s / step, 0, N - 1e-4), i = Math.floor(u), f = u - i; o = o || {}; o.p = (o.p || new V()).lerpVectors(P[i], P[i + 1], f); o.t = (o.t || new V()).lerpVectors(T[i], T[i + 1], f).normalize(); o.u = (o.u || new V()).lerpVectors(UP[i], UP[i + 1], f).normalize(); o.r = (o.r || new V()).crossVectors(o.t, o.u).normalize(); return o; };
    const loc = (p) => { const dx = p.x - P0.x, dz = p.z - P0.z; return [dx * R0.x + dz * R0.z, dx * F0.x + dz * F0.z]; };
    const sAtW = (w) => { for (let i = 0; i <= N; i++) { const q = loc(P[i]); if (q[1] >= w) return i * step; } return len; };
    return { O: P0, F0, R0, len, step, N, P, T, UP, RT, fr, W, loc, sAtW };
  }
  const frameQ = (F, out) => out.setFromRotationMatrix(_m.makeBasis(F.r, F.u, _d.copy(F.t).negate()));
  const _PF = {};
  function placeAt(PA, o, s, x, y, zf) { const F = PA.fr(s, _PF); o.position.copy(F.p).addScaledVector(F.r, x || 0).addScaledVector(F.u, y || 0).addScaledVector(F.t, zf || 0); frameQ(F, o.quaternion); return o; }
  const holder = (PA, grp, s) => { const h = placeAt(PA, new T3.Group(), s); grp.add(h); return h; };
  const glowS = (size, col, op) => { const s = EVO.boss2Kit ? EVO.boss2Kit.glow(size, col) : new T3.Object3D(); if (s.material) s.material.opacity = op === undefined ? 1 : op; return s; };
  // une boite decoupee (la courbure du monde se fait sommet par sommet : jamais de grandes faces d'un seul tenant)
  const nseg = (s) => Math.max(1, Math.min(120, Math.ceil(s / 18)));
  const SB = (x, y, z) => new T3.BoxGeometry(x, y, z, nseg(x), nseg(y), nseg(z));
  const CYG = (r0, r1, h, n) => new T3.CylinderGeometry(r0, r1, h, n || 12, nseg(h));
  // cuisson : des pieces {g, c, p, r, s} -> un seul maillage colore (le kit de la fete foraine)
  function bake(parts) { const K = EVO.foireKit; if (K && K.bake) { const m = K.bake(parts); if (m.material) { m.material = m.material.clone(); m.material.color.setScalar(0.74); } return m; }
    const grp = new T3.Group(); for (const q of parts) { const m = new T3.Mesh(q.g, lam(q.c)); m.position.fromArray(q.p); if (q.r) m.rotation.fromArray(q.r); if (q.s) m.scale.fromArray(q.s); grp.add(m); } return grp; }
  // des pieces simples dans un repere local (x, y, z)
  const pB = (P, x, y, z, sx, sy, sz, c, r) => P.push({ g: SB(sx, sy, sz), c, p: [x, y, z], r });
  const pC = (P, x, y, z, r0, r1, h, c, n, r) => P.push({ g: CYG(r0, r1, h, n), c, p: [x, y, z], r });
  const pS = (P, x, y, z, rad, c, s) => P.push({ g: new T3.SphereGeometry(rad, 14, 10), c, p: [x, y, z], s });
  let DOT = null; const dotTex = () => { if (DOT) return DOT; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); DOT = new T3.CanvasTexture(c); return DOT; };
  let SHT = null; const shadowTex = () => { if (SHT) return SHT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); SHT = new T3.CanvasTexture(c); return SHT; };
  const lumpGeo = (sx, sy, sz, seed, det, amp) => { const g = new T3.IcosahedronGeometry(1, det || 2), P = g.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).normalize(); const w = 1 + amp * (Math.sin(q.x * 3.1 + seed) * Math.cos(q.y * 2.7 + seed * 1.7) + 0.6 * Math.sin(q.z * 5.3 + seed * 2.3) * Math.cos(q.x * 4.1 + seed) + 0.35 * Math.sin((q.x + q.y + q.z) * 9 + seed)); P.setXYZ(i, q.x * w * sx, q.y * w * sy, q.z * w * sz); } g.computeVertexNormals(); return g; };
  function waterTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#cfe8f2'; x.fillRect(0, 0, 64, 256);
    for (let k = 0; k < 70; k++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(120,180,210,0.6)'; x.fillRect(rr(0, 64), rr(0, 256), rr(2, 6), rr(30, 120)); }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; return t; }
  const TOYC = ['#e8302a', '#2a6ad8', '#f2c41a', '#2a9a4a', '#ff7a1a', '#9a4ad8', '#f4f2ec'];
  const tc = () => TOYC[Math.floor(Math.random() * TOYC.length)];

  // ============================== LE SOL (parquet, tapis, tapis de jeu, carrelage, pelouse) ==============================
  function terrain(PA, grp) {
    const P0 = PA.O, R0 = PA.R0, F0 = PA.F0, Dn = []; for (let d = 0; d <= 120; d += 6) Dn.push(d); for (let d = 130; d <= 240; d += 10) Dn.push(d); { let d = 240, st = 14; while (d < 1500) { d += st; st *= 1.16; Dn.push(Math.round(d)); } }
    const D = [...Dn.slice(1).reverse().map((d) => -d), ...Dn], nc = D.length, rows = []; for (let w = -500; w <= WE + 1200; w += (w > 280 && w < 320) ? 3 : 10) rows.push(w); const nr = rows.length;
    const pos = new Float32Array(nr * nc * 3), col = new Float32Array(nr * nc * 3), idx = [], c = new T3.Color();
    const CC_ = (h) => new T3.Color(h), K = { desk: CC_('#c08a58'), desk2: CC_('#a8744a'), pk: [CC_('#c8965e'), CC_('#b8874f'), CC_('#d2a26a'), CC_('#bf8f58')], rug: [CC_('#e86a5a'), CC_('#f2c45a'), CC_('#5ab0d8'), CC_('#f4ede0')], mat: CC_('#6ab04a'), road: CC_('#6a6a72'), line: CC_('#f4f2ec'),
      run: CC_('#a83a32'), runB: CC_('#e2b84a'), tl1: CC_('#ecebe4'), tl2: CC_('#3c4048'), cnt: CC_('#d8d2c6'), g1: CC_('#5c9c3a'), g2: CC_('#6cac44'), far: CC_('#7a9a5a') };
    for (let j = 0; j < nr; j++) { const w = rows[j], pu = pathU(w);
      for (let i = 0; i < nc; i++) { const d = D[i], u = pu + d, h = H(u, w), k = (j * nc + i) * 3, au = Math.abs(u);
        pos[k] = P0.x + R0.x * u + F0.x * w; pos[k + 1] = P0.y + h; pos[k + 2] = P0.z + R0.z * u + F0.z * w;
        // le parquet : des lames de 22 m le long de w, joints decales
        { const pl = Math.floor(u / 22), jn = Math.floor((w + pl * 53) / 140); c.copy(K.pk[Math.floor(hsh(pl, jn) * 4)]); if (((u / 22) % 1 + 1) % 1 < 0.06) c.multiplyScalar(0.8); }
        if (deskK(u, w) > 0.5) { c.copy(K.desk).lerp(K.desk2, 0.5 + 0.5 * Math.sin(u * 0.08 + fbm(u * 0.01, w * 0.05) * 6)); if (h < DESK - 1) c.multiplyScalar(0.8); }
        else if (w < WL) { const rd = Math.hypot(u, (w - 560) * 1.25); if (rd < 170) c.copy(K.rug[Math.floor(rd / 34) % 4]); }   // le tapis rond de la chambre
        else if (w < WJ) { if (au < 360) { c.copy(K.mat); const rx = Math.min(Math.abs(u - 110), Math.abs(u + 150)), rw = Math.abs(((w - 1700) % 300) - 150);   // le tapis de jeu : des routes grises, des pointilles blancs
            if (rx < 14 || rw < 14) { c.copy(K.road); if ((rx < 1.2 && Math.floor(w / 20) % 2) || (rw < 1.2 && Math.floor(u / 20) % 2)) c.copy(K.line); } if (au > 352) c.copy(K.line); } }
        else if (w < WCO) { if (au < 48) c.copy(au > 42 ? K.runB : K.run); }   // le tapis du couloir
        else if (w < WF) { c.copy((Math.floor(u / 45) + Math.floor(w / 45)) % 2 ? K.tl1 : K.tl2); }   // le carrelage de la cuisine, les plans de travail
        else { c.copy(Math.floor(w / 60) % 2 ? K.g1 : K.g2).lerp(K.far, ss(400, 1200, Math.abs(d)) * 0.7); }   // la pelouse tondue en bandes
        const j2 = 0.95 + 0.1 * hsh(i * 3.1, j * 1.7); col[k] = c.r * j2; col[k + 1] = c.g * j2; col[k + 2] = c.b * j2; } }
    for (let j = 0; j < nr - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c2 = a + nc, d2 = c2 + 1; idx.push(a, c2, b, b, c2, d2); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    { const n = geo.attributes.normal; let up = 0; for (let i = 0; i < n.count; i += 97) up += n.getY(i); if (up < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } geo.setIndex(idx); geo.computeVertexNormals(); } }
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true })); m.material.color.setScalar(0.7); m.frustumCulled = false; grp.add(m); L.ground = m;
  }
  const gH = (x, z) => { const q = L.PA.loc(_c.set(x, 0, z)); return L.PA.O.y + H(q[0], q[1]) + ((Math.abs(q[0]) > 326 && q[1] > 3850 && q[1] < 5390) || (Math.abs(q[0]) < ILW && q[1] > IL0 && q[1] < IL1) ? CNT : 0); };
  const atUW = (u, w, dy) => new V().copy(L.PA.O).addScaledVector(L.PA.R0, u).addScaledVector(L.PA.F0, w).setY(L.PA.O.y + H(u, w) + (dy || 0));

  // ============================== LES OMBRES ET L'HERBE (en lots) ==============================
  const SHAD = [], GRASS = [];
  const shad = (p, r) => SHAD.push([p.x, p.y, p.z, r]);
  const shUW = (u, w, r) => shad(atUW(u, w), r);
  function batches(grp) {
    const o = new T3.Object3D(), c = new T3.Color();
    if (GRASS.length) { const im = new T3.InstancedMesh(new T3.ConeGeometry(1, 1, 3, 1).translate(0, 0.5, 0), new T3.MeshLambertMaterial({ flatShading: true }), GRASS.length);
      GRASS.forEach((b, i) => { o.position.set(b[0], b[1] - 0.3, b[2]); o.rotation.set(rr(-0.25, 0.25), rr(0, 6), rr(-0.25, 0.25)); o.scale.set(b[3] * 1.6, b[4], b[3] * 0.4); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(['#4a8a2c', '#5a9a34', '#3e7a26', '#6aaa3c', '#7ab444'][i % 5])); });
      im.frustumCulled = false; grp.add(im); }
    if (SHAD.length) { const sm = new T3.InstancedMesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#2a2018' }), SHAD.length);
      SHAD.forEach((s, i) => { o.position.set(s[0] + s[3] * 0.2, s[1] + 0.25, s[2] + s[3] * 0.15); o.rotation.set(0, 0, 0); o.scale.set(s[3], 1, s[3]); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.renderOrder = 1; sm.frustumCulled = false; grp.add(sm); }
  }

  // ============================== LES JOUETS ET LES MEUBLES (dans le repere de la maison : x = u, y = hauteur, z = -w) ==============================
  // un crayon de couleur couche ou debout : corps a six pans, bois taille, mine, gomme
  const pencil = (P, x, y, z, len, col, r, k) => { k = k || 1; const e = new T3.Euler().fromArray(r || [0, 0, 0]), q = new T3.Quaternion().setFromEuler(e), ax = new V(0, 1, 0).applyQuaternion(q);
    const at = (t) => [x + ax.x * t, y + ax.y * t, z + ax.z * t]; P.push({ g: new T3.CylinderGeometry(1.05 * k, 1.05 * k, len * 0.82, 6, nseg(len)), c: col, p: at(0), r });
    P.push({ g: new T3.CylinderGeometry(0.45 * k, 1.05 * k, len * 0.12, 6), c: '#e8c89a', p: at(len * 0.47), r }); P.push({ g: new T3.CylinderGeometry(0.02, 0.45 * k, len * 0.05, 6), c: col, p: at(len * 0.555), r });
    P.push({ g: new T3.CylinderGeometry(1.1 * k, 1.1 * k, len * 0.05, 8), c: '#c8c8c0', p: at(-len * 0.435), r }); P.push({ g: new T3.CylinderGeometry(1.05 * k, 1.05 * k, len * 0.05, 8), c: '#f28aa8', p: at(-len * 0.485), r }); };
  // une voiture jouet
  const toyCar = (P, x, y, z, ry, col, k) => { k = k || 1; const R = [0, ry, 0], rot = (dx, dz) => [x + Math.cos(ry) * dx + Math.sin(ry) * dz, z - Math.sin(ry) * dx + Math.cos(ry) * dz];
    let q = rot(0, 0); P.push({ g: SB(9 * k, 3.2 * k, 16 * k), c: col, p: [q[0], y + 3.2 * k, q[1]], r: R }); P.push({ g: SB(7.5 * k, 3 * k, 8 * k), c: '#bfe4f4', p: [q[0], y + 6 * k, q[1] + 0.5 * k], r: R });
    for (const [dx, dz] of [[-4.6, -5], [4.6, -5], [-4.6, 5], [4.6, 5]]) { q = rot(dx * k, dz * k); P.push({ g: new T3.CylinderGeometry(2 * k, 2 * k, 1.6 * k, 12), c: '#1e2026', p: [q[0], y + 2 * k, q[1]], r: [0, ry, Math.PI / 2] }); } };
  // un cube a lettres
  const cube = (P, x, y, z, a, ry, col) => { P.push({ g: SB(a, a, a), c: col, p: [x, y + a / 2, z], r: [0, ry, 0] }); for (const [dx, dz] of [[0, a / 2 + 0.1], [a / 2 + 0.1, 0]]) P.push({ g: SB(dz ? a * 0.6 : 0.2, a * 0.6, dz ? 0.2 : a * 0.6), c: '#f4f2ec', p: [x + Math.cos(ry) * dx + Math.sin(ry) * dz, y + a / 2, z - Math.sin(ry) * dx + Math.cos(ry) * dz], r: [0, ry, 0] }); };
  // une brique de construction (avec ses picots)
  const brick = (P, x, y, z, sx, col, ry) => { P.push({ g: new T3.BoxGeometry(sx, 2.9, 4.8), c: col, p: [x, y + 1.45, z], r: [0, ry || 0, 0] }); const n = Math.max(1, Math.round(sx / 4.8)); for (let k = 0; k < n; k++) { const dx = (k - (n - 1) / 2) * 4.8; P.push({ g: new T3.CylinderGeometry(1.4, 1.4, 1.1, 12), c: col, p: [x + Math.cos(ry || 0) * dx, y + 3.4, z - Math.sin(ry || 0) * dx] }); } };
  // un livre ferme
  const book = (P, x, y, z, ry, col, th) => { th = th || 4.5; P.push({ g: SB(32, th, 22), c: col, p: [x, y + th / 2, z], r: [0, ry, 0] }); P.push({ g: SB(31, th * 0.8, 21.2), c: '#f4efe0', p: [x + Math.sin(ry) * 0.6, y + th / 2, z + Math.cos(ry) * 0.6], r: [0, ry, 0] }); };

  function house(PA, grp) {
    const HG = new T3.Group(); HG.position.copy(PA.O); HG.rotation.y = Math.atan2(-PA.F0.x, -PA.F0.z); grp.add(HG); L.HG = HG;
    const P = [], PL = [], put = (x, y, w, sx, sy, sw, c, r) => pB(P, x, y, -w, sx, sy, sw, c, r);
    // ---------- LES MURS, LES PLAFONDS, LES PLINTHES, LES PORTES ----------
    for (const [w0, w1, hw, col] of ROOMS) { const L2 = w1 - w0, wm = (w0 + w1) / 2;
      for (const sd of [-1, 1]) { put(sd * (hw + 5), CEIL / 2, wm, 10, CEIL, L2, col); put(sd * (hw - 1), 7.5, wm, 3, 15, L2, '#f4f2ec'); put(sd * (hw - 0.5), CEIL - 6, wm, 2, 12, L2, '#f4f2ec'); }
      put(0, CEIL + 5, wm, hw * 2 + 20, 10, L2, '#f2eee4'); }
    put(0, CEIL / 2, -425, 700, CEIL, 10, ROOMS[0][3]);   // le mur du fond de la chambre
    const doorWall = (w, hw, col0, col1, dw, dh) => { for (const [col, dz] of [[col0, -2.5], [col1, 2.5]]) { for (const sd of [-1, 1]) put(sd * (dw + (hw - dw) / 2), CEIL / 2, w + dz, hw - dw, CEIL, 5, col); put(0, (CEIL + dh) / 2, w + dz, dw * 2, CEIL - dh, 5, col); }
      for (const sd of [-1, 1]) put(sd * (dw + 2), dh / 2, w, 4, dh, 12, '#f4f2ec'); put(0, dh + 2, w, dw * 2 + 8, 4, 12, '#f4f2ec'); };
    doorWall(WL, 420, ROOMS[0][3], ROOMS[1][3], 115, 345); doorWall(WJ, 420, ROOMS[1][3], ROOMS[2][3], 115, 345); doorWall(WCO, 420, ROOMS[2][3], ROOMS[3][3], 115, 345);
    // le mur de la fenetre (dedans : carrelage de la cuisine ; dehors : la facade creme) et la fenetre grande ouverte
    { const w = WF, u0 = -150, u1 = 150, y0 = 140, y1 = 340; for (const [col, dz] of [['#dcebe2', -2.5], ['#efe2c8', 2.5]]) { for (const sd of [-1, 1]) put(sd * (150 + 135), CEIL / 2, w + dz, 270, CEIL, 5, col); put(0, y0 / 2, w + dz, 300, y0, 5, col); put(0, (y1 + CEIL) / 2, w + dz, 300, CEIL - y1, 5, col); }
      for (const sd of [-1, 1]) put(sd * 152, (y0 + y1) / 2, w, 6, y1 - y0, 14, '#f8f8f4'); put(0, y1 + 3, w, 310, 6, 14, '#f8f8f4'); put(0, y0 - 3, w - 10, 320, 6, 36, '#f8f8f4');   // le cadre, l'appui
      for (const sd of [-1, 1]) { put(sd * 150 + sd * 2, (y0 + y1) / 2, w - 60, 4, y1 - y0 - 8, 120, '#f8f8f4'); put(sd * 150, (y0 + y1) / 2, w - 60, 2, y1 - y0 - 20, 108, '#cfe8f4'); }   // les battants ouverts
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) put(sd * (178 + k * 10), (y0 + y1 + 40) / 2, w - 8 - (k % 2) * 4, 9, y1 - y0 + 60, 3, '#f2c4a0');   // les rideaux
      pC(P, -100, y0 + 9, -(w - 12), 8, 6, 12, '#c86a3a', 14); pS(P, -100, y0 + 22, -(w - 12), 9, '#e8406a'); }
    // ---------- 1. LE BUREAU : la trousse, les crayons, les livres, la lampe, le globe, les feuilles ----------
    { const y = DESK; put(0, DESK - 50, 303, 470, 100, 6, '#b07c4c'); for (const sd of [-1, 1]) { put(sd * 115, DESK - 50, 307, 200, 80, 3, '#c89262'); pS(P, sd * 115, DESK - 50, -309, 3, '#e8c44a'); }   // les tiroirs
      pC(P, 80, y + 9, -110, 12, 11, 18, '#2a6ad8', 20); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; pencil(P, 80 + Math.cos(a) * 5, y + 22, -110 + Math.sin(a) * 5, 26, TOYC[k % 7], [Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18]); } shUW(80, 110, 16);
      for (let k = 0; k < 5; k++) book(P, -95 + rr(-2, 2), y + k * 4.6, -60, rr(-0.2, 0.2), TOYC[k]); shUW(-95, 60, 22);
      pC(P, 150, y + 1.5, 60, 14, 15, 3, '#1e2026', 20); pC(P, 150, y + 29.3, 50.4, 1.4, 1.4, 56, '#c8d0d8', 10, [-0.35, 0, 0]); pS(P, 150, y + 55.6, 41, 2.6, '#9aa4ae'); pC(P, 150, y + 62.8, 22.4, 1.4, 1.4, 40, '#c8d0d8', 10, [-1.2, 0, 0]);
      P.push({ g: new T3.ConeGeometry(14, 16, 20, 1, true), c: '#e8302a', p: [150, y + 64, 3.8], r: [0.2, 0, 0] }); P.push({ g: new T3.SphereGeometry(6, 12, 8), c: '#e8302a', p: [150, y + 72, 3.8] }); shUW(150, -60, 14);
      { const gw = glowS(70, '#ffe2a0', 0.55); gw.position.set(150, y + 57, 3.8); HG.add(gw); }
      pC(P, -150, y + 2, 150, 10, 12, 4, '#6a4a2c', 16); pC(P, -150, y + 14, 150, 1, 1, 22, '#c8a040', 8); P.push({ g: new T3.SphereGeometry(20, 24, 16), c: '#3a8ad8', p: [-150, y + 42, 150] }); for (let k = 0; k < 5; k++) pS(P, -150 + rr(-12, 12), y + 42 + rr(-12, 12), 150 + rr(-12, 12), rr(5, 9), '#5ab04a', [1, 0.5, 1]); shUW(-150, -150, 16);
      for (const [x, w, r] of [[-40, 190, 0.3], [-62, 175, -0.2], [54, 200, 0.6]]) { put(x, y + 0.2 + Math.random() * 0.2, w, 31, 0.3, 44, '#fbfaf4', [0, r, 0]); }   // les feuilles (dessins)
      put(-128, y + 0.3, 140, 45, 0.6, 4.5, '#f2d23a', [0, 0.4, 0]); put(30, y + 1.5, 250, 7, 3, 3.5, '#f28aa8', [0, 0.5, 0]); shUW(30, 250, 3);
      pencil(P, 110, y + 1.05, -220, 26, '#2a9a4a', [0, 0.7, Math.PI / 2]); pencil(P, -70, y + 1.05, -235, 26, '#e8302a', [0, -0.4, Math.PI / 2]);
      for (let k = 0; k < 6; k++) cube(P, 180 + (k % 3) * 7, y + Math.floor(k / 3) * 6, -(230 + (k % 2) * 4), 6, rr(-0.3, 0.3), TOYC[k]);
      // autour du pas de tir : la feuille a carreaux, un crayon couche, le taille-crayon, la boite de crayons de couleur, les post-it, un trombone
      put(-2, y + 0.15, 12, 31, 0.3, 44, '#f6f8fc', [0, 0.08, 0]); for (let k = -6; k <= 6; k++) { put(-2 + k * 2.4, y + 0.32, 12, 0.12, 0.05, 43, '#9ac0e8', [0, 0.08, 0]); }
      pencil(P, -9, y + 1.05, -16, 26, '#9a4ad8', [Math.PI / 2, 0.05, 0]); shUW(-9, 16, 3);
      put(-38, y + 2.2, 38, 5, 4.4, 4, '#3a8ad8', [0, 0.4, 0]); pC(P, -38, y + 2.4, -36, 1.3, 1.3, 1, '#1e2026', 10, [Math.PI / 2, 0.4, 0]); shUW(-38, 38, 3.5);
      { const bx = -48, bw = 50; put(bx, y + 6, bw, 19, 12, 9, '#f2c41a'); put(bx, y + 9, bw - 4.6, 19.4, 4, 0.4, '#2a6ad8'); for (let k = 0; k < 8; k++) pencil(P, bx - 8 + k * 2.3, y + 13 + (k % 3) * 1.5, -bw, 12, TOYC[k % 7], [0, 0, 0], 0.95); shUW(bx, bw, 12); }
      for (let k = 0; k < 6; k++) put(16, y + 0.2 + k * 0.25, 52, 11, 0.25, 11, '#f8e45a', [0, 0.1 * k, 0]); shUW(16, 52, 6);
      P.push({ g: new T3.TorusGeometry(1.6, 0.18, 6, 16), c: '#c8d0d8', p: [8, y + 0.2, -24], r: [Math.PI / 2, 0, 0.3], s: [1, 2.4, 1] });
      // le pas de tir : une gomme sous la fusee, deux crayons en V
      { const O = PA.fr(0).p, Lr = L.rkL, LP = []; LP.push({ g: SB(3.4, 1.1, Lr * 0.9), c: '#f28aa8', p: [0, -1.65, 0] }, { g: SB(3.5, 0.5, Lr * 0.92), c: '#2a6ad8', p: [0, -1.0, 0] }); for (const sd of [-1, 1]) LP.push({ g: new T3.CylinderGeometry(0.12, 0.12, Lr * 1.1, 6), c: sd > 0 ? '#f2c41a' : '#2a9a4a', p: [sd * 0.25, -0.5, 0], r: [Math.PI / 2, 0, 0] });
        const r = bake(LP); r.position.copy(O); r.quaternion.setFromRotationMatrix(_m.makeBasis(PA.R0, new V(0, 1, 0), _d.copy(PA.F0).negate())); grp.add(r); L.rack = r; shad(new V(O.x, O.y - 2.2, O.z), 3); } }
    // ---------- 2. LA CHAMBRE : le lit (on passe dessous), l'armoire, l'etagere, le coffre a jouets, la fenetre, les posters ----------
    { const w0 = 780, w1 = 1100, hw = 125;
      for (const [x, w] of [[-hw, w0], [hw, w0], [-hw, w1], [hw, w1]]) { put(x, 23, w, 10, 46, 10, '#8a5a34'); shUW(x, w, 8); }
      put(0, 60, (w0 + w1) / 2, hw * 2 + 10, 30, w1 - w0 + 10, '#9a6a40'); for (let w = w0 + 20; w < w1; w += 26) put(0, 44, w, hw * 2, 2, 8, '#6a4628');   // le cadre, les lattes vues de dessous
      put(0, 90, (w0 + w1) / 2, hw * 2, 30, w1 - w0, '#f4f2ec'); put(0, 112, (w0 + w1) / 2 - 20, hw * 2 + 16, 14, w1 - w0 - 40, '#5a8ad8'); for (let k = 0; k < 6; k++) put(0, 112.5, w0 + 20 + k * 46, hw * 2 + 17, 13, 10, '#f2c45a');   // matelas, couette a rayures
      for (const sd of [-1, 1]) put(sd * (hw + 8), 92, (w0 + w1) / 2 - 20, 2, 54, w1 - w0 - 40, '#5a8ad8');   // la couette qui pend
      put(0, 128, w1 - 30, 110, 22, 50, '#f4f2ec'); put(0, 154, w1 + 8, hw * 2 + 20, 192, 10, '#8a5a34'); for (const sd of [-1, 1]) put(sd * (hw + 5), 29, w1 + 8, 10, 58, 10, '#8a5a34'); shUW(0, (w0 + w1) / 2, 150);
      // sous le lit : moutons de poussiere, une chaussette perdue, une boite a chaussures, une voiture
      for (let k = 0; k < 9; k++) { const x = (Math.random() < 0.5 ? -1 : 1) * rr(32, 110), w = rr(w0 + 20, w1 - 20); P.push({ g: lumpGeo(rr(4, 8), rr(2.5, 4), rr(4, 8), rr(0, 9), 2, 0.25), c: '#b4b0a8', p: [x, 2, -w] }); shUW(x, w, 6); }
      P.push({ g: new T3.TorusGeometry(10, 3.2, 8, 16, Math.PI * 0.9), c: '#e8302a', p: [70, 3, -900], r: [Math.PI / 2, 0, 0.6] }); shUW(70, 900, 10);
      put(-80, 9, 1030, 34, 18, 22, '#3a5a8a'); put(-80, 19, 1030, 36, 2, 24, '#2a4a7a'); shUW(-80, 1030, 20); toyCar(P, 95, 0, -820, 0.8, '#2a9a4a'); shUW(95, 820, 8); }
    put(-290, 160, 330, 90, 320, 240, '#c8a070'); for (const dz of [-60, 60]) put(-244, 160, 330 + dz, 2, 300, 110, '#d6b080'); shUW(-290, 330, 90);   // l'armoire
    { const x = 315; put(x, 140, 480, 46, 280, 240, '#e8e2d4'); for (let k = 0; k < 4; k++) { put(x, 20 + k * 70, 480, 46, 4, 240, '#d8d0c0'); for (let b = 0; b < 12; b++) put(x - 6, 22 + k * 70 + 15, 380 + b * 18 + rr(-2, 2), 30, rr(24, 34), rr(5, 9), tc()); } shUW(x, 480, 60); }   // l'etagere a livres
    { const x = 270, w = 1350; put(x, 45, w, 90, 90, 140, '#5ab0d8'); put(x, 92, w, 96, 8, 146, '#2a6ad8'); for (const sd of [-1, 1]) put(x - 46, 45, w + sd * 40, 2, 30, 30, '#f2c41a'); shUW(x, w, 80); }   // le coffre a jouets
    { const gw = glowS(500, '#fff4d0', 0.5); gw.position.set(-335, 240, -1080); HG.add(gw); put(-338, 240, 1080, 2, 190, 340, '#fff8e0'); put(-336, 240, 1080, 4, 6, 344, '#f4f2ec'); put(-336, 240, 1080, 4, 190, 6, '#f4f2ec'); for (const dz of [-195, 195]) put(-330, 220, 1080 + dz, 6, 280, 50, '#f2c4a0'); }   // la fenetre de la chambre
    for (const [x, y, w, sx, sy, c] of [[338, 230, 900, 1, 90, '#e8406a'], [338, 250, 1100, 1, 110, '#2a9ad8'], [-338, 220, 600, 1, 100, '#f2c41a'], [338, 220, 1550, 1, 80, '#9a4ad8']]) { put(x, y, w, 2, sy, sx * 70, '#f4f2ec'); put(x - Math.sign(x), y, w, 1, sy - 8, sx * 62, c); }   // les posters
    // des jouets par terre, jamais dans le couloir de vol
    for (let k = 0; k < 46; k++) { const w = rr(380, WL - 60), sd = Math.random() < 0.5 ? -1 : 1, x = pathU(w) + sd * rr(78, 300); if (Math.abs(x) > 320 || (w > 760 && w < 1120 && Math.abs(x) < 140)) continue; const r = Math.random();
      if (r < 0.3) { toyCar(P, x, 0, -w, rr(0, 6), tc()); shUW(x, w, 9); } else if (r < 0.6) { cube(P, x, 0, -w, 6, rr(0, 6), tc()); shUW(x, w, 5); } else if (r < 0.8) { brick(P, x, 0, -w, 9.6, tc(), rr(0, 6)); shUW(x, w, 6); } else { pencil(P, x, 1.05, -w, 26, tc(), [0, rr(0, 6), Math.PI / 2]); shUW(x, w, 6); } }
    { const cf = new T3.Group(); cf.position.set(0, CEIL - 30, -900); HG.add(cf); const st = new T3.Mesh(new T3.CylinderGeometry(2, 2, 28, 8), lam('#f4f2ec')); st.position.y = 16; cf.add(st); const rot = new T3.Group(); cf.add(rot); rot.add(new T3.Mesh(new T3.CylinderGeometry(9, 9, 6, 16), lam('#f4f2ec')));
      for (let k = 0; k < 4; k++) { const b = new T3.Mesh(new T3.BoxGeometry(70, 1.2, 14), lam('#c89a64')); b.position.set(Math.cos(k * 1.5708) * 40, 0, Math.sin(k * 1.5708) * 40); b.rotation.y = -k * 1.5708; rot.add(b); } L.spinY = [{ o: rot, v: 1.6 }]; }
    pC(P, 0, CEIL - 6, -560, 40, 46, 10, '#f8f4e8', 24); { const gw = glowS(160, '#fff0c8', 0.5); gw.position.set(0, CEIL - 18, -560); HG.add(gw); }
    // ---------- 3. LA SALLE DE JEUX : la ville de cubes, le chateau, le tipi, le xylophone, le grand ballon, les rails du petit train ----------
    for (let k = 0; k < 14; k++) { const w = 1800 + k * 80 + rr(-20, 20), sd = k % 2 ? 1 : -1, x = pathU(w) + sd * rr(82, 170); if (Math.abs(x) > 340) continue; const n = 1 + Math.floor(Math.random() * 3), col = tc();
      for (let j = 0; j < n; j++) cube(P, x, j * 8, -w, 8, rr(-0.1, 0.1), j === n - 1 ? '#e8302a' : col); P.push({ g: new T3.ConeGeometry(6.6, 7, 4), c: '#e8302a', p: [x, n * 8 + 3.5, -w], r: [0, Math.PI / 4, 0] }); shUW(x, w, 7); }   // les maisons de la ville
    for (let k = 0; k < 10; k++) { const w = rr(1760, 2860), x = Math.random() < 0.5 ? 110 : -150; if (Math.abs(w - 2600) < 40 || Math.abs(x - pathU(w)) < 78) continue; toyCar(P, x + rr(-6, 6), 0, -w, Math.random() < 0.5 ? 0 : Math.PI, tc()); shUW(x, w, 9); }   // les voitures sur les routes
    { const x = 270, w = 2300; for (const [dx, dw] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) { for (let j = 0; j < 8; j++) cube(P, x + dx, j * 9, -(w + dw), 9, 0, j % 2 ? '#f2c41a' : '#e8302a'); P.push({ g: new T3.ConeGeometry(8, 12, 4), c: '#2a6ad8', p: [x + dx, 78, -(w + dw)], r: [0, Math.PI / 4, 0] }); }
      for (const dw of [-40, 40]) for (let i = -3; i <= 3; i++) for (let j = 0; j < 4; j++) brick(P, x + i * 9.6, j * 2.9, -(w + dw), 9.6, '#f4f2ec', 0); shUW(x, w, 70); }   // le chateau de cubes
    { const x = -280, w = 2120; for (let k = 0; k < 8; k++) P.push({ g: new T3.CylinderGeometry(0.01, 48, 130, 8, 6, true, k / 8 * 6.283, 6.283 / 8), c: k % 2 ? '#e8302a' : '#f4f2ec', p: [x, 65, -w] }); pC(P, x, 138, -w, 1.2, 1.2, 20, '#8a5a34', 8); shUW(x, w, 50); }   // le tipi
    { const x = 200, w = 1880; put(x, 6, w, 60, 6, 40, '#8a5a34'); for (let k = 0; k < 8; k++) put(x - 24 + k * 7, 11, w, 5.5, 2, 36 - k * 2.6, TOYC[k % 7]); shUW(x, w, 30); }   // le xylophone
    { const x = -210, w = 2560; for (let k = 0; k < 6; k++) P.push({ g: new T3.SphereGeometry(26, 24, 16, k / 6 * 6.283, 6.283 / 6), c: TOYC[k], p: [x, 26, -w] }); shUW(x, w, 26); }   // le grand ballon
    // les rails du petit train qui traverse (w = 2600), d'un mur a l'autre
    put(0, 0.6, 2600, 840, 1.2, 14, '#8a6a4a'); for (const dz of [-3, 3]) put(0, 1.9, 2600 + dz, 840, 1.4, 1.0, '#9aa4ae'); for (let x = -410; x <= 410; x += 9) put(x, 1, 2600, 3, 1.4, 12, '#6a4a2c');
    pC(P, 0, CEIL - 6, -2300, 40, 46, 10, '#f8f4e8', 24); { const gw = glowS(160, '#fff0c8', 0.5); gw.position.set(0, CEIL - 18, -2300); HG.add(gw); }
    // ---------- 4. LE COULOIR : portes fermees, cadres, porte-manteau, chaussures, robot aspirateur ----------
    for (let w = WJ + 120; w < WCO - 60; w += 210) for (const sd of [-1, 1]) { put(sd * 79, 140, w, 2, 280, 110, '#c89a64'); put(sd * 78, 140, w, 2, 290, 120, '#f4f2ec'); pS(P, sd * 76, 130, -(w + 40), 3.5, '#e8c44a'); }
    for (let w = WJ + 220; w < WCO - 60; w += 210) for (const sd of [-1, 1]) { put(sd * 79, 210, w, 2, 70, 90, '#6a4a2c'); put(sd * 78, 210, w, 2, 60, 80, tc()); }
    for (let k = 0; k < 8; k++) { const sd = k % 2 ? 1 : -1, w = WJ + 80 + k * 90; P.push({ g: SB(10, 9, 26), c: tc(), p: [sd * 66, 4.5, -w] }, { g: SB(10.4, 2, 27), c: '#f4f2ec', p: [sd * 66, 1, -w] }); shUW(sd * 66, w, 9); }   // des chaussures
    { const w = 3350; pC(P, 60, 4, -w, 17, 17, 8, '#2a2c34', 24); pC(P, 60, 8.2, -w, 6, 6, 0.6, '#3ab0ff', 16); shUW(60, w, 17); }
    for (let w = WJ + 160; w < WCO; w += 260) { const gw = glowS(60, '#ffd890', 0.6); gw.position.set(0, CEIL - 20, -w); HG.add(gw); pC(P, 0, CEIL - 8, -w, 12, 16, 14, '#f4f2ec', 16); }
    // ---------- 5. LA CUISINE : la table et les chaises (on passe dessous), les placards, le frigo, la cuisiniere, l'evier, la bouilloire, les fruits ----------
    { const t0 = 3900, t1 = 4260, hw = 75; put(0, DESK - 3, (t0 + t1) / 2, hw * 2 + 10, 6, t1 - t0 + 10, '#c89a64'); for (const [x, w] of [[-hw, t0], [hw, t0], [-hw, t1], [hw, t1]]) { put(x, DESK / 2, w, 8, DESK, 8, '#9a6a40'); shUW(x, w, 6); }
      put(0, DESK + 0.5, (t0 + t1) / 2, 60, 1, t1 - t0 - 40, '#e8406a'); for (let k = 0; k < 4; k++) { const w = t0 + 50 + k * 85; pC(P, rr(-40, 40), DESK + 1.5, -w, 18, 14, 3, '#f4f2ec', 20); }   // le chemin de table, les assiettes
      { const x = 20, w = 4080; P.push({ g: new T3.SphereGeometry(22, 20, 10, 0, 6.283, Math.PI / 2, Math.PI / 2), c: '#2a6ad8', p: [x, DESK + 22, -w] }); for (let k = 0; k < 7; k++) pS(P, x + rr(-12, 12), DESK + 20 + rr(0, 8), -w + rr(-12, 12), rr(5, 7), ['#e8302a', '#f2c41a', '#ff7a1a', '#5ab04a'][k % 4]); } }   // le saladier de fruits
    for (const sd of [-1, 1]) { const x = sd * 360;
      for (let w = WCO + 150; w < WF - 30; w += 70) { put(sd * 331, CNT / 2, w + 35, 2, CNT - 14, 66, '#f4f2ec'); pS(P, sd * 329, CNT - 25, -(w + 35), 2, '#9aa4ae'); }   // les portes des placards bas
      for (let w = WCO + 160; w < WF - 60; w += 80) { if (sd > 0 && w > 4380 && w < 4900) continue; put(x + sd * 30, 280, w + 40, 60, 100, 76, '#f4f2ec'); pS(P, x - sd * 1, 250, -(w + 40), 2, '#9aa4ae'); }   // les placards hauts
      put(sd * 376, CNT / 2, (3850 + WF) / 2, 88, CNT, WF - 3850, '#e2ded4'); put(sd * 372, CNT + 1, (WCO + 150 + WF) / 2, 96, 2, WF - WCO - 150, '#d8d2c6'); }
    { const x = 360, w = 3790; put(x, 135, w, 80, 270, 90, '#f4f4f0'); put(x - 41, 170, w, 2, 4, 80, '#c8d0d8'); put(x - 41, 90, w - 30, 2, 60, 4, '#c8d0d8'); for (let k = 0; k < 4; k++) put(x - 41, 150 + k * 20, w + rr(-30, 30), 1, rr(8, 14), rr(8, 14), tc()); shUW(x, w, 50); }   // le frigo et ses aimants
    { const x = -362, w = 4500; put(x + 30, CNT + 1.5, w, 6, 1, 70, '#1e2026'); for (const [dx, dw] of [[-12, -16], [-12, 16], [12, -16], [12, 16]]) pC(P, x + dx, CNT + 1.6, -(w + dw), 9, 9, 0.6, '#3a3c44', 20); pC(P, x + 12, CNT + 10, -(w - 16), 12, 11, 18, '#c8d0d8', 20); P.push({ g: new T3.TorusGeometry(12, 1.2, 6, 20), c: '#9aa4ae', p: [x + 12, CNT + 19, -(w - 16)], r: [Math.PI / 2, 0, 0] }); }   // la cuisiniere, la casserole
    { put(0, CNT / 2, (IL0 + IL1) / 2, ILW * 2, CNT, IL1 - IL0, '#e2ded4'); put(0, CNT + 1, (IL0 + IL1) / 2, ILW * 2 + 8, 2, IL1 - IL0 + 8, '#d8d2c6'); put(0, 5, (IL0 + IL1) / 2, ILW * 2 - 6, 10, IL1 - IL0 - 6, '#2a2c34');
      for (let k = -2; k <= 2; k++) { put(k * 27, CNT / 2, IL0 - 0.6, 24, CNT - 18, 1, '#f4f2ec'); pS(P, k * 27 + 9, CNT - 25, -(IL0 - 1.5), 2, '#9aa4ae'); }   // l'ilot : ses portes de face, ses poignees
      for (const sd of [-1, 1]) for (let w = IL0 + 10; w < IL1 - 40; w += 66) put(sd * (ILW + 0.6), CNT / 2, w + 30, 1, CNT - 18, 60, '#f4f2ec');
      pC(P, -58, CNT + 3, -(IL0 + 60), 16, 14, 4, '#c89a64', 20); for (let k = 0; k < 4; k++) pS(P, -58 + rr(-7, 7), CNT + 9, -(IL0 + 60) + rr(-7, 7), rr(4, 6), ['#e8302a', '#f2c41a', '#5ab04a', '#ff7a1a'][k]);   // la corbeille de fruits (hors de la voie)
      put(56, CNT + 2.5, IL1 - 60, 22, 3, 40, '#c89a64'); shUW(-58, IL0 + 60, 14); }
    { const x = 362, w = 4300; put(x, CNT + 0.5, w, 50, 1, 70, '#9aa4ae'); pC(P, x + 20, CNT + 18, -w, 1.6, 1.6, 36, '#c8d0d8', 10); pC(P, x + 8, CNT + 35, -w, 1.4, 1.4, 24, '#c8d0d8', 10, [0, 0, Math.PI / 2]); }   // l'evier
    { const x = -365, w = 4660; P.push({ g: new T3.SphereGeometry(18, 20, 14), c: '#e8302a', p: [x, CNT + 16, -w], s: [1, 1.1, 1] }); pC(P, x, CNT + 36, -w, 3, 6, 4, '#1e2026', 12); pC(P, x + 18, CNT + 18, -w, 3, 4, 16, '#e8302a', 10, [0, 0, -1]); }   // la bouilloire
    { const x = -365, w = 4180; put(x, CNT + 16, w, 36, 32, 60, '#c8d0d8'); for (const dw of [-12, 12]) put(x, CNT + 32.5, w + dw, 22, 1, 6, '#1e2026'); }   // le grille-pain
    for (let w = WCO + 250; w < WF - 100; w += 420) { const gw = glowS(150, '#fffaf0', 0.45); gw.position.set(0, CEIL - 18, -w); HG.add(gw); pC(P, 0, CEIL - 6, -w, 36, 40, 10, '#f8f4e8', 24); }
    // ---------- 6. LE JARDIN : pelouse geante, tournesols, marguerites, arbres immenses, la palissade, l'arrosoir ----------
    for (let k = 0; k < 9000; k++) { const w = rr(WF + 10, WE + 1100), sd = Math.random() < 0.5 ? -1 : 1, d = sd * Math.pow(Math.random(), 1.3) * 760, u = pathU(Math.min(w, WE)) + d, p = atUW(u, w), ad = Math.abs(d); GRASS.push([p.x, p.y, p.z, rr(0.8, 1.6), ad < 64 ? rr(5, 12) : rr(14, 34)]); }
    // v445 : UNE TETE DE FLEUR face a la fusee : petales longs et pointus disposes en couronne, coeur bombe ; t incline la fleur (t > 0 : vers le bas)
    const PET = new T3.SphereGeometry(1, 10, 8);
    const flowerHead = (u, yy, w, t, n, R0, len, wid, col, R1, len1, col1, rc, cc, rc2, cc2) => { const ct = Math.cos(t), st = Math.sin(t);
      const ring = (m, rr0, ln, c, ph, dz) => { for (let k = 0; k < m; k++) { const a = (k + ph) / m * 6.283, ry = Math.sin(a) * rr0; P.push({ g: PET, c, p: [u + Math.cos(a) * rr0, yy + ry * ct - dz * st, -(w - (ry * st + dz * ct))], s: [wid, ln, wid * 0.22], r: [t, 0, a - Math.PI / 2] }); } };
      if (R1) ring(n, R1, len1, col1, 0.5, -0.6); ring(n, R0, len, col, 0, 0);
      P.push({ g: new T3.CylinderGeometry(rc, rc, 3, 24), c: cc, p: [u, yy + 0.8 * st, -(w - 0.8 * ct)], r: [Math.PI / 2 + t, 0, 0] });
      P.push({ g: new T3.SphereGeometry(rc2, 16, 10), c: cc2, p: [u, yy + 2 * st, -(w - 2 * ct)], s: [1, 1, 0.45], r: [t, 0, 0] }); };
    const sunflower = (u, w, hh) => { const y = H(u, w); pC(P, u, y + hh / 2, -w, 2.2, 3, hh, '#4a8a2c', 8); for (let k = 0; k < 3; k++) P.push({ g: lumpGeo(14, 1.5, 7, k, 1, 0.1), c: '#5a9a34', p: [u + (k % 2 ? 12 : -12), y + hh * (0.3 + k * 0.18), -w], r: [0, k * 2, k % 2 ? -0.4 : 0.4] });
      const yy = y + hh + 6; flowerHead(u, yy, w + 3, 0.3, 14, 16, 5, 3, '#4a8a2c', 0, 0, null, 0, '#4a8a2c', 0.01, '#4a8a2c'); flowerHead(u, yy, w, 0.3, 22, 25, 11, 3.6, '#ffc81a', 20, 9, '#ff9a1a', 15, '#6a3e1a', 11, '#3a2410'); shUW(u, w, 14); };
    for (let k = 0; k < 40; k++) { const w = rr(WF + 120, WE + 900), sd = Math.random() < 0.5 ? -1 : 1, u = pathU(Math.min(w, WE)) + sd * rr(100, 600); sunflower(u, w, rr(140, 230)); }
    { const D = []; for (let k = 0; k < 240; k++) { const w = rr(WF + 30, WE + 900), sd = Math.random() < 0.5 ? -1 : 1, u = pathU(Math.min(w, WE)) + sd * rr(72, 520); D.push([u, w, rr(30, 70)]); }
      const FC = [['#fbfaf4', '#f2c41a'], ['#fbfaf4', '#f2c41a'], ['#ff7ab8', '#ffd84a'], ['#b07ae8', '#ffd84a'], ['#ff8a2a', '#7a3a10'], ['#e8302a', '#2a1a10'], ['#fbfaf4', '#f2c41a'], ['#ffd23a', '#c86a10']];
      D.forEach(([u, w, hh], i) => { const y = H(u, w), C = FC[i % FC.length], sc = hh / 50; pC(P, u, y + hh / 2, -w, 1.1, 1.4, hh, '#4a8a2c', 6);
        P.push({ g: lumpGeo(9 * sc, 1, 4 * sc, i, 1, 0.1), c: '#5a9a34', p: [u + 7 * sc, y + hh * 0.35, -w], r: [0, i, -0.5] });
        flowerHead(u, y + hh + 1, w, -0.55, 14, 9 * sc, 6 * sc, 2.4 * sc, C[0], 0, 0, null, 4 * sc, C[1], 3.4 * sc, C[1]); shUW(u, w, 6 * sc); }); }
    for (const [u, w, s] of [[560, 6500, 1], [-760, 5950, 0.8], [-420, 7300, 1.1]]) { const y = H(u, w); pC(P, u, y + 450 * s, -w, 34 * s, 50 * s, 900 * s, '#6a4a32', 12); for (let k = 0; k < 9; k++) P.push({ g: lumpGeo(rr(150, 230) * s, rr(110, 160) * s, rr(150, 230) * s, k, 2, 0.15), c: ['#3e7a2c', '#4a8a34', '#2e6a26'][k % 3], p: [u + rr(-220, 220) * s, y + rr(760, 1050) * s, -(w + rr(-220, 220) * s)] }); shUW(u, w, 300 * s); }
    for (const sd of [-1, 1]) { for (let w = WF; w < WE + 1100; w += 36) put(sd * 950, 90, w, 8, 180, 30, '#c8a070'); for (const y of [40, 140]) put(sd * 945, y, (WF + WE + 1100) / 2, 6, 10, WE + 1100 - WF, '#a88050'); }
    for (let u = -950; u <= 950; u += 36) put(u, 90, WE + 1100, 30, 180, 8, '#c8a070');
    { const u = -230, w = 5900, y = H(u, w); pC(P, u, y + 60, -w, 50, 60, 120, '#2a9a4a', 24); pC(P, u + 75, y + 90, -w, 6, 10, 130, '#2a9a4a', 10, [0, 0, -1.0]); P.push({ g: new T3.TorusGeometry(40, 5, 8, 24, Math.PI), c: '#2a9a4a', p: [u, y + 120, -w], r: [0, Math.PI / 2, 0] }); shUW(u, w, 60); }   // l'arrosoir
    { const hm = bake(P); HG.add(hm); colAdd(hm, P); } for (const q of PL) HG.add(q);
  }

  // les nuages du jardin (bouffees douces tournees vers la camera)
  let PUF = null; const puffTex = () => { if (PUF) return PUF; const c = document.createElement('canvas'); c.width = c.height = 128; const px = c.getContext('2d'); for (let k = 0; k < 9; k++) { const cx = 64 + (Math.random() - 0.5) * 60, cy = 70 + (Math.random() - 0.5) * 34, r = 22 + Math.random() * 18, gr = px.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); px.fillStyle = gr; px.fillRect(0, 0, 128, 128); } PUF = new T3.CanvasTexture(c); return PUF; };
  const cloudMat = (tex) => new T3.ShaderMaterial({ uniforms: { uMap: { value: tex }, uOp: { value: 0.75 }, uFar: { value: 5000 }, uC: { value: new T3.Color('#ffffff') } },
    vertexShader: 'varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float sc = length(instanceMatrix[0].xyz); c.xy += position.xy * sc; vD = -c.z; gl_Position = projectionMatrix * c; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uOp; uniform float uFar; uniform vec3 uC; varying vec2 vUv; varying float vD; void main(){ float a = texture2D(uMap, vUv).a; vec3 c = mix(uC * 0.86, uC, smoothstep(0.15, 0.85, vUv.y)); float k = uOp * smoothstep(20.0, 140.0, vD) * (1.0 - smoothstep(uFar * 0.6, uFar, vD)); if (a * k < 0.01) discard; gl_FragColor = vec4(c, a * k); }',
    transparent: true, depthWrite: false, fog: false });
  function sky(g, PA, grp) {
    const S = new T3.Group(); L.sky = S; g.scene.add(S); if (EVO.boss2Kit) { const sun = EVO.boss2Kit.glow(420, '#fff4d8'); sun.renderOrder = -9; S.add(sun); L.sun = sun; }
    const M = cloudMat(puffTex()), P = []; for (let k = 0; k < 140; k++) { const w = rr(WF + 300, WE + 3000), d = rr(-2400, 2400); const p = new V().copy(PA.O).addScaledVector(PA.R0, pathU(Math.min(w, WE)) + d).addScaledVector(PA.F0, w); P.push([p.x, PA.O.y + rr(700, 1300), p.z, rr(260, 520)]); }
    const im = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), M, P.length), o = new T3.Object3D(); P.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.scale.setScalar(q[3]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.frustumCulled = false; im.renderOrder = 4; grp.add(im); L.cloudIM = im;
  }

  // ============================== LES CONFETTIS (bouquets de points qui s'ouvrent et retombent : ennemis abattus, boss, arrivee) ==============================
  const FWC = ['#ff5a4a', '#ffd04a', '#7af0ff', '#ff8ad8', '#9aff6a', '#ffffff', '#c08aff', '#ffb04a'];
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

  // ============================== LES EPREUVES (v439) : ce qui touche = exactement ce qu'on voit ; chaque passage est VIDE et encadre de jaune lumineux ==============================
  const FORG = 0.4;   // un peu d'indulgence : la zone qui touche est 0,4 m plus petite que l'objet dessine
  function obstacles(g, PA, grp) {
    const OB = L.O = [], sAt = (w) => PA.sAtW(w), hold = (s) => holder(PA, grp, s), RKF = RK - FORG;
    const ground = (s, x) => { const F = PA.fr(s), p = new V().copy(F.p).addScaledVector(F.r, x); return { p, gy: gH(p.x, p.z), F }; };
    const M = { wood: lam('#9a6a40'), cord: lam('#2a2c34'), brass: lam('#c8a040', { emissive: '#3a2a08' }), frame: bas('#ffd23a', { fog: false }) };
    // le cadre jaune lumineux d'un passage (x0..x1, y0..y1) + une lueur au centre
    const frameAt = (h, x0, x1, y0, y1) => { const t = 1.1, P = []; P.push({ g: SB(x1 - x0 + 2 * t, t, t), c: '#ffd23a', p: [(x0 + x1) / 2, y1 + t / 2, 0.8] }, { g: SB(x1 - x0 + 2 * t, t, t), c: '#ffd23a', p: [(x0 + x1) / 2, y0 - t / 2, 0.8] }, { g: SB(t, y1 - y0, t), c: '#ffd23a', p: [x0 - t / 2, (y0 + y1) / 2, 0.8] }, { g: SB(t, y1 - y0, t), c: '#ffd23a', p: [x1 + t / 2, (y0 + y1) / 2, 0.8] });
      const m = bake(P); m.material = M.frame; h.add(m); const gw = glowS(Math.max(x1 - x0, y1 - y0) * 1.6, '#fff0a0', 0.28); gw.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); h.add(gw); };
    // UN MUR DE GROSSES BRIQUES (deux couleurs) d'un bord a l'autre de la zone de vol, avec UN trou rectangulaire encadre ; on touche les briques dessinees, pas le trou
    const brickWall = (w, gx, gy, gw, gh, c1, c2, X, Y) => { const s = sAt(w), h = hold(s), G0 = ground(s, 0), base = G0.gy - G0.F.p.y, P = [], BR = [], BW = 19.2, BH = 5.8;
      for (let r = 0; base + r * BH < Y + 6; r++) { const y0 = base + r * BH; for (let x = -X - 14 - (r % 2) * BW / 2; x < X + 14; x += BW) { const x0 = x, x1 = x + BW; if (x1 > gx - gw / 2 && x0 < gx + gw / 2 && y0 + BH > gy - gh / 2 && y0 < gy + gh / 2) continue;
        const c = (r + Math.round(x / BW)) % 2 ? c1 : c2; P.push({ g: new T3.BoxGeometry(BW - 0.3, BH - 0.2, 9.6), c, p: [(x0 + x1) / 2, y0 + BH / 2, 0] }); for (const dx of [-BW / 4, BW / 4]) P.push({ g: new T3.CylinderGeometry(2.6, 2.6, 2, 12), c, p: [(x0 + x1) / 2 + dx, y0 + BH + 1, 0] }); BR.push([x0, x1, y0, y0 + BH]); } }
      h.add(bake(P));
      { const F = PA.fr(s), hw = (ROOMS.find((q) => w >= q[0] && w < q[1]) || ROOMS[0])[2], pu = pathU(w), xl = -hw - pu - 8, xr = hw - pu + 8, top = PA.O.y + CEIL - F.p.y + 8, by = base + Math.ceil((Y + 6 - base) / BH) * BH, xa = -X - 14, xb = X + 14, Q = [];
        Q.push({ g: SB(xa - xl, top - base + 2, 9.6), c: c2, p: [(xl + xa) / 2, (top + base - 2) / 2, 0] }, { g: SB(xr - xb, top - base + 2, 9.6), c: c2, p: [(xb + xr) / 2, (top + base - 2) / 2, 0] }, { g: SB(xb - xa, top - by, 9.6), c: c2, p: [0, (top + by) / 2, 0] });
        for (let y = base + BH; y < top - 4; y += BH) for (const [x0, x1] of [[xl, xa], [xb, xr], [xa, xb]]) { if (x0 === xa && y < by) continue; Q.push({ g: SB(x1 - x0, 0.5, 10.2), c: c1, p: [(x0 + x1) / 2, y, 0] }); }   // les joints du mur
        const qm = bake(Q); h.add(qm); colAdd(qm, Q.slice(0, 3)); }
      let hx0 = 1e9, hx1 = -1e9, hy0 = 1e9, hy1 = -1e9; for (let r = 0; base + r * BH < Y + 6; r++) { const y0 = base + r * BH; for (let x = -X - 14 - (r % 2) * BW / 2; x < X + 14; x += BW) if (x + BW > gx - gw / 2 && x < gx + gw / 2 && y0 + BH > gy - gh / 2 && y0 < gy + gh / 2) { hx0 = Math.min(hx0, x); hx1 = Math.max(hx1, x + BW); hy0 = Math.min(hy0, y0); hy1 = Math.max(hy1, y0 + BH); } }
      frameAt(h, Math.max(hx0, -X - 14), Math.min(hx1, X + 14), hy0, hy1); for (const sd of [-1, 0, 1]) { const q = ground(s, sd * X); shad(new V(q.p.x, q.gy, q.p.z), 30); }
      OB.push({ s, th: 5, kind: 'brique', hit: (x, y) => BR.some((b) => x > b[0] - RKF && x < b[1] + RKF && y > b[2] - RKF && y < b[3] + RKF) }); };
    // DES PILES DE LIVRES ETROITES sous le lit (livres de chant, 22 m de large) : on passe dans le vide entre elles, balise par des veilleuses au sol
    const piles = (w, xs, hh) => { const s = sAt(w), h = hold(s), P = [], Q = []; for (const x of xs) { const G = ground(s, x), b = G.gy - G.F.p.y; let y = b, k = 0; while (y < b + hh) { const th = rr(4, 5.5); P.push({ g: SB(22, th, 32), c: TOYC[(k + Math.round(x)) % 6], p: [x, y + th / 2, 0] }, { g: SB(21.2, th * 0.8, 31), c: '#f4efe0', p: [x + 0.5, y + th / 2, -0.6] }); y += th; k++; } Q.push([x, b + hh]); shad(new V(G.p.x, G.gy, G.p.z), 16); }
      h.add(bake(P)); const sorted = xs.slice().sort((a, b) => a - b), G0 = ground(s, 0), b0 = G0.gy - G0.F.p.y; for (let i = 0; i < sorted.length - 1; i++) { const m = (sorted[i] + sorted[i + 1]) / 2; for (const dz of [-10, 10]) { const l = new T3.Mesh(new T3.SphereGeometry(1.2, 8, 6), bas('#ffe04a')); l.position.set(m, b0 + 1.2, dz); h.add(l); const gw = glowS(10, '#ffe04a', 0.6); gw.position.copy(l.position); h.add(gw); } }
      OB.push({ s, th: 16.5, kind: 'livres', hit: (x, y) => Q.some((q) => Math.abs(x - q[0]) < 11 + RKF && y < q[1] + RKF) }); };
    // UNE HELICE / UN VENTILATEUR / UN MOULIN A VENT qui tourne face a la fusee (pales en secteurs : on passe dans les trous entre les pales)
    L.spin = []; const fan = (w, nb, R, bw, spd, cols, kind, pole) => { const s = sAt(w), h = hold(s), G = ground(s, 0), b = G.gy - G.F.p.y, rot = new T3.Group(); h.add(rot); const hub = Math.max(4, R * 0.08);
      for (let k = 0; k < nb; k++) { const sh = new T3.Shape(), a0 = -bw / 2, a1 = bw / 2; sh.moveTo(Math.cos(a0) * hub, Math.sin(a0) * hub); sh.absarc(0, 0, R, a0, a1, false); sh.lineTo(Math.cos(a1) * hub, Math.sin(a1) * hub); sh.absarc(0, 0, hub, a1, a0, true);
        const m = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false, curveSegments: 16 }), lam(cols[k % cols.length], { side: T3.DoubleSide })); m.rotation.z = k * 6.2832 / nb; rot.add(m); }
      const hb = new T3.Mesh(new T3.CylinderGeometry(hub, hub, 5, 20).rotateX(Math.PI / 2), lam('#5a6470')); rot.add(hb);
      if (pole) { const p = new T3.Mesh(new T3.CylinderGeometry(2.4, 3, -b, 10), lam(pole)); p.position.set(0, b / 2, -5); h.add(p); const bs = new T3.Mesh(new T3.CylinderGeometry(22, 24, 4, 24), lam(pole)); bs.position.set(0, b + 2, -5); h.add(bs); const mo = new T3.Mesh(new T3.CylinderGeometry(7, 7, 14, 16).rotateX(Math.PI / 2), lam(pole)); mo.position.set(0, 0, -9); h.add(mo); shad(new V(G.p.x, G.gy, G.p.z), 24); }
      const ang = (t) => spd * t; L.spin.push({ s, o: rot, ang });
      OB.push({ s, th: 2.2, kind, hit: (x, y, t) => { const r = Math.hypot(x, y); if (r < hub + RKF) return true; if (pole && Math.abs(x) < 3 + RKF && y < 0) return true; if (r > R + RKF) return false;
        let ph = Math.atan2(y, x) - ang(t); for (let k = 0; k < nb; k++) { let d = ph - k * 6.2832 / nb; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < bw / 2 + RKF / Math.max(r, 1)) return true; } return false; } }); };
    // UNE BARRE QUI TOURNE autour d'un clou (regle, crayon, fouet) : on passe quand elle n'est pas devant soi
    const rotor = (w, cx, cy, len, th, spd, ph, kind, build) => { const s = sAt(w), h = hold(s), pv = new T3.Group(); pv.position.set(cx, cy, 0); h.add(pv); const P = []; build(P, len, th); pv.add(bake(P));
      const pin = new T3.Mesh(new T3.CylinderGeometry(2, 2, 8, 12).rotateX(Math.PI / 2), lam('#e8302a')); pin.position.set(cx, cy, 0); h.add(pin); const ang = (t) => spd * t + ph; L.spin.push({ s, o: pv, ang });
      OB.push({ s, th: th / 2 + 1.5, kind, hit: (x, y, t) => { const a = ang(t), dx = x - cx, dy = y - cy, al = dx * Math.cos(a) + dy * Math.sin(a), pe = -dx * Math.sin(a) + dy * Math.cos(a); return Math.abs(al) < len / 2 + RKF && Math.abs(pe) < th / 2 + RKF; } }); };
    // UNE BOUCLE DE CIRCUIT ORANGE sur son pied : on passe DEDANS (boost) ; l'anneau est dur
    L.loops = []; const loop = (w, gx, gy, R) => { const s = sAt(w), h = hold(s), G = ground(s, gx), b = G.gy - G.F.p.y;
      const m = new T3.Mesh(new T3.TorusGeometry(R, 1.6, 10, 48), lam('#ff7a1a', { emissive: '#4a1a04' })); m.scale.z = 3; m.position.set(gx, gy, 0); h.add(m); if (gy - R > b + 1) { const p = new T3.Mesh(new T3.CylinderGeometry(1.8, 2.4, gy - R - b, 8), lam('#ff7a1a')); p.position.set(gx, (gy - R + b) / 2, 0); h.add(p); }
      const gw = glowS(R * 2.4, '#ffb040', 0.3); gw.position.set(gx, gy, 0); h.add(gw); shad(new V(G.p.x, G.gy, G.p.z), 8); L.loops.push({ s, gx, cy: gy, R, done: false, m });
      OB.push({ s, th: 2.6, kind: 'boucle', hit: (x, y) => Math.abs(Math.hypot(x - gx, y - gy) - R) < 1.6 + RKF }); };
    // LE PETIT TRAIN qui traverse la voie (locomotive et deux wagons, aller-retour)
    L.trains = []; const train = (w, per) => { const s = sAt(w), h = hold(s), G = ground(s, 0), b = G.gy - G.F.p.y, P = [], tg = new T3.Group();
      P.push({ g: SB(22, 7, 8), c: '#e8302a', p: [0, b + 5.5, 0] }, { g: SB(8, 6, 8.4), c: '#2a6ad8', p: [-6, b + 12, 0] }, { g: CYG(1.6, 2.2, 6, 10), c: '#1e2026', p: [7, b + 12, 0] }, { g: SB(9, 1, 9), c: '#f2c41a', p: [-6, b + 15.3, 0] });
      for (const [x0, c] of [[-22, '#f2c41a'], [-42, '#2a9a4a']]) { P.push({ g: SB(17, 6, 8), c, p: [x0, b + 5, 0] }); for (let k = 0; k < 2; k++) cube(P, x0 - 4 + k * 8, b + 8, 0, 5, 0.2, TOYC[k + 4]); }
      for (const x of [-48, -37, -27, -16, -8, 6]) for (const dz of [-4.3, 4.3]) P.push({ g: new T3.CylinderGeometry(2.2, 2.2, 1, 14), c: '#1e2026', p: [x, b + 2.2, dz], r: [Math.PI / 2, 0, 0] });
      tg.add(bake(P)); h.add(tg); const tx = (t) => { const f = ((t / per) % 1 + 1) % 1, k = f < 0.5 ? f * 2 : 2 - f * 2; return -110 + 220 * ss(0, 1, k); };
      OB.push({ s, th: 5, kind: 'train', upd: (t) => { const x = tx(t), dir = Math.sign(tx(t + 0.05) - x) || 1; tg.position.x = x; tg.scale.x = dir; }, hit: (x, y, t) => { const c = tx(t), dir = Math.sign(tx(t + 0.05) - c) || 1; return y < b + 16 - FORG && (x - c) * dir > -52 && (x - c) * dir < 12; } }); };
    // UNE CLOISON DE PORTE (couloir) d'un mur a l'autre, du sol au plafond, avec UNE porte ouverte encadree (gx, gy : centre ; gw, gh : taille)
    const door = (w, gx, gy, gw, gh, col) => { const s = sAt(w), h = hold(s), F = PA.fr(s), G0 = ground(s, 0), b = G0.gy - G0.F.p.y - 1, top = PA.O.y + CEIL - F.p.y, P = [], x0 = gx - gw / 2, x1 = gx + gw / 2, y0 = gy - gh / 2, y1 = gy + gh / 2;
      P.push({ g: SB(x0 + 110, top - b, 4), c: col, p: [(x0 - 110) / 2, (top + b) / 2, 0] }, { g: SB(110 - x1, top - b, 4), c: col, p: [(x1 + 110) / 2, (top + b) / 2, 0] }, { g: SB(gw, top - y1, 4), c: col, p: [gx, (top + y1) / 2, 0] }, { g: SB(gw, y0 - b, 4), c: col, p: [gx, (y0 + b) / 2, 0] });
      P.push({ g: SB(gw * 0.95, gh, 2), c: '#c89a64', p: [x0 - gw * 0.42, gy, -gw * 0.3], r: [0, -0.9, 0] }); h.add(bake(P)); frameAt(h, x0, x1, y0, y1);
      OB.push({ s, th: 2.4, kind: 'porte', hit: (x, y) => !(x > x0 + RKF && x < x1 - RKF && y > y0 + RKF && y < y1 - RKF) }); };
    // UNE BALLE REBONDISSANTE (rayee) qui saute sur place
    const ball = (w, bx, R, Hb, per, ph) => { const s = sAt(w), h = hold(s), G = ground(s, bx), b = G.gy - G.F.p.y, m = new T3.Group(); h.add(m);
      for (let k = 0; k < 4; k++) m.add(new T3.Mesh(new T3.SphereGeometry(R, 18, 12, k / 4 * 6.283, 6.283 / 4), lam(['#e8302a', '#f2c41a', '#2a6ad8', '#f4f2ec'][(k + Math.round(bx)) & 3])));
      const sh = new T3.Mesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#2a2018' })); sh.position.set(bx, b + 0.3, 0); h.add(sh);
      const yAt = (t) => b + R + Hb * Math.abs(Math.sin(Math.PI * (t / per) + ph));
      OB.push({ s, th: R + 0.5, kind: 'balle', upd: (t) => { const y = yAt(t); m.position.set(bx, y, 0); m.rotation.z = t * 2; sh.scale.setScalar(R * (1.3 - 0.6 * (y - b - R) / Hb)); }, hit: (x, y, t) => Math.hypot(x - bx, y - yAt(t)) < R + RKF }); };
    // LE BALANCIER D'UNE GRANDE HORLOGE (couloir) : pendu tout en haut, un grand disque de laiton qui balaie le couloir
    const pendulum = (w, bx, amp, wv, ph) => { const s = sAt(w), h = hold(s), F = PA.fr(s), top = PA.O.y + CEIL - 8 - F.p.y, Lr = top, pv = new T3.Group(); pv.position.set(bx, top, 0); h.add(pv);
      const rod = new T3.Mesh(new T3.BoxGeometry(1.4, Lr - 14, 1.4, 1, nseg(Lr), 1), M.brass); rod.position.y = -(Lr - 14) / 2; pv.add(rod); const disc = new T3.Mesh(new T3.CylinderGeometry(14, 14, 3, 32).rotateX(Math.PI / 2), M.brass); disc.position.y = -Lr; pv.add(disc);
      const ring = new T3.Mesh(new T3.TorusGeometry(14, 1.2, 8, 32), lam('#8a6a2a')); ring.position.y = -Lr; pv.add(ring); const box = new T3.Mesh(new T3.BoxGeometry(30, 16, 12), lam('#6a4428')); box.position.set(bx, top + 4, 0); h.add(box);
      const ang = (t) => amp * Math.sin(wv * t + ph);
      OB.push({ s, th: 3, kind: 'balancier', upd: (t) => { pv.rotation.z = ang(t); }, hit: (x, y, t) => { const a = ang(t), cx = bx + Math.sin(a) * Lr, cy = top - Math.cos(a) * Lr; if (Math.hypot(x - cx, y - cy) < 14 + RKF) return true; return y > cy && Math.abs(x - (bx + Math.sin(a) * (top - y))) < 0.7 + RKF; } }); };
    // UNE BARRIERE D'ENFANT (barreaux blancs serres) du sol au plafond du couloir, un seul battant ouvert (encadre)
    const gate = (w, gx, gap, top) => { const s = sAt(w), h = hold(s), G0 = ground(s, 0), b = G0.gy - G0.F.p.y, P = [];
      for (let x = -110; x <= 110; x += 3.4) { if (Math.abs(x - gx) < gap / 2 + 1) continue; P.push({ g: CYG(0.8, 0.8, top - b, 8), c: '#f6f6f2', p: [x, (top + b) / 2, 0] }); }
      for (const y of [b + 2, top]) P.push({ g: SB(220, 2.4, 2.4), c: '#f6f6f2', p: [0, y, 0] }); h.add(bake(P)); frameAt(h, gx - gap / 2, gx + gap / 2, b + 3.2, top - 1.2); shad(new V().copy(G0.p).setY(G0.gy), 20);
      OB.push({ s, th: 1.4, kind: 'barriere', hit: (x, y) => !(Math.abs(x - gx) < gap / 2 - RKF) && y < top + 1 }); };
    // UNE CHAISE de cuisine (sous la table) : pieds en x0 et x1, profondeur 60 m, un barreau bas devant (hauteur rh au-dessus du sol), un dossier
    const leg = (P, x, b, top, r) => { P.push({ g: SB(r * 2, top - b, r * 2), c: '#9a6a40', p: [x, (top + b) / 2, 0] }); };
    const posts = (w, list, kind, mk, sway) => { const s = sAt(w), h = hold(s), xs = []; for (const [x, r, hh] of list) { const G = ground(s, x), b = G.gy - G.F.p.y, top = b + hh, P = [], piv = new T3.Group(); piv.position.set(x, b, 0); h.add(piv); mk(P, 0, 0, hh, r); piv.add(bake(P)); xs.push({ x, r, b, top, piv, ph: rr(0, 6) }); shad(new V(G.p.x, G.gy, G.p.z), r * 2); }
      const sw = (q, t) => (sway ? sway * Math.sin(t * 1.3 + q.ph) : 0);
      OB.push({ s, th: 4, kind, upd: sway ? (t) => { for (const q of xs) q.piv.rotation.z = sw(q, t); } : null, hit: (x, y, t) => xs.some((q) => { const xo = q.x - Math.sin(sw(q, t)) * Math.max(0, y - q.b); return Math.abs(x - xo) < q.r + RKF && y < q.top + RKF; }) }); };
    const rung = (w, x0, x1, hh) => { const s = sAt(w), h = hold(s), G = ground(s, (x0 + x1) / 2), yr = G.gy - G.F.p.y + hh, m = new T3.Mesh(new T3.CylinderGeometry(1.4, 1.4, x1 - x0, 10), M.wood); m.rotation.z = Math.PI / 2; m.position.set((x0 + x1) / 2, yr, 0); h.add(m);
      OB.push({ s, th: 2.2, kind: 'barreau', hit: (x, y) => x > x0 - RKF && x < x1 + RKF && Math.abs(y - yr) < 1.4 + RKF }); };
    const chair = (w, x0, x1, rh, back) => { const L4 = [[x0, 2.6, 67], [x1, 2.6, 67]]; posts(w, L4, 'pied', leg); posts(w + 60, L4, 'pied', leg); if (rh) rung(w, x0, x1, rh);
      const s = sAt(w), h = hold(s), G = ground(s, (x0 + x1) / 2), b = G.gy - G.F.p.y, P = []; P.push({ g: SB(x1 - x0 + 8, 4, 68), c: '#b07c4c', p: [(x0 + x1) / 2, b + 69, -30] });
      if (back) { for (const x of [x0, x1]) P.push({ g: SB(5, 80, 5), c: '#9a6a40', p: [x, b + 110, back > 0 ? 0 : -60] }); for (let k = 0; k < 3; k++) P.push({ g: SB(x1 - x0, 6, 3), c: '#b07c4c', p: [(x0 + x1) / 2, b + 95 + k * 20, back > 0 ? 0 : -60] }); }
      h.add(bake(P)); };
    // UN PISTON en rythme (tartines du grille-pain, diable a ressort) : une boite fixe et une piece qui jaillit entre y0 et y1
    const piston = (w, px, half, boxH, pop, per, ph, kind, cols) => { const s = sAt(w), h = hold(s), G = ground(s, px), b = G.gy - G.F.p.y, P = [], mv = new T3.Group(); h.add(mv);
      P.push({ g: SB(half * 2, boxH, 26), c: cols[0], p: [px, b + boxH / 2, 0] }); h.add(bake(P)); shad(new V(G.p.x, G.gy, G.p.z), half * 1.3);
      const Q = []; if (kind === 'tartine') { for (const dz of [-5, 5]) Q.push({ g: SB(half * 1.5, 26, 3.6), c: '#d8a058', p: [0, 13, dz] }, { g: SB(half * 1.5 - 1.6, 24.4, 3.8), c: '#f4e0b0', p: [0, 13, dz] }); } else { for (let k = 0; k < 6; k++) Q.push({ g: new T3.TorusGeometry(4, 0.8, 6, 16), c: '#9aa4ae', p: [0, -k * 4.5, 0], r: [Math.PI / 2, 0, 0] }); Q.push({ g: new T3.SphereGeometry(11, 18, 12), c: cols[1], p: [0, 11, 0] }, { g: new T3.ConeGeometry(9, 14, 12), c: cols[2], p: [0, 26, 0] }); for (const sx of [-1, 1]) Q.push({ g: new T3.SphereGeometry(2, 8, 6), c: '#1e2026', p: [sx * 4, 13, 10] }); }
      mv.add(bake(Q)); mv.position.x = px; const ext = (t) => { const f = (((t + ph) / per) % 1 + 1) % 1; return pop * (f < 0.15 ? ss(0, 0.15, f) : f < 0.55 ? 1 : 1 - ss(0.55, 0.75, f)); };
      const topY = kind === 'tartine' ? 26 : 34;
      OB.push({ s, th: 13, kind, upd: (t) => { mv.position.y = b + boxH - (kind === 'tartine' ? 26 : 36) + ext(t); }, hit: (x, y, t) => { if (Math.abs(x - px) < half + RKF && y < b + boxH + RKF) return true; const y1 = b + boxH - (kind === 'tartine' ? 26 : 36) + ext(t) + topY; return Math.abs(x - px) < half * (kind === 'tartine' ? 0.75 : 0.55) + RKF && y < y1 + RKF; } }); };
    // UN JET D'ARROSAGE qui jaillit de l'herbe en rythme
    L.jets = []; const jet = (w, x, per, ph) => { const s = sAt(w), h = hold(s), G = ground(s, x), b = G.gy - G.F.p.y, top = 90, m = new T3.Mesh(new T3.CylinderGeometry(3, 4.2, 1, 14, 6, true), new T3.MeshBasicMaterial({ map: L.wTex, transparent: true, opacity: 0.9, side: T3.DoubleSide, depthWrite: false }));
      m.position.set(x, b, 0); h.add(m); const nz = new T3.Mesh(new T3.CylinderGeometry(3, 4, 4, 12), lam('#2a9a4a')); nz.position.set(x, b + 1.5, 0); h.add(nz); const ring = new T3.Mesh(new T3.TorusGeometry(6, 0.8, 6, 20), M.frame); ring.rotation.x = Math.PI / 2; ring.position.set(x, b + 0.8, 0); h.add(ring); shad(new V(G.p.x, G.gy, G.p.z), 5);
      const phase = (t) => (((t + ph) / per) % 1 + 1) % 1; const J = { s, x, b, top, m, phase, last: -1 }; L.jets.push(J);
      OB.push({ s, th: 4.5, kind: 'jet', hit: (px, py, t) => { const f = phase(t); return f > 0.57 && f < 0.93 && Math.abs(px - x) < 3.6 + RKF && py < top; } }); };
    const cubeTower = (P, x, b, top) => { let y = b, k = 0; while (y < top) { cube(P, x, y, 0, 12, rr(-0.1, 0.1), TOYC[(k * 3 + Math.round(top)) % 7]); y += 12; k++; } };
    const stem = (P, x, b, top, r) => { P.push({ g: CYG(r, r * 1.2, top - b, 10), c: '#4a8a2c', p: [x, (top + b) / 2, 0] }); P.push({ g: lumpGeo(12, 1.4, 6, x, 1, 0.1), c: '#5a9a34', p: [x + 10, b + (top - b) * 0.35, 0], r: [0, 0.4, -0.4] });
      P.push({ g: new T3.CylinderGeometry(15, 15, 4, 24), c: '#5a3a1e', p: [x, top + 6, 0], r: [Math.PI / 2 - 0.3, 0, 0] }); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; P.push({ g: new T3.SphereGeometry(5, 8, 6), c: '#f2c41a', p: [x + Math.cos(a) * 20, top + 6 + Math.sin(a) * 19, -Math.sin(a) * 5], s: [1.6, 0.5, 0.25], r: [0.3, 0, a] }); } };
    const ruler = (P, len, th) => { P.push({ g: SB(len, th, 2), c: '#f2d23a', p: [0, 0, 0] }); for (let k = -Math.floor(len / 8); k <= Math.floor(len / 8); k++) P.push({ g: SB(0.5, k % 5 ? th * 0.25 : th * 0.5, 0.3), c: '#1e2026', p: [k * 4, th / 2 - (k % 5 ? th * 0.125 : th * 0.25), 1.1] }); };
    const pencils = (P, len) => { for (const sd of [-1, 1]) pencil(P, sd * len / 4, 0, 0, len / 2, sd > 0 ? '#2a6ad8' : '#e8302a', [0, 0, sd * Math.PI / 2], 2.6); };
    const whisk = (P, len, th) => { for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) P.push({ g: new T3.TorusGeometry(len / 4, 0.5, 6, 20, Math.PI), c: '#c8d0d8', p: [sd * 0, 0, 0], r: [0, k * Math.PI / 4, sd > 0 ? -Math.PI / 2 : Math.PI / 2], s: [1, 1, 1] }); P.push({ g: SB(len * 0.1, th, th), c: '#e8302a', p: [0, 0, 0] }); };
    const rocketTail = 0;
    // ---------- le parcours ----------
    // la chambre : deux murs de briques a trou, sous le lit (piles etroites), le crayon-helice, LE GRAND VENTILATEUR, un dernier mur
    brickWall(620, -24, 14, 30, 26, '#e8302a', '#b82420', 60, 66);
    piles(830, [-24, 8], 44); piles(930, [-10, 22], 44); piles(1030, [-22, 22], 44);
    rotor(1340, 0, 0, 150, 5, 0.9, 0, 'crayon', pencils);
    fan(1450, 3, 92, 0.75, 1.0, ['#5ab0d8', '#5ab0d8', '#5ab0d8'], 'ventilo', '#f4f2ec');
    brickWall(1600, 22, 30, 30, 26, '#2a6ad8', '#1e4ea8', 60, 66);
    // la salle de jeux : les boucles en S au ras du tapis, le diable a ressort, la regle qui tourne, le train, les tours de cubes qui oscillent
    loop(1960, 0, 0, 20); loop(2010, -10, 4, 20); loop(2060, 0, 0, 20); loop(2110, 10, 4, 20); loop(2150, 0, 0, 20);
    { const s = sAt(1108), h = hold(s), G = ground(s, 0), b = G.gy - G.F.p.y; frameAt(h, -60, 60, b + 1.5, b + 56); }
    piston(2290, -14, 15, 30, 120, 2.2, 0, 'diable', ['#e8302a', '#f2c41a', '#2a6ad8']); piston(2290, 26, 15, 30, 120, 2.2, 1.1, 'diable', ['#2a9a4a', '#ff7a1a', '#9a4ad8']);
    rotor(2420, 0, 0, 170, 9, 0.75, 0.6, 'regle', ruler);
    train(2620, 8);
    posts(2700, [[-30, 6.4, 200], [8, 6.4, 200], [44, 6.4, 200]], 'tour', cubeTower, 0.05); posts(2760, [[-12, 6.4, 220], [26, 6.4, 220]], 'tour', cubeTower, 0.05);
    // le couloir : portes, balanciers, balles, barriere, en montant et en descendant
    door(3000, 22, -10, 30, 34, '#e6d8bc'); pendulum(3150, 0, 0.14, 1.25, 0); ball(3230, -18, 11, 120, 1.6, 0); ball(3245, 18, 11, 120, 1.8, 1.2);
    gate(3300, -20, 18, 150); pendulum(3450, 0, 0.15, 1.4, 1.5); ball(3520, 0, 12, 140, 1.7, 0.6); door(3600, -18, 24, 30, 34, '#e6d8bc');
    // la cuisine : sous la table entre les chaises ; le plan de travail (grille-pain, fouet du batteur, pots d'epices)
    chair(3880, -16, 15, 8, 1); chair(4010, -6, 26, 16, 0); chair(4140, -26, 4, 0, 0); chair(4250, -14, 17, 6, -1);
    piston(4640, 6, 10, 22, 34, 1.9, 0, 'tartine', ['#c8d0d8']); rotor(4740, 0, 4, 54, 4, 2.2, 0, 'fouet', whisk);
    posts(4840, [[-12, 4.5, 30], [14, 4.5, 24]], 'pot', (P, x, b, top, r) => { P.push({ g: CYG(r, r, top - 4, 16), c: '#f4f0e4', p: [x, (top - 4) / 2, 0] }, { g: CYG(r * 1.05, r * 1.05, 4, 16), c: '#e8302a', p: [x, top - 2, 0] }); });
    // le jardin : les jets d'arrosage, le moulin a vent, les tiges de tournesol qui ondulent
    L.wTex = waterTex(); jet(5680, -20, 2.2, 0); jet(5700, 22, 2.2, 0.9); jet(5730, 0, 2.0, 0.4); jet(5760, -30, 2.2, 1.4);
    fan(5900, 4, 88, 0.6, 1.3, ['#e8302a', '#f2c41a', '#2a6ad8', '#2a9a4a'], 'moulin', '#c8a070');
    posts(5800, [[-34, 3, 190], [10, 3, 230], [40, 3, 200]], 'tige', stem, 0.03);
    L.OB = OB;
    // les ANNEAUX A LANCER (montee vers la fenetre, jardin) : un elan et un peu de carburant
    L.boostR = []; const RG = new T3.TorusGeometry(7, 1.2, 10, 32);
    for (const [w, x, y, c] of [[5050, 0, 6, '#e8302a'], [5140, -14, -6, '#2a6ad8'], [5230, 14, 6, '#f2c41a'], [5320, 0, 0, '#2a9a4a'], [5520, 10, -6, '#9a4ad8'], [6100, -20, 10, '#ff7a1a']]) { const s = sAt(w), h = hold(s), m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(RG, lam(c, { emissive: c, emissiveIntensity: 0.35 }))); m.add(glowS(20, '#ffe08a', 0.45)); L.boostR.push({ s, x, y, m, done: false }); }
    // l'ARRIVEE : une arche a damier de course de jouets
    { const s = PA.len - 70, h = hold(s), P = []; for (const sd of [-1, 1]) P.push({ g: SB(4, 140, 4), c: '#f4f2ec', p: [sd * 66, -10, 0] }); for (let k = 0; k < 38; k++) for (let j = 0; j < 2; j++) P.push({ g: SB(3.5, 3.5, 1), c: (k + j) % 2 ? '#1e2026' : '#f4f2ec', p: [-64.75 + k * 3.5, 56 + j * 3.5, 0] }); h.add(bake(P));
      for (const sd of [-1, 1]) { const gw = glowS(50, '#fff0a0', 0.5); gw.position.set(sd * 66, 58, 0); h.add(gw); } }
    // les DOMINOS geants de la salle de jeux, de part et d'autre de la voie : ils tombent en vague quand on passe
    L.dom = []; { const dg = new T3.BoxGeometry(16, 34, 5).translate(0, 17, 0), dm = lam('#1e2026'), lg = new T3.BoxGeometry(14, 1.2, 5.2).translate(0, 17, 0), lm = lam('#f4f2ec');
      for (let w = 2160; w < 2290; w += 9) for (const sd of [-1, 1]) { const u = pathU(w) + sd * 80, p = atUW(u, w), o = new T3.Group(); o.position.copy(p); o.rotation.y = L.HGry; const d = new T3.Mesh(dg, dm); d.add(new T3.Mesh(lg, lm)); o.add(d); grp.add(o); shad(p, 6); L.dom.push({ o, d, s: sAt(w), f: 0 }); } }
  }

  // ============================== LES ENNEMIS : avions en papier (on fonce dedans), flechettes a ventouse (on les evite) ==============================
  function planeMesh(big) {
    const g = new T3.Group(), k = big ? 1.5 : 1, col = big ? '#ffd04a' : '#f6f6f2', mat = lam(col, { side: T3.DoubleSide, emissive: big ? '#3a2a06' : '#202020' });
    for (const sd of [-1, 1]) { const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute([0, 0, 4.6 * k, sd * 3.6 * k, 0.9 * k, -3.4 * k, 0, 0, -3.4 * k, 0, 0, 4.6 * k, 0, -1.5 * k, -3.4 * k, 0, 0, -3.4 * k], 3)); geo.computeVertexNormals(); g.add(new T3.Mesh(geo, mat)); }
    for (const sd of [-1, 1]) { const st = new T3.Mesh(new T3.BoxGeometry(0.6 * k, 0.05, 2.6 * k), lam(big ? '#e8302a' : '#2a6ad8')); st.position.set(sd * 2.1 * k, 0.55 * k, -1.8 * k); st.rotation.z = sd * 0.25; g.add(st); }
    const gw = glowS(big ? 11 : 8, '#ffffff', 0.25); g.add(gw); g.userData = { plane: true }; return g;
  }
  function enemies(g, PA, grp) {
    L.sent = []; L.chase = []; L.bul = []; const sAt = (w) => PA.sAtW(w);
    const sent = (w, x, y, big) => { const m = planeMesh(big); grp.add(m); L.sent.push({ s: sAt(w), x, y, m, alive: true, fT: rr(0.8, 2), ph: rr(0, 6), big }); };
    for (const [w, x, y] of [[400, -20, 10], [480, 25, -5], [560, 0, 15], [1200, 30, 10], [1380, -30, 20], [1530, 20, -15], [1880, -30, 20], [2230, 40, 30], [2360, -40, 10], [2520, 30, -20], [2680, -20, 30], [2850, 0, 20],
      [3080, -20, 30], [3380, 25, -30], [3560, -15, 20], [5000, -20, 10], [5180, 20, -10], [5300, -10, 15], [5600, -30, 20], [5850, 40, 30], [6050, -30, -10]]) sent(w, x, y, false);
    for (const [w, x, y] of [[2000, -30, 30], [5950, 30, 20]]) sent(w, x, y, true);
    for (const [a, b, n] of [[sAt(1800), sAt(2550), 2], [sAt(5450), sAt(5900), 2]]) for (let k = 0; k < n; k++) { const m = planeMesh(false); m.visible = false; grp.add(m); L.chase.push({ a, b, k, n, m, ds: 260, fT: 1 + k * 0.6, ph: k * 2.1, on: false, x: 0, y: 0 }); }
    // les flechettes a ventouse : tige orange, ventouse rouge devant, plumes derriere
    const dB = new T3.CylinderGeometry(0.22, 0.22, 2.4, 8).rotateX(Math.PI / 2), dC = new T3.CylinderGeometry(0.75, 0.25, 0.45, 12).rotateX(Math.PI / 2).translate(0, 0, 1.4), dF = new T3.BoxGeometry(0.06, 0.8, 0.8).translate(0, 0, -1.1), dF2 = new T3.BoxGeometry(0.8, 0.06, 0.8).translate(0, 0, -1.1);
    const mO = lam('#ff7a1a', { emissive: '#3a1404' }), mR = lam('#e8302a', { emissive: '#3a0604' }), mF = lam('#2a9a4a');
    for (let i = 0; i < 24; i++) { const m = new T3.Group(), body = new T3.Group(); m.add(body); body.add(new T3.Mesh(dB, mO)); body.add(new T3.Mesh(dC, mR)); body.add(new T3.Mesh(dF, mF)); body.add(new T3.Mesh(dF2, mF));
      m.visible = false; grp.add(m); L.bul.push({ m, body, on: false, s: 0, x: 0, y: 0, vs: 0, vx: 0, vy: 0, t: 0 }); }
  }
  const fire = (g, s, x, y) => { const b = L.bul.find((q) => !q.on); if (!b) return; const vs = -18, tau = Math.max(0.6, (s - L.s) / Math.max(20, L.v - vs)), a = rr(0, 6.28), off = Math.random() < 0.2 ? rr(0.6, 1.6) : rr(2.6, 5);
    Object.assign(b, { on: true, s, x, y, vs, vx: (L.x + Math.cos(a) * off - x) / tau, vy: (L.y + Math.sin(a) * off - y) / tau, t: 0 }); b.m.visible = true; g.audio.play('whoosh'); };
  const missileHit = (g, rk) => { rk.vel.multiplyScalar(0.75); L.inv = 0.6; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); burst(rk.pos.clone(), '#ff8a4a', 0.4); g.audio.play('boomSmall', rk.pos); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.2; g.flashColor = '#ffb070'; (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' }); };
  // un ennemi detruit : comme au niveau 1 (ondes de choc, eclats, fumee, ralenti tres court) + des confettis
  function killFx(g, rk, p, big) { const fx = g.effects, up = new V(0, 1, 0), vel = rk.vel ? rk.vel.clone() : new V(0, 0, -30), c = p.clone();
    fx.explosion(c, null, true, 'orange'); fx.ring(c, up, 2, 26, 0.6, '#ffd060', 0.95); fx.ring(c, vel.clone().normalize(), 1, 20, 0.5, '#ffffff', 0.85); fx.flash(c, '#ffb040', 8, 90, 0.35, '#ff5020');
    g.hitStop = 0.09; g.hitScale = 0.18; const sz = new V(5, 5, 1); fx.shatter(c, sz, vel, 'planks'); fx.shatter(c, sz.clone().multiplyScalar(0.8), vel.clone().multiplyScalar(1.3), 'planks');
    burst(c, FWC[Math.floor(Math.random() * FWC.length)], big ? 0.9 : 0.6); g.audio.play('boom'); g.audio.play('target'); g.rig.shake = Math.max(g.rig.shake, 0.9); g.flash = 0.18; g.flashColor = '#ffd090'; }
  function play(g, rk, dt, s0) {
    const t = L.t;
    for (const d of L.sent) { if (!d.alive) continue; const ds = d.s - L.s;
      if (ds > 40 && ds < 200) { d.fT -= dt; if (d.fT <= 0) { d.fT = 2.0; fire(g, d.s, d.x, d.y); } }
      if (d.s >= s0 - 3 && d.s <= L.s + 3 && Math.hypot(L.x - d.x, L.y - d.y) < (d.big ? 6 : 4.6)) { d.alive = false; d.m.visible = false; const p = d.m.position.clone(); killFx(g, rk, p, d.big);
        const ev = g.evo, S = EVO.save(g), c = Math.round((d.big ? 140 : 90) * EVO.mult(S.cm) * (EVO.COIN_K || 1)); if (ev) { ev.kills++; ev.coins += c; } if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + (d.big ? 1.2 : 0.7));
        (g.killPops = g.killPops || []).push({ p: p.clone(), t0: performance.now(), txt: '+' + c }); } }
    { const HINT = { brique: 'PASSE PAR LE TROU JAUNE', livres: 'PASSE ENTRE LES PILES (LES VEILLEUSES)', boucle: 'PASSE DANS LES BOUCLES : BOOST !', crayon: 'LE CRAYON TOURNE : PASSE DANS LE VIDE', ventilo: 'PASSE ENTRE LES PALES !', diable: 'ATTENTION AUX DIABLES A RESSORT', regle: 'LA REGLE TOURNE : PASSE DANS LE VIDE', train: 'LE TRAIN ! PASSE AU-DESSUS', tour: 'LES TOURS BALANCENT : PASSE ENTRE', porte: 'VISE LA PORTE JAUNE', balancier: 'PASSE QUAND LE BALANCIER S ECARTE', balle: 'ATTENTION AUX BALLES', barriere: 'PASSE PAR LE BATTANT OUVERT', pied: 'PASSE ENTRE LES PIEDS DES CHAISES', barreau: 'PASSE AU-DESSUS OU EN DESSOUS DU BARREAU', tartine: 'LE GRILLE-PAIN ! ATTENTION AUX TARTINES', ilot: 'MONTE SUR L ILOT DE CUISINE', tete: 'SORS PAR DESSOUS LA TETE DE LIT', fouet: 'LE FOUET TOURNE !', pot: 'PASSE ENTRE LES POTS', jet: 'PASSE ENTRE DEUX JETS D EAU', moulin: 'PASSE ENTRE LES AILES DU MOULIN', tige: 'PASSE ENTRE LES TIGES' }; L.seen = L.seen || {};
      if (!L.hintT || L.t > L.hintT) { for (const o of L.O) { const ds = o.s - L.s; if (ds > 60 && ds < 170 && HINT[o.kind] && !L.seen[o.kind]) { L.seen[o.kind] = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, HINT[o.kind], 2.2, o.kind === 'boucle' ? '#ffd27a' : '#ffffff'); break; } }
        if (!L.seen.plane) { const d = L.sent.find((q) => q.alive && q.s - L.s > 50 && q.s - L.s < 200); if (d) { L.seen.plane = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, 'AVION EN PAPIER : FONCE DEDANS !', 2.4, '#ff6a5a'); } } } }
    // les boucles enfilees : un elan, un peu de carburant
    for (const T of L.loops) { if (T.done || T.s < s0 - 1 || T.s > L.s + 1) continue; T.done = true; if (Math.hypot(L.x - T.gx, L.y - T.cy) < T.R - 1) { L.boostT = Math.max(L.boostT, 1.4); L.tN = (L.tN || 0) + 1; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 0.6); g.audio.play('whoosh'); g.audio.play('boostOn'); if (g.feed) g.feed('BOUCLE ' + L.tN + '/' + L.loops.length, '#ffd27a'); burst(rk.pos.clone().addScaledVector(rk.fwd, 20).add(_b.set(0, 6, 0)), '#ffb040', 0.6, 'ring'); } }
    bossPlay(g, rk, dt);
    for (const c of L.chase) { const on = L.s > c.a && L.s < c.b; if (on && !c.on) { c.on = true; c.ds = 260; c.m.visible = true; if (c.k === 0) { if (CC.L1) CC.L1.msg(g, 'AVIONS EN PAPIER EN APPROCHE !', 2, '#ff6a5a'); g.audio.play('alarm'); } }
      if (!c.on) continue; const want = on ? 46 + c.k * 12 + 6 * Math.sin(t * 0.7 + c.ph) : 420; c.ds += (want - c.ds) * Math.min(1, dt * (on ? 1.4 : 0.6));
      c.x = Math.cos(t * 0.55 + c.ph) * (10 + 6 * Math.sin(t * 0.3 + c.k)); c.y = 4 + Math.sin(t * 0.7 + c.ph * 1.3) * 8;
      if (on && c.ds < 90) { c.fT -= dt; if (c.fT <= 0) { c.fT = 1.7 + c.n * 0.25; fire(g, L.s + c.ds, c.x, c.y); } }
      if (!on && c.ds > 400) { c.on = false; c.m.visible = false; } }
    for (const b of L.bul) { if (!b.on) continue; b.t += dt; b.s += b.vs * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > 4 || b.s < L.s - 20) { b.on = false; b.m.visible = false; continue; }
      if (Math.abs(b.s - L.s) < 2 && Math.hypot(b.x - L.x, b.y - L.y) < 1.3 && L.inv <= 0) { b.on = false; b.m.visible = false; missileHit(g, rk); } }
    for (const B of L.boostR) { if (B.done || B.s < s0 - 1 || B.s > L.s + 1) continue; B.done = true; if (Math.hypot(L.x - B.x, L.y - B.y) < 5.4) { L.boostT = 2.6; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 1); g.audio.play('boostOn'); g.audio.play('whoosh'); if (g.feed) g.feed('BOOST !', '#ffc23a'); g.flash = 0.15; g.flashColor = '#ffe08a'; burst(B.m.getWorldPosition(new V()), '#ffd04a', 0.5); } }
  }
  const _o7 = new T3.Object3D(), _zA = new V(0, 0, 1);
  function animate(g, dt) {
    const PA = L.PA, t = L.t;
    for (const o of L.OB) if (o.upd && Math.abs(o.s - L.s) < 700) o.upd(t);
    // les jets d'arrosage : un filet (alerte), puis la colonne d'eau jaillit
    for (const J of L.jets) { if (Math.abs(J.s - L.s) > 600) continue; const f = J.phase(t), up = f > 0.55 && f < 0.95, warn = f > 0.4 && f <= 0.55, hh = up ? (J.top - J.b) * ss(0.55, 0.62, f) * (1 - ss(0.9, 0.95, f)) : warn ? 4 + 3 * Math.sin(t * 30) : 0.01;
      J.m.scale.set(up ? 1 : 0.4, Math.max(0.01, hh), up ? 1 : 0.4); J.m.position.y = J.b + hh / 2; J.m.visible = hh > 0.05;
      const cyc = Math.floor((t + 0) / 1); if (up && f < 0.6 && Math.abs(J.s - L.s) < 200 && J.last !== Math.floor((t) / 0.5)) { J.last = Math.floor(t / 0.5); g.effects.smokePuff(placeAt(PA, _o7, J.s, J.x, J.top - 6).position.clone(), new V(rr(-3, 3), rr(-2, 3), rr(-3, 3)), 5, 1.2); } }
    for (const d of L.sent) { const near = d.alive && d.s - L.s < 330 && d.s - L.s > -80; d.m.visible = near; if (!near) continue; placeAt(PA, d.m, d.s, d.x + Math.sin(t * 0.9 + d.ph) * 1.2, d.y + Math.sin(t * 1.4 + d.ph) * 1.0); d.m.rotateZ(Math.sin(t * 1.1 + d.ph) * 0.35); d.m.rotateX(Math.sin(t * 1.7 + d.ph) * 0.12); }
    for (const c of L.chase) if (c.on) { placeAt(PA, c.m, L.s + c.ds, c.x, c.y); c.m.rotateZ(Math.sin(t * 1.2 + c.ph) * 0.5); }
    for (const b of L.bul) if (b.on) { placeAt(PA, b.m, b.s, b.x, b.y); b.body.quaternion.setFromUnitVectors(_zA, _d.set(b.vx, b.vy, -b.vs).normalize()); b.body.rotateZ(L.t * 6); }
    for (const B of L.boostR) { B.m.rotation.z = t * 1.2; B.m.rotation.x = Math.sin(t * 0.9 + B.s) * 0.3; }
    for (const T of L.loops) T.m.rotation.y = Math.sin(t * 0.8 + T.s) * 0.04;
    for (const q of L.spin) if (Math.abs(q.s - L.s) < 700) q.o.rotation.z = q.ang(t);
    if (L.spinY) for (const q of L.spinY) q.o.rotation.y = t * q.v;
    for (const d of L.dom) { if (!d.f && L.started && L.s > d.s - 70) d.f = 0.001; if (d.f > 0 && d.f < 1) { d.f = Math.min(1, d.f + dt * 2.4); d.d.rotation.x = -1.42 * d.f * d.f; } }
  }

  // ============================== LE BOSS : LE ROBOT JOUET (fer blanc, bottes a reaction ; 3 coups dans la grande cible de son torse) ==============================
  function bossBuild(g, PA, grp) {
    const m = new T3.Group(), P = [], TI = '#b8c2cc', TI2 = '#8a96a2', RD = '#d8302a', YL = '#f2c41a', BL = '#2a6ad8', DK = '#1e2026';
    // le robot regarde la fusee (+z) ; il recule devant elle en volant
    P.push({ g: SB(22, 24, 14), c: TI, p: [0, 0, 0] }, { g: SB(23, 3, 15), c: RD, p: [0, -10, 0] }, { g: SB(23, 2, 15), c: RD, p: [0, 9, 0] });
    P.push({ g: SB(14, 12, 12), c: TI, p: [0, 19, 0] }, { g: SB(15, 2, 13), c: RD, p: [0, 13.5, 0] }, { g: CYG(0.5, 0.5, 9, 6), c: TI2, p: [0, 29, 0] }); pS(P, 0, 34, 0, 1.8, RD);
    for (const sx of [-1, 1]) { pC(P, sx * 3.6, 21, 6.2, 2.6, 2.6, 1, YL, 18, [Math.PI / 2, 0, 0]); pC(P, sx * 3.6, 21, 6.8, 1.2, 1.2, 0.6, DK, 12, [Math.PI / 2, 0, 0]); pC(P, sx * 8, 19, 0, 2, 2, 2, TI2, 12, [0, 0, Math.PI / 2]); }   // yeux, oreilles a boulons
    P.push({ g: SB(8, 1.2, 0.6), c: DK, p: [0, 15.8, 6.2] }); for (let k = 0; k < 5; k++) P.push({ g: SB(0.5, 1.4, 0.7), c: TI, p: [-3 + k * 1.5, 15.8, 6.3] });   // la bouche a grille
    for (const sx of [-1, 1]) { pS(P, sx * 13.5, 9, 0, 3.6, TI2); P.push({ g: SB(5, 16, 5), c: TI, p: [sx * 15, 0, 3], r: [-0.7, 0, sx * 0.25] }); P.push({ g: new T3.TorusGeometry(2.6, 1, 6, 12, Math.PI * 1.3), c: TI2, p: [sx * 17, -6, 10], r: [0, Math.PI / 2, 0] });   // bras, pinces
      P.push({ g: SB(6, 12, 6), c: TI, p: [sx * 6, -18, 0] }); P.push({ g: SB(7.5, 5, 9), c: RD, p: [sx * 6, -26, 1] }); P.push({ g: CYG(3.4, 2.2, 5, 14), c: DK, p: [sx * 6, -31, 0] }); }   // jambes, bottes a reaction
    for (let k = 0; k < 6; k++) pS(P, -9 + (k % 3) * 9, k < 3 ? 10.5 : -10.5, 7.1, 0.7, TI2);   // rivets
    m.add(bake(P)); L.bossJets = []; for (const sx of [-1, 1]) { const gw = glowS(16, '#ffb040', 0.8); gw.position.set(sx * 6, -35, 0); m.add(gw); L.bossJets.push(gw); }
    // la grande CIBLE du torse (blanc et rouge), toujours face a la fusee
    const tg = new T3.Group(); tg.position.set(0, 0, 7.2); m.add(tg); tg.add(new T3.Mesh(new T3.CircleGeometry(8.5, 40), lam('#f6f6f2', { emissive: '#3a3a3a', side: T3.DoubleSide })));
    for (const [r, w] of [[7.4, 0.8], [4.6, 0.8]]) { const o = new T3.Mesh(new T3.TorusGeometry(r, w, 8, 48), bas('#ff3a2a', { fog: false })); o.position.z = 0.2; tg.add(o); }
    { const o = new T3.Mesh(new T3.CircleGeometry(1.8, 20), bas('#ff3a2a', { fog: false, side: T3.DoubleSide })); o.position.z = 0.25; tg.add(o); }
    { const key = new T3.Group(); key.position.set(0, 0, -7.5); m.add(key); key.add(new T3.Mesh(new T3.CylinderGeometry(1, 1, 5, 8).rotateX(Math.PI / 2), lam(TI2))); for (const sx of [-1, 1]) { const w = new T3.Mesh(new T3.BoxGeometry(7, 4, 0.8), lam(YL)); w.position.set(sx * 4, 0, -3); key.add(w); } L.bossKey = key; }   // la cle de remontage dans le dos
    m.visible = false; grp.add(m);
    L.boss = { m, tg, s: 0, sT: 0, x: 0, y: 0, hp: 3, on: false, dead: false, deadT: 0, hitT: 0, fT: 2, cap: PA.len - 260, boomT: 0, s0: PA.sAtW(5980) }; if (EVO.milBoss) EVO.milBoss(g, L.boss, 7);   // v451 : vrai engin militaire geant
  }
  function bossPlay(g, rk, dt) {
    const B = L.boss; if (!B || (B.dead && B.deadT > 3.5)) return;
    if (!B.on && L.s > B.s0 - 320) { B.on = true; B.s = B.sT = B.s0; B.m.visible = true; if (CC.L1) CC.L1.msg(g, 'BOSS : FONCE DANS LA CIBLE DU ROBOT (3 COUPS)', 3, '#ff5a3a'); g.audio.play('robotAlarm'); }
    if (!B.on) return; const t = L.t;
    if (B.dead) { B.deadT += dt; B.boomT -= dt; if (B.boomT <= 0 && B.deadT < 2.6) { B.boomT = 0.16; const p = B.m.position.clone().add(new V(rr(-12, 12), rr(-20, 20), rr(-8, 8))); g.effects.explosion(p, null, false, 'orange'); burst(p, FWC[Math.floor(Math.random() * FWC.length)], 0.8); g.audio.play('boomSmall', p); }
      if (B.deadT > 2.6 && B.m.visible) { B.m.visible = false; g.flash = 0.6; g.flashColor = '#ffe0b0'; g.audio.play('boom'); g.rig.shake = 1.4; const fx = g.effects, c = B.m.position.clone(); fx.shatter(c, new V(14, 14, 8), new V(0, 10, 0), 'planks'); for (let k = 0; k < 8; k++) burst(c.clone().add(new V(rr(-30, 30), rr(0, 40), rr(-30, 30))), FWC[k % FWC.length], rr(1.2, 1.8), k % 3 === 1 ? 'ring' : null); } return; }
    B.hitT -= dt; B.s += (B.sT - B.s) * Math.min(1, dt * (B.hitT > 0 ? 2.5 : 1.2)); B.x = 28 * Math.sin(t * 0.4); B.y = 2 + 18 * Math.sin(t * 0.55);
    const capped = B.sT >= B.cap - 1, ds = B.s - L.s, ph = 3 - B.hp;
    if (ds > 45 && ds < 280) { B.fT -= dt; if (B.fT <= 0) { B.fT = [1.5, 1.15, 0.9][ph]; fire(g, B.s - 10, B.x + 17, B.y - 6); if (ph >= 1) fire(g, B.s - 10, B.x - 17, B.y - 6); if (ph >= 2) fire(g, B.s - 10, B.x, B.y + 20); } }
    if (B.hitT <= 0 && L.s > B.s - 10 && L.s < B.s + 14 && (capped || (B.hw && Math.abs(L.x - B.x) < B.hw && Math.abs(L.y - B.y) < B.hh) || Math.hypot(L.x - B.x, L.y - B.y) < 10 + RK)) {
      B.hp = capped ? 0 : B.hp - 1; B.hitT = 1.6; L.inv = 1.2; rk.vel.multiplyScalar(0.6); g.rig.shake = 1.2; g.flash = 0.35; g.flashColor = '#ffffff'; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); burst(rk.pos.clone(), '#ffd04a', 0.9, 'ring'); g.audio.play('reactorHit'); g.audio.play('boom');
      if (EVO.onBossHit) EVO.onBossHit(g, null); rk.fuel = Math.min(rk.fuelMax, rk.fuel + 6);
      if (B.hp <= 0) { B.dead = true; B.deadT = 0; if (CC.L1) CC.L1.msg(g, 'ROBOT JOUET DETRUIT !', 3, '#ffe9a0'); g.audio.play('victory'); }
      else { B.sT = Math.min(B.cap, L.s + 300); if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 2, '#ff9a5a'); }
      (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 3, 0)), t0: performance.now(), txt: B.hp > 0 ? '-1' : 'BOUM !' }); return; }
    if (L.s > B.s + 14 && !capped) { B.sT = Math.min(B.cap, L.s + 240); B.s = Math.max(B.s, L.s + 110); if (CC.L1) CC.L1.msg(g, 'IL REVIENT !  FONCE DEDANS', 1.6, '#ff6a5a'); }
  }
  function bossAnim(g, dt) { const B = L.boss; if (!B || !B.on || !B.m.visible) return; if (EVO.milAnim) EVO.milAnim(g, B, dt, L.t); if (!B.dead) { placeAt(L.PA, B.m, B.s, B.x, B.y); B.m.rotateZ(Math.sin(L.t * 0.9) * 0.08); B.m.rotateX(Math.sin(L.t * 0.6) * 0.05); } else { B.m.position.y -= dt * 8; B.m.rotateZ(dt * 0.6); }
    B.tg.scale.setScalar(1 + 0.06 * Math.sin(L.t * 5)); if (L.bossKey) L.bossKey.rotation.z = L.t * 2.4; for (const j of L.bossJets) j.scale.setScalar(16 * (0.85 + 0.3 * Math.random()));
    if (!B.dead && Math.random() < dt * 20) for (const sx of [-1, 1]) g.effects.smokePuff(_a.set(sx * 6, -36, 0).applyQuaternion(B.m.quaternion).add(B.m.position).clone(), new V(rr(-1, 1), rr(-6, -3), rr(-1, 1)), 3, 0.8); }

  // ============================== LA FICHE DU NIVEAU 7 ==============================
  const CH7 = ZN.map((z) => [z[3], z[0], z[2]]);
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 7) || g.evoPreview) return _ld(g);
    EVO.chapters = CH7.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { const A = EVO.SCENE_AUDIO; A.mbureau = 'evoDawn'; A.mchambre = 'evoDawn'; A.mlit = 'evoDusk'; A.mventilo = 'evoDay'; A.mtable = 'evoDusk'; A.mplan = 'evoDay'; A.mjeux = 'evoDay'; A.mcouloir = 'evoDusk'; A.mcuisine = 'evoDay'; A.mfenetre = 'evoDay'; A.mjardin = 'evoBoss'; }
    return EVO.baseDef({ zone: 'campagne', len: Math.round(LOC.len - 60), scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 7707, bossEnt: null });
  };

  // ============================== CONSTRUCTION, PILOTAGE, CAMERA ==============================
  const dispose = (g) => { if (!L) return; for (const k of ['grp', 'sky', 'dust']) if (L[k]) g.scene.remove(L[k]); if (L.far0) { g.camera.far = L.far0; g.camera.updateProjectionMatrix(); } L = null; EVO.maison = null; SHAD.length = GRASS.length = 0; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); };
  function build(g) {
    const pad = g.pad, run = g.endlessRun, T = run.T, a = T.at(0, 0, 0), b = T.at(8, 0, 0), F0 = new V(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const O = (pad && pad.origin ? pad.origin.clone() : new V(a[0], a[1] + 2, a[2])), P0 = O.clone(); P0.y -= 2.2 + DESK;   // le dessus du bureau : 2,2 m sous la fusee ; le parquet 112 m plus bas
    L = EVO.maison = { t: 0, s: 0, x: 0, y: 0, v: 0, started: false, inv: 0, boostT: 0, bk: 0, zi: 0 };
    L.rkL = (EVO.rocketLen && EVO.rocketLen(g)) || 2.4;
    SHAD.length = GRASS.length = 0;
    const PA = L.PA = buildPath(P0, F0), grp = L.grp = new T3.Group(); g.scene.add(grp); L.HGry = Math.atan2(-PA.F0.x, -PA.F0.z); L.dbg = { ZN, zoneAt, LIMS: () => LIMS, gH, pathU, pathY };
    terrain(PA, grp); obstacles(g, PA, grp); house(PA, grp); sky(g, PA, grp); enemies(g, PA, grp); bossBuild(g, PA, grp); fwPool(grp); batches(grp); colBuild();
    grp.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (!m.isShaderMaterial && !m.fog && !(m.blending === T3.AdditiveBlending) && !(o.isPoints)) { m.fog = true; m.needsUpdate = true; } });
    // les poussieres dorees dans la lumiere (dedans), les aigrettes qui volent (dehors)
    { const n = 420, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#fff0c0', size: 0.35, map: dotTex(), transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; p.visible = false; g.scene.add(p); L.dust = p; L.dustInit = false; L.dph = new Float32Array(n); for (let i = 0; i < n; i++) L.dph[i] = rr(0, 6.28); }
    L.far0 = g.camera.far;
  }
  const LIMS = { pad: [30, 16], low: [22, 13], open: [55, 60], corr: [42, 60], counter: [24, 26], boost: [40, 40] };
  const floorAt = (s, F) => { if (F.u.y < 0.3) return -1e9; let y = L.y; for (let k = 0; k < 3; k++) { const q = _c.copy(F.p).addScaledVector(F.r, L.x).addScaledVector(F.u, y); y = (gH(q.x, q.z) + 2.0 - F.p.y - F.r.y * L.x) / F.u.y; } return y; };

  // v442 : LE PILOTAGE DU NIVEAU 1 : la fusee vole librement (vraie physique, on vise ou on veut, la camera de poursuite d'origine).
  // La voie ne sert plus qu'a savoir ou on en est (on projette la fusee dessus) : les zones, les obstacles, l'arrivee.
  const _st = new V(), _sa = new V();
  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on7(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA; if (!L.started) { L.started = true; L.K = CC.EVO.spdK ? CC.EVO.spdK(this.game) : 1; L.s = 0; L.x = 0; L.y = 0; }
    const s0 = L.s, zi = zoneAt(L.s), Z = ZN[zi], boostZ = /boost/.test(Z[5]);
    if (zi !== L.zi) { L.zi = zi; if (CC.L1) CC.L1.msg(g, Z[3] + (boostZ ? ' !' : ''), 2.2, Z[4]); if (boostZ) { g.audio.play('boostOn'); g.audio.play('whoosh'); } else g.audio.play('jetPass'); }
    if (L.boostT > 0) L.boostT -= dt; if (L.inv > 0) L.inv -= dt;
    // on ne peut pas faire demi-tour : la visee reste tournee vers l'avant de la maison (a plus de 70 degres, elle est ramenee)
    let inp = input; if (input && input.aimDir) { const Ft = PA.fr(L.s + 12).t, d = input.aimDir.dot(Ft); if (d < 0.34) inp = Object.assign({}, input, { aimDir: _sa.copy(input.aimDir).addScaledVector(Ft, 0.34 - d).normalize() }); }
    if (!(boostZ || L.boostT > 0)) this.fuel = Math.max(0, this.fuel - dt * (L.K || 1));
    const dry = this.fuel <= 0; if (dry && !L.dry) { L.dry = 1; if (CC.L1) CC.L1.msg(g, 'PLUS DE CARBURANT !', 2, '#ff6a5a'); g.audio.play('warnFuel'); } if (!dry) L.dry = 0;
    if (dry) inp = Object.assign({}, inp, { aimDir: new V().copy(this.fwd).setY(Math.min(this.fwd.y - 0.35, -0.65)).normalize() });   // v448 : a sec, le nez pique vers le sol (plus de long vol plane)
    const fu = this.fuel; if (dry) this.fuel = 0;
    _step.call(this, dt, inp); this.fuel = fu; if (!this.active) return;
    // la vitesse : celle du niveau (plus vite dans la fenetre et apres une boucle) ; sans carburant, on ralentit et on tombe
    const vMax0 = L.boostT > 0 ? 150 : boostZ ? 130 : 90; const vMax = vMax0 * (L.K || 1);   // v449 : la vitesse monte avec la fusee L.bk += ((L.boostT > 0 ? 1 : boostZ ? 0.65 : 0) - L.bk) * Math.min(1, dt * 3);
    if (!dry) { const sp = this.vel.length(); if (sp > 1e-3) { const want = sp + (vMax - sp) * Math.min(1, dt * (sp < vMax ? 1.4 : 0.9)); this.vel.multiplyScalar(want / sp); } } else this.vel.y -= 14 * dt;   // v448 : a sec, plus de frein : la fusee pique et tombe (elle meurt au sol, jamais en l'air)
    // ou en est-on sur la voie
    for (let k = 0; k < 3; k++) { const F = PA.fr(L.s); L.s = U.clamp(L.s + U.clamp(_st.subVectors(this.pos, F.p).dot(F.t), -40, 40), 0, PA.len); }
    const F2 = PA.fr(L.s); _st.subVectors(this.pos, F2.p); L.x = _st.dot(F2.r); L.y = _st.dot(F2.u); L.v = this.vel.length();
    // les murs, le plafond et le sol de la maison : on glisse dessus
    // dehors (le jardin), une limite tres large : la palissade est a 950 m, le ciel a 520 m
    if (Math.abs(L.x) > 900) { L.x = Math.sign(L.x) * 900; const vr = this.vel.dot(F2.r); if (vr * L.x > 0) this.vel.addScaledVector(F2.r, -vr); }
    if (L.y > 520) { L.y = 520; const vu = this.vel.dot(F2.u); if (vu > 0) this.vel.addScaledVector(F2.u, -vu); }
    { const fl = floorAt(L.s, F2); if (L.y < fl && dry && this.active) { g.onRocketCrash('stalled', this.pos.clone(), null); return; } if (L.y < fl) { L.y = fl; const vu = this.vel.dot(F2.u); if (vu < 0) this.vel.addScaledVector(F2.u, -vu); if (Math.random() < dt * 8) g.effects.smokePuff(_a.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y - 1).clone(), new V(rr(-2, 2), rr(1, 3), rr(-2, 2)), 1.4, 0.9); } }
    this.pos.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y);
    { const H2 = colAt(this.pos); if (H2) { const vd = _a.copy(this.vel).normalize(), imp = Math.asin(U.clamp(-vd.dot(H2.n), -1, 1)) * 57.3;
        if ((imp < 28 || L.inv > 0) && !dry) { this.pos.copy(H2.out); const vn = this.vel.dot(H2.n); if (vn < 0) this.vel.addScaledVector(H2.n, -vn * 1.05); if (Math.random() < dt * 10) g.effects.smokePuff(this.pos.clone(), H2.n.clone().multiplyScalar(3), 1.2, 0.7); }
        else { this.pos.copy(H2.out); g.onRocketCrash('wall', this.pos.clone(), H2.n.clone()); if (this.active) { L.inv = 0.8; const vn = this.vel.dot(H2.n); if (vn < 0) this.vel.addScaledVector(H2.n, -vn * 1.5); this.vel.multiplyScalar(0.5); g.rig.shake = Math.max(g.rig.shake, 1); } }
        for (let k = 0; k < 2; k++) { const F = PA.fr(L.s); L.s = U.clamp(L.s + _st.subVectors(this.pos, F.p).dot(F.t), 0, PA.len); } const F3 = PA.fr(L.s); _st.subVectors(this.pos, F3.p); L.x = _st.dot(F3.r); L.y = _st.dot(F3.u); } }
    this.speed = this.vel.length();
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, L.s);
    if (L.inv <= 0 && L.OB && L.s > s0) for (const o of L.OB) { if (o.s + o.th < s0 || o.s - o.th > L.s) continue; if (o.hit(L.x, L.y, L.t)) { g.onRocketCrash('wall', this.pos.clone(), F2.t.clone().negate()); if (this.active) { L.inv = 0.8; this.vel.multiplyScalar(0.5); g.rig.shake = Math.max(g.rig.shake, 1); } break; } }
    if (this.active && L.sent) play(g, this, dt, s0);
    if (this.active && !dry && Math.random() < dt * 30) { const tier = EVO.rocket(EVO.save(g).rk).tier; g.effects.smokePuff(this.nozzle(new V()), this.fwd.clone().multiplyScalar(-rr(3, 8)).add(new V(rr(-1, 1), rr(-1, 1), rr(-1, 1))), tier === 0 ? 0.6 : 0.9, 0.6); }
    if (this.active && L.s > PA.len - 60 && (!L.boss || L.boss.dead) && !g.evoFinish && EVO.finishRun) { if (CC.L1) CC.L1.msg(g, 'ARRIVEE !', 2.6, '#ffe9a0'); for (let k = 0; k < 6; k++) burst(this.pos.clone().addScaledVector(this.fwd, 60).add(new V(rr(-40, 40), rr(10, 50), rr(-40, 40))), FWC[k % FWC.length], 1.4, k % 2 ? 'ring' : null); EVO.finishRun(g); }
  };

  // --- AU MENU : la fusee sur sa gomme, au milieu du bureau ---
  function menuView(g, rig, dt) {
    const PA = L.PA, O = PA.fr(0).p, R0 = PA.R0, F0 = PA.F0, cam = rig.cam, rk = g.rocket, A = g.evoAnim, Y = new V(0, 1, 0), Lw = L.rkL;
    if (rk.mesh) { rk.mesh.visible = true; rk.mesh.position.copy(O); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(_a.crossVectors(Y, F0).normalize(), Y, F0)); }
    let p, look; const t = L.t;
    if (A && A.kind === 'tier') { const an = -1.1 + Math.sin(A.t * 0.5) * 0.35, D = U.clamp(2.8 * Lw, 4.5, 8); p = new V().copy(O).addScaledVector(R0, -Math.cos(an) * D).addScaledVector(F0, Math.sin(an) * D).addScaledVector(Y, Lw * 0.5); look = O.clone(); }
    else { const ch = g.evoAim ? (g.evoAim.lock ? 1 : g.evoAim.ch || 0) : 0, D = Math.max(1.3, Lw / 1.8); p = new V().copy(O).addScaledVector(R0, (2.6 - 0.6 * ch) * D).addScaledVector(F0, (-3.0 - 0.3 * Math.sin(t * 0.12)) * D).addScaledVector(Y, (1.0 - 0.2 * ch) * D); look = new V().copy(O).addScaledVector(R0, -0.5 * D).addScaledVector(F0, 0.6 * D).addScaledVector(Y, 0.6 * D);
      if (ch > 0.2) { p.x += (Math.random() - 0.5) * 0.12 * ch; p.y += (Math.random() - 0.5) * 0.12 * ch; } }
    if (!L.mc) { L.mc = p.clone(); L.ml = look.clone(); } const k = 1 - Math.exp(-dt * 4); L.mc.lerp(p, k); L.ml.lerp(look, k);
    cam.position.copy(L.mc); cam.up.set(0, 1, 0); cam.lookAt(L.ml); if (Math.abs(cam.fov - 55) > 0.01) { cam.fov = 55; cam.updateProjectionMatrix(); } if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); } cam.updateMatrixWorld();
  }
  const _rup = CC.CameraRig.prototype.update;
  CC.CameraRig.prototype.update = function (dt) {
    _rup.call(this, dt); const g = this.game, rk = g.rocket;
    if (L && L.PA && on7(g) && !rk.active && (g.state === 'MENU' || g.state === 'AIM' || g.state === 'LAUNCH')) { menuView(g, this, dt); return; }
    if (!L || !L.PA || !on7(g) || !rk.active || g.state !== 'FLIGHT' || !L.started || (g.evoFinish && g.evoFinish.hold)) return;
    // v442 : la camera de poursuite du niveau 1 (rien d'autre) ; seulement : jamais sous le sol, et assez loin pour voir loin dans la maison
    const cam = this.cam; { const gy = gH(cam.position.x, cam.position.z) + 1.2; if (cam.position.y < gy) { cam.position.y = gy; cam.updateMatrixWorld(); } }
    if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); }
  };
  if (CC.Horizon) { const _hu = CC.Horizon.prototype.update; CC.Horizon.prototype.update = function (g) { if (L && on7(g)) { for (const m of [this.ring, this.glow, this.mtn]) if (m) m.visible = false; return; } return _hu.call(this, g); }; }
  // v448 : l'epave retombe (gravite normale) et se pose sur le relief du niveau (EVO.terrain) : plus d'epave qui flotte
  (EVO.terrain = EVO.terrain || []).push((g, x, z) => (isS7() && L && L.PA ? gH(x, z) : null));
  const wNow = () => { if (!L || !L.started) return 0; const q = L.PA.loc(L.PA.fr(L.s).p); return q[1]; };
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on7(g)) return;
    const w = wNow(), M = moodAt(w); L.M = M;
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(M.top); u.horizon.value.copy(M.hor); u.bottom.value.copy(M.fog); u.cloud.value = 0; }
    g.scene.fog.color.copy(M.fog); g.scene.fog.near = M.near; g.scene.fog.far = M.far;
    if (g.fogBase) { g.fogBase.near = M.near; g.fogBase.far = M.far; g.fogBase.color.copy(M.fog); }
    g.renderer.setClearColor(M.fog); if (g.stars) g.stars.visible = false; g.nightK = 0; const out0 = w > WF - 40;
    if (g.postParams) { g.postParams.bloomStrength = out0 ? 0.2 : 0.1; g.postParams.bloomThreshold = 0.9; g.postParams.vignette = 0.26; g.postParams.saturation = 1.12; g.postParams.contrast = 1.04; }
    const out = w > WF - 40; g.ambient.intensity = (out ? 0.36 : 0.3) * M.li + (out ? 0.1 : 0.06); g.sun.intensity = (out ? 0.85 : 0.5) * M.li; g.sun.color.set(out ? '#fffaf0' : w > WJ && w < WCO ? '#ffd8a8' : '#fff0dc');
  };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!on7(g) || !g.endlessRun || !g.endlessRun.T) return;
    if (!L) { try { build(g); } catch (e) { console.warn('maison', e); L = null; return; } }
    const PA = L.PA, rk = g.rocket, cam = g.camera, s = L.started ? L.s : 0, w = wNow(); L.t += dt;
    bossAnim(g, dt); fwTick(dt);
    for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = false;
    for (const o of g.scene.children) if (o.name === 'level') o.visible = false; if (g.pad && g.pad.evoL) g.pad.evoL.visible = false; if (g.pad && g.pad.hangar) g.pad.hangar.visible = false;
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.flash = 0.25; g.flashColor = '#fff4d8'; if (CC.L1) CC.L1.msg(g, 'DECOLLAGE !', 1.6, '#ffd27a'); }
    animate(g, dt);
    if (L.wTex) L.wTex.offset.y += dt * 1.6;
    const out = w > WF - 40;
    if (L.cloudIM) L.cloudIM.visible = out;
    if (L.sky) { L.sky.position.copy(cam.position); if (L.sun) { L.sun.visible = out; L.sun.position.copy(_b.copy(PA.F0).multiplyScalar(0.7).addScaledVector(PA.R0, 0.4).setY(0.55).normalize()).multiplyScalar(2800); } }
    // les poussieres dorees (dedans) et les aigrettes (dehors) autour de la camera
    if (L.dust) { const P = L.dust.geometry.attributes.position, n = P.count, D = L.dust.material, F = PA.fr(s), ctr = rk.active ? rk.pos : cam.position;
      D.color.set(out ? '#ffffff' : '#ffe8b0'); D.opacity = out ? 0.9 : 0.55; D.size = out ? 0.5 : 0.3; const fall = out ? -0.3 : 0.2;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); const ph = L.dph[i]; _a.y -= fall * dt; _a.x += Math.sin(L.t * 0.7 + ph) * dt * 0.8; _a.z += Math.cos(L.t * 0.6 + ph) * dt * 0.8;
        if (!L.dustInit || _b.subVectors(_a, ctr).dot(F.t) < -10 || _b.length() > 120) { _a.copy(ctr).addScaledVector(F.t, L.dustInit && L.started ? rr(50, 110) : rr(-10, 110)).addScaledVector(F.r, rr(-40, 40)).addScaledVector(F.u, rr(-12, 30)); }
        P.setXYZ(i, _a.x, _a.y, _a.z); }
      L.dustInit = true; P.needsUpdate = true; }
  };
})();
