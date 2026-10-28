/* v281 : NIVEAU 2 « OPERATION CASCADE » : LA PHYSIQUE AMPHIBIE. L'engin est un hydro-missile : il file dans l'eau (flottabilite quasi neutre, forte resistance, vitesse maximale
 * propre a chaque palier) et vole a l'air libre (court : plus lourd, il perd de l'energie). La surface de l'eau n'est plus constante : le fleuve tombe de cascade en cascade, le niveau
 * (EVO.waterFn(d), defini par les scenes de zones_river.js) suit la distance de la fusee ; en franchissant une chute le niveau baisse et la fusee se retrouve a l'air libre.
 * Sans moteur (paliers 0 et 1) ou sans carburant, l'engin ralentit dans l'eau puis coule : fin du vol. */
(function () {
  const EVO = CC.EVO, U = CC.U; if (!EVO || !EVO.on) return;
  if (EVO.waterFn === undefined) EVO.waterFn = null;   // (d) -> cote absolue de la surface ; pose par zones_river.js
  // vitesse maximale dans l'eau par palier (m/s) : torpille simple, a ailerons, hydrojet, amphibie
  const VW = [30, 36, 46, 56];
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    if (!EVO.waterFn || !EVO.isS2() || !g.evo) { g._wsub = 0; return; }
    const run = g.endlessRun, rk = g.rocket; if (!run) { g._wsub = 0; return; }
    EVO.seaLevel = EVO.waterFn(Math.max(0, run.dist));
    if (g.state !== 'FLIGHT' || !rk.active || g.evo.preview) { g._wsub = 0; return; }
    const S = EVO.save(g), r = EVO.rocket(S.rk), sp = rk.vel.length(), W = EVO.seaLevel, C = CC.CONFIG, gr = C.physics.gravity;
    const sub = U.clamp((W - rk.pos.y + 0.4) / 1.3, 0, 1);   // 0 a l'air libre, 1 immerge de plus de 0,9 m
    g._wsub = sub;
    const ev = g.evo;
    if (sub > 0) {
      const lowK = g.flightTime > 1.5 ? U.clamp(1 - sp / 24, 0, 1) : 0;
      rk.vel.y += gr * (1 + 1.8 * lowK) * 0.94 * sub * dt;                       // poussee d'Archimede : le poids est quasi annule
      const vW = VW[Math.min(3, r.tier)] + (r.tier >= 2 ? 1.2 * r.s : 0);
      rk.vel.multiplyScalar(Math.exp(-(rk.thrusting ? 0.07 : r.tier < 2 ? 0.1 + 0.0105 * sp : 0.2 + 0.019 * sp) * sub * dt));   // trainee de l'eau : forte quand on glisse, faible moteur allume (c'est le plafond de vitesse qui limite)
      if (sp > vW) rk.vel.multiplyScalar(1 - Math.min(1, (rk.thrusting ? 1.6 : 3.2) * dt * sub) * (1 - vW / sp));   // vitesse maximale du palier
      const dry = r.tier < 2 || rk.fuel <= 0.01;
      // sans moteur ou sans carburant : l'engin n'avance plus, il coule doucement puis c'est fini
      if (rk.vel.y < 0) rk.vel.y *= Math.exp(-2.8 * sub * dt);   // l'eau amortit la plongee : l'engin se redresse au lieu de s'enfoncer jusqu'au fond
      if (dry && sub > 0.6) {
        if (sp < 14) rk.vel.y -= 2.2 * dt; ev.sinkT = (sp < 7 ? (ev.sinkT || 0) + dt : Math.max(0, (ev.sinkT || 0) - dt));
        if (ev.sinkT > 1.1) { ev.sinkT = 0; g.onRocketCrash('stalled', rk.pos.clone(), null); return; }
      } else ev.sinkT = 0;
    } else {
      // a l'air libre : l'hydro-missile est un mauvais voilier : plus lourd, il perd de l'energie
      rk.vel.y -= gr * 0.32 * dt; rk.vel.multiplyScalar(Math.exp(-0.06 * dt)); ev.sinkT = 0;
    }
  };
})();
