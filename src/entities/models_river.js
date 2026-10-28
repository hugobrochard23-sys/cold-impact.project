/* v281 : LA CANONNIERE FLUVIALE — l'ennemi du fleuve (niveau 2). Meme niveau de detail que le char : coque effilee a pavois blinde, passerelle a vitres pare-eclats, tourelle avant a canon
 * sur glissiere de recul (turret / gun / slide / muzzle, comme tous les engins « comme le char »), affut de mitrailleuses jumelees a l'arriere, deux paniers de roquettes, mat radar
 * tournant, projecteur, bouees, bittes, treuil d'ancre, futs, filet de camouflage, jets d'eau arriere et vague d'etrave. Avant = −Z. */
(function () {
  const M0 = CC.Models; if (!M0 || !M0.kit || !CC.BossModels) return;
  const { lam, basic, box, cyl, cylX, cylZ, profileX, plateY } = M0.kit, bake = M0.bake, V = THREE.Vector3, M = CC.BossModels;
  const LIV = [
    { hull: '#4b5a42', dark: '#2b3527', light: '#6c7a5c', camo: '#33432b', deck: '#8a7f60', acc: '#c8362a' },
    { hull: '#5a6068', dark: '#363a40', light: '#7c838c', camo: '#3a3f46', deck: '#6a6e72', acc: '#e0b020' },
    { hull: '#6a5a40', dark: '#40362a', light: '#8a7858', camo: '#4a3e2a', deck: '#9a8a68', acc: '#2a8a4a' },
  ];
  const liv = (t) => LIV[(((t || 0) % LIV.length) + LIV.length) % LIV.length];
  M.gunboat = (tint) => {
    const P = liv(tint === undefined ? 0 : tint), g = new THREE.Group(), body = new THREE.Group(), radar = new THREE.Group(); g.add(body);
    const hull = lam(P.hull), dark = lam(P.dark), light = lam(P.light), camo = lam(P.camo), deck = lam(P.deck), metal = lam('#2d2f2c'), black = lam('#141416'), accB = basic(P.acc), steel = lam('#6a7078');
    const glass = new THREE.MeshPhongMaterial({ color: '#1c2c3e', specular: '#9ab8d8', shininess: 60 });
    const camoTex = new THREE.MeshLambertMaterial({ map: CC.Textures && CC.Textures.get ? CC.Textures.get('camo') : null, color: '#9aa88a' });
    // --- coque : anti-salissures rouge sombre sous la flottaison, flancs, pont de bois, etrave en fer de lance ---
    plateY([[-1.55, 5.9], [1.55, 5.9], [1.7, -2.4], [0.95, -5.2], [0, -6.5], [-0.95, -5.2], [-1.7, -2.4]], 0.62, lam('#6a2a22'), 0.05, body).position.y = 0.0;
    plateY([[-1.75, 6.0], [1.75, 6.0], [1.95, -2.5], [1.05, -5.4], [0, -6.8], [-1.05, -5.4], [-1.95, -2.5]], 1.0, hull, 0.08, body).position.y = 0.62;
    plateY([[-1.55, 5.7], [1.55, 5.7], [1.7, -2.3], [0.9, -5.0], [0, -6.3], [-0.9, -5.0], [-1.7, -2.3]], 0.12, deck, 0.03, body).position.y = 1.62;
    for (const sx of [-1, 1]) {   // pavois blinde : plaques inclinees le long du bord, bande de couleur, boulons
      box(0.1, 0.62, 7.6, dark, sx * 1.86, 2.0, 1.9, body).rotation.z = sx * 0.12; box(0.1, 0.5, 3.6, dark, sx * 1.4, 1.95, -3.7, body).rotation.set(0, sx * 0.3, sx * 0.1);
      box(0.06, 0.1, 9.6, accB, sx * 1.93, 1.22, 0.5, body);
      for (let i = 0; i < 9; i++) box(0.05, 0.06, 0.06, metal, sx * 1.9, 2.18, -1.9 + i * 0.95, body);
      for (const z of [-5.2, -2.4, 0.4, 3.2, 5.6]) cyl(0.07, 0.09, 0.2, metal, 6, body).position.set(sx * 1.88, 1.74, z);   // bittes
    }
    box(3.3, 0.5, 0.12, dark, 0, 1.95, 5.95, body);   // tableau arriere
    for (const sx of [-0.7, 0.7]) { cylZ(0.26, 0.3, 0.5, metal, 10, sx, 1.0, 6.1, body); cylZ(0.17, 0.2, 0.2, black, 10, sx, 1.0, 6.4, body); }   // jets d'eau
    // camouflage : bandes de motif sur le pont avant et le pavois
    box(2.6, 0.03, 2.2, camoTex, 0, 1.7, -2.2, body); box(0.04, 0.4, 3.2, camoTex, 1.92, 1.95, 3.6, body); box(0.04, 0.4, 3.2, camoTex, -1.92, 1.95, 3.6, body);
    // --- treuil d'ancre et chaine a l'etrave, mat de pavillon ---
    cylX(0.17, 0.17, 0.7, metal, 10, 0, 1.95, -5.0, body); box(0.5, 0.3, 0.4, dark, 0, 1.78, -5.0, body); for (let i = 0; i < 4; i++) cyl(0.05, 0.05, 0.14, steel, 6, body).position.set(0.12 * (i % 2), 1.72, -5.5 - i * 0.18);
    cyl(0.025, 0.03, 1.3, metal, 6, body).position.set(0, 2.5, -5.9); box(0.5, 0.3, 0.02, accB, 0.26, 2.95, -5.9, body);
    // --- passerelle : bloc incline a vitres, toit debordant, hublots, echelle ---
    box(2.5, 1.0, 2.8, hull, 0, 2.18, 2.0, body);
    const front = box(2.5, 0.9, 0.14, dark, 0, 2.28, 0.58, body); front.rotation.x = 0.35;
    box(2.2, 0.32, 0.06, glass, 0, 2.45, 0.5, body).rotation.x = 0.35; for (const sx of [-1, 1]) { box(0.05, 0.3, 1.6, glass, sx * 1.27, 2.5, 1.9, body); for (let i = 0; i < 3; i++) box(0.04, 0.34, 0.04, metal, sx * 1.27, 2.5, 1.2 + i * 0.7, body); }
    box(2.7, 0.34, 3.0, hull, 0, 3.0, 2.0, body); box(2.8, 0.08, 3.1, dark, 0, 3.24, 2.0, body);
    for (let i = 0; i < 6; i++) box(0.9, 0.04, 0.06, metal, 0.9 * (i % 2 ? 1 : -1) * 0.5, 3.3, 1.0 + i * 0.4, body);
    for (const sx of [-1, 1]) { for (let i = 0; i < 3; i++) box(0.04, 0.06, 0.04, metal, sx * 1.4, 3.32, 0.8 + i * 1.2, body); box(0.04, 0.04, 3.0, metal, sx * 1.4, 3.42, 2.0, body); }   // garde-corps du toit
    for (let i = 0; i < 5; i++) box(0.05, 0.22, 0.05, metal, 1.28, 1.95 + i * 0.1 - 0.1, 3.4, body);
    // projecteur et mat radar
    cyl(0.16, 0.2, 0.3, black, 10, body).position.set(-0.8, 3.55, 1.0); box(0.1, 0.1, 0.1, basic('#fff6d0'), -0.8, 3.58, 0.84, body);
    cyl(0.05, 0.07, 1.5, metal, 8, body).position.set(0.3, 4.1, 2.6); radar.position.set(0.3, 4.9, 2.6); body.add(radar); box(1.3, 0.28, 0.07, dark, 0, 0, 0, radar); box(0.2, 0.2, 0.3, metal, 0, -0.1, 0, radar);
    cyl(0.018, 0.022, 1.6, metal, 4, body).position.set(-0.9, 4.1, 3.0); cyl(0.018, 0.022, 1.1, metal, 4, body).position.set(0.9, 3.9, 1.2);
    // --- affut arriere : couronne, bouclier incline, deux mitrailleuses jumelees, caisses de munitions ---
    cyl(0.5, 0.55, 0.14, metal, 12, body).position.set(0, 1.78, 4.5); box(0.9, 0.36, 0.7, dark, 0, 2.0, 4.5, body);
    box(1.1, 0.7, 0.08, dark, 0, 2.5, 4.05, body).rotation.x = -0.25; for (const sx of [-0.2, 0.2]) { cylZ(0.04, 0.04, 1.2, metal, 6, sx, 2.45, 3.6, body); box(0.12, 0.16, 0.34, metal, sx, 2.45, 4.2, body); }
    box(0.5, 0.26, 0.34, lam('#5a5a3a'), 0.9, 1.84, 4.8, body); box(0.4, 0.22, 0.3, lam('#4a4a30'), -0.85, 1.82, 5.0, body);
    // --- paniers de roquettes (2 x 6 tubes) sur les flancs avant de la passerelle ---
    for (const sx of [-1, 1]) { const pod = new THREE.Group(); pod.position.set(sx * 1.25, 3.55, 3.1); pod.rotation.set(-0.28, 0, 0); body.add(pod); box(0.74, 0.5, 0.9, dark, 0, 0, 0, pod);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { cylZ(0.1, 0.1, 1.0, metal, 8, (c - 1) * 0.22, (r - 0.5) * 0.24, -0.5, pod); cylZ(0.075, 0.075, 0.04, black, 8, (c - 1) * 0.22, (r - 0.5) * 0.24, -1.0, pod); } }
    // --- futs, bouees, filet de camouflage ---
    for (const [x, z] of [[1.1, 5.2], [0.6, 5.5], [1.45, 4.9]]) { cyl(0.22, 0.22, 0.5, lam('#a8441e'), 10, body).position.set(x, 1.95, z); cyl(0.225, 0.225, 0.05, metal, 10, body).position.set(x, 1.95, z); }
    for (const sx of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 14), lam('#e8e8e8')); ring.position.set(sx * 1.45, 2.55, 4.4); ring.rotation.y = Math.PI / 2; body.add(ring); }
    const net = box(2.4, 0.04, 1.9, camo, 0, 3.0, 5.0, body); net.rotation.x = 0.18; for (const sx of [-1.15, 1.15]) cyl(0.025, 0.025, 1.2, metal, 5, body).position.set(sx, 2.35, 5.0);
    // vague d'etrave (translucide, ne fait pas partie de la coque fusionnee)
    const wave = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.0, 4, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide })); wave.rotation.set(-Math.PI / 2, 0, Math.PI / 4); wave.scale.set(1, 1, 0.22); wave.position.set(0, 0.64, -6.0); body.add(wave);
    // --- tourelle avant : couronne, pans coupes, masque, tourelleau, canon sur glissiere ---
    const turret = new THREE.Group(); turret.name = 'turret'; turret.position.set(0, 1.7, -2.9); body.add(turret);
    cyl(0.78, 0.84, 0.14, metal, 14, turret).position.y = 0.07;
    plateY([[-0.5, -0.85], [0.5, -0.85], [0.9, -0.15], [0.92, 0.6], [0.6, 0.95], [-0.6, 0.95], [-0.92, 0.6], [-0.9, -0.15]], 0.58, hull, 0.07, turret).position.y = 0.12;
    box(1.4, 0.02, 0.9, camoTex, 0.1, 0.71, 0.3, turret); box(0.7, 0.42, 0.26, dark, 0, 0.46, -0.9, turret);
    const cup = cyl(0.22, 0.25, 0.2, hull, 10, turret); cup.position.set(0.4, 0.78, 0.3); const hatch = cyl(0.21, 0.21, 0.04, dark, 10, turret); hatch.position.set(0.4, 0.9, 0.46); hatch.rotation.x = -1.1;
    for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; box(0.08, 0.06, 0.03, basic('#1a2630'), 0.4 + Math.sin(a) * 0.24, 0.8, 0.3 - Math.cos(a) * 0.24, turret).rotation.y = a; }
    cylZ(0.03, 0.03, 0.7, metal, 6, 0.4, 1.0, 0.0, turret); box(0.1, 0.1, 0.24, metal, 0.4, 1.0, 0.32, turret);   // mitrailleuse du tourelleau
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { const tb = cyl(0.045, 0.045, 0.22, metal, 6, turret); tb.position.set(sx * (0.92 + i * 0.02), 0.5 + i * 0.1, -0.5); tb.rotation.set(-0.9, 0, -sx * 0.5); }   // lance-fumigenes
    cyl(0.012, 0.016, 1.3, metal, 4, turret).position.set(-0.6, 1.5, 0.7);
    const gunPivot = new THREE.Group(); gunPivot.position.set(0, 0.36, -0.9); turret.add(gunPivot); const slide = new THREE.Group(); gunPivot.add(slide);
    cylZ(0.12, 0.14, 0.5, dark, 10, 0, 0, -0.12, slide); cylZ(0.082, 0.098, 3.1, hull, 10, 0, 0, -1.7, slide); cylZ(0.14, 0.14, 0.5, dark, 10, 0, 0, -1.55, slide); box(0.26, 0.17, 0.3, black, 0, 0, -3.35, slide);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -3.55); slide.add(muzzle);
    Object.assign(g.userData, { turret, gun: gunPivot, slide, muzzle, body, tankLike: true, exhausts: [new V(-0.7, 1.0, 6.5), new V(0.7, 1.0, 6.5)], size: [3.9, 5.2, 13.6], center: [0, 2.0, 0], keep: [radar], anim: (dt) => { radar.rotation.y += dt * 2.4; }, elev: [-0.05, 0.75] });
    return bake(g, [body, turret, gunPivot, slide, radar]);
  };
})();
