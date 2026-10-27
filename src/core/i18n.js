/* v266 : LANGUE. Le jeu est ecrit en francais ; l'anglais est la langue par defaut (editeurs, public mondial). Toutes les chaines passent par le dessin du texte (canvas),
 * donc une seule couche les traduit : CC.I18n.t(texte). Cle = texte francais SANS accent, en majuscules ; la valeur est l'anglais (en majuscules aussi : le jeu dessine tout en capitales).
 * Les textes qui changent (nombres, noms) passent par les regles (regex). ?lang=fr force le francais ; ?i18n=1 note dans window.__i18nSeen tout texte dessine. */
(function () {
  const I = CC.I18n = { lang: 'en', seen: null };
  try { const q = new URLSearchParams(location.search).get('lang'), st = localStorage.getItem('coldimpact.lang'); I.lang = q === 'fr' || q === 'en' ? q : (st === 'fr' || st === 'en' ? st : 'en'); if (new URLSearchParams(location.search).get('i18n')) I.seen = window.__i18nSeen = new Set(); } catch (e) { /* ignore */ }
  I.set = (l) => { I.lang = l; try { localStorage.setItem('coldimpact.lang', l); } catch (e) { /* ignore */ } I.cache.clear(); };
  I.cache = new Map();
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  I.D = {};      // exact : cle normalisee -> anglais
  I.R = [];      // regles : [regex sur le texte normalise, remplacement]
  I.add = (o) => { for (const k in o) I.D[norm(k)] = o[k]; };
  I.rule = (re, to) => I.R.push([re, to]);
  const decimals = (s) => s.replace(/(\d),(\d)/g, '$1.$2');   // 1,5 -> 1.5
  const mixed = (src, en) => (src === src.toUpperCase() ? en : en.charAt(0) + en.slice(1).toLowerCase());   // « Pack de demarrage » : phrase en casse mixte
  I.t = (s) => {
    if (I.lang !== 'en' || typeof s !== 'string' || s.length < 2) return s;
    if (I.seen) I.seen.add(s);
    let r = I.cache.get(s); if (r !== undefined) return r;
    const n = norm(s), lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    let out = I.D[n];
    if (out === undefined) for (const [re, to] of I.R) { if (re.test(n)) { out = n.replace(re, to); break; } }
    r = out === undefined ? decimals(s) : lead + mixed(s.trim(), decimals(out)) + trail;
    if (I.cache.size > 3000) I.cache.clear(); I.cache.set(s, r); return r;
  };
  // ---- branchement : texte canvas (toute l'interface), mesures de texte, police du jeu
  const P = CanvasRenderingContext2D.prototype, ft = P.fillText, st = P.strokeText, mt = P.measureText;
  P.fillText = function (t, x, y, w) { return ft.call(this, I.t(t), x, y, w); };
  P.strokeText = function (t, x, y, w) { return st.call(this, I.t(t), x, y, w); };
  P.measureText = function (t) { return mt.call(this, I.t(t)); };
  I.hookFont = () => {
    const F = CC.Font; if (!F || F._i18n) return; F._i18n = true; const m = F.measure, d = F.draw;
    F.measure = function (t, px, pixel) { return m.call(F, I.t(t), px, pixel); };
    F.draw = function (ctx, seg, x, y, px, color, opts) { if (typeof seg === 'string') seg = I.t(seg); else if (Array.isArray(seg)) seg = seg.map((q) => Object.assign({}, q, { t: I.t(q.t) })); return d.call(F, ctx, seg, x, y, px, color, opts); };
  };
  I.hookFont();
})();
