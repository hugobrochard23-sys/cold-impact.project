/* v365 : MVP A (?mvp=a) : des niveaux courts faits avec les DECORS ET LES SCENES DEJA DANS LE JEU (aucune texture ni brique nouvelle).
 * Chaque niveau = une zone existante + une suite de scenes existantes (vitres a casser, pentes, fosses, montagnes russes, grottes, eau...) ; la fusee
 * avance a vitesse constante le long de la piste du niveau ; le joueur ne fait que la decaler (curseur ou fleches) pour viser les ennemis et eviter les murs.
 * Camera : suit la piste du niveau (si le niveau descend, la camera descend ; si la fusee descend dans le niveau, la camera ne bouge pas).
 * Accueil = le hangar avec START et les fleches ; mort = explosion et retour immediat au hangar ; fin = carte style MISSION ACCOMPLIE. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const mm = /[?&]mvp=([abc])/.exec(location.search), M = mm ? mm[1] : (/^[abc]$/.test(window.CC_MVP || '') ? window.CC_MVP : null);
  E.mvp = () => M;
  if (!M) return;
  try { localStorage.setItem('coldimpact.terms', '1'); } catch (e) { /* ignore */ }   // plus d'ecran de conditions
  const T3 = THREE, V = T3.Vector3, U = CC.U, UI = CC.UI2, Home = CC.Home;
  CC.CONFIG.physics.gravity = 0;   // la fusee est pilotee directement (vitesse imposee)
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* facultatif */ } };

  // ---------------------------------------------------------------- les niveaux : une zone existante + des scenes existantes
  const LEVELS = [
    null,
    { name: 'PRAIRIE', zone: 'campagne', scenes: ['rampe', 'camp'], fin: 470, tilt: true, speed: 43 },   // 11 s : la prairie penchee, char / helico / camion / jeep
    { name: 'VILLE', zone: 'city', speed: 45, scenes: [   // 24 s : la rue, on casse la vitre, on grimpe, on pique entre les immeubles
      { n: 'passage', foes: [['tank', 0.5, -3], ['jeep', 0.8, 4]] }, 'vitrage',
      { n: 'montee', foes: [['heli', 0.45, 0, 0], ['heli', 0.8, 3, 2]] }, { n: 'plongee', foes: [['heli', 0.5, -2, 0]] }] },
    { name: 'JUNGLE', zone: 'jungle', speed: 46, scenes: [   // 24 s : sous la canopee, la riviere, la cascade, le temple
      { n: 'canopee', foes: [['jeep', 0.3, -3], ['heli', 0.7, 2, -2]] }, { n: 'lianes', foes: [['heli', 0.5, -3, 0]] },
      { n: 'cascade', foes: [['tank', 0.4, 3], ['heli', 0.75, 0, 0]] }, { n: 'temple', foes: [['heli', 0.5, 0, 0]] }] },
    { name: 'OCEAN', zone: 'eolien', speed: 46, scenes: [   // 23 s : la mer, le champ d'eoliennes, les plateformes, les cargos
      { n: 'champ', foes: [['gunboat', 0.4, -3], ['heli', 0.75, 2, 0]] }, { n: 'plateformes', foes: [['boat', 0.3, 3], ['heli', 0.7, -3, 0]] },
      { n: 'champDense', foes: [['gunboat', 0.5, 0], ['heli', 0.8, 2, 0]] }, { n: 'cargos', foes: [['boat', 0.4, -3]] }] }
  ];
  const NLV = LEVELS.length - 1;
  let LV = Math.max(1, Math.min(NLV, parseInt(lsGet('cc.mvp.lv.' + M, '1'), 10) || 1));
  { const z = /[?&]mvpz=(\w+)/.exec(location.search), sc = /[?&]mvps=([\w,]+)/.exec(location.search); if (z && sc && LV > 1) LEVELS[LV] = Object.assign({}, LEVELS[LV], { zone: z[1], scenes: sc[1].split(',') }); }   // essai d'un decor a la main
  const cur = () => LEVELS[LV];
  // ennemis ajoutes a une scene existante (meme methode que zones_evo.js) : [type, fraction de la scene, decalage lateral, decalage de hauteur] par rapport a la piste du niveau
  const FOENAME = { heli: 'HELICO', tank: 'CHAR', truck: 'CAMION', jeep: 'JEEP', sam: 'SAM', boat: 'BATEAU' };
  const withFoes = (zone, name, foes, tag) => {
    const Z = CC.Zones.defs[zone], sc = Z && Z.scenes[name]; if (!sc) return null; const al = name + '_' + tag;
    if (!Z.scenes[al]) Z.scenes[al] = Object.assign({}, sc, { build(S) {
      sc.build.call(this, S);
      for (const f of foes || []) {
        const dc = S.d0 + f[1] * S.len, L = S.lane(dc), air = !!(CC.Roster && CC.Roster.isAir && CC.Roster.isAir(f[0]));
        const heliPatrol = (SS, dd, lx, y) => [SS.at(dd, lx - 6, y), SS.at(dd + 8, lx, y + 2), SS.at(dd, lx + 6, y), SS.at(dd - 8, lx, y + 2)];
        CC.Zones.evoFoe(S, f[0], dc, L.lx + (f[2] || 0), air ? L.y + (f[3] || 0) : 0, Object.assign({ name: FOENAME[f[0]] || f[0].toUpperCase(), keep: true, armed: false }, f[0] === 'heli' ? { patrol: heliPatrol, speed: 7 } : {}));
      }
    } });
    return al;
  };
  const fails = {};   // essais rates par niveau (pendant la session) : 0 = 3 etoiles
  const SP = () => cur().speed || 44;
  const _rk = E.rocket;   // carburant illimite, jamais en panne
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };
  E.softCrash = () => false;   // la mort = une explosion simple, pas de roule-boule

  // la fiche du niveau
  const _ld = E.levelDef;
  E.levelDef = (g) => {
    if (E.isS2()) return _ld(g);
    const L = cur(); E.chapters = [];
    if (L.tilt) { E.shortTiltOff = false; E.shortFin = L.fin; return _ld(g); }   // niveau 1 : la prairie penchee (evo_short.js)
    E.shortTiltOff = true; E.shortPad = L.pad || 0;
    const Z = CC.Zones.defs[L.zone], sc = L.scenes.map((e) => (typeof e === 'string' ? e : withFoes(L.zone, e.n, e.foes, 'mv' + LV))).filter((n) => n && Z.scenes[n]); let tot = 0; for (const n of sc) tot += Z.scenes[n].len[0];
    E.shortFin = tot + 25;   // la ligne est juste avant l'arene de fin
    return E.baseDef({ zone: L.zone, len: tot + 160, scenes: sc, order: new Array(90).fill(L.zone), theme: CC.LM.THEMES[0], hp: 1, bossEnt: null });
  };
  E.mvpLevel = () => ({ lv: LV, L: cur() });
  // pas de trajet de camera du hangar vers l'arriere : la vue de vol est la bonne tout de suite
  if (CC.CameraRig) CC.CameraRig.prototype.startHandoff = function () { this.handT = -1; };

  // ---------------------------------------------------------------- entrees : souris OU fleches, on bascule a tout moment
  const I = { cx: 0, cy: 0.5, mode: 'mouse', k: {}, mx: -1, my: -1, ax: 0, ay: 0 };
  const ARR = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
  const setC = (x, y) => { I.cx = x / window.innerWidth * 2 - 1; I.cy = y / window.innerHeight; };
  window.addEventListener('mousemove', (e) => { if (Math.abs(e.clientX - I.mx) + Math.abs(e.clientY - I.my) > 3) I.mode = 'mouse'; I.mx = e.clientX; I.my = e.clientY; setC(e.clientX, e.clientY); });
  window.addEventListener('mousedown', (e) => { if (e.button === 0) setC(e.clientX, e.clientY); });
  window.addEventListener('touchstart', (e) => { I.mode = 'mouse'; const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('keydown', (e) => { I.k[e.code] = 1; if (ARR[e.code]) { I.mode = 'keys'; const g = CC.game; if (g && g.state === 'FLIGHT') e.preventDefault(); } });
  window.addEventListener('keyup', (e) => { I.k[e.code] = 0; });
  E.mvpInput = I;

  // ---------------------------------------------------------------- geometrie le long de la piste du niveau
  const tf = new V(), nn = new V(), cc = new V(), ray = new V(), org = new V(), tmp = new V(), tmp2 = new V();
  const frame = (T, d) => {
    const a = T.at(d, 0, 0), b = T.at(d + 6, 0, 0), c1 = T.at(d, 1, 0);
    tf.set(b[0] - a[0], 0, b[2] - a[2]); if (tf.lengthSq() < 1e-6) tf.set(0, 0, -1); tf.normalize();
    nn.set(c1[0] - a[0], 0, c1[2] - a[2]).normalize(); cc.set(a[0], a[1], a[2]);
  };
  const laneAbs = (T, d) => T.base(d) + T.laneY(d);
  const relOf = (T, d, P, out) => {   // decalage d'un point par rapport au centre de la piste du niveau (lateral, hauteur)
    const a = T.at(d, 0, 0), c1 = T.at(d, 1, 0); let nx = c1[0] - a[0], nz = c1[2] - a[2]; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    out.x = (P.x - a[0]) * nx + (P.z - a[2]) * nz - T.laneX(d); out.y = P.y - laneAbs(T, d); return out;
  };
  const rel = { x: 0, y: 0 }, relP = { x: 0, y: 0 };
  const LAT = 9, HUP = 8, hdnAt = (T, d) => U.clamp(T.laneY(d) - 2.2, 6, 22);   // on peut descendre jusqu'au sol (ou a la mer) pour atteindre les ennemis

  // ---------------------------------------------------------------- camera : suit la piste du niveau, a distance fixe de la fusee
  const camP = new V(), camL = new V();
  E.mvpCam = (rig, rk, cam, dt) => {
    const g = rig.game, run = g.endlessRun; if (!run || !run.T) return;
    const T = run.T, d = Math.max(0, run.dist), k = Math.min(1, (dt || 0.016) * 9);
    relOf(T, d, rk.pos, rel);
    const dc = Math.max(0, d - 7), d2 = dc + 40, fx = rel.x * 0.5, fy = rel.y * 0.4;
    const pa = T.at(dc, T.laneX(dc) + fx, T.laneY(dc) + 2.2 + fy), pb = T.at(d2, T.laneX(d2) + fx, T.laneY(d2) + 0.2 + fy);
    camP.set(pa[0], Math.max(pa[1], T.base(dc) + 1.2), pa[2]); camL.set(pb[0], pb[1], pb[2]);
    if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
    rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
  };

  // ---------------------------------------------------------------- pilotage : la fusee suit la piste, le joueur la decale
  const drive = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk.active || g.state !== 'FLIGHT' || g.evoFinish || g.flightTime < 0.05) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const sp = SP(), d2 = d + 8, ease = U.clamp(g.flightTime / 1.0, 0, 1);
    relOf(T, d, rk.pos, rel); const hdn = hdnAt(T, d);
    const ffx = (T.laneX(d2) - T.laneX(d)) / 8 * sp, ffy = (laneAbs(T, d2) - laneAbs(T, d)) / 8 * sp;   // la piste du niveau monte, descend, tourne : la fusee suit toute seule
    let vlat, vy;
    if (I.mode === 'keys') {   // fleches : la fusee repond tout de suite
      const k = I.k, tx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0), ty = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0), f = Math.min(1, dt * 16);
      I.ax += (tx - I.ax) * f; I.ay += (ty - I.ay) * f;
      vlat = ffx + I.ax * 26 - rel.x * 1.6 * (1 - Math.abs(I.ax)); vy = ffy + I.ay * 24 - rel.y * 1.6 * (1 - Math.abs(I.ay));   // sans touche, la fusee revient doucement au centre de la piste
      vlat += (rel.x > LAT ? LAT - rel.x : rel.x < -LAT ? -LAT - rel.x : 0) * 5;   // la fusee reste dans la bande de la piste du niveau
      vy += (rel.y > HUP ? HUP - rel.y : rel.y < -hdn ? -hdn - rel.y : 0) * 5;
    } else {   // curseur : on vise un point 40 m devant, la fusee y va
      const cam = g.camera; org.copy(cam.position); ray.set(I.cx, -(I.cy * 2 - 1), 0.5).unproject(cam).sub(org).normalize();
      const den = ray.dot(tf); let tx = rel.x, ty = rel.y;
      if (Math.abs(den) > 0.05) { const t = (tmp.copy(rk.pos).sub(org).dot(tf) + 40) / den; if (t > 0) { const P = tmp.copy(org).addScaledVector(ray, t); relOf(T, d + 40, P, relP); tx = relP.x; ty = relP.y; } }
      tx = U.clamp(tx, -LAT, LAT) * ease; ty = U.clamp(ty, -hdn, HUP) * ease;
      vlat = ffx + U.clamp((tx - rel.x) * 5, -30, 30); vy = ffy + U.clamp((ty - rel.y) * 5, -30, 30);
      I.ax = (vlat - ffx) / 26; I.ay = (vy - ffy) / 24;
    }
    const floor = T.base(d) + 1.2; if (rk.pos.y < floor && vy < 0) { vy = 0; rk.pos.y = floor; }
    rk.vel.set(tf.x * sp + nn.x * vlat, vy, tf.z * sp + nn.z * vlat);
    const dir = tmp.copy(rk.vel).normalize(), yaw = Math.atan2(-dir.x, -dir.z), pit = Math.asin(U.clamp(dir.y, -0.9, 0.9));
    g.input.setAim(yaw, pit);
  };

  // ---------------------------------------------------------------- fin, essais, relances
  let ended = null, wantEnd = 0, curRun = null;
  const bestD = () => parseFloat(lsGet('cc.mvp.bd.' + M + '.' + LV, '0')) || 0;
  const step = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !run.T) return;
    if (curRun !== run) { curRun = run; ended = null; g._mvEnd = 0; if (g.ui.overlay === 'evoWin') g.ui.overlay = null; }
    try { document.body.style.cursor = (I.mode === 'keys' && g.state === 'FLIGHT') ? 'none' : ''; } catch (e) { /* ignore */ }
    const FN = E.shortFin || 470;
    { const gt = g._shortGate; if (gt && gt.grp && gt.grp.children[0]) { const gone = g.evoFinish ? U.clamp(1 - (performance.now() - g.evoFinish.t0) / 500, 0, 1) : 1; const dd = FN - Math.max(0, run.dist); gt.grp.children[0].material.opacity = 0.46 * gone * U.clamp((640 - dd) / 220, 0, 1) * (0.2 + 0.8 * U.clamp(dd / 90, 0, 1)); } }   // la ligne apparait en fondu de loin et s'efface une fois franchie
    if (rk.mesh && rk.active) rk.mesh.scale.setScalar(2.4);   // la fusee est plus grosse a l'ecran
    if (ended && wantEnd && performance.now() >= wantEnd) { wantEnd = 0; g.evoWin = { mv: true, t0: performance.now(), lv: LV, info: ended }; g.ui.overlay = 'evoWin'; try { g.audio.play('victory'); } catch (e) { /* son */ } }
    if (g.evoFinish && !g._mvEnd) {
      g._mvEnd = 1; const time = Math.max(0, g.flightTime);
      ended = { time, fails: fails[LV] || 0, kills: (g.evo && g.evo.kills) || 0, t0: performance.now() }; ended.stars = ended.fails === 0 ? 3 : ended.fails === 1 ? 2 : 1;
      const best = parseFloat(lsGet('cc.mvp.best.' + M + '.' + LV, '0')) || 0; ended.rec = !best || time < best; ended.best = best;
      if (ended.rec) lsSet('cc.mvp.best.' + M + '.' + LV, time.toFixed(2));
      lsSet('cc.mvp.bd.' + M + '.' + LV, 1); fails[LV] = 0; wantEnd = performance.now() + 750;
    }
  };
  const restart = (g) => {
    ended = null; wantEnd = 0; g._mvEnd = 0; g.evoWin = null;
    const rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; }
    E.endTumble(g); g.evoReport = false; g.evoLast = null; if (g.rig) g.rig._mv = null; g.goHome({});
  };
  const goNext = (g) => { LV = LV >= NLV ? 1 : LV + 1; lsSet('cc.mvp.lv.' + M, LV); restart(g); };
  E.finishRun = (g) => { g.evoFinish = { t0: performance.now(), hold: true }; try { g.audio.play('finish'); g.flash = 0.8; g.flashColor = '#fff2c0'; g.hitStop = 0.25; g.hitScale = 0.3; g.rig.shake = 0.6; g.audio.setZone('evoDawn', false); } catch (e) { /* effets */ } };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    if (g.rocket && g.rocket.active && g.evo) { g.rocket.fuel = g.rocket.fuelMax = 999; }
    try { step(g, dt); } catch (e) { if (!E._mvErr) { E._mvErr = 1; console.warn('mvp', e); } }
    try { drive(g, dt); } catch (e) { if (!E._mvErr2) { E._mvErr2 = 1; console.warn('mvp drive', e); } }
  };
  E.beginEnd = (g) => {   // echec : on retient le record de distance, puis retour au hangar
    fails[LV] = (fails[LV] || 0) + 1;
    const run = g.endlessRun; if (run) { const p = U.clamp(run.dist / (E.shortFin || 470), 0, 1); if (p > bestD()) lsSet('cc.mvp.bd.' + M + '.' + LV, p.toFixed(3)); }
    restart(g);
  };
  E.onClear = () => { /* la carte de fin prend la suite */ };
  E.mvpState = () => ({ ended, LV });

  // ---------------------------------------------------------------- HUD de vol : l'ancienne barre de progression, couchee et plus petite, + le chrono
  Home.evoUI.hud = function (ctx, g, W0, H) {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk || g.ui.overlay) return;
    const u = H > W0 ? W0 : Math.min(W0, H * 0.62); UI.begin(u, g.hudPr || 1); const S = UI.S, FN = E.shortFin || 470;
    const pct = U.clamp(run.dist / FN, 0, 1), len = Math.min(W0 * 0.3, H * 0.6), bw = len * 0.13, cx = W0 / 2, cy = H * 0.016 + bw / 2 + S(4);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2);   // la barre verticale devient horizontale : depart a gauche, drapeau a droite
    const bh = len, bx = -bw / 2, by = -bh / 2, tx = bx + bw * 0.213, tw2 = bw * 0.567, ty = by + bh * 0.125, th = bh * 0.77, rr = tw2 / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(tx + rr, ty); ctx.arc(tx + rr, ty + rr, rr, -Math.PI / 2, 0); ctx.lineTo(tx + tw2, ty + th - rr); ctx.arc(tx + rr, ty + th - rr, rr, 0, Math.PI); ctx.lineTo(tx, ty + rr); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#696A6D'; ctx.fillRect(tx, ty, tw2, th); ctx.fillStyle = '#387CEE'; ctx.fillRect(tx, ty + th * (1 - pct), tw2, th * pct + 1);
    const gl = ctx.createLinearGradient(tx, 0, tx + tw2, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.3, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(tx, ty + th * (1 - pct), tw2, th * pct + 1);
    const gh = ctx.createLinearGradient(tx, 0, tx + tw2, 0); gh.addColorStop(0, 'rgba(4,16,48,0.6)'); gh.addColorStop(0.26, 'rgba(4,16,48,0)'); gh.addColorStop(0.7, 'rgba(4,16,48,0)'); gh.addColorStop(1, 'rgba(4,16,48,0.45)'); ctx.fillStyle = gh; ctx.fillRect(tx, ty, tw2, th);
    const rec = bestD(); if (rec > 0.02 && rec < 0.999) { const yy = ty + th * (1 - rec); ctx.fillStyle = '#FFE04D'; ctx.fillRect(tx - 1, yy - bw * 0.05, tw2 + 2, bw * 0.1); }   // le record : un trait jaune sur la barre
    ctx.restore();
    if (!UI.artImg(ctx, 'bar', bx + bw / 2, by + bh / 2, bh)) UI.checkFlag(ctx, bx, by, bw, S(60));
    if (rec > 0.02 && rec < 0.999) { const yy = ty + th * (1 - rec), tip = bx + bw * 0.62, aw = bw * 0.36, ah = bw * 0.42; ctx.save(); ctx.fillStyle = '#FFE04D'; ctx.strokeStyle = '#0F3A8C'; ctx.lineWidth = Math.max(2, bw * 0.08); ctx.beginPath(); ctx.moveTo(tip, yy); ctx.lineTo(tip + aw, yy - ah / 2); ctx.lineTo(tip + aw, yy + ah / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetX = S(4); ctx.shadowOffsetY = S(5); UI.icon(ctx, 'missile_ogive', bx + bw / 2, ty + th * (1 - pct) - S(3), bw * 1.25, { rot: -Math.PI / 4 }); ctx.restore();
    ctx.restore();
    const tm = (g.evoFinish && ended ? ended.time : Math.max(0, g.flightTime)).toFixed(1) + ' S';
    UI.text(ctx, tm, cx, cy + bw / 2 + S(34), S(52), '#ffffff', { outline: true });
  };

  // ---------------------------------------------------------------- accueil : le hangar, START au milieu, une fleche de chaque cote
  const startRun = (g) => { if (g.state === 'MENU' && !g.evoAim && !g.evoAnim) E.start(g); };
  Home.drawEvo = function (ui, ctx, g, W0, H) {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, cw, cx } = F, S = UI.S;
    const bx0 = cx - cw / 2 + S(60), by0 = Y(0.07);   // niveau
    UI.levelBadge(ctx, bx0 + S(50), by0, S(48), LV);
    UI.text(ctx, 'NIVEAU ' + LV, bx0 + S(120), by0 - S(14), S(52), '#ffffff', { align: 'left', outline: true });
    UI.text(ctx, cur().name, bx0 + S(120), by0 + S(34), S(34), '#FFD23A', { align: 'left' });
    const bw = cw * 0.46, bh = S(150), bx = cx - bw / 2, by = Y(0.84) - bh / 2, kw = S(118), gap = S(60), t = performance.now() / 1000, pr = (Math.floor(t * 1.6) % 2) === 0;   // START, avec les fleches gauche et droite du jeu
    const kd = CC.Joy && CC.Joy.desk && CC.Joy.desk.keycap;
    if (kd) { kd(ctx, bx - gap - kw / 2, by + bh / 2, kw, 1, pr, 1); kd(ctx, bx + bw + gap + kw / 2, by + bh / 2, kw, 2, !pr, 1); }
    const pulse = 1 + 0.03 * Math.sin(t * 5); ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'START'); ctx.restore();
    UI.tap(ui, bx, by, bw, bh, () => startRun(g));
  };
  Home.drawEvoAim = function () { };   // plus de barre de lancement : START part tout de suite

  // ---------------------------------------------------------------- carte de fin (style MISSION ACCOMPLIE)
  const _win = Home.drawEvoWin;
  Home.drawEvoWin = function (ui, ctx, g, W0, H) {
    const w = g.evoWin; if (!w || !w.mv) return _win.apply(this, arguments);
    const F = Home.evoK.frame(ui, ctx, W0, H), { HH: HH2, Y, T0, cw, cx } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, I2 = w.info;
    ctx.fillStyle = 'rgba(8,10,14,0.55)'; ctx.fillRect(0, T0, W0, HH2);
    { const a = Math.min(1, t / 0.4), ttl = 'NIVEAU ' + w.lv + ' TERMINE !'; ctx.save(); ctx.globalAlpha = a; UI.text(ctx, ttl, cx, Y(0.12), UI.fit(ctx, ttl, cw * 0.92, S(100)), '#FFD23A', { outline: true }); ctx.restore(); }
    for (let k = 0; k < 3; k++) { const on = k < I2.stars, s = Math.min(1, Math.max(0, (t - 0.25 - k * 0.3) / 0.3)), e = s < 1 ? 1 + 0.5 * Math.sin(s * 3.1416) : 1; ctx.save(); if (!on) ctx.globalAlpha = 0.35; Home.evoUI.star(ctx, cx + (k - 1) * S(250), Y(0.27) - (k === 1 ? S(40) : 0), S(115) * (k === 1 ? 1.25 : 1) * s * e); ctx.restore(); }
    UI.text(ctx, I2.time.toFixed(1) + ' S', cx, Y(0.46), S(120), '#ffffff', { outline: true });
    let sub = I2.rec ? 'NOUVEAU RECORD !' : 'MEILLEUR ' + I2.best.toFixed(1) + ' S'; if (I2.kills) sub += '   ENNEMIS ' + I2.kills;
    UI.text(ctx, sub, cx, Y(0.55), UI.fit(ctx, sub, cw * 0.9, S(56)), I2.rec ? '#FFD23A' : '#dfe6f0', {});
    if (t > 0.9) {
      const bw = cw * 0.62, bh = S(150), bx = cx - bw / 2, by = Y(0.68), pulse = 1 + 0.03 * Math.sin(t * 5);
      ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'SUIVANT'); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => goNext(g));
      const sw = cw * 0.3, sh = S(110), sy = Y(0.84), gp = S(30);
      UI.btnSecondary(ctx, cx - gp / 2 - sw, sy, sw, sh, 'REJOUER'); UI.tap(ui, cx - gp / 2 - sw, sy, sw, sh, () => restart(g));
      UI.btnSecondary(ctx, cx + gp / 2, sy, sw, sh, 'MENU'); UI.tap(ui, cx + gp / 2, sy, sw, sh, () => restart(g));
    }
  };

  // ---------------------------------------------------------------- accueil toujours affiche : le hangar reste a l'ecran
  setInterval(() => {
    const g = CC.game; if (!g || !g.padMode || !g.ui) return;
    try { const S = E.save(g); if (S && !S.tutPC) { S.tutPC = 1; } } catch (e) { /* ignore */ }
    const ov = g.ui.overlay;
    if (g.state === 'MENU' && !g.evoAim && !g.evoAnim && (!ov || ov === 'terms' || ov === 'evoIntro' || ov === 'evoCine' || ov === 'evoShop' || ov === 'evoChest' || ov === 'evoReport' || ov === 'evoSkins') && !ended) g.ui.overlay = 'evo';
    if (g.state === 'LAUNCH' && g.evoAim && !g.evoAim.lock && g.evoAim.t > 0.12) E.lock(g);   // START : la fusee part tout de suite
  }, 40);
})();
