/* v124 : eau en 3D (facettes qui ondulent), RIVIERE à tranchée plongeable (on peut entrer dans l'eau : ennemis flottants et immergés) et GROTTE profonde (920 m :
 * descente en piqué, puits, lac souterrain, cristaux, galeries qui tournent, remontée à la surface). Chargé après zones_evo2.js (il remplace ces deux scènes). */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, D = Z.defs.campagne, foe = Z.evoFoe;
  if (!D || !foe || !TR) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const SAND = ['#9c9482', '#948c7a', '#a39b88', '#8c8472'], CAVE = ['#625c52', '#5a544a', '#68625a', '#524c44'];
  const rel = (sc, fn) => { let lo = 0, hi = 0; for (let d = sc.d0; d <= sc.d1; d += 4) { const v = fn(d); if (v < lo) lo = v; if (v > hi) hi = v; } sc.rlo = lo; sc.rhi = hi; return { fn, max: Math.max(-lo, hi) }; };
  const ZERO = new THREE.Vector3(), QI = new THREE.Quaternion();
  function boulder(S, dc, lx, y, s, r, gray) { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, SAND), noMoss: true }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); }

  // ---------- eau 3D : grille de facettes ondulées (la houle est figée, la texture coule dessus) ; yAbs = cote absolue de la surface (suit T.rel) ----------
  const wv = (x, z) => 0.5 * Math.sin(x * 0.31 + z * 0.17) + 0.32 * Math.sin(x * 0.17 - z * 0.43 + 1.7) + 0.18 * Math.sin(x * 0.7 + z * 0.55 + 4);
  Z.evoWaves = function (S, d0, d1, hw, yAbs, mat, tint, amp, fade) {   // v298 : tuiles de largeur egale qui tombent exactement sur [d0, d1] (ni recouvrement ni bande vide) ; fade : la houle s'aplatit aux deux bouts pour se raccorder au plan d'eau voisin
    const cols = Math.max(2, Math.round(2 * hw / 9)), nT = Math.max(1, Math.ceil((d1 - d0) / 12 - 1e-6)), step = (d1 - d0) / nT, rows = 4;
    for (let ti = 0; ti < nT; ti++) { const dc = d0 + ti * step; S.item(dc + step / 2, () => {
      const pos = [], uv = [], ix = [];
      for (let r = 0; r <= rows; r++) { const dd = dc + step * r / rows, fl = S.T.rel(dd);
        for (let c = 0; c <= cols; c++) { const lx = -hw + 2 * hw * c / cols, edge = Math.min(1, Math.min(c, cols - c) / 2) * (fade ? Math.min(1, (dd - d0) / 6, (d1 - dd) / 6) : 1), p = S.at(dd, lx, yAbs - fl + wv(lx, dd) * (amp || 0.4) * edge); pos.push(p[0], p[1], p[2]); uv.push(lx, dd); } }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, q = a + cols + 1, e = q + 1; ix.push(a, q, b, b, q, e); }
      { const A = new THREE.Vector3(pos[0], pos[1], pos[2]), B = new THREE.Vector3(pos[3 * (cols + 1)], pos[3 * (cols + 1) + 1], pos[3 * (cols + 1) + 2]), C2 = new THREE.Vector3(pos[3], pos[4], pos[5]); if (B.sub(A).cross(C2.sub(A)).y < 0) for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } }
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
      const g2 = g.toNonIndexed(); g.dispose(); g2.computeVertexNormals();
      S.b.addGeometry(g2, ZERO, QI, null, mat, tint, [1 / 15, 1 / 15]); g2.dispose();
    }); }
  };

  // ===== RIVIERE : une tranchée de 12 m en travers du couloir, remplie d'eau translucide (on plonge dedans) ; un bateau en surface, un sous-marin dont on devine la forme, le pont au-dessus
  D.scenes.riviere = { len: [440, 440], noDoor: true, noChaos: true,
    relief(T, sc) { return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -12 * ss(0.24, 0.38, u) * (1 - ss(0.62, 0.76, u)); }); },
    build(S) {
      const L = S.len, dr = S.d0 + L * 0.5, v = S.vol(dr), WY = -1.4, fl = S.T.rel(dr);
      Z.evoWaves(S, S.d0 + L * 0.2, S.d0 + L * 0.8, v + 60, WY, 'waterSurf', '#a6d0e4', 0.45);
      Z.evoWater = { d0: S.d0 + L * 0.24, d1: S.d0 + L * 0.76, y: S.at(dr, 0, WY - fl)[1] };
      S.item(dr, (r) => {
        const yd = 7.4 - fl;   // tablier à la cote absolue 7,4
        S.bx(dr, 0, yd, 2 * (v + 30), 1.6, 16, 'concrete', '#bdbdb8', true);
        for (const x of [-1, 1]) S.bx(dr, x * (v + 12), yd + 1.2, 0.5, 1.2, 16, 'metal', '#8a8e96', false);
        for (const k of [-4, -2, 2, 4]) { if (Math.abs(k * 22) > v + 18) continue; S.bx(dr, k * 22, yd / 2 - 0.8, 4, yd - 1.6, 11, 'concrete', '#b0b0ac', true); }   // piles dans l'eau
      });
      S.reserve(dr, 0, 2 * (v + 30), 20);
      for (let i = 0; i < 14; i++) { const dc = S.d0 + 10 + S.sr() * (L - 20), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([30, v - 8]); if (Math.abs(dc - dr) < 50 || (dc > S.d0 + L * 0.2 && dc < S.d0 + L * 0.8)) continue; S.item(dc, (r) => { const p = S.at(dc, lx, 0); if (r() < 0.55) TR.broadleaf(S.b, p[0], p[1], p[2], r.between([9, 17]), r, {}); else TR.conifer(S.b, p[0], p[1], p[2], r.between([14, 26]), r, {}); }); }
      // v267 : avant le lac, une enorme masse rocheuse en deux murs decales (chicane) : il faut passer a droite puis a gauche (le vol tout droit s'y ecrase)
      [[0.06, 1], [0.2, -1]].forEach(([u, sg]) => S.item(S.d0 + L * u, (r) => {
        const dc = S.d0 + L * u, Lc = S.lane(dc).lx, vv = S.vol(dc) + 70, g = sg * Math.min(9, Math.max(6, S.vol(dc) - 18)), hw = 12, tn = pk(r, ['#a39f94', '#9d9c96', '#aeaaa0']), shade = (k) => '#' + new THREE.Color(tn).multiplyScalar(k).getHexString();
        const parts = sg > 0 ? [[-vv, g - hw], [g + hw, vv]] : [[-vv, g - hw], [g + hw, vv]];   // [bord gauche, bord droit] de chaque mur ; le passage est entre les deux
        for (const [a, b] of parts) { S.bx(dc, Lc + (a + b) / 2, 130 - 20, b - a, 260, 16, 'col:' + tn, undefined, true);
          for (let k = 0; k < 5; k++) { const side = (a < g - hw) ? b : a; const sgn = (a < g - hw) ? -1 : 1; S.bx(dc + r.between([-2, 2]), Lc + side + sgn * r.between([1, 3]), 6 + k * 34 + r.between([0, 14]), r.between([4, 9]), r.between([9, 22]), r.between([18, 24]), 'col:' + shade(r.between([0.78, 1.1])), undefined, true); } }
      }));
      const yW = WY - fl + 0.35;   // hauteur locale de la surface (au creux de la tranchée)
      foe(S, 'boat', S.d0 + L * 0.42, -12, yW, { name: 'VEDETTE', path: 60, speed: 9 });
      foe(S, 'sub', S.d0 + L * 0.56, 12, yW - 3.0, { name: 'SOUS-MARIN', hp: 2 });
      foe(S, 'tank', S.d0 + L * 0.84, 14, 0, { name: 'CHAR CACHE', hp: 2, armed: false });
    } };

  // ===== GROTTE : 920 m ; entrée dans la montagne, descente en piqué, puits, lac souterrain, cristaux, galeries qui tournent, remontée vers la lumière
  D.scenes.grotte = { len: [920, 920], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 20, from: 24, to: sc.d1 - sc.d0 - 24, fx: (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return 14 * Math.sin((d - sc.d0) / 85) * ss(0.15, 0.26, u) * (1 - ss(0.74, 0.85, u)); } }),
    relief(T, sc) { return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return (-42 * ss(0.13, 0.3, u) - 36 * ss(0.44, 0.5, u)) * (1 - ss(0.62, 0.86, u)) * 1; }); },
    ground: (d, lx, c, sc) => { const e0 = sc.d0 + (sc.d1 - sc.d0) * 0.12, e1 = sc.d0 + (sc.d1 - sc.d0) * 0.88, k = ss(e0 - 14, e0 + 6, d) * (1 - ss(e1 - 6, e1 + 14, d)) * (1 - ss(70, 110, Math.abs(lx))); if (k > 0) c.lerp(new THREE.Color('#5f584e'), k); },
    build(S) {
      const L = S.len, e0 = S.d0 + L * 0.12, e1 = S.d0 + L * 0.88, H = 52;
      const Rn = (m) => 40 + 16 * Math.max(0, Math.sin((m - e0) / 95)) + 10 * ss(0.4, 0.5, (m - S.d0) / L) * (1 - ss(0.6, 0.66, (m - S.d0) / L)), Hn = (m) => H + 14 * Math.max(0, Math.sin((m - e0) / 140 + 1)) + 22 * ss(0.5, 0.52, (m - S.d0) / L) * (1 - ss(0.6, 0.64, (m - S.d0) / L));
      // la montagne : deux parois percées, flancs et toit qui suivent le sol, masses rocheuses au-dessus
      for (const [dc, k] of [[e0, 0], [e1, 1]]) S.item(dc, () => { const Lc = S.lane(dc).lx; S.wall(dc, Lc - 170, Lc + 170, -40, 110, 7, 'concreteWarm', k ? '#5a544a' : '#625c52', { lx: Lc, yc: 26, w: 86, h: 58 }); S.bx(dc, Lc, 56, 90, 1.6, 8, 'col:#5a4a38', undefined, false); });
      for (let dc = e0; dc < e1; dc += 12) S.item(dc + 6, (r) => {
        const m = dc + 6, Lc = S.lane(m).lx, R = Rn(m), Hc = Hn(m), fl = S.T.rel(m);
        for (const s of [-1, 1]) S.bx(m, Lc + s * (R + 7), 50, 14, 140, 12.8, 'concreteWarm', pk(r, CAVE));
        S.bx(m, Lc, Hc + 6, 2 * R + 28, 12, 12.8, 'concreteWarm', pk(r, CAVE));
        for (const s of [-1, 1]) for (const y of [0, 13, 26, 39]) boulder(S, m + r.between([-3, 3]), Lc + s * (R + 2 + r.between([-1, 3])), y + 1, r.between([9, 14]), r, pk(r, CAVE));
        if (r() < 0.45) boulder(S, m, Lc + r.between([-R + 8, R - 8]), Hc + 1, r.between([8, 12]), r, pk(r, CAVE));
        // plancher de la galerie sous la zone des rochers : on ne voit jamais l'herbe
      });
      S.item((e0 + e1) / 2, (r) => { for (const [x, s] of [[-0.35, 150], [-0.1, 190], [0.18, 170], [0.4, 150]]) { const dc = (e0 + e1) / 2 + x * (e1 - e0) * 0.5, fl = S.T.rel(dc); S.ball(dc, 0, 70 - fl, s, 'col:' + pk(r, ['#7d7a6a', '#7a7866', '#82806e']), undefined, false, 0.42); } });
      // stalactites, stalagmites, piliers, cristaux, rails, lampes
      S.rows(e0 + 14, e1 - 14, 9, 0.95, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx, R = Rn(dc), Hc = Hn(dc), lx = Lc + r.between([-R + 5, R - 5]); if (Math.abs(lx - Lc) < 11) return; const h = r.between([3, 8]); S.cyl(dc, lx, Hc - h, 0.25, h, 'concreteWarm', '#5a5448', 7, r.between([1, 2]), true); }));
      S.rows(e0 + 14, e1 - 14, 12, 0.95, (dc) => S.item(dc, (r) => { const Lc = S.lane(dc).lx, R = Rn(dc), lx = Lc + r.between([-R + 5, R - 5]); if (Math.abs(lx - Lc) < 11) return; const h = r.between([2, 6]); S.cyl(dc, lx, 0, r.between([1, 2]), h, 'concreteWarm', '#524c42', 7, 0.25, true); }));
      for (let dc = e0 + 40; dc < e1 - 30; dc += 70) S.item(dc, (r) => { const Lc = S.lane(dc).lx, R = Rn(dc), Hc = Hn(dc), lx = Lc + (r() < 0.5 ? -1 : 1) * r.between([22, Math.max(23, R - 6)]); S.cyl(dc, lx, 0, 3.0, Hc + 4, 'concreteWarm', '#5c564c', 9, 3.0, true); });
      for (let dc = e0 + 10; dc < e1 - 10; dc += 15) S.item(dc, (r) => {
        const Lc = S.lane(dc).lx, R = Rn(dc), s = r() < 0.5 ? -1 : 1, col = pk(r, ['#5cf0ff', '#7af0c0', '#9a8cff']);
        for (let k = 0; k < 3; k++) S.cyl(dc + k * 1.4, Lc + s * (R - 3 - k * 1.2), 0, r.between([0.9, 1.5]), r.between([3, 9]), 'emis:' + col, undefined, 5, 0.08, false);
        S.glow(dc, Lc + s * (R - 4), 4, col, 16);
      });
      for (let dc = e0 + 4; dc < e1 - 4; dc += 12) S.item(dc + 6, () => { const m = dc + 6, Lc = S.lane(m).lx; for (const s of [-1, 1]) S.bx(m, Lc + s * 2.4, 0.22, 0.3, 0.3, 12.4, 'metal', '#6a6e74', false); S.bx(m, Lc, 0.1, 6.4, 0.2, 1.2, 'planks', '#6a5238', false); });
      for (let dc = e0 + 10; dc < e1 - 10; dc += 24) S.item(dc, () => { const Lc = S.lane(dc).lx, R = Rn(dc); for (const s of [-1, 1]) { S.bx(dc, Lc + s * (R - 1.4), 9, 0.6, 0.6, 0.6, 'emis:#ffcf8a', undefined, false); S.glow(dc, Lc + s * (R - 2), 9, '#ffcf8a', 10); } });
      for (let dc = e0 + 50; dc < e1 - 40; dc += 70) S.item(dc, () => { const Lc = S.lane(dc).lx, R = Rn(dc), Hc = Hn(dc); S.frame(dc, Lc, (Hc - 2) / 2, 2 * R - 14, Hc - 6, 2 * R - 4, Hc, 1.4, 'planks', '#7a5e40'); });
      // lac souterrain au fond (la surface suit le sol)
      Z.evoWaves(S, S.d0 + L * 0.51, S.d0 + L * 0.61, 34, -78 + 1.4, 'waterSurf', '#a6d0e4', 0.45);
      foe(S, 'truck', e0 + 60, -4, 0, { name: 'CAMION', path: 80, speed: 13 });
      foe(S, 'tank', S.d0 + L * 0.37, 6, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'aaturret', S.d0 + L * 0.56, -16, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'heli', S.d0 + L * 0.66, 0, 14, { name: 'DRONE', patrol: (SS, dc, lx, y) => [SS.at(dc, -12, y), SS.at(dc + 16, 8, y + 4), SS.at(dc, 12, y), SS.at(dc - 16, -8, y + 4)], speed: 9 });
      foe(S, 'apc', e1 - 50, -10, 0, { name: 'TRANSPORT', armed: true });
    } };


  // ---------- anneaux à traverser : arches de pierre en ruine, troncs creux, tuyaux géants, portiques de la base (on passe DEDANS) ----------
  const ring = (S, dc, mat, tint, R, len, th) => S.item(dc, () => { const L = S.lane(dc), yc = Math.max(L.y, R - 3); S.tube(dc, L.lx, yc, R, len || 3, mat, tint, 10, th || 2.6, true); S.gate(dc, L.lx, L.y); S.reserve(dc, L.lx, 2 * R + 8, (len || 3) + 6); });
  const DECOR = {
    falaise: [[70, 'brick', '#a08870', 15, 3, 3], [150, 'brick', '#9a8268', 13, 3, 3]],
    entrepots: [[170, 'metal', '#8a8e96', 12, 8, 2], [330, 'metal', '#c8a028', 13, 4, 2.4], [560, 'metal', '#8a8e96', 12, 8, 2], [700, 'metal', '#c8a028', 13, 4, 2.4]],
    base: [[110, 'concrete', '#b0b0ac', 14, 4, 3], [250, 'concrete', '#b0b0ac', 13, 4, 3], [400, 'concrete', '#b0b0ac', 12, 4, 3]],
  };
  for (const name of Object.keys(DECOR)) { const sc = D.scenes[name]; if (!sc) continue; const b0 = sc.build; sc.build = function (S) { b0.call(this, S); for (const q of DECOR[name]) if (q[0] < S.len - 20) ring(S, S.d0 + q[0], q[1], q[2], q[3], q[4], q[5]); }; }

  // zones mouillées : le sol y est un lit de galets gris, sans herbe
  D.scenes.riviere.wet = (d, lx, sc, T) => d > sc.d0 + (sc.d1 - sc.d0) * 0.18 && d < sc.d0 + (sc.d1 - sc.d0) * 0.82 && T.rel(d) < -1.2;
  D.scenes.grotte.wet = (d, lx, sc) => d > sc.d0 + (sc.d1 - sc.d0) * 0.5 && d < sc.d0 + (sc.d1 - sc.d0) * 0.62 && Math.abs(lx) < 40;
  // l'eau des autres chapitres devient en 3D elle aussi (rivière du vallon, fleuve de la falaise)
  const oldVallee = D.scenes.vallee, oldFalaise = D.scenes.falaise;
  if (oldVallee) D.scenes.vallee = Object.assign({}, oldVallee, { wet: (d, lx, sc) => d > sc.d0 + (sc.d1 - sc.d0) * 0.19 && d < sc.d1 - (sc.d1 - sc.d0) * 0.21 && Math.abs(lx) < 46, build(S) { oldVallee.build.call(this, S); const A = S.sc.A, L = S.len; Z.evoWaves(S, S.d0 + L * 0.2, S.d1 - L * 0.22, 40, -A + 1.2, 'waterSurf', '#a6d0e4', 0.45); } });
  if (oldFalaise) D.scenes.falaise = Object.assign({}, oldFalaise, { wet: (d, lx, sc) => d > sc.d0 + 6 && d < sc.d0 + (sc.d1 - sc.d0) * 0.2 + 14 && Math.abs(lx) < 19, build(S) { oldFalaise.build.call(this, S); Z.evoWaves(S, S.d0 + 10, S.d0 + S.len * 0.2 + 12, 16, 0.3, 'waterSurf', '#a6d0e4', 0.45); } });
})();
