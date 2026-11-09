/* v363 : trois MVP de niveau court (?mvp=a|b|c), tous sur la prairie penchee de evo_short.js.
 * Communs : camera toujours identique ; carburant illimite ; ecran de depart (START + main + pictogrammes, sans texte) ; HUD du haut
 * (progression, chrono, cibles/anneaux, place) ; ecran de fin en une seconde (temps, etoiles, SUIVANT / rejouer / accueil) ; relance
 * immediate apres un echec.
 * a = CURSEUR : la fusee va vers le curseur (ou les fleches). 3 cibles (chacune donne un turbo) puis un champ de caisses a casser (DAMAGE BONUS).
 * b = MAINTENIR : Espace / clic / doigt = monte, relache = descend ; vue de cote, fond simplifie ; 8 anneaux a traverser (turbo).
 * c = comme a, avec 2 fusees rivales, la place affichee en haut et des etoiles selon la place. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const mm = /[?&]mvp=([abc])/.exec(location.search), M = mm ? mm[1] : (/^[abc]$/.test(window.CC_MVP || '') ? window.CC_MVP : null);
  E.mvp = () => M;
  if (!M) return;
  const T3 = THREE, V = T3.Vector3, U = CC.U;
  const FIN = E.shortFin || 470, CTRL = M === 'b' ? 'b' : 'a', RIV = M === 'c';
  CC.CONFIG.physics.gravity = 0;   // la fusee est pilotee directement (vitesse imposee)
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* facultatif */ } };
  let LV = Math.max(1, Math.min(20, parseInt(lsGet('cc.mvp.lv.' + M, '1'), 10) || 1));
  const baseSpeed = () => 42 + Math.min(8, LV - 1);
  // carburant illimite, jamais "en panne"
  const _rk = E.rocket;
  E.rocket = (n) => { const r = _rk(n); return Object.assign({}, r, { tier: 2, fuel: 999 }); };
  // plus de HUD de vol dessine dans le canvas (jauge, compteur, barre) : le HUD du haut est une page HTML
  if (CC.Home && CC.Home.evoUI) CC.Home.evoUI.hud = function () { };

  // ---------------------------------------------------------------- entrees
  const I = { cx: 0, cy: 0.5, hold: false, mouse: false, k: {} };
  let started = false, ended = null;
  const setC = (x, y) => { I.cx = x / window.innerWidth * 2 - 1; I.cy = y / window.innerHeight; I.mouse = true; };
  window.addEventListener('mousemove', (e) => setC(e.clientX, e.clientY));
  window.addEventListener('mousedown', (e) => { if (e.button === 0) { I.hold = true; setC(e.clientX, e.clientY); } });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) I.hold = false; });
  window.addEventListener('touchstart', (e) => { I.hold = true; const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) setC(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend', (e) => { if (!e.touches.length) I.hold = false; }, { passive: true });
  window.addEventListener('keydown', (e) => {
    I.k[e.code] = 1; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') I.hold = true;
    if (e.repeat) return;
    if (!started && (e.code === 'Space' || e.code === 'Enter')) { start(); e.preventDefault(); }
    else if (ended && performance.now() - ended.t0 > 500) { if (e.code === 'Enter' || e.code === 'Space') { next(); e.preventDefault(); } else if (e.code === 'KeyR') again(); }
  });
  window.addEventListener('keyup', (e) => { I.k[e.code] = 0; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') I.hold = false; });
  E.mvpInput = I; E.mvpWorld = () => W;

  // ---------------------------------------------------------------- page HTML : depart, HUD, fin
  const css = document.createElement('style');
  css.textContent = [
    '.mv{position:fixed;z-index:60;font-family:"Lilita One","Russo One",Arial Black,Arial,sans-serif;color:#fff;user-select:none;-webkit-user-select:none}',
    '#mv-hud{left:50%;top:1.6vh;transform:translateX(-50%);width:min(58vw,560px);display:none;pointer-events:none}',
    '#mv-hud .row{display:flex;align-items:center;gap:10px}',
    '#mv-hud .lv{font-size:clamp(14px,2.4vh,22px);text-shadow:0 2px 0 rgba(0,0,0,.5)}',
    '#mv-hud .bar{position:relative;flex:1;height:clamp(12px,2.2vh,20px);border-radius:12px;background:rgba(10,20,40,.55);border:3px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.35)}',
    '#mv-hud .fill{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:linear-gradient(#ffe36a,#ffb020);width:0}',
    '#mv-hud .flag{position:absolute;right:-6px;top:-9px;width:22px;height:30px;background:repeating-conic-gradient(#fff 0 25%,#111 0 50%) 0 0/11px 11px;border:2px solid #fff;border-radius:3px}',
    '#mv-hud .dot{position:absolute;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.4)}',
    '#mv-hud .tm{font-size:clamp(18px,3.2vh,30px);min-width:3.4em;text-align:right;text-shadow:0 2px 0 rgba(0,0,0,.5)}',
    '#mv-hud .row2{display:flex;justify-content:center;gap:12px;margin-top:6px;font-size:clamp(16px,3vh,28px);text-shadow:0 2px 0 rgba(0,0,0,.5)}',
    '#mv-hud .pip{width:clamp(18px,3vh,28px);height:clamp(18px,3vh,28px);border-radius:50%;border:3px solid #fff;background:rgba(10,20,40,.45)}',
    '#mv-hud .pip.on{background:#ff5a4a}#mv-hud .pip.ring.on{background:#ffd23a}',
    '#mv-hud .pl{font-size:clamp(20px,4vh,38px);color:#ffe36a}',
    '#mv-toast{left:50%;top:26vh;transform:translate(-50%,0);font-size:clamp(26px,6vh,56px);text-shadow:0 4px 0 rgba(0,0,0,.45);pointer-events:none;opacity:0;transition:opacity .15s,transform .6s}',
    '#mv-start{inset:0;display:none;flex-direction:column;align-items:center;justify-content:flex-end;gap:2.5vh;padding-bottom:9vh;background:linear-gradient(rgba(10,24,50,.0),rgba(10,24,50,.55))}',
    '#mv-start .hint{display:flex;align-items:center;gap:22px;margin-bottom:1vh}',
    '.mv-key{display:inline-flex;align-items:center;justify-content:center;min-width:clamp(34px,6vh,54px);height:clamp(34px,6vh,54px);border-radius:10px;background:linear-gradient(#fff,#cfd5e1);color:#2b3347;font-size:clamp(18px,3.2vh,30px);box-shadow:0 5px 0 #6a7384,0 8px 12px rgba(0,0,0,.35)}',
    '.mv-key.down{transform:translateY(4px);box-shadow:0 1px 0 #6a7384}',
    '.mv-key.wide{min-width:clamp(120px,22vh,200px)}',
    '.mv-pad{display:grid;grid-template-columns:repeat(3,auto);gap:6px;justify-items:center}',
    '.mv-btn{position:relative;border:0;cursor:pointer;color:#fff;font-family:inherit;font-size:clamp(28px,6vh,54px);padding:.35em 1.6em;border-radius:16px;background:linear-gradient(#6fe04a,#2fae22);box-shadow:0 7px 0 #1b6e14,0 12px 18px rgba(0,0,0,.35);text-shadow:0 3px 0 rgba(0,0,0,.35)}',
    '.mv-btn:active{transform:translateY(5px);box-shadow:0 2px 0 #1b6e14}',
    '.mv-btn.blue{background:linear-gradient(#4aa8ff,#1d6fe0);box-shadow:0 7px 0 #134aa0,0 12px 18px rgba(0,0,0,.35)}',
    '.mv-btn.round{padding:.2em .5em;font-size:clamp(24px,5vh,44px);border-radius:50%;background:linear-gradient(#ffffff,#cfd5e1);color:#2b3347;box-shadow:0 5px 0 #6a7384;text-shadow:none}',
    '#mv-hand{position:absolute;right:-.55em;bottom:-1.1em;font-size:1.15em;animation:mvh .9s ease-in-out infinite;pointer-events:none;filter:drop-shadow(0 3px 2px rgba(0,0,0,.4))}',
    '@keyframes mvh{0%,100%{transform:translate(0,0) rotate(-12deg)}50%{transform:translate(-8px,-10px) rotate(-12deg)}}',
    '@keyframes mvm{0%{transform:translateX(-26px)}50%{transform:translateX(26px)}100%{transform:translateX(-26px)}}',
    '#mv-end{inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,24,50,.35)}',
    '#mv-end .card{width:min(86vw,460px);padding:22px 22px 26px;border-radius:22px;background:linear-gradient(#35c3ff,#1b7fe0);border:5px solid #fff;box-shadow:0 12px 0 rgba(0,0,0,.25);text-align:center;animation:mvp .28s ease-out}',
    '@keyframes mvp{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}',
    '#mv-end .ti{font-size:clamp(22px,4.4vh,38px);text-shadow:0 3px 0 rgba(0,0,0,.35)}',
    '#mv-end .st{font-size:clamp(40px,9vh,74px);letter-spacing:6px;margin:6px 0;text-shadow:0 4px 0 rgba(0,0,0,.35)}',
    '#mv-end .st i{font-style:normal;color:#ffe36a}#mv-end .st u{text-decoration:none;color:rgba(0,0,0,.28)}',
    '#mv-end .tm{font-size:clamp(26px,5.4vh,46px)}',
    '#mv-end .sub{font-size:clamp(14px,2.6vh,22px);opacity:.95;margin-top:4px}',
    '#mv-end .btns{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px}'
  ].join('\n');
  document.head.appendChild(css);
  const mk = (id, html, cls) => { const d = document.createElement('div'); d.id = id; d.className = 'mv ' + (cls || ''); d.innerHTML = html; document.body.appendChild(d); return d; };
  const K = (t, c) => '<span class="mv-key ' + (c || '') + '">' + t + '</span>';
  const mouseIcon = '<svg width="54" height="70" viewBox="0 0 54 70" style="animation:mvm 1.6s ease-in-out infinite"><rect x="6" y="4" width="42" height="62" rx="21" fill="#fff" stroke="#2b3347" stroke-width="4"/><line x1="27" y1="4" x2="27" y2="28" stroke="#2b3347" stroke-width="4"/><rect x="22" y="12" width="10" height="14" rx="5" fill="#2b3347"/></svg>';
  const hintA = mouseIcon + '<span style="font-size:clamp(20px,4vh,34px);opacity:.9">/</span><div class="mv-pad"><span></span>' + K('↑') + '<span></span>' + K('←') + K('↓') + K('→') + '</div>';
  const hintB = '<div style="display:flex;flex-direction:column;align-items:center;gap:8px">' + K('ESPACE', 'wide down') + '<span style="font-size:clamp(26px,5vh,44px)">↑</span></div><span style="font-size:clamp(20px,4vh,34px);opacity:.9">/</span><div style="display:flex;flex-direction:column;align-items:center;gap:8px">' + K('ESPACE', 'wide') + '<span style="font-size:clamp(26px,5vh,44px)">↓</span></div>';
  const elHud = mk('mv-hud', '<div class="row"><span class="lv"></span><div class="bar"><div class="fill"></div><span class="flag"></span></div><span class="tm">0.0</span></div><div class="row2"></div>');
  const elToast = mk('mv-toast', '');
  const elStart = mk('mv-start', '<div class="hint">' + (CTRL === 'b' ? hintB : hintA) + '</div><button class="mv-btn" id="mv-go">START<span id="mv-hand">👆</span></button>');
  const elEnd = mk('mv-end', '<div class="card"><div class="ti"></div><div class="st"></div><div class="tm"></div><div class="sub"></div><div class="btns"><button class="mv-btn round" id="mv-home">⌂</button><button class="mv-btn blue" id="mv-next">SUIVANT ▶</button><button class="mv-btn round" id="mv-again">↻</button></div></div>');
  const q = (el, s) => el.querySelector(s);
  const hudLv = q(elHud, '.lv'), hudBar = q(elHud, '.bar'), hudFill = q(elHud, '.fill'), hudTm = q(elHud, '.tm'), hudR2 = q(elHud, '.row2');
  let toastT = 0; const toast = (t, col) => { elToast.textContent = t; elToast.style.color = col || '#fff'; elToast.style.opacity = '1'; elToast.style.transform = 'translate(-50%,-14px)'; toastT = performance.now(); setTimeout(() => { if (performance.now() - toastT > 700) { elToast.style.opacity = '0'; elToast.style.transform = 'translate(-50%,0)'; } }, 800); };

  // ---------------------------------------------------------------- aides de geometrie
  const tf = new V(), nn = new V(), cc = new V(), ray = new V(), org = new V(), tmp = new V(), tmp2 = new V();
  const frame = (T, d) => {
    const a = T.at(d, 0, 0), b = T.at(d + 6, 0, 0), c1 = T.at(d, 1, 0);
    tf.set(b[0] - a[0], 0, b[2] - a[2]); if (tf.lengthSq() < 1e-6) tf.set(0, 0, -1); tf.normalize();
    nn.set(c1[0] - a[0], 0, c1[2] - a[2]).normalize(); cc.set(a[0], a[1], a[2]);
  };
  const place = (T, d, lx, h, out) => { frame(T, d); return out.set(cc.x + nn.x * lx, T.base(d) + h, cc.z + nn.z * lx); };
  const yawAt = (T, d) => { frame(T, d); return Math.atan2(tf.x, tf.z); };
  const mat = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c, side: T3.DoubleSide }, o || {}));

  // ---------------------------------------------------------------- le monde du niveau (cibles, anneaux, caisses, rivaux)
  const TG = [[120, -9, 8], [235, 10, 15], [350, -2, 5]];
  const RG = [[100, 8], [146, 16], [192, 9], [238, 18], [284, 10], [330, 19], [376, 8], [422, 16]];
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let W = null;
  let bgPlane = null;
  const ensureBg = (g) => {   // B : un grand fond uni (degrade de ciel) cache les falaises et les blocs gris du decor
    if (bgPlane) return bgPlane;
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const c2 = cv.getContext('2d'), gr = c2.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5fb6ff'); gr.addColorStop(0.5, '#a9dcff'); gr.addColorStop(0.78, '#e6f6ff'); gr.addColorStop(1, '#f4fbff'); c2.fillStyle = gr; c2.fillRect(0, 0, 4, 256);
    const tx = new T3.CanvasTexture(cv); bgPlane = new T3.Mesh(new T3.PlaneGeometry(1400, 520), new T3.MeshBasicMaterial({ map: tx, fog: false, side: T3.DoubleSide })); bgPlane.frustumCulled = false; g.scene.add(bgPlane); return bgPlane;
  };
  const disposeW = (g) => { if (W) { try { g.scene.remove(W.grp); } catch (e) { /* ignore */ } W = null; } };
  const buildW = (g, run) => {
    disposeW(g); const T = run.T, grp = new T3.Group(); seed = 7 + LV;
    W = { run, grp, T, tg: [], rg: [], cr: [], fr: [], bots: [], hits: 0, smashes: 0, boostT: 0, t0: null, prevD: 0 };
    if (CTRL === 'a') {
      for (let i = 0; i < TG.length; i++) {   // cibles : un tir a la cible, en trois cercles
        const [d, lx, h] = TG[i], g2 = new T3.Group(); const rr = [[4.8, '#e8352b'], [3.4, '#ffffff'], [2.1, '#e8352b'], [0.9, '#ffffff']];
        rr.forEach((r, k) => { const m = new T3.Mesh(new T3.CircleGeometry(r[0], 28), mat(r[1])); m.position.z = -0.05 * k; g2.add(m); });
        place(T, d, lx, h, g2.position); g2.rotation.y = yawAt(T, d); grp.add(g2); W.tg.push({ d, lx, h, grp: g2, alive: true, c: g2.position.clone() });
      }
      const cm = new T3.MeshLambertMaterial({ color: '#c9822f' }), sm = new T3.MeshBasicMaterial({ color: '#3a2410' }), bx = new T3.BoxGeometry(3.4, 3.4, 3.4), st = new T3.BoxGeometry(3.55, 0.5, 3.55);
      for (let i = 0; i < 44; i++) {   // champ de caisses juste avant la ligne : a traverser (DAMAGE BONUS)
        const d = 392 + rnd() * 70, lx = (rnd() - 0.5) * 34, h = 1.8 + rnd() * 17, c = new T3.Group();
        c.add(new T3.Mesh(bx, cm)); const s1 = new T3.Mesh(st, sm); s1.position.y = 0.9; const s2 = s1.clone(); s2.position.y = -0.9; c.add(s1, s2);
        place(T, d, lx, h, c.position); c.rotation.y = yawAt(T, d) + (rnd() - 0.5) * 0.8; grp.add(c); W.cr.push({ grp: c, alive: true, c: c.position.clone() });
      }
    } else {
      for (let i = 0; i < RG.length; i++) {   // anneaux a traverser
        const [d, h] = RG[i], m = new T3.Mesh(new T3.TorusGeometry(6, 0.6, 10, 36), mat('#ffd23a'));
        place(T, d, 0, h, m.position); m.rotation.y = yawAt(T, d); grp.add(m); W.rg.push({ d, h, m, c: m.position.clone(), prev: null, done: false, ok: false });
      }
    }
    if (RIV) {
      const cols = ['#e8352b', '#2fae22'], sp = [baseSpeed() - 1 + 0.4 * LV, baseSpeed() + 3 + 0.5 * LV];
      for (let i = 0; i < 2; i++) {
        const b = new T3.Group(), body = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.5, 2.6, 12), new T3.MeshLambertMaterial({ color: cols[i] })), nose = new T3.Mesh(new T3.ConeGeometry(0.5, 1.1, 12), new T3.MeshLambertMaterial({ color: '#f2f2f2' }));
        body.rotation.x = Math.PI / 2; nose.rotation.x = Math.PI / 2; nose.position.z = 1.8; const f1 = new T3.Mesh(new T3.BoxGeometry(2.2, 0.12, 0.7), new T3.MeshLambertMaterial({ color: cols[i] })); f1.position.z = -1; b.add(body, nose, f1);
        grp.add(b); W.bots.push({ m: b, sp: sp[i], lx: i ? 11 : -11, d: 0, col: cols[i], tFin: FIN / sp[i] + 0.35 });
      }
    }
    g.scene.add(grp);
    // HUD : les pastilles et les rivaux sur la barre
    hudR2.innerHTML = ''; W.pips = [];
    if (CTRL === 'a') { for (let i = 0; i < 3; i++) { const p = document.createElement('span'); p.className = 'pip'; hudR2.appendChild(p); W.pips.push(p); } }
    else { for (let i = 0; i < RG.length; i++) { const p = document.createElement('span'); p.className = 'pip ring'; hudR2.appendChild(p); W.pips.push(p); } }
    if (RIV) { W.pl = document.createElement('span'); W.pl.className = 'pl'; W.pl.textContent = '1/3'; hudR2.appendChild(W.pl); }
    hudBar.querySelectorAll('.dot').forEach((n) => n.remove()); W.dots = [];
    if (RIV) for (const b of W.bots) { const dt = document.createElement('span'); dt.className = 'dot'; dt.style.background = b.col; hudBar.appendChild(dt); W.dots.push(dt); }
    { const dt = document.createElement('span'); dt.className = 'dot'; dt.style.background = '#ffe36a'; hudBar.appendChild(dt); W.me = dt; }
  };
  const pop = (g, pos, col) => { try { g.effects.ring(pos.clone(), tf.clone(), 0.4, 9, 0.5, '#ffffff', 0.9); g.effects.flash(pos.clone(), col || '#fff2c0', 6, 40, 0.3, '#ffb030'); g.audio.play('target'); } catch (e) { /* effets facultatifs */ } };
  const smash = (g, c) => {   // une caisse qui explose en morceaux
    c.alive = false; c.grp.visible = false; W.smashes++;
    try { g.audio.play('boomSmall', c.c); } catch (e) { /* son facultatif */ }
    for (let i = 0; i < 5; i++) {
      const m = new T3.Mesh(new T3.BoxGeometry(0.9, 0.5, 0.7), new T3.MeshLambertMaterial({ color: i % 2 ? '#c9822f' : '#7a4a16' })); m.position.copy(c.c); W.grp.add(m);
      W.fr.push({ m, v: new V((rnd() - 0.5) * 16, 4 + rnd() * 9, (rnd() - 0.5) * 16).addScaledVector(g.rocket.vel, 0.45), life: 1.3 });
    }
  };
  const finalStars = (d) => {
    if (CTRL === 'b') return d.rings >= 8 ? 3 : d.rings >= 6 ? 2 : 1;
    if (RIV) return d.place === 1 ? 3 : d.place === 2 ? 2 : 1;
    return d.hits >= 3 ? (d.time <= 10.9 ? 3 : 2) : 1;
  };

  // ---------------------------------------------------------------- camera fixe
  const camP = new V(), camL = new V();
  E.mvpCam = (rig, rk, cam, dt) => {
    const g = rig.game, run = g.endlessRun; if (!run || !run.T) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const k = Math.min(1, (dt || 0.016) * 9);
    if (CTRL === 'a') {   // derriere, centree sur la piste : la fusee bouge a l'ecran selon le curseur
      const p = T.at(Math.max(0, d - 26), 0, 0), qq = T.at(d + 34, 0, 0);
      camP.set(p[0], T.base(Math.max(0, d - 26)) + 19, p[2]); camL.set(qq[0], T.base(d + 34) + 1, qq[2]);
    } else {   // de cote : on voit la hauteur des obstacles
      camP.copy(rk.pos).addScaledVector(nn, -22).addScaledVector(tf, 3); camP.y = rk.pos.y + 3; camL.copy(rk.pos).addScaledVector(tf, 12); camL.y = rk.pos.y;
    }
    if (!rig._mv) { rig._mv = new V().copy(camP); rig._ml = new V().copy(camL); }
    rig._mv.lerp(camP, k); rig._ml.lerp(camL, k); cam.position.copy(rig._mv); cam.up.set(0, 1, 0); cam.lookAt(rig._ml);
  };

  // ---------------------------------------------------------------- pilotage direct de la fusee
  const drive = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !rk.active || g.state !== 'FLIGHT' || g.evoFinish || g.flightTime < 0.35) return;
    const T = run.T, d = Math.max(0, run.dist); frame(T, d);
    const gy = T.base(d), lx = tmp.copy(rk.pos).sub(cc).dot(nn), SP = baseSpeed() + (W && W.boostT > 0 ? 10 : 0);
    let vlat = 0, vy = 0;
    if (CTRL === 'a') {
      const cam = g.camera, k = I.k;
      if (!I.mouse || k.ArrowLeft || k.ArrowRight || k.ArrowDown || k.KeyA || k.KeyD || k.KeyS) { I.cx += ((k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0)) * dt * 1.6; I.cy += ((k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0)) * dt * 1.2; I.cx = U.clamp(I.cx, -1, 1); I.cy = U.clamp(I.cy, 0.05, 0.95); if (k.ArrowUp || k.KeyW) I.mouse = false; }
      org.copy(cam.position); ray.set(I.cx, -(I.cy * 2 - 1), 0.5).unproject(cam).sub(org).normalize();
      const den = ray.dot(tf); let tx = lx, ty = rk.pos.y;
      if (Math.abs(den) > 0.05) { const t = tmp.copy(rk.pos).sub(org).dot(tf) / den; if (t > 0) { const P = tmp.copy(org).addScaledVector(ray, t); tx = P.clone().sub(cc).dot(nn); ty = P.y; } }
      tx = U.clamp(tx, -17, 17); ty = U.clamp(ty, gy + 2.2, gy + 26);
      vlat = U.clamp((tx - lx) * 3.4, -26, 26); vy = U.clamp((ty - rk.pos.y) * 3.4, -28, 28);
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

  // ---------------------------------------------------------------- mise a jour chaque image : objets, HUD, fin
  const fmt = (t) => t.toFixed(1);
  const step = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || !run.T) return;
    if (!W || W.run !== run) { buildW(g, run); ended = null; elEnd.style.display = 'none'; g._mvEnd = 0; }
    const T = run.T, flying = g.state === 'FLIGHT' && rk.active;
    elHud.style.display = started ? 'block' : 'none';
    hudLv.textContent = 'NIV ' + LV;
    // fragments de caisses
    for (let i = W.fr.length - 1; i >= 0; i--) { const f = W.fr[i]; f.life -= dt; f.v.y -= 28 * dt; f.m.position.addScaledVector(f.v, dt); f.m.rotation.x += dt * 6; f.m.rotation.z += dt * 4; if (f.life <= 0) { W.grp.remove(f.m); W.fr.splice(i, 1); } }
    if (CTRL === 'b') { const bg = ensureBg(g); frame(T, Math.max(0, run.dist)); const gyy = T.base(Math.max(0, run.dist)); bg.position.set(rk.pos.x + nn.x * 40, gyy - 30 + 260 - 40, rk.pos.z + nn.z * 40); bg.rotation.set(0, Math.atan2(-nn.x, -nn.z), 0); bg.visible = true; }
    if (!flying && !g.evoFinish) return;
    const t = Math.max(0, g.flightTime), fin = !!g.evoFinish;
    if (W.boostT > 0) W.boostT -= dt;
    if (flying && !fin) {
      for (const tg of W.tg) { if (tg.alive && rk.pos.distanceTo(tg.c) < 5.4) { tg.alive = false; tg.grp.visible = false; W.hits++; W.boostT = 1.2; pop(g, tg.c, '#fff2c0'); toast('BOOST !', '#ffe36a'); } }
      for (const c of W.cr) if (c.alive && rk.pos.distanceTo(c.c) < 3.4) smash(g, c);
      for (const r of W.rg) {
        const s = tmp2.copy(rk.pos).sub(r.c).dot(tf0(T, r.d));
        if (r.prev !== null && !r.done && r.prev < 0 && s >= 0) { r.done = true; const dd = Math.hypot(tmp2.copy(rk.pos).sub(r.c).dot(nn0(T, r.d)), rk.pos.y - r.c.y); r.ok = dd < 6.6; if (r.ok) { r.m.material.color.set('#3ddc5a'); W.hits++; W.boostT = 1.2; pop(g, r.c, '#d6ffd0'); toast('BOOST !', '#ffe36a'); } else r.m.material.color.set('#e8352b'); }
        r.prev = s;
      }
    }
    // rivaux
    let ahead = 0;
    if (RIV) {
      const tb = Math.max(0, t - 0.35);
      W.bots.forEach((b, i) => {
        b.d = Math.min(FIN + 40, b.sp * tb); const h = 7 + 4 * Math.sin(tb * 1.7 + i * 2.1); place(T, b.d, b.lx + 3 * Math.sin(tb * 1.1 + i), h, b.m.position);
        place(T, b.d + 8, b.lx, h, tmp2); b.m.lookAt(tmp2); b.m.visible = tb > 0;
        if (b.d > Math.max(0, run.dist)) ahead++;
      });
    }
    // HUD
    const prog = U.clamp(run.dist / FIN, 0, 1); hudFill.style.width = (prog * 100).toFixed(1) + '%'; hudTm.textContent = fmt(fin && ended ? ended.time : t);
    W.me.style.left = (prog * 100).toFixed(1) + '%'; if (RIV) W.bots.forEach((b, i) => { W.dots[i].style.left = (U.clamp(b.d / FIN, 0, 1) * 100).toFixed(1) + '%'; if (W.pl) W.pl.textContent = (1 + ahead) + '/3'; });
    W.pips.forEach((p, i) => p.classList.toggle('on', CTRL === 'a' ? i < W.hits : !!(W.rg[i] && W.rg[i].ok)));
    // fin du niveau
    if (fin && !g._mvEnd) {
      g._mvEnd = 1; const time = t; const nb = RIV ? W.bots.filter((b) => b.tFin < time).length : 0;
      const info = { time, hits: CTRL === 'a' ? W.hits : 0, rings: CTRL === 'b' ? W.rg.filter((r) => r.ok).length : 0, smashes: W.smashes, place: 1 + nb, t0: performance.now() };
      info.stars = finalStars(info); ended = info;
      setTimeout(() => showEnd(info), 750);
    }
  };
  const tf0 = (T, d) => { frame(T, d); return tf; };
  const nn0 = (T, d) => { frame(T, d); return nn; };

  const showEnd = (info) => {
    if (!ended || ended !== info) return;
    const best = parseFloat(lsGet('cc.mvp.best.' + M + '.' + LV, '0')) || 0, rec = !best || info.time < best; if (rec) lsSet('cc.mvp.best.' + M + '.' + LV, info.time.toFixed(2));
    q(elEnd, '.ti').textContent = 'NIVEAU ' + LV + ' TERMINE';
    q(elEnd, '.st').innerHTML = [0, 1, 2].map((i) => (i < info.stars ? '<i>★</i>' : '<u>★</u>')).join('');
    q(elEnd, '.tm').textContent = fmt(info.time) + ' s';
    let sub = rec ? 'NOUVEAU RECORD !' : 'MEILLEUR ' + fmt(best) + ' s';
    if (CTRL === 'a') sub += '  ·  CIBLES ' + info.hits + '/3' + (info.smashes ? '  ·  DAMAGE BONUS +' + info.smashes * 5 : '');
    if (CTRL === 'b') sub += '  ·  ANNEAUX ' + info.rings + '/' + RG.length;
    if (RIV) sub += '  ·  PLACE ' + info.place + '/3';
    q(elEnd, '.sub').textContent = sub; elEnd.style.display = 'flex'; try { CC.game.audio.play('victory'); } catch (e) { /* son facultatif */ }
  };

  // ---------------------------------------------------------------- relance
  const restart = (g) => {
    elEnd.style.display = 'none'; ended = null; g._mvEnd = 0;
    const rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; }
    E.endTumble(g); g.evoReport = false; g.evoLast = null; g.evoWin = null; if (g.rig) g.rig._mv = null; g.goHome({});
  };
  const again = () => { const g = CC.game; if (g) restart(g); };
  const next = () => { LV = Math.min(20, LV + 1); lsSet('cc.mvp.lv.' + M, LV); again(); };
  const home = () => { started = false; elStart.style.display = 'flex'; again(); };
  const start = () => { if (started) return; started = true; elStart.style.display = 'none'; };
  q(elStart, '#mv-go').addEventListener('click', start);
  q(elEnd, '#mv-next').addEventListener('click', next); q(elEnd, '#mv-again').addEventListener('click', again); q(elEnd, '#mv-home').addEventListener('click', home);

  // fin de niveau SANS minuterie : l'ecran de fin HTML prend la suite (une minuterie de 1,9 s pourrait tuer le vol suivant)
  E.finishRun = (g) => { g.evoFinish = { t0: performance.now(), hold: true }; try { g.audio.play('finish'); g.flash = 0.8; g.flashColor = '#fff2c0'; g.hitStop = 0.25; g.hitScale = 0.3; g.rig.shake = 0.6; g.audio.setZone('evoDawn', false); } catch (e) { /* effets facultatifs */ } };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    if (g.rocket && g.rocket.active && g.evo) { g.rocket.fuel = g.rocket.fuelMax = 999; }
    try { step(g, dt); } catch (e) { if (!E._mvErr) { E._mvErr = 1; console.warn('mvp', e); } }
    try { drive(g, dt); } catch (e) { /* pilotage facultatif */ }
  };
  // echec : on repart tout de suite ; victoire : l'ecran de fin (ci-dessus) gere la suite
  E.beginEnd = (g) => { E.endTumble(g); g.evoReport = false; g.evoLast = null; g.evoWin = null; g._mvEnd = 0; if (g.rig) g.rig._mv = null; g.goHome({}); };
  E.onClear = (g) => { /* l'ecran de fin HTML est deja affiche ; la fusee reste a l'arret derriere la carte */ const rk = g.rocket; if (rk) { rk.active = false; rk.mesh.visible = false; rk.light.intensity = 0; rk.rope.visible = false; } };

  // ---------------------------------------------------------------- lancement automatique une fois START presse
  let menuT = 0;
  elStart.style.display = 'flex';
  setInterval(() => {
    const g = CC.game; if (!g || !g.padMode || !g.ui) return;
    try { const S = E.save(g); if (S && !S.tutPC) { S.tutPC = 1; } } catch (e) { /* ignore */ }
    if (!started) { if (g.state === 'MENU' && g.ui.overlay === 'evo') g.ui.overlay = null; elHud.style.display = 'none'; return; }
    if (g.state === 'MENU' && (!g.ui.overlay || g.ui.overlay === 'evo') && !g.evoAim && !g.evoAnim && !g.evoChest && !ended) { if (++menuT >= 3) { menuT = 0; E.start(g); } } else menuT = 0;
    if (g.state === 'LAUNCH' && g.evoAim && !g.evoAim.lock && g.evoAim.t > 0.35) E.lock(g);
  }, 100);
})();
