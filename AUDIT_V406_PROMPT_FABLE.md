# COLD IMPACT : Rocket Race. Audit v406 et prompt pour Fable 5.2

## 1. Corrige dans la v406 (code, pas encore teste sur telephone)
- **Tap to launch qui lancait directement la fusee** : `src/input/touch.js` ligne 58 appelait `CC.EVO.start` sur tout tap hors bouton. Cela contournait `startRun`, donc la roulette et la presentation. Le tap passe maintenant par `CC.EVO.raceApi.start`.
- **Bruit de depart avant la presentation** : entre la fin de la roulette et le 3-2-1, la phase LAUNCH jouait ses sons (lancement, hydraulique, allumage, reacteur). Le bus `g.audio.sfx` est maintenant coupe de la fin de la roulette jusqu'au debut du 3-2-1 (`sfxOn` dans `raceCount`, avec filets de securite).

## 2. Non resolu : rivaux qui partent avant le joueur (manches 8 et 4)
Mesure en banc de test (manche 4) : rivaux ~10 m derriere apres 1,3 s. Le joueur le voit pourtant partir avant lui sur telephone. Pistes, a verifier par mesure et non par supposition :
1. `flightTime` (temps des rivaux dans `botAdv`) demarre avant que la fusee du joueur ait quitte la zone de decollage (`flightTime < 1.15` : phase `ease`, `w` de la camera). Le joueur decolle en courbe, les rivaux suivent la rampe `t0r`. Faire demarrer la rampe des rivaux au moment ou `P.vf` du joueur depasse 0, ou la caler sur la meme courbe.
2. Rivaux places devant sur la grille (`b.dl` negatif ou `b.rb`) : verifier les positions initiales de la grille de depart et leur distance par rapport au joueur.
3. Telephone : le tactile guide avec `I.cx/I.cy`. Si le doigt n'est pas pose, la direction part vers un bord ; un joueur qui lache l'ecran ne ralentit pas mais derive. A tester sur un vrai telephone.
4. `hitStop` / `hitScale` : verifier que `flightTime` est bien gele pendant le 3-2-1 sur un telephone lent (dt plafonne a 0,05).
Test conseille : ajouter un journal `?dbg=1` qui ecrit `t`, `P.d` et `b.d` de chaque rival toutes les 0,25 s pendant 4 s apres le GO, a lire sur telephone.

## 3. Ecran d'accueil / hangar
Recommandation : **oui**, un vrai ecran d'accueil au premier lancement. Le jeu doit arriver sur un decor (hangar ou plateforme de lancement, fusee visible, nom du jeu, bouton JOUER). Le tap sur JOUER mene a la roulette, puis a la presentation, puis a la grille. Un joueur qui arrive dans une course sans transition decroche. Point d'entree : `E.startIntro` (evo_mvp.js:505) renvoie vers l'overlay `evo`. A faire : un decor 3D leger (fusee sur son pas de tir avec ses ombres, lumiere douce) reutilisant les assets existants (aucune nouvelle texture, aucun animal, kit UI d'origine).

## 4. Points de friction et d'abandon a verifier (pour allonger le temps de jeu)
Chaque point est une hypothese issue du code et des retours, a confirmer en jouant.
- **Premieres 30 secondes** : pas de tutoriel clair, la premiere course doit etre quasi impossible a perdre (rivaux plus lents sur les 2 premieres courses, `cc.race.runs`).
- **Elimination sans explication** : l'ecran des elimines (plateformes) doit dire pourquoi (place obtenue, secondes de retard) et proposer REJOUER immediatement.
- **Boucle de reussite** : coffre en 3 courses, gemmes, boutique. Verifier que chaque course donne un gain visible (pieces qui montent, barre de coffre qui avance) meme en cas d'elimination.
- **Frustrations de pilotage** : arret net sur obstacle (`P.vf = min(P.vf, 2)`), retour en arriere (`P.d -= 1.4`), chute avec reapparition. Verifier que la penalite (1,2 a 1,5 s) est comprise : texte « +1,5 s » deja prevu, a rendre plus visible.
- **Telephone** : sensibilite tactile (deux fois plus sensible en v403), doigt qui cache la fusee, bouton pause et place sous le HUD.
- **Pubs** : seule la pub recompensee « RELANCER » est branchee dans la course ; verifier la frequence des pubs entre deux parties dans `src/ui/ads.js` et `portal.js` (jamais pendant une manche, jamais avant la premiere course).
- **Chargement** : poids du paquet (10 Mo), temps avant le premier ecran sur reseau mobile, ecran de chargement avec progression.
- **Sons** : equilibre musique/bruitages, aucune coupure (le limiteur de la v404 avait tout coupe), reacteur plus discret (v405). Aucun son n'a pu etre ecoute dans le banc de test.
- **Decors** : verifier carte par carte (arch, jungle, etc.) : dalles sombres plates, textures qui se repetent, ombres manquantes, obstacles sans collision visible, obstacles qui bloquent sans raison apparente, hublot et tours opaques.
- **Presentation de carte** : le 3e plan est une dalle sombre sur la jungle (a refaire), et la camera ne doit jamais traverser un decor.
- **Variete** : 4 manches par coupe, 31 rivaux, mais peu de cartes ; ajouter de la variete passe par de nouvelles configurations d'obstacles avec les assets existants, pas par de nouvelles textures.
- **Retention** : objectif du jour, serie de victoires, costume a debloquer visible et proche, classement local honnete (jamais de faux joueurs presentes comme reels).

## 5. Prompt a donner a Fable 5.2 (copier-coller)

> Tu travailles sur COLD IMPACT : Rocket Race (Three.js r149, depot `C:\Users\PASSECOUTRIN\Documents\GitHub\cold-impact.project`, jeu en ligne sur `https://hugobrochard23-sys.github.io/cold-impact.project/index.html?evo=1&pc=1&mvp=r&fresh=r406&r=406`). Lis d'abord `AUDIT_V406_PROMPT_FABLE.md`, la memoire du projet (`MEMORY.md` dans `C:\Users\PASSECOUTRIN\.claude\projects\C--Users-PASSECOUTRIN-Documents-GitHub-cold-impact-project\memory\`) et `HANDOFF.md`. Reponds toujours en francais. Termine chaque reponse par le lien de test ci-dessus, avec le numero de version courant.
>
> Objectif : polir le jeu et surtout allonger le temps que les joueurs y passent (Playgama Sandbox, boost de 50 parties en cours). Joue chaque seconde du jeu, sur ordinateur et en emulation telephone, et corrige ce qui frustre ou fait partir.
>
> Priorites, dans l'ordre :
> 1. **Rivaux qui partent avant le joueur** (manches 8 et 4, impératif : ils doivent partir en meme temps que le joueur). Ajoute un journal `?dbg=1`, mesure sur telephone emule et sur PC, trouve la cause reelle (voir pistes du chapitre 2), corrige et prouve par mesure.
> 2. **Ecran d'accueil** (chapitre 3) : un vrai accueil au premier lancement, puis JOUER, roulette des cartes, presentation de la carte (plans de camera, sans rien traverser, sans tremblement), grille alignee, 3-2-1-GO. Aucun bruit de depart avant le 3-2-1. Verifie que la v406 (tap direct corrige, sfx coupes) fonctionne.
> 3. **Audit complet** : parcours chaque carte, chaque ecran (accueil, roulette, presentation, course, resultat, elimines, boutique, coffre, pause), liste tout ce qui est laid, bugue, incomprehensible ou frustrant (obstacles sans collision logique, decors plats, ombres manquantes, textes coupes, boutons trop petits sur telephone), puis corrige par ordre d'impact.
> 4. **Retention** : premiere course tres accessible, explication claire des eliminations, gain visible a chaque course, objectifs courts, rejouer en un tap.
>
> Contraintes permanentes : interface uniquement avec l'ancien kit (`CC.UI2`, police Rajdhani, aucune icone dessinee en code, agencement PC aux bords) ; aucun animal ; aucun nouvel asset ni texture (reutiliser l'existant) ; chaque element au sol a une ombre visible ; ne jamais presenter de faux classements ni faire passer des rivaux IA pour de vrais joueurs ; ne pas conclure sur des chiffres Playgama non valides ; pas de sous-agents ; economiser les credits.
>
> Outils : banc de test dans `C:\Users\PASSECOUTRIN\cctest` (`node srv.js` sur le port 8135, puppeteer + SwiftShader, `CC.harness.step`). A chaque bloc : numeroter la version (`version.json`), committer et pousser, reconstruire le zip avec `MVP=r node tools/portal_build.js playgama` (donne `dist\COLD_IMPACT_playgama_mvpr.zip`). Les messages de commit finissent par la ligne d'attribution de l'environnement. Note ce qui n'est pas verifie (son, telephone reel) plutot que de l'affirmer.
