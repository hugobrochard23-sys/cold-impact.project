/* v118 : NIVEAU 1 « LE MUR DU BOSS » — un parcours spectaculaire (vitres, toits, plongée, ruelle, façades, remontée du puits, chute libre)
 * qui finit sur un boss à trois phases. On y meurt, on apprend, on s'améliore : à chaque mort un écran propose trois améliorations
 * lisibles, payées avec des PIECES gagnées selon la distance, les cibles et les coups portés au boss.
 *   EXPLOSION : le souffle de chaque cible détruite grandit (tout ce qui est proche explose aussi) ET le boss perd plus de PV par coup ;
 *   BOUCLIER  : arrête des missiles (bulles visibles en haut à gauche) ;
 *   RALENTI   : le temps ralentit quand un missile ou un mur est sur le point de toucher la fusée (charges visibles).
 * Boss : phase 1 (PV 6-5) tirs guidés ; phase 2 (4-3) éventail de trois missiles ; phase 3 (2-1) MUR DE MISSILES avec une ouverture,
 * annoncé par une alarme. Sauvegarde dans save.l1. Tout est désactivé dans le banc de test, sauf ?l1=1. */
(function () {
  const U = CC.U, V = THREE.Vector3;
  const UP = {
    boom: { name: 'EXPLOSION', max: 5, cost: [40, 80, 140, 230, 360],
      radius: (l) => (l ? 8 + 5 * l : 0), dmg: (l) => 1 + (l >= 2 ? 1 : 0) + (l >= 4 ? 1 : 0),
      cur(l) { return [l ? 'SOUFFLE ' + this.radius(l) + ' M' : 'AUCUN SOUFFLE', 'BOSS -' + this.dmg(l) + ' PV']; },
      nxt(l) { return '> ' + this.radius(l + 1) + ' M  -' + this.dmg(l + 1) + ' PV'; } },
    shield: { name: 'BOUCLIER', max: 3, cost: [50, 110, 210],
      cur(l) { return [l ? l + ' MISSILE' + (l > 1 ? 'S' : '') : 'AUCUN BOUCLIER', 'BULLE = 1 TIR']; },
      nxt(l) { return '> ' + (l + 1) + ' BULLE' + (l + 1 > 1 ? 'S' : ''); } },
    slow: { name: 'RALENTI', max: 4, cost: [60, 120, 210, 340],
      charges: (l) => (l ? 1 + (l >= 3 ? 1 : 0) : 0), dur: (l) => (l ? +(0.9 + 0.25 * l).toFixed(1) : 0), k: (l) => 0.42 - 0.04 * l,
      cur(l) { return [l ? this.charges(l) + ' X ' + this.dur(l) + ' S' : 'AUCUN RALENTI', 'AVANT L IMPACT']; },
      nxt(l) { return '> ' + this.charges(l + 1) + ' X ' + this.dur(l + 1) + ' S'; } },
  };
  const ORDER = ['boom', 'shield', 'slow'];
  const col = { boom: '#ffb040', shield: '#8fd0ff', slow: '#d8a8ff' };

  const L1 = CC.L1 = { UP, ORDER, col };

  L1.on = (g) => !!(g && g.levelRun && g.levelRun.n === 1);
  L1.save = (g) => {
    const S = g.save.l1 = g.save.l1 || { coins: 0, deaths: 0, wins: 0, best: 0, up: { boom: 0, shield: 0, slow: 0 } };
    S.up = S.up || { boom: 0, shield: 0, slow: 0 };
    if (!L1._cheat) { L1._cheat = 1; const m = /[?&]l1coins=(\d+)/.exec(location.search); if (m) S.coins = parseInt(m[1], 10); const u = /[?&]l1up=(\d)(\d)(\d)/.exec(location.search); if (u) { S.up.boom = +u[1]; S.up.shield = +u[2]; S.up.slow = +u[3]; } }
    return S;
  };
  const lv = (g, id) => (L1.save(g).up[id] || 0);

  // ---------- fiche du niveau 1 ----------
  L1.patchDef = (R) => {
    R.winKills = 0; R.tutD = null; R.tutRel = null;                           // plus de victoire d'entraînement : il faut battre le boss
    R.hp = 6; R.boss = 'gunship'; R.bossEnt = 'wall'; R.bossWall = true; R.mids = []; R.event = null;   // boss caché derrière un mur de briques qui s'effondre
    R.env = 'goldenHour'; R.nightOk = false; R.look = 0; R.kit = 0;
    R.theme = CC.LM.THEMES[0]; R.dens = 0.85; R.difK = 0.9; R.ease = 0.45; R.tgtGap = 70; R.chest = 60;
    return R;
  };

  // ---------- effets des améliorations pendant le vol ----------
  L1.beginRun = (g) => {
    const S = L1.save(g), sl = lv(g, 'slow');
    g.modRun.shield = (g.modRun.shield || 0) + lv(g, 'shield');
    g.l1run = { slow: UP.slow.charges(sl), slowK: UP.slow.k(sl), slowDur: UP.slow.dur(sl), slowT: 0, cool: 0, bossHits: 0, wall: 0, ph: 1, tAcc: 0 };
    g.l1msg = null; g.l1last = null; return S;
  };
  L1.radius = (g) => UP.boom.radius(lv(g, 'boom'));
  L1.bossDmg = (g) => UP.boom.dmg(lv(g, 'boom'));
  L1.msg = (g, txt, dur, color) => { g.l1msg = { txt, t0: performance.now(), dur: (dur || 1.2) * 1000, color: color || '#d9a441' }; };
  // anneau blanc à la taille du souffle : on VOIT la portée de l'amélioration
  L1.boomFx = (g, c, rad) => {
    try { const fx = g.effects; fx.ring(c, new V(0, 1, 0), 2, rad * 2, 0.55, '#ffffff', 0.9); fx.ring(c, new V(1, 0, 0), 2, rad * 1.5, 0.5, '#ffd060', 0.8); fx.flash(c, '#ffd060', 10, rad * 3, 0.4, '#ff8020'); g.hitStop = Math.max(g.hitStop || 0, 0.12); g.hitScale = 0.16; g.rig.shake = Math.max(g.rig.shake || 0, 1.3); } catch (e) { /* ignoré */ }
  };
  L1.onBossHit = (g, t) => {
    const r = g.l1run; if (r) r.bossHits++;
    const fr = t.hp / (t.hpMax || 6), ph = fr > 0.66 ? 1 : fr > 0.33 ? 2 : 3;
    if (r && (L1.on(g) || (CC.EVO && CC.EVO.on)) && ph !== r.ph) { r.ph = ph; L1.msg(g, ph === 2 ? 'PHASE 2' : 'PHASE 3  MUR DE MISSILES', 1.6, '#ff6a50'); g.audio.play('alarm'); }
  };

  // appelé à chaque image de vol : ralenti automatique (missile très proche ou mur imminent)
  L1.tick = (g, dt) => {
    const r = g.l1run, rk = g.rocket; if (!r || g.state !== 'FLIGHT' || !rk.active) return;
    if (r.slowT > 0) { r.slowT -= dt; g.hitStop = Math.max(g.hitStop || 0, r.slowT); g.hitScale = r.slowK; return; }
    if (r.cool > 0) r.cool -= dt;
    if (r.slow <= 0 || r.cool > 0 || g.flightTime < 1.5) return;
    let danger = null;
    for (const m of g.missiles) { if (!m.alive) continue; const d = m.pos.distanceTo(rk.pos); if (d < 30 && d > 5 && m.dir.dot(rk.pos.clone().sub(m.pos).normalize()) > 0.5) { danger = 'missile'; break; } }
    if (!danger && ((r.tAcc += dt) > 0.05)) {
      r.tAcc = 0; const sp = rk.vel.length(); if (sp > 8) { const p1 = rk.pos.clone().addScaledVector(rk.vel, 0.33), h = g.world.sweep(rk.pos, p1, 0.7, (b) => b.kind === 'solid' || b.kind === 'cable' || b.kind === 'hazard'); if (h && h.box && !h.box.ground && !h.hf) danger = 'mur'; }   // mur, câble ou laser : jamais le verre, les briques, les cibles ni le sol
    }
    if (!danger) return;
    r.slow--; r.slowT = r.slowDur; r.cool = 1.2;
    g.hitStop = r.slowDur; g.hitScale = r.slowK; g.flash = Math.max(g.flash || 0, 0.18); g.flashColor = '#cfa8ff'; g.chromaBurst = 0.02;
    g.audio.play('shield'); L1.msg(g, 'RALENTI', 0.9, '#d8a8ff'); g.telemetry.event('l1Slow', { danger });
  };

  // ---------- boss : phase 2 = éventail, phase 3 = mur de missiles avec une ouverture ----------
  const UPV = new V(0, 1, 0);
  L1.bossFire = (t, g, from, rk, muzzle) => {
    const fr = t.hp / (t.hpMax || 6), ph = fr > 0.66 ? 1 : fr > 0.33 ? 2 : 3; t._n = (t._n || 0) + 1;
    const to = rk.pos.clone().sub(from), dist = to.length(), base = to.clone().normalize();
    const EV = !!(CC.EVO && CC.EVO.on);   // v122 : mode Evolution : missiles lents, espaces, esquivables
    if (ph === 1) { t.aaCool = 3.0; return false; }
    if (EV && ph === 2) { if (dist < 45) { t.aaCool = 1.5; return false; } t.aaCool = 4.6; g.spawnEnemyMissile(from.clone(), rk, { miss: 0, lead: 0.15, turn: 0.15, speed: 28, life: 6.5, quiet: true, visualFrom: muzzle }); return true; }
    if (ph === 2) {
      t.aaCool = 3.4;
      for (const a of [-0.24, 0, 0.24]) { const d = base.clone().applyAxisAngle(UPV, a); g.spawnEnemyMissile(from.clone(), { pos: from.clone().addScaledVector(d, dist) }, { miss: 1, lead: 0.3, turn: 0.38, speed: 46, life: 6, exact: true, quiet: true, visualFrom: muzzle }); }
      return true;
    }
    if (t._n % 2 === 0 && !EV) { t.aaCool = 2.2; return false; }   // entre deux murs : un missile guidé
    t.aaCool = EV ? 6 : 3.8;
    if (EV && dist < 45) { t.aaCool = 1.5; return false; }
    g.audio.play('alarm'); L1.msg(g, 'MUR !', 0.9, '#ff6a50'); g.flash = Math.max(g.flash || 0, 0.2); g.flashColor = '#ff3a2a';
    const run0 = g.l1run;
    setTimeout(() => {
      if (!t.alive || g.state !== 'FLIGHT' || !g.rocket.active || g.l1run !== run0) return;
      const r2 = g.rocket, f2 = t.firePoint ? t.firePoint(new V()) : from, d2 = r2.pos.distanceTo(f2), tH = d2 / 40;
      const aim = r2.pos.clone().addScaledVector(r2.vel, tH * 0.5), dir = aim.clone().sub(f2).normalize(), right = new V().crossVectors(dir, UPV).normalize();
      const cols = 9, sp = 5.4, gap = EV ? 4 : 2, gi = 4 + (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 2)) - 0;   // ouverture de deux colonnes, loin du centre où se trouve la fusée
      const g0 = Math.max(0, Math.min(cols - gap, gi));
      for (let c = 0; c < cols; c++) { if (c >= g0 && c < g0 + gap) continue;
        for (const row of [-2.7, 2.7]) { const p = f2.clone().addScaledVector(right, (c - 4) * sp).addScaledVector(UPV, row);
          g.spawnEnemyMissile(p, { pos: p.clone().addScaledVector(dir, 100) }, { miss: 0, lead: 0, turn: 0, speed: EV ? 30 : 40, life: 7, exact: true, quiet: true, puffGap: 0.07, visualFrom: f2 }); } }
    }, EV ? 1100 : 750);
    return true;
  };

  // ---------- pièces, mort, achats ----------
  L1.settle = (g, win) => {
    const S = L1.save(g), run = g.endlessRun, lvd = g.levelRun, r = g.l1run || {};
    const pct = win ? 1 : U.clamp(run.dist / lvd.len, 0, 0.99), lines = [];
    lines.push(['DISTANCE', Math.round(pct * 100)]);
    if (run.kills) lines.push(['CIBLES ' + run.kills, run.kills * 5]);
    if (r.bossHits) lines.push(['COUPS AU BOSS ' + r.bossHits, r.bossHits * 14]);
    if (win) lines.push(['VICTOIRE', 150]);
    if (!S.deaths && !win) lines.push(['PREMIER ESSAI', 40]);
    const total = lines.reduce((a, l) => a + l[1], 0);
    S.coins += total; S.deaths += win ? 0 : 1; if (win) S.wins++; S.best = Math.max(S.best || 0, Math.round(pct * 100));
    const cause = win ? 'VICTOIRE' : g.causeOf(g.crashKind), atBoss = run.dist > lvd.len - 80;
    const rec = (g.crashKind === 'missile') ? 'shield' : atBoss ? 'boom' : (g.crashKind === 'wall' ? 'slow' : 'boom');
    g.l1last = { pct, cause, lines, total, rec, win, doubled: false, t: 0, atBoss, bossHp: win ? 0 : (g.targets.find((q) => q.boss && q.alive) || {}).hp };
    g.writeSave(); return g.l1last;
  };
  L1.nextCost = (g, id) => { const l = lv(g, id), U0 = UP[id]; return l >= U0.max ? null : U0.cost[l]; };
  L1.buy = (g, id) => {
    const S = L1.save(g), c = L1.nextCost(g, id);
    if (c === null || S.coins < c) { g.audio.play('uiTick'); return false; }
    S.coins -= c; S.up[id]++; g.writeSave(); g.audio.play('levelUp'); if (CC.Haptics) CC.Haptics.tick('warn');
    if (g.l1last) g.l1last.bought = { id, t: performance.now() };
    g.telemetry.event('l1Buy', { id, lvl: S.up[id] }); return true;
  };
  L1.double = (g) => { const last = g.l1last; if (!last || last.doubled) return; last.doubled = true; last.lines.push(['PUB X2', last.total]); L1.save(g).coins += last.total; last.total *= 2; g.writeSave(); g.audio.play('target'); };
  L1.retry = (g) => { g.ui.overlay = null; g.goHome({ autoLaunch: true }); };
  L1.beginDeath = (g) => {
    const last = L1.settle(g, false);
    g.state = 'REVIVE'; g.ui.overlay = 'l1death';
    g.telemetry.event('l1Death', { pct: +last.pct.toFixed(2), cause: last.cause, coins: last.total, deaths: L1.save(g).deaths });
  };

  // ---------- affichage en vol : bulles de bouclier, charges de ralenti, messages ----------
  L1.drawHud = (ctx, g, W, H, px) => {
    const F = CC.Font, r = g.l1run; if (!r) return;
    const top = Math.max(10, H * 0.02), x0 = Math.max(14, W * 0.05), y0 = top + px * 6, s = px * 2.6;
    let i = 0;
    const dot = (c, hex) => { const x = x0 + i * s * 2.6, y = y0; ctx.beginPath(); ctx.arc(x + s, y + s, s, 0, 6.283); ctx.fillStyle = c + '55'; ctx.fill(); ctx.lineWidth = Math.max(2, s * 0.22); ctx.strokeStyle = c; ctx.stroke(); if (hex) { ctx.beginPath(); ctx.arc(x + s, y + s, s * 0.35, 0, 6.283); ctx.fillStyle = c; ctx.fill(); } i++; };
    for (let k = 0; k < (g.modRun.shield || 0); k++) dot(col.shield, false);
    for (let k = 0; k < r.slow; k++) dot(col.slow, true);
    const m = g.l1msg;
    if (m) { const a = (performance.now() - m.t0) / m.dur; if (a >= 1) g.l1msg = null; else { ctx.save(); ctx.globalAlpha = a < 0.15 ? a / 0.15 : a > 0.7 ? (1 - a) / 0.3 : 1; const p = Math.min(px * 1.8, (W * 0.9) / Math.max(1, F.measure(m.txt, 1))); F.draw(ctx, m.txt, W / 2, H * 0.3, p, m.color, { align: 'center' }); ctx.restore(); } }
  };
})();
