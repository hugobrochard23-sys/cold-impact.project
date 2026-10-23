/* v171 : NOUVEAU LANCEUR du mode evolution : pas de tir militaire (dalle de beton a bandes de danger, rail de lancement, bras de maintien, tour ombilicale,
 * reservoir, projecteurs) avec un decor lointain (silhouette de ville, grues, soleil bas). Le lancement se fait en ALLUMANT le propulseur a la main :
 * on maintient le doigt, la turbine monte (son + flamme + vibration + vapeur), on relache pour liberer les bras de maintien.
 * Remplace le piston a ressort. Les paliers du « propulseur » ajoutent des boosters lateraux au sol. */
(function () {
  const EVO = CC.EVO, U = CC.U; if (!EVO || !EVO.on) return;
  const T3 = THREE, V = T3.Vector3;
  const lam = (c, e) => new T3.MeshLambertMaterial(e ? { color: c, emissive: e } : { color: c });
  const bas = (c, o) => new T3.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  const box = (g, w, h, d, m, x, y, z) => { const o = new T3.Mesh(new T3.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cyl = (g, rt, rb, h, m, x, y, z, seg, rx) => { const o = new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 14), m); o.position.set(x, y, z); if (rx) o.rotation.x = Math.PI / 2; g.add(o); return o; };
  let hazTex = null;
  const haz = () => { if (hazTex) return hazTex; const c = document.createElement('canvas'); c.width = 64; c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#FFE600'; x.fillRect(0, 0, 64, 32); x.fillStyle = '#16181c'; for (let k = -2; k < 5; k++) { x.beginPath(); x.moveTo(k * 16, 32); x.lineTo(k * 16 + 8, 32); x.lineTo(k * 16 + 24, 0); x.lineTo(k * 16 + 16, 0); x.closePath(); x.fill(); } hazTex = new T3.CanvasTexture(c); hazTex.wrapS = hazTex.wrapT = T3.RepeatWrapping; return hazTex; };
  const hazMat = (rep) => { const t = haz().clone(); t.needsUpdate = true; t.repeat.set(rep, 1); return new T3.MeshLambertMaterial({ map: t }); };
  let glowTex = null;
  const glow = () => { if (glowTex) return glowTex; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowTex = new T3.CanvasTexture(c); return glowTex; };
  const sprite = (col, size, x, y, z, op) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: glow(), color: col, transparent: true, opacity: op === undefined ? 0.9 : op, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); s.position.set(x, y, z); return s; };

  // ---- decor lointain : ville en silhouette, grues, soleil bas (devant le lanceur, au-dela du fog) ----
  function backdrop() {
    const G = new T3.Group(), dark = bas('#2a2128', { fog: false }), dark2 = bas('#3a2c30', { fog: false });
    const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    if (EVO.isS2()) { const sea = new T3.Mesh(new T3.PlaneGeometry(1400, 600), bas('#2a7aa6', { fog: false })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.2, -700); G.add(sea); for (const [x, z, l] of [[-160, -520, 90], [60, -600, 120], [220, -480, 80]]) { box(G, 16, 8, l, dark, x, 3, z); box(G, 10, 8, l * 0.25, dark2, x, 10, z + l * 0.1); box(G, 3, 10, 3, dark, x, 17, z + l * 0.1); } }
    else for (let i = 0; i < 38; i++) { const w = 14 + rnd() * 26, h = 22 + rnd() * 90 * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7))), x = -300 + i * 16 + rnd() * 6, z = -430 - rnd() * 90; box(G, w, h, w * 0.8, rnd() < 0.5 ? dark : dark2, x, h / 2 - 8, z); if (rnd() < 0.3) box(G, w * 0.2, 14, w * 0.2, dark, x, h + 5, z); }
    const crane = (x, z, h, s) => { const k = new T3.Group(); box(k, 3, h, 3, dark, 0, h / 2, 0); box(k, 90 * s, 2.6, 2.6, dark, 24 * s, h, 0); box(k, 26 * s, 2.6, 2.6, dark, -16 * s, h, 0); box(k, 8, 10, 8, dark, -24 * s, h - 6, 0); box(k, 0.7, 40 * s, 0.7, dark, 56 * s, h - 20 * s, 0); box(k, 4, 4, 4, dark, 0, h + 5, 0); k.position.set(x, -8, z); G.add(k); };
    // v227 : plus de grues en arriere-plan
    G.add(sprite('#ffb060', 150, -70, 24, -470, 0.95)); G.add(sprite('#fff0c8', 62, -70, 24, -468, 1)); G.add(sprite('#ff9040', 420, -70, 30, -475, 0.28));
    return G;
  }

  EVO.dressPad = (pad) => {
    const g = CC.game, la = EVO.launcher(EVO.save(g).la);
    if (pad.evoL) { pad.group.remove(pad.evoL); pad.evoL.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); pad.evoL = null; }
    // l'ancien decor du lanceur est masque (le nouveau le remplace)
    for (const c of pad.group.children) c.visible = false;
    const L = pad.evoL = new T3.Group(); pad.group.add(L);
    const concrete = lam('#8a8c90'), concD = lam('#6e7074'), steel = lam('#4c5460'), dark = lam('#262a31'), light = lam('#c8ccd2'), red = lam('#c8352a'), white = lam('#eceef2');
    // v174 : un petit lanceur de roquette tout simple : dalle, rail incline, deux bras de maintien, bouclier de flamme, quelques cones
    box(L, 2.6, 0.3, 6.0, concrete, 0, -0.78, -0.2);
    for (const s of [-1, 1]) { const b = new T3.Mesh(new T3.PlaneGeometry(0.085, 6.0), hazMat(20)); b.rotation.x = -Math.PI / 2; b.position.set(s * 1.24, -0.625, -0.2); L.add(b); }
    pad.deflMat = lam('#2a2d33', '#000000'); const defl = new T3.Mesh(new T3.BoxGeometry(0.9, 0.05, 1.3), pad.deflMat); defl.position.set(0, -0.6, 1.7); L.add(defl); pad.defl = defl; defl.userData.noBake = true;
    const cradle = new T3.Group(); L.add(cradle); cradle.rotation.x = pad.pitch || 0; pad.cradle = cradle;
    for (const s of [-1, 1]) box(cradle, 0.08, 0.1, 4.6, steel, s * 0.22, -0.3, -0.4);
    for (const z of [-2.1, -0.6, 0.9, 1.9]) box(cradle, 0.56, 0.06, 0.1, dark, 0, -0.34, z);
    if (EVO.isS2()) { box(cradle, 2.8, 0.3, 17, concrete, 0, -0.78, -8.2); for (const sx of [-1.3, 1.3]) box(cradle, 0.12, 0.04, 17, bas('#FFB347'), sx, -0.6, -8.2); for (let k = 0; k < 7; k++) box(cradle, 0.5, 0.04, 0.35, bas('#FFE08A'), 0, -0.6, -2.5 - k * 2); }   // niveau 2 : une rampe de beton dans le prolongement du rail
    for (const z of [-1.4, 0.6]) for (const s of [-1, 1]) box(L, 0.07, 0.42, 0.07, steel, s * 0.22, -0.52, z);
    box(cradle, 0.46, 0.3, 0.14, dark, 0, -0.2, 2.2);   // butee arriere
    pad.clamps = []; for (const z of [-0.2]) for (const s of [-1, 1]) { const arm = new T3.Group(); arm.position.set(s * 0.2, -0.22, z); cradle.add(arm); box(arm, 0.045, 0.34, 0.1, steel, 0, 0.15, 0); box(arm, 0.1, 0.05, 0.1, lam('#e8eaee'), -s * 0.04, 0.33, 0); pad.clamps.push({ arm, s }); }
    pad.boosters = []; const nb = 0;
    for (let i = 0; i < nb; i++) { const s = i % 2 ? 1 : -1, row = Math.floor(i / 2), x = s * (0.52 + row * 0.2), z = 1.0 - row * 0.5; const b = new T3.Group(); b.position.set(x, -0.34 + row * 0.04, z); L.add(b);
      cyl(b, 0.1, 0.1, 1.05, lam(row ? '#6a7480' : '#aeb6c0'), 0, 0, 0, 14, true); cyl(b, 0.103, 0.103, 0.14, red, 0, 0, -0.18, 14, true); cyl(b, 0.0, 0.1, 0.18, lam('#3a424c'), 0, 0, -0.6, 14, true); const noz = cyl(b, 0.075, 0.095, 0.1, dark, 0, 0, 0.58, 14, true); const fl = new T3.Mesh(new T3.ConeGeometry(0.075, 0.5, 10, 1, true), bas('#ffcf40', { transparent: true, opacity: 0.0, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = 0.88; b.add(fl); box(L, 0.2, 0.05, 0.3, steel, s * (0.4 + row * 0.1), -0.45, z); pad.boosters.push({ fl, noz }); }
    // v227 : plus de cones de chantier
    // v234 : HANGAR MILITAIRE (menu seulement) : dalle de beton a bandes de securite, murs de tole ondulee vert-de-gris, fermes metalliques, plafonniers, grande porte ouverte au fond
    { const DK = EVO.isS2(), H = pad.hangar = new T3.Group(), RF = H.userData.roof = new T3.Group(); H.add(RF);   // RF : le toit (masque au lancement du niveau 2 : la fusee sort du hangar)
      const tex = (w, h, draw, rx, ry) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const q = new T3.CanvasTexture(c); q.wrapS = q.wrapT = T3.RepeatWrapping; q.magFilter = T3.NearestFilter; q.minFilter = T3.NearestFilter; q.repeat.set(rx, ry); return q; };
      const tole = tex(32, 32, (x, w, h) => { x.fillStyle = DK ? '#38546e' : '#6F7C70'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? (DK ? '#2c445a' : '#5E6A5F') : (DK ? '#44627f' : '#7C8A7D'); x.fillRect(i * 4, 0, 4, h); } x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, h - 2, w, 2); }, 12, 3);
      const beton = tex(64, 64, (x, w, h) => { x.fillStyle = DK ? '#7b8a98' : '#8A8E94'; x.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { x.fillStyle = 'rgba(' + (i % 2 ? '255,255,255' : '0,0,0') + ',0.06)'; x.fillRect(Math.random() * w | 0, Math.random() * h | 0, 2, 2); } x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 0, w, 1); x.fillRect(0, 0, 1, h); }, 6, 8);
      const hz = hazMat(14);
      const wall = new T3.MeshLambertMaterial({ map: tole }), floor = new T3.MeshLambertMaterial({ map: beton }), steel = lam('#2F3A42'), steelL = lam('#4A5862'), lampM = bas('#FFF2C8');
      if (DK) { box(H, 3.1, 0.12, 20, floor, -4.45, -0.7, -2); box(H, 3.1, 0.12, 20, floor, 4.45, -0.7, -2); box(H, 6, 0.12, 8.2, floor, 0, -0.7, 4.1); }   // niveau 2 : pas de sol sous la trajectoire de la fusee : on voit la pente en dessous
      else box(H, 12, 0.12, 20, floor, 0, -0.7, -2);                                   // dalle du hangar (le lanceur reste un peu plus haut)
      for (const sx of [-5.6, 5.6]) { const b = new T3.Mesh(new T3.PlaneGeometry(0.5, 20), hz); b.rotation.x = -Math.PI / 2; b.position.set(sx, -0.63, -2); H.add(b); }   // bandes de securite le long des murs
      box(H, 0.3, 4.6, 20, wall, -6, 1.6, -2); box(H, 0.3, 4.6, 20, wall, 6, 1.6, -2);       // murs lateraux
      box(RF, 12.6, 0.4, 20.6, wall, 0, 4.1, -2);                                           // toit
      for (let z = -11; z <= 7; z += 3) { box(RF, 12, 0.35, 0.35, steel, 0, 3.8, z); box(H, 0.35, 4.4, 0.35, steel, -5.8, 1.5, z); box(H, 0.35, 4.4, 0.35, steel, 5.8, 1.5, z); box(RF, 11.8, 0.18, 0.18, steelL, 0, 3.4, z); }   // fermes et poteaux
      for (const z of [-8, -3, 2]) for (const sx of [-2.5, 2.5]) { box(RF, 0.5, 0.08, 3.2, lampM, sx, 3.55, z); }   // plafonniers (emissifs)
      box(H, 12.6, 1.4, 0.4, wall, 0, 3.4, 9);                                              // linteau du fond ; la grande porte reste OUVERTE : on voit dehors
      box(H, 3.4, 4.6, 0.4, wall, -4.6, 1.6, 9); box(H, 3.4, 4.6, 0.4, wall, 4.6, 1.6, 9);
      for (const sx of [-2.9, 2.9]) box(H, 0.3, 4.6, 0.5, steel, sx, 1.6, 9);              // montants de la porte
      if (DK) {   // DOCK : un canal d'eau le long du quai (a droite), des bollards, et la mer visible par la grande porte
        for (const z of [-11, -6, -1, 4]) { for (const sx of [-5.6, 5.6]) box(H, 1.1, 15, 1.1, steel, sx, -8.2, z); box(H, 11.4, 0.5, 0.7, steel, 0, -4.2, z); box(H, 11.4, 0.5, 0.7, steel, 0, -9.2, z); }   // jetee : le hangar est pose au bord de la pente, sur des pylones
        const wm = new T3.Mesh(new T3.PlaneGeometry(1.5, 18.6), new T3.MeshBasicMaterial({ color: '#2d86b4' })); wm.rotation.x = -Math.PI / 2; wm.position.set(3.35, -0.6, -2.2); H.add(wm); pad.dockWater = wm;
        for (const cx of [2.55, 4.15]) box(H, 0.18, 0.12, 18.6, lam('#9aa6b2'), cx, -0.58, -2.2);
        for (let z = -10; z <= 6; z += 4) { cyl(H, 0.14, 0.18, 0.4, lam('#2b2f36'), 4.35, -0.45, z, 10); box(H, 0.34, 0.06, 0.34, lam('#d9a441'), 4.35, -0.24, z); }
        const sea = new T3.Mesh(new T3.PlaneGeometry(900, 700), new T3.MeshBasicMaterial({ color: '#2a7aa6', fog: false })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.9, 9 + 340); H.add(sea);
        const ship = (x, z, l, c) => { const g = new T3.Group(); box(g, 14, 7, l, lam(c), 0, 3, 0); box(g, 10, 6, l * 0.22, lam('#5a6672'), 0, 9, -l * 0.15); box(g, 3, 8, 3, lam('#3a424c'), 0, 14, -l * 0.15); g.position.set(x, -0.6, z); H.add(g); };
        ship(-150, 9 + 220, 90, '#46525e'); ship(120, 9 + 300, 120, '#3c4650'); ship(-30, 9 + 380, 70, '#4a5662');
      }
      for (let k = 0; k < 3; k++) box(H, 0.9, 0.9, 0.9, lam(DK ? '#2f4a5e' : '#3F4A3C'), -5.1, -0.2, -6 + k * 1.1);   // caisses militaires le long du mur
      box(H, 0.9, 0.9, 0.9, lam(DK ? '#3b5a70' : '#4A5A3C'), -5.1, 0.7, -5.45);
      // v237 : le HANGAR GRANDIT a chaque amelioration du propulseur (niveaux 1 a 10) : chaque niveau ajoute un equipement, qui se construit en direct (EVO.playBuild)
      // chaque equipement est un groupe pose au sol (y = -0.7) : userData = { lv, kind (drop / rise / slide / power / glowline / pop), side }
      pad.hItems = [];
      const item = (lv, kind, x, z, side, fn) => { const o = new T3.Group(); o.position.set(x, -0.7, z); o.userData = { lv, kind, side: side || 1, bx: x, bz: z }; fn(o); o.visible = la.n >= lv; H.add(o); pad.hItems.push(o); return o; };
      const olive = lam(DK ? '#3b5a70' : '#4A5A3C'), crate = lam(DK ? '#2f4a5e' : '#3F4A3C'), amber = lam('#E0A31C'), blk = lam('#1C1F24'), scr = lam('#0F1B26'), pipe = lam('#7A8590');
      item(1, 'drop', 4.4, -5.2, 1, (o) => { box(o, 1.2, 1.0, 1.2, crate, 0, 0.5, 0); box(o, 1.2, 1.0, 1.2, olive, 1.3, 0.5, 0.2); box(o, 1.0, 0.9, 1.0, olive, 0.6, 1.45, 0.1); cyl(o, 0.38, 0.38, 1.0, lam('#B8452A'), -1.2, 0.5, 0.1, 12); cyl(o, 0.38, 0.38, 1.0, lam('#B8452A'), -1.2, 0.5, 1.0, 12); cyl(o, 0.4, 0.4, 0.08, blk, -1.2, 1.02, 0.1, 12); });
      item(2, 'glowline', 5.5, -2, 1, (o) => { for (const y of [0.7, 2.4]) { const q = cyl(o, 0.09, 0.09, 12, pipe, 0, y, 0, 8, true); } for (let k = 0; k < 4; k++) { box(o, 0.2, 2.0, 0.2, steel, 0, 1.2, -5.5 + k * 3.4); cyl(o, 0.17, 0.17, 0.16, amber, 0, 1.55, -5.5 + k * 3.4, 10); } });
      item(3, 'rise', 0, -0.4, 1, (o) => { const PX = DK ? 3.1 : 1.7; for (const sx of [-PX, PX]) box(o, 0.22, 3.4, 0.22, steel, sx, 1.7, 0); box(o, PX * 2 + 0.4, 0.26, 0.3, amber, 0, 3.5, 0); for (let k = 0; k < 6; k++) box(o, 0.3, 0.27, 0.31, blk, -1.5 + k * 0.6, 3.5, 0); box(o, 0.06, 1.0, 0.06, steelL, -0.6, 2.9, 0); box(o, 0.34, 0.2, 0.34, steel, -0.6, 2.3, 0); });
      item(4, 'power', -5.74, -4.9, -1, (o) => { for (let k = 0; k < 3; k++) { box(o, 0.12, 1.1, 1.8, scr, 0, 2.4, k * 2.1); box(o, 0.04, 0.9, 1.6, bas(k % 2 ? '#2FA8FF' : '#58D5FF'), 0.08, 2.4, k * 2.1); } });
      item(5, 'glowline', 0, -2, 1, (o) => { for (const sx of DK ? [-3.3, 3.3] : [-2.2, 2.2]) for (let k = 0; k < 9; k++) box(o, 0.14, 0.04, 0.5, bas(k % 2 ? '#FFB347' : '#FFE08A'), sx, 0.08, -9 + k * 1.9); });
      item(6, 'slide', 5.2, -7.8, 1, (o) => { box(o, 0.5, 1.8, 3.6, steel, 0, 0.9, 0); for (let k = 0; k < 3; k++) { cyl(o, 0.17, 0.17, 3.0, lam(k % 2 ? '#C9CED4' : '#B7BDC4'), 0, 0.5 + k * 0.55, 0, 10, true); box(o, 0.4, 0.4, 0.4, lam('#2B2F36'), 0, 0.5 + k * 0.55, -1.6); } });
      item(7, 'drop', -3.9, 1.4, -1, (o) => { box(o, 2.2, 0.9, 1.0, steel, 0, 0.45, 0); for (let k = 0; k < 3; k++) { box(o, 0.62, 0.45, 0.06, scr, -0.7 + k * 0.7, 1.35, -0.05); box(o, 0.5, 0.35, 0.05, bas(k === 1 ? '#7DF0A0' : '#58D5FF'), -0.7 + k * 0.7, 1.35, -0.1); } box(o, 0.5, 0.5, 0.5, blk, 1.4, 0.25, 0.1); });
      item(8, 'slide', 0, 2.2, -1, (o) => { box(o, 11.6, 0.3, 0.45, amber, 0, 3.15, 0); for (const sx of [-5.5, 5.5]) box(o, 0.4, 0.5, 0.7, steel, sx, 3.15, 0); box(o, 1.4, 0.5, 0.9, blk, 1.5, 2.8, 0); box(o, 0.06, 1.1, 0.06, steelL, 1.5, 2.1, 0); box(o, 0.3, 0.3, 0.3, amber, 1.5, 1.45, 0); });
      item(9, 'rise', 0, 4.4, 1, (o) => { const sh = box(o, 5.4, 2.6, 0.3, lam('#3A424C'), 0, 1.3, 0); sh.rotation.x = -0.2; for (let k = 0; k < 4; k++) box(o, 5.4, 0.06, 0.34, amber, 0, 0.35 + k * 0.6, 0.0).rotation.x = -0.2; for (const sx of [-2.4, 2.4]) { cyl(o, 0.2, 0.2, 0.5, lam('#8A2A20'), sx, 2.9, 0.1, 10); box(o, 0.2, 0.2, 0.2, bas('#FF5A3A'), sx, 3.3, 0.1); } });
      item(10, 'pop', 0, DK ? 5.2 : 1.0, 1, (o) => { const ring = cyl(o, 2.1, 2.1, 0.03, lam('#E0A31C'), 0, 0.03, 0, 28); cyl(o, 1.8, 1.8, 0.05, lam('#2C323A'), 0, 0.04, 0, 28); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { box(o, 0.3, 0.9, 0.3, steel, x * 2.5, 0.45, z * 2.4); box(o, 0.46, 0.2, 0.46, bas('#FFF2C8'), x * 2.5, 1.0, z * 2.4); } });
      L.add(H); }
    // decor lointain
    pad.backdrop = backdrop(); L.add(pad.backdrop);
    pad.vents = [new V(-0.5, -0.5, 1.0), new V(0.5, -0.5, 1.0), new V(-0.7, -0.5, -0.8), new V(0.7, -0.5, -0.8)];
    pad.evoCh = 0; pad.evoJ = 0;
  };

  // ---- animations du lanceur : turbine qui monte, boosters, vapeur, vibration, beacon ----
  EVO.pistonFrame = (g, dt) => {
    const pad = g.pad; if (!pad || !pad.evoL) return; const a = g.evoAim, now = performance.now(), A = g.audio;
    const hold = !!(a && a.hold && !a.lock), ch = a ? (a.lock ? 1 : a.ch || 0) : 0, rk = g.rocket;
    if (pad.hangar) { if (EVO.isS2()) { pad.hangar.visible = g.state === 'MENU' || g.state === 'LAUNCH' || g.state === 'AIM'; if (pad.hangar.userData.roof) pad.hangar.userData.roof.visible = g.state === 'MENU' && !g.evoAim; { const aim = g.state !== 'MENU' || g.evoAim, la = EVO.launcher(EVO.save(g).la).n; if (pad.hItems && !g.evoAnim) for (const o of pad.hItems) if (o.userData.lv === 3 || o.userData.lv === 8) o.visible = !aim && la >= o.userData.lv; } } else pad.hangar.visible = g.state === 'MENU' && !g.evoAim; }   // niveau 2 : le hangar reste, seul le toit disparait au lancement   // le hangar disparait des qu'on vise / lance : plus de toit devant la vue
    if (pad.backdrop) pad.backdrop.visible = g.state === 'MENU' || g.state === 'LAUNCH';   // le decor lointain n'existe que dans le menu (on ne peut pas voler a travers)
    if (pad.beacon) pad.beacon.color.setRGB(0.4 + 0.6 * (Math.sin(now / 280) > 0 ? 1 : 0), 0.05, 0.05);
    if (pad.towerArm) { const open = a && (a.lock || (a.hold && ch > 0.35)) ? 1 : 0; pad.towerArm.rotation.y += (open * -1.25 - pad.towerArm.rotation.y) * Math.min(1, dt * 3); }
    if (pad.boosters) for (const b of pad.boosters) { const k = hold || (a && a.lock) ? Math.min(1, ch * 1.3) : 0; b.fl.material.opacity = k * (0.55 + 0.35 * Math.random()); b.fl.scale.set(1, 0.6 + 1.2 * k * (0.8 + 0.4 * Math.random()), 1); }
    { const k = a ? (a.lock ? Math.max(0, 1 - a.lockT / 0.12) * Math.min(1, ch) : Math.min(1, ch)) : 0; pad.pullBack = 1.1 * k * k * (3 - 2 * k) * ((a && a.hold) || (a && a.lock) ? 1 : 0); }   // la fusee recule dans le rail pendant la charge, puis jaillit
    if (a) pad.manualK = 0.05 + 0.95 * Math.pow(Math.max(0, ch), 1.3);
    if (A && A.setIgnition) { if (hold) A.setIgnition(ch); else if (A._ign) A.stopIgnition(); }
    if (hold && g.effects) {
      const o = pad.origin, d = pad.dir, noz = new V().copy(o).addScaledVector(d, 0.62);
      if (Math.random() < dt * (10 + 40 * ch)) g.effects.exhaust(noz, d, new V(0, 0, 0), 0.5 + 1.3 * ch, Math.random());
      if (ch > 0.3 && Math.random() < dt * (8 + 30 * ch)) { const v = pad.vents[Math.floor(Math.random() * pad.vents.length)], p = new V(o.x + v.x, o.y + v.y, o.z + v.z); g.effects.smoke.emit({ pos: p, vel: new V((Math.random() - 0.5) * 1.2, 1.6 + Math.random() * 2.2, (Math.random() - 0.5) * 1.2), life: 0.7 + Math.random() * 0.6, s0: 0.1, s1: 0.4, s2: 0.9, peak: 0.3, cols: g.effects.pal.smoke, drag: 1.6, a: 0.45, fin: 0.05, fout: 0.4, wind: 0, turb: 1, spin: 1 }); }
      if (ch > 0.5 && Math.random() < dt * 40 * ch) g.effects.sparks.emit({ pos: noz.clone(), vel: new V(-d.x * (6 + 10 * Math.random()) + (Math.random() - 0.5) * 4, 1 + Math.random() * 3, -d.z * (6 + 10 * Math.random()) + (Math.random() - 0.5) * 4), life: 0.3 + Math.random() * 0.4, s0: 0.05, s1: 0.04, s2: 0.01, cols: g.effects.pal.ember, drag: 1.5, grav: 4, a: 1, fout: 0.4 });
    }
    // grille de la fosse : rougeoie avec la pression
    if (pad.deflMat && a && !a.lock) { const h = hold ? ch : 0; pad.deflMat.emissive.setRGB(0.95 * h, 0.35 * h * h, 0.04 * h); }
  };
  // le lancement : maintenir pour allumer, relacher pour liberer
  const _hs = EVO.holdStart; EVO.holdStart = (g) => { const had = g.evoAim && g.evoAim.hold; _hs(g); const a = g.evoAim; if (a && a.hold && !had && g.audio && g.audio.startIgnition) g.audio.startIgnition(); };
  const _rl = EVO.release; EVO.release = (g, over) => { const A = g.audio; _rl(g, over); if (A) { if (A.stopIgnition) A.stopIgnition(); if (A.play) A.play('clampOpen'); } };
  // evite le son de charge a ressort au premier toucher
  
  // v173 : plus de voyant rouge de detection au-dessus des ennemis
  if (CC.Models && CC.Models.alertSprite) { const _as = CC.Models.alertSprite; CC.Models.alertSprite = function () { const o = _as.apply(this, arguments); Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return o; }; }
})();
