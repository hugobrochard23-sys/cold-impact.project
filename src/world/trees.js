/* v117 : ARBRES, BUISSONS, ROCHERS — générateur de végétation en facettes (flat shading), couleurs de sommet en dégradé (ombre au pied et sous les branches,
 * pointes plus claires, variation de teinte d'un arbre à l'autre). Tout est fusionné dans les lots du décor (un seul appel de dessin par matière).
 *   CC.Trees.conifer(b, x, y, z, h, rnd, o)   sapin à 7-9 étages de branches retombantes, tronc évasé à la base, pointe
 *   CC.Trees.broadleaf(b, x, y, z, h, rnd, o) feuillu : tronc qui se divise, couronne de 5-7 masses irrégulières
 *   CC.Trees.bush(b, x, y, z, s, rnd)         buisson ; CC.Trees.rock(b, x, y, z, s, rnd, o)  rocher mousseux ; CC.Trees.stump / log
 * rnd = générateur du décor (appelable : rnd() ∈ [0,1[, rnd.between([a,b])). */
(function () {
  const V = THREE.Vector3, Q = new THREE.Quaternion();
  const T = {};
  const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const mul = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rr = (rnd, a, b) => a + (b - a) * rnd();
  // v206 : plans d'eau (rectangles orientes declares par la scene) : ni arbre, ni rocher, ni buisson dedans
  const inWater = (b, x, z) => { const W = b && b.water; if (!W) return false; for (const w of W) { const dx = x - w.x, dz = z - w.z, al = dx * w.ux + dz * w.uz, ac = -dx * w.uz + dz * w.ux; if (Math.abs(ac) < w.hw && Math.abs(al) < w.hd) return true; } return false; };

  // constructeur de géométrie : on pousse des triangles (a, b, c) avec une couleur par sommet ; normales plates à la fin
  function Mesh() { this.p = []; this.c = []; this.sm = []; this.smooth = false; }
  Mesh.prototype.tri = function (a, b, c, ca, cb, cc) { this.sm.push(this.smooth ? 1 : 0); this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); this.c.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]); };
  Mesh.prototype.quad = function (a, b, c, d, ca, cb, cc, cd) { this.tri(a, b, c, ca, cb, cc); this.tri(a, c, d, ca, cc, cd); };
  Mesh.prototype.geo = function () {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
    // v206 : masses (feuillages, buissons, rochers) ombrees en DOUX : la normale de chaque sommet est la moyenne des faces qui s'y touchent (aspect arrondi, « bonbon »), la silhouette reste taillee
    { const Nn = g.attributes.normal.array, Pp = this.p, acc = new Map(), key = (i) => Math.round(Pp[i] * 40) + ',' + Math.round(Pp[i + 1] * 40) + ',' + Math.round(Pp[i + 2] * 40);
      for (let t = 0; t < this.sm.length; t++) if (this.sm[t]) for (let v = 0; v < 3; v++) { const i = t * 9 + v * 3, k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += Nn[i]; a[1] += Nn[i + 1]; a[2] += Nn[i + 2]; }
      for (let t = 0; t < this.sm.length; t++) if (this.sm[t]) for (let v = 0; v < 3; v++) { const i = t * 9 + v * 3, a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; Nn[i] = a[0] / l; Nn[i + 1] = a[1] / l; Nn[i + 2] = a[2] / l; } }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(this.p.length / 3 * 2).fill(0), 2));
    return g;
  };
  // tronc / branche : tube conique entre deux points, 7 pans, couleur de la base au sommet
  Mesh.prototype.tube = function (p0, r0, p1, r1, c0, c1, seg) {
    seg = seg || 7; const ax = new V(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), L = ax.length(); ax.divideScalar(L || 1);
    const u = Math.abs(ax.y) < 0.95 ? new V(0, 1, 0).cross(ax).normalize() : new V(1, 0, 0), v = new V().crossVectors(ax, u);
    const ring = (p, r, k) => { const out = []; for (let i = 0; i < seg; i++) { const a = i / seg * 6.2832, w = 1 + 0.12 * Math.sin(i * 2.3 + k); out.push([p[0] + (u.x * Math.cos(a) + v.x * Math.sin(a)) * r * w, p[1] + (u.y * Math.cos(a) + v.y * Math.sin(a)) * r * w, p[2] + (u.z * Math.cos(a) + v.z * Math.sin(a)) * r * w]); } return out; };
    const A = ring(p0, r0, 0), B = ring(p1, r1, 1);
    for (let i = 0; i < seg; i++) { const j = (i + 1) % seg, sh = 0.9 + 0.1 * Math.cos(i / seg * 6.2832); this_quad(this, A[i], A[j], B[j], B[i], mul(c0, sh), mul(c0, sh), mul(c1, sh), mul(c1, sh)); }
  };
  function this_quad(m, a, b, c, d, ca, cb, cc, cd) { m.quad(a, b, c, d, ca, cb, cc, cd); }

  const CONIFER = [['#1b5639', '#3d8b55'], ['#1b5639', '#28734a'], ['#216040', '#3d8b55'], ['#1b5639', '#337f4f'], ['#216040', '#28734a']];   // v186 : plus de faces presque noires
  const BROAD = [['#527d3d', '#79b34b'], ['#527d3d', '#9bcf59'], ['#5a8844', '#b7e16c'], ['#527d3d', '#9bcf59'], ['#5a8844', '#79b34b']], BIRCH = [['#527d3d', '#9bcf59'], ['#5a8844', '#79b34b']];
  const AUTUMN = [['#8a5a22', '#c0873a'], ['#7a4a1e', '#b8742c']];
  const BARK = ['#795438', '#a17a50', '#503a2b', '#795438'];
  const hexk = (h, k) => mul(hex(h), k);

  // v183 : ombre de contact (disque sombre pose juste au-dessus du sol, tres leger : 8 triangles)
  const shade = (m, x, y, z, r, col) => { const c = hex(col), o = mul(c, 1.2); for (const [k, y0, cc] of [[1, 0.06, o], [0.6, 0.075, c]]) for (let q = 0; q < 8; q++) { const a0 = q / 8 * 6.2832, a1 = (q + 1) / 8 * 6.2832, R = r * k; m.tri([x, y + y0, z], [x + Math.cos(a0) * R, y + y0, z + Math.sin(a0) * R * 0.85], [x + Math.cos(a1) * R, y + y0, z + Math.sin(a1) * R * 0.85], cc, cc, cc); } };   // v187 : ombre de contact en deux anneaux (penombre + coeur)

  T.conifer = function (b, x, y, z, h, rnd, o) {
    if (inWater(b, x, z)) return;
    o = o || {}; const m = new Mesh(), pal = CONIFER[Math.floor(rnd() * CONIFER.length)], dark = hexk(pal[0], 0.95 + 0.1 * rnd()), light = hexk(pal[1], 0.84 + 0.1 * rnd()), bark = hex(BARK[Math.floor(rnd() * BARK.length)]);
    const tiers = o.far ? 5 + Math.floor(rnd() * 2) : 7 + Math.floor(rnd() * 3), R = h * rr(rnd, 0.17, 0.23), lean = [rr(rnd, -0.025, 0.025) * h, rr(rnd, -0.025, 0.025) * h];
    const cx = (t) => x + lean[0] * t, cz = (t) => z + lean[1] * t;
    // tronc évasé à la base, qui monte presque jusqu'à la pointe
    m.tube([x, y - 0.8, z], h * 0.045 + 0.38, [x, y + h * 0.1, z], h * 0.03 + 0.24, mul(bark, 0.7), mul(bark, 0.85), 8);
    m.tube([x, y + h * 0.1, z], h * 0.03 + 0.24, [cx(1), y + h * 0.93, cz(1)], 0.06, mul(bark, 0.85), mul(bark, 1.05), 7);
    // étages de branches, du bas vers le haut
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1), y0 = y + h * (0.13 + 0.74 * t), dh = h * (0.2 - 0.05 * t), Ri = Math.max(0.5, R * Math.pow(1 - t * 0.93, 0.92) * rr(rnd, 0.92, 1.1)), K = o.far ? 7 : 9 + (i < 3 ? 1 : 0), ph = rnd() * 6.28;
      const px = cx(t), pz = cz(t), shade = 0.62 + 0.38 * t;   // les étages du bas sont plus sombres
      const cOuter = mul(lerp3(dark, light, 0.45 + 0.5 * rnd()), shade * 1.12), cInner = mul(dark, shade * 0.8), cUnder = mul(dark, shade * 0.46), cApex = mul(lerp3(dark, light, 0.65), shade * 1.05);
      const outer = [], inner = [];
      for (let k = 0; k < K; k++) {
        const a = ph + k / K * 6.2832 + rr(rnd, -0.12, 0.12), ro = Ri * (k % 2 ? rr(rnd, 0.68, 0.85) : rr(rnd, 0.95, 1.2)), ri = Ri * rr(rnd, 0.42, 0.5);
        outer.push([px + Math.cos(a) * ro, y0 - Ri * 0.2 + rr(rnd, -0.15, 0.15) * Ri * 0.2, pz + Math.sin(a) * ro]);   // pointes qui retombent
        inner.push([px + Math.cos(a + 0.2) * ri, y0 + dh * 0.5, pz + Math.sin(a + 0.2) * ri]);
      }
      const apex = [px, y0 + dh, pz], under = [px, y0 - Ri * 0.12, pz];
      for (let k = 0; k < K; k++) {
        const j = (k + 1) % K;
        m.tri(apex, inner[k], inner[j], cApex, cInner, cInner);
        m.quad(inner[k], outer[k], outer[j], inner[j], cInner, cOuter, cOuter, cInner);
        m.tri(under, outer[j], outer[k], cUnder, cUnder, cUnder);
      }
    }
    // cime
    const top = [cx(1), y + h * 1.02, cz(1)], tb = y + h * 0.9, tr = h * 0.03 + 0.15, ca = mul(light, 1.05), cb = mul(dark, 0.9);
    for (let k = 0; k < 5; k++) { const a0 = k / 5 * 6.2832, a1 = (k + 1) / 5 * 6.2832; m.tri(top, [cx(1) + Math.cos(a0) * tr, tb, cz(1) + Math.sin(a0) * tr], [cx(1) + Math.cos(a1) * tr, tb, cz(1) + Math.sin(a1) * tr], ca, cb, cb); }
    // v211 : aucun disque sombre a la base des arbres
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff', o.tint); g.dispose();
  };

  // blob irrégulier (icosphère jittérée, couleurs en dégradé bas → haut)
  function blob(m, cx, cy, cz, rad, sy, rnd, cLow, cHigh, seed, lo) {
    m.smooth = true; const ico = new THREE.IcosahedronGeometry(1, lo ? 0 : 1), P = ico.attributes.position, jit = (px, py, pz) => 0.84 + 0.3 * (Math.abs(Math.sin(px * 12.9898 + py * 78.233 + pz * 37.719 + seed) * 43758.5453) % 1);
    const v = (i) => { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k = jit(px, py, pz); return [[cx + px * rad * k, cy + py * rad * sy * k, cz + pz * rad * k], py]; };
    for (let i = 0; i < P.count; i += 3) {
      const a = v(i), b = v(i + 1), c = v(i + 2), col = (hh) => lerp3(cLow, cHigh, Math.max(0, Math.min(1, 0.5 + hh * 0.6)));
      const fy = (a[1] + b[1] + c[1]) / 3, tweak = 0.92 + 0.16 * ((Math.abs(Math.sin(i * 3.7 + seed)) * 10) % 1);
      m.tri(a[0], b[0], c[0], mul(col(a[1]), tweak), mul(col(b[1]), tweak), mul(col(c[1]), tweak));
    }
    ico.dispose(); m.smooth = false;
  }

  // v208 : un seul type d'arbre, le sapin (les feuillus sont remplaces par des sapins de meme hauteur)
  T.broadleaf = function (b, x, y, z, h, rnd, o) { return T.conifer(b, x, y, z, h * 1.15, rnd, o); };

  T.bush = function (b, x, y, z, s, rnd) {
    return;   // v213 : plus de buissons (les boules vertes)
    if (inWater(b, x, z)) return;
    const m = new Mesh(), pal = BROAD[Math.floor(rnd() * BROAD.length)], n = 2 + Math.floor(rnd() * 2), seed = rnd() * 100; /* v211 : plus d'ombre de contact */
    for (let i = 0; i < n; i++) blob(m, x + rr(rnd, -0.6, 0.6) * s, y + s * 0.38, z + rr(rnd, -0.6, 0.6) * s, s * rr(rnd, 0.6, 0.95), 0.75, rnd, mul(hex(pal[0]), 0.6), mul(hex(pal[1]), 0.82), seed + i * 5.3, i > 0);
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };

  // v207 : ROCHER EN BLOCS : 1 a 3 blocs poses les uns sur les autres (grands plans, sommet plus etroit, arêtes franches), couleurs en bandes, mousse sur le dessus : massif et structure, comme la paroi de la mine
  T.rock = function (b, x, y, z, s, rnd, o) {   // v208 : UN SEUL bloc soude (prisme irregulier, sommet plus etroit), couleurs differentes sur chaque face : aucun empilement, aucune herbe entre les morceaux
    if (inWater(b, x, z)) return;
    o = o || {}; const m = new Mesh(), gray = o.gray || ['#c2c9cd', '#9ca7af', '#9ca7af', '#737f89', '#beb096'][Math.floor(rnd() * 5)], moss = hex('#6a9a48'), base = hex(gray);
    const N = 6 + Math.floor(rnd() * 2), w = s * rr(rnd, 1.25, 1.8), d = s * rr(rnd, 1.0, 1.5), hh = s * rr(rnd, 0.95, 1.5), tp = rr(rnd, 0.22, 0.4), ay = rnd() * 6.28, ca = Math.cos(ay), sa = Math.sin(ay), bot = [], top = [];
    for (let k = 0; k < N; k++) {
      const a = k / N * 6.2832 + rr(rnd, -0.2, 0.2), rw = rr(rnd, 0.82, 1.12), cx = Math.cos(a) * w * 0.5 * rw, cz = Math.sin(a) * d * 0.5 * rw;
      bot.push([x + cx * ca - cz * sa, y - 0.12, z + cx * sa + cz * ca]);
      const ix = cx * (1 - tp) + rr(rnd, -0.08, 0.08) * w, iz = cz * (1 - tp) + rr(rnd, -0.08, 0.08) * d;
      top.push([x + ix * ca - iz * sa, y + hh * rr(rnd, 0.85, 1.12), z + ix * sa + iz * ca]);
    }
    for (let k = 0; k < N; k++) {
      const j = (k + 1) % N, lo = mul(base, 0.58 + 0.12 * rnd()), hi = mul(base, 0.86 + 0.22 * rnd());
      m.quad(bot[k], bot[j], top[j], top[k], lo, lo, hi, hi);
    }
    const c0 = [x, y + hh * 1.08, z], topc = o.noMoss ? mul(base, 1.08) : lerp3(mul(base, 1.0), moss, 0.62);
    for (let k = 0; k < N; k++) { const j = (k + 1) % N, cc = k % 2 && !o.noMoss ? lerp3(topc, moss, 0.4) : topc; m.tri(c0, top[k], top[j], mul(cc, 1.08), cc, cc); }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };

  T.stump = function (b, x, y, z, s, rnd) {
    const m = new Mesh(), bark = hex(BARK[Math.floor(rnd() * BARK.length)]);
    m.tube([x, y - 0.3, z], s * 0.55, [x, y + s * 0.7, z], s * 0.42, mul(bark, 0.7), mul(bark, 0.95), 9);
    const ring = hex('#c8a46a'); for (let k = 0; k < 9; k++) { const a0 = k / 9 * 6.2832, a1 = (k + 1) / 9 * 6.2832; m.tri([x, y + s * 0.7, z], [x + Math.cos(a0) * s * 0.42, y + s * 0.7, z + Math.sin(a0) * s * 0.42], [x + Math.cos(a1) * s * 0.42, y + s * 0.7, z + Math.sin(a1) * s * 0.42], ring, mul(ring, 0.85), mul(ring, 0.85)); }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };

  T.log = function (b, x, y, z, len, rnd) {
    const m = new Mesh(), bark = hex(BARK[Math.floor(rnd() * BARK.length)]), a = rnd() * 3.14, dx = Math.cos(a) * len / 2, dz = Math.sin(a) * len / 2, r = len * 0.07 + 0.2;
    m.tube([x - dx, y + r * 0.7, z - dz], r, [x + dx, y + r * 0.7, z + dz], r * 0.9, mul(bark, 0.85), mul(bark, 0.95), 8);
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };


  // ============================================================================================================
  // v281 : VEGETATION TROPICALE (niveau 2) : arbre de la canopee a contreforts et lianes, palmier a fronde arquee, fougere en rosette, grande feuille de bananier, roseaux.
  // Memes principes que le sapin : un seul lot de facettes a couleurs de sommet par plante (ombre sous la canopee, pointes claires), double face, aucune texture.
  // ============================================================================================================
  const JUNGLE = [['#14452a', '#3f9a44'], ['#1a5230', '#58b24c'], ['#1f5c2f', '#6ec453'], ['#174a2c', '#4aa646'], ['#235f2c', '#8bd05a']];
  const PALM = [['#1f6a30', '#6cc451'], ['#25702e', '#86d45a'], ['#1c5e2c', '#5eb84c']];
  const LEAF = [['#2c7a34', '#8fdc5f'], ['#2a7430', '#79cf55'], ['#337f36', '#a2e468']];
  // fronde : rachis qui s'arque et retombe, folioles de chaque cote en bandes
  function frond(m, bx, by, bz, ang, len, rise, droop, wid, cA, cB, segs) {
    segs = segs || 5; const ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, pz = ca; const P = [];
    for (let i = 0; i <= segs; i++) { const t = i / segs; P.push([bx + ca * len * t, by + rise * Math.sin(Math.min(1, t * 1.25) * 1.57) - droop * t * t, bz + sa * len * t, t]); }
    for (let i = 0; i < segs; i++) {
      const a = P[i], b2 = P[i + 1], wa = wid * Math.sin(Math.PI * (0.12 + 0.88 * a[3])) * (1 - 0.35 * a[3]) + 0.02, wb = wid * Math.sin(Math.PI * (0.12 + 0.88 * b2[3])) * (1 - 0.35 * b2[3]) + 0.02;
      const c0 = lerp3(cA, cB, a[3]), c1 = lerp3(cA, cB, b2[3]);
      for (const sg of [-1, 1]) {
        const lo = 0.1 * wid;
        m.quad([a[0], a[1], a[2]], [a[0] + px * sg * wa, a[1] - lo, a[2] + pz * sg * wa], [b2[0] + px * sg * wb, b2[1] - lo, b2[2] + pz * sg * wb], [b2[0], b2[1], b2[2]], mul(c0, 0.86), mul(c0, 1.0), mul(c1, 1.05), mul(c1, 0.9));
      }
    }
  }
  T.palm = function (b, x, y, z, h, rnd, o) {
    if (inWater(b, x, z)) return; o = o || {}; const m = new Mesh(), pal = PALM[Math.floor(rnd() * PALM.length)], bark = hex('#7a6244'), bark2 = hex('#5c4830');
    const lean = rr(rnd, -0.24, 0.24) * h, lang = rnd() * 6.28, lx = Math.cos(lang) * lean, lz = Math.sin(lang) * lean, N = 6, r0 = h * 0.022 + 0.28, r1 = h * 0.014 + 0.17;
    let prev = [x, y - 0.3, z];
    for (let i = 1; i <= N; i++) { const t = i / N, c = [x + lx * t * t, y + h * t * 0.92, z + lz * t * t]; m.tube(prev, r0 + (r1 - r0) * ((i - 1) / N), c, r0 + (r1 - r0) * t, i % 2 ? bark : bark2, i % 2 ? bark2 : bark, 7); prev = c; }
    const top = prev, K = 9 + Math.floor(rnd() * 3), ph = rnd() * 6.28;
    for (let k = 0; k < K; k++) { const a = ph + k / K * 6.2832 + rr(rnd, -0.12, 0.12), up = k % 3 === 0; frond(m, top[0], top[1] + (up ? 0.3 : 0), top[2], a, h * rr(rnd, up ? 0.32 : 0.4, up ? 0.4 : 0.5), h * (up ? 0.22 : 0.09), h * (up ? 0.04 : 0.2), h * 0.07, mul(hex(pal[0]), 0.9), hex(pal[1]), 5); }
    for (let k = 0; k < 3; k++) { const a = rnd() * 6.28; m.tube([top[0], top[1] - 0.3, top[2]], 0.24, [top[0] + Math.cos(a) * 0.6, top[1] - 0.7, top[2] + Math.sin(a) * 0.6], 0.2, hex('#8a5a2a'), hex('#a8743a'), 5); }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff', o.tint); g.dispose();
  };
  T.fern = function (b, x, y, z, s, rnd) {
    if (inWater(b, x, z)) return; const m = new Mesh(), pal = LEAF[Math.floor(rnd() * LEAF.length)], K = 7 + Math.floor(rnd() * 3), ph = rnd() * 6.28;
    for (let k = 0; k < K; k++) frond(m, x, y + 0.1, z, ph + k / K * 6.2832 + rr(rnd, -0.2, 0.2), s * rr(rnd, 0.9, 1.25), s * rr(rnd, 0.5, 0.9), s * rr(rnd, 0.3, 0.6), s * 0.18, mul(hex(pal[0]), 0.9), hex(pal[1]), 3);
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };
  // grande feuille (bananier / philodendron) : petiole + limbe ovale qui s'arque
  T.bigleaf = function (b, x, y, z, s, rnd) {
    if (inWater(b, x, z)) return; const m = new Mesh(), pal = LEAF[Math.floor(rnd() * LEAF.length)], K = 5 + Math.floor(rnd() * 2), ph = rnd() * 6.28;
    for (let k = 0; k < K; k++) {
      const a = ph + k / K * 6.2832 + rr(rnd, -0.2, 0.2), h = s * rr(rnd, 0.9, 1.5), ca = Math.cos(a), sa = Math.sin(a), out = s * rr(rnd, 0.5, 0.9), top = [x + ca * out * 0.5, y + h, z + sa * out * 0.5];
      m.tube([x, y - 0.1, z], 0.07 * s, top, 0.04 * s, hex('#4a8a3a'), hex('#6aa84a'), 5); frond(m, top[0], top[1], top[2], a, s * rr(rnd, 1.1, 1.6), s * 0.25, s * 0.5, s * 0.52, mul(hex(pal[0]), 0.85), hex(pal[1]), 3);
    }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };
  // roseaux : faisceau de lames fines
  T.reeds = function (b, x, y, z, s, rnd) {
    if (inWater(b, x, z)) return; const m = new Mesh(), n = 7 + Math.floor(rnd() * 5);
    for (let k = 0; k < n; k++) {
      const a = rnd() * 6.28, d = rr(rnd, 0, s * 0.5), h = s * rr(rnd, 0.8, 1.5), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, la = rnd() * 6.28, bend = rr(rnd, 0.15, 0.5) * h;
      const tip = [px + Math.cos(la) * bend, y + h, pz + Math.sin(la) * bend], w = 0.09 * s, c0 = hex('#3a7a34'), c1 = hex('#9fd25e'), nx = -Math.sin(la) * w, nz = Math.cos(la) * w;
      m.tri([px - nx, y, pz - nz], [px + nx, y, pz + nz], tip, c0, c0, c1);
    }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff'); g.dispose();
  };
  // v296 : FEUILLAGE EN CARTES : chaque masse de feuillage est un noyau sombre (volume) recouvert de dizaines de cartes decoupees portant une grappe de vraies feuilles (texture 'leaf'), orientees vers l'exterieur
  // avec une normale douce (eclairage rond, sans facettes) et des teintes variees ; dessous et interieur plus sombres, dessus jamais surexpose
  function LeafMesh() { this.p = []; this.n = []; this.u = []; this.c = []; }
  LeafMesh.prototype.card = function (c, uA, vA, hw, hh, nrm, col, colLow) {
    const k = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]], P = k.map((q) => [c[0] + uA[0] * hw * q[0] + vA[0] * hh * q[1], c[1] + uA[1] * hw * q[0] + vA[1] * hh * q[1], c[2] + uA[2] * hw * q[0] + vA[2] * hh * q[1], q[2], q[3]]);
    for (const i of [0, 1, 2, 0, 2, 3]) { const q = P[i]; this.p.push(q[0], q[1], q[2]); this.n.push(nrm[0], nrm[1], nrm[2]); this.u.push(q[3], q[4]); const cc = q[4] > 0.5 ? col : colLow; this.c.push(cc[0], cc[1], cc[2]); }
  };
  LeafMesh.prototype.geo = function () {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); return g;
  };
  const nrmz = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const crossv = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const LEAFTONE = [[0.62, 0.84, 0.5], [0.7, 0.9, 0.52], [0.55, 0.78, 0.5], [0.8, 0.92, 0.55], [0.6, 0.8, 0.62]];
  // liane : fil courbe (3 segments) avec quelques petites grappes de feuilles ; plus de triangles
  T.vine = function (b, x, y, z, len, rnd, o) {
    o = o || {}; const m = new Mesh(), L = new LeafMesh(), dx = rr(rnd, -1.2, 1.2), dz = rr(rnd, -1.2, 1.2); let prev = [x, y, z];
    for (let i = 1; i <= 3; i++) { const t = i / 3, c = [x + dx * Math.sin(t * 2.1) + rr(rnd, -0.2, 0.2), y - len * t, z + dz * Math.sin(t * 2.1) + rr(rnd, -0.2, 0.2)]; m.tube(prev, 0.09 * (1.1 - 0.4 * t), c, 0.09 * (1.1 - 0.5 * t), hex('#3a5a2a'), hex('#2c4a22'), 4); if (i < 3 && rnd() < 0.85) { const a = rnd() * 6.28; L.card([c[0], c[1] - 0.2, c[2]], [Math.cos(a), 0, Math.sin(a)], [0, 1, 0], 0.7, 0.8, [0, 0.8, 0.6], [0.6, 0.85, 0.45], [0.4, 0.62, 0.34]); } prev = c; }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff', o.tint); g.dispose();
    const g2 = L.geo(); b.batch('leaf').shadow = false; b.addGeometry(g2, new V(0, 0, 0), Q, null, 'leaf'); g2.dispose();
  };
  T.jungle = function (b, x, y, z, h, rnd, o) {
    if (inWater(b, x, z)) return; o = o || {}; const far = !!o.far, m = new Mesh(), LF = new LeafMesh(), pal = JUNGLE[Math.floor(rnd() * JUNGLE.length)], bark = hex(['#6a5238', '#5a4632', '#7a6044', '#625040'][Math.floor(rnd() * 4)]), seed = rnd() * 100, style = rnd() < 0.42 ? 0 : rnd() < 0.62 ? 1 : 2;
    const moss = hex('#4a6a34'), lean = [rr(rnd, -0.05, 0.05) * h, rr(rnd, -0.05, 0.05) * h], r0 = h * 0.03 + 0.55, topY = y + h * (style === 0 ? 0.6 : style === 1 ? 0.55 : 0.5);
    const tb = (t) => [x + lean[0] * t * t + 0.5 * Math.sin(t * 3 + seed) * r0 * 0.5, y + (topY - y) * t, z + lean[1] * t * t + 0.5 * Math.cos(t * 2.4 + seed) * r0 * 0.5];
    { let prev = [x, y - 0.7, z]; for (let i = 1; i <= 4; i++) { const t = i / 4, c = tb(t), rad = r0 * (1.55 - 0.9 * t) * (i === 1 ? 1.15 : 1); m.tube(prev, i === 1 ? r0 * 1.9 : r0 * (1.55 - 0.9 * (i - 1) / 4), c, rad, lerp3(mul(bark, 0.62), moss, i === 1 ? 0.35 : 0.12), mul(bark, 0.7 + 0.12 * t), i < 3 ? 9 : 7); prev = c; } }
    const nb = far ? 4 : 5 + Math.floor(rnd() * 3), ph = rnd() * 6.28;
    for (let k = 0; k < nb; k++) {   // contreforts en voile et racines qui rampent sur le sol
      const a = ph + k / nb * 6.2832 + rr(rnd, -0.2, 0.2), fw = h * rr(rnd, 0.1, 0.19), fh = h * rr(rnd, 0.14, 0.26), ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, bx = x + ca * r0 * 1.1, bz = z + sa * r0 * 1.1, tx = x + ca * (r0 * 1.1 + fw), tz = z + sa * (r0 * 1.1 + fw), wd = r0 * 0.3, cb = mul(bark, 0.6), ct = mul(bark, 0.95);
      m.quad([bx - px * wd, y + fh, bz - pz * wd], [bx + px * wd, y + fh, bz + pz * wd], [tx + px * wd * 0.6, y - 0.3, tz + pz * wd * 0.6], [tx - px * wd * 0.6, y - 0.3, tz - pz * wd * 0.6], ct, ct, cb, cb);
      if (!far) { const L2 = fw * rr(rnd, 1.2, 1.9), a2 = a + rr(rnd, -0.3, 0.3); m.tube([tx, y + 0.25, tz], r0 * 0.24, [x + Math.cos(a2) * (r0 * 1.1 + L2), y - 0.1, z + Math.sin(a2) * (r0 * 1.1 + L2)], r0 * 0.1, mul(bark, 0.7), mul(bark, 0.55), 4); }
    }
    const CR = style === 0 ? [[0, 0.16, 0, 0.27], [0.34, 0.03, 0.04, 0.22], [-0.3, 0.05, 0.14, 0.23], [0.06, 0.04, -0.34, 0.22], [-0.12, 0.05, 0.3, 0.2], [0.24, 0.05, 0.28, 0.19], [-0.27, 0.03, -0.24, 0.2]]
      : style === 1 ? [[0, 0.24, 0, 0.3], [0.22, 0.1, 0.06, 0.24], [-0.2, 0.12, 0.12, 0.25], [0.06, 0.1, -0.24, 0.23], [-0.08, 0.16, 0.22, 0.21], [0.16, 0.3, -0.08, 0.2]]
      : [[0, 0.1, 0, 0.26], [0.3, 0.02, 0.08, 0.21], [-0.28, 0.04, 0.0, 0.22], [0.04, 0.03, 0.3, 0.2], [-0.04, 0.05, -0.3, 0.2], [0.2, 0.14, -0.2, 0.18]];
    const nc = far ? 3 : Math.min(CR.length, 5), top0 = tb(1), tone = LEAFTONE[Math.floor(rnd() * LEAFTONE.length)];
    for (let i = 0; i < nc; i++) {
      const c = CR[i], rad = c[3] * h * rr(rnd, 0.9, 1.12), cx = top0[0] + c[0] * h, cz = top0[2] + c[2] * h, flat = style === 0 ? 0.46 : 0.6, cy = topY + c[1] * h + rad * 0.2;
      m.tube([top0[0], topY - h * 0.04, top0[2]], r0 * 0.36, [cx, cy - rad * 0.3, cz], r0 * 0.16, mul(bark, 0.9), mul(bark, 1.0), 4);   // branche maitresse
      blob(m, cx, cy - rad * 0.08, cz, rad * 0.36, flat + 0.05, rnd, hex('#1f4a26'), hex('#34702f'), seed + i * 7.1, true);   // noyau sombre : le volume sous les feuilles
      const nCard = far ? 6 : 16 + Math.floor(rnd() * 4);
      for (let k = 0; k < nCard; k++) {
        const phi = rnd() * 6.2832, ct = -0.25 + 1.25 * Math.pow(rnd(), 0.75), st = Math.sqrt(Math.max(0, 1 - ct * ct)), dir = [st * Math.cos(phi), ct, st * Math.sin(phi)], rr_ = k % 2 ? 0.86 + 0.2 * rnd() : 0.42 + 0.3 * rnd();
        const pos = [cx + dir[0] * rad * rr_, cy + dir[1] * rad * flat * 1.25 * rr_, cz + dir[2] * rad * rr_];
        const t1 = nrmz(crossv(dir, [0, 1, 0.001])), t2 = crossv(dir, t1), psi = rnd() * 6.2832, cp = Math.cos(psi), sp = Math.sin(psi);
        const uA = [t1[0] * cp + t2[0] * sp, t1[1] * cp + t2[1] * sp, t1[2] * cp + t2[2] * sp], vA = nrmz([-t1[0] * sp + t2[0] * cp, -t1[1] * sp + t2[1] * cp - 0.25, -t1[2] * sp + t2[2] * cp]);
        const sz = rad * rr(rnd, 0.66, 0.92), shadeK = 0.55 + 0.4 * Math.max(0, Math.min(1, ct + 0.45)), j = 0.9 + 0.2 * rnd(), col = [tone[0] * shadeK * j, tone[1] * shadeK * j, tone[2] * shadeK * j];
        LF.card(pos, uA, vA, sz, sz * 0.9, nrmz([dir[0], dir[1] * 0.7 + 0.3, dir[2]]), col, mul(col, 0.68));
      }
    }
    if (!far) {
      for (let k = 0; k < 2; k++) { const a = rnd() * 6.28, bx = top0[0] + Math.cos(a) * r0 * 0.7, bz = top0[2] + Math.sin(a) * r0 * 0.7, by = topY - h * rr(rnd, 0.03, 0.14); frond(m, bx, by, bz, a, h * 0.05, h * 0.03, h * 0.04, h * 0.022, hex('#2a6a30'), hex('#7ac85a'), 3); }   // epiphytes sur les branches
      if (style === 2) for (let k = 0; k < 4; k++) { const a = rnd() * 6.28, rd = h * rr(rnd, 0.14, 0.3), ex = top0[0] + Math.cos(a) * rd, ez = top0[2] + Math.sin(a) * rd, gx = x + Math.cos(a) * rd * 1.1, gz = z + Math.sin(a) * rd * 1.1; m.tube([ex, topY + h * 0.02, ez], 0.22, [(ex + gx) / 2 + rr(rnd, -0.5, 0.5), y + (topY - y) * 0.45, (ez + gz) / 2 + rr(rnd, -0.5, 0.5)], 0.17, mul(bark, 0.75), mul(bark, 0.7), 5); m.tube([(ex + gx) / 2, y + (topY - y) * 0.45, (ez + gz) / 2], 0.17, [gx, y - 0.3, gz], 0.24, mul(bark, 0.7), mul(bark, 0.55), 5); }   // banian : racines aeriennes
    }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff', o.tint); g.dispose();
    const g2 = LF.geo(); b.batch('leaf').shadow = false; b.addGeometry(g2, new V(0, 0, 0), Q, null, 'leaf', o.tint); g2.dispose();
    if (!far) for (let k = 0; k < 2; k++) { const a = rnd() * 6.28, rd = h * rr(rnd, 0.1, 0.28); T.vine(b, top0[0] + Math.cos(a) * rd, topY + h * 0.04, top0[2] + Math.sin(a) * rd, h * rr(rnd, 0.2, 0.4), rnd, o); }
  };

  CC.Trees = T;
})();
