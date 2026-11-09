/* v339 : paquet pour un portail de jeux web. Usage : node tools/portal_build.js <playgama|poki|crazygames|test>
 * Sortie : dist/portal-<id>/ (le jeu, un seul game.bundle.js, sans polices Google ni version.json) et dist/COLD_IMPACT_<id>.zip (index.html a la racine).
 * La page declare window.CC_PORTAL = '<id>' : le mode portail de src/systems/portal.js s'active (vraies pubs du portail, aucun achat, aucune statistique envoyee). */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const id = (process.argv[2] || '').toLowerCase();
if (!/^(playgama|poki|crazygames|gamedistribution|gamemonetize|test)$/.test(id)) { console.error('Usage : node tools/portal_build.js <playgama|poki|crazygames|gamedistribution|gamemonetize|test> [gameId]'); process.exit(1); }
const MVP = /^[abc]$/.test(process.env.MVP || '') ? process.env.MVP : '', sfx = MVP ? '_mvp' + MVP : '';   // v362 : MVP=a|b|c node tools/portal_build.js playgama -> paquet d'un MVP de niveau court
const root = path.resolve(__dirname, '..'), out = path.join(root, 'dist', 'portal-' + id + sfx);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'style.css', 'game.js']) if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ['src', 'assets']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true, filter: (p) => !/[\\/]_spare([\\/]|$)/.test(p) });
let h = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
h = h.replace(/<link rel="preconnect" href="https:\/\/fonts[^>]*>/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '');   // aucune requete externe
h = h.replace(/<script>\(function \(\) \{ var V = ''; try \{ var x = new XMLHttpRequest\(\); x\.open\('GET', 'version\.json[^\n]*\n/, "<link rel=\"stylesheet\" href=\"style.css\">\n  <script>var V = '';</script>\n");   // plus de version.json (requete synchrone) ; la feuille de style se charge normalement
const gdTag = '<script>window["GD_OPTIONS"] = { gameId: ' + JSON.stringify(process.argv[3] || '00000000000000000000000000000000') + ', onEvent: function (e) { try { if (window.CC_GD) window.CC_GD(e); } catch (x) {} } };</script>\n  <script src="https://html5.api.gamedistribution.com/main.min.js" id="gamedistribution-jssdk"></script>';
const gmTag = '<script>window.SDK_OPTIONS = { gameId: ' + JSON.stringify(process.argv[3] || '00000000000000000000000000000000') + ', onEvent: function (a) { try { if (window.CC_GM) window.CC_GM(a); } catch (x) {} } };</script>\n  <script>(function (a, b, c) { var d = a.getElementsByTagName(b)[0]; a.getElementById(c) || (a = a.createElement(b), a.id = c, a.src = "https://api.gamemonetize.com/sdk.js", d.parentNode.insertBefore(a, d)); })(document, "script", "gamemonetize-sdk");</script>';
const sdk = { playgama: '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>', poki: '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>', crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>', gamedistribution: gdTag, gamemonetize: gmTag, test: '' }[id];
h = h.replace(/    try \{ var x = new XMLHttpRequest\(\); x\.open\('GET', 'version\.json[^\n]*\n/, '');   // 2e lecture de version.json (liste des scripts) : retiree aussi
h = h.replace('<head>','<head>\n  <script>window.CC_PORTAL=' + JSON.stringify(id) + ';' + (MVP ? 'window.CC_MVP=' + JSON.stringify(MVP) + ';' : '') + '</script>' + (sdk ? '\n  ' + sdk : ''));
fs.writeFileSync(path.join(out, 'index.html'), h);
execFileSync(process.execPath, [path.join(root, 'tools', 'bundle.js'), out, 'index.html'], { stdio: 'inherit' });
// le bundle contient tous les scripts : on retire les .js sources du paquet (il n'y a pas d'autre fichier dans src)
const strip = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { strip(p); try { fs.rmdirSync(p); } catch (x) { /* non vide */ } } else if (/\.js$/.test(e.name)) fs.unlinkSync(p); } };
strip(path.join(out, 'src')); try { fs.rmdirSync(path.join(out, 'src')); } catch (x) { /* non vide : on le garde */ }
if (id === 'playgama') fs.writeFileSync(path.join(out, 'playgama-bridge-config.json'), '{}\n');
let n = 0, bytes = 0; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { n++; bytes += fs.statSync(p).size; } } }; walk(out);
const zip = path.join(root, 'dist', 'COLD_IMPACT_' + id + sfx + '.zip'); fs.rmSync(zip, { force: true });
execFileSync('python', ['-c', "import zipfile,os,sys\nz=zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED,9)\nb=sys.argv[1]\nfor r,_,fs in os.walk(b):\n  for f in fs:\n    p=os.path.join(r,f); z.write(p,os.path.relpath(p,b).replace(os.sep,'/'))\nz.close()", out, zip]);
console.log('portail', id, ':', n, 'fichiers,', (bytes / 1e6).toFixed(1), 'Mo ->', path.relative(root, out), '+', path.relative(root, zip), '(' + (fs.statSync(zip).size / 1e6).toFixed(1) + ' Mo)');
