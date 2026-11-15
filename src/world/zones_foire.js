/* v409 : NIVEAU 3 « OPERATION FETE FORAINE » (?lv=3). Un parc d'attractions GEANT, evacue et occupe par l'armee ennemie, pense pour etre vu D'EN HAUT (30 a 80 m).
 * Physique et ennemis du niveau 1 (zone campagne, ennemis agrandis x1,45), fusee : le missile clown (rocket_w.js). Scenes :
 *   fdepart (170 m) : le parking, l'arche fermee au loin, les grandes roues a l'horizon
 *   fportes (430 m) : l'avenue des mats, LA GRANDE ARCHE : portes FERMEES, elles s'ouvrent a 210 m (confettis, fanfare)
 *   fplace  (640 m) : la place de l'horloge : tour de 90 m, fontaine geante, confiserie, salle d'arcades, theatre, restauration, villages de stands
 *   fparc   (900 m) : la foire : maneges partout (carrousel, chaises volantes, tour de chute, bateau pirate, BRAS GEANT qui balaie le passage),
 *                     jets d'eau qui jaillissent en travers, arches de ballons, montgolfieres sur le trajet, tentes, guirlandes
 * Partout : ciel feerique (peche, rose, lilas), pavages dessines par le code (petits paves, grandes dalles) avec mosaiques lisibles du ciel,
 * grandes roues et montagnes russes a l'horizon (decor permanent), confettis qui flottent autour de la fusee, ballons perdus.
 * Aucun animal, aucune foule ; chaque objet au sol porte une ombre. */
(function () {
  const U = CC.U, Z = CC.Zones, D = Z.defs && Z.defs.campagne, foe0 = Z.evoFoe, EVO = CC.EVO, T3 = THREE;
  if (!D || !foe0 || !EVO || !EVO.on) return;
  const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const MT = {}, lam = (c) => MT[c] || (MT[c] = new T3.MeshLambertMaterial({ color: c })), vcm = (b) => MT['vc' + b] || (MT['vc' + b] = b ? new T3.MeshBasicMaterial({ vertexColors: true }) : new T3.MeshLambertMaterial({ vertexColors: true }));
  const C = { cream: '#e2dacb', terra: '#b98a72', rose: '#d9a39a', sand: '#d4c8b2', grey: '#c2bbb0', stone: '#cfc6b6', red: '#e23a32', white: '#f6f2ea', yellow: '#ffc72a', blue: '#2f7fe0', cyan: '#3ad0e8', green: '#36b06a', pink: '#ff7ab8', purple: '#8a5ae0', orange: '#ff8a2a', gold: '#e8b43a', navy: '#24344f', iron: '#3a4048', mint: '#7fe0c0', lilac: '#c8a8f0' };
  const BAL = [C.red, C.yellow, C.blue, C.green, C.pink, C.purple, C.orange, '#ffffff'];
  const STRIPES = [[C.red, C.white], [C.blue, C.white], [C.yellow, C.red], [C.green, C.white], [C.pink, C.white], [C.purple, C.yellow], [C.cyan, C.white]];
  const SCL = 1.45;   // ennemis agrandis (la fusee garde sa taille)
  const foe = (S, type, dc, lx, y, o) => foe0(S, type, dc, lx, y, Object.assign({ scale: (CC.Roster && CC.Roster.scale ? CC.Roster.scale(type) : 1) * SCL }, o || {}));
  const on3 = () => !!(EVO.stage && CC.game && EVO.stage(CC.game) === 3);

  // ---------- geometrie fusionnee a couleurs de sommet (un manege = 1 ou 2 appels de dessin) ----------
  // piece : { g: geometrie neuve, c: couleur | st: [couleurs] (bandes verticales selon l'angle autour de Y, n quartiers), p, r, s }
  const _m4 = new T3.Matrix4(), _q = new T3.Quaternion(), _e = new T3.Euler(), _v = new T3.Vector3(), _s = new T3.Vector3(), _c = new T3.Color();
  function bake(parts, basic) {
    const P = [], N = [], Cc = [];
    for (const q of parts) {
      const g = q.g.index ? q.g.toNonIndexed() : q.g, pa = g.attributes.position.array, na = g.attributes.normal.array, n = pa.length / 3, cols = new Float32Array(n * 3);
      for (let i = 0; i < n; i += 3) {
        if (q.st) { const cx = (pa[i * 3] + pa[i * 3 + 3] + pa[i * 3 + 6]) / 3, cz = (pa[i * 3 + 2] + pa[i * 3 + 5] + pa[i * 3 + 8]) / 3, a = Math.atan2(cx, cz) + Math.PI, k = Math.floor(a / (2 * Math.PI) * (q.n || 16) + 1e-4) % q.st.length; _c.set(q.st[k]); } else _c.set(q.c);
        for (let j = 0; j < 3; j++) { cols[(i + j) * 3] = _c.r; cols[(i + j) * 3 + 1] = _c.g; cols[(i + j) * 3 + 2] = _c.b; }
      }
      const r = q.r || [0, 0, 0], s = q.s || [1, 1, 1]; _m4.compose(_v.set(q.p[0], q.p[1], q.p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(s[0], s[1], s[2])); g.applyMatrix4(_m4);
      for (let i = 0; i < pa.length; i++) { P.push(pa[i]); N.push(na[i]); Cc.push(cols[i]); }
      if (g !== q.g) g.dispose(); q.g.dispose();
    }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(Cc, 3)); geo.computeBoundingSphere();
    const m = new T3.Mesh(geo, vcm(basic)); m.castShadow = !basic; m.receiveShadow = !basic; return m;
  }
  const BX = (w, h, d) => new T3.BoxGeometry(w, h, d), CY = (rt, rb, h, n, open) => new T3.CylinderGeometry(rt, rb, h, n || 16, 1, !!open), SP = (r, a, b) => new T3.SphereGeometry(r, a || 12, b || 9), CO = (r, h, n) => new T3.ConeGeometry(r, h, n || 16);
  const TO = (R, t, a, b) => new T3.TorusGeometry(R, t, a || 6, b || 32);
  const solid = (S, dc, lx, w, h, dd, y0) => S.bx(dc, lx, (y0 || 0) + h / 2, w, h, dd, 'col:#000000', undefined, true, { render: false });

  // ---------- TEXTURES DE PAVAGE dessinees par le code (gris neutres : la couleur de chaque dalle vient du sommet) ----------
  if (CC.Textures && CC.Textures.def) {
    const rr = (g, x, y, w, h, k) => { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + w - k, y); g.quadraticCurveTo(x + w, y, x + w, y + k); g.lineTo(x + w, y + h - k); g.quadraticCurveTo(x + w, y + h, x + w - k, y + h); g.lineTo(x + k, y + h); g.quadraticCurveTo(x, y + h, x, y + h - k); g.lineTo(x, y + k); g.quadraticCurveTo(x, y, x + k, y); g.closePath(); };
    const speck = (g, w, h, r, n) => { for (let k = 0; k < n; k++) { const v = r() < 0.5 ? 0 : 255; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.05 + r() * 0.07) + ')'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1 + Math.floor(r() * 2), 1 + Math.floor(r() * 2)); } };
    // petits paves (0,5 x 0,25 m) en rangs decales, bords arrondis, joints sombres
    CC.Textures.def('foirePaves', (g, w, h, r) => { g.fillStyle = '#6e6862'; g.fillRect(0, 0, w, h); const sw = 32, sh = 16;
      for (let j = 0; j < h / sh; j++) { const off = (j % 2) * sw / 2; for (let i = -1; i <= w / sw; i++) { const x = i * sw + off, y = j * sh, v = 196 + Math.floor(r() * 46); g.fillStyle = 'rgb(' + v + ',' + (v - 3) + ',' + (v - 8) + ')'; rr(g, x + 1.5, y + 1.5, sw - 3, sh - 3, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x + 4, y + 2.5, sw - 8, 1.5); g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x + 4, y + sh - 4, sw - 8, 1.5); } }
      speck(g, w, h, r, 900); }, [4, 4], [256, 256], true);
    // grandes dalles (1 x 1 m) a joints fins, quelques dalles fendues ou d'une autre teinte
    CC.Textures.def('foireDalles', (g, w, h, r) => { g.fillStyle = '#77716a'; g.fillRect(0, 0, w, h); const s = 64;
      for (let j = 0; j < h / s; j++) for (let i = 0; i < w / s; i++) { const v = 205 + Math.floor(r() * 32), x = i * s, y = j * s; g.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')'; g.fillRect(x + 2, y + 2, s - 4, s - 4); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(x + 3, y + 3, s - 6, 2); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(x + 3, y + s - 5, s - 6, 2);
        if (r() < 0.12) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 6 + r() * 20, y + 3); g.lineTo(x + 20 + r() * 20, y + 30); g.lineTo(x + 10 + r() * 40, y + s - 3); g.stroke(); } }
      speck(g, w, h, r, 1200); }, [4, 4], [256, 256], true);
    // planches de bois (promenade) : lattes de 0,25 m dans le sens de la marche, joints decales, veines
    CC.Textures.def('foirePlanches', (g, w, h, r) => { g.fillStyle = '#5a4a3a'; g.fillRect(0, 0, w, h); const lw = 16;
      for (let i = 0; i < w / lw; i++) { let y = -Math.floor(r() * 120); while (y < h) { const len = 70 + Math.floor(r() * 110), v = 178 + Math.floor(r() * 50); g.fillStyle = 'rgb(' + v + ',' + (v - 6) + ',' + (v - 16) + ')'; g.fillRect(i * lw + 1, y + 1, lw - 2, len - 2); g.fillStyle = 'rgba(80,50,20,0.18)'; for (let k = 0; k < 3; k++) g.fillRect(i * lw + 3 + Math.floor(r() * (lw - 6)), y + 3, 1, len - 6); g.fillStyle = 'rgba(40,30,20,0.5)'; g.fillRect(i * lw + 4, y + 4, 2, 2); g.fillRect(i * lw + lw - 6, y + len - 6, 2, 2); y += len; } }
      speck(g, w, h, r, 500); }, [4, 4], [256, 256], true);
    // beton coule (grandes plaques de 4 m, joints, taches)
    CC.Textures.def('foireBeton', (g, w, h, r) => { g.fillStyle = '#d8d6d0'; g.fillRect(0, 0, w, h); for (let k = 0; k < 40; k++) { const v = 190 + Math.floor(r() * 50); g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v - 4) + ',0.35)'; g.beginPath(); g.arc(r() * w, r() * h, 6 + r() * 30, 0, 6.3); g.fill(); }
      g.fillStyle = '#8a8882'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(w / 2, 0, 1, h); g.fillRect(0, h / 2, w, 1); speck(g, w, h, r, 2200); }, [4, 4], [256, 256], true);
    // asphalte colore (grain fin, ou la couleur vient du sommet)
    CC.Textures.def('foireAsphalte', (g, w, h, r) => { g.fillStyle = '#d4d2ce'; g.fillRect(0, 0, w, h); for (let k = 0; k < 5000; k++) { const v = 120 + Math.floor(r() * 120); g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.5)'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1 + Math.floor(r() * 2), 1 + Math.floor(r() * 2)); } }, [4, 4], [256, 256], true);
    // ecailles (paves en eventail) pour les places
    CC.Textures.def('foireEventail', (g, w, h, r) => { g.fillStyle = '#6e6862'; g.fillRect(0, 0, w, h); const R = 64;
      for (let j = -1; j <= h / (R / 2) + 1; j++) for (let i = -1; i <= w / R + 1; i++) { const cx = i * R + (j % 2 ? R / 2 : 0), cy = j * R / 2;
        for (let ring = 5; ring >= 1; ring--) { const rad = ring * R / 5.4; const nS = 3 + ring * 2; for (let k = 0; k < nS; k++) { const a0 = Math.PI + k * Math.PI / nS, a1 = a0 + Math.PI / nS, v = 192 + Math.floor(r() * 48); g.fillStyle = 'rgb(' + v + ',' + (v - 3) + ',' + (v - 8) + ')'; g.beginPath(); g.arc(cx, cy, rad - 1.2, a0 + 0.04, a1 - 0.04); g.arc(cx, cy, Math.max(0.5, rad - R / 5.4 + 1.2), a1 - 0.04, a0 + 0.04, true); g.closePath(); g.fill(); } } }
      speck(g, w, h, r, 900); }, [4, 4], [256, 256], true);
  }

  // ---------- LE PAVAGE : quadrillage de 4 m sans joint (la texture fait les paves), une couleur par case (mosaiques) ----------
  // colFn(d, lx) -> [couleur, texture] ou null ; les UV suivent le couloir (les rangs de paves suivent l'allee)
  function pave(S, a, b, x0, x1, colFn) {
    const T = S.T, L = {}, c = new T3.Color(), tile = 4;
    for (let d = a; d < b - 0.01; d += tile) {
      const d2 = Math.min(b, d + tile);
      for (let x = x0; x < x1 - 0.01; x += tile) {
        const q = colFn(d + tile / 2, x + tile / 2); if (!q) continue;
        const key = q[1] || 'foireDalles', o = L[key] || (L[key] = { P: [], N: [], Cc: [], UV: [], I: [], n: 0 });
        c.set(q[0]).multiplyScalar(0.96 + 0.07 * hsh(Math.round(d * 0.25), Math.round(x * 0.25)));
        for (const [dd, xx] of [[d, x], [d, x + tile], [d2, x], [d2, x + tile]]) { const p = T.at(dd, xx, 0.06); o.P.push(p[0], p[1], p[2]); o.N.push(0, 1, 0); o.Cc.push(c.r, c.g, c.b); o.UV.push(xx / tile, dd / tile); }
        o.I.push(o.n, o.n + 2, o.n + 1, o.n + 1, o.n + 2, o.n + 3); o.n += 4;
      }
    }
    for (const key of Object.keys(L)) {
      const o = L[key], P = o.P, I = o.I;
      { const A = new T3.Vector3(P[0], P[1], P[2]), B = new T3.Vector3(P[6], P[7], P[8]), Cq = new T3.Vector3(P[3], P[4], P[5]); if (B.sub(A).cross(Cq.sub(A)).y < 0) for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } }
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(o.N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(o.Cc, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(o.UV, 2)); g.setIndex(I);
      S.b.batch(key).shadow = false; S.b.addGeometry(g, new T3.Vector3(), new T3.Quaternion(), null, key, undefined, [1, 1]); g.dispose();
    }
  }
  const W0 = 170;
  const paveScene = (S, fn, w) => { for (let dc = S.d0; dc < S.d1 - 0.01; dc += 20) S.item(dc + 10, () => pave(S, dc, Math.min(S.d1, dc + 20), -(w || W0), w || W0, fn)); };
  const JOINT = new T3.Color('#857a6b'), ASPH = new T3.Color('#4e5157');
  const groundJ = (W) => (d, lx, c) => { const k = 1 - ss(W, W + 14, Math.abs(lx)); if (k > 0) c.lerp(JOINT, k); };
  // mosaique en etoile autour d'un centre (lisible du ciel)
  const rosace = (dd, x, dC, xC, R, cA, cB, cC) => { const rr = Math.hypot(dd - dC, x - xC); if (rr > R) return null; const a = Math.atan2(dd - dC, x - xC), ring = Math.floor(rr / 4), star = Math.abs(Math.cos(a * 4)) > 0.55 + 0.4 * (rr / R); if (rr < 6) return [cC, 'foireDalles']; if (ring === Math.floor(R / 4) - 1) return [cA, 'foireDalles']; return [star ? cB : (ring % 2 ? cA : C.cream), 'foireEventail']; };

  // ---------- petits elements statiques ----------
  const lampPost = (S, dc, lx) => { S.cyl(dc, lx, 0, 0.8, 0.8, 'col:#2c4a3a', undefined, 8, 0.8, false); S.cyl(dc, lx, 0.8, 0.26, 10.4, 'col:#2c4a3a', undefined, 8, 0.2, false); S.bx(dc, lx, 10.8, 3.8, 0.26, 0.26, 'col:#2c4a3a', undefined, false); for (const o of [-1.8, 0, 1.8]) S.ball(dc, lx + o, o ? 10.3 : 11.8, 0.6, 'emis:#fff1c8', undefined, false); S.glow(dc, lx, 11, '#ffe8b0', 12); };
  function garland(S, dc, xa, xb, y, r) {   // guirlande de fanions et d'ampoules en travers (sans collision)
    const n = Math.max(6, Math.round((xb - xa) / 2.2)), sag = (xb - xa) * 0.07;
    for (let k = 0; k <= n; k++) { const u = k / n, x = xa + (xb - xa) * u, yy = y - sag * 4 * u * (1 - u);
      if (k < n) S.bx(dc, x + (xb - xa) / n / 2, yy, (xb - xa) / n + 0.05, 0.08, 0.08, 'col:#333333', undefined, false, { shadow: false });
      if (k % 2) S.bxr(dc, x, yy - 0.9, 1.25, 1.25, 0.05, 'col:' + BAL[(k >> 1) % 7], undefined, 45, 0, false); else S.bx(dc, x, yy - 0.25, 0.4, 0.4, 0.4, 'emis:#fff0c0', undefined, false, { shadow: false }); }
  }
  const barrier = (S, dc, lx) => { for (let k = 0; k < 3; k++) S.bx(dc + (k - 1) * 5.4, lx, 0.9, 1.6, 1.8, 5.2, 'col:' + (k % 2 ? C.white : C.red), undefined, true); };
  const crates = (S, dc, lx, r) => { for (let k = 0; k < 4; k++) S.bx(dc + r.between([-3, 3]), lx + r.between([-3, 3]), 1.1 + (k === 3 ? 2.2 : 0), 2.2, 2.2, 2.2, 'col:#6b6a44', undefined, true); };
  const balloonBunch = (S, dc, lx, y, r, k) => { k = k || 1; for (let i = 0; i < 6; i++) { const a = i * 1.047, bx = lx + Math.cos(a) * 1.1 * k, bd = dc + Math.sin(a) * 1.1 * k, by = y + 3.4 * k + (i % 2) * 0.9 * k; S.ball(bd, bx, by, 0.95 * k, 'col:' + pk(r, BAL), undefined, false, 1.18); } S.bx(dc, lx, y + 1.5 * k, 0.06, 3 * k, 0.06, 'col:#dddddd', undefined, false, { shadow: false }); };
  const parasol = (S, dc, lx, c, k) => { S.cyl(dc, lx, 0, 0.12 * k, 3 * k, 'col:#eeeeee', undefined, 6, 0.12 * k, false); S.cyl(dc, lx, 2.6 * k, 2.6 * k, 0.9 * k, 'col:' + c, undefined, 10, 0.12 * k, false); S.cyl(dc, lx, 0.9 * k, 1.1 * k, 0.12 * k, 'col:#ffffff', undefined, 10, 1.1 * k, false); };

  // ---------- LES STANDS (a l'echelle K, face au cote f : +1 = vers +lx) ----------
  const WALLC = ['#f3ead8', '#ffe9b8', '#d9ecf7', '#f7dbe6', '#e3f0d9'];
  function stand(S, dc, lx, r, type, f, K) {
    K = K || 2; const st = pk(r, STRIPES), wc = pk(r, WALLC), L = 9.2;
    const B = (z, x, y, w, h, dd, m, col, o2) => S.bx(dc + z * K, lx + f * x * K, y * K, w * K, h * K, dd * K, m, undefined, col, o2);
    const BR = (z, x, y, w, h, dd, m, roll) => S.bxr(dc + z * K, lx + f * x * K, y * K, w * K, h * K, dd * K, m, undefined, roll, 0, false);
    const BL = (z, x, y, rad, m) => S.ball(dc + z * K, lx + f * x * K, y * K, rad * K, m, undefined, false);
    const CYL = (z, x, y, rad, h, m, rt) => S.cyl(dc + z * K, lx + f * x * K, y * K, rad * K, h * K, m, undefined, 8, rt === undefined ? rad * K : rt * K, false);
    B(0, 0, 0.2, 6.6, 0.4, L + 0.4, 'col:#cfc4b2', true);
    B(0, -2.95, 2.4, 0.35, 4.4, L, 'col:' + wc, true);
    for (const e of [-1, 1]) B(e * (L / 2 - 0.15), 0, 2.4, 6.2, 4.4, 0.3, 'col:' + wc, true);
    B(0, 2.6, 0.95, 0.9, 1.5, L - 0.6, 'col:' + st[0], true); B(0, 2.6, 1.75, 1.15, 0.12, L - 0.4, 'col:#f8f4ec', false);
    // toit : pignon a deux pans rayes (vu d'en haut : des bandes de couleur), faitage dore, fanion
    for (let k = 0; k < 6; k++) { const z = -L / 2 - 0.25 + (k + 0.5) * (L + 0.5) / 6; for (const s of [-1, 1]) BR(z, s * 1.75, 5.35, 3.9, 0.18, (L + 0.5) / 6 + 0.02, 'col:' + st[(k + (s > 0 ? 1 : 0)) % 2], s * f * 28); }
    B(0, 0, 6.3, 0.35, 0.35, L + 0.6, 'col:' + C.gold, false); CYL(L / 2, 0, 6.4, 0.06, 2.2, 'col:#555555'); B(L / 2 + 0.5, 0, 8.1, 0.04, 0.8, 1.1, 'col:' + pk(r, BAL), false);
    // auvent raye incline vers l'avant + festons
    for (let k = 0; k < 8; k++) { const z = -L / 2 + (k + 0.5) * L / 8; BR(z, 4.1, 4.15, 2.6, 0.1, L / 8 + 0.02, 'col:' + st[k % 2], -f * 22); B(z, 5.3, 3.35, 0.08, 0.5, L / 8 * 0.8, 'col:' + st[(k + 1) % 2], false, { shadow: false }); }
    // enseigne avec ampoules
    B(0, 2.2, 5.9, 0.35, 2.1, L * 0.78, 'col:' + st[1], false); B(0, 2.4, 5.9, 0.1, 1.5, L * 0.66, 'col:' + pk(r, [C.navy, C.red, C.blue, C.purple]), false, { shadow: false });
    for (let k = 0; k < 9; k++) for (const y of [4.95, 6.85]) B(-L * 0.36 + k * L * 0.09, 2.42, y, 0.16, 0.2, 0.2, 'emis:#fff0b8', false, { shadow: false });
    if (type === 'tir') { for (let k = 0; k < 5; k++) { const z = -3.2 + k * 1.6; B(z, -2.6, 2.8, 0.1, 1.1, 1.1, 'col:' + C.red, false); B(z, -2.54, 2.8, 0.1, 0.72, 0.72, 'col:' + C.white, false); B(z, -2.48, 2.8, 0.1, 0.34, 0.34, 'col:' + C.red, false); } }
    else if (type === 'barbe') { for (let k = 0; k < 6; k++) BL(-3 + k * 1.2, 2.5, 2.35, 0.36, 'col:#ffb3d9'); BL(0, 0, 8.6, 1.4, 'col:#ffb3d9'); }
    else if (type === 'chamboule') { for (const z0 of [-2.4, 2.4]) for (let j = 0; j < 3; j++) for (let k = 0; k < 3 - j; k++) CYL(z0 + (k - (3 - j - 1) / 2) * 0.56, -2.0, 1.5 + j * 0.56, 0.24, 0.55, 'col:' + pk(r, [C.red, C.yellow, C.blue, C.green])); }
    else if (type === 'glace') { CYL(0, 0, 6.6, 0.15, 2.4, 'col:#d9a55b', 1.0); BL(0, 0, 9.4, 1.05, 'col:' + pk(r, ['#ffd0e4', '#fff3c8', '#c8f0d8'])); BL(0, 0, 10.3, 0.3, 'col:' + C.red); }
    else { for (let j = 0; j < 3; j++) { B(0, -2.25, 1.4 + j * 1.0, 0.7, 0.08, L - 1.4, 'col:#c9b08a', false); for (let k = 0; k < 6; k++) { const z = -3.2 + k * 1.28; if (k % 2) BL(z, -2.15, 1.85 + j * 1.0, 0.36, 'col:' + pk(r, BAL)); else B(z, -2.15, 1.8 + j * 1.0, 0.6, 0.7, 0.6, 'col:' + pk(r, BAL), false); } } }
    if (r() < 0.5) balloonBunch(S, dc + (r() < 0.5 ? -1 : 1) * 3.6 * K, lx + f * 2.9 * K, 4.9 * K, r, K * 0.6);
  }
  const STYPES = ['tir', 'barbe', 'chamboule', 'lots', 'glace'];
  // village de stands : deux rangees face a face autour d'une petite place (parasols, ballons au centre), un sol en mosaique
  function village(S, dc, lx, r) {
    const K = 2.1, gap = 15, n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) { const z = dc + (i - (n - 1) / 2) * 9.9 * K; stand(S, z, lx - gap, r, pk(r, STYPES), 1, K); stand(S, z, lx + gap, r, pk(r, STYPES), -1, K); }
    for (let k = 0; k < 3; k++) parasol(S, dc + (k - 1) * 12, lx + (k % 2 ? 3 : -3), pk(r, BAL), 1.6);
    balloonBunch(S, dc, lx, 0, r, 1.6);
  }

  // ---------- GRANDS BATIMENTS (15 a 90 m : beaux vus d'en haut : toits, domes, enseignes, ampoules) ----------
  function clockTower(S, dc, lx) {   // la tour de l'horloge (90 m), repere du parc
    S.reserve(dc, lx, 34, 34);
    S.item(dc, () => {
      S.bx(dc, lx, 1.2, 30, 2.4, 30, 'col:' + C.stone, undefined, true); S.bx(dc, lx, 2.9, 26, 1, 26, 'col:' + C.cream, undefined, true);
      S.bx(dc, lx, 11.4, 22, 16, 22, 'col:' + C.cream, undefined, true);
      for (const s of [-1, 1]) { S.bx(dc, lx + s * 11.1, 9.4, 0.4, 10, 7, 'col:#4a3a5a', undefined, false); S.bx(dc + s * 11.1, lx, 9.4, 7, 10, 0.4, 'col:#4a3a5a', undefined, false); S.bx(dc, lx + s * 11.2, 15, 0.4, 1, 8, 'col:' + C.gold, undefined, false); S.bx(dc + s * 11.2, lx, 15, 8, 1, 0.4, 'col:' + C.gold, undefined, false); }
      S.bx(dc, lx, 19.8, 23.4, 1.2, 23.4, 'col:' + C.red, undefined, false);
      S.bx(dc, lx, 34, 15, 28, 15, 'col:' + C.white, undefined, true);
      for (let y = 24; y < 48; y += 6) S.bx(dc, lx, y, 15.6, 1, 15.6, 'col:' + (y % 12 ? C.blue : C.red), undefined, false);
      S.bx(dc, lx, 53, 18, 10, 18, 'col:' + C.navy, undefined, true);
      for (const s of [-1, 1]) { S.bx(dc, lx + s * 9.1, 53, 0.3, 8, 8, 'col:' + C.gold, undefined, false); S.bx(dc, lx + s * 9.25, 53, 0.3, 7, 7, 'col:#fff8e8', undefined, false); S.bx(dc + 1.2, lx + s * 9.4, 54.4, 0.2, 0.5, 3.0, 'col:#222222', undefined, false); S.bx(dc, lx + s * 9.4, 54.6, 0.2, 3.6, 0.5, 'col:#222222', undefined, false);
        S.bx(dc + s * 9.1, lx, 53, 8, 8, 0.3, 'col:' + C.gold, undefined, false); S.bx(dc + s * 9.25, lx, 53, 7, 7, 0.3, 'col:#fff8e8', undefined, false); S.bx(dc + s * 9.4, lx, 54.6, 0.5, 3.6, 0.2, 'col:#222222', undefined, false); }
      S.bx(dc, lx, 58.6, 20, 1.2, 20, 'col:' + C.gold, undefined, false);
      for (const a of [-1, 1]) for (const b of [-1, 1]) S.bx(dc + a * 7.5, lx + b * 7.5, 63, 1.6, 8, 1.6, 'col:' + C.white, undefined, true);
      S.bx(dc, lx, 67.4, 19, 1, 19, 'col:' + C.red, undefined, false);
      S.ball(dc, lx, 68, 9, 'col:' + C.red, undefined, true, 1.15); S.cyl(dc, lx, 77, 2.2, 4, 'col:' + C.gold, undefined, 10, 2.2, false); S.cyl(dc, lx, 81, 2.4, 12, 'col:' + C.gold, undefined, 10, 0.05, false);
      S.cyl(dc, lx, 92, 0.15, 6, 'col:#555555', undefined, 6, 0.15, false); S.bx(dc, lx + 2, 96.6, 4, 2.4, 0.1, 'col:' + C.yellow, undefined, false);
      for (const a of [-1, 1]) for (const b of [-1, 1]) for (let y = 5; y < 66; y += 2.4) S.bx(dc + a * (y < 20 ? 11.3 : y < 48 ? 7.7 : 9.2), lx + b * (y < 20 ? 11.3 : y < 48 ? 7.7 : 9.2), y, 0.35, 0.35, 0.35, 'emis:#fff0b8', undefined, false, { shadow: false });
      S.glow(dc, lx, 70, '#ffd890', 40);
    });
  }
  function candyShop(S, dc, lx, f, r) {   // la confiserie geante : facade rose, auvent raye, cupcake geant et sucettes sur le toit
    S.reserve(dc, lx, 34, 40);
    S.item(dc, () => {
      const H = 16; S.bx(dc, lx, H / 2, 26, H, 34, 'col:#ffb6d0', undefined, true);
      S.bx(dc, lx, H + 0.6, 27, 1.2, 35, 'col:' + C.white, undefined, true); for (let k = 0; k < 17; k++) S.ball(dc - 16 + k * 2, lx + f * 13.3, H + 0.2, 0.9, 'col:' + C.white, undefined, false);
      for (let k = 0; k < 10; k++) S.bxr(dc - 15.3 + k * 3.4, lx + f * 15, 6.4, 4.2, 0.2, 3.42, 'col:' + (k % 2 ? C.white : C.pink), undefined, -f * 24, 0, false);
      for (const z of [-11, -4, 4, 11]) { S.bx(dc + z, lx + f * 13.05, 3.2, 0.2, 6, 4.4, 'glassWarm', undefined, false); S.bx(dc + z, lx + f * 13.1, 10.5, 0.3, 3.4, 4, 'col:' + C.white, undefined, false); }
      S.bx(dc, lx + f * 13.3, H + 4, 0.6, 5, 22, 'col:' + C.navy, undefined, false); S.bx(dc, lx + f * 13.65, H + 4, 0.2, 3.4, 19, 'col:' + C.pink, undefined, false);
      for (let k = 0; k < 14; k++) for (const y of [H + 1.8, H + 6.2]) S.bx(dc - 10.4 + k * 1.6, lx + f * 13.65, y, 0.3, 0.4, 0.4, 'emis:#fff0b8', undefined, false, { shadow: false });
      // le cupcake geant sur le toit
      S.cyl(dc, lx, H + 1.2, 8, 6, 'col:#c87a4a', undefined, 18, 9.5, true); S.ball(dc, lx, H + 8.6, 9.6, 'col:#fff0f4', undefined, true, 0.55); S.ball(dc, lx, H + 12.6, 6.4, 'col:#ffc8dc', undefined, false, 0.6); S.ball(dc, lx, H + 16.4, 2, 'col:' + C.red, undefined, false);
      for (let k = 0; k < 12; k++) { const a = k * 0.52; S.bx(dc + Math.cos(a) * 7.8, lx + Math.sin(a) * 7.8, H + 11, 0.5, 0.5, 1.4, 'col:' + BAL[k % 7], undefined, false); }
      // les sucettes (disques horizontaux a anneaux : beaux vus du ciel)
      for (const [z, x] of [[-13, -9], [13, -9], [13, 9]]) { S.cyl(dc + z, lx + x, H, 0.5, 12, 'col:' + C.white, undefined, 8, 0.5, false); const cs = pk(r, [[C.red, C.white, C.red], [C.blue, C.yellow, C.pink], [C.green, C.white, C.orange]]); for (let k = 0; k < 3; k++) S.cyl(dc + z, lx + x, H + 11.6 + k * 0.12, 5 - k * 1.5, 1.2, 'col:' + cs[k], undefined, 18, 5 - k * 1.5, k === 0); }
    });
  }
  function arcade(S, dc, lx, f) {   // la salle d'arcades : grand hall violet, trois domes rayes, neons, entree en arche
    S.reserve(dc, lx, 34, 50);
    S.item(dc, () => {
      const H = 18; S.bx(dc, lx, H / 2, 28, H, 46, 'col:' + C.purple, undefined, true); S.bx(dc, lx, H + 0.7, 29, 1.4, 47, 'col:' + C.gold, undefined, true);
      for (const y of [5, 12]) S.bx(dc, lx + f * 14.1, y, 0.3, 0.6, 44, 'emis:' + (y < 8 ? '#5af0ff' : '#ff5ad8'), undefined, false, { shadow: false });
      S.bx(dc, lx + f * 14.2, 7, 0.4, 12, 12, 'col:#2a1a48', undefined, false); S.bx(dc, lx + f * 14.4, 13.6, 0.4, 1.2, 13, 'col:' + C.gold, undefined, false);
      for (const z of [-15, 0, 15]) { const c = z < 0 ? C.yellow : z > 0 ? C.cyan : C.red; S.cyl(dc + z, lx, H + 1.4, 6, 3, 'col:' + C.white, undefined, 16, 6, true); S.ball(dc + z, lx, H + 4.4, 6.2, 'col:' + c, undefined, true, 1.25); S.cyl(dc + z, lx, H + 11.6, 0.9, 6, 'col:' + C.gold, undefined, 8, 0.05, false); S.ball(dc + z, lx, H + 18, 0.8, 'emis:#fff0b8', undefined, false); for (let k = 0; k < 8; k++) { const a = k * 0.785; S.bx(dc + z + Math.cos(a) * 6.3, lx + Math.sin(a) * 6.3, H + 3.2, 0.4, 0.4, 0.4, 'emis:#fff0b8', undefined, false, { shadow: false }); } }
      S.bx(dc, lx + f * 14.4, H + 5, 0.6, 7, 30, 'col:' + C.navy, undefined, false); S.bx(dc, lx + f * 14.75, H + 5, 0.2, 4.4, 26, 'emis:#ff5ad8', undefined, false, { shadow: false });
    });
  }
  function theatre(S, dc, lx, f) {   // le theatre : colonnes, fronton, marquise lumineuse
    S.reserve(dc, lx, 30, 36);
    S.item(dc, () => {
      const H = 22; S.bx(dc, lx, H / 2, 24, H, 32, 'col:' + C.cream, undefined, true); S.bx(dc, lx, H + 1, 25, 2, 33, 'col:' + C.red, undefined, true);
      for (let k = 0; k < 4; k++) S.bx(dc, lx, H + 2.6 + k * 1.6, 25 - k * 5, 1.6, 33 - k * 6, 'col:' + (k % 2 ? C.gold : C.red), undefined, false);
      S.bx(dc, lx + f * 13.8, 1, 4, 2, 30, 'col:' + C.stone, undefined, true);
      for (let k = 0; k < 6; k++) S.cyl(dc - 12.5 + k * 5, lx + f * 14, 2, 0.9, 17, 'col:' + C.white, undefined, 10, 0.8, true);
      for (let k = 0; k < 3; k++) S.bx(dc, lx + f * 14, 19.6 + k * 1.4, 1.4, 1.4, 30 - k * 9, 'col:' + C.white, undefined, false);
      S.bx(dc, lx + f * 16, 7.5, 4, 0.6, 18, 'col:' + C.red, undefined, false); S.bx(dc, lx + f * 16.4, 8.6, 0.3, 1.8, 18, 'col:' + C.navy, undefined, false);
      for (let k = 0; k < 16; k++) for (const y of [7.8, 9.4]) S.bx(dc - 8.4 + k * 1.12, lx + f * 16.6, y, 0.25, 0.3, 0.3, 'emis:#fff0b8', undefined, false, { shadow: false });
    });
  }
  function foodCourt(S, dc, lx, r) {   // l'espace restauration : des dizaines de parasols colores (beaux vus du ciel) et un kiosque
    S.item(dc, () => {
      for (let i = 0; i < 18; i++) { const a = i * 2.39996, rad = 6 + 2.6 * Math.sqrt(i) * 2.2; parasol(S, dc + Math.cos(a) * rad, lx + Math.sin(a) * rad, BAL[i % 7], 1.5); }
      S.cyl(dc, lx, 0, 4.4, 4.4, 'col:' + C.white, undefined, 12, 4.4, true); S.cyl(dc, lx, 4.4, 6, 4, 'col:' + C.red, undefined, 12, 0.3, false); S.ball(dc, lx, 8.8, 0.8, 'col:' + C.gold, undefined, false);
    });
  }
  // tentes pointues rayees (un seul maillage par groupe)
  function tents(S, dc, lx, r, n) {
    if (!S.inClip(dc)) return; const parts = [];
    for (let i = 0; i < (n || 4); i++) { const a = i * 2.4 + r() * 0.6, rad = i ? 12 + r() * 8 : 0, x = Math.sin(a) * rad, z = Math.cos(a) * rad, R = r.between([4.5, 7.5]), st = pk(r, STRIPES), h = R * 0.9;
      parts.push({ g: CY(R, R, h, 12, true), st, n: 12, p: [x, h / 2, z] }, { g: CO(R + 0.6, R * 1.1, 12), st: [st[1], st[0]], n: 12, p: [x, h + R * 0.55, z] }, { g: CY(0.1, 0.1, 3, 5), c: '#555555', p: [x, h + R * 1.1 + 1.2, z] }, { g: BX(0.08, 1.2, 1.8), c: pk(r, BAL), p: [x, h + R * 1.1 + 2.2, z + 0.9] }); }
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 0, 0); solid(S, dc, lx, 30, 10, 30);
  }

  // ---------- LE REMPLISSAGE : petits ensembles poses partout entre le chemin et les grands maneges (jamais de grand vide) ----------
  const TRs = () => CC.Trees;
  function planterTree(S, dc, lx, r) { S.cyl(dc, lx, 0, 3.2, 1.3, 'col:' + C.stone, undefined, 12, 3.2, true); S.cyl(dc, lx, 1.3, 2.9, 0.2, 'col:#5a8a3a', undefined, 12, 2.9, false); const p = S.at(dc, lx, 1.4); if (TRs()) TRs().broadleaf(S.b, p[0], p[1], p[2], r.between([9, 14]), r, {}); }
  function kiosk(S, dc, lx, r) { const st = pk(r, STRIPES); S.cyl(dc, lx, 0, 4, 5, 'col:' + C.white, undefined, 12, 4, true); S.cyl(dc, lx, 1.4, 4.08, 1.6, 'col:' + st[0], undefined, 12, 4.08, false); S.cyl(dc, lx, 5, 6, 4, 'col:' + st[1], undefined, 12, 0.3, false); S.cyl(dc, lx, 5, 6.1, 0.6, 'col:' + st[0], undefined, 12, 6.1, false); S.ball(dc, lx, 9.2, 0.7, 'col:' + C.gold, undefined, false); for (let k = 0; k < 10; k++) { const a = k * 0.628; S.ball(dc + Math.cos(a) * 6.1, lx + Math.sin(a) * 6.1, 4.8, 0.3, 'emis:#fff0b8', undefined, false); } }
  function foodTruck(S, dc, lx, r) { const c = pk(r, [C.pink, C.yellow, C.cyan, C.orange, C.mint]); S.bx(dc, lx, 2.6, 4, 4, 9, 'col:' + c, undefined, true); S.bx(dc + 3.6, lx, 1.6, 3.8, 2.4, 2.2, 'col:' + C.white, undefined, true); S.bx(dc, lx, 4.8, 4.2, 0.4, 9.2, 'col:' + C.white, undefined, false); S.bx(dc, lx, 6.2, 0.4, 2.4, 5, 'col:' + C.navy, undefined, false); S.ball(dc, lx, 8.6, 1.4, 'col:' + pk(r, BAL), undefined, false); for (const z of [-2.6, 2.6]) for (const s of [-1, 1]) S.cyl(dc + z, lx + s * 2.1, 0, 0.7, 0.5, 'col:#222222', undefined, 8, 0.7, false); parasol(S, dc - 2, lx + (lx > 0 ? -5 : 5), pk(r, BAL), 1.2); }
  function flagPoles(S, dc, lx, r) { for (let k = 0; k < 3; k++) { const z = dc + (k - 1) * 4, h = 14 + k * 3; S.cyl(z, lx, 0, 0.18, h, 'col:#e8e8e8', undefined, 6, 0.14, false); S.bx(z, lx + 1.6, h - 1.4, 3.2, 2, 0.08, 'col:' + pk(r, BAL), undefined, false); } S.cyl(dc, lx, 0, 3.2, 0.5, 'col:' + C.stone, undefined, 10, 3.2, false); }
  function benches(S, dc, lx) { for (const z of [-3, 3]) { S.bx(dc + z, lx, 0.6, 1, 0.2, 3.4, 'col:#8a5a34', undefined, false); S.bx(dc + z, lx + 0.45, 1.1, 0.15, 0.9, 3.4, 'col:#8a5a34', undefined, false); } S.bx(dc, lx, 0.7, 1, 1.4, 1, 'col:#2c4a3a', undefined, true); }
  const FILL = [planterTree, planterTree, kiosk, foodTruck, flagPoles, benches, kiosk];
  function fillers(S, x0, x1, step) {   // a appeler APRES les reservations des grands objets
    for (const sg of [-1, 1]) S.rows(S.d0 + 8, S.d1 - 8, step || 22, 0.5, (dc) => { const r = S.item_rng(Math.round(dc * 7 + sg * 13)), lx = S.lane(dc).lx + sg * (x0 + r() * (x1 - x0)), fn = FILL[Math.floor(r() * FILL.length)]; S.place(dc, lx, 12, 12, 0, 10, (rr) => fn(S, dc, lx, rr), { vol: 400, pad: 2 }); });
  }
  // LE TELEPHERIQUE : deux gares hors du chemin, un cable en travers a 50 m, des cabines qui avancent (collision)
  function cableCar(S, dc, r) {
    S.item(dc, () => {
      const Lc = S.lane(dc).lx, X = 120, H = 52, A = S.at(dc - 30, Lc - X, H), B2 = S.at(dc + 30, Lc + X, H);
      for (const [z, x] of [[dc - 30, Lc - X], [dc + 30, Lc + X]]) { S.bx(z, x, H / 2, 8, H, 8, 'col:' + C.white, undefined, true); S.bx(z, x, H + 3, 14, 6, 12, 'col:' + C.red, undefined, true); S.bx(z, x, H + 6.4, 15, 0.8, 13, 'col:' + C.gold, undefined, false); for (let y = 8; y < H; y += 10) S.bx(z, x, y, 8.5, 1, 8.5, 'col:' + C.blue, undefined, false); }
      const grp = new T3.Group(), dir = new T3.Vector3(B2[0] - A[0], B2[1] - A[1], B2[2] - A[2]), len = dir.length(); dir.normalize();
      const cab = new T3.Mesh(BX(0.15, 0.15, len), lam('#333333')); cab.position.set((A[0] + B2[0]) / 2, (A[1] + B2[1]) / 2 + 2, (A[2] + B2[2]) / 2); cab.lookAt(B2[0], B2[1] + 2, B2[2]); grp.add(cab);
      const cabins = []; for (let i = 0; i < 6; i++) { const c = new T3.Group(), m = bake([{ g: BX(4, 4, 4), c: BAL[i % 7], p: [0, -3, 0] }, { g: BX(4.2, 1.2, 4.2), c: C.white, p: [0, -1.2, 0] }, { g: BX(3.6, 1.4, 4.1), c: '#bfe6ff', p: [0, -2.4, 0] }, { g: BX(0.3, 2.4, 0.3), c: '#444444', p: [0, 0.6, 0] }]); c.add(m); EVO.colBox(c, 4.2, 5, 4.2, 0, -2.6, 0); grp.add(c); cabins.push(c); }
      S.b.root.add(grp); const ph = r() * 10;
      EVO.addDyn(grp, (t) => { for (let i = 0; i < cabins.length; i++) { const u = ((t * 0.035 + ph + i / cabins.length) % 1), c = cabins[i]; c.position.set(A[0] + (B2[0] - A[0]) * u, A[1] + 2 + (B2[1] - A[1]) * u - Math.sin(u * Math.PI) * 4, A[2] + (B2[2] - A[2]) * u); c.rotation.y = Math.atan2(dir.x, dir.z); } }, cabins.map((c) => c.children[1]), { near: 9999, span: 200 });
    });
  }
  // MONTAGNES RUSSES qui enjambent le chemin : rail en vagues de -150 a +150 m en travers, pylones hors du passage, collisions sur le rail
  function coasterOver(S, dc, r) {
    S.item(dc, () => {
      const Lc = S.lane(dc).lx, prof = (x) => 30 + 14 * Math.cos(x * 0.045) + 8 * Math.cos(x * 0.11), parts = [];
      for (let x = -150; x < 150; x += 4) { const y = prof(x), y2 = prof(x + 4), p = Math.atan2(y2 - y, 4); parts.push({ g: BX(4.3, 0.5, 0.6), c: C.red, p: [x + 2, y + 0.9, -1.1], r: [0, 0, p] }, { g: BX(4.3, 0.5, 0.6), c: C.red, p: [x + 2, y + 0.9, 1.1], r: [0, 0, p] }, { g: BX(0.6, 0.4, 3), c: '#444444', p: [x + 2, y + 0.5, 0], r: [0, 0, p] });
        if (x % 12 === 0 && Math.abs(x) > 26) parts.push({ g: BX(0.9, y, 0.9), c: C.white, p: [x + 2, y / 2, 0] }, { g: BX(0.6, 0.6, 3.4), c: C.white, p: [x + 2, y * 0.6, 0] });
        S.bx(dc, Lc + x + 2, y + 0.7, 4.3, 1.6, 3.2, 'col:#000000', undefined, true, { render: false }); }
      const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, Lc, 0, 0);
      const tr = new T3.Group(), cars = bake([0, 1, 2, 3].map((i) => ({ g: BX(3.6, 1.8, 2.8), c: BAL[i], p: [-i * 4.2, 1.8, 0] })).concat([{ g: BX(3.8, 0.4, 3), c: '#333333', p: [0, 0.8, 0] }])); tr.add(cars); grp.add(tr); const ph = r() * 9;
      EVO.addDyn(grp, (t) => { const u = ((t * 0.09 + ph) % 1), x = -150 + 300 * u; tr.position.set(x, prof(x), 0); tr.rotation.z = Math.atan2(prof(x + 2) - prof(x - 2), 4); }, [], { near: 1200 });
    });
  }

  // ---------- LES BALLONS PERDUS : ils montent lentement, ballottes par le vent (instancies) ----------
  function balloons(S, dc, n, r, spread) {
    if (!S.inClip(dc)) return;
    const geo = SP(1, 10, 8); geo.scale(1, 1.18, 1);
    const im = new T3.InstancedMesh(geo, MT.ball || (MT.ball = new T3.MeshLambertMaterial({ color: '#ffffff' })), n), st = new T3.InstancedMesh(BX(0.05, 2.6, 0.05), lam('#e6e6e6'), n);
    im.frustumCulled = st.frustumCulled = false; im.castShadow = true;
    const Bq = [];
    for (let i = 0; i < n; i++) { const d = dc + r.between([-60, 60]), x = (r() < 0.5 ? -1 : 1) * r.between([4, spread || 150]), p = S.at(d, x, 0); Bq.push({ x: p[0], y: p[1], z: p[2], v: r.between([1.8, 3.6]), ph: r() * 190, sw: r() * 6.28, s: r.between([1.3, 1.9]), wx: r.between([-0.2, 0.2]), wz: r.between([-0.2, 0.2]) }); im.setColorAt(i, _c.set(pk(r, BAL))); }
    const grp = new T3.Group(); grp.add(im); grp.add(st); S.b.root.add(grp);
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), pv = new T3.Vector3(), sv = new T3.Vector3(), H = 190;
    EVO.addDyn(grp, (t) => {
      for (let i = 0; i < n; i++) {
        const b = Bq[i], u = (t * b.v + b.ph) % H, k = Math.min(1, u / 3) * (1 - ss(H - 40, H, u)), x = b.x + Math.sin(t * 0.6 + b.sw) * 1.4 + u * b.wx, z = b.z + Math.cos(t * 0.5 + b.sw) * 1.4 + u * b.wz, y = b.y + 2 + u;
        q.setFromEuler(e.set(Math.sin(t * 1.1 + b.sw) * 0.14, 0, Math.cos(t * 0.9 + b.sw) * 0.14));
        m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(0.001, b.s * k))); im.setMatrixAt(i, m4);
        m4.compose(pv.set(x, y - 2.5 * b.s, z), q, sv.set(Math.max(0.001, k), Math.max(0.001, k * b.s), Math.max(0.001, k))); st.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true; st.instanceMatrix.needsUpdate = true;
    }, [], { near: 99999 });
  }

  // ---------- LES MANEGES (animes ; echelle k ; socle et mat avec collision) ----------
  function carousel(S, dc, lx, r, k) {
    if (!S.inClip(dc)) return; k = k || 1.5; const st = pk(r, STRIPES), R = 15;
    S.cyl(dc, lx, 0, (R + 1) * k, 1.0 * k, 'col:#e8dcc2', undefined, 24, (R + 1) * k, true); S.cyl(dc, lx, 1.0 * k, R * k, 0.4 * k, 'col:' + C.navy, undefined, 24, R * k, false); S.cyl(dc, lx, 1.4 * k, 1.8 * k, 11 * k, 'col:' + C.gold, undefined, 12, 1.8 * k, true);
    const parts = [{ g: CO(R + 1.5, 7, 24), st, n: 24, p: [0, 15.5, 0] }, { g: CY(R + 1.5, R + 1.5, 1.6, 24, true), st: [st[1], st[0]], n: 24, p: [0, 11.3, 0] }, { g: CY(R * 0.62, R * 0.62, 7, 20, true), st: [C.gold, '#f7e7b8'], n: 20, p: [0, 7, 0] }, { g: SP(1, 10, 8), c: C.gold, p: [0, 19.4, 0] }, { g: BX(0.1, 2.2, 1.6), c: C.red, p: [0, 21.2, 0.8] }, { g: CY(0.08, 0.08, 3, 6), c: '#444444', p: [0, 20.6, 0] }];
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, x = Math.sin(a) * (R - 2.5), z = Math.cos(a) * (R - 2.5), sc = pk(r, BAL), y = 3.4 + (i % 2) * 1.6; parts.push({ g: CY(0.12, 0.12, 9.6, 6), c: C.gold, p: [x, 6.4, z] }, { g: BX(1.5, 1.1, 2.4), c: sc, p: [x, y, z], r: [0, a, 0] }, { g: BX(1.5, 0.9, 0.3), c: C.white, p: [x, y + 0.9, z], r: [0, a, 0] }, { g: SP(0.45, 8, 6), c: C.gold, p: [x, y + 1.45, z] }); }
    const grp = new T3.Group(), body = bake(parts); grp.add(body);
    const bl = []; for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; bl.push({ g: SP(0.3, 6, 5), c: i % 2 ? '#fff3c0' : '#ffd36a', p: [Math.sin(a) * (R + 1.55), 10.5, Math.cos(a) * (R + 1.55)] }); } grp.add(bake(bl, true));
    EVO.placeGroup(S, grp, dc, lx, 0, 0); grp.scale.setScalar(k); const a0 = r() * 6;
    EVO.addDyn(grp, (t) => { grp.rotation.y = a0 + t * 0.42; }, [], { near: 900 });
  }
  function swingRide(S, dc, lx, r, k) {
    if (!S.inClip(dc)) return; k = k || 1.5; const st = pk(r, STRIPES);
    S.cyl(dc, lx, 0, 4 * k, 1 * k, 'col:#d8cfbf', undefined, 16, 4 * k, true); S.cyl(dc, lx, 1 * k, 1.4 * k, 30 * k, 'col:' + C.white, undefined, 12, 1.1 * k, true);
    for (let i = 0; i < 5; i++) S.cyl(dc, lx, (4 + i * 5.5) * k, 1.5 * k, 1.2 * k, 'col:' + st[0], undefined, 12, 1.5 * k, false);
    const parts = [{ g: CO(8.5, 5, 20), st, n: 20, p: [0, 33, 0] }, { g: CY(8.5, 8.5, 1.4, 20, true), st: [st[1], st[0]], n: 20, p: [0, 30.2, 0] }, { g: SP(0.8, 8, 6), c: C.gold, p: [0, 35.8, 0] }];
    const Lc = 11, ang = 0.62;
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, ca = Math.sin(a), sa = Math.cos(a), r0 = 8, rx = r0 + Lc * Math.sin(ang), yy = 29.5 - Lc * Math.cos(ang);
      { const cg = CY(0.06, 0.06, Lc, 4); cg.rotateX(-ang); parts.push({ g: cg, c: '#333333', p: [ca * (r0 + rx) / 2, (29.5 + yy) / 2, sa * (r0 + rx) / 2], r: [0, a, 0] }); }
      parts.push({ g: BX(1.1, 0.25, 0.9), c: pk(r, BAL), p: [ca * rx, yy, sa * rx], r: [0, a, 0] }, { g: BX(1.1, 1.0, 0.15), c: '#ffffff', p: [ca * (rx - 0.4), yy + 0.5, sa * (rx - 0.4)], r: [0, a, 0] }); }
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 0, 0); grp.scale.setScalar(k); const a0 = r() * 6;
    EVO.addDyn(grp, (t) => { grp.rotation.y = a0 + t * 1.05; }, [], { near: 900 });
  }
  function dropTower(S, dc, lx, r, H) {
    if (!S.inClip(dc)) return; H = H || 110;
    S.bx(dc, lx, H / 2, 6, H, 6, 'col:#d6dde6', undefined, true); for (let y = 6; y < H; y += 9) S.bx(dc, lx, y, 6.6, 0.7, 6.6, 'col:' + C.red, undefined, false);
    S.bx(dc, lx, H + 2.5, 10, 5, 10, 'col:' + C.navy, undefined, false); S.cyl(dc, lx, H + 5, 5, 7, 'col:' + C.red, undefined, 12, 0.2, false); S.ball(dc, lx, H + 12.6, 1, 'emis:#ff4a3a', undefined, false); S.glow(dc, lx, H + 12.6, '#ff4a3a', 20);
    for (let k = 0; k < 4; k++) S.bx(dc, lx + (k - 1.5) * 2.4, H + 2.5, 0.3, 3.4, 10.2, 'emis:' + BAL[k], undefined, false, { shadow: false });
    const parts = [{ g: BX(12, 2, 12), c: C.yellow, p: [0, 0, 0] }, { g: BX(7.6, 2.2, 7.6), c: '#2a2d33', p: [0, 0.2, 0] }];
    for (let k = 0; k < 12; k++) { const sd = k % 4, i = Math.floor(k / 4) - 1, x = sd === 0 ? 5.2 : sd === 2 ? -5.2 : i * 3.2, z = sd === 1 ? 5.2 : sd === 3 ? -5.2 : i * 3.2; parts.push({ g: BX(1.6, 2, 1.6), c: pk(r, BAL), p: [x, 1.5, z] }); }
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 6, 0); const y0 = grp.position.y, ph = r() * 12;
    EVO.addDyn(grp, (t) => { const u = (t + ph) % 13; const h = u < 6 ? ss(0, 6, u) : u < 8.2 ? 1 : u < 9 ? 1 - Math.pow((u - 8.2) / 0.8, 2) : 0; grp.position.y = y0 + h * (H - 16); }, [], { near: 900 });
  }
  function pirateShip(S, dc, lx, r, k) {
    if (!S.inClip(dc)) return; k = k || 1.5; const P = 24 * k;
    for (const s of [-1, 1]) { S.bx(dc, lx + s * 4.6 * k, P / 2, 1.3 * k, P + k, 1.3 * k, 'col:' + C.gold, undefined, true); for (const e of [-1, 1]) S.bx(dc + e * 4 * k, lx + s * 4.6 * k, P * 0.3, 0.8 * k, P * 0.6, 0.8 * k, 'col:' + C.gold, undefined, true); }
    S.bx(dc, lx, P + 0.6 * k, 10.6 * k, 1.4 * k, 1.4 * k, 'col:#8a6a48', undefined, true); S.bx(dc, lx, 0.4 * k, 13 * k, 0.8 * k, 34 * k, 'col:#d8cfbf', undefined, true);
    const parts = [{ g: BX(5.8, 3.4, 22), c: '#8a4a2a', p: [0, -15.5, 0] }, { g: BX(6, 0.7, 22.4), c: C.red, p: [0, -14.4, 0] }, { g: BX(6, 0.4, 22.4), c: C.yellow, p: [0, -13.9, 0] }, { g: BX(4.8, 3.2, 3), c: '#7a3e22', p: [0, -13, 10.8] }, { g: BX(4.8, 3.2, 3), c: '#7a3e22', p: [0, -13, -10.8] }, { g: CY(0.25, 0.25, 12, 6), c: '#5a3a24', p: [0, -8, 0] }, { g: BX(0.15, 7, 8), c: '#f6f2ea', p: [0, -7.5, 0] }, { g: BX(0.6, 14.4, 0.6), c: '#555555', p: [2.6, -7, 0] }, { g: BX(0.6, 14.4, 0.6), c: '#555555', p: [-2.6, -7, 0] }];
    for (let i = 0; i < 6; i++) parts.push({ g: BX(6.05, 0.5, 1.2), c: i % 2 ? '#ffffff' : C.blue, p: [0, -16.7, -8 + i * 3.2] });
    const grp = new T3.Group(), body = bake(parts); grp.add(body); EVO.placeGroup(S, grp, dc, lx, P, 0); grp.scale.setScalar(k); const ph = r() * 6;
    EVO.addDyn(grp, (t) => { body.rotation.x = Math.sin(t * 0.95 + ph) * 0.95; }, [], { near: 900 });
  }
  function bigTop(S, dc, lx, r, k) {   // le grand chapiteau raye
    if (!S.inClip(dc)) return; k = k || 1.3; const R = 30, st = pk(r, [[C.red, C.white], [C.blue, C.yellow], [C.red, C.yellow]]);
    const parts = [{ g: CY(R, R, 12, 28, true), st, n: 28, p: [0, 6, 0] }, { g: CY(R * 0.98, R * 0.98, 0.5, 28), c: '#d8cfbf', p: [0, 0.25, 0] }, { g: CO(R + 2, 20, 28), st, n: 28, p: [0, 22, 0] }, { g: CY(R + 2.1, R + 2.1, 1.4, 28, true), st: [C.yellow, C.navy], n: 28, p: [0, 11.5, 0] }, { g: CO(6, 7, 12), st: [st[1], st[0]], n: 12, p: [0, 33, 0] }, { g: CY(0.35, 0.35, 10, 6), c: '#555555', p: [0, 38, 0] }, { g: BX(0.15, 2.4, 3.4), c: C.red, p: [0, 42, 1.7] }];
    for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; parts.push({ g: CY(0.3, 0.3, 30, 6), c: '#555555', p: [Math.sin(a) * 12, 15, Math.cos(a) * 12] }, { g: BX(0.12, 1.6, 2.4), c: BAL[i], p: [Math.sin(a) * 12, 30.5, Math.cos(a) * 12 + 1.2] }); }
    parts.push({ g: BX(10, 9, 3), c: C.navy, p: [0, 4.5, -R] }, { g: BX(11, 1, 3.4), c: C.gold, p: [0, 9.4, -R] });
    const grp = new T3.Group(); grp.add(bake(parts)); EVO.placeGroup(S, grp, dc, lx, 0, lx > 0 ? -Math.PI / 2 : Math.PI / 2); grp.scale.setScalar(k); solid(S, dc, lx, 2 * R * k, 34 * k, 2 * R * k);
  }
  // LE BRAS GEANT : deux pylones de part et d'autre du passage, un bras de 70 m qui tourne dans le plan du couloir (nacelles aux deux bouts) : il balaie le trajet
  function giantArm(S, dc, r) {
    if (!S.inClip(dc)) return; const Lc = S.lane(dc).lx, HP = 44, LA = 36;
    for (const s of [-1, 1]) { S.bx(dc, Lc + s * 20, HP / 2, 4, HP, 6, 'col:' + C.navy, undefined, true); S.bx(dc, Lc + s * 20, 1, 9, 2, 12, 'col:' + C.stone, undefined, true); for (let y = 6; y < HP; y += 8) S.bx(dc, Lc + s * 20, y, 4.4, 0.8, 6.4, 'col:' + C.yellow, undefined, false); }
    S.bx(dc, Lc, HP + 1, 44, 3, 4, 'col:' + C.navy, undefined, true);
    const arm = new T3.Group(), parts = [{ g: BX(3, 2 * LA, 3), c: C.red, p: [0, 0, 0] }, { g: CY(3.4, 3.4, 5, 16), c: C.gold, p: [0, 0, 0], r: [0, 0, Math.PI / 2] }];
    for (const e of [-1, 1]) { parts.push({ g: BX(8, 5, 6), c: C.yellow, p: [0, e * (LA + 1), 0] }, { g: BX(8.4, 1, 6.4), c: C.blue, p: [0, e * (LA + 1) + 2.4 * e, 0] }); for (let i = 0; i < 6; i++) parts.push({ g: SP(0.35, 6, 5), c: '#fff0b8', p: [-4.3, e * (LA - 10 + i * 2.5) * 1, 1.6] }); }
    const body = bake(parts); arm.add(body);
    for (let i = 0; i < 6; i++) EVO.colBox(body, 3.2, 2 * LA / 6, 3.4, 0, -LA + (i + 0.5) * 2 * LA / 6, 0);
    for (const e of [-1, 1]) EVO.colBox(body, 8.2, 5.2, 6.2, 0, e * (LA + 1), 0);
    EVO.placeGroup(S, arm, dc + 9, Lc, HP - 1, Math.PI / 2); const ph = r() * 6;
    EVO.addDyn(arm, (t) => { body.rotation.x = ph + t * 0.55; }, [body], { near: 9999, span: 80 });
    // les colBox sont enfants de body : on les donne a la liste de collisions
    const d = EVO.dyn[EVO.dyn.length - 1]; d.cols = body.children.slice();
  }
  // montgolfiere (rayee, nacelle) ; sur le trajet elle a une collision
  function hotAir(S, dc, lx, y, r, hit) {
    if (!S.inClip(dc)) return; const st = pk(r, STRIPES), parts = [{ g: SP(9, 16, 12), st, n: 16, p: [0, 0, 0], s: [1, 1.2, 1] }, { g: CY(3, 5.5, 4, 16, true), st, n: 16, p: [0, -11.5, 0] }, { g: BX(3.6, 2.6, 3.6), c: '#8a5a34', p: [0, -17, 0] }];
    for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; parts.push({ g: CY(0.05, 0.05, 4.5, 4), c: '#333333', p: [Math.sin(a) * 2.2, -15, Math.cos(a) * 2.2] }); }
    const grp = new T3.Group(), body = bake(parts); grp.add(body); EVO.placeGroup(S, grp, dc, lx, y, 0); const y0 = grp.position.y, ph = r() * 6;
    if (hit) EVO.colBox(body, 13, 18, 13, 0, -1, 0);
    EVO.addDyn(grp, (t) => { grp.position.y = y0 + Math.sin(t * 0.4 + ph) * 3; body.rotation.y = t * 0.05; }, hit ? body.children.slice() : [], { near: 1400 });
  }
  // jets d'eau qui jaillissent en travers du passage (en rythme, colonne de 45 m) ; la base (bouche, anneau d'ecume) est toujours visible
  const JM = () => MT.jet || (MT.jet = new T3.MeshLambertMaterial({ color: '#d8f4ff', emissive: '#4ab8e8', emissiveIntensity: 0.35, transparent: true, opacity: 0.78 }));
  function jets(S, dc, xs, ph0, per) {
    S.item(dc, () => {
      const Lc = S.lane(dc).lx;
      xs.forEach((x, i) => {
        S.cyl(dc, Lc + x, 0, 3.4, 0.7, 'col:' + C.stone, undefined, 14, 3.4, true); S.cyl(dc, Lc + x, 0.7, 2.6, 0.12, 'col:#7ac8e8', undefined, 14, 2.6, false); S.cyl(dc, Lc + x, 0.7, 0.9, 0.5, 'col:#5a6470', undefined, 8, 0.9, false);
        const grp = new T3.Group(), col = new T3.Mesh(CY(1.7, 2.3, 1, 12), JM()); col.position.y = 0.5; grp.add(col); const top = new T3.Mesh(SP(3.2, 10, 8), JM()); grp.add(top);
        const cb = EVO.colBox(grp, 3.4, 1, 3.4, 0, 0.5, 0); EVO.placeGroup(S, grp, dc, Lc + x, 0.8, 0); const ph = ph0 + i * (per / xs.length);
        EVO.addDyn(grp, (t) => { const u = ((t + ph) % per) / per, h = u < 0.12 ? ss(0, 0.12, u) : u < 0.5 ? 1 : u < 0.62 ? 1 - ss(0.5, 0.62, u) : 0, H = 46 * h + 0.01; grp.visible = h > 0.02; col.scale.y = H; col.position.y = H / 2; top.position.y = H; top.scale.setScalar(0.5 + h * 0.6 + Math.sin(t * 9) * 0.05); cb.scale.y = H; cb.position.y = H / 2; }, [cb], { near: 9999, span: 60 });
      });
    });
  }
  // arche de ballons en travers du passage (on passe dessous, ou par-dessus a plus de 50 m)
  function balloonArch(S, dc, r) {
    S.item(dc, () => { const Lc = S.lane(dc).lx, R = 22, H = 26, cs = pk(r, [[C.red, C.white, C.blue], [C.pink, C.yellow, C.white], [C.purple, C.cyan, C.white]]); let i = 0;
      for (const s of [-1, 1]) for (let y = 1.6; y < H; y += 2.6) { S.ball(dc, Lc + s * R, y, 1.7, 'col:' + cs[i++ % 3], undefined, true, 1.1); S.ball(dc + 1.5, Lc + s * (R + 1.2), y + 1.3, 1.5, 'col:' + cs[i++ % 3], undefined, false, 1.1); }
      for (let k = 0; k <= 26; k++) { const a = k / 26 * Math.PI, x = Math.cos(a) * R, y = H + Math.sin(a) * R * 0.85; S.ball(dc, Lc + x, y, 1.8, 'col:' + cs[k % 3], undefined, true, 1.1); S.ball(dc + 1.4, Lc + x * 1.04, y + 0.8, 1.4, 'col:' + cs[(k + 1) % 3], undefined, false, 1.1); }
      S.bx(dc, Lc, H + R * 0.85 + 4, 18, 4, 0.4, 'col:' + C.navy, undefined, false); S.bx(dc - 0.25, Lc, H + R * 0.85 + 4, 16, 2.6, 0.1, 'col:' + C.yellow, undefined, false); });
  }

  // ---------- LA GRANDE ARCHE : deux tours, l'enseigne, deux portes FERMEES qui s'ouvrent a 210 m de la fusee ----------
  let signTex = null;
  const sign = () => signTex || (signTex = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = C.navy; x.fillRect(0, 0, 1024, 256); x.fillStyle = '#ffd23a'; for (let k = 0; k < 32; k++) { x.beginPath(); x.arc(16 + k * 32, 16, 8, 0, 6.3); x.fill(); x.beginPath(); x.arc(16 + k * 32, 240, 8, 0, 6.3); x.fill(); } x.font = '900 150px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 16; x.strokeStyle = '#e23a32'; x.strokeText('COLD PARK', 512, 134); x.fillStyle = '#fff6dc'; x.fillText('COLD PARK', 512, 134); const t = new T3.CanvasTexture(cv); if (T3.SRGBColorSpace) t.colorSpace = T3.SRGBColorSpace; return t; })());
  function grandGate(S, dG) {
    const HW = 44, TH = 64;
    S.reserve(dG, 0, 2 * HW + 40, 30);
    S.item(dG, (r) => {
      const Lc = S.lane(dG).lx;
      for (const s of [-1, 1]) { const x = Lc + s * (HW + 9);
        S.cyl(dG, x, 0, 10, 3, 'col:' + C.stone, undefined, 18, 10, true); S.cyl(dG, x, 3, 9, TH - 3, 'col:' + C.white, undefined, 18, 8.2, true);
        for (let k = 0; k < 7; k++) S.cyl(dG, x, 8 + k * 8, 9.2 - k * 0.12, 1.8, 'col:' + (k % 2 ? C.blue : C.red), undefined, 18, 9.1 - k * 0.12, false);
        for (let k = 0; k < 3; k++) for (const e of [-1, 1]) S.bx(dG + e * 0.0, x - s * 0.0, 16 + k * 16, 0.3, 4, 2.4, 'col:#3a4a6a', undefined, false);
        S.cyl(dG, x, TH, 9.8, 2.4, 'col:' + C.gold, undefined, 18, 9.8, false); S.ball(dG, x, TH + 2.4, 8.2, 'col:' + C.red, undefined, false, 0.95); S.cyl(dG, x, TH + 9, 1.8, 15, 'col:' + C.gold, undefined, 10, 0.05, false);
        S.bx(dG, x, TH + 25, 0.2, 4, 6.4, 'col:' + C.yellow, undefined, false); S.cyl(dG, x, TH + 20, 0.2, 8, 'col:#555555', undefined, 6, 0.2, false);
        for (let k = 0; k < 14; k++) { const a = k * 0.449; S.ball(dG + Math.cos(a) * 9.6, x + Math.sin(a) * 9.6, TH + 1.2, 0.45, 'emis:#fff0b8', undefined, false); }
        // la cloture du parc qui part des tours
        for (let w = HW + 19; w < 420; w += 22) { const xx = Lc + s * (w + 11); S.bx(dG, xx, 3, 22.2, 6, 2, 'col:#b05a3a', undefined, true); S.bx(dG, xx, 6.3, 22.6, 0.6, 2.6, 'col:' + C.cream, undefined, false); S.bx(dG, Lc + s * w, 6, 2, 12, 2.4, 'col:#b05a3a', undefined, true); S.ball(dG, Lc + s * w, 12.9, 0.9, 'emis:#fff0c8', undefined, false); }
      }
      // le linteau et l'enseigne (lisible des deux cotes)
      S.bx(dG, Lc, TH - 4, 2 * HW + 10, 7, 6, 'col:' + C.red, undefined, true); S.bx(dG, Lc, TH, 2 * HW + 12, 1, 6.8, 'col:' + C.gold, undefined, false); S.bx(dG, Lc, TH - 8, 2 * HW + 10, 1, 6.6, 'col:' + C.gold, undefined, false);
      for (let k = 0; k < 34; k++) for (const e of [-1, 1]) S.bx(dG + e * 3.15, Lc - HW + k * (2 * HW / 33), TH - 4, 0.45, 0.45, 0.12, 'emis:' + (k % 2 ? '#fff0b8' : '#ffd36a'), undefined, false, { shadow: false });
      { const g = new T3.Group(), mk = (z, ry) => { const pl = new T3.Mesh(new T3.PlaneGeometry(54, 13.5), new T3.MeshBasicMaterial({ map: sign() })); pl.position.set(0, TH + 9, z); pl.rotation.y = ry; g.add(pl); }; mk(-0.75, Math.PI); mk(0.75, 0);
        const fr = new T3.Mesh(BX(56.5, 16, 1.4), lam(C.gold)); fr.position.set(0, TH + 9, 0); fr.castShadow = true; g.add(fr); EVO.placeGroup(S, g, dG, Lc, 0, 0); S.bx(dG, Lc, TH + 9, 56, 16, 1.4, 'col:#000000', undefined, true, { render: false }); }
      // les deux portes : grilles dorees et rouges sur gonds ; elles s'ouvrent vers l'interieur du parc
      const leaves = [];
      for (const s of [-1, 1]) {
        const piv = new T3.Group(), parts = [], W = HW, H = TH - 9;
        parts.push({ g: BX(W, 1.4, 1.2), c: C.gold, p: [-s * W / 2, 0.9, 0] }, { g: BX(W, 1.4, 1.2), c: C.gold, p: [-s * W / 2, H - 0.7, 0] }, { g: BX(W, 1.2, 1.0), c: C.gold, p: [-s * W / 2, H * 0.55, 0] }, { g: BX(1.8, H, 1.4), c: C.red, p: [-s * 0.9, H / 2, 0] }, { g: BX(1.8, H, 1.4), c: C.red, p: [-s * (W - 0.9), H / 2, 0] });
        for (let k = 1; k < 18; k++) parts.push({ g: BX(0.5, H - 2, 0.5), c: k % 4 === 0 ? C.red : '#2b2f36', p: [-s * k * W / 18, H / 2, 0] }, { g: CO(0.6, 1.6, 6), c: C.gold, p: [-s * k * W / 18, H + 0.3, 0] });
        parts.push({ g: TO(6, 0.6, 6, 24), c: C.gold, p: [-s * W * 0.55, H * 0.55, 0] }, { g: CY(3.6, 3.6, 0.7, 16), c: C.red, p: [-s * W * 0.55, H * 0.55, 0], r: [Math.PI / 2, 0, 0] }, { g: BX(W - 2, 0.5, 0.6), c: C.gold, p: [-s * W / 2, H * 0.3, 0] });
        const leaf = bake(parts); piv.add(leaf);
        for (let k = 0; k < 4; k++) EVO.colBox(leaf, W / 4, H, 1.6, -s * (k + 0.5) * W / 4, H / 2, 0);
        EVO.placeGroup(S, piv, dG, Lc + s * HW, 0, 0); leaves.push({ piv, s, y0: piv.rotation.y, leaf });
      }
      const st = { open: 0, burst: false }, conf = confetti(S, dG, Lc, TH);
      EVO.addDyn(leaves[0].piv, (t, dt, game) => {
        const run = game.endlessRun; if (!run) return;
        if (run.dist < dG - 240 || game.state !== 'FLIGHT' && run.dist < dG - 100) { st.open = 0; st.burst = false; }   // portes fermees tant que la fusee est loin
        else if (game.state === 'FLIGHT' && run.dist > dG - 210) { if (!st.burst) { st.burst = true; conf.go(); try { game.audio.play('levelUp'); game.rig.shake = Math.max(game.rig.shake || 0, 0.25); } catch (e) { /* son */ } } st.open = Math.min(1, st.open + dt / 2.0); }
        const k = ss(0, 1, st.open); for (const L of leaves) L.piv.rotation.y = L.y0 - L.s * k * 1.8;
      }, leaves.map((L) => L.leaf.children).flat(), { near: 9999, span: 400 });
    });
  }
  // pluie de confettis tiree du haut de l'arche a l'ouverture des portes
  function confetti(S, dG, Lc, TH) {
    const n = 520, im = new T3.InstancedMesh(new T3.PlaneGeometry(1.0, 0.6), MT.conf || (MT.conf = new T3.MeshLambertMaterial({ color: '#ffffff', side: T3.DoubleSide })), n); im.frustumCulled = false; im.visible = false;
    const P = [], o = S.at(dG, Lc, TH);
    for (let i = 0; i < n; i++) { im.setColorAt(i, _c.set(BAL[i % 7])); P.push({ p: new T3.Vector3(), v: new T3.Vector3(), a: 0, w: 0 }); }
    S.b.root.add(im); let t0 = -1;
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), sv = new T3.Vector3(1, 1, 1);
    EVO.addDyn(im, (t, dt) => {
      if (t0 < 0 || !im.visible) return; const age = t - t0; if (age > 10) { im.visible = false; return; }
      for (let i = 0; i < n; i++) { const c = P[i]; c.v.y -= 6 * dt; c.v.multiplyScalar(Math.exp(-1.5 * dt)); if (c.v.y < -3.4) c.v.y = -3.4; c.p.addScaledVector(c.v, dt); c.a += c.w * dt; q.setFromEuler(e.set(c.a, c.a * 0.7, c.a * 0.3)); m4.compose(c.p, q, sv); im.setMatrixAt(i, m4); }
      im.instanceMatrix.needsUpdate = true;
    }, [], { near: 99999 });
    return { go: () => { t0 = EVO.clock; im.visible = true; for (let i = 0; i < n; i++) { const c = P[i]; c.p.set(o[0] + (Math.random() - 0.5) * 90, o[1], o[2]); c.v.set((Math.random() - 0.5) * 40, 12 + Math.random() * 26, (Math.random() - 0.5) * 40); c.a = Math.random() * 6; c.w = 2 + Math.random() * 6; } } };
  }

  // ---------- DECOR PERMANENT (hors troncons) : grandes roues et montagnes russes a l'horizon, confettis autour de la fusee ----------
  function wheelMesh(R, st) {
    const parts = [{ g: TO(R, 0.9, 6, 48), c: st[0], p: [0, 0, 0] }, { g: TO(R * 0.94, 0.5, 6, 48), c: st[1], p: [0, 0, 1.6] }, { g: TO(R * 0.94, 0.5, 6, 48), c: st[1], p: [0, 0, -1.6] }, { g: CY(2.4, 2.4, 5, 12), c: C.gold, p: [0, 0, 0], r: [Math.PI / 2, 0, 0] }];
    const n = 16; for (let i = 0; i < n; i++) { const a = i / n * 6.283; parts.push({ g: BX(0.5, R, 0.5), c: '#e8e8f0', p: [Math.sin(a) * R / 2, Math.cos(a) * R / 2, 1.2], r: [0, 0, -a] }, { g: BX(0.5, R, 0.5), c: '#e8e8f0', p: [Math.sin(a) * R / 2, Math.cos(a) * R / 2, -1.2], r: [0, 0, -a] }, { g: BX(3.6, 3.2, 3.4), c: BAL[i % 7], p: [Math.sin(a) * (R + 2.4), Math.cos(a) * (R + 2.4), 0] }); }
    return bake(parts);
  }
  function wheelStatic(R) { const parts = []; for (const z of [-5, 5]) for (const s of [-1, 1]) parts.push({ g: BX(1.4, R * 1.12, 1.4), c: '#d6dde6', p: [s * R * 0.28, -R * 0.53, z], r: [0, 0, s * 0.5] }); parts.push({ g: BX(R * 0.9, 1.4, 12), c: C.stone, p: [0, -R - 0.7, 0] }); return bake(parts); }
  function coasterLine(len, h0, amp) {   // un circuit de montagnes russes vu de loin : rails sur une sinusoide, pylones
    const parts = []; for (let z = 0; z < len; z += 4) { const y = h0 + amp * (0.5 + 0.5 * Math.sin(z * 0.035)) * (0.6 + 0.4 * Math.sin(z * 0.011)), y2 = h0 + amp * (0.5 + 0.5 * Math.sin((z + 4) * 0.035)) * (0.6 + 0.4 * Math.sin((z + 4) * 0.011)), p = Math.atan2(y2 - y, 4);
      parts.push({ g: BX(3, 0.5, 4.3), c: C.red, p: [0, y, z + 2], r: [-p, 0, 0] }); if (z % 16 === 0) parts.push({ g: BX(0.7, y, 0.7), c: '#e8e8f0', p: [0, y / 2, z + 2] }); }
    return bake(parts);
  }
  const SKY = { run: null, grp: null, wheels: [], conf: null };
  function skyline(g) {
    const run = g.endlessRun; if (!run || SKY.run === run) return; SKY.run = run;
    if (SKY.grp) { g.scene.remove(SKY.grp); SKY.grp.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    const T = run.T, grp = SKY.grp = new T3.Group(); SKY.wheels = []; g.scene.add(grp);
    const put = (obj, d, lx, y, yaw) => { const p = T.at(d, lx, y), q = T.at(d + 5, lx, y); obj.position.set(p[0], p[1], p[2]); obj.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]) + (yaw || 0); grp.add(obj); return obj; };
    const L = (T.levelLen || 3000) + 600, rr = U.makeRng ? U.makeRng(4242) : Math.random;
    for (let d = 200, i = 0; d < L; d += 380 + rr() * 200, i++) {
      const s = i % 2 ? 1 : -1, R = 44 + rr() * 28, st = pk(rr, STRIPES), lx = s * (210 + rr() * 90), w = wheelMesh(R, st), base = wheelStatic(R), hub = new T3.Group(); hub.add(w);
      const o = new T3.Group(); o.add(hub); o.add(base); put(o, d, lx, R + 6, Math.PI / 2 + (rr() - 0.5) * 0.8); SKY.wheels.push({ w, sp: 0.06 + rr() * 0.05 });
      const cl = coasterLine(220 + rr() * 160, 12, 30 + rr() * 26); put(cl, d + 180, -s * (200 + rr() * 100), 0, (rr() - 0.5) * 0.6);
    }
    // confettis et petales qui flottent autour de la fusee
    const n = 140, im = new T3.InstancedMesh(new T3.PlaneGeometry(0.7, 0.42), MT.conf || (MT.conf = new T3.MeshLambertMaterial({ color: '#ffffff', side: T3.DoubleSide })), n); im.frustumCulled = false;
    const P = []; for (let i = 0; i < n; i++) { im.setColorAt(i, _c.set(BAL[i % 7])); P.push({ p: new T3.Vector3(1e5, 0, 0), a: Math.random() * 6, w: 1 + Math.random() * 3, ph: Math.random() * 6 }); }
    grp.add(im); SKY.conf = { im, P };
  }
  const _m5 = new T3.Matrix4(), _q5 = new T3.Quaternion(), _e5 = new T3.Euler(), _s5 = new T3.Vector3(1, 1, 1);
  function skyTick(g, dt) {
    if (!SKY.grp) return; const t = EVO.clock;
    for (const w of SKY.wheels) w.w.rotation.z = t * w.sp;
    const cf = SKY.conf, rk = g.rocket; if (!cf || !rk) return; const c = rk.pos;
    for (let i = 0; i < cf.P.length; i++) { const q = cf.P[i]; if (q.p.distanceToSquared(c) > 90 * 90) q.p.set(c.x + (Math.random() - 0.5) * 120 + rk.vel.x * 1.2, c.y + Math.random() * 60 - 10, c.z + (Math.random() - 0.5) * 120 + rk.vel.z * 1.2);
      q.p.y -= 1.6 * dt; q.p.x += Math.sin(t * 0.8 + q.ph) * 1.2 * dt; q.a += q.w * dt; _q5.setFromEuler(_e5.set(q.a, q.a * 0.6, q.ph)); _m5.compose(q.p, _q5, _s5); cf.im.setMatrixAt(i, _m5); }
    cf.im.instanceMatrix.needsUpdate = true;
  }
  if (EVO.tick) { const _tk = EVO.tick; EVO.tick = (g, dt) => { _tk(g, dt); if (!on3() || !g.endlessRun) return; try { skyline(g); skyTick(g, dt); } catch (e) { (window.__errs = window.__errs || []).push('foire ' + e); } }; }

  // ---------- AMBIANCE : ciel feerique (peche, rose, lilas), lumiere doree, brume rosee lointaine ----------
  function moods() {
    if (!EVO.MOOD || EVO.MOOD.feerie) return; const C3 = (h) => new T3.Color(h);
    const add = (n, m, gr) => { for (const f of ['top', 'hor', 'fog', 'hemiS', 'hemiG', 'sunC']) m[f] = C3(m[f]); m.sat = gr[0]; m.con = gr[1]; m.shT = C3(gr[2]); m.hiT = C3(gr[3]); EVO.MOOD[n] = m; };
    add('feerie', { top: '#5c78dc', hor: '#ffc4d4', fog: '#f4cfd8', near: 170, far: 470, hemiS: '#fff0f6', hemiG: '#a08878', hemiI: 0.74, amb: 0.16, sunC: '#ffe2c0', sunI: 0.92, night: 0 }, [1.1, 1.05, '#e6e2ff', '#fff2e6']);
    add('feerieOr', { top: '#6a6ad0', hor: '#ffb48c', fog: '#f0b8a8', near: 160, far: 460, hemiS: '#ffe6d8', hemiG: '#9a7a6a', hemiI: 0.74, amb: 0.17, sunC: '#ffc890', sunI: 0.95, night: 0.05 }, [1.1, 1.06, '#e0dcff', '#ffe8d4']);
    add('feerieSoir', { top: '#3c3c9a', hor: '#ff9a7a', fog: '#c8889a', near: 140, far: 430, hemiS: '#ffd8e0', hemiG: '#6a5068', hemiI: 0.72, amb: 0.2, sunC: '#ffa070', sunI: 0.8, night: 0.18 }, [1.08, 1.08, '#d8d4ff', '#ffe0cc']);
    add('foireSous', { top: '#1a1030', hor: '#3a2050', fog: '#2a1a3a', near: 40, far: 260, hemiS: '#d0b8ff', hemiG: '#3a2a48', hemiI: 0.95, amb: 0.42, sunC: '#ffc0e8', sunI: 0.45, night: 0.35 }, [1.0, 1.08, '#d8d0ff', '#ffe8f4']);
    add('feerieMenthe', { top: '#3aa0e8', hor: '#c8f4ec', fog: '#c0ece4', near: 170, far: 470, hemiS: '#f0fffa', hemiG: '#7a9a88', hemiI: 0.74, amb: 0.16, sunC: '#fff4dc', sunI: 0.92, night: 0 }, [1.12, 1.05, '#e0ecff', '#fffaf0']);
    add('feerieLilas', { top: '#7a6ae0', hor: '#f4c8f4', fog: '#e8c4ec', near: 170, far: 470, hemiS: '#fff0ff', hemiG: '#8a7a98', hemiI: 0.74, amb: 0.16, sunC: '#ffe8f4', sunI: 0.9, night: 0 }, [1.1, 1.05, '#e8e0ff', '#fff2fa']);
    add('feerieCouchant', { top: '#4a5ac8', hor: '#ff8a5a', fog: '#e89a88', near: 160, far: 460, hemiS: '#ffd8c8', hemiG: '#8a6058', hemiI: 0.74, amb: 0.18, sunC: '#ff9a50', sunI: 0.95, night: 0.08 }, [1.1, 1.08, '#dcd8ff', '#ffe0c4']);
    add('foireNuit', { top: '#0c1440', hor: '#5a3a8a', fog: '#2a2050', near: 120, far: 420, hemiS: '#a8a0ff', hemiG: '#3a2a50', hemiI: 0.8, amb: 0.34, sunC: '#c8a0ff', sunI: 0.45, night: 0.62 }, [1.05, 1.1, '#d0d0ff', '#ffe8d0']);
    for (const k of ['fdepart', 'fportes', 'fplace']) EVO.SCENE_MOOD[k] = 'feerie'; EVO.SCENE_MOOD.fparc = 'feerieMenthe'; EVO.SCENE_MOOD.fmarteaux = 'feerieOr'; EVO.SCENE_MOOD.froue = 'feerieLilas'; EVO.SCENE_MOOD.fcoaster = 'feerieCouchant'; EVO.SCENE_MOOD.fnuit = 'foireNuit'; EVO.SCENE_MOOD.fchoix = 'feerieSoir'; EVO.SCENE_MOOD.fsous = 'foireSous';
    if (EVO.SCENE_AUDIO) for (const k of ['fdepart', 'fportes', 'fplace', 'fparc', 'fmarteaux', 'froue', 'fcoaster']) EVO.SCENE_AUDIO[k] = 'evoDay'; if (EVO.SCENE_AUDIO) { EVO.SCENE_AUDIO.fchoix = 'evoDusk'; EVO.SCENE_AUDIO.fsous = 'evoMine'; EVO.SCENE_AUDIO.fnuit = 'evoNight'; }
  }

  // ---------- SCENE 1 : LE PARKING ----------
  const CARC = ['#c8352a', '#2f6fb0', '#e8b82a', '#d0d0d4', '#3a9a5a', '#2a2a2e', '#f0f0ee'];
  D.scenes.fdepart = { len: [170, 170], noDoor: true, noChaos: true, noDress: true, grass: false,
    pin: (T, sc) => ({ lx: 0, y: 8, from: 20, to: sc.d1 - sc.d0 - 20 }),
    ground: (d, lx, c) => { const k = 1 - ss(W0, W0 + 16, Math.abs(lx)); if (k > 0) c.lerp(ASPH, k * 0.97); },
    build(S) {
      const d0 = S.d0;
      for (let dc = d0 + 4; dc < S.d1; dc += 8) S.item(dc, () => { S.bx(dc, 0, 0.09, 0.6, 0.04, 4, 'col:#f2efe4', undefined, false, { shadow: false }); });
      for (const sg of [-1, 1]) for (let row = 0; row < 5; row++) { const lx0 = sg * (18 + row * 28); for (let dc = d0 + 8; dc < S.d1 - 6; dc += 3.4) S.item(dc, (r) => { S.bx(dc, lx0 + sg * 7, 0.09, 14, 0.04, 0.2, 'col:#f2efe4', undefined, false, { shadow: false }); if (r() < 0.45 && Math.abs(dc - d0) > 14) { const cc = pk(r, CARC), x = lx0 + sg * 7; S.bx(dc + 1.7, x, 0.8, 4.8, 1.2, 2.2, 'col:' + cc, undefined, true); S.bx(dc + 1.7, x - sg * 0.3, 1.75, 2.6, 0.85, 2.0, 'glass', undefined, false); } }); }
      for (let dc = d0 + 20; dc < S.d1; dc += 34) S.item(dc, () => { for (const s of [-1, 1]) lampPost(S, dc, s * 15); });
      S.item(d0 + 150, () => { for (const s of [-1, 1]) for (let k = 0; k < 3; k++) barrier(S, d0 + 150, s * (24 + k * 14)); });
      for (let k = 0; k < 4; k++) S.item(d0 + 30 + k * 40, (r) => crates(S, d0 + 30 + k * 40, (k % 2 ? 1 : -1) * 12, r));
      parkTrees(S); balloons(S, d0 + 100, 12, S.sr, 120);
      foe(S, 'tank', d0 + 62, 3, 0, { name: 'CHAR', val: 240, keep: true });
      foe(S, 'heli', d0 + 84, 0, 25, { name: 'HELICO', keep: true, armed: false, patrol: (SS, dd, lx, y) => [SS.at(dd, -14, y), SS.at(dd + 10, 0, y + 3), SS.at(dd, 14, y), SS.at(dd - 10, 0, y + 3)], speed: 8 });
      foe(S, 'truck', d0 + 150, -8, 0, { name: 'CAMION', path: 60, speed: 14 });
    } };
  // la lisiere du parc : pelouses et grands arbres au-dela du pavage
  function parkTrees(S) { const TR = CC.Trees; if (!TR) return; for (const s of [-1, 1]) S.rows(S.d0, S.d1, 13, 0.6, (dc) => S.item(dc, (r) => { const lx = S.lane(dc).lx + s * r.between([W0 + 18, W0 + 90]), p = S.at(dc, lx, 0); TR.broadleaf(S.b, p[0], p[1], p[2], r.between([13, 24]), r, {}); if (r() < 0.5) { const q = S.at(dc + 6, lx + s * r.between([30, 70]), 0); TR.conifer(S.b, q[0], q[1], q[2], r.between([18, 32]), r, {}); } })); }

  // ---------- SCENE 2 : LES GRANDES PORTES ----------
  const PORTES_G = 0.58;
  D.scenes.fportes = { len: [430, 430], noDoor: true, noChaos: true, noDress: true, grass: false,
    pin: (T, sc) => ({ lx: 0, y: 14, from: 30, to: sc.d1 - sc.d0 - 10 }),
    ground: (d, lx, c, sc) => { const g = sc.d0 + (sc.d1 - sc.d0) * PORTES_G; if (d < g - 120) { const k = 1 - ss(W0, W0 + 16, Math.abs(lx)); if (k > 0) c.lerp(ASPH, k * 0.97); } else groundJ(W0)(d, lx, c); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, dG = d(PORTES_G);
      paveScene(S, (dd, x) => { if (dd < dG - 120) return null; const ax = Math.abs(x), i = Math.floor((dd - S.d0) / 4), ro = rosace(dd, x, dG + 70, 0, 40, C.terra, C.rose, C.white); if (ro) return ro; if (ax < 8) return [i % 2 ? C.rose : C.cream, 'foirePaves']; if (ax < 12) return [C.terra, 'foirePaves']; return [i % 6 < 3 ? C.cream : (i % 6 === 3 ? C.terra : C.sand), i % 6 === 3 ? 'foirePaves' : 'foireDalles']; });
      for (let dc = S.d0 + 6; dc < dG - 120; dc += 8) S.item(dc, () => S.bx(dc, 0, 0.09, 0.6, 0.04, 4, 'col:#f2efe4', undefined, false, { shadow: false }));
      // l'avenue des mats a drapeaux geants
      for (let dc = S.d0 + 24; dc < dG - 22; dc += 24) S.item(dc, (r) => { for (const s of [-1, 1]) { const x = s * 28; S.cyl(dc, x, 0, 1.3, 1.4, 'col:' + C.stone, undefined, 8, 1.3, true); S.cyl(dc, x, 1.4, 0.32, 32, 'col:#e8e8e8', undefined, 8, 0.22, true); S.bx(dc, x - s * 3.8, 28.5, 7.4, 4.8, 0.12, 'col:' + pk(r, BAL), undefined, false); S.bx(dc, x - s * 3.8, 25.4, 7.4, 1.4, 0.12, 'col:#ffffff', undefined, false); S.ball(dc, x, 33.8, 0.6, 'col:' + C.gold, undefined, false); } });
      for (let dc = S.d0 + 12; dc < S.d1; dc += 30) S.item(dc, () => { if (Math.abs(dc - dG) < 24) return; for (const s of [-1, 1]) lampPost(S, dc, s * 20); });
      // les guichets devant l'arche
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) S.item(dG - 36, () => { const x = s * (24 + k * 12), dc = dG - 36; S.bx(dc, x, 2.4, 7, 4.8, 6, 'col:' + C.white, undefined, true); S.bx(dc, x, 3.2, 7.1, 1.8, 4.4, 'glass', undefined, false); S.cyl(dc, x, 4.8, 5, 3.6, 'col:' + (k ? C.blue : C.red), undefined, 12, 0.3, false); S.ball(dc, x, 8.8, 0.6, 'col:' + C.gold, undefined, false); });
      S.item(dG - 74, () => { for (const s of [-1, 1]) barrier(S, dG - 74, s * 16); }); S.item(dG - 58, (r) => crates(S, dG - 58, 38, r));
      grandGate(S, dG);
      // derriere l'arche : parterres, tentes, premiers stands et un carrousel
      for (const [u, x] of [[0.74, -34], [0.78, 38], [0.9, -42]]) S.item(d(u), (r) => { const dc = d(u); S.cyl(dc, x, 0, 6, 1, 'col:' + C.stone, undefined, 16, 6, true); S.cyl(dc, x, 1, 5.5, 0.3, 'col:#4f8a3a', undefined, 16, 5.5, false); for (let k = 0; k < 20; k++) { const a = k * 0.449, rr = 1.4 + (k % 3) * 1.3; S.ball(dc + Math.cos(a) * rr, x + Math.sin(a) * rr, 1.6, 0.6, 'col:' + pk(r, [C.red, C.yellow, C.pink, '#ffffff', C.purple]), undefined, false); } });
      S.item(d(0.86), (r) => tents(S, d(0.86), 70, r, 4)); S.item(d(0.8), (r) => carousel(S, d(0.8), -78, r, 1.6));
      parkTrees(S); balloons(S, d(0.2), 10, S.sr, 130); balloons(S, d(0.6), 16, S.sr, 140); balloons(S, d(0.9), 16, S.sr, 140);
      hotAir(S, d(0.3), -90, 70, S.sr); hotAir(S, d(0.75), 120, 95, S.sr);
      foe(S, 'jeep', d(0.16), 6, 0, { name: 'JEEP', path: 80, speed: 16 });
      foe(S, 'aaturret', d(0.4), -32, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'apc', d(0.5), 10, 0, { name: 'TRANSPORT', hp: 2, armed: false });
      foe(S, 'heli', d(0.82), 0, 40, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -30, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 30, y), SS.at(dc - 22, 0, y + 6)], speed: 11 });
    } };

  // ---------- SCENE 3 : LA PLACE DE L'HORLOGE ----------
  D.scenes.fplace = { len: [640, 640], noDoor: true, noChaos: true, noDress: true, grass: false, turns: [[0.3, 0.7, 52]],
    pin: (T, sc) => ({ lx: 0, y: 16, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: groundJ(W0),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, tr = (S.sc.turns && S.sc.turns[0]) || { ang: 1 }, inner = tr.ang > 0 ? 1 : -1, dT = d(0.5), xT = inner * 62, dFo = d(0.16);
      paveScene(S, (dd, x) => { const i = Math.floor((dd - S.d0) / 4), j = Math.floor((x + 400) / 4), ax = Math.abs(x);
        const r1 = rosace(dd, x, dT, xT, 56, C.terra, C.rose, C.gold); if (r1) return r1;
        const r2 = rosace(dd, x, dFo, 0, 36, C.blue === '' ? C.terra : '#9ab8d8', C.cream, C.white); if (r2) return r2;
        if (ax < 10) return [i % 2 ? C.rose : C.cream, 'foirePaves'];
        return [(i % 12 === 0 || j % 12 === 0) ? C.terra : (hsh(i, j) < 0.5 ? C.sand : C.grey), (i % 12 === 0 || j % 12 === 0) ? 'foirePaves' : 'foireDalles']; });
      clockTower(S, dT, xT);
      // la fontaine geante a l'entree de la place (vasques, jets animes)
      S.item(dFo, () => { const Lc = S.lane(dFo).lx; S.cyl(dFo, Lc + 0, 0, 22, 1.6, 'col:' + C.white, undefined, 28, 22, true); S.cyl(dFo, Lc, 1.3, 21, 0.3, 'waterSurf', undefined, 28, 21, false); });
      jets(S, dFo, [-14, -5, 5, 14], 0, 3.6);
      // les grands batiments autour de la place
      candyShop(S, d(0.3), -inner * 46, inner, S.sr); arcade(S, d(0.6), -inner * 46, inner); theatre(S, d(0.86), inner * 48, -inner);
      const BIG = [[0.82, -inner * 96, 'food', 60], [0.07, -64, 'vil', 50], [0.1, 66, 'vil', 50], [0.44, -inner * 100, 'vil', 50], [0.96, -inner * 52, 'vil', 50], [0.36, inner * 120, 'tents', 40], [0.7, inner * 112, 'swing', 50], [0.2, -110, 'drop', 20], [0.3, -inner * 110, 'car', 56], [0.62, -inner * 116, 'top', 90]];
      for (const [u, x, k, w] of BIG) { S.reserve(d(u), x, w, w); S.item(d(u), (r) => { if (k === 'food') foodCourt(S, d(u), x, r); else if (k === 'vil') village(S, d(u), x, r); else if (k === 'tents') tents(S, d(u), x, r, 5); else if (k === 'swing') swingRide(S, d(u), x, r, 1.6); else if (k === 'drop') dropTower(S, d(u), x, r, 120); else if (k === 'car') carousel(S, d(u), x, r, 1.6); else bigTop(S, d(u), x, r, 1.3); }); }
      S.reserve(dT, xT, 40, 40); S.reserve(dFo, 0, 50, 50); fillers(S, 26, 70, 20); cableCar(S, d(0.74), S.sr);
      for (let dc = S.d0 + 20; dc < S.d1; dc += 26) S.item(dc, () => { const Lc = S.lane(dc).lx; for (const s of [-1, 1]) if (Math.hypot(dc - dT, Lc + s * 22 - xT) > 40 && Math.abs(dc - dFo) > 28) lampPost(S, dc, Lc + s * 22); });
      for (let dc = S.d0 + 50; dc < S.d1 - 10; dc += 60) S.item(dc, (r) => { const Lc = S.lane(dc).lx; if (Math.abs(dc - dT) > 50) garland(S, dc, Lc - 22, Lc + 22, 20 + r.between([0, 4]), r); });
      for (const u of [0.25, 0.55, 0.9]) S.item(d(u), (r) => { const Lc = S.lane(d(u)).lx, s = r() < 0.5 ? -1 : 1; barrier(S, d(u), Lc + s * 16); crates(S, d(u) + 9, Lc - s * 26, r); });
      parkTrees(S); for (let k = 0; k < 6; k++) balloons(S, d(0.08 + k * 0.16), 16, S.sr, 130);
      hotAir(S, d(0.4), inner * 20, 62, S.sr, true); hotAir(S, d(0.72), -inner * 110, 90, S.sr);
      foe(S, 'aaturret', d(0.1), -20, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'tank', d(0.3), 12, 0, { name: 'BLINDE', hp: 2, armed: false });
      foe(S, 'heli', d(0.46), 0, 46, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -28, y), SS.at(dc + 24, 0, y + 6), SS.at(dc, 28, y), SS.at(dc - 24, 0, y + 6)], speed: 12 });
      foe(S, 'jeep', d(0.6), -8, 0, { name: 'JEEP', path: 110, speed: 18 });
      foe(S, 'rocketTruck', d(0.76), 16, 0, { name: 'LANCE-ROQUETTES', armed: true });
      foe(S, 'tank', d(0.92), -12, 0, { name: 'BLINDE', hp: 3, armed: false });
    } };

  // ---------- SCENE 4 : LA FOIRE (maneges partout, jets, arches, bras geant) ----------
  D.scenes.fparc = { len: [900, 900], noDoor: true, noChaos: true, noDress: true, grass: false, turns: [[0.12, 0.32, 30], [0.46, 0.7, -42], [0.82, 0.96, 24]],
    pin: (T, sc) => ({ lx: 0, y: 16, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: groundJ(W0),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      // les maneges et batiments, en grappes irregulieres des deux cotes (proches et lointains)
      const PL = [[0.05, -1, 'car', 62], [0.08, 1, 'vil', 70], [0.15, 1, 'swing', 150], [0.18, -1, 'tents', 120], [0.22, 1, 'pirate', 44], [0.27, -1, 'drop', 52], [0.32, 1, 'top', 120], [0.36, -1, 'vil', 64], [0.42, 1, 'food', 80], [0.46, -1, 'car', 150],
        [0.52, 1, 'drop', 56], [0.55, -1, 'pirate', 46], [0.6, 1, 'tents', 140], [0.64, -1, 'top', 110], [0.69, 1, 'vil', 66], [0.74, -1, 'swing', 64], [0.79, 1, 'car', 70], [0.84, -1, 'vil', 72], [0.88, 1, 'top', 150], [0.93, -1, 'drop', 120], [0.96, 1, 'vil', 64]];
      const SPOTS = []; for (const [u, sg, k, x] of PL) if (/car|swing|drop/.test(k)) SPOTS.push([d(u), sg * x, k === 'drop' ? 20 : 36, sg > 0 ? C.terra : '#9ab8d8', C.rose]);
      // pavage : chemin central en petits paves, ilots en dalles, mosaique sous chaque manege
      paveScene(S, (dd, x) => { const Lc = 0, i = Math.floor((dd - S.d0) / 4), j = Math.floor((x + 400) / 4), ax = Math.abs(x - Lc);
        for (const q of SPOTS) { const rr0 = Math.hypot(dd - q[0], x - q[1]); if (rr0 < q[2]) return [Math.floor(rr0 / 4) % 2 ? '#ffd23a' : '#ffffff', 'foireAsphalte']; }
        if (ax < 2) return ['#ffffff', 'foireAsphalte'];
        if (ax < 16) return ['#4ab8c4', 'foireAsphalte'];
        if (ax < 19) return ['#ffffff', 'foireAsphalte'];
        const zz = Math.floor((dd - S.d0) / 60) + (x > 0 ? 1 : 0); return [(i % 15 === 0 || j % 15 === 0) ? '#ffd23a' : ['#f08ab8', '#9ad86a', '#b89af0', '#ffb06a'][zz % 4], 'foireAsphalte']; });
      for (const [u, s, k, x] of PL) S.reserve(d(u), s * x, k === 'vil' ? 50 : k === 'top' ? 90 : k === 'food' ? 64 : 56, k === 'vil' ? 70 : k === 'top' ? 90 : 56);
      fillers(S, 24, 60, 18); coasterOver(S, d(0.16), S.sr); coasterOver(S, d(0.6), S.sr); cableCar(S, d(0.42), S.sr);
      for (const [u, s, k, x] of PL) { S.item(d(u), (r) => { const lx = S.lane(d(u)).lx + s * x;
        if (k === 'car') carousel(S, d(u), lx, r, 1.6); else if (k === 'swing') swingRide(S, d(u), lx, r, 1.6); else if (k === 'drop') dropTower(S, d(u), lx, r, 100 + r() * 30); else if (k === 'pirate') pirateShip(S, d(u), lx, r, 1.6); else if (k === 'top') bigTop(S, d(u), lx, r, 1.3); else if (k === 'tents') tents(S, d(u), lx, r, 5); else if (k === 'food') foodCourt(S, d(u), lx, r); else village(S, d(u), lx, r); }); }
      // le rythme sur le trajet : jets d'eau, arches de ballons, le bras geant, montgolfieres
      jets(S, d(0.12), [-12, 0, 12], 0, 3.2); jets(S, d(0.38), [-16, -6, 6, 16], 1, 3.6); jets(S, d(0.66), [-10, 10], 0.5, 2.8);
      balloonArch(S, d(0.2), S.sr); balloonArch(S, d(0.5), S.sr); balloonArch(S, d(0.9), S.sr);
      giantArm(S, d(0.3), S.sr); giantArm(S, d(0.78), S.sr);
      hotAir(S, d(0.44), 14, 58, S.sr, true); hotAir(S, d(0.58), -18, 74, S.sr, true); hotAir(S, d(0.72), 160, 110, S.sr); hotAir(S, d(0.1), -150, 90, S.sr);
      for (let dc = S.d0 + 10; dc < S.d1; dc += 24) S.item(dc, () => { const Lc = S.lane(dc).lx; for (const s of [-1, 1]) lampPost(S, dc, Lc + s * 20); });
      for (let dc = S.d0 + 34; dc < S.d1 - 10; dc += 52) S.item(dc, (r) => { const Lc = S.lane(dc).lx; garland(S, dc, Lc - 20, Lc + 20, 18 + r.between([0, 5]), r); });
      for (const u of [0.06, 0.34, 0.62, 0.86]) S.item(d(u), (r) => { const Lc = S.lane(d(u)).lx, s = r() < 0.5 ? -1 : 1; barrier(S, d(u), Lc + s * 15); crates(S, d(u) + 8, Lc - s * 24, r); });
      parkTrees(S); for (let k = 0; k < 9; k++) balloons(S, d(0.05 + k * 0.11), 16, S.sr, 130);
      foe(S, 'aaturret', d(0.08), -16, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'jeep', d(0.17), 8, 0, { name: 'JEEP', path: 110, speed: 18 });
      foe(S, 'tank', d(0.26), -10, 0, { name: 'BLINDE', hp: 2, armed: false });
      foe(S, 'heli', d(0.4), 0, 48, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 26, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'rocketTruck', d(0.52), 14, 0, { name: 'LANCE-ROQUETTES', armed: true });
      foe(S, 'apc', d(0.63), -8, 0, { name: 'TRANSPORT', path: 90, speed: 15 });
      foe(S, 'tank', d(0.75), 10, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'heli', d(0.85), 0, 56, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 26, y), SS.at(dc - 22, 0, y + 6)], speed: 13 });
      foe(S, 'truck', d(0.95), -6, 0, { name: 'CAMION', path: 100, speed: 15 });
    } };

  // ---------- SCENE 5 : L'ALLEE DES MARTEAUX : des « tests de force » geants ; leur marteau s'abat en travers du passage, a gauche puis a droite ----------
  // la tour (graduations, cloche) est d'un cote ; le marteau pivote en haut de la tour et frappe une cible posee de l'autre cote du chemin
  function hammer(S, dc, s, ph, per) {
    S.item(dc, () => {
      const Lc = S.lane(dc).lx, xT = Lc + s * 36, H = 40, xP = Lc - s * 6;
      S.bx(dc, xT, 1, 14, 2, 14, 'col:' + C.stone, undefined, true); S.bx(dc, xT, H / 2, 7, H, 7, 'col:' + C.white, undefined, true);
      const GR = [C.green, C.green, C.yellow, C.yellow, C.orange, C.orange, C.red, C.red]; for (let k = 0; k < 8; k++) S.bx(dc, xT - s * 3.6, 4 + k * 4.4, 0.4, 3.6, 4.4, 'col:' + GR[k], undefined, false);
      S.bx(dc, xT, H + 1, 9, 2, 9, 'col:' + C.gold, undefined, true); S.ball(dc, xT, H + 5, 4, 'col:' + C.gold, undefined, true, 0.9); S.cyl(dc, xT, H + 8.4, 0.5, 3, 'col:#555555', undefined, 6, 0.5, false);
      S.bx(dc, xT, H - 6, 0.6, 5, 12, 'col:' + C.navy, undefined, false); for (let k = 0; k < 6; k++) S.bx(dc - 5 + k * 2, xT - s * 0.4, H - 3.3, 0.3, 0.4, 0.4, 'emis:#fff0b8', undefined, false, { shadow: false });
      S.cyl(dc, xP, 0, 7, 1.2, 'col:' + C.red, undefined, 20, 7, true); S.cyl(dc, xP, 1.2, 5, 0.3, 'col:' + C.white, undefined, 20, 5, false); S.cyl(dc, xP, 1.5, 2.6, 0.3, 'col:' + C.red, undefined, 20, 2.6, false);
      // le marteau : bras de la cible au pivot, tete en tonneau rouge cerclee d'or ; on le pose a chaque image (pivot -> direction)
      const P = S.at(dc, xT - s * 2, H - 2), Q = S.at(dc, xT - s * 3, H - 2), u = new T3.Vector3(Q[0] - P[0], 0, Q[2] - P[2]).normalize(), up = new T3.Vector3(0, 1, 0), fw = new T3.Vector3().crossVectors(u, up).normalize();
      const tgt = S.at(dc, xP, 6.5), Lh = Math.hypot(tgt[0] - P[0], tgt[2] - P[2]), dH = P[1] - tgt[1], L = Math.hypot(Lh, dH), aDown = -Math.atan2(dH, Lh), aUp = 1.25;
      const grp = new T3.Group(), body = bake([{ g: BX(2.8, 2.8, L - 6), c: '#8a5a34', p: [0, 0, (L - 6) / 2] }, { g: BX(3.2, 3.2, 2), c: C.gold, p: [0, 0, L * 0.5] }, { g: CY(6.2, 6.2, 15, 20), c: C.red, p: [0, 0, L], r: [0, 0, Math.PI / 2] }, { g: CY(6.5, 6.5, 1.4, 20), c: C.gold, p: [5.6, 0, L], r: [0, 0, Math.PI / 2] }, { g: CY(6.5, 6.5, 1.4, 20), c: C.gold, p: [-5.6, 0, L], r: [0, 0, Math.PI / 2] }, { g: CY(6.6, 6.6, 1.2, 20), c: C.white, p: [0, 0, L], r: [0, 0, Math.PI / 2] }, { g: CY(2.4, 2.4, 4, 10), c: C.gold, p: [0, 0, 0], r: [0, 0, Math.PI / 2] }]);
      grp.add(body); for (let k = 0; k < 4; k++) EVO.colBox(body, 3, 3, (L - 8) / 4, 0, 0, 2 + (k + 0.5) * (L - 8) / 4); EVO.colBox(body, 15.4, 12.6, 12.6, 0, 0, L);
      grp.position.set(P[0], P[1], P[2]); S.b.root.add(grp);
      const v = new T3.Vector3(), Zv = new T3.Vector3(0, 0, 1), m3 = new T3.Matrix4(), st = { hit: false };
      EVO.addDyn(grp, (t, dt, game) => {
        const x = ((t + ph) % per) / per; let a; if (x < 0.45) a = aDown + (aUp - aDown) * ss(0, 0.45, x); else if (x < 0.7) a = aUp; else if (x < 0.76) a = aUp + (aDown - aUp) * Math.pow((x - 0.7) / 0.06, 2); else a = aDown;
        if (x >= 0.76 && !st.hit) { st.hit = true; const rk = game.rocket; if (rk && rk.active && rk.pos.distanceTo(grp.position) < 140) { try { game.rig.shake = Math.max(game.rig.shake || 0, 0.35); game.audio.play('uiTick'); } catch (e) { /* son */ } } } else if (x < 0.76) st.hit = false;
        v.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a));
        m3.makeBasis(fw, new T3.Vector3().crossVectors(v, fw).normalize(), v); grp.quaternion.setFromRotationMatrix(m3);
      }, body.children.slice(), { near: 9999, span: 90 });
    });
  }
  D.scenes.fmarteaux = { len: [620, 620], noDoor: true, noChaos: true, noDress: true, grass: false, turns: [[0.08, 0.2, 18], [0.86, 0.98, -24]],
    pin: (T, sc) => ({ lx: 0, y: 18, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: groundJ(W0),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L;
      paveScene(S, (dd, x) => { const i = Math.floor((dd - S.d0) / 4), j = Math.floor((x + 400) / 4), ax = Math.abs(x); if (ax < 46) return [ax < 6 ? '#c8905a' : (Math.floor(ax / 8) % 2 ? '#e0b886' : '#d4a874'), 'foirePlanches']; if (ax < 50) return ['#8a5a34', 'foirePlanches']; return [(i % 6 === 0) ? '#a87a50' : (hsh(i, j) < 0.5 ? '#d8b48a' : '#c8a07a'), 'foirePlanches']; });
      const HM = [0.16, 0.26, 0.36, 0.48, 0.58, 0.68, 0.8];
      HM.forEach((u, i) => { S.reserve(d(u), (i % 2 ? 1 : -1) * 36, 20, 20); hammer(S, d(u), i % 2 ? 1 : -1, i * 1.3, 4.2); });
      // l'entree : un portique « LES MARTEAUX », guirlandes, puis grands stands de foire derriere les tours
      S.item(d(0.06), () => { const Lc = S.lane(d(0.06)).lx; for (const s of [-1, 1]) { S.bx(d(0.06), Lc + s * 50, 22, 5, 44, 5, 'col:' + C.red, undefined, true); S.ball(d(0.06), Lc + s * 50, 46.5, 3.4, 'col:' + C.gold, undefined, false); } S.bx(d(0.06), Lc, 40, 104, 6, 4, 'col:' + C.navy, undefined, true); S.bx(d(0.06) - 2.1, Lc, 40, 60, 3.4, 0.2, 'col:' + C.yellow, undefined, false); for (let k = 0; k < 40; k++) S.bx(d(0.06) - 2.2, Lc - 50 + k * 2.56, 43.2, 0.4, 0.4, 0.2, 'emis:#fff0b8', undefined, false, { shadow: false }); });
      for (const [u, s, k, x] of [[0.2, -1, 'vil', 86], [0.32, 1, 'car', 92], [0.44, -1, 'drop', 80], [0.55, 1, 'vil', 84], [0.64, -1, 'tents', 96], [0.75, 1, 'swing', 96], [0.9, -1, 'top', 110]]) { S.reserve(d(u), s * x, 56, 56); S.item(d(u), (r) => { const lx = S.lane(d(u)).lx + s * x; if (k === 'car') carousel(S, d(u), lx, r, 1.6); else if (k === 'swing') swingRide(S, d(u), lx, r, 1.6); else if (k === 'drop') dropTower(S, d(u), lx, r, 120); else if (k === 'tents') tents(S, d(u), lx, r, 5); else if (k === 'top') bigTop(S, d(u), lx, r, 1.3); else village(S, d(u), lx, r); }); }
      fillers(S, 50, 70, 24);
      for (let dc = S.d0 + 12; dc < S.d1; dc += 24) S.item(dc, () => { const Lc = S.lane(dc).lx; for (const s of [-1, 1]) lampPost(S, dc, Lc + s * 48); });
      parkTrees(S); for (let k = 0; k < 5; k++) balloons(S, d(0.1 + k * 0.2), 14, S.sr, 130);
      hotAir(S, d(0.3), -150, 100, S.sr); hotAir(S, d(0.7), 140, 120, S.sr);
      foe(S, 'aaturret', d(0.1), 20, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'tank', d(0.42), 0, 0, { name: 'BLINDE', hp: 2, armed: false });
      foe(S, 'heli', d(0.62), 0, 60, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -24, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 24, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'jeep', d(0.86), -6, 0, { name: 'JEEP', path: 80, speed: 18 });
    } };

  // ---------- SCENE 6 : LA GRANDE ROUE : 150 m, face a la fusee ; on passe entre ses rayons pendant qu'elle tourne ----------
  function giantWheel(S, dc) {
    S.reserve(dc, 0, 160, 40);
    S.item(dc, (r) => {
      const Lc = S.lane(dc).lx, R = 70, HY = 82, NS = 16;
      // les pieds en A (devant et derriere le plan de la roue), le socle, la gare d'embarquement
      const LL = Math.hypot(46, HY), RA = Math.atan2(46, HY) * 180 / Math.PI; for (const e of [-1, 1]) for (const s of [-1, 1]) S.bxr(dc + e * 7, Lc + s * 23, HY / 2, 2.6, LL, 2.6, 'col:#e8ecf2', undefined, s * RA, 0, true);
      S.bx(dc, Lc, HY, 6, 6, 18, 'col:' + C.navy, undefined, true);
      for (const s of [-1, 1]) S.bx(dc, Lc + s * 46, 2, 14, 4, 22, 'col:' + C.stone, undefined, true);
      const grp = new T3.Group(), rot = new T3.Group(); grp.add(rot);
      const parts = [{ g: TO(R, 1.6, 8, 64), c: C.red, p: [0, 0, 0] }, { g: TO(R - 6, 0.8, 6, 64), c: C.white, p: [0, 0, 0] }, { g: TO(R * 0.42, 0.7, 6, 40), c: C.yellow, p: [0, 0, 0] }, { g: CY(5, 5, 8, 20), c: C.gold, p: [0, 0, 0], r: [Math.PI / 2, 0, 0] }, { g: CY(3, 3, 9, 16), c: C.navy, p: [0, 0, 0], r: [Math.PI / 2, 0, 0] }];
      for (let i = 0; i < NS; i++) { const a = i / NS * 6.283; parts.push({ g: BX(1.3, R, 1.3), c: '#f0f2f6', p: [Math.sin(a) * R / 2, Math.cos(a) * R / 2, 0], r: [0, 0, -a] }); }
      const body = bake(parts); rot.add(body);
      const bl = []; for (let i = 0; i < NS; i++) { const a = i / NS * 6.283; for (let k = 2; k < 11; k++) bl.push({ g: SP(0.45, 6, 5), c: k % 2 ? '#fff0b8' : '#ffd36a', p: [Math.sin(a) * k * 6.2, Math.cos(a) * k * 6.2, 0.9] }); } for (let i = 0; i < 64; i++) { const a = i / 64 * 6.283; bl.push({ g: SP(0.6, 6, 5), c: i % 2 ? '#fff0b8' : '#ff8ad8', p: [Math.sin(a) * (R + 1.8), Math.cos(a) * (R + 1.8), 0] }); }
      rot.add(bake(bl, true));
      // collisions : rayons (5 morceaux chacun), jante (48 morceaux), moyeu
      for (let i = 0; i < NS; i++) { const a = i / NS * 6.283; for (let k = 0; k < 5; k++) { const c = EVO.colBox(body, 1.6, R / 5, 1.6, Math.sin(a) * (k + 0.5) * R / 5, Math.cos(a) * (k + 0.5) * R / 5, 0); c.rotation.z = -a; } }
      for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, c = EVO.colBox(body, 3.4, 2 * Math.PI * R / 48 + 0.4, 3.4, Math.sin(a) * R, Math.cos(a) * R, 0); c.rotation.z = -a + Math.PI / 2 - Math.PI / 2; c.rotation.z = -a - Math.PI / 2; }
      EVO.colBox(body, 10, 10, 9, 0, 0, 0);
      // les nacelles : toujours a l'endroit (instanciees), suspendues a la jante
      const NG = 32, gm = new T3.InstancedMesh(BX(5, 5.4, 5), MT.ball || (MT.ball = new T3.MeshLambertMaterial({ color: '#ffffff' })), NG), gr = new T3.InstancedMesh(CO(3.6, 2.2, 8), lam('#f6f2ea'), NG); gm.frustumCulled = gr.frustumCulled = false; gm.castShadow = true;
      for (let i = 0; i < NG; i++) gm.setColorAt(i, _c.set(BAL[i % 7])); grp.add(gm); grp.add(gr);
      EVO.placeGroup(S, grp, dc, Lc, HY, 0); const a0 = r() * 6, m4 = new T3.Matrix4(), pv = new T3.Vector3(), q0 = new T3.Quaternion(), sv = new T3.Vector3(1, 1, 1), sp = 0.11;
      EVO.addDyn(grp, (t) => { const A = a0 + t * sp; rot.rotation.z = A; for (let i = 0; i < NG; i++) { const b = i / NG * 6.283, px = Math.sin(b) * (R + 1), py = Math.cos(b) * (R + 1); pv.set(px * Math.cos(A) - py * Math.sin(A), px * Math.sin(A) + py * Math.cos(A) - 4.5, 0); m4.compose(pv, q0, sv); gm.setMatrixAt(i, m4); pv.y += 3.6; m4.compose(pv, q0, sv); gr.setMatrixAt(i, m4); } gm.instanceMatrix.needsUpdate = true; gr.instanceMatrix.needsUpdate = true; }, body.children.slice(), { near: 9999, span: 200 });
    });
  }
  D.scenes.froue = { len: [600, 600], noDoor: true, noChaos: true, noDress: true, turns: [[0.72, 0.92, 28]],
    pin: (T, sc) => ({ lx: 0, y: 40, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: (d, lx, c) => { c.lerp(new T3.Color('#5aa84a'), 0.55); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, dW = d(0.42);
      paveScene(S, (dd, x) => { const ro = rosace(dd, x, dW, 0, 64, C.terra, C.rose, C.gold); if (ro) return ro; const ax = Math.abs(x), rr = Math.hypot(dd - dW, x); if (ax < 12) return ['#e8dcc0', 'foireDalles']; if (Math.abs(rr - 92) < 6) return ['#e8dcc0', 'foireDalles']; if (Math.abs(x - 60) < 4 || Math.abs(x + 60) < 4) return ['#e0d4b8', 'foireDalles']; return null; });
      giantWheel(S, dW);
      for (const [u, s, k, x] of [[0.12, -1, 'car', 70], [0.18, 1, 'vil', 72], [0.3, -1, 'food', 110], [0.62, 1, 'top', 110], [0.68, -1, 'vil', 70], [0.82, 1, 'drop', 66], [0.9, -1, 'swing', 80]]) { S.reserve(d(u), s * x, 56, 56); S.item(d(u), (r) => { const lx = S.lane(d(u)).lx + s * x; if (k === 'car') carousel(S, d(u), lx, r, 1.6); else if (k === 'swing') swingRide(S, d(u), lx, r, 1.6); else if (k === 'drop') dropTower(S, d(u), lx, r, 110); else if (k === 'food') foodCourt(S, d(u), lx, r); else if (k === 'top') bigTop(S, d(u), lx, r, 1.3); else village(S, d(u), lx, r); }); }
      fillers(S, 30, 70, 20);
      for (let dc = S.d0 + 12; dc < S.d1; dc += 24) S.item(dc, () => { if (Math.abs(dc - dW) < 30) return; const Lc = S.lane(dc).lx; for (const s of [-1, 1]) lampPost(S, dc, Lc + s * 22); });
      parkTrees(S); for (let k = 0; k < 5; k++) balloons(S, d(0.1 + k * 0.2), 16, S.sr, 130);
      hotAir(S, d(0.2), 40, 120, S.sr); hotAir(S, d(0.75), -50, 110, S.sr);
      foe(S, 'heli', d(0.25), 0, 70, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -30, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 30, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'aaturret', d(0.3), 30, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'tank', d(0.6), -10, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'rocketTruck', d(0.8), 14, 0, { name: 'LANCE-ROQUETTES', armed: true });
    } };

  // ---------- utilitaire : poutre orientee entre deux points du couloir (pente et cap), hauteurs ABSOLUES (le relief est retire) ----------
  function beam(S, m0, x0, y0, m1, x1, y1, w, h, col, collide) {
    const T = S.T, p0 = S.at(m0, x0, y0 - T.rel(m0)), p1 = S.at(m1, x1, y1 - T.rel(m1)), dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], hz = Math.hypot(dx, dz), Ln = Math.hypot(hz, dy) + 0.06;
    S.b.box({ p: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], s: [w, h, Ln], r: [-Math.atan2(dy, hz) * 180 / Math.PI, Math.atan2(dx, dz) * 180 / Math.PI, 0], mat: 'col:' + col, collide: !!collide, shadow: true });
  }

  // ---------- SCENE 7 : LES MONTAGNES RUSSES : montee de 110 m et descente a cote du chemin, puis le rail passe AU-DESSUS du chemin
  // et s'enroule autour de lui : LE TIRE-BOUCHON GEANT (3 tours, 28 m de rayon) qu'on traverse par l'interieur, un train y tourne autour de la fusee ----------
  const CL = 840, CX = -14, HR = 28, HYC = 10 + HR, HN = 3;
  const coastY = (u) => u < 0.08 ? 12 : u < 0.32 ? 12 + 98 * ss(0.08, 0.32, u) : u < 0.36 ? 110 : u < 0.47 ? 110 - 96 * ss(0.36, 0.47, u) : 14;
  function coastPts(S) {   // la ligne du rail [d, travers, hauteur absolue, type]
    const L = S.len, d = (u) => S.d0 + u * L, P = [];
    for (let m = d(0.02); m < d(0.46); m += 3) P.push([m, CX, coastY((m - S.d0) / L), 0]);
    const a0 = d(0.46), a1 = d(0.5), y0 = coastY(0.46); for (let k = 0; k <= 10; k++) { const t = k / 10; P.push([a0 + (a1 - a0) * t, CX * (1 - ss(0, 1, t)), y0 + (10 - y0) * t, 0]); }
    const h0 = d(0.5), h1 = d(0.78), NS = HN * 44; for (let k = 1; k <= NS; k++) { const t = k / NS, th = t * HN * 6.2832; P.push([h0 + (h1 - h0) * t, HR * Math.sin(th), HYC - HR * Math.cos(th), Math.cos(th) > 0.93 ? 2 : 1]); }
    const b0 = d(0.78), b1 = d(0.84); for (let k = 1; k <= 10; k++) { const t = k / 10; P.push([b0 + (b1 - b0) * t, CX * ss(0, 1, t), 10 + 12 * t, 0]); }
    for (let m = b1 + 3; m < d(0.99); m += 3) P.push([m, CX, 22 + 7 * Math.sin((m - b1) * 0.04), 0]);
    return P;
  }
  D.scenes.fcoaster = { len: [CL, CL], noDoor: true, noChaos: true, noDress: true, grass: false, turns: [[0.88, 0.98, 36]],
    pin: (T, sc) => ({ lx: 0, y: HYC, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: groundJ(W0),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T, P = coastPts(S), Lx = (m) => S.lane(m).lx;
      // sol de la zone : BETON industriel (dalles grises, bandes jaunes sous le rail, cercles peints bleus sous les maneges)
      paveScene(S, (dd, x) => { const u = (dd - S.d0) / L, i = Math.floor((dd - S.d0) / 4), j = Math.floor((x + 400) / 4), ax = Math.abs(x);
        if (u < 0.47 || u > 0.83) { if (Math.abs(x - CX) < 4) return ['#e8c040', 'foireBeton']; if (Math.abs(x - CX) < 8) return ['#3a3a40', 'foireBeton']; }
        else if (ax < HR + 4) return [Math.floor(Math.hypot(ax, 0) / 4) % 2 ? '#5a8ad8' : '#d8d4c8', 'foireBeton'];
        return [(i % 10 === 0 || j % 10 === 0) ? '#a8a49a' : (hsh(i, j) < 0.5 ? '#d2cec4' : '#c4c0b6'), 'foireBeton']; });
      // le rail : caisson rouge + poutre jaune ; pylones blancs sous le rail lateral, poteaux sous les points bas du tire-bouchon
      for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; S.item(a[0], () => {
        beam(S, a[0], Lx(a[0]) + a[1], a[2] + 1, b[0], Lx(b[0]) + b[1], b[2] + 1, 2.8, 1.0, C.red, true);
        beam(S, a[0], Lx(a[0]) + a[1], a[2], b[0], Lx(b[0]) + b[1], b[2], 1.1, 1.1, C.yellow, false);
        if (a[3] === 0 && i % 3 === 0 && a[2] > 6) { for (const o of [-2.4, 2.4]) S.bx(a[0], Lx(a[0]) + a[1] + o, (a[2] - 0.6) / 2, 0.9, a[2] - 0.6, 0.9, 'col:' + C.white, undefined, true); if (a[2] > 30 && i % 6 === 0) for (const o of [-7, 7]) S.bx(a[0], Lx(a[0]) + a[1] + o, (a[2] - 6) / 2, 0.8, a[2] - 6, 0.8, 'col:#e0e4ea', undefined, true); }
        if (a[3] === 2 && i % 2 === 0) S.bx(a[0], Lx(a[0]) + a[1], (a[2] - 0.5) / 2, 1.4, a[2] - 0.5, 1.4, 'col:' + C.white, undefined, true);
        if (a[3] && i % 4 === 0) { const ox = a[1] * 0.06, oy = (a[2] - HYC) * 0.06; S.ball(a[0], Lx(a[0]) + a[1] + ox, a[2] + oy + 1, 0.7, 'emis:' + (i % 8 ? '#fff0b8' : '#ff8ad8'), undefined, false); }
        if (a[3] === 0 && (a[0] - S.d0) / L > 0.08 && (a[0] - S.d0) / L < 0.32) beam(S, a[0], Lx(a[0]) + a[1], a[2] + 1.6, b[0], Lx(b[0]) + b[1], b[2] + 1.6, 0.5, 0.3, '#222222', false); }); }
      // la gare (toit raye), les fanions de la montee, un portique lumineux a l'entree du tire-bouchon
      S.item(d(0.04), () => { const dc = d(0.04); S.bx(dc, CX, 2, 22, 4, 40, 'col:' + C.stone, undefined, true); for (const s of [-1, 1]) for (const z of [-16, 0, 16]) S.bx(dc + z, CX + s * 10, 10, 1, 16, 1, 'col:' + C.gold, undefined, true); for (let k = 0; k < 8; k++) for (const s of [-1, 1]) S.bxr(dc - 17.5 + k * 5, CX + s * 6, 19.6, 13, 0.4, 5.02, 'col:' + (k % 2 ? C.white : C.red), undefined, s * 18, 0, false); });
      for (let u = 0.12; u < 0.32; u += 0.04) S.item(d(u), (r) => { const dc = d(u), Lc = Lx(dc) + CX, y = coastY(u); for (const s of [-1, 1]) { S.cyl(dc, Lc + s * 6, y - T.rel(dc) + 1.5, 0.12, 6, 'col:#dddddd', undefined, 6, 0.12, false); S.bx(dc, Lc + s * 7.2, y + 6.2, 2.4, 1.6, 0.08, 'col:' + pk(r, BAL), undefined, false); } });
      S.item(d(0.49), () => { const dc = d(0.49), Lc = Lx(dc); for (const s of [-1, 1]) { S.bx(dc, Lc + s * (HR + 8), 36, 4, 72, 4, 'col:' + C.navy, undefined, true); S.ball(dc, Lc + s * (HR + 8), 74, 3, 'col:' + C.gold, undefined, false); } S.bx(dc, Lc, 72, 2 * HR + 20, 4, 4, 'col:' + C.navy, undefined, true); S.bx(dc - 2.1, Lc, 72, 2 * HR, 2.4, 0.2, 'col:' + C.yellow, undefined, false); for (let k = 0; k < 30; k++) S.bx(dc - 2.2, Lc - HR + k * (2 * HR / 29), 74.4, 0.5, 0.5, 0.2, 'emis:#fff0b8', undefined, false, { shadow: false }); });
      // le train : 4 wagons qui parcourent tout le rail en boucle (dans le tire-bouchon, il tourne autour de la fusee)
      S.item(d(0.5), () => {
        const W = P.map((q) => S.at(q[0], Lx(q[0]) + q[1], q[2] + 1.6 - T.rel(q[0]))), cum = [0]; for (let i = 1; i < W.length; i++) cum.push(cum[i - 1] + Math.hypot(W[i][0] - W[i - 1][0], W[i][1] - W[i - 1][1], W[i][2] - W[i - 1][2]));
        const tot = cum[cum.length - 1], at = (s, out) => { s = ((s % tot) + tot) % tot; let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; } const t = (s - cum[lo]) / Math.max(0.001, cum[hi] - cum[lo]); out.set(W[lo][0] + (W[hi][0] - W[lo][0]) * t, W[lo][1] + (W[hi][1] - W[lo][1]) * t, W[lo][2] + (W[hi][2] - W[lo][2]) * t); return out; };
        const grp = new T3.Group(), cars = [], cols = []; for (let i = 0; i < 4; i++) { const c = new T3.Group(), m = bake([{ g: BX(3.6, 2.2, 4.6), c: BAL[i], p: [0, 1.3, 0] }, { g: BX(3.7, 0.5, 4.8), c: C.white, p: [0, 2.5, 0] }, { g: BX(3.2, 1.2, 0.4), c: '#222222', p: [0, 2.6, -1.2] }, { g: BX(3.8, 0.6, 4.8), c: '#333333', p: [0, 0.2, 0] }].concat(i === 0 ? [{ g: SP(1.4, 8, 6), c: C.red, p: [0, 1.6, 2.6] }] : [])); c.add(m); cols.push(EVO.colBox(c, 4, 3.4, 5, 0, 1.2, 0)); grp.add(c); cars.push(c); }
        S.b.root.add(grp); const pa = new T3.Vector3(), pb = new T3.Vector3(), up = new T3.Vector3();
        EVO.addDyn(grp, (t) => { const s0 = t * 34; for (let i = 0; i < cars.length; i++) { const c = cars[i], s = s0 - i * 5.4; at(s, pa); at(s + 2, pb); c.position.copy(pa); c.lookAt(pb); } }, cols, { near: 99999, span: 99999 });
      });
      // decor autour : maneges, villages, remplissage, montgolfieres
      for (const [u, s, k, x] of [[0.1, 1, 'car', 70], [0.2, -1, 'vil', 64], [0.3, 1, 'drop', 60], [0.42, -1, 'top', 100], [0.56, 1, 'vil', 76], [0.66, -1, 'swing', 90], [0.74, 1, 'tents', 100], [0.92, -1, 'car', 70]]) { S.reserve(d(u), s * x, 56, 56); S.item(d(u), (r) => { const lx = Lx(d(u)) + s * x; if (k === 'car') carousel(S, d(u), lx, r, 1.6); else if (k === 'swing') swingRide(S, d(u), lx, r, 1.6); else if (k === 'drop') dropTower(S, d(u), lx, r, 120); else if (k === 'tents') tents(S, d(u), lx, r, 5); else if (k === 'top') bigTop(S, d(u), lx, r, 1.3); else village(S, d(u), lx, r); }); }
      S.reserve(d(0.64), 0, 2 * HR + 16, 0.3 * L); fillers(S, 30, 60, 22); parkTrees(S); for (let k = 0; k < 6; k++) balloons(S, d(0.08 + k * 0.16), 14, S.sr, 130);
      hotAir(S, d(0.25), 34, 90, S.sr, true); hotAir(S, d(0.9), 40, 70, S.sr, true);
      foe(S, 'heli', d(0.2), 0, 90, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 26, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'aaturret', d(0.35), 22, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'tank', d(0.45), 18, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'heli', d(0.88), 0, 50, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 26, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'jeep', d(0.94), 14, 0, { name: 'JEEP', path: 90, speed: 18 });
    } };

  // ---------- SCENE 8 : LE CHOIX : deux facades geantes cote a cote, l'usine a bonbons (gauche) et le manoir hante (droite), une porte chacune ----------
  const DOOR = { w: 76, h: 48, x: 48 };   // v411 : portes de 76 m, centrees a +-48 m ; mur central de 20 m entre les deux
  D.scenes.fchoix = { len: [300, 300], noDoor: true, noChaos: true, noDress: true, grass: false,
    pin: (T, sc) => ({ lx: 0, y: 16, from: 20, to: sc.d1 - sc.d0 - 4 }),
    ground: groundJ(W0),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, dF = S.d1 - 3;
      paveScene(S, (dd, x) => { const i = Math.floor((dd - S.d0) / 4); if (Math.abs(x) < 100 && dd > S.d0 + 120) return [x < 0 ? (i % 2 ? '#f0b8d0' : C.cream) : (i % 2 ? '#8a7aa8' : '#b8b0c8'), x < 0 ? 'foireDalles' : 'foirePaves']; const j = Math.floor((x + 400) / 4); return [(i % 12 === 0 || j % 12 === 0) ? C.terra : (hsh(i, j) < 0.5 ? C.sand : C.grey), 'foireDalles']; });
      S.reserve(dF - 20, 0, 400, 60);
      for (const u of [0.55, 0.7, 0.85]) S.item(d(u), () => { for (const s of [-1, 1]) for (let k = 0; k < 5; k++) S.bx(d(u) + k * 3, s * (14 + k * 4), 0.15, 3, 0.1, 3, 'col:' + (s < 0 ? C.pink : '#7aff9a'), undefined, false, { shadow: false }); });
      S.item(dF, (r) => {
        // ===== la facade continue (tout le monde du parc s'arrete ici) : percee de deux portes =====
        const H = 92, fz = 6, Lw = -DOOR.x - DOOR.w / 2, Lr = -DOOR.x + DOOR.w / 2, Rl = DOOR.x - DOOR.w / 2, Rr = DOOR.x + DOOR.w / 2;
        const wall = (x0, x1, y0, y1, col) => { if (x1 - x0 > 0.1 && y1 - y0 > 0.1) S.bx(dF, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, fz, 'col:' + col, undefined, true); };
        // usine a bonbons : rose et blanc, cheminees rayees ; manoir : violet nuit, tours pointues
        wall(-420, Lw, 0, 66, '#ffb6d0'); wall(Lw, Lr, DOOR.h, 66, '#ffb6d0'); wall(Lr, -10, 0, 66, '#ffb6d0');
        wall(10, Rl, 0, 70, '#4a3a66'); wall(Rl, Rr, DOOR.h, 70, '#4a3a66'); wall(Rr, 420, 0, 70, '#4a3a66'); wall(-10, 10, 0, H, C.stone); S.ball(dF - 4, 0, H, 10, 'col:' + C.gold, undefined, false);
        S.bx(dF - 0.5, -215, 66.8, 410, 1.6, fz + 1, 'col:' + C.white, undefined, false); S.bx(dF - 0.5, 215, 70.8, 410, 1.6, fz + 1, 'col:#2a2040', undefined, false);
        // usine : toits en dents de scie, cheminees rayees qui fument rose, fenetres, grosse sucette sur le fronton
        for (let x = -170; x < -12; x += 16) { S.bxr(dF + 8, x, 72, 16, 0.6, 20, 'col:' + C.white, undefined, 20, 0, false); }
        for (const x of [-150, -110, -60, -30]) { S.cyl(dF + 10, x, 64, 3.4, 30, 'col:' + C.white, undefined, 12, 3, true); for (let k = 0; k < 4; k++) S.cyl(dF + 10, x, 68 + k * 7, 3.5, 2.4, 'col:' + C.pink, undefined, 12, 3.5, false); }
        for (const x of [-150, -130, -110]) for (const y of [14, 32, 50]) { S.bx(dF - 3.1, x, y, 7, 6, 0.3, 'col:#fff0f6', undefined, false); S.bx(dF - 3.2, x, y, 6, 5, 0.2, 'emis:#ffd0e8', undefined, false, { shadow: false }); }
        S.cyl(dF - 4, -DOOR.x, DOOR.h + 2, 0.6, 2, 'col:' + C.white, undefined, 8, 0.6, false); for (let k = 0; k < 3; k++) S.cyl(dF - 4 - k * 0.1, -DOOR.x, DOOR.h + 8 + k * 0.12, 8 - k * 2.4, 1.4, 'col:' + [C.red, C.white, C.red][k], undefined, 20, 8 - k * 2.4, k === 0);
        for (let k = 0; k < 38; k++) S.bx(dF - 3.3, Lw + 1 + k * 1.95, DOOR.h + 1, 0.4, 0.4, 0.2, 'emis:#fff0b8', undefined, false, { shadow: false });
        // manoir : tours a toits pointus, fenetres eclairees vert et orange, grille, lucarnes
        for (const x of [104, 136, 168]) { S.bx(dF + 6, x, 42, 16, 84, 16, 'col:#3a2c52', undefined, true); S.cyl(dF + 6, x, 84, 11.4, 24, 'col:#241a38', undefined, 4, 0.2, false); S.ball(dF + 6, x, 109, 0.9, 'emis:#7aff9a', undefined, false); for (const y of [16, 34, 52, 70]) S.bx(dF - 2.2, x, y, 4, 6, 0.3, 'emis:' + (y === 30 ? '#ffb04a' : '#7aff9a'), undefined, false, { shadow: false }); }
        for (let x = 14; x < 100; x += 9) S.bxr(dF + 9, x, 73, 9, 0.6, 22, 'col:#241a38', undefined, -20, 0, false);
        for (let k = 0; k < 38; k++) S.bx(dF - 3.3, Rl + 1 + k * 1.95, DOOR.h + 1, 0.4, 0.4, 0.2, 'emis:' + (k % 2 ? '#7aff9a' : '#c08aff'), undefined, false, { shadow: false });
        // panneaux au-dessus des portes : sucette rose / tete de fantome en drap
        S.ball(dF - 4, DOOR.x, DOOR.h + 12, 6, 'col:#f4f4f8', undefined, false, 1.2); S.cyl(dF - 4, DOOR.x, DOOR.h + 3, 6, 8, 'col:#f4f4f8', undefined, 14, 5.6, false); for (const o of [-2, 2]) S.ball(dF - 9.6, DOOR.x + o, DOOR.h + 13, 1.1, 'col:#1a1020', undefined, false);
        S.glow(dF - 6, -DOOR.x, 16, '#ffb6d0', 40); S.glow(dF - 6, DOOR.x, 16, '#9aff9a', 40);
      });
      // la place devant : fontaines, villages, manege de chaque cote, fumee rose et brume verte (sphere translucide)
      for (const [u, s, k, x] of [[0.16, -1, 'vil', 64], [0.2, 1, 'car', 70], [0.4, -1, 'swing', 90], [0.45, 1, 'tents', 96], [0.62, -1, 'drop', 70], [0.66, 1, 'top', 120]]) { S.reserve(d(u), s * x, 56, 56); S.item(d(u), (r) => { const lx = S.lane(d(u)).lx + s * x; if (k === 'car') carousel(S, d(u), lx, r, 1.6); else if (k === 'swing') swingRide(S, d(u), lx, r, 1.6); else if (k === 'drop') dropTower(S, d(u), lx, r, 110); else if (k === 'tents') tents(S, d(u), lx, r, 5); else if (k === 'top') bigTop(S, d(u), lx, r, 1.3); else village(S, d(u), lx, r); }); }
      jets(S, d(0.3), [-14, 0, 14], 0, 3.4);
      fillers(S, 24, 54, 22); parkTrees(S); for (let k = 0; k < 3; k++) balloons(S, d(0.15 + k * 0.3), 14, S.sr, 130);
      foe(S, 'tank', d(0.24), -10, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'aaturret', d(0.5), 18, 0, { name: 'TOURELLE', armed: true });
      foe(S, 'heli', d(0.7), 0, 40, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 26, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
    } };

  // ---------- SCENE 9 : SOUS LE PARC : deux tunnels qui descendent (usine / train fantome), puis les galeries communes, puis la remontee ----------
  const SL = 900, DEEP = 64;
  const ghostM = () => MT.ghost || (MT.ghost = new T3.MeshLambertMaterial({ color: '#f4f4f8', emissive: '#9aff9a', emissiveIntensity: 0.12, transparent: true, opacity: 0.88 }));
  D.scenes.fsous = { len: [SL, SL], noDoor: true, noChaos: true, noDress: true, grass: false, gw: 100,
    pin: (T, sc) => ({ lx: -DOOR.x, y: 18, from: 0, to: (sc.d1 - sc.d0) * 0.3 }),   // la trajectoire par defaut passe par l'usine (le joueur choisit librement)
    relief(T, sc) { const fn = (d) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); return -DEEP * ss(0.03, 0.2, u) * (1 - ss(0.76, 0.96, u)); }; sc.rlo = -DEEP; sc.rhi = 0; return { fn, max: DEEP }; },
    ground: (d, lx, c, sc) => { const u = (d - sc.d0) / (sc.d1 - sc.d0); c.lerp(new T3.Color(u < 0.32 ? (lx < 0 ? '#c8a0b4' : '#4a4058') : '#6a6070'), 0.95); },
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, T = S.T, uSplit = 0.34, H = 54;
      // ===== parois et plafonds (les hauteurs suivent le sol creuse) =====
      for (let dc = S.d0 + 6; dc < S.d1 - 2; dc += 12) S.item(dc, (r) => {
        const u = (dc - S.d0) / L, two = u < uSplit, fl = T.rel(dc), Lc = 0, hw = two ? DOOR.x + DOOR.w / 2 + 2 : 80, top = Math.max(H, -fl + 50);
        const wc = (x) => two ? (x < 0 ? '#ffc8dc' : '#3a2c52') : '#5a5068';
        for (const s of [-1, 1]) S.bx(dc, Lc + s * (hw + 6), top / 2 - 4, 12, top + 8, 12.4, 'col:' + wc(s), undefined, true);
        S.bx(dc, Lc, H + 6, 2 * hw + 24, 12, 12.4, 'col:' + (two ? '#5a4a68' : '#4a4058'), undefined, true);   // plafond (le dessus du tunnel)
        if (-fl + 2 > H + 12) S.bx(dc, Lc, (H + 12 + (-fl + 4)) / 2, 2 * hw + 24, (-fl + 4) - (H + 12), 12.4, 'col:#6a5a50', undefined, true);   // la terre au-dessus du tunnel jusqu'au niveau du parc
        if (two) { S.bx(dc, Lc, H / 2, 20, H + 2, 12.4, 'col:' + C.stone, undefined, true); for (const s of [-1, 1]) S.bx(dc, Lc + s * 10.2, H * 0.4, 0.3, 1.2, 12.4, 'emis:' + (s < 0 ? '#ffb6d0' : '#7aff9a'), undefined, false, { shadow: false }); }   // le mur central entre les deux tunnels
        // eclairage
        if (Math.round(dc / 12) % 2 === 0) { if (two) { S.bx(dc, Lc - DOOR.x, H - 0.5, 10, 0.4, 2, 'emis:#ffe0f0', undefined, false); S.glow(dc, Lc - DOOR.x, H - 2, '#ffd0e8', 34); S.bx(dc, Lc + DOOR.x, H - 0.5, 4, 0.4, 2, 'emis:#7aff9a', undefined, false); S.glow(dc, Lc + DOOR.x, H - 2, '#7aff9a', 24); } else { S.bx(dc, Lc, H - 0.5, 14, 0.4, 2, 'emis:#ffe9c0', undefined, false); S.glow(dc, Lc, H - 2, '#ffd8a8', 40); for (const s of [-1, 1]) { S.ball(dc, Lc + s * (hw - 1), 14, 0.7, 'emis:' + BAL[Math.round(dc) % 7], undefined, false); S.glow(dc, Lc + s * (hw - 2), 14, BAL[Math.round(dc) % 7], 14); } } }
      });
      // ===== cote USINE A BONBONS : tapis roulants, tuyaux de sucre, sucettes geantes, bonbons qui defilent =====
      for (let dc = S.d0 + 20; dc < d(uSplit) - 10; dc += 26) S.item(dc, (r) => { const Lc = 0, x = Lc - DOOR.x;
        S.bx(dc, x - 32, 2, 6, 4, 22, 'col:#e8e8f0', undefined, true); S.bx(dc, x - 32, 4.2, 6.4, 0.4, 22.4, 'col:#333333', undefined, false); for (let k = 0; k < 5; k++) S.ball(dc - 8 + k * 4, x - 32, 5.6, 1.1, 'col:' + pk(r, BAL), undefined, false);
        S.cyl(dc, x + 32, 0, 1.6, H, 'col:' + C.white, undefined, 10, 1.6, true); for (let k = 0; k < 6; k++) S.cyl(dc, x + 32, 3 + k * 8, 1.7, 2.4, 'col:' + C.red, undefined, 10, 1.7, false);
        if (r() < 0.6) { S.cyl(dc + 8, x - 30, 0, 0.5, 18, 'col:' + C.white, undefined, 8, 0.5, true); for (let k = 0; k < 3; k++) S.cyl(dc + 8, x - 30, 17.6 + k * 0.1, 5 - k * 1.5, 1.2, 'col:' + [C.pink, C.white, C.cyan][k], undefined, 18, 5 - k * 1.5, k === 0); }
        S.bx(dc, x, H - 3, 70, 1.6, 1.6, 'col:#d8d8e0', undefined, true); S.bx(dc, x, H - 1.8, 70, 0.6, 2, 'col:' + C.pink, undefined, false); });
      // presses a bonbons qui descendent sur le chemin de l'usine (obstacle rythme)
      for (const [u, ph] of [[0.15, 0], [0.24, 1.2]]) S.item(d(u), () => { const dc = d(u), Lc = 0, x = Lc - DOOR.x, fl = T.rel(dc); const g = new T3.Group(), body = bake([{ g: BX(18, 8, 8), c: C.pink, p: [0, 0, 0] }, { g: BX(18.4, 1.2, 8.4), c: C.white, p: [0, -4.4, 0] }, { g: BX(1.4, 30, 1.4), c: '#888888', p: [-6, 18, 0] }, { g: BX(1.4, 30, 1.4), c: '#888888', p: [6, 18, 0] }]); g.add(body); EVO.colBox(body, 18.4, 9, 8.4, 0, -0.4, 0);
        EVO.placeGroup(S, g, dc, x, 0, 0); const y0 = g.position.y; EVO.addDyn(g, (t) => { const k = ((t + ph) % 3.2) / 3.2, h = k < 0.5 ? 26 * ss(0, 0.5, k) : k < 0.7 ? 26 : k < 0.78 ? 26 * (1 - Math.pow((k - 0.7) / 0.08, 2)) : 0; g.position.y = y0 + 5 + h; }, body.children.slice(), { near: 9999, span: 40 }); });
      // ===== cote MANOIR / TRAIN FANTOME : rails, wagons fantomes qui arrivent, draps de fantomes qui flottent, cercueils, toiles =====
      for (let dc = S.d0 + 10; dc < d(uSplit) - 6; dc += 3) S.item(dc, () => { const Lc = 0, x = Lc + DOOR.x + 28, fl = T.rel(dc), fl1 = T.rel(dc + 3); beam(S, dc, x - 1, fl + 0.4, dc + 3, x - 1, fl1 + 0.4, 0.3, 0.3, '#888888', false); beam(S, dc, x + 1, fl + 0.4, dc + 3, x + 1, fl1 + 0.4, 0.3, 0.3, '#888888', false); });
      for (let dc = S.d0 + 30; dc < d(uSplit) - 10; dc += 34) S.item(dc, (r) => { const Lc = 0, x = Lc + DOOR.x; for (let k = 0; k < 2; k++) { const xx = x - 30 + k * 18, zz = dc + r.between([-6, 6]); S.bx(zz, xx, 0.8, 2.6, 1.6, 6, 'col:#2a1a10', undefined, true); S.bx(zz, xx, 1.7, 2.8, 0.3, 6.2, 'col:#4a2a18', undefined, false); } for (let k = 0; k < 4; k++) S.bx(dc + k * 2, x + 15, 20 + k * 3, 0.05, 10, 0.05, 'col:#dddddd', undefined, false, { shadow: false }); });
      for (let k = 0; k < 5; k++) S.item(d(0.05 + k * 0.055), (r) => { const dc = d(0.05 + k * 0.055), Lc = 0, x = Lc + DOOR.x + (k % 2 ? -1 : 1) * r.between([16, 28]), g = new T3.Group(), sheet = new T3.Mesh(CO(3.4, 7, 12, 1, true), ghostM()), head = new T3.Mesh(SP(2.4, 12, 9), ghostM()); sheet.position.y = 0; head.position.y = 3.6; g.add(sheet); g.add(head); for (const o of [-0.8, 0.8]) { const e = new T3.Mesh(SP(0.45, 6, 5), lam('#120a18')); e.position.set(o, 4, -2.1); g.add(e); } EVO.colBox(g, 6, 9, 6, 0, 1, 0);
        EVO.placeGroup(S, g, dc, x, 16 + r() * 10, Math.PI); const y0 = g.position.y, x0 = g.position.x, ph = r() * 6; EVO.addDyn(g, (t) => { g.position.y = y0 + Math.sin(t * 1.3 + ph) * 3.5; g.position.x = x0 + Math.sin(t * 0.7 + ph) * 5; g.rotation.z = Math.sin(t * 1.1 + ph) * 0.15; }, g.children.filter((o) => o.userData.size), { near: 9999, span: 40 }); });
      // le train fantome : trois wagons noirs a yeux verts qui foncent en face sur leur rail
      S.item(d(0.12), () => { const g = new T3.Group(), parts = []; for (let i = 0; i < 3; i++) { const z = -i * 6; parts.push({ g: BX(4.6, 3.4, 5.4), c: '#1a1220', p: [0, 2.2, z] }, { g: BX(4.8, 0.6, 5.6), c: '#7a2a8a', p: [0, 4.1, z] }, { g: SP(0.6, 6, 5), c: '#7aff9a', p: [-1.2, 3.4, z + 2.8] }, { g: SP(0.6, 6, 5), c: '#7aff9a', p: [1.2, 3.4, z + 2.8] }); }
        const body = bake(parts); g.add(body); EVO.colBox(body, 5, 4.6, 18, 0, 2.2, -6); S.b.root.add(g); const st = { on: false, t0: 0 }, dA = d(0.04), dB = d(uSplit - 0.02);
        EVO.addDyn(g, (t, dt, game) => { const run = game.endlessRun; if (!run) return; if (!st.on && game.state === 'FLIGHT' && run.dist > dA - 60) { st.on = true; st.t0 = t; } if (run.dist < dA - 120) st.on = false; if (!st.on) { g.visible = false; return; } const dd = dB - 34 * (t - st.t0); g.visible = dd > dA; if (!g.visible) return;
          const x = 0 + DOOR.x + 28, p = T.at(dd, x, 0.5), q = T.at(dd - 4, 0 + DOOR.x + 28, 0.5); g.position.set(p[0], p[1], p[2]); g.lookAt(q[0], q[1], q[2]); }, [body], { near: 99999, span: 9999 });
        EVO.dyn[EVO.dyn.length - 1].cols = body.children.slice(); });
      // ===== LES GALERIES communes : piliers rayes, lanternes, bonbons geants et fantomes melanges, quelques arches lumineuses =====
      for (let dc = d(uSplit) + 20; dc < d(0.78); dc += 30) S.item(dc, (r) => { const Lc = 0; for (const x of [-50, 50]) { const xx = Lc + x + r.between([-4, 4]); S.cyl(dc, xx, 0, 2.6, H, 'col:' + pk(r, ['#e8e0f0', '#ffd0e0']), undefined, 12, 2.6, true); for (let k = 0; k < 4; k++) S.cyl(dc, xx, 4 + k * 8, 2.7, 1.6, 'col:' + pk(r, BAL), undefined, 12, 2.7, false); }
        });
      for (const u of [0.42, 0.55, 0.68]) S.item(d(u), () => { const dc = d(u), Lc = 0; for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI; S.ball(dc, Lc + Math.cos(a) * 46, 4 + Math.sin(a) * 44, 1.4, 'emis:' + (k % 2 ? '#ff8ad8' : '#7af0ff'), undefined, true); } });
      jets(S, d(0.6), [-10, 10], 0.4, 3);
      // ===== LA REMONTEE : rampe vers la surface, arche de sortie lumineuse =====
      S.item(d(0.97), () => { const dc = d(0.97), Lc = 0; S.wall(dc, Lc - 400, Lc + 400, -10, 110, 6, 'col:#5a4a40', undefined, { lx: Lc, yc: H / 2 + 2, w: 2 * 80, h: H + 2 }); for (let k = 0; k < 56; k++) S.bx(dc - 3.2, Lc - 80 + k * 2.9, H + 2.6, 0.5, 0.5, 0.2, 'emis:#fff0b8', undefined, false, { shadow: false }); });
      foe(S, 'aaturret', d(0.2), -DOOR.x - 26, 0, { name: 'TOURELLE', armed: true, fixed: true });
      foe(S, 'jeep', d(0.42), 6, 0, { name: 'JEEP', path: 90, speed: 18 });
      foe(S, 'tank', d(0.52), -12, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'apc', d(0.64), 10, 0, { name: 'TRANSPORT', path: 80, speed: 15 });
      foe(S, 'rocketTruck', d(0.72), -10, 0, { name: 'LANCE-ROQUETTES', armed: true });
    } };

  // ---------- SCENE 10 : LA GRANDE PLACE DE NUIT : tout s'illumine, feux d'artifice, l'arene du boss (a venir) ----------
  function fireworks(S, dc) {   // gerbes de feu d'artifice au-dessus de la place (instanciees, en boucle)
    if (!S.inClip(dc)) return; const n = 360, im = new T3.InstancedMesh(SP(0.7, 5, 4), MT.fw || (MT.fw = new T3.MeshBasicMaterial({ color: '#ffffff', fog: false })), n); im.frustumCulled = false;
    const B = [], m4 = new T3.Matrix4(), q = new T3.Quaternion(), sv = new T3.Vector3(), pv = new T3.Vector3(), NB = 6, per = n / NB;
    for (let b = 0; b < NB; b++) { const c = pk(S.sr, ['#ff5ad8', '#ffd23a', '#5af0ff', '#ff6a3a', '#9aff6a', '#ffffff']); for (let k = 0; k < per; k++) im.setColorAt(b * per + k, _c.set(c)); B.push({ t0: -9, o: new T3.Vector3(), dirs: Array.from({ length: per }, () => new T3.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(18 + Math.random() * 10)) }); }
    S.b.root.add(im); const C0 = S.at(dc, 0, 0);
    EVO.addDyn(im, (t) => {
      for (let b = 0; b < NB; b++) { const Bq = B[b]; let age = t - Bq.t0; if (age > 2.6 + b * 0.37) { Bq.t0 = t; age = 0; const p = S.at(dc + (Math.random() - 0.3) * 260, (Math.random() - 0.5) * 300, 90 + Math.random() * 70); Bq.o.set(p[0], p[1], p[2]); }
        const k = Math.min(1, age / 0.6), e = 1 - Math.pow(1 - k, 3), fall = age * age * 2.2, sc = Math.max(0.001, 1.6 * (1 - age / 2.6));
        for (let i = 0; i < per; i++) { const dv = Bq.dirs[i]; pv.set(Bq.o.x + dv.x * e, Bq.o.y + dv.y * e - fall, Bq.o.z + dv.z * e); m4.compose(pv, q, sv.setScalar(sc)); im.setMatrixAt(b * per + i, m4); } }
      im.instanceMatrix.needsUpdate = true; }, [], { near: 99999 });
  }
  D.scenes.fnuit = { len: [700, 700], noDoor: true, noChaos: true, noDress: true, grass: false, turns: [[0.15, 0.4, -30]],
    pin: (T, sc) => ({ lx: 0, y: 20, from: 20, to: sc.d1 - sc.d0 - 10 }),
    ground: groundJ(W0),
    build(S) {
      const L = S.len, d = (u) => S.d0 + u * L, dC = d(0.62);
      // sol : grandes dalles sombres et brillantes, chemins dores, une immense rosace sous l'arene
      paveScene(S, (dd, x) => { const ro = rosace(dd, x, dC, 0, 110, '#6a4a8a', '#e8b43a', '#ffffff'); if (ro) return ro; const i = Math.floor((dd - S.d0) / 4), j = Math.floor((x + 400) / 4), ax = Math.abs(x); if (ax < 8) return [i % 2 ? '#e8b43a' : '#8a7aa8', 'foirePaves']; return [(i % 10 === 0 || j % 10 === 0) ? '#b8963a' : (hsh(i, j) < 0.5 ? '#7a7090' : '#8a8098'), 'foireDalles']; });
      // les illuminations : guirlandes d'ampoules partout, lampadaires, arches lumineuses, chapelets de lumieres sur les maneges
      for (let dc = S.d0 + 10; dc < S.d1; dc += 20) S.item(dc, () => { const Lc = S.lane(dc).lx; for (const s of [-1, 1]) lampPost(S, dc, Lc + s * 24); });
      for (let dc = S.d0 + 30; dc < dC - 120; dc += 36) S.item(dc, (r) => { const Lc = S.lane(dc).lx; garland(S, dc, Lc - 24, Lc + 24, 20 + r.between([0, 4]), r); for (let k = 0; k < 24; k++) S.bx(dc + 0.3, Lc - 23 + k * 2, 19 + Math.sin(k * 0.6) * 1.2, 0.3, 0.3, 0.3, 'emis:' + BAL[k % 7], undefined, false, { shadow: false }); });
      for (const u of [0.1, 0.3]) S.item(d(u), () => { const dc = d(u), Lc = S.lane(dc).lx; for (let k = 0; k <= 30; k++) { const a = k / 30 * Math.PI; S.ball(dc, Lc + Math.cos(a) * 34, 4 + Math.sin(a) * 40, 1.1, 'emis:' + (k % 2 ? '#ffd23a' : '#ff5ad8'), undefined, true); } });
      for (const [u, s, k, x] of [[0.08, 1, 'car', 70], [0.14, -1, 'swing', 76], [0.24, 1, 'drop', 66], [0.3, -1, 'top', 110], [0.42, 1, 'vil', 70], [0.46, -1, 'car', 72], [0.8, 1, 'swing', 120], [0.86, -1, 'drop', 120]]) { S.reserve(d(u), s * x, 56, 56); S.item(d(u), (r) => { const lx = S.lane(d(u)).lx + s * x; if (k === 'car') carousel(S, d(u), lx, r, 1.6); else if (k === 'swing') swingRide(S, d(u), lx, r, 1.6); else if (k === 'drop') dropTower(S, d(u), lx, r, 120); else if (k === 'top') bigTop(S, d(u), lx, r, 1.3); else village(S, d(u), lx, r); }); }
      // l'arene du boss : un cercle de mats lumineux autour de la grande rosace (le boss arrive a la prochaine etape)
      S.item(dC, () => { for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, z = dC + Math.cos(a) * 104, x = Math.sin(a) * 104; if (Math.abs(x) < 30) continue; S.cyl(z, x, 0, 1.6, 2, 'col:' + C.gold, undefined, 10, 1.6, true); S.cyl(z, x, 2, 0.5, 26, 'col:#2a2040', undefined, 8, 0.4, true); S.ball(z, x, 29, 2, 'emis:' + BAL[k % 7], undefined, false); S.glow(z, x, 29, BAL[k % 7], 30); } });
      S.reserve(dC, 0, 200, 200); fillers(S, 30, 60, 26); parkTrees(S);
      fireworks(S, d(0.05)); fireworks(S, d(0.55));
      foe(S, 'tank', d(0.2), -12, 0, { name: 'BLINDE', hp: 3, armed: false });
      foe(S, 'heli', d(0.36), 0, 50, { name: 'HELICO', armed: true, patrol: (SS, dc, lx, y) => [SS.at(dc, -26, y), SS.at(dc + 22, 0, y + 6), SS.at(dc, 26, y), SS.at(dc - 22, 0, y + 6)], speed: 12 });
      foe(S, 'aaturret', d(0.5), 20, 0, { name: 'TOURELLE', armed: true });
    } };

  // ---------- la fiche du niveau 3 ----------
  const SC3 = ['fdepart', 'fportes', 'fplace', 'fparc', 'fmarteaux', 'froue', 'fcoaster', 'fchoix', 'fsous', 'fnuit'], NAMES = { fnuit: 'LA PLACE DE NUIT', fcoaster: 'LES MONTAGNES RUSSES', fchoix: 'LE CHOIX', fsous: 'SOUS LE PARC', fdepart: 'LE PARKING', fportes: 'LES GRANDES PORTES', fplace: "LA PLACE DE L'HORLOGE", fparc: 'LA FOIRE', fmarteaux: 'LES MARTEAUX', froue: 'LA GRANDE ROUE' };
  const _ld = EVO.levelDef;
  EVO.levelDef = (g) => {
    if (!(EVO.stage && EVO.stage(g) === 3) || g.evoPreview) return _ld(g);
    moods();
    const q = /[?&]evoscenes=([\w,]+)/.exec(location.search), sc = q ? q[1].split(',') : SC3, Zs = D.scenes;
    let len = 80; EVO.chapters = []; for (const n of sc) { const s = Zs[n]; if (s) { EVO.chapters.push({ d: len - 80, i: EVO.chapters.length, name: NAMES[n] || n.toUpperCase(), key: n }); len += s.len[0]; } }
    return EVO.baseDef({ zone: 'campagne', len: len + 400, scenes: sc, order: new Array(90).fill('campagne'), theme: CC.LM.THEMES[0], seed: 3303 });
  };
})();
