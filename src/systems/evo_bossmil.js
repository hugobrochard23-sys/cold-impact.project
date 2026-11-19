/* v451 : BOSS MILITAIRES des niveaux 4 a 8. Chaque boss garde son combat (3 coups, il recule, il tire), mais son corps devient un vrai engin
 * militaire geant tire du kit d'engins du jeu (CC.BossModels : modeles detailles, fusionnes par materiau = peu d'objets a dessiner), au theme du niveau :
 *   4 espace   : CROISEUR DE COMBAT (destroyer gris) qui se met en travers de l'arene, reacteurs allumes
 *   5 noyau    : TUNNELIER BLINDE (obusier chenille blinde + la tete de forage qui tourne)
 *   6 lanternes: FORTERESSE VOLANTE (helicoptere lourd arme, lanternes rouges suspendues)
 *   7 maison   : CHAR D'ASSAUT JOUET (vehicule chenille vert plastique, a l'echelle de la maison geante)
 *   8 Far West : TRAIN BLINDE (locomotive et wagon blindes, tourelles)
 * Ils sont grands et BLOQUENT le passage : toute la section de l'engin compte comme un coup (B.hw / B.hh, demi-largeur / demi-hauteur).
 * La tourelle vise la fusee. Le repere du boss : +z regarde la fusee (comme dans chaque niveau). */
(function () {
  const EVO = CC.EVO, T3 = THREE, V = T3.Vector3;
  if (!EVO) return;
  const CFG = {
    4: { k: 'destroyer', tint: 4, sc: 8, em: 0.12, rot: Math.PI / 2, jets: '#7ac8ff' },
    5: { k: 'spg', tint: 4, sc: 5.2, rot: Math.PI, keep: 'head', zf: -1.7 },
    6: { k: 'gunship', tint: 5, sc: 10, em: 0.3, rot: Math.PI, lanterns: true },
    7: { k: 'ifv', tint: 0, sc: 12, em: 0.12, rot: Math.PI, plastic: true },
    8: { k: 'train', tint: 0, sc: 7.5, em: 0.12, rot: 0, cars: 2, ground: true },
  };
  const _a = new V(), _q = new T3.Quaternion();
  const glow = (size, col) => { if (EVO.boss2Kit) { const s = EVO.boss2Kit.glow(size, col); return s; } return new T3.Object3D(); };

  EVO.milBoss = (g, B, lv) => {
    const C = CFG[lv]; if (!B || !C || !CC.BossModels || !CC.BossModels[C.k]) return;
    try {
      // l'ancien corps part (on garde la tete de forage du tunnelier)
      for (const o of B.m.children.slice()) if (!(C.keep && B[C.keep] === o)) B.m.remove(o);
      B.tg = new T3.Group(); B.beacon = new T3.Object3D();
      const W = new T3.Group(); B.m.add(W); W.rotation.y = C.rot; W.scale.setScalar(C.sc);
      const cars = [];
      for (let c = 0; c < (C.cars || 1); c++) {
        const md = CC.BossModels[C.k](C.tint), bb = new T3.Box3().setFromObject(md), sz = bb.getSize(new V()), ct = bb.getCenter(new V());
        md.traverse((o) => { if (!o.isMesh || !o.material) return; o.castShadow = o.receiveShadow = false;
          o.material = (Array.isArray(o.material) ? o.material.map((q) => q.clone()) : o.material.clone());
          for (const q of (Array.isArray(o.material) ? o.material : [o.material])) { q.fog = false; if (q.emissive && q.color) q.emissive.copy(q.color).multiplyScalar(C.em !== undefined ? C.em : C.plastic ? 0.55 : 0.42); if (C.plastic && q.shininess !== undefined) q.shininess = 90; } });
        const holder = new T3.Group(); holder.add(md); md.position.set(-ct.x, C.ground ? -bb.min.y : -ct.y, -ct.z); holder.position.z = c * sz.z * 1.02; W.add(holder); cars.push({ md, sz, holder });
        if (c === 0) { B.milSz = sz; }
      }
      const sz = B.milSz, len = sz.z * C.sc * (C.cars || 1);
      // tete-a-tete : l'avant de l'engin a ~25 m devant le point de contact ; en travers : centre
      if (C.cars) W.position.z = 4 - ((C.cars - 1) * sz.z * 1.02 + sz.z / 2) * C.sc;   // le train s'eloigne : l'arriere du dernier wagon est au point de contact
      else if (Math.abs(Math.sin(C.rot)) < 0.5) W.position.z = 25 - len / 2 + (C.zf || 0) * C.sc; else W.position.z = 0;
      // demi-section bloquante, vue de la fusee
      const across = Math.abs(Math.sin(C.rot)) > 0.5 ? sz.z * (C.cars || 1) : sz.x;
      B.hw = Math.max(10, across * C.sc / 2 + 2); B.hh = Math.max(9, sz.y * C.sc * (C.ground ? 0.55 : 0.42));
      if (C.ground) B.hh = sz.y * C.sc + 4;   // au sol : de la voie jusqu'au toit
      if (lv <= 6) { B.hw = 60; B.hh = 60; }
      if (lv === 8) B.hw = Math.max(B.hw, 24);   // v452 : le train blinde barre toute la voie (et ses abords)   // niveaux a voie : l'engin barre toute l'arene / tout le tunnel
      // reacteurs (croiseur spatial)
      if (C.jets) for (const x of [-0.9, 0, 0.9]) { const gw = glow(5.5, C.jets); gw.position.set(x, -1.2, sz.z / 2 + 0.6); cars[0].holder.add(gw); }
      // lanternes rouges suspendues (forteresse volante de la fete)
      if (C.lanterns) { const lm = new T3.MeshBasicMaterial({ color: '#ff3a24', fog: false }), gm = new T3.MeshBasicMaterial({ color: '#ffd04a', fog: false }), cm = new T3.LineBasicMaterial({ color: '#2a1a14' });
        for (let k = 0; k < 8; k++) { const x = (k % 4 - 1.5) * sz.x * 0.28, z = (k < 4 ? -0.22 : 0.18) * sz.z, h = 0.9 + (k % 3) * 0.35, y0 = -sz.y * 0.32;
          const ln = new T3.Mesh(new T3.CylinderGeometry(0.32, 0.32, 0.55, 10), lm); ln.position.set(x, y0 - h, z); cars[0].holder.add(ln);
          for (const s of [-1, 1]) { const cap = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.24, 0.08, 8), gm); cap.position.set(x, y0 - h + s * 0.31, z); cars[0].holder.add(cap); }
          const gw = glow(2.2, '#ff7a3a'); gw.position.set(x, y0 - h, z); cars[0].holder.add(gw);
          cars[0].holder.add(new T3.Line(new T3.BufferGeometry().setFromPoints([new V(x, y0, z), new V(x, y0 - h + 0.3, z)]), cm)); } }
      // le tunnelier : la tete de forage remplit le tunnel, deux tourelles antiaeriennes montees sur l'anneau avant
      if (lv === 5 && B.head) { B.head.scale.setScalar(1.3); if (CC.BossModels.aaturret) for (const sd of [-1, 1]) { const t = CC.BossModels.aaturret(4); t.scale.setScalar(2.4); t.rotation.y = Math.PI; t.position.set(sd * 9, 11.5, 12); t.traverse((o) => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.fog = false; if (o.material.emissive) o.material.emissive.copy(o.material.color).multiplyScalar(0.35); } }); B.m.add(t); cars.push({ md: t, holder: t }); } }
      B.mil = { C, cars, W };
    } catch (e) { /* le boss d'origine reste en place */ }
  };

  // chaque image : la tourelle vise la fusee, les pieces mobiles tournent
  EVO.milAnim = (g, B, dt, t) => {
    const M = B && B.mil; if (!M || !B.m.visible) return;
    for (const c of M.cars) { const ud = c.md.userData;
      if (ud.anim) try { ud.anim(dt, t || 0); } catch (e) { /* rien */ }
      if (ud.turret && g.rocket && !B.dead) { c.md.updateWorldMatrix(true, false); _a.copy(g.rocket.pos); ud.turret.parent.worldToLocal(_a); const want = Math.atan2(-(_a.x - ud.turret.position.x), -(_a.z - ud.turret.position.z)); let d = want - ud.turret.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); ud.turret.rotation.y += d * Math.min(1, dt * 2.5); } }
  };
})();
