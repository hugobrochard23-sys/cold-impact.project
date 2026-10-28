/* Qualité graphique (v030, mobile) : trois niveaux + AUTO.
 *  - HIGH (ordinateur) : rendu d'origine (1,5 pixel par point, ombres 2048, anticrénelage 4×, halo lumineux) ;
 *  - MEDIUM (téléphone) : 1 pixel par point, ombres 1024, sans anticrénelage (inutile avec le style pixelisé) ;
 *  - LOW : 0,75 pixel par point, sans ombres ni halo, 55 % des particules.
 * AUTO (réglage par défaut) : part de HIGH sur ordinateur, MEDIUM sur écran tactile, et descend d'un niveau quand le jeu
 * passe sous `autoDownFps` pendant `autoWindow` s de vol (jamais de remontée automatique : pas d'oscillation).
 * Le banc de test (?test=1) garde son rendu fixe, pour des mesures reproductibles. Réglages : CC.CONFIG.quality. */
(function () {
  const ORDER = ['low', 'medium', 'high'];

  class Quality {
    constructor(game) {
      this.game = game; this.cfg = CC.CONFIG.quality;
      this.tier = null; this.acc = 0; this.frames = 0;
      this.scale = 1; this.dAcc = 0; this.dFrames = 0; this.good = 0;   // v189 : echelle de resolution dynamique (1 = pleine)
    }

    // niveau de départ : réglage du joueur, sinon selon l'appareil
    initial() {
      return 'high';   // v195 : une seule qualite, toujours HAUTE : plus de reglage, plus de baisse automatique   // v094 : graphismes élevés dès le départ (la qualité adaptative baisse toute seule si ça rame)
    }

    apply(tier) {
      const g = this.game, T = this.cfg.tiers[tier];
      if (!T || tier === this.tier) return;
      this.tier = tier;
      CC.CONFIG.render.maxPixelRatio = T.pixelRatio;
      g.sun.shadow.mapSize.set(T.shadowMap, T.shadowMap);
      if (g.sun.shadow.map) { g.sun.shadow.map.dispose(); g.sun.shadow.map = null; }   // recréée à la nouvelle taille
      g.shadowsAllowed = T.shadows;
      g.sun.castShadow = T.shadows && CC.CONFIG.render.shadows && !(g.level && g.level.env && g.level.env.sun && g.level.env.sun.shadow === false) && !(CC.EVO && CC.EVO.isS2 && CC.EVO.isS2());
      g.postfx.setSamples(T.msaa);
      g.postfx.bloom = T.bloom;
      g.effects.setDensity(T.particles);
      g.resize();
      this.acc = 0; this.frames = 0;
      if (g.telemetry) g.telemetry.event('quality', { tier });
    }

    // appelé à chaque image avec le temps réel écoulé (s)
    // v195 : la qualite ne baisse JAMAIS (ni resolution dynamique, ni palier inferieur) : on optimise le rendu, on ne le degrade pas
    watch() { /* volontairement vide */ }
  }

  CC.Quality = Quality;
})();
