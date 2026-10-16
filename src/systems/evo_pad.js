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
    for (let i = 0; i < 38; i++) { const w = 14 + rnd() * 26, h = 22 + rnd() * 90 * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7))), x = -300 + i * 16 + rnd() * 6, z = -430 - rnd() * 90; box(G, w, h, w * 0.8, rnd() < 0.5 ? dark : dark2, x, h / 2 - 8, z); if (rnd() < 0.3) box(G, w * 0.2, 14, w * 0.2, dark, x, h + 5, z); }
    const crane = (x, z, h, s) => { const k = new T3.Group(); box(k, 3, h, 3, dark, 0, h / 2, 0); box(k, 90 * s, 2.6, 2.6, dark, 24 * s, h, 0); box(k, 26 * s, 2.6, 2.6, dark, -16 * s, h, 0); box(k, 8, 10, 8, dark, -24 * s, h - 6, 0); box(k, 0.7, 40 * s, 0.7, dark, 56 * s, h - 20 * s, 0); box(k, 4, 4, 4, dark, 0, h + 5, 0); k.position.set(x, -8, z); G.add(k); };
    crane(-120, -330, 110, 1); crane(150, -380, 140, 1.15); crane(-230, -420, 90, 0.9);
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
    // dalle et bandes de danger
    box(L, 4.6, 0.34, 9.4, concrete, 0, -0.78, -0.4);
    for (const s of [-1, 1]) { const b = new T3.Mesh(new T3.PlaneGeometry(0.22, 9.4), hazMat(30)); b.rotation.x = -Math.PI / 2; b.position.set(s * 2.2, -0.605, -0.4); L.add(b); }
    for (const e of [-1, 1]) { const b = new T3.Mesh(new T3.PlaneGeometry(4.6, 0.22), hazMat(14)); b.rotation.x = -Math.PI / 2; b.position.set(0, -0.605, -0.4 + e * 4.6); L.add(b); }
    box(L, 1.5, 0.05, 6.2, concD, 0, -0.6, -0.6);   // chemin du rail
    // fosse a flammes derriere : grille qui rougeoie
    pad.deflMat = lam('#2a2d33', '#000000'); const defl = new T3.Mesh(new T3.BoxGeometry(1.2, 0.06, 1.7), pad.deflMat); defl.position.set(0, -0.58, 1.9); L.add(defl); pad.defl = defl; defl.userData.noBake = true;
    for (let k = -2; k <= 2; k++) box(L, 0.04, 0.08, 1.7, dark, k * 0.22, -0.55, 1.9);
    // rail de lancement incline (suit la visee)
    const cradle = new T3.Group(); L.add(cradle); cradle.rotation.x = pad.pitch || 0; pad.cradle = cradle;
    box(cradle, 0.46, 0.1, 5.2, dark, 0, -0.34, -0.5); for (const s of [-1, 1]) { box(cradle, 0.07, 0.1, 5.2, steel, s * 0.24, -0.26, -0.5); box(cradle, 0.02, 0.02, 5.2, lam('#FFE600', '#6a5f00'), s * 0.24, -0.2, -0.5); }
    for (const z of [-2.7, -1.5, -0.3, 0.9, 2.0]) box(cradle, 0.64, 0.05, 0.1, steel, 0, -0.3, z);
    for (const z of [-1.9, 0.3, 1.6]) for (const s of [-1, 1]) box(L, 0.08, 0.5, 0.08, steel, s * 0.24, -0.5, z);
    box(cradle, 0.5, 0.34, 0.5, dark, 0, -0.2, 2.45); box(cradle, 0.36, 0.1, 0.36, lam('#FFE600'), 0, 0.0, 2.45);   // butee arriere
    // bras de maintien (s'ouvrent a l'allumage) : pivots articules sur le rail
    pad.clamps = []; for (const z of [-0.28, 0.26]) for (const s of [-1, 1]) { const arm = new T3.Group(); arm.position.set(s * 0.2, -0.22, z); cradle.add(arm); box(arm, 0.045, 0.34, 0.09, steel, 0, 0.15, 0); box(arm, 0.1, 0.05, 0.1, lam('#FFE600'), -s * 0.04, 0.33, 0); box(arm, 0.06, 0.06, 0.09, dark, 0, 0.0, 0); pad.clamps.push({ arm, s }); }
    // boosters du propulseur (paliers) : a droite et a gauche du rail, ils rougeoient quand on charge
    pad.boosters = []; const nb = [0, 2, 4][la.tier] || 0;
    for (let i = 0; i < nb; i++) { const s = i % 2 ? 1 : -1, row = Math.floor(i / 2), x = s * (0.56 + row * 0.2), z = 1.0 - row * 0.5; const b = new T3.Group(); b.position.set(x, -0.34 + row * 0.04, z); L.add(b);
      cyl(b, 0.1, 0.1, 1.05, lam(row ? '#6a7480' : '#aeb6c0'), 0, 0, 0, 14, true); cyl(b, 0.103, 0.103, 0.14, red, 0, 0, -0.18, 14, true); cyl(b, 0.0, 0.1, 0.18, lam('#3a424c'), 0, 0, -0.6, 14, true); const noz = cyl(b, 0.075, 0.095, 0.1, dark, 0, 0, 0.58, 14, true); const fl = new T3.Mesh(new T3.ConeGeometry(0.075, 0.5, 10, 1, true), bas('#ffcf40', { transparent: true, opacity: 0.0, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = 0.88; b.add(fl); box(L, 0.2, 0.05, 0.3, steel, s * (0.4 + row * 0.1), -0.45, z); pad.boosters.push({ fl, noz }); }
    // tour ombilicale (a gauche) : pylones, croisillons, plateforme, bras et cable
    { const tw = new T3.Group(); tw.position.set(-1.7, -0.6, -0.4); L.add(tw); const H = 4.4; for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) box(tw, 0.07, H, 0.07, steel, x, H / 2, z);
      for (let k = 0; k < 9; k++) { const y = 0.25 + k * 0.5; box(tw, 0.66, 0.04, 0.04, steel, 0, y, -0.3); box(tw, 0.66, 0.04, 0.04, steel, 0, y, 0.3); box(tw, 0.04, 0.04, 0.66, steel, -0.3, y, 0); box(tw, 0.04, 0.04, 0.66, steel, 0.3, y, 0); const d = box(tw, 0.04, 0.6, 0.04, steel, 0, y + 0.25, -0.3); d.rotation.z = k % 2 ? 0.8 : -0.8; }
      box(tw, 0.9, 0.08, 0.9, dark, 0, H, 0); box(tw, 0.9, 0.3, 0.04, lam('#FFE600'), 0, H + 0.15, 0.43);
      pad.beacon = bas('#ff2b2b'); const bc = new T3.Mesh(new T3.SphereGeometry(0.07, 8, 6), pad.beacon); bc.position.set(0, H + 0.5, 0); tw.add(bc); box(tw, 0.02, 0.4, 0.02, steel, 0, H + 0.25, 0);
      pad.towerArm = new T3.Group(); pad.towerArm.position.set(0.3, 1.9, 0); tw.add(pad.towerArm); box(pad.towerArm, 1.1, 0.07, 0.1, steel, 0.55, 0, 0); cyl(pad.towerArm, 0.04, 0.04, 0.22, dark, 1.08, -0.02, 0, 8); const cable = box(pad.towerArm, 1.0, 0.025, 0.025, dark, 0.55, -0.12, 0.06); cable.rotation.z = -0.1; }
    // reservoir blanc a bande rouge + tuyaux
    { const tk = cyl(L, 0.42, 0.42, 2.0, white, -2.9, -0.2, 2.6, 18, true); tk.rotation.z = Math.PI / 2 * 0; tk.rotation.x = Math.PI / 2; tk.rotation.y = Math.PI / 2; for (const z of [-0.5, 0.5]) { const b = cyl(L, 0.425, 0.425, 0.16, red, -2.9, -0.2, 2.6 + z, 18, true); b.rotation.y = Math.PI / 2; }
      for (const x of [-3.3, -2.5]) box(L, 0.1, 0.4, 0.5, steel, x, -0.55, 2.6); const pipe = cyl(L, 0.045, 0.045, 1.9, steel, -1.7, -0.5, 2.6, 8, true); pipe.rotation.y = Math.PI / 2; pipe.rotation.z = Math.PI / 2; }
    // projecteurs, cones et bidons
    for (const [x, z] of [[1.9, -2.6], [-2.0, -3.0]]) { cyl(L, 0.04, 0.05, 2.6, steel, x, 0.7, z, 8); box(L, 0.5, 0.14, 0.3, dark, x, 2.0, z); box(L, 0.42, 0.08, 0.04, bas('#fff1c8'), x, 2.0, z - 0.17); L.add(sprite('#ffe0a0', 1.1, x, 2.0, z - 0.4, 0.55)); }
    for (const [x, z] of [[2.0, 1.0], [-1.0, 3.9], [1.9, -1.2], [-0.8, -4.6]]) { const c = new T3.Mesh(new T3.ConeGeometry(0.1, 0.34, 10), lam('#ff7a1c')); c.position.set(x, -0.42, z); L.add(c); box(L, 0.26, 0.03, 0.26, lam('#ff7a1c'), x, -0.58, z); }
    for (const [x, z, c] of [[-1.3, 2.9, '#3a4a5a'], [-1.5, 3.3, '#7a3030'], [1.0, 3.8, '#c8a028']]) cyl(L, 0.16, 0.16, 0.42, lam(c), x, -0.4, z, 12);
    box(L, 1.3, 0.8, 0.8, lam('#5a6a54'), 2.9, -0.2, -2.2); box(L, 1.34, 0.06, 0.84, dark, 2.9, 0.22, -2.2);   // petit conteneur
    // decor lointain
    L.add(backdrop());
    pad.vents = [new V(-0.5, -0.5, 1.0), new V(0.5, -0.5, 1.0), new V(-0.7, -0.5, -0.8), new V(0.7, -0.5, -0.8)];
    pad.evoCh = 0; pad.evoJ = 0;
  };

  // ---- animations du lanceur : turbine qui monte, boosters, vapeur, vibration, beacon ----
  EVO.pistonFrame = (g, dt) => {
    const pad = g.pad; if (!pad || !pad.evoL) return; const a = g.evoAim, now = performance.now(), A = g.audio;
    const hold = !!(a && a.hold && !a.lock), ch = a ? (a.lock ? 1 : a.ch || 0) : 0, rk = g.rocket;
    if (pad.beacon) pad.beacon.color.setRGB(0.4 + 0.6 * (Math.sin(now / 280) > 0 ? 1 : 0), 0.05, 0.05);
    if (pad.towerArm) { const open = a && (a.lock || (a.hold && ch > 0.35)) ? 1 : 0; pad.towerArm.rotation.y += (open * -1.25 - pad.towerArm.rotation.y) * Math.min(1, dt * 3); }
    if (pad.boosters) for (const b of pad.boosters) { const k = hold || (a && a.lock) ? Math.min(1, ch * 1.3) : 0; b.fl.material.opacity = k * (0.55 + 0.35 * Math.random()); b.fl.scale.set(1, 0.6 + 1.2 * k * (0.8 + 0.4 * Math.random()), 1); }
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
