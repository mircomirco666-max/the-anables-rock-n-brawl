// Test automatico: naviga i menu, gioca, cattura screenshot ed errori
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('file://' + path.resolve('dist/index.html'));
  const wait = ms => page.waitForTimeout(ms);
  const shot = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); };
  const key = async (k, hold = 60) => { await page.keyboard.down(k); await wait(hold); await page.keyboard.up(k); await wait(40); };
  const steps = (process.env.STEPS || 'basic');
  await wait(800); await shot('t1_title');
  await key('Enter'); await wait(400); await shot('t2_menu');
  await key('Enter'); await wait(400); await shot('t3_select');
  if (process.env.CHAR) { for (let i = 0; i < +process.env.CHAR; i++) await key('ArrowRight'); }
  await key('KeyJ'); await wait(1600); await shot('t4_intro');
  await wait(2300); await shot('t5_play');
  // muoviti e combatti
  await page.keyboard.down('ArrowRight'); await wait(900); await page.keyboard.up('ArrowRight');
  for (let i = 0; i < 12; i++) { await key('KeyJ', 40); await wait(60); }
  await shot('t6_fight');
  const state = await page.evaluate(() => { const G = window.__AN.G; return { scene: window.__AN.Game.name, enemies: G.enemies.map(e => e.type + ':' + e.state + ':' + e.hp), players: G.players.map(p => p.char.id + ':' + p.state + ':' + p.hp + ':' + p.score), cam: G.cam }; });
  console.log(JSON.stringify(state));
  console.log(errs.length ? errs.join('\n') : 'NESSUN ERRORE');
  await browser.close();
})();
