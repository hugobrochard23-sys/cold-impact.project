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

  const shade = (c, k) => '#' + new T3.Color(c).multiplyScalar(k).getHexString();
  const BUILD = {
    // MISSILE AMPHIBIE, une seule fusee qui evolue en 4 etats (st 0..3) : nue -> flotteurs -> chenilles -> livree finale bleu nuit / blanc / cyan.
    // Fuselage en tranches (comme le missile du niveau 1) : chaque troncon est une piece separee, joints sombres ; vraie tuyere en cloche.
    amphibie(g, st) {
      const F = st >= 3;
      const OL = F ? '#16283f' : '#5f6e3c', OLD = F ? '#0e1a2b' : '#3f4a2a', NOSE = F ? '#eef3f7' : '#e8c42a', RED = F ? '#27bde0' : '#c8362a', DK = F ? '#0a121c' : '#1d2418', STEEL = F ? '#b8c6d4' : '#8a949c';
      const rb = (geo, p) => put(g, geo, RED, { p, basic: F });
      const CT = [[-0.68, 0.062], [-0.62, 0.09], [-0.5, 0.105], [0.4, 0.105], [0.55, 0.092], [0.67, 0.066], [0.76, 0.03], [0.79, 0.0]];
      const rad = (z) => { for (let i = 0; i < CT.length - 1; i++) if (z <= CT[i + 1][0]) { const t = (z - CT[i][0]) / (CT[i + 1][0] - CT[i][0]); return CT[i][1] + (CT[i + 1][1] - CT[i][1]) * Math.max(0, t); } return 0; };
      const sec = (z0, z1, c) => { const p = [[rad(z0), z0]]; for (const q of CT) if (q[0] > z0 + 1e-3 && q[0] < z1 - 1e-3) p.push([q[1], q[0]]); p.push([rad(z1), z1]); put(g, lathe(p, 22), c); };
      sec(-0.68, -0.3, OL); sec(-0.3, 0.2, OL); sec(0.2, 0.5, OL); sec(0.5, 0.7, NOSE); sec(0.7, 0.79, shade(NOSE, 0.82));
      for (const [z, c] of [[-0.3, OL], [0.2, OL], [0.5, NOSE], [0.7, NOSE]]) put(g, cylZ(rad(z) * 1.016, rad(z) * 1.016, 0.016, 22), shade(c, 0.6), { p: [0, 0, z] });
      rb(cylZ(0.109, 0.109, 0.16, 22), [0, 0, -0.04]);
      // tuyere en cloche : col, evasement, levre, interieur noir
      const BELL = [[0.093, -0.84], [0.086, -0.8], [0.072, -0.74], [0.06, -0.69], [0.062, -0.67]];
      put(g, lathe(BELL, 20), shade(STEEL, 0.55)); put(g, lathe(BELL.map((q) => [q[0] - 0.008, q[1]]).reverse(), 20), '#07090c');
      put(g, ringG(0.094, 0.007), STEEL, { p: [0, 0, -0.84] }); put(g, cylZ(0.074, 0.074, 0.02, 18), shade(STEEL, 0.7), { p: [0, 0, -0.685] });
      // empennage : 4 ailerons en fleche, racine posee sur le fuselage
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(f); put(g, fin([[-0.36, 0.085], [-0.68, 0.035], [-0.76, 0.26], [-0.6, 0.27]], 0.022), RED, { parent: f, basic: F }); }
      const tips = [[0.19, 0.19, -0.7], [-0.19, 0.19, -0.7], [0.19, -0.19, -0.7], [-0.19, -0.19, -0.7]];
      // etat 1 : deux flotteurs sur pylones
      if (st >= 1) for (const sx of [-1, 1]) {
        put(g, cylZ(0.056, 0.056, 0.86, 16), OLD, { p: [sx * 0.215, -0.06, -0.04] }); put(g, cylZ(0.056, 0.0, 0.16, 16), OLD, { p: [sx * 0.215, -0.06, 0.47] }); put(g, cylZ(0.056, 0.04, 0.05, 16), DK, { p: [sx * 0.215, -0.06, -0.495] });
        rb(cylZ(0.0575, 0.0575, 0.08, 16), [sx * 0.215, -0.06, 0.2]);
        for (const z of [0.2, -0.3]) put(g, box(0.11, 0.024, 0.12), OLD, { p: [sx * 0.15, -0.045, z] });
        tips.push([sx * 0.27, -0.06, -0.45]);
      }
      // etat 2 : chenilles (caisson, galets)
      if (st >= 2) for (const sx of [-1, 1]) {
        put(g, box(0.034, 0.12, 0.8), DK, { p: [sx * 0.27, -0.06, -0.04] });
        for (let k = 0; k < 5; k++) put(g, new T3.CylinderGeometry(0.048, 0.048, 0.034, 14).rotateZ(Math.PI / 2), STEEL, { p: [sx * 0.29, -0.06, -0.36 + k * 0.16] });
      }
      // etat 3 : un seul filet lumineux par flotteur
      if (st >= 3) for (const sx of [-1, 1]) put(g, box(0.008, 0.012, 0.74), RED, { p: [sx * 0.2155, 0.0, -0.04], basic: true });
      return { tail: -0.84, jr: 0.075, noseZ: 0.84, tips };
    },
    // v408 : NIVEAU 3 « FETE FORAINE » : LE MISSILE CLOWN, une seule fusee qui evolue en 4 etats (st 0..3) :
    //   0 petard (tube raye rouge et blanc, petits ailerons) -> 1 ailes jaunes -> 2 canons a confettis sous les ailes -> 3 missile clown (long, blanc a anneaux, nez rouge rond, collerette)
    clown(g, st) {
      const F = st >= 3, RED = '#e8352f', WH = '#f4f1ea', YE = '#ffc928', BL = '#2f7fe0', DK = '#23262c';
      const len = F ? 1.0 : st >= 1 ? 0.86 : 0.72, z0 = -len * 0.62, zn = len * 0.48, r0 = F ? 0.1 : 0.108;
      const CT = [[z0, r0 * 0.7], [z0 + 0.06, r0], [zn - 0.1, r0], [zn, r0 * 0.86], [zn + 0.12, r0 * 0.5], [zn + 0.2, 0.012]];
      const rad = (z) => { for (let i = 0; i < CT.length - 1; i++) if (z <= CT[i + 1][0]) { const t = (z - CT[i][0]) / (CT[i + 1][0] - CT[i][0]); return CT[i][1] + (CT[i + 1][1] - CT[i][1]) * Math.max(0, t); } return 0.012; };
      const sec = (a, b, c) => { const p = [[rad(a), a]]; for (const q of CT) if (q[0] > a + 1e-3 && q[0] < b - 1e-3) p.push([q[1], q[0]]); p.push([rad(b), b]); put(g, lathe(p, 20), c); };
      // corps a bandes : rayures rouges / blanches (petard), blanc a anneaux de couleur (missile clown)
      const nb = F ? 7 : 6, step = (zn - z0) / nb, RING = [RED, YE, BL];
      for (let k = 0; k < nb; k++) sec(z0 + k * step, z0 + (k + 1) * step, F ? (k % 2 ? RING[(k >> 1) % 3] : WH) : (k % 2 ? WH : RED));
      sec(zn, zn + 0.2, F ? WH : YE);
      if (F) { put(g, sph(0.062), RED, { p: [0, 0, zn + 0.21] }); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; put(g, sph(0.034), k % 2 ? YE : BL, { p: [Math.cos(a) * 0.105, Math.sin(a) * 0.105, zn + 0.01] }); } }   // nez rouge rond + collerette de pompons
      else put(g, cylZ(0.016, 0.016, 0.06, 8), DK, { p: [0, 0, zn + 0.22] });   // la meche du petard
      // tuyere
      const BELL = [[0.088, z0 - 0.13], [0.08, z0 - 0.09], [0.066, z0 - 0.04], [0.06, z0 + 0.01]];
      put(g, lathe(BELL, 18), '#5a5f68'); put(g, lathe(BELL.map((q) => [q[0] - 0.008, q[1]]).reverse(), 18), '#07090c');
      // ailerons de queue (4, alternes jaune / bleu)
      for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(f); put(g, fin([[z0 + 0.22, r0 * 0.8], [z0 + 0.02, r0 * 0.6], [z0 - 0.06, r0 + 0.17], [z0 + 0.08, r0 + 0.18]], 0.022), k % 2 ? BL : YE, { parent: f }); }
      const tips = [];
      // etat 1+ : ailes jaunes a bouts rouges
      if (st >= 1) { const wz = -0.02, sp = F ? 0.36 : 0.42; for (const sx of [-1, 1]) { put(g, flat([[0, wz + 0.16], [sx * sp, wz - 0.02], [sx * sp, wz - 0.12], [0, wz - 0.18]].map((q) => [q[0], q[1]]), 0.02), YE); put(g, sph(0.035), RED, { p: [sx * sp, 0, wz - 0.07] }); tips.push([sx * sp, 0, wz - 0.07]); } }
      // etat 2+ : deux canons a confettis sous les ailes (bleus a bandes blanches, embout jaune)
      if (st >= 2) for (const sx of [-1, 1]) { const x = sx * 0.2; put(g, cylZ(0.045, 0.045, 0.42, 14), BL, { p: [x, -0.05, -0.06] }); put(g, cylZ(0.0465, 0.0465, 0.05, 14), WH, { p: [x, -0.05, 0.03] }); put(g, cylZ(0.045, 0.0, 0.1, 14), YE, { p: [x, -0.05, 0.2] }); put(g, cylZ(0.038, 0.05, 0.05, 14), DK, { p: [x, -0.05, -0.29] }); }
      return { tail: z0 - 0.13, jr: 0.07, noseZ: zn + 0.25, tips };
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
