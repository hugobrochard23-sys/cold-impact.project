/* v263 : MINI NUAGES dans le vent de vitesse : de petites boules de vapeur tres peu opaques fixes dans le monde, qui defilent le long de la fusee quand elle va vite
 * (en plus des filets blancs du boost). Elles s'effacent tout pres de la camera pour ne jamais masquer l'ecran. */
(function () {
  const EVO = CC.EVO; if (!EVO || !EVO.on) return;
  const V = THREE.Vector3, N = 22, pool = []; let tex = null, grp = null;
  const _r = new V(), _u = new V(), _f = new V(), _d = new V(), UP = new V(0, 1, 0);
  const texture = () => tex || (tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })());
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  EVO.cloudFrame = (g, dt) => {
    const rk = g.rocket, on = rk && rk.active && g.state === 'FLIGHT' && g.evo && !g.evo.preview;
    if (!grp) { grp = new THREE.Group(); grp.frustumCulled = false; }
    if (grp.parent !== g.scene) g.scene.add(grp);
    if (!on) { for (const s of pool) s.visible = false; return; }
    const sp = rk.vel.length(), k = sm(24, 60, sp); _f.copy(rk.fwd);
    _r.crossVectors(_f, Math.abs(_f.y) > 0.95 ? new V(1, 0, 0) : UP).normalize(); _u.crossVectors(_r, _f).normalize();
    let spawn = k * 7 * dt; const cam = g.camera.position;
    for (let i = 0; i < N; i++) {
      let s = pool[i];
      if (!s) { s = pool[i] = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(), transparent: true, depthWrite: false, fog: false, opacity: 0 })); s.visible = false; s.userData.base = 0; grp.add(s); }
      if (s.visible) {
        _d.copy(s.position).sub(rk.pos);
        if (_d.dot(_f) < -30) { s.visible = false; continue; }
        const dc = s.position.distanceTo(cam), ahead = sm(150, 90, _d.dot(_f));
        s.material.opacity = s.userData.base * k * sm(5, 18, dc) * Math.max(0.0, 1 - ahead) ;
      } else if (spawn > 0 && Math.random() < spawn) {
        spawn -= 1; const a = Math.random() * 6.2832, rad = 7 + Math.random() * 34, ahead = 110 + Math.random() * 90, sz = 5 + Math.random() * 12;
        s.position.copy(rk.pos).addScaledVector(_f, ahead).addScaledVector(_r, Math.cos(a) * rad).addScaledVector(_u, Math.sin(a) * rad);
        s.scale.set(sz, sz * (0.55 + Math.random() * 0.3), 1); s.userData.base = 0.08 + Math.random() * 0.08; s.material.opacity = 0; s.visible = true;
      }
    }
  };
  const _fr = EVO.frame; EVO.frame = (g, dt) => { _fr(g, dt); EVO.cloudFrame(g, dt); };
})();
