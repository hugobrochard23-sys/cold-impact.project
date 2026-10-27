/* v261 : BOUTIQUE defilante (offres sans pub, gemmes, pieces), fond mouvant en diagonale (aussi pour les reglages), panneau « sans pub », tuile « gemme gratuite » du menu.
 * Remplace Home.drawEvoShop de evo_ui.js ; s'appuie sur les outils exposes par Home.evoK. */
(function () {
  const U = CC.U, Home = CC.Home, UI = CC.UI2; if (!Home || !UI || !Home.evoK) return;
  const T = UI.THEME, S = UI.S, K = Home.evoK, rr = UI.rrect;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- defilement (doigt, souris, molette) ----------
  const SC = Home.shopScroll = { y: 0, v: 0, max: 0, drag: null };
  const active = () => !!(CC.game && CC.game.ui && CC.game.ui.overlay === 'evoShop');
  const cy = (clientY) => { const g = CC.game; return g && g.input ? g.input.uiCoords(0, clientY).y : clientY; };
  const move = (clientY) => { if (!SC.drag) return; const y = cy(clientY), dy = SC.drag.last - y; SC.drag.last = y; SC.y = cl(SC.y + dy, 0, SC.max); SC.v = dy; };
  document.addEventListener('touchstart', (e) => { if (!active()) return; const t = e.changedTouches[0]; SC.drag = { id: t.identifier, last: cy(t.clientY) }; SC.v = 0; }, { passive: true });
  document.addEventListener('touchmove', (e) => { if (!SC.drag) return; for (const t of e.changedTouches) if (t.identifier === SC.drag.id) move(t.clientY); }, { passive: true });
  const endDrag = (e) => { if (SC.drag && (!e.changedTouches || [].some.call(e.changedTouches, (t) => t.identifier === SC.drag.id))) SC.drag = null; };
  document.addEventListener('touchend', endDrag, { passive: true }); document.addEventListener('touchcancel', endDrag, { passive: true });
  document.addEventListener('mousedown', (e) => { if (active()) { SC.drag = { id: 'm', last: cy(e.clientY) }; SC.v = 0; } });
  document.addEventListener('mousemove', (e) => { if (SC.drag && SC.drag.id === 'm') move(e.clientY); });
  document.addEventListener('mouseup', () => { if (SC.drag && SC.drag.id === 'm') SC.drag = null; });
  document.addEventListener('wheel', (e) => { if (active()) { SC.y = cl(SC.y + e.deltaY * 0.8, 0, SC.max); SC.v = 0; } }, { passive: true });

  // ---------- fond bleu a motifs qui defile en diagonale (boutique, reglages) ----------
  // petite fusee blanche (luminosite 100 %) preparee une fois
  let _wr = null, _wrT = 0;
  const whiteRocket = () => {
    if (_wr) return _wr; const now = performance.now(); if (now - _wrT < 400) return null; _wrT = now;
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); UI.icon(x, 'missile_ogive', 64, 64, 110);
    let ok = false; try { const d = x.getImageData(0, 0, 128, 128).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 10) { ok = true; break; } } catch (e) { ok = true; }
    if (!ok) return null; x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 128, 128); _wr = c; return c;
  };
  Home.movingBg = (ctx, ui, W, H, scroll) => {
    const T0 = -(ui.offsetY || 0), HH = ui.fullH || H, t = performance.now() / 1000, tile = Math.max(70, W * 0.16), off = t * 16 + (scroll || 0) * 0.4;
    const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, '#1F66E8'); g.addColorStop(1, '#0D3796'); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH);
    const wr = whiteRocket(); if (!wr) return;
    ctx.save(); ctx.globalAlpha = 0.09;
    const ox = ((off % tile) + tile) % tile, oy = ox, sz = tile * 0.9;
    for (let r = -1, y = -tile; y < HH + tile; y += tile * 0.62, r++) for (let x = -tile; x < W + tile; x += tile) { ctx.save(); ctx.translate(x + ((r & 1) ? tile / 2 : 0) - ox, T0 + y - oy); ctx.rotate(0.8); ctx.drawImage(wr, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
    ctx.restore();
  };

  // ---------- helpers de dessin ----------
  const border = (ctx, x, y, w, h, r, col, bw) => { rr(ctx, x, y, w, h, r); ctx.lineWidth = bw; ctx.strokeStyle = col; ctx.stroke(); };
  const card = (ctx, x, y, w, h, fill, edge) => { const r = S(26); ctx.save(); rr(ctx, x, y + S(6), w, h, r); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill(); ctx.restore(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); border(ctx, x, y, w, h, r, edge, S(5)); };
  const head = (ctx, x, y, w, h, label, fill, edge, ico) => { const r = h * 0.3; rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); border(ctx, x, y, w, h, r, edge, S(5)); if (ico) ico(x + h * 0.6, y + h / 2, h * 0.78); UI.outlined(ctx, label, x + h * 1.2, y + h / 2, UI.fit(ctx, label, w - h * 1.5, h * 0.5), '#FFFFFF', '#0B2A66', { keep: true, ow: 0.1, align: 'left' }); };
  const priceBtn = (ctx, x, y, w, h, label, cat) => { const f = UI.greenButton(ctx, x, y, w, h, { cat: cat || 'buy', r: 0.26, lip: 0.16 }); UI.outlined(ctx, label, x + w / 2, f.y + f.h * 0.5, UI.fit(ctx, label, w * 0.86, f.h * 0.5), '#FFFFFF', '#1F6A08', { keep: true, ow: 0.1 }); return f; };
  const adBtn = (ctx, x, y, w, h, label, now) => { const f = UI.greenButton(ctx, x, y, w, h, { cat: 'ad', r: 0.26, lip: 0.16 }); const ts = f.h * 0.78; ctx.save(); ctx.translate(x + f.h * 0.6, f.y + f.h * 0.5); ctx.rotate(-0.2); UI.artImg(ctx, 'ticket', 0, 0, ts); ctx.restore(); UI.outlined(ctx, label, x + w * 0.58, f.y + f.h * 0.5, UI.fit(ctx, label, w * 0.6, f.h * 0.42), '#FFFFFF'); K.shimmer(ctx, f.x, f.y, f.w, f.h, f.h * 0.26, ((now / 1000) % 2) / 0.6); return f; };
  const numTxt = (ctx, s, x, y, px, edge) => UI.outlined(ctx, s, x, y, px, '#FFFFFF', edge || '#5A3A00', { keep: true, ow: 0.16 });
  const bestBadge = (ctx, x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.38); UI.artImg(ctx, 'badge_best', 0, 0, s); UI.outlined(ctx, 'BEST', 0, -s * 0.07, s * 0.2, '#FFFFFF', '#6B0F0F', { keep: true, ow: 0.14 }); UI.outlined(ctx, 'VALUE', 0, s * 0.12, s * 0.2, '#FFFFFF', '#6B0F0F', { keep: true, ow: 0.14 });
    ctx.save(); rr(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, s * 0.4); ctx.clip(); K.shimmer(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, s * 0.4, ((performance.now() / 1000) % 3) / 0.6); ctx.restore(); ctx.restore(); };   // reflet toutes les 3 s
  const price = (id, d) => (CC.Native && CC.Native.price(id)) || d;

  // ---------- boutique ----------
  Home.drawEvoShop = function (ui, ctx, game, W, H) {
    const F = K.frame(ui, ctx, W, H), { HH, T0, cw, ox } = F, E = CC.EVO, S0 = E.save(game), now = performance.now();
    if (!SC.drag) { SC.y = cl(SC.y + SC.v, 0, SC.max); SC.v *= 0.93; if (Math.abs(SC.v) < 0.3) SC.v = 0; }
    Home.movingBg(ctx, ui, W, H, SC.y);
    const mx = ox + S(36), mw = cw - S(72), top = T0 + S(150), viewH = HH - S(150), sy = SC.y;
    const buy = (id) => { if (CC.Native && CC.Native.on) { CC.Native.buy(id); return; } Home.toast(ui, 'ACHAT BIENTÔT DISPONIBLE'); };
    const tapS = (x, y, w, h, fn) => { const yy = y - sy; if (yy + h < top || yy > T0 + HH) return; UI.tap(ui, x, Math.max(yy, top), w, Math.min(yy + h, T0 + HH) - Math.max(yy, top), fn); };
    ctx.save(); ctx.beginPath(); ctx.rect(0, top - S(10), W, HH); ctx.clip(); ctx.translate(0, -sy);
    let y = top + S(10);
    // --- packs sans publicite : fond creme #f7efcb
    head(ctx, mx, y, mw, S(100), 'PACKS SANS PUBLICITÉ', '#E8C95A', '#B8932E', (x, yy, r) => K.adsBadge(ctx, x, yy, r * 0.45)); y += S(120);
    { const h = S(260); card(ctx, mx, y, mw, h, '#F7EFCB', '#D8C98A'); K.adsBadge(ctx, mx + S(120), y + h * 0.36, S(70)); UI.text(ctx, '+', mx + S(235), y + h * 0.36, S(80), '#6A5320', { shadow: false });
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = S(9); ctx.shadowBlur = S(5); UI.icon(ctx, 'gems_belt', mx + S(400), y + h * 0.33, S(180)); ctx.restore(); numTxt(ctx, '10', mx + S(400), y + h * 0.66, S(52));
      UI.outlined(ctx, 'Pack de démarrage', mx + S(40), y + h * 0.9, S(50), '#FFFFFF', '#8A6A1E', { keep: true, ow: 0.14, align: 'left' });
      const bw = S(280), bh = S(100), bx = mx + mw - bw - S(30), by = y + (h - bh) / 2; priceBtn(ctx, bx, by, bw, bh, price('starter', '10,99 €')); tapS(bx, by, bw, bh, () => buy('starter')); y += h + S(24); }
    { const h = S(170); card(ctx, mx, y, mw, h, '#F7EFCB', '#D8C98A'); K.adsBadge(ctx, mx + S(95), y + h / 2, S(58)); UI.outlined(ctx, 'Pas de publicités', mx + S(190), y + h * 0.5, S(54), '#FFFFFF', '#8A6A1E', { keep: true, ow: 0.14, align: 'left' });
      const bw = S(280), bh = S(100), bx = mx + mw - bw - S(30), by = y + (h - bh) / 2; priceBtn(ctx, bx, by, bw, bh, price('noads', '7,99 €')); tapS(bx, by, bw, bh, () => buy('noads')); y += h + S(44); }
    // --- gemmes : fond #ffcc00 ; plus l'icone est grosse, plus le pack coute cher
    head(ctx, mx, y, mw, S(100), 'PIERRES PRÉCIEUSES', '#12A7FF', '#0A6FB8', (x, yy, r) => UI.icon(ctx, 'gem', x, yy, r)); y += S(122);
    { const tiles = [{ n: 1, ico: 'gem', k: 0.4, free: true }, { n: 5, ico: 'gems_rope', k: 0.56, id: 'gems5', p: '2,09 €' }, { n: 10, ico: 'gems_belt', k: 0.66, id: 'gems10', p: '3,69 €' }, { n: 30, ico: 'bag_wings', k: 0.76, id: 'gems30', p: '9,99 €' }, { n: 100, ico: 'gems_chest', k: 0.86, id: 'gems100', p: '25,99 €' }, { n: 250, ico: 'crate_steel', k: 0.95, id: 'gems250', p: '49,99 €', best: true }];
      const gp = S(20), tw0 = (mw - gp * 2) / 3, th = S(410), free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
      tiles.forEach((t, i) => { const x = mx + (i % 3) * (tw0 + gp), yy = y + Math.floor(i / 3) * (th + gp); card(ctx, x, yy, tw0, th, '#FFCC00', '#E89A00');
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = S(9); ctx.shadowOffsetX = S(3); ctx.shadowBlur = S(5); UI.icon(ctx, t.ico, x + tw0 / 2, yy + th * 0.37, tw0 * t.k); ctx.restore(); numTxt(ctx, String(t.n), x + tw0 / 2, yy + th * 0.68, S(54));
        const bw = tw0 * 0.9, bh = S(92), bx = x + (tw0 - bw) / 2, by = yy + th - bh - S(20);
        if (t.free) { adBtn(ctx, bx, by, bw, bh, free > 0 ? 'GRATUIT ' + free + '/3' : '0/3', now); tapS(bx, by, bw, bh, () => { if (free > 0) E.gemAd(game, true); else Home.toast(ui, 'REVIENS DEMAIN !'); }); }
        else { priceBtn(ctx, bx, by, bw, bh, price(t.id, t.p)); tapS(bx, by, bw, bh, () => buy(t.id)); }
        if (t.best) bestBadge(ctx, x + tw0 * 0.17, yy + S(50), S(150)); });
      y += th * 2 + gp + S(44); }
    // --- pieces : fond #09b4ff
    head(ctx, mx, y, mw, S(100), 'PIÈCES', '#FFB800', '#C98400', (x, yy, r) => UI.icon(ctx, 'coin', x, yy, r)); y += S(122);
    { const B = E.saveBase(game), day = new Date().toISOString().slice(0, 10); if (!B.coinFree || B.coinFree.day !== day) B.coinFree = { day, n: 0 }; const cfree = Math.max(0, 3 - B.coinFree.n);
      const pk = (k) => E.coinPack(game, k), tiles = [{ n: U.formatInt(pk('free')), ico: 'coin', art: true, k: 0.4, free: true }, { n: U.formatInt(pk('coins12k')), ico: 'coins_stack', k: 0.6, id: 'coins12k', p: '0,99 €' }, { n: U.formatInt(pk('coins40k')), ico: 'coins_bag', art: true, k: 0.82, id: 'coins40k', p: '3,69 €' }];
      const gp = S(20), tw0 = (mw - gp * 2) / 3, th = S(410);
      tiles.forEach((t, i) => { const x = mx + i * (tw0 + gp), yy = y; card(ctx, x, yy, tw0, th, '#09B4FF', '#0678B8');
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = S(9); ctx.shadowOffsetX = S(3); ctx.shadowBlur = S(5); if (t.art) UI.artImg(ctx, t.ico, x + tw0 / 2, yy + th * 0.37, tw0 * t.k); else UI.icon(ctx, t.ico, x + tw0 / 2, yy + th * 0.37, tw0 * t.k); ctx.restore(); numTxt(ctx, t.n, x + tw0 / 2, yy + th * 0.68, S(54), '#04456B');
        const bw = tw0 * 0.9, bh = S(92), bx = x + (tw0 - bw) / 2, by = yy + th - bh - S(20);
        if (t.free) { adBtn(ctx, bx, by, bw, bh, cfree > 0 ? 'GRATUIT ' + cfree + '/3' : '0/3', now); tapS(bx, by, bw, bh, () => { if (cfree <= 0) { Home.toast(ui, 'REVIENS DEMAIN !'); return; } if (game.ads && game.ads.rewarded) game.ads.rewarded(() => { B.coinFree.n++; const n0 = pk('free'); E.save(game).coins += n0; game.writeSave(); game.audio.play('coinPing'); Home.evoFly(game, n0, 0, 30); }, null, 'coins', U.formatInt(pk('free')) + ' PIÈCES'); }); }
        else { priceBtn(ctx, bx, by, bw, bh, price(t.id, t.p)); tapS(bx, by, bw, bh, () => buy(t.id)); } });
      y += th + gp;
      const h = S(330); card(ctx, mx, y, mw, h, '#09B4FF', '#0678B8'); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = S(10); ctx.shadowBlur = S(6); UI.artImg(ctx, 'coins_chest', mx + mw * 0.3, y + h * 0.5, S(360)); ctx.restore();
      bestBadge(ctx, mx + S(95), y + S(80), S(165)); rr(ctx, mx + mw * 0.58, y + h * 0.1, mw * 0.38, h * 0.8, S(22)); ctx.fillStyle = 'rgba(4,69,107,0.45)'; ctx.fill(); numTxt(ctx, U.formatInt(E.coinPack(game, 'coins100k')), mx + mw * 0.77, y + h * 0.3, S(80), '#04456B');
      { const bw = mw * 0.32, bh = S(104), bx = mx + mw * 0.77 - bw / 2, by = y + h * 0.46; priceBtn(ctx, bx, by, bw, bh, price('coins100k', '6,49 €')); tapS(bx, by, bw, bh, () => buy('coins100k')); }
      y += h + S(60); }
    ctx.restore();
    SC.max = Math.max(0, y + S(30) - (T0 + HH)); SC.y = cl(SC.y, 0, SC.max);
    K.topBar(ui, ctx, game, F, S0, E, { close: () => { ui.overlay = 'evo'; }, backSnd: true });
    K.flyDraw(ctx, game, F, now);
    if (Home.drawToast) Home.drawToast(ui, ctx, F.L);
  };

  // ---------- panneau « offre premium sans pub » (touche l'icone ADS du menu) ----------
  Home.drawNoAdsPanel = (ui, ctx, game, W, H, F) => {
    const { cx, cw, Y } = F, now = performance.now(), E = CC.EVO; ui.buttons = [];
    ui.dim(ctx, W, H, 0.78);
    const pw = cw * 0.86, ph = S(880), px = cx - pw / 2, py = Y(0.5) - ph / 2, r = S(46);
    rr(ctx, px, py + S(10), pw, ph, r); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#FF9E3D'); g.addColorStop(1, '#F0508A'); rr(ctx, px, py, pw, ph, r); ctx.fillStyle = g; ctx.fill(); border(ctx, px, py, pw, ph, r, '#FFD65A', S(8));
    UI.outlined(ctx, 'Offre Premium sans pub', cx, py + S(110), UI.fit(ctx, 'Offre Premium sans pub', pw * 0.84, S(78)), '#FFFFFF', '#8A3A12', { keep: true, ow: 0.14 });
    const bx = px + S(40), by = py + S(210), bw = pw - S(80), bh = S(360); rr(ctx, bx, by, bw, bh, S(30)); ctx.fillStyle = 'rgba(122,42,50,0.5)'; ctx.fill();
    K.adsBadge(ctx, bx + S(130), by + bh / 2, S(95));
    const lines = ['Suppression définitive', 'de toutes les publicités', 'obligatoires. Les vidéos', 'récompensées resteront', 'disponibles.']; lines.forEach((s, i) => UI.outlined(ctx, s, bx + S(260), by + S(62) + i * S(58), UI.fit(ctx, s, bw - S(290), S(46)), '#FFFFFF', '#5A1A22', { keep: true, ow: 0.1, align: 'left' }));
    const b2w = pw * 0.8, b2h = S(150), b2x = cx - b2w / 2, b2y = py + ph - b2h - S(70), f = UI.greenButton(ctx, b2x, b2y, b2w, b2h, { cat: 'buy' }); UI.outlined(ctx, price('noads', '7,99 €'), cx, f.y + f.h * 0.5, UI.fit(ctx, price('noads', '7,99 €'), b2w * 0.8, f.h * 0.5), '#FFFFFF', '#1F6A08', { keep: true, ow: 0.1 }); K.shimmer(ctx, f.x, f.y, f.w, f.h, f.h * 0.07, ((now / 1000) % 2.5) / 0.6);
    const cs = S(110), ccx = px + S(10), ccy = py + S(10); UI.artImg(ctx, 'close', ccx, ccy, cs);
    UI.tap(ui, b2x, b2y, b2w, b2h, () => { if (CC.Native && CC.Native.on) CC.Native.buy('noads'); else Home.toast(ui, 'ACHAT BIENTÔT DISPONIBLE'); });
    const clo = UI.tap(ui, ccx - cs / 2, ccy - cs / 2, cs, cs, () => { game.evoNoAds = false; }); ui.buttons[ui.buttons.length - 1].snd = 'back';
    UI.tap(ui, 0, 0, W, H, () => { game.evoNoAds = false; });
    if (Home.drawToast) Home.drawToast(ui, ctx, F.L);
  };

  // ---------- tuile « gemme gratuite » du menu (sous le bouton ADS) ----------
  // silhouette blanche d'une illustration (cache) pour lui dessiner un contour
  const _sil = {};
  const outlineArt = (ctx, name, cx, cy, size, w, col) => {
    const key = name + Math.round(size); let c = _sil[key];
    if (!c) { const im = UI.art(name); if (!im) { UI.artImg(ctx, name, cx, cy, size); return; } const pad = Math.ceil(w * 2 + 2), n = Math.ceil(size + pad * 2); c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); UI.artImg(x, name, n / 2, n / 2, size); x.globalCompositeOperation = 'source-in'; x.fillStyle = col || '#FFFFFF'; x.fillRect(0, 0, n, n); _sil[key] = c; }
    const n = c.width; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; ctx.drawImage(c, cx - n / 2 + Math.cos(a) * w, cy - n / 2 + Math.sin(a) * w, n, n); }
    UI.artImg(ctx, name, cx, cy, size);
  };
  Home.drawGemTile = (ui, ctx, game, x, y, s, now) => {
    const E = CC.EVO, left = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0)), r = s * 0.2;
    // v264 : plus de carre derriere : c'est la gemme elle-meme qui a un contour blanc et qui est plus grande
    ctx.save(); if (left <= 0) ctx.globalAlpha = 0.6; outlineArt(ctx, 'gem', x + s * 0.5, y + s * 0.4, s * 0.82, S(6)); ctx.restore();
    UI.outlined(ctx, 'X1', x + s * 0.84, y + s * 0.13, s * 0.26, '#FFFFFF', '#0B2A66', { keep: true, ow: 0.16 });
    ctx.save(); ctx.translate(x + s * 0.3, y + s * 0.8); ctx.rotate(-0.2); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = S(3); UI.artImg(ctx, 'ticket', 0, 0, s * 0.34); ctx.restore();
    UI.outlined(ctx, left + '/3', x + s * 0.64, y + s * 0.8, s * 0.26, '#FFFFFF', '#0B2A66', { keep: true, ow: 0.16 });
    UI.tap(ui, x, y, s, s, () => { if (left > 0) E.gemAd(game, true); else Home.toast(ui, 'REVIENS DEMAIN !'); });
  };
})();
