/* v322 : MESURE DE PERFORMANCE sur l'appareil (lien avec ?perf=1). Affiche en haut de l'ecran : images par seconde, pire image, appels de dessin, triangles, temps de calcul du jeu
 * et temps d'envoi du rendu. Garde la liste des pires moments (distance parcourue + niveau) : un appui sur le cadre affiche ce tableau, a me montrer en capture d'ecran.
 * Rien n'est charge ni mesure sans ?perf=1. */
(function () {
  if (!/[?&]perf=1/.test(location.search)) return;
  const q = (k) => new URLSearchParams(location.search).get(k);
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:4px;top:4px;z-index:99999;background:rgba(0,0,0,0.62);color:#7dff9a;font:11px/1.25 monospace;padding:4px 6px;border-radius:5px;white-space:pre;max-width:96vw;pointer-events:auto;-webkit-user-select:none;user-select:none';
  let detail = false; box.addEventListener('touchstart', (e) => { detail = !detail; e.preventDefault(); }, { passive: false }); box.addEventListener('click', () => { detail = !detail; });
  const mount = () => document.body.appendChild(box);
  if (document.body) mount(); else window.addEventListener('DOMContentLoaded', mount);
  const S = { n: 0, sum: 0, worst: 0, calls: 0, tris: 0, gl: 0, js: 0, fr: 0 }, worstList = [], seg = {};
  let lastT = performance.now(), hookDone = false, lastShow = 0, fps = 0, shown = '';
  const hook = () => {
    const g = CC.game; if (!g || !g.postfx || hookDone) return; hookDone = true;
    const R = g.renderer; R.info.autoReset = false;
    const pr = g.postfx.render.bind(g.postfx);
    g.postfx.render = function () {
      R.info.reset(); const t0 = performance.now(); pr.apply(null, arguments); const t1 = performance.now();
      S.gl += t1 - t0; S.calls += R.info.render.calls; S.tris += R.info.render.triangles; S.fr++;
      cur.calls = R.info.render.calls; cur.tris = R.info.render.triangles; cur.gl = t1 - t0;
    };
  };
  const cur = { calls: 0, tris: 0, gl: 0 };
  const level = () => (CC.EVO && CC.EVO.isS2 && CC.EVO.isS2() ? 'N2' : 'N1');
  const loop = (now) => {
    requestAnimationFrame(loop); hook();
    const g = CC.game, dt = now - lastT; lastT = now; if (!g) return;
    const fly = g.state === 'FLIGHT' && g.endlessRun; if (dt > 200) return;   // pause, onglet masque
    S.n++; S.sum += dt; if (dt > S.worst) S.worst = dt;
    if (fly) {
      const d = Math.round(g.endlessRun.dist / 100) * 100, k = level() + ' ' + d + ' m', e = seg[k] || (seg[k] = { n: 0, sum: 0, worst: 0, calls: 0, tris: 0 });
      e.n++; e.sum += dt; e.calls += cur.calls; e.tris += cur.tris; if (dt > e.worst) e.worst = dt;
    }
    if (now - lastShow > 500) {
      fps = S.n * 1000 / (S.sum || 1);
      const fr = S.fr || 1;
      shown = 'FPS ' + fps.toFixed(0) + '  pire ' + S.worst.toFixed(0) + ' ms\ndessin ' + Math.round(S.calls / fr) + ' appels  ' + Math.round(S.tris / fr / 1000) + 'k tri\nrendu ' + (S.gl / fr).toFixed(1) + ' ms (envoi)\n' + (fly ? level() + '  ' + Math.round(g.endlessRun.dist) + ' m' : 'hors vol') + '  ecran ' + g.renderer.domElement.width + 'x' + g.renderer.domElement.height;
      if (fly && fps < 50) { worstList.push({ k: level() + ' ' + Math.round(g.endlessRun.dist / 100) * 100 + ' m', fps: Math.round(fps), calls: Math.round(S.calls / fr), tri: Math.round(S.tris / fr / 1000) }); if (worstList.length > 400) worstList.shift(); }
      S.n = S.sum = S.worst = S.calls = S.tris = S.gl = S.fr = 0; lastShow = now;
    }
    if (now - (loop.t2 || 0) > 400) {
      loop.t2 = now;
      let txt = shown;
      if (detail) {
        const rows = Object.entries(seg).filter((e) => e[1].n > 20).map(([k, e]) => ({ k, fps: e.n * 1000 / e.sum, w: e.worst, c: e.calls / e.n, t: e.tris / e.n / 1000 })).sort((a, b) => a.fps - b.fps).slice(0, 14);
        txt += '\n--- zones les plus lentes (touche = fermer) ---\n' + rows.map((r) => r.k.padEnd(10) + ' ' + r.fps.toFixed(0).padStart(3) + ' fps  pire ' + r.w.toFixed(0).padStart(3) + ' ms  ' + r.c.toFixed(0).padStart(3) + ' app  ' + r.t.toFixed(0).padStart(3) + 'k').join('\n');
      } else txt += '\n(touche = zones les plus lentes)';
      box.textContent = txt;
    }
  };
  requestAnimationFrame(loop);
  CC.Perf = { seg, worstList, text: () => box.textContent };
  if (q('perfhide') === '1') box.style.display = 'none';
})();
