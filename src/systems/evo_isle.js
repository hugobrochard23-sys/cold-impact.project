/* v374 : L'ILE 1 refaite comme un VRAI parcours de course (inspire des jeux de course a obstacles) : 9 sections, chacune avec sa couleur et son obstacle, REPETE en rangee ;
 * largeur qui change (arenes larges, pont etroit), voies separees par un muret gonflable, pente forte, une remontee, une section inclinee ;
 * sol = surfaces de couleur unie avec marquages (herbe seulement en decor autour du hangar) ; rambardes = piles de disques gonflables ; aucun arbre ni pierre ;
 * obstacles mobiles ACCROCHES a des structures (portiques, tours, mats, canons) ; la porte-herse ne descend jamais sur la fusee qui approche. Aucune texture (couleurs unies, un drapeau). */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mkCourse) return;
  const T3 = THREE, U = CC.U, Z = CC.Zones, D = Z && Z.defs && Z.defs.campagne; if (!D) return;
  const FLY = 11, TOP = 9, S0 = -125;
  const PAL = { blue: '#3aa6f0', pink: '#ff6fae', teal: '#42d6a4', yellow: '#ffc24a', purple: '#a77bff', asph: '#4b5059', asph2: '#585d67', sand: '#a99c7c', conc: '#8d9096' };
  // les sections : nom, longueur, virage (+ droite), pente (descente ; negatif = on remonte), demi-largeur de l'ile, couleur du sol, inclinaison laterale
  const SEC_ARCH = [
    { n: 'depart', len: 150, turn: 0, slope: 0, W: 56, col: 'blue' },
    { n: 'marteaux', len: 150, turn: 60, slope: 0.15, W: 56, col: 'pink' },
    { n: 'pont', len: 140, turn: -50, slope: 0.18, W: 24, col: 'teal' },
    { n: 'canons', len: 170, turn: 90, slope: 0.26, W: 46, col: 'yellow' },
    { n: 'divise', len: 170, turn: -80, slope: 0.1, W: 54, col: 'split' },
    { n: 'incline', len: 160, turn: 70, slope: 0.16, W: 52, col: 'purple', bank: 0.14 },
    { n: 'remonte', len: 150, turn: -60, slope: -0.1, W: 48, col: 'blue' },
    { n: 'gate', len: 150, turn: 40, slope: 0.2, W: 50, col: 'pink' },
    { n: 'arrivee', len: 120, turn: 0, slope: 0.06, W: 58, col: 'blue' },
  ];
  const SEC_RANGE = [   // la 2e carte : le terrain d'essai de fusees (base d'essai : beton, asphalte, hangar, citadelle), ~50 s, un seul obstacle principal par section
    { n: 'lancement', len: 170, turn: 0, slope: 0, W: 54, col: 'asph' },
    { n: 'tir', len: 260, turn: -30, slope: 0.06, W: 50, col: 'sand' },
    { n: 'falaise', len: 250, turn: 50, slope: 0.14, W: 42, col: 'asph2' },
    { n: 'montee', len: 230, turn: 0, slope: -0.14, W: 44, col: 'conc' },
    { n: 'canons', len: 260, turn: 40, slope: 0.02, W: 46, col: 'sand' },
    { n: 'incline', len: 230, turn: -60, slope: 0.1, W: 48, col: 'asph', bank: 0.12 },
    { n: 'pont', len: 220, turn: 0, slope: 0.04, W: 26, col: 'asph2' },
    { n: 'citadelle', len: 200, turn: 0, slope: -0.07, W: 46, col: 'conc' },
  ];
  let SEC = SEC_ARCH;
  E.rangeShape = SEC_RANGE.map((s, i) => [s.len, s.turn, s.slope, FLY, i === SEC_RANGE.length - 1 ? 24 : 17, TOP]);
  E.isleShape = SEC.map((s, i) => [s.len, s.turn, s.slope, FLY, i === SEC.length - 1 ? 24 : 17, TOP]);
  const STARTS = []; const calcStarts = () => { STARTS.length = 0; let a = 0; for (const s of SEC) { STARTS.push(a); a += s.len; } }; calcStarts();
  const secAt = (d) => { let i = 0; for (let k = 0; k < SEC.length; k++) if (d >= STARTS[k]) i = k; return i; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const blend = (d, key, def) => {   // valeur d'une section, fondue sur 22 m de part et d'autre de chaque frontiere
    const i = secAt(Math.max(0, d)), v = (k) => (SEC[k][key] !== undefined ? SEC[k][key] : def); let w = v(i);
    const b0 = d - STARTS[i], b1 = (i + 1 < SEC.length ? STARTS[i + 1] : 1e9) - d;
    if (i > 0 && b0 < 22) w = lerp(v(i - 1), w, 0.5 + 0.5 * Math.max(0, b0) / 22);
    if (i + 1 < SEC.length && b1 < 22) w = lerp(v(i + 1), w, 0.5 + 0.5 * b1 / 22);
    return w;
  };
  const mkW = (dEnd) => (d) => {
    if (d <= S0 || d >= dEnd) return 0; let w = blend(d, 'W', 50);
    if (d < -35) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d + 35) / (S0 + 35), 2)));
    if (d > dEnd - 70) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d - (dEnd - 70)) / 70, 2)));
    return w;
  };
  E.mkIsle = (shape, variant, map) => {
    SEC = map === 'range' ? SEC_RANGE : SEC_ARCH; calcStarts(); RIM.set(map === 'range' ? '#2f3238' : '#7a3cf0');
    const C = E.mkCourse(shape, { fl: FLY, sw: 6 }), dEnd = C.len + 90, mir = variant === 1, W = mkW(dEnd);
    C.isle = { map: map || 'arch', boxes: [], variant: variant || 0, mir, W, dEnd, starts: STARTS, bank: (d) => (mir ? -1 : 1) * blend(d, 'bank', 0), PY: C.rel(C.len) - 90, sx: variant === 2 ? -1 : 1 };
    try { CC.CONFIG.render.viewDist = 480; } catch (e) { /* ignore */ }   // on voit les obstacles de plus loin
    if (map === 'range') {   // zones pleines (repere piste : [d0, d1, x0, x1, hauteur0, hauteur1]) : hangar, tours de la citadelle
      const hg = { d: STARTS[2] + 55, len: 44, hw: 20, hh: 24 }, ct = { d: STARTS[7] + 110 }; C.isle.hangar = hg; C.isle.citadel = ct;
      const B = C.isle.boxes, d0 = hg.d - hg.len / 2, d1 = hg.d + hg.len / 2;
      for (const sg of [-1, 1]) B.push([d0, d1, sg > 0 ? hg.hw : -hg.hw - 1.4, sg > 0 ? hg.hw + 1.4 : -hg.hw, 0, hg.hh + 1]);
      B.push([d0, d1, -hg.hw - 1.4, hg.hw + 1.4, hg.hh, hg.hh + 1.4]);
      for (let k = -3; k <= 3; k++) B.push([hg.d + k * 6.5 - 0.7, hg.d + k * 6.5 + 0.7, -hg.hw, hg.hw, 16.4, 17.7]);
      for (const sg of [-1, 1]) B.push([ct.d - 5.5, ct.d + 5.5, sg > 0 ? 36 : -50, sg > 0 ? 50 : -36, 0, 38]);
      B.push([ct.d - 2.8, ct.d + 2.8, -38, 38, 25, 39]);   // le linteau et le parapet de la citadelle
    }
    return C;
  };
  // brume plus loin sur l'ile
  { const _am = E.applyMood; if (_am) E.applyMood = function (g, m) { if (E.course && E.course.isle) m = Object.assign({}, m, { near: 230, far: 520 }); return _am.call(this, g, m); }; }
  // la fusee est-elle dans la roche de l'ile ? (d : avance, x : lateral, y : hauteur absolue)
  const PROF = [[1, 0], [0.97, -1.4], [0.84, -8], [0.64, -18], [0.42, -30], [0.2, -42], [0, -52]];
  E.isleSolid = (C, T, d, x, y) => {
    const I = C.isle; if (!I) return false; const w = I.W(d); if (w <= 0) return false; const h = T.base(d) + I.bank(d) * x - y; if (h < 0.3 || h > 52) return false;
    let s = 0; for (let i = 1; i < PROF.length; i++) if (h <= -PROF[i][1]) { const p0 = PROF[i - 1], p1 = PROF[i]; s = p0[0] + (p1[0] - p0[0]) * (h + p0[1]) / (p1[1] - p0[1]); break; }
    return Math.abs(x) < w * s;
  };

  // ---- le sol : surfaces de couleur unie par section (la piste n'a plus d'herbe) ----
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const colTmp = new T3.Color(), COLS = {}; for (const k in PAL) COLS[k] = new T3.Color(PAL[k]);
  const RIM = new T3.Color('#7a3cf0');
  const rangeScene = (S, I) => {
    const foe = Z.evoFoe, st = STARTS[1], hg = I.hangar, ct = I.citadel;
    const heliPatrol = (SS, dd, lx, y) => [SS.at(dd, lx - 8, y), SS.at(dd + 8, lx, y + 2), SS.at(dd, lx + 8, y), SS.at(dd - 8, lx, y + 2)];
    if (foe) {
      [[st + 40, -30], [st + 85, 8], [st + 130, -12], [st + 175, 30], [st + 215, 0]].forEach(([dd, lx]) => foe(S, 'tank', dd, lx, 0, { name: 'CHAR', keep: true, armed: false }));
      [[st + 70, -22], [st + 125, 20], [st + 190, -6]].forEach(([dd, lx]) => foe(S, 'heli', dd, lx, 10, { name: 'HELICO', keep: true, armed: false, patrol: heliPatrol, speed: 7 }));
      [[st + 60, 26], [st + 160, -24]].forEach(([dd, lx]) => foe(S, 'truck', dd, lx, 0, { name: 'CAMION', keep: true, armed: false }));
    }
    for (let k = 0; k < 7; k++) { const dd = st + 30 + k * 34, sg = k % 2 ? 1 : -1; for (let q = 0; q < 3; q++) S.bx(dd, sg * (40 + q * 2.8), 0.55, 2.6, 1.1, 1.5, 'sand', '#c8b078', false); }   // sacs de sable
    const dc = hg.d, len = hg.len, hw = hg.hw, hh = hg.hh;
    for (const s of [-1, 1]) { S.bx(dc, s * (hw + 0.7), hh / 2, 1.4, hh, len, 'corrugated', '#7f8666', false); S.bx(dc - len / 2, s * (hw + 0.7), hh / 2, 2.2, hh, 2.2, 'metal', '#3d444c', false); S.bx(dc + len / 2, s * (hw + 0.7), hh / 2, 2.2, hh, 2.2, 'metal', '#3d444c', false); }
    S.bx(dc, 0, hh + 0.7, 2 * hw + 3, 1.4, len + 2, 'corrugated', '#6c7358', false);
    for (let k = -3; k <= 3; k++) S.bx(dc + k * 6.5, 0, 17, 2 * hw, 1.3, 1.4, 'metal', '#3d444c', false);   // les poutres des ponts roulants
    for (let k = -2; k <= 2; k++) S.glow(dc + k * 9, 0, hh - 2.2, '#ffe2a8', 16);
    const cd = ct.d; for (const s of [-1, 1]) { S.bx(cd, s * 43, 19, 14, 38, 11, 'brick', '#9a8c7a', false); S.bx(cd, s * 43, 39, 15.4, 2.4, 12.4, 'concrete', '#8d9096', false); for (let k = -1; k <= 1; k++) for (const q of [-1, 1]) S.bx(cd + q * 5, s * 43 + k * 5, 41.4, 3, 2.6, 3, 'brick', '#9a8c7a', false); }
    S.bx(cd, 0, 31, 76, 12, 5, 'brick', '#8c8576', false); S.bx(cd, 0, 38, 78, 2, 6, 'concrete', '#8d9096', false);   // le linteau de la citadelle, au-dessus des herses
  };
  const sceneDef = {
    len: [300, 300], noDoor: true, noChaos: true, gw: 46,
    gwF: (d) => { const C = E.course; return C && C.isle ? C.isle.W(d) : 46; },
    bankF: (d) => { const C = E.course; return C && C.isle ? C.isle.bank(d) : 0; },
    ground: (d, lx, c) => {
      const C = E.course, I = C && C.isle; if (!I) return; const s = SEC[secAt(d)], a = Math.abs(lx), w = I.W(d);
      const base = s.col === 'split' ? (lx < 0 ? COLS.teal : COLS.pink) : COLS[s.col]; c.copy(base);
      if (((Math.floor(d / 18) + Math.floor((lx + 300) / 18)) & 1)) c.multiplyScalar(0.94);   // damier tres doux
      if (a > w - 2) c.copy(RIM);
    },
    build(S) {
      const C = E.course; if (!C || !C.isle) return;
      if (C.isle.map === 'range') rangeScene(S, C.isle);
    },
  };
  const BR = ['#bba294', '#b09486', '#c4aa9c', '#ab9082'], RUST = ['#8a5a44', '#7a5a48', '#6a5240'];
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const hangar = (S, dc, lx) => {   // le hangar en briques du jeu, a cote du depart
    const len = 36, hw = 12, hh = 12;
    S.reserve(dc, lx, 2 * hw + 10, len + 10);
    S.item(dc, (r) => {
      const t = pk(r, BR);
      for (const s of [-1, 1]) { S.bx(dc, lx + s * (hw + 0.7), 3, 1.4, 6, len, 'brick', t, true); S.bx(dc, lx + s * (hw + 0.7), 10.5, 1.4, 3, len, 'brick', t, true); S.bx(dc, lx + s * (hw + 0.7), 7, 0.3, 3, len - 6, 'glass', undefined, false); }
      for (const e of [-1, 1]) S.wall(dc + e * len / 2, lx - hw - 1.4, lx + hw + 1.4, 0, hh + 2, 1.6, 'brick', t, { lx, yc: 5.5, w: 22, h: 11 });
      S.bx(dc, lx, hh + 0.4, 2 * hw + 3, 0.8, len + 2, 'corrugated', pk(r, RUST), true); S.bx(dc, lx, 0.14, 2 * hw, 0.3, len, 'concrete', '#a0a29e', false);
      for (let k = -1; k <= 1; k++) S.glow(dc + k * 11, lx, hh - 2.4, '#ffe2a8', 14);
    });
  };
  for (let i = 0; i < 6; i++) D.scenes['crsI' + i] = Object.assign({}, sceneDef);
  E.isleScenes = Array.from({ length: 6 }, (_, i) => 'crsI' + i);

  // ---- le dessous de l'ile (roche qui s'effile) et l'ocean a perte de vue ----
  const bodyMesh = (T, C) => {
    const I = C.isle, pos = [], col = [], rings = [], step = 6, ROCK = ['#9a8f80', '#85796b', '#6f655a', '#5c534b'], SOIL = '#7a5233', cc = new T3.Color();
    for (let d = S0; d <= I.dEnd + 0.1; d += step) {
      const w = I.W(d), bk = I.bank(d), ring = [];
      for (let k = 0; k < PROF.length; k++) for (const sg of (k === PROF.length - 1 ? [0] : [-1, 1])) {
        const jx = k < 2 ? 0 : (hash(d, k * 3 + sg) - 0.5) * 0.18, jy = k < 2 ? 0 : (hash(k, d + sg) - 0.5) * 4, lx = sg * w * PROF[k][0] * (1 + jx);
        ring.push({ k, sg, p: T.at(d, lx, PROF[k][1] + jy + bk * lx) });
      }
      rings.push(ring);
    }
    const push = (a, b, c, k) => { cc.set(k < 1 ? SOIL : ROCK[Math.min(3, Math.max(0, k - 1))]); const j = 1 + (hash(a.p[0], a.p[2]) - 0.5) * 0.28; for (const v of [a, b, c]) { pos.push(v.p[0], v.p[1], v.p[2]); col.push(cc.r * j, cc.g * j, cc.b * j); } };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1]; if (A.length !== B.length) continue;
      for (const sgn of [-1, 1]) for (let k = 0; k < PROF.length - 1; k++) {
        const idx = (kk, s) => (kk === PROF.length - 1 ? A.length - 1 : kk * 2 + (s < 0 ? 0 : 1)), i0 = idx(k, sgn), i1 = idx(k + 1, sgn);
        push(A[i0], B[i0], A[i1], k); push(B[i0], B[i1], A[i1], k);
      }
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; return m;
  };
  const OCEAN_VS = 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}';
  const OCEAN_FS = [
    'uniform float uTime; uniform vec3 uSun; uniform sampler2D uTex; uniform float uUse; varying vec3 vW;', '#include <fog_pars_fragment>',
    'float hgt(vec2 p) { return sin(p.x * 0.045 + uTime * 0.9) * 0.5 + sin(p.y * 0.06 - uTime * 0.7) * 0.4 + sin((p.x + p.y) * 0.11 + uTime * 1.4) * 0.25 + sin((p.x * 0.7 - p.y) * 0.21 - uTime * 2.0) * 0.14 + sin((p.x - p.y * 0.6) * 0.47 + uTime * 2.6) * 0.07; }',
    'void main() {', '  vec2 p = vW.xz; float e = 0.7, h0 = hgt(p);',
    '  vec3 n = normalize(vec3(-(hgt(p + vec2(e, 0.0)) - h0) * 1.5, 1.0, -(hgt(p + vec2(0.0, e)) - h0) * 1.5));',
    '  vec3 V = normalize(cameraPosition - vW); float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
    '  vec3 deep = vec3(0.05, 0.36, 0.66), shallow = vec3(0.20, 0.68, 0.86), sky = vec3(0.70, 0.88, 0.98);',
    '  vec3 col = mix(deep, shallow, clamp(0.5 + h0 * 0.35, 0.0, 1.0)); col = mix(col, sky, fres * 0.7);',
    '  vec3 R = reflect(-uSun, n); col += vec3(1.0, 0.96, 0.82) * pow(max(dot(R, V), 0.0), 80.0) * 1.3;',
    '  float crest = smoothstep(0.62, 1.0, h0 * 0.5 + 0.5 + sin(p.x * 0.31 + p.y * 0.23 + uTime * 1.3) * 0.06); col = mix(col, vec3(1.0), crest * 0.4);',
    '  if (uUse > 0.5) { vec3 tw = texture2D(uTex, vW.xz * 0.02 + uTime * vec2(0.01, 0.02)).rgb * texture2D(uTex, vW.xz * 0.047 - uTime * vec2(0.015, 0.0)).rgb * 2.0; col = mix(col, col * tw * 1.35, 0.5); }',
    '  gl_FragColor = vec4(col, 1.0);', '#include <fog_fragment>', '}'].join('\n');
  const ocean = (T, C) => {
    const I = C.isle, geo = new T3.PlaneGeometry(6000, 6000, 1, 1); geo.rotateX(-Math.PI / 2);
    let sx = 0, sz = 0, n = 0; for (let d = 0; d < I.dEnd; d += 60) { const q = T.at(d, 0, 0); sx += q[0]; sz += q[2]; n++; } sx /= n; sz /= n;
    let wt = null; try { wt = CC.Textures.get('water').clone(); wt.needsUpdate = true; wt.wrapS = wt.wrapT = T3.RepeatWrapping; } catch (e) { wt = null; }
    if (!wt) { wt = new T3.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); wt.needsUpdate = true; }
    const uni = T3.UniformsUtils.merge([T3.UniformsLib.fog, { uTime: { value: 0 }, uSun: { value: new T3.Vector3(0.35, 0.8, 0.5).normalize() }, uTex: { value: wt }, uUse: { value: wt.image && wt.image.width > 1 ? 1 : 0 } }]);
    const m = new T3.Mesh(geo, new T3.ShaderMaterial({ uniforms: uni, vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, fog: true }));
    m.position.set(sx, I.PY, sz); m.frustumCulled = false; m.onBeforeRender = () => { uni.uTime.value = performance.now() / 1000; }; return m;
  };

  // ---- marquages au sol (bandes de section, tirets, chevrons) et rambardes gonflables (piles de disques) ----
  const decals = (T, C) => {
    const I = C.isle, pos = [], col = [], idx = [], tc = new T3.Color(), HZ = I.map === 'range' ? ['#1d1e22', '#f2c230'] : ['#2a2540', '#ffffff'], CHV = I.map === 'range' ? '#f2c230' : '#ffffff';
    const P = (d, lx) => T.at(d, lx, I.bank(d) * lx + 0.09);
    const quad = (a, b, c, d2, hex) => { const o = pos.length / 3; for (const p of [a, b, c, d2]) pos.push(p[0], p[1], p[2]); tc.set(hex); for (let k = 0; k < 4; k++) col.push(tc.r, tc.g, tc.b); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); };
    STARTS.forEach((s, i) => { if (i === 0) return; const w = I.W(s) - 2.2;   // la jonction entre deux sections : plaque de seuil, rainure incrustee, filet clair, bandes de danger
      quad(P(s - 1.4, -w), P(s - 1.4, w), P(s - 0.5, w), P(s - 0.5, -w), '#a9aeb8'); quad(P(s - 0.5, -w), P(s - 0.5, w), P(s, w), P(s, -w), '#14151a'); quad(P(s, -w), P(s, w), P(s + 0.35, w), P(s + 0.35, -w), '#d9dde4');
      for (let k = 0; k < 3; k++) { const d0 = s + 0.9 + k * 1.9; quad(P(d0, -w), P(d0, w), P(d0 + 1.9, w), P(d0 + 1.9, -w), k % 2 ? HZ[0] : HZ[1]); } });
    for (let d = 14; d < C.len - 6; d += 10) quad(P(d, -0.5), P(d, 0.5), P(d + 5, 0.5), P(d + 5, -0.5), '#ffffff');   // tirets au centre
    STARTS.forEach((s, i) => { const d = s + (i === 0 ? 60 : 30), n = Math.max(1, Math.floor(I.W(d) / 14)); for (let j = 0; j < n; j++) { const lx = (j - (n - 1) / 2) * 15;   // chevrons « par ici »
      quad(P(d, lx - 3.4), P(d + 1.7, lx - 3.4), P(d + 6.2, lx), P(d + 4.5, lx), CHV); quad(P(d + 4.5, lx), P(d + 6.2, lx), P(d + 1.7, lx + 3.4), P(d, lx + 3.4), CHV); } });
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, side: T3.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.frustumCulled = false; return m;
  };
  const rails = (T, C) => {
    const I = C.isle, list = [], rg = I.map === 'range', CY = rg ? ['#25262a', '#25262a', '#e8e8e8'] : ['#ff3b4d', '#ff9a1f', '#ff3b4d'];
    for (let d = S0 + 12; d < I.dEnd - 10; d += 4) { const w = I.W(d) - 1.2; if (w < 8) continue; for (const sg of [-1, 1]) list.push([d, sg * w, 1, ((d / 4) | 0) % 5 === 0 ? 1 : 0]); }
    if (!rg) { const dv = STARTS[4]; for (let d = dv + 24; d < dv + 150; d += 3.6) list.push([d, 0, 1.15, 2]); I.boxes.push([dv + 24, dv + 150, -1.4, 1.4, 0, 3.2]); }   // le muret central qui separe les deux voies
    for (let d = S0 + 12; d < I.dEnd - 10; d += 8) { const w = I.W(d) - 1.2; if (w < 8) continue; I.boxes.push([d - 4, d + 4, w - 1.3, w + 1.3, 0, 3.1], [d - 4, d + 4, -w - 1.3, -w + 1.3, 0, 3.1]); }   // les rambardes sont solides
    if (!rg) for (const d of [104, 118]) for (let lx = -50 + (d === 118 ? 8 : 0); lx <= 50; lx += 16) { list.push([d, lx, 1.6, 3]); I.boxes.push([d - 1.9, d + 1.9, lx - 1.9, lx + 1.9, 0, 3.9]); }   // les gros coussins de la ligne de depart
    const prof = [[0.02, 0], [1.0, 0], [1.15, 0.14], [1.15, 0.66], [1.0, 0.8], [0.02, 0.8]].map((q) => new T3.Vector2(q[0], q[1] - 0.4)), geo = new T3.LatheGeometry(prof, 14), im = new T3.InstancedMesh(geo, new T3.MeshLambertMaterial({ color: '#ffffff' }), list.length * 3), dm = new T3.Object3D(), cc = new T3.Color(); let n = 0;
    for (const [d, lx, sc, kind] of list) for (let k = 0; k < 3; k++) {
      const p = T.at(d, lx, I.bank(d) * lx + (0.4 + k * 0.8) * sc); dm.position.set(p[0], p[1], p[2]); dm.scale.set(sc, sc, sc); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix);
      cc.set(kind === 1 ? (rg ? '#e8e8e8' : '#ffffff') : kind === 2 ? (k % 2 ? '#ffffff' : '#ff6fae') : kind === 3 ? (k % 2 ? '#ffffff' : '#ff8a1f') : CY[k]); im.setColorAt(n, cc); n++;
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; return im;
  };

  // ---- les obstacles mobiles : chacun accroche a une structure ; collision en repere de la structure (x = gauche, y = hauteur, z = devant) ----
  const mat = (c) => new T3.MeshLambertMaterial({ color: c, flatShading: true });
  const matS = (c) => new T3.MeshLambertMaterial({ color: c });
  const RBC = {};
  const rbGeo = (w, h, d, r) => { const k = [w, h, d, r].join('|'); if (RBC[k]) return RBC[k]; const sh = new T3.Shape(), x = (w - 2 * r) / 2, y = (h - 2 * r) / 2; sh.moveTo(-x, -y); sh.lineTo(x, -y); sh.lineTo(x, y); sh.lineTo(-x, y); sh.closePath();
    const g = new T3.ExtrudeGeometry(sh, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2, curveSegments: 1 }); g.center(); return (RBC[k] = g); };   // boite a bords arrondis
  const bx = (w, h, d, c) => { const m = Math.min(w, h, d); return m >= 1.4 ? new T3.Mesh(rbGeo(w, h, d, Math.min(0.28, m * 0.12)), matS(c)) : new T3.Mesh(new T3.BoxGeometry(w, h, d), mat(c)); };
  const rope = (Lr) => { const n = Math.max(2, Math.round(Lr / 0.9)), g = new T3.CylinderGeometry(0.14, 0.14, Lr, 6, n), pos = g.attributes.position, col = new Float32Array(pos.count * 3), c1 = new T3.Color('#cdb88c'), c2 = new T3.Color('#8f7a55');
    for (let i = 0; i < pos.count; i++) { const c = Math.floor((pos.getY(i) + Lr / 2) / (Lr / n) + 0.01) % 2 ? c1 : c2; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T3.BufferAttribute(col, 3)); return new T3.Mesh(g, new T3.MeshLambertMaterial({ vertexColors: true })); };   // corde a bandes (torsade)
  let _blob = null, _bm = null;
  const blobTex = () => _blob || (_blob = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(cv); })());
  const blobMat = () => new T3.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const blob = (g, x, z, w, d) => { const m = new T3.Mesh(new T3.PlaneGeometry(w, d), _bm || (_bm = blobMat())); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.1, z); g.add(m); return m; };   // ombre douce sur le sol
  E.isleBlob = () => { const m = new T3.Mesh(new T3.PlaneGeometry(1, 1), blobMat()); m.rotation.x = -Math.PI / 2; m.visible = false; m.frustumCulled = false; return m; };
  const cy = (rt, rb, h, c, n) => new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, n || 10), mat(c));
  const STONE = ['#a39a8a', '#948b7c', '#b2a999'], WOOD = '#7a5634', WOODD = '#5b3f25';
  const _v = new T3.Vector3(), RR = 0.95;   // RR : rayon de la fusee
  const segDist = (px, py, ax, ay, bx2, by2) => { const dx = bx2 - ax, dy = by2 - ay, l2 = dx * dx + dy * dy || 1, t = U.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); };
  const obstacles = (T, C, grp) => {
    const I = C.isle, ups = [], hits = [], sx = I.sx, addHit = (d, f) => { f.d = d; hits.push(f); };
    const mk = (d, lx) => { const L = lx * sx, bk = I.bank(d), p = T.at(d, L, bk * L), q = T.at(d + 3, L, bk * L), g = new T3.Group(); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); g.rotateZ(-Math.atan(bk)); grp.add(g); g.updateMatrixWorld(true); return g; };
    const loc = (g, pos) => g.worldToLocal(_v.copy(pos));
    const stoneBlock = (w, h, d, i) => bx(w, h, d, STONE[i % 3]);
    const gantry = (g, span, top, wood, dd, lxx) => {
      if (dd !== undefined) { const L = lxx * sx; for (const sg of [-1, 1]) I.boxes.push([dd - 2.7, dd + 2.7, L + sg * span - 2.7, L + sg * span + 2.7, 0, top + 1]); I.boxes.push([dd - 1.4, dd + 1.4, L - span - 2.5, L + span + 2.5, top - 0.6, top + 1.6]); }   // portique : deux piliers (pierre a bandes ou bois), une poutre a bandes jaunes et noires
      for (const s of [-1, 1]) { const col = wood ? bx(2.2, top + 1, 2.2, WOOD) : stoneBlock(4, top + 1, 4, 0); col.position.set(s * span, (top + 1) / 2, 0); g.add(col); if (!wood) for (let k = 0; k < 4; k++) { const band = stoneBlock(4.4, 0.7, 4.4, k + 1); band.position.set(s * span, 3 + k * 5.5, 0); g.add(band); } const foot = bx(5.4, 1.2, 5.4, wood ? WOODD : '#7c7468'); foot.position.set(s * span, 0.6, 0); g.add(foot); }
      const beam = bx(2 * span + 5, 2, 2.6, wood ? WOOD : '#8a8174'); beam.position.y = top + 0.5; g.add(beam);
      for (let k = -2; k <= 2; k++) { const sp = bx(2.6, 2.04, 2.64, k % 2 ? '#ffd23a' : '#23262b'); sp.position.set(k * 5.6, top + 0.5, 0); if (Math.abs(k * 5.6) < span + 1) g.add(sp); }
    };
    const hammer = (d, lx, ph) => {   // marteau pendulaire sur portique en pierre
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, false, d, lx);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv);
      for (const z of [-0.9, 0.9]) { const r = rope(L - 1.8); r.position.set(0, -(L - 1.8) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); head.add(bx(5.2, 4, 5.2, '#d9382c')); const band = bx(5.4, 0.9, 5.4, '#ffd23a'); band.position.y = 0.4; head.add(band); const cap = bx(5.6, 0.8, 5.6, '#23262b'); cap.position.y = -2.2; head.add(cap); const eye = new T3.Mesh(new T3.TorusGeometry(0.5, 0.15, 8, 14), matS('#3a3d44')); eye.position.y = 2.3; head.add(eye); const steel = bx(5.5, 0.5, 5.5, '#9aa0aa'); steel.position.y = -0.9; head.add(steel);
      for (const sg of [-1, 1]) blob(g, sg * 14, 0, 11, 11); const hsh = blob(g, 0, 0, 8, 8);
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.2 + ph); hsh.position.x = L * Math.sin(piv.rotation.z); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4) return false; const a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); return Math.hypot(l.x - hx, l.y - hy) < 2.7 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.45 + RR; });
    };
    const logp = (d, lx, ph) => {   // tronc pendulaire sur chevalet de bois
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, true, d, lx);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv);
      for (const z of [-2.6, 2.6]) { const r = rope(L - 1.4); r.position.set(0, -(L - 1.4) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const log = cy(1.7, 1.7, 8, '#6b4a2a', 10); log.rotation.x = Math.PI / 2; head.add(log); for (const z of [-3.2, 0, 3.2]) { const band = cy(1.85, 1.85, 0.5, '#3a3a3a', 10); band.rotation.x = Math.PI / 2; band.position.z = z; head.add(band); }
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.9 + ph); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos), a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); if (Math.abs(l.z) > 4.2 + RR) return false; return Math.hypot(l.x - hx, l.y - hy) < 2.0 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.5 + RR; });
    };
    const windmill = (d, lx, dir) => {   // moulin a vent en pierre : tour a bandes, toit en bois, ailes tournantes face a la fusee
      const g = mk(d, lx), H = 17; blob(g, 0, 0, 17, 17); I.boxes.push([d - 5.6, d + 5.6, lx * sx - 5.6, lx * sx + 5.6, 0, H + 1], [d - 4.4, d + 4.4, lx * sx - 4.4, lx * sx + 4.4, H + 1, H + 4.5]);
      const tw = cy(3.6, 5.6, H, STONE[0], 14); tw.position.y = H / 2; g.add(tw);
      for (let k = 0; k < 5; k++) { const ring = cy(4.4 - k * 0.42, 4.6 - k * 0.42, 0.7, STONE[(k + 1) % 3], 14); ring.position.y = 2.2 + k * 3.2; g.add(ring); }
      const door = bx(2.6, 4, 0.8, WOODD); door.position.set(0, 2, 5); g.add(door);
      const roof = new T3.Mesh(new T3.ConeGeometry(4.4, 4.2, 14), mat('#8a3b2a')); roof.position.y = H + 2.1; g.add(roof);
      const hub = new T3.Group(); hub.position.set(0, H - 1, -4.4); g.add(hub); const hc = cy(1.4, 1.4, 2.4, WOODD, 10); hc.rotation.x = Math.PI / 2; hub.add(hc);
      const blades = new T3.Group(); blades.position.z = -1.4; hub.add(blades);
      for (let k = 0; k < 4; k++) { const arm = new T3.Group(); arm.rotation.z = k * Math.PI / 2; const sp = bx(0.9, 13.5, 0.7, WOOD); sp.position.y = 7.4; arm.add(sp); for (let j = 0; j < 5; j++) { const sl = bx(3.4, 0.5, 0.5, '#d8c79a'); sl.position.set(1.9, 3.4 + j * 2.4, 0.2); arm.add(sl); } const sail = bx(3.2, 10, 0.2, '#e8dcc0'); sail.position.set(2.2, 8, 0.1); arm.add(sail); blades.add(arm); }
      ups.push((t) => { blades.rotation.z = -dir * t * 0.95; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos), hy = H - 1, hz = -(4.4 + 1.4);
        if (l.y < H + 1 && Math.hypot(l.x, l.z) < 5.6 + RR && l.y > -2) return true;
        if (Math.abs(l.z - hz) > 1.5 + RR) return false; const dx = l.x, dy = l.y - hy, r = Math.hypot(dx, dy); if (r < 2.4 + RR) return true; if (r > 14.2 + RR) return false;
        const a = Math.atan2(dy, dx) - (blades.rotation.z + Math.PI / 2); for (let k = 0; k < 4; k++) { const da = a - k * Math.PI / 2, ang = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.cos(ang) > 0 && r * Math.abs(Math.sin(ang)) < 1.5 + RR) return true; } return false; });
    };
    const sweeper = (d, lx, ph, dir) => {   // barre tournante sur un mat de pierre (axe vertical) : deux grandes pales
      const g = mk(d, lx), R = 14.5, h0 = 3.5, h1 = 18.5; blob(g, 0, 0, 10, 10); I.boxes.push([d - 2.8, d + 2.8, lx * sx - 2.8, lx * sx + 2.8, 0, h1 + 3]);
      const pole = cy(2.2, 3.0, h1 + 3, STONE[1], 14); pole.position.y = (h1 + 3) / 2; g.add(pole); for (let k = 0; k < 3; k++) { const b2 = cy(3.4, 3.4, 0.7, STONE[(k + 2) % 3], 14); b2.position.y = 2 + k * 6; g.add(b2); }
      const rot = new T3.Group(); rot.position.y = 0; g.add(rot);
      for (const s of [-1, 1]) { const blade = bx(R, h1 - h0, 1.6, s > 0 ? '#ff4f9a' : '#ffd23a'); blade.position.set(s * (R / 2 + 2), (h0 + h1) / 2, 0); rot.add(blade); const cap = bx(2.2, h1 - h0 + 0.6, 2.2, '#23262b'); cap.position.set(s * (R + 2), (h0 + h1) / 2, 0); rot.add(cap); }
      ups.push((t) => { rot.rotation.y = dir * t * 0.7 + ph; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (l.y < h0 - RR || l.y > h1 + RR + 3) return false; if (Math.hypot(l.x, l.z) < 2.5 + RR) return true; const th = rot.rotation.y, t = l.x * Math.cos(th) - l.z * Math.sin(th), pr = Math.abs(l.x * Math.sin(th) + l.z * Math.cos(th)); return Math.abs(t) < R + 2.2 + RR && pr < 0.8 + RR && Math.abs(t) > 2; });
    };
    const cannon = (d, lx, side0, ph) => {
      const side = Math.sign(lx) * sx; I.boxes.push([d - 4, d + 4, lx * sx - 3.6, lx * sx + 3.6, 0, 3.6], [d - 1.8, d + 1.8, Math.min(lx * sx, lx * sx - side * 7.2) - 1, Math.max(lx * sx, lx * sx - side * 7.2) + 1, 3.4, 10.5]);   // l'affut et le fut sont solides   // canon sur un affut en pierre : recul, flamme et fumee au tir ; le rocher part de la bouche et retombe de l'autre cote (ombre d'avertissement)
      const g = mk(d, lx), base = stoneBlock(7, 3, 8, 1); base.position.y = 1.5; g.add(base); blob(g, 0, 0, 12, 13);
      for (let k = 0; k < 2; k++) { const b2 = stoneBlock(7.4, 0.6, 8.4, k + 2); b2.position.y = 3.2 + k * 0.01; g.add(b2); }
      const brl = new T3.Group(); brl.position.set(0, 4.8, 0); brl.rotation.z = side * 0.6; g.add(brl); const tube = new T3.Group(); brl.add(tube);
      const bar = cy(1.5, 1.9, 8, '#4c5560', 12); bar.rotation.z = Math.PI / 2; bar.position.x = side * 3.4; tube.add(bar);
      for (const xx of [0.8, 3.4, 6.2]) { const rg2 = cy(2.05, 2.05, 0.7, '#23262b', 12); rg2.rotation.z = Math.PI / 2; rg2.position.x = side * xx; tube.add(rg2); }
      const mz = cy(1.1, 1.1, 0.3, '#111111', 12); mz.rotation.z = Math.PI / 2; mz.position.x = side * 7.9; tube.add(mz);
      for (const s2 of [-1, 1]) { const wh = cy(2.2, 2.2, 0.8, WOODD, 14); wh.rotation.x = Math.PI / 2; wh.position.set(0, 2.2, s2 * 4.4); g.add(wh); const hub = cy(0.7, 0.7, 1.0, '#23262b', 8); hub.rotation.x = Math.PI / 2; hub.position.set(0, 2.2, s2 * 4.4); g.add(hub); }
      const flash = new T3.Mesh(new T3.SphereGeometry(1.6, 10, 8), new T3.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.9 })); flash.position.x = side * 9; tube.add(flash); flash.visible = false;
      const rock = new T3.Mesh(new T3.IcosahedronGeometry(3.6, 1), mat('#8a8070')), mark = new T3.Mesh(new T3.RingGeometry(3, 4.6, 24), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.7, side: T3.DoubleSide })); mark.rotation.x = -Math.PI / 2; grp.add(rock, mark); rock.visible = mark.visible = false;
      const P = 3.6, FL = 1.7, st0 = new T3.Vector3(), mzv = new T3.Vector3(); let live = null, lastK = null, fired = false;
      ups.push((t) => { const k = (t + ph) % P, u = k / FL;
        if (lastK === null) lastK = k;
        if (k < lastK) { fired = true; g.updateMatrixWorld(true); mzv.set(side * 8.6, 0, 0); tube.localToWorld(mzv); st0.copy(mzv); const fx = CC.game && CC.game.effects; try { fx.smokePuff(mzv.clone(), new T3.Vector3(0, 2, 0), 2.4, 1.6); fx.flash(mzv.clone(), '#ffe2a8', 6, 80, 0.25, '#ffb030'); CC.game.audio.play('boomSmall', mzv.clone()); } catch (e) { /* effets */ } }
        lastK = k; tube.position.x = -side * 1.7 * Math.exp(-k * 6); flash.visible = k < 0.12;
        const tl = -side * Math.abs(lx) * 0.55, wp = T.at(d, tl, I.bank(d) * tl);
        mark.visible = fired && k < FL; mark.position.set(wp[0], wp[1] + 0.2, wp[2]); mark.scale.setScalar(0.7 + 0.5 * (1 - Math.min(1, k / FL)));
        if (fired && u >= 0 && u < 1) { rock.position.set(lerp(st0.x, wp[0], u), lerp(st0.y, wp[1] + 3, u) + 10 * u * (1 - u), lerp(st0.z, wp[2], u)); rock.rotation.x = t * 5; rock.visible = true; live = rock.position; } else { rock.visible = false; live = null; } });
      addHit(d, (pos) => !!live && pos.distanceTo(live) < 3.3 + RR);
    };
    const gateRow = (d, lx, n, ph) => {   // rangee de herses : n ouvertures ; chaque herse monte et descend ; elle ne descend JAMAIS sur la fusee qui approche
      const g = mk(d, lx), HWL = 23, OW = 15, tot = n * OW, panels = [], lt = [], posts = [];
      for (let i = 0; i <= n; i++) blob(g, (i - n / 2) * OW, 0, 7, 8);
      for (let i = 0; i <= n; i++) { const x = (i - n / 2) * OW, post = bx(3, HWL, 3.2, i % 2 ? '#a8402e' : '#f0e6d0'); post.position.set(x, HWL / 2, 0); g.add(post); posts.push(x); const cap = bx(3.6, 1, 3.6, '#23262b'); cap.position.set(x, HWL + 0.5, 0); g.add(cap); }
      const lintel = bx(tot + 3, 2.2, 3.4, WOODD); lintel.position.y = HWL + 1.2; g.add(lintel); I.boxes.push([d - 1.8, d + 1.8, lx * sx - tot / 2 - 1.6, lx * sx + tot / 2 + 1.6, HWL, HWL + 2.4]);
      for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * OW, pn = new T3.Group(); const panel = bx(OW - 3.2, HWL - 1, 1.2, '#ff4f9a'); panel.position.y = (HWL - 1) / 2; pn.add(panel); for (let k = 0; k < 4; k++) { const st = bx(OW - 3.2, 0.9, 1.3, k % 2 ? '#ffffff' : '#2a2540'); st.position.y = 0.6 + k * 0.9; pn.add(st); } pn.position.x = x; g.add(pn); panels.push({ pn, x }); lt.push(ph + i * 1.7); }
      const PER = 7.2, yb = (k) => (k < 0.3 ? 0 : k < 0.42 ? 21 * (k - 0.3) / 0.12 : k < 0.82 ? 21 : 21 * (1 - (k - 0.82) / 0.18)); let last = 0;
      ups.push((t, rp) => { const dt = Math.max(0, Math.min(0.2, t - last)); last = t; const lc = rp ? loc(g, rp) : null;
        panels.forEach((p, i) => { let k = (lt[i] / PER) % 1; const near = lc && lc.z > -55 && lc.z < 5 && Math.abs(lc.x - p.x) < OW * 0.8; if (!(near && k >= 0.78 && k < 1)) lt[i] += dt; k = (lt[i] / PER) % 1; p.y = yb(k); p.pn.position.y = p.y; });
        g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (l.y < -2 || l.y > HWL + 2) return false;
        for (const x of posts) if (Math.abs(l.x - x) < 1.5 + RR && Math.abs(l.z) < 1.7 + RR) return true;
        if (Math.abs(l.z) > 0.6 + RR) return false; for (const p of panels) if (Math.abs(l.x - p.x) < (OW - 3.2) / 2 + RR && l.y + RR > p.y && l.y - RR < p.y + HWL - 1) return true; return false; });
    };
    const S = (name) => STARTS[SEC.findIndex((s) => s.n === name)];
    if (I.map === 'range') {   // un seul obstacle par section (le champ de tir : les ennemis ; la falaise : le hangar)
      { const s = S('montee'); gateRow(s + 80, 0, 5, 0.4); gateRow(s + 160, 0, 5, 3.0); }
      { const s = S('canons'); for (let k = 0; k < 8; k++) { const side = k % 2 ? 1 : -1; cannon(s + 40 + k * 24, side * 38, side, k * 0.8); } }
      { const s = S('incline'); hammer(s + 70, -15, 0); hammer(s + 70, 15, 1.7); hammer(s + 135, -15, 0.9); hammer(s + 135, 15, 2.6); }
      { const s = S('pont'); sweeper(s + 55, 0, 0, 1); sweeper(s + 125, 0, 1.6, -1); }
      { const s = S('citadelle'); gateRow(s + 110, 0, 5, 0.4); }
    } else {
    { const s = S('marteaux'); hammer(s + 70, -30, 0); hammer(s + 70, 0, 1.6); hammer(s + 70, 30, 3.2); hammer(s + 118, -15, 0.8); hammer(s + 118, 15, 2.4); }
    { const s = S('pont'); sweeper(s + 45, 0, 0, 1); sweeper(s + 100, 0, 1.6, -1); }
    { const s = S('canons'); for (let k = 0; k < 6; k++) { const side = k % 2 ? 1 : -1; cannon(s + 22 + k * 22, side * 38, side, k * 0.55); } }
    { const s = S('divise'); hammer(s + 62, -26, 0); hammer(s + 100, -26, 1.9); gateRow(s + 70, 26, 2, 0.5); gateRow(s + 118, 26, 2, 3.1); }
    { const s = S('incline'); windmill(s + 62, -24, 1); windmill(s + 62, 24, -1); windmill(s + 122, 0, 1); }
    { const s = S('remonte'); logp(s + 55, -30, 0); logp(s + 55, 0, 1.4); logp(s + 55, 30, 2.8); logp(s + 105, -15, 0.7); logp(s + 105, 15, 2.1); }
    { const s = S('gate'); gateRow(s + 60, 0, 5, 0); gateRow(s + 116, 0, 5, 2.4); }
    }
    return { update: (t, rp) => { for (const f of ups) f(t, rp); }, hits };
  };

  let _tex = null;
  const bannerTex = () => _tex || (_tex = (() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#7a3cf0'); gr.addColorStop(1, '#2f8cff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 160); g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 148, 512, 12);
    g.fillStyle = '#ffffff'; g.font = '800 62px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COLD IMPACT', 256, 62); g.fillStyle = '#ffd23a'; g.font = '800 46px Arial, sans-serif'; g.fillText('CUP', 256, 116);
    const t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t;
  })());
  const pole = (h, col) => new T3.Mesh(new T3.CylinderGeometry(0.28, 0.4, h, 8), new T3.MeshLambertMaterial({ color: col }));
  const _stex = {};
  const signTex = (text) => _stex[text] || (_stex[text] = (() => { const cv = document.createElement('canvas'); cv.width = 320; cv.height = 112; const g = cv.getContext('2d'); g.fillStyle = '#f2c230'; g.fillRect(0, 0, 320, 112); g.fillStyle = '#1d1e22'; for (let k = -2; k < 12; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 16, 0); g.lineTo(k * 32 + 16 - 24, 14); g.lineTo(k * 32 - 24, 14); g.fill(); g.beginPath(); g.moveTo(k * 32, 112); g.lineTo(k * 32 + 16, 112); g.lineTo(k * 32 + 16 - 24, 98); g.lineTo(k * 32 - 24, 98); g.fill(); }
    g.fillStyle = '#111114'; g.fillRect(10, 20, 300, 72); g.fillStyle = '#ffd23a'; g.textAlign = 'center'; g.textBaseline = 'middle'; let px = 58; g.font = '800 ' + px + 'px Arial, sans-serif'; while (g.measureText(text).width > 280 && px > 20) { px -= 4; g.font = '800 ' + px + 'px Arial, sans-serif'; } g.fillText(text, 160, 57);
    const t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t; })());
  E.buildIsle = (T, C, grp) => {
    const I = C.isle, out = { isle: true, blocks: [], obst: [] };
    grp.add(bodyMesh(T, C)); grp.add(ocean(T, C)); grp.add(decals(T, C)); grp.add(rails(T, C));
    const bm = new T3.MeshBasicMaterial({ map: bannerTex(), side: T3.DoubleSide, fog: false });
    const place = (d, lx, objs) => { const y = T.base(d), bk = I.bank(d), p = T.at(d, lx, bk * lx), q = T.at(d + 3, lx, bk * lx), g = new T3.Group(); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); grp.add(g); for (const o of objs) g.add(o); return g; };
    for (let d = 100; d < C.len - 40; d += 75) for (const sg of [-1, 1]) {   // poteaux de course : un drapeau « COLD IMPACT CUP » tourne vers la fusee qui arrive
      const w = I.W(d); if (w < 20) continue; const po = pole(11, '#e8e8f0'), fl = new T3.Mesh(new T3.PlaneGeometry(6.4, 2), bm); po.position.y = 5.5; fl.position.set(-sg * 3.3, 9.6, 0); fl.rotation.y = Math.PI;
      place(d, sg * (w - 3), [po, fl]); { const bl = sg * (w - 3), fc = bl + sg * 3.3; I.boxes.push([d - 0.5, d + 0.5, bl - 0.5, bl + 0.5, 0, 11], [d - 1.1, d + 1.1, fc - 3.2, fc + 3.2, 8.6, 10.7]); }   // solides
    }
    { const pl = [pole(40, '#ffd23a'), pole(40, '#ffd23a')], ban = new T3.Mesh(new T3.PlaneGeometry(38, 11.8), bm); pl[0].position.set(19.5, 20, 0); pl[1].position.set(-19.5, 20, 0); ban.position.set(0, 34, 0); ban.rotation.y = Math.PI; place(-6, 0, [pl[0], pl[1], ban]); }   // l'arche de depart
    { const sd = (n) => STARTS[SEC.findIndex((q) => q.n === n)];
      const SG = I.map === 'range' ? [['CIBLES', sd('tir') - 40], ['HANGAR', sd('falaise') - 25], ['HERSES', sd('montee')], ['CANONS', sd('canons') - 40], ['MARTEAUX', sd('incline') - 10], ['PALES', sd('pont') - 25], ['HERSES', sd('citadelle') + 30]]
        : [['MARTEAUX', sd('marteaux') - 10], ['PALES', sd('pont') - 35], ['CANONS', sd('canons') - 58], ['DEUX VOIES', sd('divise') - 18], ['MOULINS', sd('incline') - 18], ['TRONCS', sd('remonte') - 25], ['HERSES', sd('gate') - 20]];
      for (const [txt, dd] of SG) for (const sg of [-1, 1]) { const w = I.W(dd); if (w < 16) continue; const po = pole(10, '#2a2b30'), pn = new T3.Mesh(new T3.PlaneGeometry(10, 3.5), new T3.MeshBasicMaterial({ map: signTex(txt), side: T3.DoubleSide, fog: false })); po.position.y = 5; pn.position.set(0, 9.4, 0); pn.rotation.y = Math.PI; place(dd, sg * (w - 5.5), [po, pn]); } }
    const ob = obstacles(T, C, grp); out.update = ob.update; out.hits = ob.hits;
    return out;
  };
})();
