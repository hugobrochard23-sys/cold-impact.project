/* v121 : ZONE « CAMPAGNE » du mode évolution (?evo=1) — de grands espaces ouverts au lieu d'un couloir : collines rondes à l'horizon, prairie, camp militaire,
 * rivière et pont, forêt, route, puis des morceaux d'autres zones (canyon, barrage, souterrain, base de lancement, base aérienne) habillés ici.
 * Les ennemis sont posés à la main dans chaque scène (rares, espacés, chacun avec sa mécanique) : voir foe(). */
(function () {
  const U = CC.U, Z = CC.Zones, K = Z.kit, DEG = 180 / Math.PI;
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  Z.PROFILE.campagne = { elev: 0, vol: 120, y: [8, 90], amp: 1.25 };
  CC.Gen.Envs.add('campagneDay', { label: 'CAMPAGNE', dark: 0, vis: 1, skyline: '#d3dde2', make: (r) => ({
    sky: { top: '#6c9ccc', horizon: '#e2eaef', bottom: '#c4d2da', sunColor: '#fff2d8', sunSize: 380 },
    fog: { color: '#cfdbe0', near: 150, far: r.between([620, 720]) },
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
    if (!o.keep && dc < 620 && hsh(dc, 3.3) < 0.5) return;   // v171 : deux fois moins d'ennemis au debut
    { const prog = U.clamp(dc / Math.max(1000, S.T.levelLen || 5000), 0, 1); if (o.hp) o = Object.assign({}, o, { hp: o.hp + Math.floor(prog * 2.4) }); if (!o.keep && prog > 0.4 && hsh(dc, 7.7) < (prog - 0.4) * 0.8) return; }   // v140 : plus loin, les ennemis blindés ont plus de PV et sont plus espacés
    S.item(dc, () => {
      const RO = CC.Roster, R = Math.max(5, (RO.RAD && RO.RAD[type]) || 6) + 1.2, Lc = S.lane(dc).lx, toward = lx > Lc ? -1 : 1, vmax = S.vol(dc) - 8;
      let ok = o.fixed || freeAt(S, type, dc, lx, y || 0, R, o);
      if (!ok) search: for (const rho of [4, 8, 13, 19, 27, 37, 50, 66]) for (const [ddc, dlx] of [[0, toward * rho], [0, -toward * rho], [rho * 0.7, toward * rho * 0.5], [-rho * 0.7, toward * rho * 0.5], [rho * 0.7, 0], [-rho * 0.7, 0]]) {
        const nl = lx + dlx, nd = dc + ddc; if (Math.abs(nl - Lc) > vmax || !S.inClip(nd)) continue;
        if (freeAt(S, type, nd, nl, y || 0, R, o)) { (window.__evoMoved = window.__evoMoved || []).push([type, Math.round(dc), Math.round(lx), '>', Math.round(nd), Math.round(nl)]); dc = nd; lx = nl; ok = true; break search; }
      }
      if (!ok) { (window.__evoSkipped = window.__evoSkipped || []).push([type, Math.round(dc)]); return; }   // aucun emplacement libre : pas d'ennemi invisible
      const L = S.lane(dc), p = S.at(dc, lx, y || 0);
      const ex = { unarmed: !o.armed, evoHp: o.hp, evoName: o.name || type, evoVal: o.val }; if (o.drift !== undefined) ex.drift = o.drift;
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
    // v152 : maison de ferme detaillee (toit a deux pans, cheminee, fenetres eclairees, porte, perron, cloture, grange, silo)
    S.place(dc, lx, 18, 18, 0, 14, () => {
      const c = pick(r, ['#d8cdb4', '#cfc0a0', '#d4c6aa', '#c9bba0']), roof = pick(r, ['#8a4a34', '#7a3e2c', '#9a5a3c']), trim = '#efe8d8', W = 9, Ln = 12, H0 = 5.2, R = 3.4, sl = Math.atan2(R, W / 2) / DEG;
      S.bx(dc, lx, 0.45, W + 1, 0.9, Ln + 1, 'col:#8a8478', undefined, true);                                   // soubassement de pierre
      S.bx(dc, lx, 0.9 + (H0 - 0.9) / 2, W, H0 - 0.9, Ln, 'col:' + c, undefined, true);
      for (const [dx, dy, dz] of [[-1, 1, 1], [1, 1, 1], [-1, 1, -1], [1, 1, -1]]) S.bx(dc + dx * (Ln / 2), lx + dz * (W / 2), H0 / 2, 0.5, H0, 0.5, 'col:' + trim, undefined, false);   // chainages d'angle
      // toit a deux pans + pignons
      for (const s of [-1, 1]) S.bxr(dc, lx + s * (W / 4 + 0.2), H0 + R / 2 + 0.1, Math.hypot(W / 2 + 0.9, R), 0.45, Ln + 1.6, 'col:' + roof, undefined, -s * sl, 0, false);
      for (let k = 0; k < 3; k++) for (const e of [-1, 1]) S.bx(dc + e * (Ln / 2 - 0.2), lx, H0 + 0.55 + k * 1.05, W - 1.6 - k * 2.6, 1.05, 0.5, 'col:' + c, undefined, false);
      S.bx(dc, lx, H0 + R + 0.35, 0.7, 0.5, Ln + 1.8, 'col:#5a3a2a', undefined, false);
      S.bx(dc + 3.2, lx + 2.2, H0 + R + 0.6, 1.6, 4.2, 1.6, 'col:#9a6a58', undefined, false); S.bx(dc + 3.2, lx + 2.2, H0 + R + 2.8, 2.0, 0.4, 2.0, 'col:#3a3028', undefined, false);   // cheminee
      // facade : porte, perron, fenetres eclairees avec volets
      S.bx(dc - Ln / 2 - 0.2, lx, 1.9, 0.4, 2.8, 1.5, 'col:#5a3a24', undefined, false); S.bx(dc - Ln / 2 - 1.2, lx, 0.2, 2, 0.4, 3.2, 'col:#8a8478', undefined, false); S.bx(dc - Ln / 2 - 0.1, lx, 3.5, 0.4, 0.3, 2.4, 'col:' + trim, undefined, false);
      for (const sd of [-1, 1]) for (const z of [-3.6, 3.6]) { S.bx(dc + z * 0.9, lx + sd * (W / 2 + 0.05), 3, 1.3, 1.5, 0.2, 'emis:#f0d890', undefined, false); S.bx(dc + z * 0.9, lx + sd * (W / 2 + 0.12), 3, 1.5, 1.7, 0.12, 'col:' + trim, undefined, false); S.bx(dc + z * 0.9 - 1.0, lx + sd * (W / 2 + 0.2), 3, 0.7, 1.7, 0.14, 'col:#4a6a4a', undefined, false); S.bx(dc + z * 0.9 + 1.0, lx + sd * (W / 2 + 0.2), 3, 0.7, 1.7, 0.14, 'col:#4a6a4a', undefined, false); }
      S.glow(dc - Ln / 2 - 1, lx, 3.2, '#ffd890', 10);
      // grange attenante, silo, cloture
      S.bx(dc + 3, lx + 10, 2.4, 6.4, 4.8, 8.2, 'col:#9a4a3a', undefined, true); for (const s of [-1, 1]) S.bxr(dc + 3, lx + 10 + s * 1.7, 5.4, 4.2, 0.35, 8.8, 'col:#5e4a42', undefined, -s * 26, 0, false);
      S.cyl(dc, lx - 10, 0, 1.8, 9, 'col:#c8c8c0', undefined, 12, 1.8, false); S.cyl(dc, lx - 10, 9, 1.9, 0.6, 'col:#8a9098', undefined, 12, 0.2, false);
      for (let k = 0; k < 8; k++) { S.bx(dc - 9 + k * 2.4, lx + 13, 0.6, 0.18, 1.2, 0.18, 'col:#8a6a48', undefined, false); } S.bx(dc - 1, lx + 13, 0.9, 0.12, 0.12, 17, 'col:#8a6a48', undefined, false);
    });
  }
  function windmill(S, dc, lx, r) {   // v182 : mat conique, nacelle, moyeu et trois pales effilees (blanc, gris clair en bout)
    S.place(dc, lx, 10, 10, 0, 40, () => { const hub = 27;
      S.cyl(dc, lx, 0, 2.5, 1.6, 'col:#a7b5c3', undefined, 10, 2.4, false); S.cyl(dc, lx, 1.6, 2.2, hub * 0.55, 'col:#dce4eb', undefined, 10, 1.6, false); S.cyl(dc, lx, 1.6 + hub * 0.55, 1.6, hub * 0.45 - 0.6, 'col:#f8fafc', undefined, 10, 1.1, false);
      S.bx(dc + 1.6, lx, hub + 0.2, 2.4, 2.6, 6.4, 'col:#dce4eb', undefined, false); S.bx(dc - 1.4, lx, hub + 0.2, 1.9, 1.9, 1.8, 'col:#a7b5c3', undefined, false);
      const a0 = r() * 6.28; for (let k = 0; k < 3; k++) { const a = a0 + k * 2.0944, sn = Math.sin(a), cs = Math.cos(a);
        S.bxr(dc - 2.0, lx + sn * 5.2, hub + cs * 5.2, 1.7, 9.6, 0.34, 'col:#f8fafc', undefined, -a * DEG, 0, false); S.bxr(dc - 2.0, lx + sn * 14, hub + cs * 14, 0.95, 9, 0.28, 'col:#dce4eb', undefined, -a * DEG, 0, false); } });
  }
  function pylonLine(S, dc, lx) { S.place(dc, lx, 8, 4, 0, 32, () => { S.bx(dc, lx, 14, 1.2, 28, 1.2, 'metal', '#8a8e96', false); S.bx(dc, lx, 24, 14, 0.6, 0.6, 'metal', '#8a8e96', false); S.bx(dc, lx, 20, 10, 0.6, 0.6, 'metal', '#8a8e96', false); }); }
  function haystack(S, dc, lx, r) { S.place(dc, lx, 8, 8, 0, 4, () => { S.cyl(dc, lx, 0, 2.4, 3.4, 'col:' + pick(r, ['#d8b860', '#c8a850']), undefined, 10, 2.4, false); }); }

  // ---------- sol lisse : une vraie surface continue (normales calculees sur le terrain, pas de tranches) avec un degrade de verts et de champs ----------
  const GC = { a: new THREE.Color('#44540d'), b: new THREE.Color('#4a5a0e'), f: new THREE.Color('#516310'), c: new THREE.Color(), g: new THREE.Color('#77797a') };
  Z.evoGC = GC;
  const GBR = new THREE.Color('#7fb552'), GDK = new THREE.Color('#3a7438');
  // v184 : relief doux du sol RENDU seulement (normales inclinees : collines de 90 a 180 m) ; la geometrie, les collisions et la trajectoire ne changent pas
  const relN = (x, z, o, nx, ny, nz) => {
    const gx = 0.0175 * Math.cos(x * 0.035 + 1) * Math.sin(z * 0.03) + 0.0213 * Math.cos(x * 0.071 + z * 0.05) + 0.004 * Math.cos(x * 0.11 - z * 0.07), gz = 0.015 * Math.sin(x * 0.035 + 1) * Math.cos(z * 0.03) + 0.015 * Math.cos(x * 0.071 + z * 0.05) - 0.0028 * Math.cos(x * 0.11 - z * 0.07);
    let X = nx - gx * 9, Z_ = nz - gz * 9; const l = Math.hypot(X, ny, Z_) || 1; o[0] = X / l; o[1] = ny / l; o[2] = Z_ / l; return o;
  };
  const _rn = [0, 1, 0];
  const gcol = (x, z, out) => {
    const n = 0.5 + 0.5 * (Math.sin(x * 0.011 + z * 0.017) * 0.5 + Math.sin(x * 0.027 - z * 0.013 + 1.3) * 0.3 + Math.sin(x * 0.05 + z * 0.043) * 0.2);
    out.copy(GC.a).lerp(GC.b, n);
    const q = 0.5 + 0.5 * Math.sin(x * 0.043 + Math.sin(z * 0.029) * 2.0) * Math.sin(z * 0.047 + Math.sin(x * 0.021) * 1.7 + 1.1);   // v184 : plaques ensoleillees / ombrees
    const sb = Math.max(0, Math.min(1, (q - 0.5) / 0.4)), sd = Math.max(0, Math.min(1, (0.42 - q) / 0.35));   // v187 : transitions de teinte progressives
    if (sb > 0) out.lerp(GBR, 0.55 * sb * sb * (3 - 2 * sb)); else if (sd > 0) out.lerp(GDK, 0.5 * sd * sd * (3 - 2 * sd));
    const f = Math.sin(x * 0.021 + 0.7) * Math.sin(z * 0.019 + 2.1); if (f > 0.35) out.lerp(GC.f, Math.min(0.75, (f - 0.35) * 2));
    return out;
  };
  const _v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _Q = new THREE.Quaternion(), _O = new THREE.Vector3();
  Z.evoGroundMesh = function (ctx, d, e) {
    const T = ctx.T, b = ctx.b, m = (d + e) / 2, sloped = T.rel(d) !== 0 || T.rel(e) !== 0 || T.rel(m) !== 0, rows = sloped ? Math.max(1, Math.round((e - d) / 5)) : Math.max(1, Math.round((e - d) / 20));
    // colonnes : la zone de jeu suit le virage (T.at) ; au-delà, le sol part en LIGNE DROITE le long de la normale (jamais de pli dans un virage serré)
    const pl0 = Z.plan(T, T.zoneIndex(m)), sc0 = pl0.scenes.find((q) => m >= q.d0 && m < q.d1), sd0 = sc0 && (campagne.scenes[sc0.name] || (Z.defs.ocean && Z.defs.ocean.scenes[sc0.name])), gw0 = sd0 && sd0.gw;
    const V0 = gw0 ? gw0 + 10 : T.vol(m) + 60, cols = gw0 ? [] : [{ x: -330, o: -1 }, { x: -130, o: -1 }]; for (let x = -V0; x <= V0 + 0.1; x += 15) cols.push({ x, o: 0 }); if (!gw0) cols.push({ x: 130, o: 1 }, { x: 330, o: 1 });
    const pl = Z.plan(T, T.zoneIndex(m)), sc = pl.scenes.find((q) => m >= q.d0 && m < q.d1), sd = sc && (campagne.scenes[sc.name] || (Z.defs.ocean && Z.defs.ocean.scenes[sc.name])), gf = sd && sd.ground, wet = sd && sd.wet;
    const nC = cols.length, pos = [], nor = [], col = [], uv = [], idx = [], c = GC.c, grey = GC.g;
    for (let r = 0; r <= rows; r++) {
      const dd = d + (e - d) * r / rows, pa = T.at(dd - 1.5, 0, 0), pb = T.at(dd + 1.5, 0, 0), qa = T.at(dd, -1.5, 0), qb = T.at(dd, 1.5, 0), eL = T.at(dd, -V0, 0), eR = T.at(dd, V0, 0);
      _v[0].set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]); _v[1].set(qb[0] - qa[0], qb[1] - qa[1], qb[2] - qa[2]); _v[2].crossVectors(_v[1], _v[0]).normalize(); if (_v[2].y < 0) _v[2].negate();
      const lx_ = qb[0] - qa[0], lz_ = qb[2] - qa[2], ll = Math.hypot(lx_, lz_) || 1, ux = lx_ / ll, uz = lz_ / ll;
      for (let k = 0; k < nC; k++) {
        const cc = cols[k]; let p;
        if (cc.o === 0) p = T.at(dd, cc.x, 0); else { const ed = cc.o < 0 ? eL : eR, off = Math.abs(cc.x) * cc.o; p = [ed[0] + ux * off, ed[1], ed[2] + uz * off]; }
        pos.push(p[0], p[1], p[2]); relN(p[0], p[2], _rn, _v[2].x, _v[2].y, _v[2].z); nor.push(_rn[0], _rn[1], _rn[2]); uv.push(p[0], p[2]);
        gcol(p[0], p[2], c); if (gf) gf(dd, cc.x, c, sc); if (wet && cc.o === 0 && wet(dd, cc.x, sc, T)) c.lerp(grey, 0.9);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let r = 0; r < rows; r++) for (let k = 0; k < nC - 1; k++) { const a = r * nC + k, bq = a + 1, cq = a + nC, dq = cq + 1; idx.push(a, cq, bq, bq, cq, dq); }
    { const kc = Math.floor(nC / 2), A_ = new THREE.Vector3(pos[3 * kc], pos[3 * kc + 1], pos[3 * kc + 2]), B = new THREE.Vector3(pos[3 * (kc + nC)], pos[3 * (kc + nC) + 1], pos[3 * (kc + nC) + 2]), Cc = new THREE.Vector3(pos[3 * (kc + 1)], pos[3 * (kc + 1) + 1], pos[3 * (kc + 1) + 2]); if (B.sub(A_).cross(Cc.sub(A_)).y < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    { const tx = sd && sd.seabed ? 'sand' : 'col:#fdfdfd'; b.batch(tx).shadow = false; b.addGeometry(g, _O, _Q, null, tx, undefined, tx === 'sand' ? [1 / 12, 1 / 12] : [1 / 7, 1 / 7]); g.dispose(); }   // v176 : sol d'un vert olive uni (comme la reference), sans texture
    if (!(sd && sd.seabed) && !(sd && sd.grass === false)) (ctx.grassJobs = ctx.grassJobs || []).push({ d, e, wet, sd, sc, gf });   // v177 : herbe partout ou le sol est vert (posee en fin de troncon)
  };
  // touffes d'herbe : petites, plates, d'UNE seule couleur proche du sol (un peu plus sombre) ; chaque brin est dessiné des deux côtés (même éclairage dessus et dessous) ; jamais dans l'eau
  function hsh(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
  const GTC = new THREE.Color('#3f8228');
  // v176 : HERBE a la maniere de la reference : touffes de longs brins fins vert olive (base sombre, pointe plus claire) qui ondulent, buissons ronds vert sauge, petites fleurs blanches et jaunes ;
  // les brins retrecissent et disparaissent avec la distance (aFar), les buissons restent visibles plus loin
  const GU = { value: 0 }, GCAM = { value: new THREE.Vector3() };
  let GM = null;
  const grassMat = () => GM || (GM = (() => {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = GU; sh.uniforms.uCam = GCAM;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec3 uCam;\nattribute float aSway;\nattribute float aFar;').replace('#include <begin_vertex>', `vec3 transformed = vec3( position );
        vec3 gw = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
        float gf = 1.0 - smoothstep( aFar * 0.55, aFar, distance( gw, uCam ) );
        float gs = aSway * ( 0.6 + 0.4 * sin( gw.x * 0.11 + gw.z * 0.13 ) );
        transformed.x += ( sin( uTime * 1.9 + gw.x * 0.31 + gw.z * 0.19 ) * 0.14 + sin( uTime * 3.4 + gw.z * 0.8 ) * 0.04 ) * gs;
        transformed.z += cos( uTime * 1.5 + gw.z * 0.27 + gw.x * 0.15 ) * 0.1 * gs;
        transformed.y -= aSway * ( 1.0 - gf );`);
      // v186 : brins et petales sont lus des deux cotes SANS inverser la normale (avant, la face vue de dos etait eclairee par en dessous : brins et coeurs de fleurs presque noirs)
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>'+String.fromCharCode(10)+' normal = normalize( vNormal );');
    };
    return m;
  })());
  // couleurs relevees sur la reference : base sombre #3f5a14, milieu #6e811d, pointe #8aa030 ; buisson sauge #7f9560 / #9bb070
  const GB = ['#3f5a14', '#47621a', '#3a5a1c', '#4f6a1c'].map((h) => new THREE.Color(h)), GM2 = ['#6e811d', '#76891f', '#667d1c'].map((h) => new THREE.Color(h)), GT = ['#8aa030', '#94a834', '#7f982c', '#9ab038'].map((h) => new THREE.Color(h));
  const SG = ['#7f9560', '#8aa066', '#728a58'].map((h) => new THREE.Color(h)), SGT = ['#a4b87a', '#9bb070', '#b0c286'].map((h) => new THREE.Color(h));
  // v177 : HERBE EN TOUFFES ALLONGEES, d'UNE seule couleur (celle du sol sous elles) avec un degrade : plus sombre en bas, plus clair en haut.
  // Chaque touffe est une ligne de brins fins (monticule), orientee au hasard ; tres serrees et partout ou le sol est vert ; jamais sur le beton ni sous les batiments.
  const _gc = new THREE.Color(), _b = new THREE.Color(), _tc = new THREE.Color();
  const _qi = new THREE.Quaternion(), _pt = new THREE.Vector3();
  // v179 : toute boite posee au sol (dalle, route, mur, batiment) est memorisee en 3D (centre, orientation, demi-dimensions) : l'herbe ne pousse jamais dedans ni au-dessus
  if (CC.LevelBuilder && !CC.LevelBuilder.prototype._grassHook) {
    const _box = CC.LevelBuilder.prototype.box; CC.LevelBuilder.prototype._grassHook = true;
    CC.LevelBuilder.prototype.box = function (o) {
      try { if (o && o.s && !o.ground && o.render !== false && o.s[0] * o.s[2] >= 2.5 && o.s[0] < 160 && o.s[2] < 160 && o.mat !== 'waterSurf' && o.mat !== 'glass') { (this._pave = this._pave || []).push({ c: new THREE.Vector3(o.p[0], o.p[1], o.p[2]), q: this.quatFrom(o.r).invert(), hx: o.s[0] / 2, hy: o.s[1] / 2, hz: o.s[2] / 2 }); } } catch (e) { /* ignore */ }
      return _box.apply(this, arguments);
    };
  }
  // v185 : les boites posees au sol sont indexees dans une grille (cases de 16 m) : une touffe ne teste que les boites voisines (avant : toutes, avec une allocation par test)
  const _pt2 = new THREE.Vector3(), gk = (ix, iz) => (ix + 4096) * 8192 + (iz + 4096);
  const solidIn = (L, x, y, z) => {
    if (!L || !L.length) return false;
    let G = L._g;
    if (!G || G.n !== L.length) { G = L._g = { n: L.length, m: new Map() }; for (const q of L) { const r = q.hx + q.hz + 1, x0 = Math.floor((q.c.x - r) / 16), x1 = Math.floor((q.c.x + r) / 16), z0 = Math.floor((q.c.z - r) / 16), z1 = Math.floor((q.c.z + r) / 16); for (let a = x0; a <= x1; a++) for (let c = z0; c <= z1; c++) { const k = gk(a, c); let l = G.m.get(k); if (!l) G.m.set(k, l = []); l.push(q); } } }
    const arr = G.m.get(gk(Math.floor(x / 16), Math.floor(z / 16))); if (!arr) return false; _pt.set(x, y, z);
    for (let k = 0; k < arr.length; k++) { const q = arr[k]; if (Math.abs(x - q.c.x) > q.hx + q.hz + 1 || Math.abs(z - q.c.z) > q.hx + q.hz + 1) continue; const p = _pt2.copy(_pt).sub(q.c).applyQuaternion(q.q); if (Math.abs(p.x) < q.hx + 0.5 && Math.abs(p.z) < q.hz + 0.5 && y > q.c.y - q.hy - 0.3 && y < q.c.y + q.hy + 0.08 + (q.hy < 0.5 ? 0.6 : 0) && q.c.y - q.hy < y + 1.4) return true; }
    return false;
  };
  const solidAt = (b, x, y, z) => { if (solidIn(b._pave, x, y, z)) return true; for (const r of GREC) if (r.b !== b && r.b._pave && solidIn(r.b._pave, x, y, z)) return true; return false; };
  const GREC = [];   // v181 : herbe des derniers troncons : une dalle posee par un troncon voisin efface les touffes deja creees dessous
  // v179 : HERBE EN TOUFFES ALLONGEES. Meme couleur que le sol (base un peu plus sombre, pointe = couleur du sol). Densite repartie sur toute la largeur ; les touffes lointaines ont moins de brins (legerete).
  // v190 : ALGUES : rubans a 5 segments qui ondulent avec le meme shader que l'herbe (aSway = amplitude, 0 a la base). Tous les rubans d'un troncon forment un seul mesh.
  Z.addSway = (S, x, y, z, h, w, cb, ct, far) => {
    const c = S.ctx, B = c.swayBuf || (c.swayBuf = { pos: [], nor: [], col: [], sway: [], far: [] }), ph = Math.random() * 6.28, yaw = Math.random() * 3.14, px = Math.cos(yaw), pz = Math.sin(yaw), cA = new THREE.Color(cb), cB = new THREE.Color(ct), cc = new THREE.Color(), N = 5, row = [];
    for (let i = 0; i <= N; i++) { const t = i / N, wd = w * (1 - 0.82 * t) / 2, ox = Math.sin(t * 2.4 + ph) * h * 0.05, oz = Math.cos(t * 1.9 + ph) * h * 0.04; cc.copy(cA).lerp(cB, t); row.push([x + ox - px * wd, y + h * t, z + oz - pz * wd, x + ox + px * wd, y + h * t, z + oz + pz * wd, cc.r, cc.g, cc.b, h * t * t * 0.9]); }
    const v = (r, k) => { B.pos.push(r[k * 3], r[k * 3 + 1], r[k * 3 + 2]); B.nor.push(0, 1, 0); B.col.push(r[6], r[7], r[8]); B.sway.push(r[9]); B.far.push(far || 420); };
    for (let i = 0; i < N; i++) { const a = row[i], b = row[i + 1]; v(a, 0); v(a, 1); v(b, 0); v(a, 1); v(b, 1); v(b, 0); }
  };
  // ---------- v194 : herbe et fleurs instanciees (shaders) ----------
  // les gabarits (un seul brin-triangle x NBL, un seul modele de fleur) sont partages par tous les meshes
  const _tts = {}; let _ft = null;
  // gabarit de touffe : n brins (un triangle chacun) ; wm = largeur des brins (les gabarits LOINTAINS ont moins de brins, plus larges : meme couverture)
  const tuftTemplate = (nb, wm) => { const key = nb + '_' + wm; return _tts[key] || (_tts[key] = (() => {
    const n = nb * 3, bc = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let j = 0; j < nb; j++) for (let c = 0; c < 3; c++) { const k = j * 3 + c; bc[k * 3] = j; bc[k * 3 + 1] = c; bc[k * 3 + 2] = wm; const f = c < 2 ? 0.78 : 1.0; col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = f; }
    return { position: new THREE.BufferAttribute(new Float32Array(n * 3), 3), aBC: new THREE.BufferAttribute(bc, 3), color: new THREE.BufferAttribute(col, 3) };
  })()); };
  const flowerTemplate = () => _ft || (_ft = (() => {
    // parts : 0 tige (3 sommets), 1 petales (7 x 3), 2 coeur (4 x 3) ; aBC = (partie * 100 + indice, coin)
    const rows = []; for (let c = 0; c < 3; c++) rows.push([0, c]);
    for (let q = 0; q < 7; q++) for (let c = 0; c < 3; c++) rows.push([100 + q, c]);
    for (let q = 0; q < 4; q++) for (let c = 0; c < 3; c++) rows.push([200 + q, c]);
    const bc = new Float32Array(rows.length * 3); rows.forEach((r, k) => { bc[k * 3] = r[0]; bc[k * 3 + 1] = r[1]; bc[k * 3 + 2] = 1; });
    return { position: new THREE.BufferAttribute(new Float32Array(rows.length * 3), 3), aBC: new THREE.BufferAttribute(bc, 3), color: null };
  })());
  const GLSL_COMMON = `uniform float uTime; uniform vec3 uCam; attribute vec3 aBC; attribute vec3 aPos; attribute vec2 aNrm;
    float gh( float a, float b ) { return fract( sin( a * 127.1 + b * 311.7 ) * 43758.5453 ); }
    vec3 gWind( vec3 gw, float sway, float far ) { float gf = 1.0 - smoothstep( far * 0.55, far, distance( gw, uCam ) ); float gs = sway * ( 0.6 + 0.4 * sin( gw.x * 0.11 + gw.z * 0.13 ) );
      return vec3( ( sin( uTime * 1.9 + gw.x * 0.31 + gw.z * 0.19 ) * 0.14 + sin( uTime * 3.4 + gw.z * 0.8 ) * 0.04 ) * gs, - sway * ( 1.0 - gf ), cos( uTime * 1.5 + gw.z * 0.27 + gw.x * 0.15 ) * 0.1 * gs ); }`;
  const mkInst = (attrs, bodyV, colV, key) => {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); m.customProgramCacheKey = () => key;   // sans cle propre, les deux materiaux partageraient le meme programme (meme texte de fonction)
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = GU; sh.uniforms.uCam = GCAM;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + GLSL_COMMON + '\n' + attrs)
        .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3( aNrm.x, sqrt( max( 0.0, 1.0 - dot( aNrm, aNrm ) ) ), aNrm.y );')
        .replace('#include <begin_vertex>', bodyV).replace('#include <color_vertex>', colV);
      // brins et petales lus des deux cotes SANS inverser la normale
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>' + String.fromCharCode(10) + ' normal = normalize( vNormal );');
    };
    return m;
  };
  let _tm = null, _fm = null;
  const tuftMat = () => _tm || (_tm = mkInst('attribute vec4 aCfg; attribute vec3 aCol;', `
      float seed = aCfg.x, far = aCfg.y, nbF = aCfg.z, wk = aCfg.w;
      float sz = 0.9 + 0.7 * gh( seed, 1.3 ), Lt = ( 0.9 + 1.5 * gh( seed, 2.7 ) ) * sz, yaw = gh( seed, 4.4 ) * 3.1416, kd = gh( seed, 5.9 );
      float kn = 0.3 + 0.7 * smoothstep( 2.5, 16.0, distance( ( modelMatrix * vec4( aPos, 1.0 ) ).xyz, uCam ) );   // v205 : pres de la camera les brins sont courts (plus de mur de verdure devant l'ecran)
      float kh = kd < 0.22 ? 1.3 : ( kd > 0.82 ? 0.7 : 1.0 ), kw = kd < 0.22 ? 0.65 : ( kd > 0.82 ? 1.2 : 1.0 ), hv = 0.85 + 0.3 * gh( seed, 6.6 );
      float j = aBC.x, c = aBC.y, on = step( j + 0.5, nbF );
      float s = ( gh( j * 3.7, seed ) * 2.0 - 1.0 ) * 0.5, side = ( gh( j * 5.3, seed * 1.1 ) - 0.5 ) * 0.4 * sz;
      float hp = 0.45 + 0.55 * cos( s * 3.1416 ), hh = ( 0.45 + 0.75 * gh( j * 5.1, seed ) ) * hp * sz * hv * 1.02 * kh * on * kn, w = 0.075 * sz * wk * 1.3 * kw * on * aBC.z;
      float lean = hh * 0.3 * ( gh( j * 7.1, seed ) - 0.4 );
      float lu = s * Lt, lv = side, ly = 0.0;
      if ( c < 0.5 ) { lv += w; } else if ( c < 1.5 ) { lv -= w; } else { lu += 0.5 * lean; lv += 0.6 * lean; ly = hh; }
      float ca = cos( yaw ), sa = sin( yaw );
      vec3 transformed = aPos + vec3( lu * ca - lv * sa, ly, lu * sa + lv * ca );
      vec3 gw = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
      transformed += gWind( gw, c > 1.5 ? hh : 0.0, far );`, 'vColor = color * aCol;', 'grassTuft'));
  const flowerMat = () => _fm || (_fm = mkInst('attribute vec4 aF1; attribute vec3 aF2; attribute vec3 aCol;', `
      float hgt = aF1.x, R = aF1.y, daisy = aF1.z, th = aF1.w, fx = aF2.x, fz = aF2.y, far = aF2.z;
      float part = floor( aBC.x / 100.0 + 0.001 ), q = aBC.x - part * 100.0, c = aBC.y;
      float cx = aPos.x + fx * hgt * 0.12, cz = aPos.z + fz * hgt * 0.12, cy = aPos.y + hgt;
      float e1x = fz, e1z = - fx, e2x = fx * 0.62, e2y = 0.78, e2z = fz * 0.62;
      float nP = daisy > 0.5 ? 7.0 : 5.0, sw = hgt * 0.6, rcn = R * 0.46, on = 1.0, a = 0.0, rad = 0.0;
      vec3 pt = vec3( aPos.x, aPos.y, aPos.z ); float swayV = 0.0;
      if ( part < 0.5 ) { if ( c < 0.5 ) pt = aPos; else if ( c < 1.5 ) pt = aPos + vec3( 0.03, 0.0, 0.0 ); else { pt = vec3( cx, cy - R * 0.55, cz ); swayV = sw; } }
      else if ( part < 1.5 ) { on = step( q + 0.5, nP ); float h2 = 3.1416 / nP; a = q / nP * 6.2832 + th; rad = R; if ( c < 0.5 ) { a -= h2; rad = R * 0.3; } else if ( c < 1.5 ) { a += h2; rad = R * 0.3; }
        pt = vec3( cx + e1x * cos( a ) * rad + e2x * sin( a ) * rad, cy + e2y * sin( a ) * rad, cz + e1z * cos( a ) * rad + e2z * sin( a ) * rad ); pt = mix( vec3( aPos.x, aPos.y - 1.0, aPos.z ), pt, on ); swayV = sw * on; }
      else { vec3 off = vec3( - fx * 0.03, 0.03, - fz * 0.03 ); if ( c < 0.5 ) pt = vec3( cx, cy, cz ) + off; else { a = ( q + ( c > 1.5 ? 1.0 : 0.0 ) ) / 4.0 * 6.2832; pt = vec3( cx + e1x * cos( a ) * rcn + e2x * sin( a ) * rcn, cy + e2y * sin( a ) * rcn, cz + e1z * cos( a ) * rcn + e2z * sin( a ) * rcn ) + off; } swayV = sw; }
      vec3 transformed = pt;
      vec3 gw = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
      transformed += gWind( gw, swayV, far );`,
    `vec3 stem = vec3( 0.2705, 0.5529, 0.2392 ) * 0.9; vec3 yel = vec3( 1.0, 0.8235, 0.2275 );
      float pr = floor( aBC.x / 100.0 + 0.001 ); vColor = pr < 0.5 ? stem : ( pr < 1.5 ? aCol : ( aF1.z > 0.5 ? yel : aCol ) );`, 'grassFlower'));

  Z.flushGrass = function (ctx) {
    if (ctx.swayBuf && ctx.swayBuf.pos.length) { const B = ctx.swayBuf; ctx.swayBuf = null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(B.sway, 1)); g.setAttribute('aFar', new THREE.Float32BufferAttribute(B.far, 1)); g.computeBoundingSphere(); g.boundingSphere.radius += 6;
      const m = new THREE.Mesh(g, grassMat()); m.frustumCulled = true; m.onBeforeRender = (r, sc, cam) => { GU.value = performance.now() / 1000; GCAM.value.copy(cam.position); }; ctx.b.add(m); }
    const jobs = ctx.grassJobs; if (!jobs || !jobs.length) return; ctx.grassJobs = null;
    const T = ctx.T, b = ctx.b;
    // v194 : HERBE INSTANCIEE. Une touffe = UNE instance (position, graine, couleur, normale du sol : 12 nombres) ; les brins sont calcules dans le vertex shader a partir de la graine
    // (memes formules que l'ancienne generation : longueur, inclinaison, hauteur, largeur). Meme nombre de touffes et de brins qu'avant, mais ~25 fois moins de memoire,
    // beaucoup moins de calcul a la creation d'un troncon, et plus aucun envoi de gros tampons au GPU.
    // Un mesh par tranche de 100 m et par niveau de detail : 0 = touffes de base (portee 260 m), 1 = remplissage et une part des fleurs (portee 150 m).
    const groups = new Map();
    const grp = (sk, layer, cls) => { cls = cls || 0; const k = (sk * 4 + layer) * 4 + cls; let g = groups.get(k); if (!g) groups.set(k, g = { layer, sk, cls, tp: [], tc: [], tcol: [], tn: [], fp: [], fa: [], fb: [], fcol: [], fcen: [], fn: [], tufts: [], flowers: [] }); return g; };
    for (let k = GREC.length - 1; k >= 0; k--) if (!GREC[k].b.root || !GREC[k].b.root.parent) GREC.splice(k, 1);
    const cn = [0, 1, 0];   // normale du sol, calculee une fois par touffe / fleur
    const runJob = (jb) => {
      const { d, e, wet, sc, gf } = jb, len = e - d;
      // bandes de largeur (distance au centre) ; densite par metre ; nb = brins par touffe
      const bands = [[0, 14, 17, 10, 13, 1.85], [14, 34, 12, 6, 8, 2.1], [34, 62, 6, 4, 5, 2.7]];
      let bi = 0;
      for (const [lo, hi, dens, nbLo, nbHi, wk] of bands) {
        const area = 2 * (hi - lo), n = Math.max(2, Math.round(len * area * dens * 0.78 / 28 * (d < 150 ? 1.8 : 1))); bi++;   // v208 : pres du lanceur, herbe plus fine et plus fournie
        for (let i = 0; i < n; i++) {
          const dd = d + len * hsh(d + i * 0.37 + lo, i * 1.9 + bi), lx = (hsh(i * 1.7 + hi, d * 0.13 + bi) < 0.5 ? -1 : 1) * (lo + (hi - lo) * hsh(i * 2.9 + bi, d * 0.7 + hi));
          if (hsh(i * 9.7, d + bi) > 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(dd * 0.07 + lx * 0.09 + Math.sin(lx * 0.05) * 2))) continue;   // plaques un peu moins denses (test peu couteux d'abord)
          if (wet && wet(dd, lx, sc, T)) continue;
          const p = T.at(dd, lx, 0); gcol(p[0], p[2], _gc); if (gf) gf(dd, lx, _gc, sc);
          if (!(_gc.g > _gc.b * 1.5 && _gc.g >= _gc.r * 0.82)) continue;
          if (solidAt(b, p[0], p[1], p[2])) continue;
          const nb = nbLo + Math.floor(hsh(i, d * 2.1 + bi) * (nbHi - nbLo + 1)), seed = 1 + hsh(i * 1.7 + bi, d * 0.013) * 97;
          const lay = (bi === 1 && hsh(i * 7.3, d + 5.1) >= 0.34) ? 1 : 0, af = bi === 1 ? (lay ? 130 : 250) : bi === 2 ? 190 : 250, G = grp(Math.floor(dd / 100), lay, bi - 1);
          relN(p[0], p[2], cn, 0, 1, 0); _tc.copy(_gc).multiplyScalar(0.96 + 0.1 * hsh(i * 1.3, d + bi));
          G.tufts.push([p[0], p[1], p[2], G.tp.length, 0]);
          G.tp.push(p[0], p[1] - 0.04, p[2]); G.tc.push(seed, af, nb, dd < 150 ? wk * 0.58 : wk); G.tcol.push(_tc.r, _tc.g, _tc.b); G.tn.push(cn[0], cn[2]);
        }
      }
      // FLEURS SAUVAGES en parterres irreguliers : marguerites (petales blancs, coeur jaune), boutons d'or, quelques bleues, violettes, roses ; inclinees vers la camera
      const FW = [[0.42, '#fffdf4', 1], [0.76, '#f6d34b', 0], [0.88, '#76b5f4', 0], [0.96, '#a58ae0', 0], [1.01, '#e9a0c4', 0]];
      const pickF = (r) => { for (const f of FW) if (r < f[0]) return f; return FW[0]; };
      const ncl = Math.max(3, Math.round(len * 0.8)), SK = 0.9, _fc = new THREE.Color();
      for (let ci = 0; ci < ncl; ci++) {
        const cd = d + len * hsh(d + ci * 0.91, ci * 1.3), cl = (hsh(ci * 5.1, d * 0.17) < 0.5 ? -1 : 1) * (3.5 + 34 * Math.pow(hsh(ci * 2.3, d * 0.31), 1.5)), main = pickF(hsh(ci * 3.7, d * 0.53)), rc = 1.4 + 2.4 * hsh(ci * 7.7, d), nfl = 9 + Math.floor(hsh(ci * 4.3, d * 0.9) * 12);
        if (Math.sin(cd * 0.021 + cl * 0.033 + 1.7) + Math.sin(cd * 0.047 - cl * 0.029) < -0.5) continue;   // zones sans fleurs : parterres separes par de l'herbe seule
        const t0 = T.at(cd, cl, 0), t1 = T.at(cd + 2, cl, 0), tl = Math.hypot(t1[0] - t0[0], t1[2] - t0[2]) || 1, fx = (t1[0] - t0[0]) / tl, fz = (t1[2] - t0[2]) / tl;   // sens de la piste
        for (let k = 0; k < nfl; k++) {
          const ang = hsh(ci + k * 1.7, d * 0.3) * 6.2832, rr0 = rc * Math.sqrt(hsh(k * 2.9, ci + d * 0.11)), dd = cd + Math.cos(ang) * rr0, lx = cl + Math.sin(ang) * rr0; if (dd < d || dd >= e || dd < 175 || wet && wet(dd, lx, sc, T)) continue;   // pas de fleurs pres du lanceur
          const p = T.at(dd, lx, 0); gcol(p[0], p[2], _gc); if (gf) gf(dd, lx, _gc, sc); if (!(_gc.g > _gc.b * 1.5 && _gc.g >= _gc.r * 0.82) || solidAt(b, p[0], p[1], p[2])) continue;
          const flay = hsh(k * 2.1, ci + d * 0.7) < 0.4 ? 0 : 1, fa = flay ? 100 : 170, G = grp(Math.floor(dd / 100), flay); relN(p[0], p[2], cn, 0, 1, 0);
          const kind = hsh(k * 6.1, ci + d) < 0.8 ? main : pickF(hsh(k * 8.3, ci * 1.9 + d)), daisy = kind[2] === 1, hgt = 0.6 + 0.5 * hsh(k * 1.3, ci + d), R = (daisy ? 0.38 : 0.29) * (0.8 + 0.5 * hsh(k * 9.1, ci)) * 1.0, th = hsh(k * 3.3, ci) * 6.2832;
          _fc.set(kind[1]).multiplyScalar(SK);
          G.flowers.push([p[0], p[1], p[2], G.fp.length, 0]);
          G.fp.push(p[0], p[1] - 0.03, p[2]); G.fa.push(hgt, R, daisy ? 1 : 0, th); G.fb.push(fx, fz, fa); G.fcol.push(_fc.r, _fc.g, _fc.b); G.fn.push(cn[0], cn[2]);
        }
      }
    };
    const bushes = (jb) => {
      const { d, e, wet, sc, gf } = jb, len = e - d;
      // buissons : quelques touffes arrondies de feuillage, vers le plan intermediaire
      if (CC.Trees && CC.Trees.bush) {
        const nbu = Math.max(1, Math.round(len * 0.07)); let rc_ = 0; const rnd = () => hsh(d * 0.37 + (rc_++) * 1.913, rc_ * 0.771);
        for (let i = 0; i < nbu; i++) {
          const dd = d + len * hsh(d + i * 2.17, i * 0.83), lx = (hsh(i * 3.9, d * 0.21) < 0.5 ? -1 : 1) * (7 + 38 * hsh(i * 6.1, d * 0.43)); if (wet && wet(dd, lx, sc, T)) continue;
          const p = T.at(dd, lx, 0); gcol(p[0], p[2], _gc); if (gf) gf(dd, lx, _gc, sc); if (!(_gc.g > _gc.b * 1.5 && _gc.g >= _gc.r * 0.82) || solidAt(b, p[0], p[1], p[2])) continue;
          CC.Trees.bush(b, p[0], p[1] - 0.05, p[2], 0.9 + 1.0 * hsh(i * 1.1, d), rnd);
        }
      }
    };
    for (const jb of jobs) bushes(jb);   // les buissons rejoignent le lot du decor tout de suite
    const finish = () => {
      // les dalles de CE troncon effacent les touffes et fleurs des troncons voisins deja posees dessous (seulement celles qui sont dans la zone des dalles)
      if (b._pave && b._pave.length) {
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of b._pave) { const r = q.hx + q.hz + 1; x0 = Math.min(x0, q.c.x - r); x1 = Math.max(x1, q.c.x + r); z0 = Math.min(z0, q.c.z - r); z1 = Math.max(z1, q.c.z + r); }
        for (const r of GREC) for (const [list, A_] of [[r.tufts, r.aT], [r.flowers, r.aF]]) { if (!A_ || !list) continue; let ch = false; for (const t of list) { if (t[5] || t[0] < x0 || t[0] > x1 || t[2] < z0 || t[2] > z1) continue; if (solidIn(b._pave, t[0], t[1], t[2])) { t[5] = 1; ch = true; A_.array[t[3] + 1] = -9999; } } if (ch) A_.needsUpdate = true; }
      }
      const mk = (G, isFlower) => {
        const n = isFlower ? G.fp.length / 3 : G.tp.length / 3; if (!n) return null;
        const g = new THREE.InstancedBufferGeometry(), NBc = [13, 8, 5][G.cls || 0], T0 = isFlower ? flowerTemplate() : tuftTemplate(NBc, 1);
        g.setAttribute('position', T0.position); g.setAttribute('aBC', T0.aBC); if (T0.color) g.setAttribute('color', T0.color); g.instanceCount = n;
        const pos = isFlower ? G.fp : G.tp, aP = new THREE.InstancedBufferAttribute(new Float32Array(pos), 3); g.setAttribute('aPos', aP);
        if (isFlower) { g.setAttribute('aF1', new THREE.InstancedBufferAttribute(new Float32Array(G.fa), 4)); g.setAttribute('aF2', new THREE.InstancedBufferAttribute(new Float32Array(G.fb), 3)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(G.fcol), 3)); g.setAttribute('aNrm', new THREE.InstancedBufferAttribute(new Float32Array(G.fn), 2)); }
        else { g.setAttribute('aCfg', new THREE.InstancedBufferAttribute(new Float32Array(G.tc), 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(G.tcol), 3)); g.setAttribute('aNrm', new THREE.InstancedBufferAttribute(new Float32Array(G.tn), 2)); }
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < pos.length; k += 3) { x0 = Math.min(x0, pos[k]); x1 = Math.max(x1, pos[k]); y0 = Math.min(y0, pos[k + 1]); y1 = Math.max(y1, pos[k + 1]); z0 = Math.min(z0, pos[k + 2]); z1 = Math.max(z1, pos[k + 2]); }
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 6);
        const mesh = new THREE.Mesh(g, isFlower ? flowerMat() : tuftMat()); mesh.frustumCulled = true; mesh.receiveShadow = false; mesh.userData.reach = G.layer ? 130 : 250;
        if (!isFlower) { const gF = new THREE.InstancedBufferGeometry(), TF = tuftTemplate(Math.ceil(NBc * 0.45), 1.7); for (const k in g.attributes) gF.setAttribute(k, g.attributes[k]); gF.setAttribute('position', TF.position); gF.setAttribute('aBC', TF.aBC); gF.setAttribute('color', TF.color); gF.instanceCount = n; gF.boundingSphere = g.boundingSphere; mesh.userData.gNear = g; mesh.userData.gFar = gF; mesh.userData.far = false; }   // LOD : au-dela de ~140 m, la touffe a ~45 % de brins en moins, plus larges
        mesh.onBeforeRender = (r, sc, cam) => { GU.value = performance.now() / 1000; GCAM.value.copy(cam.position); }; b.add(mesh); GMESH.push(mesh); return aP;
      };
      for (const G of groups.values()) {
        const aT = mk(G, false), aF = mk(G, true);
        if (aT || aF) GREC.push({ b, aT, aF, tufts: aT ? G.tufts : null, flowers: aF ? G.flowers : null });
        G.tp = G.tc = G.tcol = G.tn = G.fp = G.fa = G.fb = G.fcol = G.fn = null;
      }
      while (GREC.length > 24) GREC.shift();
    };
    // la generation de l'herbe est repartie sur plusieurs images (3 ms par image) au lieu d'un bloc a chaque troncon
    const task = { b, step(dl) { while (ji < jobs.length) { runJob(jobs[ji++]); if (performance.now() > dl) return false; } finish(); return true; } }; let ji = 0;
    if (SYNC) { task.step(Infinity); return; }
    GQ.push(task); if (!GQ.timer) GQ.timer = setTimeout(grassDrain, 16);
  };
  const GQ = [], SYNC = /[?&]test=1/.test(location.search) && !/gdefer=1/.test(location.search);
  const grassDrain = () => { GQ.timer = 0; Z.grassWork(3); if (GQ.length) GQ.timer = setTimeout(grassDrain, 16); };
  Z.grassWork = (ms) => { const dl = performance.now() + ms; while (GQ.length) { const t = GQ[0]; if (!t.b.root || !t.b.root.parent) { GQ.shift(); continue; } if (t.step(dl)) GQ.shift(); if (performance.now() >= dl) break; } };
  // v185 : chaque image, les tranches d'herbe entierement hors de portee (leurs brins sont deja fondus a zero) ne sont plus envoyees a la carte graphique
  const GMESH = [], _cs = new THREE.Vector3();
  Z.grassCull = function (cam) {
    if (GQ.length) Z.grassWork(3);
    for (let k = GMESH.length - 1; k >= 0; k--) {
      const m = GMESH[k]; if (!m.parent) { GMESH.splice(k, 1); continue; }
      const bs = m.geometry.boundingSphere; _cs.copy(bs.center).applyMatrix4(m.matrixWorld); const dc = _cs.distanceTo(cam); m.visible = dc - bs.radius < m.userData.reach + 6;
      const U_ = m.userData; if (U_.gFar) { const far = U_.far ? dc > 85 : dc > 100; if (far !== U_.far) { U_.far = far; m.geometry = far ? U_.gFar : U_.gNear; } }
    }
  };

  // v202 : VRAIES COLLINES : une bande continue de chaque cote du couloir, hauteur et largeur definies par la distance ABSOLUE (aucune couture entre troncons, aucun cercle) ;
  // le relief monte doucement depuis la prairie, s'etale, puis se perd dans la brume. Les montagnes du fond forment un anneau complet autour du joueur (rendering/horizon.js).
  const hsn = (d, s) => 0.5 + 0.5 * (Math.sin(d / 173 + s * 1.7) * 0.5 + Math.sin(d / 67 + s * 3.1 + 1.3) * 0.3 + Math.sin(d / 29 + s * 5.3) * 0.2);
  const hillH = (d, s, u) => {
    const A = 16 + 74 * Math.pow(hsn(d, s), 1.4), W = 110 + 80 * (0.5 + 0.5 * Math.sin(d / 211 + s * 2.1)), q = u / W, t = Math.min(1, q / 0.55), rise = t * t * (3 - 2 * t), k = Math.max(0, Math.min(1, (q - 0.55) / 1.3));
    return A * (rise - 0.35 * rise * k * k * (3 - 2 * k)) + 3.5 * Math.sin(d / 13 + u / 19) * rise;
  };
  const HU = [0, 10, 22, 36, 54, 76, 104, 138, 178, 224, 276, 336], HCOL = [new THREE.Color('#5c9a38'), new THREE.Color('#86bf4c'), new THREE.Color('#7fb48a')], _hc = new THREE.Color();
  function hillStrip(S, s) {
    const T = S.T, STEP = 8, d0 = Math.ceil(S.c0 / STEP) * STEP, P = [], N = [], C = [], pt = (d, u) => { const q = T.at(d, s * (T.vol(d) + 8 + u), 0); return [q[0], q[1] + hillH(d, s, u), q[2]]; };
    const vert = (d, u) => {
      const a = pt(d, u), dd = [pt(d + 3, u), pt(d - 3, u)], uu = [pt(d, u + 4), pt(d, Math.max(0, u - 4))];
      const tx = dd[0][0] - dd[1][0], ty = dd[0][1] - dd[1][1], tz = dd[0][2] - dd[1][2], ux = uu[0][0] - uu[1][0], uy = uu[0][1] - uu[1][1], uz = uu[0][2] - uu[1][2];
      let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } const l = Math.hypot(nx, ny, nz) || 1;
      const hh = a[1] - T.at(d, s * (T.vol(d) + 8 + u), 0)[1], n = 0.5 + 0.5 * Math.sin(d * 0.21 + u * 0.13 + s), f = Math.min(1, hh / 60 * 0.6 + n * 0.35); _hc.copy(HCOL[0]).lerp(HCOL[1], f).lerp(HCOL[2], Math.min(0.4, u / 336 * 0.45));
      return { p: a, n: [nx / l, ny / l, nz / l], c: [_hc.r, _hc.g, _hc.b] };
    };
    for (let d = d0; d < S.c1; d += STEP) {
      const A = HU.map((u) => vert(d, u)), B = HU.map((u) => vert(d + STEP, u));
      for (let k = 0; k < HU.length - 1; k++) for (const v of [A[k], B[k], B[k + 1], A[k], B[k + 1], A[k + 1]]) { P.push(v.p[0], v.p[1], v.p[2]); N.push(v.n[0], v.n[1], v.n[2]); C.push(v.c[0], v.c[1], v.c[2]); }
    }
    if (!P.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
    S.b.addGeometry(g, new THREE.Vector3(), new THREE.Quaternion(), null, 'tree:#ffffff'); g.dispose();
    const dm = (S.c0 + S.c1) / 2, hc = hillH(dm, s, 40) * 0.8; if (hc > 3) S.bx(dm, s * (T.vol(dm) + 8 + 40 + 45), hc / 2, 90, hc, S.c1 - S.c0, 'col:#5c9a38', undefined, true, { render: false });
  }

  const campagne = { signature: 'rampe', scenes: {}, dress(S) {
    if (S.sc.name === 'riviere') { const dr = S.d0 + S.len * 0.5, p = S.T.at(dr, 0, 0); const q = S.T.at(dr + 10, 0, 0), q2 = S.T.at(dr - 10, 0, 0), l = Math.hypot(q[0] - q2[0], q[2] - q2[2]) || 1; S.b.water = [{ x: p[0], z: p[2], ux: (q[0] - q2[0]) / l, uz: (q[2] - q2[2]) / l, hw: S.vol(dr) + 70, hd: S.len * 0.3 + 6 }]; }   // v206 : plan d'eau de la riviere (trees.js l'evite)

    if (/^(descente|ville|noyau)$/.test(S.sc.name)) return;   // v208 : ni collines, ni rochers, ni arbres dans la mine, le train, la gare et la ville
    // collines : bandes de relief continues de chaque cote (hillStrip)
    for (const sd of [-1, 1]) hillStrip(S, sd);
    if (!/^(rampe|camp|riviere|foret|route)$/.test(S.sc.name)) return;   // forteresse et fuite : decor propre a la scene
    // petits blocs de pierre posés dans l'herbe : des reliefs à frôler
    const wetRv = (dc) => S.sc.name === 'riviere' && Math.abs(dc - (S.d0 + S.len * 0.5)) < S.len * 0.3 + 6;   // v206 : rien (arbre, ferme, rocher) ne pousse dans l'eau de la riviere
    S.rows(S.d0, S.d1, 24, 0.85, (dc) => S.item(dc, (r) => { if (wetRv(dc)) return; const lx = S.lane(dc).lx + (r() < 0.5 ? -1 : 1) * r.between([16, 62]), sz = r.between([1.6, 4.6]), p = S.at(dc, lx, 0); TR.rock(S.b, p[0], p[1], p[2], sz, r, {}); S.b.box({ p: [p[0], p[1] + sz * 0.5, p[2]], s: [sz * 1.6, sz * 1.1, sz * 1.6], render: false }); }));
    // bosquets et arbres épars
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 22, 0.9, (dc) => S.item(dc, (r) => { if (wetRv(dc)) return; const lx = s * (S.vol(dc) - r.between([2, 70])); (r() < 0.5 ? oakT : pineT)(S, dc, lx, r); }));
    // fermes, moulins, lignes électriques au loin
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 130, 0.6, (dc) => S.item(dc, (r) => { if (wetRv(dc)) return; const lx = s * r.between([55, S.vol(dc) - 10]), k = r(); (k < 0.4 ? farmhouse : k < 0.65 ? windmill : k < 0.85 ? haystack : (S2, d2, l2) => pylonLine(S2, d2, l2))(S, dc, lx, r); }));
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
    for (let i = 0; i < 12; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([30, S.vol(dc) - 8]); if (Math.abs(dc - dr) < 62) continue; S.item(dc, (r) => (r() < 0.5 ? oakT : pineT)(S, dc, lx, r)); }
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
