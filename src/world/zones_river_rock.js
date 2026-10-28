/* v296 : NIVEAU 2 : FALAISES EN BLOCS. Les parois ne sont plus de grandes boites grises : ce sont des surfaces continues faites de centaines de blocs de roche irreguliers (strates d'epaisseurs differentes, blocs plus ou
 * moins larges, arretes biseautees, cailloux colles aux blocs, fissures sombres entre eux, saillies et creux, dessus mousseux, couche de terre et de racines au sommet) posees devant un fond sombre.
 * Les strates et les joints sont calcules a partir de la position le long de la paroi (jamais du hasard de la tranche) : tout se raccorde d'une tranche a l'autre. La collision reste celle de la boite, invisible.
 * Rien ne flotte : chaque bloc touche son voisin ; les blocs de la paroi sont plus ou moins en retrait de la collision (jamais devant de plus de 0,5 m). */
(function () {
  const EVO = CC.EVO, R = EVO && EVO.riv, T3 = THREE, V = T3.Vector3; if (!R || !EVO.oc) return;
  const { WY, HW, LA, BED, absAt, mixf } = R, ss = EVO.oc.ss, TR = CC.Trees;
  const Qi = new T3.Quaternion();
  const fr = (v) => v - Math.floor(v);
  const hh = (a, b, c) => fr(Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453);
  // face de la berge (distance a l'axe) et hauteur du sommet : fonctions deterministes, partagees avec les collisions, le sol et les collines
  R.faceX = (d) => HW(d) + 1.2;
  R.topAt = (d, sg) => {
    if (d < 74) return 74 + 2 * Math.sin(d / 9 + sg);
    if (d < LA) return (d < 140 ? mixf(74, WY(d) + 26, ss(74, 140, d)) : WY(d) + 26) + 4 * Math.sin(d / 53 + sg * 1.7) + 2 * Math.sin(d / 17 + sg);
    return WY(d) + 26 + 3 * Math.sin(d / 53 + sg);
  };
  const ROCK = ['#a1a090', '#979a88', '#a8a592', '#8d9080', '#9ca48f', '#a49c88', '#909282', '#adab98'];
  const col = (hex) => { const c = new T3.Color(hex); return [c.r, c.g, c.b]; };
  const ROCKC = ROCK.map(col), MOSS = col('#5a8a3e'), MOSS2 = col('#78a448'), SOIL = col('#6a5438'), DARK = col('#343a30'), ALGAE = col('#3d5a36');
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mulc = (a, k) => [Math.min(1, a[0] * k), Math.min(1, a[1] * k), Math.min(1, a[2] * k)];
  const TH = 5.0, STEP = 5.0;   // epaisseur nominale des strates, pas le long de la paroi
  const yb = (k, sd) => k * TH + (hh(k, sd, 1) - 0.5) * 0.8 * TH;
  /* PAROI EN STRATES LISSES : chaque strate est une bande continue qui ondule doucement le long de la paroi (bas a plomb, milieu legerement bombe, haut en retrait) ; entre deux strates, un replat mousseux.
   * Quelques saillies arrondies, soudees a la paroi (jamais de bloc qui flotte). Les hauteurs des strates sont les memes pour toutes les tranches : tout se raccorde.
   *  W(u, off, y) : point du monde ; u = abscisse le long de la paroi, off = profondeur dans la roche (m, positif = vers l'interieur), y = hauteur absolue
   *  o = { uA, uB : intervalles dont le debut est dans [uA, uB[ ; topf(u) : hauteur du sommet ; bot : hauteur du bas ; seed ; clamp : paroi plane a extremites nettes ; waterY(u) ; veg : nombre de plantes }  */
  R.rockWall = (S, r, W, o) => {
    const sd = o.seed, uA = o.uA, uB = o.uB, topf = o.topf, bot = o.bot, wy = o.waterY || (() => -1e9), clamp = !!o.clamp;
    const P = [], N = [], C = [], U = [];
    const push = (a, b, c, ca, cb, cc, ref) => {
      let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (nx * ref[0] + ny * ref[1] + nz * ref[2] < 0) { const t = b; b = c; c = t; const tc = cb; cb = cc; cc = tc; nx = -nx; ny = -ny; nz = -nz; }
      P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); C.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]); U.push(a[3], a[4], b[3], b[4], c[3], c[4]);
    };
    const quad = (a, b, c, d, ca, cb, cc, cd, ref) => { push(a, b, c, ca, cb, cc, ref); push(a, c, d, ca, cc, cd, ref); };
    const horiz = (a, b) => { const l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; return [(b[0] - a[0]) / l, 0, (b[2] - a[2]) / l]; };
    const um = (uA + uB) / 2, ym = (bot + topf(um)) / 2, outV = horiz(W(um, 0, ym), W(um, -1, ym));          // vers l'exterieur (le fleuve)
    const Wp = (u, off, y, vv) => { const p = W(u, off, y); return [p[0], p[1], p[2], u / 6 + sd * 0.31, (vv === undefined ? y : vv) / 6]; };   // avec coordonnees de texture
    // profils d'une strate (pures fonctions de la strate k et de u : se raccordent d'une tranche a l'autre)
    const sm = (u, k, n) => Math.sin(u / (9 + 7 * hh(k, sd, 80 + n)) + hh(k, sd, 90 + n) * 6.28);
    const but = (k, u) => { const c = Math.floor(u / 17), kk = Math.floor(k / 3), cu = (c + 0.2 + 0.6 * hh(kk, c, sd + 14)) * 17, w = 4.5 + 4 * hh(kk, c, sd + 15), t = (u - cu) / w; return (hh(kk, c, sd + 16) > 0.55 ? 1 : 0) * Math.exp(-t * t) * (0.35 + 0.5 * hh(kk, c, sd + 17)); };   // saillie arrondie ; v298 : contreforts larges et doux, communs a 3 strates (plus de blocs etroits decales qui laissent des fentes sombres)
    const offB = (k, u) => Math.max(-0.35, 0.6 + 0.9 * hh(k, sd, 11) + 0.46 * sm(u, k, 1) + 0.24 * sm(u * 2.3, k, 2) - but(k, u));
    const offT = (k, u, last) => last ? offB(k, u) + 0.6 : Math.max(offB(k, u) + 0.35 + 0.35 * hh(k, sd, 12), offB(k + 1, u) + 0.28);
    const bulge = (k) => 0.12 + 0.25 * hh(k, sd, 13);
    const k0 = Math.floor((bot - 2) / TH) - 1, k1 = Math.ceil((topf(um) + 3) / TH) + 1;
    let nSeg = Math.max(1, Math.round((uB - uA) / STEP)), u0 = uA, du = (uB - uA) / nSeg;
    if (!clamp) { const i0 = Math.ceil(uA / STEP), i1 = Math.ceil(uB / STEP); nSeg = i1 - i0; u0 = i0 * STEP; du = STEP; }
    let nVeg = 0, nq = 0; const vegMax = o.veg === undefined ? 2 : o.veg;
    for (let i = 0; i < nSeg; i++) {
      const ua = u0 + i * du, uz = ua + du, ends = [ua, uz], cut = ends.map((u) => topf(u) - 0.3);
      for (let k = k0; k <= k1; k++) {
        const y0 = yb(k, sd), y1 = yb(k + 1, sd); if (y1 <= bot + 0.4 || y0 >= Math.min(cut[0], cut[1]) - 0.4) continue;
        const R0 = [], R1 = [], R2 = [], LG = [], cols = [];
        let ok = true;
        for (let e = 0; e < 2; e++) {
          const u = ends[e], last = y1 > cut[e], yb_ = Math.max(y0, bot), yt = last ? cut[e] : y1; if (yt - yb_ < 0.4) { ok = false; break; }
          const ob = offB(k, u), ot = offT(k, u, last), om = ob - bulge(k) * Math.min(1, (yt - yb_) / 2.5);
          R0.push(Wp(u, ob, yb_)); R1.push(Wp(u, om, (yb_ + yt) / 2)); R2.push(Wp(u, ot, yt));
          if (!last) LG.push(Wp(u, offB(k + 1, u), yt, ot)); else LG.push(Wp(u, 2.7, yt, 2.7));
          const base = ROCKC[Math.floor(hh(k, sd, 51) * ROCK.length)], mossK = 0.14 + 0.3 * hh(k, sd, 52) * (0.5 + 0.5 * sm(u, k, 3)), nearW = yb_ < wy(u) + 1.6;
          let cf = mixc(base, MOSS, mossK * Math.min(1, 0.4 + Math.max(0, (yb_ - wy(u)) / 30))); if (nearW) cf = mixc(cf, ALGAE, 0.5); if (last) cf = mixc(cf, SOIL, 0.55);
          cols.push({ cf, lg: last ? mixc(SOIL, MOSS, 0.5) : mixc(base, MOSS2, 0.55 + 0.3 * hh(k, sd, 53)), last });
        }
        if (!ok) continue;
        const c0 = cols[0], c1 = cols[1], ref = outV;
        quad(R0[0], R0[1], R1[1], R1[0], mulc(c0.cf, 0.8), mulc(c1.cf, 0.8), mulc(c1.cf, 1.0), mulc(c0.cf, 1.0), ref);
        quad(R1[0], R1[1], R2[1], R2[0], mulc(c0.cf, 1.0), mulc(c1.cf, 1.0), mulc(c1.cf, 1.08), mulc(c0.cf, 1.08), ref);
        quad(R2[0], R2[1], LG[1], LG[0], mulc(c0.lg, 0.95), mulc(c1.lg, 0.95), mulc(c1.lg, 0.82), mulc(c0.lg, 0.82), [0, 1, 0]);   // replat mousseux (ou terre sous l'herbe au sommet)
        nq++;
        if (nVeg < vegMax && !c0.last && TR && hh(k, i + Math.floor(u0), sd + 61) < 0.16) { nVeg++; const uu = (ua + uz) / 2, p = W(uu, (offT(k, uu, false) + offB(k + 1, uu)) / 2, y1 + 0.08); (hh(k, i, sd + 62) < 0.5 ? TR.fern : TR.bigleaf)(S.b, p[0], p[1], p[2], 1.3 + 1.4 * hh(k, i, sd + 63), r); }
      }
    }
    // fond sombre derriere la paroi (sous la ligne d'eau on voit a travers l'eau)
    const bk = o.backBot === undefined ? bot - 6 : o.backBot, tpk = Math.max(topf(uA), topf(um), topf(uB)) + 0.2, uL = clamp ? uA : uA - 1.5, uR = clamp ? uB : uB + 1.5, BKC = mixc(ROCKC[3], DARK, 0.3);   // v298 : le fond est de la roche (meme texture), plus un plan noir : un raccord entrouvert ne montre jamais de vide
    quad(Wp(uL, 3.0, bk), Wp(uR, 3.0, bk), Wp(uR, 3.0, tpk), Wp(uL, 3.0, tpk), mulc(BKC, 0.62), mulc(BKC, 0.62), mulc(BKC, 0.9), mulc(BKC, 0.9), outV);
    if (!P.length) return 0;
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(U, 2));
    S.b.addGeometry(geo, new V(), Qi, null, 'rockface', undefined, [1, 1]); geo.dispose();
    return nq;
  };
  // falaise de la berge, tranche [dc - 7, dc + 7[, cote sg (-1 / +1)
  R.cliffFace = (S, r, dc, sg) => {
    const F = (d) => R.faceX(d), W = (d, off, y) => absAt(S, d, sg * (F(d) + off), y);
    const n = R.rockWall(S, r, W, { uA: dc - 7, uB: dc + 7, topf: (d) => R.topAt(d, sg), bot: Math.min(WY(dc - 21), WY(dc), WY(dc + 21)) - 3, backBot: BED(dc) - 2, seed: sg, waterY: (d) => WY(d) });
    if (TR && TR.vine) for (let k = 0; k < 1; k++) if (r() < 0.6) { const d = dc + r.between([-6, 6]), p = W(d, 0.6, R.topAt(d, sg) - 0.5); TR.vine(S.b, p[0], p[1], p[2], r.between([5, 14]), r); }
    return n;
  };
  // paroi plane (eperons, linteau) : face a la distance d = dFix, entre les distances laterales lA et lB (valeurs signees), regardant vers dir (-1 : vers l'amont du fleuve, +1 : vers l'aval)
  R.faceAcross = (S, r, dFix, lA, lB, dir, yBot, yTop, seed, opt) => {
    const a = Math.min(lA, lB), b = Math.max(lA, lB), W = (u, off, y) => absAt(S, dFix + dir * off, a + u, y);
    return R.rockWall(S, r, W, Object.assign({ uA: 0, uB: b - a, topf: () => yTop, bot: yBot, seed, clamp: true, veg: 1 }, opt || {}));
  };
  // paroi plane le long du fleuve (face d'un eperon) a la distance laterale lFix (signee), pour d entre d0 et d1 : regarde vers le fleuve
  R.faceAlong = (S, r, d0, d1, lFix, yBot, yTop, seed, opt) => {
    const sg = lFix >= 0 ? 1 : -1, W = (u, off, y) => absAt(S, d0 + u, lFix + sg * off, y);
    return R.rockWall(S, r, W, Object.assign({ uA: 0, uB: d1 - d0, topf: () => yTop, bot: yBot, seed, clamp: true, veg: 1 }, opt || {}));
  };

  // v298 : falaises de la plateforme de lancement (d = -214 a 69) : memes strates que le fleuve, fermees derriere le lanceur et en travers au bout (plus de mur plat, ni de boules, ni de vide) ; geometrie unique, posee par le tick de zones_river.js
  R.launchCliffs = (run) => {
    const geos = [], SB = { b: { addGeometry: (geo) => { geos.push(geo.clone()); } } }, P = (d, lat, y) => { const p = run.T.at(d, lat, 0); return [p[0], y, p[2]]; };
    for (const sg of [-1, 1]) {
      for (let a = -214; a < 69; a += 36) { const b = Math.min(69, a + 36), bot = Math.max(-30, R.BED(b) - 6), lat = sg * 110.3;
        R.rockWall(SB, null, (u, off, y) => P(u, lat + sg * off, y), { uA: a, uB: b, topf: (u) => 74 + 2 * Math.sin(u / 9 + sg), bot, backBot: bot - 4, seed: 11 + sg, veg: 0 }); }
      const l0 = sg * (R.faceX(68) - 0.3), l1 = sg * 110.3, lo = Math.min(l0, l1), w = Math.abs(l1 - l0), bot = R.BED(68) - 6;
      R.rockWall(SB, null, (u, off, y) => P(67.6 + off, lo + u, y), { uA: 0, uB: w, topf: () => 74.6, bot, backBot: bot - 4, seed: 31 + sg, clamp: true, veg: 0 });
    }
    R.rockWall(SB, null, (u, off, y) => P(-204.4 - off, u, y), { uA: -128, uB: 128, topf: () => 76, bot: 28, backBot: 24, seed: 21, clamp: true, veg: 0 });
    const n = geos.reduce((t, g) => t + g.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    for (const g of geos) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T3.BufferAttribute(nor, 3)); geo.setAttribute('color', new T3.BufferAttribute(col, 3)); geo.setAttribute('uv', new T3.BufferAttribute(uv, 2));
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ map: CC.Textures.get('rockface'), vertexColors: true })); 
    const cp = [], cc = [], gcol = new T3.Color('#5a9a42');   // dessus : un replat d'herbe au ras de la falaise (rien derriere)
    for (const sg of [-1, 1]) for (let d = -214; d < 69; d += 6) { const d2 = Math.min(69, d + 6); for (const [dd, lt] of [[d, 110.3], [d, 150], [d2, 150], [d, 110.3], [d2, 150], [d2, 110.3]]) { const p = run.T.at(dd, sg * lt, 0); cp.push(p[0], 74 + 2 * Math.sin(dd / 9 + sg) + 0.08, p[2]); cc.push(gcol.r, gcol.g, gcol.b); } }
    const cg = new T3.BufferGeometry(); cg.setAttribute('position', new T3.Float32BufferAttribute(cp, 3)); cg.setAttribute('color', new T3.Float32BufferAttribute(cc, 3)); cg.computeVertexNormals();
    const na = cg.attributes.normal; for (let i = 0; i < na.count; i++) na.setXYZ(i, 0, 1, 0);
    const out = new T3.Group(); out.add(m); out.add(new T3.Mesh(cg, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }))); return out;
  };
})();
