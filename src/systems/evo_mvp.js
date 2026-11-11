/* v367 : MVP A + COURSE (mvp=r) (?mvp=a) : des niveaux courts faits avec les DECORS ET LES SCENES DEJA DANS LE JEU (aucune texture ni brique nouvelle).
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
    { name: 'PRAIRIE', open: true, zone: 'campagne', scenes: ['rampe', 'camp'], fin: 470, tilt: true, speed: 43 },   // 11 s : la prairie penchee, char / helico / camion / jeep
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
    { name: 'CANYON', open: true, zone: 'campagne', speed: 45, cap: 1100, scenes: [{ n: 'vallee', foes: [['heli', 0.25, 0, 0], ['tank', 0.5, -3], ['heli', 0.7, 3, 2]] }, { n: 'falaise', foes: [['heli', 0.3, -2, 0], ['jeep', 0.55, 3], ['heli', 0.8, 0, 1]] }] },
    { name: 'RIVIERE', open: true, zone: 'campagne', speed: 45, cap: 1000, scenes: [{ n: 'riviere', foes: [['heli', 0.35, 0, 0], ['boat', 0.65, 2]] }, { n: 'vallee', foes: [['heli', 0.3, 2, 0], ['tank', 0.55, -3], ['heli', 0.8, -2, 2]] }] },
    { name: 'VILLE NEON', open: true, zone: 'campagne', speed: 46, scenes: [{ n: 'ville', foes: [['heli', 0.2, 0, 0], ['tank', 0.4, 3], ['heli', 0.6, -3, 2], ['jeep', 0.8, -2]] }] },
    { name: 'CHATEAU', zone: 'campagne', speed: 46, cap: 1040, scenes: [{ n: 'porte', foes: [['heli', 0.35, 0, 0], ['tank', 0.65, -3]] }, { n: 'noyau', foes: [['heli', 0.4, 0, 0]] }] },
    { name: 'CITY RUSH', zone: 'city', speed: 46, scenes: [{ n: 'passage', foes: [['tank', 0.5, -3]] }, { n: 'virage', foes: [['heli', 0.5, 0, 1]] }, { n: 'chicane', foes: [['jeep', 0.4, 2], ['heli', 0.75, -2, 1]] }, { n: 'montagnesRusses', foes: [['heli', 0.3, 0, 0], ['heli', 0.7, 3, 2]] }, { n: 'chuteLibre', foes: [['heli', 0.5, 0, 0]] }, 'vitrage', { n: 'plongee', foes: [['heli', 0.5, -2, 0]] }] },
    { name: 'BASE', open: true, zone: 'campagne', speed: 46, cap: 1100, scenes: [{ n: 'base', foes: [['heli', 0.3, 0, 0], ['tank', 0.55, -3], ['heli', 0.8, 3, 1]] }, { n: 'approche', foes: [['heli', 0.3, 0, 0], ['jeep', 0.5, 3], ['heli', 0.75, -3, 1]] }] }
  ];
  // v368 : les VRAIS parcours de course : une trajectoire 3D qui tourne et descend tout le temps (evo_course.js)
  // segment = [longueur, virage en degres (+ droite), pente (m de descente par m), hauteur au-dessus du sol, demi-largeur du couloir, hauteur des murs]
  const SHAPES = [
    { name: 'COULEE', seed: 11, shape: [[140, 0, 0.07, 22, 15], [200, 100, 0.2, 20, 9], [170, -150, 0.2, 16, 7], [100, 0, 0.5, 40, 9, 4], [300, 270, 0.08, 28, 8], [260, 0, 0.06, 26, 7], [220, -120, 0.2, 18, 8], [190, 0, 0.3, 24, 11], [170, 0, 0.04, 14, 17]] },
    { name: 'SPIRALE', seed: 23, shape: [[140, 0, 0.07, 22, 15], [420, 360, 0.11, 30, 9], [100, 0, 0.1, 14, 5.5], [200, -130, 0.26, 26, 8], [120, 0, 0.55, 44, 9, 4], [230, 150, 0.22, 20, 7], [260, -250, 0.22, 22, 8], [170, 0, 0.04, 14, 17]] },
    { name: 'SERPENT', seed: 37, shape: [[140, 0, 0.08, 22, 15], [220, -90, 0.2, 20, 9], [200, 180, 0.2, 22, 8], [160, -160, 0.16, 30, 7], [120, 0, 0.55, 46, 9, 4], [300, 270, 0.07, 24, 7], [150, 0, 0.06, 14, 5.5], [250, -120, 0.2, 22, 9], [170, 0, 0.04, 14, 17]] }
  ];
  for (const s0 of SHAPES) { s0.zone = 'campagne'; s0.speed = 46; s0.cap = 0; s0.scenes = E.courseScenes || ['rampe', 'camp']; COURSES.unshift(s0); }
  if (E.isleShape) { const mir = E.isleShape.map((q) => [q[0], -q[1]].concat(q.slice(2))); [[2, mir], [1, mir], [0, E.isleShape]].forEach(([v, sh]) => COURSES.unshift({ name: 'ARCHIPEL ' + (v + 1), variant: v, seed: 5, isle: true, shape: v === 2 ? E.isleShape : sh, zone: 'campagne', speed: 36, cap: 0, scenes: E.isleScenes || ['crsI0'] })); }   // v370 : l'ile (la Coupe se court dessus)
const CUP = SHAPES.map((s) => s.name);
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
  const SP = () => (cur().speed || 44) + (W && W.boostT > 0 ? (cur().isle ? 7 : 12) : 0);
  const _rk = E.rocket;   // carburant illimite, jamais en panne
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };
  E.softCrash = () => false;   // la mort = une explosion simple, pas de roule-boule

  // la fiche du niveau
  const _ld = E.levelDef;
  E.levelDef = (g) => {
    if (E.isS2()) return _ld(g);
    const L = cur(); E.chapters = []; E.course = null;
    if (L.shape) { E.course = L.isle ? E.mkIsle(L.shape, L.variant) : E.courseExtras(E.mkCourse(L.shape), L.seed || 7); E.shortTiltOff = true; E.shortPad = 0; E.shortFin = Math.round(E.course.len); return E.baseDef({ zone: L.zone, len: E.shortFin + 160, scenes: L.scenes, order: new Array(90).fill(L.zone), theme: CC.LM.THEMES[0], hp: 1, bossEnt: null, seed: RACE ? 4000 + R.session * 13 + R.round * 7 : 5151 }); }
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
  const LAT = 9, HUP = 8, hdnAt = (T, d) => (E.course && E.course.isle ? ((W && W.fall && (W.fall.on || W.fall.ctrl < 1)) || Math.abs(rel.x) > E.course.isle.W(d) - 0.5 ? 200 : E.course.fl - 2.2) : E.course ? E.course.fl - 1.5 : cur().open ? 40 : U.clamp(T.laneY(d) - 2.2, 6, 22));   // on peut descendre jusqu'au sol (ou a la mer) pour atteindre les ennemis

  // ---------------------------------------------------------------- camera : suit la piste du niveau, a distance fixe de la fusee
  const camP = new V(), camL = new V();
  const LPOS = new V(), LLOK = new V();
  E.mvpCam = (rig, rk, cam, dt) => {
    const g = rig.game, run = g.endlessRun; if (!run || !run.T) return;
    const T = run.T, lt = Math.max(0, g.flightTime || 0), w = U.clamp(1 - U.smooth(0.15, 2.9, lt), 0, 1);   // w : le decollage (1) -> la vue de course (0)
    const dR = run.dist > 1 ? run.dist : Math.min(0, -rk.pos.z), d = Math.max(0, run.dist), k = Math.min(1, (dt || 0.016) * (9 - 5.2 * w));
    relOf(T, Math.max(0, dR), rk.pos, rel);
    const isl = !!(E.course && E.course.isle), kf = cur().open ? 0.85 : 0.5, dc = dR - (isl ? 11 : 8.5), d2 = dc + (isl ? 66 : 40), fx = rel.x * kf, fy = rel.y * (kf * 0.8);
    const pa = T.at(dc, T.laneX(Math.max(0, dc)) + fx, T.laneY(Math.max(0, dc)) + (isl ? 4.6 : 2.2) + fy), pb = T.at(d2, T.laneX(Math.max(0, d2)) + fx, T.laneY(Math.max(0, d2)) + 0.2 + fy);
    camP.set(pa[0], Math.max(pa[1], T.base(Math.max(0, dc)) + 1.2), pa[2]); camL.set(pb[0], pb[1], pb[2]);
    { const y0 = camP.y; camP.y = U.clamp(camP.y, rk.pos.y + 1.2, rk.pos.y + (isl ? 6.6 : 3.8)); camL.y += camP.y - y0; }   // la fusee ne sort jamais du champ (au depart, en plongee)
    if (W && W.free) {   // raccourci : la camera suit la fusee derriere elle
      const dv = tmp.copy(rk.vel).normalize(); camP.copy(rk.pos).addScaledVector(dv, -10).y += 3.4; camL.copy(rk.pos).addScaledVector(dv, 24);
      if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
      rig._mv.lerp(camP, Math.min(1, (dt || 0.016) * 6)); rig._ml.lerp(camL, Math.min(1, (dt || 0.016) * 8)); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml); return;
    }
    if (w > 0.001) {   // decollage : on voit la fusee partir du lanceur, la camera la suit de loin et d'en haut, puis redescend vers la vue de course en la gardant au centre
      frame(T, Math.max(0, d)); const fz = tmp.set(tf.x, 0, tf.z), side = tmp2.set(nn.x, 0, nn.z);
      LPOS.copy(rk.pos).addScaledVector(fz, -(8.5 + 8 * w)).addScaledVector(side, 4 * w); LPOS.y += 2.4 + 5 * w;
      camP.lerp(LPOS, w); LLOK.copy(rk.pos).addScaledVector(fz, 3 * w); camL.lerp(LLOK, Math.sqrt(w));
    }
    if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
    rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
  };

  // ---------------------------------------------------------------- RACCOURCI : on sort par l'ouverture du mur et on vole librement jusqu'a l'anneau vert (on vise ou on entre dans la fenetre)
  const freeFly = (g, dt, T, crs, rk, run) => {
    const f = W.free, c = f.cut, sp = SP() + 4; f.t += dt;
    const dT = c.dB + c.len / 2 + 5, hwT = crs.hw(dT) - 1.6; let ax, ay;
    if (I.mode === 'keys') { const k = I.k, tx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0), ty = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0), ff = Math.min(1, dt * 10); I.ax += (tx - I.ax) * ff; I.ay += (ty - I.ay) * ff; ax = I.ax * hwT; ay = I.ay * 3; }
    else { ax = I.cx * hwT * 1.2; ay = (0.5 - I.cy) * 9; }
    const tp = T.at(dT, U.clamp(ax, -hwT, hwT), T.laneY(dT) + U.clamp(ay, -crs.fl + 1.8, crs.wh(dT) - 2.2));
    tmp.set(tp[0] - rk.pos.x, tp[1] - rk.pos.y, tp[2] - rk.pos.z); const dist = tmp.length(); tmp.normalize();
    if (!f.d0) f.d0 = Math.max(60, dist); run.dist = Math.max(run.dist, c.dA + (dT - c.dA) * U.clamp(1 - dist / f.d0, 0, 1));   // la progression suit le trajet libre (le sol et les limites du jeu suivent)
    if (rk.vel.lengthSq() < 1) rk.vel.copy(tmp).multiplyScalar(sp);
    rk.vel.normalize().lerp(tmp, 1 - Math.exp(-dt * 3.4)).normalize().multiplyScalar(sp);
    const dir = tmp2.copy(rk.vel).normalize(); g.input.setAim(Math.atan2(-dir.x, -dir.z), Math.asin(U.clamp(dir.y, -0.9, 0.9)));
    const dd = T.project(rk.pos, c.dB); relOf(T, dd, rk.pos, relP);
    f.dbg = [Math.round(dd), Math.round(dist), Math.round(rk.pos.y), Math.round(tp[1]), +tmp.y.toFixed(2), +rk.vel.y.toFixed(1), +rk.vel.length().toFixed(1)];
    const inside = Math.abs(relP.x) < crs.hw(dd) - 0.3 && relP.y > -crs.fl + 0.3 && relP.y < crs.wh(dd) - 0.3;
    if (inside && f.t > 0.5) {
      if (dd >= c.dB - 3 && dd <= c.dB + c.len + 12) { W.free = null; run.dist = Math.max(run.dist, dd); W.boostT = Math.max(W.boostT, 1.2); W.cutMsg = performance.now(); try { g.rig.boostKick(); g.audio.play('target'); } catch (e) { /* effets */ } }
      else if (rk.shieldT <= 0) { W.free = null; g.onRocketCrash('wall', rk.pos.clone(), new V(0, 1, 0)); }
    } else if (rk.shieldT <= 0 && (dd > c.dB + c.len + 30 || f.t > 7 || rk.pos.y < T.base(dd) + 3)) { W.free = null; g.onRocketCrash('wall', rk.pos.clone(), new V(0, 1, 0)); }
  };

  // ---------------------------------------------------------------- ILE : sortir du chemin = chute ; revenir dans la zone = le controle revient peu a peu
  const hv = new V();
  const isleStep = (g, dt, crs, d, F, rk) => {
    if (W && W.props && W.props.update) W.props.update(g.flightTime, rk.pos);
    const inX = Math.abs(rel.x) < crs.isle.W(d) + 1.5;
    if (!F.on && g.flightTime > 1.0 && !inX) { F.on = true; F.t = 0; F.ctrl = Math.min(F.ctrl, 0.7); F.vy = Math.min(0, rk.vel.y) - 4; W.fallMsg = performance.now(); }
    if (F.on) {
      F.t += dt; F.ctrl = Math.max(0.12, F.ctrl - 2.6 * dt); F.vy = Math.max(-75, F.vy - 36 * dt);
      if (inX) F.on = false;   // de retour dans la zone : la chute s'arrete, le controle remonte
    } else if (F.ctrl < 1) { F.ctrl = Math.min(1, F.ctrl + 0.5 * dt); F.vy *= Math.exp(-2.2 * dt); }
  };
  const isleKill = (g, crs, T, d, rk) => {   // sol (prairie), roche de l'ile, marteau
    if (g.flightTime < 1.2 || rk.shieldT > 0) return false;
    if (rk.pos.y < crs.isle.PY + 1.5 || E.isleSolid(crs, T, d, rel.x, rk.pos.y)) return true;
    if (W.props && W.props.hits) for (const f of W.props.hits) if (f(rk.pos)) return true;
    return false;
  };

  // ---------------------------------------------------------------- pilotage : la fusee suit la piste, le joueur la decale
  const drive = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk.active || g.state !== 'FLIGHT' || g.evoFinish || g.flightTime < 0.05) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const sp = SP(), d2 = d + 8, ease = U.clamp(g.flightTime / 1.0, 0, 1);
    relOf(T, d, rk.pos, rel); const isl = !!(E.course && E.course.isle && W && W.props), F = isl ? (W.fall || (W.fall = { on: false, ctrl: 1, vy: 0, t: 0 })) : null; if (isl) isleStep(g, dt, E.course, d, F, rk);
    const hdn = hdnAt(T, d), crs = E.course, open = !!cur().open && !crs, LATx = crs ? (crs.isle ? crs.isle.W(d) + 40 : Math.max(3, crs.hw(d) - 1.9)) : open ? 26 : LAT, HUPx = crs ? crs.wh(d) - 1.3 : open ? 22 : HUP;
    if (crs && W && W.free) { freeFly(g, dt, T, crs, rk, run); return; }
    const cutHere = crs && W && crs.cuts.length && g.flightTime > 1.2 ? E.cutAt(crs, d) : null, LATL = cutHere && cutHere.side < 0 ? 70 : LATx, LATR = cutHere && cutHere.side > 0 ? 70 : LATx;
    if (cutHere && rel.x * cutHere.side > crs.hw(d) + 0.4) { W.free = { cut: cutHere, t: 0 }; try { g.audio.play('target'); } catch (e) { /* son */ } freeFly(g, dt, T, crs, rk, run); return; }
    if (crs && W && W.props && g.flightTime > 1) for (const o of crs.obst) if (Math.abs(d - o.d) < o.dd / 2 + 1.7 && rk.shieldT <= 0 && E.obstHit(crs, o, rel.x, rel.y, 1.5)) { g.onRocketCrash('wall', rk.pos.clone(), new V(0, 1, 0)); return; }   // un obstacle dans le couloir
    const ffx = (T.laneX(d2) - T.laneX(d)) / 8 * sp, ffy = (laneAbs(T, d2) - laneAbs(T, d)) / 8 * sp;   // la piste du niveau monte, descend, tourne : la fusee suit toute seule
    let vlat, vy;
    if (I.mode === 'keys') {   // fleches : la fusee repond tout de suite
      const k = I.k, tx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0), ty = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0), f = Math.min(1, dt * 16);
      I.ax += (tx - I.ax) * f; I.ay += (ty - I.ay) * f;
      vlat = ffx + I.ax * 26 - rel.x * 1.6 * (1 - Math.abs(I.ax)); vy = ffy + I.ay * 24 - rel.y * 1.6 * (1 - Math.abs(I.ay));   // sans touche, la fusee revient doucement au centre de la piste
      vlat += (rel.x > LATR ? LATR - rel.x : rel.x < -LATL ? -LATL - rel.x : 0) * 5;   // la fusee reste dans la bande de la piste du niveau
      vy += (rel.y > HUPx ? HUPx - rel.y : rel.y < -hdn ? -hdn - rel.y : 0) * 5;
    } else {   // curseur : on vise un point 40 m devant, la fusee y va
      const cam = g.camera; org.copy(cam.position); ray.set(I.cx, -(I.cy * 2 - 1), 0.5).unproject(cam).sub(org).normalize();
      const den = ray.dot(tf); let tx = rel.x, ty = rel.y;
      if (Math.abs(den) > 0.05) { const t = (tmp.copy(rk.pos).sub(org).dot(tf) + 40) / den; if (t > 0) { const P = tmp.copy(org).addScaledVector(ray, t); relOf(T, d + 40, P, relP); tx = relP.x; ty = relP.y; } }
      tx = U.clamp(tx, -LATL, LATR) * ease; ty = U.clamp(ty, -hdn, HUPx) * ease;
      vlat = ffx + U.clamp((tx - rel.x) * 5, -30, 30); vy = ffy + U.clamp((ty - rel.y) * 5, -30, 30);
      I.ax = (vlat - ffx) / 26; I.ay = (vy - ffy) / 24;
    }
    let spx = sp; if (isl && (F.on || F.ctrl < 1)) { const c = F.ctrl; vlat = ffx + (vlat - ffx) * c; vy = vy * c + F.vy * (1 - c); spx = sp * (1 + 0.22 * (1 - c)); }
    const floor = crs ? T.base(d) + T.laneY(d) - hdn + (crs.isle ? crs.isle.bank(d) * rel.x : 0) : T.base(d) + 1.2; if (open && rk.shieldT <= 0 && rk.pos.y < T.base(d) + 0.7 && g.flightTime > 1.2) { g.onRocketCrash('wall', rk.pos.clone(), new V(0, 1, 0)); return; }   // en zone ouverte, le sol tue
    if (!open && rk.pos.y < floor && vy < 0 && (!crs || run.dist > 8)) { vy = 0; rk.pos.y = floor; }
    if (crs) vy = U.clamp(vy, isl ? -80 : -60, 38);
    if (isl && isleKill(g, crs, T, d, rk)) { g.onRocketCrash('wall', rk.pos.clone(), new V(0, 1, 0)); return; }
    rk.vel.set(tf.x * spx + nn.x * vlat, vy, tf.z * spx + nn.z * vlat);
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
    sSeed = ((Date.now() & 0xffffff) + 17 * (++R.session)) >>> 0; R.surv = null; const isl = COURSES.filter((c) => c.isle), pool = isl.length ? isl : COURSES.filter((c) => c.shape);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    R.courses = [pool[0], pool[1 % pool.length], pool[2 % pool.length]]; R.round = 1; R.last = null; R.kills = 0; R.coins = 0; R.deaths = 0; R.roundKills = 0;
    { const f = /[?&]racec=(\w+)/.exec(location.search); const one = f && COURSES.find((c) => c.name.replace(/\W/g, '') === f[1]); if (one) R.courses = [one, one, one]; }   // essai d'une course a la main
  };
  if (RACE) newSession();
  const botD = (b, t, FN) => { let p; const tc = b.pc * b.tRun; if (!b.crash || t < tc) p = t / b.tRun; else if (t < tc + 2.5) p = b.pc; else p = (t - 2.5) / b.tRun; return FN * U.clamp(p, 0, 1); };
  const lanePos = (T, d, dx, dy, out) => { const p = T.at(d, T.laneX(d) + dx, T.laneY(d) + dy); return out.set(p[0], p[1], p[2]); };
  const SKIN_IDS = ['stock', 'gamin', 'bedon', 'fuseev', 'minutemec', 'hachette', 'croquette', 'baguette', 'tridentin', 'poisson', 'gardien', 'titanite', 'satanette', 'berthe', 'croissant', 'chaton', 'tsarini', 'maman', 'bombeh', 'colis', 'caillou', 'royale', 'neon', 'phenix', 'glace', 'toxique', 'samourai', 'galaxie', 'furtive'];
  const TRN = 16;   // points d'une traînée
  const mkRibbon = (col) => {
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(TRN * 2 * 3), 3));
    const idx = []; for (let k = 0; k < TRN - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
    const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, side: T3.DoubleSide, depthWrite: false })); m.frustumCulled = false; m.visible = false; return m;
  };
  const updRibbon = (b, camPos) => {   // la traînée : les dernières positions, de plus en plus fines
    const h = b.hist, pos = b.tr.geometry.attributes.position, arr = pos.array; if (h.length < 2) return;
    for (let k = 0; k < TRN; k++) {
      const p = h[Math.min(h.length - 1, k)], q = h[Math.min(h.length - 1, k + 1)], w = 1.1 * (1 - k / TRN);
      tmp2.copy(q).sub(p); if (tmp2.lengthSq() < 1e-6) tmp2.set(0, 0, 1); tmp2.normalize(); const rx = -tmp2.z, rz = tmp2.x;
      arr[k * 6] = p.x + rx * w; arr[k * 6 + 1] = p.y; arr[k * 6 + 2] = p.z + rz * w; arr[k * 6 + 3] = p.x - rx * w; arr[k * 6 + 4] = p.y; arr[k * 6 + 5] = p.z - rz * w;
    }
    pos.needsUpdate = true;
  };
  const buildRace = (g, run) => {   // le monde de la manche : fleches de vitesse sur la piste, pilotes IA
    if (W) { try { g.scene.remove(W.grp); } catch (e) { /* ignore */ } }
    const T = run.T, grp = new T3.Group(), FN = E.shortFin || 470, sp = cur().speed || 44, rd = R.round - 1;
    W = { run, grp, boosts: [], bots: [], boostT: 0, kills: 0, fin: FN, coins: 0, roundKills: 0 }; R.deaths = 0; R.roundKills = 0;
    g.scene.add(grp); if (E.course && E.course.isle) { W.props = E.buildIsle(T, E.course, grp); W.free = null; W.wheel = null; W.fall = null; }
    else if (E.course) { E.buildCorridor(T, E.course, -4, FN + 150, grp); W.props = E.buildCourseProps(T, E.course, grp); W.free = null; W.wheel = null; }
    const offs = [-5, 4, -3, 5, -4, 3], dys = [0, 2, -1, 2, 0, 1];   // des fleches de vitesse : il faut un peu bouger pour les prendre
    for (let k = 0, d = 110; d < FN - 70; k++, d += 115) {
      const off = offs[k % offs.length] * (E.course ? U.clamp((E.course.hw(d) - 3) / 6, 0.2, 1) : 1), dy = dys[k % dys.length], o = new T3.Group(), tmpA = new V(), tmpB = new V();
      for (let j = 0; j < 3; j++) { const ar = CC.Models.guideArrow(); lanePos(T, d + j * 5 - 5, off, dy, tmpA); ar.position.copy(tmpA); lanePos(T, d + j * 5 - 2, off, dy, tmpB); ar.lookAt(tmpB); ar.scale.setScalar(2.4); o.add(ar); }
      grp.add(o); W.boosts.push({ d, off, dy, grp: o, taken: false });
    }
    // les pilotes IA : une Coupe = 32 pilotes, puis seuls les qualifies reviennent (16, puis 8). Chacun a son niveau : quelques-uns te battent, d'autres sont loin derriere
    const T0 = FN / sp - 0.5, ids = SKIN_IDS.filter((id) => CC.Skins.byId[id]);
    if (rd === 0 || !R.surv) {
      for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
      R.cast = []; for (let i = 0; i < R.field[0] - 1; i++) R.cast.push({ name: BOT_NAMES[(i * 7) % BOT_NAMES.length], skin: ids[i % ids.length], L: -0.02 + 0.2 * Math.pow(sr(), 1.25), off: (sr() - 0.5) * 13, dy: (sr() - 0.5) * 4, ph: sr() * 6.28 });
    }
    const cast = rd === 0 || !R.surv ? R.cast : R.surv;
    cast.forEach((c, i) => {
      const cut = sr() < 0.18, pow = sr() < 0.25, slow = sr() < 0.2, crash = sr() < 0.18;
      const tRun = Math.max(T0 * 0.8, T0 * (1 + c.L) + R.ease + gz() * 0.8 - (cut ? 1.0 : 0) - (pow ? 0.7 : 0) + (slow ? 0.8 : 0));
      W.bots.push({ i, c, name: c.name, skin: c.skin, tRun, crash, pc: 0.2 + 0.6 * sr(), T: tRun + (crash ? 2.5 : 0), off: c.off, dy: c.dy, ph: c.ph, boom: false, d: 0, m: null, tr: null, hist: [], dead: false });
    });
    buildFinish(g, T, FN, grp);
  };
  const bOff = (b, d) => (E.course && E.course.isle ? b.off * U.clamp(E.course.isle.W(d) * 0.8 / 6.5, 0.3, 9) : b.off * (E.course ? U.clamp((E.course.hw(d) - 2.4) / 6.5, 0.15, 1.1) : 1));
  const rivalMesh = (g, b) => {   // le skin et la traînée d'un pilote (crees au premier passage a l'ecran)
    const sk = CC.Skins.byId[b.skin] || CC.Skins.byId.stock;
    b.m = CC.Models.rocket(sk); b.m.scale.setScalar(3.8); b.m.visible = false; W.grp.add(b.m);
    b.mats = []; b.m.traverse((o) => { if (o.isMesh && o.material) { const arr = Array.isArray(o.material) ? o.material : [o.material], cl = arr.map((q) => { const c2 = q.clone(); c2.transparent = true; b.mats.push(c2); return c2; }); o.material = Array.isArray(o.material) ? cl : cl[0]; } });
    b.tr = mkRibbon(sk.flame || (sk.c && (sk.c.band || sk.c.body)) || '#ffffff'); W.grp.add(b.tr);
  };
  // ---------------------------------------------------------------- blocs chance : une roue de pouvoirs (turbo, bouclier, missile)
  const POWERS = ['TURBO', 'BOUCLIER', 'MISSILE'];
  const givePower = (g, kind) => {
    const rk = g.rocket, run = g.endlessRun, t = Math.max(0, g.flightTime), lv = E.race.pw()[kind] - 1;
    if (kind === 'TURBO') { W.boostT = Math.max(W.boostT, 2.8 + 0.5 * lv); try { g.rig.boostKick(); } catch (e) { /* effets */ } }
    else if (kind === 'BOUCLIER') { rk.shieldT = Math.max(rk.shieldT || 0, 5 + lv); try { g.audio.play('shield'); } catch (e) { /* son */ } }
    else {   // missile : le pilote devant le plus proche explose
      let best = null; for (const b of W.bots) if (!b.hit && !b.crash && b.d > run.dist + 4 && b.d < run.dist + 260 + 60 * lv && (!best || b.d < best.d)) best = b;
      if (best) { best.hit = true; best.crash = true; best.pc = t / best.tRun; best.boom = true; best.T += 4; R.roundKills++; R.kills++; const P = best.m ? best.m.position.clone() : rk.pos.clone().addScaledVector(tf, 40); try { g.effects.explosion(P, new V(0, 1, 0), false, 'orange'); g.audio.play('boomSmall', P); } catch (e) { /* effets */ } if (best.m) { best.m.visible = false; best.tr.visible = false; } W.missile = { name: best.name, t0: performance.now() }; }
    }
  };
  const raceStep = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket, T = run.T, FN = E.shortFin || 470, t = Math.max(0, g.flightTime), flying = g.state === 'FLIGHT' && rk.active, fin = !!g.evoFinish;
    if (W.boostT > 0) W.boostT -= dt;
    if (flying && !fin) {
      relOf(T, run.dist, rk.pos, rel);
      for (const b of W.boosts) if (!b.taken && Math.abs(run.dist - b.d) < 5 && Math.abs(rel.x - b.off) < 4.5 && Math.abs(rel.y - b.dy) < 4.5) { b.taken = true; b.grp.visible = false; W.boostT = 1.3; try { g.rig.boostKick(); g.audio.play('target'); } catch (e) { /* effets */ } }
      const kl = (g.evo && g.evo.kills) || 0; if (kl > W.kills) { W.kills = kl; W.boostT = Math.max(W.boostT, 0.8); }
      if (W.props) for (const bl of W.props.blocks) if (!bl.taken && Math.abs(run.dist - bl.d) < 3.4 && Math.abs(rel.x - bl.x) < 3.2 && Math.abs(rel.y - bl.y) < 3.2) {
        bl.taken = true; bl.g.visible = false; const kind = POWERS[Math.floor(Math.random() * POWERS.length)]; W.wheel = { t0: performance.now(), kind, done: false };
        try { g.audio.play('target'); } catch (e) { /* son */ } }
      if (W.wheel && !W.wheel.done && performance.now() - W.wheel.t0 > 900) { W.wheel.done = true; givePower(g, W.wheel.kind); }
    }
    if (W.props) for (const bl of W.props.blocks) if (!bl.taken) { bl.g.rotation.y += dt * 2.2; bl.m.rotation.x += dt * 1.5; bl.m.position.y = Math.sin(t * 3 + bl.d) * 0.35; }
    if (fin) { for (const b of W.bots) { if (b.m) b.m.visible = false; if (b.tr) b.tr.visible = false; } return; }   // apres l'arrivee, plus de pilotes a l'ecran
    let ahead = 0, lead = null; const vis = [];
    for (const b of W.bots) {
      b.d = botD(b, t, FN); if (b.d > Math.max(0, run.dist)) { ahead++; if (!lead || b.d > lead.d) lead = b; }
      const tc = b.pc * b.tRun, hidden = b.crash && t >= tc + 0.3 && t < tc + 2.5;
      if (b.crash && !b.boom && t >= tc && Math.abs(b.d - run.dist) < 220) { b.boom = true; lanePos(T, b.d, bOff(b, b.d), b.dy, tmp2); try { g.effects.explosion(tmp2.clone(), new V(0, 1, 0), false, 'orange'); } catch (e) { /* effets */ } }
      if (t > 0.2 && Math.abs(b.d - run.dist) < 260 && !hidden) vis.push(b); else if (b.m) { b.m.visible = false; b.tr.visible = false; }
    }
    vis.sort((a, c) => Math.abs(a.d - run.dist) - Math.abs(c.d - run.dist));
    for (let k = 0; k < vis.length; k++) {
      const b = vis[k]; if (k >= 12) { if (b.m) { b.m.visible = false; b.tr.visible = false; } continue; }
      if (!b.m) rivalMesh(g, b);
      const wf = bOff(b, b.d) !== b.off ? bOff(b, b.d) / (b.off || 1) : 1, wob = 1.5 * Math.sin(t * 1.3 + b.ph) * (E.course ? 0.55 : 1), wob2 = 1.5 * Math.sin((t + 0.12) * 1.3 + b.ph) * (E.course ? 0.55 : 1);
      lanePos(T, b.d, bOff(b, b.d) + wob, b.dy, b.m.position); lanePos(T, b.d + 6, bOff(b, b.d + 6) + wob2, b.dy, tmp2); b.m.lookAt(tmp2); b.m.visible = true;
      if (E.course) b.m.rotateZ(U.clamp(-E.course.rate(b.d) * (cur().speed || 46) * 0.2, -0.75, 0.75) + 0.12 * Math.cos(t * 1.3 + b.ph));   // la fusee se penche dans les virages (et un peu quand elle bouge sur le cote)
      { const dn = rk.active ? rk.pos.distanceTo(b.m.position) : 99, op = U.clamp((dn - 4) / 11, 0.22, 1); for (const q of b.mats) q.opacity = op; b.tr.material.opacity = 0.55 * op; }   // une fusee rivale trop proche devient transparente
      b.hist.unshift(b.m.position.clone()); if (b.hist.length > TRN) b.hist.pop(); b.tr.visible = true; updRibbon(b);
      if (flying && !fin && !b.hit && rk.shieldT <= 0 && rk.pos.distanceTo(b.m.position) < 3.8) {
        b.hit = true;   // on fonce dans un pilote : il explose (un mort pour toi), il perd du temps
        b.crash = true; b.pc = t / b.tRun; b.boom = true; b.T += 2.5; R.roundKills++; R.kills++;
        try { g.effects.explosion(b.m.position.clone(), new V(0, 1, 0), false, 'orange'); g.audio.play('boomSmall', b.m.position); } catch (e) { /* effets */ }
        b.m.visible = false; b.tr.visible = false; W.boostT = Math.max(W.boostT, 0.6);
      }
    }
    W.lead = lead; R.live = 1 + ahead;
  };
  // la ligne d'arrivee : deux pylones, une banderole a damier, un anneau lumineux et des faisceaux
  const buildFinish = (g, T, FN, grp) => {
    const fg = new T3.Group(); frame(T, FN); const lp = T.at(FN, T.laneX(FN), 0), yaw = Math.atan2(tf.x, tf.z), cy = T.laneY(FN), hw = E.course ? E.course.hw(FN) + 4 : 22;
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const c2 = cv.getContext('2d'); for (let a = 0; a < 16; a++) for (let b = 0; b < 4; b++) { c2.fillStyle = (a + b) % 2 ? '#111111' : '#ffffff'; c2.fillRect(a * 8, b * 8, 8, 8); }
    const tx = new T3.CanvasTexture(cv); tx.magFilter = T3.NearestFilter; tx.wrapS = T3.RepeatWrapping; tx.repeat.set(3, 1);
    const banner = new T3.Mesh(new T3.PlaneGeometry(hw * 2, 7), new T3.MeshBasicMaterial({ map: tx, side: T3.DoubleSide, fog: false })); banner.position.set(0, cy + 15, 0); fg.add(banner);
    for (const sgn of [-1, 1]) {
      const pylon = new T3.Mesh(new T3.CylinderGeometry(1.3, 1.6, cy + 20, 10), new T3.MeshBasicMaterial({ color: sgn < 0 ? '#ff3b30' : '#2f8cff', fog: false })); pylon.position.set(sgn * hw, (cy + 20) / 2 - 2, 0); fg.add(pylon);
      const beam = new T3.Mesh(new T3.CylinderGeometry(2.2, 2.2, 120, 12, 1, true), new T3.MeshBasicMaterial({ color: sgn < 0 ? '#ff7a6a' : '#7ab8ff', transparent: true, opacity: 0.28, side: T3.DoubleSide, depthWrite: false, fog: false })); beam.position.set(sgn * hw, cy + 55, 0); fg.add(beam);
    }
    const ring = new T3.Mesh(new T3.TorusGeometry(hw * 0.62, 1.1, 10, 44), new T3.MeshBasicMaterial({ color: '#ffd23a', fog: false })); ring.position.set(0, cy, 0); fg.add(ring);
    const ring2 = new T3.Mesh(new T3.TorusGeometry(hw * 0.62 + 2.6, 0.6, 8, 44), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, fog: false })); ring2.position.set(0, cy, 0); fg.add(ring2);
    fg.position.set(lp[0], lp[1], lp[2]); fg.rotation.y = yaw; fg.userData.ring = ring; grp.add(fg); if (W) W.finish = fg;
  };
  const respawn = (g) => {   // un echec = on repart juste avant l'obstacle, avec du temps perdu (pas de menu)
    const run = g.endlessRun, rk = g.rocket, T = run.T, d = Math.max(20, run.dist - 40), p = T.at(d, T.laneX(d), T.laneY(d)), q = T.at(d + 3, T.laneX(d + 3), T.laneY(d + 3));
    const pos = new V(p[0], p[1], p[2]), dir = new V(q[0] - p[0], q[1] - p[1], q[2] - p[2]).normalize(), yaw = Math.atan2(-dir.x, -dir.z), pit = Math.asin(dir.y);
    g.input.setAim(yaw, pit); g.rig.setAim(yaw, pit); g.acc = 0;
    rk.launch(pos, dir, { speed: cur().speed || 44, ignited: true, freeBoost: 0.5 }); rk.shieldT = 1.4;
    run.dist = d; if (W) W.fall = null; if (g.rig) g.rig._mv = null; g.rig.startFlight(); g.state = 'FLIGHT'; g.stallT = 0; g.impactT = 0; g.flightTime += 2.5; R.penT = performance.now();
    try { g.audio.play('shield'); } catch (e) { /* son */ }
  };
  const tmpHud = new V();
  const buildSolo = (g, run) => { if (W) { try { g.scene.remove(W.grp); } catch (e) { /* ignore */ } } const grp = new T3.Group(); W = { run, grp, boosts: [], bots: [], boostT: 0, kills: 0 }; g.scene.add(grp); buildFinish(g, run.T, E.shortFin || 470, grp); };
  const coinsFor = (rank, kills, died) => (died ? 10 : Math.max(20, 130 - 3 * rank)) + kills * 15;
  const mkResult = (g, time, rank, died) => {   // le classement de la manche, les pieces gagnees, les eliminés
    const rd = R.round - 1, keep = R.keep[rd], qual = !died && rank <= keep;
    const all = W.bots.map((b) => ({ name: b.name, time: b.T })); all.push({ name: 'TOI', time: died ? 999 : time, you: true }); all.sort((x, y) => x.time - y.time);
    const you = all.findIndex((x) => x.you); if (died) { all.splice(you, 1); all.splice(Math.max(0, rank - 1), 0, { name: 'TOI', time: time, you: true, dnf: true }); }
    if (qual && !(rd === 2)) R.surv = all.slice(0, keep).filter((x) => !x.you).map((x) => (W.bots.find((b) => b.name === x.name) || {}).c).filter(Boolean).slice(0, keep - 1);
    const coins = coinsFor(rank, R.roundKills, died), S0 = E.save(g); S0.coins = (S0.coins || 0) + coins; R.coins += coins;
    let gems = 0, pack = null; if (rd === 2 && rank === 1 && !died) { gems = 3; S0.gems = (S0.gems || 0) + 3; PRO.setTickets(PRO.tickets() + 1); const free = PRO.SKIN_IDS.filter((id) => !PRO.isOwned(id)); if (free.length) { const id = free[Math.floor(Math.random() * free.length)]; PRO.own(id); pack = { skin: id, fresh: true, rar: PRO.rarity(id) }; } else { S0.coins = (S0.coins || 0) + 300; pack = { skin: PRO.SKIN_IDS[0], fresh: false, rar: 0 }; } } try { g.writeSave(); } catch (e) { /* ignore */ }
    if (rd === 0) { R.ease = U.clamp(R.ease + (qual ? -0.1 : 0.3), -0.3, 1.2); lsSet('cc.race.ease', R.ease.toFixed(2)); }
    return (R.last = { time, rank, field: R.field[rd], keep, qual, final: rd === 2, round: R.round, rows: all.slice(0, 5), all, you: all.findIndex((x) => x.you), elim: all.slice(keep).map((x) => x.name), kills: R.roundKills, coins, gems, pack, died, t0: performance.now() });
  };
  let ended = null, wantEnd = 0, curRun = null;
  const bestD = () => parseFloat(lsGet('cc.mvp.bd.' + M + '.' + LV, '0')) || 0;
  const step = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !run.T) return;
    if (curRun !== run) { curRun = run; ended = null; g._mvEnd = 0; if (g.ui.overlay === 'evoWin') g.ui.overlay = null; if (RACE) buildRace(g, run); else buildSolo(g, run); }
    try { document.body.style.cursor = (I.mode === 'keys' && g.state === 'FLIGHT') ? 'none' : ''; } catch (e) { /* ignore */ }
    const FN = E.shortFin || 470;
    if (g.world && !g.world._crsSw) { const sw = g.world.sweep; g.world._crsSw = 1; g.world.sweep = function () { return E.course ? null : sw.apply(this, arguments); }; }   // parcours en couloir : les decors du sol ne bloquent pas la fusee (le couloir a ses murs)
    { const gt = g._shortGate; if (gt && gt.grp) gt.grp.visible = false; }   // l'ancien mur a damier est remplace par la nouvelle arrivee
    if (rk.mesh && rk.active) rk.mesh.scale.setScalar(3.6);   // la fusee est plus grosse a l'ecran
    if (RACE && W && W.run === run) raceStep(g, dt);
    if (RACE && W && W.run === run && rk.active && g.state === 'FLIGHT' && !g.evoFinish) {   // le costume choisi dans le menu et la traînee de la fusee du joueur
      if (!W._sk && g.flightTime > 0.15) { W._sk = 1; const ps = playerSkin(); if (ps) { try { rk.setSkin(ps); } catch (e) { /* skin */ } } const col = PRO.trail() || (ps && ps.flame) || '#cfe8ff'; W.pb = { hist: [], tr: mkRibbon(col) }; W.pb.tr.visible = true; W.grp.add(W.pb.tr); }
      if (W.pb) { W.pb.hist.unshift(rk.pos.clone()); if (W.pb.hist.length > TRN) W.pb.hist.pop(); updRibbon(W.pb); }
    }
    if (W && W.pb && (g.evoFinish || !rk.active)) W.pb.tr.visible = false;
    if (ended && wantEnd && performance.now() >= wantEnd) { wantEnd = 0; g.evoWin = { mv: true, race: RACE, t0: performance.now(), lv: LV, info: ended }; g.ui.overlay = 'evoWin'; try { g.audio.play('victory'); } catch (e) { /* son */ } }
    if (RACE && g.evoFinish && !g._mvEnd && W) {   // fin de manche : le rang parmi les pilotes
      g._mvEnd = 1; const time = Math.max(0, g.flightTime), rank = 1 + W.bots.filter((b) => b.T < time).length;
      ended = mkResult(g, time, rank, false); wantEnd = performance.now() + 750; return;
    }
    if (g.evoFinish && !g._mvEnd) {
      g._mvEnd = 1; const time = Math.max(0, g.flightTime);
      ended = { time, fails: fails[LV] || 0, kills: (g.evo && g.evo.kills) || 0, t0: performance.now() }; ended.stars = ended.fails === 0 ? 3 : ended.fails === 1 ? 2 : 1;
      const best = parseFloat(lsGet('cc.mvp.best.' + M + '.' + LV, '0')) || 0; ended.rec = !best || time < best; ended.best = best;
      if (ended.rec) lsSet('cc.mvp.best.' + M + '.' + LV, time.toFixed(2));
      lsSet('cc.mvp.bd.' + M + '.' + LV, 1); fails[LV] = 0; wantEnd = performance.now() + 750;
    }
  };
  const showRevive = (g) => {   // un echec : on propose de relancer (pub la 1re fois, 3 gemmes ensuite) avant de perdre la manche
    R.deaths = (R.deaths || 0) + 1; g.evoWin = { mv: true, race: true, revive: true, t0: performance.now(), n: R.deaths }; g.ui.overlay = 'evoWin';
  };
  const giveUp = (g) => {
    const run = g.endlessRun, rd = R.round - 1, ahead = W ? W.bots.filter((b) => b.d > run.dist).length : 0, rank = Math.max(R.keep[rd] + 1, 1 + ahead);
    ended = mkResult(g, Math.max(0, g.flightTime), rank, true); g.evoWin = { mv: true, race: true, t0: performance.now(), lv: LV, info: ended }; g.ui.overlay = 'evoWin'; g._mvEnd = 1;
  };
  const doRevive = (g) => {
    const S0 = E.save(g), gems = S0.gems || 0, useGems = R.deaths >= 2 && gems >= 3;
    const ok = () => { if (useGems) { S0.gems = gems - 3; try { g.writeSave(); } catch (e) { /* ignore */ } } g.evoWin = null; g.ui.overlay = null; respawn(g); };
    if (useGems) ok(); else if (g.ads && g.ads.rewarded) g.ads.rewarded(ok, null, 'revive', 'RELANCER'); else ok();
  };

  // ---------------------------------------------------------------- profil de la course : costumes, traînée, pouvoirs (sauvegarde locale)
  const jget = (k, d) => { try { return JSON.parse(lsGet(k, '')) || d; } catch (e) { return d; } };
  const PRO = E.race = {
    SKIN_IDS: SKIN_IDS.filter((id) => CC.Skins.byId[id]), TRAILS: ['', '#ff3b30', '#ff9a1f', '#ffd23a', '#43e05a', '#2fd2ff', '#2f6fd8', '#a64cf0', '#ff4fd8', '#ffffff'],
    rarity(id) { const i = this.SKIN_IDS.indexOf(id); return i < 12 ? 0 : i < 21 ? 1 : 2; }, rarName: ['COMMUN', 'RARE', 'EPIQUE'], price(id) { return [0, 600, 1800][this.rarity(id)]; },
    owned() { const o = jget('cc.race.owned', null); return o || this.SKIN_IDS.slice(0, 6); }, isOwned(id) { return this.owned().indexOf(id) >= 0; },
    own(id) { const o = this.owned(); if (o.indexOf(id) < 0) { o.push(id); lsSet('cc.race.owned', JSON.stringify(o)); } },
    skin() { return lsGet('cc.race.skin', ''); }, setSkin(id) { lsSet('cc.race.skin', id); }, trail() { return lsGet('cc.race.trail', ''); }, setTrail(c) { lsSet('cc.race.trail', c); },
    pw() { const o = jget('cc.race.pw', {}); return { TURBO: o.TURBO || 1, BOUCLIER: o.BOUCLIER || 1, MISSILE: o.MISSILE || 1 }; }, setPw(o) { lsSet('cc.race.pw', JSON.stringify(o)); },
    tickets() { return parseInt(lsGet('cc.race.tickets', '0'), 10) || 0; }, setTickets(n) { lsSet('cc.race.tickets', n); },
  };
  const playerSkin = () => { const id = PRO.skin(), b = CC.Skins.byId[id]; if (b) { const t = PRO.trail(); return t ? Object.assign({}, b, { flame: t }) : b; } return null; };
  // petite fusee dessinee (costumes, paquet) : corps, nez, bande, ailerons aux couleurs du costume
  const drawRocketIcon = (ctx, x, y, size, sk, rot) => {
    const c = (sk && sk.c) || {}, L = size, r = size * 0.17; ctx.save(); ctx.translate(x, y); ctx.rotate(rot === undefined ? -Math.PI / 4 : rot);
    ctx.fillStyle = c.fin || '#555'; ctx.beginPath(); ctx.moveTo(-L * 0.28, 0); ctx.lineTo(-L * 0.5, -r * 2.1); ctx.lineTo(-L * 0.12, -r * 0.6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-L * 0.28, 0); ctx.lineTo(-L * 0.5, r * 2.1); ctx.lineTo(-L * 0.12, r * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.body || '#ccc'; UI.rrect(ctx, -L * 0.42, -r, L * 0.62, r * 2, r * 0.7); ctx.fill();
    ctx.fillStyle = c.band || '#f3cf00'; ctx.fillRect(-L * 0.05, -r, L * 0.09, r * 2);
    ctx.fillStyle = c.nose || '#ccc'; ctx.beginPath(); ctx.moveTo(L * 0.2, -r); ctx.quadraticCurveTo(L * 0.42, 0, L * 0.2, r); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.tip || '#e02a1c'; ctx.beginPath(); ctx.moveTo(L * 0.33, -r * 0.38); ctx.quadraticCurveTo(L * 0.44, 0, L * 0.33, r * 0.38); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  PRO.icon = drawRocketIcon;
  // ---------------------------------------------------------------- l'ecran des qualifies : toutes les fusees de la manche alignees (premier devant), les non-qualifiees explosent
  let LU = null;
  const lineupSkin = (g, x) => { if (x.you) return playerSkin() || CC.Skins.byId['evoT2' + ((E.livery && E.livery(g) || {}).id || '')] || CC.Skins.byId.evoT2 || CC.Skins.byId.stock; const b = W && W.bots.find((q) => q.name === x.name); return CC.Skins.byId[b ? b.skin : ''] || CC.Skins.byId.stock; };
  const startLineup = (g, info) => {
    stopLineup(g); const rk = g.rocket, base = new V(rk.pos.x, rk.pos.y + 900, rk.pos.z), grp = new T3.Group(), N = info.all.length, items = [];
    grp.position.copy(base); g.scene.add(grp);
    info.all.forEach((x, i) => {
      const row = Math.floor(i / 4), lane = i % 4, sk = lineupSkin(g, x), m = CC.Models.rocket(sk); m.scale.setScalar(5.6); m.rotation.y = Math.PI / 2; grp.add(m);
      const bx = -row * 17 + (lane % 2) * 8, bz = (lane - 1.5) * 14; items.push({ x, rank: i + 1, m, bx, bz, row, dead: false, you: !!x.you });
      if (x.you) { const ring = new T3.Mesh(new T3.TorusGeometry(6.2, 0.35, 8, 36), new T3.MeshBasicMaterial({ color: '#ffd23a' })); ring.rotation.x = Math.PI / 2; m.add(ring); ring.scale.setScalar(1 / 5.6); m.userData.ring = ring; }
    });
    const rows = Math.ceil(N / 4);
    LU = { grp, base, items, t0: performance.now(), keep: info.keep, final: info.final, rows, boomed: 0, info };
    if (g.rig) g.rig.mode = 'chase';
  };
  const stopLineup = (g) => { if (LU) { try { g.scene.remove(LU.grp); } catch (e) { /* ignore */ } LU = null; } };
  const lineupFrame = (g) => {   // chaque image : placement, entree des fusees, explosions, camera
    if (!LU) return; const t = (performance.now() - LU.t0) / 1000, rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; }
    for (const it of LU.items) {
      const k = U.clamp((t - it.row * 0.16) / 0.7, 0, 1), e = 1 - Math.pow(1 - k, 3);
      it.m.position.set(it.bx - 220 * (1 - e), Math.sin(t * 2.2 + it.rank) * 0.5, it.bz); it.m.visible = !it.dead && k > 0;
      if (it.m.userData.ring) it.m.userData.ring.rotation.z += 0.04;
    }
    const tE = LU.rows * 0.16 + 1.5;   // puis les non-qualifies explosent un par un (du dernier au premier)
    const elim = LU.final ? [] : LU.items.filter((q) => q.rank > LU.keep).reverse();
    if (t > tE) {
      const n = Math.floor((t - tE) / 0.13);
      while (LU.boomed < Math.min(n + 1, elim.length)) { const it = elim[LU.boomed++]; it.dead = true; it.m.visible = false; const P = it.m.getWorldPosition(new V()); try { g.effects.explosion(P, new V(0, 1, 0), false, 'orange'); g.audio.play('boomSmall', P); } catch (e) { /* effets */ } }
    }
    LU.done = t > tE && LU.boomed >= elim.length;
    const ph = Math.min(1, t / 3) * 0.35;   // la camera tourne un peu autour du groupe
    const FH = g.evoFinish || (g.evoFinish = { t0: performance.now(), hold: true });
    FH.hold = true; FH.camPos = FH.camPos || new V(); FH.look = FH.look || new V();
    FH.camPos.set(LU.base.x - 20 + Math.sin(ph) * 40, LU.base.y + 30 - ph * 8, LU.base.z + 92 * Math.cos(ph)); FH.look.set(LU.base.x - 52, LU.base.y - 2, LU.base.z);
    if (g.rig) g.rig.mode = 'chase';
  };
  const drawLineup = (ui, ctx, g, W0, H, w) => {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, cw, cx } = F, S = UI.S, L = w.info; if (!LU) startLineup(g, L);
    lineupFrame(g); const cam = g.camera, v = new V();
    for (const it of LU.items) {   // les pseudos au-dessus des fusees
      if (!it.m.visible) continue; it.m.getWorldPosition(v); v.y += 3.6; v.project(cam); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) continue;
      const sx = (v.x * 0.5 + 0.5) * W0, sy = (-v.y * 0.5 + 0.5) * H, top = it.rank <= LU.keep;
      UI.text(ctx, it.you ? 'TOI' : it.x.name, sx, sy, S(it.you ? 40 : 26), it.you ? '#FFD23A' : top ? '#ffffff' : '#ffb0a0', { stroke: true });
    }
    UI.text(ctx, LU.final ? 'FINALE' : 'MANCHE ' + L.round + ' : TOP ' + LU.keep, cx, Y(0.07), S(76), '#ffffff', { outline: true });
    UI.text(ctx, (LU.items.length - LU.boomed) + ' / ' + LU.items.length + ' PILOTES', cx, Y(0.14), S(40), '#FFD23A', { outline: true });
    if (LU.done) {
      UI.text(ctx, L.qual ? (LU.final ? 'VICTOIRE !' : 'TU ES QUALIFIE !') : 'TU ES ELIMINE', cx, Y(0.76), S(72), L.qual ? '#7CFF6A' : '#FF5A4A', { outline: true });
      const bw = cw * 0.62, bh = S(130), bx = cx - bw / 2, by = Y(0.89) - bh / 2, label = (L.qual && !L.final) ? 'MANCHE SUIVANTE' : 'NOUVELLE COUPE';
      UI.btnPrimary(ctx, bx, by, bw, bh, label); UI.tap(ui, bx, by, bw, bh, () => { stopLineup(g); goNext(g); });
    }
  };
  // ---------------------------------------------------------------- le paquet de la Coupe gagnee : un costume
  const drawPack = (ui, ctx, g, W0, H, w) => {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, T0, cw, cx, HH } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, pk = w.info.pack;
    ctx.fillStyle = 'rgba(10,14,40,0.9)'; ctx.fillRect(0, T0, W0, HH); const cy = Y(0.42);
    UI.text(ctx, 'PAQUET DE COUPE', cx, Y(0.1), S(80), '#FFD23A', { outline: true });
    if (!w.opened) {
      const sh = Math.sin(t * 22) * S(6) * Math.min(1, t / 1.2), sc = 1 + 0.04 * Math.sin(t * 5);
      ctx.save(); ctx.translate(cx + sh, cy); ctx.scale(sc, sc); ctx.fillStyle = '#7a3cf0'; UI.rrect(ctx, -S(150), -S(200), S(300), S(400), S(40)); ctx.fill(); ctx.lineWidth = S(10); ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(-S(150), -S(30), S(300), S(60)); UI.text(ctx, '?', 0, -S(100), S(150), '#ffffff', { outline: true }); ctx.restore();
      UI.text(ctx, 'TOUCHE POUR OUVRIR', cx, Y(0.8), S(46), '#ffffff', { outline: true });
      UI.tap(ui, cx - S(160), cy - S(210), S(320), S(420), () => { w.opened = true; w.t1 = performance.now(); try { g.audio.play('victory'); g.flash = 0.8; g.flashColor = '#ffffff'; } catch (e) { /* effets */ } });
    } else {
      const k = U.clamp((performance.now() - w.t1) / 500, 0, 1), sk = pk.skin ? CC.Skins.byId[pk.skin] : null, col = ['#8a96a6', '#3a8cff', '#c04cf0'][pk.rar || 0];
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.arc(0, 0, S(330) * (0.8 + 0.2 * Math.sin(t * 3)), 0, 6.283); ctx.fill();
      ctx.fillStyle = '#1b2236'; UI.rrect(ctx, -S(190), -S(240), S(380), S(480), S(36)); ctx.fill(); ctx.lineWidth = S(10); ctx.strokeStyle = col; ctx.stroke();
      if (sk) drawRocketIcon(ctx, 0, -S(30), S(260), sk); ctx.restore();
      if (sk) { UI.text(ctx, pk.fresh ? 'NOUVEAU COSTUME !' : 'DEJA POSSEDE : +300 PIECES', cx, Y(0.69), S(52), '#FFD23A', { outline: true }); UI.text(ctx, (sk.short || sk.name || pk.skin).toUpperCase() + '  -  ' + PRO.rarName[pk.rar || 0], cx, Y(0.75), S(38), '#ffffff', { outline: true }); }
      const bw = cw * 0.6, bh = S(130), bx = cx - bw / 2, by = Y(0.89) - bh / 2; UI.btnPrimary(ctx, bx, by, bw, bh, 'SUPER !'); UI.tap(ui, bx, by, bw, bh, () => { w.stage = 'lineup'; w.t0 = performance.now(); });
    }
  };
  const restart = (g) => {
    stopLineup(g);
    ended = null; wantEnd = 0; g._mvEnd = 0; g.evoWin = null;
    const rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; }
    E.endTumble(g); g.evoReport = false; g.evoLast = null; if (g.rig) g.rig._mv = null; g.goHome({});
  };
  const goNext = (g) => { if (RACE) { const L = R.last; if (L && L.qual && !L.final) R.round++; else newSession(); restart(g); return; } LV = LV >= NLV ? 1 : LV + 1; lsSet('cc.mvp.lv.' + M, LV); restart(g); };
  E.finishRun = (g) => { g.evoFinish = { t0: performance.now(), hold: true }; try { const P = g.rocket.pos.clone(); g.effects.ring(P, tf.clone(), 1, 26, 0.9, '#ffd23a', 0.9); g.effects.ring(P, tf.clone(), 1, 40, 1.2, '#ffffff', 0.7); g.effects.flash(P, '#fff2c0', 10, 70, 0.6, '#ffb030'); } catch (e) { /* effets */ } try { g.audio.play('finish'); g.flash = 0.8; g.flashColor = '#fff2c0'; g.hitStop = 0.25; g.hitScale = 0.3; g.rig.shake = 0.6; g.audio.setZone('evoDawn', false); } catch (e) { /* effets */ } };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    if (g.rocket && g.rocket.active && g.evo) { g.rocket.fuel = g.rocket.fuelMax = 999; }
    try { step(g, dt); } catch (e) { if (!E._mvErr) { E._mvErr = 1; console.warn('mvp', e); } }
    try { drive(g, dt); } catch (e) { if (!E._mvErr2) { E._mvErr2 = 1; console.warn('mvp drive', e); } }
  };
  E.beginEnd = (g) => {   // echec : on retient le record de distance, puis retour au hangar
    if (RACE) { if (!g._mvEnd && !(g.evoWin && g.evoWin.revive)) showRevive(g); return; }
    fails[LV] = (fails[LV] || 0) + 1;
    const run = g.endlessRun; if (run) { const p = U.clamp(run.dist / (E.shortFin || 470), 0, 1); if (p > bestD()) lsSet('cc.mvp.bd.' + M + '.' + LV, p.toFixed(3)); }
    restart(g);
  };
  E.onClear = () => { /* la carte de fin prend la suite */ };
  E.mvpState = () => ({ ended, LV });
  E.raceState = () => ({ R, W });
  E.raceApi = { revive: (g) => doRevive(g), giveUp: (g) => giveUp(g), fake: (g, time, rank, died) => { ended = mkResult(g, time, rank, died); return ended; }, next: (g) => goNext(g) };

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
    if (RACE && W) {
      const rd = R.round - 1, fn = E.shortFin || 470, tNow = Math.max(0, g.flightTime);
      UI.text(ctx, ord(R.live) + ' / ' + R.field[rd], cx + len / 2 + S(165), cy + S(2), S(84), '#FFD23A', { outline: true });
      UI.text(ctx, 'MANCHE ' + R.round + '/3', cx - len / 2 - S(150), cy + S(2), S(46), '#ffffff', { outline: true });
      // qualifies : combien de pilotes ont deja franchi la ligne
      const qn = Math.min(R.keep[rd], W.bots.filter((b) => b.T <= tNow).length), qx = W0 - S(150), qy = H * 0.5;
      ctx.save(); UI.rrect(ctx, qx - S(120), qy - S(66), S(240), S(132), S(30)); ctx.fillStyle = 'rgba(12,18,30,0.62)'; ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
      UI.text(ctx, qn + ' / ' + R.keep[rd], qx, qy - S(12), S(66), qn >= R.keep[rd] ? '#FF5A4A' : '#7CFF6A', { outline: true }); UI.text(ctx, rd === 2 ? 'VICTOIRE' : 'QUALIFIES', qx, qy + S(42), S(34), '#ffffff', {});
      // morts : un crane et le nombre de pilotes que tu as fait exploser ; pieces
      { const kx = S(86), ky = H * 0.19; ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0b0d12'; ctx.lineWidth = S(5); ctx.beginPath(); ctx.arc(kx, ky - S(6), S(26), 0, 6.283); ctx.fill(); ctx.stroke(); ctx.fillRect(kx - S(13), ky + S(10), S(26), S(15)); ctx.strokeRect(kx - S(13), ky + S(10), S(26), S(15)); ctx.fillStyle = '#0b0d12'; ctx.beginPath(); ctx.arc(kx - S(10), ky - S(8), S(6.5), 0, 6.283); ctx.arc(kx + S(10), ky - S(8), S(6.5), 0, 6.283); ctx.fill(); ctx.restore(); UI.text(ctx, String(R.kills), kx + S(76), ky, S(56), '#ffffff', { outline: true }); }
      // les pseudos des pilotes a l'ecran et le premier
      const cam = g.camera, cpos = cam.position;
      const named = W.bots.filter((b) => b.m && b.m.visible).map((b) => ({ b, dd: cpos.distanceTo(b.m.position) })).filter((o) => o.dd > 9 && o.dd < 110).sort((x, y) => x.dd - y.dd).slice(0, 4).map((o) => o.b);
      for (const b of named) {
        tmpHud.copy(b.m.position); CC.Curve.apply(tmpHud, cam).project(cam); if (tmpHud.z > 1 || tmpHud.z < -1 || Math.abs(tmpHud.x) > 1.15 || Math.abs(tmpHud.y) > 1.15) continue;
        const sx = (tmpHud.x * 0.5 + 0.5) * W0, sy = (-tmpHud.y * 0.5 + 0.5) * H, k = U.clamp(46 / Math.max(10, cpos.distanceTo(b.m.position)), 0.5, 1.15);
        UI.text(ctx, b.name, sx, sy - S(92) * k, S(46) * k, b === W.lead ? '#FFD23A' : '#ffffff', { stroke: true });
        if (b === W.lead) UI.text(ctx, '1ER', sx, sy - S(142) * k, S(50) * k, '#FFD23A', { stroke: true });
      }
      if (W.lead && !(W.lead.m && W.lead.m.visible)) {   // le premier est loin devant : une fleche au bord de l'ecran avec l'ecart
        const T = run.T, L0 = W.lead; lanePos(T, L0.d, L0.off, L0.dy, tmpHud); CC.Curve.apply(tmpHud, cam).project(cam);
        let ex = tmpHud.x, ey = tmpHud.y; if (tmpHud.z > 1) { ex = -ex; ey = -ey; } const m = Math.max(Math.abs(ex), Math.abs(ey), 1e-3), px = U.clamp(ex / m * 0.86, -0.86, 0.86), py = U.clamp(ey / m * 0.78, -0.78, 0.78), sx = (px * 0.5 + 0.5) * W0, sy = (-py * 0.5 + 0.5) * H;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.atan2(-ey, ex) + Math.PI / 2); ctx.fillStyle = '#FFD23A'; ctx.strokeStyle = '#0b0d12'; ctx.lineWidth = S(5); ctx.beginPath(); ctx.moveTo(0, -S(26)); ctx.lineTo(S(22), S(18)); ctx.lineTo(-S(22), S(18)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        UI.text(ctx, '1ER  ' + Math.max(1, Math.round(L0.d - run.dist)) + ' M', sx, sy + (py > 0 ? -S(52) : S(52)), S(34), '#FFD23A', { stroke: true });
      }
      if (W.wheel) {   // la roue des pouvoirs
        const tw = (performance.now() - W.wheel.t0) / 1000;
        if (tw < 0.9) { const k = Math.floor(tw * 14) % POWERS.length; UI.text(ctx, POWERS[k], cx, H * 0.4, S(86), '#FFD23A', { outline: true }); UI.text(ctx, 'BLOC CHANCE', cx, H * 0.34, S(40), '#ffffff', { outline: true }); }
        else if (tw < 2.4) { const col = { TURBO: '#7CFF6A', BOUCLIER: '#5ad2ff', MISSILE: '#FF8A3A' }[W.wheel.kind]; UI.text(ctx, W.wheel.kind + ' !', cx, H * 0.4, S(100), col, { outline: true }); }
        else W.wheel = null;
      }
      if (W.missile && performance.now() - W.missile.t0 < 1800) UI.text(ctx, W.missile.name + ' TOUCHE', cx, H * 0.5, S(54), '#FF8A3A', { outline: true });
      if (W.cutMsg && performance.now() - W.cutMsg < 1600) UI.text(ctx, 'RACCOURCI !', cx, H * 0.3, S(96), '#43e05a', { outline: true });
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
  if (E.raceApi) Object.assign(E.raceApi, { R, start: startRun, cur });
  Home.drawEvoAim = function () { };   // plus de barre de lancement : START part tout de suite

  // ---------------------------------------------------------------- carte de fin (style MISSION ACCOMPLIE)
  const drawRevive = (ui, ctx, g, W0, H, w) => {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, T0, cw, cx } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, TT = 4.5;
    if (t > TT) { giveUp(g); return; }
    ctx.fillStyle = 'rgba(8,12,24,0.5)'; ctx.fillRect(0, T0, W0, F.HH);
    const cy = Y(0.42), r = S(165), pulse = 1 + 0.025 * Math.sin(t * 7);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse); const gr = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6); gr.addColorStop(0, 'rgba(120,200,255,0.55)'); gr.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#FF9A1F'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); ctx.lineWidth = S(10); ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r + S(8), -Math.PI / 2, -Math.PI / 2 + 6.283 * (1 - t / TT)); ctx.stroke(); ctx.restore();
    const gems = (E.save(g).gems || 0), useGems = R.deaths >= 2 && gems >= 3;
    UI.text(ctx, 'RELANCER ?', cx, cy - S(52), S(58), '#ffffff', { outline: true });
    UI.text(ctx, useGems ? '3 GEMMES' : 'REGARDER UNE PUB', cx, cy + S(40), S(useGems ? 56 : 36), '#ffffff', { outline: true });
    UI.tap(ui, cx - r, cy - r, r * 2, r * 2, () => doRevive(g));
    const bw = cw * 0.56, bh = S(130), bx = cx - bw / 2, by = Y(0.8) - bh / 2, loss = 10 + 10 * (R.roundKills || 0);
    UI.btnPrimary(ctx, bx, by, bw, bh, 'NON, MERCI', { sub: 'Perds ' + loss + ' pieces' }); UI.tap(ui, bx, by, bw, bh, () => giveUp(g));
  };
  const drawArena = (ui, ctx, g, W0, H, w) => {   // les eliminés : tous ceux qui n'ont pas passe la manche
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, T0, cw, cx } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, L = w.info;
    ctx.fillStyle = 'rgba(8,14,30,0.78)'; ctx.fillRect(0, T0, W0, F.HH);
    UI.text(ctx, 'ELIMINES', cx, Y(0.09), S(96), '#FF5A4A', { outline: true });
    UI.text(ctx, L.elim.length + ' PILOTES', cx, Y(0.17), S(44), '#dfe6f0', {});
    const names = L.elim.slice(0, 16), cols = 4, cwid = cw * 0.9 / cols, x0 = cx - cw * 0.45 + cwid / 2, y0 = Y(0.27), rh = S(118);
    names.forEach((nm, i) => {
      const c = i % cols, r = Math.floor(i / cols), a = U.clamp((t - i * 0.06) / 0.35, 0, 1), you = nm === 'TOI', x = x0 + c * cwid + Math.sin(i * 2.7) * S(10), y = y0 + r * rh + (1 - a) * -S(120) + Math.sin(t * 2 + i) * S(4);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate((1 - a) * 0.8 * (i % 2 ? 1 : -1));
      ctx.fillStyle = you ? '#FFD23A' : 'rgba(255,255,255,0.14)'; UI.rrect(ctx, -cwid * 0.42, -S(34), cwid * 0.84, S(68), S(22)); ctx.fill();
      UI.text(ctx, nm, 0, 0, UI.fit(ctx, nm, cwid * 0.78, S(36)), you ? '#0b0d12' : '#ffffff', {}); ctx.restore();
    });
    UI.text(ctx, L.qual ? 'TOI : QUALIFIE' : 'TOI : ELIMINE', cx, Y(0.74), S(60), L.qual ? '#7CFF6A' : '#FF5A4A', { outline: true });
    const bw = cw * 0.66, bh = S(140), bx = cx - bw / 2, by = Y(0.88) - bh / 2, label = (L.qual && !L.final) ? 'MANCHE SUIVANTE' : 'NOUVELLE PARTIE';
    UI.btnPrimary(ctx, bx, by, bw, bh, label); UI.tap(ui, bx, by, bw, bh, () => goNext(g));
  };
  const drawRaceCard = (ui, ctx, g, W0, H, w) => {
    if (w.revive) return drawRevive(ui, ctx, g, W0, H, w);
    if (w.stage === 'lineup') return drawLineup(ui, ctx, g, W0, H, w);
    if (w.stage === 'pack') return drawPack(ui, ctx, g, W0, H, w);
    if (w.stage === 'arena') return drawArena(ui, ctx, g, W0, H, w);
    const F = Home.evoK.frame(ui, ctx, W0, H), { HH: HH2, Y, T0, cw, cx } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, L = w.info;
    ctx.fillStyle = 'rgba(8,10,14,0.62)'; ctx.fillRect(0, T0, W0, HH2);
    const win = L.final && L.rank === 1, good = L.final ? L.rank <= 3 : L.qual;
    const title = L.died ? 'ELIMINE' : L.final ? (win ? 'VICTOIRE !' : L.rank <= 3 ? 'PODIUM !' : 'FINALE TERMINEE') : (L.qual ? 'QUALIFIE !' : 'ELIMINE');
    { const a = Math.min(1, t / 0.35); ctx.save(); ctx.globalAlpha = a; UI.text(ctx, title, cx, Y(0.1), UI.fit(ctx, title, cw * 0.92, S(110)), good ? '#FFD23A' : '#FF5A4A', { outline: true }); ctx.restore(); }
    { const k = Math.min(1, Math.max(0, (t - 0.15) / 0.3)), e = k < 1 ? 1 + 0.4 * Math.sin(k * 3.1416) : 1; UI.text(ctx, ord(L.rank) + ' / ' + L.field, cx, Y(0.235), S(165) * e, '#ffffff', { outline: true }); }
    UI.text(ctx, (L.died ? 'ABANDON' : L.time.toFixed(1) + ' S') + (L.kills ? '    MORTS ' + L.kills : ''), cx, Y(0.345), S(58), '#dfe6f0', {});
    const pw = cw * 0.74, px = cx - pw / 2, ry0 = Y(0.41), rh = S(60), rows = L.rows.slice();
    if (L.you >= rows.length) rows.push({ name: 'TOI', time: L.time, you: true, rank: L.you + 1, dnf: L.died });
    ctx.save(); UI.rrect(ctx, px - S(20), ry0 - S(10), pw + S(40), rh * rows.length + S(20), S(22)); ctx.fillStyle = 'rgba(12,18,30,0.55)'; ctx.fill(); ctx.restore();
    rows.forEach((r, i) => {
      const y = ry0 + i * rh + rh / 2, rk = r.rank || (i + 1);
      if (r.you) { ctx.fillStyle = 'rgba(255,210,58,0.28)'; ctx.fillRect(px - S(14), y - rh / 2 + S(4), pw + S(28), rh - S(8)); }
      UI.text(ctx, String(rk), px + S(28), y, S(40), r.you ? '#FFD23A' : '#ffffff', { align: 'left' });
      UI.text(ctx, r.name, px + S(110), y, S(40), r.you ? '#FFD23A' : '#ffffff', { align: 'left' });
      UI.text(ctx, r.dnf ? '--' : r.time.toFixed(1) + ' S', px + pw - S(10), y, S(40), r.you ? '#FFD23A' : '#dfe6f0', { align: 'right' });
    });
    UI.text(ctx, '+' + L.coins + ' PIECES' + (L.gems ? '    +' + L.gems + ' GEMMES' : ''), cx, Y(0.8), S(52), '#FFD23A', { outline: true });
    if (t > 0.8) {
      const bw = cw * 0.66, bh = S(140), bx = cx - bw / 2, by = Y(0.9) - bh / 2, pulse = 1 + 0.03 * Math.sin(t * 5);
      ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'CONTINUER'); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => { w.stage = L.pack ? 'pack' : 'lineup'; w.t0 = performance.now(); });
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
