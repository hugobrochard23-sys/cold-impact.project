/* v034b : MUR A CASSER — le collectible « actif » du mode CLASSIQUE. Un mur plein (briques, planches, tôle, pierre…) fait de gros
 * blocs barre le couloir jusqu'à ~24 m de haut : on le traverse (la roquette y perd 12 % de vitesse) ou on passe par-dessus.
 * Les blocs touchés (et leurs voisins dans ~7 m) éclatent en morceaux, et chacun libère des MATERIAUX : des écrous dorés qui
 * volent jusqu'au compteur du HUD (Game.onSmash → Game.flyers). Un seul objet instancié par mur (un appel de dessin) ;
 * chaque bloc a sa boîte de collision (kind 'brick', ref → cette classe) : Rocket.resolveHit la brise sans rien savoir d'elle. */
(function () {
  const V = THREE.Vector3;
  const _e = new THREE.Euler(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);

  class SmashWall {
    /* o = { blocks: [[x,y,z], …] centres, size: [w,h,d], yaw (degrés), mat, shatter: 'brick'|'planks', reward (matériaux par bloc) } */
    constructor(builder, o) {
      this.o = o; this.reward = o.reward || 4; this.kind = o.shatter || 'brick';
      const geo = builder.soloBoxGeometry(o.size, o.mat), mat = builder.mat(geo.userData.matKey || o.mat);
      const n = o.blocks.length;
      this.mesh = new THREE.InstancedMesh(geo, mat, n); this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
      this.object = this.mesh;
      _q.copy(builder.quatFrom([0, o.yaw, 0]));
      this.centers = []; this.colliders = []; this.alive = new Array(n).fill(true);
      this.size = new V().fromArray(o.size);
      o.blocks.forEach((p, i) => {
        const c = new V().fromArray(p); this.centers.push(c);
        _m.compose(c, _q, _s.set(1, 1, 1)); this.mesh.setMatrixAt(i, _m);
        this.colliders.push(builder.world.addBox({ center: c, size: o.size, quat: _q, kind: 'brick', ref: { breakApart: (game, vel) => this.smash(i, game, vel) } }));
      });
      this.mesh.instanceMatrix.needsUpdate = true;
      this.quat = _q.clone();
    }

    // brise le bloc i et ses voisins proches (un trou de la taille de la roquette + un peu) ; récompense par bloc
    smash(i, game, vel) {
      if (!this.alive[i]) return;
      const c0 = this.centers[i], total = [];
      this.centers.forEach((c, j) => { if (this.alive[j] && c.distanceTo(c0) < 7.6) total.push(j); });
      let n = 0;
      for (const j of total) {
        this.alive[j] = false; this.colliders[j].active = false; this.mesh.setMatrixAt(j, _zero);
        game.effects.shatter(this.centers[j], this.size, vel, this.kind);
        n += this.reward;
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      game.audio.play('brick', c0); game.audio.play('boomSmall', c0);
      game.onSmash(c0, n);
    }
    // v113 : le mur du boss s'EFFONDRE : chaque bloc est projeté vers la fusée, tombe avec de la gravité, rebondit sur le sol et glisse
    breakFall(game, fxN) {
      const rk = game.rocket.pos, mid = this.centers[Math.floor(this.centers.length / 2)], D = new V(rk.x - mid.x, 0, rk.z - mid.z).normalize(), F = this.fall = { t: 0, st: [], gy: Infinity };
      this.centers.forEach((c) => { F.gy = Math.min(F.gy, c.y - this.size.y / 2); });
      let k = 0; const step = Math.max(1, Math.floor(this.centers.length / (fxN || 18)));
      this.centers.forEach((c, j) => {
        if (!this.alive[j]) return; this.alive[j] = false; this.colliders[j].active = false;
        const sp = 10 + Math.random() * 22, dx = c.x - mid.x, dy = c.y - (F.gy + 28);
        F.st.push({ j, p: c.clone(), v: new V(D.x * sp + dx * 0.35 + (Math.random() - 0.5) * 6, 3 + Math.random() * 13 - Math.abs(dy) * 0.04, D.z * sp + (Math.random() - 0.5) * 6), r: new V(), w: new V((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5), done: false });
        if (k++ % step === 0) game.effects.shatter(c, this.size, new V(D.x * 20, 6, D.z * 20), this.kind);
      });
      game.audio.play('brick', mid); game.audio.play('boom', mid);
      for (const f of [0.25, 0.5, 0.75]) { const q = mid.clone(); q.x += (f - 0.5) * 90; q.y = F.gy + 3; try { game.effects.dustKick(q, new V(0, 1, 0), 4); game.effects.smokePuff(q, new V(D.x * 6, 5, D.z * 6), 7, 2.2); } catch (e) { /* ignoré */ } }
      game.onSmash(mid, 20);
    }
    update(dt) {
      const F = this.fall; if (!F) return; F.t += dt;
      const hs = this.size.y / 2, one = _s.set(1, 1, 1);
      for (const s of F.st) {
        if (s.done) continue;
        s.v.y -= 26 * dt; s.p.addScaledVector(s.v, dt); s.r.addScaledVector(s.w, dt);
        if (s.p.y < F.gy + hs) { s.p.y = F.gy + hs; s.v.y = s.v.y < -4 ? -s.v.y * 0.3 : 0; s.v.x *= 0.8; s.v.z *= 0.8; s.w.multiplyScalar(0.65); }
        _e.set(s.r.x, s.r.y, s.r.z); _q2.setFromEuler(_e).premultiply(this.quat); _m.compose(s.p, _q2, one); this.mesh.setMatrixAt(s.j, _m);
        if (F.t > 7) { this.mesh.setMatrixAt(s.j, _zero); s.done = true; }
      }
      this.mesh.instanceMatrix.needsUpdate = true; if (F.t > 7) this.fall = null;
    }
    // v112 : le mur du boss s'écroule d'un coup (quelques gerbes d'éclats seulement, pour rester fluide)
    breakAll(game, vel, fxN) {
      const step = Math.max(1, Math.floor(this.centers.length / (fxN || 24))); let k = 0, n = 0;
      this.centers.forEach((c, j) => { if (!this.alive[j]) return; this.alive[j] = false; this.colliders[j].active = false; this.mesh.setMatrixAt(j, _zero); if (k++ % step === 0) game.effects.shatter(c, this.size, vel, this.kind); n += this.reward; });
      this.mesh.instanceMatrix.needsUpdate = true;
      const mid = this.centers[Math.floor(this.centers.length / 2)];
      game.audio.play('brick', mid); game.audio.play('boom', mid); game.onSmash(mid, Math.min(n, 40));
    }
    reset() { this.alive.fill(true); this.centers.forEach((c, i) => { _m.compose(c, this.quat, _s.set(1, 1, 1)); this.mesh.setMatrixAt(i, _m); this.colliders[i].active = true; }); this.mesh.instanceMatrix.needsUpdate = true; }
  }

  CC.SmashWall = SmashWall;
  CC.LevelBuilder.prototype.smashWall = function (o) { const w = new SmashWall(this, o); return this.entity(w); };
})();
