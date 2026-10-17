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
      S.bx(dc + 3, lx + 10, 2.4, 6.4, 4.8, 8.2, 'col:#7a5a3e', undefined, true); for (const s of [-1, 1]) S.bxr(dc + 3, lx + 10 + s * 1.7, 5.4, 4.2, 0.35, 8.8, 'col:#4a3c34', undefined, -s * 26, 0, false);
      S.cyl(dc, lx - 10, 0, 1.8, 9, 'col:#c8c8c0', undefined, 12, 1.8, false); S.cyl(dc, lx - 10, 9, 1.9, 0.6, 'col:#8a9098', undefined, 12, 0.2, false);
      for (let k = 0; k < 8; k++) { S.bx(dc - 9 + k * 2.4, lx + 13, 0.6, 0.18, 1.2, 0.18, 'col:#8a6a48', undefined, false); } S.bx(dc - 1, lx + 13, 0.9, 0.12, 0.12, 17, 'col:#8a6a48', undefined, false);
    });
  }
  function windmill(S, dc, lx, r) {   // v182 : mat conique, nacelle, moyeu et trois pales effilees (blanc, gris clair en bout)
    S.place(dc, lx, 10, 10, 0, 40, () => { const hub = 27;
      S.cyl(dc, lx, 0, 2.5, 1.6, 'col:#8d99a5', undefined, 10, 2.4, false); S.cyl(dc, lx, 1.6, 2.2, hub * 0.55, 'col:#f4f6f8', undefined, 10, 1.6, false); S.cyl(dc, lx, 1.6 + hub * 0.55, 1.6, hub * 0.45 - 0.6, 'col:#e6ebef', undefined, 10, 1.1, false);
      S.bx(dc + 1.6, lx, hub + 0.2, 2.4, 2.6, 6.4, 'col:#dfe5ea', undefined, false); S.bx(dc - 1.4, lx, hub + 0.2, 1.9, 1.9, 1.8, 'col:#c3ccd4', undefined, false);
      const a0 = r() * 6.28; for (let k = 0; k < 3; k++) { const a = a0 + k * 2.0944, sn = Math.sin(a), cs = Math.cos(a);
        S.bxr(dc - 2.0, lx + sn * 5.2, hub + cs * 5.2, 1.7, 9.6, 0.34, 'col:#f9fbfc', undefined, -a * DEG, 0, false); S.bxr(dc - 2.0, lx + sn * 14, hub + cs * 14, 0.95, 9, 0.28, 'col:#dde5ec', undefined, -a * DEG, 0, false); } });
  }
  function pylonLine(S, dc, lx) { S.place(dc, lx, 8, 4, 0, 32, () => { S.bx(dc, lx, 14, 1.2, 28, 1.2, 'metal', '#8a8e96', false); S.bx(dc, lx, 24, 14, 0.6, 0.6, 'metal', '#8a8e96', false); S.bx(dc, lx, 20, 10, 0.6, 0.6, 'metal', '#8a8e96', false); }); }
  function haystack(S, dc, lx, r) { S.place(dc, lx, 8, 8, 0, 4, () => { S.cyl(dc, lx, 0, 2.4, 3.4, 'col:' + pick(r, ['#d8b860', '#c8a850']), undefined, 10, 2.4, false); }); }

  // ---------- sol lisse : une vraie surface continue (normales calculees sur le terrain, pas de tranches) avec un degrade de verts et de champs ----------
  const GC = { a: new THREE.Color('#44540d'), b: new THREE.Color('#4a5a0e'), f: new THREE.Color('#516310'), c: new THREE.Color(), g: new THREE.Color('#77797a') };
  Z.evoGC = GC;
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
        pos.push(p[0], p[1], p[2]); nor.push(_v[2].x, _v[2].y, _v[2].z); uv.push(p[0], p[2]);
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
    };
    return m;
  })());
  // couleurs relevees sur la reference : base sombre #3f5a14, milieu #6e811d, pointe #8aa030 ; buisson sauge #7f9560 / #9bb070
  const GB = ['#3f5a14', '#47621a', '#3a5a1c', '#4f6a1c'].map((h) => new THREE.Color(h)), GM2 = ['#6e811d', '#76891f', '#667d1c'].map((h) => new THREE.Color(h)), GT = ['#8aa030', '#94a834', '#7f982c', '#9ab038'].map((h) => new THREE.Color(h));
  const SG = ['#7f9560', '#8aa066', '#728a58'].map((h) => new THREE.Color(h)), SGT = ['#a4b87a', '#9bb070', '#b0c286'].map((h) => new THREE.Color(h));
  // v177 : HERBE EN TOUFFES ALLONGEES, d'UNE seule couleur (celle du sol sous elles) avec un degrade : plus sombre en bas, plus clair en haut.
  // Chaque touffe est une ligne de brins fins (monticule), orientee au hasard ; tres serrees et partout ou le sol est vert ; jamais sur le beton ni sous les batiments.
  const _gc = new THREE.Color(), _b = new THREE.Color();
  const _qi = new THREE.Quaternion(), _pt = new THREE.Vector3();
  // v179 : toute boite posee au sol (dalle, route, mur, batiment) est memorisee en 3D (centre, orientation, demi-dimensions) : l'herbe ne pousse jamais dedans ni au-dessus
  if (CC.LevelBuilder && !CC.LevelBuilder.prototype._grassHook) {
    const _box = CC.LevelBuilder.prototype.box; CC.LevelBuilder.prototype._grassHook = true;
    CC.LevelBuilder.prototype.box = function (o) {
      try { if (o && o.s && !o.ground && o.render !== false && o.s[0] * o.s[2] >= 2.5 && o.s[0] < 160 && o.s[2] < 160 && o.mat !== 'waterSurf' && o.mat !== 'glass') { (this._pave = this._pave || []).push({ c: new THREE.Vector3(o.p[0], o.p[1], o.p[2]), q: this.quatFrom(o.r).invert(), hx: o.s[0] / 2, hy: o.s[1] / 2, hz: o.s[2] / 2 }); } } catch (e) { /* ignore */ }
      return _box.apply(this, arguments);
    };
  }
  const solidIn = (L, x, y, z) => { if (!L) return false; _pt.set(x, y, z); for (let k = 0; k < L.length; k++) { const q = L[k]; if (Math.abs(x - q.c.x) > q.hx + q.hz + 1 || Math.abs(z - q.c.z) > q.hx + q.hz + 1) continue; const p = _pt.clone().sub(q.c).applyQuaternion(q.q); if (Math.abs(p.x) < q.hx + 0.5 && Math.abs(p.z) < q.hz + 0.5 && y > q.c.y - q.hy - 0.3 && y < q.c.y + q.hy + 0.08 + (q.hy < 0.5 ? 0.6 : 0) && q.c.y - q.hy < y + 1.4) return true; } return false; };
  const solidAt = (b, x, y, z) => { if (solidIn(b._pave, x, y, z)) return true; for (const r of GREC) if (r.b !== b && r.b._pave && solidIn(r.b._pave, x, y, z)) return true; return false; };
  const GREC = [];   // v181 : herbe des derniers troncons : une dalle posee par un troncon voisin efface les touffes deja creees dessous
  // v179 : HERBE EN TOUFFES ALLONGEES. Meme couleur que le sol (base un peu plus sombre, pointe = couleur du sol). Densite repartie sur toute la largeur ; les touffes lointaines ont moins de brins (legerete).
  Z.flushGrass = function (ctx) {
    const jobs = ctx.grassJobs; if (!jobs || !jobs.length) return; ctx.grassJobs = null;
    const T = ctx.T, b = ctx.b, pos = [], nor = [], col = [], sway = [], far = [], tufts = [];
    for (let k = GREC.length - 1; k >= 0; k--) if (!GREC[k].b.root || !GREC[k].b.root.parent) GREC.splice(k, 1);
    const v = (x, y, z, c, w, f) => { pos.push(x, y, z); nor.push(0, 1, 0); col.push(c.r, c.g, c.b); sway.push(w); far.push(f); };
    for (const jb of jobs) {
      const { d, e, wet, sc, gf } = jb, len = e - d;
      // bandes de largeur (distance au centre) ; densite par metre : ~uniforme, un peu plus faible au loin ; nb = brins par touffe
      const bands = [[0, 14, 17, 16, 20, 1.15, 1], [14, 34, 9, 9, 11, 1.4, 1], [34, 62, 4.5, 6, 7, 1.9, 1]];
      let bi = 0;
      for (const [lo, hi, dens, nbLo, nbHi, wk, tri] of bands) {
        const area = 2 * (hi - lo), n = Math.max(2, Math.round(len * area * dens / 28)); bi++;
        for (let i = 0; i < n; i++) {
          const dd = d + len * hsh(d + i * 0.37 + lo, i * 1.9 + bi), lx = (hsh(i * 1.7 + hi, d * 0.13 + bi) < 0.5 ? -1 : 1) * (lo + (hi - lo) * hsh(i * 2.9 + bi, d * 0.7 + hi));
          if (wet && wet(dd, lx, sc, T)) continue;
          const p = T.at(dd, lx, 0); gcol(p[0], p[2], _gc); if (gf) gf(dd, lx, _gc, sc);
          if (!(_gc.g > _gc.b * 1.5 && _gc.g >= _gc.r * 0.82)) continue;
          if (solidAt(b, p[0], p[1], p[2])) continue;
          const sz = 0.9 + 0.7 * hsh(i, d * 0.7 + bi), L = (0.9 + 1.5 * hsh(i * 3.3, d + bi)) * sz, th = hsh(d + i, i * 3.3 + bi) * 3.1416, ca = Math.cos(th), sa = Math.sin(th), py = p[1] - 0.04, nb = nbLo + Math.floor(hsh(i, d * 2.1 + bi) * (nbHi - nbLo + 1));
          const tv0 = pos.length / 3; _b.copy(_gc).multiplyScalar(0.8);   // base : la couleur du sol un peu plus sombre ; pointe : la couleur du sol
          for (let j = 0; j < nb; j++) {
            const s = (hsh(j * 3.7, i + d) * 2 - 1) * 0.5, side = (hsh(j * 5.3, i * 1.1 + d) - 0.5) * 0.4 * sz, bx = p[0] + ca * s * L - sa * side, bz = p[2] + sa * s * L + ca * side;
            const hp = 0.45 + 0.55 * Math.cos(s * 3.1416), hh = (0.55 + 0.55 * hsh(j * 5.1, i + d)) * hp * sz * 1.25, w = 0.075 * sz * wk, lean = hh * 0.3 * (hsh(j * 7.1, i) - 0.4), dx = -sa * lean * 0.6 + ca * lean * 0.5, dz = ca * lean * 0.6 + sa * lean * 0.5;
            if (tri === 3) {
              v(bx - ca * w * 0.4 - sa * w, py, bz - sa * w * 0.4 + ca * w, _b, 0, 230); v(bx + ca * w * 0.4 + sa * w, py, bz + sa * w * 0.4 - ca * w, _b, 0, 230); v(bx + dx * 0.4 - ca * w * 0.3, py + hh * 0.55, bz + dz * 0.4 - sa * w * 0.3, _gc, hh * 0.5, 230);
              v(bx + ca * w * 0.4 + sa * w, py, bz + sa * w * 0.4 - ca * w, _b, 0, 230); v(bx + dx * 0.4 + ca * w * 0.3, py + hh * 0.55, bz + dz * 0.4 + sa * w * 0.3, _gc, hh * 0.5, 230); v(bx + dx * 0.4 - ca * w * 0.3, py + hh * 0.55, bz + dz * 0.4 - sa * w * 0.3, _gc, hh * 0.5, 230);
              v(bx + dx * 0.4 - ca * w * 0.3, py + hh * 0.55, bz + dz * 0.4 - sa * w * 0.3, _gc, hh * 0.5, 230); v(bx + dx * 0.4 + ca * w * 0.3, py + hh * 0.55, bz + dz * 0.4 + sa * w * 0.3, _gc, hh * 0.5, 230); v(bx + dx, py + hh, bz + dz, _gc, hh, 230);
            } else { v(bx - sa * w, py, bz + ca * w, _b, 0, 230); v(bx + sa * w, py, bz - ca * w, _b, 0, 230); v(bx + dx, py + hh, bz + dz, _gc, hh, 230); }
          }
          tufts.push([p[0], p[1], p[2], tv0, pos.length / 3]);
        }
      }
      // petites fleurs par-ci par-la
      const FL = ['#ffffff', '#ffffff', '#ffd83d', '#ffd83d', '#4f8ef7', '#8a5be8', '#ff6fae', '#ff9a3d'].map((h) => new THREE.Color(h)), nf = Math.max(2, Math.round(len * 1.5));
      for (let i = 0; i < nf; i++) {
        const dd = d + len * hsh(d + i * 0.91, i * 1.3), lx = (hsh(i * 2.3, d * 0.31) * 2 - 1) * 34; if (wet && wet(dd, lx, sc, T)) continue;
        const p = T.at(dd, lx, 0); gcol(p[0], p[2], _gc); if (gf) gf(dd, lx, _gc, sc); if (!(_gc.g > _gc.b * 1.5 && _gc.g >= _gc.r * 0.82) || solidAt(b, p[0], p[1], p[2])) continue;
        const fv0 = pos.length / 3, fc = FL[Math.floor(hsh(Math.floor(dd / 11) * 1.7, Math.floor(lx / 11) + 3.1) * FL.length)], hgt = 0.35 + 0.4 * hsh(i, d), bx = p[0], bz = p[2], py = p[1] - 0.03, r0 = 0.1 + 0.04 * hsh(i * 2, d); _b.copy(_gc).multiplyScalar(0.8);
        v(bx, py, bz, _b, 0, 90); v(bx + 0.02, py, bz, _b, 0, 90); v(bx, py + hgt, bz, _gc, hgt * 0.5, 90);
        for (let q = 0; q < 5; q++) { const a = q / 5 * 6.2832, a2 = (q + 1) / 5 * 6.2832; v(bx + Math.cos(a) * r0, py + hgt, bz + Math.sin(a) * r0, fc, hgt * 0.5, 90); v(bx + Math.cos(a2) * r0, py + hgt, bz + Math.sin(a2) * r0, fc, hgt * 0.5, 90); v(bx, py + hgt + 0.04, bz, fc, hgt * 0.5, 90); }
        tufts.push([p[0], p[1], p[2], fv0, pos.length / 3]);
      }
    }
    // les dalles de CE troncon effacent les touffes des troncons voisins deja posees dessous
    if (b._pave) for (const r of GREC) { const A_ = r.mesh.geometry.attributes.position; let ch = false; for (const t of r.tufts) { if (t[5]) continue; if (solidIn(b._pave, t[0], t[1], t[2])) { t[5] = 1; ch = true; for (let k = t[3]; k < t[4]; k++) A_.setXYZ(k, t[0], t[1] - 5, t[2]); } } if (ch) A_.needsUpdate = true; }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1)); g.setAttribute('aFar', new THREE.Float32BufferAttribute(far, 1));
    const mesh = new THREE.Mesh(g, grassMat()); mesh.frustumCulled = true; mesh.receiveShadow = false; mesh.onBeforeRender = (r, sc, cam) => { GU.value = performance.now() / 1000; GCAM.value.copy(cam.position); }; b.add(mesh);
    GREC.push({ b, mesh, tufts }); while (GREC.length > 5) GREC.shift();
  };

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
