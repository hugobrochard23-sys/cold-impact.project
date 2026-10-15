/* v122 : LES GRANDS CHAPITRES du niveau 1 du mode évolution (?evo=1) — forêt dense, vallée et pont, grotte, falaise en chute libre, entrepôts, base militaire.
 * Chaque chapitre a son relief propre (le sol monte et descend vraiment), son décor réaliste (CC.Trees : arbres à facettes, rochers moussus) et ses ennemis posés
 * à la main avec Z.evoFoe (rares, espacés, chacun sa mécanique). Les hauteurs (y) des ennemis sont relatives au sol de LEUR distance. */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, K = Z.kit, D = Z.defs.campagne, foe = Z.evoFoe, DEG = 180 / Math.PI;
  if (!D || !foe || !TR) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const SAND = ['#9c9482', '#948c7a', '#a39b88', '#8c8472'], MOSS = '#6d8450', CONC = '#9a9c98', CONCD = '#6c6e6c', RUST = ['#8a5a44', '#7a5a48', '#6a5240'];
  const rel = (sc, fn) => { let lo = 0, hi = 0; for (let d = sc.d0; d <= sc.d1; d += 4) { const v = fn(d); if (v < lo) lo = v; if (v > hi) hi = v; } sc.rlo = lo; sc.rhi = hi; return { fn, max: Math.max(-lo, hi) }; };

  // arbre réaliste posé au sol à (dc, lx) ; le tronc est solide près de la trajectoire
  function plant(S, dc, lx, r, o) {
    o = o || {}; const p = S.at(dc, lx, 0), h = o.h || r.between([15, 29]), conif = o.conif !== undefined ? o.conif : r() < 0.55;
    if (conif) TR.conifer(S.b, p[0], p[1], p[2], h, r, { far: o.far }); else TR.broadleaf(S.b, p[0], p[1], p[2], h * 0.85, r, { autumn: r() < 0.04, far: o.far });
    if (!o.far) S.b.box({ p: [p[0], p[1] + h * 0.4, p[2]], s: [h * 0.06 + 0.7, h * 0.8, h * 0.06 + 0.7], render: false });
  }
  function ground(S, dc, lx, r, k) {   // sous-bois : buissons, rochers moussus, souches, troncs couchés
    const p = S.at(dc, lx, 0), t = r();
    if (t < 0.42) TR.bush(S.b, p[0], p[1], p[2], r.between([1.4, 3]), r); else if (t < 0.78) TR.rock(S.b, p[0], p[1], p[2], r.between([1, 3.4]), r); else if (t < 0.9) TR.stump(S.b, p[0], p[1], p[2], r.between([0.9, 1.5]), r); else TR.log(S.b, p[0], p[1], p[2], r.between([5, 10]), r);
  }
  function boulder(S, dc, lx, y, s, r, gray) { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: gray || pk(r, SAND), noMoss: true }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); }
  // falaise en terrasses des deux côtés d'un vallon : de la cote absolue a à b (le sol suit T.rel, on retire donc le sol à chaque pas)
  function cliffs(S, half, a, b, from, to, step) {
    for (let dc = from; dc < to - 0.1; dc += step) S.item(dc + step / 2, (r) => {
      const m = dc + step / 2, fl = S.T.rel(m), L = S.lane(m), tint = pk(r, SAND);
      for (const s of [-1, 1]) {
        S.bx(m, L.lx + s * (half + 14), (a + b) / 2 - fl, 28, b - a, step + 0.8, 'concreteWarm', tint);
        S.bx(m, L.lx + s * (half + 3 + r() * 2), (a + 6) / 2 - fl, 6, 6 - a, step + 0.8, 'concreteWarm', pk(r, SAND));   // talus au pied
        S.bx(m, L.lx + s * (half + 14), b - fl + 0.3, 28, 0.6, step + 0.8, 'col:' + MOSS, undefined, false, { shadow: false });   // herbe au sommet
      }
    });
  }
  // falaise taillée dans la roche : gros blocs à facettes empilés devant la paroi (silhouette naturelle)
  function cliffRocks(S, half, a, b, from, to, step) {
    for (let dc = from; dc < to; dc += step) S.item(dc, (r) => {
      const fl = S.T.rel(dc), L = S.lane(dc);
      for (const s of [-1, 1]) for (let y = a; y < b - 8; y += 17) { const sz = r.between([17, 27]), lx = L.lx + s * (half + 4 + r.between([0, 7])); boulder(S, dc + r.between([-4, 4]), lx, y - fl + sz * 0.1, sz, r, pk(r, SAND)); }
    });
  }
  const slab = (S, d0, d1, w, mat, tint) => { for (let dc = d0; dc < d1; dc += 5) S.item(dc + 2.5, () => S.bx(dc + 2.5, 0, -0.2, w, 0.6, 5.5, mat, tint, false, { shadow: false })); };   // tranches de 5 m : elles suivent la pente (jamais de marches)
  const roofLine = (S, dc, lx, w, dd, y, tint) => S.bx(dc, lx, y, w, 0.9, dd, 'corrugated', tint, true);

  // ===== FORET DENSE : sous-bois, deux collines, une clairière avec une scierie ; le lance-missiles tire depuis la colline, l'hélico patrouille au-dessus de la canopée
  D.scenes.foret = { len: [700, 700], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 22, from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return 20 * ss(0.06, 0.26, u) * (1 - ss(0.34, 0.56, u)) + 14 * ss(0.66, 0.8, u) * (1 - ss(0.86, 0.98, u)); }); },
    build(S) {
      const cl = S.d0 + 330;
      for (const sg of [-1, 1]) {
        S.rows(S.d0, S.d1, 7.5, 0.95, (dc) => S.item(dc, (r) => { const L = S.lane(dc); let lx = L.lx + sg * r.between([22, 62]); if (Math.abs(dc - cl) < 52 && Math.abs(lx) < 56) return; plant(S, dc, lx, r); }));
        S.rows(S.d0, S.d1, 13, 0.9, (dc) => S.item(dc, (r) => plant(S, dc, S.lane(dc).lx + sg * r.between([62, S.vol(dc) + 30]), r, { far: true, h: r.between([28, 48]) })));
        S.rows(S.d0, S.d1, 11, 0.9, (dc) => S.item(dc, (r) => { const L = S.lane(dc), lx = L.lx + sg * r.between([14, 30]); if (Math.abs(dc - cl) < 40 && Math.abs(lx) < 50) return; ground(S, dc, lx, r); }));
      }
      // clairière : la scierie (rondins empilés, hangar en planches, camion), un feu de camp
      S.item(cl, (r) => {
        for (let i = 0; i < 5; i++) for (let j = 0; j <= i % 3; j++) { const p = S.at(cl - 20 + i * 2.4, -32, 0.5 + j * 1.1); S.cyl(cl - 20 + i * 2.4, -32, 0.1 + j * 1.5, 0.75, 9, 'col:#8a6a44', undefined, 8, 0.75, false); }
        S.bx(cl, 30, 3.2, 14, 6.4, 18, 'planks', '#8a7254'); S.bx(cl, 30, 6.8, 15, 1.2, 19.6, 'corrugated', '#7a5a48'); S.bx(cl + 16, 34, 2, 8, 4, 6, 'planks', '#9a8260');
        for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; S.cyl(cl + 4, -8 + 0, 0, 0.5, 0.9, 'concreteWarm', '#7a766c', 6, 0.5, false); }
      });
      foe(S, 'sam', S.d0 + 150, -34, 0, { name: 'LANCE-MISSILES', armed: true });
      foe(S, 'heli', S.d0 + 300, 0, 40, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -40, y), SS.at(dc + 24, 0, y + 6), SS.at(dc, 40, y), SS.at(dc - 24, 0, y + 6)], speed: 12 });
      foe(S, 'tank', S.d0 + 470, 6, 0, { name: 'CHAR CACHE', hp: 2, armed: false });
      foe(S, 'jeep', S.d0 + 600, -10, 0, { name: 'JEEP', path: 90, speed: 17 });
    } };

  // ===== VALLEE : on plonge dans un vallon encaissé (falaises en terrasses, rivière, cascade), on passe SOUS le grand pont, on ressort par le haut
  D.scenes.vallee = { len: [660, 660], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 20, from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { const A = 66; sc.A = A; return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -A * ss(0.05, 0.3, u) * (1 - ss(0.68, 0.94, u)); }); },
    build(S) {
      const A = S.sc.A, L = S.len, half = 46, yb = -A - 8, mid = S.d0 + L * 0.5;
      cliffs(S, half, yb, 24, S.d0 + L * 0.06, S.d1 - L * 0.02, 14); cliffRocks(S, half, yb, 24, S.d0 + L * 0.06, S.d1 - L * 0.02, 13);
      // la rivière au fond (cote absolue −A+2) et ses rochers ; des arbres sur les berges
      S.rows(S.d0 + L * 0.18, S.d1 - L * 0.2, 9, 0.9, (dc) => S.item(dc, (r) => { const sg = r() < 0.5 ? -1 : 1, lx = S.lane(dc).lx + sg * r.between([half - 22, half - 4]); if (r() < 0.55) plant(S, dc, lx, r, { h: r.between([12, 22]), solid: false }); else boulder(S, dc, lx, 0, r.between([2, 5]), r); }));
      S.rows(S.d0 + L * 0.2, S.d1 - L * 0.2, 17, 0.9, (dc) => S.item(dc, (r) => { const lx = r.between([-half + 14, half - 14]); if (Math.abs(lx - S.lane(dc).lx) > 12) boulder(S, dc, lx, -A + 2 - S.T.rel(dc) + 0.2 + 0, r.between([2.5, 6]), r, '#8a8a84'); }));
      // cascade sur la falaise de gauche
      S.item(S.d0 + L * 0.2, () => { const dc = S.d0 + L * 0.2, fl = S.T.rel(dc); S.bx(dc, -(half - 1), (-A + 16) / 2 - fl, 8, A + 16, 0.7, 'waterSurf', '#f4fbff', false, { shadow: false }); S.bx(dc, -(half - 3), -A + 1.6 - fl, 13, 3, 6, 'basic:#eef6f8', undefined, false, { shadow: false }); });
      // le grand pont : tablier à la cote 6, piles en pierre, garde-corps, poutres en treillis
      S.item(mid, (r) => {
        const fl = S.T.rel(mid), w = 2 * (half + 26), yd = 6 - fl;
        S.bx(mid, 0, yd, w, 2.2, 18, 'concrete', '#b8b6ae', true); S.bx(mid, 0, yd + 1.7, w, 1.1, 0.5, 'metal', '#8e9298', false); S.bx(mid + 8.6, 0, yd + 1.4, w, 1.2, 0.4, 'metal', '#8e9298', false); S.bx(mid - 8.6, 0, yd + 1.4, w, 1.2, 0.4, 'metal', '#8e9298', false);
        for (const x of [-38, 38]) { S.bx(mid, x, (yd - 1 + (-A)) / 2, 5, yd - 1 + A, 10, 'concreteWarm', '#a09680'); S.bx(mid, x, yd - 2.4, 9, 2.4, 12, 'concrete', '#a8a69e'); }
        for (let k = -half; k <= half; k += 9) S.bx(mid, k, yd + 3.4, 0.5, 3.4, 0.5, 'metal', '#8e9298', false);
      });
      S.reserve(mid, 0, 2 * (half + 30), 22);
      foe(S, 'tank', mid + 40, 20, 0, { name: 'CHAR DU PONT', hp: 2, armed: false });
      foe(S, 'sam', S.d0 + L * 0.74, 26, 0, { name: 'LANCE-MISSILES', armed: true });
      foe(S, 'heli', S.d0 + L * 0.58, 0, 26, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -30, y), SS.at(dc + 20, 0, y + 8), SS.at(dc, 30, y), SS.at(dc - 20, 0, y + 8)], speed: 11 });
    } };
  const fl0 = (S, d) => S.T.rel(d);

  // ===== GROTTE : une montagne creusée — entrée dans la paroi, caverne avec stalactites, piliers, rails et lampes, sortie en pleine lumière
  D.scenes.grotte = { len: [520, 520], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 14, from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -16 * ss(0.04, 0.2, u) * (1 - ss(0.8, 0.96, u)); }); },
    build(S) {
      const L = S.len, e0 = S.d0 + L * 0.16, e1 = S.d0 + L * 0.84, R = 40, H = 40;
      // la montagne : parois d'entrée et de sortie avec une grande ouverture, flancs, toit, masses rocheuses au-dessus
      for (const [dc, k] of [[e0, 0], [e1, 1]]) S.item(dc, (r) => { const fl = S.T.rel(dc); S.wall(dc, -150, 150, -30, 96, 7, 'concreteWarm', k ? '#8c7f66' : '#9a8d73', { lx: 0, yc: H / 2 - 4, w: 52, h: H }); S.bx(dc, 0, H + 1, 56, 1.6, 8, 'col:#5a4a38', undefined, false); });
      for (let dc = e0; dc < e1; dc += 14) S.item(dc + 7, (r) => { const m = dc + 7, fl = S.T.rel(m); for (const s of [-1, 1]) S.bx(m, s * (R + 6), 36 - fl, 12, 112, 14.8, 'concreteWarm', pk(r, SAND)); S.bx(m, 0, H + 6 - fl, 2 * R + 24, 12, 14.8, 'concreteWarm', pk(r, SAND)); });
      S.item((e0 + e1) / 2, (r) => { for (const [x, s] of [[-60, 150], [50, 170], [0, 190]]) S.ball((e0 + e1) / 2 + x * 0.8, x * 0.6, H + 12, s, 'col:' + pk(r, ['#7d7a6a', '#7a7866', '#82806e']), undefined, false, 0.42); });
      for (let dc = e0 + 6; dc < e1 - 6; dc += 10) S.item(dc, (r) => { const fl = S.T.rel(dc); for (const s of [-1, 1]) for (const y of [0, 13, 27]) boulder(S, dc + r.between([-3, 3]), s * (R - 3 + r.between([-2, 3])), y - fl + 1, r.between([11, 17]), r, pk(r, SAND)); });
      // stalactites, stalagmites, piliers
      S.rows(e0 + 14, e1 - 14, 9, 0.95, (dc) => S.item(dc, (r) => { const lx = r.between([-R + 6, R - 6]); if (Math.abs(lx - S.lane(dc).lx) < 11) return; const h = r.between([4, 12]); S.cyl(dc, lx, H - h, 0.25, h, 'concreteWarm', '#8a8070', 7, r.between([1, 2.4]), true); }));
      S.rows(e0 + 14, e1 - 14, 12, 0.95, (dc) => S.item(dc, (r) => { const lx = r.between([-R + 6, R - 6]); if (Math.abs(lx - S.lane(dc).lx) < 11) return; const h = r.between([3, 9]); S.cyl(dc, lx, 0, r.between([1, 2.4]), h, 'concreteWarm', '#7a7060', 7, 0.25, true); }));
      for (let dc = e0 + 40; dc < e1 - 30; dc += 52) S.item(dc, (r) => { const lx = (r() < 0.5 ? -1 : 1) * r.between([14, 26]); S.cyl(dc, lx, 0, 3.4, H, 'concreteWarm', '#8e8472', 9, 3.0, true); });
      // rails de mine, lampes, cadres de soutien en bois
      for (let dc = e0 + 4; dc < e1 - 4; dc += 12) S.item(dc + 6, () => { const m = dc + 6; for (const s of [-1, 1]) S.bx(m, S.lane(m).lx + s * 2.4, 0.22, 0.3, 0.3, 12.4, 'metal', '#6a6e74', false); S.bx(m, S.lane(m).lx, 0.1, 6.4, 0.2, 1.2, 'planks', '#6a5238', false); });
      for (let dc = e0 + 10; dc < e1 - 10; dc += 24) S.item(dc, () => { for (const s of [-1, 1]) { S.bx(dc, s * (R - 1.2), 8, 0.6, 0.6, 0.6, 'emis:#ffcf8a', undefined, false); S.bx(dc, s * (R - 0.9), 4, 0.25, 8, 0.25, 'col:#2a2a2a', undefined, false); } });
      for (let dc = e0 + 30; dc < e1 - 30; dc += 70) S.item(dc, () => S.frame(dc, 0, 18, 46, 34, 54, 38, 1.4, 'planks', '#7a5e40'));
      foe(S, 'truck', e0 + 70, -4, 0, { name: 'CAMION', path: 90, speed: 13 });
      foe(S, 'tank', (e0 + e1) / 2, 4, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'apc', e1 - 40, -10, 0, { name: 'TRANSPORT', armed: true });
    } };

  // ===== FALAISE : un plateau, un fleuve qui tombe, 110 m de chute libre vers un cirque de roche, puis la remontée en rase-mottes
  D.scenes.falaise = { len: [580, 580], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 18, from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { const A = 104; sc.A = A; return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -A * ss(0.2, 0.2 + 56 / 580, u) * (1 - ss(0.52, 0.97, u)); }); },
    build(S) {
      const A = S.sc.A, L = S.len, dE = S.d0 + L * 0.2, half = 62;
      cliffs(S, half, -A - 10, 40, S.d0 + L * 0.2 + 30, S.d1 - 6, 15); cliffRocks(S, half, -A - 10, 40, S.d0 + L * 0.2 + 30, S.d1 - 6, 14);
      // le plateau : le fleuve qui s'écoule jusqu'au bord et tombe en nappe
      S.item(dE + 24, () => { const dc = dE + 24, fl = S.T.rel(dc); S.bx(dc, 0, (-A + 8) / 2 - fl + 1, 34, A, 1.2, 'waterSurf', '#f4fbff', false, { shadow: false }); S.bx(dc + 3, 0, -A + 1.8 - fl, 40, 3.4, 8, 'basic:#eef6f8', undefined, false, { shadow: false }); });
      S.rows(S.d0, dE, 9, 0.9, (dc) => S.item(dc, (r) => { const sg = r() < 0.5 ? -1 : 1; plant(S, dc, S.lane(dc).lx + sg * r.between([24, 64]), r); }));
      // ruines d'un fort au bord (murs et tour), des pylônes
      S.item(dE - 40, (r) => { for (const s of [-1, 1]) { S.bx(dE - 40, s * 30, 5, 3, 10, 26, 'brick', '#a08870'); S.bx(dE - 28, s * 30, 9, 8, 18, 8, 'brick', '#9a8268'); } S.bx(dE - 40, 0, 12, 60, 1.6, 3, 'brick', '#a08870', true); });
      // le cirque en contrebas : flèches rocheuses, gros blocs, arbres rabougris
      S.rows(dE + 70, S.d1 - 20, 21, 0.9, (dc) => S.item(dc, (r) => { const sg = r() < 0.5 ? -1 : 1, lx = S.lane(dc).lx + sg * r.between([20, half - 6]), s = r.between([5, 11]); if (r() < 0.5) boulder(S, dc, lx, 0, s, r); else { S.cyl(dc, lx, 0, s * 0.7, s * 3.4, 'concreteWarm', pk(r, SAND), 8, s * 0.3, true); } }));
      S.rows(dE + 90, S.d1 - 20, 15, 0.9, (dc) => S.item(dc, (r) => { const sg = r() < 0.5 ? -1 : 1; plant(S, dc, S.lane(dc).lx + sg * r.between([22, half - 6]), r, { h: r.between([10, 18]), conif: r() < 0.4 }); }));
      foe(S, 'sam', S.d0 + L * 0.1, -36, 0, { name: 'LANCE-MISSILES', armed: true });
      foe(S, 'heli', dE + 70, 0, 22, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -34, y), SS.at(dc + 30, 0, y + 10), SS.at(dc, 34, y), SS.at(dc - 30, 0, y + 10)], speed: 12 });
      foe(S, 'rocketTruck', S.d0 + L * 0.52, 14, 0, { name: 'LANCE-ROQUETTES', armed: true });
      foe(S, 'tank', S.d0 + L * 0.78, -12, 0, { name: 'BLINDE', hp: 3, armed: false });
    } };

  // ===== ENTREPOTS : zone industrielle sur un plateau — halls qu'on traverse, parc à conteneurs et grues, toits à survoler, tuyaux à passer dessus ou dessous
  const HALL = (S, dc, len, hw, hh, tint, roofT) => S.item(dc, (r) => {
    for (const s of [-1, 1]) S.bx(dc, s * (hw + 0.6), hh / 2, 1.2, hh, len, 'corrugated', tint);
    for (const e of [-1, 1]) { const d2 = dc + e * len / 2; S.wall(d2, -hw - 1.2, hw + 1.2, 0, hh + 1.5, 1.4, 'corrugated', tint, { lx: 0, yc: 10, w: 40, h: 20 }); }
    S.bx(dc, 0, hh + 0.5, 2 * hw + 3.6, 1, len + 2, 'corrugated', roofT);
    for (let k = -len / 2 + 8; k < len / 2; k += 14) { S.bx(dc + k, 0, hh - 0.4, 2 * hw, 0.4, 0.4, 'metal', '#7a7e84', false); S.bx(dc + k, 0, hh + 1.1, 12, 0.2, 5, 'emis:#e8f0e8', undefined, false); for (const s of [-1, 1]) { S.bx(dc + k, s * (hw - 3), 3, 3, 6, 9, 'col:#5a5e66'); S.bx(dc + k, s * (hw - 3), 6.4, 3.2, 0.5, 9.2, 'col:#8a6a3a', undefined, false); } }
  });
  const concrete = (d, lx, c, sc, w) => { const k = ss(sc.d0 - 6, sc.d0 + 30, d) * (1 - ss(sc.d1 - 30, sc.d1 + 6, d)) * (1 - ss(w, w + 26, Math.abs(lx))); if (k > 0) c.lerp(new THREE.Color('#7d7f7c'), k * 0.95); };
  D.scenes.entrepots = { len: [760, 760], noDoor: true, noChaos: true, ground: (d, lx, c, sc) => concrete(d, lx, c, sc, 90),
    pin: (T, sc) => ({ lx: 0, y: 12, from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return 28 * ss(0.16, 0.42, u) * (1 - ss(0.76, 0.97, u)); }); },
    build(S) {
      const L = S.len;
      HALL(S, S.d0 + 90, 100, 36, 26, '#8d9686', '#7a5446');
      // parc à conteneurs de chaque côté, avec une grue portique qui enjambe la trajectoire
      const cc = ['#8a4a3c', '#3c5a7a', '#6a7a4a', '#9a8a4a', '#7a7a76', '#5a4a6a'];
      for (const sg of [-1, 1]) S.rows(S.d0 + 230, S.d0 + 520, 15, 0.7, (dc) => S.item(dc, (r) => { const lx = sg * r.between([34, 74]), n = 1 + Math.floor(r() * 4); S.place(dc, lx, 14, 13, 0, n * 2.7, () => { for (let i = 0; i < n; i++) S.bx(dc, lx, 1.35 + i * 2.7, 12, 2.6, 2.5, 'metal', pk(r, cc)); }); }));
      for (const dc of [S.d0 + 300, S.d0 + 470]) S.item(dc, () => { for (const x of [-34, 34]) { S.bx(dc, x, 17, 2.4, 34, 2.4, 'col:#c8a028'); S.bx(dc + 6, x, 17, 1.4, 34, 1.4, 'col:#c8a028'); } S.bx(dc + 3, 0, 34.6, 74, 2.2, 5.5, 'col:#c8a028'); S.bx(dc + 3, 0, 33.2, 74, 0.5, 6, 'hazard', undefined, false); S.bx(dc + 3, 6, 28, 0.2, 12, 0.2, 'col:#222', undefined, false); S.bx(dc + 3, 6, 21, 3, 2.4, 3, 'col:#8a3a2a'); });
      // toits : bâtiments plats à différentes hauteurs en bordure de trajectoire (on les survole en montant en diagonale)
      for (const sg of [-1, 1]) S.rows(S.d0 + 520, S.d1 - 30, 38, 0.6, (dc) => S.item(dc, (r) => { const lx = sg * r.between([34, 70]), h = r.between([8, 26]), w = r.between([18, 30]), dd = r.between([22, 34]); S.place(dc, lx, w, dd, 0, h + 8, () => { S.bx(dc, lx, h / 2, w, h, dd, 'corrugated', pk(r, ['#8d9686', '#938f84', '#8a8e92'])); roofLine(S, dc, lx, w + 1, dd + 1, h + 0.5, pk(r, RUST)); S.cyl(dc, lx + w * 0.25, h + 1, 0.9, 6, 'metal', '#8e9298', 8, 0.7, false); S.bx(dc, lx - w * 0.2, h + 2.2, 3, 2.4, 3, 'col:#7a8288'); }); }));
      // tuyaux et passerelles en travers (on passe dessus ou dessous)
      for (const [dc, y] of [[S.d0 + 200, 20], [S.d0 + 420, 12], [S.d0 + 600, 34]]) S.item(dc, () => { const fl = S.T.rel(dc); S.bx(dc, 0, y, 150, 1.6, 1.6, 'metal', '#9a9a96', true); S.bx(dc + 1.6, 0, y - 1.4, 150, 0.7, 0.7, 'col:#8a3a2a', undefined, false); for (const x of [-50, 50]) S.bx(dc, x, y / 2 - 0.5, 1.6, y, 1.6, 'metal', '#8e9298'); });
      // silos
      S.item(S.d0 + 380, () => { for (let i = 0; i < 4; i++) S.cyl(S.d0 + 380 + (i % 2) * 22, -60 - Math.floor(i / 2) * 20, 0, 7.5, 32, 'col:#b8b8b0', undefined, 14, 7.5, true); });
      foe(S, 'tank', S.d0 + 90, 4, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'truck', S.d0 + 190, -8, 0, { name: 'CAMION', path: 150, speed: 16 });
      foe(S, 'heli', S.d0 + 380, 0, 44, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -44, y), SS.at(dc + 26, 0, y + 6), SS.at(dc, 44, y), SS.at(dc - 26, 0, y + 6)], speed: 13 });
      foe(S, 'sam', S.d0 + 560, 38, -fl0(S, S.d0 + 560) + 18, { name: 'LANCE-MISSILES', armed: true });
      foe(S, 'aaturret', S.d0 + 680, -30, 6, { name: 'TOURELLE', armed: true });
    } };

  // ===== BASE : le dernier tronçon avant le boss — clôture, miradors, réservoirs, bunkers, radars, la piste qui mène à l'aérodrome
  D.scenes.base = { len: [560, 560], noDoor: true, noChaos: true, ground: (d, lx, c, sc) => concrete(d, lx, c, sc, 56),
    pin: (T, sc) => ({ lx: 0, y: 14, from: 24, to: sc.d1 - sc.d0 - 24 }),
    build(S) {
      const L = S.len;
      for (let dc = S.d0; dc < S.d1; dc += 40) S.item(dc + 20, () => { S.bx(dc + 20, 0, 0.12, 1.2, 0.05, 20, 'col:#e0dcc8', undefined, false, { shadow: false }); for (const s of [-1, 1]) S.bx(dc + 20, s * 22, 0.12, 0.6, 0.05, 40, 'col:#e0dcc8', undefined, false, { shadow: false }); });
      for (const s of [-1, 1]) S.rows(S.d0, S.d1, 6, 0.4, (dc) => S.item(dc, () => { S.bx(dc, s * 62, 2.6, 0.2, 5.2, 6, 'metal', '#8e9298', false, { shadow: false }); if (Math.round(dc / 6) % 4 === 0) S.bx(dc, s * 62, 2.8, 0.5, 5.6, 0.5, 'concrete', '#a8a8a4'); }));
      for (const s of [-1, 1]) for (const f of [0.18, 0.5, 0.82]) { const dc = S.d0 + L * f; S.item(dc, () => { for (const a of [-1, 1]) for (const b of [-1, 1]) S.bx(dc + b * 2, s * 70 + a * 2, 9, 0.7, 18, 0.7, 'col:#6a6e66'); S.bx(dc, s * 70, 18.6, 7.5, 3.6, 7.5, 'col:#7a7e74'); S.bx(dc, s * 70, 20.8, 8.4, 0.7, 8.4, 'col:#5a5e56', undefined, false); }); }
      for (const f of [0.2, 0.42, 0.66]) { const dc = S.d0 + L * f; S.item(dc, () => { for (let i = 0; i < 3; i++) S.cyl(dc + i * 22 - 22, -84, 0, 9, 11, 'col:#b4b4ac', undefined, 16, 9, true); }); }
      for (const f of [0.3, 0.6]) S.item(S.d0 + L * f, (r) => K.hangar(S, S.d0 + L * f, 80, r));
      S.item(S.d0 + L * 0.46, (r) => K.radome(S, S.d0 + L * 0.46, -64)); S.item(S.d0 + L * 0.86, (r) => K.radome(S, S.d0 + L * 0.86, 62));
      for (let dc = S.d0 + 40; dc < S.d1 - 30; dc += 50) S.item(dc, (r) => { const sg = r() < 0.5 ? -1 : 1, lx = sg * r.between([32, 54]); S.bx(dc, lx, 1.3, 12, 2.6, 5, 'col:#6a7060'); S.ball(dc, lx, 2.6, 8, 'col:#6d8450', undefined, false, 0.35); });
      foe(S, 'aaturret', S.d0 + 110, -26, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'ifv', S.d0 + 200, 4, 0, { name: 'BLINDE', hp: 3, armed: false, path: 130, speed: 14 });
      foe(S, 'radar', S.d0 + 320, 30, 0, { name: 'RADAR' });
      foe(S, 'aagun', S.d0 + 410, -22, 0, { name: 'CANON ANTIAERIEN', armed: true });
      foe(S, 'jet', S.d0 + 470, 0, 22, { name: 'CHASSEUR', path: 100, speed: 28 });
    } };
})();
