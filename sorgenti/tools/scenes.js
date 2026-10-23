// Screenshot di scene specifiche: node tools/scenes.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 672 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(400);
  const go = async (code, n, wait = 300) => { await page.evaluate(code); await page.waitForTimeout(wait); await page.screenshot({ path: `${OUT}/sc_${n}.png` }); };
  await go(() => { window.__AN.Game.go('title'); }, 'title', 2500);
  await go(() => { const A = window.__AN; A.startGame([{ src: 'kb', cur: 3, cos: 1 }, { src: 'pad0', cur: 5, cos: 3 }]); A.Game.go('play'); for (const p of A.G.players) p.score = 23450; A.Game.go('results'); }, 'results', 2600);
  await go(() => { const A = window.__AN; A.Game.go('tour'); }, 'tour', 400);
  await go(() => { const A = window.__AN; A.Game.go('initials', [A.G.players[0]]); }, 'initials', 400);
  await go(() => { const A = window.__AN; A.Game.go('play'); const G = A.G; G.players[0].wpn = { kind: 'coriandoli', uses: 7 }; G.players[0].meter = 100; G.players[1].wpn = { kind: 'tubo', uses: 12 }; }, 'hud', 600);
  await go(() => { const A = window.__AN; A.Game.go('options'); A.SCENES.options.sel = 6; }, 'options', 400);
  await go(() => { const A = window.__AN; SAVE.unlocked = 10; A.Game.go('stage', [{ src: 'kb', cur: 0, cos: 0 }]); }, 'stage', 400);
  await go(() => { const A = window.__AN; A.G.level = new Level(5); A.Game.go('tour', { next: 6 }); }, 'tour6', 400);
  await go(() => { const A = window.__AN; A.startLevel(7); }, 'intro7', 900);
  await go(() => { const A = window.__AN; A.Game.go('ending'); }, 'ending', 3000);
  await go(() => { const A = window.__AN; A.Game.go('credits'); }, 'credits', 600);
  console.log(errs.length ? errs.join('\n') : 'nessun errore');
  await browser.close();
})();
