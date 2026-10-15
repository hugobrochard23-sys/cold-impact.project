/* v121 : ZONE « CAMPAGNE » du mode évolution (?evo=1) — de grands espaces ouverts au lieu d'un couloir : collines rondes à l'horizon, prairie, camp militaire,
 * rivière et pont, forêt, route, puis des morceaux d'autres zones (canyon, barrage, souterrain, base de lancement, base aérienne) habillés ici.
 * Les ennemis sont posés à la main dans chaque scène (rares, espacés, chacun avec sa mécanique) : voir foe(). */
(function () {
  const U = CC.U, Z = CC.Zones, K = Z.kit, DEG = 180 / Math.PI;
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  Z.PROFILE.campagne = { elev: 0, vol: 120, y: [8, 90], amp: 1.25 };
  Z.meta.campagne = { label: 'CAMPAGNE', envs: ['plaineDay', 'goldenHour'], ground: 'white', groundTint: '#78a85a',
    wall: () => ({ mat: { side: 'rock', top: 'grass' }, tint: '#8a9a6a' }), obstacle: 'rock', obstacleTint: '#8a9a6a' };
  const GREENS = ['#7aa65e', '#6e9c54', '#86ae68', '#5f8e4c', '#8ab46c'];

  // ---------- ennemis posés à la main ----------
  // type, distance, décalage latéral, hauteur ; opts : { hp (blindé : PV affichés), armed, path, patrol, yaw, name }
  function foe(S, type, dc, lx, y, o) {
    o = o || {};
    if (location.search.indexOf('notgt') >= 0) return;
    S.item(dc, () => {
      const RO = CC.Roster, L = S.lane(dc), p = S.at(dc, lx, y || 0);
      const ex = { unarmed: !o.armed, evoHp: o.hp, evoName: o.name || type, evoVal: o.val };
      if (o.patrol) ex.patrol = o.patrol(S, dc, lx, y || 0), ex.patrolSpeed = o.speed || 9, ex.patrolPhase = o.phase || 0;
      if (o.path) { const L2 = o.path; ex.path = [S.at(dc, lx, y || 0), S.at(dc + L2, lx, y || 0)]; ex.fleeSpeed = o.speed || 16; }
      S.b.target(type, p, S.yaw(dc) + (type === 'truck' ? 90 : 0) + RO.face(type) + (o.yaw || 0), RO.opts(type, ex));
      S.gate(dc - 30, L.lx, Math.max(L.y * 0.8, 8)); S.gate(dc - 12, lx, Math.max(4, (y || 0) + 3)); S.gate(dc, lx, Math.max(3, (y || 0) + 1.5)); S.gate(dc + 26, S.lane(dc + 26).lx, S.lane(dc + 26).y);
    });
  }
  Z.evoFoe = foe;

  // ---------- décor ----------
  function pineT(S, dc, lx, r, sc) {
    const h = r.between([9, 18]) * (sc || 1);
    S.cyl(dc, lx, 0, 0.45 * (sc || 1), 3.2, 'col:#5a3f28', undefined, 6, 0.35, false);
    S.cyl(dc, lx, 2, h * 0.30, h * 0.50, 'col:#2f7a3a', undefined, 8, 0.15, false); S.cyl(dc, lx, 2 + h * 0.28, h * 0.23, h * 0.46, 'col:#388a42', undefined, 8, 0.12, false); S.cyl(dc, lx, 2 + h * 0.52, h * 0.15, h * 0.36, 'col:#40964a', undefined, 8, 0.1, false);
  }
  function oakT(S, dc, lx, r, sc) {
    const h = r.between([6, 12]) * (sc || 1), c = pick(r, ['#3f8f3a', '#4a9a40', '#58a548', '#357f33']);
    S.cyl(dc, lx, 0, 0.55 * (sc || 1), h * 0.5, 'col:#6b4a2e', undefined, 6, 0.4, false);
    S.ball(dc, lx, h * 0.72, h * 0.5, 'col:' + c, undefined, false, 0.9); S.ball(dc + 2, lx + 2, h * 0.58, h * 0.36, 'col:' + c, undefined, false, 0.9);
  }
  function knoll(S, dc, lx, rad, h, col) { S.ball(dc, lx, h - rad * 0.0 - rad * 0.0 - 0, rad, 'col:' + col, undefined, false, h / rad); }
  function farmhouse(S, dc, lx, r) {
    S.place(dc, lx, 16, 16, 0, 12, () => {
      const c = pick(r, ['#e8dcc0', '#d8c8a0', '#e0d0b0']), roof = pick(r, ['#a8452c', '#8a3a2a', '#b8603a']);
      S.bx(dc, lx, 2.6, 9, 5.2, 12, 'col:' + c, undefined, true); S.bx(dc, lx, 6.3, 9.6, 1.4, 12.6, 'col:' + roof, undefined, false); S.bx(dc, lx, 7.7, 5.2, 1.6, 12.4, 'col:' + roof, undefined, false);
      S.bx(dc, lx + 8, 2.2, 6, 4.4, 8, 'col:#8a6a48', undefined, true); S.bx(dc, lx + 8, 5, 6.4, 1, 8.4, 'col:#5a4a38', undefined, false);
      S.cyl(dc, lx - 10, 0, 1.8, 9, 'col:#c8c8c0', undefined, 10, 1.8, false);   // silo
    });
  }
  function windmill(S, dc, lx, r) {
    S.place(dc, lx, 10, 10, 0, 40, () => { const hub = 26; S.cyl(dc, lx, 0, 2.2, hub, 'col:#e8e4dc', undefined, 8, 1.2, false);
      const a0 = r() * 6.28; for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; S.bxr(dc, lx + Math.sin(a) * 8, hub + Math.cos(a) * 8, 1.2, 15, 0.4, 'col:#f4f0e8', undefined, -a * DEG, 0, false); } });
  }
  function pylonLine(S, dc, lx) { S.place(dc, lx, 8, 4, 0, 32, () => { S.bx(dc, lx, 14, 1.2, 28, 1.2, 'metal', '#8a8e96', false); S.bx(dc, lx, 24, 14, 0.6, 0.6, 'metal', '#8a8e96', false); S.bx(dc, lx, 20, 10, 0.6, 0.6, 'metal', '#8a8e96', false); }); }
  function haystack(S, dc, lx, r) { S.place(dc, lx, 8, 8, 0, 4, () => { S.cyl(dc, lx, 0, 2.4, 3.4, 'col:' + pick(r, ['#d8b860', '#c8a850']), undefined, 10, 2.4, false); }); }

  const campagne = { signature: 'rampe', scenes: {}, dress(S) {
    // collines rondes à l'horizon, des deux côtés (ellipsoïdes aplaties : un vrai relief doux, pas des boîtes)
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 42, 0.7, (dc) => S.item(dc, (r) => { const v = S.vol(dc), lx = s * (v + r.between([30, 280])), rad = r.between([60, 190]), sy = r.between([0.2, 0.42]); S.ball(dc, lx, -rad * sy * 0.12, rad, 'col:' + pick(r, GREENS), undefined, Math.abs(lx) < 150, sy); }));
    // bosquets et arbres épars
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 22, 0.9, (dc) => S.item(dc, (r) => { const lx = s * (S.vol(dc) - r.between([2, 70])); (r() < 0.5 ? oakT : pineT)(S, dc, lx, r); }));
    // fermes, moulins, lignes électriques au loin
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 130, 0.6, (dc) => S.item(dc, (r) => { const lx = s * r.between([55, S.vol(dc) - 10]), k = r(); (k < 0.4 ? farmhouse : k < 0.65 ? windmill : k < 0.85 ? haystack : (S2, d2, l2) => pylonLine(S2, d2, l2))(S, dc, lx, r); }));
  } };
  Z.defs.campagne = campagne;

  // ===== RAMPE : la colline de départ, le tout premier ennemi juste devant
  campagne.scenes.rampe = { len: [170, 170], noDoor: true, noChaos: true, build(S) {
    foe(S, 'tank', S.d0 + 20, 0, 0, { name: 'CHAR', val: 140 });
    for (const s of [-1, 1]) S.item(S.d0 + 60, (r) => { sandbagsRow(S, S.d0 + 60, s * 26, r); });
    S.item(S.d0 + 20, () => { for (const s of [-1, 1]) S.bx(S.d0 + 20, s * 9, 0.06, 0.9, 0.1, 40, 'col:#e8e8dc', undefined, false, { shadow: false }); });   // marquage au sol
  } };
  function sandbagsRow(S, dc, lx, r) { S.place(dc, lx, 12, 4, 0, 2, () => { for (let i = 0; i < 4; i++) S.bx(dc, lx - 4 + i * 2.7, 0.6, 2.6, 1.2, 1.6, 'sand', '#c8b078'); }); }

  // ===== CAMP : un camp militaire dans la prairie
  campagne.scenes.camp = { len: [300, 300], noDoor: true, noChaos: true, build(S) {
    const kit = [K.tent, K.truckBlock, K.container, K.crates, K.drums, K.mast, K.sandbags];
    for (let i = 0; i < 14; i++) { const dc = S.d0 + 14 + S.sr() * (S.len - 28), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([22, S.vol(dc) - 20]); S.item(dc, (r) => pick(r, kit)(S, dc, lx, r)); }
    S.item(S.d0 + 120, (r) => K.hangar(S, S.d0 + 120, -46, r));
    S.item(S.d0 + 210, (r) => K.radome(S, S.d0 + 210, 52));
    foe(S, 'truck', S.d0 + 90, 8, 0, { name: 'CAMION' });
    foe(S, 'jeep', S.d0 + 205, -14, 0, { name: 'JEEP' });
  } };

  // ===== RIVIERE : une rivière large, un pont, un ennemi caché dessous
  campagne.scenes.riviere = { len: [300, 300], noDoor: true, noChaos: true, build(S) {
    const dr = S.d0 + 150, v = S.vol(dr);
    S.item(dr, (r) => {
      S.bx(dr, 0, 0.14, 2 * (v + 90), 0.2, 44, 'water', '#4a9ad0', false, { shadow: false });                 // l'eau
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) S.bx(dr + (k - 2.5) * 8, s * (v + 20), 0.4, 2 * (v + 60), 0.9, 7, 'col:#6a8a4a', undefined, false, { shadow: false });
      S.bx(dr, 0, 7.4, 2 * (v + 26), 1.6, 16, 'concrete', '#c8c8c4', true);                                      // tablier
      S.bx(dr, 0, 8.6, 2 * (v + 26), 0.5, 0.5, 'metal', '#8a8e96', false); S.bx(dr + 7.6, 0, 8.4, 2 * (v + 26), 0.9, 0.4, 'metal', '#8a8e96', false); S.bx(dr - 7.6, 0, 8.4, 2 * (v + 26), 0.9, 0.4, 'metal', '#8a8e96', false);
      for (let k = -4; k <= 4; k++) { if (Math.abs(k * 24) > v + 20) continue; S.bx(dr, k * 24, 3.4, 4, 7, 12, 'concrete', '#b8b8b4', true); }                  // piles
      S.bx(dr, 0, 0.9, 2 * (v + 26), 1.2, 17, 'col:#4a4e54', undefined, false, { shadow: false });
    });
    foe(S, 'tank', dr, 10, 0, { name: 'CHAR CACHE', armed: false });
    foe(S, 'boat', S.d0 + 245, -20, 0, { name: 'VEDETTE', path: 60, speed: 8 });
    for (let i = 0; i < 12; i++) { const dc = S.d0 + 8 + S.sr() * (S.len - 16), s = S.sr() < 0.5 ? -1 : 1, lx = s * S.sr.between([30, S.vol(dc) - 8]); if (Math.abs(dc - dr) < 40) continue; S.item(dc, (r) => (r() < 0.5 ? oakT : pineT)(S, dc, lx, r)); }
  } };

  // ===== FORET : une forêt dense avec une clairière et un lance-missiles sur la colline
  campagne.scenes.foret = { len: [300, 300], noDoor: true, noChaos: true,
    relief(T, sc, r) { const A = 22, L = sc.d1 - sc.d0; return { fn: (d) => A * Math.pow(Math.sin(Math.PI * U.clamp((d - sc.d0) / L, 0, 1)), 2), max: A }; },
    build(S) {
      for (let i = 0; i < 90; i++) { const dc = S.d0 + 6 + S.sr() * (S.len - 12), lx = (S.sr() < 0.5 ? -1 : 1) * S.sr.between([14, S.vol(dc) - 4]); if (Math.abs(dc - (S.d0 + 150)) < 34 && Math.abs(lx) < 50) continue; S.item(dc, (r) => pineT(S, dc, lx, r, r.between([1, 1.9]))); }
      foe(S, 'sam', S.d0 + 150, -26, 0, { name: 'LANCE-MISSILES', armed: true });
      foe(S, 'heli', S.d0 + 255, 0, 26, { name: 'HELICO', patrol: (SS, dc, lx, y) => [SS.at(dc, -36, y), SS.at(dc + 18, 0, y + 6), SS.at(dc, 36, y), SS.at(dc - 18, 0, y + 6)], speed: 11 });
    } };

  // ===== ROUTE : une autoroute, un échangeur, un convoi qui file devant
  campagne.scenes.route = { len: [360, 360], noDoor: true, noChaos: true, build(S) {
    const v = S.vol(S.mid);
    S.item(S.d0, () => { for (let dc = S.d0; dc < S.d1; dc += 40) { S.bx(dc + 20, 0, 0.05, 30, 0.1, 40.2, 'col:#44484e', undefined, false, { shadow: false }); S.bx(dc + 20, 0, 0.12, 0.6, 0.06, 18, 'col:#e8e8dc', undefined, false, { shadow: false }); for (const s of [-1, 1]) S.bx(dc + 20, s * 14.4, 0.12, 0.5, 0.06, 40, 'col:#e8e8dc', undefined, false, { shadow: false }); } });
    const dc0 = S.d0 + 190;
    S.item(dc0, () => { S.bx(dc0, 0, 9, 2 * (v + 20), 1.8, 20, 'concrete', '#c0c0bc', true); for (const k of [-2, -1, 0, 1, 2]) S.bx(dc0, k * 36, 4.4, 4.4, 9, 10, 'concrete', '#b0b0ac', true); S.bx(dc0, 0, 10.4, 2 * (v + 20), 0.9, 0.5, 'metal', '#8a8e96', false); });
    for (let i = 0; i < 4; i++) { const dc = S.d0 + 40 + i * 8; foe(S, 'truck', dc, -10 + (i % 2) * 20, 0, { name: 'CONVOI', path: 150, speed: 15 + i }); }
    foe(S, 'tank', S.d0 + 320, 0, 0, { name: 'BLINDE', hp: 2, armed: false });
    for (const s of [-1, 1]) S.rows(S.d0, S.d1, 36, 0.4, (dc) => S.item(dc, () => { S.cyl(dc, s * 17, 0, 0.2, 9, 'metal', '#8a8e96', 6, 0.2, false); S.bx(dc, s * 15.6, 9, 3, 0.4, 0.4, 'metal', '#8a8e96', false); }));
  } };

  // ---------- scènes empruntées aux autres zones, habillées par leur zone d'origine ----------
  const borrow = (name, zone, src, o) => {
    const def = Z.defs[zone], sc = def && def.scenes[src]; if (!sc) return;
    campagne.scenes[name] = Object.assign({}, sc, { noDoor: true, noChaos: true, build(S) { if (def.dress && !(o && o.noDress)) def.dress(S); sc.build.call(this, S); if (o && o.foes) o.foes(S); } });
  };
  Z.evoBorrow = borrow;
  // les ennemis des scènes empruntées sont ajoutés dans levelmode d'évolution (evo.js), par nom
  Z.evoFoeLib = { foe };
})();
