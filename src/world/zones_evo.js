/* v121 : ZONE « CAMPAGNE » du mode évolution (?evo=1) — de grands espaces ouverts au lieu d'un couloir : collines rondes à l'horizon, prairie, camp militaire,
 * rivière et pont, forêt, route, puis des morceaux d'autres zones (canyon, barrage, souterrain, base de lancement, base aérienne) habillés ici.
 * Les ennemis sont posés à la main dans chaque scène (rares, espacés, chacun avec sa mécanique) : voir foe(). */
(function () {
  const U = CC.U, Z = CC.Zones, K = Z.kit, DEG = 180 / Math.PI;
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  Z.PROFILE.campagne = { elev: 0, vol: 120, y: [8, 90], amp: 1.25 };
  CC.Gen.Envs.add('campagneDay', { label: 'CAMPAGNE', dark: 0, vis: 1, skyline: '#d3dde2', make: (r) => ({
    sky: { top: '#6c9ccc', horizon: '#e2eaef', bottom: '#c4d2da', sunColor: '#fff2d8', sunSize: 380 },
    fog: { color: '#cfdbe0', near: 240, far: r.between([1000, 1150]) },
    hemi: { sky: '#d8e4f0', ground: '#6a7a58', intensity: 0.74 }, ambient: { color: '#ffffff', intensity: 0.16 },
    sun: { color: '#fff0d6', intensity: 0.8, dir: [0.35, 0.8, 0.5] },
    postfx: { vignette: 0.2, vignetteColor: '#2c3a4c', halftone: 0, lift: '#080c12', saturation: 0.88, bloomThreshold: 0.98, bloomStrength: 0.07 },
  }) });
  Z.meta.campagne = { label: 'CAMPAGNE', envs: ['campagneDay'], ground: 'col:#7d975f', groundTint: undefined,
    wall: () => ({ mat: { side: 'rock', top: 'grass' }, tint: '#8a9a6a' }), obstacle: 'rock', obstacleTint: '#8a9a6a' };
  const GREENS = ['#6d8a58', '#668352', '#759060', '#5c7a4a', '#7d9566'];
  const TR = CC.Trees;

  // ---------- ennemis posés à la main ----------
  // type, distance, décalage latéral, hauteur ; opts : { hp (blindé : PV affichés), armed, path, patrol, yaw, name }
  // un ennemi ne doit JAMAIS etre dans un decor (falaise, colline, arbre, mur) : on cherche l'emplacement libre le plus proche, du cote de la trajectoire
  const _P = new THREE.Vector3(), _D0 = new THREE.Vector3(), _tmp = { t: 0, normal: new THREE.Vector3(), inside: false, pen: 0 };
  function blocked(S, x, y, z, R) {
    const w = S.b.world; if (!w || !w.candidates) return false;
    const cs = w.candidates(x - R, z - R, x + R, z + R); _P.set(x, y, z);
    for (let i = 0; i < cs.length; i++) { const bx = cs[i]; if (bx.ground || bx.kind === 'target' || bx.max.y < y - R * 0.5 || bx.min.y > y + R) continue; if (w.constructor.segBox(bx, _P, _D0, R, _tmp)) return true; }
    return false;
  }
  function freeAt(S, type, dc, lx, y, R, o) {
    const yy = y + (CC.Roster.isAir(type) ? 0 : R * 0.55), pts = [S.at(dc, lx, yy)];
    if (o.path) for (let k = 1; k <= 5; k++) pts.push(S.at(dc + o.path * k / 5, lx, yy));
    if (o.patrol) for (const q of o.patrol(S, dc, lx, y)) pts.push(q);
    for (const p of pts) if (blocked(S, p[0], p[1], p[2], R)) return false;
    return true;
  }
  function foe(S, type, dc, lx, y, o) {
    o = o || {};
    if (location.search.indexOf('notgt') >= 0) return;
    S.item(dc, () => {
      const RO = CC.Roster, R = Math.max(5, (RO.RAD && RO.RAD[type]) || 6) + 1.2, Lc = S.lane(dc).lx, toward = lx > Lc ? -1 : 1, vmax = S.vol(dc) - 8;
      let ok = freeAt(S, type, dc, lx, y || 0, R, o);
      if (!ok) search: for (const rho of [4, 8, 13, 19, 27, 37, 50, 66]) for (const [ddc, dlx] of [[0, toward * rho], [0, -toward * rho], [rho * 0.7, toward * rho * 0.5], [-rho * 0.7, toward * rho * 0.5], [rho * 0.7, 0], [-rho * 0.7, 0]]) {
        const nl = lx + dlx, nd = dc + ddc; if (Math.abs(nl - Lc) > vmax || !S.inClip(nd)) continue;
        if (freeAt(S, type, nd, nl, y || 0, R, o)) { (window.__evoMoved = window.__evoMoved || []).push([type, Math.round(dc), Math.round(lx), '>', Math.round(nd), Math.round(nl)]); dc = nd; lx = nl; ok = true; break search; }
      }
      if (!ok) { (window.__evoSkipped = window.__evoSkipped || []).push([type, Math.round(dc)]); return; }   // aucun emplacement libre : pas d'ennemi invisible
      const L = S.lane(dc), p = S.at(dc, lx, y || 0);
      const ex = { unarmed: !o.armed, evoHp: o.hp, evoName: o.name || type, evoVal: o.val };
      if (o.patrol) ex.patrol = o.patrol(S, dc, lx, y || 0), ex.patrolSpeed = o.speed || 9, ex.patrolPhase = o.phase || 0;
      if (o.path) { const L2 = o.path; ex.path = [S.at(dc, lx, y || 0), S.at(dc + L2, lx, y || 0)]; ex.fleeSpeed = o.speed || 16; }
      S.b.target(type, p, S.yaw(dc) + (type === 'truck' ? 90 : 0) + RO.face(type) + (o.yaw || 0), RO.opts(type, ex));
      S.gate(dc - 30, L.lx, Math.max(L.y * 0.8, 8)); S.gate(dc - 12, lx, Math.max(4, (y || 0) + 3)); S.gate(dc, lx, Math.max(3, (y || 0) + 1.5)); S.gate(dc + 26, S.lane(dc + 26).lx, S.lane(dc + 26).y);
    });
  }
  Z.evoFoe = foe;

  // ---------- décor ----------
  function pineT(S, dc, lx, r, sc) { const p = S.at(dc, lx, 0); TR.conifer(S.b, p[0], p[1], p[2], r.between([14, 26]) * (sc || 1), r, {}); }
  function oakT(S, dc, lx, r, sc) { const p = S.at(dc, lx, 0); TR.broadleaf(S.b, p[0], p[1], p[2], r.between([9, 18]) * (sc || 1), r, {}); }
  function knoll(S, dc, lx, rad, h, col) { S.ball(dc, lx, h - rad * 0.0 - rad * 0.0 - 0, rad, 'col:' + col, undefined, false, h / rad); }
  function farmhouse(S, dc, lx, r) {
    S.place(dc, lx, 16, 16, 0, 12, () => {
      const c = pick(r, ['#e8dcc0', '#d8c8a0', '#e0d0b0']), roof = pick(r, ['#a8452c', '#8a3a2a', '#b8603a']);
      S.bx(dc, lx, 2.6, 9, 5.2, 12, 'col:' + c, undefined, true); S.bx(dc, lx, 6.3, 9.6, 1.4, 12.6, 'col:' + roof, undefined, false); S.bx(dc, lx, 7.7, 5.2, 1.6, 12.4, 'col:' + roof, undefined, false);
      S.bx(dc, lx + 8, 2.2, 6, 4.4, 8, 'col:#8a6a48', undefined, true); S.bx(dc, lx + 8, 5, 6.4, 1, 8.4, 'col:#5a4a38', undefined, false);
      S.cyl(dc, lx - 10, 0, 1.8, 9, 'col:#c8c8c0', undefined, 10, 1.8, false);   // silo
    });
  }
  function windmill(S, dc, lx, r) {
    S.place(dc, lx, 10, 10, 0, 40, () => { const hub = 26; S.cyl(dc, lx, 0, 2.2, hub, 'col:#e8e4dc', undefined, 8, 1.2, false);
      const a0 = r() * 6.28; for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; S.bxr(dc, lx + Math.sin(a) * 8, hub + Math.cos(a) * 8, 1.2, 15, 0.4, 'col:#f4f0e8', undefined, -a * DEG, 0, false); } });
  }
  function pylonLine(S, dc, lx) { S.place(dc, lx, 8, 4, 0, 32, () => { S.bx(dc, lx, 14, 1.2, 28, 1.2, 'metal', '#8a8e96', false); S.bx(dc, lx, 24, 14, 0.6, 0.6, 'metal', '#8a8e96', false); S.bx(dc, lx, 20, 10, 0.6, 0.6, 'metal', '#8a8e96', false); }); }
  function haystack(S, dc, lx, r) { S.place(dc, lx, 8, 8, 0, 4, () => { S.cyl(dc, lx, 0, 2.4, 3.4, 'col:' + pick(r, ['#d8b860', '#c8a850']), undefined, 10, 2.4, false); }); }

  // ---------- sol lisse : une vraie surface continue (normales calculees sur le terrain, pas de tranches) avec un degrade de verts et de champs ----------
  const GC = { a: new THREE.Color('#5f9a3a'), b: new THREE.Color('#8cc24e'), f: new THREE.Color('#b0ac5e'), c: new THREE.Color(), g: new THREE.Color('#77797a') };
  const gcol = (x, z, out) => {
    const n = 0.5 + 0.5 * (Math.sin(x * 0.011 + z * 0.017) * 0.5 + Math.sin(x * 0.027 - z * 0.013 + 1.3) * 0.3 + Math.sin(x * 0.05 + z * 0.043) * 0.2);
    out.copy(GC.a).lerp(GC.b, n);
    const f = Math.sin(x * 0.021 + 0.7) * Math.sin(z * 0.019 + 2.1); if (f > 0.35) out.lerp(GC.f, Math.min(0.75, (f - 0.35) * 2));
    return out;
  };
  const _v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _Q = new THREE.Quaternion(), _O = new THREE.Vector3();
  Z.evoGroundMesh = function (ctx, d, e) {
    const T = ctx.T, b = ctx.b, m = (d + e) / 2, sloped = T.rel(d) !== 0 || T.rel(e) !== 0 || T.rel(m) !== 0, rows = sloped ? Math.max(1, Math.round((e - d) / 5)) : 1;
    // colonnes : la zone de jeu suit le virage (T.at) ; au-delà, le sol part en LIGNE DROITE le long de la normale (jamais de pli dans un virage serré)
    const V0 = T.vol(m) + 60, cols = [{ x: -330, o: -1 }, { x: -130, o: -1 }]; for (let x = -V0; x <= V0 + 0.1; x += 15) cols.push({ x, o: 0 }); cols.push({ x: 130, o: 1 }, { x: 330, o: 1 });
    const pl = Z.plan(T, T.zoneIndex(m)), sc = pl.scenes.find((q) => m >= q.d0 && m < q.d1), sd = sc && campagne.scenes[sc.name], gf = sd && sd.ground, wet = sd && sd.wet;
    const nC = cols.length, pos = [], nor = [], col = [], uv = [], idx = [], c = GC.c, grey = GC.g;
    for (let r = 0; r <= rows; r++) {
      const dd = d + (e - d) * r / rows, pa = T.at(dd - 1.5, 0, 0), pb = T.at(dd + 1.5, 0, 0), qa = T.at(dd, -1.5, 0), qb = T.at(dd, 1.5, 0), eL = T.at(dd, -V0, 0), eR = T.at(dd, V0, 0);
      _v[0].set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]); _v[1].set(qb[0] - qa[0], qb[1] - qa[1], qb[2] - qa[2]); _v[2].crossVectors(_v[1], _v[0]).normalize(); if (_v[2].y < 0) _v[2].negate();
      const lx_ = qb[0] - qa[0], lz_ = qb[2] - qa[2], ll = Math.hypot(lx_, lz_) || 1, ux = lx_ / ll, uz = lz_ / ll;
      for (let k = 0; k < nC; k++) {
        const cc = cols[k]; let p;
        if (cc.o === 0) p = T.at(dd, cc.x, 0); else { const ed = cc.o < 0 ? eL : eR, off = Math.abs(cc.x) * cc.o; p = [ed[0] + ux * off, ed[1], ed[2] + uz * off]; }
        pos.push(p[0], p[1], p[2]); nor.push(_v[2].x, _v[2].y, _v[2].z); uv.push(p[0], p[2]);
        gcol(p[0], p[2], c); if (gf) gf(dd, cc.x, c, sc); if (wet && cc.o === 0 && wet(dd, cc.x, sc, T)) c.lerp(grey, 0.9);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let r = 0; r < rows; r++) for (let k = 0; k < nC - 1; k++) { const a = r * nC + k, bq = a + 1, cq = a + nC, dq = cq + 1; idx.push(a, cq, bq, bq, cq, dq); }
    { const kc = Math.floor(nC / 2), A_ = new THREE.Vector3(pos[3 * kc], pos[3 * kc + 1], pos[3 * kc + 2]), B = new THREE.Vector3(pos[3 * (kc + nC)], pos[3 * (kc + nC) + 1], pos[3 * (kc + nC) + 2]), Cc = new THREE.Vector3(pos[3 * (kc + 1)], pos[3 * (kc + 1) + 1], pos[3 * (kc + 1) + 2]); if (B.sub(A_).cross(Cc.sub(A_)).y < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    b.batch('evoGrass').shadow = false; b.addGeometry(g, _O, _Q, null, 'evoGrass', undefined, [1 / 7, 1 / 7]); g.dispose();
    if (!gf) grassTufts(ctx, d, e, wet, sd, sc);
  };
  // touffes d'herbe : une seule couleur, un peu plus sombre que le sol, assez grosses pour se lire de loin ; jamais dans l'eau
  const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const GTC = new THREE.Color('#3f7a26');
  function grassTufts(ctx, d, e, wet, sd, sc) {
    const T = ctx.T, b = ctx.b, n = Math.max(1, Math.round((e - d) * 0.35)), pos = [], nor = [], col = [];
    for (let i = 0; i < n; i++) {
      const dd = d + (e - d) * hsh(d + i * 0.37, i), lx = (hsh(i * 1.7, d * 0.13) * 2 - 1) * 46; if (wet && wet(dd, lx, sc, T)) continue;
      const h = 1.5 + hsh(i, d * 0.7) * 1.4, p = T.at(dd, lx, 0), a0 = hsh(d, i * 3.3) * 6.28, px = p[0], py = p[1] - 0.04, pz = p[2];
      for (let j = 0; j < 9; j++) {
        const a = a0 + j * 0.698 + hsh(j, i) * 0.3, ca = Math.cos(a), sa = Math.sin(a), r0 = 0.1 + 0.18 * hsh(j * 3.1, i + d), bx = px + ca * r0, bz = pz + sa * r0, lean = 0.4 + 0.6 * hsh(j + i, d), hh = h * (0.6 + 0.4 * hsh(j * 5.1, i + d)), tx = bx + ca * lean, tz = bz + sa * lean, w = 0.16;
        pos.push(bx - sa * w, py, bz + ca * w, bx + sa * w, py, bz - ca * w, tx, py + hh, tz);
        for (let k = 0; k < 3; k++) { nor.push(0, 1, 0); col.push(GTC.r, GTC.g, GTC.b); }
      }
    }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    b.batch('tree:#fefefe').shadow = false; b.addGeometry(g, _O, _Q, null, 'tree:#fefefe'); g.dispose();
  }

  const campagne = { signature: 'rampe', scenes: {}, dress(S) {

    // collines rondes à l'horizon, des deux côtés (ellipsoïdes aplaties : un vrai relief doux, pas des boîtes)
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 42, 0.7, (dc) => S.item(dc, (r) => { const v = S.vol(dc), rad = r.between([60, 190]), lx = s * (v + 14 + rad + r.between([0, 90])), sy = r.between([0.2, 0.42]); S.ball(dc, lx, -rad * sy * 0.12, rad, 'col:' + pick(r, GREENS), undefined, Math.abs(lx) < 150, sy); }));
    // petits blocs de pierre posés dans l'herbe : des reliefs à frôler
    S.rows(S.d0, S.d1, 24, 0.85, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + (r() < 0.5 ? -1 : 1) * r.between([16, 62]), sz = r.between([1.6, 4.6]), p = S.at(dc, lx, 0); TR.rock(S.b, p[0], p[1], p[2], sz, r, {}); S.b.box({ p: [p[0], p[1] + sz * 0.5, p[2]], s: [sz * 1.6, sz * 1.1, sz * 1.6], render: false }); }));
    // bosquets et arbres épars
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 22, 0.9, (dc) => S.item(dc, (r) => { const lx = s * (S.vol(dc) - r.between([2, 70])); (r() < 0.5 ? oakT : pineT)(S, dc, lx, r); }));
    // fermes, moulins, lignes électriques au loin
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 130, 0.6, (dc) => S.item(dc, (r) => { const lx = s * r.between([55, S.vol(dc) - 10]), k = r(); (k < 0.4 ? farmhouse : k < 0.65 ? windmill : k < 0.85 ? haystack : (S2, d2, l2) => pylonLine(S2, d2, l2))(S, dc, lx, r); }));
  } };
  Z.defs.campagne = campagne;

  // ===== RAMPE : la colline de départ, le tout premier ennemi juste devant
  campagne.scenes.rampe = { len: [170, 170], noDoor: true, noChaos: true, build(S) {
    foe(S, 'tank', S.d0 + 20, 0, 0, { name: 'CHAR', val: 140 });
    for (const s of [-1, 1]) S.item(S.d0 + 60, (r) => { sandbagsRow(S, S.d0 + 60, s * 26, r); });
    S.item(S.d0 + 20, () => { for (const s of [-1, 1]) S.bx(S.d0 + 20, s * 9, 0.06, 0.9, 0.1, 40, 'col:#e8e8dc', undefined, false, { shadow: false }); });   // marquage au sol
  } };
  function sandbagsRow(S, dc, lx, r) { S.place(dc, lx, 12, 4, 0, 2, () => { for (let i = 0; i < 4; i++) S.bx(dc, lx - 4 + i * 2.7, 0.6, 2.6, 1.2, 1.6, 'sand', '#c8b078'); }); }

  // ===== CAMP : un camp militaire dans la prairie
  campagne.scenes.camp = { len: [300, 300], noDoor: true, noChaos: true, turns: [[0.12, 0.88, 38]], build(S) {
    const kit = [K.tent, K.truckBlock, K.container, K.crates, K.drums, K.mast, K.sandbags];
    for (let i = 0; i < 14; i++) { const dc = S.d0 + 14 + S.sr() * (S.len - 28), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([22, S.vol(dc) - 20]); S.item(dc, (r) => pick(r, kit)(S, dc, lx, r)); }
    S.item(S.d0 + 120, (r) => K.hangar(S, S.d0 + 120, -46, r));
    S.item(S.d0 + 210, (r) => K.radome(S, S.d0 + 210, 52));
    foe(S, 'truck', S.d0 + 90, 8, 0, { name: 'CAMION' });
    foe(S, 'jeep', S.d0 + 205, -14, 0, { name: 'JEEP' });
  } };

  // ===== RIVIERE : une rivière large, un pont, un ennemi caché dessous
  campagne.scenes.riviere = { len: [300, 300], noDoor: true, noChaos: true, build(S) {
    const dr = S.d0 + 150, v = S.vol(dr);
    S.item(dr, (r) => {
      S.bx(dr, 0, 0.14, 2 * (v + 90), 0.2, 44, 'water', '#4a9ad0', false, { shadow: false });                 // l'eau
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) S.bx(dr + (k - 2.5) * 8, s * (v + 20), 0.4, 2 * (v + 60), 0.9, 7, 'col:#6a8a4a', undefined, false, { shadow: false });
      S.bx(dr, 0, 7.4, 2 * (v + 26), 1.6, 16, 'concrete', '#c8c8c4', true);                                      // tablier
      S.bx(dr, 0, 8.6, 2 * (v + 26), 0.5, 0.5, 'metal', '#8a8e96', false); S.bx(dr + 7.6, 0, 8.4, 2 * (v + 26), 0.9, 0.4, 'metal', '#8a8e96', false); S.bx(dr - 7.6, 0, 8.4, 2 * (v + 26), 0.9, 0.4, 'metal', '#8a8e96', false);
      for (let k = -4; k <= 4; k++) { if (Math.abs(k * 24) > v + 20) continue; S.bx(dr, k * 24, 3.4, 4, 7, 12, 'concrete', '#b8b8b4', true); }                  // piles
      S.bx(dr, 0, 0.9, 2 * (v + 26), 1.2, 17, 'col:#4a4e54', undefined, false, { shadow: false });
    });
    foe(S, 'tank', dr, 10, 0, { name: 'CHAR CACHE', armed: false });
    foe(S, 'boat', S.d0 + 245, -20, 0, { name: 'VEDETTE', path: 60, speed: 8 });
    for (let i = 0; i < 12; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([30, S.vol(dc) - 8]); if (Math.abs(dc - dr) < 40) continue; S.item(dc, (r) => (r() < 0.5 ? oakT : pineT)(S, dc, lx, r)); }
  } };

  // ===== FORET : une forêt dense avec une clairière et un lance-missiles sur la colline
  campagne.scenes.foret = { len: [300, 300], noDoor: true, noChaos: true,
    relief(T, sc, r) { const A = 22, L = sc.d1 - sc.d0; return { fn: (d) => A * Math.pow(Math.sin(Math.PI * U.clamp((d - sc.d0) / L, 0, 1)), 2), max: A }; },
    build(S) {
      for (let i = 0; i < 90; i++) { const dc = S.d0 + 6 + S.sr() * (S.len - 12), lx = (S.sr() < 0.5 ? -1 : 1) * S.sr.between([14, S.vol(dc) - 4]); if (Math.abs(dc - (S.d0 + 150)) < 34 && Math.abs(lx) < 50) continue; S.item(dc, (r) => pineT(S, dc, lx, r, r.between([1, 1.9]))); }
      foe(S, 'sam', S.d0 + 150, -26, 0, { name: 'LANCE-MISSILES', armed: true });
      foe(S, 'heli', S.d0 + 255, 0, 26, { name: 'HELICO', patrol: (SS, dc, lx, y) => [SS.at(dc, -36, y), SS.at(dc + 18, 0, y + 6), SS.at(dc, 36, y), SS.at(dc - 18, 0, y + 6)], speed: 11 });
    } };

  // ===== ROUTE : une autoroute, un échangeur, un convoi qui file devant
  campagne.scenes.route = { len: [360, 360], noDoor: true, noChaos: true, build(S) {
    const v = S.vol(S.mid);
    S.item(S.d0, () => { for (let dc = S.d0; dc < S.d1; dc += 40) { S.bx(dc + 20, 0, 0.05, 30, 0.1, 40.2, 'col:#44484e', undefined, false, { shadow: false }); S.bx(dc + 20, 0, 0.12, 0.6, 0.06, 18, 'col:#e8e8dc', undefined, false, { shadow: false }); for (const s of [-1, 1]) S.bx(dc + 20, s * 14.4, 0.12, 0.5, 0.06, 40, 'col:#e8e8dc', undefined, false, { shadow: false }); } });
    const dc0 = S.d0 + 190;
    S.item(dc0, () => { S.bx(dc0, 0, 9, 2 * (v + 20), 1.8, 20, 'concrete', '#c0c0bc', true); for (const k of [-2, -1, 0, 1, 2]) S.bx(dc0, k * 36, 4.4, 4.4, 9, 10, 'concrete', '#b0b0ac', true); S.bx(dc0, 0, 10.4, 2 * (v + 20), 0.9, 0.5, 'metal', '#8a8e96', false); });
    for (let i = 0; i < 4; i++) { const dc = S.d0 + 40 + i * 8; foe(S, 'truck', dc, -10 + (i % 2) * 20, 0, { name: 'CONVOI', path: 150, speed: 15 + i }); }
    foe(S, 'tank', S.d0 + 320, 0, 0, { name: 'BLINDE', hp: 2, armed: false });
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 36, 0.4, (dc) => S.item(dc, () => { S.cyl(dc, s * 17, 0, 0.2, 9, 'metal', '#8a8e96', 6, 0.2, false); S.bx(dc, s * 15.6, 9, 3, 0.4, 0.4, 'metal', '#8a8e96', false); }));
  } };

  // ---------- scènes empruntées aux autres zones, habillées par leur zone d'origine ----------
  const borrow = (name, zone, src, o) => {
    const def = Z.defs[zone], sc = def && def.scenes[src]; if (!sc) return;
    campagne.scenes[name] = Object.assign({}, sc, { noDoor: true, noChaos: true, build(S) { if (def.dress && !(o && o.noDress)) def.dress(S); sc.build.call(this, S); if (o && o.foes) o.foes(S); } });
  };
  Z.evoBorrow = borrow;
  // les ennemis des scènes empruntées sont ajoutés dans levelmode d'évolution (evo.js), par nom
  Z.evoFoeLib = { foe };
})();
