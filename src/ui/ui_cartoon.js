/* v222 : KIT « CARTOON 3D » du menu (refonte de l'interface d'apres la maquette) : panneaux bleu nuit a bordure doree, plaques de bois, boutons verts en relief, badges a facettes.
 * Tout est dessine au canvas (aucune image aplatie) avec les memes conventions que ui_kit.js (coordonnees en pixels de reference S(), icones d'origine conservees).
 * Palette : bleus #172D43 / #07518F / #1478C8 / #62C5FF ; or #FFB52E / #FFD52A / #FF8B19 ; bois #D99545 / #A85E27 / #673819 ; vert #82F52C / #43D91F / #188C17. */
(function () {
  const UI = CC.UI2; if (!UI) return;
  const S = (v) => v * UI.k;
  const C = { night: '#172D43', night2: '#101923', navy: '#07518F', blue: '#1478C8', cyan: '#62C5FF', gold: '#FFB52E', goldL: '#FFD52A', orange: '#FF8B19', orangeD: '#C85B0A', brown: '#87431B',
    wood: '#A85E27', woodL: '#D99545', woodD: '#673819', woodX: '#432719', green: '#43D91F', greenL: '#82F52C', greenD: '#188C17', greenX: '#126516', white: '#FFFFFF', cream: '#F5F2E9', red: '#F04438', redD: '#B91C1C' };
  UI.C = C;
  // images d'habillage fournies (assets/ui/*.png) : boutique et fonds de cartes (bois, pierre, bois sombre)
  const ART = {}; UI.art = (n) => { let i = ART[n]; if (!i) { i = ART[n] = new Image(); i.src = 'assets/ui/' + n + '.png'; } return i.complete && i.naturalWidth ? i : null; };
  ['shop', 'card_slate', 'gem', 'chest', 'gear', 'coin', 'btn_green'].forEach((n) => UI.art(n));
  const hexPath = (ctx, cx, cy, r, cut) => { const w = r * 2, c = r * (cut === undefined ? 0.5 : cut); ctx.beginPath(); ctx.moveTo(cx - r + c, cy - r); ctx.lineTo(cx + r - c, cy - r); ctx.lineTo(cx + r, cy - r + c); ctx.lineTo(cx + r, cy + r - c); ctx.lineTo(cx + r - c, cy + r); ctx.lineTo(cx - r + c, cy + r); ctx.lineTo(cx - r, cy + r - c); ctx.lineTo(cx - r, cy - r + c); ctx.closePath(); };
  const rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
  const lg = (ctx, y0, y1, a, b, m) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); if (m) g.addColorStop(0.5, m); g.addColorStop(1, b); return g; };
  const shadow = (ctx, path, dy, a) => { ctx.save(); ctx.translate(0, dy); path(); ctx.fillStyle = 'rgba(8,10,16,' + (a || 0.45) + ')'; ctx.fill(); ctx.restore(); };
  UI.shadowOf = shadow;

  // --- cadre dore epais autour d'une surface (bords arrondis ou biseautes) ; renvoie la zone interieure utile
  UI.goldFrame = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = o.r !== undefined ? o.r : Math.min(w, h) * 0.16, cut = !!o.cut; if (cut) UI.cham(ctx, x, y, w, h, r); else rr(ctx, x, y, w, h, r); ctx.fillStyle = o.fill || '#1E3550'; ctx.fill();
    return { x: x + S(6), y: y + S(6), w: w - S(12), h: h - S(12), r };
  };
  // --- panneau bleu a bordure claire (surface bleue)
  UI.bluePanel = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = o.r !== undefined ? o.r : h * 0.3; shadow(ctx, () => rr(ctx, x, y, w, h, r), Math.max(S(4), h * 0.06), 0.35); rr(ctx, x, y, w, h, r); ctx.fillStyle = o.fill || '#0F5FA8'; ctx.fill();
  };
  // --- plaque de bois (bordure doree) : barre de pieces, bouton de lancement, petites plaques de texte
  UI.woodPlate = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = o.r !== undefined ? o.r : h * 0.3; shadow(ctx, () => rr(ctx, x, y, w, h, r), Math.max(S(4), h * 0.07), 0.35); rr(ctx, x, y, w, h, r); ctx.fillStyle = o.fill || '#9A5826'; ctx.fill();
    return { x, y, w, h };
  };
  // --- bouton vert en relief (AMELIORER...) : retourne { x, y, w, h } de la face
  const BTN = { la: ['#43B957', '#2F9A44', '#9BE0AC', '#6FC184'], rk: ['#2C9CE8', '#1F7BC0', '#9ED3F4', '#76B6E0'], cm: ['#F2702A', '#C4531B', '#F8AC85', '#E58760'] };
  UI.CARDCOL = { la: '#43B957', rk: '#2C9CE8', cm: '#F2702A' };
  UI.greenButton = (ctx, x, y, w, h, o) => {   // bouton plat avec une tranche (relief) sous la face ; plus clair quand on ne peut pas acheter
    o = o || {}; const r = h * 0.07, dis = !!o.disabled, lip = Math.max(S(5), h * 0.075), hh = h - lip, c = BTN[o.cat] || BTN.la;
    rr(ctx, x, y + lip, w, hh, r); ctx.fillStyle = dis ? c[3] : c[1]; ctx.fill();
    rr(ctx, x, y, w, hh, r); ctx.fillStyle = dis ? c[2] : c[0]; ctx.fill();
    return { x, y, w, h: hh };
  };
  UI.outlined = (ctx, s, x, y, px, fill, edge, o) => {   // v223 : texte SANS contour (seul « APPUYEZ POUR LANCER » garde le sien : o.keep)
    o = o || {}; ctx.save(); UI.setFont(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.keep) { ctx.lineWidth = Math.max(2, px * (o.ow || 0.2)); ctx.strokeStyle = edge || '#0b0d12'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = fill || C.white; ctx.fillText(s, x, y); ctx.restore();
  };
  // --- badge a facettes (niveau, notification)
  UI.facetBadge = (ctx, cx, cy, r, text, o) => {
    o = o || {}; shadow(ctx, () => hexPath(ctx, cx, cy, r, 0.42), Math.max(S(3), r * 0.1), 0.35); hexPath(ctx, cx, cy, r, 0.42); ctx.fillStyle = o.fill || '#16314A'; ctx.fill();
    if (text !== undefined && text !== null) UI.outlined(ctx, String(text), cx, cy + r * 0.04, UI.fit(ctx, String(text), r * 1.35, r * 1.0), C.white);
  };
  // --- bouton rond vert « + »
  UI.plusButton = (ctx, cx, cy, r) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#3FCB2B'; ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = r * 0.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - r * 0.42, cy); ctx.lineTo(cx + r * 0.42, cy); ctx.moveTo(cx, cy - r * 0.42); ctx.lineTo(cx, cy + r * 0.42); ctx.stroke();
  };
  // --- fleche jaune epaisse (dir = -1 gauche, 1 droite)
  UI.bigArrow = (ctx, cx, cy, s, dir) => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir, 1);
    const p = () => { ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.9); ctx.lineTo(s * 0.5, 0); ctx.lineTo(-s * 0.45, s * 0.9); ctx.lineTo(-s * 0.15, 0); ctx.closePath(); };
    ctx.save(); ctx.translate(0, s * 0.1); p(); ctx.fillStyle = 'rgba(40,20,8,0.55)'; ctx.fill(); ctx.restore();
    p(); ctx.fillStyle = lg(ctx, -s, s, '#FFF06A', C.orange, C.goldL); ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, s * 0.12); ctx.strokeStyle = C.orangeD; ctx.stroke();
    ctx.restore();
  };
  // --- segments de progression en relief
  UI.segments = (ctx, x, y, w, h, done, total, o) => {   // presque carres, avec une tranche de relief
    o = o || {}; total = total || 5; const gap = w * 0.038, sw = (w - gap * (total - 1)) / total, r = Math.min(sw, h) * 0.22, lip = h * 0.16, on0 = o.on || '#E4B84D';
    for (let i = 0; i < total; i++) { const sx = x + i * (sw + gap), on = i < done;
      rr(ctx, sx, y + lip, sw, h - lip, r); ctx.fillStyle = on ? UI.shade(on0, -0.28) : '#121D29'; ctx.fill();
      rr(ctx, sx, y, sw, h - lip, r); ctx.fillStyle = on ? on0 : (o.off || '#2B4258'); ctx.fill(); }
  };
  // --- cadre d'illustration (fond bleu a rayons, ou orange pour le revenu)
  UI.artFrame = (ctx, x, y, w, h, kind) => {
    const r = Math.min(w, h) * 0.12, orange = kind === 'gold'; ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); if (orange) { g.addColorStop(0, '#FFB43A'); g.addColorStop(1, '#D9741A'); } else { g.addColorStop(0, '#2C9CE8'); g.addColorStop(1, '#0B64A8'); } ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = orange ? 'rgba(255,240,150,0.13)' : 'rgba(150,230,255,0.12)'; const n = 9; for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = a0 + 6.2832 / n / 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y + h / 2); ctx.lineTo(x + w / 2 + Math.cos(a0) * w, y + h / 2 + Math.sin(a0) * w); ctx.lineTo(x + w / 2 + Math.cos(a1) * w, y + h / 2 + Math.sin(a1) * w); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };
  // =====================================================================================================================================================================
  // pastille de monnaie : plaque de bois (pieces) ou panneau bleu (gemmes) ; l'icone d'origine deborde a gauche, le « + » vert a droite
  { const _ic = UI.icon; UI.icon = (ctx, name, cx, cy, size, o) => { if ((name === 'coin' || name === 'gem') && UI.artImg(ctx, name, cx, cy, size)) return; _ic(ctx, name, cx, cy, size, o); }; }
  UI.shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
  const WH = {};   // silhouette blanche d'une icone (pour son contour)
  UI.artOutlined = (ctx, name, cx, cy, size, ow) => {
    const im = UI.art(name); if (!im) return false; let c = WH[name];
    if (!c) { c = WH[name] = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); }
    const k = size / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    for (let a = 0; a < 12; a++) ctx.drawImage(c, cx - w / 2 + Math.cos(a / 12 * 6.2832) * ow, cy - h / 2 + Math.sin(a / 12 * 6.2832) * ow, w, h);
    ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h); return true;
  };
  UI.slate = (ctx, x, y, w, h, r, fill) => { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill || '#26394B'; ctx.fill(); };
  UI.artImg = (ctx, name, cx, cy, size) => { const im = UI.art(name); if (!im) return false; const k = size / Math.max(im.naturalWidth, im.naturalHeight); ctx.drawImage(im, cx - im.naturalWidth * k / 2, cy - im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); return true; };
  UI.currencyPill = (ctx, ui, x, y, w, h, kind, value, o) => {   // pastille jaune (pieces) / bleue (gemmes), contour blanc et ombre
    o = o || {}; const gem = kind === 'gem', body = x + h * 0.3, bw = w - h * 0.3; h = h * 0.84; y += S(6); const ow = Math.max(2, S(4));
    ctx.save(); ctx.translate(0, S(5)); rr(ctx, body - ow, y - ow, bw + ow * 2, h + ow * 2, h * 0.3 + ow); ctx.fillStyle = 'rgba(8,12,18,0.34)'; ctx.fill(); ctx.restore();
    rr(ctx, body - ow, y - ow, bw + ow * 2, h + ow * 2, h * 0.3 + ow); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    UI.slate(ctx, body, y, bw, h, h * 0.3, gem ? '#1C86D8' : '#F2BD52');
    if (!UI.artOutlined(ctx, gem ? 'gem' : 'coin', x + h * 0.5, y + h / 2, h * 1.12, Math.max(2, S(3)))) UI.icon(ctx, gem ? 'gem' : 'coin', x + h * 0.5, y + h / 2, h * 1.2);
    UI.outlined(ctx, value, x + h * 1.2, y + h * 0.5, UI.fit(ctx, value, bw - h * (o.plus ? 1.7 : 1.1), h * 0.66), '#FFFFFF', '#000000', { align: 'left', keep: true, ow: 0.2 });
    if (o.plus) { const pr = h * 0.38, pcx = x + w, pcy = y + h / 2; ctx.beginPath(); ctx.arc(pcx, pcy, pr + Math.max(2, S(3)), 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); UI.plusButton(ctx, pcx, pcy, pr); }
  };
  UI.slateIconButton = (ctx, x, y, s, kind) => {   // bouton rond bleu a relief
    const q = s * 0.86, cx = x + s / 2, cy = y + S(4) + q / 2, r = q / 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#0B3A80'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.04, r * 0.93, 0, 6.2832); const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, '#4FA3F0'); g.addColorStop(0.5, '#2275D6'); g.addColorStop(1, '#1658AE'); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.04, r * 0.93, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = Math.max(2, S(3)); ctx.strokeStyle = 'rgba(200,230,255,0.75)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.68, 0, 6.2832); ctx.fillStyle = '#1A66C2'; ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = 'rgba(6,30,70,0.55)'; ctx.stroke();
    if (kind === 'gear' && UI.artImg(ctx, 'gear', cx, cy, q * 0.56)) return; UI.glyph(ctx, kind, cx, cy, q * 0.28, '#F0EDE4');
  };
  // bouton de la barre du haut : parametres / fermer (badge a facettes)
  UI.cartoonIconButton = (ctx, x, y, s, kind, o) => {
    o = o || {}; UI.facetBadge(ctx, x + s / 2, y + s / 2, s / 2, null, { fill: o.danger ? '#D83A30' : '#1D5FA6' }); UI.glyph(ctx, kind, x + s / 2, y + s / 2, s * 0.3, C.white);
  };
  // badge de niveau d'une carte (hexagone en relief)
  UI.levelBadge = (ctx, cx, cy, r, n) => { hexPath(ctx, cx, cy, r + S(3), 0.42); ctx.fillStyle = '#FFFFFF'; ctx.fill(); UI.facetBadge(ctx, cx, cy, r, n, { fill: '#16314A' }); };
  UI.progressSquares = (ctx, x, y, w, h, done, total, o) => UI.segments(ctx, x, y, w, h, done, total, o);
  // pastilles de progression du coffre / niveau
  UI.dots = (ctx, cx, cy, w, n, on) => { const gap = w / n; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(cx - w / 2 + gap * (i + 0.5), cy, gap * 0.33, 0, 6.2832); ctx.fillStyle = i < on ? '#FFC21F' : '#40566B'; ctx.fill(); } };

  // =====================================================================================================================================================================
  // petite boutique en 3D (auvent rouge et blanc, facade de bois, porte bleue, plaque SHOP) : silhouette opaque
  UI.shopStall = (ctx, x, y, s, now) => {   // boutique : image fournie (assets/ui/shop.png) + pastille de notification
    const im = UI.art('shop'), w = s * 1.12, h = w * (im ? im.naturalHeight / im.naturalWidth : 1);
    if (im) { if (!UI.artOutlined(ctx, 'shop', x - s * 0.04 + w / 2, y - s * 0.06 + h / 2, Math.max(w, h), Math.max(2, S(3)))) ctx.drawImage(im, x - s * 0.04, y - s * 0.06, w, h); }
    // (plus de pastille d'alerte)
  };
  // badge « NO ADS » : disque d'interdiction + plaque de bois
  UI.noAdsBadge = (ctx, x, y, s) => {   // seulement le logo : disque bleu nuit, « ADS » barre de rouge
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.44;
    shadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); }, s * 0.04, 0.35); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#16314A'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r + Math.max(2, S(3)), 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#16314A'; ctx.fill();
    UI.outlined(ctx, 'ADS', cx, cy, r * 0.82, C.white);
    ctx.lineCap = 'round'; ctx.lineWidth = r * 0.24; ctx.strokeStyle = '#F04438'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy + r * 0.6); ctx.lineTo(cx + r * 0.6, cy - r * 0.6); ctx.stroke();
  };
  // gemmes gratuites : cadre bleu, cristal d'origine, plaque de bois « n/3 », coche verte quand tout est disponible
  UI.freeGems = (ctx, x, y, s, free) => {   // cristal a contour blanc, « n/3 » a contour noir
    if (!UI.artOutlined(ctx, 'gem', x + s / 2, y + s * 0.4, s * 0.8, Math.max(2, S(3)))) UI.icon(ctx, 'gem', x + s / 2, y + s * 0.4, s * 0.86);
    UI.outlined(ctx, free + '/3', x + s / 2, y + s * 0.92, s * 0.3, free > 0 ? C.white : '#b9c2cc', '#000000', { keep: true, ow: 0.22 });
  };
  // coffre : cadre a facettes bleu acier, coffre d'origine, lueur doree quand il est pret
  UI.chestFrame = (ctx, x, y, s, ready, unlocked, now) => {
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.48, ow = Math.max(2, S(4));
    ctx.beginPath(); ctx.arc(cx, cy, r + ow, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#26394B'; ctx.fill();
    ctx.save(); if (!unlocked) ctx.globalAlpha = 0.45; if (!UI.artImg(ctx, 'chest', cx, cy + r * 0.04, s * 0.74)) UI.icon(ctx, 'chest_open', cx, cy, s * 0.7); ctx.restore(); if (!unlocked) UI.glyph(ctx, 'lock', cx, cy, s * 0.2, '#F0EDE4');
  };
  // petite plaque orange (OUVRIR, temps restant)
  UI.orangePlate = (ctx, x, y, w, h, hot) => { rr(ctx, x, y, w, h, h * 0.3); ctx.fillStyle = hot ? '#FF8B19' : '#8A4A1A'; ctx.fill(); };
  // badge de niveau : plaque a facettes bleu nuit, bordure doree, rangee de pastilles de progression
  UI.levelPlate = (ctx, x, y, w, h, label, stage) => {
    UI.slate(ctx, x, y, w, h, h * 0.26);
    UI.outlined(ctx, label, x + w / 2, y + h * 0.4, UI.fit(ctx, label, w * 0.8, h * 0.4), '#F0EDE4');
    UI.dots(ctx, x + w / 2, y + h * 0.74, w * 0.66, 5, Math.min(5, stage || 1));
  };
})();
