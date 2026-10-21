/* v130 : LE RÉCIT du mode évolution — cinématique d'intro (satellite, radio, compte à rebours), voix radio pendant le vol, JOUR → NUIT → FEU sur tout le niveau,
 * musique et ambiances par acte, pluie de pièces à chaque ennemi détruit, bruit de l'eau. Chargé après evo.js et home.js. */
(function () {
  const U = CC.U, EVO = CC.EVO, V = THREE.Vector3;
  if (!EVO || !EVO.on) return;
  const C3 = (h) => new THREE.Color(h);

  // ---------- ambiances du niveau : une par scène, fondues sur les 150 derniers mètres de chaque scène ----------
  const MOOD = {
    dawn:    { top: '#2a7fe6', hor: '#bfe3f6', fog: '#c9e4f2', near: 130, far: 330, hemiS: '#eef6ff', hemiG: '#5f9a46', hemiI: 0.68, amb: 0.13, sunC: '#ffe8c0', sunI: 0.88, night: 0 },
    morning: { top: '#1c78e8', hor: '#a8dcf8', fog: '#c2e2f4', near: 140, far: 340, hemiS: '#eef6ff', hemiG: '#5f9a46', hemiI: 0.66, amb: 0.13, sunC: '#fff0d0', sunI: 0.89, night: 0 },
    day:     { top: '#1676e8', hor: '#9fd8fa', fog: '#bfe0f2', near: 150, far: 340, hemiS: '#eef6ff', hemiG: '#5f9a46', hemiI: 0.66, amb: 0.13, sunC: '#fff2d6', sunI: 0.89, night: 0 },
    gold:    { top: '#6b7fa6', hor: '#f2b27c', fog: '#cfa47c', near: 100, far: 290, hemiS: '#ffd8b0', hemiG: '#6a5a48', hemiI: 0.7, amb: 0.16, sunC: '#ff9a50', sunI: 0.95, night: 0.1 },
    deep:    { top: '#1c2234', hor: '#3a3a48', fog: '#2a2c38', near: 30, far: 190, hemiS: '#8a90b0', hemiG: '#30303a', hemiI: 0.55, amb: 0.22, sunC: '#9aa4c8', sunI: 0.3, night: 0.4 },
    shaft:   { top: '#506080', hor: '#8a8a98', fog: '#4a4c58', near: 40, far: 240, hemiS: '#c0c8e0', hemiG: '#585860', hemiI: 0.9, amb: 0.35, sunC: '#ffd8a8', sunI: 0.6, night: 0.3 },
    tunnel:  { top: '#202638', hor: '#4a4a58', fog: '#3a3c48', near: 40, far: 230, hemiS: '#b8c0d8', hemiG: '#484850', hemiI: 0.95, amb: 0.45, sunC: '#a8b0d0', sunI: 0.45, night: 0.35 },
    night:   { top: '#1c2b5e', hor: '#e0804e', fog: '#5a4a68', near: 70, far: 300, hemiS: '#a8a0d0', hemiG: '#443c4c', hemiI: 0.72, amb: 0.3, sunC: '#ff9a62', sunI: 0.6, night: 0.42 },
    siege:   { top: '#1a1430', hor: '#9a4a40', fog: '#4a2c34', near: 60, far: 300, hemiS: '#c08098', hemiG: '#3a2a30', hemiI: 0.7, amb: 0.28, sunC: '#ff8a5a', sunI: 0.6, night: 0.55 },
    fire:    { top: '#12080e', hor: '#8a3a28', fog: '#3a1c14', near: 60, far: 300, hemiS: '#c07048', hemiG: '#301810', hemiI: 0.6, amb: 0.22, sunC: '#ff7a3a', sunI: 0.6, night: 0.8 },
    core:    { top: '#0a1424', hor: '#1a3a5a', fog: '#102030', near: 40, far: 240, hemiS: '#6a9ac0', hemiG: '#1a2a3a', hemiI: 0.65, amb: 0.26, sunC: '#6aa8ff', sunI: 0.35, night: 0.7 },
    inferno: { top: '#200808', hor: '#e0501c', fog: '#5a2010', near: 40, far: 260, hemiS: '#ff9050', hemiG: '#401408', hemiI: 0.8, amb: 0.3, sunC: '#ff6a20', sunI: 0.8, night: 0.6 },
  };
  // v152 : etalonnage par ambiance (saturation, contraste, ombres froides / hautes lumieres chaudes) : chaque lieu est un tableau
  const GRADE = { dawn: [1.0, 1.03, '#e8eeff', '#fff9f0'], morning: [1.0, 1.03, '#e4ecff', '#fffaf2'], day: [1.0, 1.03, '#e4ecff', '#fffcf6'], gold: [0.84, 1.1, '#e4e8ff', '#ffe6c8'], deep: [0.78, 1.1, '#dce6ff', '#e8f0ff'], shaft: [0.8, 1.08, '#e0e8ff', '#fff0d8'], tunnel: [0.78, 1.1, '#dce4ff', '#ffecd0'], night: [0.82, 1.1, '#dce2ff', '#ffe0c0'], siege: [0.8, 1.12, '#e0e0ff', '#ffdcc0'], fire: [0.82, 1.12, '#e0e4ff', '#ffd8b0'], core: [0.8, 1.1, '#d8e8ff', '#e8f4ff'], inferno: [0.86, 1.12, '#ffe8e0', '#ffd8b0'] };
  for (const k of Object.keys(MOOD)) { const m = MOOD[k]; for (const f of ['top', 'hor', 'fog', 'hemiS', 'hemiG', 'sunC']) m[f] = C3(m[f]); const q = GRADE[k] || GRADE.day; m.sat = q[0]; m.con = q[1]; m.shT = C3(q[2]); m.hiT = C3(q[3]); }
  const SCENE_MOOD = { descente: 'gold', rampe: 'dawn', camp: 'morning', riviere: 'day', foret: 'day', vallee: 'day', grotte: 'deep', falaise: 'gold', entrepots: 'gold', carriere: 'gold', puits: 'shaft', tunnel: 'tunnel', ville: 'night', approche: 'siege', porte: 'fire', noyau: 'core', fuite: 'inferno', arene: 'core', base: 'siege' };
  const SCENE_AUDIO = { descente: 'evoDusk', rampe: 'evoDawn', camp: 'evoDawn', riviere: 'evoDay', foret: 'evoDay', vallee: 'evoDay', grotte: 'evoMine', falaise: 'evoDusk', entrepots: 'evoDusk', carriere: 'evoDusk', puits: 'evoMine', tunnel: 'evoMine', ville: 'evoNight', approche: 'evoSiege', porte: 'evoBoss', noyau: 'evoBoss', fuite: 'evoEscape', arene: 'evoBoss', base: 'evoSiege' };
  EVO.MOOD = MOOD; EVO.SCENE_MOOD = SCENE_MOOD; EVO.SCENE_AUDIO = SCENE_AUDIO;
  const _m = { top: new THREE.Color(), hor: new THREE.Color(), fog: new THREE.Color(), hemiS: new THREE.Color(), hemiG: new THREE.Color(), sunC: new THREE.Color(), shT: new THREE.Color(), hiT: new THREE.Color() };
  const GDEF = { shT: C3('#e6eeff'), hiT: C3('#fff4e6'), sat: 0.86, con: 1.06 };   // ambiances ajoutees ailleurs (niveau 2) sans etalonnage propre
  const mix = (a, b, t, out) => { for (const f of ['top', 'hor', 'fog', 'hemiS', 'hemiG', 'sunC', 'shT', 'hiT']) out[f].copy(a[f] || GDEF[f]).lerp(b[f] || GDEF[f], t); for (const f of ['near', 'far', 'hemiI', 'amb', 'sunI', 'night', 'sat', 'con']) { const x = a[f] === undefined ? GDEF[f] : a[f], y = b[f] === undefined ? GDEF[f] : b[f]; out[f] = x + (y - x) * t; } return out; };
  const sm = (t) => { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const _mood = _m;
  EVO.moodAt = (g, dist) => {
    const CH = EVO.chapters || [], escaping = g.evoEscape && g.evoEscape.on;
    if (escaping) return mix(MOOD.inferno, MOOD.inferno, 0, _mood);
    let i = 0; for (let k = 0; k < CH.length; k++) if (dist >= CH[k].d) i = k;
    const a = MOOD[SCENE_MOOD[CH[i] && CH[i].key] || 'day'], nx = CH[i + 1], b = nx ? MOOD[SCENE_MOOD[nx.key] || 'day'] : a, end = nx ? nx.d : dist + 1; let t = nx ? sm((dist - (end - 160)) / 160) : 0;
    if (CH[i] && CH[i].key === 'fuite') { const F = EVO.scenePos('fuite'); if (F) { t = sm((dist - (F.d0 + F.len * 0.78)) / 90); return mix(a, MOOD.dawn, t, _mood); } }
    return mix(a, b, t, _mood);
  };
  EVO.applyMood = (g, m) => {
    if (!g.skyMat || !g.scene || !g.scene.fog) return;
    const u = g.skyMat.uniforms, vd = CC.CONFIG.render.viewDist || 310, far = Math.min(m.far, vd), near = Math.min(m.near, far * 0.5);
    u.cloud.value = Math.max(0, 1 - (m.night || 0) * 2.4); u.uT.value = performance.now() / 1000; u.top.value.copy(m.top); u.horizon.value.copy(m.hor); u.bottom.value.copy(m.fog); u.sunCol.value.copy(m.sunC);
    g.stars.visible = m.night > 0.55;
    g.scene.fog.color.copy(m.fog); g.scene.fog.near = near; g.scene.fog.far = far; if (g.fogBase) { g.fogBase.near = near; g.fogBase.far = far; g.fogBase.color.copy(m.fog); }
    g.renderer.setClearColor(g.scene.fog.color);
    g.hemi.color.copy(m.hemiS); g.hemi.groundColor.copy(m.hemiG); g.hemi.intensity = m.hemiI; g.ambient.intensity = m.amb; g.sun.color.copy(m.sunC); g.sun.intensity = m.sunI;
    g.nightK = m.night;
    if (g.postParams) { g.postParams.saturation = m.sat; g.postParams.contrast = m.con; g.postParams.shT = '#' + m.shT.getHexString(); g.postParams.hiT = '#' + m.hiT.getHexString(); }
    if (g.postParams) { g.postParams.bloomStrength = 0.07 + 0.16 * m.night; g.postParams.bloomThreshold = 0.98 - 0.2 * m.night; g.postParams.vignette = 0.2 + 0.25 * m.night; }
    if (g.horizon && g.horizon.setEnv) { const k = Math.round(m.night * 6); if (k !== g._hzK) { g._hzK = k; g.horizon.setEnv({ fog: { color: '#' + m.fog.getHexString() }, dark: m.night * 0.6 }); } }
  };

  // ---------- radio : une ligne de sous-titre en bas de l'écran, avec le crachotement d'un vrai poste ----------
  EVO.radio = (g, txt, dur) => { g.audio.play('radio'); };   // v141 : plus de texte à lire en plein vol : un crachotement radio, c'est tout
  const LINES = {
    rampe: ['CENTRE : TOUCHE LES ENNEMIS. CHAQUE CIBLE RAPPORTE DES PIECES.', 3.6], camp: ['CENTRE : SITE MILITAIRE. DETRUIS TOUT CE QUE TU PEUX.', 3.4], riviere: ['CENTRE : RIVIERE. PLONGE DEDANS POUR SURPRENDRE LA VEDETTE.', 3.6],
    foret: ['CENTRE : FORET DENSE. RESTE BAS, ILS TE GUETTENT.', 3.2], carriere: ['CENTRE : LA CARRIERE. DESCENDS EN SPIRALE.', 3.2], descente: ['CENTRE : LA CARRIERE. DESCENDS EN SPIRALE.', 3.2], puits: ['CENTRE : PUITS DE MINE. PLONGE ! PLONGE !', 3.0],
    tunnel: ['CENTRE : TUNNEL. ATTENTION AUX TRAINS.', 3.0], ville: ['CENTRE : VILLE ENNEMIE. LA CITADELLE EST DEVANT TOI.', 3.6], approche: ['CENTRE : DEFENSES ANTIAERIENNES. RESTE BAS.', 3.2],
    porte: ['CENTRE : LE GARDIEN ! PASSE ENTRE SES JAMBES !', 3.4], noyau: ['CENTRE : TU Y ES. DETRUIS LE REACTEUR AU FOND DU HALL !', 3.6], fuite: ['CENTRE : SORS DE LA ! VITE !', 2.4], arene: ['CENTRE : TU Y ES. DETRUIS LE REACTEUR !', 3.4],
  };
  EVO.onChapter = (g, c) => {
    const L = LINES[c.key]; if (L && (EVO.save(g).runs < 40 || c.i > 3)) EVO.radio(g, L[0], L[1]);
    const a = SCENE_AUDIO[c.key]; if (a && g.audio && g.audio.ctx && !(g.evoEscape && g.evoEscape.on)) g.audio.setZone(a, false);
  };
  const _bR = EVO.beginRun;
  EVO.beginRun = (g) => {
    _bR(g); g.evoCoins = g.evoCoins || []; g.evoEscape = null; g.evoRadio = null;
    if (g.audio && g.audio.ctx) g.audio.setZone('evoDawn', false);
    setTimeout(() => { if (g.state === 'FLIGHT' && g.evo && g.endlessRun && g.endlessRun.dist < 120 && EVO.save(g).runs < 6) EVO.radio(g, LINES.rampe[0], LINES.rampe[1]); }, 1400);
  };

  // ---------- pluie de pièces : les pièces jaillissent de l'ennemi détruit, montent, puis volent vers la fusée ----------
  let _cg = null, _cm = null;
  EVO.coinBurst = (g, pos, n) => {
    if (!_cg) { _cg = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 10); _cg.rotateX(Math.PI / 2); _cm = new THREE.MeshBasicMaterial({ color: '#ffd23a', fog: false }); }
    g.evoCoins = g.evoCoins || [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(_cg, _cm); m.position.copy(pos); m.position.y += 1.5; m.renderOrder = 6; g.scene.add(m);
      g.evoCoins.push({ m, v: new V(U.fx.range(-7, 7), U.fx.range(10, 20), U.fx.range(-7, 7)), t: 0, spin: U.fx.range(6, 14), k: i });
    }
    g.audio.play('coinPing', null, 0);
  };
  EVO.coinFrame = (g, dt) => {
    const L = g.evoCoins; if (!L || !L.length) return;
    const rk = g.rocket, tgt = rk && rk.active ? rk.pos : null;
    for (let i = L.length - 1; i >= 0; i--) {
      const c = L[i]; c.t += dt; c.m.rotation.y += c.spin * dt;
      if (c.t < 0.65 || !tgt) { c.v.y -= 11 * dt; c.m.position.addScaledVector(c.v, dt); }
      else { const d = _cv.copy(tgt).addScaledVector(rk.fwd, 5).sub(c.m.position), len = d.length(), sp = 40 + (c.t - 0.65) * 260; c.m.position.addScaledVector(d, Math.min(1, sp * dt / Math.max(0.01, len))); c.m.scale.setScalar(Math.max(0.2, 1 - (c.t - 0.65) * 0.5)); if (len < 4) c.t = 99; }
      if (c.t > 2.4 || (c.t > 0.65 && tgt && c.m.position.distanceTo(tgt) < 3.2)) { g.scene.remove(c.m); L.splice(i, 1); if (c.k % 3 === 0) g.audio.play('coinPing', null, c.k >> 1); }
    }
  };
  const _cv = new V();
  const _oK = EVO.onKill;
  EVO.onKill = (g, t) => { _oK(g, t); if (t.obb) EVO.coinBurst(g, t.obb.c, 9 + Math.min(10, Math.round((t.evoHp || 1) * 3))); };

  // ---------- chaque image : ambiance, pièces, eau, radio ----------
  const _fr = EVO.frame;
  EVO.frame = (g, dt) => {
    _fr(g, dt);
    if (g.cine3d && EVO.cineFrame) EVO.cineFrame(g, dt);
    const run = g.endlessRun, dist = run ? Math.max(0, run.dist) : 0;
    if (CC.Zones && CC.Zones.grassCull && g.camera) CC.Zones.grassCull(g.camera.position);   // v185
    { const nr = g.state === 'FLIGHT' ? 1.0 : 0.35; if (g.camera && g.camera.near !== nr && !g.cine3d) { g.camera.near = nr; g.camera.updateProjectionMatrix(); } }   // v189 : plan proche a 1 m en vol : tampon de profondeur ~3x plus precis (fin des scintillements sol / dalles)
    if (!g.cine3d) EVO.applyMood(g, EVO.moodAt(g, dist));
    EVO.coinFrame(g, dt);
    if (g.audio && g.audio.ctx && g.audio.setWater) {
      const W = CC.Zones.evoWater; let k = 0;
      if (W && run && g.rocket && g.rocket.active && g.state === 'FLIGHT') { if (dist > W.d0 - 120 && dist < W.d1 + 120) { const dy = Math.abs(g.rocket.pos.y - W.y); k = U.clamp(1 - dy / 90, 0, 1) * (1 - U.clamp((Math.max(W.d0 - dist, dist - W.d1)) / 120, 0, 1)); } }
      g.audio.setWater(k);
      g._uw1 = W && run && g.rocket && g.rocket.active && g.state === 'FLIGHT' && dist > W.d0 && dist < W.d1 ? U.clamp((W.y - g.rocket.pos.y) / 1.2, 0, 1) : 0;   // v212 : sous la surface de la riviere : sons etouffes comme dans l'ocean
    }
  };

  // ---------- HUD du récit : sous-titre radio, compteur de pièces, alerte d'évacuation ----------
  const _hd = EVO.drawHud;
  EVO.drawHud = (hud, ctx, g, W, H, px) => {
    _hd(hud, ctx, g, W, H, px);
    const F = CC.Font, ev = g.evo; if (!ev || ev.preview) return;
    const now = performance.now(), top = Math.max(10, H * 0.02);
    // pièces gagnées pendant ce vol
    { const run = g.endlessRun, m = EVO.mult(EVO.save(g).cm), tot = Math.round(ev.coins + (ev.chapCoins || 0) + Math.floor(Math.round(Math.max(0, run ? run.dist : 0) * EVO.SCORE_K(g)) * m)), UI = CC.Home && CC.Home.evoUI;
      if (tot !== ev._coinShown) { ev._coinShown = tot; if (ev.coins !== ev._coinKills) { ev._coinKills = ev.coins; ev._coinBump = now; } }
      if (UI && UI.coinCounter) UI.coinCounter(ctx, g, W, H, tot, 1 + 0.25 * Math.max(0, 1 - (now - (ev._coinBump || 0)) / 260)); }    // radio
    const R = g.evoRadio;
    if (R) {
      const a = (now - R.t0) / R.dur; if (a >= 1) { g.evoRadio = null; g.audio.play('radioEnd'); }
      else {
        const bh = px * 12, by = H - bh - H * 0.05, k = Math.min(1, a / 0.08) * (1 - U.smooth(0.88, 1, a)), shown = R.txt.slice(0, Math.max(1, Math.floor((now - R.t0) / 22)));
        ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(6,12,20,0.72)'; ctx.fillRect(0, by, W, bh); ctx.fillStyle = '#46e0ff'; ctx.fillRect(0, by, px * 0.8, bh);
        if (Math.sin(now / 160) > 0) { ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.arc(px * 3.4, by + bh / 2, px * 0.9, 0, 6.28); ctx.fill(); }
        F.draw(ctx, shown, px * 6, by + bh / 2 - px * 4.2, Math.min(px * 1.35, (W * 0.92 - px * 6) / Math.max(1, F.measure(R.txt, 1))), '#e8f6ff', {}); ctx.restore();
      }
    }
    // évacuation : barre de progression vers la sortie
    const E = g.evoEscape; if (E && E.on) {
      const pct = U.clamp((g.endlessRun.dist - E.d0) / Math.max(1, E.d1 - E.d0), 0, 1), bw = W * 0.6, bx = (W - bw) / 2, by = top + px * 9;
      ctx.save(); ctx.fillStyle = 'rgba(10,6,6,0.7)'; ctx.fillRect(bx - 3, by - 3, bw + 6, px * 2.4 + 6); ctx.fillStyle = Math.sin(now / 110) > 0 ? '#ff5a2a' : '#ffb03a'; ctx.fillRect(bx, by, bw * pct, px * 2.4); ctx.restore();
      F.draw(ctx, 'EVACUATION', W / 2, by - px * 5.6, px * 1.0, Math.sin(now / 110) > 0 ? '#ff7a4a' : '#ffd23a', { align: 'center' });
    }
  };

  // ---------- cinématique d'intro ----------
  EVO.showHome = (g) => { const S = EVO.save(g); if (!S.intro && !g.testMode) EVO.startIntro(g); else g.ui.overlay = 'evo'; };
  EVO.startIntro = (g) => { g.evoIntro = { t0: performance.now(), line: -1, lastBeep: 0, cd: -1 }; g.ui.overlay = 'evoIntro'; if (g.audio && g.audio.ctx) g.audio.play('radio'); };
  EVO.endIntro = (g) => { if (!g.evoIntro) return; g.evoIntro = null; EVO.save(g).intro = 1; g.writeSave(); g.ui.overlay = 'evo'; g.audio.play('padArm'); };
  const SUB = [[0.9, 'CENTRE A GHOST-1. CONFIRMEZ RECEPTION.'], [2.8, 'OBJECTIF : DETRUIRE LE REACTEUR DE LA CITADELLE.'], [5.0, 'UN GARDIEN DE 70 METRES PROTEGE LA PORTE.'], [6.9, 'PASSE ENTRE SES JAMBES. NE T ARRETE PAS.']];
  const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  CC.Home.drawEvoIntro = function (ui, ctx, g, W, H0) {
    const I = g.evoIntro; if (!I) return;
    const LY = CC.Home.layout(ui, W, H0), H = LY.HH;
    ui.buttons.push({ x: 0, y: LY.T, w: W, h: H, action: () => EVO.endIntro(g) });
    ctx.save(); ctx.translate(0, LY.T);
    const F = CC.Font, t = (performance.now() - I.t0) / 1000, cx = W / 2, cy = H * 0.44, u = Math.min(W, H), px = ui.fitPx(['CENTRE A GHOST-1. CONFIRMEZ RECEPTION.'], W * 0.9, u * 0.0075);
    const END = 10.2; if (t > END) { ctx.restore(); EVO.endIntro(g); return; }
    // fond : carte satellite qui zoome vers la cible
    ctx.fillStyle = '#031008'; ctx.fillRect(0, 0, W, H);
    const z = 1 + Math.pow(Math.min(t, 7.5) / 7.5, 1.6) * 5.2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.lineWidth = 1 / z; ctx.strokeStyle = 'rgba(60,255,140,0.13)';
    for (let x = -W; x < 2 * W; x += W / 10) { ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x, 2 * H); ctx.stroke(); }
    for (let y = -H; y < 2 * H; y += W / 10) { ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(2 * W, y); ctx.stroke(); }
    for (let k = 1; k <= 9; k++) { ctx.strokeStyle = 'rgba(90,255,170,' + (0.1 + k * 0.012) + ')'; ctx.beginPath(); for (let a = 0; a <= 6.30; a += 0.12) { const r = u * (0.05 + k * 0.075) * (1 + 0.16 * Math.sin(a * 3 + k) + 0.1 * Math.sin(a * 7 - k * 2)); const x = cx + Math.cos(a) * r * 1.2, y = cy + Math.sin(a) * r; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,60,40,0.8)'; for (let k = 0; k < 14; k++) { const a = hsh(k, 3) * 6.28, r = u * (0.05 + hsh(k, 9) * 0.1); ctx.fillRect(cx + Math.cos(a) * r - 1.5 / z, cy + Math.sin(a) * r - 1.5 / z, 3 / z, 3 / z); }
    ctx.restore();
    // balayage radar, bruit
    const sw = ((t * 0.55) % 1) * H; ctx.fillStyle = 'rgba(80,255,160,0.07)'; ctx.fillRect(0, sw, W, H * 0.06);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(160,255,200,' + (0.05 + hsh(k, t * 9) * 0.08) + ')'; ctx.fillRect(hsh(k, Math.floor(t * 20)) * W, hsh(k + 9, Math.floor(t * 20)) * H, W * 0.04 * hsh(k, 2), 2); }
    // réticule de cible
    { const r = u * 0.13 * (1.6 - U.clamp(t / 4.5, 0, 0.6)), a = t * 0.8; ctx.strokeStyle = '#ff5a3a'; ctx.lineWidth = Math.max(2, u * 0.004); ctx.beginPath(); ctx.arc(cx, cy, r, a, a + 4.7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, -a, -a + 3.6); ctx.stroke();
      const L = r * 1.25, c = 0.35 * r; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * L, cy + sy * (L - c)); ctx.lineTo(cx + sx * L, cy + sy * L); ctx.lineTo(cx + sx * (L - c), cy + sy * L); ctx.stroke(); }
      ctx.fillStyle = Math.sin(t * 9) > 0 ? '#ff5a3a' : '#ffb03a'; ctx.beginPath(); ctx.arc(cx, cy, u * 0.012, 0, 6.28); ctx.fill(); }
    // en-têtes
    F.draw(ctx, 'LIEN SATELLITE  ACTIF', W * 0.05, H * 0.035, px * 1.1, '#46ff9a', {});
    F.draw(ctx, 'OPERATION AUBE ROUGE', W * 0.05, H * 0.035 + px * 9, px * 1.9, '#ffffff', {});
    if (t > 1.2) F.draw(ctx, 'CIBLE : LA CITADELLE', W * 0.05, H * 0.035 + px * 24, px * 1.1, '#ff7a5a', {});
    if (t > 3.0) F.draw(ctx, 'GARDIEN : ACTIF', W * 0.05, H * 0.035 + px * 33, px * 1.1, '#ff7a5a', {});
    F.draw(ctx, 'LAT ' + (47.2 + t * 0.013).toFixed(4) + '  LON ' + (-1.55 + t * 0.021).toFixed(4), W * 0.05, H * 0.9, px * 0.7, '#46ff9a', {});
    // sous-titres radio (écrits lettre par lettre, avec un bip)
    let cur = -1; for (let i = 0; i < SUB.length; i++) if (t >= SUB[i][0]) cur = i;
    if (cur >= 0 && t < 7.8) {
      const s = SUB[cur][1], n = Math.floor((t - SUB[cur][0]) * 34), shown = s.slice(0, Math.max(0, n)), bh = px * 15, by = H * 0.72;
      if (cur !== I.line) { I.line = cur; g.audio.play('radio'); }
      if (n < s.length && n > I.lastBeep + 1) { I.lastBeep = n; g.audio.play('beep', null, 0.8 + (n % 5) * 0.08); }
      ctx.fillStyle = 'rgba(0,10,6,0.7)'; ctx.fillRect(0, by, W, bh); ctx.fillStyle = '#46e0ff'; ctx.fillRect(0, by, px * 0.8, bh);
      F.draw(ctx, shown, px * 4, by + bh / 2 - px * 3.5, Math.min(px * 1.6, (W * 0.94) / Math.max(1, F.measure(s, 1))), '#e8f6ff', {});
    }
    // compte à rebours
    if (t > 7.6) {
      const c = Math.floor(t - 7.6); const k = (t - 7.6) % 1, words = ['3', '2', '1', 'GO'];
      if (c !== I.cd && c < 4) { I.cd = c; g.audio.play(c < 3 ? 'beepLow' : 'finish'); }
      if (c < 4) { const sz = ui.fitPx([words[c]], W * 0.7, u * (0.06 - 0.02 * k)); ctx.save(); ctx.globalAlpha = 1 - k * 0.5; F.draw(ctx, words[c], cx, H * 0.44 - sz * 3.5, sz, c === 3 ? '#ffd23a' : '#ffffff', { align: 'center' }); ctx.restore(); }
    }
    // fondu au noir final, puis blanc du lancement
    if (t > END - 0.7) { ctx.fillStyle = 'rgba(255,255,255,' + U.clamp((t - (END - 0.7)) / 0.7, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
    F.draw(ctx, 'TOUCHER POUR PASSER', W * 0.95, H * 0.95, px * 0.6, 'rgba(200,220,210,0.6)', { align: 'right' });
    ctx.restore();
  };
})();
