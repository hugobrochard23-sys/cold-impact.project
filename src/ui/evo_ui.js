/* v159 : INTERFACE du mode evolution, style « jeu mobile arcade » (reference : Epic Plane Evolution) : police epaisse a contour sombre, boutons 3D a levre,
 * pastilles de monnaie, cartes d'amelioration (en-tete bleu acier, pastille de niveau, grande image, cinq cases, gros bouton colore), boutique, apparences,
 * rapport de vol, reglages, jauge de pression du piston de lancement, et les elements discrets du HUD de vol (compteur, jauge de carburant, progression). */
(function () {
  const U = CC.U, Home = CC.Home; if (!Home) return;
  const FONT = '"Lilita One","Baloo 2","Arial Black","Trebuchet MS",sans-serif';
  try { if (document.fonts && document.fonts.load) { document.fonts.load('20px "Lilita One"'); document.fonts.load('20px "Russo One"'); document.fonts.load('700 20px "Barlow Condensed"'); } if (CC.EVO && CC.EVO.on) document.body.classList.add('cc-evo'); } catch (e) { /* police de secours */ }
  const hit = (ui, x, y, w, h, a, scene) => ui.buttons.push({ x, y, w, h, action: a, scene: !!scene });
  const inRect = (ui, x, y, w, h) => !ui.isTouch() && ui.mouse.x >= x && ui.mouse.x <= x + w && ui.mouse.y >= y && ui.mouse.y <= y + h;
  // palette
  const BASEK = { navy: '#14285a', navy2: '#1d3a7a', white: '#ffffff', gold: '#ffc21f', coinD: '#b86a08', gem: '#35b6ff', gemD: '#0c4ea8',
    green: ['#86f044', '#3fc41e', '#1c8a10', '#0f5e08'], red: ['#ff6a5a', '#e0312a', '#a01a1a', '#6a0a0a'], orange: ['#ffb84a', '#f08a1a', '#b85a08', '#7a3504'],
    blue: ['#5ab4ff', '#2b7ae8', '#164ea8', '#0a2e70'], purple: ['#c870ff', '#9a3ae0', '#661fa8', '#401068'], grey: ['#9aa6b8', '#6c7890', '#44506a', '#2a3448'] };

  // ===== THEMES : A = arcade, B = militaire leger, C = sobre / realiste. Toutes les couleurs passent par C() qui les transforme selon le theme. =====
  const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; };
  const rgbOf = (h, s, l) => { h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; if (s === 0) return [l * 255, l * 255, l * 255]; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]; };
  const parseCol = (c) => { if (c[0] === '#') { let h = c.slice(1); if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1]; } const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
  const THEMES = {
    A: { id: 'A', name: 'ARCADE', font: '"Lilita One","Baloo 2","Arial Black",sans-serif', ls: 0, rk: 1, lip: 0.1, gloss: 0.28, swk: 1, rivets: false, hex: false, hazard: false, tf: null },
    B: { id: 'B', name: 'MILITAIRE', font: '"Russo One","Arial Black",sans-serif', ls: 0.03, rk: 0.4, lip: 0.14, gloss: 0.14, swk: 0.62, rivets: true, hex: true, hazard: true,
      tf: (h, s, l) => { if (s < 0.1) return [h, s, l]; let o; if (h >= 185 && h <= 262) o = [212, s * 0.3, l * 0.78]; else if (h > 262 && h <= 335) o = [34, Math.min(1, s * 0.95), Math.min(0.62, l * 1.02)]; else if (h >= 75 && h < 185) o = [92, s * 0.55, l * 0.82]; else if (h >= 15 && h < 75) o = [h, s * 0.88, l * 0.97]; else o = [h, s * 0.82, l * 0.92]; if (l > 0.8 && h >= 15 && h < 75) o[2] = l * 0.55; return o; } },
    C: { id: 'C', name: 'SOBRE', font: '"Barlow Condensed","Arial Narrow",sans-serif', ls: 0.05, rk: 0.28, lip: 0, gloss: 0.07, swk: 0.3, rivets: false, hex: false, hazard: false,
      tf: (h, s, l) => { if (s < 0.1) return [h, s, l]; let o; if (h >= 185 && h <= 262) o = [200, s * 0.42, l > 0.75 ? l * 0.36 : l * 0.72]; else if (h > 262 && h <= 335) o = [215, s * 0.2, l * 0.8]; else if (h >= 75 && h < 185) o = [168, s * 0.5, l * 0.9]; else if (h >= 15 && h < 75) o = l > 0.8 ? [215, 0.12, l * 0.3] : [h, s * 0.62, l * 0.96]; else o = [h, s * 0.55, l * 0.9]; return o; } },
  };
  let T = THEMES.A; const ccache = new Map();
  function C(c) {
    if (!T.tf) return c; let r = ccache.get(c); if (r) return r; const q = parseCol(c), hh = hsl(q[0], q[1], q[2]), t = T.tf(hh[0], hh[1], hh[2]), v = rgbOf(t[0], t[1], t[2]).map((x) => Math.round(x));
    r = (q[3] < 1 || c[0] !== '#') ? 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + q[3] + ')' : '#' + v.map((x) => x.toString(16).padStart(2, '0')).join(''); ccache.set(c, r); return r;
  }
  const K = {};
  function setTheme(id) {
    T = THEMES[id] || THEMES.A; ccache.clear(); for (const k of Object.keys(BASEK)) K[k] = Array.isArray(BASEK[k]) ? BASEK[k].map(C) : C(BASEK[k]);
    try { localStorage.setItem('cc.evoTheme', T.id); document.fonts.load('20px ' + T.font.split(',')[0]); } catch (e) { /* theme facultatif */ }
    try { document.body.classList.remove('cc-th-A', 'cc-th-B', 'cc-th-C'); document.body.classList.add('cc-th-' + T.id); } catch (e) { /* ignore */ }
  }
  function cycleTheme(game) { const o = ['A', 'B', 'C']; setTheme(o[(o.indexOf(T.id) + 1) % 3]); try { game.audio.play('uiTick'); } catch (e) { /* ignore */ } }
  // decorations propres aux themes
  function rivets(ctx, x, y, w, h, m) { ctx.save(); ctx.fillStyle = 'rgba(210,220,232,0.85)'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; const r = Math.max(1.8, m * 0.22); for (const [px, py] of [[x + m, y + m], [x + w - m, y + m], [x + m, y + h - m], [x + w - m, y + h - m]]) { ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill(); ctx.stroke(); } ctx.restore(); }
  function hazard(ctx, x, y, w, h) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = '#e8b81c'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#16181c'; const sw = h * 0.7; for (let k = -h; k < w + h; k += sw * 2) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + sw, y + h); ctx.lineTo(x + k + sw + h, y); ctx.lineTo(x + k + h, y); ctx.closePath(); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + h - 3, w, 3); ctx.restore(); }
  function badgeShape(ctx, cx, cy, r, fill, stroke, lw) { ctx.beginPath(); if (T.hex) { for (let k = 0; k < 6; k++) { const a = -1.5708 + k * 1.0472; ctx.lineTo(cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 1.08); } ctx.closePath(); } else ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  try { const sv = localStorage.getItem('cc.evoTheme'); setTheme(sv && THEMES[sv] ? sv : 'A'); } catch (e) { setTheme('A'); }

  function path(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r * T.rk, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const setF = (ctx, px) => { ctx.font = px + 'px ' + T.font; if ('letterSpacing' in ctx) ctx.letterSpacing = (T.ls * px) + 'px'; };
  // texte epais : remplissage clair, contour sombre, petite ombre portee
  function txt(ctx, s, x, y, px, fill, o) {
    o = o || {}; ctx.save(); setF(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    const sw = px * (o.sw === undefined ? 0.24 : o.sw) * T.swk;
    if (o.shadow !== false) { ctx.fillStyle = C('rgba(0,0,0,0.32)'); ctx.lineWidth = sw; ctx.strokeStyle = C('rgba(0,0,0,0.32)'); ctx.strokeText(s, x, y + px * 0.09); ctx.fillText(s, x, y + px * 0.09); }
    if (sw > 0) { ctx.lineWidth = sw; ctx.strokeStyle = o.stroke || K.navy; ctx.strokeText(s, x, y); }
    if (o.grad) { const g = ctx.createLinearGradient(0, y - px * 0.5, 0, y + px * 0.5); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); ctx.fillStyle = g; } else ctx.fillStyle = fill || K.white;
    ctx.fillText(s, x, y); ctx.restore();
  }
  const tw = (ctx, s, px) => { ctx.save(); setF(ctx, px); const w = ctx.measureText(s).width; ctx.restore(); return w; };
  const fit = (ctx, s, maxW, px) => { const w = tw(ctx, s, px); return w > maxW ? px * maxW / w : px; };
  const mix = (a, b, t) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  // bouton 3D : levre sombre dessous, face en degrade, reflet, contour
  function btn(ctx, x, y, w, h, r, pal, o) {
    o = o || {}; const lip = T.lip ? Math.max(2, h * T.lip) : 0, hh = h - lip, dim = o.dim || 0;
    const c0 = dim ? mix(pal[0], C('#ffffff'), dim) : pal[0], c1 = dim ? mix(pal[1], C('#ffffff'), dim) : pal[1], c2 = dim ? mix(pal[2], C('#ffffff'), dim * 0.7) : pal[2];
    path(ctx, x, y + lip, w, hh, r); ctx.fillStyle = c2; ctx.fill();
    path(ctx, x, y, w, hh, r); const g = ctx.createLinearGradient(0, y, 0, y + hh); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill();
    ctx.save(); path(ctx, x, y, w, hh, r); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,' + T.gloss + ')'; ctx.fillRect(x, y, w, hh * 0.42); ctx.restore();
    path(ctx, x, y, w, h, r); ctx.lineWidth = Math.max(2, h * 0.035); ctx.strokeStyle = pal[3]; ctx.stroke();
  }
  // panneau : bord blanc, fond uni
  function frame(ctx, x, y, w, h, r, fill, border, lw) { path(ctx, x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (border) { ctx.lineWidth = lw || Math.max(2, h * 0.03); ctx.strokeStyle = border; ctx.stroke(); } }
  // ---------- icones ----------
  function coin(ctx, cx, cy, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, C('#ffe36a')); g.addColorStop(1, C('#f2a010')); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.strokeStyle = K.coinD; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.68, 0, 6.2832); ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = C('rgba(184,106,8,0.8)'); ctx.stroke();
    setF(ctx, r * 1.15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = K.coinD; ctx.fillText('$', cx, cy + r * 0.06); ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.4, r * 0.16, 0, 6.2832); ctx.fillStyle = C('rgba(255,255,255,0.65)'); ctx.fill(); ctx.restore();
  }
  function gem(ctx, cx, cy, r) {
    ctx.save(); ctx.lineJoin = 'round'; const hx = [[0, -1], [0.87, -0.5], [0.87, 0.5], [0, 1], [-0.87, 0.5], [-0.87, -0.5]];
    ctx.beginPath(); hx.forEach((p, i) => (i ? ctx.lineTo(cx + p[0] * r, cy + p[1] * r) : ctx.moveTo(cx + p[0] * r, cy + p[1] * r))); ctx.closePath(); const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, C('#9be0ff')); g.addColorStop(0.5, K.gem); g.addColorStop(1, C('#1668d8')); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = C('rgba(255,255,255,0.35)'); ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.87, cy - r * 0.5); ctx.lineTo(cx, cy); ctx.lineTo(cx - r * 0.87, cy - r * 0.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); hx.forEach((p, i) => (i ? ctx.lineTo(cx + p[0] * r, cy + p[1] * r) : ctx.moveTo(cx + p[0] * r, cy + p[1] * r))); ctx.closePath(); ctx.lineWidth = Math.max(1.5, r * 0.13); ctx.strokeStyle = K.gemD; ctx.stroke();
    ctx.fillStyle = C('#fff'); ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy - r * 0.45); ctx.lineTo(cx - r * 0.2, cy - r * 0.25); ctx.lineTo(cx - r * 0.45, cy - r * 0.2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function gemPile(ctx, cx, cy, r, n) {
    const pts = n <= 1 ? [[0, 0, 1]] : n <= 5 ? [[-0.6, 0.35, 0.8], [0.6, 0.35, 0.8], [0, -0.2, 0.9], [0, 0.55, 0.8]] : n <= 10 ? [[-0.7, 0.4, 0.8], [0.7, 0.4, 0.8], [-0.35, -0.2, 0.85], [0.35, -0.2, 0.85], [0, 0.45, 0.9], [0, -0.7, 0.8]] : [[-0.8, 0.5, 0.75], [0.8, 0.5, 0.75], [-0.4, 0.65, 0.8], [0.4, 0.65, 0.8], [-0.55, -0.1, 0.8], [0.55, -0.1, 0.8], [0, 0.2, 0.9], [-0.25, -0.65, 0.8], [0.25, -0.65, 0.8], [0, -0.3, 0.9]];
    for (const p of pts) gem(ctx, cx + p[0] * r, cy + p[1] * r, r * 0.5 * p[2]);
  }
  function gear(ctx, cx, cy, r, col) {
    ctx.save(); ctx.fillStyle = col || C('#fff'); ctx.strokeStyle = C('#1a3f78'); ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.lineJoin = 'round'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; for (const [da, rad] of [[-0.2, r * 0.74], [-0.13, r], [0.13, r], [0.2, r * 0.74]]) ctx.lineTo(cx + Math.cos(a + da) * rad, cy + Math.sin(a + da) * rad); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, 6.2832); ctx.fillStyle = C('#2f80e0'); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function chest(ctx, cx, cy, r, open, glow) {
    ctx.save();
    if (glow) { const gr = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.8); gr.addColorStop(0, 'rgba(255,240,150,' + glow + ')'); gr.addColorStop(1, C('rgba(255,240,150,0)')); ctx.fillStyle = gr; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4); }
    const w = r * 1.7, h = r * 1.0, x = cx - w / 2, y = cy - h * 0.1; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = K.navy;
    frame(ctx, x, y, w, h, r * 0.14, C('#2f78e0'), K.navy); ctx.fillStyle = C('#9fb0c8'); ctx.fillRect(x + w * 0.1, y, w * 0.12, h); ctx.fillRect(x + w * 0.78, y, w * 0.12, h);
    ctx.save(); ctx.translate(x, y); if (open) ctx.rotate(-0.55); frame(ctx, 0, -h * 0.5, w, h * 0.6, r * 0.3, C('#4a92f0'), K.navy); ctx.fillStyle = C('#9fb0c8'); ctx.fillRect(w * 0.1, -h * 0.5, w * 0.12, h * 0.58); ctx.fillRect(w * 0.78, -h * 0.5, w * 0.12, h * 0.58); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, y + h * 0.3, r * 0.18, 0, 6.2832); ctx.fillStyle = C('#dfe8f4'); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function plane(ctx, cx, cy, s, rot, col) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.fillStyle = col || C('#fff'); ctx.strokeStyle = K.navy; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.18, -s * 0.5, s * 0.14, s * 0.2); ctx.lineTo(s * 0.9, s * 0.45); ctx.lineTo(s * 0.9, s * 0.62); ctx.lineTo(s * 0.12, s * 0.5); ctx.lineTo(s * 0.1, s * 0.82); ctx.lineTo(s * 0.4, s * 1.0); ctx.lineTo(s * 0.4, s * 1.1); ctx.lineTo(0, s * 1.0); ctx.lineTo(-s * 0.4, s * 1.1); ctx.lineTo(-s * 0.4, s * 1.0); ctx.lineTo(-s * 0.1, s * 0.82); ctx.lineTo(-s * 0.12, s * 0.5); ctx.lineTo(-s * 0.9, s * 0.62); ctx.lineTo(-s * 0.9, s * 0.45); ctx.lineTo(-s * 0.14, s * 0.2); ctx.quadraticCurveTo(-s * 0.18, -s * 0.5, 0, -s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  function adIcon(ctx, cx, cy, r) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = C('#e8362e'); ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.18); ctx.strokeStyle = C('#fff'); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, 6.2832); ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.strokeStyle = C('#a01010'); ctx.stroke(); txt(ctx, 'ADS', cx, cy, r * 0.78, C('#fff'), { sw: 0.2, stroke: C('#7a0a0a') }); ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy + r * 0.7); ctx.lineTo(cx + r * 0.7, cy - r * 0.7); ctx.lineWidth = Math.max(3, r * 0.2); ctx.strokeStyle = C('#e8362e'); ctx.stroke(); ctx.restore(); }
  function store(ctx, cx, cy, r) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, r * 0.07); ctx.strokeStyle = K.navy; frame(ctx, cx - r * 0.7, cy - r * 0.05, r * 1.4, r * 0.95, r * 0.08, C('#ffd36a'), K.navy); frame(ctx, cx - r * 0.22, cy + r * 0.25, r * 0.44, r * 0.65, r * 0.05, C('#3a8cf0'), K.navy);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? C('#ffffff') : C('#e8362e'); ctx.fillRect(cx - r * 0.82 + k * r * 0.273, cy - r * 0.38, r * 0.273, r * 0.36); } ctx.strokeRect(cx - r * 0.82, cy - r * 0.38, r * 1.64, r * 0.36);
    frame(ctx, cx - r * 0.5, cy - r * 0.95, r * 1.0, r * 0.52, r * 0.1, C('#2f78e0'), K.navy); plane(ctx, cx, cy - r * 0.7, r * 0.2, 0.8, C('#fff')); ctx.restore(); }
  function closeX(ctx, cx, cy, r) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy + r * 0.08, r, 0, 6.2832); ctx.fillStyle = C('#7a0a0a'); ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, C('#ff6a5a')); g.addColorStop(1, C('#d81e1e')); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2.5, r * 0.14); ctx.strokeStyle = C('#fff'); ctx.stroke(); ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, r * 0.26); ctx.beginPath(); ctx.moveTo(cx - r * 0.38, cy - r * 0.38); ctx.lineTo(cx + r * 0.38, cy + r * 0.38); ctx.moveTo(cx + r * 0.38, cy - r * 0.38); ctx.lineTo(cx - r * 0.38, cy + r * 0.38); ctx.stroke(); ctx.restore(); }
  function playTicket(ctx, cx, cy, r, col) { ctx.save(); frame(ctx, cx - r, cy - r * 0.7, r * 2, r * 1.4, r * 0.28, col || C('#ffb020'), K.navy, Math.max(1.5, r * 0.12)); ctx.fillStyle = C('#fff'); ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy - r * 0.4); ctx.lineTo(cx + r * 0.5, cy); ctx.lineTo(cx - r * 0.3, cy + r * 0.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function lockIcon(ctx, cx, cy, r) { ctx.save(); ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = K.navy; ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.4, Math.PI, 0); ctx.stroke(); frame(ctx, cx - r * 0.6, cy - r * 0.1, r * 1.2, r * 0.95, r * 0.15, C('#ffc21f'), K.navy); ctx.restore(); }
  function flag(ctx, x, y, w, h) { ctx.save(); const n = 4, cw = w / n, ch = h / 3; for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? C('#14285a') : C('#ffffff'); ctx.fillRect(x + i * cw, y + j * ch, cw, ch); } ctx.restore(); }
  function pump(ctx, cx, cy, r, col) { ctx.save(); ctx.lineJoin = 'round'; ctx.fillStyle = col || C('#fff'); ctx.strokeStyle = K.navy; ctx.lineWidth = Math.max(1.5, r * 0.18); path(ctx, cx - r * 0.55, cy - r * 0.85, r * 0.8, r * 1.7, r * 0.12); ctx.fill(); ctx.stroke(); ctx.fillStyle = C('#7ac8ff'); ctx.fillRect(cx - r * 0.4, cy - r * 0.65, r * 0.5, r * 0.5); ctx.beginPath(); ctx.moveTo(cx + r * 0.25, cy - r * 0.6); ctx.lineTo(cx + r * 0.7, cy - r * 0.3); ctx.lineTo(cx + r * 0.7, cy + r * 0.45); ctx.stroke(); ctx.restore(); }
  // ---------- illustrations des cartes ----------
  function rocket(ctx, cx, cy, s, tier, flame, pal) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.strokeStyle = K.navy;
    const card = tier < 2; pal = pal || {}; const body = card ? C('#e6c690') : (pal.body || C('#f2f4f8')), red = card ? C('#b98a52') : (pal.acc || C('#e5392b')), wing = card ? C('#cfa466') : (pal.wh || C('#e2e8f2'));
    if (flame) { const fh = s * (1.5 + 0.3 * Math.sin(performance.now() / 70)); const g = ctx.createLinearGradient(0, cy + s * 1.9, 0, cy + s * 1.9 + fh); g.addColorStop(0, C('#fff6c0')); g.addColorStop(0.5, C('#ffa828')); g.addColorStop(1, C('rgba(255,80,20,0)')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - s * 0.34, cy + s * 1.9); ctx.quadraticCurveTo(cx, cy + s * 1.9 + fh * 1.1, cx + s * 0.34, cy + s * 1.9); ctx.fill(); }
    if (tier >= 3) for (const sd of [-1, 1]) { path(ctx, cx + sd * s * 0.8 - s * 0.2, cy - s * 0.5, s * 0.4, s * 2.3, s * 0.2); ctx.fillStyle = C('#cf3a2a'); ctx.fill(); ctx.stroke(); }
    if (tier >= 1) for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * s * 0.4, cy + s * 0.05); ctx.lineTo(cx + sd * s * 1.8, cy + s * 1.15); ctx.lineTo(cx + sd * s * 1.7, cy + s * 1.45); ctx.lineTo(cx + sd * s * 0.4, cy + s * 1.05); ctx.closePath(); ctx.fillStyle = wing; ctx.fill(); ctx.stroke(); ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(cx + sd * s * 1.45, cy + s * 0.95); ctx.lineTo(cx + sd * s * 1.8, cy + s * 1.15); ctx.lineTo(cx + sd * s * 1.7, cy + s * 1.45); ctx.lineTo(cx + sd * s * 1.5, cy + s * 1.28); ctx.closePath(); ctx.fill(); }
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * s * 0.4, cy + s * 1.2); ctx.lineTo(cx + sd * s * 1.0, cy + s * 2.0); ctx.lineTo(cx + sd * s * 0.4, cy + s * 2.0); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke(); }
    path(ctx, cx - s * 0.46, cy - s * 1.3, s * 0.92, s * 3.2, s * 0.35); ctx.fillStyle = body; ctx.fill(); ctx.stroke();
    ctx.save(); path(ctx, cx - s * 0.46, cy - s * 1.3, s * 0.92, s * 3.2, s * 0.35); ctx.clip(); ctx.fillStyle = C('rgba(255,255,255,0.45)'); ctx.fillRect(cx - s * 0.4, cy - s * 1.3, s * 0.2, s * 3.2); ctx.fillStyle = C('rgba(0,0,0,0.14)'); ctx.fillRect(cx + s * 0.2, cy - s * 1.3, s * 0.3, s * 3.2); ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - s * 0.46, cy - s * 1.2); ctx.quadraticCurveTo(cx, cy - s * 2.9, cx + s * 0.46, cy - s * 1.2); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke();
    if (tier >= 2) { ctx.fillStyle = pal.band || C('#ffd23a'); ctx.fillRect(cx - s * 0.45, cy + s * 0.9, s * 0.9, s * 0.2); }
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.3, s * 0.27, 0, 6.2832); ctx.fillStyle = C('#58c4ff'); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(cx - s * 0.08, cy - s * 0.38, s * 0.08, 0, 6.2832); ctx.fillStyle = C('rgba(255,255,255,0.85)'); ctx.fill(); ctx.restore();
  }
  // lanceur : piston a ressort dans son fourreau (le palier change la couleur)
  function pistonArt(ctx, cx, cy, s, tier) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.strokeStyle = K.navy; const col = [[C('#b07a42'), C('#8a5a2c')], [C('#9aa8ba'), C('#566272')], [C('#ffc21f'), C('#c88a08')]][tier];
    ctx.translate(cx, cy); ctx.rotate(-0.45);
    frame(ctx, -s * 1.75, -s * 0.45, s * 1.7, s * 0.9, s * 0.12, C('#4a5568'), K.navy); frame(ctx, -s * 1.75, -s * 0.45, s * 0.28, s * 0.9, s * 0.08, col[1], K.navy);
    ctx.strokeStyle = C('#d0d8e4'); ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.moveTo(-s * 0.05, 0); ctx.lineTo(s * 1.2, 0); ctx.stroke();
    ctx.strokeStyle = C('#9aa6b8'); ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.moveTo(-s * 1.0, -s * 0.25); for (let k = 0; k < 7; k++) ctx.lineTo(-s * 1.0 + k * s * 0.13, (k % 2 ? 1 : -1) * s * 0.28); ctx.stroke();
    ctx.strokeStyle = K.navy; ctx.lineWidth = Math.max(2, s * 0.08); frame(ctx, s * 1.1, -s * 0.5, s * 0.35, s * 1.0, s * 0.1, col[0], K.navy);
    ctx.restore();
  }
  function walletArt(ctx, cx, cy, s) { for (let k = 2; k >= 0; k--) { const y = cy + s * 0.55 - k * s * 0.34; ctx.save(); ctx.beginPath(); ctx.ellipse(cx, y, s * 1.0, s * 0.4, 0, 0, 6.2832); const g = ctx.createLinearGradient(0, y - s * 0.4, 0, y + s * 0.4); g.addColorStop(0, C('#ffe36a')); g.addColorStop(1, C('#f2a010')); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.strokeStyle = K.coinD; ctx.stroke(); ctx.restore(); } coin(ctx, cx + s * 0.95, cy - s * 0.5, s * 0.5); }
  const secFmt = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  const ease = (k) => 1 - Math.pow(1 - U.clamp(k, 0, 1), 3);
  const MULT = [[0.2, 4], [0.45, 3], [0.75, 2], [1.01, 1.5]];
  const multAt = (p) => { const a = Math.abs(p); for (const [t, m] of MULT) if (a < t) return m; return 1.5; };
  const MCOL = { 4: '#ffc21f', 3: '#3fc41e', 2: '#2b7ae8', 1.5: '#e0312a' };
  Home.evoUI = { txt, tw, fit, panel: (ctx, x, y, w, h, r, fill, f2, border) => frame(ctx, x, y, w, h, r, fill && fill.length ? fill : C('rgba(10,20,50,0.8)'), border === null ? null : (border || C('rgba(255,255,255,0.35)'))), btn, K, coin, gem, star: (ctx, cx, cy, r) => { ctx.save(); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283, rad = k % 2 ? r * 0.46 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } ctx.closePath(); const g = ctx.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, C('#fff08a')); g.addColorStop(1, C('#f2a010')); ctx.fillStyle = g; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, r * 0.12); ctx.strokeStyle = K.coinD; ctx.stroke(); ctx.restore(); }, path, plane, flag, pump };

  // ---------- pastilles de monnaie ----------
  function pill(ctx, x, y, w, h, c0, c1, edge) { path(ctx, x, y + h * 0.08, w, h, h / 2); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill(); path(ctx, x, y, w, h, h / 2); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill(); ctx.save(); path(ctx, x, y, w, h, h / 2); ctx.clip(); ctx.fillStyle = C('rgba(255,255,255,0.25)'); ctx.fillRect(x, y, w, h * 0.45); ctx.restore(); path(ctx, x, y, w, h, h / 2); ctx.lineWidth = Math.max(2, h * 0.07); ctx.strokeStyle = edge; ctx.stroke(); }
  function topBar(ui, ctx, game, W, T0, u, S, E, o) {
    o = o || {}; const h = u * 0.075, y = T0 + u * 0.035, px = h * 0.7, x0 = W * 0.04, fxg = game.evoGemFx, now = performance.now();
    const cs = U.formatInt(S.coins), cw = Math.max(u * 0.3, tw(ctx, cs, px) + h * 1.6);
    pill(ctx, x0 + h * 0.3, y, cw, h, C('#ffb52e'), C('#f08a10'), C('#fff0b8')); coin(ctx, x0 + h * 0.3, y + h / 2, h * 0.62); txt(ctx, cs, x0 + h * 1.1, y + h / 2, px, C('#fff'), { align: 'left' });
    const gs = String(S.gems || 0), gx = x0 + h * 0.3 + cw + W * 0.045, gw = Math.max(u * 0.26, tw(ctx, gs, px) + h * 2.3), pulse = fxg ? U.clamp(1 - (now - fxg.t0) / 900, 0, 1) : 0;
    pill(ctx, gx + h * 0.3, y, gw, h, C('#4ab4ff'), C('#1f78e8'), C('#cfeaff')); gem(ctx, gx + h * 0.3, y + h / 2, h * 0.6 * (1 + 0.3 * pulse)); txt(ctx, gs, gx + h * 1.1, y + h / 2, px, C('#fff'), { align: 'left' });
    { const bx = gx + h * 0.3 + gw - h * 0.55; ctx.beginPath(); ctx.arc(bx, y + h / 2, h * 0.5, 0, 6.2832); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, C('#8af050')); g.addColorStop(1, C('#2fb010')); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2, h * 0.07); ctx.strokeStyle = C('#fff'); ctx.stroke(); ctx.lineCap = 'round'; ctx.lineWidth = h * 0.16; ctx.strokeStyle = C('#fff'); ctx.beginPath(); ctx.moveTo(bx - h * 0.2, y + h / 2); ctx.lineTo(bx + h * 0.2, y + h / 2); ctx.moveTo(bx, y + h / 2 - h * 0.2); ctx.lineTo(bx, y + h / 2 + h * 0.2); ctx.stroke(); }
    hit(ui, gx, y - 4, gw + h * 0.6, h + 8, () => { game.ui.overlay = 'evoShop'; });
    if (fxg && pulse > 0) { ctx.save(); ctx.globalAlpha = pulse; txt(ctx, '+' + fxg.n, gx + h * 1.2, y + h * 1.7 - (1 - pulse) * h * 0.5, px, C('#9be0ff')); ctx.restore(); }
    if (game.evoCoinFx) { const cf = game.evoCoinFx, k = U.clamp(1 - (now - cf.t0) / 1100, 0, 1); if (k <= 0) game.evoCoinFx = null; else { ctx.save(); ctx.globalAlpha = k; txt(ctx, '+' + U.formatInt(cf.n), x0 + cw * 0.5, y + h * 1.7 - (1 - k) * h * 0.5, px, C('#ffd54a')); ctx.restore(); } }
    if (o.close) { const r = h * 0.62, cx = W - W * 0.07 - r * 0.2, cy = y + h * 1.0; closeX(ctx, cx, cy, r); hit(ui, cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4, o.close); }
    else if (!o.noGear) { const gr = h * 0.62, gcx = W - W * 0.07 - gr * 0.2, gcy = y + h / 2; ctx.beginPath(); ctx.arc(gcx, gcy + gr * 0.1, gr, 0, 6.2832); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill(); ctx.beginPath(); ctx.arc(gcx, gcy, gr, 0, 6.2832); const g = ctx.createLinearGradient(0, gcy - gr, 0, gcy + gr); g.addColorStop(0, C('#5ab8ff')); g.addColorStop(1, C('#1f6ed8')); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2.5, gr * 0.14); ctx.strokeStyle = C('#d6efff'); ctx.stroke(); gear(ctx, gcx, gcy, gr * 0.66); hit(ui, gcx - gr, gcy - gr, gr * 2, gr * 2, () => { ui.overlay = 'msettings'; });
      const sr = gr * 0.82, scx = gcx, scy = gcy + gr * 2.15; btn(ctx, scx - sr, scy - sr * 0.8, sr * 2, sr * 1.6, sr * 0.4, K.purple); txt(ctx, T.id, scx, scy - sr * 0.1, sr * 1.25, C('#fff'), { sw: 0.2, stroke: K.purple[3] }); txt(ctx, 'STYLE', scx, scy + sr * 0.62, sr * 0.5, C('#fff'), { sw: 0.2, stroke: K.purple[3], shadow: false }); hit(ui, scx - sr * 1.2, scy - sr, sr * 2.4, sr * 2, () => cycleTheme(game)); }
    return y + h;
  }
  // ---------- carte d'amelioration (dimensions de la reference) ----------
  function card(ctx, game, E, S, id, x, y, cw, ch, now) {
    const n = S[id], cost = E.nextCost(game, id), can = cost !== null && S.coins >= cost, tint = { rk: K.red, la: K.green, cm: K.orange }[id], tcol = tint[1];
    const name = id === 'rk' ? 'FUSEE' : id === 'la' ? 'LANCEUR' : 'REVENU';
    // cases : pleines des qu'un palier est termine (elles ne bougent plus ensuite : on continue a monter a l'infini)
    const full = id === 'rk' ? n >= 20 : id === 'la' ? n >= 10 : n >= 5, tdone = full ? 5 : id === 'rk' ? E.rocket(n).s : id === 'la' ? E.launcher(n).s : n;
    const shk = game.evoShake && game.evoShake.id === id && now - game.evoShake.t0 < 350 ? Math.sin((now - game.evoShake.t0) / 25) * cw * 0.03 : 0, bt = game.evoBought, bk = bt && bt.id === id ? U.clamp(1 - (now - bt.t0) / 520, 0, 1) : 0, k2 = 1 + 0.06 * Math.sin(bk * 3.1416);
    const rx = x + shk, ccx = rx + cw / 2, ccy = y + ch / 2;
    ctx.save(); ctx.translate(ccx, ccy); ctx.scale(k2, k2); ctx.translate(-ccx, -ccy);
    path(ctx, rx, y + ch * 0.012, cw, ch, cw * 0.07); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill();
    frame(ctx, rx, y, cw, ch, cw * 0.07, C('#dfe6ee'), C('#ffffff'), Math.max(3, cw * 0.025)); if (T.rivets) rivets(ctx, rx, y, cw, ch, cw * 0.05);
    const hh = ch * 0.11, hx = rx + cw * 0.04, hw = cw * 0.92; path(ctx, hx, y + ch * 0.015, hw, hh, hh * 0.28); const hg = ctx.createLinearGradient(0, y, 0, y + hh); hg.addColorStop(0, C('#6a8cc8')); hg.addColorStop(1, C('#3c5a9a')); ctx.fillStyle = hg; ctx.fill(); ctx.lineWidth = Math.max(1.5, ch * 0.006); ctx.strokeStyle = C('#2a4478'); ctx.stroke();
    txt(ctx, name, hx + hw * 0.44, y + ch * 0.015 + hh * 0.5, fit(ctx, name, hw * 0.66, hh * 0.78), C('#fff'), { sw: 0.2 });
    const ay = y + ch * 0.135, ah = ch * 0.52, ax = rx + cw * 0.045, aw = cw * 0.91; ctx.save(); path(ctx, ax, ay, aw, ah, cw * 0.04); ctx.clip(); const sg = ctx.createLinearGradient(0, ay, 0, ay + ah); sg.addColorStop(0, C('#5cb4f0')); sg.addColorStop(1, C('#d4efff')); ctx.fillStyle = sg; ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = C('rgba(255,255,255,0.8)'); for (const [fx, fy, fr] of [[0.25, 0.25, 0.14], [0.78, 0.7, 0.17], [0.7, 0.2, 0.1]]) { ctx.beginPath(); ctx.ellipse(ax + aw * fx, ay + ah * fy, aw * fr, ah * fr * 0.55, 0, 0, 6.2832); ctx.ellipse(ax + aw * (fx - fr * 0.7), ay + ah * (fy + 0.02), aw * fr * 0.6, ah * fr * 0.4, 0, 0, 6.2832); ctx.fill(); }
    const ix = ax + aw / 2, iy = ay + ah / 2;
    if (id === 'rk') { const L = E.livery(game), r0 = E.rocket(n); rocket(ctx, ix, iy - ah * 0.03, ah * 0.19, r0.tier, true, r0.tier >= 2 ? L : null); }
    else if (id === 'la') pistonArt(ctx, ix, iy, ah * 0.17, E.launcher(n).tier);
    else { walletArt(ctx, ix, iy + ah * 0.05, ah * 0.16); const ms = 'X' + f1(E.mult(n)); txt(ctx, ms, ix, ay + ah * 0.18, fit(ctx, ms, aw * 0.8, ah * 0.2), C('#ffd54a'), { sw: 0.22, stroke: C('#7a3504') }); }
    ctx.restore(); path(ctx, ax, ay, aw, ah, cw * 0.04); ctx.lineWidth = Math.max(2, cw * 0.018); ctx.strokeStyle = C('#ffffff'); ctx.stroke();
    { const br = cw * 0.15, bx2 = rx + cw - br * 0.55, by2 = y + br * 0.28; badgeShape(ctx, bx2, by2, br, C('#1d2f66'), C('#ffffff'), Math.max(2.5, br * 0.14)); const lv = String(n + 1); txt(ctx, lv, bx2, by2 + br * 0.04, fit(ctx, lv, br * 1.5, br * 1.0), C('#fff'), { sw: 0.12, shadow: false }); }
    { const sw = cw * 0.15, sgap = cw * 0.02, tot = 5 * sw + 4 * sgap, sx0 = rx + cw / 2 - tot / 2, sy0 = y + ch * 0.685; for (let k = 0; k < 5; k++) { const on = k < tdone; path(ctx, sx0 + k * (sw + sgap), sy0, sw, ch * 0.07, ch * 0.015); ctx.fillStyle = on ? (full ? C('#ffc21f') : tcol) : C('#c2c8d0'); ctx.fill(); ctx.lineWidth = Math.max(1.5, ch * 0.006); ctx.strokeStyle = C('#ffffff'); ctx.stroke(); } }
    const bx = rx + cw * 0.045, bw = cw * 0.91, by = y + ch * 0.775, bh = ch * 0.2, frac = cost === null ? 1 : U.clamp(S.coins / cost, 0, 1);
    btn(ctx, bx, by, bw, bh, bh * 0.2, tint, { dim: can ? 0 : 0.5 });
    if (!can && frac > 0) { ctx.save(); path(ctx, bx, by, bw, bh * 0.9, bh * 0.2); ctx.clip(); const fg = ctx.createLinearGradient(0, by, 0, by + bh); fg.addColorStop(0, tint[0]); fg.addColorStop(1, tint[1]); ctx.fillStyle = fg; ctx.globalAlpha = 0.92; ctx.fillRect(bx, by, bw * frac, bh); ctx.restore(); }
    txt(ctx, 'AMELIORER', bx + bw / 2, by + bh * 0.3, fit(ctx, 'AMELIORER', bw * 0.88, bh * 0.3), C('#fff'), { stroke: tint[3], sw: 0.2 });
    { const ps = U.formatInt(cost), pp = fit(ctx, ps, bw * 0.6, bh * 0.32), pw = tw(ctx, ps, pp) + pp * 1.3; coin(ctx, bx + bw / 2 - pw / 2 + pp * 0.45, by + bh * 0.66, pp * 0.5); txt(ctx, ps, bx + bw / 2 - pw / 2 + pp * 1.2, by + bh * 0.66, pp, C('#fff'), { align: 'left', stroke: tint[3], sw: 0.2 }); }
    if (bk > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (bk * 0.4) + ')'; path(ctx, rx, y, cw, ch, cw * 0.07); ctx.fill(); }
    ctx.restore();
    return { id, rx, y, cw, ch, can, full, ax, ay, aw, ah, cost };
  }

  // ---------- MENU ----------
  Home.drawEvo = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), last = game.evoLast, now = performance.now(), cx = W / 2, anim = game.evoAnim;
    topBar(ui, ctx, game, W, T0, u, S, E);
    if (anim) { const a = U.clamp(anim.t / 0.4, 0, 1) * (1 - U.smooth(anim.dur - 0.6, anim.dur, anim.t)), name = anim.label + ' !'; ctx.save(); ctx.globalAlpha = a; txt(ctx, name, cx, Y(0.2), fit(ctx, name, W * 0.9, u * 0.16), C('#ffc21f'), { stroke: C('#7a3504') }); txt(ctx, 'NOUVELLE PIECE', cx, Y(0.275), u * 0.07, C('#fff')); ctx.restore(); return; }
    { const g = ctx.createLinearGradient(0, Y(0.66), 0, Y(0.73)); g.addColorStop(0, C('rgba(6,12,30,0)')); g.addColorStop(1, C('rgba(6,12,30,0.7)')); ctx.fillStyle = g; ctx.fillRect(0, Y(0.66), W, Y(0.73) - Y(0.66)); ctx.fillStyle = C('rgba(6,12,30,0.7)'); ctx.fillRect(0, Y(0.73), W, HH); }
    if (last && last.zone2) {
      const NAMES = { rk5: 'AILES', rk10: 'REACTEUR', rk15: 'TURBO', weak: '1ER ENNEMI TROP FORT', d300: '300 M', d1000: '1000 M', d2000: '2000 M', boss: 'BOSS VAINCU' };
      const ms = Object.keys(S.marks || {}).filter((k) => NAMES[k]).sort((a, b) => S.marks[a].sec - S.marks[b].sec).slice(0, 6), ph = HH * (0.1 + ms.length * 0.045);
      frame(ctx, W * 0.06, Y(0.16), W * 0.88, ph, 16, C('rgba(14,30,80,0.9)'), C('#fff')); txt(ctx, '+' + (game.evoClearBonus || 600) + ' PIECES', cx, Y(0.2), u * 0.08, C('#ffd54a'));
      ms.forEach((k, i) => txt(ctx, NAMES[k] + '  -  VOL ' + S.marks[k].run + '  ' + E.fmt(S.marks[k].sec), cx, Y(0.255 + i * 0.045), fit(ctx, NAMES[k] + '  -  VOL 99  99:99', W * 0.8, u * 0.05), k === 'boss' ? C('#ffd54a') : C('#fff'), { sw: 0.14 }));
    }
    // colonne de gauche : boutique, sans pub, gemme gratuite
    const s0 = u * 0.17, lx = W * 0.04, ly0 = Y(0.19), free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
    store(ctx, lx + s0 / 2, ly0 + s0 / 2, s0 * 0.44); hit(ui, lx, ly0, s0, s0, () => { ui.overlay = 'evoShop'; });
    if (!(game.meta && game.meta.noAds)) { const y = ly0 + s0 * 1.15; adIcon(ctx, lx + s0 / 2, y + s0 / 2, s0 * 0.46); hit(ui, lx, y, s0, s0, () => { ui.overlay = 'evoShop'; }); }
    { const y = ly0 + s0 * 2.3; gem(ctx, lx + s0 * 0.5, y + s0 * 0.5, s0 * 0.4); txt(ctx, 'X1', lx + s0 * 0.88, y + s0 * 0.14, s0 * 0.3, C('#fff'), { sw: 0.22 }); playTicket(ctx, lx + s0 * 0.2, y + s0 * 0.82, s0 * 0.17); txt(ctx, free + '/3', lx + s0 * 0.55, y + s0 * 0.88, s0 * 0.26, C('#fff'), { sw: 0.22 }); hit(ui, lx, y, s0, s0 * 1.05, () => { if (free > 0) E.gemAd(game, true); else ui.overlay = 'evoShop'; }); }
    // colonne de droite : coffre (toutes les 2 h), niveau
    { const unlocked = S.runs >= 3, ready = E.chestReady(game), wait = Math.max(0, (S.chestAt || 0) - Date.now()), rx0 = W * 0.96 - s0, y = ly0;
      chest(ctx, rx0 + s0 / 2, y + s0 * 0.42, s0 * 0.4, false, ready ? 0.4 + 0.25 * Math.sin(now / 240) : 0); if (!unlocked) { ctx.fillStyle = C('rgba(8,16,40,0.55)'); path(ctx, rx0, y, s0, s0 * 0.85, 12); ctx.fill(); lockIcon(ctx, rx0 + s0 / 2, y + s0 * 0.42, s0 * 0.26); }
      const lab = !unlocked ? '3 VOLS' : ready ? 'OUVRIR' : secFmt(wait), pw = s0 * 1.05, ph = s0 * 0.3, py = y + s0 * 0.88; btn(ctx, rx0 + s0 / 2 - pw / 2, py, pw, ph, ph * 0.4, ready ? K.green : K.blue); txt(ctx, lab, rx0 + s0 / 2, py + ph * 0.45, fit(ctx, lab, pw * 0.88, ph * 0.62), C('#fff'), { sw: 0.2 });
      if (unlocked) hit(ui, rx0 - 4, y, s0 + 8, s0 * 1.25, () => E.openChest(game));
      if (E.stage) { const y2 = y + s0 * 1.45; btn(ctx, rx0 + s0 * 0.1, y2, s0 * 0.8, s0 * 0.5, s0 * 0.14, K.purple); const nl = 'NIV ' + E.stage(game); txt(ctx, nl, rx0 + s0 * 0.5, y2 + s0 * 0.24, fit(ctx, 'NIV 2', s0 * 0.7, s0 * 0.3), C('#fff'), { sw: 0.2 }); hit(ui, rx0, y2, s0, s0 * 0.55, () => { game.evoLvPop = !game.evoLvPop; }); }
      if (game.evoLvPop && E.stage) { const stg = E.stage(game), pw2 = W * 0.5, rh = u * 0.15, px0 = W * 0.96 - pw2, py0 = y + s0 * 2.15;
        hit(ui, px0, py0, pw2, rh * 2, () => {}); frame(ctx, px0, py0 - u * 0.02, pw2, rh * 2 + u * 0.04, 14, C('rgba(14,30,80,0.95)'), C('#fff'));
        for (let nn = 1; nn <= 2; nn++) { const yy = py0 + (nn - 1) * rh, open = nn === 1 || !!S.clr1, on = stg === nn; if (on) { ctx.fillStyle = C('rgba(63,196,30,0.35)'); ctx.fillRect(px0 + 4, yy + 2, pw2 - 8, rh - 4); } txt(ctx, 'NIVEAU ' + nn, px0 + u * 0.05, yy + rh / 2, u * 0.06, open ? C('#fff') : C('#7a88a8'), { align: 'left' }); if (!open) lockIcon(ctx, px0 + pw2 - u * 0.09, yy + rh / 2, u * 0.05); hit(ui, px0, yy, pw2, rh, () => { game.evoLvPop = false; if (open && !on) E.switchStage(game, nn); }); }
        hit(ui, 0, T0, W, HH, () => { game.evoLvPop = false; }); } }
    { const p = 1 + 0.03 * Math.sin(now / 280), s = 'APPUYEZ POUR VOLER'; ctx.save(); ctx.translate(cx, Y(0.69)); ctx.scale(p, p); txt(ctx, s, 0, 0, fit(ctx, s, W * 0.86, u * 0.095), C('#fff'), { sw: 0.24 }); ctx.restore(); }
    // trois cartes : LANCEUR, FUSEE, REVENU (comme dans la reference)
    const cw = W * 0.27, gap = (W * 0.92 - cw * 3) / 2, cy0 = Y(0.745), chh = HH * 0.225, cards = [];
    ['la', 'rk', 'cm'].forEach((id, i) => cards.push(card(ctx, game, E, S, id, W * 0.04 + i * (cw + gap), cy0, cw, chh, now)));
    for (const c of cards) if (c.id === 'rk' && S.rk >= 20) { const r = c.cw * 0.12, bx = c.ax + r * 1.1, by = c.ay + c.ah - r * 1.1; ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.2832); ctx.fillStyle = K.purple[1]; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C('#fff'); ctx.stroke(); for (const [dx, dy, col] of [[-0.38, -0.2, C('#ff5a5a')], [0.1, -0.42, C('#ffd23a')], [0.42, 0.05, C('#3ae04a')], [-0.1, 0.36, C('#3aa8ff')]]) { ctx.beginPath(); ctx.arc(bx + dx * r, by + dy * r, r * 0.2, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); } hit(ui, bx - r * 1.2, by - r * 1.2, r * 2.4, r * 2.4, () => { ui.overlay = 'evoSkins'; }); }
    for (const c of cards) if (!c.can) { const gc = E.gemCost(game, c.id), have = (S.gems || 0) >= gc, r = c.cw * 0.115, gx = c.ax + c.aw - r * 0.9, gy = c.ay + r * 1.05;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, 6.2832); ctx.fillStyle = have ? C('#2b7ae8') : C('#6a3ab8'); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C('#fff'); ctx.stroke(); if (have) { gem(ctx, gx - r * 0.2, gy - r * 0.05, r * 0.5); txt(ctx, String(gc), gx + r * 0.42, gy + r * 0.3, r * 0.7, C('#fff'), { sw: 0.2, shadow: false }); } else { gem(ctx, gx, gy - r * 0.1, r * 0.52); playTicket(ctx, gx + r * 0.45, gy + r * 0.5, r * 0.34); }
      hit(ui, gx - r * 1.3, gy - r * 1.3, r * 2.6, r * 2.6, () => E.buyGem(game, c.id)); }
    for (const c of cards) hit(ui, c.rx, c.y, c.cw, c.ch, () => E.buy(game, c.id));
    { const ch = game.evoChest; if (ch) { const k = (now - ch.t0) / 1000; if (k > 3.2) game.evoChest = null; else {
      const a = U.clamp(k / 0.25, 0, 1) * U.clamp((3.2 - k) / 0.4, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C('rgba(4,10,30,0.8)'); ctx.fillRect(0, T0, W, HH); chest(ctx, cx, Y(0.32), u * 0.22, k > 0.35, 0.6);
      const t1 = '+' + U.formatInt(ch.coins), t2 = '+' + ch.gems, p1 = u * 0.13; coin(ctx, cx - tw(ctx, t1, p1) / 2 - p1 * 0.6, Y(0.5), p1 * 0.5); txt(ctx, t1, cx + p1 * 0.3, Y(0.5), p1, C('#ffd54a')); gem(ctx, cx - tw(ctx, t2, p1) / 2 - p1 * 0.6, Y(0.59), p1 * 0.5); txt(ctx, t2, cx + p1 * 0.3, Y(0.59), p1, C('#9be0ff')); ctx.restore(); hit(ui, 0, T0, W, HH, () => { game.evoChest = null; }); } } }
    // toucher la scene : charger le piston (en dernier : les boutons gardent la priorite)
    hit(ui, 0, Y(0.1), W, Y(0.74) - Y(0.1), () => { game.evoLvPop = false; E.start(game); E.holdStart(game); }, true);
  };

  // ---------- JAUGE DE PRESSION (lancement au piston) ----------
  Home.drawEvoAim = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, E = CC.EVO, a = game.evoAim, cx = W / 2, now = performance.now();
    if (!a || a.auto) return; const Z = E.pressZones(game), ch = a.ch || 0;
    const R = u * 0.3, ccx = cx, ccy = Y(0.9), a0 = Math.PI, a1 = 2 * Math.PI, ang = (v) => a0 + (a1 - a0) * v;
    ctx.save(); ctx.beginPath(); ctx.arc(ccx, ccy, R * 1.12, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fillStyle = C('rgba(8,16,44,0.82)'); ctx.fill(); ctx.lineWidth = Math.max(3, R * 0.04); ctx.strokeStyle = C('#e8eef8'); ctx.stroke();
    const arc = (v0, v1, col) => { ctx.beginPath(); ctx.arc(ccx, ccy, R * 0.86, ang(v0), ang(v1)); ctx.lineWidth = R * 0.2; ctx.lineCap = 'butt'; ctx.strokeStyle = col; ctx.stroke(); };
    arc(0, Z.yel0, C('#e0312a')); arc(Z.yel0, Z.green0, C('#f08a1a')); arc(Z.green0, Z.gold0, C('#3fc41e')); const gp = a.hold || a.lock ? 1 : 0.8 + 0.2 * Math.sin(now / 160); arc(Z.gold0, Z.gold1, gp > 0.9 ? C('#ffe36a') : C('#ffc21f')); arc(Z.gold1, 1, C('#e0312a'));
    const na = ang(Math.min(1, ch)), nl = R * 0.8; ctx.beginPath(); ctx.moveTo(ccx - Math.cos(na) * R * 0.1, ccy - Math.sin(na) * R * 0.1); ctx.lineTo(ccx + Math.cos(na) * nl, ccy + Math.sin(na) * nl); ctx.lineWidth = Math.max(4, R * 0.07); ctx.lineCap = 'round'; ctx.strokeStyle = C('#fff'); ctx.stroke(); ctx.beginPath(); ctx.arc(ccx, ccy, R * 0.1, 0, 6.2832); ctx.fillStyle = C('#fff'); ctx.fill(); ctx.restore();
    if (!a.lock) { const s = a.hold ? 'RELACHE !' : 'MAINTIENS POUR CHARGER', pk = a.hold ? 1 + 0.06 * Math.sin(now / 70) : 1; ctx.save(); ctx.translate(cx, Y(0.68)); ctx.scale(pk, pk); txt(ctx, s, 0, 0, fit(ctx, s, W * 0.9, u * 0.085), a.hold && ch >= Z.gold0 && ch <= Z.gold1 ? C('#ffd54a') : C('#fff')); ctx.restore(); }
    else { const col = { gold: C('#ffd54a'), green: C('#7aff6a'), yellow: C('#ffe08a'), red: C('#ff7a6a') }[a.zone], k = U.clamp(a.lockT / 0.12, 0, 1); txt(ctx, a.word, cx, Y(0.45) - (1 - k) * u * 0.03, fit(ctx, a.word, W * 0.9, u * 0.15) * (0.8 + 0.2 * k), col, { stroke: C('#14285a') }); }
    hit(ui, 0, 0, W, H, () => {}, true);
  };

  // ---------- RAPPORT DE VOL (sur le lieu du crash) ----------
  Home.drawEvoReport = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), last = game.evoLast, now = performance.now(), cx = W / 2;
    if (!last) { game.ui.overlay = 'evo'; return; }
    if (!last.t0) last.t0 = now; const tt = (now - last.t0) / 1000, adsOn = !!(game.ads && game.ads.enabled());
    { const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, C('rgba(6,14,40,0.62)')); g.addColorStop(0.55, C('rgba(6,14,40,0.28)')); g.addColorStop(1, C('rgba(6,14,40,0.7)')); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); }
    topBar(ui, ctx, game, W, T0, u, S, E, { noGear: true });
    const tk = U.clamp(tt / 0.4, 0, 1), sc = 0.7 + 0.3 * ease(tk);
    ctx.save(); ctx.globalAlpha = tk; ctx.translate(cx, Y(0.16)); ctx.scale(sc, sc); txt(ctx, 'RAPPORT DE VOL', 0, 0, fit(ctx, 'RAPPORT DE VOL', W * 0.92, u * 0.15), C('#fff'), { grad: [C('#fff2a0'), C('#ff9a18')], stroke: C('#7a3504'), sw: 0.2 }); ctx.restore();
    const px0 = W * 0.06, pw = W * 0.88, py0 = Y(0.235), rowH = u * 0.15, rows = [];
    rows.push({ k: 'pin', lab: 'DISTANCE PARCOURUE', val: last.lines[0] ? last.lines[0][1] : 0, sub: last.dist + ' M', t: 0 });
    if (last.kills) rows.push({ k: 'kill', lab: 'ENNEMIS DETRUITS', val: last.lines.length > 1 && /^ENNEMIS/.test(last.lines[1][0]) ? last.lines[1][1] : 0, sub: String(last.kills), t: 0 });
    for (const ln of last.lines) if (/^PUB/.test(ln[0])) rows.push({ k: 'ad', lab: 'BONUS PUB', val: ln[1], sub: ln[0].replace('PUB ', ''), t: ln[2] || 0 });
    const totH = rowH * 1.3, ph = rowH * rows.length + totH + u * 0.1;
    path(ctx, px0, py0 + ph * 0.02, pw, ph, u * 0.07); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill(); frame(ctx, px0, py0, pw, ph, u * 0.07, C('#1f56d8'), C('#0b2a78'), Math.max(4, u * 0.02)); frame(ctx, px0 + u * 0.012, py0 + u * 0.012, pw - u * 0.024, ph - u * 0.024, u * 0.06, null, C('#6fa4ff'), 2); if (T.rivets) rivets(ctx, px0, py0, pw, ph, u * 0.03);
    rows.forEach((r, i) => { const a = r.t ? U.clamp((now - r.t) / 350, 0, 1) : U.clamp((tt - 0.25 - i * 0.16) / 0.3, 0, 1), y = py0 + u * 0.04 + i * rowH; ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * u * 0.03);
      const fl = r.k === 'ad' && r.t ? U.clamp(1 - (now - r.t) / 900, 0, 1) : 0; frame(ctx, px0 + u * 0.035, y, pw - u * 0.07, rowH * 0.86, rowH * 0.3, fl > 0 ? mix(C('#2d6af0'), C('#c050ff'), fl) : C('#2d6af0'), C('#5a92ff'), 2);
      if (r.k === 'pin') { ctx.beginPath(); ctx.arc(px0 + u * 0.13, y + rowH * 0.4, rowH * 0.22, 0, 6.2832); ctx.fillStyle = C('#e8362e'); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C('#fff'); ctx.stroke(); ctx.beginPath(); ctx.arc(px0 + u * 0.13, y + rowH * 0.37, rowH * 0.08, 0, 6.2832); ctx.fillStyle = C('#fff'); ctx.fill(); }
      else if (r.k === 'kill') txt(ctx, 'X', px0 + u * 0.13, y + rowH * 0.43, rowH * 0.5, C('#ff6a5a')); else txt(ctx, '>>', px0 + u * 0.13, y + rowH * 0.43, rowH * 0.4, C('#8aff7a'));
      txt(ctx, r.lab, px0 + u * 0.22, y + rowH * 0.3, fit(ctx, r.lab, pw * 0.42, rowH * 0.26), C('#dff0ff'), { align: 'left', sw: 0.18 }); txt(ctx, r.sub, px0 + u * 0.22, y + rowH * 0.62, rowH * 0.3, C('#fff'), { align: 'left', sw: 0.18 });
      const vs = U.formatInt(Math.round(r.val * ease(r.t ? (now - r.t) / 900 : tt / 1.0))), vp = fit(ctx, vs, pw * 0.3, rowH * 0.5); txt(ctx, vs, px0 + pw - u * 0.15, y + rowH * 0.43, vp, C('#ffd54a'), { align: 'right', stroke: C('#6a3406') }); coin(ctx, px0 + pw - u * 0.1, y + rowH * 0.43, vp * 0.4); ctx.restore(); });
    { const y = py0 + u * 0.04 + rowH * rows.length, a = U.clamp((tt - 0.5 - rows.length * 0.16) / 0.35, 0, 1); ctx.save(); ctx.globalAlpha = a;
      const dtm = Math.min(0.1, (now - (last._tn || now)) / 1000); last._tn = now; if (last.disp === undefined) last.disp = 0; if (tt > 0.5) last.disp += (last.total - last.disp) * (1 - Math.exp(-dtm * 5)); if (Math.abs(last.total - last.disp) < 1) last.disp = last.total;
      const pop = 1 + 0.06 * U.clamp(1 - (now - (last.popT || 0)) / 300, 0, 1); ctx.translate(cx, y + totH / 2); ctx.scale(pop, pop); ctx.translate(-cx, -(y + totH / 2));
      frame(ctx, px0 + u * 0.035, y, pw - u * 0.07, totH, rowH * 0.3, C('#ffb21a'), C('#fff0a8'), 4); ctx.save(); path(ctx, px0 + u * 0.035, y, pw - u * 0.07, totH, rowH * 0.3); ctx.clip(); ctx.fillStyle = C('rgba(255,255,255,0.28)'); ctx.fillRect(px0, y, pw, totH * 0.42); ctx.restore();
      txt(ctx, 'TOTAL', cx, y + totH * 0.24, totH * 0.26, C('#fff'), { stroke: C('#7a3504') }); const vs = U.formatInt(Math.round(last.disp)), vp = fit(ctx, vs, pw * 0.5, totH * 0.46), vw = tw(ctx, vs, vp); txt(ctx, vs, cx - vp * 0.3, y + totH * 0.66, vp, C('#fff'), { stroke: C('#7a3504'), sw: 0.2 }); coin(ctx, cx + vw / 2 + vp * 0.2, y + totH * 0.66, vp * 0.38);
      if (last.fx) { const k = U.clamp(1 - (now - last.fx.t0) / 1300, 0, 1); if (k > 0) txt(ctx, '+' + U.formatInt(last.fx.n), px0 + pw - u * 0.13, y + totH * 0.35 - (1 - k) * totH * 0.9, u * 0.09, C('#d8a0ff'), { align: 'right', stroke: C('#401068') }); }
      ctx.restore(); }
    if (last.record && Math.sin(now / 150) > -0.5) txt(ctx, 'NOUVEAU RECORD !', cx, py0 + ph + u * 0.07, u * 0.075, C('#ffd54a'), { stroke: C('#7a3504') });
    const by0 = py0 + ph + u * 0.14;
    if (adsOn && tt > 0.9) {
      const bw = W * 0.88, bh = u * 0.25, bx = cx - bw / 2; path(ctx, bx, by0 + 4, bw, bh, u * 0.06); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill(); frame(ctx, bx, by0, bw, bh, u * 0.06, C('#9a3ae0'), C('#ffffff'), 4); frame(ctx, bx + 5, by0 + 5, bw - 10, bh - 10, u * 0.05, null, C('#c870ff'), 2);
      const sw2 = bw * 0.9, sx = cx - sw2 / 2, sY = by0 + bh * 0.5, sh = bh * 0.3, X = (v) => sx + sw2 * (v + 1) / 2;
      if (!last.mult) last.cur = Math.sin((now - last.t0) / 520); const lock = !!last.mult, pos = lock ? last.mult.p : last.cur, mv = lock ? last.mult.m : multAt(pos);
      const edges = [[-1, -0.75, 1.5], [-0.75, -0.45, 2], [-0.45, -0.2, 3], [-0.2, 0.2, 4], [0.2, 0.45, 3], [0.45, 0.75, 2], [0.75, 1, 1.5]];
      ctx.save(); path(ctx, sx, sY, sw2, sh, sh * 0.35); ctx.clip(); for (const [v0, v1, m] of edges) { ctx.fillStyle = C(MCOL[m]); ctx.fillRect(X(v0), sY, X(v1) - X(v0) + 1, sh); } ctx.fillStyle = C('rgba(255,255,255,0.28)'); ctx.fillRect(sx, sY, sw2, sh * 0.42); ctx.restore(); path(ctx, sx, sY, sw2, sh, sh * 0.35); ctx.lineWidth = Math.max(2.5, sh * 0.1); ctx.strokeStyle = C('#2a0e56'); ctx.stroke();
      for (const [v0, v1, m] of edges) { const lbl = 'x' + (m === 1.5 ? '1,5' : m); txt(ctx, lbl, (X(v0) + X(v1)) / 2, by0 + bh * 0.25, fit(ctx, lbl, (X(v1) - X(v0)) * 0.95, bh * 0.2), m === 4 ? C('#ffd54a') : m === 3 ? C('#8aff7a') : m === 2 ? C('#8ac4ff') : C('#ff9a8a'), { stroke: C('#2a0e56'), sw: 0.24, shadow: false }); }
      const x = X(pos); ctx.fillStyle = C('#fff'); ctx.strokeStyle = C('#2a0e56'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - sh * 0.3, sY - sh * 0.62); ctx.lineTo(x + sh * 0.3, sY - sh * 0.62); ctx.lineTo(x, sY - sh * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = C('#2a60e8'); ctx.fillRect(x - 3, sY - sh * 0.05, 6, sh * 1.1); ctx.strokeRect(x - 3, sY - sh * 0.05, 6, sh * 1.1);
      const b2y = by0 + bh + u * 0.05, b2h = u * 0.18, wA = bw * 0.6, wB = bw * 0.36;
      if (!last.doubled) { btn(ctx, bx, b2y, wA, b2h, b2h * 0.22, K.purple); playTicket(ctx, bx + wA - b2h * 0.28, b2y + b2h * 0.04, b2h * 0.3); const s1 = 'MULTIPLIER', s2 = 'ET RECUPERER'; txt(ctx, s1, bx + wA * 0.48, b2y + b2h * 0.32, fit(ctx, s1, wA * 0.8, b2h * 0.3), C('#fff'), { stroke: K.purple[3], sw: 0.2 }); txt(ctx, s2, bx + wA * 0.48, b2y + b2h * 0.62, fit(ctx, s2, wA * 0.8, b2h * 0.3), C('#fff'), { stroke: K.purple[3], sw: 0.2 });
        hit(ui, bx, b2y, wA, b2h, () => { if (last.mult) return; last.mult = { m: mv, p: pos }; game.audio.play('uiTick'); setTimeout(() => game.ads.rewarded(() => E.multiply(game, mv), null, 'coins', 'PIECES X' + (mv === 1.5 ? '1,5' : mv) + '   +' + U.formatInt(Math.round(last.total * (mv - 1)))), 420); }); }
      else txt(ctx, 'BONUS X' + (last.doubled === 1.5 ? '1,5' : last.doubled) + ' AJOUTE', bx + wA / 2, b2y + b2h / 2, fit(ctx, 'BONUS X1,5 AJOUTE', wA * 0.9, b2h * 0.32), C('#e8b0ff'), { stroke: C('#401068') });
      const nx = bx + bw - wB; btn(ctx, nx, b2y, wB, b2h, b2h * 0.22, K.green); txt(ctx, 'SUIVANT', nx + wB / 2, b2y + b2h * 0.45, fit(ctx, 'SUIVANT', wB * 0.86, b2h * 0.4), C('#fff'), { stroke: K.green[3], sw: 0.2 }); hit(ui, nx, b2y, wB, b2h, () => E.afterReport(game));
    } else { const bw = W * 0.6, b2h = u * 0.18, b2y = by0 + u * 0.06, nx = cx - bw / 2; btn(ctx, nx, b2y, bw, b2h, b2h * 0.22, K.green); txt(ctx, 'SUIVANT', cx, b2y + b2h * 0.45, b2h * 0.42, C('#fff'), { stroke: K.green[3], sw: 0.2 }); hit(ui, nx, b2y, bw, b2h, () => E.afterReport(game)); }
  };

  // ---------- BOUTIQUE (meme contenu que la reference) ----------
  const shopBg = (ctx, W, T0, HH) => { const g = ctx.createLinearGradient(0, T0, 0, T0 + HH); g.addColorStop(0, C('#2468e8')); g.addColorStop(1, C('#1646b8')); ctx.fillStyle = g; ctx.fillRect(0, T0, W, HH); ctx.save(); ctx.globalAlpha = 0.09; for (let k = 0; k < 14; k++) plane(ctx, ((k * 137) % 100) / 100 * W, T0 + ((k * 211) % 100) / 100 * HH, W * 0.06, 0.5 + k, C('#fff')); ctx.restore(); };
  Home.drawEvoShop = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), cx = W / 2;
    shopBg(ctx, W, T0, HH);
    { const bh = HH * 0.1; ctx.fillStyle = C('#b95cff'); ctx.fillRect(0, T0, W, bh); const sw = W / 5; for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? C('#e4b4ff') : C('#b95cff'); ctx.fillRect(k * sw, T0, sw, bh); ctx.beginPath(); ctx.arc(k * sw + sw / 2, T0 + bh, sw / 2, 0, Math.PI); ctx.fill(); } if (T.hazard) hazard(ctx, 0, T0, W, bh * 1.0); }
    topBar(ui, ctx, game, W, T0, u, S, E, { close: () => { ui.overlay = 'evo'; } });
    const sec = (y, h, label, pal, icon) => { btn(ctx, W * 0.04, y, W * 0.92, h, h * 0.3, pal); txt(ctx, label, W * 0.2, y + h * 0.46, fit(ctx, label, W * 0.7, h * 0.52), C('#fff'), { align: 'left', stroke: pal[3], sw: 0.2 }); if (icon) icon(ctx, W * 0.1, y + h * 0.46, h * 0.55); };
    const buy = (id) => { if (id === 'noads' || id === 'starter') { const r = game.meta && game.meta.buyNoAds ? game.meta.buyNoAds() : 'no-link'; if (r !== 'no-link') return; } Home.toast(ui, 'ACHAT BIENTOT DISPONIBLE'); };
    sec(Y(0.15), HH * 0.05, 'PACKS SANS PUBLICITE', K.green, (c, x, y, r) => adIcon(c, x, y, r * 0.62));
    { const y = Y(0.215), h = HH * 0.135; frame(ctx, W * 0.04, y, W * 0.92, h, u * 0.05, C('#f6e7c4'), C('#fff0c8'), 3); frame(ctx, W * 0.04 + 2, y + h * 0.62, W * 0.92 - 4, h * 0.38 - 2, u * 0.04, C('#e8cf9c'), null); adIcon(ctx, W * 0.2, y + h * 0.36, h * 0.3); txt(ctx, '+', W * 0.34, y + h * 0.36, h * 0.3, C('#fff'), { sw: 0.24 }); gemPile(ctx, W * 0.5, y + h * 0.36, h * 0.28, 10); txt(ctx, '10', W * 0.5, y + h * 0.6, h * 0.2, C('#fff'), { sw: 0.26 });
      txt(ctx, 'Pack de demarrage', W * 0.08, y + h * 0.8, h * 0.17, C('#fff'), { align: 'left', sw: 0.22 }); const bw = W * 0.28, bh = h * 0.32, bx = W * 0.64, by = y + h * 0.58; btn(ctx, bx, by, bw, bh, bh * 0.3, K.green); txt(ctx, '10,99 €', bx + bw / 2, by + bh * 0.45, fit(ctx, '10,99 €', bw * 0.86, bh * 0.58), C('#fff'), { stroke: K.green[3], sw: 0.2 }); hit(ui, bx, by, bw, bh, () => buy('starter')); }
    { const y = Y(0.365), h = HH * 0.075; frame(ctx, W * 0.04, y, W * 0.92, h, u * 0.05, C('#f6e7c4'), C('#fff0c8'), 3); adIcon(ctx, W * 0.14, y + h * 0.5, h * 0.4); txt(ctx, 'Pas de publicites', W * 0.26, y + h * 0.5, fit(ctx, 'Pas de publicites', W * 0.4, h * 0.3), C('#fff'), { align: 'left', sw: 0.22 }); const bw = W * 0.28, bh = h * 0.5, bx = W * 0.64, by = y + h * 0.25; btn(ctx, bx, by, bw, bh, bh * 0.3, K.green); txt(ctx, '7,99 €', bx + bw / 2, by + bh * 0.45, fit(ctx, '7,99 €', bw * 0.86, bh * 0.6), C('#fff'), { stroke: K.green[3], sw: 0.2 }); hit(ui, bx, by, bw, bh, () => buy('noads')); }
    sec(Y(0.465), HH * 0.05, 'PIERRES PRECIEUSES', K.blue, (c, x, y, r) => gem(c, x, y, r * 0.5));
    const tiles = [{ n: 1, free: true }, { n: 5, p: '2,09 €' }, { n: 10, p: '3,69 €' }, { n: 30, p: '9,99 €', k: 'wallet' }, { n: 100, p: '25,99 €', k: 'crate' }, { n: 250, p: '49,99 €', k: 'steel', best: true }];
    const tw0 = W * 0.285, tg = (W * 0.92 - tw0 * 3) / 2, th = HH * 0.165, free = Math.max(0, 3 - (E.freeGemsUsed ? E.freeGemsUsed(game) : 0));
    tiles.forEach((t, i) => { const x = W * 0.04 + (i % 3) * (tw0 + tg), y = Y(0.525) + Math.floor(i / 3) * (th + HH * 0.012);
      path(ctx, x, y + 4, tw0, th, u * 0.05); ctx.fillStyle = C('rgba(0,0,0,0.28)'); ctx.fill(); frame(ctx, x, y, tw0, th, u * 0.05, C('#ffb81c'), C('#fff'), 4); ctx.save(); path(ctx, x, y, tw0, th, u * 0.05); ctx.clip(); ctx.fillStyle = C('#ffd34a'); ctx.fillRect(x, y, tw0, th * 0.4); ctx.fillStyle = C('rgba(255,255,255,0.35)'); ctx.fillRect(x + tw0 * 0.08, y + th * 0.52, tw0 * 0.84, th * 0.22); ctx.restore();
      const ix = x + tw0 / 2, iy = y + th * 0.3;
      if (t.k === 'wallet') { frame(ctx, ix - tw0 * 0.28, iy - th * 0.12, tw0 * 0.56, th * 0.38, 8, C('#9a5a28'), C('#5a3410'), 3); ctx.beginPath(); ctx.arc(ix + tw0 * 0.18, iy + th * 0.06, th * 0.07, 0, 6.2832); ctx.fillStyle = C('#ffd34a'); ctx.fill(); gemPile(ctx, ix, iy - th * 0.08, th * 0.2, 10); }
      else if (t.k === 'crate') { frame(ctx, ix - tw0 * 0.28, iy - th * 0.08, tw0 * 0.56, th * 0.36, 6, C('#b8782e'), C('#5a3410'), 3); ctx.strokeStyle = C('#5a3410'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix - tw0 * 0.28, iy - th * 0.08); ctx.lineTo(ix + tw0 * 0.28, iy + th * 0.28); ctx.stroke(); gemPile(ctx, ix, iy - th * 0.14, th * 0.22, 10); }
      else if (t.k === 'steel') { frame(ctx, ix - tw0 * 0.3, iy - th * 0.05, tw0 * 0.6, th * 0.36, 6, C('#8e98a6'), C('#3a4252'), 3); txt(ctx, 'AIR FORCE', ix, iy + th * 0.14, tw0 * 0.1, C('#dfe6ee'), { sw: 0.2, shadow: false }); gemPile(ctx, ix, iy - th * 0.14, th * 0.24, 10); }
      else gemPile(ctx, ix, iy, th * (t.n <= 1 ? 0.26 : 0.22), t.n);
      txt(ctx, String(t.n), ix, y + th * 0.62, th * 0.2, C('#fff'), { sw: 0.24 });
      const bw = tw0 * 0.9, bh = th * 0.22, bx = x + tw0 * 0.05, by = y + th * 0.74;
      if (t.free) { const dis = free <= 0; btn(ctx, bx, by, bw, bh, bh * 0.3, K.purple, { dim: dis ? 0.5 : 0 }); playTicket(ctx, bx + bh * 0.7, by + bh * 0.45, bh * 0.4, C('#8a58e8')); txt(ctx, 'GRATUIT ' + free + '/3', bx + bw * 0.58, by + bh * 0.45, fit(ctx, 'GRATUIT 3/3', bw * 0.62, bh * 0.5), C('#fff'), { stroke: K.purple[3], sw: 0.2 }); hit(ui, bx, by, bw, bh, () => { if (free > 0) E.gemAd(game, true); }); }
      else { btn(ctx, bx, by, bw, bh, bh * 0.3, K.green); txt(ctx, t.p, bx + bw / 2, by + bh * 0.45, fit(ctx, t.p, bw * 0.86, bh * 0.6), C('#fff'), { stroke: K.green[3], sw: 0.2 }); hit(ui, bx, by, bw, bh, () => buy('gems' + t.n)); }
      if (t.best) { ctx.save(); ctx.translate(x + tw0 * 0.12, y + th * 0.14); ctx.rotate(-0.3); path(ctx, -tw0 * 0.2, -th * 0.07, tw0 * 0.4, th * 0.14, 5); ctx.fillStyle = C('#e8362e'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C('#fff'); ctx.stroke(); txt(ctx, 'BEST VALUE', 0, 0, tw0 * 0.1, C('#fff'), { sw: 0.2, shadow: false }); ctx.restore(); } });
    if (Home.drawToast) Home.drawToast(ui, ctx, L);
  };

  // ---------- APPARENCES (livrees de la fusee) ----------
  Home.drawEvoSkins = function (ui, ctx, game, W, H) {
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), E = CC.EVO, S = E.save(game), cx = W / 2;
    shopBg(ctx, W, T0, HH); topBar(ui, ctx, game, W, T0, u, S, E, { close: () => { ui.overlay = 'evo'; } });
    txt(ctx, 'APPARENCES', cx, Y(0.15), fit(ctx, 'APPARENCES', W * 0.8, u * 0.12), C('#fff'), { grad: [C('#fff2a0'), C('#ff9a18')], stroke: C('#7a3504') });
    const cur = E.livery(game), tw0 = W * 0.42, th = HH * 0.17, gx = W * 0.05, gy = Y(0.2), r0 = E.rocket(S.rk);
    E.LIVERIES.forEach((Lv, i) => { const x = gx + (i % 2) * (tw0 + W * 0.06), y = gy + Math.floor(i / 2) * (th + HH * 0.015), open = S.rk >= Lv.at, on = cur.id === Lv.id;
      path(ctx, x, y + 4, tw0, th, u * 0.05); ctx.fillStyle = C('rgba(0,0,0,0.28)'); ctx.fill(); frame(ctx, x, y, tw0, th, u * 0.05, on ? C('#7ae04a') : C('#ffb81c'), C('#fff'), 4); frame(ctx, x + tw0 * 0.08, y + th * 0.08, tw0 * 0.84, th * 0.62, u * 0.03, C('#bfe6ff'), null);
      ctx.save(); if (!open) ctx.globalAlpha = 0.45; rocket(ctx, x + tw0 / 2, y + th * 0.36, th * 0.11, Math.max(2, r0.tier), false, Lv); ctx.restore();
      txt(ctx, Lv.name, x + tw0 / 2, y + th * 0.82, fit(ctx, Lv.name, tw0 * 0.8, th * 0.16), C('#fff'), { sw: 0.22 });
      if (!open) { lockIcon(ctx, x + tw0 / 2, y + th * 0.36, th * 0.16); txt(ctx, 'NIV ' + (Lv.at + 1), x + tw0 * 0.82, y + th * 0.16, th * 0.13, C('#fff'), { sw: 0.22 }); }
      if (on) txt(ctx, 'ACTIF', x + tw0 * 0.2, y + th * 0.16, th * 0.13, C('#fff'), { stroke: C('#1c6a08'), sw: 0.22 });
      hit(ui, x, y, tw0, th, () => { if (open) E.setLivery(game, Lv.id); }); });
  };

  // ---------- REGLAGES ----------
  const _oldSettings = Home.drawSettings;
  Home.drawSettings = function (ui, ctx, game, W, H) {
    if (!(CC.EVO && CC.EVO.on)) return _oldSettings.call(this, ui, ctx, game, W, H);
    const L = Home.layout(ui, W, H), { HH, u, Y } = L, T0 = Y(0), s = game.settings, cx = W / 2, now = performance.now();
    const vib = ['NON', 'FAIBLE', 'MOYEN', 'FORT'], vibV = s.vibration !== undefined ? s.vibration : 2;
    shopBg(ctx, W, T0, HH);
    txt(ctx, 'REGLAGES', cx, Y(0.075), fit(ctx, 'REGLAGES', W * 0.8, u * 0.14), C('#fff'), { grad: [C('#fff2a0'), C('#ff9a18')], stroke: C('#7a3504') });
    const rows = [
      ['STYLE', true, T.id + ' ' + T.name, () => cycleTheme(game)],
      ['SON', s.sfx > 0, s.sfx > 0 ? 'OUI' : 'NON', () => ui.toggleVolume(game, 'sfx')],
      ['MUSIQUE', s.music > 0, s.music > 0 ? 'OUI' : 'NON', () => ui.toggleVolume(game, 'music')],
      ['VIBRATION', vibV > 0, vib[vibV], () => { s.vibration = (vibV + 1) % 4; if (CC.Haptics) { CC.Haptics.setLevel(s.vibration); CC.Haptics.tick('fire'); } game.applySettings(); }],
      ['GRAPHISMES', true, ui.graphicsLabel(game), () => ui.cycleGraphics(game)],
      ['COMMANDES', true, (s.ctl || 'free') === 'simple' ? 'SIMPLES' : 'LIBRES', () => { s.ctl = (s.ctl || 'free') === 'simple' ? 'free' : 'simple'; game.applySettings(); }],
      ['SENSIBILITE', true, ['DOUCE', 'NORMALE', 'VIVE'][s.touchSens !== undefined ? s.touchSens : 1], () => { s.touchSens = ((s.touchSens !== undefined ? s.touchSens : 1) + 1) % 3; game.applySettings(); }],
      ['PUBS', s.ads !== false, s.ads === false ? 'NON' : 'OUI', () => { s.ads = s.ads === false; game.applySettings(); }],
      ['CODE DE SAUVEGARDE', true, 'COPIER', () => { const c = game.meta.exportCode(); if (!c) return; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(() => Home.toast(ui, 'CODE COPIE'), () => window.prompt('Copie ce code', c)); else window.prompt('Copie ce code', c); }],
      ['RESTAURER UN CODE', true, 'COLLER', () => { const c = window.prompt('Colle ton code de sauvegarde'); if (c) { if (game.meta.importCode(c)) location.reload(); else Home.toast(ui, 'CODE INVALIDE'); } }],
      ['REINITIALISER', false, ui._rst && now - ui._rst < 4000 ? 'SUR ?' : 'GO', () => { if (ui._rst && performance.now() - ui._rst < 4000) { try { localStorage.removeItem('coldimpact.save'); localStorage.removeItem('closecall.save'); } catch (e) { /* ignore */ } location.reload(); } else ui._rst = performance.now(); }],
    ];
    const gap = HH * 0.01, rh = Math.min(u * 0.13, (HH * 0.72) / rows.length - gap), y0 = Y(0.125), x0 = W * 0.06, w = W * 0.88;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + gap), on = inRect(ui, x0, y, w, rh); path(ctx, x0, y + 4, w, rh, rh * 0.3); ctx.fillStyle = C('rgba(0,0,0,0.25)'); ctx.fill(); frame(ctx, x0, y, w, rh, rh * 0.3, on ? C('#f9eed0') : C('#f6e7c4'), C('#fff0c8'), 3);
      txt(ctx, r[0], x0 + rh * 0.4, y + rh / 2, fit(ctx, r[0], w * 0.55, rh * 0.42), C('#fff'), { align: 'left', sw: 0.22 });
      const vw = Math.max(rh * 1.7, tw(ctx, r[2], rh * 0.4) + rh * 0.7), vx = x0 + w - rh * 0.2 - vw, good = r[1];
      btn(ctx, vx, y + rh * 0.12, vw, rh * 0.76, rh * 0.22, good ? K.green : K.grey); txt(ctx, r[2], vx + vw / 2, y + rh * 0.46, fit(ctx, r[2], vw * 0.88, rh * 0.4), C('#fff'), { stroke: good ? K.green[3] : K.grey[3], sw: 0.2 });
      hit(ui, x0, y, w, rh, r[3]);
    });
    if (Home.drawToast) Home.drawToast(ui, ctx, L);
    const bw = W * 0.5, bh = u * 0.15, bx = cx - bw / 2, by = Y(0.92); btn(ctx, bx, by, bw, bh, bh * 0.25, K.green); txt(ctx, 'RETOUR', cx, by + bh * 0.45, bh * 0.44, C('#fff'), { stroke: K.green[3], sw: 0.2 });
    hit(ui, bx, by, bw, bh, () => { ui.overlay = (CC.EVO && CC.EVO.on && game.state === 'MENU') ? 'evo' : null; });
  };

  // ---------- HUD de vol : tres peu d'informations, discretes (compteur, jauge de carburant, progression) ----------
  Home.evoUI.hud = function (ctx, g, W, H, px) {
    const rk = g.rocket, run = g.endlessRun, E = CC.EVO, T = run && run.T; if (!rk || !run) return;
    const top = Math.max(8, H * 0.018), u = W;
    { const R = u * 0.1, dcx = u * 0.04 + R, dcy = top + R, kmh = rk.active ? rk.vel.length() * 3.6 : 0, k = U.clamp(kmh / 260, 0, 1);
      ctx.save(); ctx.beginPath(); ctx.arc(dcx, dcy + R * 0.05, R * 1.03, 0, 6.2832); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill();
      const bz = ctx.createLinearGradient(0, dcy - R, 0, dcy + R); bz.addColorStop(0, C('#ffffff')); bz.addColorStop(1, C('#9aa6b8')); ctx.beginPath(); ctx.arc(dcx, dcy, R, 0, 6.2832); ctx.fillStyle = bz; ctx.fill(); ctx.lineWidth = Math.max(2, R * 0.05); ctx.strokeStyle = C('#3a4a6a'); ctx.stroke();
      ctx.beginPath(); ctx.arc(dcx, dcy, R * 0.86, 0, 6.2832); const fc = ctx.createLinearGradient(0, dcy - R, 0, dcy + R); fc.addColorStop(0, C('#e8f0fa')); fc.addColorStop(0.5, C('#c8d4e4')); fc.addColorStop(0.5, C('#6a768c')); fc.addColorStop(1, C('#4a5670')); ctx.fillStyle = fc; ctx.fill();
      ctx.beginPath(); ctx.arc(dcx, dcy, R * 0.7, Math.PI * 0.9, Math.PI * 2.1); ctx.lineWidth = R * 0.2; ctx.lineCap = 'round'; ctx.strokeStyle = C('rgba(255,255,255,0.7)'); ctx.stroke(); ctx.beginPath(); ctx.arc(dcx, dcy, R * 0.7, Math.PI * 0.9, Math.PI * (0.9 + 1.2 * k)); ctx.strokeStyle = C('#3ab8ff'); ctx.stroke();
      const na = Math.PI * (0.9 + 1.2 * k); ctx.beginPath(); ctx.moveTo(dcx, dcy); ctx.lineTo(dcx + Math.cos(na) * R * 0.62, dcy + Math.sin(na) * R * 0.62); ctx.lineWidth = Math.max(3, R * 0.08); ctx.strokeStyle = C('#14285a'); ctx.stroke(); ctx.beginPath(); ctx.arc(dcx, dcy, R * 0.1, 0, 6.2832); ctx.fillStyle = C('#14285a'); ctx.fill();
      txt(ctx, String(Math.round(kmh)), dcx, dcy + R * 0.42, R * 0.4, C('#fff'), { sw: 0.18 }); txt(ctx, 'KM/H', dcx, dcy + R * 0.7, R * 0.2, C('#fff'), { sw: 0.2, shadow: false }); ctx.restore(); }
    if (E.rocket(E.save(g).rk).tier >= 2 && !(g.evo && g.evo.preview)) {
      const fw = u * 0.44, fh = u * 0.065, fx = u * 0.5 - fw / 2 + u * 0.04, fy = top + u * 0.01, k = U.clamp((rk.active ? rk.fuel : rk.fuelMax) / Math.max(1, rk.fuelMax), 0, 1), low = k < 0.22, blink = low && Math.floor(performance.now() / 260) % 2 === 0;
      ctx.save(); path(ctx, fx, fy + 3, fw, fh, fh / 2); ctx.fillStyle = C('rgba(0,0,0,0.3)'); ctx.fill(); path(ctx, fx, fy, fw, fh, fh / 2); ctx.fillStyle = C('#16306e'); ctx.fill(); ctx.lineWidth = Math.max(2.5, fh * 0.1); ctx.strokeStyle = C('#dfe8f8'); ctx.stroke();
      ctx.save(); path(ctx, fx + fh * 0.12, fy + fh * 0.14, fw - fh * 0.24, fh * 0.72, fh * 0.36); ctx.clip(); ctx.fillStyle = C('#0c1c44'); ctx.fillRect(fx, fy, fw, fh); const col = blink ? C('#ff9a8a') : k > 0.5 ? C('#3fe05a') : k > 0.22 ? C('#ffc21f') : C('#ff4a3a'); ctx.fillStyle = col; ctx.fillRect(fx + fh * 0.12, fy, (fw - fh * 0.24) * k, fh); ctx.fillStyle = C('rgba(255,255,255,0.25)'); ctx.fillRect(fx, fy + fh * 0.14, fw, fh * 0.28); ctx.restore();
      ctx.strokeStyle = C('#8ea4d8'); ctx.lineWidth = Math.max(2, fh * 0.06); for (const t of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(fx + fw * t, fy + fh * 0.16); ctx.lineTo(fx + fw * t, fy + fh * 0.84); ctx.stroke(); }
      txt(ctx, 'E', fx + fh * 0.2, fy + fh * 1.5, fh * 0.55, C('#fff'), { sw: 0.24 }); txt(ctx, 'F', fx + fw - fh * 0.2, fy + fh * 1.5, fh * 0.55, C('#fff'), { sw: 0.24 }); pump(ctx, fx + fw / 2, fy + fh * 1.5, fh * 0.34, C('#fff')); ctx.restore();
      if (low && g.state === 'FLIGHT') { const a = 0.6 + 0.4 * Math.sin(performance.now() / 150); ctx.save(); ctx.globalAlpha = a; const wy = H * 0.4, wr = u * 0.1; ctx.beginPath(); ctx.moveTo(u / 2, wy - wr); ctx.lineTo(u / 2 + wr * 0.95, wy + wr * 0.7); ctx.lineTo(u / 2 - wr * 0.95, wy + wr * 0.7); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = wr * 0.18; ctx.strokeStyle = C('#ff4a3a'); ctx.stroke(); txt(ctx, '!', u / 2, wy + wr * 0.22, wr * 0.95, C('#ff4a3a'), { stroke: C('#ffffff'), sw: 0.1, shadow: false }); txt(ctx, 'PEU DE CARBURANT', u / 2, wy + wr * 1.2, fit(ctx, 'PEU DE CARBURANT', u * 0.8, wr * 0.42), C('#ff4a3a'), { stroke: C('#fff'), sw: 0.18, shadow: false }); ctx.restore(); }
    }
    { const pw = u * 0.055, ph = H * 0.26, bx = u - u * 0.085 - pw / 2, by = top + u * 0.1, pct = U.clamp(run.dist / Math.max(1, (T && T.levelLen) || 5000), 0, 1);
      ctx.save(); path(ctx, bx, by, pw, ph, pw / 2); ctx.fillStyle = C('rgba(70,90,130,0.55)'); ctx.fill(); ctx.lineWidth = Math.max(2, pw * 0.12); ctx.strokeStyle = C('#e8f0fc'); ctx.stroke();
      ctx.save(); path(ctx, bx, by, pw, ph, pw / 2); ctx.clip(); const yy = by + ph * (1 - pct); const pg = ctx.createLinearGradient(0, by, 0, by + ph); pg.addColorStop(0, C('#7ad0ff')); pg.addColorStop(1, C('#2b7ae8')); ctx.fillStyle = pg; ctx.globalAlpha = 0.75; ctx.fillRect(bx, yy, pw, by + ph - yy); ctx.restore();
      path(ctx, bx - pw * 0.25, by - pw * 0.55, pw * 1.5, pw * 0.75, pw * 0.2); ctx.fillStyle = C('#fff'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C('#3a4a6a'); ctx.stroke(); flag(ctx, bx - pw * 0.1, by - pw * 0.48, pw * 1.2, pw * 0.58);
      const py = by + ph * (1 - pct); plane(ctx, bx + pw / 2, py, pw * 0.5, 0, C('#fff')); ctx.fillStyle = C('#ffc21f'); ctx.strokeStyle = C('#14285a'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + pw * 1.6, py); ctx.lineTo(bx + pw * 1.1, py - pw * 0.28); ctx.lineTo(bx + pw * 1.1, py + pw * 0.28); ctx.closePath(); ctx.fill(); ctx.stroke();
      txt(ctx, Math.round(pct * 100) + '%', bx + pw / 2, by + ph + pw * 0.8, pw * 0.62, C('#fff'), { sw: 0.24 }); ctx.restore(); }
  };
  try { const st = document.createElement('style'); st.textContent = 'body.cc-evo .cc-pause{top:calc(env(safe-area-inset-top,0px) + 17.5vh);left:5.5vw;width:12vw;height:12vw;max-width:56px;max-height:56px;border-radius:14px;background:rgba(150,180,220,0.55);border:3px solid rgba(255,255,255,0.9);box-shadow:0 3px 0 rgba(10,30,80,0.35)}'; document.head.appendChild(st); } catch (e) { /* style facultatif */ }

  if (CC.L1 && CC.L1.msg) { const _m = CC.L1.msg; CC.L1.msg = function (g) { if (g && g.evo) return; return _m.apply(this, arguments); }; }
  if (CC.EVO) { const _br = CC.EVO.beginRun; CC.EVO.beginRun = (g) => { g.evoReport = false; g.evoLvPop = false; return _br(g); }; }
  Home.evoUI.setTheme = setTheme; Home.evoUI.cycleTheme = cycleTheme; Home.evoUI.theme = () => T.id;
})();
