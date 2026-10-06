/* Textures pixel-art procédurales (assets originaux, dessinés par le code).
 * Couleurs de base MESURÉES sur la vidéo (ANALYSE §2.3), motifs recréés. */
(function () {
  const T = {};
  const cache = {};
  // Taille réelle (m) couverte par une répétition de texture : [u, v]
  T.tile = {
    concrete: [2, 2], concreteDark: [2, 2], concreteWarm: [2, 2], facade: [12, 14], facadePink: [12, 14], facadeTan: [12, 14],
    facadeDark: [12, 14], facadeGlass: [12, 14], facadeSand: [12, 14], facadeBrick: [12, 14], facadeMint: [12, 14], facadeNavy: [12, 14], facadeLilac: [12, 14], facadeWhite: [12, 14], facadeOchre: [12, 14], storefront: [8, 4.2], brick: [2.6, 2.6], planks: [2, 2], grass: [4, 4], rock: [6, 6], hazard: [1.2, 1.2],
    metal: [2, 2], tankGreen: [2, 2], camo: [3, 3], blueFloor: [2, 2], cream: [2, 2], bark: [1.2, 2.4],
    houseWall: [2, 2], roofBrown: [1.5, 1.5], white: [14, 14], dirt: [11, 11], rail: [1, 1], asphalt: [4, 4], grass: [12, 12],
    sand: [12, 12], water: [15, 15], waterSurf: [15, 15], corrugated: [2.4, 2.6], chainlink: [2, 2],   // v032 : générateur de missions
  };

  function make(name, w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const rng = CC.U.makeRng(name.length * 7919 + w);
    draw(g, w, h, rng);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;   // v036 : fini le scintillement des façades vues de loin / de biais (le rendu de près reste en pixels : magFilter Nearest)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.canvasSource = c;
    return tex;
  }
  const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const shade = (hex, d) => {
    const [r, gg, b] = CC.U.hexToRgb(hex);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + d)));
    return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(b) + ')';
  };
  function concreteTex(g, w, h, r, base, seam) {
    noiseFill(g, w, h, r, base, 10);
    g.fillStyle = seam; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);                 // joints de coffrage
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (const [x, y] of [[8, 8], [24, 8], [8, 24], [24, 24]]) g.fillRect(x, y, 1, 1);   // trous de banche
    for (let k = 0; k < 3; k++) {                                                       // coulures
      const x = Math.floor(r() * w), len = 6 + Math.floor(r() * 16);
      for (let y = 1; y < len; y++) { g.fillStyle = 'rgba(40,36,32,' + (0.16 * (1 - y / len)).toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }
    if (r() < 0.7) { g.fillStyle = 'rgba(60,56,50,0.12)'; g.fillRect(Math.floor(r() * 20), Math.floor(r() * 20), 9, 7); }   // tache
  }

  // v117 : SOLS NATURELS — textures 256 × 256 lissées, sans quadrillage ni raccord : bruit de valeur répétable sur plusieurs échelles,
  // couleurs mélangées en dégradé, détails dessinés par-dessus (brins d'herbe, feuilles mortes, aiguilles, scintillement de neige, rides de sable)
  function lattice(period, rng) { const a = new Float32Array(period * period); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; }
  function vnoise(lat, period, u, v) {   // u, v dans [0,1[ ; répétable
    const x = u * period, y = v * period, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const X0 = ((x0 % period) + period) % period, Y0 = ((y0 % period) + period) % period, X1 = (X0 + 1) % period, Y1 = (Y0 + 1) % period;
    const a = lat[Y0 * period + X0], b = lat[Y0 * period + X1], c = lat[Y1 * period + X0], d = lat[Y1 * period + X1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  function fbmField(size, rng, periods, weights) {
    const lats = periods.map((p) => lattice(p, rng)), out = new Float32Array(size * size); let wsum = 0; for (const w of weights) wsum += w;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let v = 0; for (let k = 0; k < periods.length; k++) v += vnoise(lats[k], periods[k], x / size, y / size) * weights[k]; out[y * size + x] = v / wsum; }
    return out;
  }
  const hex3 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (stops, t) => { t = Math.max(0, Math.min(1, t)); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const k = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1); return mix3(stops[i - 1][1], stops[i][1], k); } return stops[stops.length - 1][1]; };
  function paint(g, size, fn) {   // fn(x, y) -> [r,g,b]
    const id = g.createImageData(size, size), d = id.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const c = fn(x, y), i = (y * size + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }
  function dot(g, size, x, y, w, h, col) { g.fillStyle = col; for (const ox of [0, -size, size]) for (const oy of [0, -size, size]) g.fillRect(x + ox, y + oy, w, h); }   // répété sur les bords : le motif se raccorde
  const pickCol = (r, a) => a[Math.floor(r() * a.length)];
  const RGB = (c) => 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
  function noiseFill(g, w, h, rng, base, amp) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(g, x, y, shade(base, (rng() - 0.5) * amp));
  }

  const defs = {
    // design : béton banché — joints de coffrage, trous de banche, coulures verticales et taches (un coffrage = 2 m)
    concrete: (g, w, h, r) => concreteTex(g, w, h, r, '#aaa59e', 'rgba(70,66,60,0.35)'),
    concreteDark: (g, w, h, r) => concreteTex(g, w, h, r, '#6f6b68', 'rgba(30,30,30,0.35)'),
    concreteWarm: (g, w, h, r) => concreteTex(g, w, h, r, '#b4aa9c', 'rgba(80,70,60,0.3)'),
    // NEIGE : blanc légèrement bleuté, creux d'ombre bleue, congères douces, scintillement ; aucun joint
    white: (g, w, h, r) => {
      const F = fbmField(w, r, [2, 4, 8, 16, 32], [0.4, 0.3, 0.16, 0.09, 0.05]), W = fbmField(w, r, [6, 14], [0.6, 0.4]);
      const sl = [[0, hex3('#bcd0e6')], [0.35, hex3('#d6e3f1')], [0.7, hex3('#eaf1f8')], [1, hex3('#fbfdff')]];
      paint(g, w, (x, y) => { let c = ramp(sl, F[y * w + x]); const rip = Math.sin((x * 0.55 + y * 0.9) * 0.55 + W[y * w + x] * 9) * 0.5 + 0.5; return mix3(c, hex3('#c4d6ea'), rip * 0.1); });
      for (let k = 0; k < 220; k++) dot(g, w, Math.floor(r() * w), Math.floor(r() * h), 1, 1, r() < 0.5 ? 'rgba(255,255,255,0.95)' : 'rgba(210,235,255,0.8)');
      for (let k = 0; k < 18; k++) dot(g, w, Math.floor(r() * w), Math.floor(r() * h), 5 + Math.floor(r() * 6), 1, 'rgba(150,176,206,0.28)');
    },
    // design : asphalte — grain, gravillons clairs, fissure et rapiéçage
    asphalt: (g, w, h, r) => {
      noiseFill(g, w, h, r, '#4a4847', 12);
      for (let k = 0; k < 18; k++) px(g, Math.floor(r() * w), Math.floor(r() * h), '#6a6866');
      g.fillStyle = 'rgba(30,30,30,0.35)'; g.fillRect(4, 18, 9, 7);
      let x = Math.floor(r() * w), y = 0;
      while (y < h) { px(g, x, y, '#2a2827'); x = (x + (r() < 0.5 ? 1 : w - 1)) % w; y += 1; }
    },
    facade: (g, w, h, r) => facade(g, w, h, r, '#b8b2ae'),
    facadePink: (g, w, h, r) => facade(g, w, h, r, '#cdc2bb'),
    facadeTan: (g, w, h, r) => facade(g, w, h, r, '#c6beb0'),
    facadeDark: (g, w, h, r) => facade(g, w, h, r, '#5b5552', true),
    // v081 : variantes de façades (looks des niveaux) : mur + teinte du verre
    facadeGlass: (g, w, h, r) => facade(g, w, h, r, '#5f7f90', false, [-14, 36, -22]),
    facadeSand: (g, w, h, r) => facade(g, w, h, r, '#d6c39a', false, [6, 6, -16]),
    facadeBrick: (g, w, h, r) => facade(g, w, h, r, '#9a5a48', false, [8, -4, -24]),
    facadeMint: (g, w, h, r) => facade(g, w, h, r, '#a8c8b8', false, [-10, 28, -10]),
    facadeNavy: (g, w, h, r) => facade(g, w, h, r, '#3a4560', true),
    facadeLilac: (g, w, h, r) => facade(g, w, h, r, '#bcaad0', false, [20, -10, 10]),
    facadeWhite: (g, w, h, r) => facade(g, w, h, r, '#ecebe6', false, [-4, 6, 0]),
    facadeOchre: (g, w, h, r) => facade(g, w, h, r, '#d9a85c', false, [30, 10, -40]),
    storefront: (g, w, h, r) => storefront(g, w, h, r),
    brick: (g, w, h, r) => {
      g.fillStyle = '#d97a48'; g.fillRect(0, 0, w, h);          // joints éclairés (MESURÉ #d56229, éclairci en v002 : Δ luminance −29)
      for (let row = 0; row < 8; row++) {
        const y = row * 4, off = (row % 2) * 4;
        for (let bx = -1; bx < 5; bx++) {
          const x = bx * 8 + off;
          const base = r() < 0.2 ? '#952c20' : r() < 0.5 ? '#a8392a' : '#b24634';   // MESURÉ #9e1b15 (v002 : moins saturé)
          g.fillStyle = base; g.fillRect(x + 1, y + 1, 7, 3);
          g.fillStyle = shade(base, 28); g.fillRect(x + 1, y + 1, 7, 1);
          if (r() < 0.3) px(g, x + 2 + Math.floor(r() * 5), y + 2, shade(base, -25));
        }
      }
    },
    planks: (g, w, h, r) => {
      for (let row = 0; row < 8; row++) {
        const base = r() < 0.5 ? '#e08a2a' : '#d67c22';
        g.fillStyle = base; g.fillRect(0, row * 4, w, 4);
        g.fillStyle = '#6a300c'; g.fillRect(0, row * 4 + 3, w, 1);
        const seam = Math.floor(r() * w);
        g.fillRect(seam, row * 4, 1, 3);
        px(g, (seam + 3) % w, row * 4 + 1, '#5a2808'); px(g, (seam + w - 3) % w, row * 4 + 1, '#5a2808');
        for (let k = 0; k < 4; k++) px(g, Math.floor(r() * w), row * 4 + Math.floor(r() * 3), shade(base, 18));
      }
    },
    // PRAIRIE : trois verts mélangés en grandes plaques, zones sèches, brins d'herbe, quelques fleurs ; aucune ligne droite
    grass: (g, w, h, r) => {
      const F = fbmField(w, r, [3, 6, 12, 24, 48], [0.36, 0.28, 0.2, 0.1, 0.06]), D = fbmField(w, r, [2, 5], [0.65, 0.35]);
      const gr = [[0, hex3('#2f5a24')], [0.35, hex3('#44782e')], [0.65, hex3('#5e9138')], [1, hex3('#86b04e')]], dry = hex3('#9a9650'), soil = hex3('#5a4a30');
      paint(g, w, (x, y) => { const f = F[y * w + x], d = D[y * w + x]; let c = ramp(gr, f); if (d > 0.58) c = mix3(c, dry, Math.min(0.55, (d - 0.58) * 3.2)); if (d < 0.22) c = mix3(c, soil, Math.min(0.4, (0.22 - d) * 3)); return c; });
      for (let k = 0; k < 2600; k++) { const x = Math.floor(r() * w), y = Math.floor(r() * h), L = 2 + Math.floor(r() * 4), dk = r() < 0.5, lean = r() < 0.5 ? -1 : 1; for (let j = 0; j < L; j++) dot(g, w, (x + Math.round(j * 0.3 * lean) + w) % w, (y - j + h) % h, 1, 1, dk ? 'rgba(28,62,22,0.55)' : 'rgba(170,205,100,' + (0.35 + 0.1 * (L - j)) + ')'); }
      for (let k = 0; k < 40; k++) dot(g, w, Math.floor(r() * w), Math.floor(r() * h), 2, 2, pickCol(r, ['#f2efe0', '#f5d76a', '#e9e6f4']));
    },
    // SOUS-BOIS : terre brune, mousse en plaques, feuilles mortes, aiguilles de pin, petites pierres, ombres de racines
    dirt: (g, w, h, r) => {
      const F = fbmField(w, r, [3, 7, 14, 28, 56], [0.34, 0.28, 0.2, 0.12, 0.06]), M = fbmField(w, r, [2, 4, 9], [0.5, 0.3, 0.2]);
      const sl = [[0, hex3('#34291d')], [0.4, hex3('#4d3d28')], [0.75, hex3('#6a5535')], [1, hex3('#86703f')]], moss = hex3('#4b5f2e'), moss2 = hex3('#62773a');
      paint(g, w, (x, y) => { const f = F[y * w + x], m = M[y * w + x]; let c = ramp(sl, f); if (m > 0.54) c = mix3(c, f > 0.5 ? moss2 : moss, Math.min(0.85, (m - 0.54) * 4)); return c; });
      for (let k = 0; k < 900; k++) { const x = Math.floor(r() * w), y = Math.floor(r() * h), ang = r() * 3.14, L = 3 + Math.floor(r() * 5), col = pickCol(r, ['rgba(120,92,48,0.75)', 'rgba(150,112,56,0.7)', 'rgba(92,70,40,0.75)']); for (let j = 0; j < L; j++) dot(g, w, (x + Math.round(Math.cos(ang) * j) + w) % w, (y + Math.round(Math.sin(ang) * j) + h) % h, 1, 1, col); }   // aiguilles
      for (let k = 0; k < 160; k++) dot(g, w, Math.floor(r() * w), Math.floor(r() * h), 2 + Math.floor(r() * 2), 2, pickCol(r, ['#a4682e', '#8a4f26', '#b88a3a', '#7a3d20', '#6e5a2a']));   // feuilles mortes
      for (let k = 0; k < 40; k++) { const x = Math.floor(r() * w), y = Math.floor(r() * h); dot(g, w, x, y, 3, 2, 'rgba(120,118,108,0.9)'); dot(g, w, x, y, 2, 1, 'rgba(176,172,160,0.9)'); }   // cailloux
      for (let k = 0; k < 30; k++) dot(g, w, Math.floor(r() * w), Math.floor(r() * h), 3 + Math.floor(r() * 4), 2, 'rgba(26,20,12,0.45)');   // zones d'ombre
    },
    dirtOld: (g, w, h, r) => { noiseFill(g, w, h, r, '#3b2f28', 14); },
    // v032 : sable (grain, rides de vent), eau (reflets en bandes), tôle ondulée (conteneurs, teinte par sommet), grillage
    sand: (g, w, h, r) => {   // v117 : dunes — rides de vent douces (diagonales ondulées), grain fin, quelques cailloux
      const F = fbmField(w, r, [3, 6, 12, 24], [0.4, 0.3, 0.2, 0.1]), W = fbmField(w, r, [4, 9], [0.6, 0.4]);
      const sl = [[0, hex3('#b8955e')], [0.4, hex3('#d0ad76')], [0.75, hex3('#e0c08a')], [1, hex3('#ecd3a0')]];
      paint(g, w, (x, y) => { let c = ramp(sl, F[y * w + x]); const rip = Math.sin((x * 0.5 + y * 1.1) * 0.42 + W[y * w + x] * 10); return mix3(c, rip > 0 ? hex3('#f0d9a6') : hex3('#a98650'), Math.abs(rip) * 0.16); });
      for (let k = 0; k < 500; k++) dot(g, w, Math.floor(r() * w), Math.floor(r() * h), 1, 1, r() < 0.5 ? 'rgba(255,240,200,0.7)' : 'rgba(120,90,50,0.45)');
      for (let k = 0; k < 14; k++) { const x = Math.floor(r() * w), y = Math.floor(r() * h); dot(g, w, x, y, 3, 2, 'rgba(110,88,60,0.8)'); dot(g, w, x, y, 2, 1, 'rgba(160,138,104,0.8)'); }
    },
    water: (g, w, h, r) => {   // v103 : vagues douces qui se raccordent (périodes entières) + petits reflets
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w * Math.PI * 2, v = y / h * Math.PI * 2, a = 0.5 + 0.25 * Math.sin(u * 2 + Math.sin(v * 3) * 1.3) + 0.25 * Math.sin(v * 2 + u + Math.sin(u * 3) * 0.9); g.fillStyle = 'rgb(' + Math.round(22 + 34 * a) + ',' + Math.round(66 + 64 * a) + ',' + Math.round(92 + 70 * a) + ')'; g.fillRect(x, y, 1, 1); }
      for (let k = 0; k < Math.max(6, w * h / 90); k++) { g.fillStyle = r() < 0.5 ? 'rgba(220,240,255,0.55)' : 'rgba(180,220,245,0.4)'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), r() < 0.3 ? 2 : 1, 1); }
    },
    corrugated: (g, w, h, r) => {
      noiseFill(g, w, h, r, '#d8d8d8', 8);
      for (let x = 0; x < w; x += 3) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, 0, 1, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 1, 0, 1, h); }
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(90,50,30,0.25)'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 2, 3); }   // rouille
    },
    chainlink: (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#9aa0a4';
      for (let i = 0; i < w; i++) { px(g, i, i % h, '#9aa0a4'); px(g, w - 1 - i, i % h, '#9aa0a4'); }
      g.fillRect(0, 0, w, 1);
    },
    rock: (g, w, h, r) => {
      noiseFill(g, w, h, r, '#3a302d', 10);                    // MESURÉ #332826 (paroi éclairée : base un peu plus claire)
      for (let k = 0; k < 26; k++) {
        const x = Math.floor(r() * w), y0 = Math.floor(r() * h), len = 4 + Math.floor(r() * 12);
        g.fillStyle = r() < 0.5 ? '#2a1f1c' : '#46352f';
        g.fillRect(x, y0, 1, len);
      }
    },
    hazard: (g, w, h) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(g, x, y, ((x + y) % 16) < 8 ? '#f0b81c' : '#1c1a18');
    },
    metal: (g, w, h, r) => {   // design : tôle en panneaux rivetés, légère usure
      noiseFill(g, w, h, r, '#4d5156', 8);
      g.fillStyle = '#383b3f'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 16, w, 1);
      g.fillStyle = '#5c6066'; g.fillRect(0, 1, w, 1); g.fillRect(0, 17, w, 1);
      for (let x = 3; x < w; x += 6) { px(g, x, 3, '#6a6e74'); px(g, x, 19, '#6a6e74'); }
      g.fillStyle = 'rgba(90,60,40,0.25)'; g.fillRect(Math.floor(r() * 20), 22, 8, 6);
    },
    rail: (g, w, h, r) => { noiseFill(g, w, h, r, '#9c8184', 10); },
    tankGreen: (g, w, h, r) => { noiseFill(g, w, h, r, '#27372b', 8); g.fillStyle = '#1a261e'; g.fillRect(0, 0, w, 1); g.fillRect(0, 7, w, 1); },
    camo: (g, w, h, r) => {
      noiseFill(g, w, h, r, '#56613a', 8);
      const cols = ['#6d5a3a', '#2f3a22', '#7b7048'];
      for (let k = 0; k < 16; k++) {
        g.fillStyle = cols[k % 3];
        const x = Math.floor(r() * w), y = Math.floor(r() * h), rw = 3 + Math.floor(r() * 7), rh = 2 + Math.floor(r() * 5);
        g.fillRect(x, y, rw, rh); g.fillRect((x + rw) % w, y + 1, 2, rh - 1);
      }
    },
    blueFloor: (g, w, h, r) => {
      noiseFill(g, w, h, r, '#58b0d2', 10);                    // v004 : cyan clair (OBSERVÉ séq. 2)
      g.fillStyle = '#7cc8e4'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
      g.fillStyle = '#3e8eb0'; g.fillRect(0, h - 1, w, 1); g.fillRect(w - 1, 0, 1, h);
    },
    cream: (g, w, h, r) => { noiseFill(g, w, h, r, '#e3d6a3', 6); g.fillStyle = '#cbbd88'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); },
    bark: (g, w, h, r) => {   // design : sillons verticaux sinueux, plaques d'écorce
      noiseFill(g, w, h, r, '#3d2b23', 10);
      for (let k = 0; k < 9; k++) {
        let x = Math.floor(r() * w);
        const c = r() < 0.6 ? '#241812' : '#533c30';
        for (let y = 0; y < h; y++) { px(g, x, y, c); if (r() < 0.2) x = (x + (r() < 0.5 ? 1 : w - 1)) % w; }
      }
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(90,70,55,0.35)'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 3, 5); }
    },
    houseWall: (g, w, h, r) => { noiseFill(g, w, h, r, '#8e8f94', 8); g.fillStyle = '#76777c'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); },
    roofBrown: (g, w, h, r) => {   // design : tuiles en rangs décalés, arrondi éclairé, quelques tuiles plus sombres
      noiseFill(g, w, h, r, '#6d3a29', 10);
      for (let y = 0; y < h; y += 4) {
        g.fillStyle = '#4d2618'; g.fillRect(0, y, w, 1);
        const off = (y / 4) % 2 ? 2 : 0;
        for (let x = off; x < w; x += 4) { g.fillStyle = '#3d1e12'; g.fillRect(x, y + 1, 1, 3); g.fillStyle = 'rgba(255,190,150,0.18)'; g.fillRect(x + 1, y + 1, 2, 1); if (r() < 0.08) { g.fillStyle = 'rgba(40,20,12,0.4)'; g.fillRect(x + 1, y + 1, 3, 3); } }
      }
    },
  };

  /* Design : façade de 4 × 4 travées (une travée = 32 px ≈ 3 m × 3,5 m) : bandeau de dalle entre étages, fenêtre encadrée
   * avec meneau, imposte, appui et linteau ; chaque fenêtre tire un état (vitre qui reflète le ciel, store à demi baissé,
   * rideaux, pièce sombre, pièce éclairée) et parfois un climatiseur sous l'appui. Couleurs de vitre MESURÉES (bleu). */
  function facade(g, w, h, r, wall, dark, tone) {
    const tn = tone || [0, 0, 0], cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
    noiseFill(g, w, h, r, wall, 8);
    const C = 32;
    for (let cy = 0; cy < h / C; cy++) for (let cx = 0; cx < w / C; cx++) {
      const ox = cx * C, oy = cy * C;
      g.fillStyle = shade(wall, -14); g.fillRect(ox, oy, C, 2);                     // bandeau de dalle
      g.fillStyle = shade(wall, 10); g.fillRect(ox, oy + 2, C, 1);
      const x0 = ox + 8, x1 = ox + 24, y0 = oy + 7, y1 = oy + 25;
      g.fillStyle = shade(wall, 22); g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, 1);   // linteau
      g.fillStyle = dark ? '#1e1d20' : '#d8d4cc'; g.fillRect(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2);   // cadre
      const st = r();
      const lit = dark ? st < 0.3 : st < 0.04, shut = !lit && st > 0.86;
      for (let y = y0; y < y1; y++) {
        const t = (y - y0) / (y1 - y0);
        let col;
        if (lit) col = 'rgb(' + Math.round(225 + 20 * t) + ',' + Math.round(185 + 25 * t) + ',' + Math.round(110 + 20 * t) + ')';
        else if (shut) col = 'rgb(' + Math.round(16 + 16 * t) + ',' + Math.round(30 + 26 * t) + ',' + Math.round(48 + 30 * t) + ')';
        else col = dark ? 'rgb(' + Math.round(20 + 30 * t) + ',' + Math.round(40 + 60 * t) + ',' + Math.round(70 + 60 * t) + ')'
          : 'rgb(' + cl(22 + 40 * t + tn[0]) + ',' + cl(92 + 80 * t + tn[1]) + ',' + cl(168 + 50 * t + tn[2]) + ')';   // MESURÉ vitres bleues
        g.fillStyle = col; g.fillRect(x0, y, x1 - x0, 1);
      }
      if (!lit && !shut) {                                                          // reflet du ciel en diagonale
        g.fillStyle = 'rgba(255,255,255,0.2)';
        const k0 = Math.floor(r() * 6);
        for (let k = 0; k < 6; k++) g.fillRect(x0 + 2 + k + k0, y0 + 9 - k, 2, 1);
      }
      const v = r();
      if (!shut && v < 0.3) {                                                       // store à demi baissé
        const bh = 3 + Math.floor(r() * 9);
        g.fillStyle = dark ? '#5a5048' : '#c9c6bd'; g.fillRect(x0, y0, x1 - x0, bh);
        g.fillStyle = dark ? '#4a4038' : '#a8a59c'; for (let y = y0 + 1; y < y0 + bh; y += 2) g.fillRect(x0, y, x1 - x0, 1);
      } else if (!shut && v < 0.45) {                                               // rideaux
        const cc = ['#b0584a', '#6a7aa0', '#c8b070', '#7a9a6a'][Math.floor(r() * 4)];
        g.fillStyle = cc; g.fillRect(x0, y0, 3, y1 - y0); g.fillRect(x1 - 3, y0, 3, y1 - y0);
      }
      g.fillStyle = dark ? '#1e1d20' : '#d8d4cc';
      g.fillRect(ox + 16, y0, 1, y1 - y0);                                          // meneau
      g.fillRect(x0, y0 + 5, x1 - x0, 1);                                           // imposte
      g.fillStyle = shade(wall, 35); g.fillRect(x0 - 2, y1 + 1, x1 - x0 + 4, 2);    // appui de fenêtre
      g.fillStyle = shade(wall, -45); g.fillRect(x0 - 2, y1 + 3, x1 - x0 + 4, 1);
      if (!dark && r() < 0.14) {                                                    // climatiseur sous l'appui
        const ax = r() < 0.5 ? x0 : x1 - 7;
        g.fillStyle = '#c8cacb'; g.fillRect(ax, y1 + 4, 7, 4);
        g.fillStyle = '#7a7c7e'; g.fillRect(ax + 1, y1 + 5, 3, 2);
        g.fillStyle = 'rgba(40,40,40,0.35)'; g.fillRect(ax, y1 + 8, 7, 1);
      }
    }
  }

  /* Design : rez-de-chaussée commerçant (2 boutiques de 4 m) : enseigne colorée à lettrage, grande vitrine avec étalage
   * et reflet, porte vitrée encadrée, piliers. */
  function storefront(g, w, h, r) {
    const signs = ['#b8322a', '#2a5a9a', '#2a7a4a', '#c89a2a', '#6a3a8a', '#2a2a2a'];
    for (let cx = 0; cx < w / 32; cx++) {
      const ox = cx * 32;
      g.save(); g.translate(ox, 0); noiseFill(g, 32, h, r, '#8a8480', 8); g.restore();
      const sc = signs[Math.floor(r() * signs.length)];
      g.fillStyle = sc; g.fillRect(ox + 1, 1, 30, 6);
      g.fillStyle = '#f2eee4';
      for (let x = ox + 4; x < ox + 27; x += 3) if (r() < 0.75) g.fillRect(x, 3, 2, 2);
      g.fillStyle = '#3a3634'; g.fillRect(ox + 2, 9, 19, 22);
      for (let y = 10; y < 30; y++) { const t = (y - 10) / 20; g.fillStyle = 'rgb(' + Math.round(30 + 30 * t) + ',' + Math.round(50 + 50 * t) + ',' + Math.round(70 + 60 * t) + ')'; g.fillRect(ox + 3, y, 17, 1); }
      for (let k = 0; k < 5; k++) { g.fillStyle = ['#c8a060', '#a04a3a', '#6a8aa0', '#e0d8c0'][Math.floor(r() * 4)]; g.fillRect(ox + 4 + Math.floor(r() * 13), 24 + Math.floor(r() * 4), 2, 2); }
      g.fillStyle = 'rgba(255,255,255,0.22)'; for (let k = 0; k < 7; k++) g.fillRect(ox + 5 + k, 18 - k, 2, 1);
      g.fillStyle = '#3a3634'; g.fillRect(ox + 23, 12, 7, 20);
      g.fillStyle = '#26303a'; g.fillRect(ox + 24, 13, 5, 19);
      g.fillStyle = '#c8b070'; g.fillRect(ox + 24, 22, 1, 2);
      g.fillStyle = '#6a6460'; g.fillRect(ox, 8, 1, 24); g.fillRect(ox + 31, 8, 1, 24);
    }
  }

  T.get = function (name) {
    if (!cache[name]) {
      const d = defs[name];
      if (!d) throw new Error('Texture inconnue : ' + name);
      const nat = name === 'grass' || name === 'dirt' || name === 'white' || name === 'sand';   // v117 : sols naturels
      const big = nat ? [256, 256] : /^facade/.test(name) ? [128, 128] : name === 'storefront' ? [64, 32] : [32, 32];   // design : façades 4 × 4 travées
      cache[name] = make(name, big[0], big[1], d);
      if (nat) { cache[name].magFilter = THREE.LinearFilter; cache[name].anisotropy = 8; }
    }
    return cache[name];
  };

  // Textures spéciales (non répétées)
  T.special = function (name) {
    if (cache[name]) return cache[name];
    let tex;
    if (name === 'bullseye') {
      tex = make(name, 64, 64, (g) => {
        const cols = ['#d42a1f', '#f2efe6', '#f08a1a', '#f2efe6', '#d42a1f', '#f2efe6', '#d42a1f'];
        for (let i = 0; i < cols.length; i++) {
          g.fillStyle = cols[i]; g.beginPath(); g.arc(32, 32, 31 - i * 4.4, 0, Math.PI * 2); g.fill();
        }
      });
    } else if (name === 'billboard') {
      // Panneau original "COLD IMPACT" (remplace la marque du jeu d'origine — décision validée)
      tex = make(name, 256, 128, (g) => {
        g.fillStyle = '#1f6a2a'; g.fillRect(0, 0, 256, 128);
        g.fillStyle = '#2f9a3a'; g.fillRect(6, 6, 244, 116);
        g.fillStyle = '#f2f2f2'; g.fillRect(6, 88, 244, 34);
        // fusée stylisée
        g.fillStyle = '#c9c9c9'; g.fillRect(18, 30, 34, 10); g.fillStyle = '#d42a1f'; g.fillRect(52, 32, 6, 6);
        g.fillStyle = '#f5d000'; g.fillRect(18, 28, 4, 14); g.fillStyle = '#ff8a1a'; g.fillRect(8, 31, 10, 8);
        CC.Font.draw(g, 'COLD', 70, 16, 3.6, '#ffffff', { outline: '#1a1a1a', skew: -0.2 });
        CC.Font.draw(g, 'IMPACT', 70, 52, 3.6, '#ffcf2e', { outline: '#1a1a1a', skew: -0.2 });
        CC.Font.draw(g, 'PLAY IT IN YOUR BROWSER', 128, 100, 1.2, '#1a1a1a', { align: 'center', outline: '' });   // design : tient dans le cadre
      });
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    } else if (name === 'graffiti') {
      tex = make(name, 256, 128, (g, w, h, r) => {
        g.clearRect(0, 0, w, h);
        const words = ['NO', 'MISSILES'];
        let y = 14;
        for (const wd of words) {
          let x = wd === 'NO' ? 40 : 14;
          for (const ch of wd) {
            CC.Font.draw(g, ch, x, y + r() * 6, 5.2 + r() * 1.2, '#f4f4f4', { outline: '#101010', skew: -0.15 + r() * 0.1 });
            x += 28;
          }
          y += 52;
        }
      });
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    } else if (name === 'sky') {
      tex = null;
    }
    cache[name] = tex;
    return tex;
  };

  CC.Textures = T;
})();
