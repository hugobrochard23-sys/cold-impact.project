/* v370 : L'ILE (archipel, ile 1) pour la course (?mvp=r) : une vraie ile qui flotte dans le ciel, au-dessus de la prairie tres loin dessous.
 * - on DEMARRE sur l'ile (lanceur et hangar dessus) ; elle fait ~25 s de vol : route en S, descente par paliers (marches de pierre), ruisseau, chemin de terre qui contraste avec l'herbe ;
 * - le sol de l'ile est le sol du jeu (belle herbe, arbres et rochers du jeu) : la piste est a 11 m au-dessus ; dessous : roche qui s'effile (couleurs unies, aucune texture) ;
 * - pas de murs : sortir de l'ile = on tombe (la fusee pique, direction molle, le controle revient en revenant sur l'ile) ; rater l'ile = la prairie = mort ;
 * - des poteaux « COLD IMPACT CUP » et une arche de depart ; aucun batiment sur la route (un hangar a cote du depart) ; zero obstacle pour l'instant. */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mkCourse) return;
  const T3 = THREE, U = CC.U, Z = CC.Zones, TR = CC.Trees, D = Z && Z.defs && Z.defs.campagne; if (!D || !TR) return;
  const FLY = 11, TOP = 9;   // hauteur de la piste au-dessus du sol de l'ile, hauteur de la zone de vol
  // route : [longueur, virage (+ droite), pente (descente), hauteur de vol, demi-largeur du chemin, hauteur de la zone]
  E.isleShape = [[130, 0, 0, FLY, 17, TOP], [150, 80, 0.09, FLY, 17, TOP], [22, 0, 0.32, FLY, 17, TOP], [160, -105, 0.09, FLY, 17, TOP], [150, 95, 0.09, FLY, 17, TOP], [22, 0, 0.32, FLY, 17, TOP], [160, -95, 0.09, FLY, 17, TOP], [140, 85, 0.09, FLY, 17, TOP], [22, 0, 0.32, FLY, 17, TOP], [120, -60, 0.09, FLY, 17, TOP], [120, 0, 0.08, FLY, 24, TOP]];   // l'ile descend en permanence (~110 m) et tourne beaucoup
  const S0 = -125, STREAMS = [330, 800];
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  // demi-largeur de l'ile le long de la route : bout arrondi au depart, large au depart, ondule ensuite, bout arrondi a l'arrivee
  const mkW = (dEnd) => (d) => {
    if (d <= S0 || d >= dEnd) return 0;
    let w = d < 120 ? 46 : 33 + 5 * Math.sin(d / 85) + 3 * Math.sin(d / 37 + 1) + (d < 260 ? 13 * (1 - (d - 120) / 140) : 0);
    if (d < -35) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d + 35) / (S0 + 35), 2)));
    if (d > dEnd - 70) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d - (dEnd - 70)) / 70, 2)));
    return w;
  };
  E.mkIsle = (shape) => {
    const C = E.mkCourse(shape, { fl: FLY, sw: 4 }), dEnd = C.len + 90, W = mkW(dEnd), risers = [];
    let a = 0; for (const s of shape) { if (s[2] >= 0.2) risers.push(a + s[0] * 0.5); a += s[0]; }
    C.isle = { W, dEnd, streams: STREAMS, risers, PY: C.rel(C.len) - 90 };   // PY : la prairie, tres loin dessous
    return C;
  };
  // la fusee est-elle dans la roche de l'ile ? (d : avance, x : lateral, y : hauteur absolue)
  const PROF = [[1, 0], [0.97, -1.4], [0.84, -8], [0.64, -18], [0.42, -30], [0.2, -42], [0, -52]];
  E.isleSolid = (C, T, d, x, y) => {
    const I = C.isle; if (!I) return false; const w = I.W(d); if (w <= 0) return false; const h = T.base(d) - y; if (h < 0.3 || h > 52) return false;
    let s = 0; for (let i = 1; i < PROF.length; i++) if (h <= -PROF[i][1]) { const p0 = PROF[i - 1], p1 = PROF[i]; s = p0[0] + (p1[0] - p0[0]) * (h + p0[1]) / (p1[1] - p0[1]); break; }
    return Math.abs(x) < w * s;
  };

  // ---- le decor de l'ile : scenes du jeu (herbe du sol du jeu, arbres et rochers du jeu, hangar en briques du jeu, ruisseau) ----
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const BR = ['#bba294', '#b09486', '#c4aa9c', '#ab9082'], RUST = ['#8a5a44', '#7a5a48', '#6a5240'], GR = ['#8d8a80', '#85837a', '#948f84', '#7e7b72'];
  const DIRT = new T3.Color('#b79a6b'), RIM = new T3.Color('#7d6a4a'), WATER = new T3.Color('#6fb4d8'), SAND = new T3.Color('#d9c48e');
  const tree = (S, dc, lx, r, h) => { const p = S.at(dc, lx, 0); if (r() < 0.45) TR.conifer(S.b, p[0], p[1], p[2], h, r, {}); else TR.broadleaf(S.b, p[0], p[1], p[2], h * 0.85, r, {}); };
  const rock = (S, dc, lx, s, r) => { const p = S.at(dc, lx, 0); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: pk(r, GR), noMoss: true }); };
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
  const sceneDef = {
    len: [300, 300], noDoor: true, noChaos: true, gw: 46,
    gwF: (d) => { const C = E.course; return C && C.isle ? C.isle.W(d) : 46; },   // le sol suit le contour de l'ile (zones_evo.js)
    ground: (d, lx, c) => {
      const C = E.course, I = C && C.isle; if (!I) return; const w = I.W(d), rd = 6 + 1.5 * Math.sin(d / 26), a = Math.abs(lx);
      if (a < rd + 1.2) c.copy(DIRT); else if (a < rd + 3.6) c.lerp(DIRT, 0.7 * (1 - (a - rd - 1.2) / 2.4));   // le chemin de terre : aucune herbe dessus, elle revient petit a petit
      for (const sd of I.streams) { const q = Math.abs(d - sd); if (q < 7) c.lerp(WATER, 0.9); else if (q < 11) c.lerp(SAND, 0.65 * (1 - (q - 7) / 4)); }
      if (a > w - 1.6) c.copy(RIM); else if (a > w - 4.5) c.lerp(RIM, (a - (w - 4.5)) / 2.9 * 0.7);   // le bord de l'ile : terre, plus d'herbe au-dela
    },
    build(S) {
      const C = E.course; if (!C || !C.isle) return; const I = C.isle;
      if (S.d0 <= 40 && S.d1 > 40) hangar(S, 40, -29);
      for (const sg of [-1, 1]) {
        S.rows(S.d0 + 4, Math.min(S.d1, I.dEnd - 20), 13, 0.9, (dc) => S.item(dc, (r) => {   // arbres du jeu : jamais sur le chemin, jamais au bord du vide
          const w = I.W(dc); if (w < 26) return; const lx = sg * r.between([Math.min(22, w - 11), Math.max(24, w - 6)]); if (dc > -10 && dc < 78 && sg < 0 && lx < -16) return; for (const sd of I.streams) if (Math.abs(dc - sd) < 14) return;
          tree(S, dc, lx, r, r.between([9, 16]));
        }));
        S.rows(S.d0 + 6, Math.min(S.d1, I.dEnd - 20), 23, 0.8, (dc) => S.item(dc, (r) => { const w = I.W(dc); if (w < 24) return; rock(S, dc, sg * r.between([w - 10, w - 3]), r.between([2, 4.5]), r); }));   // rochers de bord
      }
      for (const dr of I.risers) if (dr >= S.d0 && dr < S.d1) { const w = I.W(dr), n = Math.floor(w / 6); for (let k = -n; k <= n; k++) if (Math.abs(k * 6.2) > 15) S.item(dr + k * 0.01, (r) => rock(S, dr + 6, k * 6.2 + r.between([-1.5, 1.5]), r.between([1.8, 3]), r)); }   // les marches : une rangee de pierres en bas de chaque palier
      for (const sd of I.streams) if (sd >= S.d0 && sd < S.d1) Z.evoWaves(S, sd - 7, sd + 7, I.W(sd) - 1.5, C.rel(sd) + 0.2, 'waterSurf', '#7cc0e8', 0.4);
    },
  };
  for (let i = 0; i < 6; i++) D.scenes['crsI' + i] = Object.assign({}, sceneDef);
  E.isleScenes = Array.from({ length: 6 }, (_, i) => 'crsI' + i);

  // ---- ce qui n'est pas dans le decor du jeu : le dessous de l'ile, la prairie, les poteaux et l'arche ----
  const bodyMesh = (T, C) => {
    const I = C.isle, pos = [], col = [], rings = [], step = 6, ROCK = ['#9a8f80', '#85796b', '#6f655a', '#5c534b'], SOIL = '#7a5233', cc = new T3.Color();
    for (let d = S0; d <= I.dEnd + 0.1; d += step) {
      const w = I.W(d), y0 = T.base(d), ring = [];
      for (let k = 0; k < PROF.length; k++) for (const sg of (k === PROF.length - 1 ? [0] : [-1, 1])) {
        const jx = k < 2 ? 0 : (hash(d, k * 3 + sg) - 0.5) * 0.18, jy = k < 2 ? 0 : (hash(k, d + sg) - 0.5) * 4;
        const lx = sg * w * PROF[k][0] * (1 + jx), p = T.at(d, lx, PROF[k][1] + jy - (y0 - T.base(d)));
        ring.push({ k, sg, p });
      }
      rings.push(ring);
    }
    const push = (a, b, c, k) => { cc.set(k < 1 ? SOIL : ROCK[Math.min(3, Math.max(0, k - 1))]); const j = 1 + (hash(a.p[0], a.p[2]) - 0.5) * 0.28; for (const v of [a, b, c]) { pos.push(v.p[0], v.p[1], v.p[2]); col.push(cc.r * j, cc.g * j, cc.b * j); } };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1]; if (A.length !== B.length) continue;
      for (const sgn of [-1, 1]) {   // un cote a la fois : les anneaux sont [k=0 gauche, k=0 droite, k=1 gauche, ..., pointe]
        for (let k = 0; k < PROF.length - 1; k++) {
          const idx = (kk, s) => (kk === PROF.length - 1 ? A.length - 1 : kk * 2 + (s < 0 ? 0 : 1)), i0 = idx(k, sgn), i1 = idx(k + 1, sgn);
          push(A[i0], B[i0], A[i1], k); push(B[i0], B[i1], A[i1], k);
        }
      }
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; return m;
  };
  // l'ocean a perte de vue, tres loin dessous : vagues, reflets du ciel, soleil, ecume ; se fond dans la brume a l'horizon (shader sans texture)
  const OCEAN_VS = 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}';
  const OCEAN_FS = [
    'uniform float uTime; uniform vec3 uSun; varying vec3 vW;', '#include <fog_pars_fragment>',
    'float hgt(vec2 p) { return sin(p.x * 0.045 + uTime * 0.9) * 0.5 + sin(p.y * 0.06 - uTime * 0.7) * 0.4 + sin((p.x + p.y) * 0.11 + uTime * 1.4) * 0.25 + sin((p.x * 0.7 - p.y) * 0.21 - uTime * 2.0) * 0.14 + sin((p.x - p.y * 0.6) * 0.47 + uTime * 2.6) * 0.07; }',
    'void main() {',
    '  vec2 p = vW.xz; float e = 0.7, h0 = hgt(p);',
    '  vec3 n = normalize(vec3(-(hgt(p + vec2(e, 0.0)) - h0) * 1.5, 1.0, -(hgt(p + vec2(0.0, e)) - h0) * 1.5));',
    '  vec3 V = normalize(cameraPosition - vW); float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
    '  vec3 deep = vec3(0.05, 0.36, 0.66), shallow = vec3(0.20, 0.68, 0.86), sky = vec3(0.70, 0.88, 0.98);',
    '  vec3 col = mix(deep, shallow, clamp(0.5 + h0 * 0.35, 0.0, 1.0)); col = mix(col, sky, fres * 0.7);',
    '  vec3 R = reflect(-uSun, n); col += vec3(1.0, 0.96, 0.82) * pow(max(dot(R, V), 0.0), 80.0) * 1.3;',
    '  float crest = smoothstep(0.62, 1.0, h0 * 0.5 + 0.5 + sin(p.x * 0.31 + p.y * 0.23 + uTime * 1.3) * 0.06); col = mix(col, vec3(1.0), crest * 0.4);',
    '  gl_FragColor = vec4(col, 1.0);', '#include <fog_fragment>', '}'].join('\n');
  const prairie = (T, C) => {
    const I = C.isle, geo = new T3.PlaneGeometry(6000, 6000, 1, 1); geo.rotateX(-Math.PI / 2);
    let sx = 0, sz = 0, n = 0; for (let d = 0; d < I.dEnd; d += 60) { const q = T.at(d, 0, 0); sx += q[0]; sz += q[2]; n++; } sx /= n; sz /= n;
    const uni = T3.UniformsUtils.merge([T3.UniformsLib.fog, { uTime: { value: 0 }, uSun: { value: new T3.Vector3(0.35, 0.8, 0.5).normalize() } }]);
    const m = new T3.Mesh(geo, new T3.ShaderMaterial({ uniforms: uni, vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, fog: true }));
    m.position.set(sx, I.PY, sz); m.frustumCulled = false; m.onBeforeRender = () => { uni.uTime.value = performance.now() / 1000; }; return m;
  };
  let _tex = null;
  const bannerTex = () => _tex || (_tex = (() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#7a3cf0'); gr.addColorStop(1, '#2f8cff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 160); g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 148, 512, 12);
    g.fillStyle = '#ffffff'; g.font = '800 62px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COLD IMPACT', 256, 62); g.fillStyle = '#ffd23a'; g.font = '800 46px Arial, sans-serif'; g.fillText('CUP', 256, 116);
    const t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t;
  })());
  const pole = (h, col) => new T3.Mesh(new T3.CylinderGeometry(0.28, 0.4, h, 8), new T3.MeshLambertMaterial({ color: col }));
  // ---- les obstacles mobiles : chacun est accroche a une structure (pierre, bois) posee sur l'ile ; collision en repere de la structure (x = gauche, y = hauteur, z = devant) ----
  const mat = (c) => new T3.MeshLambertMaterial({ color: c, flatShading: true });
  const bx = (w, h, d, c) => new T3.Mesh(new T3.BoxGeometry(w, h, d), mat(c));
  const cy = (rt, rb, h, c, n) => new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, n || 10), mat(c));
  const STONE = ['#a39a8a', '#948b7c', '#b2a999'], WOOD = '#7a5634', WOODD = '#5b3f25';
  const _v = new T3.Vector3();
  const segDist = (px, py, ax, ay, bx2, by2) => { const dx = bx2 - ax, dy = by2 - ay, l2 = dx * dx + dy * dy || 1, t = U.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); };
  const RR = 1.6;   // rayon de la fusee
  const obstacles = (T, C, grp) => {
    const I = C.isle, ups = [], hits = [];
    const mk = (d, lx) => { const y = T.base(d), p = T.at(d, lx, 0), q = T.at(d + 3, lx, 0), g = new T3.Group(); g.position.set(p[0], y, p[2]); g.lookAt(q[0], y, q[2]); grp.add(g); g.updateMatrixWorld(true); return g; };
    const loc = (g, pos) => g.worldToLocal(_v.copy(pos));
    const stoneBlock = (w, h, d, i) => bx(w, h, d, STONE[i % 3]);
    // portique en pierre : deux piliers a bandes, une poutre ; renvoie le groupe et la hauteur du pivot
    const gantry = (g, span, top, wood) => {
      for (const s of [-1, 1]) { const col = wood ? bx(2.2, top + 1, 2.2, WOOD) : stoneBlock(4, top + 1, 4, 0); col.position.set(s * span, (top + 1) / 2, 0); g.add(col); if (!wood) for (let k = 0; k < 4; k++) { const band = stoneBlock(4.4, 0.7, 4.4, k + 1); band.position.set(s * span, 3 + k * 5.5, 0); g.add(band); } const foot = bx(5.4, 1.2, 5.4, wood ? WOODD : '#7c7468'); foot.position.set(s * span, 0.6, 0); g.add(foot); }
      const beam = bx(2 * span + 5, 2, 2.6, wood ? WOOD : '#8a8174'); beam.position.y = top + 0.5; g.add(beam);
      for (let k = -4; k <= 4; k++) { const sp = bx(2.6, 2.04, 2.64, k % 2 ? '#ffd23a' : '#23262b'); sp.position.set(k * 5.6, top + 0.5, 0); if (Math.abs(k * 5.6) < span + 1) g.add(sp); }
    };
    // 1. le MARTEAU pendulaire sur un portique en pierre
    { const d = 245, g = mk(d, 0), top = 25, L = 19, span = 27; gantry(g, span, top, false);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv);
      for (const z of [-0.9, 0.9]) { const r = bx(0.3, L - 1.8, 0.3, '#1a1a1a'); r.position.set(0, -(L - 1.8) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); head.add(bx(5.2, 4, 5.2, '#d9382c')); const band = bx(5.4, 0.9, 5.4, '#ffd23a'); band.position.y = 0.4; head.add(band); const cap = bx(5.6, 0.8, 5.6, '#23262b'); cap.position.y = -2.2; head.add(cap);
      ups.push((t) => { piv.rotation.z = 0.86 * Math.sin(t * Math.PI * 2 / 3.4); g.updateMatrixWorld(true); });
      hits.push((pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4) return false; const a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); return Math.hypot(l.x - hx, l.y - hy) < 3.3 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.6 + RR; });
    }
    // 2. le MOULIN A VENT en pierre : tour a bandes, toit en bois, ailes tournantes ; la tour est sur le cote, les ailes balaient le chemin
    { const d = 385, g = mk(d, 11), H = 17;
      const tw = cy(3.6, 5.6, H, STONE[0], 14); tw.position.y = H / 2; g.add(tw);
      for (let k = 0; k < 5; k++) { const ring = cy(4.4 - k * 0.42, 4.6 - k * 0.42, 0.7, STONE[(k + 1) % 3], 14); ring.position.y = 2.2 + k * 3.2; g.add(ring); }
      const door = bx(2.6, 4, 0.8, WOODD); door.position.set(0, 2, 5); g.add(door);
      for (const s of [-1, 1]) { const win = bx(1.2, 1.8, 0.6, '#2a2f36'); win.position.set(s * 2.2, 9, 3.4); win.rotation.y = s * 0.6; g.add(win); }
      const roof = new T3.Mesh(new T3.ConeGeometry(4.4, 4.2, 14), mat('#8a3b2a')); roof.position.y = H + 2.1; g.add(roof);
      const hub = new T3.Group(); hub.position.set(0, H - 1, -4.4); g.add(hub); hub.add(cy(1.4, 1.4, 2.4, WOODD, 10)); hub.children[0].rotation.x = Math.PI / 2;
      const blades = new T3.Group(); blades.position.z = -1.4; hub.add(blades);
      for (let k = 0; k < 4; k++) { const arm = new T3.Group(); arm.rotation.z = k * Math.PI / 2; const sp = bx(0.9, 13.5, 0.7, WOOD); sp.position.y = 7.4; arm.add(sp); for (let j = 0; j < 5; j++) { const sl = bx(3.4, 0.5, 0.5, '#d8c79a'); sl.position.set(1.9, 3.4 + j * 2.4, 0.2); arm.add(sl); } const sail = bx(3.2, 10, 0.2, '#e8dcc0'); sail.position.set(2.2, 8, 0.1); arm.add(sail); blades.add(arm); }
      ups.push((t) => { blades.rotation.z = -t * 0.95; g.updateMatrixWorld(true); });
      hits.push((pos) => { const l = loc(g, pos), hy = H - 1, hz = -(4.4 + 1.4);
        if (l.y < H + 1 && Math.hypot(l.x, l.z) < 5.6 + RR && l.y > -2) return true;   // la tour
        if (Math.abs(l.z - hz) > 1.5 + RR) return false; const dx = l.x, dy = l.y - hy, r = Math.hypot(dx, dy); if (r < 2.4 + RR) return true; if (r > 14.2 + RR) return false;
        const a = Math.atan2(dy, dx) - (blades.rotation.z + Math.PI / 2); for (let k = 0; k < 4; k++) { const da = a - k * Math.PI / 2, ang = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.cos(ang) > 0 && r * Math.abs(Math.sin(ang)) < 1.5 + RR) return true; } return false; });
    }
    // 3. le TRONC pendulaire : un chevalet en bois, un tronc qui se balance en avant et en arriere... de cote a cote
    { const d = 520, g = mk(d, 0), top = 25, L = 19, span = 27; gantry(g, span, top, true);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv);
      for (const z of [-2.6, 2.6]) { const r = bx(0.35, L - 1.4, 0.35, '#2a2118'); r.position.set(0, -(L - 1.4) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const log = cy(1.7, 1.7, 8, '#6b4a2a', 10); log.rotation.x = Math.PI / 2; head.add(log); for (const z of [-3.2, 0, 3.2]) { const band = cy(1.85, 1.85, 0.5, '#3a3a3a', 10); band.rotation.x = Math.PI / 2; band.position.z = z; head.add(band); }
      ups.push((t) => { piv.rotation.z = 0.8 * Math.sin(t * Math.PI * 2 / 4.1 + 1.2); g.updateMatrixWorld(true); });
      hits.push((pos) => { const l = loc(g, pos), a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); if (Math.abs(l.z) > 4.2 + RR) return false; return Math.hypot(l.x - hx, l.y - hy) < 2.0 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.5 + RR; });
    }
    // 4. la PORTE DE GRANGE coulissante : murs de bois sur les cotes, deux grands battants qui glissent derriere les murs (ouverts environ 70 % du temps)
    { const d = 700, g = mk(d, 0), HW = 22;
      for (const s of [-1, 1]) { const wall = bx(15, HW, 3.4, WOOD); wall.position.set(s * 20.5, HW / 2, 0); g.add(wall); for (let k = 0; k < 7; k++) { const pl = bx(0.3, HW, 3.5, WOODD); pl.position.set(s * (13.6 + k * 2.2), HW / 2, 0); g.add(pl); } const post = bx(2.4, HW + 2, 4, WOODD); post.position.set(s * 28.6, (HW + 2) / 2, 0); g.add(post); }
      const lintel = bx(60, 3, 4, WOODD); lintel.position.y = HW + 1.5; g.add(lintel); const roofB = bx(62, 1, 8, '#8a3b2a'); roofB.position.y = HW + 3.5; g.add(roofB);
      const doors = [-1, 1].map((s) => { const dr = new T3.Group(); const panel = bx(13, HW, 1.6, '#a8402e'); panel.position.y = HW / 2; dr.add(panel); const cross = bx(14.4, 1.4, 1.8, '#f0e6d0'); cross.position.y = HW / 2; dr.add(cross); const dia = bx(0.9, 24, 1.8, '#f0e6d0'); dia.position.y = HW / 2; dia.rotation.z = 0.85 * s; dr.add(dia); dr.position.z = 1.9; g.add(dr); return dr; });
      const open = (t) => { const k = (t % 6.2) / 6.2; return k < 0.12 ? 0 : k < 0.24 ? (k - 0.12) / 0.12 : k < 0.82 ? 1 : 1 - (k - 0.82) / 0.18; };
      let o = 1; ups.push((t) => { o = open(t); const e = o * o * (3 - 2 * o); doors[0].position.x = -(6.5 + 13 * e); doors[1].position.x = 6.5 + 13 * e; g.updateMatrixWorld(true); });
      hits.push((pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 2.8 + RR || l.y > HW + 2 || l.y < -2) return false; const ax = Math.abs(l.x); if (ax > 13 - RR) return ax < 30 + RR ? true : false; const e = o * o * (3 - 2 * o), c = 6.5 + 13 * e; return Math.abs(ax - c) < 6.5 + RR && ax < 13 + RR && ax > c - 6.5 - RR && c < 13.5; });
    }
    // 5. la BARRIERE A BASCULE : un pilier en pierre, un contrepoids, une longue barre qui se leve et s'abaisse en travers du chemin
    { const d = 860, g = mk(d, -23), pivY = 6, Lb = 44;
      const pil = stoneBlock(5, pivY + 1.6, 5, 1); pil.position.y = (pivY + 1.6) / 2; g.add(pil); for (let k = 0; k < 2; k++) { const b2 = stoneBlock(5.4, 0.7, 5.4, k + 2); b2.position.y = 1.6 + k * 3; g.add(b2); }
      const piv = new T3.Group(); piv.position.y = pivY; g.add(piv);
      const arm = bx(Lb, 1.5, 1.5, '#f0e6d0'); arm.position.x = -Lb / 2; piv.add(arm); for (let k = 0; k < 8; k++) { const st = bx(2.7, 1.54, 1.54, '#d9382c'); st.position.x = -3 - k * 5.4; piv.add(st); }
      const cw = bx(7, 3, 3, '#3a3f46'); cw.position.x = 5; piv.add(cw);
      let th = 0; ups.push((t) => { const k = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 5.6 - 0.6); th = 1.5 * U.smooth(0.12, 0.88, k); piv.rotation.z = -th; g.updateMatrixWorld(true); });
      hits.push((pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 0.8 + RR) return false; return segDist(l.x, l.y, 0, pivY, -Lb * Math.cos(th), pivY + Lb * Math.sin(th)) < 0.8 + RR || (l.x < 0 && Math.hypot(l.x, l.y - pivY) < 3 + RR && false); });
    }
    // 6. les ROCHERS ET TONNEAUX qui roulent dans un couloir de pierre, sur la pente : on survole le couloir
    { const dA = 965, dB = 1085, L = dB - dA, N = 8, items = [];
      for (let k = 0; k < N; k++) {
        const big = k % 2 === 0, r = big ? 3.2 : 1.9, m = big ? new T3.Mesh(new T3.IcosahedronGeometry(r, 1), mat(STONE[k % 3])) : (() => { const g2 = new T3.Group(), c = cy(1.9, 1.9, 3.4, '#8a5a30', 12); g2.add(c); for (const yy of [-1.1, 1.1]) { const h = cy(2.0, 2.0, 0.35, '#2a2a2a', 12); h.position.y = yy; g2.add(h); } g2.rotation.z = Math.PI / 2; const wrap = new T3.Group(); wrap.add(g2); return wrap; })();
        grp.add(m); items.push({ m, r, lx: [-8, 0, 8, -4, 5][k % 5], ph: k / N, spin: big ? 1 : 0, pos: new T3.Vector3() });
      }
      const g0 = mk(dA - 6, 0); for (const s of [-1, 1]) { const w2 = stoneBlock(2.4, 1.6, 8, 1); w2.position.set(s * 13, 0.8, 0); g0.add(w2); } const gate = bx(26, 1.2, 1.4, WOODD); gate.position.set(0, 4.2, 0); g0.add(gate); for (const s of [-1, 1]) { const po = bx(1.8, 5, 1.8, WOOD); po.position.set(s * 13, 2.5, 0); g0.add(po); }   // la rampe de lancement des rochers
      for (let d = dA; d < dB; d += 8) for (const s of [-1, 1]) { const q = T.at(d, s * 13, 0), w3 = stoneBlock(2.4, 1.4 + (d % 16 === 0 ? 0.6 : 0), 9, d % 3); w3.position.set(q[0], q[1] + 0.7, q[2]); const q2 = T.at(d + 3, s * 13, 0); w3.lookAt(q2[0], q[1] + 0.7, q2[2]); grp.add(w3); }
      ups.push((t) => { for (const it of items) { const u = (t * 0.14 + it.ph) % 1, d = dA + u * L, p = T.at(d, it.lx, 0); it.m.position.set(p[0], p[1] + it.r, p[2]); it.m.rotation.x = -d / it.r * 0.9; it.pos.copy(it.m.position); } });
      hits.push((pos) => { for (const it of items) if (pos.distanceTo(it.pos) < it.r + RR) return true; return false; });
    }
    return { update: (t) => { for (const f of ups) f(t); }, hits };
  };
  E.buildIsle = (T, C, grp) => {
    const I = C.isle, out = { isle: true, blocks: [], obst: [] };
    grp.add(bodyMesh(T, C)); grp.add(prairie(T, C));
    const bm = new T3.MeshBasicMaterial({ map: bannerTex(), side: T3.DoubleSide, fog: false });
    const place = (d, lx, objs) => { const y = T.base(d), p = T.at(d, lx, 0), q = T.at(d + 3, lx, 0), g = new T3.Group(); g.position.set(p[0], y, p[2]); g.lookAt(q[0], y, q[2]); grp.add(g); for (const o of objs) g.add(o); return g; };   // +Z = devant, +X = gauche
    for (let d = 90; d < C.len - 40; d += 70) for (const sg of [-1, 1]) {   // poteaux de course : un drapeau « COLD IMPACT CUP » tourne vers la fusee qui arrive
      if (I.W(d) < 30) continue; const lx = sg * 21, po = pole(11, '#e8e8f0'), fl = new T3.Mesh(new T3.PlaneGeometry(6.4, 2), bm); po.position.y = 5.5; fl.position.set(-sg * 3.3, 9.6, 0); fl.rotation.y = Math.PI;
      place(d, lx, [po, fl]);
    }
    { const pl = [pole(24, '#ffd23a'), pole(24, '#ffd23a')], ban = new T3.Mesh(new T3.PlaneGeometry(38, 11.8), bm); pl[0].position.set(19.5, 12, 0); pl[1].position.set(-19.5, 12, 0); ban.position.set(0, 20, 0); ban.rotation.y = Math.PI; place(-6, 0, [pl[0], pl[1], ban]); }   // l'arche de depart
    const ob = obstacles(T, C, grp); out.update = ob.update; out.hits = ob.hits;
    return out;
  };
})();
