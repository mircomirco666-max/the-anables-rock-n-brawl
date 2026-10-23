const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errs = [];
  const mk = async (opts) => { const pg = await browser.newPage(opts); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); await pg.goto('file://' + path.resolve('dist/the-anables-rock-n-brawl.html')); await pg.waitForTimeout(300); return pg; };
  const page = await mk({ viewport: { width: 1152, height: 648 } });
  const ev = (f, a) => page.evaluate(f, a);
  for (let i = 0; i < 6; i++) { await ev((i) => { const S = window.__AN.SCENES.cast; S.i = i; S.cos = i % 4; window.__AN.Game.go('cast'); }, i); await page.waitForTimeout(150); await page.screenshot({ path: `${OUT}/ui_cast${i}.png` }); }
  await ev(() => window.__AN.Game.go('controls')); await page.waitForTimeout(150); await page.screenshot({ path: `${OUT}/ui_controls.png` });
  await ev(() => { window.__AN.Game.go('select', { src: 'kb' }); const S = window.__AN.SCENES.select; S.slots.push({ src: 'pad0', cur: 3, cos: 3, ready: false }); S.slots.push({ src: 'pad1', cur: 5, cos: 1, ready: true }); S.focus = 1; });
  await page.waitForTimeout(200); await page.screenshot({ path: `${OUT}/ui_select.png` });
  await ev(() => { window.__AN.startGame([{ src: 'kb', cur: 1, cos: 1 }]); }); await page.waitForTimeout(1500); await page.screenshot({ path: `${OUT}/ui_intro.png` });
  await ev(() => { const A = window.__AN, G = A.G; A.Game.go('play'); const bx = LEVELS[0].zones[5].x; G.cam.x = bx; G.cam.max = bx; G.level.startZone(5); for (const p of G.players) p.x = bx + 90; });
  await page.waitForTimeout(2600); await page.screenshot({ path: `${OUT}/ui_bosscard.png` });
  // telefono: verticale e orizzontale con touch
  for (const [n, w, h] of [['portrait', 390, 844], ['landscape', 844, 390]]) {
    const pg = await mk({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await pg.evaluate(() => { window.__AN.startGame([{ src: 'touch', cur: 4, cos: 2 }]); window.__AN.Game.go('play'); });
    await pg.waitForTimeout(1200);
    await pg.screenshot({ path: `${OUT}/ui_${n}.png` });
    // prova: tocco su COLPO e joystick
    const b = await pg.$('.b-atk'); const box = await b.boundingBox();
    await pg.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await pg.waitForTimeout(100);
    const st = await pg.evaluate(() => { const p = window.__AN.G.players[0]; return p.state + ' ' + p.moveName + ' touchSeen=' + Input.touchSeen + ' active=' + Touch.active; });
    console.log(n, 'dopo tap COLPO:', st);
    await pg.close();
  }
  console.log(errs.length ? errs.join('\n') : 'NESSUN ERRORE');
  await browser.close();
})();
