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
  // v297 : ARBRE DE LA JUNGLE EN ETAGES PLEINS, comme les sapins et les palmiers : un tronc qui se divise en grosses branches courbes, chaque branche porte une masse de feuillage faite de 2 a 3 etages
  // (disques epais a bord lobe, dessus legerement bombe, dessous en cone sombre), ombres par facettes avec un degrade du sombre vers le vert franc. Aucune texture, aucune carte : formes pleines et lisibles de loin ;
  // l'interieur n'est jamais visible. Les racines sont courbes et restent epaisses jusqu'au bout ; les lianes sont de simples fils.
  const JUN = [['#1b4a2a', '#3f8a3e'], ['#20532e', '#4c9a44'], ['#1a4527', '#38833a'], ['#245a2c', '#58a048'], ['#1e4d2b', '#44903f']];
  // etage de feuillage : K lobes (pointes et creux en alternance), le bord le plus eloigne du tronc retombe (dx, dz = direction vers l'exterieur)
  function pad(m, cx, cy, cz, R, T, rnd, cTop, cRim, cUnder, K, dx, dz, full) {
    const rim = [], inner = [], ph = rnd() * 6.2832;
    for (let k = 0; k < K; k++) {
      const a = ph + k / K * 6.2832 + rr(rnd, -0.1, 0.1), lobe = k % 2 === 0, ro = R * (lobe ? rr(rnd, 0.97, 1.16) : rr(rnd, 0.66, 0.82)), droop = -0.16 * ro * (Math.cos(a) * dx + Math.sin(a) * dz);
      rim.push([cx + Math.cos(a) * ro, cy + T * (lobe ? -0.2 : 0.0) + rr(rnd, -0.05, 0.05) * T + droop, cz + Math.sin(a) * ro]);
      const ri = R * rr(rnd, 0.44, 0.58); inner.push([cx + Math.cos(a + 0.16) * ri, cy + T * rr(rnd, 0.95, 1.12) + droop * 0.3, cz + Math.sin(a + 0.16) * ri]);
    }
    const apex = [cx, cy + T * 1.3, cz], under = [cx, cy - T * 0.4, cz];
    for (let k = 0; k < K; k++) {
      const j = (k + 1) % K, lobe = k % 2 === 0, ct = mul(cTop, 0.92 + 0.16 * rnd()), cr = mul(cRim, lobe ? 0.94 : 1.06);
      if (full) { m.tri(apex, inner[k], inner[j], mul(ct, 1.04), ct, ct); m.quad(inner[k], rim[k], rim[j], inner[j], ct, cr, cr, ct); } else m.tri(apex, rim[k], rim[j], mul(ct, 1.05), cr, cr);
      { const bu = (c, k) => [c[0] * k, c[1] * k, c[2] * k]; m.tri(under, rim[j], rim[k], bu(cUnder, 2.1), bu(cRim, 1.75), bu(cRim, 1.75)); }   // v298 : le dessous n'est presque pas eclaire : on le remonte (couleur de sommet > 1) pour qu'il reste d'un vert franc, sans gros contraste avec le dessus
    }
  }
  // geometrie d'un arbre lointain (2 etages) pour les collines : instanciee, teintee par instance
  T.padGeometry = function (K) {
    const m = new Mesh(), rnd = (() => { let s = 7; const f = () => (s = (s * 16807) % 2147483647) / 2147483647; f.between = (r) => r[0] + (r[1] - r[0]) * f(); return f; })();
    pad(m, 0, 0, 0, 1, 0.42, rnd, [1, 1, 1], [0.84, 0.84, 0.84], [0.72, 0.72, 0.72], K || 9, 0, 0, true); pad(m, 0.05, 0.28, 0.03, 0.66, 0.38, rnd, [1, 1, 1], [0.86, 0.86, 0.86], [0.74, 0.74, 0.74], K || 9, 0, 0, false);
    return m.geo();
  };
  // liane : simple fil courbe (2 segments)
  T.vine = function (b, x, y, z, len, rnd, o) {
    o = o || {}; const m = new Mesh(), dx = rr(rnd, -1, 1), dz = rr(rnd, -1, 1), p1 = [x + dx * 0.6, y - len * 0.5, z + dz * 0.6], p2 = [x + dx, y - len, z + dz];
    m.tube([x, y, z], 0.08, p1, 0.07, hex('#3a5a2a'), hex('#33522a'), 3); m.tube(p1, 0.07, p2, 0.06, hex('#33522a'), hex('#2c4a22'), 3);
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff', o.tint); g.dispose();
  };
  T.jungle = function (b, x, y, z, h, rnd, o) {
    if (inWater(b, x, z)) return; o = o || {}; const far = !!o.far, m = new Mesh(), bark = hex(['#6a5238', '#5a4632', '#7a6044', '#625040'][Math.floor(rnd() * 4)]), seed = rnd() * 100, style = rnd() < 0.4 ? 0 : rnd() < 0.62 ? 1 : 2;
    const moss = hex('#4a6a34'), lean = [rr(rnd, -0.05, 0.05) * h, rr(rnd, -0.05, 0.05) * h], r0 = h * 0.03 + 0.55, topY = y + h * (style === 0 ? 0.6 : style === 1 ? 0.55 : 0.5);
    const tb = (t) => [x + lean[0] * t * t + 0.5 * Math.sin(t * 3 + seed) * r0 * 0.5, y + (topY - y) * t, z + lean[1] * t * t + 0.5 * Math.cos(t * 2.4 + seed) * r0 * 0.5];
    { let prev = [x, y - 0.7, z]; for (let i = 1; i <= 3; i++) { const t = i / 3, c = tb(t), rad = r0 * (1.55 - 0.9 * t) * (i === 1 ? 1.15 : 1); m.tube(prev, i === 1 ? r0 * 1.9 : r0 * (1.55 - 0.9 * (i - 1) / 3), c, rad, lerp3(mul(bark, 0.62), moss, i === 1 ? 0.35 : 0.12), mul(bark, 0.7 + 0.12 * t), i < 2 ? 8 : 6); prev = c; } }
    // racines : courbes, larges a la base et encore epaisses au bout (enfoncees dans le sol), jamais en pointe
    const nb = far ? 2 : 4, ph = rnd() * 6.28;
    for (let k = 0; k < nb; k++) {
      const a = ph + k / nb * 6.2832 + rr(rnd, -0.2, 0.2), L = h * rr(rnd, 0.13, 0.22), ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, bend = L * rr(rnd, -0.3, 0.3), q = (f, up, side) => [x + ca * (r0 * 0.9 + L * f) + px * bend * side, y + up, z + sa * (r0 * 0.9 + L * f) + pz * bend * side];
      const P0 = q(0, r0 * 1.2, 0), P1 = q(0.4, r0 * 0.5, 0.6), P2 = q(0.75, r0 * 0.1, 1), P3 = q(1, -0.35, 0.8), c0 = mul(bark, 0.7), c1 = mul(bark, 0.55), sg = 4;
      m.tube(P0, r0 * 0.7, P2, r0 * 0.5, c0, c0, sg); m.tube(P2, r0 * 0.5, P3, r0 * 0.4, c0, c1, sg);
    }
    // masses de feuillage portees par de grosses branches
    const top0 = tb(1), R0 = h * (style === 1 ? 0.2 : 0.22), MS = [];
    if (style === 0) { const n = far ? 3 : 4; for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + 0.4, rr_ = h * 0.3; MS.push([Math.cos(a) * rr_, h * (0.1 + 0.03 * Math.sin(i * 2.1)), Math.sin(a) * rr_, R0, 1 + (i % 2)]); } MS.push([0, h * 0.2, 0, R0 * 1.1, 2]); }
    else if (style === 1) { const n = far ? 3 : 4; for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + 1.1, rr_ = h * 0.2; MS.push([Math.cos(a) * rr_, h * (0.11 + 0.05 * (i % 2)), Math.sin(a) * rr_, R0, 1 + (i % 2)]); } MS.push([0, h * 0.3, 0, R0 * 1.05, 2]); }
    else { const n = far ? 3 : 4; for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + 0.2, rr_ = h * 0.36; MS.push([Math.cos(a) * rr_, h * (0.03 + 0.03 * Math.cos(i * 1.7)), Math.sin(a) * rr_, R0 * 0.95, 1 + (i % 2)]); } MS.push([0, h * 0.12, 0, R0 * 1.05, 2]); }
    const pal = JUN[Math.floor(rnd() * JUN.length)], K = far ? 6 : 8, vines = [];
    for (const ms of MS) {
      const ex = top0[0] + ms[0] + lean[0] * 0.3, ey = topY + ms[1], ez = top0[2] + ms[2] + lean[1] * 0.3, Rm = ms[3] * rr(rnd, 0.9, 1.1), od = Math.hypot(ms[0], ms[2]) || 1, dx = ms[0] / od, dz = ms[2] / od;
      const mid = [(top0[0] + ex) / 2, (topY + ey) / 2 - Rm * 0.08, (top0[2] + ez) / 2];   // branche maitresse courbe, epaisse
      m.tube([top0[0], topY - h * 0.05, top0[2]], r0 * 0.5, mid, r0 * 0.36, mul(bark, 0.9), mul(bark, 0.95), 4); m.tube(mid, r0 * 0.36, [ex, ey - Rm * 0.12, ez], r0 * 0.24, mul(bark, 0.95), mul(bark, 1.0), 4);
      const dark = hex(pal[0]), light = lerp3(hex(pal[1]), hex(JUN[Math.floor(rnd() * JUN.length)][1]), 0.25), cTop = lerp3(dark, light, 0.86), cRim = lerp3(dark, light, 0.5), cUnder = lerp3(dark, light, 0.6);
      const tiers = far ? 1 : ms[4];
      for (let t = 0; t < tiers; t++) pad(m, ex + rr(rnd, -0.2, 0.2) * Rm * t, ey + t * Rm * 0.42, ez + rr(rnd, -0.2, 0.2) * Rm * t, Rm * (1 - 0.3 * t), Rm * (0.46 - 0.04 * t), rnd, cTop, cRim, cUnder, K, dx, dz, t === 0);
      if (!far && rnd() < 0.5) vines.push([ex + dx * Rm * 0.8, ey - Rm * 0.1, ez + dz * Rm * 0.8]);
    }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'tree:#ffffff', o.tint); g.dispose();
    for (const v of vines.slice(0, 2)) T.vine(b, v[0], v[1], v[2], h * rr(rnd, 0.18, 0.32), rnd, o);
  };

  CC.Trees = T;
})();
