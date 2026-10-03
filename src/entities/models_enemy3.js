/* v101 : DIX NOUVEAUX ENGINS (un silhouette propre chacun, pas des recolorations) pour les zones nouvelles :
 *   buggy (canyon) · arcticSam (banquise) · mortar (volcan) · recon (jungle, néon) · dozer (barrage, carrière) · quad (drone, air) · haul (carrière) · tel (lancement) · tanker (autoroute) · rib (vedette rapide, eau)
 * Conventions de models_enemy.js : avant = −Z ; « comme le char » = turret / gun / slide / muzzle / body ; volants : userData.gen + anim. */
(function () {
  const M0 = CC.Models, { lam, basic, box, cyl, cylX, cylZ, plateY } = M0.kit, bake = M0.bake, V = THREE.Vector3, M = CC.BossModels;
  const LIV = [
    { hull: '#3d4c36', dark: '#2b3727', light: '#56654b', camo: '#2a3322', acc: '#d8a020' }, { hull: '#8a7a58', dark: '#62563c', light: '#a8996f', camo: '#5a4c32', acc: '#b03a2a' },
    { hull: '#5d6269', dark: '#3f434a', light: '#7a8088', camo: '#2f3338', acc: '#e0e0e0' }, { hull: '#b8bec6', dark: '#8a9098', light: '#d8dde2', camo: '#98a0aa', acc: '#c03a2a' },
  ];
  const SNOW = { hull: '#e4e9ee', dark: '#8f9aa6', light: '#f4f8fc', camo: '#c4d0dc', acc: '#d85a1a' }, MINE = { hull: '#d8a820', dark: '#5a4a18', light: '#f0c840', camo: '#8a6a18', acc: '#1c1c1c' };
  const liv = (t) => LIV[(((t || 0) % LIV.length) + LIV.length) % LIV.length];
  const mats = (P) => ({ hull: lam(P.hull), dark: lam(P.dark), light: lam(P.light), camo: lam(P.camo), accB: basic(P.acc), metal: lam('#2d2f2c'), black: lam('#141416'), glass: new THREE.MeshPhongMaterial({ color: '#1c2c3e', specular: '#8aa8c8', shininess: 80 }), rubber: lam('#161616'), rim: lam('#5a5c58') });
  const fin = (g, body, turret, gunPivot, slide, muzzle, size, center, exhausts, extra) => { Object.assign(g.userData, { turret, gun: gunPivot, slide, muzzle, body, tankLike: true, exhausts, size, center }, extra || {}); return bake(g, [body, turret, gunPivot, slide].concat((extra && extra.keep) || [])); };
  const gun = (m, body, y, z, mat, len, sx) => { const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(sx || 0, y, z); body.add(turret); cyl(0.45, 0.5, 0.14, m.metal, 12, turret).position.y = 0.07; box(0.8, 0.45, 0.8, mat, 0, 0.4, 0, turret); const gp = new THREE.Group(); gp.position.set(0, 0.45, -0.4); turret.add(gp); const slide = new THREE.Group(); gp.add(slide); cylZ(0.09, 0.11, 0.5, m.dark, 8, 0, 0, 0, slide); cylZ(0.05, 0.05, len, m.metal, 8, 0, 0, -0.5 - len / 2, slide); const mz = new THREE.Object3D(); mz.position.set(0, 0, -0.5 - len); slide.add(mz); return { turret, gp, slide, mz }; };
  const track = (m, body, sx, len, z0, w) => { box(w || 0.9, 0.9, len, m.rubber, sx, 0.55, z0, body); for (let i = 0; i < 4; i++) cylX(0.42, 0.42, (w || 0.9) + 0.1, m.dark, 12, sx, 0.55, z0 - len / 2 + 0.6 + i * (len - 1.2) / 3, body); box((w || 0.9) + 0.06, 0.1, len + 0.1, m.dark, sx, 1.02, z0, body); };
  const wheels = (m, body, xs, zs, r, w) => { for (const sx of xs) for (const z of zs) { cylX(r, r, w || 0.42, m.rubber, 14, sx, r, z, body); cylX(r * 0.55, r * 0.55, (w || 0.42) + 0.04, m.rim, 10, sx, r, z, body); } };

  // ---------- buggy du désert : cage, grosses roues, mitrailleuse arrière ----------
  M.buggy = (tint) => { const P = liv(tint === undefined ? 1 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(1.5, 0.3, 3.8, m.black, 0, 0.8, 0, body); wheels(m, body, [-1.15, 1.15], [-1.35, 1.35], 0.62, 0.5); box(1.4, 0.4, 1.4, m.hull, 0, 1.15, -1.5, body); box(1.2, 0.04, 1.2, m.camo, 0, 1.37, -1.5, body);
    for (const sx of [-1, 1]) { box(0.07, 1.3, 0.07, m.metal, sx * 0.7, 1.55, -0.5, body); box(0.07, 1.3, 0.07, m.metal, sx * 0.7, 1.55, 0.9, body); box(0.07, 0.07, 1.5, m.metal, sx * 0.7, 2.2, 0.2, body); box(0.4, 0.5, 0.5, m.dark, sx * 0.35, 1.15, 0.2, body); }
    box(1.4, 0.07, 0.07, m.metal, 0, 2.2, -0.5, body); box(1.4, 0.07, 0.07, m.metal, 0, 2.2, 0.9, body); box(1.0, 0.5, 0.9, m.hull, 0, 1.2, 1.7, body); cylX(0.45, 0.45, 0.2, m.rubber, 12, 0, 1.6, 2.2, body).rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) { const hl = box(0.3, 0.2, 0.08, basic('#fff0c8'), sx * 0.5, 1.25, -2.2, body); hl.castShadow = false; } cyl(0.02, 0.02, 2.4, m.metal, 4, body).position.set(0.6, 2.4, 1.2); box(0.5, 0.4, 0.14, basic(P.acc), -0.6, 2.4, 1.2, body);
    const T = gun(m, body, 1.45, 1.0, m.dark, 1.3); return fin(g, body, T.turret, T.gp, T.slide, T.mz, [2.9, 2.8, 4.8], [0, 1.4, 0], [new V(0.5, 0.9, 2.0)], { elev: [-0.1, 1.0] }); };

  // ---------- site antiaérien arctique à chenilles (4 tubes) ----------
  M.arcticSam = () => { const m = mats(SNOW), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    for (const sx of [-1, 1]) track(m, body, sx * 1.35, 5.6, 0.2); box(2.3, 0.6, 5.6, m.dark, 0, 1.05, 0.2, body); box(2.5, 1.2, 1.8, m.hull, 0, 1.75, -2.2, body); box(2.2, 0.6, 0.06, m.glass, 0, 2.0, -3.12, body); box(2.4, 0.1, 3.4, m.light, 0, 1.45, 1.4, body);
    for (let i = 0; i < 4; i++) box(0.12, 0.5, 0.12, m.metal, -0.9 + i * 0.6, 1.8, 0.5, body); cyl(0.03, 0.03, 2.4, m.metal, 4, body).position.set(1.0, 3.2, -2.0); cyl(0.6, 0.7, 0.4, m.light, 12, body).position.set(-0.8, 3.0, -2.1);
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 1.55, 1.6); body.add(turret); cyl(0.9, 1.0, 0.25, m.metal, 14, turret).position.y = 0.12; box(1.8, 0.4, 1.8, m.dark, 0, 0.45, 0, turret);
    const gp = new THREE.Group(); gp.position.set(0, 0.8, 0.4); turret.add(gp); const slide = new THREE.Group(); gp.add(slide); box(2.0, 0.15, 3.0, m.dark, 0, -0.5, -1.1, slide);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { cylZ(0.28, 0.28, 3.2, m.light, 10, -0.5 + c * 1.0, -0.2 + r * 0.7, -1.2, slide); cylZ(0.3, 0.3, 0.1, basic('#c03a2a'), 10, -0.5 + c * 1.0, -0.2 + r * 0.7, -2.85, slide); }
    const mz = new THREE.Object3D(); mz.position.set(0, 0.1, -2.9); slide.add(mz); return fin(g, body, turret, gp, slide, mz, [3.4, 4.0, 6.8], [0, 1.9, 0], [new V(0.8, 1.5, 3.2)], { elev: [0.35, 1.4] }); };

  // ---------- mortier lourd sur chenillette ----------
  M.mortar = (tint) => { const P = liv(tint === undefined ? 0 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    for (const sx of [-1, 1]) track(m, body, sx * 1.15, 4.4, 0, 0.8); plateY([[-1.0, -2.2], [1.0, -2.2], [1.2, -1.2], [1.2, 2.2], [-1.2, 2.2], [-1.2, -1.2]], 0.9, m.hull, 0.1, body).position.y = 0.9; box(2.0, 0.06, 4.0, m.camo, 0, 1.85, 0, body);
    box(1.4, 0.5, 1.2, m.dark, 0.0, 2.1, -1.4, body); box(0.9, 0.2, 0.06, m.glass, 0, 2.2, -2.0, body); for (let i = 0; i < 3; i++) box(0.5, 0.4, 0.4, m.light, -0.7 + i * 0.7, 2.1, 1.7, body);
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 1.9, 0.3); body.add(turret); cyl(0.75, 0.8, 0.2, m.metal, 14, turret).position.y = 0.1; box(1.3, 0.5, 1.3, m.hull, 0, 0.45, 0, turret);
    const gp = new THREE.Group(); gp.position.set(0, 0.6, -0.4); turret.add(gp); const slide = new THREE.Group(); gp.add(slide); cylZ(0.34, 0.4, 0.8, m.dark, 12, 0, 0, 0, slide); cylZ(0.2, 0.2, 2.8, m.metal, 12, 0, 0, -1.8, slide); cylZ(0.28, 0.28, 0.4, m.dark, 12, 0, 0, -1.0, slide);
    const mz = new THREE.Object3D(); mz.position.set(0, 0, -3.3); slide.add(mz); return fin(g, body, turret, gp, slide, mz, [3.2, 3.0, 5.0], [0, 1.5, 0], [new V(0.7, 1.4, 2.2)], { elev: [0.7, 1.45] }); };

  // ---------- voiture blindée de reconnaissance 6×6 à tourelle jumelée ----------
  M.recon = (tint) => { const P = liv(tint === undefined ? 0 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    plateY([[-1.0, -3.4], [1.0, -3.4], [1.35, -1.6], [1.35, 3.2], [-1.35, 3.2], [-1.35, -1.6]], 1.0, m.hull, 0.14, body).position.y = 0.95; box(2.3, 0.05, 4.6, m.camo, 0, 2.0, 0.4, body); box(1.5, 0.4, 1.6, m.hull, 0, 1.7, -2.7, body).rotation.x = -0.45;
    wheels(m, body, [-1.35, 1.35], [-2.2, 0, 2.2], 0.6, 0.45); for (const sx of [-1, 1]) { box(0.3, 0.1, 5.4, m.dark, sx * 1.3, 0.5, 0, body); const hl = box(0.28, 0.2, 0.08, basic('#fff0c8'), sx * 0.7, 1.45, -3.42, body); hl.castShadow = false; box(0.4, 0.6, 0.3, m.metal, sx * 1.4, 1.5, 3.0, body); }
    box(1.8, 0.4, 0.06, m.glass, 0, 1.95, -2.1, body); cyl(0.025, 0.025, 2.2, m.metal, 4, body).position.set(-0.9, 3.0, 2.4);
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 2.0, 0.4); body.add(turret); cyl(0.7, 0.75, 0.16, m.metal, 14, turret).position.y = 0.08; box(1.5, 0.5, 1.3, m.hull, 0, 0.45, 0, turret); box(1.7, 0.2, 0.06, m.dark, 0, 0.7, -0.7, turret);
    const gp = new THREE.Group(); gp.position.set(0, 0.5, -0.6); turret.add(gp); const slide = new THREE.Group(); gp.add(slide); for (const sx of [-1, 1]) { cylZ(0.1, 0.12, 0.5, m.dark, 8, sx * 0.35, 0, 0, slide); cylZ(0.05, 0.05, 1.7, m.metal, 8, sx * 0.35, 0, -1.2, slide); }
    const mz = new THREE.Object3D(); mz.position.set(0, 0, -2.1); slide.add(mz); return fin(g, body, turret, gp, slide, mz, [3.0, 3.2, 7.0], [0, 1.5, 0], [new V(0.8, 1.0, 3.4)], { elev: [-0.1, 1.0] }); };

  // ---------- bulldozer blindé à lame ----------
  M.dozer = (tint) => { const P = liv(tint === undefined ? 1 : tint), m = mats(Object.assign({}, MINE, tint === undefined ? {} : {})), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    for (const sx of [-1, 1]) { track(m, body, sx * 1.45, 4.6, 0.3, 1.0); } box(2.4, 0.8, 4.4, m.hull, 0, 1.3, 0.5, body); box(2.0, 1.4, 1.9, m.hull, 0, 2.3, 0.6, body); box(1.7, 0.7, 0.06, m.glass, 0, 2.55, -0.36, body); for (const sx of [-1, 1]) box(0.06, 0.6, 1.2, m.glass, sx * 1.02, 2.55, 0.6, body);
    box(2.2, 0.08, 2.0, m.dark, 0, 3.05, 0.6, body); cyl(0.2, 0.2, 0.9, m.metal, 8, body).position.set(0.8, 3.3, 1.5); box(2.4, 0.9, 1.2, m.dark, 0, 1.1, 2.4, body);
    const blade = box(4.6, 1.5, 0.4, m.hull, 0, 1.0, -3.0, body); blade.rotation.x = -0.18; box(4.7, 0.2, 0.5, m.dark, 0, 0.4, -3.1, body); for (const sx of [-1, 1]) { box(0.25, 0.25, 2.6, m.metal, sx * 1.5, 1.2, -1.8, body); box(0.4, 1.2, 0.5, m.hull, sx * 2.3, 1.0, -3.0, body); }
    const T = gun(m, body, 3.1, 0.2, m.dark, 1.2); return fin(g, body, T.turret, T.gp, T.slide, T.mz, [5.0, 3.8, 6.6], [0, 1.9, -0.2], [new V(0.8, 3.2, 1.6)], { elev: [-0.1, 0.9] }); };

  // ---------- haul : tombereau de mine géant, tourelle sur la cabine ----------
  M.haul = () => { const m = mats(MINE), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(4.0, 0.8, 9.0, m.dark, 0, 1.6, 0.4, body); for (const sx of [-1, 1]) for (const z of [-2.8, 3.2]) { cylX(1.5, 1.5, 1.1, m.rubber, 18, sx * 2.3, 1.5, z, body); cylX(0.8, 0.8, 1.16, m.rim, 12, sx * 2.3, 1.5, z, body); }
    box(3.4, 1.6, 2.6, m.hull, -0.2, 3.0, -3.6, body); box(3.0, 0.9, 0.06, m.glass, -0.2, 3.3, -4.92, body); box(3.6, 0.1, 3.0, m.dark, -0.2, 3.9, -3.6, body); plateY([[-1.7, -1.5], [1.7, -1.5], [2.1, 4.4], [-2.1, 4.4]], 2.4, m.hull, 0.12, body).position.y = 2.2; for (let i = 0; i < 4; i++) box(0.1, 2.2, 0.1, m.dark, -1.6 + i * 1.07, 3.3, 1.5, body).scale.z = 40;
    box(4.4, 0.4, 0.4, m.dark, 0, 4.0, -1.4, body); box(2.6, 0.5, 1.0, m.light, 0, 3.2, 4.3, body); const T = gun(m, body, 3.95, -3.3, m.dark, 1.6);
    return fin(g, body, T.turret, T.gp, T.slide, T.mz, [5.2, 4.8, 10.4], [0, 2.6, 0], [new V(1.2, 4.0, -3.2)], { elev: [-0.1, 0.9] }); };

  // ---------- lanceur-transporteur (TEL) : un missile dressé sur le plateau ----------
  M.tel = (tint) => { const P = liv(tint === undefined ? 2 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(2.4, 0.4, 9.0, m.black, 0, 1.0, 0, body); wheels(m, body, [-1.2, 1.2], [-3.2, -1.3, 1.6, 3.5], 0.72, 0.5); box(2.5, 1.3, 2.0, m.hull, 0, 2.1, -3.6, body); box(2.3, 0.5, 0.06, m.glass, 0, 2.6, -4.62, body); box(2.6, 0.08, 2.0, m.camo, 0, 2.78, -3.6, body);
    for (const sx of [-1, 1]) { const hl = box(0.3, 0.22, 0.08, basic('#fff0c8'), sx * 0.8, 1.5, -4.62, body); hl.castShadow = false; box(0.4, 0.6, 0.4, m.metal, sx * 1.35, 1.5, -0.1, body); } box(2.4, 0.5, 5.6, m.hull, 0, 1.45, 1.4, body); cyl(0.03, 0.03, 2.4, m.metal, 4, body).position.set(-0.9, 3.8, -3.0);
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 1.7, 3.3); body.add(turret); cyl(0.9, 1.0, 0.25, m.metal, 14, turret).position.y = 0.12;
    const gp = new THREE.Group(); gp.position.set(0, 0.7, 1.2); turret.add(gp); const slide = new THREE.Group(); gp.add(slide); box(1.3, 0.2, 5.4, m.dark, 0, -0.3, -2.4, slide); cylZ(0.5, 0.5, 5.8, m.light, 14, 0, 0.3, -2.5, slide); cylZ(0.1, 0.5, 1.2, basic('#c03a2a'), 14, 0, 0.3, -5.9, slide);
    for (const sx of [-1, 1]) for (const z of [-0.8, -1.4]) box(0.05, 0.9, 0.8, m.dark, sx * 0.5, 0.3, z, slide).rotation.z = sx * 0.4; box(0.9, 0.1, 0.9, m.hull, 0, -0.1, -0.2, slide);
    const mz = new THREE.Object3D(); mz.position.set(0, 0.3, -6.2); slide.add(mz); return fin(g, body, turret, gp, slide, mz, [3.0, 3.6, 10.4], [0, 1.9, 0], [new V(0.9, 1.0, -3.6)], { elev: [0.15, 1.35] }); };

  // ---------- camion-citerne armé ----------
  M.tanker = (tint) => { const P = liv(tint === undefined ? 1 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(2.2, 0.35, 8.0, m.black, 0, 1.0, 0, body); wheels(m, body, [-1.15, 1.15], [-3.0, 0.4, 2.2, 3.7], 0.7, 0.5); box(2.4, 1.3, 1.9, m.hull, 0, 2.0, -3.3, body); box(2.3, 0.5, 0.06, m.glass, 0, 2.5, -4.27, body); box(2.5, 0.08, 1.9, m.camo, 0, 2.66, -3.3, body);
    for (const sx of [-1, 1]) { const hl = box(0.3, 0.22, 0.08, basic('#fff0c8'), sx * 0.8, 1.5, -4.27, body); hl.castShadow = false; }
    cylZ(1.15, 1.15, 5.6, m.light, 16, 0, 2.5, 1.7, body); cylZ(1.2, 1.2, 0.2, m.dark, 16, 0, 2.5, 4.5, body); cylZ(1.2, 1.2, 0.2, m.dark, 16, 0, 2.5, -1.1, body); box(0.6, 0.3, 0.6, m.dark, 0, 3.75, 1.7, body); box(2.3, 0.14, 5.6, basic(P.acc), 0, 2.5, 1.7, body);
    for (const sx of [-1, 1]) { box(0.3, 0.3, 1.2, m.dark, sx * 1.25, 1.4, 4.2, body); cylZ(0.12, 0.12, 1.4, m.metal, 6, sx * 1.3, 1.2, 4.6, body); } cyl(0.03, 0.03, 2.6, m.metal, 4, body).position.set(-0.9, 3.6, -3.0);
    const T = gun(m, body, 3.55, -3.3, m.dark, 1.4); return fin(g, body, T.turret, T.gp, T.slide, T.mz, [2.8, 3.8, 9.0], [0, 2.0, 0], [new V(0.9, 1.0, -3.8)], { elev: [-0.1, 1.0] }); };

  // ---------- vedette rapide (RIB) à coque gonflable, bateau : reste sur l'eau ----------
  M.rib = (tint) => { const P = liv(tint === undefined ? 2 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body); const tube = lam('#2a2c30');
    plateY([[-1.2, -3.2], [1.2, -3.2], [1.5, 0], [1.4, 3.0], [-1.4, 3.0], [-1.5, 0]], 0.5, m.hull, 0.08, body).position.y = 0.4; for (const sx of [-1, 1]) { cylZ(0.4, 0.4, 6.4, tube, 10, sx * 1.55, 0.95, 0, body); cylZ(0.05, 0.4, 0.8, tube, 10, sx * 1.35, 0.95, -3.4, body); }
    box(1.2, 0.9, 1.0, m.dark, 0, 1.3, 0.8, body); box(1.0, 0.4, 0.06, m.glass, 0, 1.65, 0.28, body); for (const sx of [-1, 1]) { box(0.5, 0.7, 0.9, m.dark, sx * 0.7, 1.0, 2.9, body); cylZ(0.15, 0.15, 0.6, m.metal, 8, sx * 0.7, 1.0, 3.5, body); } cyl(0.03, 0.03, 2.0, m.metal, 4, body).position.set(0.5, 2.3, 0.8); box(0.8, 0.1, 0.08, basic(P.acc), -0.4, 2.0, 0.8, body);
    const T = gun(m, body, 0.7, -1.9, m.hull, 1.1, 0); return fin(g, body, T.turret, T.gp, T.slide, T.mz, [3.4, 2.8, 7.0], [0, 1.0, 0], [new V(0, 1.0, 3.6)], { elev: [-0.1, 0.8] }); };

  // ---------- quad : drone de combat à quatre rotors (volant, éclairé en néon) ----------
  M.quad = (tint) => { const g = new THREE.Group(), dark = lam('#26282e'), light = lam('#9aa0aa'), glow = basic('#30e8ff'), black = lam('#101114'), rotors = [];
    box(1.0, 0.45, 1.6, dark, 0, 0, 0, g); box(0.7, 0.2, 0.9, light, 0, 0.3, 0.1, g); const eye = box(0.4, 0.24, 0.1, glow, 0, 0, -0.85, g); eye.castShadow = false; cylZ(0.05, 0.05, 0.9, black, 6, 0, -0.25, -0.9, g); box(0.5, 0.12, 0.5, black, 0, -0.34, 0.1, g);
    for (const [x, z] of [[1.3, -1.1], [-1.3, -1.1], [1.3, 1.1], [-1.3, 1.1]]) { cylX(0.07, 0.07, Math.hypot(x, z) * 0.95, dark, 6, 0, 0, 0, g).visible = false; const arm = box(Math.abs(x), 0.1, 0.12, dark, x / 2, 0.05, z / 2, g); arm.rotation.y = -Math.atan2(z, x) * 0 + 0; box(0.12, 0.1, Math.abs(z), dark, x, 0.05, z / 2, g); cyl(0.14, 0.14, 0.25, black, 8, g).position.set(x, 0.15, z); const r = new THREE.Group(); r.position.set(x, 0.32, z); g.add(r); box(1.1, 0.02, 0.1, glow, 0, 0, 0, r); box(0.1, 0.02, 1.1, glow, 0, 0, 0, r); rotors.push(r); const l = box(0.12, 0.08, 0.12, glow, x, -0.05, z, g); l.castShadow = false; }
    g.userData = { gen: true, flying: true, size: [3.4, 1.0, 3.4], center: [0, 0.1, 0], firePoints: [new V(0, -0.25, -1.4)], anim: (dt, t) => { for (const r of rotors) r.rotation.y += dt * 40; g.position.y = Math.sin(t * 2.1) * 0.18; } };
    return bake(g, rotors); };
  // ---------- porte-avions : tracteur de pont armé (tug) et camion de pompiers d'aérodrome (crash tender) ----------
  const DECK = { hull: '#e8c020', dark: '#3a3a3e', light: '#f4d860', camo: '#8a7010', acc: '#c03a2a' }, RED = { hull: '#c8302a', dark: '#4a1c1a', light: '#e8e0d8', camo: '#8a2420', acc: '#f0e8d0' };
  M.tug = () => { const m = mats(DECK), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(2.2, 0.5, 4.0, m.dark, 0, 0.8, 0, body); wheels(m, body, [-1.1, 1.1], [-1.4, 1.3], 0.7, 0.55); box(1.9, 0.9, 2.6, m.hull, 0, 1.5, 0.4, body); box(1.7, 0.9, 1.5, m.hull, 0, 2.3, 0.9, body); box(1.6, 0.5, 0.06, m.glass, 0, 2.5, 0.12, body); box(1.8, 0.08, 1.7, m.dark, 0, 2.8, 0.9, body);
    box(1.0, 0.5, 1.1, m.hull, 0, 1.2, -1.8, body); box(0.3, 0.4, 0.6, m.metal, 0, 0.8, -2.5, body); for (const sx of [-1, 1]) { const l = box(0.25, 0.2, 0.08, basic('#ffb02b'), sx * 0.8, 3.0, 0.1, body); l.castShadow = false; } box(1.8, 0.06, 3.0, m.camo, 0, 2.0, -0.3, body).visible = false;
    const T = gun(m, body, 2.85, 0.9, m.dark, 1.2); return fin(g, body, T.turret, T.gp, T.slide, T.mz, [2.6, 3.4, 4.6], [0, 1.6, 0], [new V(0.6, 0.9, 1.9)], { elev: [-0.1, 1.0] }); };
  M.crashTender = () => { const m = mats(RED), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(2.5, 0.45, 8.4, m.black, 0, 1.0, 0, body); wheels(m, body, [-1.25, 1.25], [-3.0, -0.4, 2.2, 3.7], 0.74, 0.55); box(2.6, 1.3, 2.0, m.hull, 0, 2.1, -3.4, body); box(2.4, 0.5, 0.06, m.glass, 0, 2.6, -4.42, body); box(2.7, 0.1, 2.0, m.light, 0, 2.8, -3.4, body);
    box(2.6, 1.8, 5.2, m.hull, 0, 2.2, 1.3, body); box(2.7, 0.3, 5.3, m.light, 0, 1.6, 1.3, body); for (let i = 0; i < 4; i++) box(0.5, 0.9, 0.06, m.dark, 0.0 + (i - 1.5) * 1.1, 2.4, -1.32, body); for (const sx of [-1, 1]) { const b = box(0.7, 0.2, 0.3, basic('#3a8aff'), sx * 0.8, 3.0, -3.6, body); b.castShadow = false; box(0.3, 0.7, 4.4, m.dark, sx * 1.25, 2.0, 1.3, body); }
    cylZ(0.5, 0.5, 4.6, m.light, 12, 0, 3.4, 1.4, body); box(1.8, 0.2, 4.0, m.dark, 0, 3.2, 1.4, body);
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 3.2, -1.2); body.add(turret); cyl(0.5, 0.55, 0.2, m.metal, 12, turret).position.y = 0.1; box(0.7, 0.5, 0.8, m.dark, 0, 0.4, 0, turret);
    const gp = new THREE.Group(); gp.position.set(0, 0.5, -0.3); turret.add(gp); const slide = new THREE.Group(); gp.add(slide); cylZ(0.16, 0.2, 0.6, m.light, 10, 0, 0, 0, slide); cylZ(0.12, 0.12, 1.8, m.dark, 10, 0, 0, -1.2, slide); const mz = new THREE.Object3D(); mz.position.set(0, 0, -2.2); slide.add(mz);
    return fin(g, body, turret, gp, slide, mz, [3.0, 4.2, 9.2], [0, 2.1, 0], [new V(0.9, 1.0, -3.8)], { elev: [-0.05, 0.9] }); };
})();
