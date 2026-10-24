Tu es une nouvelle session Claude Code. Mission : EXTRAIRE LES CHIFFRES D'ECONOMIE ET DE RYTHME d'un jeu mobile de reference (Epic Plane Evolution, editeur Voodoo, d'apres l'App Store) a partir de MES ENREGISTREMENTS D'ECRAN, pour calibrer l'economie de mon propre jeu COLD IMPACT. Tu ne modifies AUCUN code du jeu dans cette session (lecture seule du depot ; tu ecris uniquement dans docs/economie/).

CONTEXTE (a lire d'abord, rapidement)
- Mon jeu : C:\Users\PASSECOUTRIN\Documents\GitHub\cold-impact.project (mode "evolution", niveaux 1 et 2). Lis HANDOFF.md, puis dans src/systems/evo.js les lignes d'economie : EVO.cost (fusee : 90*1.19^n puis *1.09 au-dela de 19 ; lanceur : 70*1.19^n puis *1.09 au-dela de 14 ; pieces : 150,250,420,700,1100 puis 1100*1.45^(n-4)), EVO.mult (+25 % par niveau de PIECES), COIN_K=2.4, gain de distance = distance*1.1*multiplicateur*2.4 + valeur des cibles, coffre toutes les 2 h, 3 gemmes gratuites par jour.
- Mon economie n'est PAS mesuree avec un vrai joueur (mon pilote automatique crashe en 23-92 m). Je veux donc une base de comparaison reelle.
- Je suis un BON JOUEUR : mes nombres d'essais sont probablement plus bas que ceux d'un joueur moyen. Tu dois le signaler et proposer un facteur de correction (hypothese, a marquer comme telle).

CE QUE JE TE DONNE
- Un dossier de videos (chemin que je te donnerai) : une video COMPLETE du niveau 1, une video COMPLETE du niveau 2 (ou plusieurs segments numerotes). Si je t'ai laisse des notes (nom des fichiers, moments de changement de niveau, achats faits), utilise-les.

REGLES DE COUT (tres important : je suis sur le plan Pro, credit limite)
1. Au demarrage, appelle get_usage (mcp__ccd_session_mgmt__get_usage, deferred : charge-le avec ToolSearch) et note le pourcentage 5 h / hebdomadaire. Rappelle-le a la fin de chaque phase. Si la fenetre de contexte depasse 60 %, arrete-toi, ecris l'etat dans docs/economie/ETAT.md et dis-moi de demarrer une nouvelle session.
2. Tu NE "regardes" jamais une video image par image. Utilise ffmpeg (deja installe : cherche-le dans node_modules/@ffmpeg-installer/*/ffmpeg.exe du depot, ou dans C:\Users\PASSECOUTRIN\cctest\node_modules) :
   a. Metadonnees (duree, fps, resolution) avec ffprobe, sans lire d'image.
   b. PASSE 1 (reperage) : une image toutes les 15 s, reduite (environ 320 px de large), assemblee en PLANCHES CONTACT de 5x4 vignettes (filtres tile / montage), 1 image lue = 20 instants. Etiquette chaque vignette avec son temps. Lis les planches pour reperer : ecrans de bilan/resultats, boutique/ameliorations, debut/fin d'essai, pubs, coffres, changements de niveau.
   c. PASSE 2 (lecture des chiffres) : extrais en PLEINE resolution uniquement les images utiles (ecran de bilan, ecran d'amelioration, debut de vol), jamais plus d'environ 4 images par essai. Pour lire des chiffres, tu peux decouper (crop) la zone utile pour reduire le cout.
   d. Utilise la detection de changement de scene de ffmpeg (select='gt(scene,0.3)') pour trouver les ecrans de bilan plutot que de balayer a l'aveugle.
   e. Si un OCR local existe (tesseract) tu peux l'utiliser ; sinon ne l'installe pas sans me demander.
3. Reste sur un budget : phase 1 (reperage) puis ARRETE-TOI et montre-moi le plan et le nombre d'images pleine resolution que tu comptes lire, avec une estimation de cout, AVANT de lancer la phase 2. J'accepte ou je reduis.
4. Travaille niveau 1 d'abord, termine, ecris les fichiers, puis niveau 2 seulement si je te le confirme.

CE QU'IL FAUT RELEVER (pour chaque essai ; "inconnu" si illisible, jamais d'invention)
- numero d'essai, temps video, duree de l'essai ;
- distance / progression atteinte (en % ou en metres selon l'affichage), cause de fin (carburant, crash, objectif atteint) ;
- pieces gagnees pendant l'essai et total apres bilan ; pieces gagnees par pub / par multiplicateur / bonus ;
- boosts utilises (nombre, duree si visible), carburant ou energie affiches ;
- amelioration achetee apres l'essai : nom, niveau avant/apres, PRIX, effet visible (vitesse, distance, revenu) ;
- pubs : combien, a quel moment (apres l'essai ? pour doubler ? pour revivre ?) ;
- coffres, cadeaux, gemmes, objectifs, monnaies secondaires ;
- premiere minute du jeu (tutoriel, premier objectif, temps avant la premiere action) ;
- nombre total d'essais pour finir le niveau, et pour chaque amelioration le nombre d'essais entre deux achats.
Note aussi les mecaniques de rythme utiles : duree d'un essai, delai entre deux essais, ce qui fait revenir le joueur.

LIVRABLES (dans docs/economie/)
- epe_niveau1.csv (et epe_niveau2.csv) : une ligne par essai, colonnes ci-dessus.
- epe_ameliorations.csv : amelioration, niveau, prix, effet, essai ou elle est achetee.
- RAPPORT.md : (1) tableau recapitulatif, (2) courbe de prix (formule approchee, avec la formule de mon jeu a cote), (3) pieces par essai et "essais pour acheter la prochaine amelioration" compares aux 1,5 a 3 essais que je vise, (4) nombre d'essais pour finir chaque niveau, (5) rythme des pubs (a ne regarder qu'en tant que rythme, sans copier une technique trompeuse), (6) ce qui est certain, ce qui est estime, ce qui est inconnu, (7) recommandations chiffrees pour mon jeu (changer COIN_K, la base de prix, la croissance, la duree d'un essai...) avec le niveau de confiance de chacune, en tenant compte que je suis un bon joueur.
- ETAT.md : ce qui est fait, ce qui reste, cout consomme (get_usage).

REGLES
- Copie uniquement des NOMBRES et un enchainement de rythme. Jamais d'images, de noms d'ameliorations, de textes ni d'effets visuels du jeu de reference.
- Rien d'invente : tout chiffre vient d'une image que tu as lue (indique le temps video), sinon "inconnu".
- Si une information te bloque, pose-moi UNE question precise ; sinon indique ton hypothese et avance.
- Termine chaque message par ces deux liens : Niveau 1 : https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1 et Niveau 2 : https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1&lv=2
- Reponds en francais.
