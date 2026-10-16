/* v170 : KIT D'INTERFACE « arcade tactique moderne » (anthracite + jaune neon + rouge de menace).
 * C'est l'equivalent des prefabs reutilisables : tous les ecrans passent par ces fonctions, aucun style n'est ecrit en dur dans un ecran.
 * Regles : STRICTEMENT deux accents (jaune #FFE600 = positif / recompense / action ; rouge #FF2B2B = menace uniquement) ; coins chanfreines a 45° ;
 * police Rajdhani Bold (un seul endroit pour la changer : THEME.font) ; contour sombre epais SEULEMENT sur les gros textes ; zones tactiles >= 48 dp.
 * Les dimensions sont donnees en « pixels de reference » d'une largeur de 1080 : UI.k = largeur du canvas / 1080. */
(function () {
  const U = CC.U;
  const THEME = {
    bg: '#1E2024', bg2: '#16181c', border: '#3A3E45', border2: '#52565e', yellow: '#FFE600', yellowD: '#B8A400', yellowL: '#FFF56a', red: '#FF2B2B', redD: '#9a1414',
    white: '#FFFFFF', ink: '#101216', dim: '#8d929b', grey: '#3A3E45',
    font: '"Rajdhani","Barlow Condensed","Arial Narrow",sans-serif',   // changer la police : ici seulement
  };
  const UI = CC.UI2 = { THEME, k: 1, hudPr: 1 };
  UI.begin = (W, hudPr) => { UI.k = W / 1080; UI.hudPr = hudPr || 1; };
  const S = (v) => v * UI.k;
  UI.S = S;
  // ---------- images ----------
  const ICONS = ['missile_ogive', 'missile_flame', 'gem', 'gems_rope', 'gems_belt', 'bag_wings', 'chest_open', 'coin', 'coins_stack', 'crate_steel', 'video'];
  const IMG = {};
  UI.preload = () => { for (const n of ICONS) if (!IMG[n]) { const i = new Image(); i.src = 'assets/ui/icons/' + n + '.png'; IMG[n] = i; } };
  UI.preload();
  UI.img = (n) => { const i = IMG[n]; return i && i.complete && i.naturalWidth ? i : null; };
  // dessine une icone image dans une boite carree centree (taille = plus grand cote)
  UI.icon = (ctx, name, cx, cy, size, o) => {
    const i = UI.img(name); o = o || {};
    if (!i) { ctx.save(); ctx.fillStyle = name.indexOf('gem') >= 0 || name.indexOf('coin') >= 0 ? THEME.yellow : THEME.border2; UI.cham(ctx, cx - size * 0.4, cy - size * 0.4, size * 0.8, size * 0.8, size * 0.15); ctx.fill(); ctx.restore(); return; }   // placeholder en attendant l'image
    const sc = size / Math.max(i.naturalWidth, i.naturalHeight), w = i.naturalWidth * sc, h = i.naturalHeight * sc;
    ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha; if (o.rot) { ctx.translate(cx, cy); ctx.rotate(o.rot); ctx.drawImage(i, -w / 2, -h / 2, w, h); } else ctx.drawImage(i, cx - w / 2, cy - h / 2, w, h); ctx.restore();
  };
  // ---------- tracés ----------
  UI.cham = (ctx, x, y, w, h, c) => { c = Math.max(0, Math.min(c, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath(); };
  UI.setFont = (ctx, px) => { ctx.font = '700 ' + px + 'px ' + THEME.font; if ('letterSpacing' in ctx) ctx.letterSpacing = (px * 0.02) + 'px'; };
  UI.tw = (ctx, s, px) => { ctx.save(); UI.setFont(ctx, px); const w = ctx.measureText(s).width; ctx.restore(); return w; };
  UI.fit = (ctx, s, maxW, px) => { const w = UI.tw(ctx, s, px); return w > maxW ? px * maxW / w : px; };
  // texte : contour sombre epais seulement sur les gros textes (o.outline = true) ; petits textes sans contour
  UI.text = (ctx, s, x, y, px, color, o) => {
    // v173 : aucun contour : le texte clair est double d'une copie sombre decalee de quelques pixels vers le bas (petit relief)
    o = o || {}; ctx.save(); UI.setFont(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    const off = Math.max(1.5 * (UI.hudPr || 1), px * (o.outline ? 0.07 : 0.05));
    ctx.fillStyle = 'rgba(8,9,12,0.95)'; ctx.fillText(s, x, y + off);
    ctx.fillStyle = color || THEME.white; ctx.fillText(s, x, y); ctx.restore();
  };
  // ---------- composants ----------
  // UIPanel
  UI.panel = (ctx, x, y, w, h, o) => {
    o = o || {}; const c = o.c === undefined ? Math.min(w, h) * 0.12 : o.c;
    UI.cham(ctx, x, y, w, h, c); ctx.fillStyle = o.fill || THEME.bg; ctx.fill();
    if (o.border !== null) { UI.cham(ctx, x, y, w, h, c); ctx.lineWidth = o.bw || Math.max(2, S(3)); ctx.strokeStyle = o.border || THEME.border; ctx.stroke(); }
  };
  const face = (ctx, x, y, w, h, c, top, bot, lip, lipCol, edge) => {
    const l = lip ? Math.max(2, h * lip) : 0;
    if (l) { UI.cham(ctx, x, y + l, w, h - l, c); ctx.fillStyle = lipCol; ctx.fill(); }
    UI.cham(ctx, x, y, w, h - l, c); const g = ctx.createLinearGradient(0, y, 0, y + h - l); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fill();
    ctx.save(); UI.cham(ctx, x, y, w, h - l, c); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, y, w, (h - l) * 0.38); ctx.restore();
    if (edge) { UI.cham(ctx, x, y, w, h, c); ctx.lineWidth = Math.max(1.5, S(2)); ctx.strokeStyle = edge; ctx.stroke(); }
  };
  // boutons : primaire (jaune), secondaire (sombre a bordure jaune), danger (rouge), desactive (gris)
  UI.btnPrimary = (ctx, x, y, w, h, label, o) => {
    o = o || {}; const c = Math.min(h * 0.28, S(22)), dis = o.disabled; const press = o.pressed ? h * 0.03 : 0;
    if (dis) { face(ctx, x, y, w, h, c, '#454a52', '#3a3e45', 0.08, '#2a2d33', THEME.border); }
    else face(ctx, x, y + press, w, h - press, c, THEME.yellowL, THEME.yellow, 0.1, THEME.yellowD, '#8a7d00');
    const col = dis ? THEME.dim : THEME.ink;
    if (o.sub) { UI.text(ctx, label, x + w / 2 + (o.icon ? h * 0.2 : 0), y + h * 0.33, UI.fit(ctx, label, w * 0.86, h * 0.34), col, { shadow: false }); o.subDraw ? o.subDraw(x + w / 2, y + h * 0.7, h) : UI.text(ctx, o.sub, x + w / 2, y + h * 0.7, h * 0.32, col, { shadow: false }); }
    else UI.text(ctx, label, x + w / 2, y + h * 0.46, UI.fit(ctx, label, w * (o.maxW || 0.84), o.px || h * 0.42), col, { shadow: false });
  };
  UI.btnSecondary = (ctx, x, y, w, h, label, o) => {
    o = o || {}; const c = Math.min(h * 0.28, S(22)); UI.panel(ctx, x, y, w, h, { c, fill: THEME.bg2, border: THEME.yellow, bw: Math.max(2, S(3)) });
    UI.text(ctx, label, x + w / 2, y + h * 0.48, UI.fit(ctx, label, w * 0.84, o.px || h * 0.4), o.color || THEME.white, { shadow: false });
  };
  UI.btnDanger = (ctx, x, y, w, h, label, o) => { o = o || {}; const c = Math.min(h * 0.28, S(22)); face(ctx, x, y, w, h, c, '#ff5a4a', THEME.red, 0.1, THEME.redD, '#6a0a0a'); UI.text(ctx, label, x + w / 2, y + h * 0.46, UI.fit(ctx, label, w * 0.84, o.px || h * 0.4), THEME.white, { shadow: false }); };
  // UIIconButton : carre sombre chanfreine avec icone vectorielle
  UI.iconButton = (ctx, x, y, s, kind, o) => {
    o = o || {}; const c = s * 0.2; UI.panel(ctx, x, y, s, s, { c, fill: o.danger ? '#2a1214' : THEME.bg, border: o.danger ? THEME.red : (o.active ? THEME.yellow : THEME.border), bw: Math.max(2.5, S(4)) });
    UI.glyph(ctx, kind, x + s / 2, y + s / 2, s * 0.42, o.danger ? THEME.red : (o.color || THEME.yellow));
  };
  // glyphes simples (SVG -> traces canvas) : pause, reglages, croix, boutique, son, vibration, cadenas, etoile, coeur, trophee, bouclier, cible
  UI.glyph = (ctx, kind, cx, cy, r, col) => {
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, r * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (kind) {
      case 'pause': ctx.fillRect(-r * 0.7, -r * 0.8, r * 0.5, r * 1.6); ctx.fillRect(r * 0.2, -r * 0.8, r * 0.5, r * 1.6); break;
      case 'gear': { ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; for (const [da, rad] of [[-0.2, r * 0.74], [-0.13, r], [0.13, r], [0.2, r * 0.74]]) ctx.lineTo(Math.cos(a + da) * rad, Math.sin(a + da) * rad); } ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, 6.2832); ctx.fill(); break; }
      case 'close': ctx.lineWidth = r * 0.36; ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.moveTo(r * 0.7, -r * 0.7); ctx.lineTo(-r * 0.7, r * 0.7); ctx.stroke(); break;
      case 'shop': ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.moveTo(-r, -r * 0.25); ctx.lineTo(-r * 0.75, -r * 0.9); ctx.lineTo(r * 0.75, -r * 0.9); ctx.lineTo(r, -r * 0.25); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.rect(-r * 0.85, -r * 0.25, r * 1.7, r * 1.15); ctx.stroke(); ctx.fillRect(-r * 0.25, r * 0.15, r * 0.5, r * 0.75); break;
      case 'sound': ctx.beginPath(); ctx.moveTo(-r, -r * 0.35); ctx.lineTo(-r * 0.4, -r * 0.35); ctx.lineTo(r * 0.2, -r * 0.85); ctx.lineTo(r * 0.2, r * 0.85); ctx.lineTo(-r * 0.4, r * 0.35); ctx.lineTo(-r, r * 0.35); ctx.closePath(); ctx.fill(); ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(r * 0.2, 0, r * 0.55, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 0.2, 0, r * 0.95, -0.9, 0.9); ctx.stroke(); break;
      case 'vibrate': ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.rect(-r * 0.4, -r * 0.8, r * 0.8, r * 1.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.5); ctx.lineTo(-r * 0.8, r * 0.5); ctx.moveTo(r * 0.8, -r * 0.5); ctx.lineTo(r * 0.8, r * 0.5); ctx.stroke(); break;
      case 'lock': ctx.lineWidth = r * 0.2; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.45, Math.PI, 0); ctx.stroke(); ctx.fillRect(-r * 0.7, -r * 0.1, r * 1.4, r * 1.0); break;
      case 'star': ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, rad = k % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); break;
      case 'heart': ctx.beginPath(); ctx.moveTo(0, r * 0.85); ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.7, -r * 1.0, 0, -r * 0.35); ctx.bezierCurveTo(r * 0.7, -r * 1.0, r * 1.3, -r * 0.1, 0, r * 0.85); ctx.fill(); break;
      case 'trophy': ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.9); ctx.lineTo(r * 0.6, -r * 0.9); ctx.lineTo(r * 0.45, r * 0.15); ctx.lineTo(-r * 0.45, r * 0.15); ctx.closePath(); ctx.fill(); ctx.fillRect(-r * 0.12, r * 0.15, r * 0.24, r * 0.5); ctx.fillRect(-r * 0.5, r * 0.65, r, r * 0.22); break;
      case 'shield': ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.85, -r * 0.6); ctx.lineTo(r * 0.7, r * 0.3); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, r * 0.3); ctx.lineTo(-r * 0.85, -r * 0.6); ctx.closePath(); ctx.fill(); break;
      case 'target': ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.5, 0); ctx.moveTo(r, 0); ctx.lineTo(r * 0.5, 0); ctx.moveTo(0, -r); ctx.lineTo(0, -r * 0.5); ctx.moveTo(0, r); ctx.lineTo(0, r * 0.5); ctx.stroke(); break;
      case 'plus': ctx.lineWidth = r * 0.34; ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke(); break;
      case 'play': ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.8); ctx.lineTo(r * 0.8, 0); ctx.lineTo(-r * 0.5, r * 0.8); ctx.closePath(); ctx.fill(); break;
      case 'ads': { ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 0.64, r * 0.64); ctx.lineTo(r * 0.64, -r * 0.64); ctx.stroke(); break; }
      default: break;
    }
    ctx.restore();
  };
  // UICurrencyPill : pastille de devise (icone qui deborde a gauche, valeur, bouton + de 48 dp)
  UI.currencyPill = (ctx, ui, x, y, w, h, kind, value, o) => {
    o = o || {}; const c = h * 0.28; UI.panel(ctx, x + h * 0.3, y, w - h * 0.3, h, { c, fill: THEME.bg, border: THEME.border, bw: Math.max(2, S(3)) });
    UI.icon(ctx, kind === 'gem' ? 'gem' : 'coin', x + h * 0.55, y + h / 2, h * 1.25);
    UI.text(ctx, value, x + h * 1.2, y + h * 0.52, UI.fit(ctx, value, w - h * (o.plus ? 2.9 : 1.6), h * 0.58), THEME.white, { align: 'left', shadow: false });
    if (o.plus) { const s = h * 0.86, px = x + w - s - h * 0.06, py = y + (h - s) / 2; UI.panel(ctx, px, py, s, s, { c: s * 0.22, fill: kind === 'gem' ? '#3a1416' : THEME.bg2, border: kind === 'gem' ? THEME.red : THEME.yellow, bw: Math.max(2, S(3)) }); UI.glyph(ctx, 'plus', px + s / 2, py + s / 2, s * 0.4, kind === 'gem' ? THEME.red : THEME.yellow); }
  };
  // UILevelBadge : pastille de niveau (octogone sombre)
  UI.levelBadge = (ctx, cx, cy, r, n) => { UI.cham(ctx, cx - r, cy - r, r * 2, r * 2, r * 0.55); ctx.fillStyle = THEME.bg2; ctx.fill(); ctx.lineWidth = Math.max(2, S(3)); ctx.strokeStyle = THEME.border2; ctx.stroke(); const s = String(n); UI.text(ctx, s, cx, cy + r * 0.04, UI.fit(ctx, s, r * 1.5, r * 1.1), THEME.white, { shadow: false }); };
  // UIProgressSquares : cases (remplies = jaune)
  UI.progressSquares = (ctx, x, y, w, h, done, total, o) => {
    o = o || {}; total = total || 5; const gap = w * 0.03, sw = (w - gap * (total - 1)) / total, c = Math.min(h * 0.25, sw * 0.25);
    for (let i = 0; i < total; i++) { const on = i < done; UI.cham(ctx, x + i * (sw + gap), y, sw, h, c); ctx.fillStyle = on ? (o.full ? THEME.yellowL : THEME.yellow) : '#2a2d33'; ctx.fill(); ctx.lineWidth = Math.max(1.5, S(2)); ctx.strokeStyle = on ? THEME.yellowD : THEME.border; ctx.stroke(); }
  };
  // UIGaugeHorizontal : jauge a 3 segments (le bout est rouge quand c'est bas)
  UI.gaugeH = (ctx, x, y, w, h, k, o) => {
    o = o || {}; const low = k < (o.low || 0.22), c = h * 0.3; UI.panel(ctx, x, y, w, h, { c, fill: THEME.bg2, border: THEME.border2, bw: Math.max(2.5, S(4)) });
    const m = h * 0.2, iw = w - m * 2, ih = h - m * 2; ctx.save(); UI.cham(ctx, x + m, y + m, iw, ih, c * 0.5); ctx.clip();
    const col = low ? (Math.floor(performance.now() / 260) % 2 ? '#ff7a6a' : THEME.red) : THEME.yellow; ctx.fillStyle = col; ctx.fillRect(x + m, y + m, iw * U.clamp(k, 0, 1), ih); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + m, y + m, iw * U.clamp(k, 0, 1), ih * 0.4); ctx.restore();
    ctx.strokeStyle = THEME.border2; ctx.lineWidth = Math.max(2, S(3)); for (const t of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(x + w * t, y + m * 0.6); ctx.lineTo(x + w * t, y + h - m * 0.6); ctx.stroke(); }
  };
  // UIGaugeVertical : progression (le haut = arrivee)
  UI.gaugeV = (ctx, x, y, w, h, k) => {
    UI.panel(ctx, x, y, w, h, { c: w * 0.28, fill: THEME.bg2, border: THEME.border2, bw: Math.max(2.5, S(4)) }); const m = w * 0.18; ctx.save(); UI.cham(ctx, x + m, y + m, w - m * 2, h - m * 2, w * 0.14); ctx.clip();
    const fh = (h - m * 2) * U.clamp(k, 0, 1); ctx.fillStyle = 'rgba(255,230,0,0.28)'; ctx.fillRect(x, y + h - m - fh, w, fh); ctx.fillStyle = THEME.yellow; ctx.fillRect(x + m, y + h - m - fh, w - m * 2, Math.max(3, S(5))); ctx.restore();
  };
  UI.checkFlag = (ctx, x, y, w, h) => { ctx.save(); UI.cham(ctx, x, y, w, h, w * 0.2); ctx.clip(); const n = 4, cw = w / n, ch = h / 3; for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? THEME.ink : THEME.white; ctx.fillRect(x + i * cw, y + j * ch, cw + 1, ch + 1); } ctx.restore(); UI.cham(ctx, x, y, w, h, w * 0.2); ctx.lineWidth = Math.max(2, S(3)); ctx.strokeStyle = THEME.border2; ctx.stroke(); };
  // UIRibbon : ruban rouge incline (BEST VALUE)
  UI.ribbon = (ctx, cx, cy, w, h, label, rot) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot === undefined ? -0.35 : rot); UI.cham(ctx, -w / 2, -h / 2, w, h, h * 0.3); ctx.fillStyle = THEME.red; ctx.fill(); ctx.lineWidth = Math.max(2, S(3)); ctx.strokeStyle = THEME.white; ctx.stroke(); UI.text(ctx, label, 0, 0, UI.fit(ctx, label, w * 0.84, h * 0.5), THEME.white, { shadow: false }); ctx.restore(); };
  // reticule rouge : coins en equerre ; verrouille = double cadre pulse
  UI.reticle = (ctx, cx, cy, s, locked) => {
    ctx.save(); ctx.strokeStyle = THEME.red; ctx.lineWidth = Math.max(3, s * 0.07); ctx.lineCap = 'square'; const a = s / 2, l = s * 0.28, p = locked ? 1 + 0.08 * Math.sin(performance.now() / 90) : 1;
    ctx.translate(cx, cy); ctx.scale(p, p);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * a, sy * (a - l)); ctx.lineTo(sx * a, sy * a); ctx.lineTo(sx * (a - l), sy * a); ctx.stroke(); }
    if (locked) { ctx.lineWidth = Math.max(2, s * 0.04); ctx.beginPath(); ctx.arc(0, 0, a * 0.42, 0, 6.2832); ctx.stroke(); ctx.fillStyle = THEME.red; ctx.beginPath(); ctx.arc(0, 0, s * 0.05, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  };
  // tap target minimal : 48 dp
  UI.tap = (ui, x, y, w, h, action, scene) => { const m = 48 * (UI.hudPr || 1); let hx = x, hy = y, hw = w, hh = h; if (hw < m) { hx -= (m - hw) / 2; hw = m; } if (hh < m) { hy -= (m - hh) / 2; hh = m; } ui.buttons.push({ x: hx, y: hy, w: hw, h: hh, action, scene: !!scene }); };
})();
