/* v034 / v214 : OMBRE DE LA ROQUETTE — repere de hauteur. Un rayon part de la roquette vers le bas ; la ou il touche (sol, toit, pont, poutre) on dessine l'OMBRE REELLE :
 * chaque piece de la fusee (fuselage, ailes, ailerons, propulseurs...) est reprojetee a plat sur la surface, verticalement sous la fusee. Meme forme que la fusee a tous les paliers
 * (si elle s'ameliore, son ombre aussi), meme taille, opacite constante : ni flou, ni fondu, ni agrandissement avec la hauteur. */
(function () {
  const V = THREE.Vector3;
  const _o = new V(), _p1 = new V(), _pm = new THREE.Matrix4(), _mt = new THREE.Matrix4(), DOWN = new V(0, -1, 0);
  const GROUND = (b) => b.kind === 'solid' || b.kind === 'brick' || b.kind === 'hazard';

  class RocketShadow {
    constructor(game) {
      this.game = game; this.cfg = CC.CONFIG.shadow; this.height = Infinity;
      this.mat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.42, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      this.group = new THREE.Group(); this.group.matrixAutoUpdate = false; this.group.visible = false; this.group.frustumCulled = false;
      game.scene.add(this.group); this.mesh = this.group;   // `mesh` : compatibilite (le jeu masque l'ombre par mesh.visible)
      this.sig = ''; this.sm = null; this.pos = null;
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
      const J = rk.mesh.userData.jet, src = [];
      rk.mesh.traverse((o) => {
        if (!o.isMesh) return;
        for (let p = o; p; p = p.parent) { if (!p.visible) return; if (J && p === J.group) return; if (p === rk.mesh) break; }
        const m = o.material; if (m && m.transparent && m.blending === THREE.AdditiveBlending) return;
        src.push(o);
      });
      // UN SEUL maillage pour toute l'ombre (un seul appel de dessin) : les sommets de chaque piece sont projetes a plat chaque image
      let sig = ''; for (const o of src) sig += o.id + ':' + o.geometry.id + ',';
      if (sig !== this.sig) {
        this.sig = sig; let nv = 0, ni = 0; for (const o of src) { const ge = o.geometry; nv += ge.attributes.position.count; ni += ge.index ? ge.index.count : ge.attributes.position.count; }
        const idx = new Uint32Array(ni); let vo = 0, io = 0;
        for (const o of src) { const ge = o.geometry, n = ge.attributes.position.count; if (ge.index) { for (let k = 0; k < ge.index.count; k++) idx[io++] = ge.index.getX(k) + vo; } else for (let k = 0; k < n; k++) idx[io++] = vo + k; vo += n; }
        if (this.sm) { this.group.remove(this.sm); this.sm.geometry.dispose(); }
        const geo = new THREE.BufferGeometry(); this.pos = new Float32Array(nv * 3); const pa = new THREE.BufferAttribute(this.pos, 3); pa.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('position', pa); geo.setIndex(new THREE.BufferAttribute(idx, 1));
        this.sm = new THREE.Mesh(geo, this.mat); this.sm.frustumCulled = false; this.sm.renderOrder = 1; this.sm.matrixAutoUpdate = false; this.group.add(this.sm);
      }
      { const M = _mt, P = this.pos; let o3 = 0;
        for (const o of src) { M.multiplyMatrices(_pm, o.matrixWorld); const e = M.elements, pa = o.geometry.attributes.position, n = pa.count, ar = pa.array;
          for (let k = 0; k < n; k++) { const x = pa.getX(k), y = pa.getY(k), z = pa.getZ(k); P[o3++] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[o3++] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[o3++] = e[2] * x + e[6] * y + e[10] * z + e[14]; } }
        this.sm.geometry.attributes.position.needsUpdate = true; }
      this.group.visible = true;
    }
  }

  CC.RocketShadow = RocketShadow;
})();
