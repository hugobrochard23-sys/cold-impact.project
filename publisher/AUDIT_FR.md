# Audit « chances d'être pris par un éditeur » (FR)

Basé sur la version v318. Ce qui est vérifié est dit « vérifié » ; le reste est une estimation et est marqué comme tel.

## Ce qu'un éditeur de jeux mobiles regarde (d'après ce qui se fait sur le marché, à confirmer auprès de chacun)

1. **La vidéo / le crochet des 3 premières secondes** : c'est avec elle qu'ils lancent le test de coût par installation. C'est le point le plus décisif.
2. **Les premières minutes de jeu** : compréhension sans explication, plaisir immédiat, pas de bug.
3. **La rétention** (le joueur revient le jour suivant) : progression visible, évolution de la fusée, objectifs.
4. **La monétisation prévue** : pubs récompensées bien placées, achats, pas de blocage frustrant.
5. **Le format technique** : beaucoup d'éditeurs de casual veulent un jeu fait avec **Unity** et leur propre SDK. Un jeu web (HTML5) peut être accepté par certains, pas par tous.

## Points forts (vérifiés)

- Deux niveaux complets, deux boss (2 et 3 coups), progression de fusée visible (4 états par niveau).
- Un « waouh » par niveau : chute de 64 m, rupture du barrage, grande explosion du boss.
- Interface en anglais complète : 777 textes parcourus dans les deux niveaux, aucun reste de français repéré (les messages du boss n'étaient pas atteints par ce parcours : ils sont vérifiés à part). J'ai corrigé 6 messages qui restaient en français (boss, barrage, arrivée).
- Pubs placées au bon endroit : récompensées au choix, intersticielle seulement entre deux parties, jamais en vol.
- Page de confidentialité présente (`politique-confidentialite.html`).
- Poids : environ 9 Mo au premier chargement, 200 requêtes.

## Risques à connaître

| Risque | Gravité | Détail |
|---|---|---|
| **Jeu web, pas Unity** | Élevée | Peut fermer des portes. À demander à l'éditeur dès le premier mail : « acceptez-vous un build HTML5 / Android wrapper ? » |
| **Temps de chargement** | Moyenne | Dans mon test sans carte graphique, 6 à 8 s avant de pouvoir jouer. Sur un vrai téléphone ce sera moins, mais **à chronométrer sur ton téléphone** : l'objectif d'un jeu hyper-casual est moins de 3 à 4 s. |
| **Pubs de démonstration** | Moyenne | Les pubs du jeu sont des exemples avec des marques inventées. Normal pour un prototype, mais le dire clairement dans le mail. |
| **Aucune donnée de rétention** | Moyenne | Pas de chiffres. Dis-le franchement, ne pas inventer. Idéal : fais jouer 5 à 10 personnes et note si elles reviennent le lendemain. |
| **Bots de test** | Faible | Mon bot de vol n'a pas pu finir le niveau seul (il s'arrête vers 2460 m dans la turbine du barrage et sur d'autres obstacles) : je ne peux donc pas prouver la faisabilité par bot. Les parties jouées par toi et ta sœur restent la référence. |
| **Performance sur téléphone d'entrée de gamme** | Moyenne | Réduite en v317 (environ 30 % d'appels de dessin en moins dans le port) mais non mesurée sur un vrai téléphone faible. |

## Ce qu'il te reste à faire (ordre conseillé)

1. **Enregistrer la vidéo** (voir `VIDEO_PLAN.md`) : sans elle, l'éditeur ne peut pas lancer son test.
2. **Faire jouer 5 à 10 personnes** sans explication, noter où elles bloquent et si elles reviennent le lendemain.
3. **Chronométrer le chargement** sur ton téléphone (de l'ouverture du lien à « TAP TO LAUNCH »).
4. **Choisir 3 à 5 éditeurs** et lire leurs consignes de soumission (format, vidéo, build).
5. **Remplir `PITCH_EN.md`** avec tes noms et liens, puis envoyer.
6. Ne rien changer au jeu entre l'envoi et la réponse, sauf bug bloquant.

## Idées pour la suite, si un éditeur te répond

- Une version Unity ou un wrapper natif selon leur demande.
- Un mini-jeu ou un événement quotidien (déjà prévu dans la feuille de route du dépôt).
- Un niveau 3, uniquement si leurs chiffres de rétention le justifient.
