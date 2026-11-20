/* v456 : EQUILIBRAGE DES NIVEAUX 2 A 8 SUR LE NIVEAU 1.
 * Le niveau 1 est la reference : on le finit pile quand la DERNIERE fusee est au maximum (amelioration 20 : TURBO, barre pleine).
 * Avant : les niveaux 5 a 8 se finissaient des la 5e a la 10e amelioration (3 fois trop de carburant), les niveaux 2 et 3 pas meme a la 26e.
 * Ici, le carburant de chaque niveau suit la courbe du niveau 1 : a l'amelioration n, on va aussi loin (en part du parcours) qu'au niveau 1.
 * Les tables [carburant, part du parcours] ont ete mesurees au banc (cctest/fuelx.js : bon pilote, fusee 20, carburant impose).
 * Les prix et les gains ne changent pas (memes formules que le niveau 1, x PRICE_K) : meme nombre de vols qu'au niveau 1. */
(function () {
  const EVO = CC.EVO; if (!EVO) return;
  // part du parcours atteinte au niveau 1 avec la fusee n (releve de la partie complete, cctest/campagne.js) ; 20 = arrivee
  const T = [0.05, 0.055, 0.06, 0.065, 0.07, 0.09, 0.097, 0.118, 0.13, 0.135, 0.149, 0.162, 0.22, 0.29, 0.32, 0.57, 0.66, 0.72, 0.79, 0.854, 1];
  const part = (rk) => (rk < T.length ? T[Math.max(0, rk)] : 1);
  // [carburant au depart, part du parcours parcourue] par niveau (le dernier point : l'arrivee)
  const TAB = {
    2: [[0, 0], [60, 0.512], [80, 0.699], [108, 1]],   // niveaux 2 et 3 : physique du niveau 1, le carburant n'existe qu'a partir du REACTEUR (fusee 10)
    3: [[0, 0], [60, 0.775], [78, 1]],
    4: [[0, 0], [15, 0.183], [25, 0.294], [35, 0.357], [50, 0.634], [70, 0.776], [89, 1]],
    5: [[0, 0], [15, 0.368], [25, 0.651], [35, 0.713], [40, 0.792], [45, 1]],
    6: [[0, 0], [20, 0.184], [35, 0.411], [50, 0.696], [66, 1]],
    7: [[0, 0], [20, 0.264], [35, 0.548], [50, 0.734], [71.5, 1]],
    8: [[0, 0], [20, 0.239], [35, 0.415], [50, 0.652], [70, 0.887], [80, 1]],
  };
  EVO.ECO_T = T; EVO.ECO_TAB = TAB;
  const inv = (tab, p) => { for (let i = 1; i < tab.length; i++) { const a = tab[i - 1], b = tab[i]; if (p <= b[1]) return a[0] + (b[0] - a[0]) * (p - a[1]) / Math.max(1e-6, b[1] - a[1]); } return tab[tab.length - 1][0]; };
  // carburant du niveau st pour la fusee rk et le lanceur la (le lanceur ajoute un peu : il reste utile)
  EVO.ecoFuel = (st, rk, la) => { const tab = TAB[st]; if (!tab) return null; const F100 = tab[tab.length - 1][0];
    const f = rk >= 20 ? F100 * 1.05 * (1 + 0.03 * (rk - 20)) : inv(tab, part(rk));
    return f * (1 + 0.012 * Math.max(-8, Math.min(8, (la || 0) - Math.round(0.85 * rk)))); };
  // niveaux 2 et 3 : on garde le carburant d'origine tant qu'il suffit (debut et milieu deja proches du niveau 1) ; on en ajoute pour que la derniere fusee arrive au bout
  { const _ol = EVO.onLaunch; EVO.onLaunch = (g) => { _ol(g); const st = EVO.stage(g); if ((st !== 2 && st !== 3) || (g.evo && g.evo.preview)) return; const S = EVO.save(g), rk = g.rocket;
      if (!rk || !(rk.fuelMax > 0.05) || (S.rk || 0) < 10) return; const F = EVO.ecoFuel(st, S.rk || 0, S.la || 0); if (!(F > rk.fuelMax)) return; const k = rk.fuel / rk.fuelMax; rk.fuelMax = F; rk.fuel = F * k; }; }
  // niveaux 4 a 8 : un metre rapporte autant qu'au niveau 1 (avant : 0,12 a 0,37 x, voire x0,45 en plus, pour compenser le carburant trop genereux)
  { const _dp = EVO.distPay; EVO.distPay = (g, dist) => (EVO.stage(g) >= 4 ? 1 : _dp ? _dp(g, dist) : 1); }
  for (const st of [4, 5, 6, 7, 8]) { const k = 'fuel' + st; if (EVO[k]) EVO[k] = (rk, la) => EVO.ecoFuel(st, rk, la); }
})();
