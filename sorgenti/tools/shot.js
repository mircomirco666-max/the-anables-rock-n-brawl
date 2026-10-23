// Uso: node tools/shot.js pagina.html out.png [larghezza altezza] [scriptDaEseguire.js] [attesaMs]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [page, out, w = 1200, h = 800, script, wait = 300] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
  const p = await browser.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + require('path').resolve(page));
  if (script) await p.evaluate(require('fs').readFileSync(script, 'utf8'));
  await p.waitForTimeout(+wait);
  await p.screenshot({ path: out });
  if (errs.length) console.log(errs.join('\n')); else console.log('nessun errore');
  await browser.close();
})();
