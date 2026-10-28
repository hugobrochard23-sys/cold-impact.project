/* v281 : NIVEAU 2, ZONE 2 — LE BARRAGE (provisoire : sera remplace) */
(function () {
  const Z = CC.Zones, EVO = CC.EVO, R = EVO && EVO.riv; if (!R) return;
  const SC = Z.defs.ocean.scenes, { LA, LB, LF, rel, SEAB } = R;
  SC.barrage = { len: [LB, LB], noDoor: true, noChaos: true, gw: 125, grass: false, pin: (T, sc) => ({ lx: 0, fy: () => -60 - T.base(0) + T.base(0), from: 24, to: sc.d1 - sc.d0 - 24 }), relief(T, sc) { return rel(sc, () => -80 - SEAB); }, build(S) { } };
  SC.arrivee = { len: [LF, LF], noDoor: true, noChaos: true, gw: 125, grass: false, pin: (T, sc) => ({ lx: 0, fy: () => -60, from: 24, to: sc.d1 - sc.d0 - 24 }), relief(T, sc) { return rel(sc, () => -80 - SEAB); }, build(S) { } };
})();
