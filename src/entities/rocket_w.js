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
    // MISSILE AMPHIBIE, une seule fusee qui evolue en 4 etats (st 0..3) : nue -> flotteurs -> chenilles + helice carenee -> livree finale bleu nuit / blanc / cyan. Formes simples, aucune fioriture.
    amphibie(g, st) {
      const F = st >= 3;
      const OL = F ? '#16283f' : '#5f6e3c', OLD = F ? '#0e1a2b' : '#3f4a2a', NOSE = F ? '#eef3f7' : '#e8c42a', RED = F ? '#27bde0' : '#c8362a', DK = F ? '#0a121c' : '#1d2418', STEEL = F ? '#b8c6d4' : '#8a949c';
      const rb = (geo, p) => put(g, geo, RED, { p, basic: F });
      put(g, lathe([[0, -0.7], [0.06, -0.7], [0.09, -0.62], [0.105, -0.5], [0.105, 0.4], [0.092, 0.55], [0.066, 0.67], [0.03, 0.76], [0, 0.78]]), OL);
      put(g, lathe([[0.112, 0.5], [0.1, 0.55], [0.074, 0.67], [0.036, 0.76], [0, 0.79]]), NOSE);
      rb(cylZ(0.109, 0.109, 0.16, 22), [0, 0, -0.02]);
      // tuyere et empennage : 4 ailerons en fleche, racine posee sur le fuselage (suit la conicite de l'arriere)
      put(g, cylZ(0.082, 0.066, 0.07, 16), DK, { p: [0, 0, -0.7] });
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(f); put(g, fin([[-0.36, 0.085], [-0.7, 0.03], [-0.76, 0.26], [-0.6, 0.27]], 0.022), RED, { parent: f, basic: F }); }
      const tips = [[0.19, 0.19, -0.7], [-0.19, 0.19, -0.7], [0.19, -0.19, -0.7], [-0.19, -0.19, -0.7]];
      // etat 1 : deux flotteurs sur pylones
      if (st >= 1) for (const sx of [-1, 1]) {
        put(g, cylZ(0.056, 0.056, 0.86, 16), OLD, { p: [sx * 0.215, -0.06, -0.04] }); put(g, cylZ(0.056, 0.0, 0.16, 16), OLD, { p: [sx * 0.215, -0.06, 0.47] }); put(g, cylZ(0.056, 0.04, 0.05, 16), DK, { p: [sx * 0.215, -0.06, -0.495] });
        rb(cylZ(0.0575, 0.0575, 0.08, 16), [sx * 0.215, -0.06, 0.2]);
        for (const z of [0.2, -0.3]) put(g, box(0.11, 0.024, 0.12), OLD, { p: [sx * 0.15, -0.045, z] });
        tips.push([sx * 0.27, -0.06, -0.45]);
      }
      // etat 2 : chenilles (caisson, galets) et helice carenee
      if (st >= 2) {
        for (const sx of [-1, 1]) {
          put(g, box(0.034, 0.12, 0.8), DK, { p: [sx * 0.27, -0.06, -0.04] });
          for (let k = 0; k < 5; k++) put(g, new T3.CylinderGeometry(0.048, 0.048, 0.034, 14).rotateZ(Math.PI / 2), STEEL, { p: [sx * 0.29, -0.06, -0.36 + k * 0.16] });
        }
        put(g, ringG(0.112, 0.012), STEEL, { p: [0, 0, -0.78] });
        for (let k = 0; k < 3; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI * 2 / 3 + 0.3; g.add(f); put(g, box(0.012, 0.11, 0.02), DK, { p: [0, 0.058, -0.78], parent: f }); }
        tips.push([0.1, 0.1, -0.8], [-0.1, 0.1, -0.8]);
      }
      // etat 3 : un seul filet lumineux par flotteur et l'anneau de tuyere
      if (st >= 3) {
        for (const sx of [-1, 1]) put(g, box(0.008, 0.012, 0.74), RED, { p: [sx * 0.2155, 0.0, -0.04], basic: true });
        put(g, ringG(0.112, 0.006), RED, { p: [0, 0, -0.78], basic: true });
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
