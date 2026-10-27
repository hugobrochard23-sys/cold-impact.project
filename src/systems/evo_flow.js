/* v143 : ENCHAINEMENT des niveaux du mode évolution : niveau 1 → cinématique de victoire → écran de récompense (étoiles, pièces) → cinématique du niveau 2 → niveau 2.
 * Le niveau en cours est EVO.stage(g) (1 ou 2) ; ?lv=2 lance directement le niveau 2 (test). Chaque niveau a son propre record de distance. */
(function () {
  const U = CC.U, EVO = CC.EVO;
  if (!EVO || !EVO.on) return;
  EVO.stage = (g) => { const m = /[?&]lv=(\d)/.exec(location.search); return m ? +m[1] : (EVO.saveBase(g).stage || 1); };
  EVO.setStage = (g, n) => { const S = EVO.save(g), old = S.stage || 1; if (old === n) return; S['best' + old] = S.best || 0; S.best = S['best' + n] || 0; S.stage = n; g.writeSave(); };
  // --- écran d'accueil : cinématique d'intro la toute première fois, ou la suite programmée (victoire, niveau suivant)
  EVO.showHome = (g) => {
    if (g.evoNext) { const f = g.evoNext; g.evoNext = null; f(); return; }
    const S = EVO.save(g);
    if (!S.intro && !g.testMode && EVO.stage(g) === 1) EVO.startIntro(g); else g.ui.overlay = 'evo';
  };
  EVO.startIntro = (g) => { EVO.playCine(g, 'intro1', () => { EVO.save(g).intro = 1; g.writeSave(); g.ui.overlay = 'evo'; EVO.start(g); }); };
  EVO.endIntro = (g) => { if (g.cine3d) EVO.stopCine(g); else { EVO.save(g).intro = 1; g.writeSave(); g.ui.overlay = 'evo'; } };
  // --- victoire : récompense, cinématique, écran de bilan
  EVO.onClear = (g) => {
    const S = EVO.save(g), st = EVO.stage(g); EVO.mark(g, 'boss' + (st > 1 ? st : '')); S.cleared = (S.cleared || 0) + 1; if (st === 1) S.clr1 = 1; const bonus = st === 1 ? 800 : 1500; S.coins += bonus; g.writeSave();
    g.evoWin = { stage: st, bonus, t0: 0, coins: S.coins };
    g.evoNext = () => EVO.playCine(g, st === 1 ? 'win1' : 'win2', () => { g.ui.overlay = 'evoWin'; g.evoWin.t0 = performance.now(); g.audio.play('victory'); });
    g.goHome({});
  };
  EVO.goStage2 = (g) => {
    EVO.setStage(g, 2); g.evoWin = null;
    g.evoNext = () => EVO.playCine(g, 'intro2', () => { g.ui.overlay = null; EVO.start(g); });
    g.goHome({});
  };
  EVO.backStage1 = (g) => { g.evoWin = null; g.ui.overlay = 'evo'; g.goHome({}); };   // après le niveau 2 : on reste sur le niveau 2 (rejouer, améliorer)
  EVO.switchStage = (g, n) => { if (EVO.stage(g) === n) return; EVO.setStage(g, n); g.ui.overlay = null; g.goHome({}); };
  // --- le niveau 2 : lancement automatique, sans la barre (le missile sort du tube)
  const _sa = EVO.startAim;
  EVO.startAim = (g) => { _sa(g); };   // v174 : le niveau 2 utilise le meme lancement a maintenir
  const _at = EVO.aimTick;
  EVO.aimTick = (g, dt) => { const a = g.evoAim; if (a && a.auto && !a.lock && g.state === 'LAUNCH' && a.t > 0.5) { a.c = 0.2; EVO.lock(g); } _at(g, dt); };
  // --- écran de bilan : étoiles qui s'allument, pièces, une grande flèche pour continuer
  CC.Home.drawEvoWin = function (ui, ctx, g, W, H0) {
    const L = CC.Home.layout(ui, W, H0), H = L.HH, W_ = g.evoWin; if (!W_) return;
    const F = CC.Font, t = (performance.now() - (W_.t0 || performance.now())) / 1000, u = Math.min(W, H), cx = W / 2;
    ctx.save(); ctx.translate(0, L.T);
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(6,10,24,0.94)'); gr.addColorStop(1, 'rgba(24,14,10,0.94)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { const x = (Math.sin(k * 12.9) * 0.5 + 0.5) * W, y = ((k * 0.137 + t * 0.03) % 1) * H; ctx.fillStyle = 'rgba(255,220,150,' + (0.2 + 0.2 * Math.sin(t * 2 + k)) + ')'; ctx.fillRect(x, y, 2, 2); }
    // étoiles
    const UI = CC.Home.evoUI;
    { const a = Math.min(1, t / 0.5); ctx.save(); ctx.globalAlpha = a; UI.txt(ctx, 'MISSION ACCOMPLIE !', cx, H * 0.07, UI.fit(ctx, 'MISSION ACCOMPLIE !', W * 0.92, u * 0.13), '#f2b84a', { ls: u * 0.01 }); ctx.restore(); }
    for (let k = 0; k < 3; k++) { const s = Math.min(1, Math.max(0, (t - 0.3 - k * 0.45) / 0.35)), e = s < 1 ? 1 + 0.5 * Math.sin(s * 3.1416) : 1; UI.star(ctx, cx + (k - 1) * u * 0.27, H * 0.22 - (k === 1 ? u * 0.06 : 0), u * 0.13 * (k === 1 ? 1.3 : 1) * s * e); }
    // pièces gagnées
    const k2 = Math.min(1, Math.max(0, (t - 1.8) / 1.2)), cs = '+' + U.formatInt(Math.round(W_.bonus * k2));
    { const fs = UI.fit(ctx, cs, W * 0.6, u * 0.16), w2 = UI.tw(ctx, cs, fs); UI.coin(ctx, cx - w2 / 2 - fs * 0.55, H * 0.4, fs * 0.5); UI.txt(ctx, cs, cx + fs * 0.25, H * 0.4, fs, '#f2b84a' ); }
    { const sc = 'TOTAL ' + U.formatInt(W_.coins); UI.txt(ctx, sc, cx, H * 0.5, UI.fit(ctx, sc, W * 0.7, u * 0.07), '#ececee', { shadow: false }); }
    // pictogramme de la prochaine mission : sous-marin → bateau → missile
    if (W_.stage === 2) { const a = Math.min(1, Math.max(0, (t - 3) / 0.6)), y = H * 0.66, s = u * 0.07; ctx.globalAlpha = a; F.draw(ctx, '3', cx, y - s * 1.2, s * 0.2, '#6f7a8a', { align: 'center' }); ctx.fillStyle = '#9aa6b8'; ctx.fillRect(cx - s * 0.55, y + s * 0.0, s * 1.1, s * 0.8); ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = Math.max(3, s * 0.18); ctx.beginPath(); ctx.arc(cx, y - s * 0.05, s * 0.4, Math.PI, 0); ctx.stroke(); ctx.globalAlpha = 1; }
    if (W_.stage === 1) { const a = Math.min(1, Math.max(0, (t - 3) / 0.6)), y = H * 0.66, s = u * 0.06; ctx.globalAlpha = a; EVO.iconSub(ctx, cx - u * 0.3, y, s, '#aee8ff'); EVO.iconArrow(ctx, cx - u * 0.15, y, s * 0.4, 'rgba(255,255,255,0.8)', 0); EVO.iconShip(ctx, cx, y, s * 0.9, '#ff9a6a'); EVO.iconArrow(ctx, cx + u * 0.15, y, s * 0.4, 'rgba(255,255,255,0.8)', 0); EVO.iconMissile(ctx, cx + u * 0.3, y, s, '#ff6a4a'); ctx.globalAlpha = 1; }
    // bouton : une grande flèche verte qui pulse
    if (t > 3.2) { const bw = Math.min(W * 0.6, u * 0.6), bh = u * 0.2, bx = cx - bw / 2, by = H * 0.8, pulse = 1 + 0.04 * Math.sin(t * 5); ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btn(ctx, bx, by, bw, bh, bh * 0.22, UI.K.green); UI.txt(ctx, 'SUIVANT', cx - bw * 0.1, by + bh * 0.45, UI.fit(ctx, 'SUIVANT', bw * 0.5, bh * 0.4), '#ffffff', { stroke: UI.K.green[3], sw: 0.2 }); EVO.iconArrow(ctx, cx + bw * 0.32, by + bh / 2, bh * 0.24, '#ffffff', 0); ctx.restore();
      ui.buttons.push({ x: bx, y: L.T + by, w: bw, h: bh, action: () => { if (W_.stage === 1) EVO.goStage2(g); else EVO.backStage1(g); } }); }
    ctx.restore();
  };
})();
