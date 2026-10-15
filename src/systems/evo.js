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
  C.endless.zoneLen = 3600;                                                                       // tout le niveau 1 tient dans la zone campagne
  C.camera.distance = 3.8; C.camera.height = 1.05; C.camera.boostPull = 0.8;                       // la fusée est petite, le monde est grand

  const RK_TIERS = ['TUBE DE CARTON', 'AVION A AILES', 'REACTEUR', 'TURBO'], LA_TIERS = ['RAMPE EN BOIS', 'RAIL', 'CATAPULTE'];
  const RK_NEXT = ['AILES', 'REACTEUR', 'TURBO', 'MAX'], LA_NEXT = ['RAIL', 'CATAPULTE', 'MAX'];
  const COIN_COST = [100, 165, 272, 449, 741];
  const MAXN = { rk: 20, la: 15, cm: 5 };
  const BOSS_HP = 16;
  const SCENES = ['rampe', 'camp', 'riviere', 'foret', 'route'];
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
    g.writeSave(); g.audio.play('uiTick'); g.telemetry.event('evoReset', {}); return S;
  };

  // ---------- statistiques ----------
  // FUSEE : palier (0 tube, 1 ailes, 2 réacteur, 3 turbo) et barre dans le palier. Les ailes (portance) montent de 0,55 à 1 pendant le palier 1.
  EVO.rocket = (n) => {
    const tier = Math.min(3, Math.floor(n / 5)), s = n - 5 * tier, wing = tier >= 1 ? Math.min(1, 0.55 + 0.1 * Math.min(n - 5, 4.5)) : 0;
    const vmax = tier >= 2 ? [0, 0, 36, 44][tier] + 1.5 * s : 0, drag = tier >= 1 ? 0.0078 - 0.0042 * wing : 0.0100 - 0.0006 * s;
    return { n, tier, s, name: RK_TIERS[tier], wing, vmax, drag, thrust: vmax * vmax * drag, gripOff: tier >= 1 ? 1.2 + 4.5 * wing : 0.7,
      dmg: 1.2 + 0.12 * n + 0.3 * tier, fuel: tier >= 2 ? [0, 0, 8, 16][tier] + [0, 0, 1.6, 2.2][tier] * s : 0, refuel: 3 + 0.15 * n, kick: tier === 0 ? 4 : tier === 1 ? 8 : 5 };
  };
  EVO.launcher = (n) => { const tier = Math.min(2, Math.floor(n / 5)); return { n, tier, s: n - 5 * tier, name: LA_TIERS[tier], speed: 22 + 1.4 * n + 1.5 * tier }; };
  EVO.mult = (n) => 1 + 0.1 * n;
  EVO.cost = (id, n) => (id === 'rk' ? Math.round(120 * Math.pow(1.3, n)) : id === 'la' ? Math.round(100 * Math.pow(1.3, n)) : COIN_COST[n]);
  EVO.nextCost = (g, id) => { const S = EVO.save(g), n = S[id]; return n >= MAXN[id] ? null : EVO.cost(id, n); };
  EVO.dmgNow = (g) => { const r = EVO.rocket(EVO.save(g).rk), sp = g.rocket && g.rocket.active ? g.rocket.vel.length() : 38; return r.dmg * U.clamp(sp / 38, 0.85, 1.5); };
  EVO.canKill = (g, t) => !!(g.evo && g.evo.preview) || !t.evoHp || EVO.dmgNow(g) + 0.001 >= t.evoHp;

  // ---------- fiches de niveau ----------
  const base = (o) => Object.assign({ n: 101, seed: 5151, chest: 0, winKills: 1e9, tutD: [], tutRel: null, mids: [], event: null, env: 'plaineDay', nightOk: false, look: 0, kit: 0, dens: 1, difK: 0.5, ease: 0.3, tgtGap: 50,
    hp: BOSS_HP, boss: 'gunship', bossEnt: 'sky', bossWall: false, bossTint: 0, bossVar: 0, chapter: 1, evo: true }, o);
  EVO.levelDef = (g) => {
    const th = CC.LM.THEMES[0];
    if (g.evoPreview) return base({ n: 102, zone: 'jungle', seed: 777, len: 1100, scenes: null, order: new Array(90).fill('jungle'), theme: th, env: null, hp: 1, bossEnt: null, preview: true });
    const q = /[?&]evoscenes=([\w,]+)/.exec(location.search), sc = q ? q[1].split(',') : SCENES, Zs = CC.Zones.defs.campagne.scenes;
    let len = 80; for (const n of sc) { const s = Zs[n]; if (s) len += s.len[0]; }
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
      dims: { r: 0.1, len: 0.8, noseLen: 0.26, noseR: i < 2 ? 0.07 : 0.015, fins: 0, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 },
      parts: d.cap ? [{ k: 'cyl', r: 0.108, h: 0.14, p: [0, 0, -0.42], rot: [90, 0, 0], c: '#a8844f' }, { k: 'box', w: 0.215, h: 0.05, d: 0.2, p: [0, 0, 0.1], c: '#e8d8a8' }] : [] };
    CC.Skins.byId[s.id] = s;
  }
  let _pm = null;
  const PM = () => _pm || (_pm = { card: new THREE.MeshLambertMaterial({ color: '#c8a46e' }), cardD: new THREE.MeshLambertMaterial({ color: '#8a6a44' }), white: new THREE.MeshLambertMaterial({ color: '#eceef2' }), red: new THREE.MeshLambertMaterial({ color: '#d8402c' }),
    blue: new THREE.MeshLambertMaterial({ color: '#2a7ad0' }), dark: new THREE.MeshLambertMaterial({ color: '#2b2d31' }), steel: new THREE.MeshLambertMaterial({ color: '#9aa0a8' }) });
  function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
  function cyl(rt, rb, h, mat, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; }
  // chaque pièce est un groupe dont l'échelle (0 → 1) est animée ; la clé donne le palier où elle apparaît
  function buildParts(tier) {
    const M = PM(), root = new THREE.Group(), P = {};
    const wm = tier >= 2 ? M.white : M.card;
    const wings = new THREE.Group(); for (const s of [-1, 1]) { const w = box(0.66, 0.026, 0.30, wm, s * 0.42, 0, -0.02); w.rotation.z = s * 0.06; wings.add(w); wings.add(box(0.02, 0.15, 0.02, M.cardD, s * 0.18, -0.07, 0)); if (tier >= 2) wings.add(box(0.1, 0.03, 0.31, M.red, s * 0.72, 0.01, -0.02)); }
    const tail = new THREE.Group(); for (const s of [-1, 1]) tail.add(box(0.26, 0.022, 0.16, wm, s * 0.16, 0, -0.36)); tail.add(box(0.022, 0.2, 0.18, tier >= 2 ? M.red : M.card, 0, 0.11, -0.36));
    const flaps = new THREE.Group(); for (const s of [-1, 1]) { flaps.add(box(0.3, 0.03, 0.09, M.red, s * 0.44, 0.012, -0.2)); flaps.add(box(0.2, 0.03, 0.07, M.red, s * 0.18, 0.012, -0.44)); }
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
    rk.mesh.userData.finTips = r.tier >= 1 ? [new V(0.76, 0, -0.14), new V(-0.76, 0, -0.14)] : [];   // bouts d'ailes : traînées de condensation
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
      if (a.t > 6) EVO.lock(g);
    }
    g.pad.charge = U.clamp(0.1 + 0.9 * (1 - Math.abs(a.c)), 0, 1);
    if (a.lock) { a.lockT += dt; if (a.lockT > 0.55) { g.evoAimLast = a; g.pad.manual = false; g.fire(); g.evoAim = null; } }
  };
  EVO.launchSpeed = (g) => EVO.launcher(EVO.save(g).la).speed * (g.evoLaunchMult || 1);

  // ---------- vol ----------
  EVO.beginRun = (g) => {
    g.l1run = { slow: 0, slowK: 0.4, slowDur: 0, slowT: 0, cool: 0, bossHits: 0, wall: 0, ph: 1, tAcc: 0, evo: true };
    g.evo = { kills: 0, coins: 0, preview: !!g.evoPreview, previewT: 14, fuelOut: false, maxD: 0, bossHits: 0, scan: 0, perfect: false };
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
    // planeur : les ailes portent (elles annulent une partie de la gravité tant que la vitesse est suffisante)
    if (r.wing > 0 && !ev.preview) rk.vel.y += C.physics.gravity * r.wing * U.clamp(sp / 17, 0, 1.15) * dt;
    if (ev.preview) rk.vel.y += C.physics.gravity * 0.95 * U.clamp(sp / 17, 0, 1.1) * dt;
    // sans réacteur ou sans carburant : la fusée tombe ; au sol, le vol est fini
    const out = (r.tier < 2 || rk.fuel <= 0.01) && !ev.preview;
    if (out && rk.sliding > 0 && (ev.slideT = (ev.slideT || 0) + dt) > 0.7) { ev.slideT = 0; g.onRocketCrash('stalled', rk.pos.clone(), null); return; }
    if (!out || rk.sliding <= 0) ev.slideT = 0;
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

  // ---------- fin d'un vol : on revient sur le lanceur avec le récap ----------
  EVO.beginEnd = (g) => {
    if (g.evo && g.evo.preview) { g.evoPreview = false; g.evoLast = { zone2: true, t0: 0 }; g.goHome({}); return; }
    const S = EVO.save(g), ev = g.evo || { kills: 0, coins: 0, maxD: 0 }, run = g.endlessRun, dist = Math.round(Math.max(ev.maxD, run ? run.dist : 0)), m = EVO.mult(S.cm);
    const distCoins = Math.floor(dist * m), lines = [['DISTANCE ' + dist + ' M', distCoins]];
    if (ev.kills) lines.push(['ENNEMIS ' + ev.kills, ev.coins - (ev.bossHits ? Math.round(150 * m) * ev.bossHits : 0)]);
    if (ev.bossHits) lines.push(['COUPS AU BOSS ' + ev.bossHits, Math.round(150 * m) * ev.bossHits]);
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
    F.draw(ctx, Math.round(run.dist) + ' M', W / 2, top + px * 2, px * 1.0, '#ffffff', { align: 'center', alpha: 0.9 });
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
