/* COLD IMPACT RUSH — jeu infini « glisse pour éviter » (prototype de test mobile).
 * La fusée fonce sur une route à 3 voies × 3 hauteurs. UN glissé = UN déplacement.
 *  - engins (halo orange) : on les détruit en les percutant. Halo ROUGE = explosif : il fait sauter ses voisins (réaction en chaîne)
 *  - combo 10 : mode RAGE (5 s) — invincible, tout explose
 *  - barrières / murs / mines : mortels (sauf bouclier ou rage)
 *  - 6 biomes tous les 1000 m ; pièces, boutique de fusées, aimant, bouclier, missions du jour
 * Réutilise les modèles, les explosions (CC.Effects), les sons/musique (CC.Audio) et les horizons (CC.Horizon) du jeu principal. */
(function () {
  const V = THREE.Vector3;
  const LANES = [-5.6, 0, 5.6], LEVELS = [1.8, 6.6, 11.4], ROAD_W = 19;
  const $ = (id) => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } } };
  const canvas = $('c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(), SKY = new THREE.Color('#8fd0ff');
  scene.background = SKY; scene.fog = new THREE.Fog('#bfe4ff', 80, 300);
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 600);
  const hemi = new THREE.HemisphereLight('#ffffff', '#7a8a6a', 0.95); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4d8', 1.0); sun.position.set(-20, 40, 10); scene.add(sun);
  const resize = () => { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();

  // ---------- jeu principal : explosions, sons, horizon ----------
  let fx = null, audio = null, hz = null;
  const FXS = 0.45; try { const fxRoot = new THREE.Group(); fxRoot.scale.setScalar(FXS); scene.add(fxRoot); fx = new CC.Effects(fxRoot); } catch (e) { fx = null; }   // les effets du jeu principal sont réglés pour une petite fusée : on les réduit
  try { audio = new CC.Audio(); CC.game = CC.game || { audio }; } catch (e) { audio = null; }
  try { hz = new CC.Horizon({ scene }); } catch (e) { hz = null; }
  const snd = (n, p) => { try { if (audio && audio.ctx) audio.playRaw(n, p); } catch (e) { /* ignore */ } };
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } };

  // ---------- biomes ----------
  const THEMES = [
    { name: 'VILLE', sky: '#8fd0ff', fog: '#bfe4ff', ground: '#6aa84f', road: '#3c424c', decor: 'city', hz: 'city', zone: 'city', light: 0.95, dark: 0 },
    { name: 'FORET', sky: '#9fd8e8', fog: '#cdeadf', ground: '#3f8f4a', road: '#54483c', decor: 'forest', hz: 'forest', zone: 'forest', light: 0.95, dark: 0 },
    { name: 'DESERT', sky: '#f3c98c', fog: '#f4d9b4', ground: '#d9a066', road: '#5a4a42', decor: 'rock', hz: 'sky', zone: 'canyon', light: 1.0, dark: 0 },
    { name: 'PORT', sky: '#7fb8ee', fog: '#b4d6f2', ground: '#2f78b8', road: '#5b6068', decor: 'port', hz: 'port', zone: 'port', light: 0.95, dark: 0 },
    { name: 'NEIGE', sky: '#cfe6f5', fog: '#e4f0f8', ground: '#f0f5fa', road: '#5d6670', decor: 'snow', hz: 'sky', zone: 'banquise', light: 1.05, dark: 0 },
    { name: 'NUIT NEON', sky: '#1b1245', fog: '#2b1c5e', ground: '#17222e', road: '#232733', decor: 'neon', hz: 'city', zone: 'city', light: 0.5, dark: 0.6 }];
  const tcol = THEMES.map((t) => ({ sky: new THREE.Color(t.sky), fog: new THREE.Color(t.fog), ground: new THREE.Color(t.ground), road: new THREE.Color(t.road) }));
  let themeI = 0, shownTheme = -1; const cur = { sky: tcol[0].sky.clone(), fog: tcol[0].fog.clone(), ground: tcol[0].ground.clone(), road: tcol[0].road.clone() };

  // ---------- route qui défile ----------
  const roadMat = new THREE.MeshLambertMaterial({ color: '#3c424c' }), lineMat = new THREE.MeshBasicMaterial({ color: '#f2f2e8' }), grassMat = new THREE.MeshLambertMaterial({ color: '#6aa84f' }), curbMat = new THREE.MeshLambertMaterial({ color: '#c8c8c0' });
  const SEG = 30, NSEG = 14, segs = [];
  for (let i = 0; i < NSEG; i++) {
    const g = new THREE.Group();
    const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.4, SEG + 0.2), roadMat); road.position.y = -0.2; g.add(road);
    for (const s of [-1, 1]) { const grass = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, SEG + 0.2), grassMat); grass.position.set(s * (ROAD_W / 2 + 40), -0.25, 0); g.add(grass); const curb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, SEG + 0.2), curbMat); curb.position.set(s * (ROAD_W / 2 + 0.2), -0.1, 0); g.add(curb); }
    for (const x of [LANES[2] / 2, LANES[0] / 2]) for (const zz of [-SEG / 4, SEG / 4]) { const dash = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 5.5), lineMat); dash.position.set(x, 0.02, zz); g.add(dash); }
    g.position.z = -i * SEG + 40; scene.add(g); segs.push(g);
  }
  // ---------- décors latéraux par biome ----------
  const BCOL = ['#e8d8c0', '#d0b890', '#c0c8d8', '#b8a8a0', '#e8c8c0', '#a8c0b0', '#d8d0a8'], NCOL = ['#2a2840', '#3a2a50', '#202a40', '#32244a'], CCOL = ['#d8452e', '#2e7bd8', '#e8b02a', '#3aa05a', '#8a5ac8'], NEON = ['#ff3ad8', '#2be8ff', '#ffb02b', '#8a6aff', '#ff5a5a'];
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c }), bas = (c) => new THREE.MeshBasicMaterial({ color: c });
  const blds = [];
  function decorMesh(kind) {
    const g = new THREE.Group();
    if (kind === 'city' || kind === 'neon') {
      const night = kind === 'neon', w = R(8, 18), h = R(10, 40), d = R(10, 18);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(night ? pick(NCOL) : pick(BCOL))); body.position.y = h / 2; g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.6, d + 0.6), lam('#7a7e86')); roof.position.y = h + 0.3; g.add(roof);
      for (let k = 0; k < Math.floor(h / 4); k++) for (const sz of [-1, 1]) { const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 1.1, 0.1), bas(night ? pick(NEON) : '#7fb4d8')); win.position.set(0, 3 + k * 4, sz * (d / 2 + 0.06)); g.add(win); }
      if (night) { const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 2.2, 0.3), bas(pick(NEON))); sign.position.set(0, h * 0.8, d / 2 + 0.2); g.add(sign); }
      g.userData.w = w;
    } else if (kind === 'forest' || kind === 'snow') {
      const snow = kind === 'snow', n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) { const hh = R(8, 17), t = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3, 6), lam('#6b4a2e')); tr.position.y = 1.5; t.add(tr); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(3.8 - k * 0.9, hh / 2.2, 7), lam(snow ? (k % 2 ? '#e8f2f8' : '#d4e6f0') : (k % 2 ? '#2f7a3c' : '#3a8f48'))); c.position.y = 4 + k * (hh / 4.2); t.add(c); } t.position.set(R(-6, 6), 0, R(-6, 6)); g.add(t); }
      g.userData.w = 12;
    } else if (kind === 'rock') {
      const w = R(8, 20), h = R(8, 30), r = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.7, h, 7), lam(pick(['#c98d58', '#b87a4a', '#d6a066']))); r.position.y = h / 2; g.add(r);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.46, 1.6, 7), lam('#a86c3e')); cap.position.y = h - 0.4; g.add(cap); g.userData.w = w;
    } else {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 1 + Math.floor(Math.random() * 3); k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 12), lam(pick(CCOL))); c.position.set(i * 5.2, 1.3 + k * 2.6, 0); g.add(c); }
      if (Math.random() < 0.4) { const cr = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 1), lam('#e8b02a')); cr.position.set(0, 10, 8); g.add(cr); const arm = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 1), lam('#e8b02a')); arm.position.set(-4, 20, 8); g.add(arm); }
      g.userData.w = 14;
    }
    return g;
  }
  function placeDecor(o, z, side) { const g = decorMesh(THEMES[themeI].decor); g.position.set(side * (ROAD_W / 2 + 7 + (g.userData.w || 10) / 2 + R(0, 7)), 0, z); if (o) scene.remove(o.g); scene.add(g); return { g, side }; }
  for (let z = -320; z < 40; z += 18) for (const s of [-1, 1]) if (Math.random() < 0.85) blds.push(placeDecor(null, z + Math.random() * 6, s));

  // ---------- fusée (skins du jeu principal) ----------
  const rocketG = new THREE.Group(); scene.add(rocketG);
  let rocketM = null, jet = null;
  const SKINS = (window.CC && CC.Skins && CC.Skins.list ? CC.Skins.list : []).slice(0, 10);
  const save = { bank: LS.get('rush.bank', 0), skin: LS.get('rush.skin', 'stock'), owned: LS.get('rush.owned', ['stock']), up: LS.get('rush.up', { shield: 0, magnet: 0 }), best: LS.get('rush.best', 0), runs: LS.get('rush.runs', 0) };
  const persist = () => { LS.set('rush.bank', save.bank); LS.set('rush.skin', save.skin); LS.set('rush.owned', save.owned); LS.set('rush.up', save.up); LS.set('rush.best', save.best); LS.set('rush.runs', save.runs); };
  function setSkin(id) {
    if (rocketM) rocketG.remove(rocketM);
    let sk = null; try { sk = CC.Skins.get(id); } catch (e) { sk = null; }
    rocketM = CC.Models.rocket(sk || undefined); rocketM.rotation.y = Math.PI; rocketM.scale.setScalar(2.4); rocketG.add(rocketM);
    jet = rocketM.userData.jet || null; if (jet) jet.group.visible = true;
  }
  setSkin(save.skin);
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }), shadowGeo = new THREE.CircleGeometry(1.5, 14);
  const rShadow = new THREE.Mesh(shadowGeo, shadowMat); rShadow.rotation.x = -Math.PI / 2; rShadow.position.y = 0.07; scene.add(rShadow);
  const coinGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.25, 14), coinMat = bas('#ffcf2a'), coinRim = bas('#fff0a0'), rimGeo = new THREE.TorusGeometry(1.0, 0.14, 6, 14);
  const puffGeo = new THREE.SphereGeometry(0.5, 6, 5), puffMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.7, depthWrite: false });

  // ---------- modèles d'ennemis (ajustés à une taille cohérente) ----------
  const POOLS = [
    { g: ['jeep', 'apc', 'technical', 'recon'], x: 'tanker' }, { g: ['buggy', 'jeep', 'recon', 'apc'], x: 'tanker' },
    { g: ['tank', 'dozer', 'technical', 'buggy'], x: 'rocketTruck' }, { g: ['rib', 'boat', 'jeep', 'dozer'], x: 'tanker' },
    { g: ['apc', 'tank', 'jeep', 'recon'], x: 'rocketTruck' }, { g: ['recon', 'tank', 'technical', 'apc'], x: 'tanker' }];
  const LENS = { tank: 6.2, dozer: 6.5, tanker: 8, rocketTruck: 7.5, boat: 7, rib: 6 };
  function build(name, tint) { try { const f = (CC.BossModels && CC.BossModels[name]) || (CC.Models && CC.Models[name]); if (f) return f(tint); } catch (e) { /* fallback */ } return CC.Models.tank(tint); }
  function fit(m, len, air) { m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m), s = new V(); b.getSize(s); const k = len / Math.max(s.x, s.z, 0.01); m.scale.multiplyScalar(k); m.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(m), c = new V(); b2.getCenter(c); m.position.x -= c.x; m.position.z -= c.z; m.position.y -= air ? c.y : b2.min.y; }
  function ringMesh(r, color) { return new THREE.Mesh(new THREE.RingGeometry(r * 0.9, r * 1.1, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); }
  function makeTarget(explosive) {
    const P = POOLS[themeI], name = explosive ? P.x : pick(P.g), m = build(name, Math.floor(Math.random() * 4)), len = LENS[name] || 5.6;
    m.rotation.y = Math.PI; const w = new THREE.Group(); w.add(m); fit(w, len, false);
    const g = new THREE.Group(); g.add(w); const ring = ringMesh(len * 0.62, explosive ? '#ff3a2a' : '#ff9a1a'); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring); g.userData.ring = ring; g.userData.explosive = !!explosive; return g;
  }
  function makeAir() {
    const m = build('gunship', Math.floor(Math.random() * 4)); m.rotation.y = -Math.PI / 2; const w = new THREE.Group(); w.add(m); fit(w, 7.2, true);
    const g = new THREE.Group(); g.add(w); const ring = ringMesh(3.6, '#ff9a1a'); g.add(ring); g.userData.ringV = ring; g.userData.air = true; return g;
  }
  const stripeR = lam('#d8332a'), stripeW = lam('#f4f4ee'), concrete = lam('#9a9ea6');
  function makeBarrier() {
    const g = new THREE.Group(), base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 1.2), concrete); base.position.y = 0.5; g.add(base);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.26), i % 2 ? stripeW : stripeR); b.position.set(-1.5 + i * 0.6, 1.25, 0); g.add(b); }
    for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.9), concrete); leg.position.set(sx * 1.4, 0.8, 0); g.add(leg); }
    g.scale.setScalar(1.6); return g;
  }
  function makeWall() {
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(6.4, 10, 1.6), concrete); body.position.y = 5; g.add(body);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.1, 1.7), i % 2 ? stripeW : stripeR); b.position.y = 1 + i * 2.1; g.add(b); }
    return g;
  }
  function makeMine() { const m = CC.BossModels.mine(); m.scale.setScalar(0.62); const g = new THREE.Group(); g.add(m); g.userData.spin = m; return g; }
  function makeCoin() { const g = new THREE.Group(), c = new THREE.Mesh(coinGeo, coinMat); c.rotation.x = Math.PI / 2; g.add(c); g.add(new THREE.Mesh(rimGeo, coinRim)); g.userData.coin = true; return g; }

  // ---------- HUD ----------
  const hudCoins = document.createElement('div'); hudCoins.className = 'hud'; hudCoins.style.cssText = 'top:calc(env(safe-area-inset-top) + 14px);right:14px;left:auto;text-align:right;font-size:4.6vmin;font-weight:900;color:#ffd23a;width:auto'; document.body.appendChild(hudCoins);
  const banner = document.createElement('div'); banner.className = 'hud'; banner.style.cssText = 'top:30%;font-size:9vmin;font-weight:900;opacity:0;transition:opacity .4s;color:#fff'; document.body.appendChild(banner);
  const rageBar = document.createElement('div'); rageBar.className = 'hud'; rageBar.style.cssText = 'bottom:calc(env(safe-area-inset-bottom) + 18px);font-size:5vmin;font-weight:900;color:#ff6a2a'; document.body.appendChild(rageBar);
  const showBanner = (t) => { banner.textContent = t; banner.style.opacity = 1; clearTimeout(showBanner.t); showBanner.t = setTimeout(() => { banner.style.opacity = 0; }, 1600); };

  // ---------- état ----------
  let state = 'ready', lane = 1, level = 0, x = 0, y = LEVELS[0], vx = 0, vy = 0, dist = 0, speed = 28, kills = 0, combo = 0, coins = 0, bonus = 0, score = 0, shake = 0, hitStop = 0, t0 = performance.now(), deadAt = 0, nextRow = 70, path = [1, 0], flash = 0, rage = 0, shield = false, spin = 0, runKills = 0;
  const ents = [], parts = [], pending = [];
  $('best').textContent = save.best ? 'RECORD ' + save.best : '';

  function burst(p, n, color, power) { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22 + Math.random() * 0.35, 5, 4), new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? color : '#ffe9a8', transparent: true })); m.position.copy(p); m.userData = { v: new V((Math.random() - 0.5) * power, 2 + Math.random() * power * 0.7, (Math.random() - 0.5) * power - 3), life: 0.7 + Math.random() * 0.5 }; scene.add(m); parts.push(m); } }
  function boom(p, big) { if (fx) { try { fx.explosion(p.clone().multiplyScalar(1 / FXS), new V(0, 1, 0), big, undefined); } catch (e) { burst(p, 22, '#ff7a2a', 12); } } else burst(p, 22, '#ff7a2a', 12); snd(big ? 'boom' : 'boomSmall'); }

  // ---------- rangées : un chemin garanti (voie, hauteur) qui bouge d'un cran par rangée ----------
  function addEnt(g, kind, cells, z, y0) { g.position.set(LANES[cells[0][0]], y0 || 0, z); scene.add(g); const e = { g, kind, cells, z, explosive: !!g.userData.explosive }; ents.push(e); return e; }
  function spawnRow(z) {
    const early = dist < 140, lvl = Math.min(1, dist / 3500);
    const st = Math.random(); let [pl, ph] = path;
    if (st < 0.35) pl = clamp(pl + (Math.random() < 0.5 ? -1 : 1), 0, 2); else if (st < 0.65) ph = clamp(ph + (Math.random() < 0.5 ? -1 : 1), 0, 2);
    path = [pl, ph];
    const used = {}, key = (l, h) => l + ',' + h; used[key(pl, ph)] = 1;
    for (let k = 0; k < 4; k++) addEnt(makeCoin(), 'coin', [[pl, ph]], z + k * 3.4 - 3, LEVELS[ph]);
    if (!early) {
      const n = Math.min(5, 1 + Math.floor(lvl * 4) + (Math.random() < 0.6 ? 1 : 0));
      for (let i = 0; i < n; i++) {
        const l = Math.floor(Math.random() * 3), h = Math.random() < 0.55 ? 0 : 1 + Math.floor(Math.random() * 2), r = Math.random();
        if (used[key(l, h)]) continue;
        if (h === 0 && r < 0.3 && !used[key(l, 1)] && !(pl === l && ph <= 1)) { used[key(l, 0)] = used[key(l, 1)] = 1; addEnt(makeWall(), 'hazard', [[l, 0], [l, 1]], z, 0); }
        else if (h === 0 && r < 0.65) { used[key(l, 0)] = 1; addEnt(makeBarrier(), 'hazard', [[l, 0]], z, 0); }
        else { used[key(l, h)] = 1; addEnt(makeMine(), 'hazard', [[l, h]], z, LEVELS[h] - 1.2); }
      }
    }
    const nt = early ? 2 : Math.random() < 0.7 ? 1 : 2;
    for (let i = 0; i < nt; i++) {
      let l = Math.floor(Math.random() * 3), h = Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 2);
      if (i === 0 && Math.random() < 0.45) { l = pl; h = ph; for (let c = ents.length - 1; c >= 0 && ents[c].z > z - 5; c--) if (ents[c].kind === 'coin' && ents[c].cells[0][0] === l && ents[c].cells[0][1] === h) { scene.remove(ents[c].g); ents.splice(c, 1); } }
      else if (used[key(l, h)]) continue;
      used[key(l, h)] = 1;
      if (h === 0) addEnt(makeTarget(Math.random() < 0.2), 'target', [[l, 0]], z, 0); else addEnt(makeAir(), 'target', [[l, h]], z, LEVELS[h] - 1.2);
    }
  }

  // ---------- destruction : explosion, combo, pièces, réaction en chaîne ----------
  function destroy(e, chain) {
    if (e.dead) return; e.dead = true;
    const p = e.g.position.clone(); p.y = Math.max(p.y, 1.5);
    boom(p, e.explosive || e.g.userData.air); hitStop = Math.max(hitStop, 0.06); shake = Math.max(shake, e.explosive ? 0.7 : 0.35); buzz(e.explosive ? 40 : 18);
    if (e.kind === 'target') {
      kills++; runKills++; coins += e.explosive ? 5 : 2; snd('cell', Math.min(7, combo)); burst(p, 8, '#ffcf2a', 14);
      if (e.g.userData.air) spin = 0.4;
    }
    combo++; bonus += 10 * Math.min(combo, 10);
    popCombo(rage ? 'RAGE x' + combo : combo > 1 ? 'COMBO x' + combo : '+10');
    if (combo >= 10 && !rage && !chain) startRage();
    scene.remove(e.g); const i = ents.indexOf(e); if (i >= 0) ents.splice(i, 1);
    if (e.explosive) {   // chaîne : tout ce qui est dans les cases voisines saute, l'une après l'autre
      let n = 0;
      for (const o of ents.slice()) {
        if (o.dead || o.kind === 'coin' || Math.abs(o.z - e.z) > 24) continue;
        if (o.cells.some((c) => Math.abs(c[0] - e.cells[0][0]) <= 1 && Math.abs(c[1] - e.cells[0][1]) <= 1)) { n++; pending.push({ t: 0.09 * n, fn: () => destroy(o, true) }); }
      }
    }
  }
  function startRage() { rage = 5; snd('mult'); showBanner('RAGE !'); buzz(120); flash = 0.6; }
  function popCombo(txt) { const c = $('combo'); c.textContent = txt; c.classList.add('on'); clearTimeout(popCombo.t); popCombo.t = setTimeout(() => c.classList.remove('on'), 650); }

  // ---------- entrées : UN seul déplacement par glissé (on relève le doigt pour en refaire un) ----------
  function go(dl, dh) { if (state !== 'run') return; const nl = clamp(lane + dl, 0, 2), nh = clamp(level + (dh || 0), 0, 2); if (nl !== lane || nh !== level) { lane = nl; level = nh; snd('tick'); } }
  window.addEventListener('keydown', (e) => { if (e.repeat) return; const k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'q') go(-1, 0); else if (k === 'ArrowRight' || k === 'd') go(1, 0); else if (k === 'ArrowUp' || k === 'w' || k === 'z') go(0, 1); else if (k === 'ArrowDown' || k === 's') go(0, -1); else if (k === ' ' || k === 'Enter') press(); });
  let sx = 0, sy = 0, down = false, used = false;
  function audioOn() { if (!audio) return; try { audio.init(); audio.resume(); if (audio.music && !audioOn.m) { audioOn.m = true; audio.setZone(THEMES[themeI].zone, THEMES[themeI].dark > 0); audio.music.start(); } } catch (e) { /* ignore */ } }
  function press() { audioOn(); if (state === 'ready') start(); else if (state === 'dead' && performance.now() - deadAt > 500) start(); }
  canvas.addEventListener('pointerdown', (e) => { down = true; used = false; sx = e.clientX; sy = e.clientY; press(); });
  canvas.addEventListener('pointermove', (e) => { if (!down || used) return; const dx = e.clientX - sx, dy = e.clientY - sy, ax = Math.abs(dx), ay = Math.abs(dy); if (Math.max(ax, ay) < 26) return; used = true; if (ax >= ay) go(dx > 0 ? 1 : -1, 0); else go(0, dy < 0 ? 1 : -1); });
  window.addEventListener('pointerup', () => { down = false; });
  window.addEventListener('pointercancel', () => { down = false; });
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  function start() {
    for (const e of ents) scene.remove(e.g); ents.length = 0; for (const p of parts) scene.remove(p); parts.length = 0; pending.length = 0;
    state = 'run'; lane = 1; level = 0; x = 0; y = LEVELS[0]; vx = vy = 0; dist = 0; speed = 28; kills = 0; runKills = 0; combo = 0; coins = 0; bonus = 0; score = 0; nextRow = 70; path = [1, 0]; rage = 0; spin = 0;
    shield = save.up.shield > 0; shake = 0; rocketG.visible = true; shownTheme = -1;
    $('over').classList.remove('on'); $('msg').style.display = 'none'; $('score').textContent = '0'; snd('ignite');
  }
  function die() {
    state = 'dead'; deadAt = performance.now(); shake = 1; flash = 1; rocketG.visible = false; boom(rocketG.position.clone(), true); burst(rocketG.position.clone(), 30, '#ff7a2a', 14); buzz(200); rage = 0;
    const rec = score > save.best; if (rec) { save.best = score; snd('record'); } save.runs++; save.bank += coins;
    const dm = missionsAdd({ kills: runKills, coins, dist: Math.round(dist) });
    persist(); renderOver(rec, dm); setTimeout(() => { if (state === 'dead') $('over').classList.add('on'); }, 450);
  }

  // ---------- missions du jour + boutique (écran de fin) ----------
  const MISSIONS = [{ id: 'kills', txt: 'Detruire 25 engins', goal: 25, add: true }, { id: 'coins', txt: 'Ramasser 80 pieces', goal: 80, add: true }, { id: 'dist', txt: 'Atteindre 2500 m', goal: 2500, add: false }];
  const today = () => new Date().toISOString().slice(0, 10);
  let mis = LS.get('rush.m', null); if (!mis || mis.day !== today()) mis = { day: today(), prog: { kills: 0, coins: 0, dist: 0 }, done: {} };
  function missionsAdd(r) { const got = []; for (const m of MISSIONS) { mis.prog[m.id] = m.add ? mis.prog[m.id] + r[m.id] : Math.max(mis.prog[m.id], r[m.id]); if (!mis.done[m.id] && mis.prog[m.id] >= m.goal) { mis.done[m.id] = 1; save.bank += 100; got.push(m.txt); snd('mission'); } } LS.set('rush.m', mis); return got; }
  const shop = document.createElement('div'); shop.style.cssText = 'margin-top:2.4vmin;font-size:3.6vmin;line-height:1.5;display:flex;flex-direction:column;align-items:center;gap:1vmin'; $('over').insertBefore(shop, $('btn'));
  const sbtn = (label, fn) => { const b = document.createElement('div'); b.textContent = label; b.style.cssText = 'padding:1.2vmin 4vmin;background:#2b3a52;border-radius:2vmin;font-weight:800;font-size:3.6vmin;color:#fff'; b.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); fn(); renderShop(); }); return b; };
  let selSkin = Math.max(0, SKINS.findIndex((s) => s.id === save.skin));
  function renderShop() {
    shop.innerHTML = ''; const bank = document.createElement('div'); bank.textContent = save.bank + ' $'; bank.style.cssText = 'color:#ffd23a;font-weight:900;font-size:5vmin'; shop.appendChild(bank);
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:2vmin;flex-wrap:wrap;justify-content:center'; shop.appendChild(row);
    row.appendChild(sbtn(save.up.shield ? 'BOUCLIER : OK' : 'BOUCLIER 120 $', () => { if (!save.up.shield && save.bank >= 120) { save.bank -= 120; save.up.shield = 1; snd('shield'); persist(); } }));
    row.appendChild(sbtn(save.up.magnet ? 'AIMANT : OK' : 'AIMANT 150 $', () => { if (!save.up.magnet && save.bank >= 150) { save.bank -= 150; save.up.magnet = 1; snd('shield'); persist(); } }));
    if (SKINS.length) {
      const s = SKINS[selSkin], owned = save.owned.indexOf(s.id) >= 0, price = s.tier === 'base' ? 0 : 150 + selSkin * 25;
      const r2 = document.createElement('div'); r2.style.cssText = 'display:flex;gap:2vmin;align-items:center'; shop.appendChild(r2);
      r2.appendChild(sbtn('<', () => { selSkin = (selSkin + SKINS.length - 1) % SKINS.length; previewSkin(); }));
      const nm = document.createElement('div'); nm.textContent = 'FUSEE ' + (s.short || s.name) + (save.skin === s.id ? ' (equipee)' : owned ? '' : ' - ' + price + ' $'); nm.style.cssText = 'min-width:36vmin;font-weight:800'; r2.appendChild(nm);
      r2.appendChild(sbtn('>', () => { selSkin = (selSkin + 1) % SKINS.length; previewSkin(); }));
      if (save.skin !== s.id) shop.appendChild(sbtn(owned ? 'EQUIPER' : 'ACHETER ' + price + ' $', () => { if (!owned) { if (save.bank < price) return; save.bank -= price; save.owned.push(s.id); snd('uiBuy'); } save.skin = s.id; setSkin(s.id); persist(); }));
    }
    const mm = document.createElement('div'); mm.style.cssText = 'font-size:3.2vmin;opacity:.9;margin-top:1vmin'; mm.innerHTML = MISSIONS.map((m) => (mis.done[m.id] ? 'OK ' : '') + m.txt + ' ' + Math.min(m.goal, mis.prog[m.id]) + '/' + m.goal).join('<br>'); shop.appendChild(mm);
  }
  function previewSkin() { try { setSkin(SKINS[selSkin].id); } catch (e) { /* ignore */ } }
  function renderOver(rec, got) {
    $('oscore').textContent = score; $('orow').textContent = runKills + ' engins - ' + coins + ' pieces - ' + Math.round(dist) + ' m';
    $('obest').textContent = (rec ? 'NOUVEAU RECORD ' : 'RECORD ') + save.best + (got.length ? ' - MISSION +100 $' : ''); selSkin = Math.max(0, SKINS.findIndex((s) => s.id === save.skin)); renderShop();
  }
  const replay = (e) => { e.stopPropagation(); setSkin(save.skin); press(); };
  $('btn').addEventListener('pointerdown', replay);

  // ---------- boucle ----------
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (hitStop > 0) { hitStop -= dt; dt *= 0.2; }
    const t = (now - t0) / 1000;
    if (state === 'run') {
      speed = (28 + Math.min(32, dist * 0.01)) * (rage > 0 ? 1.2 : 1); dist += speed * dt;
      while (dist + 170 > nextRow) { spawnRow(-170 + (nextRow - dist)); nextRow += Math.max(32, speed * 1.05); }
      score = Math.floor(dist / 4) + bonus + coins * 2; $('score').textContent = score; hudCoins.textContent = coins + ' $';
      themeI = Math.floor(dist / 1000) % THEMES.length;
      if (rage > 0) { rage -= dt; rageBar.textContent = 'RAGE ' + Math.ceil(rage) + ' s'; if (rage <= 0) { rage = 0; combo = 0; rageBar.textContent = ''; $('combo').classList.remove('on'); } } else rageBar.textContent = combo >= 3 ? 'COMBO ' + combo + ' / 10' : '';
    }
    if (shownTheme !== themeI) { shownTheme = themeI; const th0 = THEMES[themeI]; if (hz) try { hz.setZone(th0.hz, th0.dark > 0, 5 + themeI); } catch (e) { /* ignore */ } if (audio && audio.ctx) try { audio.setZone(th0.zone, th0.dark > 0); } catch (e) { /* ignore */ } if (state === 'run' && dist > 50) showBanner(th0.name); }
    const th = THEMES[themeI], T = tcol[themeI], k = Math.min(1, dt * 0.8);
    cur.sky.lerp(T.sky, k); cur.fog.lerp(T.fog, k); cur.ground.lerp(T.ground, k); cur.road.lerp(T.road, k);
    grassMat.color.copy(cur.ground); roadMat.color.copy(cur.road); scene.fog.color.copy(cur.fog); SKY.copy(cur.sky); hemi.intensity += (th.light - hemi.intensity) * k; sun.intensity = th.dark ? 0.35 : 1.0;
    if (hz) { try { hz.setEnv({ fog: { color: cur.fog }, dark: th.dark }); hz.ring.visible = true; hz.glow.visible = th.dark > 0; hz.ring.position.set(camera.position.x, 79, camera.position.z); hz.glow.position.copy(hz.ring.position); } catch (e) { /* ignore */ } }
    const sp = state === 'run' ? speed : state === 'ready' ? 22 : 0;
    for (const g of segs) { g.position.z += sp * dt; if (g.position.z > 60) g.position.z -= NSEG * SEG; }
    for (let i = 0; i < blds.length; i++) { const b = blds[i]; b.g.position.z += sp * dt; if (b.g.position.z > 40) blds[i] = placeDecor(b, b.g.position.z - 350, b.side); }
    for (let i = pending.length - 1; i >= 0; i--) { pending[i].t -= dt; if (pending[i].t <= 0) { const f = pending[i].fn; pending.splice(i, 1); f(); } }
    const magnet = save.up.magnet > 0;
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i]; if (!e || e.dead) continue; const u = e.g.userData; e.z += sp * dt; e.g.position.z = e.z;
      if (u.ring || u.ringV) (u.ring || u.ringV).visible = e.z < -9;
      if (u.ring) { u.ring.rotation.z += dt * 2; u.ring.material.opacity = 0.55 + 0.35 * Math.sin(t * 6); }
      if (u.ringV) { u.ringV.material.opacity = 0.55 + 0.35 * Math.sin(t * 6); u.ringV.rotation.z += dt * 2; e.g.position.y = LEVELS[e.cells[0][1]] - 1.2 + Math.sin(t * 3 + e.z) * 0.3; }
      if (u.spin) u.spin.rotation.y += dt * 1.5;
      if (u.coin) e.g.rotation.y += dt * 4;
      if (state === 'run') {
        const isCoin = e.kind === 'coin', inZ = isCoin ? Math.abs(e.z) < (magnet ? 5 : 2.4) : Math.abs(e.z) < 3.2;
        const hit = inZ && e.cells.some((c) => (isCoin && magnet) ? (Math.abs(c[0] - lane) <= 1 && Math.abs(c[1] - level) <= 1) : (c[0] === lane && c[1] === level));
        if (hit) {
          if (isCoin) { coins++; snd('cell', coins % 8); scene.remove(e.g); ents.splice(i, 1); continue; }
          if (e.kind === 'target' || rage > 0) { destroy(e, false); continue; }
          if (shield) { shield = false; save.up.shield = 0; persist(); snd('shield'); combo = 0; e.explosive = true; destroy(e, true); flash = 0.5; continue; }
          if (window.CCRush && window.CCRush.god) continue;
          die();
        }
      }
      if (e.z > 8) { if (e.kind === 'target' && state === 'run' && combo > 0 && !rage) { combo = 0; $('combo').classList.remove('on'); } scene.remove(e.g); const j = ents.indexOf(e); if (j >= 0) ents.splice(j, 1); }
    }
    // fusée : ressorts (léger dépassement), pique vers le bas, cabre en montant, roulis dans les virages
    if (state !== 'dead') for (let s2 = 0; s2 < 2; s2++) { const h = dt / 2; vx += ((LANES[lane] - x) * 210 - vx * 21) * h; x += vx * h; vy += ((LEVELS[level] - y) * 175 - vy * 15) * h; y += vy * h; }
    spin = Math.max(0, spin - dt); const roll = clamp(-vx * 0.035, -0.6, 0.6) + (spin > 0 ? (1 - spin / 0.4) * Math.PI * 2 : 0);
    rocketG.position.set(x, y + Math.sin(t * 9) * 0.04, 0); rocketG.rotation.set(clamp(vy * 0.045, -0.7, 0.55), clamp(-vx * 0.012, -0.3, 0.3), 0); if (rocketM) rocketM.rotation.z = roll;
    rShadow.position.x = x; rShadow.scale.setScalar(Math.max(0.4, 1 - y * 0.04)); rShadow.visible = rocketG.visible;
    if (jet) { const f = (0.85 + 0.3 * Math.sin(t * 40)) * (rage > 0 ? 1.5 : 1); jet.group.scale.set(f, f, (1.2 + 0.4 * Math.sin(t * 31)) * (rage > 0 ? 1.6 : 1)); }
    if (state === 'run' && Math.random() < 0.9) { puffMat.color.set(rage > 0 ? '#ff7a2a' : '#ffd9a0'); const m = new THREE.Mesh(puffGeo, puffMat); m.position.set(x, y, 2.8); m.scale.setScalar(rage > 0 ? 0.3 : 0.18); m.userData = { v: new V(0, 0.3, 5), life: 0.25, puff: true }; scene.add(m); parts.push(m); }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i], u = p.userData; u.life -= dt; p.position.addScaledVector(u.v, dt); if (!u.puff) u.v.y -= 14 * dt; if (u.puff) p.scale.multiplyScalar(1 + dt * 2); else if (p.material.opacity !== undefined) p.material.opacity = Math.max(0, u.life * 1.4); if (u.life <= 0) { scene.remove(p); parts.splice(i, 1); } }
    if (fx) { try { fx.update(dt, camera); } catch (e) { /* ignore */ } }
    // caméra : suit aussi la hauteur ; s'ouvre en rage
    shake = Math.max(0, shake - dt * 1.6);
    const cx = x * 0.55 + (Math.random() - 0.5) * shake * 1.3, cy = 5.6 + y * 0.6 + (Math.random() - 0.5) * shake * 1.0;
    camera.position.set(cx, cy, 10.5); camera.lookAt(x * 0.75, 1.5 + y * 0.55, -16);
    const fov = (state === 'run' ? 66 + (speed - 28) * 0.18 + (rage > 0 ? 10 : 0) : 62) + (camera.aspect < 1 ? 8 : 0);
    camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
    if (flash > 0) { flash -= dt * 2; scene.background.copy(SKY).lerp(new THREE.Color('#ffffff'), Math.max(0, flash) * 0.6); } else scene.background.copy(SKY);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  window.CCRush = { state: () => state, score: () => score, dist: () => dist, go, press, ents: () => ents.length, coins: () => coins, theme: () => themeI, combo: () => combo, rage: () => rage, setDist: (d) => { dist = d; } };
})();
