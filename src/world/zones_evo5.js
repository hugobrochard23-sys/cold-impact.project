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
  const boulder = (S, dc, lx, y, s, r, gray) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, SAND), noMoss: true, shade: '#74634c' }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const lamp = (S, dc, lx, y, col, size) => { S.bx(dc, lx, y, 1.2, 0.35, 0.8, 'emis:' + (col || '#ffe2a8'), undefined, false); S.glow(dc, lx, y - 0.3, col || '#ffe2a8', size || 12); };
  const T3 = THREE;
  const mat = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e } : { color: c });
  const basic = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  const bx = (grp, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };

  // segment de boite oriente sur la pente (lacet + tangage) entre deux distances du couloir : la voie epouse le terrain au lieu de rester horizontale
  function slopeBox(S, m0, m1, lx, y, w, h, mat, tint) {
    const p0 = S.at(m0, lx, y), p1 = S.at(m1, lx, y), dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], hz = Math.hypot(dx, dz), Ln = Math.hypot(hz, dy) + 0.05;
    S.b.box({ p: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], s: [w, h, Ln], r: [-Math.atan2(dy, hz) * 180 / Math.PI, Math.atan2(dx, dz) * 180 / Math.PI, 0], mat, tint, collide: false, shadow: false });
  }
  function railTrack(S, a, b2, lx) {
    for (let m = a; m < b2 - 0.01; m += 3) {
      const m1 = Math.min(b2, m + 3.05);
      slopeBox(S, m, m1, lx, 0.1, 3.5, 0.22, 'col:#4a4844');
      for (const o of [-0.75, 0.75]) { slopeBox(S, m, m1, lx + o, 0.3, 0.2, 0.08, 'metal', '#7a7e84'); slopeBox(S, m, m1, lx + o, 0.39, 0.1, 0.16, 'metal', '#9a9ea4'); slopeBox(S, m, m1, lx + o, 0.5, 0.17, 0.08, 'metal', '#b4b8be'); }
      for (let k = 0; k < 3; k++) { const s0 = m + k * 1.0; slopeBox(S, s0, Math.min(b2, s0 + 0.38), lx, 0.26, 2.5, 0.12, 'planks', '#6a5238'); }
    }
  }
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
  // v208 : geometrie fusionnee par matiere (une boite = une instance, un seul maillage par matiere : ~7 appels de dessin pour tout le train)
  function mergeItems(items, material) {
    const P = [], N = [], I = [], m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(); let off = 0;
    for (const it of items) {
      const g = it.r ? new T3.CylinderGeometry(it.r, it.r, it.w, 12) : new T3.BoxGeometry(it.w, it.h, it.d);
      if (it.r) g.rotateZ(Math.PI / 2);
      m4.compose(new T3.Vector3(it.x, it.y, it.z), q.setFromEuler(e.set(0, it.ry || 0, 0)), new T3.Vector3(1, 1, 1)); g.applyMatrix4(m4);
      const p = g.attributes.position.array, n = g.attributes.normal.array, ix = g.index.array; for (let k = 0; k < p.length; k++) { P.push(p[k]); N.push(n[k]); } for (let k = 0; k < ix.length; k++) I.push(ix[k] + off); off += p.length / 3; g.dispose();
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); geo.setIndex(I);
    return new T3.Mesh(geo, material);
  }
  // train blindé : arrive en face dans le tunnel, sur la voie de gauche (la fusée passe au centre ou à droite)
  function train(S, dA, dB) {
    if (!S.inClip(dA)) return;
    const T = S.T, g = new T3.Group(), glow = basic('#fff0c0');
    const M = { hull: mat('#3b4d44'), hull2: mat('#46564c'), dark: mat('#1f2523'), red: mat('#b2362a'), cream: mat('#d9d3bd'), steel: mat('#6a6f74'), glass: basic('#9adcff') }, L = {}; for (const k of Object.keys(M)) L[k] = [];
    const add = (k, w, h, d, x, y, z) => L[k].push({ w, h, d, x, y, z }), wheel = (x, y, z) => L.steel.push({ r: 0.72, w: 0.38, x, y, z });
    // locomotive : caisse, nez incline, cabine vitree, bandeau rouge et creme, events, tampons, bogies a 2 essieux
    add('dark', 6.6, 0.9, 19, 0, 1.0, -9); add('hull', 6.2, 3.7, 15.6, 0, 3.3, -10.2); add('hull', 5.8, 2.7, 3.4, 0, 2.7, 1.5); add('hull', 5.4, 1.6, 2.6, 0, 3.9, -0.4);
    add('red', 6.3, 0.7, 18.2, 0, 2.3, -8.6); add('cream', 6.28, 0.22, 18.2, 0, 2.8, -8.6); add('hull', 5.3, 1.9, 6.4, 0, 6.0, -4.8); add('dark', 5.7, 0.35, 6.8, 0, 7.05, -4.8);
    add('glass', 4.9, 1.05, 0.12, 0, 6.2, -1.56); for (const sx of [-1, 1]) { add('glass', 0.12, 0.95, 3.4, sx * 2.68, 6.2, -4.6); add('dark', 0.1, 2.6, 2.4, sx * 3.12, 3.2, -9); }
    for (const z of [-10, -13.5, -17]) add('steel', 1.7, 0.5, 1.7, 0, 5.4, z);
    for (const sx of [-1.9, 1.9]) { add('steel', 0.6, 0.5, 0.7, sx, 1.2, 2.5); add('steel', 0.6, 0.5, 0.7, sx, 1.2, -19.4); }
    for (const z of [-3.2, -5.6, -12.8, -15.2]) for (const sx of [-2.35, 2.35]) wheel(sx, 0.72, z);
    for (let i = 0; i < 7; i++) {
      const zc = -22 - i * 15.5, hk = i % 2 ? 'hull2' : 'hull';
      add('dark', 6.5, 0.7, 14.8, 0, 1.0, zc); add(hk, 6.2, 3.9, 14.2, 0, 3.3, zc); add('red', 6.3, 0.34, 14.2, 0, 4.9, zc); add('cream', 6.26, 0.2, 14.2, 0, 2.2, zc);
      add('dark', 5.4, 0.5, 13.4, 0, 5.5, zc); add('steel', 1.5, 0.3, 2.6, 0, 5.85, zc);
      for (const sx of [-1, 1]) { add('dark', 0.1, 2.7, 2.3, sx * 3.12, 3.05, zc); for (const dz of [-5.2, 5.2]) add('cream', 0.1, 0.5, 1.3, sx * 3.12, 4.1, zc + dz); }
      add('steel', 0.5, 0.4, 1.5, 0, 1.2, zc + 7.9);
      for (const dz of [-4.6, -2.4, 2.4, 4.6]) for (const sx of [-2.35, 2.35]) wheel(sx, 0.72, zc + dz);
    }
    for (const k of Object.keys(M)) if (L[k].length) g.add(mergeItems(L[k], M[k]));
    for (const sx of [-1.8, 1.8]) { const h = new T3.Mesh(new T3.BoxGeometry(1.3, 1.3, 0.3), glow); h.position.set(sx, 2.7, 3.25); g.add(h); }
    const spot = new T3.Mesh(new T3.ConeGeometry(9, 80, 12, 1, true), new T3.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.05, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, fog: false })); spot.geometry.translate(0, 40, 0); spot.rotation.x = Math.PI / 2; spot.position.set(0, 2.6, 3.3); g.add(spot);
    const len = 22 + 7 * 15.5; EVO.colBox(g, 7.2, 8.4, len, 0, 4.2, -len / 2 + 2);
    S.b.root.add(g); g.rotation.order = 'YXZ';
    const st = { on: false, t0: 0, horn: false };
    EVO.addDyn(g, (t, dt, game) => {
      const run = game.endlessRun; if (!run) return;
      if (!st.on && run.dist > dA - 130 && game.state === 'FLIGHT') { st.on = true; st.t0 = t; game.audio.play('trainHorn'); game.rig.shake = Math.max(game.rig.shake, 0.4); }
      if (!st.on) { g.visible = false; if (game.audio.setTrain) game.audio.setTrain(0); return; }
      const dd = dB - 46 * (t - st.t0); g.visible = dd > dA - 60;
      if (!g.visible) { if (game.audio.setTrain) game.audio.setTrain(0); return; }
      const lc = S.lane(dd).lx - 9, p = T.at(dd, lc, 0.2), q = T.at(dd - 6, lc, 0.2); g.position.set(p[0], p[1], p[2]); g.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]); g.rotation.x = -Math.atan2(q[1] - p[1], Math.hypot(q[0] - p[0], q[2] - p[2]));   // suit la pente
      if (!st.horn2 && game.rocket.active && game.rocket.pos.distanceTo(g.position) < 160) { st.horn2 = true; game.audio.play('trainHorn'); }
      if (game.audio.setTrain) { const dist = game.rocket.active ? game.rocket.pos.distanceTo(g.position) : 999; game.audio.setTrain(Math.pow(Math.max(0, 1 - dist / 240), 1.4)); }
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
        const m = dc + 6.5, Lc = S.lane(m).lx, fl = T.rel(m), u = (m - S.d0) / L, hf = halfAt(u), top = 150 - fl;   // v264 : parois tres hautes + toit de roche : on ne peut plus sauter la mine par le haut
        for (const s of [-1, 1]) {
          { const tn = pk(r, u < 0.3 ? SAND : CAVE), tk = (k) => '#' + new T3.Color(tn).multiplyScalar(k).getHexString();   // v206 : paroi unie (sans quadrillage) + strates en saillie de teintes voisines : une falaise, plus un mur
            S.bx(m, Lc + s * (hf + 14), (top - 15) / 2, 28, top + 15, 13.8, 'col:' + tn, undefined, true);
            for (let k = 0, nb = 2 + Math.floor(r() * 3); k < nb; k++) { const pr = r.between([0.5, 1.7]), hh = r.between([3, 8]), yy = r.between([-6, Math.max(2, top - 8)]); S.bx(m, Lc + s * (hf - pr / 2 + 0.1), yy, pr, hh, 14.2, 'col:' + tk(r.between([0.9, 1.1])), undefined, false, { shadow: false }); } }
          for (let y = -10; y < Math.min(top - 10, 70); y += (u < 0.3 ? 21 : 13)) { const sz = r.between(u < 0.3 ? [15, 23] : [6, 10]); boulder(S, m + r.between([-3, 3]), Lc + s * (hf + 1.8 * sz + r.between([0, 3])), y + 1, sz, r, pk(r, u < 0.3 ? SAND : CAVE)); }
        }
        if (u < 0.28 && r() < 0.5) { const s = r() < 0.5 ? -1 : 1; lamp(S, m, Lc + s * (hf - 2), 14 + r.between([0, 18]), '#ffd89a', 14); }
        S.bx(m, Lc, top + 7, 2 * (hf + 28), 14, 13.8, 'col:' + pk(r, CAVE), undefined, true);   // toit de roche
      });
      // v265 : la falaise entoure l'entree de la mine : une montagne immense avec une seule ouverture, aux dimensions de la carriere (on ne peut plus passer au-dessus)
      S.item(d(0.03) - 10, () => { const m = d(0.03) - 10, Lc = S.lane(m).lx; S.wall(m, Lc - 1200, Lc + 1200, -120, 1500, 14, 'col:#8a8272', undefined, { lx: Lc, yc: 38.5, w: 2 * (halfAt(0.03) + 28), h: 237 }); });
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
      for (let i = 0; i < 9; i++) S.item(d(0.05 + i * 0.027), (r) => { const m = d(0.05 + i * 0.027), Lc = S.lane(m).lx, s = i % 2 ? 1 : -1, hf = halfAt(0.05 + i * 0.027); boulder(S, m, Lc + s * (hf - 14 + r.between([-4, 4])), 0, r.between([6, 11]), r, pk(r, ['#8a7a62', '#7d6d56', '#94846c'])); });   // v207 : blocs de roche (plus de boules)
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
        S.bx(m, Lc, H + 6, 2 * hw + 28, 12, 12.8, 'concreteDark', pk(r, CONC), true);   // v264 : le toit du tunnel couvre toute sa longueur
        for (const s of [-1, 1]) { S.bx(m, Lc + s * (hw - 0.3), 0.8, 0.3, 1.6, 12.8, 'hazard', undefined, false); S.bx(m, Lc + s * (hw - 0.4), H - 3, 0.9, 0.9, 12.6, 'metal', '#6a6e74', false); if (Math.round(m / 12) % 2 === 0) { S.bx(m, Lc + s * (hw - 0.3), 15, 0.2, 0.6, 8, 'emis:#ffb04a', undefined, false); S.glow(m, Lc + s * (hw - 1.5), 15, '#ffb04a', 16); } }
        for (const x of [-9, 9]) railTrack(S, m - 6, m + 6, Lc + x);   // v208 : voie complete qui suit le sol (ballast, traverses, deux rails a patin, ame et champignon)
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
      // v208 : socle, pilastres d'angle, corniche, couronnement en retrait, liseré lumineux : une vraie tour (et non plus un pave)
      S.bx(dc, lx, 3, w + 2.4, 6, dd + 2.4, 'concreteDark', '#5e646e', true);
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) S.bx(dc + sa * (dd / 2 + 0.1), lx + sb * (w / 2 + 0.1), h / 2, 1.3, h, 1.3, 'concreteDark', '#4c525c', false);
      S.bx(dc, lx, h + 0.55, w + 1.4, 1.1, dd + 1.4, 'concreteDark', '#707680', false);
      S.bx(dc, lx, h - 1.6, w + 0.5, 0.45, dd + 0.5, 'emis:' + pk(r, NEON), undefined, false);
      if (h > 52) { const ch = r.between([6, 14]); S.bx(dc, lx, h + 1.1 + ch / 2, w * 0.62, ch, dd * 0.62, pk(r, BTX), '#9aa2b2', false); S.bx(dc, lx, h + 1.2 + ch + 0.4, w * 0.7, 0.8, dd * 0.7, 'concreteDark', '#707680', false); }
      const face = lx > 0 ? -1 : 1, fx = lx + face * (w / 2 + 0.12);
      for (let k = 0; k < 5 + Math.floor(r() * 4); k++) { const y = 8 + r() * (h - 12); S.bx(dc + r.between([-dd * 0.2, dd * 0.2]), fx, y, 0.25, 1.4, dd * r.between([0.4, 0.85]), 'emis:' + pk(r, NEON), undefined, false); }
      if (h > 60) { S.bx(dc, lx, h + 2.4, 1, 5, 1, 'metal', '#444', false); S.bx(dc, lx, h + 5.2, 1.4, 1.2, 1.4, 'emis:#ff3a2a', undefined, false); S.glow(dc, lx, h + 5, '#ff3a2a', 22); }
      if (r() < 0.4) { S.bx(dc, fx, h * 0.5, 0.5, 12, 18, 'emis:' + pk(r, NEON), undefined, false); }   // enseigne verticale
      // v264 : devanture eclairee, auvent colore, climatiseurs, reservoir et antenne sur le toit, rangees de fenetres allumees
      S.bx(dc, lx + face * (w / 2 + 0.25), 2.8, 0.3, 3.6, dd * 0.78, 'emis:' + pk(r, NEON), undefined, false);
      S.bx(dc, lx + face * (w / 2 + 1.7), 5.1, 3.4, 0.3, dd * 0.86, 'col:' + pk(r, ['#c8352a', '#2f6fb0', '#e8b82a', '#3a9a5a']), undefined, false);
      for (let k = 0; k < 3; k++) S.bx(dc + r.between([-dd * 0.3, dd * 0.3]), lx + r.between([-w * 0.28, w * 0.28]), h + 2.0, r.between([2.4, 4]), 2.4, r.between([2.4, 4]), 'metal', '#7a8088', false);
      if (r() < 0.55) S.cyl(dc + r.between([-dd * 0.25, dd * 0.25]), lx + r.between([-w * 0.25, w * 0.25]), h + 1.1, 2.1, 4.2, 'col:#8a6a48', undefined, 10, 2.1, false);
      for (let k = 0; k < 3 + Math.floor(r() * 3); k++) { const y = 10 + r() * (h - 16); for (let j = 0; j < 4; j++) S.bx(dc - dd * 0.36 + j * dd * 0.24, fx + face * 0.05, y, 0.2, 1.3, 2.2, 'emis:#ffe9b0', undefined, false); }
    }, { vol: 90 });
  }
  D.scenes.ville = { len: [760, 760], noDoor: true, noChaos: true, turns: [[0.14, 0.42, -34], [0.5, 0.86, 40]],
    pin: (T, sc) => ({ lx: 0, y: 16, from: 24, to: sc.d1 - sc.d0 - 24 }),
    ground: (d, lx, c, sc) => { const k = ss(sc.d0 - 4, sc.d0 + 20, d) * (1 - ss(sc.d1 - 20, sc.d1 + 4, d)); if (k > 0) c.lerp(new T3.Color(Math.abs(lx) < 36 ? '#3a3d42' : '#4a4d52'), k * 0.96); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      // v264 : trottoirs, passages pietons, feux, voitures garees
      for (let dc = S.d0 + 10; dc < S.d1; dc += 23) S.item(dc, (r) => { const Lc = S.lane(dc).lx; for (const s of [-1, 1]) S.bx(dc, Lc + s * 45, 0.3, 14, 0.6, 23.4, 'concrete', '#6c6e72', false, { shadow: false }); });
      for (let u = 0.07; u < 0.98; u += 0.09) S.item(d(u), (r) => { const m = d(u), Lc = S.lane(m).lx; for (let k = -6; k <= 6; k++) S.bx(m, Lc + k * 5.6, 0.2, 2.4, 0.05, 9, 'col:#d8d8d0', undefined, false, { shadow: false }); for (const s of [-1, 1]) { S.bx(m, Lc + s * 40, 4.5, 0.4, 9, 0.4, 'metal', '#3a3e44', false); S.bx(m, Lc + s * 40, 9.4, 0.9, 2.6, 0.9, 'col:#15171a', undefined, false); S.bx(m - 0.5, Lc + s * 40, 10.4, 0.5, 0.5, 0.2, 'emis:#ff3a2a', undefined, false); S.bx(m - 0.5, Lc + s * 40, 9.4, 0.5, 0.5, 0.2, 'emis:#ffb82a', undefined, false); S.bx(m - 0.5, Lc + s * 40, 8.4, 0.5, 0.5, 0.2, 'emis:#3aff6a', undefined, false); } for (let k = 0; k < 2; k++) { const s = r() < 0.5 ? -1 : 1, lxx = Lc + s * r.between([30, 38]), cc = pk(r, ['#6a2a2a', '#2a3a6a', '#d0d0d4', '#2a2a2e']); S.bx(m + k * 9, lxx, 0.8, 2.2, 1.2, 4.6, 'col:' + cc, undefined, true); S.bx(m + k * 9, lxx, 1.75, 1.9, 0.9, 2.6, 'glass', undefined, false); } });
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
