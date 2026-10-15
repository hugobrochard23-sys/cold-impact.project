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
  EVO.placeGroup = (S, grp, dc, lx, y, dyawRad) => { const p = S.at(dc, lx, y); grp.position.set(p[0], p[1], p[2]); grp.rotation.y = CC.U.deg(S.yaw(dc)) + (dyawRad || 0); S.b.root.add(grp); return grp; };
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
  EVO.dynHit = (g) => {
    const rk = g.rocket; if (!rk || !rk.active || g.state !== 'FLIGHT') return;
    for (const d of EVO.dyn) {
      if (!d.obj.visible || d.obj.position.distanceTo(rk.pos) > 260 + (d.span || 0)) continue;
      d.obj.updateWorldMatrix(true, true);
      for (const c of d.cols) {
        c.updateWorldMatrix(true, false); _inv.copy(c.matrixWorld).invert(); _p.copy(rk.pos).applyMatrix4(_inv);
        const s = c.userData.size, sc = c.matrixWorld.getMaxScaleOnAxis(), r = 1.2 / sc;
        if (Math.abs(_p.x) < s[0] / 2 + r && Math.abs(_p.y) < s[1] / 2 + r && Math.abs(_p.z) < s[2] / 2 + r) { g.onRocketCrash('wall', rk.pos.clone(), new V(0, 1, 0)); return; }
      }
    }
  };
  const _fr = EVO.frame; EVO.frame = (g, dt) => { _fr(g, dt); EVO.dynFrame(g, dt); };
  const _tk = EVO.tick; EVO.tick = (g, dt) => { _tk(g, dt); EVO.dynHit(g); };
  const _br = EVO.beginRun; EVO.beginRun = (g) => { _br(g); EVO.clock = 0; };
})();
