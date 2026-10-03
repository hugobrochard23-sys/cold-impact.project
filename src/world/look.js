/* v081 : LOOKS — la même zone ne se ressemble plus d'un passage à l'autre. Chaque niveau reçoit un « look » parmi six : une teinte globale (multipliée
 * sur tous les matériaux du décor), un remplacement de matériaux (façades de sable, de brique, de verre bleuté, de menthe, blanches…), une ambiance de ciel
 * (jour, couchant rosé, crépuscule violet, ciel de braise, brume toxique, jour glacé), une hauteur d'immeubles. Les zones qui reviennent (niveau n, n+10, n+20…)
 * ont ainsi d'autres couleurs et un autre caractère. Banc de test : ?look=0..5 force le look.
 * Les envs « génériques » ne s'appliquent pas aux zones fermées (métro, usine, pièce, mer) qui gardent leur propre lumière mais reçoivent teinte et matériaux. */
(function () {
  const G = CC.Gen, U = CC.U;
  const E = (id, o) => G.Envs.add(id, o);
  const SUN = (r, lo, hi) => { const a = r() * 6.283, y = r.between([lo, hi]), h = Math.sqrt(Math.max(0, 1 - y * y)); return [G.round(Math.cos(a) * h, 3), G.round(y, 3), G.round(Math.sin(a) * h, 3)]; };
  E('rosyDawn', { label: 'AUBE ROSE', dark: 0.12, vis: 0.95, skyline: '#f0c0c0', make: (r) => ({
    sky: { top: '#6a7ab8', horizon: '#ffc8b8', bottom: '#e8a8a8', sunColor: '#fff0d8', sunSize: 520 },
    fog: { color: '#f0c0b8', near: 150, far: r.between([900, 1100]) },
    hemi: { sky: '#ffe0d8', ground: '#8a6a74', intensity: 0.78 }, ambient: { color: '#ffe8e0', intensity: 0.28 },
    sun: { color: '#ffc8a0', intensity: 0.75, dir: SUN(r, [0.16, 0.3]) },
    postfx: { vignette: 0.45, vignetteColor: '#3a1a2a', halftone: 0.35, lift: '#100810', saturation: 1.02 },
  }) });
  E('iceDay', { label: 'JOUR GLACE', dark: 0, vis: 1, skyline: '#e8f2fa', make: (r) => ({
    sky: { top: '#7aaee0', horizon: '#f0f8ff', bottom: '#d8e8f4', sunColor: '#ffffff', sunSize: 480 },
    fog: { color: '#e4f0fa', near: 140, far: r.between([800, 980]) },
    hemi: { sky: '#e4f0ff', ground: '#9aa8b8', intensity: 0.85 }, ambient: { color: '#f0f8ff', intensity: 0.34 },
    sun: { color: '#f4f8ff', intensity: 0.8, dir: SUN(r, [0.35, 0.55]) },
    postfx: { vignette: 0.42, vignetteColor: '#1a2a44', halftone: 0.35, lift: '#060a10', saturation: 0.9 },
  }) });
  E('toxicHaze', { label: 'BRUME VERTE', dark: 0.25, vis: 0.7, skyline: '#8aa070', make: (r) => ({
    sky: { top: '#3a5a40', horizon: '#c8e0a0', bottom: '#7a9a60' },
    fog: { color: '#a8c088', near: 60, far: r.between([620, 760]) },
    hemi: { sky: '#d8f0b8', ground: '#4a5a38', intensity: 0.82 }, ambient: { color: '#e0f0c8', intensity: 0.3 },
    sun: { color: '#fff4b0', intensity: 0.55, dir: SUN(r, [0.3, 0.5]) },
    postfx: { vignette: 0.55, vignetteColor: '#0a1a08', halftone: 0.4, lift: '#060e04', saturation: 1.0 },
  }) });
  E('emberSky', { label: 'CIEL DE BRAISE', dark: 0.2, vis: 0.85, skyline: '#c0704a', make: (r) => ({
    sky: { top: '#3a2040', horizon: '#ff9a50', bottom: '#a04a30', sunColor: '#ffd090', sunSize: 640 },
    fog: { color: '#c0704a', near: 110, far: r.between([760, 900]) },
    hemi: { sky: '#ffc8a0', ground: '#5a3028', intensity: 0.72 }, ambient: { color: '#ffd8b8', intensity: 0.26 },
    sun: { color: '#ff9a50', intensity: 0.8, dir: SUN(r, [0.1, 0.2]) },
    postfx: { vignette: 0.5, vignetteColor: '#2a0a08', halftone: 0.4, lift: '#100404', saturation: 1.05 },
  }) });
  E('twilight', { label: 'CREPUSCULE', dark: 0.3, vis: 0.75, skyline: '#4a3a6a', make: (r) => ({
    sky: { top: '#1c1a4a', horizon: '#c070a0', bottom: '#2a2050', stars: true, sunColor: '#ffb0d0', sunSize: 420 },
    fog: { color: '#5a3a70', near: 70, far: r.between([640, 780]) },
    hemi: { sky: '#a090d0', ground: '#2a2040', intensity: 0.85 }, ambient: { color: '#b0a0d8', intensity: 0.34 },
    sun: { color: '#ffa0c8', intensity: 0.55, dir: SUN(r, [0.1, 0.22]) },
    postfx: { vignette: 0.5, vignetteColor: '#100820', chromatic: 0.003, halftone: 0.3, lift: '#100a1c', saturation: 1.05, bloomThreshold: 0.7, bloomStrength: 0.5 },
  }) });


  // v095 : six ambiances de plus (desert, orage, aurore, heure doree, lune rouge, brume matinale)
  const ENV2 = (id, label, dark, vis, sky, fog, hemi, amb, sun, fx) => E(id, { label, dark, vis, skyline: fog.color, make: (r) => ({
    sky, fog: { color: fog.color, near: fog.near, far: r.between(fog.far) }, hemi, ambient: amb,
    sun: { color: sun.color, intensity: sun.intensity, dir: SUN(r, sun.y) }, postfx: Object.assign({ vignette: 0.45, vignetteColor: '#101018', halftone: 0.35, lift: '#080808', saturation: 1.0 }, fx || {}),
  }) });
  ENV2('sandStorm', 'TEMPETE DE SABLE', 0.1, 0.7, { top: '#c08a50', horizon: '#f4d49a', bottom: '#d8a468', sunColor: '#fff0c0', sunSize: 560 }, { color: '#e0b878', near: 50, far: [560, 700] }, { sky: '#ffe0b0', ground: '#8a6a40', intensity: 0.85 }, { color: '#ffe8c8', intensity: 0.3 }, { color: '#ffe0a0', intensity: 0.8, y: [0.35, 0.55] }, { saturation: 1.05 });
  ENV2('stormGrey', 'ORAGE', 0.3, 0.65, { top: '#2a2f3a', horizon: '#7a8494', bottom: '#4a5260' }, { color: '#6a7482', near: 40, far: [520, 680] }, { sky: '#a8b4c8', ground: '#303640', intensity: 0.7 }, { color: '#b8c4d8', intensity: 0.26 }, { color: '#c8d4e8', intensity: 0.45, y: [0.3, 0.5] }, { vignette: 0.55, saturation: 0.85 });
  ENV2('aurora', 'AURORE', 0.45, 0.8, { top: '#0a1a30', horizon: '#38c8a0', bottom: '#102a3a', stars: true, sunColor: '#80ffd0', sunSize: 380 }, { color: '#1a4a50', near: 80, far: [700, 860] }, { sky: '#80f0d0', ground: '#102830', intensity: 0.8 }, { color: '#90ffe0', intensity: 0.3 }, { color: '#80ffd0', intensity: 0.5, y: [0.15, 0.3] }, { bloomThreshold: 0.7, bloomStrength: 0.45, saturation: 1.1 });
  ENV2('goldenHour', 'HEURE DOREE', 0.05, 0.95, { top: '#5a8ad0', horizon: '#ffd890', bottom: '#f0b868', sunColor: '#fff4c0', sunSize: 600 }, { color: '#f4cf90', near: 160, far: [920, 1100] }, { sky: '#ffe8b8', ground: '#8a7048', intensity: 0.82 }, { color: '#fff0d0', intensity: 0.3 }, { color: '#ffd890', intensity: 0.9, y: [0.18, 0.3] }, { saturation: 1.08 });
  ENV2('bloodMoon', 'LUNE ROUGE', 0.55, 0.75, { top: '#1a0a14', horizon: '#a02a30', bottom: '#3a1018', stars: true, sunColor: '#ff6a5a', sunSize: 700 }, { color: '#4a1a24', near: 70, far: [640, 780] }, { sky: '#d08080', ground: '#2a1018', intensity: 0.75 }, { color: '#e0a0a0', intensity: 0.28 }, { color: '#ff7060', intensity: 0.55, y: [0.12, 0.25] }, { vignette: 0.55, saturation: 1.1 });
  ENV2('mistMorning', 'BRUME MATINALE', 0, 0.6, { top: '#9ab4d0', horizon: '#eef2f6', bottom: '#d0dae4' }, { color: '#e0e8ee', near: 30, far: [460, 600] }, { sky: '#f0f6ff', ground: '#98a4b0', intensity: 0.88 }, { color: '#f4f8ff', intensity: 0.36 }, { color: '#fff8f0', intensity: 0.6, y: [0.3, 0.45] }, { saturation: 0.85 });

  // les six looks ; map = remplacement de matériaux ; h = échelle de hauteur des immeubles ; bias = ambiance voulue
  const LOOKS = [
    { name: 'JOUR', mul: '#ffffff', map: {}, h: 1.0, bias: 'day', top: null },
    { name: 'COUCHANT', mul: '#ffe2c4', map: { facade: 'facadeOchre', facadePink: 'facadeSand', facadeTan: 'facadeBrick', concrete: 'concreteWarm' }, h: 1.0, bias: 'dusk', top: 'tank' },
    { name: 'NUIT', mul: '#c8d0ff', map: { facade: 'facadeNavy', facadePink: 'facadeNavy', facadeTan: 'facadeDark' }, h: 1.15, bias: 'night', top: 'mast', round: 0.2 },
    { name: 'GIVRE', mul: '#d6eaff', map: { facade: 'facadeWhite', facadePink: 'facadeGlass', facadeTan: 'facadeWhite', concrete: 'white', concreteWarm: 'white', dirt: 'white', grass: 'white', rock: 'white', sand: 'white', brick: 'white', planks: 'white' }, h: 0.9, bias: 'ice', top: 'snow' },
    { name: 'BRIQUE', mul: '#ffdccc', map: { facade: 'facadeBrick', facadePink: 'facadeBrick', facadeTan: 'facadeOchre', concrete: 'concreteWarm' }, h: 0.75, bias: 'dusk2', top: 'gable' },
    { name: 'JADE', mul: '#cdf2e0', map: { facade: 'facadeMint', facadePink: 'facadeGlass', facadeTan: 'facadeMint', concrete: 'concreteDark' }, h: 1.3, bias: 'toxic', top: 'spire', round: 0.4 },
    { name: 'DESERT', mul: '#ffe0b0', map: { facade: 'facadeSand', facadePink: 'facadeSand', facadeTan: 'facadeOchre', concrete: 'concreteWarm', grass: 'sand', dirt: 'sand' }, h: 0.7, bias: 'sand', top: 'tank' },
    { name: 'ORAGE', mul: '#c4ccdc', map: { facade: 'facadeDark', facadePink: 'facadeNavy', facadeTan: 'facadeDark', concrete: 'concreteDark' }, h: 1.1, bias: 'storm', top: 'mast' },
    { name: 'AURORE', mul: '#c0ffe8', map: { facade: 'facadeNavy', facadePink: 'facadeMint', facadeTan: 'facadeGlass' }, h: 1.25, bias: 'aurora', top: 'spire', round: 0.5 },
    { name: 'DORE', mul: '#fff0c0', map: { facade: 'facadeOchre', facadePink: 'facadeOchre', facadeTan: 'facadeSand', concrete: 'concreteWarm' }, h: 1.0, bias: 'golden', top: 'gable' },
    { name: 'LUNE ROUGE', mul: '#ffc4c4', map: { facade: 'facadeBrick', facadePink: 'facadeDark', facadeTan: 'facadeBrick', concrete: 'concreteDark' }, h: 1.2, bias: 'blood', top: 'mast' },
    { name: 'BRUME', mul: '#e8eef4', map: { facade: 'facadeWhite', facadePink: 'facadeGlass', facadeTan: 'facadeWhite' }, h: 1.0, bias: 'mist', top: null },
    { name: 'NEON', mul: '#e0c8ff', map: { facade: 'facadeNavy', facadePink: 'facadeDark', facadeTan: 'facadeNavy' }, h: 1.4, bias: 'night', top: 'spire', round: 0.3 },
    { name: 'OCRE', mul: '#ffd8a0', map: { facade: 'facadeOchre', facadePink: 'facadeBrick', facadeTan: 'facadeOchre', concrete: 'concreteWarm' }, h: 0.85, bias: 'dusk2', top: 'gable' },
    { name: 'VITRE', mul: '#d0e4ff', map: { facade: 'facadeGlass', facadePink: 'facadeGlass', facadeTan: 'facadeGlass' }, h: 1.5, bias: 'day', top: 'spire', round: 0.6 },
    { name: 'CHARBON', mul: '#b0b0bc', map: { facade: 'facadeDark', facadePink: 'facadeDark', facadeTan: 'facadeNavy', concrete: 'concreteDark' }, h: 0.9, bias: 'storm', top: 'mast' },
    { name: 'CORAIL', mul: '#ffd0d8', map: { facade: 'facadeSand', facadePink: 'facadeBrick', facadeTan: 'facadeSand' }, h: 0.95, bias: 'dusk', top: 'tank' },
    { name: 'MENTHE', mul: '#d0ffe8', map: { facade: 'facadeMint', facadePink: 'facadeMint', facadeTan: 'facadeWhite' }, h: 1.1, bias: 'mist', top: 'spire', round: 0.4 },
  ];
  const CLOSED = { eau: 1, metro: 1, usine: 1, mini: 1 };   // zones à lumière propre
  const dk = (id) => (G.Envs.get(id).dark || 0);

  const Look = CC.Look = { cur: null, LOOKS };
  Look.make = (idx) => { const L = LOOKS[((idx | 0) % LOOKS.length + LOOKS.length) % LOOKS.length]; return L; };
  Look.set = (idx) => { Look.cur = idx === null || idx === undefined ? null : Look.make(idx); };
  // ambiances candidates pour une zone (zoneEnvs : celles que la zone propose d'origine)
  Look.pool = (zone, zoneEnvs) => {
    const L = Look.cur; if (!L) return zoneEnvs;
    const own = (f) => { const a = zoneEnvs.filter(f); return a.length ? a : zoneEnvs; };
    if (CLOSED[zone]) return zoneEnvs;
    switch (L.bias) {
      case 'day': return own((e) => dk(e) < 0.1);
      case 'dusk': return zone === 'city' || zone === 'port' || zone === 'tour' || zone === 'chute' ? ['rosyDawn', 'harborDusk'].filter((e) => zone !== 'port' || e) : own((e) => dk(e) >= 0.1 && dk(e) < 0.45).concat(['rosyDawn']);
      case 'dusk2': return ['emberSky'].concat(own((e) => dk(e) >= 0.1 && dk(e) < 0.45));
      case 'night': return zone === 'city' ? ['neonNight'] : ['twilight'];
      case 'ice': return ['iceDay'];
      case 'toxic': return ['toxicHaze'];
      case 'sand': return ['sandStorm']; case 'storm': return ['stormGrey']; case 'aurora': return ['aurora']; case 'golden': return ['goldenHour']; case 'blood': return ['bloodMoon']; case 'mist': return ['mistMorning'];
    }
    return zoneEnvs;
  };
  // sélection d'un look pour un niveau : index fixe (même niveau = même look) ; ?look=N force
  Look.forLevel = (ld) => { const p = new URLSearchParams(location.search).get('look'); return p !== null ? (parseInt(p, 10) || 0) : (ld && ld.look !== undefined ? ld.look : null); };
})();
