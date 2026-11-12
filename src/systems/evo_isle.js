/* v374 : L'ILE 1 refaite comme un VRAI parcours de course (inspire des jeux de course a obstacles) : 9 sections, chacune avec sa couleur et son obstacle, REPETE en rangee ;
 * largeur qui change (arenes larges, pont etroit), voies separees par un muret gonflable, pente forte, une remontee, une section inclinee ;
 * sol = surfaces de couleur unie avec marquages (herbe seulement en decor autour du hangar) ; rambardes = piles de disques gonflables ; aucun arbre ni pierre ;
 * obstacles mobiles ACCROCHES a des structures (portiques, tours, mats, canons) ; la porte-herse ne descend jamais sur la fusee qui approche. Aucune texture (couleurs unies, un drapeau). */
(function () {
  const E = CC.EVO; if (!E || !E.on || !E.mkCourse) return;
  const T3 = THREE, U = CC.U, Z = CC.Zones, D = Z && Z.defs && Z.defs.campagne; if (!D) return;
  const FLY = 11, TOP = 9, S0 = -125;
  const PAL = { blue: '#3aa6f0', pink: '#ff6fae', teal: '#42d6a4', yellow: '#ffc24a', purple: '#a77bff', asph: '#4b5059', asph2: '#585d67', sand: '#a99c7c', conc: '#8d9096', ice: '#cdeeff', ice2: '#a9dcf8', snow: '#f1faff', dune: '#e9c47e', dune2: '#d9a55b', brick: '#c98b4a', steel: '#8b95a3', steel2: '#6f7a88', hazard: '#d9a21b', moss: '#5f9e3c', mud: '#8a6a40', wood: '#a67c48', clay: '#c08550' };
  // les sections : nom, longueur, virage (+ droite), pente (descente ; negatif = on remonte), demi-largeur de l'ile, couleur du sol, inclinaison laterale
  const SEC_ARCH = [   // ARCHIPEL : 15 obstacles differents, un seul exemplaire chacun ; voies doubles, DEUX ETAGES, vides
    { n: 'depart', len: 170, turn: 0, slope: 0, W: 56, col: 'blue' },
    { n: 'bumpers', len: 230, turn: 30, slope: -0.14, W: 56, col: 'yellow' },
    { n: 'marteaux', len: 240, turn: 60, slope: 0.2, W: 44, col: 'pink' },
    { n: 'pont', len: 200, turn: -50, slope: 0.1, W: 24, col: 'teal' },
    { n: 'vide', len: 100, turn: 0, slope: 0, W: 0, col: 'blue' },
    { n: 'ballons', len: 200, turn: 90, slope: -0.16, W: 46, col: 'purple' },
    { n: 'trampolines', len: 250, turn: -40, slope: 0.22, W: 54, col: 'teal' },
    { n: 'etages', len: 290, turn: -80, slope: -0.12, W: 46, col: 'yellow' },
    { n: 'tourniquet', len: 210, turn: 70, slope: 0.22, W: 52, col: 'pink', bank: 0.14 },
    { n: 'gommes', len: 240, turn: 30, slope: 0.2, W: 44, col: 'blue' },
    { n: 'hublot', len: 210, turn: -40, slope: -0.12, W: 52, col: 'purple' },
    { n: 'arrivee', len: 190, turn: 0, slope: 0.06, W: 58, col: 'blue' },
  ];
  const SEC_RANGE = [   // TERRAIN D'ESSAI : base militaire ; 15 obstacles differents, un seul exemplaire chacun ; voies doubles, DEUX ETAGES
    { n: 'lancement', len: 170, turn: 0, slope: 0, W: 54, col: 'asph' },
    { n: 'tir', len: 220, turn: -30, slope: 0.06, W: 50, col: 'sand' },
    { n: 'falaise', len: 250, turn: 50, slope: -0.16, W: 44, col: 'asph2' },
    { n: 'montee', len: 230, turn: 0, slope: 0.18, W: 44, col: 'conc' },
    { n: 'vide', len: 90, turn: 0, slope: 0, W: 0, col: 'asph' },
    { n: 'canons', len: 240, turn: 40, slope: -0.1, W: 46, col: 'sand' },
    { n: 'base', len: 290, turn: -60, slope: 0.14, W: 46, col: 'asph' },
    { n: 'projecteurs', len: 200, turn: 30, slope: -0.12, W: 46, col: 'asph2' },
    { n: 'pont', len: 220, turn: 0, slope: 0.1, W: 26, col: 'conc' },
    { n: 'grue', len: 200, turn: -40, slope: -0.1, W: 48, col: 'conc' },
    { n: 'silo', len: 220, turn: 0, slope: 0.12, W: 44, col: 'sand' },
    { n: 'arrivee', len: 190, turn: -20, slope: 0.05, W: 52, col: 'asph' },
  ];
  const SEC_JUNGLE = [   // JUNGLE : 14 obstacles differents, un seul exemplaire chacun ; voies doubles, DEUX ETAGES (sous la canopee / au-dessus), cascade, grotte
    { n: 'depart', len: 170, turn: 0, slope: 0, W: 54, col: 'moss' },
    { n: 'lianes', len: 200, turn: 40, slope: 0.08, W: 46, col: 'mud' },
    { n: 'rondins', len: 200, turn: -50, slope: -0.14, W: 46, col: 'wood' },
    { n: 'pont', len: 190, turn: 0, slope: 0.1, W: 26, col: 'clay' },
    { n: 'vide', len: 120, turn: 0, slope: 0.02, W: 0, col: 'moss' },
    { n: 'fleurs', len: 240, turn: 50, slope: 0.22, W: 44, col: 'moss' },
    { n: 'cascade', len: 210, turn: -30, slope: 0.26, W: 46, col: 'mud' },
    { n: 'canopee', len: 290, turn: -40, slope: -0.16, W: 46, col: 'wood' },
    { n: 'racines', len: 220, turn: 40, slope: 0.14, W: 46, col: 'moss' },
    { n: 'grotte', len: 200, turn: 0, slope: 0.05, W: 30, col: 'clay' },
    { n: 'totems', len: 220, turn: 40, slope: -0.1, W: 48, col: 'moss' },
    { n: 'arrivee', len: 200, turn: -30, slope: 0.06, W: 52, col: 'mud' },
  ];
  const SEC_ICE = [   // GLACE : 13 obstacles differents, un seul exemplaire chacun ; voies doubles, DEUX ETAGES (igloos / au-dessus), glissade, pont de glace
    { n: 'depart', len: 170, turn: 0, slope: 0, W: 54, col: 'snow' },
    { n: 'patinoire', len: 230, turn: 40, slope: 0.07, W: 48, col: 'ice' },
    { n: 'vide', len: 100, turn: 0, slope: 0.04, W: 0, col: 'ice' },
    { n: 'stalactites', len: 230, turn: -50, slope: 0.14, W: 46, col: 'ice2' },
    { n: 'glissade', len: 250, turn: 30, slope: -0.14, W: 44, col: 'snow' },
    { n: 'boule', len: 210, turn: -40, slope: 0.2, W: 46, col: 'ice' },
    { n: 'pontglace', len: 200, turn: 20, slope: -0.1, W: 15, col: 'ice2' },
    { n: 'igloos', len: 290, turn: 60, slope: -0.16, W: 46, col: 'snow' },
    { n: 'lac', len: 220, turn: -30, slope: 0.18, W: 50, col: 'ice' },
    { n: 'arrivee', len: 200, turn: 0, slope: 0.05, W: 54, col: 'snow' },
  ];
  const SEC_DESERT = [   // DESERT : 12 obstacles differents ; voies doubles, DEUX ETAGES (temple), surf de dune, tempete, salle des piliers
    { n: 'depart', len: 170, turn: 0, slope: 0, W: 54, col: 'dune' },
    { n: 'dunes', len: 260, turn: 40, slope: 0.1, W: 44, col: 'dune2' },
    { n: 'pistons', len: 310, turn: -40, slope: 0.14, W: 46, col: 'brick' },
    { n: 'chute', len: 310, turn: 30, slope: 0.3, W: 46, col: 'dune' },
    { n: 'temple', len: 300, turn: -50, slope: -0.14, W: 46, col: 'dune2' },
    { n: 'vide', len: 100, turn: 0, slope: 0, W: 0, col: 'dune' },
    { n: 'canyon', len: 340, turn: 60, slope: 0.12, W: 40, col: 'dune' },
    { n: 'hypostyle', len: 290, turn: -40, slope: -0.1, W: 46, col: 'brick' },
    { n: 'arrivee', len: 210, turn: 0, slope: 0.05, W: 54, col: 'dune' },
  ];
  const SEC_FACTORY = [   // USINE : 11 obstacles differents ; voies doubles, DEUX ETAGES, convoyeurs, TUYAU-LOOPING
    { n: 'depart', len: 170, turn: 0, slope: 0, W: 54, col: 'steel' },
    { n: 'engrenages', len: 300, turn: 40, slope: 0.07, W: 48, col: 'steel2' },
    { n: 'presses', len: 250, turn: -50, slope: 0.1, W: 44, col: 'hazard' },
    { n: 'convoyeur', len: 290, turn: 30, slope: -0.1, W: 44, col: 'steel' },
    { n: 'vide', len: 110, turn: 0, slope: 0.04, W: 0, col: 'steel' },
    { n: 'usine', len: 300, turn: 60, slope: -0.14, W: 46, col: 'steel2' },
    { n: 'vapeur', len: 290, turn: -40, slope: 0.14, W: 46, col: 'hazard' },
    { n: 'arcs', len: 290, turn: 30, slope: -0.1, W: 48, col: 'steel' },
    { n: 'arrivee', len: 200, turn: 0, slope: 0.05, W: 54, col: 'steel' },
  ];
  const CEIL = {   // hauteur maximale de vol au-dessus du tablier dans chaque section : on ne peut plus passer au-dessus des obstacles
    arch: { bumpers: 14, marteaux: 11, pont: 22, ballons: 14, trampolines: 14, etages: 62, tourniquet: 22, gommes: 14, hublot: 22 },
    range: { tir: 22, falaise: 22, montee: 22, canons: 16, base: 62, projecteurs: 22, pont: 14, grue: 22, silo: 22 },
    ice: { patinoire: 22, stalactites: 22, glissade: 16, boule: 12, pontglace: 22, igloos: 62, lac: 18 },
    desert: { dunes: 18, pistons: 22, chute: 22, temple: 62, canyon: 22, hypostyle: 14 },
    factory: { engrenages: 22, presses: 22, convoyeur: 22, usine: 62, vapeur: 22, arcs: 22 },
    jungle: { lianes: 10, rondins: 11, pont: 16, fleurs: 16, cascade: 20, canopee: 62, racines: 22, grotte: 14, totems: 22 } };
  for (const [m, arr] of [['arch', SEC_ARCH], ['range', SEC_RANGE], ['jungle', SEC_JUNGLE], ['ice', SEC_ICE], ['desert', SEC_DESERT], ['factory', SEC_FACTORY]]) for (const q of arr) if (CEIL[m][q.n]) q.ceil = CEIL[m][q.n];
  let SEC = SEC_ARCH;
  E.jungleShape = SEC_JUNGLE.map((q, i) => [q.len, q.turn, q.slope, FLY, i === SEC_JUNGLE.length - 1 ? 24 : 17, TOP]);
  E.iceShape = SEC_ICE.map((q, i) => [q.len, q.turn, q.slope, FLY, i === SEC_ICE.length - 1 ? 24 : 17, TOP]);
  E.desertShape = SEC_DESERT.map((q, i) => [q.len, q.turn, q.slope, FLY, i === SEC_DESERT.length - 1 ? 24 : 17, TOP]);
  E.factoryShape = SEC_FACTORY.map((q, i) => [q.len, q.turn, q.slope, FLY, i === SEC_FACTORY.length - 1 ? 24 : 17, TOP]);
  const MT = {   // l'identite visuelle de chaque carte : bord, decalcomanies, barrieres, couleur des structures, tuyaux, arrivee
    arch: { rim: '#7a3cf0', hz: ['#2a2540', '#ffffff'], chv: '#ffffff', rail: { g: 'pill', a: '#ff4f9a', b: '#ffffff', h: '#ffd23a' }, stone: ['#f6eaff', '#e3cffb', '#ffd8ec'], tube: { cols: ['#ff7ab8', '#ffffff'], accent: '#ffd23a', op: 0.6 }, fin: ['#7a3cf0', '#ff4f9a', '#ffd23a'] },
    range: { rim: '#2f3238', hz: ['#1d1e22', '#f2c230'], chv: '#f2c230', rail: { g: 'box', a: '#d9d9d9', b: '#f2c230', h: '#d33a2a' }, stone: ['#8f959c', '#7e848b', '#a1a7ad'], tube: { cols: ['#6b7280', '#4a5160'], accent: '#f2c230', op: 1 }, fin: ['#4a5160', '#2f3238', '#d9a21b'] },
    jungle: { rim: '#3a5a22', hz: ['#3a2a14', '#9ad25a'], chv: '#e8f5c0', rail: { g: 'log', a: '#7a5634', b: '#6b4a2a', h: '#4e9a3a' }, stone: ['#a8743f', '#8a5a2c', '#c08a52'], tube: { cols: ['#8a5a2c', '#6b4a22'], accent: '#58b04a', op: 1 }, fin: ['#7a5634', '#3f9a44', '#ffd23a'] },
    ice: { rim: '#6fb8e8', hz: ['#1a2a4a', '#ff4fd8'], chv: '#ffffff', rail: { g: 'pill', a: '#ffffff', b: '#9fdcff', h: '#ff4fd8' }, stone: ['#e8f6ff', '#c6e6fb', '#ffd0f0'], tube: { cols: ['#bfe8ff', '#ffffff'], accent: '#ff4fd8', op: 0.55 }, fin: ['#3f8fd8', '#e8f6ff', '#ff4fd8'] },
    desert: { rim: '#b9793a', hz: ['#5a3a1a', '#2fb8b0'], chv: '#fff2c4', rail: { g: 'box', a: '#e8c27a', b: '#c98b4a', h: '#2fb8b0' }, stone: ['#e0b878', '#c99a5c', '#f0d29a'], tube: { cols: ['#d9a55b', '#b9793a'], accent: '#2fb8b0', op: 1 }, fin: ['#b9793a', '#2fb8b0', '#ffd23a'] },
    factory: { rim: '#3a3f4a', hz: ['#1d1e22', '#f0b429'], chv: '#f0b429', rail: { g: 'box', a: '#f0b429', b: '#2a2d33', h: '#ff6a1a' }, stone: ['#98a2b0', '#7c8696', '#f0b429'], tube: { cols: ['#8b95a3', '#6f7a88'], accent: '#f0b429', op: 1 }, fin: ['#5a6472', '#f0b429', '#ff6a1a'] },
  };
  E.rangeShape = SEC_RANGE.map((s, i) => [s.len, s.turn, s.slope, FLY, i === SEC_RANGE.length - 1 ? 24 : 17, TOP]);
  E.isleShape = SEC.map((s, i) => [s.len, s.turn, s.slope, FLY, i === SEC.length - 1 ? 24 : 17, TOP]);
  const STARTS = []; const calcStarts = () => { STARTS.length = 0; let a = 0; for (const s of SEC) { STARTS.push(a); a += s.len; } }; calcStarts();
  const secAt = (d) => { let i = 0; for (let k = 0; k < SEC.length; k++) if (d >= STARTS[k]) i = k; return i; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const blend = (d, key, def) => {   // valeur d'une section, fondue sur 22 m de part et d'autre de chaque frontiere
    const i = secAt(Math.max(0, d)), v = (k) => (SEC[k][key] !== undefined ? SEC[k][key] : def); let w = v(i);
    const b0 = d - STARTS[i], b1 = (i + 1 < SEC.length ? STARTS[i + 1] : 1e9) - d;
    if (i > 0 && b0 < 22) w = lerp(v(i - 1), w, 0.5 + 0.5 * Math.max(0, b0) / 22);
    if (i + 1 < SEC.length && b1 < 22) w = lerp(v(i + 1), w, 0.5 + 0.5 * b1 / 22);
    return w;
  };
  const mkW = (dEnd) => (d) => {
    if (d <= S0 || d >= dEnd) return 0; let w = blend(d, 'W', 50);
    if (d < -35) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d + 35) / (S0 + 35), 2)));
    if (d > dEnd - 70) w *= Math.sqrt(Math.max(0, 1 - Math.pow((d - (dEnd - 70)) / 70, 2)));
    return w;
  };
  E.mkIsle = (shape, variant, map) => {
    SEC = ({ range: SEC_RANGE, jungle: SEC_JUNGLE, ice: SEC_ICE, desert: SEC_DESERT, factory: SEC_FACTORY })[map] || SEC_ARCH; calcStarts(); RIM.set((MT[map] || MT.arch).rim);
    const C = E.mkCourse(shape, { fl: FLY, sw: 6 }), dEnd = C.len + 90, mir = variant === 1, W = mkW(dEnd);
    C.isle = { map: map || 'arch', boxes: [], variant: variant || 0, mir, W, dEnd, starts: STARTS, bank: (d) => (mir ? -1 : 1) * blend(d, 'bank', 0), ceilAt: (d) => blend(d, 'ceil', 26), tubes: [], winds: [], slick: [], evD: [], paths: [], PY: C.rel(C.len) - 90, sx: variant === 2 ? -1 : 1 };
    try { CC.CONFIG.render.viewDist = 480; } catch (e) { /* ignore */ }   // on voit les obstacles de plus loin
    if (map === 'range') {   // zones pleines (repere piste : [d0, d1, x0, x1, hauteur0, hauteur1]) : hangar, tours de la citadelle
      const hg = { d: STARTS[2] + 55, len: 44, hw: 20, hh: 24 }, ct = { d: STARTS[7] + 110 }; C.isle.hangar = hg; C.isle.citadel = ct;
      const B = C.isle.boxes, d0 = hg.d - hg.len / 2, d1 = hg.d + hg.len / 2;
      for (const sg of [-1, 1]) B.push([d0, d1, sg > 0 ? hg.hw : -hg.hw - 1.4, sg > 0 ? hg.hw + 1.4 : -hg.hw, 0, hg.hh + 1]);
      B.push([d0, d1, -hg.hw - 1.4, hg.hw + 1.4, hg.hh, hg.hh + 1.4]);
      for (let k = -3; k <= 3; k++) B.push([hg.d + k * 6.5 - 0.7, hg.d + k * 6.5 + 0.7, -hg.hw, hg.hw, 16.4, 17.7]);
    }
    return C;
  };
  // brume plus loin sur l'ile
  { const _am = E.applyMood; if (_am) E.applyMood = function (g, m) { if (E.course && E.course.isle) m = Object.assign({}, m, { near: 230, far: 520 }); return _am.call(this, g, m); }; }
  // la fusee est-elle dans la roche de l'ile ? (d : avance, x : lateral, y : hauteur absolue)
  const PROF = [[1, 0], [0.97, -1.4], [0.84, -8], [0.64, -18], [0.42, -30], [0.2, -42], [0, -52]];
  E.isleSolid = (C, T, d, x, y) => {
    const I = C.isle; if (!I) return false; const w = I.W(d); if (w <= 0) return false; const h = T.base(d) + I.bank(d) * x - y; if (h < 0.3 || h > 52) return false;
    let s = 0; for (let i = 1; i < PROF.length; i++) if (h <= -PROF[i][1]) { const p0 = PROF[i - 1], p1 = PROF[i]; s = p0[0] + (p1[0] - p0[0]) * (h + p0[1]) / (p1[1] - p0[1]); break; }
    return Math.abs(x) < w * s;
  };

  // ---- le sol : surfaces de couleur unie par section (la piste n'a plus d'herbe) ----
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const colTmp = new T3.Color(), COLS = {}; for (const k in PAL) COLS[k] = new T3.Color(PAL[k]);
  const RIM = new T3.Color('#7a3cf0');
  const rangeScene = (S, I) => {
    const foe = Z.evoFoe, st = STARTS[1], hg = I.hangar, ct = I.citadel;
    const heliPatrol = (SS, dd, lx, y) => [SS.at(dd, lx - 8, y), SS.at(dd + 8, lx, y + 2), SS.at(dd, lx + 8, y), SS.at(dd - 8, lx, y + 2)];
    if (foe) {
      [[st + 40, -30], [st + 85, 8], [st + 130, -12], [st + 175, 30], [st + 215, 0]].forEach(([dd, lx]) => foe(S, 'tank', dd, lx, 0, { name: 'CHAR', keep: true, armed: false }));
      [[st + 70, -22], [st + 125, 20], [st + 190, -6]].forEach(([dd, lx]) => foe(S, 'heli', dd, lx, 10, { name: 'HELICO', keep: true, armed: false, patrol: heliPatrol, speed: 7 }));
      [[st + 60, 26], [st + 160, -24]].forEach(([dd, lx]) => foe(S, 'truck', dd, lx, 0, { name: 'CAMION', keep: true, armed: false }));
    }
    for (let k = 0; k < 7; k++) { const dd = st + 30 + k * 34, sg = k % 2 ? 1 : -1; for (let q = 0; q < 3; q++) S.bx(dd, sg * (40 + q * 2.8), 0.55, 2.6, 1.1, 1.5, 'sand', '#c8b078', false); }   // sacs de sable
    const dc = hg.d, len = hg.len, hw = hg.hw, hh = hg.hh;
    for (const s of [-1, 1]) { S.bx(dc, s * (hw + 0.7), hh / 2, 1.4, hh, len, 'corrugated', '#7f8666', false); S.bx(dc - len / 2, s * (hw + 0.7), hh / 2, 2.2, hh, 2.2, 'metal', '#3d444c', false); S.bx(dc + len / 2, s * (hw + 0.7), hh / 2, 2.2, hh, 2.2, 'metal', '#3d444c', false); }
    S.bx(dc, 0, hh + 0.7, 2 * hw + 3, 1.4, len + 2, 'corrugated', '#6c7358', false);
    for (let k = -3; k <= 3; k++) S.bx(dc + k * 6.5, 0, 17, 2 * hw, 1.3, 1.4, 'metal', '#3d444c', false);   // les poutres des ponts roulants
    for (let k = -2; k <= 2; k++) S.glow(dc + k * 9, 0, hh - 2.2, '#ffe2a8', 16);
  };
  const sceneDef = {
    len: [300, 300], noDoor: true, noChaos: true, gw: 46, grass: false,   // plus d'herbe : elle poussait dans le vide
    gwF: (d) => { const C = E.course; return C && C.isle ? C.isle.W(d) : 46; },
    bankF: (d) => { const C = E.course; return C && C.isle ? C.isle.bank(d) : 0; },
    ground: (d, lx, c) => {
      const C = E.course, I = C && C.isle; if (!I) return; const s = SEC[secAt(d)], a = Math.abs(lx), w = I.W(d);
      const base = s.col === 'split' ? (lx < 0 ? COLS.teal : COLS.pink) : COLS[s.col]; c.copy(base);
      { const pt = secAt(d) % 4;   // un motif different par section : damier, diagonales, bandes, grand damier
        if (pt === 0 ? ((Math.floor(d / 18) + Math.floor((lx + 300) / 18)) & 1) : pt === 1 ? (Math.floor((d + lx + 400) / 14) & 1) : pt === 2 ? (Math.floor((lx + 300) / 16) & 1) : ((Math.floor(d / 34) + Math.floor((lx + 300) / 34)) & 1)) c.multiplyScalar(pt === 3 ? 0.95 : 0.93); }
      if (a > w - 2) c.copy(RIM);
    },
    build(S) {
      const C = E.course; if (!C || !C.isle) return;
      if (C.isle.map === 'range') rangeScene(S, C.isle);
    },
  };
  const BR = ['#bba294', '#b09486', '#c4aa9c', '#ab9082'], RUST = ['#8a5a44', '#7a5a48', '#6a5240'];
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const hangar = (S, dc, lx) => {   // le hangar en briques du jeu, a cote du depart
    const len = 36, hw = 12, hh = 12;
    S.reserve(dc, lx, 2 * hw + 10, len + 10);
    S.item(dc, (r) => {
      const t = pk(r, BR);
      for (const s of [-1, 1]) { S.bx(dc, lx + s * (hw + 0.7), 3, 1.4, 6, len, 'brick', t, true); S.bx(dc, lx + s * (hw + 0.7), 10.5, 1.4, 3, len, 'brick', t, true); S.bx(dc, lx + s * (hw + 0.7), 7, 0.3, 3, len - 6, 'glass', undefined, false); }
      for (const e of [-1, 1]) S.wall(dc + e * len / 2, lx - hw - 1.4, lx + hw + 1.4, 0, hh + 2, 1.6, 'brick', t, { lx, yc: 5.5, w: 22, h: 11 });
      S.bx(dc, lx, hh + 0.4, 2 * hw + 3, 0.8, len + 2, 'corrugated', pk(r, RUST), true); S.bx(dc, lx, 0.14, 2 * hw, 0.3, len, 'concrete', '#a0a29e', false);
      for (let k = -1; k <= 1; k++) S.glow(dc + k * 11, lx, hh - 2.4, '#ffe2a8', 14);
    });
  };
  for (let i = 0; i < 6; i++) D.scenes['crsI' + i] = Object.assign({}, sceneDef);
  E.isleScenes = Array.from({ length: 6 }, (_, i) => 'crsI' + i);

  // ---- le dessous de l'ile (roche qui s'effile) et l'ocean a perte de vue ----
  const bodyMesh = (T, C) => {
    const I = C.isle, pos = [], col = [], rings = [], step = 6, ROCK = ['#9a8f80', '#85796b', '#6f655a', '#5c534b'], SOIL = '#7a5233', cc = new T3.Color();
    for (let d = S0; d <= I.dEnd + 0.1; d += step) {
      const w = I.W(d), bk = I.bank(d), ring = [];
      for (let k = 0; k < PROF.length; k++) for (const sg of (k === PROF.length - 1 ? [0] : [-1, 1])) {
        const jx = k < 2 ? 0 : (hash(d, k * 3 + sg) - 0.5) * 0.18, jy = k < 2 ? 0 : (hash(k, d + sg) - 0.5) * 4, lx = sg * w * PROF[k][0] * (1 + jx);
        ring.push({ k, sg, p: T.at(d, lx, PROF[k][1] + jy + bk * lx) });
      }
      rings.push(ring);
    }
    const push = (a, b, c, k) => { cc.set(k < 1 ? SOIL : ROCK[Math.min(3, Math.max(0, k - 1))]); const j = 1 + (hash(a.p[0], a.p[2]) - 0.5) * 0.28; for (const v of [a, b, c]) { pos.push(v.p[0], v.p[1], v.p[2]); col.push(cc.r * j, cc.g * j, cc.b * j); } };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1]; if (A.length !== B.length) continue;
      for (const sgn of [-1, 1]) for (let k = 0; k < PROF.length - 1; k++) {
        const idx = (kk, s) => (kk === PROF.length - 1 ? A.length - 1 : kk * 2 + (s < 0 ? 0 : 1)), i0 = idx(k, sgn), i1 = idx(k + 1, sgn);
        push(A[i0], B[i0], A[i1], k); push(B[i0], B[i1], A[i1], k);
      }
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; return m;
  };
  const OCEAN_VS = 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}';
  const OCEAN_FS = [
    'uniform float uTime; uniform vec3 uSun; uniform sampler2D uTex; uniform float uUse; varying vec3 vW;', '#include <fog_pars_fragment>',
    'float hgt(vec2 p) { return sin(p.x * 0.045 + uTime * 0.9) * 0.5 + sin(p.y * 0.06 - uTime * 0.7) * 0.4 + sin((p.x + p.y) * 0.11 + uTime * 1.4) * 0.25 + sin((p.x * 0.7 - p.y) * 0.21 - uTime * 2.0) * 0.14 + sin((p.x - p.y * 0.6) * 0.47 + uTime * 2.6) * 0.07; }',
    'void main() {', '  vec2 p = vW.xz; float e = 0.7, h0 = hgt(p);',
    '  vec3 n = normalize(vec3(-(hgt(p + vec2(e, 0.0)) - h0) * 1.5, 1.0, -(hgt(p + vec2(0.0, e)) - h0) * 1.5));',
    '  vec3 V = normalize(cameraPosition - vW); float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);',
    '  vec3 deep = vec3(0.08, 0.68, 0.84), shallow = vec3(0.40, 0.92, 0.94), sky = vec3(0.84, 0.97, 1.0);',
    '  vec3 col = mix(deep, shallow, clamp(0.5 + h0 * 0.35, 0.0, 1.0)); col = mix(col, sky, fres * 0.45);',
    '  vec3 R = reflect(-uSun, n); col += vec3(1.0, 0.96, 0.82) * pow(max(dot(R, V), 0.0), 80.0) * 0.35;',
    '  float crest = smoothstep(0.62, 1.0, h0 * 0.5 + 0.5 + sin(p.x * 0.31 + p.y * 0.23 + uTime * 1.3) * 0.06); col = mix(col, vec3(1.0), crest * 0.14);',
    '  if (uUse > 0.5) { vec3 tw = texture2D(uTex, vW.xz * 0.02 + uTime * vec2(0.01, 0.02)).rgb * texture2D(uTex, vW.xz * 0.047 - uTime * vec2(0.015, 0.0)).rgb * 2.0; col = mix(col, col * tw * 1.35, 0.5); }',
    '  gl_FragColor = vec4(col, 1.0);', '#include <fog_fragment>', '}'].join('\n');
  const ocean = (T, C) => {
    const I = C.isle, geo = new T3.PlaneGeometry(6000, 6000, 1, 1); geo.rotateX(-Math.PI / 2);
    let sx = 0, sz = 0, n = 0; for (let d = 0; d < I.dEnd; d += 60) { const q = T.at(d, 0, 0); sx += q[0]; sz += q[2]; n++; } sx /= n; sz /= n;
    let wt = null; try { wt = CC.Textures.get('water').clone(); wt.needsUpdate = true; wt.wrapS = wt.wrapT = T3.RepeatWrapping; } catch (e) { wt = null; }
    if (!wt) { wt = new T3.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); wt.needsUpdate = true; }
    const uni = T3.UniformsUtils.merge([T3.UniformsLib.fog, { uTime: { value: 0 }, uSun: { value: new T3.Vector3(0.35, 0.8, 0.5).normalize() }, uTex: { value: wt }, uUse: { value: wt.image && wt.image.width > 1 ? 1 : 0 } }]);
    const m = new T3.Mesh(geo, new T3.ShaderMaterial({ uniforms: uni, vertexShader: OCEAN_VS, fragmentShader: OCEAN_FS, fog: true }));
    m.position.set(sx, I.PY, sz); m.frustumCulled = false; m.onBeforeRender = () => { uni.uTime.value = performance.now() / 1000; }; return m;
  };

  // ---- marquages au sol (bandes de section, tirets, chevrons) et rambardes gonflables (piles de disques) ----
  const decals = (T, C) => {
    const I = C.isle, pos = [], col = [], idx = [], tc = new T3.Color(), HZ = (MT[I.map] || MT.arch).hz, CHV = (MT[I.map] || MT.arch).chv;
    const P = (d, lx) => T.at(d, lx, I.bank(d) * lx + 0.09);
    const quad = (a, b, c, d2, hex) => { const o = pos.length / 3; for (const p of [a, b, c, d2]) pos.push(p[0], p[1], p[2]); tc.set(hex); for (let k = 0; k < 4; k++) col.push(tc.r, tc.g, tc.b); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); };
    STARTS.forEach((s, i) => { if (i === 0 || I.W(s) < 8) return; const w = I.W(s) - 2.2;   // la jonction entre deux sections : plaque de seuil, rainure incrustee, filet clair, bandes de danger
      quad(P(s - 1.4, -w), P(s - 1.4, w), P(s - 0.5, w), P(s - 0.5, -w), '#a9aeb8'); quad(P(s - 0.5, -w), P(s - 0.5, w), P(s, w), P(s, -w), '#14151a'); quad(P(s, -w), P(s, w), P(s + 0.35, w), P(s + 0.35, -w), '#d9dde4');
      for (let k = 0; k < 3; k++) { const d0 = s + 0.9 + k * 1.9; quad(P(d0, -w), P(d0, w), P(d0 + 1.9, w), P(d0 + 1.9, -w), k % 2 ? HZ[0] : HZ[1]); } });
    for (let d = 14; d < C.len - 6; d += 10) if (I.W(d) > 6 && I.W(d + 5) > 6) quad(P(d, -0.5), P(d, 0.5), P(d + 5, 0.5), P(d + 5, -0.5), '#ffffff');   // tirets au centre
    STARTS.forEach((s, i) => { const d = s + (i === 0 ? 60 : 30), n = Math.max(1, Math.floor(I.W(d) / 14)); if (I.W(d) < 10) return; for (let j = 0; j < n; j++) { const lx = (j - (n - 1) / 2) * 15;   // chevrons « par ici »
      quad(P(d, lx - 3.4), P(d + 1.7, lx - 3.4), P(d + 6.2, lx), P(d + 4.5, lx), CHV); quad(P(d + 4.5, lx), P(d + 6.2, lx), P(d + 1.7, lx + 3.4), P(d, lx + 3.4), CHV); } });
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, side: T3.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.frustumCulled = false; return m;
  };
  const ceilings = (T, C) => {   // un ruban translucide a bandes jaunes montre ou est le plafond d'une section
    const I = C.isle, pos = [], uv = [], idx = [], cv = document.createElement('canvas'); cv.width = cv.height = 64; const c2 = cv.getContext('2d');
    c2.fillStyle = 'rgba(255,210,58,0.62)'; for (let k = -1; k < 3; k++) { c2.beginPath(); c2.moveTo(k * 32, 0); c2.lineTo(k * 32 + 16, 0); c2.lineTo(k * 32 + 48, 64); c2.lineTo(k * 32 + 32, 64); c2.fill(); }
    const tx = new T3.CanvasTexture(cv); tx.wrapS = tx.wrapT = T3.RepeatWrapping;
    SEC.forEach((q, i) => { if (!(q.ceil < 26)) return; for (let d = STARTS[i] + 6; d < STARTS[i] + q.len - 6; d += 8) { const w = I.W(d) - 1.2, w2 = I.W(d + 8) - 1.2; if (w < 6 || w2 < 6) continue; const h = q.ceil, a = T.at(d, -w, I.bank(d) * -w + h), b = T.at(d, w, I.bank(d) * w + h), c = T.at(d + 8, w2, I.bank(d + 8) * w2 + h), e = T.at(d + 8, -w2, I.bank(d + 8) * -w2 + h), o = pos.length / 3;
      pos.push(...a, ...b, ...c, ...e); uv.push(0, d / 8, w / 6, d / 8, w2 / 6, d / 8 + 1, 0, d / 8 + 1); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); } });
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0.32, side: T3.DoubleSide, depthWrite: false, fog: false })); m.frustumCulled = false; return m; };
  const rails = (T, C) => {
    const I = C.isle, list = [], rg = I.map === 'range', CY = rg ? ['#25262a', '#25262a', '#e8e8e8'] : I.map === 'jungle' ? ['#7a5634', '#5b3f25', '#4e9a3a'] : ['#ff3b4d', '#ff9a1f', '#ff3b4d'];
    for (let d = S0 + 12; d < I.dEnd - 10; d += 4.6) { const w = I.W(d) - 1.2; if (w < 8) continue; for (const sg of [-1, 1]) list.push([d, sg * w, 1, ((d / 4.6) | 0) % 5 === 0 ? 1 : 0]); }
    for (let d = S0 + 12; d < I.dEnd - 10; d += 8) { const w = I.W(d) - 1.2; if (w < 8) continue; I.boxes.push([d - 4, d + 4, w - 1.3, w + 1.3, 0, 3.1], [d - 4, d + 4, -w - 1.3, -w + 1.3, 0, 3.1]); }   // les rambardes sont solides
    if (!rg) for (const d of [104, 118]) for (let lx = -50 + (d === 118 ? 8 : 0); lx <= 50; lx += 16) { list.push([d, lx, 1.6, 3]); I.boxes.push([d - 1.9, d + 1.9, lx - 1.9, lx + 1.9, 0, 3.9]); }   // les gros coussins de la ligne de depart
    const prof = [[0.02, 0], [1.0, 0], [1.12, 0.2], [1.12, 0.6], [1.0, 0.8], [0.02, 0.8]].map((q) => new T3.Vector2(q[0], q[1] - 0.4)), geo = new T3.LatheGeometry(prof, 8), lm = new T3.MeshLambertMaterial({ color: '#ffffff' }), dm = new T3.Object3D(), cc = new T3.Color(), CH = 160, byC = new Map(), gr = new T3.Group();
    for (const it of list) { const c = Math.floor(it[0] / CH); if (!byC.has(c)) byC.set(c, []); byC.get(c).push(it); }
    const RS = (MT[I.map] || MT.arch).rail, eg = RS.g === 'box' ? new T3.BoxGeometry(1.7, 2.1, 4.8) : (() => { const g0 = RS.g === 'log' ? new T3.CylinderGeometry(0.9, 0.9, 4.4, 8) : new T3.CapsuleGeometry(0.95, 3.4, 3, 8); g0.rotateX(Math.PI / 2); return g0; })(), LV = RS.g === 'box' ? [1.05] : [1.0, 2.55];
    for (const [c, arr0] of byC) {
      const edges = arr0.filter((q) => q[3] < 2), arr = arr0.filter((q) => q[3] >= 2);
      if (edges.length) { const ie = new T3.InstancedMesh(eg, lm, edges.length * LV.length); let m2 = 0; for (const [d, lx, , kind] of edges) { const seg = Math.round(d / 4.6); for (let li = 0; li < LV.length; li++) { const y = I.bank(d) * lx + LV[li], p = T.at(d, lx, y), q = T.at(d + 2, lx, I.bank(d + 2) * lx + LV[li]); dm.position.set(p[0], p[1], p[2]); dm.scale.set(1, 1, 1); dm.lookAt(q[0], q[1], q[2]); dm.updateMatrix(); ie.setMatrixAt(m2, dm.matrix);
          cc.set(kind ? RS.h : ((RS.g === 'box' ? seg : seg + li) % 2 ? RS.a : RS.b)); ie.setColorAt(m2, cc); m2++; } }
        ie.instanceMatrix.needsUpdate = true; if (ie.instanceColor) ie.instanceColor.needsUpdate = true; ie.frustumCulled = false; const mid2 = T.at((c + 0.5) * CH, 0, 5); ie.userData.c = new T3.Vector3(mid2[0], mid2[1], mid2[2]); gr.add(ie); }
      if (!arr.length) continue;
      const im = new T3.InstancedMesh(geo, lm, arr.length * 3); let n = 0;
      for (const [d, lx, sc, kind] of arr) for (let k = 0; k < 3; k++) {
        const p = T.at(d, lx, I.bank(d) * lx + (0.4 + k * 0.8) * sc); dm.position.set(p[0], p[1], p[2]); dm.scale.set(sc, sc, sc); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix);
        cc.set(kind === 1 ? (rg ? '#e8e8e8' : '#ffffff') : kind === 2 ? (k % 2 ? '#ffffff' : '#ff6fae') : kind === 3 ? (k % 2 ? '#ffffff' : '#ff8a1f') : CY[k]); im.setColorAt(n, cc); n++;
      }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; const mid = T.at((c + 0.5) * CH, 0, 5); im.userData.c = new T3.Vector3(mid[0], mid[1], mid[2]); gr.add(im);
    }
    return gr;
  };

  // ---- les obstacles mobiles : chacun accroche a une structure ; collision en repere de la structure (x = gauche, y = hauteur, z = devant) ----
  const _mcf = {}, _mcs = {};
  const mat = (c) => _mcf[c] || (_mcf[c] = new T3.MeshLambertMaterial({ color: c, flatShading: true }));
  const matS = (c) => _mcs[c] || (_mcs[c] = new T3.MeshLambertMaterial({ color: c }));
  const RBC = {};
  const rbGeo = (w, h, d, r) => { const k = [w, h, d, r].join('|'); if (RBC[k]) return RBC[k]; const sh = new T3.Shape(), x = (w - 2 * r) / 2, y = (h - 2 * r) / 2; sh.moveTo(-x, -y); sh.lineTo(x, -y); sh.lineTo(x, y); sh.lineTo(-x, y); sh.closePath();
    const g = new T3.ExtrudeGeometry(sh, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2, curveSegments: 1 }); g.center(); return (RBC[k] = g); };   // boite a bords arrondis
  const bx = (w, h, d, c) => { const m = Math.min(w, h, d); return m >= 1.4 ? new T3.Mesh(rbGeo(w, h, d, Math.min(0.28, m * 0.12)), matS(c)) : new T3.Mesh(new T3.BoxGeometry(w, h, d), mat(c)); };
  const rope = (Lr) => { const n = Math.max(2, Math.round(Lr / 0.9)), g = new T3.CylinderGeometry(0.14, 0.14, Lr, 6, n), pos = g.attributes.position, col = new Float32Array(pos.count * 3), c1 = new T3.Color('#cdb88c'), c2 = new T3.Color('#8f7a55');
    for (let i = 0; i < pos.count; i++) { const c = Math.floor((pos.getY(i) + Lr / 2) / (Lr / n) + 0.01) % 2 ? c1 : c2; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T3.BufferAttribute(col, 3)); return new T3.Mesh(g, new T3.MeshLambertMaterial({ vertexColors: true })); };   // corde a bandes (torsade)
  let _blob = null, _bm = null;
  const blobTex = () => _blob || (_blob = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(cv); })());
  const blobMat = () => new T3.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const blob = (g, x, z, w, d) => { const m = new T3.Object3D(); m.position.set(x, 0.1, z); return m; };   // plus de taches rondes : voir autoShadow
  E.isleBlob = () => { const m = new T3.Mesh(new T3.PlaneGeometry(1, 1), blobMat()); m.rotation.x = -Math.PI / 2; m.visible = false; m.frustumCulled = false; return m; };
  // ombre a la forme exacte d'un objet : sa silhouette vue du dessus, rendue une seule fois dans une texture ; meme pochoir que les autres ombres (jamais assombri deux fois)
  const SILM = (tex) => { const m = new T3.MeshBasicMaterial({ map: tex, color: '#0d1b3a', transparent: true, opacity: 0.3, alphaTest: 0.04, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, stencilWrite: true, stencilRef: 1, stencilFunc: T3.NotEqualStencilFunc, stencilFail: T3.KeepStencilOp, stencilZFail: T3.KeepStencilOp, stencilZPass: T3.ReplaceStencilOp }); m.forceSinglePass = true; return m; };
  const _silOv = new T3.MeshBasicMaterial({ color: '#ffffff' }), _silCol = new T3.Color();
  E.isleSil = (g, obj, own) => { try { const rdr = g.renderer; if (!rdr) return null; const sc = new T3.Scene(); if (own) sc.add(obj); else sc.children.push(obj); obj.updateMatrixWorld(true); const bb = new T3.Box3().setFromObject(obj); if (bb.isEmpty()) return null;
      const c = own ? new T3.Vector3(0, 0, 0) : bb.getCenter(new T3.Vector3()), half = (own ? Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x), Math.abs(bb.min.z), Math.abs(bb.max.z)) : Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2) * 1.05 + 0.2;
      const rt = new T3.WebGLRenderTarget(128, 128), cam = new T3.OrthographicCamera(-half, half, half, -half, 0.1, 600); cam.position.set(c.x, bb.max.y + 60, c.z); cam.up.set(0, 0, -1); cam.lookAt(c.x, bb.min.y, c.z); cam.updateMatrixWorld(true);
      sc.overrideMaterial = _silOv; const pr = rdr.getRenderTarget(), pa = rdr.getClearAlpha(); rdr.getClearColor(_silCol); rdr.setRenderTarget(rt); rdr.setClearColor(0x000000, 0); rdr.clear(); rdr.render(sc, cam); rdr.setRenderTarget(pr); rdr.setClearColor(_silCol, pa); if (!own) sc.children.length = 0;
      return { tex: rt.texture, half, c, y0: bb.min.y }; } catch (e) { return null; } };
  const _rsh = {};
  E.isleRocketSh = (g, sk, sc3) => { const key = (sk && sk.id) + ':' + sc3.map((v) => v.toFixed(2)).join(','); let q = _rsh[key]; if (q === undefined) { const m = CC.Models.rocket(sk); m.scale.set(sc3[0], sc3[1], sc3[2]); const r = E.isleSil(g, m, true); q = _rsh[key] = r ? { mat: SILM(r.tex), half: r.half } : null; } if (!q) return null; const mesh = new T3.Mesh(new T3.PlaneGeometry(2 * q.half, 2 * q.half), q.mat); mesh.rotation.order = 'YXZ'; mesh.rotation.x = -Math.PI / 2; mesh.visible = false; mesh.frustumCulled = false; mesh.renderOrder = 2; return mesh; };
  E.isleObjSh = (g, obj) => { const r = E.isleSil(g, obj, false); if (!r) return null; const mesh = new T3.Mesh(new T3.PlaneGeometry(2 * r.half, 2 * r.half), SILM(r.tex)); mesh.rotation.x = -Math.PI / 2; mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.userData.off = [r.c.x - obj.position.x, r.c.z - obj.position.z]; mesh.userData.y0 = r.y0; return mesh; };
  const cy = (rt, rb, h, c, n) => new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, n || 10), mat(c));
  const THEME = { arch: ['#f6eaff', '#e3cffb', '#ffd8ec'], range: ['#8f959c', '#7e848b', '#a1a7ad'], jungle: ['#a8743f', '#8a5a2c', '#c08a52'] }, STONE = ['#a39a8a', '#948b7c', '#b2a999'], WOOD = '#7a5634', WOODD = '#5b3f25';

  // ---- OMBRES : une seule direction de lumiere dans le monde ; chaque objet projette UNE ombre (l'enveloppe de ses pieces), jamais assombrie deux fois (pochoir)
  const LS = new T3.Vector3(0.12, 0, -0.09); E.isleLS = LS;   // decalage de l'ombre par metre de hauteur
  const SHM = new T3.MeshBasicMaterial({ color: '#0d1b3a', transparent: true, opacity: 0.3, depthWrite: false, side: T3.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, stencilWrite: true, stencilRef: 1, stencilFunc: T3.NotEqualStencilFunc, stencilFail: T3.KeepStencilOp, stencilZFail: T3.KeepStencilOp, stencilZPass: T3.ReplaceStencilOp });
  SHM.forceSinglePass = true;
  const hull = (pts) => { const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up); };
  const _rel = new T3.Matrix4(), _pv = new T3.Vector3(), _sc = new T3.Vector3(), _bb = new T3.Box3(), _qq = new T3.Quaternion();
  const KSH = (y) => (y <= 0 ? y : y < 7 ? y * 3.6 : 25.2 + (y - 7));   // v404 : pres du sol l'ombre s'allonge (on la voit a cote de l'objet) ; en hauteur elle reste presque a l'aplomb
  const meshShadowPts = (g, m, ls, far) => {   // les points de l'ombre d'une piece (dans le repere de l'obstacle), chaque point decale selon sa hauteur
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); m.updateWorldMatrix(true, false); _rel.copy(g.matrixWorld).invert().multiply(m.matrixWorld);
    const bb = m.geometry.boundingBox, pts = [], ty = m.geometry.type, vert = Math.abs(_rel.elements[5]) > 0.97; _sc.setFromMatrixScale(_rel);
    const circ = (cx, cy, cz, r) => { for (let k = 0; k < 10; k++) { const a = k * 0.6283; pts.push([cx + Math.cos(a) * r + ls.x * (far ? KSH(cy) : cy), cz + Math.sin(a) * r + ls.z * (far ? KSH(cy) : cy)]); } };
    if (ty === 'SphereGeometry') { _pv.set((bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2).applyMatrix4(_rel); circ(_pv.x, _pv.y, _pv.z, (bb.max.x - bb.min.x) / 2 * _sc.x); }
    else if ((ty === 'CylinderGeometry' || ty === 'ConeGeometry') && vert) { const r = Math.max(bb.max.x, bb.max.z) * _sc.x; _pv.set(0, bb.min.y, 0).applyMatrix4(_rel); circ(_pv.x, _pv.y, _pv.z, r * (ty === 'ConeGeometry' ? 1 : 1)); _pv.set(0, bb.max.y, 0).applyMatrix4(_rel); circ(_pv.x, _pv.y, _pv.z, ty === 'ConeGeometry' ? 0.1 : r); }
    else for (let k = 0; k < 8; k++) { _pv.set(k & 1 ? bb.max.x : bb.min.x, k & 2 ? bb.max.y : bb.min.y, k & 4 ? bb.max.z : bb.min.z).applyMatrix4(_rel); pts.push([_pv.x + ls.x * (far ? KSH(_pv.y) : _pv.y), _pv.z + ls.z * (far ? KSH(_pv.y) : _pv.y)]); }
    return pts; };
  const localLS = (g) => { g.updateMatrixWorld(true); g.getWorldQuaternion(_qq); return LS.clone().applyQuaternion(_qq.clone().invert()); };
  const fan = (poly, out) => { for (let i = 1; i + 1 < poly.length; i++) out.push(poly[0][0], 0.14, poly[0][1], poly[i][0], 0.14, poly[i][1], poly[i + 1][0], 0.14, poly[i + 1][1]); };
  const SH_DYN = []; E.isleShReset = () => { SH_DYN.length = 0; };
  const dynSh = (g, node) => {   // une piece qui bouge : son ombre est recalculee a chaque image
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(3 * 3 * 30), 3)); const m = new T3.Mesh(geo, SHM); m.frustumCulled = false; m.renderOrder = 2; m.userData.noShadow = true; g.add(m); SH_DYN.push({ g, node, m, ls: null }); };
  let _dfr = 0;
  const dynUpdate = (rp) => { _dfr++; for (let i = 0; i < SH_DYN.length; i++) { if ((i + _dfr) % 2) continue; const o = SH_DYN[i]; const nd = o.node, near = !rp || o.g.position.distanceToSquared(rp) < 170 * 170; if (!near || nd.visible === false || o.g.userData.noGround) { o.m.visible = false; continue; } o.m.visible = true; if (!o.ls) o.ls = localLS(o.g); o.g.updateMatrixWorld(true);
      let pp = meshShadowPts(o.g, nd, o.ls); { const cx = o.g.userData.clampX; if (cx) pp = pp.map((p) => [cx(p[0], p[1]), p[1]]); } const poly = hull(pp), arr = []; fan(poly, arr); const pos = o.m.geometry.attributes.position, n = Math.min(arr.length, pos.array.length); for (let i = 0; i < n; i++) pos.array[i] = arr[i]; for (let i = n; i < pos.array.length; i += 3) { pos.array[i] = arr[n - 3] || 0; pos.array[i + 1] = 0.14; pos.array[i + 2] = arr[n - 1] || 0; } pos.needsUpdate = true; } };
  const autoShadow = (g) => {   // l'ombre des pieces fixes d'un groupe, fusionnee en un seul objet
    const ls = localLS(g), out = [];
    g.traverse((o) => { if (!o.isMesh || o.userData.noShadow || o.userData.dyn || o.visible === false || !o.geometry) return; for (let a = o.parent; a && a !== g; a = a.parent) if (a.userData && a.userData.dyn) return;
      if (o.material && o.material.isMeshBasicMaterial && o.material.transparent) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _bb.copy(o.geometry.boundingBox); const sz = _bb.getSize(_pv); if (Math.max(sz.x, sz.y, sz.z) < 1.1) return;
      let pts = meshShadowPts(g, o, ls, true); if (pts.length < 3) return; const cx = g.userData.clampX; if (cx) pts = pts.map((p) => [cx(p[0], p[1]), p[1]]); fan(hull(pts), out); });
    if (!out.length) return; const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(out, 3)); const m = new T3.Mesh(geo, SHM); m.frustumCulled = false; m.renderOrder = 2; m.userData.noShadow = true; g.add(m); };
  const _v = new T3.Vector3(), RR = 0.8;   // RR : rayon de la fusee
  const segDist = (px, py, ax, ay, bx2, by2) => { const dx = bx2 - ax, dy = by2 - ay, l2 = dx * dx + dy * dy || 1, t = U.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); };

  const tubeMesh = (T, I, d0, len, hw, ht, cols, op, accent) => {   // coque d'un tuyau : section carree arrondie, bandes de couleur, deux colliers aux extremites
    const N = 24, pos = [], col = [], idx = [], A = hw + 1.2, B = (ht + 3) / 2, HC = ht / 2, tc = new T3.Color(), sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.5);
    const ring = (d, grow, c) => { const o = pos.length / 3; tc.set(c); for (let k = 0; k < N; k++) { const th = k / N * 6.2832, x = (A + grow) * sp(Math.cos(th)), y = HC + (B + grow) * sp(Math.sin(th)), p = T.at(d, x, I.bank(d) * x + y); pos.push(p[0], p[1], p[2]); col.push(tc.r, tc.g, tc.b); } return o; };
    const link = (o0, o1) => { for (let k = 0; k < N; k++) { const k2 = (k + 1) % N; idx.push(o0 + k, o1 + k, o1 + k2, o0 + k, o1 + k2, o0 + k2); } };
    let prev = -1; for (let d = d0; d <= d0 + len + 0.01; d += 4) { const o = ring(d, 0, Math.floor((d - d0) / 8) % 2 ? cols[0] : cols[1]); if (prev >= 0) link(prev, o); prev = o; }
    for (const dd of [d0 - 0.6, d0 + len - 2.4]) { const a = ring(dd, 0.9, accent), b = ring(dd + 3, 0.9, accent); link(a, b); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide, transparent: op < 1, opacity: op, depthWrite: op >= 1 })); m.frustumCulled = false; m.userData.noShadow = true; return m; };
  const obstacles = (T, C, grp) => {
    const I = C.isle, ups = [], hits = [], sx = I.sx, addHit = (d, f) => { f.d = d; hits.push(f); };
    const signs = [], groups = [], mk = (d, lx) => { const L = lx * sx, bk = I.bank(d), p = T.at(d, L, bk * L), q = T.at(d + 3, L, bk * L), g = new T3.Group(); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); g.rotateZ(-Math.atan(bk)); grp.add(g); groups.push(g); g.userData.noGround = !(I.W(d) > 1); g.updateMatrixWorld(true);
      { const xw = new T3.Vector3(1, 0, 0).applyQuaternion(g.quaternion), a0 = T.at(d, 0, 0), a1 = T.at(d, 1, 0), sg = ((a1[0] - a0[0]) * xw.x + (a1[2] - a0[2]) * xw.z) >= 0 ? 1 : -1; g.userData.clampX = (x, z) => { const ll = L + sg * x, mx = Math.max(0, I.W(d + z) - 0.8), c = Math.max(-mx, Math.min(mx, ll)); return (c - L) * sg; }; }   // une ombre ne depasse jamais le bord du tablier
      return g; };
    const loc = (g, pos) => g.worldToLocal(_v.copy(pos));
    const stoneBlock = (w, h, d, i) => bx(w, h, d, STONE[i % 3]);
    const gantry = (g, span, top, wood, dd, lxx) => {
      if (dd !== undefined) { const L = lxx * sx; for (const sg of [-1, 1]) I.boxes.push([dd - 2.7, dd + 2.7, L + sg * span - 2.7, L + sg * span + 2.7, 0, top + 1]); I.boxes.push([dd - 1.4, dd + 1.4, L - span - 2.5, L + span + 2.5, top - 0.6, top + 1.6]); }   // portique : deux piliers (pierre a bandes ou bois), une poutre a bandes jaunes et noires
      for (const s of [-1, 1]) { const col = wood ? bx(2.2, top + 1, 2.2, WOOD) : stoneBlock(4, top + 1, 4, 0); col.position.set(s * span, (top + 1) / 2, 0); g.add(col); if (!wood) for (let k = 0; k < 4; k++) { const band = stoneBlock(4.4, 0.7, 4.4, k + 1); band.position.set(s * span, 3 + k * 5.5, 0); g.add(band); } const foot = bx(5.4, 1.2, 5.4, wood ? WOODD : STONE[1]); foot.position.set(s * span, 0.6, 0); g.add(foot); }
      const beam = bx(2 * span + 5, 2, 2.6, wood ? WOOD : STONE[2]); beam.position.y = top + 0.5; g.add(beam);
      for (let k = -2; k <= 2; k++) { const sp = bx(2.6, 2.04, 2.64, k % 2 ? '#ffd23a' : '#23262b'); sp.position.set(k * 5.6, top + 0.5, 0); if (Math.abs(k * 5.6) < span + 1) g.add(sp); }
    };
    const hammer = (d, lx, ph) => {   // marteau pendulaire sur portique en pierre
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, false, d, lx);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv); piv.userData.dyn = true;
      for (const z of [-0.9, 0.9]) { const r = rope(L - 1.8); r.position.set(0, -(L - 1.8) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const hd = cy(2.7, 2.7, 5.6, '#d9382c', 22); hd.rotation.x = Math.PI / 2; head.add(hd); dynSh(g, hd); for (const z of [-2, 0, 2]) { const rg = cy(2.8, 2.8, 0.55, z === 0 ? '#ffd23a' : '#23262b', 22); rg.rotation.x = Math.PI / 2; rg.position.z = z; head.add(rg); } for (const z of [-2.9, 2.9]) { const cp = new T3.Mesh(new T3.SphereGeometry(2.45, 18, 12), matS('#9aa0aa')); cp.scale.set(1, 1, 0.4); cp.position.z = z; head.add(cp); } const eye = new T3.Mesh(new T3.TorusGeometry(0.5, 0.15, 8, 14), matS('#3a3d44')); eye.position.y = 2.7; head.add(eye);
      for (const sg of [-1, 1]) blob(g, sg * 14, 0, 11, 11); const hsh = blob(g, 0, 0, 8, 8);
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.2 + ph); hsh.position.x = L * Math.sin(piv.rotation.z); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4) return false; const a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); return Math.hypot(l.x - hx, l.y - hy) < 2.7 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.45 + RR; });
    };
    const logp = (d, lx, ph) => {   // tronc pendulaire sur chevalet de bois
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, true, d, lx);
      const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv); piv.userData.dyn = true;
      for (const z of [-2.6, 2.6]) { const r = rope(L - 1.4); r.position.set(0, -(L - 1.4) / 2, z); piv.add(r); }
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const log = cy(1.7, 1.7, 8, '#6b4a2a', 10); log.rotation.x = Math.PI / 2; head.add(log); dynSh(g, log); for (const z of [-3.2, 0, 3.2]) { const band = cy(1.85, 1.85, 0.5, '#3a3a3a', 10); band.rotation.x = Math.PI / 2; band.position.z = z; head.add(band); }
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.9 + ph); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos), a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); if (Math.abs(l.z) > 4.2 + RR) return false; return Math.hypot(l.x - hx, l.y - hy) < 2.0 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.5 + RR; });
    };
    const windmill = (d, lx, dir) => {   // moulin a vent en pierre : tour a bandes, toit en bois, ailes tournantes face a la fusee
      const g = mk(d, lx), H = 17; blob(g, 0, 0, 17, 17); I.boxes.push([d - 5.6, d + 5.6, lx * sx - 5.6, lx * sx + 5.6, 0, H + 1], [d - 4.4, d + 4.4, lx * sx - 4.4, lx * sx + 4.4, H + 1, H + 4.5]);
      const tw = cy(3.6, 5.6, H, STONE[0], 14); tw.position.y = H / 2; g.add(tw);
      for (let k = 0; k < 5; k++) { const ring = cy(4.4 - k * 0.42, 4.6 - k * 0.42, 0.7, STONE[(k + 1) % 3], 14); ring.position.y = 2.2 + k * 3.2; g.add(ring); }
      const door = bx(2.6, 4, 0.8, WOODD); door.position.set(0, 2, 5); g.add(door);
      const roof = new T3.Mesh(new T3.ConeGeometry(4.4, 4.2, 14), mat('#8a3b2a')); roof.position.y = H + 2.1; g.add(roof);
      const hub = new T3.Group(); hub.position.set(0, H - 1, -4.4); g.add(hub); const hc = cy(1.4, 1.4, 2.4, WOODD, 10); hc.rotation.x = Math.PI / 2; hub.add(hc);
      const blades = new T3.Group(); blades.position.z = -1.4; hub.add(blades); blades.userData.dyn = true;
      for (let k = 0; k < 4; k++) { const arm = new T3.Group(); arm.rotation.z = k * Math.PI / 2; const sp = bx(0.9, 13.5, 0.7, WOOD); sp.position.y = 7.4; arm.add(sp); for (let j = 0; j < 5; j++) { const sl = bx(3.4, 0.5, 0.5, '#d8c79a'); sl.position.set(1.9, 3.4 + j * 2.4, 0.2); arm.add(sl); } const sail = bx(3.2, 10, 0.2, '#e8dcc0'); sail.position.set(2.2, 8, 0.1); arm.add(sail); dynSh(g, sail); blades.add(arm); }
      ups.push((t) => { blades.rotation.z = -dir * t * 0.95; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos), hy = H - 1, hz = -(4.4 + 1.4);
        if (l.y < H + 1 && Math.hypot(l.x, l.z) < 5.6 + RR && l.y > -2) return true;
        if (Math.abs(l.z - hz) > 1.5 + RR) return false; const dx = l.x, dy = l.y - hy, r = Math.hypot(dx, dy); if (r < 2.4 + RR) return true; if (r > 14.2 + RR) return false;
        const a = Math.atan2(dy, dx) - (blades.rotation.z + Math.PI / 2); for (let k = 0; k < 4; k++) { const da = a - k * Math.PI / 2, ang = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.cos(ang) > 0 && r * Math.abs(Math.sin(ang)) < 1.5 + RR) return true; } return false; });
    };
    const sweeper = (d, lx, ph, dir) => {   // barre tournante sur un mat de pierre (axe vertical) : deux grandes pales
      const g = mk(d, lx), R = 14.5, h0 = 2.0, h1 = 23; blob(g, 0, 0, 10, 10); I.boxes.push([d - 2.8, d + 2.8, lx * sx - 2.8, lx * sx + 2.8, 0, h1 + 3]);
      const pole = cy(2.2, 3.0, h1 + 3, STONE[1], 14); pole.position.y = (h1 + 3) / 2; g.add(pole); for (let k = 0; k < 3; k++) { const b2 = cy(3.4, 3.4, 0.7, STONE[(k + 2) % 3], 14); b2.position.y = 2 + k * 6; g.add(b2); }
      const rot = new T3.Group(); rot.position.y = 0; g.add(rot); rot.userData.dyn = true;
      for (const s of [-1, 1]) { const blade = bx(R, h1 - h0, 1.6, s > 0 ? '#ff4f9a' : '#ffd23a'); blade.position.set(s * (R / 2 + 2), (h0 + h1) / 2, 0); rot.add(blade); dynSh(g, blade); const cap = bx(2.2, h1 - h0 + 0.6, 2.2, '#23262b'); cap.position.set(s * (R + 2), (h0 + h1) / 2, 0); rot.add(cap); }
      ups.push((t) => { rot.rotation.y = dir * t * 0.7 + ph; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (l.y < h0 - RR || l.y > h1 + RR + 3) return false; if (Math.hypot(l.x, l.z) < 2.5 + RR) return true; const th = rot.rotation.y, t = l.x * Math.cos(th) - l.z * Math.sin(th), pr = Math.abs(l.x * Math.sin(th) + l.z * Math.cos(th)); return Math.abs(t) < R + 2.2 + RR && pr < 0.8 + RR && Math.abs(t) > 2; });
    };
    const cannon = (d, lx, side0, ph) => {
      const side = Math.sign(lx) * sx; I.boxes.push([d - 4, d + 4, lx * sx - 3.6, lx * sx + 3.6, 0, 3.6], [d - 1.8, d + 1.8, Math.min(lx * sx, lx * sx - side * 7.2) - 1, Math.max(lx * sx, lx * sx - side * 7.2) + 1, 3.4, 10.5]);   // l'affut et le fut sont solides   // canon sur un affut en pierre : recul, flamme et fumee au tir ; le rocher part de la bouche et retombe de l'autre cote (ombre d'avertissement)
      const g = mk(d, lx), base = stoneBlock(7, 3, 8, 1); base.position.y = 1.5; g.add(base); blob(g, 0, 0, 12, 13);
      for (let k = 0; k < 2; k++) { const b2 = stoneBlock(7.4, 0.6, 8.4, k + 2); b2.position.y = 3.2 + k * 0.01; g.add(b2); }
      const brl = new T3.Group(); brl.position.set(0, 4.8, 0); brl.rotation.z = side * 0.6; g.add(brl); const tube = new T3.Group(); brl.add(tube);
      const bar = cy(1.5, 1.9, 8, '#4c5560', 12); bar.rotation.z = Math.PI / 2; bar.position.x = side * 3.4; tube.add(bar);
      for (const xx of [0.8, 3.4, 6.2]) { const rg2 = cy(2.05, 2.05, 0.7, '#23262b', 12); rg2.rotation.z = Math.PI / 2; rg2.position.x = side * xx; tube.add(rg2); }
      const mz = cy(1.1, 1.1, 0.3, '#111111', 12); mz.rotation.z = Math.PI / 2; mz.position.x = side * 7.9; tube.add(mz);
      for (const s2 of [-1, 1]) { const wh = cy(2.2, 2.2, 0.8, WOODD, 14); wh.rotation.x = Math.PI / 2; wh.position.set(0, 2.2, s2 * 4.4); g.add(wh); const hub = cy(0.7, 0.7, 1.0, '#23262b', 8); hub.rotation.x = Math.PI / 2; hub.position.set(0, 2.2, s2 * 4.4); g.add(hub); }
      const flash = new T3.Mesh(new T3.SphereGeometry(1.6, 10, 8), new T3.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.9 })); flash.position.x = side * 9; tube.add(flash); flash.visible = false;
      const rock = new T3.Mesh(new T3.SphereGeometry(2.2, 16, 12), matS('#2b2e33')), mark = new T3.Mesh(new T3.RingGeometry(3, 4.6, 24), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.7, side: T3.DoubleSide })); mark.rotation.x = -Math.PI / 2; grp.add(rock, mark); rock.visible = mark.visible = false; dynSh(g, rock);
      const shards = []; for (let q = 0; q < 10; q++) { const sh = new T3.Mesh(new T3.IcosahedronGeometry(0.5 + Math.random() * 0.55, 0), mat(q % 3 ? '#4a4e55' : '#8a6a4a')); sh.visible = false; grp.add(sh); shards.push({ m: sh, v: new T3.Vector3() }); }
      const P = 4.6, FL = 2.3, HH = 20, st0 = new T3.Vector3(), in0 = new T3.Vector3(), mzv = new T3.Vector3(); let live = null, lastK = null, fired = false, shat = true, shT = 9, lastT = 0, gy = 0;
      ups.push((t) => { const dtt = Math.min(0.2, Math.max(0, t - lastT)); lastT = t; const k = (t + ph) % P, u = k / FL;
        if (lastK === null) lastK = k;
        if (k < lastK) { fired = true; shat = false; g.updateMatrixWorld(true); mzv.set(side * 8.6, 0, 0); tube.localToWorld(mzv); st0.copy(mzv); in0.set(side * 2.4, 0, 0); tube.localToWorld(in0); const fx = CC.game && CC.game.effects; try { fx.smokePuff(mzv.clone(), new T3.Vector3(0, 2, 0), 3, 1.8); fx.smokePuff(mzv.clone(), new T3.Vector3(side * 6, 3, 0), 2, 1.4); fx.flash(mzv.clone(), '#ffe2a8', 6, 80, 0.25, '#ffb030'); CC.game.audio.play('boomSmall', mzv.clone()); } catch (e) { /* effets */ } }
        lastK = k; tube.position.x = -side * 1.9 * Math.exp(-k * 5); flash.visible = k < 0.12;
        const tl = -side * Math.abs(lx) * 0.55, wp = T.at(d, tl, I.bank(d) * tl); gy = wp[1];
        mark.visible = fired && k < FL; mark.position.set(wp[0], wp[1] + 0.2, wp[2]); mark.scale.setScalar(0.7 + 0.5 * (1 - Math.min(1, k / FL)));
        live = null;
        if (fired && u >= 0 && u < 1) { if (u < 0.05) rock.position.lerpVectors(in0, st0, u / 0.05); else { const w = (u - 0.05) / 0.95; rock.position.set(lerp(st0.x, wp[0], w), lerp(st0.y, wp[1] + 2.2, w) + 4 * HH * w * (1 - w), lerp(st0.z, wp[2], w)); } rock.rotation.x = t * 6; rock.visible = true; live = rock.position; }
        else { rock.visible = false; if (fired && u >= 1 && !shat) { shat = true; shT = 0; const fx = CC.game && CC.game.effects; for (const sh of shards) { sh.m.position.set(wp[0], wp[1] + 1.2, wp[2]); sh.v.set((Math.random() - 0.5) * 16, 7 + Math.random() * 10, (Math.random() - 0.5) * 16); sh.m.scale.setScalar(1); sh.m.visible = true; } try { fx.smokePuff(new T3.Vector3(wp[0], wp[1] + 1, wp[2]), new T3.Vector3(0, 3, 0), 3.4, 1.6); fx.flash(new T3.Vector3(wp[0], wp[1] + 1.5, wp[2]), '#ffd9a0', 4, 60, 0.2, '#ff9a30'); CC.game.audio.play('boomSmall', new T3.Vector3(wp[0], wp[1], wp[2])); } catch (e) { /* effets */ } } }
        if (shT < 1.6) { shT += dtt; for (const sh of shards) { sh.v.y -= 32 * dtt; sh.m.position.addScaledVector(sh.v, dtt); if (sh.m.position.y < gy + 0.4) { sh.m.position.y = gy + 0.4; sh.v.y *= -0.32; sh.v.x *= 0.6; sh.v.z *= 0.6; } sh.m.rotation.x += dtt * 7; sh.m.rotation.z += dtt * 5; if (shT > 1.1) sh.m.scale.setScalar(Math.max(0.01, (1.6 - shT) / 0.5)); } if (shT >= 1.6) for (const sh of shards) sh.m.visible = false; } });
      addHit(d, (pos) => !!live && pos.distanceTo(live) < 2.7 + RR);
    };
    const gateRow = (d, lx, n, ph) => {   // rangee de herses : n ouvertures ; chaque herse monte et descend ; elle ne descend JAMAIS sur la fusee qui approche
      const g = mk(d, lx), HWL = 23, OW = 15, tot = n * OW, panels = [], lt = [], posts = [];
      for (let i = 0; i <= n; i++) blob(g, (i - n / 2) * OW, 0, 7, 8);
      for (let i = 0; i <= n; i++) { const x = (i - n / 2) * OW, post = bx(3, HWL, 3.2, I.map === 'range' ? (i % 2 ? '#d9a21b' : '#4a5160') : (i % 2 ? '#a8402e' : '#f0e6d0')); post.position.set(x, HWL / 2, 0); g.add(post); posts.push(x); const cap = bx(3.6, 1, 3.6, '#23262b'); cap.position.set(x, HWL + 0.5, 0); g.add(cap); }
      const lintel = bx(tot + 3, 2.2, 3.4, I.map === 'range' ? '#4a5160' : WOODD); lintel.position.y = HWL + 1.2; g.add(lintel); I.boxes.push([d - 1.8, d + 1.8, lx * sx - tot / 2 - 1.6, lx * sx + tot / 2 + 1.6, HWL, HWL + 2.4]);
      for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * OW, pn = new T3.Group(); const panel = bx(OW - 3.2, HWL - 1, 1.2, I.map === 'range' ? '#5d6652' : '#ff4f9a'); panel.position.y = (HWL - 1) / 2; pn.add(panel); pn.userData.dyn = true; dynSh(g, panel); for (let k = 0; k < 4; k++) { const st = bx(OW - 3.2, 0.9, 1.3, I.map === 'range' ? (k % 2 ? '#d9a21b' : '#15151a') : (k % 2 ? '#ffffff' : '#2a2540')); st.position.y = 0.6 + k * 0.9; pn.add(st); } pn.position.x = x; g.add(pn); panels.push({ pn, x }); lt.push(ph + i * 1.7); }
      const PER = 7.2, yb = (k) => (k < 0.3 ? 0 : k < 0.42 ? 21 * (k - 0.3) / 0.12 : k < 0.82 ? 21 : 21 * (1 - (k - 0.82) / 0.18)); let last = 0;
      ups.push((t, rp) => { const dt = Math.max(0, Math.min(0.2, t - last)); last = t; const lc = rp ? loc(g, rp) : null;
        panels.forEach((p, i) => { let k = (lt[i] / PER) % 1; const near = lc && lc.z > -55 && lc.z < 5 && Math.abs(lc.x - p.x) < OW * 0.8; if (!(near && k >= 0.78 && k < 1)) lt[i] += dt; k = (lt[i] / PER) % 1; p.y = yb(k); p.pn.position.y = p.y; });
        g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (l.y < -2 || l.y > HWL + 2) return false;
        for (const x of posts) if (Math.abs(l.x - x) < 1.5 + RR && Math.abs(l.z) < 1.7 + RR) return true;
        if (Math.abs(l.z) > 0.6 + RR) return false; for (const p of panels) if (Math.abs(l.x - p.x) < (OW - 3.2) / 2 + RR && l.y + RR > p.y && l.y - RR < p.y + HWL - 1) return true; return false; });
    };

    const mines = (d, lx0, n, ph, step) => {   // mines flottantes : spheres a pointes qui montent et descendent, en quinconce ; on passe entre elles ou au-dessus
      const g = mk(d, 0), ms = [], gap = step || 15; blob(g, 0, 0, 4, 4).visible = false;
      for (let i = 0; i < n; i++) { const m = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(2.3, 16, 12), matS('#b3261e')); m.add(body); m.userData.dyn = true; dynSh(g, body); const band = cy(2.36, 2.36, 0.7, '#15151a', 16); m.add(band);
        for (let k = 0; k < 10; k++) { const a = k * 2.399963, y = 1 - (k + 0.5) / 5, r = Math.sqrt(Math.max(0, 1 - y * y)), sp = new T3.Mesh(new T3.ConeGeometry(0.42, 1.2, 8), mat('#8d939c')); sp.position.set(Math.cos(a) * r * 2.5, y * 2.5, Math.sin(a) * r * 2.5); sp.lookAt(sp.position.clone().multiplyScalar(2)); sp.rotateX(Math.PI / 2); m.add(sp); }
        const x0 = lx0 * sx + (i - (n - 1) / 2) * gap, sh = blob(g, x0, 0, 7, 7); m.position.set(x0, 7, 0); g.add(m); ms.push({ m, x0, sh, i, y: 7, x: x0 }); }
      ups.push((t) => { for (const o of ms) { o.y = 7 + 4.2 * Math.sin(t * 1.25 + ph + o.i * 1.9); o.x = o.x0 + 2.4 * Math.sin(t * 0.8 + ph + o.i); o.m.position.set(o.x, o.y, 0); o.m.rotation.y = t * 0.6; o.sh.position.x = o.x; } g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4.5) return false; for (const o of ms) if (Math.hypot(l.x - o.x, l.y - o.y, l.z) < 3.2 + RR) return true; return false; });
    };
    const container = (d, lx, ph, amp) => {   // conteneur suspendu qui coulisse d'un cote a l'autre sous un rail
      const g = mk(d, lx), top = 27; blob(g, 0, 0, 14, 12);
      const rail = bx(2 * (amp + 16), 1.6, 1.8, '#4a5160'); rail.position.y = top; g.add(rail); for (const sg of [-1, 1]) { const pst = bx(2.4, top, 2.4, '#d9a21b'); pst.position.set(sg * (amp + 16), top / 2, 0); g.add(pst); I.boxes.push([d - 1.4, d + 1.4, lx * sx + sg * (amp + 16) - 1.4, lx * sx + sg * (amp + 16) + 1.4, 0, top + 1]); }
      const cn = new T3.Group(); g.add(cn); cn.userData.dyn = true; const box = bx(12, 9, 9, '#c8742a'); cn.add(box); dynSh(g, box); for (let k = -4; k <= 4; k++) { const rib = bx(0.5, 8.4, 9.3, '#a85a1c'); rib.position.x = k * 1.3; cn.add(rib); } const st = bx(12.2, 1, 9.2, '#15151a'); st.position.y = -4; cn.add(st); const st2 = bx(12.2, 1, 9.2, '#d9a21b'); st2.position.y = 4; cn.add(st2);
      for (const sg of [-1, 1]) { const r = rope(top - 11); r.position.set(sg * 4, 11 + (top - 11) / 2, 0); cn.add(r); }
      const hsh = blob(g, 0, 0, 13, 11), cyy = 7;
      ups.push((t) => { cn.position.set(amp * Math.sin(t * 0.85 + ph), cyy, 0); hsh.position.x = cn.position.x; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); return Math.abs(l.x - cn.position.x) < 6 + RR && Math.abs(l.z) < 4.5 + RR && Math.abs(l.y - cyy) < 4.5 + RR; });
    };
    const balloons = (d, n, ph) => {   // rangee de gros ballons gonflables qui montent et descendent (jamais le meme niveau deux fois de suite)
      const g = mk(d, 0), W0 = Math.max(20, I.W(d) - 8), cols = ['#ff4f9a', '#ffd23a', '#2f8cff', '#7a3cf0', '#43d6a0'], bs = [];
      for (let i = 0; i < n; i++) { const x = -W0 + (2 * W0) * (i + 0.5) / n, m = new T3.Mesh(new T3.SphereGeometry(3.6, 18, 14), matS(cols[i % 5])); m.scale.set(1, 1.12, 1); const knot = new T3.Mesh(new T3.ConeGeometry(0.7, 1, 8), mat(cols[i % 5])); knot.position.y = -4.3; knot.rotation.x = Math.PI; m.add(knot); const hl = new T3.Mesh(new T3.SphereGeometry(0.8, 8, 6), new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 })); hl.position.set(-1.3, 1.6, 2.4); m.add(hl); g.add(m); m.userData.dyn = true; dynSh(g, m); const str = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.06, 1, 4), mat('#f4f0e6')); str.userData.dyn = true; g.add(str); const sh = blob(g, x, 0, 8, 8); bs.push({ m, x, str, sh, i, y: 8 }); }
      ups.push((t) => { for (const o of bs) { o.y = 9 + 7.5 * Math.sin(t * 1.15 + ph + o.i * 2.1); o.m.position.set(o.x, o.y, 0); o.str.scale.y = o.y - 4; o.str.position.set(o.x, (o.y - 4) / 2, 0); } g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4.5) return false; for (const o of bs) if (Math.hypot(l.x - o.x, (l.y - o.y) / 1.12, l.z) < 3.6 + RR) return true; return false; });
    };

    const vinePend = (d, lx, ph, dirz) => {   // liane-pendule : une grosse noix de coco au bout d'une liane, qui balance d'avant en arriere (dans l'axe de la piste)
      const g = mk(d, lx), top = 27, L = 20, A = 0.7; blob(g, 0, 0, 9, 9); const hsh = blob(g, 0, 0, 7, 7);
      const arm = bx(2 * 6 + 5, 1.6, 1.8, WOODD); arm.position.y = top + 0.4; g.add(arm); for (const sg of [-1, 1]) { const pst = bx(2.2, top + 1, 2.2, WOOD); pst.position.set(sg * 6, (top + 1) / 2, 0); g.add(pst); I.boxes.push([d - 1.3, d + 1.3, lx * sx + sg * 6 - 1.3, lx * sx + sg * 6 + 1.3, 0, top + 1]); }
      const piv = new T3.Group(); piv.position.y = top - 0.4; g.add(piv); piv.userData.dyn = true; const r = rope(L - 2.4); r.position.y = -(L - 2.4) / 2; piv.add(r);
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const nut = new T3.Mesh(new T3.SphereGeometry(3, 16, 12), matS('#6b4a2a')); head.add(nut); dynSh(g, nut); for (const q of [[-1, 0.9, 2.4], [1, 1.1, 2.3], [0, -1.2, 2.7]]) { const eye = new T3.Mesh(new T3.SphereGeometry(0.45, 8, 6), mat('#2a1a0c')); eye.position.set(q[0], q[1], q[2]); head.add(eye); } const leaf = new T3.Mesh(new T3.ConeGeometry(1.2, 3, 6), mat('#3f9a44')); leaf.position.y = 3.2; head.add(leaf);
      ups.push((t) => { piv.rotation.x = A * Math.sin(t * Math.PI * 2 / 3.4 + ph) * dirz; hsh.position.z = L * Math.sin(piv.rotation.x); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.x) > 3.8 + RR) return false; const a = piv.rotation.x, hz = L * Math.sin(a), hy = top - 0.4 - L * Math.cos(a); return Math.hypot(l.z - hz, l.y - hy) < 3 + RR || segDist(l.z, l.y, 0, top - 0.4, hz, hy) < 0.4 + RR; });
    };
    const rollLog = (d, lx, ph, amp) => {   // rondin geant qui roule d'un bord a l'autre de la piste (il ne roule que sur le sol : on peut passer au-dessus)
      const g = mk(d, lx), cyy = 5.6; const lg = new T3.Group(); g.add(lg); lg.userData.dyn = true; const body = cy(5.6, 5.6, 10, '#7a5634', 22); body.rotation.x = Math.PI / 2; lg.add(body); dynSh(g, body);
      for (const z of [-4.2, 0, 4.2]) { const bd = cy(5.7, 5.7, 0.6, '#3a2a14', 22); bd.rotation.x = Math.PI / 2; bd.position.z = z; lg.add(bd); } for (const z of [-5.05, 5.05]) { const ring = new T3.Mesh(new T3.TorusGeometry(3.6, 0.5, 8, 24), matS('#d8b480')); ring.position.z = z; lg.add(ring); }
      const hsh = blob(g, 0, 0, 14, 11);
      ups.push((t) => { const x = amp * Math.sin(t * 0.75 + ph); lg.position.set(x, cyy, 0); lg.rotation.z = -x / 5.6; hsh.position.x = x; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); return Math.abs(l.z) < 5.4 + RR && Math.hypot(l.x - lg.position.x, l.y - cyy) < 5.6 + RR; });
    };
    const curtain = (d, n, ph) => {   // rideau de lianes : des lianes verticales qui ondulent ; on passe entre elles ou au-dessus
      const g = mk(d, 0), W0 = Math.max(12, I.W(d) - 6), vs = [], top = 26;
      const bar = bx(2 * W0 + 6, 1.4, 1.6, WOODD); bar.position.y = top + 0.6; g.add(bar);
      for (let i = 0; i < n; i++) { const x = -W0 + (2 * W0) * (i + 0.5) / n, v = new T3.Group(); v.position.set(x, top, 0); g.add(v); v.userData.dyn = true; const len = 18 + (i % 3) * 2, vr = cy(0.55, 0.45, len, '#3f8a3a', 8); vr.position.y = -len / 2; v.add(vr); for (let k = 0; k < 4; k++) { const lf = new T3.Mesh(new T3.ConeGeometry(0.9, 2.2, 5), mat('#5fbf4a')); lf.position.set(k % 2 ? 0.9 : -0.9, -3 - k * 4, 0); lf.rotation.z = k % 2 ? -1.1 : 1.1; v.add(lf); } vs.push({ v, x, len, i }); blob(g, x, 0, 4, 4); }
      ups.push((t) => { for (const o of vs) o.v.rotation.z = 0.14 * Math.sin(t * 1.1 + ph + o.i * 0.8); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 1.2 + RR || l.y > top + 1) return false; for (const o of vs) { const a = o.v.rotation.z, ex = o.x + Math.sin(a) * o.len, ey = top - Math.cos(a) * o.len; if (segDist(l.x, l.y, o.x, top, ex, ey) < 0.55 + RR) return true; } return false; });
    };
    const totem = (d, lx, ph, dir) => {   // totem de bois : mat central, trois bras a des hauteurs differentes qui tournent lentement
      const g = mk(d, lx), HT = 26, arms = [13, 13, 13], R2 = 13; blob(g, 0, 0, 10, 10); I.boxes.push([d - 2.6, d + 2.6, lx * sx - 2.6, lx * sx + 2.6, 0, HT]);
      const post = cy(2, 2.6, HT, '#7a5634', 14); post.position.y = HT / 2; g.add(post); for (let k = 0; k < 4; k++) { const rg = cy(2.8, 2.8, 0.7, k % 2 ? '#d8b480' : '#3a2a14', 14); rg.position.y = 3 + k * 6.5; g.add(rg); } const face = new T3.Mesh(new T3.SphereGeometry(2.6, 14, 10), matS('#a67c48')); face.position.y = HT + 1.2; g.add(face);
      const rot = new T3.Group(); g.add(rot); rot.userData.dyn = true; const bars = []; arms.forEach((h, i) => { const ag = new T3.Group(); ag.position.y = h; ag.rotation.y = i * 2.094; const bar = bx(2 * R2, 22, 1.5, i % 2 ? '#c08550' : '#8a5a2a'); ag.add(bar); dynSh(g, bar); for (const sg of [-1, 1]) { const tip = new T3.Mesh(new T3.SphereGeometry(1.3, 10, 8), matS(i % 2 ? '#ffd23a' : '#d9382c')); tip.position.x = sg * R2; ag.add(tip); } rot.add(ag); bars.push({ ag, h }); });
      ups.push((t) => { rot.rotation.y = dir * t * 0.55 + ph; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.hypot(l.x, l.z) < 2.6 + RR && l.y < HT + 3) return true; for (const b of bars) { if (Math.abs(l.y - b.h) > 11 + RR) continue; const th = rot.rotation.y + b.ag.rotation.y, t2 = l.x * Math.cos(th) - l.z * Math.sin(th), pr = Math.abs(l.x * Math.sin(th) + l.z * Math.cos(th)); if (Math.abs(t2) < R2 + 1.3 + RR && pr < 0.75 + RR) return true; } return false; });
    };

    const tube = (d0, len, o) => {   // tuyau : on entre, la fusee est guidee par les parois, on ressort de l'autre cote ; le vide se traverse a l'interieur (+ un peu de vitesse)
      const hw = o.hw || 9, ht = o.ht || 21;
      I.boxes.push([d0, d0 + len, -hw - 3, -hw, -3, ht + 3], [d0, d0 + len, hw, hw + 3, -3, ht + 3], [d0, d0 + len, -hw - 3, hw + 3, ht, ht + 3], [d0, d0 + len, -hw - 3, hw + 3, -3.4, 0]);
      I.tubes.push({ d0, d1: d0 + len }); grp.add(tubeMesh(T, I, d0, len, hw, ht, o.cols, o.op === undefined ? 1 : o.op, o.accent));
    };

    const slideWall = (d, ph, amp, holeW, spd) => {   // mur de glace pleine hauteur dont le trou coulisse d'un cote a l'autre : il faut viser le trou
      const g = mk(d, 0), Wb = I.W(d) + 2, H = 22.5, TH = 2.4, bandc = '#ff4fd8';
      const mk2 = (c) => { const m = new T3.Mesh(new T3.BoxGeometry(1, H, TH), matS(c)); m.position.y = H / 2; const b1 = new T3.Mesh(new T3.BoxGeometry(1, 1.4, TH + 0.12), matS(bandc)); b1.position.y = H / 2 - 1.2; m.add(b1); const b2 = new T3.Mesh(new T3.BoxGeometry(1, 1.4, TH + 0.12), matS('#ffffff')); b2.position.y = -H / 2 + 2.2; m.add(b2); g.add(m); m.userData.dyn = true; return m; };
      const mL = mk2('#dff4ff'), mR = mk2('#c6e6fb'); dynSh(g, mL); dynSh(g, mR); let xh = 0;
      ups.push((t) => { xh = amp * Math.sin(t * spd + ph); const hl = xh - holeW / 2, hr = xh + holeW / 2; mL.scale.x = Math.max(0.01, hl + Wb); mL.position.x = (-Wb + hl) / 2; mR.scale.x = Math.max(0.01, Wb - hr); mR.position.x = (hr + Wb) / 2; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > TH / 2 + RR || l.y > H + RR || Math.abs(l.x) > Wb + 2) return false; return Math.abs(l.x - xh) > holeW / 2 - RR; });
    };
    const icicles = (d, n, ph) => {   // stalactites qui tombent du plafond : un cercle rouge au sol previent
      const g = mk(d, 0), Wc = I.W(d) - 9, cols = [], P = 4.6, TOP = 24;
      for (let i = 0; i < n; i++) { const x = -Wc + 2 * Wc * (i + 0.5) / n, gr = new T3.Group(); gr.position.x = x; g.add(gr); gr.userData.dyn = true; const cone = new T3.Mesh(new T3.ConeGeometry(3.2, 14, 9), matS('#bfe8ff')); cone.rotation.x = Math.PI; cone.position.y = 7; gr.add(cone); const tip = new T3.Mesh(new T3.ConeGeometry(1.1, 3, 6), matS('#ffffff')); tip.rotation.x = Math.PI; tip.position.y = 1.5; gr.add(tip);
        const ring = new T3.Mesh(new T3.RingGeometry(3, 4.6, 24), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.75, side: T3.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.25, 0); ring.visible = false; g.add(ring); ring.userData.noShadow = true; dynSh(g, cone); cols.push({ x, gr, ring, off: ph + i * 1.3, tip: TOP }); }
      ups.push((t) => { for (const c of cols) { const k = (t + c.off) % P; let y = TOP; if (k < 2.2) y = TOP; else if (k < 3.0) y = TOP; else if (k < 3.2) y = TOP + (0.3 - TOP) * ((k - 3.0) / 0.2); else if (k < 3.9) y = 0.3; else y = 0.3 + (TOP - 0.3) * ((k - 3.9) / 0.7); c.tip = y; c.gr.position.y = y; c.ring.visible = k >= 2.2 && k < 3.9 && (k < 3.0 ? ((t * 8) | 0) % 2 === 0 : true); } g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); for (const c of cols) { if (Math.abs(l.x - c.x) < 3.2 + RR && Math.abs(l.z) < 3.2 + RR && l.y + RR > c.tip && l.y - RR < c.tip + 14) return true; } return false; });
    };
    const crystals = (d, k, lx0) => { I.evD.push(d);   // cristaux de glace (solides) en slalom
      const xs = lx0 === undefined ? (k % 2 ? [-30, -10, 10, 30] : [-20, 0, 20]) : [lx0 - 11, lx0, lx0 + 11];
      for (const lx of xs) { const g = mk(d, lx); const base = new T3.Mesh(new T3.ConeGeometry(2.6, 18, 6), matS(k % 2 ? '#9fdcff' : '#cdeeff')); base.position.y = 9; g.add(base); const s2 = new T3.Mesh(new T3.ConeGeometry(1.5, 11, 6), matS('#ffffff')); s2.position.set(2.8, 5.5, 1.2); s2.rotation.z = -0.35; g.add(s2); const s3 = new T3.Mesh(new T3.ConeGeometry(1.2, 9, 6), matS('#ff9bea')); s3.position.set(-2.6, 4.5, -1); s3.rotation.z = 0.4; g.add(s3); I.boxes.push([d - 2.4, d + 2.4, lx * sx - 2.4, lx * sx + 2.4, 0, 19]); }
    };
    const slick = (d0, len) => { I.slick.push({ d0, d1: d0 + len }); };

    const stairs = (d, k, lx0) => { I.evD.push(d);   // marches de pyramide (solides), en slalom
      const x1 = lx0 === undefined ? ((k * 17) % 29) - 28 : lx0 - 11;
      for (const lx of lx0 === undefined ? [x1, x1 + 24] : [x1, x1 + 22]) { const g = mk(d, lx); const tiers = [[14, 6], [10, 6], [6, 6]]; let y0 = 0;
        tiers.forEach(([w, h], q) => { const b = bx(w, h, w, q % 2 ? '#d9a55b' : '#e8c27a'); b.position.y = y0 + h / 2; g.add(b); const st = bx(w + 0.2, 0.9, w + 0.2, '#2fb8b0'); st.position.y = y0 + 1.2; g.add(st); I.boxes.push([d - w / 2, d + w / 2, lx * sx - w / 2, lx * sx + w / 2, y0, y0 + h]); y0 += h; });
        const top = new T3.Mesh(new T3.ConeGeometry(3.2, 4, 4), matS('#ffd23a')); top.position.y = y0 + 2; top.rotation.y = 0.785; g.add(top); }
    };
    const pistons = (d, k) => {   // pistons de temple : des blocs de pierre sortent des murs, un cote puis l'autre
      const g = mk(d, 0), Wb = I.W(d) + 2, MX = Math.min(58, Wb * 1.25), DZ = 8, H = 22.5;
      const mk2 = (c) => { const m = new T3.Mesh(new T3.BoxGeometry(1, H, DZ), matS(c)); m.position.y = H / 2; for (const yy of [-H / 2 + 2, 0, H / 2 - 2]) { const b = new T3.Mesh(new T3.BoxGeometry(1, 1.2, DZ + 0.15), matS('#2fb8b0')); b.position.y = yy; m.add(b); } const eg = new T3.Mesh(new T3.BoxGeometry(0.6, H - 2, DZ - 1), matS('#b9793a')); eg.position.set(0.5, 0, 0); m.add(eg); g.add(m); m.userData.dyn = true; return m; };
      const mL = mk2('#e0b878'), mR = mk2('#c99a5c'); dynSh(g, mL); dynSh(g, mR); let lenL = 0, lenR = 0;
      ups.push((t) => { const a = Math.sin(t * 0.9 + k * 1.7); lenL = MX * Math.max(0, a) ** 0.6; lenR = MX * Math.max(0, -a) ** 0.6; mL.scale.x = Math.max(0.01, lenL + 4); mL.position.x = -Wb + (lenL + 4) / 2 - 4; mR.scale.x = Math.max(0.01, lenR + 4); mR.position.x = Wb - (lenR + 4) / 2 + 4; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > DZ / 2 + RR || l.y > H + RR) return false; return l.x < -Wb + lenL + RR || l.x > Wb - lenR - RR; });
    };
    const gears = (d, ph) => {   // deux engrenages geants cote a cote, en sens inverse : il faut passer entre les rayons
      const g = mk(d, 0), R0 = 15, cy0 = 11, ws = [];
      for (const sg of [-1, 1]) { const w = new T3.Group(); w.position.set(sg * (R0 + 0.5), cy0, 0); g.add(w); w.userData.dyn = true; const rim = new T3.Mesh(new T3.TorusGeometry(R0, 1.2, 8, 36), matS('#98a2b0')); w.add(rim); const hub = cy(2.6, 2.6, 3.4, '#f0b429', 14); hub.rotation.x = Math.PI / 2; w.add(hub);
        for (let q = 0; q < 4; q++) { const sp = bx(2 * R0, 1.8, 1.8, q % 2 ? '#7c8696' : '#f0b429'); sp.rotation.z = q * Math.PI / 4; w.add(sp); }
        for (let q = 0; q < 14; q++) { const a = q / 14 * 6.2832, tt = bx(1.8, 2.6, 2.4, '#f0b429'); tt.position.set(Math.cos(a) * (R0 + 1.4), Math.sin(a) * (R0 + 1.4), 0); tt.rotation.z = a; w.add(tt); } ws.push({ w, dir: sg, rot: 0 }); }
      ups.push((t) => { for (const o of ws) { o.rot = o.dir * t * 0.7 + ph; o.w.rotation.z = o.rot; } g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 1.9 + RR) return false; for (const o of ws) { const x = l.x - o.w.position.x, y = l.y - cy0, r = Math.hypot(x, y); if (r > R0 + 2.6 + RR) continue; if (r > R0 - 1.2 - RR) return true; if (r < 2.8 + RR) return true; for (let q = 0; q < 4; q++) { const a = o.rot + q * Math.PI / 4, along = x * Math.cos(a) + y * Math.sin(a), perp = -x * Math.sin(a) + y * Math.cos(a); if (Math.abs(perp) < 1.0 + RR && Math.abs(along) < R0) return true; } } return false; });
    };
    const steam = (d, n, ph) => {   // jets de vapeur : le tuyau chauffe (orange), puis le jet part
      const g = mk(d, 0), Wc = I.W(d) - 9, P = 4.2, cols = [];
      for (let i = 0; i < n; i++) { const x = -Wc + 2 * Wc * (i + 0.5) / n, stub = cy(2.2, 2.6, 2.6, '#7c8696', 12); stub.position.set(x, 1.3, 0); g.add(stub); const cap = cy(2.4, 2.4, 0.7, '#f0b429', 12); cap.position.set(x, 2.7, 0); g.add(cap);
        const col = new T3.Mesh(new T3.CylinderGeometry(3.2, 3.8, 24, 12, 1, true), new T3.MeshBasicMaterial({ color: '#f4f8ff', transparent: true, opacity: 0.55, side: T3.DoubleSide, depthWrite: false })); col.position.set(x, 14.5, 0); col.visible = false; col.userData.noShadow = true; g.add(col);
        const hot = new T3.Mesh(new T3.CylinderGeometry(2.45, 2.45, 0.5, 12), new T3.MeshBasicMaterial({ color: '#ff6a1a' })); hot.position.set(x, 3.1, 0); hot.visible = false; hot.userData.noShadow = true; g.add(hot); cols.push({ x, col, hot, off: ph + i * 1.1, on: false }); I.boxes.push([d - 2.6, d + 2.6, x * sx - 2.6, x * sx + 2.6, 0, 3]); }
      ups.push((t) => { for (const c of cols) { const k = (t + c.off) % P; c.hot.visible = k >= 2.2 && k < 3.0 && ((t * 7) | 0) % 2 === 0; c.on = k >= 3.0 && k < 3.9; c.col.visible = c.on; if (c.on) c.col.scale.x = c.col.scale.z = 0.9 + 0.12 * Math.sin(t * 30); } });
      addHit(d, (pos) => { const l = loc(g, pos); for (const c of cols) if (c.on && Math.abs(l.x - c.x) < 3.2 + RR && Math.abs(l.z) < 3.2 + RR && l.y < 24) return true; return false; });
    };
    const crates = (d, k, lx0) => { I.evD.push(d);   // piles de caisses (solides) en slalom
      const xs = lx0 === undefined ? (k % 2 ? [-30, -10, 10, 30] : [-20, 0, 20]) : [lx0 - 11, lx0 + 11];
      for (const lx of xs) { const g = mk(d, lx), n = 2 + ((k + Math.abs(lx)) % 2); for (let q = 0; q < n; q++) { const b = bx(7.4, 6.2, 7.4, q % 2 ? '#c98b4a' : '#f0b429'); b.position.y = 3.1 + q * 6.2; b.rotation.y = (q - 1) * 0.12; g.add(b); const st = bx(7.6, 0.8, 7.6, '#2a2d33'); st.position.y = 3.1 + q * 6.2; g.add(st); } I.boxes.push([d - 3.8, d + 3.8, lx * sx - 3.8, lx * sx + 3.8, 0, n * 6.2]); }
    };

    // ---- trajets guides (lianes, trampolines) : la fusee est emportee le long d'une courbe a grande vitesse, sans pilotage ----
    const latSign = (g, d) => { const xw = new T3.Vector3(1, 0, 0).applyQuaternion(g.quaternion), a0 = T.at(d, 0, 0), a1 = T.at(d, 1, 0); return ((a1[0] - a0[0]) * xw.x + (a1[2] - a0[2]) * xw.z) >= 0 ? 1 : -1; };
    const guide = (pts, o) => {
      const cr = new T3.CatmullRomCurve3(pts.map((p) => new T3.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.5), L = cr.getLength(), n = Math.max(10, Math.round(L / 1.5)), samp = cr.getSpacedPoints(n).map((v) => [v.x, v.y, v.z]);
      I.paths.push({ d: o.trig[0], ox: o.trig[1], h: o.trig[2], r: o.r || 5, rh: o.rh || 5, samp, step: L / n, sp: o.sp || 55, label: o.label });
      const wp = samp.map((q) => { const p = T.at(q[0], q[1], I.bank(q[0]) * q[1] + q[2]); return new T3.Vector3(p[0], p[1], p[2]); });
      const tb = new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(wp), Math.min(220, n), o.rad || 0.45, 6, false), o.big ? new T3.MeshLambertMaterial({ color: o.col, side: T3.DoubleSide, transparent: true, opacity: 0.88 }) : o.glow ? new T3.MeshBasicMaterial({ color: o.col, transparent: true, opacity: 0.5, depthWrite: false }) : matS(o.col)); tb.frustumCulled = false; tb.userData.noShadow = true; grp.add(tb);
    };
    // ================= ARCHIPEL =================
    const bumpers = (d0) => {   // champ de bumpers ronds, en quinconce
      I.evD.push(d0 + 38);
      for (const [dd, xs] of [[0, [-27, -9, 9, 27]], [38, [-18, 0, 18]], [76, [-27, -9, 9, 27]]]) for (const lx of xs) { const g = mk(d0 + dd, lx), base = cy(3.6, 4.0, 3, '#ffffff', 20); base.position.y = 1.5; g.add(base); const body = cy(3.3, 3.5, 7, '#ff4f9a', 20); body.position.y = 6.5; g.add(body);
        for (let q = 0; q < 2; q++) { const band = cy(3.55, 3.55, 0.8, q ? '#ffd23a' : '#ffffff', 20); band.position.y = 4.4 + q * 4.4; g.add(band); } const dome = new T3.Mesh(new T3.SphereGeometry(3.3, 18, 10, 0, 6.2832, 0, 1.5708), matS('#ff7ab8')); dome.position.y = 10; g.add(dome); I.boxes.push([d0 + dd - 3.2, d0 + dd + 3.2, lx * sx - 3.2, lx * sx + 3.2, 0, 13.4]); }
    };
    const tourniquet = (d) => {   // pales couchees qui tournent comme une porte a tambour : il faut passer entre deux pales
      const g = mk(d, 0), Wb = I.W(d) + 3, cy0 = 11, R0 = 11, rot = new T3.Group(); rot.position.y = cy0; g.add(rot); rot.userData.dyn = true; const ax = cy(1.4, 1.4, 2 * Wb, '#ffd23a', 12); ax.rotation.z = Math.PI / 2; rot.add(ax); I.evD.push(d);
      for (let q = 0; q < 3; q++) { const arm = new T3.Group(); arm.rotation.x = q * 2.094; const blade = bx(2 * Wb - 2, R0, 1.6, q % 2 ? '#ff4f9a' : '#ffffff'); blade.position.y = R0 / 2 + 0.6; arm.add(blade); for (let k = -3; k <= 3; k++) { const st = bx(2.4, R0 - 1, 1.8, '#ffd23a'); st.position.set(k * Wb / 3.4, R0 / 2 + 0.6, 0); arm.add(st); } rot.add(arm); dynSh(g, blade); }
      ups.push((t) => { rot.rotation.x = t * 0.85; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.x) > Wb + 1) return false; const dy = l.y - cy0, dz = l.z; if (Math.hypot(dy, dz) < 2.2 + RR) return true; for (let q = 0; q < 3; q++) { const a = rot.rotation.x + q * 2.094, along = dy * Math.cos(a) + dz * Math.sin(a), perp = -dy * Math.sin(a) + dz * Math.cos(a); if (along > 0 && along < R0 + 1.2 && Math.abs(perp) < 0.9 + RR) return true; } return false; });
    };
    const gommes = (d, lx0) => {   // boules de gomme rebondissantes qui foncent sur toi
      const g = mk(d, lx0), cols = ['#ff4f9a', '#ffd23a', '#43d6a0', '#7a3cf0', '#2f8cff'], xs = [-14, -5, 5, 14], balls = []; I.evD.push(d + 20);
      xs.forEach((x, i) => { const m = new T3.Mesh(new T3.SphereGeometry(2.7, 16, 12), matS(cols[i])); const hl = new T3.Mesh(new T3.SphereGeometry(0.7, 8, 6), new T3.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(-1.1, 1.2, 1.7); m.add(hl); g.add(m); m.userData.dyn = true; dynSh(g, m); balls.push({ m, x, off: i * 0.31, y: 3, z: 60 }); });
      ups.push((t) => { for (const b of balls) { const u = (t * 0.16 + b.off) % 1; b.z = 60 - 130 * u; b.y = 3 + 9 * Math.abs(Math.sin(Math.PI * u * 7)); b.m.position.set(b.x, b.y, b.z); b.m.rotation.x = t * 3; } g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); for (const b of balls) if (Math.hypot(l.x - b.x, l.y - b.y, l.z - b.z) < 2.7 + RR) return true; return false; });
    };
    const macarons = (d, lx) => {   // colonnes de macarons qui montent et descendent en vague
      for (let i = 0; i < 5; i++) { const dd = d + i * 22, x = lx + ((i % 3) - 1) * 10, g = mk(dd, x), body = cy(4.2, 4.2, 1, i % 2 ? '#ff7ab8' : '#43d6a0', 20), cream = cy(4.4, 4.4, 1.1, '#ffffff', 20), cap = cy(4.2, 4.2, 1, i % 2 ? '#ff7ab8' : '#43d6a0', 20); let top = 4; I.evD.push(dd);
        g.add(body); g.add(cream); g.add(cap); body.userData.dyn = cream.userData.dyn = cap.userData.dyn = true; dynSh(g, body);
        ups.push((t) => { top = 4 + 15 * (0.5 + 0.5 * Math.sin(t * 1.25 + i * 1.3)); body.scale.y = Math.max(0.5, top - 2.2); body.position.y = (top - 2.2) / 2; cream.position.y = top - 1.6; cap.position.y = top - 0.5; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); return Math.hypot(l.x, l.z) < 4.4 + RR && l.y < top + RR; }); }
    };
    const hublot = (d) => {   // un grand disque a trou qui tourne : il faut viser le trou
      const g = mk(d, 0), Wb = I.W(d) + 3, RD = 24, HR = 6.8, HO = 12.5, cy0 = 11, wheel = new T3.Group(); wheel.position.y = cy0; g.add(wheel); wheel.userData.dyn = true; I.evD.push(d);
      const op = [], hp = []; for (let q = 0; q < 56; q++) { const a = q / 56 * 2 * Math.PI; op.push(new T3.Vector2(Math.cos(a) * RD, Math.sin(a) * RD)); } for (let q = 0; q < 32; q++) { const a = -q / 32 * 2 * Math.PI; hp.push(new T3.Vector2(HO + Math.cos(a) * HR, Math.sin(a) * HR)); } const sh = new T3.Shape(op); sh.holes.push(new T3.Path(hp));   // v404 : contours donnes point par point (disque bien plein)
      const geo = new T3.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false, curveSegments: 40 }); geo.translate(0, 0, -1.2); const disc = new T3.Mesh(geo, matS('#ff6fae')); wheel.add(disc); dynSh(g, disc);
      const rim = new T3.Mesh(new T3.TorusGeometry(RD, 0.9, 8, 48), matS('#ffd23a')); wheel.add(rim); const hr = new T3.Mesh(new T3.TorusGeometry(HR, 0.6, 8, 28), matS('#ffffff')); hr.position.x = HO; wheel.add(hr);
      for (let q = 0; q < 8; q++) { const a = q / 8 * 6.2832, dot = new T3.Mesh(new T3.SphereGeometry(1.1, 8, 6), matS(q % 2 ? '#ffffff' : '#2f8cff')); dot.position.set(Math.cos(a) * 19, Math.sin(a) * 19, 1.3); wheel.add(dot); }
      for (const sgn2 of [-1, 1]) { const w = bx(Wb - RD, 36, 2.8, sgn2 > 0 ? '#7a3cf0' : '#ff4f9a'); w.position.set(sgn2 * (RD + Wb) / 2, 18, 0); g.add(w); I.boxes.push([d - 1.4, d + 1.4, sgn2 > 0 ? RD : -Wb, sgn2 > 0 ? Wb : -RD, 0, 36]); }
      let hx = HO, hy = cy0; ups.push((t) => { const a = t * 0.55; wheel.rotation.z = a; hx = HO * Math.cos(a); hy = cy0 + HO * Math.sin(a); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 1.2 + RR || Math.abs(l.x) > RD + RR) return false; if (Math.hypot(l.x, l.y - cy0) > RD + RR) return false; return Math.hypot(l.x - hx, l.y - hy) > HR - RR; });
    };
    const beignets = (d0) => {   // beignets glaces flottants dans le vide : il faut passer dans le trou
      for (const [dd, lx, y] of [[22, 0, 11], [52, -14, 15], [82, 13, 8]]) { const g = mk(d0 + dd, lx), ring = new T3.Group(); ring.position.y = y; g.add(ring); const base = new T3.Mesh(new T3.TorusGeometry(7.8, 2.4, 14, 28), matS('#c98b4a')); ring.add(base); const ic = new T3.Mesh(new T3.TorusGeometry(7.8, 2.2, 14, 28, 6.2832), matS(dd === 52 ? '#43d6a0' : '#ff7ab8')); ic.position.z = 0.5; ic.scale.set(1, 1, 0.8); ring.add(ic);
        for (let q = 0; q < 22; q++) { const a = q * 0.29, sp = bx(0.5, 0.5, 1.2, ['#ffffff', '#ffd23a', '#2f8cff'][q % 3]); sp.position.set(Math.cos(a * 4.9) * 7.8, Math.sin(a * 4.9) * 7.8, 2.2); sp.rotation.z = a; ring.add(sp); } I.evD.push(d0 + dd);
        addHit(d0 + dd, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 3) return false; for (let k = 0; k < 18; k++) { const a = k / 18 * 6.2832; if (Math.hypot(l.x - Math.cos(a) * 7.8, l.y - y - Math.sin(a) * 7.8) < 2.4 + RR + 0.5) return true; } return false; }); }
    };
    const trampolines = (d) => {   // trois trampolines : ils lancent par-dessus un mur de gelee (ou on passe par le portillon)
      I.evD.push(d + 60); const wd = I.W(d) + 3, g0 = 28 * sx;
      for (const lx of [-22, 0, 22]) { const g = mk(d + 60, lx), L = lx * sx; const base = cy(4.8, 5.2, 1.4, '#43d6a0', 22); base.position.y = 0.7; g.add(base); const pad = cy(4.4, 4.4, 0.9, '#ff4f9a', 22); pad.position.y = 1.85; g.add(pad); const ring = new T3.Mesh(new T3.TorusGeometry(4.5, 0.35, 8, 28), matS('#ffd23a')); ring.rotation.x = Math.PI / 2; ring.position.y = 2.4; g.add(ring);
        const beam = new T3.Mesh(new T3.CylinderGeometry(6, 6, 12, 20, 1, true), new T3.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.2, side: T3.DoubleSide, depthWrite: false, fog: false })); beam.position.y = 8; beam.userData.noShadow = true; g.add(beam); const top = new T3.Mesh(new T3.TorusGeometry(6, 0.5, 8, 28), new T3.MeshBasicMaterial({ color: '#ffe066', fog: false })); top.rotation.x = Math.PI / 2; top.position.y = 14; top.userData.noShadow = true; g.add(top);
        guide([[d + 60, L, 3], [d + 76, L * 0.5, 22], [d + 100, 0, 39], [d + 130, 0, 36], [d + 156, 0, 22], [d + 178, 0, 11]], { trig: [d + 60, L, 4], r: 9, rh: 8, sp: 52, col: '#ffe066', rad: 0.3, glow: true, label: 'TRAMPOLINE : FONCE DESSUS !' }); }
      I.boxes.push([d + 108, d + 112, -wd, g0 - 4.5, 0, 32], [d + 108, d + 112, g0 + 4.5, wd, 0, 32]);
      for (const [a, b] of [[-wd, g0 - 4.5], [g0 + 4.5, wd]]) { const g = mk(d + 110, (a + b) / 2 * sx), w = bx(b - a, 32, 4.4, '#ff7ab8'); w.position.y = 16; g.add(w); for (let q = 0; q < 14; q++) { const sp = bx(0.7, 0.7, 4.6, ['#ffffff', '#ffd23a', '#2f8cff'][q % 3]); sp.position.set(((q * 37) % 100 / 100 - 0.5) * (b - a - 2), 4 + (q * 53) % 26, 0); g.add(sp); } const flag = bx(b - a, 1.6, 4.8, '#ffd23a'); flag.position.y = 32.4; g.add(flag); }
    };
    const lolly = (d, lx, ph) => {   // sucette geante qui balance
      const g = mk(d, lx), top = 25, L = 19, span = 14, A = 0.62; gantry(g, span, top, false, d, lx); const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv); piv.userData.dyn = true; const stk = cy(0.3, 0.3, L - 2.5, '#ffffff', 6); stk.position.y = -(L - 2.5) / 2; piv.add(stk);
      const head = new T3.Group(); head.position.y = -L; piv.add(head); const cd = new T3.Mesh(new T3.SphereGeometry(3.1, 20, 14), matS('#ff4f9a')); cd.scale.z = 0.55; head.add(cd); for (const z of [1.8, -1.8]) { const sw = new T3.Mesh(new T3.TorusGeometry(1.7, 0.45, 8, 20), matS('#ffffff')); sw.position.z = z; head.add(sw); } dynSh(g, cd); I.evD.push(d);
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.6 + ph); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos), a = piv.rotation.z, hx = L * Math.sin(a), hy = top - 0.6 - L * Math.cos(a); if (Math.abs(l.z) > 2 + RR) return false; return Math.hypot(l.x - hx, l.y - hy) < 3.1 + RR || segDist(l.x, l.y, 0, top - 0.6, hx, hy) < 0.4 + RR; });
    };
    // ================= JUNGLE =================
    const flowers = (d, lx0) => {   // fleurs carnivores : leurs petales s'ouvrent et se referment
      I.evD.push(d + 20);
      [-9, 9].forEach((o, i) => { const g = mk(d + i * 24, lx0 + o), ps = []; let ang = 0.06; const ph = i * 2.1;
        for (const sg of [-1, 1]) { const piv = new T3.Group(); piv.position.set(sg * 1.2, 2, 0); g.add(piv); piv.userData.dyn = true; const pet = bx(1.8, 21, 8, '#3f9a44'); pet.position.y = 10.5; piv.add(pet); const inn = bx(0.4, 19, 7, '#ff5fa8'); inn.position.set(-sg * 1.0, 10.5, 0); piv.add(inn); for (let k = 0; k < 4; k++) { const tooth = new T3.Mesh(new T3.ConeGeometry(0.7, 2.4, 5), matS('#ffffff')); tooth.position.set(-sg * 1.3, 4 + k * 4.6, 0); tooth.rotation.z = sg * 1.57; piv.add(tooth); } dynSh(g, pet); ps.push({ piv, sg }); }
        const stem = cy(1.0, 1.4, 3, '#2f7a36', 8); stem.position.y = 1.5; g.add(stem);
        ups.push((t) => { ang = 0.06 + 0.72 * (0.5 + 0.5 * Math.sin(t * 0.95 + ph + 1)); for (const p of ps) p.piv.rotation.z = -p.sg * ang; g.updateMatrixWorld(true); });
        addHit(d + i * 24, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 4 + RR) return false; for (const sg of [-1, 1]) { const hx = sg * 1.2, tx = hx + sg * 21 * Math.sin(ang), ty = 2 + 21 * Math.cos(ang); if (segDist(l.x, l.y, hx, 2, tx, ty) < 0.9 + RR) return true; } return false; }); });
    };
    const cascade = (d) => {   // cascade : un mur d'eau qui plaque la fusee vers le bas (il faut tenir HAUT)
      const len = 30; I.winds.push({ d0: d, d1: d + len, lat: 0, head: 0, up: -16 }); I.evD.push(d + 15); const g = mk(d + len / 2, 0), Wb = I.W(d) - 1;
      const sheet = new T3.Mesh(new T3.BoxGeometry(2 * Wb, 30, len), new T3.MeshBasicMaterial({ color: '#6fd8ff', transparent: true, opacity: 0.24, depthWrite: false })); sheet.position.y = 15; sheet.userData.noShadow = true; g.add(sheet);
      const ledge = bx(2 * Wb + 8, 7, 9, '#6b5a48'); ledge.position.set(0, 34, -len / 2); g.add(ledge); const foam = new T3.Mesh(new T3.BoxGeometry(2 * Wb, 0.5, len), new T3.MeshBasicMaterial({ color: '#eefcff', transparent: true, opacity: 0.55 })); foam.position.y = 0.4; foam.userData.noShadow = true; g.add(foam);
      const n = 110, st = [], geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(n * 6), 3)); for (let i = 0; i < n; i++) st.push({ x: (Math.random() * 2 - 1) * Wb, y: Math.random() * 30, z: (Math.random() - 0.5) * len, sp: 22 + Math.random() * 14, L: 4 + Math.random() * 5 });
      const ln = new T3.LineSegments(geo, new T3.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, fog: false })); ln.frustumCulled = false; ln.userData.noShadow = true; g.add(ln);
      ups.push((t, rp) => { if (rp && g.position.distanceToSquared(rp) > 300 * 300) { ln.visible = false; return; } ln.visible = true; const pa = geo.attributes.position.array; for (let i = 0; i < n; i++) { const q = st[i], y = 30 - ((q.y + t * q.sp) % 30); pa[i * 6] = q.x; pa[i * 6 + 1] = y; pa[i * 6 + 2] = q.z; pa[i * 6 + 3] = q.x; pa[i * 6 + 4] = y + q.L; pa[i * 6 + 5] = q.z; } geo.attributes.position.needsUpdate = true; });
    };
    const roots = (d) => {   // arches de racines, basses puis hautes : on monte, on descend
      for (let i = 0; i < 4; i++) { const dd = d + i * 44, low = i % 2 === 0, Wb = I.W(dd) + 3, g = mk(dd, 0); I.evD.push(dd);
        if (low) { I.boxes.push([dd - 2.6, dd + 2.6, -Wb, Wb, 9, 30]); const slab = bx(2 * Wb, 21, 5, '#6b4a2a'); slab.position.y = 19.5; g.add(slab); for (let k = -4; k <= 4; k++) { const rt = new T3.Mesh(new T3.ConeGeometry(1.2 + (k & 1) * 0.5, 6 + ((k * 7) & 3), 6), matS('#7a5634')); rt.rotation.x = Math.PI; rt.position.set(k * Wb / 4.4, 6.5, 0); g.add(rt); } const moss = bx(2 * Wb, 1.4, 5.4, '#4e9a3a'); moss.position.y = 30; g.add(moss); }
        else { I.boxes.push([dd - 2.6, dd + 2.6, -Wb, Wb, 0, 8.5]); const slab = bx(2 * Wb, 8.5, 5, '#6b4a2a'); slab.position.y = 4.25; g.add(slab); for (let k = -4; k <= 4; k++) { const rt = new T3.Mesh(new T3.ConeGeometry(1.2 + (k & 1) * 0.5, 5 + ((k * 5) & 3), 6), matS('#7a5634')); rt.position.set(k * Wb / 4.4, 10.5, 0); g.add(rt); } const moss = bx(2 * Wb, 1.2, 5.4, '#58b04a'); moss.position.y = 9; g.add(moss); } }
    };
    const monkeys = (d, lx0, outer) => {   // un lance-cocos en bambou tire des noix de coco vers la voie : un cercle rouge au sol previent
      const hwl = 20, g = mk(d, lx0 + outer * hwl), Lc = (lx0 + outer * hwl) * sx, TL = (lx0 - outer * 4) * sx, wp = T.at(d + 24, TL, I.bank(d + 24) * TL), tr = cy(1.6, 2.1, 17, '#6b4a2a', 10); tr.position.y = 8.5; g.add(tr); const pl = bx(7, 1.2, 7, '#8a5a2c'); pl.position.y = 17; g.add(pl);
      const mo = new T3.Group(); mo.position.y = 19; g.add(mo); const bd = cy(1.25, 1.5, 4.6, '#7fae4a', 12); bd.rotation.z = -outer * 0.9; bd.position.set(-outer * 0.9, 1.2, 0); mo.add(bd); for (const q of [-1.3, 0.2, 1.7]) { const rg = cy(1.6, 1.6, 0.45, '#4e7a2a', 12); rg.rotation.z = -outer * 0.9; rg.position.set(-outer * (0.9 + q * 0.78), 1.2 + q * 0.62, 0); mo.add(rg); } const ft = bx(3.4, 1.2, 3.4, '#6b4a2a'); ft.position.y = -1.3; mo.add(ft); I.boxes.push([d - 1.8, d + 1.8, Lc - 1.8, Lc + 1.8, 0, 17.8]);
      const nut = new T3.Mesh(new T3.SphereGeometry(1.7, 12, 9), matS('#5a3a1a')), mark = new T3.Mesh(new T3.RingGeometry(2.6, 4, 24), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.75, side: T3.DoubleSide, depthWrite: false })); mark.rotation.x = -Math.PI / 2; mark.position.set(wp[0], wp[1] + 0.25, wp[2]); grp.add(nut, mark); nut.visible = mark.visible = false; mark.userData.noShadow = nut.userData.noShadow = true;
      const P = 3.0, FL = 1.4, st0 = new T3.Vector3(); let live = null; I.evD.push(d);
      ups.push((t) => { const k = t % P, fly = k >= 1.5 && k < 1.5 + FL; mark.visible = k < 1.5 + FL; mo.rotation.z = k > 1.2 && k < 1.7 ? -outer * 0.5 : 0;
        if (fly) { if (!nut.userData.f) { nut.userData.f = 1; g.updateMatrixWorld(true); st0.set(0, 19, 0); g.localToWorld(st0); } const u = (k - 1.5) / FL; nut.position.set(st0.x + (wp[0] - st0.x) * u, st0.y + (wp[1] + 1.7 - st0.y) * u + 5.4 * 4 * u * (1 - u), st0.z + (wp[2] - st0.z) * u); nut.rotation.x = t * 6; nut.visible = true; live = nut.position; } else { nut.visible = false; nut.userData.f = 0; live = null; } });
      addHit(d, (pos) => !!live && pos.distanceTo(live) < 1.7 + RR + 0.4);
    };
    const bees = (d, lx0, amp) => {   // un nuage de pollen (boules roses et blanches) qui balaie sa voie, sorti d'un gros bulbe violet
      const g = mk(d + 60, lx0), n = 14, bs = [], seed = []; I.evD.push(d + 60);
      for (let i = 0; i < n; i++) { const m = new T3.Mesh(new T3.SphereGeometry(0.9, 8, 6), new T3.MeshBasicMaterial({ color: i % 2 ? '#ff7ab8' : '#ffffff' })); g.add(m); m.userData.noShadow = true; bs.push(m); seed.push([i * 2.399, i * 0.83 + 0.4, 4.4 + (i % 3) * 0.9]); }
      const hive = new T3.Mesh(new T3.SphereGeometry(3.2, 12, 9), matS('#c04cf0')); hive.scale.y = 1.35; hive.position.set(-amp - 8, 14, 0); g.add(hive); let pts = [];
      ups.push((t) => { const cx = amp * Math.sin(t * 0.6), cz = 30 * Math.sin(t * 0.45 + 1), cyy = 11 + 5 * Math.sin(t * 0.5); pts.length = 0; for (let i = 0; i < n; i++) { const a = seed[i][0] + t * 1.7, b = seed[i][1] + t * 1.1, r = seed[i][2]; const x = cx + r * Math.cos(a) * Math.sin(b), y = cyy + r * 0.7 * Math.cos(b), z = cz + r * Math.sin(a) * Math.sin(b); bs[i].position.set(x, y, z); pts.push([x, y, z]); } g.updateMatrixWorld(true); });
      addHit(d + 60, (pos) => { const l = loc(g, pos); for (const p of pts) if (Math.hypot(l.x - p[0], l.y - p[1], l.z - p[2]) < 1.0 + RR + 0.5) return true; return false; });
    };
    const fallTrees = (d, lx0, hw) => {   // troncs abattus : ils tremblent, puis tombent en travers de la voie
      for (let i = 0; i < 4; i++) { const dd = d + i * 42, sg = i % 2 ? 1 : -1, g = mk(dd, lx0), piv = new T3.Group(); piv.position.set(sg * hw, 0, 0); g.add(piv); piv.userData.dyn = true; const L = Math.min(40, hw * 1.7), tr = cy(2.2, 2.7, L, '#7a5634', 10); tr.position.y = L / 2; piv.add(tr); const crown = new T3.Mesh(new T3.SphereGeometry(5, 12, 9), matS('#3f9a44')); crown.position.y = L; crown.scale.y = 0.8; piv.add(crown); dynSh(g, tr); I.evD.push(dd);
        let ang = 0; const off = i * 1.3; ups.push((t) => { const k = (t + off) % 5.2; ang = k < 2.4 ? (k > 1.5 ? 0.04 * Math.sin(t * 25) : 0) : k < 2.9 ? 1.5 * Math.pow((k - 2.4) / 0.5, 2) : k < 3.9 ? 1.5 : 1.5 * (1 - (k - 3.9) / 1.3); piv.rotation.z = sg * ang; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 2.7 + RR) return false; const hx = sg * hw, tx = hx - sg * L * Math.sin(ang), ty = L * Math.cos(ang); return segDist(l.x, l.y, hx, 0, tx, ty) < 2.5 + RR; }); }
    };
    const spiders = (d, lx0) => {   // gros fruits a piques qui descendent et remontent au bout de leur liane
      [-8, 8].forEach((x0, i) => { const g = mk(d + 30 + i * 22, lx0), body = new T3.Group(); g.add(body); body.userData.dyn = true; const bd = new T3.Mesh(new T3.SphereGeometry(2.3, 14, 10), matS('#8fbf3a')); body.add(bd);
        for (let k = 0; k < 14; k++) { const a = k * 2.399, b = Math.acos(1 - 2 * (k + 0.5) / 14), sp = new T3.Mesh(new T3.ConeGeometry(0.55, 1.5, 6), matS('#5a8a1f')), dx = Math.sin(b) * Math.cos(a), dy = Math.cos(b), dz = Math.sin(b) * Math.sin(a); sp.position.set(dx * 2.7, dy * 2.7, dz * 2.7); sp.quaternion.setFromUnitVectors(new T3.Vector3(0, 1, 0), new T3.Vector3(dx, dy, dz)); body.add(sp); }
        const thread = cy(0.16, 0.16, 1, '#4e9a3a', 5); g.add(thread); thread.userData.noShadow = true; dynSh(g, bd); let sx2 = x0, sy = 14; I.evD.push(d + 30 + i * 22);
        ups.push((t) => { sy = 14 + 10 * Math.sin(t * 0.8 + i * 1.9); sx2 = x0 + 3 * Math.sin(t * 0.5 + i); body.position.set(sx2, sy, 0); thread.scale.y = 30 - sy; thread.position.set(sx2, (30 + sy) / 2, 0); g.updateMatrixWorld(true); });
        addHit(d + 30 + i * 22, (pos) => { const l = loc(g, pos); return Math.hypot(l.x - sx2, l.y - sy, l.z) < 2.6 + RR + 0.3; }); });
    };
    const brambles = (d, lx0, hw) => {   // ronces : trois murs epineux a trous decales (solides)
      [[0, -8], [30, 9], [60, -2]].forEach(([o, gap], i) => { const dd = d + o, w1 = hw + gap - 5, w2 = hw - gap - 5; I.evD.push(dd);
        for (const [a, b] of [[-hw, gap - 5], [gap + 5, hw]]) { if (b - a < 1) continue; const g = mk(dd, lx0 + (a + b) / 2), w = bx(b - a, 14, 3, '#5a4a2a'); w.position.y = 7; g.add(w); for (let k = 0; k < 9; k++) { const th = new T3.Mesh(new T3.ConeGeometry(0.5, 2.2, 5), matS('#7a8a3a')); th.position.set(((k * 37) % 100 / 100 - 0.5) * (b - a - 2), 2 + (k * 53) % 11, 1.8); th.rotation.x = 1.57; g.add(th); } const top = bx(b - a, 1.6, 3.4, '#3f9a44'); top.position.y = 14.4; g.add(top); I.boxes.push([dd - 1.5, dd + 1.5, Math.min((lx0 + a) * sx, (lx0 + b) * sx), Math.max((lx0 + a) * sx, (lx0 + b) * sx), 0, 15]); } });
    };
    const doors = (d, lx0, hw) => {   // portes battantes : deux battants qui s'ouvrent et se ferment
      const g = mk(d, lx0), L = hw, H = 14, leaves = []; I.evD.push(d);
      for (const sg of [-1, 1]) { const piv = new T3.Group(); piv.position.set(sg * hw, 0, 0); g.add(piv); piv.userData.dyn = true; const lf = bx(L, H, 1.4, sg > 0 ? '#ff4f9a' : '#ffffff'); lf.position.set(-sg * L / 2, H / 2, 0); piv.add(lf); for (let k = 0; k < 3; k++) { const st = bx(L - 1, 1, 1.5, '#ffd23a'); st.position.set(-sg * L / 2, 2.5 + k * 4.5, 0); piv.add(st); } const post = cy(1.0, 1.0, H + 1, '#ffd23a', 10); post.position.set(sg * hw, (H + 1) / 2, 0); g.add(post); dynSh(g, lf); leaves.push({ piv, sg }); }
      let ang = 0; ups.push((t) => { ang = 0.95 * (0.5 + 0.5 * Math.sin(t * 0.9 + d)); for (const l of leaves) l.piv.rotation.y = l.sg * ang; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (l.y > H + RR) return false; for (const sg of [-1, 1]) { const hx = sg * hw, tx = hx - sg * L * Math.cos(ang), tz = L * Math.sin(ang); if (segDist(l.x, l.z, hx, 0, tx, tz) < 1.0 + RR) return true; } return false; });
    };
    const kites = (d, lx0) => {   // cerfs-volants : des losanges qui balaient la voie en haut
      const g = mk(d, lx0), ks = []; I.evD.push(d);
      for (let i = 0; i < 3; i++) { const k = new T3.Group(); g.add(k); k.userData.dyn = true; const body = new T3.Mesh(new T3.OctahedronGeometry(3.3, 0), matS(['#ff4f9a', '#ffd23a', '#2f8cff'][i])); body.scale.set(1, 1.3, 0.25); k.add(body); const tail = cy(0.1, 0.1, 6, '#ffffff', 4); tail.position.y = -6; k.add(tail); dynSh(g, body); const str = cy(0.05, 0.05, 1, '#e8eaee', 4); g.add(str); str.userData.noShadow = true; ks.push({ k, str, x: 0, y: 12, ph: i * 2.1 }); }
      ups.push((t) => { for (const o of ks) { o.x = 11 * Math.sin(t * 0.7 + o.ph); o.y = 12 + 5 * Math.sin(t * 0.9 + o.ph * 1.7); o.k.position.set(o.x, o.y, (o.ph - 2.1) * 8); o.k.rotation.z = Math.cos(t * 0.7 + o.ph) * 0.4; o.str.scale.y = o.y; o.str.position.set(o.x, o.y / 2, (o.ph - 2.1) * 8); } g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); for (const o of ks) if (Math.abs(l.z - (o.ph - 2.1) * 8) < 1.2 + RR && Math.hypot((l.x - o.x) / 3.5, (l.y - o.y) / 4.2) < 1 + RR / 3) return true; return false; });
    };
    // ---- deux etages : une dalle suspendue (le bas : sous la dalle ; le haut : au-dessus) et murs separateurs de voies doubles
    const deckUp = (d0, len, hb, ht, colHex, ramp) => {
      const pos = [], col = [], idx = [], cT = new T3.Color(colHex), cB = new T3.Color('#4a4f66'), cE = new T3.Color('#ffd23a'), P4 = (d, x, h) => T.at(d, x, I.bank(d) * x + h);
      const quad = (a, b, c, e, cc) => { const o = pos.length / 3; for (const p of [a, b, c, e]) pos.push(p[0], p[1], p[2]); for (let k = 0; k < 4; k++) col.push(cc.r, cc.g, cc.b); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); };
      (I.decks || (I.decks = [])).push({ d0, d1: d0 + len, ht });
      const sh = [];
      if (ramp) { const dA = d0 - ramp, hA = 18, cW = new T3.Color('#ffffff'), tp = (d) => hA + (ht - hA) * (d - dA) / ramp, bt = (d) => tp(d) - (1.2 + (ht - hb - 1.2) * (d - dA) / ramp);   // la rampe : une levre basse qui monte jusqu'a l'etage, a chevrons jaunes et blancs
        for (let d = dA; d < d0 - 0.01; d += 4) { const d1 = Math.min(d + 4, d0), w0 = I.W(d) - 1.0, w1 = I.W(d1) - 1.0; if (w0 < 6 || w1 < 6) continue; const cc = (((d - dA) / 4) | 0) % 2 ? cE : cW;
          quad(P4(d, -w0, tp(d)), P4(d, w0, tp(d)), P4(d1, w1, tp(d1)), P4(d1, -w1, tp(d1)), cc); quad(P4(d, -w0, bt(d)), P4(d1, -w1, bt(d1)), P4(d1, w1, bt(d1)), P4(d, w0, bt(d)), cB);
          quad(P4(d, -w0, bt(d)), P4(d1, -w1, bt(d1)), P4(d1, -w1, tp(d1)), P4(d, -w0, tp(d)), cE); quad(P4(d, w0, bt(d)), P4(d, w0, tp(d)), P4(d1, w1, tp(d1)), P4(d1, w1, bt(d1)), cE); }
        { const w = I.W(dA) - 1.0; if (w > 6) quad(P4(dA, -w, bt(dA)), P4(dA, -w, tp(dA)), P4(dA, w, tp(dA)), P4(dA, w, bt(dA)), cE); }
        (I.ramps || (I.ramps = [])).push({ d0: dA, d1: d0, h0: hA, h1: ht }); }
      for (let d = d0; d < d0 + len; d += 6) { const d1 = Math.min(d + 6, d0 + len), w0 = I.W(d) - 1.0, w1 = I.W(d1) - 1.0; if (w0 < 6 || w1 < 6) continue; const alt = ((d / 6) | 0) % 2 ? 0.96 : 1, ct = cT.clone().multiplyScalar(alt);
        quad(P4(d, -w0, ht), P4(d, w0, ht), P4(d1, w1, ht), P4(d1, -w1, ht), ct); quad(P4(d, -w0, hb), P4(d1, -w1, hb), P4(d1, w1, hb), P4(d, w0, hb), cB);
        quad(P4(d, -w0, hb), P4(d1, -w1, hb), P4(d1, -w1, ht), P4(d, -w0, ht), cE); quad(P4(d, w0, hb), P4(d, w0, ht), P4(d1, w1, ht), P4(d1, w1, hb), cE); I.boxes.push([d, d1, -w0, w0, hb, ht]);
        const q4 = (dd, x) => { const p = T.at(dd, x, I.bank(dd) * x + 0.16); return [p[0] + LS.x * ht, p[1], p[2] + LS.z * ht]; }; sh.push([q4(d, -w0), q4(d, w0), q4(d1, w1), q4(d1, -w1)]); }
      { const w = I.W(d0) - 1.0, w2 = I.W(d0 + len) - 1.0; if (w > 6) quad(P4(d0, -w, hb), P4(d0, -w, ht), P4(d0, w, ht), P4(d0, w, hb), cE); if (w2 > 6) quad(P4(d0 + len, -w2, hb), P4(d0 + len, w2, hb), P4(d0 + len, w2, ht), P4(d0 + len, -w2, ht), cE); }
      for (let d = d0 + 18; d < d0 + len - 10; d += 36) { const w = I.W(d) - 3.4; if (w < 6) continue; for (const sg of [-1, 1]) { const p = T.at(d, sg * w, I.bank(d) * sg * w), pc = cy(1.7, 2.1, hb, '#6f7388', 10); pc.position.set(p[0], p[1] + hb / 2, p[2]); grp.add(pc); I.boxes.push([d - 1.7, d + 1.7, sg * w - 1.7, sg * w + 1.7, 0, hb]); } }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide })); m.frustumCulled = false; m.userData.noShadow = true; grp.add(m);
      { const sp = [], si = []; sh.forEach((qq, k) => { const o = k * 4; for (const p of qq) sp.push(p[0], p[1], p[2]); si.push(o, o + 1, o + 2, o, o + 2, o + 3); }); const sg2 = new T3.BufferGeometry(); sg2.setAttribute('position', new T3.Float32BufferAttribute(sp, 3)); sg2.setIndex(si); const sm = new T3.Mesh(sg2, SHM); sm.frustumCulled = false; sm.renderOrder = 2; sm.userData.noShadow = true; grp.add(sm); }
    };
    const divider = (d0, d1, h, style) => {   // mur central : deux voies. Construit par troncons courts qui suivent la pente, le devers et les virages du sol
      I.boxes.push([d0, d1, -1.5, 1.5, 0, h]); const len = d1 - d0, n = Math.max(1, Math.round(len / 12)), sl = len / n, c1 = style === 'wood' ? '#6b4a2a' : style === 'steel' ? '#8b95a3' : style === 'sand' ? '#e0b878' : '#ffd23a', c2 = style === 'wood' ? '#4e9a3a' : style === 'steel' ? '#f0b429' : style === 'sand' ? '#2fb8b0' : '#ff4f9a', c3 = '#ffffff';
      const post = (g, z, k, big) => { const r = big ? 2.7 : 1.9, hh = h + (big ? 4.5 : 1.4), ca = k % 2 ? c2 : c3, cb2 = k % 2 ? c3 : c2, po = cy(r, r * 1.08, hh, ca, 14); po.position.set(0, hh / 2, z); g.add(po); const cap = new T3.Mesh(new T3.SphereGeometry(r * 1.22, 14, 10), matS(cb2)); cap.position.set(0, hh + r * 0.45, z); g.add(cap);
        for (let q = 0; q < (big ? 3 : 1); q++) { const rg = cy(r + 0.4, r + 0.4, 0.9, cb2, 14); rg.position.set(0, hh * (big ? 0.3 + q * 0.22 : 0.55), z); g.add(rg); } };
      for (let k = 0; k < n; k++) { const dm = d0 + (k + 0.5) * sl, g = mk(dm, 0), pa = T.at(dm - sl / 2, 0, 0), pb = T.at(dm + sl / 2, 0, 0), L2 = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]) + 0.4;
        g.rotateX(-Math.atan2(pb[1] - pa[1], Math.hypot(pb[0] - pa[0], pb[2] - pa[2]))); g.updateMatrixWorld(true);
        const base = bx(4.4, 1.4, L2, '#3a4152'); base.position.y = 0.7; g.add(base); const w = bx(2.2, h - 2.4, L2, c1); w.position.y = 1.4 + (h - 2.4) / 2; g.add(w); const rail = cy(1.5, 1.5, L2, c2, 12); rail.rotation.x = Math.PI / 2; rail.position.y = h - 0.7; g.add(rail);
        if (k % 2 === 0) post(g, -L2 / 2 + 0.2, k / 2, k === 0); if (k === n - 1) post(g, L2 / 2 - 0.2, (k + 1) / 2 | 0, false); }
    };
    const onLevel = (h, fn) => {   // pose des obstacles sur l'etage du haut : groupes, collisions et boites decales de h
      const n0 = groups.length, b0 = I.boxes.length; fn(); for (let i = n0; i < groups.length; i++) { groups[i].position.y += h; groups[i].updateMatrixWorld(true); } for (let i = b0; i < I.boxes.length; i++) { I.boxes[i][4] += h; I.boxes[i][5] += h; }
    };
    const cave = (d) => {   // grotte : un plafond de roche bas avec des stalactites et des lueurs bleues
      const a = d + 20, b = d + 180, g = mk((a + b) / 2, 0), Wb = I.W(d) + 3; I.boxes.push([a, b, -Wb, Wb, 14.2, 32]); I.evD.push(d + 100);
      const roof = bx(2 * Wb, 18, b - a, '#4a4033'); roof.position.y = 23; g.add(roof); for (let k = 0; k < 26; k++) { const x = (((k * 37) % 100) / 100 - 0.5) * (2 * Wb - 6), z = (((k * 61) % 100) / 100 - 0.5) * (b - a - 6), h = 3 + (k * 7) % 5, st = new T3.Mesh(new T3.ConeGeometry(1.3 + (k % 3) * 0.4, h, 6), matS(k % 2 ? '#5a4d3e' : '#6b5c4a')); st.rotation.x = Math.PI; st.position.set(x, 14 - h / 2 + 0.2, z); g.add(st); if (k % 4 === 0) { const gl = new T3.Mesh(new T3.SphereGeometry(0.7, 8, 6), new T3.MeshBasicMaterial({ color: '#5fe8ff' })); gl.position.set(x, 13.2 - h, z); gl.userData.noShadow = true; g.add(gl); } }
    };
    const zip = (d) => {   // liane-tyrolienne : on attrape l'anneau et on traverse le vide a toute vitesse
      I.evD.push(d); const g = mk(d, 0), post = cy(1.6, 2.2, 22, '#6b4a2a', 10); post.position.set(0, 11, 0); g.add(post); const rg = new T3.Mesh(new T3.TorusGeometry(5.5, 0.55, 10, 28), new T3.MeshBasicMaterial({ color: '#7cff6a' })); rg.position.set(0, 14, 5); g.add(rg); rg.userData.noShadow = true;
      const pts = [[d + 5, 0, 14], [d + 40, 6, 24], [d + 80, -6, 30], [d + 120, 5, 22], [d + 160, 0, 12], [d + 180, 0, 6]]; guide(pts, { trig: [d + 5, 0, 14], r: 10, rh: 9, sp: 56, col: '#58b04a', rad: 0.5, label: "ATTRAPE L'ANNEAU VERT !" });
      rg.scale.setScalar(1.5); const bm = new T3.Mesh(new T3.CylinderGeometry(0.6, 0.6, 14, 8), new T3.MeshBasicMaterial({ color: '#7cff6a', transparent: true, opacity: 0.4, fog: false })); bm.position.set(0, 7, 5); bm.userData.noShadow = true; g.add(bm);
      for (let q = 1; q <= 4; q++) { const cr = new T3.CatmullRomCurve3(pts.map((p) => new T3.Vector3(p[0], p[1], p[2]))), v = cr.getPoint(q * 0.045), p3 = T.at(v.x, v.y, I.bank(v.x) * v.y + v.z), tg = cr.getTangent(q * 0.045), r2 = new T3.Mesh(new T3.TorusGeometry(7 - q * 0.8, 0.35, 8, 24), new T3.MeshBasicMaterial({ color: '#7cff6a', transparent: true, opacity: 0.8, fog: false })); r2.position.set(p3[0], p3[1], p3[2]); const pa3 = T.at(v.x + tg.x, v.y + tg.y, I.bank(v.x) * v.y + v.z + tg.z); r2.lookAt(pa3[0], pa3[1], pa3[2]); r2.userData.noShadow = true; grp.add(r2); }
    };

    // ================= TERRAIN D'ESSAI =================
    const targets = (d) => {   // cibles pivotantes : de grandes plaques qui tournent sur elles-memes (de face = mur, de profil = passage)
      [-30, -15, 0, 15, 30].forEach((x, i) => { const g = mk(d + (i % 2) * 34, x), piv = new T3.Group(); g.add(piv); piv.userData.dyn = true; const plate = bx(10, 22, 1.2, '#d9a21b'); plate.position.y = 11; piv.add(plate);
        [[4.2, '#ffffff'], [3.2, '#d33a2a'], [2.2, '#ffffff'], [1.2, '#d33a2a']].forEach(([r, c], j) => { for (const sd of [-1, 1]) { const dk = cy(r, r, 0.12, c, 24); dk.rotation.x = Math.PI / 2; dk.position.set(0, 13, sd * (0.68 + j * 0.07)); dk.userData.noShadow = true; piv.add(dk); } }); const post = cy(0.8, 0.8, 24, '#4a5160', 8); post.position.y = 12; g.add(post); dynSh(g, plate); let ang = 0; I.evD.push(d + (i % 2) * 34);
        ups.push((t) => { ang = t * 0.9 * (i % 2 ? 1 : -1) + i * 1.2; piv.rotation.y = ang; g.updateMatrixWorld(true); });
        addHit(d + (i % 2) * 34, (pos) => { const l = loc(g, pos); if (l.y > 23 + RR) return false; return segDist(l.x, l.z, -5 * Math.cos(ang), 5 * Math.sin(ang), 5 * Math.cos(ang), -5 * Math.sin(ang)) < 0.8 + RR; }); });
    };
    const chicane = (d) => {   // chicane de blocs de beton (solides)
      for (let k = 0; k < 7; k++) { const dd = d + k * 24, Wb = I.W(dd) + 2, ln = Wb * 0.62, left = k % 2 === 0, a = left ? -Wb : Wb - ln, b = left ? -Wb + ln : Wb; I.evD.push(dd); I.boxes.push([dd - 3, dd + 3, a, b, 0, 6]);
        const g = mk(dd, (a + b) / 2 * sx), blk = bx(ln, 6, 6, '#c9ccd2'); blk.position.y = 3; g.add(blk); for (let q = 0; q < Math.floor(ln / 5); q++) { const st = bx(2.4, 6.1, 6.1, q % 2 ? '#f2c230' : '#2a2d33'); st.position.set(-ln / 2 + 3 + q * 5, 3, 0); g.add(st); } }
    };
    const turrets = (d, lx0, hw) => {   // tourelles mitrailleuses : un laser rouge, puis une rafale de balles lentes en travers de la voie
      const bullets = []; let live = [];
      for (const sg of [-1, 1]) { const dd = d + (sg > 0 ? 45 : 0), g = mk(dd, lx0), body = new T3.Group(); body.position.set(sg * hw, 6, 0); g.add(body); const base = cy(2.4, 3.2, 4, '#4a5160', 10); base.position.y = 2; g.add(base); base.position.x = sg * hw; const gun = cy(0.6, 0.6, 5, '#23262b', 8); gun.rotation.z = Math.PI / 2; gun.position.x = -sg * 2.6; body.add(gun); const hd = new T3.Mesh(new T3.SphereGeometry(1.8, 10, 8), matS('#5d6652')); body.add(hd); { const lc = lx0 * sx + latSign(g, dd) * sg * hw; I.boxes.push([dd - 2.2, dd + 2.2, lc - 2.2, lc + 2.2, 0, 8]); } I.evD.push(dd);
        const laser = new T3.Mesh(new T3.BoxGeometry(2 * hw, 0.25, 0.25), new T3.MeshBasicMaterial({ color: '#ff3b3b' })); laser.visible = false; laser.userData.noShadow = true; g.add(laser); const pool = []; for (let i = 0; i < 8; i++) { const b = new T3.Mesh(new T3.SphereGeometry(0.9, 8, 6), new T3.MeshBasicMaterial({ color: '#ffb347' })); b.visible = false; b.userData.noShadow = true; g.add(b); pool.push({ b, t0: -9 }); } bullets.push({ g, sg, laser, pool, dd, hw, off: sg > 0 ? 0 : 1.8, hy: 6, last: -1 }); }
      ups.push((t) => { live = []; for (const u of bullets) { const P = 4.4, k = (t + u.off) % P, cyc = Math.floor((t + u.off) / P); if (cyc !== u.last) { u.last = cyc; u.hy = 3 + ((cyc * 7) % 9); u.nf = 0; } u.laser.visible = k < 1.0; u.laser.position.set(0, u.hy, 0);
          if (k >= 1.0 && k < 2.6) { const fi = Math.floor((k - 1.0) / 0.2); while (u.nf <= fi && u.nf < 8) { u.pool[u.nf].t0 = t; u.nf++; } }
          for (const q of u.pool) { const ag = t - q.t0; if (ag >= 0 && ag < 2.6) { const x = -u.sg * (-u.hw) ; q.b.visible = true; q.b.position.set(u.sg * u.hw - u.sg * ag * 26, u.hy, 0); u.g.updateMatrixWorld(true); live.push([u.g, q.b.position]); } else q.b.visible = false; } } });
      addHit(d, (pos) => { for (const [g, bp] of live) { const l = loc(g, pos); if (Math.hypot(l.x - bp.x, l.y - bp.y, l.z - bp.z) < 0.9 + RR + 0.3) return true; } return false; });
    };
    const spots = (d) => {   // projecteurs : des disques de lumiere qui balaient la piste ; etre repere = bloque
      const g = mk(d + 40, 0), Wb = I.W(d) - 6, sp = []; I.evD.push(d + 40);
      for (let i = 0; i < 3; i++) { const lamp = new T3.Mesh(new T3.CylinderGeometry(6, 6, 26, 20, 1, true), new T3.MeshBasicMaterial({ color: '#fff3a8', transparent: true, opacity: 0.22, side: T3.DoubleSide, depthWrite: false, fog: false })); lamp.position.y = 13; lamp.userData.noShadow = true; g.add(lamp); const pool = new T3.Mesh(new T3.CylinderGeometry(6, 6, 0.2, 24), new T3.MeshBasicMaterial({ color: '#fff3a8', transparent: true, opacity: 0.5, fog: false })); pool.position.y = 0.3; pool.userData.noShadow = true; g.add(pool); sp.push({ lamp, pool, x: 0, z: (i - 1) * 40, ph: i * 2.1 }); }
      ups.push((t) => { for (const o of sp) { o.x = Wb * 0.85 * Math.sin(t * 0.55 + o.ph); o.lamp.position.x = o.pool.position.x = o.x; o.lamp.position.z = o.pool.position.z = o.z; } g.updateMatrixWorld(true); });
      addHit(d + 40, (pos) => { const l = loc(g, pos); for (const o of sp) if (Math.hypot(l.x - o.x, l.z - o.z) < 6 && l.y < 26) return true; return false; });
    };
    const barrage = (d, lx0) => {   // ballons de barrage : gros ballons gris retenus par des cables solides
      [[0, -12, 15], [18, 10, 18], [36, -6, 12], [54, 14, 16], [72, -14, 14]].forEach(([o, x, y], i) => { const g = mk(d + o, lx0 + x), ball = new T3.Mesh(new T3.SphereGeometry(5, 16, 12), matS('#9aa0aa')); ball.scale.set(1, 0.82, 1.45); g.add(ball); const band = new T3.Mesh(new T3.TorusGeometry(5, 0.5, 6, 20), matS('#d9a21b')); band.rotation.x = Math.PI / 2; band.scale.set(1, 1.45, 1); g.add(band); const cab = cy(0.35, 0.35, 1, '#4a5160', 5); g.add(cab); cab.userData.noShadow = true; let by = y; I.evD.push(d + o);
        ups.push((t) => { by = y + 2.2 * Math.sin(t * 0.7 + i * 1.7); ball.position.y = band.position.y = by; cab.scale.y = by - 3; cab.position.y = (by - 3) / 2 + 0.5; g.updateMatrixWorld(true); });
        addHit(d + o, (pos) => { const l = loc(g, pos); if (Math.hypot(l.x, (l.y - by) / 0.82, l.z / 1.45) < 5 + RR) return true; return Math.hypot(l.x, l.z) < 0.7 + RR && l.y < by - 3; }); });
    };
    const heli = (d, lx0) => {   // helicopteres de patrouille qui traversent la voie (le rotor aussi bloque)
      [0, 1].forEach((i) => { const g = mk(d + 40 + i * 50, lx0), hc = new T3.Group(); g.add(hc); hc.userData.dyn = true; const body = new T3.Mesh(new T3.SphereGeometry(1, 14, 10), matS('#5d6652')); body.scale.set(2.6, 2.3, 4.6); hc.add(body); const tail = cy(0.5, 0.9, 6, '#5d6652', 8); tail.rotation.x = Math.PI / 2; tail.position.z = -6.5; hc.add(tail);
        const rotor = cy(7, 7, 0.15, '#2a2d33', 20); rotor.position.y = 2.9; hc.add(rotor); const mast = cy(0.3, 0.3, 1, '#2a2d33', 6); mast.position.y = 2.5; hc.add(mast); for (const sg of [-1, 1]) { const sk = cy(0.15, 0.15, 6, '#2a2d33', 5); sk.rotation.x = Math.PI / 2; sk.position.set(sg * 2, -2.6, 0); hc.add(sk); } dynSh(g, body); let hx = 0, hy = 13; I.evD.push(d + 40 + i * 50);
        ups.push((t) => { hx = 12 * Math.sin(t * 0.6 + i * 2.4); hy = 12 + 3 * Math.sin(t * 0.9 + i); hc.position.set(hx, hy, 0); hc.rotation.z = Math.cos(t * 0.6 + i * 2.4) * 0.25; rotor.rotation.y = t * 25; g.updateMatrixWorld(true); });
        addHit(d + 40 + i * 50, (pos) => { const l = loc(g, pos); if (Math.hypot((l.x - hx) / 2.6, (l.y - hy) / 2.3, l.z / 4.6) < 1 + RR / 3) return true; return Math.hypot(l.x - hx, l.z) < 7 && Math.abs(l.y - (hy + 2.9)) < 0.7 + RR; }); });
    };
    const missile = (d) => {   // missiles qui traversent le pont : un voyant rouge clignote avant le tir
      [0, 1, 2].forEach((i) => { const g = mk(d + i * 34, 0), Wb = I.W(d) + 4, ms = new T3.Group(); g.add(ms); ms.userData.dyn = true; const bd = cy(1.1, 1.1, 8, '#c9ccd2', 12); bd.rotation.z = Math.PI / 2; ms.add(bd); const nose = new T3.Mesh(new T3.ConeGeometry(1.1, 2.4, 12), matS('#d33a2a')); nose.rotation.z = -Math.PI / 2; nose.position.x = 5.2; ms.add(nose); for (const a of [0, 1.57, 3.14, 4.71]) { const fn = bx(1.4, 2, 0.25, '#4a5160'); fn.position.set(-3.6, Math.cos(a) * 1.3, Math.sin(a) * 1.3); fn.rotation.x = a; ms.add(fn); } dynSh(g, bd);
        const lamp = new T3.Mesh(new T3.SphereGeometry(1, 10, 8), new T3.MeshBasicMaterial({ color: '#ff3b3b' })); lamp.position.set(-Wb + 2, 14, 0); g.add(lamp); const tube = cy(1.6, 1.6, 6, '#4a5160', 10); tube.rotation.z = Math.PI / 2; tube.position.set(-Wb - 1, 9, 0); g.add(tube); const P = 3.8, off = i * 1.1, hy = 5 + i * 3.4; let mx = -999; I.evD.push(d + i * 34);
        ups.push((t) => { const k = (t + off) % P; lamp.visible = k > 0.4 && k < 1.6 && ((t * 8) | 0) % 2 === 0; mx = k >= 1.6 && k < 2.6 ? -Wb + (k - 1.6) * (2 * Wb) : -999; ms.visible = mx > -900; ms.position.set(mx, hy, 0); g.updateMatrixWorld(true); });
        addHit(d + i * 34, (pos) => { if (mx < -900) return false; const l = loc(g, pos); return Math.abs(l.x - mx) < 5 + RR && Math.abs(l.y - hy) < 1.4 + RR && Math.abs(l.z) < 1.4 + RR; }); });
    };
    const crane = (d) => {   // grue : un conteneur qui balance au bout d'un cable
      const g = mk(d + 60, 0), Wb = I.W(d) - 2, top = 28, L = 19, A = 0.55; I.boxes.push([d + 56, d + 64, Wb - 4, Wb + 3, 0, 32]); I.evD.push(d + 60);
      { const gT = mk(d + 60, (Wb - 0.5) * sx), tw = bx(7, 34, 7, '#d9a21b'); tw.position.y = 17; gT.add(tw); for (let k = 0; k < 4; k++) { const st = bx(7.2, 1.2, 7.2, '#2a2d33'); st.position.y = 4 + k * 8; gT.add(st); } } const boom = bx(2 * Wb + 10, 2.4, 3, '#d9a21b'); boom.position.set(0, top + 3, 0); g.add(boom);
      const piv = new T3.Group(); piv.position.y = top + 1.6; g.add(piv); piv.userData.dyn = true; const cab = cy(0.3, 0.3, L - 3, '#2a2d33', 6); cab.position.y = -(L - 3) / 2; piv.add(cab); const head = new T3.Group(); head.position.y = -L; piv.add(head); const box = bx(9, 5.4, 5.4, '#c8742a'); head.add(box); for (let k = -3; k <= 3; k++) { const rb = bx(0.4, 5.2, 5.6, '#a85a1c'); rb.position.x = k * 1.2; head.add(rb); } dynSh(g, box);
      ups.push((t) => { piv.rotation.z = A * Math.sin(t * Math.PI * 2 / 3.6); g.updateMatrixWorld(true); });
      addHit(d + 60, (pos) => { const l = loc(g, pos), a = piv.rotation.z, hx = L * Math.sin(a), hy = top + 1.6 - L * Math.cos(a); if (Math.abs(l.z) > 3 + RR) return false; return Math.abs(l.x - hx) < 4.8 + RR && Math.abs(l.y - hy) < 3 + RR; });
    };
    const catapult = (d) => {   // catapulte : un anneau lance la fusee a grande vitesse au-dessus du vide
      I.evD.push(d); const g = mk(d, 0), ramp = bx(10, 1.6, 26, '#4a5160'); ramp.position.set(0, 1.6, 10); ramp.rotation.x = -0.12; g.add(ramp); for (const sg of [-1, 1]) { const rl = bx(0.8, 1.2, 26, '#f2c230'); rl.position.set(sg * 4.4, 2.6, 10); rl.rotation.x = -0.12; g.add(rl); }
      const rg = new T3.Mesh(new T3.TorusGeometry(8, 0.7, 10, 32), new T3.MeshBasicMaterial({ color: '#ffd23a', fog: false })); rg.position.set(0, 12, 6); g.add(rg); rg.userData.noShadow = true; const bm = new T3.Mesh(new T3.CylinderGeometry(0.6, 0.6, 12, 8), new T3.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.4, fog: false })); bm.position.set(0, 6, 6); bm.userData.noShadow = true; g.add(bm);
      guide([[d + 6, 0, 12], [d + 30, 0, 20], [d + 66, 0, 28], [d + 104, 0, 22], [d + 134, 0, 10], [d + 150, 0, 5]], { trig: [d + 6, 0, 12], r: 10, rh: 9, sp: 66, col: '#ffd23a', rad: 0.4, glow: true, label: "CATAPULTE : ENTRE DANS L'ANNEAU !" });
    };
    const silo = (d) => {   // silo : on entre dans le puits et on est propulse a la verticale
      I.evD.push(d); const g = mk(d, 0); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832, bk = bx(4.6, 8, 3, k % 2 ? '#f2c230' : '#4a5160'); bk.position.set(Math.cos(a) * 9, 4, Math.sin(a) * 9); bk.rotation.y = -a; g.add(bk); } const rg = new T3.Mesh(new T3.TorusGeometry(8, 0.6, 10, 32), new T3.MeshBasicMaterial({ color: '#7cff6a', fog: false })); rg.rotation.x = Math.PI / 2; rg.position.y = 12; g.add(rg); rg.userData.noShadow = true; const bm = new T3.Mesh(new T3.CylinderGeometry(7, 7, 14, 20, 1, true), new T3.MeshBasicMaterial({ color: '#7cff6a', transparent: true, opacity: 0.18, side: T3.DoubleSide, depthWrite: false, fog: false })); bm.position.y = 7; bm.userData.noShadow = true; g.add(bm);
      guide([[d, 0, 4], [d + 4, 0, 22], [d + 8, 0, 44], [d + 24, 0, 52], [d + 64, 0, 36], [d + 104, 0, 16], [d + 130, 0, 6]], { trig: [d, 0, 5], r: 9, rh: 8, sp: 62, col: '#7cff6a', rad: 0.4, glow: true, label: "SILO : ENTRE DANS LE PUITS !" });
    };
    // ================= GLACE =================
    const snowball = (d) => {   // une boule de neige geante qui roule vers toi
      const g = mk(d + 40, 0), ball = new T3.Mesh(new T3.IcosahedronGeometry(6, 2), matS('#f4fbff')); g.add(ball); ball.userData.dyn = true; for (let k = 0; k < 7; k++) { const p = new T3.Mesh(new T3.IcosahedronGeometry(1.4, 0), matS('#bfe3fb')); p.position.set(Math.cos(k * 2.4) * 5.2, Math.sin(k * 1.7) * 5.2, Math.sin(k * 2.4) * 5.2); ball.add(p); } dynSh(g, ball); let bx0 = 0, bz = 90; I.evD.push(d + 40);
      ups.push((t) => { const u = (t * 0.17) % 1; bz = 90 - 140 * u; bx0 = 9 * Math.sin(t * 0.5); ball.position.set(bx0, 6, bz); ball.rotation.x = -bz / 6; g.updateMatrixWorld(true); });
      addHit(d + 40, (pos) => { const l = loc(g, pos); return Math.hypot(l.x - bx0, l.y - 6, l.z - bz) < 6 + RR; });
    };
    const pics = (d, lx0) => {   // pics de glace qui poussent du sol : une fissure bleue previent
      for (let i = 0; i < 4; i++) { const dd = d + i * 16, x = -15 + i * 10, g = mk(dd, lx0 + (i % 2 ? 5 : -5) + x * 0.3), cone = new T3.Mesh(new T3.ConeGeometry(2.6, 15, 7), matS('#bfe8ff')); cone.userData.dyn = true; g.add(cone); const crack = new T3.Mesh(new T3.RingGeometry(2.4, 3.6, 16), new T3.MeshBasicMaterial({ color: '#2f8cff', transparent: true, opacity: 0.8, side: T3.DoubleSide, depthWrite: false })); crack.rotation.x = -Math.PI / 2; crack.position.y = 0.25; crack.visible = false; crack.userData.noShadow = true; g.add(crack); dynSh(g, cone); let hh = 0; I.evD.push(dd);
        ups.push((t) => { const k = (t + i * 1.1) % 4; hh = k < 1.8 ? 0 : k < 2.4 ? 0 : k < 2.6 ? 15 * ((k - 2.4) / 0.2) : k < 3.4 ? 15 : 15 * (1 - (k - 3.4) / 0.6); crack.visible = k >= 1.8 && k < 3.4 && (k < 2.4 ? ((t * 8) | 0) % 2 === 0 : true); cone.visible = hh > 0.3; cone.position.y = hh / 2 - 7.5 + 7.5 * 0 + (hh - 15) / 2 + 7.5; cone.position.y = hh - 7.5; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); return hh > 1 && Math.hypot(l.x, l.z) < 2.8 + RR && l.y < hh + RR; }); }
    };
    const jaws = (d, lx0) => {   // machoires de banquise : deux dents qui se referment par le haut et par le bas
      const g = mk(d, lx0), hw = 20, bot = bx(2 * hw, 14, 7, '#cdeeff'), top = bx(2 * hw, 14, 7, '#cdeeff'); bot.userData.dyn = top.userData.dyn = true; g.add(bot); g.add(top); for (let k = 0; k < 6; k++) { const t1 = new T3.Mesh(new T3.ConeGeometry(1.8, 5, 6), matS('#ffffff')); t1.position.set(-hw + 4 + k * 6.4, 0, 0); bot.add(t1); t1.position.y = 9.5; const t2 = new T3.Mesh(new T3.ConeGeometry(1.8, 5, 6), matS('#ffffff')); t2.rotation.x = Math.PI; t2.position.set(-hw + 4 + k * 6.4, -9.5, 0); top.add(t2); } dynSh(g, bot); dynSh(g, top); let yB = 4, yT = 14; I.evD.push(d);
      ups.push((t) => { yB = 2 + 11 * (0.5 + 0.5 * Math.sin(t * 1.0)); yT = yB + 8.5; bot.position.y = yB - 7; top.position.y = yT + 7; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 3.5 + RR || Math.abs(l.x) > hw + 1) return false; return l.y < yB + RR || l.y > yT - RR; });
    };
    const drill = (d, lx0) => {   // foret a pointes de glace : une vis de cones qui tourne autour d'un mat
      const g = mk(d, lx0), rot = new T3.Group(); g.add(rot); rot.userData.dyn = true; const mast = cy(2.2, 2.6, 24, '#9fdcff', 12); mast.position.y = 12; g.add(mast); const cones = []; I.boxes.push([d - 2.7, d + 2.7, lx0 * sx - 2.7, lx0 * sx + 2.7, 0, 24]); I.evD.push(d);
      for (let k = 0; k < 14; k++) { const a = k * 1.1, y = 3 + k * 1.6, c = new T3.Mesh(new T3.ConeGeometry(1.4, 9, 6), matS(k % 2 ? '#ffffff' : '#ff9bea')); c.rotation.z = -Math.PI / 2; c.position.set(Math.cos(a) * 5.5, y, Math.sin(a) * 5.5); c.rotation.y = -a; rot.add(c); cones.push({ a, y }); }
      ups.push((t) => { rot.rotation.y = t * 1.2; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); for (const c of cones) { const a = c.a + rot.rotation.y, cx = Math.cos(a) * 5.5, cz = -Math.sin(a) * 5.5; if (Math.hypot(l.x - cx * 1, l.z - cz) < 3.2 + RR && Math.abs(l.y - c.y) < 1.6 + RR) return true; } return false; });
    };
    const igloo = (d, lx0) => {   // igloo-tunnel : une porte etroite, un toit bas
      const hw = 20, len = 44, H = 15; I.evD.push(d); I.boxes.push([d, d + 3, lx0 * sx - hw, lx0 * sx - 5, 0, H + 2], [d, d + 3, lx0 * sx + 5, lx0 * sx + hw, 0, H + 2], [d, d + len, lx0 * sx - hw - 3, lx0 * sx - hw, 0, H + 2], [d, d + len, lx0 * sx + hw, lx0 * sx + hw + 3, 0, H + 2], [d, d + len, lx0 * sx - hw - 3, lx0 * sx + hw + 3, H, H + 3]);
      const g = mk(d + len / 2, lx0), roof = bx(2 * hw + 6, 4, len, '#f4fbff'); roof.position.y = H + 1; g.add(roof); for (const sg of [-1, 1]) { const w = bx(3, H + 2, len, '#e8f6ff'); w.position.set(sg * (hw + 1.5), (H + 2) / 2, 0); g.add(w); const fr = bx((hw - 5), H + 2, 3, '#cdeeff'); fr.position.set(sg * ((hw + 5) / 2), (H + 2) / 2, -len / 2 + 1.5); g.add(fr); } for (let k = 0; k < 8; k++) { const bl = bx(4.4, 0.7, len - 2, '#bfe3fb'); bl.position.set(-hw + 3 + k * 5.6, H + 3.2, 0); g.add(bl); }
    };
    const skijump = (d) => {   // tremplin de ski : un anneau lance la fusee au-dessus de la crevasse
      I.evD.push(d); const g = mk(d, 0), ramp = bx(12, 1.8, 28, '#e8f6ff'); ramp.position.set(0, 2.4, 11); ramp.rotation.x = -0.16; g.add(ramp); const rg = new T3.Mesh(new T3.TorusGeometry(8, 0.7, 10, 32), new T3.MeshBasicMaterial({ color: '#ff4fd8', fog: false })); rg.position.set(0, 13, 8); g.add(rg); rg.userData.noShadow = true; const bm = new T3.Mesh(new T3.CylinderGeometry(0.6, 0.6, 13, 8), new T3.MeshBasicMaterial({ color: '#ff4fd8', transparent: true, opacity: 0.4, fog: false })); bm.position.set(0, 6.5, 8); bm.userData.noShadow = true; g.add(bm);
      guide([[d + 8, 0, 13], [d + 30, 0, 22], [d + 62, 0, 26], [d + 98, 0, 18], [d + 126, 0, 8], [d + 142, 0, 4]], { trig: [d + 8, 0, 13], r: 10, rh: 9, sp: 62, col: '#ff4fd8', rad: 0.4, glow: true, label: "TREMPLIN : ENTRE DANS L'ANNEAU !" });
    };
    const floes = (d) => {   // banquise : des icebergs solides en slalom
      for (let k = 0; k < 9; k++) { const dd = d + k * 18, x = (((k * 29) % 70) - 35), w = 9 + (k * 7) % 6, h = 13 + (k * 3) % 5, g = mk(dd, x); I.evD.push(dd); const b = new T3.Mesh(new T3.IcosahedronGeometry(w * 0.55, 1), matS(k % 2 ? '#bfe3fb' : '#e8f6ff')); b.position.y = h * 0.45; b.scale.set(1, h / (w * 0.55) * 0.5, 1); g.add(b); const cp = new T3.Mesh(new T3.ConeGeometry(w * 0.28, h * 0.45, 6), matS('#ffffff')); cp.position.y = h * 0.8; g.add(cp); I.boxes.push([dd - w / 2, dd + w / 2, x * sx - w / 2, x * sx + w / 2, 0, h]); }
    };

    // ================= DESERT =================
    const dustDevils = (d, lx0) => {   // tourbillons de sable : des cones de poussiere qui balaient la voie
      [0, 1, 2].forEach((i) => { const g = mk(d + 20 + i * 24, lx0), cone = new T3.Mesh(new T3.CylinderGeometry(5.5, 1.3, 22, 14, 1, true), new T3.MeshBasicMaterial({ color: '#e8c27a', transparent: true, opacity: 0.55, side: T3.DoubleSide, depthWrite: false })); cone.position.y = 11; cone.userData.noShadow = true; g.add(cone); const inner = new T3.Mesh(new T3.CylinderGeometry(3.4, 0.8, 22, 10, 1, true), new T3.MeshBasicMaterial({ color: '#b9793a', transparent: true, opacity: 0.45, side: T3.DoubleSide, depthWrite: false })); inner.position.y = 11; inner.userData.noShadow = true; g.add(inner); let cx = 0; I.evD.push(d + 20 + i * 24);
        ups.push((t) => { cx = 12 * Math.sin(t * 0.7 + i * 2.1); cone.position.x = inner.position.x = cx; cone.rotation.y = t * 3; inner.rotation.y = -t * 4; g.updateMatrixWorld(true); });
        addHit(d + 20 + i * 24, (pos) => { const l = loc(g, pos); if (l.y < 0 || l.y > 22) return false; return Math.hypot(l.x - cx, l.z) < 1.3 + 4.2 * (l.y / 22) + RR; }); });
    };
    const sandDoors = (d, lx0, hw) => {   // portes de pierre coulissantes : elles se ferment au milieu puis s'ecartent
      const g = mk(d, lx0), H = 18, doors = []; I.evD.push(d); const lc = lx0 * sx;
      for (const sg of [-1, 1]) { const pl = bx(3.4, H + 5, 4.4, '#c99a5c'); pl.position.set(sg * (hw + 1.7), (H + 5) / 2, 0); g.add(pl); I.boxes.push([d - 2.2, d + 2.2, lc + sg * (hw + 1.7) - 1.7, lc + sg * (hw + 1.7) + 1.7, 0, H + 5]); const dr = bx(hw, H, 2.4, sg > 0 ? '#e0b878' : '#d9a55b'); dr.position.set(sg * hw / 2, H / 2, 0); dr.userData.dyn = true; g.add(dr); for (let k = 0; k < 3; k++) { const gl = bx(hw - 2, 0.9, 2.6, '#2fb8b0'); gl.position.set(0, -H / 2 + 3 + k * 5.5, 0); dr.add(gl); } dynSh(g, dr); doors.push({ dr, sg }); }
      const lt = bx(2 * hw + 7, 3.4, 4.4, '#c99a5c'); lt.position.y = H + 3.7; g.add(lt); I.boxes.push([d - 2.2, d + 2.2, lc - hw - 3.5, lc + hw + 3.5, H + 2, H + 5.4]);
      let op = 0; ups.push((t) => { op = 0.5 + 0.5 * Math.sin(t * 0.9 + d); for (const o of doors) o.dr.position.x = o.sg * (hw / 2 + op * hw * 0.92); g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 1.5 + RR || l.y > H + RR) return false; for (const o of doors) if (Math.abs(l.x - o.sg * (hw / 2 + op * hw * 0.92)) < hw / 2 + RR) return true; return false; });
    };
    const beetles = (d, lx0) => {   // amphores geantes qui roulent en travers de la voie
      [0, 1, 2, 3].forEach((i) => { const g = mk(d + 25 + i * 22, lx0), b = new T3.Group(); g.add(b); b.userData.dyn = true; const body = new T3.Mesh(new T3.SphereGeometry(1, 16, 12), matS('#d98a4a')); body.scale.set(5, 4, 6.4); body.position.y = 0.4; b.add(body); for (const zz of [-2.4, 0, 2.4]) { const stripe = new T3.Mesh(new T3.TorusGeometry(zz ? 3.5 : 4.1, 0.32, 6, 24), matS(zz ? '#2fb8b0' : '#ffffff')); stripe.scale.set(1.22, 1, 1); stripe.position.set(0, 0.4, zz); b.add(stripe); } for (const zz of [-6.6, 6.6]) { const neck = cy(1.5, 2.2, 1.6, '#b86e36', 12); neck.rotation.x = Math.PI / 2; neck.position.set(0, 0.4, zz); b.add(neck); } dynSh(g, body); let bxp = 0; I.evD.push(d + 25 + i * 22);
        ups.push((t) => { bxp = 13 * Math.sin(t * 0.8 + i * 1.9); b.position.set(bxp, 4.4, 0); b.rotation.y = Math.cos(t * 0.8 + i * 1.9) > 0 ? 1.57 : -1.57; g.updateMatrixWorld(true); });
        addHit(d + 25 + i * 22, (pos) => { const l = loc(g, pos); return Math.hypot((l.x - bxp) / 6.4, (l.y - 4.8) / 4.4, l.z / 5) < 1 + RR / 4; }); });
    };
    const vultures = (d) => {   // disques solaires qui plongent et remontent : l'anneau rouge au sol previent
      const g = mk(d + 60, 0), vs = []; I.evD.push(d + 60);
      for (let i = 0; i < 3; i++) { const v = new T3.Group(); g.add(v); v.userData.dyn = true; const body = cy(5.2, 5.2, 0.7, '#ffd23a', 20); v.add(body); const hub = cy(2.4, 2.4, 1.1, '#2fb8b0', 16); v.add(hub); const rim = new T3.Mesh(new T3.TorusGeometry(5.2, 0.45, 6, 24), matS('#e08a2a')); rim.rotation.x = Math.PI / 2; v.add(rim); const wl = new T3.Object3D(), wr = new T3.Object3D(); dynSh(g, body);
        const ring = new T3.Mesh(new T3.RingGeometry(2.2, 3.2, 20), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.6, side: T3.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.userData.noShadow = true; g.add(ring); vs.push({ v, wl, wr, ring, x: 0, y: 12, z: 0, i }); }
      ups.push((t) => { for (const o of vs) { o.x = 18 * Math.sin(t * 0.55 + o.i * 2.1); o.z = 24 * Math.sin(t * 0.4 + o.i * 1.3); o.y = 12 + 9 * Math.cos(t * 0.8 + o.i * 1.7); o.v.position.set(o.x, o.y, o.z); o.v.rotation.y = t * 2.2 + o.i; o.wl.rotation.z = Math.sin(t * 9 + o.i) * 0.5; o.wr.rotation.z = -Math.sin(t * 9 + o.i) * 0.5; o.ring.position.set(o.x, 0.25, o.z); o.ring.scale.setScalar(1 + o.y / 22); } g.updateMatrixWorld(true); });
      addHit(d + 60, (pos) => { const l = loc(g, pos); for (const o of vs) if (Math.hypot((l.x - o.x) / 6.5, (l.y - o.y) / 1.6, (l.z - o.z) / 2.8) < 1 + RR / 4) return true; return false; });
    };
    const obelisks = (d, lx0) => {   // obelisques lasers : un rideau de lumiere rouge qui tourne autour de l'obelisque
      [0, 1].forEach((i) => { const dd = d + 30 + i * 70, g = mk(dd, lx0), R0 = 18, base = new T3.Mesh(new T3.CylinderGeometry(1.2, 2.8, 22, 4), matS('#e0b878')); base.rotation.y = 0.785; base.position.y = 11; g.add(base); const cap = new T3.Mesh(new T3.ConeGeometry(1.5, 3.4, 4), matS('#ffd23a')); cap.rotation.y = 0.785; cap.position.y = 23.7; g.add(cap); I.boxes.push([dd - 2.6, dd + 2.6, lx0 * sx - 2.6, lx0 * sx + 2.6, 0, 25]); I.evD.push(dd);
        const rot = new T3.Group(); rot.position.y = 0; g.add(rot); rot.userData.dyn = true; const beam = new T3.Mesh(new T3.BoxGeometry(2 * R0, 26, 0.5), new T3.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.55, depthWrite: false })); beam.position.y = 13; beam.userData.noShadow = true; rot.add(beam);
        ups.push((t) => { rot.rotation.y = (i ? -1 : 1) * t * 0.7 + i; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); if (l.y > 27) return false; const th = rot.rotation.y, tt = l.x * Math.cos(th) - l.z * Math.sin(th), pr = Math.abs(l.x * Math.sin(th) + l.z * Math.cos(th)); return Math.abs(tt) < R0 + RR && pr < 0.6 + RR; }); });
    };
    const axes = (d, lx0) => {   // haches pendulaires de temple : elles balancent d'avant en arriere
      [0, 1].forEach((i) => { const dd = d + 40 + i * 60, g = mk(dd, lx0), top = 25, L = 18, A = 0.8; gantry(g, 12, top, false, dd, lx0); const piv = new T3.Group(); piv.position.y = top - 0.6; g.add(piv); piv.userData.dyn = true; const rod = cy(0.35, 0.35, L - 3, '#5a4a2a', 6); rod.position.y = -(L - 3) / 2; piv.add(rod); const hd = bx(10, 6, 1.4, '#9aa0aa'); hd.position.y = -L; piv.add(hd); const edge = bx(10.2, 0.8, 1.6, '#ffd23a'); edge.position.y = -L - 3; piv.add(edge); dynSh(g, hd); I.evD.push(dd);
        ups.push((t) => { piv.rotation.x = A * Math.sin(t * Math.PI * 2 / 3.2 + i * 1.6); g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos), a = piv.rotation.x, hy = top - 0.6 - L * Math.cos(a), hz = -L * Math.sin(a); if (Math.abs(l.x) < 6 + RR && Math.hypot(l.y - hy, l.z - hz) < 3.6 + RR) return true; return Math.abs(l.x) < 0.5 + RR && segDist(l.z, l.y, 0, top - 0.6, hz, hy) < 0.5 + RR; }); });
    };
    const hypostyle = (d) => {   // salle des piliers : un toit bas et une foret de colonnes
      const a = d + 15, b = d + 205, g = mk((a + b) / 2, 0), Wb = I.W(d) + 3; I.boxes.push([a, b, -Wb, Wb, 15.2, 23]); I.evD.push(d + 100);
      const roof = bx(2 * Wb, 6, b - a, '#e0b878'); roof.position.y = 18.5; g.add(roof); for (let k = 0; k < 7; k++) { const st = bx(2 * Wb + 0.4, 0.9, 3, k % 2 ? '#2fb8b0' : '#c98b4a'); st.position.set(0, 15.2, -(b - a) / 2 + 12 + k * 28); g.add(st); }
      for (let k = 0; k < 8; k++) { const dd = a + 14 + k * 22, xs = k % 2 ? [-Wb * 0.55, 0, Wb * 0.55] : [-Wb * 0.3, Wb * 0.3]; for (const x of xs) { const gc = mk(dd, x), col = cy(2.4, 2.6, 15, '#e8c996', 14); col.position.y = 7.5; gc.add(col); const cp = bx(6.4, 1.4, 6.4, '#c98b4a'); cp.position.y = 15.4; gc.add(cp); const bs = bx(6, 1, 6, '#c98b4a'); bs.position.y = 0.5; gc.add(bs); for (let q = 0; q < 3; q++) { const gl = bx(5.2, 0.5, 5.2, '#2fb8b0'); gl.position.y = 4 + q * 4; gc.add(gl); } I.boxes.push([dd - 2.8, dd + 2.8, x * sx - 2.8, x * sx + 2.8, 0, 16]); } }
    };
    const surf = (d) => {   // surf de dune : l'anneau t'emporte en rasant les dunes
      I.evD.push(d); const g = mk(d, 0), rg = new T3.Mesh(new T3.TorusGeometry(9, 0.7, 10, 32), new T3.MeshBasicMaterial({ color: '#fff2c4', fog: false })); rg.position.set(0, 6, 5); g.add(rg); rg.userData.noShadow = true; const bm = new T3.Mesh(new T3.CylinderGeometry(0.7, 0.7, 12, 8), new T3.MeshBasicMaterial({ color: '#fff2c4', transparent: true, opacity: 0.4, fog: false })); bm.position.set(0, 6, 5); bm.userData.noShadow = true; g.add(bm);
      guide([[d + 5, 0, 6], [d + 30, 0, 12], [d + 60, -8, 6], [d + 95, 8, 13], [d + 130, 0, 6], [d + 160, 0, 4]], { trig: [d + 5, 0, 6], r: 11, rh: 8, sp: 58, col: '#f3d9a0', rad: 0.6, glow: true, label: "DUNE : ENTRE DANS L'ANNEAU !" });
    };
    // ================= USINE =================
    const presses = (d, lx0) => {   // presses hydrauliques : la plaque s'abat (bandes rouges avant)
      [-8, 8, 0].forEach((o, i) => { const dd = d + i * 28, g = mk(dd, lx0 + o), plate = new T3.Group(); g.add(plate); plate.userData.dyn = true; const pl = bx(12, 3, 12, '#8b95a3'); plate.add(pl); const hz = bx(12.2, 0.7, 12.2, '#f0b429'); hz.position.y = -1.1; plate.add(hz); const rod = cy(1.6, 1.6, 40, '#6f7a88', 10); rod.position.y = 21; plate.add(rod); const an = bx(13, 1, 13, '#2a2d33'); an.position.y = 0.5; g.add(an); dynSh(g, pl); let py = 24; I.evD.push(dd);
        ups.push((t) => { const k = (t + i * 1.2) % 3.6; py = k < 1.7 ? 24 : k < 2.4 ? 24 - 2 * ((k - 1.7) / 0.7) : k < 2.55 ? 22 - 20.4 * ((k - 2.4) / 0.15) : k < 3.0 ? 1.6 : 1.6 + 22.4 * ((k - 3.0) / 0.6); plate.position.y = py; hz.visible = k < 1.7 || ((t * 8) | 0) % 2 === 0; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); return Math.abs(l.x) < 6.4 + RR && Math.abs(l.z) < 6.4 + RR && l.y + RR > py - 1.5 && l.y < 60; }); });
    };
    const flames = (d, lx0, hw) => {   // lance-flammes muraux : une veilleuse bleue, un rougeoiement, puis la gerbe
      [0, 1, 2].forEach((i) => { const dd = d + 20 + i * 32, sg = i % 2 ? 1 : -1, hy = [5, 11, 16][i], g = mk(dd, lx0), nz = cy(1.6, 2.4, 3.4, '#4a5160', 10); nz.rotation.z = Math.PI / 2; nz.position.set(sg * hw, hy, 0); g.add(nz); const lc = lx0 * sx + latSign(g, dd) * sg * hw; I.boxes.push([dd - 2, dd + 2, lc - 2.2, lc + 2.2, 0, hy + 3]); const pil = bx(4.4, hy + 3, 4.4, '#6f7a88'); pil.position.set(sg * (hw + 1.5), (hy + 3) / 2, 0); g.add(pil);
        const len = hw * 1.4, fl = new T3.Mesh(new T3.ConeGeometry(3.6, len, 12, 1, true), new T3.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.75, side: T3.DoubleSide, depthWrite: false })); fl.rotation.z = sg * Math.PI / 2; fl.position.set(sg * (hw - len / 2), hy, 0); fl.visible = false; fl.userData.noShadow = true; g.add(fl); const pilot = new T3.Mesh(new T3.SphereGeometry(0.7, 8, 6), new T3.MeshBasicMaterial({ color: '#5fb8ff' })); pilot.position.set(sg * (hw - 2.2), hy, 0); g.add(pilot); pilot.userData.noShadow = true; let on = false; I.evD.push(dd);
        ups.push((t) => { const k = (t + i * 1.3) % 4.2; on = k >= 2.4 && k < 3.4; fl.visible = on; pilot.material.color.set(k >= 1.6 && k < 2.4 ? '#ff6a1a' : '#5fb8ff'); pilot.scale.setScalar(k >= 1.6 && k < 2.4 ? 1.6 : 1); g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { if (!on) return false; const l = loc(g, pos), u = (sg * hw - l.x) * sg; if (u < 0 || u > len) return false; return Math.hypot(l.y - hy, l.z) < 1.2 + 2.6 * (u / len) + RR; }); });
    };
    const belts = (d0, len, dv) => {   // convoyeur : des tapis qui poussent la fusee de cote (chevrons jaunes animes)
      const g = mk(d0 + len / 2, 0), Wb = I.W(d0) - 2, cv = document.createElement('canvas'); cv.width = cv.height = 64; const c2 = cv.getContext('2d'); c2.fillStyle = '#2a2d33'; c2.fillRect(0, 0, 64, 64); c2.strokeStyle = '#f0b429'; c2.lineWidth = 9; c2.lineJoin = 'miter'; c2.beginPath(); c2.moveTo(8, 44); c2.lineTo(32, 18); c2.lineTo(56, 44); c2.stroke();
      const tx = new T3.CanvasTexture(cv); tx.wrapS = tx.wrapT = T3.RepeatWrapping; tx.repeat.set(Wb / 5, len / 12); const pl = new T3.Mesh(new T3.PlaneGeometry(2 * Wb, len), new T3.MeshBasicMaterial({ map: tx, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); pl.rotation.x = -Math.PI / 2; pl.position.y = 0.24; pl.userData.noShadow = true; g.add(pl); I.winds.push({ d0, d1: d0 + len, lat: dv * 14, head: 0, up: 0 }); I.evD.push(d0 + len / 2);
      const xw = new T3.Vector3(1, 0, 0).applyQuaternion(g.quaternion), a0 = T.at(d0, 0, 0), a1 = T.at(d0, 1, 0), sgL = ((a1[0] - a0[0]) * xw.x + (a1[2] - a0[2]) * xw.z) >= 0 ? 1 : -1; pl.rotation.z = dv * sgL > 0 ? 0 : Math.PI;
      ups.push((t) => { tx.offset.y = (t * 0.9) % 1; });
    };
    const carts = (d, lx0, hw) => {   // wagonnets de minerai sur rails : ils traversent la voie
      [0, 1, 2].forEach((i) => { const dd = d + 20 + i * 30, g = mk(dd, lx0), cart = new T3.Group(); for (const dz of [-2.4, 2.4]) { const rl = bx(2 * hw + 6, 0.5, 0.7, '#6f7a88'); rl.position.set(0, 0.3, dz); g.add(rl); } g.add(cart); cart.userData.dyn = true; const bd = bx(9, 5, 6, '#c8742a'); bd.position.y = 3.6; cart.add(bd); const pile = bx(7, 5, 5, '#8a5a2c'); pile.position.y = 8; cart.add(pile); for (const [wx, wz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { const wh = cy(1.2, 1.2, 0.8, '#2a2d33', 10); wh.rotation.x = Math.PI / 2; wh.position.set(wx, 1.2, wz); cart.add(wh); } dynSh(g, bd); let cx = 0; I.evD.push(dd);
        ups.push((t) => { cx = (hw - 6) * Math.sin(t * 0.75 + i * 2.0); cart.position.x = cx; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); return Math.abs(l.x - cx) < 4.8 + RR && Math.abs(l.z) < 3.2 + RR && l.y < 10.6 + RR; }); });
    };
    const roboArms = (d, lx0, hw) => {   // bras robotises a pince : ils balaient l'espace au-dessus de la voie
      [0, 1].forEach((i) => { const sg = i ? 1 : -1, dd = d + 30 + i * 55, g = mk(dd, lx0), base = cy(2.6, 3.2, 6, '#f0b429', 12); base.position.set(sg * hw, 3, 0); g.add(base); const lc = lx0 * sx + latSign(g, dd) * sg * hw; I.boxes.push([dd - 3, dd + 3, lc - 3, lc + 3, 0, 6.5]); I.evD.push(dd);
        const sh = new T3.Group(); sh.position.set(sg * hw, 6, 0); g.add(sh); sh.userData.dyn = true; const ua = bx(2.4, 14, 2.4, '#8b95a3'); ua.position.y = 7; sh.add(ua); const el = new T3.Group(); el.position.y = 14; sh.add(el); const fa = bx(2, 12, 2, '#6f7a88'); fa.position.y = 6; el.add(fa); const claw = new T3.Mesh(new T3.SphereGeometry(2.2, 10, 8), matS('#f0b429')); claw.position.y = 12.5; el.add(claw); for (const s2 of [-1, 1]) { const fg = bx(0.8, 3.2, 0.8, '#2a2d33'); fg.position.set(s2 * 1.6, 13.8, 0); el.add(fg); } dynSh(g, claw);
        let tip = [0, 0], elb = [0, 0]; ups.push((t) => { const th1 = 0.5 + 0.9 * Math.sin(t * 0.8 + i * 1.7), th2 = th1 + 0.9 + 0.7 * Math.sin(t * 1.1 + i); sh.rotation.z = sg * th1; el.rotation.z = sg * (th2 - th1); const e = [sg * hw - sg * 14 * Math.sin(th1), 6 + 14 * Math.cos(th1)]; elb = e; tip = [e[0] - sg * 12.5 * Math.sin(th2), e[1] + 12.5 * Math.cos(th2)]; g.updateMatrixWorld(true); });
        addHit(dd, (pos) => { const l = loc(g, pos); if (Math.abs(l.z) > 2.6 + RR) return false; if (segDist(l.x, l.y, sg * hw, 6, elb[0], elb[1]) < 1.6 + RR) return true; return segDist(l.x, l.y, elb[0], elb[1], tip[0], tip[1]) < 1.5 + RR || Math.hypot(l.x - tip[0], l.y - tip[1]) < 2.6 + RR; }); });
    };
    const rollers = (d, lx0, hw) => {   // rouleaux broyeurs : il faut passer entre les deux rouleaux
      const g = mk(d, lx0), rs = []; I.evD.push(d);
      for (const yc of [2.5, 19.5]) { const r = new T3.Group(); r.position.y = yc; g.add(r); r.userData.dyn = true; const cyl = cy(5.2, 5.2, 2 * hw, '#8b95a3', 18); cyl.rotation.z = Math.PI / 2; r.add(cyl); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832, tt = bx(2 * hw - 1, 1.2, 1.6, k % 2 ? '#f0b429' : '#2a2d33'); tt.position.set(0, Math.sin(a) * 5.6, Math.cos(a) * 5.6); tt.rotation.x = -a; r.add(tt); } dynSh(g, cyl); rs.push({ r, yc }); }
      for (const sg of [-1, 1]) { const fr = bx(3, 28, 5, '#6f7a88'); fr.position.set(sg * (hw + 1.5), 14, 0); g.add(fr); }
      ups.push((t) => { rs[0].r.rotation.x = t * 2.2; rs[1].r.rotation.x = -t * 2.2; g.updateMatrixWorld(true); });
      addHit(d, (pos) => { const l = loc(g, pos); if (Math.abs(l.x) > hw + 1) return false; for (const o of rs) if (Math.hypot(l.y - o.yc, l.z) < 5.8 + RR) return true; return false; });
    };
    const arcs = (d) => {   // portiques a arcs electriques : l'arc traverse toute la voie par intermittence
      for (let i = 0; i < 4; i++) { const dd = d + 20 + i * 38, g = mk(dd, 0), Wb = I.W(dd) - 2; for (const sg of [-1, 1]) { const py = cy(1.6, 2.2, 24, '#6f7a88', 10); py.position.set(sg * Wb, 12, 0); g.add(py); const tip = new T3.Mesh(new T3.SphereGeometry(2, 10, 8), matS('#f0b429')); tip.position.set(sg * Wb, 25, 0); g.add(tip); } const lc = Wb; I.boxes.push([dd - 2, dd + 2, -Wb - 2, -Wb + 2, 0, 26], [dd - 2, dd + 2, Wb - 2, Wb + 2, 0, 26]);
        const n = 14, geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(n * 6), 3)); const ln = new T3.LineSegments(geo, new T3.LineBasicMaterial({ color: '#9fe8ff', transparent: true, opacity: 0.95, fog: false })); ln.frustumCulled = false; ln.userData.noShadow = true; g.add(ln); let on = false, warm = false; I.evD.push(dd);
        ups.push((t) => { const k = (t + i * 0.9) % 3.4; warm = k >= 1.4 && k < 2.0; on = k >= 2.0 && k < 3.0; ln.visible = on || warm; const pa = geo.attributes.position.array; for (let q = 0; q < n; q++) { const x0 = -Wb + (2 * Wb) * q / n, x1 = -Wb + (2 * Wb) * (q + 1) / n, h = 12 + (on ? 9 : 2) * Math.sin(t * 40 + q * 2.3) * (q % 2 ? 1 : -1); pa[q * 6] = x0; pa[q * 6 + 1] = (q ? 12 + (on ? 9 : 2) * Math.sin(t * 40 + (q - 1) * 2.3) * ((q - 1) % 2 ? 1 : -1) : 12); pa[q * 6 + 2] = 0; pa[q * 6 + 3] = x1; pa[q * 6 + 4] = h; pa[q * 6 + 5] = 0; } geo.attributes.position.needsUpdate = true; });
        addHit(dd, (pos) => { if (!on) return false; const l = loc(g, pos); return Math.abs(l.z) < 1.8 + RR && l.y < 26; }); }
    };
    const loopPipe = (d) => {   // TUYAU-LOOPING : la fusee entre, fait un looping a grande vitesse et ressort tout en haut
      I.evD.push(d); const R0 = 14, hc = 24, dc = d + 70, pts = [[d + 8, 0, 10], [d + 40, 0, 10]]; for (let k = 0; k <= 12; k++) { const th = k / 12 * 6.2832; pts.push([dc + R0 * Math.sin(th), -4 + 8 * (k / 12), hc - R0 * Math.cos(th)]); } pts.push([dc + 32, 0, 22], [dc + 62, 0, 32]);
      const g = mk(d, 0), mouth = new T3.Mesh(new T3.TorusGeometry(7, 1.1, 12, 32), matS('#f0b429')); mouth.position.set(0, 10, 6); g.add(mouth); const mb = bx(18, 3, 6, '#6f7a88'); mb.position.set(0, 1.5, 6); g.add(mb); const bm = new T3.Mesh(new T3.CylinderGeometry(0.6, 0.6, 12, 8), new T3.MeshBasicMaterial({ color: '#f0b429', transparent: true, opacity: 0.45, fog: false })); bm.position.set(0, 6, 4); bm.userData.noShadow = true; g.add(bm);
      guide(pts, { trig: [d + 8, 0, 10], r: 10, rh: 9, sp: 64, col: '#9aa4b2', rad: 3.6, big: true, label: 'TUYAU : ENTRE, LOOPING, PUIS EN HAUT !' });
    };
    const windSlot = [];
    const wind = (d0, len, o) => {   // rafale VISIBLE : des filets d'air filent dans le sens du vent (lateral, de face ou ascendant) et poussent vraiment la fusee
      const lat = o.lat || 0, head = o.head || 0, up = o.up || 0, dm = d0 + len / 2, g = mk(dm, 0), n = 80; I.winds.push({ d0, d1: d0 + len, lat, head, up });
      const xw = new T3.Vector3(1, 0, 0).applyQuaternion(g.getWorldQuaternion(new T3.Quaternion())), a0 = T.at(dm, 0, 0), a1 = T.at(dm, 1, 0), sgL = ((a1[0] - a0[0]) * xw.x + (a1[2] - a0[2]) * xw.z) >= 0 ? 1 : -1;
      const dir = new T3.Vector3(Math.sign(lat) * sgL, Math.sign(up), -Math.sign(head)).normalize(), hwid = Math.max(14, I.W(dm) - 3), st = [];
      for (let i = 0; i < n; i++) st.push({ x: (Math.random() * 2 - 1) * hwid, y: 2 + Math.random() * 20, z: (Math.random() - 0.5) * len, sp: 24 + Math.random() * 16, L: 5 + Math.random() * 7 });
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(new Float32Array(n * 6), 3)); const ln = new T3.LineSegments(geo, new T3.LineBasicMaterial({ color: o.col || '#ffffff', transparent: true, opacity: 0.75, fog: false })); ln.frustumCulled = false; ln.userData.noShadow = true; g.add(ln);
      const wr = (v, a, b) => a + (((v - a) % (b - a)) + (b - a)) % (b - a);
      ups.push((t, rp) => { if (rp && g.position.distanceToSquared(rp) > (len / 2 + 240) * (len / 2 + 240)) { ln.visible = false; return; } ln.visible = true; const pa = geo.attributes.position.array;
        for (let i = 0; i < n; i++) { const q = st[i], tr = t * q.sp, x = wr(q.x + dir.x * tr, -hwid, hwid), y = wr(q.y + dir.y * tr, 2, 22), z = wr(q.z + dir.z * tr, -len / 2, len / 2); pa[i * 6] = x; pa[i * 6 + 1] = y; pa[i * 6 + 2] = z; pa[i * 6 + 3] = x - dir.x * q.L; pa[i * 6 + 4] = y - dir.y * q.L; pa[i * 6 + 5] = z - dir.z * q.L; } geo.attributes.position.needsUpdate = true; });
    };
    const S = (name) => STARTS[SEC.findIndex((s) => s.n === name)];
    const LEN = (n) => SEC[SEC.findIndex((q) => q.n === n)].len, rowsAt = (n, a, b, step, fn) => { const s0 = S(n), L = LEN(n); let k = 0; for (let d = s0 + a; d <= s0 + L - b; d += step, k++) fn(d, k); }, HINT = { TRAMPOLINES: 'FONCE SUR UN TRAMPOLINE', LIANE: "ENTRE DANS L'ANNEAU VERT", CASCADE: 'MONTE POUR RESISTER', TOURNIQUET: 'ENTRE DEUX PALES', HUBLOT: 'VISE LE TROU', BEIGNETS: 'PASSE DANS LE TROU', FLEURS: "ATTENDS L'OUVERTURE", RACINES: 'HAUT PUIS BAS', DISQUES: 'ANNEAU ROUGE = IMPACT', TRONCS: 'ILS TOMBENT', GROTTE: 'PLAFOND BAS', 'DEUX VOIES': 'CHOISIS TON COTE', MARTEAUX: 'PASSE ENTRE LES COUPS', PALES: 'PASSE ENTRE LES PALES', BUMPERS: 'ZIGZAGUE', BALLONS: 'ENTRE LES BALLONS', SUCETTES: 'ATTENDS LE BALANCIER', GOMMES: 'ELLES REBONDISSENT', GUILLOTINES: 'PASSE QUAND ELLE MONTE', ETAGES: 'BAS OU HAUT', LIANES: 'ATTENDS LE BALANCIER', ROULEAUX: 'AU-DESSUS OU ENTRE', RIDEAUX: 'ENTRE LES LIANES', TOTEMS: 'PASSE ENTRE LES PLANCHES' },
    sgn = (txt, n, off) => signs.push([HINT[txt] ? txt + '\n' + HINT[txt] : txt, S(n) + (off === undefined ? -15 : off)]);
    const tubeCols = (MT[I.map] || MT.arch).tube;
    if (I.map === 'ice') {   // GLACE : un seul exemplaire de chaque obstacle
      const at = (n, o) => S(n) + o;
      sgn('MURS', 'patinoire', -10); slideWall(at('patinoire', 70), 0, 17, 12, 0.7); slideWall(at('patinoire', 150), 1.9, 17, 10, 0.95);
      sgn('TREMPLIN', 'vide', -50); skijump(S('vide') - 20);
      sgn('STALACTITES', 'stalactites', -10); icicles(at('stalactites', 60), 5, 0); icicles(at('stalactites', 120), 6, 0.9);
      sgn('GLACE', 'glissade', -10); slick(S('glissade') + 6, LEN('glissade') - 12); divider(at('glissade', 25), at('glissade', 225), 16, 'wood'); crystals(at('glissade', 70), 0, -22); pics(at('glissade', 60), 22); jaws(at('glissade', 150), 22);
      sgn('BOULE', 'boule', -10); snowball(at('boule', 30));
      sgn('PONT DE GLACE', 'pontglace', -10); slick(S('pontglace') + 6, LEN('pontglace') - 12);
      sgn('ETAGES', 'igloos', -25); { const e0 = S('igloos'); deckUp(e0 + 40, 220, 26, 30, '#e8f6ff', 36); divider(e0 + 44, e0 + 260, 16, 'wood');   // en bas : igloos | rien de plus ; en haut : foret | banquise
        igloo(e0 + 70, -22); igloo(e0 + 140, 22); onLevel(30, () => { divider(e0 + 46, e0 + 260, 14, 'wood'); drill(e0 + 90, -22); floes(e0 + 70); }); }
      sgn('BANQUISE', 'lac', -10); floes(at('lac', 40));
    } else if (I.map === 'desert') {   // DESERT : un seul exemplaire de chaque obstacle
      const at = (n, o) => S(n) + o;
      sgn('MARCHES', 'dunes', -10); divider(at('dunes', 25), at('dunes', 235), 16, 'sand'); stairs(at('dunes', 70), 0, -22); stairs(at('dunes', 130), 3, -22); dustDevils(at('dunes', 70), 22);
      sgn('PISTONS', 'pistons', -10); pistons(at('pistons', 70), 0); pistons(at('pistons', 140), 2);
      sgn('DISQUES', 'chute', -10); vultures(at('chute', 20));
      sgn('ETAGES', 'temple', -25); { const e0 = S('temple'); deckUp(e0 + 40, 220, 26, 30, '#f0d29a', 36); divider(e0 + 44, e0 + 260, 16, 'sand');   // en bas : scarabees | portes de pierre ; en haut : obelisques | haches
        beetles(e0 + 50, -22); sandDoors(e0 + 90, 22, 20); sandDoors(e0 + 170, 22, 20);
        onLevel(30, () => { divider(e0 + 46, e0 + 260, 14, 'sand'); obelisks(e0 + 60, -22); axes(e0 + 50, 22); }); }
      sgn('SURF', 'vide', -55); surf(S('vide') - 24);
      sgn('TEMPETE', 'canyon', -10); wind(at('canyon', 30), 110, { lat: 13, col: '#f3d9a0' }); wind(at('canyon', 150), 110, { lat: -13, col: '#f3d9a0' }); wind(at('canyon', 265), 60, { lat: 14, col: '#f3d9a0' });
      sgn('SALLE DES PILIERS', 'hypostyle', -10); hypostyle(at('hypostyle', 0));
    } else if (I.map === 'factory') {   // USINE : un seul exemplaire de chaque obstacle
      const at = (n, o) => S(n) + o;
      sgn('ENGRENAGES', 'engrenages', -10); gears(at('engrenages', 70), 0.4); gears(at('engrenages', 150), 1.7);
      sgn('PRESSES', 'presses', -10); divider(at('presses', 25), at('presses', 225), 16, 'steel'); presses(at('presses', 70), -22); flames(at('presses', 60), 22, 20);
      sgn('CONVOYEURS', 'convoyeur', -10); belts(at('convoyeur', 30), 80, 1); belts(at('convoyeur', 120), 80, -1);
      sgn('TUYAU LOOPING', 'vide', -55); loopPipe(S('vide') - 24);
      sgn('ETAGES', 'usine', -25); { const e0 = S('usine'); deckUp(e0 + 40, 220, 26, 30, '#98a2b0', 36); divider(e0 + 44, e0 + 260, 16, 'steel');   // en bas : wagonnets | caisses ; en haut : bras robotises | rouleaux broyeurs
        carts(e0 + 50, -22, 20); crates(e0 + 70, 0, 22); crates(e0 + 130, 1, 22);
        onLevel(30, () => { divider(e0 + 46, e0 + 260, 14, 'steel'); roboArms(e0 + 50, -22, 20); rollers(e0 + 150, 22, 20); }); }
      sgn('VAPEUR', 'vapeur', -10); steam(at('vapeur', 60), 5, 0); steam(at('vapeur', 120), 4, 1.3);
      sgn('ARCS ELECTRIQUES', 'arcs', -10); arcs(at('arcs', 30));
    } else if (I.map === 'jungle') {   // JUNGLE : un seul exemplaire de chaque obstacle, chacun dans sa section
      const at = (n, o) => S(n) + o;
      sgn('LIANES', 'lianes', -10); vinePend(at('lianes', 60), -20, 0, 1); vinePend(at('lianes', 60), 20, 1.7, -1); vinePend(at('lianes', 120), 0, 0.8, 1);
      sgn('ROULEAUX', 'rondins', -10); rollLog(at('rondins', 60), 0, 0, 26); rollLog(at('rondins', 115), 0, 2.2, 26);
      sgn('RIDEAUX', 'pont', -10); curtain(at('pont', 55), 4, 0); curtain(at('pont', 100), 4, 2.1);
      sgn('LIANE', 'vide', -60); zip(S('vide') - 18);
      sgn('FLEURS', 'fleurs', -10); divider(at('fleurs', 25), at('fleurs', 225), 16, 'wood'); flowers(at('fleurs', 60), -22); spiders(at('fleurs', 60), 22);
      sgn('CASCADE', 'cascade', -10); cascade(at('cascade', 80));
      sgn('ETAGES', 'canopee', -25); { const c0 = S('canopee'); deckUp(c0 + 40, 230, 26, 30, '#b88a52', 36); divider(c0 + 44, c0 + 270, 16, 'wood');   // sous la canopee : abeilles | ronces ; au-dessus : troncs abattus | singes
        bees(at('canopee', 60), -22, 9); brambles(at('canopee', 70), 22, 20);
        onLevel(30, () => { divider(c0 + 46, c0 + 270, 14, 'wood'); fallTrees(c0 + 60, -22, 20); monkeys(c0 + 90, 22, 1); }); }
      sgn('RACINES', 'racines', -10); roots(at('racines', 40));
      sgn('GROTTE', 'grotte', -10); cave(at('grotte', 0));
      sgn('TOTEMS', 'totems', -10); totem(at('totems', 70), -16, 0, 1); totem(at('totems', 70), 16, 2.6, -1); totem(at('totems', 140), 0, 1.2, 1);
    } else if (I.map === 'range') {   // TERRAIN D'ESSAI : un seul exemplaire de chaque obstacle
      const at = (n, o) => S(n) + o;
      signs.push(['CIBLES\nDE FACE = MUR', S('tir') - 25], ['HANGAR\nTRAVERSE-LE', S('falaise') - 25]); targets(at('tir', 60));
      sgn('CHICANE', 'falaise', 110); chicane(at('falaise', 120));
      sgn('BARRIERES', 'montee', -10); divider(at('montee', 25), at('montee', 205), 16); gateRow(at('montee', 80), -22, 2, 0.4); container(at('montee', 80), 22, 0, 8); container(at('montee', 150), 22, 2.4, 8);
      sgn('CATAPULTE', 'vide', -55); catapult(S('vide') - 22);
      sgn('CANONS', 'canons', -40); for (let k = 0; k < 6; k++) { const side = k % 2 ? 1 : -1; cannon(at('canons', 40 + k * 28), side * 38, side, k * 0.8); }
      sgn('ETAGES', 'base', -25); { const e0 = S('base'); deckUp(e0 + 40, 220, 26, 30, '#9aa0aa', 36); divider(e0 + 44, e0 + 260, 16);   // en bas : mines | tourelles ; en haut : ballons de barrage | helicopteres
        mines(e0 + 70, -22, 3, 0, 14); turrets(e0 + 70, 22, 20); onLevel(30, () => { divider(e0 + 46, e0 + 260, 14); barrage(e0 + 60, -22); heli(e0 + 60, 22); }); }
      sgn('PROJECTEURS', 'projecteurs', -10); spots(at('projecteurs', 40));
      sgn('MISSILES', 'pont', -20); missile(at('pont', 55));
      sgn('GRUE', 'grue', -10); crane(at('grue', 30));
      sgn('SILO', 'silo', -10); silo(at('silo', 60));
    } else {   // ARCHIPEL : un seul exemplaire de chaque obstacle, chacun dans sa section
      const at = (n, o) => S(n) + o;
      sgn('BUMPERS', 'bumpers', -20); bumpers(at('bumpers', 60));
      sgn('MARTEAUX', 'marteaux', -10); divider(at('marteaux', 25), at('marteaux', 215), 16); hammer(at('marteaux', 70), -22, 0); hammer(at('marteaux', 135), -22, 1.9); lolly(at('marteaux', 70), 22, 0.7); lolly(at('marteaux', 135), 22, 2.6);
      sgn('PALES', 'pont', -30); sweeper(at('pont', 55), 0, 0, 1); sweeper(at('pont', 120), 0, 1.6, -1);
      sgn('BEIGNETS', 'vide', -50); beignets(S('vide'));
      sgn('BALLONS', 'ballons', -20); balloons(at('ballons', 50), 5, 0); balloons(at('ballons', 110), 6, 2.2);
      sgn('TRAMPOLINES', 'trampolines', -10); trampolines(at('trampolines', 0));
      sgn('ETAGES', 'etages', -25); { const e0 = S('etages'); deckUp(e0 + 40, 220, 26, 30, '#ffd8ec', 36); divider(e0 + 44, e0 + 260, 16);   // etage du bas : macarons | portes battantes ; etage du haut : moulins | cerfs-volants
        macarons(e0 + 60, -22); doors(e0 + 90, 22, 20); doors(e0 + 170, 22, 20);
        onLevel(30, () => { divider(e0 + 46, e0 + 260, 14); windmill(e0 + 90, -22, 1); windmill(e0 + 180, -22, -1); kites(e0 + 130, 22); kites(e0 + 210, 22); }); }
      sgn('TOURNIQUET', 'tourniquet', -20); tourniquet(at('tourniquet', 70)); tourniquet(at('tourniquet', 140));
      sgn('GOMMES', 'gommes', -10); divider(at('gommes', 25), at('gommes', 220), 16); gommes(at('gommes', 70), -22); gateRow(at('gommes', 70), 22, 2, 0); gateRow(at('gommes', 140), 22, 2, 2.4);
      sgn('HUBLOT', 'hublot', -20); hublot(at('hublot', 80));
    }
    for (const g of groups) if (!g.userData.noGround) autoShadow(g);   // au-dessus du vide : pas d'ombre (une ombre est toujours posee sur une surface)
    return { update: (t, rp) => { for (const f of ups) f(t, rp); dynUpdate(rp); }, hits, signs };
  };

  let _tex = null;
  const bannerTex = () => _tex || (_tex = (() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#7a3cf0'); gr.addColorStop(1, '#2f8cff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 160); g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 148, 512, 12);
    g.fillStyle = '#ffffff'; g.font = '800 62px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COLD IMPACT', 256, 62); g.fillStyle = '#ffd23a'; g.font = '800 46px Arial, sans-serif'; g.fillText('CUP', 256, 116);
    const t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t;
  })());
  const pole = (h, col) => new T3.Mesh(new T3.CylinderGeometry(0.28, 0.4, h, 8), new T3.MeshLambertMaterial({ color: col }));
  const _stex = {};
  const signTex = (text0) => { const text = text0; return _stex[text] || (_stex[text] = (() => { const cv = document.createElement('canvas'); cv.width = 320; cv.height = 112; const g = cv.getContext('2d'); g.fillStyle = '#f2c230'; g.fillRect(0, 0, 320, 112); g.fillStyle = '#1d1e22'; for (let k = -2; k < 12; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 16, 0); g.lineTo(k * 32 + 16 - 24, 14); g.lineTo(k * 32 - 24, 14); g.fill(); g.beginPath(); g.moveTo(k * 32, 112); g.lineTo(k * 32 + 16, 112); g.lineTo(k * 32 + 16 - 24, 98); g.lineTo(k * 32 - 24, 98); g.fill(); }
    g.fillStyle = '#111114'; g.fillRect(10, 20, 300, 72); g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = text.split('\n'); const fit = (str, max, w) => { let px = max; g.font = '800 ' + px + 'px Arial, sans-serif'; while (g.measureText(str).width > w && px > 14) { px -= 2; g.font = '800 ' + px + 'px Arial, sans-serif'; } return px; };
    if (lines.length === 1) { g.fillStyle = '#ffd23a'; fit(lines[0], 58, 280); g.fillText(lines[0], 160, 57); } else { g.fillStyle = '#ffd23a'; fit(lines[0], 36, 284); g.fillText(lines[0], 160, 40); g.fillStyle = '#ffffff'; fit(lines[1], 24, 284); g.fillText(lines[1], 160, 72); }
    const t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t; })()); };

  const skyDecor = (T, C, grp) => {   // des elements dans les airs, de chaque cote : ils donnent du volume et de la vie ; hors de portee de la fusee (au-dela du mur invisible)
    const I = C.isle, map = I.map, items = []; let sd = 12345; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const lamb = (c) => new T3.MeshLambertMaterial({ color: c });
    const mkBalloon = (pal) => { const g = new T3.Group(), geo = new T3.SphereGeometry(7, 22, 14), pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) { const ang = Math.atan2(pos.getZ(i), pos.getX(i)), k = Math.floor((ang + Math.PI) / (Math.PI / 6)) % pal.length, c = new T3.Color(pal[k]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new T3.BufferAttribute(col, 3)); const body = new T3.Mesh(geo, new T3.MeshLambertMaterial({ vertexColors: true })); body.scale.set(1, 1.2, 1); body.position.y = 9; g.add(body);
      const bk = new T3.Mesh(new T3.BoxGeometry(2.4, 1.8, 2.4), lamb('#8a6238')); bk.position.y = -1.4; g.add(bk); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const r = new T3.Mesh(new T3.CylinderGeometry(0.07, 0.07, 6.2, 4), lamb('#d8c79a')); r.position.set(x * 1.6, 2.2, z * 1.6); r.rotation.z = -x * 0.22; r.rotation.x = z * 0.22; g.add(r); }
      const fl = new T3.Mesh(new T3.ConeGeometry(0.7, 2, 8), new T3.MeshBasicMaterial({ color: '#ffb347' })); fl.position.y = 1.2; fl.rotation.x = Math.PI; g.add(fl); return g; };
    const mkBlimp = () => { const g = new T3.Group(), body = new T3.Mesh(new T3.SphereGeometry(1, 20, 14), lamb('#a9b0aa')); body.scale.set(6, 6, 18); g.add(body);
      for (let k = -1; k <= 1; k += 2) { const st = new T3.Mesh(new T3.SphereGeometry(1.02, 20, 3, 0, 6.283, 1.25, 0.12), lamb('#d9a21b')); st.scale.set(6, 6, 18); st.position.z = k * 5; g.add(st); }
      for (const a of [0, 2.094, 4.188]) { const fn = new T3.Mesh(new T3.BoxGeometry(0.5, 6.5, 5.5), lamb('#5d6652')); fn.position.set(Math.sin(a) * 4.2, Math.cos(a) * 4.2, -14); fn.rotation.z = -a; g.add(fn); }
      const gd = new T3.Mesh(new T3.BoxGeometry(2.6, 2.2, 7), lamb('#4a5160')); gd.position.y = -6.4; g.add(gd); return g; };
    const mkIslet = (o) => { o = o || {}; const g = new T3.Group(), rock = new T3.Mesh(new T3.ConeGeometry(11, 15, 9), lamb(o.rock || '#8a6a4a')); rock.rotation.x = Math.PI; rock.position.y = -7.5; g.add(rock);
      const top = new T3.Mesh(new T3.CylinderGeometry(11.8, 11.4, 2.4, 14), lamb(o.top || '#5f9e3c')); top.position.y = 0.4; g.add(top);
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4, r = 5 + (k % 2) * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (o.style === 'pine') { for (let q = 0; q < 3; q++) { const cn = new T3.Mesh(new T3.ConeGeometry(3.2 - q * 0.8, 4, 8), lamb(q % 2 ? '#2f7a96' : '#3b8fae')); cn.position.set(x, 3.4 + q * 2.6, z); g.add(cn); const sn = new T3.Mesh(new T3.ConeGeometry(1.5 - q * 0.35, 1.4, 8), lamb('#ffffff')); sn.position.set(x, 4.5 + q * 2.6, z); g.add(sn); } }
        else if (o.style === 'cactus') { const c1 = new T3.Mesh(new T3.CylinderGeometry(0.9, 0.9, 7, 8), lamb('#3f9a5a')); c1.position.set(x, 4.2, z); g.add(c1); const c2 = new T3.Mesh(new T3.CylinderGeometry(0.6, 0.6, 3, 8), lamb('#3f9a5a')); c2.position.set(x + 1.6, 5.2, z); c2.rotation.z = 0.7; g.add(c2); }
        else if (o.style === 'stack') { const c1 = new T3.Mesh(new T3.CylinderGeometry(1.3, 1.6, 9, 10), lamb('#8b95a3')); c1.position.set(x, 5, z); g.add(c1); const c2 = new T3.Mesh(new T3.CylinderGeometry(1.4, 1.4, 1.2, 10), lamb('#f0b429')); c2.position.set(x, 9.4, z); g.add(c2); }
        else { const tr = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.8, 6, 7), lamb('#6b4a2a')); tr.position.set(x, 4.2, z); g.add(tr); const cn = new T3.Mesh(new T3.SphereGeometry(3, 12, 9), lamb(k % 2 ? '#3f9a44' : '#58b04a')); cn.position.set(x, 8, z); g.add(cn); } } return g; };
    const PALS = [['#ff4f9a', '#ffd23a', '#ffffff'], ['#2f8cff', '#ffffff', '#43d6a0'], ['#7a3cf0', '#ffd23a', '#ff4f9a']];
    for (let d = 80, k = 0; d < C.len + 60; d += 100 + rnd() * 60, k++) {
      const sg = k % 2 ? 1 : -1, w = Math.max(I.W(d), 34), lx = sg * (w + 64 + rnd() * 70), y = 24 + rnd() * 70, p = T.at(d, lx, y); let o;
      if (map === 'range') o = k % 3 === 1 ? mkBalloon(['#5d6652', '#d9a21b']) : mkBlimp(); else if (map === 'jungle') o = k % 2 ? mkIslet() : mkBalloon(['#3f9a44', '#ffd23a', '#e8f5c0']);
      else if (map === 'ice') o = k % 2 ? mkIslet({ rock: '#9fd0ee', top: '#f1faff', style: 'pine' }) : mkBalloon(['#ffffff', '#9fdcff', '#ff4fd8']);
      else if (map === 'desert') o = k % 2 ? mkIslet({ rock: '#c98b4a', top: '#e9c47e', style: 'cactus' }) : mkBalloon(['#e8c27a', '#2fb8b0', '#ffffff']);
      else if (map === 'factory') o = k % 3 === 1 ? mkIslet({ rock: '#6f7a88', top: '#8b95a3', style: 'stack' }) : (k % 3 === 2 ? mkBalloon(['#f0b429', '#2a2d33']) : mkBlimp());
      else o = k % 4 === 3 ? mkIslet() : mkBalloon(PALS[k % 3]);
      o.position.set(p[0], p[1], p[2]); o.rotation.y = rnd() * 6.28; o.scale.setScalar(0.85 + rnd() * 0.9); grp.add(o); items.push({ o, y0: p[1], ph: rnd() * 6.28, sp: (rnd() - 0.5) * 0.002 }); }
    return (t) => { for (const it of items) { it.o.position.y = it.y0 + Math.sin(t * 0.5 + it.ph) * 2.4; it.o.rotation.y += it.sp; } };
  };
  E.buildIsle = (T, C, grp) => {
    const I = C.isle, out = { isle: true, blocks: [], obst: [] }; SH_DYN.length = 0; { const th = (MT[I.map] || MT.arch).stone; for (let q = 0; q < 3; q++) STONE[q] = th[q]; }
    const railsG = rails(T, C); grp.add(bodyMesh(T, C)); grp.add(ocean(T, C)); grp.add(decals(T, C)); grp.add(railsG);
    const bm = new T3.MeshBasicMaterial({ map: bannerTex(), side: T3.DoubleSide, fog: false });
    const place = (d, lx, objs) => { const y = T.base(d), bk = I.bank(d), p = T.at(d, lx, bk * lx), q = T.at(d + 3, lx, bk * lx), g = new T3.Group(); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], p[1], q[2]); grp.add(g); for (const o of objs) g.add(o); autoShadow(g); return g; };
    for (let d = 100; d < C.len - 40; d += 75) for (const sg of [-1, 1]) {   // poteaux de course : un drapeau « COLD IMPACT CUP » tourne vers la fusee qui arrive
      const w = I.W(d); if (w < 20) continue; const po = pole(11, '#e8e8f0'), fl = new T3.Mesh(new T3.PlaneGeometry(6.4, 2), bm); po.position.y = 5.5; fl.position.set(-sg * 3.3, 9.6, 0); fl.rotation.y = Math.PI;
      place(d, sg * (w - 3), [po, fl]); { const bl = sg * (w - 3), fc = bl + sg * 3.3; I.boxes.push([d - 0.5, d + 0.5, bl - 0.5, bl + 0.5, 0, 11], [d - 1.1, d + 1.1, fc - 3.2, fc + 3.2, 8.6, 10.7]); }   // solides
    }
    { const pl = [pole(40, '#ffd23a'), pole(40, '#ffd23a')], ban = new T3.Mesh(new T3.PlaneGeometry(38, 11.8), bm); pl[0].position.set(19.5, 20, 0); pl[1].position.set(-19.5, 20, 0); ban.position.set(0, 34, 0); ban.rotation.y = Math.PI; place(-6, 0, [pl[0], pl[1], ban]); }   // l'arche de depart

    { const FNd = C.len, wF = I.W(FNd), rg = I.map === 'range', jg = I.map === 'jungle', hwB = Math.min(24, wF - 4), DEP = 54, HB = 30;   // l'arrivee : une ligne a damier au sol, puis on entre dans une grande boite
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; const c2 = cv.getContext('2d'); for (let a = 0; a < 32; a++) for (let b = 0; b < 4; b++) { c2.fillStyle = (a + b) % 2 ? '#15151a' : '#ffffff'; c2.fillRect(a * 8, b * 8, 8, 8); }
      const ct2 = new T3.CanvasTexture(cv); ct2.magFilter = T3.NearestFilter; ct2.anisotropy = 4;
      const cm = new T3.MeshBasicMaterial({ map: ct2, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      const line = new T3.Mesh(new T3.PlaneGeometry(2 * wF - 2, 10), cm); line.rotation.x = -Math.PI / 2; line.position.set(0, 0.2, 0);
      const FINC = (MT[I.map] || MT.arch).fin, wc = FINC[0], rc = FINC[1], tc = FINC[2], objs = [line];
      for (const sg of [-1, 1]) { const w = bx(3, HB, DEP, wc); w.position.set(sg * (hwB + 1.5), HB / 2, DEP / 2 + 1); objs.push(w); const st = bx(3.2, 2, DEP + 0.2, tc); st.position.set(sg * (hwB + 1.5), 3, DEP / 2 + 1); objs.push(st); const st2 = bx(3.2, 2, DEP + 0.2, tc); st2.position.set(sg * (hwB + 1.5), HB - 3, DEP / 2 + 1); objs.push(st2); }
      const roof = bx(2 * hwB + 9, 3, DEP, rc); roof.position.set(0, HB + 1.5, DEP / 2 + 1); objs.push(roof);
      const lint = new T3.Mesh(new T3.BoxGeometry(2 * hwB + 9, 6, 3.2), [mat(wc), mat(wc), mat(wc), mat(wc), new T3.MeshBasicMaterial({ map: ct2 }), new T3.MeshBasicMaterial({ map: ct2 })]); lint.material.forEach((q) => { if (q.map) q.map.repeat.set(1, 1); }); lint.position.set(0, HB - 3.5, 0); lint.scale.set(1, 1, 1); objs.push(lint);
      const back = bx(2 * hwB + 9, HB, 2.4, wc); back.position.set(0, HB / 2, DEP + 2); objs.push(back);
      for (const sg of [-1, 0, 1]) { const li = new T3.Mesh(new T3.BoxGeometry(1.6, 0.5, DEP - 4), new T3.MeshBasicMaterial({ color: '#fff3c4' })); li.position.set(sg * hwB * 0.55, HB - 0.2, DEP / 2 + 1); objs.push(li); }
      { const bn = document.createElement('canvas'); bn.width = 512; bn.height = 96; const bc = bn.getContext('2d'); bc.fillStyle = FINC[0]; bc.fillRect(0, 0, 512, 96); bc.fillStyle = tc; bc.fillRect(0, 0, 512, 10); bc.fillRect(0, 86, 512, 10); bc.fillStyle = '#ffffff'; bc.font = '800 62px Arial, sans-serif'; bc.textAlign = 'center'; bc.textBaseline = 'middle'; bc.fillText('ARRIVEE', 256, 50);
        const ban2 = new T3.Mesh(new T3.PlaneGeometry(2 * hwB, 9), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(bn), side: T3.DoubleSide })); ban2.position.set(0, HB - 3.6, -1.9); ban2.rotation.y = Math.PI; objs.push(ban2); }
      for (const sgp of [-1, 1]) { const px = sgp * (hwB + 10); for (let q = 0; q < 8; q++) { const c3 = cy(2.3, 2.3, 5.4, q % 2 ? '#ffffff' : FINC[1], 16); c3.position.set(px, 2.7 + q * 5.4, 2); objs.push(c3); } const ball = new T3.Mesh(new T3.SphereGeometry(3.4, 16, 12), new T3.MeshBasicMaterial({ color: tc })); ball.position.set(px, 8 * 5.4 + 3, 2); objs.push(ball); I.boxes.push([FNd - 1, FNd + 5, px - 2.6, px + 2.6, 0, 48]); }
      for (let q = 0; q < 17; q++) { const f2 = new T3.Mesh(new T3.CircleGeometry(1.3, 3), new T3.MeshBasicMaterial({ color: ['#ff4f9a', '#ffd23a', '#2f8cff', '#43d6a0'][q % 4], side: T3.DoubleSide })); const u = q / 16; f2.position.set((hwB + 10) * (2 * u - 1), 47 - 7 * Math.sin(Math.PI * u), 2); f2.rotation.z = Math.PI; objs.push(f2); }
      place(FNd, 0, objs); I.boxes.push([FNd, FNd + DEP, -hwB - 3, -hwB, 0, HB + 3], [FNd, FNd + DEP, hwB, hwB + 3, 0, HB + 3], [FNd, FNd + DEP, -hwB - 3, hwB + 3, HB, HB + 3]); }
    if (I.map === 'jungle') {   // arbres de jungle sur les bords : baobab a racines, palmier courbe, canopee en grappe de boules, lianes qui pendent
      const greens = ['#2f8a3c', '#3f9a44', '#58b04a', '#7cc65a'];
      const baobab = (h, k) => { const o = [], bark = ['#7a5634', '#6b4a2a', '#8a6238'];   // tronc en trois blocs qui s'affinent, deux branches, grosse canopee a plusieurs etages de feuillage, fleurs et lianes
        for (let q = 0; q < 3; q++) { const sg2 = cy(2.5 - q * 0.45, 2.9 - q * 0.45, h / 3 + 0.3, bark[q % 3], 12); sg2.position.y = h / 6 + q * (h / 3); o.push(sg2); }
        for (let q = 0; q < 5; q++) { const a = q * 1.257 + 0.4, rt = new T3.Mesh(new T3.ConeGeometry(1.0, 4.4, 6), mat('#6b4a2a')); rt.position.set(Math.cos(a) * 2.5, 1.6, Math.sin(a) * 2.5); rt.rotation.z = Math.cos(a) * 0.55; rt.rotation.x = -Math.sin(a) * 0.55; o.push(rt); }
        for (const s3 of [-1, 1]) { const br = cy(0.7, 1.0, 7, '#7a5634', 8); br.position.set(s3 * 2.6, h * 0.72, 0); br.rotation.z = -s3 * 0.9; o.push(br); }
        const lv = [[0, h + 2.5, 0, 6.8, 0], [5.2, h + 0.2, 1.8, 4.9, 1], [-5, h + 0.8, -2, 5.2, 2], [1.5, h + 6.8, -1.2, 4.4, 3], [-1.8, h - 1.2, 5, 4.2, 1], [3.2, h + 4.4, 3.5, 3.6, 3]];
        for (const [x, y, z, r, c] of lv) { const c3 = new T3.Mesh(new T3.IcosahedronGeometry(r, 1), mat(greens[(c + k) & 3])); c3.position.set(x, y, z); c3.scale.y = 0.82; o.push(c3); }
        for (let q = 0; q < 6; q++) { const a = q * 1.05 + k, fl = new T3.Mesh(new T3.SphereGeometry(0.5, 6, 5), new T3.MeshBasicMaterial({ color: q % 2 ? '#ff5fa8' : '#ffd23a' })); fl.position.set(Math.cos(a) * 6.4, h + 1 + (q % 3) * 1.6, Math.sin(a) * 6.4); fl.userData.noShadow = true; o.push(fl); }
        for (let q = 0; q < 4; q++) { const vn = cy(0.12, 0.12, 6 + q, '#3f8a3a', 5); vn.position.set(Math.cos(q * 1.6) * 5.6, h - 3, Math.sin(q * 1.6) * 5.6); o.push(vn); }
        for (let q = 0; q < 3; q++) { const mu = new T3.Mesh(new T3.SphereGeometry(0.8, 8, 5, 0, 6.2832, 0, 1.57), matS(q % 2 ? '#ff5a4a' : '#ffd23a')); mu.position.set(3.4 + q * 0.9, 0.2, 2.2 - q * 1.3); o.push(mu); } return o; };
      const palm = (h, k) => { const o = []; for (let q = 0; q < 5; q++) { const sg = cy(0.8 - q * 0.09, 0.9 - q * 0.09, h / 5 + 0.4, q % 2 ? '#8a6238' : '#7a5634', 8); sg.position.set(q * 0.55, h / 10 + q * (h / 5), 0); sg.rotation.z = -0.1 * q; o.push(sg); }
        for (let q = 0; q < 9; q++) { const a = q * 0.698, fr = new T3.Mesh(new T3.ConeGeometry(0.95, 8, 4), mat(q % 3 === 0 ? '#2f8a3c' : q % 3 === 1 ? '#58b04a' : '#7cc65a')); fr.scale.set(1, 1, 0.22); fr.position.set(2.6 + Math.cos(a) * 3.4, h - 0.6 - (q % 2) * 0.8, Math.sin(a) * 3.4); fr.rotation.z = Math.cos(a) * 1.15 + 1.35; fr.rotation.y = a; o.push(fr); }
        for (let q = 0; q < 3; q++) { const cc3 = new T3.Mesh(new T3.SphereGeometry(0.75, 8, 6), matS('#6b4a2a')); cc3.position.set(2.0 + q * 0.5, h - 1.4 - q * 0.2, 0.5 - q * 0.6); o.push(cc3); } return o; };
      for (let d = 60, k = 0; d < C.len + 40; d += 30, k++) for (const sg of [-1, 1]) { if (((d / 30) | 0) % 2 === (sg > 0 ? 0 : 1)) continue; const w = I.W(d); if (w < 22) continue; const lx = sg * (w - 6.5), h = 15 + ((d * 7) % 9), objs = (k % 3 === 2) ? palm(h, k) : baobab(h, k);
        place(d, lx, objs); I.boxes.push([d - 1.6, d + 1.6, lx - 1.6, lx + 1.6, 0, h + 8]); }
    }
    if (I.map === 'ice' || I.map === 'desert' || I.map === 'factory') {   // decor de bord propre a la carte (solide)
      const ice = I.map === 'ice', des = I.map === 'desert';
      for (let d = 70, k = 0; d < C.len + 40; d += 36, k++) for (const sg of [-1, 1]) { if (((d / 36) | 0) % 2 === (sg > 0 ? 0 : 1)) continue; const w = I.W(d); if (w < 22) continue; const lx = sg * (w - 6.5), o = [], h = 14 + ((d * 5) % 8);
        if (ice) { for (let q = 0; q < 4; q++) { const cn = new T3.Mesh(new T3.ConeGeometry(4.4 - q * 0.9, 5.6, 9), matS(q % 2 ? '#2f7a96' : '#3b8fae')); cn.position.y = 3 + q * 3.4; o.push(cn); const sn = new T3.Mesh(new T3.ConeGeometry(2.1 - q * 0.45, 2, 9), matS('#ffffff')); sn.position.y = 4.8 + q * 3.4; o.push(sn); } const tr = cy(0.9, 1.1, 3, '#6b4a2a', 8); tr.position.y = 1.5; o.push(tr); }
        else if (des) { const c1 = cy(1.5, 1.7, h, '#3f9a5a', 10); c1.position.y = h / 2; o.push(c1); const top = new T3.Mesh(new T3.SphereGeometry(1.5, 10, 8), matS('#3f9a5a')); top.position.y = h; o.push(top); for (const s2 of [-1, 1]) { const arm = cy(0.9, 0.9, 5, '#3f9a5a', 8); arm.position.set(s2 * 2.6, h * 0.55 + (s2 > 0 ? 1.5 : 0), 0); arm.rotation.z = s2 * 0.0; o.push(arm); const up = cy(0.9, 0.9, 4.5, '#3f9a5a', 8); up.position.set(s2 * 4.8, h * 0.55 + 3 + (s2 > 0 ? 1.5 : 0), 0); o.push(up); const hz = cy(0.8, 0.8, 4.8, '#3f9a5a', 8); hz.rotation.z = Math.PI / 2; hz.position.set(s2 * 2.7, h * 0.55 + (s2 > 0 ? 1.5 : 0), 0); o.push(hz); } }
        else { const cn1 = cy(2.2, 2.8, h + 8, '#7c8696', 12); cn1.position.y = (h + 8) / 2; o.push(cn1); for (let q = 0; q < 3; q++) { const bd = cy(2.9, 2.9, 1.3, q % 2 ? '#f0b429' : '#2a2d33', 12); bd.position.y = h + 2 + q * 2; o.push(bd); } const sm = new T3.Mesh(new T3.SphereGeometry(3.2, 10, 8), new T3.MeshLambertMaterial({ color: '#e8eaee', transparent: true, opacity: 0.55 })); sm.position.y = h + 12; o.push(sm); }
        place(d, lx, o); I.boxes.push([d - 1.8, d + 1.8, lx - 1.8, lx + 1.8, 0, h + 8]); }
    }
    const ob = obstacles(T, C, grp); out.hits = ob.hits;
    for (const [txt, dd] of ob.signs) for (const sg of [-1, 1]) { const w = I.W(dd); if (w < 16) continue; const po = pole(10, '#ffd23a'), pn = new T3.Mesh(new T3.PlaneGeometry(10, 3.5), new T3.MeshBasicMaterial({ map: signTex(txt), side: T3.DoubleSide, fog: false })); po.position.y = 5; pn.position.set(0, 9.4, 0); pn.rotation.y = Math.PI; place(dd, sg * (w + 4.5), [po, pn]); }   // hors de la piste : jamais sur le chemin
    { let zi = 0; SEC.forEach((q, i) => {   // portique de zone : une arche qui annonce chaque nouvelle section (numero + nom)
      if (i === 0) return; const dz = STARTS[i] + 3, w = I.W(dz); if (w < 16 || q.n === 'vide' || q.n === 'arrivee') return; zi++;
      const FC = (MT[I.map] || MT.arch).fin, cvz = document.createElement('canvas'); cvz.width = 512; cvz.height = 128; const cz = cvz.getContext('2d'); cz.fillStyle = FC[0]; cz.fillRect(0, 0, 512, 128); cz.fillStyle = FC[2]; cz.fillRect(0, 0, 512, 10); cz.fillRect(0, 118, 512, 10); cz.fillStyle = '#ffffff'; cz.textAlign = 'center'; cz.textBaseline = 'middle'; cz.font = '800 64px Arial, sans-serif'; cz.fillText('ZONE ' + zi, 256, 46); cz.fillStyle = FC[2]; cz.font = '800 34px Arial, sans-serif'; cz.fillText(q.n.toUpperCase(), 256, 94);
      const ban = new T3.Mesh(new T3.PlaneGeometry(Math.min(2 * w - 8, 40), 10), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(cvz), side: T3.DoubleSide, fog: false })); ban.position.set(0, 34, 0); ban.rotation.y = Math.PI; const objs = [ban];
      for (const sg of [-1, 1]) { const pz = cy(1.1, 1.5, 36, FC[1], 10); pz.position.set(sg * (w - 1.6), 18, 0); objs.push(pz); const cap = new T3.Mesh(new T3.SphereGeometry(1.8, 10, 8), new T3.MeshBasicMaterial({ color: FC[2], fog: false })); cap.position.set(sg * (w - 1.6), 37, 0); objs.push(cap); I.boxes.push([dz - 1.2, dz + 1.2, sg * (w - 1.6) - 1.2, sg * (w - 1.6) + 1.2, 0, 37]); }
      const bar = bx(Math.min(2 * w - 8, 40) + 2, 1.2, 1.4, FC[1]); bar.position.set(0, 28.6, 0); objs.push(bar); place(dz, 0, objs); }); }
    { const sky = skyDecor(T, C, grp); out.update = (t, rp) => { ob.update(t, rp); sky(t); if (rp) for (const ch of railsG.children) ch.visible = ch.userData.c.distanceToSquared(rp) < 640 * 640; }; }
    return out;
  };
})();
