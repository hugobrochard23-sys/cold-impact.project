# Notes de la nuit (v366) - mode COURSE (?mvp=r)

Etat : A (4 niveaux) inchange ; B corrige (la fusee va vers la droite) ; **R = course contre 31 pilotes IA, manches d'elimination**.

## Mode R (`?mvp=r`)
- Une partie = 3 manches : 32 pilotes -> les 16 premiers passent ; 16 -> les 8 premiers ; finale a 8 (victoire = 1er).
- Trois courses tirees au hasard parmi 7 (PRAIRIE, VILLE jour, CANYON, RIVIERE, VILLE NEON, CHATEAU, BASE) ; graine differente a chaque manche.
- Les courses sont des scenes DEJA dans le jeu (chapitres du niveau 1 + ville de jour) ; ennemis ajoutes bien en vue.
- Le joueur influence le temps : fleches de vitesse sur la piste (turbo 1,3 s), ennemi detruit = petit turbo, echec = on repart 40 m avant avec +2,5 s.
- Pilotes IA : temps tires au hasard (loi normale), 22 % ont un accident (explosion visible). Reglage adaptatif : si le joueur est elimine en manche 1, les pilotes deviennent un peu plus lents.
- Ce ne sont PAS des joueurs en ligne : le jeu les appelle "pilotes".

## Scenes testees par robot (vol sans commande + captures)
OK : prairie, ville de jour (passage/vitrage/montee/plongee), vallee, falaise, riviere, ville (neon), approche, porte, noyau, base.
Refusees : entrepots (crash), descente (prairie vide), grotte seule (prairie vide), foret/mer/eolien/jungle (hors DA).

## Non verifie
Aucune partie jouee a la main. Calibrage des pilotes a affiner avec de vrais essais.

## v367 (suite)
- Course : fusee et rivaux plus gros, 29 skins du jeu pour les pilotes + traînée de leur couleur + pseudos a l'ecran ; marqueur du premier (fleche + ecart) ; badge "x / 16 QUALIFIES" ; compteur de morts (on fonce dans un pilote : il explose) ; pieces gagnees.
- Mort : ecran RELANCER (cercle qui se vide, pub la 1re fois, 3 gemmes ensuite) / NON MERCI ; ecran des ELIMINES apres le classement.
- Arrivee : pylones rouge/bleu, banderole a damier, anneau dore, faisceaux (remplace l'ancien mur transparent).
- Pilotes un peu plus lents que le joueur (+0,5 s en manche 1, +0,25 en 2, 0 en finale), avec erreurs, raccourcis et pouvoirs tires au hasard.
- Camera : la fusee reste toujours dans le champ (y compris au depart).
- Cours "ouvertes" (prairie, canyon, riviere, ville neon, base) : on peut sortir de la piste pour gruger, le sol tue ; CITY RUSH : 45 s (virage, chicane, montagnes russes, chute libre, vitre, plongee).
- PAS FAIT : ecrans menu (carte Coupe, roulette des maps, costumes, boutique, pouvoirs, ouverture de paquet), blocs chance + roue des pouvoirs, vrai pilotage libre (cap libre), classement reel.

## v368 (course : vrais parcours qui descendent)
- Nouveau `src/systems/evo_course.js` : trajectoire 3D continue (cap, pente, hauteur, largeur) decrite par segments `[longueur, virage, pente, hauteur, demi-largeur, hauteur des murs]`, couloir (sol bleu a tirets, murs bleu/blanc, bords jaunes) en couleurs unies, sol vert etroit dessous, silhouettes grises coupees, ciel bleu clair. 3 parcours : COULEE, SERPENT, SPIRALE (35 s, ~370 m de descente, virages permanents, chute libre, passage etroit).
- Coupe : bug corrige (`R.last` n'etait jamais renseigne => chaque partie repartait de la manche 1). 32 -> 16 -> 8 : seuls les qualifies reviennent (`R.surv`). Chaque pilote a son niveau (-2 % a +18 %), plus de peloton. Les bots se penchent dans les virages et piquent (suivent la pente).
- Camera de decollage : on voit la fusee partir du lanceur, la camera la suit de haut et de loin puis descend vers la vue de course en la gardant au centre (~3 s).
- Non fait : ecran des qualifies (32 fusees), vrai menu, blocs chance, vrais raccourcis a cap libre, passages sous le parcours (spirales sans croisement), transparence des fusees proches.
