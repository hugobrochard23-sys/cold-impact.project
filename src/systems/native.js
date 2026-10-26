/* v260 : PONT NATIF (appli Android seulement : window.AndroidBridge existe). Remplace les fausses pubs par AdMob (recompensee + interstitielle),
 * branche les achats Google Play (sans pub, pack de depart, gemmes) et lit un reglage distant (adcfg.json sur GitHub Pages) pour la pub imposee.
 * Dans un navigateur ordinaire rien ne change : ce fichier ne fait rien sans AndroidBridge. */
(function () {
  const B = window.AndroidBridge; if (!B || !CC.Ads) return;
  const N = CC.Native = { on: true, prices: {}, cfg: { from: 5, every: 2, gap: 90 } }, cbs = {}; let seq = 0;
  const toast = (m) => { try { CC.Home.toast(CC.game.ui, m); } catch (e) { /* ignore */ } };
  window.__nat = (id, st) => { const f = cbs[id]; if (f) { delete cbs[id]; f(st); } };
  window.__natPrices = (json) => { try { Object.assign(N.prices, JSON.parse(json)); } catch (e) { /* ignore */ } };
  N.price = (id) => N.prices[id];
  // ---------- reglage distant de la pub imposee ----------
  try { const c = JSON.parse(localStorage.getItem('coldimpact.adcfg') || 'null'); if (c) Object.assign(N.cfg, c); } catch (e) { /* ignore */ }
  try { fetch('https://hugobrochard23-sys.github.io/cold-impact.project/adcfg.json?t=' + Date.now()).then((r) => r.json()).then((c) => { if (c && typeof c === 'object') { for (const k of ['from', 'every', 'gap']) if (typeof c[k] === 'number') N.cfg[k] = c[k]; try { localStorage.setItem('coldimpact.adcfg', JSON.stringify(N.cfg)); } catch (e) { /* ignore */ } } }).catch(() => {}); } catch (e) { /* ignore */ }
  // ---------- publicites ----------
  const A = CC.Ads.prototype, guard = (self, fn) => { self.nBusy = true; setTimeout(() => { self.nBusy = false; }, 180000); fn(); };
  A.rewarded = function (grant, seconds, purpose, label) {
    const g = this.game; if (this.nBusy) return; const id = 'r' + (++seq);
    guard(this, () => { this.duck(true);
      cbs[id] = (st) => { this.nBusy = false; this.duck(false); if (st === 'rewarded') { this.lastAd = this.now(); this.sinceAd = 0; if (grant) grant(); } else { if (st === 'failed') toast('PUB INDISPONIBLE, REESSAIE'); if (purpose === 'revive' && g.state === 'REVIVE') g.finishEndless(); } };
      B.showRewarded(id); });
  };
  const _open = A.open;
  A.open = function (kind, then) {
    if (kind !== 'interstitial') return _open.apply(this, arguments);
    if (this.nBusy) { if (then) then(); return; } const id = 'i' + (++seq);
    guard(this, () => { this.duck(true); cbs[id] = () => { this.nBusy = false; this.duck(false); this.lastAd = this.now(); this.sinceAd = 0; if (then) then(); }; B.showInterstitial(id); });
  };
  // pub imposee apres le rapport : a partir du vol `from`, puis un vol sur `every`, jamais moins de `gap` s apres une autre pub
  CC.EVO.adDue = (g, S) => { const c = N.cfg; return !!(g.ads && g.ads.forced() && S.runs >= c.from && (S.runs - c.from) % Math.max(1, c.every) === 0 && g.ads.now() - g.ads.lastAd >= c.gap); };
  // ---------- achats ----------
  const grant = (pid) => {
    const g = CC.game, E = CC.EVO, S = E.saveBase(g), gems = (n) => { S.gems = (S.gems || 0) + n; g.evoGemFx = { t0: performance.now(), n }; }, noAds = () => { g.meta.M.noAds = true; };
    if (pid === 'noads') noAds(); else if (pid === 'starter') { noAds(); gems(10); } else if (/^gems\d+$/.test(pid)) gems(parseInt(pid.slice(4), 10));
    g.writeSave(); if (g.audio) g.audio.play('levelUp');
  };
  window.__natPurchase = (pid, token) => {
    try { const S = CC.EVO.saveBase(CC.game); S.ptok = S.ptok || {}; if (!S.ptok[token]) { S.ptok[token] = 1; grant(pid); toast('ACHAT RECU, MERCI !'); } B.confirm(token, /^gems/.test(pid)); } catch (e) { /* sera relivre au prochain demarrage */ }
  };
  window.__natPurchaseFail = () => toast('ACHAT INDISPONIBLE POUR LE MOMENT');
  N.buy = (id) => B.buy(id);
  N.privacy = () => { if (B.privacyRequired()) B.showPrivacy(); else toast('AUCUN CHOIX REQUIS'); };
  const wait = setInterval(() => { if (CC.game && CC.game.meta && CC.EVO && CC.EVO.saveBase && CC.game.writeSave) { clearInterval(wait); B.ready(); } }, 300);
})();
