const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { const A = window.__AN; A.startGame([{ src: 'cpu0', cur: 0, cos: 0, cpu: true }]); A.Game.go('play'); for (let i = 0; i < 3600; i++) { Input.poll(); A.Game.update(); } });
  const r = await page.evaluate(() => {
    const A = window.__AN, G = A.G, p = G.players[0], out = [];
    for (let i = 0; i < 6; i++) { const x0 = p.x; Input.poll(); A.Game.update(); out.push({ x0: x0.toFixed(2), x1: p.x.toFixed(2), st: p.state, hs: p.hitstop, held: Object.entries(Input.sources.cpu0.held).filter(e => e[1]).map(e => e[0]).join('+'), dbg: p.brain.dbg, z: p.z.toFixed(1), items: G.pickups.map(o => o.kind + '@' + Math.round(o.x) + ',' + Math.round(o.z) + ' t' + o.t).join(';'), cam: G.cam.x.toFixed(1) }); }
    return out;
  });
  console.log(JSON.stringify(r, null, 0));
  await browser.close();
})();
