/* v423 : NIVEAU 5 « PLONGEE VERS LE NOYAU » (?lv=5) — meme mecanique de voie 3D que le niveau 4 (s = distance sur la voie, x, y = ecart dans la section).
 * On part ARRIME a une station en orbite (la Terre sous nous), on plonge, on rentre dans l'atmosphere en boule de feu, on traverse l'ORAGE (helicopteres,
 * eclairs), on rase la BANQUISE d'une base arctique et on s'enfonce dans le puits de forage : tunnels de GLACE, caverne des CRISTAUX, LAC souterrain,
 * BASE ENTERREE (portes blindees), le MANTEAU (veines de roche tendre a forer, colonnes de magma) et le NOYAU, ou nous attend le TUNNELIER.
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
  for (let i = 0; i < 4; i++) CC.Skins.byId['evoD' + i] = { id: 'evoD' + i, name: 'evoD' + i, short: 'evoD' + i, tier: 'base', price: 0, tierLabel: '', c: { body: '#8a9098', nose: '#c8ccd2', tip: '#e8b020', band: '#1c1f24', fin: '#1c1f24', nozzle: '#4a4f58' }, flame: ['#ffd27a', '#ffc23a', '#ff8a3a', '#7af0ff'][i], build: 'drill', stage: i, dims: { r: 0.1, len: 1, noseLen: 0.3, noseR: 0.02, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, parts: [] };
  { const _ob = EVO.ownBody; EVO.ownBody = () => _ob() || isS5(); }
  { const _as = EVO.applySkin; EVO.applySkin = (g) => { if (!isS5()) return _as(g); const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoD' + r.tier)); EVO.attachParts(g); }; }
  { const RK5 = ['POINTE DE FORAGE', 'FOREUSE A VIS', 'TORPILLE THERMIQUE', 'FOREUSE A PLASMA'], _rk = EVO.rocket; EVO.rocket = (n) => { const r = _rk(n); if (isS5()) r.name = RK5[r.tier]; return r; }; }
  // meme courbe que le niveau 4 (v422) : la pointe de depart s'eteint pendant le plongeon, chaque palier donne un gros bond
  EVO.fuel5 = (rk, la) => 8 + 1.4 * rk + 0.9 * la + [0, 4, 13, 38][Math.min(3, Math.floor(rk / 5))];
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); if (!isS5() || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket, f = EVO.fuel5(S.rk || 0, S.la || 0); rk.fuelMax = f * 1.15; rk.fuel = (g.evoAimLast && g.evoAimLast.zone === 'gold') ? f * 1.15 : f; }; }
  { const _dp = EVO.distPay; EVO.distPay = (g, dist) => (isS5() ? (0.15 / (8450 / 6910)) * (1 + 2 * Math.min(1, dist / 6600)) : _dp ? _dp(g, dist) : 1); }
  let L = null;
  EVO.noKill = (g) => on5(g);   // la voie descend a 2 km sous le sol du niveau 1 : pas de « chute » hors du monde

  // ============================== LA VOIE 3D ==============================
  // points de controle dans le repere du depart : [droite, haut, avant] (m). On part a l'horizontale (arrime), on pique, on plonge, on se pose sur la banquise, on creuse.
  const CP = [[0, 0, 0], [0, 0, 120], [0, -5, 250], [0, -40, 400], [0, -140, 520], [0, -300, 600], [10, -520, 650], [20, -760, 710], [30, -1000, 790], [50, -1180, 900], [30, -1320, 1050], [-20, -1400, 1230],
    [-40, -1440, 1420], [-30, -1452, 1620], [0, -1455, 1800], [10, -1490, 1930], [10, -1560, 2020], [-30, -1620, 2150], [-80, -1660, 2300], [-100, -1690, 2460], [-90, -1710, 2640], [-40, -1725, 2840], [0, -1735, 3020],
    [30, -1760, 3180], [40, -1762, 3340], [30, -1762, 3500], [20, -1790, 3620], [20, -1860, 3720], [20, -1920, 3860], [10, -1940, 4040], [-30, -1990, 4200], [-90, -2060, 4340], [-100, -2140, 4490], [-50, -2210, 4620],
    [0, -2270, 4740], [0, -2285, 4950], [0, -2285, 5250], [0, -2280, 5600]];
  const ICE_Y = -1468, LAKE_Y = -1772;   // hauteur de la banquise et du lac (repere du depart)

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
  const tubeMat = () => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uZ: { value: null }, uLen: { value: 6000 }, uC2: { value: new T3.Color('#ffffff') }, uK: { value: 1 }, uFar: { value: 1e5 } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform sampler2D uZ; uniform float uLen; uniform vec3 uC2; uniform float uK; uniform float uFar; varying vec3 vN; varying vec3 vW; varying vec2 vUv;',
      'void main(){',
      '  vec4 zc = texture2D(uZ, vec2(clamp(vUv.x / uLen, 0.0, 1.0), 0.5)); vec3 uC = zc.rgb; float bo = zc.a;',
      '  vec3 Vd = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(normalize(vN), Vd)); float fr = pow(f, 3.0);',
      '  float s = vUv.x, a = vUv.y; float gA = abs(fract(a * 24.0) - 0.5), gS = abs(fract(s / 9.0) - 0.5);',
      '  float grid = max(smoothstep(0.455, 0.5, gA), smoothstep(0.47, 0.5, gS));',
      '  float pulse = exp(-pow((fract((s - uT * 75.0) / 150.0) - 0.5) * 16.0, 2.0));',
      '  float hl = exp(-pow((a - 0.18) * 38.0, 2.0)) * 0.55 + exp(-pow((a - 0.31) * 70.0, 2.0)) * 0.3;',
      '  float fl = abs(a - 0.75); float stripe = (1.0 - smoothstep(0.008, 0.016, fl)) * step(0.45, fract(s / 12.0 - uT * 1.6));',
      '  float chev = bo * (1.0 - smoothstep(0.03, 0.09, abs(fract((s - uT * 150.0) / 9.0 + abs(fract(a * 6.0) - 0.5) * 0.7) - 0.5)));',
      '  vec3 col = uC * (0.25 + fr * 1.5) + uC * grid * 0.5 + uC2 * (pulse * 0.6 + hl) + vec3(1.0, 0.78, 0.2) * stripe * 1.4 + vec3(1.0, 0.85, 0.35) * chev * 1.3;',
      '  float al = 0.05 + fr * 0.5 + grid * 0.11 + pulse * 0.08 + hl * 0.35 + stripe * 0.85 + chev * 0.55;',
      '  float fd = 1.0 - smoothstep(uFar * 0.5, uFar, length(cameraPosition - vW));',
      '  gl_FragColor = vec4(col, min(1.0, al) * uK * fd);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, side: T3.DoubleSide, fog: false });
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
  // la base enterree : panneaux d'acier, bandes de danger, feux rouges
  const metalMat = () => new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFar: { value: 500 }, uFog: { value: new T3.Color('#000000') } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform float uFar; uniform vec3 uFog; varying vec2 vUv; varying vec3 vW;',
      'void main(){',
      '  float s = vUv.x, a = vUv.y; float pa = abs(fract(a * 16.0) - 0.5), ps = abs(fract(s / 6.0) - 0.5);',
      '  vec3 col = vec3(0.30, 0.32, 0.35) + 0.05 * step(0.5, fract(floor(a * 16.0) * 0.5 + floor(s / 6.0) * 0.5));',
      '  col *= 1.0 - 0.55 * max(smoothstep(0.46, 0.5, pa), smoothstep(0.46, 0.5, ps));',
      '  float hz = step(abs(a - 0.75), 0.03) * step(0.5, fract((s + a * 40.0) / 3.0)); col = mix(col, vec3(0.95, 0.75, 0.1), hz);',
      '  float lt = exp(-pow((fract(s / 24.0) - 0.5) * 30.0, 2.0)) * step(abs(fract(a * 4.0 + 0.125) - 0.5), 0.06); col += vec3(1.0, 0.15, 0.1) * lt * (0.6 + 0.4 * sin(uT * 6.0));',
      '  float side = exp(-pow((a - 0.25) * 60.0, 2.0)); col += vec3(0.9, 0.95, 1.0) * side * 0.6;',
      '  col = mix(col, uFog, smoothstep(uFar * 0.35, uFar, length(cameraPosition - vW)));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'].join('\n'), side: T3.DoubleSide });
  // le coeur de la Terre : metal en fusion qui coule (interieur d'une sphere)
  const coreMat = () => new T3.ShaderMaterial({ uniforms: { uT: { value: 0 } }, side: T3.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT; varying vec3 vP; void main(){ float a = sin(vP.x * 7.0 + uT * 0.6) * sin(vP.y * 9.0 - uT * 0.4) * sin(vP.z * 6.0 + uT * 0.3); float b = sin(vP.y * 30.0 + a * 4.0 + uT * 1.5); vec3 c = mix(vec3(0.45, 0.08, 0.02), vec3(1.0, 0.62, 0.18), smoothstep(-0.3, 0.8, a)); c = mix(c, vec3(1.0, 0.95, 0.75), smoothstep(0.85, 1.0, b) * 0.6); gl_FragColor = vec4(c, 1.0); }' });

  // balaye un cercle le long de la voie ; uv = (distance, angle / 2 pi)
  function sweep(PA, s0, s1, rad, seg, dS) {
    const n = Math.max(2, Math.ceil((s1 - s0) / dS)), pos = [], nor = [], uv = [], idx = [], F = {};
    for (let i = 0; i <= n; i++) { const s = s0 + (s1 - s0) * i / n; PA.fr(s, F);
      for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); _a.copy(F.r).multiplyScalar(c).addScaledVector(F.u, sn);
        pos.push(F.p.x + _a.x * rad, F.p.y + _a.y * rad, F.p.z + _a.z * rad); nor.push(_a.x, _a.y, _a.z); uv.push(s, j / seg); } }
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
  let SHT = null; const shadowTex = () => { if (SHT) return SHT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); SHT = new T3.CanvasTexture(c); return SHT; };
  const blob = (grp, p, rx, rz, rotY) => { const m = new T3.Mesh(new T3.PlaneGeometry(rx * 2, rz * 2), new T3.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: '#2a3a4a' })); m.rotation.set(-Math.PI / 2, 0, rotY || 0); m.position.copy(p); m.position.y += 0.15; m.renderOrder = 1; grp.add(m); return m; };

  // ============================== LE PROGRAMME : [debut, fin, cle, titre, couleur, genre] ==============================
  // genre : pad / tube (verre) / boost (accelerateur, a decouvert) / open / low (on rase un sol) / ice, metal, rock (tunnels opaques)
  const ZN = [[0, 150, 'cpad', 'L ARRIMAGE', '#8fe6ff', 'pad'], [150, 900, 'cplonge', 'LE GRAND PLONGEON', '#8fe6ff', 'tube'], [900, 1560, 'crentree', 'LA RENTREE', '#ff9a3a', 'boost'],
    [1560, 2250, 'corage', 'L ORAGE', '#9ab0d0', 'open'], [2250, 2730, 'cbanquise', 'LA BANQUISE', '#bfe8ff', 'low'], [2730, 3420, 'cglace', 'LA GLACE', '#7ad8ff', 'ice'],
    [3420, 4000, 'ccristal', 'LES CRISTAUX', '#c08aff', 'open'], [4000, 4520, 'clac', 'LE LAC', '#5ad8c8', 'low'], [4520, 5060, 'cbase', 'LA BASE ENTERREE', '#ffd23a', 'metal'],
    [5060, 5700, 'cmanteau', 'LE MANTEAU', '#ff6a2a', 'rock'], [5700, 5880, 'cdescente', 'LA DESCENTE', '#ffc23a', 'boostrock'], [5880, 1e9, 'cnoyau', 'LE NOYAU', '#ff4a3a', 'open']];
  const zoneAt = (s) => { for (let i = ZN.length - 1; i >= 0; i--) if (s >= ZN[i][0]) return i; return 0; };
  const WALLS = [[150, 900], [2730, 3420], [4520, 5060], [5060, 5880]];   // tunnels (paroi proche)
  // l'ambiance le long de la voie : [s, ciel haut, horizon, brume, brume proche, brume loin, lumiere]
  const MOOD = [[0, '#000000', '#04060c', '#020308', 280, 680, 1], [880, '#020308', '#0a1030', '#020308', 280, 680, 1], [1000, '#3a1004', '#ff7a2a', '#7a2a0a', 60, 520, 1.1], [1500, '#4a1a08', '#ff9a4a', '#8a3a14', 60, 520, 1.1],
    [1620, '#0c1016', '#1c242c', '#141a22', 40, 330, 0.45], [2170, '#10161e', '#26303a', '#1c242e', 50, 360, 0.5], [2300, '#2f6cc0', '#b8d4ee', '#c4d8ea', 260, 1700, 1.1], [2700, '#2f6cc0', '#b8d4ee', '#c4d8ea', 260, 1700, 1.1],
    [2790, '#04121c', '#0a2a3a', '#0a2a3a', 30, 420, 0.9], [3400, '#04121c', '#0a2a3a', '#0a2a3a', 30, 420, 0.9], [3480, '#0c0418', '#1e0a34', '#1e0a34', 40, 480, 0.9], [3980, '#0c0418', '#1e0a34', '#1e0a34', 40, 480, 0.9],
    [4060, '#02080a', '#06181c', '#06181c', 30, 420, 0.85], [4500, '#02080a', '#06181c', '#06181c', 30, 420, 0.85], [4580, '#0a0c10', '#14181e', '#14181e', 30, 400, 0.9], [5040, '#0a0c10', '#14181e', '#14181e', 30, 400, 0.9],
    [5120, '#180402', '#3a0c04', '#2a0804', 30, 420, 0.95], [5860, '#180402', '#3a0c04', '#2a0804', 30, 420, 0.95], [5980, '#3a1004', '#ff6a1a', '#5a1806', 60, 700, 1.1], [1e9, '#3a1004', '#ff6a1a', '#5a1806', 60, 700, 1.1]];
  const _c1 = new T3.Color(), _c2 = new T3.Color(), _c3 = new T3.Color(), _c4 = new T3.Color();
  function moodAt(s) { let i = 0; while (i < MOOD.length - 2 && s > MOOD[i + 1][0]) i++; const A = MOOD[i], B = MOOD[i + 1], t = ss(A[0], B[0], s);
    return { top: _c1.set(A[1]).lerp(_c4.set(B[1]), t).clone(), hor: _c2.set(A[2]).lerp(_c4.set(B[2]), t).clone(), fog: _c3.set(A[3]).lerp(_c4.set(B[3]), t).clone(), near: U.lerp(A[4], B[4], t), far: U.lerp(A[5], B[5], t), li: U.lerp(A[6], B[6], t) }; }
  function zoneTex(len) {
    const W = 1024, d = new Uint8Array(W * 4), c = new T3.Color(), c2 = new T3.Color();
    for (let i = 0; i < W; i++) { const s = (i + 0.5) / W * len, zi = zoneAt(s), Z = ZN[zi]; c.set(Z[4]); let bo = /boost/.test(Z[5]) ? 1 : 0;
      if (zi > 0) { const k = U.clamp((s - Z[0]) / 30, 0, 1); if (k < 1) { const P = ZN[zi - 1]; c2.set(P[4]).lerp(c, k); c.copy(c2); bo = (/boost/.test(P[5]) ? 1 : 0) * (1 - k) + bo * k; } }
      d[i * 4] = c.r * 255; d[i * 4 + 1] = c.g * 255; d[i * 4 + 2] = c.b * 255; d[i * 4 + 3] = bo * 255; }
    const t = new T3.DataTexture(d, W, 1, T3.RGBAFormat); t.magFilter = T3.LinearFilter; t.minFilter = T3.LinearFilter; t.needsUpdate = true; return t;
  }
  let HZ = null;
  const hazTex = () => { if (HZ) return HZ; const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#ffd21e'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#16181c'; for (let k = -4; k < 8; k++) { x.beginPath(); x.moveTo(k * 32, 128); x.lineTo(k * 32 + 16, 128); x.lineTo(k * 32 + 144, 0); x.lineTo(k * 32 + 128, 0); x.closePath(); x.fill(); } HZ = new T3.CanvasTexture(c); HZ.wrapS = HZ.wrapT = T3.RepeatWrapping; return HZ; };

  // ============================== LE CIEL : etoiles, la Terre (qui grossit pendant le plongeon), le soleil ==============================
  const noise2 = (seed) => { const G = 64, v = new Float32Array(G * G); let x = seed; for (let i = 0; i < G * G; i++) { x = (x * 16807) % 2147483647; v[i] = x / 2147483647; }
    const at = (i, j) => v[((j % G + G) % G) * G + ((i % G + G) % G)], sm = (t) => t * t * (3 - 2 * t);
    return (u, w) => { let s = 0, a = 0.5, f = 4; for (let o = 0; o < 5; o++) { const x2 = u * f, y2 = w * f, i = Math.floor(x2), j = Math.floor(y2), fx = sm(x2 - i), fy = sm(y2 - j); s += a * (at(i, j) * (1 - fx) * (1 - fy) + at(i + 1, j) * fx * (1 - fy) + at(i, j + 1) * (1 - fx) * fy + at(i + 1, j + 1) * fx * fy); a *= 0.5; f *= 2; } return s; }; };
  let TEX = null;
  function textures() {
    if (TEX) return TEX; const W = 512, H = 256, mk = (w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; };
    const e = mk(), ex = e.getContext('2d'), ei = ex.createImageData(W, H), n1 = noise2(12345), n2 = noise2(777), cl = mk(), cx = cl.getContext('2d'), ci = cx.createImageData(W, H), n3 = noise2(4242);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = i / W, w = j / H, lat = Math.abs(w - 0.5) * 2, h = n1(u * 2, w * 2) + 0.12 * Math.cos(u * 12.57) - 0.08, k = (j * W + i) * 4;
      let r, g, b; if (lat > 0.8) { r = g = b = 238; } else if (h > 0.53) { const dsr = n2(u * 3, w * 3); r = 70 + 40 * dsr; g = 120 + 30 * dsr; b = 60; if (h > 0.66) { r = g = b = 150 + 40 * dsr; } } else { const dp = U.clamp((0.53 - h) * 4, 0, 1); r = 20 + 30 * (1 - dp); g = 70 + 80 * (1 - dp); b = 150 + 60 * (1 - dp); }
      ei.data[k] = r; ei.data[k + 1] = g; ei.data[k + 2] = b; ei.data[k + 3] = 255;
      const c2 = n3(u * 3 + 0.3 * Math.sin(w * 9), w * 5), al = U.clamp((c2 - 0.55) * 3.2, 0, 1); ci.data[k] = ci.data[k + 1] = ci.data[k + 2] = 255; ci.data[k + 3] = al * 220; }
    ex.putImageData(ei, 0, 0); cx.putImageData(ci, 0, 0);
    // la neige : un grain doux, des traces de vent (sastrugis)
    const sn = mk(256, 256), sx = sn.getContext('2d'), si = sx.createImageData(256, 256), n4 = noise2(31);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const v = n4(i / 256 * 2, j / 256 * 6), k = (j * 256 + i) * 4, w = 0.86 + 0.14 * v; si.data[k] = 226 * w; si.data[k + 1] = 236 * w; si.data[k + 2] = 246 * w; si.data[k + 3] = 255; }
    sx.putImageData(si, 0, 0);
    const tx = (c, rep) => { const t = new T3.CanvasTexture(c); if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(rep, rep); } return t; };
    return (TEX = { earth: tx(e), clouds: tx(cl), snow: tx(sn, 40) });
  }
  const RS = 2000;
  function buildSky(g) {
    const sky = new T3.Group(), X = textures(); sky.renderOrder = -10; L.stars = [];
    for (const [n, sz, op] of [[1100, 1.5, 0.8], [160, 2.6, 1]]) { const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr(-0.2, 1), a = rr(0, 6.283), q = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * q * 3000; pos[i * 3 + 1] = u * 3000; pos[i * 3 + 2] = Math.sin(a) * q * 3000; const t = Math.random(); col[i * 3] = 0.8 + 0.2 * t; col[i * 3 + 1] = 0.85 + 0.1 * t; col[i * 3 + 2] = 1; }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ size: sz, sizeAttenuation: false, vertexColors: true, transparent: false, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); p.renderOrder = -10; p.userData.op = op; sky.add(p); L.stars.push(p); }
    const earth = new T3.Group(); sky.add(earth); L.earth = earth;
    const em = new T3.Mesh(new T3.SphereGeometry(RS, 96, 64), new T3.MeshBasicMaterial({ map: X.earth, color: '#c8d4e4', fog: false, depthWrite: false })); em.renderOrder = -9; earth.add(em);
    const cm = new T3.Mesh(new T3.SphereGeometry(RS * 1.006, 96, 64), new T3.MeshBasicMaterial({ map: X.clouds, transparent: true, opacity: 0.9, fog: false, depthWrite: false })); cm.renderOrder = -8; earth.add(cm); L.cloudSphere = cm;
    const atm = new T3.Mesh(new T3.SphereGeometry(RS * 1.04, 64, 48), new T3.ShaderMaterial({ uniforms: { uC: { value: new T3.Color('#5ab0ff') } }, vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uC; varying vec3 vN; varying vec3 vW; void main(){ vec3 V = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(vN, V)); gl_FragColor = vec4(uC, pow(f, 2.2) * 0.9); }', transparent: true, depthWrite: false, side: T3.BackSide, blending: T3.AdditiveBlending, fog: false })); atm.renderOrder = -8; earth.add(atm);
    if (EVO.boss2Kit) { const sun = EVO.boss2Kit.glow(340, '#ffe8c0'); sun.renderOrder = -9; sky.add(sun); L.sun = sun; }
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
    // la catapulte : deux rails, un berceau sous la fusee, des portiques tous les 30 m (on sort par devant)
    for (const x of [-1.6, 1.6]) P.push({ s: [0.3, 0.3, 170], c: GR, p: [x, yb, -70] }, { s: [0.12, 0.08, 170], c: '#ffd23a', p: [x, yb + 0.19, -70] });
    P.push({ s: [1.4, 0.3, 2.2], c: '#3a3e46', p: [0, yb + 0.1, 0] }); for (let z = -4; z > -160; z -= 6) P.push({ s: [4, 0.25, 0.4], c: GR, p: [0, yb - 0.3, z] });
    for (let k = 1; k < 6; k++) { const z = 10 - k * 30; P.push({ s: [0.8, 14, 0.8], c: WH, p: [-7, yb + 6, z] }, { s: [0.8, 14, 0.8], c: WH, p: [7, yb + 6, z] }, { s: [14.8, 0.9, 0.9], c: WH, p: [0, yb + 13, z] }, { s: [14.8, 0.3, 0.3], c: OR, p: [0, yb + 12.4, z] }); }
    // la station : un long module en travers, des modules habites, un bras robot replie, deux grandes ailes solaires
    P.push({ cyl: [4, 4, 70, 18], c: WH, p: [0, -9, 30], r: [0, 0, Math.PI / 2] }, { cyl: [5, 5, 16, 18], c: '#dfe3e8', p: [-26, -9, 30], r: [Math.PI / 2, 0, 0] }, { cyl: [5, 5, 16, 18], c: '#dfe3e8', p: [26, -9, 30], r: [Math.PI / 2, 0, 0] });
    P.push({ cyl: [3, 3, 30, 14], c: '#dfe3e8', p: [0, -9, 46], r: [Math.PI / 2, 0, 0] }, { s: [1.2, 1.2, 20], c: GR, p: [12, 2, 18], r: [0.6, 0, 0] }, { s: [1, 1, 14], c: GR, p: [12, 9, 6], r: [-0.4, 0, 0] });
    for (const x of [-46, 46]) { P.push({ s: [2, 2, 8], c: GR, p: [x * 0.83, -9, 30] }); }
    root.add(bakeBox(P));
    const pm = lam('#1e3a8a', { emissive: '#0a1a50' }), frm = lam('#cfd4da');
    for (const x of [-60, 60]) { const w = new T3.Group(); w.position.set(x, -9, 30); root.add(w); for (const z of [-9, 9]) { const p = new T3.Mesh(new T3.BoxGeometry(34, 0.3, 14), pm); p.position.z = z; w.add(p); for (let k = 0; k < 5; k++) { const l = new T3.Mesh(new T3.BoxGeometry(0.2, 0.4, 14.2), frm); l.position.set(-14 + k * 7, 0, z); w.add(l); } } (L.wings = L.wings || []).push(w); }
    // feux de piste le long de la catapulte (ils s'allument en sequence au lancement)
    L.runway = []; for (let k = 0; k < 16; k++) for (const x of [-2.6, 2.6]) { const l = new T3.Mesh(new T3.SphereGeometry(0.28, 8, 6), bas('#7af0ff', { fog: false })); l.position.set(x, yb + 0.35, -4 - k * 9.5); root.add(l); L.runway.push(l); }
    // quelques satellites autour, loin
    for (let k = 0; k < 6; k++) { const s = satellite(rr(1, 2)), a = rr(0, 6.28); s.position.set(Math.cos(a) * rr(120, 260), rr(-60, 80), -rr(0, 700)); s.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6)); root.add(s); const w = rr(0.05, 0.2); EVO.addDyn(s, (t, dt) => s.rotateY(w * dt), [], { near: 1e5 }); }
    L.dock = root;
  }

  // ============================== LES DECORS SOUS LA BANQUISE ET AU-DESSUS ==============================
  function stormClouds(PA, grp) {   // l'orage : de lourds nuages sombres de chaque cote (la voie passe entre eux)
    const n = 150, im = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 1), lam('#262c34', { emissive: '#080a0e', flatShading: true }), n), o = new T3.Object3D();
    for (let i = 0; i < n; i++) { const s = rr(1500, 2280), F = PA.fr(s), a = rr(0, 6.28), d = rr(48, 260), sc = rr(18, 46); o.position.copy(F.p).addScaledVector(F.r, Math.cos(a) * d).addScaledVector(F.u, Math.sin(a) * d * 0.7); o.scale.set(sc * rr(1.3, 2), sc * rr(0.6, 0.9), sc * rr(1.3, 2)); o.rotation.set(0, rr(0, 6), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    im.frustumCulled = false; grp.add(im);
    // la couche de nuages qu'on perce en sortant de l'orage (on voit la banquise dessous)
    const n2 = 90, im2 = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 1), lam('#2e343c', { emissive: '#0a0c10', flatShading: true }), n2), O = PA.fr(2200).p;
    for (let i = 0; i < n2; i++) { let x, z; do { x = rr(-700, 700); z = rr(-700, 700); } while (Math.hypot(x, z) < 50); o.position.set(O.x + x, O.y + rr(10, 30), O.z + z); o.scale.set(rr(30, 60), rr(8, 14), rr(30, 60)); o.rotation.set(0, rr(0, 6), 0); o.updateMatrix(); im2.setMatrixAt(i, o.matrix); }
    im2.frustumCulled = false; grp.add(im2);
  }
  // la BANQUISE : un champ de neige a perte de vue, le trou du puits de forage (on y plonge), la base arctique
  function arctic(g, PA, grp) {
    const X = textures(), iy = PA.O.y + ICE_Y, sH = PA.sBelow(iy, 2400), H = PA.fr(sH).p.clone(); L.holeS = sH;
    const ice = new T3.Mesh(new T3.PlaneGeometry(6000, 6000), new T3.MeshLambertMaterial({ map: X.snow, color: '#ffffff', emissive: '#1a2028' })); ice.rotation.x = -Math.PI / 2; ice.position.set(H.x, iy, H.z);
    ice.material.onBeforeCompile = (sh) => { sh.uniforms.uH0 = { value: H }; sh.uniforms.uHR = { value: R + 3 }; sh.vertexShader = 'varying vec3 vHW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vHW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform vec3 uH0; uniform float uHR; varying vec3 vHW;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (distance(vHW.xz, uH0.xz) < uHR) discard;'); };
    grp.add(ice); L.ice = ice;
    // le bord du trou : un anneau d'acier, des feux, et le DERRICK de forage au-dessus (la voie passe en son milieu)
    { const rim = new T3.Mesh(new T3.TorusGeometry(R + 3.5, 1.6, 10, 48), lam('#4a4f58', { emissive: '#101216' })); rim.rotation.x = Math.PI / 2; rim.position.set(H.x, iy + 0.6, H.z); grp.add(rim);
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, l = new T3.Mesh(new T3.SphereGeometry(0.7, 8, 6), bas(k % 2 ? '#ffb84a' : '#ff3a2a', { fog: false })); l.position.set(H.x + Math.cos(a) * (R + 3.5), iy + 2, H.z + Math.sin(a) * (R + 3.5)); grp.add(l); (L.blinks = L.blinks || []).push(l); }
      const DP = [], hgt = 70, w = 26; for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) DP.push({ s: [1.4, hgt, 1.4], c: '#c8352a', p: [cx * w, hgt / 2, cz * w], r: [cz * 0.12, 0, -cx * 0.12] });
      for (let y = 10; y < hgt; y += 12) { const k = 1 - y / hgt * 0.24; DP.push({ s: [2 * w * k, 0.7, 0.7], c: '#e8ecf0', p: [0, y, -w * k] }, { s: [2 * w * k, 0.7, 0.7], c: '#e8ecf0', p: [0, y, w * k] }, { s: [0.7, 0.7, 2 * w * k], c: '#e8ecf0', p: [-w * k, y, 0] }, { s: [0.7, 0.7, 2 * w * k], c: '#e8ecf0', p: [w * k, y, 0] }); }
      DP.push({ s: [16, 4, 16], c: '#3a3e46', p: [0, hgt + 2, 0] });
      const der = bakeBox(DP); der.position.set(H.x, iy, H.z); grp.add(der); blob(grp, new V(H.x, iy, H.z), 44, 44); }
    // la base arctique de chaque cote de la voie : radomes, hangars, citernes, antennes (chacun avec son ombre)
    const onIce = (s, side, d) => { const F = PA.fr(s); return new V().copy(F.p).addScaledVector(F.r, side * d).setY(iy); };
    for (const [s, sd, d, r] of [[2290, 1, 60, 12], [2380, -1, 80, 16], [2520, 1, 95, 10], [2610, -1, 55, 9]]) { const p = onIce(s, sd, d), o = new T3.Group(); o.position.copy(p); grp.add(o);
      o.add(new T3.Mesh(new T3.CylinderGeometry(r * 0.7, r * 0.8, r * 0.8, 16), lam('#c8ccd2'))); const dm = new T3.Mesh(new T3.SphereGeometry(r, 24, 16), lam('#f4f6f8', { emissive: '#30343a' })); dm.position.y = r * 1.2; o.add(dm); blob(grp, p, r * 1.6, r * 1.6); }
    for (const [s, sd, d] of [[2330, -1, 120], [2470, 1, 140], [2570, -1, 110]]) { const p = onIce(s, sd, d), F = PA.fr(s), hg = bakeBox([{ s: [44, 16, 26], c: '#9aa4ae', p: [0, 8, 0] }, { s: [44.4, 1.2, 26.4], c: '#c8352a', p: [0, 16, 0] }, { s: [20, 12, 0.4], c: '#3a3e46', p: [0, 6, 13.1] }]); hg.position.copy(p); hg.rotation.y = Math.atan2(F.t.x, F.t.z); grp.add(hg); blob(grp, p, 30, 20, -hg.rotation.y); }
    for (const [s, sd, d] of [[2420, 1, 40], [2440, 1, 52], [2660, -1, 46]]) { const p = onIce(s, sd, d), o = bakeBox([{ cyl: [5, 5, 12, 16], c: '#e8e0c8', p: [0, 6, 0] }, { cyl: [5.1, 5.1, 0.8, 16], c: '#c8352a', p: [0, 9, 0] }]); o.position.copy(p); grp.add(o); blob(grp, p, 8, 8); }
    // une piste balisee qui mene au derrick (on sait ou aller)
    for (let s = 2280; s < sH - 30; s += 22) for (const sd of [-1, 1]) { const p = onIce(s, sd, 26), l = new T3.Mesh(new T3.SphereGeometry(0.6, 8, 6), bas('#ff6a3a', { fog: false })); l.position.copy(p).add(_b.set(0, 1.2, 0)); grp.add(l); }
    // la neige qui tombe et le vent : gere dans tick (poussiere blanche)
  }
  // les cavernes (cristaux, lac) : une enorme galerie de roche autour de la voie
  function caverns(PA, grp) {
    L.cMats = [];
    const add = (s0, s1, rad, M) => { const m = new T3.Mesh(sweep(PA, s0, s1, rad, 48, 4), M); m.frustumCulled = false; grp.add(m); L.cMats.push(M); return m; };
    add(2730, 3420, R, caveMat('#0e3a55', '#7cc4e4', '#bff4ff', 0.35, 2, 1));   // la glace
    add(3420, 4000, 62, caveMat('#140a22', '#3a2a50', '#c08aff', 1.0, 3, 0));   // la caverne des cristaux
    add(4000, 4520, 62, caveMat('#061214', '#1e3034', '#5ad8c8', 0.5, 3, 0));   // le lac
    add(5060, 5700, R, caveMat('#140806', '#4a3028', '#ff6a1a', 1.3, 1, 1));   // le manteau
    add(5700, 5880, R, caveMat('#2a0a04', '#6a2a14', '#ffb03a', 1.6, 1, 1));   // la descente
    { const M = metalMat(); L.cMats.push(M); const m = new T3.Mesh(sweep(PA, 4520, 5060, R, 48, 3), M); m.frustumCulled = false; grp.add(m); }
    // l'entree des tunnels : un anneau de roche a chaque bouche
    for (const s of [3420, 4520, 5060]) { const o = placeAt(PA, new T3.Mesh(new T3.TorusGeometry(R + 2, 2.4, 10, 48), lam('#3a3e46', { emissive: s === 4520 ? '#5a4a00' : '#1a0a04' })), s); grp.add(o); }
    // les cristaux plantes dans les parois (decor), en lots
    { const n = 60, im = new T3.InstancedMesh(new T3.CylinderGeometry(0, 1, 1, 6, 1), new T3.MeshLambertMaterial({ color: '#c8a0ff', emissive: '#6a2ab0' }), n), o = new T3.Object3D(), F = {};
      for (let i = 0; i < n; i++) { const s = rr(3440, 3990); PA.fr(s, F); const a = rr(0, 6.28), d = 60; _a.copy(F.r).multiplyScalar(Math.cos(a)).addScaledVector(F.u, Math.sin(a)); o.position.copy(F.p).addScaledVector(_a, d); o.quaternion.setFromUnitVectors(_b.set(0, 1, 0), _c.copy(_a).negate().addScaledVector(F.t, rr(-0.3, 0.3)).normalize()); const h = rr(10, 28); o.scale.set(h * 0.18, h, h * 0.18); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
      im.frustumCulled = false; grp.add(im); }
    // le LAC : une eau noire et calme sous la voie (des reflets qui glissent)
    { const pos = [], idx = [], uv = [], F = {}, n = 140, wy = PA.O.y + LAKE_Y; for (let i = 0; i <= n; i++) { PA.fr(3990 + 540 * i / n, F); for (const sd of [-1, 1]) { pos.push(F.p.x + F.r.x * sd * 60, wy, F.p.z + F.r.z * sd * 60); uv.push(i / n * 30, sd * 0.5 + 0.5); } }
      for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const M = new T3.ShaderMaterial({ uniforms: { uT: { value: 0 } }, side: T3.DoubleSide, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uT; varying vec2 vUv; void main(){ float w = sin(vUv.x * 9.0 + uT * 1.2 + sin(vUv.y * 14.0) * 1.5) * sin(vUv.y * 22.0 - uT * 0.8); vec3 c = vec3(0.01, 0.05, 0.06) + vec3(0.2, 0.8, 0.75) * smoothstep(0.75, 1.0, w) * 0.5; gl_FragColor = vec4(c, 1.0); }' });
      const m = new T3.Mesh(geo, M); m.frustumCulled = false; grp.add(m); L.water = M; }
  }

  // ============================== LES EPREUVES (testees dans la section de la voie : exactes et sans surprise) ==============================
  function obstacles(g, PA, grp) {
    const OB = L.O = [], BX = new T3.BoxGeometry(1, 1, 1), M = { red: lam('#e8322a', { emissive: '#5a0a06' }), dark: lam('#2a2e36'), steel: lam('#8a949e'), door: lam('#3a4048', { emissive: '#0a0c0e' }), lamp: bas('#ff3a2a', { fog: false }),
      haz: new T3.MeshLambertMaterial({ map: hazTex(), side: T3.DoubleSide, emissive: '#3a3000' }), yel: bas('#ffe23a', { fog: false }), grn: bas('#5aff7a', { fog: false }),
      ice: new T3.MeshLambertMaterial({ color: '#bfeaff', emissive: '#1a5a7a', side: T3.DoubleSide, transparent: true, opacity: 0.92 }), rock: new T3.MeshLambertMaterial({ color: '#2e2622', emissive: '#120604', side: T3.DoubleSide }),
      vein: bas('#ffa030', { fog: false, side: T3.DoubleSide }), lava: [bas('#ffb03a', { fog: false }), bas('#ff5a10', { fog: false, transparent: true, opacity: 0.35, blending: T3.AdditiveBlending, depthWrite: false })] };
    const hold = (s) => holder(PA, grp, s);
    // VOLET : un secteur plein ; on passe par le cote ouvert (balise verte)
    const shutter = (s, c, sp, w, mat, noLights) => { const h = hold(s), rot = new T3.Group(); h.add(rot); rot.add(new T3.Mesh(new T3.CircleGeometry(R - 0.3, 48, c - sp / 2, sp), mat || M.haz));
      for (const e of [c - sp / 2, c + sp / 2]) { const b = new T3.Mesh(BX, M.yel); b.scale.set(R - 0.3, 0.5, 0.6); b.position.set(Math.cos(e) * (R - 0.3) / 2, Math.sin(e) * (R - 0.3) / 2, 0); b.rotation.z = e; rot.add(b); }
      if (!noLights) for (let j = 0; j < 7; j++) { const a = c + sp / 2 + (j + 0.5) / 7 * (6.2832 - sp), l = new T3.Mesh(new T3.SphereGeometry(0.55, 8, 6), M.grn); l.position.set(Math.cos(a) * (R - 1.2), Math.sin(a) * (R - 1.2), 0); rot.add(l); }
      OB.push({ s, th: 1.4, kind: 'shutter', hit: (x, y, t) => { const r = Math.hypot(x, y); if (r < 1.6) return true; let d = Math.atan2(y, x) - (c + w * t); d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < sp / 2 + Math.asin(Math.min(1, RK / r)); }, upd: (t) => { rot.rotation.z = w * t; } }); };
    // BARRE qui balaie (jets de magma) : h = monte et descend, v = gauche droite
    const bar = (s, mode, amp, w, ph, lm, kind) => { const h = hold(s), b = new T3.Group(); h.add(b); const core = new T3.Mesh(new T3.CylinderGeometry(0.7, 0.7, 2 * R, 8), lm[0]), gl = new T3.Mesh(new T3.CylinderGeometry(1.6, 1.6, 2 * R, 10, 1, true), lm[1]); b.add(core); b.add(gl);
      if (mode === 'h') b.rotation.z = Math.PI / 2; const pos = (t) => amp * Math.sin(w * t + ph);
      OB.push({ s, th: 1.4, kind: kind || 'magma', hit: (x, y, t) => (mode === 'h' ? Math.abs(y - pos(t)) : Math.abs(x - pos(t))) < 1.0, upd: (t) => { const p = pos(t), ch = Math.sqrt(Math.max(1, R * R - p * p)); if (mode === 'h') b.position.y = p; else b.position.x = p; core.scale.y = gl.scale.y = ch / R; } }); };
    // PISTON (pilier de glace) : un bloc qui sort de la paroi et y rentre
    const piston = (s, a, d0, d1, w, ph, mat) => { const h = hold(s), rt = new T3.Group(); rt.rotation.z = a; h.add(rt); const blk = new T3.Mesh(new T3.CylinderGeometry(3.2, 3.6, 1, 6), mat); blk.rotation.z = Math.PI / 2; rt.add(blk); const dep = (t) => d0 + (d1 - d0) * (0.5 + 0.5 * Math.sin(w * t + ph));
      OB.push({ s, th: 3.6, kind: 'pilier', hit: (x, y, t) => { const al = x * Math.cos(a) + y * Math.sin(a), pp = -x * Math.sin(a) + y * Math.cos(a); return al > R - dep(t) - RK && Math.abs(pp) < 3.4 + RK; }, upd: (t) => { const d = dep(t); blk.scale.set(1, d, 1); blk.position.x = R - d / 2; } }); };
    // ROCHERS en murs (debris en feu pendant la rentree) : une moitie bouchee, l'autre libre
    const AV = []; for (let v = 0; v < 3; v++) { const gm = new T3.IcosahedronGeometry(1, 1), P = gm.attributes.position, q = new V(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i); q.multiplyScalar(1 + 0.22 * Math.sin(q.x * 3.1 + v * 2) * Math.cos(q.y * 2.7 + v) + 0.12 * Math.sin(q.z * 5.3 + v * 3)); P.setXYZ(i, q.x, q.y, q.z); } gm.computeVertexNormals(); AV.push({ gm, list: [] }); }
    const ast = (s, x, y, rad) => { const A = { s, x, y, rad, ph: rr(0, 6), rs: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(), rw: rr(0.4, 1.2), xx: () => x }; AV[Math.floor(Math.random() * 3)].list.push(A); OB.push({ s, th: rad * 0.8 + 0.9, kind: 'debris', hit: (px, py) => Math.hypot(px - x, py - y) < rad * 0.75 + RK }); };
    const half = (s, c, lim) => { const dx = Math.cos(c), dy = Math.sin(c); for (let gx = -lim; gx <= lim; gx += 8.5) for (let gy = -lim; gy <= lim; gy += 8.5) { const x = gx + rr(-1.2, 1.2), y = gy + rr(-1.2, 1.2); if (x * dx + y * dy < 3 || Math.hypot(x, y) > lim + 3) continue; ast(s + rr(-3, 3), x, y, rr(3.2, 4.2)); } };
    // ECLAIR : il previent (fil bleu qui crepite), puis frappe d'un coup a travers la voie ; on s'ecarte de sa ligne
    const bolt = (s, x0, per, ph) => { const h = hold(s), mk = (op, wd) => { const g2 = new T3.Group(); let px = x0, py = 60; for (let k = 0; k < 9; k++) { const ny = py - 14, nx = x0 + rr(-2.2, 2.2), len = Math.hypot(nx - px, ny - py), c = new T3.Mesh(new T3.CylinderGeometry(wd, wd, len, 5), bas('#e8f4ff', { fog: false, transparent: true, opacity: op, blending: T3.AdditiveBlending, depthWrite: false })); c.position.set((px + nx) / 2, (py + ny) / 2, 0); c.rotation.z = Math.atan2(nx - px, ny - py) * -1; g2.add(c); px = nx; py = ny; } h.add(g2); return g2; };
      const warn = mk(0.35, 0.12), strike = mk(1, 0.45); strike.add(glowS(40, '#9ac8ff', 0.6)); const st = (t) => { const u = ((t + ph) % per) / per; return u > 0.82 ? 2 : u > 0.5 ? 1 : 0; };
      OB.push({ s, th: 2, kind: 'bolt', st, hit: (x, y, t) => st(t) === 2 && Math.abs(x - x0) < 1.8 + RK, upd: (t) => { const k = st(t); warn.visible = k === 1 && Math.sin(t * 40) > -0.2; strike.visible = k === 2; } }); };
    // CRISTAL GEANT : un prisme qui traverse la caverne (ligne d'angle a, decalee de d) ; on passe d'un cote ou de l'autre
    const xtal = (s, a, d, w) => { const h = hold(s), m = new T3.Mesh(new T3.CylinderGeometry(w, w, 140, 6), new T3.MeshLambertMaterial({ color: '#8a5ad0', emissive: '#3a1478', transparent: true, opacity: 0.9 })); m.rotation.z = a; m.position.set(Math.cos(a) * d, Math.sin(a) * d, 0); h.add(m); const gl = glowS(30, '#c08aff', 0.5); gl.position.copy(m.position); h.add(gl);
      OB.push({ s, th: w + 0.6, kind: 'xtal', hit: (x, y) => Math.abs(x * Math.cos(a) + y * Math.sin(a) - d) < w * 0.92 + RK }); };
    // STALACTITE : elle pend du plafond jusqu'a la hauteur ty ; on passe dessous (rester bas) ou a cote
    const stal = (s, x0, ty, r) => { const h = hold(s), len = 64 - ty, m = new T3.Mesh(new T3.ConeGeometry(r, len, 8), new T3.MeshLambertMaterial({ color: '#3a4a4e', emissive: '#0a1416' })); m.rotation.x = Math.PI; m.position.set(x0, ty + len / 2, 0); h.add(m); const d = new T3.Mesh(new T3.SphereGeometry(0.35, 6, 4), bas('#7af0e0', { fog: false })); d.position.set(x0, ty - 0.6, 0); h.add(d);
      OB.push({ s, th: r * 0.7 + 0.6, kind: 'stal', hit: (x, y) => y > ty - RK && Math.abs(x - x0) < r * U.clamp((y - ty) / len, 0.15, 1) + RK }); };
    // PORTE BLINDEE : deux battants qui se ferment et s'ouvrent (on passe quand c'est ouvert)
    const door = (s, w, ph, vert) => { const h = hold(s), rot = new T3.Group(); if (!vert) rot.rotation.z = Math.PI / 2; h.add(rot); const P2 = []; for (const sd of [-1, 1]) { const g2 = new T3.Group(); rot.add(g2); const b = new T3.Mesh(BX, M.door); b.scale.set(R, 2 * R, 1.6); b.position.x = sd * R / 2; g2.add(b); const e = new T3.Mesh(BX, M.haz); e.scale.set(1.6, 2 * R, 1.7); e.position.x = sd * 0.8; g2.add(e); for (let j = -2; j <= 2; j++) { const l = new T3.Mesh(new T3.SphereGeometry(0.45, 8, 6), M.lamp); l.position.set(sd * 2.2, j * 3.2, 0.9); g2.add(l); } P2.push([g2, sd]); }
      const fr2 = new T3.Mesh(new T3.TorusGeometry(R - 0.1, 0.9, 8, 48), M.dark); h.add(fr2); const gap = (t) => U.clamp(13 * (0.42 + 0.75 * Math.sin(w * t + ph)), 0, 14);
      OB.push({ s, th: 1.2, kind: 'door', hit: (x, y, t) => Math.abs(vert ? x : y) > gap(t) / 2 - RK, upd: (t) => { const gp = gap(t); for (const [g2, sd] of P2) g2.position.x = sd * gp / 2; } }); };
    // VEINE : un mur de roche dure ; seule la veine orange (roche tendre) se fore : on fonce dedans et ca accelere
    const vein = (s, c, sp, w) => { const h = hold(s), rot = new T3.Group(); h.add(rot); rot.add(new T3.Mesh(new T3.CircleGeometry(R - 0.3, 48, c + sp / 2, 6.2832 - sp), M.rock)); const vm = new T3.Mesh(new T3.CircleGeometry(R - 0.3, 24, c - sp / 2, sp), M.vein); vm.position.z = 0.05; rot.add(vm);
      const gl = glowS(14, '#ff8a2a', 0.8); gl.position.set(Math.cos(c) * R * 0.55, Math.sin(c) * R * 0.55, 0.4); rot.add(gl);
      OB.push({ s, th: 1.4, kind: 'vein', vein: true, vm, rot, hit: (x, y, t) => { const r = Math.hypot(x, y); if (r < 0.8) return false; let d = Math.atan2(y, x) - (c + w * t); d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) > sp / 2 - Math.asin(Math.min(1, RK / Math.max(r, RK))); }, upd: (t) => { rot.rotation.z = w * t; } }); };
    const H = Math.PI / 2;
    // 2. LE GRAND PLONGEON : quatre volets fixes pour apprendre a se decaler, puis deux qui tournent doucement
    [[300, Math.PI], [400, 0], [500, H], [590, -H]].forEach(([s, c]) => shutter(s, c, 2.9, 0)); shutter(720, 0, 2.6, 0.4); shutter(830, H, 2.6, -0.4);
    // 3. LA RENTREE : des debris en feu, une moitie de la voie bouchee a la fois
    { const SD = [Math.PI, 0, H, -H]; let k = 0; for (let s = 1060; s < 1500; s += 110) half(s, SD[k++ % 4], 26); }
    // 4. L'ORAGE : les eclairs frappent la voie (ligne annoncee par un fil bleu)
    [[1640, -6, 3.2, 0], [1720, 7, 3.0, 1.1], [1810, 0, 2.8, 0.5], [1900, -9, 3.0, 2.0], [1990, 5, 2.6, 0.2], [2080, -3, 2.8, 1.6], [2160, 9, 3.0, 0.9]].forEach((q) => bolt(...q));
    // 5. LA BANQUISE : deux grands mats d'antennes plantes dans la glace montent jusqu'a la voie
    for (const [s, x0] of [[2340, -7], [2460, 8], [2560, -2]]) { const h = hold(s), F = PA.fr(s), gy = PA.O.y + ICE_Y - F.p.y, ht = 30 - gy;
      h.add(bakeBox([{ s: [2.2, ht, 2.2], c: '#c8ccd2', p: [x0, gy + ht / 2, 0] }, { s: [2.4, 1, 2.4], c: '#e8322a', p: [x0, 2, 0] }, { s: [2.4, 1, 2.4], c: '#e8322a', p: [x0, -6, 0] }, { s: [10, 0.6, 0.6], c: '#c8ccd2', p: [x0, 5, 0] }]));
      blob(grp, _a.copy(F.p).addScaledVector(F.r, x0).setY(PA.O.y + ICE_Y), 5, 5);
      OB.push({ s, th: 1.2 + RK, kind: 'mat', hit: (x, y) => (Math.abs(x - x0) < 1.1 + RK && y < 14) || (Math.abs(y - 5) < 0.3 + RK && Math.abs(x - x0) < 5) }); }
    // 6. LA GLACE : des dents de glace (volets) et des piliers qui sortent des parois
    shutter(2860, Math.PI, 2.8, 0, M.ice, true); piston(2960, H, 3, 11, 1.1, 0, M.ice); piston(3040, -H + 0.6, 3, 11, 1.0, 1.4, M.ice); shutter(3130, 0, 2.6, 0.35, M.ice, true); piston(3220, Math.PI, 3, 12, 1.2, 0.5, M.ice); piston(3230, 0, 3, 12, 1.2, 2.1, M.ice); shutter(3330, H, 2.6, -0.4, M.ice, true);
    // 7. LES CRISTAUX : de grands prismes en travers de la caverne
    [[3520, 0.3, -6, 2.4], [3600, 1.9, 7, 2.4], [3680, -0.6, 0, 2.2], [3760, 1.2, -8, 2.6], [3830, 2.6, 5, 2.4], [3910, 0.9, 9, 2.4], [3915, 0.9, -9, 2.4]].forEach((q) => xtal(...q));
    // 8. LE LAC : des stalactites ; il faut rester bas, au ras de l'eau
    [[4110, -6, 4, 4], [4150, 8, 2, 4.5], [4200, 0, 0, 5], [4260, -10, 1, 4], [4300, 5, -1, 5], [4350, -3, -2, 5], [4400, 9, 0, 4], [4450, -8, -1, 4.5]].forEach((q) => stal(...q));
    // 9. LA BASE ENTERREE : des portes blindees qui claquent
    door(4620, 1.1, 0, true); door(4720, 1.2, 1.2, false); door(4820, 1.3, 2.4, true); door(4900, 1.25, 0.6, false); door(4990, 1.4, 1.8, true);
    // 10. LE MANTEAU : des veines a forer et des jets de magma
    vein(5140, Math.PI, 1.6, 0); bar(5220, 'h', 10, 0.9, 0, M.lava); vein(5300, 0.4, 1.4, 0.3); bar(5380, 'v', 10, 1.0, 1, M.lava); vein(5460, -H, 1.3, -0.35); bar(5540, 'h', 10, 1.1, 2, M.lava); vein(5620, 2.4, 1.2, 0.45);
    // les debris : un lot par forme (materiau brulant)
    const hotM = new T3.MeshLambertMaterial({ color: '#4a3020', emissive: '#c84a10', flatShading: true });
    for (const A of AV) { const im = new T3.InstancedMesh(A.gm, hotM, Math.max(1, A.list.length)); im.count = A.list.length; im.frustumCulled = false; grp.add(im); A.im = im; }
    L.AV = AV; L.OB = OB;
    // les anneaux d'acceleration (pendant la rentree et la descente)
    L.boostR = []; const RG = new T3.TorusGeometry(4.4, 0.45, 8, 32), RM = bas('#ffc23a', { fog: false });
    for (const [s, x, y] of [[980, 0, 5], [1100, 6, -4], [1320, -6, 3], [5730, 0, 0], [5810, 4, -3]]) { const h = hold(s), m = new T3.Group(); m.position.set(x, y, 0); h.add(m); m.add(new T3.Mesh(RG, RM)); m.add(glowS(14, '#ffb020', 0.5)); L.boostR.push({ s, x, y, m, done: false }); }
    // l'arche d'ARRIVEE
    { const s = PA.len - 70, h = hold(s), n = 28, im = new T3.InstancedMesh(new T3.BoxGeometry(4.4, 2.2, 2.2), lam('#ffffff', { emissive: '#444444' }), n * 2), o = new T3.Object3D(), c = new T3.Color();
      for (let i = 0; i < n * 2; i++) { const a = (i % n) / n * Math.PI * 2, r2 = 26 + (i >= n ? 2.2 : 0); o.position.set(Math.cos(a) * r2, Math.sin(a) * r2, 0); o.rotation.set(0, 0, a + Math.PI / 2); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(((i % n) + (i >= n ? 1 : 0)) % 2 ? '#16181c' : '#ffffff')); }
      h.add(im); const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#ffd21e'; x.font = '900 96px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ARRIVEE', 256, 66);
      const sp = new T3.Mesh(new T3.PlaneGeometry(36, 9), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(cv), transparent: true, fog: false, side: T3.DoubleSide })); sp.position.y = 34; h.add(sp); }
  }

  // ============================== LES ENNEMIS : helicopteres (orage, banquise), drones-cibles, tourelles ==============================
  function droneMesh(big) {
    const g = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(big ? 2.2 : 1.5, 16, 12), lam('#2a2e36', { emissive: '#0c0e12' })); body.scale.y = 0.62; g.add(body);
    const eye = new T3.Mesh(new T3.SphereGeometry(big ? 0.95 : 0.7, 12, 8), bas('#ff2a1a', { fog: false })); eye.position.z = big ? 1.7 : 1.2; g.add(eye); { const gw = glowS(big ? 7 : 5, '#ff3020', 0.8); gw.position.copy(eye.position); g.add(gw); }
    const lt = []; for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.785, arm = new T3.Mesh(new T3.BoxGeometry(big ? 3.2 : 2.4, 0.3, 0.5), lam('#5a606a')); arm.position.set(Math.cos(a) * (big ? 2.4 : 1.8), Math.sin(a) * (big ? 1.6 : 1.2), 0); arm.rotation.z = a; g.add(arm);
      const l = new T3.Mesh(new T3.SphereGeometry(0.35, 8, 6), bas('#ff5a3a', { fog: false })); l.position.set(Math.cos(a) * (big ? 4 : 3), Math.sin(a) * (big ? 2.6 : 2), 0); g.add(l); lt.push(l); }
    g.userData.lt = lt; return g;
  }
  // l'helicoptere de combat (modele du jeu), avec la cible rouge a percuter
  function heliMesh() {
    const o = new T3.Group(), h = CC.Models.helicopter(true); h.scale.setScalar(0.62); h.rotation.y = Math.PI; o.add(h);   // le nez vers la fusee
    const tg = new T3.Mesh(new T3.TorusGeometry(3.8, 0.2, 6, 40), bas('#ff3a2a', { fog: false })); tg.position.z = 2; o.add(tg);
    o.userData = { rotor: h.userData.rotor, tail: h.userData.tailRotor, tg, lt: [], heli: true }; return o;
  }
  function enemies(g, PA, grp) {
    L.sent = []; L.chase = []; L.bul = [];
    const sent = (s, x, y, kind) => { const m = kind === 'heli' ? heliMesh() : droneMesh(kind === 'big'); if (kind === 'small') m.scale.setScalar(0.72); grp.add(m); L.sent.push({ s, x, y, m, alive: true, fT: rr(0.8, 2), ph: rr(0, 6), small: kind === 'small', heli: kind === 'heli' }); };
    // l'orage et la banquise : des helicopteres en vol stationnaire (on fonce dedans)
    for (const s of [1680, 1860, 2040, 2200, 2400, 2520, 2640]) { const a = rr(0, 6.28), r = rr(5, 12); sent(s, Math.cos(a) * r, s > 2250 ? rr(-2, 8) : Math.sin(a) * r, 'heli'); }
    // le plongeon, la glace, la base, le manteau : de petits drones-cibles dans le tunnel
    for (const [a, b] of [[220, 880], [2780, 3400], [4540, 5040], [5080, 5680]]) for (let s = a; s < b; s += rr(46, 64)) { if (L.O.some((o) => Math.abs(o.s - s) < 22)) continue; const an = rr(0, 6.28), r = rr(0, 8); sent(s, Math.cos(an) * r, Math.sin(an) * r, 'small'); }
    // les cavernes : de grosses sentinelles
    for (const s of [3470, 3640, 3870, 4060, 4230, 4480]) { const a = rr(0, 6.28), r = rr(6, 14); sent(s, Math.cos(a) * r, s > 4000 ? rr(-6, -2) : Math.sin(a) * r, 'big'); }
    // les chasseurs : deux helicopteres qui filent devant et tirent (orage), deux drones (cristaux)
    for (const [a, b, n, k2] of [[1600, 2220, 2, 'heli'], [3460, 3980, 2, 'drone']]) for (let k = 0; k < n; k++) { const m = k2 === 'heli' ? heliMesh() : droneMesh(false); m.visible = false; grp.add(m); L.chase.push({ a, b, k, n, m, ds: 260, fT: 1 + k * 0.6, ph: k * 2.1, on: false }); }
    const mBody = new T3.CylinderGeometry(0.22, 0.22, 2.2, 10).rotateX(Math.PI / 2), mNose = new T3.ConeGeometry(0.22, 0.7, 10).rotateX(Math.PI / 2).translate(0, 0, 1.45), mFin = new T3.BoxGeometry(0.9, 0.05, 0.5), mFl = new T3.ConeGeometry(0.2, 1.4, 8, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -1.8);
    const mW = lam('#eceef2', { emissive: '#3a3a3a' }), mR = lam('#e8322a', { emissive: '#5a0a06' }), mD = lam('#2a2e36'), mF = bas('#ffb04a', { transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 24; i++) { const m = new T3.Group(), body = new T3.Group(); m.add(body); body.add(new T3.Mesh(mBody, mW)); body.add(new T3.Mesh(mNose, mR)); for (let k = 0; k < 2; k++) { const f = new T3.Mesh(mFin, mD); f.position.z = -0.85; f.rotation.z = k * Math.PI / 2; body.add(f); } body.add(new T3.Mesh(mFl, mF));
      m.visible = false; grp.add(m); L.bul.push({ m, body, on: false, s: 0, x: 0, y: 0, vs: 0, vx: 0, vy: 0, t: 0, smT: 0 }); }
  }
  // un tir n'est PAS precis (il siffle a cote) ; une fois sur cinq seulement il vise juste ; jamais mortel
  const fire = (g, s, x, y) => { const b = L.bul.find((q) => !q.on); if (!b) return; const vs = -18, tau = Math.max(0.6, (s - L.s) / Math.max(20, L.v - vs)), a = rr(0, 6.28), off = Math.random() < 0.2 ? rr(0.6, 1.6) : rr(2.6, 5);
    Object.assign(b, { on: true, s, x, y, vs, vx: (L.x + Math.cos(a) * off - x) / tau, vy: (L.y + Math.sin(a) * off - y) / tau, t: 0, smT: 0 }); b.m.visible = true; g.audio.play('whoosh'); };
  const missileHit = (g, rk) => { L.v *= 0.75; L.inv = 0.6; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); g.audio.play('boomSmall', rk.pos); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.2; g.flashColor = '#ffb070'; (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' }); };
  function play(g, rk, dt, s0) {
    const PA = L.PA, t = L.t;
    for (const d of L.sent) { if (!d.alive) continue; const ds = d.s - L.s;
      if (ds > (d.small ? 50 : 40) && ds < (d.small ? 150 : 220)) { d.fT -= dt; if (d.fT <= 0) { d.fT = d.small ? 2.8 : d.heli ? 1.6 : 1.9; fire(g, d.s, d.x, d.y); } }
      if (d.s >= s0 - 2 && d.s <= L.s + 2.5 && Math.hypot(L.x - d.x, L.y - d.y) < (d.small ? 3.6 : d.heli ? 4.8 : 4.4)) { d.alive = false; d.m.visible = false; const p = d.m.position.clone(); g.effects.explosion(p, null, false, 'orange'); if (d.heli) { g.effects.explosion(p.clone().add(_b.set(0, 2, 0)), null, false, 'orange'); g.audio.play('boom'); } g.audio.play('target'); g.rig.shake = Math.max(g.rig.shake, d.heli ? 1 : 0.7); g.flash = 0.2; g.flashColor = '#ffb070';
        const ev = g.evo, S = EVO.save(g), c = Math.round((d.small ? 90 : d.heli ? 260 : 200) * EVO.mult(S.cm) * (EVO.COIN_K || 1)); if (ev) { ev.kills++; ev.coins += c; } if (rk.fuel > 0) rk.fuel = Math.min(rk.fuelMax, rk.fuel + (d.small ? 0.3 : 0.8));
        (g.killPops = g.killPops || []).push({ p: p.clone(), t0: performance.now(), txt: '+' + c }); } }
    // les consignes, la premiere fois
    { const HINT = { shutter: 'PASSE PAR LE COTE OUVERT', debris: 'PASSE DU COTE LIBRE', bolt: 'ECLAIR : ECARTE-TOI DU FIL BLEU', mat: 'EVITE LES ANTENNES', pilier: 'EVITE LES PILIERS DE GLACE', xtal: 'PASSE A COTE DES CRISTAUX', stal: 'RESTE BAS, SOUS LES STALACTITES', door: 'PASSE QUAND LA PORTE S OUVRE', vein: 'FORE LA VEINE ORANGE !', magma: 'EVITE LE MAGMA' }; L.seen = L.seen || {};
      if (!L.hintT || L.t > L.hintT) { for (const o of L.O) { const ds = o.s - L.s; if (ds > 60 && ds < 170 && HINT[o.kind] && !L.seen[o.kind]) { L.seen[o.kind] = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, HINT[o.kind], 2.2, o.kind === 'vein' ? '#ffb03a' : '#ffffff'); break; } }
        if (!L.seen.drone) { const d = L.sent.find((q) => q.alive && q.s - L.s > 50 && q.s - L.s < 200); if (d) { L.seen.drone = 1; L.hintT = L.t + 2.4; if (CC.L1) CC.L1.msg(g, d.heli ? 'HELICOPTERE : FONCE DEDANS !' : 'CIBLE ROUGE : FONCE DEDANS !', 2.4, '#ff6a5a'); } } } }
    // les veines forees : un boost, des eclats de roche ; les eclairs : un flash
    for (const o of L.O) { if (o.vein && !o.done && o.s > s0 - 1 && o.s <= L.s + 1) { o.done = true; o.vm.visible = false; L.boostT = 1.8; const p = rk.pos.clone().addScaledVector(rk.fwd, 2); for (let k = 0; k < 3; k++) g.effects.explosion(p.clone().add(_b.set(rr(-2, 2), rr(-2, 2), rr(-2, 2))), null, false, 'orange'); g.audio.play('boostOn'); g.audio.play('boomSmall', p); g.rig.shake = Math.max(g.rig.shake, 0.9); if (g.feed) g.feed('FORE !', '#ffb03a'); }
      if (o.kind === 'bolt' && Math.abs(o.s - L.s) < 260) { const k = o.st(t); if (k === 2 && o.last !== 2) { g.flash = Math.max(g.flash || 0, 0.25); g.flashColor = '#dfe8ff'; g.audio.play('boomSmall'); } o.last = k; } }
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
    for (const d of L.sent) if (d.alive && Math.abs(d.s - L.s) < 700) { placeAt(PA, d.m, d.s, d.x, d.y + Math.sin(t * 1.4 + d.ph) * 0.8); const U2 = d.m.userData; if (U2.heli) { d.m.rotateZ(Math.sin(t * 0.9 + d.ph) * 0.12); if (U2.rotor) U2.rotor.rotation.y += dt * 28; if (U2.tail) U2.tail.rotation.x += dt * 40; U2.tg.scale.setScalar(1 + 0.12 * Math.sin(t * 6)); } else { d.m.rotateZ(Math.sin(t * 0.8 + d.ph) * 0.3); for (const l of U2.lt) l.visible = Math.sin(t * 8 + d.ph) > 0; } }
    for (const c of L.chase) if (c.on) { placeAt(PA, c.m, L.s + c.ds, c.x, c.y); const U2 = c.m.userData; if (U2.heli) { if (U2.rotor) U2.rotor.rotation.y += dt * 28; c.m.rotateZ(Math.sin(t * 1.1 + c.ph) * 0.25); } else c.m.rotateZ(Math.sin(t * 1.2 + c.ph) * 0.5); }
    for (const b of L.bul) if (b.on) { placeAt(PA, b.m, b.s, b.x, b.y); b.body.quaternion.setFromUnitVectors(_zA, _d.set(b.vx, b.vy, -b.vs).normalize()); b.body.rotateZ(L.t * 6); }
    for (const B of L.boostR) B.m.rotation.z = t * 1.5;
  }

  // ============================== LE NOYAU ET LE BOSS : LE TUNNELIER (3 coups dans la cible au centre de sa tete de coupe) ==============================
  function coreWorld(PA, grp) {
    const sC = 6250, C = PA.fr(sC).p.clone(), ch = new T3.Mesh(new T3.SphereGeometry(420, 64, 40), coreMat()); ch.position.copy(C); grp.add(ch); L.core = ch;
    const gl = glowS(420, '#ff8a2a', 0.45); gl.position.copy(C); grp.add(gl);
    // la bouche du noyau : un grand anneau incandescent ; quelques anneaux de metal qui tournent autour de la voie
    L.coreRings = []; for (const [s, r] of [[5900, 30], [6150, 54], [6400, 40]]) { const o = placeAt(PA, new T3.Mesh(new T3.TorusGeometry(r, 1.8, 10, 64), lam('#3a3e46', { emissive: '#ff5a1a' })), s); grp.add(o); L.coreRings.push(o); }
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
      const sp = new T3.Sprite(new T3.SpriteMaterial({ map: new T3.CanvasTexture(cv), transparent: true, fog: false, depthTest: false })); sp.scale.set(26, 9.75, 1); sp.position.set(0, 18, 0); sp.renderOrder = 20; m.add(sp); }
    m.visible = false; grp.add(m);
    L.boss = { m, tg, head, s: 6120, sT: 6120, x: 0, y: 0, hp: 3, on: false, dead: false, deadT: 0, hitT: 0, fT: 2, cap: PA.len - 300, boomT: 0 };
  }
  function bossPlay(g, rk, dt) {
    const B = L.boss; if (!B || (B.dead && B.deadT > 3)) return;
    if (!B.on && L.s > 5880 - 200) { B.on = true; B.m.visible = true; if (CC.L1) CC.L1.msg(g, 'BOSS : FONCE DANS LA CIBLE DU TUNNELIER (3 COUPS)', 3, '#ff5a3a'); g.audio.play('robotAlarm'); }
    if (!B.on) return; const t = L.t;
    if (B.dead) { B.deadT += dt; B.boomT -= dt; if (B.boomT <= 0 && B.deadT < 2.4) { B.boomT = 0.18; const p = B.m.position.clone().add(new V(rr(-8, 8), rr(-6, 6), rr(-20, 20))); g.effects.explosion(p, null, false, 'orange'); g.audio.play('boomSmall', p); }
      if (B.deadT > 2.4 && B.m.visible) { B.m.visible = false; g.flash = 0.6; g.flashColor = '#ffd8a0'; g.audio.play('boom'); g.rig.shake = 1.4; for (let k = 0; k < 6; k++) g.effects.explosion(B.m.position.clone().add(new V(rr(-10, 10), rr(-6, 6), rr(-20, 20))), null, false, 'orange'); } return; }
    B.hitT -= dt; B.s += (B.sT - B.s) * Math.min(1, dt * (B.hitT > 0 ? 2.5 : 1.2)); B.x = 6 * Math.sin(t * 0.45); B.y = 4 * Math.sin(t * 0.6);
    const capped = B.sT >= B.cap - 1, ds = B.s - L.s, ph = 3 - B.hp;
    if (ds > 45 && ds < 280) { B.fT -= dt; if (B.fT <= 0) { B.fT = [1.6, 1.25, 0.95][ph]; fire(g, B.s - 24, B.x + 9, B.y); if (ph >= 1) fire(g, B.s - 24, B.x - 9, B.y); if (ph >= 2) fire(g, B.s - 24, B.x, B.y + 9); } }
    if (B.hitT <= 0 && L.s > B.s - 24 && L.s < B.s + 30 && (capped || Math.hypot(L.x - B.x, L.y - B.y) < 11.5 + RK)) {
      B.hp = capped ? 0 : B.hp - 1; B.hitT = 1.6; L.inv = 1.2; L.v *= 0.6; g.rig.shake = 1.2; g.flash = 0.35; g.flashColor = '#ffffff'; g.effects.explosion(rk.pos.clone(), null, false, 'orange'); g.audio.play('reactorHit'); g.audio.play('boom');
      if (EVO.onBossHit) EVO.onBossHit(g, null); rk.fuel = Math.min(rk.fuelMax, rk.fuel + 6);
      if (B.hp <= 0) { B.dead = true; B.deadT = 0; if (CC.L1) CC.L1.msg(g, 'TUNNELIER DETRUIT !', 3, '#ffe9a0'); g.audio.play('victory'); }
      else { B.sT = Math.min(B.cap, L.s + 300); if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 2, '#ff9a5a'); }
      (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 3, 0)), t0: performance.now(), txt: B.hp > 0 ? '-1' : 'BOUM !' }); return; }
    if (L.s > B.s + 30 && !capped) { B.sT = Math.min(B.cap, L.s + 240); B.s = Math.max(B.s, L.s + 110); if (CC.L1) CC.L1.msg(g, 'IL REVIENT !  FONCE DEDANS', 1.6, '#ff6a5a'); }
  }
  function bossAnim(g, dt) { const B = L.boss; if (!B || !B.on || !B.m.visible) return; if (!B.dead) { placeAt(L.PA, B.m, B.s, B.x, B.y); B.head.rotation.z += dt * (1.2 + (3 - B.hp) * 0.6); } else { B.m.position.y -= dt * 4; B.m.rotateZ(dt * 0.4); } B.tg.scale.setScalar(1 + 0.08 * Math.sin(L.t * 5)); B.tg.visible = !B.dead; }

  // ============================== LA FICHE DU NIVEAU 5 ==============================
  const CH5 = ZN.map((z) => [z[3], z[0], z[2]]);
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 5) || g.evoPreview) return _ld(g);
    EVO.chapters = CH5.map((c, i) => ({ d: c[1], i, name: c[0], key: c[2] }));
    if (EVO.SCENE_AUDIO) { const A = EVO.SCENE_AUDIO; A.cpad = 'espace'; A.cplonge = 'espace'; A.crentree = 'espace'; A.corage = 'sky'; A.cbanquise = 'sky'; for (const k of ['cglace', 'ccristal', 'clac', 'cbase', 'cmanteau', 'cdescente']) A[k] = 'evoMine'; A.cnoyau = 'evoBoss'; }
    return EVO.baseDef({ zone: 'campagne', len: 6600, scenes: ['lpad', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide', 'lvide'], order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 5505, bossEnt: null });
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
    { const M = tubeMat(); L.tubeMats.push(M); M.uniforms.uZ.value = zoneTex(PA.len); M.uniforms.uLen.value = PA.len; const gl = new T3.Mesh(sweep(PA, 150, 900, R, 48, 3), M); gl.renderOrder = 5; gl.frustumCulled = false; grp.add(gl);
      const ringG = new T3.TorusGeometry(R + 0.12, 0.16, 6, 56), ringM = bas('#ffffff', { fog: false, transparent: true, opacity: 0.85 }), n = Math.floor(750 / 12), rings = new T3.InstancedMesh(ringG, ringM, n), o = new T3.Object3D();
      for (let k = 0; k < n; k++) { placeAt(PA, o, 156 + k * 12); o.updateMatrix(); rings.setMatrixAt(k, o.matrix); } rings.frustumCulled = false; grp.add(rings);
      const portG = new T3.TorusGeometry(R + 2.4, 1.3, 10, 64), portM = bas('#7ad8ff', { fog: false }); for (const s of [150, 900]) grp.add(placeAt(PA, new T3.Mesh(portG, portM), s)); }
    dock(g, PA, grp); buildSky(g); stormClouds(PA, grp); arctic(g, PA, grp); caverns(PA, grp); obstacles(g, PA, grp); enemies(g, PA, grp); coreWorld(PA, grp); bossBuild(g, PA, grp);
    grp.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (!m.isShaderMaterial && !m.fog) { m.fog = true; m.needsUpdate = true; } });
    // la poussiere / les braises / la neige qui defilent pres de la fusee
    { const n = 140, pos = new Float32Array(n * 3), geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); const p = new T3.Points(geo, new T3.PointsMaterial({ color: '#cfe8ff', size: 0.5, transparent: true, opacity: 0, depthWrite: false, fog: false })); p.frustumCulled = false; g.scene.add(p); L.dust = p; L.dustInit = false; }
    // la boule de feu de la rentree : une coque de plasma devant la fusee
    { const pl = new T3.Group(), c1 = new T3.Mesh(new T3.SphereGeometry(1, 24, 16, 0, 6.283, 0, Math.PI * 0.55), new T3.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0.5, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }));
      c1.rotation.x = Math.PI / 2; c1.scale.set(1.1, 1.6, 1.1); pl.add(c1); const c2 = new T3.Mesh(new T3.ConeGeometry(1.1, 6, 24, 1, true), new T3.MeshBasicMaterial({ color: '#ffb05a', transparent: true, opacity: 0.25, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); c2.rotation.x = Math.PI / 2; c2.position.z = -3; pl.add(c2);
      pl.visible = false; g.scene.add(pl); L.plasma = pl; L.plasmaM = [c1.material, c2.material]; }
    L.far0 = g.camera.far;
  }
  const inWall = (s) => { for (const [a, b] of WALLS) if (s >= a && s <= b) return true; return false; };
  // le sol qu'on rase (banquise, lac) : hauteur dans la section a ne pas franchir
  const floorAt = (s, F) => { const PA = L.PA; let wy = null; if (s > 2220 && s < L.holeS - 25) wy = PA.O.y + ICE_Y + 2.2; else if (s > 3990 && s < 4530) wy = PA.O.y + LAKE_Y + 1.8; if (wy === null || F.u.y < 0.3) return -1e9; return (wy - F.p.y) / F.u.y; };

  const _step = CC.Rocket.prototype.step;
  CC.Rocket.prototype.step = function (dt, input) {
    const g = this.game; if (!L || !on5(g) || !L.PA) return _step.call(this, dt, input);
    const PA = L.PA, inp = g.input; this.age += dt; if (!this.ignited && this.age >= this.cfg.ignitionDelay) { this.ignited = true; g.audio.play('ignite', this.pos); }
    if (!L.started) { L.started = true; L.s = 0; L.x = 0; L.y = 0; L.v = Math.max(30, this.vel.length()); const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); L.yaw0 = e.y; L.pit0 = e.x; L.ry = 0; L.rp = 0; }
    { const e = new T3.Euler().setFromQuaternion(inp.aimQ, 'YXZ'); let dy = e.y - L.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); L.ry = U.clamp(dy, -0.62, 0.62) * Math.exp(-dt * 0.9); L.rp = U.clamp(e.x - L.pit0, -0.62, 0.62) * Math.exp(-dt * 0.9); inp.setAim(L.yaw0 + L.ry, L.pit0 + L.rp); }
    const s0 = L.s, zi = zoneAt(L.s), Z = ZN[zi], boostZ = /boost/.test(Z[5]);
    if (zi !== L.zi) { L.zi = zi; if (CC.L1) CC.L1.msg(g, Z[3] + (boostZ ? ' !' : ''), 2.2, Z[4]); if (boostZ) { g.audio.play('boostOn'); g.audio.play('whoosh'); } else g.audio.play(Z[5] === 'open' || Z[5] === 'low' ? 'jetPass' : 'alarm'); }
    if (L.boostT > 0) L.boostT -= dt; if (L.inv > 0) L.inv -= dt;
    if (!(boostZ || L.boostT > 0)) this.fuel = Math.max(0, this.fuel - dt); const dry = this.fuel <= 0;
    if (dry && !L.dry) { L.dry = 1; if (CC.L1) CC.L1.msg(g, 'PLUS DE CARBURANT !', 2, '#ff6a5a'); g.audio.play('warnFuel'); } if (!dry) L.dry = 0;
    const vMax = L.boostT > 0 ? 96 : boostZ ? 82 : 50;
    L.bk += ((L.boostT > 0 ? 1 : boostZ ? 0.65 : 0) - L.bk) * Math.min(1, dt * 3);
    if (dry) { L.v -= 13 * dt; L.y -= (3 + 9 * U.clamp(1 - L.v / 50, 0, 1)) * dt; L.rp = Math.min(L.rp, -0.15); if (L.v < 14 && this.active) { g.onRocketCrash('stalled', this.pos.clone(), null); return; } }
    else { L.v += ((this.throttle || this.freeBoost || boostZ || L.boostT > 0 ? vMax : vMax * 0.7) - L.v) * Math.min(1, dt * (L.v < vMax ? 1.4 : 0.9)); L.v = Math.max(24, L.v); }
    const vx = -L.v * Math.sin(L.ry) * 0.85, vy = L.v * Math.sin(L.rp) * 0.85, lat = Math.min(1, 52 / L.v); L.x += vx * lat * dt; L.y += vy * lat * dt; L.s += L.v * dt;
    const lim = inWall(L.s) ? R - 2.2 : Z[5] === 'low' ? 22 : ROPEN - 2, rr2 = Math.hypot(L.x, L.y);
    if (rr2 > lim) { L.x *= lim / rr2; L.y *= lim / rr2; L.v *= 1 - dt * 0.6; if (inWall(L.s) && Math.random() < dt * 14) { const F2 = PA.fr(L.s); _a.copy(F2.p).addScaledVector(F2.r, L.x * 1.12).addScaledVector(F2.u, L.y * 1.12); g.effects.sparks.emit({ pos: _a.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(10), life: 0.4, s0: 0.3, s1: 0.4, s2: 0.1, cols: g.effects.pal.cyan, drag: 1, grav: 0, a: 1, fout: 0.5 }); if (Math.random() < 0.15) g.audio.play('clank'); } }
    const F2 = PA.fr(L.s), fl = floorAt(L.s, F2); if (L.y < fl) { L.y = fl; if (Math.random() < dt * 8) g.effects.sparks.emit({ pos: _a.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y - 0.6).clone(), vel: new V(rr(-3, 3), rr(2, 5), rr(-3, 3)), life: 0.5, s0: 0.4, s1: 0.5, s2: 0.1, cols: g.effects.pal.cyan, drag: 1, grav: 0, a: 1, fout: 0.5 }); }   // on rase la glace / l'eau sans passer dessous
    this.pos.copy(F2.p).addScaledVector(F2.r, L.x).addScaledVector(F2.u, L.y);
    this.vel.copy(F2.t).multiplyScalar(L.v).addScaledVector(F2.r, vx * lat).addScaledVector(F2.u, vy * lat); this.speed = this.vel.length(); this.fwd.copy(this.vel).normalize(); this.flightDist += L.v * dt;
    if (g.endlessRun) g.endlessRun.dist = Math.max(g.endlessRun.dist, L.s);
    this.thrustK = 1;
    if (L.inv <= 0 && L.OB) for (const o of L.OB) { if (o.s + o.th < s0 || o.s - o.th > L.s) continue; if (o.hit(L.x, L.y, L.t)) { g.onRocketCrash('wall', this.pos.clone(), F2.t.clone().negate()); if (this.active) { L.inv = 0.8; L.v *= 0.5; g.rig.shake = Math.max(g.rig.shake, 1); } break; } }
    if (this.active && L.sent) play(g, this, dt, s0);
    // on perce la banquise
    if (!L.holed && L.s > L.holeS - 4) { L.holed = 1; g.rig.shake = Math.max(g.rig.shake, 1.2); g.flash = 0.3; g.flashColor = '#e8f4ff'; g.audio.play('boom'); }
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
    if (!L || !L.PA || !on5(g) || !rk.active || g.state !== 'FLIGHT' || !L.started || (g.evoFinish && g.evoFinish.hold)) return;
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
  const _tf = EVO.tumbleFrame;
  EVO.tumbleFrame = (g, dt) => {
    const Tm = g.evoTumble; if (!Tm || !L || !L.PA || !on5(g)) return _tf(g, dt); Tm.space = true;
    for (const q of Tm.P) { q.v.y += 16 * dt; q.v.multiplyScalar(Math.exp(-1.8 * dt)); q.w.multiplyScalar(Math.exp(-0.7 * dt)); }
    const had = !!Tm.flag; _tf(g, dt);
    if (Tm.flag && !had) { const F = Tm.flag; F.position.copy(Tm.body.m.position).add(new V(0, -2.2, 0)); F.children[F.children.length - 1].visible = false; const ring = new T3.Mesh(new T3.TorusGeometry(0.9, 0.08, 6, 32), bas('#ffe28a', { fog: false })); ring.rotation.x = Math.PI / 2; F.add(ring); F.userData.ring = ring; }
    if (Tm.flag) { const F = Tm.flag; F.position.y += Math.sin(Tm.t * 1.6) * 0.004; if (F.userData.ring) F.userData.ring.scale.setScalar(1 + 0.15 * Math.sin(Tm.t * 4)); }
  };
  // --- l'ambiance le long de la voie ---
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m); if (!L || !L.PA || !on5(g)) return;
    const s = L.started ? L.s : 0, M = moodAt(s), fl = L.flashK || 0;
    if (fl > 0) { M.fog.lerp(_c4.set('#c8d8ff'), fl * 0.6); M.top.lerp(_c4, fl * 0.6); M.hor.lerp(_c4, fl * 0.6); }
    if (g.skyMat) { const u = g.skyMat.uniforms; u.top.value.copy(M.top); u.horizon.value.copy(M.hor); u.bottom.value.copy(M.fog); u.cloud.value = 0; }
    g.scene.fog.color.copy(M.fog); g.scene.fog.near = M.near; g.scene.fog.far = M.far;
    g.renderer.setClearColor(M.fog); if (g.stars) g.stars.visible = false;
    const sp = s < 900 ? 1 : 0; g.nightK = sp * 0.8; if (g.postParams) { g.postParams.bloomStrength = 0.25 + 0.15 * (s > 5700 ? 1 : 0); g.postParams.bloomThreshold = 0.8; g.postParams.vignette = 0.3; g.postParams.saturation = 1.05; g.postParams.contrast = 1.06; }
    g.ambient.intensity = 0.32 * M.li + 0.1; g.sun.intensity = 0.95 * M.li; g.sun.color.set(s > 900 && s < 1600 ? '#ffb070' : s > 5060 ? '#ff9a5a' : '#ffffff');
  };
  // --- chaque image ---
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!on5(g) || !g.endlessRun || !g.endlessRun.T) return;
    if (!L) { try { build(g); } catch (e) { console.warn('core', e); L = null; return; } }
    const PA = L.PA, rk = g.rocket, cam = g.camera, s = L.started ? L.s : 0, fx = g.effects; L.t += dt;
    for (const M of L.tubeMats) { M.uniforms.uT.value = L.t; M.uniforms.uFar.value = g.scene.fog.far; }
    for (const M of L.cMats) { M.uniforms.uT.value = L.t; M.uniforms.uFar.value = g.scene.fog.far; if (M.uniforms.uFog) M.uniforms.uFog.value.copy(g.scene.fog.color); }
    if (L.water) L.water.uniforms.uT.value = L.t; if (L.core) L.core.material.uniforms.uT.value = L.t; if (L.coreRings) L.coreRings.forEach((o, i) => o.rotateZ(dt * (i % 2 ? -0.5 : 0.4))); if (L.blinks) for (const b of L.blinks) b.visible = Math.sin(L.t * 5) > 0;
    bossAnim(g, dt);
    // le decor du niveau 1 n'a rien a faire ici (sol, hangar, rampe)
    for (const c of g.endlessRun.chunks.values()) if (c.builder && c.builder.root) c.builder.root.visible = false;
    for (const o of g.scene.children) if (o.name === 'level') o.visible = false; if (g.pad && g.pad.evoL) g.pad.evoL.visible = false; if (g.pad && g.pad.hangar) g.pad.hangar.visible = false;
    if (L.dock) L.dock.visible = s < 1100;
    // feux de la catapulte : ils filent vers l'avant
    if (L.runway) for (let i = 0; i < L.runway.length; i++) L.runway[i].visible = ((Math.floor(i / 2) - L.t * 12) % 16 + 16) % 16 < 3 || (L.started && L.s < 160);
    if (L.started && !L.boomed) { L.boomed = 1; g.audio.play('boom'); g.audio.play('rumble'); g.flash = 0.3; g.flashColor = '#bfe8ff'; if (CC.L1) CC.L1.msg(g, 'LARGAGE !', 1.8, '#bfe8ff'); }
    animate(g, dt);
    // les eclairs de l'orage au loin (le ciel s'allume), la neige de la banquise
    L.flashK = Math.max(0, (L.flashK || 0) - dt * 3); if (s > 1560 && s < 2250 && Math.random() < dt * 0.5) { L.flashK = 1; g.audio.play('rumble'); }
    // le ciel : etoiles et Terre pendant l'orbite et le plongeon ; la Terre grossit, puis on est dedans
    if (L.sky) { L.sky.position.copy(cam.position); const E = L.earth, hv = U.lerp(320, 30, ss(0, 1300, s)); E.visible = s < 1450; E.position.set(0, -(RS + hv), 0); E.rotation.set(Math.PI / 2 - 0.35, 0, L.t * 0.004); L.cloudSphere.rotation.y = L.t * 0.002;
      for (const p of L.stars) p.material.color.setScalar(p.userData.op * (1 - ss(700, 1000, s))); L.sky.visible = s < 1500;
      if (L.sun) { _b.copy(PA.R0).multiplyScalar(0.75).addScaledVector(PA.F0, 0.5); _b.y = 0.28; _b.normalize(); L.sun.position.copy(_b).multiplyScalar(2800); } }
    // la boule de feu de la rentree
    { const k = L.started ? ss(860, 980, s) * (1 - ss(1480, 1600, s)) : 0; L.plasma.visible = k > 0.01 && rk.active; if (L.plasma.visible) { L.plasma.position.copy(rk.pos).addScaledVector(rk.fwd, L.rkL * 0.45); L.plasma.quaternion.setFromUnitVectors(_zA, rk.fwd); L.plasma.scale.setScalar(L.rkL * 0.75 * (1 + 0.06 * Math.sin(L.t * 30))); L.plasmaM[0].opacity = 0.55 * k; L.plasmaM[1].opacity = 0.3 * k; if (Math.random() < dt * 30 * k) fx.sparks.emit({ pos: rk.pos.clone().addScaledVector(rk.fwd, L.rkL * 0.4), vel: rk.fwd.clone().multiplyScalar(-rr(20, 40)).add(new V(rr(-4, 4), rr(-4, 4), rr(-4, 4))), life: 0.5, s0: 0.5, s1: 0.6, s2: 0.1, cols: fx.pal.ember, drag: 1, grav: 0, a: 1, fout: 0.5 }); } }
    // poussiere : etoiles filantes (espace), braises (rentree), pluie (orage), neige (banquise), poussiere de roche (sous terre)
    if (L.dust && L.started) { const P = L.dust.geometry.attributes.position, F = PA.fr(L.s), n = P.count, D = L.dust.material;
      const col = s < 900 ? '#cfe8ff' : s < 1560 ? '#ffb05a' : s < 2250 ? '#9ab0c8' : s < 2730 ? '#ffffff' : s < 5060 ? '#9adcff' : '#ff8a3a'; D.color.set(col); D.opacity = Math.max(s < 900 ? 0.4 : 0.6, 0.7 * L.bk); D.size = (s > 2250 && s < 2730 ? 0.8 : 0.5) + 0.7 * L.bk;
      for (let i = 0; i < n; i++) { _a.set(P.getX(i), P.getY(i), P.getZ(i)); if (!L.dustInit || _b.subVectors(_a, rk.pos).dot(F.t) < -10 || _b.length() > 200) { _a.copy(rk.pos).addScaledVector(F.t, L.dustInit ? rr(100, 190) : rr(-10, 190)).addScaledVector(F.r, rr(-50, 50)).addScaledVector(F.u, rr(-40, 40)); P.setXYZ(i, _a.x, _a.y, _a.z); } }
      L.dustInit = true; P.needsUpdate = true; }
  };
})();
