/* v374 : L'ILE 1 refaite comme un VRAI parcours de course (inspire des jeux de course a obstacles) : 9 sections, chacune avec sa couleur et son obstacle, REPETE en rangee ;
 * largeur qui change (arenes larges, pont etroit), voies separees par un muret gonflable, pente forte, une remontee, une section inclinee ;
 * sol = surfaces de couleur unie avec marquages (herbe seulement en decor autour du hangar) ; rambardes = piles de disques gonflables ; aucun arbre ni pierre ;
 * obstacles mobiles ACCROCHES a des structures (portiques, tours, mats, canons) ; la porte-herse ne descend jamais sur la fusee qui approche. Aucune texture (couleurs unies, un drapeau). */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mkCourse) return;
  const T3 = THREE, U = CC.U, Z = CC.Zones, D = Z && Z.defs && Z.defs.campagne; if (!D) return;
  const FLY = 11, TOP = 9, S0 = -125;
  const PAL = { blue: '#3aa6f0', pink: '#ff6fae', teal: '#42d6a4', yellow: '#ffc24a', purple: '#a77bff' };
  // les sections : nom, longueur, virage (+ droite), pente (descente ; negatif = on remonte), demi-largeur de l'ile, couleur du sol, inclinaison laterale
  const SEC = [
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
  E.isleShape = SEC.map((s, i) => [s.len, s.turn, s.slope, FLY, i === SEC.length - 1 ? 24 : 17, TOP]);
  const STARTS = []; { let a = 0; for (const s of SEC) { STARTS.push(a); a += s.len; } }
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
  E.mkIsle = (shape, variant) => {
    const C = E.mkCourse(shape, { fl: FLY, sw: 6 }), dEnd = C.len + 90, mir = variant === 1, W = mkW(dEnd);
    C.isle = { variant: variant || 0, mir, W, dEnd, starts: STARTS, bank: (d) => (mir ? -1 : 1) * blend(d, 'bank', 0), PY: C.rel(C.len) - 90, sx: variant === 2 ? -1 : 1 };
    try { CC.CONFIG.render.viewDist = 480; } catch (e) { /* ignore */ }   // on voit les obstacles de plus loin
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
      // plus de hangar : le depart est une plateforme de lancement
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
    'uniform float uTime; uniform vec3 uSun; varying vec3 vW;', '#include <fog_pars_fragment>',
    'float hgt(vec2 p) { return sin(p.x * 0.045 + uTime * 0.9) * 0.5 + sin(p.y * 0.06 - uTime * 0.7) * 0.4 + sin((p.x + p.y) * 0.11 + uTime * 1.4) * 0.25 + sin((p.x * 0.7 - p.y) * 0.21 - uTime * 2.0) * 0.14 + sin((p.x - p.y * 0.6) * 0.47 + uTime * 2.6) * 0.07; }',
    'void main() {', '  vec2 p = vW.xz; float e = 0.7, h0 = hgt(p);',
    '  vec3 n = normalize(vec3(-(hgt(p + vec2(e, 0.0)) - h0) * 1.5, 1.0, -(hgt(p + vec2(0.0, e)) - h0) * 1.5));',
    '  vec3 V = normalize(cameraPosition - vW); float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
    '  vec3 deep = vec3(0.05, 0.36, 0.66), shallow = vec3(0.20, 0.68, 0.86), sky = vec3(0.70, 0.88, 0.98);',
    '  vec3 col = mix(deep, shallow, clamp(0.5 + h0 * 0.35, 0.0, 1.0)); col = mix(col, sky, fres * 0.7);',
    '  vec3 R = reflect(-uSun, n); col += vec3(1.0, 0.96, 0.82) * pow(max(dot(R, V), 0.0), 80.0) * 1.3;',
    '  float crest = smoothstep(0.62, 1.0, h0 * 0.5 + 0.5 + sin(p.x * 0.31 + p.y * 0.23 + uTime * 1.3) * 0.06); col = mix(col, vec3(1.0), crest * 0.4);',
    '  gl_FragColor = vec4(col, 1.0);', '#include <fog_fragment>', '}'].join('\n');
  const ocean = (T, C) => {
    const I = C.isle, geo = new T3.PlaneGeometry(6000, 6000, 1, 1); geo.rotateX(-Math.PI / 2);
    let sx = 0, sz = 0, n = 0; for (let d = 0; d < I.dEnd; d += 60) { const q = T.at(d, 0, 0); sx += q[0]; sz += q[2]; n++; } sx /= n; sz /= n;
    const uni = T3.UniformsUtils.merge([T3.UniformsLib.fog, { uTime: { value: 0 }, uSun: { value: new T3.Vector3(0.35, 0.8, 0.5).normalize() } }]);
    const m = new T3.Mesh(geo, new T3.ShaderMaterial({ uniforms: uni, vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, fog: true }));
    m.position.set(sx, I.PY, sz); m.frustumCulled = false; m.onBeforeRender = () => { uni.uTime.value = performance.now() / 1000; }; return m;
  };

  // ---- marquages au sol (bandes de section, tirets, chevrons) et rambardes gonflables (piles de disques) ----
  const decals = (T, C) => {
    const I = C.isle, pos = [], col = [], idx = [], tc = new T3.Color();
    const P = (d, lx) => T.at(d, lx, I.bank(d) * lx + 0.09);
    const quad = (a, b, c, d2, hex) => { const o = pos.length / 3; for (const p of [a, b, c, d2]) pos.push(p[0], p[1], p[2]); tc.set(hex); for (let k = 0; k < 4; k++) col.push(tc.r, tc.g, tc.b); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); };
    STARTS.forEach((s, i) => { if (i === 0) return; const w = I.W(s) - 2.2; for (let k = 0; k < 4; k++) { const d0 = s + 0.5 + k * 1.9; quad(P(d0, -w), P(d0, w), P(d0 + 1.9, w), P(d0 + 1.9, -w), k % 2 ? '#2a2540' : '#ffffff'); } });   // la bande rayee qui marque chaque nouvelle section
    for (let d = 14; d < C.len - 6; d += 10) quad(P(d, -0.5), P(d, 0.5), P(d + 5, 0.5), P(d + 5, -0.5), '#ffffff');   // tirets au centre
    STARTS.forEach((s, i) => { const d = s + (i === 0 ? 60 : 30), n = Math.max(1, Math.floor(I.W(d) / 14)); for (let j = 0; j < n; j++) { const lx = (j - (n - 1) / 2) * 15;   // chevrons « par ici »
      quad(P(d, lx - 3.4), P(d + 1.7, lx - 3.4), P(d + 6.2, lx), P(d + 4.5, lx), '#ffffff'); quad(P(d + 4.5, lx), P(d + 6.2, lx), P(d + 1.7, lx + 3.4), P(d, lx + 3.4), '#ffffff'); } });
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, side: T3.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.frustumCulled = false; return m;
  };
  const rails = (T, C) => {
    const I = C.isle, list = [], CY = ['#ff3b4d', '#ff9a1f', '#ff3b4d'];
    for (let d = S0 + 12; d < I.dEnd - 10; d += 4) { const w = I.W(d) - 1.2; if (w < 8) continue; for (const sg of [-1, 1]) list.push([d, sg * w, 1, ((d / 4) | 0) % 5 === 0 ? 1 : 0]); }
    const dv = STARTS[4]; for (let d = dv + 24; d < dv + 150; d += 3.6) list.push([d, 0, 1.15, 2]);   // le muret central qui separe les deux voies
    for (const d of [104, 118]) for (let lx = -50 + (d === 118 ? 8 : 0); lx <= 50; lx += 16) list.push([d, lx, 1.6, 3]);   // les gros coussins de la ligne de depart
    const geo = new T3.CylinderGeometry(1.15, 1.15, 0.8, 12), im = new T3.InstancedMesh(geo, new T3.MeshLambertMaterial({ color: '#ffffff' }), list.length * 3), dm = new T3.Object3D(), cc = new T3.Color(); let n = 0;
    for (const [d, lx, sc, kind] of list) for (let k = 0; k < 3; k++) {
      const p = T.at(d, lx, I.bank(d) * lx + (0.4 + k * 0.8) * sc); dm.position.set(p[0], p[1], p[2]); dm.scale.set(sc, sc, sc); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix);
      cc.set(kind === 1 ? '#ffffff' : kind === 2 ? (k % 2 ? '#ffffff' : '#ff6fae') : kind === 3 ? (k % 2 ? '#ffffff' : '#ff8a1f') : CY[k]); im.setColorAt(n, cc); n++;
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; return im;
  };

  // ---- les obstacles mobiles : chacun accroche a une structure ; collision en repere de la structure (x = gauche, y = hauteur, z = devant) ----
  const mat = (c) => new T3.MeshLambertMaterial({ color: c, flatShading: true });
  const bx = (w, h, d, c) => new T3.Mesh(new T3.BoxGeometry(w, h, d), mat(c));
  const cy = (rt, rb, h, c, n) => new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, n || 10), mat(c));
  const STONE = ['#a39a8a', '#948b7c', '#b2a999'], WOOD = '#7a5634', WOODD = '#5b3f25';
  const _v = new T3.Vector3(), RR = 0.95;   // RR : rayon de la fusee
  const segDist = (px, py, ax, ay, bx2, by2) => { const dx = bx2 - ax, dy = by2 - ay, l2 = dx * dx + dy * dy || 1, t = U.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); };
  const obstacles = (T, C, grp) => {
    const I = C.isle, ups = [], hits = [], sx = I.sx, addHit = (d, f) => { f.d = d; hits.push(f); };
    const mk = (d, lx) => { const L = lx * sx, bk = I.bank(d), p = T.at(d, L, bk * L), q = T.at(d + 3, L, bk * L), g = new T3.Group(); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); g.rotateZ(-Math.atan(bk)); grp.add(g); g.updateMatrixWorld(true); return g; };
    const loc = (g, pos) => g.worldToLocal(_v.copy(pos));
    const stoneBlock = (w, h, d, i) => bx(w, h, d, STONE[i % 3]);
    const gantry = (g, span, top, wood) => {   // portique : deux piliers (pierre a bandes ou bois), une poutre a bandes jaunes et noires
      for (const s of [-1, 1]) { const col = wood ? bx(2.2, top + 1, 2.2, WOOD) : stoneBlock(4, top + 1, 4, 0); col.position.set(s * span, (top + 1) / 2, 0); g.add(col); if (!wood) for (let k = 0; k < 4; k++) { const band = stoneBlock(4.4, 0.7, 4.4, k + 1); band.position.set(s * span, 3 + k * 5.5, 0); g.add(band); } const foot = bx(5.4, 1.2, 5.4, wood ? WOODD : '#7c7468'); foot.position.set(s * span, 0.6, 0); g.add(foot); }
      const beam = bx(2 * span + 5, 2, 2.6, wood ? WOOD : '#8a8174'); beam.position.y = top + 0.5; g.add(beam);
      for (let k = -2; k <= 2; k++) { const sp = bx(2.6, 2.04, 2.64, k % 2 ? '#ffd23a' : '#23262b'); sp.position.set(k * 5.6, top + 0.5, 0); if (Math.abs(k * 5.6) < span + 1) g.add(sp); }
    };
    const hammer = (d, lx, ph) => {   // marteau pendulaire sur portique en pierre
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, false);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv);
      for (const z of [-0.9, 0.9]) { const r = bx(0.3, L - 1.8, 0.3, '#1a1a1a'); r.position.set(0, -(L - 1.8) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); head.add(bx(5.2, 4, 5.2, '#d9382c')); const band = bx(5.4, 0.9, 5.4, '#ffd23a'); band.position.y = 0.4; head.add(band); const cap = bx(5.6, 0.8, 5.6, '#23262b'); cap.position.y = -2.2; head.add(cap);
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.2 + ph); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4) return false; const a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); return Math.hypot(l.x - hx, l.y - hy) < 2.7 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.45 + RR; });
    };
    const logp = (d, lx, ph) => {   // tronc pendulaire sur chevalet de bois
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, true);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv);
      for (const z of [-2.6, 2.6]) { const r = bx(0.35, L - 1.4, 0.35, '#2a2118'); r.position.set(0, -(L - 1.4) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const log = cy(1.7, 1.7, 8, '#6b4a2a', 10); log.rotation.x = Math.PI / 2; head.add(log); for (const z of [-3.2, 0, 3.2]) { const band = cy(1.85, 1.85, 0.5, '#3a3a3a', 10); band.rotation.x = Math.PI / 2; band.position.z = z; head.add(band); }
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.9 + ph); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos), a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); if (Math.abs(l.z) > 4.2 + RR) return false; return Math.hypot(l.x - hx, l.y - hy) < 2.0 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.5 + RR; });
    };
    const windmill = (d, lx, dir) => {   // moulin a vent en pierre : tour a bandes, toit en bois, ailes tournantes face a la fusee
      const g = mk(d, lx), H = 17;
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
      const g = mk(d, lx), R = 14.5, h0 = 3.5, h1 = 18.5;
      const pole = cy(2.2, 3.0, h1 + 3, STONE[1], 14); pole.position.y = (h1 + 3) / 2; g.add(pole); for (let k = 0; k < 3; k++) { const b2 = cy(3.4, 3.4, 0.7, STONE[(k + 2) % 3], 14); b2.position.y = 2 + k * 6; g.add(b2); }
      const rot = new T3.Group(); rot.position.y = 0; g.add(rot);
      for (const s of [-1, 1]) { const blade = bx(R, h1 - h0, 1.6, s > 0 ? '#ff4f9a' : '#ffd23a'); blade.position.set(s * (R / 2 + 2), (h0 + h1) / 2, 0); rot.add(blade); const cap = bx(2.2, h1 - h0 + 0.6, 2.2, '#23262b'); cap.position.set(s * (R + 2), (h0 + h1) / 2, 0); rot.add(cap); }
      ups.push((t) => { rot.rotation.y = dir * t * 0.7 + ph; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (l.y < h0 - RR || l.y > h1 + RR + 3) return false; if (Math.hypot(l.x, l.z) < 2.5 + RR) return true; const th = rot.rotation.y, t = l.x * Math.sin(th) + l.z * Math.cos(th), pr = Math.abs(l.x * Math.cos(th) - l.z * Math.sin(th)); return Math.abs(t) < R + 2.2 + RR && pr < 0.8 + RR && Math.abs(t) > 2; });
    };
    const cannon = (d, lx, side, ph) => {   // canon rouge sur un affut en pierre ; tire un gros rocher en travers du chemin, avec une ombre d'avertissement au sol
      const g = mk(d, lx), base = stoneBlock(7, 3, 8, 1); base.position.y = 1.5; g.add(base);
      const brl = new T3.Group(); brl.position.set(0, 4.4, 0); brl.rotation.z = side * 0.6; g.add(brl);   // le canon penche vers le chemin
      const tube = cy(1.5, 1.9, 8, '#c8372b', 12); tube.rotation.z = Math.PI / 2; tube.position.x = side * 3.4; brl.add(tube); const ring = cy(2.1, 2.1, 0.8, '#23262b', 12); ring.rotation.z = Math.PI / 2; ring.position.x = side * 6.6; brl.add(ring);
      for (const s2 of [-1, 1]) { const wh = cy(2, 2, 0.8, WOODD, 12); wh.rotation.x = Math.PI / 2; wh.position.set(0, 2.2, s2 * 4.4); g.add(wh); }
      const rock = new T3.Mesh(new T3.IcosahedronGeometry(3.6, 1), mat('#8a8070')), mark = new T3.Mesh(new T3.RingGeometry(3, 4.6, 24), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.7, side: T3.DoubleSide })); mark.rotation.x = -Math.PI / 2; grp.add(rock, mark); rock.visible = mark.visible = false;
      const P = 3.6, FL = 1.7; let live = null;   // le rocher vole 1,7 s vers l'autre moitie du chemin
      ups.push((t) => { const k = (t + ph) % P, u = k / FL; const wp = T.at(d + 6, -side * Math.abs(lx) * sx * 0.55, I.bank(d + 6) * (-side * Math.abs(lx) * sx * 0.55));
        mark.visible = k < FL; mark.position.set(wp[0], wp[1] + 0.2, wp[2]); mark.scale.setScalar(0.7 + 0.5 * (1 - Math.min(1, k / FL)));
        if (u >= 0 && u < 1) { const st = T.at(d, lx * sx, I.bank(d) * lx * sx + 6); rock.position.set(lerp(st[0], wp[0], u), lerp(st[1], wp[1] + 3, u) + 10 * u * (1 - u), lerp(st[2], wp[2], u)); rock.rotation.x = t * 5; rock.visible = true; live = rock.position; } else { rock.visible = false; live = null; } });
      addHit(d, (pos) => !!live && pos.distanceTo(live) < 3.3 + RR);
    };
    const gateRow = (d, lx, n, ph) => {   // rangee de herses : n ouvertures ; chaque herse monte et descend ; elle ne descend JAMAIS sur la fusee qui approche
      const g = mk(d, lx), HWL = 23, OW = 15, tot = n * OW, panels = [], lt = [], posts = [];
      for (let i = 0; i <= n; i++) { const x = (i - n / 2) * OW, post = bx(3, HWL, 3.2, i % 2 ? '#a8402e' : '#f0e6d0'); post.position.set(x, HWL / 2, 0); g.add(post); posts.push(x); const cap = bx(3.6, 1, 3.6, '#23262b'); cap.position.set(x, HWL + 0.5, 0); g.add(cap); }
      const lintel = bx(tot + 3, 2.2, 3.4, WOODD); lintel.position.y = HWL + 1.2; g.add(lintel);
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
    { const s = S('marteaux'); hammer(s + 70, -30, 0); hammer(s + 70, 0, 1.6); hammer(s + 70, 30, 3.2); hammer(s + 118, -15, 0.8); hammer(s + 118, 15, 2.4); }
    { const s = S('pont'); sweeper(s + 45, 0, 0, 1); sweeper(s + 100, 0, 1.6, -1); }
    { const s = S('canons'); for (let k = 0; k < 6; k++) { const side = k % 2 ? 1 : -1; cannon(s + 22 + k * 22, side * 38, side, k * 0.55); } }
    { const s = S('divise'); hammer(s + 62, -26, 0); hammer(s + 100, -26, 1.9); gateRow(s + 70, 26, 2, 0.5); gateRow(s + 118, 26, 2, 3.1); }
    { const s = S('incline'); windmill(s + 62, -24, 1); windmill(s + 62, 24, -1); windmill(s + 122, 0, 1); }
    { const s = S('remonte'); logp(s + 55, -30, 0); logp(s + 55, 0, 1.4); logp(s + 55, 30, 2.8); logp(s + 105, -15, 0.7); logp(s + 105, 15, 2.1); }
    { const s = S('gate'); gateRow(s + 60, 0, 5, 0); gateRow(s + 116, 0, 5, 2.4); }
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
  E.buildIsle = (T, C, grp) => {
    const I = C.isle, out = { isle: true, blocks: [], obst: [] };
    grp.add(bodyMesh(T, C)); grp.add(ocean(T, C)); grp.add(decals(T, C)); grp.add(rails(T, C));
    const bm = new T3.MeshBasicMaterial({ map: bannerTex(), side: T3.DoubleSide, fog: false });
    const place = (d, lx, objs) => { const y = T.base(d), bk = I.bank(d), p = T.at(d, lx, bk * lx), q = T.at(d + 3, lx, bk * lx), g = new T3.Group(); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); grp.add(g); for (const o of objs) g.add(o); return g; };
    for (let d = 100; d < C.len - 40; d += 75) for (const sg of [-1, 1]) {   // poteaux de course : un drapeau « COLD IMPACT CUP » tourne vers la fusee qui arrive
      const w = I.W(d); if (w < 20) continue; const po = pole(11, '#e8e8f0'), fl = new T3.Mesh(new T3.PlaneGeometry(6.4, 2), bm); po.position.y = 5.5; fl.position.set(-sg * 3.3, 9.6, 0); fl.rotation.y = Math.PI;
      place(d, sg * (w - 3), [po, fl]);
    }
    { const pl = [pole(24, '#ffd23a'), pole(24, '#ffd23a')], ban = new T3.Mesh(new T3.PlaneGeometry(38, 11.8), bm); pl[0].position.set(19.5, 12, 0); pl[1].position.set(-19.5, 12, 0); ban.position.set(0, 20, 0); ban.rotation.y = Math.PI; place(-6, 0, [pl[0], pl[1], ban]); }   // l'arche de depart
    const ob = obstacles(T, C, grp); out.update = ob.update; out.hits = ob.hits;
    return out;
  };
})();
