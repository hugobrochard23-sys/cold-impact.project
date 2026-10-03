/* v096 : QUATRE NOUVELLES ZONES — CANYON ROUGE, BANQUISE, PARC EOLIEN, PORTE-AVIONS.
 * Elles n'apparaissent qu'en mode NIVEAUX (voir levelmode.js : niveaux 12, 17, 22, 27, puis tous les 20 niveaux pour chacune).
 *   CANYON   — parois de grès rouge, pitons rocheux (hoodoos), arches naturelles, ponts de roche, camp militaire, dunes. SIGNATURE : la Grande Arche de grès.
 *   BANQUISE — falaises de glace, icebergs, ponts de glace à stalactites, base polaire, brise-glace pris dans la glace. SIGNATURE : la cathédrale de glace.
 *   EOLIEN   — mer ouverte, champs d'éoliennes (pales figées), plateformes de transformation, cargos de service, bouées. SIGNATURE : le portique de la sous-station.
 *   CARRIER  — un pont d'envol de 64 m, avions parqués, îlot de commandement, tracteurs et caisses, escorte de frégates. SIGNATURE : la baie du hangar.
 * Tout est statique (pas d'éléments mobiles) et construit avec les briques de zones.js (S.bx, S.cyl, S.place, S.frame…). */
(function () {
  const U = CC.U, G = CC.Gen, Z = CC.Zones, DEG = 180 / Math.PI;
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // ---------- profils, ambiances, sol ----------
  Z.PROFILE.canyon = { elev: 0, vol: 34, y: [6, 34], amp: 1.1 };
  Z.PROFILE.banquise = { elev: 0, vol: 40, y: [6, 36], amp: 1.0 };
  Z.PROFILE.eolien = { elev: 0, vol: 60, y: [8, 44], amp: 1.15 };
  Z.PROFILE.carrier = { elev: 0, vol: 34, y: [6, 36], amp: 0.7 };
  Z.meta.canyon = { label: 'CANYON ROUGE', envs: ['sandStorm', 'goldenHour', 'emberSky', 'day'], ground: 'sand', groundTint: '#d08048', wall: () => ({ mat: { side: 'rock', top: 'sand' }, tint: '#b8603a' }), obstacle: 'rock', obstacleTint: '#a85a34' };
  Z.meta.banquise = { label: 'BANQUISE', envs: ['iceDay', 'mistMorning', 'twilight', 'day'], ground: 'white', groundTint: '#d8ecff', wall: () => ({ mat: { side: 'white', top: 'white' }, tint: '#bcd8f4' }), obstacle: 'white', obstacleTint: '#cfe6ff' };
  Z.meta.eolien = { label: 'PARC EOLIEN', envs: ['day', 'goldenHour', 'mistMorning', 'overcast'], ground: 'water', groundTint: '#ffffff', wall: () => ({ mat: { side: 'metal', top: 'metal' }, tint: '#d8dce0' }), obstacle: 'metal', obstacleTint: '#e0e4e8' };
  Z.meta.carrier = { label: 'PORTE-AVIONS', envs: ['day', 'harborDusk', 'overcast', 'goldenHour'], ground: 'concreteDark', groundTint: '#7c828a', wall: () => ({ mat: { side: 'metal', top: 'metal' }, tint: '#9aa0a8' }), obstacle: 'metal', obstacleTint: '#9aa0a8' };

  // murs continus de chaque côté (visuel + obstacle) ; face intérieure à vol + off
  function sideWalls(S, o) {
    for (const s of [-1, 1]) for (let dc = S.d0; dc < S.d1; dc += 20) S.item(dc + 10, (r) => {
      const m = dc + 10, v = S.vol(m), hr = U.makeRng(Math.floor(m / 20) * 313 + (s > 0 ? 7 : 3)), h = o.h[0] + hr() * (o.h[1] - o.h[0]), set = hr() * o.jit, w = 28;
      S.bx(m, s * (v + o.off + set + w / 2), h / 2 - 2, w, h, 20.6, o.mat, o.tints[Math.floor(hr() * o.tints.length)]);
      if (o.strata && hr() < 0.6) S.bx(m, s * (v + o.off + set - 0.2), 5 + hr() * (h - 10), 0.8, 2 + hr() * 2, 20.4, 'col:' + o.strata, undefined, false);
    });
  }
  // grandes formes lointaines (mesas, montagnes de glace…) : visuel seul
  function farShapes(S, o) {
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, o.step, 0.5, (dc) => S.item(dc, (r) => {
      const off = o.off[0] + r() * (o.off[1] - o.off[0]), w = r.between(o.w), h = r.between(o.h);
      S.bx(dc, s * (S.vol(dc) + off), h / 2 - 3, w, h, r.between(o.d), o.mat, pick(r, o.tints), false, { shadow: false });
    }));
  }
  function arch(S, dc, hw, hh, dd, mat, tints, extraTop) {
    S.item(dc, (r) => {
      const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 14) + 2 * Math.abs(L.lx), top = L.y + hh / 2 + (extraTop || 18) + r() * 10, t = pick(r, tints);
      S.frame(dc, L.lx, L.y, 2 * hw, hh, tot, top, dd, mat, t);
      S.bx(dc, L.lx, top + 3, 2 * hw + 16, 6, dd * 0.8, mat, pick(r, tints));          // couronne
      S.gate(dc, L.lx, L.y);
    });
    S.reserve(dc, 0, 2 * S.vol(dc), dd + 6);
  }
  function span(S, dc, gap, thick, mat, tints) {    // pont naturel / de glace : une dalle au-dessus du couloir
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), y0 = L.y + gap + r() * 8; S.bx(dc, 0, y0 + thick / 2, 2 * (v + 14), thick, 16 + r() * 12, mat, pick(r, tints)); S.gate(dc, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 24);
  }

  // =============================================================== CANYON
  const RED = ['#b8603a', '#a85a34', '#c8703e', '#9a5030', '#d08044'], SAND = ['#d8a868', '#c89858', '#e0b878'];
  function pillar(S, dc, lx, w, h, r) {
    const t = pick(r, RED);
    S.bx(dc, lx, h * 0.3, w, h * 0.6, w, 'rock', t); S.bx(dc, lx, h * 0.72, w * 0.72, h * 0.44, w * 0.72, 'rock', pick(r, RED)); S.bx(dc, lx, h + 1.4, w * 1.22, 2.8, w * 1.22, 'rock', pick(r, RED));
    S.bx(dc, lx, h * 0.45, w + 0.3, 1.2, w + 0.3, 'col:#e8b070', undefined, false);
  }
  function tent(S, dc, lx, r) {
    S.place(dc, lx, 9, 11, 0, 5, () => { const c = pick(r, ['#6a7a4a', '#7a8a56', '#8a7a52']); S.bx(dc, lx, 1.6, 7, 3.2, 9, 'corrugated', c); S.bx(dc, lx, 3.8, 5.6, 1.6, 8.6, 'corrugated', c); S.bx(dc, lx, 4.9, 3, 0.8, 8.2, 'corrugated', c); });
  }
  function drums(S, dc, lx, r) { S.place(dc, lx, 5, 4, 0, 2.4, () => { for (let i = 0; i < 4; i++) S.cyl(dc, lx + (i % 2) * 1.5 - 0.7, i < 2 ? 0 : 0, 0.7, 1.9, 'col:' + pick(r, ['#c03a2a', '#2a6ab8', '#6a7a4a']), undefined, 8, 0.7); }); }
  function mast(S, dc, lx, r) { S.place(dc, lx, 4, 4, 0, 22, () => { S.cyl(dc, lx, 0, 0.35, 22, 'metal', '#c8ccd0', 6, 0.2); S.bx(dc, lx, 18, 5, 0.4, 0.4, 'metal', '#c8ccd0', false); S.bx(dc, lx + 1.6, 15, 3.4, 3.4, 0.4, 'col:#d8d8d0', undefined, false); }); }
  function truckBlock(S, dc, lx, r) { S.place(dc, lx, 5, 12, 0, 4.2, () => { const c = pick(r, ['#6a7a4a', '#8a7a52']); S.bx(dc, lx, 1.5, 3.2, 1.6, 10, 'metal', c); S.bx(dc, lx, 3.1, 3.4, 2.2, 3.4, 'metal', c, true, {}); S.bx(dc, lx, 0.55, 3.4, 0.7, 11, 'col:#2a2c30', undefined, false); S.bx(dc, lx, 3.6, 3.0, 1.0, 0.2, 'col:#9ad0e8', undefined, false); }); }
  function sandbags(S, dc, lx, r) { S.place(dc, lx, 10, 3, 0, 2, () => { for (let i = 0; i < 4; i++) S.bx(dc, lx - 4 + i * 2.6, 0.6, 2.6, 1.2, 1.6, 'sand', '#c8b078'); for (let i = 0; i < 3; i++) S.bx(dc, lx - 2.6 + i * 2.6, 1.7, 2.6, 1, 1.5, 'sand', '#d0b880'); }); }

  const canyon = { signature: 'grandarche', scenes: {}, dress(S) {
    sideWalls(S, { mat: 'rock', tints: RED, h: [44, 118], off: 11, jit: 6, strata: 'e8b070' });
    farShapes(S, { step: 64, off: [40, 140], w: [60, 140], h: [50, 130], d: [50, 120], mat: 'rock', tints: ['#c8703e', '#b8603a', '#d08a50'] });
    if (S.sc.name !== 'grandarche') S.rows(S.d0, S.d1, 22, 0.8, (dc) => S.item(dc, (r) => { const lx = (r() * 2 - 1) * (S.vol(dc) - 1); const w = r.between([0.8, 2.2]); S.place(dc, lx, w + 1, w + 1, 0, 1.4, () => S.bx(dc, lx, w * 0.35, w, w * 0.7, w * 1.1, 'rock', pick(r, SAND), false, { r: [0, S.yaw(dc) + r() * 80, 0] })); }));
  } };
  Z.defs.canyon = canyon;
  canyon.scenes.hoodoos = { len: [260, 340], build(S) { const n = Math.round(S.len / 15); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 2), w = S.sr.between([5, 11]), h = S.sr.between([14, 46]); S.place(dc, lx, w + 4, w + 4, 0, h + 4, (r) => pillar(S, dc, lx, w, h, r)); } } };
  canyon.scenes.arches = { len: [250, 320], build(S) { const n = S.len > 290 ? 3 : 2, e = S.T.ease === undefined ? 1 : S.T.ease; for (let i = 0; i < n; i++) arch(S, S.d0 + S.len * (i + 1) / (n + 1), U.lerp(34, 22, e), U.lerp(40, 28, e), 12, 'rock', RED); } };
  canyon.scenes.pontsRoche = { len: [240, 320], build(S) { const n = Math.floor(S.len / 80); for (let i = 0; i < n; i++) span(S, S.d0 + 40 + i * (S.len - 80) / Math.max(1, n - 1), 22, 9, 'rock', RED); const m = Math.round(S.len / 40); for (let i = 0; i < m; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3), w = S.sr.between([5, 9]), h = S.sr.between([10, 22]); S.place(dc, lx, w + 3, w + 3, 0, h + 3, (r) => pillar(S, dc, lx, w, h, r)); } } };
  canyon.scenes.slalomRoche = { len: [240, 320], build(S) { for (let i = 0, dc = S.d0 + 22; dc < S.d1 - 22; i++, dc += 26) { const side = i % 2 ? 1 : -1, lx = side * S.vol(dc) * 0.42, w = S.sr.between([14, 20]), h = S.sr.between([34, 60]); S.place(dc, lx, w, 14, 0, h, (r) => { S.bx(dc, lx, h / 2, w, h, 14, 'rock', pick(r, RED)); S.bx(dc, lx, h * 0.55, w + 0.4, 1.4, 14.4, 'col:#e8b070', undefined, false); }); } } };
  canyon.scenes.camp = { len: [220, 300], build(S) { const v = (f) => S.vol(f); const n = Math.round(S.len / 11); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (v(dc) - 3), k = Math.floor(S.sr() * 6); S.item(dc, (r) => [tent, drums, mast, truckBlock, sandbags, tent][k](S, dc, lx, r)); } } };
  canyon.scenes.dunes = { len: [220, 300], build(S) { const n = Math.round(S.len / 11); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 2), w = S.sr.between([10, 24]), h = S.sr.between([2.5, 7]); S.place(dc, lx, w, w * 1.2, 0, h, (r) => { S.bx(dc, lx, h / 2, w, h, w * 1.2, 'sand', pick(r, SAND), true, { r: [0, S.yaw(dc) + r.between([-30, 30]), 0] }); S.bx(dc, lx + w * 0.1, h * 0.85, w * 0.6, h * 0.5, w * 0.8, 'sand', pick(r, SAND), false, { r: [0, S.yaw(dc) + 20, 0] }); }); } } };
  canyon.scenes.grandarche = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 22) + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 64, 46, tot, L.y + 46, 26, 'rock', '#c8703e'); S.bx(dc, L.lx, L.y + 52, 78, 14, 24, 'rock', '#d08044'); S.bx(dc, L.lx - 30, L.y + 62, 14, 22, 18, 'rock', '#b8603a'); S.bx(dc, L.lx + 28, L.y + 60, 12, 18, 16, 'rock', '#a85a34'); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 34);
  } };

  // =============================================================== BANQUISE
  const ICE = ['#cfe6ff', '#bcd8f4', '#e4f2ff', '#a8c8e8'];
  function berg(S, dc, lx, w, h, r) {
    const t = pick(r, ICE), yaw = S.yaw(dc) + r.between([-20, 20]);
    S.bx(dc, lx, h * 0.28, w, h * 0.56, w * 0.9, 'white', t, true, { r: [0, yaw, 0] }); S.bx(dc, lx, h * 0.62, w * 0.7, h * 0.3, w * 0.62, 'white', pick(r, ICE), true, { r: [0, yaw + 14, 0] }); S.bx(dc, lx, h * 0.86, w * 0.4, h * 0.3, w * 0.36, 'white', '#e4f2ff', true, { r: [0, yaw + 28, 0] });
    S.bx(dc, lx, h * 0.12, w + 0.4, h * 0.2, w * 0.9 + 0.4, 'col:#6aa0d0', undefined, false, { r: [0, yaw, 0] });
  }
  function icicles(S, dc, lx, y, n, spread, r) { for (let i = 0; i < n; i++) { const h = r.between([3, 9]); S.cyl(dc, lx + (i / Math.max(1, n - 1) - 0.5) * spread, y - h, 0.12, h, 'white', '#e4f2ff', 6, r.between([0.6, 1.1]), false); } }
  function container(S, dc, lx, r) { S.place(dc, lx, 3, 7, 0, 5.4, () => { const c = pick(r, ['#d85a1a', '#2a6ab8', '#c8a020', '#8a2a2a']); S.bx(dc, lx, 1.3, 2.5, 2.6, 6.2, 'corrugated', c); if (r() < 0.5) S.bx(dc, lx, 3.9, 2.5, 2.6, 6.2, 'corrugated', pick(r, ['#d85a1a', '#2a6ab8', '#c8a020'])); }); }
  function radome(S, dc, lx) { S.place(dc, lx, 12, 12, 0, 14, () => { S.cyl(dc, lx, 0, 4.4, 4, 'concrete', '#d8d8d4', 12, 4.4); S.cyl(dc, lx, 4, 6, 3.4, 'col:#f4f4f2', undefined, 12, 5); S.cyl(dc, lx, 7.4, 5, 2.4, 'col:#f4f4f2', undefined, 12, 3); S.cyl(dc, lx, 9.8, 3, 1.6, 'col:#f4f4f2', undefined, 12, 1.2); }); }
  function tank(S, dc, lx, r) { S.place(dc, lx, 8, 8, 0, 7, () => { S.cyl(dc, lx, 0, 3.6, 6, 'metal', pick(r, ['#c8ccd0', '#d85a1a']), 14, 3.6); S.cyl(dc, lx, 6, 3.7, 0.5, 'metal', '#8a8e94', 14, 3.7, false); }); }
  function icebreaker(S, dc, lx, r) { S.place(dc, lx, 15, 56, 0, 24, () => { const y = S.yaw(dc); S.bx(dc, lx, 4, 13, 8, 46, 'metal', '#8a2a22', true, { r: [0, y, 0] }); S.bx(dc, lx, 8.4, 13.4, 1, 46.4, 'col:#1c1e22', undefined, false); S.bx(dc, lx, 12.4, 9, 8, 14, 'col:#f0f0ec', undefined, true, { r: [0, y, 0] }); S.bx(dc, lx, 18.6, 7, 4.4, 8, 'col:#f0f0ec', undefined, true, { r: [0, y, 0] }); S.bx(dc, lx, 19.6, 7.2, 1.2, 8.2, 'basic:#9ad0e8', undefined, false); S.cyl(dc, lx, 21, 0.4, 8, 'metal', '#c8ccd0', 6, 0.25); S.bx(dc, lx, 4, 4, 8, 12, 'metal', '#8a2a22', true, { r: [0, y + 16, 0] }); S.cyl(dc, lx, 10, 1.3, 5.4, 'col:#d8a020', undefined, 8, 1.1); }); }

  const banquise = { signature: 'cathedrale', scenes: {}, dress(S) {
    sideWalls(S, { mat: 'white', tints: ICE, h: [40, 100], off: 11, jit: 6 });
    farShapes(S, { step: 70, off: [40, 150], w: [50, 130], h: [50, 140], d: [50, 120], mat: 'white', tints: ['#e4f2ff', '#cfe6ff', '#bcd8f4'] });
    S.rows(S.d0, S.d1, 18, 0.9, (dc) => S.item(dc, (r) => { const lx = (r() * 2 - 1) * (S.vol(dc) - 2), w = r.between([3, 8]); S.bx(dc, lx, 0.1, w, 0.2, w * 1.4, 'col:#a8c8e8', undefined, false, { shadow: false, r: [0, S.yaw(dc) + r() * 90, 0] }); }));   // plaques de glace plus sombres
  } };
  Z.defs.banquise = banquise;
  banquise.scenes.icebergs = { len: [260, 340], build(S) { const n = Math.round(S.len / 14); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3), w = S.sr.between([6, 14]), h = S.sr.between([14, 44]); S.place(dc, lx, w + 3, w + 3, 0, h + 3, (r) => berg(S, dc, lx, w, h, r)); } } };
  banquise.scenes.pontsGlace = { len: [240, 320], build(S) { const n = Math.floor(S.len / 80); for (let i = 0; i < n; i++) { const dc = S.d0 + 40 + i * (S.len - 80) / Math.max(1, n - 1); span(S, dc, 20, 8, 'white', ICE); S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); icicles(S, dc, L.lx - v * 0.5, L.y + 22, 8, v * 0.8, r); icicles(S, dc, L.lx + v * 0.5, L.y + 22, 8, v * 0.8, r); }); } } };
  banquise.scenes.crevasses = { len: [240, 320], build(S) { for (let i = 0, dc = S.d0 + 22; dc < S.d1 - 22; i++, dc += 24) { const side = i % 2 ? 1 : -1, lx = side * S.vol(dc) * 0.4, w = S.sr.between([12, 18]), h = S.sr.between([20, 40]); S.place(dc, lx, w, 8, 0, h, (r) => { S.bx(dc, lx, h / 2, w, h, 8, 'white', pick(r, ICE)); S.bx(dc, lx, h + 1, w * 0.6, 2.4, 6, 'white', '#e4f2ff', true); }); } } };
  banquise.scenes.base = { len: [220, 300], build(S) { const n = Math.round(S.len / 12); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4), k = Math.floor(S.sr() * 5); S.item(dc, (r) => [container, container, radome, tank, container][k](S, dc, lx, r)); } for (const dc of [S.d0 + S.len * 0.3, S.d0 + S.len * 0.7]) S.item(dc, (r) => { const lx = (r() < 0.5 ? -1 : 1) * (S.vol(dc) - 12); mast(S, dc, lx, r); }); } };
  banquise.scenes.floes = { len: [220, 300], build(S) { const n = Math.round(S.len / 12); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 2), w = S.sr.between([8, 20]), h = S.sr.between([1.5, 4]); S.place(dc, lx, w, w, 0, h, (r) => S.bx(dc, lx, h / 2, w, h, w * 0.9, 'white', pick(r, ICE), true, { r: [0, S.yaw(dc) + r.between([-30, 30]), 0] })); } S.item(S.d0 + S.len * 0.55, (r) => { const dc = S.d0 + S.len * 0.55, lx = (r() < 0.5 ? -1 : 1) * (S.vol(dc) - 18); icebreaker(S, dc, lx, r); }); } };
  banquise.scenes.cathedrale = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 22) + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 60, 44, tot, L.y + 54, 26, 'white', '#cfe6ff'); S.bx(dc, L.lx, L.y + 58, 74, 10, 24, 'white', '#e4f2ff'); for (const s of [-1, 1]) for (let k = 0; k < 3; k++) berg(S, dc + (k - 1) * 4, L.lx + s * (46 + k * 8), 10 + k * 2, 50 + k * 10, r); icicles(S, dc, L.lx, L.y + 22, 14, 56, r); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 34);
  } };

  // =============================================================== PARC EOLIEN
  function turbine(S, dc, lx, hub, collideBlades, r) {
    const base = pick(r, ['#f0f0ec', '#e8ecf0', '#dde2e6']);
    S.cyl(dc, lx, 0, 3.1, hub, 'metal', base, 14, 1.7);
    S.cyl(dc, lx, 0, 4.4, 5, 'col:#e8c020', undefined, 14, 3.6, false);               // pied jaune
    S.bx(dc, lx, hub + 1.5, 4.4, 4.4, 11, 'metal', base);                                 // nacelle
    S.cyl(dc, lx, hub - 0.6, 2.2, 3, 'metal', base, 10, 1.4, false);
    const a0 = r() * 2 * Math.PI / 3, L = 36 + r() * 6;
    for (let k = 0; k < 3; k++) { const a = a0 + k * 2 * Math.PI / 3, off = 2.2 + L / 2; S.bxr(dc, lx + Math.sin(a) * off, hub + 1.5 + Math.cos(a) * off, 2.2 - (k % 2) * 0.2, L, 0.5, 'metal', '#f4f4f2', -a * DEG, 0, collideBlades); }
    S.cyl(dc, lx, hub + 1.5 - 0.1, 2, 2.4, 'col:#c8ccd0', undefined, 10, 1.2, false);
  }
  function platform(S, dc, lx, r) {
    S.place(dc, lx, 32, 32, 0, 36, () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.cyl(dc, lx + sx * 11, -3, 1.3, 19, 'metal', '#8a8e94', 8, 1.1);
      S.bx(dc, lx, 17, 26, 3, 26, 'metal', '#c8ccd0'); S.bx(dc, lx - 4, 21, 10, 5, 12, 'col:#e8e8e4', undefined, true); S.bx(dc, lx - 4, 24.2, 10.4, 1.4, 12.4, 'col:#d85a1a', undefined, false);
      S.cyl(dc, lx + 6, 18.5, 4.4, 0.4, 'col:#c8a020', undefined, 16, 4.4, false); S.cyl(dc, lx + 6, 18.9, 2.6, 0.2, 'basic:#ffffff', undefined, 12, 2.6, false);
      S.cyl(dc, lx - 9, 18.5, 0.5, 14, 'metal', '#d85a1a', 6, 0.4); S.bx(dc, lx - 9, 31, 9, 0.6, 0.6, 'metal', '#d85a1a', false);
    });
  }
  function vessel(S, dc, lx, r) {
    S.place(dc, lx, 10, 34, 0, 12, () => { const y = S.yaw(dc) + r.between([-10, 10]), c = pick(r, ['#2a5a8a', '#c85a1a', '#2a6a4a']);
      S.bx(dc, lx, -1, 8, 4.4, 30, 'metal', c, true, { r: [0, y, 0] }); S.bx(dc, lx, 2.2, 8.2, 0.8, 30.2, 'col:#e8e8e4', undefined, false, { r: [0, y, 0] }); S.bx(dc, lx, 4.6, 6, 4, 9, 'col:#f0f0ec', undefined, true, { r: [0, y, 0] }); S.bx(dc, lx, 7.4, 5, 2, 6, 'col:#f0f0ec', undefined, true, { r: [0, y, 0] }); S.cyl(dc, lx, 8, 0.25, 5, 'metal', '#c8ccd0', 6, 0.15); }); }
  function buoy(S, dc, lx, col) { S.cyl(dc, lx, -2, 0.9, 3.6, 'col:' + col, undefined, 8, 0.6, false); S.cyl(dc, lx, 1.5, 0.15, 3, 'metal', '#c8ccd0', 6, 0.1, false); S.bx(dc, lx, 4.8, 0.7, 0.7, 0.7, 'basic:' + col, undefined, false); }

  const eolien = { signature: 'portique', scenes: {}, dress(S) {
    // éoliennes lointaines (silhouettes) des deux côtés
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 90, 0.5, (dc) => S.item(dc, (r) => { const lx = s * (S.vol(dc) + r.between([70, 190])), hub = r.between([60, 90]); S.cyl(dc, lx, 0, 3, hub, 'basic:#e4e8ec', undefined, 8, 1.6, false); for (let k = 0; k < 3; k++) { const a = r() * 6.28 + k * 2.094, L = 36; S.bxr(dc, lx + Math.sin(a) * (L / 2 + 2), hub + 1.5 + Math.cos(a) * (L / 2 + 2), 2.2, L, 0.5, 'basic:#f4f4f2', undefined, -a * DEG, 0, false); } }));
    // bouées de balisage de part et d'autre du couloir
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 46, 0.2, (dc) => S.item(dc, () => buoy(S, dc, s * (S.vol(dc) - 2), s > 0 ? '#2ac060' : '#e03a2a')));
  } };
  Z.defs.eolien = eolien;
  eolien.scenes.champ = { len: [260, 340], build(S) { const n = Math.round(S.len / 40); for (let i = 0; i < n; i++) { const dc = S.d0 + 20 + S.sr() * (S.len - 40), lx = (S.sr() < 0.5 ? -1 : 1) * S.sr.between([30, S.vol(dc) + 30]), hub = S.sr.between([56, 84]); S.place(dc, lx, 84, 14, 0, hub + 44, (r) => turbine(S, dc, lx, hub, true, r), { over: 60 }); } } };
  eolien.scenes.plateformes = { len: [240, 320], build(S) { const n = Math.round(S.len / 70); for (let i = 0; i < n; i++) { const dc = S.d0 + 30 + (i + S.sr() * 0.6) * (S.len - 60) / n, lx = (i % 2 ? 1 : -1) * S.sr.between([22, S.vol(dc) - 8]); S.item(dc, (r) => platform(S, dc, lx, r)); } } };
  eolien.scenes.cargos = { len: [220, 300], build(S) { const n = Math.round(S.len / 36); for (let i = 0; i < n; i++) { const dc = S.d0 + 18 + S.sr() * (S.len - 36), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 8); S.item(dc, (r) => vessel(S, dc, lx, r)); } for (let i = 0; i < 4; i++) { const dc = S.d0 + 30 + S.sr() * (S.len - 60), lx = (S.sr() < 0.5 ? -1 : 1) * S.sr.between([30, 50]), hub = S.sr.between([56, 80]); S.place(dc, lx, 84, 14, 0, hub + 44, (r) => turbine(S, dc, lx, hub, true, r), { over: 60 }); } } };
  eolien.scenes.champDense = { len: [260, 340], build(S) { for (let i = 0, dc = S.d0 + 30; dc < S.d1 - 30; i++, dc += 52) { const side = i % 2 ? 1 : -1, lx = side * S.vol(dc) * 0.55, hub = S.sr.between([58, 80]); S.place(dc, lx, 84, 14, 0, hub + 44, (r) => turbine(S, dc, lx, hub, true, r), { over: 60 }); } } };
  eolien.scenes.portique = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), w = 30 + 6, top = L.y + 34; for (const s of [-1, 1]) { for (const k of [-1, 1]) S.cyl(dc + k * 6, L.lx + s * w, -3, 2.2, top + 3, 'metal', '#e8c020', 10, 1.6); S.bx(dc, L.lx + s * w, top * 0.5, 2.4, top, 14, 'col:#d85a1a', undefined, false); } S.bx(dc, L.lx, top + 3, 2 * w + 8, 4, 18, 'metal', '#e8e8e4'); S.bx(dc, L.lx, top + 6, 2 * w + 2, 2, 14, 'col:#d85a1a', undefined, false); S.cyl(dc, L.lx, top + 5, 7, 0.6, 'col:#c8a020', undefined, 16, 7, false); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 28);
  } };

  // =============================================================== PORTE-AVIONS
  function jet(S, dc, lx, r) {
    S.place(dc, lx, 15, 17, 0, 6, () => { const y = S.yaw(dc) + r.between([-12, 12]), c = pick(r, ['#9aa0a8', '#8a9098', '#a8aeb6']);
      S.bx(dc, lx, 1.6, 2.2, 2.2, 15, 'metal', c, true, { r: [0, y, 0] }); S.bx(dc, lx, 3.1, 1.5, 1, 4, 'col:#1a2a3a', undefined, false, { r: [0, y, 0] });
      S.bx(dc, lx, 1.1, 13, 0.35, 5, 'metal', c, true, { r: [0, y, 0] }); S.bx(dc, lx, 3.2, 0.3, 3.6, 3, 'metal', c, true, { r: [0, y, 0] }); S.bx(dc, lx, 1.4, 5.6, 0.3, 2.2, 'metal', c, false, { r: [0, y, 0] });
      S.cyl(dc, lx, 0, 0.12, 1, 'col:#1c1e22', undefined, 6, 0.12, false); S.bx(dc, lx, 1.7, 2.3, 2.3, 0.4, 'col:#d8a020', undefined, false, { r: [0, y, 0] }); });
  }
  function tractor(S, dc, lx, r) { S.place(dc, lx, 4, 6, 0, 3, () => { S.bx(dc, lx, 0.9, 2.4, 1.2, 4.2, 'metal', '#e8c020'); S.bx(dc, lx, 2.1, 2, 1.2, 1.8, 'metal', '#e8c020'); }); }
  function crates(S, dc, lx, r) { S.place(dc, lx, 5, 5, 0, 4, () => { for (let i = 0; i < 3; i++) S.bx(dc, lx + (i % 2) * 1.6, 0.9 + (i > 1 ? 1.8 : 0), 2.2, 1.8, 2.2, 'col:' + pick(r, ['#d85a1a', '#6a7a4a', '#2a6ab8']), undefined, true, { r: [0, S.yaw(dc) + r() * 40, 0] }); }); }
  function island(S, dc, lx) { S.place(dc, lx, 14, 40, 0, 40, (r) => { const sx = lx > 0 ? 1 : -1; S.bx(dc, lx, 6, 11, 12, 36, 'metal', '#8a9098'); S.bx(dc, lx - sx * 0.8, 15, 9, 6, 24, 'metal', '#a0a6ae'); S.bx(dc, lx - sx * 1, 20, 7, 4, 14, 'metal', '#9aa0a8'); S.bx(dc, lx - sx * 5.6, 15.4, 0.3, 1.2, 20, 'basic:#9ad0e8', undefined, false); S.cyl(dc, lx, 22, 0.5, 14, 'metal', '#c8ccd0', 6, 0.3); S.bx(dc, lx, 30, 7, 0.5, 0.5, 'metal', '#c8ccd0', false); S.cyl(dc + 8, lx, 22, 0.3, 5, 'metal', '#c8ccd0', 6, 0.3, false); S.cyl(dc + 8, lx, 26.4, 3, 0.4, 'col:#d8d8d4', undefined, 14, 3, false); S.bx(dc - 12, lx, 12, 4, 3, 8, 'col:#d85a1a', undefined, false); }); }
  function frigate(S, dc, lx, r) { S.item(dc, () => { const y = S.yaw(dc); S.bx(dc, lx, -3.4, 12, 7.2, 64, 'metal', '#8a9098', true, { r: [0, y, 0] }); S.bx(dc, lx, 3, 11, 3.4, 40, 'metal', '#9aa0a8', true, { r: [0, y, 0] }); S.bx(dc, lx, 6.6, 8, 4, 16, 'col:#b0b6be', undefined, true, { r: [0, y, 0] }); S.cyl(dc + 6, lx, 8, 0.4, 12, 'metal', '#c8ccd0', 6, 0.25); S.bx(dc - 20, lx, 5.2, 2.2, 1.2, 6, 'col:#6a7078', undefined, true, { r: [0, y, 0] }); S.bx(dc + 22, lx, 5.2, 2.2, 1.2, 6, 'col:#6a7078', undefined, true, { r: [0, y, 0] }); }); }

  const carrier = { signature: 'hangar', scenes: {}, dress(S) {
    const q = 32;
    S.rows(S.d0, S.d1, 12, 0, (dc) => S.bx(dc, 0, 0.08, 0.5, 0.06, 6, 'col:#f0f0e8', undefined, false, { shadow: false }));
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 6, 0, (dc) => S.bx(dc, s * (q - 2.2), 0.08, 0.5, 0.06, 4, 'col:#e8c020', undefined, false, { shadow: false }));
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 20, 0, (dc) => S.item(dc, () => S.bx(dc, s * (q + 0.4), 0.5, 0.8, 1.2, 20.4, 'metal', '#6a7078', false)));
    S.rows(S.d0, S.d1, 60, 0.3, (dc) => S.item(dc, (r) => { const s = r() < 0.5 ? -1 : 1; frigate(S, dc, s * r.between([70, 110]), r); }));
    S.rows(S.d0, S.d1, 140, 0.5, (dc) => S.item(dc, (r) => { const lx = (r() < 0.5 ? -1 : 1) * r.between([150, 260]); S.bx(dc, lx, 4, r.between([40, 90]), r.between([6, 14]), r.between([30, 60]), 'basic:#9aa4b0', undefined, false, { shadow: false }); }));
  } };
  Z.defs.carrier = carrier;
  carrier.scenes.parc = { len: [260, 340], build(S) { const n = Math.round(S.len / 22); for (let i = 0; i < n; i++) { const dc = S.d0 + 12 + S.sr() * (S.len - 24), lx = (S.sr() < 0.5 ? -1 : 1) * S.sr.between([12, S.vol(dc) - 4]); S.item(dc, (r) => jet(S, dc, lx, r)); } } };
  carrier.scenes.ilot = { len: [240, 320], build(S) { const dc = S.d0 + S.len * 0.5, side = S.sr() < 0.5 ? -1 : 1; S.item(dc, () => island(S, dc, side * (S.vol(dc) - 4))); const n = Math.round(S.len / 30); for (let i = 0; i < n; i++) { const d2 = S.d0 + 12 + S.sr() * (S.len - 24), lx = (S.sr() * 2 - 1) * (S.vol(d2) - 3), k = Math.floor(S.sr() * 3); S.item(d2, (r) => [tractor, crates, jet][k](S, d2, lx, r)); } } };
  carrier.scenes.atelier = { len: [220, 300], build(S) { const n = Math.round(S.len / 11); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3), k = Math.floor(S.sr() * 4); S.item(dc, (r) => [tractor, crates, crates, jet][k](S, dc, lx, r)); } } };
  carrier.scenes.catapultes = { len: [240, 320], build(S) { for (let i = 0, dc = S.d0 + 24; dc < S.d1 - 24; i++, dc += 28) { const side = i % 2 ? 1 : -1, lx = side * S.vol(dc) * 0.45; S.place(dc, lx, 16, 8, 0, 14, (r) => { S.bx(dc, lx, 0.7, 14, 1.4, 6, 'metal', '#6a7078'); S.bxr(dc, lx, 5, 12, 9, 0.6, 'metal', '#8a9098', 0, 0, true); S.bx(dc, lx, 9.6, 12.4, 0.6, 1.4, 'hazard', undefined, false); }); } } };
  carrier.scenes.hangar = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), tot = 2 * 40 + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 56, 30, tot, L.y + 42, 22, 'metal', '#8a9098', 0); S.bx(dc, L.lx, L.y + 44, 62, 4, 22, 'hazard', undefined, false); S.bx(dc, L.lx - 40, 12, 18, 24, 20, 'metal', '#a0a6ae'); S.bx(dc, L.lx + 40, 12, 18, 24, 20, 'metal', '#a0a6ae'); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 30);
  } };
  Z.kit = { sideWalls, farShapes, arch, span, pick };   // v097 : briques réutilisées par zones_f.js
})();

/* v097 : EFFETS DE TERRAIN propres à chaque zone — des « champs » invisibles à effet doux et lisible (une colonne colorée + des chevrons les montrent) :
 *   lift  : courant ascendant (canyon : thermiques ; volcan : geysers ; jungle : brume de cascade)
 *   boost : accélération vers l'avant (banquise : crevasse bleue ; porte-avions : catapulte ; barrage : conduite forcée)
 *   gust  : rafale latérale (parc éolien ; mégapole : couloirs de vent) — les chevrons montrent le sens */
(function () {
  const Z = CC.Zones, V = THREE.Vector3, _r = new V();
  const SPEC = { lift: { str: 30, col: '#ffb060' }, boost: { str: 42, col: '#6af0ff' }, gust: { str: 16, col: '#e8f4ff' } };
  Z.field = function (S, dc, spec) {
    S.item(dc, () => {
      const T = S.T, L = S.lane(dc), kind = SPEC[spec.type], lx = L.lx + (spec.lxo || 0), y = L.y + (spec.yo || 0), p = T.at(dc, lx, y), yaw = S.yaw(dc);
      const f0 = T.at(dc + 6, lx, y), fwd = new V(f0[0] - p[0], 0, f0[2] - p[2]).normalize(), a0 = T.at(dc, lx + 6, y), across = new V(a0[0] - p[0], 0, a0[2] - p[2]).normalize();
      const dir = spec.type === 'lift' ? new V(0, 1, 0) : spec.type === 'boost' ? fwd : across.clone().multiplyScalar(spec.dir || 1), col = spec.color || kind.col;
      const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]);
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.13, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
      const box = new THREE.Mesh(new THREE.BoxGeometry(spec.w, spec.h, spec.dd), mat); box.rotation.y = yaw; g.add(box);
      const arrows = [], n = 4;
      for (let i = 0; i < n; i++) { const a = CC.Models.guideArrow(); a.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.color.set(col); o.material.opacity = 0.7; } }); a.scale.setScalar(Math.max(2.2, Math.min(spec.w, spec.h) * 0.11)); a.lookAt(dir.clone().add(a.position)); g.add(a); arrows.push(a); }
      const cos = Math.cos(yaw), sin = Math.sin(yaw), center = new V(p[0], p[1], p[2]); let inside = false, t0 = Math.random() * 6;
      S.b.entity({ object: g, update(dt, game) {
        t0 += dt;
        for (let i = 0; i < n; i++) { const k = (t0 * 0.5 + i / n) % 1, q = (k - 0.5); a_(arrows[i], q, i); }
        const rk = game.rocket; if (!rk.active || game.state !== 'FLIGHT') { inside = false; return; }
        _r.copy(rk.pos).sub(center); const xl = _r.x * cos - _r.z * sin, zl = _r.x * sin + _r.z * cos;
        const now = Math.abs(xl) < spec.w / 2 && Math.abs(_r.y) < spec.h / 2 && Math.abs(zl) < spec.dd / 2;
        if (now) {
          rk.vel.addScaledVector(dir, (spec.str || kind.str) * dt);
          if (spec.type === 'boost') { const sp = rk.vel.length(); if (sp > 95) rk.vel.multiplyScalar(95 / sp); }
          if (!inside && game.audio) { game.audio.play('whoosh', rk.pos); if (CC.Haptics) CC.Haptics.tick('touch'); }
        }
        inside = now; mat.opacity = now ? 0.26 : 0.13;
      } });
      function a_(a, q, i) {   // chevrons qui défilent dans le sens de l'effet
        const off = spec.type === 'lift' ? [(i % 2 - 0.5) * spec.w * 0.4, q * spec.h, ((i >> 1) % 2 - 0.5) * spec.dd * 0.4] : spec.type === 'boost' ? [(i % 2 - 0.5) * spec.w * 0.5, 0, q * spec.dd] : [q * spec.w, (i % 2 - 0.5) * spec.h * 0.4, ((i >> 1) % 2 - 0.5) * spec.dd * 0.4];
        const v = new V(off[0], off[1], off[2]); if (spec.type !== 'lift') v.applyAxisAngle(new V(0, 1, 0), yaw); a.position.copy(v);
      }
    });
  };
  // les effets des quatre premières zones : on réutilise les scènes déjà écrites en leur ajoutant des champs
  const D = Z.defs, wrap = (zone, scene, fn) => { const sc = D[zone].scenes[scene], b0 = sc.build; sc.build = function (S) { b0.call(this, S); fn(S); }; };
  wrap('canyon', 'hoodoos', (S) => { for (let i = 1; i <= 3; i++) Z.field(S, S.d0 + S.len * i / 4, { type: 'lift', w: 40, h: 64, dd: 34, yo: 6 }); });
  wrap('canyon', 'arches', (S) => { const n = S.len > 290 ? 3 : 2; for (let i = 0; i < n; i++) Z.field(S, S.d0 + S.len * (i + 1) / (n + 1) - 50, { type: 'lift', w: 44, h: 60, dd: 36, yo: 4 }); });
  wrap('canyon', 'pontsRoche', (S) => { Z.field(S, S.d0 + S.len * 0.5, { type: 'lift', w: 40, h: 60, dd: 34, yo: 6 }); });
  wrap('eolien', 'champ', (S) => { Z.field(S, S.d0 + S.len * 0.3, { type: 'gust', dir: 1, w: 80, h: 56, dd: 60 }); Z.field(S, S.d0 + S.len * 0.7, { type: 'gust', dir: -1, w: 80, h: 56, dd: 60 }); });
  wrap('eolien', 'champDense', (S) => { Z.field(S, S.d0 + S.len * 0.35, { type: 'gust', dir: -1, w: 80, h: 56, dd: 60 }); Z.field(S, S.d0 + S.len * 0.75, { type: 'gust', dir: 1, w: 80, h: 56, dd: 60 }); });
  wrap('carrier', 'catapultes', (S) => { for (let i = 1; i <= 3; i++) Z.field(S, S.d0 + S.len * i / 4, { type: 'boost', w: 30, h: 44, dd: 38, color: '#ffd23a' }); });
  // BANQUISE : la CREVASSE — un couloir de glace bleue (parois de chaque côté) dont l'intérieur accélère
  D.banquise.scenes.crevasse = { len: [200, 260], build(S) {
    const a = S.d0 + 40, b = S.d1 - 40;
    for (let dc = a; dc < b; dc += 12) S.item(dc + 6, (r) => { const L = S.lane(dc + 6), h = 46 + r() * 22; for (const s of [-1, 1]) { S.bx(dc + 6, L.lx + s * 17, h / 2, 5, h, 12.6, 'white', r() < 0.5 ? '#9ac8f0' : '#bcd8f4'); S.bx(dc + 6, L.lx + s * 14.4, L.y, 0.3, 40, 12.4, 'basic:#5ad0ff', undefined, false, { shadow: false }); } S.gate(dc + 6, L.lx, L.y); });
    Z.field(S, (a + b) / 2, { type: 'boost', w: 26, h: 44, dd: b - a, color: '#6af0ff' }); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
  } };
})();
