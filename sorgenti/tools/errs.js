// Uso: node tools/errs.js pagina.html?query  -> stampa errori con stack
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await browser.newPage();
  p.on('pageerror', e => console.log('pageerror: ' + e.stack));
  p.on('console', m => { if (m.type() === 'error') console.log('console: ' + m.text()); });
  await p.goto('file://' + require('path').resolve(process.argv[2].split('?')[0]) + (process.argv[2].includes('?') ? '?' + process.argv[2].split('?')[1] : ''));
  await p.waitForTimeout(+(process.argv[3] || 500));
  await browser.close();
})();
