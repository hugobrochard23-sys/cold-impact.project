/* v181 : PALETTES du decor du niveau 1 (A plaine fraiche, B matin brumeux, C plaine sobre) : ciel, brume, herbe, briques, beton.
 * Le choix est memorise ; changer de palette recharge la page (le sol est calcule a la construction). */
(function () {
  const EVO = CC.EVO; if (!EVO || !EVO.on) return;
  const P = {
    A: { name: 'FRAICHE', sky: ['#7fc0ee', '#eaf6ff', '#d2e8f6'], grass: ['#44731f', '#4a8024', '#568c2a'], brick: '#ffd2bc', conc: '#f0e8d8' },
    B: { name: 'BRUMEUSE', sky: ['#a4cbe8', '#f7d9b8', '#e8e0d2'], grass: ['#4e6c30', '#567838', '#648440'], brick: '#f0c4cc', conc: '#f6ead6' },
    C: { name: 'SOBRE', sky: ['#98b2c4', '#c6d4da', '#b6c4cc'], grass: ['#41561f', '#476228', '#536e2d'], brick: '#9a9aa4', conc: '#c4cbd0' },
  };
  let id = 'A'; try { const s = localStorage.getItem('cc.palette'); if (s && P[s]) id = s; } catch (e) { /* ignore */ }
  const pal = P[id];
  CC.PALETTE = { id, name: pal.name, mat: { brick: pal.brick, concrete: pal.conc }, all: P };
  CC.PALETTE.next = () => { const o = ['A', 'B', 'C']; try { localStorage.setItem('cc.palette', o[(o.indexOf(id) + 1) % 3]); } catch (e) { /* ignore */ } location.reload(); };
  // ciel et brume (aube, matin, jour)
  const M = EVO.MOOD || {}, C3 = (h) => new THREE.Color(h);
  for (const k of ['dawn', 'morning', 'day']) { const m = M[k]; if (!m) continue; m.top = C3(pal.sky[0]); m.hor = C3(pal.sky[1]); m.fog = C3(pal.sky[2]); }
  // herbe
  const Z = CC.Zones; if (Z && Z.evoGC) { Z.evoGC.a.set(pal.grass[0]); Z.evoGC.b.set(pal.grass[1]); Z.evoGC.f.set(pal.grass[2]); }
})();
