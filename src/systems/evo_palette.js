/* v183 : PALETTE UNIQUE du decor du niveau 1 (une seule direction artistique : prairie low-poly lumineuse et naturelle) : ciel, brume, herbe, briques, beton. */
(function () {
  const EVO = CC.EVO; if (!EVO || !EVO.on) return;
  const pal = { sky: ['#1676e8', '#9fd8fa', '#bfe0f2'], grass: ['#5c9e3a', '#4d8d36', '#7db04e'], brick: '#ffd2bc', conc: '#f0e8d8' };
  CC.PALETTE = { mat: { brick: pal.brick, concrete: pal.conc } };
  // ciel et brume (aube, matin, jour)
  const M = EVO.MOOD || {}, C3 = (h) => new THREE.Color(h);
  for (const k of ['dawn', 'morning', 'day']) { const m = M[k]; if (!m) continue; m.top = C3(pal.sky[0]); m.hor = C3(pal.sky[1]); m.fog = C3(pal.sky[2]); }
  // herbe
  const Z = CC.Zones; if (Z && Z.evoGC) { Z.evoGC.a.set(pal.grass[0]); Z.evoGC.b.set(pal.grass[1]); Z.evoGC.f.set(pal.grass[2]); }
})();
