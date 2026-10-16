/* v152 : MENU et RAPPORT DE VOL du mode evolution, refaits en style « jeu mobile » lisse (coins arrondis, degrades, police epaisse a contour).
 * Peu d'infos : barre du haut, nom de la fusee, coffre / gemme, « APPUYEZ POUR VOLER », trois cartes (fusee, lanceur, revenu). Remplace Home.drawEvo.
 * Le rapport de vol (overlay 'evoReport') s'affiche sur le lieu du crash : distance, revenu, total, curseur de pub x1,5 a x4, SUIVANT. */
(function () {
  const U = CC.U, Home = CC.Home; if (!Home) return;
  const FONT = '"Lilita One","Baloo 2","Arial Black","Roboto Black",sans-serif';
  try { if (document.fonts && document.fonts.load) document.fonts.load('20px "Lilita One"'); } catch (e) { /* police de secours */ }
  const hit = (ui, x, y, w, h, a) => ui.buttons.push({ x, y, w, h, action: a });
  const inRect = (ui, x, y, w, h) => !ui.isTouch() && ui.mouse.x >= x && ui.mouse.x <= x + w && ui.mouse.y >= y && ui.mouse.y <= y + h;
  const GOLD = '#ffc531', GEMC = '#4cc4ff';
  function path(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // texte epais a contour, centre verticalement sur y
  function txt(ctx, s, x, y, px, fill, o) {
    o = o || {}; ctx.save(); ctx.font = '700 ' + px + 'px ' + FONT; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillText(s, x, y + px * 0.09); }
    ctx.lineWidth = px * (o.sw || 0.2); ctx.strokeStyle = o.stroke || '#14284a'; ctx.strokeText(s, x, y);
    if (o.grad) { const g = ctx.createLinearGradient(0, y - px * 0.5, 0, y + px * 0.5); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); ctx.fillStyle = g; } else ctx.fillStyle = fill;
    ctx.fillText(s, x, y); ctx.restore();
  }
  const tw = (ctx, s, px) => { ctx.save(); ctx.font = '700 ' + px + 'px ' + FONT; const w = ctx.measureText(s).width; ctx.restore(); return w; };
  const fit = (ctx, s, maxW, px) => { const w = tw(ctx, s, px); return w > maxW ? px * maxW / w : px; };
  // panneau lisse : ombre, degrade, reflet, contour
  function panel(ctx, x, y, w, h, r, c1, c2, border, o) {
    o = o || {}; const lw = Math.max(2, h * 0.035);
    if (o.shadow !== false) { path(ctx, x, y + h * 0.07, w, h, r); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill(); }
    path(ctx, x, y, w, h, r); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill();
    ctx.save(); path(ctx, x, y, w, h, r); ctx.clip(); const g2 = ctx.createLinearGradient(0, y, 0, y + h * 0.55); g2.addColorStop(0, 'rgba(255,255,255,0.34)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g2; ctx.fillRect(x, y, w, h * 0.55); ctx.restore();
    path(ctx, x, y, w, h, r); ctx.lineWidth = lw; ctx.strokeStyle = border || '#12254a'; ctx.stroke();
  }
  // ---------- icones ----------
  function coin(ctx, cx, cy, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, '#fff09a'); g.addColorStop(0.55, '#ffc42a'); g.addColorStop(1, '#e08a10'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.strokeStyle = '#8a4c0c'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.66, 0, 6.2832); ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = 'rgba(160,90,10,0.7)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.3, r * 0.22, 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.restore();
  }
  function gem(ctx, cx, cy, r) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx - r, cy - r * 0.25); ctx.lineTo(cx - r * 0.55, cy - r * 0.9); ctx.lineTo(cx + r * 0.55, cy - r * 0.9); ctx.lineTo(cx + r, cy - r * 0.25); ctx.lineTo(cx, cy + r); ctx.closePath();
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, '#b6ecff'); g.addColorStop(0.5, '#34b4f4'); g.addColorStop(1, '#1668c8'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.15); ctx.strokeStyle = '#0c3a7a'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r, cy - r * 0.25); ctx.lineTo(cx + r, cy - r * 0.25); ctx.moveTo(cx - r * 0.3, cy - r * 0.9); ctx.lineTo(cx - r * 0.45, cy - r * 0.25); ctx.lineTo(cx, cy + r); ctx.moveTo(cx + r * 0.3, cy - r * 0.9); ctx.lineTo(cx + r * 0.45, cy - r * 0.25); ctx.lineTo(cx, cy + r);
    ctx.lineWidth = Math.max(1, r * 0.07); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke(); ctx.restore();
  }
  function gear(ctx, cx, cy, r) {
    ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a3f78'; ctx.lineWidth = Math.max(1.5, r * 0.13); ctx.lineJoin = 'round'; ctx.beginPath();
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832, b = a + 0.38, c = a + 0.78, d = a + 1.16; const R = r, r2 = r * 0.74; ctx.lineTo(cx + Math.cos(a + 0.1) * r2, cy + Math.sin(a + 0.1) * r2); ctx.lineTo(cx + Math.cos(a + 0.22) * R, cy + Math.sin(a + 0.22) * R); ctx.lineTo(cx + Math.cos(b + 0.1) * R, cy + Math.sin(b + 0.1) * R); ctx.lineTo(cx + Math.cos(b + 0.22) * r2, cy + Math.sin(b + 0.22) * r2); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, 6.2832); ctx.fillStyle = '#2f80e0'; ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function chest(ctx, cx, cy, r, open, glow) {
    ctx.save();
    if (glow) { const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.8); gr.addColorStop(0, 'rgba(255,240,150,' + glow + ')'); gr.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4); }
    const w = r * 1.7, h = r * 1.0, x = cx - w / 2, y = cy - h * 0.1;
    panel(ctx, x, y, w, h, r * 0.16, '#4a8ae8', '#1f56b8', '#0e2a60', { shadow: false });
    ctx.fillStyle = '#c3cfe0'; ctx.fillRect(x + w * 0.08, y, w * 0.1, h); ctx.fillRect(x + w * 0.82, y, w * 0.1, h);
    ctx.save(); ctx.translate(x, y); if (open) ctx.rotate(-0.55); panel(ctx, 0, -h * 0.55, w, h * 0.62, r * 0.3, '#69a4ff', '#2b66cc', '#0e2a60', { shadow: false }); ctx.fillStyle = '#c3cfe0'; ctx.fillRect(w * 0.08, -h * 0.55, w * 0.1, h * 0.6); ctx.fillRect(w * 0.82, -h * 0.55, w * 0.1, h * 0.6); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, y + h * 0.3, r * 0.17, 0, 6.2832); ctx.fillStyle = '#ffd23a'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.strokeStyle = '#0e2a60'; ctx.stroke(); ctx.restore();
  }
  // fusee vectorielle : le palier se voit (carton, ailes, reacteur, turbo)
  function rocket(ctx, cx, cy, s, tier, flame) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.strokeStyle = '#1e2c46';
    const card = tier < 2, c1 = card ? '#f0cf98' : '#ffffff', c2 = card ? '#b98a52' : '#c4cfdc', red = card ? '#c8924f' : '#e5392b', wing = card ? '#d4a468' : '#e6ecf4';
    const grad = (x0, y0, x1, y1, a, b) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
    if (flame) { const fh = s * (1.5 + 0.3 * Math.sin(performance.now() / 70)); const g = ctx.createLinearGradient(0, cy + s * 1.9, 0, cy + s * 1.9 + fh); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.4, '#ffa828'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy + s * 1.9); ctx.quadraticCurveTo(cx, cy + s * 1.9 + fh * 1.1, cx + s * 0.3, cy + s * 1.9); ctx.fill(); }
    if (tier >= 3) for (const sd of [-1, 1]) { path(ctx, cx + sd * s * 0.78 - s * 0.2, cy - s * 0.5, s * 0.4, s * 2.3, s * 0.2); ctx.fillStyle = grad(0, cy - s * 0.5, 0, cy + s * 1.8, '#ff6a50', '#b8221a'); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2b2d31'; ctx.fillRect(cx + sd * s * 0.78 - s * 0.16, cy + s * 1.8, s * 0.32, s * 0.2); }
    if (tier >= 1) for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * s * 0.4, cy + s * 0.05); ctx.lineTo(cx + sd * s * 1.8, cy + s * 1.15); ctx.lineTo(cx + sd * s * 1.7, cy + s * 1.45); ctx.lineTo(cx + sd * s * 0.4, cy + s * 1.05); ctx.closePath(); ctx.fillStyle = wing; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + sd * s * 1.45, cy + s * 0.95); ctx.lineTo(cx + sd * s * 1.8, cy + s * 1.15); ctx.lineTo(cx + sd * s * 1.7, cy + s * 1.45); ctx.lineTo(cx + sd * s * 1.5, cy + s * 1.3); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); }
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * s * 0.4, cy + s * 1.2); ctx.lineTo(cx + sd * s * 1.0, cy + s * 2.0); ctx.lineTo(cx + sd * s * 0.4, cy + s * 2.0); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke(); }
    path(ctx, cx - s * 0.46, cy - s * 1.3, s * 0.92, s * 3.2, s * 0.35); ctx.fillStyle = grad(cx - s * 0.46, 0, cx + s * 0.46, 0, c1, c2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - s * 0.46, cy - s * 1.2); ctx.quadraticCurveTo(cx, cy - s * 2.9, cx + s * 0.46, cy - s * 1.2); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke();
    if (tier >= 2) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - s * 0.45, cy + s * 0.9, s * 0.9, s * 0.2); }
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.3, s * 0.27, 0, 6.2832); ctx.fillStyle = '#58c4ff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(cx - s * 0.08, cy - s * 0.38, s * 0.08, 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  }
  function launcher(ctx, cx, cy, s, tier) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e2c46';
    if (tier === 0) { ctx.fillStyle = '#b07a42'; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.moveTo(cx - s * 1.9, cy + s * 1.1); ctx.lineTo(cx + s * 1.9, cy - s * 0.7); ctx.lineTo(cx + s * 1.9, cy - s * 0.25); ctx.lineTo(cx - s * 1.9, cy + s * 1.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5a2c'; ctx.fillRect(cx + s * 1.1, cy - s * 0.3, s * 0.25, s * 1.8); ctx.fillRect(cx - s * 1.0, cy + s * 0.4, s * 0.25, s * 1.2); }
    else if (tier === 1) { ctx.lineWidth = s * 0.28; ctx.strokeStyle = '#46505e'; for (const o of [-0.35, 0.35]) { ctx.beginPath(); ctx.moveTo(cx - s * 1.9, cy + s * (1.2 + o * 0.3)); ctx.lineTo(cx + s * 1.9, cy + s * (-0.6 + o * 0.3)); ctx.stroke(); } ctx.lineWidth = s * 0.12; ctx.strokeStyle = '#58c4ff'; ctx.beginPath(); ctx.moveTo(cx - s * 1.8, cy + s * 1.2); ctx.lineTo(cx + s * 1.8, cy - s * 0.6); ctx.stroke(); ctx.fillStyle = '#46505e'; ctx.fillRect(cx - s * 0.2, cy + s * 0.3, s * 0.4, s * 1.2); }
    else { ctx.lineWidth = s * 0.1; ctx.fillStyle = '#3a4656'; path(ctx, cx - s * 1.8, cy + s * 1.1, s * 3.6, s * 0.5, s * 0.15); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#ffc531'; ctx.lineWidth = s * 0.34; ctx.beginPath(); ctx.moveTo(cx - s * 1.2, cy + s * 1.1); ctx.lineTo(cx + s * 1.2, cy - s * 1.1); ctx.stroke(); ctx.strokeStyle = '#8a98aa'; ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy + s * 1.1); for (let k = 0; k < 6; k++) ctx.lineTo(cx - s * 0.1 + (k % 2 ? -1 : 1) * s * 0.3, cy + s * (0.9 - k * 0.24)); ctx.stroke(); }
    ctx.restore();
  }
  function wallet(ctx, cx, cy, s) {
    for (let k = 2; k >= 0; k--) { const y = cy + s * 0.5 - k * s * 0.38; ctx.save(); ctx.beginPath(); ctx.ellipse(cx, y, s * 0.95, s * 0.4, 0, 0, 6.2832); const g = ctx.createLinearGradient(0, y - s * 0.4, 0, y + s * 0.4); g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#e09010'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.strokeStyle = '#8a4c0c'; ctx.stroke(); ctx.restore(); }
    coin(ctx, cx + s * 0.9, cy - s * 0.55, s * 0.5);
  }
  function star(ctx, cx, cy, r) {
    ctx.save(); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, rad = k % 2 ? r * 0.46 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } ctx.closePath();
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, '#fff6a8'); g.addColorStop(0.5, '#ffc828'); g.addColorStop(1, '#e88a10'); ctx.fillStyle = g; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, r * 0.12); ctx.strokeStyle = '#8a4c0c'; ctx.stroke(); ctx.restore();
  }
  Home.evoUI = { txt, tw, fit, panel, coin, gem, star, path };
  const secFmt = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  const MULT = [[0.2, 4], [0.45, 3], [0.75, 2], [1.01, 1.5]];
  const multAt = (p) => { const a = Math.abs(p); for (const [t, m] of MULT) if (a < t) return m; return 1.5; };
  const MCOL = { 4: '#ffc531', 3: '#4ccc4c', 2: '#46b8ff', 1.5: '#ff5a6a' };
  const ease = (k) => 1 - Math.pow(1 - U.clamp(k, 0, 1), 3);

  // barre du haut : pieces, gemmes (+), reglages
  function topBar(ui, ctx, game, W, T0, u, S, E) {
    const h = u * 0.105, y = T0 + u * 0.03, px = h * 0.52, x0 = W * 0.03;
    const cs = U.formatInt(S.coins), cw = Math.max(u * 0.33, tw(ctx, cs, px) + h * 1.4);
    panel(ctx, x0, y, cw, h, h / 2, '#ffb921', '#e8880c', '#7a420a'); coin(ctx, x0 + h * 0.5, y + h / 2, h * 0.5); txt(ctx, cs, x0 + h * 1.05, y + h / 2, px, '#ffffff', { align: 'left', stroke: '#8a4c0c' });
    const gs = String(S.gems || 0), gx = x0 + cw + W * 0.025, gw = Math.max(u * 0.27, tw(ctx, gs, px) + h * 2.3);
    panel(ctx, gx, y, gw, h, h / 2, '#3aa4ff', '#1668d8', '#0c2e70'); gem(ctx, gx + h * 0.5, y + h / 2, h * 0.38); txt(ctx, gs, gx + h * 1.05, y + h / 2, px, '#ffffff', { align: 'left' });
    panel(ctx, gx + gw - h * 0.92, y + h * 0.08, h * 0.84, h * 0.84, h * 0.42, '#6adc5a', '#2fa83a', '#14501c', { shadow: false }); txt(ctx, '+', gx + gw - h * 0.5, y + h * 0.52, h * 0.7, '#ffffff', { stroke: '#14501c' });
    hit(ui, gx, y, gw, h, () => E.gemAd(game));
    const gr = h * 0.52, gcx = W * 0.945 - gr * 0.1, gcy = y + h / 2; ctx.save(); ctx.beginPath(); ctx.arc(gcx, gcy + gr * 0.1, gr, 0, 6.2832); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill(); ctx.beginPath(); ctx.arc(gcx, gcy, gr, 0, 6.2832); const g = ctx.createLinearGradient(0, gcy - gr, 0, gcy + gr); g.addColorStop(0, '#5ab8ff'); g.addColorStop(1, '#1f6ed8'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2, gr * 0.12); ctx.strokeStyle = '#d6efff'; ctx.stroke(); ctx.restore(); gear(ctx, gcx, gcy, gr * 0.6);
    hit(ui, gcx - gr, gcy - gr, gr * 2, gr * 2, () => { ui.overlay = 'msettings'; });
    return y + h;
  }

  Home.drawEvo = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), last = game.evoLast, now = performance.now(), cx = W / 2, anim = game.evoAnim;
    const sy = (f) => HH * f;
    const bot = topBar(ui, ctx, game, W, T0, u, S, E);
    // --- niveau 1 / 2 : deux pastilles sous le coffre ---
    const colx = W * 0.8, cs0 = u * 0.17;
    if (anim) {
      const a = U.clamp(anim.t / 0.4, 0, 1) * (1 - U.smooth(anim.dur - 0.6, anim.dur, anim.t)), name = anim.label + ' !';
      ctx.save(); ctx.globalAlpha = a; txt(ctx, name, cx, Y(0.2), fit(ctx, name, W * 0.9, u * 0.16), '#ffd54a', { sw: 0.16 }); txt(ctx, 'NOUVELLE PIECE', cx, Y(0.28), u * 0.07, '#ffffff'); ctx.restore(); return;
    }
    // --- voile bas pour lire les cartes ---
    { const g = ctx.createLinearGradient(0, Y(0.62), 0, Y(0.72)); g.addColorStop(0, 'rgba(6,10,18,0)'); g.addColorStop(1, 'rgba(6,10,18,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, Y(0.62), W, Y(0.72) - Y(0.62)); ctx.fillStyle = 'rgba(6,10,18,0.55)'; ctx.fillRect(0, Y(0.72), W, HH); }
    // --- bandeau de bois : le nom de la fusee ---
    if (!last || !last.zone2) {
      const r0 = E.rocket(S.rk), name = E.RK_TIERS[r0.tier], bw = u * 0.62, bh = u * 0.15, bx = cx - bw / 2 + u * 0.05, by = Y(0.09);
      panel(ctx, bx, by, bw, bh, bh * 0.2, '#e0b070', '#b27f43', '#5a3410'); path(ctx, bx + bh * 0.07, by + bh * 0.07, bw - bh * 0.14, bh * 0.86, bh * 0.15); ctx.lineWidth = Math.max(1, bh * 0.025); ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.stroke();
      txt(ctx, name, bx + bw * 0.56, by + bh / 2, fit(ctx, name, bw * 0.66, bh * 0.4), '#fff4dc', { stroke: '#5a3410', sw: 0.16 });
      ctx.save(); ctx.beginPath(); ctx.arc(bx - bh * 0.1, by + bh * 0.5, bh * 0.62, 0, 6.2832); ctx.fillStyle = 'rgba(20,30,50,0.35)'; ctx.fill(); ctx.restore(); rocket(ctx, bx - bh * 0.1, by + bh * 0.5, bh * 0.2, r0.tier, false);
    } else { txt(ctx, 'ZONE 1 TERMINEE !', cx, Y(0.12), fit(ctx, 'ZONE 1 TERMINEE !', W * 0.9, u * 0.1), '#ffd54a'); }
    // --- colonne de droite : coffre (toutes les 2 h) puis choix du niveau ---
    const unlocked = S.runs >= 3, ready = E.chestReady(game), wait = Math.max(0, (S.chestAt || 0) - Date.now());
    if (unlocked || S.runs >= 2) {
      const x = colx, y = Y(0.18), pulse = 0.5 + 0.5 * Math.sin(now / 260);
      if (unlocked) { ctx.save(); if (ready) { const k = 1 + 0.05 * pulse; ctx.translate(x + cs0 / 2, y + cs0 / 2); ctx.scale(k, k); ctx.translate(-x - cs0 / 2, -y - cs0 / 2); } chest(ctx, x + cs0 / 2, y + cs0 * 0.42, cs0 * 0.42, false, ready ? 0.35 + 0.3 * pulse : 0); ctx.restore();
        const lab = ready ? 'OUVRIR' : secFmt(wait), tx = x + cs0 / 2, ty = y + cs0 * 1.18, tp = u * 0.058; panel(ctx, tx - cs0 * 0.5, ty - tp * 0.7, cs0, tp * 1.4, tp * 0.7, ready ? '#ffcf3a' : '#2f6fd0', ready ? '#e8920c' : '#1a46a0', ready ? '#7a420a' : '#0c2a6a', { shadow: false }); txt(ctx, lab, tx, ty, fit(ctx, lab, cs0 * 0.9, tp), '#ffffff', { stroke: ready ? '#8a4c0c' : '#0c2a6a' });
        hit(ui, x - 4, y, cs0 + 8, cs0 * 1.2, () => E.openChest(game)); }
      else { chest(ctx, x + cs0 / 2, y + cs0 * 0.42, cs0 * 0.36, false, 0); ctx.fillStyle = 'rgba(8,12,20,0.55)'; ctx.fillRect(x, y, cs0, cs0 * 0.9); txt(ctx, '3 VOLS', x + cs0 / 2, y + cs0 * 0.98, u * 0.052, '#ffffff'); }
    }
    if (E.stage) { const stg = E.stage(game), bs = u * 0.1, bx0 = colx + cs0 / 2 - bs - u * 0.01, by0 = Y(0.3);
      for (let n = 1; n <= 2; n++) { const x = bx0 + (n - 1) * (bs + u * 0.02), on = stg === n, open = n === 1 || !!S.clr1; panel(ctx, x, by0, bs, bs, bs * 0.3, on ? '#ffd23a' : '#34425e', on ? '#e8920c' : '#1c2740', on ? '#7a420a' : '#0c1424'); txt(ctx, String(n), x + bs / 2, by0 + bs * 0.52, bs * 0.58, open ? '#ffffff' : '#7e8aa2', { stroke: on ? '#7a420a' : '#0c1424' });
        if (open && !on) hit(ui, x, by0, bs, bs, () => E.switchStage(game, n)); } }
    // --- colonne de gauche : une gemme contre une pub ---
    if (unlocked || S.runs >= 2) { const x = W * 0.045, y = Y(0.18); gem(ctx, x + cs0 * 0.5, y + cs0 * 0.45, cs0 * 0.36); panel(ctx, x + cs0 * 0.62, y, cs0 * 0.5, cs0 * 0.3, cs0 * 0.1, '#6adc5a', '#2fa83a', '#14501c', { shadow: false }); txt(ctx, '+1', x + cs0 * 0.87, y + cs0 * 0.16, cs0 * 0.24, '#ffffff', { stroke: '#14501c' });
      const lp = u * 0.058, lab = 'PUB'; panel(ctx, x + cs0 * 0.5 - cs0 * 0.4, y + cs0 * 0.98 - lp * 0.7, cs0 * 0.8, lp * 1.4, lp * 0.7, '#a860f0', '#6a2ec0', '#2e1260', { shadow: false }); txt(ctx, lab, x + cs0 * 0.5, y + cs0 * 0.98, lp, '#ffffff', { stroke: '#2e1260' });
      hit(ui, x - 4, y, cs0 + 8, cs0 * 1.2, () => E.gemAd(game)); }
    // --- trois cartes ---
    const ids = ['rk', 'la', 'cm'], cy0 = Y(0.725), chh = HH * 0.225, gap = W * 0.022, cw = (W * 0.94 - gap * 2) / 3, scheme = { rk: ['#5cdc52', '#2f9e34', '#145a1c'], la: ['#4cb4ff', '#1f72d8', '#0c3a8a'], cm: ['#ffa24a', '#e0681a', '#7a3408'] };
    const cards = [];
    ids.forEach((id, i) => {
      const n = S[id], max = E.MAXN[id], x = W * 0.03 + i * (cw + gap), cost = E.nextCost(game, id), can = cost !== null && S.coins >= cost, done = n >= max, sc = scheme[id];
      const name = id === 'rk' ? 'FUSEE' : id === 'la' ? 'LANCEUR' : 'REVENU', tdone = id === 'rk' ? E.rocket(n).s : id === 'la' ? E.launcher(n).s : n;
      const shk = game.evoShake && game.evoShake.id === id && now - game.evoShake.t0 < 350 ? Math.sin((now - game.evoShake.t0) / 25) * u * 0.012 : 0, bt = game.evoBought, bk = bt && bt.id === id ? U.clamp(1 - (now - bt.t0) / 520, 0, 1) : 0, k2 = 1 + 0.08 * Math.sin(bk * 3.1416);
      const rx = x + shk, ccx = rx + cw / 2, ccy = cy0 + chh / 2;
      ctx.save(); ctx.translate(ccx, ccy); ctx.scale(k2, k2); ctx.translate(-ccx, -ccy);
      panel(ctx, rx, cy0, cw, chh, cw * 0.1, '#5a6a8e', '#34415f', '#0e1830');
      const hh = chh * 0.15; panel(ctx, rx + cw * 0.05, cy0 + chh * 0.03, cw * 0.9, hh, hh * 0.3, '#8296c0', '#566a96', '#1c2c52', { shadow: false }); txt(ctx, name, rx + cw * 0.5, cy0 + chh * 0.03 + hh / 2, fit(ctx, name, cw * 0.62, hh * 0.62), '#ffffff', { sw: 0.18 });
      const br = cw * 0.15, bx2 = rx + cw - br * 0.7, by2 = cy0 + br * 0.15; ctx.beginPath(); ctx.arc(bx2, by2, br, 0, 6.2832); ctx.fillStyle = '#1a2440'; ctx.fill(); ctx.lineWidth = Math.max(2, br * 0.14); ctx.strokeStyle = '#d6e2ff'; ctx.stroke(); txt(ctx, String(n + 1), bx2, by2 + br * 0.04, fit(ctx, '20', br * 1.3, br * 1.05), '#ffffff', { sw: 0.12 });
      const ay = cy0 + chh * 0.2, ah = chh * 0.38; ctx.save(); path(ctx, rx + cw * 0.06, ay, cw * 0.88, ah, cw * 0.07); ctx.clip(); { const g = ctx.createLinearGradient(0, ay, 0, ay + ah); g.addColorStop(0, '#6cb8f4'); g.addColorStop(1, '#cfeaff'); ctx.fillStyle = g; ctx.fillRect(rx, ay, cw, ah); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(rx + cw * 0.28, ay + ah * 0.28, cw * 0.14, ah * 0.07, 0, 0, 6.2832); ctx.ellipse(rx + cw * 0.72, ay + ah * 0.7, cw * 0.16, ah * 0.07, 0, 0, 6.2832); ctx.fill();
        const ix = ccx, iy = ay + ah * 0.5;
        if (id === 'rk') rocket(ctx, ix, iy - ah * 0.02, ah * 0.2, E.rocket(n).tier, true); else if (id === 'la') launcher(ctx, ix, iy, ah * 0.17, E.launcher(n).tier); else wallet(ctx, ix, iy, ah * 0.2);
        if (id === 'cm') txt(ctx, 'X' + f1(E.mult(n)), ix, ay + ah * 0.84, ah * 0.22, '#ffffff'); ctx.restore(); }
      path(ctx, rx + cw * 0.06, ay, cw * 0.88, ah, cw * 0.07); ctx.lineWidth = Math.max(1.5, cw * 0.015); ctx.strokeStyle = 'rgba(14,24,48,0.7)'; ctx.stroke();
      const sg = cw * 0.135, sgap = cw * 0.025, tot = 5 * sg + 4 * sgap, sy0 = cy0 + chh * 0.605; for (let k = 0; k < 5; k++) { path(ctx, rx + cw / 2 - tot / 2 + k * (sg + sgap), sy0, sg, sg * 0.62, sg * 0.2); ctx.fillStyle = k < tdone ? sc[0] : 'rgba(180,196,226,0.35)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(10,20,44,0.8)'; ctx.stroke(); }
      // bouton : se remplit pendant que les pieces arrivent, brille quand on peut payer
      const bx = rx + cw * 0.06, bw = cw * 0.88, by = cy0 + chh * 0.7, bh = chh * 0.255, frac = done || cost === null ? 1 : U.clamp(S.coins / cost, 0, 1);
      if (done) { panel(ctx, bx, by, bw, bh, bh * 0.3, '#8090a8', '#56647c', '#1e2a3e', { shadow: false }); txt(ctx, 'MAX', bx + bw / 2, by + bh / 2, bh * 0.5, '#ffffff'); }
      else {
        panel(ctx, bx, by, bw, bh, bh * 0.3, '#4a5876', '#2e3a54', '#12203e', { shadow: false });
        ctx.save(); path(ctx, bx, by, bw, bh, bh * 0.3); ctx.clip(); const gg = ctx.createLinearGradient(0, by, 0, by + bh); gg.addColorStop(0, can ? sc[0] : sc[0] + 'aa'); gg.addColorStop(1, can ? sc[1] : sc[1] + 'aa'); ctx.fillStyle = gg; ctx.fillRect(bx, by, bw * frac, bh); ctx.fillStyle = 'rgba(255,255,255,' + (can ? 0.2 + 0.12 * Math.sin(now / 200) : 0.12) + ')'; ctx.fillRect(bx, by, bw, bh * 0.45); ctx.restore();
        path(ctx, bx, by, bw, bh, bh * 0.3); ctx.lineWidth = Math.max(2, bh * 0.06); ctx.strokeStyle = can ? '#ffffff' : sc[2]; ctx.stroke();
        txt(ctx, 'AMELIORER', bx + bw / 2, by + bh * 0.3, fit(ctx, 'AMELIORER', bw * 0.9, bh * 0.3), '#ffffff', { stroke: sc[2], sw: 0.2 });
        const ps = U.formatInt(cost), pp = fit(ctx, ps, bw * 0.5, bh * 0.36), pw = tw(ctx, ps, pp) + pp * 1.2; coin(ctx, bx + bw / 2 - pw / 2, by + bh * 0.7, pp * 0.46); txt(ctx, ps, bx + bw / 2 - pw / 2 + pp * 0.75, by + bh * 0.7, pp, can ? '#ffffff' : '#ffb0a0', { align: 'left', stroke: sc[2] });
      }
      if (bk > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (bk * 0.5) + ')'; path(ctx, rx, cy0, cw, chh, cw * 0.1); ctx.fill(); }
      ctx.restore();
      cards.push({ id, rx, cy0, cw, chh, bx, by, bw, bh, can, done, cost });
    });
    // gemme : proposee seulement quand les pieces manquent (puce ronde sur le coin du bouton)
    for (const c of cards) if (!c.done && !c.can) { const gc = E.gemCost(game, c.id), have = (S.gems || 0) >= gc, r = c.bh * 0.34, gx = c.bx + c.bw - r * 0.35, gy = c.by - r * 0.95;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, 6.2832); const g = ctx.createLinearGradient(0, gy - r, 0, gy + r); g.addColorStop(0, have ? '#4cb4ff' : '#b070f8'); g.addColorStop(1, have ? '#1f6ed8' : '#6a2ec0'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.12); ctx.strokeStyle = '#ffffff'; ctx.stroke(); gem(ctx, gx, gy - r * 0.12, r * 0.5); txt(ctx, have ? String(gc) : 'PUB', gx, gy + r * 0.52, r * (have ? 0.55 : 0.4), '#ffffff', { sw: 0.2 });
      hit(ui, gx - r, gy - r, r * 2, r * 2, () => E.buyGem(game, c.id)); }
    for (const c of cards) hit(ui, c.rx, c.cy0, c.cw, c.chh, () => E.buy(game, c.id));
    // --- coffre ouvert ---
    { const ch = game.evoChest; if (ch) { const k = (now - ch.t0) / 1000; if (k > 3.2) game.evoChest = null; else {
      const a = U.clamp(k / 0.25, 0, 1) * U.clamp((3.2 - k) / 0.4, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, T0, W, HH); chest(ctx, cx, Y(0.32), u * 0.22, k > 0.35, 0.55);
      const t1 = '+' + U.formatInt(ch.coins), t2 = '+' + ch.gems, p1 = u * 0.14; coin(ctx, cx - tw(ctx, t1, p1) / 2 - p1 * 0.5, Y(0.5), p1 * 0.5); txt(ctx, t1, cx + p1 * 0.3, Y(0.5), p1, '#ffd54a'); gem(ctx, cx - tw(ctx, t2, p1) / 2 - p1 * 0.5, Y(0.6), p1 * 0.5); txt(ctx, t2, cx + p1 * 0.3, Y(0.6), p1, '#7fd4ff'); ctx.restore(); hit(ui, 0, T0, W, HH, () => { game.evoChest = null; }); } } }
    // --- rapport de zone (victoire) ---
    if (last && last.zone2) {
      const S2 = S, NAMES = { rk5: 'AILES', rk10: 'REACTEUR', rk15: 'TURBO', weak: '1ER ENNEMI TROP FORT', d300: '300 M', d1000: '1000 M', d2000: '2000 M', boss: 'BOSS VAINCU' };
      const ms = Object.keys(S2.marks || {}).filter((k) => NAMES[k]).sort((a, b) => S2.marks[a].sec - S2.marks[b].sec).slice(0, 6);
      panel(ctx, W * 0.06, Y(0.17), W * 0.88, Y(0.17 + 0.05 + ms.length * 0.045) - Y(0.17), u * 0.05, 'rgba(20,34,70,0.92)', 'rgba(10,20,46,0.92)', '#0c1a3a'); txt(ctx, '+' + (game.evoClearBonus || 600) + ' PIECES', cx, Y(0.2), u * 0.09, '#ffd54a');
      ms.forEach((k, i) => txt(ctx, NAMES[k] + ' : VOL ' + S2.marks[k].run + '  ' + E.fmt(S2.marks[k].sec), cx, Y(0.255 + i * 0.045), fit(ctx, NAMES[k] + ' : VOL 99  99:99', W * 0.8, u * 0.055), k === 'boss' ? '#ffd54a' : '#e4ecff', { sw: 0.14 }));
    }
    // --- appuyez pour voler ---
    { const p = 1 + 0.04 * Math.sin(now / 280), s = 'APPUYEZ POUR VOLER'; ctx.save(); ctx.translate(cx, Y(0.655)); ctx.scale(p, p); txt(ctx, s, 0, 0, fit(ctx, s, W * 0.9, u * 0.085), '#ffffff', { sw: 0.2 }); ctx.restore(); }
    // --- pied : vols, remise a zero discrete ---
    { const fy = Y(0.972), st = 'VOLS ' + S.runs + '  TEMPS ' + E.fmt(E.elapsed(game)), sp = u * 0.04; txt(ctx, st, W * 0.04, fy, sp, 'rgba(210,220,240,0.7)', { align: 'left', shadow: false, sw: 0.1 });
      const armed = game.evoResetArm && now - game.evoResetArm < 4000, lab = armed ? 'SUR ? RE-TOUCHE' : 'REINITIALISER', w = tw(ctx, lab, sp) + sp; txt(ctx, lab, W * 0.96, fy, sp, armed ? '#ff8a7a' : 'rgba(210,220,240,0.55)', { align: 'right', shadow: false, sw: 0.1 });
      hit(ui, W * 0.96 - w, fy - sp, w, sp * 2, () => { if (armed) E.reset(game); else game.evoResetArm = performance.now(); }); }
    // --- toucher la scene : lancer (en dernier : les boutons ci-dessus gardent la priorite) ---
    hit(ui, 0, Y(0.16), W, Y(0.71) - Y(0.16), () => E.start(game));
  };

  // ---------- RAPPORT DE VOL (sur le lieu du crash) ----------
  Home.drawEvoReport = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), last = game.evoLast, now = performance.now(), cx = W / 2;
    if (!last) { game.ui.overlay = 'evo'; return; }
    if (!last.t0) last.t0 = now; const tt = (now - last.t0) / 1000, adsOn = !!(game.ads && game.ads.enabled());
    { const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, 'rgba(6,10,20,0.55)'); g.addColorStop(0.6, 'rgba(6,10,20,0.15)'); g.addColorStop(1, 'rgba(6,10,20,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); }
    topBar(ui, ctx, game, W, T0, u, S, E);
    const tk = U.clamp(tt / 0.4, 0, 1), sc = 0.6 + 0.4 * ease(tk), ty = Y(0.15);
    ctx.save(); ctx.globalAlpha = tk; ctx.translate(cx, ty); ctx.scale(sc, sc); txt(ctx, 'RAPPORT DE VOL', 0, 0, fit(ctx, 'RAPPORT DE VOL', W * 0.92, u * 0.17), '#ffffff', { grad: ['#fff2a0', '#ffa818'], stroke: '#7a3a08', sw: 0.2 }); ctx.restore();
    const cause = last.crash === 'weak' && last.detail ? last.detail : last.cause; txt(ctx, cause, cx, Y(0.2), fit(ctx, cause, W * 0.88, u * 0.05), last.crash === 'weak' ? '#ffb0a0' : '#dde6f6', { sw: 0.14 });
    // panneau bleu : lignes
    const px0 = W * 0.06, pw = W * 0.88, py0 = Y(0.235), rowH = u * 0.16, rows = [];
    rows.push({ k: 'pin', lab: 'DISTANCE ' + last.dist + ' M', val: last.lines[0] ? last.lines[0][1] : 0 });
    if (last.kills) rows.push({ k: 'kill', lab: 'ENNEMIS ' + last.kills, val: last.lines.length > 1 && /^ENNEMIS/.test(last.lines[1][0]) ? last.lines[1][1] : 0 });
    for (const ln of last.lines) if (/^PUB/.test(ln[0])) rows.push({ k: 'ad', lab: ln[0], val: ln[1] });
    const mrow = rowH * 0.78, tot = rowH * 1.35, ph = rowH * rows.length + mrow + tot + u * 0.045;
    panel(ctx, px0, py0, pw, ph, u * 0.06, '#2f6fe8', '#1a44b8', '#0a1e5a');
    let yy = py0 + u * 0.03;
    rows.forEach((r, i) => { const a = U.clamp((tt - 0.25 - i * 0.18) / 0.3, 0, 1), y = yy + i * rowH; ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * u * 0.03);
      panel(ctx, px0 + u * 0.03, y + rowH * 0.06, pw - u * 0.06, rowH * 0.88, rowH * 0.3, '#3d7cf4', '#2757c8', '#12307a', { shadow: false });
      if (r.k === 'pin') { ctx.beginPath(); ctx.arc(px0 + u * 0.12, y + rowH * 0.42, rowH * 0.24, 0, 6.2832); ctx.fillStyle = '#e8352c'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.beginPath(); ctx.arc(px0 + u * 0.12, y + rowH * 0.4, rowH * 0.09, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill(); }
      else if (r.k === 'kill') { txt(ctx, 'X', px0 + u * 0.12, y + rowH * 0.5, rowH * 0.5, '#ff6a5a'); } else { txt(ctx, '>>', px0 + u * 0.12, y + rowH * 0.5, rowH * 0.4, '#7bffa0'); }
      txt(ctx, r.lab, px0 + u * 0.2, y + rowH * 0.5, fit(ctx, r.lab, pw * 0.42, rowH * 0.32), '#ffffff', { align: 'left', sw: 0.16 });
      const vs = U.formatInt(Math.round(r.val * ease(tt / 1.0))), vp = rowH * 0.46; coin(ctx, px0 + pw - u * 0.1, y + rowH * 0.5, vp * 0.5); txt(ctx, vs, px0 + pw - u * 0.16, y + rowH * 0.5, vp, '#ffd54a', { align: 'right', stroke: '#6a3406' }); ctx.restore(); });
    { const y = yy + rowH * rows.length, a = U.clamp((tt - 0.3 - rows.length * 0.18) / 0.3, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 12; k++) ctx.fillRect(px0 + u * 0.04 + k * (pw - u * 0.08) / 12, y + mrow * 0.02, (pw - u * 0.08) / 24, 3);
      txt(ctx, 'X', px0 + u * 0.12, y + mrow * 0.55, mrow * 0.55, '#6aff8a'); txt(ctx, 'MULTIPLICATEUR', px0 + u * 0.2, y + mrow * 0.55, fit(ctx, 'MULTIPLICATEUR', pw * 0.42, mrow * 0.34), '#7fe8ff', { align: 'left', sw: 0.16 }); txt(ctx, 'X' + f1(E.mult(S.cm)), px0 + pw - u * 0.06, y + mrow * 0.55, mrow * 0.5, '#7fe8ff', { align: 'right' }); ctx.restore(); }
    { const y = yy + rowH * rows.length + mrow, a = U.clamp((tt - 0.5 - rows.length * 0.18) / 0.35, 0, 1), pop = 1 + 0.06 * Math.sin(U.clamp(tt - 0.8 - rows.length * 0.18, 0, 0.3) * 10.47);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, y + tot / 2); ctx.scale(pop, pop); ctx.translate(-cx, -(y + tot / 2)); panel(ctx, px0 + u * 0.03, y, pw - u * 0.06, tot, tot * 0.22, '#ffc531', '#e88a10', '#fff2b0', { shadow: false });
      txt(ctx, 'TOTAL', cx, y + tot * 0.24, tot * 0.26, '#ffffff', { stroke: '#8a4c0c' }); const vs = U.formatInt(Math.round(last.total * ease((tt - 0.4) / 1.2))); txt(ctx, vs, cx - u * 0.04, y + tot * 0.67, fit(ctx, vs, pw * 0.5, tot * 0.5), '#ffffff', { stroke: '#8a4c0c', sw: 0.16 }); coin(ctx, cx + tw(ctx, vs, fit(ctx, vs, pw * 0.5, tot * 0.5)) / 2 + u * 0.03, y + tot * 0.67, tot * 0.2); ctx.restore(); }
    if (last.record && Math.sin(now / 150) > -0.5) txt(ctx, 'RECORD !', cx, py0 + ph + u * 0.07, u * 0.08, '#ffd54a', { stroke: '#7a3a08' });
    // curseur de pub : x1,5 a x4
    const by0 = py0 + ph + u * 0.16;
    if (adsOn && tt > 0.9) {
      const bw = W * 0.88, bh = u * 0.24, bx = cx - bw / 2; panel(ctx, bx, by0, bw, bh, u * 0.05, '#b060f4', '#7a34d0', '#34126a');
      const sw2 = bw * 0.9, sx = cx - sw2 / 2, sY = by0 + bh * 0.56, sh = bh * 0.3, X = (v) => sx + sw2 * (v + 1) / 2;
      if (!last.mult) last.cur = Math.sin((now - last.t0) / 520); const lock = !!last.mult, pos = lock ? last.mult.p : last.cur, mv = lock ? last.mult.m : multAt(pos);
      const edges = [[-1, -0.75, 1.5], [-0.75, -0.45, 2], [-0.45, -0.2, 3], [-0.2, 0.2, 4], [0.2, 0.45, 3], [0.45, 0.75, 2], [0.75, 1, 1.5]];
      ctx.save(); path(ctx, sx, sY, sw2, sh, sh * 0.3); ctx.clip(); for (const [v0, v1, m] of edges) { ctx.fillStyle = MCOL[m]; ctx.fillRect(X(v0), sY, X(v1) - X(v0) + 1, sh); } ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(sx, sY, sw2, sh * 0.4); ctx.restore(); path(ctx, sx, sY, sw2, sh, sh * 0.3); ctx.lineWidth = Math.max(2, sh * 0.1); ctx.strokeStyle = '#1e0a46'; ctx.stroke();
      for (const [v0, v1, m] of edges) { const lbl = 'X' + (m === 1.5 ? '1,5' : m); txt(ctx, lbl, (X(v0) + X(v1)) / 2, by0 + bh * 0.27, fit(ctx, lbl, (X(v1) - X(v0)) * 0.92, bh * 0.19), '#ffffff', { stroke: '#34126a', sw: 0.2, shadow: false }); }
      const x = X(pos), cw2 = Math.max(3, sh * 0.14); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - cw2 / 2, sY - sh * 0.15, cw2, sh * 1.3); ctx.beginPath(); ctx.moveTo(x - sh * 0.32, sY - sh * 0.55); ctx.lineTo(x + sh * 0.32, sY - sh * 0.55); ctx.lineTo(x, sY - sh * 0.12); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1e0a46'; ctx.stroke();
      // boutons : multiplier / suivant
      const b2y = by0 + bh + u * 0.05, b2h = u * 0.2, wA = bw * 0.58, wB = bw * 0.38, onA = inRect(ui, bx, b2y, wA, b2h);
      if (!last.doubled) { panel(ctx, bx, b2y, wA, b2h, b2h * 0.3, onA ? '#c47cff' : '#b060f4', '#7a34d0', '#34126a'); const s1 = 'MULTIPLIER', s2 = 'ET RECUPERER'; txt(ctx, s1, bx + wA * 0.46, b2y + b2h * 0.36, fit(ctx, s1, wA * 0.7, b2h * 0.3), '#ffffff', { stroke: '#34126a' }); txt(ctx, s2, bx + wA * 0.46, b2y + b2h * 0.68, fit(ctx, s2, wA * 0.7, b2h * 0.26), '#ffffff', { stroke: '#34126a' }); panel(ctx, bx + wA - b2h * 0.5, b2y - b2h * 0.3, b2h * 0.5, b2h * 0.4, b2h * 0.1, '#ffb020', '#e07808', '#6a3406', { shadow: false }); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(bx + wA - b2h * 0.34, b2y - b2h * 0.21); ctx.lineTo(bx + wA - b2h * 0.34, b2y - b2h * 0.01); ctx.lineTo(bx + wA - b2h * 0.14, b2y - b2h * 0.11); ctx.closePath(); ctx.fill();
        hit(ui, bx, b2y, wA, b2h, () => { if (last.mult) return; last.mult = { m: mv, p: pos }; game.audio.play('uiTick'); setTimeout(() => game.ads.rewarded(() => E.multiply(game, mv), null, 'coins'), 420); }); }
      else txt(ctx, 'PUB X' + (last.doubled === 1.5 ? '1,5' : last.doubled) + ' !', bx + wA / 2, b2y + b2h / 2, b2h * 0.4, '#ffd54a', { stroke: '#7a3a08' });
      const nx = bx + bw - wB, onB = inRect(ui, nx, b2y, wB, b2h); panel(ctx, nx, b2y, wB, b2h, b2h * 0.3, onB ? '#7af06a' : '#4cd844', '#26a02a', '#0e4a14'); txt(ctx, 'SUIVANT', nx + wB / 2, b2y + b2h / 2, fit(ctx, 'SUIVANT', wB * 0.86, b2h * 0.36), '#ffffff', { stroke: '#0e4a14' }); hit(ui, nx, b2y, wB, b2h, () => E.afterReport(game));
    } else {
      const bw = W * 0.6, b2h = u * 0.2, b2y = by0 + u * 0.1, nx = cx - bw / 2; panel(ctx, nx, b2y, bw, b2h, b2h * 0.3, '#4cd844', '#26a02a', '#0e4a14'); txt(ctx, 'SUIVANT', cx, b2y + b2h / 2, b2h * 0.4, '#ffffff', { stroke: '#0e4a14' }); hit(ui, nx, b2y, bw, b2h, () => E.afterReport(game));
    }
  };
  // ---------- REGLAGES (meme style) ----------
  const _oldSettings = Home.drawSettings;
  Home.drawSettings = function (ui, ctx, game, W, H) {
    if (!(CC.EVO && CC.EVO.on)) return _oldSettings.call(this, ui, ctx, game, W, H);
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), s = game.settings, E = CC.EVO, cx = W / 2, now = performance.now();
    const vib = ['NON', 'FAIBLE', 'MOYEN', 'FORT'], vibV = s.vibration !== undefined ? s.vibration : 2;
    ctx.fillStyle = 'rgba(8,14,28,0.86)'; ctx.fillRect(0, T0, W, HH);
    txt(ctx, 'REGLAGES', cx, Y(0.075), fit(ctx, 'REGLAGES', W * 0.8, u * 0.14), '#ffffff', { grad: ['#fff2a0', '#ffa818'], stroke: '#7a3a08', sw: 0.2 });
    const rows = [
      ['SON', s.sfx > 0, s.sfx > 0 ? 'OUI' : 'NON', () => ui.toggleVolume(game, 'sfx')],
      ['MUSIQUE', s.music > 0, s.music > 0 ? 'OUI' : 'NON', () => ui.toggleVolume(game, 'music')],
      ['VIBRATION', vibV > 0, vib[vibV], () => { s.vibration = (vibV + 1) % 4; if (CC.Haptics) { CC.Haptics.setLevel(s.vibration); CC.Haptics.tick('fire'); } game.applySettings(); }],
      ['GRAPHISMES', true, ui.graphicsLabel(game), () => ui.cycleGraphics(game)],
      ['COMMANDES', true, (s.ctl || 'free') === 'simple' ? 'SIMPLES' : 'LIBRES', () => { s.ctl = (s.ctl || 'free') === 'simple' ? 'free' : 'simple'; game.applySettings(); }],
      ['SENSIBILITE', true, ['DOUCE', 'NORMALE', 'VIVE'][s.touchSens !== undefined ? s.touchSens : 1], () => { s.touchSens = ((s.touchSens !== undefined ? s.touchSens : 1) + 1) % 3; game.applySettings(); }],
      ['PUBS', s.ads !== false, s.ads === false ? 'NON' : 'OUI', () => { s.ads = s.ads === false; game.applySettings(); }],
      ['CODE DE SAUVEGARDE', true, 'COPIER', () => { const c = game.meta.exportCode(); if (!c) return; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(() => Home.toast(ui, 'CODE COPIE'), () => window.prompt('Copie ce code', c)); else window.prompt('Copie ce code', c); }],
      ['RESTAURER UN CODE', true, 'COLLER', () => { const c = window.prompt('Colle ton code de sauvegarde'); if (c) { if (game.meta.importCode(c)) location.reload(); else Home.toast(ui, 'CODE INVALIDE'); } }],
      ['REINITIALISER', false, ui._rst && now - ui._rst < 4000 ? 'SUR ?' : 'GO', () => { if (ui._rst && performance.now() - ui._rst < 4000) { try { localStorage.removeItem('coldimpact.save'); localStorage.removeItem('closecall.save'); } catch (e) { /* ignore */ } location.reload(); } else ui._rst = performance.now(); }],
    ];
    const gap = HH * 0.012, rh = Math.min(u * 0.15, (HH * 0.74) / rows.length - gap), y0 = Y(0.135), x0 = W * 0.06, w = W * 0.88;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + gap), on = inRect(ui, x0, y, w, rh); panel(ctx, x0, y, w, rh, rh * 0.3, on ? '#4a5c86' : '#33405e', '#222e4a', '#0c1630');
      txt(ctx, r[0], x0 + rh * 0.4, y + rh / 2, fit(ctx, r[0], w * 0.5, rh * 0.42), '#ffffff', { align: 'left', sw: 0.16 });
      const vw = Math.max(rh * 1.7, tw(ctx, r[2], rh * 0.4) + rh * 0.6), vx = x0 + w - rh * 0.3 - vw, good = r[1];
      panel(ctx, vx, y + rh * 0.16, vw, rh * 0.68, rh * 0.34, good ? '#4cd844' : '#6a7690', good ? '#26a02a' : '#434e68', good ? '#0e4a14' : '#1c2438', { shadow: false }); txt(ctx, r[2], vx + vw / 2, y + rh / 2, fit(ctx, r[2], vw * 0.9, rh * 0.4), '#ffffff', { stroke: good ? '#0e4a14' : '#1c2438', sw: 0.16 });
      hit(ui, x0, y, w, rh, r[3]);
    });
    if (Home.drawToast) Home.drawToast(ui, ctx, L);
    const bw = W * 0.5, bh = u * 0.15, bx = cx - bw / 2, by = Y(0.92); panel(ctx, bx, by, bw, bh, bh * 0.3, '#4cd844', '#26a02a', '#0e4a14'); txt(ctx, 'RETOUR', cx, by + bh / 2, bh * 0.46, '#ffffff', { stroke: '#0e4a14' });
    hit(ui, bx, by, bw, bh, () => { ui.overlay = (CC.EVO && CC.EVO.on && game.state === 'MENU') ? 'evo' : null; });
  };
})();
