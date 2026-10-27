/* v170 : ECRANS du mode evolution en style « arcade tactique moderne » (voir ui_kit.js pour le theme et les composants).
 * Remplace les anciens themes A / B / C. Ecrans : menu, jauge de lancement au piston, rapport de mission, boutique, apparences, reglages, HUD de vol.
 * Aucune logique de jeu ici : seulement du dessin et le branchement des boutons sur les fonctions existantes de CC.EVO. */
(function () {
  const U = CC.U, Home = CC.Home, UI = CC.UI2; if (!Home || !UI) return;
  const T = UI.THEME, S = UI.S;
  try { if (CC.EVO && CC.EVO.on) document.body.classList.add('cc-evo'); document.fonts.load('700 20px Rajdhani'); } catch (e) { /* police de secours */ }
  const hit = (ui, x, y, w, h, a, scene) => ui.buttons.push({ x, y, w, h, action: a, scene: !!scene });
  const ease = (k) => 1 - Math.pow(1 - U.clamp(k, 0, 1), 3);
  const secFmt = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  const TIERNAME = ['MISSILE DE BASE', 'MISSILE À AILERONS', 'MISSILE RÉACTEUR', 'MISSILE TURBO'], TIERNAME2 = ['MISSILE TORPILLE', 'TORPILLE À AILERONS', 'MISSILE HYDROJET', 'MISSILE AMPHIBIE'];
  // cadre commun : largeur de contenu (portrait telephone, ou colonne centrale sur grand ecran)
  const C0 = UI.C, rr0 = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const frame = (ui, ctx, W, H) => { const L = Home.layout(ui, W, H); UI.begin(L.u, ui.pixelRatio ? ui.pixelRatio() : 1); return { L, HH: L.HH, Y: L.Y, T0: L.Y(0), cw: L.u, ox: (W - L.u) / 2, cx: W / 2 }; };
  const MULT = [[0.07, 4], [0.32, 3], [0.68, 2], [1.01, 1.5]];
  const multAt = (p) => { const a = Math.abs(p); for (const [t, m] of MULT) if (a < t) return m; return 1.5; };
  const MCOL = { 4: '#3CC027', 3: '#F5D327', 2: '#F28C1C', 1.5: '#E0412F' };   // v257 : extremites rouges, puis orange, jaune ; le centre (x4) est vert
  // ---------- compat pour les anciens appels (evo.js, evo_story.js, evo_flow.js) ----------
  Home.evoUI = {
    txt: (ctx, s, x, y, px, fill, o) => UI.text(ctx, s, x, y, px, fill, { align: o && o.align, outline: !!(o && o.sw >= 0.2), shadow: !(o && o.shadow === false), stroke: !!(o && o.stroke) }),
    tw: UI.tw, fit: UI.fit, coin: (ctx, x, y, r) => UI.icon(ctx, 'coin', x, y, r * 2), gem: (ctx, x, y, r) => UI.icon(ctx, 'gem', x, y, r * 2),
    star: (ctx, x, y, r) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = T.yellow; ctx.strokeStyle = T.ink; ctx.lineWidth = Math.max(2, r * 0.12); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, rad = k % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); },
    panel: (ctx, x, y, w, h, r, fill, f2, border) => UI.panel(ctx, x, y, w, h, { fill: fill && fill.length ? fill : T.bg, border: border === null ? null : border }),
    btnPrimary: UI.btnPrimary,
  };
  // v258 : reflet blanc qui balaie un rectangle quand il apparait (k de 0 a 1)
  const shimmer = (ctx, x, y, w, h, r, k) => { if (k <= 0 || k >= 1) return; ctx.save(); UI.rrect(ctx, x, y, w, h, r); ctx.clip(); const bw = w * 0.2, p = x - bw * 1.6 + (w + bw * 3.2) * k, g = ctx.createLinearGradient(p, 0, p + bw, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.translate(0, y + h / 2); ctx.transform(1, 0, -0.35, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(p, -h, bw, h * 2); ctx.restore(); };
  // chiffre blanc, contour bleu, relief (compteur de vitesse)
  const blueText = (ctx, s, x, y, px, fill) => { ctx.save(); UI.setFont(ctx, px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2; const lw = Math.max(2, px * 0.2), off = px * 0.08; ctx.lineWidth = lw; ctx.strokeStyle = '#0F3A8C'; ctx.strokeText(s, x, y + off); ctx.fillStyle = '#0F3A8C'; ctx.fillText(s, x, y + off); ctx.strokeStyle = '#2F7BEA'; ctx.strokeText(s, x, y); ctx.fillStyle = fill || '#FFFFFF'; ctx.fillText(s, x, y); ctx.restore(); };
  // pieces / gemmes qui volent vers la pastille du haut (le compteur ne monte qu'a l'arrivee) : coffre, rapport, achats, pub gemme
  const FLY_DUR = 0.8, FLY_GAP = 0.04;
  function flyStep(game, now) {
    const f = game.evoFly, h = game.evoHold; if (!f) { if (h && !game.evoChest && !game.evoReport) game.evoHold = null; return; }
    const t = (now - f.t0) / 1000, nC = f.c > 0 ? (f.nc || 24) : 0, nG = f.g > 0 ? Math.max(1, Math.min(f.g, 14)) : 0; let a = 0, b = 0;
    for (let i = 0; i < nC; i++) if (t >= i * FLY_GAP + FLY_DUR) a++;
    for (let i = 0; i < nG; i++) if (t >= i * FLY_GAP * 2 + FLY_DUR) b++;
    if (h) { h.c = nC ? f.c * (1 - a / nC) : 0; h.g = nG ? f.g * (1 - b / nG) : 0; }
    if (a >= nC && b >= nG) { game.evoFly = null; game.evoHold = null; }
  }
  function flyDraw(ctx, game, F, now) {
    const f = game.evoFly; if (!f) return; const t = (now - f.t0) / 1000, h = S(96), y = F.T0 + S(34), x0 = F.ox + S(36), ty = y + h / 2, sy = f.sy !== undefined ? f.sy : F.Y(0.55), scx = f.cx !== undefined ? f.cx : F.cx;
    const go = (n, art, sx, tx, gap, size) => { for (let i = 0; i < n; i++) { const d = t - i * gap; if (d < 0 || d >= FLY_DUR) continue; const k = d / FLY_DUR, e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k), ox = Math.sin(i * 12.9) * S(90), oy = Math.cos(i * 7.7) * S(50), p0x = sx + ox, p0y = sy + oy, cx2 = (p0x + tx) / 2 + Math.sin(i * 5.3) * S(140), cy2 = Math.min(p0y, ty) - S(150), u = 1 - e;
      const px = u * u * p0x + 2 * u * e * cx2 + e * e * tx, py = u * u * p0y + 2 * u * e * cy2 + e * e * ty; ctx.save(); ctx.globalAlpha = Math.min(1, d / 0.08); UI.artImg(ctx, art, px, py, size * (1 - 0.3 * e)); ctx.restore(); } };
    if (f.c > 0) go(f.nc || 24, 'coin', scx - (f.g > 0 ? S(110) : 0), x0 + h * 0.5, FLY_GAP, S(60));
    if (f.g > 0) go(Math.max(1, Math.min(f.g, 14)), 'gem', scx + (f.c > 0 ? S(110) : 0), x0 + S(250) + S(30) + h * 0.5, FLY_GAP * 2, S(66));
  }
  // lance l'envol : c pieces (nc pieces visibles) et/ou g gemmes (reelles) ; l'argent est deja ajoute a la sauvegarde, on le retient a l'affichage
  Home.evoFly = (game, c, g, nc, sy, cx) => { const h = game.evoHold = game.evoHold || { c: 0, g: 0 }; h.c += c; h.g += g; game.evoFly = { t0: performance.now(), c: h.c, g: h.g, nc: nc || 36, sy, cx }; };
  // ---------- barre du haut ----------
  function topBar(ui, ctx, game, F, S0, E, o) {
    o = o || {}; const h = S(96), y = F.T0 + S(34), x0 = F.ox + S(36), now = performance.now(), fxg = game.evoGemFx;
    const cwid = S(250);
    // v237 : le compteur de pieces defile jusqu'a la nouvelle valeur, la pastille rebondit quand on gagne, une valeur « -1 897 » tombe quand on depense
    flyStep(game, now); const hold = game.evoHold, tgt = Math.max(0, S0.coins - (hold ? hold.c : 0)); if (game._cs === undefined) { game._cs = tgt; game._cp = tgt; }
    { const dtc = Math.min(0.1, (now - (game._ct || now)) / 1000); game._ct = now; if (game._cp !== tgt) { game._cb = now; game._cd = tgt - game._cp; game._cp = tgt; } game._cs += (tgt - game._cs) * (1 - Math.exp(-dtc * 8)); if (Math.abs(tgt - game._cs) < 1) game._cs = tgt; }
    const cs = U.formatInt(Math.round(game._cs)), cbk = game._cb ? (now - game._cb) / 1000 : 9, cbump = cbk < 0.45 ? Math.sin(cbk / 0.45 * 3.1416) * (game._cd > 0 ? 0.1 : -0.045) : 0;
    ctx.save(); ctx.translate(x0 + cwid / 2, y + h / 2); ctx.scale(1 + cbump, 1 + cbump); ctx.translate(-(x0 + cwid / 2), -(y + h / 2));
    UI.currencyPill(ctx, ui, x0, y, cwid, h, 'coin', cs);
    ctx.restore();
    if (cbk < 1.0 && game._cd > 0 && !(game.evoCoinFx || game.evoFly))   /* v263 : plus de texte rouge de depense */ { const a = U.clamp(1 - cbk / 1.0, 0, 1), neg = game._cd < 0, tx = (neg ? '-' : '+') + U.formatInt(Math.abs(Math.round(game._cd))); ctx.save(); ctx.globalAlpha = a; UI.outlined(ctx, tx, x0 + cwid * 0.52, y + h * (neg ? 1.2 + cbk * 0.5 : 1.5 - cbk * 0.5), h * 0.5, neg ? '#FF8A7A' : '#FFE16A', '#1a1208', { keep: true, ow: 0.16 }); ctx.restore(); }
    const gs = String((S0.gems || 0) - (hold ? hold.g : 0)), gx = x0 + cwid + S(30), gwid = S(220), pulse = fxg ? U.clamp(1 - (now - fxg.t0) / 900, 0, 1) : 0;
    UI.currencyPill(ctx, ui, gx, y, gwid, h, 'gem', gs, { plus: true });
    if (pulse > 0) { ctx.save(); UI.cham(ctx, gx + h * 0.3, y, gwid - h * 0.3, h, h * 0.28); ctx.lineWidth = S(5); ctx.strokeStyle = 'rgba(255,255,255,' + pulse + ')'; ctx.stroke(); UI.text(ctx, '+' + fxg.n, gx + h * 1.5, y + h * 1.5 - (1 - pulse) * h * 0.4, h * 0.6, T.yellow, { outline: true }); ctx.restore(); }
    UI.tap(ui, gx, y, gwid, h, () => { ui.overlay = 'evoShop'; });
    if (game.evoCoinFx) { const cf = game.evoCoinFx, k = U.clamp(1 - (now - cf.t0) / 1100, 0, 1); if (k <= 0) game.evoCoinFx = null; else { ctx.save(); ctx.globalAlpha = k; UI.text(ctx, '+' + U.formatInt(cf.n), x0 + cwid * 0.5, y + h * 1.5 - (1 - k) * h * 0.5, h * 0.6, T.yellow, { outline: true }); ctx.restore(); } }
    const bs = S(112), bx = F.ox + F.cw - S(36) - bs;
    if (o.close) { UI.slateIconButton(ctx, bx, y - S(8), bs, 'close'); UI.tap(ui, bx, y - S(8), bs, bs, o.close); ui.buttons[ui.buttons.length - 1].snd = 'back'; }
    else if (!o.noGear) { UI.slateIconButton(ctx, bx, y - S(8), bs, 'gear'); UI.tap(ui, bx, y - S(8), bs, bs, () => { ui.overlay = 'msettings'; }); }
    return y + h;
  }
  // icone du MINI-JEU : bouton rond bleu (comme les autres boutons ronds), chronometre blanc, pastille verte = tickets du jour
  function miniIcon(ctx, x, y, s, tickets, now) {
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.48, ow = Math.max(2, S(4)), ph = ((now || 0) % 3400) / 3400, k = ph < 0.22 ? ph / 0.22 : 1, wob = k < 1 ? Math.sin(k * Math.PI * 6) * (1 - k) * 0.16 : 0;
    ctx.save(); ctx.translate(cx, cy + r * 0.6); ctx.rotate(wob); ctx.translate(-cx, -(cy + r * 0.6));
    ctx.beginPath(); ctx.arc(cx, cy, r + ow, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = tickets > 0 ? '#2E86DE' : '#6F8094'; ctx.fill();
    ctx.save(); ctx.shadowColor = 'rgba(6,20,40,0.4)'; ctx.shadowOffsetY = S(4); ctx.shadowBlur = 0;
    const R = r * 0.58, cyy = cy + r * 0.06; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, cyy, R, 0, 6.2832); ctx.fill(); ctx.fillRect(cx - R * 0.16, cyy - R - r * 0.22, R * 0.32, r * 0.2); ctx.restore();
    ctx.fillStyle = tickets > 0 ? '#1B5FA8' : '#4A5B6E'; ctx.beginPath(); ctx.arc(cx, cyy, R * 0.82, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, R * 0.12); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832, r1 = R * 0.7, r2 = R * (i % 3 === 0 ? 0.55 : 0.62); ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r1, cyy - Math.cos(a) * r1); ctx.lineTo(cx + Math.sin(a) * r2, cyy - Math.cos(a) * r2); ctx.stroke(); }
    ctx.lineWidth = Math.max(3, R * 0.16); ctx.beginPath(); ctx.moveTo(cx, cyy); ctx.lineTo(cx + R * 0.34, cyy - R * 0.42); ctx.stroke(); ctx.fillStyle = '#FFD23A'; ctx.beginPath(); ctx.arc(cx, cyy, R * 0.12, 0, 6.2832); ctx.fill();
    ctx.restore();
    { const br = r * 0.34, bx = cx + r * 0.78, by = cy - r * 0.74; ctx.beginPath(); ctx.arc(bx, by, br + ow, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.2832); ctx.fillStyle = tickets > 0 ? '#2ECC71' : '#F04438'; ctx.fill(); UI.outlined(ctx, String(tickets), bx, by + br * 0.04, br * 1.25, '#FFFFFF'); }
  }
  // petite icone de carburant (bidon + bec), pour les gains de l'ogive
  function fuelIcon(ctx, cx, cy, s) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 0; for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { ctx.shadowOffsetX = dx * S(2); ctx.shadowOffsetY = dy * S(2); UI.artImg(ctx, 'fuel', cx, cy, s * 1.5); } ctx.restore(); }
  // ---------- carte d'amelioration ----------
  function card(ui, ctx, game, E, S0, id, x, y, w, h, now) {
    const n = S0[id], cost = E.nextCost(game, id), can = cost !== null && S0.coins >= cost;
    const name = id === 'la' ? 'PROPULSEUR' : id === 'rk' ? 'OGIVE' : 'REVENU', ico = id === 'la' ? 'missile_flame' : id === 'rk' ? 'missile_ogive' : 'coins_stack';
    const full = id === 'rk' ? n >= 20 : id === 'la' ? n >= 10 : n >= 5, done = full ? 5 : id === 'rk' ? E.rocket(n).s : id === 'la' ? E.launcher(n).s : n;
    const shk = game.evoShake && game.evoShake.id === id && now - game.evoShake.t0 < 350 ? Math.sin((now - game.evoShake.t0) / 25) * S(10) : 0, bt = game.evoBought, bk = bt && bt.id === id ? U.clamp(1 - (now - bt.t0) / 520, 0, 1) : 0, k2 = 1 + 0.05 * Math.sin(bk * 3.1416);
    const rx = x + shk, ccx = rx + w / 2, ccy = y + h / 2;
    ctx.save(); ctx.translate(ccx, ccy); ctx.scale(k2, k2); ctx.translate(-ccx, -ccy);
    const ink = '#F0EDE4', col = UI.CARDCOL[id], R = w * 0.04, pd = w * 0.035;
    rr0(ctx, rx, y, w, h, R); ctx.fillStyle = '#26394B'; ctx.fill();
    const ix = rx + pd, iy = y + h * 0.125, iw = w - pd * 2, ih = h * 0.405;
    UI.outlined(ctx, name, ix, y + h * 0.068, UI.fit(ctx, name, w * 0.6, h * 0.066), ink, null, { align: 'left' });
    { const im = UI.art('bg_' + id); ctx.save(); rr0(ctx, ix, iy, iw, ih, w * 0.025); ctx.clip();
      if (im) { const k = Math.max(iw / im.naturalWidth, ih / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k; ctx.drawImage(im, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh); } else { const bg = UI.CARDBG[id], gr = ctx.createLinearGradient(0, iy, 0, iy + ih); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); ctx.fillStyle = gr; ctx.fillRect(ix, iy, iw, ih); }
      ctx.restore(); }
    // v237 : revenu : a chaque achat la pile de pieces rebondit et la valeur gagnee monte (+0,1) ; a un PALIER (x1,4 -> x2) c'est plus gros, avec une gerbe d'etincelles
    const cb = (id === 'cm' || id === 'rk') && game.evoBought && game.evoBought.id === id && (id === 'rk' || game.evoBought.delta !== undefined) ? game.evoBought : null, ct = cb ? (now - cb.t0) / 1000 : 9, big = cb && cb.palier;
    const pul = ct < 0.55 ? Math.sin(ct / 0.55 * 3.1416) * (big ? 0.34 : 0.2) : 0;
    if (id === 'cm') { const m = E.mult(n), ti = m < 2 ? 0 : m < 3 ? 1 : m < 4 ? 3 : m < 6 ? 2 : m < 9 ? 4 : 5; ctx.save(); const icx = ix + iw / 2, icy = iy + ih * 0.46; ctx.translate(icx, icy - pul * ih * 0.12); ctx.scale(1 + pul, 1 + pul); ctx.translate(-icx, -icy); UI.artImg(ctx, 'cmx_' + ti, icx, icy, ih * 0.74); ctx.restore(); }
    else if (pul > 0) { ctx.save(); ctx.globalAlpha = pul * 1.4; ctx.fillStyle = '#FFFFFF'; rr0(ctx, ix, iy, iw, ih, w * 0.025); ctx.fill(); ctx.restore(); }   // petit flash a l'achat
    if (id === 'cm') { ctx.save(); const tcx = ix + iw / 2, tcy = iy + ih * 0.84; ctx.translate(tcx, tcy); ctx.scale(1 + pul * 0.9, 1 + pul * 0.9); ctx.translate(-tcx, -tcy); UI.outlined(ctx, 'X' + f1(E.mult(n)), tcx, tcy, h * 0.095, big && ct < 0.8 ? T.yellow : T.white, '#000000', { keep: true, ow: 0.16 }); ctx.restore(); }
    {
      if (cb && ct < 1.7) {
        const a = U.clamp(1 - (ct - 0.9) / 0.8, 0, 1), rise = ease(ct / 1.1) * ih * 0.55, txt = id === 'rk' ? '+' : '+' + f1(cb.delta), sz = h * (big ? 0.15 : 0.1);
        ctx.save(); ctx.globalAlpha = a; if (id === 'rk') { const fs = h * 0.11, tw0 = UI.tw(ctx, '+', fs * 1.1), x0 = ix + iw / 2 - (tw0 + fs * 1.1) / 2; UI.outlined(ctx, '+', x0, iy + ih * 0.5 - rise, fs * 1.1, '#FFFFFF', '#06121c', { keep: true, ow: 0.16, align: 'left' }); fuelIcon(ctx, x0 + tw0 + fs * 0.62, iy + ih * 0.5 - rise, fs * 1.25); } else UI.outlined(ctx, txt, ix + iw / 2, iy + ih * 0.5 - rise, UI.fit(ctx, txt, iw * 0.9, sz), big ? '#FFE16A' : '#FFFFFF', '#1a1208', { keep: true, ow: 0.16 }); ctx.restore();
        if (big && ct < 1.0) { const e = ease(ct / 0.9); ctx.save(); ctx.globalAlpha = 1 - e; ctx.strokeStyle = '#FFF2B0'; ctx.lineWidth = Math.max(2, S(5) * (1 - e)); ctx.beginPath(); ctx.arc(ix + iw / 2, iy + ih * 0.45, ih * (0.2 + 0.75 * e), 0, 6.2832); ctx.stroke();
          for (let i = 0; i < 12; i++) { const an = i * 0.5236 + 0.3, r0 = ih * (0.25 + 0.7 * e), sx = ix + iw / 2 + Math.cos(an) * r0, sy = iy + ih * 0.45 + Math.sin(an) * r0, ss = S(10) * (1 - e) + 1; ctx.fillStyle = i % 2 ? '#FFE16A' : '#FFFFFF'; ctx.beginPath(); ctx.moveTo(sx, sy - ss * 1.6); ctx.lineTo(sx + ss * 0.5, sy); ctx.lineTo(sx, sy + ss * 1.6); ctx.lineTo(sx - ss * 0.5, sy); ctx.closePath(); ctx.fill(); } ctx.restore(); }
      } }
    { const br = w * 0.125, bcx = rx + w - br * 0.8, bcy = y + br * 0.8, ro = Math.max(2, S(4)); ctx.beginPath(); ctx.arc(bcx, bcy, br + ro, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.beginPath(); ctx.arc(bcx, bcy, br, 0, 6.2832); ctx.fillStyle = '#3A5873'; ctx.fill(); UI.outlined(ctx, String(n + 1), bcx, bcy + br * 0.04, UI.fit(ctx, String(n + 1), br * 1.4, br * 1.05), T.white); }
    UI.segments(ctx, ix, y + h * 0.555, iw, h * 0.088, done, 5, { off: 'rgba(14,24,34,0.45)', on: col });
    const bx = rx + pd, bw = w - pd * 2, bh = h * 0.285, by = y + h - pd - h * 0.285, frac = cost === null ? 1 : U.clamp(S0.coins / cost, 0, 1);
    const cs = U.formatInt(cost), gemMode = !can && cost !== null && game.evoGemOffer === id, gc = E.gemCost(game, id), haveG = (S0.gems || 0) >= gc;
    const offId = game.evoGemOffer, offerOn = !!offId && E.nextCost(game, offId) !== null && S0.coins < E.nextCost(game, offId), dim = !can && !gemMode && cost !== null;   // v261 : bouton trop cher = 50 % plus clair ; si une gemme est proposee ailleurs : chiffre rouge + pubs a regarder
    if (dim) { rr0(ctx, bx, by, bw, bh, bh * 0.07); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.save(); ctx.globalAlpha = 0.65; }   // v264 : un rectangle blanc a 100 % derriere, exactement de la taille du bouton ; le bouton passe a 65 %
    const face = UI.greenButton(ctx, bx, by, bw, bh, { disabled: false, cat: gemMode ? 'gem' : id });
    if (gemMode) {   // plus assez de pieces : le bouton propose une GEMME (violet, reflet toutes les 1,5 s)
      const gy = face.y + face.h * 0.5, gs = face.h * 0.52, px = face.h * 0.4, tw = UI.tw(ctx, String(gc), px), tot = gs + face.h * 0.12 + tw, gx0 = bx + bw / 2 - tot / 2;   // meme taille de texte que « AMELIORER »
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowOffsetY = S(3); ctx.shadowBlur = 0; UI.icon(ctx, 'gem', gx0 + gs / 2, gy, gs); ctx.restore();
      UI.outlined(ctx, String(gc), gx0 + gs + face.h * 0.12, gy + face.h * 0.02, px, '#FFFFFF', null, { align: 'left' });
      shimmer(ctx, face.x, face.y, face.w, face.h, face.h * 0.07, ((now / 1000) % 1.5) / 0.55);
    }
    ctx.save(); if (gemMode) ctx.globalAlpha = 0;
    UI.outlined(ctx, 'AMÉLIORER', bx + bw / 2, face.y + face.h * 0.3, UI.fit(ctx, 'AMÉLIORER', bw * 0.94, face.h * 0.4), '#FFFFFF');
    ctx.restore();
    if (!gemMode) { const ps = face.h * 0.37, pw = UI.tw(ctx, cs, ps) + ps * 1.3; ctx.save(); UI.icon(ctx, 'coin', bx + bw / 2 - pw / 2 + ps * 0.5, face.y + face.h * 0.73, ps * 1.15); ctx.restore(); UI.outlined(ctx, cs, bx + bw / 2 - pw / 2 + ps * 1.25, face.y + face.h * 0.73, UI.fit(ctx, cs, bw * 0.55, ps), dim && offerOn ? '#F04438' : '#FFFFFF', null, { align: 'left' });
      if (dim) ctx.restore();
      if (dim && offerOn) { const ts = face.h * 0.5, tcx = bx + bw - ts * 0.55, tcy = face.y + face.h + ts * 0.02; ctx.save(); ctx.translate(tcx, tcy); ctx.rotate(-0.2); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetY = S(4); UI.artImg(ctx, 'ticket', 0, 0, ts); ctx.restore(); const br = ts * 0.3, bcx = tcx + ts * 0.34, bcy = tcy - ts * 0.1; ctx.beginPath(); ctx.arc(bcx, bcy, br + S(3), 0, 6.2832); ctx.fillStyle = '#1F6A08'; ctx.fill(); ctx.beginPath(); ctx.arc(bcx, bcy, br, 0, 6.2832); ctx.fillStyle = '#A8EE5C'; ctx.fill(); UI.outlined(ctx, '10', bcx, bcy + br * 0.05, br * 1.15, '#1F6A08', null, { flat: true }); } }
    // (plus de barre de progression de l'argent)
    if (bk > 0) { ctx.fillStyle = 'rgba(255,255,255,' + bk * 0.35 + ')'; UI.cham(ctx, rx, y, w, h, S(26)); ctx.fill(); }
    ctx.restore();
    return { id, rx, y, w, h, ix, iy, iw, ih, can, cost, bx, by, bw, bh };
  }
  // ---------- COFFRE : il apparait en grand, on le touche, il tremble, une lumiere jaillit, il s'ouvre ; puis le panneau de recompense ----------
  function chestOverlay(ui, ctx, game, F, E, now, W, H) {
    const ch = game.evoChest; if (!ch) return; const { T0, HH, Y, cx, cw } = F;
    ctx.save(); ui.dim(ctx, W, H, 0.9);   // v257 : tout l'ecran est assombri (barre du haut comprise)
    const glowAt = (gx, gy, r, a) => { const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, 'rgba(255,214,110,' + a + ')'); g.addColorStop(1, 'rgba(255,170,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, r, 0, 6.2832); ctx.fill(); };
    const cyc = Y(0.42);
    if (ch.st === 'wait') {
      const t = (now - ch.t0) / 1000, pu = 0.5 + 0.5 * Math.sin(t * 3);
      glowAt(cx, cyc, S(430) + pu * S(40), 0.35 + 0.15 * pu); ctx.save(); ctx.translate(cx, cyc + S(180)); ctx.scale(1 + 0.025 * pu, 1 - 0.02 * pu); ctx.translate(-cx, -(cyc + S(180))); UI.artImg(ctx, 'chest', cx, cyc, S(580)); ctx.restore();
      UI.outlined(ctx, 'TOUCHE POUR OUVRIR', cx, Y(0.72), UI.fit(ctx, 'TOUCHE POUR OUVRIR', cw * 0.86, S(70)), '#FFFFFF', '#000000', { keep: true, ow: 0.12 });
      hit(ui, 0, 0, W, H, () => { ch.st = 'shake'; ch.t1 = performance.now(); game.audio.play('padArm'); if (CC.Haptics) CC.Haptics.tick('touch'); });
    } else if (ch.st === 'shake') {
      const t = (now - ch.t1) / 1000, dur = 1.35, a = Math.sin(t * 70) * (0.03 + 0.07 * Math.min(1, t / 0.9)), sc = 1 + 0.1 * Math.min(1, t / dur), l = Math.max(0, (t - 0.6) / 0.75);
      glowAt(cx, cyc, S(430) + l * S(520), 0.4 + l * 0.6); ctx.save(); ctx.translate(cx, cyc + S(180)); ctx.rotate(a); ctx.scale(sc, sc); ctx.translate(-cx, -(cyc + S(180))); UI.artImg(ctx, 'chest', cx + Math.sin(t * 90) * S(5) * l, cyc, S(580)); ctx.restore();
      if (l > 0.35) { ctx.fillStyle = 'rgba(255,248,220,' + Math.min(0.95, (l - 0.35) * 1.5) + ')'; ctx.fillRect(0, -(ui.offsetY || 0), W, ui.fullH || H); }
      if (t >= dur) { game.evoChest = null; E.openChest(game); if (game.evoChest) { game.evoHold = { c: game.evoChest.coins, g: game.evoChest.gems }; game.evoChest.st = 'open'; game.evoChest.t2 = performance.now(); game.flash = 0.5; game.flashColor = '#FFF2C0'; } }
    } else if (ch.st === 'open') {
      const k = (now - ch.t2) / 1000, e = ease(k * 2.6), pw = cw * 0.88, ph = S(1000), px = cx - pw / 2, py = Y(0.5) - ph / 2;
      ctx.save(); ctx.translate(cx, Y(0.5)); ctx.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e); ctx.globalAlpha = Math.min(1, e * 1.4); ctx.translate(-cx, -Y(0.5));
      glowAt(cx, py + S(210), S(380), 0.3);
      UI.panel(ctx, px, py, pw, ph, { c: S(60), fill: '#26394B' });
      rr0(ctx, px + S(14), py + S(14), pw - S(28), ph - S(28), S(40)); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = S(4); ctx.stroke();
      UI.artImg(ctx, 'chest_open', cx, py + S(250), S(420));
      { const hw = pw * 0.9, hh = S(120), hx = cx - hw / 2, hy = py - S(50); rr0(ctx, hx, hy + S(8), hw, hh, S(30)); ctx.fillStyle = '#12306A'; ctx.fill(); rr0(ctx, hx, hy, hw, hh, S(30)); const g = ctx.createLinearGradient(0, hy, 0, hy + hh); g.addColorStop(0, '#3C9BEF'); g.addColorStop(1, '#1F6FD0'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = '#FFFFFF'; ctx.stroke(); UI.outlined(ctx, 'COFFRE DE RÉCOMPENSE', cx, hy + hh / 2, UI.fit(ctx, 'COFFRE DE RÉCOMPENSE', hw * 0.9, S(64)), '#FFFFFF'); }
      UI.outlined(ctx, 'Vous avez obtenu :', cx, py + S(520), S(54), '#C9D6E4');
      { const ay = py + S(570), ah = S(270); rr0(ctx, px + S(40), ay, pw - S(80), ah, S(30)); ctx.fillStyle = '#16222E'; ctx.fill();
        const tiles = [{ art: 'coin', n: ch.coins, c0: '#FFD66B', c1: '#E8A317' }, { art: 'gem', n: ch.gems, c0: '#7FD0FF', c1: '#2E86DE' }], ts = S(210), gap = S(40), tot = tiles.length * ts + (tiles.length - 1) * gap;
        tiles.forEach((t, i) => { const tx = cx - tot / 2 + i * (ts + gap), ty = ay + (ah - ts) / 2, kk = ease((k - 0.25 - i * 0.18) * 3); if (kk <= 0) return; ctx.save(); ctx.translate(tx + ts / 2, ty + ts / 2); ctx.scale(kk, kk); ctx.translate(-tx - ts / 2, -ty - ts / 2);
          rr0(ctx, tx, ty, ts, ts, S(26)); const g = ctx.createLinearGradient(0, ty, 0, ty + ts); g.addColorStop(0, t.c0); g.addColorStop(1, t.c1); ctx.fillStyle = g; ctx.fill(); UI.artImg(ctx, t.art, tx + ts / 2, ty + ts * 0.44, ts * 0.62); UI.outlined(ctx, U.formatInt(t.n), tx + ts / 2, ty + ts * 0.86, UI.fit(ctx, U.formatInt(t.n), ts * 0.9, S(56)), '#FFFFFF', '#000000', { keep: true, ow: 0.16 }); ctx.restore(); }); }
      { const by = py + S(870), bh = S(130), gp = S(30), bw = (pw - S(80) - gp) / 2, bx0 = px + S(40), bx1 = bx0 + bw + gp;
        const dbl = !!ch.doubled; UI.btnSecondary(ctx, bx0, by, bw, bh, '', {}); ctx.save(); if (dbl) ctx.globalAlpha = 0.45; UI.outlined(ctx, 'X2', bx0 + bw * 0.4, by + bh * 0.42, S(70), '#FFFFFF'); UI.artImg(ctx, 'ticket', bx0 + bw * 0.74, by + bh * 0.42, S(84)); ctx.restore();
        UI.btnPrimary(ctx, bx1, by, bw, bh, 'RÉCLAMER', { px: S(56) });
        hit(ui, bx0, by, bw, bh, () => { if (ch.doubled) return; const go = () => { ch.doubled = true; const S0 = E.save(game); S0.coins += ch.coins; ch.coins *= 2; game.evoHold = { c: ch.coins, g: ch.gems }; game.writeSave(); game.audio.play('coinPing'); game.flash = 0.25; game.flashColor = '#FFF2C0'; }; if (game.ads && game.ads.enabled && game.ads.enabled() && game.ads.rewarded) game.ads.rewarded(go, null, 'chestx2', 'COFFRE X2'); else go(); });
        hit(ui, bx1, by, bw, bh, () => { const c0 = ch.coins, g0 = ch.gems; game.evoChest = null; game.audio.play('uiTick'); game.evoHold = { c: 0, g: 0 }; Home.evoFly(game, c0, g0, 30, Y(0.5) + S(205), cx); }); }
      ctx.restore();
      hit(ui, 0, 0, W, H, () => {});
    }
    ctx.restore();
  }
  // ---------- MENU ----------
  Home.drawEvo = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game), last = game.evoLast, now = performance.now(), anim = game.evoAnim;
    const chTop = T0 + HH - ((cw - S(26) * 2 - S(14) * 2) / 3) / 0.703 - S(28);
    topBar(ui, ctx, game, F, S0, E);
    if (anim && !(anim.ui !== undefined && anim.t > anim.ui)) { const a = U.clamp(anim.t / 0.4, 0, 1) * (1 - U.smooth(anim.dur - 0.6, anim.dur, anim.t)), name = anim.label + ' !'; ctx.save(); ctx.globalAlpha = a; UI.text(ctx, name, cx, Y(0.2), UI.fit(ctx, name, cw * 0.9, S(130)), T.yellow, { outline: true }); UI.text(ctx, anim.sub || 'NOUVELLE PIÈCE', cx, Y(0.27), S(52), T.white, { outline: true }); ctx.restore(); return; }
    // (v227 : plus de bande sombre derriere les cartes)
    { const r0 = E.rocket(S0.rk), nm = (E.isS2() ? TIERNAME2 : TIERNAME)[r0.tier], sp = nm.indexOf(' '), l1 = nm.slice(0, sp), l2 = nm.slice(sp + 1), bw = S(380), bh = S(104), bx = cx - bw / 2 + S(30), by = T0 + S(172), bd = Math.max(2, S(4)), rd = S(12);
      rr0(ctx, bx - bd, by - bd, bw + bd * 2, bh + bd * 2, rd + bd); ctx.fillStyle = '#05080C'; ctx.fill(); rr0(ctx, bx, by, bw, bh, rd); ctx.fillStyle = '#26394B'; ctx.fill();
      ctx.save(); rr0(ctx, bx, by, bw, bh, rd); ctx.clip(); ctx.fillStyle = '#1B2A38'; ctx.fillRect(bx, by + bh - S(9), bw, S(9)); ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetY = S(6); ctx.shadowOffsetX = S(3); ctx.shadowBlur = 0; UI.icon(ctx, 'missile_ogive', bx + S(6), by + bh / 2 - S(4), S(128)); ctx.restore();
      UI.outlined(ctx, l1, bx + bw * 0.56, by + bh * 0.33, UI.fit(ctx, l1, bw * 0.5, S(40)), '#F0EDE4'); UI.outlined(ctx, l2, bx + bw * 0.56, by + bh * 0.64, UI.fit(ctx, l2, bw * 0.5, S(36)), '#F0EDE4');
      UI.tap(ui, bx, by, bw, bh, () => { game.evoLvPop = !game.evoLvPop; }); }
    if (last && last.zone2) {
      const NAMES = { rk5: 'AILES', rk10: 'RÉACTEUR', rk15: 'TURBO', weak: '1ER ENNEMI TROP FORT', d300: '300 M', d1000: '1000 M', d2000: '2000 M', boss: 'BOSS VAINCU' };
      const ms = Object.keys(S0.marks || {}).filter((k) => NAMES[k]).sort((a, b) => S0.marks[a].sec - S0.marks[b].sec).slice(0, 6), ph = S(120) + ms.length * S(66);
      UI.panel(ctx, ox + cw * 0.06, Y(0.17), cw * 0.88, ph, { c: S(28) }); UI.text(ctx, '+' + (game.evoClearBonus || 600) + ' PIÈCES', cx, Y(0.17) + S(60), S(60), T.yellow, { shadow: false });
      ms.forEach((k, i) => UI.text(ctx, NAMES[k] + '  -  VOL ' + S0.marks[k].run + '  ' + E.fmt(S0.marks[k].sec), cx, Y(0.17) + S(130) + i * S(66), UI.fit(ctx, NAMES[k] + '  -  VOL 99  99:99', cw * 0.8, S(38)), k === 'boss' ? T.yellow : T.white, { shadow: false }));
    }
    if (game.evoRamp && E.RAMPS) {   // v263 : « RAMPE EN FER » quand la rampe change de matiere
      const R = game.evoRamp, q = (now - R.t0) / 1000, name = 'RAMPE EN ' + E.RAMPS[R.tier], a0 = U.clamp(q / 0.3, 0, 1), sc = 1 + 2.7 * Math.pow(a0 - 1, 3) + 1.7 * Math.pow(a0 - 1, 2), fo = U.clamp((R.dur - q) / 0.4, 0, 1);
      ctx.save(); ctx.globalAlpha = fo; ctx.translate(cx, Y(0.3)); ctx.scale(sc, sc); UI.outlined(ctx, name, 0, 0, UI.fit(ctx, name, cw * 0.86, S(96)), ['#E6C58C', '#D79A5A', '#D6DEE6', '#9FB8D2', '#FFD23A', '#8CF0FF'][R.tier], '#000000', { keep: true, ow: 0.16 }); ctx.restore();
    }
    const bs = S(128), lx = ox + S(36), ly = T0 + S(330), free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
    UI.shopStall(ctx, lx, ly - S(6), bs, now); UI.tap(ui, lx, ly, bs, bs, () => { ui.overlay = 'evoShop'; });
    if (!(game.meta && game.meta.noAds)) { const y = ly + bs + S(28); UI.noAdsBadge(ctx, lx, y, bs); UI.tap(ui, lx, y, bs, bs, () => { game.evoNoAds = true; }); }
    { const y = ly + (bs + S(28)) * ((game.meta && game.meta.noAds) ? 1 : 2); if (Home.drawGemTile) Home.drawGemTile(ui, ctx, game, lx, y, bs, now); }
    { const unlocked = S0.runs >= 3, ready = E.chestReady(game), wait = Math.max(0, (S0.chestAt || 0) - Date.now()), rx0 = ox + cw - S(36) - bs, y = ly, pulse = 0.5 + 0.5 * Math.sin(now / 240);
      UI.chestFrame(ctx, rx0, y, bs, ready, unlocked, now);

      // (lueur du coffre pret : voir UI.chestFrame)
      if (unlocked && ready) { const ow = bs * 1.3, oh = S(78), ox2 = rx0 + bs / 2 - ow / 2, oy = y + bs + S(10), f = UI.greenButton(ctx, ox2, oy, ow, oh, { cat: 'la' }); UI.outlined(ctx, 'OUVRIR', ox2 + ow / 2, f.y + f.h * 0.5, UI.fit(ctx, 'OUVRIR', ow * 0.86, f.h * 0.5), '#FFFFFF'); }
      { const lab = !unlocked || ready ? '' : secFmt(wait); if (lab) UI.outlined(ctx, lab, rx0 + bs / 2, y + bs + S(34), UI.fit(ctx, lab, bs * 1.2, S(36)), '#F0EDE4'); }
      if (unlocked) UI.tap(ui, rx0 - S(10), y, bs + S(20), bs + S(86), () => { if (!game.evoChest && E.chestReady(game)) { game.evoChest = { st: 'wait', t0: performance.now() }; game.audio.play('uiTick'); } });
      if (E.stage) { const y2 = T0 + S(176) + S(104) - S(100);
        if (game.evoLvPop) { const stg = E.stage(game), pw = S(420), rh = S(104), px0 = cx - pw / 2 + S(30), py0 = y2 + S(100); hit(ui, px0, py0, pw, rh * 2, () => {}); UI.panel(ctx, px0, py0 - S(10), pw, rh * 2 + S(20), { c: S(24), border: T.white });
          for (let nn = 1; nn <= 2; nn++) { const yy = py0 + (nn - 1) * rh, open = true, on = stg === nn; if (on) { ctx.fillStyle = 'rgba(255,230,0,0.14)'; ctx.fillRect(px0 + S(6), yy + S(4), pw - S(12), rh - S(8)); } UI.text(ctx, 'NIVEAU ' + nn, px0 + S(30), yy + rh / 2, S(44), open ? T.white : T.dim, { align: 'left', shadow: false }); if (!open) UI.glyph(ctx, 'lock', px0 + pw - S(50), yy + rh / 2, S(26), T.dim); hit(ui, px0, yy, pw, rh, () => { game.evoLvPop = false; if (open && !on) E.switchStage(game, nn); }); }
          hit(ui, 0, T0, W, HH, () => { game.evoLvPop = false; }); } } }
    { const k = 1 + 0.025 * Math.sin(now / 420), s = 'APPUYEZ POUR LANCER', yy = T0 + HH * 0.4; ctx.save(); ctx.translate(cx, yy); ctx.scale(k, k); ctx.translate(-cx, -yy);
      { const px = UI.fit(ctx, s, cw * 0.7, S(58)); UI.outlined(ctx, s, cx, yy, px, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', { keep: true, ow: 0.2 }); UI.outlined(ctx, s, cx, yy, px, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', { keep: true, ow: 0.13 }); UI.outlined(ctx, s, cx, yy, px, '#F0EDE4', '#000000', { keep: true, ow: 0.07 }); } ctx.restore(); }
    const gap = S(34), marg = S(40), cwd = (cw - marg * 2 - gap * 2) / 3, chh = ((cw - S(26) * 2 - S(14) * 2) / 3) / 0.703, cy0 = T0 + HH - chh - S(28), cards = [];
    ['la', 'rk', 'cm'].forEach((id, i) => cards.push(card(ui, ctx, game, E, S0, id, ox + marg + i * (cwd + gap), cy0, cwd, chh, now)));
    // (plus d'etoile sur l'ogive)
    for (const c of cards) if (!c.can && c.cost !== null && game.evoGemOffer === c.id) UI.tap(ui, c.bx, c.by, c.bw, c.bh, () => E.buyGem(game, c.id));
    for (const c of cards) hit(ui, c.rx, c.y, c.w, c.h, () => E.buy(game, c.id));
    if (game.evoChest) ui.buttons.length = 0;   // le coffre ouvert capte tous les touchers
    chestOverlay(ui, ctx, game, F, E, now, W, H); if (game.evoNoAds && Home.drawNoAdsPanel) Home.drawNoAdsPanel(ui, ctx, game, W, H, F); flyDraw(ctx, game, F, now);
    hit(ui, 0, T0 + S(160), W, Y(0.68) - T0 - S(160), () => { game.evoLvPop = false; E.start(game); }, true);
  };

  // ---------- MINI-JEU (ecran provisoire : il montre ou se range le mode et le parcours du joueur) ----------
  Home.drawEvoMini = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game), tk = E.miniTickets(game);
    bgPattern(ctx, W, T0, HH); topBar(ui, ctx, game, F, S0, E, { close: () => { ui.overlay = 'evo'; } });
    UI.outlined(ctx, 'MINI-JEU', cx, Y(0.16), S(104), T.white);
    UI.outlined(ctx, 'COURSE CONTRE LE FANTÔME', cx, Y(0.215), UI.fit(ctx, 'COURSE CONTRE LE FANTÔME', cw * 0.86, S(64)), '#9FD0FF');
    miniIcon(ctx, cx - S(150), Y(0.28), S(300), tk, performance.now());
    UI.outlined(ctx, 'MINI-NIVEAU 1', cx, Y(0.56), S(78), T.white);
    UI.outlined(ctx, 'BIENTÔT DISPONIBLE', cx, Y(0.615), S(52), '#FFD23A');
    UI.outlined(ctx, 'TICKETS DU JOUR : ' + tk + ' / 2', cx, Y(0.69), S(54), '#FFFFFF');
    const bw = cw * 0.8, bh = S(150), bx = cx - bw / 2, by = Y(0.74);
    UI.btnPrimary(ctx, bx, by, bw, bh, 'JOUER', { px: S(70), disabled: true });
    UI.btnSecondary(ctx, bx, by + bh + S(36), bw, bh * 0.8, '+1 TICKET (PUB)', { px: S(52) });
    UI.tap(ui, bx, by + bh + S(36), bw, bh * 0.8, () => { if (E.addMiniTicket) E.addMiniTicket(game, 1); });
    UI.btnSecondary(ctx, bx, Y(0.92) - S(20), bw, bh * 0.7, 'RETOUR', { px: S(52) }); UI.tap(ui, bx, Y(0.92) - S(20), bw, bh * 0.7, () => { ui.overlay = 'evo'; });
  };
  // ---------- JAUGE DE PRESSION (lancement au piston) ----------
  const lerpC = (a, b, t) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const powerCol = (k) => k < 0.5 ? lerpC('#FF2B2B', '#FFB400', k / 0.5) : lerpC('#FFB400', '#3FD84A', (k - 0.5) / 0.5);   // du rouge vers le vert
  Home.drawEvoAim = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, cw, cx } = F, E = CC.EVO, a = game.evoAim, now = performance.now();
    if (!a || a.auto) return; const ch = U.clamp(a.ch || 0, 0, 1);
    // jauge de puissance : demi-cercle qui se remplit du rouge au vert (aucun echec : plus on maintient, plus c'est fort)
    const R = cw * 0.3, ccy = Y(1.0) + S(24), a0 = Math.PI, a1 = 2 * Math.PI, N = 36;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, ccy, R * 1.12, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fillStyle = 'rgba(30,32,36,0.92)'; ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = T.border2; ctx.stroke();
    for (let k = 0; k < N; k++) { const v0 = k / N, v1 = (k + 1) / N, on = v0 < ch; ctx.beginPath(); ctx.arc(cx, ccy, R * 0.86, a0 + (a1 - a0) * v0 + 0.012, a0 + (a1 - a0) * v1 - 0.012); ctx.lineWidth = R * 0.2; ctx.lineCap = 'butt'; ctx.strokeStyle = on ? powerCol((v0 + v1) / 2) : 'rgba(80,84,92,0.55)'; ctx.stroke(); }
    ctx.restore();
    const pct = Math.round(ch * 100); UI.text(ctx, pct + '%', cx, ccy - R * 0.42, S(78), ch > 0 ? powerCol(ch) : T.dim, {});
    if (a.lock) { const k = U.clamp(a.lockT / 0.12, 0, 1); UI.text(ctx, a.word, cx, Y(0.45) - (1 - k) * S(30), UI.fit(ctx, a.word, cw * 0.92, S(110)) * (0.8 + 0.2 * k), powerCol(ch), { outline: true }); }
    if (!a.hold && !a.lock) { const bw = S(230), bh = S(92), bx = F.ox + S(36), by = F.T0 + S(40); rr0(ctx, bx, by + S(6), bw, bh, S(20)); ctx.fillStyle = '#A81818'; ctx.fill(); rr0(ctx, bx, by, bw, bh, S(20)); ctx.fillStyle = '#FF3B3B'; ctx.fill(); UI.outlined(ctx, 'Retour', bx + bw / 2, by + bh / 2, UI.fit(ctx, 'Retour', bw * 0.7, S(52)), '#FFFFFF'); game.evoBackRect = { x: bx, y: by, w: bw, h: bh }; } else game.evoBackRect = null;
    hit(ui, 0, 0, W, H, () => {}, true);
  };

  // ---------- RAPPORT DE MISSION (sur le lieu du crash) ----------
  Home.drawEvoReport = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game), last = game.evoLast, now = performance.now();
    if (!last) { game.ui.overlay = 'evo'; return; }
    if (!last.t0) last.t0 = now; if (!last.released) game.evoHold = { c: last.total || 0, g: 0 }; const release = () => { if (last.released) return; last.released = true; game.evoHold = { c: last.total || 0, g: 0 }; Home.evoFly(game, 0, 0, 20, last.totY, cx); }; const tt = (now - last.t0) / 1000, adsOn = !!(game.ads && game.ads.enabled());
    { const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, 'rgba(10,11,14,0.7)'); g.addColorStop(0.5, 'rgba(10,11,14,0.4)'); g.addColorStop(1, 'rgba(10,11,14,0.8)'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); }
    topBar(ui, ctx, game, F, S0, E, { noGear: true });
    // sequence (3 s) : titre, distance qui defile + pieces, cibles, multiplicateur de revenu, total, puis le bouton « multiplier » et enfin « suivant »
    const rows = [];
    rows.push({ kind: 'dist', val: last.lines[0] ? last.lines[0][1] : 0 });
    if (last.kills) rows.push({ kind: 'kills', lab: 'CIBLES DÉTRUITES  ' + last.kills, val: last.lines.length > 1 && /^ENNEMIS/.test(last.lines[1][0]) ? last.lines[1][1] : 0 });
    const mult = E.mult(S0.cm); rows.push({ kind: 'mult', lab: 'MULTIPLICATEUR DE REVENU', mult: 'X' + f1(mult) });
    for (const ln of last.lines) if (/^PUB/.test(ln[0])) rows.push({ kind: 'ad', lab: 'BONUS PUBLICITÉ  ' + ln[0].replace('PUB ', ''), val: ln[1], t: ln[2] || 0 });
    const STEP = 0.36, tRow = (i) => 0.34 + i * STEP, nBase = rows.filter((r) => r.kind !== 'ad').length, tTot = tRow(nBase) + 0.04, tMul = tTot + 0.78, tNext = tMul + 0.36;
    const tk = U.clamp(tt / 0.3, 0, 1);
    { const TS = 'RAPPORT DE MISSION', tp = UI.fit(ctx, TS, cw * 0.92, S(104)), ty0 = Y(0.17), w0 = UI.tw(ctx, TS, tp), x0 = cx - w0 / 2;   // v263 : les lettres grossissent l'une apres l'autre, vite
      for (let k = 0; k < TS.length; k++) { const ch = TS[k]; if (ch === ' ') continue; const q = U.clamp((tt - 0.03 - k * 0.04) / 0.2, 0, 1); if (q <= 0) continue; const sc = 1 + 2.7 * Math.pow(q - 1, 3) + 1.7 * Math.pow(q - 1, 2), pre = UI.tw(ctx, TS.slice(0, k), tp), cwd = UI.tw(ctx, ch, tp);
        ctx.save(); ctx.translate(x0 + pre + cwd / 2, ty0); ctx.scale(sc, sc); UI.text(ctx, ch, 0, 0, tp, T.yellow, { outline: true }); ctx.restore(); }
      const kk = (((tt - 1.3) % 5 + 5) % 5) / 0.8; if (tt > 1.3 && kk < 1) { const p = x0 - w0 * 0.2 + w0 * 1.4 * kk, g = ctx.createLinearGradient(p, 0, p + w0 * 0.2, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.save(); UI.setFont(ctx, tp); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = g; ctx.fillText(TS, cx, ty0); ctx.restore(); } }
    const px0 = ox + cw * 0.05, pw = cw * 0.9, py0 = Y(0.225), rowH = S(112), totH = S(180), ph = S(40) + rows.length * (rowH + S(12)) + totH + S(44);
    UI.panel(ctx, px0, py0, pw, ph, { c: S(36), border: T.border2, bw: S(4) });
    rows.forEach((r, i) => {
      const t0 = r.kind === 'ad' ? 0 : tRow(i), a = r.t ? U.clamp((now - r.t) / 350, 0, 1) : U.clamp((tt - t0) / 0.26, 0, 1), y = py0 + S(26) + i * (rowH + S(12)); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * S(24));
      const fl = r.kind === 'ad' && r.t ? U.clamp(1 - (now - r.t) / 900, 0, 1) : 0, e = r.t ? ease((now - r.t) / 900) : ease((tt - t0) / 0.7);
      UI.panel(ctx, px0 + S(24), y, pw - S(48), rowH, { c: S(22), fill: fl > 0 ? 'rgba(255,230,0,' + (0.1 + 0.25 * fl) + ')' : T.bg2, border: T.border, bw: S(2) });
      const lab = r.kind === 'dist' ? 'DISTANCE ' + U.formatInt(Math.round(last.dist * e)) : r.lab, ix = px0 + S(90), iy = y + rowH / 2;
      if (r.kind === 'dist') UI.artImg(ctx, 'pin', ix, iy, S(86)); else if (r.kind === 'kills') UI.glyph(ctx, 'target', ix, iy, S(40), '#5AC3DF'); else if (r.kind === 'ad') UI.icon(ctx, 'video', ix, iy, S(70)); else UI.glyph(ctx, 'plus', ix, iy, S(30), '#3CC027');
      UI.text(ctx, lab, px0 + S(150), iy, UI.fit(ctx, r.kind === 'dist' ? 'DISTANCE 99 999' : lab, pw * (r.kind === 'mult' ? 0.5 : 0.45), r.kind === 'mult' ? S(32) : S(44)), r.kind === 'mult' ? T.dim : T.white, { align: 'left', shadow: false });
      if (r.kind === 'mult') UI.text(ctx, r.mult + ' »', px0 + pw - S(60), iy, S(56), T.yellow, { align: 'right', shadow: false });
      else { const vs = U.formatInt(Math.round(r.val * e)), vp = UI.fit(ctx, vs, pw * 0.26, S(56)), cnt = r.t ? 0 : (e < 1 ? 1 : 0), bob = cnt ? 1 + 0.09 * Math.sin(now / 45) : 1; UI.icon(ctx, 'coin', px0 + pw - S(76), iy, S(60) * bob); ctx.save(); ctx.translate(px0 + pw - S(120), iy); ctx.scale(bob, bob); UI.text(ctx, vs, 0, 0, vp, cnt ? T.yellowL : T.yellow, { align: 'right', shadow: false }); ctx.restore(); }
      if (r.kind === 'dist') shimmer(ctx, px0 + S(24), y, pw - S(48), rowH, S(12), (tt - t0 - 0.05) / 0.6);
      ctx.restore(); });
    { const y = py0 + S(26) + rows.length * (rowH + S(12)) + S(30), a = U.clamp((tt - tTot) / 0.25, 0, 1);
      if (a > 0) { ctx.save(); ctx.globalAlpha = a;
        const dtm = Math.min(0.1, (now - (last._tn || now)) / 1000); last._tn = now; if (last.disp === undefined) last.disp = 0;
        if (tt < tTot + 0.8) last.disp = last.total * ease((tt - tTot) / 0.72); else { last.disp += (last.total - last.disp) * (1 - Math.exp(-dtm * 5)); if (Math.abs(last.total - last.disp) < 1) last.disp = last.total; }
        const pop = 1 + 0.05 * U.clamp(1 - (now - (last.popT || 0)) / 300, 0, 1); ctx.translate(cx, y + totH / 2); ctx.scale(pop, pop); ctx.translate(-cx, -(y + totH / 2));
        UI.panel(ctx, px0 + S(24), y, pw - S(48), totH, { c: S(28), fill: 'rgba(255,230,0,0.06)', border: T.white, bw: S(5) }); UI.text(ctx, 'TOTAL', cx, y + totH * 0.22, S(46), T.white, { shadow: false }); last.totY = y + totH / 2; shimmer(ctx, px0 + S(24), y, pw - S(48), totH, S(15), (((tt - tTot - 0.05) % 2.5 + 2.5) % 2.5) / 0.6);
        const vs = U.formatInt(Math.round(last.disp)), vp = UI.fit(ctx, vs, pw * 0.5, S(118)), zk = ease((tt - tTot) / 0.5), zs = 1 + (1 - zk) * 1.3; ctx.save(); ctx.globalAlpha = a * Math.min(1, zk * 1.6); ctx.translate(cx, y + totH * 0.64); ctx.scale(zs, zs); ctx.translate(-cx, -(y + totH * 0.64)); UI.text(ctx, vs, cx, y + totH * 0.64, vp, T.yellow, { outline: true, ow: 0.18 }); UI.icon(ctx, 'coin', cx + UI.tw(ctx, vs, vp) / 2 + S(52), y + totH * 0.62, S(76)); ctx.restore();
        if (last.fx) { const k = U.clamp(1 - (now - last.fx.t0) / 1300, 0, 1); if (k > 0) UI.text(ctx, '+' + U.formatInt(last.fx.n), px0 + pw - S(90), y + totH * 0.3 - (1 - k) * S(90), S(66), T.yellowL, { align: 'right', outline: true }); }
        ctx.restore(); } }
    if (last.record && tt > tTot && Math.sin(now / 150) > -0.5) UI.text(ctx, 'NOUVEAU RECORD !', cx, py0 + ph + S(44), S(60), T.yellow, { outline: true });
    const by0 = py0 + ph + S(96);
    if (adsOn) {
      const bw = cw * 0.9, bh = S(190), bx = cx - bw / 2, aM = U.clamp((tt - tMul) / 0.3, 0, 1), aN = U.clamp((tt - tNext) / 0.3, 0, 1), b2y = by0 + bh + S(34), b2h = S(160), wA = bw * 0.62, wB = bw * 0.34;
      if (aM > 0) { ctx.save(); ctx.globalAlpha = aM; ctx.translate(0, (1 - aM) * S(20));
        UI.panel(ctx, bx, by0, bw, bh, { c: S(30), border: T.border2, bw: S(4) });
        const sw2 = bw * 0.9, sx = cx - sw2 / 2, sY = by0 + bh * 0.5, sh = bh * 0.3, X = (v) => sx + sw2 * (v + 1) / 2;
        if (!last.mult) last.cur = Math.sin((now - last.t0) / 260); const lock = !!last.mult, pos = lock ? last.mult.p : last.cur, mv = lock ? last.mult.m : multAt(pos);
        const edges = [[-1, -0.68, 1.5], [-0.68, -0.32, 2], [-0.32, -0.07, 3], [-0.07, 0.07, 4], [0.07, 0.32, 3], [0.32, 0.68, 2], [0.68, 1, 1.5]];
        ctx.save(); UI.rrect(ctx, sx, sY, sw2, sh, sh * 0.5); ctx.clip(); for (const [v0, v1, m] of edges) { ctx.fillStyle = MCOL[m]; ctx.fillRect(X(v0), sY, X(v1) - X(v0) + 1, sh); } ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(sx, sY, sw2, sh * 0.4); ctx.restore(); UI.rrect(ctx, sx, sY, sw2, sh, sh * 0.5); ctx.lineWidth = S(4); ctx.strokeStyle = T.ink; ctx.stroke();
        for (const [v0, v1, m] of edges) { const lbl = 'X' + (m === 1.5 ? '1,5' : m); UI.outlined(ctx, lbl, (X(v0) + X(v1)) / 2, by0 + bh * 0.24, UI.fit(ctx, lbl, Math.max((X(v1) - X(v0)) * 0.95, S(54)), S(38)), '#FFFFFF'); }
        const x = X(pos), cy0 = sY - S(17), cy1 = sY + sh + S(8); ctx.save(); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - S(11), cy0); ctx.lineTo(x + S(11), cy0); ctx.lineTo(x + S(5), sY - S(3)); ctx.lineTo(x + S(5), cy1); ctx.lineTo(x - S(5), cy1); ctx.lineTo(x - S(5), sY - S(3)); ctx.closePath(); ctx.lineWidth = S(11); ctx.strokeStyle = T.ink; ctx.stroke(); ctx.lineWidth = S(7); ctx.strokeStyle = T.white; ctx.fillStyle = T.white; ctx.fill(); ctx.stroke(); ctx.restore();   // v258 : curseur d'un seul tenant, bouts arrondis
        if (!last.doubled) { const f = UI.greenButton(ctx, bx, b2y, wA, b2h, { cat: 'gem' }), tp = Math.min(f.h * 0.27, UI.fit(ctx, 'ET RÉCUPÉRER', wA * 0.5, f.h * 0.27)), lw = Math.max(UI.tw(ctx, 'MULTIPLIER', tp), UI.tw(ctx, 'ET RÉCUPÉRER', tp)), cs2 = f.h * 0.5, tcx = bx + wA * 0.5 + cs2 * 0.45;
          UI.outlined(ctx, 'MULTIPLIER', tcx, f.y + f.h * 0.5 - tp * 0.58, tp, '#FFFFFF'); UI.outlined(ctx, 'ET RÉCUPÉRER', tcx, f.y + f.h * 0.5 + tp * 0.58, tp, '#FFFFFF'); UI.icon(ctx, 'coin', tcx - lw / 2 - cs2 * 0.62, f.y + f.h * 0.5, cs2);
          ctx.save(); ctx.translate(bx + wA - S(28), f.y + S(6)); ctx.rotate(-0.2094); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetY = S(7); ctx.shadowOffsetX = S(3); ctx.shadowBlur = S(4); UI.artImg(ctx, 'ticket', 0, 0, S(92)); ctx.restore(); shimmer(ctx, f.x, f.y, f.w, f.h, f.h * 0.07, (((tt - tMul - 0.1) % 2 + 2) % 2) / 0.6);
          if (tt > tMul + 0.15) UI.tap(ui, bx, b2y, wA, b2h, () => { if (last.mult) return; last.mult = { m: mv, p: pos }; game.audio.play('uiTick'); setTimeout(() => game.ads.rewarded(() => { E.multiply(game, mv); release(); }, null, 'coins', 'PIÈCES X' + (mv === 1.5 ? '1,5' : mv) + '   +' + U.formatInt(Math.round(last.total * (mv - 1)))), 420); }); }
        else UI.text(ctx, 'BONUS X' + (last.doubled === 1.5 ? '1,5' : last.doubled) + ' AJOUTÉ', bx + wA / 2, b2y + b2h / 2, UI.fit(ctx, 'BONUS X1,5 AJOUTÉ', wA * 0.9, S(54)), T.yellow, { outline: true });
        ctx.restore(); }
      if (aN > 0) { ctx.save(); ctx.globalAlpha = aN; const nx = bx + bw - wB, f2 = UI.greenButton(ctx, nx, b2y, wB, b2h, { cat: 'mx' }); UI.outlined(ctx, 'SUIVANT', nx + wB / 2, f2.y + f2.h * 0.5, UI.fit(ctx, 'SUIVANT', wB * 0.84, f2.h * 0.34), '#FFFFFF'); ctx.restore(); if (tt > tNext + 0.1) UI.tap(ui, nx, b2y, wB, b2h, () => { release(); E.afterReport(game); }); }
    } else { const aN = U.clamp((tt - tMul + 0.3) / 0.3, 0, 1); if (aN > 0) { const bw = cw * 0.6, b2h = S(150), b2y = by0 + S(40), nx = cx - bw / 2; ctx.save(); ctx.globalAlpha = aN; UI.btnPrimary(ctx, nx, b2y, bw, b2h, 'SUIVANT'); ctx.restore(); if (aN > 0.6) UI.tap(ui, nx, b2y, bw, b2h, () => { release(); E.afterReport(game); }); } }
    flyDraw(ctx, game, F, now);
  };

  // ---------- BOUTIQUE ----------
  const bgPattern = (ctx, W, T0, HH) => { ctx.fillStyle = T.bg; ctx.fillRect(0, T0, W, HH); const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, 'rgba(120,60,20,0.35)'); g.addColorStop(0.4, 'rgba(30,32,36,0)'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); ctx.save(); ctx.globalAlpha = 0.05; for (let k = 0; k < 12; k++) UI.icon(ctx, 'missile_ogive', ((k * 173) % 100) / 100 * W, T0 + ((k * 331) % 100) / 100 * HH, S(150), { rot: 0.5 }); ctx.restore(); };
  const sectionHead = (ctx, x, y, w, h, label, ico) => { UI.panel(ctx, x, y, w, h, { c: h * 0.28, fill: T.bg2, border: T.border2, bw: S(4) }); if (ico) ico(x + h * 0.6, y + h / 2, h * 0.6); UI.text(ctx, label, x + h * 1.25, y + h * 0.5, UI.fit(ctx, label, w - h * 1.5, h * 0.46), T.white, { align: 'left', shadow: false }); };
  const adsBadge = (ctx, cx, cy, r) => { ctx.save(); ctx.lineWidth = r * 0.22; ctx.strokeStyle = T.red; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke(); UI.text(ctx, 'ADS', cx, cy, r * 0.9, T.white, { outline: true, ow: 0.25 }); ctx.beginPath(); ctx.moveTo(cx - r * 0.72, cy + r * 0.72); ctx.lineTo(cx + r * 0.72, cy - r * 0.72); ctx.lineWidth = r * 0.22; ctx.strokeStyle = T.red; ctx.stroke(); ctx.restore(); };
  Home.drawEvoShop = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game);
    bgPattern(ctx, W, T0, HH); topBar(ui, ctx, game, F, S0, E, { close: () => { ui.overlay = 'evo'; } });
    const buy = (id) => { if (CC.Native && CC.Native.on) { CC.Native.buy(id); return; } if (id === 'noads' || id === 'starter') { const r = game.meta && game.meta.buyNoAds ? game.meta.buyNoAds() : 'no-link'; if (r !== 'no-link') return; } Home.toast(ui, 'ACHAT BIENTÔT DISPONIBLE'); };
    const mx = ox + S(36), mw = cw - S(72);
    sectionHead(ctx, mx, Y(0.145), mw, S(100), 'PACKS SANS PUBLICITÉ', (x, y, r) => adsBadge(ctx, x, y, r * 0.5));
    { const y = Y(0.145) + S(116), h = S(250); UI.panel(ctx, mx, y, mw, h, { c: S(30), border: T.border2, bw: S(4) }); adsBadge(ctx, mx + S(160), y + h * 0.36, S(80)); UI.text(ctx, '+', mx + S(310), y + h * 0.36, S(80), T.white, { shadow: false }); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetY = S(10); ctx.shadowBlur = S(6); UI.icon(ctx, 'gems_belt', mx + S(470), y + h * 0.36, S(210)); ctx.restore(); UI.text(ctx, '10', mx + S(470), y + h * 0.7, S(50), T.white, { outline: true });
      UI.text(ctx, 'Pack de démarrage', mx + S(40), y + h * 0.86, S(52), T.white, { align: 'left', shadow: false }); const bw = S(250), bh = S(92), bx = mx + mw - bw - S(30), by = y + h - bh - S(26); UI.btnPrimary(ctx, bx, by, bw, bh, (CC.Native && CC.Native.price('starter')) || '10,99 €', { px: S(46) }); UI.tap(ui, bx, by, bw, bh, () => buy('starter')); }
    { const y = Y(0.145) + S(116) + S(272), h = S(150); UI.panel(ctx, mx, y, mw, h, { c: S(30), border: T.border2, bw: S(4) }); adsBadge(ctx, mx + S(90), y + h / 2, S(56)); UI.text(ctx, 'Pas de publicités', mx + S(200), y + h * 0.5, S(56), T.white, { align: 'left', shadow: false }); const bw = S(250), bh = S(92), bx = mx + mw - bw - S(30), by = y + (h - bh) / 2; UI.btnPrimary(ctx, bx, by, bw, bh, (CC.Native && CC.Native.price('noads')) || '7,99 €', { px: S(46) }); UI.tap(ui, bx, by, bw, bh, () => buy('noads')); }
    const gy = Y(0.145) + S(116) + S(272) + S(190); sectionHead(ctx, mx, gy, mw, S(100), 'GEMMES', (x, y, r) => UI.icon(ctx, 'gem', x, y, r));
    const tiles = [{ n: 1, ico: 'gem', free: true }, { n: 5, ico: 'gems_rope', p: '2,09 €' }, { n: 10, ico: 'gems_belt', p: '3,69 €' }, { n: 30, ico: 'bag_wings', p: '9,99 €' }, { n: 100, ico: 'gems_chest', p: '25,99 €' }, { n: 250, ico: 'crate_steel', p: '49,99 €', best: true }];
    const gp = S(20), tw0 = (mw - gp * 2) / 3, th = S(400), free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
    tiles.forEach((t, i) => { const x = mx + (i % 3) * (tw0 + gp), y = gy + S(120) + Math.floor(i / 3) * (th + gp);
      UI.panel(ctx, x, y, tw0, th, { c: S(26), border: T.border2, bw: S(4) }); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetY = S(10); ctx.shadowOffsetX = S(3); ctx.shadowBlur = S(6); UI.icon(ctx, t.ico, x + tw0 / 2, y + th * 0.34, tw0 * 0.8); ctx.restore(); UI.text(ctx, String(t.n), x + tw0 / 2, y + th * 0.64, S(54), T.white, { outline: true });
      const bw = tw0 * 0.88, bh = S(84), bx = x + (tw0 - bw) / 2, by = y + th - bh - S(20);
      if (t.free) { UI.btnSecondary(ctx, bx, by, bw, bh, '', {}); UI.icon(ctx, 'video', bx + bh * 0.55, by + bh / 2, bh * 0.7); UI.text(ctx, 'GRATUIT ' + free + '/3', bx + bw * 0.6, by + bh * 0.5, UI.fit(ctx, 'GRATUIT 3/3', bw * 0.64, S(32)), free > 0 ? T.white : T.dim, { shadow: false }); UI.tap(ui, bx, by, bw, bh, () => { if (free > 0) E.gemAd(game, true); }); }
      else { UI.btnSecondary(ctx, bx, by, bw, bh, (CC.Native && CC.Native.price('gems' + t.n)) || t.p, { px: S(40) }); UI.tap(ui, bx, by, bw, bh, () => buy('gems' + t.n)); }
      if (t.best) UI.ribbon(ctx, x + tw0 * 0.22, y + S(46), S(190), S(56), 'BEST VALUE'); });
    if (Home.drawToast) Home.drawToast(ui, ctx, F.L);
  };

  // ---------- APPARENCES ----------
  Home.drawEvoSkins = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game);
    bgPattern(ctx, W, T0, HH); topBar(ui, ctx, game, F, S0, E, { close: () => { ui.overlay = 'evo'; } });
    UI.outlined(ctx, 'APPARENCES', cx, Y(0.16), S(100), T.white);
    const cur = E.livery(game), tw0 = (cw - S(108)) / 2, th = S(260), gx = ox + S(36), gy = Y(0.22);
    E.LIVERIES.forEach((Lv, i) => { const x = gx + (i % 2) * (tw0 + S(36)), y = gy + Math.floor(i / 2) * (th + S(26)), open = S0.rk >= Lv.at, on = cur.id === Lv.id;
      UI.panel(ctx, x, y, tw0, th, { c: S(26), border: on ? T.yellow : T.border, bw: S(on ? 6 : 3) }); ctx.save(); if (!open) ctx.globalAlpha = 0.35; UI.icon(ctx, 'missile_ogive', x + tw0 / 2, y + th * 0.4, th * 0.55); ctx.restore();
      ctx.fillStyle = Lv.body; UI.cham(ctx, x + S(24), y + S(24), S(40), S(40), S(10)); ctx.fill(); ctx.lineWidth = S(2); ctx.strokeStyle = T.border2; ctx.stroke(); ctx.fillStyle = Lv.tip; UI.cham(ctx, x + S(72), y + S(24), S(40), S(40), S(10)); ctx.fill(); ctx.stroke();
      UI.text(ctx, Lv.name, x + tw0 / 2, y + th * 0.84, UI.fit(ctx, Lv.name, tw0 * 0.8, S(46)), on ? T.yellow : T.white, { shadow: false });
      if (!open) { UI.glyph(ctx, 'lock', x + tw0 - S(54), y + S(54), S(26), T.dim); UI.text(ctx, 'NIV ' + (Lv.at + 1), x + tw0 - S(54), y + S(104), S(30), T.dim, { shadow: false }); }
      hit(ui, x, y, tw0, th, () => { if (open) E.setLivery(game, Lv.id); }); });
  };

  // ---------- REGLAGES ----------
  const _oldSettings = Home.drawSettings;
  Home.drawSettings = function (ui, ctx, game, W, H) {
    if (!(CC.EVO && CC.EVO.on)) return _oldSettings.call(this, ui, ctx, game, W, H);
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, s = game.settings, now = performance.now();
    const vib = ['NON', 'FAIBLE', 'MOYEN', 'FORT'], vibV = s.vibration !== undefined ? s.vibration : 2;
    bgPattern(ctx, W, T0, HH);
    UI.outlined(ctx, 'RÉGLAGES', cx, Y(0.075), S(104), T.white);
    const rows = [
      ['SON', 'sound', s.sfx > 0, s.sfx > 0 ? 'OUI' : 'NON', () => ui.toggleVolume(game, 'sfx')],
      ['MUSIQUE', 'sound', s.music > 0, s.music > 0 ? 'OUI' : 'NON', () => ui.toggleVolume(game, 'music')],
      ['VIBRATION', 'vibrate', vibV > 0, vib[vibV], () => { s.vibration = (vibV + 1) % 4; if (CC.Haptics) { CC.Haptics.setLevel(s.vibration); CC.Haptics.tick('fire'); } game.applySettings(); }],
      ['SENSIBILITÉ', null, true, ['DOUCE', 'NORMALE', 'VIVE'][s.touchSens !== undefined ? s.touchSens : 1], () => { s.touchSens = ((s.touchSens !== undefined ? s.touchSens : 1) + 1) % 3; game.applySettings(); }],
      ['RÉINITIALISER', null, false, ui._rst && now - ui._rst < 4000 ? 'SÛR ?' : 'GO', () => { if (ui._rst && performance.now() - ui._rst < 4000) { try { localStorage.removeItem('coldimpact.save'); localStorage.removeItem('closecall.save'); } catch (e) { /* ignore */ } location.reload(); } else ui._rst = performance.now(); }],
    ];
    const gap = S(14), rh = Math.min(S(124), (HH * 0.72) / rows.length - gap), y0 = Y(0.125), x0 = ox + S(40), w = cw - S(80);
    rows.forEach((r, i) => { const y = y0 + i * (rh + gap); UI.panel(ctx, x0, y, w, rh, { c: S(22), border: T.border, bw: S(3) });
      if (r[1]) UI.glyph(ctx, r[1], x0 + S(58), y + rh / 2, S(30), r[2] ? T.yellow : T.dim);
      UI.text(ctx, r[0], x0 + (r[1] ? S(110) : S(34)), y + rh / 2, UI.fit(ctx, r[0], w * 0.5, S(44)), T.white, { align: 'left', shadow: false });
      const vw = Math.max(S(190), UI.tw(ctx, r[3], S(40)) + S(60)), vx = x0 + w - vw - S(18), vh = rh * 0.7, vy = y + (rh - vh) / 2;
      if (r[2]) UI.btnPrimary(ctx, vx, vy, vw, vh, r[3], { px: S(40) }); else UI.btnSecondary(ctx, vx, vy, vw, vh, r[3], { px: S(40), color: T.dim });
      hit(ui, x0, y, w, rh, r[4]); });
    if (Home.drawToast) Home.drawToast(ui, ctx, F.L);
    const bw = cw * 0.5, bh = S(130), bx = cx - bw / 2, by = Y(0.915); UI.btnPrimary(ctx, bx, by, bw, bh, 'RETOUR'); UI.tap(ui, bx, by, bw, bh, () => { ui.overlay = (CC.EVO && CC.EVO.on && game.state === 'MENU') ? 'evo' : null; }); ui.buttons[ui.buttons.length - 1].snd = 'back';
  };

  // ---------- MISSION ACCOMPLIE (fin du niveau) ----------
  Home.drawEvoWin = function (ui, ctx, g, W, H) {
    const W_ = g.evoWin; if (!W_) return; const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, cx } = F, E = CC.EVO, t = (performance.now() - (W_.t0 || performance.now())) / 1000;
    ctx.fillStyle = 'rgba(14,15,18,0.94)'; ctx.fillRect(0, T0, W, HH);
    { const a = Math.min(1, t / 0.5); ctx.save(); ctx.globalAlpha = a; UI.text(ctx, 'MISSION ACCOMPLIE !', cx, Y(0.1), UI.fit(ctx, 'MISSION ACCOMPLIE !', cw * 0.92, S(110)), T.yellow, { outline: true }); ctx.restore(); }
    for (let k = 0; k < 3; k++) { const s = Math.min(1, Math.max(0, (t - 0.3 - k * 0.45) / 0.35)), e = s < 1 ? 1 + 0.5 * Math.sin(s * 3.1416) : 1; Home.evoUI.star(ctx, cx + (k - 1) * S(250), Y(0.22) - (k === 1 ? S(50) : 0), S(120) * (k === 1 ? 1.3 : 1) * s * e); }
    const k2 = Math.min(1, Math.max(0, (t - 1.8) / 1.2)), cs = '+' + U.formatInt(Math.round(W_.bonus * k2)), fs = UI.fit(ctx, cs, cw * 0.6, S(150)); UI.icon(ctx, 'coins_stack', cx - UI.tw(ctx, cs, fs) / 2 - S(110), Y(0.4), S(200)); UI.text(ctx, cs, cx + S(40), Y(0.4), fs, T.yellow, { outline: true });
    UI.text(ctx, 'TOTAL ' + U.formatInt(W_.coins), cx, Y(0.5), S(70), T.white, { shadow: false });
    if (t > 3.2) { const bw = cw * 0.6, bh = S(160), bx = cx - bw / 2, by = Y(0.8), pulse = 1 + 0.03 * Math.sin(t * 5); ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'SUIVANT'); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => { if (W_.stage === 1) E.goStage2(g); else E.backStage1(g); }); }
  };

  // ---------- HUD DE VOL : pause (element de page), jauge de carburant, progression, quelques reperes ----------
  const FUEL_STOPS = [[0, [255, 59, 48]], [0.22, [255, 140, 26]], [0.45, [255, 210, 26]], [0.68, [56, 214, 74]], [0.92, [47, 140, 255]]];
  const fuelCol = (k) => { const S0 = FUEL_STOPS; if (k <= S0[0][0]) return 'rgb(' + S0[0][1].join(',') + ')'; for (let i = 1; i < S0.length; i++) if (k <= S0[i][0]) { const a = S0[i - 1], b = S0[i], q = (k - a[0]) / (b[0] - a[0]); return 'rgb(' + a[1].map((v, j) => Math.round(v + (b[1][j] - v) * q)).join(',') + ')'; } return 'rgb(' + S0[S0.length - 1][1].join(',') + ')'; };
  Home.evoUI.hud = function (ctx, g, W, H, px) {
    const rk = g.rocket, run = g.endlessRun, E = CC.EVO, TT = run && run.T; if (!rk || !run) return;
    const u = H > W ? W : Math.min(W, H * 0.62), ox = (W - u) / 2; UI.begin(u, g.hudPr || 1); const top = H * 0.022, now = performance.now();
    if (E.rocket(E.save(g).rk).tier >= 2 && !(g.evo && g.evo.preview)) {
      const fw = u * 0.46, fh = S(54), fx = ox + u * 0.29, fy = top + S(6), k = U.clamp((rk.active ? rk.fuel : rk.fuelMax) / Math.max(1, rk.fuelMax), 0, 1), lowF = k < 0.22, bl = Math.floor(now / 230) % 2 === 0;
      ctx.save(); rr0(ctx, fx, fy, fw, fh, fh / 2); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = lowF && bl ? '#FF5A4A' : 'rgba(255,255,255,0.9)'; ctx.stroke();
      { const m = S(7), ix = fx + m, iy = fy + m, iw = fw - m * 2, ih = fh - m * 2; ctx.save(); rr0(ctx, ix, iy, iw, ih, ih / 2); ctx.clip();
        ctx.fillStyle = fuelCol(k);   // une seule couleur sur toute la longueur : bleu (plein), vert, jaune, orange, rouge
         ctx.fillRect(ix, iy, iw * k, ih); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(ix, iy, iw, ih * 0.42);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = S(3); for (const t of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.moveTo(ix + iw * t, iy); ctx.lineTo(ix + iw * t, iy + ih); ctx.stroke(); } ctx.restore(); }
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetY = S(5); UI.artImg(ctx, 'fuel', fx + S(8), fy + fh / 2, fh * 1.3); ctx.restore(); ctx.restore();
      if (k < 0.22 && g.state === 'FLIGHT') { const a = 0.6 + 0.4 * Math.sin(now / 150); ctx.save(); ctx.globalAlpha = a; const wy = H * 0.215, wr = S(46); ctx.lineJoin = 'round'; ctx.lineWidth = S(7); ctx.strokeStyle = T.red; ctx.beginPath(); ctx.moveTo(W / 2, wy - wr); ctx.lineTo(W / 2 + wr * 0.95, wy + wr * 0.7); ctx.lineTo(W / 2 - wr * 0.95, wy + wr * 0.7); ctx.closePath(); ctx.stroke(); UI.text(ctx, '!', W / 2, wy + wr * 0.2, wr * 0.9, T.red, { flat: true }); UI.text(ctx, 'CARBURANT FAIBLE', W / 2, wy + wr * 1.6 + S(14), UI.fit(ctx, 'CARBURANT FAIBLE', u * 0.5, S(38)), T.red, { outline: true, ow: 0.2 }); ctx.restore(); }
    }
    { let near = false; for (const m of g.missiles || []) { if (m.alive && m.pos.distanceTo(rk.pos) < 140) { near = true; break; } } if (near && g.state === 'FLIGHT') { const a = 0.55 + 0.45 * Math.sin(now / 110); ctx.save(); ctx.globalAlpha = a; const wy = H * 0.125, wr = S(24), tx = W / 2 - S(150); ctx.lineJoin = 'round'; ctx.lineWidth = S(5); ctx.strokeStyle = T.red; ctx.beginPath(); ctx.moveTo(tx, wy - wr); ctx.lineTo(tx + wr * 0.95, wy + wr * 0.7); ctx.lineTo(tx - wr * 0.95, wy + wr * 0.7); ctx.closePath(); ctx.stroke(); UI.text(ctx, '!', tx, wy + wr * 0.2, wr * 0.9, T.red, { flat: true }); UI.text(ctx, 'MISSILE !', W / 2 + S(22), wy + wr * 0.1, S(44), T.red, { outline: true, ow: 0.2 }); ctx.restore(); } }
    { const pct = U.clamp(run.dist / Math.max(1, (TT && TT.levelLen) || 5000), 0, 1), bh = H * 0.36, bw = bh * 0.15, bx = ox + u - S(40) - bw, by = top;
      // piste : fond gris (#696a6d) aux bouts arrondis, progression bleue (#387cee), puis le cadre fourni par-dessus
      const tx = bx + bw * 0.213, tw2 = bw * 0.567, ty = by + bh * 0.125, th = bh * 0.77, rr2 = tw2 / 2; ctx.save(); ctx.beginPath(); ctx.moveTo(tx + rr2, ty); ctx.arc(tx + rr2, ty + rr2, rr2, -Math.PI / 2, 0); ctx.lineTo(tx + tw2, ty + th - rr2); ctx.arc(tx + rr2, ty + th - rr2, rr2, 0, Math.PI / 2); ctx.arc(tx + rr2, ty + th - rr2, rr2, Math.PI / 2, Math.PI); ctx.lineTo(tx, ty + rr2); ctx.arc(tx + rr2, ty + rr2, rr2, Math.PI, Math.PI * 1.5); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fill(); ctx.clip();
      ctx.fillStyle = '#387CEE'; ctx.fillRect(tx, ty + th * (1 - pct), tw2, th * pct + 1); ctx.restore();
      if (!UI.artImg(ctx, 'bar', bx + bw / 2, by + bh / 2, bh)) UI.checkFlag(ctx, bx, by, bw, S(60));
      { const S1 = E.save(g), rec = (S1 && S1.best) || 0; if (rec > 0) {   // v258 : le record : un trait sur la barre et une fleche arrondie qui depasse a droite
          const rp = U.clamp(rec / Math.max(1, (TT && TT.levelLen) || 5000), 0, 1), ry = ty + th * (1 - rp), aw = bw * 0.4, ah = bw * 0.44, tip = bx + bw * 0.6, bk = tip + aw, lw = bw * 0.11, off = bw * 0.05;
          ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = S(7); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(tx + S(2), ry + S(2)); ctx.lineTo(tip, ry + S(2)); ctx.stroke(); ctx.lineWidth = S(4.5); ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(tx + S(2), ry); ctx.lineTo(tip, ry); ctx.stroke();
          const tri = (dy) => { ctx.beginPath(); ctx.moveTo(tip + lw * 0.5, ry + dy); ctx.lineTo(bk - lw * 0.5, ry - ah / 2 + dy); ctx.lineTo(bk - lw * 0.5, ry + ah / 2 + dy); ctx.closePath(); };
          tri(off); ctx.lineWidth = lw + S(9); ctx.strokeStyle = '#0F3A8C'; ctx.fillStyle = '#0F3A8C'; ctx.fill(); ctx.stroke();
          tri(0); ctx.lineWidth = lw + S(9); ctx.strokeStyle = '#2F7BEA'; ctx.stroke(); ctx.lineWidth = lw; const ag = ctx.createLinearGradient(0, ry - ah / 2, 0, ry + ah / 2); ag.addColorStop(0, T.yellowL); ag.addColorStop(1, T.yellow); ctx.strokeStyle = T.yellow; ctx.fillStyle = ag; ctx.fill(); ctx.stroke(); ctx.restore(); } }
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowOffsetX = S(6); ctx.shadowOffsetY = S(8); ctx.shadowBlur = S(3); UI.icon(ctx, 'missile_ogive', bx + bw / 2, ty + th * (1 - pct) - S(6), S(84), { rot: -Math.PI / 4 }); ctx.restore(); UI.text(ctx, Math.round(pct * 100) + '%', bx + bw / 2, by + bh + S(52), S(70), T.white, { outline: true }); }
    { const kmh = rk.active ? rk.vel.length() * 3.6 : 0, R = S(112), cx = ox + S(36) + R, cy = top + S(172) + R, D = R * 2 / 0.74, rf = D * 0.262, cyf = cy + D * 0.02;
      // echelle : la vitesse max de la fusee dans cette partie (palier reacteur : sa vitesse limite ; sinon la plus grande vitesse atteinte)
      const S1 = E.save(g), rkS = E.rocket(S1.rk), ref = (rkS.tier >= 2 ? rkS.vmax : E.launcher(S1.la).speed) * 3.6; if (!g._spk || g._spkRun !== run) { g._spk = ref; g._spkRun = run; } g._spk = Math.max(g._spk, kmh);
      const dialMax = Math.max(60, g._spk), f = Math.min(1, kmh / dialMax), high = f >= 0.72, low = f < 0.3 && rk.active, atMax = f >= 0.97, blink = Math.floor(now / 260) % 2 === 0;
      const arcCol = atMax ? '#FF9A1F' : low ? (blink ? '#FF3B30' : '#2F8CFF') : high ? '#38D64A' : '#2F8CFF';
      { const gr = ctx.createLinearGradient(0, cyf, 0, cyf + rf); gr.addColorStop(0, 'rgba(44,49,58,0.5)'); gr.addColorStop(1, 'rgba(44,49,58,0)'); ctx.save(); ctx.beginPath(); ctx.arc(cx, cyf, rf, 0, Math.PI); ctx.closePath(); ctx.fillStyle = gr; ctx.fill(); ctx.restore(); }   // moitie basse : gris fonce, 50 % en haut, 0 % en bas
      { const th0 = Math.PI + 0.06, ar = D * 0.236; if (f > 0.004) { ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = D * 0.064; ctx.strokeStyle = arcCol; ctx.shadowColor = arcCol; ctx.shadowBlur = S(8); ctx.beginPath(); ctx.arc(cx, cy + D * 0.006, ar, th0, th0 + f * Math.PI); ctx.stroke(); ctx.restore(); } }
      UI.artImg(ctx, 'speed_ring', cx, cy, D);
      { const im = UI.art('speed_needle'); if (im) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI + f * Math.PI + 0.5236); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, -D / 2, -D / 2, D, D); ctx.restore(); } }
      const ns = String(Math.round(kmh)); blueText(ctx, ns, cx, cyf + rf * 0.36, UI.fit(ctx, ns, rf * 1.1, rf * 0.54), high || atMax ? '#38D64A' : low && blink ? '#FF3B30' : '#FFFFFF');
      UI.text(ctx, atMax ? 'MAX' : 'KM/H', cx, cyf + rf * 0.77, UI.fit(ctx, 'KM/H', rf * 0.85, rf * 0.24), atMax ? '#FF9A1F' : '#FFFFFF', { flat: true }); }
    if (E.titanHud) E.titanHud(ctx, g, ox, u, H, UI, S);
  };
  // petit compteur de pieces de la partie, sous la vitesse
  Home.evoUI.coinCounter = function () { /* v261 : plus de compteur de pieces en vol */ };
  Home.evoUI.coinCounterOld = function (ctx, g, W, H, tot, bump) {
    const u = H > W ? W : Math.min(W, H * 0.62), ox = (W - u) / 2; UI.begin(u, g.hudPr || 1); const h = S(76) * bump, y = H * 0.022 + S(440), s = U.formatInt(tot), w = UI.tw(ctx, s, h * 0.6) + h * 1.8;
    UI.currencyPill(ctx, null, ox + S(36), y, w, h, 'coin', s);
  };
  // le bouton de pause (element de page) prend le meme habillage : carre chanfreine sombre, deux barres jaunes
  try { const st = document.createElement('style'); st.textContent = 'body.cc-evo .cc-pause{top:calc(env(safe-area-inset-top,0px) + 2.2vh);left:calc(50% - min(50vw,31vh) + 3.4vw);width:min(11vw,10vh,64px);height:min(11vw,10vh,64px);max-width:none;border-radius:22%;border:0;box-shadow:none;background:rgba(120,165,225,0.62);clip-path:none;border-radius:22%}body.cc-evo .cc-pause::before{content:"";position:absolute;top:24%;height:52%;left:30%;right:auto;bottom:auto;width:14%;background:#FFFFFF;border-radius:3px;box-shadow:none}body.cc-evo .cc-pause::after{content:"";position:absolute;top:24%;height:52%;right:30%;left:auto;bottom:auto;width:14%;background:#FFFFFF;border-radius:3px;box-shadow:none}'; document.head.appendChild(st); } catch (e) { /* style facultatif */ }

  { const _hud = Home.evoUI.hud;   // v263 : au choc, la vitesse, la progression et le carburant disparaissent en fondu
    Home.evoUI.hud = function (ctx, g) {
      const k = (g.state === 'CRASHED' || g.state === 'IMPACT') ? 1 - U.clamp((g.impactT || 0) / 0.45, 0, 1) : 1; if (k <= 0) return;
      ctx.save(); ctx.globalAlpha *= k; try { return _hud.apply(this, arguments); } finally { ctx.restore(); } }; }
  Home.evoK = { frame, topBar, shimmer, flyDraw, adsBadge, hit };
  if (CC.L1 && CC.L1.msg) { const _m = CC.L1.msg; CC.L1.msg = function (g) { if (g && g.evo) return; return _m.apply(this, arguments); }; }
  if (CC.EVO) { const _br = CC.EVO.beginRun; CC.EVO.beginRun = (g) => { g.evoReport = false; g.evoLvPop = false; return _br(g); }; }
})();
