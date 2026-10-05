/* v111 : TUTORIEL des niveaux 1 et 2 (tactile) — refait pour qu'on comprenne tout de suite quoi faire.
 *  - un OBJECTIF toujours visible en haut (« DETRUIS LA CIBLE », « 1 / 3 ») ;
 *  - un VISEUR rouge sur la cible la plus proche (avec la distance, sur un fond sombre : la fusée est blanche), ou une flèche au bord de l'écran si elle est hors champ ;
 *  - tout premier vol : le jeu se met en pause UNE fois, une main montre le geste « glisse pour tourner » ; dès que le joueur glisse, on joue ;
 *  - si le joueur ne bouge plus pendant 3 s : une main glisse vers la cible (aide non bloquante).
 * Chaque étape réussie est enregistrée (settings.tutStep). `?tut=1` force le tuto au banc de test. */
(function () {
  const V = THREE.Vector3, _p = new V(), _f = new V(), _d = new V();
  const T = CC.Tutorial = { hold: false, st: null };

  T.level = (g) => { const run = g.endlessRun, n = g.levelRun && g.levelRun.n; return run && run.T.levelLen && n && n <= 2 ? n : 0; };
  T.enabled = function (g) {
    if (!(CC.Touch && CC.Touch.active) && !/[?&]tut=1\b/.test(location.search)) return false;
    if (g.testMode && !/[?&]tut=1\b/.test(location.search)) return false;
    return T.level(g) > 0;
  };
  const nearest = (g) => { const rk = g.rocket; let best = null, bd = 1e9; for (const t of g.targets) { if (!t.alive || t.guard || t.boss || !t.object) continue; const d = t.object.position.distanceTo(rk.pos); if (d < bd) { bd = d; best = t; } } return best; };
  const state = () => T.st || (T.st = { t: 0, armed: false, idle: 0, aq: new THREE.Quaternion() });

  // appelé à chaque image avant la simulation ; renvoie vrai si le jeu doit rester figé
  T.update = function (g, dt) {
    const S = g.settings;
    if (!T.enabled(g) || g.state !== 'FLIGHT' || g.paused) { T.hold = false; if (!T.enabled(g)) T.st = null; return false; }
    const st = state(), tt = g.input.touch, down = !!(tt && tt.down);
    st.t += dt;
    // 1. tout premier vol : une seule pause, jusqu'à ce que le joueur ait glissé
    if (T.level(g) === 1 && (S.tutStep || 0) < 1) {
      if (!T.hold && g.flightTime > 0.9) { T.hold = true; st.armed = false; }
      if (T.hold) {
        if (!down) st.armed = true;
        else if (st.armed && (tt.dragPx || 0) > 40) { T.hold = false; S.tutStep = 1; g.writeSave(); if (g.audio) g.audio.play('card'); if (CC.Haptics) CC.Haptics.pattern('mission'); st.idle = 0; }
        return T.hold;
      }
    }
    // 2. aide non bloquante : le joueur ne bouge plus → la main montre la direction de la cible
    if (st.aq.angleTo(g.input.aimQ) > 0.012) { st.idle = 0; st.aq.copy(g.input.aimQ); } else st.idle += dt;
    T.hold = false; return false;
  };

  const hand = (ctx, x, y, r, t, ring) => {
    ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 0.95; ctx.strokeStyle = '#35ff4a'; ctx.lineWidth = Math.max(3, r * 0.18); ctx.beginPath(); ctx.arc(x, y, r * (1.25 + (ring ? ((t * 1.4) % 1) * 0.6 : 0)), 0, 6.283); ctx.stroke(); ctx.restore();
  };
  const pill = (ctx, W, H, s, y, fill, stroke, k) => {
    const F = CC.Font, px = Math.max(3, Math.round(H * 0.0052 * (k || 1))), w = Math.min(W * 0.94, F.measure(s, px) + px * 12), h = px * 22, x = W / 2 - w / 2;
    CC.Home.pill(ctx, x, y, w, h, fill, stroke); F.draw(ctx, s, W / 2, y + h * 0.3, Math.min(px, (w - px * 8) / Math.max(1, F.measure(s, 1))), '#ffffff', { align: 'center' });
    return h;
  };
  const project = (g, pos, W, H) => { const c = g.camera; _p.copy(pos); const pp = CC.Curve ? CC.Curve.apply(_p, c).project(c) : _p.project(c); return { x: (pp.x * 0.5 + 0.5) * W, y: (-pp.y * 0.5 + 0.5) * H, z: pp.z, nx: pp.x, ny: pp.y }; };

  // viseur sur la cible, ou flèche vers elle
  const marker = (ctx, W, H, g, tg, t) => {
    const r = Math.min(W, H) * 0.075, d = Math.round(tg.object.position.distanceTo(g.rocket.pos)), P = project(g, tg.object.position, W, H);
    const inFront = P.z < 1, onScreen = inFront && P.x > r && P.x < W - r && P.y > r * 2 && P.y < H - r;
    ctx.save();
    if (onScreen) {
      const pr = r * (1.0 + 0.2 * Math.sin(t * 7)); ctx.strokeStyle = '#ff3b2e'; ctx.lineWidth = r * 0.2;
      ctx.beginPath(); ctx.arc(P.x, P.y, pr, 0, 6.283); ctx.stroke(); ctx.beginPath();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(P.x + dx * pr * 1.55, P.y + dy * pr * 1.55); ctx.lineTo(P.x + dx * pr * 0.65, P.y + dy * pr * 0.65); } ctx.stroke();
      const F = CC.Font, px = Math.max(2, Math.round(H * 0.0036)), str = d + ' M', tw = F.measure(str, px), ph = px * 10, py = Math.max(H * 0.2, P.y - pr * 1.9 - ph);
      ctx.fillStyle = 'rgba(8,10,16,0.78)'; ctx.fillRect(Math.round(P.x - tw / 2 - px * 3), Math.round(py), Math.round(tw + px * 6), Math.round(ph)); ctx.strokeStyle = '#ff3b2e'; ctx.lineWidth = Math.max(2, px * 0.6); ctx.strokeRect(Math.round(P.x - tw / 2 - px * 3), Math.round(py), Math.round(tw + px * 6), Math.round(ph));
      F.draw(ctx, str, P.x, py + px * 2, px, '#ffffff', { align: 'center' });
    } else {   // flèche au bord, dans la direction de la cible (derrière → vers le bas)
      let ax = P.nx, ay = -P.ny; if (!inFront) { ax = -ax; ay = -ay; if (Math.abs(ax) < 0.05 && Math.abs(ay) < 0.05) ay = 1; }
      const m = Math.max(Math.abs(ax), Math.abs(ay), 1e-4); ax /= m; ay /= m;
      const ex = W / 2 + ax * (W / 2 - r * 1.3), ey = H * 0.5 + ay * (H * 0.5 - r * 2.6), ang = Math.atan2(ay, ax);
      ctx.translate(ex, ey); ctx.rotate(ang); ctx.fillStyle = '#ff3b2e'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.moveTo(r * 0.9, 0); ctx.lineTo(-r * 0.5, -r * 0.7); ctx.lineTo(-r * 0.2, 0); ctx.lineTo(-r * 0.5, r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    return onScreen ? P : null;
  };

  // dessin : renvoie vrai si le tutoriel prend la main sur l'ancienne aide
  T.draw = function (ctx, W, H, g) {
    if (!T.enabled(g) || g.state !== 'FLIGHT') return false;
    const st = state(), t = performance.now() / 1000, r = Math.min(W, H) * 0.075, n = T.level(g), run = g.endlessRun;
    const tg = nearest(g), total = g.levelRun.winKills || 1, done = run ? run.stats.targets : 0;
    if (g.levelWin) { pill(ctx, W, H, 'MISSION ACCOMPLIE !', H * 0.3, 'rgba(70,48,0,0.94)', '#ffd23a', 1.45); return true; }   // victoire : grand message pendant le ralenti
    pill(ctx, W, H, n === 1 ? 'MISSION : DETRUIS LA CIBLE' : 'MISSION : DETRUIS LES ' + total + ' CIBLES  ' + Math.min(done, total) + '/' + total, H * 0.13, 'rgba(60,12,10,0.92)', '#ff5a3a');
    if (T.hold) {   // pause : la main montre le geste
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      const k = Math.sin(t * 2.6), hx = W * 0.5 + k * W * 0.13, hy = H * 0.68; hand(ctx, hx, hy, r, t, false);
      ctx.save(); ctx.fillStyle = '#35ff4a'; ctx.globalAlpha = 0.85; const q = r * 0.3, d = k > 0 ? 1 : -1; for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(hx + d * (r * 1.7 + i * q * 1.4)), Math.round(hy - q / 2), Math.round(q), Math.round(q)); ctx.restore();
      pill(ctx, W, H, st.armed ? 'GLISSE POUR TOURNER' : 'POSE LE DOIGT ET GLISSE', H * 0.22, 'rgba(8,60,20,0.94)', '#56ff5a', 1.15);
      if (tg) marker(ctx, W, H, g, tg, t);
      return true;
    }
    if (tg) {
      const P = marker(ctx, W, H, g, tg, t);
      if (st.idle > 3) {   // aide : la main glisse vers la cible
        // la main fait un glissé COURT, proportionnel à l'angle à corriger (1 px de glissé ≈ 0,3° : copier la distance écran → fusée en vrille)
        const tx = P ? P.x : W * 0.5, ty = P ? P.y : H * 0.3, k = (t * 0.9) % 1, dx = tx - W * 0.5, dy = ty - H * 0.72, dl = Math.hypot(dx, dy) || 1;
        const f = _f.set(0, 0, -1).applyQuaternion(g.input.aimQ), want = _d.subVectors(tg.object.position, g.rocket.pos).normalize(), ang = f.angleTo(want);
        const css = Math.max(45, Math.min(150, ang / (CC.CONFIG.input.touch.dragGain / Math.max(1, Math.min(window.innerWidth, window.innerHeight))))), L = css * (W / Math.max(1, window.innerWidth));
        if (ang > 0.12) { hand(ctx, W * 0.5 + dx / dl * L * k, H * 0.72 + dy / dl * L * k, r * 0.9, t, false); pill(ctx, W, H, 'GLISSE VERS LA CIBLE', H * 0.22, 'rgba(8,60,20,0.94)', '#56ff5a', 1.1); }
      }
    }
    return true;
  };
})();
