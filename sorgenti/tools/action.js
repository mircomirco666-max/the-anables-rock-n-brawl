// Screenshot di gioco normale (CPU) in un livello: node tools/action.js livello frame [nome]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad/shots';
(async () => {
  const [lv = 5, frames = 2400, name = 'action'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 672 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(([lv, frames]) => { const A = window.__AN; A.startGame([{ src: 'cpu0', cur: 1, cos: 0, cpu: true }, { src: 'cpu1', cur: 5, cos: 2, cpu: true }], lv); A.Game.go('play');
    for (let i = 0; i < frames; i++) { Input.poll(); A.Game.update(); } }, [+lv, +frames]);
  await page.waitForTimeout(200); await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(errs.length ? errs.slice(0, 4).join('\n') : 'nessun errore');
  await browser.close();
})();
