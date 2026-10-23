// Screenshot dei boss di ogni livello (introduzione e combattimento): node tools/bosses.js [livelli]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad/shots';
(async () => {
  const lvls = (process.argv[2] || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 672 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(400);
  for (const lv of lvls) {
    await page.evaluate((lv) => {
      const A = window.__AN, G = A.G;
      A.startGame([{ src: 'cpu0', cur: 0, cos: 0, cpu: true }, { src: 'cpu1', cur: 4, cos: 2, cpu: true }], lv); A.Game.go('play');
      const L = G.level, z = L.zones.length - 1, bx = L.zones[z].x;
      G.enemies.length = 0; L.queue.length = 0; G.props.length = 0;
      L.pendingZone = undefined; G.cam.x = bx; G.cam.max = bx; L.startZone(z);
      for (const p of G.players) { p.x = bx + 90 + p.slot * 30; p.z = 170 + p.slot * 20; }
      for (let i = 0; i < 160; i++) { Input.poll(); A.Game.update(); }
    }, lv);
    await page.waitForTimeout(150); await page.screenshot({ path: `${OUT}/boss${lv}_intro.png` });
    const info = await page.evaluate(() => {
      const A = window.__AN, G = A.G;
      for (let i = 0; i < 700; i++) { Input.poll(); A.Game.update(); if (A.Game.name !== 'play') break; }
      return { scene: A.Game.name, bosses: (G.level.bosses || []).map(b => b.type + ' ' + b.hp + '/' + b.maxHp + ' ' + b.state + (b.cur ? ':' + b.cur.k : '')), projs: G.projs.map(p => p.k || p.constructor.name).join(','), en: G.enemies.length };
    });
    await page.waitForTimeout(150); await page.screenshot({ path: `${OUT}/boss${lv}_fight.png` });
    console.log('L' + lv, JSON.stringify(info));
  }
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'nessun errore');
  await browser.close();
})();
