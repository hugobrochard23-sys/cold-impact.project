/* v267 : MINI JOYSTICK (EVO), au doigt comme a la souris. Le grand cercle se pose la ou on appuie ; la petite boule suit le doigt (dans les limites du grand cercle).
 * Plus la boule s'eloigne du centre, plus la fusee tourne vite dans cette direction (haut = monte, droite = tourne a droite). Les fleches du clavier ne servent plus. */
(function () {
  const J = CC.Joy = { on: false, ax: 0, ay: 0, kx: 0, ky: 0, fade: 0 };
  const evo = () => false;   // v273 : joystick desactive (retour au glisse d'avant)
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

  /* v339 : PILOTAGE AU CURSEUR (ordinateur, mode EVO). Le curseur par rapport au CENTRE de l'ecran dirige la fusee, comme un joystick : curseur au centre = on garde le cap,
   * a droite = elle tourne a droite, en haut = elle monte ; plus il s'eloigne, plus elle tourne vite. Aucun verrouillage du pointeur (pas de curseur piege, marche dans un iframe
   * de portail). Clic gauche maintenu ou Espace = boost. Les fleches / WASD restent possibles en plus. Un anneau et un point montrent la commande. */
  const D = J.desk = { x: 0, y: 0, in: false, boost: false, held: 0, t: 0 };
  const DRATE = 1.9, DZ = 0.07;   // rad/s a pleine deflexion ; zone morte (part du rayon)
  D.ok = (g) => !(CC.Touch && CC.Touch.active) && !!(CC.EVO && CC.EVO.on) && g.state === 'FLIGHT' && !g.paused && !g.ui.overlay;
  D.lang = () => (CC.I18n && CC.I18n.lang === 'fr') ? 'fr' : 'en';
  const geom = (input) => { const r = input.el.getBoundingClientRect(); return { r, cx: r.left + r.width / 2, cy: r.top + r.height / 2, R: Math.min(r.width, r.height) * 0.3 }; };
  D.apply = (dt, input, game) => {
    if (!D.in || !D.ok(game)) { D.held = 0; return; }
    const G = geom(input), nx = (D.x - G.cx) / G.R, ny = (D.y - G.cy) / G.R, m = Math.hypot(nx, ny);
    if (m < DZ) { D.held = 0; return; }
    D.held += dt; const ramp = 0.6 + 0.4 * Math.min(1, D.held / 0.35), mag = Math.pow((Math.min(1, m) - DZ) / (1 - DZ), 1.3) * ramp;
    const sens = [0.7, 1, 1.4][game.settings.touchSens !== undefined ? game.settings.touchSens : 1];
    input.addAim(-(nx / m) * mag * DRATE * sens * dt, -(ny / m) * mag * DRATE * sens * dt * (game.settings.invertY ? -1 : 1));
  };
  D.draw = (ctx, game, ui) => {
    if (!D.ok(game)) { D.t = 0; return; }
    D.t += 1 / 60; const inp = game.input, rc = inp.el.getBoundingClientRect(), sc = inp.el.width / rc.width, G = geom(inp), c = inp.uiCoords(G.cx, G.cy), R0 = G.R * sc;
    const cur = D.in ? inp.uiCoords(D.x, D.y) : c, fade = Math.min(1, D.t / 0.4);
    ctx.save(); ctx.globalAlpha = 0.55 * fade;
    ctx.beginPath(); ctx.arc(c.x, c.y, R0, 0, 6.2832); ctx.lineWidth = Math.max(2, R0 * 0.02); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([R0 * 0.05, R0 * 0.07]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(3, R0 * 0.025), 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    if (D.in) { ctx.globalAlpha = 0.75 * fade; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(cur.x, cur.y); ctx.lineWidth = Math.max(2, R0 * 0.02); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cur.x, cur.y, Math.max(6, R0 * 0.07), 0, 6.2832); ctx.fillStyle = D.boost ? '#ffd04a' : '#ffffff'; ctx.fill(); }
    ctx.restore();
    // consigne : les premieres secondes des 3 premiers vols
    let n = 0; try { n = parseInt(localStorage.getItem('coldimpact.deskHint') || '0', 10) || 0; } catch (e) { /* ignore */ }
    if (n < 3 || D.counted === 'again') {
      if (!D.counted) { D.counted = true; try { localStorage.setItem('coldimpact.deskHint', String(n + 1)); } catch (e) { /* ignore */ } }
      const a = D.t < 8 ? Math.min(1, D.t / 0.4) * Math.min(1, (8 - D.t) / 0.6) : 0;
      if (a > 0) {
        const fr = D.lang() === 'fr', l1 = fr ? 'BOUGE LA SOURIS POUR DIRIGER' : 'MOVE THE MOUSE TO STEER', l2 = fr ? 'CLIC MAINTENU OU ESPACE = BOOST' : 'HOLD CLICK OR SPACE = BOOST', W = ctx.canvas.width, H = ctx.canvas.height, px = Math.max(16, Math.round(H * 0.034));
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 ' + px + 'px system-ui, sans-serif'; ctx.lineWidth = px * 0.22; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,24,56,0.9)'; ctx.fillStyle = '#ffffff';
        const y1 = H * 0.78; ctx.strokeText(l1, W / 2, y1); ctx.fillText(l1, W / 2, y1); ctx.fillStyle = '#ffd04a'; ctx.strokeText(l2, W / 2, y1 + px * 1.5); ctx.fillText(l2, W / 2, y1 + px * 1.5); ctx.restore();
      }
    }
  };
  document.addEventListener('mousemove', (e) => { D.x = e.clientX; D.y = e.clientY; D.in = true; });
  document.addEventListener('mousedown', (e) => { const g = CC.game; if (g && e.button === 0 && D.ok(g)) D.boost = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) D.boost = false; });
  window.addEventListener('blur', () => { D.boost = false; });
  setInterval(() => { const g = CC.game; if (g && g.state !== 'FLIGHT') { D.counted = false; D.boost = false; } }, 500);
})();
