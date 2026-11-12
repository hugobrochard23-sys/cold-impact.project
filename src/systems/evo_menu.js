/* v398 : LE MENU DE LA COURSE (?mvp=r), entierement redessine avec le systeme d'interface CC.RUI (palette bleue, jaune d'action, boutons calcules) :
 * compteurs en haut, accueil = grande photo de la carte + carte de la Coupe + gros bouton JOUER, barre de 5 onglets en bas (boutique, costumes, JOUER, pouvoirs, classement),
 * costumes par rarete avec couleur de trainee, boutique (gemmes <-> pieces, jamais d'argent reel), pouvoirs a ameliorer. Tout est sauvegarde en local. Aucun faux classement. */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mvp || E.mvp() !== 'r' || !E.race || !E.raceApi || !CC.RUI) return;
  const Home = CC.Home, UI = CC.UI2, U = CC.U, PRO = E.race, api = E.raceApi, R = CC.RUI, P = R.PAL;
  const M = { tab: 'jouer', rar: 0, page: 0, sess: -1, toast: null };
  const toast = (t) => { M.toast = { t, t0: performance.now() }; };
  E.menuTab = (t) => { M.tab = t; M.page = 0; };
  const POW = [['TURBO', 'VITESSE EN PLUS', P.green, 'bolt'], ['BOUCLIER', 'TRAVERSE LES OBSTACLES', P.blueL, 'check'], ['MISSILE', 'FAIT EXPLOSER LE PILOTE DEVANT', '#ff8a3a', 'rocket']];
  const TABS = [['boutique', 'BOUTIQUE', 'bag'], ['costumes', 'COSTUMES', 'rocket'], ['jouer', 'JOUER', 'play'], ['pouvoirs', 'POUVOIRS', 'bolt'], ['classement', 'CLASSEMENT', 'trophy']];
  const RARC = [['COMMUN', '#9fb0d0'], ['RARE', P.blueL], ['EPIQUE', '#c77bff']];
  const cover = (ctx, img, x, y, w, h) => { const ar = w / h; let sW = img.width, sH = img.height; if (sW / sH > ar) sW = sH * ar; else sH = sW / ar; ctx.drawImage(img, (img.width - sW) / 2, (img.height - sH) / 2, sW, sH, x, y, w, h); };
  const photo = (ctx, S, map, x, y, w, h, rad, o) => {   // une photo de carte : coins arrondis, ombre douce ; la carte choisie a un lisere jaune
    o = o || {}; ctx.save(); ctx.shadowColor = 'rgba(8,16,44,0.35)'; ctx.shadowBlur = S(26); ctx.shadowOffsetY = S(10); R.rr(ctx, x, y, w, h, rad); ctx.fillStyle = P.navy; ctx.fill(); ctx.restore();
    const mp = E.mapPoster ? E.mapPoster(map) : null; ctx.save(); R.rr(ctx, x, y, w, h, rad); ctx.clip(); if (mp) cover(ctx, mp, x, y, w, h);
    if (o.shade) { const g = ctx.createLinearGradient(0, y + h * 0.5, 0, y + h); g.addColorStop(0, 'rgba(13,26,63,0)'); g.addColorStop(1, 'rgba(13,26,63,0.85)'); ctx.fillStyle = g; ctx.fillRect(x, y + h * 0.5, w, h * 0.5); } if (o.dim) { ctx.fillStyle = 'rgba(13,26,63,' + o.dim + ')'; ctx.fillRect(x, y, w, h); } ctx.restore();
    if (o.on) { ctx.save(); R.rr(ctx, x, y, w, h, rad); ctx.lineWidth = S(6); ctx.strokeStyle = P.yellow; ctx.stroke(); ctx.restore(); }
  };
  const cupCard = (ui, ctx, g, F, S, y) => {   // la carte de la Coupe : 3 manches (photo de chaque carte) + le paquet a gagner
    const { cw, cx } = F, RC = api.R, h = S(262), w = cw * 0.94, x = cx - w / 2; R.panel(ctx, x, y, w, h, { dark: true, r: S(34) });
    R.tag(ctx, cx, y + S(2), 'COUPE COLD IMPACT', { px: S(30) });
    const seg = (w - S(60)) / 4;
    for (let k = 0; k < 4; k++) {
      const sx = x + S(30) + k * seg + S(6), sy = y + S(48), sw = seg - S(12), sh = S(140), isPack = k === 3, cur = k === RC.round - 1 && !isPack, done = k < RC.round - 1;
      if (isPack) { R.rr(ctx, sx, sy, sw, sh, S(22)); ctx.fillStyle = P.yellow; ctx.fill(); if (!UI.icon(ctx, 'chest_open', sx + sw / 2, sy + sh * 0.44, sh * 0.7)) R.text(ctx, '?', sx + sw / 2, sy + sh * 0.42, S(70), P.white); R.text(ctx, 'PAQUET', sx + sw / 2, sy + sh * 0.84, S(24), '#5a3400', { plain: true }); }
      else { photo(ctx, S, (RC.courses[k] && RC.courses[k].map) || 'arch', sx, sy, sw, sh, S(22), { thin: true, on: cur, dim: done ? 0.6 : cur ? 0 : 0.35, shade: true });
        R.text(ctx, [32, 16, 8][k] + ' PILOTES', sx + sw / 2, sy + sh * 0.84, S(22), P.white, { thin: true }); const br = S(22); ctx.beginPath(); ctx.arc(sx + br + S(8), sy + br + S(8), br - S(2), 0, 6.283); ctx.fillStyle = done ? P.green : cur ? P.yellow : P.blue; ctx.fill();
        if (done) R.icon(ctx, 'check', sx + br + S(8), sy + br + S(8), br * 1.0, { fill: P.white }); else R.text(ctx, String(k + 1), sx + br + S(8), sy + br + S(9), S(26), cur ? '#5a3400' : P.white, { plain: true }); }
    }
    R.text(ctx, 'MANCHE ' + RC.round + ' / 3   -   ' + RC.field[RC.round - 1] + ' PILOTES   -   ' + [16, 8, 1][RC.round - 1] + (RC.round === 3 ? ' VAINQUEUR' : ' QUALIFIES'), cx, y + h - S(36), S(28), P.sky, { thin: true });
    return h;
  };
  Home.drawEvo = function (ui, ctx, g, W0, H) {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, T0, cx, HH } = F, S = UI.S, now = performance.now(), RC = api.R, SV = E.save(g);
    if (W0 > H * 1.1) { const u2 = Math.min(W0, HH * 0.74); UI.begin(u2, ui.pixelRatio ? ui.pixelRatio() : 1); F.cw = u2; }   // sur un ecran large, l'interface est plus grande (elle n'etait qu'une etroite colonne)
    const cw = F.cw; R.begin(); if (/[?&]uikit=1/.test(location.search)) { UI.begin(Math.min(W0, H * 1.78) * 0.56, g.hudPr || 1); R.sheet(ctx, ui, W0, H); return; }
    const navH = S(150), navTop = T0 + HH - navH;
    // contenu de l'onglet
    if (M.tab === 'jouer') {
      const keys = api.mapKeys(), cm = api.curMap(), pw = Math.min(cw * 0.84, (HH * 0.36) * 1.6), ph = pw / 1.6, px = cx - pw / 2, py = Y(0.1);   // la carte : une grande photo, son nom, des fleches rondes pour en changer
      photo(ctx, S, cm, px, py, pw, ph, S(34), { shade: true });
      R.tag(ctx, px + S(120), py + S(6), 'CARTE ' + RC.round + ' / 3', { px: S(24) });
      const nmm = E.mapName ? E.mapName(cm) : cm.toUpperCase(); R.text(ctx, nmm, cx, py + ph - S(52), R.fit(ctx, nmm, pw * 0.8, S(78)), P.white);
      for (const sg of [-1, 1]) R.round(ctx, ui, sg < 0 ? px - S(6) : px + pw + S(6), py + ph / 2, S(42), sg < 0 ? 'left' : 'right', { role: 'primary' }, () => { const i = keys.indexOf(cm); api.setMap(keys[(i + sg + keys.length) % keys.length]); });
      const ch = cupCard(ui, ctx, g, F, S, py + ph + S(34));
      const bw = cw * 0.62, bh = S(150), bx = cx - bw / 2, by = Math.min(navTop - bh - S(34), py + ph + S(34) + ch + S(30));
      R.tapButton(ctx, ui, bx, by, bw, bh, 'JOUER', { role: 'primary', icon: 'play', key: 'play' }, () => api.start(g));
    } else {
      R.backdrop(ctx, 0, T0, W0, HH);
      if (M.tab === 'costumes') drawCostumes(ui, ctx, g, F, S, SV); else if (M.tab === 'boutique') drawShop(ui, ctx, g, F, S, SV); else if (M.tab === 'pouvoirs') drawPowers(ui, ctx, g, F, S, SV);
      else { R.text(ctx, 'CLASSEMENT', cx, Y(0.16), S(84), P.white); R.panel(ctx, cx - cw * 0.42, Y(0.26), cw * 0.84, S(520), { title: 'BIENTOT' }); R.icon(ctx, 'trophy', cx, Y(0.26) + S(250), S(190), { fill: P.yellow }); R.text(ctx, 'LE CLASSEMENT DES VRAIS JOUEURS ARRIVE', cx, Y(0.26) + S(420), R.fit(ctx, 'LE CLASSEMENT DES VRAIS JOUEURS ARRIVE', cw * 0.74, S(34)), P.text, { plain: true }); }
    }
    // compteurs (au-dessus de tout)
    { const ph = S(66), gap = S(16), w1 = S(250), w2 = S(210), w3 = S(180), x0 = cx - (w1 + w2 + w3 + gap * 2) / 2, y0 = T0 + S(18); R.pill(ctx, ui, x0, y0, w1, ph, 'coin', SV.coins || 0, { plus: () => { M.tab = 'boutique'; M.page = 0; } }); R.pill(ctx, ui, x0 + w1 + gap, y0, w2, ph, 'gem', SV.gems || 0, { plus: () => { M.tab = 'boutique'; M.page = 0; } }); R.pill(ctx, ui, x0 + w1 + w2 + gap * 2, y0, w3, ph, 'ticket', PRO.tickets()); }
    // barre du bas : fond marine a lisere clair, 5 onglets ; l'onglet actif est souleve et jaune
    { ctx.save(); ctx.shadowColor = 'rgba(8,16,44,0.35)'; ctx.shadowBlur = S(24); ctx.shadowOffsetY = -S(4); ctx.fillStyle = 'rgba(16,30,74,0.96)'; ctx.fillRect(0, navTop, W0, navH + 6); ctx.restore(); }
    TABS.forEach(([id, label, ic], i) => {
      const x = cx + (i - 2) * cw * 0.2, on = M.tab === id, r = S(on ? 50 : 42), yy = navTop + S(on ? 52 : 60);
      R.round(ctx, ui, x, yy, r, ic, { role: on ? 'primary' : 'secondary', key: 'tab' + id }, () => { if (id === 'jouer' && M.tab === 'jouer') api.start(g); else { M.tab = id; M.page = 0; } });
      R.text(ctx, label, x, navTop + navH - S(24), S(22), on ? P.yellow : P.sky, { thin: true });
    });
    if (M.toast && now - M.toast.t0 < 1700) { const a = U.clamp((1700 - (now - M.toast.t0)) / 300, 0, 1), tw = R.tw(ctx, M.toast.t, S(44)) + S(90); ctx.save(); ctx.globalAlpha = a; R.panel(ctx, cx - tw / 2, Y(0.46), tw, S(110), { dark: true, r: S(40) }); R.text(ctx, M.toast.t, cx, Y(0.46) + S(57), S(44), P.yellow, { thin: true }); ctx.restore(); }
  };
  const playerSkinNow = () => { const b = CC.Skins.byId[PRO.skin()]; return b || CC.Skins.byId.stock; };
  const drawCostumes = (ui, ctx, g, F, S, SV) => {
    const { Y, cw, cx } = F, rars = ['TOUS', 'COMMUN', 'RARE', 'EPIQUE'], tw = cw * 0.225, ty = Y(0.11), th = S(72);
    rars.forEach((nm, i) => { const x = cx + (i - 1.5) * (tw + S(8)) - tw / 2, on = M.rar === i; R.tapButton(ctx, ui, x, ty, tw, th, nm, { role: on ? 'primary' : 'secondary', key: 'rar' + i }, () => { M.rar = i; M.page = 0; }); });
    const ids = PRO.SKIN_IDS.filter((id) => M.rar === 0 || PRO.rarity(id) === M.rar - 1), per = 6, pages = Math.max(1, Math.ceil(ids.length / per)); M.page = U.clamp(M.page, 0, pages - 1);
    const cwid = cw * 0.295, chei = S(316), gx = cx - (cwid * 3 + S(24)) / 2, gy = ty + th + S(26), sel = PRO.skin();
    ids.slice(M.page * per, M.page * per + per).forEach((id, k) => {
      const x = gx + (k % 3) * (cwid + S(12)), y = gy + Math.floor(k / 3) * (chei + S(14)), own = PRO.isOwned(id), on = sel === id, sk = CC.Skins.byId[id], rc = RARC[PRO.rarity(id)];
      R.panel(ctx, x, y, cwid, chei, { dark: !own, r: S(28) });
      if (on) { ctx.save(); R.rr(ctx, x, y, cwid, chei, S(28)); ctx.lineWidth = S(6); ctx.strokeStyle = P.yellow; ctx.stroke(); ctx.restore(); }
      ctx.save(); R.rr(ctx, x + S(16), y + S(16), cwid - S(32), chei * 0.52, S(18)); ctx.fillStyle = own ? P.sky : 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.restore();
      ctx.save(); if (!own) ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.rect(x + S(16), y + S(16), cwid - S(32), chei * 0.52); ctx.clip(); PRO.icon(ctx, x + cwid / 2, y + S(16) + chei * 0.29, cwid * 0.58, sk, -Math.PI / 4); ctx.restore();
      R.tag(ctx, x + cwid / 2, y + S(34), rc[0], { px: S(17), color: rc[1], text: P.white });
      const nm = (sk.short || sk.name || id).toUpperCase(); R.text(ctx, nm, x + cwid / 2, y + chei * 0.7, R.fit(ctx, nm, cwid * 0.86, S(30)), own ? P.text : P.white, { plain: true });
      const bw = cwid - S(36), bh = S(58), bx = x + S(18), by = y + chei - bh - S(18), act = () => {
        if (own) { PRO.setSkin(id); try { g.rocket.setSkin(playerSkinNow()); } catch (e) { /* apercu */ } return; }
        const c = SV.coins || 0, p = PRO.price(id); if (c >= p) { SV.coins = c - p; PRO.own(id); PRO.setSkin(id); try { g.writeSave(); g.rocket.setSkin(playerSkinNow()); } catch (e) { /* ignore */ } toast('COSTUME OBTENU !'); } else toast('PAS ASSEZ DE PIECES'); };
      if (own) R.tapButton(ctx, ui, bx, by, bw, bh, on ? 'CHOISI' : 'CHOISIR', { role: on ? 'confirm' : 'secondary', icon: on ? 'check' : null, key: 'sk' + id }, act);
      else { const st = R.tapButton(ctx, ui, bx, by, bw, bh, '      ' + PRO.price(id), { role: (SV.coins || 0) >= PRO.price(id) ? 'primary' : 'disabled', key: 'sk' + id }, act); UI.icon(ctx, 'coin', bx + bw * 0.26, by + bh * 0.42 + st.p * bh * 0.1, bh * 0.74); if ((SV.coins || 0) < PRO.price(id)) UI.tap(ui, bx, by, bw, bh, act); }
    });
    const by2 = gy + chei * 2 + S(34);
    if (pages > 1) { R.round(ctx, ui, cx - S(170), by2 + S(40), S(38), 'left', { role: 'secondary', key: 'pgl' }, () => { M.page = (M.page + pages - 1) % pages; }); R.round(ctx, ui, cx + S(170), by2 + S(40), S(38), 'right', { role: 'secondary', key: 'pgr' }, () => { M.page = (M.page + 1) % pages; }); R.text(ctx, (M.page + 1) + ' / ' + pages, cx, by2 + S(42), S(40), P.white, { thin: true }); }
    const ty2 = by2 + S(120); R.text(ctx, 'TRAINEE', cx - cw * 0.44, ty2, S(30), P.white, { align: 'left', thin: true });
    const tr = PRO.trail(); PRO.TRAILS.forEach((c, i) => { const x = cx - cw * 0.2 + i * S(60), on = tr === c, rr0 = S(on ? 25 : 20); if (on) { ctx.beginPath(); ctx.arc(x, ty2, rr0 + S(6), 0, 6.283); ctx.fillStyle = P.white; ctx.fill(); } ctx.beginPath(); ctx.arc(x, ty2, rr0, 0, 6.283); ctx.fillStyle = c || P.greyD; ctx.fill(); if (!c) R.icon(ctx, 'close', x, ty2, rr0 * 1.1, { fill: P.white, ink: null }); UI.tap(ui, x - S(30), ty2 - S(30), S(60), S(60), () => { PRO.setTrail(c); }); });
  };
  const drawShop = (ui, ctx, g, F, S, SV) => {
    const { Y, cw, cx } = F; R.text(ctx, 'BOUTIQUE', cx, Y(0.145), S(84), P.white);
    const rows = [
      ['2 GEMMES GRATUITES', 'REGARDE UNE PUB', 'REGARDER', 'video', 'gem', () => { const ok = () => { SV.gems = (SV.gems || 0) + 2; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+2 GEMMES'); }; if (g.ads && g.ads.rewarded) g.ads.rewarded(ok, null, 'shop', 'GEMMES'); else ok(); }, false, 'confirm'],
      ['400 PIECES', 'CONTRE 5 GEMMES', 'ECHANGER', null, 'coin', () => { if ((SV.gems || 0) >= 5) { SV.gems -= 5; SV.coins = (SV.coins || 0) + 400; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+400 PIECES'); } else toast('PAS ASSEZ DE GEMMES'); }, (SV.gems || 0) < 5, 'primary'],
      ['2000 PIECES', 'CONTRE 20 GEMMES', 'ECHANGER', null, 'coins_stack', () => { if ((SV.gems || 0) >= 20) { SV.gems -= 20; SV.coins = (SV.coins || 0) + 2000; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+2000 PIECES'); } else toast('PAS ASSEZ DE GEMMES'); }, (SV.gems || 0) < 20, 'primary'],
      ['5 GEMMES', 'CONTRE 1500 PIECES', 'ECHANGER', null, 'gems_rope', () => { if ((SV.coins || 0) >= 1500) { SV.coins -= 1500; SV.gems = (SV.gems || 0) + 5; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+5 GEMMES'); } else toast('PAS ASSEZ DE PIECES'); }, (SV.coins || 0) < 1500, 'primary'],
    ];
    rows.forEach((r, i) => { const hh = S(176), y = Y(0.21) + i * (hh + S(18)), w = cw * 0.94, x = cx - w / 2; R.panel(ctx, x, y, w, hh, { r: S(30) });
      ctx.save(); R.rr(ctx, x + S(18), y + S(18), hh - S(36), hh - S(36), S(20)); ctx.fillStyle = P.sky; ctx.fill(); ctx.restore(); if (!UI.icon(ctx, r[4], x + hh / 2, y + hh / 2, hh * 0.66)) R.icon(ctx, 'coin', x + hh / 2, y + hh / 2, hh * 0.5, { fill: P.yellow });
      R.text(ctx, r[0], x + hh + S(10), y + hh * 0.36, R.fit(ctx, r[0], w * 0.42, S(42)), P.text, { align: 'left', plain: true }); R.text(ctx, r[1], x + hh + S(10), y + hh * 0.66, R.fit(ctx, r[1], w * 0.42, S(26)), P.dim, { align: 'left', plain: true });
      const bw = w * 0.32, bh = S(100), bx = x + w - bw - S(24); R.tapButton(ctx, ui, bx, y + (hh - bh) / 2 - S(4), bw, bh, r[2], { role: r[7], icon: r[3], disabled: r[6], key: 'shop' + i }, r[5]); if (r[6]) UI.tap(ui, bx, y + (hh - bh) / 2, bw, bh, r[5]); });
    R.text(ctx, 'AUCUN ACHAT EN ARGENT REEL', cx, Y(0.21) + 4 * S(194) + S(26), S(26), P.sky, { thin: true });
  };
  const drawPowers = (ui, ctx, g, F, S, SV) => {
    const { Y, cw, cx } = F; R.text(ctx, 'POUVOIRS', cx, Y(0.145), S(84), P.white); R.text(ctx, 'RAMASSE LES BLOCS CHANCE EN COURSE', cx, Y(0.195), S(28), P.sky, { thin: true });
    const lv = PRO.pw();
    POW.forEach(([id, desc, col, ic], i) => {
      const hh = S(230), y = Y(0.235) + i * (hh + S(20)), w = cw * 0.94, x = cx - w / 2, L = lv[id], cost = 300 * L, max = L >= 5, can = (SV.coins || 0) >= cost;
      R.panel(ctx, x, y, w, hh, { r: S(30) }); const cr = S(70), ccx = x + S(40) + cr, ccy = y + hh / 2; ctx.beginPath(); ctx.arc(ccx, ccy, cr, 0, 6.283); ctx.fillStyle = col; ctx.fill(); R.icon(ctx, ic, ccx, ccy, cr * 1.15, { fill: P.white });
      const tx = ccx + cr + S(30); R.text(ctx, id, tx, y + S(58), S(46), P.text, { align: 'left', plain: true }); R.text(ctx, desc, tx, y + S(104), R.fit(ctx, desc, w * 0.4, S(24)), P.dim, { align: 'left', plain: true });
      for (let k = 0; k < 5; k++) { const sx = tx + k * S(46), sy = y + S(150); R.rr(ctx, sx, sy, S(38), S(18), S(9)); ctx.fillStyle = k < L ? col : P.paperD; ctx.fill(); }
      R.text(ctx, 'NIVEAU ' + L, tx + S(250), y + S(164), S(24), P.dim, { align: 'left', plain: true });
      const bw = w * 0.27, bh = S(104), bx = x + w - bw - S(24), by = y + (hh - bh) / 2 - S(4), act = () => { if (max) return; if ((SV.coins || 0) >= cost) { SV.coins -= cost; lv[id] = L + 1; PRO.setPw(lv); try { g.writeSave(); } catch (e) { /* ignore */ } toast(id + ' NIVEAU ' + (L + 1)); } else toast('PAS ASSEZ DE PIECES'); };
      if (max) R.button(ctx, ui, bx, by, bw, bh, 'MAX', { role: 'confirm', icon: 'check', key: 'pw' + i }); else { const st = R.tapButton(ctx, ui, bx, by, bw, bh, '     ' + cost, { role: can ? 'primary' : 'disabled', key: 'pw' + i }, act); UI.icon(ctx, 'coin', bx + bw * 0.24, by + bh * 0.42 + st.p * bh * 0.1, bh * 0.6); if (!can) UI.tap(ui, bx, by, bw, bh, act); }
    });
  };
})();
