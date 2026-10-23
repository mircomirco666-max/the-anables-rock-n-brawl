// Percorso completo della tournée: per ogni livello parte, sconfigge il boss, risultati -> tournée -> livello dopo -> ... -> finale -> titoli
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  const log = await page.evaluate(() => {
    const A = window.__AN, G = A.G, out = [];
    Input.sources.test = Input._blank();
    const tick = (n, confirm = false) => { for (let i = 0; i < n; i++) { const o = Input.sources.test; for (const a of ACTIONS) { o.prev[a] = o.held[a]; o.held[a] = confirm && i % 20 === 0 && a === 'atk'; o.pressed[a] = o.held[a] && !o.prev[a]; } Input.poll(); A.Game.update(); } };
    const until = (names, max, confirm) => { for (let i = 0; i < max; i++) { if (names.includes(A.Game.name)) return true; tick(1, confirm && i % 20 === 10); } return names.includes(A.Game.name); };
    localStorage.clear(); SAVE.unlocked = 1;
    A.startGame([{ src: 'test', cur: 0, cos: 0 }], 1);
    for (let lv = 1; lv <= 10; lv++) {
      const okPlay = until(['play'], 400, true);
      const L = G.level, z = L.zones.length - 1, bx = L.zones[z].x;
      G.enemies.length = 0; L.queue.length = 0; L.pendingZone = undefined; G.cam.x = bx; G.cam.max = bx; L.startZone(z);
      let f = 0;
      while (L.bossPhase !== 'done' && f < 4000) {
        for (const p of G.players) { p.x = clamp(p.x, G.cam.x + 30, G.cam.x + 120); p.inv = 9999; p.hp = p.maxHp; }
        if (L.bossPhase === 'fight') for (const b of (L.bosses || [])) if (b.alive && b.hp > 0 && b.state !== 'dead') { b.untouchable = false; b.hidden = false; applyHit(G.players[0], b, { dmg: 99999, knock: 'down' }, { noStopA: true }); }
        tick(1); f++;
      }
      const okRes = until(['results'], 900, false);
      const okNext = until(lv < 10 ? ['tour'] : ['ending'], 400, true);
      out.push('L' + lv + ' ' + L.def.title + ': play=' + okPlay + ' boss=' + L.bossPhase + ' (' + f + ' frame) risultati=' + okRes + ' poi=' + A.Game.name + ' sbloccati=' + SAVE.unlocked);
      if (lv < 10) { const okIntro = until(['intro'], 3500, true); if (!okIntro || G.level.n !== lv + 1) out.push('  ERRORE: atteso intro del livello ' + (lv + 1) + ', scena ' + A.Game.name + ' livello ' + G.level.n); }
    }
    const okCred = until(['credits'], 1200, true); out.push('dopo il finale: ' + A.Game.name + ' musica=' + Audio2.songName);
    const okEnd = until(['initials', 'scores'], 9000, false); out.push('fine titoli: ' + A.Game.name);
    return out;
  });
  console.log(log.join('\n'));
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'nessun errore');
  await browser.close();
})();
