/* v412 : LE MANEGE DE GUERRE — le boss du niveau 3 (fete foraine). Un carrousel geant BLINDE monte sur chenilles, au milieu de l'arene de la place de nuit.
 * A la place des chevaux : quatre tourelles a double canon et quatre lance-missiles, qui montent et descendent comme sur un vrai manege.
 *  - il dort, eteint ; a 650 m il se reveille : vague de lumieres, les armes sortent du plancher, il se met a tourner (fanfare, sirene)
 *  - 3 coups, TOUCHABLE PARTOUT (comme les boss du niveau 2) ; a chaque coup il recule de 170 m sur ses chenilles et tourne plus vite
 *  - phase 1 : obus qui frolent la fusee ; phase 2 (lumieres orange) : + missiles lents ; phase 3 (rouge, clignote) : + salves de feu d'artifice
 *  - mort : le toit s'envole en tournant, les armes sont projetees, boule de feu, bouquet final de feux d'artifice ; puis on file a l'arche d'ARRIVEE
 * Tester le niveau sans boss : &noboss=1 (l'arrivee reste ouverte). */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO.addDyn) return;
  const NOBOSS = /[?&]noboss=1/.test(location.search), SEE = 1400, HP = 3, WAKE = 650;
  const _a = new V(), _b = new V(), _c = new V();
  const rr = (a, b) => a + Math.random() * (b - a);
  const on3 = (g) => !!(EVO.stage && EVO.stage(g) === 3);
  const FWC = ['#ff5ad8', '#ffd23a', '#5af0ff', '#ff6a3a', '#9aff6a', '#ffffff'];
  const FWP = FWC.map((c) => [new T3.Color('#ffffff'), new T3.Color(c), new T3.Color(c).multiplyScalar(0.6)]);
  const PH = [['#fff0b8', '#ffd36a'], ['#ffb04a', '#ff6a3a'], ['#ff3a3a', '#ffffff']];   // couleurs des ampoules par phase (3, 2, 1 points de vie)

  let MATS = null;
  const mats = () => MATS || (MATS = { lit: new T3.MeshLambertMaterial({ vertexColors: true, fog: false, emissive: '#1c1a24' }), A: new T3.MeshBasicMaterial({ vertexColors: true, fog: false, color: '#000000' }), B: new T3.MeshBasicMaterial({ vertexColors: true, fog: false, color: '#000000' }), char: new T3.MeshLambertMaterial({ color: '#17130f', fog: false }) });

  // ---------------- le modele ----------------
  function model() {
    const K = EVO.foireKit, { bake, BX, CY, SP, CO, TO } = K, M = mats(), W = new T3.Group();
    const mesh = (parts, mat) => { const m = bake(parts); m.material = mat; m.castShadow = true; return m; };
    const OL = '#55663a', OD = '#2a2e26', GOLD = '#e8b43a', RED = '#c8302a';
    // ===== la base : deux chenilles, le tambour blinde, bande jaune et noire, rivets =====
    const base = [];
    for (const sx of [-1, 1]) { base.push({ g: BX(12, 10, 80), c: OD, p: [sx * 41, 5, 0] }, { g: BX(14, 1.6, 82), c: OL, p: [sx * 41, 10.6, 0] }); for (let k = 0; k < 7; k++) base.push({ g: CY(4.3, 4.3, 13, 12), c: '#4a4e44', p: [sx * 41, 4.6, -33 + k * 11], r: [0, 0, Math.PI / 2] }, { g: CY(1.6, 1.6, 13.4, 8), c: GOLD, p: [sx * 41, 4.6, -33 + k * 11], r: [0, 0, Math.PI / 2] }); }
    base.push({ g: CY(38, 40, 14, 32), c: OL, p: [0, 13, 0] }, { g: CY(40.4, 40.4, 3, 32), st: ['#ffc72a', '#1a1a1a'], n: 32, p: [0, 8, 0] }, { g: CY(41, 41, 1.6, 32), c: GOLD, p: [0, 20.8, 0] });
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + 0.26; base.push({ g: BX(15, 7, 2), c: '#3e4a30', p: [Math.sin(a) * 39.4, 14.5, Math.cos(a) * 39.4], r: [0, a, 0] }); for (const o of [-5.5, 5.5]) base.push({ g: SP(0.6, 6, 4), c: GOLD, p: [Math.sin(a) * 40.5 + Math.cos(a) * o, 17, Math.cos(a) * 40.5 - Math.sin(a) * o] }); }
    const baseM = mesh(base, M.lit); W.add(baseM);
    { const bl = []; for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; bl.push({ g: SP(0.9, 6, 5), c: '#ffffff', p: [Math.sin(a) * 40.6, 19, Math.cos(a) * 40.6] }); } W.add(mesh(bl, M.A)); }
    // ===== le plancher qui tourne : colonne centrale, barres dorees, le toit raye, les ampoules =====
    const deck = new T3.Group(); deck.position.y = 21; W.add(deck);
    const dk = [{ g: CY(39, 39, 1.4, 32), st: [RED, GOLD], n: 16, p: [0, 0.7, 0] }, { g: CY(7, 7, 40, 16), st: [GOLD, RED, '#f6f2ea'], n: 12, p: [0, 21, 0] }, { g: CY(9.5, 9.5, 2, 16), c: GOLD, p: [0, 2, 0] }, { g: CY(9.5, 9.5, 2, 16), c: GOLD, p: [0, 40, 0] }];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; dk.push({ g: BX(3.2, 12, 0.6), c: '#bfe8ff', p: [Math.sin(a) * 7.3, 28, Math.cos(a) * 7.3], r: [0, a, 0] }); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; dk.push({ g: CY(0.8, 0.8, 40, 8), c: '#f0c860', p: [Math.sin(a) * 28, 20, Math.cos(a) * 28] }); }
    const deckM = mesh(dk, M.lit); deck.add(deckM);
    const roof = new T3.Group(); roof.position.y = 40; deck.add(roof);
    const rf = [{ g: CO(50, 18, 32), st: [RED, '#f6f2ea'], n: 16, p: [0, 9, 0] }, { g: CY(50, 50, 4, 32, true), st: [RED, '#f6f2ea'], n: 16, p: [0, -1, 0] }, { g: CY(49.6, 49.6, 0.6, 32), c: '#3a2030', p: [0, -2.6, 0] }, { g: CY(5, 6.5, 6, 12), c: GOLD, p: [0, 20, 0] }, { g: SP(4.2, 12, 9), c: RED, p: [0, 25, 0] }, { g: CY(0.4, 0.4, 16, 6), c: '#dddddd', p: [0, 32, 0] }, { g: BX(0.4, 5, 9), c: RED, p: [0, 37, 4.6] }];
    for (let k = 0; k < 32; k++) { const a = (k + 0.5) / 32 * Math.PI * 2; rf.push({ g: BX(8.6, 6, 0.6), c: k % 2 ? GOLD : RED, p: [Math.sin(a) * 50.2, -5.6, Math.cos(a) * 50.2], r: [0, a, 0] }); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; rf.push({ g: BX(6, 3, 8), c: OL, p: [Math.sin(a) * 22, 12, Math.cos(a) * 22], r: [0, a, 0] }, { g: BX(0.9, 0.9, 10), c: OD, p: [Math.sin(a) * 25, 14, Math.cos(a) * 25], r: [0, a, 0] }); }
    const roofM = mesh(rf, M.lit); roof.add(roofM);
    { const ba = [], bb = []; for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; (k % 2 ? bb : ba).push({ g: SP(1.1, 6, 5), c: '#ffffff', p: [Math.sin(a) * 50.8, 0.2, Math.cos(a) * 50.8] }); }
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let j = 1; j <= 6; j++) { const f = j / 7, R = 50 * (1 - f) + 0.6; (j % 2 ? ba : bb).push({ g: SP(0.8, 6, 4), c: '#ffffff', p: [Math.sin(a) * R, 18 * f + 0.6, Math.cos(a) * R] }); } }
      roof.add(mesh(ba, M.A)); roof.add(mesh(bb, M.B)); }
    // projecteurs qui balaient la nuit (ils tournent avec le toit)
    const beams = []; for (let i = 0; i < 2; i++) { const cone = new T3.Mesh(new T3.CylinderGeometry(18, 1.5, 300, 12, 1, true), new T3.MeshBasicMaterial({ color: i ? '#ff7ad8' : '#7ae8ff', transparent: true, opacity: 0.16, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, fog: false })); cone.position.y = 150; const b = new T3.Group(); b.add(cone); b.position.set(i ? 14 : -14, 24, 0); b.rotation.z = i ? -0.55 : 0.55; roof.add(b); beams.push(b); }
    // ===== les armes : 4 tourelles a double canon et 4 lance-missiles sur les barres (elles montent et descendent) =====
    const weapons = [];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, w = new T3.Group(), turret = k % 2 === 0, p = [{ g: CY(5.4, 3.6, 3, 16), st: [GOLD, RED], n: 8, p: [0, 1.5, 0] }, { g: TO(5.4, 0.5, 6, 20), c: GOLD, p: [0, 3, 0], r: [Math.PI / 2, 0, 0] }];
      if (turret) p.push({ g: BX(9, 5, 11), c: OL, p: [0, 5.5, 0] }, { g: BX(9.3, 1, 11.3), c: RED, p: [0, 3.6, 0] }, { g: CY(2.2, 2.2, 1.2, 10), c: OD, p: [0, 8.6, -1.5] }, { g: CY(0.75, 0.75, 13, 8), c: OD, p: [-1.7, 5.5, 11], r: [Math.PI / 2, 0, 0] }, { g: CY(0.75, 0.75, 13, 8), c: OD, p: [1.7, 5.5, 11], r: [Math.PI / 2, 0, 0] }, { g: CY(1.05, 1.05, 1.8, 8), c: GOLD, p: [-1.7, 5.5, 17.6], r: [Math.PI / 2, 0, 0] }, { g: CY(1.05, 1.05, 1.8, 8), c: GOLD, p: [1.7, 5.5, 17.6], r: [Math.PI / 2, 0, 0] });
      else { p.push({ g: BX(9, 7, 9), c: '#4e5c3a', p: [0, 7, 0], r: [-0.35, 0, 0] }); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = -2.8 + i * 2.8, y = 5.6 + j * 3; p.push({ g: CY(1.15, 1.15, 10, 8), c: '#3a4430', p: [x, y + 1.6, 3.4], r: [Math.PI / 2 - 0.35, 0, 0] }, { g: CY(1.2, 1.2, 1, 8), c: '#e23a32', p: [x, y + 3.2, 8.2], r: [Math.PI / 2 - 0.35, 0, 0] }); } }
      w.add(mesh(p, M.lit)); w.position.set(Math.sin(a) * 28, -16, Math.cos(a) * 28); w.rotation.y = a; deck.add(w);
      weapons.push({ w, turret, k, base: 6 + (k % 3) * 4, muz: turret ? [new V(-1.7, 5.5, 18.6), new V(1.7, 5.5, 18.6)] : [new V(0, 9, 9)] });
    }
    const glows = []; if (EVO.boss2Kit) for (let k = 0; k < 3; k++) { const s = EVO.boss2Kit.glow(70, '#ffd36a'); s.position.set(0, 4 + k * 8, 0); s.visible = false; roof.add(s); glows.push(s); }
    return { W, base: baseM, deck, deckM, roof, beams, weapons, glows };
  }

  // ---------------- etat ----------------
  let B = null;
  const reset = (g) => { if (B) { if (B.far0 && g.camera.far > B.far0) { g.camera.far = B.far0; g.camera.updateProjectionMatrix(); } g.scene.remove(B.M.W); for (const q of B.debris) g.scene.remove(q.o); } B = null; EVO.boss3 = null; EVO.f3Fin = null; };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); reset(g); };
  const heading = (T, d) => { const a = T.at(d, 0, 0), b = T.at(d - 6, 0, 0); return Math.atan2(b[0] - a[0], b[2] - a[2]); };

  function create(g, T, P) {
    const F = EVO.F3, dB = P.d0 + F.bossU * P.len, M = model();
    B = EVO.boss3 = { M, d: dB, d0: dB, dMax: dB + 2 * F.step, dFin: P.d0 + F.finU * P.len, lx: T.laneX(dB), hp: HP, mode: 'sleep', cool: 0, t: 0, wt: 0, spin: 0, fireT: 1, podT: 4, fwT: 2, dash: null, dying: 0, debris: [], smokeT: 0, disp: 1, far0: 0, lights: 0 };
    g.scene.add(M.W); M.W.visible = false;
    const col = EVO.colBox(M.W, 96, 80, 96, 0, 40, 0);
    EVO.addDyn(M.W, (t, dt, gg) => { if (B && B.M === M) upd(gg, dt); }, [col], { near: 1e7, span: 1e7, hit: (gg) => hit(gg) });
    B.col = EVO.dyn[EVO.dyn.length - 1];
    place(g, T);
  }
  function place(g, T) {
    const lx = T.laneX(B.d); B.lx += (lx - B.lx) * 0.2; const p = T.at(B.d, B.lx, 0); B.M.W.position.set(p[0], p[1], p[2]); B.M.W.rotation.y = heading(T, B.d);
  }

  // ---------------- tirs ----------------
  const shotAt = (g, from) => {   // obus qui FROLE la fusee : l'ecart est toujours lateral
    const rk = g.rocket; g.spawnEnemyMissile(from.clone(), rk, { miss: 16, lead: 0, turn: 0, speed: 150, life: 8, quiet: true, visualFrom: from.clone() });
    const m = g.missiles[g.missiles.length - 1];
    if (m) { _a.copy(rk.pos).sub(from).normalize(); _b.crossVectors(_a, new V(0, 1, 0)).normalize(); _c.crossVectors(_b, _a).normalize(); const sg = Math.random() < 0.5 ? -1 : 1; m.miss.copy(_b).multiplyScalar(sg * rr(13, 19)).addScaledVector(_c, rr(-6, 6)); m.dir.copy(rk.pos).sub(from).add(m.miss).normalize(); if (m.object) m.object.scale.setScalar(5); }
    g.effects.flash(from.clone(), '#ffd890', 10, 260, 0.35, '#ff8a30'); g.audio.play('boom', from); g.rig.shake = Math.max(g.rig.shake, 0.3);
  };
  const nearest = (g, turret) => { let best = null, bd = 1e9; for (const q of B.M.weapons) { if (q.turret !== turret) continue; q.w.getWorldPosition(_a); const d = _a.distanceToSquared(g.rocket.pos); if (d < bd) { bd = d; best = q; } } return best; };
  function fireTurret(g) { const q = nearest(g, true); if (!q) return; q.w.updateWorldMatrix(true, false); const m = q.muz[Math.random() < 0.5 ? 0 : 1]; _c.copy(m); q.w.localToWorld(_c); shotAt(g, _c.clone()); q.kick = 1; }
  function firePods(g) { const rk = g.rocket; let n = 0; for (const q of B.M.weapons) { if (q.turret || n >= 2) continue; q.w.getWorldPosition(_a); if (_a.distanceTo(rk.pos) > 520) continue; n++; _c.copy(q.muz[0]); q.w.localToWorld(_c); g.spawnEnemyMissile(_c.clone(), rk, { miss: 0, lead: 0.05, turn: 0.1, speed: 30, life: 7, quiet: true, visualFrom: _c.clone() }); g.effects.flash(_c.clone(), '#ff8a5a', 6, 120, 0.3, '#ff5020'); } if (n) g.audio.play('hydraulic', _c); }
  function burst(g, p, big) {   // une gerbe de feu d'artifice (couleurs vives)
    const fx = g.effects, i = Math.floor(Math.random() * FWC.length), c = FWC[i];
    fx.ring(p.clone(), new V(rr(-0.3, 0.3), 1, rr(-0.3, 0.3)).normalize(), 2, big ? 70 : 42, 0.9, c, 0.9); fx.flash(p.clone(), c, big ? 18 : 10, big ? 520 : 260, 0.5, c);
    for (let k = 0; k < (big ? 40 : 22); k++) fx.sparks.emit({ pos: p.clone(), vel: new V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize().multiplyScalar(rr(18, big ? 60 : 40)), life: rr(0.7, 1.5), s0: 1.2, s1: 1.4, s2: 0.3, cols: FWP[i], drag: 1.4, grav: 9, a: 1, fout: 0.5 });
    g.audio.play(Math.random() < 0.5 ? 'boomSmall' : 'boom', p);
  }
  function salvo(g) {   // phase 3 : six fusees de feu d'artifice qui eclatent autour de la trajectoire (elles ne touchent pas)
    const rk = g.rocket, T = g.endlessRun.T, rd = g.endlessRun.dist;
    for (let k = 0; k < 6; k++) setTimeout(() => { if (!B || B.mode !== 'live' || !g.rocket.active) return; const d = rd + 80 + k * 22, s = k % 2 ? 1 : -1, p = T.at(d, T.laneX(d) + s * rr(26, 40), Math.max(20, rk.pos.y - T.base(d)) + rr(-6, 14)); burst(g, new V(p[0], p[1], p[2]), false); }, k * 140);
  }

  // ---------------- degats ----------------
  function wake(g, quiet) {
    if (B.mode !== 'sleep') return; B.mode = 'wake'; B.wt = 0;
    if (quiet) return; g.audio.play('robotRoar', B.M.W.position); g.audio.play('robotAlarm'); g.audio.play('levelUp'); g.rig.shake = Math.max(g.rig.shake, 0.8); g.flash = 0.25; g.flashColor = '#ffd0f0';
    if (CC.L1) CC.L1.msg(g, 'LE MANEGE DE GUERRE !', 2.2, '#ff6a50'); if (EVO.radio) EVO.radio(g, 'CENTRE : LE MANEGE EST BLINDE ! FONCE DEDANS, PARTOUT !', 3.2);
  }
  function hit(g) {
    if (!B || B.mode === 'dying' || B.mode === 'dead') return true;
    if (B.cool > 0) return true;
    if (B.mode === 'sleep') wake(g, true);
    B.cool = 1.5; B.hp--; const rk = g.rocket, p = rk.pos.clone(), fx = g.effects;
    if (EVO.onBossHit) EVO.onBossHit(g, null); if (EVO.coinBurst) EVO.coinBurst(g, p, B.hp > 0 ? 16 : 40);
    fx.explosion(p.clone(), null, true, 'orange'); fx.explosion(p.clone().add(_b.set(8, 4, 6)), null, true, 'orange'); fx.ring(p.clone(), new V(0, 1, 0), 6, 60, 0.7, '#ffd060', 0.8); for (let k = 0; k < 3; k++) burst(g, p.clone().add(_b.set(rr(-20, 20), rr(4, 24), rr(-20, 20))), false);
    g.audio.play('boom', p); g.audio.play('clunk', p); g.audio.play('robotRoar', p);
    g.rig.shake = Math.max(g.rig.shake, 1.7); g.flash = 0.35; g.flashColor = '#ffe9b0'; g.hitStop = 0.14; g.hitScale = 0.15; g.chromaBurst = 0.02;
    if (B.hp > 0) {
      B.mode = 'dash'; B.dash = { t: 0, dur: 1.5, from: B.d, to: Math.min(Math.max(B.d, g.endlessRun.dist) + EVO.F3.step, B.dMax) }; B.spin += 2.5;
      if (CC.L1) CC.L1.msg(g, B.hp === 2 ? 'TOUCHE !  ENCORE 2 COUPS' : 'ENCORE UN COUP !', 1.8, '#ffe9a0');
    } else {
      B.mode = 'dying'; B.dying = 0; B.col.cols.length = 0; g.hitStop = 0.3; g.flash = 0.5; g.flashColor = '#ffffff'; g.chromaBurst = 0.03;
      if (CC.L1) CC.L1.msg(g, 'MANEGE DE GUERRE DETRUIT !', 2.6, '#ffe9a0');
    }
    return true;
  }
  // le toit s'envole en tournant, les armes sont projetees ; la base reste, calcinee
  function blast(g) {
    const M = B.M, fx = g.effects; M.W.updateWorldMatrix(true, true);
    const fly = (o, v, s) => { o.updateWorldMatrix(true, false); const wp = new V(), wq = new T3.Quaternion(); o.getWorldPosition(wp); o.getWorldQuaternion(wq); o.parent.remove(o); o.position.copy(wp); o.quaternion.copy(wq); g.scene.add(o); B.debris.push({ o, v, s, t: 0, life: 6 }); };
    fly(M.roof, new V(rr(-10, 10), 70, rr(-10, 10)), new V(0.4, 3.2, 0.3));
    for (const q of M.weapons) { q.w.getWorldPosition(_a); _b.subVectors(_a, M.W.position).setY(0).normalize(); fly(q.w, new V(_b.x * rr(30, 60), rr(40, 80), _b.z * rr(30, 60)), new V(rr(-4, 4), rr(-4, 4), rr(-4, 4))); }
    M.base.material = mats().char; M.deckM.material = mats().char;
    if (EVO.boss2Kit) { const ball = EVO.boss2Kit.glow(60, '#ffd9a0'); ball.position.set(0, 30, 0); M.W.add(ball); B.ball = ball; }
    for (let i = 0; i < 6; i++) fx.explosion(M.W.position.clone().add(_b.set(rr(-36, 36), rr(10, 50), rr(-36, 36))), null, true, 'orange');
    fx.ring(M.W.position.clone().add(_b.set(0, 4, 0)), new V(0, 1, 0), 10, 180, 1.1, '#ffd060', 0.9);
    if (fx.debris) for (let k = 0; k < 80; k++) fx.debris.emit({ pos: M.W.position.clone().add(_b.set(rr(-20, 20), rr(10, 40), rr(-20, 20))), vel: new V(rr(-50, 50), rr(10, 70), rr(-50, 50)), life: 2 + Math.random() * 1.5, s0: 1.8, s1: 1.8, s2: 0.5, peak: 0.1, cols: fx.pal.debrisLight, grav: 26, drag: 0.5, spin: 6 });
    g.audio.play('boom'); g.audio.play('boom'); g.rig.shake = Math.max(g.rig.shake, 1.8);
  }

  // ---------------- boucle ----------------
  function upd(g, dt) {
    if (!B || !g.endlessRun) return; const run = g.endlessRun, T = run.T, rk = g.rocket, rd = run.dist, fx = g.effects, M = B.M, live = g.state === 'FLIGHT' && rk && rk.active;
    B.t += dt; B.cool = Math.max(0, B.cool - dt);
    const near = rd > B.d0 - SEE && rd < B.dMax + 900; M.W.visible = near;
    if (near && g.camera.far < 1600) { B.far0 = B.far0 || g.camera.far; g.camera.far = 1600; g.camera.updateProjectionMatrix(); } else if (!near && B.far0 && g.camera.far > B.far0) { g.camera.far = B.far0; g.camera.updateProjectionMatrix(); }
    if (!near && B.mode !== 'dash') return;
    place(g, T);
    if (live && B.hp > 0 && EVO.holdAt) EVO.holdAt(g, B.d + 54, 'DETRUIS LE MANEGE !');   // impossible de le depasser vivant
    if (live && B.mode === 'sleep' && rd > B.d0 - WAKE) wake(g);
    // ----- reveil : vague de lumieres, les armes sortent, il se met a tourner -----
    let want = 0;
    if (B.mode === 'wake') { B.wt += dt; B.lights = Math.min(1, B.wt / 1.2); for (const q of M.weapons) q.rise = U.clamp((B.wt - 0.5 - q.k * 0.12) / 0.9, 0, 1); want = 0.5; if (B.wt > 2.4) { B.mode = 'live'; B.fireT = 0.8; } }
    else if (B.mode === 'live' || B.mode === 'dash') { want = [1.6, 1.0, 0.5][Math.max(0, B.hp - 1)]; B.lights = 1; for (const q of M.weapons) q.rise = 1; }
    else if (B.mode === 'dying') want = 6;
    B.spin += (want - B.spin) * Math.min(1, dt * (B.mode === 'dying' ? 2 : 0.8)); M.deck.rotation.y += B.spin * dt;
    for (const q of M.weapons) { if (q.w.parent !== M.deck) continue; q.kick = Math.max(0, (q.kick || 0) - dt * 4); q.w.position.y = -16 + ((q.rise || 0) * (16 + q.base + Math.sin(B.t * 2.2 + q.k * 0.8) * 3.5)); q.w.children[0].position.z = -q.kick * 2; }
    for (const b of M.beams) { b.visible = B.lights > 0.5 && B.mode !== 'dying' && B.mode !== 'dead'; b.rotation.x = Math.sin(B.t * 0.7 + b.position.x) * 0.3; }
    // ampoules : chenillard ; la couleur dit la phase (doree, orange, rouge qui clignote)
    { const ms = mats(), ph = PH[U.clamp(HP - B.hp, 0, 2)], sp = B.hp <= 1 ? 9 : B.hp === 2 ? 5 : 3, on = Math.sin(B.t * sp) > 0, L = (B.mode === 'dying' || B.mode === 'dead') ? 0 : B.lights;
      ms.A.color.set(ph[0]).multiplyScalar(L * (on ? 1 : 0.3)); ms.B.color.set(ph[1]).multiplyScalar(L * (on ? 0.3 : 1)); for (const s of M.glows) { s.visible = L > 0.5; s.material.color.set(ph[0]); } }
    // ----- attaques -----
    if (live && B.mode === 'live') {
      const dist = M.W.position.distanceTo(rk.pos);
      if (dist > 100 && dist < 820) {
        B.fireT -= dt; if (B.fireT <= 0) { B.fireT = [1.5, 1.9, 2.4][Math.max(0, B.hp - 1)]; fireTurret(g); }
        if (B.hp <= 2) { B.podT -= dt; if (B.podT <= 0) { B.podT = B.hp <= 1 ? 3.8 : 4.6; firePods(g); } }
        if (B.hp <= 1) { B.fwT -= dt; if (B.fwT <= 0) { B.fwT = 3.2; salvo(g); } }
      }
    }
    // ----- recul sur chenilles : poussiere, secousse -----
    if (B.mode === 'dash') {
      const D = B.dash; D.t += dt; const k = U.smooth(0, 1, D.t / D.dur); B.d = D.from + (D.to - D.from) * k;
      B.smokeT -= dt; if (B.smokeT <= 0) { B.smokeT = 0.07; for (const sx of [-1, 1]) { _c.set(sx * 41, 1, 38); M.W.localToWorld(_c); fx.dustKick(_c.clone(), new V(0, 1, 0), 2); fx.smokePuff(_c.clone(), new V(rr(-4, 4), rr(4, 10), rr(-4, 4)), 26, 1.8); } }
      if (rd > B.d - 700) g.rig.shake = Math.max(g.rig.shake, 0.45 * Math.sin(Math.min(1, D.t / D.dur) * 3.14));
      if (D.t >= D.dur) { B.mode = 'live'; B.dash = null; B.fireT = 1.0; B.podT = 2.6; B.fwT = 1.2; g.audio.play('robotAlarm'); }
    }
    if (B.mode === 'dying' || B.mode === 'dead') { rk.fuel = rk.fuelMax; rk.shieldT = Math.max(rk.shieldT || 0, 4); if (rk.vel.y < 0) rk.vel.y *= 0.6; }   // pendant la mort et la course vers l'arrivee : pas de panne, pas de crash
    // ----- mort : explosions en chaine et feux d'artifice, le toit s'envole, boule de feu, bouquet final -----
    if (B.mode === 'dying') {
      B.dying += dt; const t = B.dying; B.smokeT -= dt;
      if (B.smokeT <= 0 && t < 3.2) { B.smokeT = 0.16; _c.set(rr(-40, 40), rr(8, 60), rr(-40, 40)); M.W.localToWorld(_c); if (Math.random() < 0.5) fx.explosion(_c.clone(), null, true, 'orange'); else burst(g, _c.clone().add(_b.set(0, 30, 0)), Math.random() < 0.3); }
      if (t > 1.1 && !B.burst) { B.burst = 1; blast(g); }
      if (B.ball) { const k = U.clamp((t - 1.1) / 1.4, 0, 1); B.ball.scale.setScalar(60 + 420 * (1 - Math.pow(1 - k, 3))); B.ball.material.opacity = (1 - k) * 0.95; B.ball.visible = k < 1; }
      g.rig.shake = Math.max(g.rig.shake, 1.1 * (1 - t / 3.6));
      if (t > 1.4 && !EVO.f3Fin) EVO.f3Fin = M.W.position.clone();
      if (t > 3.4) { B.mode = 'dead'; if (CC.L1) CC.L1.msg(g, 'FONCE VERS L ARRIVEE !', 2.6, '#ffe9a0'); g.audio.play('levelUp'); }
    }
    if (B.mode === 'dead') { B.smokeT -= dt; if (B.smokeT <= 0 && near) { B.smokeT = 0.2; _c.set(rr(-28, 28), 20, rr(-28, 28)); M.W.localToWorld(_c); fx.smokePuff(_c.clone(), new V(0, 10, 0), 34, 3); } if (Math.random() < dt * 2.2) burst(g, M.W.position.clone().add(_b.set(rr(-160, 160), rr(70, 150), rr(-160, 160))), Math.random() < 0.4); }
    for (let i = B.debris.length - 1; i >= 0; i--) { const q = B.debris[i]; q.t += dt; q.v.y -= 40 * dt; q.o.position.addScaledVector(q.v, dt); q.o.rotation.x += q.s.x * dt; q.o.rotation.y += q.s.y * dt; q.o.rotation.z += q.s.z * dt; if (Math.random() < 0.3) fx.smokePuff(q.o.position.clone(), new V(0, 6, 0), 16, 1.4); if (q.t > q.life) { g.scene.remove(q.o); B.debris.splice(i, 1); } }
  }

  // creation paresseuse (a 1 800 m), et l'arrivee : on la franchit une fois le boss detruit
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!g.endlessRun || !g.endlessRun.T || !g.evo || g.evo.preview || !on3(g) || !EVO.F3 || !EVO.scenePos) return;
    const P = EVO.scenePos('fnuit'); if (!P) return; const run = g.endlessRun, rd = run.dist;
    if (!B && !NOBOSS && rd > P.d0 + EVO.F3.bossU * P.len - SEE - 400) create(g, run.T, P);
    const dFin = P.d0 + EVO.F3.finU * P.len;
    if ((NOBOSS || (B && B.mode === 'dead')) && rd > dFin && !g.evoFinish && g.state === 'FLIGHT' && g.rocket.active && EVO.finishRun) EVO.finishRun(g);
  };

  // jauge de vie : la meme barre que les autres boss
  const rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const _th = EVO.titanHud;
  EVO.titanHud = (ctx, g, ox, u, H, UI, S) => {
    if (B && B.mode !== 'sleep' && g.endlessRun && !(B.mode === 'dead' && B.disp < 0.01)) {
      const w = u * 0.5, h = S(24), x = ox + (u - w) / 2, y = H * 0.1, f = B.hp / HP; B.disp += (f - B.disp) * 0.12;
      ctx.save(); ctx.globalAlpha = B.mode === 'dead' || B.mode === 'dying' ? U.clamp(B.disp * 10, 0, 1) : 1; rrect(ctx, x, y, w, h, h / 2); ctx.clip(); ctx.fillStyle = 'rgba(8,12,18,0.5)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#E8433A'; ctx.fillRect(x, y, w * Math.max(0, B.disp), h); ctx.restore(); return;
    }
    if (_th) _th(ctx, g, ox, u, H, UI, S);
  };
})();
