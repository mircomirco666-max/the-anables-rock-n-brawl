// Simulazione accelerata: tutti i giocatori guidati dalla CPU giocano il livello 1
// Uso: CHARS=0,3 DIFF=1 node tools/sim.js [maxSecondi]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad';
(async () => {
  const maxSec = +(process.argv[2] || 600);
  const tag = process.env.TAG || 'sim';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + path.resolve(process.env.PAGE || 'dist/index.html'));
  await page.waitForTimeout(300);
  const chars = (process.env.CHARS || '0').split(',').map(Number);
  await page.evaluate(([chars, diff, lvl]) => {
    const A = window.__AN;
    Opts.diff = diff;
    A.startGame(chars.map((c, i) => ({ src: 'cpu' + i, cur: c, cos: i % 4, cpu: true })), lvl);
    A.Game.go('play');
  }, [chars, +(process.env.DIFF || 1), +(process.env.LV || 1)]);
  let lastShot = 0, t0 = Date.now(), last = null;
  for (let sec = 0; sec < maxSec; sec += 10) {
    const r = await page.evaluate(() => {
      const A = window.__AN, G = A.G;
      for (let i = 0; i < 600; i++) {
        if (A.Game.name !== 'play' && A.Game.name !== 'playResume') break;
        Input.poll(); A.Game.update();
      }
      const L = G.level;
      return { scene: A.Game.name, t: Math.round(G.stats.time / 60), cam: Math.round(G.cam.x), zi: L.zi, wave: L.waveI, boss: L.bossPhase, bossHp: G.bossRef ? G.bossRef.hp + '/' + G.bossRef.maxHp + ' ' + G.bossRef.state : '-',
        dmgBy: JSON.stringify(Object.entries(G.stats.dmgBy || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)), en: G.enemies.length, pl: G.players.map(p => p.char.id + ' hp' + p.hp + ' v' + p.lives + ' ' + p.state + ' ' + p.score + (p.out ? ' OUT' : '')).join(' | '), kills: G.stats.kills, dbg: JSON.stringify({ q: L.queue.length, zone: !!L.zone, pend: L.pendingZone, max: G.cam.max, goT: G.goT, en: G.enemies.map(e => e.type + ':' + e.state + '@' + Math.round(e.x) + ',' + Math.round(e.z) + ' hp' + e.hp), p: G.players.map(p => Math.round(p.x) + ',' + Math.round(p.z) + ' ' + (p.brain && p.brain.dbg)) }) };
    });
    if (!process.env.QUIET) console.log(JSON.stringify(r));
    last = r;
    if (!process.env.QUIET && (sec - lastShot >= 60 || r.scene !== 'play')) { await page.waitForTimeout(60); await page.screenshot({ path: `${OUT}/${tag}_${sec}.png` }); lastShot = sec; }
    if (r.scene !== 'play' && r.scene !== 'playResume') break;
  }
  if (process.env.QUIET) console.log(process.env.CHARS, 'diff' + (process.env.DIFF || 1), '->', last.scene, 't=' + last.t + 's', 'zona ' + last.zi, 'boss ' + last.bossHp, '|', last.pl, '| kills ' + last.kills + '\n   danni: ' + last.dmgBy + (last.scene === 'play' ? '\n   STALLO? ' + last.dbg : ''));
  else console.log('durata reale', Math.round((Date.now() - t0) / 1000), 's');
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'NESSUN ERRORE');
  await browser.close();
})();
