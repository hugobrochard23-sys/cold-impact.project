/* v246 : NIVEAU 2 — « OPERATION POSEIDON », la suite : LA FOSSE (champ de mines, plongee le long d'une falaise, canyon sous-marin a virages, conduit magmatique),
 * LE VOLCAN (chambre de magma, grand puits de lave que l'on remonte en spirale, ERUPTION a la sortie du cratere), L'ERUPTION (ciel de cendres, bataille aerienne, deux couloirs
 * superposes), l'arene de BEHEMOTH, la STRATOSPHERE et l'ORBITE (arene d'AEGIS). Les anciennes scenes plates (recif, flotte, tempete) ne sont plus utilisees.
 * Les altitudes sont des altitudes MONDE ; les scenes se raccordent par leurs bouts (relief et couloir identiques de part et d'autre). */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, O = EVO && EVO.oc, TR = CC.Trees;
  if (!EVO || !EVO.on || !O || !Z.defs.ocean || !O.slab) return;
  const { yrel, wpin, pk, rr, ss, lam, basic, mb, slab, lampS } = O, OC = Z.defs.ocean, SC = OC.scenes, SEAB = -90;
  const BAS = ['#2b2522', '#332b27', '#3a302b', '#262020'], DEEP = ['#2d516d', '#3d6a85', '#558199', '#1f3a51'], HOT = ['#4a2a22', '#5a2e24', '#3c2420'];
  const _tc = new T3.Color(), _t2 = new T3.Color();
  const tone = (t, hot) => { _tc.set(hot ? '#34201a' : '#1b3550'); _t2.set(hot ? '#74402f' : '#55859f'); _tc.lerp(_t2, U.clamp(t, 0, 1)).multiplyScalar(0.94 + Math.random() * 0.1); return 'col:#' + _tc.getHexString(); };   // roches : une teinte qui s'eclaircit vers le haut, sans damier
  // CRAG : un pic de roche UNIQUE (polyedre irregulier a facettes plates) : anneau de base a rayons et angles irreguliers, un ou deux anneaux intermediaires decales,
  // sommet incline et aigu ; chaque appel tire ses propres sommets (jamais deux roches identiques), orientation libre. La collision est une boite plus petite que la roche.
  const _cq = new T3.Quaternion(), _cs = new V(), _cp = new V(), _ce = new T3.Euler();
  const crag = (S, dc, lx, y, w, h, r, tint, o) => {
    if (!S.inClip(dc)) return; o = o || {};
    const N = 5 + Math.floor(r() * 3), rings = 2 + Math.floor(r() * 2), P = [], tri = [];
    const lean = (o.lean === undefined ? 0.25 : o.lean) * w * (r() - 0.5) * 2;
    for (let k = 0; k <= rings; k++) {
      const t = k / (rings + 1), taper = 1 - 0.78 * Math.pow(t, 1.1) + (r() - 0.5) * 0.18, ox = lean * t * t + (r() - 0.5) * w * 0.18, oz = (r() - 0.5) * w * 0.18, ring = [];
      for (let i = 0; i < N; i++) { const a = (i + (r() - 0.5) * 0.55) / N * 6.2832, rad = (w / 2) * taper * (0.62 + r() * 0.55); ring.push(P.length); P.push([Math.cos(a) * rad + ox, h * t * (0.92 + r() * 0.16) - (k === 0 ? h * 0.15 : 0), Math.sin(a) * rad + oz]); }
      P.rings = (P.rings || []).concat([ring]);
    }
    const apex = P.length; P.push([lean * 1.3, h * (1 + r() * 0.12), (r() - 0.5) * w * 0.14]); const base = P.length; P.push([0, -h * 0.2, 0]);
    const R0 = P.rings; for (let k = 0; k < R0.length - 1; k++) for (let i = 0; i < N; i++) { const a = R0[k][i], b = R0[k][(i + 1) % N], c2 = R0[k + 1][i], d2 = R0[k + 1][(i + 1) % N]; tri.push(a, c2, b, b, c2, d2); }
    const top = R0[R0.length - 1]; for (let i = 0; i < N; i++) tri.push(top[i], apex, top[(i + 1) % N]);
    for (let i = 0; i < N; i++) tri.push(R0[0][(i + 1) % N], base, R0[0][i]);
    const pos = []; for (const i of tri) pos.push(P[i][0], P[i][1], P[i][2]);
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const pp = S.at(dc, lx, y); _cp.set(pp[0], pp[1], pp[2]); _ce.set((r() - 0.5) * (o.tilt === undefined ? 0.22 : o.tilt), r() * 6.283, (r() - 0.5) * (o.tilt === undefined ? 0.22 : o.tilt), 'YXZ'); _cq.setFromEuler(_ce);
    S.b.addGeometry(g, _cp.clone(), _cq.clone(), null, tint, undefined); g.dispose();
    if (o.collide !== false) S.b.box({ p: [pp[0], pp[1] + h * 0.42, pp[2]], s: [w * 0.5, h * 0.8, w * 0.5], render: false });
  };
  // couleur d'une paroi : sombre en bas, claire en haut, avec un grain par roche (jamais deux roches de la meme teinte)
  const rtint = (t, hot, r) => { _tc.set(hot ? '#2c1a14' : '#1a3048'); _t2.set(hot ? '#7a4632' : '#5f8fa8'); _tc.lerp(_t2, U.clamp(t + (r() - 0.5) * 0.25, 0, 1)); _tc.multiplyScalar(0.9 + r() * 0.2); return 'col:#' + _tc.getHexString(); };
  const rockAt = (S, dc, lx, y, s, r, col) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: col || pk(r, DEEP), noMoss: true, shade: '#3f5a5a' }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const jelly = (S, dc, lx, yw, col) => {
    const g = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(2.6, 12, 8, 0, 6.283, 0, Math.PI / 2), basic(col, { transparent: true, opacity: 0.8, fog: false }));
    g.add(body); for (let k = 0; k < 6; k++) { const t = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.02, 6, 4), basic(col, { transparent: true, opacity: 0.5 })); const a = k * 1.047; t.position.set(Math.cos(a) * 1.4, -3, Math.sin(a) * 1.4); g.add(t); }
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); S.glow(dc, lx, yrel(S, dc, yw), col, 16);
    EVO.addDyn(g, (t) => { const k = 1 + 0.18 * Math.sin(t * 2 + dc); body.scale.set(k, 1 / k, k); g.position.y += Math.sin(t * 0.8 + dc) * 0.03; }, [], { near: 320 });
  };
  const ventCone = (S, dc, lx, h, col) => {   // panache hydrothermal : un cone lumineux qui monte du fond
    const p = S.at(dc, lx, h * 0.5), m = new T3.Mesh(new T3.CylinderGeometry(5, 14, h, 10, 1, true), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.1, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }));
    m.position.set(p[0], p[1], p[2]); if (S.inClip(dc)) S.b.root.add(m); S.glow(dc, lx, 3, col, 50);
  };
  const sonar = (S, dc, lx, yw, ph) => {   // anneau de sonar : un tore qui grandit et s'efface (decor sans collision)
    const g = new T3.Group(), m = new T3.MeshBasicMaterial({ color: '#7be8ff', transparent: true, opacity: 0.5, depthWrite: false, fog: false }), t = new T3.Mesh(new T3.TorusGeometry(10, 0.5, 6, 32), m); g.add(t);
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); EVO.addDyn(g, (tt) => { const k = ((tt * 0.35 + ph) % 1); t.scale.setScalar(0.5 + k * 7); m.opacity = 0.55 * (1 - k); }, [], { near: 420 });
  };

  // ---- la mer s'etend a l'infini : en plus de la bande ondulee (largeur 2 x hw), un tablier plat de 1 600 m de chaque cote, de la meme couleur et de la meme matiere
  const ZERO = new V(), QI = new T3.Quaternion(), _os = Z.oceanSurface;
  Z.oceanSurface = (S, d0, d1, hw, amp) => {
    _os(S, d0, d1, hw, amp);
    const X = [-1700, -hw, hw, 1700], step = 48;
    for (let dc = d0; dc < d1; dc += step) S.item(dc + step / 2, () => {
      const pos = [], uv = [], ix = [];
      for (let r = 0; r <= 1; r++) { const dd = Math.min(d1, dc + step * r), fl = S.T.rel(dd); for (let c = 0; c < 4; c++) { const p = S.at(dd, X[c], -Z.PROFILE.ocean.elev - fl); pos.push(p[0], p[1], p[2]); uv.push(X[c], dd); } }
      for (const c of [0, 2]) { const a = c, b = c + 1, q = c + 4, e = c + 5; ix.push(a, q, b, b, q, e); }
      const A = new V(pos[0], pos[1], pos[2]), B2 = new V(pos[12], pos[13], pos[14]), C2 = new V(pos[3], pos[4], pos[5]); if (B2.sub(A).cross(C2.sub(A)).y < 0) for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
      let g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
      const g2 = g.toNonIndexed(); g.dispose(); g2.computeVertexNormals(); S.b.addGeometry(g2, ZERO, QI, null, 'waterSurf', '#7fd0ee', [1 / 15, 1 / 15]); g2.dispose();
    });
  };

  const guideRing = (S, dc, y, rad, col) => { const lx = S.lane(dc).lx; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832; S.bx(dc, lx + Math.cos(a) * rad, y + Math.sin(a) * rad, 2.2, 2.2, 1.2, 'emis:' + col, undefined, false); } S.glow(dc, lx, y, col, 46); };
  // ============================================ LA FOSSE (1100 m) : sous l'eau, du sas a la bouche du conduit magmatique ============================================
  const LF = 1100, GF = (u) => SEAB - 170 * ss(0.15, 0.46, u) + 45 * ss(0.78, 1, u), LNF = (u) => GF(u) + 60 + 10 * ss(0.15, 0.46, u);
  SC.fosse = { len: [LF, LF], noDoor: true, noChaos: true, seabed: true, gw: 125, turns: [[0.02, 0.15, 22], [0.5, 0.63, -46], [0.66, 0.79, 40]],
    sub: [{ u: 0, key: 'mines', name: 'LES MINES' }, { u: 0.15, key: 'falaise', name: 'LA FALAISE' }, { u: 0.46, key: 'fosse', name: 'LA FOSSE' }, { u: 0.8, key: 'conduit2', name: 'LE CONDUIT MAGMATIQUE' }],
    pin: wpin((d, sc) => LNF((d - sc.d0) / (sc.d1 - sc.d0))),
    relief(T, sc) { const fn = (d) => GF(U.clamp((d - sc.d0) / (sc.d1 - sc.d0), 0, 1)) - SEAB; sc.rlo = -170; sc.rhi = 0; return { fn, max: 170 }; },
    ground: (d, lx, c, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0), a = new T3.Color('#53606a'), b = new T3.Color('#2a3a48'), h = new T3.Color('#6a3424'); c.copy(a).lerp(b, ss(0.15, 0.4, u)).lerp(h, ss(0.8, 1, u)); c.multiplyScalar(0.92 + 0.08 * Math.sin(lx * 0.3 + d * 0.13)); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T, lanes = (u) => LNF(u);
      Z.oceanSurface(S, S.d0, d(0.3), 140, 0.4);
      // --- les MINES (0 a 0.15) : chaines de mines en quinconce, filets, anneaux de sonar, deux sous-marins de garde
      for (let i = 0; i < 12; i++) { const u = 0.02 + i * 0.011, dc = d(u), sg = i % 2 ? 1 : -1, lx0 = sg * (11 + (i % 3) * 5); foe(S, 'mine', dc, lx0, yrel(S, dc, lanes(u)), { name: 'MINE', keep: i < 4 }); S.item(dc, () => { const h = Math.max(2, yrel(S, dc, lanes(u))); S.cyl(dc, lx0, 0, 0.14, h, 'col:#34342e', undefined, 5, 0.14, false); }); }
      foe(S, 'sub', d(0.08), 24, yrel(S, d(0.08), lanes(0.08)), { name: 'SOUS-MARIN', hp: 2, armed: true, keep: true }); foe(S, 'sub', d(0.14), -24, yrel(S, d(0.14), lanes(0.14)), { name: 'SOUS-MARIN', hp: 2, armed: true, keep: true });
      for (const sg of [-1, 1]) S.rows(d(0.0), d(0.2), 10, 0.7, (dc) => S.item(dc, (r) => { crag(S, dc, S.lane(dc).lx + sg * r.between([34, 110]), 0, r.between([8, 22]), r.between([10, 34]), r, rtint(0.3, 0, r)); }));
      // --- la FALAISE (0.15 a 0.46) : on plonge le long d'une paroi percee de baies, de passerelles et de projecteurs : une base engloutie
      for (let k = 0; k < 30; k++) { const u = 0.15 + k * 0.0105, dc = d(u); S.item(dc, (r) => { const lx = S.lane(dc).lx - 62, h = yrel(S, dc, lanes(u)) + 30; for (let y = -14; y < h; y += r.between([14, 30])) { const wd = r.between([18, 40]); crag(S, dc + r.between([-5, 5]), lx - r.between([0, 12]), y, wd, r.between([24, 58]), r, rtint((y + 14) / h, 0, r), { lean: 0.5 }); if (r() < 0.4) crag(S, dc + r.between([-4, 4]), lx + r.between([-4, 5]), y + r.between([4, 14]), wd * 0.5, r.between([14, 30]), r, rtint((y + 14) / h, 0, r), { lean: 0.6 }); } }); }
      for (const sg of [1]) S.rows(d(0.16), d(0.46), 14, 0.7, (dc) => S.item(dc, (r) => { if (r() < 0.6) crag(S, dc, S.lane(dc).lx + sg * r.between([50, 100]), 0, r.between([10, 26]), r.between([14, 44]), r, rtint(0.3, 0, r)); }));
      for (let i = 0; i < 5; i++) { const u = 0.2 + i * 0.05, dc = d(u); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 13, yrel(S, dc, lanes(u)), { name: 'MINE', keep: i < 2 }); }
      foe(S, 'sub', d(0.3), -8, yrel(S, d(0.3), lanes(0.3)), { name: 'SOUS-MARIN', hp: 3, armed: true, keep: true });
      // --- la FOSSE (0.46 a 0.8) : canyon etroit a virages, parois de roche, piliers a slalomer, meduses, sources chaudes, la baleine
      for (const sg of [-1, 1]) S.rows(d(0.46), d(0.82), 11, 0.5, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + sg * r.between([58, 74]), top = yrel(S, dc, lanes((dc - S.d0) / L)) + 38; for (let y = -10; y < top; y += r.between([14, 30])) { crag(S, dc + r.between([-5, 5]), lx + sg * r.between([0, 14]) - sg * (y / top) * r.between([0, 8]), y, r.between([18, 38]), r.between([26, 56]), r, rtint((y + 10) / top, 0, r), { lean: 0.5 }); } }));
      for (const [u, sg] of [[0.52, 1], [0.545, -1], [0.58, 1], [0.64, -1], [0.7, 1], [0.735, -1]]) S.item(d(u), (r) => { const dc = d(u), top = yrel(S, dc, lanes(u)) + 40; for (let y = -6; y < top; y += r.between([14, 22])) crag(S, dc, S.lane(dc).lx + sg * r.between([26, 34]), y, r.between([10, 16]), r.between([22, 40]), r, rtint(y / top, 0, r), { lean: 0.4 }); });
      foe(S, 'sub', d(0.56), 14, yrel(S, d(0.56), lanes(0.56)), { name: 'SOUS-MARIN', hp: 3, armed: true, keep: true }); foe(S, 'sub', d(0.75), -14, yrel(S, d(0.75), lanes(0.75)), { name: 'SOUS-MARIN', hp: 3, armed: true, keep: true });
      for (let i = 0; i < 6; i++) { const u = 0.5 + i * 0.05, dc = d(u); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 16, yrel(S, dc, lanes(u)), { name: 'MINE', keep: i < 2 }); }
      // --- le CONDUIT MAGMATIQUE (0.8 a 1) : la roche vire au rouge, des failles incandescentes, la lueur de la chambre devant
      for (const sg of [-1, 1]) S.rows(d(0.8), d(1), 9, 0.4, (dc) => S.item(dc, (r) => { const u = (dc - S.d0) / L, lx = S.lane(dc).lx + sg * r.between([56, 70]), top = yrel(S, dc, lanes(u)) + 36; for (let y = -10; y < top; y += r.between([14, 30])) crag(S, dc + r.between([-5, 5]), lx + sg * r.between([0, 12]), y, r.between([18, 38]), r.between([26, 56]), r, rtint((y + 10) / top, 1, r), { lean: 0.5 }); if (r() < 0.5) { S.bx(dc, lx - sg * 8, yrel(S, dc, lanes(u)) + r.between([-24, 24]), 0.8, r.between([16, 40]), 6, 'emis:#ff5a14', undefined, false); } }));
      for (let k = 0; k < 8; k++) S.item(d(0.82 + k * 0.022), () => { const dc = d(0.82 + k * 0.022); S.glow(dc, 0, yrel(S, dc, lanes(0.82 + k * 0.022)), '#ff6a2a', 70 + k * 12); });
      S.item(d(0.995), () => { const dc = d(0.995), y = yrel(S, dc, lanes(1)); S.glow(dc, 0, y, '#ffb060', 260); });
    } };

  // ============================================ LE VOLCAN (1200 m) : chambre de magma, puits de lave a remonter en spirale, ERUPTION ============================================
  const LV = 1200, GVO = -215, LVO = (u) => -145 + 25 * ss(0, 0.2, u) + 270 * ss(0.12, 0.9, u);
  const RW = (dc, u) => (u < 0.2 ? 78 + 10 * Math.sin(dc / 31) : 50 + 8 * Math.sin(dc / 23) + 5 * Math.sin(dc / 9.7));
  const magmaOrb = (S, dc, lx, yw, ph, per) => {   // boule de magma : elle flotte, monte et descend (collision)
    const g = new T3.Group(), core = new T3.Mesh(new T3.SphereGeometry(3.2, 10, 8), basic('#ff8a3a')), halo = new T3.Mesh(new T3.SphereGeometry(5, 10, 8), basic('#ff4a1a', { transparent: true, opacity: 0.32, depthWrite: false }));
    g.add(core); g.add(halo); const col = EVO.colBox(g, 5.6, 5.6, 5.6, 0, 0, 0); EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); S.glow(dc, lx, yrel(S, dc, yw), '#ff7a2a', 30);
    const base = g.position.y; EVO.addDyn(g, (t) => { g.position.y = base + Math.sin(t / per * 6.283 + ph) * 12; halo.scale.setScalar(1 + 0.12 * Math.sin(t * 7)); }, [col], { near: 300 });
  };
  const lavaFall = (S, dc, lx, ly, h) => { S.bx(dc, lx, ly, 3.4, h, 2.2, 'emis:#e8480f', undefined, false); S.glow(dc, lx, ly, '#ff6a2a', 40); };
  // l'eruption : au passage du cratere, le volcan explose autour de la fusee (flash, secousse, gerbes, rochers projetes)
  EVO.lavaBurst = (g, big) => {
    const rk = g.rocket, fx = g.effects, p = rk.pos.clone(); g.flash = 0.8; g.flashColor = '#ffd9a0'; g.rig.shake = Math.max(g.rig.shake, 2.2); g.hitStop = 0.12; g.hitScale = 0.3; g.audio.play('boom', p); g.audio.play('rumble', p); g.audio.play('reactorHit', p);
    for (let i = 0; i < (big ? 14 : 6); i++) setTimeout(() => { try { const q = rk.pos.clone().add(new V(rr(-70, 70), rr(-30, 90), rr(-70, 70))); fx.explosion(q, null, true, 'orange'); fx.ring(q, new V(0, 1, 0), 6, 60, 0.8, '#ffb060', 0.8); g.audio.play('boomSmall', q); g.rig.shake = Math.max(g.rig.shake, 1.2); } catch (e) { /* ignore */ } }, i * 110);
    for (let i = 0; i < 90; i++) fx.sparks.emit({ pos: p.clone().add(new V(rr(-30, 30), rr(-10, 20), rr(-30, 30))), vel: new V(rr(-1, 1), rr(0.4, 2), rr(-1, 1)).multiplyScalar(rr(20, 80)), life: rr(1, 2.6), s0: 0.9, s1: 1.1, s2: 0.3, cols: fx.pal.ember, drag: 0.6, grav: 8, a: 1, fout: 0.5 });
  };
  SC.volcan = { len: [LV, LV], noDoor: true, noChaos: true, gw: 125, grass: false, turns: [[0.24, 0.52, 55], [0.54, 0.84, -70]],
    sub: [{ u: 0, key: 'chambre', name: 'LA CHAMBRE DE MAGMA' }, { u: 0.2, key: 'puits', name: 'LE PUITS DE LAVE' }, { u: 0.88, key: 'cratere', name: 'LE CRATERE' }],
    pin: wpin((d, sc) => LVO((d - sc.d0) / (sc.d1 - sc.d0))),
    relief(T, sc) { const fn = () => GVO - SEAB; sc.rlo = fn(); sc.rhi = fn(); return { fn, max: 125 }; },
    ground: (d, lx, c) => { c.set('#e0500f'); c.multiplyScalar(0.8 + 0.25 * Math.sin(lx * 0.07 + d * 0.05) * Math.sin(d * 0.11 - lx * 0.04)); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      // les murs : tranches de basalte verticales de chaque cote, plus ou moins serrees, avec failles incandescentes et chutes de lave
      for (let dc = S.d0 + 6; dc < d(0.95); dc += 16) S.item(dc, (r) => {
        const u = (dc - S.d0) / L, R = RW(dc, u), L0 = S.lane(dc), lx = L0.lx, ly = L0.y;
        for (const sg of [-1, 1]) {
          S.bx(dc, lx + sg * (R + 14), (ly + 105) / 2 - 8, 14, ly + 130, 13, 'col:#1d1512', undefined, true);   // fond de paroi : du sol de lave jusqu'au-dessus de la fusee
          for (let y = -12; y < ly + 100; y += r.between([26, 44])) crag(S, dc + r.between([-4, 4]), lx + sg * (R + r.between([12, 24])), y, r.between([22, 40]), r.between([36, 66]), r, rtint(y / (ly + 100), 1, r), { lean: 0.5, tilt: 0.3 });
          if (r() < 0.2) S.bx(dc, lx + sg * (R - 0.6), r.between([10, ly + 60]), 0.7, r.between([16, 40]), 6, 'emis:#d8400f', undefined, false);
          if (r() < 0.07) lavaFall(S, dc, lx + sg * (R - 0.8), ly - 10, 150);
          if (dc % 36 < 12 && r() < 0.7) { S.bx(dc, lx + sg * (R - 6), ly - 24 - r.between([0, 20]), 12, 2.4, 11, 'col:#4a3a32', undefined, true); }
        }
        if (u < 0.2 && r() < 0.35) S.cyl(dc, lx + r.between([-R * 0.7, R * 0.7]), ly + 70, 6, -34, 'col:#3a302b', undefined, 8, 0.5, false);   // stalactites (plus de plafond plat)
      });
      // la chambre : des stalagmites qui montent du lac de lave, des geysers de lueur
      for (let i = 0; i < 14; i++) { const u = 0.01 + i * 0.014, dc = d(u); S.item(dc, (r) => { const sg = i % 2 ? 1 : -1, lx = S.lane(dc).lx + sg * r.between([22, 56]), base = S.lane(dc).y; S.cyl(dc, lx, 0, r.between([5, 10]), base + r.between([-30, -4]), 'col:' + pk(r, HOT), undefined, 8, 2, true); S.glow(dc, lx, 4, '#ff6a2a', 60); }); }
      for (let k = 0; k < 18; k++) { const u = 0.02 + k * 0.05, dc = d(u); S.item(dc, () => S.glow(dc, 0, 6, '#ff7a2a', 220)); }
      // les orbes de magma sur le puits
      for (let i = 0; i < 7; i++) { const u = 0.28 + i * 0.085, dc = d(u); S.item(dc, () => magmaOrb(S, dc, (i % 2 ? 1 : -1) * (10 + (i % 3) * 7), LVO(u) + (i % 3 - 1) * 22, i * 0.7, 3 + (i % 3) * 0.6)); }
      for (let i = 0; i < 6; i++) { const u = 0.3 + i * 0.1, dc = d(u); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 18, yrel(S, dc, LVO(u) + 4), { name: 'MINE', keep: i < 3 }); }
      // le cratere : la bouche s'ouvre, rochers incandescents, geysers de lave, panache de cendres
      for (let k = 0; k < 16; k++) S.item(d(0.9 + k * 0.0065), (r) => { const dc = d(0.9 + k * 0.0065), sg = k % 2 ? 1 : -1, ly = S.lane(dc).y, lx = S.lane(dc).lx + sg * r.between([36, 70]); crag(S, dc, lx, ly - r.between([40, 70]), r.between([24, 44]), r.between([40, 80]), r, rtint(0.5, 1, r)); S.glow(dc, lx, ly - 20, '#ff5a1a', 90); });
      for (let k = 0; k < 4; k++) S.item(d(0.9 + k * 0.025), () => { const dc = d(0.9 + k * 0.025), sg = k % 2 ? 1 : -1, ly = S.lane(dc).y, p = S.at(dc, S.lane(dc).lx + sg * 40, ly - 30), g = new T3.Group(), m = new T3.Mesh(new T3.CylinderGeometry(5, 12, 90, 8, 1, true), basic('#ff7a2a', { transparent: true, opacity: 0.4, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); g.add(m); g.position.set(p[0], p[1] + 30, p[2]); if (S.inClip(dc)) S.b.root.add(g); EVO.addDyn(g, (t) => { m.scale.y = 0.6 + 0.4 * Math.abs(Math.sin(t * 1.4 + k)); }, [], { near: 600 }); });
      S.item(d(0.88), () => { const dc = d(0.88), g = new T3.Group(); EVO.placeGroup(S, g, dc, 0, 0, 0); let fired = false; EVO.addDyn(g, (t, dt, game) => { const run = game.endlessRun; if (!fired && game.state === 'FLIGHT' && run && run.dist > dc - 10) { fired = true; EVO.lavaBurst(game, true); } }, [], { near: 99999, span: 99999 }); });
    } };
  EVO.dryZone = () => { const a = EVO.s2d0 && EVO.s2d0('volcan'), b = a !== undefined ? a + LV : undefined; return [a, b]; };

  // ============================================ L'ERUPTION (900 m) : le ciel de cendres, bataille aerienne, deux couloirs superposes ============================================
  const LE = 900, WP = [[0, 150], [0.12, 138], [0.26, 118], [0.36, 126], [0.6, 120], [0.7, 70], [0.82, 78], [1, 96]];
  const LANE = (u) => { for (let i = 1; i < WP.length; i++) if (u <= WP[i][0]) { const a = WP[i - 1], b = WP[i]; return a[1] + (b[1] - a[1]) * ss(a[0], b[0], u); } return WP[WP.length - 1][1]; };
  EVO.eruptionLane = LANE;
  const ashCloud = (S, dc, lx, yw, s, col) => {
    const g = new T3.Group(), m = basic(col || '#6a5a56', { transparent: true, opacity: 0.55, depthWrite: false, fog: false });
    for (let k = 0; k < 5; k++) { const b = new T3.Mesh(new T3.SphereGeometry(s * rr(0.5, 1), 8, 6), m); b.position.set(rr(-s, s), rr(-s * 0.4, s * 0.4), rr(-s, s)); b.scale.y = 0.6; g.add(b); }
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); EVO.addDyn(g, (t) => { g.position.x += Math.sin(t * 0.2 + dc) * 0.02; }, [], { near: 600 });
  };
  const flak = (S, dc, lx, yw) => {
    const g = new T3.Group(), puff = new T3.Mesh(new T3.SphereGeometry(4, 8, 6), basic('#201a18', { transparent: true, opacity: 0.8, fog: false })), fl = new T3.Mesh(new T3.SphereGeometry(5, 8, 6), basic('#ffb04a', { transparent: true, opacity: 0.8, fog: false })); g.add(puff); g.add(fl);
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); const ph = rr(0, 4);
    EVO.addDyn(g, (t) => { const k = ((t * 0.5 + ph) % 1); puff.scale.setScalar(0.3 + k * 1.4); puff.material.opacity = 0.8 * (1 - k); fl.visible = k < 0.12; fl.scale.setScalar(0.7 + k * 3); }, [], { near: 420 });
  };
  const patrol = (SS, dc2, lx2, y2) => [SS.at(dc2, -30, y2), SS.at(dc2 + 24, 0, y2 + 5), SS.at(dc2, 30, y2), SS.at(dc2 - 24, 0, y2 + 5)];
  SC.eruption = { len: [LE, LE], noDoor: true, noChaos: true, gw: 125, grass: false, turns: [[0.1, 0.3, 24], [0.34, 0.62, -30], [0.66, 0.9, 26]],
    sub: [{ u: 0, key: 'eruption', name: "L'ERUPTION" }, { u: 0.22, key: 'ciel', name: 'LA BATAILLE' }, { u: 0.7, key: 'plongee', name: 'LA PLONGEE' }],
    pin: wpin((d, sc) => LANE((d - sc.d0) / (sc.d1 - sc.d0))),
    relief(T, sc) { const fn = (d) => SEAB * 0 + (GVO - SEAB) * (1 - ss(0.0, 0.12, U.clamp((d - sc.d0) / (sc.d1 - sc.d0), 0, 1))); sc.rlo = 0; sc.rhi = 125; return { fn, max: 125 }; },
    ground: (d, lx, c) => { c.set('#243c46'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      for (let k = 0; k < 8; k++) S.item(d(0.0 + k * 0.012), (r) => { const dc = d(0.0 + k * 0.012), sg = k % 2 ? 1 : -1, lx = sg * r.between([40, 80]); const p = S.at(dc, lx, yrel(S, dc, LANE(k * 0.012)) - r.between([30, 70])); TR.rock(S.b, p[0], p[1], p[2], r.between([14, 28]), r, { gray: pk(r, BAS), noMoss: true }); S.glow(dc, lx, yrel(S, dc, LANE(k * 0.012)) - 30, '#ff5a1a', 80); });
      for (let i = 0; i < 26; i++) { const u = 0.02 + i * 0.037, dc = d(u); S.item(dc, (r) => ashCloud(S, dc, r.between([-80, 80]), LANE(u) + r.between([-60, 70]), r.between([14, 28]), i < 6 ? '#8a4a30' : undefined)); }
      for (let i = 0; i < 18; i++) { const u = 0.18 + i * 0.04, dc = d(u); S.item(dc, (r) => flak(S, dc, r.between([-40, 40]), LANE(u) + r.between([-30, 40]))); }
      // la couche de nuages : de u = 0.34 a 0.62 elle separe un couloir HAUT et un couloir BAS
      for (let k = 0; k < 15; k++) { const u = 0.34 + k * 0.02, dc = d(u); S.item(dc, (r) => { for (let j = -3; j <= 3; j++) ashCloud(S, dc, j * 30, LANE(u) + r.between([-6, 6]), r.between([22, 32]), '#f2f5fa'); }); }
      S.item(d(0.3), () => { const dc = d(0.3), y = yrel(S, dc, LANE(0.3)); S.bx(dc, -22, y + 30, 16, 1.4, 1, 'emis:#7be8ff', undefined, false); S.bx(dc, 22, y - 30, 16, 1.4, 1, 'emis:#ff9a3a', undefined, false); S.glow(dc, -22, y + 30, '#7be8ff', 60); S.glow(dc, 22, y - 30, '#ff9a3a', 60); });
      for (let i = 0; i < 4; i++) { const u = 0.38 + i * 0.06, dc = d(u); foe(S, i % 2 ? 'jet' : 'heli', dc, (i % 2 ? 1 : -1) * 16, yrel(S, dc, LANE(u) + 34), { name: i % 2 ? 'CHASSEUR' : 'HELICO', armed: true, keep: true, patrol: i % 2 ? undefined : patrol, speed: 13 }); }
      for (let i = 0; i < 8; i++) { const u = 0.36 + i * 0.035, dc = d(u); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 15, yrel(S, dc, LANE(u) - 30), { name: 'MINE', keep: i < 4 }); }
      for (let i = 0; i < 5; i++) { const u = 0.08 + i * 0.045, dc = d(u); foe(S, 'heli', dc, (i % 2 ? 1 : -1) * 22, yrel(S, dc, LANE(u) + 8), { name: 'HELICO', armed: true, keep: i < 2, patrol, speed: 13 }); }
      for (let i = 0; i < 4; i++) { const u = 0.72 + i * 0.06, dc = d(u); foe(S, 'jet', dc, (i % 2 ? 1 : -1) * 14, yrel(S, dc, LANE(u) + 6), { name: 'CHASSEUR', armed: true, keep: true }); }
    } };
  O.ashCloud = ashCloud; O.flak = flak; O.patrol = patrol;

  // ============================================ L'ARENE DE BEHEMOTH (1500 m) : ciel clair au-dessus de la mer ; la forteresse volante file devant nous (voir evo_boss2.js) ============================================
  const LBH = 1500, LNB = (u) => 96 + 8 * Math.sin(u * 9);
  SC.behemoth = { len: [LBH, LBH], noDoor: true, noChaos: true, gw: 125, grass: false, turns: [[0.2, 0.5, 14], [0.55, 0.85, -16]],
    sub: [{ u: 0, key: 'behemoth', name: 'BEHEMOTH' }],
    pin: wpin((d, sc) => LNB((d - sc.d0) / (sc.d1 - sc.d0))), ground: (d, lx, c) => { c.set('#243c46'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      for (let i = 0; i < 26; i++) { const u = 0.02 + i * 0.037, dc = d(u); S.item(dc, (r) => ashCloud(S, dc, r.between([-90, 90]), LNB(u) + r.between([-70, 60]), r.between([16, 30]), '#d8e0ea')); }
      for (let i = 0; i < 6; i++) { const u = 0.1 + i * 0.12, dc = d(u); foe(S, 'jet', dc, (i % 2 ? 1 : -1) * 18, yrel(S, dc, LNB(u) + 6), { name: 'CHASSEUR', armed: true, keep: i < 3 }); }
      for (let i = 0; i < 12; i++) { const u = 0.08 + i * 0.07, dc = d(u); S.item(dc, (r) => flak(S, dc, r.between([-50, 50]), LNB(u) + r.between([-30, 40]))); }
    } };

  // ============================================ LA STRATOSPHERE (1500 m) : on monte en spirale a travers des anneaux de nuages d'orage, les chasseurs, les missiles qui partent vers l'orbite ============================================
  const LS2 = 1500, LNS = (u) => 100 + 470 * ss(0.05, 0.95, u);
  const cloudRing = (S, dc, yw, i) => {
    const g = new T3.Group(), lx = S.T.laneX(dc);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, o = new T3.Mesh(new T3.SphereGeometry(rr(9, 15), 8, 6), new T3.MeshBasicMaterial({ color: i % 2 ? '#4a5260' : '#6a7480', transparent: true, opacity: 0.8, fog: true })); o.position.set(Math.cos(a) * 46, Math.sin(a) * 46, rr(-6, 6)); g.add(o); }
    const p = S.at(dc, lx, yrel(S, dc, yw)); g.position.set(p[0], p[1], p[2]); const q = S.T.at(dc - 6, lx, yrel(S, dc - 6, yw)); g.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]); if (S.inClip(dc)) S.b.root.add(g);
    const cols = []; EVO.addDyn(g, (t) => { g.rotation.z = t * 0.12 * (i % 2 ? 1 : -1); }, [], { near: 500 });   // nuages : traversables, jamais mortels
  };
  const streak = (S, dc, lx, yw) => {   // un missile qui monte vers l'orbite (decor : traînee blanche)
    const g = new T3.Group(), body = new T3.Mesh(new T3.CylinderGeometry(2, 2, 22, 8), basic('#eef0f4')), tr = new T3.Mesh(new T3.CylinderGeometry(1, 3.4, 140, 8, 1, true), basic('#ffffff', { transparent: true, opacity: 0.4, depthWrite: false, side: T3.DoubleSide, fog: false })); tr.position.y = -80; g.add(body); g.add(tr); g.add(glow ? glow(30) : new T3.Object3D());
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); const y0 = g.position.y; EVO.addDyn(g, (t) => { g.position.y = y0 + ((t * 70 + dc) % 700); }, [], { near: 700 });
  };
  const glow = (size) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,230,160,1)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return new T3.CanvasTexture(c); })(), transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); s.position.y = -12; return s; };
  SC.strato = { len: [LS2, LS2], noDoor: true, noChaos: true, gw: 125, grass: false, turns: [[0.15, 0.4, -26], [0.45, 0.7, 34], [0.74, 0.95, -20]],
    sub: [{ u: 0, key: 'strato', name: 'LA STRATOSPHERE' }, { u: 0.55, key: 'orbite0', name: 'LA LIGNE DE KARMAN' }],
    pin: wpin((d, sc) => LNS((d - sc.d0) / (sc.d1 - sc.d0))), ground: (d, lx, c) => { c.set('#243c46'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      for (let i = 0; i < 8; i++) { const u = 0.07 + i * 0.1, dc = d(u); S.item(dc, () => cloudRing(S, dc, LNS(u), i)); }
      for (let i = 0; i < 30; i++) { const u = 0.02 + i * 0.032, dc = d(u); S.item(dc, (r) => ashCloud(S, dc, r.between([-110, 110]), LNS(u) + r.between([-90, 70]), r.between([18, 34]), u < 0.5 ? '#d8e0ea' : '#9aa6bc')); }
      for (let i = 0; i < 10; i++) { const u = 0.05 + i * 0.09, dc = d(u); S.item(dc, (r) => streak(S, dc, (i % 2 ? 1 : -1) * r.between([60, 110]), LNS(u) - 140)); }
      for (let i = 0; i < 7; i++) { const u = 0.12 + i * 0.11, dc = d(u); foe(S, 'jet', dc, (i % 2 ? 1 : -1) * 18, yrel(S, dc, LNS(u) + 6), { name: 'CHASSEUR', armed: true, keep: i < 3 }); }
      for (let i = 0; i < 5; i++) { const u = 0.6 + i * 0.07, dc = d(u); foe(S, 'mine', dc, (i % 2 ? 1 : -1) * 16, yrel(S, dc, LNS(u)), { name: 'SATELLITE', keep: i < 2 }); }
    } };

  // ============================================ L'ORBITE (1500 m) : debris, satellites, roues de lasers ; AEGIS au bout ============================================
  const LO = 2600, LNO = (u) => 570 + 60 * ss(0, 1, u) + 10 * Math.sin(u * 14);
  // SATELLITE : bus dore, deux ailes de panneaux solaires a cellules, antenne parabolique, mat, propulseurs, feux clignotants. On peut le TOUCHER : il explose en gerbe de pieces (jamais mortel).
  let solarTex = null;
  const solarTexture = () => { if (solarTex) return solarTex; const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#16305e'; x.fillRect(0, 0, 128, 64); x.strokeStyle = '#4f7fc4'; x.lineWidth = 1.5; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16, 64); x.stroke(); } for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * 16); x.lineTo(128, j * 16); x.stroke(); } x.fillStyle = 'rgba(160,200,255,0.18)'; x.fillRect(0, 0, 128, 10); solarTex = new T3.CanvasTexture(c); return solarTex; };
  const satModel = () => {
    const g = new T3.Group(), gold = lam('#c9a24a'), foil = lam('#8a6a2a'), grey = lam('#aab4c0'), dark = lam('#2a313a'), panel = new T3.MeshLambertMaterial({ map: solarTexture() }), white = lam('#e8edf2');
    mb(g, 8, 7, 12, gold, 0, 0, 0); mb(g, 8.4, 1.2, 12.4, foil, 0, 2.2, 0); mb(g, 8.4, 1.2, 12.4, foil, 0, -2.2, 0); mb(g, 5, 5, 5, grey, 0, 0, 8.4); mb(g, 6.4, 0.6, 0.6, dark, 0, 3.8, -4);
    for (const sx of [-1, 1]) { mb(g, 7, 0.6, 0.6, dark, sx * 7.6, 0, 0); for (let k = 0; k < 3; k++) { const p = mb(g, 8.6, 0.35, 10, panel, sx * (12.6 + k * 8.9), 0, 0); p.userData.p = 1; mb(g, 0.4, 0.5, 10.4, white, sx * (8.2 + k * 8.9), 0, 0); } }
    const dish = new T3.Mesh(new T3.SphereGeometry(3.4, 14, 8, 0, 6.283, 0, 1.2), grey); dish.position.set(0, 5.4, -3); dish.rotation.x = -0.9; g.add(dish); mb(g, 0.3, 3, 0.3, dark, 0, 3.6, -3);
    for (const sx of [-1, 1]) { const th = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.8, 1.4, 8), dark); th.position.set(sx * 2.6, -1, 6.6); th.rotation.x = Math.PI / 2; g.add(th); mb(g, 0.2, 5, 0.2, dark, sx * 3.4, 4.8, 3); }
    const l1 = new T3.Mesh(new T3.SphereGeometry(0.55, 8, 6), new T3.MeshBasicMaterial({ color: '#ff3a3a' })), l2 = new T3.Mesh(new T3.SphereGeometry(0.55, 8, 6), new T3.MeshBasicMaterial({ color: '#4aff7a' })); l1.position.set(-4.2, 0, -5.8); l2.position.set(4.2, 0, -5.8); g.add(l1); g.add(l2); g.userData.lights = [l1, l2];
    return g;
  };
  const satellite = (S, dc, lx, yw, i) => {
    const g = new T3.Group(), m = satModel(); m.scale.setScalar(2.4); g.add(m); const col = EVO.colBox(g, 62, 18, 32, 0, 0, 0); let alive = true;
    EVO.placeGroup(S, g, dc, lx, yrel(S, dc, yw), 0); S.glow(dc, lx, yrel(S, dc, yw), '#cfe0ff', 34);
    EVO.addDyn(g, (t) => { if (!alive) return; m.rotation.z = Math.sin(t * 0.3 + i) * 0.35; m.rotation.x = Math.sin(t * 0.21 + i * 2) * 0.2; const on = (Math.floor(t * 1.6 + i) % 2) === 0; m.userData.lights[0].visible = on; m.userData.lights[1].visible = !on; }, [col],
      { near: 600, hit: (g2) => { if (!alive) return true; alive = false; g.visible = false; const p = g.getWorldPosition(new V()), fx = g2.effects; fx.explosion(p.clone(), null, true, 'orange'); fx.ring(p.clone(), new V(0, 1, 0), 6, 60, 0.7, '#ffd060', 0.8); g2.audio.play('boom', p); g2.audio.play('target', p); if (EVO.coinBurst) EVO.coinBurst(g2, p, 22); g2.rig.shake = Math.max(g2.rig.shake, 0.7); g2.flash = Math.max(g2.flash || 0, 0.18); g2.flashColor = '#ffe9b0'; return true; } });
  };
  const laserWheel = (S, dc, yw, i) => {   // roue de lasers : deux bras opposes qui tournent autour de l'axe ; le centre (rayon < 12 m) est libre
    const g = new T3.Group(), cols = [], m = basic('#ff3a3a', { transparent: true, opacity: 0.9 });
    for (const s of [-1, 1]) { mb(g, 2.6, 54, 2.6, m, 0, s * 43, 0); mb(g, 6, 54, 6, basic('#ff3a3a', { transparent: true, opacity: 0.25, depthWrite: false }), 0, s * 43, 0); cols.push(EVO.colBox(g, 3, 54, 3, 0, s * 43, 0)); }
    mb(g, 9, 9, 9, lam('#2a313a'), 0, 0, 0); EVO.placeGroup(S, g, dc, S.lane(dc).lx, yrel(S, dc, yw), 0); S.glow(dc, S.lane(dc).lx, yrel(S, dc, yw), '#ff3a3a', 90);
    EVO.addDyn(g, (t) => { g.rotation.z = t * (0.9 + i * 0.12) * (i % 2 ? 1 : -1) + i; }, cols, { near: 600 });
  };
  SC.orbite = { len: [LO, LO], noDoor: true, noChaos: true, gw: 125, grass: false, turns: [[0.1, 0.3, 18], [0.3, 0.55, -26], [0.62, 0.9, 12]],
    sub: [{ u: 0, key: 'orbite', name: "L'ORBITE" }, { u: 0.6, key: 'aegis', name: 'AEGIS' }],
    pin: wpin((d, sc) => LNO((d - sc.d0) / (sc.d1 - sc.d0))), ground: (d, lx, c) => { c.set('#101830'); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      // une alternance lisible, tres espacee : satellite, roue de lasers, satellite, roue de lasers, puis un grand vide avant AEGIS (u = 0.66)
      for (const [u, k] of [[0.10, 0], [0.32, 1]]) { const dc = d(u); S.item(dc, (r) => satellite(S, dc, (k % 2 ? 1 : -1) * r.between([8, 22]), LNO(u) + r.between([-6, 6]), k)); }
      for (const [u, k] of [[0.21, 0], [0.43, 1]]) { const dc = d(u); S.item(dc, () => laserWheel(S, dc, LNO(u), k)); }
    } };
  // l'arrivee : un tronçon vide dans l'espace, pour ne jamais retomber sur le sol apres la derniere scene
  SC.fin = { len: [260, 260], noDoor: true, noChaos: true, gw: 125, grass: false, sub: [{ u: 0, key: 'fin', name: 'FIN' }], pin: wpin((d, sc) => LNO(1)), ground: (d, lx, c) => { c.set('#101830'); }, build() {} };
  // la Terre, tres loin sous nous, des la stratosphere ; elle suit la fusee (aucune parallaxe) et reste a une altitude fixe
  let planet = null, earthTex = null;
  const earthTexture = () => {
    if (earthTex) return earthTex; const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'); let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#1a4a94'); gr.addColorStop(0.5, '#2a72c4'); gr.addColorStop(1, '#1a4a94'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 11; i++) { const cx = rnd() * 1024, cy = 110 + rnd() * 290, rx = 20 + rnd() * 50, ry = 14 + rnd() * 30; x.fillStyle = rnd() < 0.7 ? '#4a8a52' : '#a8935a'; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(cx + (rnd() - 0.5) * rx, cy + (rnd() - 0.5) * ry, rx * (0.4 + rnd() * 0.6), ry * (0.4 + rnd() * 0.6), rnd() * 3, 0, 6.283); x.fill(); } }
    x.fillStyle = 'rgba(255,255,255,0.92)'; x.fillRect(0, 0, 1024, 26); x.fillRect(0, 486, 1024, 26);
    for (let i = 0; i < 110; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.22 + rnd() * 0.4) + ')'; x.beginPath(); x.ellipse(rnd() * 1024, 24 + rnd() * 464, 18 + rnd() * 70, 5 + rnd() * 14, 0, 0, 6.283); x.fill(); }
    earthTex = new T3.CanvasTexture(c); earthTex.wrapS = T3.RepeatWrapping; return earthTex;
  };
  const _tp = EVO.frame;
  EVO.frame = (g, dt) => {
    _tp(g, dt);
    if (EVO.seaLevel === undefined || !g.scene || !g.rocket) { if (planet) planet.visible = false; EVO.noHorizon = false; return; }
    const a = EVO.s2d0('strato'), run = g.endlessRun; if (a === undefined || !run) return;
    const on = g.state === 'FLIGHT' && run.dist > a + 0.3 * LS2 && !g.cine3d;
    if (!planet) { planet = new T3.Group(); const m = new T3.Mesh(new T3.SphereGeometry(3000, 64, 40), new T3.MeshBasicMaterial({ map: earthTexture(), fog: false })); planet.add(m); const atm = new T3.Mesh(new T3.SphereGeometry(3070, 48, 30), new T3.MeshBasicMaterial({ color: '#7fc4ff', transparent: true, opacity: 0.28, side: T3.BackSide, fog: false, depthWrite: false, blending: T3.AdditiveBlending })); planet.add(atm); planet.userData.m = m; g.scene.add(planet); }
    EVO.noHorizon = !!on; planet.visible = !!on; if (!on) return;
    const rk = g.rocket;   // la surface reste ~380 m sous la fusee (horizon courbe bien visible) ; elle tourne avec la distance : c'est elle qui donne la sensation de vitesse
    { const kk = U.clamp((run.dist - (a + 0.3 * LS2)) / (0.4 * LS2), 0, 1); planet.position.set(rk.pos.x, Math.min(rk.pos.y, 900) - 380 - 3000 - (1 - kk) * 2600, rk.pos.z); } planet.userData.m.rotation.set(Math.PI / 2, 0, run.dist * 0.00045);   // le pole est sur le cote : sous la fusee on voit oceans et continents
    if (g.camera.far < 4200) { g.camera.far = 4200; g.camera.updateProjectionMatrix(); }
  };
  EVO.addMood('strat', { top: '#0a2a6a', hor: '#8ab8e8', fog: '#a8c8ec', near: 220, far: 1000, hemiS: '#e4eeff', hemiG: '#6a8ab0', hemiI: 1.0, amb: 0.22, sunC: '#fff4dc', sunI: 1.0, night: 0.2 });
  EVO.addMood('space', { top: '#01020a', hor: '#0a1230', fog: '#04061a', near: 500, far: 1600, hemiS: '#a0b4ff', hemiG: '#10183a', hemiI: 0.75, amb: 0.22, sunC: '#ffffff', sunI: 1.15, night: 1 });
  EVO.SCENE_MOOD.behemoth = 'sea'; EVO.SCENE_AUDIO.behemoth = 'evoBoss'; EVO.SCENE_MOOD.strato = 'strat'; EVO.SCENE_AUDIO.strato = 'evoDay'; EVO.SCENE_MOOD.orbite = 'space'; EVO.SCENE_AUDIO.orbite = 'evoBoss';
  // les sous-chapitres prennent l'ambiance de leur scene (sinon ils retombent sur le jour clair)
  { const MOODS = { cote: ['day', 'evoDusk', ['conduit']], bassin: ['sea', 'evoMine', ['fourche', 'sas']], fosse: ['sea', 'evoMine', ['mines', 'falaise', 'conduit2']], volcan: ['magma', 'evoSiege', ['chambre', 'puits', 'cratere']], eruption: ['stormEnd', 'evoSiege', ['ciel', 'plongee']], behemoth: ['sea', 'evoBoss', []], strato: ['strat', 'evoDay', ['orbite0']], orbite: ['space', 'evoBoss', ['aegis']], fin: ['space', 'evoBoss', []] };
    for (const k of Object.keys(MOODS)) { const [m, au, subs] = MOODS[k]; for (const q of [k].concat(subs)) { EVO.SCENE_MOOD[q] = m; EVO.SCENE_AUDIO[q] = au; } } }
  EVO.s2d0 = (key) => { let d = 0; for (const k of (EVO.SCENES2 || [])) { if (k === key) return d; d += SC[k].len[0]; } return undefined; };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (EVO.seaLevel === undefined || !g.endlessRun) return;
    const a = EVO.s2d0('volcan'), b = a === undefined ? undefined : a + LV, dist = g.endlessRun.dist;
    const st = EVO.s2d0('strato');
    EVO.seaLevel = (a !== undefined && dist > a - 20 && dist < a + 0.8 * LV) || (st !== undefined && dist > st + 0.7 * LS2) ? -9999 : 0;   // dans le puits de lave on est a l'air libre, meme sous le niveau de la mer
  };
})();
