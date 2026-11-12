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
  if (E.jungleShape) COURSES.unshift({ name: 'JUNGLE', map: 'jungle', variant: 0, seed: 11, isle: true, shape: E.jungleShape, zone: 'campagne', speed: 38, cap: 0, scenes: E.isleScenes || ['crsI0'] });
  if (E.iceShape) COURSES.unshift({ name: 'GLACE', map: 'ice', variant: 0, seed: 13, isle: true, shape: E.iceShape, zone: 'campagne', speed: 38, cap: 0, scenes: E.isleScenes || ['crsI0'] });
  if (E.desertShape) COURSES.unshift({ name: 'DESERT', map: 'desert', variant: 0, seed: 17, isle: true, shape: E.desertShape, zone: 'campagne', speed: 38, cap: 0, scenes: E.isleScenes || ['crsI0'] });
  if (E.factoryShape) COURSES.unshift({ name: 'USINE', map: 'factory', variant: 0, seed: 19, isle: true, shape: E.factoryShape, zone: 'campagne', speed: 38, cap: 0, scenes: E.isleScenes || ['crsI0'] });
  if (E.rangeShape) COURSES.unshift({ name: 'TERRAIN D ESSAI', map: 'range', variant: 0, seed: 9, isle: true, shape: E.rangeShape, zone: 'campagne', speed: 38, cap: 0, scenes: E.isleScenes || ['crsI0'] });
  if (E.isleShape) { const mir = E.isleShape.map((q) => [q[0], -q[1]].concat(q.slice(2))); [[2, mir], [1, mir], [0, E.isleShape]].forEach(([v, sh]) => COURSES.unshift({ name: 'ARCHIPEL ' + (v + 1), variant: v, seed: 5, isle: true, shape: v === 2 ? E.isleShape : sh, zone: 'campagne', speed: 38, cap: 0, scenes: E.isleScenes || ['crsI0'] })); }   // v370 : l'ile (la Coupe se court dessus)
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
  const SP = () => ((cur().speed || 44) + (W && W.boostT > 0 ? (cur().isle ? 7 : 12) : 0) + (W && W.bst ? 9 : 0) + (W && W.ground ? 3 : 0)) * (W && W.bumpT > 0 ? 0.82 : 1) * (W && W.slowT > 0 ? 0.45 : 1);
  const _rk = E.rocket;   // carburant illimite, jamais en panne
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };
  E.softCrash = () => false;   // la mort = une explosion simple, pas de roule-boule

  // la fiche du niveau
  const _ld = E.levelDef;
  E.levelDef = (g) => {
    if (E.isS2()) return _ld(g);
    const L = cur(); E.chapters = []; E.course = null;
    if (L.shape) { E.course = L.isle ? E.mkIsle(L.shape, L.variant, L.map) : E.courseExtras(E.mkCourse(L.shape), L.seed || 7); E.shortTiltOff = true; E.shortPad = 0; E.shortFin = Math.round(E.course.len); return E.baseDef({ zone: L.zone, len: E.shortFin + 160, scenes: L.scenes, order: new Array(90).fill(L.zone), theme: CC.LM.THEMES[0], hp: 1, bossEnt: null, seed: RACE ? 4000 + R.session * 13 + R.round * 7 : 5151 }); }
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
  const I = { cx: 0, cy: 0.5, mode: 'keys', k: {}, mx: -1, my: -1, ax: 0, ay: 0 };
  const ARR = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
  const setC = (x, y) => { I.cx = x / window.innerWidth * 2 - 1; I.cy = y / window.innerHeight; };
  window.addEventListener('touchstart', (e) => { I.mode = 'touch'; const t = e.touches[0]; if (t) { setC(t.clientX, t.clientY); if (e.touches.length < 2) I.anReset = 1; } I.boost = e.touches.length >= 2 ? 1 : 0; }, { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend', (e) => { I.boost = e.touches.length >= 2 ? 1 : 0; }, { passive: true });
  window.addEventListener('keydown', (e) => { I.k[e.code] = 1; const g0 = CC.game, fl = g0 && g0.state === 'FLIGHT'; if (e.code === 'Space') { if (fl) e.preventDefault(); } if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') I.boost = 1; if (ARR[e.code]) { I.mode = 'keys'; if (fl) e.preventDefault(); } });
  window.addEventListener('keyup', (e) => { I.k[e.code] = 0; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') I.boost = 0; });
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
    const dR = run.dist > 1 ? run.dist : Math.min(0, -rk.pos.z), d = Math.max(0, run.dist), k = Math.min(1, (dt || 0.016) * ((E.course && E.course.isle ? 6.5 : 9) - 5.2 * w));
    relOf(T, Math.max(0, dR), rk.pos, rel);
    const isl = !!(E.course && E.course.isle), kf = isl ? 0.85 : (cur().open ? 0.85 : 0.5), dc = dR - (isl ? 13 : 8.5), d2 = dc + (isl ? 48 : 40), fx = rel.x * kf, fy = rel.y * (kf * 0.8);
    const pa = T.at(dc, T.laneX(Math.max(0, dc)) + fx, T.laneY(Math.max(0, dc)) + (isl ? 5 : 2.2) + fy), pb = T.at(d2, T.laneX(Math.max(0, d2)) + fx, T.laneY(Math.max(0, d2)) + 0.2 + fy);
    camP.set(pa[0], Math.max(pa[1], T.base(Math.max(0, dc)) + 1.2), pa[2]); camL.set(pb[0], pb[1], pb[2]);
    { const y0 = camP.y; camP.y = U.clamp(camP.y, rk.pos.y + (isl ? 3.2 : 1.2), rk.pos.y + (isl ? 7.5 : 3.8)); camL.y += camP.y - y0; }   // la fusee ne sort jamais du champ (au depart, en plongee)
    if (W && W.free) {   // raccourci : la camera suit la fusee derriere elle
      const dv = tmp.copy(rk.vel).normalize(); camP.copy(rk.pos).addScaledVector(dv, -10).y += 3.4; camL.copy(rk.pos).addScaledVector(dv, 24);
      if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
      rig._mv.lerp(camP, Math.min(1, (dt || 0.016) * 6)); rig._ml.lerp(camL, Math.min(1, (dt || 0.016) * 8)); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml); return;
    }
    if (false) {   // controle libre : camera derriere la fusee, dans son axe, toujours centree sur elle
      const fc = W.fc, sdt = dt || 0.016; fc.cd.lerp(fc.dir, 1 - Math.exp(-sdt * 8)).normalize(); W.camB = (W.camB || 0) + ((W.boostT > 0 || W.bst ? 1 : 0) - (W.camB || 0)) * Math.min(1, sdt * 6);
      camP.copy(rk.pos).addScaledVector(fc.cd, -(6.6 + 1.8 * W.camB)); camP.y += 2.3 - 0.3 * W.camB; camL.copy(rk.pos).addScaledVector(fc.cd, 14); if (W.camB > 0.05) rig.punch = Math.max(rig.punch || 0, 0.6 * W.camB);
      if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
      rig._mv.lerp(camP, Math.min(1, sdt * 16)); rig._ml.lerp(camL, Math.min(1, sdt * 18)); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
      { const fvT = (g.baseFov || cam.fov) * (1.07 + 0.12 * W.camB); if (Math.abs(cam.fov - fvT) > 0.02) { cam.fov = fvT; cam.updateProjectionMatrix(); } }   // le champ s'elargit : les decors defilent plus vite
      return;
    }
    if (w > 0.001) {   // decollage : on voit la fusee partir du lanceur, la camera la suit de loin et d'en haut, puis redescend vers la vue de course en la gardant au centre
      frame(T, Math.max(0, d)); const fz = tmp.set(tf.x, 0, tf.z), side = tmp2.set(nn.x, 0, nn.z);
      LPOS.copy(rk.pos).addScaledVector(fz, -(8.5 + 8 * w)).addScaledVector(side, 4 * w); LPOS.y += 2.4 + 5 * w;
      camP.lerp(LPOS, w); LLOK.copy(rk.pos).addScaledVector(fz, 3 * w); camL.lerp(LLOK, Math.sqrt(w));
    }
    if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
    rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
    if (isl && W) { const sd2 = dt || 0.016; W.camB = (W.camB || 0) + ((W.boostT > 0 || W.bst ? 1 : 0) - (W.camB || 0)) * Math.min(1, sd2 * 6); const fvT = (g.baseFov || cam.fov) * (1.02 + 0.1 * W.camB); if (Math.abs(cam.fov - fvT) > 0.02) { cam.fov = fvT; cam.updateProjectionMatrix(); } if (W.camB > 0.05) rig.punch = Math.max(rig.punch || 0, 0.5 * W.camB); }   // le champ s'elargit au boost
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
    W.clock = (W.clock || 0) + dt; if (W && W.props && W.props.update) W.props.update(W.clock, rk.pos);   // horloge des obstacles : les penalites de temps ne la font pas sauter
    F.on = false; F.ctrl = 1;   // hors de l'ile on garde les memes commandes (on peut sortir un peu pour eviter un obstacle)
  };
  const isleKill = (g, crs, T, d, rk) => {   // sol (prairie), roche de l'ile, marteau
    if (g.flightTime < 1.2 || rk.shieldT > 0) return false;
    if (rk.pos.y < crs.isle.PY + 1.5 || E.isleSolid(crs, T, d, rel.x, rk.pos.y)) return true;
    return false;
  };
  const isleHit = (g, pos, d) => { if (g.flightTime < 1.2 || !W.props || !W.props.hits) return false; for (const f of W.props.hits) { if (f.d !== undefined && Math.abs(f.d - d) > 75) continue; if (f(pos)) return true; } return false; };
  const contactFx = (g, rk, big) => { if (W.hitCd > 0) return; W.hitCd = 0.35; try { g.audio.play('shield'); g.rig.shake = big ? 0.12 : 0.05; g.effects.flash(rk.pos.clone(), '#ffd9a0', 3, 50, 0.2, '#ff9a30'); } catch (e) { /* effets */ } };   // son et etincelles d'un contact (pas de penalite de temps : on perd de la vitesse et des places)
  const hitPenalty = (g, rk, dir) => {   // un obstacle : la fusee rebondit, perd 1,5 s et de la vitesse ; elle ne meurt pas
    rk.shieldT = 1.3; W.slowT = 0.8; g.flightTime += 1.5; R.penT = performance.now(); R.penAmt = 1.5; W.kickT = (Math.random() < 0.5 ? -1 : 1) * 11; dir.y = Math.max(dir.y, 0.15); dir.normalize();
    try { g.audio.play('shield'); g.rig.shake = 0.6; g.effects.flash(rk.pos.clone(), '#ffd9a0', 4, 60, 0.25, '#ff9a30'); } catch (e) { /* effets */ }
  };
  // ---------------------------------------------------------------- ILE : controle LIBRE a 100 % (le curseur oriente la fusee, la camera reste sur elle)
  const UPV = new V(0, 1, 0);
  let _rip = null; const wallRipple = (g, pos, nrm) => {   // l'onde du mur invisible : des anneaux bleutes qui s'elargissent a l'endroit du contact
    if (!W || !W.grp) return; if (!_rip || _rip.parent !== W.grp) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c2 = cv.getContext('2d'); for (let k = 0; k < 3; k++) { c2.strokeStyle = 'rgba(190,235,255,' + (0.9 - k * 0.25) + ')'; c2.lineWidth = 5 - k; c2.beginPath(); c2.arc(64, 64, 18 + k * 17, 0, 6.283); c2.stroke(); } const tx = new T3.CanvasTexture(cv); _rip = new T3.Mesh(new T3.PlaneGeometry(1, 1), new T3.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, side: T3.DoubleSide, fog: false })); _rip.userData.t0 = -9; W.grp.add(_rip); }
    if (_rip.visible && performance.now() - _rip.userData.t0 < 450) return; _rip.position.copy(pos); _rip.lookAt(pos.clone().add(nrm)); _rip.userData.t0 = performance.now(); _rip.visible = true; };
  const tmpN = new V();
  const driveFree = (g, dt, T, crs, rk, run, F, d0) => {   // pilotage dans le plan de la piste : ESPACE avance, les fleches dirigent (gauche, droite, haut, bas), jamais de cap libre ; collisions au NEZ seulement
    const I2 = crs.isle, k = I.k, now = performance.now(); dt = Math.min(dt, 0.05);
    let P = W.pc; if (!P) { const dk0 = T.base(d0) + I2.bank(d0) * rel.x; P = W.pc = { d: Math.max(0, run.dist), ox: rel.x, h: Math.max(2.2, rk.pos.y - dk0), vf: Math.max(8, rk.vel.dot(tf)), vl: 0, vy: 0 }; W.aim = new V().copy(tf); W.ghostT = 0; }
    const ap = /[?&]ap=1/.test(location.search), touch = I.mode === 'touch';
    let ax = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0), ay = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0);
    if (touch) {   // tactile : le doigt oriente, l'ancre rattrape le doigt (cap stable quand on s'arrete)
      if (I.anx === undefined || I.anReset) { I.anx = I.cx; I.any = I.cy; I.anReset = 0; }
      const ox2 = I.cx - I.anx, oy2 = I.any - I.cy, DZ = 0.022; ax = U.clamp(Math.sign(ox2) * Math.max(0, Math.abs(ox2) - DZ) / 0.35, -1, 1); ay = U.clamp(Math.sign(oy2) * Math.max(0, Math.abs(oy2) - DZ) / 0.22, -1, 1);
      const ka = 1 - Math.exp(-dt / 0.5); I.anx += (I.cx - I.anx) * ka; I.any += (I.cy - I.any) * ka;
    }
    if (ap) { ax = U.clamp(-P.ox / 8, -1, 1); ay = U.clamp((11 - P.h) / 6, -1, 1); }
    const gas = ap || touch || k.Space || g.flightTime < 2.6 || now < (W.grace || 0), inTube = I2.tubes && I2.tubes.some((q) => P.d > q.d0 && P.d < q.d1), sp = SP() + (inTube ? 6 : 0);
    P.vf += U.clamp((gas ? sp : 0) - P.vf, -34 * dt, 42 * dt);   // sans ESPACE la fusee ralentit et s'arrete
    const steerK = 0.45 + 0.55 * U.clamp(P.vf / Math.max(1, sp), 0, 1), slk = I2.slick && I2.slick.some((q) => P.d > q.d0 && P.d < q.d1), ea = 1 - Math.exp(-dt / (slk ? 0.75 : 0.13));   // sur la glace la fusee derape (inertie laterale)
    P.vl += (ax * 24 * steerK - P.vl) * ea; P.vy += (ay * 17 * steerK - P.vy) * ea;
    P.d += P.vf * dt; P.ox += P.vl * dt; P.h += P.vy * dt;
    if (I2.winds) for (const w of I2.winds) if (P.d > w.d0 && P.d < w.d1) { P.ox += w.lat * dt; P.h += w.up * dt; P.d -= w.head * (W.bst ? 0.25 : 1) * dt; }   // les vents poussent la fusee (le boost lutte contre le vent de face)
    const Wd = I2.W(P.d), over = Wd > 1 && Math.abs(P.ox) < Wd - 0.3, lim = Wd + 34;
    if (Math.abs(P.ox) > lim) { const sg = Math.sign(P.ox); P.ox = sg * lim; if (P.vl * sg > 0) P.vl = 0; wallRipple(g, rk.pos, nn); }   // mur invisible
    if (over && P.h < 2.2) { P.h = 2.2; if (P.vy < 0) P.vy = 0; }
    { const ceilH = I2.ceilAt ? I2.ceilAt(P.d) : 26; if (P.h > ceilH) { P.h = ceilH; if (P.vy > 0) P.vy = 0; wallRipple(g, rk.pos, UPV); } }   // plafond de la section
    // collisions : seulement le nez (2,6 m devant le centre)
    const NO = 2.6, RRc = 0.5, vln = Math.hypot(P.vf, P.vl, P.vy) || 1, ux = vln > 4 ? P.vf / vln : 1, uy = vln > 4 ? P.vl / vln : 0, uz = vln > 4 ? P.vy / vln : 0;
    let nd = P.d + NO * ux, nx = P.ox + NO * uy, nh = P.h + NO * uz;
    if (g.flightTime > 1.2 && I2.boxes) for (const b of I2.boxes) {
      if (nd < b[0] - RRc || nd > b[1] + RRc || nx < b[2] - RRc || nx > b[3] + RRc || nh < b[4] - RRc || nh > b[5] + RRc) continue;
      const cc2 = [nd - (b[0] - RRc), (b[1] + RRc) - nd, nx - (b[2] - RRc), (b[3] + RRc) - nx, nh - (b[4] - RRc), (b[5] + RRc) - nh]; let kq = 0; for (let q = 1; q < 6; q++) if (cc2[q] < cc2[kq]) kq = q;
      const sg = kq % 2 === 0 ? -1 : 1, amt = Math.min(cc2[kq], 3);
      if (kq < 2) { P.d += sg * amt; nd += sg * amt; if (sg < 0) P.vf = Math.min(P.vf, 0); else P.vf = Math.max(P.vf, 0); }   // de face : on est retenu (pas de recul)
      else if (kq < 4) { P.ox += sg * amt; nx += sg * amt; if (P.vl * sg < 0) P.vl = 0; }   // de cote : on glisse
      else { P.h += sg * amt; nh += sg * amt; if (P.vy * sg < 0) P.vy = 0; }
      contactFx(g, rk, false);
    }
    W.ghostT = Math.max(0, (W.ghostT || 0) - dt);
    if (g.flightTime > 1.2 && W.ghostT <= 0 && W.props && W.props.hits) { const np = T.at(nd, nx, I2.bank(nd) * nx + nh); tmpN.set(np[0], np[1], np[2]); if (isleHit(g, tmpN, nd)) { P.vf *= 0.3; W.ghostT = 0.5; contactFx(g, rk, true); } }   // obstacle mobile : on perd presque toute la vitesse, puis on le traverse (0,5 s)
    const pv = T.at(P.d, P.ox, I2.bank(P.d) * P.ox + P.h);
    if (g.flightTime > 1.2 && ((!over && P.h < -22) || pv[1] < I2.PY + 1.5 || E.isleSolid(crs, T, P.d, P.ox, pv[1]))) { R.penT = performance.now(); R.penAmt = 1.2; respawn(g); return; }   // chute : retour au debut de l'obstacle
    const dtt = Math.max(dt, 1e-3); rk.vel.set((pv[0] - rk.pos.x) / dtt, (pv[1] - rk.pos.y) / dtt, (pv[2] - rk.pos.z) / dtt);
    tmp.copy(rk.vel); const spd = tmp.length(); if (spd > 3) tmp.divideScalar(spd); else tmp.copy(tf); W.aim.lerp(tmp, 1 - Math.exp(-dt * 9)).normalize();
    g.input.setAim(Math.atan2(-W.aim.x, -W.aim.z), Math.asin(U.clamp(W.aim.y, -0.9, 0.9)));
  };

  // ---------------------------------------------------------------- pilotage : la fusee suit la piste, le joueur la decale
  const drive = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk.active || g.state !== 'FLIGHT' || g.evoFinish || g.flightTime < 0.05) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const sp = SP(), d2 = d + 8, ease = U.clamp(g.flightTime / 1.0, 0, 1);
    relOf(T, d, rk.pos, rel); const isl = !!(E.course && E.course.isle && W && W.props), F = isl ? (W.fall || (W.fall = { on: false, ctrl: 1, vy: 0, t: 0 })) : null; if (isl) isleStep(g, dt, E.course, d, F, rk);
    if (isl && W) W.ground = rk.pos.y - (T.base(d) + E.course.isle.bank(d) * rel.x) < 3.6 && Math.abs(rel.x) < E.course.isle.W(d) && g.flightTime > 1.5;
    if (isl && g.flightTime > 1.15 && !(W && W.free)) { driveFree(g, dt, T, E.course, rk, run, F, d); return; }
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
      if (isl) { tx = 0; ty = 0; }   // au decollage la fusee suit le centre ; le controle libre prend le relais apres 1,15 s
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
  const BOT_NAMES = (() => { const F = ['Lucas', 'Hugo', 'Emma', 'Lea', 'Theo', 'Nathan', 'Maxime', 'Chloe', 'Tom', 'Zoe', 'Enzo', 'Jade', 'Noah', 'Lina', 'Axel', 'Manon', 'Louis', 'Ines', 'Remi', 'Clara', 'Yanis', 'Sarah', 'Kevin', 'Anais', 'Mehdi', 'Julie', 'Adam', 'Camille', 'Dylan', 'Eva', 'Rayan', 'Lola', 'Mathis', 'Alice', 'Bastien', 'Oceane', 'Jules', 'Maeva', 'Romain', 'Nina'], X = ['_93', '_du59', '75', '_FR', '_YT', '2012', '_off', '974', '_gaming', '06', '_BZH', '_ttv', '123', '_xx', '2k', '_62', '_13', 'TV'], out = []; for (let i = 0; i < 96; i++) { const b = F[(i * 7) % F.length], x = X[(i * 5 + (i >> 3)) % X.length], p = i % 6; out.push((p === 0 ? b + x : p === 1 ? 'xX' + b + 'Xx' : p === 2 ? b.toLowerCase() + '_' + b.slice(0, 2).toLowerCase() + x.replace('_', '') : p === 3 ? b + '_' + String.fromCharCode(65 + (i * 3) % 26) + (10 + (i * 11) % 80) : p === 4 ? 'Mr' + b + x : b.slice(0, 4) + 'Gamer' + (i % 40)).slice(0, 14)); } return out; })();
  const BOT_COL = ['#e8352b', '#2f8cff', '#2fae22', '#f5c518', '#a64cf0', '#ff7a1a', '#17c3b2', '#ff4f9a', '#9aa3ad', '#7bd13a'];
  let sSeed = 1; const sr = () => (sSeed = (sSeed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const gz = () => (sr() + sr() + sr() + sr() - 2) * 1.7;
  const ord = (n) => (n === 1 ? '1ER' : n + 'E');
  const newSession = () => {
    sSeed = ((Date.now() & 0xffffff) + 17 * (++R.session)) >>> 0; R.surv = null; const READY = ['arch', 'range', 'jungle', 'ice', 'desert', 'factory'], byMap = (m) => COURSES.filter((c) => c.isle && (c.map || 'arch') === m), maps = READY.filter((m) => byMap(m).length);   // 3 cartes differentes par coupe, dans un ordre aleatoire
    for (let i = maps.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = maps[i]; maps[i] = maps[j]; maps[j] = t; }
    R.courses = [0, 1, 2].map((q) => { const L = byMap(maps[q % maps.length]); return L[Math.floor(sr() * L.length)] || L[0]; }); R.round = 1; R.last = null; R.kills = 0; R.coins = 0; R.deaths = 0; R.roundKills = 0;
    { const f = /[?&]racec=(\w+)/.exec(location.search); const one = f && COURSES.find((c) => c.name.replace(/\W/g, '') === f[1]); if (one) R.courses = [one, one, one]; }   // essai d'une course a la main
  };
  if (RACE) newSession();
  const botAdv = (b, t, dt, FN) => {   // la position d'un pilote : meme vitesse pour tous, des arrets (obstacles touches) calcules a l'avance, plus les chocs avec le joueur
    if (b.dl === undefined) { b.dl = 0; b.p = 0; b.blk = 0; }
    if (b.slow > 0) { b.slow -= dt; b.dl += dt * 0.65; }
    if (b.crash && !b.cDone && b.p >= b.pc) { if (!b.cT) b.cT = t; if (t - b.cT < 2.5) b.dl += dt; else b.cDone = true; }
    if (b.fin === undefined) {
      const te = t - b.dl; let acc = 0, d = null; b.blk = 0;
      for (const e of b.ev) { const ta = (e.d - b.d0) / b.v + acc; if (te < ta) break; if (te < ta + e.dur) { d = e.d; b.blk = 1; break; } acc += e.dur; }
      if (d === null) d = b.d0 + b.v * (te - acc);
      if (d >= FN) { b.fin = t - (d - FN) / b.v; d = FN; b.blk = 0; if (W.feed) W.feed.push({ name: b.name, t0: performance.now() }); }
      b.d = d;
    } else b.d = FN + (t - b.fin) * (cur().speed || 44) * 0.9;   // apres la ligne, le pilote entre dans la boite
    b.p = U.clamp((Math.min(b.d, FN) - b.d0) / (FN - b.d0), 0, 1);
  };
  const settleBots = (time) => { for (const b of W.bots) b.T = b.fin !== undefined ? b.fin : b.T0 + (b.dl || 0) + (b.crash && !b.cDone ? 2.5 : 0); };   
  const botD = (b, t, FN) => { let p; const tc = b.pc * b.tRun; if (!b.crash || t < tc) p = t / b.tRun; else if (t < tc + 2.5) p = b.pc; else p = (t - 2.5) / b.tRun; return b.d0 + (FN - b.d0) * U.clamp(p, 0, 1); };
  const lanePos = (T, d, dx, dy, out) => { const p = T.at(d, T.laneX(d) + dx, T.laneY(d) + dy); return out.set(p[0], p[1], p[2]); };
  const SKIN_IDS = ['stock', 'gamin', 'bedon', 'fuseev', 'minutemec', 'hachette', 'croquette', 'baguette', 'tridentin', 'poisson', 'gardien', 'titanite', 'satanette', 'berthe', 'croissant', 'chaton', 'tsarini', 'maman', 'bombeh', 'colis', 'caillou', 'royale', 'neon', 'phenix', 'glace', 'toxique', 'samourai', 'galaxie', 'furtive', 'requin', 'pirate', 'malicieuse', 'casquette'];
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
    W = { run, grp, boosts: [], bots: [], boostT: 0, kills: 0, fin: FN, coins: 0, roundKills: 0, en: 1, feed: [] }; R.deaths = 0; R.roundKills = 0;
    g.scene.add(grp); if (E.course && E.course.isle) { W.props = E.buildIsle(T, E.course, grp); W.free = null; W.wheel = null; W.fall = null; }
    else if (E.course) { E.buildCorridor(T, E.course, -4, FN + 150, grp); W.props = E.buildCourseProps(T, E.course, grp); W.free = null; W.wheel = null; }
    const offs = [-5, 4, -3, 5, -4, 3], dys = [0, 2, -1, 2, 0, 1];   // des fleches de vitesse : il faut un peu bouger pour les prendre
    for (let k = 0, d = 110; d < FN - 70 && !(E.course && E.course.isle); k++, d += 115) {   // plus de fleches vertes sur les iles
      const off = offs[k % offs.length] * (E.course ? U.clamp((E.course.hw(d) - 3) / 6, 0.2, 1) : 1), dy = dys[k % dys.length], o = new T3.Group(), tmpA = new V(), tmpB = new V();
      for (let j = 0; j < 3; j++) { const ar = CC.Models.guideArrow(); lanePos(T, d + j * 5 - 5, off, dy, tmpA); ar.position.copy(tmpA); lanePos(T, d + j * 5 - 2, off, dy, tmpB); ar.lookAt(tmpB); ar.scale.setScalar(2.4); o.add(ar); }
      grp.add(o); W.boosts.push({ d, off, dy, grp: o, taken: false });
    }
    // les pilotes IA : une Coupe = 32 pilotes, puis seuls les qualifies reviennent (16, puis 8). Chacun a son niveau : quelques-uns te battent, d'autres sont loin derriere
    const T0 = (FN + 40) / sp - 0.5, ids = SKIN_IDS.filter((id) => CC.Skins.byId[id]);
    if (rd === 0 || !R.surv) {
      for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
      R.cast = []; for (let i = 0; i < R.field[0] - 1; i++) R.cast.push({ name: BOT_NAMES[(i * 7) % BOT_NAMES.length], skin: ids[i % ids.length], L: -0.02 + 0.2 * Math.pow(sr(), 1.25), off: (sr() - 0.5) * 13, dy: (sr() - 0.5) * 4, ph: sr() * 6.28 });
    }
    const cast = rd === 0 || !R.surv ? R.cast : R.surv;
    // la grille de depart : 5 colonnes, le joueur a l'arriere du peloton, les plus rapides devant : on les rattrape un a un
    const COLX = [-20, -12, -4, 4, 12, 20], nb = cast.length, rowsN = Math.ceil(nb / 6), slots = [], pr = 1;   // meme ligne de depart pour tous (rangs de 5 m), le joueur au centre
    for (let r = 0; r < rowsN; r++) for (let q = 0; q < 6; q++) slots.push([r, q]);
    for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = slots[i]; slots[i] = slots[j]; slots[j] = t; }
    W.startRow = pr;
    const ds = []; { const hs = (W.props && W.props.hits ? W.props.hits.map((q) => q.d) : []).concat(E.course && E.course.isle && E.course.isle.evD ? E.course.isle.evD : []).sort((a, b) => a - b); for (const d of hs) if (!ds.length || d - ds[ds.length - 1] > 18) ds.push(d); if (!ds.length) for (let d = 150; d < FN - 100; d += 90) ds.push(d); }
    const vB = sp * 0.985, easeK = U.clamp(1 + R.ease * 0.8, 0.5, 1.8);   // tous roulent a la meme vitesse (un peu moins que le joueur parfait) : seules leurs erreurs les separent
    cast.forEach((c, i) => {
      const sk = U.clamp(1 - (c.L + 0.02) / 0.2, 0, 1), sl = slots[i] || [0, 2], d0 = -40 + (pr - sl[0]) * 5, v = vB * (1 + (sr() - 0.5) * 0.014), ev = [];
      for (const d of ds) { if (d < d0 + 60) continue; const p = (0.05 + 0.6 * Math.pow(1 - sk, 1.2)) * easeK; if (sr() < p) ev.push({ d: d + (sr() - 0.5) * 8, dur: 0.8 + sr() * 1.2 }); }
      let tot = 0; for (const e of ev) tot += e.dur; const T0 = (FN - d0) / v + tot + gz() * 0.12;
      W.bots.push({ i, c, d0, v, ev, T0, gx: COLX[sl[1]], name: c.name, skin: c.skin, tRun: T0, crash: false, pc: 0.5, T: T0, off: c.off, dy: c.dy, ph: c.ph, boom: false, d: 0, m: null, tr: null, hist: [], dead: false });
    });
    if (E.course && E.course.isle && W.bots.length) {   // chaque pilote a sa rampe de lancement (comme la notre)
      const n = W.bots.length, slab = new T3.InstancedMesh(new T3.BoxGeometry(3.8, 0.5, 8), new T3.MeshLambertMaterial({ color: '#4a4f57' }), n), rail = new T3.InstancedMesh(new T3.BoxGeometry(0.35, 0.45, 7), new T3.MeshLambertMaterial({ color: '#c9ccd2' }), n * 2), dm = new T3.Object3D();
      W.bots.forEach((b, i) => { const bk = E.course.isle.bank(b.d0) * b.gx, p0 = T.at(b.d0, b.gx, 0.25 + bk), q0 = T.at(b.d0 + 3, b.gx, 0.25 + bk);
        dm.position.set(p0[0], p0[1], p0[2]); dm.scale.set(1, 1, 1); dm.lookAt(q0[0], p0[1], q0[2]); dm.updateMatrix(); slab.setMatrixAt(i, dm.matrix);
        for (const sg of [-1, 1]) { dm.position.set(p0[0], p0[1] + 0.3, p0[2]); dm.lookAt(q0[0], p0[1] + 0.3, q0[2]); dm.translateX(sg * 1.1); dm.updateMatrix(); rail.setMatrixAt(i * 2 + (sg > 0 ? 1 : 0), dm.matrix); } });
      slab.instanceMatrix.needsUpdate = true; rail.instanceMatrix.needsUpdate = true; slab.frustumCulled = false; rail.frustumCulled = false; grp.add(slab, rail);
    }
    buildFinish(g, T, FN, grp);
  };
  const bOff = (b, d) => (E.course && E.course.isle ? b.off * U.clamp(E.course.isle.W(d) * 0.8 / 6.5, 0.3, 9) : b.off * (E.course ? U.clamp((E.course.hw(d) - 2.4) / 6.5, 0.15, 1.1) : 1));
  const rivalMesh = (g, b) => {   // le skin et la traînée d'un pilote (crees au premier passage a l'ecran)
    const sk = CC.Skins.byId[b.skin] || CC.Skins.byId.stock;
    b.m = CC.Models.rocket(sk); b.m.scale.set(5.4, 5.4, 3.8); b.m.visible = false; W.grp.add(b.m);
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
      if (best) { best.hit = true; best.crash = true; best.pc = best.p || 0; best.boom = true;  R.roundKills++; R.kills++; const P = best.m ? best.m.position.clone() : rk.pos.clone().addScaledVector(tf, 40); try { g.effects.explosion(P, new V(0, 1, 0), false, 'orange'); g.audio.play('boomSmall', P); } catch (e) { /* effets */ } if (best.m) { best.m.visible = false; best.tr.visible = false; } W.missile = { name: best.name, t0: performance.now() }; }
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
    if (_rip && _rip.visible) { const age = (performance.now() - _rip.userData.t0) / 900; if (age >= 1) _rip.visible = false; else { _rip.scale.setScalar(6 + 46 * age); _rip.material.opacity = 0.85 * (1 - age); } }
    if (flying && !fin) { const want = I.boost && (W.en === undefined ? 1 : W.en) > 0.02; if (W.en === undefined) W.en = 1; if (want && !W.bstWas) { try { g.rig.boostKick(); g.audio.play('target'); } catch (e) { /* effets */ } } W.bst = want ? 1 : 0; W.bstWas = W.bst; W.en = U.clamp(W.en + (want ? -0.62 : (W.enCd > 0 ? 0 : 0.22)) * dt, 0, 1); if (want) W.enCd = 0.7; else if (W.enCd > 0) W.enCd -= dt; } else W.bst = 0;   // boost : espace ou clic, une mini-barre qui se vide vite puis se recharge
    let ahead = 0, lead = null; const vis = [], pd = run.dist > 1 ? run.dist : -rk.pos.z; if (W.bumpT > 0) W.bumpT -= dt; if (W.slowT > 0) W.slowT -= dt; if (W.hitCd > 0) W.hitCd -= dt; W.kickT = (W.kickT || 0) * Math.exp(-dt * 1.6); W.kick = (W.kick || 0) + (W.kickT - (W.kick || 0)) * Math.min(1, dt * 5);
    for (const b of W.bots) {
      botAdv(b, t, dt, FN); if (b.d > pd) { ahead++; if (!lead || b.d > lead.d) lead = b; }
      const hidden = b.crash && b.cT && t - b.cT >= 0.3 && t - b.cT < 2.5;
      if (b.crash && !b.boom && b.p >= b.pc && Math.abs(b.d - run.dist) < 220) { b.boom = true; lanePos(T, b.d, bOff(b, b.d), b.dy, tmp2); try { g.effects.explosion(tmp2.clone(), new V(0, 1, 0), false, 'orange'); } catch (e) { /* effets */ } }
      if (Math.abs(b.d - pd) < 200 && !hidden && !(b.fin !== undefined && b.d > FN + 26)) vis.push(b); else if (b.m) { b.m.visible = false; b.tr.visible = false; if (b.sh) b.sh.visible = false; }
    }
    vis.sort((a, c) => (Math.abs(a.d - pd) - (a.d > pd ? 15 : 0)) - (Math.abs(c.d - pd) - (c.d > pd ? 15 : 0)));
    const MAXV = 40;   // au depart on voit tout le monde ; ensuite au plus 5 pilotes a l'ecran
    for (let k = 0; k < vis.length; k++) {
      const b = vis[k], show = k < MAXV || (b.shown && k < MAXV + 1); b.shown = show; b.vk = (b.vk || 0) + ((show ? 1 : 0) - (b.vk || 0)) * Math.min(1, dt * 7);
      if (!show && b.vk < 0.04) { if (b.m) { b.m.visible = false; b.tr.visible = false; if (b.sh) b.sh.visible = false; } continue; }
      if (!b.m) rivalMesh(g, b);
      const wf = bOff(b, b.d) !== b.off ? bOff(b, b.d) / (b.off || 1) : 1, wob = 1.5 * Math.sin(t * 1.3 + b.ph) * (E.course ? 0.55 : 1), wob2 = 1.5 * Math.sin((t + 0.12) * 1.3 + b.ph) * (E.course ? 0.55 : 1);
      { const s1 = U.clamp(t / 4.5, 0, 1), ss = s1 * s1 * (3 - 2 * s1), s2 = U.clamp(t / 2.4, 0, 1), sv = s2 * s2 * (3 - 2 * s2), lx1 = b.gx === undefined ? bOff(b, b.d) + wob : (b.gx + (bOff(b, b.d) + wob - b.gx) * ss);
        b.pushT = (b.pushT || 0) * Math.exp(-dt * 1.4); b.push = (b.push || 0) + (b.pushT - (b.push || 0)) * Math.min(1, dt * 5); lanePos(T, b.d, lx1 + b.push, b.dy, b.m.position); lanePos(T, b.d + 6, b.gx === undefined ? bOff(b, b.d + 6) + wob2 : (b.gx + (bOff(b, b.d + 6) + wob2 - b.gx) * ss), b.dy, tmp2);
        if (b.gx !== undefined && sv < 1) { const dk = T.at(b.d, lx1, (E.course && E.course.isle ? E.course.isle.bank(b.d) * lx1 : 0) + 0.9)[1]; b.m.position.y = dk + (b.m.position.y - dk) * sv; tmp2.y = dk + (tmp2.y - dk) * sv + 0.6 * (1 - sv); }   // sur les rampes au depart, puis elles decollent
        b.m.lookAt(tmp2); b.m.visible = true; b.m.scale.set(5.4 * b.vk, 5.4 * b.vk, 3.8 * b.vk);
        if (E.isleBlob && E.course && E.course.isle) { if (!b.sh) { b.sh = E.isleBlob(); W.grp.add(b.sh); } const I4 = E.course.isle, lxs = lx1 + b.push; if (Math.abs(lxs) < I4.W(b.d) - 0.5) { const p = T.at(b.d, lxs, I4.bank(b.d) * lxs + 0.08), h = Math.max(0, b.m.position.y - p[1]); b.sh.visible = true; b.sh.position.set(b.m.position.x + E.isleLS.x * h, p[1], b.m.position.z + E.isleLS.z * h); b.sh.scale.setScalar((4.2 + h * 0.1) * b.vk); b.sh.material.opacity = Math.max(0.12, 0.62 - h * 0.022) * b.vk; } else b.sh.visible = false; } }
      if (b.blk) { if (!b.blkP) { try { g.effects.flash(b.m.position.clone(), '#ffd9a0', 3, 50, 0.2, '#ff9a30'); } catch (e) { /* effets */ } } b.m.rotateZ(0.35 * Math.sin(t * 38)); b.m.position.y += 0.35 * Math.sin(t * 27); } b.blkP = b.blk;
      if (E.course) b.m.rotateZ(U.clamp(-E.course.rate(b.d) * (cur().speed || 46) * 0.2, -0.75, 0.75) + 0.12 * Math.cos(t * 1.3 + b.ph));   // la fusee se penche dans les virages (et un peu quand elle bouge sur le cote)
      b.tr.visible = false; if (k < 10) { const fx = g.effects, fw = tmp.copy(tmp2).sub(b.m.position).normalize(), nz = b.m.position.clone().addScaledVector(fw, -2.1), vv = fw.clone().multiplyScalar(36); try { fx.exhaustCore(nz, fw, vv, 1, dt); fx.exhaustSmoke(nz.clone().addScaledVector(fw, -0.7), vv, 1); fx.exhaustSmoke(nz.clone().addScaledVector(fw, -1.5), vv, 1); } catch (e) { /* effets */ } }   // la meme flamme et la meme fumee que la fusee du joueur
      if (flying && !fin && t > 1.5) {   // on touche un pilote : les deux rebondissent (etincelles, un peu de vitesse en moins), personne ne meurt
        const dn2 = rk.pos.distanceTo(b.m.position), df = tmp.copy(b.m.position).sub(rk.pos), fd = W.fc ? W.fc.dir : tf, al = df.dot(fd), pp = Math.sqrt(Math.max(0, df.lengthSq() - al * al));
        if (!b.bump && b.vk > 0.8 && Math.abs(al) < 3.2 && pp < 1.5) { b.bump = true; b.slow = 0.9; W.bumpT = 0.35; { const sg = Math.sign(df.dot(nn)) || 1; b.pushT = sg * 6; W.kickT = 0; } try { g.effects.flash(rk.pos.clone().lerp(b.m.position, 0.5), '#ffe2a8', 3, 50, 0.25, '#ffb030'); g.audio.play('target'); } catch (e) { /* effets */ } }
        else if (b.bump && dn2 > 9) b.bump = false;
      }
    }
    W.lead = lead; R.live = 1 + ahead;
    if (E.isleBlob && E.course && E.course.isle) {   // l'ombre de la fusee du joueur sur la piste
      const I3 = E.course.isle, sh = W.sh || (W.sh = (() => { const m = E.isleBlob(); W.grp.add(m); return m; })());
      if (rk.active && flying && Math.abs(rel.x) < I3.W(pd) - 0.5) { const p = T.at(pd, rel.x, I3.bank(pd) * rel.x + 0.08), h = Math.max(0, rk.pos.y - p[1]); sh.visible = true; sh.position.set(rk.pos.x + E.isleLS.x * h, p[1], rk.pos.z + E.isleLS.z * h); sh.scale.setScalar(4.2 + h * 0.1); sh.material.opacity = Math.max(0.12, 0.62 - h * 0.022); } else sh.visible = false;
    }
  };
  // la ligne d'arrivee : deux pylones, une banderole a damier, un anneau lumineux et des faisceaux
  const buildFinish = (g, T, FN, grp) => {
    if (E.course && E.course.isle) return;   // sur les iles, l'arrivee est une boite construite avec la carte
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
  const respawn = (g) => {   // un echec : on repart au debut de l'obstacle (ou de la section), avec un peu de temps perdu
    const run = g.endlessRun, rk = g.rocket, T = run.T; let d = Math.max(20, run.dist - 40);
    if (E.course && E.course.isle) { const I9 = E.course.isle, c = [20]; for (const st of I9.starts) c.push(st + 16); if (W && W.props && W.props.hits) for (const f of W.props.hits) if (f.d !== undefined) c.push(f.d - 70); d = 20; for (const q of c) if (q <= run.dist - 12 && q > d) d = q; if (W) { W.pc = null; W.grace = performance.now() + 1600; } }
    const p = T.at(d, T.laneX(d), T.laneY(d)), q = T.at(d + 3, T.laneX(d + 3), T.laneY(d + 3));
    const pos = new V(p[0], p[1], p[2]), dir = new V(q[0] - p[0], q[1] - p[1], q[2] - p[2]).normalize(), yaw = Math.atan2(-dir.x, -dir.z), pit = Math.asin(dir.y);
    g.input.setAim(yaw, pit); g.rig.setAim(yaw, pit); g.acc = 0;
    rk.launch(pos, dir, { speed: cur().speed || 44, ignited: true, freeBoost: 0.5 }); rk.shieldT = 1.4;
    run.dist = d; if (W) { W.fall = null; W.fc = null; } if (g.rig) g.rig._mv = null; g.rig.startFlight(); g.state = 'FLIGHT'; g.stallT = 0; g.impactT = 0; g.flightTime += 1.2; R.penT = performance.now();
    try { g.audio.play('shield'); } catch (e) { /* son */ }
  };
  const tmpHud = new V();
  const buildSolo = (g, run) => { if (W) { try { g.scene.remove(W.grp); } catch (e) { /* ignore */ } } const grp = new T3.Group(); W = { run, grp, boosts: [], bots: [], boostT: 0, kills: 0 }; g.scene.add(grp); buildFinish(g, run.T, E.shortFin || 470, grp); };
  const coinsFor = (rank, kills, died) => (died ? 10 : Math.max(20, 130 - 3 * rank)) + kills * 15;
  const mkResult = (g, time, rank, died) => {   // le classement de la manche, les pieces gagnees, les eliminés
    const rd = R.round - 1, keep = R.keep[rd], qual = !died && rank <= keep;
    settleBots(time); const all = W.bots.map((b) => ({ name: b.name, time: b.T })); all.push({ name: 'TOI', time: died ? 999 : time, you: true }); all.sort((x, y) => x.time - y.time);
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
    if (rk.mesh && rk.active) { rk.mesh.scale.set(6.6, 6.6, 4.6); if (W && rk.mesh !== W._olFor) { W._olFor = rk.mesh; const olM = new T3.MeshBasicMaterial({ color: '#ffe066', side: T3.BackSide, fog: false }); rk.mesh.traverse((o) => { if (o.isMesh && !o.userData.ol && o.material && !o.material.transparent) { const c = new T3.Mesh(o.geometry, olM); c.userData.ol = true; c.scale.setScalar(1.1); o.add(c); } }); } }   // plus larges + un contour jaune : elle ressort du decor   // plus larges : on les voit mieux   // la fusee est plus grosse a l'ecran
    if (RACE && W && W.run === run) raceStep(g, dt);
    if (RACE && W && W.run === run && rk.active && g.state === 'FLIGHT' && !g.evoFinish) {   // le costume choisi dans le menu et la traînee de la fusee du joueur
      if (!W._sk && g.flightTime > 0.15) { W._sk = 1; const ps = playerSkin(); if (ps) { try { rk.setSkin(ps); } catch (e) { /* skin */ } } }
      if (W.pb) { W.pb.hist.unshift(rk.pos.clone()); if (W.pb.hist.length > TRN) W.pb.hist.pop(); updRibbon(W.pb); }
    }
    if (W && W.pb && (g.evoFinish || !rk.active)) W.pb.tr.visible = false;
    if (ended && wantEnd && performance.now() >= wantEnd) { wantEnd = 0; g.evoWin = { mv: true, race: RACE, t0: performance.now(), lv: LV, info: ended }; g.ui.overlay = 'evoWin'; try { g.audio.play('victory'); } catch (e) { /* son */ } }
    if (RACE && W && W.run === run && !g.evoFinish && !g._mvEnd && !ended && g.state === 'FLIGHT' && rk.active && g.flightTime > 4) {   // toutes les places qualificatives sont prises : la manche est perdue sans passer la ligne
      const tn = g.flightTime, keepN = R.keep[R.round - 1];
      if (W.bots.filter((b) => b.fin !== undefined && b.fin <= tn).length >= keepN) { g._mvEnd = 1; settleBots(tn); const rk2 = 1 + W.bots.filter((b) => b.T < tn).length; ended = mkResult(g, tn, rk2, true); R.last.late = true; g.evoFinish = { t0: performance.now(), hold: true }; wantEnd = performance.now() + 1100; return; }
    }
    if (RACE && g.evoFinish && !g._mvEnd && W) {   // fin de manche : le rang parmi les pilotes
      g._mvEnd = 1; const time = Math.max(0, g.flightTime); settleBots(time); const rank = 1 + W.bots.filter((b) => b.T < time).length;
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
      const bw = cw * 0.6, bh = S(130), bx = cx - bw / 2, by = Y(0.89) - bh / 2; UI.btnPrimary(ctx, bx, by, bw, bh, 'SUPER !'); UI.tap(ui, bx, by, bw, bh, () => { goNext(g); });
    }
  };
  const restart = (g) => {
    stopLineup(g);
    ended = null; wantEnd = 0; g._mvEnd = 0; g.evoWin = null;
    const rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; }
    E.endTumble(g); g.evoReport = false; g.evoLast = null; if (g.rig) g.rig._mv = null; g.goHome({});
  };
  const goNext = (g) => { if (RACE) { const L = R.last, more = !!(L && L.qual && !L.final); if (more) R.round++; else newSession(); restart(g); if (more) setTimeout(() => startRun(g), 350); return; } LV = LV >= NLV ? 1 : LV + 1; lsSet('cc.mvp.lv.' + M, LV); restart(g); };
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
    if (!RACE) {
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
    }
    if (RACE && W) {
      const rd = R.round - 1, fn = E.shortFin || 470, tNow = Math.max(0, g.flightTime);
      { const x0 = S(24), y0 = S(22), w0 = S(430), h0 = S(92); ctx.save(); ctx.fillStyle = '#ff2f9a'; UI.rrect(ctx, x0, y0, w0, h0, S(22)); ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.fillStyle = '#12131a'; ctx.fillRect(x0 + S(18), y0 + h0 - S(9), w0 - S(36), S(5)); ctx.restore();
        UI.text(ctx, "COURSE VERS", x0 + w0 / 2, y0 + S(30), S(34), '#ffffff', { outline: true }); UI.text(ctx, "L'ARRIVEE !", x0 + w0 / 2, y0 + S(66), S(34), '#ffffff', { outline: true });
        UI.text(ctx, 'MANCHE ' + R.round + '/3  -  ' + ord(R.live) + ' / ' + R.field[rd] + '  -  ' + Math.max(0, g.flightTime).toFixed(1) + ' S', x0 + w0 / 2, y0 + h0 + S(34), S(30), '#ffffff', { outline: true }); }
      // qualifies : combien de pilotes ont deja franchi la ligne
      const ISL = !!(E.course && E.course.isle);
      { const qn = Math.min(R.keep[rd], W.bots.filter((b) => b.fin !== undefined && b.fin <= tNow).length), w1 = S(300), h1 = S(104), x1 = W0 - S(24) - w1, y1 = S(22);
        ctx.save(); ctx.fillStyle = '#14151c'; UI.rrect(ctx, x1, y1, w1, h1, S(22)); ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.fillStyle = '#ff2f9a'; ctx.fillRect(x1 + S(18), y1 + h1 - S(11), w1 - S(36), S(6)); ctx.restore();
        UI.text(ctx, rd === 2 ? 'VICTOIRE' : 'QUALIFIES', x1 + w1 / 2, y1 + S(28), S(30), '#ffffff', { outline: true }); UI.text(ctx, qn + ' / ' + R.keep[rd], x1 + w1 / 2, y1 + S(68), S(56), qn >= R.keep[rd] ? '#FF5A4A' : '#7CFF6A', { outline: true });
        const nowF = performance.now(), fd = (W.feed || []).filter((q) => nowF - q.t0 < 4200).slice(-4); fd.forEach((q, i2) => { const a = U.clamp((4200 - (nowF - q.t0)) / 700, 0, 1) * U.clamp((nowF - q.t0) / 150, 0, 1); ctx.save(); ctx.globalAlpha = a; UI.text(ctx, q.name, W0 - S(34), y1 + h1 + S(40) + i2 * S(36), S(28), '#ffffff', { align: 'right', stroke: true }); ctx.restore(); }); }
      // morts : un crane et le nombre de pilotes que tu as fait exploser ; pieces
      if (R.kills > 0) { const kx = S(86), ky = H * 0.19; ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0b0d12'; ctx.lineWidth = S(5); ctx.beginPath(); ctx.arc(kx, ky - S(6), S(26), 0, 6.283); ctx.fill(); ctx.stroke(); ctx.fillRect(kx - S(13), ky + S(10), S(26), S(15)); ctx.strokeRect(kx - S(13), ky + S(10), S(26), S(15)); ctx.fillStyle = '#0b0d12'; ctx.beginPath(); ctx.arc(kx - S(10), ky - S(8), S(6.5), 0, 6.283); ctx.arc(kx + S(10), ky - S(8), S(6.5), 0, 6.283); ctx.fill(); ctx.restore(); UI.text(ctx, String(R.kills), kx + S(76), ky, S(56), '#ffffff', { outline: true }); }
      if (rk.active && g.state === 'FLIGHT' && !g.evoFinish && rk.vel.lengthSq() > 4) {   // reticule : ou la fusee va, 40 m devant
        tmpHud.copy(rk.pos).addScaledVector(tmp.copy(rk.vel).normalize(), 40); CC.Curve.apply(tmpHud, g.camera).project(g.camera);
        if (tmpHud.z < 1 && Math.abs(tmpHud.x) < 1.2 && Math.abs(tmpHud.y) < 1.2) { const cur2 = false, rx = cur2 ? (I.cx * 0.5 + 0.5) * W0 : (tmpHud.x * 0.5 + 0.5) * W0, ry = cur2 ? I.cy * H : (-tmpHud.y * 0.5 + 0.5) * H, rr = S(16); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = S(3.5); ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 6.283); ctx.moveTo(rx - rr * 1.7, ry); ctx.lineTo(rx - rr * 0.8, ry); ctx.moveTo(rx + rr * 0.8, ry); ctx.lineTo(rx + rr * 1.7, ry); ctx.stroke(); ctx.restore(); }
      }
      if (W.ground) UI.text(ctx, 'RASANT', cx, H * 0.8, S(40), '#7CFF6A', { outline: true });
      if (ISL && g.state === 'FLIGHT' && g.flightTime > 0.6 && g.flightTime < 10) { const al = U.clamp(10 - g.flightTime, 0, 1) * U.clamp((g.flightTime - 0.6) / 0.5, 0, 1), hw = S(560), hh = S(70), hx = W0 / 2 - hw / 2, hy = H * 0.9 - hh / 2; ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = 'rgba(14,15,22,0.78)'; UI.rrect(ctx, hx, hy, hw, hh, S(20)); ctx.fill(); ctx.lineWidth = S(4); ctx.strokeStyle = '#ff2f9a'; ctx.stroke(); ctx.restore(); ctx.save(); ctx.globalAlpha = al; UI.text(ctx, 'ESPACE : AVANCER    -    FLECHES : DIRIGER    -    MAJ : BOOST', W0 / 2, hy + hh / 2, S(27), '#ffffff', { outline: true }); ctx.restore(); }   // l'aide du depart : les fleches, et le boost
      if (rk.active && g.state === 'FLIGHT' && !g.evoFinish) {   // une fleche au-dessus de notre fusee, et la mini-barre de boost dessous
        tmpHud.copy(rk.pos); CC.Curve.apply(tmpHud, g.camera).project(g.camera);
        if (tmpHud.z < 1 && Math.abs(tmpHud.x) < 1.1 && Math.abs(tmpHud.y) < 1.1) { const px = (tmpHud.x * 0.5 + 0.5) * W0, py = (-tmpHud.y * 0.5 + 0.5) * H, bob = Math.sin(performance.now() / 220) * S(4);
          ctx.save(); ctx.translate(px, py - S(122) + bob); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#0b0d12'; ctx.lineWidth = S(5); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, S(22)); ctx.bezierCurveTo(-S(8), S(10), -S(25), S(4), -S(25), -S(9)); ctx.arc(0, -S(9), S(25), Math.PI, 0); ctx.bezierCurveTo(S(25), S(4), S(8), S(10), 0, S(22)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.arc(-S(9), -S(15), S(6), 0, 6.283); ctx.fill(); ctx.restore();
          const en = W.en === undefined ? 1 : W.en; if (en < 0.995 || W.bst) { const bw2 = S(120), bh2 = S(13), bx2 = px - bw2 / 2, by2 = py + S(74); ctx.save(); ctx.fillStyle = 'rgba(10,12,20,0.7)'; UI.rrect(ctx, bx2 - S(3), by2 - S(3), bw2 + S(6), bh2 + S(6), S(8)); ctx.fill(); ctx.fillStyle = en > 0.25 ? '#7CFF6A' : '#ff9a30'; UI.rrect(ctx, bx2, by2, Math.max(S(4), bw2 * en), bh2, S(6)); ctx.fill(); ctx.restore(); } } }
      if (ISL && rk.active && g.state === 'FLIGHT' && !g.evoFinish) { const now2 = performance.now(), mn2 = Math.min(W0, H), bi = W.bst ? 2 : 1; ctx.save(); ctx.lineCap = 'round'; for (let q = 0; q < 26; q++) { const ph = ((q * 0.381 + now2 / (520 / bi)) % 1), a = q * 2.399 + 0.5, r0 = mn2 * (0.34 + 0.42 * ph), r1 = r0 + mn2 * (0.02 + 0.1 * ph * bi); ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + 0.2 * ph * (bi > 1 ? 1.4 : 1)) + ')'; ctx.lineWidth = S(2 + 2.2 * ph); ctx.beginPath(); ctx.moveTo(W0 / 2 + Math.cos(a) * r0 * 1.25, H * 0.52 + Math.sin(a) * r0 * 0.8); ctx.lineTo(W0 / 2 + Math.cos(a) * r1 * 1.25, H * 0.52 + Math.sin(a) * r1 * 0.8); ctx.stroke(); } ctx.restore(); }
      if (W.boostT > 0 || W.bst) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 * (W.bst ? 1 : Math.min(1, W.boostT))) + ')'; ctx.lineWidth = S(3); const cx0 = W0 / 2, cy0 = H * 0.55, mn = Math.min(W0, H); for (let q = 0; q < 30; q++) { const a = q / 30 * 6.283, r0 = mn * (0.36 + 0.1 * ((q * 7) % 5) / 5), r1 = r0 + mn * 0.24; ctx.beginPath(); ctx.moveTo(cx0 + Math.cos(a) * r0, cy0 + Math.sin(a) * r0 * 0.8); ctx.lineTo(cx0 + Math.cos(a) * r1, cy0 + Math.sin(a) * r1 * 0.8); ctx.stroke(); } ctx.restore(); }   // lignes de vitesse du turbo
      // les pseudos des pilotes a l'ecran et le premier
      const cam = g.camera, cpos = cam.position;
      const named = W.bots.filter((b) => b.m && b.m.visible).map((b) => ({ b, dd: cpos.distanceTo(b.m.position) })).filter((o) => o.dd > 9 && o.dd < 110).sort((x, y) => x.dd - y.dd).slice(0, 2).map((o) => o.b);
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
      if (performance.now() - R.penT < 1500) UI.text(ctx, '+' + (R.penAmt || 2.5) + ' S', cx, H * 0.3, S(96), '#FF5A4A', { outline: true });
      else if (W && W.boostT > 0) UI.text(ctx, 'TURBO !', cx, H * 0.3, S(78), '#7CFF6A', { outline: true });
    }
  };

  // ---------------------------------------------------------------- accueil : le hangar, START au milieu, une fleche de chaque cote

  // ---------------------------------------------------------------- affiches des cartes (une image par carte) + enchainement sans menu : roulette de cartes, puis 3-2-1-GO sur la plateforme
  const MAP_NAMES = { arch: 'ARCHIPEL', range: "TERRAIN D'ESSAI", jungle: 'JUNGLE', ice: 'GLACE', desert: 'DESERT', factory: 'USINE' };
  const POSTERS = {};
  const mapPoster = (map) => POSTERS[map] || (POSTERS[map] = (() => {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 200; const c = cv.getContext('2d');
    const sk = { arch: ['#62b8ff', '#ffd9f0'], range: ['#62b8ff', '#e4f5ff'], jungle: ['#62b8ff', '#d8f5c8'], ice: ['#8fd0ff', '#f4fbff'], desert: ['#ff9a5a', '#ffe6a8'], factory: ['#7ea0c8', '#dfe6ee'] }[map] || ['#62b8ff', '#e4f5ff'];
    const gr = c.createLinearGradient(0, 0, 0, 200); gr.addColorStop(0, sk[0]); gr.addColorStop(1, sk[1]); c.fillStyle = gr; c.fillRect(0, 0, 320, 200);
    const ell = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.283); c.fill(); }, tri = (x, y, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x, y - h); c.closePath(); c.fill(); }, rect = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    for (const [x, y, r] of [[60, 40, 22], [90, 46, 16], [250, 30, 20], [280, 38, 14]]) ell(x, y, r * 1.6, r * 0.7, 'rgba(255,255,255,0.8)');
    rect(0, 150, 320, 50, '#3fc6dc'); ell(160, 156, 150, 26, ({ arch: '#ff6fae', range: '#4b5059', jungle: '#8a6a40', ice: '#e8f6ff', desert: '#e9c47e', factory: '#8b95a3' })[map] || '#ff6fae');
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(130, 190); c.lineTo(190, 190); c.lineTo(172, 132); c.lineTo(148, 132); c.closePath(); c.fill();
    if (map === 'arch') { for (const [x, y, col] of [[70, 86, '#ff4f9a'], [240, 74, '#2f8cff']]) { ell(x, y, 20, 24, col); rect(x - 5, y + 24, 10, 7, '#8a6238'); } for (let k = 0; k < 6; k++) { ell(30 + k * 52, 150, 12, 6, k % 2 ? '#ffffff' : '#ff4f9a'); } }
    else if (map === 'range') { rect(20, 104, 74, 38, '#7f8666'); rect(20, 104, 74, 6, '#d9a21b'); rect(40, 120, 34, 22, '#2f3a24'); ell(250, 70, 42, 14, '#a9b0aa'); rect(240, 82, 20, 6, '#4a5160'); }
    else if (map === 'jungle') { for (const [x, h] of [[40, 40], [86, 30], [240, 44], [284, 32]]) { rect(x - 3, 150 - h, 7, h, '#6b4a2a'); ell(x, 150 - h - 6, 20, 16, '#3f9a44'); ell(x + 8, 150 - h - 12, 12, 10, '#58b04a'); } ell(160, 60, 26, 7, '#8a6a4a'); ell(160, 54, 26, 6, '#5f9e3c'); }
    else if (map === 'ice') { for (const x of [36, 80, 250, 290]) { tri(x, 150, 34, 30, '#3b8fae'); tri(x, 134, 26, 24, '#2f7a96'); tri(x, 124, 14, 12, '#ffffff'); } for (const x of [100, 150, 200]) tri(x, 40, 16, -30, '#cdeeff'); }
    else if (map === 'desert') { ell(260, 46, 22, 22, '#fff2c4'); tri(70, 150, 90, 70, '#d9a55b'); tri(70, 150, 40, 70, '#e8c27a'); rect(250, 112, 8, 38, '#3f9a5a'); rect(238, 124, 24, 6, '#3f9a5a'); rect(238, 116, 6, 12, '#3f9a5a'); }
    else if (map === 'factory') { rect(30, 92, 22, 56, '#7c8696'); rect(30, 100, 22, 7, '#f0b429'); rect(66, 106, 20, 42, '#6f7a88'); rect(66, 112, 20, 6, '#f0b429'); for (const [x, y, r] of [[40, 80, 12], [48, 66, 16], [44, 50, 12]]) ell(x, y, r, r * 0.8, 'rgba(240,243,248,0.85)'); c.strokeStyle = '#f0b429'; c.lineWidth = 7; c.beginPath(); c.arc(250, 92, 30, 0, 6.283); c.stroke(); for (let k = 0; k < 4; k++) { const a = k * 0.785; c.beginPath(); c.moveTo(250 + Math.cos(a) * 30, 92 + Math.sin(a) * 30); c.lineTo(250 - Math.cos(a) * 30, 92 - Math.sin(a) * 30); c.stroke(); } }
    c.lineWidth = 8; c.strokeStyle = 'rgba(255,255,255,0.0)'; return cv; })());
  E.mapPoster = mapPoster; E.mapName = (m) => MAP_NAMES[m || 'arch'] || 'CARTE';
  let _cd = null;
  const beginCd = (g) => {   // roulette de cartes (image + nom), puis 3-2-1-GO ; la fusee attend sur la plateforme, pas de retour au menu
    if (_cd) return; const target = cur().map || 'arch', order = Object.keys(MAP_NAMES).filter((m) => m !== target); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; } order.push(target);
    const el = document.createElement('div'); el.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,10,28,0.74);color:#fff;text-align:center;font-family:'Lilita One','Russo One',Arial,sans-serif;user-select:none";
    el.innerHTML = '<div id="cdTop" style="font-size:5vh;color:#ffd23a;letter-spacing:2px"></div><canvas id="cdPoster" width="320" height="200" style="width:min(70vw,64vh);border:5px solid #fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.5);margin:1.5vh 0"></canvas><div id="cdName" style="font-size:8vh;text-shadow:0 4px 0 #0b0d12"></div><div id="cdNum" style="font-size:20vh;color:#ffd23a;text-shadow:0 6px 0 #0b0d12;height:1.1em;line-height:1.1"></div><div id="cdSkip" style="position:absolute;right:3vw;bottom:3vh;font-size:min(4vw,22px);opacity:.8;border:3px solid #fff;border-radius:14px;padding:6px 16px;cursor:pointer">PASSER</div>';
    document.body.appendChild(el); const $ = (id) => el.querySelector('#' + id), cvp = $('cdPoster').getContext('2d'); let t0 = performance.now(), went = false, last = -1;
    _cd = { el }; $('cdSkip').onclick = () => { t0 = Math.min(t0, performance.now() - 3000); };
    $('cdTop').textContent = 'MANCHE ' + R.round + ' / 3';
    const tick = () => { if (!_cd) return; const t = (performance.now() - t0) / 1000;
      if (t < 2.0) { const iv = 0.09 + 0.2 * (t / 2) * (t / 2), idx = Math.min(order.length - 1, Math.floor(t / iv)) % order.length, m = t > 1.9 ? target : order[idx]; cvp.drawImage(mapPoster(m), 0, 0); $('cdName').textContent = MAP_NAMES[m]; $('cdNum').textContent = ''; }
      else if (t < 3.0) { cvp.drawImage(mapPoster(target), 0, 0); $('cdName').textContent = MAP_NAMES[target]; $('cdName').style.color = '#ffd23a'; $('cdNum').textContent = ''; }
      else { cvp.drawImage(mapPoster(target), 0, 0); const n = t < 4 ? 3 : t < 5 ? 2 : t < 6 ? 1 : 0, ph = (t - 3) % 1; $('cdNum').textContent = n ? String(n) : 'GO !'; $('cdNum').style.transform = 'scale(' + (1.25 - 0.25 * Math.min(1, ph * 3)) + ')'; if (n !== last) { last = n; try { g.audio.play(n ? 'padArm' : 'target'); } catch (e) { /* son */ } }
        if (t >= 6 && !went) { went = true; g._cdGo = true; startRun(g); } }
      if (t > 6.5) { try { el.remove(); } catch (e) { /* ignore */ } _cd = null; return; } requestAnimationFrame(tick); };
    requestAnimationFrame(tick); };
  const startRun = (g) => { if (!(g.state === 'MENU' && !g.evoAim && !g.evoAnim)) return; if (RACE && !g._cdGo && !/[?&](ap|nocd)=1/.test(location.search)) { beginCd(g); return; } g._cdGo = false; E.start(g); };
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
      ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'CONTINUER'); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => { if (L.pack) { w.stage = 'pack'; w.t0 = performance.now(); } else goNext(g); });
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
