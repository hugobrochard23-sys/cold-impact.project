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
