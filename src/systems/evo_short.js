/* v360 : MVP « niveau court en pente » (?short=1) : la prairie penchee, on devale la colline, la ligne d'arrivee (la cible finale) est visible
 * au loin, le niveau se finit en une dizaine de secondes. Rien ne change sans ?short=1. */
(function () {
  const E = CC.EVO; if (!E || !E.on) return;
  const on = /[?&]short=1/.test(location.search), SL = 0.16;   // pente : 0,16 m de descente par metre (environ 9 degres)
  E.shortOn = () => on;
  if (!on) return;
  E.shortSlope = SL;
  const _pr = E.preRel;
  E.preRel = (d) => { const b = _pr ? _pr(d) : 0; return d <= 0 ? b : b - SL * (d < 60 ? d * d / 120 : d - 30); };   // la prairie penche des le depart, en douceur
  const _ld = E.levelDef;
  E.levelDef = (g) => {
    const th = CC.LM.THEMES[0], Zs = CC.Zones.defs.campagne.scenes, sc = ['rampe', 'camp'], LEN = 560;
    let len = 80; E.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { E.chapters.push({ d: len - 80, i: E.chapters.length, name: n === 'rampe' ? 'LE DEPART' : 'LE CAMP', key: n }); len += s.len[0]; } }
    return E.baseDef({ zone: 'campagne', len: LEN, scenes: sc, order: new Array(90).fill('campagne'), theme: th, hp: 1 });
  };
})();
