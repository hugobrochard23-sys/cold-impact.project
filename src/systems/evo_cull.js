/* v455 : PERFORMANCES DES NIVEAUX 4 A 8, SANS RIEN CHANGER A L'IMAGE.
 * 1) Les tres gros objets toujours dessines en entier (anneaux du tube, bambous, herbe, maison fusionnee, decor du Far West...) sont DECOUPES
 *    en 16 morceaux au plus (cases d'au moins 200 m) : chaque morceau a sa propre sphere englobante et n'est plus dessine quand il est hors de l'ecran.
 *    Niveau 7 : la maison est decoupee par bandes de 300 m le long du parcours, et le jardin n'est pas dessine au debut (avant 1300 m) : les murs le cachent
 *    (verifie image par image au banc : identique).
 *    L'objet d'origine reste en place (meme parent, memes drapeaux) et porte ses morceaux : le code du niveau qui le cache / le montre marche toujours.
 *    Les objets animes (asteroides, roches qui bougent : L.AV) ne sont pas touches.
 * 2) Les petits objets qui font MOINS D UN QUART DE PIXEL a l ecran (0,25 px) (rivets, pieces, petits ennemis tres loin ; pas les halos lumineux, qui allument encore un pixel) ne sont pas envoyes a la carte graphique ;
 *    ils reviennent des qu'ils depassent un pixel (verifie par tranches, quelques centaines d'objets par image). */
(function () {
  const EVO = CC.EVO, T3 = THREE; if (!EVO) return;
  const cur = () => EVO.ouest || EVO.maison || EVO.fete || EVO.core || EVO.space || null;
  const CELL = 200, MIN_INST_TRI = 20000, MIN_MESH_TRI = 40000, MAXC = 16;
  const cellOf = (bb) => { const w = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z); return Math.max(CELL, w / 4 + 1); };   // au plus ~4 x 4 morceaux a plat (assez peu d appels de dessin en plus)
  const triOf = (geo) => (geo.index ? geo.index.count : geo.attributes.position ? geo.attributes.position.count : 0) / 3;
  let st = null, curL = null;
  // decoupage le long du parcours (niveau 7) : L.cullW = { at(point monde) -> w, band, hideFrom, until, now() } ; un point local de l objet est passe en monde
  const _wm = new T3.Matrix4();
  const wBand = (o) => { const C = curL && curL.cullW; if (!C) return null; o.updateWorldMatrix(true, false); _wm.copy(o.matrixWorld); return (v) => 'w' + Math.floor(C.at(_s.center.copy(v).applyMatrix4(_wm)) / C.band); };
  const tagW = (ch, key) => { if (typeof key === 'string' && key[0] === 'w') { ch.userData.wMin = +key.slice(1) * curL.cullW.band; (st.wChunks = st.wChunks || []).push(ch); } };
  const k0 = (cells, ids) => { for (const [k, v] of cells) if (v === ids) return k; return null; };
  const _m = new T3.Matrix4(), _v = new T3.Vector3(), _s = new T3.Sphere(), _sz = new T3.Vector2(), _cp = new T3.Vector3();

  // --- un objet repete (InstancedMesh) -> des morceaux par case de 200 m
  function splitInst(im) {
    const geo = im.geometry; if (!geo.boundingSphere) geo.computeBoundingSphere();
    const gs = geo.boundingSphere, n = im.count, cells = new Map(), bb = new T3.Box3();
    for (let i = 0; i < n; i++) { im.getMatrixAt(i, _m); bb.expandByPoint(_v.setFromMatrixPosition(_m)); }
    const cs = cellOf(bb), WB = wBand(im);
    for (let i = 0; i < n; i++) { im.getMatrixAt(i, _m); _v.setFromMatrixPosition(_m); const k = WB ? WB(_v) : Math.floor(_v.x / cs) + ',' + Math.floor(_v.z / cs); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(i); }
    if (cells.size < 2 || cells.size > (WB ? 60 : MAXC)) return false;
    for (const ids of cells.values()) {
      const g2 = new T3.BufferGeometry(); g2.index = geo.index; for (const a in geo.attributes) g2.setAttribute(a, geo.attributes[a]); for (const gr of geo.groups) g2.addGroup(gr.start, gr.count, gr.materialIndex);
      const ch = new T3.InstancedMesh(g2, im.material, ids.length), box = new T3.Box3(); let rMax = 0;
      ids.forEach((i, j) => { im.getMatrixAt(i, _m); ch.setMatrixAt(j, _m); if (im.instanceColor) { const c = new T3.Color(); im.getColorAt(i, c); ch.setColorAt(j, c); }
        _v.copy(gs.center).applyMatrix4(_m); box.expandByPoint(_v); rMax = Math.max(rMax, gs.radius * _m.getMaxScaleOnAxis()); });
      const sp = new T3.Sphere(); box.getBoundingSphere(sp); sp.radius += rMax; g2.boundingSphere = sp;
      ch.castShadow = im.castShadow; ch.receiveShadow = im.receiveShadow; ch.renderOrder = im.renderOrder; ch.frustumCulled = true; ch.userData.cullChunk = 1; tagW(ch, k0(cells, ids)); im.add(ch);
    }
    im.userData.cullSplit = geo; im.layers.mask = 0; return true;   // l original n est plus dessine (calque retire ; sa geometrie reste intacte : une geometrie vide sur un objet repete dereglait le dessin du suivant)
  }

  // --- un gros maillage fusionne -> des morceaux par case de 200 m (triangles ranges par leur centre)
  function splitMesh(m) {
    const geo = m.geometry, pos = geo.attributes.position; if (!pos || Array.isArray(m.material) || geo.groups.length > 1 || geo.morphAttributes.position) return false;
    const idx = geo.index ? geo.index.array : null, nT = (idx ? idx.length : pos.count) / 3, cells = new Map(), P = pos.array, isz = pos.itemSize;
    if (pos.isInterleavedBufferAttribute) return false;
    if (!geo.boundingBox) geo.computeBoundingBox(); const cs = cellOf(geo.boundingBox), WB = wBand(m);
    for (let t = 0; t < nT; t++) { let x = 0, y = 0, z = 0; for (let k = 0; k < 3; k++) { const v = idx ? idx[t * 3 + k] : t * 3 + k; x += P[v * isz]; y += P[v * isz + 1]; z += P[v * isz + 2]; }
      const key = WB ? WB(_v.set(x / 3, y / 3, z / 3)) : Math.floor(x / 3 / cs) + ',' + Math.floor(z / 3 / cs); let c = cells.get(key); if (!c) cells.set(key, c = []); c.push(t); }
    if (cells.size < 2 || cells.size > (WB ? 60 : MAXC)) return false;
    const names = Object.keys(geo.attributes);
    for (const [key, tris] of cells) {
      const remap = new Map(), vs = []; const ni = new (pos.count > 65535 ? Uint32Array : Uint16Array)(tris.length * 3); let o = 0;
      for (const t of tris) for (let k = 0; k < 3; k++) { const v = idx ? idx[t * 3 + k] : t * 3 + k; let r = remap.get(v); if (r === undefined) { r = vs.length; remap.set(v, r); vs.push(v); } ni[o++] = r; }
      const g2 = new T3.BufferGeometry();
      for (const a of names) { const A = geo.attributes[a]; if (A.isInterleavedBufferAttribute) return false; const s = A.itemSize, arr = new A.array.constructor(vs.length * s); for (let j = 0; j < vs.length; j++) for (let q = 0; q < s; q++) arr[j * s + q] = A.array[vs[j] * s + q]; g2.setAttribute(a, new T3.BufferAttribute(arr, s, A.normalized)); }
      g2.setIndex(new T3.BufferAttribute(vs.length > 65535 ? new Uint32Array(ni) : ni, 1)); g2.computeBoundingSphere();
      const ch = new T3.Mesh(g2, m.material); ch.castShadow = m.castShadow; ch.receiveShadow = m.receiveShadow; ch.renderOrder = m.renderOrder; ch.frustumCulled = true; ch.userData.cullChunk = 1; tagW(ch, key); m.add(ch);
    }
    m.userData.cullSplit = geo; m.layers.mask = 0; return true;
  }

  function optimize(L) {
    curL = L;
    const skip = new Set(); for (const A of (L.AV || [])) for (const k in A) if (A[k] && A[k].isInstancedMesh) skip.add(A[k]);
    const big = []; L.grp.traverse((o) => { if (!o.isMesh || o.userData.cullChunk || o.userData.cullSplit || skip.has(o) || o.isSkinnedMesh) return; if (o.material && (o.material.isShaderMaterial || (Array.isArray(o.material)))) return;
      const t = triOf(o.geometry) * (o.isInstancedMesh ? o.count : 1); if (o.isInstancedMesh ? t > MIN_INST_TRI && o.count > 8 : t > MIN_MESH_TRI) big.push(o); });
    let n = 0; for (const o of big) { try { if (o.isInstancedMesh ? splitInst(o) : splitMesh(o)) n++; } catch (e) { /* on laisse l objet tel quel */ } }
    // la liste des petits objets a surveiller
    const small = []; L.grp.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || o.userData.cullSplit) return; if (o.frustumCulled === false) return; const geo = o.geometry; if (!geo) return; if (!geo.boundingSphere) geo.computeBoundingSphere(); if (!geo.boundingSphere || geo.boundingSphere.radius <= 0) return; small.push(o); });
    return { split: n, small };
  }

  // un objet de moins d'un pixel n'est pas dessine (calque 0 retire) ; il revient au-dessus d'un pixel
  function smallCull(g, S) {
    const cam = g.camera, L = S.small, N = L.length; if (!N) return; g.renderer.getDrawingBufferSize(_sz);
    const k = _sz.y / (cam.fov * Math.PI / 180), cp = _cp.setFromMatrixPosition(cam.matrixWorld), per = Math.min(N, 400);   // position MONDE de la camera (elle peut etre portee par un autre objet)
    for (let j = 0; j < per; j++) { const o = L[S.i = (S.i + 1) % N]; if (!o.parent) continue; _s.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      const d = Math.max(1, _s.center.distanceTo(cp) - _s.radius), px = 2 * _s.radius / d * k, hid = o.layers.mask === 0;
      if (!hid && px < 0.25) { o.userData.cullMask = o.layers.mask; o.layers.mask = 0; } else if (hid && px > 0.4) o.layers.mask = o.userData.cullMask || 1; }
  }

  EVO.cullOn = !/[?&]nocull=1/.test(location.search);   // ?nocull=1 : comparaison avant / apres au banc
  // banc : remettre l'etat d'origine (false) ou l'etat optimise (true) sur la meme image, pour comparer pixel a pixel
  EVO.cullSet = (on, only) => { if (!st || !st.L) return; if (only !== 'small') st.L.grp.traverse((o) => { if (o.userData.cullSplit) { o.layers.mask = on ? 0 : 1; for (const c of o.children) if (c.userData.cullChunk) { if (on) { if (c.userData.vis0 !== undefined) { c.visible = c.userData.vis0; delete c.userData.vis0; } } else { if (c.userData.vis0 === undefined) c.userData.vis0 = c.visible; c.visible = false; } } } });
    if (only !== 'split') for (const o of st.small) { if (!on) { if (o.userData.mask0 === undefined) o.userData.mask0 = o.layers.mask; if (o.layers.mask === 0) o.layers.mask = o.userData.cullMask || 1; } else if (o.userData.mask0 !== undefined) { o.layers.mask = o.userData.mask0; delete o.userData.mask0; } } };
  const _tk = EVO.tick;
  EVO.tick = (g, dt) => {
    _tk(g, dt);
    const L = cur(); if (!EVO.cullOn || !L || !L.grp) { st = null; return; }
    if (!st || st.L !== L) { st = { L, i: 0 }; try { const r = optimize(L); st.small = r.small; st.split = r.split; EVO.cullStat = { split: r.split, small: r.small.length }; } catch (e) { st.small = []; } }
    if (st.wChunks && L.cullW) { const C = L.cullW, wn = C.now(), hide = wn < C.until; for (const ch of st.wChunks) ch.visible = !(hide && ch.userData.wMin >= C.hideFrom); }
    smallCull(g, st);
  };
})();
