# Prototype « Evolution » (v119, `?evo=1`)

Boucle inspirée d'Epic Plane Evolution : **un seul écran, un seul but, aller le plus loin en éclatant des ennemis**. Lien : `…/cold-impact.project/?evo=1`
(sans `?evo=1` le jeu reste le jeu normal, niveau 1 « mur du boss » compris). Code : `src/systems/evo.js` (logique), `Home.drawEvo` dans `src/ui/home.js` (écran),
crochets dans `game.js`, `endless.js`, `targets.js`, `pad.js`, `menu.js`, `hud_simple.js`, `pro.js`.

## Boucle
1. Écran unique : la fusée sur son lanceur (3D), pièces, record, bouton LANCER, trois lignes d'amélioration. Un toucher sur la fusée lance aussi.
2. Vol : poussée automatique, carburant en secondes ; **le carburant ne revient que des ennemis détruits**. Sans carburant la fusée tombe (trajectoire balistique) ; au sol, le vol est fini.
3. Chaque ennemi a des PV affichés (vert = ta fusée est assez forte, rouge = trop faible). Dégâts = dégâts de la fusée × (vitesse / 40, bornée 0,8 à 1,5). Un ennemi trop fort brise la fusée (« TROP FAIBLE », avec PV / dégâts).
4. Fin de vol : distance, ennemis, pièces (compteur animé), « PIECES X2 » (pub récompensée d'exemple), puis les améliorations et LANCER (relance en moins d'une seconde).
5. Zone 1 (ville) jusqu'au **boss** (gunship, 16 PV, trois phases comme le niveau 1 : tirs guidés, éventail, mur de missiles). Boss vaincu : +300 pièces et **aperçu automatique de la zone 2 (forêt)** pendant 14 s, puis « fin du prototype ».

## Améliorations (barres de 5 : à la 5e, la pièce évolue)
| Ligne | Paliers | Effet par niveau |
|---|---|---|
| FUSEE (20) | TUBE DE CARTON (sans réacteur) → REACTEUR → AILERONS → TURBO | dégâts 1,4 + 0,1·n + 0,35·palier ; carburant 0 / 3+1·s / 9+1,5·s / 17+2·s secondes ; poussée 0 / 22 / 36 / 46 (+3 par barre) ; trainée ; carburant rendu par ennemi 0,5 + 0,06·n |
| LANCEUR (15) | RAMPE EN BOIS → RAIL → CATAPULTE | vitesse de départ 27 + 1,8·n + 2·palier (m/s) ; anneaux lumineux de plus en plus nombreux sur le rail |
| PIECES (5) | ×1,0 → ×2,0 | multiplicateur de pièces par ennemi et à la distance |
Coûts : fusée 8·1,29^n, lanceur 6·1,29^n, pièces 20 / 50 / 110 / 220 / 420. Pièces d'un ennemi : (3 + 2·PV) × multiplicateur ; distance : 1 pièce par 10 m × multiplicateur ; +12 par coup au boss.
PV des ennemis selon la distance : 1 + 3,2·(d/1700)^1,15 arrondi au demi (1 au départ, ~4 près du boss).

## Départ
Fusée de carton **sans réacteur** : lancée à 27 m/s, elle retombe après ~30 m. Le premier ennemi (un char, 1 PV) est à 24 m, sur sa trajectoire : un tir droit le détruit. Il faut environ 8 à 10 vols à un ennemi pour acheter les 5 premières barres et obtenir le réacteur.

## Tester vite (paramètres d'adresse)
`?evo=1&evocoins=500&evork=12&evola=8&evocm=2` (pièces, niveaux de fusée / lanceur / pièces). Banc de test : `?test=1&evo=1&endless=1` puis `CC.game.goHome({autoLaunch:true})` et `CC.harness.step(n)`.

## À mesurer au test (10 minutes)
- Nombre de vols avant le réacteur, avant le premier mur de PV (~850 m avec le palier 1), avant le boss ; durée d'un vol ; envie de relancer.
- Lisibilité des PV rouge / vert, des trois lignes, de l'évolution (icône de fusée par palier + apparence sur le lanceur).
- Réglages : coûts et PV dans `evo.js` (`EVO.cost`, `EVO.hpAt`, `EVO.rocket`, `EVO.launcher`), position du premier ennemi (`endless.js`, 24 m), gravité sans moteur (`gripEngineOff`, chute `EVO.tick`).

## Limites
Le pilote automatique du banc rate beaucoup d'ennemis : les durées de partie et les revenus sont des ordres de grandeur, pas des mesures humaines. Pubs = publicités d'exemple. Pas de nouvelle zone jouable après le boss (aperçu seulement).

## v120 (retour du premier test)
- **Réinitialiser** : bouton en bas à droite (deux touchers) ; pied de page « VOLS n  TEMPS m:ss » depuis le premier lancer ; le **rapport** (étapes avec n° de vol et temps : réacteur, ailerons, turbo, 1er ennemi trop fort, 600 / 1000 / 1500 m, boss) s'affiche à la fin du prototype (`save.evo.marks`).
- **Vitesse** : vitesse de pointe par palier 36 / 44 / 52 m/s (+1,5 par barre), au lieu de 47 / 60 / 71 jusqu'à 77 ; carburant +20 % pour garder la portée.
- **La fusée grossit de 3,5 % à chaque barre** (en plus du changement de palier) ; pas de nouveauté pour le lanceur.
- **Explications** : consignes avant les premiers vols (carton, puis carburant et PV vert / rouge) et une phrase d'aide sous la cause de chaque fin de vol.
