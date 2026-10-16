/* v157 : INTERFACE du mode evolution, style « jeu pro » a plat : panneaux sombres a fin liseré, texte clair a espacement large, icones nettes,
 * barre d'onglets en bas (niveaux, coffre, JOUER, gemmes, reglages). Peu d'infos : pieces et gemmes en haut, trois cartes d'amelioration, c'est tout.
 * Le rapport de vol (overlay 'evoReport') s'affiche sur le lieu du crash : lignes, total, curseur de pub x1,5 a x4, SUIVANT. */
(function () {
  const U = CC.U, Home = CC.Home; if (!Home) return;
  const FONT = '"Chakra Petch","Saira Semi Condensed","Trebuchet MS",sans-serif';
  try { if (document.fonts && document.fonts.load) document.fonts.load('700 20px "Chakra Petch"'); } catch (e) { /* police de secours */ }
  const hit = (ui, x, y, w, h, a) => ui.buttons.push({ x, y, w, h, action: a });
  const inRect = (ui, x, y, w, h) => !ui.isTouch() && ui.mouse.x >= x && ui.mouse.x <= x + w && ui.mouse.y >= y && ui.mouse.y <= y + h;
  // palette
  const C = { bg: 'rgba(14,15,18,0.9)', bg2: '#17181c', line: '#2e3036', line2: '#4a4d55', text: '#ececee', sub: '#9ea3ad', green: '#2fb457', greenD: '#1c7a3a', mag: '#c23ad2', magD: '#7a1f86', gold: '#f2b84a', red: '#ff6a5a', gem: '#e070ee', blue: '#4aa8ff', orange: '#ff9a3c' };
  function path(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const setF = (ctx, px, ls) => { ctx.font = '700 ' + px + 'px ' + FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = (ls === undefined ? px * 0.06 : ls) + 'px'; };
  // texte : clair, espacement large, ombre douce ; contour seulement si demande
  function txt(ctx, s, x, y, px, fill, o) {
    o = o || {}; ctx.save(); setF(ctx, px, o.ls); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(s, x, y + px * 0.07); }
    if (o.stroke) { ctx.lineWidth = px * (o.sw || 0.16); ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
    if (o.grad) { const g = ctx.createLinearGradient(0, y - px * 0.5, 0, y + px * 0.5); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); ctx.fillStyle = g; } else ctx.fillStyle = fill || C.text;
    ctx.fillText(s, x, y); ctx.restore();
  }
  const tw = (ctx, s, px, ls) => { ctx.save(); setF(ctx, px, ls); const w = ctx.measureText(s).width; ctx.restore(); return w; };
  const fit = (ctx, s, maxW, px) => { const w = tw(ctx, s, px); return w > maxW ? px * maxW / w : px; };
  // panneau plat : fond uni, liseré, coins peu arrondis (les couleurs 7 et 8 : compatibilite avec l'ancienne signature)
  function panel(ctx, x, y, w, h, r, fill, fill2, border, o) {
    o = o || {}; path(ctx, x, y, w, h, Math.min(r, o.maxR || 9)); ctx.fillStyle = fill && fill.length ? fill : C.bg; ctx.fill();
    if (o.shine) { ctx.save(); path(ctx, x, y, w, h, Math.min(r, 9)); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y, w, h * 0.45); ctx.restore(); }
    if (border !== null) { path(ctx, x, y, w, h, Math.min(r, o.maxR || 9)); ctx.lineWidth = Math.max(1.5, h * (o.bw || 0.028)); ctx.strokeStyle = border || C.line; ctx.stroke(); }
  }
  // ---------- icones plates ----------
  function coin(ctx, cx, cy, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.strokeStyle = '#a8701a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, 6.2832); ctx.lineWidth = Math.max(1, r * 0.12); ctx.strokeStyle = 'rgba(168,112,26,0.85)'; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(cx - r * 0.12, cy - r * 0.34, r * 0.24, r * 0.68); ctx.restore();
  }
  function gem(ctx, cx, cy, r) {
    ctx.save(); ctx.lineJoin = 'round'; const pts = [[-1, -0.25], [-0.55, -0.9], [0.55, -0.9], [1, -0.25], [0, 1]];
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(cx + p[0] * r, cy + p[1] * r) : ctx.moveTo(cx + p[0] * r, cy + p[1] * r))); ctx.closePath(); ctx.fillStyle = C.gem; ctx.fill();
    ctx.fillStyle = '#f6b4fb'; ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy - r * 0.9); ctx.lineTo(cx + r * 0.55, cy - r * 0.9); ctx.lineTo(cx + r * 0.32, cy - r * 0.25); ctx.lineTo(cx - r * 0.32, cy - r * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b04cc0'; ctx.beginPath(); ctx.moveTo(cx + r * 0.32, cy - r * 0.25); ctx.lineTo(cx + r, cy - r * 0.25); ctx.lineTo(cx, cy + r); ctx.closePath(); ctx.fill();
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(cx + p[0] * r, cy + p[1] * r) : ctx.moveTo(cx + p[0] * r, cy + p[1] * r))); ctx.closePath(); ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = '#5a1a68'; ctx.stroke(); ctx.restore();
  }
  function gear(ctx, cx, cy, r, col) {
    ctx.save(); ctx.fillStyle = col || '#ffffff'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; for (const [da, rad] of [[-0.2, r * 0.74], [-0.13, r], [0.13, r], [0.2, r * 0.74]]) ctx.lineTo(cx + Math.cos(a + da) * rad, cy + Math.sin(a + da) * rad); } ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  function chest(ctx, cx, cy, r, open, glow) {
    ctx.save();
    if (glow) { const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.7); gr.addColorStop(0, 'rgba(255,214,110,' + glow + ')'); gr.addColorStop(1, 'rgba(255,214,110,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4); }
    const w = r * 1.6, h = r * 0.95, x = cx - w / 2, y = cy - h * 0.08; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.strokeStyle = '#3a2410';
    ctx.fillStyle = '#b87a34'; path(ctx, x, y, w, h, r * 0.1); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5622'; ctx.fillRect(x, y + h * 0.5, w, h * 0.12);
    ctx.save(); ctx.translate(x, y); if (open) ctx.rotate(-0.55); ctx.fillStyle = '#d4934a'; path(ctx, 0, -h * 0.5, w, h * 0.56, r * 0.22); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.gold; ctx.fillRect(x + w * 0.1, y, w * 0.1, h); ctx.fillRect(x + w * 0.8, y, w * 0.1, h); ctx.beginPath(); ctx.arc(cx, y + h * 0.3, r * 0.15, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function levelsIcon(ctx, cx, cy, r) { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, r * 0.16); ctx.lineJoin = 'round'; path(ctx, cx - r, cy - r, r * 2, r * 2, r * 0.18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy + r * 0.55); ctx.lineTo(cx + r * 0.55, cy - r * 0.55); ctx.stroke(); ctx.restore(); }
  function playIcon(ctx, cx, cy, r, col) { ctx.save(); ctx.fillStyle = col || '#fff'; ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy - r * 0.85); ctx.lineTo(cx + r * 0.85, cy); ctx.lineTo(cx - r * 0.55, cy + r * 0.85); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function adTicket(ctx, cx, cy, r) { ctx.save(); ctx.fillStyle = C.orange; path(ctx, cx - r, cy - r * 0.7, r * 2, r * 1.4, r * 0.25); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy - r * 0.38); ctx.lineTo(cx + r * 0.45, cy); ctx.lineTo(cx - r * 0.3, cy + r * 0.38); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function star(ctx, cx, cy, r) {
    ctx.save(); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, rad = k % 2 ? r * 0.46 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } ctx.closePath();
    ctx.fillStyle = C.gold; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = '#a8701a'; ctx.stroke(); ctx.restore();
  }
  // fusee a plat : le palier se voit (carton, ailes, reacteur, turbo)
  function rocket(ctx, cx, cy, s, tier, flame) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.strokeStyle = '#15161a';
    const card = tier < 2, body = card ? '#e6c690' : '#f2f4f8', red = card ? '#b98a52' : '#e5392b', wing = card ? '#cfa466' : '#d8dee8';
    if (flame) { const fh = s * (1.4 + 0.3 * Math.sin(performance.now() / 70)); ctx.fillStyle = '#ffae2e'; ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy + s * 1.9); ctx.quadraticCurveTo(cx, cy + s * 1.9 + fh * 1.1, cx + s * 0.3, cy + s * 1.9); ctx.fill(); ctx.fillStyle = '#fff1b0'; ctx.beginPath(); ctx.moveTo(cx - s * 0.15, cy + s * 1.9); ctx.quadraticCurveTo(cx, cy + s * 1.9 + fh * 0.6, cx + s * 0.15, cy + s * 1.9); ctx.fill(); }
    if (tier >= 3) for (const sd of [-1, 1]) { path(ctx, cx + sd * s * 0.8 - s * 0.2, cy - s * 0.5, s * 0.4, s * 2.3, s * 0.2); ctx.fillStyle = '#cf3a2a'; ctx.fill(); ctx.stroke(); }
    if (tier >= 1) for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * s * 0.4, cy + s * 0.05); ctx.lineTo(cx + sd * s * 1.8, cy + s * 1.15); ctx.lineTo(cx + sd * s * 1.7, cy + s * 1.45); ctx.lineTo(cx + sd * s * 0.4, cy + s * 1.05); ctx.closePath(); ctx.fillStyle = wing; ctx.fill(); ctx.stroke(); }
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * s * 0.4, cy + s * 1.2); ctx.lineTo(cx + sd * s * 1.0, cy + s * 2.0); ctx.lineTo(cx + sd * s * 0.4, cy + s * 2.0); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke(); }
    path(ctx, cx - s * 0.46, cy - s * 1.3, s * 0.92, s * 3.2, s * 0.35); ctx.fillStyle = body; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - s * 0.46, cy - s * 1.2); ctx.quadraticCurveTo(cx, cy - s * 2.9, cx + s * 0.46, cy - s * 1.2); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke();
    if (tier >= 2) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - s * 0.45, cy + s * 0.9, s * 0.9, s * 0.2); }
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.3, s * 0.27, 0, 6.2832); ctx.fillStyle = '#58c4ff'; ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function launcher(ctx, cx, cy, s, tier) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#15161a';
    if (tier === 0) { ctx.fillStyle = '#b07a42'; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.moveTo(cx - s * 1.9, cy + s * 1.1); ctx.lineTo(cx + s * 1.9, cy - s * 0.7); ctx.lineTo(cx + s * 1.9, cy - s * 0.25); ctx.lineTo(cx - s * 1.9, cy + s * 1.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5a2c'; ctx.fillRect(cx + s * 1.1, cy - s * 0.3, s * 0.25, s * 1.8); ctx.fillRect(cx - s * 1.0, cy + s * 0.4, s * 0.25, s * 1.2); }
    else if (tier === 1) { ctx.lineWidth = s * 0.28; ctx.strokeStyle = '#6a7482'; for (const o of [-0.35, 0.35]) { ctx.beginPath(); ctx.moveTo(cx - s * 1.9, cy + s * (1.2 + o * 0.3)); ctx.lineTo(cx + s * 1.9, cy + s * (-0.6 + o * 0.3)); ctx.stroke(); } ctx.lineWidth = s * 0.12; ctx.strokeStyle = '#58c4ff'; ctx.beginPath(); ctx.moveTo(cx - s * 1.8, cy + s * 1.2); ctx.lineTo(cx + s * 1.8, cy - s * 0.6); ctx.stroke(); }
    else { ctx.lineWidth = s * 0.1; ctx.fillStyle = '#4a5666'; path(ctx, cx - s * 1.8, cy + s * 1.1, s * 3.6, s * 0.5, s * 0.15); ctx.fill(); ctx.stroke(); ctx.strokeStyle = C.gold; ctx.lineWidth = s * 0.34; ctx.beginPath(); ctx.moveTo(cx - s * 1.2, cy + s * 1.1); ctx.lineTo(cx + s * 1.2, cy - s * 1.1); ctx.stroke(); ctx.strokeStyle = '#a8b4c4'; ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy + s * 1.1); for (let k = 0; k < 6; k++) ctx.lineTo(cx - s * 0.1 + (k % 2 ? -1 : 1) * s * 0.3, cy + s * (0.9 - k * 0.24)); ctx.stroke(); }
    ctx.restore();
  }
  function wallet(ctx, cx, cy, s) { for (let k = 2; k >= 0; k--) { const y = cy + s * 0.5 - k * s * 0.36; ctx.save(); ctx.beginPath(); ctx.ellipse(cx, y, s * 0.95, s * 0.38, 0, 0, 6.2832); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.strokeStyle = '#a8701a'; ctx.stroke(); ctx.restore(); } coin(ctx, cx + s * 0.9, cy - s * 0.5, s * 0.46); }
  const secFmt = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  const MULT = [[0.2, 4], [0.45, 3], [0.75, 2], [1.01, 1.5]];
  const multAt = (p) => { const a = Math.abs(p); for (const [t, m] of MULT) if (a < t) return m; return 1.5; };
  const MCOL = { 4: '#f2b84a', 3: '#2fb457', 2: '#4aa8ff', 1.5: '#8a8f9a' };
  const ease = (k) => 1 - Math.pow(1 - U.clamp(k, 0, 1), 3);
  Home.evoUI = { txt, tw, fit, panel, coin, gem, star, path };

  // barre du haut : pieces et gemmes (touche = gemme contre pub)
  function topBar(ui, ctx, game, W, T0, u, S, E) {
    const h = u * 0.095, y = T0 + u * 0.035, px = h * 0.5, x0 = W * 0.04, fxg = game.evoGemFx;
    const cs = U.formatInt(S.coins), cw = tw(ctx, cs, px) + h * 1.35;
    panel(ctx, x0, y, cw, h, 8, C.bg, null, C.line); coin(ctx, x0 + h * 0.52, y + h / 2, h * 0.3); txt(ctx, cs, x0 + h * 0.98, y + h / 2, px, C.text, { align: 'left' });
    const gs = String(S.gems || 0), gx = x0 + cw + W * 0.025, gw = tw(ctx, gs, px) + h * 2.1, pulse = fxg ? U.clamp(1 - (performance.now() - fxg.t0) / 900, 0, 1) : 0;
    panel(ctx, gx, y, gw, h, 8, pulse > 0 ? '#3a1a44' : C.bg, null, pulse > 0 ? C.gem : C.line); gem(ctx, gx + h * 0.5, y + h / 2, h * 0.3 * (1 + 0.25 * pulse)); txt(ctx, gs, gx + h * 0.98, y + h / 2, px, C.text, { align: 'left' });
    panel(ctx, gx + gw - h * 0.88, y + h * 0.14, h * 0.72, h * 0.72, 6, C.green, null, null); txt(ctx, '+', gx + gw - h * 0.52, y + h * 0.5, h * 0.62, '#fff', { shadow: false, ls: 0 });
    hit(ui, gx, y, gw, h, () => E.gemAd(game));
    if (fxg && pulse > 0) { ctx.save(); ctx.globalAlpha = pulse; txt(ctx, '+' + fxg.n, gx + h * 0.9, y + h * 1.5 - (1 - pulse) * h * 0.4, px, C.gem); ctx.restore(); }
    if (game.evoCoinFx) { const cf = game.evoCoinFx, k = U.clamp(1 - (performance.now() - cf.t0) / 1100, 0, 1); if (k <= 0) game.evoCoinFx = null; else { ctx.save(); ctx.globalAlpha = k; txt(ctx, '+' + U.formatInt(cf.n), x0 + cw * 0.5, y + h * 1.5 - (1 - k) * h * 0.5, px, C.gold); ctx.restore(); } }
    return y + h;
  }

  // ---------- MENU ----------
  Home.drawEvo = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), last = game.evoLast, now = performance.now(), cx = W / 2, anim = game.evoAnim;
    topBar(ui, ctx, game, W, T0, u, S, E);
    if (anim) {
      const a = U.clamp(anim.t / 0.4, 0, 1) * (1 - U.smooth(anim.dur - 0.6, anim.dur, anim.t)), name = anim.label + ' !';
      ctx.save(); ctx.globalAlpha = a; txt(ctx, name, cx, Y(0.2), fit(ctx, name, W * 0.9, u * 0.15), C.gold); txt(ctx, 'NOUVELLE PIECE', cx, Y(0.275), u * 0.05, C.text); ctx.restore(); return;
    }
    // voile bas
    { const g = ctx.createLinearGradient(0, Y(0.62), 0, Y(0.68)); g.addColorStop(0, 'rgba(6,7,9,0)'); g.addColorStop(1, 'rgba(6,7,9,0.82)'); ctx.fillStyle = g; ctx.fillRect(0, Y(0.62), W, Y(0.68) - Y(0.62)); ctx.fillStyle = 'rgba(6,7,9,0.82)'; ctx.fillRect(0, Y(0.68), W, HH); }
    // rapport de zone (victoire)
    if (last && last.zone2) {
      const NAMES = { rk5: 'AILES', rk10: 'REACTEUR', rk15: 'TURBO', weak: '1ER ENNEMI TROP FORT', d300: '300 M', d1000: '1000 M', d2000: '2000 M', boss: 'BOSS VAINCU' };
      const ms = Object.keys(S.marks || {}).filter((k) => NAMES[k]).sort((a, b) => S.marks[a].sec - S.marks[b].sec).slice(0, 6), ph = HH * (0.1 + ms.length * 0.045);
      panel(ctx, W * 0.06, Y(0.16), W * 0.88, ph, 10, C.bg, null, C.line); txt(ctx, '+' + (game.evoClearBonus || 600) + ' PIECES', cx, Y(0.2), u * 0.08, C.gold);
      ms.forEach((k, i) => txt(ctx, NAMES[k] + '  -  VOL ' + S.marks[k].run + '  ' + E.fmt(S.marks[k].sec), cx, Y(0.255 + i * 0.045), fit(ctx, NAMES[k] + '  -  VOL 99  99:99', W * 0.8, u * 0.05), k === 'boss' ? C.gold : C.text, { shadow: false }));
    }
    // appuyez pour voler
    { const p = 0.65 + 0.35 * Math.sin(now / 420), s = 'APPUYEZ POUR VOLER'; ctx.save(); ctx.globalAlpha = p; txt(ctx, s, cx, Y(0.645), fit(ctx, s, W * 0.8, u * 0.052), '#ffffff', { ls: u * 0.012 }); ctx.restore(); }
    // --- trois cartes d'amelioration ---
    const ids = ['rk', 'la', 'cm'], cy0 = Y(0.69), chh = HH * 0.265, gap = W * 0.02, cw = (W * 0.92 - gap * 2) / 3, tint = { rk: C.green, la: C.blue, cm: C.orange };
    const cards = [];
    ids.forEach((id, i) => {
      const n = S[id], max = E.MAXN[id], x = W * 0.04 + i * (cw + gap), cost = E.nextCost(game, id), can = cost !== null && S.coins >= cost, done = n >= max, tc = tint[id];
      const name = id === 'rk' ? 'FUSEE' : id === 'la' ? 'LANCEUR' : 'REVENU', tdone = id === 'rk' ? E.rocket(n).s : id === 'la' ? E.launcher(n).s : Math.min(5, n);
      const shk = game.evoShake && game.evoShake.id === id && now - game.evoShake.t0 < 350 ? Math.sin((now - game.evoShake.t0) / 25) * u * 0.012 : 0, bt = game.evoBought, bk = bt && bt.id === id ? U.clamp(1 - (now - bt.t0) / 520, 0, 1) : 0, k2 = 1 + 0.06 * Math.sin(bk * 3.1416);
      const rx = x + shk, ccx = rx + cw / 2, ccy = cy0 + chh / 2;
      ctx.save(); ctx.translate(ccx, ccy); ctx.scale(k2, k2); ctx.translate(-ccx, -ccy);
      panel(ctx, rx, cy0, cw, chh, 10, C.bg, null, can ? tc : C.line, { bw: can ? 0.012 : 0.01 });
      txt(ctx, name, rx + cw * 0.07, cy0 + chh * 0.085, fit(ctx, name, cw * 0.5, chh * 0.07), C.text, { align: 'left', shadow: false }); txt(ctx, 'NV' + (n + 1), rx + cw * 0.93, cy0 + chh * 0.085, chh * 0.055, C.sub, { align: 'right', shadow: false });
      const ts = Math.min(cw * 0.8, chh * 0.47), tx = rx + cw / 2 - ts / 2, ty = cy0 + chh * 0.17;
      panel(ctx, tx, ty, ts, ts, 8, C.bg2, null, tc, { bw: 0.03 });
      { const ix = tx + ts / 2, iy = ty + ts / 2; if (id === 'rk') rocket(ctx, ix, iy - ts * 0.02, ts * 0.16, E.rocket(n).tier, true); else if (id === 'la') launcher(ctx, ix, iy, ts * 0.14, E.launcher(n).tier); else { wallet(ctx, ix, iy - ts * 0.05, ts * 0.17); txt(ctx, 'X' + f1(E.mult(n)), ix, ty + ts * 0.86, ts * 0.17, '#fff', { shadow: false }); } }
      const sg = cw * 0.13, sgap = cw * 0.03, tot = 5 * sg + 4 * sgap, sy0 = ty + ts + chh * 0.045; for (let k = 0; k < 5; k++) { ctx.fillStyle = k < tdone ? tc : '#2a2c31'; ctx.fillRect(Math.round(rx + cw / 2 - tot / 2 + k * (sg + sgap)), Math.round(sy0), Math.round(sg), Math.max(3, Math.round(chh * 0.022))); }
      // bouton : se remplit a mesure que les pieces arrivent
      const bx = rx + cw * 0.07, bw = cw * 0.86, bh = chh * 0.2, by = cy0 + chh - bh - chh * 0.055, frac = done || cost === null ? 1 : U.clamp(S.coins / cost, 0, 1);
      if (done) { panel(ctx, bx, by, bw, bh, 7, '#25272c', null, C.line2); txt(ctx, 'MAX', bx + bw / 2, by + bh / 2, bh * 0.46, C.sub, { shadow: false }); }
      else {
        panel(ctx, bx, by, bw, bh, 7, '#1d1f24', null, can ? tc : C.line2);
        ctx.save(); path(ctx, bx, by, bw, bh, 7); ctx.clip(); ctx.fillStyle = can ? tc : tc + '55'; ctx.globalAlpha = can ? 0.9 + 0.1 * Math.sin(now / 200) : 1; ctx.fillRect(bx, by, bw * frac, bh); ctx.restore();
        const ps = U.formatInt(cost), pp = fit(ctx, ps, bw * 0.6, bh * 0.5), pw = tw(ctx, ps, pp) + pp * 1.25; coin(ctx, bx + bw / 2 - pw / 2 + pp * 0.4, by + bh / 2, pp * 0.42); txt(ctx, ps, bx + bw / 2 - pw / 2 + pp * 1.0, by + bh / 2, pp, can ? '#fff' : C.red, { align: 'left', shadow: false });
      }
      if (bk > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (bk * 0.35) + ')'; path(ctx, rx, cy0, cw, chh, 10); ctx.fill(); }
      ctx.restore();
      cards.push({ id, rx, cy0, cw, chh, ts, tx, ty, can, done, cost, tc });
    });
    // gemme : proposee seulement quand les pieces manquent (coin de la vignette)
    for (const c of cards) if (!c.done && !c.can) { const gc = E.gemCost(game, c.id), have = (S.gems || 0) >= gc, r = c.ts * 0.14, gx = c.tx + c.ts - r * 0.2, gy = c.ty + r * 0.2;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, 6.2832); ctx.fillStyle = have ? C.magD : '#26212a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.gem; ctx.stroke(); if (have) txt(ctx, String(gc), gx, gy + r * 0.05, r * 1.25, '#fff', { shadow: false, ls: 0 }); else { gem(ctx, gx, gy, r * 0.62); }
      hit(ui, gx - r * 1.3, gy - r * 1.3, r * 2.6, r * 2.6, () => E.buyGem(game, c.id)); }
    for (const c of cards) hit(ui, c.rx, c.cy0, c.cw, c.chh, () => E.buy(game, c.id));
    // --- coin droit : reglages, coffre (toutes les 2 h), choix du niveau ; rien d'autre ---
    const unlocked = S.runs >= 3, ready = E.chestReady(game), wait = Math.max(0, (S.chestAt || 0) - Date.now()), cs0 = u * 0.15, colx = W * 0.96 - cs0, ir = u * 0.05;
    { const gr = u * 0.052, gx = W * 0.96 - gr, gy = T0 + u * 0.035 + u * 0.0475; gear(ctx, gx, gy, gr * 0.95, '#fff'); hit(ui, gx - gr * 1.3, gy - gr * 1.3, gr * 2.6, gr * 2.6, () => { ui.overlay = 'msettings'; }); }
    { const y = Y(0.15); panel(ctx, colx, y, cs0, cs0, 10, C.bg, null, ready ? C.gold : C.line);
      if (unlocked) { chest(ctx, colx + cs0 / 2, y + cs0 * 0.45, cs0 * 0.3, false, ready ? 0.3 + 0.25 * Math.sin(now / 240) : 0); const lab = ready ? 'OUVRIR' : secFmt(wait); txt(ctx, lab, colx + cs0 / 2, y + cs0 * 0.86, fit(ctx, lab, cs0 * 0.92, cs0 * 0.15), ready ? C.gold : C.sub, { shadow: false, ls: 0 }); hit(ui, colx, y, cs0, cs0, () => E.openChest(game)); }
      else { ctx.save(); ctx.globalAlpha = 0.35; chest(ctx, colx + cs0 / 2, y + cs0 * 0.45, cs0 * 0.3, false, 0); ctx.restore(); txt(ctx, '3 VOLS', colx + cs0 / 2, y + cs0 * 0.86, cs0 * 0.15, C.sub, { shadow: false, ls: 0 }); } }
    { const y = Y(0.15) + cs0 + u * 0.03; panel(ctx, colx, y, cs0, cs0 * 0.7, 10, C.bg, null, C.line); levelsIcon(ctx, colx + cs0 * 0.36, y + cs0 * 0.35, cs0 * 0.2); if (E.stage) txt(ctx, String(E.stage(game)), colx + cs0 * 0.74, y + cs0 * 0.35, cs0 * 0.3, C.gold, { shadow: false, ls: 0 }); hit(ui, colx, y, cs0, cs0 * 0.7, () => { game.evoLvPop = !game.evoLvPop; }); }
    // choix du niveau
    if (game.evoLvPop && E.stage) { const stg = E.stage(game), pw = W * 0.62, rh = u * 0.14, px0 = W * 0.96 - pw, py0 = Y(0.15) + cs0 * 2 + u * 0.1;
      hit(ui, px0, py0, pw, rh * 2, () => {});
      panel(ctx, px0, py0 - u * 0.02, pw, rh * 2 + u * 0.04, 10, C.bg, null, C.line2);
      for (let n = 1; n <= 2; n++) { const y = py0 + (n - 1) * rh, open = n === 1 || !!S.clr1, on = stg === n; if (on) { ctx.fillStyle = 'rgba(47,180,87,0.25)'; ctx.fillRect(px0 + 3, y, pw - 6, rh); } txt(ctx, 'NIVEAU ' + n, px0 + u * 0.05, y + rh / 2, u * 0.05, open ? C.text : '#5a5e68', { align: 'left', shadow: false });
        if (!open) { ctx.fillStyle = '#6a6e78'; ctx.fillRect(px0 + pw - u * 0.1, y + rh * 0.42, u * 0.05, u * 0.04); } hit(ui, px0, y, pw, rh, () => { game.evoLvPop = false; if (open && !on) E.switchStage(game, n); }); }
      hit(ui, 0, T0, W, HH, () => { game.evoLvPop = false; }); }
    // --- coffre ouvert ---
    { const ch = game.evoChest; if (ch) { const k = (now - ch.t0) / 1000; if (k > 3.2) game.evoChest = null; else {
      const a = U.clamp(k / 0.25, 0, 1) * U.clamp((3.2 - k) / 0.4, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, T0, W, HH); chest(ctx, cx, Y(0.32), u * 0.2, k > 0.35, 0.55);
      const t1 = '+' + U.formatInt(ch.coins), t2 = '+' + ch.gems, p1 = u * 0.11; coin(ctx, cx - tw(ctx, t1, p1) / 2 - p1 * 0.6, Y(0.5), p1 * 0.45); txt(ctx, t1, cx + p1 * 0.3, Y(0.5), p1, C.gold); gem(ctx, cx - tw(ctx, t2, p1) / 2 - p1 * 0.6, Y(0.59), p1 * 0.45); txt(ctx, t2, cx + p1 * 0.3, Y(0.59), p1, C.gem); ctx.restore(); hit(ui, 0, T0, W, HH, () => { game.evoChest = null; }); } } }
    // --- toucher la scene : lancer (en dernier : les boutons gardent la priorite) ---
    hit(ui, 0, Y(0.1), W, Y(0.68) - Y(0.1), () => { game.evoLvPop = false; E.start(game); });
  };

  // ---------- RAPPORT DE VOL (sur le lieu du crash) ----------
  Home.drawEvoReport = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), last = game.evoLast, now = performance.now(), cx = W / 2;
    if (!last) { game.ui.overlay = 'evo'; return; }
    if (!last.t0) last.t0 = now; const tt = (now - last.t0) / 1000, adsOn = !!(game.ads && game.ads.enabled());
    { const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, 'rgba(4,5,8,0.7)'); g.addColorStop(0.55, 'rgba(4,5,8,0.35)'); g.addColorStop(1, 'rgba(4,5,8,0.75)'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); }
    topBar(ui, ctx, game, W, T0, u, S, E);
    const tk = U.clamp(tt / 0.35, 0, 1);
    ctx.save(); ctx.globalAlpha = tk; txt(ctx, 'RAPPORT DE VOL', cx, Y(0.145) + (1 - tk) * u * 0.04, fit(ctx, 'RAPPORT DE VOL', W * 0.78, u * 0.085), '#fff', { ls: u * 0.008 }); ctx.restore();
    const cause = last.crash === 'weak' && last.detail ? last.detail : last.cause; txt(ctx, cause, cx, Y(0.195), fit(ctx, cause, W * 0.86, u * 0.04), last.crash === 'weak' ? '#ffb0a0' : C.sub, { shadow: false });
    const px0 = W * 0.06, pw = W * 0.88, py0 = Y(0.23), rowH = u * 0.125, rows = [];
    rows.push({ lab: 'DISTANCE', sub: last.dist + ' M', val: last.lines[0] ? last.lines[0][1] : 0, t: 0 });
    if (last.kills) rows.push({ lab: 'ENNEMIS', sub: String(last.kills), val: last.lines.length > 1 && /^ENNEMIS/.test(last.lines[1][0]) ? last.lines[1][1] : 0, t: 0 });
    for (const ln of last.lines) if (/^PUB/.test(ln[0])) rows.push({ lab: 'BONUS PUB', sub: ln[0].replace('PUB ', ''), val: ln[1], t: ln[2] || 0, ad: true });
    const totH = rowH * 1.25, ph = rowH * rows.length + totH + u * 0.07;
    panel(ctx, px0, py0, pw, ph, 10, C.bg, null, C.line2);
    rows.forEach((r, i) => { const a = r.t ? U.clamp((now - r.t) / 350, 0, 1) : U.clamp((tt - 0.2 - i * 0.15) / 0.3, 0, 1), y = py0 + u * 0.03 + i * rowH; ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * u * 0.025);
      if (r.ad && r.t) { const fl = U.clamp(1 - (now - r.t) / 900, 0, 1); ctx.fillStyle = 'rgba(194,58,210,' + (0.18 + 0.3 * fl) + ')'; ctx.fillRect(px0 + 3, y, pw - 6, rowH * 0.9); }
      txt(ctx, r.lab, px0 + u * 0.05, y + rowH * 0.32, u * 0.04, C.sub, { align: 'left', shadow: false }); txt(ctx, r.sub, px0 + u * 0.05, y + rowH * 0.68, u * 0.058, r.ad ? C.gem : C.text, { align: 'left', shadow: false });
      const vs = U.formatInt(Math.round(r.val * ease(r.t ? (now - r.t) / 900 : tt / 1.0))), vp = u * 0.075; coin(ctx, px0 + pw - u * 0.07, y + rowH * 0.5, vp * 0.38); txt(ctx, vs, px0 + pw - u * 0.13, y + rowH * 0.5, vp, C.gold, { align: 'right' });
      ctx.fillStyle = C.line; ctx.fillRect(px0 + u * 0.04, y + rowH * 0.94, pw - u * 0.08, 1); ctx.restore(); });
    { const y = py0 + u * 0.03 + rowH * rows.length + u * 0.012, a = U.clamp((tt - 0.45 - rows.length * 0.15) / 0.35, 0, 1); ctx.save(); ctx.globalAlpha = a;
      const dtm = Math.min(0.1, (now - (last._tn || now)) / 1000); last._tn = now; if (last.disp === undefined) last.disp = 0; if (tt > 0.5) last.disp += (last.total - last.disp) * (1 - Math.exp(-dtm * 5)); if (Math.abs(last.total - last.disp) < 1) last.disp = last.total;
      const pop = 1 + 0.05 * U.clamp(1 - (now - (last.popT || 0)) / 300, 0, 1);
      ctx.translate(cx, y + totH / 2); ctx.scale(pop, pop); ctx.translate(-cx, -(y + totH / 2)); panel(ctx, px0 + u * 0.03, y, pw - u * 0.06, totH, 8, '#1d2a1f', null, C.green);
      txt(ctx, 'TOTAL', px0 + u * 0.08, y + totH * 0.3, u * 0.04, C.sub, { align: 'left', shadow: false }); const vs = U.formatInt(Math.round(last.disp)), vp = fit(ctx, vs, pw * 0.5, u * 0.1); coin(ctx, px0 + u * 0.1, y + totH * 0.7, vp * 0.38); txt(ctx, vs, px0 + u * 0.19, y + totH * 0.7, vp, '#fff', { align: 'left' });
      if (last.fx) { const k = U.clamp(1 - (now - last.fx.t0) / 1300, 0, 1); if (k > 0) txt(ctx, '+' + U.formatInt(last.fx.n), px0 + pw - u * 0.12, y + totH * 0.45 - (1 - k) * totH * 0.9, u * 0.085, C.gem, { align: 'right' }); }
      ctx.restore(); }
    if (last.record && Math.sin(now / 150) > -0.5) txt(ctx, 'NOUVEAU RECORD', cx, py0 + ph + u * 0.06, u * 0.055, C.gold);
    const by0 = py0 + ph + u * 0.14;
    if (adsOn && tt > 0.9) {
      const bw = W * 0.88, bh = u * 0.22, bx = cx - bw / 2; panel(ctx, bx, by0, bw, bh, 10, C.bg, null, C.magD);
      const sw2 = bw * 0.9, sx = cx - sw2 / 2, sY = by0 + bh * 0.52, sh = bh * 0.3, X = (v) => sx + sw2 * (v + 1) / 2;
      if (!last.mult) last.cur = Math.sin((now - last.t0) / 520); const lock = !!last.mult, pos = lock ? last.mult.p : last.cur, mv = lock ? last.mult.m : multAt(pos);
      const edges = [[-1, -0.75, 1.5], [-0.75, -0.45, 2], [-0.45, -0.2, 3], [-0.2, 0.2, 4], [0.2, 0.45, 3], [0.45, 0.75, 2], [0.75, 1, 1.5]];
      ctx.save(); path(ctx, sx, sY, sw2, sh, 5); ctx.clip(); for (const [v0, v1, m] of edges) { ctx.fillStyle = MCOL[m]; ctx.fillRect(X(v0), sY, X(v1) - X(v0) + 1, sh); } ctx.restore();
      for (const [v0, v1, m] of edges) { const lbl = 'X' + (m === 1.5 ? '1,5' : m); txt(ctx, lbl, (X(v0) + X(v1)) / 2, by0 + bh * 0.26, fit(ctx, lbl, (X(v1) - X(v0)) * 0.9, bh * 0.17), m === 4 ? C.gold : '#d8dae0', { shadow: false, ls: 0 }); }
      const x = X(pos), cw2 = Math.max(3, sh * 0.12); ctx.fillStyle = '#fff'; ctx.fillRect(x - cw2 / 2, sY - sh * 0.2, cw2, sh * 1.4); ctx.beginPath(); ctx.moveTo(x - sh * 0.3, sY - sh * 0.55); ctx.lineTo(x + sh * 0.3, sY - sh * 0.55); ctx.lineTo(x, sY - sh * 0.15); ctx.closePath(); ctx.fill();
      const b2y = by0 + bh + u * 0.04, b2h = u * 0.17, wA = bw * 0.6, wB = bw * 0.36, onA = inRect(ui, bx, b2y, wA, b2h);
      if (!last.doubled) { panel(ctx, bx, b2y, wA, b2h, 9, onA ? '#d048e0' : C.mag, null, null, { shine: true }); adTicket(ctx, bx + b2h * 0.5, b2y + b2h / 2, b2h * 0.22); const s1 = 'MULTIPLIER  X' + (mv === 1.5 ? '1,5' : mv); txt(ctx, s1, bx + wA * 0.55, b2y + b2h * 0.38, fit(ctx, s1, wA * 0.68, b2h * 0.3), '#fff', { shadow: false }); const s2 = '+' + U.formatInt(Math.round(last.total * (mv - 1))) + ' PIECES'; txt(ctx, s2, bx + wA * 0.55, b2y + b2h * 0.7, fit(ctx, s2, wA * 0.68, b2h * 0.24), 'rgba(255,255,255,0.85)', { shadow: false });
        hit(ui, bx, b2y, wA, b2h, () => { if (last.mult) return; last.mult = { m: mv, p: pos }; game.audio.play('uiTick'); setTimeout(() => game.ads.rewarded(() => E.multiply(game, mv), null, 'coins', 'PIECES X' + (mv === 1.5 ? '1,5' : mv) + '   +' + U.formatInt(Math.round(last.total * (mv - 1)))), 420); }); }
      else txt(ctx, 'BONUS X' + (last.doubled === 1.5 ? '1,5' : last.doubled) + ' AJOUTE', bx + wA / 2, b2y + b2h / 2, fit(ctx, 'BONUS X1,5 AJOUTE', wA * 0.9, b2h * 0.32), C.gem);
      const nx = bx + bw - wB, onB = inRect(ui, nx, b2y, wB, b2h); panel(ctx, nx, b2y, wB, b2h, 9, onB ? '#3cc866' : C.green, null, null, { shine: true }); txt(ctx, 'SUIVANT', nx + wB / 2, b2y + b2h / 2, fit(ctx, 'SUIVANT', wB * 0.82, b2h * 0.34), '#fff', { shadow: false }); hit(ui, nx, b2y, wB, b2h, () => E.afterReport(game));
    } else {
      const bw = W * 0.6, b2h = u * 0.17, b2y = by0 + u * 0.06, nx = cx - bw / 2; panel(ctx, nx, b2y, bw, b2h, 9, C.green, null, null, { shine: true }); txt(ctx, 'SUIVANT', cx, b2y + b2h / 2, b2h * 0.36, '#fff', { shadow: false }); hit(ui, nx, b2y, bw, b2h, () => E.afterReport(game));
    }
  };

  // ---------- REGLAGES ----------
  const _oldSettings = Home.drawSettings;
  Home.drawSettings = function (ui, ctx, game, W, H) {
    if (!(CC.EVO && CC.EVO.on)) return _oldSettings.call(this, ui, ctx, game, W, H);
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), s = game.settings, cx = W / 2, now = performance.now();
    const vib = ['NON', 'FAIBLE', 'MOYEN', 'FORT'], vibV = s.vibration !== undefined ? s.vibration : 2;
    ctx.fillStyle = 'rgba(8,9,12,0.94)'; ctx.fillRect(0, T0, W, HH);
    txt(ctx, 'REGLAGES', cx, Y(0.07), fit(ctx, 'REGLAGES', W * 0.8, u * 0.09), '#fff', { ls: u * 0.012 });
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
    const gap = HH * 0.01, rh = Math.min(u * 0.13, (HH * 0.74) / rows.length - gap), y0 = Y(0.125), x0 = W * 0.06, w = W * 0.88;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + gap), on = inRect(ui, x0, y, w, rh); panel(ctx, x0, y, w, rh, 8, on ? '#1e2026' : C.bg, null, C.line);
      txt(ctx, r[0], x0 + rh * 0.4, y + rh / 2, fit(ctx, r[0], w * 0.55, rh * 0.38), C.text, { align: 'left', shadow: false });
      const vw = Math.max(rh * 1.6, tw(ctx, r[2], rh * 0.36) + rh * 0.6), vx = x0 + w - rh * 0.25 - vw, good = r[1];
      panel(ctx, vx, y + rh * 0.17, vw, rh * 0.66, 6, good ? C.greenD : '#2a2c32', null, good ? C.green : C.line2); txt(ctx, r[2], vx + vw / 2, y + rh / 2, fit(ctx, r[2], vw * 0.88, rh * 0.36), good ? '#fff' : C.sub, { shadow: false });
      hit(ui, x0, y, w, rh, r[3]);
    });
    if (Home.drawToast) Home.drawToast(ui, ctx, L);
    const bw = W * 0.5, bh = u * 0.14, bx = cx - bw / 2, by = Y(0.92); panel(ctx, bx, by, bw, bh, 9, C.green, null, null, { shine: true }); txt(ctx, 'RETOUR', cx, by + bh / 2, bh * 0.4, '#fff', { shadow: false });
    hit(ui, bx, by, bw, bh, () => { ui.overlay = (CC.EVO && CC.EVO.on && game.state === 'MENU') ? 'evo' : null; });
  };

  // ---------- BARRE DE LANCEMENT (meme style) ----------
  Home.drawEvoAim = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, E = CC.EVO, a = game.evoAim, S = E.save(game), cx = W / 2, now = performance.now();
    if (!a) return;
    const Zn = E.zones(game), bw = W * 0.86, bh = Math.max(u * 0.07, 28), bx = cx - bw / 2, by = Y(0.86), X = (v) => bx + bw * (v + 1) / 2;
    panel(ctx, bx - 8, by - 8, bw + 16, bh + 16, 10, 'rgba(10,11,14,0.78)', null, C.line2);
    ctx.save(); path(ctx, bx, by, bw, bh, 6); ctx.clip();
    const seg = (v0, v1, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(X(v0)), by, Math.max(1, Math.round(X(v1) - X(v0))), bh); };
    seg(-1, 1, '#d0473e'); seg(-Zn.yellow, Zn.yellow, '#e0a820'); seg(-Zn.green, Zn.green, '#2fb457'); seg(-Zn.gold, Zn.gold, a.lock && a.zone === 'gold' && Math.sin(now / 60) > 0 ? '#ffffff' : '#ffd23a');
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(bx, by, bw, bh * 0.4); ctx.restore();
    const x = X(a.c), cw = Math.max(4, bh * 0.12); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x - cw / 2), by - bh * 0.3, cw, bh * 1.6);
    ctx.beginPath(); ctx.moveTo(x - bh * 0.3, by - bh * 0.65); ctx.lineTo(x + bh * 0.3, by - bh * 0.65); ctx.lineTo(x, by - bh * 0.25); ctx.closePath(); ctx.fill();
    if (!a.lock) { if (S.runs < 3) txt(ctx, 'TOUCHE AU CENTRE', cx, by - bh * 1.7, fit(ctx, 'TOUCHE AU CENTRE', W * 0.8, u * 0.06), '#fff', { ls: u * 0.01 }); hit(ui, 0, 0, W, H, () => E.lock(game)); }
    else { const col = { gold: C.gold, green: '#6aff9a', yellow: '#ffe08a', red: '#ff7a6a' }[a.zone], k = U.clamp(a.lockT / 0.12, 0, 1); txt(ctx, a.word, cx, Y(0.42) - (1 - k) * u * 0.03, fit(ctx, a.word, W * 0.9, u * 0.12) * (0.8 + 0.2 * k), col, { ls: u * 0.012 }); }
  };

  // ---------- plus aucun texte parasite en vol (noms de zones, annonces d'ennemis, alertes) ----------
  if (CC.L1 && CC.L1.msg) { const _m = CC.L1.msg; CC.L1.msg = function (g) { if (g && g.evo) return; return _m.apply(this, arguments); }; }
  // ---------- garde-fous : le rapport se ferme des qu'une nouvelle partie commence ----------
  if (CC.EVO) { const _br = CC.EVO.beginRun; CC.EVO.beginRun = (g) => { g.evoReport = false; g.evoLvPop = false; return _br(g); }; }
})();
