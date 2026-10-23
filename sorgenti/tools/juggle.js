// Riproduce il bug "nemico che rimbalza all'infinito senza morire": colpi ripetuti mentre è in aria
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  const out = await page.evaluate(() => {
    const A = window.__AN, G = A.G, R = [], src = Input.sources;
    src.test = Input._blank();
    const step = (n) => { for (let i = 0; i < n; i++) worldUpdate(); };
    const fresh = (ci = 0) => { A.startGame([{ src: 'test', cur: ci, cos: 0 }]); A.Game.go('play'); G.enemies.length = 0; G.level.queue.length = 0; G.level.zone = null; G.props.length = 0; G.pickups.length = 0; G.projs.length = 0; const p = G.players[0]; p.x = 120; p.z = 176; p.facing = 1; p.state = 'idle'; p.inv = 0; return p; };
    const dummy = (type, x, z = 176) => { const e = new Enemy(type, x, z); e.setState('idle', 'idle'); e.updateAI = function () { this.play('idle'); }; e.cd = 9999; G.enemies.push(e); return e; };
    // 1) nemico con 1 hp sopra una nuvola di scoregge permanente
    { const p = fresh(1); const e = dummy('punk', 160); e.hp = 1; let frames = 0;
      const cl = new Cloud(p, 160, 176, '#80c040', { life: 100000, dmg: 10, knock: 'down' }); G.projs.push(cl);
      e.x = 160; while (e.alive && frames < 3000) { step(1); e.x = 160; frames++; }
      R.push('nuvola: morto=' + !e.alive + ' dopo ' + frames + ' frame, stato=' + e.state + ' hp=' + e.hp); }
    // 2) nemico con 1 hp colpito ogni 8 frame mentre è in aria (giocoleria)
    { const p = fresh(1); const e = dummy('punk', 160); e.hp = 1; let frames = 0, hits = 0;
      while (e.alive && frames < 3000) { if (frames % 8 === 0 && canBeHit(e)) { applyHit(p, e, { dmg: 12, knock: 'down', launch: 1.4 }, { dir: 1 }); hits++; } step(1); e.x = 160; frames++; }
      R.push('giocoleria: morto=' + !e.alive + ' dopo ' + frames + ' frame, colpi=' + hits + ' stato=' + e.state); }
    // 3) nemico vivo colpito all'infinito: deve comunque arrivare a terra
    { const p = fresh(1); const e = dummy('punk', 160); e.hp = 100000; let frames = 0, downs = 0, last = '';
      while (frames < 1200) { if (frames % 8 === 0 && canBeHit(e)) applyHit(p, e, { dmg: 12, knock: 'down', launch: 1.4 }, { dir: 1 }); step(1); e.x = 160; if (e.state === 'down' && last !== 'down') downs++; last = e.state; frames++; }
      R.push('vivo: volte a terra in 1200 frame=' + downs + ' (0 = resta in aria per sempre)'); }
    // 4) boss colpito a raffica
    { const p = fresh(1); const e = new Enemy('re_pogo', 200, 176); G.enemies.push(e); e.setState('idle', 'idle'); e.hp = 1; let frames = 0;
      while (e.alive && frames < 3000) { if (frames % 8 === 0 && canBeHit(e)) applyHit(p, e, { dmg: 12, knock: 'down', launch: 1.4 }, { dir: 1 }); step(1); e.x = 200; frames++; }
      R.push('boss: morto=' + !e.alive + ' dopo ' + frames + ' frame, stato=' + e.state); }
    return R;
  });
  console.log(out.join('\n'));
  console.log(errs.length ? 'ERRORI:\n' + errs.join('\n') : 'nessun errore');
  await browser.close();
})();
