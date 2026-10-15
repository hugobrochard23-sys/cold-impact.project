/* v132 : LE FINAL du niveau 1 — la CITADELLE. Quatre scènes : approche (siège de nuit), porte (le GARDIEN, robot de 90 m), noyau (hall du réacteur), fuite
 * (tout s'effondre, la musique s'emballe ; les chutes sont minutées pour frôler la fusée sans jamais la toucher) puis l'arche d'arrivée au lever du soleil.
 * Le robot, le réacteur et les débris sont des objets animés (evo_dyn.js) ; les collisions du robot sont des boîtes qui suivent ses membres. */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, D = Z.defs.campagne, foe = Z.evoFoe, EVO = CC.EVO, T3 = THREE, V = T3.Vector3;
  if (!D || !foe || !EVO || !EVO.addDyn) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const GREY = ['#4a4e54', '#43474d', '#50555c', '#3c4046'], BURN = ['#3a2a24', '#34262a', '#40302a'];
  const lam = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e, fog: false } : { color: c, fog: false });
  const emi = (c) => new T3.MeshBasicMaterial({ color: c, fog: false });
  const mb = (grp, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };
  const mc = (grp, rt, rb, h, m, x, y, z, seg, rotX) => { const o = new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 12), m); o.position.set(x, y, z); if (rotX) o.rotation.x = Math.PI / 2; grp.add(o); return o; };
  const lamp = (S, dc, lx, y, col, size) => { S.bx(dc, lx, y, 1.2, 0.35, 0.8, 'emis:' + (col || '#ffe2a8'), undefined, false); S.glow(dc, lx, y - 0.3, col || '#ffe2a8', size || 12); };
  const boulder = (S, dc, lx, y, s, r, gray) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, GREY), noMoss: true }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const heading = (S, dc) => { const a = S.T.at(dc, 0, 0), b = S.T.at(dc - 6, 0, 0); return Math.atan2(b[0] - a[0], b[2] - a[2]); };   // cap vers les distances décroissantes (le robot FAIT FACE à la fusée)
  const pos = (S, grp, dc, lx, y, yaw) => { const p = S.at(dc, lx, y); grp.position.set(p[0], p[1], p[2]); grp.rotation.y = yaw; S.b.root.add(grp); return grp; };
  EVO.scenePos = (key) => { const c = (EVO.chapters || []).find((q) => q.key === key); return c ? { d0: c.d + 80, len: D.scenes[key].len[0] } : null; };

  // ============================== LE GARDIEN ==============================
  function buildRobot() {
    const G = new T3.Group(), S = 0.85, root = new T3.Group(); root.scale.setScalar(S); G.add(root);
    const body = lam('#3b4048'), dark = lam('#262a30'), plate = lam('#515862'), warn = lam('#c8a028', '#2a2000'), glass = emi('#ff3a2a'), vent = emi('#ff8a2a'), cyan = emi('#46e0ff');
    const cols = [], legs = [], pods = [];
    const col = (parent, w, h, d, x, y, z) => { const c = EVO.colBox(parent, w * S, h * S, d * S, x, y, z); c.scale.setScalar(1 / S); c.userData.size = [w * S, h * S, d * S]; cols.push(c); return c; };
    // bassin et ventre
    mb(root, 66, 12, 28, dark, 0, 62, 0); mb(root, 40, 8, 30, plate, 0, 55, 2); for (const sx of [-1, 1]) mb(root, 6, 3, 31, warn, sx * 14, 66.5, 0);
    const pel = EVO.colBox(root, 66 * S, 12 * S, 28 * S, 0, 62, 0); pel.scale.setScalar(1 / S); pel.userData.size = [66 * S, 12 * S, 28 * S]; cols.push(pel);
    // jambes : deux articulations (hanche, genou), pied large
    for (const sx of [-1, 1]) {
      const hip = new T3.Group(); hip.position.set(sx * 24, 58, 0); root.add(hip);
      mc(hip, 7.5, 7.5, 16, dark, 0, 0, 0, 14, false).rotation.z = Math.PI / 2;
      mb(hip, 13, 31, 13, body, 0, -15.5, 0); mb(hip, 15, 12, 15, plate, 0, -6, 1); mb(hip, 14, 3, 14, warn, 0, -27, 0);
      const knee = new T3.Group(); knee.position.set(0, -31, 0); hip.add(knee);
      mc(knee, 6.5, 6.5, 15, dark, 0, 0, 0, 14, false).rotation.z = Math.PI / 2;
      mb(knee, 9.5, 29, 9.5, dark, 0, -14.5, 0); mb(knee, 12, 22, 5, plate, 0, -12, 6); mb(knee, 3, 14, 3, body, sx * 6.5, -10, -4);
      const ankle = new T3.Group(); ankle.position.set(0, -29, 0); knee.add(ankle);
      mb(ankle, 17, 4.5, 27, body, 0, 2.2, 4); mb(ankle, 15, 3, 10, plate, 0, 5.5, 9); mb(ankle, 3, 5, 12, warn, sx * 6, 2.5, 18); mb(ankle, 17, 2, 5, dark, 0, 1, 18);
      col(hip, 14, 31, 14, 0, -15.5, 0); col(knee, 11, 29, 11, 0, -14.5, 0); col(ankle, 17, 5, 27, 0, 2.2, 4);
      legs.push({ hip, knee, ankle, side: sx });
    }
    // torse : coque, plastron, grilles lumineuses, épaulières, sac de réacteur
    mb(root, 58, 36, 34, body, 0, 86, 0); mb(root, 46, 22, 6, plate, 0, 90, 19); mb(root, 50, 6, 36, dark, 0, 105, 0); mb(root, 52, 8, 30, dark, 0, 70, 0);
    for (let i = 0; i < 5; i++) mb(root, 36, 1.4, 0.8, vent, 0, 80 + i * 4, 22.4); for (const sx of [-1, 1]) { mb(root, 4, 20, 0.8, vent, sx * 25, 90, 17.4); mb(root, 8, 3, 8, warn, sx * 22, 106, 6); }
    mb(root, 30, 30, 14, dark, 0, 88, -22); mc(root, 5, 5, 20, cyan, -8, 90, -30, 10, true); mc(root, 5, 5, 20, cyan, 8, 90, -30, 10, true);
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) mc(root, 2.4, 2.4, 14, dark, sx * (20 + k * 3.6), 112, -14, 8, false);
    col(root, 58, 36, 34, 0, 86, 0);
    // tête qui suit la fusée
    const head = new T3.Group(); head.position.set(0, 110, 4); root.add(head);
    mb(head, 20, 14, 22, body, 0, 0, 0); mb(head, 16, 4.2, 1.4, glass, 0, 1.4, 11.4); mb(head, 10, 2, 1.4, glass, 0, -2.6, 11.4); mb(head, 24, 3, 18, plate, 0, 8.6, -1); mb(head, 4, 8, 4, dark, -11, 0, 0); mb(head, 4, 8, 4, dark, 11, 0, 0);
    for (const sx of [-1, 1]) { mc(head, 0.3, 0.5, 18, dark, sx * 6, 17, -6, 6, false); mb(head, 1.6, 1.6, 1.6, emi('#ff3a2a'), sx * 6, 26.5, -6); }
    const eyeL = new T3.PointLight('#ff3a2a', 0, 120); eyeL.position.set(0, 1.4, 14); head.add(eyeL);
    col(head, 22, 16, 24, 0, 0, 0);
    // bras : épaule, coude, bloc d'armes avec deux tubes
    const arms = [];
    for (const sx of [-1, 1]) {
      mb(root, 16, 16, 22, plate, sx * 38, 98, 0); mb(root, 18, 3, 24, warn, sx * 38, 106.5, 0);
      const sh = new T3.Group(); sh.position.set(sx * 40, 96, 0); root.add(sh);
      mc(sh, 7, 7, 14, dark, 0, 0, 0, 12, false).rotation.z = Math.PI / 2; mb(sh, 11, 32, 11, body, 0, -16, 0); mb(sh, 3, 24, 13, plate, sx * 6, -14, 0);
      const el = new T3.Group(); el.position.set(0, -32, 0); sh.add(el);
      mc(el, 6, 6, 13, dark, 0, 0, 0, 12, false).rotation.z = Math.PI / 2; mb(el, 13, 24, 17, body, 0, -12, 4); mb(el, 15, 6, 17, warn, 0, -24, 4);
      for (const k of [-1, 1]) { mc(el, 2.6, 3.2, 22, dark, k * 3.6, -22, 18, 10, true); const m = new T3.Object3D(); m.position.set(k * 3.6, -22, 30); el.add(m); pods.push(m); }
      col(sh, 12, 32, 12, 0, -16, 0); col(el, 14, 26, 18, 0, -12, 4);
      arms.push({ sh, el, side: sx });
    }
    G.userData = { legs, arms, head, eyeL, pods, root };
    G.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return { G, cols, S };
  }

  function robot(S, dc) {
    const { G, cols, S: sc } = buildRobot(), ud = G.userData, yaw = heading(S, dc);
    pos(S, G, dc, 0, 0, yaw);
    const st = { t0: Math.random() * 6, step: -1, fire: 2.5, seen: false, aim: 0, armPh: 0, ra: 0 }, _w = new V();
    EVO.robot = { G, st };
    EVO.addDyn(G, (t, dt, g) => {
      const rk = g.rocket, T = g.endlessRun && g.endlessRun.T, ph = (t + st.t0) * 0.62;
      for (const L of ud.legs) { const p = ph + (L.side > 0 ? 0 : Math.PI), sw = Math.sin(p), lift = Math.max(0, Math.cos(p)); L.hip.rotation.x = sw * 0.22; L.knee.rotation.x = -Math.max(0, sw) * 0.5 - lift * 0.18; L.ankle.rotation.x = -(L.hip.rotation.x + L.knee.rotation.x) * 0.9; }
      const ev = Math.floor((ph - Math.PI / 2) / Math.PI);
      if (ev !== st.step) {
        const first = st.step === -1; st.step = ev;
        if (!first && rk && rk.active) { const d = G.position.distanceTo(rk.pos); if (d < 520) { g.audio.play('robotStep', G.position); g.rig.shake = Math.max(g.rig.shake, U.clamp(1 - d / 520, 0.05, 0.9)); const L = ud.legs[(ev & 1) ? 0 : 1]; L.ankle.getWorldPosition(_w); _w.y = G.position.y + 0.3; g.effects.ring(_w, new V(0, 1, 0), 3, 26, 0.7, '#cfc4b0', 0.5); for (let i = 0; i < 12; i++) g.effects.sparks.emit({ pos: _w, vel: new V(U.fx.range(-1, 1), U.fx.range(0.3, 1.2), U.fx.range(-1, 1)).multiplyScalar(U.fx.range(6, 20)), life: U.fx.range(0.5, 1.2), s0: 0.3, s1: 0.5, s2: 0.1, cols: g.effects.pal.ember, drag: 1.5, grav: 4, a: 0.6, fout: 0.5 }); } }
      }
      const rpos = rk && rk.active ? rk.pos : null, dist = rpos ? G.position.distanceTo(rpos) : 9999;
      // la tête suit la fusée ; les yeux s'allument de plus en plus
      if (rpos) { ud.head.getWorldPosition(_w); const loc = G.worldToLocal(rpos.clone()), want = U.clamp(Math.atan2(loc.x, Math.max(30, loc.z)), -0.9, 0.9); st.aim += (want - st.aim) * Math.min(1, dt * 3); ud.head.rotation.y = st.aim; }
      ud.eyeL.intensity = (dist < 600 ? 1 : 0.3) * (1.5 + Math.sin(t * 5) * 0.8);
      // il remarque la fusée : rugissement, alarme
      if (!st.seen && dist < 430 && g.state === 'FLIGHT') { st.seen = true; g.audio.play('robotRoar', G.position); g.audio.play('robotAlarm'); g.rig.shake = Math.max(g.rig.shake, 1); g.flash = 0.25; g.flashColor = '#ff3a2a'; EVO.radio(g, 'CENTRE : ATTENTION, IL T A REPERE !', 2.6); }
      // bras qui se balancent, servos
      st.armPh += dt * (dist < 430 ? 1.5 : 0.7);
      for (const A of ud.arms) { A.sh.rotation.x = Math.sin(st.armPh + (A.side > 0 ? 0 : 3)) * 0.38 - 0.1; A.el.rotation.x = -0.35 - Math.max(0, Math.sin(st.armPh * 1.3 + A.side)) * 0.5; A.sh.rotation.z = A.side * (0.05 + 0.04 * Math.sin(st.armPh * 0.7)); }
      if (Math.floor(st.armPh / 1.9) !== st.ra) { st.ra = Math.floor(st.armPh / 1.9); if (dist < 520) g.audio.play('robotServo', G.position, st.ra % 3); }
      // il tire des missiles lents : trois par salve, visibles de loin, faciles à esquiver
      if (rpos && g.state === 'FLIGHT' && dist < 420 && dist > 90) { st.fire -= dt; if (st.fire <= 0) { st.fire = 3.4; g.audio.play('hydraulic', G.position); for (const m of ud.pods.slice(0, 4)) { m.getWorldPosition(_w); g.spawnEnemyMissile(_w.clone(), rk, { miss: 0, lead: 0.05, turn: 0.1, speed: 30, life: 7, quiet: true, visualFrom: _w.clone() }); } } }
    }, cols, { near: 99999, span: 99999 });
  }

  // ============================== LE REACTEUR ==============================
  CC.BossModels = CC.BossModels || {};
  CC.BossModels.reactor = function () {
    const g = new T3.Group(), dark = lam('#2c3036'), steel = lam('#6a717a'), glow = emi('#6ae8ff'), core = emi('#e8ffff'), hz = lam('#c8a028');
    mc(g, 12, 13, 2, dark, 0, 1, 0, 24, false); for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { mb(g, 1.6, 22, 1.6, steel, a * 9, 12, b * 9); mb(g, 2.4, 1.2, 2.4, hz, a * 9, 3, b * 9); }
    const r1 = new T3.Mesh(new T3.TorusGeometry(8.6, 0.7, 8, 36), glow), r2 = new T3.Mesh(new T3.TorusGeometry(7.2, 0.5, 8, 30), steel); r1.position.y = 13; r2.position.y = 13; r2.rotation.x = 1.0; g.add(r1, r2);
    const sph = new T3.Mesh(new T3.SphereGeometry(4.6, 18, 14), core); sph.position.y = 13; g.add(sph); const hal = new T3.Mesh(new T3.SphereGeometry(6.8, 16, 12), new T3.MeshBasicMaterial({ color: '#46e0ff', transparent: true, opacity: 0.25, depthWrite: false, fog: false })); hal.position.y = 13; g.add(hal);
    g.userData.size = [20, 26, 20]; g.userData.center = [0, 13, 0]; g.userData.spin = [r1, r2, sph, hal];
    return g;
  };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    for (const t of g.targets) if (t.alive && t.type === 'reactor' && t.model.userData.spin) { const [r1, r2, s, h] = t.model.userData.spin, tt = EVO.clock; r1.rotation.z = tt * 0.8; r2.rotation.y = tt * 1.4; const k = 1 + 0.08 * Math.sin(tt * 4); s.scale.setScalar(k); h.scale.setScalar(1.05 + 0.12 * Math.sin(tt * 3)); }
    EVO.finaleTick(g, dt);
  };

  // ============================== LA FUITE ==============================
  EVO.escEvents = []; EVO.debris = [];
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); EVO.escEvents = []; EVO.debris = []; EVO.robot = null; g.evoEscape = null; g.evoFinish = null; };
  EVO.startEscape = (g, why) => {
    if (g.evoEscape) return; const run = g.endlessRun, E = EVO.scenePos('fuite'); if (!E) return;
    g.evoEscape = { on: true, d0: run.dist, d1: E.d0 + E.len - 40, t0: performance.now(), fired: {} };
    g.audio.setZone('evoEscape', false); g.audio.play('reactorHit'); g.audio.play('robotAlarm'); g.rig.shake = 1.6; g.flash = 0.6; g.flashColor = '#ffffff';
    EVO.radio(g, 'CENTRE : REACTEUR CRITIQUE ! LA BASE S EFFONDRE ! SORS DE LA !', 3.8); CC.L1.msg(g, 'EVACUATION !', 2.2, '#ff7a4a');
    if (why !== 'kill') g.audio.play('boom');
  };
  const _ok = EVO.onKill; EVO.onKill = (g, t) => { _ok(g, t); if (t.type === 'reactor') { EVO.startEscape(g, 'kill'); if (t.obb) EVO.coinBurst(g, t.obb.c, 40); } };
  const spark = (g, p, n, sp, up) => { const fx = g.effects; for (let i = 0; i < n; i++) fx.sparks.emit({ pos: p, vel: new V(U.fx.range(-1, 1), U.fx.range(0.2, up || 1), U.fx.range(-1, 1)).multiplyScalar(U.fx.range(sp * 0.4, sp)), life: U.fx.range(0.4, 1.3), s0: 0.25, s1: 0.35, s2: 0.05, cols: fx.pal.ember, drag: 1.3, grav: 5, a: 1, fout: 0.5 }); };
  const rubble = (g, p) => { const m = new T3.Mesh(new T3.BoxGeometry(U.fx.range(3, 9), U.fx.range(2, 6), U.fx.range(3, 9)), lam(pk(U.fx, GREY))); m.position.copy(p); m.rotation.set(U.fx.range(0, 3), U.fx.range(0, 3), 0); g.scene.add(m); return m; };
  // une chute minutée : le bloc tombe dans l'axe et touche le sol ~0,3 s APRES le passage de la fusée
  EVO.dropAt = (g, kind) => {
    const run = g.endlessRun, T = run.T, rk = g.rocket, v = Math.max(35, rk.vel.length()), ly = Math.max(8, rk.pos.y - T.base(run.dist)), H = 60, tl = Math.sqrt(2 * Math.max(10, H - ly) / 34), dL = run.dist + v * Math.max(0.4, tl - 0.28);
    const lx = T.laneX(dL) + (kind === 'side' ? (Math.random() < 0.5 ? -14 : 14) : (rk.pos.x - T.at(run.dist, 0, 0)[0]) * 0), p0 = T.at(dL, lx, H);
    const m = rubble(g, new V(p0[0], p0[1], p0[2])); m.scale.setScalar(kind === 'big' ? 2.6 : 1.4);
    EVO.debris.push({ m, vy: 0, ground: T.at(dL, lx, 0)[1] + 1, kind, t: 0, big: kind === 'big' });
    g.audio.play('rumble');
  };
  EVO.finaleTick = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket, fin = g.evoFinish;
    // le réacteur explose tout seul si on le dépasse sans le toucher
    const N = EVO.scenePos('noyau'), F = EVO.scenePos('fuite');
    if (N && F && !g.evoEscape && run && run.dist > F.d0 + 6 && g.state === 'FLIGHT') EVO.startEscape(g, 'auto');
    const E = g.evoEscape;
    if (E && E.on && g.state === 'FLIGHT' && rk.active) {
      // la fusée garde de la vitesse et du carburant : on ne meurt pas de panne pendant la fuite
      rk.fuel = rk.fuelMax = Math.max(rk.fuelMax, 20); if (rk.vel.length() < 54) rk.vel.addScaledVector(rk.fwd, (54 - rk.vel.length()) * Math.min(1, dt * 2));
      g.rig.shake = Math.max(g.rig.shake, 0.16 + 0.1 * Math.sin(performance.now() / 90)); if (Math.random() < dt * 1.4) g.flash = Math.max(g.flash || 0, 0.12), g.flashColor = '#ff6a2a';
      for (const ev of EVO.escEvents) {
        if (ev.done || run.dist < ev.d) continue; ev.done = true;
        if (ev.kind === 'ceil') EVO.dropAt(g, 'mid'); else if (ev.kind === 'big') EVO.dropAt(g, 'big'); else if (ev.kind === 'side') { EVO.dropAt(g, 'side'); EVO.dropAt(g, 'side'); }
        else if (ev.kind === 'fire') { const p = run.T.at(ev.at, ev.lx, 4); const q = new V(p[0], p[1], p[2]); g.effects.explosion(q, null, true, 'orange'); g.audio.play('boomSmall', q); g.rig.shake = Math.max(g.rig.shake, 0.9); spark(g, q, 30, 24, 1.4); }
        else if (ev.kind === 'quake') { g.audio.play('rumble'); g.rig.shake = Math.max(g.rig.shake, 1.2); g.flash = 0.2; g.flashColor = '#ffb060'; }
        else if (ev.kind === 'pillar' && ev.obj) { ev.obj.userData.fall = { t0: EVO.clock }; }
      }
      const pct = U.clamp((run.dist - E.d0) / Math.max(1, E.d1 - E.d0), 0, 1), M = CC.Music && CC.Music.STYLES.evoEscape; if (M) M.bpm = 150 + 50 * pct;
      if (run.dist > E.d1 && !fin) EVO.finishRun(g);
    }
    // débris cosmétiques
    for (let i = EVO.debris.length - 1; i >= 0; i--) {
      const d = EVO.debris[i]; d.t += dt; d.vy -= 34 * dt; d.m.position.y += d.vy * dt; d.m.rotation.x += dt * 3; d.m.rotation.z += dt * 2;
      if (d.t % 0.06 < dt && Math.random() < 0.7) spark(g, d.m.position, 1, 4, 0.5);
      if (d.m.position.y <= d.ground) { g.effects.explosion(d.m.position.clone(), null, d.big, 'orange'); g.audio.play('debris', d.m.position); g.audio.play('rumble'); g.rig.shake = Math.max(g.rig.shake, d.big ? 1.1 : 0.7); spark(g, d.m.position, 18, 18, 1.2); g.scene.remove(d.m); EVO.debris.splice(i, 1); }
    }
  };
  EVO.finishRun = (g) => {
    g.evoFinish = { t0: performance.now() }; const rk = g.rocket;
    g.audio.play('finish'); g.flash = 0.8; g.flashColor = '#fff2c0'; g.hitStop = 0.25; g.hitScale = 0.3; g.rig.shake = 0.6; CC.L1.msg(g, 'MISSION ACCOMPLIE !', 3, '#ffe9a0');
    g.audio.setZone('evoDawn', false);
    setTimeout(() => { if (g.state === 'FLIGHT' && g.endlessRun) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; EVO.onClear(g); } }, 2600);
  };

  // un pilier qui bascule en travers de l'axe (le calendrier est calé pour qu'il touche l'axe juste après le passage de la fusée)
  function pillar(S, dc, side, h) {
    const g = new T3.Group(), body = lam(pk(U.fx, GREY));
    mb(g, 7, h, 7, body, 0, h / 2, 0); mb(g, 10, 3, 10, lam('#2c3036'), 0, 1.5, 0); mb(g, 9, 3, 9, lam('#2c3036'), 0, h - 1.5, 0); for (let k = 1; k < 5; k++) mb(g, 7.4, 0.8, 7.4, lam('#c8a028'), 0, k * h / 5, 0);
    const lx = side * 24; pos(S, g, dc, lx, 0, heading(S, dc) + Math.PI / 2 * 0);
    const ud = { done: false, base: g.position.clone(), side };
    EVO.addDyn(g, (t, dt, game) => {
      const f = g.userData.fall; if (!f) return; const tt = (t - f.t0); const th = Math.min(1.5, 0.5 * 0.62 * tt * tt);
      g.rotation.z = -side * th * 0; g.rotation.x = 0; g.rotation.set(0, g.rotation.y, 0); g.rotateZ(side * th);
      if (th >= 1.5 && !f.landed) { f.landed = true; game.audio.play('debris', g.position); game.audio.play('rumble'); game.rig.shake = Math.max(game.rig.shake, 1.3); const p = g.position.clone(); p.x += 0; game.effects.explosion(g.position.clone().add(new V(0, 4, 0)), null, true, 'orange'); }
    }, [], { near: 99999, span: 99999 });
    return g;
  }

  // ============================== LES SCENES ==============================
  const FIRE = ['#ff7a2a', '#ff9a3a', '#ffb04a'];
  const fireAt = (S, dc, lx, r) => { S.bx(dc, lx, 1.4, 2.6, 2.8, 2.6, 'emis:' + pk(r, FIRE), undefined, false); S.glow(dc, lx, 3.4, '#ff8a3a', 26); S.bx(dc, lx, 4.6, 1.6, 1.8, 1.6, 'emis:#ffd070', undefined, false); };
  const wreck = (S, dc, lx, r) => { S.bx(dc, lx, 1.2, 4.2, 2.4, 8, 'col:#26282c', undefined, true); S.bx(dc, lx, 2.8, 3.2, 1.2, 3.6, 'col:#1c1e22', undefined, true); fireAt(S, dc, lx, r); };
  const dTeeth = (S, dc, lx) => { S.bxr(dc, lx, 1.6, 0.8, 3.2, 3.2, 'concrete', '#6c6e6c', 45, 0, true); S.bxr(dc, lx, 1.6, 3.2, 0.8, 3.2, 'concrete', '#6c6e6c', 45, 0, true); };

  // ----- APPROCHE (560 m) : la route du siège, de nuit, sous les projecteurs ; la citadelle se dresse au fond
  D.scenes.approche = { len: [560, 560], noDoor: true, noChaos: true, turns: [[0.1, 0.5, 26], [0.5, 0.95, -26]],
    pin: (T, sc) => ({ lx: 0, y: 15, from: 24, to: sc.d1 - sc.d0 - 24 }),
    ground: (d, lx, c, sc) => { const k = ss(sc.d0 - 4, sc.d0 + 20, d); c.lerp(new T3.Color('#3a3430'), k * 0.9); if (Math.abs(lx) < 20) c.lerp(new T3.Color('#2e2c2c'), 0.5 * k); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      for (let dc = S.d0 + 8; dc < S.d1; dc += 20) S.item(dc, (r) => { const Lc = S.lane(dc).lx; S.bx(dc, Lc, 0.12, 22, 0.15, 20.4, 'asphalt', '#38383a', false, { shadow: false }); S.bx(dc, Lc, 0.2, 0.7, 0.04, 8, 'col:#d8d0b0', undefined, false, { shadow: false }); });
      for (const sg of [-1, 1]) S.rows(S.d0, S.d1, 24, 0.6, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx, lx = Lc + sg * r.between([22, 60]); const k = r(); if (k < 0.3) wreck(S, dc, lx, r); else if (k < 0.55) fireAt(S, dc, lx, r); else if (k < 0.8) dTeeth(S, dc, lx); else boulder(S, dc, lx, 0, r.between([2, 5]), r, pk(r, BURN)); }));
      for (const sg of [-1, 1]) S.rows(S.d0 + 10, S.d1, 62, 0.4, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx; S.bx(dc, Lc + sg * 44, 9, 0.7, 18, 0.7, 'metal', '#5a5e66', true); S.bx(dc, Lc + sg * 44, 18.6, 3.2, 0.8, 3.2, 'metal', '#5a5e66', false); S.bx(dc, Lc + sg * 44, 19.4, 2.4, 0.5, 2.4, 'emis:#fff6d8', undefined, false); S.glow(dc, Lc + sg * 44, 19, '#fff6d8', 38); }));
      // la citadelle en fond : murailles noires, tours, fenêtres rougeoyantes
      S.item(d(0.97), (r) => { const dm = d(0.97), Lc = S.lane(dm).lx; for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) { S.bx(dm + k * 22, Lc + sg * (110 + k * 40), 60 + k * 14, 36, 120 + k * 28, 30, 'concreteDark', pk(r, GREY), true); for (let j = 0; j < 5; j++) S.bx(dm + k * 22 - 15.2, Lc + sg * (110 + k * 40), 24 + j * 20, 20, 2.4, 0.4, 'emis:' + pk(r, FIRE), undefined, false); } });
      foe(S, 'aaturret', d(0.22), -24, 0, { name: 'TOURELLE', armed: true }); foe(S, 'apc', d(0.34), 10, 0, { name: 'BLINDE', hp: 3, armed: false, path: 90, speed: 16 }); foe(S, 'aaturret', d(0.52), 28, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'heli', d(0.62), 0, 36, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -34, y), SS.at(dc + 24, 0, y + 6), SS.at(dc, 34, y), SS.at(dc - 24, 0, y + 6)], speed: 13 });
      foe(S, 'tank', d(0.78), -14, 0, { name: 'BLINDE', hp: 3, armed: false }); foe(S, 'rocketTruck', d(0.9), 30, 0, { name: 'LANCE-ROQUETTES', armed: true });
    } };

  // ----- PORTE (520 m) : l'enceinte, le GARDIEN, la porte de la citadelle
  D.scenes.porte = { len: [520, 520], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 24, from: 24, to: sc.d1 - sc.d0 - 24 }),
    ground: (d, lx, c, sc) => { c.lerp(new T3.Color('#34302c'), 0.92); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      for (let dc = S.d0 + 8; dc < S.d1; dc += 20) S.item(dc, (r) => { const Lc = S.lane(dc).lx; S.bx(dc, Lc, 0.12, 80, 0.15, 20.4, 'concrete', '#42423f', false, { shadow: false }); });
      // enceinte extérieure percée d'une porte monumentale + deux tours
      S.item(d(0.1), (r) => { const dm = d(0.1), Lc = S.lane(dm).lx; S.wall(dm, Lc - 220, Lc + 220, 0, 130, 14, 'concreteDark', '#3e4248', { lx: Lc, yc: 40, w: 96, h: 80 }); for (const sg of [-1, 1]) { S.bx(dm, Lc + sg * 64, 90, 26, 180, 30, 'concreteDark', '#34383e', true); S.bx(dm, Lc + sg * 64, 184, 34, 6, 38, 'concrete', '#50545a', true); for (let j = 0; j < 6; j++) S.bx(dm - 15.3, Lc + sg * 64, 26 + j * 24, 18, 2.4, 0.4, 'emis:' + pk(r, FIRE), undefined, false); S.glow(dm - 15, Lc + sg * 64, 90, '#ff8a3a', 60); } S.bx(dm, Lc, 82, 100, 4, 16, 'hazard', undefined, false); });
      // la grande avenue du gardien : socles, chaînes, flammes, deux cratères
      for (const sg of [-1, 1]) S.rows(d(0.14), d(0.78), 30, 0.7, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx, lx = Lc + sg * r.between([58, 90]); const k = r(); if (k < 0.4) { fireAt(S, dc, lx, r); } else if (k < 0.7) dTeeth(S, dc, lx); else boulder(S, dc, lx, 0, r.between([3, 6]), r, pk(r, BURN)); }));
      robot(S, d(0.5));
      // mur principal de la citadelle et sa porte (le passage vers le noyau)
      S.item(d(0.84), (r) => { const dm = d(0.84), Lc = S.lane(dm).lx; S.wall(dm, Lc - 260, Lc + 260, 0, 170, 20, 'concreteDark', '#363a40', { lx: Lc, yc: 32, w: 84, h: 64 }); S.bx(dm, Lc, 66, 88, 4, 22, 'hazard', undefined, false); for (let k = -4; k <= 4; k++) { if (Math.abs(k) < 2) continue; S.bx(dm - 10.3, Lc + k * 28, 100, 10, 4, 0.4, 'emis:' + pk(r, FIRE), undefined, false); S.glow(dm - 10, Lc + k * 28, 100, '#ff8a3a', 44); } for (const sg of [-1, 1]) lamp(S, dm - 10.4, Lc + sg * 46, 40, '#ff6a3a', 36); });
      foe(S, 'aaturret', d(0.22), 44, 0, { name: 'TOURELLE', armed: true }); foe(S, 'aaturret', d(0.3), -44, 0, { name: 'TOURELLE', armed: true }); foe(S, 'tank', d(0.7), -30, 0, { name: 'BLINDE', hp: 3, armed: false });
    } };

  // ----- NOYAU (480 m) : le hall du réacteur — passerelles, câbles, rails de lumière ; le réacteur au fond
  D.scenes.noyau = { len: [480, 480], noDoor: true, noChaos: true, turns: [],
    pin: (T, sc) => ({ lx: 0, y: 20, from: 20, to: sc.d1 - sc.d0 - 20 }),
    ground: (d, lx, c, sc) => { c.lerp(new T3.Color('#2c3238'), 0.95); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, hw = 64, H = 120;
      for (let dc = S.d0 + 10; dc < S.d1; dc += 20) S.item(dc, (r) => { const Lc = S.lane(dc).lx; S.bx(dc, Lc, 0.12, 2 * hw, 0.2, 20.4, 'metal', '#3a4048', false, { shadow: false }); for (const k of [-1, 1]) S.bx(dc, Lc + k * 30, 0.26, 1.2, 0.06, 20, 'emis:#46e0ff', undefined, false); });
      for (let dc = S.d0; dc < S.d1; dc += 16) S.item(dc + 8, (r) => { const m = dc + 8, Lc = S.lane(m).lx; for (const sg of [-1, 1]) { S.bx(m, Lc + sg * (hw + 16), 60, 32, 130, 15.8, 'concreteDark', pk(r, GREY), true); if ((dc / 16) % 3 === 0) { S.bx(m, Lc + sg * (hw - 0.4), 48, 0.5, 70, 6, 'emis:#46a8ff', undefined, false); S.glow(m, Lc + sg * (hw - 2), 48, '#46a8ff', 40); } } S.bx(m, Lc, H + 8, 2 * hw + 34, 16, 15.8, 'concreteDark', '#30343a', true); if ((dc / 16) % 4 === 1) { S.bx(m, Lc, H - 1, 60, 0.4, 3, 'emis:#cfe8ff', undefined, false); S.glow(m, Lc, H - 3, '#cfe8ff', 50); } });
      for (let dc = S.d0 + 40; dc < S.d1 - 60; dc += 56) S.item(dc, (r) => { const Lc = S.lane(dc).lx; for (const sg of [-1, 1]) { S.bx(dc, Lc + sg * 46, 44, 3, 88, 3, 'metal', '#5a6068', true); S.bx(dc, Lc + sg * 46, 66, 12, 2, 5, 'hazard', undefined, false); } S.bx(dc, Lc, 90, 2 * 46 + 6, 3, 4, 'metal', '#5a6068', true); S.bx(dc, Lc, 92, 2 * 46 + 6, 0.5, 4.2, 'emis:#46e0ff', undefined, false); });
      for (let i = 0; i < 7; i++) S.item(d(0.08 + i * 0.12), (r) => { const m = d(0.08 + i * 0.12), Lc = S.lane(m).lx, sg = i % 2 ? 1 : -1; S.cyl(m, Lc + sg * 54, 0, 5.4, 70, 'metal', '#4a5058', 14, 5.4, true); for (let j = 0; j < 4; j++) S.bx(m, Lc + sg * 54, 12 + j * 16, 11.2, 2, 11.2, 'hazard', undefined, false); });
      // le réacteur
      const dR = d(0.8), yaw = heading(S, dR);
      S.item(dR, (r) => { const p = S.at(dR, 0, 0); S.b.target('reactor', p, CC.U.deg ? 0 : 0, { scale: 1.5, unarmed: true, evoName: 'REACTEUR', evoVal: 900 }); S.glow(dR, 0, 20, '#46e0ff', 120); S.glow(dR, 0, 28, '#cfffff', 70); for (const sg of [-1, 1]) { S.bx(dR, sg * 36, 14, 4, 28, 4, 'metal', '#4a5058', true); S.bx(dR, sg * 36, 29, 4, 2, 4, 'emis:#46e0ff', undefined, false); } });
      S.reserve(dR, 0, 40, 40);
      foe(S, 'aaturret', d(0.3), 30, 0, { name: 'TOURELLE', armed: true }); foe(S, 'aaturret', d(0.45), -30, 0, { name: 'TOURELLE', armed: true }); foe(S, 'heli', d(0.55), 0, 40, { name: 'DRONE', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -30, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 30, y), SS.at(dc - 22, 0, y + 6)], speed: 13 });
      foe(S, 'aaturret', d(0.68), 34, 0, { name: 'TOURELLE', armed: true }); foe(S, 'aaturret', d(0.72), -34, 0, { name: 'TOURELLE', armed: true });
    } };

  // ----- FUITE (760 m) : couloir en ruines, flammes, chutes minutées ; l'arche d'arrivée est dehors, au soleil levant
  D.scenes.fuite = { len: [760, 760], noDoor: true, noChaos: true, turns: [[0.18, 0.5, 20], [0.5, 0.8, -20]],
    pin: (T, sc) => ({ lx: 0, y: 18, from: 24, to: sc.d1 - sc.d0 - 24 }),
    ground: (d, lx, c, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); c.lerp(new T3.Color(u < 0.86 ? '#2a2a2c' : '#6a7a52'), 0.96); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, hw = 54, EVOnow = EVO;
      const ev = (dd, o) => { if (!EVOnow.escEvents.some((q) => Math.abs(q.d - dd) < 1 && q.kind === o.kind)) EVOnow.escEvents.push(Object.assign({ d: dd, done: false }, o)); };
      for (let dc = S.d0 + 10; dc < S.d1; dc += 20) S.item(dc, (r) => { const Lc = S.lane(dc).lx, u = (dc - S.d0) / L; S.bx(dc, Lc, 0.12, 2 * hw, 0.2, 20.4, u < 0.86 ? 'concreteDark' : 'concrete', u < 0.86 ? '#34363a' : '#70726e', false, { shadow: false }); if (r() < 0.5) S.bxr(dc + r.between([-8, 8]), Lc + r.between([-30, 30]), 0.3, r.between([2, 6]), 0.04, 0.5, 'col:#ff6a2a', undefined, r.between([-90, 90]), r.between([-40, 40]), false); });
      const tEnd = d(0.86);
      for (let dc = S.d0; dc < tEnd; dc += 16) S.item(dc + 8, (r) => { const m = dc + 8, Lc = S.lane(m).lx, hole = r() < 0.18; for (const sg of [-1, 1]) { S.bx(m, Lc + sg * (hw + 12), 50, 24, 110, 15.8, 'concreteDark', pk(r, BURN), true); if (r() < 0.55) { S.bx(m, Lc + sg * (hw - 0.4), r.between([10, 60]), 0.5, r.between([8, 30]), 6, 'emis:' + pk(r, FIRE), undefined, false); S.glow(m, Lc + sg * (hw - 2), 30, '#ff8a3a', 44); } } if (!hole) S.bx(m, Lc, 96, 2 * hw + 24, 12, 15.8, 'concreteDark', pk(r, BURN), true); });
      for (let dc = S.d0 + 30; dc < tEnd; dc += 44) S.item(dc, (r) => { const Lc = S.lane(dc).lx, sg = r() < 0.5 ? -1 : 1; fireAt(S, dc, Lc + sg * r.between([38, 50]), r); S.glow(dc, Lc + sg * 44, 12, '#ff6a2a', 52); });
      // sortie : l'arche d'arrivée, la prairie et le soleil
      S.item(d(0.95), (r) => { const dm = d(0.95), Lc = S.lane(dm).lx, w = 64; for (const sg of [-1, 1]) { S.bx(dm, Lc + sg * w / 2, 22, 5, 44, 5, 'concrete', '#e8e4d8', true); for (let k = 0; k < 8; k++) S.bx(dm, Lc + sg * w / 2, 3 + k * 5, 5.2, 2.5, 5.2, 'col:' + (k % 2 ? '#111' : '#fff'), undefined, false); } S.bx(dm, Lc, 46, w + 5, 5, 5, 'col:#fff', undefined, false); for (let k = 0; k < 14; k++) S.bx(dm, Lc - w / 2 + 2 + k * (w / 13.5), 46, 2.2, 5.2, 5.2, 'col:#111', undefined, false); S.glow(dm, Lc, 48, '#fff2c0', 80); });
      for (const sg of [-1, 1]) S.rows(d(0.88), S.d1, 18, 0.9, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx, p = S.at(dc, Lc + sg * r.between([30, 70]), 0); if (r() < 0.5) TR.conifer(S.b, p[0], p[1], p[2], r.between([14, 24]), r, {}); else TR.broadleaf(S.b, p[0], p[1], p[2], r.between([9, 15]), r, {}); }));
      // les chutes minutées : 3 plafonds, une chute lourde, deux piliers, quatre explosions, deux secousses
      const E = [[0.04, 'quake'], [0.08, 'ceil'], [0.14, 'fire', -22], [0.19, 'side'], [0.24, 'ceil'], [0.3, 'fire', 24], [0.35, 'big'], [0.41, 'ceil'], [0.46, 'fire', -26], [0.52, 'side'], [0.58, 'quake'], [0.63, 'ceil'], [0.69, 'fire', 22], [0.74, 'big'], [0.8, 'side'], [0.84, 'ceil']];
      for (const [u, kind, lx] of E) ev(d(u), { kind, lx: lx || 0, at: d(u) + 70 });
      const P = [[0.215, 1], [0.545, -1]];
      for (const [u, side] of P) { const dc = d(u), obj = pillar(S, dc, side, 70); ev(dc - 80, { kind: 'pillar', obj }); }
      lamp(S, d(0.02), 0, 40, '#ff6a3a', 50);
      foe(S, 'jet', d(0.3), 0, 26, { name: 'CHASSEUR', path: 140, speed: 30 });
    } };
})();
