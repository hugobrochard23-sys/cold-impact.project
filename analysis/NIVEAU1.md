# Niveau 1 « le mur du boss » (v118, branche `niveau1-boss-ville`)

Plan B de la discussion du 15/10/2026 : un premier niveau dur mais juste, spectaculaire, qui fait mourir plusieurs fois (même un joueur expérimenté) et
donne à chaque mort une amélioration **lisible**. Code : `src/systems/l1.js` (logique), `Home.drawL1Death` dans `src/ui/home.js` (écran de mort),
crochets dans `game.js`, `targets.js`, `levelmode.js`, `hud_simple.js`, `menu.js`, `ads.js`.

## Parcours (≈ 45 s jusqu'au boss, puis le boss)
`levelmode.js` : `1: { len: 2000, scenes: ['boulevard','vitrage','toits','enfilade','city1'] }` (zone ville, ambiance `goldenHour`).
- boulevard : avenue, premières cibles ; vitrage : immeuble à traverser, **5 vitres** d'affilée (une seule paire ailleurs) ; toits : on survole un quartier bas ;
- enfilade : cinq façades percées ; **city1** : la séquence d'origine (rue, tunnel, bâtiment à vitres, montée à 266 m, **chute libre dans le puits** aux câbles, couloir bas) ;
- arène : mur de briques qui s'effondre, gunship géant (6 PV). `L1.patchDef` règle le reste (pas de victoire d'entraînement, pas de mini-boss).
La longueur doit rester `≥ fin de city1 + 80` (probe : city1 = 1027-1917 pour la graine 7131) ; city1 est une scène à longueur fixe qui ne tient que dans la zone 0 (2000 m).

## Boss (3 phases, selon les PV restants)
1. PV 6-5 : tirs guidés (visée normale, cadence 3 s) ; 2. PV 4-3 : **éventail de 3 missiles** ; 3. PV 2-1 : alternance missile guidé / **MUR DE MISSILES**
(alarme + message « MUR ! », 0,75 s plus tard : 9 colonnes × 2 rangées en ligne droite, deux colonnes libres loin du centre).
Au niveau 1 les missiles ne « frôlent » plus la fusée (le plancher de ratage de 13 m des niveaux 2-9 ne s'applique pas ici).

## Améliorations (écran de mort, 3 cartes en bas, un toucher = achat)
| Carte | Effet | Niveaux | Coûts |
|---|---|---|---|
| EXPLOSION | souffle de 8+5·n m (tout ce qui est proche explose, anneau blanc visible) ; boss −1/−1/−2/−2/−3/−3 PV par coup | 5 | 40, 80, 140, 230, 360 |
| BOUCLIER | n bulles (arrêtent un missile chacune), visibles en haut à gauche | 3 | 50, 110, 210 |
| RALENTI | 1 puis 2 charges de 1,1 à 1,9 s à ~35 % : se déclenche seul quand un missile est à < 30 m ou qu'un mur solide est à 0,33 s | 4 | 60, 120, 210, 340 |
Pièces d'une partie : % du niveau + 5/cible + 14/coup au boss (+150 victoire, +40 au tout premier essai). Bouton « PIECES X2 » = publicité récompensée (publicités d'EXEMPLE
du jeu, pas de vraie régie). La carte CONSEILLEE répond à la cause de la mort (missile → bouclier, mur → ralenti, boss → explosion).

## Tester vite
`?l1coins=500` (pièces), `?l1up=533` (niveaux EXPLOSION/BOUCLIER/RALENTI), banc de test : ajouter `&l1=1` à `?test=1&endless=1&level=1` pour activer le niveau 1 complet.
Sauvegarde : `save.l1 = { coins, deaths, wins, best, up:{boom,shield,slow} }`. Réglages à ajuster après essais : `UP` et coûts dans `l1.js`, cadences / angles / espacement du mur dans `L1.bossFire`,
`difK`, `ease`, `dens` dans `L1.patchDef`, plafond de vitesse `autoCap` (44 au niveau 1) dans `game.js`.

## Limites connues
- Pas testé à la main sur téléphone : seulement banc headless (pilote automatique blindé pour parcourir tout le niveau, vols « téléportés » pour le boss, parcours tactile de l'écran de mort).
- Le pilote automatique ne sait pas monter de 25 m en 50 m (transition vitrage → toits) : un joueur le peut ; le crash du banc à 523 m n'est pas un défaut du niveau.
- Après la victoire, « SUIVANT » mène au niveau 2 (ancien tutoriel) ; le niveau 1 se rejoue depuis NIVEAUX.
- Texte en police pixel majuscules sans accent ; les cartes sont lisibles surtout à partir d'un téléphone réel (DPR ≥ 2).
