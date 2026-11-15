/* v408 : NIVEAU 3 « OPERATION FETE FORAINE » (prototype : ?lv=3). Un parc d'attractions geant, evacue et occupe par l'armee ennemie.
 * Physique et ennemis du niveau 1 (zone campagne), fusee : le missile clown (rocket_w.js). Scenes de ce prototype :
 *   fdepart  (170 m) : le parking, le lanceur, l'arche du parc deja visible au loin
 *   fportes  (430 m) : l'avenue des mats a drapeaux, les guichets, LA GRANDE ARCHE dont les deux portes s'ouvrent devant la fusee (pluie de confettis)
 *   fallee   (900 m) : la grande allee en S : stands des deux cotes, guirlandes, fontaine, ballons perdus, manèges qui tournent au fond
 * Sol : un vrai pavage (dalles de 4 m, joints visibles) dont le dessin change selon l'endroit : damier au centre, bordure rose, dalles claires sur les cotes, rosace autour de la fontaine.
 * Aucune texture nouvelle (couleurs unies), aucun animal, aucune foule ; chaque objet au sol porte une ombre. */
(function () {
  const U = CC.U, Z = CC.Zones, D = Z.defs && Z.defs.campagne, foe = Z.evoFoe, EVO = CC.EVO, T3 = THREE;
  if (!D || !foe || !EVO || !EVO.on) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const MT = {}, lam = (c) => MT[c] || (MT[c] = new T3.MeshLambertMaterial({ color: c })), vcm = (b) => MT['vc' + b] || (MT['vc' + b] = b ? new T3.MeshBasicMaterial({ vertexColors: true }) : new T3.MeshLambertMaterial({ vertexColors: true }));
  const C = { cream: '#d8cdbb', terra: '#b9745a', rose: '#d4928a', sand: '#c8b89e', grey: '#b3aba0', red: '#e23a32', white: '#f6f2ea', yellow: '#ffc72a', blue: '#2f7fe0', green: '#36b06a', pink: '#ff7ab8', purple: '#9a6ae0', orange: '#ff8a2a', gold: '#e8b43a', navy: '#24344f', iron: '#3a4048' };
  const BAL = [C.red, C.yellow, C.blue, C.green, C.pink, C.purple, C.orange, '#ffffff'];
  const STRIPES = [[C.red, C.white], [C.blue, C.white], [C.yellow, C.red], [C.green, C.white], [C.pink, C.white], [C.purple, C.yellow]];

  // ---------- geometrie fusionnee a couleurs de sommet (un manege = 1 ou 2 appels de dessin) ----------
  // piece : { g: geometrie neuve, c: couleur | st: [couleurs] (bandes verticales selon l'angle autour de Y), p, r, s }
  const _m4 = new T3.Matrix4(), _q = new T3.Quaternion(), _e = new T3.Euler(), _v = new T3.Vector3(), _s = new T3.Vector3(), _c = new T3.Color();
  function bake(parts, basic) {
    const P = [], N = [], Cc = [];
    for (const q of parts) {
      const g = q.g.index ? q.g.toNonIndexed() : q.g, pa = g.attributes.position.array, na = g.attributes.normal.array, n = pa.length / 3, cols = new Float32Array(n * 3);
      for (let i = 0; i < n; i += 3) {
        if (q.st) { const cx = (pa[i * 3] + pa[i * 3 + 3] + pa[i * 3 + 6]) / 3, cz = (pa[i * 3 + 2] + pa[i * 3 + 5] + pa[i * 3 + 8]) / 3, a = Math.atan2(cx, cz) + Math.PI, k = Math.floor(a / (2 * Math.PI) * (q.n || 16) + 1e-4) % q.st.length; _c.set(q.st[k]); } else _c.set(q.c);
        for (let j = 0; j < 3; j++) { cols[(i + j) * 3] = _c.r; cols[(i + j) * 3 + 1] = _c.g; cols[(i + j) * 3 + 2] = _c.b; }
      }
      const r = q.r || [0, 0, 0], s = q.s || [1, 1, 1]; _m4.compose(_v.set(q.p[0], q.p[1], q.p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(s[0], s[1], s[2])); g.applyMatrix4(_m4);
      for (let i = 0; i < pa.length; i++) { P.push(pa[i]); N.push(na[i]); Cc.push(cols[i]); }
      if (g !== q.g) g.dispose(); q.g.dispose();
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(Cc, 3)); geo.computeBoundingSphere();
    const m = new T3.Mesh(geo, vcm(basic)); m.castShadow = !basic; m.receiveShadow = !basic; return m;
  }
  const BX = (w, h, d) => new T3.BoxGeometry(w, h, d), CY = (rt, rb, h, n, open) => new T3.CylinderGeometry(rt, rb, h, n || 16, 1, !!open), SP = (r, a, b) => new T3.SphereGeometry(r, a || 12, b || 9), CO = (r, h, n) => new T3.ConeGeometry(r, h, n || 16);
  const TO = (R, t, a, b) => new T3.TorusGeometry(R, t, a || 6, b || 32);

  // ---------- LE PAVAGE : dalles de 4 m posees sur le sol, joints = le sol en dessous ----------
  const PKEY = 'col:#fefefe';
  function pave(S, a, b, x0, x1, tile, colFn) {
    const T = S.T, P = [], N = [], Cc = [], I = [], c = new T3.Color(), gj = 0.13; let n = 0;
    for (let d = a; d < b - 0.01; d += tile) {
      const d2 = Math.min(b, d + tile);
      for (let x = x0; x < x1 - 0.01; x += tile) {
        const hex = colFn(d + tile / 2, x + tile / 2); if (!hex) continue;
        c.set(hex).multiplyScalar(0.95 + 0.09 * hsh(Math.round(d * 0.25), Math.round(x * 0.25)));
        for (const [dd, xx] of [[d + gj, x + gj], [d + gj, x + tile - gj], [d2 - gj, x + gj], [d2 - gj, x + tile - gj]]) { const p = T.at(dd, xx, 0.07); P.push(p[0], p[1], p[2]); N.push(0, 1, 0); Cc.push(c.r, c.g, c.b); }
        I.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); n += 4;
      }
    }
    if (!n) return;
    { const A = new T3.Vector3(P[0], P[1], P[2]), B = new T3.Vector3(P[6], P[7], P[8]), Cq = new T3.Vector3(P[3], P[4], P[5]); if (B.sub(A).cross(Cq.sub(A)).y < 0) for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(Cc, 3)); g.setIndex(I);
    S.b.batch(PKEY).shadow = false; S.b.addGeometry(g, new T3.Vector3(), new T3.Quaternion(), null, PKEY); g.dispose();
  }
  const paveScene = (S, fn, w) => { for (let dc = S.d0; dc < S.d1 - 0.01; dc += 20) S.item(dc + 10, () => pave(S, dc, Math.min(S.d1, dc + 20), -(w || 150), w || 150, 4, fn)); };
  const JOINT = new T3.Color('#857a6b'), ASPH = new T3.Color('#4e5157');
  const groundTo = (col, W) => (d, lx, c, sc) => { const k = ss(sc.d0 - 6, sc.d0 + 6, d) * (1 - ss(sc.d1 - 6, sc.d1 + 6, d)) * (1 - ss(W, W + 14, Math.abs(lx))); if (k > 0) c.lerp(col, k); };
  const groundJ = (W) => (d, lx, c) => { const k = 1 - ss(W, W + 14, Math.abs(lx)); if (k > 0) c.lerp(JOINT, k); };

  // ---------- petits elements statiques ----------
  const lampPost = (S, dc, lx) => { S.cyl(dc, lx, 0, 0.55, 0.6, 'col:#2c4a3a', undefined, 8, 0.55, false); S.cyl(dc, lx, 0.6, 0.18, 7.4, 'col:#2c4a3a', undefined, 8, 0.14, false); S.bx(dc, lx, 7.6, 2.6, 0.18, 0.18, 'col:#2c4a3a', undefined, false); for (const o of [-1.25, 0, 1.25]) { S.ball(dc, lx + o, o ? 7.25 : 8.3, 0.42, 'emis:#fff1c8', undefined, false); } S.glow(dc, lx, 8, '#ffe8b0', 9); };
  function garland(S, dc, xa, xb, y, r) {   // guirlande de fanions et d'ampoules en travers de l'allee (sans collision)
    const n = Math.max(6, Math.round((xb - xa) / 1.6)), sag = (xb - xa) * 0.06;
    for (let k = 0; k <= n; k++) { const u = k / n, x = xa + (xb - xa) * u, yy = y - sag * 4 * u * (1 - u);
      if (k < n) S.bx(dc, x + (xb - xa) / n / 2, yy, (xb - xa) / n + 0.05, 0.05, 0.05, 'col:#333333', undefined, false, { shadow: false });
      if (k % 2) S.bxr(dc, x, yy - 0.55, 0.78, 0.78, 0.04, 'col:' + BAL[(k >> 1) % 7], undefined, 45, 0, false); else S.bx(dc, x, yy - 0.15, 0.26, 0.26, 0.26, 'emis:#fff0c0', undefined, false, { shadow: false }); }
  }
  const barrier = (S, dc, lx, r) => { for (let k = 0; k < 3; k++) S.bx(dc + (k - 1) * 3.7, lx, 0.6, 1.1, 1.2, 3.5, 'col:' + (k % 2 ? C.white : C.red), undefined, true); };
  const crates = (S, dc, lx, r) => { for (let k = 0; k < 3; k++) S.bx(dc + r.between([-2, 2]), lx + r.between([-2, 2]), 0.7 + (k === 2 ? 1.4 : 0), 1.4, 1.4, 1.4, 'col:#6b6a44', undefined, true); };
  const balloonBunch = (S, dc, lx, y, r) => { for (let k = 0; k < 5; k++) { const a = k * 1.256, bx = lx + Math.cos(a) * 0.7, bd = dc + Math.sin(a) * 0.7, by = y + 2.4 + (k % 2) * 0.6; S.ball(bd, bx, by, 0.8, 'col:' + pk(r, BAL), undefined, false, 1.18); } S.bx(dc, lx, y + 1.1, 0.04, 2.2, 0.04, 'col:#dddddd', undefined, false, { shadow: false }); };

  // la lisiere du parc : pelouses et grands arbres au-dela du pavage (on ne voit jamais le bord du monde)
  function parkTrees(S) { const TR = CC.Trees; if (!TR) return; for (const s of [-1, 1]) S.rows(S.d0, S.d1, 13, 0.6, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + s * r.between([168, 240]), p = S.at(dc, lx, 0); TR.broadleaf(S.b, p[0], p[1], p[2], r.between([12, 22]), r, {}); if (r() < 0.5) { const q = S.at(dc + 6, lx + s * r.between([30, 70]), 0); TR.conifer(S.b, q[0], q[1], q[2], r.between([18, 30]), r, {}); } })); }
  // ---------- LES STANDS (tir, barbe a papa, chamboule-tout, lots, glaces, churros) ----------
  const WALLC = ['#f3ead8', '#ffe9b8', '#d9ecf7', '#f7dbe6', '#e3f0d9'];
  // repere du stand : z le long de l'allee, x vers l'allee (0 = centre du stand), tout a l'echelle K
  function stand(S, dc, lx, r, type) {
    const o = lx > 0 ? 1 : -1, f = -o, st = pk(r, STRIPES), wc = pk(r, WALLC), K = 1.3, L = 9.2;
    const B = (z, x, y, w, h, dd, m, col, o2) => S.bx(dc + z * K, lx + f * x * K, y * K, w * K, h * K, dd * K, m, undefined, col, o2);
    const BR = (z, x, y, w, h, dd, m, roll) => S.bxr(dc + z * K, lx + f * x * K, y * K, w * K, h * K, dd * K, m, undefined, roll, 0, false);
    const BL = (z, x, y, rad, m) => S.ball(dc + z * K, lx + f * x * K, y * K, rad * K, m, undefined, false);
    const CYL = (z, x, y, rad, h, m, rt) => S.cyl(dc + z * K, lx + f * x * K, y * K, rad * K, h * K, m, undefined, 8, rt === undefined ? rad * K : rt * K, false);
    B(0, 0, 0.2, 6.6, 0.4, L + 0.4, 'col:#cfc4b2', true);
    B(0, -2.95, 2.4, 0.35, 4.4, L, 'col:' + wc, true);
    for (const e of [-1, 1]) B(e * (L / 2 - 0.15), 0, 2.4, 6.2, 4.4, 0.3, 'col:' + wc, true);
    B(0, 2.6, 0.95, 0.9, 1.5, L - 0.6, 'col:' + st[0], true); B(0, 2.6, 1.75, 1.15, 0.12, L - 0.4, 'col:#f8f4ec', false);
    B(0, 0, 4.7, 6.6, 0.3, L + 0.5, 'col:' + st[0], true);
    // auvent raye incline vers l'allee + festons
    for (let k = 0; k < 8; k++) { const z = -L / 2 + (k + 0.5) * L / 8; BR(z, 4.1, 4.15, 2.6, 0.1, L / 8 + 0.02, 'col:' + st[k % 2], -f * 22); B(z, 5.3, 3.35, 0.08, 0.5, L / 8 * 0.8, 'col:' + st[(k + 1) % 2], false, { shadow: false }); }
    // enseigne avec ampoules
    B(0, 1.2, 6.1, 0.35, 2.1, L * 0.78, 'col:' + st[1], false); B(0, 1.4, 6.1, 0.1, 1.5, L * 0.66, 'col:' + pk(r, [C.navy, C.red, C.blue, C.purple]), false, { shadow: false });
    for (let k = 0; k < 9; k++) for (const y of [5.15, 7.05]) B(-L * 0.36 + k * L * 0.09, 1.42, y, 0.16, 0.2, 0.2, 'emis:#fff0b8', false, { shadow: false });
    // la marchandise (fond du stand : x = -2.6)
    if (type === 'tir') { for (let k = 0; k < 5; k++) { const z = -3.2 + k * 1.6; B(z, -2.6, 2.8, 0.1, 1.1, 1.1, 'col:' + C.red, false); B(z, -2.54, 2.8, 0.1, 0.72, 0.72, 'col:' + C.white, false); B(z, -2.48, 2.8, 0.1, 0.34, 0.34, 'col:' + C.red, false); } for (let k = 0; k < 3; k++) B(-2 + k * 2, 2.5, 1.9, 0.18, 0.12, 1.3, 'col:#3a2a1e', false); }
    else if (type === 'barbe') { for (let k = 0; k < 6; k++) BL(-3 + k * 1.2, 2.5, 2.35, 0.36, 'col:#ffb3d9'); BL(0, 0, 7.8, 1.3, 'col:#ffb3d9'); B(0, 0, 5.9, 0.15, 1.2, 0.15, 'col:#f6f2ea', false); }
    else if (type === 'chamboule') { for (const z0 of [-2.4, 2.4]) for (let j = 0; j < 3; j++) for (let k = 0; k < 3 - j; k++) CYL(z0 + (k - (3 - j - 1) / 2) * 0.56, -2.0, 1.5 + j * 0.56, 0.24, 0.55, 'col:' + pk(r, [C.red, C.yellow, C.blue, C.green])); B(0, -2.0, 1.45, 1.1, 0.1, L - 1.2, 'col:#8a6a48', false); }
    else if (type === 'glace') { CYL(0, 0, 6.4, 0.15, 2.4, 'col:#d9a55b', 1.0); BL(0, 0, 9.2, 1.05, 'col:' + pk(r, ['#ffd0e4', '#fff3c8', '#c8f0d8'])); BL(0, 0, 10.1, 0.3, 'col:' + C.red); for (let k = 0; k < 4; k++) B(-2.4 + k * 1.6, -2.3, 2.4, 0.5, 0.9, 1.2, 'col:' + pk(r, BAL), false); }
    else { for (let j = 0; j < 3; j++) { B(0, -2.25, 1.4 + j * 1.0, 0.7, 0.08, L - 1.4, 'col:#c9b08a', false); for (let k = 0; k < 6; k++) { const z = -3.2 + k * 1.28; if (k % 2) BL(z, -2.15, 1.85 + j * 1.0, 0.36, 'col:' + pk(r, BAL)); else B(z, -2.15, 1.8 + j * 1.0, 0.6, 0.7, 0.6, 'col:' + pk(r, BAL), false); } } }
    if (r() < 0.5) balloonBunch(S, dc + (r() < 0.5 ? -1 : 1) * 3.6 * K, lx + f * 2.9 * K, 4.9 * K, r);
  }

  // ---------- LES BALLONS PERDUS : ils montent lentement, ballottes par le vent (instancies : 2 appels de dessin par paquet) ----------
  function balloons(S, dc, n, r, spread) {
    if (!S.inClip(dc)) return;
    const geo = SP(1, 10, 8); geo.scale(1, 1.18, 1);
    const im = new T3.InstancedMesh(geo, MT.ball || (MT.ball = new T3.MeshLambertMaterial({ color: '#ffffff' })), n), st = new T3.InstancedMesh(BX(0.035, 2.4, 0.035), lam('#e6e6e6'), n);
    im.frustumCulled = st.frustumCulled = false; im.castShadow = true;
    const B = [];
    for (let i = 0; i < n; i++) { const d = dc + r.between([-60, 60]), x = (r() < 0.5 ? -1 : 1) * r.between([4, spread || 150]), p = S.at(d, x, 0); B.push({ x: p[0], y: p[1], z: p[2], v: r.between([1.5, 3.4]), ph: r() * 170, sw: r() * 6.28, s: r.between([1.1, 1.6]), wx: r.between([-0.2, 0.2]), wz: r.between([-0.2, 0.2]) }); im.setColorAt(i, _c.set(pk(r, BAL))); }
    const grp = new T3.Group(); grp.add(im); grp.add(st); S.b.root.add(grp);
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), pv = new T3.Vector3(), sv = new T3.Vector3(), H = 170;
    EVO.addDyn(grp, (t) => {
      for (let i = 0; i < n; i++) {
        const b = B[i], u = (t * b.v + b.ph) % H, k = Math.min(1, u / 3) * (1 - ss(H - 40, H, u)), x = b.x + Math.sin(t * 0.6 + b.sw) * 1.4 + u * b.wx, z = b.z + Math.cos(t * 0.5 + b.sw) * 1.4 + u * b.wz, y = b.y + 2 + u;
        q.setFromEuler(e.set(Math.sin(t * 1.1 + b.sw) * 0.14, 0, Math.cos(t * 0.9 + b.sw) * 0.14));
        m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(0.001, b.s * k))); im.setMatrixAt(i, m4);
        m4.compose(pv.set(x, y - 2.35 * b.s, z), q, sv.set(Math.max(0.001, k), Math.max(0.001, k * b.s), Math.max(0.001, k))); st.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true; st.instanceMatrix.needsUpdate = true;
    }, [], { near: 99999 });
  }

  // ---------- LES MANEGES (decor anime, loin de la trajectoire ; colonne / socle avec collision) ----------
  const solid = (S, dc, lx, w, h, dd) => S.bx(dc, lx, h / 2, w, h, dd, 'col:#000000', undefined, true, { render: false });
  function carousel(S, dc, lx, r) {
    if (!S.inClip(dc)) return; const st = pk(r, STRIPES), R = 15;
    S.cyl(dc, lx, 0, R + 1, 1.0, 'col:#e8dcc2', undefined, 24, R + 1, true); S.cyl(dc, lx, 1.0, R, 0.4, 'col:' + C.navy, undefined, 24, R, false); S.cyl(dc, lx, 1.4, 1.8, 11, 'col:' + C.gold, undefined, 12, 1.8, true);
    const parts = [{ g: CO(R + 1.5, 7, 24), st, n: 24, p: [0, 15.5, 0] }, { g: CY(R + 1.5, R + 1.5, 1.6, 24, true), st: [st[1], st[0]], n: 24, p: [0, 11.3, 0] }, { g: CY(R * 0.62, R * 0.62, 7, 20, true), st: [C.gold, '#f7e7b8'], n: 20, p: [0, 7, 0] }, { g: SP(1, 10, 8), c: C.gold, p: [0, 19.4, 0] }, { g: BX(0.1, 2.2, 1.6), c: C.red, p: [0, 21.2, 0.8] }, { g: CY(0.08, 0.08, 3, 6), c: '#444444', p: [0, 20.6, 0] }];
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, x = Math.sin(a) * (R - 2.5), z = Math.cos(a) * (R - 2.5), sc = pk(r, BAL); parts.push({ g: CY(0.12, 0.12, 9.6, 6), c: C.gold, p: [x, 6.4, z] }); const y = 3.4 + (k % 2) * 1.6; parts.push({ g: BX(1.5, 1.1, 2.4), c: sc, p: [x, y, z], r: [0, a, 0] }, { g: BX(1.5, 0.9, 0.3), c: C.white, p: [x - Math.sin(a) * 0.0, y + 0.9, z], r: [0, a, 0] }, { g: SP(0.45, 8, 6), c: C.gold, p: [x, y + 1.45, z] }); }
    const grp = new T3.Group(), body = bake(parts); grp.add(body);
    const bl = []; for (let k = 0; k < 36; k++) { const a = k / 36 * 6.283; bl.push({ g: SP(0.28, 6, 5), c: k % 2 ? '#fff3c0' : '#ffd36a', p: [Math.sin(a) * (R + 1.55), 10.5, Math.cos(a) * (R + 1.55)] }); } grp.add(bake(bl, true));
    EVO.placeGroup(S, grp, dc, lx, 0, 0); const a0 = r() * 6;
    EVO.addDyn(grp, (t) => { grp.rotation.y = a0 + t * 0.42; }, [], { near: 900 });
  }
  function swingRide(S, dc, lx, r) {
    if (!S.inClip(dc)) return; const st = pk(r, STRIPES);
    S.cyl(dc, lx, 0, 4, 1, 'col:#d8cfbf', undefined, 16, 4, true); S.cyl(dc, lx, 1, 1.4, 30, 'col:' + C.white, undefined, 12, 1.1, true);
    for (let k = 0; k < 5; k++) S.cyl(dc, lx, 4 + k * 5.5, 1.5, 1.2, 'col:' + st[0], undefined, 12, 1.5, false);
    const parts = [{ g: CO(8.5, 5, 20), st, n: 20, p: [0, 33, 0] }, { g: CY(8.5, 8.5, 1.4, 20, true), st: [st[1], st[0]], n: 20, p: [0, 30.2, 0] }, { g: SP(0.8, 8, 6), c: C.gold, p: [0, 35.8, 0] }];
    const Lc = 11, ang = 0.62;
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, ca = Math.sin(a), sa = Math.cos(a), r0 = 8, rx = r0 + Lc * Math.sin(ang), yy = 29.5 - Lc * Math.cos(ang);
      { const cg = CY(0.06, 0.06, Lc, 4); cg.rotateX(-ang); parts.push({ g: cg, c: '#333333', p: [ca * (r0 + rx) / 2, (29.5 + yy) / 2, sa * (r0 + rx) / 2], r: [0, a, 0] }); }
      parts.push({ g: BX(1.1, 0.25, 0.9), c: pk(r, BAL), p: [ca * rx, yy, sa * rx], r: [0, a, 0] }); parts.push({ g: BX(1.1, 1.0, 0.15), c: '#ffffff', p: [ca * (rx - 0.4), yy + 0.5, sa * (rx - 0.4)], r: [0, a, 0] }); }
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 0, 0); const a0 = r() * 6;
    EVO.addDyn(grp, (t) => { grp.rotation.y = a0 + t * 1.05; }, [], { near: 900 });
  }
  function dropTower(S, dc, lx, r) {
    if (!S.inClip(dc)) return; const H = 92;
    S.bx(dc, lx, H / 2, 4.4, H, 4.4, 'col:#d6dde6', undefined, true); for (let y = 6; y < H; y += 8) S.bx(dc, lx, y, 4.8, 0.5, 4.8, 'col:' + C.red, undefined, false);
    S.bx(dc, lx, H + 2, 7, 4, 7, 'col:' + C.navy, undefined, false); S.cyl(dc, lx, H + 4, 3.6, 5, 'col:' + C.red, undefined, 12, 0.2, false); S.ball(dc, lx, H + 9.6, 0.7, 'emis:#ff4a3a', undefined, false); S.glow(dc, lx, H + 9.6, '#ff4a3a', 16);
    const parts = [{ g: BX(9, 1.6, 9), c: C.yellow, p: [0, 0, 0] }, { g: BX(5.6, 1.8, 5.6), c: '#2a2d33', p: [0, 0.2, 0] }];
    for (let k = 0; k < 12; k++) { const sd = k % 4, i = Math.floor(k / 4) - 1, x = sd === 0 ? 3.9 : sd === 2 ? -3.9 : i * 2.4, z = sd === 1 ? 3.9 : sd === 3 ? -3.9 : i * 2.4; parts.push({ g: BX(1.2, 1.6, 1.2), c: pk(r, BAL), p: [x, 1.2, z] }); }
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 6, 0); const y0 = grp.position.y, ph = r() * 12;
    EVO.addDyn(grp, (t) => { const u = (t + ph) % 13; const h = u < 6 ? ss(0, 6, u) : u < 8.2 ? 1 : u < 9 ? 1 - Math.pow((u - 8.2) / 0.8, 2) : 0; grp.position.y = y0 + h * (H - 14); }, [], { near: 900 });
  }
  function pirateShip(S, dc, lx, r) {
    if (!S.inClip(dc)) return; const P = 24;
    for (const s of [-1, 1]) { S.bx(dc, lx + s * 4.6, P / 2, 1.3, P + 1, 1.3, 'col:' + C.gold, undefined, true); for (const e of [-1, 1]) S.bx(dc + e * 4, lx + s * 4.6, P * 0.3, 0.8, P * 0.6, 0.8, 'col:' + C.gold, undefined, true); }
    S.bx(dc, lx, P + 0.6, 10.6, 1.4, 1.4, 'col:#8a6a48', undefined, true); S.bx(dc, lx, 0.4, 13, 0.8, 34, 'col:#d8cfbf', undefined, true);
    const parts = [{ g: BX(5.8, 3.4, 22), c: '#8a4a2a', p: [0, -15.5, 0] }, { g: BX(6, 0.7, 22.4), c: C.red, p: [0, -14.4, 0] }, { g: BX(6, 0.4, 22.4), c: C.yellow, p: [0, -13.9, 0] }, { g: BX(4.8, 3.2, 3), c: '#7a3e22', p: [0, -13, 10.8] }, { g: BX(4.8, 3.2, 3), c: '#7a3e22', p: [0, -13, -10.8] }, { g: CY(0.25, 0.25, 12, 6), c: '#5a3a24', p: [0, -8, 0] }, { g: BX(0.15, 7, 8), c: '#f6f2ea', p: [0, -7.5, 0] }, { g: BX(0.6, 14.4, 0.6), c: '#555555', p: [2.6, -7, 0] }, { g: BX(0.6, 14.4, 0.6), c: '#555555', p: [-2.6, -7, 0] }];
    for (let k = 0; k < 6; k++) parts.push({ g: BX(6.05, 0.5, 1.2), c: k % 2 ? '#ffffff' : C.blue, p: [0, -16.7, -8 + k * 3.2] });
    const grp = new T3.Group(), body = bake(parts); grp.add(body); EVO.placeGroup(S, grp, dc, lx, P, 0); const ph = r() * 6;
    EVO.addDyn(grp, (t) => { body.rotation.x = Math.sin(t * 0.95 + ph) * 0.95; }, [], { near: 900 });
  }
  function bigTop(S, dc, lx, r) {   // le grand chapiteau raye
    if (!S.inClip(dc)) return; const R = 30, st = pk(r, [[C.red, C.white], [C.blue, C.yellow], [C.red, C.yellow]]);
    const parts = [{ g: CY(R, R, 12, 28, true), st, n: 28, p: [0, 6, 0] }, { g: CY(R * 0.98, R * 0.98, 0.5, 28), c: '#d8cfbf', p: [0, 0.25, 0] }, { g: CO(R + 2, 20, 28), st, n: 28, p: [0, 22, 0] }, { g: CY(R + 2.1, R + 2.1, 1.4, 28, true), st: [C.yellow, C.navy], n: 28, p: [0, 11.5, 0] }, { g: CO(6, 7, 12), st: [st[1], st[0]], n: 12, p: [0, 33, 0] }, { g: CY(0.35, 0.35, 10, 6), c: '#555555', p: [0, 38, 0] }, { g: BX(0.15, 2.4, 3.4), c: C.red, p: [0, 42, 1.7] }];
    for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.785; parts.push({ g: CY(0.3, 0.3, 30, 6), c: '#555555', p: [Math.sin(a) * 12, 15, Math.cos(a) * 12] }, { g: BX(0.12, 1.6, 2.4), c: BAL[k], p: [Math.sin(a) * 12, 30.5, Math.cos(a) * 12 + 1.2] }); }
    parts.push({ g: BX(10, 9, 3), c: C.navy, p: [0, 4.5, -R] }, { g: BX(11, 1, 3.4), c: C.gold, p: [0, 9.4, -R] });
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 0, lx > 0 ? -Math.PI / 2 : Math.PI / 2); solid(S, dc, lx, 2 * R, 34, 2 * R);
  }

  // ---------- LA GRANDE ARCHE : deux tours, l'enseigne, deux portes qui s'ouvrent quand la fusee arrive ----------
  let signTex = null;
  const sign = () => signTex || (signTex = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = C.navy; x.fillRect(0, 0, 1024, 256); x.fillStyle = '#ffd23a'; for (let k = 0; k < 32; k++) { x.beginPath(); x.arc(16 + k * 32, 16, 8, 0, 6.3); x.fill(); x.beginPath(); x.arc(16 + k * 32, 240, 8, 0, 6.3); x.fill(); } x.font = '900 150px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 16; x.strokeStyle = '#e23a32'; x.strokeText('COLD PARK', 512, 134); x.fillStyle = '#fff6dc'; x.fillText('COLD PARK', 512, 134); const t = new T3.CanvasTexture(cv); if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; return t; })());
  function grandGate(S, dG) {
    const HW = 40, TH = 56;
    S.reserve(dG, 0, 2 * HW + 40, 30);
    S.item(dG, (r) => {
      const Lc = S.lane(dG).lx;
      for (const s of [-1, 1]) { const x = Lc + s * (HW + 7);
        S.cyl(dG, x, 0, 8, 3, 'col:#d8cfbf', undefined, 16, 8, true); S.cyl(dG, x, 3, 7, TH - 3, 'col:' + C.white, undefined, 16, 6.4, true);
        for (let k = 0; k < 6; k++) S.cyl(dG, x, 8 + k * 8, 7.2 - k * 0.1, 1.6, 'col:' + (k % 2 ? C.blue : C.red), undefined, 16, 7.1 - k * 0.1, false);
        S.cyl(dG, x, TH, 7.6, 2, 'col:' + C.gold, undefined, 16, 7.6, false); S.ball(dG, x, TH + 2, 6.4, 'col:' + C.red, undefined, false, 0.9); S.cyl(dG, x, TH + 7, 1.4, 12, 'col:' + C.gold, undefined, 10, 0.05, false);
        S.bx(dG, x, TH + 19.6, 0.15, 3, 5, 'col:' + C.yellow, undefined, false); S.cyl(dG, x, TH + 15, 0.15, 6, 'col:#555555', undefined, 6, 0.15, false);
        for (let k = 0; k < 10; k++) { const a = k * 0.628; S.ball(dG + Math.cos(a) * 7.4, x + Math.sin(a) * 7.4, TH + 1, 0.35, 'emis:#fff0b8', undefined, false); }
        // la cloture du parc qui part des tours
        for (let w = HW + 15; w < 380; w += 20) { const xx = Lc + s * (w + 10); S.bx(dG, xx, 2, 20.2, 4, 1.4, 'col:#b05a3a', undefined, true); S.bx(dG, xx, 4.2, 20.6, 0.4, 1.8, 'col:' + C.cream, undefined, false); S.bx(dG, Lc + s * w, 4, 1.4, 8, 1.6, 'col:#b05a3a', undefined, true); S.ball(dG, Lc + s * w, 8.6, 0.6, 'emis:#fff0c8', undefined, false); }
      }
      // le linteau et l'enseigne
      S.bx(dG, Lc, TH - 4, 2 * HW + 8, 6, 5, 'col:' + C.red, undefined, true); S.bx(dG, Lc, TH - 0.6, 2 * HW + 10, 0.8, 5.6, 'col:' + C.gold, undefined, false); S.bx(dG, Lc, TH - 7.4, 2 * HW + 8, 0.8, 5.4, 'col:' + C.gold, undefined, false);
      for (let k = 0; k < 30; k++) S.bx(dG - 2.65, Lc - HW + k * (2 * HW / 29), TH - 4, 0.36, 0.36, 0.1, 'emis:' + (k % 2 ? '#fff0b8' : '#ffd36a'), undefined, false, { shadow: false });
      { const g = new T3.Group(), pl = new T3.Mesh(new T3.PlaneGeometry(44, 11), new T3.MeshBasicMaterial({ map: sign(), side: T3.DoubleSide })); pl.position.set(0, TH + 7.5, 0.66); pl.rotation.y = Math.PI; g.add(pl); const pl2 = pl.clone(); pl2.position.z = -0.66; pl2.rotation.y = 0; g.add(pl2); const fr = new T3.Mesh(BX(46, 13, 1.2), lam(C.gold)); fr.position.set(0, TH + 7.5, 0); fr.castShadow = true; g.add(fr); EVO.placeGroup(S, g, dG, Lc, 0, 0); S.bx(dG, Lc, TH + 7.5, 46, 13, 1.2, 'col:#000000', undefined, true, { render: false }); }
      // les deux portes : grilles dorees et rouges sur gonds ; elles s'ouvrent vers l'interieur du parc
      const leaves = [];
      for (const s of [-1, 1]) {
        const piv = new T3.Group(), parts = [], W = HW, H = TH - 8;
        parts.push({ g: BX(W, 1.2, 1.0), c: C.gold, p: [-s * W / 2, 0.8, 0] }, { g: BX(W, 1.2, 1.0), c: C.gold, p: [-s * W / 2, H - 0.6, 0] }, { g: BX(W, 1.0, 0.8), c: C.gold, p: [-s * W / 2, H * 0.55, 0] }, { g: BX(1.4, H, 1.2), c: C.red, p: [-s * 0.7, H / 2, 0] }, { g: BX(1.4, H, 1.2), c: C.red, p: [-s * (W - 0.7), H / 2, 0] });
        for (let k = 1; k < 16; k++) parts.push({ g: BX(0.42, H - 1.8, 0.42), c: k % 4 === 0 ? C.red : '#2b2f36', p: [-s * k * W / 16, H / 2, 0] }, { g: CO(0.5, 1.4, 6), c: C.gold, p: [-s * k * W / 16, H + 0.2, 0] });
        parts.push({ g: TO(5, 0.5, 6, 24), c: C.gold, p: [-s * W * 0.55, H * 0.55, 0] }, { g: CY(3, 3, 0.6, 16), c: C.red, p: [-s * W * 0.55, H * 0.55, 0], r: [Math.PI / 2, 0, 0] });
        const leaf = bake(parts); piv.add(leaf);
        for (let k = 0; k < 4; k++) EVO.colBox(leaf, W / 4, H, 1.4, -s * (k + 0.5) * W / 4, H / 2, 0);
        EVO.placeGroup(S, piv, dG, Lc + s * HW, 0, 0); leaves.push({ piv, s, y0: piv.rotation.y, leaf });
      }
      const st = { open: 0, burst: false };
      const conf = confetti(S, dG, Lc, TH);
      EVO.addDyn(leaves[0].piv, (t, dt, game) => {
        const run = game.endlessRun; if (!run) return;
        if (run.dist < dG - 360) { st.open = 0; st.burst = false; }   // nouvelle partie : portes refermees
        else if (game.state === 'FLIGHT' && run.dist > dG - 330) { if (!st.burst) { st.burst = true; conf.go(); try { game.audio.play('levelUp'); } catch (e) { /* son */ } } st.open = Math.min(1, st.open + dt / 2.6); }
        const k = ss(0, 1, st.open); for (const L of leaves) L.piv.rotation.y = L.y0 - L.s * k * 1.75;
      }, leaves.map((L) => L.leaf.children).flat(), { near: 9999, span: 400 });
    });
  }
  // pluie de confettis tiree du haut de l'arche a l'ouverture des portes
  function confetti(S, dG, Lc, TH) {
    const n = 420, im = new T3.InstancedMesh(new T3.PlaneGeometry(0.7, 0.42), MT.conf || (MT.conf = new T3.MeshLambertMaterial({ color: '#ffffff', side: T3.DoubleSide })), n); im.frustumCulled = false; im.visible = false;
    const P = [], o = S.at(dG, Lc, TH);
    for (let i = 0; i < n; i++) { im.setColorAt(i, _c.set(BAL[i % 7])); P.push({ p: new T3.Vector3(), v: new T3.Vector3(), a: 0, w: 0 }); }
    S.b.root.add(im); let t0 = -1;
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), sv = new T3.Vector3(1, 1, 1);
    EVO.addDyn(im, (t, dt) => {
      if (t0 < 0 || !im.visible) return; const age = t - t0; if (age > 9) { im.visible = false; return; }
      for (let i = 0; i < n; i++) { const c = P[i]; c.v.y -= 6 * dt; c.v.multiplyScalar(Math.exp(-1.6 * dt)); if (c.v.y < -3.2) c.v.y = -3.2; c.p.addScaledVector(c.v, dt); c.a += c.w * dt; q.setFromEuler(e.set(c.a, c.a * 0.7, c.a * 0.3)); m4.compose(c.p, q, sv); im.setMatrixAt(i, m4); }
      im.instanceMatrix.needsUpdate = true;
    }, [], { near: 99999 });
    return { go: () => { t0 = EVO.clock; im.visible = true; for (let i = 0; i < n; i++) { const c = P[i], s = i % 2 ? 1 : -1; c.p.set(o[0], o[1], o[2]); c.p.x += (Math.random() - 0.5) * 70; c.v.set((Math.random() - 0.5) * 34, 10 + Math.random() * 22, (Math.random() - 0.5) * 34); c.a = Math.random() * 6; c.w = 2 + Math.random() * 6; } } };
  }

  // ---------- SCENE 1 : LE PARKING (le lanceur, l'arche au loin) ----------
  const CARC = ['#c8352a', '#2f6fb0', '#e8b82a', '#d0d0d4', '#3a9a5a', '#2a2a2e', '#f0f0ee'];
  D.scenes.fdepart = { len: [170, 170], noDoor: true, noChaos: true, noDress: true, grass: false,
    pin: (T, sc) => ({ lx: 0, y: 8, from: 20, to: sc.d1 - sc.d0 - 20 }),
    ground: (d, lx, c, sc) => { const k = 1 - ss(150, 166, Math.abs(lx)); if (k > 0) c.lerp(ASPH, k * 0.97); },
    build(S) {
      const d0 = S.d0;
      for (let dc = d0 + 4; dc < S.d1; dc += 8) S.item(dc, () => { S.bx(dc, 0, 0.09, 0.5, 0.04, 4, 'col:#f2efe4', undefined, false, { shadow: false }); });
      for (const sg of [-1, 1]) for (let row = 0; row < 4; row++) { const lx0 = sg * (18 + row * 26); for (let dc = d0 + 8; dc < S.d1 - 6; dc += 3.2) S.item(dc, (r) => { S.bx(dc, lx0 + sg * 6, 0.09, 12, 0.04, 0.16, 'col:#f2efe4', undefined, false, { shadow: false }); if (r() < 0.42 && Math.abs(dc - d0) > 14) { const cc = pk(r, CARC), x = lx0 + sg * 6; S.bx(dc + 1.6, x, 0.75, 4.4, 1.1, 2.1, 'col:' + cc, undefined, true); S.bx(dc + 1.6, x - sg * 0.3, 1.65, 2.4, 0.8, 1.9, 'glass', undefined, false); } }); }
      for (let dc = d0 + 20; dc < S.d1; dc += 34) S.item(dc, () => { for (const s of [-1, 1]) lampPost(S, dc, s * 15); });
      S.item(d0 + 150, (r) => { for (const s of [-1, 1]) for (let k = 0; k < 3; k++) barrier(S, d0 + 150, s * (24 + k * 12), r); });
      for (let k = 0; k < 4; k++) S.item(d0 + 30 + k * 40, (r) => crates(S, d0 + 30 + k * 40, (k % 2 ? 1 : -1) * 11, r));
      parkTrees(S);
      balloons(S, d0 + 100, 10, S.sr, 120);
      foe(S, 'tank', d0 + 62, 3, 0, { name: 'CHAR', val: 240, keep: true });
      foe(S, 'heli', d0 + 84, 0, 25, { name: 'HELICO', keep: true, armed: false, patrol: (SS, dd, lx, y) => [SS.at(dd, -14, y), SS.at(dd + 10, 0, y + 3), SS.at(dd, 14, y), SS.at(dd - 10, 0, y + 3)], speed: 8 });
      foe(S, 'truck', d0 + 150, -8, 0, { name: 'CAMION', path: 60, speed: 14 });
    } };

  // ---------- SCENE 2 : LES GRANDES PORTES ----------
  const PORTES_G = 0.58;
  D.scenes.fportes = { len: [430, 430], noDoor: true, noChaos: true, noDress: true, grass: false,
    pin: (T, sc) => ({ lx: 0, y: 14, from: 30, to: sc.d1 - sc.d0 - 10 }),
    ground: (d, lx, c, sc) => { const g = sc.d0 + (sc.d1 - sc.d0) * PORTES_G; if (d < g - 120) { const k = 1 - ss(150, 166, Math.abs(lx)); if (k > 0) c.lerp(ASPH, k * 0.97); } else groundJ(150)(d, lx, c); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, dG = d(PORTES_G);
      // le parvis pave : bandes en travers (creme / terre cuite), allee centrale rose, rosace devant l'arche
      paveScene(S, (dd, x) => { if (dd < dG - 120) return null; const ax = Math.abs(x), i = Math.floor((dd - S.d0) / 4), rr = Math.hypot(dd - (dG + 60), x); if (rr < 34) return Math.floor(rr / 4) % 2 ? C.terra : (rr < 6 ? C.rose : C.cream); if (ax < 8) return C.rose; if (ax < 12) return C.terra; return i % 6 < 3 ? C.cream : (i % 6 === 3 ? C.terra : C.sand); });
      // l'avenue d'approche : asphalte, mats a drapeaux geants, ligne centrale
      for (let dc = S.d0 + 6; dc < dG - 120; dc += 8) S.item(dc, () => S.bx(dc, 0, 0.09, 0.5, 0.04, 4, 'col:#f2efe4', undefined, false, { shadow: false }));
      for (let dc = S.d0 + 24; dc < dG - 18; dc += 26) S.item(dc, (r) => { for (const s of [-1, 1]) { const x = s * 26; S.cyl(dc, x, 0, 0.9, 1, 'col:#d8cfbf', undefined, 8, 0.9, true); S.cyl(dc, x, 1, 0.22, 22, 'col:#e8e8e8', undefined, 8, 0.16, true); S.bx(dc, x - s * 2.6, 19.5, 5, 3.2, 0.1, 'col:' + pk(r, BAL), undefined, false); S.bx(dc, x - s * 2.6, 17.4, 5, 1.0, 0.1, 'col:#ffffff', undefined, false); S.ball(dc, x, 23.2, 0.4, 'col:' + C.gold, undefined, false); } });
      for (let dc = S.d0 + 12; dc < S.d1; dc += 30) S.item(dc, () => { if (Math.abs(dc - dG) < 20) return; for (const s of [-1, 1]) lampPost(S, dc, s * 18); });
      // les guichets devant l'arche
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) S.item(dG - 34, (r) => { const x = s * (22 + k * 9), dc = dG - 34; S.bx(dc, x, 1.6, 5, 3.2, 4.2, 'col:' + C.white, undefined, true); S.bx(dc, x, 2.2, 5.1, 1.2, 3, 'glass', undefined, false); S.cyl(dc, x, 3.2, 3.4, 2.4, 'col:' + (k ? C.blue : C.red), undefined, 12, 0.3, false); S.ball(dc, x, 5.8, 0.4, 'col:' + C.gold, undefined, false); });
      // les barrages militaires et caisses
      S.item(dG - 70, (r) => { for (const s of [-1, 1]) barrier(S, dG - 70, s * 16, r); }); S.item(dG - 54, (r) => crates(S, dG - 54, 34, r));
      grandGate(S, dG);
      // l'entree du parc : parterres ronds de fleurs, bancs, poubelles, kiosque a plans
      for (const [u, x] of [[0.74, -30], [0.78, 34], [0.9, -38], [0.95, 30]]) S.item(d(u), (r) => { const dc = d(u); S.cyl(dc, x, 0, 4.2, 0.8, 'col:#c9bba0', undefined, 16, 4.2, true); S.cyl(dc, x, 0.8, 3.8, 0.2, 'col:#4f8a3a', undefined, 16, 3.8, false); for (let k = 0; k < 14; k++) { const a = k * 0.449, rr = 1.2 + (k % 3) * 0.9; S.ball(dc + Math.cos(a) * rr, x + Math.sin(a) * rr, 1.25, 0.42, 'col:' + pk(r, [C.red, C.yellow, C.pink, '#ffffff', C.purple]), undefined, false); } });
      parkTrees(S);
      balloons(S, d(0.2), 10, S.sr, 130); balloons(S, d(0.6), 14, S.sr, 140); balloons(S, d(0.9), 14, S.sr, 140);
      foe(S, 'jeep', d(0.16), 6, 0, { name: 'JEEP', path: 80, speed: 16 });
      foe(S, 'aaturret', d(0.4), -30, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'apc', d(0.5), 10, 0, { name: 'TRANSPORT', hp: 2, armed: false });
      foe(S, 'heli', d(0.82), 0, 30, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 20, 0, y + 5), SS.at(dc, 26, y), SS.at(dc - 20, 0, y + 5)], speed: 11 });
    } };

  // ---------- SCENE 3 : LA GRANDE ALLEE (S autour de la fontaine) ----------
  const STYPES = ['tir', 'barbe', 'chamboule', 'lots', 'glace', 'tir', 'lots', 'barbe'];
  D.scenes.fallee = { len: [900, 900], noDoor: true, noChaos: true, noDress: true, grass: false, turns: [[0.14, 0.34, 32], [0.44, 0.7, -44], [0.8, 0.96, 22]],
    pin: (T, sc) => ({ lx: 0, y: 13, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: groundJ(150),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T;
      const tr = (S.sc.turns && S.sc.turns[1]) || { ang: 1 }, inner = tr.ang > 0 ? 1 : -1, dF = d(0.57), xF = inner * 46;   // la fontaine, a l'interieur du grand virage
      paveScene(S, (dd, x) => { const ax = Math.abs(x), i = Math.floor((dd - S.d0) / 4), j = Math.floor((x + 400) / 4), rr = Math.hypot(dd - dF, x - xF);
        if (rr < 30) return rr < 8 ? C.white : Math.floor(rr / 4) % 2 ? C.terra : C.cream;
        if (ax < 4) return i % 2 ? C.rose : C.cream;   // le chemin central
        if (ax < 18) return i % 5 === 0 ? C.terra : ((i + j) % 2 ? C.cream : C.sand);   // l'allee : grandes dalles claires, bandes de terre cuite en travers
        if (ax < 22) return C.rose;
        return (i % 8 === 0 || j % 8 === 0) ? C.terra : (hsh(i, j) < 0.5 ? C.sand : C.grey); });
      // fontaine : bassin, vasques, jets d'eau
      S.item(dF, (r) => { S.cyl(dF, xF, 0, 16, 1.4, 'col:' + C.white, undefined, 24, 16, true); S.cyl(dF, xF, 1.1, 15, 0.3, 'waterSurf', undefined, 24, 15, false); S.cyl(dF, xF, 1.4, 2.2, 6, 'col:' + C.white, undefined, 12, 1.4, true); S.cyl(dF, xF, 7.4, 6, 0.8, 'col:' + C.white, undefined, 16, 4.5, false); S.cyl(dF, xF, 8.2, 1.2, 4, 'col:' + C.white, undefined, 10, 0.8, false); S.cyl(dF, xF, 12.2, 3, 0.6, 'col:' + C.white, undefined, 12, 2.2, false); S.cyl(dF, xF, 12.8, 0.5, 6, 'basic:#e6f6ff', undefined, 8, 0.15, false); for (let k = 0; k < 8; k++) { const a = k * 0.785; S.cyl(dF + Math.cos(a) * 10, xF + Math.sin(a) * 10, 1.4, 0.3, 4.5, 'basic:#e6f6ff', undefined, 6, 0.08, false); } });
      // stands des deux cotes (des passages de 26 m tous les ~150 m vers les maneges), lampadaires, guirlandes
      for (const sg of [-1, 1]) { let i = 0; for (let dc = S.d0 + 18; dc < S.d1 - 10; dc += 12.6) { const u = (dc - S.d0) / L, gap = ((dc - S.d0) % 150) < 26; if (gap) continue; if (Math.hypot(dc - dF, sg * 26 - xF) < 52) continue; const ii = i++; S.item(dc, (r) => stand(S, dc, S.lane(dc).lx + sg * (26 + r.between([0, 1.5])), r, STYPES[(ii + (sg > 0 ? 3 : 0)) % STYPES.length])); } }
      for (let dc = S.d0 + 8; dc < S.d1; dc += 22) S.item(dc, () => { for (const s of [-1, 1]) if (Math.hypot(dc - dF, s * 17.5 - xF) > 26) lampPost(S, dc, S.lane(dc).lx + s * 17.5); });
      for (let dc = S.d0 + 30; dc < S.d1 - 10; dc += 44) S.item(dc, (r) => { const Lc = S.lane(dc).lx; garland(S, dc, Lc - 18, Lc + 18, 17 + r.between([-1, 2]), r); });
      // mobilier de l'allee : bancs, poubelles, chariots de glaces
      for (let dc = S.d0 + 40; dc < S.d1; dc += 57) S.item(dc, (r) => { const s = r() < 0.5 ? -1 : 1, x = S.lane(dc).lx + s * 14.5; S.bx(dc, x, 0.5, 0.6, 0.15, 2.4, 'col:#8a5a34', undefined, false); S.bx(dc, x + s * 0.3, 0.9, 0.12, 0.7, 2.4, 'col:#8a5a34', undefined, false); S.bx(dc + 2, x, 0.5, 0.7, 1.0, 0.7, 'col:#2c4a3a', undefined, true);
        if (r() < 0.5) { const z = dc + 6; S.bx(z, x - s * 2, 0.9, 1.6, 1.2, 2.6, 'col:' + C.white, undefined, true); S.cyl(z, x - s * 2, 1.5, 0.05, 2.4, 'col:#555555', undefined, 6, 0.05, false); S.cyl(z, x - s * 2, 3.9, 1.8, 1.0, 'col:' + pk(r, [C.red, C.blue, C.pink]), undefined, 12, 0.1, false); } });
      // l'armee : barrages rouges et blancs, caisses
      for (const u of [0.1, 0.38, 0.66, 0.9]) S.item(d(u), (r) => { const Lc = S.lane(d(u)).lx, s = r() < 0.5 ? -1 : 1; barrier(S, d(u), Lc + s * 14, r); crates(S, d(u) + 8, Lc - s * 20, r); });
      // les maneges au fond, de chaque cote (ils tournent)
      const RIDES = [[0.07, 1, carousel, 58], [0.18, -1, swingRide, 60], [0.27, 1, dropTower, 62], [0.37, -1, bigTop, 78], [0.48, 1, pirateShip, 54], [0.66, -1, carousel, 60], [0.76, 1, bigTop, 82], [0.84, -1, dropTower, 58], [0.93, 1, swingRide, 60]];
      for (const [u, s, fn, x] of RIDES) S.item(d(u), (r) => { const xx = s === inner && Math.abs(d(u) - dF) < 90 ? -s * x : s * x; fn(S, d(u), S.lane(d(u)).lx + xx, r); });
      for (let k = 0; k < 9; k++) balloons(S, d(0.05 + k * 0.11), 14, S.sr, 110);
      parkTrees(S);
      // les ennemis
      foe(S, 'aaturret', d(0.08), -16, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'jeep', d(0.18), 8, 0, { name: 'JEEP', path: 110, speed: 18 });
      foe(S, 'tank', d(0.3), -10, 0, { name: 'BLINDE', hp: 2, armed: false });
      foe(S, 'heli', d(0.42), 0, 34, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -24, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 24, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'rocketTruck', d(0.52), 14, 0, { name: 'LANCE-ROQUETTES', armed: true });
      foe(S, 'apc', d(0.63), -8, 0, { name: 'TRANSPORT', path: 90, speed: 15 });
      foe(S, 'tank', d(0.76), 10, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'aaturret', d(0.86), 18, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'truck', d(0.94), -6, 0, { name: 'CAMION', path: 100, speed: 15 });
    } };

  // ---------- la fiche du niveau 3 ----------
  const SC3 = ['fdepart', 'fportes', 'fallee'], NAMES = { fdepart: 'LE PARKING', fportes: 'LES GRANDES PORTES', fallee: 'LA GRANDE ALLEE' };
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 3) || g.evoPreview) return _ld(g);
    const q = /[?&]evoscenes=([\w,]+)/.exec(location.search), sc = q ? q[1].split(',') : SC3, Zs = D.scenes;
    let len = 80; EVO.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { EVO.chapters.push({ d: len - 80, i: EVO.chapters.length, name: NAMES[n] || n.toUpperCase(), key: n }); len += s.len[0]; } }
    return EVO.baseDef({ zone: 'campagne', len: len + 400, scenes: sc, order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 3303 });
  };
})();
