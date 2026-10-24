/* v246 : LES BOSS DU NIVEAU 2 — BEHEMOTH (forteresse volante : on la rattrape par l'arriere et on detruit ses quatre moteurs) et AEGIS (le satellite-canon : trois boucliers autour d'un
 * coeur orange). Meme principe que le Titan : un objet libre place le long du couloir, visible de tres loin, des zones de coup (chaque coup = un point de vie), un recul a chaque coup pour
 * laisser de la marge, des tirs qui frolent le joueur, une jauge sans graduation, une mort en feu puis en explosions. Pour tester le niveau sans boss : ajouter &noboss=1 a l'adresse. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn) return;
  const NOBOSS = /[?&]noboss=1/.test(location.search), SEE = 1500;
  const _a = new V(), _b = new V(), _c = new V();
  const rr = (a, b) => a + Math.random() * (b - a);
  const lam = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e, fog: false } : { color: c, fog: false });
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c, fog: false }, o || {}));
  const bx = (g, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cy = (g, rt, rb, h, m, x, y, z, seg, rx) => { const o = new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 14), m); o.position.set(x, y, z); if (rx) o.rotation.x = Math.PI / 2; g.add(o); return o; };
  const glowTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,200,120,0.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (t = new T3.CanvasTexture(c)); }; })();
  const glow = (size, col) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex(), color: col || '#ffffff', transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); return s; };
  const heading = (T, d) => { const a = T.at(d, 0, 0), b = T.at(d + 6, 0, 0); return Math.atan2(b[0] - a[0], b[2] - a[2]); };   // local +Z = sens des distances croissantes
  const CHAR = new T3.MeshLambertMaterial({ color: '#15110e', fog: false });
  // marquage d'une cible : un anneau lumineux qui pulse autour (axe -Z, face a la fusee) et trois chevrons qui defilent vers elle
  function marker(node, radius, col, dirZ) {
    const g = new T3.Group(), ring = new T3.Mesh(new T3.TorusGeometry(radius, radius * 0.07, 8, 32), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); g.add(ring);
    const ch = []; for (let k = 0; k < 3; k++) { const c = new T3.Mesh(new T3.ConeGeometry(radius * 0.32, radius * 0.7, 4), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); c.rotation.x = -Math.PI / 2 * dirZ; g.add(c); ch.push(c); }
    g.userData = { ring, ch, radius, dirZ }; node.add(g); return g;
  }
  function animMarker(m, t, ph) {
    const u = m.userData; u.ring.scale.setScalar(1 + 0.12 * Math.sin(t * 6 + ph)); u.ring.material.opacity = 0.55 + 0.4 * Math.sin(t * 6 + ph);
    for (let k = 0; k < 3; k++) { const f = ((t * 1.1 + k / 3) % 1); u.ch[k].position.z = -u.dirZ * (u.radius * (4.6 - 3.2 * f)); u.ch[k].material.opacity = 0.9 * Math.sin(f * Math.PI); }
  }

  // ---------------- BEHEMOTH : la forteresse volante (+Z = l'avant ; les quatre moteurs sont a l'arriere, face a nous) ----------------
  function behemothModel() {
    const root = new T3.Group(), hull = lam('#3a444e'), dark = lam('#1b2027'), light = lam('#566270'), amber = lam('#b8921c'), zones = [];
    bx(root, 150, 36, 520, hull, 0, 30, 0); bx(root, 124, 16, 430, light, 0, 55, 18); bx(root, 90, 22, 90, dark, 0, 32, 295); bx(root, 54, 14, 70, hull, 0, 30, 345);
    bx(root, 44, 46, 70, dark, 0, 86, 120); bx(root, 30, 10, 54, light, 0, 114, 120); for (let k = -1; k <= 1; k += 2) bx(root, 3, 3, 3, bas('#ff4a3a'), k * 12, 124, 130);
    for (const sx of [-1, 1]) { bx(root, 56, 14, 310, hull, sx * 105, 24, -34); bx(root, 56, 4, 300, amber, sx * 105, 32, -34); for (let k = 0; k < 6; k++) bx(root, 10, 12, 14, dark, sx * 124, 36, -150 + k * 56); }
    for (let k = 0; k < 8; k++) { const z = -200 + k * 56, x = (k % 2 ? 1 : -1) * 38; cy(root, 8, 10, 8, dark, x, 66, z, 10); bx(root, 3, 3, 30, dark, x, 70, z + 12); }
    for (let k = 0; k < 6; k++) { const z = -180 + k * 70; cy(root, 9, 9, 10, dark, (k % 2 ? 1 : -1) * 50, 10, z, 10); bx(root, 3.4, 3.4, 26, dark, (k % 2 ? 1 : -1) * 50, 8, z + 14); }
    for (let k = 0; k < 10; k++) bx(root, 150.4, 1.2, 1.2, bas('#7be8ff'), 0, 36, -240 + k * 52);
    for (let k = 0; k < 4; k++) { const x = [-66, -22, 22, 66][k], eng = new T3.Group(); eng.position.set(x, 30, -262); root.add(eng);
      cy(eng, 17, 19, 56, dark, 0, 0, -26, 14, true); cy(eng, 21, 17, 10, amber, 0, 0, -56, 14, true); cy(eng, 12, 14, 4, bas('#bff4ff'), 0, 0, -61, 14, true);
      const fl = new T3.Mesh(new T3.ConeGeometry(15, 80, 12, 1, true), new T3.MeshBasicMaterial({ color: '#6adcff', transparent: true, opacity: 0.32, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = -100; eng.add(fl);
      const gl = glow(64, '#8ee8ff'); gl.position.z = -64; eng.add(gl);
      const mk = marker(eng, 30, '#ffd040', 1); mk.position.z = -66; zones.push({ id: 'E' + k, pos: new V(x, 30, -296), r: 32, node: eng, fl, gl, burn: true, mk }); }
    return { root, zones, hulls: [{ pos: new V(0, 30, 20), size: [150, 38, 500] }, { pos: new V(0, 90, 120), size: [44, 50, 70] }] };
  }
  // ---------------- AEGIS : le satellite-canon (le canon est a -Z, face a nous) ; trois BOUCLIERS autour d'un coeur orange : un coup = un bouclier, puis le coeur ----------------
  function aegisModel() {
    const root = new T3.Group(), hull = lam('#8794a2'), dark = lam('#2a313a'), light = lam('#b8c4d0'), zones = [], ring = new T3.Group(); root.add(ring);
    for (let k = 0; k < 28; k++) { const a = k / 28 * 6.2832, seg = bx(ring, 30, 10, 14, k % 2 ? hull : light, Math.cos(a) * 110, Math.sin(a) * 110, 0); seg.rotation.z = a + Math.PI / 2; if (k % 4 === 0) { const l = bx(ring, 5, 5, 16, bas('#7be8ff'), Math.cos(a) * 110, Math.sin(a) * 110, -8); l.rotation.z = a; } }
    for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.5236, spoke = bx(ring, 6, 70, 6, dark, Math.cos(a) * 66, Math.sin(a) * 66, 0); spoke.rotation.z = a - Math.PI / 2; const cap = cy(ring, 9, 11, 14, lam('#8a4a2a'), Math.cos(a) * 112, Math.sin(a) * 112, 0, 10); cap.rotation.z = a - Math.PI / 2; }
    const core = new T3.Group(); root.add(core); const sph = new T3.Mesh(new T3.SphereGeometry(30, 18, 12), new T3.MeshLambertMaterial({ color: '#c8742a', emissive: '#ff6a1a', fog: false })); core.add(sph);
    const band = new T3.Mesh(new T3.TorusGeometry(31, 3, 8, 24), bas('#ffb060')); core.add(band); const cg = glow(170, '#ff9a4a'); core.add(cg);
    cy(core, 7, 9, 70, dark, 0, 0, -50, 12, true); cy(core, 11, 8, 6, bas('#ff6a3a'), 0, 0, -86, 12, true);
    const shields = [44, 58, 72].map((r, i) => { const m = new T3.Mesh(new T3.SphereGeometry(r, 24, 16), new T3.MeshBasicMaterial({ color: ['#7be8ff', '#9ad0ff', '#c0b4ff'][i], transparent: true, opacity: 0.2, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); core.add(m); return m; });
    for (const sx of [-1, 1]) { bx(root, 80, 2, 34, lam('#2a4a7a'), sx * 170, 0, 56); bx(root, 54, 4, 5, dark, sx * 104, 0, 56); for (let k = 0; k < 5; k++) bx(root, 1, 2.4, 34, lam('#6a9ad8'), sx * (140 + k * 15), 1.4, 56); }
    const mk = marker(core, 92, '#ffd040', 1); mk.position.z = -40; zones.push({ id: 'CORE', pos: new V(0, 0, 0), r: 38, node: core, gl: cg, multi: true, shields, mk });
    return { root, zones, hulls: [], ring };
  }
  const DEFS = {
    behemoth: { scene: 'behemoth', at: 0.0, ahead: 280, speed: 30, name: 'BEHEMOTH', hp: 4, model: behemothModel, yOff: -30, surge: 260, fire: 2.8 },
    aegis: { scene: 'orbite', at: 0.43, ahead: 0, speed: 0, name: 'AEGIS', hp: 4, model: aegisModel, yOff: 0, surge: 300, fire: 2.6, aegis: true },
  };

  let B = null; const made = {};
  const shotAt = (g, from, big) => {
    const rk = g.rocket; g.spawnEnemyMissile(from.clone(), rk, { miss: 16, lead: 0, turn: 0, speed: 150, life: 8, quiet: true, visualFrom: from.clone() });
    const m = g.missiles[g.missiles.length - 1];
    if (m) {   // l'ecart de visee est toujours LATERAL (perpendiculaire a la ligne de tir) : l'obus frole, il ne peut pas toucher
      _a.copy(rk.pos).sub(from).normalize(); _b.crossVectors(_a, new V(0, 1, 0)).normalize(); _c.crossVectors(_b, _a).normalize(); const sg = Math.random() < 0.5 ? -1 : 1;
      m.miss.copy(_b).multiplyScalar(sg * rr(13, 19)).addScaledVector(_c, rr(-6, 6)); m.dir.copy(rk.pos).sub(from).add(m.miss).normalize();
      if (m.object) { m.object.scale.setScalar(big ? 7 : 5); m.object.add(glow(5, '#ffd9a0')); } }
    g.effects.flash(from.clone(), '#ffd890', 10, 260, 0.35, '#ff8a30'); g.audio.play('boom', from); g.rig.shake = Math.max(g.rig.shake, 0.35);
  };
  const dispose = (g) => { if (!B) return; if (B.far0 && g.camera.far > B.far0) { g.camera.far = B.far0; g.camera.updateProjectionMatrix(); } g.scene.remove(B.W); for (const q of B.debris) g.scene.remove(q.o); B = null; EVO.boss2 = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); dispose(g); for (const k of Object.keys(made)) delete made[k]; };

  function create(g, def, id) {
    const T = g.endlessRun.T, d0 = EVO.s2d0(def.scene), len = (CC.Zones.defs.ocean.scenes[def.scene] || { len: [1000] }).len[0]; if (d0 === undefined) return;
    dispose(g); made[id] = true;
    const M = def.model(), W = new T3.Group(); W.add(M.root); W.visible = false; g.scene.add(W);
    B = EVO.boss2 = { id, def, W, M, d: d0 + def.at * len + def.ahead, hp: def.hp, hpMax: def.hp, disp: 1, mode: 'live', t: 0, surge: null, cool: 0, fireT: 1.5, podT: 5, debris: [], dying: 0, spin: 0.35, far0: 0, drop: 0 };
    B.lx = 0; B.yy = def.yOff;
    for (const h of M.hulls) { const gg = new T3.Group(); gg.position.copy(h.pos); M.root.add(gg); const col = EVO.colBox(gg, h.size[0], h.size[1], h.size[2], 0, 0, 0); EVO.addDyn(gg, null, [col], { near: 1e7, span: 1e7 }); h.dyn = EVO.dyn[EVO.dyn.length - 1]; }
    for (const z of M.zones) { const gg = new T3.Group(); gg.position.copy(z.pos); (z.parent || M.root).add(gg); const col = EVO.colBox(gg, z.r * 2, z.r * 2, z.r * 2, 0, 0, 0); z.group = gg; z.dead = false; z.active = true;
      EVO.addDyn(gg, null, [col], { near: 1e7, span: 1e7, hit: (gg2) => zoneHit(gg2, z) }); }
    EVO.addDyn(W, (t, dt, gg) => { if (B && B.W === W) upd(gg, dt); }, [], { near: 1e7, span: 1e7 });
    place(g, T);
  }
  function place(g, T) {
    if (!B) return; const lx = T.laneX(B.d) + B.lx, y = T.laneY(B.d) + B.yy - B.drop, p = T.at(B.d, lx, y); B.W.position.set(p[0], p[1], p[2]); B.W.rotation.y = heading(T, B.d);
  }
  function snuff(z) {   // le moteur s'eteint : plus de flamme, carcasse noircie, il fume et brule
    if (z.fl) z.fl.visible = false; if (z.gl) z.gl.visible = false; if (z.mk) z.mk.visible = false;
    if (z.node && z.burn) z.node.traverse((o) => { if (o.isMesh && o !== z.fl) o.material = CHAR; });
    z.fire = true;
  }
  function zoneHit(g, z) {
    if (!B || B.mode === 'dying' || B.mode === 'dead') return true;
    if (z.dead || B.cool > 0) return true;
    B.cool = 1.5; B.hp--; const rk = g.rocket, p = rk.pos.clone(), fx = g.effects;
    z.node.updateWorldMatrix(true, false); z.node.getWorldPosition(_a); if (!z.multi) z.dead = true;
    fx.explosion(_a.clone(), null, true, 'orange'); fx.ring(_a.clone(), new V(0, 1, 0), 6, 50, 0.7, '#ffd060', 0.8); g.audio.play('boom', p); g.audio.play('clunk', p); g.audio.play('robotRoar', p);
    if (EVO.onBossHit) EVO.onBossHit(g, null); if (EVO.coinBurst) EVO.coinBurst(g, p, B.hp > 0 ? 16 : 40);
    g.rig.shake = Math.max(g.rig.shake, 1.7); g.flash = 0.35; g.flashColor = '#ffe9b0'; g.hitStop = 0.14; g.hitScale = 0.15; g.chromaBurst = 0.02;
    if (z.burn) snuff(z);
    if (z.shields) { const sh = z.shields.find((m) => m.visible); if (sh) { sh.visible = false; fx.ring(_a.clone(), new V(0, 0, 1), 20, 150, 0.9, '#9ad8ff', 0.8); for (let i = 0; i < 14; i++) fx.sparks.emit({ pos: _a.clone().add(new V(rr(-30, 30), rr(-30, 30), rr(-30, 30))), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(rr(20, 60)), life: rr(0.5, 1.1), s0: 0.8, s1: 0.9, s2: 0.3, cols: fx.pal.ember, drag: 1, grav: 0, a: 1, fout: 0.5 }); } }
    if (B.hp > 0) {
      B.surge = { t: 0, dur: 1.6, dist: B.def.surge || 0 }; B.spin += 0.5;
      if (CC.L1) CC.L1.msg(g, B.def.aegis ? 'BOUCLIER BRISE !' : 'MOTEUR ' + (B.hpMax - B.hp) + ' / ' + (B.hpMax - 1), 1.8, '#ffe9a0');
    } else { B.mode = 'dying'; B.dying = 0; g.hitStop = 0.3; g.flash = 0.5; g.flashColor = '#ffffff'; g.chromaBurst = 0.03; for (const h of B.M.hulls) if (h.dyn) h.dyn.cols.length = 0; if (CC.L1) CC.L1.msg(g, B.def.name + ' DETRUIT !', 2.6, '#ffe9a0'); }
    return true;
  }
  function blast(g) {
    B.M.root.visible = false; const wp = B.W.position, mat = [new T3.MeshLambertMaterial({ color: '#2b2f36' }), new T3.MeshLambertMaterial({ color: '#4a515c' }), new T3.MeshBasicMaterial({ color: '#ff8a2a' })];
    for (let i = 0; i < 26; i++) { const sz = rr(6, 22), o = new T3.Mesh(new T3.BoxGeometry(sz, sz * rr(0.4, 0.9), sz * rr(0.7, 1.4)), mat[i % 5 === 0 ? 2 : i % 2]); _c.set(rr(-70, 70), rr(-10, 60), rr(-180, 180)); B.W.localToWorld(_c); o.position.copy(_c); o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); g.scene.add(o); B.debris.push({ o, v: new V(rr(-40, 40), rr(-30, 50), rr(-40, 60)).add(new V().subVectors(_c, wp).multiplyScalar(0.4)), s: rr(-2, 2), t: 0 }); }
    const ball = glow(60, '#ffd9a0'); ball.position.set(0, 20, 0); B.W.add(ball); B.ball = ball;
  }

  function upd(g, dt) {
    if (!B || !g.endlessRun) return; const run = g.endlessRun, T = run.T, rk = g.rocket, rd = run.dist, def = B.def, fx = g.effects, live = g.state === 'FLIGHT' && rk && rk.active;
    B.t += dt; B.cool = Math.max(0, B.cool - dt);
    const near = rd > B.d - SEE - 200 && rd < B.d + 700 + (def.speed || def.aegis ? 900 : 0); B.W.visible = near;
    if (near && g.camera.far < 1700) { B.far0 = B.far0 || g.camera.far; g.camera.far = 1700; g.camera.updateProjectionMatrix(); } else if (!near && B.far0 && g.camera.far > B.far0) { g.camera.far = B.far0; g.camera.updateProjectionMatrix(); }
    if (!B.awake && rd > B.d - (def.aegis ? 800 : 520)) { B.awake = true; if (live) { g.audio.play('robotRoar'); g.audio.play('robotAlarm'); g.rig.shake = Math.max(g.rig.shake, 0.8); if (CC.L1) CC.L1.msg(g, def.name + ' !', 2, '#ff6a50'); } }
    if (B.mode === 'live' && B.awake && rd > B.d + 80) { B.d = rd + 380; B.surge = null; B.lx = 0; if (live) { g.audio.play('robotAlarm'); g.rig.shake = Math.max(g.rig.shake, 0.7); if (CC.L1) CC.L1.msg(g, def.name + ' REVIENT !', 1.6, '#ff6a50'); } }   // anti-contournement : on ne peut pas depasser un boss vivant, il se replace devant la fusee
    if (B.mode === 'live' || B.mode === 'dying') {
      if (B.surge) { const S = B.surge; S.t += dt; const k0 = U.smooth(0, 1, (S.t - dt) / S.dur), k1 = U.smooth(0, 1, S.t / S.dur); B.d += S.dist * (k1 - k0); if (S.t >= S.dur) B.surge = null; }
      if (B.mode === 'live' && B.awake) B.d += def.speed * dt;
    }
    B.lx = def.aegis ? 0 : Math.sin(B.t * 0.22) * 14; B.yy = def.yOff + Math.sin(B.t * 0.3) * 6;
    if (B.mode === 'dying' && !def.aegis) B.drop += (18 + B.dying * 34) * dt;
    place(g, T); if (B.mode === 'dying' && !def.aegis) B.W.rotation.z = Math.min(0.5, B.dying * 0.16);
    if (def.aegis) { B.M.ring.rotation.z += dt * B.spin * (B.mode === 'dying' ? 3 : 1); const z = B.M.zones[0]; if (z.mk) { z.mk.visible = B.mode === 'live'; animMarker(z.mk, B.t, 0); } if (z.gl && B.mode !== 'dying') z.gl.scale.setScalar(170 + 24 * Math.sin(B.t * 5 + B.hp)); const left = z.shields.filter((m) => m.visible); for (let i = 0; i < left.length; i++) left[i].material.opacity = 0.16 + 0.07 * Math.sin(B.t * 3 + i); }
    else for (const z of B.M.zones) {
      if (z.fl && !z.dead) z.fl.scale.set(1, 1, 0.8 + 0.3 * Math.sin(B.t * 18 + z.pos.x));
      if (z.mk && !z.dead) animMarker(z.mk, B.t, z.pos.x);
      if (z.fire && near && Math.random() < dt * 3.5) { z.node.getWorldPosition(_a); _a.add(_b.set(rr(-4, 4), 4, rr(-4, 4))); fx.smokePuff(_a.clone(), new V(0, rr(10, 16), 0), rr(14, 20), 2.2); }   // fumee grise, petite, qui monte
    }
    if (B.mode === 'live' && live && B.awake) {
      const dist = B.W.position.distanceTo(rk.pos);
      if (dist > 120 && dist < 900) { B.fireT -= dt; if (B.fireT <= 0) { B.fireT = def.fire * (B.hp <= 2 ? 0.8 : 1); const q = def.aegis ? _b.set(0, 0, -86) : _b.set(rr(-60, 60), 60, -250); B.W.localToWorld(q); shotAt(g, q, true); } }
      if (B.hp <= 2) { B.podT -= dt; if (B.podT <= 0) { B.podT = 4.6; for (const sx of [-1, 1]) { const q = def.aegis ? _a.set(sx * 40, 0, -40) : _a.set(sx * 100, 40, -200); B.W.localToWorld(q); g.spawnEnemyMissile(q.clone(), rk, { miss: 0, lead: 0.05, turn: 0.1, speed: 30, life: 7, quiet: true, visualFrom: q.clone() }); } g.audio.play('hydraulic', _a); } }
    }
    if (B.mode === 'dying' || B.mode === 'dead') { rk.fuel = rk.fuelMax; rk.shieldT = Math.max(rk.shieldT || 0, 5); if (rk.vel.y < 0) rk.vel.y *= 0.5; }   // pendant la mort du boss et le bilan : pas de chute, pas de crash
    if (B.mode === 'dying') {
      B.dying += dt; const t = B.dying; B.sm = (B.sm || 0) - dt;
      const tb = def.aegis ? 0.3 : 3.0;   // BEHEMOTH plonge d'abord vers la mer en brulant, puis explose ; AEGIS explose tout de suite
      if (t > tb && !B.burst) { B.burst = 1; blast(g); }
      if (B.sm <= 0 && t < tb + 2.0) { B.sm = 0.28; _c.set(rr(-70, 70), rr(0, 70), rr(-200, 200)); B.W.localToWorld(_c); fx.explosion(_c.clone(), null, true, 'orange'); if (Math.random() < 0.5) g.audio.play('boom', _c); }
      if (t < tb + 2.4) g.rig.shake = Math.max(g.rig.shake, 0.9 * (1 - t / (tb + 2.6)));
      if (B.ball) { const k = U.clamp((t - tb) / 1.4, 0, 1); B.ball.scale.setScalar(80 + 520 * (1 - Math.pow(1 - k, 3))); B.ball.material.opacity = (1 - k) * 0.95; B.ball.visible = k < 1; }
      if (t > tb + 3.0) { B.mode = 'dead'; if (def.aegis && EVO.finishRun) EVO.finishRun(g); }
    }
    for (let i = B.debris.length - 1; i >= 0; i--) { const q = B.debris[i]; q.t += dt; q.o.position.addScaledVector(q.v, dt); q.o.rotation.x += q.s * dt; q.o.rotation.z += q.s * 0.7 * dt; if (!def.aegis) q.v.y -= 30 * dt; if (q.t > 6) { g.scene.remove(q.o); B.debris.splice(i, 1); } }
  }

  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (NOBOSS || !g.endlessRun || !g.endlessRun.T || !g.evo || g.evo.preview || !EVO.isS2 || !EVO.isS2() || !EVO.s2d0) return;
    const dist = g.endlessRun.dist;
    if (B && dist > B.d + 900) dispose(g);   // l'epave est loin derriere : on libere la place pour le boss suivant
    for (const id of Object.keys(DEFS)) { if (made[id]) continue; const def = DEFS[id], d0 = EVO.s2d0(def.scene); if (d0 === undefined) continue; const start = d0 + def.at * (CC.Zones.defs.ocean.scenes[def.scene].len[0]) + def.ahead; if (dist > start - SEE - 700 && dist < start + 1500) { create(g, def, id); break; } }
  };

  // ---------------- jauge de vie (la meme que celle du Titan : une simple barre qui descend) ----------------
  EVO.boss2Hud = (ctx, g, ox, u, H, UI, S) => {
    if (!B || B.mode === 'dead' || !g.endlessRun) return false; const rd = g.endlessRun.dist; if (rd < B.d - 1100) return true;
    const w = u * 0.5, h = S(24), x = ox + (u - w) / 2, y = H * 0.1, f = B.hp / B.hpMax; B.disp += (f - B.disp) * 0.12;
    const r = h / 2; ctx.save(); ctx.globalAlpha = B.mode === 'dying' ? U.clamp(B.disp * 10, 0, 1) : 1; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.clip();
    ctx.fillStyle = 'rgba(8,12,18,0.5)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#E8433A'; ctx.fillRect(x, y, w * Math.max(0, B.disp), h); ctx.restore(); return true;
  };
})();
