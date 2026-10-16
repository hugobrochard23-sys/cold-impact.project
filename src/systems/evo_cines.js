/* v142 : LES TROIS CINEMATIQUES — intro1 (la mission : citadelle, réacteur, parcours, lancement), win1 (la citadelle s'effondre au lever du soleil),
 * intro2 (la nouvelle mission : une plateforme ennemie lance un missile balistique ; on plonge, on rejoint le sous-marin, le missile est éjecté). Sans un mot. */
(function () {
  const U = CC.U, EVO = CC.EVO, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO._cineLib) return;
  const { rail, Parts, lam, emi, box, cyl, rr, clamp, sm, mix } = EVO._cineLib;
  const once = () => { const d = {}; return (k, c, f) => { if (c && !d[k]) { d[k] = 1; f(); } }; };
  const tierNow = (g) => EVO.rocket(EVO.save(g).rk).tier;
  const lightRig = (C, sky, ground, sun, si, amb) => { C.scene.add(new T3.HemisphereLight(sky, ground, amb === undefined ? 0.8 : amb)); const d = new T3.DirectionalLight(sun, si === undefined ? 0.9 : si); d.position.set(60, 100, 80); C.scene.add(d); return d; };
  const rubble = (scene, n, spread, cols, z0) => { for (let i = 0; i < n; i++) { const s = rr(1, 7), m = new T3.Mesh(new T3.BoxGeometry(s * rr(0.8, 2), s * rr(0.5, 1), s * rr(0.8, 2)), lam(cols[i % cols.length])); m.position.set(rr(-spread, spread), s * 0.3, (z0 || 0) + rr(-spread, spread)); m.rotation.y = rr(0, 3); scene.add(m); } };

  // ============================================================== INTRO 1
  EVO.CINES.intro1 = { build(C) {
    const S = C.scene, once1 = once();
    const dawn = { top: '#3a5a9a', hor: '#ffb070', bot: '#7a5040', sun: '#ffe0a8', dir: [0.12, 0.1, -1], size: 900 };
    C.sky(dawn); S.fog = new T3.Fog('#d6a07c', 260, 2400);
    const sun = lightRig(C, '#ffd8b0', '#403830', '#ffc890', 0.9, 0.7);
    // --- plan A : la citadelle et son gardien
    const A = new T3.Group(); S.add(A); const gr = new T3.Mesh(new T3.PlaneGeometry(6000, 6000), lam('#443a30')); gr.rotation.x = -Math.PI / 2; A.add(gr);
    const cit = EVO.cineCitadel(); cit.position.set(0, 0, -260); A.add(cit);
    const rob = EVO.buildRobot ? EVO.buildRobot() : null; let G = null; if (rob) { G = rob.G; G.position.set(0, 0, -110); G.scale.setScalar(1); A.add(G); G.traverse((o) => { if (o.isMesh && o.material) { o.material.fog = true; } }); }
    EVO._cineLib.mountains(A, '#2a3050', 1700, 14, 220, 0);
    rubble(A, 90, 500, ['#3a3430', '#2e2a28', '#443c34'], -50);
    const roadM = new T3.Mesh(new T3.PlaneGeometry(40, 2400), lam('#2c2c2e')); roadM.rotation.x = -Math.PI / 2; roadM.position.set(0, 0.2, 600); A.add(roadM);
    const fires = []; for (let i = 0; i < 16; i++) fires.push(new V(rr(-260, 260), 1, rr(-60, 360)));
    // --- plan B : le hall du réacteur (très loin sur l'axe x)
    const B = new T3.Group(); B.position.set(5000, 0, 0); S.add(B);
    const floor = new T3.Mesh(new T3.PlaneGeometry(700, 700), lam('#1c2228')); floor.rotation.x = -Math.PI / 2; B.add(floor);
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; cyl(B, 6, 7, 150, lam('#2a3038'), Math.cos(a) * 130, 75, Math.sin(a) * 130, 10); box(B, 2, 100, 3, emi('#46a8ff'), Math.cos(a) * 123, 60, Math.sin(a) * 123); }
    for (let r = 1; r <= 5; r++) { const t = new T3.Mesh(new T3.TorusGeometry(r * 18, 0.5, 6, 60), emi('#46e0ff')); t.rotation.x = Math.PI / 2; t.position.y = 0.4; B.add(t); }
    const react = CC.BossModels && CC.BossModels.reactor ? CC.BossModels.reactor() : new T3.Group(); react.scale.setScalar(2.2); B.add(react);
    const bl = new T3.PointLight('#46e0ff', 3, 420); bl.position.set(0, 30, 0); B.add(bl);
    const hall = new T3.AmbientLight('#203040', 0.0); B.add(hall);
    // --- plan C : la carte du parcours (très loin sur -x)
    const M = new T3.Group(); M.position.set(-5000, 0, 0); S.add(M);
    const board = new T3.Mesh(new T3.BoxGeometry(900, 6, 420), lam('#4f7a46')); board.position.y = -3; M.add(board);
    for (let i = 0; i < 60; i++) { const w = rr(30, 90), m = new T3.Mesh(new T3.BoxGeometry(w, 2, rr(20, 60)), lam(['#6a9a52', '#7aa85a', '#5f8a4c', '#a8a060'][i % 4])); m.position.set(rr(-420, 420), 0.2, rr(-190, 190)); M.add(m); }
    const route = [[-380, 150], [-300, 60], [-210, 100], [-110, 20], [-20, -50], [90, 10], [170, -70], [250, -10], [330, -100]], stations = [];
    const mk = (fn, x, z) => { const g = new T3.Group(); g.position.set(x, 0, z); fn(g); g.scale.setScalar(0.001); M.add(g); stations.push(g); };
    mk((g) => { box(g, 36, 16, 26, lam('#b87a60'), 0, 8, 0); box(g, 38, 3, 28, lam('#6a4a3c'), 0, 17, 0); }, route[1][0], route[1][1]);
    mk((g) => { const w = new T3.Mesh(new T3.CylinderGeometry(38, 38, 2, 24), lam('#3a8ac8')); w.position.y = 1; g.add(w); }, route[2][0], route[2][1]);
    mk((g) => { for (let k = 0; k < 7; k++) cyl(g, 0, 7, 22, lam('#2a6a34'), rr(-24, 24), 11, rr(-24, 24), 6); }, route[3][0], route[3][1]);
    mk((g) => { cyl(g, 34, 26, 12, lam('#4a3a30'), 0, 2, 0, 18); cyl(g, 22, 18, 8, lam('#c8a028'), 0, 6, 0, 18); }, route[4][0], route[4][1]);
    mk((g) => { for (let k = 0; k < 9; k++) box(g, rr(10, 18), rr(20, 60), rr(10, 18), lam('#6a7088'), rr(-34, 34), 20, rr(-26, 26)); }, route[5][0], route[5][1]);
    mk((g) => { box(g, 90, 36, 14, lam('#2a2e34'), 0, 18, 0); for (const s of [-1, 1]) box(g, 14, 70, 14, lam('#1e2228'), s * 40, 35, 0); box(g, 10, 16, 2, emi('#ff8a3a'), 0, 18, 8); }, route[8][0], route[8][1]);
    const dots = []; for (let i = 0; i < 90; i++) { const u = i / 89, seg = Math.min(route.length - 2, Math.floor(u * (route.length - 1))), f = u * (route.length - 1) - seg, a = route[seg], b = route[seg + 1], d = new T3.Mesh(new T3.SphereGeometry(3.2, 8, 6), emi('#ffd23a')); d.position.set(mix(a[0], b[0], f), 4, mix(a[1], b[1], f)); d.visible = false; M.add(d); dots.push(d); }
    const mm = EVO.cineMissile(tierNow(C.g)); mm.scale.setScalar(14); M.add(mm);
    // --- plan D : la rampe de lancement (très loin sur +x)
    const P = new T3.Group(); P.position.set(0, 0, 4000); S.add(P);
    const pg = new T3.Mesh(new T3.PlaneGeometry(6000, 6000), lam('#58704a')); pg.rotation.x = -Math.PI / 2; P.add(pg);
    box(P, 14, 1.4, 60, lam('#6a5a48'), 0, 0.7, -10); for (const sx of [-1, 1]) box(P, 0.5, 0.6, 60, lam('#9a9a96'), sx * 2.4, 1.6, -10);
    for (let k = 0; k < 14; k++) box(P, 12, 0.3, 1, lam('#4a3a28'), 0, 1.5, -36 + k * 4.4);
    const mis = EVO.cineMissile(tierNow(C.g)); mis.scale.setScalar(2.2); mis.position.set(0, 3.2, 0); P.add(mis);
    rubble(P, 40, 260, ['#7a7870', '#6a6860'], -80);
    for (let i = 0; i < 24; i++) { const t = new T3.Mesh(new T3.ConeGeometry(rr(4, 8), rr(14, 28), 7), lam('#2f6a36')); t.position.set(rr(-260, 260), 8, rr(-260, 60)); P.add(t); }
    { const f = new T3.PointLight('#ffe8d0', 1.6, 900); f.position.set(30, 90, 240); S.add(f); const f2 = new T3.PointLight('#ffd0a0', 1.2, 500); f2.position.set(0, 40, 3990 + 14); S.add(f2); }
    const keysA = [{ t: 0, p: [70, 14, 560], l: [0, 78, -80], f: 40 }, { t: 3.2, p: [30, 22, 330], l: [0, 80, -90], f: 44 }, { t: 6.6, p: [-18, 36, 150], l: [0, 92, -110], f: 52 }, { t: 7.6, p: [-18, 38, 130], l: [0, 94, -110], f: 52 }];
    const camA = rail(keysA), kB = rail([{ t: 0, p: [5000 + 120, 24, 120], l: [5000, 24, 0], f: 52 }, { t: 2.5, p: [5000 + 20, 34, 100], l: [5000, 26, 0], f: 50 }, { t: 5.2, p: [5000 - 90, 40, 70], l: [5000, 26, 0], f: 48 }]);
    const kC = rail([{ t: 0, p: [-5000 - 380, 120, 300], l: [-5000 - 250, 0, 60], f: 46 }, { t: 3, p: [-5000 - 150, 150, 190], l: [-5000 - 60, 0, 20], f: 46 }, { t: 6.2, p: [-5000 + 210, 130, 120], l: [-5000 + 290, 0, -50], f: 46 }]);
    const kD = rail([{ t: 0, p: [1.4, 5.2, 4000 + 11], l: [0, 3.4, 3990], f: 56 }, { t: 3.6, p: [0.8, 4.4, 4000 + 8], l: [0, 3.4, 3990], f: 52 }, { t: 7.4, p: [0.3, 3.9, 4000 + 6], l: [0, 3.4, 3990], f: 48 }]);
    const tA = 7.6, tB = 7.6 + 5.2, tC = tB + 6.2, tD = tC + 7.6, DUR = tD + 0.01;
    return { dur: 25.6, music: 'evoDusk', bloom: 0.25, fadeTo: 'white',
      cam(t, p, l) { if (t < tA) { const f = camA(t, p, l); if (t > 5.4) { const k = sm(5.4, 7, t); p.x += Math.sin(t * 40) * 0.25 * k; } return f; } if (t < tB) return kB(t - tA, p, l); if (t < tC) return kC(t - tB, p, l); const f = kD(t - tC, p, l); if (t > tD - 1.4) { const k = sm(tD - 1.4, tD, t); p.x += Math.sin(t * 55) * 0.18 * k; p.y += Math.cos(t * 47) * 0.12 * k; } return f; },
      update(t, dt, c) {
        const g = c.C.g, up = once1;
        if (G) { EVO.cineRobotPose(G, t, t * 1.1); const sw = Math.floor((t * 0.62 - Math.PI / 2) / Math.PI); if (sw !== c._sw) { c._sw = sw; if (t < tA && t > 0.3) { g.audio.play('robotStep'); c.parts.add({ p: new V(rr(-20, 20), 2, -90), v: new V(0, 3, 6), life: 2.5, s0: 18, s1: 60, color: '#b49c84', op: 0.5, rise: 1 }); } } G.userData.head.rotation.y = Math.sin(t * 0.6) * 0.5 * (1 - sm(4.2, 5.6, t)) + 0 * sm(4.2, 5.6, t); }
        up('roar', t > 5.0, () => { g.audio.play('robotRoar'); g.audio.play('robotAlarm'); });
        for (const f of fires) if (Math.random() < dt * 3) c.parts.fire(f.clone(), 2.2);
        if (t > tA && t < tB) { react.rotation.y = t; const k = t - tA; up('hum', true, () => g.audio.play('reactorHum')); c.parts.add({ p: new V(5000 + rr(-60, 60), rr(2, 50), rr(-60, 60)), v: new V(0, rr(2, 7), 0), life: 2.2, s0: 1.2, s1: 0.2, color: '#9fe8ff', add: true, op: 0.8, fog: false }); bl.intensity = 3 + Math.sin(t * 4) * 0.8; if (react.userData.spin) { const [r1, r2, s, h] = react.userData.spin; r1.rotation.z = t; r2.rotation.y = t * 1.4; h.scale.setScalar(1.1 + 0.15 * Math.sin(t * 3)); } }
        if (t >= tB && t < tC) { const k = clamp((t - tB) / 5.4, 0, 1); dots.forEach((d, i) => { d.visible = i / 89 <= k; }); stations.forEach((s, i) => { const at = [0.18, 0.3, 0.45, 0.6, 0.78, 1][i]; s.scale.setScalar(sm(at - 0.05, at + 0.06, k)); }); const u = k * (route.length - 1), seg = Math.min(route.length - 2, Math.floor(u)), f = u - seg, a = route[seg], b = route[seg + 1]; mm.position.set(-5000 + mix(a[0], b[0], f), 22, mix(a[1], b[1], f)); mm.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); mm.rotation.x = 0; }
        if (t >= tC) { const k = t - tC, ig = Math.max(0, k - 5.4); if (ig > 0) { mis.userData.flame.visible = true; mis.userData.flame.scale.set(1, 1 + Math.random() * 0.4, 1); c.parts.add({ p: new V(0, 3.2, 4000 - 1.6), v: new V(rr(-1, 1), rr(-0.5, 1.5), rr(-3, -1)), life: 1.6, s0: 1.4, s1: 6, color: '#c8c0b4', op: 0.5, rise: 0.5 }); if (ig < 0.06) g.audio.play('padIgnite'); } for (const [n, tt] of [[3, 1.4], [2, 2.6], [1, 3.8]]) up('c' + n, k > tt, () => g.audio.play('beepLow')); }
        const up2 = once1; up2('ign', t > tD - 1.9, () => { g.audio.play('padIgnite'); });
        if (t > tD - 1.9 && !c._ig) { c._ig = 1; }
        if (t > tD - 1.9) { mis.userData.flame.visible = true; mis.userData.flame.scale.set(1, 1 + Math.random() * 0.5, 1); mis.position.z -= (t - (tD - 1.9)) * dt * 4; c.parts.add({ p: new V(rr(-0.4, 0.4), 3.2, mis.position.z + 4000 + 2), v: new V(rr(-2, 2), rr(0, 2), rr(2, 10)), life: 1.4, s0: 1.6, s1: 7, color: '#d0c8bc', op: 0.55, rise: 0.8 }); }
        up('sw1', t > 0.2, () => g.audio.play('radio'));
      },
      draw(ctx, W, H, t) {
        const u = Math.min(W, H);
        if (t > tA && t < tB) { const k = (t - tA) / 5.2, a = sm(0.1, 0.3, k) * (1 - sm(0.85, 1, k)); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ff5a3a'; ctx.lineWidth = Math.max(3, u * 0.008); const r = u * 0.2 * (1.5 - 0.5 * sm(0.1, 0.5, k)); ctx.beginPath(); ctx.arc(W / 2, H * 0.47, r, t * 2, t * 2 + 4.6); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H * 0.47, r * 0.62, -t * 2, -t * 2 + 3.4); ctx.stroke(); EVO.iconReactor(ctx, W / 2, H * 0.14, u * 0.07, '#46e0ff'); ctx.restore(); }
        if (t >= tB && t < tC) { const k = (t - tB) / 6.2, a = sm(0, 0.08, k) * (1 - sm(0.92, 1, k)), s = u * 0.045; ctx.save(); ctx.globalAlpha = a; const y = H * 0.9, xs = [0.18, 0.34, 0.5, 0.66, 0.82]; EVO.iconMissile(ctx, W * xs[0], y, s, '#ffffff'); EVO.iconRobot(ctx, W * xs[2], y + s * 0.6, s * 0.9, '#ff9a6a'); EVO.iconReactor(ctx, W * xs[4], y, s, '#46e0ff'); EVO.iconArrow(ctx, W * 0.26, y, s * 0.5, 'rgba(255,255,255,0.8)', 0); EVO.iconArrow(ctx, W * 0.42, y, s * 0.5, 'rgba(255,255,255,0.8)', 0); EVO.iconArrow(ctx, W * 0.58, y, s * 0.5, 'rgba(255,255,255,0.8)', 0); EVO.iconArrow(ctx, W * 0.74, y, s * 0.5, 'rgba(255,255,255,0.8)', 0); ctx.restore(); }
        if (t >= tC) { const k = t - tC, F = CC.Font; for (const [i, n] of [[1.4, '3'], [2.6, '2'], [3.8, '1']]) { const d = k - i; if (d >= 0 && d < 1.1) { const sz = EVO._fitDigit ? 1 : u * 0.03 * (1.4 - d * 0.3); ctx.save(); ctx.globalAlpha = 1 - d / 1.1; F.draw(ctx, n, W / 2, H * 0.3 - sz * 3.5, sz, '#ffffff', { align: 'center' }); ctx.restore(); } } }
      } };
  } };

  // ============================================================== WIN 1
  EVO.CINES.win1 = { build(C) {
    const S = C.scene, up = once();
    C.sky({ top: '#3a62a8', hor: '#ffb878', bot: '#8a5a48', sun: '#fff0c0', dir: [0.15, 0.08, -1], size: 300 }); S.fog = new T3.Fog('#e0a888', 500, 3500);
    lightRig(C, '#ffe0c0', '#483c34', '#ffd0a0', 1.0, 0.85); { const f = new T3.PointLight('#ffd8b0', 1.6, 1200); f.position.set(0, 120, 320); S.add(f); }
    const gr = new T3.Mesh(new T3.PlaneGeometry(8000, 8000), lam('#4a4a34')); gr.rotation.x = -Math.PI / 2; S.add(gr);
    EVO._cineLib.mountains(S, '#303a60', 2400, 16, 260, 0);
    const cit = EVO.cineCitadel(); cit.position.set(0, 0, -260); S.add(cit);
    const rob = EVO.buildRobot ? EVO.buildRobot() : null, G = rob && rob.G; if (G) { G.position.set(0, 0, -110); S.add(G); G.traverse((o) => { if (o.isMesh && o.material) o.material.fog = true; }); }
    rubble(S, 80, 600, ['#3a3430', '#2e2a28'], -60);
    const mis = EVO.cineMissile(tierNow(C.g)); mis.scale.setScalar(26); mis.userData.flame.visible = true; S.add(mis);
    const towers = []; cit.children.forEach((o) => { if (o.geometry && o.geometry.parameters && o.geometry.parameters.height > 200) towers.push(o); });
    const cam1 = rail([{ t: 0, p: [10, 14, 210], l: [0, 34, -260], f: 62 }, { t: 2.0, p: [8, 16, 206], l: [0, 34, -260], f: 62 }, { t: 4.2, p: [0, 22, 150], l: [0, 60, -40], f: 56 }, { t: 7.5, p: [220, 110, 220], l: [0, 70, -150], f: 48 }, { t: 12.5, p: [320, 150, 360], l: [0, 80, -200], f: 46 }, { t: 18.5, p: [200, 300, 520], l: [0, 70, -230], f: 48 }]);
    const R = { n: 0, last: 0 };
    return { dur: 21, music: 'evoDawn', bloom: 0.35, fadeTo: 'white',
      cam(t, p, l) { const f = cam1(t, p, l); if (t < 4.4) { p.x += Math.sin(t * 38) * 0.4 * (t > 2 ? 1 : 0.3); p.y += Math.cos(t * 31) * 0.3; } return f; },
      update(t, dt, c) {
        const g = c.C.g;
        // 0-2 : le portail est enfoncé par une boule de feu ; la fusée en sort
        up('b0', t > 0.5, () => { g.audio.play('reactorHit'); g.audio.play('rumble'); c.parts.explosion(new V(0, 34, -238), (3.4) * 4.5); for (let i = 0; i < 4; i++) c.parts.explosion(new V(rr(-60, (60) * 4.5), rr(10, 70), -236), 2); });
        if (t > 0.5 && t < 4.8) { const k = (t - 0.8) / 3.4; mis.visible = k >= 0 && k < 1.1; const zz = mix(-230, 240, clamp(k, 0, 1.2) ** 1.4); mis.position.set(Math.sin(k * 2) * 4 * (1 - k), mix(26, 22 + 30 * k * k, clamp(k, 0, 1)), zz); mis.rotation.y = Math.PI; mis.rotation.x = -0.05 - 0.4 * k * k; mis.userData.flame.scale.set(1.5, 2 + Math.random(), 1.5); c.parts.add({ p: mis.position.clone(), v: new V(rr(-3, 3), rr(-2, 3), rr(4, 22)), life: 1.8, s0: 14, s1: 60, color: Math.random() < 0.5 ? '#ffb050' : '#ffe0a0', add: true, op: 0.8, fog: false }); c.parts.add({ p: mis.position.clone(), v: new V(rr(-1, 1), rr(0, 2), rr(2, 12)), life: 3.5, s0: 16, s1: 80, color: '#5a504a', op: 0.45, rise: 1 }); if (k > 0.78 && !c._pass) { c._pass = 1; g.audio.play('whoosh'); g.audio.play('jetPass'); } }
        else if (t >= 4.8) { mis.visible = false; }
        // 4-9 : le robot s'effondre (genoux, buste en avant), explosions articulées
        if (G) { const k = sm(5.6, 9.2, t); EVO.cineRobotPose(G, 0.4, 0.3); G.userData.legs.forEach((L) => { L.hip.rotation.x = -0.4 * k; L.knee.rotation.x = 1.3 * k; }); G.position.y = -34 * k * k; G.rotation.x = -1.15 * Math.pow(sm(7, 11, t), 1.2); G.userData.eyeL.intensity = (1 - k) * 2; G.userData.head.rotation.x = 0.5 * k;
          if (t > 5.4 && t < 12 && Math.random() < dt * 5) { const pt = new V(rr(-40, 40), rr(10, 100) * (1 - 0.3 * k), -110 + rr(-20, 24)); c.parts.explosion(pt, (rr(0.9, 1.8)) * 4.5); } }
        up('ro', t > 5.6, () => { g.audio.play('robotRoar'); });
        up('fall', t > 8.4, () => { g.audio.play('rumble'); g.audio.play('boom'); g.rig.shake = 0; c.parts.explosion(new V(0, 6, -70), (4) * 4.5); for (let i = 0; i < 12; i++) c.parts.add({ p: new V(rr(-60, 60), 2, -70 + rr(-30, 30)), v: new V(rr(-8, 8), rr(2, 8), rr(-4, 20)), life: 5, s0: 40, s1: 200, color: '#a08c78', op: 0.5, rise: 2 }); });
        // 8-16 : la citadelle s'écroule, tours qui penchent, fumée
        const k2 = sm(8.5, 15, t); towers.forEach((o, i) => { o.rotation.z = (i % 2 ? 1 : -1) * 0.4 * k2; o.position.y = o.userData.y0 !== undefined ? o.userData.y0 - 60 * k2 : (o.userData.y0 = o.position.y, o.position.y); }); cit.position.y = -30 * k2 * k2;
        if (t > 7 && t < 19 && Math.random() < dt * 4) c.parts.explosion(new V(rr(-240, (240) * 4.5), rr(20, 220), -260 + rr(-20, 20)), rr(1.5, 3));
        if (t > 8.5 && Math.random() < dt * 10) c.parts.add({ p: new V(rr(-300, 300), rr(0, 40), -260 + rr(-40, 30)), v: new V(rr(-2, 2), rr(8, 18), rr(-2, 2)), life: 7, s0: 60, s1: 260, color: '#3a3430', op: 0.5, rise: 1 });
        up('chain', t > 10.5, () => { g.audio.play('boom'); g.audio.play('boomSmall'); }); up('chain2', t > 13, () => { g.audio.play('boom'); g.audio.play('rumble'); }); up('win', t > 17.2, () => g.audio.play('finish'));
      },
      draw(ctx, W, H, t) { const u = Math.min(W, H); if (t > 16.4) { const a = sm(16.4, 17.6, t); ctx.save(); ctx.globalAlpha = a; for (let k = 0; k < 3; k++) { const s = sm(16.6 + k * 0.5, 17.4 + k * 0.5, t); EVO.iconStar(ctx, W * (0.3 + k * 0.2), H * 0.2 - (k === 1 ? u * 0.04 : 0), u * 0.07 * (0.4 + 0.6 * s) * (k === 1 ? 1.25 : 1), '#ffd23a'); } ctx.restore(); } }
    };
  } };

})();
