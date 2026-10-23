// Prova della corsa col furgone: node tools/van.js [dopo-livello]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad/shots';
(async () => {
  const after = +(process.argv[2] || 3);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 672 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  await page.evaluate((after) => { const A = window.__AN; A.startGame([{ src: 'cpu0', cur: 0, cos: 0, cpu: true }, { src: 'cpu1', cur: 3, cos: 1, cpu: true }], after); A.Game.go('van', { next: after + 1, after }); }, after);
  for (const [k, n] of [[0, 200], [1, 300], [2, 400]]) {
    const r = await page.evaluate((n) => { const A = window.__AN; for (let i = 0; i < n; i++) { Input.poll(); A.Game.update(); } const R = A.SCENES.van.ride; return { scene: A.Game.name, dist: Math.round(R.dist), hp: R.hp, kills: R.kills, things: R.things.map(o => o.kind).join(','), done: R.done }; }, n);
    await page.waitForTimeout(100); await page.screenshot({ path: `${OUT}/van${after}_${k}.png` }); console.log(JSON.stringify(r));
  }
  const fin = await page.evaluate(() => { const A = window.__AN; for (let i = 0; i < 2600 && A.Game.name === 'van'; i++) { Input.poll(); A.Game.update(); } return { scene: A.Game.name, level: A.G.level && A.G.level.n, score: A.G.players.map(p => p.score) }; });
  console.log('fine:', JSON.stringify(fin));
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'nessun errore');
  await browser.close();
})();
