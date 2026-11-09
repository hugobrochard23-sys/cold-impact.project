/* v362 : trois MVP de niveau court (?mvp=a|b|c), tous sur la prairie penchee de evo_short.js, avec :
 *  - camera TOUJOURS identique (elle ne s'incline plus quand la fusee pique) ;
 *  - carburant illimite, aucune jauge a surveiller ;
 *  - relance immediate apres un echec ou une victoire (pas de rapport, pas de menu, pas de barre de lancement).
 * a = CURSEUR : la fusee avance seule et va vers le point de l'ecran ou se trouve le curseur (fleches au clavier, doigt sur telephone).
 * b = MAINTENIR : Espace / clic / doigt maintenu = la fusee monte, relache = elle descend ; camera de cote.
 * c = VOL LIBRE simplifie : le vol habituel (fleches / souris), mais camera fixe et carburant illimite. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const mm = /[?&]mvp=([abc])/.exec(location.search), M = mm ? mm[1] : (/^[abc]$/.test(window.CC_MVP || '') ? window.CC_MVP : null);
  E.mvp = () => M;
  if (!M) return;
  const T3 = THREE, V = T3.Vector3, U = CC.U;
  const SPEED = 46;
  CC.CONFIG.physics.gravity = 0;   // la fusee est pilotee directement (vitesse imposee) pour a et b
  if (M === 'c') CC.CONFIG.physics.gravity = 9;
  // carburant illimite, jamais "en panne"
  const _rk = E.rocket;
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };
  // ---- entrees : curseur / fleches / maintien ----
  const I = { cx: 0, cy: 0.5, hold: false, mouse: false, k: {} };
  const setC = (x, y) => { I.cx = x / window.innerWidth * 2 - 1; I.cy = y / window.innerHeight; I.mouse = true; };
  window.addEventListener('mousemove', (e) => setC(e.clientX, e.clientY));
  window.addEventListener('mousedown', (e) => { if (e.button === 0) { I.hold = true; setC(e.clientX, e.clientY); } });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) I.hold = false; });
  window.addEventListener('touchstart', (e) => { I.hold = true; const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend', (e) => { if (!e.touches.length) I.hold = false; }, { passive: true });
  window.addEventListener('keydown', (e) => { I.k[e.code] = 1; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') I.hold = true; });
  window.addEventListener('keyup', (e) => { I.k[e.code] = 0; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') I.hold = false; });
  E.mvpInput = I;
  // ---- vecteurs de travail ----
  const tf = new V(), nn = new V(), cc = new V(), ray = new V(), org = new V(), tmp = new V();
  const frame = (T, d) => {
    const a = T.at(d, 0, 0), b = T.at(d + 6, 0, 0), c1 = T.at(d, 1, 0);
    tf.set(b[0] - a[0], 0, b[2] - a[2]); if (tf.lengthSq() < 1e-6) tf.set(0, 0, -1); tf.normalize();
    nn.set(c1[0] - a[0], 0, c1[2] - a[2]).normalize(); cc.set(a[0], a[1], a[2]);
  };
  // ---- camera fixe ----
  const camP = new V(), camL = new V();
  E.mvpCam = (rig, rk, cam, dt) => {
    const g = rig.game, run = g.endlessRun; if (!run || !run.T) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const k = Math.min(1, (dt || 0.016) * 9);
    if (M === 'a') {   // derriere, centree sur la piste : la fusee bouge a l'ecran selon le curseur
      const gy = T.base(d), p = T.at(Math.max(0, d - 26), 0, 0);
      camP.set(p[0], T.base(Math.max(0, d - 26)) + 19, p[2]); const q = T.at(d + 34, 0, 0); camL.set(q[0], T.base(d + 34) + 1, q[2]);
      if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
      rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml); return;
    }
    if (M === 'b') {   // de cote : on voit la hauteur des obstacles
      camP.copy(rk.pos).addScaledVector(nn, -22).addScaledVector(tf, 3); camP.y = rk.pos.y + 3; camL.copy(rk.pos).addScaledVector(tf, 12); camL.y = rk.pos.y;
    } else {   // c : derriere la fusee, toujours la meme vue
      camP.copy(rk.pos).addScaledVector(tf, -11); camP.y = rk.pos.y + 4.6; camL.copy(rk.pos).addScaledVector(tf, 26); camL.y = rk.pos.y + 0.6;
    }
    if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
    rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
  };
  // ---- pilotage direct de la fusee (a et b) ----
  const drive = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk.active || g.state !== 'FLIGHT' || g.evoFinish || g.flightTime < 0.35) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const gy = T.base(d), lx = tmp.copy(rk.pos).sub(cc).dot(nn);
    let vlat = 0, vy = 0;
    if (M === 'a') {
      const cam = g.camera, k = I.k;
      if (!I.mouse || k.ArrowLeft || k.ArrowRight || k.ArrowDown || k.KeyA || k.KeyD || k.KeyS) { I.cx += ((k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0)) * dt * 1.6; I.cy += ((k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0)) * dt * 1.2; I.cx = U.clamp(I.cx, -1, 1); I.cy = U.clamp(I.cy, 0.05, 0.95); if (k.ArrowUp || k.KeyW) I.mouse = false; }
      // le curseur -> un point du plan qui passe par la fusee (perpendiculaire a la piste)
      org.copy(cam.position); ray.set(I.cx, -(I.cy * 2 - 1), 0.5).unproject(cam).sub(org).normalize();
      const den = ray.dot(tf); let tx = lx, ty = rk.pos.y;
      if (Math.abs(den) > 0.05) { const t = tmp.copy(rk.pos).sub(org).dot(tf) / den; if (t > 0) { const P = tmp.copy(org).addScaledVector(ray, t); tx = P.clone().sub(cc).dot(nn); ty = P.y; } }
      tx = U.clamp(tx, -17, 17); ty = U.clamp(ty, gy + 2.2, gy + 26);
      vlat = U.clamp((tx - lx) * 3.4, -26, 26); vy = U.clamp((ty - rk.pos.y) * 3.4, -28, 28);
    } else {
      vlat = U.clamp((0 - lx) * 2, -8, 8);
      const want = I.hold ? 17 : -14; vy = rk.vel.y + (want - rk.vel.y) * Math.min(1, dt * 6);
      if (rk.pos.y < gy + 1.6 && vy < 0) { vy = 0; rk.pos.y = gy + 1.6; }
      if (rk.pos.y > gy + 40 && vy > 0) vy = 0;
    }
    rk.vel.set(tf.x * SPEED + nn.x * vlat, vy, tf.z * SPEED + nn.z * vlat);
    const dir = tmp.copy(rk.vel).normalize(), yaw = Math.atan2(-dir.x, -dir.z), pit = Math.asin(U.clamp(dir.y, -0.9, 0.9));
    g.input.setAim(yaw, pit);
  };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    if (g.rocket && g.rocket.active && g.evo) { g.rocket.fuel = g.rocket.fuelMax = 999; }
    if (M !== 'c') { try { drive(g, dt); } catch (e) { /* pilotage facultatif */ } }
    if (g.evoFinish && !g._mvT) { g._mvT = 1; CC.L1.msg(g, 'TEMPS ' + g.flightTime.toFixed(1) + ' S', 2, '#ffffff'); }
  };
  // ---- relance immediate : echec -> on repart ; victoire -> on repart aussi ----
  E.beginEnd = (g) => { E.endTumble(g); g.evoReport = false; g.evoLast = null; g.evoWin = null; g._mvT = 0; g.rig._mv = null; g.goHome({}); };
  E.onClear = (g) => {
    const S = E.save(g); S.cleared = (S.cleared || 0) + 1; try { localStorage.setItem('cc.mvp.' + M + '.wins', String(S.cleared)); } catch (e) { /* facultatif */ }
    g.evoWin = null; g.evoReport = false; g._mvT = 0; g.rig._mv = null; E.endTumble(g); g.goHome({});
  };
  // ---- lancement automatique (pas de barre, pas de tutoriel) ----
  let menuT = 0;
  setInterval(() => {
    const g = CC.game; if (!g || !g.padMode || !g.ui) return;
    try { const S = E.save(g); if (S && !S.tutPC) { S.tutPC = 1; } } catch (e) { /* ignore */ }
    if (g.state === 'MENU' && (!g.ui.overlay || g.ui.overlay === 'evo') && !g.evoAim && !g.evoAnim && !g.evoChest) { if (++menuT >= 3) { menuT = 0; E.start(g); } } else menuT = 0;
    if (g.state === 'LAUNCH' && g.evoAim && !g.evoAim.lock && g.evoAim.t > 0.35) E.lock(g);
  }, 100);
})();
