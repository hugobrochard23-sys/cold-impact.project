/* v131 : ACTE 2 — LA DESCENTE. Une seule grande scène de 1800 m : on plonge dans une carrière en spirale, on tombe dans un puits de mine, on file dans un tunnel
 * ferroviaire (un train arrive en face), puis on remonte vers la surface par une rampe et on débouche de nuit dans la ville (scène « ville », 760 m).
 * Le sol suit le relief (-96 m, puis -70 m, puis la remontée) ; tout est taillé dans la roche, avec des cages d'ascenseur, des câbles, des lampes. */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, D = Z.defs.campagne, foe = Z.evoFoe, EVO = CC.EVO;
  if (!D || !foe || !TR) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const SAND = ['#9c9482', '#948c7a', '#a39b88', '#8c8472'], CAVE = ['#6a645a', '#625c52', '#706a60', '#5a544a'], CONC = ['#a4a6a2', '#9a9c98', '#acaea8'];
  const rel = (sc, fn) => { let lo = 0, hi = 0; for (let d = sc.d0; d <= sc.d1; d += 4) { const v = fn(d); if (v < lo) lo = v; if (v > hi) hi = v; } sc.rlo = lo; sc.rhi = hi; return { fn, max: Math.max(-lo, hi) }; };
  const boulder = (S, dc, lx, y, s, r, gray) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, SAND), noMoss: true }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const lamp = (S, dc, lx, y, col, size) => { S.bx(dc, lx, y, 1.2, 0.35, 0.8, 'emis:' + (col || '#ffe2a8'), undefined, false); S.glow(dc, lx, y - 0.3, col || '#ffe2a8', size || 12); };
  const T3 = THREE;
  const mat = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e } : { color: c });
  const basic = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  const bx = (grp, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };

  // ---------- éléments animés ----------
  // cage d'ascenseur qui monte et descend le long d'une paroi (décor : jamais sur la trajectoire)
  function cage(S, dc, lx, y0, amp, ph) {
    const g = new T3.Group(), m = mat('#7a7e84'), m2 = mat('#c8a028');
    bx(g, 7, 0.5, 7, m, 0, 0, 0); bx(g, 7, 0.5, 7, m, 0, 8, 0); for (const sx of [-3.4, 3.4]) for (const sz of [-3.4, 3.4]) bx(g, 0.4, 8, 0.4, m2, sx, 4, sz);
    bx(g, 6, 0.3, 6, basic('#fff2c0'), 0, 7.6, 0); bx(g, 0.2, 40, 0.2, mat('#333'), 0, 24, 0);
    EVO.placeGroup(S, g, dc, lx, y0, 0); const base = g.position.y;
    EVO.addDyn(g, (t) => { g.position.y = base + Math.sin(t * 0.55 + ph) * amp; }, []);
  }
  // projecteur : un cône de lumière qui balaie le ciel
  function searchlight(S, dc, lx, y, ph, sp) {
    const g = new T3.Group(), cone = new T3.Mesh(new T3.ConeGeometry(11, 190, 14, 1, true), new T3.MeshBasicMaterial({ color: '#dfe8ff', transparent: true, opacity: 0.05, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, fog: false }));
    cone.geometry.translate(0, -95, 0); cone.rotation.x = Math.PI; cone.position.y = 0; g.add(cone); bx(g, 3, 3, 3, mat('#444'), 0, -1, 0);
    EVO.placeGroup(S, g, dc, lx, y, 0);
    EVO.addDyn(g, (t) => { g.rotation.z = Math.sin(t * sp + ph) * 0.5; g.rotation.x = Math.cos(t * sp * 0.7 + ph) * 0.35; }, [], { near: 700 });
  }
  // train blindé : arrive en face dans le tunnel, sur la voie de gauche (la fusée passe au centre ou à droite)
  function train(S, dA, dB) {
    const T = S.T, g = new T3.Group(), hull = mat('#35433c'), dark = mat('#222824'), red = mat('#a8322a'), glow = basic('#fff0c0');
    // locomotive (avant = +z), puis wagons derrière (−z)
    bx(g, 6.4, 5.4, 18, hull, 0, 3.6, -9); bx(g, 6.8, 0.8, 18.4, dark, 0, 0.9, -9); bx(g, 6.6, 1.2, 10, red, 0, 5.8, -6); bx(g, 4.6, 2.2, 5, dark, 0, 7.2, -4); bx(g, 5.2, 1.3, 0.2, basic('#ffd890'), 0, 4.6, 0.05);
    for (const sx of [-1.8, 1.8]) bx(g, 1.3, 1.3, 0.3, glow, sx, 2.4, 0.1);
    const spot = new T3.Mesh(new T3.ConeGeometry(9, 80, 12, 1, true), new T3.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.05, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, fog: false })); spot.geometry.translate(0, 40, 0); spot.rotation.x = Math.PI / 2; spot.position.set(0, 2.4, 0); g.add(spot);
    for (let i = 0; i < 7; i++) { const z = -22 - i * 15.5; bx(g, 6.2, 5.0, 14.5, i % 2 ? mat('#4a5048') : mat('#3e4640'), 0, 3.5, z); bx(g, 6.5, 0.6, 14.8, dark, 0, 0.9, z); for (let k = -1; k <= 1; k++) bx(g, 6.4, 0.3, 0.3, red, 0, 4.2, z + k * 4.5); }
    const len = 22 + 7 * 15.5; EVO.colBox(g, 7.2, 8.4, len, 0, 4.2, -len / 2 + 2);
    S.b.root.add(g);
    const st = { on: false, t0: 0, horn: false };
    EVO.addDyn(g, (t, dt, game) => {
      const run = game.endlessRun; if (!run) return;
      if (!st.on && run.dist > dA - 130 && game.state === 'FLIGHT') { st.on = true; st.t0 = t; game.audio.play('trainHorn'); game.rig.shake = Math.max(game.rig.shake, 0.4); }
      if (!st.on) { g.visible = false; return; }
      const dd = dB - 46 * (t - st.t0); g.visible = dd > dA - 60;
      if (!g.visible) return;
      const p = T.at(dd, -9.5, 0.2), q = T.at(dd - 6, -9.5, 0.2); g.position.set(p[0], p[1], p[2]); g.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]);
      if (!st.horn2 && game.rocket.active && game.rocket.pos.distanceTo(g.position) < 160) { st.horn2 = true; game.audio.play('trainHorn'); }
    }, g.children.filter((o) => o.userData.size), { near: 9999, span: 9999 });
  }

  // ===== LA DESCENTE (1800 m)
  const L0 = 1800;
  D.scenes.descente = { len: [L0, L0], noDoor: true, noChaos: true, gw: 72, turns: [[0.03, 0.3, 100]],
    sub: [{ u: 0, key: 'carriere', name: 'LA CARRIERE' }, { u: 0.3, key: 'puits', name: 'LE PUITS' }, { u: 0.4, key: 'tunnel', name: 'LE TUNNEL' }],
    pin: (T, sc) => ({ lx: 0, y: 18, from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -(80 * ss(0.03, 0.28, u) + 50 * ss(0.3, 0.36, u) - 130 * ss(0.6, 0.91, u)); }); },
    ground: (d, lx, c, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0), kq = ss(0, 0.05, u) * (1 - ss(0.28, 0.31, u)), kd = ss(0.29, 0.33, u) * (1 - ss(0.91, 0.94, u)); if (kq > 0) c.lerp(new T3.Color('#8b7b63'), kq * 0.94); if (kd > 0) c.lerp(new T3.Color('#4b4c4c'), kd); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      const halfAt = (u) => 52 - 18 * ss(0.265, 0.31, u);
      // ---- carrière et puits : deux grandes parois de roche (de la cote du sol à 36 m au-dessus de la surface d'origine)
      for (let dc = d(0.03); dc < d(0.405); dc += 13) S.item(dc + 6.5, (r) => {
        const m = dc + 6.5, Lc = S.lane(m).lx, fl = T.rel(m), u = (m - S.d0) / L, hf = halfAt(u), top = 36 - fl;
        for (const s of [-1, 1]) {
          S.bx(m, Lc + s * (hf + 14), (top - 15) / 2, 28, top + 15, 13.8, 'concreteWarm', pk(r, u < 0.3 ? SAND : CAVE), true);
          for (let y = -10; y < top - 10; y += (u < 0.3 ? 21 : 13)) { const sz = r.between(u < 0.3 ? [15, 23] : [6, 10]); boulder(S, m + r.between([-3, 3]), Lc + s * (hf + 1.8 * sz + r.between([0, 3])), y + 1, sz, r, pk(r, u < 0.3 ? SAND : CAVE)); }
        }
        if (u < 0.28 && r() < 0.5) { const s = r() < 0.5 ? -1 : 1; lamp(S, m, Lc + s * (hf - 2), 14 + r.between([0, 18]), '#ffd89a', 14); }
      });
      // ---- carrière : excavatrice à roue, convoyeur au-dessus de la piste, tas de gravier, chemin d'engins
      S.item(d(0.1), (r) => {
        const g = new T3.Group(), body = mat('#c8a028'), dk = mat('#33363a');
        bx(g, 5, 3, 16, dk, -4.5, 1.5, 0); bx(g, 5, 3, 16, dk, 4.5, 1.5, 0); bx(g, 12, 5, 12, body, 0, 5.5, 0); bx(g, 5, 4, 5, mat('#2a3038'), 0, 10, 2); bx(g, 3, 3, 36, body, 0, 12, -22).rotation.x = 0.28;
        const wheel = new T3.Group(); wheel.position.set(0, 21, -39);
        const ring = new T3.Mesh(new T3.TorusGeometry(8, 1.2, 8, 20), body); ring.rotation.y = Math.PI / 2; wheel.add(ring); for (let k = 0; k < 8; k++) { const b = bx(wheel, 2.6, 2.2, 2.4, dk, 0, Math.sin(k * 0.785) * 8, Math.cos(k * 0.785) * 8); }
        g.add(wheel); EVO.placeGroup(S, g, d(0.1), 34, 0, 0);
        EVO.addDyn(g, (t) => { wheel.rotation.x = t * 0.6; }, []);
      });
      S.item(d(0.17), (r) => { const fl = T.rel(d(0.17)), Lc = S.lane(d(0.17)).lx, y = 36 - fl - 8; S.bx(d(0.17), Lc, y, 2 * 52 + 24, 1.6, 2.4, 'metal', '#8a8e94', true); S.bx(d(0.17), Lc, y + 1.6, 2 * 52 + 24, 0.3, 2.6, 'hazard', undefined, false); for (const s of [-1, 1]) S.bx(d(0.17), Lc + s * 56, (y - 1) / 2, 2, y, 2, 'metal', '#6a6e74', true); for (let k = -4; k <= 4; k++) lamp(S, d(0.17), Lc + k * 13, y - 1, '#ffd89a', 9); });
      for (let i = 0; i < 9; i++) S.item(d(0.05 + i * 0.027), (r) => { const m = d(0.05 + i * 0.027), Lc = S.lane(m).lx, s = i % 2 ? 1 : -1, hf = halfAt(0.05 + i * 0.027); S.ball(m, Lc + s * (hf - 14 + r.between([-4, 4])), 0, r.between([5, 9]), 'col:' + pk(r, ['#8a7a62', '#7d6d56', '#94846c']), undefined, true, 0.8); });
      // ---- puits : lampes, câbles, cages d'ascenseur, poutres en travers (on passe du côté dégagé)
      for (let dc = d(0.31); dc < d(0.4); dc += 10) S.item(dc, (r) => { const Lc = S.lane(dc).lx; for (const s of [-1, 1]) { lamp(S, dc, Lc + s * 24, 8 + r.between([0, 30]), r() < 0.5 ? '#ffd89a' : '#ff8a5a', 15); S.bx(dc, Lc + s * 25.5, 20, 0.3, 80, 0.3, 'col:#222', undefined, false); } });
      cage(S, d(0.325), -19, 4, 18, 0); cage(S, d(0.345), 19, 30, 22, 2.2); cage(S, d(0.37), -19, 18, 20, 4); cage(S, d(0.39), 19, 8, 18, 1);
      for (let k = 0; k < 4; k++) S.item(d(0.318 + k * 0.021), (r) => { const m = d(0.318 + k * 0.021), Lc = S.lane(m).lx, s = k % 2 ? 1 : -1, y = k % 2 ? 10 : 28; S.bx(m, Lc + s * 14.5, y, 24, 2, 3, 'metal', '#8a8e94', true); S.bx(m, Lc + s * 14.5, y + 1.1, 24, 0.3, 3.2, 'hazard', undefined, false); S.bx(m, Lc + s * 14.5, y + 5, 0.3, 8, 0.3, 'col:#222', undefined, false); });
      // ---- tunnel ferroviaire : parois, voûte, nervures, lampes, rails, signaux ; entrée dans le puits et sortie à l'air libre
      const t0 = d(0.4), t1 = d(0.915), tRoof = d(0.6), hw = 30, H = 40;
      for (const [dc, k] of [[t0, 0], [t1, 1]]) S.item(dc, () => { const Lc = S.lane(dc).lx; S.wall(dc, Lc - 120, Lc + 120, -40, 110, 6, 'concreteDark', CONC[k], { lx: Lc, yc: 22, w: 2 * hw + 2, h: 44 }); S.bx(dc, Lc, 44.5, 2 * hw + 4, 1.4, 7, 'col:#5a4a38', undefined, false); if (k) for (const s of [-1, 1]) lamp(S, dc, Lc + s * (hw - 1), 36, '#ff9a4a', 22); });
      for (let dc = t0; dc < t1; dc += 12) S.item(dc + 6, (r) => {
        const m = dc + 6, Lc = S.lane(m).lx;
        for (const s of [-1, 1]) S.bx(m, Lc + s * (hw + 7), 30, 14, 100, 12.8, 'concreteDark', pk(r, CONC), true);
        if (m < tRoof) S.bx(m, Lc, H + 6, 2 * hw + 28, 12, 12.8, 'concreteDark', pk(r, CONC), true);
        for (const s of [-1, 1]) { S.bx(m, Lc + s * (hw - 0.3), 0.8, 0.3, 1.6, 12.8, 'hazard', undefined, false); S.bx(m, Lc + s * (hw - 0.4), H - 3, 0.9, 0.9, 12.6, 'metal', '#6a6e74', false); if (Math.round(m / 12) % 2 === 0) { S.bx(m, Lc + s * (hw - 0.3), 15, 0.2, 0.6, 8, 'emis:#ffb04a', undefined, false); S.glow(m, Lc + s * (hw - 1.5), 15, '#ffb04a', 16); } }
        for (const x of [-9, 9]) { for (const o of [-0.75, 0.75]) S.bx(m, Lc + x + o, 0.3, 0.2, 0.25, 12.4, 'metal', '#7a7e84', false); S.bx(m, Lc + x, 0.08, 6, 0.16, 12.4, 'col:#4a4844', undefined, false); S.bx(m, Lc + x, 0.22, 4.4, 0.2, 0.8, 'planks', '#6a5238', false); }
      });
      for (let dc = t0 + 10; dc < t1 - 10; dc += 24) S.item(dc, (r) => {
        const Lc = S.lane(dc).lx;
        for (const s of [-1, 1]) S.bx(dc, Lc + s * (hw - 0.5), 20, 1.2, 40, 1.6, 'concrete', '#6c6e6c', true); if (dc < tRoof) S.bx(dc, Lc, H - 0.6, 2 * hw, 1.2, 1.6, 'concrete', '#6c6e6c', true);
        if (dc < tRoof) S.bx(dc + 12, Lc, H - 1.6, 16, 0.3, 2, 'emis:#ffe9b0', undefined, false); S.glow(dc + 12, Lc, H - 2, '#ffe9b0', 46); S.glow(dc + 12, Lc - 12, H - 4, '#ffe9b0', 26); S.glow(dc + 12, Lc + 12, H - 4, '#ffe9b0', 26);
        if (r() < 0.6) { const s = r() < 0.5 ? -1 : 1; S.bx(dc + 6, Lc + s * (hw - 2), 6, 0.3, 0.5, 0.3, 'col:#333', undefined, false); S.bx(dc + 6, Lc + s * (hw - 2.2), 6.6, 0.4, 0.8, 0.6, 'emis:' + (r() < 0.5 ? '#ff4a3a' : '#4aff7a'), undefined, false); }
        if (r() < 0.45) { const s = r() < 0.5 ? -1 : 1; S.bx(dc + 2, Lc + s * (hw - 5), 2, 5, 4, 6, 'metal', '#4a5058', true); lamp(S, dc + 2, Lc + s * (hw - 5), 4.4, '#8aff9a', 9); }
      });
      train(S, d(0.43), d(0.6));
      // ---- ennemis
      foe(S, 'haul', d(0.1), 6, 0, { name: 'BENNE', path: 130, speed: 12 });
      foe(S, 'dozer', d(0.2), -32, 0, { name: 'BULLDOZER', hp: 2, armed: false });
      foe(S, 'rocketTruck', d(0.26), 26, 0, { name: 'LANCE-ROQUETTES', armed: true });
      foe(S, 'aaturret', d(0.345), 12, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'apc', d(0.48), 9, 0, { name: 'TRANSPORT', hp: 2, armed: false });
      foe(S, 'aaturret', d(0.57), -22, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'tank', d(0.65), 12, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'truck', d(0.8), -6, 0, { name: 'CAMION', path: 110, speed: 15 });
    } };

  // ===== LA VILLE DE NUIT (760 m) : avenue entre des tours éclairées, passerelles, projecteurs, hall de verre à traverser, un char dans la rue
  const BTX = [{ side: 'facadeDark', top: 'concreteDark', bottom: 'concreteDark' }, { side: 'facadeNavy', top: 'concreteDark', bottom: 'concreteDark' }, { side: 'facadeGlass', top: 'concreteDark', bottom: 'concreteDark' }, { side: 'facade', top: 'concreteDark', bottom: 'concreteDark' }];
  const NEON = ['#ffd890', '#7af0ff', '#ff6ad8', '#ffe27a', '#9aff9a'];
  function tower(S, dc, lx, w, dd, h, r) {
    S.place(dc, lx, w, dd, 0, h + 10, () => {
      S.bx(dc, lx, h / 2, w, h, dd, pk(r, BTX), pk(r, ['#c8ccd4', '#b8bcc8', '#a8b0c0', '#d0c8c0']), true);
      const face = lx > 0 ? -1 : 1, fx = lx + face * (w / 2 + 0.12);
      for (let k = 0; k < 5 + Math.floor(r() * 4); k++) { const y = 8 + r() * (h - 12); S.bx(dc + r.between([-dd * 0.2, dd * 0.2]), fx, y, 0.25, 1.4, dd * r.between([0.4, 0.85]), 'emis:' + pk(r, NEON), undefined, false); }
      if (h > 60) { S.bx(dc, lx, h + 2.4, 1, 5, 1, 'metal', '#444', false); S.bx(dc, lx, h + 5.2, 1.4, 1.2, 1.4, 'emis:#ff3a2a', undefined, false); S.glow(dc, lx, h + 5, '#ff3a2a', 22); }
      if (r() < 0.4) { S.bx(dc, fx, h * 0.5, 0.5, 12, 18, 'emis:' + pk(r, NEON), undefined, false); }   // enseigne verticale
    }, { vol: 90 });
  }
  D.scenes.ville = { len: [760, 760], noDoor: true, noChaos: true, turns: [[0.14, 0.42, -34], [0.5, 0.86, 40]],
    pin: (T, sc) => ({ lx: 0, y: 16, from: 24, to: sc.d1 - sc.d0 - 24 }),
    ground: (d, lx, c, sc) => { const k = ss(sc.d0 - 4, sc.d0 + 20, d) * (1 - ss(sc.d1 - 20, sc.d1 + 4, d)); if (k > 0) c.lerp(new T3.Color(Math.abs(lx) < 36 ? '#3a3d42' : '#4a4d52'), k * 0.96); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      // avenue : bandes jaunes, lampadaires, voitures qui brûlent
      for (let dc = S.d0 + 6; dc < S.d1; dc += 18) S.item(dc, (r) => { const Lc = S.lane(dc).lx; S.bx(dc, Lc, 0.12, 0.7, 0.05, 8, 'col:#e8c850', undefined, false, { shadow: false }); for (const s of [-1, 1]) { S.bx(dc, Lc + s * 38, 5, 0.4, 10, 0.4, 'metal', '#5a5e66', false); lamp(S, dc, Lc + s * 36.4, 10, '#ffd89a', 13); } });
      for (let i = 0; i < 9; i++) S.item(d(0.04 + i * 0.105), (r) => { const m = d(0.04 + i * 0.105), Lc = S.lane(m).lx, lx = Lc + (r() < 0.5 ? -1 : 1) * r.between([14, 30]); S.bx(m, lx, 0.8, 2.2, 1.4, 4.6, 'col:#2a2a2e', undefined, true); S.bx(m, lx, 1.9, 1.8, 0.9, 2.4, 'col:#1a1a1e', undefined, true); S.bx(m, lx, 1.2, 2.3, 0.5, 4.7, 'emis:#ff7a2a', undefined, false); S.glow(m, lx, 2.5, '#ff7a2a', 20); });
      // les tours des deux côtés (au moins 44 m de la trajectoire)
      for (const sg of [-1, 1]) S.rows(S.d0 + 14, S.d1 - 8, 46, 0.5, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx; tower(S, dc, Lc + sg * r.between([52, 82]), r.between([26, 44]), r.between([30, 46]), r.between([34, 120]), r); }));
      // passerelles et ponts en travers de l'avenue
      for (const [u, y, w] of [[0.17, 24, 126], [0.46, 14, 126], [0.7, 34, 126]]) S.item(d(u), (r) => { const m = d(u), Lc = S.lane(m).lx; S.bx(m, Lc, y, w, 3, 9, 'metal', '#6a6e76', true); S.bx(m, Lc, y + 1.7, w, 0.3, 9.4, 'hazard', undefined, false); S.bx(m, Lc, y - 1.7, w, 0.4, 9, 'emis:#7af0ff', undefined, false); S.glow(m, Lc, y - 2, '#7af0ff', 30); for (const s of [-1, 1]) S.bx(m, Lc + s * 56, y / 2, 3, y, 3, 'concrete', '#6c6e6c', true); });
      // projecteurs qui balaient la ville
      for (let k = 0; k < 4; k++) searchlight(S, d(0.1 + k * 0.23), (k % 2 ? 1 : -1) * 70, 8, k * 1.7, 0.5 + k * 0.08);
      // hall de verre : un immeuble à cheval sur l'avenue ; on le traverse en cassant les vitres
      S.reserve(d(0.58), 0, 200, 90);
      S.item(d(0.58), (r) => {
        const dm = d(0.58), Lc = S.lane(dm).lx, len = 74, hh = 70, hole = { lx: Lc, yc: 17, w: 50, h: 34 };
        for (const e of [-1, 1]) {
          const de = dm + e * len / 2;
          S.wall(de, Lc - 100, Lc + 100, 0, hh, 2.4, BTX[0], '#b8bcc8', hole);
          const cols = 10, rows = 6, bw = hole.w / cols, bh = hole.h / rows, blocks = [];
          for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) blocks.push(S.at(de, Lc - hole.w / 2 + (i + 0.5) * bw, j * bh + bh / 2));
          try { S.b.smashWall({ blocks, size: [bw + 0.05, bh, 0.5], yaw: S.yaw(de), mat: 'glass', shatter: 'glass', reward: 2 }); } catch (er) { (window.__errs || (window.__errs = [])).push('glass ' + er); }
        }
        for (const s of [-1, 1]) S.bx(dm, Lc + s * 98, hh / 2, 4, hh, len, BTX[1], '#a8b0c0', true);
        S.bx(dm, Lc, hh + 1, 200, 2, len, 'concreteDark', '#8a8c90', true); S.bx(dm, Lc, 0.2, 200, 0.4, len, 'concrete', '#7a7c80', false);
        for (let k = -2; k <= 2; k++) for (const e of [-1, 1]) { S.cyl(dm + e * 26, Lc + k * 17 + 8 * e, 0, 1.6, 40, 'concrete', '#a8a8a4', 10, 1.6, true); }
        for (let k = 0; k < 6; k++) { const dd = dm - 28 + k * 11; lamp(S, dd, Lc, 38, '#9ff0ff', 20); S.bx(dd, Lc + (k % 2 ? 18 : -18), 1.2, 8, 2.4, 3, 'col:#3a424c', undefined, true); }   // comptoirs
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) S.bx(dm - 20 + k * 20, Lc + s * 34, 2, 10, 4, 3, 'emis:#7af0ff', undefined, false);
      });
      foe(S, 'tank', d(0.28), 8, 0, { name: 'BLINDE', hp: 2, armed: false });
      foe(S, 'heli', d(0.36), 0, 38, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -28, y), SS.at(dc + 24, 0, y + 6), SS.at(dc, 28, y), SS.at(dc - 24, 0, y + 6)], speed: 13 });
      foe(S, 'apc', d(0.5), -8, 0, { name: 'TRANSPORT', path: 90, speed: 16 });
      foe(S, 'aaturret', d(0.52), 36, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'jeep', d(0.8), 6, 0, { name: 'JEEP', path: 120, speed: 20 });
      foe(S, 'tank', d(0.72), -10, 0, { name: 'BLINDE', hp: 3, armed: false });
    } };
})();
