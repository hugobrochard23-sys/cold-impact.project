/* v415 : NIVEAU 4 « OPERATION ESPACE » (?lv=4) — PROTOTYPE : le pas de tir, la montee, la VOIE QUI PIVOTE EN 3D dans un TUBE TRANSPARENT.
 * Principe : au niveau 4 la fusee ne vole plus dans le couloir plat des niveaux 1-3. Elle suit une vraie courbe 3D (CatmullRom) :
 *   s = distance parcourue sur la voie, (x, y) = ecart dans la section du tube. Le repere de la voie (tangente, haut, droite) est transporte
 *   le long de la courbe (pas de vrille parasite) : au depart la voie monte a la VERTICALE le long de la tour, puis bascule doucement vers l'avant
 *   (comme une vraie fusee), plonge, s'enroule en tire-bouchon, se cabre. Le joystick / les fleches pilotent DANS LE TUBE (haut = vers le haut de
 *   l'ecran), la camera suit le repere de la voie : c'est le monde qui tourne autour de nous.
 *   Le tube : verre a reflets (bords brillants), quadrillage fin, anneaux lumineux, rails, bande jaune au « plancher », ondes de lumiere qui filent.
 *   Par endroits le tube s'arrete (portails lumineux) : on vole a decouvert entre des balises, au milieu des satellites et de la station.
 *   Decor : le pas de tir (tour de lancement, bras de service qui s'ecartent, deflecteur, chateaux d'eau, spheres d'ergols, paratonnerres,
 *   projecteurs, hangar d'assemblage, antennes), la couche de nuages a traverser, le ciel qui passe du bleu au noir, la TERRE qui s'arrondit,
 *   les etoiles, le soleil, la LUNE au loin (la destination). Prototype : carburant illimite. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn || !CC.Rocket) return;
  const on4 = (g) => !!(g && g.evo && !g.evo.preview && EVO.stage && EVO.stage(g) === 4);
  const R = 16, ROPEN = 34, RK = 0.55, rr = (a, b) => a + Math.random() * (b - a);
  const _a = new V(), _b = new V(), _c = new V(), _d = new V(), _q = new T3.Quaternion(), _q2 = new T3.Quaternion(), _m = new T3.Matrix4();
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  // ============================== v417 : LA FUSEE SPATIALE (4 etats : sonde, fusee a boosters, navette, vaisseau ; voir rocket_w.js « spatial ») ==============================
  const isS4 = EVO.isS4 = () => !!(EVO.stage && CC.game && EVO.stage(CC.game) === 4);
  EVO.isTube = () => isS4() || !!(EVO.isS5 && EVO.isS5()) || !!(EVO.isS6 && EVO.isS6());   // v423 : niveaux sur voie 3D (4 et 5) : panne = plus de carburant
  for (let i = 0; i < 4; i++) CC.Skins.byId['evoS' + i] = { id: 'evoS' + i, name: 'evoS' + i, short: 'evoS' + i, tier: 'base', price: 0, tierLabel: '', c: { body: '#f2f4f6', nose: '#1c1f24', tip: '#e8622a', band: '#e8622a', fin: '#1c1f24', nozzle: '#23262c' }, flame: ['#ffd27a', '#ffb84a', '#9fd8ff', '#7af0ff'][i], build: 'spatial', stage: i, dims: { r: 0.1, len: 1, noseLen: 0.3, noseR: 0.02, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, parts: [] };
  { const _ob = EVO.ownBody; EVO.ownBody = () => _ob() || isS4(); }
  { const _as = EVO.applySkin; EVO.applySkin = (g) => { if (!isS4()) return _as(g); const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoS' + r.tier)); EVO.attachParts(g); }; }
  { const RK4 = ['SONDE', 'FUSEE A BOOSTERS', 'NAVETTE', 'VAISSEAU'], _rk = EVO.rocket; EVO.rocket = (n) => { const r = _rk(n); if (isS4()) r.name = RK4[r.tier]; return r; }; }
  // le carburant du niveau 4 : il grandit avec la fusee et le lanceur (plus de reservoir illimite)
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); if (!isS4() || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket, f = EVO.fuel4(S.rk || 0, S.la || 0); rk.fuelMax = f * 1.15; rk.fuel = (g.evoAimLast && g.evoAimLast.zone === 'gold') ? f * 1.15 : f; }; }
  // v422 : VRAIE PROGRESSION : la sonde de depart n'a que 8 s (elle s'eteint dans la montee) ; chaque palier de fusee donne un gros bond (+4 / +13 / +38 s) :
  //   on galere au debut, le milieu avance lentement (fusee a boosters, navette), le vaisseau (palier 15) finit presque le niveau. Drones et anneaux ne rendent presque plus rien.
  EVO.fuel4 = (rk, la) => 8 + 1.4 * rk + 0.9 * la + [0, 4, 13, 38][Math.min(3, Math.floor(rk / 5))];
  // les pieces de distance : moins par metre qu'au niveau 1 (le niveau est long et on y va loin), mais le metre vaut de plus en plus cher en avancant (x3 a l'arrivee)
  EVO.distPay = (g, dist) => (isS4() ? (0.15 / (8450 / 6910)) * (1 + 2 * Math.min(1, dist / 6550)) : 1);
  let L = null;   // l'etat du niveau 4 (voie, decor, pilotage), refait a chaque partie

  // ============================== LA VOIE 3D ==============================
  // points de controle dans le repere du pas de tir : [droite, haut, avant] (m)
  const CP = [[0, 0, 0], [0, 140, 0], [0, 300, 0], [0, 460, 6], [0, 600, 60], [0, 720, 190], [0, 820, 380], [0, 880, 620], [0, 905, 880], [-20, 895, 1130],
    [-70, 850, 1360], [-140, 800, 1560], [-210, 790, 1760], [-250, 820, 1940]];
  { const c0 = [-250, 820, 1940]; for (let j = 1; j <= 24; j++) { const a = j / 24 * Math.PI * 2.5; CP.push([c0[0] - 55 + 55 * Math.cos(a), c0[1] + 55 * Math.sin(a), c0[2] + j * 26]); } }   // le tire-bouchon (1 tour 1/4)
  CP.push([-300, 900, 2700], [-310, 1000, 2950], [-310, 1130, 3180], [-300, 1220, 3420], [-280, 1230, 3700], [-250, 1190, 4000], [-230, 1170, 4300], [-220, 1170, 4700], [-220, 1192, 5000], [-220, 1084, 5296], [-220, 1148, 5419], [-220, 1175, 5526], [-220, 1150, 5590], [-220, 1060, 5602], [-220, 900, 5602], [-220, 650, 5600], [-220, 400, 5600], [-220, 200, 5600], [-220, 110, 5605], [-220, 40, 5650], [-220, 10, 5750], [-220, 0, 5900], [-220, 0, 6300], [-220, 10, 6800], [-220, 30, 7200]);
  // v417 : LA LUNE (centre MC, rayon RM) : on la survole a 30 m, on plonge dans un cratere, on la traverse par son coeur et on ressort dessous ; puis l'arene du CROISEUR LUNAIRE
  const MC = [-220, 650, 5600], RMOON = 500;
  // v421 : NIVEAU RACCOURCI A ~2 MIN : on retire des morceaux de voie (en distance « d'origine ») et on recolle la suite ; toute la logique reste dans ces distances d'origine
  const CUTS = [[1735, 2025], [2230, 2640], [3600, 3800], [3900, 5050]], END = 8600;

  function buildPath(O, F0) {
    const Y = new V(0, 1, 0), R0 = new V().crossVectors(F0, Y).normalize(), W = (p) => new V().copy(O).addScaledVector(R0, p[0]).addScaledVector(Y, p[1]).addScaledVector(F0, p[2]);
    const curve = new T3.CatmullRomCurve3(CP.map(W), false, 'centripetal', 0.5), len0 = curve.getLength(), N0 = Math.ceil(len0 / 2);
    const P0 = curve.getSpacedPoints(N0), step = len0 / N0, T = [], UP = [], RT = [], len = END;
    const inCut = (s) => CUTS.some(([a, b]) => s > a && s < b), cutRem = (s) => { let r = 0; for (const [a, b] of CUTS) { if (s >= b) r += b - a; else if (s > a) r += s - a; } return r; };
    const toNew = (s) => s - cutRem(s), toOld = (n) => { let s = n; for (const [a, b] of CUTS) if (s >= a) s += b - a; return s; };
    // la voie recollee : les points hors des coupes, la suite decalee pour continuer la ou on s'est arrete, puis le raccord adouci sur 60 m
    const P = [], JN = []; let off = new V(), skip = false;
    for (let i = 0; i <= N0; i++) { const s = i * step; if (s > END + 4) break; if (inCut(s)) { skip = true; continue; }
      if (skip && P.length > 1) { const k = P.length - 1, d = new V().subVectors(P[k], P[k - 1]); off = new V().copy(P[k]).add(d).sub(P0[i]); JN.push(P.length); } skip = false; P.push(P0[i].clone().add(off)); }
    for (const j of JN) for (let it = 0; it < 80; it++) for (let k = Math.max(1, j - 32); k <= Math.min(P.length - 2, j + 32); k++) { const w = 1 - Math.abs(k - j) / 33; P[k].lerp(_a.copy(P[k - 1]).add(P[k + 1]).multiplyScalar(0.5), 0.5 * w); }
    // les coupes retirent de la montee : on rend la hauteur perdue par une pente douce (du tire-bouchon a l'approche de la Lune), la Lune et l'arene restent a leur hauteur
    { const dy = -off.y, n0 = toNew(2640), n1 = toNew(5450); for (let k = 0; k < P.length; k++) P[k].y += dy * ss(n0, n1, k * step); off.y += dy; }
    const N = P.length - 1, OFF = off.clone();
    for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; T.push(new V().subVectors(b, a).normalize()); }
    let up = new V().copy(F0).negate();   // au depart (voie verticale), le « haut » de l'ecran regarde vers l'arriere : apres la bascule il devient le ciel
    // v419 : le « haut » est transporte le long de la voie, puis REDRESSE doucement vers le vrai haut du monde des que la voie n'est pas verticale
    // (sauf dans le tire-bouchon, qui doit tourner) : apres la vrille, sur la Lune et dans l'arene, la camera est droite et centree
    for (let i = 0; i <= N; i++) { up = up.clone().addScaledVector(T[i], -up.dot(T[i])).normalize();
      const sI = toOld(i * step), des = new V().copy(Y).addScaledVector(T[i], -Y.dot(T[i])), dl = des.length(), w = (dl > 0.35 ? ss(0.35, 0.6, dl) : 0) * (1 - ss(2560, 2640, sI) * (1 - ss(3420, 3560, sI)));
      if (w > 0) { des.normalize(); const ang = up.angleTo(des); if (ang > 1e-4) up.lerp(des, Math.min(1, 0.012 * w / ang)).normalize(); }
      UP.push(up); RT.push(new V().crossVectors(T[i], up).normalize()); }
    const sOf = (p) => { const q = W(p); let bi = 0, bd = 1e18; for (let i = 0; i <= N; i++) { const d = P[i].distanceToSquared(q); if (d < bd) { bd = d; bi = i; } } return toOld(bi * step); };
    const fr = (s, o) => { const u = U.clamp(toNew(s) / step, 0, N - 1e-4), i = Math.floor(u), f = u - i; o = o || {}; o.p = (o.p || new V()).lerpVectors(P[i], P[i + 1], f); o.t = (o.t || new V()).lerpVectors(T[i], T[i + 1], f).normalize(); o.u = (o.u || new V()).lerpVectors(UP[i], UP[i + 1], f).normalize(); o.r = (o.r || new V()).crossVectors(o.t, o.u).normalize(); return o; };
    const cl = (s) => { for (const [a, b] of CUTS) if (s > a && s < b) return s - a < b - s ? a : b; return s; };
    const cutA = (s) => { for (const [a, b] of CUTS) if (s > a && s < b) return a; return s; };
    return { O, F0, R0, len, step, N, P, T, UP, RT, fr, sOf, W, W2: (p) => W(p).add(OFF), cut: inCut, cl, cutA, toNew, toOld, adv: (s, d) => toOld(toNew(s) + d), lenN: toNew(END) };
  }

  // ============================== LE TUBE TRANSPARENT ==============================
  const tubeMat = () => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uZ: { value: null }, uLen: { value: 6000 }, uC2: { value: new T3.Color('#ffffff') }, uK: { value: 1 }, uFar: { value: 1e5 } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform sampler2D uZ; uniform float uLen; uniform vec3 uC2; uniform float uK; uniform float uFar; varying vec3 vN; varying vec3 vW; varying vec2 vUv;',
      'void main(){',
      '  vec4 zc = texture2D(uZ, vec2(clamp(vUv.x / uLen, 0.0, 1.0), 0.5)); vec3 uC = zc.rgb; float bo = zc.a;',   // la couleur de la zone ; bo = accelerateur
      '  vec3 Vd = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(normalize(vN), Vd)); float fr = pow(f, 3.0);',   // bords du verre brillants (Fresnel) : on SENT la surface
      '  float s = vUv.x, a = vUv.y;',
      '  float gA = abs(fract(a * 24.0) - 0.5), gS = abs(fract(s / 9.0) - 0.5);',
      '  float grid = max(smoothstep(0.455, 0.5, gA), smoothstep(0.47, 0.5, gS));',   // quadrillage fin (panneaux de verre)
      '  float pulse = exp(-pow((fract((s - uT * 75.0) / 150.0) - 0.5) * 16.0, 2.0));',   // une onde de lumiere qui file vers l avant
      '  float hl = exp(-pow((a - 0.18) * 38.0, 2.0)) * 0.55 + exp(-pow((a - 0.31) * 70.0, 2.0)) * 0.3;',   // reflet de la vitre (deux traits brillants)
      '  float fl = abs(a - 0.75); float stripe = (1.0 - smoothstep(0.008, 0.016, fl)) * step(0.45, fract(s / 12.0 - uT * 1.6));',   // bande jaune du plancher : on sait toujours ou est le bas
      '  float chev = bo * (1.0 - smoothstep(0.03, 0.09, abs(fract((s - uT * 150.0) / 9.0 + abs(fract(a * 6.0) - 0.5) * 0.7) - 0.5)));',   // accelerateur : des chevrons qui filent vers l avant
      '  vec3 col = uC * (0.25 + fr * 1.5) + uC * grid * 0.5 + uC2 * (pulse * 0.6 + hl) + vec3(1.0, 0.78, 0.2) * stripe * 1.4 + vec3(1.0, 0.85, 0.35) * chev * 1.3;',
      '  float al = 0.05 + fr * 0.5 + grid * 0.11 + pulse * 0.08 + hl * 0.35 + stripe * 0.85 + chev * 0.55;   // v417 : verre plus discret : les obstacles et les cibles ressortent',
      '  float fd = 1.0 - smoothstep(uFar * 0.5, uFar, length(cameraPosition - vW));',
      '  gl_FragColor = vec4(col, min(1.0, al) * uK * fd);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, side: T3.DoubleSide, fog: false });
  // balaye un cercle le long de la voie (tube de verre, rails) ; uv = (distance, angle / 2 pi)
  function sweep(PA, s0, s1, rad, seg, dS, ang0) {
    const n = Math.max(2, Math.ceil((s1 - s0) / dS)), pos = [], nor = [], uv = [], idx = [], F = {};
    for (let i = 0; i <= n; i++) { const s = PA.cl(s0 + (s1 - s0) * i / n); PA.fr(s, F);
      for (let j = 0; j <= seg; j++) { const a = (ang0 || 0) + j / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); _a.copy(F.r).multiplyScalar(c).addScaledVector(F.u, sn);
        pos.push(F.p.x + _a.x * rad, F.p.y + _a.y * rad, F.p.z + _a.z * rad); nor.push(_a.x, _a.y, _a.z); uv.push(s, j / seg); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo;
  }
  // un objet pose dans le repere de la voie a la distance s (x a droite, y en haut, z en avant)
  const frameQ = (F, out) => out.setFromRotationMatrix(_m.makeBasis(F.r, F.u, _d.copy(F.t).negate()));   // -Z de l'objet = l'avant de la voie
  const _PF = {};
  function placeAt(PA, o, s, x, y, zf) { if (PA.cut && PA.cut(s)) { o.position.set(0, -1e6, 0); return o; } const F = PA.fr(s, _PF);o.position.copy(F.p).addScaledVector(F.r, x || 0).addScaledVector(F.u, y || 0).addScaledVector(F.t, zf || 0); frameQ(F, o.quaternion); return o; }

  function buildTube(PA, grp, sections) {
    const M = tubeMat(); L.tubeMats.push(M); M.uniforms.uZ.value = zoneTex(PA.len); M.uniforms.uLen.value = PA.len;
    const ringG = new T3.TorusGeometry(R + 0.12, 0.16, 6, 56), frameG = new T3.TorusGeometry(R + 0.5, 0.55, 8, 56), portG = new T3.TorusGeometry(R + 2.4, 1.3, 10, 64);
    const ringM = bas('#ffffff', { fog: false, transparent: true, opacity: 0.85 }), frameM = lam('#e8eef6', { emissive: '#3a4a5a' }), portM = bas('#7ad8ff', { fog: false });
    const lightM = bas('#fff2b0', { fog: false }), railM = bas('#7fe8ff', { fog: false, transparent: true, opacity: 0.9 });
    for (const [s0, s1] of sections) {
      const glass = new T3.Mesh(sweep(PA, s0, s1, R, 48, 3), M); glass.renderOrder = 5; glass.frustumCulled = false; grp.add(glass);
      for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) { const g = sweepOff(PA, s0, s1, a); grp.add(new T3.Mesh(g, railM)); }
      const nR = Math.floor((s1 - s0) / 12), rings = new T3.InstancedMesh(ringG, ringM, nR), nF = Math.floor((s1 - s0) / 96) + 1, frames = new T3.InstancedMesh(frameG, frameM, nF), lights = new T3.InstancedMesh(new T3.SphereGeometry(0.75, 8, 6), lightM, nF * 4);
      const o = new T3.Object3D();
      for (let k = 0; k < nR; k++) { placeAt(PA, o, s0 + 6 + k * 12); o.updateMatrix(); rings.setMatrixAt(k, o.matrix); rings.setColorAt(k, zoneCol(s0 + 6 + k * 12).lerp(new T3.Color('#ffffff'), 0.25)); }
      for (let k = 0; k < nF; k++) { const s = s0 + k * 96; placeAt(PA, o, s); o.updateMatrix(); frames.setMatrixAt(k, o.matrix); const F = PA.fr(s);
        for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + Math.PI / 4; o.position.copy(F.p).addScaledVector(F.r, Math.cos(a) * (R + 0.9)).addScaledVector(F.u, Math.sin(a) * (R + 0.9)); o.quaternion.identity(); o.updateMatrix(); lights.setMatrixAt(k * 4 + j, o.matrix); } }
      for (const im of [rings, frames, lights]) { im.frustumCulled = false; grp.add(im); }
      // portails aux deux bouts : gros anneau lumineux + chevrons
      for (const s of [PA.cl(s0), PA.cl(s1)]) { const p = placeAt(PA, new T3.Mesh(portG, portM), s); grp.add(p); for (let j = 0; j < 8; j++) { const c = new T3.Mesh(new T3.ConeGeometry(1.2, 3.2, 4), lightM), a = j / 8 * Math.PI * 2; placeAt(PA, c, s, Math.cos(a) * (R + 5), Math.sin(a) * (R + 5)); c.rotateX(-Math.PI / 2); grp.add(c); } }
    }
  }
  function sweepOff(PA, s0, s1, ang) {   // un rail : petit tube a l'exterieur du verre, a l'angle donne
    const n = Math.max(2, Math.ceil((s1 - s0) / 6)), pos = [], idx = [], F = {}, seg = 5;
    for (let i = 0; i <= n; i++) { const s = PA.cl(s0 + (s1 - s0) * i / n); PA.fr(s, F); const cx = Math.cos(ang) * (R + 0.35), cy = Math.sin(ang) * (R + 0.35);
      for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, c = Math.cos(a) * 0.22, sn = Math.sin(a) * 0.22; _a.copy(F.r).multiplyScalar(cx + c * Math.cos(ang)).addScaledVector(F.u, cy + c * Math.sin(ang)).addScaledVector(F.t, sn); pos.push(F.p.x + _a.x, F.p.y + _a.y, F.p.z + _a.z); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo;
  }
  // v418 : a decouvert, une seule LIGNE jaune relie les tubes (sous la voie, comme la bande du plancher) : on voit ou aller, sans balises partout
  function cable(PA, grp, s0, s1) {
    const n = Math.max(2, Math.ceil((s1 - s0) / 4)), pos = [], idx = [], F = {}, seg = 6, oy = -7, rad = 0.16;
    for (let i = 0; i <= n; i++) { const s = PA.cl(s0 + (s1 - s0) * i / n); PA.fr(s, F); for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2; _a.copy(F.p).addScaledVector(F.u, oy + Math.sin(a) * rad).addScaledVector(F.r, Math.cos(a) * rad); pos.push(_a.x, _a.y, _a.z); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeBoundingSphere();
    const m = new T3.Mesh(geo, bas('#ffd23a')); m.frustumCulled = false; grp.add(m);
  }
  // a decouvert : des balises lumineuses en carre autour de la voie (on ne se perd jamais)
  function beacons(PA, grp, s0, s1) {
    const n = Math.floor((s1 - s0) / 24), im = new T3.InstancedMesh(new T3.OctahedronGeometry(1.1, 0), bas('#ffe28a', { fog: false }), n * 4), o = new T3.Object3D();
    for (let k = 0; k < n; k++) { const F = PA.fr(s0 + 12 + k * 24); for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + Math.PI / 4; o.position.copy(F.p).addScaledVector(F.r, Math.cos(a) * ROPEN).addScaledVector(F.u, Math.sin(a) * ROPEN); o.updateMatrix(); im.setMatrixAt(k * 4 + j, o.matrix); } }
    im.frustumCulled = false; grp.add(im); L.beacons.push(im);
  }

  // ============================== TEXTURES DESSINEES PAR LE CODE (Terre, nuages, Lune) ==============================
  const noise2 = (seed) => { const G = 64, v = new Float32Array(G * G); let x = seed; for (let i = 0; i < G * G; i++) { x = (x * 16807) % 2147483647; v[i] = x / 2147483647; }
    const at = (i, j) => v[((j % G + G) % G) * G + ((i % G + G) % G)], sm = (t) => t * t * (3 - 2 * t);
    return (u, w) => { let s = 0, a = 0.5, f = 4; for (let o = 0; o < 5; o++) { const x2 = u * f, y2 = w * f, i = Math.floor(x2), j = Math.floor(y2), fx = sm(x2 - i), fy = sm(y2 - j); s += a * (at(i, j) * (1 - fx) * (1 - fy) + at(i + 1, j) * fx * (1 - fy) + at(i, j + 1) * (1 - fx) * fy + at(i + 1, j + 1) * fx * fy); a *= 0.5; f *= 2; } return s; }; };
  let TEX = null;
  function textures() {
    if (TEX) return TEX; const W = 512, H = 256, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const e = mk(), ex = e.getContext('2d'), ei = ex.createImageData(W, H), n1 = noise2(12345), n2 = noise2(777);
    const cl = mk(), cx = cl.getContext('2d'), ci = cx.createImageData(W, H), n3 = noise2(4242);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = i / W, w = j / H, lat = Math.abs(w - 0.5) * 2, h = n1(u * 2, w * 2) + 0.12 * Math.cos(u * 12.57) - 0.08, k = (j * W + i) * 4;
      let r, g, b; if (lat > 0.86) { r = g = b = 238; } else if (h > 0.53) { const dsr = n2(u * 3, w * 3), dry = lat < 0.45 && dsr > 0.52; r = dry ? 196 : 70 + 40 * dsr; g = dry ? 170 : 120 + 30 * dsr; b = dry ? 110 : 60; if (h > 0.66) { r = g = b = 150 + 40 * dsr; } } else { const dp = U.clamp((0.53 - h) * 4, 0, 1); r = 20 + 30 * (1 - dp); g = 70 + 80 * (1 - dp); b = 150 + 60 * (1 - dp); }
      ei.data[k] = r; ei.data[k + 1] = g; ei.data[k + 2] = b; ei.data[k + 3] = 255;
      const c2 = n3(u * 3 + 0.3 * Math.sin(w * 9), w * 5), al = U.clamp((c2 - 0.6) * 3.6, 0, 1) * (lat > 0.9 ? 0.4 : 1); ci.data[k] = ci.data[k + 1] = ci.data[k + 2] = 255; ci.data[k + 3] = al * 200; }   // moins de nuages : on voit les oceans et les continents
    ex.putImageData(ei, 0, 0); cx.putImageData(ci, 0, 0);
    const m = mk(), mx = m.getContext('2d'), mi = mx.createImageData(W, H), n4 = noise2(999); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = 120 + 70 * n4(i / W * 3, j / H * 3), k = (j * W + i) * 4; mi.data[k] = v; mi.data[k + 1] = v; mi.data[k + 2] = v * 1.02; mi.data[k + 3] = 255; } mx.putImageData(mi, 0, 0);
    { let x = 31; const rnd = () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; for (let k = 0; k < 140; k++) { const cx0 = rnd() * W, cy0 = rnd() * H, r = 2 + Math.pow(rnd(), 3) * 26; mx.fillStyle = 'rgba(40,40,46,0.28)'; mx.beginPath(); mx.arc(cx0, cy0, r, 0, 6.283); mx.fill(); mx.strokeStyle = 'rgba(235,235,240,0.35)'; mx.lineWidth = Math.max(1, r * 0.18); mx.beginPath(); mx.arc(cx0 - r * 0.1, cy0 - r * 0.1, r, 3.4, 5.6); mx.stroke(); } for (let k = 0; k < 6; k++) { mx.fillStyle = 'rgba(60,62,72,0.35)'; mx.beginPath(); mx.ellipse(rnd() * W, rnd() * H, 20 + rnd() * 50, 12 + rnd() * 30, rnd() * 3, 0, 6.283); mx.fill(); } }
    const tx = (c) => { const t = new T3.CanvasTexture(c); if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4; return t; };
    return (TEX = { earth: tx(e), clouds: tx(cl), moon: tx(m) });
  }

  // ============================== LE CIEL ET L'ESPACE (suivent la camera : a l'infini) ==============================
  const RS = 2000;
  function buildSky(g) {
    const sky = new T3.Group(), X = textures(); sky.renderOrder = -10;
    // etoiles : deux couches (petites et brillantes)
    for (const [n, sz, op] of [[1100, 1.5, 0.8], [160, 2.6, 1]]) { const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr(-1, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * q * 3000; pos[i * 3 + 1] = u * 3000; pos[i * 3 + 2] = Math.sin(a) * q * 3000; const t = Math.random(); col[i * 3] = 0.8 + 0.2 * t; col[i * 3 + 1] = 0.85 + 0.1 * t; col[i * 3 + 2] = 1; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ size: sz, sizeAttenuation: false, vertexColors: true, transparent: false, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); /* v420 : liste opaque (avant la Terre, qui les recouvre) ; fondu par la couleur */ p.renderOrder = -10; p.userData.op = op; sky.add(p); (L.stars = L.stars || []).push(p); }
    // la Terre : sphere texturee, couche de nuages qui tourne, halo d'atmosphere
    const earth = new T3.Group(); sky.add(earth); L.earth = earth;
    const em = new T3.Mesh(new T3.SphereGeometry(RS, 96, 64), new T3.MeshBasicMaterial({ map: X.earth, color: '#c8d4e4', fog: false, depthWrite: false })); em.renderOrder = -9; earth.add(em);   // sans eclairage (l'eclairage de la scene la brulait en blanc)
    const cm = new T3.Mesh(new T3.SphereGeometry(RS * 1.006, 96, 64), new T3.MeshBasicMaterial({ map: X.clouds, transparent: true, opacity: 0.85, fog: false, depthWrite: false })); cm.renderOrder = -8; earth.add(cm); L.cloudSphere = cm;
    const atm = new T3.Mesh(new T3.SphereGeometry(RS * 1.04, 64, 48), new T3.ShaderMaterial({ uniforms: { uC: { value: new T3.Color('#5ab0ff') } }, vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uC; varying vec3 vN; varying vec3 vW; void main(){ vec3 V = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(vN, V)); gl_FragColor = vec4(uC, pow(f, 2.2) * 0.9); }', transparent: true, depthWrite: false, side: T3.BackSide, blending: T3.AdditiveBlending, fog: false })); atm.renderOrder = -8; earth.add(atm);
    // la Lune (la destination), le soleil
    const moon = new T3.Mesh(new T3.SphereGeometry(150, 48, 32), new T3.MeshLambertMaterial({ map: X.moon, fog: false, depthWrite: false, emissive: '#2a2a30' })); moon.renderOrder = -9; sky.add(moon); L.moon = moon;
    if (EVO.boss2Kit) { const sun = EVO.boss2Kit.glow(340, '#ffe8c0'); sun.renderOrder = -9; sky.add(sun); L.sun = sun; const sun2 = EVO.boss2Kit.glow(70, '#ffffff'); sun2.scale.setScalar(70 / 340); sun.add(sun2); }
    sky.traverse((o) => { if (o.material) o.material.depthTest = o.isPoints ? true : true; });
    g.scene.add(sky); L.sky = sky;
  }

  // ============================== LE PAS DE TIR ==============================
  function bakeBox(parts) {   // assemble des boites colorees en un seul maillage (une tour = 1 appel de dessin)
    const K = EVO.foireKit; if (K && K.bake) return K.bake(parts.map((q) => ({ g: q.cyl ? new T3.CylinderGeometry(q.cyl[0], q.cyl[1], q.cyl[2], q.cyl[3] || 12) : new T3.BoxGeometry(q.s[0], q.s[1], q.s[2]), c: q.c, p: q.p, r: q.r })));
    const grp = new T3.Group(); for (const q of parts) { const m = new T3.Mesh(q.cyl ? new T3.CylinderGeometry(q.cyl[0], q.cyl[1], q.cyl[2], q.cyl[3] || 12) : new T3.BoxGeometry(q.s[0], q.s[1], q.s[2]), lam(q.c)); m.position.fromArray(q.p); if (q.r) m.rotation.fromArray(q.r); grp.add(m); } return grp;
  }
  function launchPad(g, PA, grp) {
    const O = PA.O, F0 = PA.F0, R0 = PA.R0, root = new T3.Group(); root.position.copy(O); root.quaternion.setFromRotationMatrix(_m.makeBasis(R0, new V(0, 1, 0), _d.copy(F0).negate())); grp.add(root);   // repere local : x droite, y haut, -z avant
    const base = L.groundY + 0.25, gy = base - O.y;   // v418 : la dalle passe AU-DESSUS du sol du niveau 1 (plus de sable jaune qui clignote a travers)   // le vrai sol (pas le toit du hangar du menu)
    root.position.y += gy; const P = [], OR = '#d8501c', GR = '#8a929c', DK = '#3a4048', WH = '#eef0f2', CO = '#bdb6aa';
    // la TABLE DE LANCEMENT sur l'octogone : la fusee y est posee debout (menu), quatre griffes de maintien, mat ombilical
    { const top = O.y - base - L.rkL * 0.5; P.push({ s: [9, top - 4, 9], c: '#5a6068', p: [0, 4 + (top - 4) / 2, 0] }, { s: [9.6, 0.4, 9.6], c: '#4a4f56', p: [0, top - 0.15, 0] }, { s: [10.1, 0.12, 0.3], c: '#ffd23a', p: [0, top - 0.25, 4.9] }, { s: [10.1, 0.12, 0.3], c: '#ffd23a', p: [0, top - 0.25, -4.9] }, { s: [0.3, 0.12, 10.1], c: '#ffd23a', p: [4.9, top - 0.25, 0] }, { s: [0.3, 0.12, 10.1], c: '#ffd23a', p: [-4.9, top - 0.25, 0] }, { s: [3.4, 0.5, 3.4], c: '#2a2e34', p: [0, top + 0.05, 0] });
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push({ s: [0.3, 0.22, 0.3], c: '#c8352a', p: [x * 1.2, top + 0.11, z * 1.2] });   /* griffes basses : elles ne cachent plus la fusee */
      P.push({ s: [0.8, top + 4, 0.8], c: GR, p: [-6, (top + 4) / 2, 0] }, { s: [5, 0.4, 0.4], c: WH, p: [-3.6, top + 3, 0] }); }
    // la dalle du pas de tir, l'octogone, la fosse a flammes et ses deflecteurs
    P.push({ s: [220, 1.2, 220], c: '#9a948a', p: [0, -0.6, 0] }, { cyl: [34, 36, 4, 8], c: CO, p: [0, 2, 0] }, { s: [12, 4.2, 80], c: '#2a2622', p: [0, 2.1, 0] });
    for (const sz of [-1, 1]) P.push({ s: [11.6, 1, 22], c: '#6a6058', p: [0, 1.4, sz * 14], r: [sz * 0.35, 0, 0] });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; P.push({ s: [2, 0.8, 2], c: '#ffd23a', p: [Math.cos(a) * 33, 4.2, Math.sin(a) * 33] }); }
    // la tour de lancement (treillis rouge et gris, 150 m), a droite de la fusee
    const TX = 15, TH = 150, w = 10;
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push({ s: [1.1, TH, 1.1], c: OR, p: [TX + cx * w / 2, 4 + TH / 2, cz * w / 2] });
    for (let y = 8; y < TH; y += 6) { const c = (Math.round(y / 6) % 5 === 0) ? WH : OR; P.push({ s: [w, 0.5, 0.5], c, p: [TX, 4 + y, -w / 2] }, { s: [w, 0.5, 0.5], c, p: [TX, 4 + y, w / 2] }, { s: [0.5, 0.5, w], c, p: [TX - w / 2, 4 + y, 0] }, { s: [0.5, 0.5, w], c, p: [TX + w / 2, 4 + y, 0] });
      for (const sd of [-1, 1]) P.push({ s: [0.3, 8.4, 0.3], c: GR, p: [TX, 4 + y + 3, sd * w / 2], r: [0, 0, sd * 0.78] }, { s: [0.3, 8.4, 0.3], c: GR, p: [TX + sd * w / 2, 4 + y + 3, 0], r: [sd * 0.78, 0, 0] }); }
    for (let y = 20; y < TH; y += 30) P.push({ s: [w + 3, 3.2, w + 3], c: WH, p: [TX, 4 + y, 0] }, { s: [w + 3.2, 0.6, w + 3.2], c: DK, p: [TX, 5.9 + y, 0] });   // plateformes de service
    P.push({ s: [3, 30, 3], c: GR, p: [TX, 4 + TH + 15, 0] }, { s: [0.4, 24, 0.4], c: '#cccccc', p: [TX, 4 + TH + 42, 0] }, { s: [26, 2.2, 2.2], c: OR, p: [TX - 8, 4 + TH + 6, 0] });   // mat, paratonnerre, fleche de la grue
    // ascenseur, tuyaux d'ergols qui montent
    P.push({ s: [2.6, TH - 10, 2.6], c: '#c8ccd2', p: [TX + 2, 4 + (TH - 10) / 2, 3] }); for (const dz of [-3.8, -2.6]) P.push({ cyl: [0.45, 0.45, TH - 20, 8], c: dz < -3 ? WH : '#e8d8a8', p: [TX - 4.6, 4 + (TH - 20) / 2, dz] });
    // quatre paratonnerres autour, chateaux d'eau, spheres d'ergols sur pieds, bunker, antennes
    for (const [x, z] of [[-60, -60], [60, -60], [-60, 60], [60, 60]]) P.push({ cyl: [0.9, 1.4, 120, 8], c: GR, p: [x, 60, z] }, { cyl: [0.2, 0.2, 20, 6], c: '#dddddd', p: [x, 130, z] });
    for (const [x, z] of [[-70, 20], [-70, -16]]) P.push({ cyl: [9, 9, 22, 20], c: WH, p: [x, 40, z] }, { cyl: [9.4, 9.4, 1, 20], c: '#2f7fe0', p: [x, 34, z] }, { cyl: [1.2, 1.2, 30, 8], c: GR, p: [x, 15, z] });
    for (const [x, z, c] of [[70, 40, WH], [70, -40, '#e8e0c8']]) { P.push({ cyl: [12, 12, 0.5, 6], c: '#666666', p: [x, 0.5, z] }); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; P.push({ s: [0.8, 14, 0.8], c: GR, p: [x + Math.cos(a) * 9, 7, z + Math.sin(a) * 9] }); } }
    P.push({ s: [30, 8, 18], c: '#7a7468', p: [-30, 4, 70] }, { s: [32, 1, 20], c: '#555048', p: [-30, 8.5, 70] });
    P.push({ s: [8, 90, 8], c: '#c8c8c8', p: [140, 45, 120] });
    const pad = bakeBox(P); root.add(pad);
    // spheres d'ergols (vraies spheres), grande parabole, projecteurs
    for (const [x, z, c] of [[70, 40, '#f4f4f6'], [70, -40, '#efe6cc']]) { const sp = new T3.Mesh(new T3.SphereGeometry(11, 24, 16), lam(c)); sp.position.set(x, 23, z); sp.castShadow = true; root.add(sp); }
    { const d = new T3.Mesh(new T3.SphereGeometry(16, 24, 12, 0, 6.283, 0, 1.0), lam('#e8e8ea', { side: T3.DoubleSide })); d.position.set(140, 92, 120); d.rotation.x = -0.9; root.add(d); L.dish = d; }
    for (const [x, z] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) { const lt = new T3.Group(); lt.position.set(x, 0, z); root.add(lt); lt.add(bakeBox([{ s: [1.2, 40, 1.2], c: GR, p: [0, 20, 0] }, { s: [6, 4, 1.2], c: DK, p: [0, 41, 0] }]));
      for (let k = 0; k < 6; k++) { const b = new T3.Mesh(new T3.BoxGeometry(0.9, 0.9, 0.3), bas('#fffbe8')); b.position.set(-2.2 + (k % 3) * 2.2, 40 + Math.floor(k / 3) * 1.6, 0.7); lt.add(b); }
      lt.lookAt(O.x, lt.position.y, O.z); lt.rotation.x = 0; }
    // le hangar d'assemblage, au loin, avec sa grande porte et le nom
    { const vab = bakeBox([{ s: [120, 160, 90], c: '#e6e8ea', p: [0, 80, 0] }, { s: [40, 130, 1], c: '#9aa4b0', p: [0, 65, -45.5] }, { s: [120.5, 6, 90.5], c: '#2f5fb0', p: [0, 150, 0] }, { s: [60, 30, 50], c: '#d8dadc', p: [80, 15, 10] }]); vab.position.set(-260, 0, 320); root.add(vab);
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#2f5fb0'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#ffffff'; x.font = '900 78px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('COLD SPACE', 256, 66); const t = new T3.CanvasTexture(cv); if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace;
      const pl = new T3.Mesh(new T3.PlaneGeometry(80, 20), new T3.MeshBasicMaterial({ map: t })); pl.position.set(-260, 128, 320 - 45.6); pl.rotation.y = Math.PI; root.add(pl);
      for (const sd of [-1, 1]) { const road = new T3.Mesh(new T3.BoxGeometry(12, 0.3, 420), lam('#b8b0a0')); road.position.set(-130 + sd * 10, 0.15, 160); road.rotation.y = -0.6; root.add(road); } }
    // la mer, d'un cote (la cote vue d'en haut)
    { const sea = new T3.Mesh(new T3.PlaneGeometry(3000, 3000), lam('#2a6aa8')); sea.rotation.x = -Math.PI / 2; sea.position.set(1700, -0.5, 0); root.add(sea);
      const land = new T3.Mesh(new T3.PlaneGeometry(3000, 3000), lam('#8c9468')); land.rotation.x = -Math.PI / 2; land.position.set(-1300, -0.3, 0); root.add(land); }   // la cote : notre propre sol (celui du niveau 1 est cache)
    // les BRAS DE SERVICE : ils touchent presque la fusee et s'ecartent quand elle arrive (s'en approcher par la droite = choc)
    L.arms = [];
    for (const h of [36, 72, 108]) { const piv = new T3.Group(); piv.position.set(TX - w / 2, 4 + h, 0); root.add(piv); const arm = bakeBox([{ s: [TX - w / 2 - 3.2, 2.2, 3.4], c: WH, p: [-(TX - w / 2 - 3.2) / 2, 0, 0] }, { s: [4, 4.4, 4.6], c: '#c8ccd2', p: [-(TX - w / 2 - 3.2) + 1.6, 0.6, 0] }, { s: [TX - w / 2 - 3, 0.4, 3.6], c: OR, p: [-(TX - w / 2 - 3.2) / 2, -1.3, 0] }]); piv.add(arm);
      const col = EVO.colBox(arm, TX - w / 2 - 2.4, 4, 4.4, -(TX - w / 2 - 2.4) / 2, 0.4, 0); L.arms.push({ piv, h, k: 0, col }); EVO.addDyn(piv, null, [col], { near: 1e7, span: 1e7 }); }   // (le pivot est dans le repere du pas de tir : pas de test de distance)
    L.pad = root; L.padGy = gy;
  }

  // ============================== LA COUCHE DE NUAGES ==============================
  function cloudDeck(PA, grp) {
    const n = 170, im = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 1), lam('#ffffff', { emissive: '#c4ccd8', flatShading: true }), n), o = new T3.Object3D(), O = PA.O;
    for (let i = 0; i < n; i++) { let x, z; do { x = rr(-600, 600); z = rr(-600, 600); } while (Math.hypot(x, z) < 70); const y = rr(395, 430), s = rr(12, 26);   // une couche fine, ecartee du tube : on voit le ciel au travers et on la perce en 1 seconde
      o.position.set(O.x + PA.R0.x * x + PA.F0.x * z, O.y + y, O.z + PA.R0.z * x + PA.F0.z * z); o.scale.set(s * rr(1.3, 2.2), s * rr(0.3, 0.5), s * rr(1.3, 2.2)); o.rotation.set(0, rr(0, 6), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    im.frustumCulled = false; grp.add(im); L.clouds = im;
  }

  // ============================== L'ESPACE : satellites (decor et obstacles), station en anneau ==============================
  function satellite(scale) {
    const g = new T3.Group(), body = bakeBox([{ s: [4, 4, 5], c: '#e8b43a', p: [0, 0, 0] }, { s: [4.2, 0.4, 5.2], c: '#9a7a2a', p: [0, 2.1, 0] }, { cyl: [0.3, 0.3, 4, 6], c: '#cccccc', p: [0, 0, 0], r: [0, 0, Math.PI / 2] }, { cyl: [1.6, 0.2, 1, 12], c: '#f0f0f0', p: [0, 3, 1], r: [0.5, 0, 0] }]);
    g.add(body); const pm = lam('#1e3a8a', { emissive: '#0a1a50' }), fr = lam('#cfd4da');
    const panels = new T3.Group(); g.add(panels);
    for (const sd of [-1, 1]) { const p = new T3.Mesh(new T3.BoxGeometry(18, 0.25, 5), pm); p.position.x = sd * 12; panels.add(p); for (let k = 0; k < 6; k++) { const l = new T3.Mesh(new T3.BoxGeometry(0.15, 0.3, 5.1), fr); l.position.set(sd * (3.5 + k * 3), 0, 0); panels.add(l); } }
    const blink = new T3.Mesh(new T3.SphereGeometry(0.5, 8, 6), bas('#ff3a2a', { fog: false })); blink.position.y = 2.6; g.add(blink); g.userData = { panels, blink, body };
    g.scale.setScalar(scale || 1); return g;
  }
  function spaceStuff(PA, grp, gap1, gap2) {
    // satellites qui tournent lentement, autour de la voie (decor)
    for (let k = 0; k < 16; k++) { const s = rr(900, PA.len - 300), F = PA.fr(s), a = rr(0, 6.283), d = rr(60, 220), sat = satellite(rr(1, 2.2)); sat.position.copy(F.p).addScaledVector(F.r, Math.cos(a) * d).addScaledVector(F.u, Math.sin(a) * d); sat.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6)); grp.add(sat); const w = rr(0.05, 0.2); EVO.addDyn(sat, (t, dt) => { sat.rotateY(w * dt); sat.userData.blink.visible = Math.sin(t * 4 + k) > 0.3; }, [], { near: 1e5 }); }
    // OBSTACLES : trois satellites au milieu de la voie (a decouvert) dont les panneaux tournent autour de la voie : on passe entre les panneaux, jamais au centre
    for (let k = 0; k < 3; k++) { const s = gap1[0] + (gap1[1] - gap1[0]) * (0.25 + k * 0.25), sat = satellite(1.6); placeAt(PA, sat, s); grp.add(sat);   // les panneaux sont en travers de la voie et tournent autour d'elle (axe Z local)
      const cols = [EVO.colBox(sat.userData.body, 4.4, 4.4, 5.4, 0, 0, 0)]; for (const sd of [-1, 1]) cols.push(EVO.colBox(sat.userData.panels, 18, 1, 5, sd * 12, 0, 0));
      const w = (k % 2 ? 1 : -1) * 0.7; EVO.addDyn(sat, (t, dt) => { sat.rotateZ(w * dt); sat.userData.blink.visible = Math.sin(t * 6) > 0; }, cols, { near: 1e5, span: 60 }); }
    // LA STATION EN ANNEAU : on passe au milieu ; deux longs bras de panneaux tournent en travers (passer entre eux)
    { const s = (gap2[0] + gap2[1]) / 2, st = new T3.Group(); placeAt(PA, st, s); grp.add(st);
      const ring = new T3.Mesh(new T3.TorusGeometry(70, 6, 16, 72), lam('#dfe4ea', { emissive: '#2a3038' })); st.add(ring);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, m = new T3.Mesh(new T3.BoxGeometry(14, 9, 9), lam(k % 3 ? '#cfd6de' : '#e8b43a')); m.position.set(Math.cos(a) * 70, Math.sin(a) * 70, 0); m.rotation.z = a; ring.add(m); const w = new T3.Mesh(new T3.BoxGeometry(2, 1.4, 0.2), bas('#ffe9a0', { fog: false })); w.position.set(Math.cos(a) * 64, Math.sin(a) * 64, -4.7); ring.add(w); }
      for (let k = 0; k < 4; k++) { const sp = new T3.Mesh(new T3.CylinderGeometry(1, 1, 40, 8), lam('#9aa4ae')); const a = k / 4 * Math.PI * 2 + 0.4; sp.position.set(Math.cos(a) * 48, Math.sin(a) * 48, 0); sp.rotation.z = a + Math.PI / 2; ring.add(sp); }
      const arms = new T3.Group(); st.add(arms); const cols = [];
      for (let k = 0; k < 2; k++) { const arm = new T3.Mesh(new T3.BoxGeometry(56, 3, 4), lam('#1e3a8a', { emissive: '#0a1a50' })); arm.rotation.z = k * Math.PI / 2; arms.add(arm); cols.push(EVO.colBox(arm, 56, 3, 4, 0, 0, 0)); }
      const hub = new T3.Mesh(new T3.CylinderGeometry(3.5, 3.5, 6, 16), lam('#e8b43a')); hub.rotation.x = Math.PI / 2; arms.add(hub); cols.push(EVO.colBox(hub, 7, 7, 6, 0, 0, 0));
      EVO.addDyn(st, (t, dt) => { ring.rotation.z += 0.12 * dt; arms.rotation.z += 0.55 * dt; }, cols, { near: 1e5, span: 120 }); }
  }

  // ============================== LE PROGRAMME DU NIVEAU : une zone = une couleur de tube et un genre d'epreuve ==============================
  // [debut, fin, cle, titre, couleur du tube, genre] ; genre : tube (obstacles) / boost (accelerateur) / open (a decouvert : asteroides, drones)
  const ZN = [[0, 140, 'lpad', 'LE PAS DE TIR', '#8fe6ff', 'pad'], [140, 560, 'lmontee', 'LA MONTEE', '#8fe6ff', 'tube'], [560, 980, 'laccel', 'ACCELERATEUR', '#ffc23a', 'boost'],
    [980, 1530, 'lvento', 'LES VENTILOS', '#ff5a4a', 'tube'], [1530, 2230, 'lorbite', 'L ORBITE', '#8fe6ff', 'open'], [2230, 2640, 'llaser', 'LES LASERS', '#b46aff', 'tube'],
    [2640, 3400, 'lvrille', 'LE TIRE-BOUCHON', '#ff5ad8', 'tube'], [3400, 3560, 'lturbo', 'TURBO', '#ffc23a', 'boost'], [3560, 4140, 'lstation', 'LA STATION', '#8fe6ff', 'open'],
    [4140, 4900, 'lpiston', 'LES PISTONS', '#4aff8a', 'tube'], [4900, 5450, 'lsprint', 'LE SPRINT', '#ffc23a', 'boost'], [5450, 6100, 'llune', 'VERS LA LUNE', '#8fe6ff', 'open'],
    [6100, 6545, 'lsurface', 'LA LUNE', '#8fe6ff', 'open'], [6545, 6918, 'lpuits', 'LE PUITS', '#ff8a3a', 'rock'], [6918, 7158, 'lcoeur', 'LE COEUR DE LA LUNE', '#ff8a3a', 'open'],
    [7158, 7540, 'lsortie', 'LA SORTIE', '#ff8a3a', 'rock'], [7540, 1e9, 'lboss', 'LE CROISEUR LUNAIRE', '#ff4a3a', 'open']];
  const zoneAt = (s) => { for (let i = ZN.length - 1; i >= 0; i--) if (s >= ZN[i][0]) return i; return 0; };
  const GAPS = [[1530, 2230], [3560, 4140], [5450, 1e9]], ROCK = [[6545, 6918], [7158, 7540]];
  // la couleur du tube le long de la voie (une texture de 1024 x 1) ; alpha = accelerateur (chevrons qui filent)
  function zoneTex(len) {
    const W = 1024, d = new Uint8Array(W * 4), c = new T3.Color(), c2 = new T3.Color();
    for (let i = 0; i < W; i++) { const s = (i + 0.5) / W * len, zi = zoneAt(s), Z = ZN[zi]; c.set(Z[4]); let bo = Z[5] === 'boost' ? 1 : 0;
      if (zi > 0) { const k = U.clamp((s - Z[0]) / 30, 0, 1); if (k < 1) { const P = ZN[zi - 1]; c2.set(P[4]).lerp(c, k); c.copy(c2); bo = (P[5] === 'boost' ? 1 : 0) * (1 - k) + bo * k; } }
      d[i * 4] = c.r * 255; d[i * 4 + 1] = c.g * 255; d[i * 4 + 2] = c.b * 255; d[i * 4 + 3] = bo * 255; }
    const t = new T3.DataTexture(d, W, 1, T3.RGBAFormat); t.magFilter = T3.LinearFilter; t.minFilter = T3.LinearFilter; t.needsUpdate = true; return t;
  }
  const zoneCol = (s) => new T3.Color(ZN[zoneAt(s)][4]);
  let HZ = null;
  const hazTex = () => { if (HZ) return HZ; const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#ffd21e'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#16181c'; for (let k = -4; k < 8; k++) { x.beginPath(); x.moveTo(k * 32, 128); x.lineTo(k * 32 + 16, 128); x.lineTo(k * 32 + 144, 0); x.lineTo(k * 32 + 128, 0); x.closePath(); x.fill(); } HZ = new T3.CanvasTexture(c); HZ.wrapS = HZ.wrapT = T3.RepeatWrapping; return HZ; };
  const glowS = (size, col, op) => { const s = EVO.boss2Kit ? EVO.boss2Kit.glow(size, col) : new T3.Object3D(); if (s.material) s.material.opacity = op === undefined ? 1 : op; return s; };

  // ---- les obstacles : chacun est teste dans le repere de la voie (x, y dans la section, a la distance s) : exact et sans surprise ----
  function obstacles(g, PA, grp) {
    const OB = L.O = [], BX = new T3.BoxGeometry(1, 1, 1), M = { red: lam('#e8322a', { emissive: '#5a0a06' }), white: lam('#f2f2f2', { emissive: '#3a3a3a' }), dark: lam('#2a2e36'), steel: lam('#8a949e'),
      haz: new T3.MeshLambertMaterial({ map: hazTex(), side: T3.DoubleSide, emissive: '#3a3000' }), yel: bas('#ffe23a', { fog: false }), grn: bas('#5aff7a', { fog: false }), laser: bas('#ff2a1a', { fog: false }),
      lglow: bas('#ff3a2a', { fog: false, transparent: true, opacity: 0.28, blending: T3.AdditiveBlending, depthWrite: false }), pis: lam('#2fbf5a', { emissive: '#0a3a18' }), mine: lam('#5a1010', { emissive: '#200404' }) };
    const holder = (s) => { const h = placeAt(PA, new T3.Group(), s); grp.add(h); return h; };
    // VENTILO : n pales qui tournent en travers du tube ; on passe entre les pales
    const fan = (s, n, w, hw, ph) => { const h = holder(s), rot = new T3.Group(); h.add(rot); const len = R - 3.4 - 0.4;
      for (let k = 0; k < n; k++) { const piv = new T3.Group(); piv.rotation.z = k / n * Math.PI * 2; rot.add(piv);
        for (let j = 0; j < 4; j++) { const sg = new T3.Mesh(BX, j % 2 ? M.white : M.red); sg.scale.set(len / 4, hw * 2, 1.2); sg.position.x = 3.4 + len / 8 + j * len / 4; sg.rotation.x = 0.25; piv.add(sg); }
        const tip = new T3.Mesh(new T3.SphereGeometry(0.55, 8, 6), M.yel); tip.position.x = R - 0.8; piv.add(tip); }
      const hub = new T3.Mesh(new T3.CylinderGeometry(3.4, 3.4, 2.4, 18), M.red); hub.rotation.x = Math.PI / 2; rot.add(hub); const cap = new T3.Mesh(new T3.SphereGeometry(1.6, 12, 8), M.white); cap.position.z = 1.4; rot.add(cap);
      const frame = new T3.Mesh(new T3.TorusGeometry(R - 0.2, 0.7, 8, 48), M.dark); h.add(frame); for (let j = 0; j < 8; j++) { const l = new T3.Mesh(new T3.SphereGeometry(0.5, 8, 6), M.laser), a = j / 8 * Math.PI * 2; l.position.set(Math.cos(a) * (R - 1), Math.sin(a) * (R - 1), 0.6); h.add(l); }
      OB.push({ s, th: 1.5, kind: 'fan', hit: (x, y, t) => { const r = Math.hypot(x, y); if (r < 3.4 + RK) return true; const a0 = w * t + ph; for (let k = 0; k < n; k++) { const a = a0 + k / n * 6.2832, al = x * Math.cos(a) + y * Math.sin(a), pp = -x * Math.sin(a) + y * Math.cos(a); if (al > 0 && Math.abs(pp) < hw + RK) return true; } return false; }, upd: (t) => { rot.rotation.z = w * t + ph; } }); };
    // VOLET : un secteur plein (centre c, ouverture sp) ; on passe par le cote ouvert, balise en vert
    const shutter = (s, c, sp, w, mat) => { const h = holder(s), rot = new T3.Group(); h.add(rot);
      const pl = new T3.Mesh(new T3.CircleGeometry(R - 0.3, 48, c - sp / 2, sp), mat || M.haz); rot.add(pl);
      for (const e of [c - sp / 2, c + sp / 2]) { const b = new T3.Mesh(BX, M.yel); b.scale.set(R - 0.3, 0.5, 0.6); b.position.set(Math.cos(e) * (R - 0.3) / 2, Math.sin(e) * (R - 0.3) / 2, 0); b.rotation.z = e; rot.add(b); }
      for (let j = 0; j < 7; j++) { const a = c + sp / 2 + (j + 0.5) / 7 * (6.2832 - sp), l = new T3.Mesh(new T3.SphereGeometry(0.55, 8, 6), M.grn); l.position.set(Math.cos(a) * (R - 1.2), Math.sin(a) * (R - 1.2), 0); rot.add(l); }
      OB.push({ s, th: 1.4, kind: 'shutter', c, w, hit: (x, y, t) => { const r = Math.hypot(x, y); if (r < 1.6) return true; let d = Math.atan2(y, x) - (c + w * t); d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < sp / 2 + Math.asin(Math.min(1, RK / r)); }, upd: (t) => { rot.rotation.z = w * t; } }); };
    // LASER : une barre rouge qui balaie le tube (h = monte et descend, v = gauche droite, rot = tourne autour du centre)
    const laser = (s, mode, amp, w, ph, lm) => { const h = holder(s), bar = new T3.Group(); h.add(bar); const core = new T3.Mesh(new T3.CylinderGeometry(lm ? 0.6 : 0.22, lm ? 0.6 : 0.22, 2 * R, 8), lm ? lm[0] : M.laser), gl = new T3.Mesh(new T3.CylinderGeometry(lm ? 1.4 : 0.9, lm ? 1.4 : 0.9, 2 * R, 10, 1, true), lm ? lm[1] : M.lglow); bar.add(core); bar.add(gl);
      const em = []; for (const sd of [-1, 1]) { const e = new T3.Mesh(BX, M.dark); e.scale.set(1.6, 1.6, 2.4); e.position.y = sd * (R - 0.4); bar.add(e); em.push(e); }
      if (mode === 'h') bar.rotation.z = Math.PI / 2;
      const pos = (t) => amp * Math.sin(w * t + ph);
      OB.push({ s, th: 1.2, kind: 'laser', hit: (x, y, t) => { if (mode === 'h') return Math.abs(y - pos(t)) < 0.8; if (mode === 'v') return Math.abs(x - pos(t)) < 0.8; const a = w * t + ph + Math.PI / 2; return Math.abs(-x * Math.sin(a) + y * Math.cos(a)) < 0.8; },
        upd: (t) => { if (mode === 'rot') { bar.rotation.z = w * t + ph; return; } const p = pos(t), ch = Math.sqrt(Math.max(1, R * R - p * p)); if (mode === 'h') bar.position.y = p; else bar.position.x = p; core.scale.y = gl.scale.y = ch / R; for (const e of em) e.position.y = Math.sign(e.position.y) * (ch - 0.4); } }); };
    // PISTON : un bloc qui sort de la paroi et y rentre (angle a, profondeur entre d0 et d1)
    const piston = (s, a, d0, d1, w, ph) => { const h = holder(s), rt = new T3.Group(); rt.rotation.z = a; h.add(rt); const blk = new T3.Mesh(BX, M.pis), face = new T3.Mesh(BX, M.haz); rt.add(blk); rt.add(face);
      const dep = (t) => d0 + (d1 - d0) * (0.5 + 0.5 * Math.sin(w * t + ph));
      OB.push({ s, th: 3.4, kind: 'piston', hit: (x, y, t) => { const al = x * Math.cos(a) + y * Math.sin(a), pp = -x * Math.sin(a) + y * Math.cos(a); return al > R - dep(t) - RK && Math.abs(pp) < 4 + RK; },
        upd: (t) => { const d = dep(t); blk.scale.set(d, 8, 5); blk.position.x = R - d / 2; face.scale.set(0.4, 8.2, 5.2); face.position.x = R - d - 0.2; } }); };
    // MINE : une boule a pointes qui clignote
    const mine = (s, x, y, b) => { const h = holder(s), m = new T3.Group(); h.add(m); m.add(new T3.Mesh(new T3.SphereGeometry(1.5, 14, 10), M.mine)); for (let k = 0; k < 10; k++) { const sp = new T3.Mesh(new T3.ConeGeometry(0.35, 1.4, 6), M.steel), v = new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); sp.position.copy(v).multiplyScalar(1.7); sp.quaternion.setFromUnitVectors(new V(0, 1, 0), v); m.add(sp); }
      const lt = new T3.Mesh(new T3.SphereGeometry(0.5, 8, 6), M.laser); lt.position.z = 1.4; m.add(lt); const ph = rr(0, 6);
      const yy = (t) => y + b * Math.sin(t * 1.3 + ph);
      OB.push({ s, th: 2.5, kind: 'mine', hit: (px, py, t) => Math.hypot(px - x, py - yy(t)) < 1.5 + RK, upd: (t) => { m.position.set(x, yy(t), 0); m.rotation.y = t * 0.8; lt.visible = Math.sin(t * 7 + ph) > 0; } }); };
    // ASTEROIDES (a decouvert) : quatre formes, dessinees en lots (un appel de dessin par forme)
    const AV = []; for (let v = 0; v < 4; v++) { const gm = new T3.IcosahedronGeometry(1, 1), P = gm.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i); const n = 1 + 0.22 * Math.sin(q.x * 3.1 + v * 2) * Math.cos(q.y * 2.7 + v) + 0.12 * Math.sin(q.z * 5.3 + v * 3); q.multiplyScalar(n); P.setXYZ(i, q.x, q.y * (0.8 + v * 0.06), q.z); } gm.computeVertexNormals(); AV.push({ gm, list: [] }); }
    const ast = (s, x, y, rad, ax, w) => { const A = { s, x, y, rad, ax, w: w || rr(0.3, 0.8), ph: rr(0, 6), rs: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(), rw: rr(0.2, 0.9) }; AV[Math.floor(Math.random() * 4)].list.push(A);
      const xx = (t) => A.x + A.ax * Math.sin(A.w * t + A.ph); A.xx = xx;
      OB.push({ s, th: rad * 0.8 + 0.9, kind: 'ast', hit: (px, py, t) => Math.hypot(px - xx(t), py - y) < rad * 0.75 + RK }); };
    // ---- le programme ----
    const H = Math.PI / 2;
    // LA MONTEE : quatre volets fixes (gauche, droite, haut, bas) : on apprend a se decaler (grande ouverture)
    [[280, Math.PI], [380, 0], [470, H], [545, -H]].forEach(([s, c]) => shutter(s, c, 2.9, 0));
    // LES VENTILOS (v417 : plus lents, pales fines, 130 m entre eux)
    [[1070, 3, 0.5, 1.6], [1200, 2, 0.65, 1.7], [1330, 3, -0.55, 1.6], [1460, 3, 0.7, 1.6]].forEach(([s, n, w, hw], i) => fan(s, n, w, hw, i * 0.9));
    // LES LASERS (plus lents)
    laser(2310, 'h', 10, 1.0, 0); laser(2400, 'v', 10, -1.1, 1); laser(2490, 'rot', 0, 0.6, 0); laser(2580, 'h', 10, 0.9, 0); laser(2582, 'v', 10, 0.7, 2);
    // LE TIRE-BOUCHON : quelques mines et des volets qui tournent doucement
    for (let s = 2790; s < 3380; s += 75) { if (Math.abs(s - 2880) < 25 || Math.abs(s - 3120) < 25) continue; const a = rr(0, 6.28), r = rr(0, 9); mine(s, Math.cos(a) * r, Math.sin(a) * r, rr(0, 2)); }
    shutter(2880, 0, 2.4, 0.45); shutter(3120, H, 2.6, -0.45);
    // LES PISTONS : des portes de 1 ou 2 blocs (le centre reste toujours libre)
    { let k = 0; for (let s = 4220; s < 4880; s += 100, k++) { const a0 = rr(0, 6.28), ph = rr(0, 6), w = rr(0.9, 1.3), n = 1 + (k % 2); for (let j = 0; j < n; j++) piston(s, a0 + j * 6.2832 / n, 3, n === 1 ? 12 : 10, w, ph + j * 1.2); } }
    // LE SPRINT : deux ventilos lents et un laser, a pleine vitesse
    fan(5040, 2, 0.45, 1.6, 0); laser(5180, 'h', 10, 0.8, 0); fan(5320, 3, -0.5, 1.5, 1);
    // A DECOUVERT : champs d'asteroides (on evite les satellites, la station et les drones), plus denses vers la Lune
    const keep = [[1705, 30], [1880, 30], [2055, 30], [3850, 46]];
    // v419 : ASTEROIDES PREVISIBLES : des murs de rochers qui bouchent une moitie du passage (gauche, puis droite, puis haut, puis bas...) ; l'autre moitie est toujours libre
    { const SIDES = [Math.PI, 0, Math.PI / 2, -Math.PI / 2], wall = (s, c) => { const dx = Math.cos(c), dy = Math.sin(c); for (let gx = -28; gx <= 28; gx += 8.5) for (let gy = -28; gy <= 28; gy += 8.5) { const x = gx + rr(-1.2, 1.2), y = gy + rr(-1.2, 1.2), d = x * dx + y * dy; if (d < 3 || Math.hypot(x, y) > 31) continue; ast(s + rr(-3, 3), x, y, rr(3.2, 4.2), 0); } };
      for (const [a, b, st] of [[1590, 2200, 95], [3600, 4110, 100], [5500, 6060, 90]]) { let k = 0; for (let s = a; s < b; s += st) { if (keep.some(([c, w]) => Math.abs(s - c) < w)) continue; wall(s, SIDES[k % 4]); k++; } } }
    moonObstacles(g, PA, grp, { shutter, laser, ast, mine, M });
    for (const A of AV) A.list = A.list.filter((a) => !PA.cut(a.s));
    for (const A of AV) { const im = new T3.InstancedMesh(A.gm, lam('#4e4842', { flatShading: true, emissive: '#100e0c' }), Math.max(1, A.list.length)); im.count = A.list.length; im.frustumCulled = false; grp.add(im); A.im = im; }
    for (const A of AV) A.list = A.list.filter((a) => !PA.cut(a.s)); for (let i = OB.length - 1; i >= 0; i--) if (PA.cut(OB[i].s)) OB.splice(i, 1);
    L.AV = AV; L.OB = OB;
    // les anneaux d'acceleration (passer dedans = BOOST)
    L.boostR = []; const RG = new T3.TorusGeometry(4.4, 0.45, 8, 32), RM = bas('#ffc23a', { fog: false }), AM = bas('#fff2a0', { fog: false });
    for (const [s, x, y] of [[650, 0, 6], [760, -7, -3], [870, 7, 2], [960, 0, -6], [3440, 0, 0], [3510, 6, 5], [4960, -6, 0], [5110, 6, 4], [5250, 0, -7], [5400, -5, 6]]) { const h = holder(s), m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(RG, RM)); m.add(glowS(14, '#ffb020', 0.5)); for (let j = 0; j < 4; j++) { const c = new T3.Mesh(new T3.ConeGeometry(0.7, 1.6, 4), AM), a = j / 4 * Math.PI * 2 + 0.785; c.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0); c.rotation.x = -Math.PI / 2; m.add(c); } L.boostR.push({ s, x, y, m, done: false }); }
    // l'arche d'ARRIVEE
    { const s = PA.len - 70, h = holder(s), n = 28, im = new T3.InstancedMesh(new T3.BoxGeometry(4.4, 2.2, 2.2), lam('#ffffff', { emissive: '#444444' }), n * 2), o = new T3.Object3D(), c = new T3.Color();
      for (let i = 0; i < n * 2; i++) { const a = (i % n) / n * Math.PI * 2, rr2 = 26 + (i >= n ? 2.2 : 0); o.position.set(Math.cos(a) * rr2, Math.sin(a) * rr2, 0); o.rotation.set(0, 0, a + Math.PI / 2); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(((i % n) + (i >= n ? 1 : 0)) % 2 ? '#16181c' : '#ffffff')); }
      h.add(im); const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#ffd21e'; x.font = '900 96px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ARRIVEE', 256, 66);
      const sp = new T3.Mesh(new T3.PlaneGeometry(36, 9), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(cv), transparent: true, fog: false, side: T3.DoubleSide })); sp.position.y = 34; h.add(sp); h.add(glowS(120, '#ffd27a', 0.35)); }
  }


  // ---- les ennemis : sentinelles (a percuter : elles explosent) et chasseurs (ils filent devant et tirent) ----
  function droneMesh(big) {
    const g = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(big ? 2.2 : 1.5, 16, 12), lam('#2a2e36', { emissive: '#0c0e12' })); body.scale.y = 0.62; g.add(body);
    const eye = new T3.Mesh(new T3.SphereGeometry(big ? 0.95 : 0.7, 12, 8), bas('#ff2a1a', { fog: false })); eye.position.z = big ? 1.7 : 1.2; g.add(eye); { const gw = glowS(big ? 7 : 5, '#ff3020', 0.8); gw.position.copy(eye.position); g.add(gw); }
    const lt = []; for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.785, arm = new T3.Mesh(new T3.BoxGeometry(big ? 3.2 : 2.4, 0.3, 0.5), lam('#5a606a')); arm.position.set(Math.cos(a) * (big ? 2.4 : 1.8), Math.sin(a) * (big ? 1.6 : 1.2), 0); arm.rotation.z = a; g.add(arm);
      const l = new T3.Mesh(new T3.SphereGeometry(0.35, 8, 6), bas('#ff5a3a', { fog: false })); l.position.set(Math.cos(a) * (big ? 4 : 3), Math.sin(a) * (big ? 2.6 : 2), 0); g.add(l); lt.push(l); }
    if (big) { const tg = new T3.Mesh(new T3.TorusGeometry(4.2, 0.2, 6, 40), bas('#ff3a2a', { fog: false })); tg.position.z = 0.5; g.add(tg); for (let k = 0; k < 4; k++) { const t2 = new T3.Mesh(new T3.BoxGeometry(0.3, 1.6, 0.2), bas('#ff3a2a', { fog: false })), a = k / 4 * Math.PI * 2; t2.position.set(Math.cos(a) * 4.2, Math.sin(a) * 4.2, 0.5); t2.rotation.z = a + Math.PI / 2; g.add(t2); } g.userData.tg = tg; }
    g.userData.lt = lt; return g;
  }
  function enemies(g, PA, grp) {
    L.sent = []; L.chase = []; L.bul = [];
    const sent = (s, x, y, small) => { const m = droneMesh(true); if (small) m.scale.setScalar(0.72); grp.add(m); L.sent.push({ s, x, y, m, alive: true, fT: rr(0.8, 2), ph: rr(0, 6), small }); };
    // a decouvert : de grosses sentinelles (cible rouge : on fonce dedans), et sur la Lune, des tourelles au ras du sol
    for (const s of [1620, 1790, 1970, 2150, 3640, 3760, 3990, 4090, 5560, 5760, 5950]) { const a = rr(0, 6.28), r = rr(6, 16); sent(s, Math.cos(a) * r, Math.sin(a) * r, false); }
    for (const [s, x] of [[6160, 6], [6250, -8], [6350, 4], [6440, -6]]) sent(s, x, -14, false);
    // v417 : DANS LE TUBE, a la place des ecrous : de petits drones-cibles a percuter (carburant et pieces), qui tirent eux aussi
    for (const [a, b] of [[230, 540], [1000, 1520], [2250, 3390], [4160, 4890]]) for (let s = a; s < b; s += rr(42, 60)) { if (L.O.some((o) => o.kind !== 'ast' && Math.abs(o.s - s) < 20)) continue; const an = rr(0, 6.28), r = rr(0, 8); sent(s, Math.cos(an) * r, Math.sin(an) * r, true); }
    for (const [a, b, n] of [[1600, 2200, 2], [3600, 4110, 2], [5500, 6080, 2]]) for (let k = 0; k < n; k++) { const m = droneMesh(false); m.visible = false; grp.add(m); L.chase.push({ a, b, k, n, m, ds: 260, fT: 1 + k * 0.6, ph: k * 2.1, on: false }); }
    // v418 : de VRAIS MISSILES (corps blanc, ogive rouge, ailerons, flamme, trainee de fumee) a la place des boules rouges
    const mBody = new T3.CylinderGeometry(0.22, 0.22, 2.2, 10).rotateX(Math.PI / 2), mNose = new T3.ConeGeometry(0.22, 0.7, 10).rotateX(Math.PI / 2).translate(0, 0, 1.45), mFin = new T3.BoxGeometry(0.9, 0.05, 0.5), mFl = new T3.ConeGeometry(0.2, 1.4, 8, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -1.8);
    const mW = lam('#eceef2', { emissive: '#3a3a3a' }), mR = lam('#e8322a', { emissive: '#5a0a06' }), mD = lam('#2a2e36'), mF = bas('#ffb04a', { transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 24; i++) { const m = new T3.Group(), body = new T3.Group(); m.add(body); body.add(new T3.Mesh(mBody, mW)); body.add(new T3.Mesh(mNose, mR)); for (let k = 0; k < 2; k++) { const f = new T3.Mesh(mFin, mD); f.position.z = -0.85; f.rotation.z = k * Math.PI / 2; body.add(f); } body.add(new T3.Mesh(mFl, mF)); const gw = glowS(3, '#ff9a3a', 0.8); gw.position.z = -1.4; body.add(gw);
      m.visible = false; grp.add(m); L.bul.push({ m, body, on: false, s: 0, x: 0, y: 0, vs: 0, vx: 0, vy: 0, t: 0, smT: 0 }); }
  }
  // un tir n'est PAS precis : il vise un point a 2,5-5 m de la fusee (il passe a cote, en sifflant) ; une fois sur cinq seulement il vise juste
  const fire = (g, s, x, y) => { const b = L.bul.find((q) => !q.on); if (!b) return; const vs = -18, tau = Math.max(0.6, (s - L.s) / Math.max(20, L.v - vs)), a = rr(0, 6.28), off = Math.random() < 0.2 ? rr(0.6, 1.6) : rr(2.6, 5);
    Object.assign(b, { on: true, s, x, y, vs, vx: (L.x + Math.cos(a) * off - x) / tau, vy: (L.y + Math.sin(a) * off - y) / tau, t: 0, smT: 0 }); b.m.visible = true; g.audio.play('whoosh'); };
  // touche par un missile : on est seulement ralenti et secoue (jamais tue, pas de carburant perdu)
  const missileHit = (g, rk) => { L.v *= 0.75; L.inv = 0.6; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); g.audio.play('boomSmall', rk.pos); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.2; g.flashColor = '#ffb070'; (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' }); };
  // le jeu de la zone : tirs, sentinelles percutees, anneaux de boost, ecrous ; appele par le pilotage, une fois par image de vol
  function play(g, rk, dt, s0) {
    const PA = L.PA, run = g.endlessRun, t = L.t;
    // sentinelles : elles tirent quand on approche ; on les percute = elles explosent
    for (const d of L.sent) { if (!d.alive) continue; const ds = d.s - L.s;
      if (ds > (d.small ? 50 : 40) && ds < (d.small ? 150 : 200)) { d.fT -= dt; if (d.fT <= 0) { d.fT = d.small ? 2.8 : 1.9; fire(g, d.s, d.x, d.y); } }
      if (d.s >= s0 - 2 && d.s <= L.s + 2.5 && Math.hypot(L.x - d.x, L.y - d.y) < (d.small ? 3.6 : 4.4)) { d.alive = false; d.m.visible = false; const p = d.m.position.clone(); g.effects.explosion(p, null, false, 'orange'); g.audio.play('target'); g.rig.shake = Math.max(g.rig.shake, 0.7); g.flash = 0.2; g.flashColor = '#ffb070';
        const ev = g.evo, S = EVO.save(g), c = Math.round((d.small ? 90 : 200) * EVO.mult(S.cm) * (EVO.COIN_K || 1)); if (ev) { ev.kills++; ev.coins += c; } if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + (d.small ? 0.3 : 0.8));   // v422 : une goutte seulement (avant 3-4 s : on ne tombait jamais en panne)
        (g.killPops = g.killPops || []).push({ p: p.clone(), t0: performance.now(), txt: '+' + c }); } }
    // la premiere fois qu'on voit une epreuve : une consigne courte (lisible en une seconde)
    { const HINT = { shutter: 'PASSE PAR LE COTE VERT', fan: 'PASSE ENTRE LES PALES', laser: 'PASSE QUAND LE LASER S ECARTE', piston: 'RESTE AU CENTRE', mine: 'EVITE LES MINES', mat: 'EVITE LES ANTENNES', ast: 'PASSE DU COTE LIBRE' }; L.seen = L.seen || {};
      if (!L.hintT || L.t > L.hintT) { for (const o of L.O) { const ds = o.s - L.s; if (ds > 60 && ds < 170 && HINT[o.kind] && !L.seen[o.kind]) { L.seen[o.kind] = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, HINT[o.kind], 2.2, '#ffffff'); break; } }
        if (!L.seen.drone) { const d = L.sent.find((q) => q.alive && q.s - L.s > 50 && q.s - L.s < 170); if (d) { L.seen.drone = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, 'CIBLE ROUGE : FONCE DEDANS !', 2.4, '#ff6a5a'); } } } }
    bossPlay(g, rk, dt);
    // chasseurs : ils arrivent de face, se placent devant, tirent, puis repartent
    for (const c of L.chase) { const on = L.s > c.a && L.s < c.b; if (on && !c.on) { c.on = true; c.ds = 260; c.m.visible = true; if (c.k === 0) { if (CC.L1) CC.L1.msg(g, 'CHASSEURS EN APPROCHE !', 2, '#ff6a5a'); g.audio.play('alarm'); } }
      if (!c.on) continue; const want = on ? 46 + c.k * 12 + 6 * Math.sin(t * 0.7 + c.ph) : 420; c.ds += (want - c.ds) * Math.min(1, dt * (on ? 1.4 : 0.6));
      c.x = Math.cos(t * 0.55 + c.ph) * (10 + 6 * Math.sin(t * 0.3 + c.k)); c.y = Math.sin(t * 0.7 + c.ph * 1.3) * 12;
      if (on && c.ds < 90) { c.fT -= dt; if (c.fT <= 0) { c.fT = 1.5 + c.n * 0.25; fire(g, PA.adv(L.s, c.ds), c.x, c.y); } }
      if (!on && c.ds > 400) { c.on = false; c.m.visible = false; } }
    // les tirs : ils remontent la voie vers la fusee ; touche = on freine, ca secoue (pas mortel)
    for (const b of L.bul) { if (!b.on) continue; b.t += dt; b.s += b.vs * dt; if (PA.cut(b.s)) b.s = PA.cutA(b.s); b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > 4 || b.s < L.s - 20) { b.on = false; b.m.visible = false; continue; }
      if (Math.abs(b.s - L.s) < 2 && Math.hypot(b.x - L.x, b.y - L.y) < 1.3 && L.inv <= 0) { b.on = false; b.m.visible = false; missileHit(g, rk); continue; }
      b.smT -= dt; if (b.smT <= 0) { b.smT = 0.05; g.effects.smokePuff(b.m.position.clone(), new V(0, 0, 0), 0.9, 0.7); } }
    // anneaux d'acceleration
    for (const B of L.boostR) { if (B.done || B.s < s0 - 1 || B.s > L.s + 1) continue; B.done = true; if (Math.hypot(L.x - B.x, L.y - B.y) < 5) { L.boostT = 2.6; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 1); g.audio.play('boostOn'); g.audio.play('whoosh'); if (g.feed) g.feed('BOOST !', '#ffc23a'); g.flash = 0.15; g.flashColor = '#ffe08a'; } }
  }
  // l'animation de tout ce qui bouge (chaque image, meme au menu)
  const _o4 = new T3.Object3D(), _ec = new T3.Color(), _zA = new V(0, 0, 1);
  function animate(g) {
    const PA = L.PA, t = L.t;
    for (const o of L.OB) if (o.upd && Math.abs(o.s - L.s) < 700) o.upd(t);
    for (const A of L.AV) { let i = 0; for (const a of A.list) { const F = PA.fr(a.s, _PF);_o4.position.copy(F.p).addScaledVector(F.r, a.xx(t)).addScaledVector(F.u, a.y); _o4.quaternion.setFromAxisAngle(a.rs, t * a.rw + a.ph); _o4.scale.setScalar(a.rad); _o4.updateMatrix(); A.im.setMatrixAt(i++, _o4.matrix); } A.im.instanceMatrix.needsUpdate = true; }
    for (const d of L.sent) if (d.alive) { placeAt(PA, d.m, d.s, d.x, d.y + Math.sin(t * 1.4 + d.ph) * 0.8); d.m.rotateZ(Math.sin(t * 0.8 + d.ph) * 0.3); if (d.m.userData.tg) d.m.userData.tg.scale.setScalar(1 + 0.12 * Math.sin(t * 6)); for (const l of d.m.userData.lt) l.visible = Math.sin(t * 8 + d.ph) > 0; }
    for (const c of L.chase) if (c.on) { placeAt(PA, c.m, PA.adv(L.s, c.ds), c.x, c.y); c.m.rotateZ(Math.sin(t * 1.2 + c.ph) * 0.5); }
    for (const b of L.bul) if (b.on) { placeAt(PA, b.m, b.s, b.x, b.y); b.body.quaternion.setFromUnitVectors(_zA, _d.set(b.vx, b.vy, -b.vs).normalize()); b.body.rotateZ(L.t * 6); }
    for (const B of L.boostR) B.m.rotation.z = t * 1.5;
  }

  // ============================== v417 : LA LUNE (survol, cratere, puits de roche, coeur de lave) ==============================
  const rockMat = () => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uCore: { value: 7038 }, uFar: { value: 650 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform float uCore; uniform float uFar; varying vec2 vUv; varying vec3 vW;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'void main(){',
      '  vec2 p = vec2(vUv.x / 5.0, vUv.y * 18.0); float r = n(p) * 0.6 + n(p * 2.3) * 0.3 + n(p * 5.1) * 0.1;',
      '  vec3 col = mix(vec3(0.13, 0.12, 0.12), vec3(0.4, 0.37, 0.34), r);',
      '  float cr = 1.0 - smoothstep(0.0, 0.05, abs(n(p * 0.9 + 7.0) - 0.5));',
      '  float heat = clamp(1.0 - abs(vUv.x - uCore) / 480.0, 0.0, 1.0);',
      '  col += vec3(1.0, 0.42, 0.08) * cr * (0.3 + 1.1 * heat) * (0.8 + 0.2 * sin(uT * 3.0 + vUv.x * 0.1));',
      '  float ring = smoothstep(0.94, 1.0, fract(vUv.x / 30.0)); col += vec3(1.0, 0.7, 0.3) * ring * 0.5;',
      '  float fl = abs(vUv.y - 0.75); col = mix(col, vec3(1.0, 0.78, 0.2), (1.0 - smoothstep(0.006, 0.013, fl)) * 0.85);',
      '  col *= 1.0 - smoothstep(uFar * 0.4, uFar, length(cameraPosition - vW));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'].join('\n'), side: T3.DoubleSide });
  function moonWorld(g, PA, grp) {
    const X = textures(), C = PA.W2(MC), Y = new V(0, 1, 0), Z = new V(0, 0, 1);
    // la Lune : une vraie sphere de 500 m qu'on survole puis qu'on traverse
    const pitP = [6545, 7535].map((s) => C.clone().addScaledVector(new V().subVectors(PA.fr(s).p, C).normalize(), RMOON));
    const coreP = []; { let pin = PA.fr(6800).p.distanceTo(C) < 125; for (let s = 6800; s <= 7300; s += 1) { const ins = PA.fr(s).p.distanceTo(C) < 125; if (ins !== pin) coreP.push(PA.fr(s).p.clone()); pin = ins; } } while (coreP.length < 2) coreP.push(new V(0, -1e6, 0));
    const holes = (M, P, rad) => { M.onBeforeCompile = (sh) => { sh.uniforms.uH0 = { value: P[0] }; sh.uniforms.uH1 = { value: P[1] }; sh.uniforms.uHR = { value: rad };
      sh.vertexShader = 'varying vec3 vHW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vHW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform vec3 uH0; uniform vec3 uH1; uniform float uHR; varying vec3 vHW;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (distance(vHW, uH0) < uHR || distance(vHW, uH1) < uHR) discard;'); }; return M; };
    L.holeFx = holes;   // v420 : on VOIT l'entree des puits et des tunnels (plus de mur noir/de lave qu'on traverse sans savoir ce qu'il y a derriere)
    const moon = new T3.Mesh(new T3.SphereGeometry(RMOON, 128, 80), holes(new T3.MeshLambertMaterial({ map: X.moon, color: '#8c8c94', emissive: '#121216', fog: false }), pitP, R + 1.5)); moon.position.copy(C); grp.add(moon); L.moonW = moon;
    const onS = (dir, h) => C.clone().addScaledVector(dir, RMOON + (h || 0));
    const upTo = (o, dir) => { o.quaternion.setFromUnitVectors(Y, dir); return o; };
    // les deux crateres-puits (entree en haut, sortie en dessous) : fosse noire, rebord, lampes
    for (const s of [6545, 7535]) { const F = PA.fr(s), dir = new V().subVectors(F.p, C).normalize();
      const pit = new T3.Mesh(new T3.RingGeometry(R + 1.5, 24, 40), bas('#050506', { fog: false, side: T3.DoubleSide })); pit.position.copy(onS(dir, 0.6)); pit.quaternion.setFromUnitVectors(Z, dir); grp.add(pit);
      const rim = new T3.Mesh(new T3.TorusGeometry(27, 4, 10, 48), lam('#8a8680', { emissive: '#1a1a1c' })); rim.position.copy(onS(dir, 1)); rim.quaternion.setFromUnitVectors(Z, dir); grp.add(rim);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, l = new T3.Mesh(new T3.SphereGeometry(0.9, 8, 6), bas('#ffb84a', { fog: false })); l.position.set(Math.cos(a) * 27, Math.sin(a) * 27, 4.5); rim.add(l); } }
    // la base lunaire sur la face qu'on survole : domes, antennes, plateformes, crateres
    const rnd = (() => { let x = 77; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
    const R0 = PA.R0, F0 = PA.F0;
    const at = (th, ph) => new V().addScaledVector(Y, Math.cos(th) * Math.cos(ph)).addScaledVector(F0, -Math.sin(th) * Math.cos(ph)).addScaledVector(R0, Math.sin(ph)).normalize();   // th : du sommet vers l'arriere, ph : de cote
    for (let k = 0; k < 70; k++) { const th = rnd() * 0.75 - 0.05, ph = (rnd() - 0.5) * 0.9, d = at(th, ph), r = 6 + rnd() * 26;
      if (Math.abs(ph) < 0.07) continue; const c = new T3.Mesh(new T3.TorusGeometry(r, r * 0.12, 6, 28), lam('#5a5652', { emissive: '#121214' })); c.position.copy(onS(d, 0.3)); c.quaternion.setFromUnitVectors(Z, d); c.scale.z = 0.4; grp.add(c); }
    const dome = (th, ph, r) => { const d = at(th, ph), o = upTo(new T3.Group(), d); o.position.copy(onS(d, -1)); grp.add(o); o.add(new T3.Mesh(new T3.SphereGeometry(r, 24, 12, 0, 6.283, 0, Math.PI / 2), lam('#e8eaee', { emissive: '#30343a' }))); o.add(new T3.Mesh(new T3.CylinderGeometry(r * 1.05, r * 1.1, 1.2, 24), lam('#5a5f68')));
      for (let j = 0; j < 6; j++) { const w = new T3.Mesh(new T3.BoxGeometry(1.4, 0.9, 0.2), bas('#ffe08a', { fog: false })), a = j / 6 * 6.283; w.position.set(Math.cos(a) * r * 0.86, r * 0.35, Math.sin(a) * r * 0.86); w.lookAt(0, r * 0.35, 0); o.add(w); } };
    const mast = (th, ph, h) => { const d = at(th, ph), o = upTo(new T3.Group(), d); o.position.copy(onS(d, 0)); grp.add(o); o.add(bakeBox([{ s: [1, h, 1], c: '#c8ccd2', p: [0, h / 2, 0] }, { s: [5, 0.4, 0.4], c: '#e8322a', p: [0, h * 0.8, 0] }, { s: [3, 0.4, 0.4], c: '#c8ccd2', p: [0, h * 0.6, 0] }]));
      const l = new T3.Mesh(new T3.SphereGeometry(0.7, 8, 6), bas('#ff3a2a', { fog: false })); l.position.y = h + 0.6; o.add(l); (L.blinks = L.blinks || []).push(l); };
    for (const [th, ph, r] of [[0.55, 0.13, 9], [0.5, -0.16, 12], [0.36, 0.2, 7], [0.25, -0.12, 10], [0.15, 0.16, 8], [0.62, -0.1, 6]]) dome(th, ph, r);
    for (const [th, ph, h] of [[0.58, 0.07, 14], [0.44, -0.09, 18], [0.3, 0.1, 12], [0.2, -0.08, 16], [0.1, 0.09, 13]]) mast(th, ph, h);
    for (const [th, ph] of [[0.48, 0.26], [0.32, -0.25]]) { const d = at(th, ph), o = upTo(new T3.Group(), d); o.position.copy(onS(d, 0.2)); grp.add(o); o.add(new T3.Mesh(new T3.CylinderGeometry(10, 10, 0.4, 8), lam('#8a8c90'))); for (let j = 0; j < 8; j++) { const l = new T3.Mesh(new T3.SphereGeometry(0.5, 6, 4), bas('#7af0ff', { fog: false })), a = j / 8 * 6.283; l.position.set(Math.cos(a) * 9.5, 0.4, Math.sin(a) * 9.5); o.add(l); } }
    // le puits et la sortie : tunnel de roche aux fissures de lave
    const RMt = rockMat(); L.rockMats = [RMt]; for (const [a, b] of ROCK) { const m = new T3.Mesh(sweep(PA, a, b, R, 40, 3), RMt); m.frustumCulled = false; grp.add(m); }
    // le COEUR : une grande chambre de lave (vue de l'interieur), anneaux de reacteur autour de la voie
    { const ch = new T3.Mesh(new T3.SphereGeometry(125, 48, 32), new T3.ShaderMaterial({ uniforms: { uT: { value: 0 }, uH0: { value: coreP[0] }, uH1: { value: coreP[coreP.length - 1] }, uHR: { value: R + 1 } }, side: T3.BackSide,
        vertexShader: 'varying vec3 vP; varying vec3 vHW; void main(){ vP = normalize(position); vHW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uT; uniform vec3 uH0; uniform vec3 uH1; uniform float uHR; varying vec3 vP; varying vec3 vHW; float h(vec3 p){ return fract(sin(dot(p, vec3(12.9, 78.2, 37.7))) * 43758.5); } void main(){ if (distance(vHW, uH0) < uHR || distance(vHW, uH1) < uHR) discard; float a = sin(vP.x * 9.0 + uT) * sin(vP.y * 7.0 - uT * 0.7) * sin(vP.z * 8.0 + uT * 0.5); vec3 c = mix(vec3(0.35, 0.06, 0.02), vec3(1.0, 0.55, 0.12), smoothstep(-0.2, 0.9, a)); c *= 0.75 + 0.25 * step(0.97, h(floor(vP * 40.0))); gl_FragColor = vec4(c, 1.0); }' }));
      ch.position.copy(C); grp.add(ch); L.core = ch; L.coreRings = [];
      for (const [s, r] of [[6990, 30], [7038, 46], [7090, 30]]) { const o = placeAt(PA, new T3.Mesh(new T3.TorusGeometry(r, 1.6, 10, 64), lam('#3a3e46', { emissive: '#ff5a1a' })), s); grp.add(o); L.coreRings.push(o); }
      const gl = glowS(260, '#ff7a2a', 0.5); gl.position.copy(C); grp.add(gl); }
  }
  // les epreuves de la Lune : grandes antennes (survol), dents de roche et jets de lave (puits), rochers du coeur
  function moonObstacles(g, PA, grp, K) {
    const OB = L.O, rockM = new T3.MeshLambertMaterial({ color: '#3e342e', emissive: '#3a1206', side: T3.DoubleSide }), lavaM = [bas('#ffb03a', { fog: false }), bas('#ff5a10', { fog: false, transparent: true, opacity: 0.35, blending: T3.AdditiveBlending, depthWrite: false })];
    // SURVOL : de grandes antennes plantees dans la Lune montent jusqu'a la voie : passer a cote
    for (const [s, x0] of [[6200, -9], [6300, 10], [6400, -4], [6480, 8]]) { const h = placeAt(PA, new T3.Group(), s); grp.add(h); h.add(bakeBox([{ s: [2.4, 40, 2.4], c: '#c8ccd2', p: [x0, -12, 0] }, { s: [2.6, 1, 2.6], c: '#e8322a', p: [x0, 2, 0] }, { s: [2.6, 1, 2.6], c: '#e8322a', p: [x0, -6, 0] }, { s: [9, 0.6, 0.6], c: '#c8ccd2', p: [x0, 4, 0] }]));
      const l = new T3.Mesh(new T3.SphereGeometry(0.8, 8, 6), bas('#ff3a2a', { fog: false })); l.position.set(x0, 8.6, 0); h.add(l); (L.blinks = L.blinks || []).push(l);
      OB.push({ s, th: 1.2 + RK, kind: 'mat', hit: (x, y) => (Math.abs(x - x0) < 1.2 + RK && y < 8) || (Math.abs(y - 4) < 0.3 + RK && Math.abs(x - x0) < 4.5) }); }
    // LE PUITS et LA SORTIE : dents de roche (volets de pierre) et jets de lave (barres orange)
    K.shutter(6620, Math.PI, 2.6, 0.3, rockM); K.laser(6690, 'h', 10, 0.8, 0, lavaM); K.shutter(6770, 0, 2.6, -0.3, rockM); K.laser(6850, 'v', 10, 0.9, 1, lavaM);
    K.shutter(7230, Math.PI / 2, 2.6, 0.35, rockM); K.laser(7310, 'h', 10, 0.9, 2, lavaM); K.shutter(7390, -Math.PI / 2, 2.6, -0.35, rockM); K.laser(7470, 'rot', 0, 0.5, 0, lavaM);
    // LE COEUR : quelques rochers qui flottent dans la lave
    for (const [s, x, y, r] of [[6950, 9, 4, 3.5], [6990, -10, -6, 4], [7060, 6, -9, 3.5], [7110, -8, 8, 4]]) K.ast(s, x, y, r, 3, 0.4);
  }
  // ============================== v417 : LE BOSS, CROISEUR LUNAIRE (3 coups, on le percute partout) ==============================
  function bossBuild(g, PA, grp) {
    const m = new T3.Group(), hull = '#6e747e', dk = '#23262c', rd = '#e8322a', P = [];
    P.push({ s: [16, 7, 46], c: hull, p: [0, 0, -4] }, { s: [12, 5, 10], c: hull, p: [0, -0.5, 22] }, { s: [6, 3.6, 8], c: hull, p: [0, -1, 30] },
      { s: [16.4, 1.2, 46.4], c: dk, p: [0, -2.2, -4] }, { s: [16.6, 0.6, 3], c: rd, p: [0, 1.5, 12] }, { s: [16.6, 0.6, 3], c: rd, p: [0, 1.5, -20] },
      { s: [7, 8, 11], c: hull, p: [0, 7, -12] }, { s: [7.4, 1.4, 11.4], c: dk, p: [0, 9, -12] }, { s: [1, 10, 1], c: '#9aa4ae', p: [0, 15, -14] },
      { s: [24, 1.2, 9], c: dk, p: [0, 0, -18] }, { s: [4, 4, 12], c: hull, p: [-12, 0, -18] }, { s: [4, 4, 12], c: hull, p: [12, 0, -18] });
    m.add(bakeBox(P));
    for (const [x, y, z] of [[0, 4, 10], [0, 4, -2], [-6, -4, 4], [6, -4, 4]]) { const t = new T3.Group(); t.position.set(x, y, z); m.add(t); t.add(new T3.Mesh(new T3.CylinderGeometry(2.2, 2.6, 1.6, 12), lam(dk))); for (const sx of [-0.6, 0.6]) { const b = new T3.Mesh(new T3.CylinderGeometry(0.35, 0.35, 5, 8), lam('#5a606a')); b.rotation.x = Math.PI / 2; b.position.set(sx, 0.6, 2.4); t.add(b); } }
    for (const x of [-5, 0, 5]) { const e = new T3.Mesh(new T3.CylinderGeometry(2, 2.4, 3, 14), lam(dk)); e.rotation.x = Math.PI / 2; e.position.set(x, 0, -28.5); m.add(e); const gw = glowS(10, '#ff8a3a', 0.9); gw.position.set(x, 0, -30.5); m.add(gw); }
    for (let k = 0; k < 6; k++) { const w = new T3.Mesh(new T3.BoxGeometry(1.2, 0.8, 0.2), bas('#ff5a3a', { fog: false })); w.position.set(-2.5 + k, 8.2, -6.4); m.add(w); }
    const beacon = new T3.Mesh(new T3.SphereGeometry(0.9, 10, 8), bas('#ff2a1a', { fog: false })); beacon.position.set(0, 20.5, -14); m.add(beacon);
    // la GRANDE CIBLE ROUGE (face au joueur) et l'enseigne
    const tg = new T3.Group(); tg.position.set(0, 2, 34); m.add(tg); tg.add(new T3.Mesh(new T3.TorusGeometry(13, 0.5, 8, 64), bas('#ff3a2a', { fog: false }))); tg.add(new T3.Mesh(new T3.TorusGeometry(7, 0.35, 8, 48), bas('#ff3a2a', { fog: false })));
    for (let k = 0; k < 4; k++) { const t2 = new T3.Mesh(new T3.BoxGeometry(0.6, 4, 0.3), bas('#ff3a2a', { fog: false })), a = k / 4 * Math.PI * 2; t2.position.set(Math.cos(a) * 13, Math.sin(a) * 13, 0); t2.rotation.z = a + Math.PI / 2; tg.add(t2); }
    { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const x = cv.getContext('2d'); x.fillStyle = 'rgba(20,6,6,0.85)'; x.fillRect(0, 0, 512, 192); x.strokeStyle = '#ff3a2a'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 182); x.fillStyle = '#ff3a2a'; x.font = '900 64px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BOSS', 256, 56); x.fillStyle = '#ffffff'; x.font = '900 46px Arial Black, Arial, sans-serif'; x.fillText('CROISEUR LUNAIRE', 256, 134);
      const sp = new T3.Sprite(new T3.SpriteMaterial({ map: new T3.CanvasTexture(cv), transparent: true, fog: false, depthTest: false })); sp.scale.set(26, 9.75, 1); sp.position.set(0, 26, 0); sp.renderOrder = 20; }
    m.visible = false; grp.add(m);
    L.boss = { m, tg, beacon, s: 7800, sT: 7800, x: 0, y: 0, hp: 3, on: false, dead: false, deadT: 0, hitT: 0, fT: 2, cap: PA.len - 420, boomT: 0 };
  }
  function bossPlay(g, rk, dt) {
    const B = L.boss, PA = L.PA; if (!B || (B.dead && B.deadT > 3)) return;
    if (!B.on && L.s > 7540 - 260) { B.on = true; B.m.visible = true; if (CC.L1) CC.L1.msg(g, 'BOSS : FONCE DANS LE CROISEUR (3 COUPS)', 3, '#ff5a3a'); g.audio.play('robotAlarm'); }
    if (!B.on) return; const t = L.t;
    if (B.dead) { B.deadT += dt; B.boomT -= dt; if (B.boomT <= 0 && B.deadT < 2.4) { B.boomT = 0.18; const p = B.m.position.clone().add(new V(rr(-8, 8), rr(-4, 6), rr(-20, 20))); g.effects.explosion(p, null, false, 'orange'); g.audio.play('boomSmall', p); }
      if (B.deadT > 2.4 && B.m.visible) { B.m.visible = false; g.flash = 0.6; g.flashColor = '#ffd8a0'; g.audio.play('boom'); g.rig.shake = 1.4; for (let k = 0; k < 6; k++) g.effects.explosion(B.m.position.clone().add(new V(rr(-10, 10), rr(-6, 6), rr(-20, 20))), null, false, 'orange'); } return; }
    B.hitT -= dt; B.s += (B.sT - B.s) * Math.min(1, dt * (B.hitT > 0 ? 2.5 : 1.2)); B.x = 7 * Math.sin(t * 0.45); B.y = 3 * Math.sin(t * 0.6);
    const capped = B.sT >= B.cap - 1;
    // il tire : une balle visee (phase 1), trois en eventail ensuite
    const ds = B.s - L.s, ph = 3 - B.hp; if (ds > 45 && ds < 280) { B.fT -= dt; if (B.fT <= 0) { B.fT = [1.6, 1.25, 0.95][ph]; fire(g, B.s - 30, B.x, B.y + 4); if (ph >= 1) { fire(g, B.s - 30, B.x - 7, B.y - 3); fire(g, B.s - 30, B.x + 7, B.y - 3); } } }
    // la fusee le percute (n'importe ou sur la coque ; tout le passage quand il est au bout de l'arene)
    if (B.hitT <= 0 && L.s > B.s - 30 && L.s < B.s + 30 && (capped || (Math.abs(L.x - B.x) < 9 + RK && Math.abs(L.y - B.y) < 6 + RK))) {
      B.hp = capped ? 0 : B.hp - 1; B.hitT = 1.6; L.inv = 1.2; L.v *= 0.6; g.rig.shake = 1.2; g.flash = 0.35; g.flashColor = '#ffffff'; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); g.audio.play('reactorHit'); g.audio.play('boom');
      if (EVO.onBossHit) EVO.onBossHit(g, null); rk.fuel = Math.min(rk.fuelMax, rk.fuel + 6);
      if (B.hp <= 0) { B.dead = true; B.deadT = 0; if (CC.L1) CC.L1.msg(g, 'CROISEUR DETRUIT !', 3, '#ffe9a0'); g.audio.play('victory'); }
      else { B.sT = Math.min(B.cap, L.s + 330); if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 2, '#ff9a5a'); }
      (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 3, 0)), t0: performance.now(), txt: B.hp > 0 ? '-1' : 'BOUM !' }); return; }
    // on l'a evite : il repart devant
    if (L.s > B.s + 30 && !capped) { B.sT = Math.min(B.cap, L.s + 260); B.s = Math.max(B.s, L.s + 120); if (CC.L1) CC.L1.msg(g, 'IL REVIENT !  FONCE DEDANS', 1.6, '#ff6a5a'); }
  }
  function bossAnim(g, dt) { const B = L.boss; if (!B || !B.on || !B.m.visible) return; if (!B.dead) { placeAt(L.PA, B.m, B.s, B.x, B.y); B.m.rotateY(Math.PI); } else { B.m.position.y -= dt * 4; B.m.rotateZ(dt * 0.4); } B.tg.scale.setScalar(1 + 0.08 * Math.sin(L.t * 5)); B.tg.visible = !B.dead; B.beacon.visible = Math.sin(L.t * 8) > 0; }
  // ============================== LA FICHE DU NIVEAU 4 ==============================
  { const Dc = CC.Zones.defs && CC.Zones.defs.campagne; if (Dc) { Dc.scenes.lpad = { len: [800, 800], noDoor: true, noChaos: true, noDress: true, build() {} }; Dc.scenes.lvide = { len: [1000, 1000], noDoor: true, noChaos: true, noDress: true, grass: false, build() {} }; } }
  const CH4 = ZN.map((z) => [z[3], z[0], z[2]]);
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 4) || g.evoPreview) return _ld(g);
    EVO.chapters = CH4.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { EVO.SCENE_AUDIO.lpad = 'evoDawn'; EVO.SCENE_AUDIO.lmontee = 'sky'; EVO.SCENE_AUDIO.lnuages = 'sky'; for (const z of ZN.slice(2)) EVO.SCENE_AUDIO[z[2]] = 'espace'; }
    return EVO.baseDef({ zone: 'campagne', len: 6600, scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 4404, bossEnt: null });
  };

  // ============================== CONSTRUCTION, PILOTAGE, CAMERA ==============================
  const dispose = (g) => { if (!L) return; if (L.grp) g.scene.remove(L.grp); if (L.sky) g.scene.remove(L.sky); if (L.dust) g.scene.remove(L.dust); if (L.far0) { g.camera.far = L.far0; g.camera.updateProjectionMatrix(); } L = null; EVO.space = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); };
  function build(g) {
    const pad = g.pad, run = g.endlessRun, T = run.T, a = T.at(0, 0, 0), b = T.at(8, 0, 0), F0 = new V(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const O = (pad && pad.origin ? pad.origin.clone() : new V(a[0], a[1] + 2, a[2]));
    L = EVO.space = { tubeMats: [], beacons: [], t: 0, s: 0, x: 0, y: 0, v: 0, started: false, smokeT: 0, cam: null, inv: 0, boostT: 0, bk: 0, zi: 0 };
    // la fusee part DEBOUT de la table de lancement : le depart de la voie = le centre de la fusee posee sur la table (6,6 m au-dessus du sol)
    L.rkL = (EVO.rocketLen && EVO.rocketLen(g)) || 2.4; L.groundY = (() => { try { return U.clamp(T.base(0), O.y - 6, O.y); } catch (e) { return O.y - 0.8; } })(); O.y = L.groundY + 6.6 + L.rkL * 0.5;
    const PA = L.PA = buildPath(O, F0), grp = L.grp = new T3.Group(); g.scene.add(grp);
    const sV = PA.sOf([0, 905, 880]), sC = PA.sOf([-250, 820, 1940]), sE = PA.sOf([-300, 900, 2700]), sJ = PA.sOf([-310, 1130, 3180]);
    L.gap1 = GAPS[0].slice(); L.gap2 = GAPS[1].slice(); L.gap3 = [GAPS[2][0], PA.len];
    L.tubeSecs = [[140, L.gap1[0]], [L.gap1[1], L.gap2[0]], [L.gap2[1], L.gap3[0]]];
    buildTube(PA, grp, L.tubeSecs); for (const [a, b] of [L.gap1, L.gap2, [L.gap3[0], 6545], [6918, 7158], [7540, PA.len - 70]]) cable(PA, grp, a, b);
    launchPad(g, PA, grp); cloudDeck(PA, grp); spaceStuff(PA, grp, L.gap1, L.gap2); buildSky(g);
    obstacles(g, PA, grp); enemies(g, PA, grp); moonWorld(g, PA, grp); bossBuild(g, PA, grp);
    L.sent = L.sent.filter((d) => { if (PA.cut(d.s)) { d.m.visible = false; return false; } return true; }); L.boostR = L.boostR.filter((B) => { if (PA.cut(B.s)) { B.m.visible = false; return false; } return true; }); L.O = L.OB = L.O.filter((o) => !PA.cut(o.s));
    grp.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (!m.isShaderMaterial && !m.fog) { m.fog = true; m.needsUpdate = true; } });   // v418 : tout s'efface dans la brume au loin
    // poussiere d'espace : des points qui defilent pres de la fusee (on sent la vitesse dans le vide)
    { const n = 120, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#cfe8ff', size: 0.5, transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; g.scene.add(p); L.dust = p; L.dustInit = false; }
    L.far0 = g.camera.far;
  }
  const inTube = (s) => { for (const [a, b] of L.tubeSecs) if (s >= a && s <= b) return true; for (const [a, b] of ROCK) if (s >= a && s <= b) return true; return false; };
  // altitude pour le ciel : une fois dans l'espace, on y reste (sous la Lune, on passe a hauteur du pas de tir : le ciel ne doit pas redevenir bleu)
  const altSky = (y) => { const a = y - L.PA.O.y; return L.s > 1300 ? Math.max(a, 1150) : a; };
  const altOf = (p) => p.y - L.PA.O.y;

  // --- pilotage le long de la voie (remplace le pas physique de la fusee au niveau 4) ---
  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on4(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA, inp = g.input; this.age += dt; if (!this.ignited && this.age >= this.cfg.ignitionDelay) { this.ignited = true; g.audio.play('ignite', this.pos); }
    if (!L.started) { L.started = true; L.s = 0; L.x = 0; L.y = 0; L.v = Math.max(26, this.vel.length()); L.launchT = 0; const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); L.yaw0 = e.y; L.pit0 = e.x; L.ry = 0; L.rp = 0; }
    // la commande : l'ecart de cap du joystick / des fleches depuis le depart = ou on veut aller dans le tube ; il revient doucement au centre
    { const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); let dy = e.y - L.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); L.ry = U.clamp(dy, -0.62, 0.62) * Math.exp(-dt * 0.9); L.rp = U.clamp(e.x - L.pit0, -0.62, 0.62) * Math.exp(-dt * 0.9); inp.setAim(L.yaw0 + L.ry, L.pit0 + L.rp); }
    const F = PA.fr(L.s), alt = altSky(F.p.y), up = U.clamp(F.t.y, 0, 1), atmo = 1 - ss(500, 900, alt), s0 = L.s;
    // la zone : titre a l'entree, accelerateur
    const zi = zoneAt(L.s), Z = ZN[zi], boostZ = Z[5] === 'boost';
    if (zi !== L.zi) { L.zi = zi; if (CC.L1) CC.L1.msg(g, Z[3] + (boostZ ? ' !' : ''), 2.2, Z[4]); if (boostZ) { g.audio.play('boostOn'); g.audio.play('whoosh'); } else if (Z[5] === 'open') g.audio.play('jetPass'); else g.audio.play('alarm'); }
    if (L.boostT > 0) L.boostT -= dt; if (L.inv > 0) L.inv -= dt;
    // v417 : vrai carburant (les accelerateurs et les anneaux portent la fusee gratuitement ; drones et anneaux en redonnent)
    if (!(boostZ || L.boostT > 0)) this.fuel = Math.max(0, this.fuel - dt); const dry = this.fuel <= 0;
    if (dry && !L.dry) { L.dry = 1; if (CC.L1) CC.L1.msg(g, 'PLUS DE CARBURANT !', 2, '#ff6a5a'); g.audio.play('warnFuel'); } if (!dry) L.dry = 0;
    const vMax = L.boostT > 0 ? 96 : boostZ ? 80 : 47 + 9 * ss(500, 1000, alt);   // v419 : retour a la vitesse de la v417 (la vitesse qui grandit rendait l'esquive trop dure) ; accelerateurs et anneaux : on file
    L.bk += ((L.boostT > 0 ? 1 : boostZ ? 0.65 : 0) - L.bk) * Math.min(1, dt * 3);
    if (dry) { L.v -= (11 + 12 * up * atmo) * dt; L.y -= (3 + 9 * U.clamp(1 - L.v / 50, 0, 1)) * dt; L.rp = Math.min(L.rp, -0.15); if (L.v < 14 && this.active) { g.onRocketCrash('stalled', this.pos.clone(), null); return; } }   // a sec : la fusee ralentit, pique du nez et tombe vers le bas de la voie, puis s'arrete (v422 : plus vite qu'avant)
    else { L.v += ((this.throttle || this.freeBoost || boostZ || L.boostT > 0 ? vMax : vMax * 0.7) - L.v) * Math.min(1, dt * (L.v < vMax ? 1.4 : 0.9)) - 6 * up * atmo * dt; L.v = Math.max(24, L.v); }   // la pesanteur freine un peu la montee verticale
    const vx = -L.v * Math.sin(L.ry) * 0.85, vy = L.v * Math.sin(L.rp) * 0.85, lat = Math.min(1, 52 / L.v); L.x += vx * lat * dt; L.y += vy * lat * dt; L.s += L.v * dt; if (PA.cut(L.s)) L.s = PA.toOld(PA.toNew(L.s));   // a grande vitesse, le deplacement de cote reste le meme (pas de glissade incontrolable)
    // le tube retient la fusee (on glisse sur la paroi, etincelles) ; a decouvert, une limite douce plus large
    const lim = inTube(L.s) ? R - 2.2 : Z[2] === 'lsurface' ? 22 : ROPEN - 2, rr2 = Math.hypot(L.x, L.y);
    if (rr2 > lim) { L.x *= lim / rr2; L.y *= lim / rr2; L.v *= 1 - dt * 0.6; if (inTube(L.s) && Math.random() < dt * 14) { const F2 = PA.fr(L.s); _a.copy(F2.p).addScaledVector(F2.r, L.x * 1.12).addScaledVector(F2.u, L.y * 1.12); g.effects.sparks.emit({ pos: _a.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(10), life: 0.4, s0: 0.3, s1: 0.4, s2: 0.1, cols: g.effects.pal.cyan, drag: 1, grav: 0, a: 1, fout: 0.5 }); if (Math.random() < 0.15) g.audio.play('clank'); } }
    const F2 = PA.fr(L.s); this.pos.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y);
    this.vel.copy(F2.t).multiplyScalar(L.v).addScaledVector(F2.r, vx * lat).addScaledVector(F2.u, vy * lat); this.speed = this.vel.length(); this.fwd.copy(this.vel).normalize(); this.flightDist += L.v * dt;
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, PA.toNew(L.s));   // v421 : la distance affichee = la voie raccourcie
    this.thrustK = 1;
    // les obstacles du programme (teste dans la section du tube, sur tout le trajet de l'image : rien ne passe au travers)
    if (L.inv <= 0 && L.OB) for (const o of L.OB) { if (o.s + o.th < s0 || o.s - o.th > L.s) continue; if (o.hit(L.x, L.y, L.t)) { g.onRocketCrash('wall', this.pos.clone(), F2.t.clone().negate()); if (this.active) { L.inv = 0.8; L.v *= 0.5; g.rig.shake = Math.max(g.rig.shake, 1); } break; } }
    if (this.active && L.sent) play(g, this, dt, s0);
    if (this.active && L.s > PA.len - 60 && (!L.boss || L.boss.dead) && !g.evoFinish && EVO.finishRun) { if (CC.L1) CC.L1.msg(g, 'ARRIVEE !', 2.6, '#ffe9a0'); EVO.finishRun(g); }
  };

  // --- AU MENU (et pendant la charge) : la fusee debout sur la table de lancement, la tour de 150 m derriere elle ---
  function menuView(g, rig, dt) {
    const PA = L.PA, O = PA.O, R0 = PA.R0, F0 = PA.F0, cam = rig.cam, rk = g.rocket, A = g.evoAnim, Y = new V(0, 1, 0), Lw = L.rkL;
    if (rk.mesh) { rk.mesh.visible = true; rk.mesh.position.copy(O); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(_a.copy(R0).negate(), _c.copy(F0).negate(), Y)); }
    let p, look; const t = L.t;
    if (A && A.kind === 'tier') { const an = -1.1 + Math.sin(A.t * 0.5) * 0.35, D = U.clamp(2.8 * Lw, 4.5, 8); p = new V().copy(O).addScaledVector(R0, -Math.cos(an) * D).addScaledVector(F0, Math.sin(an) * D).addScaledVector(Y, Lw * 0.3); look = O.clone(); }   // amelioration : tout pres de la fusee, on voit la piece arriver
    else { const ch = g.evoAim ? (g.evoAim.lock ? 1 : g.evoAim.ch || 0) : 0; const D = Math.max(1, Lw / 2.4); p = new V().copy(O).addScaledVector(R0, (-3.4 + 0.8 * ch) * D).addScaledVector(F0, (-3.2 - 0.6 * Math.sin(t * 0.12)) * D).addScaledVector(Y, -0.3 * D); look = new V().copy(O).addScaledVector(R0, 0.25 * D).addScaledVector(Y, (0.35 - 0.2 * ch) * D);
      if (ch > 0.2) { p.x += (Math.random() - 0.5) * 0.12 * ch; p.y += (Math.random() - 0.5) * 0.12 * ch; } }
    if (!L.mc) { L.mc = p.clone(); L.ml = look.clone(); } const k = 1 - Math.exp(-dt * 4); L.mc.lerp(p, k); L.ml.lerp(look, k);
    cam.position.copy(L.mc); cam.up.set(0, 1, 0); cam.lookAt(L.ml); if (Math.abs(cam.fov - 55) > 0.01) { cam.fov = 55; cam.updateProjectionMatrix(); } if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); } cam.updateMatrixWorld();
  }
  // --- la camera suit le repere de la voie (on regarde vers l'avant de la voie, le haut = le haut de la voie) ---
  const _rup = CC.CameraRig.prototype.update;
  CC.CameraRig.prototype.update = function (dt) {
    _rup.call(this, dt); const g = this.game, rk = g.rocket;
    if (L && L.PA && on4(g) && !rk.active && (g.state === 'MENU' || g.state === 'AIM' || g.state === 'LAUNCH')) { menuView(g, this, dt); return; }
    if (!L || !L.PA || !on4(g) || !rk.active || g.state !== 'FLIGHT' || !L.started || (g.evoFinish && g.evoFinish.hold)) return;
    const PA = L.PA, cam = this.cam, F = PA.fr(L.s + 6), Fq = frameQ(F, _q2.clone());
    if (!L.camQ) L.camQ = Fq.clone(); L.camQ.slerp(Fq, 1 - Math.exp(-dt * 3.2));
    const cr = new V(1, 0, 0).applyQuaternion(L.camQ), cu = new V(0, 1, 0).applyQuaternion(L.camQ), cf = new V(0, 0, -1).applyQuaternion(L.camQ);
    const F0 = PA.fr(L.s), ctr = _d.copy(F0.p).addScaledVector(F0.r, L.x * 0.94).addScaledVector(F0.u, L.y * 0.94), bkD = U.clamp(1.5 * L.rkL, 3.6, 7.5);   // v420 : camera proche comme aux niveaux 1-3 (la fusee n'est plus toute petite)
    cam.position.copy(ctr).addScaledVector(cf, -bkD).addScaledVector(cu, 0.47 * bkD);
    cam.up.copy(cu); cam.lookAt(_a.copy(rk.pos).addScaledVector(cf, 4).addScaledVector(cu, 0.3));
    // au decollage : on part de la vue du menu (pres de la fusee, la tour derriere) et on recule vers une grande vue depuis le sol, puis la poursuite entre 50 et 220 m
    { const b = ss(50, 220, L.s); if (b < 1) { const qC = _q.copy(cam.quaternion), pC = _c.copy(cam.position), O = PA.O, k = ss(0, 70, L.s);
      const D = Math.max(1, L.rkL / 2.4), pL = new V().copy(O).addScaledVector(PA.R0, -(3.4 * D + 30 * k)).addScaledVector(PA.F0, -(3.2 * D + 58 * k)).add(_b.set(0, -0.3 * D + 14.3 * k + L.s * 0.35, 0));
      const lk = new V().copy(O).addScaledVector(PA.R0, 0.25 * D).add(_b.set(0, 0.35 * D, 0)).lerp(_a.copy(rk.pos).add(_b.set(0, 10 + L.s * 0.15, 0)), ss(0, 25, L.s));
      cam.position.copy(pL); cam.up.set(0, 1, 0); cam.lookAt(lk); const qL = _q2.copy(cam.quaternion);
      cam.position.lerpVectors(pL, pC, b); cam.quaternion.copy(qL).slerp(qC, b); cam.up.set(0, 1, 0).applyQuaternion(cam.quaternion); } }
    { const f0 = cam.fov, fw = f0 + 16 * L.bk; if (Math.abs(fw - f0) > 0.01) { cam.fov = fw; cam.updateProjectionMatrix(); } }   // accelerateur : le champ s'elargit, les parois filent
    if (this.shake > 0) { cam.position.addScaledVector(cr, (U.fx() - 0.5) * this.shake * 0.5).addScaledVector(cu, (U.fx() - 0.5) * this.shake * 0.5); }
    if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    // la fusee : son nez suit sa trajectoire, son « dessus » reste le haut de la voie
    { const fz = _c.copy(rk.fwd), fx = _a.crossVectors(cu, fz).normalize(), fy = _b.crossVectors(fz, fx); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(fx, fy, fz)); if (!(rk.skin && rk.skin.build)) rk.mesh.quaternion.multiply(_q.setFromAxisAngle(new V(0, 0, 1), rk.roll || 0)); rk.mesh.position.copy(rk.pos); }
  };

  // --- au niveau 4 : pas de bande de collines lointaines autour de la camera (vue d'en dessous pendant la montee, elle faisait des murs) ---
  if (CC.Horizon) { const _hu = CC.Horizon.prototype.update; CC.Horizon.prototype.update = function (g) { if (L && on4(g)) { for (const m of [this.ring, this.glow, this.mtn]) if (m) m.visible = false; return; } return _hu.call(this, g); }; }
  // --- ECRASEMENT EN L'AIR / DANS L'ESPACE : pas de chute de 1000 m vers un sol invisible ; l'epave flotte et ralentit, le drapeau se plante EN L'AIR, a cote d'elle (la camera le voit) ---
  const _tf = EVO.tumbleFrame;
  EVO.tumbleFrame = (g, dt) => {
    const Tm = g.evoTumble; if (!Tm || !L || !L.PA || !on4(g)) return _tf(g, dt);
    const alt = Tm.body.m.position.y - L.groundY; if (alt < 40 && !Tm.space) return _tf(g, dt); Tm.space = true;
    for (const q of Tm.P) { q.v.y += 16 * dt; q.v.multiplyScalar(Math.exp(-1.8 * dt)); q.w.multiplyScalar(Math.exp(-0.7 * dt)); }   // on annule la pesanteur de l'epave, elle s'arrete en tournant doucement
    const had = !!Tm.flag; _tf(g, dt);
    if (Tm.flag && !had) { const F = Tm.flag, bp = Tm.body.m.position; F.position.copy(bp).add(new V(0, -2.2, 0)); F.children[F.children.length - 1].visible = false;   // pas de tertre de terre dans le vide
      const ring = new T3.Mesh(new T3.TorusGeometry(0.9, 0.08, 6, 32), bas('#ffe28a', { fog: false })); ring.rotation.x = Math.PI / 2; F.add(ring); F.add(glowS(4, '#ffd27a', 0.6)); F.userData.ring = ring; }
    if (Tm.flag && Tm.space) { const F = Tm.flag; F.position.y += Math.sin(Tm.t * 1.6) * 0.004; if (F.userData.ring) F.userData.ring.scale.setScalar(1 + 0.15 * Math.sin(Tm.t * 4)); }
  };
  // --- l'ambiance selon l'altitude : ciel, brume, sol cache au-dessus des nuages, Terre, etoiles ---
  const SKY = [[0, '#3d6fb8', '#f2b07a', '#e8b896'], [260, '#2c63b8', '#a8ccf0', '#bcd4ee'], [420, '#3a6ac0', '#dfe8f4', '#f2f4f8'], [620, '#14246a', '#4a70c0', '#2a3c80'], [900, '#020308', '#0a1030', '#020308']];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color();
  function skyAt(alt) { let i = 0; while (i < SKY.length - 2 && alt > SKY[i + 1][0]) i++; const A = SKY[i], B = SKY[i + 1], t = U.clamp((alt - A[0]) / (B[0] - A[0]), 0, 1); _c1.set(A[1]).lerp(_c3.set(B[1]), t); _c2.set(A[2]).lerp(_c3.set(B[2]), t); const f = new T3.Color(A[3]).lerp(_c3.set(B[3]), t); return [_c1.clone(), _c2.clone(), f]; }
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on4(g)) return;
    const cam = g.camera, alt = altSky(cam.position.y), [top, hor, fog] = skyAt(alt), K = ss(560, 900, alt);
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(top); u.horizon.value.copy(hor); u.bottom.value.copy(fog); u.cloud.value = 1 - K; if (u.sunDir) { u.sunDir.value.copy(L.PA.R0).multiplyScalar(0.75).addScaledVector(L.PA.F0, 0.5); u.sunDir.value.y = 0.28; u.sunDir.value.normalize(); } }   // le soleil du ciel : bas, sur le cote (pas au zenith)
    const inC = alt > 370 && alt < 470 ? Math.sin((alt - 370) / 100 * Math.PI) : 0;
    g.scene.fog.color.copy(fog); g.scene.fog.near = U.lerp(U.lerp(160, 30, inC), 280, K); g.scene.fog.far = U.lerp(U.lerp(1500, 240, inC), 680, K);   // v418 : dans l'espace on voit ~650 m, comme les autres niveaux (plus tout le parcours d'un coup) if (g.fogBase) { g.fogBase.near = g.scene.fog.near; g.fogBase.far = g.scene.fog.far; g.fogBase.color.copy(fog); }
    g.renderer.setClearColor(fog); if (g.stars) g.stars.visible = false;
    g.nightK = K * 0.8; if (g.postParams) { g.postParams.bloomStrength = 0.1 + 0.3 * K; g.postParams.bloomThreshold = 0.95 - 0.25 * K; g.postParams.vignette = 0.2 + 0.2 * K; g.postParams.saturation = 1.05; g.postParams.contrast = 1.06; }
    g.ambient.intensity = 0.3 + 0.15 * K; g.sun.intensity = 0.85 + 0.4 * K; g.sun.color.set(K > 0.5 ? '#ffffff' : '#ffe2c0');
  };
  // --- chaque image : decor qui vit (bras, nuages, Terre, poussiere), fumee du decollage ---
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!on4(g) || !g.endlessRun || !g.endlessRun.T) return;
    if (!L) { try { build(g); } catch (e) { console.warn('space', e); L = null; return; } }
    const PA = L.PA, rk = g.rocket, cam = g.camera, alt = altSky(cam.position.y), K = ss(560, 900, alt), fx = g.effects; L.t += dt;
    for (const M of L.tubeMats) { M.uniforms.uT.value = L.t; M.uniforms.uK.value = 0.55 + 0.45 * K; M.uniforms.uFar.value = g.scene.fog.far; }
    if (L.rockMats) for (const M of L.rockMats) { M.uniforms.uT.value = L.t; M.uniforms.uFar.value = Math.min(650, g.scene.fog.far); } if (L.core) L.core.material.uniforms.uT.value = L.t; if (L.coreRings) L.coreRings.forEach((o, i) => o.rotateZ(dt * (i % 2 ? -0.5 : 0.4))); if (L.blinks) for (const b of L.blinks) b.visible = Math.sin(L.t * 5) > 0; bossAnim(g, dt);
    // bras de service : ils s'ecartent quand la fusee arrive a leur hauteur
    for (const A of L.arms) { const want = L.started && L.s > A.h - 60 ? 1 : 0; A.k += (want - A.k) * Math.min(1, dt * 2.2); A.piv.rotation.y = -A.k * 1.45; }
    if (L.dish) L.dish.rotation.z = Math.sin(L.t * 0.3) * 0.4;
    // decollage : enorme nuage de fumee qui sort des deux cotes de la fosse, la tour tremble
    if (L.started && L.s < 130 && g.state === 'FLIGHT') { L.smokeT -= dt; if (L.smokeT <= 0) { L.smokeT = 0.07; for (const sd of [-1, 1]) { _a.copy(PA.O).addScaledVector(PA.F0, sd * rr(26, 40)).add(_b.set(0, L.padGy + 3, 0)); fx.smokePuff(_a.clone(), new V(PA.F0.x * sd * rr(18, 34) + rr(-5, 5), rr(3, 10), PA.F0.z * sd * rr(18, 34) + rr(-5, 5)), rr(10, 18), rr(2.2, 3.2)); } } if (L.s < 80) g.rig.shake = Math.max(g.rig.shake, 0.6 * (1 - L.s / 80)); }   // les deux panaches sortent de la fosse, au sol (ils ne cachent plus la fusee)
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.audio.play('rumble'); g.flash = 0.35; g.flashColor = '#ffd8a0'; if (CC.L1) CC.L1.msg(g, 'DECOLLAGE !', 1.8, '#ffe9a0'); }
    // le sol, la base et les nuages disparaissent quand on est au-dessus de la couche ; la Terre apparait dessous
    const hideGround = true;   /* v418 : le sol du niveau 1 n'apparait jamais au niveau 4 (le pas de tir a son propre sol) */ for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = !hideGround; if (L.pad) L.pad.visible = alt < 900; if (L.clouds) L.clouds.visible = alt < 720; if (g.pad && g.pad.hangar && g.state === 'FLIGHT') g.pad.hangar.visible = false;   /* le hangar du menu disparait au decollage */
    for (const o of g.scene.children) if (o.name === 'level') o.visible = false;   if (g.pad && g.pad.evoL) g.pad.evoL.visible = false; if (g.pad && g.pad.hangar) g.pad.hangar.visible = false;   /* niveau 4 : ni le hangar du niveau 1, ni sa rampe : la fusee est sur la table de lancement */
    animate(g);   /* le decor du mode classique (murs du lancement) n'a rien a faire au niveau 4 */
    if (L.sky) { L.sky.position.copy(cam.position); const E = L.earth, hv = 4 + Math.pow(Math.max(0, alt - 450), 1.5) * 0.02 + 900 * ss(7300, 7700, L.s); E.visible = alt > 440; E.position.set(0, -(RS + hv), 0); E.rotation.set(Math.PI / 2 - 0.35, 0, L.t * 0.004); L.cloudSphere.rotation.y = L.t * 0.002;   // le pole est mis sur le cote : sous la fusee on voit l'equateur (oceans, continents), pas la calotte glaciaire
      for (const p of L.stars) p.material.color.setScalar(p.userData.op * ss(500, 850, alt));
      const mf = _a.copy(PA.F0).multiplyScalar(0.8).addScaledVector(PA.R0, -0.25); mf.y = 0.42; mf.normalize(); L.moon.position.copy(mf).multiplyScalar(3200); L.moon.scale.setScalar(1 + 0.25 * ss(0, PA.len, L.s)); L.moon.visible = false;   /* la vraie Lune (une sphere de 500 m sur la voie) remplace la Lune du ciel */
      if (L.sun) { _b.copy(PA.R0).multiplyScalar(0.75).addScaledVector(PA.F0, 0.5); _b.y = 0.28; _b.normalize(); L.sun.position.copy(_b).multiplyScalar(2800); L.sun.material.opacity = 0.25 + 0.75 * K; } }   // le soleil est BAS, sur le cote : on ne le regarde jamais en face pendant la montee
    // la poussiere de l'espace (a decouvert surtout)
    if (L.dust && L.started) { const P = L.dust.geometry.attributes.position, F = PA.fr(L.s), n = P.count; L.dust.material.opacity = Math.max(0.35 * K, 0.7 * L.bk); L.dust.material.size = 0.5 + 0.7 * L.bk;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); if (!L.dustInit || _b.subVectors(_a, rk.pos).dot(F.t) < -10 || _b.length() > 260) { _a.copy(rk.pos).addScaledVector(F.t, L.dustInit ? rr(140, 240) : rr(-10, 240)).addScaledVector(F.r, rr(-70, 70)).addScaledVector(F.u, rr(-70, 70)); P.setXYZ(i, _a.x, _a.y, _a.z); } }
      L.dustInit = true; P.needsUpdate = true; }
  };
})();
