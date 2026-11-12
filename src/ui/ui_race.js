/* v398 : SYSTEME D'INTERFACE DE LA COURSE (CC.RUI) : une seule palette (bleu + jaune d'action), une seule police ronde, des composants CALCULES.
 * Un bouton n'est pas deux formes empilees : contour, levre, face, reflet, ombre interne et ombre portee sont traces avec les memes rayons, derives de sa hauteur.
 * Etats : survol (eclaircit, grossit de 3 %), appui (la face s'enfonce sur sa levre), desactive. Les transitions sont lissees image par image. */
(function () {
  const UI = CC.UI2; if (!UI) return;
  const U = CC.U, S = (v) => UI.S(v);
  const PAL = {
    ink: '#0d1a3f', inkSoft: 'rgba(13,26,63,0.55)', navy: '#14275c', navy2: '#1c3a86',
    blue: '#2f7bff', blueL: '#62a8ff', blueD: '#1b4fc4', sky: '#bfe3ff',
    yellow: '#ffd23a', yellowL: '#ffe785', yellowD: '#e39a00', yellowLip: '#a86a00',
    green: '#5fd63c', greenL: '#93ec6c', greenD: '#3aa81e', greenLip: '#1f6f10',
    red: '#ff5263', redL: '#ff8a94', redD: '#d92a40', redLip: '#8f1326',
    white: '#ffffff', paper: '#f3f7ff', paperD: '#d9e4fb', text: '#14254f', dim: '#7f93c2', grey: '#9aa6c4', greyD: '#6b7796', greyLip: '#414b66',
  };
  const ROLE = {   // face (haut, bas), levre, texte
    primary: [PAL.yellowL, PAL.yellow, PAL.yellowD, PAL.yellowLip, '#5a3400'],
    confirm: [PAL.greenL, PAL.green, PAL.greenD, PAL.greenLip, '#ffffff'],
    secondary: [PAL.blueL, PAL.blue, PAL.blueD, '#10307e', '#ffffff'],
    danger: [PAL.redL, PAL.red, PAL.redD, PAL.redLip, '#ffffff'],
    ghost: ['#ffffff', PAL.paper, PAL.paperD, '#93a4cf', PAL.text],
    disabled: ['#b9c2da', PAL.grey, PAL.greyD, PAL.greyLip, '#e8ecf6'],
  };
  const FONT = '"Lilita One","Russo One","Arial Black",sans-serif';
  const R = CC.RUI = { PAL, FONT };
  const rr = (ctx, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  R.rr = rr;
  R.font = (ctx, px) => { ctx.font = px + 'px ' + FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = (px * 0.025) + 'px'; };
  R.tw = (ctx, s, px) => { ctx.save(); R.font(ctx, px); const w = ctx.measureText(s).width; ctx.restore(); return w; };
  R.fit = (ctx, s, maxW, px) => { const w = R.tw(ctx, s, px); return w > maxW ? px * maxW / w : px; };
  R.text = (ctx, s, x, y, px, color, o) => {   // texte sans contour ; ombre douce (optionnelle) pour rester lisible sur une image
    o = o || {}; ctx.save(); R.font(ctx, px); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    if (o.plain !== true) { ctx.shadowColor = 'rgba(8,16,44,' + (o.thin ? 0.35 : 0.5) + ')'; ctx.shadowBlur = px * 0.16; ctx.shadowOffsetY = px * 0.06; }
    ctx.fillStyle = color || PAL.white; ctx.fillText(s, x, y); ctx.restore();
  };
  // ---- etat des boutons (survol, appui) : lisse dans le temps ----
  const ST = {}; let down = false, frame = 0;
  window.addEventListener('mousedown', () => { down = true; }); window.addEventListener('mouseup', () => { down = false; });
  window.addEventListener('touchstart', () => { down = true; }, { passive: true }); window.addEventListener('touchend', () => { down = false; }, { passive: true });
  R.begin = () => { frame++; };
  const state = (ui, key, x, y, w, h, off) => {
    const m = ui && ui.mouse ? ui.mouse : { x: -1, y: -1 }, over = !off && m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
    const s = ST[key] || (ST[key] = { h: 0, p: 0, f: 0 }); if (s.f !== frame - 1 && s.f !== frame) { s.h = 0; s.p = 0; } s.f = frame;
    s.h += ((over ? 1 : 0) - s.h) * 0.3; s.p += ((over && down ? 1 : 0) - s.p) * 0.45; return s;
  };
  // ---- LE BOUTON ----
  R.button = (ctx, ui, x, y, w, h, label, o) => {   // face + levre (meme teinte, plus sombre) + ombre douce ; ni contour ni reflet
    o = o || {}; const role = o.disabled ? 'disabled' : (o.role || 'primary'), C = ROLE[role], st = state(ui, o.key || (label + '|' + Math.round(x) + '|' + Math.round(y)), x, y, w, h, o.disabled);
    const k = 1 + 0.025 * st.h - 0.01 * st.p, cx = x + w / 2, cy = y + h / 2; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
    const rad = Math.min(h * 0.3, w * 0.5), lip = h * 0.1, pr = st.p * lip * 0.8;
    ctx.save(); ctx.shadowColor = 'rgba(8,16,44,0.3)'; ctx.shadowBlur = h * 0.28; ctx.shadowOffsetY = h * 0.1 * (1 - st.p * 0.7); rr(ctx, x, y, w, h, rad); ctx.fillStyle = C[3]; ctx.fill(); ctx.restore();   // la levre porte l'ombre
    const fy = y + pr, fh = h - lip, g = ctx.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, C[1]); g.addColorStop(1, C[2]); rr(ctx, x, fy, w, fh, rad); ctx.fillStyle = g; ctx.fill();
    if (st.h > 0.01) { rr(ctx, x, fy, w, fh, rad); ctx.fillStyle = 'rgba(255,255,255,' + (0.12 * st.h) + ')'; ctx.fill(); }
    const ty = fy + fh / 2, px0 = o.px || fh * 0.46, lab = String(label || ''), ic = o.icon, iw = ic ? px0 * 1.2 : 0, px = R.fit(ctx, lab, w * 0.84 - iw, px0), tw = lab ? R.tw(ctx, lab, px) : 0;
    if (ic) R.icon(ctx, ic, lab ? cx - (tw + iw) / 2 + px0 * 0.42 : cx, ty, px0 * (lab ? 0.9 : 1.2), { fill: C[4] });
    if (lab) R.text(ctx, lab, cx + (ic ? iw / 2 : 0), ty + px * 0.04, px, C[4], { plain: true });
    ctx.restore(); return st;
  };
  R.tapButton = (ctx, ui, x, y, w, h, label, o, action) => { const st = R.button(ctx, ui, x, y, w, h, label, o); if (!(o && o.disabled) && action) UI.tap(ui, x, y, w, h, action); return st; };
  // ---- bouton rond (icone seule) ----
  R.round = (ctx, ui, cx, cy, r, icon, o, action) => { o = o || {}; const st = R.button(ctx, ui, cx - r, cy - r, r * 2, r * 2 + r * 0.2, '', Object.assign({ icon, key: 'r' + icon + Math.round(cx) + Math.round(cy), px: r * 0.95 }, o)); if (action && !o.disabled) UI.tap(ui, cx - r, cy - r, r * 2, r * 2, action); return st; };
  // ---- panneau (carte claire, contour, ombre), avec bandeau de titre optionnel ----
  R.panel = (ctx, x, y, w, h, o) => {   // surface unie a coins arrondis, ombre douce ; pas de contour
    o = o || {}; const rad = o.r || S(30), dark = o.dark;
    ctx.save(); ctx.shadowColor = 'rgba(8,16,44,0.28)'; ctx.shadowBlur = S(30); ctx.shadowOffsetY = S(10); rr(ctx, x, y, w, h, rad); ctx.fillStyle = dark ? 'rgba(16,30,74,0.94)' : PAL.white; ctx.fill(); ctx.restore();
    if (o.title) { const th = o.th || S(74); ctx.save(); rr(ctx, x, y, w, h, rad); ctx.clip(); ctx.fillStyle = PAL.blue; ctx.fillRect(x, y, w, th); ctx.restore(); R.text(ctx, o.title, x + w / 2, y + th / 2 + S(2), R.fit(ctx, o.title, w * 0.8, th * 0.5), PAL.white, { plain: true }); }
  };
  // ---- pastille de compteur (piece, gemme, billet) ----
  R.pill = (ctx, ui, x, y, w, h, icon, value, o) => {   // compteur : capsule sombre unie, la VRAIE icone du jeu (piece, gemme), la valeur
    o = o || {}; ctx.save(); ctx.shadowColor = 'rgba(8,16,44,0.25)'; ctx.shadowBlur = h * 0.3; ctx.shadowOffsetY = h * 0.08; rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(16,30,74,0.9)'; ctx.fill(); ctx.restore();
    const is = h * 1.02, ix = x + h * 0.52, iy = y + h / 2; if (icon === 'ticket') R.icon(ctx, 'ticket', ix, iy, is * 0.74, { fill: '#4fd6ff' }); else if (!(UI.artImg && UI.artImg(ctx, icon, ix, iy, is)) && !UI.icon(ctx, icon, ix, iy, is)) R.icon(ctx, 'coin', ix, iy, is * 0.8, { fill: icon === 'gem' ? PAL.blueL : PAL.yellow });
    const s = String(value), tx = x + h + (w - h - (o.plus ? h * 0.9 : 0)) / 2 - h * 0.04; R.text(ctx, s, tx, y + h / 2 + h * 0.03, R.fit(ctx, s, w - h * (o.plus ? 2.3 : 1.5), h * 0.5), PAL.white, { plain: true });
    if (o.plus) { const pr = h * 0.3, pxc = x + w - h * 0.5; ctx.beginPath(); ctx.arc(pxc, y + h / 2, pr, 0, 6.283); ctx.fillStyle = PAL.green; ctx.fill(); R.icon(ctx, 'plus', pxc, y + h / 2, pr * 1.3, { fill: PAL.white }); UI.tap(ui, pxc - h / 2, y, h, h, o.plus); }
  };
  // ---- etiquette (petit bandeau) ----
  R.tag = (ctx, cx, cy, label, o) => { o = o || {}; const px = o.px || S(26), w = R.tw(ctx, label, px) + px * 1.5, h = px * 1.8; rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fillStyle = o.color || PAL.yellow; ctx.fill(); R.text(ctx, label, cx, cy + px * 0.05, px, o.text || '#5a3400', { plain: true }); return w; };
  // ---- barre de progression ----
  R.bar = (ctx, x, y, w, h, k, o) => { o = o || {}; rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(8,16,44,0.35)'; ctx.fill(); if (k > 0.001) { rr(ctx, x, y, Math.max(h, w * U.clamp(k, 0, 1)), h, h / 2); ctx.fillStyle = o.c1 || PAL.green; ctx.fill(); } };
  // ---- ICONES : un seul style (formes pleines, contour d'encre arrondi, epaisseur = 9 % de la taille) ----
  R.icon = (ctx, name, cx, cy, s, o) => {
    o = o || {}; const f = o.fill || PAL.white, ink = o.ink || null, lw = s * 0.09, h = s / 2; ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = ink || 'rgba(0,0,0,0)'; ctx.fillStyle = f;
    const done = () => { ctx.fill(); if (ink) ctx.stroke(); };
    if (name === 'play') { ctx.beginPath(); ctx.moveTo(-h * 0.5, -h * 0.72); ctx.lineTo(h * 0.74, 0); ctx.lineTo(-h * 0.5, h * 0.72); ctx.closePath(); done(); }
    else if (name === 'plus') { ctx.beginPath(); const a = h * 0.24, b = h * 0.74; ctx.moveTo(-a, -b); ctx.lineTo(a, -b); ctx.lineTo(a, -a); ctx.lineTo(b, -a); ctx.lineTo(b, a); ctx.lineTo(a, a); ctx.lineTo(a, b); ctx.lineTo(-a, b); ctx.lineTo(-a, a); ctx.lineTo(-b, a); ctx.lineTo(-b, -a); ctx.lineTo(-a, -a); ctx.closePath(); done(); }
    else if (name === 'close') { ctx.rotate(Math.PI / 4); ctx.beginPath(); const a = h * 0.2, b = h * 0.8; ctx.moveTo(-a, -b); ctx.lineTo(a, -b); ctx.lineTo(a, -a); ctx.lineTo(b, -a); ctx.lineTo(b, a); ctx.lineTo(a, a); ctx.lineTo(a, b); ctx.lineTo(-a, b); ctx.lineTo(-a, a); ctx.lineTo(-b, a); ctx.lineTo(-b, -a); ctx.lineTo(-a, -a); ctx.closePath(); done(); }
    else if (name === 'left' || name === 'right') { const d = name === 'left' ? -1 : 1; ctx.beginPath(); ctx.moveTo(-d * h * 0.42, -h * 0.72); ctx.lineTo(d * h * 0.5, 0); ctx.lineTo(-d * h * 0.42, h * 0.72); ctx.lineTo(-d * h * 0.1, 0); ctx.closePath(); done(); }
    else if (name === 'bolt') { ctx.beginPath(); ctx.moveTo(h * 0.2, -h * 0.9); ctx.lineTo(-h * 0.55, h * 0.12); ctx.lineTo(-h * 0.05, h * 0.12); ctx.lineTo(-h * 0.25, h * 0.9); ctx.lineTo(h * 0.55, -h * 0.2); ctx.lineTo(h * 0.05, -h * 0.2); ctx.closePath(); done(); }
    else if (name === 'trophy') { ctx.beginPath(); ctx.moveTo(-h * 0.52, -h * 0.78); ctx.lineTo(h * 0.52, -h * 0.78); ctx.quadraticCurveTo(h * 0.5, h * 0.1, 0, h * 0.2); ctx.quadraticCurveTo(-h * 0.5, h * 0.1, -h * 0.52, -h * 0.78); ctx.closePath(); done(); ctx.strokeStyle = f; ctx.lineWidth = lw * 1.2; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * h * 0.56, -h * 0.42, h * 0.22, d > 0 ? -1.3 : Math.PI - 1.3, d > 0 ? 1.3 : Math.PI + 1.3, false); ctx.stroke(); } ctx.beginPath(); ctx.rect(-h * 0.1, h * 0.2, h * 0.2, h * 0.3); done(); ctx.beginPath(); rr(ctx, -h * 0.42, h * 0.5, h * 0.84, h * 0.3, h * 0.08); done(); }
    else if (name === 'bag') { ctx.beginPath(); rr(ctx, -h * 0.68, -h * 0.3, h * 1.36, h * 1.1, h * 0.2); done(); ctx.strokeStyle = f; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.arc(0, -h * 0.3, h * 0.36, Math.PI, 0); ctx.stroke(); }
    else if (name === 'rocket') { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, -h * 0.95); ctx.quadraticCurveTo(h * 0.42, -h * 0.45, h * 0.3, h * 0.36); ctx.lineTo(-h * 0.3, h * 0.36); ctx.quadraticCurveTo(-h * 0.42, -h * 0.45, 0, -h * 0.95); ctx.closePath(); done(); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * h * 0.3, h * 0.0); ctx.lineTo(d * h * 0.66, h * 0.52); ctx.lineTo(d * h * 0.3, h * 0.36); ctx.closePath(); done(); } ctx.fillStyle = PAL.yellow; ctx.beginPath(); ctx.moveTo(-h * 0.18, h * 0.42); ctx.lineTo(0, h * 0.92); ctx.lineTo(h * 0.18, h * 0.42); ctx.closePath(); done(); ctx.fillStyle = PAL.blue; ctx.beginPath(); ctx.arc(0, -h * 0.3, h * 0.16, 0, 6.283); done(); }
    else if (name === 'gear') { ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832, r0 = k % 2 ? h * 0.88 : h * 0.64; ctx.lineTo(Math.cos(a - 0.1) * r0, Math.sin(a - 0.1) * r0); ctx.lineTo(Math.cos(a + 0.1) * r0, Math.sin(a + 0.1) * r0); } ctx.closePath(); done(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, h * 0.26, 0, 6.283); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    else if (name === 'sound' || name === 'mute') { ctx.beginPath(); ctx.moveTo(-h * 0.75, -h * 0.26); ctx.lineTo(-h * 0.38, -h * 0.26); ctx.lineTo(h * 0.05, -h * 0.66); ctx.lineTo(h * 0.05, h * 0.66); ctx.lineTo(-h * 0.38, h * 0.26); ctx.lineTo(-h * 0.75, h * 0.26); ctx.closePath(); done(); ctx.strokeStyle = f; ctx.lineWidth = lw * 1.3; if (name === 'sound') for (const r0 of [0.34, 0.62]) { ctx.beginPath(); ctx.arc(h * 0.12, 0, h * r0, -0.8, 0.8); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(h * 0.3, -h * 0.3); ctx.lineTo(h * 0.8, h * 0.3); ctx.moveTo(h * 0.8, -h * 0.3); ctx.lineTo(h * 0.3, h * 0.3); ctx.stroke(); } }
    else if (name === 'lock') { ctx.beginPath(); rr(ctx, -h * 0.56, -h * 0.08, h * 1.12, h * 0.88, h * 0.16); done(); ctx.lineWidth = lw * 1.6; ctx.strokeStyle = f; ctx.beginPath(); ctx.arc(0, -h * 0.1, h * 0.34, Math.PI, 0); ctx.stroke(); }
    else if (name === 'check') { ctx.strokeStyle = f; ctx.lineWidth = lw * 2.6; ctx.beginPath(); ctx.moveTo(-h * 0.6, 0); ctx.lineTo(-h * 0.15, h * 0.45); ctx.lineTo(h * 0.65, -h * 0.5); ctx.stroke(); }
    else if (name === 'ticket') { ctx.rotate(-0.35); ctx.beginPath(); rr(ctx, -h * 0.8, -h * 0.48, h * 1.6, h * 0.96, h * 0.14); done(); ctx.fillStyle = 'rgba(8,16,44,0.4)'; for (const yy of [-0.26, 0, 0.26]) { ctx.beginPath(); ctx.arc(h * 0.3, h * yy, h * 0.05, 0, 6.283); ctx.fill(); } }
    else if (name === 'coin') { ctx.beginPath(); ctx.arc(0, 0, h * 0.8, 0, 6.283); done(); ctx.fillStyle = PAL.yellowD; ctx.beginPath(); ctx.arc(0, 0, h * 0.5, 0, 6.283); ctx.fill(); }
    else if (name === 'flag') { ctx.beginPath(); ctx.rect(-h * 0.6, -h * 0.85, h * 0.16, h * 1.7); done(); ctx.beginPath(); ctx.moveTo(-h * 0.44, -h * 0.8); ctx.lineTo(h * 0.7, -h * 0.5); ctx.lineTo(-h * 0.44, -h * 0.05); ctx.closePath(); done(); }
    else if (name === 'video') { ctx.beginPath(); rr(ctx, -h * 0.8, -h * 0.55, h * 1.6, h * 1.1, h * 0.2); done(); ctx.fillStyle = 'rgba(8,16,44,0.55)'; ctx.beginPath(); ctx.moveTo(-h * 0.2, -h * 0.3); ctx.lineTo(h * 0.34, 0); ctx.lineTo(-h * 0.2, h * 0.3); ctx.closePath(); ctx.fill(); }
    ctx.restore(); return true;
  };
  // ---- fond d'ecran des pages (degrade bleu + motif discret) ----
  R.backdrop = (ctx, x, y, w, h) => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#3f8dff'); g.addColorStop(1, '#1b4fc4'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#ffffff'; const q = S(120); for (let j = 0; j * q * 0.86 < h + q; j++) for (let i = -1; i * q < w + q; i++) { ctx.beginPath(); ctx.arc(x + i * q + (j % 2) * q / 2, y + j * q * 0.86, q * 0.2, 0, 6.283); ctx.fill(); } ctx.restore(); };
  // ---- PLANCHE DE COMPOSANTS (?uikit=1) : tout le systeme sur un ecran, pour le valider avant d'habiller le jeu ----
  R.sheet = (ctx, ui, W, H) => {
    R.backdrop(ctx, 0, 0, W, H); const m = S(40); let y = m;
    R.text(ctx, 'COLD IMPACT - SYSTEME D\'INTERFACE', W / 2, y + S(28), S(54), PAL.white); y += S(96);
    const bw = S(300), bh = S(104), gap = S(26), roles = [['JOUER', 'primary', 'play'], ['LANCER', 'confirm', null], ['COSTUMES', 'secondary', 'rocket'], ['QUITTER', 'danger', null], ['PLUS TARD', 'ghost', null]];
    roles.forEach((r, i) => R.button(ctx, ui, m + i * (bw + gap), y, bw, bh, r[0], { role: r[1], icon: r[2], key: 'sh' + i }));
    R.button(ctx, ui, m + 5 * (bw + gap), y, bw, bh, 'BLOQUE', { disabled: true, icon: 'lock' }); y += bh + S(22);
    R.text(ctx, 'ETATS : NORMAL, SURVOL, APPUI', m, y + S(14), S(26), PAL.sky, { align: 'left', plain: true }); y += S(54);
    [[0, 0], [1, 0], [1, 1]].forEach((s2, i) => { const kx = m + i * (bw + gap), key = 'st' + i; ST[key] = { h: s2[0], p: s2[1], f: frame }; R.button(ctx, null, kx, y, bw, bh, 'JOUER', { role: 'primary', icon: 'play', key }); ST[key] = { h: s2[0], p: s2[1], f: frame }; });
    [[0, 0], [1, 0], [1, 1]].forEach((s2, i) => { const kx = m + (3 + i) * (bw + gap), key = 'su' + i; ST[key] = { h: s2[0], p: s2[1], f: frame }; R.button(ctx, null, kx, y, bw, bh, 'COSTUMES', { role: 'secondary', key }); ST[key] = { h: s2[0], p: s2[1], f: frame }; }); y += bh + S(34);
    const szs = [[S(420), S(132), 'GRAND'], [S(300), S(104), 'MOYEN'], [S(200), S(72), 'PETIT']]; let x0 = m; szs.forEach((z, i) => { R.button(ctx, ui, x0, y + (S(132) - z[1]) / 2, z[0], z[1], z[2], { role: 'primary', key: 'sz' + i }); x0 += z[0] + gap; });
    const ics = ['play', 'bag', 'rocket', 'bolt', 'trophy', 'gear', 'sound', 'mute', 'close', 'left', 'right', 'plus', 'lock', 'check', 'flag', 'video'], rr0 = S(44); ics.forEach((n, i) => R.round(ctx, ui, x0 + rr0 + (i % 8) * (rr0 * 2 + S(14)), y + rr0 * 0.9 + Math.floor(i / 8) * (rr0 * 2 + S(22)) - S(14), rr0, n, { role: n === 'close' ? 'danger' : n === 'check' || n === 'plus' ? 'confirm' : n === 'play' ? 'primary' : 'secondary' })); y += S(132) + S(70);
    R.pill(ctx, ui, m, y, S(250), S(70), 'coin', 1250, { plus: () => {} }); R.pill(ctx, ui, m + S(280), y, S(220), S(70), 'gem', 12, { plus: () => {} }); R.pill(ctx, ui, m + S(530), y, S(190), S(70), 'ticket', 3);
    R.tag(ctx, m + S(830), y + S(35), 'MANCHE 1 / 3'); R.tag(ctx, m + S(1070), y + S(35), 'NOUVEAU', { color: PAL.red, text: '#ffffff' }); R.tag(ctx, m + S(1270), y + S(35), 'RARE', { color: PAL.blueL, text: '#ffffff' });
    R.bar(ctx, m + S(1400), y + S(14), S(420), S(42), 0.62); y += S(110);
    R.panel(ctx, m, y, S(620), S(360), { title: 'PANNEAU CLAIR' }); R.text(ctx, 'Texte de contenu', m + S(310), y + S(150), S(40), PAL.text, { plain: true }); R.button(ctx, ui, m + S(160), y + S(220), S(300), S(96), 'VALIDER', { role: 'confirm', key: 'pv' });
    R.panel(ctx, m + S(660), y, S(620), S(360), { title: 'PANNEAU SOMBRE', dark: true }); R.text(ctx, 'QUALIFIES', m + S(970), y + S(140), S(36), PAL.sky, { thin: true }); R.text(ctx, '7 / 16', m + S(970), y + S(215), S(90), PAL.greenL); R.bar(ctx, m + S(760), y + S(280), S(420), S(36), 7 / 16);
    const px = m + S(1320); ['TEXTE BLANC SUR FOND', 'TITRE JAUNE', 'Texte sombre sur clair'].forEach((t, i) => R.text(ctx, t, px, y + S(50) + i * S(76), [S(44), S(60), S(36)][i], [PAL.white, PAL.yellow, PAL.white][i], { align: 'left' }));
    const sw = [PAL.ink, PAL.navy, PAL.blueD, PAL.blue, PAL.blueL, PAL.sky, PAL.yellow, PAL.green, PAL.red, PAL.paper]; sw.forEach((c, i) => { rr(ctx, px + i * S(56), y + S(270), S(48), S(70), S(12)); ctx.fillStyle = c; ctx.fill(); });
  };
})();
