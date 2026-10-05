/* v094 : écrans « pro » — MODULES (expliqués, textes qui tiennent), ROUTE DU PILOTE (clic sur le profil : une récompense à chaque niveau de pilote),
 * CONDITIONS D'UTILISATION (première ouverture). */
(function () {
  const U = CC.U, F = CC.Font, Home = CC.Home, Meta = CC.Meta;
  const NAVY = '#1d232b', PANEL = '#262d36', DARK = '#14181d', EDGE = '#5a6674', STEEL = '#3b4652', CREAM = '#e8ecef', GOLD = '#d9a441', DIM = '#8995a1', GREEN = '#56d98b';
  const R = Math.round;
  const hit = (ui, x, y, w, h, action) => ui.buttons.push({ x, y, w, h, action });
  const inRect = (ui, x, y, w, h) => !ui.isTouch() && ui.mouse.x >= x && ui.mouse.x <= x + w && ui.mouse.y >= y && ui.mouse.y <= y + h;
  function txt(ctx, s, x, y, maxW, px, color, align) { s = String(s); const p = Math.min(px, maxW / Math.max(1, F.measure(s, 1))); F.draw(ctx, s, x, y, p, color, { align: align || 'left' }); return p; }
  const panel = (ctx, x, y, w, h, fill, edge, c) => Home.pill(ctx, x, y, w, h, fill || PANEL, edge || EDGE, c === undefined ? Math.min(h * 0.18, 14) : c);
  const backdrop = (ctx, L) => { ctx.fillStyle = STEEL; ctx.fillRect(0, L.T, L.W, L.HH); };
  const greenBtn = (ctx, x, y, w, h, on) => { Home.button3d(ctx, x, y, w, h, '', '', '', 1); if (on) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(R(x + 2), R(y + 2), R(w - 4), R(h - 6)); } };
  const titleBar = (ctx, L, y, title, right, cx) => { const { W, HH, u } = L, m = u * 0.04, th = HH * 0.062; panel(ctx, m, y, W - 2 * m, th, NAVY, EDGE, th * 0.14); txt(ctx, title, cx || W / 2, y + th * 0.3, cx ? W * 0.32 : W * 0.5, 3, CREAM, 'center'); if (right) txt(ctx, right, W - m * 2, y + th * 0.34, W * 0.2, 1.8, GOLD, 'right'); return th; };

  // ============================================================================================================
  //   MODULES : "des bonus pour ta fusée"
  // ============================================================================================================
  const HINT = { shield: 'CHERCHE UN ENGIN DORE', warhead: 'CHERCHE UN ENGIN DORE', siphon: 'CHERCHE UN ENGIN DORE', radar: 'CHERCHE UN ENGIN DORE', fortune: 'CHERCHE UN ENGIN DORE' };
  Home.drawModules = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { T, HH, u } = L, m = u * 0.04, meta = game.meta;
    backdrop(ctx, L); const top = Home.drawTop(ui, ctx, game, L, 'sub');
    const ty = top + HH * 0.016, th = titleBar(ctx, L, ty, 'MODULES', meta.eq().length + ' / ' + Meta.SLOTS, W * 0.55);
    // explication (une fois pour toutes, 2 lignes)
    const iy = ty + th + HH * 0.012, ih = HH * 0.085; panel(ctx, m, iy, W - 2 * m, ih, '#1f3326', GREEN, 10);
    txt(ctx, 'DES BONUS POUR TA FUSEE', W / 2, iy + ih * 0.16, W - 4 * m, 1.9, GREEN, 'center');
    txt(ctx, 'EQUIPE-EN ' + Meta.SLOTS + ' AVANT DE JOUER', W / 2, iy + ih * 0.5, W - 4 * m, 1.4, CREAM, 'center');
    // une carte par module
    const ly = iy + ih + HH * 0.012, rowH = HH * 0.108, gap = HH * 0.008;
    Meta.IDS.forEach((id, i) => {
      const md = Meta.MODS[id], lvl = meta.lvl(id), y = ly + i * (rowH + gap), on = meta.isEq(id), x = m, w = W - 2 * m;
      panel(ctx, x, y, w, rowH, lvl ? NAVY : DARK, on ? GREEN : EDGE, 10);
      const ib = rowH * 0.7, ix = x + rowH * 0.12, iy2 = y + (rowH - ib) / 2; panel(ctx, ix, iy2, ib, ib, DARK, EDGE, 6);
      Home.modIcon(ctx, id, ix + ib / 2, iy2 + ib / 2, ib * 0.8, lvl ? undefined : '#2d343d');
      const bw = w * 0.25, bx = x + w - bw - 8, x0 = ix + ib + 10, tw = bx - x0 - 8;
      txt(ctx, lvl ? md.name : '???', x0, y + rowH * 0.12, tw * 0.6, 1.9, lvl ? CREAM : DIM); txt(ctx, md.rar, x0 + tw, y + rowH * 0.16, tw * 0.38, 1.1, Meta.RAR[md.rar], 'right');
      txt(ctx, lvl ? md.desc(lvl) : HINT[id], x0, y + rowH * 0.46, tw, 1.3, lvl ? '#bfe8cc' : DIM);
      if (lvl) {
        const n = meta.need(id), k = lvl >= 5 ? 1 : U.clamp(meta.dup(id) / n, 0, 1), by = y + rowH * 0.78, bh = rowH * 0.1;
        ctx.fillStyle = DARK; ctx.fillRect(R(x0), R(by), R(tw), R(bh)); ctx.fillStyle = '#6aff9a'; ctx.fillRect(R(x0), R(by), R(k * tw), R(bh));
        const bh2 = rowH * 0.56, by2 = y + (rowH - bh2) / 2;
        if (on) { panel(ctx, bx, by2, bw, bh2, '#1f3326', GREEN, 8); txt(ctx, 'RETIRER', bx + bw / 2, by2 + bh2 * 0.34, bw - 8, 1.3, GREEN, 'center'); }
        else { greenBtn(ctx, bx, by2, bw, bh2, inRect(ui, bx, by2, bw, bh2)); txt(ctx, 'EQUIPER', bx + bw / 2, by2 + bh2 * 0.34, bw - 8, 1.3, DARK, 'center'); }
        hit(ui, bx - 4, y, bw + 12, rowH, () => { if (!on && meta.eq().length >= Meta.SLOTS) Home.toast(ui, 'RETIRE-EN UN D ABORD'); else meta.toggle(id); game.audio.play('ui'); });
      } else Home.icon.lock(ctx, bx + bw / 2, y + rowH / 2, rowH * 0.2, '#d8dde2');
    });
    Home.drawTabs(ui, ctx, game, L, 'garage'); if (Home.drawToast) Home.drawToast(ui, ctx, L);
  };

  // ============================================================================================================
  //   ROUTE DU PILOTE : une récompense à chaque niveau de pilote
  // ============================================================================================================
  const SKINS = { 4: 'gamin', 8: 'neon', 12: 'glace', 16: 'toxique', 20: 'samourai', 25: 'furtive', 30: 'phenix', 40: 'royale', 50: 'galaxie' };
  const MODR = ['shield', 'warhead', 'siphon', 'radar', 'fortune'];
  Home.roadReward = function (L) {
    if (SKINS[L] && CC.Skins.byId[SKINS[L]]) return { t: 'skin', id: SKINS[L] };
    if (L % 5 === 0) return { t: 'crate', n: 1 + Math.floor(L / 25) };
    if (L % 3 === 0) return { t: 'mod', id: MODR[(L / 3) % MODR.length | 0], n: 1 };
    return { t: 'nuts', n: 25 + 10 * L };
  };
  function icon(ctx, r, cx, cy, s) {
    if (r.t === 'nuts') { Home.drawCoinIcon(ctx, cx, cy, s); return '+' + r.n; }
    if (r.t === 'crate') { Home.crateIcon(ctx, cx, cy, s * 0.9); return 'CAISSE' + (r.n > 1 ? ' X' + r.n : ''); }
    if (r.t === 'mod') { Home.modIcon(ctx, r.id, cx, cy, s * 0.9); return Meta.MODS[r.id].name; }
    const sk = CC.Skins.byId[r.id]; if (CC.Hangar && CC.Hangar.preview(ctx, r.id, cx - s * 1.5, cy - s * 1.1, s * 3, s * 2.2, performance.now() / 1000)) return sk ? sk.short || sk.name : 'FUSEE';
    Home.gridDraw(ctx, 'rocket', cx, cy, s, '#e8ecef'); return sk ? sk.short || sk.name : 'FUSEE';
  }
  Home.drawRoad = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { T, HH, u } = L, m = u * 0.04, prog = game.progress, P = prog.P, meta = game.meta, lvl = prog.level;
    P.road = P.road || {};
    backdrop(ctx, L); const top = Home.drawTop(ui, ctx, game, L, 'sub');
    const ty = top + HH * 0.016, th = titleBar(ctx, L, ty, 'ROUTE DU PILOTE');
    // niveau + barre d'XP
    const py = ty + th + HH * 0.01, ph = HH * 0.085, pw = W - 2 * m; panel(ctx, m, py, pw, ph, PANEL, EDGE, 10);
    txt(ctx, prog.rank(lvl) + '  NIVEAU ' + lvl, m + 12, py + ph * 0.14, pw * 0.8, 2.2, CREAM);
    const bx = m + 12, bw = pw - 24, by = py + ph * 0.6, bh = ph * 0.24, k = U.clamp(prog.xp / prog.need(lvl), 0, 1);
    ctx.fillStyle = EDGE; ctx.fillRect(R(bx - 2), R(by - 2), R(bw + 4), R(bh + 4)); ctx.fillStyle = DARK; ctx.fillRect(R(bx), R(by), R(bw), R(bh)); ctx.fillStyle = GOLD; ctx.fillRect(R(bx), R(by), R(k * bw), R(bh));
    // les niveaux, 6 par page
    const per = 5, pages = 12; if (ui.roadPage === undefined) ui.roadPage = Math.min(pages - 1, Math.floor(Math.max(0, lvl - 1) / per));
    const pg = U.clamp(ui.roadPage, 0, pages - 1), gy = py + ph + HH * 0.012, rowH = HH * 0.094, gap = HH * 0.007, t = performance.now() / 1000;
    for (let i = 0; i < per; i++) {
      const Lv = pg * per + i + 1, y = gy + i * (rowH + gap), r = Home.roadReward(Lv), got = !!P.road[Lv], can = !got && Lv <= lvl, cur = Lv === lvl;
      panel(ctx, m, y, pw, rowH, got ? '#1a3a2a' : can ? '#3a3320' : NAVY, can ? GOLD : got ? GREEN : cur ? CREAM : EDGE, 10);
      const nb = rowH * 0.62, nx = m + rowH * 0.12, ny = y + (rowH - nb) / 2; panel(ctx, nx, ny, nb, nb, Lv <= lvl ? '#4a3a14' : DARK, Lv <= lvl ? GOLD : EDGE, nb * 0.3); txt(ctx, Lv, nx + nb / 2, ny + nb * 0.32, nb - 6, 2, Lv <= lvl ? GOLD : DIM, 'center');
      ctx.globalAlpha = Lv <= lvl ? 1 : 0.5; const lab = icon(ctx, r, m + rowH * 1.55, y + rowH / 2, rowH * 0.5); ctx.globalAlpha = 1;
      const bwid = pw * 0.26, bxx = m + pw - bwid - 8, bhh = rowH * 0.56, byy = y + (rowH - bhh) / 2;
      txt(ctx, lab, m + rowH * 2.35, y + rowH * 0.34, bxx - m - rowH * 2.5, 1.7, got ? GREEN : CREAM);
      if (got) Home.icon.check(ctx, bxx + bwid / 2, y + rowH / 2, rowH * 0.2, GREEN);
      else if (can) { Home.button3d(ctx, bxx, byy, bwid, bhh, '', '', '', 1 + 0.03 * Math.sin(t * 6)); txt(ctx, 'PRENDRE', bxx + bwid / 2, byy + bhh * 0.34, bwid - 8, 1.4, DARK, 'center');
        hit(ui, bxx - 6, y, bwid + 14, rowH, () => { P.road[Lv] = 1; const out = meta.give(r); game.writeSave(); game.audio.play('levelUp'); if (out.kind === 'nuts') Home.toast(ui, out.text); else if (Home.reveal) Home.reveal(ui, [out]); }); }
      else Home.icon.lock(ctx, bxx + bwid / 2, y + rowH / 2, rowH * 0.18, DIM);
    }
    // pages
    const ay = gy + per * (rowH + gap) + HH * 0.004, ab = HH * 0.055;
    for (const [lab, dx] of [['<', -1], ['>', 1]]) { const bx2 = W / 2 + dx * 70 - 24, on = inRect(ui, bx2, ay, 48, ab); panel(ctx, bx2, ay, 48, ab, on ? '#323b46' : NAVY, EDGE, 6); txt(ctx, lab, bx2 + 24, ay + ab * 0.3, 30, 2, CREAM, 'center'); hit(ui, bx2 - 8, ay - 8, 64, ab + 16, () => { ui.roadPage = U.clamp(pg + dx, 0, pages - 1); game.audio.play('uiTick'); }); }
    txt(ctx, (pg + 1) + ' / ' + pages, W / 2, ay + ab * 0.3, 70, 1.6, CREAM, 'center');
    Home.drawTabs(ui, ctx, game, L, 'road'); if (Home.drawToast) Home.drawToast(ui, ctx, L);
  };

  // ============================================================================================================
  //   CONDITIONS D'UTILISATION (première ouverture)
  // ============================================================================================================
  Home.drawTerms = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { T, HH, u, Y } = L, m = u * 0.05, urls = CC.CONFIG.legal || {};
    ctx.fillStyle = '#10151b'; ctx.fillRect(0, T, W, HH);
    txt(ctx, 'COLD IMPACT', W / 2, Y(0.1), W * 0.8, 5, GOLD, 'center');
    const cw = W - 2 * m, cy = Y(0.24), ch = HH * 0.34; panel(ctx, m, cy, cw, ch, NAVY, EDGE, 12);
    const lines = ['JEU GRATUIT', 'AVEC DES PUBLICITES', 'ET DES ACHATS FACULTATIFS', '', 'TA PROGRESSION RESTE', 'SUR TON TELEPHONE'];
    lines.forEach((s, i) => { if (s) txt(ctx, s, W / 2, cy + ch * (0.1 + i * 0.14), cw - 24, 1.8, i < 3 ? CREAM : '#bfe8cc', 'center'); });
    const lk = [['CONDITIONS D UTILISATION', urls.termsUrl], ['CONFIDENTIALITE', urls.privacyUrl]], ly = cy + ch + HH * 0.03;
    lk.forEach(([lab, url], i) => { const y = ly + i * HH * 0.055; txt(ctx, lab, W / 2, y, cw, 1.5, url ? '#8fd0ff' : DIM, 'center'); if (url) hit(ui, m, y - 8, cw, HH * 0.05, () => { try { window.open(url, '_blank'); } catch (e) { /* ignoré */ } }); });
    const bw = W * 0.8, bh = HH * 0.1, bx = (W - bw) / 2, by = Y(0.82), on = inRect(ui, bx, by, bw, bh);
    greenBtn(ctx, bx, by, bw, bh, on); txt(ctx, 'ACCEPTER ET JOUER', W / 2, by + bh * 0.32, bw - 16, 2.4, DARK, 'center');
    txt(ctx, 'EN JOUANT TU ACCEPTES CES CONDITIONS', W / 2, by + bh + HH * 0.02, W * 0.9, 1, DIM, 'center');
    hit(ui, bx, by, bw, bh, () => { game.settings.termsOk = true; try { localStorage.setItem('coldimpact.terms', '1'); } catch (e) { /* ignoré */ } game.writeSave(); ui.overlay = null; game.goHome({ autoLaunch: ((game.save.lvl && game.save.lvl.max) || 1) <= 1 && !((game.settings.tutStep || 0) >= 4) }); });
  };
})();
