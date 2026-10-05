/* v076 : MODE NIVEAUX — des parcours de longueur fixe (de plus en plus longs et durs) qui se terminent par une arène et un BOSS ;
 * le vaincre ouvre le niveau suivant et donne un coffre d'écrous. Un niveau = une graine fixe (le même parcours à chaque essai), UNE zone
 * (qui change à chaque niveau), une longueur, un facteur de difficulté, un boss, un décor de lanceur.
 * v078 : 60 niveaux ; chaque niveau a un THEME (mélange de cibles et d'ennemis de garde différent : chasse aux hélicoptères, blindés, batteries
 * de missiles…) et, dès le niveau 4, des MINI-BOSS répartis sur le parcours avant le boss final. */
(function () {
  const ZN = ['city', 'forest', 'port', 'usine', 'tour', 'sky', 'metro', 'mini', 'eau', 'chute'];
  // v081 : un engin militaire réaliste différent par niveau (models_boss.js) ; chaque zone a ses 6 engins, dans l'ordre de ses 6 passages (niveau n, n+10, n+20…) ;
  // la livrée (bossTint) change aussi. Dans les zones aériennes (tour, base aérienne, chute) : avions et hélicoptères ; en mer : sous-marins de 3 types.
  const POOL = { city: ['ifv', 'gunship', 'aagun', 'mlrs', 'tank', 'heli'], forest: ['tank', 'spg', 'ifv', 'sam', 'mlrs', 'aagun'], port: ['destroyer', 'gunship', 'mlrs', 'aagun', 'spg', 'heli'],
    usine: ['aagun', 'spg', 'tank', 'sam', 'ifv', 'mlrs'], tour: ['jet', 'gunship', 'heli', 'bomber', 'jet', 'gunship'], sky: ['bomber', 'jet', 'gunship', 'heli', 'jet', 'bomber'],
    metro: ['train', 'ifv', 'tank', 'spg', 'sam', 'mlrs'], mini: ['tank', 'ifv', 'sam', 'aagun', 'mlrs', 'spg'], eau: ['sub', 'sub', 'sub', 'sub', 'sub', 'sub'], chute: ['jet', 'bomber', 'gunship', 'heli', 'jet', 'bomber'] };
  // thèmes : ground / air = tirage des cibles (au sol / en altitude) ; foe = poids des ennemis de garde (chars, lance-missiles, hélicoptères)
  const THEMES = [
    { name: 'MIXTE', ground: ['tank', 'truck', 'heli', 'heli', 'sam'], air: ['heli', 'heli', 'heli', 'heli', 'truck'], foe: { tank: 1, sam: 1, heli: 1 } },
    { name: 'CHASSE AUX HELICOS', ground: ['heli', 'heli', 'tank'], air: ['heli'], foe: { tank: 0.3, sam: 0.5, heli: 2.4 } },
    { name: 'BLINDES', ground: ['tank', 'tank', 'truck', 'sam'], air: ['heli', 'tank'], foe: { tank: 2.4, sam: 0.7, heli: 0.4 } },
    { name: 'BATTERIES DE MISSILES', ground: ['sam', 'sam', 'tank', 'truck'], air: ['heli', 'heli'], foe: { tank: 0.5, sam: 2.6, heli: 0.6 } },
    { name: 'CONVOI', ground: ['truck', 'truck', 'tank', 'sam'], air: ['heli', 'truck'], foe: { tank: 1.4, sam: 1, heli: 0.8 } },
    { name: 'ESCADRON', ground: ['heli', 'heli', 'sam'], air: ['heli'], foe: { tank: 0.2, sam: 1.6, heli: 2.2 } },
    { name: 'FORTERESSE', ground: ['tank', 'sam', 'sam', 'truck'], air: ['heli', 'sam'], foe: { tank: 2, sam: 2, heli: 1 } },
  ];
  const MINI = ['tank', 'heli', 'sam'];
  const NEWZ = ['canyon', 'banquise', 'eolien', 'carrier', 'volcan', 'jungle', 'barrage', 'neon', 'carriere', 'epaves', 'lancement', 'autoroute'], ALLZ = ZN.concat(NEWZ);
  POOL.city = ['ifv', 'gunship', 'aagun', 'mlrs', 'truck', 'heli']; POOL.forest = ['tank', 'spg', 'jeep', 'sam', 'mlrs', 'aagun']; POOL.usine = ['aaturret', 'spg', 'tank', 'sam', 'ifv', 'mlrs']; POOL.sky = ['bomber', 'radar', 'gunship', 'heli', 'jet', 'bomber']; POOL.eau = ['sub', 'mine', 'torpedo', 'sub', 'mine', 'torpedo'];
  POOL.canyon = ['gunship', 'buggy', 'bomber', 'crawler', 'aagun', 'technical']; POOL.banquise = ['jet', 'arcticSam', 'tank', 'airlifter', 'mlrs', 'snowcat']; POOL.eolien = ['hover', 'jet', 'torpedo', 'gunship', 'jet', 'destroyer']; POOL.volcan = ['gunship', 'mortar', 'bomber', 'crawler', 'jet', 'apc']; POOL.jungle = ['gunship', 'recon', 'heli', 'technical', 'mlrs', 'apc']; POOL.barrage = ['dozer', 'bomber', 'apc', 'jet', 'dozer', 'gunship']; POOL.neon = ['recon', 'jet', 'train', 'heli', 'airlifter', 'bomber']; POOL.carriere = ['spg', 'haul', 'gunship', 'crawler', 'aagun', 'dozer']; POOL.epaves = ['destroyer', 'torpedo', 'jet', 'mine', 'bomber', 'hover']; POOL.lancement = ['tel', 'jet', 'airlifter', 'bomber', 'rocketTruck', 'gunship']; POOL.autoroute = ['tanker', 'spg', 'rocketTruck', 'gunship', 'apc', 'aagun']; POOL.carrier = ['jet', 'bomber', 'destroyer', 'gunship', 'jet', 'bomber'];
  // v095 : 300 niveaux — rythme par CHAPITRE de 10 : montée, un niveau « respiration » tous les 5, boss de chapitre plus long et plus dur
  const LENV = [1, 0.8, 1.05, 0.9, 0.75, 1, 1.1, 0.9, 0.8, 1.2];       // longueur relative selon la position dans le chapitre
  const HARDV = [0.9, 0.95, 1, 1.05, 0.8, 0.95, 1.05, 1.1, 0.85, 1.2]; // difficulté relative (le 5 et le 9 respirent, le 10 est le boss de chapitre)
  // v109 : les 10 premiers niveaux sont un PARCOURS CHOISI (zones ouvertes, de jour, lisibles) ; les zones verticales ou fermées (tour, chute, base aérienne, usine, métro, mini) ne viennent qu'à partir du niveau 25
  const EARLY = ['eolien', 'forest', 'port', 'carriere', 'canyon', 'city', 'autoroute', 'banquise', 'jungle', 'city'], HARD = { tour: 1, chute: 1, sky: 1, usine: 1, metro: 1, mini: 1 }, SOFT = ['city', 'forest', 'port', 'canyon', 'jungle', 'banquise', 'carriere', 'autoroute'];
  const zoneFix = (n, z) => (n <= 10 ? EARLY[n - 1] : n < 25 && HARD[z] ? SOFT[n % SOFT.length] : z);
  const def = (n) => {
    n = Math.max(1, n | 0);
    // v096 : quatre zones en plus (niveaux 12, 17, 22, 27, puis tous les 20 niveaux pour chacune)
    const zone = zoneFix(n, (n >= 12 && n % 5 === 2) ? NEWZ[Math.floor((n - 12) / 5) % 4] : (n >= 14 && n % 5 === 4) ? NEWZ[4 + Math.floor((n - 14) / 5) % 4] : (n >= 13 && n % 10 === 3) ? 'eau' : (n >= 15 && n % 5 === 0) ? NEWZ[8 + Math.floor((n - 15) / 5) % 4] : ZN[(n - 1) % ZN.length]), zi = ALLZ.indexOf(zone), flat = CC.Zones.PROFILE[zone].elev === 0, th = n <= 2 ? THEMES[0] : THEMES[(n * 3 + Math.floor(n / 7)) % THEMES.length];
    const nm = n < 4 ? 0 : n < 9 ? 1 : n < 17 ? 2 : 3, hp = n <= 3 ? 1 : Math.min(14, 1 + Math.floor((n - 1) / 3) + (n % 10 === 0 ? 1 : 0)), len = n === 1 ? 900 : n === 2 ? 1200 : Math.round(Math.min(5200, 1500 + 280 * (n - 1)) * LENV[(n - 1) % 10] / 10) * 10;   // v093 : niveaux 1-2 courts ; v095 : longueur variable dans le chapitre (3 min max)
    const mids = [];
    const pool = POOL[zone] || POOL.city, k = Math.floor((n - 1) / ZN.length), boss = pool[k % pool.length];
    for (let i = 0; i < nm; i++) { let mt = pool[(k + 1 + 2 * i) % pool.length]; if (mt === boss && zone !== 'eau') mt = pool[(k + 2 + 2 * i) % pool.length]; if (mt === boss && zone !== 'eau') mt = MINI[(n + i) % MINI.length]; mids.push({ d: Math.round(len * (i + 1) / (nm + 1)), type: mt, tint: (k + i + 3) % 6, variant: (k + i + 1) % 3, hp: Math.min(5, 2 + Math.floor(n / 12)) }); }
    return {
      n, zone, seed: 7000 + n * 131, len,
      nightOk: n >= 16 && n % 12 === 4,                                    // v109 : la nuit est EXCEPTIONNELLE (un niveau sur 12 à partir du 16)
      dens: n <= 2 ? 0.95 : n <= 10 ? 0.66 : n <= 30 ? 0.7 : 0.8,         // v109 : moins d'ennemis (part des cibles et gardes conservée)
      difK: Math.min(6, 0.35 + 0.075 * (n - 1)) * (n <= 3 ? 1 : HARDV[(n - 1) % 10]), chapter: Math.floor((n - 1) / 10) + 1,                    // v084 : la difficulté (cibles, ouvertures, missiles) monte DOUCEMENT avec le numéro du niveau (niveau 1 : 0,35 ; niveau 10 : 1 ; niveau 40 : 3,3)
      ease: Math.min(1, (n - 1) / 35),                 // 0 → 1 sur 35 niveaux : ouvertures, slaloms et virages passent de très larges à serrés
      hp,                                              // les trois premiers boss tombent d'un coup, ensuite de plus en plus de points de vie
      boss, bossTint: (k + zi) % 6, bossVar: k % 3, look: (k * 7 + 5 * zi + (k >> 1)) % (CC.Look ? CC.Look.LOOKS.length : 6), kit: n <= 10 ? 0 : (n * 5 + k * 3 + zi) % 8, theme: th, mids,
      event: n < 3 ? null : { type: ['rain', 'storm', 'convoy'][(n + k) % 3], d: Math.round(len * (0.5 + 0.1 * ((n * 7) % 3))) },   // v083 : un événement par niveau (dès le niveau 3)
      // départ DIRECTEMENT dans la zone (même altitude que le lanceur) ; les zones en contrebas / en altitude (métro, profondeur, base aérienne) sont atteintes par une rampe très courte
      order: (flat ? [] : ['city']).concat(new Array(90).fill(zone)),
      chest: Math.round(10 + 3 * Math.min(n, 60) + 1.2 * Math.max(0, n - 60)),   // v086 : les écrous sont plus rares (le garage a maintenant 30 niveaux d'amélioration par pièce)
    };
  };
  CC.LM = { ZN, def, count: 300, THEMES, POOL };
})();
