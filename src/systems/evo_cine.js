/* v142 : MOTEUR DE CINEMATIQUES 3D du mode évolution. Une cinématique = une scène Three.js à part (ciel, lumières, modèles, particules) filmée par une caméra
 * qui suit des points clés ; le jeu la dessine à la place du monde (game.cine3d). Aucun texte à lire : on COMPREND par l'image (icônes, plans, repères).
 *   EVO.playCine(g, 'intro1' | 'win1' | 'intro2', onEnd)   un toucher passe la cinématique (après 1 s)
 * Chaque cinématique déclare build(C) → { dur, update(t, dt), draw(ctx, W, H, t) } ; C fournit scene, camera, particules, ciel, eau, modèles. */
(function () {
  const U = CC.U, EVO = CC.EVO, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on) return;
  const rr = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const lam = (c, o) => new T3.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const emi = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c, fog: false }, o || {}));
  const box = (g, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cyl = (g, rt, rb, h, m, x, y, z, seg) => { const o = new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 14), m); o.position.set(x, y, z); g.add(o); return o; };

  // ---------- caméra sur rails : points clés {t, p:[x,y,z], l:[x,y,z], f} lissés (Catmull-Rom) ----------
  function cr(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); }
  function rail(keys) {
    return (t, outP, outL) => {
      let i = 0; while (i < keys.length - 2 && t > keys[i + 1].t) i++;
      const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[Math.min(keys.length - 1, i + 1)], d = keys[Math.min(keys.length - 1, i + 2)];
      const u = clamp((t - b.t) / Math.max(0.001, c.t - b.t), 0, 1), e = u * u * (3 - 2 * u) * 0.5 + u * 0.5;
      for (let k = 0; k < 3; k++) { outP[['x', 'y', 'z'][k]] = cr(a.p[k], b.p[k], c.p[k], d.p[k], e); outL[['x', 'y', 'z'][k]] = cr(a.l[k], b.l[k], c.l[k], d.l[k], e); }
      return mix(b.f || 50, c.f || 50, e);
    };
  }

  // ---------- ciel dégradé avec soleil (même shader que le jeu) ----------
  const SKYV = 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }';
  const SKYF = 'uniform vec3 top, horizon, bottom, sunCol; uniform vec3 sunDir; uniform float sunSize; varying vec3 vDir; void main(){ float y = vDir.y; vec3 c = y > 0.0 ? mix(horizon, top, pow(clamp(y, 0.0, 1.0), 0.55)) : mix(horizon, bottom, pow(clamp(-y * 4.0, 0.0, 1.0), 0.6)); float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0); c += sunCol * (pow(s, 64.0) * 0.6 + pow(s, sunSize) * 0.9); gl_FragColor = vec4(c, 1.0); }';
  function skyDome(scene, o) {
    const mat = new T3.ShaderMaterial({ vertexShader: SKYV, fragmentShader: SKYF, side: T3.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new T3.Color(o.top) }, horizon: { value: new T3.Color(o.hor) }, bottom: { value: new T3.Color(o.bot || o.hor) }, sunCol: { value: new T3.Color(o.sun || '#ffffff') }, sunDir: { value: new V().fromArray(o.dir || [0, 0.3, -1]).normalize() }, sunSize: { value: o.size || 500 } } });
    const m = new T3.Mesh(new T3.SphereGeometry(1000, 24, 16), mat); m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
    if (o.stars) { const sp = []; for (let i = 0; i < 500; i++) { const u = Math.random(), a = rr(0, 6.28), y = Math.sqrt(u), q = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * q * 900, y * 900 + 20, Math.sin(a) * q * 900); } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(sp, 3)); const p = new T3.Points(g, new T3.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false })); p.frustumCulled = false; m.add(p); }
    return m;
  }

  // ---------- particules (sprites additifs / fumée) ----------
  let _rt = null;
  const radial = () => { if (_rt) return _rt; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (_rt = new T3.CanvasTexture(c)); };
  function Parts(scene) { this.scene = scene; this.list = []; }
  Parts.prototype.add = function (o) {
    const mat = new T3.SpriteMaterial({ map: radial(), color: o.color || '#ffffff', transparent: true, opacity: o.op === undefined ? 1 : o.op, depthWrite: false, blending: o.add ? T3.AdditiveBlending : T3.NormalBlending, fog: o.fog !== false });
    const s = new T3.Sprite(mat); s.position.copy(o.p); s.scale.setScalar(o.s0 || 1); this.scene.add(s);
    this.list.push({ s, v: (o.v || new V()).clone(), life: o.life || 1, t: 0, s0: o.s0 || 1, s1: o.s1 === undefined ? (o.s0 || 1) : o.s1, op: o.op === undefined ? 1 : o.op, g: o.grav || 0, drag: o.drag || 0, rise: o.rise || 0 });
  };
  Parts.prototype.update = function (dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i]; q.t += dt; const k = q.t / q.life;
      if (k >= 1) { this.scene.remove(q.s); q.s.material.dispose(); this.list.splice(i, 1); continue; }
      q.v.y += (q.rise - q.g) * dt; if (q.drag) q.v.multiplyScalar(Math.max(0, 1 - q.drag * dt)); q.s.position.addScaledVector(q.v, dt);
      q.s.scale.setScalar(mix(q.s0, q.s1, k)); q.s.material.opacity = q.op * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
    }
  };
  Parts.prototype.explosion = function (p, size, snd) {
    for (let i = 0; i < 14; i++) this.add({ p, v: new V(rr(-1, 1), rr(-0.2, 1), rr(-1, 1)).multiplyScalar(rr(3, 14) * size), life: rr(0.5, 1.2), s0: 4 * size, s1: rr(14, 26) * size, color: i % 3 ? '#ff9a3a' : '#ffe08a', add: true, op: 0.9, drag: 1.6, fog: false });
    for (let i = 0; i < 10; i++) this.add({ p, v: new V(rr(-1, 1), rr(0.2, 1.2), rr(-1, 1)).multiplyScalar(rr(2, 8) * size), life: rr(2, 4), s0: 6 * size, s1: rr(20, 40) * size, color: '#2e2622', op: 0.65, rise: 3, drag: 0.8 });
  };
  Parts.prototype.fire = function (p, size) { this.add({ p, v: new V(rr(-1, 1), rr(2, 6), rr(-1, 1)).multiplyScalar(size), life: rr(0.7, 1.5), s0: 2.5 * size, s1: 7 * size, color: Math.random() < 0.5 ? '#ff8a2a' : '#ffc25a', add: true, op: 0.8, fog: false }); if (Math.random() < 0.4) this.add({ p: p.clone().add(new V(0, 3 * size, 0)), v: new V(rr(-1, 1), rr(4, 8), rr(-1, 1)).multiplyScalar(size), life: rr(2.5, 4.5), s0: 3 * size, s1: 14 * size, color: '#37302c', op: 0.55, rise: 2 }); };

  // ---------- modèles ----------
  EVO.cineMissile = (tier) => {
    const g = new T3.Group(), body = lam(tier >= 2 ? '#f0f2f5' : '#c9a46c'), tip = lam(tier >= 2 ? '#e02a1c' : '#e8dcc0'), fin = lam(tier >= 2 ? '#e8e8ec' : '#b8925e'), dark = lam('#2b2d31');
    const s = 1.0; cyl(g, 0.085, 0.085, 1.0, body, 0, 0, 0).rotation.x = Math.PI / 2;
    const nose = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.085, 0.4, 14), body); nose.rotation.x = Math.PI / 2; nose.position.z = 0.7; g.add(nose);
    const tp = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.04, 0.12, 14), tip); tp.rotation.x = Math.PI / 2; tp.position.z = 0.86; g.add(tp);
    cyl(g, 0.07, 0.085, 0.1, dark, 0, 0, -0.55).rotation.x = Math.PI / 2;
    box(g, 0.2, 0.02, 0.02, tip, 0, 0, 0.18).rotation.z = 0;
    if (EVO.finGeo) for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2; const m = new T3.Mesh(EVO.finGeo(0.36, 0.14, 0.3, 0.12, 0.022), fin); m.position.set(0, 0.085, -0.28); f.add(m); g.add(f); const f2 = new T3.Group(); f2.rotation.z = Math.PI / 4 + k * Math.PI / 2; const m2 = new T3.Mesh(EVO.finGeo(0.22, 0.09, 0.18, 0.08, 0.02), fin); m2.position.set(0, 0.085, -0.5); f2.add(m2); g.add(f2); }
    const fl = new T3.Mesh(new T3.ConeGeometry(0.07, 0.9, 10, 1, true), new T3.MeshBasicMaterial({ color: '#ffb040', transparent: true, opacity: 0.85, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = -1.05; fl.visible = false; g.add(fl); g.userData.flame = fl;
    return g;
  };
  // décor : sol sombre avec relief, montagnes lointaines en silhouette
  function ground(scene, col, size) { const m = new T3.Mesh(new T3.PlaneGeometry(size || 6000, size || 6000), lam(col || '#3a3a30')); m.rotation.x = -Math.PI / 2; scene.add(m); return m; }
  function mountains(scene, col, r, n, h, y0) { const g = new T3.Group(); for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rr(-0.1, 0.1), hh = rr(0.4, 1) * h, w = rr(0.6, 1.4) * h * 1.6, m = new T3.Mesh(new T3.ConeGeometry(w, hh, 5 + Math.floor(Math.random() * 3)), lam(col, { fog: false })); m.position.set(Math.cos(a) * r, (y0 || 0) + hh / 2 - 4, Math.sin(a) * r); m.rotation.y = Math.random() * 3; g.add(m); } scene.add(g); return g; }
  // la citadelle vue de loin : murailles, tours, fenêtres rougeoyantes, porte monumentale
  EVO.cineCitadel = (flames) => {
    const g = new T3.Group(), wall = lam('#34383e'), dk = lam('#262a30'), glow = emi('#ff8a3a'), warn = lam('#c8a028');
    box(g, 380, 150, 40, wall, 0, 75, 0); const gate = box(g, 84, 64, 42, new T3.MeshBasicMaterial({ color: '#05060a' }), 0, 32, 0);
    for (const sx of [-1, 1]) { box(g, 36, 230, 44, dk, sx * 128, 115, 0); box(g, 46, 8, 54, wall, sx * 128, 232, 0); for (let j = 0; j < 8; j++) box(g, 16, 2.6, 0.5, glow, sx * 128, 30 + j * 24, 22.2); box(g, 100, 220, 50, dk, sx * 210, 110, -8); box(g, 60, 280, 40, dk, sx * 300, 140, -30); for (let j = 0; j < 9; j++) { box(g, 14, 2.4, 0.5, glow, sx * 300, 40 + j * 26, -9.6); box(g, 20, 2.6, 0.5, glow, sx * 210, 30 + j * 24, 17.2); } }
    box(g, 120, 6, 44, warn, 0, 66, 0); box(g, 400, 10, 46, dk, 0, 152, 0);
    for (let i = 0; i < 18; i++) box(g, 8, 8, 8, wall, -170 + i * 20, 160, 0);
    g.userData.glows = [];
    return g;
  };
  EVO.cineSub = () => {
    const g = new T3.Group(), hull = lam('#2d3944'), hull2 = lam('#3a4856'), dark = lam('#161c22'), hatch = lam('#4a5a68'), lit = emi('#ffd890');
    const L = 78, R = 6.4;
    const body = new T3.Mesh(new T3.CylinderGeometry(R, R, L, 28), hull); body.rotation.x = Math.PI / 2; g.add(body);
    const bow = new T3.Mesh(new T3.SphereGeometry(R, 28, 16, 0, 6.283, 0, Math.PI / 2), hull); bow.rotation.x = Math.PI / 2; bow.position.z = L / 2; g.add(bow);
    const stern = new T3.Mesh(new T3.ConeGeometry(R, 26, 28), hull); stern.rotation.x = -Math.PI / 2; stern.position.z = -L / 2 - 13; g.add(stern);
    box(g, 6.4, 8.4, 17, hull2, 0, R + 3.6, 8); box(g, 7.2, 1.2, 18, dark, 0, R + 8.4, 8); for (let k = 0; k < 4; k++) box(g, 0.2, 1.2, 0.2, lit, -2.6 + k * 1.8, R + 5.2, 16.6);
    for (const s of [-1, 1]) { box(g, 10, 0.6, 5.5, hull2, s * 8, R + 5.2, 10); box(g, 14, 0.7, 7, hull2, s * 10, 0, -L / 2 - 4); }
    box(g, 0.7, 14, 7, hull2, 0, 0, -L / 2 - 4); box(g, 0.7, 14, 7, hull2, 0, 0, -L / 2 - 4).rotation.z = Math.PI / 2;
    const prop = new T3.Group(); prop.position.z = -L / 2 - 27; for (let k = 0; k < 7; k++) { const b = box(prop, 0.4, 6.6, 1.8, lam('#7a6a40'), 0, 3.3, 0); b.geometry.translate(0, 0, 0); const pv = new T3.Group(); pv.rotation.z = k * 6.283 / 7; pv.add(b); prop.add(pv); } g.add(prop); g.userData.prop = prop;
    { const tz = L / 2 + R * 0.97, ring = new T3.Mesh(new T3.TorusGeometry(2.5, 0.28, 8, 24), lam('#58646e')); ring.position.z = tz; g.add(ring); const bg = new T3.Mesh(new T3.CircleGeometry(2.4, 24), new T3.MeshBasicMaterial({ color: '#05080c' })); bg.position.z = tz - 0.05; g.add(bg);
      const dL = box(g, 2.5, 5.2, 0.5, hull2, -1.25, 0, tz + 0.15), dR = box(g, 2.5, 5.2, 0.5, hull2, 1.25, 0, tz + 0.15); g.userData.doors = [dL, dR]; g.userData.tubeZ = tz; }
    for (let k = 0; k < 6; k++) cyl(g, 0.5, 0.5, 0.2, hatch, 0, R + 0.1, -26 + k * 8, 10);
    // bandes de repérage
    for (const z of [-24, 6, 26]) { const r = new T3.Mesh(new T3.TorusGeometry(R + 0.04, 0.12, 6, 40), lam('#c8a028')); r.position.z = z; g.add(r); }
    return g;
  };
  EVO.cineShip = (len) => {
    const g = new T3.Group(), hull = lam('#4a5058'), sup = lam('#7a8088'), dk = lam('#2a2e34'), red = lam('#a8322a'); len = len || 90;
    const hs = new T3.Shape(); hs.moveTo(-len / 2, 0); hs.lineTo(len / 2 - 10, 0); hs.lineTo(len / 2 + 10, 7); hs.lineTo(-len / 2, 7); hs.closePath();
    const h = new T3.Mesh(new T3.ExtrudeGeometry(hs, { depth: 14, bevelEnabled: false }), hull); h.rotation.y = -Math.PI / 2; h.position.set(7, 0, 0); h.rotation.x = 0; g.add(h);
    box(g, 10, 7, len * 0.36, sup, 0, 11, -len * 0.04); box(g, 8, 5, len * 0.2, sup, 0, 16.5, -len * 0.06); cyl(g, 0.5, 0.5, 18, dk, 0, 26, -len * 0.04, 6); box(g, 0.4, 0.4, 9, dk, 0, 33, -len * 0.04); box(g, 8, 0.5, 4, lam('#aab'), 0, 26, -len * 0.04);
    cyl(g, 2.6, 3.2, 4, dk, 0, 9, len * 0.3, 12); cyl(g, 0.5, 0.5, 8, dk, 0, 11, len * 0.3 + 4, 8).rotation.x = Math.PI / 2; box(g, 8, 0.6, 12, red, 0, 7.2, -len * 0.36);
    return g;
  };
  // plateforme de lancement en mer (ICBM) : jambes, pont, tour de lancement avec le missile
  EVO.cinePlatform = (withMissile) => {
    const g = new T3.Group(), steel = lam('#5a626c'), dk = lam('#2a2e34'), yel = lam('#c8a028'), white = lam('#e8eaee'), red = lam('#c8352a');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(g, 3.2, 3.8, 70, steel, sx * 42, -8, sz * 42, 12); for (let k = 0; k < 5; k++) box(g, 8.6, 1.2, 8.6, yel, sx * 42, 2 + k * 10, sz * 42); }
    box(g, 120, 6, 120, steel, 0, 28, 0); box(g, 124, 1.4, 124, yel, 0, 31.2, 0); for (const s of [-1, 1]) box(g, 126, 3, 1.2, dk, 0, 33.6, s * 62);
    box(g, 34, 20, 30, dk, -38, 41, -30); box(g, 28, 8, 34, steel, 36, 36, 28); cyl(g, 2, 2, 22, steel, -38, 62, -30, 8); box(g, 18, 1, 1, white, -38, 73, -30);
    for (let k = 0; k < 4; k++) { box(g, 3, 70, 3, steel, -9 + (k % 2) * 18, 66, -9 + (k >> 1) * 18); }
    for (let j = 0; j < 7; j++) box(g, 22, 1.6, 22, yel, 0, 38 + j * 9.5, 0);
    if (withMissile) { const m = new T3.Group(); cyl(m, 5.2, 5.2, 74, white, 0, 0, 0, 20); cyl(m, 0.5, 5.2, 24, white, 0, 49, 0, 20); cyl(m, 0.5, 2.2, 6, red, 0, 63, 0, 20); cyl(m, 5.3, 5.3, 6, red, 0, 14, 0, 20); cyl(m, 5.3, 5.3, 2, dk, 0, -10, 0, 20); for (let k = 0; k < 4; k++) { const f = box(m, 1.2, 14, 9, white, Math.cos(k * 1.571) * 6.6, -26, Math.sin(k * 1.571) * 6.6); f.rotation.y = -k * 1.571; } m.position.y = 78; g.add(m); g.userData.missile = m; }
    return g;
  };
  // eau : surface animée (vagues) ; vue d'en dessous incluse
  EVO.cineWater = (size, col, op) => {
    const geo = new T3.PlaneGeometry(size, size, 70, 70); geo.rotateX(-Math.PI / 2);
    const mat = new T3.MeshPhongMaterial({ color: col || '#2b7fb0', specular: '#cfe8ff', shininess: 90, transparent: true, opacity: op === undefined ? 0.92 : op, flatShading: false, side: T3.DoubleSide, fog: true });
    const m = new T3.Mesh(geo, mat); m.userData.p0 = geo.attributes.position.array.slice();
    m.userData.upd = (t, amp) => { const P = geo.attributes.position, A = m.userData.p0; for (let i = 0; i < P.count; i++) { const x = A[i * 3], z = A[i * 3 + 2]; P.setY(i, (Math.sin(x * 0.045 + t * 1.1) * 0.6 + Math.sin(z * 0.06 - t * 0.9) * 0.5 + Math.sin((x + z) * 0.11 + t * 1.7) * 0.25) * (amp === undefined ? 1 : amp)); } P.needsUpdate = true; geo.computeVertexNormals(); };
    return m;
  };
  EVO.cineRobotPose = (G, t, armPh) => {
    const ud = G.userData, ph = t * 0.62;
    for (const L of ud.legs) { const p = ph + (L.side > 0 ? 0 : Math.PI), sw = Math.sin(p), lift = Math.max(0, Math.cos(p)); L.hip.rotation.x = sw * 0.22; L.knee.rotation.x = -Math.max(0, sw) * 0.5 - lift * 0.18; L.ankle.rotation.x = -(L.hip.rotation.x + L.knee.rotation.x) * 0.9; }
    for (const A of ud.arms) { A.sh.rotation.x = Math.sin(armPh + (A.side > 0 ? 0 : 3)) * 0.38 - 0.1; A.el.rotation.x = -0.35 - Math.max(0, Math.sin(armPh * 1.3 + A.side)) * 0.5; A.sh.rotation.z = A.side * (0.05 + 0.04 * Math.sin(armPh * 0.7)); }
  };

  // ---------- le lecteur ----------
  EVO.playCine = (g, id, onEnd, opt) => {
    const def = EVO.CINES[id]; if (!def) { if (onEnd) onEnd(); return; }
    EVO.stopCine(g, true);
    const scene = new T3.Scene(), camera = new T3.PerspectiveCamera(50, g.camera.aspect || 0.5, 0.3, 3500), parts = new Parts(scene);
    const C = { scene, camera, parts, g, aspect: g.camera.aspect || 0.5, rail, sky: (o) => skyDome(scene, o), ground, mountains, V3: V, rr, clamp, sm, mix, lam, emi, box, cyl };
    scene.fog = new T3.Fog('#c0c8d0', 200, 1600);
    const R = def.build(C);
    g.cine3d = { scene, camera, C, R, t: 0, dur: R.dur, onEnd, id, skipAfter: R.skipAfter === undefined ? 1.0 : R.skipAfter, fade: 0, ended: false, parts };
    g.ui.overlay = 'evoCine'; if (R.music && g.audio && g.audio.ctx) g.audio.setZone(R.music, false);
    if (g.postParams) { g._cinePost = { b: g.postParams.bloomStrength, th: g.postParams.bloomThreshold, vg: g.postParams.vignette, tint: g.postParams.tint }; g.postParams.bloomStrength = R.bloom === undefined ? 0.2 : R.bloom; g.postParams.bloomThreshold = 0.8; g.postParams.vignette = 0.35; g.postParams.tint = '#ffffff'; }
  };
  EVO.stopCine = (g, silent) => {
    const c = g.cine3d; if (!c) return; g.cine3d = null;
    c.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    if (g._cinePost && g.postParams) { g.postParams.bloomStrength = g._cinePost.b; g.postParams.bloomThreshold = g._cinePost.th; g.postParams.vignette = g._cinePost.vg; g.postParams.tint = g._cinePost.tint; } g._cinePost = null;
    if (!silent && c.onEnd) { const f = c.onEnd; c.onEnd = null; f(); }
  };
  EVO.skipCine = (g) => { const c = g.cine3d; if (c && c.t > c.skipAfter && !c.ended) { c.ended = true; EVO.stopCine(g); } };
  EVO.cineFrame = (g, dt) => {
    const c = g.cine3d; if (!c) return; dt = Math.min(dt, 0.05); c.t += dt;
    c.camera.aspect = g.camera.aspect || c.camera.aspect;
    const p = new V(), l = new V(); const fov = c.R.cam ? c.R.cam(c.t, p, l, c) : 50;
    c.camera.position.copy(p); c.camera.lookAt(l); if (c.R.roll) c.camera.rotateZ(c.R.roll(c.t)); const asp = c.camera.aspect; c.camera.fov = asp < 1.2 ? Math.min(95, fov * (1 + (1.2 - asp) * 0.75)) : fov; c.camera.updateProjectionMatrix();
    if (c.R.update) c.R.update(c.t, dt, c); c.parts.update(dt);
    if (c.t >= c.dur && !c.ended) { c.ended = true; EVO.stopCine(g); }
  };
  EVO.drawCine = (ui, ctx, g, W, H0) => {
    const c = g.cine3d; const LY = CC.Home.layout(ui, W, H0), H = LY.HH;
    if (!c) return; ui.buttons.push({ x: 0, y: LY.T, w: W, h: H, action: () => EVO.skipCine(g) });
    ctx.save(); ctx.translate(0, LY.T);
    const t = c.t, bar = Math.min(H * 0.07, 50) * sm(0, 0.6, t) * (1 - sm(c.dur - 0.5, c.dur, t));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    if (c.R.draw) c.R.draw(ctx, W, H, t, ui);
    const fi = 1 - sm(0, 0.9, t), fo = sm(c.dur - 0.7, c.dur, t), a = Math.max(fi, fo * (c.R.fadeTo === 'white' ? 0 : 1)); if (a > 0.003) { ctx.fillStyle = 'rgba(0,0,0,' + a + ')'; ctx.fillRect(0, 0, W, H); }
    if (c.R.fadeTo === 'white' && fo > 0) { ctx.fillStyle = 'rgba(255,255,255,' + fo + ')'; ctx.fillRect(0, 0, W, H); }
    if (t > c.skipAfter && t < c.dur - 1) { const s = Math.max(10, W * 0.028); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.moveTo(W - s * 3.2, H - bar - s * 2.6); ctx.lineTo(W - s * 3.2, H - bar - s * 0.9); ctx.lineTo(W - s * 2.1, H - bar - s * 1.75); ctx.fill(); ctx.beginPath(); ctx.moveTo(W - s * 2.1, H - bar - s * 2.6); ctx.lineTo(W - s * 2.1, H - bar - s * 0.9); ctx.lineTo(W - s * 1.0, H - bar - s * 1.75); ctx.fill(); }
    ctx.restore();
  };
  // icônes 2D de mission (aucun texte) : missile, robot, réacteur, bateau, sous-marin, étoile
  EVO.iconMissile = (ctx, x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6); ctx.fillStyle = col || '#fff'; ctx.fillRect(-s * 0.9, -s * 0.18, s * 1.5, s * 0.36); ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.18); ctx.lineTo(s * 1.1, 0); ctx.lineTo(s * 0.6, s * 0.18); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.9, -s * 0.18); ctx.lineTo(-s * 1.1, -s * 0.5); ctx.lineTo(-s * 0.55, -s * 0.18); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.9, s * 0.18); ctx.lineTo(-s * 1.1, s * 0.5); ctx.lineTo(-s * 0.55, s * 0.18); ctx.fill(); ctx.restore(); };
  EVO.iconRobot = (ctx, x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col || '#fff'; ctx.fillRect(-s * 0.55, -s * 0.9, s * 1.1, s * 0.7); ctx.fillRect(-s * 0.3, -s * 1.2, s * 0.6, s * 0.3); ctx.fillRect(-s * 0.95, -s * 0.85, s * 0.35, s * 0.9); ctx.fillRect(s * 0.6, -s * 0.85, s * 0.35, s * 0.9); ctx.fillRect(-s * 0.5, -s * 0.2, s * 0.35, s * 1.1); ctx.fillRect(s * 0.15, -s * 0.2, s * 0.35, s * 1.1); ctx.fillStyle = '#ff3a2a'; ctx.fillRect(-s * 0.22, -s * 1.12, s * 0.44, s * 0.1); ctx.restore(); };
  EVO.iconReactor = (ctx, x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col || '#46e0ff'; ctx.lineWidth = Math.max(2, s * 0.12); ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, 6.283); ctx.stroke(); ctx.fillStyle = col || '#46e0ff'; ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0, 6.283); ctx.fill(); for (let k = 0; k < 8; k++) { const a = k * 0.785; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s); ctx.lineTo(Math.cos(a) * s * 1.25, Math.sin(a) * s * 1.25); ctx.stroke(); } ctx.restore(); };
  EVO.iconBoom = (ctx, x, y, s, col, t) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col || '#ffb03a'; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = k * 0.3927, r = s * (k % 2 ? 0.55 : 1.0 + 0.1 * Math.sin((t || 0) * 12 + k)); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); };
  EVO.iconStar = (ctx, x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col || '#ffd23a'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, r = s * (k % 2 ? 0.42 : 1); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); };
  EVO.iconShip = (ctx, x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col || '#fff'; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.lineTo(s * 0.7, s * 0.4); ctx.lineTo(-s * 0.8, s * 0.4); ctx.closePath(); ctx.fill(); ctx.fillRect(-s * 0.3, -s * 0.5, s * 0.5, s * 0.5); ctx.fillRect(s * 0.1, -s * 0.9, s * 0.08, s * 0.5); ctx.restore(); };
  EVO.iconSub = (ctx, x, y, s, col) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col || '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.35, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-s * 0.2, -s * 0.65, s * 0.35, s * 0.4); ctx.fillRect(s * 0.1, -s * 0.8, s * 0.06, s * 0.2); ctx.restore(); };
  EVO.iconArrow = (ctx, x, y, s, col, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0); ctx.fillStyle = col || '#fff'; ctx.beginPath(); ctx.moveTo(-s, -s * 0.28); ctx.lineTo(s * 0.3, -s * 0.28); ctx.lineTo(s * 0.3, -s * 0.7); ctx.lineTo(s, 0); ctx.lineTo(s * 0.3, s * 0.7); ctx.lineTo(s * 0.3, s * 0.28); ctx.lineTo(-s, s * 0.28); ctx.closePath(); ctx.fill(); ctx.restore(); };
  EVO.CINES = EVO.CINES || {};
  EVO._cineLib = { rail, skyDome, ground, mountains, Parts, lam, emi, box, cyl, rr, clamp, sm, mix };
  EVO.finGeo = EVO.finGeo || null;
})();
