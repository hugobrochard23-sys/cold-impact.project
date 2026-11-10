/* v364 : MVP de niveaux courts (?mvp=a|b|c), tous sur la prairie penchee de evo_short.js. Tout est dans le style du jeu (UI canvas existant) :
 *  - ACCUEIL = le hangar avec START au milieu, une fleche gauche et une fleche droite de part et d'autre (touches du jeu) ; affiche a chaque fois ;
 *  - un seul niveau de 11 s a la fois, 10 niveaux ; carte de fin dans le style de MISSION ACCOMPLIE (etoiles = essais), SUIVANT / REJOUER / MENU ;
 *  - camera toujours identique ; carburant illimite ; plus de barre de lancement ; HUD = ancienne barre de progression mise a l'horizontale + chrono.
 * a = CURSEUR ou FLECHES (on bascule a tout moment) : la fusee avance seule. b = Espace / clic maintenu monte, relache descend (vue de cote, 8 anneaux).
 * c = comme a avec 2 fusees rivales et la place en haut. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const mm = /[?&]mvp=([abc])/.exec(location.search), M = mm ? mm[1] : (/^[abc]$/.test(window.CC_MVP || '') ? window.CC_MVP : null);
  if (M !== 'b' && M !== 'c') return;   // v366 : A et la course sont dans evo_mvp.js ; ici seulement B (vue de cote) et C (A + rivaux, ancienne version)
  E.mvp = () => M;
  try { localStorage.setItem('coldimpact.terms', '1'); } catch (e) { /* ignore */ }   // plus d'ecran de conditions
  const T3 = THREE, V = T3.Vector3, U = CC.U, UI = CC.UI2, Home = CC.Home;
  const FIN = E.shortFin || 470, CTRL = M === 'b' ? 'b' : 'a', RIV = M === 'c', NLV = 10;
  CC.CONFIG.physics.gravity = 0;   // la fusee est pilotee directement (vitesse imposee)
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* facultatif */ } };
  let LV = Math.max(1, Math.min(NLV, parseInt(lsGet('cc.mvp.lv.' + M, '1'), 10) || 1));
  const fails = {};   // essais rates par niveau (pendant la session) : 0 = 3 etoiles
  const NAMES = ['PRAIRIE', 'PRAIRIE', 'PRAIRIE', 'HAUTEURS', 'HAUTEURS', 'HAUTEURS', 'VILLE', 'VILLE', 'VILLE', 'FINALE'];
  const baseSpeed = () => 42 + Math.round(LV * 1.2);
  const _rk = E.rocket;   // carburant illimite, jamais en panne
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };

  // ---------------------------------------------------------------- entrees : souris OU fleches, on bascule a tout moment
  const I = { cx: 0, cy: 0.5, hold: false, mode: 'mouse', k: {}, mx: -1, my: -1, ax: 0, ay: 0 };
  const setC = (x, y) => { I.cx = x / window.innerWidth * 2 - 1; I.cy = y / window.innerHeight; };
  const ARR = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
  window.addEventListener('mousemove', (e) => { if (Math.abs(e.clientX - I.mx) + Math.abs(e.clientY - I.my) > 3) { I.mode = 'mouse'; } I.mx = e.clientX; I.my = e.clientY; setC(e.clientX, e.clientY); });
  window.addEventListener('mousedown', (e) => { if (e.button === 0) { I.hold = true; setC(e.clientX, e.clientY); } });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) I.hold = false; });
  window.addEventListener('touchstart', (e) => { I.hold = true; I.mode = 'mouse'; const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend', (e) => { if (!e.touches.length) I.hold = false; }, { passive: true });
  window.addEventListener('keydown', (e) => {
    I.k[e.code] = 1;
    if (ARR[e.code]) { I.mode = 'keys'; const g = CC.game; if (g && g.state === 'FLIGHT') e.preventDefault(); }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') I.hold = true;
  });
  window.addEventListener('keyup', (e) => { I.k[e.code] = 0; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') I.hold = false; });
  E.mvpInput = I;

  // ---------------------------------------------------------------- geometrie
  const tf = new V(), nn = new V(), cc = new V(), ray = new V(), org = new V(), tmp = new V(), tmp2 = new V();
  const frame = (T, d) => {
    const a = T.at(d, 0, 0), b = T.at(d + 6, 0, 0), c1 = T.at(d, 1, 0);
    tf.set(b[0] - a[0], 0, b[2] - a[2]); if (tf.lengthSq() < 1e-6) tf.set(0, 0, -1); tf.normalize();
    nn.set(c1[0] - a[0], 0, c1[2] - a[2]).normalize(); cc.set(a[0], a[1], a[2]);
  };
  const place = (T, d, lx, h, out) => { frame(T, d); return out.set(cc.x + nn.x * lx, T.base(d) + h, cc.z + nn.z * lx); };
  const yawAt = (T, d) => { frame(T, d); return Math.atan2(tf.x, tf.z); };

  // ---------------------------------------------------------------- textures et materiaux des obstacles (briques, roche, immeubles)
  const mkTex = (draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; draw(cv.getContext('2d')); const tx = new T3.CanvasTexture(cv); tx.wrapS = tx.wrapT = T3.RepeatWrapping; return tx; };
  const TEX = {};
  const texOf = (style) => {
    if (TEX[style]) return TEX[style];
    return TEX[style] = mkTex((c) => {
      if (style === 'brick') { c.fillStyle = '#d6c4a8'; c.fillRect(0, 0, 128, 128); for (let r = 0; r < 8; r++) for (let q = 0; q < 4; q++) { const x = q * 32 + (r % 2) * 16; c.fillStyle = ['#b04a2c', '#a24127', '#bb5632'][(r * 3 + q) % 3]; c.fillRect(x + 1.5, r * 16 + 1.5, 29, 13); } }
      else if (style === 'stone') { c.fillStyle = '#86807a'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { c.fillStyle = ['#756f69', '#97918a', '#6c6761'][i % 3]; c.beginPath(); const x = (i * 53) % 128, y = (i * 37) % 128; c.moveTo(x, y); c.lineTo(x + 30, y + 6); c.lineTo(x + 22, y + 34); c.lineTo(x - 4, y + 22); c.closePath(); c.fill(); } }
      else { c.fillStyle = '#c9ccd2'; c.fillRect(0, 0, 128, 128); for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { c.fillStyle = (r * 5 + q * 3) % 7 === 0 ? '#ffe7a0' : '#45658a'; c.fillRect(q * 32 + 6, r * 32 + 6, 20, 20); } }
    });
  };
  const matOf = (style, w, h) => { const tx = texOf(style).clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, w / 7), Math.max(1, h / 6)); return new T3.MeshLambertMaterial({ map: tx }); };

  // ---------------------------------------------------------------- les 10 niveaux : des murs avec une ouverture (d, centre lateral, largeur, bas, haut)
  const HH = 46;   // hauteur des murs
  const LVL = [
    null,
    [],   // 1 : prairie, aucun obstacle (decouverte)
    [['g', 150, -6, 15, 0, HH, 'brick'], ['g', 230, 6, 15, 0, HH, 'brick'], ['g', 310, -6, 15, 0, HH, 'brick'], ['g', 390, 6, 15, 0, HH, 'brick']],
    [['g', 140, 0, 17, 8, 18, 'brick'], ['g', 215, 0, 17, 2, 9, 'brick'], ['g', 290, 0, 17, 9, 17, 'brick'], ['g', 365, 0, 17, 2, 8, 'brick']],
    [['g', 140, -5, 14, 8, 18, 'stone'], ['g', 210, 5, 14, 2, 12, 'stone'], ['g', 280, -4, 14, 8, 18, 'stone'], ['g', 350, 5, 13, 2, 11, 'stone'], ['g', 415, 0, 14, 6, 16, 'stone']],
    [['g', 130, -7, 11, 0, HH, 'stone'], ['g', 190, 6, 11, 0, HH, 'stone'], ['g', 250, -6, 11, 0, HH, 'stone'], ['g', 310, 7, 11, 0, HH, 'stone'], ['g', 370, -2, 11, 0, HH, 'stone']],
    [['g', 130, 0, 22, 0, HH, 'stone'], ['g', 185, -4, 17, 0, HH, 'stone'], ['g', 240, 4, 14, 0, HH, 'stone'], ['g', 295, -5, 11, 0, HH, 'stone'], ['g', 350, 5, 9, 0, HH, 'stone'], ['g', 405, 0, 8, 0, HH, 'stone']],
    [['g', 140, -6, 14, 0, HH, 'city'], ['g', 210, 6, 14, 0, HH, 'city'], ['g', 280, -6, 13, 0, HH, 'city'], ['g', 350, 6, 13, 0, HH, 'city'], ['g', 415, 0, 14, 0, HH, 'city']],
    [['b', 150, 8, 11], ['g', 220, 0, 15, 10, 17, 'city'], ['b', 290, 12, 15], ['g', 350, -6, 13, 2, 9, 'city'], ['b', 410, 6, 9]],
    [['g', 135, -6, 12, 0, HH, 'city'], ['g', 190, 6, 12, 3, 13, 'city'], ['g', 245, -5, 12, 7, 17, 'city'], ['g', 300, 5, 12, 3, 13, 'city'], ['g', 355, -6, 11, 0, HH, 'city'], ['g', 410, 0, 12, 6, 16, 'city']],
    [['g', 130, -7, 11, 2, 12, 'city'], ['g', 180, 7, 11, 6, 16, 'city'], ['g', 230, -7, 11, 3, 13, 'city'], ['g', 280, 7, 11, 6, 16, 'city'], ['g', 330, 0, 11, 2, 11, 'city'], ['b', 375, 7, 10], ['g', 425, 0, 11, 7, 16, 'city']]
  ];
  const RG = [[100, 8], [146, 16], [192, 9], [238, 18], [284, 10], [330, 19], [376, 8], [422, 16]];   // b : anneaux
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let W = null;
  let bgPlane = null;
  const ensureBg = (g) => {   // b : fond de ciel uni derriere la fusee
    if (bgPlane) return bgPlane;
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const c2 = cv.getContext('2d'), gr = c2.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5fb6ff'); gr.addColorStop(0.5, '#a9dcff'); gr.addColorStop(0.78, '#e6f6ff'); gr.addColorStop(1, '#f4fbff'); c2.fillStyle = gr; c2.fillRect(0, 0, 4, 256);
    bgPlane = new T3.Mesh(new T3.PlaneGeometry(1400, 520), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(cv), fog: false, side: T3.DoubleSide })); bgPlane.frustumCulled = false; g.scene.add(bgPlane); return bgPlane;
  };
  const disposeW = (g) => { if (W) { try { g.scene.remove(W.grp); } catch (e) { /* ignore */ } W = null; } };
  const addBox = (T, d, lx, y0, y1, w, dep, style) => {
    const h = y1 - y0; if (h < 0.2 || w < 0.2) return;
    const m = new T3.Mesh(new T3.BoxGeometry(w, h, dep), matOf(style, w, h));
    place(T, d, lx, y0 + h / 2, m.position); m.rotation.y = yawAt(T, d); W.grp.add(m); m.updateMatrixWorld(true); W.ob.push({ m, w, h, dep });
  };
  const gapWall = (T, d, gx, gw, y0, y1, style) => {   // un mur sur toute la largeur avec une ouverture rectangulaire
    const L = 40, dep = style === 'city' ? 9 : 4, a = gx - gw / 2, b = gx + gw / 2; W.gaps.push({ d, lx: gx, h: U.clamp((y0 + Math.min(y1, 22)) / 2, 3, 15) });
    addBox(T, d, (-L + a) / 2, 0, HH, a + L, dep, style); addBox(T, d, (b + L) / 2, 0, HH, L - b, dep, style);
    addBox(T, d, gx, y1, HH, gw, dep, style); addBox(T, d, gx, 0, y0, gw, dep, style);
  };
  const bridge = (T, d, y0, y1) => {   // un pont : on passe dessous ou dessus
    W.gaps.push({ d, lx: 0, h: y0 > 6 ? 3.5 : 16 }); addBox(T, d, 0, y0, y1, 80, 8, 'city');
    for (const s of [-1, 1]) addBox(T, d, s * 19, 0, y0, 5, 5, 'city');
  };
  const buildW = (g, run) => {
    disposeW(g); const T = run.T, grp = new T3.Group(); seed = 7 + LV;
    W = { run, grp, T, ob: [], rg: [], fr: [], bots: [], gaps: [], rings: 0, t0: null };
    g.scene.add(grp);
    if (CTRL === 'a') {
      for (const o of (LVL[LV] || [])) { if (o[0] === 'g') gapWall(T, o[1], o[2], o[3], o[4], o[5], o[6]); else bridge(T, o[1], o[2], o[3]); }
    } else {
      for (let i = 0; i < RG.length; i++) {   // anneaux a traverser
        const [d, h] = RG[i], m = new T3.Mesh(new T3.TorusGeometry(6, 0.6, 10, 36), new T3.MeshBasicMaterial({ color: '#ffd23a' }));
        place(T, d, 0, h, m.position); m.rotation.y = yawAt(T, d); grp.add(m); W.rg.push({ d, h, m, c: m.position.clone(), prev: null, done: false, ok: false });
      }
    }
    if (RIV) {
      const cols = ['#e8352b', '#2fae22'], sp = [baseSpeed() - 2, baseSpeed() + 1.5];
      for (let i = 0; i < 2; i++) {
        const b = new T3.Group(), body = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.5, 2.6, 12), new T3.MeshLambertMaterial({ color: cols[i] })), nose = new T3.Mesh(new T3.ConeGeometry(0.5, 1.1, 12), new T3.MeshLambertMaterial({ color: '#f2f2f2' }));
        body.rotation.x = Math.PI / 2; nose.rotation.x = Math.PI / 2; nose.position.z = 1.8; const f1 = new T3.Mesh(new T3.BoxGeometry(2.2, 0.12, 0.7), new T3.MeshLambertMaterial({ color: cols[i] })); f1.position.z = -1; b.add(body, nose, f1);
        grp.add(b); W.bots.push({ m: b, sp: sp[i], lx: i ? 8 : -8, d: 0, col: cols[i], tFin: FIN / sp[i] + 0.35 });
      }
    }
  };

  // ---------------------------------------------------------------- camera : toujours le meme angle, un peu derriere et au-dessus de la fusee
  const camP = new V(), camL = new V();
  E.mvpCam = (rig, rk, cam, dt) => {
    const g = rig.game, run = g.endlessRun; if (!run || !run.T) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const k = Math.min(1, (dt || 0.016) * 8), gy = T.base(d), lx = tmp.copy(rk.pos).sub(cc).dot(nn), hr = rk.pos.y - gy;
    if (CTRL === 'a') {   // derriere : la camera suit la fusee a moitie (en travers et en hauteur), toujours avec le meme tangage
      const dc = Math.max(0, d - 9), p = place(T, dc, lx * 0.55, 4.6 + hr * 0.45, camP);
      frame(T, d + 30); camL.set(p.x + tf.x * 45, p.y - 8.5, p.z + tf.z * 45);
    } else {   // b : de cote : on voit la hauteur des obstacles
      camP.copy(rk.pos).addScaledVector(nn, 22).addScaledVector(tf, -3); camP.y = rk.pos.y + 3; camL.copy(rk.pos).addScaledVector(tf, 12); camL.y = rk.pos.y;
    }
    if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
    rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
  };

  // ---------------------------------------------------------------- pilotage direct de la fusee
  const LAT = 12, HLO = 2.2, HHI = 17;
  const drive = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk.active || g.state !== 'FLIGHT' || g.evoFinish || g.flightTime < 0.3) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const gy = T.base(d), lx = tmp.copy(rk.pos).sub(cc).dot(nn), SP = baseSpeed();
    let vlat = 0, vy = 0;
    if (CTRL === 'a') {
      const k = I.k;
      if (I.mode === 'keys') {   // fleches : la fusee repond tout de suite (pas de lissage de viseur)
        const tx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0), ty = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0), f = Math.min(1, dt * 16);
        I.ax += (tx - I.ax) * f; I.ay += (ty - I.ay) * f;
        const slope = (T.base(d + 6) - gy) / 6 * SP;   // sans touche, la fusee garde sa hauteur au-dessus du sol (la prairie descend)
        vlat = I.ax * 26; vy = slope + I.ay * 24; const hr = rk.pos.y - gy;
        if ((lx > LAT && vlat > 0) || (lx < -LAT && vlat < 0)) vlat = (0 - lx) * 3;
        if (hr > HHI && vy > slope) vy = Math.min(vy, slope + (HHI - hr) * 4); if (hr < HLO && vy < slope) vy = Math.max(vy, slope + (HLO - hr) * 4);
      } else {
        const cam = g.camera; org.copy(cam.position); ray.set(I.cx, -(I.cy * 2 - 1), 0.5).unproject(cam).sub(org).normalize();
        const den = ray.dot(tf); let tx = lx, ty = rk.pos.y;
        if (Math.abs(den) > 0.05) { const t = (tmp.copy(rk.pos).sub(org).dot(tf) + 40) / den; if (t > 0) { const P = tmp.copy(org).addScaledVector(ray, t); tx = P.clone().sub(cc).dot(nn); ty = P.y; } }
        tx = U.clamp(tx, -LAT, LAT); ty = U.clamp(ty, gy + HLO, gy + HHI);
        vlat = U.clamp((tx - lx) * 5, -30, 30); vy = U.clamp((ty - rk.pos.y) * 5, -30, 30);
        I.ax = vlat / 26; I.ay = vy / 24;
      }
    } else {
      vlat = U.clamp((0 - lx) * 2, -8, 8);
      const want = I.hold ? 17 : -14; vy = rk.vel.y + (want - rk.vel.y) * Math.min(1, dt * 6);
      if (rk.pos.y < gy + 1.6 && vy < 0) { vy = 0; rk.pos.y = gy + 1.6; }
      if (rk.pos.y > gy + 34 && vy > 0) vy = 0;
    }
    rk.vel.set(tf.x * SP + nn.x * vlat, vy, tf.z * SP + nn.z * vlat);
    const dir = tmp.copy(rk.vel).normalize(), yaw = Math.atan2(-dir.x, -dir.z), pit = Math.asin(U.clamp(dir.y, -0.9, 0.9));
    g.input.setAim(yaw, pit);
  };

  // ---------------------------------------------------------------- chaque image : collisions, rivaux, fondu de la ligne, fin
  const finalStars = (d) => {
    if (CTRL === 'b') return d.rings >= 8 ? 3 : d.rings >= 6 ? 2 : 1;
    return d.fails === 0 ? 3 : d.fails === 1 ? 2 : 1;
  };
  let ended = null, wantEnd = 0;
  const step = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !run.T) return;
    if (!W || W.run !== run) { buildW(g, run); ended = null; g._mvEnd = 0; if (g.ui.overlay === 'evoWin') g.ui.overlay = null; }
    const T = run.T, flying = g.state === 'FLIGHT' && rk.active;
    try { document.body.style.cursor = (I.mode === 'keys' && g.state === 'FLIGHT') ? 'none' : ''; } catch (e) { /* ignore */ }
    if (CTRL === 'b') { const bg = ensureBg(g); frame(T, Math.max(0, run.dist)); const gyy = T.base(Math.max(0, run.dist)); bg.position.set(rk.pos.x - nn.x * 40, gyy + 190, rk.pos.z - nn.z * 40); bg.rotation.set(0, Math.atan2(nn.x, nn.z), 0); bg.visible = true; }
    { const gt = g._shortGate; if (gt && gt.grp && gt.grp.children[0]) { const gone = g.evoFinish ? U.clamp(1 - (performance.now() - g.evoFinish.t0) / 500, 0, 1) : 1; gt.grp.children[0].material.opacity = 0.46 * gone * U.clamp((640 - (FIN - Math.max(0, run.dist))) / 220, 0, 1); } }   // la ligne apparait en fondu de loin et s'efface une fois franchie
    if (rk.mesh) rk.mesh.scale.setScalar(CTRL === 'b' ? 1.6 : 2.4);   // la fusee est plus grosse a l'ecran
    if (ended && wantEnd && performance.now() >= wantEnd) { wantEnd = 0; g.evoWin = { mv: true, t0: performance.now(), lv: LV, info: ended }; g.ui.overlay = 'evoWin'; try { g.audio.play('victory'); } catch (e) { /* son */ } }
    if (!flying && !g.evoFinish) return;
    const t = Math.max(0, g.flightTime), fin = !!g.evoFinish;
    if (flying && !fin) {
      for (const o of W.ob) { o.m.worldToLocal(tmp2.copy(rk.pos)); if (Math.abs(tmp2.x) < o.w / 2 + 0.8 && Math.abs(tmp2.y) < o.h / 2 + 0.8 && Math.abs(tmp2.z) < o.dep / 2 + 0.8) { g.onRocketCrash('wall', rk.pos.clone(), new V(0, 0, 1)); return; } }
      for (const r of W.rg) {
        frame(T, r.d); const s = tmp2.copy(rk.pos).sub(r.c).dot(tf);
        if (r.prev !== null && !r.done && r.prev < 0 && s >= 0) { r.done = true; const dd = Math.hypot(tmp2.copy(rk.pos).sub(r.c).dot(nn), rk.pos.y - r.c.y); r.ok = dd < 6.6; r.m.material.color.set(r.ok ? '#3ddc5a' : '#e8352b'); if (r.ok) { W.rings++; try { g.audio.play('target'); } catch (e) { /* son */ } } }
        r.prev = s;
      }
    }
    if (RIV) {   // rivaux
      const tb = Math.max(0, t - 0.35);
      W.bots.forEach((b, i) => {
        b.d = Math.min(FIN + 40, b.sp * tb); const h = 7 + 4 * Math.sin(tb * 1.7 + i * 2.1); place(T, b.d, b.lx + 3 * Math.sin(tb * 1.1 + i), h, b.m.position);
        place(T, b.d + 8, b.lx, h, tmp2); b.m.lookAt(tmp2); b.m.visible = tb > 0;
      });
    }
    if (fin && !g._mvEnd) {
      g._mvEnd = 1; const time = t; const nb = RIV ? W.bots.filter((b) => b.tFin < time).length : 0;
      ended = { time, rings: W.rings, place: 1 + nb, fails: fails[LV] || 0, t0: performance.now() }; ended.stars = finalStars(ended);
      const best = parseFloat(lsGet('cc.mvp.best.' + M + '.' + LV, '0')) || 0; ended.rec = !best || time < best; ended.best = best;
      if (ended.rec) lsSet('cc.mvp.best.' + M + '.' + LV, time.toFixed(2));
      fails[LV] = 0; wantEnd = performance.now() + 750;
    }
  };

  // ---------------------------------------------------------------- relances
  const restart = (g) => {
    ended = null; wantEnd = 0; g._mvEnd = 0; g.evoWin = null;
    const rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; }
    E.endTumble(g); g.evoReport = false; g.evoLast = null; if (g.rig) g.rig._mv = null; g.goHome({});
  };
  const goNext = (g) => { LV = LV >= NLV ? 1 : LV + 1; lsSet('cc.mvp.lv.' + M, LV); restart(g); };
  E.finishRun = (g) => { g.evoFinish = { t0: performance.now(), hold: true }; try { g.audio.play('finish'); g.flash = 0.8; g.flashColor = '#fff2c0'; g.hitStop = 0.25; g.hitScale = 0.3; g.rig.shake = 0.6; g.audio.setZone('evoDawn', false); } catch (e) { /* effets */ } };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    if (g.rocket && g.rocket.active && g.evo) { g.rocket.fuel = g.rocket.fuelMax = 999; }
    try { step(g, dt); } catch (e) { if (!E._mvErr) { E._mvErr = 1; console.warn('mvp', e); } }
    try { drive(g, dt); } catch (e) { /* pilotage facultatif */ }
  };
  E.beginEnd = (g) => { fails[LV] = (fails[LV] || 0) + 1; restart(g); };   // echec : retour au hangar, START
  E.onClear = () => { /* la carte de fin prend la suite */ };
  E.mvpWorld = () => W;

  // ---------------------------------------------------------------- HUD de vol : l'ancienne barre de progression, couchee, + le chrono
  Home.evoUI.hud = function (ctx, g, W0, H) {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk || g.ui.overlay) return;
    const u = H > W0 ? W0 : Math.min(W0, H * 0.62); UI.begin(u, g.hudPr || 1); const S = UI.S;
    const pct = U.clamp(run.dist / FIN, 0, 1), len = Math.min(W0 * 0.5, H * 0.95), bw = len * 0.13, cx = W0 / 2, cy = H * 0.02 + bw / 2 + S(6);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2);   // la barre verticale devient horizontale : depart a gauche, drapeau a droite
    const bh = len, bx = -bw / 2, by = -bh / 2, tx = bx + bw * 0.213, tw2 = bw * 0.567, ty = by + bh * 0.125, th = bh * 0.77, rr = tw2 / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(tx + rr, ty); ctx.arc(tx + rr, ty + rr, rr, -Math.PI / 2, 0); ctx.lineTo(tx + tw2, ty + th - rr); ctx.arc(tx + rr, ty + th - rr, rr, 0, Math.PI); ctx.lineTo(tx, ty + rr); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#696A6D'; ctx.fillRect(tx, ty, tw2, th); ctx.fillStyle = '#387CEE'; ctx.fillRect(tx, ty + th * (1 - pct), tw2, th * pct + 1);
    const gl = ctx.createLinearGradient(tx, 0, tx + tw2, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.3, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(tx, ty + th * (1 - pct), tw2, th * pct + 1);
    const gh = ctx.createLinearGradient(tx, 0, tx + tw2, 0); gh.addColorStop(0, 'rgba(4,16,48,0.6)'); gh.addColorStop(0.26, 'rgba(4,16,48,0)'); gh.addColorStop(0.7, 'rgba(4,16,48,0)'); gh.addColorStop(1, 'rgba(4,16,48,0.45)'); ctx.fillStyle = gh; ctx.fillRect(tx, ty, tw2, th);
    if (RIV && W) for (const b of W.bots) { const yy = ty + th * (1 - U.clamp(b.d / FIN, 0, 1)); ctx.fillStyle = b.col; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, tw2 * 0.1); ctx.beginPath(); ctx.arc(tx + tw2 / 2, yy, tw2 * 0.3, 0, 6.283); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    if (!UI.artImg(ctx, 'bar', bx + bw / 2, by + bh / 2, bh)) UI.checkFlag(ctx, bx, by, bw, S(60));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowOffsetX = S(5); ctx.shadowOffsetY = S(6); UI.icon(ctx, 'missile_ogive', bx + bw / 2, ty + th * (1 - pct) - S(4), bw * 1.25, { rot: -Math.PI / 4 }); ctx.restore();
    ctx.restore();
    const tm = (g.evoFinish && ended ? ended.time : Math.max(0, g.flightTime)).toFixed(1) + ' S';
    UI.text(ctx, tm, cx, cy + bw / 2 + S(46), S(70), '#ffffff', { outline: true });
    if (RIV && W) { let ahead = 0; for (const b of W.bots) if (b.d > Math.max(0, run.dist)) ahead++; UI.text(ctx, (1 + ahead) + '/3', cx + len / 2 + S(90), cy, S(80), '#FFD23A', { outline: true }); }
  };

  // ---------------------------------------------------------------- accueil : le hangar, START au milieu, une fleche de chaque cote
  const finger = (ctx, x, y, u) => {   // la main du jeu : un rond blanc qui appuie (comme sur l'ecran de lancement d'origine)
    const t = performance.now() * 0.001, press = 0.5 + 0.5 * Math.sin(t * 5), fy = y - press * u * 0.025, fr = u * 0.04 * (1 - 0.12 * press);
    ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.beginPath(); ctx.arc(x, fy, fr, 0, 6.283); ctx.fill(); ctx.fillRect(x - fr * 0.55, fy, fr * 1.1, fr * 2.2);
    ctx.strokeStyle = 'rgba(11,14,20,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, fy, fr, 0, 6.283); ctx.stroke();
  };
  const startRun = (g) => { if (g.state === 'MENU' && !g.evoAim && !g.evoAnim) E.start(g); };
  Home.drawEvo = function (ui, ctx, g, W0, H) {
    const F = Home.evoK.frame(ui, ctx, W0, H), { Y, cw, cx } = F, S = UI.S;
    const bx0 = cx - cw / 2 + S(60), by0 = Y(0.07);   // niveau
    UI.levelBadge(ctx, bx0 + S(50), by0, S(48), LV);
    UI.text(ctx, 'NIVEAU ' + LV, bx0 + S(120), by0 - S(14), S(52), '#ffffff', { align: 'left', outline: true });
    UI.text(ctx, NAMES[LV - 1], bx0 + S(120), by0 + S(34), S(34), '#FFD23A', { align: 'left' });
    const bw = cw * 0.46, bh = S(150), bx = cx - bw / 2, by = Y(0.84) - bh / 2, kw = S(118), gap = S(60), t = performance.now() / 1000, pr = (Math.floor(t * 1.6) % 2) === 0;   // START, avec les fleches gauche et droite du jeu
    const kd = CC.Joy && CC.Joy.desk && CC.Joy.desk.keycap;
    if (kd) { kd(ctx, bx - gap - kw / 2, by + bh / 2, kw, 1, pr, 1); kd(ctx, bx + bw + gap + kw / 2, by + bh / 2, kw, 2, !pr, 1); }
    const pulse = 1 + 0.03 * Math.sin(t * 5); ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'START'); ctx.restore();
    finger(ctx, bx + bw * 0.74, by + bh + S(12), cw);
    UI.tap(ui, bx, by, bw, bh, () => startRun(g));
  };
  Home.drawEvoAim = function () { };   // plus de barre de lancement : START part tout de suite

  // ---------------------------------------------------------------- carte de fin (style MISSION ACCOMPLIE)
  const _win = Home.drawEvoWin;
  Home.drawEvoWin = function (ui, ctx, g, W0, H) {
    const w = g.evoWin; if (!w || !w.mv) return _win.apply(this, arguments);
    const F = Home.evoK.frame(ui, ctx, W0, H), { HH: HH2, Y, T0, cw, cx } = F, S = UI.S, t = (performance.now() - w.t0) / 1000, I2 = w.info;
    ctx.fillStyle = 'rgba(8,10,14,0.55)'; ctx.fillRect(0, T0, W0, HH2);
    { const a = Math.min(1, t / 0.4), ttl = 'NIVEAU ' + w.lv + ' TERMINE !'; ctx.save(); ctx.globalAlpha = a; UI.text(ctx, ttl, cx, Y(0.12), UI.fit(ctx, ttl, cw * 0.92, S(100)), '#FFD23A', { outline: true }); ctx.restore(); }
    for (let k = 0; k < 3; k++) { const on = k < I2.stars, s = Math.min(1, Math.max(0, (t - 0.25 - k * 0.3) / 0.3)), e = s < 1 ? 1 + 0.5 * Math.sin(s * 3.1416) : 1; ctx.save(); if (!on) ctx.globalAlpha = 0.35; Home.evoUI.star(ctx, cx + (k - 1) * S(250), Y(0.27) - (k === 1 ? S(40) : 0), S(115) * (k === 1 ? 1.25 : 1) * s * e); ctx.restore(); }
    UI.text(ctx, I2.time.toFixed(1) + ' S', cx, Y(0.46), S(120), '#ffffff', { outline: true });
    let sub = I2.rec ? 'NOUVEAU RECORD !' : 'MEILLEUR ' + I2.best.toFixed(1) + ' S'; if (CTRL === 'b') sub += '   ANNEAUX ' + I2.rings + '/8'; if (RIV) sub += '   PLACE ' + I2.place + '/3';
    UI.text(ctx, sub, cx, Y(0.55), UI.fit(ctx, sub, cw * 0.9, S(56)), I2.rec ? '#FFD23A' : '#dfe6f0', {});
    if (t > 0.9) {
      const bw = cw * 0.62, bh = S(150), bx = cx - bw / 2, by = Y(0.68), pulse = 1 + 0.03 * Math.sin(t * 5);
      ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-cx, -(by + bh / 2)); UI.btnPrimary(ctx, bx, by, bw, bh, 'SUIVANT'); ctx.restore(); UI.tap(ui, bx, by, bw, bh, () => goNext(g));
      const sw = cw * 0.3, sh = S(110), sy = Y(0.84), gp = S(30);
      UI.btnSecondary(ctx, cx - gp / 2 - sw, sy, sw, sh, 'REJOUER'); UI.tap(ui, cx - gp / 2 - sw, sy, sw, sh, () => restart(g));
      UI.btnSecondary(ctx, cx + gp / 2, sy, sw, sh, 'MENU'); UI.tap(ui, cx + gp / 2, sy, sw, sh, () => restart(g));
    }
  };

  // ---------------------------------------------------------------- accueil toujours affiche : le hangar reste a l'ecran
  setInterval(() => {
    const g = CC.game; if (!g || !g.padMode || !g.ui) return;
    try { const S = E.save(g); if (S && !S.tutPC) { S.tutPC = 1; } } catch (e) { /* ignore */ }
    const ov = g.ui.overlay;
    if (g.state === 'MENU' && !g.evoAim && !g.evoAnim && (!ov || ov === 'terms' || ov === 'evoIntro' || ov === 'evoCine' || ov === 'evoShop' || ov === 'evoChest' || ov === 'evoReport' || ov === 'evoSkins') && !ended) g.ui.overlay = 'evo';
    if (g.state === 'LAUNCH' && g.evoAim && !g.evoAim.lock && g.evoAim.t > 0.12) E.lock(g);   // START : la fusee part tout de suite
  }, 40);
})();
