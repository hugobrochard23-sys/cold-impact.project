/* v098 : QUATRE ZONES SINGULIERES — CARRIERE (mine à ciel ouvert), CIMETIERE DE NAVIRES, BASE DE LANCEMENT, AUTOROUTE (niveaux 15, 20, 25, 30, puis tous les 20 niveaux pour chacune).
 *   CARRIERE  — gradins de roche ocre, excavatrices à roue, camions-bennes géants, convoyeurs (courant d'accélération). SIGNATURE : la roue-excavatrice (un anneau géant à traverser).
 *   EPAVES    — mer brumeuse, coques éventrées dont on traverse la cage, mâts et cheminées qui dépassent, rafales. SIGNATURE : la proue géante.
 *   LANCEMENT — pas de tir : portiques, fusées sur leurs rampes, sphères de carburant, tranchée de flammes (courant ascendant). SIGNATURE : le portique de lancement.
 *   AUTOROUTE — échangeurs superposés, convois, portiques de signalisation, péage, tunnel (voie rapide qui accélère). SIGNATURE : l'échangeur à quatre niveaux. */
(function () {
  const U = CC.U, Z = CC.Zones, K = Z.kit, pick = K.pick;
  Z.PROFILE.carriere = { elev: 0, vol: 42, y: [6, 36], amp: 1.0 };
  Z.PROFILE.epaves = { elev: 0, vol: 56, y: [8, 42], amp: 1.1 };
  Z.PROFILE.lancement = { elev: 0, vol: 44, y: [6, 40], amp: 0.8 };
  Z.PROFILE.autoroute = { elev: 0, vol: 36, y: [6, 34], amp: 0.8 };
  Z.meta.carriere = { label: 'CARRIERE', envs: ['sandStorm', 'goldenHour', 'day', 'overcast'], ground: 'sand', groundTint: '#c0a070', wall: () => ({ mat: { side: 'rock', top: 'sand' }, tint: '#a88a62' }), obstacle: 'rock', obstacleTint: '#a88a62' };
  Z.meta.epaves = { label: 'CIMETIERE DE NAVIRES', envs: ['mistMorning', 'stormGrey', 'overcast', 'twilight'], ground: 'water', groundTint: '#ffffff', wall: () => ({ mat: { side: 'metal', top: 'metal' }, tint: '#7a6a5a' }), obstacle: 'metal', obstacleTint: '#7a6a5a' };
  Z.meta.lancement = { label: 'BASE DE LANCEMENT', envs: ['day', 'goldenHour', 'twilight', 'overcast'], ground: 'concrete', groundTint: '#b8b8b4', wall: () => ({ mat: { side: 'concrete', top: 'concrete' }, tint: '#c8c8c4' }), obstacle: 'concrete', obstacleTint: '#c8c8c4' };
  Z.meta.autoroute = { label: 'AUTOROUTE', envs: ['day', 'harborDusk', 'neonNight', 'overcast'], ground: 'asphalt', groundTint: '#ffffff', wall: () => ({ mat: { side: 'concrete', top: 'concrete' }, tint: '#b8b8b4' }), obstacle: 'concrete', obstacleTint: '#b8b8b4' };
  const OCRE = ['#a88a62', '#b89a6c', '#987a54', '#c0a070'], RUST = ['#7a4a3a', '#6a4034', '#8a5a44', '#5a3a2e'], YEL = '#e8b820';
  const bx = (S, dc, lx, y, w, h, d, m, t, c, o) => S.bx(dc, lx, y, w, h, d, m, t, c, o);

  // ============================================================== CARRIERE
  function dumper(S, dc, lx, r) { S.place(dc, lx, 10, 18, 0, 10, () => { const y = S.yaw(dc) + r.between([-15, 15]); bx(S, dc, lx, 2, 8, 3, 16, 'metal', YEL, true, { r: [0, y, 0] }); bx(S, dc, lx, 5.4, 7, 4.6, 11, 'metal', '#8a8e96', true, { r: [0, y, 0] }); bx(S, dc, lx, 4, 4, 3.4, 4, 'metal', YEL, true, { r: [0, y, 0] }); for (const s of [-1, 1]) for (const k of [-1, 1]) S.cyl(dc + k * 5, lx + s * 4, 0, 2, 1.6, 'col:#1c1e22', undefined, 10, 2, false); }); }
  function excavator(S, dc, lx, r) { S.place(dc, lx, 18, 26, 0, 30, () => { const y = S.yaw(dc); bx(S, dc, lx, 3, 14, 6, 22, 'metal', '#2a2c30', true, { r: [0, y, 0] }); bx(S, dc, lx, 10, 10, 8, 14, 'metal', YEL, true, { r: [0, y, 0] }); bx(S, dc - 8, lx + 8, 20, 2, 2, 32, 'metal', YEL, true, { r: [0, y + 30, 0] }); S.cyl(dc - 18, lx + 20, 6, 7, 3, 'metal', '#8a8e96', 14, 7, true); S.neon(dc, lx, 15, 6, 1, 0.8, '#ff8a1a', 8); }); }
  const carriere = { signature: 'roue', scenes: {}, dress(S) {
    K.sideWalls(S, { mat: 'rock', tints: OCRE, h: [40, 80], off: 11, jit: 4 });
    for (const s of [-1, 1]) for (let dc = S.d0; dc < S.d1; dc += 20) S.item(dc + 10, (r) => { const v = S.vol(dc + 10); S.bx(dc + 10, s * (v + 20), 10, 14, 20, 20.6, 'sand', pick(r, OCRE), false); S.bx(dc + 10, s * (v + 34), 26, 14, 52, 20.6, 'sand', pick(r, OCRE), false); });   // gradins
    K.farShapes(S, { step: 70, off: [50, 140], w: [60, 140], h: [30, 90], d: [50, 120], mat: 'sand', tints: OCRE });
  } };
  Z.defs.carriere = carriere;
  carriere.scenes.camions = { len: [240, 320], build(S) { const n = Math.round(S.len / 26); for (let i = 0; i < n; i++) { const dc = S.d0 + 12 + S.sr() * (S.len - 24), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6); S.item(dc, (r) => dumper(S, dc, lx, r)); } } };
  carriere.scenes.excavatrices = { len: [240, 320], build(S) { const n = Math.round(S.len / 70); for (let i = 0; i < n; i++) { const dc = S.d0 + 40 + i * (S.len - 80) / Math.max(1, n - 1), lx = (i % 2 ? 1 : -1) * (S.vol(dc) - 12); S.item(dc, (r) => excavator(S, dc, lx, r)); } for (let dc = S.d0 + 36; dc < S.d1 - 36; dc += 64) K.span(S, dc, 22, 3, 'metal', [YEL]); } };
  carriere.scenes.convoyeur = { len: [240, 300], build(S) {
    const a = S.d0 + 40, b = S.d1 - 40;
    for (let dc = a; dc < b; dc += 14) S.item(dc + 7, (r) => { const L = S.lane(dc + 7); bx(S, dc + 7, L.lx, 0.7, 6, 1.4, 14, 'metal', '#3a3d46', false); bx(S, dc + 7, L.lx, 1.5, 5.4, 0.3, 14, 'basic:#2a2c30', undefined, false); if (r() < 0.5) bx(S, dc + 7, L.lx + r.between([-2, 2]), 2.4, 2.4, 1.6, 2.4, 'rock', pick(r, OCRE), false); });
    Z.field(S, (a + b) / 2, { type: 'boost', w: 22, h: 30, dd: b - a, color: '#ffb02b' }); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
  } };
  carriere.scenes.tirs = { len: [220, 300], build(S) { const n = Math.round(S.len / 16); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => S.place(dc, lx, 5, 5, 0, 6, () => { for (let k = 0; k < 3; k++) S.cyl(dc, lx + (k - 1) * 1.4, 0, 0.7, 1.9, 'col:' + pick(r, ['#d85a1a', '#e8b820']), undefined, 8, 0.7); bx(S, dc, lx, 4.6, 0.3, 2.4, 3.2, 'hazard', undefined, false); })); } } };
  carriere.scenes.roue = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); S.tube(dc, L.lx, L.y, 26, 10, 'metal', YEL, 14, 3.2, true); for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; S.bxr(dc, L.lx + Math.sin(a) * 30, L.y + Math.cos(a) * 30, 6, 5, 8, 'metal', '#8a8e96', -a * 180 / Math.PI, 0, true); } bx(S, dc, L.lx - 38, 18, 5, 36, 8, 'metal', YEL, true); bx(S, dc, L.lx + 38, 18, 5, 36, 8, 'metal', YEL, true); bx(S, dc, L.lx, L.y + 36, 80, 4, 8, 'metal', YEL, true); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 30);
  } };

  // ============================================================== EPAVES
  function mastUp(S, dc, lx, r) { S.place(dc, lx, 8, 8, 0, 40, () => { const h = r.between([16, 38]); S.cyl(dc, lx, -3, 0.5, h + 3, 'metal', pick(r, RUST), 6, 0.35); bx(S, dc, lx, h * 0.7, 7, 0.5, 0.5, 'metal', pick(r, RUST), false); if (r() < 0.5) S.cyl(dc + 3, lx + 3, -3, 2.2, 9 + 3, 'metal', pick(r, RUST), 10, 1.8); }); }
  function hullTilt(S, dc, lx, r) { S.place(dc, lx, 14, 56, 0, 20, () => { const y = S.yaw(dc) + r.between([-12, 12]); S.bxr(dc, lx, 2, 11, 12, 52, 'metal', pick(r, RUST), r.between([-18, 18]), 0, true); bx(S, dc, lx, 9, 8, 4, 18, 'metal', pick(r, RUST), true, { r: [0, y, 0] }); S.cyl(dc + 8, lx, 6, 2.2, 14, 'metal', pick(r, RUST), 10, 1.8); }); }
  const epaves = { signature: 'proue', scenes: {}, dress(S) {
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 44, 0.6, (dc) => S.item(dc, (r) => { const lx = s * (S.vol(dc) + r.between([8, 50])), L = r.between([40, 90]), h = r.between([12, 30]); bx(S, dc, lx, h / 2 - 3, r.between([10, 18]), h, L, 'metal', pick(r, RUST), false, { r: [0, S.yaw(dc) + r.between([-20, 20]), 0] }); }));
    S.rows(S.d0, S.d1, 36, 0.8, (dc) => S.item(dc, (r) => { const lx = (r() * 2 - 1) * (S.vol(dc) + 30), w = r.between([30, 70]); bx(S, dc, lx, r.between([6, 30]), w, r.between([4, 10]), w, 'basic:#c8ccd0', undefined, false, { shadow: false }); }));   // bancs de brume
  } };
  Z.defs.epaves = epaves;
  epaves.scenes.coques = { len: [260, 340], build(S) { const n = Math.round(S.len / 26); for (let i = 0; i < n; i++) { const dc = S.d0 + 12 + S.sr() * (S.len - 24), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 8); S.item(dc, (r) => hullTilt(S, dc, lx, r)); } } };
  epaves.scenes.mats = { len: [240, 320], build(S) { const n = Math.round(S.len / 12); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => mastUp(S, dc, lx, r)); } for (const dc of [S.d0 + S.len * 0.3, S.d0 + S.len * 0.7]) Z.field(S, dc, { type: 'gust', dir: dc < S.d0 + S.len * 0.5 ? -1 : 1, w: 80, h: 56, dd: 60 }); } };
  epaves.scenes.cages = { len: [240, 320], build(S) { const n = Math.floor(S.len / 90); for (let i = 0; i < n; i++) { const dc = S.d0 + 45 + i * (S.len - 90) / Math.max(1, n - 1); S.item(dc, (r) => { const L = S.lane(dc); for (let k = -1; k <= 1; k++) S.tube(dc + k * 11, L.lx, L.y, 15, 10, 'metal', pick(r, RUST), 8, 2.2, true); S.gate(dc, L.lx, L.y); }); S.reserve(dc, 0, 2 * S.vol(dc), 34); } const m = Math.round(S.len / 30); for (let i = 0; i < m; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6); S.item(dc, (r) => mastUp(S, dc, lx, r)); } } };
  epaves.scenes.flottants = { len: [220, 300], build(S) { const n = Math.round(S.len / 14); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3); S.item(dc, (r) => S.place(dc, lx, 8, 8, 0, 4, () => { const c = pick(r, ['#d85a1a', '#2a6ab8', '#c8a020', '#8a2a2a']); bx(S, dc, lx, 0.4, 2.5, 2.6, 6.2, 'corrugated', c, true, { r: [0, S.yaw(dc) + r() * 60, 0] }); })); } } };
  epaves.scenes.proue = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 14) + 2 * Math.abs(L.lx); S.frame(dc, L.lx, L.y, 58, 40, tot, L.y + 52, 22, 'metal', '#6a4034'); bx(S, dc, L.lx, L.y + 54, 64, 8, 22, 'metal', '#7a4a3a', true); for (const s of [-1, 1]) S.cyl(dc, L.lx + s * 40, 0, 4, 60, 'metal', '#8a5a44', 12, 3); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 34);
  } };

  // ============================================================== LANCEMENT
  function gantry(S, dc, lx, h, r) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.bx(dc + sz * 4, lx + sx * 4, h / 2, 1, h, 1, 'metal', '#d85a1a', true); for (let y = 8; y < h; y += 12) { bx(S, dc, lx, y, 9, 0.6, 0.6, 'metal', '#d85a1a', false); bx(S, dc, lx, y, 0.6, 0.6, 9, 'metal', '#d85a1a', false); } bx(S, dc, lx + 8, h - 2, 14, 1, 2, 'metal', '#d85a1a', false); }
  function rocketPad(S, dc, lx, r) { S.place(dc, lx, 20, 20, 0, 66, () => { const h = r.between([40, 58]); bx(S, dc, lx, 1.5, 16, 3, 16, 'concrete', '#a8a8a4'); S.cyl(dc, lx, 3, 3, h, 'col:#f4f4f0', undefined, 14, 3); S.cyl(dc, lx, 3 + h, 3, 8, 'col:#f4f4f0', undefined, 14, 0.6); S.cyl(dc, lx, 3 + h * 0.6, 3.05, 2, 'col:#e03a2a', undefined, 14, 3.05, false); gantry(S, dc, lx + 8, h + 6, r); }); }
  function sphereTank(S, dc, lx, r) { S.place(dc, lx, 14, 14, 0, 16, () => { S.ball(dc, lx, 9, 6.2, 'col:#e8e8e4', undefined, true); for (const a of [0, 1, 2, 3]) S.cyl(dc, lx + Math.cos(a * 1.57 + 0.78) * 4, 0, 0.45, 5, 'metal', '#8a8e96', 6, 0.45, false); }); }
  const lancement = { signature: 'portiqueLanc', scenes: {}, dress(S) {
    K.sideWalls(S, { mat: 'concrete', tints: ['#c8c8c4', '#bcbcb8', '#d0d0cc'], h: [24, 50], off: 11, jit: 4 });
    K.farShapes(S, { step: 90, off: [60, 160], w: [30, 80], h: [40, 120], d: [30, 70], mat: 'col:#e8e8e4', tints: [undefined] });
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 60, 0.3, (dc) => S.item(dc, () => { S.cyl(dc, s * (S.vol(dc) - 2), 0, 0.3, 14, 'metal', '#3a3d42', 6, 0.2); bx(S, dc, s * (S.vol(dc) - 3), 14, 3, 0.4, 0.5, 'basic:#ffe8b0', undefined, false); }));
  } };
  Z.defs.lancement = lancement;
  lancement.scenes.rampes = { len: [260, 340], build(S) { const n = Math.round(S.len / 70); for (let i = 0; i < n; i++) { const dc = S.d0 + 30 + (i + S.sr() * 0.5) * (S.len - 60) / n, lx = (i % 2 ? 1 : -1) * S.sr.between([14, S.vol(dc) - 12]); S.item(dc, (r) => rocketPad(S, dc, lx, r)); } const m = Math.round(S.len / 40); for (let i = 0; i < m; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6); S.item(dc, (r) => sphereTank(S, dc, lx, r)); } } };
  lancement.scenes.portiques = { len: [240, 320], build(S) { const n = Math.round(S.len / 30); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6), h = S.sr.between([30, 60]); S.place(dc, lx, 12, 12, 0, h, (r) => gantry(S, dc, lx, h, r)); } for (let dc = S.d0 + 40; dc < S.d1 - 40; dc += 70) K.span(S, dc, 24, 2.4, 'metal', ['#d85a1a']); } };
  lancement.scenes.tranchee = { len: [240, 300], build(S) {
    const a = S.d0 + 50, b = S.d1 - 50;
    for (let dc = a; dc < b; dc += 12) S.item(dc + 6, (r) => { const L = S.lane(dc + 6); bx(S, dc + 6, L.lx, 0.15, 10, 0.3, 12, 'basic:#2a2018', undefined, false); bx(S, dc + 6, L.lx, 0.5, 6 + r() * 3, 0.4, 12, 'basic:#ff7a1a', undefined, false); if (r() < 0.35) S.glow(dc + 6, L.lx, 3, '#ff7a1a', 16); S.gate(dc + 6, L.lx, L.y); });
    Z.field(S, (a + b) / 2, { type: 'lift', w: 24, h: 60, dd: b - a, color: '#ff9a40', yo: 6 }); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
  } };
  lancement.scenes.controle = { len: [220, 300], build(S) { const n = Math.round(S.len / 18); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 6), k = Math.floor(S.sr() * 3); S.item(dc, (r) => S.place(dc, lx, 12, 12, 0, 16, () => { if (k === 0) { bx(S, dc, lx, 3, 10, 6, 8, 'concrete', '#b8b8b4'); bx(S, dc, lx, 6.4, 9, 0.8, 7, 'concrete', '#d8d8d4', false); } else if (k === 1) { S.cyl(dc, lx, 0, 0.6, 5, 'metal', '#8a8e96', 6, 0.5); S.cyl(dc, lx, 5, 5, 0.8, 'col:#e8e8e4', undefined, 16, 1); } else { S.cyl(dc, lx, 0, 3, 12, 'metal', '#8a8e96', 12, 3); S.cyl(dc, lx, 12, 3.1, 0.6, 'col:#d85a1a', undefined, 12, 3.1, false); } })); } } };
  lancement.scenes.portiqueLanc = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); for (const s of [-1, 1]) { for (const k of [-1, 1]) S.bx(dc + k * 5, L.lx + s * 34, 40, 2, 80, 2, 'metal', '#d85a1a', true); for (let y = 10; y < 80; y += 14) bx(S, dc, L.lx + s * 34, y, 2.2, 0.8, 12, 'metal', '#d85a1a', false); } bx(S, dc, L.lx, L.y + 36, 74, 3, 14, 'metal', '#d85a1a', true); bx(S, dc, L.lx, L.y + 38, 72, 1, 12, 'hazard', undefined, false); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 30);
  } };

  // ============================================================== AUTOROUTE
  function car(S, dc, lx, r) { S.place(dc, lx, 3.4, 8, 0, 4, () => { const c = pick(r, ['#d85a1a', '#2a6ab8', '#c8c8c4', '#2a2c30', '#8a2a2a']), y = S.yaw(dc); bx(S, dc, lx, 0.9, 2.4, 1.2, 5.4, 'col:' + c, undefined, true, { r: [0, y, 0] }); bx(S, dc, lx, 1.9, 2, 0.9, 2.8, 'col:#9ad0e8', undefined, false, { r: [0, y, 0] }); }); }
  function truck(S, dc, lx, r) { S.place(dc, lx, 4, 18, 0, 6, () => { const y = S.yaw(dc); bx(S, dc, lx, 2.4, 3.6, 3.6, 14, 'corrugated', pick(r, ['#d8d8d4', '#d85a1a', '#2a6ab8']), true, { r: [0, y, 0] }); bx(S, dc + 8.6, lx, 1.8, 3, 2.6, 3.2, 'metal', pick(r, ['#8a2a2a', '#2a5a8a']), true, { r: [0, y, 0] }); }); }
  const autoroute = { signature: 'echangeur', scenes: {}, dress(S) {
    K.sideWalls(S, { mat: 'concrete', tints: ['#b8b8b4', '#a8a8a4', '#c4c4c0'], h: [20, 40], off: 11, jit: 3 });
    K.farShapes(S, { step: 70, off: [60, 160], w: [30, 90], h: [30, 110], d: [30, 80], mat: 'col:#8a90a0', tints: [undefined] });
    S.rows(S.d0, S.d1, 9, 0, (dc) => bx(S, dc, 0, 0.08, 0.4, 0.06, 4, 'col:#f0f0e8', undefined, false, { shadow: false }));
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 20, 0, (dc) => S.item(dc, () => bx(S, dc, s * (S.vol(dc) - 1.4), 0.5, 0.6, 1, 20.4, 'metal', '#8a8e96', false)));
  } };
  Z.defs.autoroute = autoroute;
  autoroute.scenes.convoi = { len: [240, 320], build(S) { const n = Math.round(S.len / 8); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => (r() < 0.35 ? truck : car)(S, dc, lx, r)); } } };
  autoroute.scenes.echangeurs = { len: [240, 320], build(S) { for (let dc = S.d0 + 36; dc < S.d1 - 36; dc += 60) { K.span(S, dc, 22, 3.4, 'concrete', ['#b8b8b4']); S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); for (const s of [-1, 1]) { S.bx(dc, s * (v - 2), 10, 3, 20, 4, 'concrete', '#b8b8b4'); } }); } const n = Math.round(S.len / 14); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => (r() < 0.3 ? truck : car)(S, dc, lx, r)); } } };
  autoroute.scenes.panneaux = { len: [220, 300], build(S) { for (let dc = S.d0 + 30; dc < S.d1 - 30; dc += 46) S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), top = L.y + 22; S.frame(dc, L.lx, L.y, 2 * (S.R + 14), 2 * (top - L.y), 2 * (v + 2) + 2 * Math.abs(L.lx), top + 8, 2, 'metal', '#8a8e96'); bx(S, dc, L.lx, top + 4, 24, 5, 0.6, 'basic:#2a8a4a', undefined, false); S.gate(dc, L.lx, L.y); S.reserve(dc, 0, 2 * v, 6); }); } };
  autoroute.scenes.tunnel = { len: [240, 300], build(S) {
    const a = S.d0 + 40, b = S.d1 - 40;
    for (let dc = a; dc < b; dc += 30) S.item(dc + 15, (r) => { const L = S.lane(dc + 15); S.tube(dc + 15, L.lx, L.y, 15, 31, 'concrete', '#b0b0ac', 8, 1.6, true); bx(S, dc + 15, L.lx, L.y + 14, 1.4, 0.5, 31, 'basic:#fff2c0', undefined, false); S.glow(dc + 15, L.lx, L.y + 12, '#fff2c0', 16); S.gate(dc + 15, L.lx, L.y); });
    Z.field(S, (a + b) / 2, { type: 'boost', w: 26, h: 26, dd: b - a, color: '#fff2c0' }); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
  } };
  autoroute.scenes.peage = { len: [220, 300], build(S) { for (let dc = S.d0 + 40; dc < S.d1 - 40; dc += 70) S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc); S.frame(dc, L.lx, L.y, 2 * (S.R + 12), 30, 2 * (v + 2) + 2 * Math.abs(L.lx), L.y + 24, 8, 'concrete', '#c8c8c4'); bx(S, dc, L.lx, L.y + 26, 2 * (v + 2), 1.2, 9, 'basic:#e8c020', undefined, false); S.gate(dc, L.lx, L.y); S.reserve(dc, 0, 2 * v, 10); }); const n = Math.round(S.len / 14); for (let i = 0; i < n; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 4); S.item(dc, (r) => car(S, dc, lx, r)); } } };
  autoroute.scenes.echangeur = { len: [200, 200], build(S) {
    const dc = S.d0 + 100;
    S.item(dc, (r) => { const L = S.lane(dc), v = S.vol(dc), tot = 2 * (v + 12) + 2 * Math.abs(L.lx); for (const [dy, th] of [[-14, 4], [24, 4], [44, 4]]) { bx(S, dc, 0, L.y + dy, tot, th, 18, 'concrete', '#b8b8b4', true); bx(S, dc, 0, L.y + dy + th / 2 + 0.2, tot, 0.3, 18.2, 'basic:#e8c020', undefined, false); } for (const s of [-1, 1]) for (const k of [-1, 1]) S.cyl(dc + k * 6, L.lx + s * (v - 4), 0, 2.4, L.y + 54, 'concrete', '#a8a8a4', 10, 2.4); S.gate(dc - 30, L.lx, L.y); S.gate(dc, L.lx, L.y); S.gate(dc + 30, L.lx, L.y); });
    S.reserve(dc, 0, 2 * S.vol(dc), 34);
  } };
})();

/* v099 : SCENES SPECIALES — BANQUISE : la GROTTE de glace (voûte, stalactites, certaines TOMBENT quand on approche) et des éclats de glace anguleux ;
 *                          JUNGLE : la MANGROVE (canopée basse, racines : on est obligé de voler bas, au ras de l'eau, puis on remonte). */
(function () {
  const U = CC.U, Z = CC.Zones, K = Z.kit, pick = K.pick, V = THREE.Vector3, D = Z.defs;
  const ICE = ['#cfe6ff', '#bcd8f4', '#e4f2ff', '#a8c8e8'];
  const CONE = new THREE.CylinderGeometry(1, 1, 1, 7);
  // stalactite qui tombe : s'accroche à la voûte, se détache quand la fusée est à < 42 m, tombe (sans danger), éclate en éclats de glace
  function falling(S, dc, lx, y, h, r) {
    S.item(dc, () => {
      const p = S.T.at(dc, lx, y), g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: '#dff0ff', emissive: '#3a5a7a' }), c = new THREE.Mesh(CONE, m);
      c.scale.set(1, h, 1); c.geometry = new THREE.CylinderGeometry(1.2, 0.08, 1, 7); g.add(c); g.position.set(p[0], p[1] - h / 2, p[2]);
      let vy = 0, fell = false, done = false; const shards = [], gy = S.T.at(dc, lx, 0)[1] + h / 2;
      S.b.entity({ object: g, update(dt, game) {
        if (done) { for (const s of shards) { s.position.addScaledVector(s.userData.v, dt); s.userData.v.y -= 30 * dt; s.scale.multiplyScalar(1 - dt * 1.2); } return; }
        if (!fell) { const rk = game.rocket; if (!rk.active || game.state !== 'FLIGHT' || rk.pos.distanceToSquared(g.position) > 42 * 42) return; fell = true; if (game.audio) game.audio.play('ice', g.position); }
        vy += 34 * dt; g.position.y -= vy * dt; g.rotation.z += dt * 0.6;
        if (g.position.y <= gy) { done = true; c.visible = false; if (game.audio) game.audio.play('ice', g.position); for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(CONE, m); s.geometry = new THREE.CylinderGeometry(0.5, 0.05, 1, 5); s.scale.set(1, r.between([1.2, 3]), 1); s.userData.v = new V(r.between([-9, 9]), r.between([6, 16]), r.between([-9, 9])); s.position.set(0, -h / 2 + 0.5, 0); g.add(s); shards.push(s); } g.position.y = gy; }
      } });
    });
  }
  // éclat de glace : prismes inclinés (roulis + cap aléatoires) au lieu de blocs droits
  function shardCluster(S, dc, lx, h, r) {
    const base = pick(r, ICE);
    S.bx(dc, lx, 0.6, h * 0.5, 1.4, h * 0.45, 'white', '#9ac8f0', false);
    for (let i = 0; i < 4; i++) { const w = r.between([2.4, 6]), hh = h * r.between([0.45, 1]); S.bxr(dc, lx + r.between([-3, 3]), hh / 2, w, hh, w * 0.8, 'white', pick(r, ICE), r.between([-24, 24]), r.between([-45, 45]), true); }
    S.bx(dc, lx, h * 0.55, 0.6, h * 0.9, 0.6, 'basic:#8ad8ff', undefined, false);
  }
  const bq = D.banquise;
  bq.scenes.icebergs.build = function (S) { const n = Math.round(S.len / 15); for (let i = 0; i < n; i++) { const dc = S.d0 + 10 + S.sr() * (S.len - 20), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3), h = S.sr.between([12, 40]); S.place(dc, lx, 14, 12, 0, h + 3, (r) => shardCluster(S, dc, lx, h, r)); } };
  delete bq.scenes.crevasse;
  bq.scenes.grotte = { len: [230, 290], build(S) {
    const a = S.d0 + 30, b = S.d1 - 30;
    for (let dc = a; dc < b; dc += 12) S.item(dc + 6, (r) => { const L = S.lane(dc + 6), roof = L.y + 17 + r() * 4, w = 20 + r() * 3; S.bx(dc + 6, L.lx, roof + 2, 2 * (w + 8), 4, 12.6, 'white', pick(r, ICE)); for (const s of [-1, 1]) S.bx(dc + 6, L.lx + s * (w + 3), roof / 2, 6, roof + 4, 12.6, 'white', pick(r, ICE));
      for (let k = 0; k < 3; k++) { const hh = r.between([3, 10]), x = L.lx + r.between([-w, w]); if (Math.abs(x - L.lx) > S.R + 4) S.cyl(dc + 6, x, roof - hh, 0.1, hh, 'white', '#e4f2ff', 6, r.between([0.6, 1.2]), true); else S.cyl(dc + 6, x, roof - hh, 0.1, hh, 'white', '#e4f2ff', 6, r.between([0.6, 1.1]), false); }
      if (r() < 0.22) falling(S, dc + 6, L.lx + r.between([-8, 8]), roof, r.between([6, 12]), r);
      if (r() < 0.2) S.glow(dc + 6, L.lx + r.between([-w, w]), roof - 3, '#8ad8ff', 18); S.gate(dc + 6, L.lx, L.y); });
    Z.field(S, (a + b) / 2, { type: 'boost', w: 30, h: 36, dd: b - a, color: '#6af0ff' }); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
  } };
  // MANGROVE
  D.jungle.scenes.mangrove = { len: [260, 320],
    pin(T, sc) { const mid = (sc.d0 + sc.d1) / 2; return { lx: U.clamp(T.laneX0(mid), -8, 8), y: 7, from: 24, to: sc.d1 - sc.d0 - 24 }; },
    build(S) {
      const a = S.d0 + 30, b = S.d1 - 30;
      for (let dc = S.d0 + 8; dc < S.d1 - 8; dc += 14) S.item(dc, (r) => { const v = S.vol(dc); S.bx(dc, 0, 0.12, 2 * (v + 14), 0.24, 14.4, 'water', undefined, false, { shadow: false }); });
      for (let dc = a; dc < b; dc += 12) S.item(dc + 6, (r) => { const v = S.vol(dc + 6); S.bx(dc + 6, 0, 17.5, 2 * (v + 12), 2.6, 12.6, 'col:' + pick(r, ['#2a5a28', '#2e6a2c', '#3a7a30'])); for (let k = 0; k < 5; k++) { const x = r.between([-v, v]), hh = r.between([4, 11]); S.cyl(dc + 6, x, 16.2 - hh, 0.12, hh, 'col:#5a4030', undefined, 5, r.between([0.3, 0.6]), false); } });
      for (let i = 0; i < Math.round(S.len / 20); i++) { const dc = a + S.sr() * (b - a), lx = (S.sr() * 2 - 1) * (S.vol(dc) - 3); S.item(dc, (r) => S.place(dc, lx, 5, 5, 0, 17, () => { const h = 17; for (let k = -1; k <= 1; k++) S.bxr(dc, lx + k * 1.4, h / 2, 0.8, h + 2, 0.8, 'col:#5a4030', undefined, k * 14, 0, true); })); }
      for (let dc = a; dc < b; dc += 24) S.gate(dc, S.lane(dc).lx, 7); S.reserve((a + b) / 2, 0, 2 * S.vol((a + b) / 2), b - a);
    } };
})();
