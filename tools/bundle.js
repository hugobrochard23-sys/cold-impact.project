/* v338 : groupe tous les scripts du jeu en UN seul fichier (game.bundle.js) et ecrit une page qui le charge.
 * But : l'appli Android servait ~190 fichiers un par un (document.write, bloquant) : chargement tres lent. Un seul fichier = un seul acces.
 * Usage : node tools/bundle.js <dossier_du_jeu> [nom_page=index.html] */
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || '.'), page = process.argv[3] || 'index.html';
let h = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const m = h.match(/var L = \[([\s\S]*?)\];/); if (!m) throw new Error('liste des scripts introuvable');
const L = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
let out = '';
for (const f of L) { const p = path.join(dir, f); if (!fs.existsSync(p)) throw new Error('manquant : ' + f); out += '\n/* ' + f + ' */\n' + fs.readFileSync(p, 'utf8') + '\n;'; }
fs.writeFileSync(path.join(dir, 'game.bundle.js'), out);
h = h.replace(/for \(var i = 0; i < L\.length; i\+\+\) document\.write\([^\n]*\n/, "document.write('<scr' + 'ipt src=\"game.bundle.js' + V + '\"></scr' + 'ipt>');\n");
if (!/game\.bundle\.js/.test(h)) throw new Error('boucle de chargement non remplacee');
fs.writeFileSync(path.join(dir, page), h);
console.log('bundle', L.length, 'fichiers,', (out.length / 1e6).toFixed(2), 'Mo ->', page);
