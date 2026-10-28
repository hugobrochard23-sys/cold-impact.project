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
  const ROCK = ['#8d8774', '#7d7967', '#9b937c', '#6f6b5b', '#868a76', '#968468', '#767263', '#a39a82', '#827a68', '#8f8f7e'];
  const col = (hex) => { const c = new T3.Color(hex); return [c.r, c.g, c.b]; };
  const ROCKC = ROCK.map(col), MOSS = col('#4f7a38'), MOSS2 = col('#6a9142'), SOIL = col('#5f4a33'), DARK = col('#2f352b'), ALGAE = col('#33482c');
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mulc = (a, k) => [Math.min(1, a[0] * k), Math.min(1, a[1] * k), Math.min(1, a[2] * k)];
  const TH = 4.0;   // epaisseur nominale des strates
  const yb = (k, sd) => k * TH + (hh(k, sd, 1) - 0.5) * 0.84 * TH;
  const wk = (k, sd) => 3.0 + 5.0 * hh(k, sd, 2);
  const xb = (k, j, sd) => (j + 0.84 * (hh(k, j, sd + 5) - 0.5) + hh(k, sd, 3)) * wk(k, sd);
  const keep = (k, j, sd) => hh(k, j, sd + 9) > 0.2;
  /* Construit une paroi de blocs.
   *  W(u, off, y) : point du monde ; u = abscisse le long de la paroi, off = profondeur dans la roche (m, positif = vers l'interieur), y = hauteur absolue
   *  o = { uA, uB : blocs dont le centre est dans [uA, uB[ ; topf(u) : hauteur du sommet ; bot : hauteur du bas ; seed ; clamp : coupe les blocs aux extremites ; waterY(u) ; vegetation : nombre de plantes }  */
  R.rockWall = (S, r, W, o) => {
    const sd = o.seed, uA = o.uA, uB = o.uB, topf = o.topf, bot = o.bot, wy = o.waterY || (() => -1e9), clamp = !!o.clamp;
    const P = [], N = [], C = [], U = [], P2 = [], N2 = [], C2 = [];
    const push = (a, b, c, ca, cb, cc, ref, tex) => {
      let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (nx * ref[0] + ny * ref[1] + nz * ref[2] < 0) { const t = b; b = c; c = t; const tc = cb; cb = cc; cc = tc; nx = -nx; ny = -ny; nz = -nz; }
      if (tex) { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); C.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]); U.push(a[3], a[4], b[3], b[4], c[3], c[4]); }
      else { P2.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); N2.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); C2.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]); }
    };
    const quad = (a, b, c, d, ca, cb, cc, cd, ref, tex) => { push(a, b, c, ca, cb, cc, ref, tex); push(a, c, d, ca, cc, cd, ref, tex); };
    const Wp = (u, off, y) => { const p = W(u, off, y); return [p[0], p[1], p[2], u / 3 + sd * 0.37, y / 3]; };   // avec coordonnees de texture (moellons)
    const horiz = (a, b) => { const l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; return [(b[0] - a[0]) / l, 0, (b[2] - a[2]) / l]; };
    const um = (uA + uB) / 2, ym = (bot + topf(um)) / 2, outV = horiz(W(um, 0, ym), W(um, -1, ym));          // vers l'exterieur (le fleuve)
    const tgV = (u) => horiz(W(u - 1, 0, ym), W(u + 1, 0, ym));
    const k0 = Math.floor((bot - 2) / TH) - 1, k1 = Math.ceil((topf(um) + 3) / TH) + 1, blocks = [];
    for (let k = k0; k <= k1; k++) {
      const ya = yb(k, sd), yc = yb(k + 1, sd); if (yc <= bot || ya >= topf(um) + 1.5) continue;
      const w = wk(k, sd), jA = Math.floor(uA / w) - 4, jB = Math.ceil(uB / w) + 4, bs = [];
      for (let j = jA; j <= jB; j++) if (keep(k, j, sd)) bs.push(j);
      const row = [];
      for (let q = 0; q < bs.length - 1; q++) {
        const ja = bs[q], jb = bs[q + 1], xa = xb(k, ja, sd), xz = xb(k, jb, sd); if (xz - xa < 0.4) continue;
        const key = hh(k, ja, sd + 21), off = 0.15 + (hh(k, ja, sd + 11) - 0.12) * 1.9 + (hh(k, 0, sd + 13) - 0.5) * 0.7 + 0.35 * Math.sin((xa + xz) / 34 + k * 1.7);
        row.push({ k, xa, xz, ya, yc, off, key });
      }
      const row2 = [];   // grands blocs : certains se scindent en deux pierres de reliefs differents
      for (const b of row) { const wd = b.xz - b.xa; if (wd > 3.6 && b.key > 0.4) { const m = b.xa + wd * (0.32 + 0.36 * hh(b.k, b.xa, 31)); row2.push(Object.assign({}, b, { xz: m, off: b.off + (hh(b.k, b.xa, 33) - 0.5) * 0.9 }), Object.assign({}, b, { xa: m, off: b.off + (hh(b.k, b.xz, 35) - 0.5) * 1.0 })); } else row2.push(b); }
      for (let q = 0; q < row2.length; q++) { row2[q].l = row2[q - 1]; row2[q].rgt = row2[q + 1]; row2[q].cx = (row2[q].xa + row2[q].xz) / 2; }
      for (const b of row2) if (b.cx >= uA && b.cx < uB) blocks.push(b);
    }
    const Dd = 1.45; let nb = 0, nVeg = 0, ti = 0;
    for (const b of blocks) {
      const tp = topf(b.cx), ya = Math.max(b.ya, bot), yc = Math.min(b.yc, tp + 0.15); if (yc - ya < 0.35) continue;
      let ua = b.xa, uz = b.xz; if (clamp) { ua = Math.max(ua, uA); uz = Math.min(uz, uB); if (uz - ua < 0.3) continue; }
      const wd = uz - ua, ht = yc - ya, jt = (n) => (hh(b.k, b.xa, n) - 0.5) * 0.36 * ht, ju = (n) => (hh(b.k, b.xz, n) - 0.5) * 0.4 * wd;
      const rec = 0.25 + 0.65 * hh(b.k, b.xa, 45), offL = b.off + (hh(b.k, b.xa, 46) - 0.5) * 0.3, offR = b.off + (hh(b.k, b.xz, 47) - 0.5) * 0.3;
      const isTop = yc >= tp - 0.9, nearWater = ya < wy(b.cx) + 1.6;
      const base = ROCKC[Math.floor(hh(b.k, b.xa, 51) * ROCK.length)], mossK = Math.pow(hh(b.k, b.xa, 52), 1.7), yh = Math.max(0, (ya - wy(b.cx)) / 30);
      let cf = mixc(base, MOSS, mossK * 0.34 * (0.4 + yh)); if (isTop) cf = mixc(SOIL, base, 0.25); if (nearWater) cf = mixc(cf, ALGAE, 0.55);
      const cLow = mulc(cf, 1.05), cMid = mulc(cf, 1.5), cHigh = mulc(cf, 1.9), o1 = outV;
      const yBL = ya + jt(41), yBR = ya + jt(42), yTL = yc + jt(43) * 0.6, yTR = yc + jt(44) * 0.6, ymd = (yBL + yTL) / 2 + 0.2 * ht, ymr = (yBR + yTR) / 2 + 0.2 * ht;
      const A0 = Wp(ua + ju(48) * 0.3, offL, yBL), A1 = Wp(uz + ju(49) * 0.3, offR, yBR), M1 = Wp(uz + ju(50) * 0.2, offR + rec * 0.18, ymr), M0 = Wp(ua + ju(51) * 0.2, offL + rec * 0.18, ymd);
      const A2 = Wp(uz + ju(52) * 0.5, offR + rec, yTR), A3 = Wp(ua + ju(53) * 0.5, offL + rec, yTL);
      if (hh(b.k, b.xa, 40) > 0.5) { quad(A0, A1, M1, M0, cLow, cLow, cMid, cMid, o1, true); quad(M0, M1, A2, A3, cMid, cMid, cHigh, cHigh, o1, true); }   // face a plomb + epaule biseautee (texture moellons)
      else quad(A0, A1, A2, A3, cLow, cLow, cHigh, cHigh, o1, true);
      const tcol = isTop ? mixc(MOSS2, MOSS, 0.4) : mixc(base, MOSS2, 0.5 + 0.45 * hh(b.k, b.xa, 53));
      if (isTop || hh(b.k, b.xa, 39) > 0.3) quad(A3, A2, W(uz, offR + rec + Dd, yTR), W(ua, offL + rec + Dd, yTL), mulc(tcol, 0.92), mulc(tcol, 0.92), mulc(tcol, 0.78), mulc(tcol, 0.78), [0, 1, 0]);   // dessus mousseux
      if (!b.l || b.l.off < b.off - 0.22) { const Bk0 = W(ua, offL + rec + Dd, yBL), Bk1 = W(ua, offL + rec + Dd, yTL), rf = tgV(ua); quad(A0, Bk0, Bk1, A3, mulc(cf, 0.5), mulc(cf, 0.42), mulc(cf, 0.42), mulc(cf, 0.5), [-rf[0], 0, -rf[2]]); }
      if (!b.rgt || b.rgt.off < b.off - 0.22) { const Bk0 = W(uz, offR + rec + Dd, yBR), Bk1 = W(uz, offR + rec + Dd, yTR), rf = tgV(uz); quad(A1, Bk0, Bk1, A2, mulc(cf, 0.5), mulc(cf, 0.42), mulc(cf, 0.42), mulc(cf, 0.5), [rf[0], 0, rf[2]]); }
      nb++;
      // petits cailloux colles au bloc (echelle plus fine) : 1 a 3 par gros bloc
      if (wd > 1.9 && ht > 1.0 && hh(b.k, b.xa, 54) > 0.8 && !isTop) {
        const np = 1 + Math.floor(hh(b.k, b.xa, 55) * 2);
        for (let q = 0; q < np; q++) {
          const pw = 0.5 + 0.9 * hh(b.k, b.xa, 56 + q), ph = 0.4 + 0.7 * hh(b.k, b.xa, 60 + q), pu = ua + 0.2 + (wd - pw - 0.4) * hh(b.k, b.xa, 64 + q), py = ya + 0.1 + (ht - ph - 0.2) * hh(b.k, b.xa, 68 + q), pf = Math.max(offL, offR) - 0.2 - 0.5 * hh(b.k, b.xa, 72 + q), pc = mixc(ROCKC[Math.floor(hh(b.k, b.xa, 76 + q) * ROCK.length)], MOSS, 0.12 * hh(b.k, b.xa, 80 + q));
          const p0 = W(pu, pf, py), p1 = W(pu + pw, pf + 0.1, py + ph * 0.1), p2 = W(pu + pw * 0.92, pf + 0.2, py + ph), p3 = W(pu + pw * 0.06, pf + 0.15, py + ph * 0.95), q4 = W(pu + pw * 0.9, pf + 0.45, py + ph), q5 = W(pu + pw * 0.08, pf + 0.45, py + ph * 0.96);
          quad(p0, p1, p2, p3, mulc(pc, 0.6), mulc(pc, 0.6), mulc(pc, 1.0), mulc(pc, 1.0), o1); quad(p3, p2, q4, q5, mulc(pc, 0.95), mulc(pc, 0.95), mulc(pc, 0.8), mulc(pc, 0.8), [0, 1, 0]);
          ti++;
        }
      }
      // plantes qui poussent sur les replats
      if (nVeg < (o.veg === undefined ? 2 : o.veg) && !nearWater && wd > 1.8 && hh(b.k, b.xa, 61) < 0.2 && TR) { nVeg++; const p = W(b.cx, offL + rec + Dd * 0.55, yc + 0.1); (hh(b.k, b.xa, 62) < 0.5 ? TR.fern : TR.bigleaf)(S.b, p[0], p[1], p[2], 1.4 + 1.6 * hh(b.k, b.xa, 63), r); }
    }
    // fond sombre derriere les blocs : aucune trouee, les joints paraissent profonds
    const bk = o.backBot === undefined ? bot - 6 : o.backBot, tpk = topf(um) + 0.2, uL = clamp ? uA : uA - 1, uR = clamp ? uB : uB + 1;
    quad(W(uL, 3.6, bk), W(uR, 3.6, bk), W(uR, 3.6, tpk), W(uL, 3.6, tpk), mulc(DARK, 0.7), mulc(DARK, 0.7), mulc(DARK, 1.0), mulc(DARK, 1.0), outV);
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P2, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N2, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(C2, 3));
    S.b.addGeometry(geo, new V(), Qi, null, 'tree:#ffffff'); geo.dispose();
    if (P.length) { const g2 = new T3.BufferGeometry(); g2.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g2.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g2.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g2.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); S.b.addGeometry(g2, new V(), Qi, null, 'jrock', undefined, [1, 1]); g2.dispose(); }
    return nb + ti;
  };
  // falaise de la berge, tranche [dc - 7, dc + 7[, cote sg (-1 / +1)
  R.cliffFace = (S, r, dc, sg) => {
    const F = (d) => R.faceX(d), W = (d, off, y) => absAt(S, d, sg * (F(d) + off), y);
    const n = R.rockWall(S, r, W, { uA: dc - 7, uB: dc + 7, topf: (d) => R.topAt(d, sg), bot: WY(dc) - 3, backBot: BED(dc) - 2, seed: sg, waterY: (d) => WY(d) });
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
})();
