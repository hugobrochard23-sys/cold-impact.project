# Rapport économie et rythme — jeu de référence, niveau 1 (vidéo 20 min 38 s)

> **Correction (voir `COMPLEMENT.md`)** : le « changement d'appareil » de ce rapport est en réalité la **fin du niveau 1** (arrivée à ~8 450 m, récompense « doublez vos revenus »), obtenue à l'**essai 22** (20 essais + 2 avec une apparence rouge). Le « niveau 2 » est une autre carte, courte et à obstacles, avec les mêmes 3 cartes d'amélioration ; ses distances ne se comparent pas à celles du niveau 1.

Source : `Enregistrement de l'écran 2026-10-20 222539.mp4` (joueur = toi, bon joueur). Méthode : OCR Windows local (aucune installation) sur 1 image/s, puis lecture visuelle de planches pour les niveaux et les prix. Seuls des NOMBRES et un enchaînement de rythme sont repris. Les cartes d'amélioration sont nommées A / B / C (A = lanceur, B = appareil, C = revenu) : aucun nom du jeu de référence.
Les temps sont en secondes vidéo. Données détaillées : `epe_niveau1.csv`, `epe_ameliorations.csv`.

## 1. Tableau récapitulatif

| Élément | Valeur |
|---|---|
| Essais avec le premier appareil (jusqu'au changement d'appareil, ~t=1130 s) | **20** |
| Durée jusque-là | ~1 130 s (18,8 min), dont ~70 s de pubs récompensées |
| Durée d'un essai (fin du hangar → rapport, rampe de lancement comprise) | 9 s au début → 18-33 s (essais 5-11) → 48-76 s (essais 12-20) |
| Séjour au hangar | 5 à 20 s, 1 à 6 achats par séjour |
| Distance d'un essai | 346 m (essai 1-4) → 668 → ~1 400 → ~3 100-3 500 → 5 800-7 400 m (essai 20) |
| Pièces gagnées par distance | **1 pièce par mètre** (346 m ↔ 346 pièces, 863 m ↔ 863, vérifié sur 4 rapports) |
| Total d'un rapport | distance × multiplicateur de revenu (vérifié sur les 20 rapports, sauf un écart à l'essai 6) |
| Premier gain | 348 pièces au 1er essai (9 s) |
| Dernier gain affiché (essai 20) | ~29 700 pièces (soit ×85 par rapport à l'essai 1) |
| Achats au total | 44 achats observés ou déduits (A : 14, B : 20, C : 10), soit ~2,2 achats par essai |
| Pubs récompensées | 4 (essais 15, 16, 18, 19), 17-19 s chacune, toutes sur « multiplier et récupérer » |
| Pubs courtes (écran fixe ~2-3 s) | 9, toutes juste après « Suivant » (voir §5) |
| Coffre | 1 coffre gratuit, +540 pièces (t≈143), puis minuteur de ~3 h |
| Gemmes | solde 0 pendant toute la vidéo |

## 2. Courbe de prix

Les prix sont lus à l'écran pour chaque niveau de chaque carte. Deux cartes suivent une formule exacte, la troisième une formule approchée :

| Carte | Prix du niveau n → n+1 (relevé) | Formule approchée | Ma formule |
|---|---|---|---|
| A (lanceur) | 180, 252, 353, 494, 692, 968, 1 355, 1 897, 2 656, 3 719, 5 207, 7 289, 10,2K, 14,2K, 20K | **180 × 1,40^(n−1)** (exact, écart < 1 %) | fusée 90×1,19^n ; lanceur 70×1,19^n |
| C (revenu) | 100, 165, 272, 449, 741, 1 223, 2 018, 3 330, 5 494, 9 065, 14,9K | **100 × 1,65^(n−1)** (exact, écart < 1 %) | pièces : 150, 250, 420, 700, 1 100 puis ×1,45 |
| B (appareil) | 180, 198, 218, 240, 264, 290 (×1,10), puis 996, 1 325, 1 762, 2 344 (×1,33), 3 619, 4 886, 6 591 … 39,9K (×1,35), 72,7K | ×1,10 pour les 6 premiers niveaux, puis ~×1,33-1,35 | — |

À niveau 15, A coûte 20 000 (réf.) contre 90×1,19^15 ≈ 1 220 (mon jeu, fusée). Le niveau 15 n'a pas le même sens dans les deux jeux (voir §7).

Effet de la carte C (multiplicateur de revenu affiché) : niveau 1 ×1 ; 2 ×1,1 ; 3 ×1,2 ; 4 ×1,3 ; 5 ×1,4 ; 6 ×2 ; 7 ×2,2 ; 8 ×2,4 ; 10 ×2,8 ; 11 ×4. Le niveau 9 n'a pas été lu. Mon jeu : +25 % par niveau (×1 → ×1,25 → ×1,5 …), soit ×4 environ au niveau 13.

Quand les pièces ne suffisent pas, la carte B affiche « 1 gemme » au lieu du prix en pièces. Je n'ai observé aucun gain de gemme (solde toujours 0), donc c'est un blocage tant qu'on n'a pas les pièces.

## 3. Pièces par essai et essais pour acheter la prochaine amélioration

Le joueur dépense presque tout à chaque séjour au hangar (solde de fin : 6 à 1 500 pièces, jusqu'à 28 pièces). Rapport « gain du dernier essai / prix de l'amélioration la moins chère » :

| Essai | Gain | Moins chère | Rapport | Achats ensuite |
|---|---|---|---|---|
| 1 | 348 | 100 (C) | 3,5 | 2 |
| 2 | 380 | 165 (C) | 2,3 | 2 |
| 4 | 380 | 252 (A) | 1,5 | 1 |
| 6 | 1 121 | 272 (C) | 4,1 | 2 |
| 10 | 1 786 | 741 (C) | 2,4 | 1 |
| 14 | 7 766 | 2 018 (C) | 3,8 | 2 |
| 17 | 9 287 | 9 065 (C) | 1,0 | 1 |
| 20 | 29 700 | 14 900 (C) | 2,0 | inconnu |

**Lecture :** sur l'ensemble de la vidéo, il y a **environ 1 achat toutes les 0,45 essai** (44 achats / 20 essais). Par carte : A ~1 achat tous les 1,4 essai, B ~1 tous les 1,0, C ~1 tous les 2,0. Pour la carte la plus chère de chaque moment, il faut 1 à 2 essais. Ton objectif de 1,5 à 3 essais par amélioration est donc **plus lent** que ce que la référence offre au joueur qui achète tout. Seule la carte C (revenu) est dans ta fourchette.

## 4. Essais pour finir le niveau

Je n'ai pas de « fin de niveau » explicite dans la vidéo. Repère disponible : le joueur passe à un deuxième appareil vers t≈1130 s après **20 essais** (cartes A15 / B21 / C11). Ce chiffre est une borne basse, parce que tu es un bon joueur. Je n'ai pas vu de condition de passage affichée.

## 5. Rythme des pubs (rythme seulement)

- Pubs récompensées : 4, entre t=672 et t=1044, toutes sur l'écran de rapport (« multiplier et récupérer »), de 17 à 19 s. Résultats : ×3 (essai 15), ×4 (essai 16), ×2 (essai 18), inconnu (essai 19). Elles interviennent à partir de l'essai 15, quand les gains dépassent 7 000 pièces.
- Pubs courtes (~2-3 s d'écran fixe) : après « Suivant » aux essais 1, 4, 6, 8, 10, 12, 13, 14 et 20 (t = 34, 102, 186, 275, 364, 480, 546, 615, 1130). Intervalle de 66 à 116 s, jamais juste après une pub récompensée. Je ne sais pas si le joueur peut les fermer.
- Aucune pub avant le 1er rapport, et aucune pendant un vol.
- Un bouton « débloquer » (pub récompensée possible) apparaît dans le hangar vers t≈410, sans qu'on voie s'il a été utilisé.
- Une fenêtre de notation apparaît vers t≈410 (un seul affichage).
- Le coffre gratuit +540 s'ouvre à t≈143, soit après ~2,4 min de jeu.

## 6. Certain, estimé, inconnu

**Certain (lu et recoupé par l'arithmétique des soldes) :** distances et totaux des 20 rapports, 1 pièce/m, niveaux et prix des 3 cartes, 33 achats sur 44, durées d'essai (±2 s), nombre de pubs et leur moment.
**Estimé / déduit :** 11 achats dont le prix est déduit des soldes (marqués « deduit » dans le CSV), durée d'essai (inclut la rampe de lancement), temps de pub.
**Inconnu :** cause de fin d'essai (carburant ou crash, non extrait), boosts, effet de A et B sur la distance, essai 6 (multiplicateur effectif ×1,30 pour une carte à ×1,2), résultat de la pub de l'essai 19, soldes des séjours 19-20, essai 21 et suivants (nouvel appareil, non analysés), multiplicateur du niveau 9 de la carte C.

## 7. Recommandations pour COLD IMPACT

Rappel : tu es un bon joueur. **Hypothèse non vérifiée :** un joueur moyen fait 1,5 à 2 fois plus d'essais pour atteindre le même état. À appliquer avec prudence : ma référence est un seul joueur sur 20 essais.

1. **COIN_K (gain par mètre) — confiance moyenne.** La référence donne 1 pièce/m ; mon jeu 1,1 × 2,4 = 2,64 pièces/m (avant multiplicateur), soit ×2,6. Avec des prix de départ 70-90, un vol de 346 m me donnerait ~913 pièces (10 achats). La référence : 348 pièces pour 100-180 de prix (2 achats). **Proposition : COIN_K ≈ 0,6 (gain ≈ 1,1 pièce/m) OU prix de départ ×3 à ×4 (≈ 270-360).** Une seule de ces deux corrections, pas les deux. À valider d'abord avec les distances réelles d'un vrai joueur (mon pilote automatique ne les donne pas).
2. **Croissance des prix — confiance moyenne.** Mes prix croissent de ×1,19 par niveau, la référence de ×1,4 (A) et ×1,65 (C), mais son revenu croît beaucoup plus vite (×85 en 20 essais : distance ×21, multiplicateur ×4). Si tu veux ~1,5-3 essais par achat, **garde 1,19 mais baisse le revenu** (item 1), ou passe à ~×1,3 en gardant un revenu fort. Ne change pas les deux dans le même sens.
3. **Multiplicateur de revenu — confiance moyenne.** La référence fait +0,1 par niveau sur 4 niveaux, puis des paliers (×2, ×2,2, ×2,4, ×2,8, ×4) : ×4 au niveau 11. Mon +25 % linéaire donne ×3,5 au niveau 11. Proche. Option : des paliers plus marqués tous les 5 niveaux (×2 au 6, ×4 au 11) pour créer des moments de saut.
4. **Durée d'un essai — confiance moyenne.** La référence va de 9 s (début) à ~70 s (fin) avec 8-20 s de hangar : ~1 essai par minute en fin de partie. Pour mon jeu : **10-15 s au début, 40-70 s au milieu**, avec un premier essai court qui donne déjà de quoi acheter 2 fois.
5. **Premier achat — confiance haute.** Le joueur atteint son premier achat après **un seul essai de 9 s** (t=15 → t=24) et achète deux cartes immédiatement. Ton « 1,5 à 3 essais » vaut pour la suite, pas pour le tout début.
6. **Pubs — confiance moyenne, en rythme seulement.** Aucune pub avant 2-3 min de jeu ; les pubs récompensées n'arrivent qu'à l'essai 15 (~11 min). Pas de pub courte plus d'une fois toutes les ~70 s.
7. **Coffre — confiance faible (une seule observation).** +540 pièces au tout premier coffre, soit ~1,5× le gain d'un essai de l'époque, puis minuteur ~3 h. Mon coffre toutes les 2 h est du même ordre. Aucun changement proposé.


---

# Niveau 2 (deuxième appareil) — 3 vidéos, ~18 essais

Sources : `222709` (37 s), `223755` (2 min 53 s), `225900` (14 min 41 s). Elles s'enchaînent (même solde de départ : 47,8K → 141 → 1 933 → 2 150). Entre la 2e et la 3e il manque ~7-8 min (minuteur du coffre : 02:29:44 → 02:22:05), donc le temps de jeu réel est plus long que la somme des vidéos. Le joueur n'a pas fini ce niveau.
Données : `epe_niveau2.csv` (18 essais), et les achats du niveau 2 ajoutés à `epe_ameliorations.csv` (lignes « appareil 2 »).

## N2-1. Tableau récapitulatif

| Élément | Valeur |
|---|---|
| Essais observés | **18** (le 18e est un rapport incomplet) |
| Temps vidéo cumulé | ~1 090 s dont ~435 s de pubs (~40 %), contre ~6 % au niveau 1 |
| Durée d'un essai | 9-13 s (essais 1-13), 19-23 s (essais 14-18) |
| Distance d'un essai | **214-224 m** (essais 1-5), 307-339 m (essais 6-13), 381-677 m (essais 14-18) |
| Pièces par mètre | toujours **1 pièce/m** |
| Multiplicateur de revenu | ×8 (carte C niv. 11) puis ×8,8 (niv. 12) |
| Gain d'un essai | 1 712 à 2 712 (essais 1-13), 3 353 à 5 957 (14-18), sans pub |
| Achats | 13 achats après le premier hangar (+13 achats d'avant, ~47K) → **~0,7 achat par essai** (niveau 1 : 2,2) |
| Pubs récompensées (×3 ou ×4) | 5 sur 18 essais (essais 4, 9, 11, 13 en ×3 ; 14 en ×4), 44 à 94 s chacune |
| Pubs sans multiplication visible | 2 (essais 1 et 3, 43 s et 30 s) ; la 1re a relancé le jeu |
| Autres pubs | 2 pubs de 35 s et 29 s au hangar avant l'essai 6 ; 1 pub courte ~3 s (essai 16) |
| Boutique de gemmes | ouverte 2 fois (t≈556 s et ≈765 s de la vidéo 3), aucun achat |
| Gemmes | solde 0 |

## N2-2. Courbe de prix (appareil 2)

Les prix sont **rebasés** au changement d'appareil : le niveau d'amélioration est conservé (carte A niv. 15, B niv. 21, C niv. 11) mais les prix repartent bas.

| Carte | Prix relevé | Formule approchée |
|---|---|---|
| A (lanceur) | niv. 15 : 634 ; 16 : 824 ; 17 : 1 071 ; 18 : 1 392 ; 19 : 1 810 ; 21 : 3 059 ; 23 : 5 170 ; 24 : 6 721 ; 25 : 8 738 | **634 × 1,30^(n−15)** (écart < 1 %) |
| B (appareil) | niv. 21 : 634 ; niv. 33 : 14 765 ; niv. 34 : 19 195 ; niv. 36 : 32,4K (affiché pour le niv. 37) | **634 × 1,30^(n−21)** (écart < 1 %) |
| C (revenu) | niv. 11 : 5 767 ; niv. 12 : 8 650 | **×1,50 par niveau** (au niveau 1 : ×1,65) |

Effet de la carte C : niveau 11 = ×8 (soit ×2 par rapport au ×4 du niveau 1), niveau 12 = ×8,8. Le pas de +10 % du multiplicateur de base réapparaît.
Mon jeu : 90 × 1,19^n (fusée), 70 × 1,19^n (lanceur), pièces ×1,45.

## N2-3. Pièces par essai et essais par achat

- Gain / prix de la carte la moins chère visible : essai 1 → 1 792 / 824 ≈ 2,2 ; essais 2-8 → 0,4 à 1,3 ; essais 9-13 → 1,5 à 3,5 (avec pub ×3 : le solde monte à 13,7K et le joueur n'achète pas tout de suite) ; essais 14-18 → 1 à 2.
- Le joueur n'achète pas systématiquement : aux essais 3, 7, 8, 9, 11, 12, 15, 17 il garde ses pièces (solde jusqu'à 13,7K). Il achète 1 à 3 cartes quand il peut payer une grosse marche (14,7K pour B à l'essai 10, 19,2K à l'essai 13).
- **Essais entre deux achats : ~1,4 essai par achat** (13 achats / 18 essais) sur ce niveau. C'est **dans ta fourchette de 1,5 à 3 essais**, contrairement au niveau 1 (0,45).
- Chaque carte seule : A a été achetée 8 fois en 18 essais (1 achat tous les ~2,3 essais), B 2 fois en dehors du premier hangar (tous les ~9 essais), C 1 fois.

## N2-4. Essais pour finir le niveau

Non observable : le niveau n'est pas fini et aucune condition de fin n'est affichée. Repère : après 18 essais, A est à 26 / 15 (+11), B à 36 / 21 (+15), C à 12 / 11 (+1).

## N2-5. Rythme des pubs (rythme seulement)

- La part de pub passe de ~6 % (niveau 1) à ~40 % du temps vidéo au niveau 2, avec la première pub dès le premier rapport.
- Une pub récompensée (« multiplier et récupérer ») dure 44 à 94 s. Elle apparaît sur 5 des 18 rapports ; le joueur refuse les autres. Le multiplicateur tiré : ×3 (4 fois), ×4 (1 fois). Les valeurs ×2 et ×1,5 n'ont pas été obtenues.
- Après un essai sans pub, le joueur enchaîne tout de suite (hangar 5-20 s). Après une pub, il revient avec 3 à 4 fois le gain d'un essai.
- Entre le hangar et l'essai suivant, 2 pubs (35 s et 29 s) n'ont aucun gain de pièces visible. Hypothèse (non vérifiée) : pub liée au bouton d'un boost.

## N2-6. Certain / estimé / inconnu

**Certain :** distances et totaux des 17 rapports complets (total = distance × mult, vérifié sur tous), 1 pièce/m, prix A/B/C (formules ×1,30 / ×1,30 / ×1,50), soldes reconstitués à ±1 pièce pour presque tous les séjours.
**Estimé :** durée d'essai (±2 s, rampe comprise), achats « déduits » (les achats entre deux soldes dont je déduis le prix), temps total de pub (les écrans de pub sont repérés par l'absence d'interface de jeu).
**Inconnu :** cause de fin d'essai, boosts, essai 18 (rapport coupé), durée réelle entre la 2e et la 3e vidéo (~7-8 min manquantes), pourquoi la carte B passe de 35 à 36 sans baisse de solde, pourquoi la distance passe de 334 m à 576 m (essai 14), contenu de 2 pubs hangar, fin de niveau.

## N2-7. Recommandations supplémentaires pour COLD IMPACT

Elles complètent le §7 du niveau 1 ; mêmes réserves (un seul joueur, bon joueur).

1. **Changement de palier : les prix repartent bas (confiance haute).** Au niveau 2 les prix sont divisés par ~30 (20K → 634 pour la carte A) alors que le multiplicateur de revenu est doublé (×4 → ×8) et que la distance repart à ~220 m. Le joueur dépense ~47K en une seule visite (12 niveaux d'un coup). Pour ton niveau 2 : **rebaser les prix** et donner un gros solde d'arrivée plutôt que de garder la courbe 1,19^n continue.
2. **Croissance de prix plus douce au niveau 2 (confiance moyenne).** ×1,30 (au lieu de ×1,40 / ×1,65 au niveau 1) pour les cartes de distance, ×1,50 pour la carte de revenu. Au lieu d'un seul 1,19, deux pentes selon le niveau.
3. **Rythme d'achat (confiance moyenne).** Niveau 2 : ~1,4 essai par achat, dans ton objectif 1,5-3 ; niveau 1 : ~0,45. Si ton économie vise 1,5-3 essais partout, elle est plus lente que le niveau 1 de la référence et proche de son niveau 2. Option : donner un rythme rapide en début (niveau 1 : 2 achats par essai) puis ralentir.
4. **Durée d'un essai (confiance moyenne).** Niveau 2 : 9-13 s puis ~20 s, soit plus court que la fin du niveau 1 (48-76 s). Le gain par seconde reste ~150-250 pièces/s, plus élevé qu'au niveau 1 (~100).
5. **Pubs (confiance moyenne, rythme seulement).** Niveau 1 : aucune avant l'essai 15 ; niveau 2 : dès l'essai 1 et ~40 % du temps. Résultat (hypothèse) : l'effet « pub x3 » est ce qui permet au joueur de payer les grosses marches (14,7K, 19,2K). Si tu proposes une pub de multiplication, garde-la **optionnelle**, courte (≤ 30 s) et jamais obligatoire.
6. **Multiplicateur de revenu (confiance moyenne).** ×1 → ×4 en 11 niveaux (niveau 1), ×8 → ×8,8 (niveau 2). Si tu fais deux paliers, doubler le multiplicateur à chaque changement de palier.

Niveau 1 : https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1 et Niveau 2 : https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1&lv=2
