const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { const A = window.__AN; A.startGame([{ src: 'cpu0', cur: 0, cos: 0, cpu: true }]); A.Game.go('play'); });
  for (let k = 0; k < 8; k++) {
    const r = await page.evaluate(() => {
      const A = window.__AN, G = A.G;
      for (let i = 0; i < 600; i++) { Input.poll(); A.Game.update(); }
      return { t: Math.round(G.stats.time / 60), cam: G.cam.x, max: G.cam.max, goT: G.goT, held: JSON.stringify(Input.sources.cpu0.held), props: G.props.map(o => o.kind + "@" + Math.round(o.x) + "," + o.z + (o.rolling ? "R" : "")), items: G.pickups.map(o => o.kind + "@" + Math.round(o.x) + "," + Math.round(o.z)), p: G.players.map(p => ({ x: Math.round(p.x), z: Math.round(p.z), st: p.state, hp: p.hp, f: p.facing })), e: G.enemies.map(e => ({ type: e.type, x: Math.round(e.x), z: Math.round(e.z), st: e.state, hp: e.hp, cd: e.cd, f: e.facing, tok: Tokens.holders(G.players[0]).has(e) })), q: G.level.queue.length };
    });
    console.log(JSON.stringify(r));
  }
  await page.screenshot({ path: '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad/probe.png' });
  await browser.close();
})();
