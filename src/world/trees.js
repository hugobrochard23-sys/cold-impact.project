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

  // constructeur de géométrie : on pousse des triangles (a, b, c) avec une couleur par sommet ; normales plates à la fin
  function Mesh() { this.p = []; this.c = []; }
  Mesh.prototype.tri = function (a, b, c, ca, cb, cc) { this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); this.c.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]); };
  Mesh.prototype.quad = function (a, b, c, d, ca, cb, cc, cd) { this.tri(a, b, c, ca, cb, cc); this.tri(a, c, d, ca, cc, cd); };
  Mesh.prototype.geo = function () {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
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

  const CONIFER = [['#2a5130', '#37653c'], ['#2f5a36', '#3f7344'], ['#264a30', '#34603b'], ['#335f3b', '#46784a'], ['#2c5436', '#3b6e41']];
  const BROAD = [['#3a5a2c', '#58803a'], ['#35542a', '#527a36'], ['#445f2c', '#6a8a3c'], ['#3d5a2e', '#5d8038'], ['#506a2c', '#76923c']];
  const AUTUMN = [['#8a5a22', '#c0873a'], ['#7a4a1e', '#b8742c']];
  const BARK = ['#6b5237', '#5e4630', '#76593b', '#54402c'];

  T.conifer = function (b, x, y, z, h, rnd, o) {
    o = o || {}; const m = new Mesh(), pal = CONIFER[Math.floor(rnd() * CONIFER.length)], dark = hex(pal[0]), light = hex(pal[1]), bark = hex(BARK[Math.floor(rnd() * BARK.length)]);
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
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'col:#ffffff', o.tint); g.dispose();
  };

  // blob irrégulier (icosphère jittérée, couleurs en dégradé bas → haut)
  function blob(m, cx, cy, cz, rad, sy, rnd, cLow, cHigh, seed, lo) {
    const ico = new THREE.IcosahedronGeometry(1, lo ? 0 : 1), P = ico.attributes.position, jit = (px, py, pz) => 0.84 + 0.3 * (Math.abs(Math.sin(px * 12.9898 + py * 78.233 + pz * 37.719 + seed) * 43758.5453) % 1);
    const v = (i) => { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k = jit(px, py, pz); return [[cx + px * rad * k, cy + py * rad * sy * k, cz + pz * rad * k], py]; };
    for (let i = 0; i < P.count; i += 3) {
      const a = v(i), b = v(i + 1), c = v(i + 2), col = (hh) => lerp3(cLow, cHigh, Math.max(0, Math.min(1, 0.5 + hh * 0.6)));
      const fy = (a[1] + b[1] + c[1]) / 3, tweak = 0.92 + 0.16 * ((Math.abs(Math.sin(i * 3.7 + seed)) * 10) % 1);
      m.tri(a[0], b[0], c[0], mul(col(a[1]), tweak), mul(col(b[1]), tweak), mul(col(c[1]), tweak));
    }
    ico.dispose();
  }

  T.broadleaf = function (b, x, y, z, h, rnd, o) {
    o = o || {}; const m = new Mesh(), pal = (o.autumn ? AUTUMN : BROAD)[Math.floor(rnd() * (o.autumn ? AUTUMN : BROAD).length)], cDark = hex(pal[0]), cLight = hex(pal[1]), bark = hex(BARK[Math.floor(rnd() * BARK.length)]);
    const th = h * rr(rnd, 0.38, 0.48), cr = h * rr(rnd, 0.3, 0.38), seed = rnd() * 100, lean = rr(rnd, -0.06, 0.06) * h;
    m.tube([x, y - 0.8, z], h * 0.05 + 0.45, [x, y + th * 0.25, z], h * 0.034 + 0.3, mul(bark, 0.65), mul(bark, 0.8), 8);
    m.tube([x, y + th * 0.25, z], h * 0.034 + 0.3, [x + lean, y + th, z], h * 0.022 + 0.18, mul(bark, 0.8), mul(bark, 0.95), 7);
    const nb = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < nb; i++) { const a = rnd() * 6.28, s = rr(rnd, 0.28, 0.42) * h; m.tube([x + lean * 0.6, y + th * 0.62, z], h * 0.016 + 0.14, [x + lean + Math.cos(a) * s, y + th + s * 0.55, z + Math.sin(a) * s], 0.07, mul(bark, 0.85), mul(bark, 1), 6); }
    const nbl = o.far ? 4 : 5 + Math.floor(rnd() * 3);
    for (let i = 0; i < nbl; i++) {
      const a = i / nbl * 6.2832 + rnd() * 0.8, d = i === 0 ? 0 : cr * rr(rnd, 0.5, 0.85), rad = cr * (i === 0 ? rr(rnd, 0.85, 1.0) : rr(rnd, 0.5, 0.72));
      blob(m, x + lean + Math.cos(a) * d, y + th + cr * (i === 0 ? 0.55 : rr(rnd, 0.15, 0.55)), z + Math.sin(a) * d, rad, 0.82, rnd, mul(cDark, 0.75), mul(cLight, 1.05), seed + i * 9.1, o.far);
    }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'col:#ffffff', o.tint); g.dispose();
  };

  T.bush = function (b, x, y, z, s, rnd) {
    const m = new Mesh(), pal = BROAD[Math.floor(rnd() * BROAD.length)], n = 2 + Math.floor(rnd() * 2), seed = rnd() * 100;
    for (let i = 0; i < n; i++) blob(m, x + rr(rnd, -0.6, 0.6) * s, y + s * 0.38, z + rr(rnd, -0.6, 0.6) * s, s * rr(rnd, 0.6, 0.95), 0.75, rnd, mul(hex(pal[0]), 0.6), mul(hex(pal[1]), 0.82), seed + i * 5.3);
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'col:#ffffff'); g.dispose();
  };

  T.rock = function (b, x, y, z, s, rnd, o) {
    o = o || {}; const m = new Mesh(), ico = new THREE.IcosahedronGeometry(1, 1), P = ico.attributes.position, seed = rnd() * 50, ay = rnd() * 6.28, sx = rr(rnd, 0.9, 1.5), sz = rr(rnd, 0.8, 1.3);
    const gray = o.gray || ['#8a8984', '#7a7974', '#97958e', '#6f6e69'][Math.floor(rnd() * 4)], moss = hex('#5d7a3c'), base = hex(gray);
    const vert = (i) => { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k = 0.78 + 0.4 * (Math.abs(Math.sin(px * 9.1 + py * 41.7 + pz * 23.3 + seed) * 43758.5453) % 1), cx = Math.cos(ay), sn = Math.sin(ay), X = px * sx * k, Z = pz * sz * k; return [x + (X * cx - Z * sn) * s, y + Math.max(py, -0.35) * 0.62 * k * s, z + (X * sn + Z * cx) * s, py]; };
    for (let i = 0; i < P.count; i += 3) {
      const a = vert(i), c = vert(i + 1), d = vert(i + 2), top = (a[3] + c[3] + d[3]) / 3, tw = 0.86 + 0.28 * ((Math.abs(Math.sin(i * 2.9 + seed)) * 10) % 1);
      const col = top > 0.35 && !o.noMoss ? lerp3(mul(base, tw), moss, Math.min(0.85, (top - 0.3) * 1.6)) : mul(base, tw * (0.78 + 0.3 * Math.max(0, top + 0.3)));
      m.tri([a[0], a[1], a[2]], [c[0], c[1], c[2]], [d[0], d[1], d[2]], col, col, col);
    }
    ico.dispose(); const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'col:#ffffff'); g.dispose();
  };

  T.stump = function (b, x, y, z, s, rnd) {
    const m = new Mesh(), bark = hex(BARK[Math.floor(rnd() * BARK.length)]);
    m.tube([x, y - 0.3, z], s * 0.55, [x, y + s * 0.7, z], s * 0.42, mul(bark, 0.7), mul(bark, 0.95), 9);
    const ring = hex('#c8a46a'); for (let k = 0; k < 9; k++) { const a0 = k / 9 * 6.2832, a1 = (k + 1) / 9 * 6.2832; m.tri([x, y + s * 0.7, z], [x + Math.cos(a0) * s * 0.42, y + s * 0.7, z + Math.sin(a0) * s * 0.42], [x + Math.cos(a1) * s * 0.42, y + s * 0.7, z + Math.sin(a1) * s * 0.42], ring, mul(ring, 0.85), mul(ring, 0.85)); }
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'col:#ffffff'); g.dispose();
  };

  T.log = function (b, x, y, z, len, rnd) {
    const m = new Mesh(), bark = hex(BARK[Math.floor(rnd() * BARK.length)]), a = rnd() * 3.14, dx = Math.cos(a) * len / 2, dz = Math.sin(a) * len / 2, r = len * 0.07 + 0.2;
    m.tube([x - dx, y + r * 0.7, z - dz], r, [x + dx, y + r * 0.7, z + dz], r * 0.9, mul(bark, 0.85), mul(bark, 0.95), 8);
    const g = m.geo(); b.addGeometry(g, new V(0, 0, 0), Q, null, 'col:#ffffff'); g.dispose();
  };

  CC.Trees = T;
})();
