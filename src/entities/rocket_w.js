/* v308 : LES QUATRE FUSEES AQUATIQUES (niveau 2) : de vraies silhouettes, plus de simples recolorations du missile du niveau 1.
 * Une fiche de skin avec `build: '<nom>'` est construite ici (CC.Models.rocket l'appelle) : corps de revolution lisse (LatheGeometry), ailes et derives extrudees, accessoires.
 * Axe +Z = nez. Tout est fusionne par couleur (bake) : quelques appels de dessin seulement.
 *   amphibie : UNE seule fusee qui evolue en 4 etats (skin.stage 0..3) : nue, flotteurs, chenilles + rail + helice, livree finale bleu nuit / or / cyan
 */
(function () {
  const T3 = THREE, M = CC.Models; if (!M) return;
  const mats = {};
  const lam = (c) => mats[c] || (mats[c] = new T3.MeshLambertMaterial({ color: c }));
  const bas = (c) => mats['b' + c] || (mats['b' + c] = new T3.MeshBasicMaterial({ color: c }));
  const V2 = T3.Vector2;
  // piece : geometrie + couleur (+ lumineux) + position / rotation (radians)
  const put = (g, geo, c, o) => { o = o || {}; const m = new T3.Mesh(geo, o.basic ? bas(c) : lam(c)); if (o.p) m.position.set(o.p[0], o.p[1], o.p[2]); if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]); if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]); m.castShadow = !o.basic; (o.parent || g).add(m); return m; };
  // corps de revolution : profil [[rayon, z], ...] de l'arriere vers l'avant
  const lathe = (pts, seg) => { const geo = new T3.LatheGeometry(pts.map((q) => new V2(q[0], q[1])), seg || 18); geo.rotateX(Math.PI / 2); return geo; };
  // plaque horizontale (ailes) : contour [[x, z], ...], epaisseur en Y
  const flat = (pts, th) => { const sh = new T3.Shape(); pts.forEach((q, i) => (i ? sh.lineTo(q[0], -q[1]) : sh.moveTo(q[0], -q[1]))); const geo = new T3.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.translate(0, 0, -th / 2); geo.rotateX(-Math.PI / 2); return geo; };
  // plaque verticale (derives) : contour [[z, y], ...], epaisseur en X
  const fin = (pts, th) => { const sh = new T3.Shape(); pts.forEach((q, i) => (i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1]))); const geo = new T3.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.translate(0, 0, -th / 2); geo.rotateY(-Math.PI / 2); return geo; };
  const mir = (pts) => pts.map((q) => [-q[0], q[1]]);
  const cylZ = (r0, r1, h, seg) => { const geo = new T3.CylinderGeometry(r1, r0, h, seg || 12); geo.rotateX(Math.PI / 2); return geo; };   // r0 arriere, r1 avant
  const ringG = (r, t) => new T3.TorusGeometry(r, t, 8, 24);
  const sph = (r) => new T3.SphereGeometry(r, 10, 8);
  const box = (w, h, d) => new T3.BoxGeometry(w, h, d);

  const BUILD = {
    // MISSILE AMPHIBIE, une seule fusee qui evolue en 4 etats (st 0..3) : nue -> flotteurs -> chenilles, rail et helice carenee -> livree finale bleu nuit / or / cyan
    amphibie(g, st) {
      const F = st >= 3;
      const OL = F ? '#18283f' : '#5f6e3c', OLD = F ? '#0f1b2c' : '#3f4a2a', NOSE = F ? '#e8b63a' : '#e8c42a', RED = F ? '#1fb6d8' : '#c8362a', DK = F ? '#0a121c' : '#1d2418', STEEL = F ? '#b8c6d4' : '#8a949c', WH = '#ece6cc', CY = '#5ff0ff', BR = '#d9a441';
      const acc = (geo, c, p, o) => put(g, geo, c, Object.assign({ p, basic: F && c === RED }, o || {}));
      // corps et ogive
      put(g, lathe([[0, -0.7], [0.06, -0.7], [0.09, -0.62], [0.105, -0.5], [0.105, 0.4], [0.092, 0.55], [0.066, 0.67], [0.03, 0.76], [0, 0.78]]), OL);
      put(g, lathe([[0.112, 0.5], [0.1, 0.55], [0.074, 0.67], [0.036, 0.76], [0, 0.79]]), NOSE);
      put(g, cylZ(0.101, 0.101, 0.02, 18), DK, { p: [0, 0, 0.535] });
      put(g, cylZ(0.013, 0.0, 0.06, 8), STEEL, { p: [0, 0, 0.8] });
      // bandes, joints de troncons, rivets
      acc(cylZ(0.109, 0.109, 0.05, 20), RED, [0, 0, 0.47]); acc(cylZ(0.108, 0.108, 0.18, 20), RED, [0, 0, -0.05]); put(g, cylZ(0.109, 0.109, 0.014, 20), NOSE, { p: [0, 0, -0.17] }); put(g, cylZ(0.109, 0.109, 0.014, 20), NOSE, { p: [0, 0, 0.1] });
      for (const z of [-0.42, 0.24, 0.35]) put(g, cylZ(0.1065, 0.1065, 0.008, 20), DK, { p: [0, 0, z] });
      for (const z of [-0.3, 0.3]) for (let k = 0; k < 14; k++) { const a = k * Math.PI * 2 / 14; put(g, sph(0.005), STEEL, { p: [Math.cos(a) * 0.106, Math.sin(a) * 0.106, z] }); }
      // marquage : trois barres blanches de chaque cote, conduit de cables, trappe d'inspection
      for (const sx of [-1, 1]) { for (let k = 0; k < 3; k++) put(g, box(0.008, 0.05, 0.014), WH, { p: [sx * 0.1065, 0, 0.27 + k * 0.03] }); put(g, cylZ(0.006, 0.006, 0.62, 6), DK, { p: [sx * 0.082, 0.066, -0.0] }); for (const z of [-0.25, 0.0, 0.25]) put(g, box(0.014, 0.02, 0.016), STEEL, { p: [sx * 0.082, 0.066, z] }); }
      put(g, new T3.CylinderGeometry(0.05, 0.05, 0.01, 16), STEEL, { p: [0, 0.103, 0.0] }); put(g, new T3.CylinderGeometry(0.038, 0.038, 0.016, 16), DK, { p: [0, 0.106, 0.0] }); put(g, box(0.05, 0.006, 0.01), STEEL, { p: [0, 0.116, 0.0] });
      // tuyere et empennage
      put(g, cylZ(0.082, 0.066, 0.07, 16), DK, { p: [0, 0, -0.7] }); put(g, ringG(0.07, 0.008), STEEL, { p: [0, 0, -0.735] });
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(f); acc(fin([[-0.4, 0.1], [-0.7, 0.1], [-0.76, 0.27], [-0.58, 0.29]], 0.022), RED, [0, 0, 0], { parent: f, p: undefined }); put(g, fin([[-0.62, 0.285], [-0.76, 0.27], [-0.74, 0.255], [-0.62, 0.27]], 0.03), NOSE, { parent: f }); put(g, fin([[-0.4, 0.1], [-0.7, 0.1], [-0.7, 0.108], [-0.4, 0.108]], 0.034), DK, { parent: f }); }
      const tips = [[0.2, 0.2, -0.74], [-0.2, 0.2, -0.74], [0.2, -0.2, -0.74], [-0.2, -0.2, -0.74]];
      // ---- etat 1 : deux flotteurs sur pylones
      if (st >= 1) for (const sx of [-1, 1]) {
        put(g, cylZ(0.056, 0.056, 0.86, 16), OLD, { p: [sx * 0.215, -0.06, -0.04] }); put(g, cylZ(0.056, 0.0, 0.16, 16), OLD, { p: [sx * 0.215, -0.06, 0.47] }); put(g, cylZ(0.056, 0.04, 0.05, 16), DK, { p: [sx * 0.215, -0.06, -0.495] });
        acc(cylZ(0.0575, 0.0575, 0.03, 16), RED, [sx * 0.215, -0.06, 0.2]); put(g, box(0.05, 0.014, 0.5), STEEL, { p: [sx * 0.215, -0.002, -0.05] });
        for (const z of [0.22, -0.32]) { put(g, box(0.11, 0.024, 0.12), OLD, { p: [sx * 0.15, -0.045, z] }); const br = put(g, box(0.014, 0.1, 0.014), DK, { p: [sx * 0.14, -0.02, z + 0.08] }); br.rotation.z = sx * 0.9; }
        tips.push([sx * 0.27, -0.06, -0.45]);
      }
      // ---- etat 2 : chenilles, rail de lancement en treillis, helice carenee
      if (st >= 2) {
        for (const sx of [-1, 1]) {
          const X = sx * 0.268;
          put(g, box(0.03, 0.1, 0.78), DK, { p: [sx * 0.262, -0.06, -0.04] });
          for (let k = 0; k < 7; k++) put(g, new T3.CylinderGeometry(0.04, 0.04, 0.036, 12).rotateZ(Math.PI / 2), STEEL, { p: [sx * 0.282, -0.06, -0.38 + k * 0.12] });
          for (const z of [-0.43, 0.35]) put(g, new T3.CylinderGeometry(0.052, 0.052, 0.034, 12).rotateZ(Math.PI / 2), DK, { p: [sx * 0.282, -0.06, z] });
          for (let k = 0; k < 17; k++) { const z = -0.43 + k * 0.049; put(g, box(0.04, 0.01, 0.034), DK, { p: [sx * 0.284, -0.006, z] }); put(g, box(0.04, 0.01, 0.034), DK, { p: [sx * 0.284, -0.114, z] }); }
          put(g, box(0.044, 0.018, 0.1), OLD, { p: [sx * 0.284, 0.02, -0.04] });
        }
        for (const sx of [-1, 1]) put(g, box(0.012, 0.012, 0.88), DK, { p: [sx * 0.045, 0.131, -0.02] });
        for (let k = 0; k < 8; k++) { put(g, box(0.1, 0.01, 0.014), DK, { p: [0, 0.131, -0.44 + k * 0.125] }); if (k < 7) { const d = put(g, box(0.008, 0.008, 0.13), DK, { p: [(k % 2 ? 1 : -1) * 0.022, 0.131, -0.375 + k * 0.125] }); d.rotation.y = (k % 2 ? 1 : -1) * 0.5; } }
        for (const z of [-0.44, 0.44]) put(g, box(0.1, 0.03, 0.02), STEEL, { p: [0, 0.12, z] });
        put(g, ringG(0.112, 0.012), STEEL, { p: [0, 0, -0.78] });
        for (let k = 0; k < 3; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI * 2 / 3 + 0.3; g.add(f); put(g, box(0.012, 0.11, 0.02), DK, { p: [0, 0.058, -0.78], parent: f }); }
        tips.push([0.1, 0.1, -0.8], [-0.1, 0.1, -0.8]);
      }
      // ---- etat 3 : livree finale : canards, filets lumineux, anneaux cyan, nez or
      if (st >= 3) {
        for (const sx of [-1, 1]) {
          put(g, flat([[0.09 * sx, 0.5], [0.26 * sx, 0.38], [0.26 * sx, 0.33], [0.09 * sx, 0.4]], 0.014), STEEL);
          put(g, box(0.012, 0.012, 0.8), CY, { p: [sx * 0.215, -0.0, -0.05], basic: true });
          put(g, ringG(0.057, 0.008), CY, { p: [sx * 0.215, -0.06, 0.38], basic: true });
          put(g, box(0.006, 0.012, 0.7), CY, { p: [sx * 0.1085, 0.0, 0.0], basic: true });
        }
        put(g, ringG(0.108, 0.007), CY, { p: [0, 0, -0.78], basic: true }); put(g, cylZ(0.111, 0.111, 0.008, 20), CY, { p: [0, 0, 0.3], basic: true });
        put(g, box(0.014, 0.01, 0.7), CY, { p: [0, 0.1075, 0.05], basic: true });
        tips.push([0.26, 0, 0.35], [-0.26, 0, 0.35]);
      }
      return { tail: st >= 2 ? -0.78 : -0.7, jr: 0.07, noseZ: 0.84, tips };
    },
  };

  // jet de la tuyere : meme mecanique que M.rocket (allumage / vacillement animes par Rocket.updateMesh)
  const addJet = (g, tailZ, r) => {
    const jet = new T3.Group(); jet.position.z = tailZ - 0.1; jet.visible = false; g.add(jet);
    const disc = new T3.Mesh(new T3.CircleGeometry(r * 0.8, 12), new T3.MeshBasicMaterial({ color: '#fff2c0', transparent: true, opacity: 1 }));
    disc.rotation.y = Math.PI; disc.position.z = 0.005; jet.add(disc);
    const cone = (rad, h, color, op) => {
      const geo = new T3.ConeGeometry(rad, h, 12, 4, true); geo.translate(0, -h / 2, 0);
      const P = geo.attributes.position, col = new Float32Array(P.count * 3), c0 = new T3.Color(color);
      for (let k = 0; k < P.count; k++) { const t = Math.min(1, Math.max(0, -P.getY(k) / h)), f = Math.pow(t, 1.1); col[k * 3] = c0.r * f; col[k * 3 + 1] = c0.g * f; col[k * 3 + 2] = c0.b * f; }
      geo.setAttribute('color', new T3.BufferAttribute(col, 3));
      const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, opacity: op, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide }));
      m.rotation.x = Math.PI / 2; m.userData.op = op; jet.add(m); return m;
    };
    const core = cone(r * 0.62, 0.5, '#fff9d9', 0.95), outer = cone(r * 0.9, 0.9, '#ffae32', 0.55);
    return { group: jet, disc, core, outer };
  };

  CC.RocketW = {
    build(skin) {
      const g = new T3.Group(), fn = BUILD[skin.build]; const o = fn(g, skin.stage || 0);
      g.userData.jet = addJet(g, o.tail, o.jr);
      g.userData.finTips = o.tips.map((q) => new T3.Vector3(q[0], q[1], q[2]));
      g.userData.noseZ = o.noseZ; g.userData.nozzleZ = o.tail - 0.03;
      return M.bake(g, [g.userData.jet.group]);
    },
  };
})();
