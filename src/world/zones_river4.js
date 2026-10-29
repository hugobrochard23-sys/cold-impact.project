/* v287 : NIVEAU 2, ZONE 4 — « LA FOSSE » puis « LA BASE » : on quitte le port, la mer s'ouvre sur une fosse de 320 m (parois sombres, surplombs a contourner, stalagmites, epaves couchees, arches
 * de roche, cheminees hydrothermales), puis le SAS de la base sous-marine (portes de ballast, tunnel a nervures, mines, tourelles), la grande cuve et le boss : le sous-marin cuirasse ABYSSAL
 * (trois zones de coup : sonar, tubes lance-torpilles, tourelle de pont). Cotes absolues (voir zones_river.js). */
(function () {
  const U = CC.U, Z = CC.Zones, EVO = CC.EVO, T3 = THREE, V = T3.Vector3, foe = Z.evoFoe, TR = CC.Trees, R = EVO && EVO.riv;
  if (!R || !R.setDeep || !Z.evoFoe) return;
  const SC = Z.defs.ocean.scenes, { pk, ss } = EVO.oc;
  const { LA, LB, A, lampS, water, rel, mixf } = R;
  const OUT = 150, WYS = -112 - R.DROP, SEAB = R.SEAB, D4 = R.D4, LFo = 1000, LBa = 1000, D5 = D4 + LFo, DEND = D5 + LBa, BEDB = -430 - R.DROP;
  R.D5 = D5; R.DEND = DEND;
  const BED = R.BED;
  R.setDeep((d) => { const u = d - D4; if (u >= LFo) return BEDB; const dpt = 28 + 160 * ss(40, 420, u) + 130 * ss(420, 800, u) + 7 * Math.sin(u / 31) * ss(100, 300, u) * (1 - ss(700, 800, u)); return mixf(R.shallow(d), WYS - dpt, ss(0, 40, u)); });
  const HWf = (u) => (mixf(72, 58, ss(0, 140, u)) + 6 * Math.sin(u / 70) * ss(140, 300, u)) * (1 - 0.4 * ss(LFo - 330, LFo - 10, u));   // v302 : la fosse se resserre en entonnoir vers le portail de la base
  const HWb = (u) => (u < 70 ? 35 : u < 560 ? 30 : mixf(30, 80, ss(560, 640, u)));
  const fl = (S, dc, y) => A(S, dc, y);
  for (const [k, m, a] of [['gouffre', 'sea', 'evoDusk'], ['tranchee', 'pit', 'evoMine'], ['cimetiere', 'pit', 'evoMine'], ['portail', 'pit', 'evoMine'], ['sas', 'pit', 'evoMine'], ['cuve', 'pit', 'evoBoss']]) { EVO.SCENE_MOOD[k] = m; EVO.SCENE_AUDIO[k] = a; }
  // trajectoire de reference (tests) : on plonge avec le fond
  { const _p = EVO.riv.pathY; EVO.riv.pathY = (d) => (d >= R.D3 + 1500 && d >= D4 ? Math.max(BED(d) + 16, WYS - 300) : d >= R.D3 ? WYS - 5 : _p(d)); }
  EVO.riv.finishD = DEND - 20;
  { const _ld = EVO.levelDef2, NM = { rapides: 'LE CAMP', barrage: 'LE LAC', delta: 'LE DELTA', havre: 'LE PORT', gouffre: 'LA FOSSE', sousmarin: 'LA BASE' }; EVO.levelDef2 = (g) => { const r = _ld(g); for (const c of EVO.chapters || []) if (NM[c.key]) c.name = NM[c.key]; return r; }; }
  // v302b : plus aucun plafond de hauteur (on peut remonter librement)

  // ============================================== LA FOSSE ==============================================
  SC.gouffre = { len: [LFo, LFo], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'gouffre', name: 'LA FOSSE' }, { u: 0.25, key: 'tranchee', name: 'LA TRANCHEE' }, { u: 0.62, key: 'cimetiere', name: 'LE CIMETIERE' }],
    turns: [[0.2, 0.34, 28], [0.45, 0.6, -36], [0.7, 0.84, 30]],
    pin: (T, sc) => ({ lx: 0, fy: (d) => EVO.riv.pathY(d) - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => BED(d) - SEAB); },
    ground: (d, lx, c) => { c.set('#5a5a56').lerp(new T3.Color('#8a6a44'), 0.25 + 0.25 * Math.sin(d * 0.05 + lx * 0.09)); c.multiplyScalar(0.85 + 0.1 * Math.sin(lx * 0.23 + d * 0.13)); },
    build(S) {
      const d0 = S.d0, d = (u) => d0 + u, DK = ['#8a98a8', '#808e9e', '#92a0b0', '#8694a4'];
      water(S, d0, d0 + LFo, 90, WYS);
      // v307 : parois en nappe continue (relief calcule sur la distance absolue : les tranches se raccordent sans fente) ; les boites ne servent plus qu'a la collision (invisibles)
      const WM = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }), WTOP = WYS + 14, RS = 9, CS = 3.5, WC = DK.map((h) => new T3.Color(h));
      const hz = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453; return v - Math.floor(v); };
      const wlat = (uu, y, sg) => Math.max(0, 1.3 + 0.75 * Math.sin(uu / 9 + y / 13 + sg * 2) + 0.55 * Math.sin(uu / 4.3 - y / 7 + 1.7 * sg) + 0.3 * Math.sin(uu / 2.1 + y / 3.1));
      for (let u = 6; u < LFo - 6; u += 14) S.item(d(u), (r) => {
        const dc = d(u);
        for (const sg of [-1, 1]) {
          const hwv = HWf(u) + 2.2 * Math.sin(u / 41 + sg), bed = BED(dc), wd = OUT - hwv;
          S.bx(dc, sg * (hwv + 1.2 + wd / 2), fl(S, dc, (bed - 8 + WTOP) / 2), wd, WTOP - bed + 8, 18, 'jrock', pk(r, DK), true, { render: false });
          if (r() < 0.12) S.bx(dc, sg * (hwv - 0.2), fl(S, dc, bed + 4), 0.2, r.between([6, 14]), 1, 'emis:#5ff0ff', undefined, false);
          if (!S.inClip(dc)) continue;
          const P = [], C = [], NC = 4, k0 = Math.floor((bed - 40) / RS), k1 = Math.ceil(WTOP / RS), vt = (i, k) => {
            const du = dc - 7 + i * CS, uu = du - d0, bd = BED(du) - 8, kj = k + 0.35 * Math.sin(k * 12.9), ry = Math.min(WTOP, Math.max(bd, kj * RS)), hw = HWf(uu) + 2.2 * Math.sin(uu / 41 + sg) + 1.2 + wlat(uu, ry, sg);
            const c = WC[Math.floor(hz(k, i + Math.floor(dc / 14) * 4, sg) * 4) & 3], br = 0.36 + 0.34 * hz(k, Math.round(uu / 7), 5 + sg) + 0.1 * Math.sin(uu / 6 + k * 1.7);
            return { p: S.T.at(du, sg * hw, A(S, du, ry)), c: [c.r * br, c.g * br, c.b * br], y: ry };
          };
          for (let i = 0; i < NC; i++) for (let k = k0; k < k1; k++) {
            const a0 = vt(i, k), a1 = vt(i + 1, k), b0 = vt(i, k + 1), b1 = vt(i + 1, k + 1);
            if (a0.y === b0.y && a1.y === b1.y) continue;
            for (const q of [a0, a1, b1, a0, b1, b0]) { P.push(q.p[0], q.p[1], q.p[2]); C.push(q.c[0], q.c[1], q.c[2]); }
          }
          if (!P.length) continue;
          const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); geo.computeVertexNormals();
          S.b.root.add(new T3.Mesh(geo, WM));
        }
      });
      // v306 : LA VITRE : un mur de verre barre tout le fosse a l'entree (et monte tres haut) : on le traverse en le brisant, et on plonge. 
      S.item(d(40), (r) => {
        const dc = d(40), Wd = 2 * OUT, top = WYS + 300, bot = WYS - 300, grp = new T3.Group(), gm = new T3.MeshBasicMaterial({ color: '#aef2ff', transparent: true, opacity: 0.2, side: T3.DoubleSide, depthWrite: false, fog: false }), em = new T3.MeshBasicMaterial({ color: '#9ff6ff' });
        const pane = new T3.Mesh(new T3.PlaneGeometry(Wd, top - bot), gm); pane.position.y = (top + bot) / 2; grp.add(pane);
        for (let k = -3; k <= 3; k++) { const m = new T3.Mesh(new T3.BoxGeometry(1.2, top - bot, 1.2), em); m.position.set(k * 45, (top + bot) / 2, 0); grp.add(m); }
        for (const y of [WYS - 80, WYS - 30, WYS + 30, WYS + 90, WYS + 160]) { const m = new T3.Mesh(new T3.BoxGeometry(Wd, 1.2, 1.2), em); m.position.set(0, y, 0); grp.add(m); }
        for (const sx of [-1, 1]) { const m = new T3.Mesh(new T3.BoxGeometry(34, 3.2, 1.6), em); m.position.set(sx * 9, WYS + 14, 0.5); m.rotation.z = -sx * 0.84; grp.add(m); }   // grande fleche en V : on plonge
        EVO.placeGroup(S, grp, dc, 0, A(S, dc, 0), 0); let done = false;
        EVO.addDyn(grp, (t, dt, g) => { const run = g.endlessRun, rk = g.rocket; if (done || !run || g.state !== 'FLIGHT') return; if (run.dist > dc) { done = true; grp.visible = false; g.rig.shake = Math.max(g.rig.shake, 1.0); g.flash = Math.max(g.flash || 0, 0.35); g.flashColor = '#dffbff'; g.audio.play('whoosh');
          if (g.effects && g.effects.debris) for (let k = 0; k < 70; k++) g.effects.debris.emit({ pos: new T3.Vector3(rk.pos.x + (Math.random() - 0.5) * 20, rk.pos.y + (Math.random() - 0.5) * 16, rk.pos.z + (Math.random() - 0.5) * 20), vel: new T3.Vector3((Math.random() - 0.5) * 50, (Math.random() - 0.3) * 30, (Math.random() - 0.5) * 50), life: 1.4 + Math.random(), s0: 1.2, s1: 1.2, s2: 0.4, peak: 0.1, cols: g.effects.pal.debrisLight, grav: 12, drag: 0.6, spin: 7 });
          if (rk.pos.y > WYS + 2) rk.vel.y -= 28; } }, [], { near: 900, span: 400 });
      });
      // surplombs en quinconce : la trajectoire serpente
      for (let k = 0; k < 9; k++) { const u = 90 + k * 100, sg = k % 2 ? 1 : -1; S.item(d(u), (r) => { const dc = d(u), hwv = HWf(u), bed = BED(dc), y = bed + 26 + 18 * hsh(u, 2), ext = hwv * 1.05; S.bx(dc, sg * (hwv - ext / 2 + 3), fl(S, dc, y), ext, 6, 22, 'jrock', pk(r, DK), true); S.bx(dc, sg * (hwv - ext + 3), fl(S, dc, y - 5), 4, 12, 20, 'jrock', pk(r, DK), true); S.glow(dc - 12, sg * (hwv - ext + 2), fl(S, dc, y - 2), '#5ff0ff', 20); }); }
      // stalagmites : on passe entre
      for (let u = 60; u < LFo - 40; u += 62) S.item(d(u), (r) => { const dc = d(u), hwv = HWf(u), bed = BED(dc); for (let k = 0; k < 1; k++) { const lx = r.between([-hwv * 0.6, hwv * 0.6]), h = r.between([14, 46]); S.cyl(dc + r.between([-5, 5]), lx, fl(S, dc, bed - 1), r.between([3.4, 6]), h, 'jrock', pk(r, DK), 8, 0.9, true); } });
      // arches de roche : deux piliers et un linteau en travers de la fosse
      for (const u of [300, 560, 840]) S.item(d(u), (r) => { const dc = d(u), hwv = HWf(u), bed = BED(dc), yb = bed + 38; for (const sg of [-1, 1]) S.cyl(dc, sg * (hwv - 9), fl(S, dc, bed - 1), 7, yb - bed + 4, 'jrock', pk(r, DK), 9, 4.5, true); S.glow(dc - 12, 0, fl(S, dc, yb - 1), '#ffcf6a', 40); });
      // epaves couchees sur le fond (cargo coupe en deux, mats, conteneurs), cheminees hydrothermales
      for (const [u, lx, rot] of [[180, 10, 8], [440, -14, -12], [700, 8, 6], [930, -10, -9]]) S.item(d(u), (r) => {
        const dc = d(u), bed = BED(dc);
        S.b.box({ p: S.T.at(dc, lx, 8), s: [16, 14, 74], r: [r.between([-8, 8]), rot, rot * 0.7], mat: 'metal', tint: '#9a5a3c', collide: true });
        S.b.box({ p: S.T.at(dc + 30, lx + 3, 14), s: [9, 4, 30], r: [0, rot, 6], mat: 'metal', tint: '#7a2a22', collide: true });
        S.cyl(dc - 10, lx, fl(S, dc, bed + 13), 0.6, 26, 'metal', '#5a6068', 6, 0.5, false); S.bx(dc - 10, lx, fl(S, dc, bed + 24), 12, 0.5, 0.5, 'metal', '#5a6068', false);
        for (let k = 0; k < 3; k++) S.bx(dc + r.between([-12, 12]), lx + r.between([-10, 10]), fl(S, dc, bed + 1.4), 6, 2.6, 2.5, 'col:' + pk(r, ['#8a2a22', '#2a5a8a', '#8a7a2a']), undefined, true);
        lampS(S, dc, lx + 3, fl(S, dc, bed + 18), '#ffcf6a', 22);
      });
      for (let u = 50; u < LFo - 30; u += 64) S.item(d(u), (r) => { const dc = d(u), hwv = HWf(u), bed = BED(dc), lx = r.between([-hwv * 0.7, hwv * 0.7]); S.cyl(dc, lx, fl(S, dc, bed - 1), 2.6, 6, 'jrock', '#5a4a3a', 8, 1.4, true); S.bx(dc, lx, fl(S, dc, bed + 18), 1.6, 28, 1.6, 'emis:#ff9a4a', undefined, false); S.glow(dc, lx, fl(S, dc, bed + 8), '#ff9a4a', 46); });
      // ennemis : mines partout, tourelles sur les surplombs, canonnieres de surface au tout debut
      for (let k = 0; k < 16; k++) { const u = 40 + k * 60; foe(S, 'mine', d(u), (k % 2 ? 1 : -1) * r5(k) * HWf(u), Math.max(8, BED(d(u)) < WYS - 80 ? hsh(u, 5) * 70 + 14 : WYS - BED(d(u)) - 5), { name: 'MINE', keep: true }); }
      for (const u of [90, 190]) foe(S, 'gunboat', d(u), (u === 90 ? -8 : 8), WYS + 0.5 - BED(d(u)), { name: 'CANONNIERE', hp: 4, armed: true, keep: true });
      for (const [u, sg] of [[140, -1], [260, 1], [380, -1], [500, 1], [620, -1], [740, 1], [860, -1], [960, 1]]) foe(S, 'aaturret', d(u), sg * (HWf(u) - 4), BED(d(u)) < WYS - 60 ? 24 : WYS - BED(d(u)) - 6, { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      for (let k = 0; k < 14; k++) { const u = LFo - 330 + k * 24; for (const sg of [-1, 1]) S.glow(d(u), sg * (HWf(u) - 3), fl(S, d(u), BED(d(u)) + 22), '#7be8ff', 30); }   // v302 : balises de l'entonnoir
      for (let k = 0; k < 40; k++) { const u = 20 + k * 25; S.glow(d(u), (k % 2 ? 1 : -1) * 22, fl(S, d(u), BED(d(u)) + 9), '#9ff6ff', 44); }   // v302b : balises de guidage tout au long de la fosse
      for (let k = 0; k < 22; k++) { const u = 20 + k * 44; S.glow(d(u), (k % 2 ? 1 : -1) * 16, fl(S, d(u), BED(d(u)) + 18 + 10 * (k % 3)), '#5ff0ff', 36); }
    } };
  const r5 = (k) => 0.15 + 0.5 * hsh(k, 3);
  function hsh(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }

  // ============================================== LA BASE ==============================================
  SC.sousmarin = { len: [LBa, LBa], noDoor: true, noChaos: true, gw: 125, grass: false,
    sub: [{ u: 0, key: 'portail', name: 'LA BASE' }, { u: 0.08, key: 'sas', name: 'LE SAS' }, { u: 0.56, key: 'cuve', name: 'LA CUVE' }],
    turns: [[0.2, 0.3, 12], [0.4, 0.5, -14]],
    pin: (T, sc) => ({ lx: 0, fy: (d) => BEDB + 16 - T.base(d), from: 24, to: sc.d1 - sc.d0 - 24 }),
    relief(T, sc) { return rel(sc, (d) => BED(d) - SEAB); },
    ground: (d, lx, c) => { c.set('#4a5058').multiplyScalar(0.85 + 0.12 * Math.sin(lx * 0.3 + d * 0.2)); },
    build(S) {
      const d0 = S.d0, d = (u) => d0 + u, HT = 34, CE = BEDB + HT, lamC = (c) => new T3.MeshLambertMaterial({ color: c });
      water(S, d0, d0 + 80, 90, WYS);
      // approche : parois de la fosse, deux tours de sas, puis le portail de la base
      for (let u = 6; u < 80; u += 14) S.item(d(u), (r) => { const dc = d(u); for (const sg of [-1, 1]) { const hwv = 35, top = WYS + 14, bed = BED(dc), wd = OUT - hwv; S.bx(dc, sg * (hwv + wd / 2), fl(S, dc, (bed - 8 + top) / 2), wd, top - bed + 8, 18, 'jrock', pk(r, ['#4a5058', '#42484e']), true); } });
      S.item(d(70), (r) => { const dc = d(70); S.wall(dc, -OUT, OUT, fl(S, dc, BEDB - 8), fl(S, dc, WYS + 14), 18, 'concreteDark', '#7a7e80', { lx: 0, yc: fl(S, dc, BEDB + 17), w: 62, h: 34 }); for (const sg of [-1, 1]) { S.bx(dc - 9.4, sg * 32, fl(S, dc, BEDB + 18), 3, 38, 2, 'hazard', undefined, false); lampS(S, dc - 10.6, sg * 32, fl(S, dc, BEDB + 36), '#ffd23a', 26); } });
      // le sas : murs, plafond, nervures jaunes, lampes cyan, tuyauteries
      for (let u = 76; u < 560; u += 12) S.item(d(u), (r) => {
        const dc = d(u), hw = HWb(u), mid = BEDB + HT / 2, rib = Math.round(u / 12) % 2 === 0;
        for (const sg of [-1, 1]) S.bx(dc, sg * (hw + 8), fl(S, dc, mid), 16, HT + 10, 12.8, 'concreteDark', pk(r, ['#6a6e70', '#62666a', '#70747a']), true);
        S.bx(dc, 0, fl(S, dc, CE + 4.5), 2 * (hw + 16), 9, 12.8, 'concreteDark', '#5c6064', true);
        if (rib) { for (const sg of [-1, 1]) S.bx(dc, sg * (hw - 1.2), fl(S, dc, mid), 2.4, HT, 1.6, 'metal', '#d8a828', false); S.bx(dc, 0, fl(S, dc, CE - 1.4), 2 * hw, 2.4, 1.6, 'metal', '#d8a828', false); for (const sg of [-1, 1]) lampS(S, dc, sg * (hw - 3), fl(S, dc, BEDB) + 4, '#7be8ff', 14); }
        else for (const sg of [-1, 1]) S.bx(dc, sg * (hw - 4), fl(S, dc, CE - 0.5), 1.2, 0.5, 6, 'emis:#cfeeff', undefined, false);
        for (const sg of [-1, 1]) for (let k = 1; k < 4; k++) S.bx(dc, sg * (hw - 0.6), fl(S, dc, BEDB + k * HT / 4 + 0.6 * (k % 2)), 0.7, 0.7, 12.4, 'metal', k === 2 ? '#c8362a' : k === 1 ? '#3a78b8' : '#8a9096', false);
      });
      // portes de ballast : trois grandes lames qui montent et descendent, une fente de 9 m au ras du sol reste toujours ouverte
      [[150, 0.0], [260, 2.1], [380, 4.2], [470, 1.0]].forEach(([u, ph]) => S.item(d(u), () => {
        const dc = d(u), hw = HWb(u), g = new T3.Group(), body = lamC('#c8362a'), dk = lamC('#2c3036'), lampM = new T3.MeshBasicMaterial({ color: '#4aff6a' }), cols = [];
        g.add(new T3.Mesh(new T3.BoxGeometry(2 * hw - 1, 30, 3), body)); for (let k = -4; k <= 4; k++) { const st = new T3.Mesh(new T3.BoxGeometry(2.4, 30.2, 3.1), dk); st.position.x = k * (hw * 0.22); g.add(st); }
        for (const sg of [-1, 1]) { const lp = new T3.Mesh(new T3.BoxGeometry(1.2, 1.2, 3.4), lampM); lp.position.set(sg * (hw - 3), 14, 0); g.add(lp); }
        cols.push(EVO.colBox(g, 2 * hw - 1, 30, 3, 0, 0, 0));
        const p = R.absAt(S, dc, 0, fl(S, dc, CE)); g.position.set(p[0], CE - 19 + 15, p[2]); g.rotation.y = U.deg(S.yaw(dc)); S.b.root.add(g);
        S.bx(dc, 0, fl(S, dc, CE - 1), 2 * hw, 2, 5, 'hazard', undefined, false);
        EVO.addDyn(g, (t) => { const b = CE - 14 + 7 * Math.sin(t * 0.95 + ph), low = b - BEDB < 18;   // v306 : les portes ne descendent plus qu'a 13 m du sol (elles etaient a 4 m)
          g.position.y = b + 15; lampM.color.set(low ? '#ff3a2a' : '#4aff6a'); }, cols, { near: 420, span: 20 });
      }));
      // defenses du sas : mines, tourelles de paroi sur consoles
      for (const [u, sg, y] of [[110, 1, 12], [200, -1, 16], [235, 1, 10], [300, -1, 14], [330, 1, 18], [420, -1, 12], [445, 1, 16], [520, -1, 10]]) foe(S, 'mine', d(u), sg * 12, y, { name: 'MINE', keep: true });
      for (const [u, sg] of [[100, -1], [190, 1], [225, -1], [320, 1], [350, -1], [410, 1], [450, -1], [500, 1], [540, -1]]) { const dc = d(u), hw = HWb(u); S.item(dc, () => { S.bx(dc, sg * (hw - 1.6), fl(S, dc, BEDB + 12), 3.4, 1.2, 4.2, 'metal', '#4a5058', false); S.bx(dc, sg * (hw - 0.9), fl(S, dc, BEDB + 10), 1.8, 5, 1.8, 'metal', '#3a4046', false); lampS(S, dc, sg * (hw - 3.2), fl(S, dc, BEDB) + 17, '#ff5a3a', 12); }); foe(S, 'aaturret', dc, sg * (hw - 4.2), 14, { name: 'TOURELLE', armed: true, keep: true, fixed: true }); }
      // la cuve : grande salle ouverte, piliers a anneaux lumineux, silos, passerelles, pour le combat contre ABYSSAL
      for (let u = 560; u < LBa - 6; u += 14) S.item(d(u), (r) => { const dc = d(u), hw = HWb(u); for (const sg of [-1, 1]) { const top = BEDB + 70, bed = BEDB, wd = OUT - hw; S.bx(dc, sg * (hw + wd / 2), fl(S, dc, (bed - 8 + top) / 2), wd, top - bed + 8, 18, 'concreteDark', pk(r, ['#52565c', '#4a4e54', '#5a5e64']), true); if (r() < 0.5) S.bx(dc, sg * (hw - 0.5), fl(S, dc, bed + r.between([10, 50])), 0.6, 1, r.between([6, 12]), 'emis:#7be8ff', undefined, false); } S.bx(dc, 0, fl(S, dc, BEDB + 74), 2 * (hw + 14), 8, 14.9, 'concreteDark', '#4a4e54', true); });
      for (let u = 590; u < LBa - 40; u += 70) S.item(d(u), (r) => { const dc = d(u), hw = HWb(u); for (const sg of [-1, 1]) { S.cyl(dc, sg * (hw - 10), fl(S, dc, BEDB), 4.4, 70, 'metal', '#6a7078', 14, 4.4, true); for (let k = 0; k < 4; k++) S.cyl(dc, sg * (hw - 10), fl(S, dc, BEDB + 10 + k * 15), 4.8, 1.2, 'emis:#5ff0ff', undefined, 14, 4.8, false); S.glow(dc, sg * (hw - 10), fl(S, dc, BEDB + 36), '#5ff0ff', 60); } });
      for (const [u, lx] of [[620, -50], [700, 54], [780, -52], [960, 40]]) S.item(d(u), (r) => { const dc = d(u); S.cyl(dc, lx, fl(S, dc, BEDB), 9, 22, 'metal', '#8a9096', 14, 8, true); S.cyl(dc, lx, fl(S, dc, BEDB + 22), 9.4, 1.4, 'emis:#7be8ff', undefined, 14, 9.4, false); S.cyl(dc, lx, fl(S, dc, BEDB + 23), 6, 4, 'col:#c8dae6', undefined, 14, 4, true); });
      for (const [u, sg] of [[600, -1], [660, 1], [730, -1], [800, 1], [900, -1], [950, 1]]) foe(S, 'aaturret', d(u), sg * (HWb(u) - 5), 18 + (u % 3) * 8, { name: 'TOURELLE', armed: true, keep: true, fixed: true });
      for (let k = 0; k < 6; k++) { const u = 600 + k * 55; foe(S, 'mine', d(u), (k % 2 ? 1 : -1) * 38, 30 + (k % 3) * 10, { name: 'MINE', keep: true }); }
      for (let k = 0; k < 30; k++) { const u = 10 + k * 33; S.glow(d(u), (k % 2 ? 1 : -1) * 14, fl(S, d(u), BEDB + 30), '#7be8ff', 48); }
      S.item(d(LBa - 24), () => R.finishLine(S, d(LBa - 24)));
    } };

  // ============================================== ABYSSAL : le sous-marin cuirasse ==============================================
  function abyssalModel() {
    const K = EVO.boss2Kit, { lam, bas, bx, cy, glow, marker } = K, root = new T3.Group(), hull = lam('#4a5a66'), dark = lam('#1e262e'), light = lam('#7a8c9a'), red = lam('#a8321c'), cyan = bas('#7be8ff'), zones = [];
    cy(root, 21, 21, 200, hull, 0, 0, 20, 20, true); cy(root, 21, 7, 55, hull, 0, 0, -107, 20, true); cy(root, 7, 21, 70, hull, 0, 0, 155, 20, true); cy(root, 5, 7, 14, dark, 0, 0, -138, 14, true);
    for (let k = 0; k < 7; k++) cy(root, 21.5, 21.5, 2.6, k % 2 ? red : light, 0, 0, -50 + k * 24, 20, true);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832; bx(root, 1.4, 1.4, 1.4, cyan, Math.cos(a) * 21.4, Math.sin(a) * 21.4, 60); bx(root, 1.4, 1.4, 1.4, cyan, Math.cos(a) * 21.4, Math.sin(a) * 21.4, -30); }
    bx(root, 12, 26, 46, dark, 0, 30, 10); bx(root, 13, 4, 50, light, 0, 44, 10); for (let k = 0; k < 3; k++) cy(root, 0.6, 0.6, 14, dark, -3 + k * 3, 55, 6 + k * 8, 6); bx(root, 14, 1, 1, cyan, 0, 40, -14); lampMk(root, 0, 58, 6);
    for (const sx of [-1, 1]) { bx(root, 36, 1.6, 12, light, sx * 30, 0, -50); bx(root, 18, 1.6, 8, dark, sx * 24, 0, 130); bx(root, 1.6, 22, 12, dark, sx * 3, 18, 150); bx(root, 14, 6, 6, dark, sx * 16, -22, -30); }
    bx(root, 1.6, 28, 12, dark, 0, 0, 155); const prop = new T3.Group(); prop.position.set(0, 0, 192); root.add(prop); for (let k = 0; k < 5; k++) { const b = bx(prop, 1.2, 20, 6, light, 0, 10, 0); b.rotation.z = k * 1.2566; b.position.set(Math.sin(k * 1.2566) * -10, Math.cos(k * 1.2566) * 10, 0); }
    function lampMk(g, x, y, z) { bx(g, 1.6, 1.6, 1.6, bas('#ff3a2a'), x, y, z); }
    // zone 1 : le SONAR (dome au nez, dessus)
    { const n = new T3.Group(); n.position.set(0, 20, -106); root.add(n); const dome = new T3.Mesh(new T3.SphereGeometry(11, 16, 12), new T3.MeshLambertMaterial({ color: '#7fb8d8', emissive: '#2a6a8a', fog: false })); n.add(dome); const ring = new T3.Mesh(new T3.TorusGeometry(12, 1.6, 8, 20), dark); ring.rotation.x = Math.PI / 2; ring.position.y = -3; n.add(ring); const gl = glow(70, '#7be8ff'); n.add(gl); const mk = marker(n, 18, '#ffd040', 1); mk.position.z = -26; zones.push({ id: 'SONAR', pos: new V(0, 20, -106), r: 15, node: n, gl, burn: true, mk }); }
    // zone 2 : les TUBES lance-torpilles (nez, dessous)
    { const n = new T3.Group(); n.position.set(0, -8, -128); root.add(n); for (let k = 0; k < 6; k++) { const x = (k % 3 - 1) * 8, y = (k < 3 ? 4.4 : -4.4); cy(n, 3.4, 3.4, 8, dark, x, y, 0, 12, true); cy(n, 2.4, 2.4, 1.2, bas('#ff8a2a'), x, y, -4.2, 12, true); } const gl = glow(70, '#ff9a4a'); gl.position.z = -8; n.add(gl); const mk = marker(n, 18, '#ffd040', 1); mk.position.z = -28; zones.push({ id: 'TUBES', pos: new V(0, -8, -128), r: 16, node: n, gl, burn: true, mk }); }
    // zone 3 : la TOURELLE de pont (devant la voile)
    { const n = new T3.Group(); n.position.set(0, 36, -34); root.add(n); bx(n, 14, 5, 14, dark, 0, -2, 0); cy(n, 6, 7, 6, light, 0, 2, 0, 12); for (const sx of [-1, 1]) cy(n, 1.2, 1.4, 22, dark, sx * 2.6, 3, -12, 8, true); const gl = glow(60, '#ffcf6a'); gl.position.y = 6; n.add(gl); const mk = marker(n, 16, '#ffd040', 1); mk.position.z = -26; zones.push({ id: 'TOURELLE', pos: new V(0, 36, -34), r: 14, node: n, gl, burn: true, mk }); }
    return { root, zones, hulls: [{ pos: new V(0, 0, 40), size: [44, 44, 160] }, { pos: new V(0, 30, 10), size: [12, 28, 46] }], prop };
  }
  // v305 : UNE AMBIANCE PAR ZONE (ciel, brume, lumiere) : brume verte des gorges, lagune turquoise, barrage orageux, hall industriel ambre, delta a l'heure doree, mangrove rose, port au crepuscule puis de nuit, fosse bleu profond, cimetiere verdatre, portail cyan, sas froid, cuve rouge d'alerte
  { const M = EVO.addMood, SM = EVO.SCENE_MOOD, mk = (k, name, m) => { M(name, m); SM[k] = name; };
    mk('gorges', 'riv_gorges', { top: '#3a86d4', hor: '#cfe8dc', fog: '#b4dcc8', near: 80, far: 440, hemiS: '#e4f4ea', hemiG: '#4a8a56', hemiI: 0.8, amb: 0.27, sunC: '#fff2d0', sunI: 0.7, night: 0 });
    mk('lagune', 'riv_lagune', { top: '#2a9ee6', hor: '#d4f6f2', fog: '#b4ece4', near: 90, far: 480, hemiS: '#e8fbf8', hemiG: '#4a9a8a', hemiI: 0.84, amb: 0.28, sunC: '#fff6dc', sunI: 0.74, night: 0 });
    mk('barrage', 'riv_barrage', { top: '#52627a', hor: '#c4ccd2', fog: '#8a98a6', near: 100, far: 520, hemiS: '#d4dce4', hemiG: '#4a5660', hemiI: 0.86, amb: 0.26, sunC: '#ffe6c0', sunI: 0.6, night: 0.05 });
    SM.lac = 'riv_barrage';
    for (const k of ['conduite', 'hall']) mk(k, 'riv_hall', { top: '#2e2a26', hor: '#8a7656', fog: '#5a4c3a', near: 40, far: 420, hemiS: '#ffe4b8', hemiG: '#6a5640', hemiI: 1.3, amb: 0.7, sunC: '#ffd8a0', sunI: 0.5, night: 0.15 });
    mk('canal', 'riv_canal', { top: '#4a86c8', hor: '#f0dcc0', fog: '#c8c0b0', near: 110, far: 540, hemiS: '#f4ecdc', hemiG: '#5a6a5a', hemiI: 0.88, amb: 0.28, sunC: '#ffd8a0', sunI: 0.8, night: 0 });
    mk('delta', 'riv_delta', { top: '#4c84d8', hor: '#ffdca8', fog: '#f0c89a', near: 100, far: 520, hemiS: '#fff0d8', hemiG: '#6a8a50', hemiI: 0.9, amb: 0.3, sunC: '#ffc27a', sunI: 0.85, night: 0 });
    mk('mangrove', 'riv_mangrove', { top: '#7266b8', hor: '#ffb994', fog: '#e8a894', near: 90, far: 500, hemiS: '#ffe0d0', hemiG: '#7a6a58', hemiI: 0.86, amb: 0.32, sunC: '#ff9a68', sunI: 0.78, night: 0.05 });
    mk('havre', 'riv_havre', { top: '#3c4488', hor: '#f08c78', fog: '#9a7498', near: 90, far: 520, hemiS: '#ffd4c8', hemiG: '#5a5068', hemiI: 0.84, amb: 0.34, sunC: '#ffa070', sunI: 0.6, night: 0.15 });
    mk('quais', 'riv_quais', { top: '#242c62', hor: '#c8627e', fog: '#5e4c7e', near: 80, far: 500, hemiS: '#e8b8d0', hemiG: '#4a4668', hemiI: 0.8, amb: 0.4, sunC: '#ff8a7a', sunI: 0.4, night: 0.35 });
    mk('rade', 'riv_rade', { top: '#121c42', hor: '#3e5084', fog: '#222e58', near: 70, far: 480, hemiS: '#a8bce8', hemiG: '#3a4468', hemiI: 0.9, amb: 0.5, sunC: '#a8c0f0', sunI: 0.35, night: 0.55 });
    mk('gouffre', 'riv_gouffre', { top: '#2c5470', hor: '#6aa0ba', fog: '#3f7a96', near: 40, far: 560, hemiS: '#d4eefa', hemiG: '#55747e', hemiI: 1.0, amb: 0.45, sunC: '#c8e4f0', sunI: 0.5, night: 0.2 });
    mk('tranchee', 'riv_tranchee', { top: '#1c3c78', hor: '#4a78c0', fog: '#2c5090', near: 40, far: 560, hemiS: '#b8d4ff', hemiG: '#3c5a8c', hemiI: 0.95, amb: 0.42, sunC: '#a8c8ff', sunI: 0.5, night: 0.25 });
    mk('cimetiere', 'riv_cimetiere', { top: '#24502c', hor: '#78a878', fog: '#3c7054', near: 40, far: 540, hemiS: '#d0f0d4', hemiG: '#4a6a50', hemiI: 0.95, amb: 0.42, sunC: '#c8f0c8', sunI: 0.5, night: 0.25 });
    mk('portail', 'riv_portail', { top: '#0e4a5e', hor: '#4ac0d4', fog: '#1e7088', near: 40, far: 520, hemiS: '#c8f8ff', hemiG: '#3c7080', hemiI: 1.0, amb: 0.45, sunC: '#b0f0ff', sunI: 0.5, night: 0.2 });
    mk('sas', 'riv_sas', { top: '#26343e', hor: '#7a94a4', fog: '#4a5c68', near: 40, far: 460, hemiS: '#e0f0fa', hemiG: '#586a76', hemiI: 1.0, amb: 0.45, sunC: '#d8ecf8', sunI: 0.5, night: 0.15 });
    mk('cuve', 'riv_cuve', { top: '#2e1016', hor: '#8a3038', fog: '#451a20', near: 40, far: 480, hemiS: '#ffc4b8', hemiG: '#6a3a40', hemiI: 0.95, amb: 0.4, sunC: '#ff9a88', sunI: 0.5, night: 0.25 });
  }
  if (EVO.boss2Kit) EVO.boss2Kit.DEFS.abyssal = { scene: 'sousmarin', at: 0.84, ahead: 0, speed: 0, name: 'ABYSSAL', hp: 3, model: abyssalModel, yOff: 8, surge: 220, fire: 2.6, finish: true, muzzle: [0, -8, -140] };
})();
