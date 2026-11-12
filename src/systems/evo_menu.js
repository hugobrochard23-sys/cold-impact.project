/* v369 : LE VRAI MENU de la course (?mvp=r), dans l'esprit des jeux de toboggan en ligne :
 * compteurs en haut (pieces, gemmes, billets), barre de 5 onglets en bas (boutique, costumes, JOUER au centre, pouvoirs, classement),
 * accueil = nom de la map (roulette), carte de la Coupe (3 manches + paquet), costumes par rarete avec couleur de traînee, boutique (gemmes <-> pieces, jamais d'argent reel),
 * pouvoirs a ameliorer. Tout est sauvegarde en local. Aucun faux classement. */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mvp || E.mvp() !== 'r' || !E.race || !E.raceApi) return;
  const Home = CC.Home, UI = CC.UI2, U = CC.U, PRO = E.race, api = E.raceApi;
  const M = { tab: 'jouer', rar: 0, page: 0, spin0: performance.now(), sess: -1, toast: null };
  const toast = (t) => { M.toast = { t, t0: performance.now() }; };
  const POW = [['TURBO', 'VITESSE EN PLUS', '#7CFF6A'], ['BOUCLIER', 'TRAVERSE LES OBSTACLES', '#5ad2ff'], ['MISSILE', 'FAIT EXPLOSER LE PILOTE DEVANT', '#FF8A3A']];
  const TABS = [['boutique', 'BOUTIQUE'], ['costumes', 'COSTUMES'], ['jouer', 'JOUER'], ['pouvoirs', 'POUVOIRS'], ['classement', 'CLASSEMENT']];
  const pill = (ctx, S, x, y, w, h, icon, val, col) => {   // un compteur : pastille sombre, icone, valeur
    UI.rrect(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(20,24,52,0.78)'; ctx.fill(); ctx.lineWidth = S(3); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
    if (icon === 'ticket') { ctx.save(); ctx.translate(x + h / 2, y + h / 2); ctx.rotate(-0.4); ctx.fillStyle = '#2fd2ff'; UI.rrect(ctx, -h * 0.3, -h * 0.2, h * 0.6, h * 0.4, h * 0.08); ctx.fill(); ctx.restore(); } else UI.icon(ctx, icon, x + h / 2, y + h / 2, h * 0.86);
    UI.text(ctx, String(val), x + h + (w - h) / 2 - S(8), y + h / 2, UI.fit(ctx, String(val), w - h - S(20), S(40)), col || '#ffffff', { shadow: false });
  };
  const navIcon = (ctx, id, x, y, r, on, S, g) => {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = on ? '#ffffff' : '#e8dcff'; ctx.strokeStyle = '#5a2cc8'; ctx.lineWidth = S(3);
    if (id === 'boutique') { ctx.fillRect(-r * 0.5, -r * 0.1, r, r * 0.6); ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.moveTo(-r * 0.62, -r * 0.1); ctx.lineTo(-r * 0.4, -r * 0.55); ctx.lineTo(r * 0.4, -r * 0.55); ctx.lineTo(r * 0.62, -r * 0.1); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5a2cc8'; ctx.fillRect(-r * 0.12, r * 0.12, r * 0.24, r * 0.38); }
    else if (id === 'costumes') { PRO.icon(ctx, 0, 0, r * 2.2, CC.Skins.byId[PRO.skin()] || CC.Skins.byId.stock, -Math.PI / 4); }
    else if (id === 'jouer') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.5); ctx.lineTo(r * 0.55, 0); ctx.lineTo(-r * 0.3, r * 0.5); ctx.closePath(); ctx.fill(); }
    else if (id === 'pouvoirs') { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.6); ctx.lineTo(-r * 0.4, r * 0.1); ctx.lineTo(-r * 0.02, r * 0.1); ctx.lineTo(-r * 0.15, r * 0.6); ctx.lineTo(r * 0.4, -r * 0.15); ctx.lineTo(r * 0.02, -r * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = '#c9c9d6'; UI.rrect(ctx, -r * 0.4, -r * 0.1, r * 0.8, r * 0.6, r * 0.1); ctx.fill(); ctx.lineWidth = S(6); ctx.strokeStyle = '#c9c9d6'; ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.25, Math.PI, 0); ctx.stroke(); }
    ctx.restore();
  };
  const panelBg = (ctx, W0, y0, y1) => {   // le fond violet a damier des ecrans de menu
    const gr = ctx.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#b78cff'); gr.addColorStop(1, '#8a4ff0'); ctx.fillStyle = gr; ctx.fillRect(0, y0, W0, y1 - y0);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W0, y1 - y0); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.09)'; const q = (y1 - y0) / 7;
    for (let i = -1; i < W0 / q + 2; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) ctx.fillRect(i * q + (j % 2) * 0, y0 + j * q, q, q);
    ctx.restore();
  };
  const cupCard = (ctx, g, F, S) => {   // la carte de la Coupe : 3 manches + le paquet
    const { Y, cw, cx } = F, R = api.R, y = Y(0.60), h = S(250), w = cw * 0.92, x = cx - w / 2;
    UI.rrect(ctx, x, y, w, h, S(34)); ctx.fillStyle = 'rgba(24,18,70,0.86)'; ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = '#ffd23a'; ctx.stroke();
    UI.text(ctx, 'COUPE COLD IMPACT', cx, y + S(38), S(50), '#FFD23A', { outline: true });
    const names = R.courses.map((c) => c.name), seg = (w - S(60)) / 4;
    for (let k = 0; k < 4; k++) {
      const sx = x + S(30) + k * seg, sy = y + S(80), sw = seg - S(12), sh = S(110), isPack = k === 3, cur = k === R.round - 1 && !isPack, done = k < R.round - 1;
      UI.rrect(ctx, sx, sy, sw, sh, S(20)); ctx.fillStyle = isPack ? '#7a3cf0' : cur ? '#2f8cff' : done ? '#2fae22' : 'rgba(255,255,255,0.12)'; ctx.fill(); if (cur) { ctx.lineWidth = S(6); ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
      if (isPack) { UI.text(ctx, '?', sx + sw / 2, sy + sh * 0.42, S(70), '#ffffff', { outline: true }); UI.text(ctx, 'PAQUET', sx + sw / 2, sy + sh * 0.82, S(26), '#ffffff', { shadow: false }); }
      else { const mp = R.courses[k] && E.mapPoster ? E.mapPoster(R.courses[k].map || 'arch') : null; if (mp) { ctx.save(); UI.rrect(ctx, sx, sy, sw, sh, S(20)); ctx.clip(); ctx.drawImage(mp, sx, sy, sw, sh); ctx.fillStyle = 'rgba(8,10,28,' + (done ? 0.62 : cur ? 0.18 : 0.42) + ')'; ctx.fillRect(sx, sy, sw, sh); ctx.restore(); UI.rrect(ctx, sx, sy, sw, sh, S(20)); if (cur) { ctx.lineWidth = S(6); ctx.strokeStyle = '#ffffff'; ctx.stroke(); } }
        UI.text(ctx, String(k + 1), sx + sw / 2, sy + sh * 0.3, S(50), '#ffffff', { outline: true }); UI.text(ctx, done ? 'FAIT' : [32, 16, 8][k] + ' PILOTES', sx + sw / 2, sy + sh * 0.78, S(24), '#ffffff', { outline: true }); }
    }
    UI.text(ctx, 'MANCHE ' + R.round + ' / 3  -  ' + R.field[R.round - 1] + ' PILOTES', cx, y + h - S(34), S(34), '#dfe6f0', { shadow: false });
  };
  Home.drawEvo = function (ui, ctx, g, W0, H) {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, T0, cw, cx, HH } = F, S = UI.S, now = performance.now(), R = api.R, SV = E.save(g);
    if (M.sess !== R.session) { M.sess = R.session; M.spin0 = now; }
    // compteurs
    { const pw = cw * 0.3, ph = S(64), gap = S(14), x0 = cx - (pw * 3 + gap * 2) / 2, y0 = Y(0.012); pill(ctx, S, x0, y0, pw, ph, 'coin', SV.coins || 0); pill(ctx, S, x0 + pw + gap, y0, pw, ph, 'gem', SV.gems || 0); pill(ctx, S, x0 + (pw + gap) * 2, y0, pw, ph, 'ticket', PRO.tickets()); }
    const navY = Y(0.935), navH = HH * 0.13;
    // contenu de l'onglet
    if (M.tab === 'jouer') {
      const spinning = now - M.spin0 < 1500, nm = spinning ? R.courses[Math.floor((now - M.spin0) / 90) % R.courses.length].name : R.courses[R.round - 1].name;
      UI.text(ctx, 'MAP', cx, Y(0.115), S(34), '#ffffff', { outline: true }); UI.text(ctx, nm, cx, Y(0.17), UI.fit(ctx, nm, cw * 0.8, S(96)), spinning ? '#ffffff' : '#FFD23A', { outline: true });
      cupCard(ctx, g, F, S);
      const bw = cw * 0.56, bh = S(130), bx = cx - bw / 2, by = Y(0.80), pulse = 1 + 0.03 * Math.sin(now / 200);
      ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'JOUER'); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => api.start(g));
    } else {
      panelBg(ctx, W0, Y(0.085), navY - navH * 0.55);
      if (M.tab === 'costumes') drawCostumes(ui, ctx, g, F, S, SV); else if (M.tab === 'boutique') drawShop(ui, ctx, g, F, S, SV); else if (M.tab === 'pouvoirs') drawPowers(ui, ctx, g, F, S, SV);
      else { UI.text(ctx, 'CLASSEMENT', cx, Y(0.2), S(80), '#ffffff', { outline: true }); ctx.save(); ctx.translate(cx, Y(0.42)); ctx.fillStyle = '#d6d6e6'; UI.rrect(ctx, -S(90), -S(30), S(180), S(150), S(24)); ctx.fill(); ctx.lineWidth = S(26); ctx.strokeStyle = '#d6d6e6'; ctx.beginPath(); ctx.arc(0, -S(30), S(60), Math.PI, 0); ctx.stroke(); ctx.restore(); UI.text(ctx, 'BIENTOT', cx, Y(0.6), S(70), '#FFD23A', { outline: true }); UI.text(ctx, 'LE VRAI CLASSEMENT DES JOUEURS', cx, Y(0.67), UI.fit(ctx, 'LE VRAI CLASSEMENT DES JOUEURS', cw * 0.9, S(36)), '#ffffff', { shadow: false }); UI.text(ctx, 'ARRIVERA AVEC LA PLATEFORME', cx, Y(0.715), UI.fit(ctx, 'ARRIVERA AVEC LA PLATEFORME', cw * 0.9, S(36)), '#ffffff', { shadow: false }); }
    }
    // barre du bas
    ctx.fillStyle = '#7a3cf0'; ctx.fillRect(0, navY - navH * 0.55, W0, HH + T0 - (navY - navH * 0.55) + 4); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, navY - navH * 0.55, W0, S(5));
    TABS.forEach(([id, label], i) => {
      const x = cx + (i - 2) * cw * 0.2, on = M.tab === id, big = id === 'jouer', r = S(big ? 62 : 46);
      if (on && !big) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x - cw * 0.1, navY - navH * 0.55, cw * 0.2, navH * 1.4); }
      ctx.beginPath(); ctx.arc(x, navY - (big ? S(14) : 0), r, 0, 6.283); ctx.fillStyle = big ? '#6bd424' : on ? '#9a62ff' : '#5a2cc8'; ctx.fill(); ctx.lineWidth = S(5); ctx.strokeStyle = big ? '#2e8a10' : '#3a1a98'; ctx.stroke();
      navIcon(ctx, id, x, navY - (big ? S(14) : 0), r * 0.78, on, S, g);
      UI.text(ctx, label, x, navY + r + S(big ? 10 : 26), S(22), on ? '#ffffff' : '#d8c8ff', { shadow: false });
      UI.tap(ui, x - cw * 0.095, navY - r - S(10), cw * 0.19, r * 2 + S(60), () => { if (id === 'jouer' && M.tab === 'jouer') api.start(g); else { M.tab = id; M.page = 0; } });
    });
    if (M.toast && now - M.toast.t0 < 1700) UI.text(ctx, M.toast.t, cx, Y(0.5), S(54), '#ffffff', { outline: true });
  };
  const drawCostumes = (ui, ctx, g, F, S, SV) => {
    const { Y, cw, cx } = F, rars = ['TOUS', 'COMMUN', 'RARE', 'EPIQUE'], tw = cw * 0.22, ty = Y(0.105), th = S(58);
    rars.forEach((nm, i) => { const x = cx + (i - 1.5) * (tw + S(6)) - tw / 2, on = M.rar === i; UI.rrect(ctx, x, ty, tw, th, S(16)); ctx.fillStyle = on ? '#ffffff' : '#6a30d8'; ctx.fill(); UI.text(ctx, nm, x + tw / 2, ty + th / 2, S(26), on ? '#5a2cc8' : '#ffffff', { shadow: false }); UI.tap(ui, x, ty, tw, th, () => { M.rar = i; M.page = 0; }); });
    const ids = PRO.SKIN_IDS.filter((id) => M.rar === 0 || PRO.rarity(id) === M.rar - 1), per = 6, pages = Math.max(1, Math.ceil(ids.length / per)); M.page = U.clamp(M.page, 0, pages - 1);
    const cwid = cw * 0.29, chei = S(300), gx = cx - (cwid * 3 + S(20)) / 2, gy = Y(0.2), sel = PRO.skin();
    ids.slice(M.page * per, M.page * per + per).forEach((id, k) => {
      const x = gx + (k % 3) * (cwid + S(10)), y = gy + Math.floor(k / 3) * (chei + S(12)), own = PRO.isOwned(id), on = sel === id, sk = CC.Skins.byId[id], col = ['#8a96a6', '#3a8cff', '#c04cf0'][PRO.rarity(id)];
      UI.rrect(ctx, x, y, cwid, chei, S(26)); const gr = ctx.createLinearGradient(0, y, 0, y + chei); gr.addColorStop(0, own ? '#64d62c' : '#6a6e82'); gr.addColorStop(1, own ? '#2f9a10' : '#3c4052'); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = S(on ? 8 : 4); ctx.strokeStyle = on ? '#ffffff' : col; ctx.stroke();
      ctx.save(); if (!own) ctx.globalAlpha = 0.55; PRO.icon(ctx, x + cwid / 2, y + chei * 0.42, cwid * 0.86, sk, -Math.PI / 4); ctx.restore();
      UI.text(ctx, (sk.short || sk.name || id).toUpperCase(), x + cwid / 2, y + chei * 0.78, UI.fit(ctx, (sk.short || sk.name || id).toUpperCase(), cwid * 0.86, S(30)), '#ffffff', { shadow: false });
      if (own) { if (on) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + cwid - S(26), y + S(26), S(20), 0, 6.283); ctx.fill(); UI.text(ctx, 'V', x + cwid - S(26), y + S(27), S(28), '#2f9a10', { shadow: false }); } UI.text(ctx, on ? 'CHOISI' : 'CHOISIR', x + cwid / 2, y + chei * 0.91, S(24), '#ffffff', { shadow: false }); }
      else { UI.icon(ctx, 'coin', x + cwid * 0.34, y + chei * 0.91, S(34)); UI.text(ctx, String(PRO.price(id)), x + cwid * 0.58, y + chei * 0.91, S(28), '#FFD23A', { shadow: false }); }
      UI.tap(ui, x, y, cwid, chei, () => {
        if (own) { PRO.setSkin(id); try { g.rocket.setSkin(playerSkinNow()); } catch (e) { /* aperçu */ } return; }
        const c = SV.coins || 0, p = PRO.price(id); if (c >= p) { SV.coins = c - p; PRO.own(id); PRO.setSkin(id); try { g.writeSave(); g.rocket.setSkin(playerSkinNow()); } catch (e) { /* ignore */ } toast('COSTUME OBTENU !'); } else toast('PAS ASSEZ DE PIECES');
      });
    });
    const by = Y(0.2) + chei * 2 + S(26);
    if (pages > 1) { UI.btnSecondary(ctx, cx - cw * 0.46, by, cw * 0.2, S(70), '<'); UI.tap(ui, cx - cw * 0.46, by, cw * 0.2, S(70), () => { M.page = (M.page + pages - 1) % pages; }); UI.btnSecondary(ctx, cx + cw * 0.26, by, cw * 0.2, S(70), '>'); UI.tap(ui, cx + cw * 0.26, by, cw * 0.2, S(70), () => { M.page = (M.page + 1) % pages; }); UI.text(ctx, (M.page + 1) + ' / ' + pages, cx, by + S(35), S(34), '#ffffff', { shadow: false }); }
    UI.text(ctx, 'TRAINEE', cx - cw * 0.38, by + S(118), S(30), '#ffffff', { align: 'left', shadow: false });
    const tr = PRO.trail(); PRO.TRAILS.forEach((c, i) => { const x = cx - cw * 0.2 + i * S(52) - S(8), yy = by + S(118), on = tr === c; ctx.beginPath(); ctx.arc(x, yy, S(on ? 22 : 18), 0, 6.283); ctx.fillStyle = c || '#555566'; ctx.fill(); ctx.lineWidth = S(on ? 6 : 3); ctx.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.4)'; ctx.stroke(); if (!c) UI.text(ctx, 'X', x, yy, S(20), '#ffffff', { shadow: false }); UI.tap(ui, x - S(26), yy - S(26), S(52), S(52), () => { PRO.setTrail(c); }); });
  };
  const playerSkinNow = () => { const b = CC.Skins.byId[PRO.skin()]; return b || CC.Skins.byId.stock; };
  const drawShop = (ui, ctx, g, F, S, SV) => {
    const { Y, cw, cx } = F; UI.text(ctx, 'BOUTIQUE', cx, Y(0.13), S(80), '#ffffff', { outline: true });
    const rows = [
      ['PUB : 2 GEMMES GRATUITES', 'REGARDER', () => { const ok = () => { SV.gems = (SV.gems || 0) + 2; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+2 GEMMES'); }; if (g.ads && g.ads.rewarded) g.ads.rewarded(ok, null, 'shop', 'GEMMES'); else ok(); }, false],
      ['5 GEMMES = 400 PIECES', 'ECHANGER', () => { if ((SV.gems || 0) >= 5) { SV.gems -= 5; SV.coins = (SV.coins || 0) + 400; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+400 PIECES'); } else toast('PAS ASSEZ DE GEMMES'); }, (SV.gems || 0) < 5],
      ['20 GEMMES = 2000 PIECES', 'ECHANGER', () => { if ((SV.gems || 0) >= 20) { SV.gems -= 20; SV.coins = (SV.coins || 0) + 2000; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+2000 PIECES'); } else toast('PAS ASSEZ DE GEMMES'); }, (SV.gems || 0) < 20],
      ['1500 PIECES = 5 GEMMES', 'ECHANGER', () => { if ((SV.coins || 0) >= 1500) { SV.coins -= 1500; SV.gems = (SV.gems || 0) + 5; try { g.writeSave(); } catch (e) { /* ignore */ } toast('+5 GEMMES'); } else toast('PAS ASSEZ DE PIECES'); }, (SV.coins || 0) < 1500],
    ];
    rows.forEach((r, i) => { const y = Y(0.2) + i * S(190), w = cw * 0.92, x = cx - w / 2; UI.rrect(ctx, x, y, w, S(160), S(28)); ctx.fillStyle = 'rgba(24,18,70,0.55)'; ctx.fill(); UI.text(ctx, r[0], x + S(30), y + S(80), UI.fit(ctx, r[0], w * 0.5, S(36)), '#ffffff', { align: 'left', shadow: false });
      const bw = w * 0.34, bx = x + w - bw - S(24); UI.btnPrimary(ctx, bx, y + S(28), bw, S(104), r[1], { disabled: r[3] }); UI.tap(ui, bx, y + S(28), bw, S(104), r[2]); });
    UI.text(ctx, 'AUCUN ACHAT EN ARGENT REEL', cx, Y(0.2) + 4 * S(190) + S(20), S(28), '#e8dcff', { shadow: false });
  };
  const drawPowers = (ui, ctx, g, F, S, SV) => {
    const { Y, cw, cx } = F; UI.text(ctx, 'POUVOIRS', cx, Y(0.13), S(80), '#ffffff', { outline: true }); UI.text(ctx, 'RAMASSE LES BLOCS CHANCE EN COURSE', cx, Y(0.18), S(30), '#e8dcff', { shadow: false });
    const lv = PRO.pw();
    POW.forEach(([id, desc, col], i) => {
      const y = Y(0.23) + i * S(250), w = cw * 0.92, x = cx - w / 2, L = lv[id], cost = 300 * L;
      UI.rrect(ctx, x, y, w, S(220), S(28)); ctx.fillStyle = 'rgba(24,18,70,0.55)'; ctx.fill(); ctx.beginPath(); ctx.arc(x + S(84), y + S(110), S(54), 0, 6.283); ctx.fillStyle = col; ctx.fill();
      UI.text(ctx, id, x + S(170), y + S(52), S(48), '#ffffff', { align: 'left', outline: true }); UI.text(ctx, desc, x + S(170), y + S(100), UI.fit(ctx, desc, w * 0.6, S(26)), '#e8dcff', { align: 'left', shadow: false });
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + S(190) + k * S(40), y + S(150), S(13), 0, 6.283); ctx.fillStyle = k < L ? col : 'rgba(255,255,255,0.2)'; ctx.fill(); }
      const bw = w * 0.3, bx = x + w - bw - S(20), max = L >= 5; UI.btnPrimary(ctx, bx, y + S(60), bw, S(100), max ? 'MAX' : String(cost), { disabled: max || (SV.coins || 0) < cost }); UI.tap(ui, bx, y + S(60), bw, S(100), () => { if (max) return; if ((SV.coins || 0) >= cost) { SV.coins -= cost; lv[id] = L + 1; PRO.setPw(lv); try { g.writeSave(); } catch (e) { /* ignore */ } toast(id + ' NIVEAU ' + (L + 1)); } else toast('PAS ASSEZ DE PIECES'); });
    });
  };
})();
