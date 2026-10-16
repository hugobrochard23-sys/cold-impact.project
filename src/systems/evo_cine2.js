/* v142 : cinématique INTRO 2 — la nouvelle mission : une plateforme ennemie en mer prépare le lancement d'un missile balistique ; la caméra plonge sous la surface,
 * rejoint le sous-marin ; le volet du tube s'ouvre, la fusée est éjectée dans un nuage de bulles, s'allume, et part. Aucun texte : des icônes. */
(function () {
  const U = CC.U, EVO = CC.EVO, T3 = THREE, V = T3.Vector3;
  if (!EVO || !EVO.on || !EVO._cineLib) return;
  const { rail, lam, emi, box, cyl, rr, clamp, sm, mix } = EVO._cineLib;
  const once = () => { const d = {}; return (k, c, f) => { if (c && !d[k]) { d[k] = 1; f(); } }; };
  const tierNow = (g) => EVO.rocket(EVO.save(g).rk).tier;
  EVO.CINES.intro2 = { build(C) {
    const S = C.scene, up = once(), g0 = C.g;
    const skyDay = { top: '#3b6aa8', hor: '#ffcf9a', bot: '#2a6a8a', sun: '#ffd8a0', dir: [0.1, 0.12, -1], size: 7000 };
    const sky = C.sky(skyDay), U0 = sky.material.uniforms; S.fog = new T3.Fog('#e8c8a0', 400, 3000);
    const cDay = { top: new T3.Color(skyDay.top), hor: new T3.Color(skyDay.hor), bot: new T3.Color(skyDay.bot) }, cUw = { top: new T3.Color('#5cc4e4'), hor: new T3.Color('#2a9cc4'), bot: new T3.Color('#0e5c7c') };
    S.add(new T3.HemisphereLight('#ffe8c8', '#2a5a78', 0.85)); { const d = new T3.DirectionalLight('#ffd8a8', 1.0); d.position.set(60, 100, 80); S.add(d); }
    const water = EVO.cineWater(7000, '#2b84b4', 0.9); S.add(water);
    const plat = EVO.cinePlatform(true); plat.position.set(0, 3, -1500); S.add(plat);
    const ships = []; for (let i = 0; i < 5; i++) { const s = EVO.cineShip(80 + i * 8); s.position.set(-260 + i * 140 + rr(-40, 40), 0, -420 - i * 150 + rr(-30, 30)); s.rotation.y = rr(-0.3, 0.3); S.add(s); ships.push(s); }
    const sub = EVO.cineSub(); sub.position.set(0, -26, 0); sub.rotation.y = -Math.PI / 2; S.add(sub);
    const shafts = new T3.Group(); for (let i = 0; i < 12; i++) { const c = new T3.Mesh(new T3.ConeGeometry(rr(6, 16), 120, 8, 1, true), new T3.MeshBasicMaterial({ color: '#bfeaff', transparent: true, opacity: rr(0.025, 0.055), blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false })); c.position.set(rr(-90, 90), -58, rr(-100, 80)); c.rotation.set(Math.PI + rr(-0.1, 0.1), rr(0, 3), rr(-0.12, 0.12)); shafts.add(c); } S.add(shafts);
    const fish = []; for (let i = 0; i < 70; i++) { const f = new T3.Mesh(new T3.ConeGeometry(0.35, 1.5, 5), lam(['#9ab8c8', '#c8d8e0', '#7aa0b8'][i % 3])); f.rotation.x = Math.PI / 2; const gr = new T3.Group(); gr.add(f); gr.position.set(rr(-120, 80), rr(-60, -10), rr(-90, 90)); gr.userData = { v: rr(2, 4), ph: rr(0, 6) }; S.add(gr); fish.push(gr); }
    const seabed = new T3.Mesh(new T3.PlaneGeometry(2400, 2400, 30, 30), lam('#6a8a80')); seabed.rotation.x = -Math.PI / 2; seabed.position.y = -140; S.add(seabed);
    const mis = EVO.cineMissile(tierNow(g0)); mis.scale.setScalar(2.6); mis.visible = false; S.add(mis);
    const tA = 6, tB = 11.4, tC = 17.2, tD = 22.2, TE = 29.5, tSplash = tB + (tC - tB) * 0.47;
    const sx = (t) => -8 - (t - tC) * 1.2, dist = (ej) => ej * 2.5 + ej * ej * 7;
    const kA = rail([{ t: 0, p: [10, 5, 80], l: [0, 22, -1500], f: 48 }, { t: 3, p: [-10, 6, -90], l: [0, 24, -1500], f: 46 }, { t: 6, p: [-30, 8, -280], l: [0, 28, -1500], f: 46 }]);
    const kB = rail([{ t: 0, p: [130, 32, -1350], l: [0, 70, -1500], f: 54 }, { t: 2.5, p: [60, 52, -1390], l: [0, 82, -1500], f: 54 }, { t: 5.2, p: [-60, 96, -1410], l: [0, 120, -1500], f: 56 }]);
    return { dur: TE, music: 'evoDawn', bloom: 0.25,
      cam(t, p, l) {
        if (t < tA) return kA(t, p, l);
        if (t < tB) return kB(t - tA, p, l);
        if (t < tC) { const k = (t - tB) / (tC - tB), y = mix(7, -14, sm(0.25, 0.7, k)); p.set(mix(-30, -8, k), y, mix(95, 42, k)); l.set(mix(-30, sx(t), k), y + mix(1, -9, sm(0.4, 0.9, k)), mix(-60, 0, k)); return 56; }
        if (t < tD) { const k = (t - tC) / (tD - tC), e = k * k * (3 - 2 * k); p.set(mix(sx(t) + 38, sx(t) - 36, e), mix(-19, -23, e), mix(34, 15, e)); l.set(mix(sx(t) + 2, sx(t) - 44, e), -26, 0); return mix(54, 48, e); }
        const k = t - tD, ej = Math.max(0, k - 3.8), mxp = sx(t) - 41 - dist(ej), bx = sx(t) - 46;
        p.set(bx - 16 - dist(ej) * 0.85, -23.4, 9.2 - Math.min(2, ej * 0.6)); l.set(ej > 0 ? mxp - 4 : bx - 1.5, -26, 0.4); return mix(46, 52, Math.min(1, ej / 3));
      },
      update(t, dt, c) {
        const g = c.C.g, under = t >= tSplash;
        water.userData.upd(t, t < tC ? 1 : 0.5);
        S.fog.color.lerp(under ? new T3.Color('#2b94b8') : new T3.Color('#e8c8a0'), Math.min(1, dt * 5)); S.fog.near = under ? 10 : 400; S.fog.far = under ? 360 : 3000;
        U0.top.value.lerp((under ? cUw : cDay).top, Math.min(1, dt * 6)); U0.horizon.value.lerp((under ? cUw : cDay).hor, Math.min(1, dt * 6)); U0.bottom.value.lerp((under ? cUw : cDay).bot, Math.min(1, dt * 6));
        shafts.visible = under; water.material.color.lerp(under ? new T3.Color('#aee8ff') : new T3.Color('#2b84b4'), Math.min(1, dt * 4)); water.material.opacity = under ? 0.55 : 0.92;
        up('splash', under, () => { g.audio.play('splash'); for (let i = 0; i < 30; i++) c.parts.add({ p: new V(rr(-8, 8) - 12, 0.5, 20 + rr(-8, 8)), v: new V(rr(-5, 5), rr(4, 16), rr(-5, 5)), life: rr(0.8, 1.6), s0: 1.6, s1: 3.4, color: '#e8f6ff', op: 0.85, grav: 16, fog: false }); for (let i = 0; i < 40; i++) c.parts.add({ p: new V(rr(-12, 12) - 12, rr(-4, 0), 20 + rr(-12, 12)), v: new V(rr(-1, 1), rr(1, 5), rr(-1, 1)), life: rr(2, 4), s0: 0.7, s1: 0.2, color: '#e8fbff', op: 0.8, rise: 1.2 }); });
        ships.forEach((s, i) => { s.position.y = 1 + Math.sin(t * 0.9 + i) * 0.6; s.rotation.z = Math.sin(t * 0.7 + i) * 0.02; });
        const eM = plat.userData.missile; if (eM) { eM.position.x = Math.sin(t * 70) * 0.04 * sm(7.5, 10, t); eM.rotation.z = Math.sin(t * 50) * 0.003 * sm(7.5, 10, t); }
        if (t > tA - 1 && t < tC && Math.random() < dt * 14) c.parts.add({ p: new V(rr(-12, 12), 36, -1500 + rr(-12, 12)), v: new V(rr(-3, 3), rr(3, 9), rr(-3, 3)), life: 3.2, s0: 10, s1: 34, color: '#f0f0ee', op: 0.45, rise: 1 });
        if (t > 8.5 && t < tB && Math.random() < dt * 26) c.parts.add({ p: new V(rr(-4, 4), 14, -1500), v: new V(rr(-12, 12), rr(-2, 6), rr(-12, 12)), life: 1.8, s0: 8, s1: 30, color: '#ffb050', add: true, op: 0.8, fog: false });
        up('rumble', t > 8.8, () => { g.audio.play('rumble'); g.audio.play('alarm'); }); up('horn', t > 1.5, () => g.audio.play('shipHorn'));
        sub.visible = t >= tB + 1.5; sub.userData.prop.rotation.z += dt * 5; sub.position.set(sx(t), -26, 0);
        fish.forEach((f, i) => { f.position.x -= f.userData.v * dt; f.position.y += Math.sin(t * 2 + f.userData.ph) * dt * 0.6; if (f.position.x < -140) f.position.x = 100; f.visible = under; f.rotation.y = Math.PI / 2 + Math.sin(t * 6 + i) * 0.2; });
        if (under && Math.random() < dt * 40) c.parts.add({ p: new V(rr(-60, 60), rr(-70, -2), rr(-50, 50)), v: new V(rr(-0.4, 0.4), rr(-0.3, 0.3), rr(-0.4, 0.4)), life: 5, s0: 0.35, s1: 0.2, color: '#d8f4ff', op: 0.55 });
        if (under && sub.visible && Math.random() < dt * 18) c.parts.add({ p: new V(sx(t) + 54 + rr(-1, 1), -26 + rr(-2, 2), rr(-2, 2)), v: new V(rr(1, 3), rr(0.5, 2.5), rr(-0.6, 0.6)), life: 3.5, s0: 0.8, s1: 0.2, color: '#e8fbff', op: 0.7, rise: 1.3 });
        const k = t - tD, doors = sub.userData.doors, open = sm(1.2, 3.0, k);
        if (doors) { doors[0].position.x = -1.25 - 2.3 * open; doors[1].position.x = 1.25 + 2.3 * open; }
        up('open', k > 1.2, () => g.audio.play('hydraulic'));
        const ej = k - 3.8;
        if (ej >= 0) { mis.visible = true; mis.position.set(sx(t) - 41 - dist(ej), -26, 0); mis.rotation.y = -Math.PI / 2; const fl = mis.userData.flame; fl.visible = ej > 0.9; fl.scale.set(1.4, 1.6 + Math.random() * 0.7, 1.4);
          if (ej > 0.9) { c.parts.add({ p: new V(mis.position.x + 2.2, -26, 0), v: new V(rr(1, 5), rr(-0.5, 0.5), rr(-0.5, 0.5)), life: 0.6, s0: 1.4, s1: 4, color: '#ffb050', add: true, op: 0.9, fog: false }); if (Math.random() < 0.9) c.parts.add({ p: new V(mis.position.x + 2, -26, 0), v: new V(rr(0, 6), rr(-0.6, 0.6), rr(-0.6, 0.6)), life: 2.2, s0: 0.6, s1: 2, color: '#f6feff', op: 0.8, rise: 1 }); } }
        up('eject', ej > 0, () => { g.audio.play('launch'); g.audio.play('hydraulic'); }); up('ignite', ej > 0.9, () => { g.audio.play('padIgnite'); g.audio.play('boostOn'); });
      },
      draw(ctx, W, H, t) {
        const u = Math.min(W, H), s = u * 0.05;
        if (t > 2.2 && t < tA + 2) { const a = sm(2.2, 3, t) * (1 - sm(tA + 1, tA + 2, t)); ctx.save(); ctx.globalAlpha = a; EVO.iconShip(ctx, W * 0.5, H * 0.14, s, '#ff9a6a'); ctx.restore(); }
        if (t > tA + 1.4 && t < tB) { const a = sm(tA + 1.4, tA + 2.4, t) * (1 - sm(tB - 0.8, tB, t)); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,70,50,0.9)'; ctx.beginPath(); ctx.moveTo(W / 2, H * 0.1); ctx.lineTo(W / 2 - s * 1.2, H * 0.1 + s * 2); ctx.lineTo(W / 2 + s * 1.2, H * 0.1 + s * 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - s * 0.1, H * 0.1 + s * 0.6, s * 0.2, s * 0.8); ctx.fillRect(W / 2 - s * 0.1, H * 0.1 + s * 1.55, s * 0.2, s * 0.2); EVO.iconMissile(ctx, W / 2 + s * 2.6, H * 0.1 + s * 1.3, s * 0.8, '#ff9a6a'); ctx.restore(); }
        if (t > tD + 0.4) { const a = sm(tD + 0.4, tD + 1.4, t); ctx.save(); ctx.globalAlpha = a; const y = H * 0.9; EVO.iconSub(ctx, W * 0.2, y, s * 1.1, '#aee8ff'); EVO.iconArrow(ctx, W * 0.35, y, s * 0.5, 'rgba(255,255,255,0.85)', 0); EVO.iconShip(ctx, W * 0.5, y, s * 0.9, '#ff9a6a'); EVO.iconArrow(ctx, W * 0.65, y, s * 0.5, 'rgba(255,255,255,0.85)', 0); EVO.iconMissile(ctx, W * 0.8, y, s, '#ff6a4a'); ctx.restore(); }
      } };
  } };

  // ============================================================== WIN 2 : le missile balistique explose dans le ciel ; le sous-marin remonte au soleil levant
  EVO.CINES.win2 = { build(C) {
    const S = C.scene, up = once(), g0 = C.g;
    const sky = C.sky({ top: '#2c4a86', hor: '#ffb070', bot: '#6a4a40', sun: '#ffd8a0', dir: [0.15, 0.1, -1], size: 7000 }); S.fog = new T3.Fog('#e0a888', 500, 4000);
    S.add(new T3.HemisphereLight('#ffe0c0', '#2a5a78', 0.9)); { const d = new T3.DirectionalLight('#ffd0a0', 1.0); d.position.set(60, 100, 80); S.add(d); }
    const water = EVO.cineWater(9000, '#2b7aa8', 0.95); S.add(water);
    const sub = EVO.cineSub(); sub.rotation.y = -Math.PI / 2; sub.position.set(0, -24, 40); S.add(sub);
    const ships = []; for (let i = 0; i < 4; i++) { const s2 = EVO.cineShip(90); s2.position.set(-300 + i * 200, 0, -700 - i * 120); s2.rotation.y = rr(-0.3, 0.3); S.add(s2); ships.push(s2); }
    const ring = new T3.Mesh(new T3.RingGeometry(0.9, 1, 48), new T3.MeshBasicMaterial({ color: '#ffe0b0', transparent: true, opacity: 0.7, side: T3.DoubleSide, blending: T3.AdditiveBlending, depthWrite: false, fog: false })); ring.position.set(0, 420, -900); S.add(ring);
    const kA = rail([{ t: 0, p: [20, 6, 120], l: [0, 300, -900], f: 58 }, { t: 5.5, p: [-10, 10, 40], l: [0, 380, -900], f: 56 }]);
    const kB = rail([{ t: 0, p: [-90, 7, 140], l: [0, -4, 40], f: 54 }, { t: 3, p: [-60, 10, 110], l: [0, 2, 40], f: 54 }, { t: 6.5, p: [40, 24, 90], l: [-10, 8, 40], f: 54 }]);
    const tB = 5.5, DUR = 15.5;
    return { dur: DUR, music: 'evoDawn', bloom: 0.35, fadeTo: 'white',
      cam(t, p, l) { if (t < tB) return kA(t, p, l); return kB(t - tB, p, l); },
      update(t, dt, c) {
        const g = c.C.g; water.userData.upd(t, 0.8);
        if (t < 5.2) { up('x0', t > 0.2, () => { g.audio.play('boom'); g.audio.play('rumble'); }); if (Math.random() < dt * 8 && t < 4) c.parts.explosion(new V(rr(-90, 90), rr(330, 520), -900 + rr(-60, 60)), rr(5, 10)); const k = clamp(t / 4, 0, 1); ring.scale.setScalar(20 + k * 700); ring.material.opacity = 0.7 * (1 - k); ring.lookAt(0, 420, 200);
          if (Math.random() < dt * 40) c.parts.add({ p: new V(rr(-120, 120), rr(300, 500), -900 + rr(-60, 60)), v: new V(rr(-30, 30), rr(-10, 20), rr(-20, 40)), life: rr(2.5, 4.5), s0: 4, s1: 2, color: Math.random() < 0.5 ? '#ffb050' : '#ffe0a0', add: true, op: 0.9, grav: 22, fog: false }); }
        up('boom2', t > 1.4, () => { g.audio.play('boom'); g.audio.play('boomSmall'); }); up('boom3', t > 3.0, () => { g.audio.play('rumble'); });
        // le sous-marin remonte, l'eau ruisselle, des remous ; un petit drapeau flotte à la tour
        if (t > 3.2) { const k = sm(3.2, 9.5, t); sub.position.y = mix(-24, 3.2, k); if (Math.random() < dt * 30 * k) c.parts.add({ p: new V(rr(-10, 10), 4, 40 + rr(-30, 30)), v: new V(rr(-3, 3), rr(2, 9), rr(-3, 3)), life: rr(1, 2), s0: 2.2, s1: 5, color: '#f4fbff', op: 0.75, grav: 10, fog: false }); }
        up('surf', t > 6.0, () => { g.audio.play('splash'); }); up('win', t > 12.2, () => g.audio.play('finish'));
        sub.userData.prop.rotation.z += dt * 2; ships.forEach((s2, i) => { s2.position.y = 0.6 + Math.sin(t + i) * 0.5; });
      },
      draw(ctx, W, H, t) { const u = Math.min(W, H); if (t > 11.6) { const a = sm(11.6, 12.8, t); ctx.save(); ctx.globalAlpha = a; for (let k = 0; k < 3; k++) { const s2 = sm(11.8 + k * 0.45, 12.6 + k * 0.45, t); EVO.iconStar(ctx, W * (0.3 + k * 0.2), H * 0.2 - (k === 1 ? u * 0.04 : 0), u * 0.07 * (0.4 + 0.6 * s2) * (k === 1 ? 1.25 : 1), '#ffd23a'); } ctx.restore(); } } };
  } };
})();
