/* v400 : LE MENU DE LA COURSE (?mvp=r) refait avec l'ANCIEN kit d'interface, sans rien d'autre : CC.UI2 (ui_kit.js + ui_cartoon.js) et les outils de evo_ui.js (Home.evoK).
 * Meme police (Rajdhani Bold), memes couleurs, memes boutons a tranche, memes cartes ardoise, memes pastilles de monnaie, memes images (assets/ui). AUCUNE icone dessinee ici :
 * tout ce qui est une icone est une image existante ; les costumes sont de vraies vues 3D de la fusee (CC.Hangar.preview).
 * Agencement repris de l'ancien menu : barre du haut, plaque du costume, boutique a gauche, coffre de la Coupe a droite, « CLIC POUR LANCER », trois cartes d'amelioration en bas (les pouvoirs). */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mvp || E.mvp() !== 'r' || !E.race || !E.raceApi) return;
  const Home = CC.Home, UI = CC.UI2, U = CC.U, PRO = E.race, api = E.raceApi, K = Home.evoK, T = UI.THEME, S = UI.S, rr0 = UI.rrect;
  const M = { tab: 'jouer', page: 0, ask: null, bought: null, shake: null };
  E.menuTab = (t) => { M.page = 0; M.ask = null; if (t === 'boutique') { M.tab = 'jouer'; if (CC.game) CC.game.ui.overlay = 'evoShop'; return; } M.tab = t === 'costumes' ? 'costumes' : 'jouer'; };
  const save = (g) => { try { g.writeSave(); } catch (e) { /* ignore */ } };
  const snd = (g, n) => { try { g.audio.play(n); } catch (e) { /* son */ } };
  const skinNow = () => CC.Skins.byId[PRO.skin()] || CC.Skins.byId.stock;
  const skinName = (sk, id) => String(sk.short || sk.name || id).toUpperCase();
  // vignette d'un costume : une vraie vue 3D de la fusee, rendue une fois par l'apercu de l'ancien hangar
  const TH = {}; let thBudget = 0;
  const thumb = (id) => {   // rendue en grand puis rognee au plus pres de la fusee : elle remplit sa tuile
    let c = TH[id]; if (c) return c; if (!CC.Hangar || thBudget <= 0) return null; thBudget--; c = document.createElement('canvas'); c.width = 512; c.height = 384; const x = c.getContext('2d'); if (!CC.Hangar.preview(x, id, 0, 0, 512, 384, 0, 0.3)) return null;
    try { const d = x.getImageData(0, 0, 512, 384).data; let x0 = 512, y0 = 384, x1 = 0, y1 = 0; for (let yy = 0; yy < 384; yy += 2) for (let xx = 0; xx < 512; xx += 2) if (d[(yy * 512 + xx) * 4 + 3] > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      if (x1 > x0 && y1 > y0) { const t = document.createElement('canvas'); t.width = x1 - x0 + 8; t.height = y1 - y0 + 8; t.getContext('2d').drawImage(c, x0 - 4, y0 - 4, t.width, t.height, 0, 0, t.width, t.height); c = t; } } catch (e) { /* image entiere */ }
    return (TH[id] = c); };
  E.skinThumb = (id) => { thBudget = Math.max(thBudget, 1); return thumb(id); };

  const edgeF = (F, W, HH) => (W > HH * 1.1 ? Object.assign({}, F, { ox: 0, cw: W }) : F);
  // ---------- carte d'amelioration d'un pouvoir : la carte de l'ancien menu (ardoise, illustration, pastille de niveau, segments, bouton a tranche) ----------
  const POW = [['TURBO', 'la', 'bg_la'], ['MISSILE', 'rk', 'bg_rk'], ['BOUCLIER', 'cm', null]];
  function card(ui, ctx, g, SV, def, x, y, w, h, now) {
    const id = def[0], cat = def[1], lv = PRO.pw(), n = lv[id], max = n >= 5, cost = 300 * n, can = !max && (SV.coins || 0) >= cost;
    const shk = M.shake && M.shake.id === id && now - M.shake.t0 < 350 ? Math.sin((now - M.shake.t0) / 25) * S(10) : 0, bt = M.bought, bk = bt && bt.id === id ? U.clamp(1 - (now - bt.t0) / 520, 0, 1) : 0, k2 = 1 + 0.05 * Math.sin(bk * 3.1416);
    const rx = x + shk, ccx = rx + w / 2, ccy = y + h / 2;
    ctx.save(); ctx.translate(ccx, ccy); ctx.scale(k2, k2); ctx.translate(-ccx, -ccy);
    const ink = '#F0EDE4', col = UI.CARDCOL[cat], R = w * 0.04, pd = w * 0.035;
    rr0(ctx, rx, y, w, h, R); ctx.fillStyle = '#26394B'; ctx.fill();
    const ix = rx + pd, iy = y + h * 0.125, iw = w - pd * 2, ih = h * 0.405;
    UI.outlined(ctx, id, ix, y + h * 0.068, UI.fit(ctx, id, w * 0.6, h * 0.066), ink, null, { align: 'left' });
    { const im = def[2] ? UI.art(def[2]) : null; ctx.save(); rr0(ctx, ix, iy, iw, ih, w * 0.025); ctx.clip();
      if (im) { const k = Math.max(iw / im.naturalWidth, ih / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k; ctx.drawImage(im, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh); } else { const bg = UI.CARDBG[cat], gr = ctx.createLinearGradient(0, iy, 0, iy + ih); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); ctx.fillStyle = gr; ctx.fillRect(ix, iy, iw, ih); UI.artImg(ctx, 'badge_best', ix + iw / 2, iy + ih * 0.5, ih * 0.86); }
      ctx.restore(); }
    { const br = w * 0.125, bcx = rx + w - br * 0.8, bcy = y + br * 0.8, ro = Math.max(2, S(4)); ctx.beginPath(); ctx.arc(bcx, bcy, br + ro, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.beginPath(); ctx.arc(bcx, bcy, br, 0, 6.2832); ctx.fillStyle = '#3A5873'; ctx.fill(); UI.outlined(ctx, String(n), bcx, bcy + br * 0.04, UI.fit(ctx, String(n), br * 1.4, br * 1.05), T.white); }
    UI.segments(ctx, ix, y + h * 0.555, iw, h * 0.088, Math.min(5, n), 5, { off: 'rgba(14,24,34,0.45)', on: col });
    const bx = rx + pd, bw = w - pd * 2, bh = h * 0.285, by = y + h - pd - h * 0.285, cs = U.formatInt(cost), dim = !can && !max;
    if (dim) { rr0(ctx, bx, by, bw, bh, bh * 0.07); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.save(); ctx.globalAlpha = 0.65; }
    const face = UI.greenButton(ctx, bx, by, bw, bh, { disabled: false, cat, flat: dim });
    if (max) UI.outlined(ctx, 'MAX', bx + bw / 2, face.y + face.h * 0.5, UI.fit(ctx, 'MAX', bw * 0.8, face.h * 0.46), '#FFFFFF');
    else { UI.outlined(ctx, 'AMÉLIORER', bx + bw / 2, face.y + face.h * 0.3, UI.fit(ctx, 'AMÉLIORER', bw * 0.94, face.h * 0.4), '#FFFFFF');
      const ps = face.h * 0.37, pw = UI.tw(ctx, cs, ps) + ps * 1.3; ctx.save(); UI.icon(ctx, 'coin', bx + bw / 2 - pw / 2 + ps * 0.5, face.y + face.h * 0.73, ps * 1.15); ctx.restore(); UI.outlined(ctx, cs, bx + bw / 2 - pw / 2 + ps * 1.25, face.y + face.h * 0.73, UI.fit(ctx, cs, bw * 0.55, ps), '#FFFFFF', null, { align: 'left' }); }
    if (dim) ctx.restore();
    if (bk > 0) { ctx.fillStyle = 'rgba(255,255,255,' + bk * 0.35 + ')'; UI.cham(ctx, rx, y, w, h, S(26)); ctx.fill(); }
    ctx.restore();
    K.hit(ui, rx, y, w, h, () => { if (max) return; if (can) { SV.coins -= cost; lv[id] = n + 1; PRO.setPw(lv); save(g); M.bought = { id, t0: performance.now() }; snd(g, 'coinPing'); } else { M.shake = { id, t0: performance.now() }; snd(g, 'uiTick'); } });
  }

  // ---------- accueil ----------
  function drawHome(ui, ctx, g, W, H, F, SV, now) {
    const { HH, Y, T0, cw, ox, cx } = F, RC = api.R, FE = edgeF(F, W, HH), eox = FE.ox, ecw = FE.cw;   // sur PC (ecran large) : monnaies, reglages, boutique et coffre vont aux bords de l'ecran
    K.topBar(ui, ctx, g, FE, SV, E);
    { const sk = skinNow(), l1 = 'COSTUME', l2 = skinName(sk, PRO.skin()), bw = S(380), bh = S(104), bx = cx - bw / 2 + S(30), by = T0 + S(172) + (CC.safePx ? CC.safePx() : 0), bd = Math.max(2, S(4)), rd = S(12);   // la plaque : le costume porte ; un toucher ouvre les costumes
      rr0(ctx, bx - bd, by - bd, bw + bd * 2, bh + bd * 2, rd + bd); ctx.fillStyle = '#05080C'; ctx.fill(); rr0(ctx, bx, by, bw, bh, rd); ctx.fillStyle = '#26394B'; ctx.fill();
      ctx.save(); rr0(ctx, bx, by, bw, bh, rd); ctx.clip(); ctx.fillStyle = '#1B2A38'; ctx.fillRect(bx, by + bh - S(9), bw, S(9)); ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetY = S(6); ctx.shadowOffsetX = S(3); ctx.shadowBlur = 0; UI.icon(ctx, 'missile_ogive', bx + S(6), by + bh / 2 - S(4), S(128)); ctx.restore();
      UI.outlined(ctx, l1, bx + bw * 0.56, by + bh * 0.33, UI.fit(ctx, l1, bw * 0.5, S(40)), '#F0EDE4'); UI.outlined(ctx, l2, bx + bw * 0.56, by + bh * 0.64, UI.fit(ctx, l2, bw * 0.5, S(36)), '#F0EDE4');
      { const hs = S(92), bob = Math.sin(now / 260) * S(5); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowOffsetY = S(5); ctx.shadowBlur = 0; UI.artImg(ctx, 'hand', bx + bw - S(8) + bob, by + bh + S(14) + bob, hs); ctx.restore(); }   // la petite main : elle montre la plaque du costume
      UI.tap(ui, bx, by, bw, bh, () => { M.tab = 'costumes'; M.page = 0; M.ask = null; }); }
    const bs = S(128), lx = eox + S(36), ly = T0 + S(330);
    UI.shopStall(ctx, lx, ly - S(6), bs, now); UI.tap(ui, lx, ly, bs, bs, () => { ui.overlay = 'evoShop'; });
    { const cb = bs * 1.4, rx0 = eox + ecw - S(36) - cb, y = ly, nc = api.chest ? api.chest() : 0, ready = nc >= 3;   // le coffre : une part par course terminee ; plein au bout de 3, on l'ouvre
      UI.chestFrame(ctx, rx0, y, cb, ready, true, now, ready ? undefined : nc / 3);
      if (ready) { const ow = cb * 1.3, oh = S(78), ox2 = rx0 + cb / 2 - ow / 2, oy = y + cb - S(30), f = UI.greenButton(ctx, ox2, oy, ow, oh, { cat: 'la' }); UI.outlined(ctx, 'OUVRIR', ox2 + ow / 2, f.y + f.h * 0.5, UI.fit(ctx, 'OUVRIR', ow * 0.86, f.h * 0.5), '#FFFFFF'); }
      else { const lab = nc + ' / 3'; UI.outlined(ctx, lab, rx0 + cb / 2, y + cb + S(36), UI.fit(ctx, lab, cb * 1.2, S(48)), '#F0EDE4'); }
      UI.tap(ui, rx0 - S(10), y, cb + S(20), cb + S(86), () => { if (ready) { snd(g, 'coinPing'); api.openChest(g); } else Home.toast(ui, 'TERMINE 3 COURSES POUR OUVRIR LE COFFRE'); }); }
    { const k = 1 + 0.025 * Math.sin(now / 420), s = (CC.Touch && CC.Touch.active) ? 'APPUYEZ POUR LANCER' : 'CLIC POUR LANCER', yy = T0 + HH * 0.4; ctx.save(); ctx.translate(cx, yy); ctx.scale(k, k); ctx.translate(-cx, -yy);
      { const px = UI.fit(ctx, s, cw * 0.7, S(58)); UI.outlined(ctx, s, cx, yy, px, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', { keep: true, ow: 0.2 }); UI.outlined(ctx, s, cx, yy, px, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', { keep: true, ow: 0.13 }); UI.outlined(ctx, s, cx, yy, px, '#F0EDE4', '#000000', { keep: true, ow: 0.07 }); } ctx.restore(); }
    const gap = S(34), marg = S(40), cwd = (cw - marg * 2 - gap * 2) / 3, chh = ((cw - S(26) * 2 - S(14) * 2) / 3) / 0.703, cy0 = T0 + HH - chh - S(28);
    POW.forEach((def, i) => card(ui, ctx, g, SV, def, ox + marg + i * (cwd + gap), cy0, cwd, chh, now));
    if (Home.drawToast) Home.drawToast(ui, ctx, F.L);
    K.hit(ui, 0, T0 + S(160), W, Y(0.68) - T0 - S(160), () => api.start(g), true);
  }

  // ---------- costumes : l'ecran « apparences » de l'ancien menu (tuiles ardoise, nom en jaune quand il est porte) ----------
  function drawCostumes(ui, ctx, g, W, H, F, SV, now) {
    const { HH, Y, T0, cw, ox, cx } = F;
    K.bgPattern(ctx, W, T0, HH); K.topBar(ui, ctx, g, edgeF(F, W, HH), SV, E, { close: () => { M.tab = 'jouer'; M.ask = null; } });
    UI.outlined(ctx, 'COSTUMES', cx, Y(0.16), S(100), T.white);
    const ids = PRO.SKIN_IDS, per = 8, pages = Math.max(1, Math.ceil(ids.length / per)); M.page = U.clamp(M.page, 0, pages - 1);
    const sel = PRO.skin() || 'stock', tw0 = (cw - S(108)) / 2, th = S(260), gx = ox + S(36), gy = Y(0.22);
    ids.slice(M.page * per, M.page * per + per).forEach((id, i) => { const x = gx + (i % 2) * (tw0 + S(36)), y = gy + Math.floor(i / 2) * (th + S(26)), open = PRO.isOwned(id), on = sel === id, sk = CC.Skins.byId[id], ask = M.ask === id, p = PRO.price(id), nm = ask ? 'ACHETER ?' : skinName(sk, id);
      UI.panel(ctx, x, y, tw0, th, on ? { c: S(26), fill: '#4A6E8F', border: T.yellow, bw: S(6) } : { c: S(26), border: T.border, bw: S(3) }); ctx.save(); if (!open) ctx.globalAlpha = 0.35; { const tc = thumb(id); if (tc) { const k = Math.min(tw0 * 0.74 / tc.width, th * 0.5 / tc.height); ctx.drawImage(tc, x + tw0 / 2 - tc.width * k / 2, y + th * 0.4 - tc.height * k / 2, tc.width * k, tc.height * k); } else UI.icon(ctx, 'missile_ogive', x + tw0 / 2, y + th * 0.4, th * 0.55); } ctx.restore();
      UI.text(ctx, nm, x + tw0 / 2, y + th * 0.84, UI.fit(ctx, nm, tw0 * 0.8, S(46)), on || ask ? T.yellow : T.white, { shadow: false });
      if (!open) { const ps = p > 0 ? U.formatInt(p) : 'GRATUIT'; UI.icon(ctx, 'coin', x + tw0 - S(54), y + S(54), S(56)); UI.text(ctx, ps, x + tw0 - S(54), y + S(104), UI.fit(ctx, ps, S(100), S(30)), (SV.coins || 0) >= p ? T.white : T.dim, { shadow: false }); }
      K.hit(ui, x, y, tw0, th, () => {
        if (open) { PRO.setSkin(id); M.ask = null; try { g.rocket.setSkin(skinNow()); } catch (e) { /* apercu */ } snd(g, 'uiTick'); return; }
        if ((SV.coins || 0) < p) { M.ask = null; Home.toast(ui, 'PAS ASSEZ DE PIÈCES'); return; }
        if (p > 0 && !ask) { M.ask = id; snd(g, 'uiTick'); return; }
        SV.coins = (SV.coins || 0) - p; PRO.own(id); PRO.setSkin(id); M.ask = null; save(g); try { g.rocket.setSkin(skinNow()); } catch (e) { /* apercu */ } snd(g, 'coinPing'); Home.toast(ui, 'COSTUME OBTENU !'); }); });
    const py = gy + 4 * (th + S(26)) + S(4), pbw = S(150), pbh = S(96);
    if (pages > 1) { const ps = (M.page + 1) + ' / ' + pages; UI.btnSecondary(ctx, cx - S(270), py, pbw, pbh, '<'); UI.tap(ui, cx - S(270), py, pbw, pbh, () => { M.page = (M.page + pages - 1) % pages; M.ask = null; }); UI.btnSecondary(ctx, cx + S(120), py, pbw, pbh, '>'); UI.tap(ui, cx + S(120), py, pbw, pbh, () => { M.page = (M.page + 1) % pages; M.ask = null; }); UI.outlined(ctx, ps, cx, py + pbh * 0.46, S(52), T.white); }
    { const ty = py + pbh + S(66), tr = PRO.trail(), cs = S(44); UI.outlined(ctx, 'TRAÎNÉE', gx, ty, S(40), T.white, null, { align: 'left' });   // la couleur de la trainee : les memes pastilles de couleur que les anciennes apparences
      PRO.TRAILS.forEach((c, i) => { const x = gx + S(230) + i * S(72), on = tr === c; ctx.fillStyle = c || T.bg2; UI.cham(ctx, x, ty - cs / 2, cs, cs, S(10)); ctx.fill(); ctx.lineWidth = S(on ? 6 : 2); ctx.strokeStyle = on ? T.white : T.border2; ctx.stroke(); UI.tap(ui, x - S(8), ty - cs / 2 - S(8), cs + S(16), cs + S(16), () => { PRO.setTrail(c); snd(g, 'uiTick'); }); }); }
    if (Home.drawToast) Home.drawToast(ui, ctx, F.L);
  }

  Home.drawEvo = function (ui, ctx, g, W, H) {
    const F = K.frame(ui, ctx, W, H), SV = E.save(g), now = performance.now(); thBudget = 2; if (!M.pre && E.mapPoster) { M.pre = 1; api.mapKeys().forEach((k) => E.mapPoster(k)); }
    if (M.tab === 'costumes') drawCostumes(ui, ctx, g, W, H, F, SV, now); else drawHome(ui, ctx, g, W, H, F, SV, now);
  };
})();
