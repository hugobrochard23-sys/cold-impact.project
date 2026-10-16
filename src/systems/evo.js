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
  const MAXN = { rk: 20, la: 15, cm: 5 };
  const BOSS_HP = 16;
  const CH_NAME = { rampe: 'LE DEPART', camp: 'LE CAMP', riviere: 'LA RIVIERE', foret: 'LA FORET', vallee: 'LA VALLEE', grotte: 'LA GROTTE', falaise: 'LA FALAISE', entrepots: 'LES ENTREPOTS', base: 'LA BASE', descente: 'LA DESCENTE', ville: 'LA VILLE', approche: 'LE SIEGE', porte: 'LE GARDIEN', noyau: 'LE NOYAU', fuite: 'LA FUITE' };
  const SCENES = ['rampe', 'camp', 'riviere', 'foret', 'descente', 'ville', 'approche', 'porte', 'noyau', 'fuite'];
  EVO.RK_TIERS = RK_TIERS; EVO.LA_TIERS = LA_TIERS; EVO.RK_NEXT = RK_NEXT; EVO.LA_NEXT = LA_NEXT; EVO.MAXN = MAXN;

  // ---------- sauvegarde ----------
  EVO.save = (g) => {
    const S = g.save.evo = g.save.evo || { coins: 0, rk: 0, la: 0, cm: 0, best: 0, runs: 0, kills: 0, cleared: 0 };
    if (S.t0 === undefined) { S.t0 = 0; S.marks = {}; }
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
    const tier = Math.min(3, Math.floor(n / 5)), s = n - 5 * tier, wing = tier >= 1 ? Math.min(1, 0.55 + 0.1 * Math.min(n - 5, 4.5)) : 0;
    const vmax = tier >= 2 ? [0, 0, 34, 38][tier] + 0.8 * s : 0, drag = tier >= 1 ? 0.0078 - 0.0042 * wing : 0.0100 - 0.0006 * s;
    return { n, tier, s, name: RK_TIERS[tier], wing, vmax, drag, thrust: vmax * vmax * drag, gripOff: tier >= 1 ? 1.2 + 4.5 * wing : 0.7,
      dmg: 1.2 + 0.2 * n + 0.4 * tier, fuel: tier >= 2 ? [0, 0, 12, 20][tier] + [0, 0, 2, 2.6][tier] * s : 0, refuel: 3 + 0.15 * n, kick: tier === 0 ? 4 : tier === 1 ? 8 : 5 };
  };
  EVO.launcher = (n) => { const tier = Math.min(2, Math.floor(n / 5)); return { n, tier, s: n - 5 * tier, name: LA_TIERS[tier], speed: 30 + 1.2 * n + 1.5 * tier }; };
  EVO.mult = (n) => 1 + 0.25 * n;   // v130 : chaque niveau de PIECES rapporte +25 % : il se rembourse en 2 vols
  EVO.cost = (id, n) => (id === 'rk' ? Math.round(90 * Math.pow(1.27, n)) : id === 'la' ? Math.round(70 * Math.pow(1.27, n)) : COIN_COST[n]);   // v129 : les premieres ameliorations (ailes) arrivent en 2-3 vols
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
  EVO.applySkin = (g) => { const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoT' + r.tier)); EVO.attachParts(g); };
  // lanceur : anneaux d'accélération le long du rail, de plus en plus nombreux et lumineux
  EVO.dressPad = (pad) => {
    if (pad.evoG) { pad.cradle.remove(pad.evoG); pad.evoG.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    const g = CC.game, la = EVO.launcher(EVO.save(g).la), G = pad.evoG = new THREE.Group(); pad.cradle.add(G);
    const mk = (w, h, d, color, x, y, z, basic) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color })); m.position.set(x, y, z); G.add(m); return m; };
    if (la.tier === 0) { mk(0.5, 0.06, 4.4, '#9a7448', 0, -0.285, -0.75); for (let i = 0; i < 9; i++) mk(0.52, 0.02, 0.03, '#6e5230', 0, -0.25, 1.2 - i * 0.5); }
    const col = ['#ffb040', '#39d4ff', '#c07bff'][la.tier], n = [0, 3 + la.s, 4 + la.s][la.tier];
    for (let i = 0; i < n; i++) { const z = 0.2 - i * 0.55, hw = 0.3 + (la.tier > 1 ? 0.05 : 0); mk(0.05, hw * 2, 0.07, col, hw, 0.05, z, true); mk(0.05, hw * 2, 0.07, col, -hw, 0.05, z, true); mk(hw * 2, 0.05, 0.07, col, 0, hw + 0.05, z, true); }
    if (la.tier === 2) mk(0.5, 0.5, 0.5, '#58616d', 0, -0.05, 1.4);
  };

  // ---------- animation d'évolution : zoom sur la fusée, la pièce apparaît avec des étincelles ----------
  const EASE = (k) => { k = U.clamp(k, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  EVO.playEvolve = (g, tier, label) => {
    EVO.applySkinOnly(g);
    for (const k of Object.keys(g.evoParts || {})) if (PART_TIER[k] === tier) { g.evoParts[k].userData.k = 0; g.evoParts[k].visible = false; g.evoParts[k].scale.setScalar(0.0001); }
    g.evoAnim = { t: 0, dur: 3.0, tier, label, popped: false };
    g.audio.play('padArm'); g.rig.shake = Math.max(g.rig.shake, 0.3);
  };
  EVO.applySkinOnly = (g) => { const r = EVO.rocket(EVO.save(g).rk); g.rocket.setSkin(CC.Skins.get('evoT' + r.tier)); EVO.attachParts(g); };
  EVO.frame = (g, dt) => {
    if (g.evoTumble) EVO.tumbleFrame(g, dt);
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
    const A = g.evoAnim; if (!A) return;
    const k = U.smooth(0, 0.5, A.t) * (1 - U.smooth(A.dur - 0.7, A.dur, A.t)), ang = 0.6 + A.t * 0.55;
    const p = new V(o.x + Math.sin(ang) * 2.1, o.y + 0.55, o.z + Math.cos(ang) * 2.1), look = new V(o.x, o.y + 0.02, o.z - 0.05);
    rig.padPos.lerp(p, k); rig.padLook.lerp(look, k); rig.padFov += (32 - rig.padFov) * k;
  };

  // ---------- lancer : la barre de timing ----------
  EVO.startAim = (g) => {
    g.ui.overlay = null; g.evoLast = null;
    g.evoAim = { c: -1, dir: 1, lock: false, lockT: 0, t: 0, mult: 1, word: '', zone: 'red' };
    g.evoLaunchMult = 1; g.pad.manual = true;
    if (g.state === 'MENU' && g.padMode) g.beginLaunch();
  };
  EVO.zones = (g) => { const la = EVO.launcher(EVO.save(g).la), run = EVO.save(g).runs, k = run < 2 ? 1.5 : 1; return { gold: 0.07 * (1 + 0.1 * la.n) * k, green: 0.24 * (1 + 0.08 * la.n) * k, yellow: 0.55 }; };
  EVO.lock = (g) => {
    const a = g.evoAim; if (!a || a.lock || g.state !== 'LAUNCH') return;
    const Zn = EVO.zones(g), d = Math.abs(a.c);
    a.lock = true; a.lockT = 0;
    if (d <= Zn.gold) { a.zone = 'gold'; a.mult = 1.3; a.word = 'PARFAIT !'; } else if (d <= Zn.green) { a.zone = 'green'; a.mult = 1.12; a.word = 'BIEN'; } else if (d <= Zn.yellow) { a.zone = 'yellow'; a.mult = 0.9; a.word = 'MOYEN'; } else { a.zone = 'red'; a.mult = 0.7; a.word = 'FAIBLE'; }
    g.evoLaunchMult = a.mult;
    if (a.zone === 'gold') { g.audio.play('levelUp'); g.flash = 0.4; g.flashColor = '#ffe9a0'; g.rig.shake = Math.max(g.rig.shake, 0.7); if (CC.Haptics) CC.Haptics.pattern('levelUp'); } else { g.audio.play(a.zone === 'green' ? 'target' : 'uiTick'); if (CC.Haptics) CC.Haptics.tick('warn'); }
  };
  EVO.aimTick = (g, dt) => {
    const a = g.evoAim; if (!a) return;
    a.t += dt;
    if (!a.lock) {
      const period = EVO.save(g).runs < 2 ? 2.0 : 1.2;
      a.c += a.dir * dt * (2 / period);
      if (a.c > 1) { a.c = 2 - a.c; a.dir = -1; } else if (a.c < -1) { a.c = -2 - a.c; a.dir = 1; }
    }
    g.pad.charge = U.clamp(0.1 + 0.9 * (1 - Math.abs(a.c)), 0, 1);
    if (a.lock) { a.lockT += dt; if (a.lockT > 0.55) { g.evoAimLast = a; g.pad.manual = false; g.fire(); g.evoAim = null; } }
  };
  EVO.launchSpeed = (g) => EVO.launcher(EVO.save(g).la).speed * (g.evoLaunchMult || 1);

  // ---------- vol ----------
  EVO.beginRun = (g) => {
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
    rk.fuelMax = Math.max(0.01, r.fuel); rk.fuel = r.fuel; rk.throttle = true;
    C.endless.fuelTarget = r.refuel;
    if (g.evoAimLast && g.evoAimLast.zone === 'gold') rk.fuel = Math.min(rk.fuelMax, rk.fuel + rk.fuelMax * 0.2);
    if (ev && ev.preview) { rk.cfg.thrust = 44 * 44 * 0.0035; rk.cfg.dragK = 0.0035; rk.fuelMax = rk.fuel = 999; rk.shieldT = 9999; rk.cfg.gripEngineOff = 5; }
    g.telemetry.event('evoLaunch', { rk: S.rk, la: S.la, cm: S.cm, q: g.evoLaunchMult });
  };
  EVO.tick = (g, dt) => {
    const ev = g.evo, rk = g.rocket, run = g.endlessRun; if (!ev || !run || g.state !== 'FLIGHT' || !rk.active) { if (g.rig) g.rig.fallK = (g.rig.fallK || 0) * Math.max(0, 1 - dt * 4); return; }
    const S = EVO.save(g), r = EVO.rocket(S.rk), sp = rk.vel.length();
    ev.maxD = Math.max(ev.maxD, run.dist);
    C.endless.fuelTarget = r.refuel * (1 - 0.5 * U.clamp(run.dist / Math.max(1000, run.T.levelLen || 5000), 0, 1));   // v140 : plus on avance, moins un ennemi rend de carburant
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
  EVO.softCrash = (kind) => kind === 'stalled' || kind === 'weak' || kind === 'wall';
  const _tq = new THREE.Quaternion(), _ta = new V();
  const rr = (a, b) => a + Math.random() * (b - a);
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
    g.goHome({});
  };
  EVO.double = (g) => { const L = g.evoLast; if (!L || L.doubled || !L.total) return; L.doubled = true; L.lines.push(['PUB X2', L.total]); EVO.save(g).coins += L.total; L.total *= 2; g.writeSave(); g.audio.play('target'); };
  EVO.start = (g) => { if (g.evoAnim) return; EVO.startAim(g); };
  EVO.buy = (g, id) => {
    const S = EVO.save(g), c = EVO.nextCost(g, id);
    if (g.evoAnim) return false;
    if (c === null || S.coins < c) { g.audio.play('uiTick'); g.evoShake = { id, t0: performance.now() }; return false; }
    const before = id === 'rk' ? EVO.rocket(S.rk).tier : id === 'la' ? EVO.launcher(S.la).tier : 0;
    S.coins -= c; S[id]++; if (S[id] % 5 === 0) EVO.mark(g, id + S[id]); g.writeSave(); g.audio.play('levelUp'); if (CC.Haptics) CC.Haptics.tick('warn');
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
    if (rk.active) { _v.set(rk.pos.x, rk.pos.y + 1.7 + 0.6 * (rk.mesh.scale.x || 1), rk.pos.z); CC.Curve.apply(_v, g.camera).project(g.camera); if (_v.z < 1 && _v.z > -1) F.draw(ctx, Math.round(run.dist) + ' M', (_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H - px * 1.2, px * 0.75, '#ffffff', { align: 'center', alpha: 0.95 }); }
    { const kmh = rk.active ? rk.vel.length() * 3.6 : 0, R = Math.max(26, W * 0.085), cx = W * 0.2 + R, cy = top + R + px * 1.5, a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, k = U.clamp(kmh / 260, 0, 1);
      ctx.save(); ctx.fillStyle = 'rgba(10,16,26,0.62)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill(); ctx.lineWidth = R * 0.12; ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(160,190,230,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, a0, a1); ctx.stroke();
      ctx.strokeStyle = k < 0.55 ? '#46b8ff' : k < 0.8 ? '#5ae07a' : '#ffd23a'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, a0, a0 + (a1 - a0) * k); ctx.stroke();
      const ang = a0 + (a1 - a0) * k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, R * 0.07); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R * 0.7, cy + Math.sin(ang) * R * 0.7); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.09, 0, 6.2832); ctx.fill(); ctx.restore();
      F.draw(ctx, String(Math.round(kmh)), cx, cy + R * 0.18, R * 0.06, '#6aff9a', { align: 'center' }); F.draw(ctx, 'KM/H', cx, cy + R * 0.52, R * 0.032, '#cfe4ff', { align: 'center' }); }
    { const T = run.T, pct = U.clamp(run.dist / (T.levelLen || 5000), 0, 1), bw = Math.max(8, px * 3.2), bx = Math.max(10, W * 0.03), by0 = H * 0.2, bh = H * 0.34, yy = by0 + bh * (1 - pct);
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(10,14,22,0.55)'; ctx.fillRect(bx - 3, by0 - 3, bw + 6, bh + 6); ctx.fillStyle = '#ffd23a'; ctx.fillRect(bx, yy, bw, by0 + bh - yy);
      for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (k + j) % 2 ? '#111' : '#fff'; ctx.fillRect(bx + j * bw / 2, by0 - px * 3.4 + k * px * 0.85, bw / 2, px * 0.85); }
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(bx + bw + 4, yy); ctx.lineTo(bx + bw + 4 + px * 2, yy - px * 1.1); ctx.lineTo(bx + bw + 4 + px * 2, yy + px * 1.1); ctx.closePath(); ctx.fill(); ctx.restore();
      F.draw(ctx, Math.round(pct * 100) + '%', bx, by0 + bh + px * 2.2, px * 0.85, '#ffffff', {}); }
    const dmg = EVO.dmgNow(g);
    for (const t of g.targets) {
      if (!t.alive || t.boss || t.mini || !t.evoHp || !t.obb) continue;
      const c = t.obb.c, d = c.distanceTo(rk.pos); if (d > 190 || d < 4) continue;
      _v.set(c.x, c.y + (t.size ? t.size[1] * 0.5 : 2) + 2.4, c.z); CC.Curve.apply(_v, g.camera).project(g.camera); if (_v.z > 1 || _v.z < -1) continue;
      const sx = (_v.x * 0.5 + 0.5) * W, sy = (-_v.y * 0.5 + 0.5) * H, ok = dmg + 0.001 >= t.evoHp, s = px * U.clamp(2.0 - d / 120, 0.8, 1.7);
      F.draw(ctx, String(t.evoHp), sx, sy - s * 3.5, s, ok ? '#6aff9a' : '#ff5a4a', { align: 'center' });
    }
  };
})();
