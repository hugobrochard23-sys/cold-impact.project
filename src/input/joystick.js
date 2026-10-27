/* v267 : MINI JOYSTICK (EVO), au doigt comme a la souris. Le grand cercle se pose la ou on appuie ; la petite boule suit le doigt (dans les limites du grand cercle).
 * Plus la boule s'eloigne du centre, plus la fusee tourne vite dans cette direction (haut = monte, droite = tourne a droite). Les fleches du clavier ne servent plus. */
(function () {
  const J = CC.Joy = { on: false, ax: 0, ay: 0, kx: 0, ky: 0, fade: 0 };
  const evo = () => !!(CC.EVO && CC.EVO.on);
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
    input.addAim(-nx * k * RATE * sens * dt, -ny * k * RATE * sens * dt * (game.settings.invertY ? -1 : 1) * (ny < 0 ? 1.3 : 1));   // monter (doigt vers le haut) un peu plus vif
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
})();
