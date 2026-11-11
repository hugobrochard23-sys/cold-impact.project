# HANDOFF — MVP COURSE « ARCHIPEL » (a lire en premier dans la nouvelle session)

Projet COLD IMPACT (Three.js r149, fusees). Repondre en francais. Terminer chaque reponse par le lien de test. L'utilisateur teste a la main sur telephone : pas de planches de captures sauf pour valider une map.
Etat : v369 poussee sur `main` (course `?evo=1&pc=1&mvp=r`). Controles, Coupe 32>16>8, menu, ecrans de fin, blocs chance, costumes : VALIDES, on n'y touche pas.

## But
Finir le MVP de la course avant la fin du quota hebdomadaire, pret a tester ET a poster sur Playgama (l'utilisateur depose lui-meme les zips). Le plus important : UNE MAP propre.

## Concept valide : « course aerienne a portes » dans un ARCHIPEL DE CIEL
- Fini le couloir a murs (on ne voyait rien autour). Pas de murs, pas de sol de piste en degrade, pas de nuages (l'utilisateur ne veut pas de nuages en bas).
- Une seule map « Archipel » : 5 iles tres differentes, chacune = un lieu valide du niveau 1 (camp et hangars, entree de la mine, gare et train, ville, tour). Fin : grande prairie sous l'arrivee. 3 variantes de parcours (ordre, portes, raccourci) pour que les 3 manches de la Coupe different. Pas d'autres maps avant les retours.
- Les iles sont COHERENTES : de la roche visible dessous (vraie impression de terre qui flotte, pas un disque), rochers, falaises. Iles tres en contrebas les unes des autres.
- Entre les iles : espace LIBRE pour doubler les rivaux (portes/anneaux, chevrons, ballons comme repere, pas de murs).
- Quitter le chemin principal = on TOMBE : la fusee pique, prend de la vitesse, devient dure a diriger ; si on vise bien et qu'on revient dans la zone, le controle revient progressivement (pas instantane) ; si on rate une ile, on touche le SOL = mort (revive existant). Sol du bas : PRAIRIE (pas de nuages).
- Obstacles = mobiles et ACCROCHES a une structure coherente (marteau pendulaire sur un portique, helice sur un pylone, portes coulissantes dans un batiment, plateforme tournante sur un mat). Jamais dans le vide, jamais un gros rectangle fixe ni une porte qui retrecit. 4 types max : marteau pendulaire, barre/helice tournante, portes coulissantes en rythme, anneau/plateforme tournante. Plus un SAUT d'ile en ile (vide a franchir avec tremplin/turbo et atterrissage vise).
- Ennemis : on les garde, ils sont a TOI (les rivaux sont simules, ils ne les cassent pas). Detruire = turbo. Les bots recoivent des turbos aleatoires avec petite explosion visible. (Plus tard en vrai multi : une copie par joueur.)
- DA : on garde tous les modeles 3D/assets valides, AUCUNE nouvelle texture. Habillage UI : palette violet / bleu / jaune, coins arrondis ; les cartes de resultat sont encore dans l'ancien style (a unifier en dernier, moins important).

## Plan (dans l'ordre, s'arreter apres chaque etape pour que l'utilisateur teste)
0. Prototype UNE SEULE ILE (camp/hangars) complete : relief rocheux dessous, un obstacle mobile accroche, la chute + reprise de controle, le sol prairie. Valider avec l'utilisateur (captures).
1. Dupliquer en map Archipel a 5 iles + liaisons libres + saut.
2. Ennemis personnels + turbo ; 3 variantes de parcours.
3. Nettoyage perf mobile, paquet Playgama (`MVP=r node tools/portal_build.js playgama`), textes de la page du jeu.

## Etat technique (fichiers)
- `src/systems/evo_mvp.js` : course (R = coupe, W = monde de la manche, bots, drive lateral par rapport a la piste, mvpCam camera + camera de decollage, freeFly = raccourci guide, blocs chance + roue, ecran des qualifies 3D, paquet, HUD).
- `src/systems/evo_course.js` : `E.mkCourse(segs)` (trajectoire : cap, pente, hauteur, largeur), `E.courseExtras` (obstacles, blocs, raccourcis auto), `E.buildCorridor` (a REMPLACER : murs/sol), `E.buildCourseProps`, scenes `crs0..9`, et surtout les patchs qui coupent les gris.
- `src/systems/evo_menu.js` : vrai menu (5 onglets). Ne pas toucher.
- `src/systems/camera.js` : hook `E.mvpCam`. `src/world/endless.js` : `Track` (at(d,lx,y), base, theta, rel, vol, project).
- Reutiliser pour les obstacles : `CC.Life.sweeper` (src/world/life.js, modes swing/orbit/vertical, collision incluse), `CC.Trees` (conifer/broadleaf/rock), `CC.Models.guideArrow`, `Z.evoFoe` (ennemis), ballons `skyBalloons` (zones_evo.js).

## Pieges deja rencontres (ne pas les refaire)
- Gris partout venait de : `skyCliffs` dans `campagne.dress` (falaises de 1000 m), `Pieces.far`, `Scenery.side`, `Zones.backdrop`, anneau d'horizon (`E.noHorizon`), sol large qui se replie dans les virages (utiliser `gw` etroit). Tous coupes quand `E.course` est actif. Il reste une zone olive en haut a droite sur une capture telephone : cause NON identifiee (sol/brouillard ?). Diagnostic efficace : masquer les meshes de la scene un par un, ou raycaster (`diag*.js`).
- Le moteur borne la fusee d'apres `run.dist` (sol = base(run.dist)) : en vol libre il faut mettre `run.dist` a jour (voir freeFly).
- `world.sweep` est neutralise en mode parcours (les decors du sol ne bloquent pas) : a revoir si les iles doivent avoir des collisions.
- Les scenes de zone supposent un sol continu ; elles ont des ennemis/hangars en dur. Preferer des scenes a nous (comme `crs*`) et poser les modeles du jeu a la main.
- Windows/PowerShell : les heredocs python longs echouent ; ecrire le patch dans un fichier (outil Write) puis `python3 fichier.py`.

## Banc de test (dans `C:\Users\PASSECOUTRIN\cctest`)
- Serveur : `node srv.js` (port 8135, racine du depot). Chrome headless puppeteer-core, viewport 640x360, `CC.harness.step(2)`, clic START via `CC.game.ui.buttons[0]`, bouclier `rk.shieldT = 99` pour qu'un robot vole sans mourir.
- Scripts : `crs1.js` / `crs2.js` (vol d'un parcours + captures), `crs_sim.js` + `shapes.js` (simulation des formes sans navigateur), `diag*.js` (masquage/raycast), `lu1.js` (ecran des qualifies/paquet), `menu1.js`, `cup1.js` (logique de Coupe), `sheet.py` (planche PIL).
- Sortie courte : ne lancer qu'un test cible a la fois (les images coutent cher en forfait).

## Livraison
`node tools/stamp.js` ; `git add -A src tools assets version.json index.html NOTES_NUIT.md` ; commit avec `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` ; push ; zips `MVP=r node tools/portal_build.js playgama` -> `dist/COLD_IMPACT_playgama_mvpr.zip`. Un seul commit et un seul jeu de zips par etape validee. Jamais d'envoi aux portails sans l'utilisateur. Chiffres Playgama non valides = pas de conclusion.

## Regles de budget (forfait hebdo deja a ~46 %)
Sonnet 5.5 effort MOYEN (faible pour les retouches mecaniques, eleve seulement pour une decision de conception). Pas de sous-agents. Pas de relecture de gros fichiers entiers : Grep puis Read d'une plage. Pas de planches de captures a chaque reglage. Decisions groupees.

## Mise a jour v370 (ile 1 refaite, controles)
- `src/systems/evo_isle.js` : l'ile = le sol du jeu (herbe, arbres, rochers du jeu) avec `T.base` = hauteur du sol de l'ile (marches via la pente), piste a 11 m au-dessus ; contour via `sceneDef.gwF` (zones_evo.js, `evoGroundMesh`) ; dessous en roche (`bodyMesh`), prairie loin dessous (`prairie`), poteaux et arche « COLD IMPACT CUP » ; ruisseaux, chemin de terre. Depart SUR l'ile (hangar a cote). Zero obstacle pour l'instant.
- Controles : le plancher de la zone de vol etait trop haut (impossible de descendre) ; camera `kf` remise a 0,5 ; `evo.js` ne force plus le sol a `base+0.32` sur l'ile (sinon on glisse au lieu de tomber). Test chiffre : `cctest/ctl2.js`.
- La Coupe se court sur ARCHIPEL (3 manches). Les anciens couloirs restent via `?racec=COULEE`.
- A faire ensuite : obstacles (moulin a vent en pierre, tronc pendule, marteau, porte de grange coulissante, rocher/tonneau qui roule, barriere a bascule), autres iles, saut entre iles.

## Mise a jour v372 (obstacles de l'ile 1)
- `evo_isle.js` : `obstacles()` = 6 obstacles mobiles, chacun accroche a une structure : marteau (portique pierre, d=245), moulin a vent en pierre (385), tronc pendule (chevalet bois, 520), porte de grange coulissante ouverte ~70 % du temps (700), barriere a bascule (860), rochers et tonneaux qui roulent dans un couloir de pierre (965-1085). Collisions en repere de la structure (`hits`), animations dans `update(t)` appelees par `isleStep`.
- A faire : regler la difficulte apres les retours, puis les iles suivantes (jungle...), le saut entre iles et la reprise de controle en chute.
- v373 : 3 variantes de l'ile pour la Coupe (ARCHIPEL 1/2/3 : sens des virages miroir et ordre des obstacles different, `I.variant` dans `obstacles()`). Tests : `racec=ARCHIPEL1|ARCHIPEL2|ARCHIPEL3`.

## Mise a jour v374 (ile 1 refaite en 9 sections)
- `evo_isle.js` reecrit : `SEC` = 9 sections (depart, marteaux, pont etroit, canons, voies separees, section inclinee, remontee, herses, arrivee) avec largeur variable (`W(d)`), couleur de sol, inclinaison laterale (`bankF` dans zones_evo.js), pente forte (jusqu'a 0,26) et une remontee. Sol = couleurs unies (plus d'herbe ni d'arbres ni de pierres), marquages (`decals`), rambardes en piles de disques gonfles (`rails`, InstancedMesh), muret central, coussins de depart. Obstacles REPETES en rangee : marteaux x3 + x2, barres tournantes, 6 canons (rocher + marqueur rouge), marteaux + herses cote a cote, moulins x3, troncs x5, herses x5 (ne descendent jamais sur la fusee qui approche).
- Brume reculee a 230/520 m et `viewDist` 480 sur l'ile ; camera plus haute (+4,6) et regard a 66 m. Les rivaux se repartissent sur toute la largeur.
- Le sol du depart (d<0) prend aussi les couleurs de l'ile (`evoGroundMesh` : sd0 de repli = crsI0).
- A mesurer : difficulte des obstacles, poids sur telephone (viewDist 480), section inclinee et canons (vus seulement de loin).
- v375 : vitesse de course 46 -> 36 m/s (turbo +7), barres tournantes plus petites et plus lentes, hangar rouge retire. Analyse chiffree `cctest/ana1.js <vitesse>` : chaque obstacle a au moins un chemin toujours sans danger (mais souvent en bordure : peu de defi). A decider : DA (terrain d'essai de fusees / jouet / mixte).
- v376 (lisibilite) : grille de depart (5 colonnes, joueur a l'arriere, plus rapides devant, `b.d0`/`b.gx`), au plus 5 rivaux a l'ecran apres 3,6 s, 2 pseudos, contact = rebond (pas de mort), camera 6,5 m derriere / 2,4 m, reticule a 40 m, HUD allege (plus de boite QUALIFIES, crane seulement si kills), effet de sol « RASANT » (+3 m/s a moins de 3,6 m du sol). Prochaine etape : terrain d'essai de fusees (voir plan : 6 sections, materiaux du jeu, ennemis a soi, murs a percer).
- v377 : CONTROLE LIBRE sur l'ile (`driveFree`, `W.fc`) : le curseur oriente la fusee (rayon camera, 2,3 rad/s max), vitesse constante, plancher/plafond doux, pas de demi-tour ; camera dans l'axe de la fusee, toujours centree ; fusees plus larges (scale 5,2/5,2/3,6), rivaux opaques avec la meme flamme/fumee (exhaustCore/exhaustSmoke), rampes pour tous les pilotes, pousser un rival (rebond lateral des deux), un obstacle ne tue plus (-1,5 s, ralentissement, bouclier 1,3 s), plus d'animation d'alignement/explosion : CONTINUER ramene a l'accueil, effets de vitesse du turbo (lignes radiales, camera qui recule, fov). Test auto : `?ap=1` = pilote automatique (cctest/crs4.js). L'ancienne ile (ARCHIPEL 1/2/3) reste selectionnable ; le terrain d'essai de fusees reste a faire.
- v378 : sensibilite souris 2,3 -> 1,7 rad/s (zone douce 0,18) ; contact entre fusees = boite de la taille des fusees (long. 3,2 / larg. 1,5), deplacement PROGRESSIF (pushT/kickT lisses) ; hitbox des obstacles reduite (RR 0,95, marteau 2,7, barres 2,5, rocher 3,3) ; IA adaptative : progression integree (`botAdv`), les 3 pilotes les plus proches du joueur sont rapproches (+-12 %), arrivee d'apres la vraie position (`settleBots`), 5 rivaux proches max avec fondu et hysteresis (plus de disparition brutale). Decision utilisateur : le style « bonbon » de l'ile convient ; le terrain d'essai de fusees = DEUXIEME carte (a faire plus tard).
- v379 : 2e CARTE « TERRAIN D'ESSAI » (`map: 'range'`, `SEC_RANGE`, `rangeScene`, `?racec=TERRAINDESSAI`) : lancement (asphalte, bandes jaune/noir, piles de pneus), champ de tir (5 chars, 3 helicos, 2 camions DU JEU = cibles a toi, turbo ; sacs de sable ; barre tournante + 4 canons animes), falaise (hangar kaki a traverser avec ponts roulants + marteaux/troncs), citadelle (herses dans un mur de briques + tours). Les parties alternent archipel / terrain d'essai. Corrections : on garde les commandes hors de l'ile (plus de chute vrillee), toucher l'eau ou la roche = retour sur la piste (+2,5 s) au lieu de la mort ; tout est solide (poteaux, drapeaux, rambardes, muret, hangar, tours : `I.boxes`, penalite 1,5 s) ; horloge des obstacles separee (`W.clock`) : les penalites ne font plus « rebouger » les portes ; contact entre fusees : le rival est ralenti en douceur (`b.slow`) au lieu de reculer d'un coup ; canons avec recul, flamme, fumee, rocher parti de la bouche.

## v380
- Collisions physiques (poussee/glissement/rebond sur boites solides, plus de passage a travers), tout solide (arche, portiques, citadelle, canons, moulin, hangar).
- Lisibilite : 1 obstacle par zone, panneaux jaune/noir 80 m avant, fleches vertes retirees.
- Beaute : boites arrondies, cordes torsadees, joints incrustes, ombres douces, eau texturee.
- Terrain d'essai allonge (~50 s, 8 sections, montees/descentes/devers).
- 4 skins : requin, pirate, malicieuse, casquette (models.js : s/mir/seg).
- Non verifie : rendu des 4 skins en menu, ressenti des collisions (autopilote bloque sur portes, normal).

## v381 (retours de test v380)
- Collisions : on est retenu et ralenti (plus de deviation de cap ni de rebond), camera sans secousse, plus de demi-tour interdit hors de l'ile.
- Qualifies : encadre "x / 16" visible aussi sur les iles ; si toutes les places sont prises avant ton arrivee -> manche perdue (R.last.late).
- Arrivee : ligne a damier au sol + grande boite (tunnel) a la fin de chaque carte ; plus de citadelle ; les rivaux entrent dans la boite et disparaissent.
- Bots : hesitations aleatoires (b.hz/b.slow) ; rayon fusee 0.8 (plus permissif).
- Obstacles par carte : ARCHIPEL = marteaux (tete ronde), balayeurs, ballons, moulins, troncs ; TERRAIN D'ESSAI = herses militaires, canons (boulet de fonte, trajectoire haute, se brise en eclats), mines flottantes, conteneurs suspendus ; JUNGLE (nouvelle) = lianes-pendules, rondins rouleurs, rideaux de lianes, totems. Manche 1 archipel, manche 2 terrain d'essai, manche 3 jungle.
- Mer et ciel plus clairs ; poteaux de panneaux jaunes ; menu course : piste d'asphalte (plus de hangar) + fusees alignees.

## v382-v385 (4 etapes d'un coup, apres retours v381)
- IA : tous au meme depart (6 colonnes, rangs de 5 m), meme vitesse (0.985 x), seuls les obstacles touches (arrets calcules a l'avance, `b.ev`, `b.T0`) les separent ; plus d'elastique ; `R.ease` regle la frequence des erreurs. Calibrage : `cctest/bots1.js`.
- Controles : souris RELATIVE (ancre qui rattrape le curseur en 0,5 s, zone morte) ; une fleche coupe la souris (reprise seulement si mouvement franc) ; aide au depart ; boost espace/clic (W.en, barre sous la fusee, +9 m/s).
- HUD : bandeaux rose (gauche) / sombre (droite, QUALIFIES x/16), pseudos realistes qui apparaissent a chaque qualifie (W.feed), fleche sur le joueur, plus de barre de progression, rivaux tous visibles.
- Vitesse : isle speed 38, FOV +7 % (+12 % boost), traits de vitesse permanents.
- Ombres : `autoShadow`/`dynSh` (evo_isle) : une direction de lumiere (E.isleLS), une enveloppe par objet ; PAS de pochoir (le pochoir faisait tout disparaitre) -> recouvrements legerement plus sombres.
- Mur invisible (W+34 lateral, +75 hauteur) avec onde ; mer/ciel plus clairs.
- Cartes ~2400-2700 m (1 min 10), sections `vide` (W=0) entre iles, panneaux generes par les obstacles (`signs`), decor aerien (`skyDecor` : montgolfieres, dirigeables, ilots), arrivee : banderole ARRIVEE, pylones, fanions.
- A faire / non verifie : UI (palette unique, police), menu, calibrage reel de la difficulte, reflets.
