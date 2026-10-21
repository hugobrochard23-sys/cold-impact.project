/* v036 : HORIZON — l'arrière-plan qui donne de la grandeur. Un anneau de 980 m de rayon suit la caméra ; une bande de 3072 × 384 pixels y est
 * dessinée en silhouettes SUPERPOSEES (les plus lointaines très pâles, les plus proches plus sombres : perspective atmosphérique) :
 *   city    tours de tailles variées, antennes, gratte-ciel à gradins, grues       port     collines, portiques, cargos, entrepôts
 *   sky     pics de montagnes dans la brume                                        forest   crêtes boisées, pins
 *   chute   mégapole très loin au-dessous (le joueur tombe vers elle)              eau      dorsales et piliers de roche du fond marin
 * La teinte vient du brouillard de la zone (elle se fond avec le ciel) ; la nuit, une seconde bande additive y ajoute des fenêtres allumées,
 * des enseignes néon et les feux rouges des antennes. Une seule bande en mémoire à la fois (mobile) ; aucune géométrie de plus de 64 facettes. */
(function () {
  const U = CC.U;
  const SC = 0.36;                                       // v038g : l'anneau est réduit à 353 m de rayon (dans la distance de vue), mêmes angles
  const W = 3072, H = 384, R = 980, GROUND = 330;      // y du sol dans la bande (le bas est sous terre)
  const STYLE = { city: 'city', port: 'port', sky: 'peaks', forest: 'forest', campagne: 'campagne', chute: 'megacity', tour: 'city', eau: 'seabed' };

  function draw(style, seed, dark) {
    const rng = U.makeRng(seed), rr = (a, b) => a + (b - a) * rng();
    const cs = document.createElement('canvas'); cs.width = W; cs.height = H; const g = cs.getContext('2d');
    let cg = null, gg = null;
    if (dark) { cg = document.createElement('canvas'); cg.width = W; cg.height = H; gg = cg.getContext('2d'); }
    // v038e : les silhouettes sont dessinées en gris (clair = loin, plus sombre = proche) que la teinte du brouillard vient colorer : fini les masses noires
    const sh0 = (al) => { const v = Math.round(255 * (1 - 0.42 * Math.min(1, al))).toString(16).padStart(2, '0'); return '#' + v + v + v; };
    const camp = style === 'campagne', hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    // v184 : en campagne, collines et pins sont peints en vraies couleurs (bleu pale tres loin -> vert profond tout pres) ; la bande n'est plus teintee
    const sh = (al) => { if (!camp) return sh0(al); const a = hx('#b4d4e8'), b = hx('#56907a'), t = Math.min(1, al * 1.1); return '#' + [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t).toString(16).padStart(2, '0')).join(''); };
    const rects = [];
    const NEON = ['#ff3ad8', '#2be8ff', '#ffb02b', '#8a6aff', '#ff5a5a'];
    const tower = (x, w, h, a, lit) => {
      const top = GROUND - h;
      g.globalAlpha = a; g.fillStyle = sh(a); g.fillRect(x, top, w, h);
      const k = rng();
      if (k < 0.3 && w > 8) { const w2 = w * rr(0.45, 0.7), h2 = h * rr(0.08, 0.2); g.fillRect(x + (w - w2) / 2, top - h2, w2, h2); if (rng() < 0.4) g.fillRect(x + w / 2 - 0.7, top - h2 - h * 0.12, 1.4, h * 0.12); rects.push([x, top - h2, w, h + h2, lit]); return; }
      if (k < 0.5) g.fillRect(x + w / 2 - 0.8, top - h * rr(0.1, 0.25), 1.6, h * 0.25);        // antenne
      else if (k < 0.58) { g.beginPath(); g.moveTo(x + w * 0.15, top); g.lineTo(x + w / 2, top - w * 1.6); g.lineTo(x + w * 0.85, top); g.closePath(); g.fill(); }   // flèche
      rects.push([x, top, w, h, lit]);
    };
    const towers = (hmin, hmax, wmin, wmax, a, gap, lit) => { for (let x = -20; x < W; x += 0) { const w = rr(wmin, wmax), h = rr(hmin, hmax) * (0.55 + 0.45 * Math.sin(x / 260 + seed)); if (rng() > 0.12) tower(x, w, Math.max(6, h), a, lit); x += w + rr(0, gap); } };
    const crane = (x, h, a, len) => {
      g.globalAlpha = a; g.fillStyle = sh(a); g.fillRect(x, GROUND - h, 2.2, h); g.fillRect(x + 26, GROUND - h, 2.2, h); g.fillRect(x - 6, GROUND - h - 3, 40, 4);
      g.fillRect(x - 6 - len * 0.2, GROUND - h - 2, len, 2.2); g.beginPath(); g.moveTo(x + 14, GROUND - h - 3); g.lineTo(x - 6 - len * 0.2, GROUND - h - 14); g.lineTo(x - 6 - len * 0.2, GROUND - h - 2); g.closePath(); g.fill();
      g.fillRect(x + 4, GROUND - h * 0.5, 0.9, h * 0.5 - 3); g.fillRect(x + 1, GROUND - h * 0.5, 7, 6);
    };
    const hills = (hmin, hmax, a, tooth, f) => { g.globalAlpha = a; g.fillStyle = sh(a); g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) { const n = Math.sin(x / (170 * f) + seed) * 0.5 + Math.sin(x / (61 * f) + seed * 2) * 0.3 + Math.sin(x / (23 * f) + seed * 3) * 0.2; let y = GROUND - (hmin + (hmax - hmin) * (0.5 + 0.5 * n)); if (tooth) y -= (Math.floor(x / 5) % 2 ? 0 : tooth) * (0.6 + 0.4 * rng()); g.lineTo(x, y); }
      g.lineTo(W, H); g.closePath(); g.fill(); };
    const peaks = (hmin, hmax, a, step) => { g.globalAlpha = a; g.fillStyle = sh(a); g.beginPath(); g.moveTo(0, H); let x = 0; while (x < W + 40) { const h = rr(hmin, hmax), w = rr(step * 0.6, step * 1.4); g.lineTo(x, GROUND - rr(hmin * 0.15, hmin * 0.4)); g.lineTo(x + w * 0.45, GROUND - h); g.lineTo(x + w * 0.55, GROUND - h * rr(0.82, 0.95)); x += w; } g.lineTo(W, H); g.closePath(); g.fill(); };
    const alp = (hmin, hmax, a, step, body, snow, dark) => {   // v184 : sommets en bleus naturels : face eclairee, face a l'ombre et calotte neigeuse
      const pk = []; let x = -step * 0.5; while (x < W + step) { const w = rr(step * 0.7, step * 1.4), h = rr(hmin, hmax); pk.push([x + w * 0.5, h, w]); x += w * 0.78; }
      g.globalAlpha = a; g.fillStyle = body; g.beginPath(); g.moveTo(0, H); g.lineTo(-40, GROUND);
      for (const [px, h, w] of pk) { g.lineTo(px - w * 0.5, GROUND - h * 0.22); g.lineTo(px - w * 0.06, GROUND - h * 0.92); g.lineTo(px, GROUND - h); g.lineTo(px + w * 0.08, GROUND - h * 0.9); g.lineTo(px + w * 0.5, GROUND - h * 0.24); }
      g.lineTo(W + 40, GROUND); g.lineTo(W, H); g.closePath(); g.fill();
      g.fillStyle = dark; g.globalAlpha = a * 0.75;
      for (const [px, h, w] of pk) { g.beginPath(); g.moveTo(px, GROUND - h); g.lineTo(px + w * 0.08, GROUND - h * 0.9); g.lineTo(px + w * 0.5, GROUND - h * 0.24); g.lineTo(px + w * 0.1, GROUND - h * 0.1); g.lineTo(px - w * 0.02, GROUND - h * 0.45); g.closePath(); g.fill(); }
      g.fillStyle = snow; g.globalAlpha = Math.min(1, a + 0.1);
      for (const [px, h, w] of pk) { const k = 0.24; g.beginPath(); g.moveTo(px - w * 0.06 - w * 0.21 * k * 2, GROUND - h * (1 - k * 1.1)); g.lineTo(px - w * 0.06, GROUND - h * 0.92); g.lineTo(px, GROUND - h); g.lineTo(px + w * 0.08, GROUND - h * 0.9); g.lineTo(px + w * 0.21 * k * 2.2, GROUND - h * (1 - k * 1.2)); g.lineTo(px + w * 0.07, GROUND - h * (1 - k * 0.7)); g.lineTo(px + w * 0.02, GROUND - h * (1 - k * 1.2)); g.lineTo(px - w * 0.05, GROUND - h * (1 - k * 0.8)); g.closePath(); g.fill(); }
    };
    const pines = (hmin, hmax, a, w) => { g.fillStyle = sh(a); g.globalAlpha = a; for (let x = 0; x < W; x += rr(w * 0.5, w * 1.1)) { const h = rr(hmin, hmax); g.beginPath(); g.moveTo(x - w / 2, GROUND); g.lineTo(x, GROUND - h); g.lineTo(x + w / 2, GROUND); g.closePath(); g.fill(); } };
    const ship = (x, a) => { g.globalAlpha = a; g.fillStyle = sh(a); const L = rr(70, 120); g.fillRect(x, GROUND - 14, L, 14); g.fillRect(x + L * 0.7, GROUND - 34, L * 0.22, 20); g.fillRect(x + L * 0.78, GROUND - 42, 6, 8); for (let i = 0; i < 6; i++) g.fillRect(x + 6 + i * 11, GROUND - 22, 9, 8); };
    const stack = (x, h, a) => { g.globalAlpha = a; g.fillStyle = sh(a); g.fillRect(x, GROUND - h, 7, h); g.fillRect(x - 1, GROUND - h, 9, 3); };

    g.clearRect(0, 0, W, H);
    if (style === 'city' || style === 'megacity') {
      const big = style === 'megacity' ? 1.7 : 1;
      towers(28 * big, 92 * big, 10, 26, 0.26, 4, 0); towers(40 * big, 140 * big, 12, 32, 0.38, 6, 0); towers(50 * big, 190 * big, 14, 38, 0.52, 10, 1);
      for (let i = 0; i < 4; i++) crane(rr(0, W), rr(60, 110), 0.5, rr(60, 100));
      towers(18, 70 * big, 18, 50, 0.72, 40, 2);
    } else if (style === 'port') {
      hills(14, 50, 0.2, 0, 1.3); towers(14, 46, 14, 34, 0.3, 18, 0);
      for (let i = 0; i < 6; i++) crane(rr(0, W), rr(40, 90), 0.42, rr(50, 90));
      for (let i = 0; i < 4; i++) ship(rr(0, W), 0.5);
      for (let x = 0; x < W; x += rr(40, 90)) { g.globalAlpha = 0.6; g.fillStyle = sh(0.6); g.fillRect(x, GROUND - rr(8, 22), rr(28, 60), 30); }
      for (let i = 0; i < 5; i++) stack(rr(0, W), rr(40, 80), 0.45);
    } else if (style === 'peaks') {
      peaks(60, 190, 0.22, 240); peaks(50, 150, 0.36, 180); peaks(30, 100, 0.55, 140);
    } else if (style === 'campagne') {
      // v202 : rien de peint : les montagnes sont un anneau en volume (ring3d), les collines de vraies bandes de relief (zones_evo.js)
    } else if (style === 'forest') {
      hills(40, 130, 0.22, 0, 1.6); hills(30, 90, 0.36, 0, 1.0); pines(18, 50, 0.46, 12); hills(14, 46, 0.55, 5, 0.6); pines(10, 32, 0.68, 9);
    } else if (style === 'seabed') {
      hills(40, 140, 0.3, 0, 1.5); hills(24, 80, 0.45, 0, 0.8);
      for (let i = 0; i < 26; i++) { g.globalAlpha = 0.5; g.fillStyle = sh(0.5); const x = rr(0, W), h = rr(40, 160), w = rr(6, 18); g.beginPath(); g.moveTo(x, GROUND + 20); g.lineTo(x + w * 0.3, GROUND - h); g.lineTo(x + w * 0.7, GROUND - h * 0.9); g.lineTo(x + w, GROUND + 20); g.closePath(); g.fill(); }
    }
    // fenêtres, néons, feux d'antenne (nuit)
    if (gg) {
      for (const [x, top, w, h, lit] of rects) {
        if (lit === 0 && rng() < 0.45) continue;
        const n = Math.min(60, Math.floor(w * h / (lit === 1 ? 24 : 40)));
        for (let i = 0; i < n; i++) { const r = rng(); gg.globalAlpha = rr(0.3, 0.85); gg.fillStyle = r < 0.72 ? '#ffd890' : r < 0.86 ? '#7ae8ff' : '#ff6ad8'; gg.fillRect(x + 1 + rng() * (w - 3), top + 2 + rng() * (h - 4), 1.6, 1.3); }
        if (rng() < 0.22) { gg.globalAlpha = 0.9; gg.fillStyle = NEON[Math.floor(rng() * NEON.length)]; gg.fillRect(x + rng() * w * 0.4, top + rng() * h * 0.5, 2 + rng() * 2, 6 + rng() * 14); }
        if (lit === 1 && rng() < 0.5) { gg.globalAlpha = 1; gg.fillStyle = '#ff3020'; gg.fillRect(x + w / 2 - 1, top - 10, 2, 2); }
      }
    }
    const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; };
    return { sil: tex(cs), glow: cg ? tex(cg) : null };
  }

  /* v202 : ANNEAU DE MONTAGNES EN VOLUME. Deux couronnes de sommets a facettes (neige, roche bleutee, pied fondu dans la brume) tout autour du joueur : on se sent entoure,
   * y compris droit devant, quoi que le couloir construise. L'anneau suit la camera (comme un ciel) ; a 700-1000 m le decalage serait invisible de toute facon.
   * La brume est appliquee APRES l'eclairage (uHaze = couleur du brouillard) : le pied de chaque montagne se confond exactement avec le fond. */
  function ringGeometry(seed) {   // v204 : collines de plaine, rocheuses et vertes, sans neige : basses, larges, a facettes douces
    const rng = U.makeRng(seed), rr = (a, b) => a + (b - a) * rng(), P = [], C = [], Z = [];
    const lo = new THREE.Color('#6d8a55'), mid = new THREE.Color('#8f9079'), hi = new THREE.Color('#a9a58e'), col = new THREE.Color();
    const tiers = [[-0.2, 1.0, 1], [0.3, 0.8, 0.55], [0.72, 0.56, 0.3], [1.0, 0.36, 0.15]];
    const mountain = (cx, cz, H, R, haze) => {
      const N = 14, ring = [], rot = rng() * 6.28, ext = rr(0.85, 1.25);
      for (let t = 0; t < 4; t++) { const q = []; for (let i = 0; i < N; i++) { const a = rot + i / N * 6.2832 + t * 0.2 + rr(-0.06, 0.06), rad = R * tiers[t][1] * rr(0.88, 1.12); q.push([cx + Math.cos(a) * rad * ext, tiers[t][0] * H + (t ? rr(-0.05, 0.05) * H : 0), cz + Math.sin(a) * rad]); } ring.push(q); }
      const top = [cx, H * 1.04, cz];
      const cl = (t) => { if (t === 0) col.copy(lo); else if (t === 1) col.copy(lo).lerp(mid, rr(0.35, 0.7)); else if (t === 2) col.copy(mid).lerp(hi, rr(0.1, 0.45)); else col.copy(hi).lerp(mid, rr(0, 0.4)); return [col.r, col.g, col.b]; };
      const tri = (a, b, c, ta, tb, tc) => { const k = cl(Math.max(ta, tb, tc)); for (const [v, t] of [[a, ta], [b, tb], [c, tc]]) { P.push(v[0], v[1], v[2]); C.push(k[0], k[1], k[2]); Z.push(Math.min(1, tiers[t][2] * 0.9 + haze)); } };   // une couleur par facette : aspect taille a la serpe, sans degrade de pic de glace
      for (let t = 0; t < 3; t++) for (let i = 0; i < N; i++) { const j = (i + 1) % N; tri(ring[t][i], ring[t + 1][i], ring[t + 1][j], t, t + 1, t + 1); tri(ring[t][i], ring[t + 1][j], ring[t][j], t, t + 1, t); }
      for (let i = 0; i < N; i++) tri(ring[3][i], top, ring[3][(i + 1) % N], 3, 3, 3);
    };
    for (const [n, rad, h0, h1, r0, r1, haze] of [[46, 1020, 46, 108, 300, 520, 0.24], [38, 800, 30, 70, 240, 420, 0.14]]) for (let i = 0; i < n; i++) { const a = (i + rr(-0.3, 0.3)) / n * 6.2832, rd = rad * rr(0.95, 1.05); mountain(Math.cos(a) * rd, Math.sin(a) * rd, rr(h0, h1), rr(r0, r1), haze); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aHz', new THREE.Float32BufferAttribute(Z, 1)); g.computeVertexNormals();
    return g;
  }
  const HAZE = { value: new THREE.Color('#cfdbe0') }, FADE = { value: 1 };

  class Horizon {
    constructor(game) {
      this.game = game; this.style = null; this.dark = 0; this.seed = 1; this.tex = null;
      const geo = new THREE.CylinderGeometry(R, R, 640, 72, 1, true);
      this.matS = new THREE.MeshBasicMaterial({ color: '#8a96a8', transparent: true, depthWrite: false, side: THREE.BackSide, fog: false });
      this.matG = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, side: THREE.BackSide, fog: false, blending: THREE.AdditiveBlending, opacity: 0 });
      this.ring = new THREE.Mesh(geo, this.matS); this.glow = new THREE.Mesh(geo, this.matG);
      for (const m of [this.ring, this.glow]) { m.frustumCulled = false; m.visible = false; m.scale.setScalar(SC); game.scene.add(m); }
      this.ring.renderOrder = -6; this.glow.renderOrder = -5; this.base = 0;
      const mm = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, emissive: '#16222f' }); mm.customProgramCacheKey = () => 'mtnRing';
      mm.onBeforeCompile = (sh) => { sh.uniforms.uHaze = HAZE; sh.uniforms.uFade = FADE;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <color_vertex>', '#include <color_vertex>\nvHz = aHz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHaze;\nuniform float uFade;\nvarying float vHz;').replace('#include <fog_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, clamp(vHz + uFade, 0.0, 1.0));\n#include <fog_fragment>'); };
      this.mtn = new THREE.Mesh(ringGeometry(7), mm); this.mtn.scale.setScalar(0.45); this.mtn.frustumCulled = false; this.mtn.visible = false; this.mtn.renderOrder = -4; game.scene.add(this.mtn);
      this.tint = new THREE.Color(); this.fog = new THREE.Color('#aab');
    }
    // zone courante (null : pas d'horizon : métro, usine, pièce…) ; dark : ambiance sombre (fenêtres et néons allumés)
    setZone(zone, dark, seed) {
      const st = STYLE[zone] || null, key = st ? st + (dark ? '_d' : '') : null;
      if (!st) { this.style = null; this.ring.visible = this.glow.visible = false; return; }
      if (key !== this.key || seed !== this.seed) {
        if (this.tex) { this.tex.sil.dispose(); if (this.tex.glow) this.tex.glow.dispose(); }
        this.tex = draw(st, (seed || 1) * 97 + st.length * 13, !!dark); this.matS.map = this.tex.sil; this.matS.needsUpdate = true;
        this.matG.map = this.tex.glow; this.matG.needsUpdate = true; this.key = key; this.seed = seed;
      }
      this.style = st; this.darkOn = !!dark;
    }
    setEnv(env) {
      if (!env || !env.fog) return;
      this.fog.set(env.fog.color); if ((env.dark || 0) < 0.3) this.fog.multiplyScalar(this.style === 'campagne' ? 0.97 : 0.86);
      const d = env.dark !== undefined ? env.dark : 0;
      this.tint.copy(this.fog).multiplyScalar(d > 0.4 ? 0.62 : 0.84); if (this.style === 'campagne' && d < 0.3) this.tint.set('#ffffff');   // v038e : silhouettes plus claires (brume), plus de masses noires
      this.matS.color.copy(this.tint);
      HAZE.value.copy(this.fog);
      this.matG.opacity = this.darkOn ? 0.95 : 0;
    }
    // v203 : la chaine de montagnes ne se voit que dans les scenes de plein air ; ni dans la mine, ni dans la ville, ni dans les batiments
    openAir(run) {
      const T = run.T, d = run.dist, sc = this._sc;
      if (!sc || d < sc.d0 || d >= sc.d1) { let f = null; try { const zi = T.zoneIndex(d), pl = CC.Zones.plan(T, zi); for (const q of pl.scenes) if (d >= q.d0 && d < q.d1) { f = q; break; } } catch (e) { f = null; } this._sc = f || { d0: d, d1: d + 20, name: '' }; }
      return /^(rampe|camp|riviere|foret|route)$/.test(this._sc.name || '') && d < this._sc.d1 - 90;
    }
    update(game) {
      const run = game.endlessRun, on = !!run && !!this.style && game.state !== 'BOOT';
      this.ring.visible = on; this.glow.visible = on && this.darkOn;
      this.wantMtn = on && this.style === 'campagne' && this.openAir(run);
      FADE.value += ((this.wantMtn ? 0.12 : 1) - FADE.value) * 0.06; this.mtn.visible = false;   // v205 : plus de montagnes du tout (le fond est uniquement le brouillard et le ciel)
      FADE.value = 1;   // v203 : montagnes seulement a l'air libre (prairie, camp, riviere, foret), en brume legere ; fondu sinon
      if (!on) return;
      const cam = game.camera.position, b = run.T.base(Math.max(0, -game.rocket.pos.z));
      this.base += (b - this.base) * 0.05; if (Math.abs(this.base - b) > 300) this.base = b;
      if (this.y0 === undefined) this.y0 = this.base; this.mtn.position.set(cam.x, this.y0 - 4, cam.z);   // v204 : hauteur fixe dans le monde (avant : elles descendaient avec le couloir)
      this.ring.position.set(cam.x, this.base + 220 * SC, cam.z); this.glow.position.copy(this.ring.position);   // la ligne de sol de la bande est à 90 m au-dessus de son bord bas
    }
  }
  CC.Horizon = Horizon;
})();
