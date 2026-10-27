/* v262 : MESURES DE JEU (pour les editeurs) : sessions, duree de jeu, retention J1/J7, vols, ameliorations, pubs vues, achats.
 * Tout est garde sur l'appareil (localStorage). Si adcfg.json contient "stats":"https://..." les evenements sont aussi envoyes
 * par lots a cette adresse (voir tools/stats_sheet.gs : un Google Sheet gratuit). Sans adresse rien ne quitte l'appareil.
 * Aucun identifiant publicitaire ni donnee personnelle : un numero aleatoire cree au premier lancement.
 * Voir les chiffres : ajouter ?stats=1 a l'adresse du jeu. */
(function () {
  const KEY = 'coldimpact.stats', QKEY = 'coldimpact.statsq', DAY = 86400000;
  const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v || d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const dayOf = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const rid = () => { let s = ''; for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 36).toString(36); return s; };

  const D = rd(KEY, null) || { id: rid(), first: Date.now(), days: [], sessions: 0, playMs: 0, ev: {}, runs: [], last: [] };
  if (!D.days) D.days = [];
  const Q = rd(QKEY, []);
  const St = CC.Stats = { D };
  let sess = null, url = '', lastTick = Date.now(), hiddenAt = 0;
  const save = () => wr(KEY, D);

  St.log = (name, data) => {
    try {
      const e = Object.assign({ n: name, t: Date.now(), s: D.sessions }, data || {});
      D.ev[name] = (D.ev[name] || 0) + 1;
      D.last.push(e); if (D.last.length > 200) D.last.shift();
      if (url) { Q.push(e); if (Q.length > 300) Q.shift(); wr(QKEY, Q); }
      save();
    } catch (err) { /* la mesure ne doit jamais casser le jeu */ }
  };

  const newSession = () => {
    const today = dayOf(Date.now());
    if (D.days.indexOf(today) < 0) { D.days.push(today); if (D.days.length > 90) D.days.shift(); }
    D.sessions++; sess = { t0: Date.now(), ms: 0 };
    St.log('session_start', { day: Math.floor((new Date(today) - new Date(dayOf(D.first))) / DAY), plat: CC.Native ? 'android' : 'web' });
  };
  // temps de jeu actif : compte seulement quand la page est visible
  const tick = () => {
    const now = Date.now(), dt = Math.min(now - lastTick, 10000); lastTick = now;
    if (!document.hidden && sess) { D.playMs += dt; sess.ms += dt; }
  };
  setInterval(() => { tick(); save(); }, 5000);
  document.addEventListener('visibilitychange', () => {
    tick();
    if (document.hidden) { hiddenAt = Date.now(); St.log('session_pause', { ms: sess ? sess.ms : 0 }); flush(true); }
    else { lastTick = Date.now(); if (hiddenAt && Date.now() - hiddenAt > 30 * 60000) newSession(); hiddenAt = 0; }
  });

  // ---------- envoi optionnel ----------
  function flush(beacon) {
    if (!url || !Q.length) return;
    const body = JSON.stringify({ id: D.id, ver: (window.CC_V || ''), ev: Q.slice() });
    try {
      if (beacon && navigator.sendBeacon) { if (navigator.sendBeacon(url, body)) { Q.length = 0; wr(QKEY, Q); } return; }
      fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).then(() => { Q.splice(0, JSON.parse(body).ev.length); wr(QKEY, Q); }).catch(() => {});
    } catch (e) { /* ignore */ }
  }
  setInterval(() => flush(false), 30000);
  window.addEventListener('pagehide', () => { tick(); save(); flush(true); });
  try { url = localStorage.getItem('coldimpact.statsurl') || ''; } catch (e) { /* ignore */ }
  try { fetch('adcfg.json?t=' + Date.now()).then((r) => r.json()).then((c) => { if (c && typeof c.stats === 'string') { url = c.stats; try { localStorage.setItem('coldimpact.statsurl', url); } catch (e) { /* ignore */ } } }).catch(() => {}); } catch (e) { /* ignore */ }

  // ---------- chiffres ----------
  St.report = () => {
    tick();
    const days = D.days, f = dayOf(D.first), has = (n) => days.indexOf(dayOf(new Date(f + 'T12:00:00').getTime() + n * DAY)) >= 0;
    const age = Math.floor((Date.now() - D.first) / DAY), runs = D.runs, n = runs.length;
    const avg = (k) => n ? Math.round(runs.reduce((a, r) => a + (r[k] || 0), 0) / n) : 0;
    return {
      id: D.id, premierLancement: f, ageJours: age, joursActifs: days.length, sessions: D.sessions,
      tempsJeuMin: +(D.playMs / 60000).toFixed(1), minParSession: D.sessions ? +(D.playMs / 60000 / D.sessions).toFixed(1) : 0,
      J1: age >= 1 ? has(1) : null, J7: age >= 7 ? has(7) : null,
      vols: D.ev.run_end || 0, distMoyenne: avg('dist'), dureeVolMoyenneS: avg('secs'),
      ameliorations: D.ev.upgrade || 0, pubsDemandees: D.ev.ad_rewarded_request || 0, pubsVues: D.ev.ad_rewarded_done || 0, interstitielles: D.ev.ad_interstitial || 0,
      achatsAffiches: D.ev.iap_click || 0, achatsFaits: D.ev.iap_done || 0, evenements: D.ev
    };
  };

  // ---------- accroches dans le jeu ----------
  const wrap = (obj, name, fn) => { const o = obj && obj[name]; if (typeof o !== 'function') return; obj[name] = function () { let r; try { r = fn.call(this, o, arguments); } catch (e) { r = o.apply(this, arguments); } return r; }; };
  const E = CC.EVO;
  if (E) {
    let t0 = 0;
    wrap(E, 'beginRun', function (o, a) { const r = o.apply(this, a); t0 = Date.now(); try { St.log('run_start', { runs: E.save(a[0]).runs }); } catch (e) { /* ignore */ } return r; });
    wrap(E, 'beginEnd', function (o, a) {
      const r = o.apply(this, a), L = a[0] && a[0].evoLast;
      if (L) { const secs = t0 ? Math.round((Date.now() - t0) / 1000) : 0; D.runs.push({ dist: L.dist, secs, coins: L.total }); if (D.runs.length > 60) D.runs.shift(); St.log('run_end', { dist: L.dist, coins: L.total, secs, rec: !!L.record, cause: L.crash || '' }); }
      return r;
    });
    wrap(E, 'buy', function (o, a) { const r = o.apply(this, a); if (r !== false) St.log('upgrade', { id: a[1], gem: !!a[2] }); return r; });
    wrap(E, 'endIntro', function (o, a) { const r = o.apply(this, a); St.log('intro_done'); return r; });
  }
  const A = CC.Ads && CC.Ads.prototype;
  if (A) {
    wrap(A, 'rewarded', function (o, a) {
      const purpose = a[2] || '', g = a[0];
      St.log('ad_rewarded_request', { p: purpose });
      const args = Array.prototype.slice.call(a); args[0] = function () { St.log('ad_rewarded_done', { p: purpose }); if (g) return g.apply(this, arguments); };
      return o.apply(this, args);
    });
    wrap(A, 'open', function (o, a) { if (a[0] === 'interstitial') St.log('ad_interstitial'); return o.apply(this, a); });
  }
  const N = CC.Native;
  if (N) wrap(N, 'buy', function (o, a) { St.log('iap_click', { pid: a[0] }); return o.apply(this, a); });
  if (typeof window.__natPurchase === 'function') {
    const op = window.__natPurchase;
    window.__natPurchase = function (pid, token) {
      try { const S = E.saveBase(CC.game); if (!(S.ptok && S.ptok[token])) St.log('iap_done', { pid }); } catch (e) { /* ignore */ }
      return op.apply(this, arguments);
    };
  }

  newSession();

  // ---------- affichage ?stats=1 ----------
  if (/[?&]stats=1/.test(location.search)) {
    const show = () => {
      const d = document.createElement('pre');
      d.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;margin:0;padding:12px;background:rgba(0,0,0,.88);color:#9f9;font:12px/1.35 monospace;z-index:99999;overflow:auto;white-space:pre-wrap';
      const draw = () => { d.textContent = 'COLD IMPACT - mesures de CET appareil\n(toucher pour fermer)\n\n' + JSON.stringify(St.report(), null, 1) + (url ? '\n\nenvoi vers : ' + url + '  (file : ' + Q.length + ')' : '\n\nenvoi : aucune adresse (donnees locales seulement)'); };
      draw(); setInterval(draw, 2000); d.onclick = () => d.remove(); document.body.appendChild(d);
    };
    if (document.body) show(); else window.addEventListener('DOMContentLoaded', show);
  }
})();
