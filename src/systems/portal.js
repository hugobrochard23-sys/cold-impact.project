/* v339 : MODE PORTAIL (Playgama, Poki, CrazyGames). Actif seulement si la page declare un portail : window.CC_PORTAL = 'playgama' (ecrit par tools/portal_build.js dans la
 * page du paquet) ou ?portal=playgama|poki|crazygames|test dans l'adresse. Sans cela ce fichier ne fait rien : le jeu normal et l'appli Android ne changent pas.
 * En mode portail :
 *  - les fausses pubs sont remplacees par les VRAIES du portail (interstitielle aux pauses naturelles, recompensee au choix du joueur) ;
 *  - aucun achat en argent reel (boutique : seulement les offres gratuites contre une video), aucun envoi de statistiques, aucun lien externe, pas d'ecran de conditions ;
 *  - on previent le portail du chargement termine et du debut / de la fin de partie ;
 *  - le son se coupe pendant les pubs. Si le SDK ne repond pas : le jeu continue normalement, la pub est simplement sautee. */
(function () {
  let id = ''; try { id = String(window.CC_PORTAL || new URLSearchParams(location.search).get('portal') || '').toLowerCase(); } catch (e) { /* ignore */ }
  if (!id || !CC.Ads) return;
  const P = CC.Portal = { on: true, id, ready: false, playing: false, loaded: false, log: [] };
  const note = (m) => { P.log.push(m); if (P.log.length > 60) P.log.shift(); };
  try { localStorage.setItem('coldimpact.terms', '1'); } catch (e) { /* ignore */ }   // pas d'ecran de conditions : le portail a les siennes
  const G = () => CC.game;
  const toast = (m) => { try { CC.Home.toast(G().ui, m); } catch (e) { /* ignore */ } };
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error('script ' + src)); document.head.appendChild(s); });
  const once = (fn) => { let d = false; return (...a) => { if (d) return; d = true; fn(...a); }; };
  const withTimeout = (cb, ms) => { const f = once(cb); const t = setTimeout(() => { note('timeout'); f(false); }, ms); return (ok) => { clearTimeout(t); f(ok); }; };

  // ---------- adaptateurs : ad(kind, done(ok)) ; start() / stop() ; loaded() ----------
  const A = {};
  A.test = {   // simulateur : ?portal=test (&portalAd=fail pour une pub indisponible)
    init() { P.ready = true; },
    ad(kind, done) { const fail = /[?&]portalAd=fail/.test(location.search); note('mock ' + kind); setTimeout(() => done(!fail), 900); },
    start() { note('start'); }, stop() { note('stop'); }, loaded() { note('loaded'); },
  };
  A.poki = {
    init() {
      (window.PokiSDK ? Promise.resolve() : loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js')).then(() => window.PokiSDK.init()).then(() => { P.ready = true; note('poki ready'); }).catch(() => { P.ready = false; note('poki init failed'); });
    },
    ad(kind, done) {
      const S = window.PokiSDK; if (!S || !P.ready) { done(false); return; }
      const mute = () => { try { G().ads.duck(true); } catch (e) { /* ignore */ } };
      try { if (kind === 'rewarded') S.rewardedBreak(mute).then((ok) => done(!!ok)).catch(() => done(false)); else S.commercialBreak(mute).then(() => done(true)).catch(() => done(false)); } catch (e) { done(false); }
    },
    start() { try { window.PokiSDK && window.PokiSDK.gameplayStart(); } catch (e) { /* ignore */ } },
    stop() { try { window.PokiSDK && window.PokiSDK.gameplayStop(); } catch (e) { /* ignore */ } },
    loaded() { try { window.PokiSDK && window.PokiSDK.gameLoadingFinished(); } catch (e) { /* ignore */ } },
  };
  A.playgama = {
    init() {
      const go = () => { const b = window.bridge; if (!b) { note('bridge absent'); return; }
        b.initialize().then(() => {
          P.ready = true; note('playgama ready');
          try { b.advertisement.on(b.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, (st) => { note('interstitial ' + st); const cb = A.playgama.cbI; if (st === 'opened') { try { G().ads.duck(true); } catch (e) { /* ignore */ } } if ((st === 'closed' || st === 'failed') && cb) { A.playgama.cbI = null; cb(st === 'closed'); } }); } catch (e) { /* ignore */ }
          try { b.advertisement.on(b.EVENT_NAME.REWARDED_STATE_CHANGED, (st) => { note('rewarded ' + st); if (st === 'opened') { try { G().ads.duck(true); } catch (e) { /* ignore */ } } if (st === 'rewarded') A.playgama.got = true; if ((st === 'closed' || st === 'failed') && A.playgama.cbR) { const cb = A.playgama.cbR; A.playgama.cbR = null; cb(!!A.playgama.got && st !== 'failed'); } }); } catch (e) { /* ignore */ }
          try { b.platform.on(b.EVENT_NAME.AUDIO_STATE_CHANGED, (on) => { const a = G() && G().audio; if (a && a.ctx) { if (on) a.ctx.resume(); else a.ctx.suspend(); } }); } catch (e) { /* ignore */ }
          try { b.platform.on(b.EVENT_NAME.PAUSE_STATE_CHANGED, (p) => { const g = G(); if (p && g && g.pause && g.state === 'FLIGHT' && !g.paused) g.pause(); }); } catch (e) { /* ignore */ }
          try { if (b.platform.isAudioEnabled === false) { const a = G() && G().audio; if (a && a.ctx) a.ctx.suspend(); } } catch (e) { /* ignore */ }
        }).catch(() => { note('playgama init failed'); }); };
      if (window.bridge) go(); else loadScript('https://bridge.playgama.com/v2/stable/playgama-bridge.js').then(go).catch(() => note('bridge script failed'));
    },
    ad(kind, done) {
      const b = window.bridge; if (!b || !P.ready) { done(false); return; }
      try {
        if (kind === 'rewarded') { if (b.advertisement.isRewardedSupported === false) { done(false); return; } A.playgama.got = false; A.playgama.cbR = done; b.advertisement.showRewarded(); }
        else { if (b.advertisement.isInterstitialSupported === false) { done(true); return; } A.playgama.cbI = done; b.advertisement.showInterstitial(); }
      } catch (e) { done(false); }
    },
    start() { try { window.bridge && P.ready && window.bridge.platform.sendMessage('level_started'); } catch (e) { /* ignore */ } },
    stop() { },
    // v340 : « game_ready » est reessaye tant que le pont n'est pas initialise (avant, un envoi trop tot etait perdu : Playgama refusait le build)
    loaded() { let n = 0; const go = () => { try { if (window.bridge && P.ready) { window.bridge.platform.sendMessage('game_ready'); note('game_ready'); return; } } catch (e) { /* ignore */ } if (++n < 240) setTimeout(go, 500); else note('game_ready abandonne'); }; go(); },
  };
  A.crazygames = {
    init() { (window.CrazyGames ? Promise.resolve() : loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js')).then(() => window.CrazyGames.SDK.init()).then(() => { P.ready = true; note('crazygames ready'); }).catch(() => note('crazygames init failed')); },
    ad(kind, done) {
      const S = window.CrazyGames && window.CrazyGames.SDK; if (!S || !P.ready) { done(false); return; }
      try { S.ad.requestAd(kind === 'rewarded' ? 'rewarded' : 'midgame', { adStarted: () => { try { G().ads.duck(true); } catch (e) { /* ignore */ } }, adFinished: () => done(true), adError: () => done(false) }); } catch (e) { done(false); }
    },
    start() { try { window.CrazyGames.SDK.game.gameplayStart(); } catch (e) { /* ignore */ } },
    stop() { try { window.CrazyGames.SDK.game.gameplayStop(); } catch (e) { /* ignore */ } },
    loaded() { try { window.CrazyGames.SDK.game.loadingStop(); } catch (e) { /* ignore */ } },
  };
  A.gamedistribution = {   // v355 : GameDistribution (SDK html5.api.gamedistribution.com/main.min.js, GD_OPTIONS ecrit par tools/portal_build.js) : pubs interstitielles et recompensees
    cb: null, got: false,
    init() {
      let n = 0; const poll = () => { if (window.gdsdk) { P.ready = true; note('gd ready'); } else if (++n < 160) setTimeout(poll, 500); else note('gd sdk absent'); };
      window.CC_GD = (e) => { try { note('gd ' + e.name); if (e.name === 'SDK_GAME_PAUSE') { try { G().ads.duck(true); } catch (x) { /* ignore */ } } else if (e.name === 'SDK_GAME_START') { try { G().ads.duck(false); } catch (x) { /* ignore */ } } else if (e.name === 'SDK_REWARDED_WATCH_COMPLETE') A.gamedistribution.got = true; else if (e.name === 'SDK_READY') P.ready = true; } catch (x) { /* ignore */ } };
      poll();
    },
    ad(kind, done) {
      const s = window.gdsdk; if (!s || !P.ready || typeof s.showAd !== 'function') { done(false); return; }
      A.gamedistribution.got = false;
      try {
        if (kind === 'rewarded') { const go = () => s.showAd('rewarded').then(() => done(!!A.gamedistribution.got)).catch(() => done(false)); if (typeof s.preloadAd === 'function') s.preloadAd('rewarded').then(go).catch(() => done(false)); else go(); }
        else s.showAd().then(() => done(true)).catch(() => done(true));   // erreur de pub interstitielle : on continue le jeu
      } catch (e) { done(false); }
    },
    start() { }, stop() { }, loaded() { }
  };
  A.gamemonetize = {   // v356 : GameMonetize (SDK api.gamemonetize.com/sdk.js, SDK_OPTIONS ecrit par tools/portal_build.js) : une seule pub (sdk.showBanner) ; la pub « recompensee » du jeu utilise la meme pub
    cb: null, started: false,
    init() {
      let n = 0; const poll = () => { if (window.sdk && typeof window.sdk.showBanner === 'function') { P.ready = true; note('gm ready'); if (/[?&]m=account/.test(location.search)) setTimeout(() => { try { window.sdk.showBanner(); note('gm verify ad'); } catch (x) { /* ignore */ } }, 3000); }   /* v357 : page « Verify Game » de GameMonetize (?m=account) : une pub se lance toute seule, sans avoir a jouer */ else if (++n < 160) setTimeout(poll, 500); else note('gm sdk absent'); };
      window.CC_GM = (e) => { try { note('gm ' + e.name); if (e.name === 'SDK_GAME_PAUSE') { A.gamemonetize.started = true; try { G().ads.duck(true); } catch (x) { /* ignore */ } } else if (e.name === 'SDK_GAME_START') { try { G().ads.duck(false); } catch (x) { /* ignore */ } const cb = A.gamemonetize.cb; A.gamemonetize.cb = null; if (cb) cb(true); } else if (e.name === 'SDK_READY') P.ready = true; } catch (x) { /* ignore */ } };
      poll();
    },
    ad(kind, done) {
      const s = window.sdk; if (!s || !P.ready || typeof s.showBanner !== 'function') { done(false); return; }
      const g = A.gamemonetize; g.started = false; g.cb = done;
      try { s.showBanner(); } catch (e) { g.cb = null; done(false); return; }
      setTimeout(() => { if (g.cb === done && !g.started) { g.cb = null; done(false); } }, 7000);   // aucune pub n'a demarre : on continue le jeu
    },
    start() { }, stop() { }, loaded() { }
  };
  const AD = A[id] || A.test;
  P.adapter = AD;
  try { AD.init(); } catch (e) { note('init error'); }

  // ---------- pubs ----------
  const Ads = CC.Ads.prototype;
  Ads.enabled = function () { return this.cfg.enabled !== false && !this.game.testMode; };   // pas de reglage « pubs d'exemple » en portail
  Ads.forced = function () { return this.enabled(); };
  const run = (self, kind, after) => {
    if (self.pBusy) return; self.pBusy = true; self.duck(true);
    P.ad(kind, (ok) => { self.pBusy = false; self.duck(false); after(ok); });
  };
  P.ad = (kind, done) => { const f = withTimeout(done, 45000); try { AD.ad(kind, f); } catch (e) { f(false); } };
  Ads.rewarded = function (grant, seconds, purpose, label) {
    const g = this.game;
    run(this, 'rewarded', (ok) => {
      if (ok) { this.lastAd = this.now(); this.sinceAd = 0; if (grant) grant(); }
      else { toast('AD NOT AVAILABLE, TRY AGAIN LATER'); if (purpose === 'revive' && g.state === 'REVIVE') g.finishEndless(); }
    });
  };
  const _open = Ads.open;
  Ads.open = function (kind, then) {
    if (kind !== 'interstitial') return _open.apply(this, arguments);
    if (this.pBusy) { if (then) then(); return; }
    run(this, 'interstitial', () => { this.lastAd = this.now(); this.sinceAd = 0; if (then) then(); });
  };
  // pause naturelle apres le rapport de vol : a partir du 2e vol, jamais moins de 70 s apres une autre pub (le portail decide en plus de sa propre frequence)
  // v343 : plus doux : a partir du 3e vol, au moins 150 s apres une autre pub et pas avant 3 min de session (les joueurs qui ferment juste apres une pub etaient trop nombreux)
  // v352 : AUCUNE pub pendant les 4 premieres minutes (minimum de la Sandbox : 0,30 pub par partie ; marge sinon)  // v348 : AUCUNE pub pendant les 5 premieres minutes (39,7 % des joueurs fermaient le jeu juste apres une pub) ; ensuite seulement au rapport de vol
  if (CC.EVO) CC.EVO.adDue = (g, S) => !!(g.ads && g.ads.forced() && S.runs >= 3 && g.ads.now() - g.ads.lastAd >= 150 && performance.now() >= 240000);

  // ---------- evenements de mesure (analytique Playgama : bridge.analytics.send) ----------
  // Chaque evenement porte : ab (variante du test A/B), v (version), ts (secondes depuis l'ouverture), scr (ecran), stage, runs.
  const evQ = [];
  const scrOf = (g) => (g.ui && g.ui.overlay) || g.state || '';
  const sendEv = (name, o) => { const b = window.bridge; if (id !== 'playgama') { note('ev ' + name); return true; } if (!b || !P.ready || !b.analytics || typeof b.analytics.send !== 'function') return false; try { b.analytics.send(name, o); note('ev ' + name); } catch (e) { /* ignore */ } return true; };
  P.ev = (name, data) => {
    try {
      const g = G(), S = g && g.save && g.save.evo, o = {};
      if (data) for (const k in data) { const v = data[k]; if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') o[k] = typeof v === 'string' ? v.slice(0, 40) : v; }
      o.ab = 'k'; o.v = String(window.CC_VERSION || ''); o.ts = Math.round(performance.now() / 1000);
      if (g) { o.scr = scrOf(g); o.stage = (CC.EVO && CC.EVO.stage) ? CC.EVO.stage(g) : 1; o.runs = (S && S.runs) || 0; }
      if (!sendEv(name, o)) { evQ.push([name, o]); if (evQ.length > 80) evQ.shift(); }
    } catch (e) { /* ignore */ }
  };
  let lastScr = '', lastBeat = 0;
  const trackScr = (g) => {
    const s = scrOf(g); if (s !== lastScr) { const prev = lastScr; lastScr = s; if (prev) P.ev('screen', { to: s, from: prev }); }
    const now = performance.now(); if (now - lastBeat >= 20000 && !document.hidden) { lastBeat = now; P.ev('alive', {}); }
    if (P.ready && evQ.length) { while (evQ.length) { const e = evQ[0]; if (!sendEv(e[0], e[1])) break; evQ.shift(); } }
  };
  document.addEventListener('visibilitychange', () => { P.ev(document.hidden ? 'tab_hidden' : 'tab_shown', {}); });
  window.addEventListener('pagehide', () => { P.ev('page_exit', {}); });
  { const _o = Ads.open; /* pubs : fin de l'interstitielle, pour voir qui part apres une pub */
    Ads.open = function (kind, then) { return _o.call(this, kind, then && kind === 'interstitial' ? function () { P.ev('ad_end', { kind: 'interstitial' }); then(); } : then); }; }   // le debut des pubs est deja note par analytics.js (ad_interstitial, ad_rewarded_request / done)

  // ---------- etat de partie / chargement ----------
  setInterval(() => {
    const g = G(); if (!g) return;
    trackScr(g);
    if (!P.loaded && g.ui && (g.ui.overlay === 'evo' || g.padMode || g.state === 'LAUNCH')) { P.loaded = true; AD.loaded(); }
    const play = g.state === 'FLIGHT' && !g.paused && !g.ui.overlay;
    if (play !== P.playing) { P.playing = play; if (play) AD.start(); else AD.stop(); }
  }, 250);
  P.state = () => ({ id, ready: P.ready, loaded: P.loaded, playing: P.playing, log: P.log.slice() });
})();
