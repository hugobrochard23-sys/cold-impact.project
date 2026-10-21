/* v131 : OBJETS QUI BOUGENT du mode évolution — trains, cages d'ascenseur, projecteurs, bras du robot géant, débris. Chaque objet est un groupe animé par une
 * fonction du temps ; ses collisions sont des boîtes orientées (enfants du groupe, taille dans userData.size) testées à chaque image contre la fusée.
 * Les objets appartiennent à un tronçon du décor : quand le tronçon est détruit, ils disparaissent de la liste. */
(function () {
  const EVO = CC.EVO, V = THREE.Vector3;
  if (!EVO || !EVO.on) return;
  EVO.dyn = []; EVO.clock = 0;
  const _p = new V(), _inv = new THREE.Matrix4();
  EVO.addDyn = (obj, upd, cols, opt) => { const d = Object.assign({ obj, upd, cols: cols || [], near: 420 }, opt || {}); EVO.dyn.push(d); return obj; };
  const attached = (g, o) => { let p = o; while (p.parent) p = p.parent; return p === g.scene; };
  // un repère pour poser un objet dans le monde, avec le cap du couloir
  EVO.placeGroup = (S, grp, dc, lx, y, dyawRad) => { const p = S.at(dc, lx, y); grp.position.set(p[0], p[1], p[2]); grp.rotation.y = CC.U.deg(S.yaw(dc)) + (dyawRad || 0); if (S.inClip(dc)) S.b.root.add(grp); return grp; };   // v205 : un seul exemplaire (l'etape de 20 m qui contient `dc`)
  EVO.colBox = (parent, w, h, d, x, y, z) => { const c = new THREE.Object3D(); c.userData.size = [w, h, d]; c.position.set(x || 0, y || 0, z || 0); parent.add(c); return c; };
  EVO.dynFrame = (g, dt) => {
    EVO.clock += dt;
    const rk = g.rocket, L = EVO.dyn;
    for (let i = L.length - 1; i >= 0; i--) {
      const d = L[i];
      if (!attached(g, d.obj)) { L.splice(i, 1); continue; }
      if (rk && rk.active && d.obj.position.distanceTo(rk.pos) > d.near + (d.span || 0)) { if (d.sleep) continue; }
      if (d.upd) d.upd(EVO.clock, dt, g, d);
    }
  };
  const _q = new V(), _nrm = new V(), _prev = new V(); let _hasPrev = false;
  // v209 : test BALAYE (la fusee fait plus d'1 m par image : un point seul traversait les pieces fines) ; la normale de la face touchee sert au ricochet
  EVO.dynHit = (g) => {
    const rk = g.rocket; if (!rk || !rk.active || g.state !== 'FLIGHT') { _hasPrev = false; return; }
    const n0 = _hasPrev ? 4 : 1;
    for (const d of EVO.dyn) {
      if (!d.obj.visible || d.obj.position.distanceTo(rk.pos) > 260 + (d.span || 0)) continue;
      d.obj.updateWorldMatrix(true, true);
      for (const c of d.cols) {
        c.updateWorldMatrix(true, false); _inv.copy(c.matrixWorld).invert();
        const s = c.userData.size, sc = c.matrixWorld.getMaxScaleOnAxis(), r = 1.2 / sc;
        for (let k = 0; k < n0; k++) {
          _q.copy(rk.pos); if (_hasPrev) _q.lerp(_prev, k / n0);
          _p.copy(_q).applyMatrix4(_inv);
          const ox = s[0] / 2 + r - Math.abs(_p.x), oy = s[1] / 2 + r - Math.abs(_p.y), oz = s[2] / 2 + r - Math.abs(_p.z);
          if (ox > 0 && oy > 0 && oz > 0) {
            if (d.hit && d.hit(g, d)) return;
            if (ox <= oy && ox <= oz) _nrm.set(Math.sign(_p.x) || 1, 0, 0); else if (oy <= oz) _nrm.set(0, Math.sign(_p.y) || 1, 0); else _nrm.set(0, 0, Math.sign(_p.z) || 1);
            _nrm.transformDirection(c.matrixWorld); _hasPrev = false;
            g.onRocketCrash('wall', _q.clone(), _nrm.clone()); return;
          }
        }
      }
    }
    _prev.copy(rk.pos); _hasPrev = true;
  };
  const _fr = EVO.frame; EVO.frame = (g, dt) => { _fr(g, dt); EVO.dynFrame(g, dt); };
  const _tk = EVO.tick; EVO.tick = (g, dt) => { _tk(g, dt); EVO.dynHit(g); };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); EVO.clock = 0; };
})();
