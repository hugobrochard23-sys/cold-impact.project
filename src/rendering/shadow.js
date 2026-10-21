/* v034 / v214 : OMBRE DE LA ROQUETTE — repere de hauteur. Un rayon part de la roquette vers le bas ; la ou il touche (sol, toit, pont, poutre) on dessine l'OMBRE REELLE :
 * chaque piece de la fusee (fuselage, ailes, ailerons, propulseurs...) est reprojetee a plat sur la surface, verticalement sous la fusee. Meme forme que la fusee a tous les paliers
 * (si elle s'ameliore, son ombre aussi), meme taille, opacite constante : ni flou, ni fondu, ni agrandissement avec la hauteur. */
(function () {
  const V = THREE.Vector3;
  const _o = new V(), _p1 = new V(), _pm = new THREE.Matrix4(), DOWN = new V(0, -1, 0);
  const GROUND = (b) => b.kind === 'solid' || b.kind === 'brick' || b.kind === 'hazard';

  class RocketShadow {
    constructor(game) {
      this.game = game; this.cfg = CC.CONFIG.shadow; this.height = Infinity;
      this.mat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.42, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      this.group = new THREE.Group(); this.group.matrixAutoUpdate = false; this.group.visible = false; this.group.frustumCulled = false;
      game.scene.add(this.group); this.mesh = this.group;   // `mesh` : compatibilite (le jeu masque l'ombre par mesh.visible)
      this.clones = new Map();
    }

    update(dt) {
      const g = this.game, rk = g.rocket, C = this.cfg;
      if (!rk.active || g.state === 'CRASHED' || !rk.mesh.visible) { this.group.visible = false; this.height = Infinity; return; }
      _o.copy(rk.pos); _p1.copy(_o).addScaledVector(DOWN, C.maxDist);
      const hit = g.world.sweep(_o, _p1, 0.02, GROUND);
      if (!hit) { this.group.visible = false; this.height = Infinity; return; }
      const h = hit.t * C.maxDist; this.height = h;
      const n = hit.normal; if (n.y < 0.3) { this.group.visible = false; return; }   // paroi verticale : pas d'ombre
      const px = _o.x + (_p1.x - _o.x) * hit.t + n.x * 0.03, py = _o.y + (_p1.y - _o.y) * hit.t + n.y * 0.03, pz = _o.z + (_p1.z - _o.z) * hit.t + n.z * 0.03;
      // projection verticale sur le plan (point p0, normale n) : x et z inchanges, y = p0.y - (n.x (x - p0.x) + n.z (z - p0.z)) / n.y
      _pm.set(1, 0, 0, 0, -n.x / n.y, 0, -n.z / n.y, py + (n.x * px + n.z * pz) / n.y, 0, 0, 1, 0, 0, 0, 0, 1);
      rk.mesh.updateMatrixWorld(true);
      const J = rk.mesh.userData.jet, used = new Set();
      rk.mesh.traverse((o) => {
        if (!o.isMesh) return;
        for (let p = o; p; p = p.parent) { if (!p.visible) return; if (J && p === J.group) return; if (p === rk.mesh) break; }
        const m = o.material; if (m && m.transparent && m.blending === THREE.AdditiveBlending) return;
        let c = this.clones.get(o);
        if (!c) { c = new THREE.Mesh(o.geometry, this.mat); c.matrixAutoUpdate = false; c.frustumCulled = false; c.renderOrder = 1; this.group.add(c); this.clones.set(o, c); }
        else if (c.geometry !== o.geometry) c.geometry = o.geometry;
        c.matrix.multiplyMatrices(_pm, o.matrixWorld); c.matrixWorld.copy(c.matrix); c.visible = true; used.add(o);
      });
      for (const [o, c] of this.clones) if (!used.has(o)) { c.visible = false; if (!o.parent) { this.group.remove(c); this.clones.delete(o); } }
      this.group.visible = true;
    }
  }

  CC.RocketShadow = RocketShadow;
})();
