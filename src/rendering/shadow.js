/* v034 / v216 : OMBRE DE LA ROQUETTE — repere de hauteur, tout en UNE SEULE piece, d'une seule teinte.
 * 1. Chaque piece de la fusee (fuselage, ailes, ailerons, propulseurs, et les morceaux detaches quand elle est cassee) est aplatie sur la surface, verticalement SOUS la fusee.
 * 2. Cette silhouette est dessinee en blanc sur noir dans une petite texture (vue du dessus, 256 px) : un MASQUE, sans aucun chevauchement ni double opacite.
 * 3. Le masque est applique (a) sur le sol par une plaque posee sur la surface, (b) sur les BRINS D'HERBE et les fleurs par leur propre shader : un brin a moitie sous l'ombre
 *    est assombri a moitie. Meme ombre sur le pas de tir, en vol et quand la fusee est cassee. */
(function () {
  const V = THREE.Vector3;
  const _o = new V(), _p1 = new V(), _w = new V(), _pm = new THREE.Matrix4(), _mt = new THREE.Matrix4(), _cc = new THREE.Color(), DOWN = new V(0, -1, 0);
  const GROUND = (b) => !b.invisible && (b.kind === 'solid' || b.kind === 'brick' || b.kind === 'hazard');
  const HALF = 2.6;   // demi-cote (m) de la zone du masque autour de la fusee
  // uniformes partages avec les shaders d'herbe (zones_evo.js)
  const dummy = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); dummy.needsUpdate = true;
  CC.SHU = CC.SHU || { uShTex: { value: dummy }, uShC: { value: new V() }, uShS: { value: HALF * 2 }, uShAmt: { value: 0 } };

  class RocketShadow {
    constructor(game) {
      this.game = game; this.cfg = CC.CONFIG.shadow; this.height = Infinity; this.amt = 0.32;
      this.rt = new THREE.WebGLRenderTarget(256, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }); CC.SHU.uShTex.value = this.rt.texture;
      this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 400); this.cam.up.set(0, 0, -1);
      this.white = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, depthTest: false, depthWrite: false, fog: false });
      const qg = new THREE.PlaneGeometry(1, 1); qg.rotateX(-Math.PI / 2);
      this.mat = new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: this.rt.texture, transparent: true, opacity: this.amt, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      this.mesh = new THREE.Mesh(qg, this.mat); this.mesh.matrixAutoUpdate = false; this.mesh.frustumCulled = false; this.mesh.renderOrder = 1; this.mesh.visible = false; game.scene.add(this.mesh);
      this.sig = ''; this.sm = null; this.pos = null;
    }

    hide() { this.mesh.visible = false; CC.SHU.uShAmt.value = 0; this.height = Infinity; }

    sources(rk, g) {
      const src = [], J = rk.mesh.userData.jet, add = (root, stop) => root.traverse((o) => {
        if (!o.isMesh) return;
        for (let p = o; p; p = p.parent) { if (!p.visible) return; if (J && p === J.group) return; if (p === stop) break; }
        const m = o.material; if (m && m.transparent && m.blending === THREE.AdditiveBlending) return;
        src.push(o);
      });
      rk.mesh.updateMatrixWorld(true); add(rk.mesh, rk.mesh);
      if (g.evoTumble) for (const q of g.evoTumble.P) { if (q.isBody || !q.m || !q.m.parent) continue; q.m.updateMatrixWorld(true); if (q.m.isMesh) { if (q.m.visible) src.push(q.m); } else add(q.m, q.m); }
      return src;
    }

    update(dt) {
      const g = this.game, rk = g.rocket, C = this.cfg, R = g.renderer;
      if (!rk || !rk.mesh || !rk.mesh.visible || (g.state !== 'FLIGHT' && g.state !== 'CRASHED' && g.state !== 'AIM' && g.state !== 'LAUNCH' && g.state !== 'MENU' && g.state !== 'IMPACT')) { this.hide(); return; }
      rk.mesh.getWorldPosition(_o); _p1.copy(_o).addScaledVector(DOWN, C.maxDist);
      const hit = g.world.sweep(_o, _p1, 0.02, GROUND);
      if (!hit) { this.hide(); return; }
      this.height = hit.t * C.maxDist;
      const n = hit.normal; if (n.y < 0.3) { this.hide(); return; }
      const px = _o.x + (_p1.x - _o.x) * hit.t + n.x * 0.03, py = _o.y + (_p1.y - _o.y) * hit.t + n.y * 0.03, pz = _o.z + (_p1.z - _o.z) * hit.t + n.z * 0.03;
      // aplatissement vertical sur le plan (point p0, normale n) : x et z inchanges, y = p0.y - (n.x (x - p0.x) + n.z (z - p0.z)) / n.y
      _pm.set(1, 0, 0, 0, -n.x / n.y, 0, -n.z / n.y, py + (n.x * px + n.z * pz) / n.y, 0, 0, 1, 0, 0, 0, 0, 1);
      const src = this.sources(rk, g);
      let sig = ''; for (const o of src) sig += o.id + ':' + o.geometry.id + ',';
      if (sig !== this.sig) {
        this.sig = sig; let nv = 0, ni = 0; for (const o of src) { const ge = o.geometry; nv += ge.attributes.position.count; ni += ge.index ? ge.index.count : ge.attributes.position.count; }
        const idx = new Uint32Array(ni); let vo = 0, io = 0;
        for (const o of src) { const ge = o.geometry, k0 = ge.attributes.position.count; if (ge.index) { for (let k = 0; k < ge.index.count; k++) idx[io++] = ge.index.getX(k) + vo; } else for (let k = 0; k < k0; k++) idx[io++] = vo + k; vo += k0; }
        if (this.sm) { this.scene.remove(this.sm); this.sm.geometry.dispose(); }
        const geo = new THREE.BufferGeometry(); this.pos = new Float32Array(nv * 3); const pa = new THREE.BufferAttribute(this.pos, 3); pa.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('position', pa); geo.setIndex(new THREE.BufferAttribute(idx, 1));
        this.sm = new THREE.Mesh(geo, this.white); this.sm.frustumCulled = false; this.sm.matrixAutoUpdate = false; this.scene.add(this.sm);
      }
      { const P = this.pos; let o3 = 0;
        for (const o of src) { _mt.multiplyMatrices(_pm, o.matrixWorld); const e = _mt.elements, pa = o.geometry.attributes.position, n0 = pa.count;
          for (let k = 0; k < n0; k++) { const x = pa.getX(k), y = pa.getY(k), z = pa.getZ(k); P[o3++] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[o3++] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[o3++] = e[2] * x + e[6] * y + e[10] * z + e[14]; } }
        this.sm.geometry.attributes.position.needsUpdate = true; }
      // masque : vue du dessus centree sur la fusee
      const cx = _o.x, cz = _o.z, cy = py + (-n.x * (cx - px) - n.z * (cz - pz)) / n.y;
      this.cam.position.set(cx, cy + 60, cz); this.cam.lookAt(cx, cy, cz); this.cam.updateMatrixWorld();
      const oc = R.getClearColor(_cc).getHex(), oa = R.getClearAlpha(), ort = R.getRenderTarget();
      R.setRenderTarget(this.rt); R.setClearColor(0x000000, 1); R.clear(); R.render(this.scene, this.cam); R.setRenderTarget(ort); R.setClearColor(oc, oa);
      CC.SHU.uShC.value.set(cx, cy, cz); CC.SHU.uShS.value = HALF * 2; CC.SHU.uShAmt.value = this.amt;
      // plaque posee sur la surface (base inclinee selon la pente) : x' = (1, -nx/ny, 0), z' = (0, -nz/ny, 1)
      _mt.makeBasis(_w.set(1, -n.x / n.y, 0).multiplyScalar(HALF * 2), n.clone().multiplyScalar(1), new V(0, -n.z / n.y, 1).multiplyScalar(HALF * 2)); _mt.setPosition(cx, cy, cz);
      this.mesh.matrix.copy(_mt); this.mesh.matrixWorld.copy(_mt); this.mesh.visible = true;
    }
  }

  CC.RocketShadow = RocketShadow;
})();
