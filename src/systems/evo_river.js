/* v281 : NIVEAU 2 « OPERATION CASCADE » : LA PHYSIQUE AMPHIBIE. L'engin est un hydro-missile : il file dans l'eau (flottabilite quasi neutre, forte resistance, vitesse maximale
 * propre a chaque palier) et vole a l'air libre (court : plus lourd, il perd de l'energie). La surface de l'eau n'est plus constante : le fleuve tombe de cascade en cascade, le niveau
 * (EVO.waterFn(d), defini par les scenes de zones_river.js) suit la distance de la fusee ; en franchissant une chute le niveau baisse et la fusee se retrouve a l'air libre.
 * Sans moteur (paliers 0 et 1) ou sans carburant, l'engin ralentit dans l'eau puis coule : fin du vol. */
(function () {
  const EVO = CC.EVO, U = CC.U; if (!EVO || !EVO.on) return;
  if (EVO.waterFn === undefined) EVO.waterFn = null;   // (d) -> cote absolue de la surface ; pose par zones_river.js
  // vitesse maximale dans l'eau par palier (m/s) : torpille simple, a ailerons, hydrojet, amphibie
  const VW = [30, 36, 46, 56];
  // vitesse du courant (m/s) selon la distance : fleuve plus rapide dans les gorges etroites, nul sur le lac, fort dans la conduite forcee
  const CUR = (d) => { const R = EVO.riv; if (!R) return 0; let c; if (d < R.LA) c = 4.5 + 5 * U.clamp((46 - R.HW(d)) / 24, 0, 1); else c = d < R.LA + 300 ? 3 : d < R.EXIT ? 9 : 4; return c * U.clamp(d / 60, 0, 1); };
  EVO.curAt = CUR;
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
    if (sub === 0 && run.dist < 130 && rk.sliding > 0) { const d1 = Math.max(0, run.dist), a1 = run.T.at(d1, 0, 0), b1 = run.T.at(d1 + 6, 0, 0), h1 = Math.hypot(b1[0] - a1[0], b1[2] - a1[2]) || 1; rk.vel.x += (b1[0] - a1[0]) / h1 * 14 * dt; rk.vel.z += (b1[2] - a1[2]) / h1 * 14 * dt; }   // v286 : la colline de la rampe est une pente : la fusee posee glisse jusqu'a l'eau
    const ev = g.evo;
    // le sol (fond du fleuve, berge, mur) met fin au vol apres un contact prolonge ; sur la colline de la rampe la fusee glisse jusqu'a l'eau
    if (rk.sliding > 0.02) { ev.gT = (ev.gT || 0) + dt; if (ev.gT > (run.dist < 130 && sub === 0 ? 99 : 0.4)) { ev.gT = 0; g.onRocketCrash('stalled', rk.pos.clone(), null); return; } } else ev.gT = 0;
    if (sub > 0) {
      // v286 : LE COURANT. Le fleuve entraine l'engin vers l'aval ; trainee, vitesse maximale et arret se mesurent par rapport a l'eau : meme la torpille de base avance
      const d0 = Math.max(0, run.dist), a = run.T.at(d0, 0, 0), b = run.T.at(d0 + 6, 0, 0), hl = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, cu = CUR(d0) * sub;
      const fx = (b[0] - a[0]) / hl * cu, fz = (b[2] - a[2]) / hl * cu; g._cur = cu;
      rk.vel.x -= fx; rk.vel.z -= fz;
      const lowK = g.flightTime > 1.5 && !(r.tier < 2 || rk.fuel <= 0.01) ? U.clamp(1 - sp / 24, 0, 1) : 0;   // (sans moteur : plus de flottabilite de secours, l'engin coule quand il ralentit)
      rk.vel.y += gr * (1 + 1.8 * lowK) * 0.94 * sub * dt;                       // poussee d'Archimede : le poids est quasi annule
      // v325 : LA PLONGEE. Nez vers le bas, l'engin se laisse tomber de plus en plus vite (la trainee s'efface, la vitesse maximale monte jusqu'a 300 km/h au bout de ~3 s) : redescendre la fosse ne prend plus 30 s
      const dive = U.clamp((-rk.fwd.y - 0.35) / 0.45, 0, 1); ev.diveT = dive > 0 ? Math.min(4, (ev.diveT || 0) + dt) : Math.max(0, (ev.diveT || 0) - 2 * dt);
      const dK = dive * U.clamp(ev.diveT / 3, 0, 1);
      const vW = VW[Math.min(3, r.tier)] + (r.tier >= 2 ? 1.2 * r.s : 0), vWd = vW + (78 - vW) * dK, sr = rk.vel.length();
      const imp = r.tier < 2 ? Math.max(0.3, 1 - 0.1 * r.n) : 1;   // les ailerons et les ailes affinent l'engin : moins de trainee a chaque amelioration
      rk.vel.multiplyScalar(Math.exp(-(rk.thrusting ? 0.07 : r.tier < 2 ? (0.02 + 0.003 * sr) * imp : 0.2 + 0.019 * sr) * (1 - 0.9 * dK) * sub * dt));   // trainee de l'eau : forte quand on glisse, faible moteur allume (c'est le plafond de vitesse qui limite)
      if (dK > 0) rk.vel.y -= 24 * dK * sub * dt;
      if (sr > vWd) rk.vel.multiplyScalar(1 - Math.min(1, (rk.thrusting ? 1.6 : 3.2) * dt * sub) * (1 - vWd / sr));   // vitesse maximale du palier
      const dry = r.tier < 2 || rk.fuel <= 0.01, sr2 = rk.vel.length();
      if (rk.vel.y < 0) rk.vel.y *= Math.exp(-2.8 * (1 - dive) * sub * dt);   // l'eau amortit la plongee : l'engin se redresse au lieu de s'enfoncer jusqu'au fond
      rk.vel.x += fx; rk.vel.z += fz;
      // v286 : JAMAIS de mort a cause de la vitesse. Sans moteur (ou sans carburant), a faible vitesse l'engin perd sa flottabilite : le nez plonge doucement, il coule jusqu'au fond ; c'est le contact avec le sol qui met fin au vol
      if (dry && g.flightTime > 1.5) { const kk = U.clamp(1 - sr2 / 12, 0, 1); if (kk > 0) { rk.vel.y -= gr * 1.5 * kk * sub * dt; g.input.addAim(0, -0.7 * kk * dt); if (kk > 0.45 && !ev._warn) { ev._warn = 1; if (CC.L1) CC.L1.msg(g, r.tier < 2 ? 'PLUS D ELAN' : 'PLUS DE CARBURANT', 1.6, '#ffd070'); } } else if (sr2 > 10) ev._warn = 0; }
    } else {
      // a l'air libre : l'hydro-missile est un mauvais voilier : plus lourd, il perd de l'energie
      rk.vel.y -= gr * 0.32 * dt; rk.vel.multiplyScalar(Math.exp(-0.06 * dt)); ev.sinkT = 0;
    }
  };
})();
