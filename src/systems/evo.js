/* v119 : PROTOTYPE « EVOLUTION » (?evo=1) — un seul écran, un seul but : aller le plus loin en éclatant des ennemis.
 * Boucle : la fusée est lancée, la poussée est automatique, le carburant ne vient que des ennemis détruits ; quand il n'y en a plus la fusée tombe.
 * Chaque ennemi a des PV affichés (vert = ta fusée est assez forte, rouge = trop faible) ; les dégâts dépendent de la fusée ET de sa vitesse.
 * Trois améliorations, par barres de 5 : à la 5e la pièce évolue (carton → réacteur → ailerons → turbo ; rampe → rail → catapulte).
 *   FUSEE   : dégâts, carburant, vitesse (palier 0 : pas de réacteur, la fusée est seulement lancée) ;
 *   LANCEUR : vitesse de départ ;   PIECES : multiplicateur de pièces gagnées par ennemi.
 * Parcours : zone 1 (ville) jusqu'au premier boss (porte de zone), puis un APERCU de la zone 2 (forêt) en vol automatique. Sauvegarde : save.evo. */
(function () {
  const U = CC.U, V = THREE.Vector3;
  const EVO = CC.EVO = { on: /[?&]evo=1/.test(location.search) };
  if (!EVO.on) return;
  const C = CC.CONFIG;
  C.pad.chargeTime = 0.55; C.pad.reloadTime = 0.35;   // relance rapide
  C.endless.fuelDrain = 1;                             // 1 s de carburant = 1 s de poussée

  const RK_TIERS = ['TUBE DE CARTON', 'REACTEUR', 'AILERONS', 'TURBO'], LA_TIERS = ['RAMPE EN BOIS', 'RAIL', 'CATAPULTE'];
  const RK_NEXT = ['REACTEUR', 'AILERONS', 'TURBO', 'MAX'], LA_NEXT = ['RAIL', 'CATAPULTE', 'MAX'];
  const COIN_COST = [20, 50, 110, 220, 420];
  const MAXN = { rk: 20, la: 15, cm: 5 };
  const BOSS_HP = 16, LEN = 1980;
  EVO.RK_TIERS = RK_TIERS; EVO.LA_TIERS = LA_TIERS; EVO.RK_NEXT = RK_NEXT; EVO.LA_NEXT = LA_NEXT; EVO.MAXN = MAXN;

  // ---------- sauvegarde ----------
  EVO.save = (g) => {
    const S = g.save.evo = g.save.evo || { coins: 0, rk: 0, la: 0, cm: 0, best: 0, runs: 0, kills: 0, cleared: 0 };
    if (S.t0 === undefined) { S.t0 = 0; S.marks = {}; }
    if (!EVO._cheat) {
      EVO._cheat = 1; const q = (k) => { const m = new RegExp('[?&]' + k + '=(\\d+)').exec(location.search); return m ? parseInt(m[1], 10) : null; };
      const a = q('evocoins'); if (a !== null) S.coins = a; const b = q('evork'); if (b !== null) S.rk = b; const c = q('evola'); if (c !== null) S.la = c; const d = q('evocm'); if (d !== null) S.cm = d;
    }
    return S;
  };

  // ---------- chronomètre : étapes franchies (n° de vol et temps depuis le premier lancer) ----------
  EVO.mark = (g, key) => { const S = EVO.save(g); if (S.marks[key]) return; S.marks[key] = { run: S.runs + 1, sec: S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0 }; };
  EVO.elapsed = (g) => { const S = EVO.save(g); return S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0; };
  EVO.fmt = (sec) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  EVO.reset = (g) => {
    g.save.evo = undefined; EVO._cheat = 1; const S = EVO.save(g); g.evoLast = null; g.evoBought = null; g.evoResetArm = 0;
    if (g.rocket) EVO.applySkin(g); if (g.pad) EVO.dressPad(g.pad);
    g.writeSave(); g.audio.play('uiTick'); g.telemetry.event('evoReset', {}); return S;
  };

  // ---------- statistiques par niveau d'amélioration ----------
  EVO.rocket = (n) => {
    const tier = Math.min(3, Math.floor(n / 5)), s = n - 5 * tier;
    const vmax = tier ? [0, 36, 44, 52][tier] + 1.5 * s : 0, drag = tier ? 0.0095 : 0.0100 - 0.0006 * s;   // vitesse de pointe : 36 > 58 m/s sur tout le parcours (avant : jusqu'à 77)
    return { n, tier, s, name: RK_TIERS[tier], dmg: 1.4 + 0.1 * n + 0.35 * tier, fuel: [0, 3.6, 10.8, 20.4][tier] + [0, 1.2, 1.8, 2.4][tier] * s,
      thrust: vmax * vmax * drag, vmax, drag, refuel: 0.5 + 0.06 * n };
  };
  EVO.vmax = (r) => r.vmax;
  EVO.launcher = (n) => { const tier = Math.min(2, Math.floor(n / 5)); return { n, tier, s: n - 5 * tier, name: LA_TIERS[tier], speed: 27 + 1.8 * n + 2 * tier }; };
  EVO.mult = (n) => 1 + 0.2 * n;
  EVO.cost = (id, n) => (id === 'rk' ? Math.round(8 * Math.pow(1.29, n)) : id === 'la' ? Math.round(6 * Math.pow(1.29, n)) : COIN_COST[n]);
  EVO.hpAt = (d) => Math.round((1 + 3.2 * Math.pow(Math.min(Math.max(d, 0), 1900) / 1700, 1.15)) * 2) / 2;
  EVO.hpAtPos = (pos) => EVO.hpAt(Math.hypot(pos[0], pos[2]));
  EVO.nextCost = (g, id) => { const S = EVO.save(g), n = S[id]; return n >= MAXN[id] ? null : EVO.cost(id, n); };
  EVO.dmgNow = (g) => { const r = EVO.rocket(EVO.save(g).rk), sp = g.rocket && g.rocket.active ? g.rocket.vel.length() : 40; return r.dmg * U.clamp(sp / 40, 0.8, 1.5); };
  EVO.canKill = (g, t) => !!(g.evo && g.evo.preview) || EVO.dmgNow(g) + 0.001 >= (t.evoHp || 1);

  // ---------- fiches de niveau : zone 1 jusqu'au boss, aperçu de la zone 2 ----------
  const base = (o) => Object.assign({ n: 101, seed: 5151, chest: 0, winKills: 0, tutD: null, tutRel: null, mids: [], event: null, env: 'day', nightOk: false, look: 0, kit: 0, dens: 1, difK: 0.5, ease: 0.3, tgtGap: 50,
    hp: BOSS_HP, boss: 'gunship', bossEnt: 'wall', bossWall: true, bossTint: 0, bossVar: 0, chapter: 1, evo: true }, o);
  EVO.levelDef = (g) => {
    const th = CC.LM.THEMES[0];
    if (g.evoPreview) return base({ n: 102, zone: 'forest', seed: 777, len: 1100, scenes: null, order: new Array(90).fill('forest'), theme: th, env: 'forestSoft', hp: 1, bossWall: false, bossEnt: null, preview: true });
    return base({ zone: 'city', len: LEN, scenes: ['boulevard', 'vitrage', 'toits', 'enfilade', 'slalom'], order: new Array(90).fill('city'), theme: th });
  };

  // ---------- fusée et lanceur : apparence par palier ----------
  const SKINS = [
    { id: 'evo0', c: { body: '#b8925e', nose: '#c9a46c', tip: '#e8dcc0', band: '#6e5230', fin: '#8a6a44', nozzle: '#6a5030' }, dims: { r: 0.1, len: 0.8, noseLen: 0.2, noseR: 0.07, fins: 0 },
      parts: [{ k: 'cyl', r: 0.108, h: 0.14, p: [0, 0, -0.42], rot: [90, 0, 0], c: '#a8844f' }, { k: 'box', w: 0.215, h: 0.05, d: 0.2, p: [0, 0, 0.1], c: '#e8d8a8' }, { k: 'box', w: 0.04, h: 0.215, d: 0.14, p: [0, 0, -0.1], c: '#d8c690' }] },
    { id: 'evo1', c: { body: '#d6d8dc', nose: '#d6d8dc', tip: '#e02a1c', band: '#f3cf00', fin: '#8a8f96', nozzle: '#3d3f43' }, dims: { r: 0.1, len: 0.9, noseLen: 0.3, noseR: 0.02, fins: 2, finH: 0.14 },
      parts: [{ k: 'cyl', r: 0.07, h: 0.2, p: [0, 0, -0.55], rot: [90, 0, 0], c: '#2b2d31' }] },
    { id: 'evo2', c: { body: '#e8eaee', nose: '#e8eaee', tip: '#e02a1c', band: '#2a7ad0', fin: '#2a7ad0', nozzle: '#3d3f43' }, dims: { r: 0.105, len: 1.0, noseLen: 0.34, noseR: 0.02, fins: 4, finH: 0.3, finW: 0.03 },
      parts: [{ k: 'box', w: 0.7, h: 0.025, d: 0.22, p: [0, 0, -0.12], c: '#2a7ad0' }, { k: 'cyl', r: 0.075, h: 0.22, p: [0, 0, -0.6], rot: [90, 0, 0], c: '#2b2d31' }] },
    { id: 'evo3', c: { body: '#f2f3f5', nose: '#f2f3f5', tip: '#ffd23a', band: '#e0402c', fin: '#e0402c', nozzle: '#2b2d31' }, dims: { r: 0.11, len: 1.15, noseLen: 0.4, noseR: 0.02, fins: 4, finH: 0.34, finW: 0.03 }, flame: '#7be8ff',
      parts: [{ k: 'cyl', r: 0.055, h: 0.7, p: [0.17, 0, -0.2], rot: [90, 0, 0], c: '#e0402c' }, { k: 'cyl', r: 0.055, h: 0.7, p: [-0.17, 0, -0.2], rot: [90, 0, 0], c: '#e0402c' },
        { k: 'cyl', r: 0.05, h: 0.12, p: [0.17, 0, -0.6], rot: [90, 0, 0], c: '#2b2d31' }, { k: 'cyl', r: 0.05, h: 0.12, p: [-0.17, 0, -0.6], rot: [90, 0, 0], c: '#2b2d31' }, { k: 'box', w: 0.8, h: 0.025, d: 0.25, p: [0, 0, -0.2], c: '#e0402c' }] },
  ];
  for (const s of SKINS) { s.name = s.id; s.short = s.id; s.tier = 'base'; s.price = 0; s.tierLabel = ''; s.c = Object.assign({}, s.c); s.dims = Object.assign({ r: 0.1, len: 0.86, noseLen: 0.3, noseR: 0.012, fins: 4, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, s.dims); s.flame = s.flame || '#ff8a2a'; CC.Skins.byId[s.id] = s; }
  EVO.applySkin = (g) => { const r = EVO.rocket(EVO.save(g).rk), b = CC.Skins.get('evo' + r.tier); g.rocket.setSkin(Object.assign({}, b, { dims: Object.assign({}, b.dims, { scale: 1 + 0.035 * r.n }) })); };   // v120 : +3,5 % par barre
  // lanceur : des anneaux d'accélération le long du rail, de plus en plus nombreux et lumineux
  EVO.dressPad = (pad) => {
    if (pad.evoG) { pad.cradle.remove(pad.evoG); pad.evoG.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    const g = CC.game, la = EVO.launcher(EVO.save(g).la), G = pad.evoG = new THREE.Group(); pad.cradle.add(G);
    const mk = (w, h, d, color, x, y, z, basic) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color })); m.position.set(x, y, z); G.add(m); return m; };
    if (la.tier === 0) { mk(0.5, 0.06, 4.4, '#9a7448', 0, -0.285, -0.75); for (let i = 0; i < 9; i++) mk(0.52, 0.02, 0.03, '#6e5230', 0, -0.25, 1.2 - i * 0.5); }
    const col = ['#ffb040', '#39d4ff', '#c07bff'][la.tier], n = [0, 3 + la.s, 4 + la.s][la.tier];
    for (let i = 0; i < n; i++) { const z = 0.2 - i * 0.55, hw = 0.3 + (la.tier > 1 ? 0.05 : 0); mk(0.05, hw * 2, 0.07, col, hw, 0.05, z, true); mk(0.05, hw * 2, 0.07, col, -hw, 0.05, z, true); mk(hw * 2, 0.05, 0.07, col, 0, hw + 0.05, z, true); }
    if (la.tier === 2) mk(0.5, 0.5, 0.5, '#58616d', 0, -0.05, 1.4);
  };

  // ---------- vol ----------
  EVO.beginRun = (g) => {
    g.l1run = { slow: 0, slowK: 0.4, slowDur: 0, slowT: 0, cool: 0, bossHits: 0, wall: 0, ph: 1, tAcc: 0, evo: true };   // même ossature que le niveau 1 : le boss garde ses phases
    g.evo = { kills: 0, coins: 0, preview: !!g.evoPreview, previewT: 14, fuelOut: false, maxD: 0, bossHits: 0 };
    g.progress.P.bestDist = EVO.save(g).best;   // portique jaune du RECORD sur le parcours
    if (g.evoPreview) { if (g._ctlSave === undefined) g._ctlSave = g.settings.ctl; g.settings.ctl = 'simple'; }
  };
  EVO.launchSpeed = (g) => EVO.launcher(EVO.save(g).la).speed;
  EVO.onLaunch = (g) => {
    const S = EVO.save(g); if (!S.t0) S.t0 = Date.now();
    const rk = g.rocket, r = EVO.rocket(S.rk), ev = g.evo;
    rk.cfg.thrust = r.thrust; rk.cfg.dragK = r.drag; rk.cfg.gripEngineOff = 0.7; rk.fuelMax = Math.max(0.01, r.fuel); rk.fuel = r.fuel; rk.throttle = true;   // moteur éteint : trajectoire balistique, la fusée tombe
    C.endless.fuelTarget = r.refuel;
    if (ev && ev.preview) { rk.cfg.thrust = 55 * 55 * 0.0095; rk.cfg.dragK = 0.0095; rk.fuelMax = rk.fuel = 999; rk.shieldT = 9999; }
    g.telemetry.event('evoLaunch', { rk: S.rk, la: S.la, cm: S.cm });
  };
  EVO.tick = (g, dt) => {
    const ev = g.evo, rk = g.rocket, run = g.endlessRun; if (!ev || !run || g.state !== 'FLIGHT' || !rk.active) return;
    ev.maxD = Math.max(ev.maxD, run.dist);
    if (!ev.fuelOut && !ev.preview && rk.fuel <= 0.01 && g.flightTime > 0.6 && EVO.rocket(EVO.save(g).rk).tier > 0) { ev.fuelOut = true; CC.L1.msg(g, 'PLUS DE CARBURANT', 1.4, '#ff8a5a'); }
    if (rk.fuel > 0.3) ev.fuelOut = false;
    if (rk.fuel <= 0.01 && !ev.preview) rk.vel.y -= 3 * dt;   // sans carburant la fusée tombe franchement (sinon elle plane très longtemps)
    // plus de carburant et la fusée touche le sol : le vol est fini (pas de longue glissade)
    if (rk.fuel <= 0.01 && !ev.preview && rk.sliding > 0 && (ev.slideT = (ev.slideT || 0) + dt) > 0.7) { ev.slideT = 0; g.onRocketCrash('stalled', rk.pos.clone(), null); return; }
    if (rk.fuel > 0.01 || rk.sliding <= 0) ev.slideT = 0;
    if (ev.preview && (ev.previewT -= dt) <= 0) {   // fin de l'aperçu de la zone 2
      rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; g.evoPreview = false; if (g._ctlSave !== undefined) { g.settings.ctl = g._ctlSave; g._ctlSave = undefined; }
      g.evoLast = { zone2: true, t0: 0 }; g.state = 'REVIVE'; g.ui.overlay = 'evo';
    }
  };
  // coups : gain de pièces, compteur (la destruction elle-même reste celle du jeu)
  EVO.onKill = (g, t) => {
    const ev = g.evo; if (!ev || ev.preview) return;
    const m = EVO.mult(EVO.save(g).cm), c = Math.round((3 + 2 * (t.evoHp || 1)) * m); ev.kills++; ev.coins += c;
    (g.killPops = g.killPops || []).push({ p: t.obb ? t.obb.c.clone().add(new V(0, 3, 0)) : g.rocket.pos.clone(), t0: performance.now() - 200, txt: '+' + c });
  };
  EVO.onBossHit = (g, t) => { if (g.evo) { g.evo.bossHits++; g.evo.coins += Math.round(12 * EVO.mult(EVO.save(g).cm)); } };

  // ---------- fin d'un vol : récap + améliorations ----------
  EVO.beginEnd = (g) => {
    if (g.evo && g.evo.preview) { g.evoPreview = false; g.evoLast = { zone2: true, t0: 0 }; g.state = 'REVIVE'; g.ui.overlay = 'evo'; return; }
    const S = EVO.save(g), ev = g.evo || { kills: 0, coins: 0, maxD: 0 }, run = g.endlessRun, dist = Math.round(Math.max(ev.maxD, run ? run.dist : 0)), m = EVO.mult(S.cm);
    const distCoins = Math.floor(dist / 10 * m), lines = [['DISTANCE ' + dist + ' M', distCoins]];
    if (ev.kills) lines.push(['ENNEMIS ' + ev.kills, ev.coins - (ev.bossHits ? Math.round(12 * m) * ev.bossHits : 0)]);
    if (ev.bossHits) lines.push(['COUPS AU BOSS ' + ev.bossHits, Math.round(12 * m) * ev.bossHits]);
    const total = lines.reduce((a, l) => a + l[1], 0), record = dist > S.best;
    for (const m of [300, 600, 1000, 1500, 1900]) if (dist >= m) EVO.mark(g, 'd' + m);
    if (g.crashKind === 'weak') EVO.mark(g, 'weak');
    if (record) S.best = dist; S.coins += total; S.runs++; S.kills += ev.kills;
    g.evoLast = { dist, kills: ev.kills, lines, total, record, cause: g.crashKind === 'stalled' ? (EVO.rocket(S.rk).tier ? (g.rocket.fuel > 0.5 ? 'BLOQUEE' : 'PLUS DE CARBURANT') : 'ELLE EST TOMBEE') : g.causeOf(g.crashKind), doubled: false, t0: 0, crash: g.crashKind, detail: g.crashKind === 'weak' && g.evoWeak ? 'ENNEMI ' + g.evoWeak.hp + ' PV : TES DEGATS ' + g.evoWeak.dmg.toFixed(1) : g.crashKind === 'stalled' ? (EVO.rocket(S.rk).tier ? (g.rocket.fuel > 0.5 ? 'GLISSE LE DOIGT POUR ESQUIVER' : 'DETRUIS DES ENNEMIS POUR RECHARGER') : 'AMELIORE LA FUSEE : ELLE IRA PLUS LOIN') : 'GLISSE LE DOIGT POUR ESQUIVER' };
    g.state = 'REVIVE'; g.ui.overlay = 'evo'; g.writeSave();
    g.telemetry.event('evoEnd', { dist, kills: ev.kills, coins: total, rk: S.rk, la: S.la, cm: S.cm, cause: g.crashKind });
  };
  EVO.double = (g) => { const L = g.evoLast; if (!L || L.doubled || !L.total) return; L.doubled = true; L.lines.push(['PUB X2', L.total]); EVO.save(g).coins += L.total; L.total *= 2; g.writeSave(); g.audio.play('target'); };
  EVO.retry = (g) => { g.ui.overlay = null; g.evoLast = null; g.goHome({ autoLaunch: true }); };
  EVO.start = (g) => { g.ui.overlay = null; g.evoLast = null; if (g.state === 'MENU' && g.padMode) g.beginLaunch(); else g.goHome({ autoLaunch: true }); };
  EVO.buy = (g, id) => {
    const S = EVO.save(g), c = EVO.nextCost(g, id);
    if (c === null || S.coins < c) { g.audio.play('uiTick'); g.evoShake = { id, t0: performance.now() }; return false; }
    const before = id === 'rk' ? EVO.rocket(S.rk).tier : id === 'la' ? EVO.launcher(S.la).tier : 0;
    S.coins -= c; S[id]++; if (S[id] % 5 === 0) EVO.mark(g, id + S[id]); g.writeSave(); g.audio.play('levelUp'); if (CC.Haptics) CC.Haptics.tick('warn');
    const after = id === 'rk' ? EVO.rocket(S[id]).tier : id === 'la' ? EVO.launcher(S[id]).tier : 0;
    g.evoBought = { id, t0: performance.now(), evolve: after > before ? (id === 'rk' ? RK_TIERS[after] : LA_TIERS[after]) : null };
    if (id === 'rk') EVO.applySkin(g); if (id === 'la' && g.pad) EVO.dressPad(g.pad);
    g.telemetry.event('evoBuy', { id, lvl: S[id] }); return true;
  };
  // boss vaincu : porte de zone franchie, on vole un instant dans la zone suivante
  EVO.onClear = (g) => {
    const S = EVO.save(g); EVO.mark(g, 'boss'); S.cleared = (S.cleared || 0) + 1; S.coins += 300; g.writeSave();
    g.evoPreview = true; g.evoClearBonus = 300; g.goHome({ autoLaunch: true });
  };

  // ---------- affichage en vol : distance, dégâts, PV au-dessus des ennemis ----------
  const _v = new V();
  EVO.drawHud = (hud, ctx, g, W, H, px) => {
    const F = CC.Font, ev = g.evo, run = g.endlessRun, rk = g.rocket; if (!ev || !run) return;
    const top = Math.max(10, H * 0.02), S = EVO.save(g);
    if (ev.preview) { F.draw(ctx, 'APERCU : ZONE 2', W / 2, top + px * 12, px * 1.1, '#9fe8b0', { align: 'center' }); return; }
    const dist = Math.round(run.dist), rec = S.best, dt = dist + ' M';
    F.draw(ctx, dt, W / 2, top + px * 12, px * 1.0, '#e8ecef', { align: 'center' });
    if (rec > 0) F.draw(ctx, 'RECORD ' + rec + ' M', W / 2, top + px * 12 + px * 9, px * 0.6, dist > rec ? '#ffd23a' : '#8a96a8', { align: 'center' });
    // dégâts du moment (dépendent de la vitesse)
    const dmg = EVO.dmgNow(g), ds = 'DEGATS ' + dmg.toFixed(1);
    F.draw(ctx, ds, Math.max(14, W * 0.05), H * 0.9, px * 0.9, '#ffd23a', { align: 'left' });
    F.draw(ctx, 'VITESSE ' + Math.round(rk.vel.length()), Math.max(14, W * 0.05), H * 0.9 + px * 9, px * 0.6, '#c8d0dc', { align: 'left' });
    // PV au-dessus des ennemis devant : vert si la fusée est assez forte, rouge sinon
    for (const t of g.targets) {
      if (!t.alive || t.boss || t.mini || t.hazard || !t.obb || !t.evoHp) continue;
      const c = t.obb.c, d = c.distanceTo(rk.pos); if (d > 150 || d < 4) continue;
      _v.set(c.x, c.y + (t.size ? t.size[1] * 0.5 : 2) + 2.2, c.z); CC.Curve.apply(_v, g.camera).project(g.camera); if (_v.z > 1 || _v.z < -1) continue;
      const sx = (_v.x * 0.5 + 0.5) * W, sy = (-_v.y * 0.5 + 0.5) * H, ok = dmg + 0.001 >= t.evoHp, s = px * U.clamp(1.7 - d / 110, 0.7, 1.5);
      F.draw(ctx, String(t.evoHp), sx, sy - s * 3.5, s, ok ? '#6aff9a' : '#ff5a4a', { align: 'center' });
    }
  };
})();
