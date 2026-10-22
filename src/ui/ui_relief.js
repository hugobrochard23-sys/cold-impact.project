/* v229 : RELIEF EN COUCHES des composants du menu (cartes blanches, compteurs or et bleu, boutons AMELIORER colores, supports sombres).
 * Chaque composant empile : ombre portee douce -> contour exterieur 2 px -> liseré clair 1 px (haut et cotes) -> surface en degrade vertical -> fin contour interieur ->
 * reflet etroit en haut -> ombre interieure en bas. Lumiere venant du haut. Tout est dessine au canvas ; les icones et les donnees restent celles du jeu. */
(function () {
  const UI = CC.UI2; if (!UI) return;
  const C = UI.C, S = UI.S;
  const P = (n) => Math.max(1, n * (UI.hudPr || 1));   // « pixels ecran » : les epaisseurs de la consigne sont exprimees en px reels
  const rr = (ctx, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const vg = (ctx, y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c)); return g; };
  UI.P = P; UI.rrect = rr;
  /* o : { top, mid, bot (degrade), outline, rim, shadow (alpha), shadowCol, hi (reflet 0..1), inner (ombre interieure 0..1), bw (px contour) } */
  UI.relief = (ctx, x, y, w, h, r, o) => {
    o = o || {}; const bw = P(o.bw || 2), off = P(3), blur = P(4), a = o.shadow === undefined ? 0.22 : o.shadow;
    ctx.save(); ctx.shadowColor = (o.shadowCol || 'rgba(0,0,0,') + a + ')'; ctx.shadowBlur = blur; ctx.shadowOffsetY = off; rr(ctx, x, y, w, h, r); ctx.fillStyle = o.outline || '#06468F'; ctx.fill(); ctx.restore();   // (1)(2)
    rr(ctx, x, y, w, h, r); ctx.fillStyle = o.outline || '#06468F'; ctx.fill();
    const x2 = x + bw, y2 = y + bw, w2 = w - 2 * bw, h2 = h - 2 * bw, r2 = Math.max(1, r - bw);
    rr(ctx, x2, y2, w2, h2, r2); ctx.fillStyle = vg(ctx, y2, y2 + h2, o.mid ? [o.top, o.mid, o.bot] : [o.top, o.bot]); ctx.fill();                       // (4)
    ctx.save(); rr(ctx, x2, y2, w2, h2, r2); ctx.clip();
    if (o.rim) { ctx.strokeStyle = o.rim; ctx.lineWidth = P(1); ctx.globalAlpha = 0.9; rr(ctx, x2 + P(0.5), y2 + P(0.5), w2 - P(1), h2 - P(1), Math.max(1, r2 - P(0.5))); ctx.save(); ctx.beginPath(); ctx.rect(x2, y2, w2, h2 * 0.62); ctx.clip(); rr(ctx, x2 + P(0.5), y2 + P(0.5), w2 - P(1), h2 - P(1), Math.max(1, r2 - P(0.5))); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; }   // (3)
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = P(1); rr(ctx, x2 + P(1.5), y2 + P(1.5), w2 - P(3), h2 - P(3), Math.max(1, r2 - P(1.5))); ctx.stroke();   // (5)
    const hi = o.hi === undefined ? 0.2 : o.hi; if (hi > 0) { const hh = Math.min(h2 * 0.3, P(10)); ctx.fillStyle = 'rgba(255,255,255,' + hi + ')'; rr(ctx, x2 + w2 * 0.06, y2 + P(1.5), w2 * 0.88, hh, hh / 2); ctx.fill(); }   // (6)
    const inn = o.inner === undefined ? 0.2 : o.inner; if (inn > 0) { const g = ctx.createLinearGradient(0, y2 + h2 - P(7), 0, y2 + h2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + inn + ')'); ctx.fillStyle = g; ctx.fillRect(x2, y2 + h2 - P(7), w2, P(7)); }   // (7)
    ctx.restore();
    return { x: x2, y: y2, w: w2, h: h2, r: r2 };
  };
  // texte avec ombre courte (1 px) et, au choix, contour
  UI.shText = (ctx, s, x, y, px, fill, o) => {
    o = o || {}; ctx.save(); UI.setFont(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.stroke) { ctx.lineWidth = P(o.sw || 4); ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y + P(1)); }
    if (o.shadow !== false) { ctx.fillStyle = o.shadow || 'rgba(60,30,6,0.55)'; ctx.fillText(s, x + P(0.6), y + P(1.2)); }
    ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
  };
  const DARK = { top: '#2A4560', bot: '#1B3144', outline: '#0F2233', rim: '#42647F', hi: 0.12, inner: 0.22, bw: 2 };   // support sombre (#20384C)
  UI.darkSupport = (ctx, x, y, w, h, r) => UI.relief(ctx, x, y, w, h, r, Object.assign({}, DARK, { top: '#27425A', bot: '#1A2F42' }));
  const GOLD = { top: '#FFE58A', mid: '#FFC83D', bot: '#E99A12', outline: '#B66B08', rim: '#FFF0B0', hi: 0.2, inner: 0.25, shadowCol: 'rgba(60,30,0,' };
  const BLUE = { top: '#58D5FF', mid: '#168BFF', bot: '#0756B8', outline: '#06468F', rim: '#BFEFFF', hi: 0.2, inner: 0.22, shadowCol: 'rgba(5,20,50,' };
  const GREEN = { top: '#75E985', mid: '#39C95B', bot: '#15943A', outline: '#0F8030', rim: '#B8F5C0', hi: 0.2, inner: 0.24, shadowCol: 'rgba(0,40,10,' };
  UI.REL = { GOLD, BLUE, GREEN };
  const CAT = {
    la: { btn: { top: '#75E985', mid: '#39C95B', bot: '#15943A', outline: '#0F8030', rim: '#C2F7C9', shadowCol: 'rgba(10,70,25,' }, seg: '#FF9C35', border: '#0F8030' },
    rk: { btn: { top: '#72D0FF', mid: '#2FA8FF', bot: '#0872CC', outline: '#0759A4', rim: '#C6EDFF', shadowCol: 'rgba(5,40,90,' }, seg: '#2FA8FF', border: '#0759A4' },
    cm: { btn: { top: '#FFC36B', mid: '#FF9C35', bot: '#D96B12', outline: '#B9560B', rim: '#FFE7A8', shadowCol: 'rgba(90,40,0,' }, seg: '#FFC83D', border: '#B9560B' },
  };
  UI.CAT = CAT;
  UI.plusButton = (ctx, cx, cy, r) => {
    ctx.save(); ctx.shadowColor = 'rgba(0,40,10,0.3)'; ctx.shadowBlur = P(3); ctx.shadowOffsetY = P(2); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#0F8030'; ctx.fill(); ctx.restore();
    const r2 = r - P(2); ctx.beginPath(); ctx.arc(cx, cy, r2, 0, 6.2832); ctx.fillStyle = vg(ctx, cy - r2, cy + r2, ['#75E985', '#39C95B']); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r2, 0, 6.2832); ctx.clip(); ctx.strokeStyle = 'rgba(200,255,205,0.9)'; ctx.lineWidth = P(1); ctx.beginPath(); ctx.arc(cx, cy, r2 - P(0.5), Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(cx, cy - r2 * 0.5, r2 * 0.7, r2 * 0.28, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = r * 0.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - r * 0.42, cy); ctx.lineTo(cx + r * 0.42, cy); ctx.moveTo(cx, cy - r * 0.42); ctx.lineTo(cx, cy + r * 0.42); ctx.stroke();
  };
  UI.currencyPill = (ctx, ui, x, y, w, h, kind, value, o) => {
    o = o || {}; const gem = kind === 'gem', body = x + h * 0.3, bw = w - h * 0.3;
    UI.relief(ctx, body, y, bw, h, h * 0.3, gem ? BLUE : GOLD);
    if (!UI.artImg(ctx, gem ? 'gem' : 'coin', x + h * 0.5, y + h / 2, h * 1.18)) UI.icon(ctx, gem ? 'gem' : 'coin', x + h * 0.5, y + h / 2, h * 1.2);
    UI.shText(ctx, value, x + h * 1.22, y + h * 0.5, UI.fit(ctx, value, w - h * (o.plus ? 2.8 : 1.6), h * 0.56), '#FFFFFF', { align: 'left', shadow: gem ? 'rgba(4,30,70,0.55)' : 'rgba(80,38,4,0.7)' });
    if (o.plus) UI.plusButton(ctx, x + w - h * 0.5, y + h / 2, h * 0.38);
  };
  UI.slateIconButton = (ctx, x, y, s, kind) => {
    const q = s * 0.86; x += (s - q) / 2; y += S(4); UI.relief(ctx, x, y, q, q, q * 0.2, { top: '#2B66AE', bot: '#1A4C8A', outline: '#162B3C', rim: '#42647F', hi: 0.16, inner: 0.22 });
    if (kind === 'gear' && UI.artImg(ctx, 'gear', x + q / 2, y + q / 2, q * 0.66)) return; UI.glyph(ctx, kind, x + q / 2, y + q / 2, q * 0.3, '#F0EDE4');
  };
  // supports des raccourcis laterals (l'icone reste a sa place, le support passe derriere)
  UI.sideSupport = (ctx, x, y, w, h) => UI.darkSupport(ctx, x, y, w, h, Math.min(w, h) * 0.22);
  UI.levelPlate = (ctx, x, y, w, h, label, stage) => {
    UI.darkSupport(ctx, x, y, w, h, h * 0.26);
    UI.shText(ctx, label, x + w / 2, y + h * 0.4, UI.fit(ctx, label, w * 0.8, h * 0.4), '#FFFFFF', { shadow: 'rgba(0,0,0,0.5)' });
    UI.dots(ctx, x + w / 2, y + h * 0.74, w * 0.66, 5, Math.min(5, stage || 1));
  };
  UI.orangePlate = (ctx, x, y, w, h, hot) => { UI.relief(ctx, x, y, w, h, h * 0.3, { top: '#B36A2A', bot: '#8A4A16', outline: '#4A2508', rim: '#E8B25A', hi: 0.14, inner: 0.2, bw: 2 }); };   // compte a rebours / OUVRIR : brun-or
  UI.chestFrame = (ctx, x, y, s, ready, unlocked, now) => {
    const cx = x + s / 2, cy = y + s / 2; UI.sideSupport(ctx, x + s * 0.04, y + s * 0.04, s * 0.92, s * 0.92);
    ctx.save(); if (!unlocked) ctx.globalAlpha = 0.45; if (!UI.artImg(ctx, 'chest', cx, cy, s * 0.8)) UI.icon(ctx, 'chest_open', cx, cy, s * 0.74); ctx.restore(); if (!unlocked) UI.glyph(ctx, 'lock', cx, cy, s * 0.2, '#F0EDE4');
  };
  UI.segments = (ctx, x, y, w, h, done, total, o) => {
    o = o || {}; total = total || 5; const gap = w * 0.025, sw = (w - gap * (total - 1)) / total, r = h * 0.4, col = o.on || '#FFC83D';
    for (let i = 0; i < total; i++) { const sx = x + i * (sw + gap), on = i < done;
      rr(ctx, sx, y, sw, h, r); ctx.fillStyle = on ? shade(col, -0.32) : '#B9C5D0'; ctx.fill();                                   // contour inferieur plus sombre
      rr(ctx, sx, y, sw, h - P(1), r); ctx.fillStyle = on ? vg(ctx, y, y + h, [shade(col, 0.22), col]) : vg(ctx, y, y + h, ['#E3E9EE', '#D5DDE5']); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (on ? 0.5 : 0.6) + ')'; ctx.fillRect(sx + r * 0.7, y + P(1), sw - r * 1.4, P(1)); }
  };
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join(''); }
  UI.shade = shade;
  // bouton AMELIORER colore par categorie ; renvoie la zone interne (pour le texte et le prix)
  UI.upgradeButton = (ctx, x, y, w, h, cat, enabled) => {
    const pal = CAT[cat].btn, o = enabled ? Object.assign({ hi: 0.2, inner: 0.24, bw: 2 }, pal) : { top: '#C9D3DC', bot: '#9FB0BF', outline: '#7F90A0', rim: '#E6EBF0', hi: 0.2, inner: 0.2, bw: 2, shadowCol: 'rgba(10,20,30,' };
    return UI.relief(ctx, x, y, w, h, h * 0.26, o);
  };
})();
