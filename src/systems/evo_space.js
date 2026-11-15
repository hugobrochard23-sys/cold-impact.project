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
  const R = 16, ROPEN = 26, rr = (a, b) => a + Math.random() * (b - a);
  const _a = new V(), _b = new V(), _c = new V(), _d = new V(), _q = new T3.Quaternion(), _q2 = new T3.Quaternion(), _m = new T3.Matrix4();
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  let L = null;   // l'etat du niveau 4 (voie, decor, pilotage), refait a chaque partie

  // ============================== LA VOIE 3D ==============================
  // points de controle dans le repere du pas de tir : [droite, haut, avant] (m)
  const CP = [[0, 0, 0], [0, 140, 0], [0, 300, 0], [0, 460, 6], [0, 600, 60], [0, 720, 190], [0, 820, 380], [0, 880, 620], [0, 905, 880], [-20, 895, 1130],
    [-70, 850, 1360], [-140, 800, 1560], [-210, 790, 1760], [-250, 820, 1940]];
  { const c0 = [-250, 820, 1940]; for (let j = 1; j <= 24; j++) { const a = j / 24 * Math.PI * 2.5; CP.push([c0[0] - 55 + 55 * Math.cos(a), c0[1] + 55 * Math.sin(a), c0[2] + j * 26]); } }   // le tire-bouchon (1 tour 1/4)
  CP.push([-300, 900, 2700], [-310, 1000, 2950], [-310, 1130, 3180], [-300, 1220, 3420], [-280, 1230, 3700], [-250, 1190, 4000], [-230, 1170, 4300], [-220, 1170, 4700], [-220, 1170, 5200]);

  function buildPath(O, F0) {
    const Y = new V(0, 1, 0), R0 = new V().crossVectors(F0, Y).normalize(), W = (p) => new V().copy(O).addScaledVector(R0, p[0]).addScaledVector(Y, p[1]).addScaledVector(F0, p[2]);
    const curve = new T3.CatmullRomCurve3(CP.map(W), false, 'centripetal', 0.5), len = curve.getLength(), N = Math.ceil(len / 2);
    const P = curve.getSpacedPoints(N), step = len / N, T = [], UP = [], RT = [];
    for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; T.push(new V().subVectors(b, a).normalize()); }
    let up = new V().copy(F0).negate();   // au depart (voie verticale), le « haut » de l'ecran regarde vers l'arriere : apres la bascule il devient le ciel
    for (let i = 0; i <= N; i++) { up = up.clone().addScaledVector(T[i], -up.dot(T[i])).normalize(); UP.push(up); RT.push(new V().crossVectors(T[i], up).normalize()); }
    const sOf = (p) => { const q = W(p); let bi = 0, bd = 1e18; for (let i = 0; i <= N; i++) { const d = P[i].distanceToSquared(q); if (d < bd) { bd = d; bi = i; } } return bi * step; };
    const fr = (s, o) => { const u = U.clamp(s / step, 0, N - 1e-4), i = Math.floor(u), f = u - i; o = o || {}; o.p = (o.p || new V()).lerpVectors(P[i], P[i + 1], f); o.t = (o.t || new V()).lerpVectors(T[i], T[i + 1], f).normalize(); o.u = (o.u || new V()).lerpVectors(UP[i], UP[i + 1], f).normalize(); o.r = (o.r || new V()).crossVectors(o.t, o.u).normalize(); return o; };
    return { O, F0, R0, len, step, N, P, T, UP, RT, fr, sOf, W };
  }

  // ============================== LE TUBE TRANSPARENT ==============================
  const tubeMat = () => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uC: { value: new T3.Color('#8fe6ff') }, uC2: { value: new T3.Color('#ffffff') }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform vec3 uC; uniform vec3 uC2; uniform float uK; varying vec3 vN; varying vec3 vW; varying vec2 vUv;',
      'void main(){',
      '  vec3 Vd = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(normalize(vN), Vd)); float fr = pow(f, 3.0);',   // bords du verre brillants (Fresnel) : on SENT la surface
      '  float s = vUv.x, a = vUv.y;',
      '  float gA = abs(fract(a * 24.0) - 0.5), gS = abs(fract(s / 9.0) - 0.5);',
      '  float grid = max(smoothstep(0.455, 0.5, gA), smoothstep(0.47, 0.5, gS));',   // quadrillage fin (panneaux de verre)
      '  float pulse = exp(-pow((fract((s - uT * 75.0) / 150.0) - 0.5) * 16.0, 2.0));',   // une onde de lumiere qui file vers l avant
      '  float hl = exp(-pow((a - 0.18) * 38.0, 2.0)) * 0.55 + exp(-pow((a - 0.31) * 70.0, 2.0)) * 0.3;',   // reflet de la vitre (deux traits brillants)
      '  float fl = abs(a - 0.75); float stripe = (1.0 - smoothstep(0.008, 0.016, fl)) * step(0.45, fract(s / 12.0 - uT * 1.6));',   // bande jaune du plancher : on sait toujours ou est le bas
      '  vec3 col = uC * (0.25 + fr * 1.5) + uC * grid * 0.7 + uC2 * (pulse * 0.6 + hl) + vec3(1.0, 0.78, 0.2) * stripe * 1.4;',
      '  float al = 0.045 + fr * 0.55 + grid * 0.16 + pulse * 0.12 + hl * 0.45 + stripe * 0.85;',
      '  gl_FragColor = vec4(col, min(1.0, al) * uK);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, side: T3.DoubleSide, fog: false });
  // balaye un cercle le long de la voie (tube de verre, rails) ; uv = (distance, angle / 2 pi)
  function sweep(PA, s0, s1, rad, seg, dS, ang0) {
    const n = Math.max(2, Math.ceil((s1 - s0) / dS)), pos = [], nor = [], uv = [], idx = [], F = {};
    for (let i = 0; i <= n; i++) { const s = s0 + (s1 - s0) * i / n; PA.fr(s, F);
      for (let j = 0; j <= seg; j++) { const a = (ang0 || 0) + j / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); _a.copy(F.r).multiplyScalar(c).addScaledVector(F.u, sn);
        pos.push(F.p.x + _a.x * rad, F.p.y + _a.y * rad, F.p.z + _a.z * rad); nor.push(_a.x, _a.y, _a.z); uv.push(s, j / seg); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo;
  }
  // un objet pose dans le repere de la voie a la distance s (x a droite, y en haut, z en avant)
  const frameQ = (F, out) => out.setFromRotationMatrix(_m.makeBasis(F.r, F.u, _d.copy(F.t).negate()));   // -Z de l'objet = l'avant de la voie
  function placeAt(PA, o, s, x, y, zf) { const F = PA.fr(s); o.position.copy(F.p).addScaledVector(F.r, x || 0).addScaledVector(F.u, y || 0).addScaledVector(F.t, zf || 0); frameQ(F, o.quaternion); return o; }

  function buildTube(PA, grp, sections) {
    const M = tubeMat(); L.tubeMats.push(M);
    const ringG = new T3.TorusGeometry(R + 0.12, 0.16, 6, 56), frameG = new T3.TorusGeometry(R + 0.5, 0.55, 8, 56), portG = new T3.TorusGeometry(R + 2.4, 1.3, 10, 64);
    const ringM = bas('#9af0ff', { fog: false, transparent: true, opacity: 0.85 }), frameM = lam('#e8eef6', { emissive: '#3a4a5a' }), portM = bas('#7ad8ff', { fog: false });
    const lightM = bas('#fff2b0', { fog: false }), railM = bas('#7fe8ff', { fog: false, transparent: true, opacity: 0.9 });
    for (const [s0, s1] of sections) {
      const glass = new T3.Mesh(sweep(PA, s0, s1, R, 48, 3), M); glass.renderOrder = 5; glass.frustumCulled = false; grp.add(glass);
      for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) { const g = sweepOff(PA, s0, s1, a); grp.add(new T3.Mesh(g, railM)); }
      const nR = Math.floor((s1 - s0) / 12), rings = new T3.InstancedMesh(ringG, ringM, nR), nF = Math.floor((s1 - s0) / 96) + 1, frames = new T3.InstancedMesh(frameG, frameM, nF), lights = new T3.InstancedMesh(new T3.SphereGeometry(0.75, 8, 6), lightM, nF * 4);
      const o = new T3.Object3D();
      for (let k = 0; k < nR; k++) { placeAt(PA, o, s0 + 6 + k * 12); o.updateMatrix(); rings.setMatrixAt(k, o.matrix); }
      for (let k = 0; k < nF; k++) { const s = s0 + k * 96; placeAt(PA, o, s); o.updateMatrix(); frames.setMatrixAt(k, o.matrix); const F = PA.fr(s);
        for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + Math.PI / 4; o.position.copy(F.p).addScaledVector(F.r, Math.cos(a) * (R + 0.9)).addScaledVector(F.u, Math.sin(a) * (R + 0.9)); o.quaternion.identity(); o.updateMatrix(); lights.setMatrixAt(k * 4 + j, o.matrix); } }
      for (const im of [rings, frames, lights]) { im.frustumCulled = false; grp.add(im); }
      // portails aux deux bouts : gros anneau lumineux + chevrons
      for (const s of [s0, s1]) { const p = placeAt(PA, new T3.Mesh(portG, portM), s); grp.add(p); for (let j = 0; j < 8; j++) { const c = new T3.Mesh(new T3.ConeGeometry(1.2, 3.2, 4), lightM), a = j / 8 * Math.PI * 2; placeAt(PA, c, s, Math.cos(a) * (R + 5), Math.sin(a) * (R + 5)); c.rotateX(-Math.PI / 2); grp.add(c); } }
    }
  }
  function sweepOff(PA, s0, s1, ang) {   // un rail : petit tube a l'exterieur du verre, a l'angle donne
    const n = Math.max(2, Math.ceil((s1 - s0) / 6)), pos = [], idx = [], F = {}, seg = 5;
    for (let i = 0; i <= n; i++) { const s = s0 + (s1 - s0) * i / n; PA.fr(s, F); const cx = Math.cos(ang) * (R + 0.35), cy = Math.sin(ang) * (R + 0.35);
      for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, c = Math.cos(a) * 0.22, sn = Math.sin(a) * 0.22; _a.copy(F.r).multiplyScalar(cx + c * Math.cos(ang)).addScaledVector(F.u, cy + c * Math.sin(ang)).addScaledVector(F.t, sn); pos.push(F.p.x + _a.x, F.p.y + _a.y, F.p.z + _a.z); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo;
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
    for (const [n, sz, op] of [[2600, 1.6, 0.85], [420, 2.8, 1]]) { const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr(-1, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * q * 3000; pos[i * 3 + 1] = u * 3000; pos[i * 3 + 2] = Math.sin(a) * q * 3000; const t = Math.random(); col[i * 3] = 0.8 + 0.2 * t; col[i * 3 + 1] = 0.85 + 0.1 * t; col[i * 3 + 2] = 1; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ size: sz, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: op, depthWrite: false, fog: false })); p.renderOrder = -10; p.userData.op = op; sky.add(p); (L.stars = L.stars || []).push(p); }
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
    const gy = (() => { try { return U.clamp(g.endlessRun.T.base(0) - O.y, -6, 0) - 0.15; } catch (e) { return -0.8; } })();   // le vrai sol (pas le toit du hangar du menu)
    root.position.y += gy; const P = [], OR = '#d8501c', GR = '#8a929c', DK = '#3a4048', WH = '#eef0f2', CO = '#bdb6aa';
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
    { const sea = new T3.Mesh(new T3.PlaneGeometry(3000, 3000), lam('#2a6aa8')); sea.rotation.x = -Math.PI / 2; sea.position.set(1700, -0.5, 0); root.add(sea); }
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

  // ============================== LA FICHE DU NIVEAU 4 ==============================
  { const Dc = CC.Zones.defs && CC.Zones.defs.campagne; if (Dc) { Dc.scenes.lpad = { len: [800, 800], noDoor: true, noChaos: true, noDress: true, build() {} }; Dc.scenes.lvide = { len: [1000, 1000], noDoor: true, noChaos: true, noDress: true, grass: false, build() {} }; } }
  const CH4 = [['LE PAS DE TIR', 0, 'lpad'], ['LA MONTEE', 160, 'lmontee'], ['LES NUAGES', 330, 'lnuages'], ['L ESPACE', 620, 'lespace'], ['L ORBITE', 1300, 'lorbite'], ['LE TIRE-BOUCHON', 2000, 'lvrille'], ['LA STATION', 2700, 'lstation']];
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 4) || g.evoPreview) return _ld(g);
    EVO.chapters = CH4.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { EVO.SCENE_AUDIO.lpad = 'evoDawn'; EVO.SCENE_AUDIO.lmontee = 'sky'; EVO.SCENE_AUDIO.lnuages = 'sky'; for (const k of ['lespace', 'lorbite', 'lvrille', 'lstation']) EVO.SCENE_AUDIO[k] = 'espace'; }
    return EVO.baseDef({ zone: 'campagne', len: 9000, scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 4404, bossEnt: null });
  };

  // ============================== CONSTRUCTION, PILOTAGE, CAMERA ==============================
  const dispose = (g) => { if (!L) return; if (L.grp) g.scene.remove(L.grp); if (L.sky) g.scene.remove(L.sky); if (L.dust) g.scene.remove(L.dust); if (L.far0) { g.camera.far = L.far0; g.camera.updateProjectionMatrix(); } L = null; EVO.space = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); };
  function build(g) {
    const pad = g.pad, run = g.endlessRun, T = run.T, a = T.at(0, 0, 0), b = T.at(8, 0, 0), F0 = new V(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const O = (pad && pad.origin ? pad.origin.clone() : new V(a[0], a[1] + 2, a[2]));
    L = EVO.space = { tubeMats: [], beacons: [], t: 0, s: 0, x: 0, y: 0, v: 0, started: false, smokeT: 0, cam: null };
    const PA = L.PA = buildPath(O, F0), grp = L.grp = new T3.Group(); g.scene.add(grp);
    const sV = PA.sOf([0, 905, 880]), sC = PA.sOf([-250, 820, 1940]), sE = PA.sOf([-300, 900, 2700]), sJ = PA.sOf([-310, 1130, 3180]);
    L.gap1 = [sV + 140, sV + 420]; L.gap2 = [sE + 60, sE + 330];
    L.tubeSecs = [[140, L.gap1[0]], [L.gap1[1], L.gap2[0]], [L.gap2[1], PA.len - 30]];
    buildTube(PA, grp, L.tubeSecs); beacons(PA, grp, L.gap1[0], L.gap1[1]); beacons(PA, grp, L.gap2[0], L.gap2[1]);
    launchPad(g, PA, grp); cloudDeck(PA, grp); spaceStuff(PA, grp, L.gap1, L.gap2); buildSky(g);
    // poussiere d'espace : des points qui defilent pres de la fusee (on sent la vitesse dans le vide)
    { const n = 360, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#cfe8ff', size: 0.5, transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; g.scene.add(p); L.dust = p; L.dustInit = false; }
    L.far0 = g.camera.far;
  }
  const inTube = (s) => { for (const [a, b] of L.tubeSecs) if (s >= a && s <= b) return true; return false; };
  const altOf = (p) => p.y - L.PA.O.y;

  // --- pilotage le long de la voie (remplace le pas physique de la fusee au niveau 4) ---
  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on4(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA, inp = g.input; this.age += dt; if (!this.ignited && this.age >= this.cfg.ignitionDelay) { this.ignited = true; g.audio.play('ignite', this.pos); }
    if (!L.started) { L.started = true; L.s = 0; L.x = 0; L.y = 0; L.v = Math.max(26, this.vel.length()); L.launchT = 0; const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); L.yaw0 = e.y; L.pit0 = e.x; L.ry = 0; L.rp = 0; }
    // la commande : l'ecart de cap du joystick / des fleches depuis le depart = ou on veut aller dans le tube ; il revient doucement au centre
    { const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); let dy = e.y - L.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); L.ry = U.clamp(dy, -0.62, 0.62) * Math.exp(-dt * 0.9); L.rp = U.clamp(e.x - L.pit0, -0.62, 0.62) * Math.exp(-dt * 0.9); inp.setAim(L.yaw0 + L.ry, L.pit0 + L.rp); }
    const F = PA.fr(L.s), alt = altOf(F.p), up = U.clamp(F.t.y, 0, 1), atmo = 1 - ss(500, 900, alt);
    this.fuel = this.fuelMax;   // PROTOTYPE : carburant illimite
    const vMax = 44 + 10 * ss(500, 1000, alt);   // dans le vide on va un peu plus vite
    L.v += ((this.throttle || this.freeBoost ? vMax : vMax * 0.7) - L.v) * Math.min(1, dt * 0.9) - 6 * up * atmo * dt;   // la pesanteur freine un peu la montee verticale
    L.v = Math.max(24, L.v);
    const vx = -L.v * Math.sin(L.ry) * 0.85, vy = L.v * Math.sin(L.rp) * 0.85; L.x += vx * dt; L.y += vy * dt; L.s += L.v * dt;
    // le tube retient la fusee (on glisse sur la paroi, etincelles) ; a decouvert, une limite douce plus large
    const lim = inTube(L.s) ? R - 2.2 : ROPEN - 2, rr2 = Math.hypot(L.x, L.y);
    if (rr2 > lim) { L.x *= lim / rr2; L.y *= lim / rr2; L.v *= 1 - dt * 0.6; if (inTube(L.s) && Math.random() < dt * 14) { const F2 = PA.fr(L.s); _a.copy(F2.p).addScaledVector(F2.r, L.x * 1.12).addScaledVector(F2.u, L.y * 1.12); g.effects.sparks.emit({ pos: _a.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(10), life: 0.4, s0: 0.3, s1: 0.4, s2: 0.1, cols: g.effects.pal.cyan, drag: 1, grav: 0, a: 1, fout: 0.5 }); if (Math.random() < 0.15) g.audio.play('clank'); } }
    const F2 = PA.fr(L.s); this.pos.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y);
    this.vel.copy(F2.t).multiplyScalar(L.v).addScaledVector(F2.r, vx).addScaledVector(F2.u, vy); this.speed = this.vel.length(); this.fwd.copy(this.vel).normalize(); this.flightDist += L.v * dt;
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, L.s);
    this.thrustK = 1; if (L.s > PA.len - 60 && !g.evoFinish && EVO.finishRun) { if (CC.L1) CC.L1.msg(g, 'FIN DU PROTOTYPE !', 2.4, '#ffe9a0'); EVO.finishRun(g); }
  };

  // --- la camera suit le repere de la voie (on regarde vers l'avant de la voie, le haut = le haut de la voie) ---
  const _rup = CC.CameraRig.prototype.update;
  CC.CameraRig.prototype.update = function (dt) {
    _rup.call(this, dt); const g = this.game, rk = g.rocket;
    if (!L || !L.PA || !on4(g) || !rk.active || g.state !== 'FLIGHT' || !L.started || (g.evoFinish && g.evoFinish.hold)) return;
    const PA = L.PA, cam = this.cam, F = PA.fr(L.s + 6), Fq = frameQ(F, _q2.clone());
    if (!L.camQ) L.camQ = Fq.clone(); L.camQ.slerp(Fq, 1 - Math.exp(-dt * 3.2));
    const cr = _a.set(1, 0, 0).applyQuaternion(L.camQ), cu = _b.set(0, 1, 0).applyQuaternion(L.camQ), cf = _c.set(0, 0, -1).applyQuaternion(L.camQ);
    const F0 = PA.fr(L.s), ctr = _d.copy(F0.p).addScaledVector(F0.r, L.x * 0.8).addScaledVector(F0.u, L.y * 0.8);
    cam.position.copy(ctr).addScaledVector(cf, -11).addScaledVector(cu, 3.4);
    cam.up.copy(cu); cam.lookAt(_a.copy(rk.pos).addScaledVector(cf, 18).addScaledVector(cu, 1.2));
    // au decollage : une grande vue depuis le sol (la tour, la fumee, la fusee qui s'arrache), qui glisse vers la poursuite entre 50 et 220 m
    { const b = ss(50, 220, L.s); if (b < 1) { const qC = _q.copy(cam.quaternion), pC = _c.copy(cam.position), O = PA.O;
      const pL = new V().copy(O).addScaledVector(PA.F0, -62).addScaledVector(PA.R0, -34).add(_b.set(0, 14 + L.s * 0.35, 0));
      cam.position.copy(pL); cam.up.set(0, 1, 0); cam.lookAt(_a.copy(rk.pos).add(_b.set(0, 10 + L.s * 0.15, 0))); const qL = _q2.copy(cam.quaternion);
      cam.position.lerpVectors(pL, pC, b); cam.quaternion.copy(qL).slerp(qC, b); cam.up.set(0, 1, 0).applyQuaternion(cam.quaternion); } }
    if (this.shake > 0) { cam.position.addScaledVector(cr, (U.fx() - 0.5) * this.shake * 0.5).addScaledVector(cu, (U.fx() - 0.5) * this.shake * 0.5); }
    if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    // la fusee : son nez suit sa trajectoire, son « dessus » reste le haut de la voie
    { const fz = _c.copy(rk.fwd), fx = _a.crossVectors(cu, fz).normalize(), fy = _b.crossVectors(fz, fx); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(fx, fy, fz)); if (!(rk.skin && rk.skin.build)) rk.mesh.quaternion.multiply(_q.setFromAxisAngle(new V(0, 0, 1), rk.roll || 0)); rk.mesh.position.copy(rk.pos); }
  };

  // --- au niveau 4 : pas de bande de collines lointaines autour de la camera (vue d'en dessous pendant la montee, elle faisait des murs) ---
  if (CC.Horizon) { const _hu = CC.Horizon.prototype.update; CC.Horizon.prototype.update = function (g) { if (L && on4(g)) { for (const m of [this.ring, this.glow, this.mtn]) if (m) m.visible = false; return; } return _hu.call(this, g); }; }
  // --- l'ambiance selon l'altitude : ciel, brume, sol cache au-dessus des nuages, Terre, etoiles ---
  const SKY = [[0, '#3d6fb8', '#f2b07a', '#e8b896'], [260, '#2c63b8', '#a8ccf0', '#bcd4ee'], [420, '#3a6ac0', '#dfe8f4', '#f2f4f8'], [620, '#14246a', '#4a70c0', '#2a3c80'], [900, '#020308', '#0a1030', '#020308']];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color();
  function skyAt(alt) { let i = 0; while (i < SKY.length - 2 && alt > SKY[i + 1][0]) i++; const A = SKY[i], B = SKY[i + 1], t = U.clamp((alt - A[0]) / (B[0] - A[0]), 0, 1); _c1.set(A[1]).lerp(_c3.set(B[1]), t); _c2.set(A[2]).lerp(_c3.set(B[2]), t); const f = new T3.Color(A[3]).lerp(_c3.set(B[3]), t); return [_c1.clone(), _c2.clone(), f]; }
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on4(g)) return;
    const cam = g.camera, alt = cam.position.y - L.PA.O.y, [top, hor, fog] = skyAt(alt), K = ss(560, 900, alt);
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(top); u.horizon.value.copy(hor); u.bottom.value.copy(fog); u.cloud.value = 1 - K; if (u.sunDir) { u.sunDir.value.copy(L.PA.R0).multiplyScalar(0.75).addScaledVector(L.PA.F0, 0.5); u.sunDir.value.y = 0.28; u.sunDir.value.normalize(); } }   // le soleil du ciel : bas, sur le cote (pas au zenith)
    const inC = alt > 370 && alt < 470 ? Math.sin((alt - 370) / 100 * Math.PI) : 0;
    g.scene.fog.color.copy(fog); g.scene.fog.near = U.lerp(U.lerp(160, 30, inC), 1e5, K); g.scene.fog.far = U.lerp(U.lerp(1500, 240, inC), 2e5, K); if (g.fogBase) { g.fogBase.near = g.scene.fog.near; g.fogBase.far = g.scene.fog.far; g.fogBase.color.copy(fog); }
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
    const PA = L.PA, rk = g.rocket, cam = g.camera, alt = cam.position.y - PA.O.y, K = ss(560, 900, alt), fx = g.effects; L.t += dt;
    for (const M of L.tubeMats) { M.uniforms.uT.value = L.t; M.uniforms.uK.value = 0.55 + 0.45 * K; }
    // bras de service : ils s'ecartent quand la fusee arrive a leur hauteur
    for (const A of L.arms) { const want = L.started && L.s > A.h - 60 ? 1 : 0; A.k += (want - A.k) * Math.min(1, dt * 2.2); A.piv.rotation.y = -A.k * 1.45; }
    if (L.dish) L.dish.rotation.z = Math.sin(L.t * 0.3) * 0.4;
    // decollage : enorme nuage de fumee qui sort des deux cotes de la fosse, la tour tremble
    if (L.started && L.s < 130 && g.state === 'FLIGHT') { L.smokeT -= dt; if (L.smokeT <= 0) { L.smokeT = 0.07; for (const sd of [-1, 1]) { _a.copy(PA.O).addScaledVector(PA.F0, sd * rr(26, 40)).add(_b.set(0, L.padGy + 3, 0)); fx.smokePuff(_a.clone(), new V(PA.F0.x * sd * rr(18, 34) + rr(-5, 5), rr(3, 10), PA.F0.z * sd * rr(18, 34) + rr(-5, 5)), rr(10, 18), rr(2.2, 3.2)); } } if (L.s < 80) g.rig.shake = Math.max(g.rig.shake, 0.6 * (1 - L.s / 80)); }   // les deux panaches sortent de la fosse, au sol (ils ne cachent plus la fusee)
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.audio.play('rumble'); g.flash = 0.35; g.flashColor = '#ffd8a0'; if (CC.L1) CC.L1.msg(g, 'DECOLLAGE !', 1.8, '#ffe9a0'); }
    // le sol, la base et les nuages disparaissent quand on est au-dessus de la couche ; la Terre apparait dessous
    const hideGround = alt > 470; for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = !hideGround; if (L.pad) L.pad.visible = alt < 900; if (L.clouds) L.clouds.visible = alt < 720; if (g.pad && g.pad.hangar && g.state === 'FLIGHT') g.pad.hangar.visible = false;   /* le hangar du menu disparait au decollage */
    if (g.state === 'FLIGHT') for (const o of g.scene.children) if (o.name === 'level') o.visible = false;   /* le decor du mode classique (murs du lancement) n'a rien a faire au niveau 4 */
    if (L.sky) { L.sky.position.copy(cam.position); const E = L.earth, hv = 4 + Math.pow(Math.max(0, alt - 450), 1.5) * 0.02; E.visible = alt > 440; E.position.set(0, -(RS + hv), 0); E.rotation.set(Math.PI / 2 - 0.35, 0, L.t * 0.004); L.cloudSphere.rotation.y = L.t * 0.002;   // le pole est mis sur le cote : sous la fusee on voit l'equateur (oceans, continents), pas la calotte glaciaire
      for (const p of L.stars) p.material.opacity = p.userData.op * ss(500, 850, alt);
      const mf = _a.copy(PA.F0).multiplyScalar(0.8).addScaledVector(PA.R0, -0.25); mf.y = 0.42; mf.normalize(); L.moon.position.copy(mf).multiplyScalar(3200); L.moon.scale.setScalar(1 + 0.25 * ss(0, PA.len, L.s)); L.moon.visible = alt > 250;
      if (L.sun) { _b.copy(PA.R0).multiplyScalar(0.75).addScaledVector(PA.F0, 0.5); _b.y = 0.28; _b.normalize(); L.sun.position.copy(_b).multiplyScalar(2800); L.sun.material.opacity = 0.25 + 0.75 * K; } }   // le soleil est BAS, sur le cote : on ne le regarde jamais en face pendant la montee
    // la poussiere de l'espace (a decouvert surtout)
    if (L.dust && L.started) { const P = L.dust.geometry.attributes.position, F = PA.fr(L.s), n = P.count; L.dust.material.opacity = 0.75 * K;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); if (!L.dustInit || _b.subVectors(_a, rk.pos).dot(F.t) < -10 || _b.length() > 260) { _a.copy(rk.pos).addScaledVector(F.t, L.dustInit ? rr(140, 240) : rr(-10, 240)).addScaledVector(F.r, rr(-70, 70)).addScaledVector(F.u, rr(-70, 70)); P.setXYZ(i, _a.x, _a.y, _a.z); } }
      L.dustInit = true; P.needsUpdate = true; }
  };
})();
