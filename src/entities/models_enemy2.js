/* v099 : CINQ NOUVEAUX ENGINS pour les zones nouvelles (mêmes conventions que models_enemy.js : avant = −Z, « comme le char » : turret / gun / slide / muzzle / body).
 *   apc (blindé à roues 8×8, tourelle téléopérée) · snowcat (transporteur arctique à chenilles, livrée blanche) · technical (pick-up armé d'une mitrailleuse lourde, sacs de sable)
 *   rocketTruck (camion lance-roquettes à 20 tubes) · hover (aéroglisseur d'assaut, hélice en rotation). */
(function () {
  const M0 = CC.Models, { lam, basic, box, cyl, cylX, cylZ, profileX, plateY } = M0.kit, bake = M0.bake, V = THREE.Vector3, M = CC.BossModels;
  const LIV = [
    { hull: '#3d4c36', dark: '#2b3727', light: '#56654b', camo: '#2a3322', acc: '#d8a020' },
    { hull: '#8a7a58', dark: '#62563c', light: '#a8996f', camo: '#5a4c32', acc: '#b03a2a' },
    { hull: '#5d6269', dark: '#3f434a', light: '#7a8088', camo: '#2f3338', acc: '#e0e0e0' },
    { hull: '#b8bec6', dark: '#8a9098', light: '#d8dde2', camo: '#98a0aa', acc: '#c03a2a' },
  ];
  const SNOW = { hull: '#e4e9ee', dark: '#8f9aa6', light: '#f4f8fc', camo: '#c4d0dc', acc: '#d85a1a' };
  const liv = (t) => LIV[(((t || 0) % LIV.length) + LIV.length) % LIV.length];
  const mats = (P) => ({ hull: lam(P.hull), dark: lam(P.dark), light: lam(P.light), camo: lam(P.camo), accB: basic(P.acc), metal: lam('#2d2f2c'), black: lam('#141416'), glass: new THREE.MeshPhongMaterial({ color: '#1c2c3e', specular: '#8aa8c8', shininess: 80 }), rubber: lam('#161616'), rim: lam('#5a5c58') });
  const finishTL = (g, body, turret, gunPivot, slide, muzzle, size, center, exhausts, extra) => {
    Object.assign(g.userData, { turret, gun: gunPivot, slide, muzzle, body, tankLike: true, exhausts, size, center }, extra || {});
    return bake(g, [body, turret, gunPivot, slide].concat((extra && extra.keep) || []));
  };
  const mount = (m, body, y, z, hullMat, gunLen, shield) => {   // tourelle téléopérée : base, caisson, canon, optique
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, y, z); body.add(turret);
    cyl(0.5, 0.55, 0.14, m.metal, 12, turret).position.y = 0.07; box(0.9, 0.5, 0.9, hullMat, 0, 0.42, 0, turret); box(0.5, 0.18, 0.3, m.glass, 0, 0.62, -0.46, turret); if (shield) box(1.0, 0.7, 0.06, m.dark, 0, 0.6, -0.55, turret);
    const gunPivot = new THREE.Group(); gunPivot.position.set(0, 0.45, -0.45); turret.add(gunPivot); const slide = new THREE.Group(); gunPivot.add(slide);
    cylZ(0.1, 0.12, 0.5, m.dark, 8, 0, 0, 0, slide); cylZ(0.05, 0.05, gunLen, m.metal, 8, 0, 0, -0.5 - gunLen / 2, slide); cylZ(0.085, 0.085, 0.4, m.dark, 8, 0, 0, -0.8, slide);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -0.5 - gunLen), slide.add(muzzle);
    return { turret, gunPivot, slide, muzzle };
  };

  // ---------- blindé à roues 8×8 ----------
  M.apc = (tint) => {
    const P = liv(tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    plateY([[-1.3, -3.6], [1.3, -3.6], [1.4, -2.2], [1.4, 3.3], [-1.4, 3.3], [-1.4, -2.2]], 1.3, m.hull, 0.12, body).position.y = 0.85;                                // caisse
    box(2.5, 0.55, 1.6, m.hull, 0, 1.55, -3.0, body).rotation.x = -0.5; box(2.2, 0.06, 5.4, m.camo, 0, 2.18, 0.3, body);                                      // glacis, toit
    box(1.6, 0.5, 0.06, m.glass, 0, 1.75, -2.5, body); for (const sx of [-1, 1]) { box(0.05, 0.4, 0.5, m.glass, sx * 1.42, 1.5, -0.8, body); box(0.3, 0.1, 5.8, m.dark, sx * 1.35, 0.55, 0, body); }
    for (const sx of [-1, 1]) for (const z of [-2.5, -0.85, 0.85, 2.5]) { cylX(0.58, 0.58, 0.45, m.rubber, 14, sx * 1.4, 0.58, z, body); cylX(0.3, 0.3, 0.5, m.rim, 10, sx * 1.4, 0.58, z, body); }
    box(2.4, 0.5, 0.3, m.dark, 0, 0.7, 3.5, body); for (const sx of [-1, 1]) { box(0.3, 0.2, 0.08, basic('#fff0c8'), sx * 0.8, 1.45, -3.62, body); box(0.4, 0.6, 0.3, m.metal, sx * 1.5, 1.6, 3.1, body); }
    cyl(0.025, 0.025, 2.4, m.metal, 4, body).position.set(-0.9, 3.4, 2.4); box(1.0, 0.25, 0.8, m.light, 0.4, 2.35, 2.2, body);
    const T = mount(m, body, 2.2, -0.2, m.hull, 1.6, true);
    return finishTL(g, body, T.turret, T.gunPivot, T.slide, T.muzzle, [3.2, 3.2, 7.6], [0, 1.5, 0], [new V(0.8, 1.0, 3.5)], { elev: [-0.1, 1.0] });
  };

  // ---------- transporteur arctique à chenilles ----------
  M.snowcat = () => {
    const m = mats(SNOW), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    for (const sx of [-1, 1]) { box(1.0, 1.1, 5.8, m.rubber, sx * 1.45, 0.6, 0.2, body); for (const z of [-2.3, -0.8, 0.7, 2.2]) cylX(0.48, 0.48, 1.05, m.dark, 12, sx * 1.45, 0.62, z + 0.2, body); box(1.06, 0.1, 6.0, m.dark, sx * 1.45, 1.2, 0.2, body); for (let i = 0; i < 9; i++) box(1.04, 0.06, 0.12, m.metal, sx * 1.45, 0.05, -2.4 + i * 0.6, body); }
    box(2.3, 0.7, 6.0, m.dark, 0, 0.95, 0.2, body); box(2.5, 1.5, 2.4, m.hull, 0, 1.95, -1.6, body); box(2.2, 0.8, 0.08, m.glass, 0, 2.3, -2.82, body); for (const sx of [-1, 1]) box(0.06, 0.7, 1.4, m.glass, sx * 1.27, 2.3, -1.6, body);
    box(2.6, 0.06, 2.6, m.light, 0, 2.7, -1.6, body); box(2.6, 1.3, 3.0, m.hull, 0, 1.85, 1.7, body); box(2.64, 0.35, 3.04, basic(SNOW.acc), 0, 1.45, 1.7, body); box(2.5, 0.06, 2.9, m.camo, 0, 2.52, 1.7, body);
    box(1.5, 0.12, 0.12, m.dark, 0, 2.85, -2.7, body); for (const sx of [-1, 1]) { const l = box(0.3, 0.2, 0.1, basic('#fff0c8'), sx * 0.6, 2.8, -2.78, body); l.castShadow = false; box(0.2, 0.2, 0.9, m.dark, sx * 1.1, 3.2, 1.8, body); }
    for (let i = 0; i < 3; i++) box(0.12, 0.9, 0.12, m.metal, -1.2 + i * 1.2, 3.0, 3.1, body); box(2.8, 0.1, 0.1, m.metal, 0, 3.4, 3.1, body);                                // galerie de toit chargée
    cyl(0.03, 0.03, 2.6, m.metal, 4, body).position.set(1.0, 4.0, 1.0);
    const T = mount(m, body, 2.75, 0.8, m.hull, 1.5, false);
    return finishTL(g, body, T.turret, T.gunPivot, T.slide, T.muzzle, [4.0, 3.6, 6.6], [0, 1.8, 0.2], [new V(0.8, 2.0, 3.3)], { elev: [-0.1, 1.0] });
  };

  // ---------- pick-up armé (« technical ») ----------
  M.technical = (tint) => {
    const P = liv(tint === undefined ? 1 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(2.0, 0.3, 5.2, m.black, 0, 0.85, 0, body);
    for (const sx of [-1, 1]) for (const z of [-1.7, 1.7]) { cylX(0.62, 0.62, 0.42, m.rubber, 14, sx * 1.1, 0.62, z, body); cylX(0.34, 0.34, 0.46, m.rim, 10, sx * 1.1, 0.62, z, body); box(0.6, 0.06, 1.2, m.dark, sx * 1.1, 1.3, z, body); }
    box(2.0, 0.7, 1.5, m.hull, 0, 1.35, -1.8, body); box(1.9, 0.05, 1.3, m.dark, 0, 1.72, -1.8, body); box(2.0, 0.14, 0.1, m.dark, 0, 1.1, -2.62, body);
    box(1.9, 0.9, 1.4, m.hull, 0, 1.85, -0.5, body); const ws = box(1.8, 0.6, 0.06, m.glass, 0, 2.0, -1.2, body); ws.rotation.x = 0.3; box(1.95, 0.08, 1.3, m.camo, 0, 2.34, -0.45, body);
    for (const sx of [-1, 1]) { box(0.05, 0.5, 0.9, m.glass, sx * 0.96, 2.0, -0.45, body); box(0.12, 0.3, 0.06, m.dark, sx * 1.05, 1.9, -1.2, body); const hl = box(0.3, 0.22, 0.08, basic('#fff0c8'), sx * 0.65, 1.45, -2.62, body); hl.castShadow = false; }
    box(2.0, 0.4, 2.3, m.hull, 0, 1.3, 1.6, body); for (const sx of [-1, 1]) box(0.08, 0.5, 2.3, m.dark, sx * 0.98, 1.65, 1.6, body);
    for (let i = 0; i < 4; i++) box(0.6, 0.4, 0.5, lam('#b8a67a'), -0.65 + (i % 2) * 1.3, 1.7 + (i > 1 ? 0.4 : 0), 2.3, body);                                                 // sacs de sable
    cylX(0.42, 0.42, 0.24, m.rubber, 12, 0, 1.6, 2.8, body).rotation.z = Math.PI / 2; for (let i = 0; i < 4; i++) box(1.5, 0.04, 0.04, m.black, 0, 1.15 + i * 0.07, -2.64, body);
    cyl(0.025, 0.025, 2.2, m.metal, 4, body).position.set(0.9, 2.9, 0.4); box(0.5, 0.35, 0.3, m.dark, -0.6, 1.8, 1.0, body);
    const T = mount(m, body, 1.5, 1.2, m.dark, 1.4, true);
    return finishTL(g, body, T.turret, T.gunPivot, T.slide, T.muzzle, [2.8, 3.0, 5.6], [0, 1.4, 0], [new V(0.6, 0.9, 2.7)], { elev: [-0.1, 1.2] });
  };

  // ---------- camion lance-roquettes à 20 tubes ----------
  M.rocketTruck = (tint) => {
    const P = liv(tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    box(2.2, 0.35, 8.0, m.black, 0, 1.0, 0, body); for (const sx of [-1, 1]) for (const z of [-2.9, -0.2, 2.4, 3.9]) { if (z === 3.9 && false) continue; cylX(0.7, 0.7, 0.5, m.rubber, 14, sx * 1.15, 0.7, z, body); cylX(0.38, 0.38, 0.54, m.rim, 10, sx * 1.15, 0.7, z, body); }
    box(2.4, 1.3, 1.9, m.hull, 0, 2.0, -3.2, body); box(2.3, 0.5, 0.06, m.glass, 0, 2.5, -4.17, body); box(2.5, 0.08, 1.9, m.camo, 0, 2.66, -3.2, body); for (const sx of [-1, 1]) { box(0.06, 0.5, 1.2, m.glass, sx * 1.22, 2.45, -3.1, body); const hl = box(0.3, 0.22, 0.08, basic('#fff0c8'), sx * 0.8, 1.5, -4.17, body); hl.castShadow = false; box(0.4, 0.5, 0.4, m.metal, sx * 1.35, 1.4, 0.5, body); }
    box(2.4, 0.5, 4.8, m.hull, 0, 1.45, 1.0, body); for (const sx of [-1, 1]) for (const z of [-0.6, 2.6]) { box(0.3, 0.9, 0.3, m.dark, sx * 1.4, 0.95, z, body); }            // stabilisateurs
    cyl(0.025, 0.025, 2.6, m.metal, 4, body).position.set(-0.9, 3.8, -2.6);
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 1.7, 1.8); body.add(turret); cyl(0.9, 1.0, 0.25, m.metal, 14, turret).position.y = 0.12; box(2.0, 0.4, 2.0, m.dark, 0, 0.45, 0, turret);
    const gunPivot = new THREE.Group(); gunPivot.position.set(0, 0.8, 0.8); turret.add(gunPivot); const slide = new THREE.Group(); gunPivot.add(slide);
    box(2.2, 0.15, 3.4, m.dark, 0, -0.55, -1.4, slide); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { cylZ(0.17, 0.17, 3.4, m.hull, 8, -0.8 + c * 0.4, -0.35 + r * 0.38, -1.5, slide); cylZ(0.12, 0.12, 0.06, m.black, 8, -0.8 + c * 0.4, -0.35 + r * 0.38, -3.22, slide); }
    box(2.3, 0.1, 0.5, basic(P.acc), 0, 0.5, -3.1, slide); box(0.2, 1.7, 0.3, m.dark, 1.1, 0, -0.1, slide); box(0.2, 1.7, 0.3, m.dark, -1.1, 0, -0.1, slide);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.2, -3.3); slide.add(muzzle);
    return finishTL(g, body, turret, gunPivot, slide, muzzle, [3.0, 4.0, 9.0], [0, 1.9, 0], [new V(0.9, 1.0, -3.5)], { elev: [0.1, 1.2] });
  };

  // ---------- aéroglisseur d'assaut ----------
  M.hover = (tint) => {
    const P = liv(tint === undefined ? 2 : tint), m = mats(P), g = new THREE.Group(), body = new THREE.Group(), prop = new THREE.Group(); g.add(body);
    plateY([[-1.9, -4.8], [1.9, -4.8], [2.6, -3.0], [2.6, 3.6], [1.9, 4.6], [-1.9, 4.6], [-2.6, 3.6], [-2.6, -3.0]], 0.9, m.hull, 0.14, body).position.y = 0.55;
    box(5.6, 0.55, 10.4, lam('#1a1c20'), 0, 0.28, 0, body);                                                                                                             // jupe
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; }
    box(3.2, 1.3, 3.0, m.hull, 0, 1.9, -1.4, body); box(3.0, 0.08, 2.8, m.camo, 0, 2.58, -1.4, body); box(2.9, 0.5, 0.06, m.glass, 0, 2.2, -2.92, body); for (const sx of [-1, 1]) { box(0.06, 0.6, 1.8, m.glass, sx * 1.62, 2.2, -1.4, body); box(0.12, 1.7, 0.5, m.dark, sx * 2.7, 1.6, 3.2, body); }
    box(4.4, 0.7, 0.2, m.dark, 0, 1.1, 3.0, body); for (const sx of [-1, 1]) { const duct = cyl(1.2, 1.2, 2.4, m.dark, 16, body); duct.position.set(sx * 1.55, 2.5, 3.0); }
    prop.position.set(0, 2.6, 3.9); body.add(prop); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; box(0.14, 2.2, 0.36, m.metal, Math.sin(a) * 1.1, Math.cos(a) * 1.1, 0, prop).rotation.z = -a; } box(0.5, 0.5, 0.5, m.dark, 0, 0, 0, prop);
    for (const sx of [-1, 1]) { box(0.18, 1.6, 1.6, m.hull, sx * 1.55, 3.0, 4.0, body); }
    const T = mount(m, body, 2.1, -3.2, m.hull, 1.5, false);
    return finishTL(g, body, T.turret, T.gunPivot, T.slide, T.muzzle, [5.8, 4.6, 10.6], [0, 1.6, 0], [new V(0, 2.4, 4.6)], { keep: [prop], anim: (dt) => { prop.rotation.z += dt * 24; }, elev: [-0.1, 0.9] });
  };
})();
