/* v144 : EXECUTION du niveau 2 : définition du niveau, mer à y = 0, ambiance sous l'eau qui dépend de la profondeur (lumière du jour qui descend, eau claire),
 * neige marine, tempête (éclairs, rafales), pictogrammes d'alerte. Les scènes sont dans zones_ocean*.js. */
(function () {
  const U = CC.U, EVO = CC.EVO, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on) return;
  const C3 = (h) => new T3.Color(h);
  const rr = (a, b) => a + Math.random() * (b - a);
  // --- ambiances
  EVO.addMood = (name, m) => { for (const f of ['top', 'hor', 'fog', 'hemiS', 'hemiG', 'sunC']) m[f] = C3(m[f]); EVO.MOOD[name] = m; };
  EVO.addMood('sea', { top: '#4a88cc', hor: '#dfe8ee', fog: '#bfd2de', near: 180, far: 700, hemiS: '#e0ecf8', hemiG: '#4a7a98', hemiI: 0.9, amb: 0.2, sunC: '#fff0d0', sunI: 0.9, night: 0 });
  EVO.addMood('storm', { top: '#262d3a', hor: '#68727e', fog: '#4c545e', near: 60, far: 430, hemiS: '#9aa6b8', hemiG: '#3a4650', hemiI: 0.62, amb: 0.2, sunC: '#aab4c8', sunI: 0.35, night: 0.2 });
  EVO.addMood('stormEnd', { top: '#2a3040', hor: '#e0805a', fog: '#6a5460', near: 70, far: 480, hemiS: '#c8a8b0', hemiG: '#3a3a46', hemiI: 0.7, amb: 0.24, sunC: '#ff9a6a', sunI: 0.7, night: 0.3 });
  for (const k of ['abysses', 'recif', 'epaves', 'canyon', 'cheminee', 'surface', 'flotte']) { EVO.SCENE_MOOD[k] = 'sea'; EVO.SCENE_AUDIO[k] = 'evoDay'; }
  for (const k of ['tempete']) { EVO.SCENE_MOOD[k] = 'storm'; EVO.SCENE_AUDIO[k] = 'evoSiege'; }
  for (const k of ['plateforme', 'ascension']) { EVO.SCENE_MOOD[k] = 'stormEnd'; EVO.SCENE_AUDIO[k] = 'evoBoss'; }
  EVO.SCENE_AUDIO.abysses = 'evoMine';
  // --- définition du niveau 2
  const SC2 = ['abysses', 'surface', 'tempete', 'plateforme', 'ascension'];
  const CH2 = { abysses: 'LES ABYSSES', surface: 'LA FLOTTE', tempete: 'LA TEMPETE', plateforme: 'LA PLATEFORME', ascension: 'L INTERCEPTION' };
  EVO.levelDef2 = (g) => {
    const th = CC.LM.THEMES[0], q = /[?&]evoscenes=([\w,]+)/.exec(location.search), sc = q ? q[1].split(',') : (EVO.SCENES2 || SC2), Zs = CC.Zones.defs.ocean.scenes;
    let len = 80; EVO.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { EVO.chapters.push({ d: len - 80, i: EVO.chapters.length, name: CH2[n] || n.toUpperCase(), key: n }); if (s.sub) for (const w of s.sub) if (w.u > 0) EVO.chapters.push({ d: len - 80 + w.u * s.len[0], i: EVO.chapters.length, name: w.name, key: w.key }); len += s.len[0]; } }
    return EVO.baseDef({ zone: 'ocean', seed: 6161, len: q ? len + 400 : len, scenes: sc, order: new Array(90).fill('ocean'), theme: th });
  };
  const _br = EVO.beginRun;
  EVO.beginRun = (g) => { _br(g); EVO.seaLevel = EVO.stage(g) === 2 ? 0 : undefined; g.evoGust = null; g.evoLight = null; };
  // --- sous l'eau : couleur de l'eau qui s'assombrit avec la profondeur, eau claire (on voit loin), lumière qui descend
  const UW_TOP = C3('#58c4e6'), UW_DEEP = C3('#0c4a6e'), UW_HOR = C3('#3aa8d0'), _c = new T3.Color();
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m);
    if (EVO.seaLevel === undefined || !g.uwK || g.uwK < 0.01) { if (EVO.seaLevel !== undefined) g.fogBase = null; return; }
    const k = g.uwK, rk = g.rocket, depth = U.clamp(-(rk && rk.active ? rk.pos.y : -20) / 110, 0, 1), f = g.scene.fog, u = g.skyMat.uniforms;
    _c.copy(UW_TOP).lerp(UW_DEEP, depth * 0.85);
    f.color.lerp(_c, k); f.near = U.lerp(f.near, 8, k); f.far = U.lerp(f.far, 380 - 190 * depth, k); g.renderer.setClearColor(f.color); g.fogBase = null;
    u.top.value.lerp(_c, k); u.horizon.value.lerp(_c, k); u.bottom.value.lerp(UW_DEEP, k * 0.7);
    g.hemi.color.lerp(C3('#b8f0ff'), k); g.hemi.groundColor.lerp(C3('#14566e'), k); g.hemi.intensity = U.lerp(g.hemi.intensity, 1.0 - 0.38 * depth, k); g.ambient.intensity = U.lerp(g.ambient.intensity, 0.34, k);
    g.sun.intensity = U.lerp(g.sun.intensity, 0.95 * (1 - 0.7 * depth), k); g.sun.color.lerp(C3('#e8fbff'), k);
    if (g.postParams) { g.postParams.tint = '#' + C3('#ffffff').lerp(C3('#cdf4ff'), k).getHexString(); g.postParams.bloomStrength = Math.max(g.postParams.bloomStrength, 0.12 * k); }
    g.nightK = U.lerp(g.nightK || 0, 0.35 * depth, k);
  };
  // --- neige marine : des particules qui défilent autour de la caméra quand on est sous l'eau (donnent le sens de la vitesse)
  let snow = null;
  const snowTick = (g, dt) => {
    if (EVO.seaLevel === undefined || !g.scene) { if (snow) snow.visible = false; return; }
    if (!snow) { const N = 260, p = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) p[i] = rr(-60, 60); const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(p, 3)); snow = new T3.Points(geo, new T3.PointsMaterial({ color: '#d8f4ff', size: 0.45, sizeAttenuation: true, transparent: true, opacity: 0.6, depthWrite: false, fog: false })); snow.frustumCulled = false; snow.userData.o = p.slice(); g.scene.add(snow); }
    if (snow.parent !== g.scene) g.scene.add(snow);
    snow.visible = (g.uwK || 0) > 0.3 && !g.cine3d; if (!snow.visible) return;
    const cam = g.camera.position, P = snow.geometry.attributes.position, O = snow.userData.o, t = EVO.clock;
    for (let i = 0; i < P.count; i++) { const ox = O[i * 3], oy = O[i * 3 + 1] + Math.sin(t * 0.4 + i) * 1.2, oz = O[i * 3 + 2]; P.setXYZ(i, cam.x + ((((ox - cam.x) % 120) + 180) % 120) - 60, cam.y + ((((oy - cam.y) % 120) + 180) % 120) - 60, cam.z + ((((oz - cam.z) % 120) + 180) % 120) - 60); }
    P.needsUpdate = true;
  };
  // --- tempête : éclairs, rafales de vent latérales annoncées par un pictogramme
  const stormTick = (g, dt) => {
    const run = g.endlessRun, rk = g.rocket; if (!run || EVO.seaLevel === undefined || g.state !== 'FLIGHT' || !rk.active) return;
    const c = (EVO.chapters || []).slice().reverse().find((q) => run.dist >= q.d), inStorm = c && (c.key === 'tempete' || c.key === 'plateforme' || c.key === 'ascension');
    if (!inStorm) { g.evoGust = null; return; }
    // éclairs : flash blanc-bleu puis grondement
    g.evoLight = g.evoLight || { next: 3 + rr(0, 3), t: 0 };
    if ((g.evoLight.next -= dt) <= 0) { g.evoLight.next = rr(5, 11); g.flash = Math.max(g.flash || 0, 0.9); g.flashColor = '#dfe8ff'; setTimeout(() => { if (g.audio) g.audio.play('rumble'); }, rr(300, 900)); }
    // rafales : toutes les 7-12 s, 1,8 s de poussée latérale précédée d'un pictogramme (flèche) de 0,9 s
    const G = g.evoGust = g.evoGust || { next: 5, t: 0, dir: 1, on: false };
    if (!G.on && (G.next -= dt) <= 0) { G.on = true; G.t = 0; G.dir = Math.random() < 0.5 ? -1 : 1; g.audio.play('whoosh'); }
    if (G.on) { G.t += dt; if (G.t > 0.9 && G.t < 2.7) { const right = _r.set(1, 0, 0).applyQuaternion(g.camera.quaternion); right.y = 0; right.normalize(); rk.vel.addScaledVector(right, G.dir * 16 * dt); g.rig.shake = Math.max(g.rig.shake, 0.25); } if (G.t > 2.9) { G.on = false; G.next = rr(7, 12); } }
  };
  const _r = new V();
  // niveau 2 : à la place de la rampe, un tube de lancement (anneaux d'acier) autour du missile, qui laisse échapper des bulles
  let tube = null;
  const padTick = (g, dt) => {
    if (!g.pad || !g.pad.group) return;
    const st2 = EVO.seaLevel !== undefined && g.evo, show = st2 && (g.state === 'MENU' || g.state === 'LAUNCH' || g.state === 'RESPAWN' || (g.state === 'FLIGHT' && g.flightTime < 1.2));
    if (st2) g.pad.group.visible = false;
    if (!tube) { tube = new T3.Group(); const m = new T3.MeshLambertMaterial({ color: '#4a5866' }), m2 = new T3.MeshLambertMaterial({ color: '#c8a028' }); for (let k = 0; k < 6; k++) { const r = new T3.Mesh(new T3.TorusGeometry(1.9, 0.09, 6, 20), k % 3 === 0 ? m2 : m); r.position.z = -1.8 - k * 1.5; tube.add(r); } for (let k = 0; k < 8; k++) { const a = k * 0.785, b = new T3.Mesh(new T3.BoxGeometry(0.07, 0.07, 8), m); b.position.set(Math.cos(a) * 1.9, Math.sin(a) * 1.9, -5.4); tube.add(b); } }
    if (tube.parent !== g.scene) g.scene.add(tube);
    tube.visible = !!show; if (!show) return;
    tube.position.copy(g.pad.origin).add(new V(0, 0.3, 1.2)); tube.rotation.set(-g.pad.pitch || 0, 0, 0);
    if (Math.random() < dt * 10 && g.effects) { const p = g.pad.origin.clone().add(new V(rr(-1, 1), rr(-0.8, 0.8), rr(-2, 2))); g.effects.sparks.emit({ pos: p, vel: new V(rr(-0.3, 0.3), rr(0.8, 2), rr(-0.3, 0.3)), life: rr(1.5, 3), s0: 0.08, s1: 0.05, s2: 0.02, cols: [new T3.Color('#e8fbff')], drag: 0.4, grav: -1.2, a: 0.8, fout: 0.5 }); }
  };
  const _fr = EVO.frame;
  EVO.frame = (g, dt) => { _fr(g, dt); snowTick(g, dt); stormTick(g, dt); padTick(g, dt); if (g.audio && g.audio.setUnder) g.audio.setUnder(EVO.seaLevel !== undefined && !g.cine3d ? U.clamp(g.uwK || 0, 0, 1) : 0); };
  // pictogramme de rafale (flèches de chaque côté de l'écran) dans le HUD
  const _hd = EVO.drawHud;
  EVO.drawHud = (hud, ctx, g, W, H, px) => {
    _hd(hud, ctx, g, W, H, px);
    const G = g.evoGust; if (G && G.on && G.t < 2.7) { const a = (G.t < 0.9 ? 0.4 + 0.4 * Math.sin(G.t * 18) : 0.9), s = Math.min(W, H) * 0.06; ctx.save(); ctx.globalAlpha = a; for (let k = 0; k < 3; k++) EVO.iconArrow(ctx, G.dir > 0 ? W * (0.08 + k * 0.05) : W * (0.92 - k * 0.05), H * 0.5, s * (1 - k * 0.15), '#d8f0ff', G.dir > 0 ? 0 : Math.PI); ctx.restore(); }
  };
})();
