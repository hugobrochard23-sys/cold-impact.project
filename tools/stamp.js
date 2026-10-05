// À lancer avant chaque publication : écrit un nouveau numéro de version dans version.json (index.html le lit pour contourner le cache du navigateur).
const fs = require('fs'), d = new Date(), p = (n) => String(n).padStart(2, '0');
fs.writeFileSync(require('path').join(__dirname, '..', 'version.json'), JSON.stringify({ v: '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) }));
