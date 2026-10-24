/* v246 : LES BOSS DU NIVEAU 2 — BEHEMOTH (forteresse volante : on la rattrape par l'arriere et on detruit ses quatre moteurs) et AEGIS (le satellite-canon : trois generateurs
 * sur un anneau tournant, puis le coeur). Meme principe que le Titan : un objet libre place le long du couloir, visible de tres loin, des zones de coup (chaque zone detruite = un
 * point de vie), des tirs qui frolent le joueur, une jauge sans graduation, une mort en explosions en chaine. Pour tester le niveau sans boss : ajouter &noboss=1 a l'adresse. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn) return;
  const NOBOSS = /[?&]noboss=1/.test(location.search), SEE = 1500;
  const _a = new V(), _b = new V(), _c = new V();
  const lam = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e, fog: false } : { color: c, fog: false });
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c, fog: false }, o || {}));
  const bx = (g, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cy = (g, rt, rb, h, m, x, y, z, seg, rx) => { const o = new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 14), m); o.position.set(x, y, z); if (rx) o.rotation.x = Math.PI / 2; g.add(o); return o; };
  const glowTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,200,120,0.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (t = new T3.CanvasTexture(c)); }; })();
  const glow = (size, col) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex(), color: col || '#ffffff', transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); return s; };
  const heading = (T, d) => { const a = T.at(d, 0, 0), b = T.at(d + 6, 0, 0); return Math.atan2(b[0] - a[0], b[2] - a[2]); };   // local +Z = sens des distances croissantes

  // ---------------- BEHEMOTH : la forteresse volante (+Z = l'avant ; les quatre moteurs sont a l'arriere, face a nous) ----------------
  function behemothModel() {
    const root = new T3.Group(), hull = lam('#3a444e'), dark = lam('#1b2027'), light = lam('#566270'), amber = lam('#b8921c'), red = lam('#8a2a20'), cone = [], zones = [];
    bx(root, 150, 36, 520, hull, 0, 30, 0); bx(root, 124, 16, 430, light, 0, 55, 18); bx(root, 90, 22, 90, dark, 0, 32, 295); bx(root, 54, 14, 70, hull, 0, 30, 345);
    bx(root, 44, 46, 70, dark, 0, 86, 120); bx(root, 30, 10, 54, light, 0, 114, 120); for (let k = -1; k <= 1; k += 2) bx(root, 3, 3, 3, bas('#ff4a3a'), k * 12, 124, 130);
    for (const sx of [-1, 1]) { bx(root, 56, 14, 310, hull, sx * 105, 24, -34); bx(root, 56, 4, 300, amber, sx * 105, 32, -34); for (let k = 0; k < 6; k++) bx(root, 10, 12, 14, dark, sx * 124, 36, -150 + k * 56); }
    for (let k = 0; k < 8; k++) { const z = -200 + k * 56, x = (k % 2 ? 1 : -1) * 38; cy(root, 8, 10, 8, dark, x, 66, z, 10); bx(root, 3, 3, 30, dark, x, 70, z + 12); }
    for (let k = 0; k < 6; k++) { const z = -180 + k * 70; cy(root, 9, 9, 10, dark, (k % 2 ? 1 : -1) * 50, 10, z, 10); bx(root, 3.4, 3.4, 26, dark, (k % 2 ? 1 : -1) * 50, 8, z + 14); }
    for (let k = 0; k < 10; k++) bx(root, 150.4, 1.2, 1.2, bas('#7be8ff'), 0, 36, -240 + k * 52);
    for (let k = 0; k < 4; k++) { const x = [-66, -22, 22, 66][k], eng = new T3.Group(); eng.position.set(x, 30, -262); root.add(eng);
      cy(eng, 17, 19, 56, dark, 0, 0, -26, 14, true); cy(eng, 21, 17, 10, amber, 0, 0, -56, 14, true); cy(eng, 12, 14, 4, bas('#bff4ff'), 0, 0, -61, 14, true);
      const fl = new T3.Mesh(new T3.ConeGeometry(15, 80, 12, 1, true), new T3.MeshBasicMaterial({ color: '#6adcff', transparent: true, opacity: 0.32, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = -100; eng.add(fl);
      const gl = glow(64, '#8ee8ff'); gl.position.z = -64; eng.add(gl); cone.push(fl); zones.push({ id: 'E' + k, pos: new V(x, 30, -296), r: 24, node: eng, fl, gl }); }
    return { root, zones, hulls: [{ pos: new V(0, 30, 20), size: [150, 38, 500] }, { pos: new V(0, 90, 120), size: [44, 50, 70] }], cone };
  }
  // ---------------- AEGIS : le satellite-canon (le canon est a -Z, face a nous ; l'anneau tourne autour de l'axe Z) ----------------
  function aegisModel() {
    const root = new T3.Group(), hull = lam('#8794a2'), dark = lam('#2a313a'), light = lam('#b8c4d0'), zones = [], ring = new T3.Group(); root.add(ring);
    for (let k = 0; k < 28; k++) { const a = k / 28 * 6.2832, seg = bx(ring, 30, 10, 14, k % 2 ? hull : light, Math.cos(a) * 92, Math.sin(a) * 92, 0); seg.rotation.z = a + Math.PI / 2; if (k % 4 === 0) { const l = bx(ring, 5, 5, 16, bas('#7be8ff'), Math.cos(a) * 92, Math.sin(a) * 92, -8); l.rotation.z = a; } }
    for (let k = 0; k < 3; k++) {
      const a = k * 2.0944 + 0.5236, gx = Math.cos(a) * 92, gy = Math.sin(a) * 92, gen = new T3.Group(); gen.position.set(gx, gy, 0); gen.rotation.z = a - Math.PI / 2; ring.add(gen);
      const spoke = bx(ring, 6, 62, 6, dark, Math.cos(a) * 52, Math.sin(a) * 52, 0); spoke.rotation.z = a - Math.PI / 2;
      cy(gen, 11, 13, 18, dark, 0, 10, 0, 12); cy(gen, 8, 11, 8, bas('#ff9a3a'), 0, 21, 0, 12); const gl = glow(70, '#ffb060'); gl.position.set(0, 24, -6); gen.add(gl);
      zones.push({ id: 'G' + k, pos: new V(0, 18, 0), r: 22, node: gen, gl, parent: gen });
    }
    const core = new T3.Group(); root.add(core); const sph = new T3.Mesh(new T3.SphereGeometry(30, 18, 12), lam('#a8b4c0')); core.add(sph); const band = new T3.Mesh(new T3.TorusGeometry(31, 3, 8, 24), bas('#7be8ff')); core.add(band);
    const cg = glow(160, '#7be8ff'); cg.visible = false; core.add(cg); cy(core, 7, 9, 70, dark, 0, 0, -50, 12, true); cy(core, 11, 8, 6, bas('#ff6a3a'), 0, 0, -86, 12, true);
    for (const sx of [-1, 1]) { bx(root, 150, 2, 54, lam('#2a4a7a'), sx * 190, 0, 46); bx(root, 60, 4, 6, dark, sx * 80, 0, 46); for (let k = 0; k < 6; k++) bx(root, 1, 2.4, 54, lam('#5a8ac8'), sx * (130 + k * 24), 1.4, 46); }
    zones.push({ id: 'CORE', pos: new V(0, 0, 0), r: 30, node: core, gl: cg, core: true });
    return { root, zones, hulls: [], ring };
  }
  const DEFS = {
    behemoth: { scene: 'behemoth', at: 0.0, ahead: 520, speed: 36, name: 'BEHEMOTH', hp: 4, model: behemothModel, yOff: -30, surge: 140, fire: 2.6 },
    aegis: { scene: 'orbite', at: 0.62, ahead: 0, speed: 0, name: 'AEGIS', hp: 4, model: aegisModel, yOff: 0, surge: 0, fire: 2.4, aegis: true },
  };

  let B = null, far0 = 0;
  const shotAt = (g, from, big) => {
    const rk = g.rocket; g.spawnEnemyMissile(from.clone(), rk, { miss: 16, lead: 0, turn: 0, speed: 160, life: 8, quiet: true, visualFrom: from.clone() });
    const m = g.missiles[g.missiles.length - 1];
    if (m) {   // l'ecart de visee est toujours LATERAL (perpendiculaire a la ligne de tir) : l'obus frole, il ne peut pas toucher
      _a.copy(rk.pos).sub(from).normalize(); _b.crossVectors(_a, new V(0, 1, 0)).normalize(); _c.crossVectors(_b, _a).normalize(); const sg = Math.random() < 0.5 ? -1 : 1;
      m.miss.copy(_b).multiplyScalar(sg * rr(13, 19)).addScaledVector(_c, rr(-6, 6)); m.dir.copy(rk.pos).sub(from).add(m.miss).normalize();
      if (m.object) { m.object.scale.setScalar(big ? 7 : 5); m.object.add(glow(5, '#ffd9a0')); } }
    g.effects.flash(from.clone(), '#ffd890', 10, 260, 0.35, '#ff8a30'); g.audio.play('boom', from); g.rig.shake = Math.max(g.rig.shake, 0.35);
  };
  const reset = (g) => { if (!B) return; if (B.far0 && g.camera.far > B.far0) { g.camera.far = B.far0; g.camera.updateProjectionMatrix(); } g.scene.remove(B.W); for (const q of B.debris) g.scene.remove(q.o); B = null; EVO.boss2 = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); reset(g); };

  function create(g, def, id) {
    const T = g.endlessRun.T, d0 = EVO.s2d0(def.scene), len = (CC.Zones.defs.ocean.scenes[def.scene] || { len: [1000] }).len[0]; if (d0 === undefined) return;
    const M = def.model(), W = new T3.Group(); W.add(M.root); W.visible = false; g.scene.add(W);
    B = EVO.boss2 = { id, def, W, M, d: d0 + def.at * len + def.ahead, hp: def.hp, hpMax: def.hp, disp: 1, mode: 'live', t: 0, surge: null, cool: 0, fireT: 1.5, podT: 5, debris: [], dying: 0, spin: 0.4, far0: 0, sy: 0 };
    B.lx = 0; B.yy = def.yOff;
    for (const h of M.hulls) { const gg = new T3.Group(); gg.position.copy(h.pos); M.root.add(gg); const col = EVO.colBox(gg, h.size[0], h.size[1], h.size[2], 0, 0, 0); EVO.addDyn(gg, null, [col], { near: 1e7, span: 1e7 }); }
    for (const z of M.zones) { const gg = new T3.Group(); gg.position.copy(z.pos); (z.parent || M.root).add(gg); const col = EVO.colBox(gg, z.r * 2, z.r * 2, z.r * 2, 0, 0, 0); z.group = gg; z.dead = false; z.active = !z.core;
      EVO.addDyn(gg, null, [col], { near: 1e7, span: 1e7, hit: (gg2) => zoneHit(gg2, z) }); }
    EVO.addDyn(W, (t, dt, gg) => upd(gg, dt), [], { near: 1e7, span: 1e7 });
    place(g, T);
  }
  function place(g, T) {
    if (!B) return; const def = B.def, lx = T.laneX(B.d) + B.lx, y = T.laneY(B.d) + B.yy, p = T.at(B.d, lx, y); B.W.position.set(p[0], p[1], p[2]); B.W.rotation.y = heading(T, B.d);
  }
  function zoneHit(g, z) {
    if (!B || B.mode === 'dying' || B.mode === 'dead') return true;
    if (z.core && !z.active) return false;   // le coeur d'AEGIS est blinde tant que les generateurs sont la : on s'y ecrase
    if (z.dead || B.cool > 0) return true;
    z.dead = true; B.cool = 1.4; B.hp--; const rk = g.rocket, p = rk.pos.clone(), fx = g.effects;
    z.node.updateWorldMatrix(true, false); z.node.getWorldPosition(_a);
    fx.explosion(_a.clone(), null, true, 'orange'); fx.ring(_a.clone(), new V(0, 1, 0), 6, 70, 0.8, '#ffd060', 0.9); fx.flash(_a.clone(), '#ffb040', 9, 200, 0.4, '#ff5020'); g.audio.play('boom', p); g.audio.play('clunk', p); g.audio.play('robotRoar', p);
    if (EVO.onBossHit) EVO.onBossHit(g, null); if (EVO.coinBurst) EVO.coinBurst(g, p, B.hp > 0 ? 16 : 40);
    g.rig.shake = Math.max(g.rig.shake, 1.7); g.flash = 0.35; g.flashColor = '#ffe9b0'; g.hitStop = 0.14; g.hitScale = 0.15; g.chromaBurst = 0.02;
    if (z.fl) z.fl.visible = false; if (z.gl) z.gl.visible = false; if (!z.core) { const wreck = new T3.Mesh(new T3.SphereGeometry(10, 8, 6), new T3.MeshBasicMaterial({ color: '#15110e', fog: false })); wreck.position.copy(z.pos); if (z.parent) wreck.position.set(0, 18, 0); (z.parent || B.M.root).add(wreck); }
    if (B.hp > 0) {
      B.surge = { t: 0, dur: 1.4, dist: B.def.surge || 0 }; B.spin += 0.55;
      if (B.def.aegis) { const left = B.M.zones.filter((q) => !q.core && !q.dead).length; if (left === 0) { const core = B.M.zones.find((q) => q.core); core.active = true; if (core.gl) core.gl.visible = true; } }
      if (CC.L1) CC.L1.msg(g, B.def.aegis ? (B.hp === 1 ? 'LE COEUR EST EXPOSE !' : 'GENERATEUR DETRUIT !') : 'MOTEUR ' + (B.hpMax - B.hp) + ' / ' + (B.hpMax - 1), 1.8, '#ffe9a0');
    } else { B.mode = 'dying'; B.dying = 0; g.hitStop = 0.3; g.flash = 0.5; g.flashColor = '#ffffff'; g.chromaBurst = 0.03; if (CC.L1) CC.L1.msg(g, B.def.name + ' DETRUIT !', 2.6, '#ffe9a0'); }
    return true;
  }
  function blast(g) {
    B.M.root.visible = false; const wp = B.W.position, mat = [new T3.MeshLambertMaterial({ color: '#2b2f36' }), new T3.MeshLambertMaterial({ color: '#4a515c' }), new T3.MeshBasicMaterial({ color: '#ff8a2a' })];
    for (let i = 0; i < 26; i++) { const sz = rr(6, 22), o = new T3.Mesh(new T3.BoxGeometry(sz, sz * rr(0.4, 0.9), sz * rr(0.7, 1.4)), mat[i % 5 === 0 ? 2 : i % 2]); _c.set(rr(-70, 70), rr(-10, 60), rr(-180, 180)); B.W.localToWorld(_c); o.position.copy(_c); o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); g.scene.add(o); B.debris.push({ o, v: new V(rr(-40, 40), rr(-30, 50), rr(-40, 60)).add(new V().subVectors(_c, wp).multiplyScalar(0.4)), s: rr(-2, 2), t: 0 }); }
    const ball = glow(60, '#ffd9a0'); ball.position.set(0, 20, 0); B.W.add(ball); B.ball = ball;
  }
  function rr(a, b) { return a + Math.random() * (b - a); }

  function upd(g, dt) {
    if (!B || !g.endlessRun) return; const run = g.endlessRun, T = run.T, rk = g.rocket, rd = run.dist, def = B.def, fx = g.effects, live = g.state === 'FLIGHT' && rk && rk.active;
    B.t += dt; B.cool = Math.max(0, B.cool - dt);
    const near = rd > B.d - SEE - 200 && rd < B.d + 700 + (def.speed ? 800 : 0); B.W.visible = near;
    if (near && g.camera.far < 1700) { B.far0 = B.far0 || g.camera.far; g.camera.far = 1700; g.camera.updateProjectionMatrix(); } else if (!near && B.far0 && g.camera.far > B.far0) { g.camera.far = B.far0; g.camera.updateProjectionMatrix(); }
    if (B.mode === 'live' || B.mode === 'dying') {
      let v = def.speed; if (B.surge) { const S = B.surge; S.t += dt; const k0 = U.smooth(0, 1, (S.t - dt) / S.dur), k1 = U.smooth(0, 1, S.t / S.dur); B.d += S.dist * (k1 - k0); if (S.t >= S.dur) B.surge = null; }
      if (B.mode === 'live') B.d += v * dt;
    }
    B.lx = def.aegis ? 0 : Math.sin(B.t * 0.22) * 14; B.yy = def.yOff + Math.sin(B.t * 0.3) * 6;
    place(g, T);
    // animation propre a chaque boss
    if (def.aegis) { B.M.ring.rotation.z += dt * B.spin * (B.mode === 'dying' ? 3 : 1); for (const z of B.M.zones) if (z.gl && z.core && z.active && !z.dead) z.gl.scale.setScalar(160 + 30 * Math.sin(B.t * 6)); }
    else for (const z of B.M.zones) if (z.fl && !z.dead) { z.fl.scale.set(1, 1, 0.8 + 0.3 * Math.sin(B.t * 18 + z.pos.x)); }
    if (B.mode === 'live' && live) {
      const dist = B.W.position.distanceTo(rk.pos);
      if (dist > 120 && dist < 900) { B.fireT -= dt; if (B.fireT <= 0) { B.fireT = def.fire * (B.hp <= 2 ? 0.75 : 1); const q = def.aegis ? _b.set(0, 0, -86) : _b.set(rr(-60, 60), 60, -250); B.W.localToWorld(q); shotAt(g, q, true); } }
      if (B.hp <= 2) { B.podT -= dt; if (B.podT <= 0) { B.podT = 4.4; for (const sx of [-1, 1]) { const q = def.aegis ? _a.set(sx * 40, 0, -40) : _a.set(sx * 100, 40, -200); B.W.localToWorld(q); g.spawnEnemyMissile(q.clone(), rk, { miss: 0, lead: 0.05, turn: 0.1, speed: 30, life: 7, quiet: true, visualFrom: q.clone() }); } g.audio.play('hydraulic', _a); } }
    }
    if (B.mode === 'dying') {
      B.dying += dt; const t = B.dying; B.sm = (B.sm || 0) - dt;
      if (t > 0.3 && !B.burst) { B.burst = 1; blast(g); }
      if (B.sm <= 0 && t < 2.8) { B.sm = 0.1; _c.set(rr(-70, 70), rr(0, 70), rr(-200, 200)); B.W.localToWorld(_c); fx.explosion(_c.clone(), null, true, Math.random() < 0.5 ? 'cyan' : 'orange'); fx.smokePuff(_c.clone(), new V(0, 12, 0), 40, 2.6); if (Math.random() < 0.5) g.audio.play('boom', _c); }
      g.rig.shake = Math.max(g.rig.shake, 1.2 * (1 - t / 3.2));
      if (B.ball) { const k = U.clamp(t / 1.4, 0, 1); B.ball.scale.setScalar(80 + 520 * (1 - Math.pow(1 - k, 3))); B.ball.material.opacity = (1 - k) * 0.95; B.ball.visible = k < 1; }
      if (t > 3.2 && B.mode === 'dying') { B.mode = 'dead'; if (def.aegis && EVO.finishRun) EVO.finishRun(g); }
    }
    for (let i = B.debris.length - 1; i >= 0; i--) { const q = B.debris[i]; q.t += dt; q.o.position.addScaledVector(q.v, dt); q.o.rotation.x += q.s * dt; q.o.rotation.z += q.s * 0.7 * dt; if (!def.aegis) q.v.y -= 30 * dt; if (Math.random() < 0.2) fx.smokePuff(q.o.position.clone(), new V(0, 4, 0), 14, 1.5); if (q.t > 6) { g.scene.remove(q.o); B.debris.splice(i, 1); } }
  }

  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (B || NOBOSS || !g.endlessRun || !g.endlessRun.T || !g.evo || g.evo.preview || !EVO.isS2 || !EVO.isS2() || !EVO.s2d0) return;
    for (const id of Object.keys(DEFS)) { const def = DEFS[id], d0 = EVO.s2d0(def.scene); if (d0 === undefined) continue; const dist = g.endlessRun.dist, start = d0 + def.at * (CC.Zones.defs.ocean.scenes[def.scene].len[0]) + def.ahead; if (dist > start - SEE - 700 && dist < start + 1500) { create(g, def, id); break; } }
  };

  // ---------------- jauge de vie (la meme que celle du Titan : une simple barre qui descend) ----------------
  EVO.boss2Hud = (ctx, g, ox, u, H, UI, S) => {
    if (!B || B.mode === 'dead' || !g.endlessRun) return false; const rd = g.endlessRun.dist; if (rd < B.d - 1100) return true;
    const w = u * 0.5, h = S(24), x = ox + (u - w) / 2, y = H * 0.1, f = B.hp / B.hpMax; B.disp += (f - B.disp) * 0.12;
    const r = h / 2; ctx.save(); ctx.globalAlpha = B.mode === 'dying' ? U.clamp(B.disp * 10, 0, 1) : 1; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.clip();
    ctx.fillStyle = 'rgba(8,12,18,0.5)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#E8433A'; ctx.fillRect(x, y, w * Math.max(0, B.disp), h); ctx.restore(); return true;
  };
})();
