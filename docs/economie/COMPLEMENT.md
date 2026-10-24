# Complément — ce qui fait varier la distance, et mécaniques utiles

Mêmes règles que le rapport principal : nombres et rythme seulement ; cartes nommées A (lanceur), B (appareil), C (revenu) ; temps en secondes vidéo ; « inconnu » quand illisible. Données : `epe_etats.csv` (22 essais niveau 1, 18 essais niveau 2).

## Correction importante sur le rapport précédent

- Ce que j'appelais « niveau 1 » est une **carte (monde) de 8 450 m environ**, et le « changement d'appareil » est en fait la **fin de niveau** : la jauge verticale du vol affiche un pourcentage (88 % à 7 434 m, 69 % à 5 829 m, 52 % à 4 374 m, 38 % à 3 188 m → 100 % ≈ 8 440-8 450 m). Après deux essais avec l'apparence rouge, l'essai 22 atteint la ligne d'arrivée et un écran « niveau terminé / récompense : doublez vos revenus » apparaît.
- Il y a donc **22 essais** pour finir le niveau 1 (pas 20) : l'essai 21 (896 m, collision vers 840 m) puis l'essai 22 (arrivée, ~8 450 m, solde 13,5K → 47,8K, soit +34,3K ≈ 8 450 m × ×4 + ~0,5K inexpliqué).
- **Le niveau 2 est une autre carte** (une pièce avec des meubles), beaucoup plus courte et pleine d'obstacles : les distances de 214 à 677 m ne sont pas comparables à celles du niveau 1. Récompense de fin de niveau : multiplicateur ×4 → ×8 (carte C inchangée au niveau 11) et **prix divisés par ~30** (634 au lieu de 20K pour la carte A au niveau 15). Les niveaux des cartes sont conservés.
- Les 18 essais du niveau 2 n'ont donc **pas** de rapport avec le « deuxième appareil » : c'est la 2e carte, avec les mêmes 3 cartes d'amélioration.

## 1. Ce qui fait varier la distance (niveau 1, 22 essais ; niveau 2, 18 essais)

### Constats (voir `epe_etats.csv`)

| Palier observé | Niveau 1 : distance | Remarque |
|---|---|---|
| B (appareil) 1 → 5 | 346-359 m (4 essais) | A passe de 1 à 2 : aucun effet visible |
| B 6 | 668 m (×1,9) | des ailes apparaissent sur l'appareil |
| B 7-8 | 863-932 m ; 1 406 m (essai 8 : A 4 → 6, B égal à 8) | A semble compter : +50 % |
| B 9-10 | 1 401 ; 1 276 m | C seul augmente à l'essai 11 : 1 428 m (+12 %, bruit) |
| B 11 | **3 077 m (×2,2)** | une barre de carburant apparaît pour la première fois |
| B 12-14 | 3 311 ; 3 530 ; 3 506 m | hélice visible en vol à B 13 (visible au hangar dès B 11) |
| B 16 | 5 839 m | |
| B 18 | **3 317 m puis 5 990 m** (même A, même B) | un arc de lancement apparaît à l'essai 17 |
| B 19-20 | 7 242 ; 7 438 m | |
| B 21 | 8 450 m (arrivée) | |

**Conclusions :**
1. **La distance dépend surtout de B, par paliers** : ×1,9 à B 6, ×2,2 à B 11 (l'arrivée de la jauge de carburant), puis une pente lente. Pour B de 1 à 5 : aucun effet mesurable.
2. **A joue un rôle secondaire mais mesurable** (essai 7 → 8 : +50 % à B égal), mais il est confondu avec le reste : le joueur achète A et B ensemble.
3. **C (revenu) ne change pas la distance** (essai 11 : +12 % au bruit près ; essais 17 → 18 : +80 % mais A et B identiques et C passe de 10 à 11).
4. **La compétence ou le geste compte beaucoup à partir de l'essai 17** : deux essais avec A 12 / B 18 (17 et 18) donnent 3 317 et 5 990 m. L'essai 17 est le premier où l'arc de lancement apparaît à l'écran ; l'essai 18 est le suivant. Hypothèse (non vérifiée par un essai contrôlé) : le joueur rate le timing la première fois.
5. **Au niveau 2** (carte salle) : 214-224 m pour A 16-21 (B 33), 307 m dès A 22 (+42 %), ~330 m jusqu'à B 34, 576 m à B 36 (+72 %), 677 m à A 25. Ensuite 545, 484, 381 m : plus A et B montent, plus la distance est **variable, et même descendante** (essais 15 → 18).

### Essais qui contredisent un modèle simple « distance = f(niveaux) »
- **Essai 17 (3 317 m) plus court que l'essai 16 (5 839 m)** alors que A et B ont augmenté (10 → 12 et 16 → 18).
- **Essais 17 et 18** : mêmes A et B, 3 317 contre 5 990 m (+80 %).
- **Niveau 2, essai 14 (576 m, +72 %)** : B passe de 35 à 36 sans baisse de solde (aucun achat en pièces visible). Le saut est le plus grand de la série, mais A reste à 23 : un palier de B à 36 est possible, un meilleur geste aussi. Inconnu.
- **Niveau 2, essais 15 → 18** : 677 → 545 → 484 → 381 m malgré A 25 → 26.
- **Niveau 1, essai 21 (896 m)** : après le déblocage de l'apparence rouge, un vol raté, suivi de l'arrivée à l'essai 22.

**À retenir pour ton jeu :** utiliser des paliers de distance (×2 environ) tous les 5-6 niveaux de la carte « appareil », et prévoir une part de variabilité due au geste du joueur (de l'ordre de ±40 % à état identique, dans cette série à partir de B 18).

## 2. Cause de fin d'essai (9 essais, 5 dernières secondes)

Observations sur 9 essais (1, 5, 10, 14, 17, 20 au niveau 1 ; 1, 10, 14 au niveau 2) :

| Essai | Fin observée | Jauge carburant | Alerte de vitesse |
|---|---|---|---|
| N1-1 (348 m) | crash au sol (explosion) | absente | « vitesse max » puis chute |
| N1-5 (668 m) | crash au sol | absente | « basse vitesse » (rouge) pendant 2-3 s avant le crash |
| N1-10 (1 276 m) | crash au sol | absente | « basse vitesse » pendant ~4 s |
| N1-14 (3 530 m) | crash au sol | barre vide | vitesse faible |
| N1-17 (3 317 m) | **collision** avec un pilier, barre à ~50 % | présente, 3 segments sur 5 | normale |
| N1-20 (7 438 m) | crash au sol, barre vide | **vide** | 49-51 km/h (faible) |
| N2-1 (224 m) | collision avec un obstacle | non visible | normale |
| N2-10 (335 m) | collision avec un obstacle | non visible | normale |
| N2-14 (576 m) | atterrissage/chute au sol | non visible | « basse vitesse » |

- **Toutes les fins sont des crashs ou des collisions** (jamais une limite de distance avant l'arrivée).
- **Avant B 11 (essai 12), pas de jauge de carburant** : l'essai se termine quand la vitesse tombe (alerte « basse vitesse » rouge) et que l'appareil tombe. À partir de l'essai 12, une **barre horizontale à 5 segments jaunes** s'affiche ; elle se vide en ~40 s (au rythme de ~4 px/s mesuré sur l'essai 17 : 162 → 78 sur 22 s, puis collision). Quand elle est vide, l'appareil perd de la vitesse puis tombe (essai 20).
- **Collisions** : décor de la carte 1 (piliers, blocs) ; carte 2 : meubles (consoles, caisses).
- **Durées** (rampe + vol) : voir `epe_niveau1.csv` ; essai 1 : 9 s ; essai 20 : 71 s.
- **Gestes** (à partir de la souris/anneau visible) : à l'essai 1, **aucun geste** pendant le vol ; dès l'essai 5, un **anneau blanc avec un point** (commande de direction par glissement) apparaît par moments (environ une image sur deux dans les vignettes) ; le joueur dirige par glissement continu. Je n'ai pas compté les gestes un par un.
- **Boost** : au niveau 2, un **bouton fusée bleu** apparaît pendant 3 à 6 s au début des vols des essais 6 à 18 (13 vols de suite). Il n'est pas visible dans les 22 essais du niveau 1 en vol. Combien de fois il est utilisé et ce qu'il change : **inconnu**. L'essai 6, premier avec ce bouton, passe de 216 à 307 m (+42 %), mais l'essai 13, qui l'a aussi, ne bouge pas (334 m).
- Vitesses affichées en km/h, lues sur des vignettes de 180 px (±10 % ; indicatives) : essai 5 : 28-56 ; essai 10 : ~25-45 ; essai 14 : 34-68 ; essai 17 : 130-150 ; essai 20 : 49-51 ; vols avec l'apparence rouge : 142-166.

## 3. Effet des cartes

- **Aucune valeur numérique** n'est affichée sur les cartes A et B. Elles montrent : le **niveau** (pastille), une rangée de **5 cases** (une case de plus à chaque achat ; la rangée se vide à chaque nouveau palier de 5 niveaux : A 1-5 puis 6-10, etc.), et le prix.
- **Carte C** : seule à afficher une valeur : ×1, ×1,1, ×1,2, ×1,3, ×1,4, ×2, ×2,2, ×2,4, ×2,8, ×4 (niveau 1), puis ×8 et ×8,8 (niveau 2).
- À chaque achat de la carte A, une mention « +pouvoir » s'affiche brièvement ; je n'ai lu aucune valeur associée.
- **Changements visuels de l'appareil** (niveau de B) : ailes à B 6 ; barre de carburant en vol à B 11 (hélice visible au hangar dès B 11) ; hélice en vol à B 13 ; arc de lancement (jauge verte/jaune/rouge à l'écran de lancement) à B 18 (essai 17) ; effet jaune « lancement parfait » vu aux essais 19-20 (B 19-20).
- Valeurs de vitesse et de distance : voir §1-2 ; elles ne sont pas affichées sur les cartes.

## 4. Première minute (niveau 1, t = 0-60 s)

- 0-12 s : écran de chargement (logo + anneau de chargement), **aucune action possible**.
- 13-15 s : hangar. Le seul texte d'aide est « appuyez pour voler ». **Aucun tutoriel**, ni main, ni flèche, ni objectif affiché. 3 cartes (A, B, C) avec les prix 180 / 180 / 100.
- t = 15-18 : lancement (l'appareil est tiré en arrière, puis relâché) : **1 appui prolongé + relâchement** avant le premier lancement.
- Temps avant la première action : ~3 s après l'apparition du hangar (15 s depuis le début de la vidéo).
- Premier vol : 9 s, **sans geste en vol**, 348 m. Rapport à t = 24-33 s : distance 348, total qui défile jusqu'à 348 (×1).
- Barre de multiplication (« multiplier et récupérer ») visible dès le premier rapport ; « suivant » ignore la pub.
- t = 42-45 : retour au hangar (348 pièces), achat de B puis C (deux touches). Deuxième vol à t = 45.
- **Ce que le joueur peut rater :** rien de bloquant (pas de timing exigé au début) ; il peut ne pas acheter ; il peut ne pas voir la barre de multiplication. Nombre d'étapes de tutoriel : **0**.

## 5. Gemmes et blocages

- **« 1 gemme » à la place du prix** : sur la carte B uniquement, à tous les niveaux relevés (2 à 36). Elle apparaît **quand les pièces ne suffisent pas** pour payer le prix en pièces (constaté sur ≥ 8 séjours : solde 6 à 467 pour un prix 240 à 2 344). Quand le solde suffit, la carte affiche le prix en pièces. Le coût en gemmes est **toujours 1**, quel que soit le niveau. Les cartes A et C n'ont jamais montré de prix en gemmes dans la vidéo.
- **Solde de gemmes : 0 pendant les 4 vidéos** ; le joueur n'a jamais payé en gemmes.
- **Comment on en gagne :** la boutique propose **1 gemme gratuite via une pub (compteur « 3/3 » : 3 par jour)** et des lots payants ; pas de gain par coffre vu.
- **Boutique (nombres, vue à t≈547-549 de la vidéo 3) :** lots de gemmes : 1 (gratuit via pub, 3/3), 5 pour 2,09 €, 10 pour 3,69 €, 30 pour 9,99 €, 100 pour 25,99 € (« meilleure valeur »), 250 pour 49,99 €. Deux offres hors gemmes : « sans publicités » 7,99 €, « pack de démarrage » (sans pub + 10 gemmes) 10,99 €.
- **Bouton « débloquer »** (icône fusée + pastille pub) : apparaît au hangar à t≈410 (niveau 1). Utilisé à t≈1128 : une pub s'affiche, puis un message « apparence débloquée » et l'appareil devient rouge. Au niveau 2, le même bouton est présent au hangar ; un bouton fusée apparaît en vol à partir de l'essai 6, après deux pubs au hangar (35 s et 29 s).
- **Coffre** : icône dans le hangar avec minuteur. Premier ouverture à t≈141-143 (niveau 1) : **+540 pièces** (≈ 0,74 gain d'un essai de l'époque). Minuteur ensuite : 02:59:58 à t≈145, puis décompte en temps réel (02:41:53 à t≈1 230) → **délai de 3 h**. Aucun deuxième coffre ouvert dans les vidéos. Au niveau 2, le minuteur affiche 02:40:59 (vidéo 2) puis 02:10:35 (fin de la vidéo 3).

## 6. Fin du niveau 1 (changement de carte)

- **Condition : atteindre la ligne d'arrivée** (≈ 8 450 m = 100 % sur la jauge verticale). Aucun coût en pièces.
- Avant : essai 20 à 7 438 m (88 %), carburant vide ; essai 21 raté (896 m, collision à ~840 m) ; essai 22 : arrivée. Solde avant l'essai 22 : 13,5K ; après : 47,8K.
- Écran « niveau terminé » avec la mention « récompense : doublez vos revenus » et un bouton « continuer » (t≈1 215-1 218).
- Ensuite : écran de choix de carte (barre « univers 1 → univers 2 », 4 silhouettes verrouillées + la liste d'apparences), puis retour au hangar.
- **Conservé :** niveaux des 3 cartes (A 15, B 21, C 11), pièces (47,8K). **Réinitialisé / changé :** prix des cartes (A 20K → 634, B 72,7K → 634, C 14,9K → 5 767), multiplicateur de revenu ×4 → ×8, distance (carte courte et à obstacles).
- **Pendant le vol :** une **jauge verticale** (avion + % + drapeau à damier) montre la progression vers l'arrivée. Pas de zones intermédiaires visibles ; des **flèches bleues de boost** apparaissent sur le trajet vers 38-52 % (t≈1 185-1 195) et ~64 %.

## 7. Pubs

**(a) Pubs courtes après « suivant »** (écran de marque, 2-3 s visibles, sans bouton lisible) : niveau 1, après les rapports des essais **1, 4, 6, 8, 10, 12, 13, 14, 20** (t = 34, 102, 186, 275, 364, 480, 546, 615, 1 130) ; intervalles 68, 84, 89, 89, 116, 66, 69 s, puis aucune entre 615 et 1 130 (pubs récompensées entre-temps). Niveau 2 : **une seule** (essai 16, ~3 s à t=803). Hypothèse : minuteur de ~60-120 s, jamais juste après une pub récompensée. Fermeture : non observée.
**(b) « Multiplier et récupérer »** : une barre à 7 zones symétriques (×1,5 | ×2 | ×3 | **×4** | ×3 | ×2 | ×1,5) avec un curseur qui oscille ; la zone centrale ×4 est la plus étroite. Résultats sur toutes les occurrences : niveau 1 : **×3** (essai 15), **×4** (16), **×2** (18), inconnu (19) ; niveau 2 : **×3** (essais 4, 9, 11, 13), **×4** (14). Soit 7 résultats lus : ×3 quatre fois, ×4 deux fois, ×2 une fois (jamais ×1,5). **Durée avant la récompense** : niveau 1 : 16-17 s (pubs de marque, pas de bouton visible) ; niveau 2 : ~40 s avant « récompense accordée », puis un bouton fermer ; durées totales 43, 44, 44, 53, 64, 94 s.
**(c) Autres offres de pub :** gemme gratuite à la boutique (3/jour) ; bouton « débloquer » (apparence) ; fusée au niveau 2 ; chaque carte porte une pastille verte « 10 » avec une icône de pub (je n'ai pas observé son effet) ; aucune offre de « revivre » vue.

## 8. Rétention (existence, place, nombres)

- **Jauge verticale de progression** (%), visible à chaque vol ; objectif 100 % ≈ 8 450 m.
- **Coffre à minuteur 3 h** (hangar, haut droite) ; premier coffre à t≈141 (~2,4 min de jeu), +540.
- **Récompense de fin de niveau** (×2 revenus) ; **carte suivante** ; **liste d'apparences** (4-5 silhouettes verrouillées).
- **Offres de pub** (gemme 3/jour ; apparence ; fusée).
- **Icônes à gauche du hangar** : boutique, « sans pub », lot de gemmes (3 icônes).
- **Barre de 5 cases** sur chaque carte (progression par palier de 5 niveaux).
- Une fenêtre de **notation** une fois (t≈410 niveau 1).
- **Non vus :** objectifs/missions, cadeau quotidien, pastille rouge de notification, notifications système. (Pas de preuve d'absence : seulement non vus dans les 4 vidéos.)

## Certain / estimé / inconnu

**Certain (lu sur images) :** vitesse max initiale, objectif ~8 450 m (pourcentages lus), « niveau terminé / doublez vos revenus », carburant apparu à l'essai 12, bouton fusée en vol niveau 2, prix de la boutique, 1 gemme sur la carte B quand les pièces manquent, durée des pubs.
**Estimé :** timing des pubs courtes, lien entre le saut de distance et les paliers de B, hypothèse d'un arc de lancement raté à l'essai 17, vitesse en km/h (±10 %).
**Inconnu :** effet exact du bouton fusée et nombre d'utilisations, nombre de gestes par essai, ce qui a fait passer B de 35 à 36 sans pièces, pourquoi la distance diminue de l'essai 15 à 18 au niveau 2, valeurs numériques cachées des cartes, usage de la pastille « 10 ».

Niveau 1 : https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1 et Niveau 2 : https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1&lv=2
