/* v097 : QUATRE ZONES DE PLUS — VOLCAN, JUNGLE, BARRAGE, MEGAPOLE NEON (niveaux 14, 19, 24, 29, puis tous les 20 niveaux pour chacune).
 *   VOLCAN  — basalte noir, coulées de lave, nuages de cendres, geysers de lave (courants ascendants). SIGNATURE : la caldeira.
 *   JUNGLE  — arbres géants, lianes, ponts de corde, cascades (brume qui monte), temple envahi. SIGNATURE : l'arbre-porte.
 *   BARRAGE — mur de béton colossal, déversoir, salle des turbines, pylônes, CONDUITE FORCEE (tube qui accélère). SIGNATURE : la vanne géante.
 *   NEON    — mégapole de nuit : tours, enseignes, passerelles, rails surélevés, étals, couloirs de vent. SIGNATURE : le portail du dragon. */
(function () {
  const U = CC.U, Z = CC.Zones, K = Z.kit, pick = K.pick;
  Z.PROFILE.volcan = { elev: 0, vol: 36, y: [6, 34], amp: 1.1 };
  Z.PROFILE.jungle = { elev: 0, vol: 40, y: [8, 40], amp: 1.0 };
  Z.PROFILE.barrage = { elev: 0, vol: 44, y: [6, 40], amp: 0.8 };
  Z.PROFILE.neon = { elev: 0, vol: 30, y: [8, 60], amp: 0.6 };
  Z.meta.volcan = { label: 'VOLCAN', envs: ['emberSky', 'bloodMoon', 'stormGrey'], ground: 'rock', groundTint: '#3a2a28', wall: () => ({ mat: { side: 'rock', top: 'rock' }, tint: '#4a3430' }), obstacle: 'rock', obstacleTint: '#4a3430' };
  Z.meta.jungle = { label: 'JUNGLE', envs: ['day', 'goldenHour', 'mistMorning'], ground: 'grass', groundTint: '#3a6a30', wall: () => ({ mat: { side: 'rock', top: 'grass' }, tint: '#5a7a4a' }), obstacle: 'rock', obstacleTint: '#6a7a5a' };
  Z.meta.barrage = { label: 'BARRAGE', envs: ['day', 'overcast', 'goldenHour', 'mistMorning'], ground: 'concrete', groundTint: '#a8aaa8', wall: () => ({ mat: { side: 'concrete', top: 'concrete' }, tint: '#c8c8c4' }), obstacle: 'concrete', obstacleTint: '#c8c8c4' };
  Z.meta.neon = { label: 'MEGAPOLE NEON', envs: ['neonNight', 'twilight', 'bloodMoon'], ground: 'asphalt', groundTint: '#ffffff', wall: () => ({ mat: { side: 'facadeDark', top: 'concrete', bottom: 'concreteDark' }, tint: '#c0c4d0' }), obstacle: 'concrete', obstacleTint: '#8a8e9a' };
  const NEON = ['#ff3ad8', '#2be8ff', '#ffb02b', '#8a6aff', '#5aff8a'];

  // ============================================================== VOLCAN
  const BAS = ['#4a3430', '#3a2a28', '#5a3e36', '#2e2220'];
  function column(S, dc, lx, r) { const w = r.between([3, 6]), n = 3 + Math.floor(r() * 4); S.place(dc, lx, w * 2.4, w * 2.4, 0, 30, () => { for (let i = 0; i < n; i++) { const h = r.between([8, 30]), ox = (i % 2) * w * 0.9 - w * 0.4, oz = Math.floor(i / 2) * w * 0.8 - w * 0.4; S.bx(dc + oz, lx + ox, h / 2, w * 0.95, h, w * 0.95, 'rock', pick(r, BAS), true, { r: [0, S.yaw(dc) + r() * 40, 0] }); } }); }
  function vent(S, dc, lx) { S.cyl(dc, lx, 0, 3.4, 1.2, 'rock', '#2a1c1a', 10, 2.6, false); S.cyl(dc, lx, 1.1, 2.4, 0.3, 'basic:#ff7a1a', undefined, 10, 2.4, false); }
  const volcan = { signature: 'caldeira', scenes: {}, dress(S) {
    K.sideWalls(S, { mat: 'rock', tints: BAS, h: [50, 130], off: 11, jit: 6, strata: 'c0401a' });
    K.farShapes(S, { step: 70, off: [40, 150], w: [60, 160], h: [60, 150], d: [60, 130], mat: 'rock', tints: ['#3a2a28', '#4a3430', '#2e2220'] });
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 16, 0.7, (dc) => S.item(dc, (r) => { const lx = s * (S.vol(dc) - r.between([1, 9])), w = r.between([3, 8]); S.bx(dc, lx, 0.12, w, 0.24, r.between([10, 22]), 'basic:#ff6a1a', undefined, false, { shadow: false }); if (r() < 0.25) S.glow(dc, lx, 3, '#ff6a1a', 16); }));   // coulées de lave le long des bords
    S.rows(S.d0, S.d1, 50, 0.6, (dc) => S.item(dc, (r) => { const lx = (r() * 2 - 1) * (S.vol(dc) + 30), y = r.between([50, 110]), w = r.between([14, 30]); S.bx(dc, lx, y, w, w * 0.4, w, 'basic:#5a5258', undefined, false, { shadow: false }); }));   // cendres
  } };
  Z.defs.volcan = volcan;
  volcan.scenes.basalte = { len: [260, 340], build(S) { const n = Math.round(S.len / 22); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => column(S, dc, lx, r)); } } };
  volcan.scenes.geysers = { len: [240, 320], build(S) { const n = Math.floor(S.len / 70); for (let i = 0; i < n; i++) { const dc = S.d0 + 40 + i * (S.len - 80) / Math.max(1, n - 1); S.item(dc, () => { const L = S.lane(dc); vent(S, dc, L.lx); }); Z.field(S, dc, { type: 'lift', w: 30, h: 60, dd: 30, color: '#ff7a2a', yo: 8 }); S.gate(dc, S.lane(dc).lx, S.lane(dc).y); } const m = Math.round(S.len / 26); for (let i = 0; i < m; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => column(S, dc, lx, r)); } } };
  volcan.scenes.pontsLave = { len: [240, 320], build(S) { const n = Math.floor(S.len / 80); for (let i = 0; i < n; i++) K.span(S, S.d0 + 40 + i * (S.len - 80) / Math.max(1, n - 1), 22, 9, 'rock', BAS); for (let dc = S.d0 + 10; dc < S.d1 - 10; dc += 14) S.item(dc, (r) => { const L = S.lane(dc); S.bx(dc, L.lx + r.between([-14, 14]), 0.15, r.between([6, 14]), 0.3, 12, 'basic:#ff5a10', undefined, false, { shadow: false }); }); } };
  volcan.scenes.fumerolles = { len: [220, 300], build(S) { const n = Math.round(S.len / 18); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3); S.item(dc, (r) => { S.place(dc, lx, 7, 7, 0, 10, () => { vent(S, dc, lx); S.cyl(dc, lx, 1.4, 2, 10, 'basic:#6a6068', undefined, 8, 4.4, false); }); }); } } };
  volcan.scenes.forge = { len: [220, 300], build(S) { const n = Math.round(S.len / 20); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => S.place(dc, lx, 12, 12, 0, 18, () => { S.cyl(dc, lx, 0, 3, 14, 'metal', '#5a5e66', 10, 2.4); S.cyl(dc, lx, 14, 3.2, 1, 'basic:#ff7a1a', undefined, 10, 3.2, false); S.bx(dc, lx + 6, 3, 4, 6, 8, 'corrugated', '#6a6a70'); })); } } };
  volcan.scenes.caldeira = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 22) + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 62, 44, tot, L.y + 50, 26, 'rock', '#3a2a28'); S.bx(dc, L.lx, L.y + 54, 76, 10, 24, 'rock', '#5a3e36'); for (const s of [-1, 1]) S.bx(dc, L.lx + s * 40, 0.3, 24, 0.6, 20, 'basic:#ff6a1a', undefined, false); S.glow(dc, L.lx - 40, 4, '#ff6a1a', 30); S.glow(dc, L.lx + 40, 4, '#ff6a1a', 30); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 34);
  } };

  // ============================================================== JUNGLE
  const LEAF = ['#2e6a2c', '#3a7a30', '#2a5a28', '#4a8a38'], BARK = ['#5a4030', '#4a3426', '#6a4c38'];
  function tree(S, dc, lx, h, r) { const w = h * 0.1 + 1; S.cyl(dc, lx, 0, w, h, 'col:' + pick(r, BARK), undefined, 8, w * 0.7); for (let i = 0; i < 3; i++) S.bx(dc, lx + (i - 1) * w * 1.4, h + 2 + i * 1.5, w * 7 - i * 2, 4.5, w * 6, 'col:' + pick(r, LEAF), undefined, true, { r: [0, S.yaw(dc) + r() * 50, 0] }); S.bx(dc, lx, h * 0.55, w * 1.2, 1.2, w * 1.2, 'col:#3a7a30', undefined, false); }
  function vines(S, dc, lx, y, n, r) { for (let i = 0; i < n; i++) { const h = r.between([5, 16]); S.cyl(dc, lx + (i - n / 2) * 1.6, y - h, 0.12, h, 'col:#3a8a34', undefined, 5, 0.12, false); } }
  const jungle = { signature: 'arbrePorte', scenes: {}, dress(S) {
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 13, 0.7, (dc) => S.item(dc, (r) => { const lx = s * (S.vol(dc) + r.between([4, 16])), h = r.between([30, 70]); tree(S, dc, lx, h, r); }));
    K.farShapes(S, { step: 60, off: [50, 150], w: [50, 110], h: [50, 120], d: [40, 100], mat: 'col:#2a5a2e', tints: [undefined], });
    S.rows(S.d0, S.d1, 20, 0.9, (dc) => S.item(dc, (r) => { const lx = (r() * 2 - 1) * (S.vol(dc) - 2), w = r.between([1.5, 4]); S.place(dc, lx, w + 1, w + 1, 0, 3, () => S.bx(dc, lx, w * 0.4, w, w * 0.8, w, 'col:' + pick(r, LEAF), undefined, false)); }));   // fougères
  } };
  Z.defs.jungle = jungle;
  jungle.scenes.canopee = { len: [260, 340], build(S) { const n = Math.round(S.len / 22); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4), h = S.sr.between([22, 52]); S.place(dc, lx, 12, 12, 0, h + 8, (r) => tree(S, dc, lx, h, r)); } } };
  jungle.scenes.lianes = { len: [240, 320], build(S) { for (let dc = S.d0 + 30; dc < S.d1 - 30; dc += 44) { K.span(S, dc, 24, 3, 'col:#3a7a30', [undefined]); S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); vines(S, dc, L.lx - v * 0.4, L.y + 26, 7, r); vines(S, dc, L.lx + v * 0.4, L.y + 26, 7, r); }); } } };
  jungle.scenes.cascade = { len: [240, 320], build(S) { const n = Math.floor(S.len / 100); for (let i = 0; i < n; i++) { const dc = S.d0 + 50 + i * (S.len - 100) / Math.max(1, n - 1); S.item(dc, () => { const L = S.lane(dc), v = S.vol(dc), s = i % 2 ? 1 : -1; S.bx(dc, s * (v + 10), 30, 16, 60, 16, 'rock', '#6a7a5a'); S.bx(dc, s * (v + 1.4), 30, 0.6, 60, 6, 'basic:#e8f4ff', undefined, false); S.bx(dc, s * (v - 4), 0.4, 14, 0.8, 14, 'water'); }); Z.field(S, dc, { type: 'lift', w: 36, h: 60, dd: 34, color: '#d8f0ff', yo: 6 }); } for (let i = 0; i < Math.round(S.len / 28); i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4), h = S.sr.between([22, 46]); S.place(dc, lx, 12, 12, 0, h + 8, (r) => tree(S, dc, lx, h, r)); } } };
  jungle.scenes.temple = { len: [220, 300], build(S) { const dc = S.d0 + S.len * 0.5, side = S.sr() < 0.5 ? -1 : 1, lx = side * (S.vol(dc) - 16); S.item(dc, (r) => S.place(dc, lx, 36, 36, 0, 30, () => { for (let i = 0; i < 5; i++) S.bx(dc, lx, 3 + i * 5, 34 - i * 6.4, 6, 34 - i * 6.4, 'concrete', i % 2 ? '#7a8a6a' : '#8a9a78'); S.bx(dc, lx, 28, 8, 5, 8, 'concrete', '#6a7a5a'); S.glow(dc, lx, 31, '#9affb0', 14); })); for (let i = 0; i < Math.round(S.len / 30); i++) { const d2 = S.d0 + 10 + S.sr() * (S.len - 20), l2 = (S.sr() * 2 - 1) * (S.vol(d2) - 4); S.item(d2, (r) => S.place(d2, l2, 5, 5, 0, 14, () => { const h = r.between([6, 14]); S.bx(d2, l2, h / 2, 3, h, 3, 'concrete', '#8a9a78'); S.bx(d2, l2, h + 0.6, 4, 1.2, 4, 'concrete', '#7a8a6a'); })); } } };
  jungle.scenes.riviere = { len: [220, 300], build(S) { for (let dc = S.d0 + 6; dc < S.d1 - 6; dc += 18) S.item(dc, (r) => { const L = S.lane(dc); S.bx(dc, L.lx + 0.6 * Math.sin(dc / 40) * S.vol(dc) * 0.5, 0.1, 22, 0.2, 18.5, 'water', undefined, false, { shadow: false }); }); const n = Math.round(S.len / 30); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4), h = S.sr.between([20, 44]); S.place(dc, lx, 12, 12, 0, h + 8, (r) => tree(S, dc, lx, h, r)); } } };
  jungle.scenes.arbrePorte = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); for (const s of [-1, 1]) { S.cyl(dc, L.lx + s * 36, 0, 8, 90, 'col:#5a4030', undefined, 10, 5); S.cyl(dc, L.lx + s * 36, 40, 9, 2, 'col:#3a7a30', undefined, 10, 9, false); } for (let i = 0; i < 4; i++) S.bx(dc, L.lx + (i - 1.5) * 20, L.y + 40 + (i % 2) * 3, 30, 8, 26, 'col:' + pick(r, LEAF)); vines(S, dc, L.lx, L.y + 36, 12, r); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 34);
  } };

  // ============================================================== BARRAGE
  function pylon(S, dc, lx, h) { S.bx(dc, lx, h / 2, 1.4, h, 1.4, 'metal', '#8a8e96'); S.bx(dc, lx, h * 0.8, 14, 0.7, 0.7, 'metal', '#8a8e96', false); S.bx(dc, lx, h * 0.65, 10, 0.7, 0.7, 'metal', '#8a8e96', false); for (const s of [-1, 1]) S.cyl(dc, lx + s * 6.4, h * 0.8 - 2, 0.3, 2, 'col:#d8d8d4', undefined, 6, 0.3, false); }
  const barrage = { signature: 'vanne', scenes: {}, dress(S) {
    for (const s of [-1, 1]) for (let dc = S.d0; dc < S.d1; dc += 20) S.item(dc + 10, (r) => { const m = dc + 10, v = S.vol(m), h = 70 + (Math.floor(m / 60) % 3) * 22; S.bx(m, s * (v + 14), h / 2, 26, h, 20.6, 'concrete', s > 0 ? '#c8c8c4' : '#bcbcb8'); if (Math.floor(m / 20) % 3 === 0) S.bx(m, s * (v + 0.6), h / 2, 3, h, 6, 'concrete', '#a8a8a4', true); });   // mur et contreforts
    K.farShapes(S, { step: 80, off: [60, 160], w: [60, 140], h: [30, 80], d: [50, 120], mat: 'col:#6a7a6a', tints: [undefined] });
    S.rows(S.d0, S.d1, 70, 0.4, (dc) => S.item(dc, (r) => pylon(S, dc, (r() < 0.5 ? -1 : 1) * (S.vol(dc) + r.between([40, 80])), r.between([40, 62]))));
  } };
  Z.defs.barrage = barrage;
  barrage.scenes.deversoir = { len: [240, 320], build(S) { for (let dc = S.d0 + 8; dc < S.d1 - 8; dc += 16) S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); for (const s of [-1, 1]) { S.bx(dc, s * (v - 10), 3 + (dc - S.d0) * 0.0, 16, 0.5, 15.6, 'basic:#d8ecff', undefined, false, { shadow: false }); S.bx(dc, s * (v - 2.2), 5, 0.8, 10, 15.8, 'concrete', '#a8a8a4'); } }); const n = Math.round(S.len / 26); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 8); S.item(dc, (r) => S.place(dc, lx, 8, 8, 0, 14, () => { const h = r.between([8, 18]); S.cyl(dc, lx, 0, 2.6, h, 'concrete', '#b8b8b4', 10, 2.2); S.bx(dc, lx, h + 1, 5, 2, 5, 'col:#d85a1a', undefined, false); })); } } };
  barrage.scenes.turbines = { len: [220, 300], build(S) { const n = Math.round(S.len / 18); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6); S.item(dc, (r) => S.place(dc, lx, 12, 12, 0, 16, () => { S.cyl(dc, lx, 0, 4.4, 8, 'metal', '#5a8aa8', 14, 4.4); S.cyl(dc, lx, 8, 3, 6, 'metal', '#8a9098', 14, 2.2); S.bx(dc, lx, 14.5, 6, 1, 6, 'col:#d85a1a', undefined, false); })); } } };
  barrage.scenes.pylones = { len: [240, 320], build(S) { const n = Math.round(S.len / 30); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4), h = S.sr.between([30, 56]); S.place(dc, lx, 14, 3, 0, h, () => pylon(S, dc, lx, h)); } for (let dc = S.d0 + 30; dc < S.d1 - 30; dc += 60) K.span(S, dc, 26, 2.4, 'metal', ['#8a8e96']); } };
  barrage.scenes.conduite = { len: [240, 300], build(S) {
    const a = S.d0 + 50, b = S.d1 - 50;
    for (let dc = a; dc < b; dc += 30) S.item(dc + 15, (r) => { const L = S.lane(dc + 15); S.tube(dc + 15, L.lx, L.y, 14, 31, 'metal', '#8a9098', 10, 1.4, true); S.bx(dc + 15, L.lx, L.y + 15.4, 2, 0.6, 31, 'basic:#ffd23a', undefined, false); S.gate(dc + 15, L.lx, L.y); });
    Z.field(S, (a + b) / 2, { type: 'boost', w: 24, h: 24, dd: b - a, color: '#ffd23a' }); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
  } };
  barrage.scenes.vanne = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 14) + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 56, 40, tot, L.y + 44, 20, 'concrete', '#b8b8b4'); S.bx(dc, L.lx, L.y + 46, 62, 4, 20, 'hazard', undefined, false); for (const s of [-1, 1]) S.bx(dc, L.lx + s * 36, 20, 4, 40, 22, 'metal', '#d85a1a', false); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 30);
  } };

  // ============================================================== MEGAPOLE NEON
  function sign(S, dc, lx, y, r) { const c = pick(r, NEON), w = r.between([3, 8]), h = r.between([8, 22]); S.neon(dc, lx, y, 0.8, h, w, c, 18); S.bx(dc, lx, y, 0.5, h + 1.4, w + 1.4, 'col:#1a1c22', undefined, false); }
  const neon = { signature: 'dragon', scenes: {}, dress(S) {
    for (const s of [-1, 1]) for (let dc = S.d0; dc < S.d1; dc += 20) S.item(dc + 10, (r) => { const m = dc + 10, v = S.vol(m), hr = U.makeRng(Math.floor(m / 20) * 977 + (s > 0 ? 13 : 5)), h = 70 + hr() * 120, set = hr() * 4; S.bx(m, s * (v + set + 14), h / 2 - 1, 28, h, 20.4, { side: 'facadeDark', top: 'concrete', bottom: 'concreteDark' }, ['#c0c4d0', '#a8acc0', '#d0d4e0'][Math.floor(hr() * 3)]); if (r() < 0.55) sign(S, m, s * (v + set - 0.4), r.between([14, 120]), r); if (r() < 0.3) S.neon(m, s * (v + set - 0.4), r.between([10, 100]), 0.5, 0.6, 18, pick(r, NEON), 22); });
    S.rows(S.d0, S.d1, 36, 0.2, (dc) => S.item(dc, (r) => { for (const s of [-1, 1]) { S.cyl(dc, s * (S.vol(dc) - 2), 0, 0.3, 11, 'metal', '#3a3d46', 6, 0.2); S.bx(dc, s * (S.vol(dc) - 3), 11, 3, 0.4, 0.5, 'basic:#ffe8b0', undefined, false); } }));
  } };
  Z.defs.neon = neon;
  neon.scenes.rues = { len: [260, 340], build(S) { const n = Math.round(S.len / 26); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6); S.item(dc, (r) => S.place(dc, lx, 9, 7, 0, 30, () => { const h = r.between([12, 34]); S.bx(dc, lx, h / 2, 8, h, 6, 'concrete', '#6a6e7a'); S.neon(dc, lx, h * 0.6, 8.2, 0.8, 6.2, pick(r, NEON), 14); })); } for (const dc of [S.d0 + S.len * 0.35, S.d0 + S.len * 0.7]) Z.field(S, dc, { type: 'gust', dir: dc < S.d0 + S.len * 0.5 ? 1 : -1, w: 60, h: 60, dd: 44 }); } };
  neon.scenes.passerelles = { len: [240, 320], build(S) { for (let dc = S.d0 + 36; dc < S.d1 - 36; dc += 56) { K.span(S, dc, 22, 3.4, 'col:#2a2c34', [undefined]); S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); S.neon(dc, L.lx, L.y + 22 - 0.2, 2 * v, 0.5, 0.6, pick(r, NEON), 18); }); } } };
  neon.scenes.rails = { len: [240, 320], build(S) { for (let dc = S.d0 + 12; dc < S.d1 - 12; dc += 18) S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), y = L.y + 26; S.bx(dc, -v + 4, y, 3, 2.4, 18.4, 'metal', '#5a5e6a'); S.bx(dc, -v + 4, y - 7, 1.4, 14, 1.4, 'metal', '#5a5e6a'); S.neon(dc, -v + 4, y + 1.4, 3.2, 0.4, 18.4, '#2be8ff', 12); }); const n = Math.round(S.len / 28); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6); S.item(dc, (r) => S.place(dc, lx, 8, 8, 0, 20, () => { const h = r.between([10, 26]); S.bx(dc, lx, h / 2, 6, h, 6, 'concrete', '#6a6e7a'); S.neon(dc, lx, h + 0.6, 6.4, 1, 6.4, pick(r, NEON), 14); })); } } };
  neon.scenes.etals = { len: [220, 300], build(S) { const n = Math.round(S.len / 11); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3); S.item(dc, (r) => S.place(dc, lx, 8, 6, 0, 6, () => { const c = pick(r, NEON); S.bx(dc, lx, 1.1, 6, 2.2, 4, 'col:#3a3d46'); S.bx(dc, lx, 3.6, 7.4, 0.5, 5.4, 'col:' + c, undefined, false); S.neon(dc, lx, 2.6, 6.4, 0.3, 4.4, c, 8); })); } } };
  neon.scenes.dragon = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 16) + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 52, 40, tot, L.y + 54, 16, 'concrete', '#3a3c46'); for (let i = 0; i < 4; i++) { const c = NEON[i]; S.neon(dc, L.lx, L.y + 20.4 + i * 0.01, 54 + i * 2, 0.5, 0.6 + i * 0.01, c, 26); } for (const s of [-1, 1]) for (let k = 0; k < 4; k++) S.neon(dc, L.lx + s * 28, L.y - 10 + k * 14, 0.6, 5, 0.6, NEON[(k + (s > 0 ? 2 : 0)) % 5], 16); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 28);
  } };
})();
