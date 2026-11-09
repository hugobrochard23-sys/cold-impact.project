/* v358 : PC / portail : ce qui donne envie de continuer.
 *  - EVO.pcInfo : sur l'ecran de lancement, les ZONES A VENIR (« devant toi : le camp > la riviere ... > boss, puis l'ocean ») et l'OBJECTIF de distance ;
 *  - barre des zones en vol (bas de l'ecran) : zone en cours, prochaine zone, avancement, objectif ;
 *  - aide de visee pendant les 3 premiers vols (clavier seulement) : la fusee se redresse tres doucement vers la cible la plus proche devant elle,
 *    jamais quand le joueur appuie sur une direction : premiers coups au but, moins de departs precoces. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const U = CC.U, MS = [100, 300, 600, 1000, 1500, 2000, 2500, 3000];
  const kb = () => !!(CC.Joy && CC.Joy.kb && CC.Joy.kb());
  E.nextGoal = (g) => { const best = (E.save(g).best || 0); return MS.find((m) => m > best) || (Math.floor(best / 500) + 1) * 500; };
  const names = (n0, n) => (E.chapters || []).slice(n0, n0 + n).map((c) => c.name);
  E.pcInfo = (g, ctx, UI, cx, cw, Y, S, fr) => {
    const S0 = E.save(g); if ((S0.runs || 0) >= 12) return;
    const ch = (E.chapters || []), first = names(1, 3), lbl = fr ? 'DEVANT TOI' : 'AHEAD', sep = '  ›  ';
    const goal = (fr ? 'OBJECTIF : ' : 'GOAL: ') + E.nextGoal(g) + ' M', y0 = Y(0.13);
    ctx.save();
    if (ch.length) { const t = (first.length ? first.join(sep) + sep + '...' + sep : '') + (fr ? 'LE BOSS' : 'THE BOSS') + (E.isS2 && E.isS2() ? '' : (fr ? '  ›  PUIS L OCEAN' : '  ›  THEN THE OCEAN')); UI.outlined(ctx, lbl, cx, y0, UI.fit(ctx, lbl, cw * 0.5, S(40)), '#8FE4FF'); UI.outlined(ctx, t, cx, y0 + S(52), UI.fit(ctx, t, cw * 0.96, S(40)), '#FFFFFF'); }
    UI.outlined(ctx, goal, cx, y0 + S(112), UI.fit(ctx, goal, cw * 0.7, S(56)), '#FFD84A');
    ctx.restore();
  };
  // ---------- premier coup au but : un peu de fete (3 premiers vols) ----------
  const _ok = E.onKill;
  E.onKill = (g, t) => {
    _ok(g, t);
    try { const ev = g.evo; if (kb() && ev && !ev.preview && ev.kills === 1 && (E.save(g).runs || 0) < 3) { g.flash = 0.45; g.flashColor = '#FFF2C0'; const L = g.killPops; if (L && L.length) L[L.length - 1].txt = 'BOOM! ' + L[L.length - 1].txt; } } catch (e) { /* ne jamais casser le vol */ }
  };
  // ---------- barre des zones en vol ----------
  const _hd = E.drawHud;
  E.drawHud = (hud, ctx, g, W, H, px) => {
    _hd(hud, ctx, g, W, H, px);
    try {
      const ev = g.evo, run = g.endlessRun, CH = E.chapters; if (!ev || ev.preview || !run || !CH || CH.length < 2 || g.state !== 'FLIGHT' || (CC.Joy && CC.Joy.desk && (CC.Joy.desk.th || CC.Joy.desk.k2 > 0))) return;
      const d = Math.max(0, run.dist), total = (g.levelRun && g.levelRun.len) || (CH[CH.length - 1].d + 300);
      let cur = 0; for (let i = 0; i < CH.length; i++) if (d >= CH[i].d) cur = i;
      const F = CC.Font, bw = Math.min(W * 0.5, 620), bx = (W - bw) / 2, by = H * 0.955, hh = Math.max(4, Math.round(H * 0.008));
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(8,12,18,0.5)'; ctx.fillRect(bx, by, bw, hh);
      ctx.fillStyle = '#46A6FF'; ctx.fillRect(bx, by, bw * U.clamp(d / total, 0, 1), hh);
      for (let i = 0; i < CH.length; i++) { const x = bx + bw * U.clamp(CH[i].d / total, 0, 1); ctx.fillStyle = i <= cur ? '#FFFFFF' : 'rgba(255,255,255,0.45)'; ctx.fillRect(Math.round(x) - 1, by - hh * 0.6, 3, hh * 2.2); }
      const nm = CH[cur].name, nx = CH[cur + 1] ? CH[cur + 1].name : (CC.I18n && CC.I18n.lang !== 'fr' ? 'BOSS' : 'BOSS'), goal = E.nextGoal(g), txt = nm + '   ›   ' + nx + '   ·   ' + (CC.I18n && CC.I18n.lang !== 'fr' ? 'GOAL ' : 'OBJECTIF ') + goal + ' M';
      F.draw(ctx, txt, W / 2, by - px * 6.2, Math.min(px * 0.95, (bw * 1.3) / Math.max(1, F.measure(txt, 1))), '#ffffff', { align: 'center' });
      ctx.restore();
    } catch (e) { /* ne jamais casser le vol */ }
  };
  // ---------- aide de visee (3 premiers vols, clavier) ----------
  const D = CC.Joy && CC.Joy.desk; if (!D) return;
  const _ap = D.apply, V = new THREE.Vector3(), Fw = new THREE.Vector3(), Ax = new THREE.Vector3(), Q = new THREE.Quaternion();
  D.apply = (dt, input, game) => {
    _ap(dt, input, game);
    try {
      if (!kb() || game.state !== 'FLIGHT' || game.paused || game.ui.overlay || (E.save(game).runs || 0) >= 3 || !game.rocket || !game.rocket.active) return;
      const k = input.keys; if (k.ArrowLeft || k.ArrowRight || k.ArrowUp || k.ArrowDown || k.KeyA || k.KeyD || k.KeyW || k.KeyS || k.KeyQ || k.KeyZ) return;
      if (game.flightTime < 1.2 || (CC.Joy.desk.th)) return;
      const rk = game.rocket; Fw.set(0, 0, -1).applyQuaternion(input.aimQ).normalize();
      let best = null, bd = 450;
      for (const q of game.targets || []) { if (!q.alive || !q.obb || q.guard) continue; V.copy(q.obb.c).sub(rk.pos); const dist = V.length(); if (dist < 30 || dist > bd) continue; if (V.dot(Fw) / dist < 0.87) continue; best = q; bd = dist; }
      if (!best) return;
      V.copy(best.obb.c).sub(rk.pos).normalize(); const ang = Math.acos(U.clamp(Fw.dot(V), -1, 1)); if (ang < 0.015) return;
      Ax.crossVectors(Fw, V); if (Ax.lengthSq() < 1e-8) return; Ax.normalize();
      Q.setFromAxisAngle(Ax, Math.min(ang, 0.7 * dt)); input.aimQ.premultiply(Q).normalize();
    } catch (e) { /* aide facultative */ }
  };
})();
