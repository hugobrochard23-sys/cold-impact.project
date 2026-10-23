/* v237 : L'ATELIER — les animations d'amelioration du menu (c'est la « dopamine » du jeu : elles doivent faire plaisir a chaque achat).
 *   - tier  : nouveau palier de fusee (ogive 5 / 10 / 15) : la fusee monte, vue de FACE, s'allonge, les pieces arrivent en volant avec une traine lumineuse,
 *             se soudent (etincelles, anneau, secousse) ; reflet de coque, gerbe a la tuyere.
 *   - build : amelioration du propulseur (niveaux 1 a 10) : le hangar se construit en direct, equipement par equipement (chute, montee, glissement, mise sous tension).
 *   - up    : amelioration simple de la fusee : elle s'etire avec un rebond, un reflet la parcourt, des etincelles partent du nez et de la tuyere ; la camera ne bouge pas.
 * Les verrous d'interface (g.evoAnim) ne servent que pour tier et build ; « up » n'empeche rien (on peut acheter en rafale). */
(function () {
  const EVO = CC.EVO, U = CC.U, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on) return;
  const _a = new V(), _b = new V();
  const OB = (k) => { k = U.clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };   // easeOutBack
  const OC = (k) => 1 - Math.pow(1 - U.clamp(k, 0, 1), 3);
  const BOUNCE = (k) => { k = U.clamp(k, 0, 1); const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; };
  let GT = null;
  const glowTex = () => { if (GT) return GT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,200,110,0.7)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (GT = new T3.CanvasTexture(c)); };
  const glowSprite = (size, col) => { const s = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex(), color: col || '#ffffff', transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); return s; };
  const sparks = (g, p, n, sp, up) => { const fx = g.effects; if (!fx) return; for (let i = 0; i < n; i++) fx.sparks.emit({ pos: p, vel: new V(U.fx.range(-1, 1), U.fx.range(up === undefined ? -0.2 : up, 1.2), U.fx.range(-1, 1)).multiplyScalar(U.fx.range(sp * 0.4, sp)), life: U.fx.range(0.3, 0.9), s0: 0.05, s1: 0.06, s2: 0.01, cols: fx.pal.ember, drag: 1.2, grav: 3.5, a: 1, fout: 0.4 }); };
  const weld = (g, p) => { const fx = g.effects; if (!fx) return; sparks(g, p, 46, 9); fx.ring(p, new V(0, 1, 0), 0.2, 2.2, 0.5, '#ffd23a', 0.85); fx.ring(p, new V(1, 0, 0), 0.2, 1.8, 0.45, '#ffffff', 0.7); fx.flash(p.clone(), '#ffe9b0', 4, 14, 0.25, '#ff9a30'); };

  // ================================================== PALIER DE FUSEE ==================================================
  const FLY = { wings: [0, 2.6, 0.2], tail: [0, 0.5, -3.4], flaps: [0, 2.0, 1.8], boost: [0, -2.2, 0] };
  const skinLen = (t) => { const s = CC.Skins && CC.Skins.byId && CC.Skins.byId['evoT' + Math.min(3, Math.max(0, t))]; return s && s.dims ? s.dims.len + s.dims.noseLen : 1.4; };
  EVO.playEvolve = (g, tier, label) => {
    EVO.applySkin(g);
    const parts = []; let i = 0;
    for (const k of Object.keys(g.evoParts || {})) if (EVO.partTier()[k] === tier) { const p = g.evoParts[k]; p.userData.k = 0; p.visible = false; p.scale.setScalar(1); const f = FLY[k] || [0, 2, 0]; parts.push({ k, p, from: new V(f[0], f[1], f[2]), t0: 0.9 + i * 0.5, arr: false, glow: glowSprite(1.4, '#ffd9a0') }); i++; }
    const stretch = skinLen(Math.max(0, tier - 1)) / skinLen(tier);
    const last = parts.length ? parts[parts.length - 1].t0 + 0.8 : 1.6;
    g.evoAnim = { kind: 'tier', t: 0, dur: last + 1.9, tier, label, sub: 'NOUVELLE PIÈCE', parts, stretch, lift: 0, ring: false, sheen: last + 0.1, base: g.rocket.mesh.scale.x };
    for (const q of parts) { q.p.parent.add(q.glow); q.glow.visible = false; }
    g.audio.play('padArm'); g.rig.shake = Math.max(g.rig.shake, 0.25);
  };
  EVO.tierFrame = (g, dt, A) => {
    const rk = g.rocket, m = rk.mesh, fx = g.effects, t = A.t;
    A.lift = U.clamp(Math.min(t / 0.7, (A.dur - t) / 0.7), 0, 1) * 0.42;   // la fusee remonte pendant l'assemblage, puis se repose
    m.position.y += A.lift;
    // allongement : la coque passe de l'ancienne longueur a la nouvelle, avec un rebond
    if (A.stretch < 0.999) { const k = OB((t - 0.25) / 0.9), s = A.stretch + (1 - A.stretch) * k; m.scale.z = A.base * s; } else { m.scale.z = A.base * (1 + 0.05 * Math.sin(U.clamp((t - 0.3) / 0.6, 0, 1) * Math.PI)); }
    if (t < 0.9 && Math.random() < 0.8) sparks(g, _a.copy(rk.pos).add(_b.set(U.fx.range(-0.3, 0.3), 0.15, U.fx.range(-0.3, 0.3))), 1, 3, 0.6);
    for (const q of A.parts) {
      const k = (t - q.t0) / 0.8;
      if (k > 0 && !q.arr) {
        q.p.visible = true; q.glow.visible = true; const e = OC(k), r = 1 - e; q.p.position.set(q.from.x * r, q.from.y * r, q.from.z * r); q.p.rotation.set(r * 1.6, r * 2.2, r * 0.9); q.p.userData.k = 1;
        q.glow.position.copy(q.p.position); q.glow.scale.setScalar(0.8 + 1.4 * r); q.glow.material.opacity = 0.4 + 0.6 * r;
        if (fx && Math.random() < 0.6) { q.p.getWorldPosition(_a); fx.sparks.emit({ pos: _a, vel: new V(U.fx.range(-0.5, 0.5), U.fx.range(-0.3, 0.6), U.fx.range(-0.5, 0.5)), life: 0.4, s0: 0.05, s1: 0.05, s2: 0.01, cols: fx.pal.ember, drag: 2, grav: 0, a: 1, fout: 0.5 }); }
        if (k >= 1) { q.arr = true; q.p.position.set(0, 0, 0); q.p.rotation.set(0, 0, 0); q.glow.visible = false; q.p.getWorldPosition(_a); weld(g, rk.pos.clone().add(_a.sub(rk.pos).multiplyScalar(0.5))); g.audio.play('clunk'); g.audio.play('levelUp'); if (CC.Haptics) CC.Haptics.pattern('levelUp'); g.rig.shake = Math.max(g.rig.shake, 0.7); g.flash = 0.22; g.flashColor = '#ffe9b0'; }
      } else if (q.arr) { q.p.visible = true; }
    }
    // reflet qui parcourt la coque une fois tout assemble, puis gerbe a la tuyere
    { const sh = U.clamp((t - A.sheen) / 0.9, 0, 1), v = Math.sin(sh * Math.PI) * 0.5; m.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && !o.material.isMeshBasicMaterial && !(m.userData.jet && m.userData.jet.group.getObjectById(o.id))) o.material.emissive.setRGB(v, v, v * 0.95); }); }
    if (t > A.sheen + 0.5 && !A.ring && fx) { A.ring = true; _a.copy(rk.pos).addScaledVector(g.pad.dir, -1.0); for (let i = 0; i < 40; i++) fx.sparks.emit({ pos: _a, vel: _b.copy(g.pad.dir).multiplyScalar(-U.fx.range(2, 8)).add(new V(U.fx.range(-2, 2), U.fx.range(-1, 2), U.fx.range(-2, 2))), life: U.fx.range(0.3, 0.8), s0: 0.05, s1: 0.05, s2: 0.01, cols: fx.pal.ember, drag: 1, grav: 2, a: 1, fout: 0.4 }); g.audio.play('padArm'); }
    if (t > A.dur) {
      for (const q of A.parts) { q.p.visible = true; q.p.position.set(0, 0, 0); q.p.rotation.set(0, 0, 0); q.p.userData.k = 1; if (q.glow.parent) q.glow.parent.remove(q.glow); }
      m.scale.set(A.base, A.base, A.base); g.evoAnim = null;
      m.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && !o.material.isMeshBasicMaterial) { const i0 = o.material.userData && o.material.userData.em0; o.material.emissive.setRGB(i0 ? i0[0] : 0, i0 ? i0[1] : 0, i0 ? i0[2] : 0); } });
    }
  };

  // ================================================== HANGAR : construction en direct ==================================================
  EVO.playBuild = (g, n) => {
    const pad = g.pad; if (!pad || !pad.hItems) return false;
    const list = pad.hItems.filter((o) => o.userData.lv === n); if (!list.length) return false;
    const ctr = new V(); list.forEach((o, i) => { o.visible = false; o.userData.delay = 0.7 + i * 0.5; o.userData.arr = false; o.updateWorldMatrix(true, false); ctr.add(o.getWorldPosition(new V()).add(new V(0, 1.4, 0))); }); ctr.multiplyScalar(1 / list.length);
    g.evoAnim = { kind: 'build', t: 0, dur: 0.7 + list.length * 0.5 + 1.9, label: 'ENTREPÔT', sub: 'NOUVEL ÉQUIPEMENT', list, ctr, n };
    g.audio.play('padArm'); return true;
  };
  EVO.buildFrame = (g, dt, A) => {
    const fx = g.effects, t = A.t;
    for (const o of A.list) {
      const u = o.userData, k = (t - u.delay) / 0.95; if (k <= 0) continue; o.visible = true;
      o.position.set(u.bx, -0.7, u.bz); o.scale.set(1, 1, 1);
      if (u.kind === 'drop') { o.position.y = -0.7 + (1 - BOUNCE(k)) * 6.5; }
      else if (u.kind === 'rise') { o.scale.y = Math.max(0.001, OB(k)); }
      else if (u.kind === 'slide') { o.position.x = u.bx + u.side * (1 - OC(k)) * 7; }
      else if (u.kind === 'glowline') { o.scale.z = Math.max(0.001, OC(k)); }
      else if (u.kind === 'power') { o.visible = k > 0.55 || (Math.floor(k * 18) % 2 === 0); o.scale.setScalar(k < 1 ? 0.92 + 0.08 * k : 1); }
      else if (u.kind === 'pop') { const s = Math.max(0.001, OB(k)); o.scale.set(s, s, s); }
      if (k > 0.2 && k < 0.95 && fx && Math.random() < 0.5) { o.getWorldPosition(_a); _a.y += 0.4 + Math.random() * 2.5; sparks(g, _a, 1, 3, 0.2); }
      if (k >= 1 && !u.arr) { u.arr = true; o.getWorldPosition(_a); _a.y += 0.3; weld(g, _a.clone()); g.audio.play('clunk'); if (CC.Haptics) CC.Haptics.tick('touch'); g.rig.shake = Math.max(g.rig.shake, 0.45); if (u.kind === 'drop') fx.dustKick(_a.clone(), new V(0, 1, 0), 0.7); }
    }
    if (t > A.dur) { for (const o of A.list) { o.visible = true; o.position.set(o.userData.bx, -0.7, o.userData.bz); o.scale.set(1, 1, 1); } g.evoAnim = null; g.flash = 0.25; g.flashColor = '#ffffff'; g.audio.play('levelUp'); }
  };

  // ================================================== AMELIORATION SIMPLE : la fusee s'etire et brille ==================================================
  EVO.playUp = (g, id) => { g.evoUp = { t: 0, dur: 1.15, id, sparked: false }; };
  EVO.upFrame = (g, dt) => {
    const U0 = g.evoUp; if (!U0) return; U0.t += dt; const rk = g.rocket, m = rk.mesh, t = U0.t, k = t / U0.dur, fx = g.effects;
    const base = (1 + 0.012 * EVO.rocket(EVO.save(g).rk).n) * 1.28 * (EVO.save(g).rk >= 0 ? 1 : 1);
    if (U0.id === 'rk') {
      const s = Math.sin(U.clamp(k * 1.25, 0, 1) * Math.PI), bounce = OB(U.clamp(k * 2.2, 0, 1)) - 1;
      m.scale.set(base * (1 - 0.06 * s), base * (1 - 0.06 * s), base * (1 + 0.16 * s + 0.1 * bounce * (1 - k)));
      m.position.y += 0.1 * Math.sin(U.clamp(k * 1.2, 0, 1) * Math.PI);
      { const sh = U.clamp((t - 0.1) / 0.8, 0, 1), v = Math.sin(sh * Math.PI) * 0.55; m.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && !o.material.isMeshBasicMaterial && !(m.userData.jet && m.userData.jet.group.getObjectById(o.id))) o.material.emissive.setRGB(v, v, v * 0.95); }); }
      if (!U0.sparked && fx) { U0.sparked = true; const d = g.pad.dir; _a.copy(rk.pos).addScaledVector(d, 0.9); sparks(g, _a, 18, 5); _a.copy(rk.pos).addScaledVector(d, -0.9); sparks(g, _a, 18, 5); fx.ring(rk.pos.clone(), d, 0.2, 2.2, 0.5, '#ffd23a', 0.7); }
    } else if (U0.id === 'la' && g.pad) {
      const o = g.pad.origin; if (fx && t < 0.5 && Math.random() < 0.7) { sparks(g, _a.set(o.x + U.fx.range(-0.5, 0.5), o.y - 0.6, o.z + U.fx.range(-1, 1)), 1, 3, 0.3); }
    }
    if (t > U0.dur) { g.evoUp = null; m.scale.setScalar(base); m.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && !o.material.isMeshBasicMaterial) { const i0 = o.material.userData && o.material.userData.em0; o.material.emissive.setRGB(i0 ? i0[0] : 0, i0 ? i0[1] : 0, i0 ? i0[2] : 0); } }); }
  };

  // ================================================== branchement ==================================================
  const _fr = EVO.frame;
  EVO.frame = (g, dt) => {
    _fr(g, dt);
    const A = g.evoAnim; if (A && A.kind === 'tier') { A.t += dt; EVO.tierFrame(g, dt, A); } else if (A && A.kind === 'build') { A.t += dt; EVO.buildFrame(g, dt, A); }
    if (g.evoUp) EVO.upFrame(g, dt);
  };
  const _buy = EVO.buy;
  EVO.buy = (g, id, free) => {
    const S0 = EVO.save(g), before = S0[id], ok = _buy(g, id, free); if (!ok) return ok;
    const n = EVO.save(g)[id]; g.evoGemOffer = id;   // l'offre « gemme / pub » ne s'affiche que sur la carte qu'on vient d'acheter, quand il n'y a plus assez de pieces
    if (id === 'la' && g.pad && n <= 10) { EVO.playBuild(g, n); } else if ((id === 'rk' && !g.evoAnim) || id === 'la') EVO.playUp(g, id);
    if (id === 'cm') { const d = EVO.mult(n) - EVO.mult(before); g.evoBought = { id, t0: performance.now(), delta: d, palier: Math.floor(EVO.mult(n)) > Math.floor(EVO.mult(before)) || d >= 0.5, mult: EVO.mult(n) }; if (CC.Haptics && g.evoBought.palier) CC.Haptics.pattern('levelUp'); if (g.evoBought.palier) g.audio.play('coinPing'); }
    return ok;
  };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { g.evoGemOffer = null; _br(g); };
  const _st = EVO.start; EVO.start = (g) => { g.evoGemOffer = null; return _st(g); };
  const _ch = EVO.camHook;
  EVO.camHook = (g, rig, o) => {
    const A = g.evoAnim;
    // niveau 2 : au lancement, la camera est PLUS HAUTE et regarde vers le bas, derriere la fusee : on voit la fusee, la rampe et la mer devant
    if (!A && g.evoAim && g.pad && EVO.isS2()) { const d = g.pad.dir, up = new V(0, 1, 0), ch = g.pad.charge || 0, p = new V().copy(o).addScaledVector(d, -4.6).addScaledVector(up, 3.0), l = new V().copy(o).addScaledVector(d, 3.4).addScaledVector(up, -0.8); p.lerp(l, 0.2 * ch * ch * (3 - 2 * ch)); rig.padPos.copy(p); rig.padLook.copy(l); rig.padFov = 54 * (1 - 0.1 * ch * ch); return; }
    if (!A || !A.kind) { _ch(g, rig, o); return; }
    if (A.t > A.dur - 1.1) { g.evoAnim = null; _ch(g, rig, o); g.evoAnim = A; return; }   // fin : la camera du menu reprend en douceur (pas de balayage etrange)
    const t = A.t, dir = g.pad.dir, up = new V(0, 1, 0), right = new V().crossVectors(dir, up).normalize(), Lw = EVO.rocketLen(g);
    const k = U.smooth(0, 0.6, t);
    let p, look, fov;
    if (A.kind === 'tier') {   // vue de FACE : on regarde la fusee venir vers nous, on ne zoome pas dessus
      const D = U.clamp(3.1 * Lw, 4.4, 9), ang = Math.sin(t * 0.5) * 0.28;
      p = new V().copy(o).addScaledVector(dir, D * Math.cos(ang)).addScaledVector(right, D * Math.sin(ang) + D * 0.12).addScaledVector(up, D * 0.22); look = new V().copy(o).addScaledVector(up, 0.55); fov = 46;
    } else {   // hangar : vue large de l'interieur, qui se tourne vers l'equipement en construction
      const it = A.list[0], Hh = it.parent, u = it.userData; Hh.updateWorldMatrix(true, false);   // on se place de l'autre cote de l'equipement, pour bien le voir
      const cx = Math.abs(u.bx) > 2 ? -Math.sign(u.bx) * 3.0 : 3.0, cz = U.clamp(u.bz - 6.0, -11.0, 5.0);
      p = Hh.localToWorld(new V(cx, 1.8, cz)); look = Hh.localToWorld(new V(u.bx * 0.7, 1.2, u.bz)); fov = 62;
    }
    rig.padPos.lerp(p, k); rig.padLook.lerp(look, k); rig.padFov += (fov - rig.padFov) * k;
  };
})();
