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
  const MULT = [[0.2, 4], [0.45, 3], [0.75, 2], [1.01, 1.5]];
  const multAt = (p) => { const a = Math.abs(p); for (const [t, m] of MULT) if (a < t) return m; return 1.5; };
  const MCOL = { 4: T.yellowL, 3: T.yellow, 2: '#8a7d00', 1.5: '#4a4d54' };
  // ---------- compat pour les anciens appels (evo.js, evo_story.js, evo_flow.js) ----------
  Home.evoUI = {
    txt: (ctx, s, x, y, px, fill, o) => UI.text(ctx, s, x, y, px, fill, { align: o && o.align, outline: !!(o && o.sw >= 0.2), shadow: !(o && o.shadow === false), stroke: !!(o && o.stroke) }),
    tw: UI.tw, fit: UI.fit, coin: (ctx, x, y, r) => UI.icon(ctx, 'coin', x, y, r * 2), gem: (ctx, x, y, r) => UI.icon(ctx, 'gem', x, y, r * 2),
    star: (ctx, x, y, r) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = T.yellow; ctx.strokeStyle = T.ink; ctx.lineWidth = Math.max(2, r * 0.12); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, rad = k % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); },
    panel: (ctx, x, y, w, h, r, fill, f2, border) => UI.panel(ctx, x, y, w, h, { fill: fill && fill.length ? fill : T.bg, border: border === null ? null : border }),
    btnPrimary: UI.btnPrimary,
  };
  // ---------- barre du haut ----------
  function topBar(ui, ctx, game, F, S0, E, o) {
    o = o || {}; const h = S(96), y = F.T0 + S(34), x0 = F.ox + S(36), now = performance.now(), fxg = game.evoGemFx;
    const cwid = S(250);
    // v237 : le compteur de pieces defile jusqu'a la nouvelle valeur, la pastille rebondit quand on gagne, une valeur « -1 897 » tombe quand on depense
    const tgt = S0.coins; if (game._cs === undefined) { game._cs = tgt; game._cp = tgt; }
    { const dtc = Math.min(0.1, (now - (game._ct || now)) / 1000); game._ct = now; if (game._cp !== tgt) { game._cb = now; game._cd = tgt - game._cp; game._cp = tgt; } game._cs += (tgt - game._cs) * (1 - Math.exp(-dtc * 8)); if (Math.abs(tgt - game._cs) < 1) game._cs = tgt; }
    const cs = U.formatInt(Math.round(game._cs)), cbk = game._cb ? (now - game._cb) / 1000 : 9, cbump = cbk < 0.45 ? Math.sin(cbk / 0.45 * 3.1416) * (game._cd > 0 ? 0.1 : -0.045) : 0;
    ctx.save(); ctx.translate(x0 + cwid / 2, y + h / 2); ctx.scale(1 + cbump, 1 + cbump); ctx.translate(-(x0 + cwid / 2), -(y + h / 2));
    UI.currencyPill(ctx, ui, x0, y, cwid, h, 'coin', cs);
    ctx.restore();
    if (cbk < 1.0 && game._cd && !(game._cd > 0 && game.evoCoinFx)) { const a = U.clamp(1 - cbk / 1.0, 0, 1), neg = game._cd < 0, tx = (neg ? '-' : '+') + U.formatInt(Math.abs(Math.round(game._cd))); ctx.save(); ctx.globalAlpha = a; UI.outlined(ctx, tx, x0 + cwid * 0.52, y + h * (neg ? 1.2 + cbk * 0.5 : 1.5 - cbk * 0.5), h * 0.5, neg ? '#FF8A7A' : '#FFE16A', '#1a1208', { keep: true, ow: 0.16 }); ctx.restore(); }
    const gs = String(S0.gems || 0), gx = x0 + cwid + S(30), gwid = S(220), pulse = fxg ? U.clamp(1 - (now - fxg.t0) / 900, 0, 1) : 0;
    UI.currencyPill(ctx, ui, gx, y, gwid, h, 'gem', gs, { plus: true });
    if (pulse > 0) { ctx.save(); UI.cham(ctx, gx + h * 0.3, y, gwid - h * 0.3, h, h * 0.28); ctx.lineWidth = S(5); ctx.strokeStyle = 'rgba(255,255,255,' + pulse + ')'; ctx.stroke(); UI.text(ctx, '+' + fxg.n, gx + h * 1.5, y + h * 1.5 - (1 - pulse) * h * 0.4, h * 0.6, T.yellow, { outline: true }); ctx.restore(); }
    UI.tap(ui, gx, y, gwid, h, () => { ui.overlay = 'evoShop'; });
    if (game.evoCoinFx) { const cf = game.evoCoinFx, k = U.clamp(1 - (now - cf.t0) / 1100, 0, 1); if (k <= 0) game.evoCoinFx = null; else { ctx.save(); ctx.globalAlpha = k; UI.text(ctx, '+' + U.formatInt(cf.n), x0 + cwid * 0.5, y + h * 1.5 - (1 - k) * h * 0.5, h * 0.6, T.yellow, { outline: true }); ctx.restore(); } }
    const bs = S(112), bx = F.ox + F.cw - S(36) - bs;
    if (o.close) { UI.slateIconButton(ctx, bx, y - S(8), bs, 'close'); UI.tap(ui, bx, y - S(8), bs, bs, o.close); }
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
  function fuelIcon(ctx, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy); const w = s * 0.72, h = s * 0.9; ctx.lineJoin = 'round';
    ctx.fillStyle = '#06121c'; rr0(ctx, -w / 2 - s * 0.07, -h / 2 - s * 0.07, w + s * 0.14, h + s * 0.14, s * 0.18); ctx.fill();
    ctx.fillStyle = '#FF5A3A'; rr0(ctx, -w / 2, -h / 2, w, h, s * 0.14); ctx.fill();
    ctx.fillStyle = '#C93C22'; ctx.fillRect(-w / 2, h * 0.12, w, h * 0.38 - s * 0.05);
    ctx.fillStyle = '#FFE16A'; ctx.beginPath(); ctx.moveTo(0, -h * 0.34); ctx.quadraticCurveTo(w * 0.3, -h * 0.02, 0, h * 0.06); ctx.quadraticCurveTo(-w * 0.3, -h * 0.02, 0, -h * 0.34); ctx.fill();
    ctx.fillStyle = '#06121c'; ctx.fillRect(-w * 0.1, -h / 2 - s * 0.2, w * 0.5, s * 0.16); ctx.fillStyle = '#9aa5b1'; ctx.fillRect(-w * 0.04, -h / 2 - s * 0.16, w * 0.38, s * 0.1);
    ctx.restore();
  }
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
    { const bg = UI.CARDBG[id], gr = ctx.createLinearGradient(0, iy, 0, iy + ih); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); rr0(ctx, ix, iy, iw, ih, w * 0.025); ctx.fillStyle = gr; ctx.fill(); }
    // v237 : revenu : a chaque achat la pile de pieces rebondit et la valeur gagnee monte (+0,1) ; a un PALIER (x1,4 -> x2) c'est plus gros, avec une gerbe d'etincelles
    const cb = (id === 'cm' || id === 'rk') && game.evoBought && game.evoBought.id === id && (id === 'rk' || game.evoBought.delta !== undefined) ? game.evoBought : null, ct = cb ? (now - cb.t0) / 1000 : 9, big = cb && cb.palier;
    const pul = ct < 0.55 ? Math.sin(ct / 0.55 * 3.1416) * (big ? 0.34 : 0.2) : 0;
    ctx.save(); if (id !== 'cm') { ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowOffsetY = S(7); ctx.shadowOffsetX = S(3); ctx.shadowBlur = 0; } { const icx = ix + iw / 2, icy = iy + ih / 2 - (id === 'cm' ? ih * 0.07 : 0); ctx.translate(icx, icy - pul * ih * 0.12); ctx.scale(1 + pul, 1 + pul); ctx.translate(-icx, -icy); UI.icon(ctx, ico, icx, icy, ih * 0.66); } ctx.restore();
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
    const cs = U.formatInt(cost), gemMode = !can && cost !== null && game.evoGemOffer === id, gc = E.gemCost(game, id), haveG = (S0.gems || 0) >= gc, face = UI.greenButton(ctx, bx, by, bw, bh, { disabled: false, cat: gemMode ? 'rk' : id });
    if (gemMode) {   // plus assez de pieces : le bouton propose une GEMME (ou une pub si on n'en a pas)
      const gy = face.y + face.h * 0.5, gs = face.h * 0.52, px = face.h * 0.4, tw = UI.tw(ctx, String(gc), px), tot = gs + face.h * 0.12 + tw, gx0 = bx + bw / 2 - tot / 2;   // meme taille de texte que « AMELIORER »
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowOffsetY = S(3); ctx.shadowBlur = 0; UI.icon(ctx, 'gem', gx0 + gs / 2, gy, gs); ctx.restore();
      UI.outlined(ctx, String(gc), gx0 + gs + face.h * 0.12, gy + face.h * 0.02, px, '#FFFFFF', null, { align: 'left' });
    }
    ctx.save(); if (!can) ctx.globalAlpha = 0.72; if (gemMode) ctx.globalAlpha = 0;
    UI.outlined(ctx, 'AMÉLIORER', bx + bw / 2, face.y + face.h * 0.3, UI.fit(ctx, 'AMÉLIORER', bw * 0.94, face.h * 0.4), '#FFFFFF');
    ctx.restore();
    if (!gemMode) { const ps = face.h * 0.37, pw = UI.tw(ctx, cs, ps) + ps * 1.3; ctx.save(); if (!can) ctx.globalAlpha = 0.8; UI.icon(ctx, 'coin', bx + bw / 2 - pw / 2 + ps * 0.5, face.y + face.h * 0.73, ps * 1.15); ctx.restore(); UI.outlined(ctx, cs, bx + bw / 2 - pw / 2 + ps * 1.25, face.y + face.h * 0.73, UI.fit(ctx, cs, bw * 0.55, ps), can ? '#FFFFFF' : '#F04438', null, { align: 'left' }); }
    // (plus de barre de progression de l'argent)
    if (bk > 0) { ctx.fillStyle = 'rgba(255,255,255,' + bk * 0.35 + ')'; UI.cham(ctx, rx, y, w, h, S(26)); ctx.fill(); }
    ctx.restore();
    return { id, rx, y, w, h, ix, iy, iw, ih, can, cost, bx, by, bw, bh };
  }
  // ---------- MENU ----------
  Home.drawEvo = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game), last = game.evoLast, now = performance.now(), anim = game.evoAnim;
    const chTop = T0 + HH - ((cw - S(26) * 2 - S(14) * 2) / 3) / 0.703 - S(28);
    topBar(ui, ctx, game, F, S0, E);
    if (anim) { const a = U.clamp(anim.t / 0.4, 0, 1) * (1 - U.smooth(anim.dur - 0.6, anim.dur, anim.t)), name = anim.label + ' !'; ctx.save(); ctx.globalAlpha = a; UI.text(ctx, name, cx, Y(0.2), UI.fit(ctx, name, cw * 0.9, S(130)), T.yellow, { outline: true }); UI.text(ctx, anim.sub || 'NOUVELLE PIÈCE', cx, Y(0.27), S(52), T.white, { outline: true }); ctx.restore(); return; }
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
    const bs = S(128), lx = ox + S(36), ly = T0 + S(330), free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
    UI.shopStall(ctx, lx, ly - S(6), bs, now); UI.tap(ui, lx, ly, bs, bs, () => { ui.overlay = 'evoShop'; });
    if (!(game.meta && game.meta.noAds)) { const y = ly + bs + S(28); UI.noAdsBadge(ctx, lx, y, bs); UI.tap(ui, lx, y, bs, bs, () => { ui.overlay = 'evoShop'; }); }
    { const unlocked = S0.runs >= 3, ready = E.chestReady(game), wait = Math.max(0, (S0.chestAt || 0) - Date.now()), rx0 = ox + cw - S(36) - bs, y = ly, pulse = 0.5 + 0.5 * Math.sin(now / 240);
      UI.chestFrame(ctx, rx0, y, bs, ready, unlocked, now);
      { const ty = y + bs + S(86), tk = E.miniTickets(game); miniIcon(ctx, rx0, ty, bs, tk, now); UI.tap(ui, rx0, ty, bs, bs, () => { ui.overlay = 'evoMini'; }); }   // mini-jeu : sous le coffre
      // (lueur du coffre pret : voir UI.chestFrame)
      { const lab = !unlocked || ready ? '' : secFmt(wait); if (lab) UI.outlined(ctx, lab, rx0 + bs / 2, y + bs + S(34), UI.fit(ctx, lab, bs * 1.2, S(36)), '#F0EDE4'); }
      if (unlocked) UI.tap(ui, rx0, y, bs, bs + S(50), () => E.openChest(game));
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
    { const ch = game.evoChest; if (ch) { const k = (now - ch.t0) / 1000; if (k > 3.2) game.evoChest = null; else {
      const a = U.clamp(k / 0.25, 0, 1) * U.clamp((3.2 - k) / 0.4, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(8,9,12,0.85)'; ctx.fillRect(0, T0, W, HH); UI.icon(ctx, 'chest_open', cx, Y(0.3), S(440) * (0.9 + 0.1 * ease(k * 3)));
      const t1 = '+' + U.formatInt(ch.coins), t2 = '+' + ch.gems, p1 = S(110); UI.icon(ctx, 'coin', cx - UI.tw(ctx, t1, p1) / 2 - p1 * 0.7, Y(0.5), p1); UI.text(ctx, t1, cx + p1 * 0.2, Y(0.5), p1, T.yellow, { outline: true }); UI.icon(ctx, 'gem', cx - UI.tw(ctx, t2, p1) / 2 - p1 * 0.7, Y(0.58), p1); UI.text(ctx, t2, cx + p1 * 0.2, Y(0.58), p1, T.yellow, { outline: true }); ctx.restore(); hit(ui, 0, T0, W, HH, () => { game.evoChest = null; }); } } }
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
    hit(ui, 0, 0, W, H, () => {}, true);
  };

  // ---------- RAPPORT DE MISSION (sur le lieu du crash) ----------
  Home.drawEvoReport = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game), last = game.evoLast, now = performance.now();
    if (!last) { game.ui.overlay = 'evo'; return; }
    if (!last.t0) last.t0 = now; const tt = (now - last.t0) / 1000, adsOn = !!(game.ads && game.ads.enabled());
    { const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, 'rgba(10,11,14,0.7)'); g.addColorStop(0.5, 'rgba(10,11,14,0.4)'); g.addColorStop(1, 'rgba(10,11,14,0.8)'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); }
    topBar(ui, ctx, game, F, S0, E, { noGear: true });
    const tk = U.clamp(tt / 0.35, 0, 1);
    ctx.save(); ctx.globalAlpha = tk; UI.text(ctx, 'RAPPORT DE MISSION', cx, Y(0.17) + (1 - tk) * S(30), UI.fit(ctx, 'RAPPORT DE MISSION', cw * 0.92, S(104)), T.yellow, { outline: true }); ctx.restore();
    const px0 = ox + cw * 0.05, pw = cw * 0.9, py0 = Y(0.225), rowH = S(112), rows = [];
    rows.push({ lab: 'DISTANCE ' + last.dist + ' M', ico: 'target', val: last.lines[0] ? last.lines[0][1] : 0 });
    if (last.kills) rows.push({ lab: 'CIBLES DÉTRUITES  ' + last.kills, ico: 'target', val: last.lines.length > 1 && /^ENNEMIS/.test(last.lines[1][0]) ? last.lines[1][1] : 0 });
    const mult = E.mult(S0.cm); rows.push({ lab: 'MULTIPLICATEUR DE REVENU', mult: 'X' + f1(mult), small: true });
    for (const ln of last.lines) if (/^PUB/.test(ln[0])) rows.push({ lab: 'BONUS PUBLICITÉ  ' + ln[0].replace('PUB ', ''), ico: 'video', val: ln[1], t: ln[2] || 0, ad: true });
    const totH = S(180), ph = S(40) + rows.length * (rowH + S(12)) + totH + S(30);
    UI.panel(ctx, px0, py0, pw, ph, { c: S(36), border: T.border2, bw: S(4) });
    rows.forEach((r, i) => { const a = r.t ? U.clamp((now - r.t) / 350, 0, 1) : U.clamp((tt - 0.2 - i * 0.15) / 0.3, 0, 1), y = py0 + S(26) + i * (rowH + S(12)); ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * S(24));
      const fl = r.ad && r.t ? U.clamp(1 - (now - r.t) / 900, 0, 1) : 0; UI.panel(ctx, px0 + S(24), y, pw - S(48), rowH, { c: S(22), fill: fl > 0 ? 'rgba(255,230,0,' + (0.1 + 0.25 * fl) + ')' : T.bg2, border: T.border, bw: S(2) });
      if (r.ico === 'target') UI.glyph(ctx, 'target', px0 + S(90), y + rowH / 2, S(40), '#5AC3DF'); else if (r.ico === 'video') UI.icon(ctx, 'video', px0 + S(90), y + rowH / 2, S(70)); else UI.glyph(ctx, 'plus', px0 + S(90), y + rowH / 2, S(30), T.yellow);
      UI.text(ctx, r.lab, px0 + S(150), y + rowH / 2, UI.fit(ctx, r.lab, pw * (r.mult ? 0.5 : 0.45), r.small ? S(32) : S(44)), r.small ? T.dim : T.white, { align: 'left', shadow: false });
      if (r.mult) UI.text(ctx, r.mult + ' »', px0 + pw - S(60), y + rowH / 2, S(56), T.yellow, { align: 'right', shadow: false });
      else { const vs = U.formatInt(Math.round(r.val * ease(r.t ? (now - r.t) / 900 : tt / 1.0))), vp = UI.fit(ctx, vs, pw * 0.26, S(56)); UI.icon(ctx, 'coin', px0 + pw - S(76), y + rowH / 2, S(60)); UI.text(ctx, vs, px0 + pw - S(120), y + rowH / 2, vp, T.yellow, { align: 'right', shadow: false }); }
      ctx.restore(); });
    { const y = py0 + S(26) + rows.length * (rowH + S(12)), a = U.clamp((tt - 0.45 - rows.length * 0.15) / 0.35, 0, 1); ctx.save(); ctx.globalAlpha = a;
      const dtm = Math.min(0.1, (now - (last._tn || now)) / 1000); last._tn = now; if (last.disp === undefined) last.disp = 0; if (tt > 0.5) last.disp += (last.total - last.disp) * (1 - Math.exp(-dtm * 5)); if (Math.abs(last.total - last.disp) < 1) last.disp = last.total;
      const pop = 1 + 0.05 * U.clamp(1 - (now - (last.popT || 0)) / 300, 0, 1); ctx.translate(cx, y + totH / 2); ctx.scale(pop, pop); ctx.translate(-cx, -(y + totH / 2));
      UI.panel(ctx, px0 + S(24), y, pw - S(48), totH, { c: S(28), fill: 'rgba(255,230,0,0.06)', border: T.white, bw: S(5) }); UI.text(ctx, 'TOTAL', cx - S(60), y + totH * 0.24, S(46), T.white, { shadow: false });
      const vs = U.formatInt(Math.round(last.disp)), vp = UI.fit(ctx, vs, pw * 0.5, S(118)); UI.text(ctx, vs, cx - S(70), y + totH * 0.66, vp, T.yellow, { outline: true, ow: 0.18 }); UI.icon(ctx, 'coins_stack', cx + UI.tw(ctx, vs, vp) / 2 - S(10), y + totH * 0.62, S(150));
      if (last.fx) { const k = U.clamp(1 - (now - last.fx.t0) / 1300, 0, 1); if (k > 0) UI.text(ctx, '+' + U.formatInt(last.fx.n), px0 + pw - S(90), y + totH * 0.3 - (1 - k) * S(90), S(66), T.yellowL, { align: 'right', outline: true }); }
      ctx.restore(); }
    if (last.record && Math.sin(now / 150) > -0.5) UI.text(ctx, 'NOUVEAU RECORD !', cx, py0 + ph + S(44), S(60), T.yellow, { outline: true });
    const by0 = py0 + ph + S(96);
    if (adsOn && tt > 0.9) {
      const bw = cw * 0.9, bh = S(190), bx = cx - bw / 2; UI.panel(ctx, bx, by0, bw, bh, { c: S(30), border: T.border2, bw: S(4) });
      const sw2 = bw * 0.9, sx = cx - sw2 / 2, sY = by0 + bh * 0.5, sh = bh * 0.3, X = (v) => sx + sw2 * (v + 1) / 2;
      if (!last.mult) last.cur = Math.sin((now - last.t0) / 520); const lock = !!last.mult, pos = lock ? last.mult.p : last.cur, mv = lock ? last.mult.m : multAt(pos);
      const edges = [[-1, -0.75, 1.5], [-0.75, -0.45, 2], [-0.45, -0.2, 3], [-0.2, 0.2, 4], [0.2, 0.45, 3], [0.45, 0.75, 2], [0.75, 1, 1.5]];
      ctx.save(); UI.cham(ctx, sx, sY, sw2, sh, sh * 0.3); ctx.clip(); for (const [v0, v1, m] of edges) { ctx.fillStyle = MCOL[m]; ctx.fillRect(X(v0), sY, X(v1) - X(v0) + 1, sh); } ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(sx, sY, sw2, sh * 0.4); ctx.restore(); UI.cham(ctx, sx, sY, sw2, sh, sh * 0.3); ctx.lineWidth = S(4); ctx.strokeStyle = T.ink; ctx.stroke();
      for (const [v0, v1, m] of edges) { const lbl = 'X' + (m === 1.5 ? '1,5' : m); UI.text(ctx, lbl, (X(v0) + X(v1)) / 2, by0 + bh * 0.24, UI.fit(ctx, lbl, (X(v1) - X(v0)) * 0.95, S(38)), m === 4 ? T.yellowL : m === 3 ? T.yellow : T.dim, { shadow: false }); }
      const x = X(pos); ctx.fillStyle = T.white; ctx.strokeStyle = T.ink; ctx.lineWidth = S(3); ctx.beginPath(); ctx.moveTo(x - S(20), sY - S(30)); ctx.lineTo(x + S(20), sY - S(30)); ctx.lineTo(x, sY - S(4)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = T.white; ctx.fillRect(x - S(4), sY - S(4), S(8), sh + S(8));
      const b2y = by0 + bh + S(34), b2h = S(160), wA = bw * 0.62, wB = bw * 0.34;
      if (!last.doubled) { UI.btnGreen(ctx, bx, b2y, wA, b2h, 'MULTIPLIER', { sub: 'ET RÉCUPÉRER' }); UI.panel(ctx, bx + wA - S(70), b2y - S(26), S(96), S(70), { c: S(14), fill: T.bg, border: T.white, bw: S(3) }); UI.icon(ctx, 'video', bx + wA - S(22), b2y + S(9), S(60));
        UI.tap(ui, bx, b2y, wA, b2h, () => { if (last.mult) return; last.mult = { m: mv, p: pos }; game.audio.play('uiTick'); setTimeout(() => game.ads.rewarded(() => E.multiply(game, mv), null, 'coins', 'PIÈCES X' + (mv === 1.5 ? '1,5' : mv) + '   +' + U.formatInt(Math.round(last.total * (mv - 1)))), 420); }); }
      else UI.text(ctx, 'BONUS X' + (last.doubled === 1.5 ? '1,5' : last.doubled) + ' AJOUTÉ', bx + wA / 2, b2y + b2h / 2, UI.fit(ctx, 'BONUS X1,5 AJOUTÉ', wA * 0.9, S(54)), T.yellow, { outline: true });
      const nx = bx + bw - wB; UI.btnSecondary(ctx, nx, b2y + S(14), wB, b2h - S(28), 'SUIVANT', { px: S(48), color: T.white }); UI.tap(ui, nx, b2y, wB, b2h, () => E.afterReport(game));
    } else { const bw = cw * 0.6, b2h = S(150), b2y = by0 + S(40), nx = cx - bw / 2; UI.btnPrimary(ctx, nx, b2y, bw, b2h, 'SUIVANT'); UI.tap(ui, nx, b2y, bw, b2h, () => E.afterReport(game)); }
  };

  // ---------- BOUTIQUE ----------
  const bgPattern = (ctx, W, T0, HH) => { ctx.fillStyle = T.bg; ctx.fillRect(0, T0, W, HH); const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, 'rgba(120,60,20,0.35)'); g.addColorStop(0.4, 'rgba(30,32,36,0)'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); ctx.save(); ctx.globalAlpha = 0.05; for (let k = 0; k < 12; k++) UI.icon(ctx, 'missile_ogive', ((k * 173) % 100) / 100 * W, T0 + ((k * 331) % 100) / 100 * HH, S(150), { rot: 0.5 }); ctx.restore(); };
  const sectionHead = (ctx, x, y, w, h, label, ico) => { UI.panel(ctx, x, y, w, h, { c: h * 0.28, fill: T.bg2, border: T.border2, bw: S(4) }); if (ico) ico(x + h * 0.6, y + h / 2, h * 0.6); UI.text(ctx, label, x + h * 1.25, y + h * 0.5, UI.fit(ctx, label, w - h * 1.5, h * 0.46), T.white, { align: 'left', shadow: false }); };
  const adsBadge = (ctx, cx, cy, r) => { ctx.save(); ctx.lineWidth = r * 0.22; ctx.strokeStyle = T.red; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke(); UI.text(ctx, 'ADS', cx, cy, r * 0.9, T.white, { outline: true, ow: 0.25 }); ctx.beginPath(); ctx.moveTo(cx - r * 0.72, cy + r * 0.72); ctx.lineTo(cx + r * 0.72, cy - r * 0.72); ctx.lineWidth = r * 0.22; ctx.strokeStyle = T.red; ctx.stroke(); ctx.restore(); };
  Home.drawEvoShop = function (ui, ctx, game, W, H) {
    const F = frame(ui, ctx, W, H), { HH, Y, T0, cw, ox, cx } = F, E = CC.EVO, S0 = E.save(game);
    bgPattern(ctx, W, T0, HH); topBar(ui, ctx, game, F, S0, E, { close: () => { ui.overlay = 'evo'; } });
    const buy = (id) => { if (id === 'noads' || id === 'starter') { const r = game.meta && game.meta.buyNoAds ? game.meta.buyNoAds() : 'no-link'; if (r !== 'no-link') return; } Home.toast(ui, 'ACHAT BIENTÔT DISPONIBLE'); };
    const mx = ox + S(36), mw = cw - S(72);
    sectionHead(ctx, mx, Y(0.145), mw, S(100), 'PACKS SANS PUBLICITÉ', (x, y, r) => adsBadge(ctx, x, y, r * 0.5));
    { const y = Y(0.145) + S(116), h = S(250); UI.panel(ctx, mx, y, mw, h, { c: S(30), border: T.border2, bw: S(4) }); adsBadge(ctx, mx + S(160), y + h * 0.36, S(80)); UI.text(ctx, '+', mx + S(310), y + h * 0.36, S(80), T.white, { shadow: false }); UI.icon(ctx, 'gems_belt', mx + S(470), y + h * 0.36, S(210)); UI.text(ctx, '10', mx + S(470), y + h * 0.7, S(50), T.white, { outline: true });
      UI.text(ctx, 'Pack de démarrage', mx + S(40), y + h * 0.86, S(52), T.white, { align: 'left', shadow: false }); const bw = S(250), bh = S(92), bx = mx + mw - bw - S(30), by = y + h - bh - S(26); UI.btnPrimary(ctx, bx, by, bw, bh, '10,99 €', { px: S(46) }); UI.tap(ui, bx, by, bw, bh, () => buy('starter')); }
    { const y = Y(0.145) + S(116) + S(272), h = S(150); UI.panel(ctx, mx, y, mw, h, { c: S(30), border: T.border2, bw: S(4) }); adsBadge(ctx, mx + S(90), y + h / 2, S(56)); UI.text(ctx, 'Pas de publicités', mx + S(200), y + h * 0.5, S(56), T.white, { align: 'left', shadow: false }); const bw = S(250), bh = S(92), bx = mx + mw - bw - S(30), by = y + (h - bh) / 2; UI.btnPrimary(ctx, bx, by, bw, bh, '7,99 €', { px: S(46) }); UI.tap(ui, bx, by, bw, bh, () => buy('noads')); }
    const gy = Y(0.145) + S(116) + S(272) + S(190); sectionHead(ctx, mx, gy, mw, S(100), 'GEMMES', (x, y, r) => UI.icon(ctx, 'gem', x, y, r));
    const tiles = [{ n: 1, ico: 'gem', free: true }, { n: 5, ico: 'gems_rope', p: '2,09 €' }, { n: 10, ico: 'gems_belt', p: '3,69 €' }, { n: 30, ico: 'bag_wings', p: '9,99 €' }, { n: 100, ico: 'chest_open', p: '25,99 €' }, { n: 250, ico: 'crate_steel', p: '49,99 €', best: true }];
    const gp = S(20), tw0 = (mw - gp * 2) / 3, th = S(400), free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
    tiles.forEach((t, i) => { const x = mx + (i % 3) * (tw0 + gp), y = gy + S(120) + Math.floor(i / 3) * (th + gp);
      UI.panel(ctx, x, y, tw0, th, { c: S(26), border: T.border2, bw: S(4) }); UI.icon(ctx, t.ico, x + tw0 / 2, y + th * 0.34, tw0 * 0.8); UI.text(ctx, String(t.n), x + tw0 / 2, y + th * 0.64, S(54), T.white, { outline: true });
      const bw = tw0 * 0.88, bh = S(84), bx = x + (tw0 - bw) / 2, by = y + th - bh - S(20);
      if (t.free) { UI.btnSecondary(ctx, bx, by, bw, bh, '', {}); UI.icon(ctx, 'video', bx + bh * 0.55, by + bh / 2, bh * 0.7); UI.text(ctx, 'GRATUIT ' + free + '/3', bx + bw * 0.6, by + bh * 0.5, UI.fit(ctx, 'GRATUIT 3/3', bw * 0.64, S(32)), free > 0 ? T.white : T.dim, { shadow: false }); UI.tap(ui, bx, by, bw, bh, () => { if (free > 0) E.gemAd(game, true); }); }
      else { UI.btnSecondary(ctx, bx, by, bw, bh, t.p, { px: S(40) }); UI.tap(ui, bx, by, bw, bh, () => buy('gems' + t.n)); }
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
      ['COMMANDES', null, true, (s.ctl || 'free') === 'simple' ? 'SIMPLES' : 'LIBRES', () => { s.ctl = (s.ctl || 'free') === 'simple' ? 'free' : 'simple'; game.applySettings(); }],
      ['SENSIBILITÉ', null, true, ['DOUCE', 'NORMALE', 'VIVE'][s.touchSens !== undefined ? s.touchSens : 1], () => { s.touchSens = ((s.touchSens !== undefined ? s.touchSens : 1) + 1) % 3; game.applySettings(); }],
      ['PUBLICITÉS', null, s.ads !== false, s.ads === false ? 'NON' : 'OUI', () => { s.ads = s.ads === false; game.applySettings(); }],
      ['CODE DE SAUVEGARDE', null, true, 'COPIER', () => { const c = game.meta.exportCode(); if (!c) return; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(() => Home.toast(ui, 'CODE COPIÉ'), () => window.prompt('Copie ce code', c)); else window.prompt('Copie ce code', c); }],
      ['RESTAURER UN CODE', null, true, 'COLLER', () => { const c = window.prompt('Colle ton code de sauvegarde'); if (c) { if (game.meta.importCode(c)) location.reload(); else Home.toast(ui, 'CODE INVALIDE'); } }],
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
    const bw = cw * 0.5, bh = S(130), bx = cx - bw / 2, by = Y(0.915); UI.btnPrimary(ctx, bx, by, bw, bh, 'RETOUR'); UI.tap(ui, bx, by, bw, bh, () => { ui.overlay = (CC.EVO && CC.EVO.on && game.state === 'MENU') ? 'evo' : null; });
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
  Home.evoUI.hud = function (ctx, g, W, H, px) {
    const rk = g.rocket, run = g.endlessRun, E = CC.EVO, TT = run && run.T; if (!rk || !run) return;
    const u = H > W ? W : Math.min(W, H * 0.62), ox = (W - u) / 2; UI.begin(u, g.hudPr || 1); const top = H * 0.022, now = performance.now();
    if (E.rocket(E.save(g).rk).tier >= 2 && !(g.evo && g.evo.preview)) {
      const fw = u * 0.5, fh = S(60), fx = ox + u * 0.25, fy = top, k = U.clamp((rk.active ? rk.fuel : rk.fuelMax) / Math.max(1, rk.fuelMax), 0, 1);
      UI.gaugeH(ctx, fx, fy, fw, fh, k, { low: 0.22 }); UI.text(ctx, 'E', fx + S(10), fy + fh + S(30), S(40), T.white, { align: 'left' }); UI.text(ctx, 'F', fx + fw - S(10), fy + fh + S(30), S(40), T.white, { align: 'right' }); UI.icon(ctx, 'missile_ogive', fx + fw / 2, fy + fh + S(34), S(54));
      if (k < 0.22 && g.state === 'FLIGHT') { const a = 0.6 + 0.4 * Math.sin(now / 150); ctx.save(); ctx.globalAlpha = a; const wy = H * 0.215, wr = S(34); ctx.lineJoin = 'round'; ctx.lineWidth = S(6); ctx.strokeStyle = T.red; ctx.beginPath(); ctx.moveTo(W / 2, wy - wr); ctx.lineTo(W / 2 + wr * 0.95, wy + wr * 0.7); ctx.lineTo(W / 2 - wr * 0.95, wy + wr * 0.7); ctx.closePath(); ctx.stroke(); UI.text(ctx, '!', W / 2, wy + wr * 0.2, wr * 0.9, T.red, { shadow: false }); UI.text(ctx, 'CARBURANT FAIBLE', W / 2, wy + wr * 1.75, UI.fit(ctx, 'CARBURANT FAIBLE', u * 0.5, S(38)), T.red, { outline: true, ow: 0.2 }); ctx.restore(); }
    }
    { let near = false; for (const m of g.missiles || []) { if (m.alive && m.pos.distanceTo(rk.pos) < 140) { near = true; break; } } if (near && g.state === 'FLIGHT') { const a = 0.55 + 0.45 * Math.sin(now / 110); ctx.save(); ctx.globalAlpha = a; const wy = H * 0.125, wr = S(24), tx = W / 2 - S(150); ctx.lineJoin = 'round'; ctx.lineWidth = S(5); ctx.strokeStyle = T.red; ctx.beginPath(); ctx.moveTo(tx, wy - wr); ctx.lineTo(tx + wr * 0.95, wy + wr * 0.7); ctx.lineTo(tx - wr * 0.95, wy + wr * 0.7); ctx.closePath(); ctx.stroke(); UI.text(ctx, '!', tx, wy + wr * 0.2, wr * 0.9, T.red, { shadow: false }); UI.text(ctx, 'MISSILE !', W / 2 + S(22), wy + wr * 0.1, S(44), T.red, { outline: true, ow: 0.2 }); ctx.restore(); } }
    { const pct = U.clamp(run.dist / Math.max(1, (TT && TT.levelLen) || 5000), 0, 1), bw = S(58), bh = H * 0.27, bx = ox + u - S(52) - bw, by = top + S(70);
      UI.checkFlag(ctx, bx - S(6), top, bw + S(12), S(60)); UI.gaugeV(ctx, bx, by, bw, bh, pct); UI.icon(ctx, 'missile_ogive', bx + bw / 2, by + bh * (1 - pct) - S(10), S(84), { rot: -Math.PI / 4 }); UI.text(ctx, Math.round(pct * 100) + '%', bx + bw / 2, by + bh + S(52), S(70), T.white, { outline: true }); }
    { const kmh = rk.active ? rk.vel.length() * 3.6 : 0, R = S(66), cx = ox + S(44) + R, cy = top + S(236) + R * 0.25, f = Math.min(1, kmh / 450), a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = a0 + f * (a1 - a0);   // v211 : cadran
      ctx.save();
      const rim = ctx.createLinearGradient(cx, cy - R, cx, cy + R); rim.addColorStop(0, '#f4f7fb'); rim.addColorStop(1, '#8a95a6'); ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
      const face = ctx.createLinearGradient(cx, cy - R, cx, cy + R); face.addColorStop(0, '#5ab8f0'); face.addColorStop(1, '#1f5f9e'); ctx.fillStyle = face; ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.32, R * 0.62, R * 0.4, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(2, R * 0.035); ctx.lineCap = 'round';
      for (let i = 0; i <= 9; i++) { const t = a0 + (a1 - a0) * i / 9, r1 = R * 0.74, r2 = R * (i % 3 === 0 ? 0.6 : 0.66); ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * r1, cy + Math.sin(t) * r1); ctx.lineTo(cx + Math.cos(t) * r2, cy + Math.sin(t) * r2); ctx.stroke(); }
      ctx.translate(cx, cy); ctx.rotate(ang);   // aiguille : une petite fusee qui pointe vers la vitesse
      ctx.fillStyle = '#12304f'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, R * 0.03); ctx.beginPath(); ctx.moveTo(R * 0.74, 0); ctx.quadraticCurveTo(R * 0.6, -R * 0.075, R * 0.42, -R * 0.075); ctx.lineTo(R * 0.12, -R * 0.075); ctx.lineTo(R * 0.12, R * 0.075); ctx.lineTo(R * 0.42, R * 0.075); ctx.quadraticCurveTo(R * 0.6, R * 0.075, R * 0.74, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.moveTo(R * 0.12, -R * 0.075); ctx.lineTo(R * 0.02, -R * 0.2); ctx.lineTo(R * 0.24, -R * 0.075); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(R * 0.12, R * 0.075); ctx.lineTo(R * 0.02, R * 0.2); ctx.lineTo(R * 0.24, R * 0.075); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.save(); ctx.fillStyle = '#12304f'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.09, 0, 6.2832); ctx.fill(); ctx.restore();
      UI.text(ctx, String(Math.round(kmh)), cx, cy + R * 0.38, R * 0.5, '#ffffff', { stroke: true }); UI.text(ctx, 'KM/H', cx, cy + R * 0.66, R * 0.22, '#ffffff', { stroke: true }); }
    if (E.titanHud) E.titanHud(ctx, g, ox, u, H, UI, S);
  };
  // petit compteur de pieces de la partie, sous la vitesse
  Home.evoUI.coinCounter = function (ctx, g, W, H, tot, bump) {
    const u = H > W ? W : Math.min(W, H * 0.62), ox = (W - u) / 2; UI.begin(u, g.hudPr || 1); const h = S(76) * bump, y = H * 0.022 + S(400), s = U.formatInt(tot), w = UI.tw(ctx, s, h * 0.6) + h * 1.8;
    UI.currencyPill(ctx, null, ox + S(36), y, w, h, 'coin', s);
  };
  // le bouton de pause (element de page) prend le meme habillage : carre chanfreine sombre, deux barres jaunes
  try { const st = document.createElement('style'); st.textContent = 'body.cc-evo .cc-pause{top:calc(env(safe-area-inset-top,0px) + 2.2vh);left:calc(50% - min(50vw,31vh) + 3.4vw);width:min(15vw,14vh,86px);height:min(15vw,14vh,86px);max-width:none;border-radius:0;border:0;box-shadow:none;background:#3A3E45;clip-path:polygon(22% 0,78% 0,100% 22%,100% 78%,78% 100%,22% 100%,0 78%,0 22%)}body.cc-evo .cc-pause::before{content:"";position:absolute;inset:3px;background:#1E2024;clip-path:polygon(22% 0,78% 0,100% 22%,100% 78%,78% 100%,22% 100%,0 78%,0 22%);top:3px;left:3px;width:auto;height:auto;border-radius:0}body.cc-evo .cc-pause::after{content:"";position:absolute;top:26%;bottom:26%;left:32%;width:13%;background:#FFE600;border-radius:0;box-shadow:calc(min(15vw,14vh,86px)*0.23) 0 0 #FFE600;right:auto}'; document.head.appendChild(st); } catch (e) { /* style facultatif */ }

  if (CC.L1 && CC.L1.msg) { const _m = CC.L1.msg; CC.L1.msg = function (g) { if (g && g.evo) return; return _m.apply(this, arguments); }; }
  if (CC.EVO) { const _br = CC.EVO.beginRun; CC.EVO.beginRun = (g) => { g.evoReport = false; g.evoLvPop = false; return _br(g); }; }
})();
