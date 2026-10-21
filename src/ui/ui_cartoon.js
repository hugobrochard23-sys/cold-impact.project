/* v222 : KIT « CARTOON 3D » du menu (refonte de l'interface d'apres la maquette) : panneaux bleu nuit a bordure doree, plaques de bois, boutons verts en relief, badges a facettes.
 * Tout est dessine au canvas (aucune image aplatie) avec les memes conventions que ui_kit.js (coordonnees en pixels de reference S(), icones d'origine conservees).
 * Palette : bleus #172D43 / #07518F / #1478C8 / #62C5FF ; or #FFB52E / #FFD52A / #FF8B19 ; bois #D99545 / #A85E27 / #673819 ; vert #82F52C / #43D91F / #188C17. */
(function () {
  const UI = CC.UI2; if (!UI) return;
  const S = (v) => v * UI.k;
  const C = { night: '#172D43', night2: '#101923', navy: '#07518F', blue: '#1478C8', cyan: '#62C5FF', gold: '#FFB52E', goldL: '#FFD52A', orange: '#FF8B19', orangeD: '#C85B0A', brown: '#87431B',
    wood: '#A85E27', woodL: '#D99545', woodD: '#673819', woodX: '#432719', green: '#43D91F', greenL: '#82F52C', greenD: '#188C17', greenX: '#126516', white: '#FFFFFF', cream: '#F5F2E9', red: '#F04438', redD: '#B91C1C' };
  UI.C = C;
  const hexPath = (ctx, cx, cy, r, cut) => { const w = r * 2, c = r * (cut === undefined ? 0.5 : cut); ctx.beginPath(); ctx.moveTo(cx - r + c, cy - r); ctx.lineTo(cx + r - c, cy - r); ctx.lineTo(cx + r, cy - r + c); ctx.lineTo(cx + r, cy + r - c); ctx.lineTo(cx + r - c, cy + r); ctx.lineTo(cx - r + c, cy + r); ctx.lineTo(cx - r, cy + r - c); ctx.lineTo(cx - r, cy - r + c); ctx.closePath(); };
  const rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
  const lg = (ctx, y0, y1, a, b, m) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); if (m) g.addColorStop(0.5, m); g.addColorStop(1, b); return g; };
  const shadow = (ctx, path, dy, a) => { ctx.save(); ctx.translate(0, dy); path(); ctx.fillStyle = 'rgba(8,10,16,' + (a || 0.45) + ')'; ctx.fill(); ctx.restore(); };
  UI.shadowOf = shadow;

  // --- cadre dore epais autour d'une surface (bords arrondis ou biseautes) ; renvoie la zone interieure utile
  UI.goldFrame = (ctx, x, y, w, h, o) => {   // v223 : style a plat : UNE teinte, aucun contour, simple ombre portee
    o = o || {}; const r = o.r !== undefined ? o.r : Math.min(w, h) * 0.16, cut = !!o.cut, path = () => { if (cut) UI.cham(ctx, x, y, w, h, r); else rr(ctx, x, y, w, h, r); };
    shadow(ctx, path, Math.max(S(5), h * 0.045), 0.35); path(); ctx.fillStyle = o.fill || '#1E3550'; ctx.fill();
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
  UI.greenButton = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = h * 0.26, dis = !!o.disabled, press = o.pressed ? h * 0.04 : 0;
    shadow(ctx, () => rr(ctx, x, y + press, w, h, r), S(5), 0.38); rr(ctx, x, y + press, w, h, r); ctx.fillStyle = dis ? '#5B6A64' : '#3FCB2B'; ctx.fill();
    return { x, y: y + press, w, h };
  };
  // --- texte a contour colore (titres et boutons)
  UI.outlined = (ctx, s, x, y, px, fill, edge, o) => {   // v223 : texte SANS contour (seul « APPUYEZ POUR LANCER » garde le sien : o.keep)
    o = o || {}; ctx.save(); UI.setFont(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.keep) { ctx.lineWidth = Math.max(2, px * (o.ow || 0.2)); ctx.strokeStyle = edge || '#0b0d12'; ctx.strokeText(s, x, y + px * 0.04); }
    ctx.fillStyle = fill || C.white; ctx.fillText(s, x, y); ctx.restore();
  };
  // --- badge a facettes (niveau, notification)
  UI.facetBadge = (ctx, cx, cy, r, text, o) => {
    o = o || {}; shadow(ctx, () => hexPath(ctx, cx, cy, r, 0.42), Math.max(S(3), r * 0.1), 0.35); hexPath(ctx, cx, cy, r, 0.42); ctx.fillStyle = o.fill || '#16314A'; ctx.fill();
    if (text !== undefined && text !== null) UI.outlined(ctx, String(text), cx, cy + r * 0.04, UI.fit(ctx, String(text), r * 1.35, r * 1.0), C.white);
  };
  // --- bouton rond vert « + »
  UI.plusButton = (ctx, cx, cy, r) => {
    shadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); }, Math.max(S(3), r * 0.12), 0.35); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#3FCB2B'; ctx.fill();
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
  UI.segments = (ctx, x, y, w, h, done, total, o) => {
    o = o || {}; total = total || 5; const gap = w * 0.025, sw = (w - gap * (total - 1)) / total, r = h * 0.4;
    for (let i = 0; i < total; i++) { rr(ctx, x + i * (sw + gap), y, sw, h, r); ctx.fillStyle = i < done ? '#FFC21F' : '#2B4258'; ctx.fill(); }
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
  UI.currencyPill = (ctx, ui, x, y, w, h, kind, value, o) => {
    o = o || {}; const gem = kind === 'gem', body = x + h * 0.3, bw = w - h * 0.3;
    if (gem) UI.bluePanel(ctx, body, y, bw, h, { r: h * 0.3 }); else UI.woodPlate(ctx, body, y, bw, h, { r: h * 0.3 });
    UI.icon(ctx, gem ? 'gem' : 'coin', x + h * 0.55, y + h / 2, h * 1.25);
    UI.outlined(ctx, value, x + h * 1.2, y + h * 0.5, UI.fit(ctx, value, w - h * (o.plus ? 2.9 : 1.6), h * 0.56), C.white, null, { align: 'left' });
    if (o.plus) UI.plusButton(ctx, x + w - h * 0.5, y + h / 2, h * 0.42);
  };
  // bouton de la barre du haut : parametres / fermer (badge a facettes)
  UI.cartoonIconButton = (ctx, x, y, s, kind, o) => {
    o = o || {}; UI.facetBadge(ctx, x + s / 2, y + s / 2, s / 2, null, { fill: o.danger ? '#D83A30' : '#1D5FA6' }); UI.glyph(ctx, kind, x + s / 2, y + s / 2, s * 0.3, C.white);
  };
  // badge de niveau d'une carte (hexagone en relief)
  UI.levelBadge = (ctx, cx, cy, r, n) => UI.facetBadge(ctx, cx, cy, r, n, { fill: '#16314A' });
  UI.progressSquares = (ctx, x, y, w, h, done, total, o) => UI.segments(ctx, x, y, w, h, done, total, o);
  // pastilles de progression du coffre / niveau
  UI.dots = (ctx, cx, cy, w, n, on) => { const gap = w / n; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(cx - w / 2 + gap * (i + 0.5), cy, gap * 0.33, 0, 6.2832); ctx.fillStyle = i < on ? '#FFC21F' : '#40566B'; ctx.fill(); } };

  // =====================================================================================================================================================================
  // petite boutique en 3D (auvent rouge et blanc, facade de bois, porte bleue, plaque SHOP) : silhouette opaque
  UI.shopStall = (ctx, x, y, s, now) => {   // boutique en 3D, sans plaque de texte
    const w = s * 1.05, h = s * 1.05, bx = x;
    shadow(ctx, () => rr(ctx, bx + w * 0.06, y + h * 0.36, w * 0.88, h * 0.62, s * 0.07), s * 0.04, 0.35);
    rr(ctx, bx + w * 0.06, y + h * 0.36, w * 0.88, h * 0.62, s * 0.07); ctx.fillStyle = '#C07A34'; ctx.fill();
    ctx.fillStyle = '#1D78C8'; rr(ctx, bx + w * 0.6, y + h * 0.56, w * 0.24, h * 0.42, s * 0.04); ctx.fill();
    ctx.fillStyle = '#FFE9A8'; rr(ctx, bx + w * 0.14, y + h * 0.56, w * 0.38, h * 0.26, s * 0.04); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#F04438', '#38C5F5', '#FFC21F'][k]; ctx.fillRect(bx + w * (0.17 + k * 0.11), y + h * 0.64, w * 0.07, h * 0.12); }
    const ay = y + h * 0.1, ah = h * 0.3, n = 6;
    for (let k = 0; k < n; k++) { const x0 = bx + w * 0.02 + k * w * 0.96 / n, x1 = x0 + w * 0.96 / n; ctx.beginPath(); ctx.moveTo(x0 + w * 0.02, ay); ctx.lineTo(x1 - w * 0.02, ay); ctx.lineTo(x1, ay + ah); ctx.arc((x0 + x1) / 2, ay + ah, w * 0.48 / n, 0, Math.PI); ctx.lineTo(x0, ay + ah); ctx.closePath(); ctx.fillStyle = k % 2 ? C.white : '#E8382C'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(bx + w * 0.92, y + h * 0.08, s * 0.12, 0, 6.2832); ctx.fillStyle = '#E8382C'; ctx.fill(); UI.outlined(ctx, '!', bx + w * 0.92, y + h * 0.085, s * 0.17, C.white);
  };
  // badge « NO ADS » : disque d'interdiction + plaque de bois
  UI.noAdsBadge = (ctx, x, y, s) => {   // seulement le logo : disque bleu nuit, « ADS » barre de rouge
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.44;
    shadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); }, s * 0.04, 0.35); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#16314A'; ctx.fill();
    UI.outlined(ctx, 'ADS', cx, cy, r * 0.82, C.white);
    ctx.lineCap = 'round'; ctx.lineWidth = r * 0.24; ctx.strokeStyle = '#F04438'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy + r * 0.6); ctx.lineTo(cx + r * 0.6, cy - r * 0.6); ctx.stroke();
  };
  // gemmes gratuites : cadre bleu, cristal d'origine, plaque de bois « n/3 », coche verte quand tout est disponible
  UI.freeGems = (ctx, x, y, s, free) => {   // cristal d'origine (sans rectangle derriere), « n/3 » en texte, coche verte
    UI.icon(ctx, 'gem', x + s / 2, y + s * 0.4, s * 0.86);
    const vs = s * 0.3, vx = x + s * 0.86, vy = y + s * 0.1; ctx.beginPath(); ctx.arc(vx, vy, vs * 0.52, 0, 6.2832); ctx.fillStyle = free > 0 ? '#3FCB2B' : '#5B6A64'; ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = vs * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(vx - vs * 0.22, vy); ctx.lineTo(vx - vs * 0.05, vy + vs * 0.17); ctx.lineTo(vx + vs * 0.25, vy - vs * 0.16); ctx.stroke();
    UI.outlined(ctx, free + '/3', x + s / 2, y + s * 0.92, s * 0.3, free > 0 ? C.white : '#b9c2cc');
  };
  // coffre : cadre a facettes bleu acier, coffre d'origine, lueur doree quand il est pret
  UI.chestFrame = (ctx, x, y, s, ready, unlocked, now) => {
    const cx = x + s / 2, cy = y + s / 2, r = s / 2;
    if (ready) { const p = 0.5 + 0.5 * Math.sin(now / 240); ctx.save(); ctx.globalAlpha = 0.25 + 0.35 * p; hexPath(ctx, cx, cy, r + S(8), 0.42); ctx.fillStyle = '#FFD52A'; ctx.fill(); ctx.restore(); }
    UI.facetBadge(ctx, cx, cy, r, null, { fill: ready ? '#2A4A68' : '#16314A' });
    ctx.save(); if (!unlocked) ctx.globalAlpha = 0.45; UI.icon(ctx, 'chest_open', cx, cy + s * 0.02, s * 0.74); ctx.restore(); if (!unlocked) UI.glyph(ctx, 'lock', cx, cy, s * 0.2, C.white);
  };
  // petite plaque orange (OUVRIR, temps restant)
  UI.orangePlate = (ctx, x, y, w, h, hot) => { shadow(ctx, () => rr(ctx, x, y, w, h, h * 0.3), S(4), 0.35); rr(ctx, x, y, w, h, h * 0.3); ctx.fillStyle = hot ? '#FF8B19' : '#8A4A1A'; ctx.fill(); };
  // badge de niveau : plaque a facettes bleu nuit, bordure doree, rangee de pastilles de progression
  UI.levelPlate = (ctx, x, y, w, h, label, stage) => {
    UI.goldFrame(ctx, x, y, w, h, { r: h * 0.28, cut: true, fill: '#16314A' });
    UI.outlined(ctx, label, x + w / 2, y + h * 0.4, UI.fit(ctx, label, w * 0.8, h * 0.4), C.white);
    UI.dots(ctx, x + w / 2, y + h * 0.74, w * 0.66, 5, Math.min(5, stage || 1));
  };
})();
