/* COLD IMPACT : recevoir les mesures dans un Google Sheet (gratuit, sans serveur).
 * 1. Cree un Google Sheet, puis Extensions > Apps Script, colle ce fichier.
 * 2. Deployer > Nouveau deploiement > Application Web : executer en tant que "moi", acces "tout le monde".
 * 3. Copie l'adresse (se termine par /exec) dans adcfg.json : { "from":5, "every":2, "gap":90, "stats":"https://script.google.com/macros/s/.../exec" }
 *    puis pousse adcfg.json sur GitHub. Les appareils la lisent a leur prochain lancement.
 * Colonnes : date | joueur | evenement | session | donnees (json). */
function doPost(e) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  try {
    var b = JSON.parse(e.postData.contents), rows = [];
    for (var i = 0; i < b.ev.length; i++) {
      var ev = b.ev[i], n = ev.n, t = ev.t, s = ev.s;
      delete ev.n; delete ev.t; delete ev.s;
      rows.push([new Date(t), b.id, n, s, JSON.stringify(ev)]);
    }
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
  } catch (err) { }
  return ContentService.createTextOutput('ok');
}
