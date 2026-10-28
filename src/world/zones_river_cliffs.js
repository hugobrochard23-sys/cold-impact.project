/* v299 : NIVEAU 2 : LES FALAISES DU FLEUVE, UNE SEULE NAPPE CONTINUE PAR RIVE (plus de coques separees, plus de raccords).
 * Chaque rive est une grille reguliere : une colonne tous les 3 m le long du fleuve, et dans chaque colonne la meme suite de points (du pied de la roche, sous l'eau, jusqu'a l'herbe) :
 * strates a hauteurs ABSOLUES (communes a toute la rive), replats entre les strates, epaule arrondie, herbe qui rejoint les terrasses. Les triangles de deux colonnes voisines partagent leurs sommets :
 * il ne peut y avoir ni fente ni bout manquant, par construction. Les strates qui depassent le sommet ou le pied se replient sur un seul point (triangles plats, non dessines).
 * Les eperons des virages sont des bosses de cette meme nappe (la face avance vers le fleuve et le sommet monte), la collision reste celle des boites invisibles de zones_river1.js.
 * Decoupee en troncons de 32 colonnes (culling) ; les colonnes de bord sont calculees une seule fois, donc identiques des deux cotes. */
(function () {
  const EVO = CC.EVO, R = EVO && EVO.riv, T3 = THREE; if (!R || !EVO.oc || !R.topAt) return;
  const { WY, HW, LA, BED } = R, ss = EVO.oc.ss;
  const D0 = 67.6, DU = 3, CH = 32, TH = 4.4;
  const fr = (v) => v - Math.floor(v);
  const hh = (a, b, c) => fr(Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453);
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const col = (hex) => { const c = new T3.Color(hex); return [c.r, c.g, c.b]; };
  const ROCK = ['#c6bea0', '#bab69c', '#cdc4a4', '#b0ac92', '#bebe9e', '#cabb96', '#b2ae94', '#d2c8a6'].map(col);
  const MOSS = col('#66a040'), MOSS2 = col('#84b44c'), SOIL = col('#6a5438'), ALGAE = col('#3d5a36'), DEEP = col('#3a4034'), GRASS1 = col('#4f9a40');
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const SPUR_U = [[0.06, 0.145], [0.16, 0.245], [0.26, 0.33], [0.4, 0.485], [0.5, 0.585], [0.72, 0.805], [0.83, 0.915]];
  const cTmp = new T3.Color();
  const gcol = (x, z) => { if (R.gcolor) { R.gcolor(x, z, cTmp); return [cTmp.r, cTmp.g, cTmp.b]; } return GRASS1; };
  // eperons : meme calcul de sens que zones_river1.js
  const spursOf = (run) => SPUR_U.map(([u0, u1]) => {
    const T = run.T, dm = Math.round((u0 + u1) / 2 * LA), yy = T.yawAcross(dm), y1 = T.yawAcross(dm - 30), y2 = T.yawAcross(dm + 30); let dy = y2 - y1; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    const a0 = T.at(dm, 0, 0), a1 = T.at(dm, 1, 0), nx = a1[0] - a0[0], nz = a1[2] - a0[2], ix = Math.cos(yy) * Math.sign(dy), iz = -Math.sin(yy) * Math.sign(dy), sg = (nx * ix + nz * iz) >= 0 ? 1 : -1, hwv = HW(dm);
    return { dm, sg, hwv, ins: Math.min(13, Math.max(3, hwv - 22)), topS: WY(dm) + 36 };
  });
  R.cliffSpurs = spursOf;
  const build = (run) => {
    const T = run.T, spurs = spursOf(run);
    let minBot = 1e9, maxTop = -1e9;
    for (let d = D0; d <= LA; d += 4) for (const sg of [-1, 1]) { minBot = Math.min(minBot, WY(d) - 3, WY(d - 12) - 3, WY(d + 12) - 3); maxTop = Math.max(maxTop, R.topAt(d, sg), WY(d) + 36); }
    const kmin = Math.floor((minBot - 1) / TH) - 1, kmax = Math.ceil((maxTop + 3) / TH) + 1, K = kmax - kmin + 1, NP = 1 + 3 * K + 4;
    const nCol = Math.ceil((LA - D0) / DU) + 1, du = (LA - D0) / (nCol - 1);
    const out = { meshes: [], NP, K, nCol, maxJump: 0, quads: 0 };
    for (const sg of [-1, 1]) {
      const sd = 3 + sg, LY = new Float64Array(K + 1);
      for (let i = 0; i <= K; i++) { const k = kmin + i; LY[i] = k * TH + (hh(k, sd, 1) - 0.5) * 0.8 * TH; }
      const sm = (d, k, n) => Math.sin(d / (9 + 7 * hh(k, sd, 80 + n)) + hh(k, sd, 90 + n) * 6.28);
      const but = (k, d) => { const kk = Math.floor(k / 3), c0 = Math.floor(d / 17); let s = 0; for (let c = c0 - 1; c <= c0 + 1; c++) { if (hh(kk, c, sd + 16) <= 0.55) continue; const cu = (c + 0.2 + 0.6 * hh(kk, c, sd + 14)) * 17, w = 4.5 + 4 * hh(kk, c, sd + 15), t = (d - cu) / w; s += Math.exp(-t * t) * (0.35 + 0.5 * hh(kk, c, sd + 17)); } return s; };
      const sections = [];
      for (let ci = 0; ci < nCol; ci++) {
        const d = D0 + ci * du, F = R.faceX(d), tA = R.topAt(d, sg);
        let prot = 0, top = tA, wS = 0;
        for (const sp of spurs) if (sp.sg === sg) { const x = Math.abs(d - sp.dm); if (x < 29.75) { let lat = sp.hwv + 1 - sp.ins - 3 * smooth(5.5, 11.5, x); lat += (F - lat) * smooth(23.75, 29.75, x); prot = Math.max(prot, F - lat); const wt = 1 - smooth(21.75, 29.75, x); wS = Math.max(wS, wt); top = tA + (sp.topS - tA) * wt; } }
        const Fv = F - prot, wy = WY(d), bot = Math.min(WY(d - 12), wy, WY(d + 12)) - 3, ytop = top - 0.3, bed = BED(d);
        const OB = new Float64Array(K); for (let i = 0; i < K; i++) { const k = kmin + i; OB[i] = Math.max(-0.3, 0.55 + 0.9 * hh(k, sd, 11) + 0.3 * sm(d, k, 1) + 0.16 * sm(d * 2.3, k, 2) - but(k, d)); }
        const prof = (i, t) => { const k = kmin + i, ob = OB[i], ot = ob + 0.18 + 0.35 * hh(k, sd, 12), bul = 0.12 + 0.25 * hh(k, sd, 13); return ob + (ot - ob) * t - bul * 4 * t * (1 - t); };
        const locate = (y) => { let i = 0; while (i < K - 1 && y >= LY[i + 1]) i++; return [i, Math.min(1, Math.max(0, (y - LY[i]) / (LY[i + 1] - LY[i])))]; };
        const lb = locate(bot), lt = locate(ytop);
        const color = (i, t, y, role) => {
          const k = kmin + i, base = ROCK[Math.floor(hh(k, sd, 51) * ROCK.length)], mossK = 0.14 + 0.3 * hh(k, sd, 52) * (0.5 + 0.5 * sm(d, k, 3));
          let c = mix(base, MOSS, mossK * Math.min(1, 0.4 + Math.max(0, (y - wy) / 30)));
          if (y < wy + 1.6) c = mix(c, ALGAE, 0.5); if (y < wy - 1) c = mix(c, DEEP, Math.min(0.7, (wy - y) / 6));
          if (y > ytop - 1.2) c = mix(c, SOIL, 0.55 * Math.min(1, (y - (ytop - 1.2)) / 1.2));
          const jit = 0.92 + 0.16 * hh(Math.round(d / du), i * 3 + role, sd + 5);   // grain de roche : chaque sommet est un peu plus clair ou plus sombre
          return role === 0 ? sc(mix(c, MOSS2, 0.45), 0.92 * jit) : role === 1 ? sc(c, 0.97 * jit) : sc(c, 1.08 * jit);
        };
        const lat = new Float32Array(NP), yy = new Float32Array(NP), cc = new Float32Array(NP * 3); let n = 0;
        const put = (la, y, c) => { lat[n] = la; yy[n] = y; cc[3 * n] = c[0]; cc[3 * n + 1] = c[1]; cc[3 * n + 2] = c[2]; n++; };
        // pied : sous la ligne d'eau, la roche descend jusqu'au lit
        put(Fv + prof(lb[0], lb[1]) + 1.2, Math.min(bed - 2, bot - 0.5), sc(DEEP, 0.8));
        for (let i = 0; i < K; i++) for (let q = 0; q < 3; q++) {
          const tt = q * 0.5, yr = LY[i] + tt * (LY[i + 1] - LY[i]);
          if (yr < bot) put(Fv + prof(lb[0], lb[1]), bot, color(lb[0], lb[1], bot, 1));
          else if (yr > ytop) put(Fv + prof(lt[0], lt[1]), ytop, color(lt[0], lt[1], ytop, 1));
          else put(Fv + prof(i, tt), yr, color(i, tt, yr, q));
        }
        // epaule arrondie et herbe qui arrive petit a petit jusqu'a la terrasse
        const lf = Fv + prof(lt[0], lt[1]), lat4 = (F + 5) + ((lf + 5.6) - (F + 5)) * wS, y4 = (tA + 0.04) + ((top + 0.2) - (tA + 0.04)) * wS, lat3 = Math.min(lf + 2.6, lat4 - 0.8), y3 = (top + 0.16 + y4) / 2;
        const X0 = T.at(d, 0, 0), X1 = T.at(d, 1, 0), ax = X0[0], az = X0[2], bx = X1[0] - X0[0], bz = X1[2] - X0[2];
        put(lf + 0.5, top - 0.04, mix(SOIL, GRASS1, 0.5)); put(lf + 1.6, top + 0.16, sc(GRASS1, 0.97)); put(lat3, y3, mix(GRASS1, gcol(ax + bx * sg * lat3, az + bz * sg * lat3), 0.6)); put(lat4, y4, gcol(ax + bx * sg * lat4, az + bz * sg * lat4));
        const px = new Float32Array(NP), pz = new Float32Array(NP); for (let j = 0; j < NP; j++) { px[j] = ax + bx * sg * lat[j]; pz[j] = az + bz * sg * lat[j]; }
        sections.push({ d, px, y: yy, pz, c: cc });
      }
      // troncons
      const mat = new T3.MeshLambertMaterial({ map: CC.Textures.get('rockface'), vertexColors: true, side: T3.DoubleSide });
      for (let c0 = 0; c0 < nCol - 1; c0 += CH) {
        const c1 = Math.min(nCol - 1, c0 + CH), P = [], N = [], C = [], U = [];
        const tri = (A, ia, B, ib, Cc, ic) => {
          const ax = B.px[ib] - A.px[ia], ay = B.y[ib] - A.y[ia], az = B.pz[ib] - A.pz[ia], bx = Cc.px[ic] - A.px[ia], by = Cc.y[ic] - A.y[ia], bz = Cc.pz[ic] - A.pz[ia];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz); if (l < 1e-4) return; nx /= l; ny /= l; nz /= l;
          for (const [S, k] of [[A, ia], [B, ib], [Cc, ic]]) { P.push(S.px[k], S.y[k], S.pz[k]); N.push(nx, ny, nz); C.push(S.c[3 * k], S.c[3 * k + 1], S.c[3 * k + 2]); U.push(S.d / 6 + sd * 0.31, S.y[k] / 6); }
        };
        for (let ci = c0; ci < c1; ci++) {
          const A = sections[ci], B = sections[ci + 1];
          for (let j = 0; j < NP - 1; j++) {
            const jump = Math.hypot(B.px[j] - A.px[j], B.y[j] - A.y[j], B.pz[j] - A.pz[j]); if (jump > out.maxJump) out.maxJump = jump;
            tri(A, j, B, j, B, j + 1); tri(A, j, B, j + 1, A, j + 1); out.quads++;
          }
        }
        if (!P.length) continue;
        const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(U, 2));
        const m = new T3.Mesh(geo, mat); m.userData.d0 = sections[c0].d; m.userData.d1 = sections[c1].d; m.userData.sg = sg; out.meshes.push(m);
      }
    }
    return out;
  };
  R.cliffBuild = build;
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt); const run = g.endlessRun;
    if (!run || !EVO.isS2() || !g.evo || g.evo.preview) { if (g._cl) for (const m of g._cl.meshes) m.visible = false; return; }
    if (g._clRun !== run) { g._clRun = run; if (g._cl) for (const m of g._cl.meshes) { g.scene.remove(m); m.geometry.dispose(); } g._cl = build(run); for (const m of g._cl.meshes) g.scene.add(m); }
    const d = run.dist; for (const m of g._cl.meshes) m.visible = m.userData.d1 > d - 120 && m.userData.d0 < d + 620;
  };
})();
