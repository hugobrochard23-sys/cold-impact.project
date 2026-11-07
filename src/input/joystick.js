/* v267 : MINI JOYSTICK (EVO), au doigt comme a la souris. Le grand cercle se pose la ou on appuie ; la petite boule suit le doigt (dans les limites du grand cercle).
 * Plus la boule s'eloigne du centre, plus la fusee tourne vite dans cette direction (haut = monte, droite = tourne a droite). Les fleches du clavier ne servent plus. */
(function () {
  const J = CC.Joy = { on: false, ax: 0, ay: 0, kx: 0, ky: 0, fade: 0 };
  // v351 : sur ORDINATEUR (souris / pave tactile) le mini joystick est de retour, avec les reglages d'avant (v267-v272) : clic = le joystick se pose sous le curseur, glisser = la fusee tourne (plus on s'eloigne, plus vite), relacher = elle garde son cap. Comme le doigt sur mobile. ?mouse=aim rend l'ancien pilotage au curseur.
  const evo = () => J.stick();
  J.stick = () => !(CC.Touch && CC.Touch.active) && !!(CC.EVO && CC.EVO.on) && !/[?&]mouse=aim/.test(location.search);
  const R = () => Math.max(46, Math.min(84, 0.145 * Math.min(window.innerWidth, window.innerHeight)));   // rayon du grand cercle (px ecran)
  J.begin = (x, y) => { J.held = 0; J.on = true; J.ax = J.kx = x; J.ay = J.ky = y; J.fade = 1; };
  J.move = (x, y) => { if (!J.on) return; const r = R(), dx = x - J.ax, dy = y - J.ay, l = Math.hypot(dx, dy); if (l > r) { J.kx = J.ax + dx / l * r; J.ky = J.ay + dy / l * r; } else { J.kx = x; J.ky = y; } };
  J.end = () => { J.on = false; };
  // vitesse de rotation (rad/s) a pleine deflexion, avant reglage de sensibilite
  const RATE = 1.3;   // v268 : beaucoup moins sensible : un petit coup de doigt ne fait presque rien, il faut maintenir pour que la fusee tourne
  J.apply = (dt, input, game) => {
    if (!J.on || !evo() || game.state !== 'FLIGHT' || game.paused) return;
    const r = R(); let nx = (J.kx - J.ax) / r, ny = (J.ky - J.ay) / r; const m = Math.hypot(nx, ny);
    if (m < 0.08) { J.held = 0; return; }
    J.held = (J.held || 0) + dt; const ramp = 0.65 + 0.35 * Math.min(1, J.held / 0.4);   // la rotation monte doucement pendant la 1re seconde
    const k = ramp * Math.pow((m - 0.08) / 0.92, 1.2) / m, sens = [0.7, 1, 1.4][game.settings.touchSens !== undefined ? game.settings.touchSens : 1] * (game.settings.invertY ? 1 : 1);
    input.addAim(-nx * k * RATE * sens * dt, -ny * k * RATE * sens * dt * (game.settings.invertY ? -1 : 1));   // v272 : haut et bas exactement a la meme vitesse
  };
  J.draw = (ctx, game, ui) => {
    if (!evo() || game.state !== 'FLIGHT') { J.on = false; return; }
    J.fade += ((J.on ? 1 : 0) - J.fade) * 0.25; if (J.fade < 0.02) return;
    const inp = game.input, el = inp.el, rc = el.getBoundingClientRect(), sc = el.width / rc.width, a = inp.uiCoords(J.ax, J.ay), kn = inp.uiCoords(J.kx, J.ky), R0 = R() * sc;
    ctx.save(); ctx.globalAlpha = J.fade;
    ctx.beginPath(); ctx.arc(a.x, a.y, R0, 0, 6.2832); ctx.lineWidth = Math.max(2, R0 * 0.035); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();   // contour blanc a 50 %, interieur vide
    ctx.beginPath(); ctx.arc(kn.x, kn.y, R0 * 0.34, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill();   // petite boule blanche opaque
    ctx.restore();
  };
  // souris (PC) : appui = pose du joystick ; plus de verrouillage du pointeur
  document.addEventListener('mousedown', (e) => {
    const g = CC.game; if (!g || e.button !== 0 || !evo() || (CC.Touch && CC.Touch.active) || g.state !== 'FLIGHT' || g.paused || g.ui.overlay) return;
    J.begin(e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', (e) => { if (J.on && !(CC.Touch && CC.Touch.active)) J.move(e.clientX, e.clientY); });
  window.addEventListener('mouseup', (e) => { if (e.button === 0 && !(CC.Touch && CC.Touch.active)) J.end(); });

  /* v340 : PILOTAGE A LA SOURIS (ordinateur, mode EVO), refait : la fusee VISE le point de l'ecran ou se trouve le curseur. L'ecart entre le curseur et le centre de l'ecran est converti
   * en vrai angle de vue (champ de vision de la camera) : on pointe un ennemi a l'ecran, la fusee tourne pour l'amener au centre, d'autant plus vite que l'angle est grand
   * (curseur au centre = cap garde). Plus d'anneau ni de trait : un petit viseur suit le curseur. Aucun verrouillage du pointeur (marche dans l'iframe d'un portail) ; si la
   * souris quitte la fenetre la commande s'arrete. Clic gauche maintenu ou Espace = boost. Les fleches / WASD restent possibles en plus. */
  const D = J.desk = { x: 0, y: 0, in: false, boost: false, held: 0, t: 0 };
  const YAWMAX = 0.82, PITMAX = 0.66, REACHX = 0.56, REACHY = 0.54, CURVE = 1.3, DZ = 0.05, FOLLOW = 6, MAXR = 2.1;   // v342 : grands gestes de poignet, pas de precision : cap max (rad) atteint a 62 % / 60 % du demi-ecran, courbe douce au centre (CURVE), virage plafonne (MAXR rad/s) et qui s'adoucit en arrivant (FOLLOW)
  D.ok = (g) => !(CC.Touch && CC.Touch.active) && !!(CC.EVO && CC.EVO.on) && g.state === 'FLIGHT' && !g.paused && !g.ui.overlay;
  D.lang = () => (CC.I18n && CC.I18n.lang === 'fr') ? 'fr' : 'en';
  const _e = new THREE.Euler();
  D.apply = (dt, input, game) => {
    if (!D.ok(game) || J.stick()) { D.fly = 0; return; }
    D.fly = (D.fly || 0) + dt;
    const k = input.keys, run = game.endlessRun, r = input.el.getBoundingClientRect(), cam = game.camera;
    if (!D.in || !run || !run.T || !cam || !r.width || !r.height || k.ArrowLeft || k.ArrowRight || k.ArrowUp || k.ArrowDown || k.KeyA || k.KeyD || k.KeyW || k.KeyS || k.KeyQ || k.KeyZ) return;   // clavier utilise : la souris se tait
    // cap de reference : vers un point de la route un peu devant (la fusee rejoint toujours la piste, comme le pilote automatique du banc de test) ; curseur au centre = on suit la route
    const T = run.T, rk = game.rocket, dd = run.dist + Math.max(48, rk.speed * 1.0), pt = T.at(dd, T.laneX(dd), T.laneY(dd) + 1.5), fx = pt[0] - rk.pos.x, fy = pt[1] - rk.pos.y, fz = pt[2] - rk.pos.z, fl = Math.hypot(fx, fy, fz) || 1;
    const t0 = T.at(run.dist, T.laneX(run.dist), 0), t1 = T.at(run.dist + 40, T.laneX(run.dist + 40), 0), ty = Math.atan2(-(t1[0] - t0[0]), -(t1[2] - t0[2])), py = Math.atan2(-fx, -fz);
    const ry = ty + 0.15 * Math.atan2(Math.sin(py - ty), Math.cos(py - ty)), rp = Math.asin(Math.max(-0.97, Math.min(0.97, fy / fl)));   // cap lateral : surtout le sens de la route (rappel leger vers la piste) ; hauteur : vers la piste
    // curseur -> ecart de cap (en angle de vue : le centre = cap de la route)
    const tv = Math.tan(cam.fov * Math.PI / 360), th = tv * (r.width / r.height);
    const nx = Math.max(-1, Math.min(1, (D.x - (r.left + r.width / 2)) / (r.width / 2) / REACHX)), ny = Math.max(-1, Math.min(1, (D.y - (r.top + r.height / 2)) / (r.height / 2) / REACHY));   // v341 : cap max atteint a 40 % (horizontal) / 38 % (vertical) du demi-ecran : un petit geste suffit
    const sens = [0.8, 1, 1.3][game.settings.touchSens !== undefined ? game.settings.touchSens : 1], on = Math.min(1, D.fly / 0.6), ease = on * on * (3 - 2 * on);   // les 0,6 premieres secondes : on garde le cap
    const dz = (v) => { const a = Math.abs(v); return a < DZ ? 0 : Math.sign(v) * Math.pow((a - DZ) / (1 - DZ), CURVE); }, sx = dz(nx), sy = dz(ny);   // zone morte au centre + courbe progressive : doux pres du centre, plus net vers les bords
    const wy = ry - sx * YAWMAX * sens * ease, wp = Math.max(-1.2, Math.min(1.2, rp - sy * PITMAX * sens * ease * (game.settings.invertY ? -1 : 1)));
    _e.setFromQuaternion(input.aimQ, 'YXZ'); let cy = _e.y, cp = _e.x;
    let ey = wy - cy; ey = Math.atan2(Math.sin(ey), Math.cos(ey)); const ep = wp - cp, m = Math.hypot(ey, ep) || 1e-6;
    const step = Math.min(m, Math.min(MAXR, m * FOLLOW) * dt), q = step / m;
    input.setAim(cy + ey * q, cp + ep * q);
  };
  D.draw = (ctx, game, ui) => {
    const on = D.ok(game);
    try { const cur = on && !J.stick() ? 'none' : ''; if (D.cur !== cur) { D.cur = cur; document.documentElement.style.cursor = cur; } } catch (e) { /* ignore */ }
    if (!on) { D.t = 0; return; }
    D.t += 1 / 60; const inp = game.input, rc = inp.el.getBoundingClientRect(), sc = inp.el.width / rc.width, fade = Math.min(1, D.t / 0.3);
    if (D.in && !J.stick()) {   // petit viseur au curseur (jaune quand le boost est tenu)
      const c = inp.uiCoords(D.x, D.y), r0 = Math.max(9, inp.el.height * 0.016), col = D.boost ? '#ffd04a' : '#ffffff';
      ctx.save(); ctx.globalAlpha = 0.9 * fade; ctx.lineWidth = Math.max(2, r0 * 0.2); ctx.strokeStyle = col; ctx.shadowColor = 'rgba(8,24,56,0.8)'; ctx.shadowBlur = r0 * 0.4;
      ctx.beginPath(); ctx.arc(c.x, c.y, r0, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x - r0 * 1.7, c.y); ctx.lineTo(c.x - r0 * 0.55, c.y); ctx.moveTo(c.x + r0 * 0.55, c.y); ctx.lineTo(c.x + r0 * 1.7, c.y); ctx.moveTo(c.x, c.y - r0 * 1.7); ctx.lineTo(c.x, c.y - r0 * 0.55); ctx.moveTo(c.x, c.y + r0 * 0.55); ctx.lineTo(c.x, c.y + r0 * 1.7); ctx.stroke();
      ctx.restore();
    }
    // v344 : tutoriel PC sans phrases : au tout premier vol le jeu s'arrete, une grande fleche transparente monte en boucle ; la fusee repart des que le joueur bouge la souris / touche une fleche
    if (D.th) {
      const W = ctx.canvas.width, H = ctx.canvas.height, p = (D.tt * 0.8) % 1, fr = D.lang() === 'fr', sz = H * 0.1, UI = CC.UI2;
      ctx.save(); ctx.fillStyle = 'rgba(6,14,30,0.3)'; ctx.fillRect(0, 0, W, H);
      { const cx = W / 2, cy = H * 0.7 - p * H * 0.32; ctx.globalAlpha = Math.sin(Math.PI * p) * 0.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(cx, cy - sz); ctx.lineTo(cx + sz * 0.85, cy + sz * 0.1); ctx.lineTo(cx + sz * 0.32, cy + sz * 0.1); ctx.lineTo(cx + sz * 0.32, cy + sz * 0.8); ctx.lineTo(cx - sz * 0.32, cy + sz * 0.8); ctx.lineTo(cx - sz * 0.32, cy + sz * 0.1); ctx.lineTo(cx - sz * 0.85, cy + sz * 0.1); ctx.closePath(); ctx.fill(); }   // une seule fleche blanche, sans contour, transparente, qui monte en boucle
      ctx.globalAlpha = 1; const px = Math.max(20, Math.round(H * 0.05)), kw = px * 1.7, ky = H * 0.9, lab = J.stick() ? (fr ? 'CLIC' : 'CLICK') : (fr ? 'SOURIS' : 'MOUSE'), ou = fr ? 'OU' : 'OR' + String.fromCharCode(8203), gap = px * 0.8;
      const w1 = UI.tw(ctx, lab, px), w2 = UI.tw(ctx, ou, px), tot = w1 + w2 + kw + gap * 2, x0 = W / 2 - tot / 2, kx = x0 + w1 + gap + w2 + gap, kt = ky - kw / 2, d = kw * 0.16, r = kw * 0.2;
      UI.outlined(ctx, lab, x0 + w1 / 2, ky, px, '#FFFFFF'); UI.outlined(ctx, ou, x0 + w1 + gap + w2 / 2, ky, px, '#FFFFFF');
      const rr = (x, y, w, h, q) => { ctx.beginPath(); ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q); ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath(); };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = d * 1.2; ctx.shadowOffsetY = d * 0.8; rr(kx, kt + d, kw, kw, r); ctx.fillStyle = '#6a7384'; ctx.fill(); ctx.restore();   // epaisseur de la touche (relief) + ombre portee
      rr(kx, kt + d * 0.5, kw, kw, r); ctx.fillStyle = '#8f98aa'; ctx.fill(); ctx.lineWidth = kw * 0.025; ctx.strokeStyle = '#3d4455'; ctx.stroke();
      { const g = ctx.createLinearGradient(0, kt, 0, kt + kw * 0.9); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd5e1'); rr(kx + kw * 0.06, kt + kw * 0.04, kw * 0.88, kw * 0.84, r * 0.8); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = kw * 0.02; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke(); }   // dessus de la touche, plus clair
      { const cx = kx + kw / 2, cy = kt + kw * 0.46, s = kw * 0.2; ctx.fillStyle = '#2b3347'; ctx.beginPath(); ctx.moveTo(cx, cy - s * 1.3); ctx.lineTo(cx + s * 1.1, cy - s * 0.1); ctx.lineTo(cx + s * 0.4, cy - s * 0.1); ctx.lineTo(cx + s * 0.4, cy + s * 1.2); ctx.lineTo(cx - s * 0.4, cy + s * 1.2); ctx.lineTo(cx - s * 0.4, cy - s * 0.1); ctx.lineTo(cx - s * 1.1, cy - s * 0.1); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  };
  // gel du tout premier vol (PC / portail) : appele par game.js avant la simulation ; renvoie vrai tant que le joueur n'a pas bouge
  D.tutHold = (g, dt) => {
    const E = CC.EVO, S = E && E.save ? E.save(g) : null;
    if (!S || S.tutPC || !(E.fast && E.fast()) || (CC.Touch && CC.Touch.active) || g.state !== 'FLIGHT' || g.paused || g.ui.overlay) { D.th = false; return false; }
    D.tt = (D.tt || 0) + dt; const k = g.input.keys;
    if (!D.th) { if (g.flightTime > 0.9 && !D.thDone) { D.th = true; if (CC.Stats) CC.Stats.log("tutorial_shown"); D.mx0 = null; D.mv = 0; D.tt = 0; } else return false; }
    if (D.tt < 1.3) { D.mv = 0; D.mx0 = D.in ? D.x : null; D.my0 = D.in ? D.y : null; return true; }   // v347 : pause minimale de 1,3 s : un joueur qui bougeait deja la souris voit quand meme la consigne ; seuls les gestes APRES ce delai comptent
    if (D.mx0 == null && D.in) { D.mx0 = D.x; D.my0 = D.y; }
    const moved = !J.stick() && ((D.in && D.mx0 != null && Math.hypot(D.x - D.mx0, D.y - D.my0) > 45) || (D.mv || 0) > 60), key = k.ArrowLeft || k.ArrowRight || k.ArrowUp || k.ArrowDown || k.KeyA || k.KeyD || k.KeyW || k.KeyS || k.KeyQ || k.KeyZ || k.Space;
    if (moved || key || D.boost) { D.th = false; D.thDone = true; S.tutPC = 1; g.writeSave(); if (CC.Stats) CC.Stats.log("tutorial_completed", { sec: Math.round(D.tt * 10) / 10 }); if (g.audio) g.audio.play('card'); return false; }
    return true;
  };
  document.addEventListener('mousemove', (e) => { D.x = e.clientX; D.y = e.clientY; D.in = true; if (D.th) D.mv = (D.mv || 0) + Math.hypot(e.movementX || 0, e.movementY || 0); });   // v345 : le tuto compte le mouvement reel de la souris (meme si elle n'etait pas encore dans la fenetre)
  document.addEventListener('mousedown', (e) => { const g = CC.game; if (g && e.button === 0 && D.ok(g)) D.boost = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) D.boost = false; });
  window.addEventListener('blur', () => { D.boost = false; D.in = false; });
  document.documentElement.addEventListener('mouseleave', () => { D.in = false; D.boost = false; });   // souris sortie de la fenetre / de l'iframe : plus de commande
  setInterval(() => { const g = CC.game; if (g && g.state !== 'FLIGHT') { D.counted = false; D.boost = false; D.th = false; D.thDone = false; } }, 500);
})();
