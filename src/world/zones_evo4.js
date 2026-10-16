/* v128 : LE DEBUT DE LA PRAIRIE devient un site militaire à traverser — hangar de briques abandonné, poste de contrôle, dépôt de carburant, piste désaffectée, complexe industriel
 * et château d'eau. Tout est ouvert, large et facile à franchir ; on ressort à chaque fois sur la grande prairie. Remplace la scène « camp » (chapitre 2, longueur 640 m). */
(function () {
  const U = CC.U, Z = CC.Zones, TR = CC.Trees, D = Z.defs.campagne, foe = Z.evoFoe;
  if (!D || !foe || !TR) return;
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const BR = ['#bba294', '#b09486', '#c4aa9c', '#ab9082'], RUST = ['#8a5a44', '#7a5a48', '#6a5240'], CONCD = '#6c6e6c';
  const crate = (S, dc, lx, r, n) => { const w = r.between([1.8, 2.8]); for (let i = 0; i < (n || 1); i++) S.bx(dc, lx, w / 2 + i * w, w, w, w * r.between([1, 1.4]), 'planks', pk(r, ['#a8793c', '#9a6e38', '#b08448']), true); };
  const drum = (S, dc, lx, r) => S.cyl(dc, lx, 0, 0.55, 1.3, 'col:' + pk(r, ['#b0482c', '#3a5a8a', '#6a7a4a', '#c8a028']), undefined, 10, 0.55, true);
  const lamp = (S, dc, lx, y, col) => { S.bx(dc, lx, y, 1.2, 0.35, 0.8, 'emis:' + (col || '#ffe2a8'), undefined, false); S.glow(dc, lx, y - 0.4, col || '#ffe2a8', 12); };
  const sandbags = (S, dc, lx, n, r) => { for (let i = 0; i < n; i++) S.bx(dc, lx + i * 2.7, 0.55 + 0, 2.6, 1.1, 1.5, 'sand', '#c8b078', true); };


  // ---------- le départ (170 m) : bosquets de chaque côté, un petit garage de briques à traverser, le premier ennemi plus loin, un camion qui file ----------
  const GR = ['#8d8a80', '#85837a', '#948f84', '#7e7b72'];
  const boulder = (S, dc, lx, y, s, r) => { const p = S.at(dc, lx, y); TR.rock(S.b, p[0], p[1], p[2], s, r, { gray: pk(r, GR), noMoss: true }); S.b.box({ p: [p[0], p[1] + s * 0.5, p[2]], s: [s * 1.6, s * 1.1, s * 1.6], render: false }); };
  const tree = (S, dc, lx, r, h) => { const p = S.at(dc, lx, 0); if (r() < 0.55) TR.conifer(S.b, p[0], p[1], p[2], h, r, {}); else TR.broadleaf(S.b, p[0], p[1], p[2], h * 0.85, r, {}); S.b.box({ p: [p[0], p[1] + h * 0.4, p[2]], s: [h * 0.06 + 0.7, h * 0.8, h * 0.06 + 0.7], render: false }); };
  function garage(S, dc) {
    const len = 38, hw = 15, hh = 13;
    S.reserve(dc, 0, 2 * hw + 10, len + 10);
    S.item(dc, (r) => {
      const t = pk(r, BR);
      for (const s of [-1, 1]) { S.bx(dc, s * (hw + 0.7), 3, 1.4, 6, len, 'brick', t, true); S.bx(dc, s * (hw + 0.7), 11.5, 1.4, 3, len, 'brick', t, true); S.bx(dc, s * (hw + 0.7), 7.5, 0.3, 3, len - 6, 'glass', undefined, false); }
      for (const e of [-1, 1]) S.wall(dc + e * len / 2, -hw - 1.4, hw + 1.4, 0, hh + 2, 1.6, 'brick', t, { lx: 0, yc: 6, w: 26, h: 12 });
      S.bx(dc, 0, hh + 0.4, 2 * hw + 3, 0.8, len + 2, 'corrugated', pk(r, RUST), true); S.bx(dc, 0, 0.14, 2 * hw, 0.3, len, 'concrete', '#a0a29e', false);
      for (let k = -1; k <= 1; k++) { S.bx(dc + k * 12, 0, hh - 0.8, 2 * hw, 0.5, 0.5, 'metal', '#7a7e84', false); lamp(S, dc + k * 12, 0, hh - 2); }
      for (let i = 0; i < 4; i++) { const s = r() < 0.5 ? -1 : 1; if (r() < 0.6) crate(S, dc + r.between([-14, 14]), s * r.between([9, 13]), r, 1 + Math.floor(r() * 2)); else drum(S, dc + r.between([-14, 14]), s * r.between([9, 13]), r); }
      // murets de briques qui prolongent le garage de chaque côté : on sait où passer, on ne voit pas ce qui vient après
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) S.bx(dc, s * (hw + 8 + k * 10), 2.2 + k * 0.6, 8, 4.4 + k * 1.2, len + 8 - k * 4, 'brick', pk(r, BR), true);
    });
    // v150 : le garage est plus riche : bandes de danger, barrieres, atelier (etabli, etagere, pneus, cric), ventilateurs et antenne sur le toit, projecteurs, lumieres chaudes
    S.item(dc, (r) => {
      for (const s of [-1, 1]) for (let k = 0; k < 10; k++) S.bx(dc - len / 2 - 0.6, s * (hw + 0.2 - k * 2.9), 0.9, 0.3, 0.5, 1.4, 'col:' + (k % 2 ? '#1d1f23' : '#f2c200'), undefined, false);
      for (let k = -1; k <= 1; k += 2) { S.bx(dc - len / 2 - 6, k * 10, 1.1, 0.5, 2.2, 0.5, 'col:#c8352a', undefined, true); S.bx(dc - len / 2 - 6, k * 10 + 0, 1.8, 0.4, 0.5, 0.4, 'col:#ffffff', undefined, false); }
      S.bx(dc - len / 2 - 6, 0, 0.12, 2 * hw + 8, 0.24, 9, 'concrete', '#a8aaa6', false);
      for (let k = 0; k < 7; k++) S.bx(dc - len / 2 - 6 + 0, -9 + k * 3, 0.26, 0.5, 0.06, 9, 'col:#e8e8dc', undefined, false, { shadow: false });
      const sx = r() < 0.5 ? -1 : 1;
      S.bx(dc + 8, sx * 11, 1.0, 7, 0.4, 2, 'planks', '#7a5a3a', true); for (const e of [-1, 1]) S.bx(dc + 8 + e * 3, sx * 11, 0.5, 0.4, 1, 1.6, 'col:#3a3e44', undefined, true);
      for (let k = 0; k < 3; k++) S.bx(dc + 8 + (k - 1) * 2, sx * 11, 1.5, 1, 0.5, 0.8, 'col:' + ['#c8352a', '#2f6fb0', '#c8a028'][k], undefined, false);
      for (let k = 0; k < 3; k++) { S.bx(dc - 10, sx * 13.4, 1.3 + k * 2.4, 0.5, 0.25, 7, 'col:#5a626c', undefined, false); for (let j = 0; j < 3; j++) S.bx(dc - 10 + (j - 1) * 2, sx * 13.4, 1.8 + k * 2.4, 1.4, 1, 1.2, 'planks', ['#a8793c', '#9a6e38', '#b08448'][(j + k) % 3], false); }
      for (const q of [S.bx(dc + 2, -sx * 10, 0.5, 0, 0, 0, 'col:#000', undefined, false)]) void q;
      for (let k = 0; k < 4; k++) S.cyl(dc - 4, -sx * 12 + (k % 2) * 0.1, k * 0.62, 0.95, 0.6, 'col:#22252a', undefined, 12, 0.95, false);
      for (let k = 0; k < 4; k++) { S.bx(dc - len / 2 + 4 + k * 9, 0, hh + 1.3, 3, 1.2, 3, 'col:#5a626c', undefined, true); S.cyl(dc - len / 2 + 4 + k * 9, 0, hh + 1.8, 1.3, 0.3, 'col:#2a2e34', undefined, 10, 1.3, false); }
      S.cyl(dc + len / 2 - 4, hw - 3, hh + 0.8, 0.12, 9, 'col:#8a9098', undefined, 6, 0.12, false); S.glow(dc + len / 2 - 4, hw - 3, hh + 10, '#ff3a2a', 6);
      for (const e of [-1, 1]) { S.cyl(dc + e * 10, hw + 6, 0, 0.18, 8, 'col:#5a626c', undefined, 6, 0.18, true); S.bx(dc + e * 10, hw + 5.2, 8.1, 1.8, 0.5, 1, 'emis:#fff4d0', undefined, false); S.glow(dc + e * 10, hw + 4.6, 7.6, '#fff0c0', 20); S.cyl(dc + e * 10, -hw - 6, 0, 0.18, 8, 'col:#5a626c', undefined, 6, 0.18, true); S.bx(dc + e * 10, -hw - 5.2, 8.1, 1.8, 0.5, 1, 'emis:#fff4d0', undefined, false); S.glow(dc + e * 10, -hw - 4.6, 7.6, '#fff0c0', 20); }
      for (let k = -2; k <= 2; k++) S.glow(dc + k * 7, 0, hh - 3.2, '#ffe2a8', 16);
    });
    foe(S, 'jeep', dc + 2, -4, hh + 1.0, { name: 'JEEP', keep: true });
  }
  D.scenes.rampe = { len: [170, 170], noDoor: true, noChaos: true,
    pin: (T, sc) => ({ lx: 0, y: 8, from: 20, to: sc.d1 - sc.d0 - 20 }),
    build(S) {
      const d0 = S.d0;
      for (const sg of [-1, 1]) {
        S.rows(d0 + 14, S.d1, 8, 0.9, (dc) => S.item(dc, (r) => { if (Math.abs(dc - (d0 + 112)) < 30) return; tree(S, dc, S.lane(dc).lx + sg * r.between([22, 62]), r, r.between([13, 25])); }));
        S.rows(d0 + 10, S.d1, 22, 0.8, (dc) => S.item(dc, (r) => boulder(S, dc, S.lane(dc).lx + sg * r.between([14, 30]), 0, r.between([2, 4.5]), r)));
        S.item(d0 + 40, (r) => sandbags(S, d0 + 40, sg * 26, 4, r));
      }
      S.item(d0 + 20, () => { for (const s of [-1, 1]) S.bx(d0 + 20, s * 9, 0.06, 0.9, 0.1, 40, 'col:#e8e8dc', undefined, false, { shadow: false }); });
      garage(S, d0 + 112);
      // v150 : le lanceur envoie la fusee haut : les premiers ennemis sont sur une butte et en l'air, dans l'axe du tir
      S.item(d0 + 58, (r) => { S.bx(d0 + 58, 5, 8, 16, 16, 16, 'col:#6e5f45', undefined, true); S.bx(d0 + 58, 5, 16.4, 17, 0.8, 17, 'col:#6a8a42', undefined, true); for (let k = 0; k < 4; k++) boulder(S, d0 + 58 + r.between([-8, 8]), 5 + r.between([-9, 9]), 0, r.between([2, 3.5]), r); });
      foe(S, 'tank', d0 + 58, 5, 17.2, { name: 'CHAR', val: 240, keep: true });
      foe(S, 'heli', d0 + 84, 0, 25, { name: 'HELICO', keep: true, armed: false, patrol: (SS, dd, lx, y) => [SS.at(dd, -14, y), SS.at(dd + 10, 0, y + 3), SS.at(dd, 14, y), SS.at(dd - 10, 0, y + 3)], speed: 8 });
      foe(S, 'truck', d0 + 150, -8, 0, { name: 'CAMION', path: 60, speed: 14 });
    } };

  // ---------- 1. HANGAR DE BRIQUES : un grand portail à chaque bout, des fenêtres qui laissent entrer la lumière, une travée de toit effondrée ----------
  function hangar(S, dc) {
    const len = 84, hw = 27, hh = 24, bay = len / 6;
    S.reserve(dc, 0, 2 * hw + 12, len + 14);
    S.item(dc, (r) => {
      const t = pk(r, BR);
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) {
        const d2 = dc - len / 2 + (k + 0.5) * bay, win = (k + (s > 0 ? 1 : 0)) % 2 === 0;
        S.bx(d2, s * (hw + 0.7), win ? 3.5 : hh / 2, 1.4, win ? 7 : hh, bay + 0.1, 'brick', t, true);
        if (win) { S.bx(d2, s * (hw + 0.7), 20, 1.4, 8, bay + 0.1, 'brick', t, true); S.bx(d2, s * (hw + 0.7), 11, 0.3, 8, bay - 2.4, 'glass', undefined, false); }
        S.bx(d2 + bay / 2, s * (hw + 1.1), hh / 2, 2.4, hh + 1.5, 2.2, 'brick', '#9a8274', true);   // pilastres
      }
      for (const e of [-1, 1]) S.wall(dc + e * len / 2, -hw - 1.4, hw + 1.4, 0, hh + 4, 1.8, 'brick', t, { lx: 0, yc: 11.5, w: 40, h: 23 });
      // toit : la 3e travée est tombée, la 4e à moitié
      for (let k = 0; k < 6; k++) { const d2 = dc - len / 2 + (k + 0.5) * bay; if (k === 2) continue; S.bx(d2, k === 3 ? hw / 2 + 2 : 0, hh + 0.6, k === 3 ? hw + 6 : 2 * hw + 3.6, 1, bay, 'corrugated', pk(r, RUST), true); }
      for (let k = 0; k < 7; k++) { const d2 = dc - len / 2 + k * bay; S.bx(d2, 0, hh - 1, 2 * hw, 0.7, 0.7, 'metal', '#7a7e84', false); for (const s of [-1, 1]) S.bxr(d2, s * hw * 0.5, hh - 3, 0.5, 6, 0.5, 'metal', '#7a7e84', s * 30, 0, false); }
      // morceaux de toit tombés au sol, poutres de travers
      const dd = dc - len / 2 + 2.5 * bay;
      S.bxr(dd, -9, 3, 14, 0.6, 10, 'corrugated', '#7a5446', 18, 20, true); S.bxr(dd + 4, 12, 1.6, 12, 0.6, 9, 'corrugated', '#6a4a3c', -12, -15, true); S.bxr(dd - 2, 1, 6, 0.7, 0.7, 16, 'metal', '#7a7e84', 40, 0, true);
      // sol de béton, rail de pont roulant, passerelle, lampes
      S.bx(dc, 0, 0.14, 2 * hw, 0.3, len, 'concrete', '#a0a29e', false);
      for (const s of [-1, 1]) S.bx(dc, s * (hw - 1), 17, 0.7, 0.7, len, 'metal', '#6a6e74', false);
      S.bx(dc - 10, -hw + 3, 8.6, 5, 0.4, 46, 'metal', '#8a8e94', true); for (let k = 0; k < 5; k++) S.bx(dc - 30 + k * 11, -hw + 3, 4.2, 0.5, 8.4, 0.5, 'metal', '#6a6e74', true); S.bx(dc - 10, -hw + 0.6, 9.5, 0.2, 1.2, 46, 'metal', '#8a8e94', false);
      for (let k = 0; k < 6; k++) { if (k === 2) continue; lamp(S, dc - len / 2 + (k + 0.5) * bay, 0, hh - 3.5); }
      // caisses, bidons, établis contre les murs ; un camion en pièces au fond
      for (let i = 0; i < 9; i++) { const d2 = dc + r.between([-len / 2 + 6, len / 2 - 6]), s = r() < 0.5 ? -1 : 1, lx = s * r.between([17, hw - 3]); if (s < 0 && d2 > dc - 32 && d2 < dc + 14) continue; if (r() < 0.55) crate(S, d2, lx, r, 1 + Math.floor(r() * 3)); else drum(S, d2, lx, r); }
      S.bx(dc + 22, 20, 1.3, 7, 2.6, 3, 'col:#4a5a3a', undefined, true); S.bx(dc + 22, 20, 3.1, 4, 1.4, 3, 'col:#3a4a2c', undefined, true); S.cyl(dc + 26, 22, 0.1, 0.9, 0.5, 'col:#222', undefined, 8, 0.9, false);
    });
    // à l'extérieur : sacs de sable, bidons, un portique rouillé devant l'entrée
    S.item(dc - len / 2 - 14, (r) => { sandbags(S, dc - len / 2 - 14, -24, 4, r); sandbags(S, dc - len / 2 - 14, 14, 4, r); for (let i = 0; i < 5; i++) drum(S, dc - len / 2 - 10 + r.between([-5, 5]), r.between([-30, 30]), r); });

    // falaises de roche qui rejoignent les flancs du hangar : on ne voit pas ce qu'il y a derrière avant de l'avoir traversé
    S.item(dc, (r) => { for (const sg of [-1, 1]) for (let dd = dc - len / 2 + 4; dd < dc + len / 2 - 3; dd += 14) for (let k = 0; k < 5; k++) for (const y of [0, 16, 32]) boulder(S, dd + r.between([-3, 3]), sg * (hw + 38 + k * 17 + r.between([-3, 3])), y + 1, r.between([13, 21]), r); });
    foe(S, 'tank', dc - 4, 6, 0, { name: 'BLINDE', hp: 2, armed: false });
    foe(S, 'truck', dc + len / 2 + 40, -6, 0, { name: 'CAMION', path: 70, speed: 14 });
  }

  // ---------- 2. POSTE DE CONTROLE : route, barrière, guérites en briques, sacs de sable, grillage et mirador avec une tourelle ----------
  function checkpoint(S, dc) {
    S.reserve(dc, 0, 70, 70);
    S.item(dc, (r) => {
      S.bx(dc, 0, 0.12, 20, 0.2, 80, 'asphalt', '#666864', false, { shadow: false }); for (let k = -3; k <= 3; k++) S.bx(dc + k * 11, 0, 0.24, 0.5, 0.05, 5, 'col:#e8e4d0', undefined, false, { shadow: false });
      for (const s of [-1, 1]) { S.bx(dc, s * 11.5, 2.4, 1.6, 4.8, 1.6, 'brick', '#9a8274', true); S.bx(dc, s * 11.5, 5.1, 2.2, 0.6, 2.2, 'concrete', '#a8a8a4', true); }
      S.bx(dc, 0, 5.2, 24, 0.7, 0.7, 'hazard', undefined, false);   // barrière levée : on passe dessus ou dessous
      for (const s of [-1, 1]) { S.bx(dc - 6, s * 17, 2.2, 7, 4.4, 6, 'brick', pk(r, BR), true); S.bx(dc - 6, s * 17, 4.7, 8.2, 0.7, 7.2, 'corrugated', '#7a5446', true); S.bx(dc - 2.6, s * 17, 2.6, 0.2, 1.6, 3, 'glass', undefined, false); sandbags(S, dc + 6, s * 14, 3, r); sandbags(S, dc - 14, s * 22, 4, r); }
      for (let k = -5; k <= 5; k++) { if (Math.abs(k) < 1) continue; for (const s of [-1, 1]) if (k * 12 > 0 || true) S.bx(dc + k * 6, s * 30, 2, 0.2, 4, 6, 'chainlink', undefined, false); }
      // mirador : quatre pieds, cabine en planches, toit ; la tourelle est dessus
      for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) S.bx(dc + 12 + a * 2.6, 34 + b * 2.6, 7.5, 0.7, 15, 0.7, 'metal', '#6a6e74', true);
      S.bx(dc + 12, 34, 16, 8, 3.4, 8, 'planks', '#8a7254', true); S.bx(dc + 12, 34, 18.2, 9.4, 0.8, 9.4, 'corrugated', '#6a4a3c', true); lamp(S, dc + 12, 30, 15, '#ffd8a0');
      crate(S, dc + 24, -26, r, 2); drum(S, dc + 20, -28, r); drum(S, dc + 21.5, -27.5, r);
    });
    foe(S, 'aaturret', dc + 12, 34, 20.6, { name: 'TOURELLE', armed: true, fixed: true });
    foe(S, 'command', dc - 18, -34, 0, { name: 'POSTE DE COMMANDE' });
  }

  // ---------- 3. DEPOT DE CARBURANT : réservoirs ronds, tuyaux, talus de terre ; les réservoirs sont des cibles qui propulsent la fusée ----------
  function fuelDepot(S, dc) {
    S.reserve(dc, 0, 90, 90);
    S.item(dc, (r) => {
      S.bx(dc, 0, 0.12, 100, 0.2, 90, 'concrete', '#b4b6b2', false, { shadow: false });
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
        const d2 = dc - 28 + i * 28, lx = s * 32 + (i % 2) * s * 4;
        S.cyl(d2, lx, 0, 8, 11, 'col:#bfc2bc', undefined, 16, 8, true); S.cyl(d2, lx, 11, 8.3, 0.7, 'col:#8a8e94', undefined, 16, 8.3, false); S.cyl(d2, lx, 5.4, 8.15, 1.4, 'col:#c8402c', undefined, 16, 8.15, false);
        for (let k = 0; k < 4; k++) S.bx(d2 + Math.sin(k * 1.57) * 3, lx + Math.cos(k * 1.57) * 3, 12.6, 0.15, 1.6, 0.15, 'metal', '#6a6e74', false);   // garde-corps
        S.cyl(d2, lx - s * 4, 11.7, 0.5, 5, 'col:#6a6e74', undefined, 8, 0.5, false);
        if (i < 2) S.bx(d2 + 14, lx, 1.4, 1.0, 1.0, 20, 'metal', '#9a7a58', false);   // tuyau entre deux réservoirs
      }
      for (const s of [-1, 1]) S.ball(dc, s * 47, 0, 16, 'col:#7a8a58', undefined, false, 0.45);   // talus de terre
      S.bx(dc, 0, 0.34, 1.1, 0.05, 60, 'col:#d8c860', undefined, false, { shadow: false });
      for (let i = 0; i < 6; i++) drum(S, dc + r.between([-38, 38]), (r() < 0.5 ? -1 : 1) * r.between([14, 22]), r);
      S.cyl(dc + 30, 18, 0, 0.5, 9, 'metal', '#9a9a96', 8, 0.4, false); lamp(S, dc + 30, 18, 9.3);
    });
    foe(S, 'fuel', dc - 20, -34, 0, { name: 'RESERVOIR', val: 160 });
    foe(S, 'fuel', dc + 10, 36, 0, { name: 'RESERVOIR', val: 160 });
  }

  // ---------- 4. PISTE DESAFFECTEE : béton fissuré, avions épaves, tour de contrôle en briques, manche à air ----------
  function runway(S, dc) {
    const len = 190;
    S.reserve(dc, 0, 70, len);
    S.item(dc, (r) => {
      for (let d2 = dc - len / 2; d2 < dc + len / 2; d2 += 20) { S.bx(d2 + 10, 0, 0.1, 46, 0.2, 20.4, 'concrete', '#bdbdb8', false, { shadow: false }); if (Math.round(d2 / 20) % 2 === 0) S.bx(d2 + 10, 0, 0.22, 1.4, 0.05, 11, 'col:#d8d4bc', undefined, false, { shadow: false }); }
      for (const s of [-1, 1]) S.bx(dc, s * 21, 0.22, 0.6, 0.05, len, 'col:#d8d4bc', undefined, false, { shadow: false });
      for (let i = 0; i < 26; i++) { const d2 = dc + r.between([-len / 2, len / 2]), lx = r.between([-20, 20]); S.bxr(d2, lx, 0.24, r.between([3, 9]), 0.04, 0.5, 'col:#3a3c3a', undefined, r.between([-90, 90]), r.between([-40, 40]), false); }   // fissures
      for (let i = 0; i < 8; i++) { const d2 = dc + r.between([-len / 2, len / 2]), lx = (r() < 0.5 ? -1 : 1) * r.between([8, 20]); S.bx(d2, lx, 0.3, r.between([2, 4]), 0.5, r.between([2, 4]), 'col:#6f8a50', undefined, false, { shadow: false }); }   // herbe qui perce
      // avions épaves (fuselage, ailes cassées, dérive) et un camion citerne renversé
      const wreck = (d2, lx, yaw, tint) => { S.bxr(d2, lx, 1.9, 3.2, 3.2, 18, 'metal', tint, 0, yaw, true); S.bxr(d2 - 2, lx, 1.5, 22, 0.5, 4.6, 'metal', tint, 8, yaw, true); S.bxr(d2 - 8, lx, 4.2, 0.5, 4.4, 3.4, 'metal', tint, 0, yaw, true); S.bxr(d2 - 8, lx, 2.3, 7.6, 0.4, 2.4, 'metal', tint, -6, yaw, true); S.bxr(d2 + 8.5, lx, 2.2, 3.0, 2.4, 3.6, 'glass', undefined, 0, yaw, false); };
      wreck(dc - 52, -15, 4, '#8d939a'); wreck(dc + 28, 17, -6, '#9a8a6a');
      S.bxr(dc - 8, 14, 1.6, 3, 3, 10, 'metal', '#a89a7a', 16, 10, true);
      // tour de contrôle en briques, cabine vitrée, antenne
      const dt = dc + 60;
      S.bx(dt, -34, 6, 9, 12, 9, 'brick', '#bba294', true); S.bx(dt, -34, 13.5, 12, 3, 12, 'glass', undefined, false); S.bx(dt, -34, 15.4, 13, 0.7, 13, 'concrete', '#9a9a96', true); S.bx(dt, -34, 19.5, 0.3, 8, 0.3, 'metal', '#6a6e74', false); lamp(S, dt, -34, 12, '#ffd8a0');
      // manche à air
      S.cyl(dc - 90, 24, 0, 0.18, 9, 'metal', '#c8c8c4', 6, 0.14, false); S.cyl(dc - 90, 24.2, 8.2, 0.9, 3, 'col:#e8602c', undefined, 8, 0.4, false);
      // ruines d'un petit hangar sur le côté
      for (const q of [[dc - 20, -36, 12], [dc - 20, -26, 7], [dc - 6, -36, 8]]) S.bx(q[0], q[1], q[2] / 2, 1.4, q[2], 12, 'brick', '#ab9082', true);
    });
    foe(S, 'aagun', dc + 20, -24, 0, { name: 'CANON ANTIAERIEN', armed: true });
    foe(S, 'jeep', dc - 60, 12, 0, { name: 'JEEP', path: 90, speed: 18 });
  }

  // ---------- 5. COMPLEXE INDUSTRIEL ET CHATEAU D'EAU : cheminées, halls à toit en dents de scie, passerelles à franchir, un lance-missiles sur un toit ----------
  function industrial(S, dc) {
    S.reserve(dc, 0, 100, 110);
    S.item(dc, (r) => {
      S.bx(dc, 0, 0.12, 110, 0.2, 110, 'concrete', '#aeb0ac', false, { shadow: false });
      for (const [d2, lx, h] of [[dc - 36, -38, 42], [dc - 6, 40, 36], [dc + 30, -42, 46]]) {
        S.cyl(d2, lx, 0, 3.6, h, 'brick', '#b09486', 12, 2.4, true); S.cyl(d2, lx, h - 4, 3.0, 1.2, 'col:#2a2a2a', undefined, 12, 3.0, false); S.cyl(d2, lx, h * 0.55, 3.2, 1, 'col:#c8c8c0', undefined, 12, 3.2, false);
        S.bx(d2, lx, 1.4, 9, 2.8, 9, 'brick', '#9a8274', true);
      }
      // deux halls à toit en dents de scie de chaque côté
      for (const [d2, s] of [[dc - 20, -1], [dc + 16, 1]]) {
        const lx = s * 36, w = 26, dd = 40;
        S.bx(d2, lx, 8, w, 16, dd, 'brick', pk(r, BR), true);
        for (let k = 0; k < 4; k++) { S.bxr(d2 - 15 + k * 10, lx, 17.2, w + 1, 0.6, 10.4, 'corrugated', pk(r, RUST), 22, 0, true); S.bx(d2 - 15 + k * 10 + 4.7, lx, 18.3, w + 1, 3.2, 0.5, 'glass', undefined, false); }
        for (let k = 0; k < 4; k++) S.bx(d2 - 16 + k * 10.6, lx - s * (w / 2 + 0.2), 8, 0.3, 4, 5, 'glass', undefined, false);
        S.bx(d2, lx - s * (w / 2 + 3), 1.2, 3, 2.4, 14, 'col:#4a5a3a', undefined, true);
      }
      // passerelles et tuyaux en travers : on passe dessous, entre, ou dessus
      for (const [d2, y, mat, tint, th] of [[dc - 24, 11, 'metal', '#8a8e94', 0.7], [dc - 24, 12, 'metal', '#8a8e94', 0.15], [dc + 6, 26, 'metal', '#9a7a58', 1.6]]) S.bx(d2, 0, y, 76, th, th < 1 ? 2.6 : 1.6, mat, tint, th > 0.5);
      for (const x of [-34, 34]) { S.bx(dc - 24, x, 5.5, 0.9, 11, 0.9, 'metal', '#6a6e74', true); S.bx(dc + 6, x, 13, 1.4, 26, 1.4, 'metal', '#6a6e74', true); }
      // château d'eau : quatre pieds, cuve, toit conique, échelle
      const tx = 48, td = dc + 38;
      for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) S.bx(td + a * 3.2, tx + b * 3.2, 11, 0.9, 22, 0.9, 'metal', '#8a8e94', true);
      S.cyl(td, tx, 22, 6.8, 9, 'col:#a8a8a0', undefined, 14, 6.8, true); S.cyl(td, tx, 31, 6.9, 3.4, 'col:#8a3a2a', undefined, 14, 0.5, false); S.bx(td, tx + 7.1, 14, 0.3, 28, 0.3, 'metal', '#6a6e74', false);
      for (let i = 0; i < 8; i++) drum(S, dc + r.between([-40, 40]), (r() < 0.5 ? -1 : 1) * r.between([14, 22]), r);
      lamp(S, dc - 24, 0, 10.6, '#ffd8a0');
    });
    foe(S, 'sam', dc - 20, -36, 16.8, { name: 'LANCE-MISSILES', armed: true, fixed: true });
    foe(S, 'heli', dc + 8, 0, 34, { name: 'HELICO', armed: true, patrol: (SS, d, lx, y) => [SS.at(d, -30, y), SS.at(d + 18, 0, y + 6), SS.at(d, 30, y), SS.at(d - 18, 0, y + 6)], speed: 12 });
  }

  // ===== LE CAMP DEVIENT LE SITE MILITAIRE (640 m) ; prairie ouverte entre les ouvrages, un virage doux à la fin
  const L0 = 640, at = { hangar: 70, checkpoint: 232, fuel: 340, runway: 470, industrial: 570 };
  D.scenes.camp = { len: [L0, L0], noDoor: true, noChaos: true, turns: [[0.82, 0.99, 34]],
    pin: (T, sc) => ({ lx: 0, y: 15, from: 24, to: sc.d1 - sc.d0 - 24 }),
    build(S) {
      const d0 = S.d0, kit = [Z.kit.tent, Z.kit.truckBlock, Z.kit.container, Z.kit.crates, Z.kit.drums, Z.kit.mast, Z.kit.sandbags];
      for (let i = 0; i < 12; i++) { const dc = d0 + 14 + S.sr() * (S.len - 28), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([70, Math.max(72, S.vol(dc) - 24)]); S.item(dc, (r) => pk(r, kit)(S, dc, lx, r)); }
      S.item(d0 + 600, (r) => Z.kit.radome(S, d0 + 600, 64));
      hangar(S, d0 + at.hangar); checkpoint(S, d0 + at.checkpoint); fuelDepot(S, d0 + at.fuel); runway(S, d0 + at.runway); industrial(S, d0 + at.industrial);
      for (const k of Object.keys(at)) S.gate(d0 + at[k] - 50, 0, 15);
    } };
})();
