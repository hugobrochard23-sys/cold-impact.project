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
    // v417 : NIVEAU 4 « ESPACE » : LA FUSEE SPATIALE, 4 etats (st 0..3) : 0 sonde (feuille d'or, panneaux solaires, antenne) -> 1 fusee blanche a deux boosters
    //   -> 2 navette (ailes en delta, nez et bords noirs, trois tuyeres, derive) -> 3 vaisseau (fuseau effile, verriere lumineuse, ailes en fleche a filets lumineux, deux nacelles)
    spatial(g, st) {
      // v418 : une seule livree pour les 4 etats (blanc, noir, orange, details dores) et les memes pieces partout :
      // joints de panneaux sombres, tuyeres grises a anneau incandescent, quads de propulseurs d'attitude, hublots, drapeau
      const WH = '#f2f4f6', WH2 = '#dfe3e8', DK = '#1c1f24', OR = '#e8622a', GO = '#d9a441', GR = '#9aa4ae', BL = '#1e3f9a', GLW = '#ffb066';
      const body = (CT, segs) => { const rad = (z) => { for (let i = 0; i < CT.length - 1; i++) if (z <= CT[i + 1][0]) { const t = (z - CT[i][0]) / (CT[i + 1][0] - CT[i][0]); return CT[i][1] + (CT[i + 1][1] - CT[i][1]) * Math.max(0, t); } return CT[CT.length - 1][1]; };
        for (const [a, b, c] of segs) { const p = [[rad(a), a]]; for (const q of CT) if (q[0] > a + 1e-3 && q[0] < b - 1e-3) p.push([q[1], q[0]]); p.push([rad(b), b]); put(g, lathe(p, 24), c); } return rad; };
      const joint = (z, r, c) => put(g, cylZ(r * 1.012, r * 1.012, 0.012, 24), c || '#8a9098', { p: [0, 0, z] });   // joint de panneau
      const bell = (x, y, z, r) => { const B = [[r, z - 0.13], [r * 0.9, z - 0.09], [r * 0.72, z - 0.035], [r * 0.6, z]]; put(g, lathe(B, 18), '#4a4f58', { p: [x, y, 0] }); put(g, lathe(B.map((q) => [q[0] - 0.007, q[1]]).reverse(), 18), '#07090c', { p: [x, y, 0] }); put(g, ringG(r * 0.98, 0.006), GLW, { p: [x, y, z - 0.128], basic: true }); put(g, ringG(r * 0.62, 0.008), GR, { p: [x, y, z] }); };
      const rcs = (z, r) => { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; put(g, box(0.03, 0.03, 0.04), DK, { p: [Math.cos(a) * (r + 0.012), Math.sin(a) * (r + 0.012), z] }); } };   // quads de propulseurs d'attitude
      const flag = (x, y, z, r) => { put(g, box(0.004, 0.035, 0.055), '#c8352a', { p: [x, y, z], r: [0, 0, r || 0] }); put(g, box(0.005, 0.016, 0.024), BL, { p: [x, y + 0.009, z + 0.015], r: [0, 0, r || 0] }); };
      const port = (x, y, z) => { put(g, sph(0.018), '#0c1420', { p: [x, y, z], s: [1, 1, 0.5] }); put(g, ringG(0.019, 0.004), GR, { p: [x, y, z] }); };
      const tips = [];
      if (st === 0) {   // SONDE : corps en feuille d'or, coiffe blanche, deux ailes solaires, antenne parabolique
        const CT = [[-0.42, 0.07], [-0.38, 0.1], [0.2, 0.1], [0.3, 0.085], [0.42, 0.035], [0.47, 0.0]];
        body(CT, [[-0.42, -0.2, GO], [-0.2, 0.0, shade(GO, 0.86)], [0.0, 0.2, GO], [0.2, 0.47, WH]]);
        joint(-0.2, 0.1, DK); joint(0.0, 0.1, DK); joint(0.2, 0.1, DK); put(g, cylZ(0.101, 0.101, 0.03, 24), OR, { p: [0, 0, 0.1] }); rcs(0.26, 0.09);
        bell(0, 0, -0.42, 0.075);
        for (const sx of [-1, 1]) { put(g, box(0.14, 0.014, 0.014), GR, { p: [sx * 0.17, 0, -0.06] }); const px = sx * 0.42;
          put(g, box(0.38, 0.01, 0.22), DK, { p: [px, 0, -0.06] }); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) put(g, box(0.085, 0.012, 0.095), BL, { p: [px - 0.143 + i * 0.095, 0, -0.06 - 0.05 + j * 0.1] });
          put(g, box(0.39, 0.014, 0.006), GR, { p: [px, 0, 0.052] }); put(g, box(0.39, 0.014, 0.006), GR, { p: [px, 0, -0.172] }); tips.push([sx * 0.61, 0, -0.06]); }
        put(g, new T3.SphereGeometry(0.075, 16, 8, 0, 6.283, 0, 1.0), WH, { p: [0, 0.16, 0.12], r: [-0.35, 0, 0] }); put(g, box(0.008, 0.07, 0.008), GR, { p: [0, 0.12, 0.12] }); put(g, sph(0.012), GR, { p: [0, 0.19, 0.16] });
        put(g, sph(0.016), '#ff3a2a', { p: [0, 0.103, -0.3], basic: true }); flag(0.101, 0, 0.3, 0);
        return { tail: -0.55, jr: 0.06, noseZ: 0.49, tips };
      }
      if (st === 1) {   // FUSEE A BOOSTERS : corps blanc, interetage noir, bande orange, deux boosters a ogive orange
        const CT = [[-0.62, 0.09], [-0.56, 0.095], [0.5, 0.095], [0.62, 0.082], [0.76, 0.042], [0.85, 0.0]];
        body(CT, [[-0.62, -0.1, WH], [-0.1, 0.0, DK], [0.0, 0.5, WH], [0.5, 0.6, OR], [0.6, 0.85, WH]]);
        for (const z of [-0.4, -0.25, 0.2, 0.35]) joint(z, 0.095); rcs(0.55, 0.088); flag(0.096, 0, 0.3, 0); port(0, 0.09, 0.66);
        for (const sx of [-1, 1]) put(g, box(0.005, 0.07, 0.26), DK, { p: [sx * 0.096, 0, -0.35] });   // bandes de roulis noires
        bell(0, 0, -0.62, 0.08);
        for (const sx of [-1, 1]) { const x = sx * 0.155; put(g, cylZ(0.05, 0.05, 0.78, 18), WH, { p: [x, 0, -0.18] }); put(g, cylZ(0.05, 0.0, 0.15, 18), OR, { p: [x, 0, 0.285] }); put(g, cylZ(0.051, 0.051, 0.04, 18), DK, { p: [x, 0, -0.4] }); put(g, cylZ(0.051, 0.051, 0.02, 18), DK, { p: [x, 0, 0.05] }); bell(x, 0, -0.57, 0.045);
          for (const z of [-0.45, 0.1]) put(g, box(0.07, 0.02, 0.03), GR, { p: [sx * 0.11, 0, z] }); tips.push([x, 0, -0.62]); }
        for (let k = 0; k < 4; k++) { const f = new T3.Group(); f.rotation.z = k * Math.PI / 2; g.add(f); put(g, fin([[-0.4, 0.09], [-0.6, 0.09], [-0.64, 0.19], [-0.52, 0.19]], 0.016), DK, { parent: f }); }
        return { tail: -0.75, jr: 0.07, noseZ: 0.87, tips };
      }
      if (st === 2) {   // NAVETTE : blanche, nez et ventre noirs, bords d'attaque noirs, derive a bande orange, trois tuyeres
        const CT = [[-0.6, 0.1], [-0.5, 0.11], [0.45, 0.11], [0.6, 0.095], [0.72, 0.062], [0.8, 0.0]];
        body(CT, [[-0.6, 0.45, WH], [0.45, 0.66, WH], [0.66, 0.8, DK]]);
        for (const z of [-0.3, 0.0, 0.3]) joint(z, 0.11);
        put(g, box(0.2, 0.03, 1.0), DK, { p: [0, -0.095, 0.0] });
        for (const sx of [-1, 1]) put(g, box(0.004, 0.01, 0.8), '#b8bec6', { p: [sx * 0.045, 0.11, -0.05] });
        for (let k = 0; k < 3; k++) put(g, box(0.035, 0.022, 0.03), DK, { p: [-0.04 + k * 0.04, 0.086, 0.6], r: [-0.4, 0, 0] });
        for (const sx of [-1, 1]) { put(g, flat([[0, 0.3], [sx * 0.44, -0.4], [sx * 0.44, -0.52], [0, -0.52]], 0.018), WH, { p: [0, -0.04, 0] }); put(g, flat([[0, 0.31], [sx * 0.455, -0.4], [sx * 0.44, -0.4], [0, 0.29]], 0.022), DK, { p: [0, -0.04, 0] }); put(g, flat([[sx * 0.1, -0.45], [sx * 0.4, -0.45], [sx * 0.4, -0.52], [sx * 0.1, -0.52]], 0.02), WH2, { p: [0, -0.04, 0] }); put(g, box(0.012, 0.02, 0.12), OR, { p: [sx * 0.43, -0.04, -0.46] }); tips.push([sx * 0.44, -0.04, -0.46]); }
        flag(0.111, 0.02, 0.1, 0); rcs(0.62, 0.085);
        put(g, fin([[-0.2, 0.1], [-0.58, 0.1], [-0.62, 0.4], [-0.5, 0.4]], 0.02), WH); put(g, box(0.024, 0.02, 0.13), OR, { p: [0, 0.39, -0.56] }); put(g, box(0.022, 0.05, 0.05), DK, { p: [0, 0.32, -0.5] });
        bell(0, 0.03, -0.6, 0.06); bell(-0.065, -0.03, -0.6, 0.05); bell(0.065, -0.03, -0.6, 0.05);
        for (const sx of [-1, 1]) { put(g, cylZ(0.035, 0.035, 0.14, 12), WH, { p: [sx * 0.08, 0.06, -0.55] }); bell(sx * 0.08, 0.06, -0.62, 0.025); }
        return { tail: -0.73, jr: 0.08, noseZ: 0.81, tips };
      }
      // VAISSEAU : meme livree (dessus blanc, ventre noir, filets orange), verriere, ailes en fleche, deux nacelles a anneau incandescent
      const CT = [[-0.7, 0.07], [-0.6, 0.09], [0.3, 0.085], [0.6, 0.056], [0.9, 0.016], [0.98, 0.0]];
      body(CT, [[-0.7, -0.3, WH2], [-0.3, 0.3, WH], [0.3, 0.98, WH]]);
      for (const z of [-0.3, 0.0, 0.3, 0.6]) joint(z, 0.087); put(g, cylZ(0.088, 0.088, 0.03, 24), OR, { p: [0, 0, -0.45] });
      put(g, box(0.15, 0.03, 1.1), DK, { p: [0, -0.07, -0.05] });   // ventre noir
      { const cp = new T3.Mesh(new T3.SphereGeometry(0.06, 16, 10), new T3.MeshBasicMaterial({ color: '#1a5a7a' })); cp.scale.set(1, 0.7, 2.4); cp.position.set(0, 0.06, 0.48); g.add(cp); put(g, ringG(0.062, 0.006), DK, { p: [0, 0.06, 0.48], s: [1, 0.7, 1] }); }
      flag(0.087, 0, 0.15, 0); rcs(0.75, 0.04);
      for (const sx of [-1, 1]) {
        put(g, flat([[0, 0.25], [sx * 0.5, -0.38], [sx * 0.52, -0.48], [sx * 0.3, -0.42], [0, -0.5]], 0.02), DK);
        put(g, flat([[sx * 0.06, 0.2], [sx * 0.49, -0.36], [sx * 0.5, -0.39], [sx * 0.06, 0.165]], 0.024), OR);   // filet orange du bord d'attaque
        put(g, box(0.05, 0.022, 0.08), WH, { p: [sx * 0.5, 0, -0.43] });
        put(g, flat([[0, 0.72], [sx * 0.16, 0.58], [sx * 0.16, 0.55], [0, 0.6]], 0.014), DK);
        const x = sx * 0.2; put(g, cylZ(0.055, 0.045, 0.5, 18), WH, { p: [x, -0.02, -0.3] }); put(g, cylZ(0.056, 0.056, 0.02, 18), OR, { p: [x, -0.02, -0.12] }); put(g, cylZ(0.045, 0.0, 0.1, 18), DK, { p: [x, -0.02, -0.0] }); bell(x, -0.02, -0.55, 0.05);
        const f = new T3.Group(); f.position.set(sx * 0.12, 0.05, 0); f.rotation.z = -sx * 0.35; g.add(f); put(g, fin([[-0.3, 0.0], [-0.62, 0.0], [-0.66, 0.26], [-0.52, 0.26]], 0.016), DK, { parent: f }); put(g, box(0.02, 0.012, 0.12), OR, { parent: f, p: [0, 0.255, -0.59] });
        tips.push([sx * 0.5, 0, -0.42]); }
      bell(0, 0, -0.7, 0.075);
      return { tail: -0.84, jr: 0.07, noseZ: 1.0, tips };
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
