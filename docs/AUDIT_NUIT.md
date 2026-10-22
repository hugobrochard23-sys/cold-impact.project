# Audit de la nuit (v225) — mesures sur PC en rendu logiciel, pas sur telephone

## 1. Performance (niveau 1, tous les 300 m, vue normale)
- Appels de dessin : 75 a 277 (max a 4900 m, la porte/forteresse). Triangles : 28 000 a 188 000 (max a 1300 m, la prairie : herbe + arbres).
- Niveau 2 (3200 premiers metres) : 92 a 277 appels (max au depart), 48 000 a 67 000 triangles.
- Programmes de shaders constants (47-50) : plus de compilation en vol. Lumieres : 5.
- Zone la plus lourde : prairie 1000-1700 m. Pistes si ca rame encore : herbe plus courte (reach 185 m -> 150 m), arbres lointains retires dans le brouillard.

## 2. Balayage visuel (niveau 1, 76 points, tous les 100 m)
- Detection automatique de « trous » (ciel visible dans le bas de l'image) : aucun vrai trou sur la ligne de vol.
- Faux positifs : 800-1000 m (riviere, eau bleue), 4100 m (ciel violet de la ville).
- Pas de balayage par captures du niveau 2 (non fait).

## 3. Collisions
- 3 890 boites visibles sans collision relevees (niveau 1, tronçons 1 a ~40). Corrige : tout volume visible dont les 3 dimensions sont >= 0,8 m recoit une collision
  (caisses, tuyaux au sol, tours, couronnements, cylindres >= 0,8 m de rayon), sauf lumieres, vitres, eau et fils. Reste sans collision : poteaux fins (< 0,5 m), barrieres
  levees (volontairement franchissables), lumieres, vitres, bandes au sol plates (deja couvertes depuis v213).
- Verification : autopilote sur 9000 images sans bouclier : 0 crash avant et apres (distance 15 062 m dans les deux cas).
- Niveau 2 : 176 boites visibles sans collision, toutes des lumieres ou petites pieces.

## A faire (non fait)
- Balayage visuel par captures du niveau 2 et des zones de nuit.
- Ecrans boutique / rapport de fin au meme style que le menu (images de reference attendues).
- Barriere du poste de controle : volontairement non collisionnelle (« on passe dessus ou dessous »).
