/* v308 : LES QUATRE FUSEES AQUATIQUES (niveau 2) : de vraies silhouettes, plus de simples recolorations du missile du niveau 1.
 * Une fiche de skin avec `build: '<nom>'` est construite ici (CC.Models.rocket l'appelle) : corps de revolution lisse (LatheGeometry), ailes et derives extrudees, accessoires.
 * Axe +Z = nez. Tout est fusionne par couleur (bake) : quelques appels de dessin seulement.
 *   torpille  : torpille de laiton et d'acier, tourelle de sous-marin et periscope, tuyere carenee
 *   marlin    : espadon a rostre, grande voile dorsale, nageoires, queue en croissant, foil de sustentation
 *   requin    : requin hydrojet, gueule a dents, ouies, dorsale, queue heterocerque, nacelles d'hydrojet
 *   manta     : raie manta de combat, ailes delta cernees de veines lumineuses, lobes cephaliques */
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
    torpille(g) {
      const BODY = '#6f8498', DK = '#2e3e4c', BR = '#d9a441', CY = '#7be8ff';
      put(g, lathe([[0, -0.5], [0.05, -0.5], [0.08, -0.44], [0.105, -0.3], [0.12, -0.1], [0.12, 0.25], [0.112, 0.38], [0.09, 0.48], [0.05, 0.545], [0, 0.575]]), BODY);
      for (const z of [-0.3, 0.02, 0.3]) put(g, cylZ(0.127, 0.127, 0.032, 18), BR, { p: [0, 0, z] });
      put(g, sph(0.034), BR, { p: [0, 0, 0.56] });
      for (const sx of [-1, 1]) for (const z of [-0.14, 0.1, 0.22]) { put(g, sph(0.026), BR, { p: [sx * 0.113, 0, z], s: [0.5, 1, 1] }); put(g, sph(0.017), CY, { p: [sx * 0.12, 0, z], s: [0.5, 1, 1], basic: true }); }
      // tourelle de sous-marin et periscope
      put(g, fin([[-0.04, 0.09], [0.22, 0.09], [0.17, 0.2], [0.02, 0.2]], 0.06), DK, { p: [0, 0, 0] });
      put(g, cylZ(0.009, 0.009, 0.14, 6), '#9aa8b4', { p: [0, 0.27, 0.1], r: [Math.PI / 2, 0, 0] });
      put(g, box(0.02, 0.02, 0.05), '#9aa8b4', { p: [0, 0.335, 0.125] });
      // tuyere carenee : anneau de laiton, croix de derives
      put(g, ringG(0.098, 0.014), BR, { p: [0, 0, -0.5] });
      put(g, cylZ(0.085, 0.07, 0.1, 14), DK, { p: [0, 0, -0.5] });
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(f); put(g, fin([[-0.12, 0.085], [-0.5, 0.085], [-0.55, 0.21], [-0.4, 0.23]], 0.024), DK, { parent: f }); put(g, fin([[-0.5, 0.2], [-0.55, 0.21], [-0.4, 0.23], [-0.4, 0.2]], 0.03), BR, { parent: f }); }
      return { tail: -0.5, jr: 0.075, noseZ: 0.6, tips: [[0.15, 0.15, -0.45], [-0.15, 0.15, -0.45], [0.15, -0.15, -0.45], [-0.15, -0.15, -0.45]] };
    },
    marlin(g) {
      const BODY = '#4f86b8', BELLY = '#cfe3f2', DK = '#26384a', BR = '#d9a441', CY = '#5ff0ff';
      put(g, lathe([[0, -0.6], [0.04, -0.6], [0.07, -0.52], [0.1, -0.38], [0.112, -0.15], [0.112, 0.25], [0.095, 0.42], [0.06, 0.52], [0.028, 0.58]]), BODY);
      put(g, lathe([[0, -0.6], [0.03, -0.6], [0.055, -0.5], [0.075, -0.38], [0.082, -0.15], [0.082, 0.25], [0.07, 0.42], [0, 0.5]]), BELLY, { p: [0, -0.052, 0], s: [1.28, 1, 1] });
      put(g, cylZ(0.04, 0.003, 0.4, 8), DK, { p: [0, 0, 0.74] });
      for (const z of [0.22, 0.34]) put(g, cylZ(0.116, 0.116, 0.014, 18), CY, { p: [0, 0, z], basic: true });
      for (const sx of [-1, 1]) { put(g, sph(0.03), '#ffffff', { p: [sx * 0.082, 0.04, 0.45] }); put(g, sph(0.018), CY, { p: [sx * 0.098, 0.043, 0.46], basic: true }); }
      put(g, fin([[0.3, 0.09], [0.17, 0.25], [0, 0.37], [-0.26, 0.32], [-0.36, 0.09]], 0.02), DK);
      put(g, fin([[0.3, 0.09], [0.17, 0.25], [0, 0.37], [-0.02, 0.33], [0.1, 0.2], [0.2, 0.09]], 0.024), BR);
      for (const sx of [-1, 1]) { const w = put(g, flat([[0.09, 0.22], [0.46, -0.08], [0.44, -0.18], [0.09, -0.02]].map((q) => [q[0] * sx, q[1]]), 0.02), DK, { p: [0, -0.05, 0] }); w.rotation.z = sx * -0.16; }
      put(g, fin([[-0.52, 0.0], [-0.72, 0.32], [-0.84, 0.3], [-0.68, 0.0]], 0.022), DK);
      put(g, fin([[-0.52, 0.0], [-0.72, -0.32], [-0.84, -0.3], [-0.68, 0.0]], 0.022), DK);
      for (const sx of [-1, 1]) put(g, flat([[0.07 * sx, -0.4], [0.28 * sx, -0.62], [0.26 * sx, -0.68], [0.06 * sx, -0.56]], 0.018), DK);
      // foil de sustentation : mat sous le ventre et plan porteur
      put(g, fin([[-0.02, -0.08], [0.1, -0.08], [0.08, -0.22], [0.0, -0.22]], 0.026), BR);
      put(g, flat([[-0.3, 0.07], [0.3, 0.07], [0.26, -0.03], [-0.26, -0.03]], 0.018), DK, { p: [0, -0.23, 0.04] });
      for (const sx of [-1, 1]) put(g, sph(0.015), CY, { p: [sx * 0.29, -0.23, 0.04], basic: true });
      return { tail: -0.6, jr: 0.06, noseZ: 0.9, tips: [[0.44, -0.1, -0.1], [-0.44, -0.1, -0.1], [0.27, -0.23, 0.0], [-0.27, -0.23, 0.0]] };
    },
    requin(g) {
      const BODY = '#3c6a98', BELLY = '#c8d8e4', DK = '#1b2b3a', BR = '#d9a441', CY = '#5ff0ff';
      put(g, lathe([[0, -0.75], [0.04, -0.75], [0.07, -0.68], [0.1, -0.5], [0.125, -0.2], [0.137, 0.15], [0.127, 0.4], [0.105, 0.6], [0.07, 0.76], [0.03, 0.86], [0, 0.89]]), BODY);
      put(g, lathe([[0, -0.6], [0.06, -0.5], [0.09, -0.2], [0.098, 0.15], [0.09, 0.4], [0.07, 0.6], [0.04, 0.72]]), BELLY, { p: [0, -0.068, 0], s: [1.4, 1, 1] });
      put(g, cylZ(0.106, 0.106, 0.03, 18), DK, { p: [0, 0, 0.64] });
      for (let k = 0; k < 11; k++) { const a = Math.PI + 0.45 + k * (Math.PI - 0.9) / 10; put(g, cylZ(0.015, 0.001, 0.05, 6), '#ffffff', { p: [Math.cos(a) * 0.098, Math.sin(a) * 0.098, 0.665] }); }
      for (const sx of [-1, 1]) { put(g, sph(0.027), DK, { p: [sx * 0.098, 0.05, 0.55] }); put(g, sph(0.016), CY, { p: [sx * 0.112, 0.053, 0.555], basic: true }); for (let k = 0; k < 5; k++) put(g, box(0.008, 0.095, 0.014), DK, { p: [sx * 0.137, -0.005, 0.32 - k * 0.055], r: [0, 0, sx * 0.18] }); }
      put(g, fin([[0.26, 0.12], [0.02, 0.5], [-0.04, 0.5], [-0.24, 0.12]], 0.022), DK);
      put(g, fin([[0.25, 0.12], [0.02, 0.48], [0.0, 0.46], [0.12, 0.12]], 0.026), BR);
      put(g, fin([[-0.42, 0.1], [-0.56, 0.22], [-0.64, 0.1]], 0.018), DK);
      for (const sx of [-1, 1]) { const w = put(g, flat([[0.1, 0.26], [0.52, -0.16], [0.47, -0.25], [0.1, -0.03]].map((q) => [q[0] * sx, q[1]]), 0.022), DK, { p: [0, -0.04, 0] }); w.rotation.z = sx * -0.28; }
      put(g, fin([[-0.62, 0.02], [-0.8, 0.44], [-0.96, 0.5], [-0.88, 0.16], [-0.78, 0.0]], 0.024), BODY);
      put(g, fin([[-0.64, -0.02], [-0.8, -0.22], [-0.92, -0.22], [-0.78, 0.0]], 0.02), DK);
      for (const sx of [-1, 1]) put(g, flat([[0.07 * sx, -0.58], [0.26 * sx, -0.78], [0.24 * sx, -0.84], [0.05 * sx, -0.72]], 0.02), DK);
      // nacelles d'hydrojet : prise d'eau a l'avant (anneau cyan), tuyere a l'arriere
      for (const sx of [-1, 1]) { put(g, cylZ(0.042, 0.042, 0.56, 12), DK, { p: [sx * 0.21, -0.07, -0.02] }); put(g, ringG(0.042, 0.009), CY, { p: [sx * 0.21, -0.07, 0.27], basic: true }); put(g, cylZ(0.046, 0.036, 0.06, 12), BR, { p: [sx * 0.21, -0.07, -0.33] }); put(g, box(0.1, 0.014, 0.12), DK, { p: [sx * 0.15, -0.07, 0.0] }); }
      return { tail: -0.75, jr: 0.06, noseZ: 0.9, tips: [[0.5, -0.2, -0.2], [-0.5, -0.2, -0.2], [0.21, -0.07, -0.34], [-0.21, -0.07, -0.34]] };
    },
    manta(g) {
      const BODY = '#1f3e5a', DK = '#12202e', WING = '#1d4a72', CY = '#5ff0ff', BR = '#d9a441';
      put(g, lathe([[0, -0.8], [0.05, -0.8], [0.09, -0.7], [0.125, -0.45], [0.14, -0.1], [0.14, 0.3], [0.12, 0.6], [0.08, 0.82], [0.035, 0.95], [0, 1.0]]), BODY);
      const WP = [[0.12, 0.62], [0.3, 0.52], [0.52, 0.28], [0.7, 0.04], [0.74, -0.12], [0.6, -0.26], [0.34, -0.36], [0.12, -0.5]];
      for (const sx of [-1, 1]) {
        const grp = new T3.Group(); grp.position.y = -0.02; grp.rotation.z = sx * -0.16; g.add(grp);
        put(g, flat(WP.map((q) => [q[0] * sx, q[1]]), 0.034), WING, { parent: grp });
        put(g, flat(WP.map((q) => [q[0] * sx * 0.82 + 0.02 * sx, q[1] * 0.8 + 0.02]), 0.012), '#2a6a9a', { p: [0, 0.02, 0], parent: grp });
        for (let k = 0; k < 3; k++) { const a = 0.35 - k * 0.42, len = 0.4 - k * 0.04; put(g, box(len, 0.006, 0.014), CY, { p: [sx * (0.17 + len / 2 * Math.cos(a)), 0.028, 0.34 - k * 0.2 - len / 2 * Math.sin(a) * 0.6], r: [0, sx * a, 0], basic: true, parent: grp }); }
        put(g, sph(0.02), CY, { p: [sx * 0.72, 0, -0.04], basic: true, parent: grp });
        put(g, cylZ(0.001, 0.036, 0.34, 8), DK, { p: [sx * 0.09, -0.02, 1.08], r: [0, sx * 0.14, 0] });
        put(g, sph(0.03), '#ffffff', { p: [sx * 0.105, 0.05, 0.72] }); put(g, sph(0.019), CY, { p: [sx * 0.118, 0.053, 0.73], basic: true });
        const tf = new T3.Group(); tf.rotation.z = sx * 0.3; tf.position.set(sx * 0.1, 0.05, 0); g.add(tf); put(g, fin([[-0.45, 0.06], [-0.78, 0.4], [-0.9, 0.38], [-0.8, 0.06]], 0.022), DK, { parent: tf });
      }
      put(g, box(0.022, 0.01, 0.9), CY, { p: [0, 0.142, 0.1], basic: true });
      for (let k = 0; k < 5; k++) put(g, fin([[0.52 - k * 0.22, 0.12], [0.44 - k * 0.22, 0.2 - k * 0.012], [0.3 - k * 0.22, 0.12]], 0.016), DK);
      put(g, cylZ(0.12, 0.09, 0.08, 16), DK, { p: [0, 0, -0.8] });
      put(g, ringG(0.1, 0.012), BR, { p: [0, 0, -0.84] });
      return { tail: -0.8, jr: 0.085, noseZ: 1.2, tips: [[0.72, -0.1, -0.1], [-0.72, -0.1, -0.1], [0.4, 0.4, -0.85], [-0.4, 0.4, -0.85]] };
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
