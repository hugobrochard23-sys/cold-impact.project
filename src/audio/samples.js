/* v261 : vrais sons (fichiers) : clic de bouton, retour, apparition du drapeau, ambiance de nature en boucle. Remplace les bips synthetiques correspondants.
 * Les fichiers sont dans assets/audio/ ; rien ne joue tant que le contexte audio n'existe pas (premier toucher). */
(function () {
  const A = CC.Audio && CC.Audio.prototype; if (!A) return;
  const FILES = { start: 'assets/audio/start.mp3', back: 'assets/audio/back.mp3', flag: 'assets/audio/flag.mp3', victory: 'assets/audio/victory.mp3', reward: 'assets/audio/reward.mp3', chest: 'assets/audio/chest.mp3', report: 'assets/audio/report.mp3', nature: 'assets/audio/nature.mp3' };
  const buf = {}, busy = {}; let natureOn = false;
  const load = (a, k) => { if (buf[k] || busy[k] || !a.ctx) return; busy[k] = true; fetch(FILES[k]).then((r) => r.arrayBuffer()).then((d) => new Promise((ok, ko) => a.ctx.decodeAudioData(d, ok, ko))).then((b) => { buf[k] = b; if (k === 'nature') nature(a); }).catch(() => { busy[k] = false; }); };
  const nature = (a) => {
    if (natureOn || !buf.nature || !a.ctx) return; natureOn = true;
    const src = a.ctx.createBufferSource(), g = a.ctx.createGain(); src.buffer = buf.nature; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(a.musicBus); src.start();
    g.gain.setTargetAtTime(0.5, a.ctx.currentTime, 1.5);   // entree en fondu
  };
  const shot = (a, k, vol) => { const b = buf[k]; if (!b || !a.ctx) return false; const s = a.ctx.createBufferSource(), g = a.ctx.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(a.sfx); s.start(); return true; };
  const _init = A.init;
  A.init = function () { _init.apply(this, arguments); if (this.ctx) for (const k in FILES) load(this, k); };
  const _play = A.play, MAP = { ui: ['start', 0.9], back: ['back', 0.9], flag: ['flag', 0.9], victory: ['victory', 0.9], levelUp: ['reward', 0.85], report: ['report', 0.9], chest: ['chest', 0.95] };
  let hushT = 0; A.hush = function (ms) { hushT = performance.now() + ms; };   // v265 : apres Retour, un seul son (le sien)
  A.play = function (name, pos, param) {
    const m = MAP[name];
    if (name !== 'back' && performance.now() < hushT) return;
    if (m && this.ctx && !this.muted) { if (shot(this, m[0], m[1])) return; }
    if (m && (name === 'back' || name === 'flag' || name === 'victory' || name === 'levelUp' || name === 'report')) { load(this, m[0]); if (name === 'levelUp') return _play.call(this, name, pos, param); return name === 'back' ? _play.call(this, 'ui', pos, param) : undefined; }
    return _play.call(this, name, pos, param);
  };
})();
