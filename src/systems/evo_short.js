/* v360 : MVP « niveau court en pente » (?short=1) : la prairie penchee, on devale la colline, la ligne d'arrivee (un grand mur a damier) est
 * visible au loin, le niveau se finit en une dizaine de secondes en la franchissant. Rien ne change sans ?short=1. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const on = (/[?&](short=1|mvp=[abc])/.test(location.search) || !!window.CC_MVP), SL = 0.16, FIN = 470, LEN = 560;   // pente : 0,16 m de descente par metre (environ 9 degres)
  E.shortOn = () => on;
  if (!on) return;
  E.shortSlope = SL; E.shortFin = FIN;
  const T3 = THREE, V = T3.Vector3;
  const _pr = E.preRel;
  E.preRel = (d) => { const b = _pr ? _pr(d) : 0; if (E.shortTiltOff) return b; return d <= 0 ? b : b - SL * (d < 60 ? d * d / 120 : d - 30); };   // la prairie penche des le depart, en douceur
  const _pp = E.padPitch; E.padPitch = () => (E.isS2() ? (_pp ? _pp() : null) : (E.shortTiltOff ? (E.shortPad === undefined ? 0 : E.shortPad) : -8));   // la rampe de lancement penche comme la pente
  const _ld = E.levelDef;
  E.levelDef = (g) => {
    if (E.isS2()) return _ld(g);
    const th = CC.LM.THEMES[0], Zs = CC.Zones.defs.campagne.scenes, sc = ['rampe', 'camp'];
    let len = 80; E.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { E.chapters.push({ d: len - 80, i: E.chapters.length, name: n === 'rampe' ? 'LE DEPART' : 'LE CAMP', key: n }); len += s.len[0]; } }
    return E.baseDef({ zone: 'campagne', len: LEN, scenes: sc, order: new Array(90).fill('campagne'), theme: th, hp: 1, bossEnt: null });
  };
  // la ligne d'arrivee : un grand mur a damier au travers de la piste, visible de loin
  const gate = (g) => {
    const run = g.endlessRun, T = run.T; if (g._shortGate && g._shortGate.run === run && g._shortGate.fin === (E.shortFin || FIN)) return;
    if (g._shortGate) g.scene.remove(g._shortGate.grp);
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c2 = cv.getContext('2d'); c2.fillStyle = '#ffffff'; c2.fillRect(0, 0, 64, 64); c2.fillStyle = '#111111'; c2.fillRect(0, 0, 32, 32); c2.fillRect(32, 32, 32, 32);
    const W2 = 1400, H2 = 150, sq = 3.2, tx = new T3.CanvasTexture(cv); tx.wrapS = tx.wrapT = T3.RepeatWrapping; tx.repeat.set(W2 / (2 * sq), H2 / (2 * sq)); tx.magFilter = T3.NearestFilter;
    const grp = new T3.Group(), pl = new T3.Mesh(new T3.PlaneGeometry(W2, H2), new T3.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0.42, side: T3.DoubleSide, depthWrite: false, fog: false })); pl.position.y = H2 / 2 - 14; grp.add(pl);
    const FN = E.shortFin || FIN, a = T.at(FN - 6, T.laneX(FN), 0), b = T.at(FN + 6, T.laneX(FN), 0), p = T.at(FN, T.laneX(FN), 0);
    grp.position.set(p[0], p[1], p[2]); grp.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]); g.scene.add(grp); g._shortGate = { run, grp, fin: FN };
  };
  const _tk = E.tick;
  E.tick = (g, dt) => {
    _tk(g, dt);
    const run = g.endlessRun; if (E.isS2() || !g.evo || g.evo.preview || !run) return;
    try { gate(g); } catch (e) { /* decor facultatif */ }
    if (g.state === 'FLIGHT' && g.rocket.active && !g.evoFinish && run.dist > (E.shortFin || FIN) && E.finishRun) E.finishRun(g);
    if (g.evoFinish && g.rocket.active) g.rocket.vel.multiplyScalar(Math.exp(-dt * 3));   // apres l'arrivee la fusee freine
  };
})();
