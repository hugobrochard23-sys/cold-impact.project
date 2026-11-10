/* v366 : MVP A + COURSE (mvp=r) (?mvp=a) : des niveaux courts faits avec les DECORS ET LES SCENES DEJA DANS LE JEU (aucune texture ni brique nouvelle).
 * Chaque niveau = une zone existante + une suite de scenes existantes (vitres a casser, pentes, fosses, montagnes russes, grottes, eau...) ; la fusee
 * avance a vitesse constante le long de la piste du niveau ; le joueur ne fait que la decaler (curseur ou fleches) pour viser les ennemis et eviter les murs.
 * Camera : suit la piste du niveau (si le niveau descend, la camera descend ; si la fusee descend dans le niveau, la camera ne bouge pas).
 * Accueil = le hangar avec START et les fleches ; mort = explosion et retour immediat au hangar ; fin = carte style MISSION ACCOMPLIE. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const mm = /[?&]mvp=([abcr])/.exec(location.search), M = mm ? mm[1] : (/^[abcr]$/.test(window.CC_MVP || '') ? window.CC_MVP : null);
  if (M !== 'a' && M !== 'r') return;   // B et C : evo_mvpb.js
  E.mvp = () => M;
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
  { const z = /[?&]mvpz=(\w+)/.exec(location.search), sc = /[?&]mvps=([\w,]+)/.exec(location.search); if (z && sc && LV > 1) { const cp = /[?&]mvpc=(\d+)/.exec(location.search); LEVELS[LV] = Object.assign({}, LEVELS[LV], { zone: z[1], scenes: sc[1].split(','), cap: cp ? +cp[1] : 0 }); } }   // essai d'un decor a la main
  // ---------------------------------------------------------------- COURSE (?mvp=r) : des manches d'elimination contre des pilotes IA (pas du reseau)
  const RACE = M === 'r';
  const COURSES = [   // des courses faites de scenes DEJA dans le jeu (chapitres du niveau 1, ville de jour) ; chaque scene recoit quelques ennemis bien en vue
    { name: 'PRAIRIE', zone: 'campagne', scenes: ['rampe', 'camp'], fin: 800, tilt: true, speed: 44 },
    { name: 'VILLE', zone: 'city', speed: 46, scenes: [{ n: 'passage', foes: [['tank', 0.5, -3], ['jeep', 0.8, 4]] }, 'vitrage', { n: 'montee', foes: [['heli', 0.45, 0, 0], ['heli', 0.8, 3, 2]] }, { n: 'plongee', foes: [['heli', 0.5, -2, 0]] }] },
    { name: 'CANYON', zone: 'campagne', speed: 45, cap: 1100, scenes: [{ n: 'vallee', foes: [['heli', 0.25, 0, 0], ['tank', 0.5, -3], ['heli', 0.7, 3, 2]] }, { n: 'falaise', foes: [['heli', 0.3, -2, 0], ['jeep', 0.55, 3], ['heli', 0.8, 0, 1]] }] },
    { name: 'RIVIERE', zone: 'campagne', speed: 45, cap: 1000, scenes: [{ n: 'riviere', foes: [['heli', 0.35, 0, 0], ['boat', 0.65, 2]] }, { n: 'vallee', foes: [['heli', 0.3, 2, 0], ['tank', 0.55, -3], ['heli', 0.8, -2, 2]] }] },
    { name: 'VILLE NEON', zone: 'campagne', speed: 46, scenes: [{ n: 'ville', foes: [['heli', 0.2, 0, 0], ['tank', 0.4, 3], ['heli', 0.6, -3, 2], ['jeep', 0.8, -2]] }] },
    { name: 'CHATEAU', zone: 'campagne', speed: 46, cap: 1040, scenes: [{ n: 'porte', foes: [['heli', 0.35, 0, 0], ['tank', 0.65, -3]] }, { n: 'noyau', foes: [['heli', 0.4, 0, 0]] }] },
    { name: 'BASE', zone: 'campagne', speed: 46, cap: 1100, scenes: [{ n: 'base', foes: [['heli', 0.3, 0, 0], ['tank', 0.55, -3], ['heli', 0.8, 3, 1]] }, { n: 'approche', foes: [['heli', 0.3, 0, 0], ['jeep', 0.5, 3], ['heli', 0.75, -3, 1]] }] }
  ];
  const R = { round: 1, courses: [], field: [32, 16, 8], keep: [16, 8, 1], last: null, live: 1, ease: parseFloat(lsGet('cc.race.ease', '0')) || 0, penT: 0, session: 0 };
  let W = null;   // le monde de la manche (pilotes, fleches de vitesse)
  const cur = () => (RACE ? R.courses[R.round - 1] : LEVELS[LV]);
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
  const SP = () => (cur().speed || 44) + (W && W.boostT > 0 ? 12 : 0);
  const _rk = E.rocket;   // carburant illimite, jamais en panne
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };
  E.softCrash = () => false;   // la mort = une explosion simple, pas de roule-boule

  // la fiche du niveau
  const _ld = E.levelDef;
  E.levelDef = (g) => {
    if (E.isS2()) return _ld(g);
    const L = cur(); E.chapters = [];
    if (L.tilt) { E.shortTiltOff = false; E.shortFin = L.fin; return E.baseDef({ zone: 'campagne', len: L.fin + 90, scenes: L.scenes, order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], hp: 1, bossEnt: null, seed: RACE ? 4000 + R.session * 13 + R.round * 7 : 5151 }); }   // la prairie penchee (evo_short.js)
    E.shortTiltOff = true; E.shortPad = L.pad || 0;
    const Z = CC.Zones.defs[L.zone], sc = L.scenes.map((e) => (typeof e === 'string' ? e : withFoes(L.zone, e.n, e.foes, 'mv' + (RACE ? 'r' + L.name.replace(/\W/g, '') : LV)))).filter((n) => n && Z.scenes[n]); let tot = 0; for (const n of sc) tot += Z.scenes[n].len[0]; tot = Math.min(tot, L.cap || 1e9);   // un parcours peut ne prendre que le debut d'une longue scene
    E.shortFin = tot + 25;   // la ligne est juste avant l'arene de fin
    return E.baseDef({ zone: L.zone, len: tot + 160, scenes: sc, order: new Array(90).fill(L.zone), theme: CC.LM.THEMES[0], hp: 1, bossEnt: null, seed: RACE ? 4000 + R.session * 13 + R.round * 7 : 5151 });
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
  const BOT_NAMES = ['NOVA', 'ROCKY', 'TURBO', 'ZIGGY', 'COMETE', 'FLASH', 'BOLT', 'ORION', 'PEPPER', 'VIPER', 'MAVERICK', 'LUNA', 'JETTE', 'STORM', 'PIXEL', 'ACE', 'BLITZ', 'COSMO', 'DINGO', 'ECHO', 'FALCON', 'GIZMO', 'HAWK', 'IGOR', 'JUNO', 'KIWI', 'LYNX', 'MOXIE', 'NITRO', 'OTTO', 'PHOENIX', 'QUARK', 'RADAR', 'SPARK', 'TANGO', 'UMBRA', 'VEGA', 'WASP', 'XENO', 'YETI'];
  const BOT_COL = ['#e8352b', '#2f8cff', '#2fae22', '#f5c518', '#a64cf0', '#ff7a1a', '#17c3b2', '#ff4f9a', '#9aa3ad', '#7bd13a'];
  let sSeed = 1; const sr = () => (sSeed = (sSeed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const gz = () => (sr() + sr() + sr() + sr() - 2) * 1.7;
  const ord = (n) => (n === 1 ? '1ER' : n + 'E');
  const newSession = () => {
    sSeed = ((Date.now() & 0xffffff) + 17 * (++R.session)) >>> 0; const pool = COURSES.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    R.courses = [pool[0], pool[1 % pool.length], pool[2 % pool.length]]; R.round = 1; R.last = null;
    { const f = /[?&]racec=(\w+)/.exec(location.search); const one = f && COURSES.find((c) => c.name.replace(/\W/g, '') === f[1]); if (one) R.courses = [one, one, one]; }   // essai d'une course a la main
  };
  if (RACE) newSession();
  const botD = (b, t, FN) => { let p; const tc = b.pc * b.tRun; if (!b.crash || t < tc) p = t / b.tRun; else if (t < tc + 2.5) p = b.pc; else p = (t - 2.5) / b.tRun; return FN * U.clamp(p, 0, 1); };
  const lanePos = (T, d, dx, dy, out) => { const p = T.at(d, T.laneX(d) + dx, T.laneY(d) + dy); return out.set(p[0], p[1], p[2]); };
  const buildRace = (g, run) => {   // le monde de la manche : fleches de vitesse sur la piste, pilotes IA
    if (W) { try { g.scene.remove(W.grp); } catch (e) { /* ignore */ } }
    const T = run.T, grp = new T3.Group(), FN = E.shortFin || 470, sp = cur().speed || 44, rd = R.round - 1;
    W = { run, grp, boosts: [], bots: [], pool: [], boostT: 0, kills: 0, fin: FN };
    g.scene.add(grp);
    const offs = [-5, 4, -3, 5, -4, 3], dys = [0, 2, -1, 2, 0, 1];   // des fleches de vitesse : il faut un peu bouger pour les prendre
    for (let k = 0, d = 110; d < FN - 70; k++, d += 115) {
      const off = offs[k % offs.length], dy = dys[k % dys.length], o = new T3.Group(), tmpA = new V(), tmpB = new V();
      for (let j = 0; j < 3; j++) { const ar = CC.Models.guideArrow(); lanePos(T, d + j * 5 - 5, off, dy, tmpA); ar.position.copy(tmpA); lanePos(T, d + j * 5 - 2, off, dy, tmpB); ar.lookAt(tmpB); ar.scale.setScalar(1.9); o.add(ar); }
      grp.add(o); W.boosts.push({ d, off, dy, grp: o, taken: false });
    }
    const n = R.field[rd] - 1, T0 = FN / sp - 0.5, mean = [0, -0.6, -1.0][rd] + R.ease, std = [1.3, 1.0, 0.8][rd];
    for (let i = 0; i < n; i++) {
      const tRun = Math.max(T0 * 0.7, T0 + mean + gz() * std), crash = sr() < 0.22;
      W.bots.push({ i, name: BOT_NAMES[(i * 7 + rd * 3) % BOT_NAMES.length], tRun, crash, pc: 0.2 + 0.6 * sr(), T: tRun + (crash ? 2.5 : 0), off: (sr() - 0.5) * 13, dy: (sr() - 0.5) * 5, ph: sr() * 6.28, col: BOT_COL[i % BOT_COL.length], boom: false, d: 0 });
    }
    const baseSkin = CC.Skins.byId.evoT2;
    for (let k = 0; k < 12; k++) { const col = BOT_COL[k % BOT_COL.length], sk = Object.assign({}, baseSkin, { c: Object.assign({}, baseSkin.c, { body: col, tip: col, band: '#ffffff' }) }), m = CC.Models.rocket(sk); m.scale.setScalar(1.8); m.visible = false; grp.add(m); W.pool.push(m); }
  };
  const raceStep = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket, T = run.T, FN = E.shortFin || 470, t = Math.max(0, g.flightTime), flying = g.state === 'FLIGHT' && rk.active, fin = !!g.evoFinish;
    if (W.boostT > 0) W.boostT -= dt;
    if (flying && !fin) {
      relOf(T, run.dist, rk.pos, rel);
      for (const b of W.boosts) if (!b.taken && Math.abs(run.dist - b.d) < 5 && Math.abs(rel.x - b.off) < 4.5 && Math.abs(rel.y - b.dy) < 4.5) { b.taken = true; b.grp.visible = false; W.boostT = 1.3; try { g.rig.boostKick(); g.audio.play('target'); } catch (e) { /* effets */ } }
      const kl = (g.evo && g.evo.kills) || 0; if (kl > W.kills) { W.kills = kl; W.boostT = Math.max(W.boostT, 0.8); }
    }
    // les pilotes IA
    if (fin) { for (const m of W.pool) m.visible = false; return; }   // apres l'arrivee, plus de pilotes a l'ecran (la carte de fin prend la suite)
    let ahead = 0; const vis = [];
    for (const b of W.bots) {
      b.d = botD(b, t, FN); if (b.d > Math.max(0, run.dist)) ahead++;
      const tc = b.pc * b.tRun; if (b.crash && !b.boom && t >= tc && Math.abs(b.d - run.dist) < 200) { b.boom = true; lanePos(T, b.d, b.off, b.dy, tmp2); try { g.effects.explosion(tmp2.clone(), new V(0, 1, 0), false, 'orange'); } catch (e) { /* effets */ } }
      if (t > 0.2 && Math.abs(b.d - run.dist) < 220 && !(b.crash && t >= tc + 0.3 && t < tc + 2.5)) vis.push(b);
    }
    vis.sort((a, c) => Math.abs(a.d - run.dist) - Math.abs(c.d - run.dist));
    for (let k = 0; k < W.pool.length; k++) {
      const m = W.pool[k], b = vis[k]; if (!b) { m.visible = false; continue; }
      const wob = 1.5 * Math.sin(t * 1.3 + b.ph); lanePos(T, b.d, b.off + wob, b.dy, m.position); lanePos(T, b.d + 6, b.off + wob, b.dy, tmp2); m.lookAt(tmp2); m.visible = true;
    }
    R.live = 1 + ahead;
  };
  const respawn = (g) => {   // un echec = on repart juste avant l'obstacle, avec du temps perdu (pas de menu)
    const run = g.endlessRun, rk = g.rocket, T = run.T, d = Math.max(20, run.dist - 40), p = T.at(d, T.laneX(d), T.laneY(d)), q = T.at(d + 3, T.laneX(d + 3), T.laneY(d + 3));
    const pos = new V(p[0], p[1], p[2]), dir = new V(q[0] - p[0], q[1] - p[1], q[2] - p[2]).normalize(), yaw = Math.atan2(-dir.x, -dir.z), pit = Math.asin(dir.y);
    g.input.setAim(yaw, pit); g.rig.setAim(yaw, pit); g.acc = 0;
    rk.launch(pos, dir, { speed: cur().speed || 44, ignited: true, freeBoost: 0.5 }); rk.shieldT = 1.4;
    run.dist = d; if (g.rig) g.rig._mv = null; g.rig.startFlight(); g.state = 'FLIGHT'; g.stallT = 0; g.impactT = 0; g.flightTime += 2.5; R.penT = performance.now();
    try { g.audio.play('shield'); } catch (e) { /* son */ }
  };
  let ended = null, wantEnd = 0, curRun = null;
  const bestD = () => parseFloat(lsGet('cc.mvp.bd.' + M + '.' + LV, '0')) || 0;
  const step = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !run.T) return;
    if (curRun !== run) { curRun = run; ended = null; g._mvEnd = 0; if (g.ui.overlay === 'evoWin') g.ui.overlay = null; if (RACE) buildRace(g, run); }
    try { document.body.style.cursor = (I.mode === 'keys' && g.state === 'FLIGHT') ? 'none' : ''; } catch (e) { /* ignore */ }
    const FN = E.shortFin || 470;
    { const gt = g._shortGate; if (gt && gt.grp && gt.grp.children[0]) { const gone = g.evoFinish ? U.clamp(1 - (performance.now() - g.evoFinish.t0) / 500, 0, 1) : 1; const dd = FN - Math.max(0, run.dist); gt.grp.children[0].material.opacity = 0.46 * gone * U.clamp((640 - dd) / 220, 0, 1) * (0.2 + 0.8 * U.clamp(dd / 90, 0, 1)); } }   // la ligne apparait en fondu de loin et s'efface une fois franchie
    if (rk.mesh && rk.active) rk.mesh.scale.setScalar(2.4);   // la fusee est plus grosse a l'ecran
    if (RACE && W && W.run === run) raceStep(g, dt);
    if (ended && wantEnd && performance.now() >= wantEnd) { wantEnd = 0; g.evoWin = { mv: true, race: RACE, t0: performance.now(), lv: LV, info: ended }; g.ui.overlay = 'evoWin'; try { g.audio.play('victory'); } catch (e) { /* son */ } }
    if (RACE && g.evoFinish && !g._mvEnd && W) {   // fin de manche : le rang parmi les pilotes
      g._mvEnd = 1; const time = Math.max(0, g.flightTime), rd = R.round - 1, nb = W.bots.filter((b) => b.T < time).length, rank = 1 + nb, qual = rank <= R.keep[rd];
      const rows = W.bots.map((b) => ({ name: b.name, time: b.T })); rows.push({ name: 'TOI', time, you: true }); rows.sort((x, y) => x.time - y.time);
      R.last = { time, rank, field: R.field[rd], qual, final: rd === 2, round: R.round, rows: rows.slice(0, 5), you: rows.findIndex((x) => x.you), kills: (g.evo && g.evo.kills) || 0, t0: performance.now() };
      if (rd === 0) { R.ease = U.clamp(R.ease + (qual ? -0.1 : 0.3), -0.3, 1.2); lsSet('cc.race.ease', R.ease.toFixed(2)); }
      ended = R.last; wantEnd = performance.now() + 750; return;
    }
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
  const goNext = (g) => { if (RACE) { const L = R.last; if (L && L.qual && !L.final) R.round++; else newSession(); restart(g); return; } LV = LV >= NLV ? 1 : LV + 1; lsSet('cc.mvp.lv.' + M, LV); restart(g); };
  E.finishRun = (g) => { g.evoFinish = { t0: performance.now(), hold: true }; try { g.audio.play('finish'); g.flash = 0.8; g.flashColor = '#fff2c0'; g.hitStop = 0.25; g.hitScale = 0.3; g.rig.shake = 0.6; g.audio.setZone('evoDawn', false); } catch (e) { /* effets */ } };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    if (g.rocket && g.rocket.active && g.evo) { g.rocket.fuel = g.rocket.fuelMax = 999; }
    try { step(g, dt); } catch (e) { if (!E._mvErr) { E._mvErr = 1; console.warn('mvp', e); } }
    try { drive(g, dt); } catch (e) { if (!E._mvErr2) { E._mvErr2 = 1; console.warn('mvp drive', e); } }
  };
  E.beginEnd = (g) => {   // echec : on retient le record de distance, puis retour au hangar
    if (RACE) { respawn(g); return; }
    fails[LV] = (fails[LV] || 0) + 1;
    const run = g.endlessRun; if (run) { const p = U.clamp(run.dist / (E.shortFin || 470), 0, 1); if (p > bestD()) lsSet('cc.mvp.bd.' + M + '.' + LV, p.toFixed(3)); }
    restart(g);
  };
  E.onClear = () => { /* la carte de fin prend la suite */ };
  E.mvpState = () => ({ ended, LV });
  E.raceState = () => ({ R, W });

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
    const rec = RACE ? 0 : bestD(); if (rec > 0.02 && rec < 0.999) { const yy = ty + th * (1 - rec); ctx.fillStyle = '#FFE04D'; ctx.fillRect(tx - 1, yy - bw * 0.05, tw2 + 2, bw * 0.1); }   // le record : un trait jaune sur la barre
    ctx.restore();
    if (!UI.artImg(ctx, 'bar', bx + bw / 2, by + bh / 2, bh)) UI.checkFlag(ctx, bx, by, bw, S(60));
    if (rec > 0.02 && rec < 0.999) { const yy = ty + th * (1 - rec), tip = bx + bw * 0.62, aw = bw * 0.36, ah = bw * 0.42; ctx.save(); ctx.fillStyle = '#FFE04D'; ctx.strokeStyle = '#0F3A8C'; ctx.lineWidth = Math.max(2, bw * 0.08); ctx.beginPath(); ctx.moveTo(tip, yy); ctx.lineTo(tip + aw, yy - ah / 2); ctx.lineTo(tip + aw, yy + ah / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetX = S(4); ctx.shadowOffsetY = S(5); UI.icon(ctx, 'missile_ogive', bx + bw / 2, ty + th * (1 - pct) - S(3), bw * 1.25, { rot: -Math.PI / 4 }); ctx.restore();
    ctx.restore();
    const tm = (g.evoFinish && ended ? ended.time : Math.max(0, g.flightTime)).toFixed(1) + ' S';
    UI.text(ctx, tm, cx, cy + bw / 2 + S(34), S(52), '#ffffff', { outline: true });
    if (RACE) {
      const rd = R.round - 1;
      UI.text(ctx, ord(R.live) + ' / ' + R.field[rd], cx + len / 2 + S(165), cy + S(2), S(84), '#FFD23A', { outline: true });
      UI.text(ctx, rd === 2 ? 'FINALE' : 'TOP ' + R.keep[rd], cx + len / 2 + S(165), cy + S(58), S(34), R.live <= R.keep[rd] ? '#7CFF6A' : '#dfe6f0', {});
      UI.text(ctx, 'MANCHE ' + R.round + '/3', cx - len / 2 - S(150), cy + S(2), S(46), '#ffffff', { outline: true });
      if (performance.now() - R.penT < 1500) UI.text(ctx, '+2.5 S', cx, H * 0.3, S(96), '#FF5A4A', { outline: true });
      else if (W && W.boostT > 0) UI.text(ctx, 'TURBO !', cx, H * 0.3, S(78), '#7CFF6A', { outline: true });
    }
  };

  // ---------------------------------------------------------------- accueil : le hangar, START au milieu, une fleche de chaque cote
  const startRun = (g) => { if (g.state === 'MENU' && !g.evoAim && !g.evoAnim) E.start(g); };
  Home.drawEvo = function (ui, ctx, g, W0, H) {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, cw, cx } = F, S = UI.S;
    const bx0 = cx - cw / 2 + S(60), by0 = Y(0.07);   // niveau
    if (RACE) {
      UI.levelBadge(ctx, bx0 + S(50), by0, S(48), R.round);
      UI.text(ctx, 'MANCHE ' + R.round + ' / 3', bx0 + S(120), by0 - S(14), S(52), '#ffffff', { align: 'left', outline: true });
      UI.text(ctx, cur().name + '  -  ' + R.field[R.round - 1] + ' PILOTES', bx0 + S(120), by0 + S(34), S(34), '#FFD23A', { align: 'left' });
    } else {
      UI.levelBadge(ctx, bx0 + S(50), by0, S(48), LV);
      UI.text(ctx, 'NIVEAU ' + LV, bx0 + S(120), by0 - S(14), S(52), '#ffffff', { align: 'left', outline: true });
      UI.text(ctx, cur().name, bx0 + S(120), by0 + S(34), S(34), '#FFD23A', { align: 'left' });
    }
    const bw = cw * 0.46, bh = S(150), bx = cx - bw / 2, by = Y(0.84) - bh / 2, kw = S(118), gap = S(60), t = performance.now() / 1000, pr = (Math.floor(t * 1.6) % 2) === 0;   // START, avec les fleches gauche et droite du jeu
    const kd = CC.Joy && CC.Joy.desk && CC.Joy.desk.keycap;
    if (kd) { kd(ctx, bx - gap - kw / 2, by + bh / 2, kw, 1, pr, 1); kd(ctx, bx + bw + gap + kw / 2, by + bh / 2, kw, 2, !pr, 1); }
    const pulse = 1 + 0.03 * Math.sin(t * 5); ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'START'); ctx.restore();
    UI.tap(ui, bx, by, bw, bh, () => startRun(g));
  };
  Home.drawEvoAim = function () { };   // plus de barre de lancement : START part tout de suite

  // ---------------------------------------------------------------- carte de fin (style MISSION ACCOMPLIE)
  const drawRaceCard = (ui, ctx, g, W0, H, w) => {
    const F = Home.evoK.frame(ui, ctx, W0, H), { HH: HH2, Y, T0, cw, cx } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, L = w.info;
    ctx.fillStyle = 'rgba(8,10,14,0.62)'; ctx.fillRect(0, T0, W0, HH2);
    const win = L.final && L.rank === 1, good = L.final ? L.rank <= 3 : L.qual;
    const title = L.final ? (win ? 'VICTOIRE !' : L.rank <= 3 ? 'PODIUM !' : 'FINALE TERMINEE') : (L.qual ? 'QUALIFIE !' : 'ELIMINE');
    { const a = Math.min(1, t / 0.35); ctx.save(); ctx.globalAlpha = a; UI.text(ctx, title, cx, Y(0.1), UI.fit(ctx, title, cw * 0.92, S(110)), good ? '#FFD23A' : '#FF5A4A', { outline: true }); ctx.restore(); }
    { const k = Math.min(1, Math.max(0, (t - 0.15) / 0.3)), e = k < 1 ? 1 + 0.4 * Math.sin(k * 3.1416) : 1; UI.text(ctx, ord(L.rank) + ' / ' + L.field, cx, Y(0.235), S(165) * e, '#ffffff', { outline: true }); }
    UI.text(ctx, L.time.toFixed(1) + ' S' + (L.kills ? '    ENNEMIS ' + L.kills : ''), cx, Y(0.345), S(58), '#dfe6f0', {});
    const pw = cw * 0.74, px = cx - pw / 2, ry0 = Y(0.41), rh = S(60), rows = L.rows.slice();
    if (L.rank > rows.length) rows.push({ name: 'TOI', time: L.time, you: true, rank: L.rank });
    ctx.save(); UI.rrect(ctx, px - S(20), ry0 - S(10), pw + S(40), rh * rows.length + S(20), S(22)); ctx.fillStyle = 'rgba(12,18,30,0.55)'; ctx.fill(); ctx.restore();
    rows.forEach((r, i) => {
      const y = ry0 + i * rh + rh / 2, rk = r.rank || (i + 1);
      if (r.you) { ctx.fillStyle = 'rgba(255,210,58,0.28)'; ctx.fillRect(px - S(14), y - rh / 2 + S(4), pw + S(28), rh - S(8)); }
      UI.text(ctx, String(rk), px + S(28), y, S(40), r.you ? '#FFD23A' : '#ffffff', { align: 'left' });
      UI.text(ctx, r.name, px + S(110), y, S(40), r.you ? '#FFD23A' : '#ffffff', { align: 'left' });
      UI.text(ctx, r.time.toFixed(1) + ' S', px + pw - S(10), y, S(40), r.you ? '#FFD23A' : '#dfe6f0', { align: 'right' });
    });
    const sub = L.final ? '' : L.qual ? 'LES ' + L.keep + ' PREMIERS SONT QUALIFIES' : 'IL FALLAIT ETRE DANS LES ' + L.keep;
    L.keep = L.keep || R.keep[L.round - 1];
    if (t > 0.8) {
      const bw = cw * 0.66, bh = S(140), bx = cx - bw / 2, by = Y(0.86) - bh / 2, pulse = 1 + 0.03 * Math.sin(t * 5), label = (L.qual && !L.final) ? 'MANCHE SUIVANTE' : 'NOUVELLE PARTIE';
      ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, label); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => goNext(g));
    }
  };
  const _win = Home.drawEvoWin;
  Home.drawEvoWin = function (ui, ctx, g, W0, H) {
    const w = g.evoWin; if (!w || !w.mv) return _win.apply(this, arguments);
    if (w.race) return drawRaceCard(ui, ctx, g, W0, H, w);
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
