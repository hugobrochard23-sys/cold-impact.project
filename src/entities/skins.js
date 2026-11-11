/* Boutique : cosmétiques de la roquette (CHOIX v007).
 * Apparences inspirées de gros engins historiques, mais renommées (aucun nom réel repris) + cinq fantaisies.
 * Chaque fiche est purement déclarative : couleurs, dimensions et pièces rapportées lues par CC.Models.rocket().
 * Prix en centimes d'euro (pas de flottants dans la sauvegarde). */
(function () {
  const TIER_LABEL = { base: 'STOCK', common: 'COMMUN', rare: 'RARE', ultra: 'ULTRA RARE' };

  // Aides de construction de pièces rapportées (repère local : +Z = nez, x/y = travers).
  const cyl = (r, h, p, o) => Object.assign({ k: 'cyl', r, h, p, rot: [90, 0, 0] }, o || {});
  const box = (w, h, d, p, o) => Object.assign({ k: 'box', w, h, d, p }, o || {});
  const sph = (r, p, o) => Object.assign({ k: 'sph', r, p }, o || {});

  const list = [    { id: 'stock', name: 'STOCK', short: 'STOCK', tier: 'base', tagline: "L'originale, telle qu'elle sort de l'atelier.",
      c: { body: '#c4c6c9', nose: '#c4c6c9', tip: '#e02a1c', band: '#f3cf00', fin: '#5d6065', nozzle: '#3d3f43' },
    },
    {
      id: 'gamin', name: 'LE GAMIN', short: 'GAMIN', tier: 'common', tagline: 'Petit, trapu, beaucoup plus mechant qu\'il n\'en a l\'air.',
      c: { body: '#6f6a4e', nose: '#5d5a44', tip: '#c8c8c0', band: '#3f4034', fin: '#4b5039', nozzle: '#2c2d26' },
      dims: { r: 0.105, len: 0.72, noseLen: 0.2, noseR: 0.055 },
      parts: [box(0.03, 0.03, 0.16, [0, 0.1, -0.06], { c: '#8a8468' }), box(0.03, 0.03, 0.16, [0, -0.1, -0.06], { c: '#8a8468' })],
    },
    {
      id: 'bedon', name: 'MONSIEUR BEDON', short: 'BEDON', tier: 'common', tagline: 'Il ne rentre dans aucun silo. Il le sait.',
      c: { body: '#b6a86a', nose: '#a89a5e', tip: '#c8c8c0', band: '#2f2f2f', fin: '#8a8348', nozzle: '#3a3a30' },
      dims: { r: 0.17, len: 0.6, noseLen: 0.16, noseR: 0.085 },
      parts: [cyl(0.172, 0.06, [0, 0, -0.12], { c: '#8f8347' }), cyl(0.172, 0.06, [0, 0, 0.12], { c: '#8f8347' })],
    },
    {
      id: 'fuseev', name: 'FUSEE V', short: 'FUSEE V', tier: 'common', tagline: 'Ca monte tres haut. Ca redescend beaucoup moins bien.',
      c: { body: '#cfd0c6', nose: '#cfd0c6', tip: '#2a2a2a', band: '#4b5142', fin: '#3b3f36', nozzle: '#2e2f28' },
      dims: { r: 0.105, len: 0.9, noseLen: 0.34, fins: 4, finH: 0.3, finW: 0.028 },
      parts: [box(0.09, 0.22, 0.24, [0.09, 0.02, -0.18], { c: '#7d8a5e', cast: false }), box(0.09, 0.2, 0.3, [-0.09, -0.03, 0.02], { c: '#5a6446', cast: false }),
        box(0.085, 0.18, 0.2, [0.08, -0.05, 0.2], { c: '#7d8a5e', cast: false })],
    },
    {
      id: 'minutemec', name: 'MINUTEMEC', short: 'MINUTEMEC', tier: 'common', tagline: "Pret en une minute, comme son nom l'indique.",
      c: { body: '#e8e8e4', nose: '#d8d8d4', tip: '#8a8a86', band: '#c8202a', fin: '#b8b8b4', nozzle: '#4a4a48' },
      dims: { r: 0.09, len: 0.95, noseLen: 0.36, fins: 4, finH: 0.24, finW: 0.024 },
      parts: [cyl(0.092, 0.05, [0, 0, 0.2], { c: '#c8202a' }), cyl(0.092, 0.035, [0, 0, -0.2], { c: '#c8202a' })],
    },
    {
      id: 'hachette', name: 'HACHETTE VOLANTE', short: 'HACHETTE', tier: 'common', tagline: 'Elle rase les toits, les radars et les moustaches.',
      c: { body: '#c9ccd2', nose: '#e4e4e2', tip: '#3a3a3c', band: '#9aa0a8', fin: '#8e9299', nozzle: '#43464b' },
      dims: { r: 0.105, len: 1.0, noseLen: 0.26, fins: 3, finH: 0.2 },
      parts: [box(0.42, 0.02, 0.15, [0, 0, 0.05], { c: '#a8adb5' }), box(0.02, 0.42, 0.15, [0, 0, 0.05], { c: '#a8adb5' }),
        cyl(0.075, 0.14, [0, 0, -0.42], { c: '#6f7378' })],
    },
    {
      id: 'croquette', name: 'CROQUETTE', short: 'CROQUETTE', tier: 'common', tagline: 'Petit calibre, gros effet de surprise.',
      c: { body: '#4f5a3c', nose: '#465033', tip: '#d8c040', band: '#2f3626', fin: '#3a4430', nozzle: '#262c1e' },
      dims: { r: 0.085, len: 0.5, noseLen: 0.2, scale: 0.9 },
      parts: [cyl(0.09, 0.03, [0, 0, -0.06], { c: '#6b7849' })],
    },
    {
      id: 'baguette', name: 'BAGUETTE', short: 'BAGUETTE', tier: 'common', tagline: "L'arme la plus francaise de l'arsenal. Croustillante a l'impact.",
      c: { body: '#d8a862', nose: '#c99a54', tip: '#e8c890', band: '#a87838', fin: '#c99a54', nozzle: '#8a6028' },
      dims: { r: 0.085, len: 1.2, noseLen: 0.24, noseR: 0.05, fins: 0 },
      parts: [box(0.14, 0.02, 0.22, [0, 0, 0.3], { c: '#a87838', rot: [0, 0, 35] }), box(0.14, 0.02, 0.22, [0, 0, 0.05], { c: '#a87838', rot: [0, 0, 35] }),
        box(0.14, 0.02, 0.22, [0, 0, -0.2], { c: '#a87838', rot: [0, 0, 35] }), box(0.14, 0.02, 0.22, [0, 0, -0.42], { c: '#a87838', rot: [0, 0, 35] })],
      flame: '#ffb040',
    },
    {
      id: 'tridentin', name: 'TRIDENTIN', short: 'TRIDENTIN', tier: 'rare', tagline: 'Trois tetes, zero regret. Il sort de l\'eau sans prevenir.',
      c: { body: '#2b3446', nose: '#8f98a6', tip: '#d8d8d8', band: '#c8c8c0', fin: '#3a4658', nozzle: '#20262f' },
      dims: { r: 0.1, len: 1.05, noseLen: 0.4, fins: 4, finH: 0.22 },
      parts: [cyl(0.103, 0.04, [0, 0, 0.25], { c: '#c8c8c0' }), cyl(0.103, 0.04, [0, 0, -0.25], { c: '#c8c8c0' }),
        box(0.05, 0.05, 0.3, [0, 0.11, -0.05], { c: '#1f2836' })],
    },
    {
      id: 'poisson', name: 'POISSON VOLANT', short: 'POISSON', tier: 'rare', tagline: 'Il arrive au ras des vagues, et repart sans dire au revoir.',
      c: { body: '#dfe6ea', nose: '#9fb6c4', tip: '#2f4a5a', band: '#4f6f82', fin: '#4f6f82', nozzle: '#7d8f9a' },
      dims: { r: 0.1, len: 0.92, noseLen: 0.2, fins: 4, finH: 0.18 },
      parts: [box(0.34, 0.02, 0.14, [0, 0, 0.05], { c: '#b9ccd6' }), box(0.02, 0.34, 0.14, [0, 0, 0.05], { c: '#b9ccd6' }),
        cyl(0.055, 0.18, [0, 0, -0.34], { c: '#8fa3ad' })],
      flame: '#bfe2ff',
    },
    {
      id: 'gardien', name: 'GARDIEN DE PAIX', short: 'GARDIEN', tier: 'rare', tagline: 'Ironique depuis sa mise en service.',
      c: { body: '#d2d2cc', nose: '#c0c0ba', tip: '#5a5a56', band: '#2a2a2a', fin: '#7a7a76', nozzle: '#4c4c48' },
      dims: { r: 0.098, len: 1.1, noseLen: 0.34, fins: 4, finH: 0.26 },
      parts: [cyl(0.1, 0.03, [0, 0, 0.18], { c: '#2a2a2a' }), cyl(0.1, 0.03, [0, 0, -0.05], { c: '#2a2a2a' }),
        cyl(0.1, 0.03, [0, 0, -0.28], { c: '#2a2a2a' })],
    },
    {
      id: 'titanite', name: 'TITANITE', short: 'TITANITE', tier: 'rare', tagline: 'Grand, brillant, et ruineux a mettre sur orbite.',
      c: { body: '#c0c4c8', nose: '#e0e2e4', tip: '#c0201c', band: '#d4af37', fin: '#8a8e92', nozzle: '#4a4d50' },
      dims: { r: 0.1, len: 1.1, noseLen: 0.42, fins: 4, finH: 0.24 },
      parts: [cyl(0.103, 0.05, [0, 0, -0.3], { c: '#d4af37' }), cyl(0.103, 0.04, [0, 0, -0.02], { c: '#9aa0a4' })],
    },
    {
      id: 'satanette', name: 'SATANETTE', short: 'SATANETTE', tier: 'rare', tagline: 'Elle porte bien son nom. Ne la reveillez surtout pas.',
      c: { body: '#1a1a1e', nose: '#26262c', tip: '#ff2a1a', band: '#c8202a', fin: '#2a1a1c', nozzle: '#111114' },
      dims: { r: 0.105, len: 1.05, noseLen: 0.36, fins: 4, finH: 0.28 },
      parts: [cyl(0.107, 0.04, [0, 0, 0.2], { c: '#c8202a' }), cyl(0.107, 0.04, [0, 0, -0.2], { c: '#c8202a' }),
        box(0.03, 0.03, 0.5, [0.1, 0, -0.05], { c: '#8a1a1a' })],
    },
    {
      id: 'berthe', name: 'GROSSE BERTHE', short: 'BERTHE', tier: 'rare', tagline: 'Grosse, lente, et de tres mauvaise humeur.',
      c: { body: '#7a6a4a', nose: '#6a5c40', tip: '#4a4030', band: '#3f5a3a', fin: '#5e5238', nozzle: '#3a3226' },
      dims: { r: 0.16, len: 0.7, noseLen: 0.22, noseR: 0.07, fins: 4, finH: 0.3, finW: 0.03 },
      parts: [cyl(0.166, 0.07, [0, 0, -0.1], { c: '#5e5238' }), cyl(0.04, 0.36, [0, 0.16, 0.05], { rot: [0, 0, 0], c: '#4a4030' })],
    },
    {
      id: 'croissant', name: 'CROISSANT', short: 'CROISSANT', tier: 'rare', tagline: 'Pur beurre, pur chaos. Les miettes retombent en pluie fine.',
      c: { body: '#e0a44a', nose: '#d0903a', tip: '#f0d090', band: '#b07428', fin: '#c98c3c', nozzle: '#8a5c20' },
      dims: { r: 0.11, len: 0.8, noseLen: 0.2, noseR: 0.04, fins: 0 },
      parts: [box(0.2, 0.06, 0.18, [0.06, 0.02, 0.22], { c: '#d0903a', rot: [0, 0, 20] }), box(0.22, 0.06, 0.18, [0.08, 0.0, 0.0], { c: '#e8b05a', rot: [0, 0, 30] }),
        box(0.2, 0.06, 0.18, [0.06, -0.02, -0.22], { c: '#d0903a', rot: [0, 0, 40] }), box(0.16, 0.05, 0.14, [0.14, 0.02, 0.1], { c: '#f0c070', rot: [0, 0, 25] })],
      flame: '#ffcf60',
    },
    {
      id: 'chaton', name: 'CHATON', short: 'CHATON', tier: 'rare', tagline: 'Miaou. Portee utile : quatre mille kilometres.',
      c: { body: '#a8a8a8', nose: '#9a9a9a', tip: '#f0a0b0', band: '#8a8a8a', fin: '#7d7d7d', nozzle: '#5a5a5a' },
      dims: { r: 0.12, len: 0.7, noseLen: 0.18, noseR: 0.045, fins: 0 },
      parts: [sph(0.09, [0, 0, 0.42], { c: '#b4b4b4' }),
        cyl(0.0, 0.16, [0.07, 0.15, 0.36], { r2: 0.055, rot: [12, 0, 0], c: '#9a9a9a' }), cyl(0.0, 0.16, [-0.07, 0.15, 0.36], { r2: 0.055, rot: [12, 0, 0], c: '#9a9a9a' }),
        cyl(0.022, 0.42, [0, 0.1, -0.42], { rot: [70, 0, 0], c: '#9a9a9a' }),
        box(0.02, 0.02, 0.06, [0.08, 0.06, 0.47], { c: '#1a1a1a', basic: true }), box(0.02, 0.02, 0.06, [-0.08, 0.06, 0.47], { c: '#1a1a1a', basic: true }),
        box(0.16, 0.008, 0.008, [0.1, -0.02, 0.5], { c: '#e8e8e8', basic: true }), box(0.16, 0.008, 0.008, [-0.1, -0.02, 0.5], { c: '#e8e8e8', basic: true })],
    },
    {
      id: 'tsarini', name: 'TSARINI', short: 'TSARINI', tier: 'ultra', tagline: 'La plus grosse jamais larguee. Et de tres loin la plus mal elevee.',
      c: { body: '#e4e6e8', nose: '#d0d2d4', tip: '#c0201c', band: '#c8c8c0', fin: '#9a9a96', nozzle: '#5a5c5e' },
      dims: { r: 0.15, len: 0.8, noseLen: 0.22, noseR: 0.07, scale: 1.12 },
      parts: [cyl(0.19, 0.06, [0, 0, 0.2], { c: '#c8c8c0' }), cyl(0.19, 0.06, [0, 0, -0.2], { c: '#c8c8c0' }),
        box(0.1, 0.03, 0.5, [0, 0.16, 0], { c: '#9a9a96' })],
      flame: '#ffd0a0',
    },
    {
      id: 'maman', name: 'MAMAN DES BOMBES', short: 'MAMAN', tier: 'ultra', tagline: 'Pour etre absolument certain de ne pas rater la cible.',
      c: { body: '#8a8478', nose: '#7d776c', tip: '#c8c4b8', band: '#e8e4d8', fin: '#5a5648', nozzle: '#43403a' },
      dims: { r: 0.18, len: 0.78, noseLen: 0.26, noseR: 0.1, scale: 1.05 },
      parts: [cyl(0.184, 0.04, [0, 0, 0.16], { c: '#e8e4d8' }), cyl(0.184, 0.04, [0, 0, -0.05], { c: '#e8e4d8' })],
    },
    {
      id: 'bombeh', name: 'BOMBE H', short: 'BOMBE H', tier: 'ultra', tagline: "Ce n'est pas une bombe, c'est une etoile de courte duree.",
      c: { body: '#d8dce0', nose: '#c4c8cc', tip: '#40e0ff', band: '#40e0ff', fin: '#98a0a6', nozzle: '#5a5e62' },
      dims: { r: 0.11, len: 0.98, noseLen: 0.34, fins: 4, finH: 0.22 },
      parts: [cyl(0.113, 0.045, [0, 0, 0.16], { c: '#40e0ff', basic: true, cast: false }),
        cyl(0.113, 0.045, [0, 0, -0.06], { c: '#40e0ff', basic: true, cast: false }),
        cyl(0.113, 0.045, [0, 0, -0.28], { c: '#40e0ff', basic: true, cast: false })],
      flame: '#8feaff',
    },
    {
      id: 'colis', name: 'COLIS EXPRESS', short: 'COLIS', tier: 'ultra', tagline: 'Livre en quarante-huit heures, sans signature.',
      c: { body: '#c49a62', nose: '#b8874c', tip: '#c0201c', band: '#9a6a34', fin: '#b8874c', nozzle: '#7a5626' },
      dims: { r: 0.13, len: 0.8, noseLen: 0.2, noseR: 0.06, fins: 4, finW: 0.028 },
      parts: [box(0.06, 0.14, 0.3, [0, 0, -0.02], { c: '#9a6a34' }), box(0.16, 0.02, 0.24, [0, 0.12, 0.06], { c: '#e8e0d0' }),
        box(0.14, 0.08, 0.02, [0, -0.1, 0.2], { c: '#e8e0d0' })],
    },
    {
      id: 'caillou', name: 'CAILLOU', short: 'CAILLOU', tier: 'ultra', tagline: "C'est un caillou. Il tombe tres bien, et c'est tout ce qu'on lui demande.",
      c: { body: '#7a7d82', nose: '#7a7d82', tip: '#a04a3a', band: '#6a6d72', fin: '#7a7d82', nozzle: '#5c5f63' },
      dims: { r: 0.13, len: 0.6, noseLen: 0.02, noseR: 0.1, fins: 0 },
      parts: [sph(0.14, [0.02, 0.03, 0.1], { c: '#86898e' }), sph(0.12, [-0.05, -0.02, -0.14], { c: '#6e7176' }),
        box(0.16, 0.14, 0.16, [0.05, -0.05, -0.05], { rot: [12, 30, 6], c: '#83868b' })],
      flame: '#b8b8b8',
    },
    // ---- v380 : skins a caractere (silhouette forte vue de derriere : aileron, chapeau, cornes, casquette)
    {
      id: 'requin', name: 'REQUIN', short: 'REQUIN', tier: 'rare', tagline: 'On ne l\'entend pas arriver. Il a deja mange le concurrent.',
      c: { body: '#6f8ea3', nose: '#6f8ea3', tip: '#2a3a46', band: '#e8f0f4', fin: '#4f6f84', nozzle: '#3a4650' },
      dims: { r: 0.105, len: 0.92, noseLen: 0.22, fins: 0 },
      parts: [box(0.03, 0.2, 0.24, [0, 0.16, -0.04], { c: '#557489', rot: [-28, 0, 0] }), box(0.22, 0.022, 0.13, [0.15, -0.03, 0.08], { c: '#557489', rot: [0, 0, -18], mir: true }),
        box(0.03, 0.2, 0.15, [0, 0.12, -0.46], { c: '#557489', rot: [32, 0, 0] }), box(0.03, 0.14, 0.14, [0, -0.1, -0.46], { c: '#557489', rot: [-32, 0, 0] }),
        box(0.17, 0.04, 0.05, [0, -0.066, 0.45], { c: '#1b1016' }), box(0.15, 0.028, 0.05, [0, -0.052, 0.47], { c: '#ffffff', basic: true }),
        sph(0.03, [0.085, 0.045, 0.34], { c: '#ffffff', basic: true, mir: true }), sph(0.015, [0.1, 0.045, 0.37], { c: '#101010', basic: true, mir: true })],
      flame: '#9fe3ff',
    },
    {
      id: 'pirate', name: 'PIRATE', short: 'PIRATE', tier: 'rare', tagline: 'Il ne rend jamais le butin, ni les points.',
      c: { body: '#a8322a', nose: '#e8dcc0', tip: '#15151a', band: '#15151a', fin: '#2b2b30', nozzle: '#3a3a40' },
      dims: { r: 0.105, len: 0.9, noseLen: 0.28, fins: 4, finH: 0.2 },
      parts: [cyl(0.17, 0.02, [0, 0.118, 0.1], { c: '#15151a', rot: [0, 0, 0] }), cyl(0.082, 0.07, [0, 0.158, 0.1], { c: '#15151a', rot: [0, 0, 0], r2: 0.064 }), cyl(0.172, 0.018, [0, 0.11, 0.1], { c: '#e8c24a', rot: [0, 0, 0] }),
        sph(0.022, [0, 0.168, 0.168], { c: '#ffffff', basic: true }), box(0.07, 0.07, 0.02, [0.086, 0.04, 0.34], { c: '#111111', rot: [0, 0, 0], mir: false }),
        cyl(0.006, 0.26, [0, 0.2, -0.3], { c: '#6b4a2a', rot: [0, 0, 0] }), box(0.004, 0.09, 0.14, [0, 0.29, -0.37], { c: '#111111', basic: true }), sph(0.016, [0, 0.29, -0.37], { c: '#ffffff', basic: true })],
      flame: '#ffb347',
    },
    {
      id: 'malicieuse', name: 'MALICIEUSE', short: 'MALICIEUSE', tier: 'rare', tagline: 'Elle a l\'air gentille. Elle ne l\'est pas.',
      c: { body: '#7b3fbf', nose: '#7b3fbf', tip: '#ffd23a', band: '#ffd23a', fin: '#2a1744', nozzle: '#2a1744' },
      dims: { r: 0.105, len: 0.88, noseLen: 0.26, fins: 4, finH: 0.2 },
      parts: [cyl(0.032, 0.15, [0.055, 0.15, 0.22], { c: '#ffd23a', r2: 0.002, rot: [-12, 0, -20], mir: true }),
        box(0.14, 0.026, 0.03, [0, -0.07, 0.42], { c: '#ffffff', basic: true }), box(0.15, 0.02, 0.025, [0, -0.09, 0.42], { c: '#17081f' }),
        box(0.05, 0.02, 0.02, [0.07, 0.055, 0.34], { c: '#ffffff', basic: true, rot: [0, 0, -28], mir: true }), sph(0.012, [0.074, 0.05, 0.352], { c: '#101010', basic: true, mir: true }),
        box(0.02, 0.1, 0.12, [0.03, 0.03, -0.5], { c: '#ffd23a', rot: [0, 0, -24], mir: true })],
      flame: '#d58cff',
    },
    {
      id: 'casquette', name: 'CASQUETTE', short: 'CASQUETTE', tier: 'rare', tagline: 'Visiere vers l\'avant, comme un champion.',
      c: { body: '#2f6fd8', nose: '#e8e8ef', tip: '#d42a2a', band: '#d42a2a', fin: '#1f4aa0', nozzle: '#26406e' },
      dims: { r: 0.105, len: 0.9, noseLen: 0.28, fins: 4, finH: 0.2 },
      parts: [sph(0.112, [0, 0.082, 0.12], { c: '#d42a2a', seg: 12, s: [1, 0.72, 1.12] }), box(0.2, 0.014, 0.15, [0, 0.092, 0.285], { c: '#d42a2a', rot: [10, 0, 0] }),
        sph(0.02, [0, 0.165, 0.12], { c: '#ffffff' }), box(0.05, 0.05, 0.012, [0, 0.1, 0.225], { c: '#ffffff', basic: true })],
      flame: '#ff9a7a',
    },
  ];

  const byId = {};
  for (const s of list) {
    s.price = s.tier === 'base' ? 0 : CC.CONFIG.shop.priceCents;   // v031 : prix unique (l'ancienne grille PRICE ne sert plus)
    s.tierLabel = TIER_LABEL[s.tier] || 'COMMUN';
    s.c = Object.assign({ body: '#c4c6c9', nose: '#c4c6c9', tip: '#e02a1c', band: '#f3cf00', fin: '#5d6065', nozzle: '#3d3f43' }, s.c);
    s.dims = Object.assign({ r: 0.1, len: 0.86, noseLen: 0.3, noseR: 0.012, fins: 4, finH: 0.2, finW: 0.02, finPos: -0.33, scale: 1 }, s.dims || {});
    s.flame = s.flame || '#ff8a2a';
    byId[s.id] = s;
  }

  CC.Skins = {
    list,
    byId,
    get(id) { return byId[id] || byId.stock; },
    // "2,99 €" (format français, comme le reste de l'interface)
    formatPrice(cents) { return Math.floor(cents / 100) + ',' + String(Math.round(cents % 100)).padStart(2, '0') + ' EUR'; },
  };
})();
