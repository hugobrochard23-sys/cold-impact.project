/* v121 : MODE « EVOLUTION » (?evo=1) — un seul écran, un seul but : aller le plus loin en éclatant des ennemis rares.
 * Boucle : on lance la fusée (barre de timing : vue de derrière, le curseur va et vient, toucher quand il est au centre ; centre doré = lancer parfait),
 * on la dirige au doigt (commandes libres, aucune aide), on détruit des ennemis (chacun a sa mécanique : en hauteur, caché, mobile, blindé…),
 * quand il n'y a plus de carburant elle tombe. Chaque ennemi détruit pousse la fusée vers l'avant (souffle) ; avec un réacteur il rend aussi du carburant.
 * Trois améliorations, par barres de 5 : à la 5e la pièce évolue avec une animation (zoom sur la fusée, la pièce apparaît) :
 *   FUSEE (20 barres) : tube de carton → AILES (elle plane) → REACTEUR (poussée, carburant) → TURBO ;
 *   LANCEUR (15) : rampe en bois → rail → catapulte (vitesse de départ, zone verte plus large) ;   PIECES (5) : multiplicateur de pièces.
 * Le monde est la zone CAMPAGNE (src/world/zones_evo.js) : grands espaces, puis des morceaux de canyon, barrage, souterrain, base de lancement, base aérienne. */
(function () {
  const U = CC.U, V = THREE.Vector3;
  const EVO = CC.EVO = { on: /[?&]evo=1/.test(location.search) };
  if (!EVO.on) return;
  const C = CC.CONFIG;
  C.pad.chargeTime = 0.55; C.pad.reloadTime = 0.35;
  C.pad.cam = [0, 1.5, 3.3]; C.pad.look = [0, -3.3, -5.5]; C.pad.fov = 54; C.pad.pushIn = 0.08;   // lanceur vu de derrière : on voit tout le monde devant
  C.endless.fuelDrain = 1;
  C.endless.zoneLen = 14000;                                                                       // tout le niveau 1 tient dans la zone campagne
  C.camera.distance = 3.8; C.camera.height = 1.05; C.camera.boostPull = 0.8;                       // la fusée est petite, le monde est grand

  const RK_TIERS = ['TUBE DE CARTON', 'AVION A AILES', 'REACTEUR', 'TURBO'], LA_TIERS = ['RAMPE EN BOIS', 'RAIL', 'CATAPULTE'];
  const RK_NEXT = ['AILES', 'REACTEUR', 'TURBO', 'MAX'], LA_NEXT = ['RAIL', 'CATAPULTE', 'MAX'];
  const COIN_COST = [150, 250, 420, 700, 1100];
  const MAXN = { rk: 99999, la: 99999, cm: 99999 };   // v158 : plus de maximum : le carburant grandit avec chaque amelioration, a l'infini
  const BOSS_HP = 16;
  const CH_NAME = { rampe: 'LE DEPART', camp: 'LE CAMP', riviere: 'LA RIVIERE', foret: 'LA FORET', vallee: 'LA VALLEE', grotte: 'LA GROTTE', falaise: 'LA FALAISE', entrepots: 'LES ENTREPOTS', base: 'LA BASE', descente: 'LA DESCENTE', ville: 'LA VILLE', approche: 'LE SIEGE', porte: 'LE GARDIEN', noyau: 'LE NOYAU', fuite: 'LA FUITE' };
  const SCENES = ['rampe', 'camp', 'riviere', 'foret', 'descente', 'ville', 'approche', 'porte', 'noyau', 'fuite'];
  EVO.RK_TIERS = RK_TIERS; EVO.LA_TIERS = LA_TIERS; EVO.RK_NEXT = RK_NEXT; EVO.LA_NEXT = LA_NEXT; EVO.MAXN = MAXN;

  // ---------- sauvegarde ----------
  EVO.save = (g) => {
    const S = g.save.evo = g.save.evo || { coins: 0, rk: 0, la: 0, cm: 0, best: 0, runs: 0, kills: 0, cleared: 0 };
    if (S.t0 === undefined) { S.t0 = 0; S.marks = {}; }
    if (S.gems === undefined) { S.gems = 0; S.chestAt = 0; }
    if (!S.seen) S.seen = {};
    if (!EVO._cheat) {
      EVO._cheat = 1; const q = (k) => { const m = new RegExp('[?&]' + k + '=(\\d+)').exec(location.search); return m ? parseInt(m[1], 10) : null; };
      const a = q('evocoins'); if (a !== null) S.coins = a; const b = q('evork'); if (b !== null) S.rk = b; const c = q('evola'); if (c !== null) S.la = c; const d = q('evocm'); if (d !== null) S.cm = d;
    }
    return S;
  };
  EVO.mark = (g, key) => { const S = EVO.save(g); if (S.marks[key]) return; S.marks[key] = { run: S.runs + 1, sec: S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0 }; };
  EVO.elapsed = (g) => { const S = EVO.save(g); return S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0; };
  EVO.fmt = (sec) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  EVO.reset = (g) => {
    g.save.evo = undefined; EVO._cheat = 1; const S = EVO.save(g); g.evoLast = null; g.evoBought = null; g.evoResetArm = 0; g.evoAnim = null;
    if (g.rocket) EVO.applySkin(g); if (g.pad) EVO.dressPad(g.pad);
    g.writeSave(); g.audio.play('uiTick'); g.telemetry.event('evoReset', {}); if (EVO.startIntro) EVO.startIntro(g); return S;
  };

  // ---------- statistiques ----------
  // FUSEE : palier (0 tube, 1 ailes, 2 réacteur, 3 turbo) et barre dans le palier. Les ailes (portance) montent de 0,55 à 1 pendant le palier 1.
  EVO.rocket = (n) => {
    const tier = Math.min(3, Math.floor(n / 5)), s = Math.min(5, n - 5 * tier), wing = tier >= 1 ? Math.min(1, 0.55 + 0.1 * Math.min(n - 5, 4.5)) : 0;
    const vmax = tier >= 2 ? [0, 0, 34, 38][tier] + 0.8 * s : 0, drag = tier >= 1 ? 0.0078 - 0.0042 * wing : 0.0100 - 0.0006 * s;
    return { n, tier, s, name: RK_TIERS[tier], wing, vmax, drag, thrust: vmax * vmax * drag, gripOff: tier >= 1 ? 1.2 + 4.5 * wing : 0.7,
      dmg: 1.2 + 0.2 * n + 0.4 * tier, fuel: tier >= 2 ? 10 + 3.5 * (n - 10) : 0, refuel: 0, kick: tier === 0 ? 4 : tier === 1 ? 8 : 5 };
  };
  EVO.launcher = (n) => { const tier = Math.min(2, Math.floor(n / 5)); return { n, tier, s: Math.min(5, n - 5 * tier), name: LA_TIERS[tier], speed: 30 + 1.2 * Math.min(n, 15) + 1.5 * tier, fuelBonus: 1.5 * Math.max(0, n - 15) }; };
  EVO.mult = (n) => 1 + 0.25 * n;   // v130 : chaque niveau de PIECES rapporte +25 % : il se rembourse en 2 vols
  EVO.cost = (id, n) => (id === 'rk' ? Math.round(90 * Math.pow(1.27, Math.min(n, 19)) * Math.pow(1.12, Math.max(0, n - 19))) : id === 'la' ? Math.round(70 * Math.pow(1.27, Math.min(n, 14)) * Math.pow(1.12, Math.max(0, n - 14))) : n < 5 ? COIN_COST[n] : Math.round(1100 * Math.pow(1.45, n - 4)));   // v129 : les premieres ameliorations (ailes) arrivent en 2-3 vols
  EVO.nextCost = (g, id) => { const S = EVO.save(g), n = S[id]; return n >= MAXN[id] ? null : EVO.cost(id, n); };
  EVO.dmgNow = (g) => { const r = EVO.rocket(EVO.save(g).rk), sp = g.rocket && g.rocket.active ? g.rocket.vel.length() : 38; return r.dmg * U.clamp(sp / 38, 0.9, 1.5); };
  EVO.canKill = (g, t) => !!(g.evo && g.evo.preview) || !t.evoHp || EVO.dmgNow(g) + 0.001 >= t.evoHp;

  // ---------- fiches de niveau ----------
  const base = (o) => Object.assign({ n: 101, seed: 5151, chest: 0, winKills: 1e9, tutD: [], tutRel: null, mids: [], event: null, env: 'campagneDay', nightOk: false, look: 0, kit: 0, dens: 1, difK: 0.5, ease: 0.3, tgtGap: 50,
    hp: BOSS_HP, boss: 'gunship', bossEnt: 'sky', bossWall: false, bossTint: 0, bossVar: 0, chapter: 1, evo: true }, o);
  EVO.baseDef = base;
  EVO.levelDef = (g) => {
    if (EVO.stage && EVO.stage(g) === 2 && EVO.levelDef2) return EVO.levelDef2(g);
    const th = CC.LM.THEMES[0];
    if (g.evoPreview) return base({ n: 102, zone: 'jungle', seed: 777, len: 1100, scenes: null, order: new Array(90).fill('jungle'), theme: th, env: null, hp: 1, bossEnt: null, preview: true });
    const q = /[?&]evoscenes=([\w,]+)/.exec(location.search), sc = q ? q[1].split(',') : SCENES, Zs = CC.Zones.defs.campagne.scenes;
    let len = 80; EVO.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { EVO.chapters.push({ d: len - 80, i: EVO.chapters.length, name: CH_NAME[n] || n.toUpperCase(), key: n }); if (s.sub) for (const q of s.sub) if (q.u > 0) EVO.chapters.push({ d: len - 80 + q.u * s.len[0], i: EVO.chapters.length, name: q.name, key: q.key }); len += s.len[0]; } }
    return base({ zone: 'campagne', len: q ? len + 400 : len, scenes: sc, order: new Array(90).fill('campagne'), theme: th });
  };

  // ---------- la fusée : apparence par palier + pièces qui apparaissent (ailes, empennage, volets, propulseurs) ----------
  const SKIN_C = [
    { c: { body: '#b8925e', nose: '#c9a46c', tip: '#e8dcc0', band: '#6e5230', fin: '#8a6a44', nozzle: '#6a5030' }, cap: true },
    { c: { body: '#b8925e', nose: '#c9a46c', tip: '#e8dcc0', band: '#6e5230', fin: '#8a6a44', nozzle: '#6a5030' }, cap: true },
    { c: { body: '#e4e6ea', nose: '#e4e6ea', tip: '#e02a1c', band: '#f3cf00', fin: '#8a8f96', nozzle: '#3d3f43' }, cap: false },
    { c: { body: '#f2f3f5', nose: '#f2f3f5', tip: '#ffd23a', band: '#e0402c', fin: '#e0402c', nozzle: '#2b2d31' }, cap: false, flame: '#7be8ff' },
  ];
  for (let i = 0; i < SKIN_C.length; i++) {
    const d = SKIN_C[i], s = { id: 'evoT' + i, name: 'evoT' + i, short: 'evoT' + i, tier: 'base', price: 0, tierLabel: '', c: Object.assign({}, d.c), flame: d.flame || '#ff8a2a',
      dims: { r: i < 2 ? 0.1 : 0.085, len: i < 2 ? 0.8 : 1.0, noseLen: i < 2 ? 0.26 : 0.38, noseR: i < 2 ? 0.07 : 0.012, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 },
      parts: d.cap ? [{ k: 'cyl', r: 0.108, h: 0.14, p: [0, 0, -0.42], rot: [90, 0, 0], c: '#a8844f' }, { k: 'box', w: 0.215, h: 0.05, d: 0.2, p: [0, 0, 0.1], c: '#e8d8a8' }] : [] };
    CC.Skins.byId[s.id] = s;
  }
  let _pm = null;
  const PM = () => _pm || (_pm = { card: new THREE.MeshLambertMaterial({ color: '#c8a46e' }), cardD: new THREE.MeshLambertMaterial({ color: '#8a6a44' }), white: new THREE.MeshLambertMaterial({ color: '#eceef2' }), red: new THREE.MeshLambertMaterial({ color: '#d8402c' }),
    blue: new THREE.MeshLambertMaterial({ color: '#2a7ad0' }), dark: new THREE.MeshLambertMaterial({ color: '#2b2d31' }), steel: new THREE.MeshLambertMaterial({ color: '#9aa0a8' }) });
  function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
  function cyl(rt, rb, h, mat, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; }
  // chaque pièce est un groupe dont l'échelle (0 → 1) est animée ; la clé donne le palier où elle apparaît
  // v140 : c'est un MISSILE : quatre ailerons en croix (grands ailerons en delta au milieu, petits ailerons arrière décalés de 45°), plaques rouges aux bouts
  function finGeo(rootC, tipC, span, sweep, th) {
    const sh = new THREE.Shape(); sh.moveTo(-rootC / 2, 0); sh.lineTo(rootC / 2, 0); sh.lineTo(rootC / 2 - sweep, span); sh.lineTo(rootC / 2 - sweep - tipC, span); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); g.translate(0, 0, -th / 2);   // plan (z du corps, envergure y), épaisseur x
    g.rotateY(Math.PI / 2); return g;
  }
  function fins(mat, matTip, rootC, tipC, span, sweep, z, ang0, withTip) {
    const grp = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const f = new THREE.Group(); f.rotation.z = ang0 + k * Math.PI / 2; grp.add(f);
      const m = new THREE.Mesh(finGeo(rootC, tipC, span, sweep, 0.022), mat); m.position.set(0, 0.085, z); f.add(m);
      if (withTip) { const t = new THREE.Mesh(finGeo(tipC * 0.9, tipC * 0.6, 0.06, 0.02, 0.026), matTip); t.position.set(0, 0.085 + span - 0.06, z - sweep - tipC * 0.05); f.add(t); }
    }
    return grp;
  }
  EVO.finGeo = finGeo;
  function buildParts(tier) {
    const M = PM(), root = new THREE.Group(), P = {};
    const wm = tier >= 2 ? M.white : M.card;
    const wings = fins(wm, M.red, 0.36, 0.14, 0.34, 0.12, -0.02, 0, false);
    const tail = fins(wm, M.red, 0.22, 0.09, 0.2, 0.08, -0.36, Math.PI / 4, false);
    const flaps = new THREE.Group(); { const f = fins(M.red, M.red, 0.3, 0.1, 0.075, 0.02, -0.02, 0, false); f.children.forEach((c) => { c.children[0].position.y = 0.085 + 0.27; }); flaps.add(f); }
    const boost = new THREE.Group(); for (const s of [-1, 1]) { boost.add(cyl(0.05, 0.05, 0.62, M.red, s * 0.2, -0.05, -0.12)); boost.add(cyl(0.0, 0.05, 0.14, M.white, s * 0.2, -0.05, 0.28)); boost.add(cyl(0.04, 0.055, 0.1, M.dark, s * 0.2, -0.05, -0.47)); }
    P.wings = wings; P.tail = tail; P.flaps = flaps; P.boost = boost;
    for (const k of Object.keys(P)) { P[k].userData.k = 0; root.add(P[k]); }
    root.userData.P = P; return root;
  }
  const PART_TIER = { wings: 1, tail: 1, flaps: 3, boost: 3 };
  EVO.attachParts = (g) => {
    const rk = g.rocket, r = EVO.rocket(EVO.save(g).rk);
    if (rk.mesh.userData.evoParts) rk.mesh.remove(rk.mesh.userData.evoParts);
    const root = buildParts(r.tier); rk.mesh.add(root); rk.mesh.userData.evoParts = root; g.evoParts = root.userData.P;
    for (const k of Object.keys(g.evoParts)) { const on = r.tier >= PART_TIER[k]; g.evoParts[k].userData.k = on ? 1 : 0; g.evoParts[k].scale.setScalar(on ? 1 : 0.0001); g.evoParts[k].visible = on; }
    rk.mesh.userData.finTips = r.tier >= 1 ? [new V(0.44, 0, -0.18), new V(-0.44, 0, -0.18), new V(0, 0.44, -0.18), new V(0, -0.44, -0.18)] : [];   // bouts d'ailes : traînées de condensation
    rk.mesh.scale.setScalar(1 + 0.012 * r.n);
  };
  // v159 : LIVREES : une fois la fusee au bout de ses ameliorations (niveau 20), on peut en changer l'apparence ; une nouvelle s'ouvre tous les 5 niveaux
  EVO.LIVERIES = [
    { id: 'classic', name: 'CLASSIQUE', at: 20, body: '#f2f3f5', nose: '#f2f3f5', tip: '#ffd23a', band: '#e0402c', fin: '#e0402c', acc: '#d8402c', wh: '#eceef2', flame: '#7be8ff' },
    { id: 'gold', name: 'OR', at: 25, body: '#f0c43c', nose: '#fff0a8', tip: '#ffffff', band: '#a8741a', fin: '#c8901c', acc: '#b8821a', wh: '#f5d36a', flame: '#ffe27a' },
    { id: 'stealth', name: 'FURTIVE', at: 30, body: '#2b3038', nose: '#3a414c', tip: '#ff3a3a', band: '#ff3a3a', fin: '#1c2026', acc: '#1c2026', wh: '#3a414c', flame: '#ff6a5a' },
    { id: 'neon', name: 'NEON', at: 35, body: '#141c2a', nose: '#1c2a40', tip: '#31e6ff', band: '#31e6ff', fin: '#0e8fb0', acc: '#31e6ff', wh: '#1c2a40', flame: '#31e6ff' },
    { id: 'toxic', name: 'TOXIQUE', at: 40, body: '#dff5c8', nose: '#9adf5a', tip: '#3acc3a', band: '#2a9a2a', fin: '#3acc3a', acc: '#3acc3a', wh: '#e8f8d8', flame: '#9aff6a' },
    { id: 'galaxy', name: 'GALAXIE', at: 45, body: '#2a1a58', nose: '#4a2a8a', tip: '#ff7af0', band: '#c050ff', fin: '#c050ff', acc: '#c050ff', wh: '#4a2a8a', flame: '#d08aff' },
    { id: 'coral', name: 'CORAIL', at: 50, body: '#ffe4d6', nose: '#ffb59a', tip: '#ff7a5a', band: '#ff7a5a', fin: '#ff7a5a', acc: '#ff7a5a', wh: '#fff0e8', flame: '#ffb08a' },
  ];
  for (const L of EVO.LIVERIES) for (const t of [2, 3]) { const b = CC.Skins.byId['evoT' + t]; CC.Skins.byId['evoT' + t + L.id] = Object.assign({}, b, { id: 'evoT' + t + L.id, name: 'evoT' + t + L.id, short: 'evoT' + t + L.id, c: Object.assign({}, b.c, { body: L.body, nose: L.nose, tip: L.tip, band: L.band, fin: L.fin }), flame: t === 3 ? L.flame : b.flame }); }
  EVO.livery = (g) => { const S = EVO.save(g), L = EVO.LIVERIES.find((q) => q.id === S.livery) || EVO.LIVERIES[0]; return S.rk >= L.at ? L : EVO.LIVERIES[0]; };
  EVO.setLivery = (g, id) => { const S = EVO.save(g), L = EVO.LIVERIES.find((q) => q.id === id); if (!L || S.rk < L.at) return false; S.livery = id; g.writeSave(); EVO.applySkin(g); g.audio.play('levelUp'); return true; };
  EVO.applySkin = (g) => {
    const r = EVO.rocket(EVO.save(g).rk), L = EVO.livery(g), M = PM(); M.red.color.set(r.tier >= 2 ? L.acc : '#d8402c'); M.white.color.set(r.tier >= 2 ? L.wh : '#eceef2');
    g.rocket.setSkin(CC.Skins.get('evoT' + r.tier + (r.tier >= 2 && L.id !== 'classic' ? L.id : ''))); EVO.attachParts(g);
  };
  // lanceur : anneaux d'accélération le long du rail, de plus en plus nombreux et lumineux
  EVO.dressPad = (pad) => {
    if (pad.evoG) { pad.cradle.remove(pad.evoG); pad.evoG.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    const g = CC.game, la = EVO.launcher(EVO.save(g).la), G = pad.evoG = new THREE.Group(); pad.cradle.add(G);
    const mk = (w, h, d, color, x, y, z, basic) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color })); m.position.set(x, y, z); G.add(m); return m; };
    if (la.tier === 0) { mk(0.5, 0.06, 4.4, '#9a7448', 0, -0.285, -0.75); for (let i = 0; i < 9; i++) mk(0.52, 0.02, 0.03, '#6e5230', 0, -0.25, 1.2 - i * 0.5); }
    // v152 : acceleration = vrais anneaux lisses (acier + liseret lumineux + halo) sur deux rails de guidage, plus de cadres carres
    if (la.tier >= 1) {
      const col = ['#FFE600', '#FFE600', '#ffffff'][la.tier], n = [0, 3 + la.s, 4 + la.s][la.tier], hw = 0.34 + (la.tier > 1 ? 0.04 : 0);
      const steel = new THREE.MeshLambertMaterial({ color: la.tier > 1 ? '#3a4250' : '#566070' }), lite = new THREE.MeshBasicMaterial({ color: col }), halo = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
      for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5 + n * 0.55), steel); r.position.set(sx * (hw + 0.02), -0.2, 0.2 - (n - 1) * 0.275); G.add(r); const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.3 + n * 0.55), lite); s2.position.set(sx * (hw + 0.02), -0.15, 0.2 - (n - 1) * 0.275); G.add(s2); }
      for (let i = 0; i < n; i++) { const z = 0.2 - i * 0.55, k = 1 - i / (n + 2) * 0.3; const t1 = new THREE.Mesh(new THREE.TorusGeometry(hw * k, 0.028, 8, 28), steel); t1.position.set(0, 0.0, z); G.add(t1); const t2 = new THREE.Mesh(new THREE.TorusGeometry(hw * k, 0.012, 6, 28), lite); t2.position.set(0, 0, z + 0.03); G.add(t2); const t3 = new THREE.Mesh(new THREE.TorusGeometry(hw * k, 0.07, 6, 28), halo); t3.position.set(0, 0, z); G.add(t3); }
    }
    // v159 : le PISTON de lancement : un verin derriere la fusee ; on le recule en maintenant le doigt, on le lache pour la propulser
    { const steel = new THREE.MeshLambertMaterial({ color: '#4a5260' }), dark = new THREE.MeshLambertMaterial({ color: '#272b33' }), chrome = new THREE.MeshLambertMaterial({ color: '#b8c0cc' }), ring = new THREE.MeshBasicMaterial({ color: '#FFE600' }), P = pad.piston = new THREE.Group(); G.add(P);
      const cyl = (rt, rb, h, m, z) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), m); o.rotation.x = Math.PI / 2; o.position.z = z; P.add(o); return o; };
      cyl(0.27, 0.27, 1.1, dark, 3.1); cyl(0.3, 0.3, 0.12, steel, 2.58); cyl(0.3, 0.3, 0.12, steel, 3.62);
      P.userData.rod = cyl(0.055, 0.055, 1, chrome, 2); P.userData.head = cyl(0.2, 0.2, 0.14, steel, 1.0); P.userData.glow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 24), ring); P.add(P.userData.glow);
      P.userData.coils = []; for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 18), chrome); P.add(t); P.userData.coils.push(t); }
      P.userData.ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 8, 28), ring); P.userData.ring.position.z = 2.58; P.add(P.userData.ring); }
  };
  EVO.pistonFrame = (g, dt) => {
    const pad = g.pad, P = pad && pad.piston; if (!P) return; const a = g.evoAim, ch = a ? (a.lock ? (a.ch || 0) * Math.max(0, 1 - a.lockT / 0.1) : a.ch || 0) : 0, slam = a && a.lock ? U.clamp(a.lockT / 0.1, 0, 1) : 0;
    const zh = 1.0 + 0.85 * ch - slam * 0.55, d = P.userData; d.head.position.z = zh; d.glow.position.z = zh + 0.1; d.rod.scale.y = Math.max(0.1, 2.58 - zh); d.rod.position.z = (zh + 2.58) / 2;
    for (let i = 0; i < d.coils.length; i++) d.coils[i].position.z = zh + 0.12 + (2.5 - zh) * (i + 0.5) / d.coils.length;
    const hot = Math.min(1, ch * 1.15), col = _pc.setRGB(1, 0.9 - 0.73 * hot * hot, 0.17 * hot * hot); d.glow.material.color.copy(col); d.ring.material.color.copy(col);
    if (a && a.hold && !a.lock && ch > 0.55 && g.effects && Math.random() < dt * (6 + 30 * ch)) { const o = pad.origin; g.effects.smoke.emit({ pos: new V(o.x + (Math.random() - 0.5) * 0.4, o.y + 0.2, o.z + 0.2), vel: new V((Math.random() - 0.5) * 1.5, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 1.5), life: 0.7 + Math.random() * 0.5, s0: 0.1, s1: 0.4, s2: 0.8, peak: 0.3, cols: g.effects.pal.smoke, drag: 1.6, a: 0.5, fin: 0.05, fout: 0.4, wind: 0, turb: 1, spin: 1 }); }
  };

  // ---------- animation d'évolution : zoom sur la fusée, la pièce apparaît avec des étincelles ----------
  const EASE = (k) => { k = U.clamp(k, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  EVO.playEvolve = (g, tier, label) => {
    EVO.applySkinOnly(g);
    for (const k of Object.keys(g.evoParts || {})) if (PART_TIER[k] === tier) { g.evoParts[k].userData.k = 0; g.evoParts[k].visible = false; g.evoParts[k].scale.setScalar(0.0001); }
    g.evoAnim = { t: 0, dur: 3.0, tier, label, popped: false };
    g.audio.play('padArm'); g.rig.shake = Math.max(g.rig.shake, 0.3);
  };
  EVO.applySkinOnly = (g) => { EVO.applySkin(g); };
  EVO.frame = (g, dt) => {
    if (g.evoTumble) EVO.tumbleFrame(g, dt);
    EVO.kbFrame(g); EVO.pistonFrame(g, dt);
    const wt = CC.Textures && CC.Textures.get && CC.Textures.get('water'); if (wt && wt.offset) wt.offset.y += dt * 0.12;   // v123 : l'eau coule (rivière, cascades)
    const A = g.evoAnim; if (!A) return;
    A.t += dt;
    const rk = g.rocket;
    if (A.t > 0.55 && !A.popped) {
      A.popped = true;
      for (const k of Object.keys(g.evoParts || {})) if (PART_TIER[k] === A.tier) { g.evoParts[k].visible = true; }
      g.audio.play('levelUp'); g.audio.play('clunk'); if (CC.Haptics) CC.Haptics.pattern('levelUp');
      g.flash = 0.35; g.flashColor = '#ffe9b0'; g.rig.shake = Math.max(g.rig.shake, 0.9);
      const fx = g.effects, p = rk.pos;
      for (let i = 0; i < 60; i++) fx.sparks.emit({ pos: p, vel: new V(U.fx.range(-1, 1), U.fx.range(-0.2, 1.1), U.fx.range(-1, 1)).multiplyScalar(U.fx.range(2, 9)), life: U.fx.range(0.3, 0.9), s0: 0.04, s1: 0.05, s2: 0.01, cols: fx.pal.ember, drag: 1.2, grav: 3, a: 1, fout: 0.4 });
      fx.ring(p, new V(0, 1, 0), 0.3, 5, 0.5, '#ffd23a', 0.8); fx.ring(p, new V(1, 0, 0), 0.3, 4, 0.5, '#ffffff', 0.7);
    }
    if (A.popped) for (const k of Object.keys(g.evoParts || {})) if (PART_TIER[k] === A.tier) { const e = EASE((A.t - 0.55) / 0.7); g.evoParts[k].scale.setScalar(Math.max(0.0001, e)); g.evoParts[k].userData.k = 1; }
    if (A.t > A.dur) g.evoAnim = null;
  };
  EVO.camHook = (g, rig, o) => {
    const A = g.evoAnim;
    // v152 : menu : la fusee est vue de trois quarts avant, en haut de l'ecran (les cartes sont dessous) ; la vue de dessus du tir revient pendant la visee
    { const now = performance.now(), dtm = Math.min(0.1, (now - (g._mk0 || now)) / 1000); g._mk0 = now; const want = (g.ui && g.ui.overlay === 'evo' && !g.evoAim && !A) ? 1 : 0; g._mk = (g._mk || 0) + (want - (g._mk || 0)) * Math.min(1, dtm * 2.6);
      if (g._mk > 0.003 && g.pad) { const e = g._mk * g._mk * (3 - 2 * g._mk), kf = 1 + 0.02 * Math.min(40, EVO.save(g).rk), dir = g.pad.dir, up = new V(0, 1, 0), right = new V().crossVectors(dir, up).normalize(), sw = Math.sin(now / 2600) * 0.45;
        const p = new V().copy(o).addScaledVector(dir, (-3.9 + sw * 0.4) * kf).addScaledVector(right, (1.9 + sw * 0.4) * kf).addScaledVector(up, 0.3 * kf), look = new V().copy(o).addScaledVector(dir, 0.9).addScaledVector(up, -0.5 * kf);
        rig.padPos.lerp(p, e); rig.padLook.lerp(look, e); rig.padFov += (58 - rig.padFov) * e; } }
    if (!A) return;
    const k = U.smooth(0, 0.5, A.t) * (1 - U.smooth(A.dur - 0.7, A.dur, A.t)), ang = 0.6 + A.t * 0.55;
    const p = new V(o.x + Math.sin(ang) * 2.1, o.y + 0.55, o.z + Math.cos(ang) * 2.1), look = new V(o.x, o.y + 0.02, o.z - 0.05);
    rig.padPos.lerp(p, k); rig.padLook.lerp(look, k); rig.padFov += (32 - rig.padFov) * k;
  };

  // ---------- lancer : la barre de timing ----------
  EVO.startAim = (g) => {
    if (g.evoAim) return;
    g.ui.overlay = null; g.evoLast = null;
    g.evoAim = { c: -1, dir: 1, lock: false, lockT: 0, t: 0, mult: 1, word: '', zone: 'red' };
    g.evoLaunchMult = 1; g.pad.manual = true;
    if (g.state === 'MENU' && g.padMode) g.beginLaunch();
  };
  EVO.zones = (g) => { const la = EVO.launcher(EVO.save(g).la), run = EVO.save(g).runs, k = run < 2 ? 1.5 : 1; return { gold: 0.07 * (1 + 0.1 * la.n) * k, green: 0.24 * (1 + 0.08 * la.n) * k, yellow: 0.55 }; };
  // v159 : LANCEMENT AU PISTON : on maintient le doigt (la pression monte, le piston recule, la vapeur siffle), on relache pour propulser. Zone doree = poussee maximale ; trop attendre = surchauffe.
  const CHARGE_T = 1.7;
  EVO.pressZones = (g) => { const la = EVO.launcher(EVO.save(g).la), runs = EVO.save(g).runs, k = runs < 2 ? 1.5 : 1, w = 0.12 * (1 + 0.05 * Math.min(la.n, 15)) * k; return { gold0: 0.8 - w * 0.4, gold1: Math.min(0.97, 0.8 + w * 0.9), green0: 0.55, yel0: 0.25 }; };
  EVO.holdStart = (g) => {
    const a = g.evoAim; if (!a || a.lock || a.hold || a.auto || g.state !== 'LAUNCH') return;
    a.hold = true; a.ch = 0; a.tk = 0; g.audio.play('padArm'); if (CC.Haptics) CC.Haptics.tick('touch');
  };
  EVO.holdEnd = (g) => { const a = g.evoAim; if (a && a.hold && !a.lock) EVO.release(g, false); };
  EVO.release = (g, over) => {
    const a = g.evoAim; if (!a || a.lock) return; const Z = EVO.pressZones(g), c = a.ch || 0;
    a.lock = true; a.lockT = 0; a.hold = false;
    if (over) { a.zone = 'red'; a.mult = 0.8; a.word = 'SURCHAUFFE'; } else if (c >= Z.gold0 && c <= Z.gold1) { a.zone = 'gold'; a.mult = 1.3; a.word = 'PARFAIT !'; } else if (c >= Z.green0 && c < Z.gold0) { a.zone = 'green'; a.mult = 1.12; a.word = 'BIEN'; } else if (c > Z.gold1) { a.zone = 'yellow'; a.mult = 1.0; a.word = 'TROP LONG'; } else if (c >= Z.yel0) { a.zone = 'yellow'; a.mult = 0.9; a.word = 'MOYEN'; } else { a.zone = 'red'; a.mult = 0.7; a.word = 'FAIBLE'; }
    g.evoLaunchMult = a.mult; g.audio.play(a.zone === 'gold' ? 'levelUp' : 'target'); g.audio.play('boomSmall', g.pad.origin);
    g.rig.shake = Math.max(g.rig.shake, 0.5 + 0.4 * c); if (a.zone === 'gold') { g.flash = 0.35; g.flashColor = '#ffe9a0'; } if (CC.Haptics) CC.Haptics.pattern(a.zone === 'gold' ? 'levelUp' : 'fire');
    g.effects.ring(g.pad.origin.clone(), new V(0, 0, 1), 0.3, 5, 0.3, '#ffffff', 0.7);
  };
  EVO.lock = (g) => {   // ancien appel (niveau 2, tests) : relache immediat
    const a = g.evoAim; if (!a || a.lock || g.state !== 'LAUNCH') return;
    if (a.auto) { a.ch = 0.86; a.hold = true; }
    if (!a.hold) { a.hold = true; a.ch = 0.6; }
    EVO.release(g, false);
  };
  EVO.aimTick = (g, dt) => {
    const a = g.evoAim; if (!a) return;
    a.t += dt;
    if (a.hold && !a.lock) {
      const k = a.ch || 0; a.ch = Math.min(1.02, k + dt / CHARGE_T * (0.8 + 0.5 * k)); a.tk = (a.tk || 0) - dt;
      if (a.tk <= 0) { a.tk = 0.2 - 0.14 * a.ch; if (CC.Haptics) CC.Haptics.tick(a.ch > 0.8 ? 'warn' : 'touch'); try { if (g.audio.tone) g.audio.tone('triangle', 130 + 520 * a.ch, 140 + 540 * a.ch, 0.09, 0.05); } catch (e) { /* son facultatif */ } }
      g.rig.shake = Math.max(g.rig.shake, 0.08 * a.ch * a.ch);
      if (a.ch >= 1) EVO.release(g, true);
    } else if (!a.lock) a.ch = Math.max(0, (a.ch || 0) - dt * 2.5);
    g.pad.charge = U.clamp(0.1 + 0.9 * (a.ch || 0), 0, 1);
    if (a.lock) { a.lockT += dt; if (a.lockT > 0.14) { g.evoAimLast = a; g.pad.manual = false; g.fire(); g.evoAim = null; } }
  };
  EVO.launchSpeed = (g) => EVO.launcher(EVO.save(g).la).speed * (g.evoLaunchMult || 1);

  // ---------- vol ----------
  EVO.beginRun = (g) => {
    g.evoReport = false;
    g.l1run = { slow: 0, slowK: 0.4, slowDur: 0, slowT: 0, cool: 0, bossHits: 0, wall: 0, ph: 1, tAcc: 0, evo: true };
    g.evo = { kills: 0, coins: 0, preview: !!g.evoPreview, previewT: 14, fuelOut: false, chap: 1, chapCoins: 0, maxD: 0, bossHits: 0, scan: 0, perfect: false };
    g.progress.P.bestDist = EVO.save(g).best;
    g.settings.ctl = 'free';
    if (g.evoPreview) { if (g._ctlSave === undefined) g._ctlSave = 'free'; g.settings.ctl = 'simple'; }
  };
  EVO.onLaunch = (g) => {
    const S = EVO.save(g); if (!S.t0) S.t0 = Date.now();
    const rk = g.rocket, r = EVO.rocket(S.rk), ev = g.evo;
    rk.cfg.thrust = r.thrust; rk.cfg.dragK = r.drag; rk.cfg.gripEngineOff = r.gripOff; rk.cfg.grip = 9;
    { const Lc = EVO.launcher(S.la), f = r.fuel + (r.tier >= 2 ? Lc.fuelBonus : 0); rk.fuelMax = Math.max(0.01, f); rk.fuel = f; rk.throttle = true; }
    C.endless.fuelTarget = 0;   // v158 : un ennemi detruit ne rend aucun carburant
    if (g.evoAimLast && g.evoAimLast.zone === 'gold') rk.fuel = Math.min(rk.fuelMax, rk.fuel + rk.fuelMax * 0.2);
    if (ev && ev.preview) { rk.cfg.thrust = 44 * 44 * 0.0035; rk.cfg.dragK = 0.0035; rk.fuelMax = rk.fuel = 999; rk.shieldT = 9999; rk.cfg.gripEngineOff = 5; }
    g.telemetry.event('evoLaunch', { rk: S.rk, la: S.la, cm: S.cm, q: g.evoLaunchMult });
  };
  EVO.tick = (g, dt) => {
    const ev = g.evo, rk = g.rocket, run = g.endlessRun; if (!ev || !run || g.state !== 'FLIGHT' || !rk.active) { if (g.rig) g.rig.fallK = (g.rig.fallK || 0) * Math.max(0, 1 - dt * 4); return; }
    const S = EVO.save(g), r = EVO.rocket(S.rk), sp = rk.vel.length();
    ev.maxD = Math.max(ev.maxD, run.dist);
    C.endless.fuelTarget = 0;
    { const W = CC.Zones.evoWater; if (W) { const dy = rk.pos.y - W.y; if (W.prev !== undefined && W.prev * dy < 0 && run.dist > W.d0 - 30 && run.dist < W.d1 + 30) { const fx = g.effects, pp = rk.pos.clone(); pp.y = W.y; fx.ring(pp, new V(0, 1, 0), 0.4, 7, 0.6, '#d6eefc', 0.8); fx.ring(pp, new V(0, 1, 0), 0.2, 4, 0.45, '#ffffff', 0.7); g.rig.shake = Math.max(g.rig.shake, 0.25); g.audio.play('uiTick'); } W.prev = dy; } }
    const CH = EVO.chapters;   // v123 : bandeau et prime à chaque nouveau chapitre franchi
    if (CH && !ev.preview) while (ev.chap < CH.length && run.dist >= CH[ev.chap].d) { const c = CH[ev.chap++], b = Math.round(40 * c.i * EVO.mult(S.cm)); ev.chapCoins += b; CC.L1.msg(g, c.name, 1.6, '#ffe9a0'); g.audio.play('levelUp'); if (EVO.onChapter) EVO.onChapter(g, c, S); }
    // planeur : les ailes portent (elles annulent une partie de la gravité tant que la vitesse est suffisante)
    if (r.wing > 0 && !ev.preview) rk.vel.y += C.physics.gravity * r.wing * (r.tier >= 2 && rk.fuel <= 0.01 ? 0.25 : 0.62) * U.clamp((sp - 12) / 14, 0, 1.1) * dt;   // v125 : plus de carburant ou plus de vitesse = on pique   // v123 : lent = les ailes ne portent plus : elle pique, on peut redresser avec la vitesse reprise
    if (ev.preview) rk.vel.y += C.physics.gravity * 0.95 * U.clamp(sp / 17, 0, 1.1) * dt;
    // filet de sécurité : la fusée ne s'enfonce jamais dans le sol (elle roule dessus, le glissement la fait s'écraser)
    { const gyy = run.T.base(Math.max(0, run.dist)) + 0.32; if (rk.pos.y < gyy) { rk.pos.y = gyy; if (rk.vel.y < 0) rk.vel.y = 0; rk.sliding = Math.max(rk.sliding || 0, 0.03); } }
    // sans réacteur ou sans carburant : la fusée tombe ; au sol, le vol est fini
    const out = (r.tier < 2 || rk.fuel <= 0.01) && !ev.preview;
    if (out && !ev.preview && sp < 24 && rk.fwd.y > -0.55) g.input.addAim(0, -1.5 * U.clamp((24 - sp) / 8, 0, 1) * dt);   // v125 : décrochage : sans poussée et sans vitesse, le nez plonge (on récupère en reprenant de la vitesse)
    if (out && rk.sliding > 0 && (ev.slideT = (ev.slideT || 0) + dt) > 0.7) { ev.slideT = 0; g.onRocketCrash('stalled', rk.pos.clone(), null); return; }
    if (!out || rk.sliding <= 0) ev.slideT = 0;
    if (out && sp < 4 && g.flightTime > 1) { if ((ev.lowT = (ev.lowT || 0) + dt) > 1.2) { ev.lowT = 0; g.onRocketCrash('stalled', rk.pos.clone(), null); return; } } else ev.lowT = 0;   // v125 : immobile = fini
    if (r.tier >= 2 && !ev.fuelOut && !ev.preview && rk.fuel <= 0.01 && g.flightTime > 0.6) { ev.fuelOut = true; CC.L1.msg(g, 'PLUS DE CARBURANT', 1.3, '#ff8a5a'); }
    if (rk.fuel > 0.3) ev.fuelOut = false;
    // caméra de chute : on regarde vers le sol quand on tombe
    const falling = out && rk.vel.y < -3.5 && rk.pos.y > T0(g) + 4;
    g.rig.fallK = (g.rig.fallK || 0) + ((falling ? 1 : 0) - (g.rig.fallK || 0)) * Math.min(1, dt * 3);
    // nouveaux ennemis : un bandeau la première fois qu'on en voit un d'un type
    if ((ev.scan -= dt) <= 0) {
      ev.scan = 0.35;
      for (const t of g.targets) { if (!t.alive || !t.evoName || S.seen[t.evoName] || t.boss) continue; const d = t.obb ? t.obb.c.distanceTo(rk.pos) : 999; if (d < 150) { S.seen[t.evoName] = 1; CC.L1.msg(g, 'NOUVEAU : ' + t.evoName, 1.5, '#ffd23a'); break; } }
    }
    if (ev.preview && (ev.previewT -= dt) <= 0) {
      rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; g.evoPreview = false; if (g._ctlSave !== undefined) { g.settings.ctl = g._ctlSave; g._ctlSave = undefined; }
      g.evoLast = { zone2: true, t0: 0 }; g.goHome({});
    }
  };
  const T0 = (g) => (g.endlessRun ? g.endlessRun.T.base(Math.max(0, g.endlessRun.dist)) : 0);
  // chaque ennemi détruit : pièces, souffle qui pousse la fusée, carburant (réacteur)
  EVO.onKill = (g, t) => {
    const ev = g.evo; if (!ev || ev.preview) return;
    const S = EVO.save(g), r = EVO.rocket(S.rk), rk = g.rocket, m = EVO.mult(S.cm), c = Math.round((t.evoVal || (t.evoHp ? 200 : 80)) * m);
    ev.kills++; ev.coins += c;
    rk.vel.addScaledVector(rk.fwd, r.kick); rk.vel.y += 1.5;
    g.rig.punch = 1;
    (g.killPops = g.killPops || []).push({ p: t.obb ? t.obb.c.clone().add(new V(0, 3, 0)) : rk.pos.clone(), t0: performance.now() - 200, txt: '+' + c });
  };
  EVO.onBossHit = (g, t) => { if (g.evo) { g.evo.bossHits++; g.evo.coins += Math.round(150 * EVO.mult(EVO.save(g).cm)); } };

  // ---------- ligne du record : un rideau de lumière bleue qui sort du sol (dégradé : bleu en bas, transparent en haut) ----------
  let _beamTex = null;
  EVO.recordBeam = (b, T, gd) => {
    if (!_beamTex) { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(90,170,255,0)'); gr.addColorStop(0.7, 'rgba(90,170,255,0.45)'); gr.addColorStop(1, 'rgba(170,220,255,0.95)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 128); _beamTex = new THREE.CanvasTexture(c); }
    const hf = T.half(gd) + 4, m = new THREE.Mesh(new THREE.PlaneGeometry(2 * hf, 36), new THREE.MeshBasicMaterial({ map: _beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    const p = T.at(gd, 0, 18); m.position.set(p[0], p[1], p[2]); m.rotation.y = T.yawAcross(gd); m.renderOrder = 5; b.root.add(m);
  };

  // ---------- écrasement : la fusée perd ses ailes, sa queue, roule et rebondit ; un drapeau avec la distance se plante là où elle s'arrête ----------
  // v150 : un missile ne tue jamais : explosion, perte de vitesse et de carburant, puis 1,5 s de grace
  EVO.missileHit = (g, pos) => {
    const rk = g.rocket, now = performance.now(); if (!rk || !rk.active) return; if (g.evoMissT && now < g.evoMissT) return; g.evoMissT = now + 1500;
    const v = rk.vel.length(), nv = Math.max(Math.min(v, 30), v * 0.72); if (v > 1e-3) rk.vel.multiplyScalar(nv / v);
    if (rk.fuelMax > 0) rk.fuel = Math.max(0, rk.fuel - rk.fuelMax * 0.18);
    g.effects.explosion(pos.clone(), null, false, 'orange'); g.audio.play('boomSmall', pos); g.rig.shake = Math.max(g.rig.shake, 0.9); g.flash = 0.25; g.flashColor = '#ffb070';
    (g.killPops = g.killPops || []).push({ p: rk.pos.clone().add(new V(0, 2.5, 0)), t0: performance.now() - 200, txt: 'TOUCHE !' });
  };
  // v158 : ennemi plus fort que la fusee : il encaisse (sa barre de vie baisse), la fusee rebondit et l'ennemi recule ; on peut le retaper
  EVO.partialHit = (g, t, rk) => {
    const now = performance.now(), dmg = EVO.dmgNow(g); t.evoHpMax = t.evoHpMax || t.evoHp; t.evoHp = Math.max(0.1, Math.round((t.evoHp - dmg) * 100) / 100); t.evoCool = now + 900; t.hitCool = 0.9; t.evoHitT = now;
    const c = t.obb.c, n = new V().copy(rk.pos).sub(c); n.y = Math.max(n.y, 0.25 * n.length()); if (n.lengthSq() < 1e-6) n.set(0, 1, 0); n.normalize();
    const sp = rk.vel.length(); rk.vel.copy(n).multiplyScalar(Math.max(24, sp * 0.6)); if (rk.fwd) rk.fwd.copy(rk.vel).normalize();
    g.hitStop = 0.07; g.hitScale = 0.2; g.rig.shake = Math.max(g.rig.shake, 0.9); g.flash = 0.18; g.flashColor = '#ffe9c0';
    g.effects.explosion(c.clone().add(new V(0, 1.5, 0)), null, false, 'orange'); g.effects.ring(c.clone().add(new V(0, 1.5, 0)), n, 0.4, 7, 0.4, '#ffffff', 0.8); g.audio.play('boomSmall', c);
    t._kb = { t0: now, dir: n.clone().multiplyScalar(-1), done: 0 };
    (g.killPops = g.killPops || []).push({ p: c.clone().add(new V(0, 4, 0)), t0: now - 200, txt: '-' + (Math.round(dmg * 10) / 10) });
  };
  EVO.kbFrame = (g) => {
    const now = performance.now(); for (const t of g.targets) { const k = t._kb; if (!k || !t.object) continue; const e = Math.min(1, (now - k.t0) / 350), v = 1 - Math.pow(1 - e, 3), d = 3.2 * (v - k.done); k.done = v; t.object.position.addScaledVector(k.dir, d); if (e >= 1) t._kb = null; }
  };
  EVO.softCrash = (kind) => kind === 'stalled' || kind === 'weak' || kind === 'wall';
  const _tq = new THREE.Quaternion(), _ta = new V();
  const rr = (a, b) => a + Math.random() * (b - a);
  const _pc = new THREE.Color();
  const sparks = (g, p, n, sp) => { const fx = g.effects; for (let i = 0; i < n; i++) fx.sparks.emit({ pos: p, vel: new V(rr(-1, 1), rr(0.3, 1), rr(-1, 1)).multiplyScalar(rr(sp * 0.5, sp)), life: rr(0.3, 0.8), s0: 0.05, s1: 0.04, s2: 0.01, cols: fx.pal.ember, drag: 1.2, grav: 6, a: 1, fout: 0.4 }); };
  EVO.startTumble = (g, kind, pos) => {
    const rk = g.rocket, sc = g.scene, v0 = rk.vel.clone(), P = [];
    const add = (m, v, w, r) => { P.push({ m, v, w, r: r || 0.12, rest: false }); };
    const groups = g.evoParts || {};
    for (const k of Object.keys(groups)) {
      const grp = groups[k]; if (!grp.visible) continue;
      for (const ch of grp.children.slice()) {
        ch.updateWorldMatrix(true, false); const wp = new V(), wq = new THREE.Quaternion(), ws = new V(); ch.matrixWorld.decompose(wp, wq, ws); grp.remove(ch); sc.add(ch); ch.position.copy(wp); ch.quaternion.copy(wq); ch.scale.copy(ws);
        add(ch, v0.clone().multiplyScalar(0.55).add(new V(rr(-3, 3), rr(2, 7), rr(-3, 3))), new V(rr(-9, 9), rr(-9, 9), rr(-9, 9)), 0.22);
      }
    }
    const body = { m: rk.mesh, v: v0.clone().multiplyScalar(0.7), w: new V(0, 0, Math.random() < 0.5 ? 7 : -7), r: 0.4, rest: false, isBody: true };
    P.push(body); rk.mesh.visible = true;
    // éclats du tube : petits morceaux de bois / carton qui se détachent dès le premier choc
    { const cols = ['#b8925e', '#c9a46c', '#8a6a44', '#e8dcc0', '#6e5230'], bp = rk.pos.clone();
      for (let i = 0; i < 12; i++) { const sz = rr(0.06, 0.2), ch = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * rr(0.3, 0.8), sz * rr(1, 2.2)), new THREE.MeshLambertMaterial({ color: cols[i % cols.length] })); ch.position.copy(bp).add(new V(rr(-0.2, 0.2), rr(0, 0.3), rr(-0.3, 0.3))); ch.quaternion.setFromEuler(new THREE.Euler(rr(0, 6), rr(0, 6), rr(0, 6))); sc.add(ch);
        add(ch, v0.clone().multiplyScalar(rr(0.2, 0.6)).add(new V(rr(-4, 4), rr(2, 8), rr(-4, 4))), new V(rr(-14, 14), rr(-14, 14), rr(-14, 14)), sz * 0.6); } }
    g.evoTumble = { P, t: 0, dur: 3.1, flag: null, kind, body, v0: v0.clone() };
    g.audio.play('clunk', pos); g.rig.shake = 0.5; g.style.dropCombos();
    sparks(g, pos, 26, 10);
  };
  const plantFlag = (g, p, dist) => {
    const grp = new THREE.Group(), c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#d8402c'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 10); x.fillRect(0, 118, 256, 10); x.font = 'bold 66px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(dist + ' M', 128, 66);
    const tex = new THREE.CanvasTexture(c), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), new THREE.MeshLambertMaterial({ color: '#e8e8e8' })), cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    pole.position.y = 1.6; cloth.position.set(0.92, 2.65, 0); grp.add(pole, cloth); grp.position.copy(p); grp.userData.cloth = cloth; g.scene.add(grp); return grp;
  };
  EVO.endTumble = (g) => {
    const Tm = g.evoTumble; if (!Tm) return;
    for (const q of Tm.P) if (!q.isBody && q.m.parent) { q.m.parent.remove(q.m); if (q.m.geometry) q.m.geometry.dispose(); }
    if (Tm.flag) g.scene.remove(Tm.flag);
    g.evoTumble = null;
  };
  EVO.tumbleFrame = (g, dt) => {
    const Tm = g.evoTumble; if (!Tm) return; Tm.t += dt;
    const run = g.endlessRun, T = run && run.T, gy = T ? T.base(Math.max(0, run.dist)) : 0;
    for (const q of Tm.P) {
      if (q.rest) continue;
      q.v.y -= 16 * dt; q.m.position.addScaledVector(q.v, dt);
      const lim = gy + q.r * (q.isBody ? 1.2 : 1);
      if (q.m.position.y < lim) {
        q.m.position.y = lim;
        if (Math.abs(q.v.y) > 2.5) { q.v.y = -q.v.y * 0.32; if (Math.random() < 0.5) sparks(g, q.m.position, 3, 5); } else q.v.y = 0;
        const f = Math.max(0, 1 - (q.isBody ? 1.5 : 3.2) * dt); q.v.x *= f; q.v.z *= f; q.w.multiplyScalar(Math.max(0, 1 - 2.2 * dt));
        if (q.v.lengthSq() < 0.15 && q.w.lengthSq() < 0.5) q.rest = true;
      }
      const wl = q.w.length(); if (wl > 0.01) { _ta.copy(q.w).divideScalar(wl); _tq.setFromAxisAngle(_ta, wl * dt); q.m.quaternion.premultiply(_tq); }
      if (q.isBody && Math.random() < 0.5 && q.m.position.y < gy + 0.6) sparks(g, q.m.position, 1, 3);
    }
    g.rig.focus.copy(Tm.body.m.position);
    { const bp = Tm.body.m.position, bk = Tm.back || (Tm.back = new V(-Tm.v0.x, 0, -Tm.v0.z).normalize()); const want = new V(bp.x + bk.x * 4.2, Math.max(bp.y + 2.0, gy + 2.0), bp.z + bk.z * 4.2); g.rig.pos.lerp(want, 1 - Math.exp(-4 * dt)); g.camera.position.copy(g.rig.pos); }
    if (!Tm.flag && Tm.t > 2.15) {
      const p = Tm.body.m.position.clone(); p.y = gy; Tm.flag = plantFlag(g, p, Math.round(Math.max(0, run.dist))); Tm.flag.scale.y = 0.01; Tm.flagT = 0;
      g.effects.ring(p.clone().setY(gy + 0.2), new V(0, 1, 0), 0.3, 4, 0.5, '#ffffff', 0.7); g.audio.play('clunk', p); g.rig.shake = Math.max(g.rig.shake, 0.3);
    }
    if (Tm.flag) {
      Tm.flagT += dt; const k = Math.min(1, Tm.flagT / 0.35), e = 1 + 2.2 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
      Tm.flag.scale.y = Math.max(0.01, e); Tm.flag.userData.cloth.rotation.y = 0.25 * Math.sin(Tm.flagT * 7);
      Tm.flag.rotation.y = Math.atan2(g.camera.position.x - Tm.flag.position.x, g.camera.position.z - Tm.flag.position.z);
    }
  };

  // ---------- fin d'un vol : on revient sur le lanceur avec le récap ----------
  EVO.beginEnd = (g) => {
    EVO.endTumble(g);
    if (g.evo && g.evo.preview) { g.evoPreview = false; g.evoLast = { zone2: true, t0: 0 }; g.goHome({}); return; }
    const S = EVO.save(g), ev = g.evo || { kills: 0, coins: 0, maxD: 0 }, run = g.endlessRun, dist = Math.round(Math.max(ev.maxD, run ? run.dist : 0)), m = EVO.mult(S.cm);
    const distCoins = Math.floor(dist * 1.1 * m), lines = [['DISTANCE ' + dist + ' M', distCoins]];
    if (ev.kills) lines.push(['ENNEMIS ' + ev.kills, ev.coins - (ev.bossHits ? Math.round(150 * m) * ev.bossHits : 0)]);
    if (ev.bossHits) lines.push(['COUPS AU BOSS ' + ev.bossHits, Math.round(150 * m) * ev.bossHits]);
    if (ev.chapCoins) lines.push(['CHAPITRE ' + ev.chap + ' SUR ' + (EVO.chapters ? EVO.chapters.length : 1), ev.chapCoins]);
    const total = lines.reduce((a, l) => a + l[1], 0), record = dist > S.best;
    for (const mk of [100, 300, 600, 1000, 1500, 2000, 2500, 3000]) if (dist >= mk) EVO.mark(g, 'd' + mk);
    if (g.crashKind === 'weak') EVO.mark(g, 'weak');
    if (record) S.best = dist; S.coins += total; S.runs++; S.kills += ev.kills;
    const r = EVO.rocket(S.rk);
    g.evoLast = { dist, kills: ev.kills, lines, total, record, cause: g.crashKind === 'stalled' ? (r.tier >= 2 && g.rocket.fuel <= 0.5 ? 'PLUS DE CARBURANT' : 'ELLE EST TOMBEE') : g.causeOf(g.crashKind), doubled: false, t0: 0, crash: g.crashKind,
      detail: g.crashKind === 'weak' && g.evoWeak ? 'ENNEMI ' + g.evoWeak.hp + ' PV : TES DEGATS ' + g.evoWeak.dmg.toFixed(1) : g.crashKind === 'stalled' ? (r.tier >= 2 ? 'DETRUIS DES ENNEMIS POUR RECHARGER' : 'AMELIORE LA FUSEE : ELLE IRA PLUS LOIN') : 'GLISSE LE DOIGT POUR ESQUIVER' };
    g.writeSave();
    g.telemetry.event('evoEnd', { dist, kills: ev.kills, coins: total, rk: S.rk, la: S.la, cm: S.cm, cause: g.crashKind });
    g.evoReport = true; g.evoAdDone = false; g.ui.overlay = 'evoReport';   // v152 : le rapport de vol s'affiche sur le lieu du crash ; SUIVANT ramene au menu
  };
  // SUIVANT : mini pub de 5 s des le 5e vol (sauf pub de fin deja regardee), puis retour au menu
  EVO.afterReport = (g) => {
    if (!g.evoReport) return; const S = EVO.save(g);
    const go = () => { g.evoReport = false; g.evoLast = null; g.goHome({}); };
    if (S.runs >= 5 && !g.evoAdDone && g.ads && g.ads.forced()) { g.ui.overlay = null; g.ads.open('interstitial', go, null, 5); return; }
    go();
  };
  // v150 : la pub de fin de vol multiplie les pieces du vol par le multiplicateur lu sur le curseur (x1,5 a x4)
  EVO.multiply = (g, m) => { const L = g.evoLast; if (!L || L.doubled || !L.total) return; const extra = Math.round(L.total * (m - 1)); L.doubled = m; L.lines.push(['PUB X' + m, extra, performance.now()]); EVO.save(g).coins += extra; L.total += extra; L.popT = performance.now(); L.fx = { t0: performance.now(), n: extra }; g.evoAdDone = true; g.writeSave(); g.audio.play('target'); (g.killPops = g.killPops || []).length; };
  // gemmes : 1 gemme = 1 amelioration offerte quand les pieces manquent ; la 2e fois sur la meme amelioration (meme session) coute 2, la 3e 3...
  EVO.gemCost = (g, id) => ((g.evoGemUse && g.evoGemUse[id]) || 0) + 1;
  EVO.freeGemsUsed = (g) => { const S = EVO.save(g), d = new Date().toISOString().slice(0, 10); if (!S.gemFree || S.gemFree.day !== d) S.gemFree = { day: d, n: 0 }; return S.gemFree.n; };
  EVO.gemAd = (g, free) => { if (!g.ads) return; if (free && EVO.freeGemsUsed(g) >= 3) return; g.ads.rewarded(() => { const S = EVO.save(g); S.gems = (S.gems || 0) + 1; if (free) { EVO.freeGemsUsed(g); S.gemFree.n++; } g.writeSave(); g.audio.play('levelUp'); g.evoGemFx = { t0: performance.now(), n: 1 }; }, null, 'gem', '1 GEMME'); };
  EVO.buyGem = (g, id) => {
    const S = EVO.save(g), c = EVO.nextCost(g, id), gc = EVO.gemCost(g, id); if (c === null || g.evoAnim) return;
    const pay = () => { if ((S.gems || 0) < gc) return; S.gems -= gc; g.evoGemUse = g.evoGemUse || {}; g.evoGemUse[id] = (g.evoGemUse[id] || 0) + 1; EVO.buy(g, id, true); };
    if ((S.gems || 0) >= gc) pay(); else if (g.ads) g.ads.rewarded(() => { S.gems = (S.gems || 0) + 1; g.writeSave(); g.evoGemFx = { t0: performance.now(), n: 1 }; pay(); }, null, 'gem', '1 GEMME = 1 AMELIORATION');
  };
  // coffre : disponible des le 3e vol, puis toutes les 2 heures
  EVO.chestReady = (g) => { const S = EVO.save(g); return S.runs >= 3 && Date.now() >= (S.chestAt || 0); };
  EVO.openChest = (g) => {
    const S = EVO.save(g); if (!EVO.chestReady(g) || g.evoChest) return;
    const coins = Math.max(150, Math.round(EVO.cost('rk', S.rk) * 0.7)); S.coins += coins; S.gems = (S.gems || 0) + 1; S.chestAt = Date.now() + 2 * 3600 * 1000; g.writeSave();
    g.evoChest = { t0: performance.now(), coins, gems: 1 }; g.audio.play('levelUp'); g.audio.play('target'); if (CC.Haptics) CC.Haptics.tick('warn'); g.telemetry.event('evoChest', { coins });
  };
  EVO.start = (g) => { if (g.evoAnim || g.evoAim) return; EVO.startAim(g); };
  EVO.buy = (g, id, free) => {
    const S = EVO.save(g), c = EVO.nextCost(g, id);
    if (g.evoAnim) return false;
    if (c === null || (!free && S.coins < c)) { g.audio.play('uiTick'); g.evoShake = { id, t0: performance.now() }; return false; }
    const before = id === 'rk' ? EVO.rocket(S.rk).tier : id === 'la' ? EVO.launcher(S.la).tier : 0;
    if (!free) S.coins -= c; S[id]++; if (S[id] % 5 === 0) EVO.mark(g, id + S[id]); g.writeSave(); g.audio.play('levelUp'); if (CC.Haptics) CC.Haptics.tick('warn');
    const after = id === 'rk' ? EVO.rocket(S[id]).tier : id === 'la' ? EVO.launcher(S[id]).tier : 0;
    g.evoBought = { id, t0: performance.now() };
    if (id === 'rk') { if (after > before) EVO.playEvolve(g, after, RK_NEXT[before]); else { g.rocket.mesh.scale.setScalar(1 + 0.012 * EVO.rocket(S.rk).n); } }
    if (id === 'la' && g.pad) EVO.dressPad(g.pad);
    g.telemetry.event('evoBuy', { id, lvl: S[id] }); return true;
  };
  // boss vaincu : on vole un instant dans la zone suivante
  EVO.onClear = (g) => { const S = EVO.save(g); EVO.mark(g, 'boss'); S.cleared = (S.cleared || 0) + 1; S.coins += 600; g.writeSave(); g.evoPreview = true; g.evoClearBonus = 600; g.goHome({ autoLaunch: true }); };

  // ---------- affichage en vol : distance, PV des blindés ----------
  const _v = new V();
  EVO.drawHud = (hud, ctx, g, W, H, px) => {
    const F = CC.Font, ev = g.evo, run = g.endlessRun, rk = g.rocket; if (!ev || !run) return;
    const top = Math.max(10, H * 0.02);
    if (ev.preview) { F.draw(ctx, 'APERCU : ZONE 2', W / 2, top + px * 3, px * 1.1, '#9fe8b0', { align: 'center' }); return; }
    // distance : juste au-dessus de la fusée ; compteur de vitesse (cadran) en haut à gauche
    if (rk.active) { _v.set(rk.pos.x, rk.pos.y + 1.7 + 0.6 * (rk.mesh.scale.x || 1), rk.pos.z); CC.Curve.apply(_v, g.camera).project(g.camera); if (_v.z < 1 && _v.z > -1 && CC.Home.evoUI) CC.Home.evoUI.txt(ctx, Math.round(run.dist) + ' M', (_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H - px * 3, Math.max(15, H * 0.026), '#ffffff', { sw: 0.2 }); }
    if (CC.Home && CC.Home.evoUI && CC.Home.evoUI.hud) CC.Home.evoUI.hud(ctx, g, W, H, px);   // v159 : compteur, jauge de carburant et progression au style de la reference
    // v171 : un seul petit repere sur l'ennemi le plus proche + petit voyant rouge sur les autres (plus discret avec l'experience)
    if (rk.active && g.state === 'FLIGHT' && CC.UI2) { const UI2 = CC.UI2, tg = []; const rr = EVO.save(g).runs;
      for (const t of g.targets) { if (!t.alive || t.boss || t.mini || !t.obb || t.hazard) continue; const c = t.obb.c, d = c.distanceTo(rk.pos); if (d < 8 || d > 230) continue; _v.copy(c).sub(rk.pos); if (_v.dot(rk.fwd) < 0) continue; tg.push([d, t]); }
      tg.sort((a, b) => a[0] - b[0]); const u2 = H > W ? W : Math.min(W, H * 0.62); UI2.begin(u2, g.hudPr || 1); const blink = Math.floor(performance.now() / 380) % 2;
      for (let i = 0; i < Math.min(5, tg.length); i++) { const t = tg[i][1], d = tg[i][0], c = t.obb.c; _v.set(c.x, c.y + (t.size ? t.size[1] * 0.3 : 1), c.z); CC.Curve.apply(_v, g.camera).project(g.camera); if (_v.z > 1 || _v.z < -1) continue; const sx = (_v.x * 0.5 + 0.5) * W, sy = (-_v.y * 0.5 + 0.5) * H;
        ctx.fillStyle = UI2.THEME.red; ctx.globalAlpha = i === 0 || blink ? 0.95 : 0.55; ctx.beginPath(); ctx.arc(sx, sy, Math.max(2.5, UI2.S(i === 0 ? 9 : 6)), 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; } }
    const dmg = EVO.dmgNow(g);
    for (const t of g.targets) {
      if (!t.alive || t.boss || t.mini || !t.evoHp || !t.obb) continue;
      const c = t.obb.c, d = c.distanceTo(rk.pos); if (d > 190 || d < 4) continue;
      _v.set(c.x, c.y + (t.size ? t.size[1] * 0.5 : 2) + 2.4, c.z); CC.Curve.apply(_v, g.camera).project(g.camera); if (_v.z > 1 || _v.z < -1) continue;
      const sx = (_v.x * 0.5 + 0.5) * W, sy = (-_v.y * 0.5 + 0.5) * H, ok = dmg + 0.001 >= t.evoHp, s = px * U.clamp(2.0 - d / 120, 0.8, 1.7);
      if (t.evoHpMax && t.evoHp < t.evoHpMax) { const bw = s * 14, bh = Math.max(4, s * 1.5), bx = sx - bw / 2, by = sy - s * 6.4, f = U.clamp(t.evoHp / t.evoHpMax, 0, 1), fl = t.evoHitT && performance.now() - t.evoHitT < 300; ctx.fillStyle = 'rgba(8,10,14,0.75)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4); ctx.fillStyle = fl ? '#ffffff' : f > 0.5 ? '#46d86a' : f > 0.25 ? '#ffc531' : '#ff5a4a'; ctx.fillRect(bx, by, bw * f, bh); }
    }
  };
})();
