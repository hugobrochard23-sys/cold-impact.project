/* v338 : ZONE SURE EN HAUT DE L'ECRAN (camera / encoche). CC.safeTop() = hauteur (px CSS) a laisser libre en haut : le plus grand entre la zone sure du navigateur
 * (env(safe-area-inset-top)) et celle que donne l'appli Android (AndroidBridge.topInset : encoche ou barre d'etat). Le HUD et la pause s'y decalent. */
(function () {
  let st = 0;
  const measure = () => {
    let css = 0;
    try { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:0;left:0;width:1px;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'; document.body.appendChild(d); css = d.offsetHeight || 0; document.body.removeChild(d); } catch (e) { /* ignore */ }
    let nat = 0; try { const B = window.AndroidBridge; if (B && B.topInset) nat = +B.topInset() || 0; } catch (e) { /* ignore */ }
    st = Math.max(css, nat);
    try { document.documentElement.style.setProperty('--cc-safe-top', st + 'px'); } catch (e) { /* ignore */ }
  };
  measure(); setTimeout(measure, 800); window.addEventListener('resize', measure);
  CC.safeTop = () => st;
  CC.safePx = () => st;   // le HUD dessine en pixels CSS
})();
