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
  const SC2 = ['cote', 'bassin', 'abysses', 'surface', 'tempete', 'plateforme', 'ascension'];
  EVO.SCENE_MOOD.cote = 'day'; EVO.SCENE_AUDIO.cote = 'evoDusk'; EVO.SCENE_MOOD.bassin = 'sea'; EVO.SCENE_AUDIO.bassin = 'evoMine';
  const CH2 = { cote: 'LA COTE', bassin: 'LE BASSIN', abysses: 'LES ABYSSES', surface: 'LA FLOTTE', tempete: 'LA TEMPETE', plateforme: 'LA PLATEFORME', ascension: 'L INTERCEPTION' };
  EVO.levelDef2 = (g) => {
    const th = CC.LM.THEMES[0], q = /[?&]evoscenes=([\w,]+)/.exec(location.search), sc = q ? q[1].split(',') : (EVO.SCENES2 || SC2), Zs = CC.Zones.defs.ocean.scenes;
    let len = 80; EVO.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { EVO.chapters.push({ d: len - 80, i: EVO.chapters.length, name: CH2[n] || n.toUpperCase(), key: n }); if (s.sub) for (const w of s.sub) if (w.u > 0) EVO.chapters.push({ d: len - 80 + w.u * s.len[0], i: EVO.chapters.length, name: w.name, key: w.key }); len += s.len[0]; } }
    return EVO.baseDef({ zone: 'ocean', seed: 6161, len: q ? len + 400 : len, scenes: sc, order: new Array(90).fill('ocean'), theme: th });
  };
  const _br = EVO.beginRun;
  EVO.beginRun = (g) => { _br(g); EVO.seaLevel = EVO.stage(g) === 2 ? 0 : undefined; g.evoGust = null; g.evoLight = null; };
  // --- sous l'eau : couleur de l'eau qui s'assombrit avec la profondeur, eau claire (on voit loin), lumière qui descend
  const UW_TOP = C3('#1496e2'), UW_DEEP = C3('#07518d'), UW_HOR = C3('#16b9f0'), UW_FAR = C3('#176da8'), _c = new T3.Color();   // v190 : turquoise lumineux pres, bleu profond au loin
  const _am = EVO.applyMood;
  EVO.applyMood = (g, m) => {
    _am(g, m);
    if (EVO.seaLevel === undefined || !g.uwK || g.uwK < 0.01) { if (EVO.seaLevel !== undefined) g.fogBase = null; return; }
    const k = g.uwK, rk = g.rocket, depth = U.clamp(-(rk && rk.active ? rk.pos.y : -20) / 110, 0, 1), f = g.scene.fog, u = g.skyMat.uniforms;
    _c.copy(UW_TOP).lerp(UW_DEEP, depth * 0.85);
    _c.lerp(UW_FAR, 0.3); f.color.lerp(_c, k); _c.copy(UW_TOP).lerp(UW_DEEP, depth * 0.85); f.near = U.lerp(f.near, 8, k); f.far = U.lerp(f.far, 380 - 190 * depth, k); g.renderer.setClearColor(f.color); g.fogBase = null;
    u.cloud.value *= (1 - k); u.top.value.lerp(_c, k); u.horizon.value.lerp(_c, k); u.bottom.value.lerp(UW_DEEP, k * 0.7);
    g.hemi.color.lerp(C3('#cfe6ff'), k); g.hemi.groundColor.lerp(C3('#2a6f94'), k); g.hemi.intensity = U.lerp(g.hemi.intensity, 0.8 - 0.3 * depth, k); g.ambient.intensity = U.lerp(g.ambient.intensity, 0.24, k);
    g.sun.intensity = U.lerp(g.sun.intensity, 0.95 * (1 - 0.7 * depth), k); g.sun.color.lerp(C3('#e8fbff'), k);
    if (g.postParams) { g.postParams.tint = '#' + C3('#ffffff').lerp(C3('#dcefff'), k).getHexString(); g.postParams.bloomStrength = Math.max(g.postParams.bloomStrength, 0.05 * k); g.postParams.saturation = U.lerp(g.postParams.saturation === undefined ? 1 : g.postParams.saturation, 1.03, k); g.postParams.contrast = U.lerp(g.postParams.contrast === undefined ? 1 : g.postParams.contrast, 1.04, k); }
    g.nightK = U.lerp(g.nightK || 0, 0.35 * depth, k);
  };
  const dotTex = () => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g2 = x.createRadialGradient(16, 16, 0, 16, 16, 16); g2.addColorStop(0, 'rgba(255,255,255,1)'); g2.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.fillRect(0, 0, 32, 32); return new T3.CanvasTexture(c); };
  // --- neige marine : des particules qui défilent autour de la caméra quand on est sous l'eau (donnent le sens de la vitesse)
  let snow = null;
  const snowTick = (g, dt) => {
    if (EVO.seaLevel === undefined || !g.scene) { if (snow) snow.visible = false; return; }
    if (!snow) { const N = 260, p = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) p[i] = rr(-60, 60); const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(p, 3)); snow = new T3.Points(geo, new T3.PointsMaterial({ color: '#d8efff', size: 0.3, map: dotTex(), alphaTest: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.4, depthWrite: false, fog: false })); snow.frustumCulled = false; snow.userData.o = p.slice(); g.scene.add(snow); }
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
  // v150 : une mer qui s'etend jusqu'a l'horizon (la bande d'eau du niveau ne depasse pas 140 m de chaque cote : on en voyait les bords de haut)
  let sea = null, seaFog = '';
  const SEA_R = [0, 150, 400, 1200, 4000, 20000], SEA_K = [0, 0, 0.22, 0.55, 0.85, 1], SEA_N = 28, NEAR = new T3.Color('#4f95b6');
  const seaTick = (g) => {
    if (!sea) {
      const geo = new T3.BufferGeometry(), pos = [], col = [], idx = [];
      for (let r = 0; r < SEA_R.length; r++) for (let k = 0; k < SEA_N; k++) { const a = k / SEA_N * 6.2832; pos.push(Math.cos(a) * SEA_R[r], 0, Math.sin(a) * SEA_R[r]); col.push(1, 1, 1); }
      for (let r = 0; r < SEA_R.length - 1; r++) for (let k = 0; k < SEA_N; k++) { const a = r * SEA_N + k, b = r * SEA_N + (k + 1) % SEA_N, c = (r + 1) * SEA_N + k, d = (r + 1) * SEA_N + (k + 1) % SEA_N; idx.push(a, c, b, b, c, d); }
      geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
      sea = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false })); sea.renderOrder = -5; sea.frustumCulled = false;
    }
    const st2 = EVO.seaLevel !== undefined && g.evo && !g.cine3d && g.rocket && (g.uwK || 0) < 0.5;
    if (sea.parent !== g.scene) g.scene.add(sea);
    sea.visible = !!st2; if (!st2) return;
    sea.position.set(g.rocket.pos.x, EVO.seaLevel - 1.2, g.rocket.pos.z);
    const fc = g.scene.fog ? g.scene.fog.color : null, hx = fc ? fc.getHexString() : '';
    if (hx !== seaFog) { seaFog = hx; const a = sea.geometry.attributes.color, c = new T3.Color(); for (let r = 0; r < SEA_R.length; r++) { c.copy(NEAR); if (fc) c.lerp(fc, SEA_K[r]); for (let k = 0; k < SEA_N; k++) a.setXYZ(r * SEA_N + k, c.r, c.g, c.b); } a.needsUpdate = true; }
  };
  let tube = null;
  const padTick = (g, dt) => {
    if (!g.pad || !g.pad.group) return;
    if (tube) tube.visible = false; return;   // v241 : plus de tube a anneaux : la fusee part de la rampe du hangar
    const st2 = EVO.seaLevel !== undefined && g.evo, menu = g.state === 'MENU' && !g.evoAim, show = st2 && !menu && (g.state === 'LAUNCH' || g.state === 'RESPAWN' || g.state === 'MENU' || (g.state === 'FLIGHT' && g.flightTime < 1.2));
    if (st2) g.pad.group.visible = menu;   // v239 : au menu du niveau 2, le dock naval (hangar) est visible ; le tube a anneaux ne sert qu'au lancement
    if (!tube) { tube = new T3.Group(); const m = new T3.MeshLambertMaterial({ color: '#4a5866' }), m2 = new T3.MeshLambertMaterial({ color: '#c8a028' }); for (let k = 0; k < 6; k++) { const r = new T3.Mesh(new T3.TorusGeometry(1.9, 0.09, 6, 20), k % 3 === 0 ? m2 : m); r.position.z = -1.8 - k * 1.5; tube.add(r); } for (let k = 0; k < 8; k++) { const a = k * 0.785, b = new T3.Mesh(new T3.BoxGeometry(0.07, 0.07, 8), m); b.position.set(Math.cos(a) * 1.9, Math.sin(a) * 1.9, -5.4); tube.add(b); } }
    if (tube.parent !== g.scene) g.scene.add(tube);
    tube.visible = !!show; if (!show) return;
    tube.position.copy(g.pad.origin).add(new V(0, 0.3, 1.2)); tube.rotation.set(-g.pad.pitch || 0, 0, 0);
    if (Math.random() < dt * 10 && g.effects) { const p = g.pad.origin.clone().add(new V(rr(-1, 1), rr(-0.8, 0.8), rr(-2, 2))); g.effects.sparks.emit({ pos: p, vel: new V(rr(-0.3, 0.3), rr(0.8, 2), rr(-0.3, 0.3)), life: rr(1.5, 3), s0: 0.08, s1: 0.05, s2: 0.02, cols: [new T3.Color('#e8fbff')], drag: 0.4, grav: -1.2, a: 0.8, fout: 0.5 }); }
  };
  // ---------- v190 : rayons de lumiere, caustiques, halo de tuyere ----------
  CC.UWT = { value: 0 };   // temps partage des caustiques
  // v192 : CAUSTIQUES : reseau de lignes lumineuses fines = bords d'un diagramme de Voronoi (F2 - F1) dont les points glissent et dont le domaine est deforme par deux ondulations
  // de vitesses differentes ; deux echelles (la fine seulement de pres) ; couleur #D9F8E9 / #B5F0E9, faible, additive, estompee avec la distance et la profondeur. Integre au materiau du sable.
  CC.Caustics = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uT = CC.UWT;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', 'varying vec3 vWP;\n#include <common>').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', 'varying vec3 vWP; uniform float uT;\n' + VOR + '\n#include <common>').replace('#include <fog_fragment>', CAUS + '\n#include <fog_fragment>');
    };
  };
  const VOR = [
    'vec2 cH( vec2 p ) { p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) ); return fract( sin( p ) * 43758.5453 ); }',
    'float cV( vec2 p, float t ) { vec2 i = floor( p ), f = fract( p ); float d1 = 8.0, d2 = 8.0;',
    '  for ( int y = -1; y <= 1; y++ ) for ( int x = -1; x <= 1; x++ ) { vec2 g = vec2( float( x ), float( y ) ), o = cH( i + g ); o = 0.5 + 0.38 * sin( t + 6.2831 * o ); float d = length( g + o - f ); if ( d < d1 ) { d2 = d1; d1 = d; } else if ( d < d2 ) d2 = d; }',
    '  return d2 - d1; }'].join(String.fromCharCode(10));
  const CAUS = [
    '{ float dc = length( vViewPosition ), fd = 1.0 - smoothstep( 22.0, 95.0, dc ), fy = 0.55 + 0.45 * smoothstep( -125.0, -60.0, vWP.y );',
    '  if ( fd > 0.01 ) { vec2 q = vWP.xz * 0.19; q += 0.45 * vec2( sin( q.y * 1.3 + uT * 0.55 ), sin( q.x * 1.1 - uT * 0.43 ) ) + 0.22 * vec2( sin( q.y * 2.9 - uT * 0.9 ), sin( q.x * 2.6 + uT * 0.8 ) );',
    '    float e1 = cV( q, uT * 0.32 ), l = 1.0 - smoothstep( 0.0, 0.11, e1 ), l2 = 0.0;',
    '    if ( dc < 55.0 ) { l2 = 1.0 - smoothstep( 0.0, 0.14, cV( q * 1.9 + 3.7, uT * 0.4 + 1.0 ) ); }',
    '    float k = ( l * 0.8 + l2 * 0.3 * ( 1.0 - smoothstep( 25.0, 55.0, dc ) ) ) * 0.2 * fd * fy;',
    '    gl_FragColor.rgb += mix( vec3( 0.851, 0.973, 0.914 ), vec3( 0.710, 0.941, 0.914 ), l2 ) * k; } }'].join(String.fromCharCode(10));
  let rayTex = null, radTex = null;
  const mkTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return new T3.CanvasTexture(c); };
  // v190 : les 10 rayons forment UN SEUL mesh (1 appel de dessin) dont les sommets sont replaces chaque image (quads face a la camera, legerement inclines, couleur = intensite)
  let rays = null;
  const RN = 7, RU = [];
  const raysTick = (g) => {
    if (EVO.seaLevel === undefined || !g.scene) { if (rays) rays.visible = false; return; }
    const cam = g.camera.position, uw = (g.uwK || 0) > 0.3 && cam.y < EVO.seaLevel - 1 && !g.cine3d;
    if (!rays) {
      rayTex = mkTex(64, 256, (x, w, h) => { const gv = x.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(255,255,255,1)'); gv.addColorStop(0.4, 'rgba(255,255,255,0.5)'); gv.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gv; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const gh = x.createLinearGradient(0, 0, w, 0); gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(0.5, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gh; x.fillRect(0, 0, w, h); });
      const geo = new T3.BufferGeometry(), uv = [], idx = [];
      for (let i = 0; i < RN; i++) { RU.push({ ox: rr(-80, 80), oz: rr(-80, 80), w: rr(14, 30), ph: rr(0, 6.28), k: rr(0.7, 1.2) }); uv.push(0, 1, 1, 1, 0, 0, 1, 0); const b = i * 4; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(RN * 12), 3)); geo.setAttribute('color', new T3.BufferAttribute(new Float32Array(RN * 12), 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      rays = new T3.Mesh(geo, new T3.MeshBasicMaterial({ map: rayTex, vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false, side: T3.DoubleSide })); rays.renderOrder = -3; rays.frustumCulled = false;
    }
    if (rays.parent !== g.scene) g.scene.add(rays);
    rays.visible = uw; if (!uw) return;
    const rk = g.rocket, depth = U.clamp(-(rk && rk.active ? rk.pos.y : -20) / 110, 0, 1), t = EVO.clock, P = rays.geometry.attributes.position, C = rays.geometry.attributes.color, y0 = EVO.seaLevel, hh = 75;
    for (let i = 0; i < RN; i++) {
      const u = RU[i], wx = ((((u.ox - cam.x) % 160) + 240) % 160) - 80, wz = ((((u.oz - cam.z) % 160) + 240) % 160) - 80, cx = cam.x + wx, cz = cam.z + wz;
      const yaw = Math.atan2(cam.x - cx, cam.z - cz), rx = Math.cos(yaw), rz = -Math.sin(yaw), hw = u.w * (1 + 0.15 * Math.sin(t * 0.3 + u.ph)) / 2, sh = 12;
      const edge = Math.min(1, (80 - Math.max(Math.abs(wx), Math.abs(wz))) / 25), near = Math.min(1, Math.hypot(wx, wz) / 14), a = 0.028 * u.k * (0.7 + 0.3 * Math.sin(t * 0.5 + u.ph * 2)) * edge * near * (1 - 0.6 * depth);
      const k = i * 12;   // haut gauche, haut droit, bas gauche, bas droit
      P.array[k] = cx + rx * (sh - hw); P.array[k + 1] = y0; P.array[k + 2] = cz + rz * (sh - hw);
      P.array[k + 3] = cx + rx * (sh + hw); P.array[k + 4] = y0; P.array[k + 5] = cz + rz * (sh + hw);
      P.array[k + 6] = cx + rx * (-sh - hw); P.array[k + 7] = y0 - 2 * hh; P.array[k + 8] = cz + rz * (-sh - hw);
      P.array[k + 9] = cx + rx * (-sh + hw); P.array[k + 10] = y0 - 2 * hh; P.array[k + 11] = cz + rz * (-sh + hw);
      for (let q = 0; q < 4; q++) { C.array[k + q * 3] = 0.75 * a; C.array[k + q * 3 + 1] = 0.96 * a; C.array[k + q * 3 + 2] = a; }
    }
    P.needsUpdate = true; C.needsUpdate = true;
  };
  const haloTick = (g) => {
    const rk = g.rocket; if (!rk || !rk.mesh || EVO.seaLevel === undefined) return;
    const J = rk.mesh.userData.jet; if (!J) return;
    if (!J.halo) { if (!radTex) radTex = mkTex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,240,180,0.55)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
      J.halo = new T3.Sprite(new T3.SpriteMaterial({ map: radTex, color: '#fff0b8', blending: T3.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0 })); J.halo.position.set(0, 0, 0.05); J.group.add(J.halo); }
    const k = rk.thrustK || 0, f = rk.flick === undefined ? 0.5 : rk.flick;
    J.halo.material.opacity = 0.2 * k * (0.8 + 0.4 * f); J.halo.scale.setScalar(0.6 + 0.5 * k * (0.9 + 0.2 * f));
  };
  const _fr = EVO.frame;
  EVO.frame = (g, dt) => { _fr(g, dt); CC.UWT.value = EVO.clock || 0; snowTick(g, dt); stormTick(g, dt); padTick(g, dt); seaTick(g); raysTick(g); haloTick(g); if (g.audio && g.audio.setUnder) g.audio.setUnder(EVO.seaLevel !== undefined && !g.cine3d ? U.clamp(g.uwK || 0, 0, 1) : (g._uw1 || 0)); };
  // pictogramme de rafale (flèches de chaque côté de l'écran) dans le HUD
  const _hd = EVO.drawHud;
  EVO.drawHud = (hud, ctx, g, W, H, px) => {
    _hd(hud, ctx, g, W, H, px);
    const G = g.evoGust; if (G && G.on && G.t < 2.7) { const a = (G.t < 0.9 ? 0.4 + 0.4 * Math.sin(G.t * 18) : 0.9), s = Math.min(W, H) * 0.06; ctx.save(); ctx.globalAlpha = a; for (let k = 0; k < 3; k++) EVO.iconArrow(ctx, G.dir > 0 ? W * (0.08 + k * 0.05) : W * (0.92 - k * 0.05), H * 0.5, s * (1 - k * 0.15), '#d8f0ff', G.dir > 0 ? 0 : Math.PI); ctx.restore(); }
  };
})();
