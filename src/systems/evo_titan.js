/* v236 : LE TITAN — le boss de la citadelle (niveau 1). Il remplace le gardien : un char de siege colossal, visible de tres loin, qui se reveille,
 * detruit deux tours a coups de canon (elles s'effondrent devant la fusee), tire des obus qui frolent le joueur, puis se bat en 3 coups :
 * a chaque impact sur sa coque il explose, recule d'un bond et continue de tirer ; au troisieme coup il s'effondre en explosions en chaine.
 * Le Titan est un objet libre (pas dans un troncon) : on le voit a plus d'un kilometre, bien avant que le decor de la citadelle ne soit construit.
 * Toutes les etapes sont pilotees par la distance de la fusee (run.dist) : rien ne depend du temps ni de la vitesse. */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn || !CC.BossModels || !CC.BossModels.titan) return;
  const SC = 8, HP = 2, SEE = 1300, REACH = 190, CAP = 380;
  const _a = new V(), _b = new V(), _c = new V();
  let MODEL = null;

  function model() {
    if (MODEL) return MODEL;
    const m = CC.BossModels.titan();
    m.traverse((o) => {
      if (!o.isMesh || !o.material) return; o.castShadow = false; o.receiveShadow = false;
      for (const q of (Array.isArray(o.material) ? o.material : [o.material])) { if (q.userData.lit) continue; q.userData.lit = 1; q.fog = false; if (q.emissive && q.color) q.emissive.copy(q.color).multiplyScalar(0.4); }
    });
    return (MODEL = m);
  }
  EVO.titanPrewarm = (g) => { try { const m = model(); m.position.set(0, -9000, 0); g.scene.add(m); g.renderer.compile(g.scene, g.camera); g.scene.remove(m); m.position.set(0, 0, 0); } catch (e) { /* sans effet */ } };

  const glowTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,245,210,1)'); gr.addColorStop(0.3, 'rgba(255,170,70,0.6)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (t = new T3.CanvasTexture(c)); }; })();
  const glowSprite = (size) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex(), transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); return s; };

  // ---------- tour de guet detruite par le Titan ----------
  const lamB = (c) => new T3.MeshLambertMaterial({ color: c });
  function buildTower() {
    const g = new T3.Group(), dark = lamB('#3b3f46'), mid = lamB('#565c66'), lit = new T3.MeshBasicMaterial({ color: '#ffe2a8' });
    const bx = (w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
    bx(14, 6, 14, dark, 0, 3, 0); bx(7, 40, 7, mid, 0, 26, 0); for (const s of [-1, 1]) { bx(1.2, 40, 1.2, dark, s * 4.2, 26, 4.2); bx(1.2, 40, 1.2, dark, s * 4.2, 26, -4.2); }
    bx(14, 3, 14, dark, 0, 47.5, 0); bx(12, 7, 12, mid, 0, 52.5, 0); bx(12.4, 1.8, 3, lit, 0, 53, 5.9); bx(1, 12, 1, dark, 3, 62, 0);
    return g;
  }

  // ---------- projectile (obus du Titan vers un point du decor) ----------
  function shell(g, from, to, speed, onHit) {
    const o = new T3.Group(), core = new T3.Mesh(new T3.SphereGeometry(1.5, 8, 6), new T3.MeshBasicMaterial({ color: '#fff4cc', fog: false })); o.add(core); o.add(glowSprite(26));
    o.position.copy(from); g.scene.add(o); const T = from.distanceTo(to) / speed;
    TT.shells.push({ o, from: from.clone(), to: to.clone(), t: 0, T, onHit });
  }
  function boom(g, p, big) {
    const fx = g.effects; fx.explosion(p.clone(), null, true, 'orange'); fx.ring(p.clone(), new V(0, 1, 0), 4, big ? 70 : 40, 0.7, '#ffd060', 0.9); fx.flash(p.clone(), '#ffb040', 9, 160, 0.4, '#ff5020'); g.audio.play('boom', p);
  }

  let TT = null;
  const reset = (g) => { if (TT) { if (TT.far0 && g.camera.far > TT.far0) { g.camera.far = TT.far0; g.camera.updateProjectionMatrix(); } g.scene.remove(TT.W); for (const q of TT.towers) g.scene.remove(q.g); for (const s of TT.shells) g.scene.remove(s.o); for (const q of TT.debris) g.scene.remove(q.o); } TT = null; EVO.titan = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); reset(g); };

  function create(g, T, P) {
    const W = new T3.Group(), M = model(); M.visible = true; M.scale.setScalar(SC);   // v276 : la coque etait restee invisible apres une premiere destruction (modele partage)
     M.position.set(0, 0, 0); M.rotation.set(0, 0, 0); W.add(M);
    const ud = M.userData, tur = ud.turret, gun = ud.gun, slide = ud.slide, muz = ud.muzzle, radar = tur.getObjectByName('radar');
    tur.rotation.set(0, 0, 0); gun.rotation.set(0, 0, 0); slide.position.set(0, 0, 0); tur.position.set(0, 4.0, -0.2);
    // deux faisceaux de projecteurs qui balaient le ciel : un phare pour le voir de tres loin
    const beams = []; for (let i = 0; i < 2; i++) { const cone = new T3.Mesh(new T3.CylinderGeometry(16, 1.5, 320, 12, 1, true), new T3.MeshBasicMaterial({ color: '#cfe4ff', transparent: true, opacity: 0.2, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, fog: false })); cone.position.y = 160; const b = new T3.Group(); b.add(cone); b.position.set(i ? 26 : -26, 48, 6); b.userData.ph = i * 2.1; W.add(b); beams.push(b); }
    const col = EVO.colBox(W, 11.6 * SC, 7.4 * SC, 15.4 * SC, 0, 3.7 * SC, -0.5 * SC);
    // v280 : le canon a aussi une collision (elle suit son orientation : il est enfant de la tourelle)
    let gcol = null; { W.updateWorldMatrix(true, true); const gb = new T3.Box3().setFromObject(gun), gs = gb.getSize(new V()), gc = gun.worldToLocal(gb.getCenter(new V())); if (isFinite(gs.x) && gs.x > 0.1) gcol = EVO.colBox(gun, gs.x / SC, gs.y / SC, gs.z / SC, gc.x, gc.y, gc.z); }
    const dB = P.d0 - 10;
    TT = EVO.titan = { debris: [], ball: null, burst: 0, disp: 1, W, M, tur, gun, slide, muz, radar, beams, d: dB, d0: dB, lx: T.laneX(dB), hp: HP, mode: 'sleep', cool: 0, recoil: 0, shells: [], towers: [], ev: {}, fireT: 2, podT: 4, t: 0, dash: null, dying: 0, aim: 0, el: 0, smokeT: 0 };
    for (const [k, off, side] of [['A', 330, -1], ['B', 235, 1]]) { const tg = buildTower(); tg.rotation.order = 'YXZ'; TT.towers.push({ k, g: tg, d: dB - off, side, state: 'up', t: 0, ang: 0 }); }
    g.scene.add(W); W.visible = false;
    EVO.addDyn(W, (t, dt, gg) => upd(gg, dt), gcol ? [col, gcol] : [col], { near: 1e7, span: 1e7, hit: (gg) => hit(gg) });
    place(g, T);
    for (const q of TT.towers) { const p = T.at(q.d, T.laneX(q.d) + q.side * 42, 0); q.g.position.set(p[0], p[1], p[2]); q.g.rotation.y = heading(T, q.d); q.g.visible = false; g.scene.add(q.g); }
  }
  const heading = (T, d) => { const a = T.at(d, 0, 0), b = T.at(d - 6, 0, 0); return Math.atan2(b[0] - a[0], b[2] - a[2]); };   // cap vers les distances decroissantes (face a la fusee)
  function place(g, T) {
    const lx = T.laneX(TT.d); TT.lx += (lx - TT.lx) * 0.2; const p = T.at(TT.d, TT.lx, 0); TT.W.position.set(p[0], p[1], p[2]); TT.W.rotation.y = heading(T, TT.d) + Math.PI;
    { const q = TT.W.position.clone(); q.y += 34; const gy = EVO.groundY(g, q); if (gy !== null && gy !== undefined && Math.abs(gy - p[1]) < 12) TT.W.position.y = gy - 0.05; }   // v264 : pose sur le vrai sol (il flottait un peu)
  }

  // ---------- tir ----------
  function aimAt(g, target, dt) {
    TT.W.updateWorldMatrix(true, false); _a.copy(target); TT.W.worldToLocal(_a);
    const wy = U.clamp(Math.atan2(-_a.x, -_a.z), -1.25, 1.25), hd = Math.hypot(_a.x, _a.z), we = U.clamp(Math.atan2(_a.y - 24, Math.max(40, hd)), -0.04, 0.55);
    const k = Math.min(1, dt * 3.2); TT.aim += (wy - TT.aim) * k; TT.el += (we - TT.el) * k; TT.tur.rotation.y = TT.aim; TT.gun.rotation.x = TT.el;
  }
  function muzzle(out) { TT.muz.getWorldPosition(out); return out; }
  function fireFlash(g, p) { g.effects.flash(p.clone(), '#ffd890', 10, 260, 0.35, '#ff8a30'); g.effects.explosion(p.clone(), null, false, 'orange'); g.audio.play('boom', p); TT.recoil = 1; }
  function shotAtTower(g, q) {
    muzzle(_a); const from = _a.clone(), to = q.g.position.clone(); to.y += 50; fireFlash(g, from);
    shell(g, from, to, 300, () => { boom(g, to, true); g.rig.shake = Math.max(g.rig.shake, 1.0); q.state = 'hit'; q.t = 0; for (let i = 0; i < 24; i++) g.effects.sparks.emit({ pos: to, vel: new V(U.fx.range(-1, 1), U.fx.range(0.2, 1.2), U.fx.range(-1, 1)).multiplyScalar(U.fx.range(10, 40)), life: U.fx.range(0.5, 1.4), s0: 0.5, s1: 0.8, s2: 0.2, cols: g.effects.pal.ember, drag: 1, grav: 14, a: 1, fout: 0.5 }); });
  }
  function shotGraze(g) {
    const rk = g.rocket; muzzle(_a); const from = _a.clone(); fireFlash(g, from);
    g.spawnEnemyMissile(from.clone(), rk, { miss: 15, lead: 0, turn: 0, speed: 150, life: 8, quiet: true, visualFrom: from.clone() });
    const m = g.missiles[g.missiles.length - 1]; if (m && m.object) { m.object.scale.setScalar(5); m.object.add(glowSprite(5)); }
    g.rig.shake = Math.max(g.rig.shake, 0.35);
  }
  function pods(g) {
    const rk = g.rocket; TT.M.updateWorldMatrix(true, true);
    for (const sx of [-1, 1]) { _a.set(sx * 3.3, 4.6, 4.0); TT.M.localToWorld(_a); g.spawnEnemyMissile(_a.clone(), rk, { miss: 0, lead: 0.05, turn: 0.1, speed: 30, life: 7, quiet: true, visualFrom: _a.clone() }); }
    g.audio.play('hydraulic', _a);
  }

  // ---------- degats ----------
  function hit(g) {
    if (!TT || TT.mode === 'dying' || TT.mode === 'wreck') return true;
    if (TT.cool > 0) return true;
    TT.cool = 1.5; TT.hp--; const rk = g.rocket, p = rk.pos.clone();
    EVO.onBossHit(g, null); EVO.coinBurst(g, p, TT.hp > 0 ? 14 : 30);
    boom(g, p, true); g.rig.shake = Math.max(g.rig.shake, 1.6); g.flash = 0.35; g.flashColor = '#ffe9b0'; g.hitStop = 0.14; g.hitScale = 0.15; g.chromaBurst = 0.02;
    g.audio.play('clunk', p); g.audio.play('robotRoar', p);
    if (TT.hp > 0) { TT.mode = 'dash'; TT.dash = { t: 0, dur: 1.3, from: TT.d, to: Math.min(Math.max(TT.d, g.endlessRun.dist) + REACH, TT.d0 + CAP) }; if (CC.L1) CC.L1.msg(g, 'TOUCHE !  ENCORE UN !', 1.6, '#ffe9a0'); }
    else { TT.mode = 'dying'; TT.dying = 0; { const bl = glowSprite(1); bl.material.opacity = 0.95; bl.position.set(0, 26, 0); TT.W.add(bl); TT.ball = bl; } g.hitStop = 0.3; g.flash = 0.5; g.flashColor = '#ffffff'; g.chromaBurst = 0.03; if (CC.L1) CC.L1.msg(g, 'TITAN DETRUIT !', 2.4, '#ffe9a0'); }
    return true;
  }

  // l'explosion finale : la coque disparait, la tourelle et des blocs de blindage sont projetes
  function blast(g) {
    TT.M.visible = false; for (const b of TT.beams) b.visible = false; TT.W.updateWorldMatrix(true, true);
    const wp = TT.W.position, mk = (geo, mat, lx, ly, lz, sp, up) => { const o = new T3.Mesh(geo, mat); _c.set(lx, ly, lz); TT.W.localToWorld(_c); o.position.copy(_c); o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); g.scene.add(o); const d = _a.set(lx, 0, lz).normalize().applyQuaternion(TT.W.quaternion); TT.debris.push({ o, v: new V(d.x * sp + U.fx.range(-12, 12), up, d.z * sp + U.fx.range(-12, 12)), s: U.fx.range(-4, 4), t: 0 }); return o; };
    const turret = TT.tur.clone(); turret.scale.setScalar(SC); { const o = new T3.Group(); o.add(turret); TT.W.localToWorld(_c.set(0, 34, -2)); o.position.copy(_c); o.quaternion.copy(TT.W.quaternion); turret.position.set(0, 0, 0); turret.rotation.set(0, TT.aim, 0); g.scene.add(o); TT.debris.push({ o, v: new V(U.fx.range(-14, 14), 95, U.fx.range(-14, 14)), s: 1.4, t: 0 }); }
    const dark = new T3.MeshLambertMaterial({ color: '#2b2f36' }), hot = new T3.MeshBasicMaterial({ color: '#ff8a2a' }), mid = new T3.MeshLambertMaterial({ color: '#4a515c' });
    for (let i = 0; i < 18; i++) { const sz = U.fx.range(4, 13); mk(new T3.BoxGeometry(sz, sz * U.fx.range(0.4, 0.9), sz * U.fx.range(0.7, 1.4)), i % 5 === 0 ? hot : i % 2 ? dark : mid, U.fx.range(-32, 32), U.fx.range(6, 36), U.fx.range(-40, 36), U.fx.range(25, 85), U.fx.range(45, 115)); }
    // la carcasse calcinee qui reste au sol
    const ash = new T3.Mesh(new T3.CircleGeometry(46, 20), new T3.MeshBasicMaterial({ color: '#15110e', transparent: true, opacity: 0.85, depthWrite: false })); ash.rotation.x = -Math.PI / 2; ash.position.y = 0.4; TT.W.add(ash);
    const hull = new T3.Mesh(new T3.BoxGeometry(60, 6, 74), new T3.MeshLambertMaterial({ color: '#16171a' })); hull.position.set(0, 3, 0); TT.W.add(hull);
    for (const sx of [-1, 1]) { const tr = new T3.Mesh(new T3.BoxGeometry(14, 9, 70), new T3.MeshLambertMaterial({ color: '#101113' })); tr.position.set(sx * 30, 4.5, 0); TT.W.add(tr); }
  }

  // ---------- boucle ----------
  function upd(g, dt) {
    if (!TT || !g.endlessRun) return; const run = g.endlessRun, T = run.T, rk = g.rocket, rd = run.dist, fx = g.effects, live = g.state === 'FLIGHT' && rk && rk.active;
    TT.t += dt; TT.cool = Math.max(0, TT.cool - dt);
    const near = rd > TT.d0 - SEE && rd < TT.d0 + CAP + 520; TT.W.visible = near;
    if (near && g.camera.far < 1600) { TT.far0 = TT.far0 || g.camera.far; g.camera.far = 1600; g.camera.updateProjectionMatrix(); } else if (!near && TT.far0 && g.camera.far > TT.far0) { g.camera.far = TT.far0; g.camera.updateProjectionMatrix(); } for (const q of TT.towers) q.g.visible = rd > q.d - 700 && rd < q.d + 400;
    if (!near && TT.mode !== 'dash') return;
    place(g, T);
    if (live && TT.hp > 0 && EVO.holdAt && EVO.holdAt(g, TT.d + 75, 'DETRUIS LE TITAN !')) { /* v276 : impossible de depasser le Titan vivant */ }
    if (TT.radar) TT.radar.rotation.y += dt * (TT.mode === 'sleep' ? 0.6 : 1.8);
    for (const b of TT.beams) { b.rotation.z = Math.sin(TT.t * 0.5 + b.userData.ph) * 0.35 * (b.position.x > 0 ? 1 : -1) + (b.position.x > 0 ? 0.25 : -0.25); b.rotation.x = Math.cos(TT.t * 0.4 + b.userData.ph) * 0.25; b.visible = TT.mode !== 'wreck' && TT.mode !== 'dying'; }
    TT.recoil = Math.max(0, TT.recoil - dt * 2.2); TT.slide.position.z = TT.recoil * 5;
    const ev = TT.ev, dB = TT.d0;
    // ----- scenario d'arrivee, pilote par la distance -----
    if (live && TT.mode === 'sleep') {
      if (rd >= dB - 660 && !ev.wake) { ev.wake = 1; muzzle(_a); g.audio.play('robotRoar', TT.W.position); g.audio.play('robotAlarm'); g.rig.shake = Math.max(g.rig.shake, 0.7); g.flash = 0.2; g.flashColor = '#ffffff'; if (CC.L1) CC.L1.msg(g, 'LE TITAN !', 1.8, '#ff6a50'); EVO.radio(g, '', 1); }
      if (ev.wake) aimAt(g, TT.towers[0].g.position, dt);
      if (rd >= dB - 610 && !ev.a) { ev.a = 1; shotAtTower(g, TT.towers[0]); }
      if (rd >= dB - 520 && !ev.b) { ev.b = 1; aimAt(g, TT.towers[1].g.position, 1); shotAtTower(g, TT.towers[1]); }
      if (rd >= dB - 440 && !ev.c) { ev.c = 1; TT.mode = 'live'; TT.fireT = 0.6; }
    }
    if (TT.mode === 'live' || TT.mode === 'dash') {
      if (live) aimAt(g, rk.pos, dt);
      const dist = rk ? TT.W.position.distanceTo(rk.pos) : 999;
      if (live && TT.mode === 'live' && dist > 110 && dist < 760) {
        TT.fireT -= dt; if (TT.fireT <= 0) { TT.fireT = TT.hp >= 2 ? 2.6 : 2.0; shotGraze(g); }
        if (TT.hp <= 1) { TT.podT -= dt; if (TT.podT <= 0) { TT.podT = 4.6; pods(g); } }
      }
    }
    // ----- recul : il bondit en arriere, face a la fusee, dans un nuage de poussiere -----
    if (TT.mode === 'dash') {
      const D = TT.dash; D.t += dt; const k = U.smooth(0, 1, D.t / D.dur); TT.d = D.from + (D.to - D.from) * k;
      TT.smokeT -= dt; if (TT.smokeT <= 0) { TT.smokeT = 0.07; for (const sx of [-1, 1]) { _c.set(sx * 3.6 * SC, 0.5, 4 * SC); TT.W.localToWorld(_c); fx.dustKick(_c.clone(), new V(0, 1, 0), 1.6); fx.smokePuff(_c.clone(), new V(U.fx.range(-4, 4), U.fx.range(4, 10), U.fx.range(-4, 4)), 22, 1.8); } }
      if (rd < TT.d + 700 && rd > TT.d - 700) g.rig.shake = Math.max(g.rig.shake, 0.4 * Math.sin(Math.min(1, D.t / D.dur) * 3.14));
      if (D.t >= D.dur) { TT.mode = 'live'; TT.dash = null; TT.fireT = 1.1; TT.podT = 3.2; }
    }
    // ----- mort : boule de feu, la coque disparait dans l'explosion, des debris retombent, il reste une epave calcinee -----
    if (TT.mode === 'dying') {
      TT.dying += dt; const t = TT.dying; TT.smokeT -= dt;
      if (t > 0.28 && !TT.burst) { TT.burst = 1; blast(g); }
      if (TT.smokeT <= 0 && t < 2.4) { TT.smokeT = 0.1; _c.set(U.fx.range(-34, 34), U.fx.range(2, 40), U.fx.range(-44, 40)); TT.W.localToWorld(_c); fx.explosion(_c.clone(), null, true, Math.random() < 0.5 ? 'cyan' : 'orange'); fx.smokePuff(_c.clone(), new V(0, 12, 0), 34, 2.6); if (Math.random() < 0.5) g.audio.play('boom', _c); }
      g.rig.shake = Math.max(g.rig.shake, 1.2 * (1 - t / 3));
      if (TT.ball) { const k = U.clamp(t / 1.4, 0, 1); TT.ball.scale.setScalar(60 + 260 * (1 - Math.pow(1 - k, 3))); TT.ball.material.opacity = (1 - k) * 0.95; TT.ball.visible = k < 1; }
      if (t > 3.0) TT.mode = 'wreck';
    }
    for (let i = TT.debris.length - 1; i >= 0; i--) {
      const q = TT.debris[i]; q.t += dt; q.v.y -= 70 * dt; q.o.position.addScaledVector(q.v, dt); const gy = TT.W.position.y + 1;
      if (q.o.position.y < gy) { q.o.position.y = gy; q.v.multiplyScalar(0.2); q.v.y = Math.abs(q.v.y) * 0.3; q.s *= 0.3; if (!q.hit) { q.hit = 1; fx.dustKick(q.o.position.clone(), new V(0, 1, 0), 2); } }
      q.o.rotation.x += q.s * dt; q.o.rotation.z += q.s * 0.7 * dt; if (q.t > 0.4 && Math.random() < 0.25) fx.smokePuff(q.o.position.clone(), new V(0, 6, 0), 12, 1.4);
      if (q.t > 5) { g.scene.remove(q.o); TT.debris.splice(i, 1); }
    }
    if (TT.mode === 'wreck') { TT.smokeT -= dt; if (TT.smokeT <= 0 && near) { TT.smokeT = 0.18; _c.set(U.fx.range(-22, 22), 3, U.fx.range(-26, 26)); TT.W.localToWorld(_c); fx.smokePuff(_c.clone(), new V(0, 9, 0), 36, 3.2); if (Math.random() < 0.3) fx.flash(_c.clone(), '#ff8a30', 3, 40, 0.3, '#ff5020'); } }
    // ----- projectiles -----
    for (let i = TT.shells.length - 1; i >= 0; i--) {
      const s = TT.shells[i]; s.t += dt; const k = Math.min(1, s.t / s.T); s.o.position.lerpVectors(s.from, s.to, k); fx.trailPuff(s.o.position.clone(), _b.copy(s.to).sub(s.from).normalize());
      if (k >= 1) { g.scene.remove(s.o); TT.shells.splice(i, 1); if (s.onHit) s.onHit(); }
    }
    // ----- tours : touchee, elle penche puis tombe vers la fusee -----
    for (const q of TT.towers) {
      if (q.state === 'hit') {
        q.t += dt; const k = U.clamp((q.t - 0.25) / 1.7, 0, 1), a = k * k * 1.5; q.g.rotation.x = a; q.ang = a;
        if (q.t > 0.25 && Math.random() < 0.6) { _c.copy(q.g.position); _c.y += 20 + 30 * Math.cos(a); fx.smokePuff(_c, new V(U.fx.range(-4, 4), 6, U.fx.range(-4, 4)), 16, 1.6); }
        if (k >= 1) { q.state = 'down'; _c.copy(q.g.position); _c.y += 2; _c.add(_a.set(Math.sin(q.g.rotation.y), 0, Math.cos(q.g.rotation.y)).multiplyScalar(26)); fx.dustKick(_c.clone(), new V(0, 1, 0), 3); fx.ring(_c.clone(), new V(0, 1, 0), 4, 60, 0.8, '#cfc4b0', 0.5); fx.explosion(_c.clone(), null, true, 'orange'); g.audio.play('rumble', _c); g.audio.play('boom', _c); g.rig.shake = Math.max(g.rig.shake, 0.9); }
      }
    }
  }

  // creation paresseuse, une fois la fusee assez pres pour que le Titan compte
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (TT || !g.endlessRun || !g.endlessRun.T || !g.evo || g.evo.preview || (EVO.stage && EVO.stage(g) === 2)) return;
    const P = EVO.scenePos('porte'); if (!P) return;
    if (g.endlessRun.dist > P.d0 - 10 - SEE - 500) create(g, g.endlessRun.T, P);
  };

  // ---------- jauge de vie du boss ----------
  const rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  EVO.titanHud = (ctx, g, ox, u, H, UI, S) => {
    if (EVO.boss2Hud && EVO.boss2Hud(ctx, g, ox, u, H, UI, S)) return;
    if (!TT || TT.mode === 'sleep' || !g.endlessRun || (TT.mode === 'wreck' && TT.disp < 0.01)) return;
    const w = u * 0.5, h = S(24), x = ox + (u - w) / 2, y = H * 0.1, f = TT.hp / HP; TT.disp += (f - TT.disp) * 0.12;   // une simple barre qui descend : on ne devine pas le nombre de coups
    ctx.save(); ctx.globalAlpha = TT.mode === 'wreck' ? U.clamp(TT.disp * 10, 0, 1) : 1; rrect(ctx, x, y, w, h, h / 2); ctx.clip();
    ctx.fillStyle = 'rgba(8,12,18,0.5)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#E8433A'; ctx.fillRect(x, y, w * Math.max(0, TT.disp), h);
    ctx.restore();
  };
})();
