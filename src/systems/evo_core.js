/* v424 : NIVEAU 5 « PLONGEE VERS LE NOYAU » (?lv=5) — meme mecanique de voie 3D que le niveau 4 (s = distance sur la voie, x, y = ecart dans la section).
 * Aucun tube de verre : on est LARGUE d'une station en orbite et on tombe EN CHUTE LIBRE, tete la premiere vers la Terre (des anneaux de lumiere
 * montrent le chemin), on rentre dans l'atmosphere en boule de feu, on perce une mer de NUAGES fins (escadrilles d'helicopteres geants), on rase la
 * CAMPAGNE verte (eoliennes, lignes a haute tension, fermes, une base) et on plonge dans le PUITS DE FORAGE : on traverse les COUCHES de la Terre
 * (terre, argile, sable, nappe d'eau, roche, charbon, basalte), la GEODE de cristaux, le MANTEAU (veines a forer, magma) et le NOYAU, ou nous attend le TUNNELIER.
 * L'arme : l'OGIVE FOREUSE (pointe de forage -> foreuse a vis -> torpille thermique -> foreuse a plasma ; rocket_w.js « drill »).
 * Une idee forte par zone, peu d'elements : le niveau doit se lire en un coup d'oeil. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn || !CC.Rocket) return;
  const on5 = (g) => !!(g && g.evo && !g.evo.preview && EVO.stage && EVO.stage(g) === 5);
  const R = 16, ROPEN = 34, RK = 0.55, rr = (a, b) => a + Math.random() * (b - a);
  const _a = new V(), _b = new V(), _c = new V(), _d = new V(), _q = new T3.Quaternion(), _q2 = new T3.Quaternion(), _m = new T3.Matrix4();
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));

  // ============================== L'OGIVE FOREUSE, le carburant, les pieces ==============================
  const isS5 = EVO.isS5 = () => !!(EVO.stage && CC.game && EVO.stage(CC.game) === 5);
  (EVO.terrain = EVO.terrain || []).push((g, x, z) => { if (!isS5() || !L || !L.started || L.gy === undefined || !(L.s > 1060)) return null; if (L.s >= L.holeS + 12) return L.PA.fr(L.s).p.y - 24; if (L.slit && L.slit.hole(x, z)) return null; return L.gy; });   // sol du niveau 5 pour l'ombre de la fusee (meme ombre que les autres niveaux)
  for (let i = 0; i < 4; i++) CC.Skins.byId['evoD' + i] = { id: 'evoD' + i, name: 'evoD' + i, short: 'evoD' + i, tier: 'base', price: 0, tierLabel: '', c: { body: '#8a9098', nose: '#c8ccd2', tip: '#e8b020', band: '#1c1f24', fin: '#1c1f24', nozzle: '#4a4f58' }, flame: ['#ffd27a', '#ffc23a', '#ff8a3a', '#7af0ff'][i], build: 'drill', stage: i, dims: { r: 0.1, len: 1, noseLen: 0.3, noseR: 0.02, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, parts: [] };
  { const _ob = EVO.ownBody; EVO.ownBody = () => _ob() || isS5(); }
  { const _as = EVO.applySkin; EVO.applySkin = (g) => { if (!isS5()) return _as(g); const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoD' + r.tier)); EVO.attachParts(g); }; }
  { const RK5 = ['POINTE DE FORAGE', 'FOREUSE A VIS', 'TORPILLE THERMIQUE', 'FOREUSE A PLASMA'], _rk = EVO.rocket; EVO.rocket = (n) => { const r = _rk(n); if (isS5()) r.name = RK5[r.tier]; return r; }; }
  // meme courbe que le niveau 4 (v422) : la pointe de depart s'eteint pendant le plongeon, chaque palier donne un gros bond
  EVO.fuel5 = (rk, la) => 32 + 2 * rk + 1.2 * la + [0, 6, 18, 45][Math.min(3, Math.floor(rk / 5))];
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); if (!isS5() || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket, f = EVO.fuel5(S.rk || 0, S.la || 0); rk.fuelMax = f * 1.15; rk.fuel = (g.evoAimLast && g.evoAimLast.zone === 'gold') ? f * 1.15 : f; }; }
  { const _dp = EVO.distPay; EVO.distPay = (g, dist) => (isS5() ? (0.15 / (8450 / 6910)) * (1 + 2 * Math.min(1, dist / 6100)) : _dp ? _dp(g, dist) : 1); }
  let L = null;
  { const _nk = EVO.noKill; EVO.noKill = (g) => on5(g) || (_nk ? _nk(g) : false); }   // v448 : chaine (ne remplace plus les regles des autres niveaux)   // la voie descend a 2 km sous le sol du niveau 1 : pas de « chute » hors du monde

  // ============================== LA VOIE 3D ==============================
  // points de controle dans le repere du depart : [droite, haut, avant] (m). Largage a l'horizontale, chute VERTICALE, on se redresse au ras des champs, on plonge dans le puits.
  const CP = [[0, 0, 0], [0, 0, 110], [0, -15, 200], [0, -80, 262], [0, -190, 292], [5, -360, 302], [10, -560, 305], [0, -760, 300], [-10, -940, 296], [-15, -1070, 318], [-10, -1165, 390], [0, -1222, 500], [0, -1238, 640],
    [10, -1238, 800], [-20, -1238, 1000], [-20, -1238, 1200], [10, -1238, 1380], [20, -1232, 1530], [20, -1222, 1580], [20, -1245, 1610], [20, -1320, 1622], [20, -1440, 1628],
    [20, -1640, 1635], [15, -1850, 1670], [20, -2040, 1674], [30, -2150, 1705], [40, -2215, 1800], [40, -2245, 1940],
    [20, -2265, 2100], [-20, -2290, 2250], [-30, -2325, 2400], [0, -2355, 2550], [20, -2378, 2700], [10, -2400, 2850], [-10, -2420, 3000], [0, -2440, 3140], [0, -2510, 3240], [0, -2590, 3310], [0, -2645, 3410], [0, -2660, 3600], [0, -2660, 3900], [0, -2655, 4200]];
  const GY = -1250;   // le sol de la campagne (repere du depart) ; la voie y passe a 12 m

  function buildPath(O, F0) {
    const Y = new V(0, 1, 0), R0 = new V().crossVectors(F0, Y).normalize(), W = (p) => new V().copy(O).addScaledVector(R0, p[0]).addScaledVector(Y, p[1]).addScaledVector(F0, p[2]);
    const curve = new T3.CatmullRomCurve3(CP.map(W), false, 'centripetal', 0.5), len = curve.getLength(), N = Math.ceil(len / 2), P = curve.getSpacedPoints(N), step = len / N, T = [], UP = [], RT = [];
    for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; T.push(new V().subVectors(b, a).normalize()); }
    // le « haut » de la voie : transporte le long de la courbe (dans le grand plongeon, le haut de l'ecran regarde l'horizon), puis redresse vers le vrai haut des que la voie n'est plus verticale
    let up = new V(0, 1, 0);
    for (let i = 0; i <= N; i++) { up = up.clone().addScaledVector(T[i], -up.dot(T[i])).normalize();
      const des = new V().copy(Y).addScaledVector(T[i], -Y.dot(T[i])), dl = des.length(), w = dl > 0.35 ? ss(0.35, 0.6, dl) : 0;
      if (w > 0) { des.normalize(); const ang = up.angleTo(des); if (ang > 1e-4) up.lerp(des, Math.min(1, 0.012 * w / ang)).normalize(); }
      UP.push(up); RT.push(new V().crossVectors(T[i], up).normalize()); }
    const fr = (s, o) => { const u = U.clamp(s / step, 0, N - 1e-4), i = Math.floor(u), f = u - i; o = o || {}; o.p = (o.p || new V()).lerpVectors(P[i], P[i + 1], f); o.t = (o.t || new V()).lerpVectors(T[i], T[i + 1], f).normalize(); o.u = (o.u || new V()).lerpVectors(UP[i], UP[i + 1], f).normalize(); o.r = (o.r || new V()).crossVectors(o.t, o.u).normalize(); return o; };
    // la ou la voie passe sous une hauteur donnee (le trou dans la banquise)
    const sBelow = (y, s0) => { for (let s = s0; s < len; s += 1) if (fr(s).p.y < y) return s; return len; };
    return { O, F0, R0, len, step, N, P, T, UP, RT, fr, W, sBelow, cl: (s) => s, cut: () => false, cutA: (s) => s, adv: (s, d) => s + d, toNew: (s) => s, toOld: (s) => s };
  }

  // ============================== MATERIAUX DES PAROIS (dessines par le code) ==============================
  // LES COUCHES DE LA TERRE (paroi du puits) : la couleur depend de la PROFONDEUR (y du monde) : terre et racines, argile, sable, la nappe d'eau, roche litee, charbon, basalte
  const strataMat = (gy) => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFar: { value: 400 }, uGY: { value: gy }, uFog: { value: new T3.Color('#000000') } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform float uFar; uniform float uGY; uniform vec3 uFog; varying vec2 vUv; varying vec3 vW;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'void main(){',
      '  if (vW.y > uGY) discard;', '  float a = vUv.y * 6.2832; vec2 p = vec2(vUv.y * 22.0, vW.y * 0.12); float r = n(p) * 0.6 + n(p * 2.7) * 0.3 + n(p * 6.1) * 0.1;',
      '  float d = uGY - vW.y + (n(vec2(vUv.y * 9.0, 3.0)) - 0.5) * 10.0;',
      '  vec3 c;',
      '  if (d < 40.0) { c = mix(vec3(0.36, 0.25, 0.13), vec3(0.50, 0.36, 0.19), r); c = mix(vec3(0.28, 0.44, 0.15), c, smoothstep(0.4, 2.6, uGY - vW.y)); float rt = 1.0 - smoothstep(0.0, 0.035, abs(n(vec2(vUv.y * 40.0, vW.y * 0.25)) - 0.5)); c = mix(c, vec3(0.42, 0.30, 0.16), rt * 0.8); }',
      '  else if (d < 140.0) c = mix(vec3(0.48, 0.24, 0.11), vec3(0.64, 0.33, 0.15), r);',
      '  else if (d < 250.0) c = mix(vec3(0.48, 0.36, 0.20), vec3(0.60, 0.47, 0.28), r);',
      '  else if (d < 290.0) { float w = sin(uT * 2.0 + vUv.y * 50.0 + vW.y * 0.4) * 0.5 + 0.5; c = vec3(0.05, 0.20, 0.38) + vec3(0.25, 0.55, 0.8) * w * 0.3; }',
      '  else if (d < 480.0) c = mix(vec3(0.30, 0.30, 0.33), vec3(0.44, 0.44, 0.47), r) * (0.82 + 0.18 * step(0.5, fract(d / 7.0)));',
      '  else if (d < 640.0) c = mix(vec3(0.05, 0.045, 0.04), vec3(0.12, 0.11, 0.10), r) + vec3(0.9) * step(0.992, h(floor(vec2(vUv.y * 300.0, vW.y * 2.0))));',
      '  else { c = mix(vec3(0.15, 0.08, 0.06), vec3(0.25, 0.12, 0.08), r); float cr = 1.0 - smoothstep(0.0, 0.05, abs(n(p * 0.8 + 7.0) - 0.5)); c += vec3(1.0, 0.35, 0.08) * cr * smoothstep(640.0, 860.0, d); }',
      '  float e = min(min(abs(d - 40.0), abs(d - 140.0)), min(min(abs(d - 250.0), abs(d - 290.0)), min(abs(d - 480.0), abs(d - 640.0)))); c *= 0.55 + 0.45 * smoothstep(0.6, 2.2, e);',
      '  c *= 0.72 + 0.38 * (0.5 + 0.5 * cos(a - 1.2));',
      '  vec3 N = normalize(cross(dFdx(vW), dFdy(vW))); if (dot(N, cameraPosition - vW) < 0.0) N = -N; c *= 0.5 + 0.55 * max(0.0, dot(N, normalize(vec3(0.3, 0.8, 0.35))));',
      '  float dist = length(cameraPosition - vW); c *= 1.0 + 0.18 * (1.0 - smoothstep(0.0, 70.0, dist));',
      '  c = mix(c, uFog, smoothstep(uFar * 0.35, uFar, dist));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'].join('\n'), side: T3.DoubleSide, extensions: { derivatives: true } });
  // LES NUAGES : de grosses bouffees douces toujours tournees vers la camera, FINES (on voit a travers) et qui s'effacent quand on passe dedans
  const cloudMat = (tex) => new T3.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uOp: { value: 0.5 }, uFar: { value: 3600 } },
    vertexShader: 'varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float sc = length(instanceMatrix[0].xyz); c.xy += position.xy * sc; vD = -c.z; gl_Position = projectionMatrix * c; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uOp; uniform float uFar; varying vec2 vUv; varying float vD; void main(){ float a = texture2D(uMap, vUv).a; vec3 c = mix(vec3(0.74, 0.80, 0.90), vec3(1.0), smoothstep(0.15, 0.85, vUv.y)); float k = uOp * smoothstep(20.0, 140.0, vD) * (1.0 - smoothstep(uFar * 0.6, uFar, vD)); if (a * k < 0.01) discard; gl_FragColor = vec4(c, a * k); }',
    transparent: true, depthWrite: false, fog: false });
  // paroi de roche / glace / cristal (uv.x = distance, uv.y = angle) : deux teintes, des fissures lumineuses, la bande du plancher
  const caveMat = (cA, cB, cCr, crK, scl, fl) => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFar: { value: 500 }, uA: { value: new T3.Color(cA) }, uB: { value: new T3.Color(cB) }, uCr: { value: new T3.Color(cCr) }, uK: { value: crK }, uS: { value: scl || 1 }, uFl: { value: fl === undefined ? 1 : fl }, uFog: { value: new T3.Color('#000000') } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform float uFar; uniform vec3 uA; uniform vec3 uB; uniform vec3 uCr; uniform float uK; uniform float uS; uniform float uFl; uniform vec3 uFog; varying vec2 vUv; varying vec3 vW;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'void main(){',
      '  vec2 p = vec2(vUv.x / (5.0 * uS), vUv.y * 18.0); float r = n(p) * 0.6 + n(p * 2.3) * 0.3 + n(p * 5.1) * 0.1;',
      '  vec3 col = mix(uA, uB, r);',
      '  float cr = 1.0 - smoothstep(0.0, 0.05, abs(n(p * 0.9 + 7.0) - 0.5));',
      '  col += uCr * cr * uK * (0.8 + 0.2 * sin(uT * 3.0 + vUv.x * 0.1));',
      '  float ring = smoothstep(0.95, 1.0, fract(vUv.x / 30.0)); col += uCr * ring * 0.35 * uFl;',
      '  float fl = abs(vUv.y - 0.75); col = mix(col, vec3(1.0, 0.78, 0.2), (1.0 - smoothstep(0.006, 0.013, fl)) * 0.85 * uFl);',
      '  col = mix(col, uFog, smoothstep(uFar * 0.35, uFar, length(cameraPosition - vW)));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'].join('\n'), side: T3.DoubleSide });
  // le coeur de la Terre : metal en fusion qui coule (interieur d'une sphere)
  const coreMat = () => new T3.ShaderMaterial({ uniforms: { uT: { value: 0 } }, side: T3.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT; varying vec3 vP; void main(){ float a = sin(vP.x * 7.0 + uT * 0.6) * sin(vP.y * 9.0 - uT * 0.4) * sin(vP.z * 6.0 + uT * 0.3); float b = sin(vP.y * 30.0 + a * 4.0 + uT * 1.5); vec3 c = mix(vec3(0.45, 0.08, 0.02), vec3(1.0, 0.62, 0.18), smoothstep(-0.3, 0.8, a)); c = mix(c, vec3(1.0, 0.95, 0.75), smoothstep(0.85, 1.0, b) * 0.6); gl_FragColor = vec4(c, 1.0); }' });

  // balaye un cercle le long de la voie ; uv = (distance, angle / 2 pi)
  function sweep(PA, s0, s1, radIn, seg, dS, pf) {
    const n = Math.max(2, Math.ceil((s1 - s0) / dS)), pos = [], nor = [], uv = [], idx = [], F = {};
    for (let i = 0; i <= n; i++) { const s = s0 + (s1 - s0) * i / n; PA.fr(s, F); const rd = typeof radIn === 'function' ? radIn(s) : [radIn, radIn];
      for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); _a.copy(F.r).multiplyScalar(c).addScaledVector(F.u, sn);
        if (pf) { pf(s, a, F, _d); pos.push(_d.x, _d.y, _d.z); nor.push(_a.x, _a.y, _a.z); uv.push(s, j / seg); continue; }
        pos.push(F.p.x + F.r.x * c * rd[0] + F.u.x * sn * rd[1], F.p.y + F.r.y * c * rd[0] + F.u.y * sn * rd[1], F.p.z + F.r.z * c * rd[0] + F.u.z * sn * rd[1]); nor.push(_a.x, _a.y, _a.z); uv.push(s, j / seg); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo;
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
  // ombre au sol (disque sombre et flou) : chaque element pose sur la glace a la sienne
  let DOT = null; const dotTex = () => { if (DOT) return DOT; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); DOT = new T3.CanvasTexture(c); return DOT; };   // les poussieres : des points ronds et doux (pas des carres)
  let SHT = null; const shadowTex = () => { if (SHT) return SHT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); SHT = new T3.CanvasTexture(c); return SHT; };
  const blob = (grp, p, rx, rz, rotY) => { const m = new T3.Mesh(new T3.PlaneGeometry(rx * 2, rz * 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#2a3a4a' })); m.rotation.set(-Math.PI / 2, 0, rotY || 0); m.position.copy(p); m.position.y += 0.15; m.renderOrder = 1; grp.add(m); return m; };

  // ============================== LE PROGRAMME : [debut, fin, cle, titre, couleur, genre] ==============================
  // genre : pad / fall (chute libre, a decouvert) / boost (accelerateur) / open / low (on rase un sol) / shaft, rock (puits et tunnels opaques)
  const ZN = [[0, 110, 'cpad', 'LE LARGAGE', '#8fe6ff', 'pad'], [110, 640, 'cchute', 'LA CHUTE LIBRE', '#8fe6ff', 'fall'], [640, 1120, 'crentree', 'LA RENTREE', '#ff9a3a', 'boost'],
    [1120, 1680, 'cciel', 'LES NUAGES', '#cfe8ff', 'open'], [1680, 2657, 'ccampagne', 'LA CAMPAGNE', '#9aff6a', 'low'], [2657, 3587, 'ccouches', 'LES COUCHES DE LA TERRE', '#e8a060', 'shaft'],
    [3587, 4327, 'cgeode', 'LA GEODE', '#c08aff', 'open'], [4327, 5087, 'cmanteau', 'LE MANTEAU', '#ff6a2a', 'rock'], [5087, 5417, 'cdescente', 'LA DESCENTE', '#ffc23a', 'boostrock'], [5417, 1e9, 'cnoyau', 'LE NOYAU', '#ff4a3a', 'open']];
  const zoneAt = (s) => { for (let i = ZN.length - 1; i >= 0; i--) if (s >= ZN[i][0]) return i; return 0; };
  const RSH = 22;   // la largeur utile de la faille (la paroi est a RSH + 8, plus les bosses de roche)
  const faille = (s) => [RSH + 8 + 32 * ss(3400, 3587, s), 170 - 108 * ss(3300, 3587, s)];
  // un bloc de roche irregulier (ellipsoide deforme) : rochers du bord, ponts naturels
  const lumpGeo = (sx, sy, sz, seed, det, amp) => { const g = new T3.IcosahedronGeometry(1, det || 2), P = g.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).normalize(); const w = 1 + amp * (Math.sin(q.x * 3.1 + seed) * Math.cos(q.y * 2.7 + seed * 1.7) + 0.6 * Math.sin(q.z * 5.3 + seed * 2.3) * Math.cos(q.x * 4.1 + seed) + 0.35 * Math.sin((q.x + q.y + q.z) * 9 + seed)); P.setXYZ(i, q.x * w * sx, q.y * w * sy, q.z * w * sz); } g.computeVertexNormals(); return g; };
  const rockM = (c, e) => new T3.MeshLambertMaterial({ color: c, emissive: e || '#140c06', flatShading: true, side: T3.DoubleSide });   // [moitie de largeur, moitie de longueur] : elle s'evase sur la geode
  const WALLS = [[2600, 3587, RSH], [4327, 5417, R]];   // puits et tunnels (paroi proche) : [debut, fin, rayon]
  // l'ambiance le long de la voie : [s, ciel haut, horizon, brume, brume proche, brume loin, lumiere]
  const MOOD = [[0, '#000000', '#04060c', '#020308', 280, 680, 1], [600, '#020308', '#0a1030', '#020308', 280, 680, 1], [700, '#3a1004', '#ff7a2a', '#7a2a0a', 60, 520, 1.1], [900, '#3a1a10', '#d8884a', '#9a6a50', 80, 640, 1.1], [1060, '#5a6a8a', '#c8d0dc', '#b8c0cc', 110, 900, 1.0],
    [1200, '#2a5cb8', '#9cbedc', '#a4c2dc', 260, 2400, 0.85], [2560, '#2e64c0', '#a8c8e2', '#aac6de', 260, 2400, 0.88],
    [2707, '#120a04', '#2a1a0c', '#1a1008', 25, 360, 0.9], [3527, '#120a04', '#2a1a0c', '#1a1008', 25, 360, 0.9], [3647, '#0c0418', '#1e0a34', '#1e0a34', 40, 480, 0.9], [4267, '#0c0418', '#1e0a34', '#1e0a34', 40, 480, 0.9],
    [4387, '#180402', '#3a0c04', '#2a0804', 30, 420, 0.95], [5367, '#180402', '#3a0c04', '#2a0804', 30, 420, 0.95], [5507, '#3a1004', '#ff6a1a', '#5a1806', 60, 700, 1.1], [1e9, '#3a1004', '#ff6a1a', '#5a1806', 60, 700, 1.1]];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color(), _c4 = new T3.Color();
  function moodAt(s) { let i = 0; while (i < MOOD.length - 2 && s > MOOD[i + 1][0]) i++; const A = MOOD[i], B = MOOD[i + 1], t = ss(A[0], B[0], s);
    return { top: _c1.set(A[1]).lerp(_c4.set(B[1]), t).clone(), hor: _c2.set(A[2]).lerp(_c4.set(B[2]), t).clone(), fog: _c3.set(A[3]).lerp(_c4.set(B[3]), t).clone(), near: U.lerp(A[4], B[4], t), far: U.lerp(A[5], B[5], t), li: U.lerp(A[6], B[6], t) }; }

  // ============================== LE CIEL : etoiles, la Terre (qui grossit pendant le plongeon), le soleil ==============================
  const noise2 = (seed) => { const G = 64, v = new Float32Array(G * G); let x = seed; for (let i = 0; i < G * G; i++) { x = (x * 16807) % 2147483647; v[i] = x / 2147483647; }
    const at = (i, j) => v[((j % G + G) % G) * G + ((i % G + G) % G)], sm = (t) => t * t * (3 - 2 * t);
    return (u, w) => { let s = 0, a = 0.5, f = 4; for (let o = 0; o < 5; o++) { const x2 = u * f, y2 = w * f, i = Math.floor(x2), j = Math.floor(y2), fx = sm(x2 - i), fy = sm(y2 - j); s += a * (at(i, j) * (1 - fx) * (1 - fy) + at(i + 1, j) * fx * (1 - fy) + at(i, j + 1) * (1 - fx) * fy + at(i + 1, j + 1) * fx * fy); a *= 0.5; f *= 2; } return s; }; };
  let TEX = null;
  function textures() {
    if (TEX) return TEX; const W = 512, H = 256, mk = (w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; };
    // LA TERRE : de vrais continents (cotes, plaines vertes, deserts, montagnes, banquises), un grand continent juste SOUS la chute (u 0.75, v 0.39)
    const EW = 1536, EH = 768, e = mk(EW, EH), ex = e.getContext('2d'), ei = ex.createImageData(EW, EH), n1 = noise2(12345), n2 = noise2(777), n6 = noise2(901), cl = mk(), cx = cl.getContext('2d'), ci = cx.createImageData(W, H), n3 = noise2(4242);
    const land = (u, w) => { let du = u - 0.75; du -= Math.round(du); const dw = w - 0.39; return n1(u * 3, w * 3) * 0.7 + n6(u * 9, w * 9) * 0.3 + 0.34 * Math.exp(-(du * du * 30 + dw * dw * 48)) + 0.1 * Math.cos(u * 12.57 + 1) - 0.12; };
    for (let j = 0; j < EH; j++) for (let i = 0; i < EW; i++) { const u = i / EW, w = j / EH, lat = Math.abs(w - 0.5) * 2, h = land(u, w), k = (j * EW + i) * 4;
      let r, g, b; const dsr = n2(u * 6, w * 6), dry = U.clamp((0.3 - lat) * 2.5 + (dsr - 0.6) * 2.5, 0, 1);
      if (lat > 0.84 - 0.05 * dsr) { r = 235; g = 240; b = 246; }
      else if (h > 0.5) { const up = U.clamp((h - 0.5) * 5, 0, 1); r = 52 + 120 * dry; g = 104 + 52 * dry - 20 * up; b = 40 + 50 * dry; if (h > 0.68) { const m = U.clamp((h - 0.68) * 8, 0, 1); r = r + (120 - r) * m; g = g + (110 - g) * m; b = b + (100 - b) * m; } if (h > 0.76 && lat > 0.3) { r = g = b = 230; } }
      else { const dp = U.clamp((0.5 - h) * 6, 0, 1); r = 30 * (1 - dp) + 12; g = 120 * (1 - dp) + 48; b = 150 * (1 - dp) + 110; }
      ei.data[k] = r; ei.data[k + 1] = g; ei.data[k + 2] = b; ei.data[k + 3] = 255; }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = i / W, w = j / H, k = (j * W + i) * 4; let du = u - 0.75; du -= Math.round(du);
      const c2 = n3(u * 4 + 0.3 * Math.sin(w * 9), w * 6), hole = 1 - 0.75 * Math.exp(-(du * du * 120 + (w - 0.39) * (w - 0.39) * 160)), al = U.clamp((c2 - 0.56) * 3.2, 0, 1) * hole; ci.data[k] = ci.data[k + 1] = ci.data[k + 2] = 255; ci.data[k + 3] = al * 210; }
    ex.putImageData(ei, 0, 0); cx.putImageData(ci, 0, 0);
    // LA CAMPAGNE vue d'avion : un patchwork de champs (pres, ble, labours en sillons), des haies, des chemins ; un carreau = 400 m
    const FW = 1024, fd = mk(FW, FW), fx = fd.getContext('2d'); let sd = 99; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const PAL = ['#4f7f26', '#5a8a2c', '#466f22', '#6a9632', '#3e6a1e', '#b89a3e', '#7a5a32', '#527e28', '#62902e', '#4a7624'];
    fx.fillStyle = '#5a8a2c'; fx.fillRect(0, 0, FW, FW);
    const field = (x, y, w, h, dep) => { if (dep < 4 && (w > 150 || h > 150) && (dep < 2 || rnd() < 0.8)) { if (w > h) { const c = w * (0.3 + 0.4 * rnd()); field(x, y, c, h, dep + 1); field(x + c, y, w - c, h, dep + 1); } else { const c = h * (0.3 + 0.4 * rnd()); field(x, y, w, c, dep + 1); field(x, y + c, w, h - c, dep + 1); } return; }
      const col = PAL[Math.floor(rnd() * PAL.length)]; fx.save(); fx.beginPath(); fx.rect(x, y, w, h); fx.clip(); fx.fillStyle = col; fx.fillRect(x, y, w, h);
      if (col === '#7a5a32' || col === '#b89a3e' || rnd() < 0.35) { fx.strokeStyle = 'rgba(0,0,0,0.12)'; fx.lineWidth = 2; const vert = rnd() < 0.5; for (let k = 0; k < (vert ? w : h); k += 7) { fx.beginPath(); if (vert) { fx.moveTo(x + k, y); fx.lineTo(x + k, y + h); } else { fx.moveTo(x, y + k); fx.lineTo(x + w, y + k); } fx.stroke(); } }
      fx.restore(); fx.strokeStyle = '#2c4a16'; fx.lineWidth = 5; fx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      if (rnd() < 0.5) { fx.fillStyle = '#2f5a1a'; for (let k = 0; k < 6; k++) { fx.beginPath(); fx.arc(x + rnd() * w, y + (rnd() < 0.5 ? 2 : h - 2), 5 + rnd() * 5, 0, 6.283); fx.fill(); } } };
    field(0, 0, FW, FW, 0);
    fx.strokeStyle = '#c2b28a'; fx.lineWidth = 6; fx.beginPath(); fx.moveTo(0, FW * 0.37); fx.bezierCurveTo(FW * 0.3, FW * 0.3, FW * 0.6, FW * 0.5, FW, FW * 0.42); fx.stroke(); fx.beginPath(); fx.moveTo(FW * 0.62, 0); fx.lineTo(FW * 0.58, FW); fx.stroke();
    { const im = fx.getImageData(0, 0, FW, FW), n5 = noise2(55); for (let j = 0; j < FW; j++) for (let i = 0; i < FW; i++) { const k = (j * FW + i) * 4, w = 0.88 + 0.2 * n5(i / FW * 8, j / FW * 8) + (Math.random() - 0.5) * 0.06; im.data[k] *= w; im.data[k + 1] *= w; im.data[k + 2] *= w; } fx.putImageData(im, 0, 0); }
    // une bouffee de nuage : plusieurs boules douces
    const pf = mk(128, 128), px = pf.getContext('2d'); for (let k = 0; k < 9; k++) { const cx = 64 + (Math.random() - 0.5) * 60, cy = 70 + (Math.random() - 0.5) * 34, r = 22 + Math.random() * 18, gr = px.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); px.fillStyle = gr; px.fillRect(0, 0, 128, 128); }
    const tx = (c, rep) => { const t = new T3.CanvasTexture(c); if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(rep, rep); } return t; };
    return (TEX = { earth: tx(e), clouds: tx(cl), fields: tx(fd, 60), puff: new T3.CanvasTexture(pf) });
  }
  const RS = 2000;
  function buildSky(g) {
    const sky = new T3.Group(), X = textures(); sky.renderOrder = -10; L.stars = [];
    for (const [n, sz, op] of [[3400, 2.2, 0.9], [700, 3.4, 1], [90, 6, 1]]) { const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr(0.0, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * q * 520; pos[i * 3 + 1] = u * 520; pos[i * 3 + 2] = Math.sin(a) * q * 520; const t = Math.random(); col[i * 3] = 0.8 + 0.2 * t; col[i * 3 + 1] = 0.85 + 0.1 * t; col[i * 3 + 2] = 1; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ size: sz, sizeAttenuation: false, vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); p.renderOrder = -10; p.userData.op = op; sky.add(p); L.stars.push(p); }
    const earth = new T3.Group(); sky.add(earth); L.earth = earth;
    const em = new T3.Mesh(new T3.SphereGeometry(RS, 96, 64), new T3.MeshBasicMaterial({ map: X.earth, color: '#ffffff', fog: false, depthWrite: false })); em.renderOrder = -9; earth.add(em);
    const cm = new T3.Mesh(new T3.SphereGeometry(RS * 1.006, 96, 64), new T3.MeshBasicMaterial({ map: X.clouds, transparent: true, opacity: 0.9, fog: false, depthWrite: false })); cm.renderOrder = -8; earth.add(cm); L.cloudSphere = cm;
    const atm = new T3.Mesh(new T3.SphereGeometry(RS * 1.04, 64, 48), new T3.ShaderMaterial({ uniforms: { uC: { value: new T3.Color('#5ab0ff') } }, vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uC; varying vec3 vN; varying vec3 vW; void main(){ vec3 V = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(vN, V)); gl_FragColor = vec4(uC, pow(f, 2.2) * 0.9); }', transparent: true, depthWrite: false, side: T3.BackSide, blending: T3.AdditiveBlending, fog: false })); atm.renderOrder = -8; earth.add(atm);
    if (EVO.boss2Kit) { const sun = EVO.boss2Kit.glow(340, '#ffe8c0'); sun.renderOrder = -9; sky.add(sun); L.sun = sun; }
    { const mn = new T3.Mesh(new T3.SphereGeometry(190, 32, 20), new T3.MeshBasicMaterial({ color: '#b8bcc6', fog: false, transparent: true, depthWrite: false, depthTest: false })); mn.renderOrder = -9; mn.position.set(-1500, 1100, -1600); sky.add(mn); L.moon = mn;
      for (let k = 0; k < 9; k++) { const c = new T3.Mesh(new T3.CircleGeometry(rr(14, 34), 14), new T3.MeshBasicMaterial({ color: '#8a8e98', fog: false, transparent: true, depthWrite: false, depthTest: false })); const a = rr(0, 6.28), e = rr(0.2, 1.2); c.position.set(Math.cos(a) * 160, Math.sin(a) * 160 * 0.9, 0).add(mn.position); c.lookAt(mn.position.x * 2, mn.position.y * 2, mn.position.z * 2); c.position.sub(mn.position).setLength(188).add(mn.position); c.lookAt(0, 0, 0); c.renderOrder = -9; sky.add(c); } }
    g.scene.add(sky); L.sky = sky;
  }

  // ============================== 1. L'ARRIMAGE : une station en orbite, la fusee couchee sur sa catapulte ==============================
  function satellite(scale) {
    const g = new T3.Group(), body = bakeBox([{ s: [4, 4, 5], c: '#e8b43a', p: [0, 0, 0] }, { s: [4.2, 0.4, 5.2], c: '#9a7a2a', p: [0, 2.1, 0] }, { cyl: [1.6, 0.2, 1, 12], c: '#f0f0f0', p: [0, 3, 1], r: [0.5, 0, 0] }]);
    g.add(body); const pm = lam('#1e3a8a', { emissive: '#0a1a50' });
    for (const sd of [-1, 1]) { const p = new T3.Mesh(new T3.BoxGeometry(18, 0.25, 5), pm); p.position.x = sd * 12; g.add(p); }
    g.scale.setScalar(scale || 1); return g;
  }
  function dock(g, PA, grp) {
    const root = new T3.Group(); root.position.copy(PA.O); root.quaternion.setFromRotationMatrix(_m.makeBasis(PA.R0, new V(0, 1, 0), _d.copy(PA.F0).negate())); grp.add(root);   // x droite, y haut, -z avant
    const yb = -(L.rkL * 0.5 + 0.5), P = [], WH = '#e8ecf0', GR = '#8a929c', DK = '#2a2e36', OR = '#e8622a';
    // le PYLONE D'ARRIMAGE : la fusee est tenue au-dessus de la station par deux pinces (elles s'ouvrent au largage) ; pas de rail, pas de piste
    P.push({ s: [1.6, -5 - yb + 0.2, 1.6], c: GR, p: [0, (yb - 5) / 2, 0] }, { s: [3.2, 0.5, 3.2], c: DK, p: [0, -5.1, 0] }, { s: [0.5, 0.25, L.rkL * 0.7], c: DK, p: [0, yb + 0.1, 0] });
    // la station : un long module en travers, des modules habites, un bras robot replie, deux grandes ailes solaires
    P.push({ cyl: [4, 4, 70, 18], c: WH, p: [0, -9, 30], r: [0, 0, Math.PI / 2] }, { cyl: [5, 5, 16, 18], c: '#dfe3e8', p: [-26, -9, 30], r: [Math.PI / 2, 0, 0] }, { cyl: [5, 5, 16, 18], c: '#dfe3e8', p: [26, -9, 30], r: [Math.PI / 2, 0, 0] });
    P.push({ cyl: [3, 3, 30, 14], c: '#dfe3e8', p: [0, -9, 46], r: [Math.PI / 2, 0, 0] }, { s: [1.2, 1.2, 20], c: GR, p: [12, 2, 18], r: [0.6, 0, 0] }, { s: [1, 1, 14], c: GR, p: [12, 9, 6], r: [-0.4, 0, 0] });
    for (const x of [-46, 46]) { P.push({ s: [2, 2, 8], c: GR, p: [x * 0.83, -9, 30] }); }
    root.add(bakeBox(P));
    const pm = lam('#1e3a8a', { emissive: '#0a1a50' }), frm = lam('#cfd4da');
    for (const x of [-60, 60]) { const w = new T3.Group(); w.position.set(x, -9, 30); root.add(w); for (const z of [-9, 9]) { const p = new T3.Mesh(new T3.BoxGeometry(34, 0.3, 14), pm); p.position.z = z; w.add(p); for (let k = 0; k < 5; k++) { const l = new T3.Mesh(new T3.BoxGeometry(0.2, 0.4, 14.2), frm); l.position.set(-14 + k * 7, 0, z); w.add(l); } } (L.wings = L.wings || []).push(w); }
    // les deux pinces autour de la fusee (elles s'ecartent au largage)
    L.runway = []; L.clamps = []; { const cr = L.rkL * 0.12 + 0.08, cm = lam('#d8dce2', { emissive: '#22252a' }); for (const z of [-L.rkL * 0.28, L.rkL * 0.28]) { const c = new T3.Group(); c.position.set(0, 0, z); root.add(c); const ring = new T3.Mesh(new T3.TorusGeometry(cr, 0.05, 8, 24, Math.PI * 1.5), cm); ring.rotation.z = -Math.PI * 1.25; c.add(ring); const arm = new T3.Mesh(new T3.BoxGeometry(0.1, -yb - cr, 0.1), cm); arm.position.y = (yb - cr) / 2; c.add(arm); const l = new T3.Mesh(new T3.SphereGeometry(0.1, 8, 6), bas('#ff3a2a', { fog: false })); l.position.set(0, cr + 0.05, 0); c.add(l); L.clamps.push(c); } }
    // quelques satellites autour, loin
    for (let k = 0; k < 14; k++) { const s = satellite(rr(1, 2.4)), a = rr(0, 6.28); s.position.set(Math.cos(a) * rr(120, 260), rr(-60, 80), -rr(0, 700)); s.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6)); root.add(s); const w = rr(0.05, 0.2); EVO.addDyn(s, (t, dt) => s.rotateY(w * dt), [], { near: 1e5 }); }
    L.dock = root;
  }

  // ============================== LE CIEL DE LA TERRE : une mer de nuages FINS (on voit a travers) ==============================
  function clouds(PA, grp) {
    const X = textures(), M = cloudMat(X.puff), C = PA.fr(1500).p, gy = PA.O.y + GY, P = [];
    // trois couches clairsemees (des trous partout : on voit le sol et les helicopteres), quelques tours de cumulus sur les cotes
    for (const [n, hy, dh, s0, s1] of [[150, 330, 30, 90, 210], [110, 170, 20, 70, 170], [40, 560, 40, 120, 260]]) for (let i = 0; i < n; i++) { const a = rr(0, 6.28), d = 1900 * Math.sqrt(Math.random()); P.push([C.x + Math.cos(a) * d, gy + hy + rr(-dh, dh), C.z + Math.sin(a) * d, rr(s0, s1)]); }
    for (let k = 0; k < 14; k++) { const s = rr(1150, 2550), F = PA.fr(Math.min(s, 2500)), sd = Math.random() < 0.5 ? -1 : 1, d = rr(320, 1100), bx = F.p.x + F.r.x * sd * d, bz = F.p.z + F.r.z * sd * d; for (let j = 0; j < 7; j++) P.push([bx + rr(-40, 40), gy + 120 + j * rr(38, 55), bz + rr(-40, 40), rr(110, 170) * (1 - j * 0.07)]); }
    for (let k = 0; k < 240; k++) { const F = PA.fr(rr(560, 1160)), a = rr(0, 6.283), d = rr(60, 430); P.push([F.p.x + (F.r.x * Math.cos(a) + F.u.x * Math.sin(a)) * d, F.p.y + (F.r.y * Math.cos(a) + F.u.y * Math.sin(a)) * d, F.p.z + (F.r.z * Math.cos(a) + F.u.z * Math.sin(a)) * d, rr(110, 230)]); }   // la rentree traverse deja les nuages : on les voit tout autour
    const im = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), M, P.length), o = new T3.Object3D();
    P.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.scale.setScalar(q[3]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.frustumCulled = false; im.renderOrder = 4; grp.add(im); L.cloudM = M; L.cloudIM = im;
  }

  // LA COUPE DU SOL : on coupe le maillage de la paroi par le plan du sol (y = gy), on garde les segments, et une grille (1,5 m) dit pour chaque case si elle est DANS la bouche (regle pair/impair)
  function riftGrid(geo, gy) {
    const P = geo.attributes.position, I = geo.index.array, seg = []; let X0 = 1e9, X1 = -1e9, Z0 = 1e9, Z1 = -1e9;
    const cr = (a, b) => { const ya = P.getY(a) - gy, yb = P.getY(b) - gy, t = ya / (ya - yb); return [P.getX(a) + (P.getX(b) - P.getX(a)) * t, P.getZ(a) + (P.getZ(b) - P.getZ(a)) * t]; };
    for (let i = 0; i < I.length; i += 3) { const a = I[i], b = I[i + 1], c = I[i + 2], A = P.getY(a) > gy, B = P.getY(b) > gy, C = P.getY(c) > gy; if (A === B && B === C) continue; const k = []; if (A !== B) k.push(cr(a, b)); if (B !== C) k.push(cr(b, c)); if (C !== A) k.push(cr(c, a)); if (k.length !== 2) continue; seg.push([k[0][0], k[0][1], k[1][0], k[1][1]]); for (const q of k) { X0 = Math.min(X0, q[0]); X1 = Math.max(X1, q[0]); Z0 = Math.min(Z0, q[1]); Z1 = Math.max(Z1, q[1]); } }
    const cs = 1.5, M = 60; if (!seg.length) { X0 = Z0 = -30; X1 = Z1 = 30; }
    const x0 = X0 - M, z0 = Z0 - M, nx = Math.ceil((X1 + M - x0) / cs), nz = Math.ceil((Z1 + M - z0) / cs), mask = new Uint8Array(nx * nz), rows = []; for (let j = 0; j < nz; j++) rows.push([]);
    for (const q of seg) { const za = q[1], zb = q[3]; if (za === zb) continue; const lo = Math.min(za, zb), hi = Math.max(za, zb); for (let j = Math.max(0, Math.ceil((lo - z0) / cs - 0.5)); j < nz; j++) { const zc = z0 + (j + 0.5) * cs; if (zc > hi) break; if (zc <= lo) continue; rows[j].push(q[0] + (zc - za) * (q[2] - q[0]) / (zb - za)); } }
    for (let j = 0; j < nz; j++) { const r = rows[j].sort((a, b) => a - b); for (let k = 0; k + 1 < r.length; k += 2) for (let i = Math.max(0, Math.ceil((r[k] - x0) / cs - 0.5)); i <= Math.min(nx - 1, Math.floor((r[k + 1] - x0) / cs - 0.5)); i++) mask[j * nx + i] = 1; }
    // distance (m) au trou le plus proche : deux passes
    const D = new Float32Array(nx * nz); for (let i = 0; i < D.length; i++) D[i] = mask[i] ? 0 : 1e4;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let d = D[j * nx + i]; if (i) d = Math.min(d, D[j * nx + i - 1] + 1); if (j) { d = Math.min(d, D[(j - 1) * nx + i] + 1); if (i) d = Math.min(d, D[(j - 1) * nx + i - 1] + 1.414); if (i < nx - 1) d = Math.min(d, D[(j - 1) * nx + i + 1] + 1.414); } D[j * nx + i] = d; }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { let d = D[j * nx + i]; if (i < nx - 1) d = Math.min(d, D[j * nx + i + 1] + 1); if (j < nz - 1) { d = Math.min(d, D[(j + 1) * nx + i] + 1); if (i < nx - 1) d = Math.min(d, D[(j + 1) * nx + i + 1] + 1.414); if (i) d = Math.min(d, D[(j + 1) * nx + i - 1] + 1.414); } D[j * nx + i] = d; }
    const at = (x, z) => { const i = Math.floor((x - x0) / cs), j = Math.floor((z - z0) / cs); return i >= 0 && j >= 0 && i < nx && j < nz ? j * nx + i : -1; };
    return { x0, z0, cs, nx, nz, mask, D, X1, Z1, nSeg: seg.length, hole: (x, z) => { const k = at(x, z); return k >= 0 && mask[k] === 1; }, dist: (x, z) => { const k = at(x, z); return k < 0 ? 1e4 : D[k] * cs; } };
  }
  // les cases d'une grille regroupees en bandes (une bande = une suite de cases d'une meme ligne) : sert au sol et a la couronne de terre
  function gridMesh(G, y, test, uvOf) { const pos = [], uv = [], idx = []; let v = 0;
    for (let j = 0; j < G.nz; j++) { let i = 0; while (i < G.nx) { if (!test(i, j)) { i++; continue; } let e = i; while (e + 1 < G.nx && test(e + 1, j)) e++; const xa = G.x0 + i * G.cs, xb = G.x0 + (e + 1) * G.cs, za = G.z0 + j * G.cs, zb = za + G.cs;
        pos.push(xa, y, za, xa, y, zb, xb, y, za, xb, y, zb); for (const q of [[xa, za], [xa, zb], [xb, za], [xb, zb]]) uv.push(...uvOf(q[0], q[1])); idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); v += 4; i = e + 1; } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); const nor = []; for (let i = 0; i < v; i++) nor.push(0, 1, 0); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; }

  // ============================== LA CAMPAGNE : des champs a perte de vue, des bosquets, des fermes, une base, le derrick du puits ==============================
  function countryside(g, PA, grp) { { const lg = new T3.Group(); grp.add(lg); L.landG = lg; grp = lg; }   // tout ce qui est au sol : cache tant qu'on est dans l'espace
    const X = textures(), gy = L.gy = PA.O.y + GY, sH = PA.sBelow(gy, 2400), FH = PA.fr(sH), H = FH.p.clone(); L.holeS = sH;
    // la FENTE : le trou du sol est la COUPE EXACTE de la paroi par le plan du sol (grille de cases : aucun vide, rien en l'air)
    const rX = new V(FH.r.x, 0, FH.r.z).normalize(), Dn = new V(-rX.z, 0, rX.x), G = riftGrid(L.riftGeo, gy);
    L.slit = { H, rX, Dn, G, hole: G.hole, dist: G.dist };
    // LE SOL : un maillage FIN. Le jeu courbe le monde sommet par sommet (curve.js : un sommet a d m de la camera est abaisse de 0,00026 x (d-25)^2, jusqu'a 64 m) :
    // un sol fait de quelques immenses triangles etait donc abaisse de dizaines de metres au milieu pendant que les arbres, fermes et eoliennes (petits maillages) restaient en place -> ils flottaient.
    // Avec des cases de 20 m pres de la voie le sol subit la meme courbure que les objets qui s'y posent.
    const gmat = new T3.MeshLambertMaterial({ map: X.fields, color: '#8a9682' });
    { let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (let ss0 = 900; ss0 <= sH + 200; ss0 += 20) { const p = PA.fr(Math.min(ss0, PA.len - 1)).p; bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); bz0 = Math.min(bz0, p.z); bz1 = Math.max(bz1, p.z); }
      const axis = (c0, c1, g0, g1) => { const a0 = c0 - 1100, a1 = c1 + 1100, v = [g0, g1]; for (let x = a0; x <= a1; x += 20) v.push(x); let st = 20, x = a1; while (x < 9000) { st *= 1.3; x += st; v.push(x); } st = 20; x = a0; while (x > -9000) { st *= 1.3; x -= st; v.push(x); } v.sort((p, q) => p - q); const o = [v[0]]; for (const q of v) if (q - o[o.length - 1] > 1.2) o.push(q); return o; };
      const gx = axis(bx0, bx1, G.x0, G.x0 + G.nx * G.cs), gz = axis(bz0, bz1, G.z0, G.z0 + G.nz * G.cs), nx = gx.length, pos = new Float32Array(nx * gz.length * 3), uv = new Float32Array(nx * gz.length * 2), idx = [];
      for (let j = 0; j < gz.length; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; pos[k * 3] = gx[i]; pos[k * 3 + 1] = gy; pos[k * 3 + 2] = gz[j]; uv[k * 2] = (gx[i] - H.x) / 12000 + 0.5; uv[k * 2 + 1] = -(gz[j] - H.z) / 12000 + 0.5; }
      const gxa = G.x0, gxb = G.x0 + G.nx * G.cs, gza = G.z0, gzb = G.z0 + G.nz * G.cs;
      for (let j = 0; j + 1 < gz.length; j++) for (let i = 0; i + 1 < nx; i++) { const cx2 = (gx[i] + gx[i + 1]) / 2, cz2 = (gz[j] + gz[j + 1]) / 2; if (cx2 > gxa && cx2 < gxb && cz2 > gza && cz2 < gzb) continue; const a0 = j * nx + i, a1 = a0 + 1, a2 = a0 + nx, a3 = a2 + 1; idx.push(a0, a2, a1, a1, a2, a3); }
      const gg = new T3.BufferGeometry(); gg.setAttribute('position', new T3.BufferAttribute(pos, 3)); gg.setAttribute('uv', new T3.BufferAttribute(uv, 2)); const nor = new Float32Array(pos.length); for (let i = 1; i < nor.length; i += 3) nor[i] = 1; gg.setAttribute('normal', new T3.BufferAttribute(nor, 3)); gg.setIndex(idx);
      var gnd = new T3.Mesh(gg, gmat); gnd.frustumCulled = false; }
    { const inner = new T3.Mesh(gridMesh(G, gy, (i, j) => !G.mask[j * G.nx + i], (x, z) => [(x - H.x) / 12000 + 0.5, -(z - H.z) / 12000 + 0.5]), gmat); inner.frustumCulled = false; grp.add(inner); }
    grp.add(gnd); L.gnd = gnd;
    { const sh = new T3.Mesh(new T3.PlaneGeometry(2, 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#06100a' })); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 2; sh.visible = false; grp.add(sh); L.rkSh = sh; }   // l'ombre de la fusee : suit la fusee sur le sol
    // le bord de la faille : de la terre arrachee tout autour, des feux d'alerte qui clignotent, le chantier de secours (derrick) un peu plus loin
    { const wd = (x, z) => 6 + 9 * (0.5 + 0.5 * Math.sin(x * 0.07 + 1) * Math.cos(z * 0.05)) + 5 * (0.5 + 0.5 * Math.sin(x * 0.19 + z * 0.13 + 2));
      const ringT = (i, j) => { const k = j * G.nx + i; return !G.mask[k] && G.D[k] * G.cs < wd(G.x0 + (i + 0.5) * G.cs, G.z0 + (j + 0.5) * G.cs); };
      const ringT2 = (i, j) => { const k = j * G.nx + i; return !G.mask[k] && G.D[k] * G.cs < wd(G.x0 + (i + 0.5) * G.cs, G.z0 + (j + 0.5) * G.cs) + 9; };
      { const d2 = new T3.Mesh(gridMesh(G, gy + 0.05, ringT2, () => [0, 0]), new T3.MeshLambertMaterial({ color: '#62702f' })); d2.frustumCulled = false; grp.add(d2); }   // transition herbe seche -> terre
      { const dm = new T3.Mesh(gridMesh(G, gy + 0.1, ringT, () => [0, 0]), new T3.MeshLambertMaterial({ color: '#7e6238' })); dm.frustumCulled = false; grp.add(dm); }
      const ringCells = []; for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) if (ringT(i, j) && G.D[j * G.nx + i] * G.cs > 1) ringCells.push([G.x0 + (i + 0.5) * G.cs, G.z0 + (j + 0.5) * G.cs]);
      { const gs = [0, 1, 2, 3].map((i) => lumpGeo(1, 0.62, 1, i * 1.9 + 1, 1, 0.3)), cs = ['#7a6a52', '#6a5a46', '#8a7a62', '#5e5040'];
        for (let k = 0; k < 54 && ringCells.length; k++) { const c = ringCells[Math.floor(Math.random() * ringCells.length)], sz = rr(1.6, 5.2), m = new T3.Mesh(gs[k % 4], rockM(cs[(k >> 2) % 4])); m.scale.setScalar(sz); m.position.set(c[0], gy + sz * 0.15, c[1]); m.rotation.y = rr(0, 6); grp.add(m); blob(grp, new V(c[0] + sz * 0.3, gy, c[1] + sz * 0.3), sz * 1.5, sz * 1.5); } }
      { const edge = ringCells.filter((c) => G.dist(c[0], c[1]) < 3), put2 = []; for (let t = 0; t < edge.length * 3 && put2.length < 22; t++) { const c = edge[Math.floor(Math.random() * edge.length)]; if (put2.some((q) => (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 < 16 * 16)) continue; put2.push(c); }
        put2.forEach((c, k) => { const l = new T3.Mesh(new T3.SphereGeometry(0.9, 8, 6), bas(k % 2 ? '#ffb84a' : '#ff3a2a', { fog: false })); l.position.set(c[0], gy + 2.4, c[1]); grp.add(l); (L.blinks = L.blinks || []).push(l); }); }
      const DO = new V().copy(H).addScaledVector(rX, -130).setY(gy); L.derrickAt = DO;
      const DP = [], hgt = 90, w = 44; for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { DP.push({ s: [1.8, hgt, 1.8], c: '#c8352a', p: [cx * w, hgt / 2, cz * w], r: [cz * 0.13, 0, -cx * 0.13] }); blob(grp, new V(DO.x + cx * w, gy, DO.z + cz * w), 5, 5); }
      for (let y = 28; y < hgt; y += 13) { const k = 1 - y / hgt * 0.26; DP.push({ s: [2 * w * k, 0.8, 0.8], c: '#e8ecf0', p: [0, y, -w * k] }, { s: [2 * w * k, 0.8, 0.8], c: '#e8ecf0', p: [0, y, w * k] }, { s: [0.8, 0.8, 2 * w * k], c: '#e8ecf0', p: [-w * k, y, 0] }, { s: [0.8, 0.8, 2 * w * k], c: '#e8ecf0', p: [w * k, y, 0] }); }
      DP.push({ s: [18, 5, 18], c: '#3a3e46', p: [0, hgt + 2, 0] }, { s: [3, 14, 3], c: '#c8352a', p: [0, hgt + 10, 0] });
      const der = bakeBox(DP); der.position.copy(DO); grp.add(der); }
        const onG = (s, side, d) => { const F = PA.fr(Math.min(s, sH - 60)); return new V().copy(F.p).addScaledVector(F.r, side * d).setY(gy); }, yawAt = (s) => { const F = PA.fr(Math.min(s, sH - 60)); return Math.atan2(F.t.x, F.t.z); };
    const keep = [];   // les endroits deja pris (pas d'arbre dessus)
    const put = (o, p, rot, sx, sz) => { o.position.copy(p); o.rotation.y = rot || 0; grp.add(o); blob(grp, p, sx, sz, -(rot || 0)); keep.push([p.x, p.z, Math.max(sx, sz) + 6]); return o; };
    // la BASE au bord du puits : hangars, radome, citernes, une tour de controle
    for (const [s, sd, d] of [[2440, -1, 120], [2540, -1, 100], [2380, 1, 140]]) put(bakeBox([{ s: [46, 16, 28], c: '#8a948a', p: [0, 8, 0] }, { cyl: [14.5, 14.5, 46, 16], c: '#7a847a', p: [0, 16, 0], r: [0, 0, Math.PI / 2] }, { s: [22, 13, 0.4], c: '#3a3e46', p: [0, 6.5, 14.1] }]), onG(s, sd, d), yawAt(s), 30, 22);
    { const p = onG(2500, 1, 80), o = new T3.Group(); o.add(bakeBox([{ cyl: [8, 9, 9, 16], c: '#c8ccd2', p: [0, 4.5, 0] }])); const dm = new T3.Mesh(new T3.SphereGeometry(11, 24, 16), lam('#f4f6f8', { emissive: '#30343a' })); dm.position.y = 14; o.add(dm); put(o, p, 0, 15, 15); }
    for (const [s, d] of [[2460, 48], [2475, 62], [2490, 48]]) put(bakeBox([{ cyl: [5, 5, 12, 16], c: '#e8e0c8', p: [0, 6, 0] }, { cyl: [5.1, 5.1, 0.8, 16], c: '#c8352a', p: [0, 9, 0] }]), onG(s, 1, d), 0, 8, 8);
    put(bakeBox([{ s: [5, 26, 5], c: '#c8ccd2', p: [0, 13, 0] }, { s: [10, 5, 10], c: '#3a4a5a', p: [0, 28, 0] }, { s: [11, 0.8, 11], c: '#c8352a', p: [0, 31, 0] }]), onG(2580, -1, 70), yawAt(2580), 9, 9);
    // des FERMES : une grange rouge, un silo, un hangar a foin
    for (const [s, sd, d] of [[1830, -1, 95], [2230, 1, 120], [2050, -1, 260], [1700, 1, 200]]) { const o = new T3.Group(); o.add(bakeBox([{ s: [18, 10, 26], c: '#a8322a', p: [0, 5, 0] }, { cyl: [10.4, 10.4, 26.4, 3], c: '#5a2a22', p: [0, 15.2, 0], r: [-Math.PI / 2, 0, 0] }, { s: [6, 7, 0.4], c: '#f0e8d8', p: [0, 3.5, 13.1] }, { cyl: [3.5, 3.5, 20, 14], c: '#d8dcd8', p: [14, 10, -6] }, { s: [12, 6, 10], c: '#c8a04a', p: [-16, 3, 4] }]));
      const dm = new T3.Mesh(new T3.SphereGeometry(3.5, 14, 8, 0, 6.283, 0, Math.PI / 2), lam('#8a949e')); dm.position.set(14, 20, -6); o.add(dm); put(o, onG(s, sd, d), yawAt(s) + rr(-0.3, 0.3), 22, 20); }
    // des EOLIENNES au loin (elles tournent lentement)
    L.windR = [];
    for (let k = 0; k < 11; k++) { const s = 1650 + k * 85 + rr(-20, 20), sd = k % 2 ? 1 : -1, p = onG(s, sd, rr(180, 520)), o = new T3.Group(), Hh = 70;
      o.add(bakeBox([{ cyl: [1.1, 2, Hh, 10], c: '#eef0f2', p: [0, Hh / 2, 0] }, { s: [3, 3, 8], c: '#e4e6e8', p: [0, Hh, 1.5] }]));
      const rot = new T3.Group(); rot.position.set(0, Hh, -2.8); o.add(rot); rot.add(new T3.Mesh(new T3.SphereGeometry(1.6, 10, 8), lam('#eef0f2')));
      for (let b = 0; b < 3; b++) { const arm = new T3.Group(); arm.rotation.z = b * 2.094; rot.add(arm); const bl = new T3.Mesh(new T3.BoxGeometry(30, 1.8, 0.4), lam('#f4f6f8')); bl.position.x = 16; arm.add(bl); const tip = new T3.Mesh(new T3.BoxGeometry(3, 1.8, 0.45), lam('#e8322a')); tip.position.x = 30; arm.add(tip); }
      put(o, p, yawAt(s) + Math.PI, 8, 8); L.windR.push({ r: rot, w: rr(0.6, 0.9) * (k % 3 ? 1 : -1) }); }
    // les BOSQUETS : des groupes d'arbres (jamais sur la voie ni sur un batiment), chacun avec son ombre
    { const low = []; for (let s = 1560; s < sH; s += 20) { const p = PA.fr(s).p; low.push([p.x, p.z]); }
      const free = (x, z) => { for (const q of low) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < 38 * 38) return false; if (G.dist(x, z) < 30) return false; if ((L.derrickAt.x - x) ** 2 + (L.derrickAt.z - z) ** 2 < 75 * 75) return false; for (const q of keep) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < q[2] * q[2]) return false; return true; };
      const T = []; const C0 = PA.fr(2150).p;
      for (let c = 0; c < 190; c++) { let cx, cz; if (c < 110) { const s = rr(1560, sH), F = PA.fr(Math.min(s, sH - 60)), sd = Math.random() < 0.5 ? -1 : 1, d = rr(42, 380); cx = F.p.x + F.r.x * sd * d; cz = F.p.z + F.r.z * sd * d; } else { const a = rr(0, 6.28), d = rr(200, 2200); cx = C0.x + Math.cos(a) * d; cz = C0.z + Math.sin(a) * d; }
        const n = 4 + Math.floor(Math.random() * 7); for (let k = 0; k < n; k++) { const x = cx + rr(-22, 22), z = cz + rr(-22, 22); if (free(x, z)) T.push([x, z, rr(0.8, 1.35)]); } }
      const n = T.length, trunk = new T3.InstancedMesh(new T3.CylinderGeometry(0.35, 0.55, 1, 6).translate(0, 0.5, 0), lam('#5a3a22'), n), crown = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 0), new T3.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), n),
        shd = new T3.InstancedMesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#1a2a10' }), n), o = new T3.Object3D(), col = new T3.Color(), GC = ['#3e6e22', '#4a7a2a', '#36621e', '#56882e', '#2e5a1c'];
      T.forEach(([x, z, k], i) => { const th = 3.4 * k, cr = 3.6 * k; o.rotation.set(0, rr(0, 6), 0); o.position.set(x, gy, z); o.scale.set(k, th, k); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
        o.position.set(x, gy + th + cr * 0.55, z); o.scale.set(cr, cr * 1.15, cr); o.updateMatrix(); crown.setMatrixAt(i, o.matrix); crown.setColorAt(i, col.set(GC[i % GC.length]));
        o.position.set(x + 1.2 * k, gy + 0.13, z + 0.8 * k); o.scale.set(cr * 1.35, 1, cr * 1.35); o.updateMatrix(); shd.setMatrixAt(i, o.matrix); });
      for (const m of [trunk, crown, shd]) { m.frustumCulled = false; grp.add(m); } shd.renderOrder = 1; }
  }

  // les profondeurs : le PUITS (les couches), la GEODE, le MANTEAU, la DESCENTE
  function caverns(PA, grp) {
    L.cMats = [];
    const add = (s0, s1, rad, M) => { const m = new T3.Mesh(sweep(PA, s0, s1, rad, 48, 4), M); m.frustumCulled = false; grp.add(m); L.cMats.push(M); return m; };
    // LA FAILLE : une vraie fissure rocheuse, parois bosselees (grosses bosses, terrasses de strates, aretes), facettes eclairees ; relief nul au bord du sol et a la geode
    const gyW = PA.O.y + GY, nzR = noise2(31337), nzf = (s, a, sc) => nzR(Math.cos(a) * 1.3 * sc + s * 0.011 * sc + 20, Math.sin(a) * 1.3 * sc + s * 0.007 * sc + 33);
    const riftK = (s, a, y) => { const dep = gyW - y, fade = ss(0, 40, dep) * (1 - ss(3420, 3560, s)); if (fade <= 0) return 0; const big = nzf(s, a, 0.5), mid = nzf(s, a, 1.6), sm = nzf(s, a, 5), tr = (((dep / 46 + 1.4 * big) % 1) + 1) % 1;
      return fade * (Math.max(0, 1.2 * (big - 0.32)) + 0.2 * Math.max(0, mid - 0.3) + 0.09 * tr * tr + 0.05 * sm); };
    const ptf = L.riftPt = (s, a, F, out) => { const sc = ss(L.holeS - 260, L.holeS - 90, s), r0 = faille(s), rd = [r0[0] * sc, r0[1] * sc], c = Math.cos(a), sn = Math.sin(a); out.set(F.r.x * c * rd[0] + F.u.x * sn * rd[1], F.r.y * c * rd[0] + F.u.y * sn * rd[1], F.r.z * c * rd[0] + F.u.z * sn * rd[1]); out.multiplyScalar(1 + riftK(s, a, F.p.y + out.y)).add(F.p); };
    { const M = strataMat(gyW), rg = L.riftGeo = sweep(PA, L.holeS - 260, 3587, faille, 72, 3, ptf), m = new T3.Mesh(rg, M); m.frustumCulled = false; grp.add(m); L.cMats.push(M); }
    // des pointes et des eclats de roche plantes dans les parois (decor, jamais dans la zone de vol)
    { const N = 320, im = new T3.InstancedMesh(new T3.ConeGeometry(1, 1, 5, 1).translate(0, 0.5, 0), rockM('#ffffff'), N), o = new T3.Object3D(), F = {}, q = new V(), dr = new V(), col = new T3.Color(); let cnt = 0;
      for (let i = 0; i < N * 4 && cnt < N; i++) { const s = rr(L.holeS + 20, 3500), a = rr(0, 6.283); PA.fr(s, F); ptf(s, a, F, q); const dd = gyW - q.y; if (dd < 25) continue; dr.copy(F.p).sub(q); const dist = dr.length(); dr.normalize(); const len = Math.min(rr(4, 20), dist - 27); if (len < 3.5) continue;
        dr.x += rr(-0.35, 0.35); dr.y += rr(-0.35, 0.35); dr.z += rr(-0.35, 0.35); dr.normalize(); o.position.copy(q).addScaledVector(dr, -2.5); o.quaternion.setFromUnitVectors(_b.set(0, 1, 0), dr); const rd2 = len * rr(0.22, 0.34); o.scale.set(rd2, len + 2.5, rd2); o.updateMatrix(); im.setMatrixAt(cnt, o.matrix);
        im.setColorAt(cnt, col.set(dd < 140 ? '#7a5a3a' : dd < 290 ? '#a08a64' : dd < 480 ? '#6a6a72' : '#3e3836')); cnt++; }
      im.count = cnt; im.frustumCulled = false; grp.add(im); }
    add(3587, 4327, 62, caveMat('#140a22', '#3a2a50', '#c08aff', 1.0, 3, 0));   // la geode
    add(4327, 5087, R, caveMat('#140806', '#4a3028', '#ff6a1a', 1.3, 1, 1));   // le manteau
    add(5087, 5417, R, caveMat('#2a0a04', '#6a2a14', '#ffb03a', 1.6, 1, 1));   // la descente
    // la bouche du manteau
    { const o = placeAt(PA, new T3.Mesh(new T3.RingGeometry(R, 64, 48, 1), new T3.MeshLambertMaterial({ color: '#241a30', emissive: '#0a0612', side: T3.DoubleSide })), 4327); grp.add(o); grp.add(placeAt(PA, new T3.Mesh(new T3.TorusGeometry(R + 1.5, 2.2, 10, 48), lam('#3a3e46', { emissive: '#1a0a04' })), 4327)); }
    // les cristaux plantes dans les parois de la geode (decor), en lots
    { const n = 70, im = new T3.InstancedMesh(new T3.CylinderGeometry(0, 1, 1, 6, 1), new T3.MeshLambertMaterial({ color: '#c8a0ff', emissive: '#6a2ab0' }), n), o = new T3.Object3D(), F = {};
      for (let i = 0; i < n; i++) { const s = rr(3607, 4317); PA.fr(s, F); const a = rr(0, 6.28), d = 60; _a.copy(F.r).multiplyScalar(Math.cos(a)).addScaledVector(F.u, Math.sin(a)); o.position.copy(F.p).addScaledVector(_a, d); o.quaternion.setFromUnitVectors(_b.set(0, 1, 0), _c.copy(_a).negate().addScaledVector(F.t, rr(-0.3, 0.3)).normalize()); const h = rr(10, 28); o.scale.set(h * 0.18, h, h * 0.18); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
      im.frustumCulled = false; grp.add(im); }
  }

  // ============================== LES EPREUVES (testees dans la section de la voie : exactes et sans surprise) ==============================
  function obstacles(g, PA, grp) {
    const OB = L.O = [], M = { dark: lam('#2a2e36'), white: lam('#eef0f2'), red: lam('#e8322a', { emissive: '#5a0a06' }), cable: lam('#1c1e22'), ball: bas('#ff7a2a', { fog: false }), steel: lam('#9aa2ac', { emissive: '#1a1c20' }),
      rock: new T3.MeshLambertMaterial({ color: '#2e2622', emissive: '#120604', side: T3.DoubleSide }), root: new T3.MeshLambertMaterial({ color: '#4a3220', emissive: '#100804', flatShading: true }), wood: lam('#7a5a32', { emissive: '#1a1006' }),
      water: new T3.MeshBasicMaterial({ color: '#3aa8ff', transparent: true, opacity: 0.35, side: T3.DoubleSide, depthWrite: false, fog: false }),
      steam: [bas('#ffffff', { fog: false, transparent: true, opacity: 0.8 }), bas('#dfe8ff', { fog: false, transparent: true, opacity: 0.3, blending: T3.AdditiveBlending, depthWrite: false })], vein: bas('#ffa030', { fog: false, side: T3.DoubleSide }), lava: [bas('#ffb03a', { fog: false }), bas('#ff5a10', { fog: false, transparent: true, opacity: 0.35, blending: T3.AdditiveBlending, depthWrite: false })] };
    const hold = (s) => holder(PA, s > 2600 ? L.deepG : grp, s), holdL = (s) => holder(PA, L.landG, s), gyAt = (s) => { const F = PA.fr(s); return (L.gy - F.p.y) / Math.max(0.3, F.u.y); }, atDepth = (d) => PA.sBelow(L.gy - d, L.holeS);
    // BARRE qui balaie (jets de magma) : h = monte et descend, v = gauche droite
    const bar = (s, mode, amp, w, ph, lm, kind) => { const h = hold(s), b = new T3.Group(); h.add(b); const core = new T3.Mesh(new T3.CylinderGeometry(0.7, 0.7, 2 * R, 8), lm[0]), gl = new T3.Mesh(new T3.CylinderGeometry(1.6, 1.6, 2 * R, 10, 1, true), lm[1]); b.add(core); b.add(gl);
      if (mode === 'h') b.rotation.z = Math.PI / 2; const pos = (t) => amp * Math.sin(w * t + ph);
      OB.push({ s, th: 1.4, kind: kind || 'magma', hit: (x, y, t) => (mode === 'h' ? Math.abs(y - pos(t)) : Math.abs(x - pos(t))) < 1.0, upd: (t) => { const p = pos(t), ch = Math.sqrt(Math.max(1, R * R - p * p)); if (mode === 'h') b.position.y = p; else b.position.x = p; core.scale.y = gl.scale.y = ch / R; } }); };
    // UNE POUTRE en travers (cristal geant, racine, tuyau, etai de mine) : la ligne d'angle a, decalee de d ; on passe d'un cote ou de l'autre
    const beam = (s, a, d, w, len, mat, kind, seg) => { const h = hold(s), m = new T3.Mesh(new T3.CylinderGeometry(w, w * (kind === 'racine' ? 0.6 : 1), len, seg || 6), mat); m.rotation.z = a; m.position.set(Math.cos(a) * d, Math.sin(a) * d, 0); h.add(m);
      if (kind === 'xtal') { const gl = glowS(30, '#c08aff', 0.5); gl.position.copy(m.position); h.add(gl); }
      if (kind === 'racine') for (let k = 0; k < 3; k++) { const br = new T3.Mesh(new T3.CylinderGeometry(w * 0.35, w * 0.1, 7, 5), mat), u = rr(-0.35, 0.35) * len; br.position.set(Math.cos(a) * d - Math.sin(a) * u, Math.sin(a) * d + Math.cos(a) * u, 0); br.rotation.z = a + rr(0.6, 1.2) * (k % 2 ? 1 : -1); br.translateY(3); h.add(br); }
      if (kind === 'tuyau') for (const u of [-0.3, 0, 0.3]) { const c = new T3.Mesh(new T3.CylinderGeometry(w * 1.25, w * 1.25, 1.2, 12), M.red); c.rotation.z = a; c.position.set(Math.cos(a) * d - Math.sin(a) * u * len, Math.sin(a) * d + Math.cos(a) * u * len, 0); h.add(c); }
      OB.push({ s, th: w + 0.6, kind, hit: (x, y) => Math.abs(x * Math.cos(a) + y * Math.sin(a) - d) < w * 0.92 + RK }); };
    // VEINE : un mur de roche dure ; seule la veine orange (roche tendre) se fore : on fonce dedans et ca accelere
    const vein = (s, c, sp, w) => { const h = hold(s), rot = new T3.Group(); h.add(rot); { const tm = M.rock.clone(); tm.side = T3.DoubleSide; rot.add(new T3.Mesh(new T3.CircleGeometry(R - 0.3, 48, c + sp / 2, 6.2832 - sp), tm)); } const vmM = M.vein.clone(); vmM.transparent = true; vmM.opacity = 0.5; vmM.depthWrite = false; vmM.side = T3.DoubleSide; const vm = new T3.Mesh(new T3.CircleGeometry(R - 0.3, 24, c - sp / 2, sp), vmM);   /* v452 : la roche dure (qui tue) est PLEINE ; la veine (ou l on passe) est une lueur translucide (c etait l inverse) */ vm.position.z = 0.05; rot.add(vm);
      const gl = glowS(14, '#ff8a2a', 0.8); gl.position.set(Math.cos(c) * R * 0.55, Math.sin(c) * R * 0.55, 0.4); rot.add(gl);
      OB.push({ s, th: 1.4, kind: 'vein', vein: true, vm, rot, hit: (x, y, t) => { const r = Math.hypot(x, y); if (r < 0.8) return false; let d = Math.atan2(y, x) - (c + w * t); d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) > sp / 2 - Math.asin(Math.min(1, RK / Math.max(r, RK))); }, upd: (t) => { rot.rotation.z = w * t; } }); };
    // EOLIENNE sur la voie : le rotor tourne DANS la section (moyeu en x0, y0) ; on passe entre les pales, ou a cote
    const eol = (s, x0, y0, w, ph) => { const h = holdL(s), F0 = PA.fr(s), Lb = 18, hp = _a.copy(F0.p).addScaledVector(F0.r, x0).addScaledVector(F0.u, y0).addScaledVector(F0.t, -2.4), ht = hp.y - L.gy - 1;
      h.add(bakeBox([{ s: [2.6, 2.6, 7], c: '#e4e6e8', p: [x0, y0, -3.2] }]));
      { const tw = new T3.Mesh(new T3.CylinderGeometry(0.9, 1.8, ht, 12), lam('#eef0f2')); tw.position.set(hp.x, L.gy + ht / 2, hp.z); L.landG.add(tw); const fd = new T3.Mesh(new T3.CylinderGeometry(3.4, 3.8, 1.2, 14), lam('#9aa0a6')); fd.position.set(hp.x, L.gy + 0.5, hp.z); L.landG.add(fd); }
      const hub = new T3.Mesh(new T3.SphereGeometry(1.5, 12, 8), M.white); hub.position.set(x0, y0, 0.6); h.add(hub);
      const rot = new T3.Group(); rot.position.set(x0, y0, 0.8); h.add(rot);
      for (let b = 0; b < 3; b++) { const arm = new T3.Group(); arm.rotation.z = b * 2.0944; rot.add(arm); const bl = new T3.Mesh(new T3.BoxGeometry(Lb, 1.5, 0.35), M.white); bl.position.x = Lb / 2 + 0.8; arm.add(bl); const tp = new T3.Mesh(new T3.BoxGeometry(2.4, 1.55, 0.4), M.red); tp.position.x = Lb - 0.4; arm.add(tp); }
      blob(L.landG, _a.copy(PA.fr(s).p).addScaledVector(PA.fr(s).r, x0).setY(L.gy), 6, 6);
      OB.push({ s, th: 2.6, kind: 'eol', hit: (x, y, t) => { const px = x - x0, py = y - y0; if (Math.hypot(px, py) < 1.7 + RK) return true; if (Math.abs(px) < 1.4 + RK && y < y0) return true;
        for (let b = 0; b < 3; b++) { const a = w * t + ph + b * 2.0944, c = Math.cos(a), sn = Math.sin(a), pr = px * c + py * sn; if (pr > 0 && pr < Lb + 1 && Math.abs(-px * sn + py * c) < 0.8 + RK) return true; } return false; }, upd: (t) => { rot.rotation.z = w * t + ph; } }); };
    // LIGNE A HAUTE TENSION en travers des champs : des pylones de chaque cote, les cables aux hauteurs ys (passer dessous, dessus ou entre)
    const ligne = (s, ys) => { const h = holdL(s), F = PA.fr(s), top = Math.max(...ys) + 8, P = [];
      for (const x of [-34, 34, -250, 250, -470, 470]) { const bp = new V().copy(F.p).addScaledVector(F.r, x), hw = bp.y + F.u.y * top - L.gy;   // pylone VERTICAL, du sol jusqu'aux bras
        for (const sx of [-1.6, 1.6]) { const lg = new T3.Mesh(new T3.BoxGeometry(1.4, hw, 1.4), lam('#8a929c')); lg.position.set(bp.x + F.r.x * sx, L.gy + hw / 2, bp.z + F.r.z * sx); L.landG.add(lg); }
        for (const yc of ys) P.push({ s: [14, 0.7, 0.7], c: '#8a929c', p: [x, yc + 0.6, 0] }); P.push({ s: [5, 3, 0.4], c: '#8a929c', p: [x, top + 1, 0] });
        blob(L.landG, _a.copy(bp).setY(L.gy), 5, 5); }
      for (const yc of ys) for (const dz of [-0.9, 0.9]) P.push({ s: [940, 0.22, 0.22], c: '#1c1e22', p: [0, yc, dz] });
      h.add(bakeBox(P)); for (const yc of ys) for (const x of [-14, -4, 6, 16]) { const b = new T3.Mesh(new T3.SphereGeometry(0.75, 10, 8), M.ball); b.position.set(x, yc, 0); h.add(b); }
      OB.push({ s, th: 1.4, kind: 'ligne', hit: (x, y) => ys.some((yc) => Math.abs(y - yc) < 0.5 + RK) }); };
    // ROCHERS en murs (debris de satellites, debris en feu, eboulis) : une moitie bouchee, l'autre libre
    const AV = [], mats = { junk: new T3.MeshLambertMaterial({ color: '#8a929c', emissive: '#14161a', flatShading: true }), hot: new T3.MeshLambertMaterial({ color: '#4a3020', emissive: '#c84a10', flatShading: true }), rock: new T3.MeshLambertMaterial({ color: '#5a4434', emissive: '#140a04', flatShading: true }) };
    for (const mk of Object.keys(mats)) for (let v = 0; v < 3; v++) { const gm = new T3.IcosahedronGeometry(1, 1), P = gm.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i); q.multiplyScalar(1 + 0.22 * Math.sin(q.x * 3.1 + v * 2) * Math.cos(q.y * 2.7 + v) + 0.12 * Math.sin(q.z * 5.3 + v * 3)); if (mk === 'junk') q.set(q.x * 1.4, q.y * 0.5, q.z); P.setXYZ(i, q.x, q.y, q.z); } gm.computeVertexNormals(); AV.push({ gm, mk, list: [] }); }
    const ast = (mk, s, x, y, rad) => { const A = { s, x, y, rad, ph: rr(0, 6), rs: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(), rw: rr(0.4, 1.2) }, cand = AV.filter((q) => q.mk === mk); cand[Math.floor(Math.random() * 3)].list.push(A); OB.push({ s, th: rad * 0.8 + 0.9, kind: 'debris', hit: (px, py) => Math.hypot(px - x, py - y) < rad * 0.75 + RK }); };
    const half = (mk, s, c, lim) => { const dx = Math.cos(c), dy = Math.sin(c); for (let gx = -lim; gx <= lim; gx += 8.5) for (let gy = -lim; gy <= lim; gy += 8.5) { const x = gx + rr(-1.2, 1.2), y = gy + rr(-1.2, 1.2); if (x * dx + y * dy < 3 || Math.hypot(x, y) > lim + 3) continue; ast(mk, s + rr(-3, 3), x, y, rr(3.2, 4.2)); } };
    const H = Math.PI / 2;
    // 1. LA CHUTE LIBRE : des debris de satellites (une moitie bouchee) ; des anneaux de lumiere montrent le cote libre
    half('junk', 300, 0, 24); half('junk', 420, H, 24); half('junk', 540, Math.PI, 24);
    L.gates = []; { const GG = new T3.TorusGeometry(5, 0.32, 8, 40), GM = bas('#7af0ff', { fog: false });
      for (const [s, x, y] of []) { const h = hold(s), m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(GG, GM)); m.add(glowS(12, '#7af0ff', 0.45)); L.gates.push({ s, x, y, m, done: false }); } }
    // 2. LA RENTREE : des debris en feu
    { const SD = [Math.PI, 0, H, -H]; let k = 0; for (let s = 720; s < 1080; s += 110) half('hot', s, SD[k++ % 4], 26); }
    // 3. LA CAMPAGNE : des eoliennes dont les pales balaient la voie, des lignes a haute tension
    eol(1790, 8, 9, 0.75, 0); eol(1890, -9, 10, -0.7, 1); ligne(1990, [-1]); eol(2100, 0, 10, 0.6, 0.5); ligne(2220, [-5, 6]); eol(2330, -7, 9, 0.8, 2); ligne(2450, [2]);
    // 4. LES COUCHES : des racines, des eboulis, des tuyaux de gaz, la nappe d'eau (elle accelere), des etais de la vieille mine de charbon
    // LA FAILLE : que de la roche, de la terre et des racines, ACCROCHEES aux parois : saillies, ponts naturels, passages etroits
    const PH = Math.PI / 2, RKM = [rockM('#7a5a3a'), rockM('#86724e', '#0e0a05'), rockM('#6a6a72', '#0c0c10'), rockM('#3e3836', '#100808')], rockAt = (d) => RKM[d < 140 ? 0 : d < 290 ? 1 : d < 480 ? 2 : 3];
    const xwAt = (s, y) => { const rd = faille(s); return rd[0] * Math.sqrt(Math.max(0, 1 - (y / rd[1]) ** 2)); };
    const wallX = (s, a) => { const fp = PA.fr(s, {}); L.riftPt(s, a, fp, _b); return _b.distanceTo(fp.p); };
    // SAILLIE : un grand pan de roche qui sort d'une paroi (sd = -1 gauche, 1 droite), bord dechiquete ; on passe du cote libre
    const ledge = (s, sd, off0, d, amp) => { const h = hold(s), rd = faille(s), p1 = rr(0, 6), p2 = rr(0, 6), f1 = rr(0.05, 0.09), f2 = rr(0.15, 0.25), A = amp || 0.6, off = (y) => off0 + A * (3.2 * Math.sin(y * f1 + p1) + 1.6 * Math.sin(y * f2 + p2));
      let Ym = 0; while (Ym < rd[1] * 0.97 && off(Ym) < xwAt(s, Ym) - 1.5 && off(-Ym) < xwAt(s, -Ym) - 1.5) Ym += 4;
      const ys = []; for (let y = -Ym; y <= Ym + 0.01; y += 5) ys.push(y);
      const sh = new T3.Shape(); ys.forEach((y, i) => i ? sh.lineTo(y, off(y)) : sh.moveTo(y, off(y))); for (let i = ys.length - 1; i >= 0; i--) sh.lineTo(ys[i], xwAt(s, ys[i]) * 1.8 + 8);
      const th = rr(9, 14), geo = new T3.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelSize: 1.4, bevelThickness: 1.6, bevelSegments: 1, curveSegments: 1, steps: 2 }), P = geo.attributes.position;
      for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), j = 1.3 * Math.sin(px * 0.6 + pz * 0.9) * Math.cos(py * 0.7 + p1) + 0.8 * Math.sin(px * 1.7 + py * 1.3 + pz); P.setXYZ(i, sd * (py + j), px, pz - th / 2 + 0.6 * Math.sin(px * 0.3 + py)); }
      geo.computeVertexNormals(); h.add(new T3.Mesh(geo, rockAt(d)));
      OB.push({ s, th: th / 2 + 1.4, kind: 'saillie', hit: (x, y) => Math.abs(y) < Ym && sd * x > off(y) - 1.4 - RK }); };
    // PASSAGE ETROIT : deux saillies face a face, il reste une porte de 14 m centree en gc
    const pinch = (s, gc, d) => { ledge(s, 1, gc + 9, d, 0.4); ledge(s + 0.01, -1, 9 - gc, d, 0.4); };
    // PONT NATUREL : une arete de roche d'une paroi a l'autre, un peu penchee (k), a la hauteur d0 ; on passe dessus ou dessous
    const bridge = (s, k, d0, w, d) => { const h = hold(s), lR = wallX(s, 0), lL = wallX(s, Math.PI), len = lR + lL + 10, cx = (lR - lL) / 2, m = new T3.Mesh(lumpGeo(len / 2, w * 1.15, w * 2, rr(0, 9), 3, 0.16), rockAt(d)); m.rotation.z = k; m.position.set(cx, d0, 0); h.add(m);
      OB.push({ s, th: w * 1.5 + 0.8, kind: 'pont', hit: (x, y) => Math.abs(-(x - cx) * Math.sin(k) + (y - d0) * Math.cos(k)) < w * 0.9 + RK }); };
    // RACINE geante : un tronc noueux d'une paroi a l'autre, epais aux deux bouts, avec ses radicelles
    const root = (s, k, d0, w) => { const h = hold(s), lR = wallX(s, 0), lL = wallX(s, Math.PI), x0 = -lL - 4, x1 = lR + 4, pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new V(x0 + (x1 - x0) * u, Math.sin(u * 7 + s) * 2.2, Math.sin(u * 5 + s * 2) * 1.6)); }
      const cv = new T3.CatmullRomCurve3(pts), ts = 44, geo = new T3.TubeGeometry(cv, ts, 1, 7, false), P = geo.attributes.position, c = new V(), q = new V();
      for (let i = 0; i < P.count; i++) { const u = Math.floor(i / 8) / ts; cv.getPointAt(Math.min(1, u), c); q.fromBufferAttribute(P, i).sub(c); const fk = w * (0.7 + 0.9 * Math.pow(Math.abs(u - 0.5) * 2, 2) + 0.22 * Math.sin(u * 23 + s)); P.setXYZ(i, c.x + q.x * fk, c.y + q.y * fk, c.z + q.z * fk); }
      geo.computeVertexNormals(); const g2 = new T3.Group(), m = new T3.Mesh(geo, M.root); g2.add(m);
      for (let b = 0; b < 7; b++) { const u = rr(0.1, 0.9), p0 = cv.getPointAt(u), br = new T3.Mesh(new T3.CylinderGeometry(w * 0.1, w * 0.4, 8, 5), M.root); br.position.set(p0.x, p0.y + (b % 2 ? 4 : -4) * 0.9, p0.z); br.rotation.z = (b % 2 ? 1 : -1) * rr(0.2, 0.7); g2.add(br); }
      g2.rotation.z = k; g2.position.set(0, d0, 0); h.add(g2);
      OB.push({ s, th: w * 1.6 + 0.8, kind: 'racine', hit: (x, y) => Math.abs(-x * Math.sin(k) + (y - d0) * Math.cos(k)) < w * 0.95 + RK }); };
    root(atDepth(14), -0.22, 5, 1.3); root(atDepth(44), 0.2, -5, 1.3);
    ledge(atDepth(90), 1, 7, 88);
    pinch(atDepth(150), -4, 150);
    bridge(atDepth(200), 0.15, -4, 3.6, 200);
    { const s = L.nappeS = atDepth(270), h = hold(s), wm = new T3.Mesh(new T3.CircleGeometry(1, 48), M.water); wm.scale.set(RSH + 10, 200, 1); h.add(wm); L.nappeM = wm; }
    ledge(atDepth(335), 1, 6, 335); pinch(atDepth(400), 4, 400); bridge(atDepth(470), -0.2, 5, 3.6, 470);
    ledge(atDepth(540), -1, 7, 540); pinch(atDepth(610), -3, 610);
    // 5. LA GEODE : de grands prismes en travers
    [[3715, 0.3, -6, 2.4], [3817, 1.9, 7, 2.4], [3919, -0.6, 0, 2.2], [4021, 1.2, -8, 2.6], [4110, 2.6, 5, 2.4], [4212, 0.9, 9, 2.4], [4219, 0.9, -9, 2.4]].forEach(([s, a, d, w]) => beam(s, a, d, w, 140, new T3.MeshLambertMaterial({ color: '#8a5ad0', emissive: '#3a1478', transparent: true, opacity: 0.9 }), 'xtal'));
    // 6. LE MANTEAU : des veines a forer et des jets de magma
    vein(4422, Math.PI, 3.0, 0); bar(4517, 'h', 10, 0.8, 0, M.lava); vein(4612, 0.4, 2.7, 0.12); bar(4707, 'v', 10, 0.9, 1, M.lava); vein(4802, -H, 2.5, -0.15); bar(4897, 'h', 10, 1.0, 2, M.lava); vein(4992, 2.4, 2.3, 0.18);
    for (const A of AV) { const im = new T3.InstancedMesh(A.gm, mats[A.mk], Math.max(1, A.list.length)); im.count = A.list.length; im.frustumCulled = false; (A.mk === 'rock' ? L.deepG : grp).add(im); A.im = im; }
    L.AV = AV; L.OB = OB; { const vs = OB.filter((o) => o.vein).map((o) => o.s); if (vs.length) { L.veinA = Math.min(...vs) - 230; L.veinB = Math.max(...vs) + 40; } }   // v454 : la zone des veines qui tournent (on y ralentit)
    // les anneaux d'acceleration (pendant la rentree et la descente)
    L.boostR = []; const RG = new T3.TorusGeometry(4.4, 0.45, 8, 32), RM = bas('#ffc23a', { fog: false });
    for (const [s, x, y] of [[680, 0, 5], [830, 6, -4], [990, -6, 3], [5137, 0, 0], [5287, 4, -3]]) { const h = hold(s), m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(RG, RM)); m.add(glowS(14, '#ffb020', 0.5)); L.boostR.push({ s, x, y, m, done: false }); }
    // l'arche d'ARRIVEE
    { const s = PA.len - 70, h = hold(s), n = 28, im = new T3.InstancedMesh(new T3.BoxGeometry(4.4, 2.2, 2.2), lam('#ffffff', { emissive: '#444444' }), n * 2), o = new T3.Object3D(), c = new T3.Color();
      for (let i = 0; i < n * 2; i++) { const a = (i % n) / n * Math.PI * 2, r2 = 26 + (i >= n ? 2.2 : 0); o.position.set(Math.cos(a) * r2, Math.sin(a) * r2, 0); o.rotation.set(0, 0, a + Math.PI / 2); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(((i % n) + (i >= n ? 1 : 0)) % 2 ? '#16181c' : '#ffffff')); }
      h.add(im); const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#ffd21e'; x.font = '900 96px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ARRIVEE', 256, 66);
      const sp = new T3.Mesh(new T3.PlaneGeometry(36, 9), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(cv), transparent: true, fog: false, side: T3.DoubleSide })); sp.position.y = 34; h.add(sp); }
  }

  // ============================== LES ENNEMIS : helicopteres GEANTS (nuages, campagne), drones-cibles (puits, manteau), sentinelles (geode) ==============================
  function droneMesh(big) {
    const g = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(big ? 2.2 : 1.5, 16, 12), lam('#2a2e36', { emissive: '#0c0e12' })); body.scale.y = 0.62; g.add(body);
    const eye = new T3.Mesh(new T3.SphereGeometry(big ? 0.95 : 0.7, 12, 8), bas('#ff2a1a', { fog: false })); eye.position.z = big ? 1.7 : 1.2; g.add(eye); { const gw = glowS(big ? 7 : 5, '#ff3020', 0.8); gw.position.copy(eye.position); g.add(gw); }
    const lt = []; for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.785, arm = new T3.Mesh(new T3.BoxGeometry(big ? 3.2 : 2.4, 0.3, 0.5), lam('#5a606a')); arm.position.set(Math.cos(a) * (big ? 2.4 : 1.8), Math.sin(a) * (big ? 1.6 : 1.2), 0); arm.rotation.z = a; g.add(arm);
      const l = new T3.Mesh(new T3.SphereGeometry(0.35, 8, 6), bas('#ff5a3a', { fog: false })); l.position.set(Math.cos(a) * (big ? 4 : 3), Math.sin(a) * (big ? 2.6 : 2), 0); g.add(l); lt.push(l); }
    g.userData.lt = lt; return g;
  }
  // l'helicoptere de combat (modele du jeu) en GEANT (x2,7), toujours droit dans le ciel, avec la cible rouge a percuter
  const HELI_K = 2.8, HELI_HIT = 12;
  function heliMesh() {
    const o = new T3.Group(), h = CC.Models.helicopter(true); h.scale.setScalar(HELI_K); h.rotation.y = Math.PI; o.add(h);   // le nez vers la fusee
    const tg = new T3.Group(); o.add(tg);
    o.userData = { rotor: h.userData.rotor, tail: h.userData.tailRotor, tg, lt: [], heli: true }; return o;
  }
  function enemies(g, PA, grp) {
    L.sent = []; L.chase = []; L.bul = [];
    const sent = (s, x, y, kind) => { const m = kind === 'heli' ? heliMesh() : droneMesh(kind === 'big'); if (kind === 'small') m.scale.setScalar(0.72); grp.add(m); L.sent.push({ s, x, y, m, alive: true, fT: rr(0.8, 2), ph: rr(0, 6), small: kind === 'small', heli: kind === 'heli' }); };
    // les nuages : des ESCADRILLES d'helicopteres geants en formation ; la campagne : quelques-uns en vol stationnaire au ras des champs
    for (const [s, F] of [[1230, [[-15, 0], [0, 7], [15, 0]]], [1410, [[-13, -6], [13, -6]]], [1570, [[-15, 4], [0, -5], [15, 4]]]]) for (const [x, y] of F) sent(s + rr(-4, 4), x, y, 'heli');
    for (const [s, x, y] of [[1740, -12, 2], [2040, 11, 1], [2160, -9, 3], [2390, 12, 4]]) sent(s, x, y, 'heli');
    // le puits et le manteau : de petits drones-cibles
    for (const [a, b] of [[2707, 3567], [4347, 5067]]) for (let s = a; s < b; s += rr(46, 64)) { if (L.O.some((o) => Math.abs(o.s - s) < 22) || Math.abs(s - L.nappeS) < 25) continue; const an = rr(0, 6.28), r = rr(0, a < 4000 ? 12 : 8); sent(s, Math.cos(an) * r, Math.sin(an) * r, 'small'); }
    // la geode : de grosses sentinelles
    for (const s of [3667, 3867, 4067, 4267]) { const a = rr(0, 6.28), r = rr(6, 14); sent(s, Math.cos(a) * r, Math.sin(a) * r, 'big'); }
    // les chasseurs : deux helicopteres geants qui filent devant et tirent (nuages), deux drones (geode)
    for (const [a, b, n, k2] of [[1150, 1700, 2, 'heli'], [3627, 4287, 2, 'drone']]) for (let k = 0; k < n; k++) { const m = k2 === 'heli' ? heliMesh() : droneMesh(false); m.visible = false; grp.add(m); L.chase.push({ a, b, k, n, m, ds: 260, fT: 1 + k * 0.6, ph: k * 2.1, on: false }); }
    const mBody = new T3.CylinderGeometry(0.22, 0.22, 2.2, 10).rotateX(Math.PI / 2), mNose = new T3.ConeGeometry(0.22, 0.7, 10).rotateX(Math.PI / 2).translate(0, 0, 1.45), mFin = new T3.BoxGeometry(0.9, 0.05, 0.5), mFl = new T3.ConeGeometry(0.2, 1.4, 8, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -1.8);
    const mW = lam('#eceef2', { emissive: '#3a3a3a' }), mR = lam('#e8322a', { emissive: '#5a0a06' }), mD = lam('#2a2e36'), mF = bas('#ffb04a', { transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 24; i++) { const m = new T3.Group(), body = new T3.Group(); m.add(body); body.add(new T3.Mesh(mBody, mW)); body.add(new T3.Mesh(mNose, mR)); for (let k = 0; k < 2; k++) { const f = new T3.Mesh(mFin, mD); f.position.z = -0.85; f.rotation.z = k * Math.PI / 2; body.add(f); } body.add(new T3.Mesh(mFl, mF));
      m.visible = false; grp.add(m); L.bul.push({ m, body, on: false, s: 0, x: 0, y: 0, vs: 0, vx: 0, vy: 0, t: 0, smT: 0 }); }
  }
  // un helicoptere reste DROIT dans le ciel (rotor a l'horizontale) et fait face a la fusee ; sa cible rouge, elle, se presente toujours de face
  const _hq = new T3.Quaternion(), _hF = {};
  function heliPose(m, s, x, y, bank) {
    placeAt(L.PA, m, s, x, y); const F = L.PA.fr(s, _hF); let dx = -F.t.x, dz = -F.t.z; if (dx * dx + dz * dz < 0.04) { dx = -L.PA.F0.x; dz = -L.PA.F0.z; }
    const fq = frameQ(F, _hq.clone()); m.rotation.set(0, Math.atan2(dx, dz), 0); m.rotateZ(bank || 0); m.userData.tg.quaternion.copy(m.quaternion).invert().multiply(fq);
  }
  // un tir n'est PAS precis (il siffle a cote) ; une fois sur cinq seulement il vise juste ; jamais mortel
  const fire = (g, s, x, y) => { const b = L.bul.find((q) => !q.on); if (!b) return; const vs = -18, tau = Math.max(0.6, (s - L.s) / Math.max(20, L.v - vs)), a = rr(0, 6.28), off = Math.random() < 0.2 ? rr(0.6, 1.6) : rr(2.6, 5);
    Object.assign(b, { on: true, s, x, y, vs, vx: (L.x + Math.cos(a) * off - x) / tau, vy: (L.y + Math.sin(a) * off - y) / tau, t: 0, smT: 0 }); b.m.visible = true; g.audio.play('whoosh'); };
  const missileHit = (g, rk) => { L.v *= 0.75; L.inv = 0.6; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); g.audio.play('boomSmall', rk.pos); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.2; g.flashColor = '#ffb070'; (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' }); };
  function play(g, rk, dt, s0) {
    const PA = L.PA, t = L.t;
    for (const d of L.sent) { if (!d.alive) continue; const ds = d.s - L.s;
      if (ds > (d.small ? 50 : 40) && ds < (d.small ? 150 : 220)) { d.fT -= dt; if (d.fT <= 0) { d.fT = d.small ? 2.8 : d.heli ? 1.6 : 1.9; fire(g, d.s, d.x, d.y); } }
      if (d.s >= s0 - (d.heli ? 6 : 2) && d.s <= L.s + (d.heli ? 6 : 2.5) && Math.hypot(L.x - d.x, L.y - d.y) < (d.small ? 3.6 : d.heli ? HELI_HIT : 4.4)) { d.alive = false; d.m.visible = false; const p = d.m.position.clone(); g.effects.explosion(p, null, false, 'orange'); if (d.heli) { g.effects.explosion(p.clone().add(_b.set(0, 2, 0)), null, false, 'orange'); g.audio.play('boom'); } g.audio.play('target'); g.rig.shake = Math.max(g.rig.shake, d.heli ? 1 : 0.7); g.flash = 0.2; g.flashColor = '#ffb070'; if (d.heli) { const fx = g.effects, up = new V(0, 1, 0), vel = rk.vel ? rk.vel.clone() : new V(0, 0, -30), c = p.clone(); fx.ring(c, up, 2, 30, 0.6, '#ffd060', 0.95); fx.ring(c, vel.clone().normalize(), 1, 22, 0.5, '#ffffff', 0.85); fx.flash(c, '#ffb040', 8, 90, 0.35, '#ff5020'); g.hitStop = 0.09; g.hitScale = 0.18; const sz = new V(14, 6, 14); fx.shatter(c, sz, vel, 'brick'); fx.shatter(c, sz.clone().multiplyScalar(0.7), vel, 'glass'); fx.shatter(c, sz.clone().multiplyScalar(1.2), vel.clone().multiplyScalar(1.4), 'planks'); for (let k = 0; k < 3; k++) fx.addSmoker(c.clone().add(new V((Math.random() - 0.5) * 3, 0.5, (Math.random() - 0.5) * 3)), new V((Math.random() - 0.5) * 3, 5 + Math.random() * 3, (Math.random() - 0.5) * 3), 2.4, -1.5, 0.5, true); setTimeout(() => { try { fx.explosion(c.clone().add(new V((Math.random() - 0.5) * 6, 2 + Math.random() * 3, (Math.random() - 0.5) * 6)), null, true, 'orange'); } catch (e) { /* ignore */ } }, 140); }
        const ev = g.evo, S = EVO.save(g), c = Math.round((d.small ? 90 : d.heli ? 260 : 200) * EVO.mult(S.cm) * (EVO.COIN_K || 1)); if (ev) { ev.kills++; ev.coins += c; } if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + (d.small ? 0.3 : 0.8));
        (g.killPops = g.killPops || []).push({ p: p.clone(), t0: performance.now(), txt: '+' + c }); } }
    // les consignes, la premiere fois
    { const HINT = { debris: 'PASSE DU COTE LIBRE', eol: 'PASSE ENTRE LES PALES', ligne: 'ATTENTION AUX CABLES !', racine: 'PASSE AU-DESSUS OU EN DESSOUS', tuyau: 'PASSE AU-DESSUS OU EN DESSOUS', poutre: 'PASSE AU-DESSUS OU EN DESSOUS', saillie: 'PASSE DU COTE LIBRE', pont: 'PASSE AU-DESSUS OU EN DESSOUS', xtal: 'PASSE A COTE DES CRISTAUX', vein: 'FORE LA VEINE ORANGE !', magma: 'EVITE LE MAGMA' }; L.seen = L.seen || {};
      if (!L.hintT || L.t > L.hintT) { for (const o of L.O) { const ds = o.s - L.s; if (ds > 60 && ds < 170 && HINT[o.kind] && !L.seen[o.kind]) { L.seen[o.kind] = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, HINT[o.kind], 2.2, o.kind === 'vein' ? '#ffb03a' : '#ffffff'); break; } }
        if (!L.seen.drone) { const d = L.sent.find((q) => q.alive && q.s - L.s > 50 && q.s - L.s < 200); if (d) { L.seen.drone = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, d.heli ? 'HELICOPTERE : FONCE DEDANS !' : 'CIBLE ROUGE : FONCE DEDANS !', 2.4, '#ff6a5a'); } } } }
    // les veines forees : un boost, des eclats de roche ; les eclairs : un flash
    for (const o of L.O) { if (o.vein && !o.done && o.s > s0 - 1 && o.s <= L.s + 1) { o.done = true; o.vm.visible = false; L.boostT = 1.8; const p = rk.pos.clone().addScaledVector(rk.fwd, 2); for (let k = 0; k < 3; k++) g.effects.explosion(p.clone().add(_b.set(rr(-2, 2), rr(-2, 2), rr(-2, 2))), null, false, 'orange'); g.audio.play('boostOn'); g.audio.play('boomSmall', p); g.rig.shake = Math.max(g.rig.shake, 0.9); if (g.feed) g.feed('FORE !', '#ffb03a'); }
    }
    // les anneaux de la chute libre : un petit elan a chaque anneau traverse
    for (const G of L.gates) { if (G.done || G.s < s0 - 1 || G.s > L.s + 1) continue; G.done = true; if (Math.hypot(L.x - G.x, L.y - G.y) < 5.5) { L.boostT = Math.max(L.boostT, 0.7); L.gN = (L.gN || 0) + 1; g.audio.play('whoosh'); if (g.feed) g.feed('ANNEAU ' + L.gN + '/' + L.gates.length, '#7af0ff'); G.m.visible = false; } }
    // la NAPPE D'EAU : on la traverse en gerbe, ca accelere
    if (!L.napped && L.nappeS && L.s > L.nappeS) { L.napped = 1; L.boostT = 2.2; L.nappeM.visible = false; g.audio.play('boostOn'); g.audio.play('whoosh'); g.flash = 0.25; g.flashColor = '#8fd8ff'; g.rig.shake = Math.max(g.rig.shake, 0.7); if (CC.L1) CC.L1.msg(g, 'LA NAPPE D EAU : BOOST !', 1.8, '#8fd8ff');
      for (let k = 0; k < 40; k++) g.effects.sparks.emit({ pos: rk.pos.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(18), life: 0.7, s0: 0.6, s1: 0.7, s2: 0.1, cols: g.effects.pal.cyan, drag: 1, grav: 0, a: 1, fout: 0.5 }); }
    bossPlay(g, rk, dt);
    for (const c of L.chase) { const on = L.s > c.a && L.s < c.b; if (on && !c.on) { c.on = true; c.ds = 260; c.m.visible = true; if (c.k === 0) { if (CC.L1) CC.L1.msg(g, c.m.userData.heli ? 'HELICOPTERES EN APPROCHE !' : 'CHASSEURS EN APPROCHE !', 2, '#ff6a5a'); g.audio.play('alarm'); } }
      if (!c.on) continue; const want = on ? 46 + c.k * 12 + 6 * Math.sin(t * 0.7 + c.ph) : 420; c.ds += (want - c.ds) * Math.min(1, dt * (on ? 1.4 : 0.6));
      c.x = Math.cos(t * 0.55 + c.ph) * (10 + 6 * Math.sin(t * 0.3 + c.k)); c.y = Math.sin(t * 0.7 + c.ph * 1.3) * 12;
      if (on && c.ds < 90) { c.fT -= dt; if (c.fT <= 0) { c.fT = 1.5 + c.n * 0.25; fire(g, L.s + c.ds, c.x, c.y); } }
      if (!on && c.ds > 400) { c.on = false; c.m.visible = false; } }
    for (const b of L.bul) { if (!b.on) continue; b.t += dt; b.s += b.vs * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > 4 || b.s < L.s - 20) { b.on = false; b.m.visible = false; continue; }
      if (Math.abs(b.s - L.s) < 2 && Math.hypot(b.x - L.x, b.y - L.y) < 1.3 && L.inv <= 0) { b.on = false; b.m.visible = false; missileHit(g, rk); continue; }
      b.smT -= dt; if (b.smT <= 0) { b.smT = 0.05; g.effects.smokePuff(b.m.position.clone(), new V(0, 0, 0), 0.9, 0.7); } }
    for (const B of L.boostR) { if (B.done || B.s < s0 - 1 || B.s > L.s + 1) continue; B.done = true; if (Math.hypot(L.x - B.x, L.y - B.y) < 5) { L.boostT = 2.6; if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + 1); g.audio.play('boostOn'); g.audio.play('whoosh'); if (g.feed) g.feed('BOOST !', '#ffc23a'); g.flash = 0.15; g.flashColor = '#ffe08a'; } }
  }
  const _o5 = new T3.Object3D(), _zA = new V(0, 0, 1);
  function animate(g, dt) {
    const PA = L.PA, t = L.t;
    for (const o of L.OB) if (o.upd && Math.abs(o.s - L.s) < 700) o.upd(t);
    for (const A of L.AV) { let i = 0; for (const a of A.list) { const F = PA.fr(a.s, _PF); _o5.position.copy(F.p).addScaledVector(F.r, a.x).addScaledVector(F.u, a.y); _o5.quaternion.setFromAxisAngle(a.rs, t * a.rw + a.ph); _o5.scale.setScalar(a.rad); _o5.updateMatrix(); A.im.setMatrixAt(i++, _o5.matrix); } A.im.instanceMatrix.needsUpdate = true; }
    for (const d of L.sent) { const near = d.alive && d.s - L.s < 330 && d.s - L.s > -80; d.m.visible = near; if (!near) continue; const U2 = d.m.userData; if (U2.heli) { heliPose(d.m, d.s, d.x, d.y + Math.sin(t * 1.4 + d.ph) * 0.8, Math.sin(t * 0.9 + d.ph) * 0.08); if (U2.rotor) U2.rotor.rotation.y += dt * 22; if (U2.tail) U2.tail.rotation.x += dt * 40; U2.tg.scale.setScalar(1 + 0.12 * Math.sin(t * 6)); } else { placeAt(PA, d.m, d.s, d.x, d.y + Math.sin(t * 1.4 + d.ph) * 0.8); d.m.rotateZ(Math.sin(t * 0.8 + d.ph) * 0.3); for (const l of U2.lt) l.visible = Math.sin(t * 8 + d.ph) > 0; } }
    for (const c of L.chase) if (c.on) { const U2 = c.m.userData; if (U2.heli) { heliPose(c.m, L.s + c.ds, c.x, c.y, Math.sin(t * 1.1 + c.ph) * 0.18); if (U2.rotor) U2.rotor.rotation.y += dt * 22; } else { placeAt(PA, c.m, L.s + c.ds, c.x, c.y); c.m.rotateZ(Math.sin(t * 1.2 + c.ph) * 0.5); } }
    for (const b of L.bul) if (b.on) { placeAt(PA, b.m, b.s, b.x, b.y); b.body.quaternion.setFromUnitVectors(_zA, _d.set(b.vx, b.vy, -b.vs).normalize()); b.body.rotateZ(L.t * 6); }
    for (const B of L.boostR) B.m.rotation.z = t * 1.5;
    for (const G of L.gates) G.m.scale.setScalar(1 + 0.08 * Math.sin(t * 5 + G.s));
    if (L.windR) for (const w of L.windR) w.r.rotation.z += w.w * dt;
  }

  // ============================== LE NOYAU ET LE BOSS : LE TUNNELIER (3 coups dans la cible au centre de sa tete de coupe) ==============================
  function coreWorld(PA, grp) {
    const sC = 5787, C = PA.fr(sC).p.clone(), ch = new T3.Mesh(new T3.SphereGeometry(420, 64, 40), coreMat()); ch.position.copy(C); grp.add(ch); L.core = ch;
    const gl = glowS(420, '#ff8a2a', 0.45); gl.position.copy(C); grp.add(gl);
    // la bouche du noyau : un grand anneau incandescent ; quelques anneaux de metal qui tournent autour de la voie
    L.coreRings = []; for (const [s, r] of [[5427, 30], [5677, 54], [5927, 40]]) { const o = placeAt(PA, new T3.Mesh(new T3.TorusGeometry(r, 1.8, 10, 64), lam('#3a3e46', { emissive: '#ff5a1a' })), s); grp.add(o); L.coreRings.push(o); }
  }
  function bossBuild(g, PA, grp) {
    const m = new T3.Group(), Y = '#e8b020', DK = '#23262c', ST = '#6e747e', P = [];
    // le corps : un long cylindre jaune d'engin de chantier, des anneaux noirs, des verins de poussee, des patins
    P.push({ cyl: [9, 9, 40, 24], c: Y, p: [0, 0, -8], r: [Math.PI / 2, 0, 0] }, { cyl: [9.4, 9.4, 1.6, 24], c: DK, p: [0, 0, 4], r: [Math.PI / 2, 0, 0] }, { cyl: [9.4, 9.4, 1.6, 24], c: DK, p: [0, 0, -14], r: [Math.PI / 2, 0, 0] }, { cyl: [9.4, 9.4, 1.6, 24], c: DK, p: [0, 0, -26], r: [Math.PI / 2, 0, 0] });
    P.push({ cyl: [10, 9, 6, 24], c: ST, p: [0, 0, 14], r: [Math.PI / 2, 0, 0] }, { cyl: [7, 7, 12, 18], c: '#4a4f58', p: [0, 0, -34], r: [Math.PI / 2, 0, 0] });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; P.push({ s: [2.4, 2.4, 22], c: DK, p: [Math.cos(a) * 9.6, Math.sin(a) * 9.6, -12] }, { s: [3.6, 1.2, 6], c: ST, p: [Math.cos(a) * 10.4, Math.sin(a) * 10.4, -22] }); }
    m.add(bakeBox(P));
    // la TETE DE COUPE : un disque d'acier hérissé de dents, qui tourne
    const head = new T3.Group(); head.position.z = 18; m.add(head);
    head.add(new T3.Mesh(new T3.CylinderGeometry(11.5, 11.5, 2.4, 32).rotateX(Math.PI / 2), lam('#5a606a')));
    for (let k = 0; k < 6; k++) { const sp = new T3.Mesh(new T3.BoxGeometry(1.6, 11, 1.2), lam(DK)); sp.position.set(Math.cos(k / 6 * 6.283) * 5.5, Math.sin(k / 6 * 6.283) * 5.5, 1.4); sp.rotation.z = k / 6 * 6.283 - Math.PI / 2; head.add(sp); }
    for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, t = new T3.Mesh(new T3.ConeGeometry(0.6, 2, 6), lam('#c8ccd2')); t.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 1.6); t.rotation.x = Math.PI / 2; head.add(t); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + 0.26, t = new T3.Mesh(new T3.ConeGeometry(0.5, 1.6, 6), lam('#c8ccd2')); t.position.set(Math.cos(a) * 7.5, Math.sin(a) * 7.5, 1.8); t.rotation.x = Math.PI / 2; head.add(t); }
    // la grande cible rouge au centre de la tete, qui ne tourne pas
    const tg = new T3.Group(); tg.position.set(0, 0, 21.4); m.add(tg); tg.add(new T3.Mesh(new T3.TorusGeometry(5.4, 0.45, 8, 48), bas('#ff3a2a', { fog: false }))); tg.add(new T3.Mesh(new T3.TorusGeometry(2.6, 0.35, 8, 32), bas('#ff3a2a', { fog: false }))); tg.add(new T3.Mesh(new T3.CircleGeometry(1, 16), bas('#ff3a2a', { fog: false })));
    for (const x of [-4, 4]) { const gw = glowS(10, '#ff8a3a', 0.9); gw.position.set(x, 0, -41); m.add(gw); }
    { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const x = cv.getContext('2d'); x.fillStyle = 'rgba(20,6,6,0.85)'; x.fillRect(0, 0, 512, 192); x.strokeStyle = '#ff3a2a'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 182); x.fillStyle = '#ff3a2a'; x.font = '900 64px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BOSS', 256, 56); x.fillStyle = '#ffffff'; x.font = '900 52px Arial Black, Arial, sans-serif'; x.fillText('LE TUNNELIER', 256, 134);
      const sp = new T3.Sprite(new T3.SpriteMaterial({ map: new T3.CanvasTexture(cv), transparent: true, fog: false, depthTest: false })); sp.scale.set(26, 9.75, 1); sp.position.set(0, 18, 0); sp.renderOrder = 20; }
    m.visible = false; grp.add(m);
    L.boss = { m, tg, head, s: 5657, sT: 5657, x: 0, y: 0, hp: 3, on: false, dead: false, deadT: 0, hitT: 0, fT: 2, cap: PA.len - 300, boomT: 0 }; if (EVO.milBoss) EVO.milBoss(g, L.boss, 5);   // v451 : vrai engin militaire geant
  }
  function bossPlay(g, rk, dt) {
    const B = L.boss; if (!B || (B.dead && B.deadT > 3)) return;
    if (!B.on && L.s > 5417 - 200) { B.on = true; B.m.visible = true; if (CC.L1) CC.L1.msg(g, 'BOSS : FONCE DANS LA CIBLE DU TUNNELIER (3 COUPS)', 3, '#ff5a3a'); g.audio.play('robotAlarm'); }
    if (!B.on) return; const t = L.t;
    if (B.dead) { B.deadT += dt; B.boomT -= dt; if (B.boomT <= 0 && B.deadT < 2.4) { B.boomT = 0.18; const p = B.m.position.clone().add(new V(rr(-8, 8), rr(-6, 6), rr(-20, 20))); g.effects.explosion(p, null, false, 'orange'); g.audio.play('boomSmall', p); }
      if (B.deadT > 2.4 && B.m.visible) { B.m.visible = false; g.flash = 0.6; g.flashColor = '#ffd8a0'; g.audio.play('boom'); g.rig.shake = 1.4; for (let k = 0; k < 6; k++) g.effects.explosion(B.m.position.clone().add(new V(rr(-10, 10), rr(-6, 6), rr(-20, 20))), null, false, 'orange'); } return; }
    B.hitT -= dt; B.s += (B.sT - B.s) * Math.min(1, dt * (B.hitT > 0 ? 2.5 : 1.2)); B.x = 6 * Math.sin(t * 0.45); B.y = 4 * Math.sin(t * 0.6);
    const capped = B.sT >= B.cap - 1, ds = B.s - L.s, ph = 3 - B.hp;
    if (ds > 45 && ds < 280) { B.fT -= dt; if (B.fT <= 0) { B.fT = [1.6, 1.25, 0.95][ph]; fire(g, B.s - 24, B.x + 9, B.y); if (ph >= 1) fire(g, B.s - 24, B.x - 9, B.y); if (ph >= 2) fire(g, B.s - 24, B.x, B.y + 9); } }
    if (B.hitT <= 0 && L.s > B.s - 24 && L.s < B.s + 30 && (capped || (B.hw && Math.abs(L.x - B.x) < B.hw && Math.abs(L.y - B.y) < B.hh) || Math.hypot(L.x - B.x, L.y - B.y) < 11.5 + RK)) {
      B.hp = capped ? 0 : B.hp - 1; B.hitT = 1.6; L.inv = 1.2; L.v *= 0.6; g.rig.shake = 1.2; g.flash = 0.35; g.flashColor = '#ffffff'; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); g.audio.play('reactorHit'); g.audio.play('boom');
      if (EVO.onBossHit) EVO.onBossHit(g, null); rk.fuel = Math.min(rk.fuelMax, rk.fuel + 6);
      if (B.hp <= 0) { B.dead = true; B.deadT = 0; if (CC.L1) CC.L1.msg(g, 'TUNNELIER DETRUIT !', 3, '#ffe9a0'); g.audio.play('victory'); }
      else { B.sT = Math.min(B.cap, L.s + Math.min(300, Math.max(90, (B.cap - L.s) / B.hp)));   /* v452 : il recule de facon a laisser la place aux coups restants (plus de mort d office au bout de l arene) */ if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 2, '#ff9a5a'); }
      (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 3, 0)), t0: performance.now(), txt: B.hp > 0 ? '-1' : 'BOUM !' }); return; }
    if (L.s > B.s + 30 && !capped) { B.sT = Math.min(B.cap, L.s + 240); B.s = Math.max(B.s, L.s + 110); if (CC.L1) CC.L1.msg(g, 'IL REVIENT !  FONCE DEDANS', 1.6, '#ff6a5a'); }
  }
  function bossAnim(g, dt) { const B = L.boss; if (!B || !B.on || !B.m.visible) return; if (EVO.milAnim) EVO.milAnim(g, B, dt, L.t); if (!B.dead) { placeAt(L.PA, B.m, B.s, B.x, B.y); B.head.rotation.z += dt * (1.2 + (3 - B.hp) * 0.6); } else { B.m.position.y -= dt * 4; B.m.rotateZ(dt * 0.4); } B.tg.scale.setScalar(1 + 0.08 * Math.sin(L.t * 5)); B.tg.visible = !B.dead; }

  // ============================== LA FICHE DU NIVEAU 5 ==============================
  const CH5 = ZN.map((z) => [z[3], z[0], z[2]]);
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 5) || g.evoPreview) return _ld(g);
    EVO.chapters = CH5.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { const A = EVO.SCENE_AUDIO; A.cpad = 'espace'; A.cchute = 'espace'; A.crentree = 'espace'; A.cciel = 'sky'; A.ccampagne = 'sky'; for (const k of ['ccouches', 'cgeode', 'cmanteau', 'cdescente']) A[k] = 'evoMine'; A.cnoyau = 'evoBoss'; }
    return EVO.baseDef({ zone: 'campagne', len: 6100, scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 5505, bossEnt: null });
  };

  // ============================== CONSTRUCTION, PILOTAGE, CAMERA ==============================
  const dispose = (g) => { if (!L) return; for (const k of ['grp', 'sky', 'dust', 'plasma']) if (L[k]) g.scene.remove(L[k]); if (L.far0) { g.camera.far = L.far0; g.camera.updateProjectionMatrix(); } L = null; EVO.core = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); };
  function build(g) {
    const pad = g.pad, run = g.endlessRun, T = run.T, a = T.at(0, 0, 0), b = T.at(8, 0, 0), F0 = new V(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const O = (pad && pad.origin ? pad.origin.clone() : new V(a[0], a[1] + 2, a[2]));
    L = EVO.core = { t: 0, s: 0, x: 0, y: 0, v: 0, started: false, cam: null, inv: 0, boostT: 0, bk: 0, zi: 0, tubeMats: [] };
    L.rkL = (EVO.rocketLen && EVO.rocketLen(g)) || 2.4; O.y += 60;   // l'orbite : un peu au-dessus du hangar du niveau 1 (qui est cache)
    const PA = L.PA = buildPath(O, F0), grp = L.grp = new T3.Group(); g.scene.add(grp);
    L.deepG = new T3.Group(); grp.add(L.deepG); dock(g, PA, grp); buildSky(g); clouds(PA, grp); L.gy = PA.O.y + GY; L.holeS = PA.sBelow(L.gy, 2400); caverns(PA, L.deepG); countryside(g, PA, grp); obstacles(g, PA, grp); enemies(g, PA, grp); coreWorld(PA, L.deepG); bossBuild(g, PA, grp);
    grp.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (!m.isShaderMaterial && !m.fog) { m.fog = true; m.needsUpdate = true; } });
    // la poussiere / les braises / la neige qui defilent pres de la fusee
    { const n = 140, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#cfe8ff', size: 0.5, map: dotTex(), transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; g.scene.add(p); L.dust = p; L.dustInit = false; }
    // la boule de feu de la rentree : une coque de plasma devant la fusee
    { const pl = new T3.Group(), c1 = new T3.Mesh(new T3.SphereGeometry(1, 24, 16, 0, 6.283, 0, Math.PI * 0.55), new T3.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0.5, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }));
      c1.rotation.x = Math.PI / 2; c1.scale.set(1.1, 1.6, 1.1); pl.add(c1); const c2 = new T3.Mesh(new T3.ConeGeometry(1.1, 6, 24, 1, true), new T3.MeshBasicMaterial({ color: '#ffb05a', transparent: true, opacity: 0.25, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); c2.rotation.x = Math.PI / 2; c2.position.z = -3; pl.add(c2);
      pl.visible = false; g.scene.add(pl); L.plasma = pl; L.plasmaM = [c1.material, c2.material]; }
    L.far0 = g.camera.far;
  }
  const inWall = (s) => { for (const [a, b, r] of WALLS) if (s >= a && s <= b) return r; return 0; };
  // le sol qu'on rase (la campagne) : hauteur dans la section a ne pas franchir
  const floorAt = (s, F) => { if (s < 1560 || s > L.holeS - 25 || F.u.y < 0.3) return -1e9; const fl = (L.gy + 2.2 - F.p.y) / F.u.y;
    if (L.slit && s > L.holeS - 270) { const q = _c.copy(F.p).addScaledVector(F.r, L.x).addScaledVector(F.u, fl); if (L.slit.hole(q.x, q.z)) return -1e9; }   // au-dessus de la fente, plus de sol : on peut plonger
    return fl; };

  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on5(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA, inp = g.input; this.age += dt; if (!this.ignited && this.age >= this.cfg.ignitionDelay) { this.ignited = true; g.audio.play('ignite', this.pos); }
    if (!L.started) { L.started = true; L.K = CC.EVO.spdK ? CC.EVO.spdK(this.game) : 1; L.s = 0; L.x = 0; L.y = 0; L.v = Math.max(30, this.vel.length()); const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); L.yaw0 = e.y; L.pit0 = e.x; L.ry = 0; L.rp = 0; }
    { const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); let dy = e.y - L.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); L.ry = U.clamp(dy, -0.62, 0.62) * Math.exp(-dt * 0.9); L.rp = U.clamp(e.x - L.pit0, -0.62, 0.62) * Math.exp(-dt * 0.9); inp.setAim(L.yaw0 + L.ry, L.pit0 + L.rp); }
    const s0 = L.s, zi = zoneAt(L.s), Z = ZN[zi], boostZ = /boost/.test(Z[5]);
    if (zi !== L.zi) { L.zi = zi; if (CC.L1) CC.L1.msg(g, Z[3] + (boostZ ? ' !' : ''), 2.2, Z[4]); if (boostZ) { g.audio.play('boostOn'); g.audio.play('whoosh'); } else g.audio.play(Z[5] === 'open' || Z[5] === 'low' ? 'jetPass' : 'alarm'); }
    if (L.boostT > 0) L.boostT -= dt; if (L.inv > 0) L.inv -= dt;
    if (!(boostZ || L.boostT > 0 || Z[5] === 'fall' || Z[5] === 'shaft')) this.fuel = Math.max(0, this.fuel - dt * (L.K || 1));   // en chute libre et en plongeant dans la faille, la gravite travaille : pas de carburant brule
    const dry = this.fuel <= 0;
    if (dry && !L.dry) { L.dry = 1; if (CC.L1) CC.L1.msg(g, 'PLUS DE CARBURANT !', 2, '#ff6a5a'); g.audio.play('warnFuel'); } if (!dry) L.dry = 0;
    const vMax0 = L.boostT > 0 ? 106 : boostZ ? 92 : Z[5] === 'fall' ? 76 : 60; let vMax = Math.max(vMax0, Math.min(vMax0 * (L.K || 1), CC.EVO.curveCap ? CC.EVO.curveCap(L.PA, L.s) : 1e9)); if (L.veinA && L.s > L.veinA && L.s < L.veinB) vMax = Math.min(vMax, 56);   /* v454 : dans les veines qui tournent, on ralentit (56 m/s, plus de rafale apres chaque veine forée) */   // v449 : la vitesse monte avec la fusee   // en chute libre, on tombe vite
    L.bk += ((L.boostT > 0 ? 1 : boostZ ? 0.65 : 0) - L.bk) * Math.min(1, dt * 3);
    if (dry) { L.fall = (L.fall || 0) + 22 * dt; L.v = Math.max(26, L.v - 6 * dt); L.y -= L.fall * dt; L.rp = Math.min(L.rp, -0.3); L.dryT = (L.dryT || 0) + dt; }   // v448 : a sec, la fusee tombe (elle ne s'ecrase plus en plein vol)
    else { L.fall = 0; L.dryT = 0; L.v += ((this.throttle || this.freeBoost || boostZ || L.boostT > 0 ? vMax : vMax * 0.8) - L.v) * Math.min(1, dt * (L.v < vMax ? 1.4 : 0.9)); L.v = Math.max(24, L.v); } if (L.veinA && L.s > L.veinA && L.s < L.veinB && L.v > vMax) L.v += (vMax - L.v) * Math.min(1, dt * 2.2);   // v454 : on freine franchement en entrant dans les veines
    const vx = -L.v * Math.sin(L.ry) * 0.85, vy = L.v * Math.sin(L.rp) * 0.85, lat = Math.min(1, 52 * (L.K || 1) / L.v); L.x += vx * lat * dt; L.y += vy * lat * dt; L.s += L.v * dt;
    const wr = inWall(L.s), lim = wr ? wr - 2.2 : Z[5] === 'low' ? 22 : ROPEN - 2, rr2 = Math.hypot(L.x, L.y);
    if (dry && this.active && ((rr2 > lim && wr) || L.dryT > 3.2)) { g.onRocketCrash('stalled', this.pos.clone(), null); return; }
    if (rr2 > lim && !(dry && !wr)) { L.x *= lim / rr2; L.y *= lim / rr2; L.v *= 1 - dt * 0.6; if (wr && Math.random() < dt * 14) { const F2 = PA.fr(L.s); _a.copy(F2.p).addScaledVector(F2.r, L.x * 1.12).addScaledVector(F2.u, L.y * 1.12); g.effects.sparks.emit({ pos: _a.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(10), life: 0.4, s0: 0.3, s1: 0.4, s2: 0.1, cols: g.effects.pal.cyan, drag: 1, grav: 0, a: 1, fout: 0.5 }); if (Math.random() < 0.15) g.audio.play('clank'); } }
    const F2 = PA.fr(L.s), fl = floorAt(L.s, F2); if (dry && L.y < fl + 0.3 && this.active) { g.onRocketCrash('stalled', this.pos.clone(), null); return; } if (L.y < fl) { L.y = fl; if (Math.random() < dt * 8) g.effects.smokePuff(_a.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y - 1).clone(), new V(rr(-2, 2), rr(1, 3), rr(-2, 2)), 1.4, 0.9); }   // on rase les champs sans passer dessous
    this.pos.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y);
    this.vel.copy(F2.t).multiplyScalar(L.v).addScaledVector(F2.r, vx * lat).addScaledVector(F2.u, vy * lat); this.speed = this.vel.length(); this.fwd.copy(this.vel).normalize(); this.flightDist += L.v * dt;
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, L.s);
    this.thrustK = dry ? Math.max(0, (this.thrustK || 0) - dt * 4) : 1;
    if (L.inv <= 0 && L.OB) for (const o of L.OB) { if (o.s + o.th < s0 || o.s - o.th > L.s) continue; if (o.hit(L.x, L.y, L.t)) { g.onRocketCrash('wall', this.pos.clone(), F2.t.clone().negate()); if (this.active) { L.inv = 0.8; L.v *= 0.5; g.rig.shake = Math.max(g.rig.shake, 1); } break; } }
    if (this.active && L.sent) play(g, this, dt, s0);
    // on plonge dans le puits : une gerbe de terre
    if (!L.holed && L.s > L.holeS - 4) { L.holed = 1; g.rig.shake = Math.max(g.rig.shake, 1.2); g.flash = 0.3; g.flashColor = '#d8b080'; g.audio.play('boom'); for (let k = 0; k < 8; k++) g.effects.smokePuff(this.pos.clone().add(new V(rr(-8, 8), rr(0, 4), rr(-8, 8))), new V(rr(-6, 6), rr(6, 14), rr(-6, 6)), 3, 1.6); }
    if (this.active && L.s > PA.len - 60 && (!L.boss || L.boss.dead) && !g.evoFinish && EVO.finishRun) { if (CC.L1) CC.L1.msg(g, 'ARRIVEE !', 2.6, '#ffe9a0'); EVO.finishRun(g); }
  };

  // --- AU MENU : la foreuse couchee sur la catapulte de la station, la Terre en dessous ---
  function menuView(g, rig, dt) {
    const PA = L.PA, O = PA.O, R0 = PA.R0, F0 = PA.F0, cam = rig.cam, rk = g.rocket, A = g.evoAnim, Y = new V(0, 1, 0), Lw = L.rkL;
    if (rk.mesh) { rk.mesh.visible = true; rk.mesh.position.copy(O); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(_a.crossVectors(Y, F0).normalize(), Y, F0)); }
    let p, look; const t = L.t;
    if (A && A.kind === 'tier') { const an = -1.1 + Math.sin(A.t * 0.5) * 0.35, D = U.clamp(2.8 * Lw, 4.5, 8); p = new V().copy(O).addScaledVector(R0, -Math.cos(an) * D).addScaledVector(F0, Math.sin(an) * D).addScaledVector(Y, Lw * 0.5); look = O.clone(); }
    else { const ch = g.evoAim ? (g.evoAim.lock ? 1 : g.evoAim.ch || 0) : 0, D = Math.max(1, Lw / 2.4); p = new V().copy(O).addScaledVector(R0, (3.4 - 0.8 * ch) * D).addScaledVector(F0, (-4.4 - 0.4 * Math.sin(t * 0.12)) * D).addScaledVector(Y, (2.0 - 0.5 * ch) * D); look = new V().copy(O).addScaledVector(F0, 1.2 * D).addScaledVector(Y, -0.7 * D);
      if (ch > 0.2) { p.x += (Math.random() - 0.5) * 0.12 * ch; p.y += (Math.random() - 0.5) * 0.12 * ch; } }
    if (!L.mc) { L.mc = p.clone(); L.ml = look.clone(); } const k = 1 - Math.exp(-dt * 4); L.mc.lerp(p, k); L.ml.lerp(look, k);
    cam.position.copy(L.mc); cam.up.set(0, 1, 0); cam.lookAt(L.ml); if (Math.abs(cam.fov - 55) > 0.01) { cam.fov = 55; cam.updateProjectionMatrix(); } if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); } cam.updateMatrixWorld();
  }
  const _rup = CC.CameraRig.prototype.update;
  CC.CameraRig.prototype.update = function (dt) {
    _rup.call(this, dt); const g = this.game, rk = g.rocket;
    if (L && L.PA && on5(g) && !rk.active && (g.state === 'MENU' || g.state === 'AIM' || g.state === 'LAUNCH')) { menuView(g, this, dt); return; }
    if (!L || !L.PA || !on5(g) || !rk.active || g.state !== 'FLIGHT' || !L.started) return;   /* v452 : la camera du niveau reste aussi pendant l arrivee */
    const PA = L.PA, cam = this.cam, F = PA.fr(L.s + 6), Fq = frameQ(F, _q2.clone());
    if (!L.camQ) L.camQ = Fq.clone(); L.camQ.slerp(Fq, 1 - Math.exp(-dt * 3.2));
    const cr = new V(1, 0, 0).applyQuaternion(L.camQ), cu = new V(0, 1, 0).applyQuaternion(L.camQ), cf = new V(0, 0, -1).applyQuaternion(L.camQ);
    const F0 = PA.fr(L.s), ctr = _d.copy(F0.p).addScaledVector(F0.r, L.x * 0.94).addScaledVector(F0.u, L.y * 0.94), bkD = U.clamp(1.5 * L.rkL, 3.6, 7.5);
    cam.position.copy(ctr).addScaledVector(cf, -bkD).addScaledVector(cu, 0.47 * bkD);
    cam.up.copy(cu); cam.lookAt(_a.copy(rk.pos).addScaledVector(cf, 4).addScaledVector(cu, 0.3));
    // au depart : on part de la vue du menu (a cote de la fusee) et on rejoint la poursuite sur les 90 premiers metres
    { const b = ss(5, 90, L.s); if (b < 1 && L.mc) { const qC = _q.copy(cam.quaternion), pC = _c.copy(cam.position); cam.position.copy(L.mc).addScaledVector(PA.F0, L.s * 0.85); cam.up.set(0, 1, 0); cam.lookAt(rk.pos); const qL = _q2.copy(cam.quaternion), pL = cam.position.clone();
      cam.position.lerpVectors(pL, pC, b); cam.quaternion.copy(qL).slerp(qC, b); cam.up.set(0, 1, 0).applyQuaternion(cam.quaternion); } }
    { const f0 = cam.fov, fw = f0 + 16 * L.bk; if (Math.abs(fw - f0) > 0.01) { cam.fov = fw; cam.updateProjectionMatrix(); } }
    if (this.shake > 0) cam.position.addScaledVector(cr, (U.fx() - 0.5) * this.shake * 0.5).addScaledVector(cu, (U.fx() - 0.5) * this.shake * 0.5);
    if (cam.far < 7000) { cam.far = 7000; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    { const fz = _c.copy(rk.fwd), fx = _a.crossVectors(cu, fz).normalize(), fy = _b.crossVectors(fz, fx); rk.mesh.quaternion.setFromRotationMatrix(_m.makeBasis(fx, fy, fz)); rk.mesh.position.copy(rk.pos); }
  };
  if (CC.Horizon) { const _hu = CC.Horizon.prototype.update; CC.Horizon.prototype.update = function (g) { if (L && on5(g)) { for (const m of [this.ring, this.glow, this.mtn]) if (m) m.visible = false; return; } return _hu.call(this, g); }; }
  // l'epave ne tombe pas vers un sol a des kilometres : elle s'arrete en tournant, le drapeau se plante en l'air a cote d'elle
  // v448 : l'epave retombe (gravite normale) et se pose sur le relief du niveau (EVO.terrain) : plus d'epave qui flotte
  // --- l'ambiance le long de la voie ---
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on5(g)) return;
    const s = L.started ? L.s : 0, M = moodAt(s), fl = L.flashK || 0;
    if (fl > 0) { M.fog.lerp(_c4.set('#c8d8ff'), fl * 0.6); M.top.lerp(_c4, fl * 0.6); M.hor.lerp(_c4, fl * 0.6); }
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(M.top); u.horizon.value.copy(M.hor); u.bottom.value.copy(M.fog); u.cloud.value = 0; }
    g.scene.fog.color.copy(M.fog); g.scene.fog.near = M.near; g.scene.fog.far = M.far;   // le jeu relit g.fogBase a chaque image (distance du niveau 1 : 150/310) : sans ceci notre brume etait ecrasee
    if (g.fogBase) { g.fogBase.near = M.near; g.fogBase.far = M.far; g.fogBase.color.copy(M.fog); }
    g.renderer.setClearColor(M.fog); if (g.stars) g.stars.visible = false;
    const sp = s < 640 ? 1 : 0; g.nightK = sp * 0.8; if (g.postParams) { g.postParams.bloomStrength = 0.25 + 0.15 * (s > 5087 ? 1 : 0); g.postParams.bloomThreshold = 0.8; g.postParams.vignette = 0.3; g.postParams.saturation = 1.05; g.postParams.contrast = 1.06; }
    g.ambient.intensity = 0.32 * M.li + 0.1; g.sun.intensity = 0.95 * M.li; g.sun.color.set(s > 640 && s < 1150 ? '#ffb070' : s > 4327 ? '#ff9a5a' : s > 1150 && s < 2657 ? '#fff4e0' : '#ffffff');
  };
  // --- chaque image ---
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!on5(g) || !g.endlessRun || !g.endlessRun.T) return;
    if (!L) { try { build(g); } catch (e) { console.warn('core', e); L = null; return; } }
    const PA = L.PA, rk = g.rocket, cam = g.camera, s = L.started ? L.s : 0, fx = g.effects; L.t += dt;
    if (L.cloudM) { L.cloudM.uniforms.uFar.value = Math.max(600, g.scene.fog.far * 1.3); L.cloudIM.visible = s > 520 && s < 2727; }
    for (const M of L.cMats) { M.uniforms.uT.value = L.t; M.uniforms.uFar.value = g.scene.fog.far; if (M.uniforms.uFog) M.uniforms.uFog.value.copy(g.scene.fog.color); }
    if (L.water) L.water.uniforms.uT.value = L.t; if (L.core) L.core.material.uniforms.uT.value = L.t; if (L.coreRings) L.coreRings.forEach((o, i) => o.rotateZ(dt * (i % 2 ? -0.5 : 0.4))); if (L.blinks) for (const b of L.blinks) b.visible = Math.sin(L.t * 5) > 0;
    bossAnim(g, dt);
    // le decor du niveau 1 n'a rien a faire ici (sol, hangar, rampe)
    for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = false;
    for (const o of g.scene.children) if (o.name === 'level') o.visible = false; if (g.pad && g.pad.evoL) g.pad.evoL.visible = false; if (g.pad && g.pad.hangar) g.pad.hangar.visible = false;
    if (L.rkSh) { const on = false; L.rkSh.visible = on; if (on) { const alt = Math.max(0, rk.pos.y - L.gy); L.rkSh.position.set(rk.pos.x, L.gy + 0.3, rk.pos.z); L.rkSh.scale.setScalar(L.rkL * (1.5 + alt * 0.05)); L.rkSh.material.opacity = U.clamp(1.2 - alt / 70, 0.45, 1); } }
    if (L.dock) L.dock.visible = s < 800; if (L.landG) L.landG.visible = s > 1060 && s < 2827; if (L.deepG) L.deepG.visible = s > 1500;
    // feux de la catapulte : ils filent vers l'avant
    if (L.clamps && L.started) for (const c of L.clamps) { c.position.y = Math.max(-3, c.position.y - dt * 4); c.rotation.x = Math.min(1.2, c.rotation.x + dt * 3); }
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.audio.play('rumble'); g.flash = 0.3; g.flashColor = '#bfe8ff'; if (CC.L1) CC.L1.msg(g, 'LARGAGE !', 1.8, '#bfe8ff'); }
    animate(g, dt);
    L.flashK = Math.max(0, (L.flashK || 0) - dt * 3);
    // le ciel : etoiles et Terre pendant la chute ; la Terre grossit tres vite, puis on est dedans
    if (L.sky) { L.sky.position.copy(cam.position); const E = L.earth, hv = U.lerp(900, 120, ss(0, 900, s)); E.visible = s < 1080; E.position.set(0, -(RS + hv), 0); E.rotation.set(Math.PI / 2 - 0.35, 0, L.t * 0.004); L.cloudSphere.rotation.y = L.t * 0.002;
      for (const p of L.stars) p.material.color.setScalar(p.userData.op * (1 - ss(380, 640, s))); L.sky.visible = s < 1080;
      if (L.sun) { _b.copy(PA.R0).multiplyScalar(0.75).addScaledVector(PA.F0, 0.5); _b.y = 0.28; _b.normalize(); L.sun.position.copy(_b).multiplyScalar(2800); } }
    // la boule de feu de la rentree
    { const k = L.started ? ss(600, 700, s) * (1 - ss(880, 1020, s)) : 0; L.plasma.visible = k > 0.01 && rk.active; if (L.plasma.visible) { L.plasma.position.copy(rk.pos).addScaledVector(rk.fwd, L.rkL * 0.45); L.plasma.quaternion.setFromUnitVectors(_zA, rk.fwd); L.plasma.scale.setScalar(L.rkL * 0.75 * (1 + 0.06 * Math.sin(L.t * 30))); L.plasmaM[0].opacity = 0.55 * k; L.plasmaM[1].opacity = 0.3 * k; if (Math.random() < dt * 30 * k) fx.sparks.emit({ pos: rk.pos.clone().addScaledVector(rk.fwd, L.rkL * 0.4), vel: rk.fwd.clone().multiplyScalar(-rr(20, 40)).add(new V(rr(-4, 4), rr(-4, 4), rr(-4, 4))), life: 0.5, s0: 0.5, s1: 0.6, s2: 0.1, cols: fx.pal.ember, drag: 1, grav: 0, a: 1, fout: 0.5 }); } }
    // poussiere : etoiles filantes (espace), braises (rentree), brume (nuages), pollen (campagne), terre (puits), eclats violets (geode), braises (manteau)
    if (L.dust && L.started) { const P = L.dust.geometry.attributes.position, F = PA.fr(L.s), n = P.count, D = L.dust.material;
      const col = s < 640 ? '#cfe8ff' : s < 1120 ? '#ffb05a' : s < 1680 ? '#ffffff' : s < 2657 ? '#f4f0c0' : s < 3587 ? '#c89a6a' : s < 4327 ? '#d0a8ff' : '#ff8a3a'; D.color.set(col); D.opacity = Math.max(s < 640 ? 0.4 : s > 1120 && s < 2657 ? 0.3 : 0.6, 0.7 * L.bk); D.size = 0.5 + 0.7 * L.bk;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); if (!L.dustInit || _b.subVectors(_a, rk.pos).dot(F.t) < -10 || _b.length() > 200) { _a.copy(rk.pos).addScaledVector(F.t, L.dustInit ? rr(100, 190) : rr(-10, 190)).addScaledVector(F.r, rr(-50, 50)).addScaledVector(F.u, rr(-40, 40)); P.setXYZ(i, _a.x, _a.y, _a.z); } }
      L.dustInit = true; P.needsUpdate = true; }
  };
})();
