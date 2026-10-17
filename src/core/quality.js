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
      const s = this.game.settings.graphics || 'auto';
      if (s !== 'auto') return s;
      return 'high';   // v094 : graphismes élevés dès le départ (la qualité adaptative baisse toute seule si ça rame)
    }

    apply(tier) {
      const g = this.game, T = this.cfg.tiers[tier];
      if (!T || tier === this.tier) return;
      this.tier = tier;
      CC.CONFIG.render.maxPixelRatio = T.pixelRatio;
      g.sun.shadow.mapSize.set(T.shadowMap, T.shadowMap);
      if (g.sun.shadow.map) { g.sun.shadow.map.dispose(); g.sun.shadow.map = null; }   // recréée à la nouvelle taille
      g.shadowsAllowed = T.shadows;
      g.sun.castShadow = T.shadows && CC.CONFIG.render.shadows && !(g.level && g.level.env && g.level.env.sun && g.level.env.sun.shadow === false);
      g.postfx.setSamples(T.msaa);
      g.postfx.bloom = T.bloom;
      g.effects.setDensity(T.particles);
      g.resize();
      this.acc = 0; this.frames = 0;
      if (g.telemetry) g.telemetry.event('quality', { tier });
    }

    // appelé à chaque image avec le temps réel écoulé (s)
    watch(realDt) {
      const g = this.game;
      if (g.testMode || (g.settings.graphics || 'auto') !== 'auto' || g.state !== 'FLIGHT' || g.paused) { this.acc = 0; this.frames = 0; this.dAcc = 0; this.dFrames = 0; return; }
      // v189 : RESOLUTION DYNAMIQUE : sous 50 images/s, le rendu 3D perd 7 % de resolution (minimum 72 %) ; il remonte de 5 % apres 4 secondes pleinement fluides (60 images/s). L'interface reste nette.
      this.dAcc += realDt; this.dFrames++;
      if (this.dAcc >= 1) {
        const f = this.dFrames / this.dAcc; this.dAcc = 0; this.dFrames = 0;
        if (f < 50 && this.scale > 0.72) { this.scale = Math.max(0.72, +(this.scale - 0.07).toFixed(2)); this.good = 0; g.applyRenderScale(); }
        else if (f >= 58) { if (++this.good >= 4 && this.scale < 1) { this.scale = Math.min(1, +(this.scale + 0.05).toFixed(2)); this.good = 0; g.applyRenderScale(); } }
        else this.good = 0;
      }
      this.acc += realDt; this.frames++;
      if (this.acc < this.cfg.autoWindow) return;
      const fps = this.frames / this.acc;
      this.acc = 0; this.frames = 0;
      const i = ORDER.indexOf(this.tier);
      if (fps < this.cfg.autoDownFps && i > 0) this.apply(ORDER[i - 1]);
    }
  }

  CC.Quality = Quality;
})();
