/* v435 : NIVEAU 6 « LA FETE DES LANTERNES » (?lv=6) — meme mecanique de voie 3D que les niveaux 4 et 5 (s = distance sur la voie, x, y = ecart dans la section).
 * On est une FUSEE DE FEU D'ARTIFICE lancee d'un village en fete au crepuscule, dans un monde asiatique zen : on file au ras d'une FORET DE BAMBOUS
 * (murs de bambous a trou, bambous couches, guirlandes de lanternes), on traverse une vallee de CERISIERS en fleurs (pluie de petales, grandes portes torii
 * a enfiler), on remonte une GORGE jusqu'a une CASCADE qu'on escalade, on survole le TEMPLE DE LA MONTAGNE (cloches qui balancent, portes du temple),
 * puis on monte dans le CIEL DE FETE, au milieu des feux d'artifice, ou nous attend LA JONQUE CELESTE (bateau volant porte par des lanternes).
 * Le sol est un champ de hauteur H(u, w) (u a droite, w en avant) maille en lignes de 15 m qui suivent la voie : la courbure du monde (curve.js) se fait
 * sommet par sommet, donc jamais de grands triangles pres de la voie (lecon du niveau 5). Pas d'animaux. Chaque element pose au sol a son ombre. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn || !CC.Rocket) return;
  const on6 = (g) => !!(g && g.evo && !g.evo.preview && EVO.stage && EVO.stage(g) === 6);
  const isS6 = EVO.isS6 = () => !!(EVO.stage && CC.game && EVO.stage(CC.game) === 6);
  const ROPEN = 30, RK = 0.55, rr = (a, b) => a + Math.random() * (b - a);
  const _a = new V(), _b = new V(), _c = new V(), _d = new V(), _q = new T3.Quaternion(), _q2 = new T3.Quaternion(), _m = new T3.Matrix4();
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  let L = null;

  // ============================== LA FUSEE DE FEU D'ARTIFICE, le carburant, les pieces ==============================
  for (let i = 0; i < 4; i++) CC.Skins.byId['evoF' + i] = { id: 'evoF' + i, name: 'evoF' + i, short: 'evoF' + i, tier: 'base', price: 0, tierLabel: '', c: { body: '#d42a22', nose: '#e8b84a', tip: '#f6d77a', band: '#1e1a1c', fin: '#a81a16', nozzle: '#3a2a20' }, flame: ['#ffd27a', '#ffc04a', '#ff8a4a', '#ffe08a'][i], build: 'feu', stage: i, dims: { r: 0.1, len: 1, noseLen: 0.3, noseR: 0.02, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, parts: [] };
  { const _ob = EVO.ownBody; EVO.ownBody = () => _ob() || isS6(); }
  { const _as = EVO.applySkin; EVO.applySkin = (g) => { if (!isS6()) return _as(g); const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoF' + r.tier)); EVO.attachParts(g); }; }
  { const RK6 = ['FUSEE DE PAPIER', 'FUSEE A BOUQUET', 'COMETE LAQUEE', 'GRAND BOUQUET'], _rk = EVO.rocket; EVO.rocket = (n) => { const r = _rk(n); if (isS6()) r.name = RK6[r.tier]; return r; }; }
  // la fusee de depart s'eteint dans la foret, chaque palier donne un gros bond (le grand bouquet finit le niveau) ; les portes torii et les lanternes rechargent un peu
  EVO.fuel6 = (rk, la) => 28 + 1.6 * rk + 1.2 * la + [0, 16, 48, 115][Math.min(3, Math.floor(rk / 5))];
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); if (!isS6() || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket, f = EVO.fuel6(S.rk || 0, S.la || 0); rk.fuelMax = f * 1.15; rk.fuel = (g.evoAimLast && g.evoAimLast.zone === 'gold') ? f * 1.15 : f; }; }
  { const _dp = EVO.distPay; EVO.distPay = (g, dist) => (isS6() ? 0.45 * (0.15 / (8450 / 6910)) * (1 + 2 * Math.min(1, dist / 6400)) : _dp ? _dp(g, dist) : 1); }
  { const _nk = EVO.noKill; EVO.noKill = (g) => on6(g) || (_nk ? _nk(g) : false); }

  // ============================== LE RELIEF : un champ de hauteur dans le repere du depart (u a droite, w en avant, h vers le haut) ==============================
  const WB = 200, WC = 1650, WG = 2850, WT = 3720, WM = 4950, WS = 5400, WE = 6400;
  const hsh = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1 + 5.3, y * 2.1 + 9.1) * 0.3 + vn(x * 4.3 + 11.7, y * 4.3 + 3.9) * 0.15;
  // le trace de la voie (elle serpente dans la foret, la vallee, la gorge et sur le plateau)
  const pathU = (w) => 26 * Math.sin((w - 200) / 210) * ss(200, 420, w) * (1 - ss(1480, 1650, w)) + 40 * Math.sin((w - 1650) / 300) * ss(1650, 1850, w) * (1 - ss(2680, 2850, w))
    + 22 * Math.sin((w - 2850) / 170) * ss(2850, 2950, w) * (1 - ss(3420, 3520, w)) + 30 * Math.sin((w - 3720) / 260) * ss(3800, 3950, w) * (1 - ss(4780, 4950, w));
  const baseW = (w) => 60 * ss(2880, 3600, w) + 160 * ss(3690, 3712, w);   // le fond de vallee : la gorge monte, la falaise de la cascade, le plateau du temple
  const baseP = (w) => 60 * ss(2880, 3600, w) + 160 * ss(3480, 3680, w);   // la voie, elle, escalade la cascade avant la falaise
  const clr = (w) => 2.2 + 6.8 * ss(10, 160, w) + 4 * ss(1650, 1800, w) + 2 * ss(2850, 2950, w) + 2 * ss(3720, 3850, w) + 330 * ss(WM, WS + 50, w);
  const pathY = (w) => baseP(w) + clr(w);
  const gorgeK = (w) => ss(2860, 2960, w) * (1 - ss(3700, 3722, w));
  // les marches des rizieres : une colline decoupee en terrasses de 3,2 m (bord net, dessus plat)
  const terr = (x, st) => { const q = x / st, f = q - Math.floor(q); return (Math.floor(q) + ss(0.82, 1, f)) * st; };
  const cherK = (w) => ss(1600, 1760, w) * (1 - ss(2780, 2900, w));
  const streamD = (w) => -62 + 14 * Math.sin(w / 95);   // le ruisseau de la vallee des cerisiers (a gauche de la voie)
  function H(u, w) {
    const d = u - pathU(w), ad = Math.abs(d), b = baseW(w);
    let h = b + 190 * ss(260, 700, ad) * (0.7 + 0.7 * fbm(u * 0.003, w * 0.003));   // les montagnes au loin
    h += 70 * ss(120, 420, ad) * (0.3 + fbm(u * 0.006 + 2, w * 0.006)) * (1 - ss(WT - 100, WT, w) * (1 - ss(WM - 200, WM, w)));   // les collines de second plan
    { const k = cherK(w); if (k > 0) { const hill = 58 * ss(48, 260, ad) * (0.45 + fbm(u * 0.01, w * 0.01)); h += k * (ad > 46 ? terr(hill, 3.2) : hill); } }   // les rizieres en terrasses
    h += 34 * ss(40, 170, ad) * (0.3 + fbm(u * 0.016, w * 0.016)) * (1 - ss(1600, 1700, w)) * ss(-100, 60, w);   // les collines de la foret de bambous
    h += 28 * ss(70, 200, ad) * (0.4 + fbm(u * 0.012 + 9, w * 0.012)) * (1 - ss(60, 200, w));   // les collines derriere le village
    { const gk = gorgeK(w); if (gk > 0) { const wall = 160 * ss(34, 80, ad) * (0.82 + 0.35 * fbm(u * 0.02 + 3, w * 0.02)); h += gk * (terr(wall, 14) * 0.6 + wall * 0.4 + 9 * (fbm(u * 0.08, w * 0.08) - 0.5) * ss(36, 60, ad)); } }   // les parois de la gorge, en strates
    h += 230 * ss(150, 440, ad) * ss(3760, 3950, w) * (0.7 + 0.6 * fbm(u * 0.004 + 7, w * 0.004));   // les sommets autour du temple
    h += 14 * ss(46, 140, ad) * (fbm(u * 0.02 + 4, w * 0.02) - 0.3) * ss(3760, 3900, w);   // les buttes du plateau
    h += 3.2 * (fbm(u * 0.035, w * 0.035) - 0.5) * ss(22, 60, ad);   // de petites bosses, jamais sous la voie
    h -= 2.6 * (1 - ss(9, 15, ad)) * gorgeK(w) * (1 - ss(3640, 3690, w));   // le lit de la riviere
    { const k = cherK(w); if (k > 0) h -= 2.4 * k * (1 - ss(3, 7, Math.abs(d - streamD(w)))); }   // le ruisseau
    return h;
  }
  // la voie en coordonnees locales [u, h, w] : sa longueur ne depend pas de l'orientation du depart, on la calcule une fois (les chapitres en ont besoin)
  const CPL = []; for (let w = 0; w <= WE; w += 50) CPL.push([pathU(w), pathY(w), w]);
  const LOC = (() => { const cv = new T3.CatmullRomCurve3(CPL.map((q) => new V(q[0], q[1], q[2])), false, 'centripetal', 0.5), len = cv.getLength(), N = Math.ceil(len / 2), P = cv.getSpacedPoints(N);
    return { len, sAtW: (w) => { for (let i = 0; i <= N; i++) if (P[i].z >= w) return i * len / N; return len; } }; })();
  const sW = (w) => Math.round(LOC.sAtW(w));
  // LE PROGRAMME : [debut, fin, cle, titre, couleur, genre]  genre : pad / low (au ras du sol, sous-bois) / open / gorge / boost
  const ZN = [[0, sW(WB), 'fvillage', 'LE VILLAGE EN FETE', '#ffb07a', 'pad'], [sW(WB), sW(WC), 'fbambou', 'LA FORET DE BAMBOUS', '#9aff6a', 'low'], [sW(WC), sW(WG), 'fcerisier', 'LES CERISIERS EN FLEURS', '#ffb8d0', 'open'],
    [sW(WG), sW(WT), 'fgorge', 'LA GORGE ET LA CASCADE', '#8fe6ff', 'gorge'], [sW(WT), sW(WM), 'ftemple', 'LE TEMPLE DE LA MONTAGNE', '#ffd27a', 'open'], [sW(WM), sW(WS), 'fmontee', 'LA MONTEE AU CIEL', '#ffc23a', 'boost'], [sW(WS), 1e9, 'fciel', 'LE CIEL DE FETE', '#ff8ad8', 'open']];
  const zoneAt = (s) => { for (let i = ZN.length - 1; i >= 0; i--) if (s >= ZN[i][0]) return i; return 0; };
  // l'ambiance le long de la voie (en w) : [w, ciel haut, horizon, brume, brume proche, brume loin, lumiere]
  const MOOD = [[0, '#4a64a8', '#ffb58a', '#f2c09a', 140, 1000, 1.0], [WB + 150, '#5a8ac0', '#f4dca8', '#c8d8a4', 70, 560, 0.95], [WC - 100, '#5a8ac0', '#f4dca8', '#c8d8a4', 70, 560, 0.95],
    [WC + 150, '#7a9ad8', '#ffd4de', '#e6b4c6', 190, 1150, 1.0], [WG - 100, '#7a9ad8', '#ffd4de', '#e6b4c6', 190, 1150, 1.0], [WG + 150, '#6a9ac0', '#dcecea', '#bcd4d2', 90, 760, 0.95], [WT - 60, '#6a9ac0', '#dcecea', '#bcd4d2', 90, 760, 0.95],
    [WT + 200, '#3e4e90', '#ffa070', '#d4988a', 190, 1400, 0.95], [WM - 50, '#3e4e90', '#ffa070', '#d4988a', 190, 1400, 0.95], [WS, '#141a48', '#9a5a7a', '#3e3060', 220, 1700, 0.75], [WS + 300, '#060a22', '#1c2458', '#121a40', 240, 1900, 0.6], [1e9, '#060a22', '#1c2458', '#121a40', 240, 1900, 0.6]];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color(), _c4 = new T3.Color();
  function moodAt(w) { let i = 0; while (i < MOOD.length - 2 && w > MOOD[i + 1][0]) i++; const A = MOOD[i], B = MOOD[i + 1], t = ss(A[0], B[0], w);
    return { top: _c1.set(A[1]).lerp(_c4.set(B[1]), t).clone(), hor: _c2.set(A[2]).lerp(_c4.set(B[2]), t).clone(), fog: _c3.set(A[3]).lerp(_c4.set(B[3]), t).clone(), near: U.lerp(A[4], B[4], t), far: U.lerp(A[5], B[5], t), li: U.lerp(A[6], B[6], t) }; }

  // ============================== OUTILS ==============================
  function buildPath(P0, F0) {
    const Y = new V(0, 1, 0), R0 = new V().crossVectors(F0, Y).normalize(), W = (q) => new V().copy(P0).addScaledVector(R0, q[0]).addScaledVector(Y, q[1]).addScaledVector(F0, q[2]);
    const curve = new T3.CatmullRomCurve3(CPL.map(W), false, 'centripetal', 0.5), len = curve.getLength(), N = Math.ceil(len / 2), P = curve.getSpacedPoints(N), step = len / N, T = [], UP = [], RT = [];
    for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; T.push(new V().subVectors(b, a).normalize()); }
    for (let i = 0; i <= N; i++) { const up = new V().copy(Y).addScaledVector(T[i], -Y.dot(T[i])).normalize(); UP.push(up); RT.push(new V().crossVectors(T[i], up).normalize()); }   // jamais verticale : le haut de la section est le vrai haut
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
  function bakeBox(parts) {
    const K = EVO.foireKit; if (K && K.bake) return K.bake(parts.map((q) => ({ g: q.cyl ? new T3.CylinderGeometry(q.cyl[0], q.cyl[1], q.cyl[2], q.cyl[3] || 12) : new T3.BoxGeometry(q.s[0], q.s[1], q.s[2]), c: q.c, p: q.p, r: q.r })));
    const grp = new T3.Group(); for (const q of parts) { const m = new T3.Mesh(q.cyl ? new T3.CylinderGeometry(q.cyl[0], q.cyl[1], q.cyl[2], q.cyl[3] || 12) : new T3.BoxGeometry(q.s[0], q.s[1], q.s[2]), lam(q.c)); m.position.fromArray(q.p); if (q.r) m.rotation.fromArray(q.r); grp.add(m); } return grp;
  }
  let DOT = null; const dotTex = () => { if (DOT) return DOT; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); DOT = new T3.CanvasTexture(c); return DOT; };
  let PET = null; const petalTex = () => { if (PET) return PET; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(16, 16, 13, 7, 0.6, 0, Math.PI * 2); x.fill(); PET = new T3.CanvasTexture(c); return PET; };
  let SHT = null; const shadowTex = () => { if (SHT) return SHT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); SHT = new T3.CanvasTexture(c); return SHT; };
  const lumpGeo = (sx, sy, sz, seed, det, amp) => { const g = new T3.IcosahedronGeometry(1, det || 2), P = g.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).normalize(); const w = 1 + amp * (Math.sin(q.x * 3.1 + seed) * Math.cos(q.y * 2.7 + seed * 1.7) + 0.6 * Math.sin(q.z * 5.3 + seed * 2.3) * Math.cos(q.x * 4.1 + seed) + 0.35 * Math.sin((q.x + q.y + q.z) * 9 + seed)); P.setXYZ(i, q.x * w * sx, q.y * w * sy, q.z * w * sz); } g.computeVertexNormals(); return g; };
  // l'eau qui coule : une texture de filets clairs qui defile (materiau du jeu : elle suit la courbure du monde)
  function waterTex(fall) { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = fall ? '#cfe8f2' : '#3a8ab0'; x.fillRect(0, 0, 64, 256);
    for (let k = 0; k < (fall ? 70 : 40); k++) { x.fillStyle = fall ? (Math.random() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(120,180,210,0.6)') : (Math.random() < 0.5 ? 'rgba(170,225,245,0.55)' : 'rgba(20,80,120,0.4)'); const w = fall ? rr(2, 6) : rr(4, 16), h = fall ? rr(30, 120) : rr(3, 8); x.fillRect(rr(0, 64), rr(0, 256), w, h); }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; return t; }

  // ============================== CONSTRUCTIONS (cuites en quelques maillages par couleur) ==============================
  const WOOD = '#5a3a24', PAPER = '#f2ead6', ROOF = '#3a3e4a', ROOF2 = '#2a2c36', RED = '#c8321e', GOLD = '#e8b84a', STONE = '#a8a294';
  // une maison : murs de bois, panneaux de papier, toit de tuiles a deux pans aux coins releves
  function house(sx, sz, hh) {
    const P = [{ s: [sx, hh, sz], c: WOOD, p: [0, hh / 2, 0] }, { s: [sx + 0.6, 0.6, sz + 0.6], c: STONE, p: [0, 0.3, 0] }];
    for (const fz of [-1, 1]) for (let k = 0; k < 3; k++) P.push({ s: [sx * 0.22, hh * 0.5, 0.12], c: PAPER, p: [(k - 1) * sx * 0.3, hh * 0.52, fz * (sz / 2 + 0.05)] });
    const rw = sz / 2 + 1.6, ang = 0.5; for (const fz of [-1, 1]) P.push({ s: [sx + 2.6, 0.5, rw / Math.cos(ang)], c: ROOF, p: [0, hh + rw * Math.tan(ang) / 2 + 0.2, fz * rw / 2], r: [fz * ang, 0, 0] });
    P.push({ s: [sx + 3.2, 0.7, 0.9], c: ROOF2, p: [0, hh + rw * Math.tan(ang) + 0.45, 0] });
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) P.push({ s: [1.6, 0.4, 0.6], c: ROOF2, p: [fx * (sx / 2 + 1.4), hh + 0.35, fz * (rw - 0.1)], r: [0, 0, fx * 0.45] });
    return bakeBox(P);
  }
  // une pagode : etages qui retrecissent, toits en pyramide aux bords larges, fleche doree
  function pagoda(n, w0, th) {
    const P = []; let y = 0, w = w0; P.push({ s: [w0 + 3, 1.2, w0 + 3], c: STONE, p: [0, 0.6, 0] }); y = 1.2;
    for (let k = 0; k < n; k++) { P.push({ s: [w, th, w], c: k % 2 ? '#8a2a1e' : RED, p: [0, y + th / 2, 0] }); for (const fz of [-1, 1]) P.push({ s: [w * 0.5, th * 0.5, 0.15], c: PAPER, p: [0, y + th * 0.5, fz * (w / 2 + 0.05)] });
      y += th; P.push({ cyl: [w * 0.42, w * 0.98, th * 0.55, 4], c: ROOF, p: [0, y + th * 0.27, 0], r: [0, Math.PI / 4, 0] }); P.push({ s: [w * 1.42, 0.35, w * 1.42], c: ROOF2, p: [0, y + 0.1, 0], r: [0, 0, 0] }); y += th * 0.5; w *= 0.8; }
    P.push({ cyl: [0.25, 0.5, th * 1.6, 8], c: GOLD, p: [0, y + th * 0.8, 0] }); for (let k = 0; k < 4; k++) P.push({ cyl: [w * 0.18, w * 0.18, 0.25, 12], c: GOLD, p: [0, y + 0.4 + k * th * 0.32, 0] });
    return bakeBox(P);
  }
  // une lanterne de pierre (toro)
  function toro() { return bakeBox([{ s: [1.4, 0.4, 1.4], c: STONE, p: [0, 0.2, 0] }, { cyl: [0.25, 0.32, 1.8, 6], c: STONE, p: [0, 1.3, 0] }, { s: [1.2, 0.3, 1.2], c: STONE, p: [0, 2.3, 0] }, { s: [0.8, 0.8, 0.8], c: '#ffd890', p: [0, 2.85, 0] }, { cyl: [0.12, 1.0, 0.7, 4], c: STONE, p: [0, 3.6, 0], r: [0, Math.PI / 4, 0] }]); }
  // un etal de fete : planches, auvent de toile rayee
  function stall(c) { return bakeBox([{ s: [4, 1.1, 2], c: WOOD, p: [0, 0.55, 0] }, { s: [0.2, 3, 0.2], c: WOOD, p: [-1.9, 1.5, -0.9] }, { s: [0.2, 3, 0.2], c: WOOD, p: [1.9, 1.5, -0.9] }, { s: [0.2, 3, 0.2], c: WOOD, p: [-1.9, 1.5, 0.9] }, { s: [0.2, 3, 0.2], c: WOOD, p: [1.9, 1.5, 0.9] }, { s: [4.6, 0.15, 2.6], c, p: [0, 3.05, 0], r: [0.12, 0, 0] }]); }

  // ============================== LE SOL ==============================
  function terrain(PA, grp) {
    const P0 = PA.O, R0 = PA.R0, F0 = PA.F0, Dn = []; for (let d = 0; d <= 120; d += 6) Dn.push(d); for (let d = 130; d <= 240; d += 10) Dn.push(d); { let d = 240, st = 15; while (d < 1150) { d += st; st *= 1.2; Dn.push(Math.round(d)); } }
    const D = [...Dn.slice(1).reverse().map((d) => -d), ...Dn], nc = D.length, rows = []; for (let w = -500; w <= WE + 700; w += (w > WC - 160 && w < WG + 160) || (w > WG && w < WT + 300) ? 7.5 : 12) rows.push(w); const nr = rows.length;
    const pos = new Float32Array(nr * nc * 3), col = new Float32Array(nr * nc * 3), idx = [], c = new T3.Color();
    const CC_ = (h) => new T3.Color(h), K = { vil: CC_('#86a64c'), stone: CC_('#b4a68a'), moss: CC_('#527f36'), moss2: CC_('#3f6c2c'), cer: CC_('#93b552'), petal: CC_('#f4c8d4'), rock: CC_('#8c8474'), rock2: CC_('#6e685c'), plat: CC_('#8aa858'), far: CC_('#6c8266'), bed: CC_('#5a6a4c'), sand: CC_('#cbb68c'), trail: CC_('#b4a07a'), paddy: CC_('#8ab4b8'), rice: CC_('#9cc85a'), rice2: CC_('#b8d468'), riser: CC_('#7c6a48'), water: CC_('#4a8ab8') };
    for (let j = 0; j < nr; j++) { const w = rows[j], pu = pathU(w);
      for (let i = 0; i < nc; i++) { const d = D[i], u = pu + d, h = H(u, w), k = (j * nc + i) * 3, ad = Math.abs(d);
        pos[k] = P0.x + R0.x * u + F0.x * w; pos[k + 1] = P0.y + h; pos[k + 2] = P0.z + R0.z * u + F0.z * w;
        const sl = Math.min(2, (Math.abs(H(u + 4, w) - H(u - 4, w)) + Math.abs(H(u, w + 4) - H(u, w - 4))) / 8), nz = fbm(u * 0.05, w * 0.05);
        if (w < WB) c.copy(K.vil).lerp(K.moss, ss(WB - 120, WB, w)); else if (w < WC) c.copy(nz > 0.55 ? K.moss : K.moss2).lerp(K.cer, ss(WC - 100, WC + 60, w)); else if (w < WG) c.copy(K.cer).lerp(K.petal, ss(0.62, 0.74, nz) * 0.8); else if (w < WT) c.copy(K.moss).lerp(K.plat, ss(WT - 60, WT + 40, w)); else c.copy(K.plat);
        if (w > WC && w < WG && ad < 120) c.lerp(K.petal, 0.25 * (1 - ss(20, 120, ad)));   // les petales tombes pres du chemin
        if (ad < 3.2 && w > 60 && w < WM && gorgeK(w) < 0.5) c.lerp(K.trail, 0.85);   // un sentier de terre sous la voie
        if (cherK(w) > 0.5 && ad > 47) { const tk = Math.floor((h - baseW(w)) / 3.2); if (sl < 0.2) c.copy(hsh(tk, Math.floor(w / 60)) < 0.45 ? K.paddy : K.rice).lerp(K.rice2, hsh(tk + 3, Math.floor(u / 50)) * 0.5); else c.copy(K.riser); }
        if (cherK(w) > 0.5 && Math.abs(d - streamD(w)) < 4.5) c.copy(K.water);
        if (gorgeK(w) > 0.3 && ad > 30) c.lerp(Math.floor(h / 14) % 2 ? K.rock : K.rock2, 0.55 * ss(30, 50, ad));
        if (gorgeK(w) > 0.3 && ad < 15) c.lerp(ad < 10 ? K.bed : K.sand, gorgeK(w));
        c.lerp(sl > 0.55 ? K.rock2 : K.rock, ss(0.45, 0.95, sl));   // la roche dans les pentes
        c.lerp(K.far, ss(300, 700, ad) * 0.6);
        if (w > -80 && w < 175 && ad < 42) { const ch = (Math.floor(u / 4) + Math.floor(w / 4)) % 2 ? 1 : 0.93; c.copy(K.stone).multiplyScalar(ch); }   // la place du village, dallee
        const j2 = 0.94 + 0.12 * hsh(i * 3.1, j * 1.7); col[k] = c.r * j2; col[k + 1] = c.g * j2; col[k + 2] = c.b * j2; } }
    for (let j = 0; j < nr - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c2 = a + nc, d2 = c2 + 1; idx.push(a, c2, b, b, c2, d2); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    // le triangle (a, c2, b) doit regarder vers le haut : sinon on retourne l'ordre
    { const n = geo.attributes.normal; let up = 0; for (let i = 0; i < n.count; i += 97) up += n.getY(i); if (up < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } geo.setIndex(idx); geo.computeVertexNormals(); } }
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true })); m.material.color.setScalar(0.62); m.frustumCulled = false; grp.add(m); L.ground = m;
  }
  const gH = (x, z) => { const q = L.PA.loc(_c.set(x, 0, z)); return L.PA.O.y + H(q[0], q[1]); };
  const atUW = (u, w, dy) => new V().copy(L.PA.O).addScaledVector(L.PA.R0, u).addScaledVector(L.PA.F0, w).setY(L.PA.O.y + H(u, w) + (dy || 0));
  const yawW = (w) => Math.atan2(-(L.PA.F0.x), -(L.PA.F0.z)) - Math.atan2(pathU(w + 5) - pathU(w - 5), 10);

  // ============================== LA VEGETATION ET LES OMBRES (en lots) ==============================
  const BAM = [], TREES = [], PINES = [], ROCKS = [], SHAD = [];
  const shad = (p, r) => SHAD.push([p.x, p.y, p.z, r]);
  function plants(grp) {
    const o = new T3.Object3D(), c = new T3.Color();
    // LES BAMBOUS : tiges a noeuds (couleurs dans la geometrie), touffes de feuilles en haut
    if (BAM.length) { const sg = new T3.CylinderGeometry(0.26, 0.32, 1, 6, 14, true).translate(0, 0.5, 0), P = sg.attributes.position, cl = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) { const y = P.getY(i), node = Math.abs(((y * 14) % 1)) < 0.01 || Math.abs(((y * 14) % 1) - 1) < 0.01; const k = Math.round(y * 14) % 2 === 0 ? 1 : 0.86; c.set(node && y > 0.02 ? '#c8d070' : '#ffffff').multiplyScalar(k); cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b; }
      sg.setAttribute('color', new T3.BufferAttribute(cl, 3));
      const st = new T3.InstancedMesh(sg, new T3.MeshLambertMaterial({ vertexColors: true }), BAM.length), lv = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 0), new T3.MeshLambertMaterial({ flatShading: true }), BAM.length * 2);
      BAM.forEach((b, i) => { o.position.set(b.x, b.y - 0.5, b.z); o.rotation.set(b.lx || 0, 0, b.lz || 0); o.scale.set(b.r / 0.3, b.h + 0.5, b.r / 0.3); o.updateMatrix(); st.setMatrixAt(i, o.matrix); st.setColorAt(i, c.set(['#5f9a34', '#6aa83a', '#7aaa3c', '#548c2e', '#8aa83e'][i % 5]));
        for (let k = 0; k < 2; k++) { const f = 0.72 + k * 0.2, sc = b.h * (0.12 + 0.03 * k); o.position.set(b.x + Math.sin(b.lz || 0) * -b.h * f + rr(-1.5, 1.5), b.y + b.h * f, b.z + Math.sin(b.lx || 0) * b.h * f + rr(-1.5, 1.5)); o.rotation.set(rr(0, 3), rr(0, 6), rr(0, 3)); o.scale.set(sc * 1.4, sc * 0.45, sc); o.updateMatrix(); lv.setMatrixAt(i * 2 + k, o.matrix); lv.setColorAt(i * 2 + k, c.set(['#4a8a2a', '#5a9a34', '#3e7a26', '#6aa83c'][(i + k) % 4])); } });
      st.frustumCulled = lv.frustumCulled = false; grp.add(st); grp.add(lv); }
    // LES CERISIERS : tronc sombre, deux branches, trois nuages de fleurs roses
    if (TREES.length) { const tg = new T3.CylinderGeometry(0.22, 0.42, 1, 6).translate(0, 0.5, 0), tr = new T3.InstancedMesh(tg, lam('#4a3228'), TREES.length * 3), bl = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 1), new T3.MeshLambertMaterial({ flatShading: true }), TREES.length * 3);
      TREES.forEach((t, i) => { const k = t.k; o.position.set(t.x, t.y - 0.3, t.z); o.rotation.set(0, t.ry, 0.12); o.scale.set(k, 4.6 * k, k); o.updateMatrix(); tr.setMatrixAt(i * 3, o.matrix);
        for (let b = 0; b < 2; b++) { const a = t.ry + b * 2.6; o.position.set(t.x, t.y + 3.6 * k, t.z); o.rotation.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9); o.scale.set(k * 0.6, 3.4 * k, k * 0.6); o.updateMatrix(); tr.setMatrixAt(i * 3 + 1 + b, o.matrix); }
        for (let b = 0; b < 3; b++) { const a = t.ry + b * 2.1; o.position.set(t.x + Math.cos(a) * 1.8 * k, t.y + (5.6 + (b === 2 ? 1.6 : 0)) * k, t.z + Math.sin(a) * 1.8 * k); o.rotation.set(rr(0, 3), rr(0, 3), 0); o.scale.set(2.8 * k, 2.0 * k, 2.6 * k); o.updateMatrix(); bl.setMatrixAt(i * 3 + b, o.matrix); bl.setColorAt(i * 3 + b, c.set(t.white ? ['#fbeef2', '#f6e2ea', '#fff6f8'][b] : ['#f4b0c6', '#f8c6d6', '#ec9cb8', '#fbd4e0'][(i + b) % 4])); } });
      tr.frustumCulled = bl.frustumCulled = false; grp.add(tr); grp.add(bl); }
    // LES PINS (bords de la gorge, plateau) : tronc tordu, nappes d'aiguilles plates
    if (PINES.length) { const tr = new T3.InstancedMesh(new T3.CylinderGeometry(0.3, 0.5, 1, 6).translate(0, 0.5, 0), lam('#4e3a2c'), PINES.length), nd = new T3.InstancedMesh(new T3.CylinderGeometry(1, 0.85, 0.5, 9), new T3.MeshLambertMaterial({ flatShading: true }), PINES.length * 3);
      PINES.forEach((t, i) => { const k = t.k; o.position.set(t.x, t.y - 0.3, t.z); o.rotation.set(0.12, t.ry, -0.1); o.scale.set(k, 7 * k, k); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
        for (let b = 0; b < 3; b++) { const a = t.ry + b * 2.3; o.position.set(t.x + Math.cos(a) * 1.6 * k, t.y + (4.4 + b * 1.4) * k, t.z + Math.sin(a) * 1.6 * k); o.rotation.set(0, a, 0); o.scale.set((3.4 - b * 0.7) * k, k, (2.6 - b * 0.5) * k); o.updateMatrix(); nd.setMatrixAt(i * 3 + b, o.matrix); nd.setColorAt(i * 3 + b, c.set(['#2e5a36', '#3a6a3e', '#28503a'][b])); } });
      tr.frustumCulled = nd.frustumCulled = false; grp.add(tr); grp.add(nd); }
    // LES ROCHERS
    if (ROCKS.length) { const rg = lumpGeo(1, 0.7, 1, 2.3, 1, 0.22), rk = new T3.InstancedMesh(rg, new T3.MeshLambertMaterial({ flatShading: true }), ROCKS.length);
      ROCKS.forEach((r, i) => { o.position.set(r.x, r.y + r.k * 0.2, r.z); o.rotation.set(0, rr(0, 6), 0); o.scale.set(r.k, r.k * (r.tall || 1), r.k); o.updateMatrix(); rk.setMatrixAt(i, o.matrix); rk.setColorAt(i, c.set(['#8a8474', '#7a7466', '#9a9282', '#6e6a5e'][i % 4]).lerp(_c4.set('#5a7a3a'), i % 3 === 0 ? 0.3 : 0)); });
      rk.frustumCulled = false; grp.add(rk); }
    // LES OMBRES de tout ce qui est pose au sol
    if (SHAD.length) { const sm = new T3.InstancedMesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#1a2410' }), SHAD.length);
      SHAD.forEach((s, i) => { o.position.set(s[0] + s[3] * 0.25, s[1] + 0.25, s[2] + s[3] * 0.2); o.rotation.set(0, 0, 0); o.scale.set(s[3], 1, s[3]); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.renderOrder = 1; sm.frustumCulled = false; grp.add(sm); }
  }
  // remplit une zone (w0..w1, distance a la voie d0..d1) avec un type de plante ; jamais dans le couloir de vol
  function scatter(list, n, w0, w1, d0, d1, mk) { for (let k = 0, t = 0; k < n && t < n * 6; t++) { const w = rr(w0, w1), sd = Math.random() < 0.5 ? -1 : 1, d = sd * (d0 + Math.pow(Math.random(), 1.6) * (d1 - d0)), u = pathU(w) + d, p = atUW(u, w); if (Math.abs(H(u + 3, w) - H(u - 3, w)) > 4.5) continue; list.push(mk(p, u, w)); k++; } }

  // ============================== LE DECOR, zone par zone ==============================
  function decor(PA, grp) {
    // 1. LE VILLAGE : la place dallee, des maisons tout autour, des etals, des lanternes de pierre, des guirlandes de lanternes rouges, le pas de tir en bambou
    const VG = new T3.Group(); grp.add(VG); L.villG = VG;
    const putB = (o, u, w, ry, r) => { const p = atUW(u, w); o.position.copy(p); o.rotation.y = ry; VG.add(o); shad(p, r); return o; };
    const yw = yawW(0);
    for (let k = 0; k < 9; k++) { const w = -60 + k * 26, sd = k % 2 ? 1 : -1; putB(house(10, 8, 4.2), sd * rr(52, 60), w, yw + (sd > 0 ? -Math.PI / 2 : Math.PI / 2), 8); putB(house(9, 7, 3.6), sd * rr(76, 90), w + 10, yw + rr(-0.3, 0.3), 7); }
    for (let k = 0; k < 6; k++) { const w = -30 + k * 30; putB(stall(['#c8321e', '#e8b84a', '#2a9a6a'][k % 3]), (k % 2 ? 1 : -1) * 36, w, yw + (k % 2 ? -Math.PI / 2 : Math.PI / 2), 3); }
    for (let k = 0; k < 10; k++) { const w = -50 + k * 22; for (const sd of [-1, 1]) putB(toro(), sd * 30, w, yw, 1.4); }
    putB(pagoda(5, 9, 5), -120, 120, yw, 10); putB(pagoda(3, 7, 4.4), 140, -40, yw, 8);
    { const P = []; for (const sd of [-1, 1]) P.push({ cyl: [0.9, 1.1, 16, 12], c: RED, p: [sd * 9, 8, 0] }); P.push({ s: [26, 1.4, 2.2], c: '#1e1a1a', p: [0, 16.4, 0] }, { s: [22, 0.9, 1.4], c: RED, p: [0, 13.6, 0] }, { s: [1.2, 2.6, 1], c: RED, p: [0, 15, 0] });
      for (const sd of [-1, 1]) P.push({ s: [3, 1, 2.3], c: '#1e1a1a', p: [sd * 13.6, 16.9, 0], r: [0, 0, sd * 0.25] }); const t = bakeBox(P); putB(t, 0, 185, yw, 6); shad(atUW(9, 185), 2.5); shad(atUW(-9, 185), 2.5); }   // une porte torii au bout de la place
    // les guirlandes de lanternes en travers de la place
    L.lanterns = []; const LM = [bas('#ff5a3a'), bas('#ffb04a')], lg = new T3.SphereGeometry(0.9, 10, 8);
    for (let k = 0; k < 5; k++) { const w = [-50, 30, 70, 110, 150][k], a = atUW(-31, w, 14), b = atUW(31, w, 14); for (const p of [a, b]) { const pole = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.25, 14.5, 6), lam(WOOD)); pole.position.copy(p).setY(p.y - 7.1); VG.add(pole); shad(new V(p.x, p.y - 14, p.z), 0.8); }
      const n = 14; for (let i = 0; i <= n; i++) { const t = i / n, p = new V().lerpVectors(a, b, t); p.y -= 2.4 * Math.sin(t * Math.PI); if (i > 0 && i < n) { const l = new T3.Mesh(lg, LM[i % 2]); l.scale.set(1, 1.25, 1); l.position.copy(p).setY(p.y - 1.1); VG.add(l); if (i % 3 === 0) { const gw = glowS(5, '#ffb070', 0.5); gw.position.copy(l.position); VG.add(gw); } } }
      const cg = new T3.BufferGeometry().setFromPoints(Array.from({ length: 21 }, (_, i) => { const t = i / 20, p = new V().lerpVectors(a, b, t); p.y -= 2.4 * Math.sin(t * Math.PI); return p; })); VG.add(new T3.Line(cg, new T3.LineBasicMaterial({ color: '#2a1a14' }))); }
    // le pas de tir : un chevalet de bambou sous la fusee, des caisses de fusees
    { const O = PA.fr(0).p, P = [], Lr = L.rkL; for (const sd of [-1, 1]) for (const fz of [-0.3, 0.3]) P.push({ cyl: [0.04, 0.05, 1.5, 6], c: '#b8a050', p: [sd * 0.3, -0.75, fz * Lr], r: [0, 0, -sd * 0.42] });
      P.push({ cyl: [0.035, 0.035, Lr * 0.9, 6], c: '#b8a050', p: [0, -0.22, 0], r: [Math.PI / 2, 0, 0] }, { s: [1.6, 0.25, Lr * 1.0], c: WOOD, p: [0, -2.08, 0] });
      for (let k = 0; k < 4; k++) P.push({ s: [1.2, 0.9, 0.9], c: k % 2 ? RED : '#c89a3a', p: [-2.4 - (k % 2) * 1.3, -1.75, -1 + Math.floor(k / 2) * 1.1] });
      const r = bakeBox(P); r.position.copy(O); r.quaternion.setFromRotationMatrix(_m.makeBasis(PA.R0, new V(0, 1, 0), _d.copy(PA.F0).negate())); grp.add(r); L.rack = r; shad(new V(O.x, O.y - 2.2, O.z), 3); }
    // 2. LA FORET DE BAMBOUS : tres dense des deux cotes, quelques rochers moussus
    scatter(BAM, 3400, WB - 40, WC + 60, 23, 240, (p, u, w) => { const h = rr(16, 30); shad(p, 1.4); return { x: p.x, y: p.y, z: p.z, h, r: rr(0.24, 0.4), lx: rr(-0.06, 0.06), lz: rr(-0.06, 0.06) }; });
    scatter(ROCKS, 60, WB, WC, 26, 160, (p) => { const k = rr(1.2, 3); shad(p, k * 1.2); return { x: p.x, y: p.y, z: p.z, k }; });
    scatter(BAM, 260, -80, WB, 70, 200, (p) => { shad(p, 1.4); return { x: p.x, y: p.y, z: p.z, h: rr(14, 24), r: rr(0.24, 0.36) }; });
    // 3. LES CERISIERS : des centaines, quelques maisons sur les collines, un petit sanctuaire
    scatter(TREES, 300, WC - 60, WG + 40, 40, 320, (p) => { const k = rr(1.3, 2.2); shad(p, 5 * k); return { x: p.x, y: p.y, z: p.z, k, ry: rr(0, 6), white: Math.random() < 0.15 }; });
    for (let k = 0; k < 8; k++) { const w = WC + 80 + k * 140, sd = k % 2 ? 1 : -1, u = pathU(w) + sd * rr(90, 200), p = atUW(u, w), h = house(rr(9, 12), rr(7, 9), rr(3.6, 4.4)); h.position.copy(p); h.rotation.y = rr(0, 6); grp.add(h); shad(p, 8); }
    { const w = WC + 620, u = pathU(w) + 70, p = atUW(u, w), pg = pagoda(3, 8, 4.4); pg.position.copy(p); pg.rotation.y = yawW(w); grp.add(pg); shad(p, 9); }
    // 4. LA GORGE : des pins accroches au bord des parois, des rochers dans la riviere et sur les berges
    scatter(PINES, 160, WG + 60, WT - 30, 84, 200, (p) => { const k = rr(1.2, 2.2); shad(p, 4 * k); return { x: p.x, y: p.y, z: p.z, k, ry: rr(0, 6) }; });
    scatter(ROCKS, 120, WG + 40, WT - 60, 17, 34, (p) => { const k = rr(1.0, 2.4); shad(p, k * 1.2); return { x: p.x, y: p.y, z: p.z, k }; });
    scatter(BAM, 300, WG - 60, WG + 400, 40, 120, (p) => { shad(p, 1.4); return { x: p.x, y: p.y, z: p.z, h: rr(14, 22), r: rr(0.24, 0.36) }; });
    // 5. LE PLATEAU DU TEMPLE : la grande salle, une haute pagode, des lanternes de pierre en allee, pins et cerisiers blancs
    { const w = 4300, u = pathU(w) + 80, p = atUW(u, w), pg = pagoda(7, 14, 7); pg.position.copy(p); pg.rotation.y = yawW(w); grp.add(pg); shad(p, 14); }
    { const w = 4620, u = pathU(w) - 95, p = atUW(u, w), h = house(46, 28, 12); h.position.copy(p); h.rotation.y = yawW(w); grp.add(h); shad(p, 26); }
    for (let k = 0; k < 6; k++) { const w = 3900 + k * 160, sd = k % 2 ? 1 : -1, u = pathU(w) + sd * rr(110, 160), p = atUW(u, w), h = house(rr(10, 14), rr(8, 10), rr(4, 5)); h.position.copy(p); h.rotation.y = yawW(w) + rr(-0.4, 0.4); grp.add(h); shad(p, 9); }
    for (let w = 3800; w < WM - 40; w += 26) for (const sd of [-1, 1]) { const u = pathU(w) + sd * 34, p = atUW(u, w), t = toro(); t.position.copy(p); t.rotation.y = yawW(w); grp.add(t); shad(p, 1.4); }
    scatter(PINES, 120, WT + 40, WM + 200, 50, 300, (p) => { const k = rr(1.3, 2.4); shad(p, 4 * k); return { x: p.x, y: p.y, z: p.z, k, ry: rr(0, 6) }; });
    scatter(TREES, 90, WT + 40, WM + 200, 46, 260, (p) => { const k = rr(1.2, 2); shad(p, 5 * k); return { x: p.x, y: p.y, z: p.z, k, ry: rr(0, 6), white: Math.random() < 0.6 }; });
    scatter(ROCKS, 70, WT + 40, WM + 400, 40, 260, (p) => { const k = rr(1.6, 4); shad(p, k * 1.2); return { x: p.x, y: p.y, z: p.z, k }; });
    // L'EAU : la riviere de la gorge, la cascade (deux voiles qui defilent), le bassin, l'ecume
    { const T1 = waterTex(false), T2 = waterTex(true); L.wTex = [T1, T2]; const pos = [], uv = [], idx = []; let n = 0;
      for (let w = WG; w <= 3690; w += 6) { const pu = pathU(w), y = PA.O.y + baseW(w) - 1.2; for (const d of [-13, 13]) { const p = atUW(pu + d, w); pos.push(p.x, y, p.z); uv.push(d > 0 ? 1 : 0, w / 40); } if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } n++; }
      const rg = new T3.BufferGeometry(); rg.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); rg.setIndex(idx); rg.computeVertexNormals();
      const rm = new T3.Mesh(rg, new T3.MeshBasicMaterial({ map: T1, side: T3.DoubleSide })); rm.frustumCulled = false; grp.add(rm);
      // la cascade : un voile de 160 m sur la falaise, un second plus clair devant, un peu decale
      const wf = 3700, pu = pathU(wf), y0 = PA.O.y + 58, y1 = PA.O.y + 222;
      for (const [dw, op, wid, tex] of [[0, 1, 44, T2], [-3, 0.55, 36, T2]]) { const g2 = new T3.PlaneGeometry(wid, y1 - y0, 6, 24), m2 = new T3.Mesh(g2, new T3.MeshBasicMaterial({ map: tex, transparent: op < 1, opacity: op, side: T3.DoubleSide, depthWrite: op >= 1 })); m2.position.copy(atUW(pu, wf + dw - 4)).setY((y0 + y1) / 2); m2.rotation.y = yawW(wf); grp.add(m2); }
      const pool = new T3.Mesh(new T3.CircleGeometry(30, 32), new T3.MeshBasicMaterial({ map: T1 })); pool.rotation.x = -Math.PI / 2; pool.position.copy(atUW(pu, wf - 22)).setY(PA.O.y + 58.4); grp.add(pool);
      L.foamAt = atUW(pu, wf - 8).setY(PA.O.y + 60); L.fallTop = atUW(pu, wf).setY(y1); }
    // les nuages de brume (gorge, plateau) et la mer de nuages sous le ciel de fete
    { const X = puffTex(), M = cloudMat(X), P = [];
      for (let k = 0; k < 120; k++) { const w = rr(WG + 100, WT + 300), d = rr(-120, 120), p = atUW(pathU(w) + d, w); P.push([p.x, Math.max(p.y, PA.O.y + baseW(w)) + rr(20, 120), p.z, rr(50, 110)]); }
      for (let k = 0; k < 260; k++) { const w = rr(WM, WE + 900), d = rr(-900, 900), p = atUW(pathU(w) + d, w); P.push([p.x, PA.O.y + rr(380, 450), p.z, rr(140, 260)]); }
      const im = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), M, P.length), o = new T3.Object3D(); P.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.scale.setScalar(q[3]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.frustumCulled = false; im.renderOrder = 4; grp.add(im); L.cloudM = M; }
    // ---------- v436 : PLUS DE RELIEF ET DE DETAILS ----------
    // LES PICS KARSTIQUES : de hautes tours de calcaire, sommet vert, quelques pins dessus ; au loin des cerisiers, autour du temple, et qui percent la mer de nuages du ciel de fete
    { const KS = []; const add = (u, w, hh, r) => { const p = atUW(u, w); KS.push({ p, hh, r }); shad(p, r * 1.3); if (Math.random() < 0.7) for (let k = 0; k < 3; k++) PINES.push({ x: p.x + rr(-r, r) * 0.4, y: p.y + hh - 1.5, z: p.z + rr(-r, r) * 0.4, k: rr(1.2, 2.2), ry: rr(0, 6) }); };
      for (let k = 0; k < 34; k++) { const w = rr(WC - 100, WG + 200), sd = Math.random() < 0.5 ? -1 : 1; add(pathU(w) + sd * rr(300, 820), w, rr(140, 300), rr(24, 46)); }
      for (let k = 0; k < 30; k++) { const w = rr(WT, WM + 200), sd = Math.random() < 0.5 ? -1 : 1; add(pathU(w) + sd * rr(260, 700), w, rr(160, 320), rr(26, 50)); }
      for (let k = 0; k < 46; k++) { const w = rr(WM - 100, WE + 600), sd = Math.random() < 0.5 ? -1 : 1, ad = rr(120, 720); add(pathU(Math.min(w, WE)) + sd * ad, w, rr(260, 460) - (ad < 200 ? 90 : 0), rr(22, 48)); }
      for (let k = 0; k < 18; k++) { const w = rr(WG + 120, WT - 120), sd = Math.random() < 0.5 ? -1 : 1; add(pathU(w) + sd * rr(92, 170), w, rr(50, 120), rr(8, 16)); }
      const kg = new T3.CylinderGeometry(0.62, 1, 1, 10, 8).translate(0, 0.5, 0), P = kg.attributes.position, cl = new Float32Array(P.count * 3), q = new V(), ca = new T3.Color('#8e948a'), cb = new T3.Color('#6a7466'), cg = new T3.Color('#4e7a3a');
      for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i); const a = Math.atan2(q.z, q.x), wv = 1 + 0.16 * Math.sin(a * 3 + q.y * 7) + 0.1 * Math.sin(a * 7 - q.y * 13) + 0.08 * Math.sin(q.y * 23); P.setXYZ(i, q.x * wv, q.y, q.z * wv); const cc = ca.clone().lerp(cb, 0.5 + 0.5 * Math.sin(q.y * 31 + a)).lerp(cg, ss(0.86, 0.97, q.y)); cl[i * 3] = cc.r; cl[i * 3 + 1] = cc.g; cl[i * 3 + 2] = cc.b; }
      kg.setAttribute('color', new T3.BufferAttribute(cl, 3)); kg.computeVertexNormals();
      const im = new T3.InstancedMesh(kg, new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true }), KS.length), o = new T3.Object3D();
      KS.forEach((k, i) => { o.position.copy(k.p).setY(k.p.y - 4); o.rotation.set(rr(-0.04, 0.04), rr(0, 6), rr(-0.04, 0.04)); o.scale.set(k.r, k.hh + 4, k.r * rr(0.8, 1.2)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.frustumCulled = false; grp.add(im); }
    // DES HERBES ET DES FOUGERES au bord du sentier (foret, cerisiers, plateau, village)
    { const G = []; for (const [w0, w1, n] of [[-60, WB, 500], [WB, WC, 1800], [WC, WG, 1800], [WT, WM, 1500]]) for (let k = 0; k < n; k++) { const w = rr(w0, w1), sd = Math.random() < 0.5 ? -1 : 1, d = sd * (4 + Math.pow(Math.random(), 1.4) * 70), u = pathU(w) + d; if (w < 175 && Math.abs(d) < 44) continue; G.push([atUW(u, w), w]); }
      const tg = new T3.ConeGeometry(0.35, 1, 4, 1).translate(0, 0.5, 0), im = new T3.InstancedMesh(tg, new T3.MeshLambertMaterial({ flatShading: true }), G.length * 3), o = new T3.Object3D(), c = new T3.Color();
      G.forEach(([p, w], i) => { const cher = w > WC && w < WG, cols = cher ? ['#7aa844', '#8ab84c', '#f0b8c8'] : w > WT ? ['#7a9a44', '#8aa84c', '#6a8a3a'] : ['#4a7a2c', '#5a8a34', '#3e6a26'];
        for (let k = 0; k < 3; k++) { o.position.set(p.x + rr(-0.6, 0.6), p.y - 0.1, p.z + rr(-0.6, 0.6)); o.rotation.set(rr(-0.35, 0.35), rr(0, 6), rr(-0.35, 0.35)); const s = rr(0.7, 1.5); o.scale.set(s, s * rr(1.2, 2.2), s); o.updateMatrix(); im.setMatrixAt(i * 3 + k, o.matrix); im.setColorAt(i * 3 + k, c.set(cols[cher && Math.random() < 0.3 ? 2 : k % 2])); } });
      im.frustumCulled = false; grp.add(im); }
    // LE RUISSEAU des cerisiers et ses PONTS ROUGES en arc
    { const pos = [], uv = [], idx = []; let n = 0; for (let w = WC - 20; w <= WG + 20; w += 6) { const u0 = pathU(w) + streamD(w), y = PA.O.y + H(u0, w) + 0.7; for (const dd of [-4.2, 4.2]) { const p = atUW(u0 + dd, w); pos.push(p.x, y, p.z); uv.push(dd > 0 ? 1 : 0, w / 30); } if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } n++; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); const sm = new T3.Mesh(geo, new T3.MeshBasicMaterial({ map: L.wTex[0], side: T3.DoubleSide })); sm.frustumCulled = false; grp.add(sm);
      for (const w of [1880, 2240, 2620]) { const u0 = pathU(w) + streamD(w), p = atUW(u0, w), br = new T3.Group(); br.position.copy(p).setY(p.y + 0.4); br.rotation.y = yawW(w) + Math.PI / 2; grp.add(br);
        const arc = new T3.Mesh(new T3.TorusGeometry(7, 0.55, 8, 24, Math.PI), lam(RED)); br.add(arc); for (const z of [-1.4, 1.4]) { const r2 = new T3.Mesh(new T3.TorusGeometry(7.9, 0.16, 6, 24, Math.PI), lam(RED)); r2.position.set(0, 0.2, z); br.add(r2); for (let k = 1; k < 8; k++) { const a = k / 8 * Math.PI, pst = new T3.Mesh(new T3.BoxGeometry(0.18, 1.1, 0.18), lam(RED)); pst.position.set(Math.cos(a) * 7.5, Math.sin(a) * 7.5 + 0.4, z); br.add(pst); } }
        for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI, pl = new T3.Mesh(new T3.BoxGeometry(1.5, 0.22, 2.8), lam('#6a4a2c')); pl.position.set(Math.cos(a) * 7.05, Math.sin(a) * 7.05 + 0.5, 0); pl.rotation.z = a - Math.PI / 2; br.add(pl); }
        shad(p, 6); for (const sd of [-1, 1]) { const t = toro(); t.position.copy(atUW(u0 + sd * 10, w + 4)); grp.add(t); shad(t.position, 1.4); } } }
    // LE VILLAGE : des grands drapeaux de fete (nobori) autour de la place, des maisons qui montent sur les collines
    { const FC = ['#c8321e', '#e8b84a', '#2a6ad0', '#2a9a6a', '#f2ead6']; for (let k = 0; k < 14; k++) { const w = -55 + k * 16, sd = k % 2 ? 1 : -1, p = atUW(sd * 40, w), g2 = new T3.Group(); g2.position.copy(p); g2.rotation.y = yawW(w); grp.add(g2);
        const pole = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.12, 9, 6), lam(WOOD)); pole.position.y = 4.5; g2.add(pole); const fl = new T3.Mesh(new T3.PlaneGeometry(1.4, 5.5), lam(FC[k % FC.length], { side: T3.DoubleSide })); fl.position.set(sd * -0.75, 5.6, 0); fl.rotation.y = Math.PI / 2; g2.add(fl); const bar = new T3.Mesh(new T3.BoxGeometry(0.08, 0.08, 1.6), lam(WOOD)); bar.position.set(0, 8.4, 0); bar.rotation.y = Math.PI / 2; g2.add(bar); shad(p, 0.8); }
      for (let k = 0; k < 16; k++) { const w = rr(-200, 260), sd = Math.random() < 0.5 ? -1 : 1, u = sd * rr(110, 240), p = atUW(u, w), h = house(rr(8, 12), rr(7, 9), rr(3.4, 4.4)); h.position.copy(p); h.rotation.y = yawW(w) + rr(-0.5, 0.5); grp.add(h); shad(p, 8); } }
    // LE TEMPLE : un grand escalier de pierre jusqu'a la salle, posee sur un socle ; deux pagodes de plus
    { const w = 4620, u = pathU(w) - 95, p = atUW(u, w), P2 = []; for (let k = 0; k < 10; k++) P2.push({ s: [22, 0.6 * (k + 1), 2.2], c: STONE, p: [0, 0.3 * (k + 1), 30 - k * 2.2] }); P2.push({ s: [54, 6, 34], c: STONE, p: [0, 3, 0] });
      const st = bakeBox(P2); st.position.copy(p).setY(p.y - 0.2); st.rotation.y = yawW(w); grp.add(st); shad(p, 30); }
    for (const [w, du, n] of [[3990, 120, 5], [4820, -130, 5], [4450, -210, 3]]) { const u = pathU(w) + du, p = atUW(u, w), pg = pagoda(n, 10, 5.5); pg.position.copy(p); pg.rotation.y = yawW(w); grp.add(pg); shad(p, 10); }
    // LA GORGE : de petites cascades qui tombent des parois
    for (const [w, sd] of [[3020, 1], [3150, -1], [3300, 1], [3470, -1]]) { const u = pathU(w) + sd * 44, top = PA.O.y + H(pathU(w) + sd * 70, w) - 6, bot = PA.O.y + baseW(w), m2 = new T3.Mesh(new T3.PlaneGeometry(6, top - bot), new T3.MeshBasicMaterial({ map: L.wTex[1], transparent: true, opacity: 0.85, side: T3.DoubleSide, depthWrite: false }));
      m2.position.copy(atUW(u, w)).setY((top + bot) / 2); m2.rotation.y = yawW(w) + Math.PI / 2; grp.add(m2); }
    plants(grp);
  }
  // les nuages (copie de ceux du niveau 5) : des bouffees douces tournees vers la camera
  let PUF = null; const puffTex = () => { if (PUF) return PUF; const c = document.createElement('canvas'); c.width = c.height = 128; const px = c.getContext('2d'); for (let k = 0; k < 9; k++) { const cx = 64 + (Math.random() - 0.5) * 60, cy = 70 + (Math.random() - 0.5) * 34, r = 22 + Math.random() * 18, gr = px.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); px.fillStyle = gr; px.fillRect(0, 0, 128, 128); } PUF = new T3.CanvasTexture(c); return PUF; };
  const cloudMat = (tex) => new T3.ShaderMaterial({ uniforms: { uMap: { value: tex }, uOp: { value: 0.55 }, uFar: { value: 2400 }, uC: { value: new T3.Color('#ffffff') } },
    vertexShader: 'varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float sc = length(instanceMatrix[0].xyz); c.xy += position.xy * sc; vD = -c.z; gl_Position = projectionMatrix * c; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uOp; uniform float uFar; uniform vec3 uC; varying vec2 vUv; varying float vD; void main(){ float a = texture2D(uMap, vUv).a; vec3 c = mix(uC * 0.82, uC, smoothstep(0.15, 0.85, vUv.y)); float k = uOp * smoothstep(20.0, 140.0, vD) * (1.0 - smoothstep(uFar * 0.6, uFar, vD)); if (a * k < 0.01) discard; gl_FragColor = vec4(c, a * k); }',
    transparent: true, depthWrite: false, fog: false });

  // ============================== LE CIEL : montagnes a l'encre au loin, soleil couchant, etoiles et lune ==============================
  function sky(g, PA) {
    const S = new T3.Group(); L.sky = S; g.scene.add(S); L.ink = [];
    // quatre rangees de crêtes, de plus en plus pales avec la distance (peinture a l'encre) ; elles entourent tout le niveau
    for (let k = 0; k < 4; k++) { const D = 1500 + k * 650, hk = 260 + k * 170, pos = [], idx = []; let n = 0;
      const ring = []; for (let w = -1200; w <= WE + 1500; w += 60) ring.push([pathU(Math.min(WE, Math.max(0, w))) - D, w]); for (let u = -D; u <= D; u += 60) ring.push([u, WE + 1500 + k * 300]); for (let w = WE + 1500; w >= -1200; w -= 60) ring.push([pathU(Math.min(WE, Math.max(0, w))) + D, w]);
      for (const [u, w] of ring) { const p = new V().copy(PA.O).addScaledVector(PA.R0, u).addScaledVector(PA.F0, w), top = hk * (0.45 + 0.8 * fbm(u * 0.0016 + k * 7, w * 0.0016)) + 140 * Math.pow(fbm(u * 0.005 + k, w * 0.005 + 2), 3);
        pos.push(p.x, PA.O.y - 80, p.z, p.x, PA.O.y + top, p.z); if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } n++; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ color: '#445566', fog: false, side: T3.DoubleSide })); m.frustumCulled = false; m.renderOrder = -6 - k; g.scene.add(m); L.ink.push({ m, k }); }
    if (EVO.boss2Kit) { const sun = EVO.boss2Kit.glow(520, '#ffd8a8'); sun.renderOrder = -9; S.add(sun); L.sun = sun; }
    { const n = 1800, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr(0.05, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * q * 520; pos[i * 3 + 1] = u * 520; pos[i * 3 + 2] = Math.sin(a) * q * 520; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ size: 2.4, sizeAttenuation: false, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, fog: false })); p.renderOrder = -10; S.add(p); L.stars = p; }
    { const mn = new T3.Mesh(new T3.CircleGeometry(26, 32), new T3.MeshBasicMaterial({ color: '#fff4dc', fog: false, transparent: true, opacity: 0, depthWrite: false })); mn.renderOrder = -9; S.add(mn); L.moon = mn; }
  }

  // ============================== LES FEUX D'ARTIFICE (bouquets de points qui s'ouvrent, retombent et s'eteignent) ==============================
  const FWC = ['#ff5a4a', '#ffd04a', '#7af0ff', '#ff8ad8', '#9aff6a', '#ffffff', '#c08aff', '#ffb04a'];
  function fwPool(grp) { L.fw = []; for (let k = 0; k < 16; k++) { const n = 160, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const p = new T3.Points(geo, new T3.PointsMaterial({ size: 2.4, map: dotTex(), transparent: true, opacity: 0, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); p.frustumCulled = false; p.visible = false; grp.add(p); L.fw.push({ p, pos, vel: new Float32Array(n * 3), t: 99, life: 2.6, n, gr: 5 }); } }
  function burst(c, col, sc, kind) { if (!L.fw) return; let F = L.fw.find((f) => f.t > f.life); if (!F) F = L.fw.reduce((a, b) => (a.t > b.t ? a : b)); sc = sc || 1;
    const willow = kind === 'willow', ring = kind === 'ring', sp = (willow ? 12 : 20) * sc, ax = new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize();
    for (let i = 0; i < F.n; i++) { let x, y, z; if (ring) { const a = i / F.n * 6.283; _a.set(Math.cos(a), Math.sin(a), 0); _b.copy(_a).applyAxisAngle(_c.set(1, 0, 0), ax.x * 1.4).applyAxisAngle(_d.set(0, 1, 0), ax.y * 3); x = _b.x; y = _b.y; z = _b.z; } else { const u = rr(-1, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); x = Math.cos(a) * q; y = u; z = Math.sin(a) * q; }
      const k = sp * (ring ? 1 : rr(0.82, 1)); F.vel[i * 3] = x * k; F.vel[i * 3 + 1] = y * k; F.vel[i * 3 + 2] = z * k; F.pos[i * 3] = c.x; F.pos[i * 3 + 1] = c.y; F.pos[i * 3 + 2] = c.z; }
    F.t = 0; F.life = willow ? 3.4 : 2.6; F.gr = willow ? 9 : 5; F.p.material.color.set(col); F.p.material.size = 2.4 * sc; F.p.material.opacity = 1; F.p.visible = true; F.p.geometry.attributes.position.needsUpdate = true; }
  function fwTick(dt) { for (const F of L.fw) { if (F.t > F.life) { if (F.p.visible) F.p.visible = false; continue; } F.t += dt; const dr = Math.exp(-dt * 1.7), P = F.pos, Vv = F.vel;
    for (let i = 0; i < F.n * 3; i += 3) { Vv[i] *= dr; Vv[i + 1] = Vv[i + 1] * dr - F.gr * dt; Vv[i + 2] *= dr; P[i] += Vv[i] * dt; P[i + 1] += Vv[i + 1] * dt; P[i + 2] += Vv[i + 2] * dt; }
    F.p.material.opacity = (1 - ss(F.life * 0.45, F.life, F.t)) * (0.85 + 0.15 * Math.sin(F.t * 40)); F.p.geometry.attributes.position.needsUpdate = true; } }

  // ============================== LES EPREUVES (testees dans la section de la voie : exactes et sans surprise) ==============================
  function obstacles(g, PA, grp) {
    const OB = L.O = [], sAt = (w) => PA.sAtW(w);
    const M = { bamboo: lam('#7aa83e'), wood: lam(WOOD), rope: lam('#3a2a1e'), red: lam(RED), black: lam('#1e1a1a'), bronze: lam('#a8803a', { emissive: '#2a1a06' }), stone: new T3.MeshLambertMaterial({ color: '#8a8272', flatShading: true }), lant: [bas('#ff5a3a'), bas('#ffb04a')], blossom: new T3.MeshLambertMaterial({ color: '#f6bcd0', flatShading: true }), plank: lam('#8a6a42'), wall: lam('#b8442e'), shell: lam('#d8302a', { emissive: '#3a0804' }), gold: lam(GOLD, { emissive: '#3a2a08' }) };
    const hold = (s) => holder(PA, grp, s);
    // le sol sous un point de la section (repere monde) : pour poser ce qui monte du sol
    const ground = (s, x) => { const F = PA.fr(s), p = new V().copy(F.p).addScaledVector(F.r, x); return { p, gy: gH(p.x, p.z), F }; };
    // UN MUR DE BAMBOUS avec un trou (marque de deux lanternes) : les tiges montent du sol plus haut que la voie
    const bambooWall = (w, gx, gap) => { const s = sAt(w), xs = [];
      for (let x = -34; x <= 34; x += rr(2.0, 2.8)) { if (Math.abs(x - gx) < gap / 2 + 0.5) continue; const G = ground(s, x), h = rr(34, 40), r = rr(0.3, 0.42); BAM.push({ x: G.p.x, y: G.gy, z: G.p.z, h, r }); shad(new V(G.p.x, G.gy, G.p.z), 1.3); xs.push([x, G.gy + h - G.F.p.y, r]); }
      const h = hold(s); for (const sd of [-1, 1]) { const l = new T3.Mesh(new T3.SphereGeometry(0.9, 10, 8), M.lant[0]); l.scale.y = 1.25; l.position.set(gx + sd * (gap / 2 + 0.4), 4, 0); h.add(l); const gw = glowS(6, '#ff8a4a', 0.7); gw.position.copy(l.position); h.add(gw); }
      OB.push({ s, th: 1.0, kind: 'bambou', hit: (x, y) => xs.some((q) => Math.abs(x - q[0]) < q[2] + RK && y < q[1]) }); };
    // UNE POUTRE en travers (bambou couche, branche de cerisier) : la ligne d'angle a, decalee de d
    const beam = (w, a, d, rad, len, mat, kind) => { const s = sAt(w), h = hold(s), m = new T3.Mesh(new T3.CylinderGeometry(rad, rad, len, 8), mat); m.rotation.z = a; m.position.set(Math.cos(a) * d, Math.sin(a) * d, 0); h.add(m);
      if (kind === 'branche') for (let k = 0; k < 9; k++) { const u = rr(-0.42, 0.42) * len, b = new T3.Mesh(new T3.IcosahedronGeometry(rr(1.4, 2.4), 1), M.blossom); b.position.set(Math.cos(a) * d - Math.sin(a) * u, Math.sin(a) * d + Math.cos(a) * u + rr(0.6, 1.2), rr(-1, 1)); h.add(b); }
      if (kind === 'couche') for (const u of [-0.3, -0.1, 0.1, 0.3]) { const r2 = new T3.Mesh(new T3.CylinderGeometry(rad * 1.12, rad * 1.12, 0.25, 8), lam('#c8d070')); r2.rotation.z = a; r2.position.set(Math.cos(a) * d - Math.sin(a) * u * len, Math.sin(a) * d + Math.cos(a) * u * len, 0); h.add(r2); }
      OB.push({ s, th: rad + 0.6, kind, hit: (x, y) => Math.abs(x * Math.cos(a) + y * Math.sin(a) - d) < rad * 0.95 + RK }); };
    // UNE GUIRLANDE de lanternes en travers : poteaux au sol, cordes aux hauteurs ys, lanternes pendues
    const garland = (w, ys) => { const s = sAt(w), h = hold(s), F = PA.fr(s);
      for (const x of [-32, 32]) { const G = ground(s, x), top = Math.max(...ys) + 2, hh = F.p.y + top - G.gy, pole = new T3.Mesh(new T3.CylinderGeometry(0.3, 0.38, hh, 8), M.wood); pole.position.set(G.p.x, G.gy + hh / 2, G.p.z); grp.add(pole); shad(new V(G.p.x, G.gy, G.p.z), 1.6); }
      const LS = []; for (const yc of ys) { const rope = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.1, 64, 5), M.rope); rope.rotation.z = Math.PI / 2; rope.position.y = yc; h.add(rope);
        for (let x = -27; x <= 27; x += 4.5) { const l = new T3.Mesh(new T3.SphereGeometry(0.85, 10, 8), M.lant[Math.round(x / 4.5) & 1]); l.scale.y = 1.3; l.position.set(x, yc - 1.4, 0); h.add(l); LS.push([x, yc - 1.4]); if (Math.round(x / 4.5) % 3 === 0) { const gw = glowS(5, '#ffb070', 0.55); gw.position.copy(l.position); h.add(gw); } } }
      OB.push({ s, th: 1.2, kind: 'guirlande', hit: (x, y) => ys.some((yc) => Math.abs(y - yc) < 0.35 + RK) || LS.some((q) => Math.abs(x - q[0]) < 0.85 + RK && Math.abs(y - q[1]) < 1.1 + RK) }); };
    // UNE PORTE TORII geante : on passe DANS l'encadrement (boost) ; les piliers et les poutres du haut sont durs
    L.torii = []; const torii = (w, gx) => { const s = sAt(w), h = hold(s), G = ground(s, gx), base = G.gy - G.F.p.y, Y1 = 9;
      const P = []; for (const sd of [-1, 1]) P.push({ cyl: [0.95, 1.15, Y1 + 2 - base, 14], c: RED, p: [gx + sd * 8.5, (Y1 + 2 + base) / 2, 0] }, { cyl: [1.5, 1.5, 1.4, 14], c: '#1e1a1a', p: [gx + sd * 8.5, base + 0.7, 0] });
      P.push({ s: [21, 0.9, 1.2], c: RED, p: [gx, Y1 - 0.2, 0] }, { s: [1.1, 2.2, 0.9], c: RED, p: [gx, Y1 + 1.0, 0] }, { s: [25, 1.3, 1.9], c: '#1e1a1a', p: [gx, Y1 + 2.4, 0] }, { s: [24, 0.8, 1.6], c: RED, p: [gx, Y1 + 1.6, 0] });
      for (const sd of [-1, 1]) P.push({ s: [3.4, 1.0, 2.0], c: '#1e1a1a', p: [gx + sd * 13.2, Y1 + 2.9, 0], r: [0, 0, sd * 0.28] });
      h.add(bakeBox(P)); for (const sd of [-1, 1]) shad(new V().copy(G.p).addScaledVector(G.F.r, sd * 8.5).setY(gH(G.p.x + G.F.r.x * sd * 8.5, G.p.z + G.F.r.z * sd * 8.5)), 2.6);
      L.torii.push({ s, gx, done: false });
      OB.push({ s, th: 1.6, kind: 'torii', hit: (x, y) => Math.abs(x - gx - 8.5) < 1.1 + RK || Math.abs(x - gx + 8.5) < 1.1 + RK || (y > Y1 - 0.8 - RK && y < Y1 + 3.2 && Math.abs(x - gx) < 13) }); };
    // UNE AIGUILLE DE ROCHE (gorge) : des colonnes qui sortent de la riviere, un passage entre elles
    const needles = (w, gx, gap) => { const s = sAt(w), xs = [];
      for (let x = -22; x <= 22; x += rr(4.6, 6)) { if (Math.abs(x - gx) < gap / 2 + 2.2) continue; const G = ground(s, x), r = rr(2.0, 2.8), top = G.F.p.y + rr(24, 34) - G.gy, m = new T3.Mesh(lumpGeo(r, top / 2, r * 1.1, rr(0, 9), 2, 0.12), M.stone); m.position.set(G.p.x, G.gy + top / 2 - 1, G.p.z); grp.add(m); shad(new V(G.p.x, G.gy, G.p.z), r * 1.5); xs.push([x, r * 1.05]);
        for (let k = 0; k < 2; k++) { PINES.push({ x: G.p.x + rr(-1, 1), y: G.gy + top - 2, z: G.p.z + rr(-1, 1), k: rr(0.5, 0.8), ry: rr(0, 6) }); } }
      OB.push({ s, th: 2.8, kind: 'aiguille', hit: (x) => xs.some((q) => Math.abs(x - q[0]) < q[1] + RK) }); };
    // UN PONT DE CORDE en travers de la gorge, a la hauteur yb (dessus ou dessous)
    const bridge = (w, yb) => { const s = sAt(w), h = hold(s); const pl = new T3.Mesh(new T3.BoxGeometry(150, 0.35, 2.6), M.plank); pl.position.y = yb; h.add(pl);
      for (let k = -36; k <= 36; k++) { const b = new T3.Mesh(new T3.BoxGeometry(0.2, 0.4, 2.8), lam('#5a4028')); b.position.set(k * 2, yb + 0.15, 0); h.add(b); }
      for (const z of [-1.3, 1.3]) { const r = new T3.Mesh(new T3.CylinderGeometry(0.08, 0.08, 150, 4), M.rope); r.rotation.z = Math.PI / 2; r.position.set(0, yb + 1.3, z); h.add(r); }
      OB.push({ s, th: 1.8, kind: 'pont', hit: (x, y) => Math.abs(y - yb) < 0.5 + RK }); };
    // UNE CLOCHE DE TEMPLE qui balance, pendue a un portique (on passe quand elle s'ecarte)
    const bell = (w, bx, amp, wv, ph) => { const s = sAt(w), h = hold(s), top = 16, Lr = 9.5;
      const P = [{ s: [32, 1.2, 1.4], c: '#1e1a1a', p: [bx, top + 0.6, 0] }, { s: [30, 0.6, 1.0], c: RED, p: [bx, top - 0.5, 0] }]; h.add(bakeBox(P));
      for (const sd of [-1, 1]) { const G = ground(s, bx + sd * 15), hh = G.F.p.y + top - G.gy, pst = new T3.Mesh(new T3.CylinderGeometry(0.7, 0.8, hh, 10), M.red); pst.position.set(G.p.x, G.gy + hh / 2, G.p.z); grp.add(pst); shad(new V(G.p.x, G.gy, G.p.z), 1.8); }
      const pv = new T3.Group(); pv.position.set(bx, top, 0); h.add(pv); const rope = new T3.Mesh(new T3.CylinderGeometry(0.12, 0.12, Lr - 2, 5), M.rope); rope.position.y = -(Lr - 2) / 2; pv.add(rope);
      const bd = new T3.Group(); bd.position.y = -Lr; pv.add(bd); const bg = new T3.LatheGeometry([[0.3, 2.6], [1.6, 2.4], [2.0, 1.2], [2.3, -0.6], [2.7, -1.6], [2.9, -2.2], [0, -2.2]].map((q) => new T3.Vector2(q[0], q[1])), 18); bd.add(new T3.Mesh(bg, M.bronze)); bd.add(new T3.Mesh(new T3.TorusGeometry(2.6, 0.18, 6, 24).rotateX(Math.PI / 2).translate(0, -1.4, 0), M.gold));
      const ang = (t) => amp * Math.sin(wv * t + ph);
      OB.push({ s, th: 3.2, kind: 'cloche', upd: (t) => { pv.rotation.z = ang(t); }, hit: (x, y, t) => { const a = ang(t), cx = bx + Math.sin(a) * Lr, cy = top - Math.cos(a) * Lr; return Math.hypot(x - cx, y - cy) < 2.8 + RK || Math.abs(x - bx - 15) < 0.8 + RK || Math.abs(x - bx + 15) < 0.8 + RK || (y > top - 0.9 - RK && Math.abs(x - bx) < 16); } }); };
    // LA PORTE DU TEMPLE : un grand mur rouge a toit de tuiles, une seule porte ouverte (gx, largeur gw, hauteur gh)
    const gate = (w, gx, gw, gh) => { const s = sAt(w), h = hold(s), G0 = ground(s, 0), base = G0.gy - G0.F.p.y - 1, top = 31, P = [];
      for (const [a, b] of [[-46, gx - gw / 2], [gx + gw / 2, 46]]) P.push({ s: [b - a, top - base, 2.4], c: '#b8442e', p: [(a + b) / 2, (top + base) / 2, 0] });
      P.push({ s: [gw, top - gh, 2.4], c: '#b8442e', p: [gx, (top + gh) / 2, 0] }, { s: [96, 1.4, 5], c: ROOF, p: [0, top + 0.7, 0] }, { s: [94, 1.2, 1.4], c: ROOF2, p: [0, top + 1.9, 0] }, { s: [gw + 2, 1.2, 2.8], c: GOLD, p: [gx, gh + 0.6, 0] });
      for (const sd of [-1, 1]) P.push({ s: [1.6, gh - base, 2.8], c: '#1e1a1a', p: [gx + sd * (gw / 2 + 0.8), (gh + base) / 2, 0] });
      for (let k = -4; k <= 4; k++) P.push({ s: [0.4, 6, 2.5], c: '#9a3422', p: [k * 10 + 5, top - 4, 0.1] });
      h.add(bakeBox(P)); shad(new V().copy(G0.p).setY(G0.gy), 10);
      OB.push({ s, th: 1.6, kind: 'porte', hit: (x, y) => Math.abs(x) < 47 && !(Math.abs(x - gx) < gw / 2 - 0.2 && y < gh - 0.2) }); };
    // UNE BOMBE D'ARTIFICE : un obus de papier qui ECLATE en rythme (la lueur grossit avant) ; on passe entre deux eclatements
    L.bombs = []; const bomb = (w, x, y, per, ph) => { const s = sAt(w), h = hold(s), b = new T3.Group(); b.position.set(x, y, 0); h.add(b); b.add(new T3.Mesh(new T3.SphereGeometry(2.2, 16, 12), M.shell)); b.add(new T3.Mesh(new T3.TorusGeometry(2.25, 0.2, 6, 24), M.gold));
      const gw = glowS(14, '#ffb04a', 0.5); b.add(gw); const B = { s, x, y, per, ph, b, gw, last: -1 }; L.bombs.push(B);
      const phase = (t) => (((t + ph) / per) % 1 + 1) % 1;   // 0..0,7 calme, 0,7..0,82 alerte, 0,82..1 eclat
      OB.push({ s, th: 8, kind: 'bombe', bomb: B, hit: (px, py, t) => { const f = phase(t); return f > 0.82 && f < 0.98 && Math.hypot(px - x, py - y) < 8.5 + RK; } }); B.phase = phase; };
    // ---------- le parcours ----------
    // 2. la foret de bambous
    bambooWall(330, 0, 9.5); garland(450, [4]); beam(570, Math.PI / 2 + 0.08, -2.5, 0.6, 90, M.bamboo, 'couche'); bambooWall(690, -12, 8.5); beam(800, Math.PI / 2 - 0.1, 6.5, 0.6, 90, M.bamboo, 'couche');
    bambooWall(910, 10, 8.5); garland(1030, [-2.5, 8]); bambooWall(1150, -4, 8); beam(1260, Math.PI / 2 + 0.15, 1.5, 0.6, 90, M.bamboo, 'couche'); bambooWall(1380, 13, 8); garland(1500, [3]);
    // 3. les cerisiers : des portes torii a enfiler, des branches basses
    torii(1760, 0); torii(1890, -10); torii(2010, 8); torii(2130, 0); beam(2240, 0.35, 5, 0.7, 70, lam('#4a3228'), 'branche'); torii(2350, -12); beam(2470, -0.3, -4, 0.7, 70, lam('#4a3228'), 'branche'); torii(2580, 10); torii(2700, 0);
    // 4. la gorge : aiguilles de roche et ponts de corde
    needles(2970, 5, 10); bridge(3080, 4); needles(3190, -7, 10); bridge(3300, -3.5); needles(3410, 4, 9.5);
    // 5. le temple : portes, cloches, guirlandes
    gate(3840, 0, 13, 9); bell(3960, 0, 0.7, 1.25, 0); bell(4080, -6, 0.75, 1.45, 1.1); gate(4200, -10, 12.5, 9); garland(4320, [0, 10]); bell(4440, 6, 0.75, 1.35, 2.2); bell(4560, -4, 0.8, 1.55, 0.4); gate(4680, 9, 12.5, 9); garland(4800, [4]);
    // 7. le ciel de fete : des bombes d'artifice avant le boss
    bomb(5480, 0, 0, 2.6, 0); bomb(5560, -9, 6, 2.6, 0.9); bomb(5640, 9, -5, 2.6, 1.7); bomb(5700, 0, 9, 2.4, 0.5);
    L.OB = OB;
    // les anneaux de lanternes (montee de la cascade, montee au ciel) : un elan et un peu de carburant
    L.boostR = []; const RG = new T3.TorusGeometry(4.6, 0.5, 8, 32), RM = bas('#ffc23a', { fog: false });
    for (const [w, x, y] of [[3560, 0, 2], [3640, 3, -2], [5030, 0, 3], [5150, -6, -2], [5270, 6, 2], [5370, 0, -3]]) { const s = sAt(w), h = hold(s), m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(RG, RM));
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, l = new T3.Mesh(new T3.SphereGeometry(0.55, 8, 6), M.lant[k & 1]); l.scale.y = 1.3; l.position.set(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 0); m.add(l); } m.add(glowS(14, '#ffb020', 0.5)); L.boostR.push({ s, x, y, m, done: false }); }
    // l'ARRIVEE : une immense porte torii de lumiere
    { const s = PA.len - 70, h = hold(s), P = []; for (const sd of [-1, 1]) P.push({ cyl: [1.4, 1.6, 50, 14], c: GOLD, p: [sd * 22, -10, 0] }); P.push({ s: [56, 2, 2.4], c: GOLD, p: [0, 13, 0] }, { s: [62, 2.6, 3.4], c: '#1e1a1a', p: [0, 17, 0] }, { s: [58, 1.4, 2.6], c: RED, p: [0, 15.4, 0] }); h.add(bakeBox(P));
      for (const sd of [-1, 1]) { const gw = glowS(40, '#ffd060', 0.6); gw.position.set(sd * 22, 0, 0); h.add(gw); } }
  }

  // ============================== LES ENNEMIS : cerfs-volants de combat (on fonce dedans), fusees ennemies (on les evite) ==============================
  function kiteMesh(big) {
    const g = new T3.Group(), k = big ? 1.4 : 1, sh = new T3.Shape(); sh.moveTo(0, 3.6 * k); sh.lineTo(2.6 * k, 0.4 * k); sh.lineTo(0, -3.2 * k); sh.lineTo(-2.6 * k, 0.4 * k); sh.lineTo(0, 3.6 * k);
    const sail = new T3.Mesh(new T3.ShapeGeometry(sh), lam('#d42a22', { side: T3.DoubleSide, emissive: '#3a0604' })); g.add(sail);
    const sh2 = new T3.Shape(); sh2.absarc(0, 0.4 * k, 1.3 * k, 0, Math.PI * 2, false); const mid = new T3.Mesh(new T3.ShapeGeometry(sh2), lam(GOLD, { side: T3.DoubleSide, emissive: '#3a2a06' })); mid.position.z = 0.05; g.add(mid);
    const ey = new T3.Mesh(new T3.CircleGeometry(0.55 * k, 16), bas('#1e1a1a', { side: T3.DoubleSide })); ey.position.set(0, 0.4 * k, 0.08); g.add(ey);
    for (const [x, y, l, r] of [[0, 0.2, 6.8, 0], [0, 0.4, 5.2, Math.PI / 2]]) { const s = new T3.Mesh(new T3.BoxGeometry(0.14, l * k, 0.14), lam('#3a2a1e')); s.position.set(x, y * k, -0.08); s.rotation.z = r; g.add(s); }
    const tail = []; for (let i = 0; i < 6; i++) { const t = new T3.Mesh(new T3.PlaneGeometry(0.9 * k, 0.5 * k), bas(i % 2 ? '#ffd04a' : '#ffffff', { side: T3.DoubleSide })); t.position.set(0, (-3.6 - i * 1.0) * k, 0); g.add(t); tail.push(t); }
    const gw = glowS(big ? 10 : 7, '#ff6a4a', 0.5); gw.position.z = -0.3; g.add(gw);
    g.userData = { tail, kite: true }; return g;
  }
  function enemies(g, PA, grp) {
    L.sent = []; L.chase = []; L.bul = []; const sAt = (w) => PA.sAtW(w);
    const sent = (w, x, y, big) => { const m = kiteMesh(big); grp.add(m); L.sent.push({ s: sAt(w), x, y, m, alive: true, fT: rr(0.8, 2), ph: rr(0, 6), big }); };
    for (const [w, x, y] of [[1820, 11, 5], [1950, -12, 8], [2190, 0, 13], [2200, 14, 0], [2420, -9, 4], [2640, 12, 10], [3030, -9, 6], [3250, 9, 2], [3380, -6, 8], [4010, 12, 8], [4380, -12, 4], [4500, 10, 12], [4740, 0, 14], [5100, -10, 8], [5310, 10, -6]]) sent(w, x, y, false);
    for (const [w, x, y] of [[2300, -8, 12], [4250, 8, 14]]) sent(w, x, y, true);
    for (const [a, b, n] of [[sAt(1700), sAt(2500), 2], [sAt(3900), sAt(4700), 2]]) for (let k = 0; k < n; k++) { const m = kiteMesh(false); m.visible = false; grp.add(m); L.chase.push({ a, b, k, n, m, ds: 260, fT: 1 + k * 0.6, ph: k * 2.1, on: false, x: 0, y: 0 }); }
    // les fusees ennemies : de petites fusees de feu d'artifice (rouge et or) qui laissent des etincelles
    const mBody = new T3.CylinderGeometry(0.22, 0.22, 2.0, 10).rotateX(Math.PI / 2), mNose = new T3.ConeGeometry(0.24, 0.7, 10).rotateX(Math.PI / 2).translate(0, 0, 1.35), mStick = new T3.BoxGeometry(0.06, 0.06, 2.4).translate(0, -0.2, -1.8), mFl = new T3.ConeGeometry(0.22, 1.4, 8, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -1.7);
    const mR = lam(RED, { emissive: '#4a0804' }), mG = lam(GOLD, { emissive: '#3a2a06' }), mS = lam('#c8a85a'), mF = bas('#ffb04a', { transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 24; i++) { const m = new T3.Group(), body = new T3.Group(); m.add(body); body.add(new T3.Mesh(mBody, mR)); body.add(new T3.Mesh(mNose, mG)); body.add(new T3.Mesh(mStick, mS)); body.add(new T3.Mesh(mFl, mF));
      m.visible = false; grp.add(m); L.bul.push({ m, body, on: false, s: 0, x: 0, y: 0, vs: 0, vx: 0, vy: 0, t: 0, smT: 0 }); }
  }
  const fire = (g, s, x, y) => { const b = L.bul.find((q) => !q.on); if (!b) return; const vs = -18, tau = Math.max(0.6, (s - L.s) / Math.max(20, L.v - vs)), a = rr(0, 6.28), off = Math.random() < 0.2 ? rr(0.6, 1.6) : rr(2.6, 5);
    Object.assign(b, { on: true, s, x, y, vs, vx: (L.x + Math.cos(a) * off - x) / tau, vy: (L.y + Math.sin(a) * off - y) / tau, t: 0, smT: 0 }); b.m.visible = true; g.audio.play('whoosh'); };
  const missileHit = (g, rk) => { L.v *= 0.75; L.inv = 0.6; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); burst(rk.pos.clone(), '#ff8a4a', 0.4); g.audio.play('boomSmall', rk.pos); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.2; g.flashColor = '#ffb070'; (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' }); };
  // un ennemi detruit : comme au niveau 1 (ondes de choc, eclats, fumee, ralenti tres court) + un bouquet d'artifice a sa place
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
    // les consignes, la premiere fois
    { const HINT = { bambou: 'PASSE PAR LE TROU ENTRE LES LANTERNES', couche: 'PASSE AU-DESSUS OU EN DESSOUS', guirlande: 'ATTENTION AUX LANTERNES !', torii: 'PASSE DANS LES PORTES : BOOST !', branche: 'ATTENTION AUX BRANCHES', aiguille: 'PASSE ENTRE LES ROCHERS', pont: 'PASSE AU-DESSUS OU EN DESSOUS', cloche: 'PASSE QUAND LA CLOCHE S ECARTE', porte: 'VISE LA PORTE OUVERTE', bombe: 'PASSE ENTRE LES ECLATS !' }; L.seen = L.seen || {};
      if (!L.hintT || L.t > L.hintT) { for (const o of L.O) { const ds = o.s - L.s; if (ds > 60 && ds < 170 && HINT[o.kind] && !L.seen[o.kind]) { L.seen[o.kind] = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, HINT[o.kind], 2.2, o.kind === 'torii' ? '#ffd27a' : '#ffffff'); break; } }
        if (!L.seen.kite) { const d = L.sent.find((q) => q.alive && q.s - L.s > 50 && q.s - L.s < 200); if (d) { L.seen.kite = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, 'CERF-VOLANT : FONCE DEDANS !', 2.4, '#ff6a5a'); } } } }
    // les portes torii enfilees : un elan, un peu de carburant
    for (const T of L.torii) { if (T.done || T.s < s0 - 1 || T.s > L.s + 1) continue; T.done = true; if (Math.abs(L.x - T.gx) < 7.4 && L.y < 8.2) { L.boostT = Math.max(L.boostT, 1.4); L.tN = (L.tN || 0) + 1; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 0.6); g.audio.play('whoosh'); g.audio.play('boostOn'); if (g.feed) g.feed('PORTE ' + L.tN + '/' + L.torii.length, '#ffd27a'); burst(rk.pos.clone().addScaledVector(rk.fwd, 30).add(_b.set(0, 14, 0)), '#ffd04a', 0.7, 'ring'); } }
    bossPlay(g, rk, dt);
    for (const c of L.chase) { const on = L.s > c.a && L.s < c.b; if (on && !c.on) { c.on = true; c.ds = 260; c.m.visible = true; if (c.k === 0) { if (CC.L1) CC.L1.msg(g, 'CERFS-VOLANTS EN APPROCHE !', 2, '#ff6a5a'); g.audio.play('alarm'); } }
      if (!c.on) continue; const want = on ? 46 + c.k * 12 + 6 * Math.sin(t * 0.7 + c.ph) : 420; c.ds += (want - c.ds) * Math.min(1, dt * (on ? 1.4 : 0.6));
      c.x = Math.cos(t * 0.55 + c.ph) * (10 + 6 * Math.sin(t * 0.3 + c.k)); c.y = 4 + Math.sin(t * 0.7 + c.ph * 1.3) * 8;
      if (on && c.ds < 90) { c.fT -= dt; if (c.fT <= 0) { c.fT = 1.7 + c.n * 0.25; fire(g, L.s + c.ds, c.x, c.y); } }
      if (!on && c.ds > 400) { c.on = false; c.m.visible = false; } }
    for (const b of L.bul) { if (!b.on) continue; b.t += dt; b.s += b.vs * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > 4 || b.s < L.s - 20) { b.on = false; b.m.visible = false; continue; }
      if (Math.abs(b.s - L.s) < 2 && Math.hypot(b.x - L.x, b.y - L.y) < 1.3 && L.inv <= 0) { b.on = false; b.m.visible = false; missileHit(g, rk); continue; }
      b.smT -= dt; if (b.smT <= 0) { b.smT = 0.04; g.effects.sparks.emit({ pos: b.m.position.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(2), life: 0.4, s0: 0.25, s1: 0.3, s2: 0.05, cols: g.effects.pal.ember, drag: 1, grav: 2, a: 1, fout: 0.5 }); } }
    for (const B of L.boostR) { if (B.done || B.s < s0 - 1 || B.s > L.s + 1) continue; B.done = true; if (Math.hypot(L.x - B.x, L.y - B.y) < 5.2) { L.boostT = 2.6; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 1); g.audio.play('boostOn'); g.audio.play('whoosh'); if (g.feed) g.feed('BOOST !', '#ffc23a'); g.flash = 0.15; g.flashColor = '#ffe08a'; burst(B.m.getWorldPosition(new V()), '#ffd04a', 0.5); } }
  }
  const _o6 = new T3.Object3D(), _zA = new V(0, 0, 1);
  function animate(g, dt) {
    const PA = L.PA, t = L.t;
    for (const o of L.OB) if (o.upd && Math.abs(o.s - L.s) < 700) o.upd(t);
    // les bombes : la lueur grossit (alerte), puis l'obus eclate en bouquet
    for (const B of L.bombs) { if (Math.abs(B.s - L.s) > 500) continue; const f = B.phase(t), cyc = Math.floor((t + B.ph) / B.per); B.b.visible = !(f > 0.82 && f < 0.98); B.gw.scale.setScalar(14 * (1 + 1.6 * ss(0.55, 0.82, f) * (0.7 + 0.3 * Math.sin(t * 30))));
      if (f > 0.82 && B.last !== cyc) { B.last = cyc; const p = placeAt(PA, _o6, B.s, B.x, B.y).position.clone(); burst(p, FWC[cyc % FWC.length], 0.5); if (Math.abs(B.s - L.s) < 160) g.audio.play('boomSmall', p); } }
    for (const d of L.sent) { const near = d.alive && d.s - L.s < 330 && d.s - L.s > -80; d.m.visible = near; if (!near) continue; placeAt(PA, d.m, d.s, d.x + Math.sin(t * 0.9 + d.ph) * 1.2, d.y + Math.sin(t * 1.4 + d.ph) * 1.0); d.m.rotateZ(Math.sin(t * 1.1 + d.ph) * 0.25); d.m.userData.tail.forEach((q, i) => { q.position.x = Math.sin(t * 5 + i * 0.8 + d.ph) * 0.4 * i; }); }
    for (const c of L.chase) if (c.on) { placeAt(PA, c.m, L.s + c.ds, c.x, c.y); c.m.rotateZ(Math.sin(t * 1.2 + c.ph) * 0.4); c.m.userData.tail.forEach((q, i) => { q.position.x = Math.sin(t * 6 + i * 0.8) * 0.5 * i; }); }
    for (const b of L.bul) if (b.on) { placeAt(PA, b.m, b.s, b.x, b.y); b.body.quaternion.setFromUnitVectors(_zA, _d.set(b.vx, b.vy, -b.vs).normalize()); b.body.rotateZ(L.t * 6); }
    for (const B of L.boostR) B.m.rotation.z = t * 1.2;
  }

  // ============================== LE BOSS : LA JONQUE CELESTE (3 coups dans le grand medaillon de la poupe) ==============================
  function bossBuild(g, PA, grp) {
    const m = new T3.Group(), P = [], HU = '#6a3a22', HU2 = '#4a2818', SA = '#c83a28', BT = '#3a1a10';
    // la coque : longue, la poupe haute et decoree tournee vers nous (-z = vers la fusee), la proue relevee
    P.push({ s: [14, 5, 46], c: HU, p: [0, 0, 0] }, { s: [12, 3, 44], c: HU2, p: [0, -3.6, 0] }, { s: [15, 1.2, 47], c: GOLD, p: [0, 2.8, 0] });
    P.push({ s: [15, 10, 9], c: HU, p: [0, 6, 20] }, { s: [16.4, 1, 10], c: '#1e1a1a', p: [0, 11.6, 20] }, { s: [12, 6, 8], c: HU, p: [0, 3, -22], r: [0.25, 0, 0] });
    for (const z of [-12, 2, 14]) P.push({ cyl: [0.5, 0.7, 30, 8], c: BT, p: [0, 17, z] });
    for (let k = 0; k < 6; k++) P.push({ s: [1.2, 1.2, 1.6], c: '#2a2a2a', p: [k % 2 ? 7.4 : -7.4, 1.6, -8 + Math.floor(k / 2) * 9] });   // les canons a fusees
    m.add(bakeBox(P));
    // les voiles a lattes (rouges, nervures sombres), en eventail
    for (const [z, hh, ww] of [[-12, 20, 14], [2, 24, 17], [14, 18, 12]]) { const sh = new T3.Shape(); sh.moveTo(-ww / 2, 0); sh.lineTo(ww / 2, 0); sh.quadraticCurveTo(ww / 2 + 2.5, hh * 0.6, ww / 2 - 1, hh); sh.lineTo(-ww / 2 + 1, hh); sh.quadraticCurveTo(-ww / 2 - 2.5, hh * 0.6, -ww / 2, 0);
      const s = new T3.Mesh(new T3.ShapeGeometry(sh), lam(SA, { side: T3.DoubleSide, emissive: '#2a0604' })); s.position.set(0, 6, z); s.rotation.y = Math.PI / 2 * 0.1; m.add(s);
      for (let k = 1; k < 6; k++) { const b = new T3.Mesh(new T3.BoxGeometry(ww + 1.4, 0.35, 0.4), lam(BT)); b.position.set(0, 6 + k * hh / 6, z + 0.2); m.add(b); } }
    // les grandes lanternes qui la portent
    L.bossLant = []; for (const [x, y, z] of [[-13, 18, -14], [13, 18, -14], [-13, 20, 12], [13, 20, 12]]) { const l = new T3.Mesh(new T3.SphereGeometry(4, 16, 12), bas('#ff8a3a')); l.scale.y = 1.3; l.position.set(x, y, z); m.add(l); const gw = glowS(26, '#ffb060', 0.6); gw.position.copy(l.position); m.add(gw); const rp = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.1, Math.hypot(x, y - 6), 4), lam(BT)); rp.position.set(x / 2, (y + 6) / 2, z); rp.rotation.z = Math.atan2(-x, y - 6); m.add(rp); L.bossLant.push(l); }
    // le grand MEDAILLON de la poupe : la cible (or et rouge), toujours face a la fusee
    const tg = new T3.Group(); tg.position.set(0, 6, 24.7); m.add(tg); tg.add(new T3.Mesh(new T3.CircleGeometry(6.2, 40), lam(GOLD, { emissive: '#4a3208', side: T3.DoubleSide })));
    for (const [r, w, c] of [[5.6, 0.5, '#ff3a2a'], [3.0, 0.4, '#ff3a2a']]) { const o = new T3.Mesh(new T3.TorusGeometry(r, w, 8, 48), bas(c, { fog: false })); o.position.z = 0.2; tg.add(o); }
    { const o = new T3.Mesh(new T3.CircleGeometry(1.2, 20), bas('#ff3a2a', { fog: false, side: T3.DoubleSide })); o.position.z = 0.25; tg.add(o); }
    m.visible = false; grp.add(m);
    L.boss = { m, tg, s: 0, sT: 0, x: 0, y: 0, hp: 3, on: false, dead: false, deadT: 0, hitT: 0, fT: 2, cap: PA.len - 260, boomT: 0, s0: PA.sAtW(5880) };
  }
  function bossPlay(g, rk, dt) {
    const B = L.boss; if (!B || (B.dead && B.deadT > 3.5)) return;
    if (!B.on && L.s > B.s0 - 320) { B.on = true; B.s = B.sT = B.s0; B.m.visible = true; if (CC.L1) CC.L1.msg(g, 'BOSS : FONCE DANS LE MEDAILLON DE LA JONQUE (3 COUPS)', 3, '#ff5a3a'); g.audio.play('robotAlarm'); }
    if (!B.on) return; const t = L.t;
    if (B.dead) { B.deadT += dt; B.boomT -= dt; if (B.boomT <= 0 && B.deadT < 2.6) { B.boomT = 0.16; const p = B.m.position.clone().add(new V(rr(-12, 12), rr(-4, 16), rr(-20, 20))); g.effects.explosion(p, null, false, 'orange'); burst(p, FWC[Math.floor(Math.random() * FWC.length)], 0.8); g.audio.play('boomSmall', p); }
      if (B.deadT > 2.6 && B.m.visible) { B.m.visible = false; g.flash = 0.6; g.flashColor = '#ffe0b0'; g.audio.play('boom'); g.rig.shake = 1.4; for (let k = 0; k < 8; k++) burst(B.m.position.clone().add(new V(rr(-30, 30), rr(0, 40), rr(-30, 30))), FWC[k % FWC.length], rr(1.2, 1.8), k % 3 === 0 ? 'willow' : k % 3 === 1 ? 'ring' : null); } return; }
    B.hitT -= dt; B.s += (B.sT - B.s) * Math.min(1, dt * (B.hitT > 0 ? 2.5 : 1.2)); B.x = 7 * Math.sin(t * 0.4); B.y = 3 + 4 * Math.sin(t * 0.55);
    const capped = B.sT >= B.cap - 1, ds = B.s - L.s, ph = 3 - B.hp;
    if (ds > 45 && ds < 280) { B.fT -= dt; if (B.fT <= 0) { B.fT = [1.5, 1.15, 0.9][ph]; fire(g, B.s - 26, B.x + 7.4, B.y + 1.6); if (ph >= 1) fire(g, B.s - 26, B.x - 7.4, B.y + 1.6); if (ph >= 2) fire(g, B.s - 26, B.x, B.y + 10); } }
    if (B.hitT <= 0 && L.s > B.s - 27 && L.s < B.s + 30 && (capped || Math.hypot(L.x - B.x, L.y - (B.y + 6)) < 9 + RK)) {
      B.hp = capped ? 0 : B.hp - 1; B.hitT = 1.6; L.inv = 1.2; L.v *= 0.6; g.rig.shake = 1.2; g.flash = 0.35; g.flashColor = '#ffffff'; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); burst(rk.pos.clone(), '#ffd04a', 0.9, 'ring'); g.audio.play('reactorHit'); g.audio.play('boom');
      if (EVO.onBossHit) EVO.onBossHit(g, null); rk.fuel = Math.min(rk.fuelMax, rk.fuel + 6);
      if (B.hp <= 0) { B.dead = true; B.deadT = 0; if (CC.L1) CC.L1.msg(g, 'JONQUE CELESTE DETRUITE !', 3, '#ffe9a0'); g.audio.play('victory'); }
      else { B.sT = Math.min(B.cap, L.s + 300); if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 2, '#ff9a5a'); }
      (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 3, 0)), t0: performance.now(), txt: B.hp > 0 ? '-1' : 'BOUM !' }); return; }
    if (L.s > B.s + 30 && !capped) { B.sT = Math.min(B.cap, L.s + 240); B.s = Math.max(B.s, L.s + 110); if (CC.L1) CC.L1.msg(g, 'ELLE REVIENT !  FONCE DEDANS', 1.6, '#ff6a5a'); }
  }
  function bossAnim(g, dt) { const B = L.boss; if (!B || !B.on || !B.m.visible) return; if (!B.dead) { placeAt(L.PA, B.m, B.s, B.x, B.y); B.m.rotateZ(Math.sin(L.t * 0.7) * 0.06); B.m.rotateX(Math.sin(L.t * 0.5) * 0.04); } else { B.m.position.y -= dt * 6; B.m.rotateZ(dt * 0.3); }
    B.tg.scale.setScalar(1 + 0.06 * Math.sin(L.t * 5)); for (const l of L.bossLant) l.material.color.setHSL(0.07, 1, 0.55 + 0.08 * Math.sin(L.t * 3)); }

  // ============================== LA FICHE DU NIVEAU 6 ==============================
  const CH6 = ZN.map((z) => [z[3], z[0], z[2]]);
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 6) || g.evoPreview) return _ld(g);
    EVO.chapters = CH6.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { const A = EVO.SCENE_AUDIO; A.fvillage = 'evoDawn'; A.fbambou = 'evoDawn'; A.fcerisier = 'evoDawn'; A.fgorge = 'evoDay'; A.ftemple = 'evoDusk'; A.fmontee = 'evoDusk'; A.fciel = 'evoBoss'; }
    return EVO.baseDef({ zone: 'campagne', len: Math.round(LOC.len - 60), scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 6606, bossEnt: null });
  };

  // ============================== CONSTRUCTION, PILOTAGE, CAMERA ==============================
  const dispose = (g) => { if (!L) return; for (const k of ['grp', 'sky', 'dust']) if (L[k]) g.scene.remove(L[k]); if (L.ink) for (const q of L.ink) g.scene.remove(q.m); if (L.far0) { g.camera.far = L.far0; g.camera.updateProjectionMatrix(); } L = null; EVO.fete = null; BAM.length = TREES.length = PINES.length = ROCKS.length = SHAD.length = 0; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); };
  function build(g) {
    const pad = g.pad, run = g.endlessRun, T = run.T, a = T.at(0, 0, 0), b = T.at(8, 0, 0), F0 = new V(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const O = (pad && pad.origin ? pad.origin.clone() : new V(a[0], a[1] + 2, a[2])), P0 = O.clone(); P0.y -= 2.2;   // le sol du village : 2,2 m sous la fusee
    L = EVO.fete = { t: 0, s: 0, x: 0, y: 0, v: 0, started: false, inv: 0, boostT: 0, bk: 0, zi: 0, fwT: 0 };
    L.rkL = (EVO.rocketLen && EVO.rocketLen(g)) || 2.4;
    BAM.length = TREES.length = PINES.length = ROCKS.length = SHAD.length = 0;
    const PA = L.PA = buildPath(P0, F0), grp = L.grp = new T3.Group(); g.scene.add(grp);
    terrain(PA, grp); sky(g, PA); obstacles(g, PA, grp); decor(PA, grp); enemies(g, PA, grp); bossBuild(g, PA, grp); fwPool(grp);
    grp.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (!m.isShaderMaterial && !m.fog && !(m.blending === T3.AdditiveBlending) && !(o.isPoints)) { m.fog = true; m.needsUpdate = true; } });
    // les petales (et les feuilles, l'ecume, les braises) qui tombent autour de la camera
    { const n = 520, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#ffc8d8', size: 0.42, map: petalTex(), transparent: true, opacity: 0, depthWrite: false, fog: false, alphaTest: 0.05 })); p.frustumCulled = false; g.scene.add(p); L.dust = p; L.dustInit = false; L.dph = new Float32Array(n); for (let i = 0; i < n; i++) L.dph[i] = rr(0, 6.28); }
    L.far0 = g.camera.far;
  }
  const lim = (z) => (z === 'low' ? 20 : z === 'gorge' ? 22 : ROPEN - 2);
  // le sol sous la fusee (dans la section) : on ne passe jamais dessous
  const floorAt = (s, F) => { if (F.u.y < 0.3) return -1e9; const q = _c.copy(F.p).addScaledVector(F.r, L.x); return (gH(q.x, q.z) + 2.0 - F.p.y) / F.u.y; };

  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on6(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA, inp = g.input; this.age += dt; if (!this.ignited && this.age >= this.cfg.ignitionDelay) { this.ignited = true; g.audio.play('ignite', this.pos); }
    if (!L.started) { L.started = true; L.K = CC.EVO.spdK ? CC.EVO.spdK(this.game) : 1; L.s = 0; L.x = 0; L.y = 0; L.v = Math.max(30, this.vel.length()); const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); L.yaw0 = e.y; L.pit0 = e.x; L.ry = 0; L.rp = 0; }
    { const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); let dy = e.y - L.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); L.ry = U.clamp(dy, -0.62, 0.62) * Math.exp(-dt * 0.9); L.rp = U.clamp(e.x - L.pit0, -0.62, 0.62) * Math.exp(-dt * 0.9); inp.setAim(L.yaw0 + L.ry, L.pit0 + L.rp); }
    const s0 = L.s, zi = zoneAt(L.s), Z = ZN[zi], boostZ = /boost/.test(Z[5]);
    if (zi !== L.zi) { L.zi = zi; if (CC.L1) CC.L1.msg(g, Z[3] + (boostZ ? ' !' : ''), 2.2, Z[4]); if (boostZ) { g.audio.play('boostOn'); g.audio.play('whoosh'); } else g.audio.play('jetPass'); }
    if (L.boostT > 0) L.boostT -= dt; if (L.inv > 0) L.inv -= dt;
    if (!(boostZ || L.boostT > 0)) this.fuel = Math.max(0, this.fuel - dt * (L.K || 1));
    const dry = this.fuel <= 0;
    if (dry && !L.dry) { L.dry = 1; if (CC.L1) CC.L1.msg(g, 'PLUS DE POUDRE !', 2, '#ff6a5a'); g.audio.play('warnFuel'); } if (!dry) L.dry = 0;
    const vMax0 = L.boostT > 0 ? 106 : boostZ ? 92 : 60; const vMax = vMax0 * (L.K || 1);   // v449 : la vitesse monte avec la fusee
    L.bk += ((L.boostT > 0 ? 1 : boostZ ? 0.65 : 0) - L.bk) * Math.min(1, dt * 3);
    if (dry) { L.fall = (L.fall || 0) + 22 * dt; L.v = Math.max(26, L.v - 6 * dt); L.y -= L.fall * dt; L.rp = Math.min(L.rp, -0.3); L.dryT = (L.dryT || 0) + dt; }   // v448 : a sec, la fusee tombe (elle ne s'ecrase plus en plein vol)
    else { L.fall = 0; L.dryT = 0; L.v += ((this.throttle || this.freeBoost || boostZ || L.boostT > 0 ? vMax : vMax * 0.8) - L.v) * Math.min(1, dt * (L.v < vMax ? 1.4 : 0.9)); L.v = Math.max(24, L.v); }
    const vx = -L.v * Math.sin(L.ry) * 0.85, vy = L.v * Math.sin(L.rp) * 0.85, lat = Math.min(1, 52 * (L.K || 1) / L.v); L.x += vx * lat * dt; L.y += vy * lat * dt; L.s += L.v * dt;
    const lm = lim(Z[5]), rr2 = Math.hypot(L.x, L.y);
    if (dry && this.active && L.dryT > 3.2) { g.onRocketCrash('stalled', this.pos.clone(), null); return; }
    if (rr2 > lm && !dry) { L.x *= lm / rr2; L.y *= lm / rr2; L.v *= 1 - dt * 0.4; }
    const F2 = PA.fr(L.s), fl = floorAt(L.s, F2); if (dry && L.y < fl + 0.3 && this.active) { g.onRocketCrash('stalled', this.pos.clone(), null); return; } if (L.y < fl) { L.y = fl; if (Math.random() < dt * 8) g.effects.smokePuff(_a.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y - 1).clone(), new V(rr(-2, 2), rr(1, 3), rr(-2, 2)), 1.4, 0.9); }
    this.pos.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y);
    this.vel.copy(F2.t).multiplyScalar(L.v).addScaledVector(F2.r, vx * lat).addScaledVector(F2.u, vy * lat); this.speed = this.vel.length(); this.fwd.copy(this.vel).normalize(); this.flightDist += L.v * dt;
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, L.s);
    this.thrustK = dry ? Math.max(0, (this.thrustK || 0) - dt * 4) : 1;
    if (L.inv <= 0 && L.OB) for (const o of L.OB) { if (o.s + o.th < s0 || o.s - o.th > L.s) continue; if (o.hit(L.x, L.y, L.t)) { g.onRocketCrash('wall', this.pos.clone(), F2.t.clone().negate()); if (this.active) { L.inv = 0.8; L.v *= 0.5; g.rig.shake = Math.max(g.rig.shake, 1); } break; } }
    if (this.active && L.sent) play(g, this, dt, s0);
    // la trainee d'etincelles de la fusee de feu d'artifice
    if (this.active && !dry) { const fx = g.effects, n = Math.random() < dt * 50 ? 2 : 1; for (let k = 0; k < n; k++) fx.sparks.emit({ pos: this.nozzle(new V()), vel: this.fwd.clone().multiplyScalar(-rr(4, 12)).add(new V(rr(-2, 2), rr(-2, 2), rr(-2, 2))), life: rr(0.3, 0.6), s0: 0.09, s1: 0.13, s2: 0.03, cols: fx.pal.ember, drag: 1.2, grav: 5, a: 1, fout: 0.5 }); }
    if (this.active && L.s > PA.len - 60 && (!L.boss || L.boss.dead) && !g.evoFinish && EVO.finishRun) { if (CC.L1) CC.L1.msg(g, 'ARRIVEE !', 2.6, '#ffe9a0'); for (let k = 0; k < 6; k++) burst(this.pos.clone().addScaledVector(this.fwd, 60).add(new V(rr(-40, 40), rr(10, 50), rr(-40, 40))), FWC[k % FWC.length], 1.4, k % 2 ? 'willow' : null); EVO.finishRun(g); }
  };

  // --- AU MENU : la fusee sur son chevalet de bambou, au milieu de la place en fete ---
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
    if (L && L.PA && on6(g) && !rk.active && (g.state === 'MENU' || g.state === 'AIM' || g.state === 'LAUNCH')) { menuView(g, this, dt); return; }
    if (!L || !L.PA || !on6(g) || !rk.active || g.state !== 'FLIGHT' || !L.started || (g.evoFinish && g.evoFinish.hold)) return;
    const PA = L.PA, cam = this.cam, F = PA.fr(L.s + 6), Fq = frameQ(F, _q2.clone());
    if (!L.camQ) L.camQ = Fq.clone(); L.camQ.slerp(Fq, 1 - Math.exp(-dt * 3.2));
    const cr = new V(1, 0, 0).applyQuaternion(L.camQ), cu = new V(0, 1, 0).applyQuaternion(L.camQ), cf = new V(0, 0, -1).applyQuaternion(L.camQ);
    const F0 = PA.fr(L.s), ctr = _d.copy(F0.p).addScaledVector(F0.r, L.x * 0.94).addScaledVector(F0.u, L.y * 0.94), bkD = U.clamp(1.5 * L.rkL, 3.6, 7.5);
    cam.position.copy(ctr).addScaledVector(cf, -bkD).addScaledVector(cu, 0.47 * bkD);
    { const gy = gH(cam.position.x, cam.position.z) + 1.2; if (cam.position.y < gy) cam.position.y = gy; }   // la camera ne passe jamais sous le sol
    cam.up.copy(cu); cam.lookAt(_a.copy(rk.pos).addScaledVector(cf, 4).addScaledVector(cu, 0.3));
    { const b = ss(5, 90, L.s); if (b < 1 && L.mc) { const qC = _q.copy(cam.quaternion), pC = _c.copy(cam.position); cam.position.copy(L.mc).addScaledVector(PA.F0, L.s * 0.85); cam.up.set(0, 1, 0); cam.lookAt(rk.pos); const qL = _q2.copy(cam.quaternion), pL = cam.position.clone();
      cam.position.lerpVectors(pL, pC, b); cam.quaternion.copy(qL).slerp(qC, b); cam.up.set(0, 1, 0).applyQuaternion(cam.quaternion); } }
    { const f0 = cam.fov, fw = f0 + 16 * L.bk; if (Math.abs(fw - f0) > 0.01) { cam.fov = fw; cam.updateProjectionMatrix(); } }
    if (this.shake > 0) cam.position.addScaledVector(cr, (U.fx() - 0.5) * this.shake * 0.5).addScaledVector(cu, (U.fx() - 0.5) * this.shake * 0.5);
    if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    { const fz = _c.copy(rk.fwd), fx = _a.crossVectors(cu, fz).normalize(), fy = _b.crossVectors(fz, fx); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(fx, fy, fz)); rk.mesh.position.copy(rk.pos); }
  };
  if (CC.Horizon) { const _hu = CC.Horizon.prototype.update; CC.Horizon.prototype.update = function (g) { if (L && on6(g)) { for (const m of [this.ring, this.glow, this.mtn]) if (m) m.visible = false; return; } return _hu.call(this, g); }; }
  // l'epave : elle ne tombe pas vers le sol du niveau 1 (bien plus bas) : elle s'arrete en tournant, le drapeau se plante a cote
  // v448 : l'epave retombe (gravite normale) et se pose sur le relief du niveau (EVO.terrain) : plus d'epave qui flotte
  // l'ombre de la fusee (celle du jeu, sa silhouette) sur notre sol
  (EVO.terrain = EVO.terrain || []).push((g, x, z) => (isS6() && L && L.PA ? gH(x, z) : null));
  // --- l'ambiance le long de la voie ---
  const wNow = () => { if (!L || !L.started) return 0; const q = L.PA.loc(L.PA.fr(L.s).p); return q[1]; };
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on6(g)) return;
    const w = wNow(), M = moodAt(w); L.M = M;
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(M.top); u.horizon.value.copy(M.hor); u.bottom.value.copy(M.fog); u.cloud.value = 0; }
    g.scene.fog.color.copy(M.fog); g.scene.fog.near = M.near; g.scene.fog.far = M.far;
    if (g.fogBase) { g.fogBase.near = M.near; g.fogBase.far = M.far; g.fogBase.color.copy(M.fog); }
    g.renderer.setClearColor(M.fog); if (g.stars) g.stars.visible = false;
    const night = ss(WM, WS + 200, w); g.nightK = night * 0.7;
    if (g.postParams) { g.postParams.bloomStrength = 0.2 + 0.3 * night; g.postParams.bloomThreshold = 0.84; g.postParams.vignette = 0.28; g.postParams.saturation = 1.08; g.postParams.contrast = 1.05; }
    g.ambient.intensity = 0.32 * M.li + 0.1; g.sun.intensity = 0.78 * M.li; g.sun.color.set(w < WB + 100 ? '#ffdcb8' : w > WT + 100 && w < WS ? '#ffd2b0' : w > WS ? '#9ab0ff' : '#fff4e6');
  };
  // --- chaque image ---
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!on6(g) || !g.endlessRun || !g.endlessRun.T) return;
    if (!L) { try { build(g); } catch (e) { console.warn('fete', e); L = null; return; } }
    const PA = L.PA, rk = g.rocket, cam = g.camera, s = L.started ? L.s : 0, w = wNow(); L.t += dt;
    bossAnim(g, dt); fwTick(dt);
    // le decor du niveau 1 n'a rien a faire ici (sol, hangar, rampe)
    for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = false;
    for (const o of g.scene.children) if (o.name === 'level') o.visible = false; if (g.pad && g.pad.evoL) g.pad.evoL.visible = false; if (g.pad && g.pad.hangar) g.pad.hangar.visible = false;
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.flash = 0.25; g.flashColor = '#ffd8a0'; if (CC.L1) CC.L1.msg(g, 'ALLUMAGE !', 1.6, '#ffd27a'); for (let k = 0; k < 3; k++) burst(PA.fr(0).p.clone().add(new V(rr(-30, 30), rr(40, 70), rr(-30, 30))), FWC[k], 1.1); }
    animate(g, dt);
    if (L.wTex) { L.wTex[0].offset.y -= dt * 0.25; L.wTex[1].offset.y += dt * 0.9; }
    if (L.cloudM) { L.cloudM.uniforms.uFar.value = Math.max(600, g.scene.fog.far * 1.3); if (L.M) L.cloudM.uniforms.uC.value.copy(L.M.fog).lerp(_c4.set('#ffffff'), 0.55); }
    // les montagnes a l'encre : plus pales au loin, teintees par la brume du moment
    if (L.ink && L.M) for (const q of L.ink) q.m.material.color.copy(L.M.fog).lerp(_c4.set(w > WM ? '#0a0e26' : '#2e3e4e'), [0.5, 0.36, 0.24, 0.14][q.k]);
    // le ciel : soleil couchant devant, puis la nuit (etoiles, lune)
    if (L.sky) { L.sky.position.copy(cam.position); const night = ss(WM, WS + 200, w); L.stars.material.opacity = night; L.moon.material.opacity = night;
      _b.copy(PA.F0).multiplyScalar(0.9).addScaledVector(PA.R0, 0.45); _b.y = 0.12 + 0.1 * (1 - ss(0, WT, w)); _b.normalize(); if (L.sun) { L.sun.position.copy(_b).multiplyScalar(2800); L.sun.visible = night < 0.9; if (L.sun.material) L.sun.material.opacity = 0.9 * (1 - night); }
      L.moon.position.copy(_d.copy(PA.F0).multiplyScalar(0.8).addScaledVector(PA.R0, -0.5).setY(0.55).normalize().multiplyScalar(480)); L.moon.lookAt(0, 0, 0); }
    // des feux d'artifice tout le temps : au-dessus de la place (fete), au loin au temple, partout dans le ciel de fete
    { L.fwT -= dt; const sky = w > WM - 150, vil = !L.started || w < WB + 150; if (L.fwT <= 0) { L.fwT = sky ? rr(0.25, 0.55) : vil ? rr(0.5, 1.0) : w > WT ? rr(1.6, 3) : rr(3, 6);
      const F = PA.fr(Math.min(PA.len, s + (vil && !L.started ? 140 : rr(170, 480)))), side = Math.random() < 0.5 ? -1 : 1, p = new V().copy(F.p).addScaledVector(F.r, side * rr(sky ? 70 : 40, sky ? 240 : 220)).add(new V(0, sky ? rr(30, 170) : rr(70, 160), 0));
      if (!vil && !sky && w < WT) p.y += 120; burst(p, FWC[Math.floor(Math.random() * FWC.length)], rr(1.1, 1.9), Math.random() < 0.25 ? 'willow' : Math.random() < 0.2 ? 'ring' : null); if (Math.random() < 0.4) g.audio.play('boomSmall', p); } }
    // petales (village, cerisiers, temple), feuilles de bambou, ecume de la cascade, braises dans le ciel
    if (L.dust) { const P = L.dust.geometry.attributes.position, n = P.count, D = L.dust.material, F = PA.fr(s), ctr = rk.active ? rk.pos : cam.position, nearFall = L.foamAt ? ss(260, 60, cam.position.distanceTo(L.foamAt)) : 0;
      const col = nearFall > 0.3 ? '#eef8ff' : w > WM ? '#ffd27a' : w > WB && w < WC ? '#a8d070' : w > WG && w < WT ? '#e8f4f0' : '#ffc4d6'; D.color.set(col); D.opacity = w > WC && w < WG ? 0.95 : w > WG && w < WT && nearFall < 0.3 ? 0.35 : 0.8; D.size = w > WM ? 0.3 : 0.42;
      const fall = w > WM ? -0.5 : 1.6;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); const ph = L.dph[i]; _a.y -= fall * dt; _a.x += Math.sin(L.t * 1.3 + ph) * dt * 1.2; _a.z += Math.cos(L.t * 1.1 + ph) * dt * 1.2;
        if (!L.dustInit || _b.subVectors(_a, ctr).dot(F.t) < -10 || _b.length() > 140) { _a.copy(ctr).addScaledVector(F.t, L.dustInit && L.started ? rr(60, 130) : rr(-10, 130)).addScaledVector(F.r, rr(-45, 45)).addScaledVector(F.u, rr(-15, 35)); }
        P.setXYZ(i, _a.x, _a.y, _a.z); }
      L.dustInit = true; P.needsUpdate = true; L.dust.visible = L.started && ((w > WC && w < WG) || nearFall > 0.3 || w > WM);   // v448 : plus de particules partout
      if (nearFall > 0.2 && Math.random() < dt * 8) g.effects.smokePuff(L.foamAt.clone().add(new V(rr(-20, 20), rr(0, 6), rr(-10, 10))), new V(rr(-2, 2), rr(3, 7), rr(-2, 2)), 6, 2); }
    if (L.villG) L.villG.visible = w < WB + 700;
  };
})();
