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
  UI.goldFrame = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = o.r !== undefined ? o.r : Math.min(w, h) * 0.16, b = o.b !== undefined ? o.b : Math.max(S(5), Math.min(w, h) * 0.05), cut = !!o.cut;
    const path = (xx, yy, ww, hh, rad) => { if (cut) { UI.cham(ctx, xx, yy, ww, hh, rad); } else rr(ctx, xx, yy, ww, hh, rad); };
    shadow(ctx, () => path(x, y, w, h, r), Math.max(S(6), h * 0.06), 0.5);
    path(x, y, w, h, r); ctx.fillStyle = lg(ctx, y, y + h, o.top || C.goldL, o.bot || C.orangeD, o.mid || C.gold); ctx.fill();
    path(x, y, w, h, r); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.woodX; ctx.stroke();
    const x2 = x + b, y2 = y + b, w2 = w - 2 * b, h2 = h - 2 * b, r2 = Math.max(2, r - b * 0.8);
    path(x2, y2, w2, h2, r2); ctx.fillStyle = o.fill || lg(ctx, y2, y2 + h2, '#2A4560', C.night2); ctx.fill();
    path(x2, y2, w2, h2, r2); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = 'rgba(8,12,20,0.85)'; ctx.stroke();
    ctx.save(); path(x2, y2, w2, h2, r2); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x2, y2, w2, h2 * 0.32); ctx.restore();
    ctx.save(); path(x, y, w, h, r); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + r * 0.5, y + b * 0.18, w - r, Math.max(1.5, b * 0.18)); ctx.restore();
    return { x: x2, y: y2, w: w2, h: h2, r: r2 };
  };
  // --- panneau bleu a bordure claire (surface bleue)
  UI.bluePanel = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = o.r !== undefined ? o.r : h * 0.3;
    shadow(ctx, () => rr(ctx, x, y, w, h, r), Math.max(S(5), h * 0.07), 0.45);
    rr(ctx, x, y, w, h, r); ctx.fillStyle = lg(ctx, y, y + h, C.cyan, C.blue); ctx.fill(); rr(ctx, x, y, w, h, r); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.night2; ctx.stroke();
    const b = Math.max(S(4), h * 0.08); rr(ctx, x + b, y + b, w - 2 * b, h - 2 * b, Math.max(2, r - b * 0.8)); ctx.fillStyle = lg(ctx, y, y + h, C.blue, C.navy); ctx.fill();
    ctx.save(); rr(ctx, x + b, y + b, w - 2 * b, h - 2 * b, Math.max(2, r - b * 0.8)); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, y, w, h * 0.42); ctx.restore();
  };
  // --- plaque de bois (bordure doree) : barre de pieces, bouton de lancement, petites plaques de texte
  UI.woodPlate = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = o.r !== undefined ? o.r : h * 0.3, b = Math.max(S(4), h * (o.bw || 0.1));
    shadow(ctx, () => rr(ctx, x, y, w, h, r), Math.max(S(6), h * 0.1), 0.5);
    rr(ctx, x, y, w, h, r); ctx.fillStyle = lg(ctx, y, y + h, C.goldL, C.orangeD, C.gold); ctx.fill(); rr(ctx, x, y, w, h, r); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.woodX; ctx.stroke();
    const x2 = x + b, y2 = y + b, w2 = w - 2 * b, h2 = h - 2 * b - (o.lip ? h * 0.06 : 0), r2 = Math.max(2, r - b * 0.8);
    rr(ctx, x2, y2, w2, h2, r2); ctx.fillStyle = lg(ctx, y2, y2 + h2, o.top || C.woodL, o.bot || C.woodD, C.wood); ctx.fill();
    ctx.save(); rr(ctx, x2, y2, w2, h2, r2); ctx.clip();
    ctx.strokeStyle = 'rgba(67,39,25,0.28)'; ctx.lineWidth = Math.max(1, S(2)); for (let k = 1; k < 4; k++) { const yy = y2 + h2 * k / 4; ctx.beginPath(); ctx.moveTo(x2, yy + Math.sin(k * 3.1) * h2 * 0.03); ctx.lineTo(x2 + w2, yy - Math.sin(k * 2.3) * h2 * 0.03); ctx.stroke(); }   // veines du bois
    ctx.fillStyle = 'rgba(255,230,170,0.24)'; ctx.fillRect(x2, y2, w2, h2 * 0.28); ctx.restore();
    rr(ctx, x2, y2, w2, h2, r2); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = 'rgba(67,39,25,0.9)'; ctx.stroke();
    return { x: x2, y: y2, w: w2, h: h2 };
  };
  // --- bouton vert en relief (AMELIORER...) : retourne { x, y, w, h } de la face
  UI.greenButton = (ctx, x, y, w, h, o) => {
    o = o || {}; const r = h * 0.26, dis = !!o.disabled, press = o.pressed ? h * 0.05 : 0, lip = h * 0.1, top = dis ? '#7c8a84' : C.greenL, bot = dis ? '#4c5852' : C.greenD, rim = dis ? '#2b3430' : C.greenX;
    shadow(ctx, () => rr(ctx, x, y + lip, w, h - lip, r), S(5), 0.5);
    rr(ctx, x, y + lip, w, h - lip, r); ctx.fillStyle = rim; ctx.fill();
    rr(ctx, x, y + press, w, h - lip, r); ctx.fillStyle = lg(ctx, y, y + h - lip, top, bot, dis ? '#68756f' : C.green); ctx.fill(); rr(ctx, x, y + press, w, h - lip, r); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = rim; ctx.stroke();
    ctx.save(); rr(ctx, x, y + press, w, h - lip, r); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x, y + press, w, (h - lip) * 0.36); if (!dis && o.sheen) { const t = (performance.now() % 2400) / 2400, sx = x - w * 0.3 + t * w * 1.6, g = ctx.createLinearGradient(sx - w * 0.1, 0, sx + w * 0.1, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.transform(1, 0, -0.3, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(sx - w * 0.1, y, w * 0.2, h); } ctx.restore();
    return { x, y: y + press, w, h: h - lip };
  };
  // --- texte a contour colore (titres et boutons)
  UI.outlined = (ctx, s, x, y, px, fill, edge, o) => {
    o = o || {}; ctx.save(); UI.setFont(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(2, px * (o.ow || 0.2)); ctx.strokeStyle = edge || '#0b0d12'; if (o.drop !== false) { ctx.strokeText(s, x, y + px * 0.06); }
    ctx.strokeText(s, x, y); ctx.fillStyle = fill || C.white; ctx.fillText(s, x, y); ctx.restore();
  };
  // --- badge a facettes (niveau, notification)
  UI.facetBadge = (ctx, cx, cy, r, text, o) => {
    o = o || {}; shadow(ctx, () => hexPath(ctx, cx, cy, r, 0.42), Math.max(S(3), r * 0.12), 0.5);
    hexPath(ctx, cx, cy, r, 0.42); ctx.fillStyle = lg(ctx, cy - r, cy + r, o.edge1 || C.cyan, o.edge2 || C.navy); ctx.fill(); hexPath(ctx, cx, cy, r, 0.42); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.night2; ctx.stroke();
    hexPath(ctx, cx, cy, r * 0.8, 0.42); ctx.fillStyle = lg(ctx, cy - r, cy + r, '#2A4560', C.night2); ctx.fill();
    ctx.save(); hexPath(ctx, cx, cy, r * 0.8, 0.42); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 0.8); ctx.restore();
    if (text !== undefined && text !== null) UI.outlined(ctx, String(text), cx, cy + r * 0.04, UI.fit(ctx, String(text), r * 1.35, r * 1.0), C.white, C.night2, { ow: 0.16, drop: false });
  };
  // --- bouton rond vert « + »
  UI.plusButton = (ctx, cx, cy, r) => {
    shadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); }, Math.max(S(3), r * 0.14), 0.5);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = C.greenD; ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.greenX; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.04, r * 0.84, 0, 6.2832); ctx.fillStyle = lg(ctx, cy - r, cy + r, C.greenL, C.green); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - r * 0.04, r * 0.84, 0, 6.2832); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 0.8); ctx.restore();
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
    for (let i = 0; i < total; i++) { const sx = x + i * (sw + gap), on = i < done;
      rr(ctx, sx, y, sw, h, r); ctx.fillStyle = on ? lg(ctx, y, y + h, '#FFF06A', C.orangeD, C.goldL) : '#293D50'; ctx.fill(); rr(ctx, sx, y, sw, h, r); ctx.lineWidth = Math.max(1.2, S(2)); ctx.strokeStyle = on ? C.brown : '#40566B'; ctx.stroke();
      if (on) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; rr(ctx, sx + sw * 0.12, y + h * 0.12, sw * 0.76, h * 0.26, h * 0.13); ctx.fill(); } }
  };
  // --- cadre d'illustration (fond bleu a rayons, ou orange pour le revenu)
  UI.artFrame = (ctx, x, y, w, h, kind) => {
    const r = Math.min(w, h) * 0.12, b = Math.max(S(3), h * 0.03), orange = kind === 'gold';
    rr(ctx, x, y, w, h, r); ctx.fillStyle = orange ? C.goldL : C.cyan; ctx.fill(); rr(ctx, x, y, w, h, r); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.night2; ctx.stroke();
    const x2 = x + b, y2 = y + b, w2 = w - 2 * b, h2 = h - 2 * b; ctx.save(); rr(ctx, x2, y2, w2, h2, Math.max(2, r - b)); ctx.clip();
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); if (orange) { g.addColorStop(0, '#FFC040'); g.addColorStop(1, '#C85B0A'); } else { g.addColorStop(0, '#2C9CE8'); g.addColorStop(1, '#07518F'); } ctx.fillStyle = g; ctx.fillRect(x2, y2, w2, h2);
    ctx.fillStyle = orange ? 'rgba(255,240,150,0.16)' : 'rgba(150,230,255,0.14)'; const n = 9; for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = a0 + 6.2832 / n / 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y + h / 2); ctx.lineTo(x + w / 2 + Math.cos(a0) * w, y + h / 2 + Math.sin(a0) * w); ctx.lineTo(x + w / 2 + Math.cos(a1) * w, y + h / 2 + Math.sin(a1) * w); ctx.closePath(); ctx.fill(); }
    ctx.restore(); rr(ctx, x2, y2, w2, h2, Math.max(2, r - b)); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = 'rgba(8,12,20,0.7)'; ctx.stroke();
  };

  // =====================================================================================================================================================================
  // pastille de monnaie : plaque de bois (pieces) ou panneau bleu (gemmes) ; l'icone d'origine deborde a gauche, le « + » vert a droite
  UI.currencyPill = (ctx, ui, x, y, w, h, kind, value, o) => {
    o = o || {}; const gem = kind === 'gem', body = x + h * 0.3, bw = w - h * 0.3;
    if (gem) UI.bluePanel(ctx, body, y, bw, h, { r: h * 0.3 }); else UI.woodPlate(ctx, body, y, bw, h, { r: h * 0.3 });
    UI.icon(ctx, gem ? 'gem' : 'coin', x + h * 0.55, y + h / 2, h * 1.25);
    UI.outlined(ctx, value, x + h * 1.2, y + h * 0.5, UI.fit(ctx, value, w - h * (o.plus ? 2.9 : 1.6), h * 0.56), C.white, gem ? C.night2 : C.woodX, { align: 'left', ow: 0.17, drop: false });
    if (o.plus) UI.plusButton(ctx, x + w - h * 0.5, y + h / 2, h * 0.42);
  };
  // bouton de la barre du haut : parametres / fermer (badge a facettes)
  UI.cartoonIconButton = (ctx, x, y, s, kind, o) => {
    o = o || {}; const cx = x + s / 2, cy = y + s / 2, r = s / 2;
    UI.facetBadge(ctx, cx, cy, r, null, o.danger ? { edge1: '#FF8A7A', edge2: C.redD } : {});
    ctx.save(); ctx.shadowColor = 'rgba(8,12,20,0.6)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = s * 0.03; UI.glyph(ctx, kind, cx, cy, s * 0.3, o.danger ? C.white : C.cream); ctx.restore();
  };
  // badge de niveau d'une carte (hexagone en relief)
  UI.levelBadge = (ctx, cx, cy, r, n) => UI.facetBadge(ctx, cx, cy, r, n, { edge1: C.goldL, edge2: C.orangeD });
  UI.progressSquares = (ctx, x, y, w, h, done, total, o) => UI.segments(ctx, x, y, w, h, done, total, o);
  // pastilles de progression du coffre / niveau
  UI.dots = (ctx, cx, cy, w, n, on) => { const gap = w / n; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(cx - w / 2 + gap * (i + 0.5), cy, gap * 0.33, 0, 6.2832); ctx.fillStyle = i < on ? C.goldL : '#40566B'; ctx.fill(); ctx.lineWidth = Math.max(1, S(1.6)); ctx.strokeStyle = C.night2; ctx.stroke(); } };

  // =====================================================================================================================================================================
  // petite boutique en 3D (auvent rouge et blanc, facade de bois, porte bleue, plaque SHOP) : silhouette opaque
  UI.shopStall = (ctx, x, y, s, now) => {
    const w = s * 1.05, h = s * 1.08, bx = x - s * 0.02;
    shadow(ctx, () => rr(ctx, bx + w * 0.05, y + h * 0.3, w * 0.9, h * 0.7, s * 0.06), s * 0.05, 0.5);
    rr(ctx, bx + w * 0.06, y + h * 0.3, w * 0.88, h * 0.7, s * 0.06); ctx.fillStyle = lg(ctx, y, y + h, C.woodL, C.woodD, C.wood); ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.woodX; ctx.stroke();
    ctx.fillStyle = C.blue; rr(ctx, bx + w * 0.62, y + h * 0.5, w * 0.22, h * 0.34, s * 0.04); ctx.fill(); ctx.stroke();           // porte
    ctx.fillStyle = '#FFE9A8'; rr(ctx, bx + w * 0.14, y + h * 0.5, w * 0.4, h * 0.2, s * 0.03); ctx.fill(); ctx.stroke();             // vitrine
    for (let k = 0; k < 3; k++) { ctx.fillStyle = [C.red, C.cyan, C.goldL][k]; ctx.fillRect(bx + w * (0.18 + k * 0.11), y + h * 0.56, w * 0.07, h * 0.09); }
    // auvent
    const ay = y + h * 0.12, ah = h * 0.22, n = 6;
    for (let k = 0; k < n; k++) { const x0 = bx + w * 0.02 + k * w * 0.96 / n, x1 = x0 + w * 0.96 / n; ctx.beginPath(); ctx.moveTo(x0 + w * 0.02, ay); ctx.lineTo(x1 - w * 0.02, ay); ctx.lineTo(x1, ay + ah); ctx.arc((x0 + x1) / 2, ay + ah, w * 0.48 / n, 0, Math.PI); ctx.lineTo(x0, ay + ah); ctx.closePath(); ctx.fillStyle = k % 2 ? C.white : C.red; ctx.fill(); ctx.lineWidth = Math.max(1.2, S(2)); ctx.strokeStyle = C.woodX; ctx.stroke(); }
    // plaque SHOP
    const pw = w * 0.62, ph = h * 0.2, px = bx + w / 2 - pw / 2, py = y + h * 0.77; UI.woodPlate(ctx, px, py, pw, ph, { r: ph * 0.3, bw: 0.12 });
    UI.outlined(ctx, 'SHOP', px + pw / 2, py + ph * 0.5, UI.fit(ctx, 'SHOP', pw * 0.8, ph * 0.7), C.white, C.woodX, { ow: 0.2, drop: false });
    // pastille de notification
    ctx.beginPath(); ctx.arc(bx + w * 0.92, y + h * 0.1, s * 0.12, 0, 6.2832); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = Math.max(2, S(3)); ctx.strokeStyle = C.cream; ctx.stroke();
    UI.outlined(ctx, '!', bx + w * 0.92, y + h * 0.105, s * 0.17, C.white, C.redD, { ow: 0.12, drop: false });
  };
  // badge « NO ADS » : disque d'interdiction + plaque de bois
  UI.noAdsBadge = (ctx, x, y, s) => {
    const cx = x + s / 2, cy = y + s * 0.38, r = s * 0.36;
    shadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); }, s * 0.05, 0.5);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = C.cream; ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.night2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, 6.2832); ctx.fillStyle = lg(ctx, cy - r, cy + r, '#2A4560', C.night2); ctx.fill();
    UI.outlined(ctx, 'ADS', cx, cy, r * 0.78, C.white, C.night2, { ow: 0.16, drop: false });
    ctx.lineCap = 'round'; ctx.lineWidth = r * 0.26; ctx.strokeStyle = C.red; ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy + r * 0.6); ctx.lineTo(cx + r * 0.6, cy - r * 0.6); ctx.stroke();
    const pw = s * 0.96, ph = s * 0.26, px = x + (s - pw) / 2, py = y + s * 0.74; UI.woodPlate(ctx, px, py, pw, ph, { r: ph * 0.3, bw: 0.12 });
    UI.outlined(ctx, 'NO ADS', px + pw / 2, py + ph * 0.5, UI.fit(ctx, 'NO ADS', pw * 0.82, ph * 0.66), C.white, C.woodX, { ow: 0.2, drop: false });
  };
  // gemmes gratuites : cadre bleu, cristal d'origine, plaque de bois « n/3 », coche verte quand tout est disponible
  UI.freeGems = (ctx, x, y, s, free) => {
    UI.bluePanel(ctx, x + s * 0.06, y, s * 0.88, s * 0.74, { r: s * 0.18 });
    UI.icon(ctx, 'gem', x + s / 2, y + s * 0.35, s * 0.66);
    const vs = s * 0.3; ctx.beginPath(); ctx.arc(x + s * 0.86, y + s * 0.1, vs * 0.52, 0, 6.2832); ctx.fillStyle = C.green; ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = C.greenX; ctx.stroke();
    ctx.strokeStyle = C.white; ctx.lineWidth = vs * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x + s * 0.86 - vs * 0.22, y + s * 0.1); ctx.lineTo(x + s * 0.86 - vs * 0.05, y + s * 0.1 + vs * 0.17); ctx.lineTo(x + s * 0.86 + vs * 0.25, y + s * 0.1 - vs * 0.16); ctx.stroke();
    if (free <= 0) { ctx.beginPath(); ctx.arc(x + s * 0.86, y + s * 0.1, vs * 0.52, 0, 6.2832); ctx.fillStyle = 'rgba(40,50,60,0.7)'; ctx.fill(); }
    const pw = s * 0.74, ph = s * 0.28, px = x + (s - pw) / 2, py = y + s * 0.72; UI.woodPlate(ctx, px, py, pw, ph, { r: ph * 0.3, bw: 0.12 });
    UI.outlined(ctx, free + '/3', px + pw / 2, py + ph * 0.5, ph * 0.72, free > 0 ? C.white : '#c9b79a', C.woodX, { ow: 0.2, drop: false });
  };
  // coffre : cadre a facettes bleu acier, coffre d'origine, lueur doree quand il est pret
  UI.chestFrame = (ctx, x, y, s, ready, unlocked, now) => {
    const cx = x + s / 2, cy = y + s / 2, r = s / 2;
    if (ready) { const p = 0.5 + 0.5 * Math.sin(now / 240); ctx.save(); hexPath(ctx, cx, cy, r + S(7), 0.42); ctx.lineWidth = S(5); ctx.strokeStyle = 'rgba(255,213,42,' + (0.35 + 0.55 * p) + ')'; ctx.stroke(); ctx.restore(); }
    UI.facetBadge(ctx, cx, cy, r, null, { edge1: ready ? C.goldL : C.cyan, edge2: ready ? C.orangeD : C.navy });
    ctx.save(); if (!unlocked) ctx.globalAlpha = 0.45; UI.icon(ctx, 'chest_open', cx, cy + s * 0.02, s * 0.74); ctx.restore(); if (!unlocked) UI.glyph(ctx, 'lock', cx, cy, s * 0.2, C.white);
  };
  // petite plaque orange (OUVRIR, temps restant)
  UI.orangePlate = (ctx, x, y, w, h, hot) => {
    shadow(ctx, () => rr(ctx, x, y, w, h, h * 0.3), S(4), 0.5);
    rr(ctx, x, y, w, h, h * 0.3); ctx.fillStyle = lg(ctx, y, y + h, hot ? '#FFC040' : '#E08A3A', hot ? C.orangeD : '#8A4A1A', hot ? C.orange : '#B8651F'); ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2.5)); ctx.strokeStyle = hot ? C.goldL : C.woodX; ctx.stroke();
    ctx.save(); rr(ctx, x, y, w, h, h * 0.3); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w, h * 0.4); ctx.restore();
  };
  // badge de niveau : plaque a facettes bleu nuit, bordure doree, rangee de pastilles de progression
  UI.levelPlate = (ctx, x, y, w, h, label, stage) => {
    UI.goldFrame(ctx, x, y, w, h, { r: h * 0.28, cut: true, b: Math.max(S(4), h * 0.07) });
    UI.outlined(ctx, label, x + w / 2, y + h * 0.4, UI.fit(ctx, label, w * 0.8, h * 0.4), C.white, C.night2, { ow: 0.16, drop: false });
    UI.dots(ctx, x + w / 2, y + h * 0.74, w * 0.66, 5, Math.min(5, stage || 1));
  };
})();
