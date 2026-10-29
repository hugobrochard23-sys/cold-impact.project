/* v308 : LES QUATRE FUSEES AQUATIQUES (niveau 2) : de vraies silhouettes, plus de simples recolorations du missile du niveau 1.
 * Une fiche de skin avec `build: '<nom>'` est construite ici (CC.Models.rocket l'appelle) : corps de revolution lisse (LatheGeometry), ailes et derives extrudees, accessoires.
 * Axe +Z = nez. Tout est fusionne par couleur (bake) : quelques appels de dessin seulement.
 *   harpon     : missile de croisiere de sous-marin (ailes depliables, bandes d'etancheite)
 *   hydroptere : fuselage blanc sur mats a foils, helice carenee
 *   amphibie   : fusee olive a nez jaune, flotteurs a chenilles, rail en treillis (comme le char lance-fusee amphibie)
 *   abyssal    : missile de profondeur, dome sonar, propulseurs lateraux, filets cyan
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
    // A : missile de croisiere de sous-marin : fuseau fin, bandes d'etancheite, ailes depliables, empennage en croix
    harpon(g) {
      const BODY = '#2f4a63', LT = '#c8d2dc', OR = '#ff7a1a', DK = '#14202c';
      put(g, lathe([[0, -0.7], [0.06, -0.7], [0.085, -0.6], [0.1, -0.5], [0.1, 0.3], [0.092, 0.45], [0.07, 0.58], [0.04, 0.68], [0, 0.76]]), BODY);
      put(g, cylZ(0.082, 0.0, 0.17, 16), OR, { p: [0, 0, 0.675] });
      for (const z of [-0.45, 0.12, 0.3]) put(g, cylZ(0.104, 0.104, 0.022, 18), LT, { p: [0, 0, z] });
      put(g, cylZ(0.104, 0.104, 0.05, 18), OR, { p: [0, 0, -0.3] });
      for (const z of [-0.12, 0.2, 0.42]) put(g, cylZ(0.1015, 0.1015, 0.006, 18), DK, { p: [0, 0, z] });
      put(g, box(0.05, 0.035, 0.14), DK, { p: [0, 0.105, -0.12] }); put(g, box(0.04, 0.03, 0.05), BODY, { p: [0, 0.12, -0.17] });
      for (const sx of [-1, 1]) {
        put(g, flat([[0.09, 0.2], [0.42, -0.08], [0.42, -0.17], [0.09, -0.1]].map((q) => [q[0] * sx, q[1]]), 0.016), LT, { p: [0, 0, 0] });
        put(g, box(0.07, 0.05, 0.12), DK, { p: [sx * 0.12, 0, 0.04] });
        put(g, box(0.012, 0.012, 0.08), OR, { p: [sx * 0.41, 0, -0.1] });
      }
      put(g, cylZ(0.085, 0.07, 0.07, 14), DK, { p: [0, 0, -0.7] });
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2; g.add(f); put(g, fin([[-0.42, 0.085], [-0.7, 0.085], [-0.72, 0.24], [-0.58, 0.25]], 0.02), LT, { parent: f }); put(g, fin([[-0.66, 0.2], [-0.72, 0.24], [-0.7, 0.2]], 0.024), OR, { parent: f }); }
      return { tail: -0.7, jr: 0.065, noseZ: 0.78, tips: [[0.42, 0, -0.12], [-0.42, 0, -0.12], [0.24, 0, -0.68], [-0.24, 0, -0.68]] };
    },
    // B : hydroptere : fuselage blanc sur deux mats a foils (comme un navire a ailes portantes), canards, helice carenee
    hydroptere(g) {
      const BODY = '#dde4ea', NAVY = '#243a52', RED = '#e0402c', DK = '#3a4650';
      put(g, lathe([[0, -0.7], [0.05, -0.7], [0.08, -0.62], [0.098, -0.45], [0.098, 0.35], [0.085, 0.52], [0.055, 0.66], [0.02, 0.76], [0, 0.78]]), BODY);
      put(g, cylZ(0.088, 0.0, 0.2, 16), NAVY, { p: [0, 0, 0.67] });
      put(g, cylZ(0.101, 0.101, 0.04, 18), RED, { p: [0, 0, 0.5] }); put(g, cylZ(0.101, 0.101, 0.012, 18), NAVY, { p: [0, 0, 0.1] }); put(g, cylZ(0.101, 0.101, 0.012, 18), NAVY, { p: [0, 0, -0.2] });
      put(g, box(0.012, 0.012, 0.8), NAVY, { p: [0, 0.099, -0.05] });
      for (const sx of [-1, 1]) {
        put(g, flat([[0.09, 0.62], [0.24, 0.5], [0.24, 0.45], [0.09, 0.5]].map((q) => [q[0] * sx, q[1]]), 0.014), NAVY);
        for (const [z, sp, d] of [[0.14, 1, 0.18], [-0.38, 0.75, 0.15]]) {
          const st = put(g, box(0.022, 0.24 * sp, 0.05 * sp), DK, { p: [sx * 0.17, -0.1 * sp, z] }); st.rotation.z = sx * 0.55;
          put(g, flat([[-0.1 * sp, d], [0.1 * sp, d], [0.13 * sp, -d * 0.2], [-0.13 * sp, -d * 0.2]], 0.016), RED, { p: [sx * 0.265 * sp + sx * 0.04, -0.215 * sp, z - 0.02] });
          put(g, sph(0.02), DK, { p: [sx * 0.1, -0.015, z] });
        }
      }
      put(g, fin([[-0.4, 0.09], [-0.68, 0.09], [-0.72, 0.36], [-0.56, 0.38]], 0.022), BODY);
      put(g, fin([[-0.62, 0.3], [-0.72, 0.36], [-0.66, 0.3]], 0.026), RED);
      for (const sx of [-1, 1]) put(g, flat([[0.08 * sx, -0.5], [0.3 * sx, -0.66], [0.3 * sx, -0.73], [0.08 * sx, -0.68]], 0.016), NAVY);
      put(g, ringG(0.108, 0.014), DK, { p: [0, 0, -0.74] });
      for (let k = 0; k < 3; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI * 2 / 3; g.add(f); put(g, box(0.012, 0.1, 0.02), DK, { p: [0, 0.056, -0.74], parent: f }); }
      return { tail: -0.74, jr: 0.07, noseZ: 0.8, tips: [[0.3, 0, -0.7], [-0.3, 0, -0.7], [0.3, -0.22, 0.12], [-0.3, -0.22, 0.12]] };
    },
    // C : missile amphibie (comme le char lance-fusee amphibie) : fusee olive a nez jaune, deux flotteurs a chenilles, rail en treillis
    amphibie(g) {
      const OL = '#5f6e3c', OLD = '#3f4a2a', YEL = '#e8c42a', RED = '#c8362a', DK = '#1d2418', STEEL = '#8a949c';
      put(g, lathe([[0, -0.7], [0.06, -0.7], [0.09, -0.62], [0.105, -0.5], [0.105, 0.4], [0.092, 0.55], [0.066, 0.67], [0.03, 0.76], [0, 0.78]]), OL);
      put(g, cylZ(0.094, 0.0, 0.24, 16), YEL, { p: [0, 0, 0.66] });
      put(g, cylZ(0.109, 0.109, 0.05, 18), RED, { p: [0, 0, 0.5] }); put(g, cylZ(0.108, 0.108, 0.18, 18), RED, { p: [0, 0, -0.05] }); put(g, cylZ(0.109, 0.109, 0.014, 18), YEL, { p: [0, 0, -0.17] });
      for (const sx of [-1, 1]) {
        put(g, cylZ(0.056, 0.056, 0.86, 14), OLD, { p: [sx * 0.215, -0.06, -0.04] }); put(g, cylZ(0.056, 0.0, 0.14, 14), OLD, { p: [sx * 0.215, -0.06, 0.46] });
        put(g, box(0.034, 0.12, 0.84), DK, { p: [sx * 0.265, -0.06, -0.04] });
        for (let k = 0; k < 6; k++) put(g, new T3.CylinderGeometry(0.044, 0.044, 0.04, 10).rotateZ(Math.PI / 2), STEEL, { p: [sx * 0.274, -0.06, -0.38 + k * 0.145] });
        put(g, box(0.1, 0.022, 0.12), OLD, { p: [sx * 0.15, -0.045, 0.2] }); put(g, box(0.1, 0.022, 0.12), OLD, { p: [sx * 0.15, -0.045, -0.3] });
      }
      for (const sx of [-1, 1]) put(g, box(0.012, 0.012, 0.85), DK, { p: [sx * 0.045, 0.125, -0.02] });
      for (let k = 0; k < 7; k++) put(g, box(0.1, 0.01, 0.014), DK, { p: [0, 0.125, -0.4 + k * 0.13] });
      put(g, new T3.CylinderGeometry(0.04, 0.04, 0.012, 12), DK, { p: [0, 0.103, 0.24] });
      put(g, cylZ(0.082, 0.066, 0.07, 14), DK, { p: [0, 0, -0.7] });
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(f); put(g, fin([[-0.4, 0.1], [-0.7, 0.1], [-0.74, 0.27], [-0.58, 0.28]], 0.022), RED, { parent: f }); }
      return { tail: -0.7, jr: 0.07, noseZ: 0.8, tips: [[0.3, -0.06, -0.4], [-0.3, -0.06, -0.4], [0.2, 0.2, -0.7], [-0.2, 0.2, -0.7]] };
    },
    // D : missile de profondeur : dome sonar a l'avant, deux propulseurs lateraux, ailes en fleche, filets cyan
    abyssal(g) {
      const BODY = '#3c4a5a', DKS = '#1c2632', BR = '#d9a441', CY = '#5ff0ff', LT = '#9fb2c4';
      put(g, lathe([[0, -0.75], [0.06, -0.75], [0.09, -0.65], [0.11, -0.5], [0.11, 0.4], [0.098, 0.52], [0.09, 0.58]]), BODY);
      put(g, sph(0.1), DKS, { p: [0, 0, 0.58], s: [1, 1, 1.15] }); put(g, ringG(0.103, 0.01), CY, { p: [0, 0, 0.58], basic: true });
      put(g, cylZ(0.003, 0.003, 0.14, 4), LT, { p: [0, 0, 0.8] });
      for (const z of [-0.35, 0.0, 0.3]) put(g, cylZ(0.115, 0.115, 0.03, 18), BR, { p: [0, 0, z] });
      for (const z of [-0.18, 0.15]) put(g, cylZ(0.112, 0.112, 0.01, 18), CY, { p: [0, 0, z], basic: true });
      put(g, box(0.014, 0.016, 0.9), CY, { p: [0, 0.112, -0.05], basic: true });
      for (const sx of [-1, 1]) {
        put(g, cylZ(0.055, 0.055, 0.82, 14), LT, { p: [sx * 0.19, -0.015, -0.1] }); put(g, cylZ(0.055, 0.0, 0.18, 14), BODY, { p: [sx * 0.19, -0.015, 0.4] }); put(g, cylZ(0.05, 0.05, 0.02, 14), CY, { p: [sx * 0.19, -0.015, 0.0], basic: true });
        put(g, cylZ(0.05, 0.04, 0.07, 12), DKS, { p: [sx * 0.19, -0.015, -0.52] });
        put(g, box(0.1, 0.03, 0.16), DKS, { p: [sx * 0.13, -0.015, 0.0] });
        put(g, flat([[0.2 * sx, 0.0], [0.5 * sx, -0.34], [0.5 * sx, -0.46], [0.22 * sx, -0.42]], 0.02), BODY);
        put(g, box(0.012, 0.012, 0.1), CY, { p: [sx * 0.49, 0, -0.4], basic: true });
      }
      for (let k = 0; k < 2; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI; g.add(f); put(g, fin([[-0.5, 0.1], [-0.76, 0.1], [-0.8, 0.3], [-0.64, 0.34]], 0.024), BODY, { parent: f }); put(g, fin([[-0.7, 0.26], [-0.8, 0.3], [-0.78, 0.26]], 0.028), CY, { parent: f, basic: true }); }
      put(g, ringG(0.085, 0.012), BR, { p: [0, 0, -0.78] });
      return { tail: -0.78, jr: 0.075, noseZ: 0.9, tips: [[0.5, 0, -0.44], [-0.5, 0, -0.44], [0.19, -0.015, -0.55], [-0.19, -0.015, -0.55]] };
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
      const g = new T3.Group(), fn = BUILD[skin.build]; const o = fn(g);
      g.userData.jet = addJet(g, o.tail, o.jr);
      g.userData.finTips = o.tips.map((q) => new T3.Vector3(q[0], q[1], q[2]));
      g.userData.noseZ = o.noseZ; g.userData.nozzleZ = o.tail - 0.03;
      return M.bake(g, [g.userData.jet.group]);
    },
  };
})();
