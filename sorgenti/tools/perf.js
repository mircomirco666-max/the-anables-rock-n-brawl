// Prestazioni nell'ondata peggiore: tanti nemici, proiettili, sangue. node tools/perf.js [livello]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const lv = +(process.argv[2] || 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(400);
  const r = await page.evaluate(async (lv) => {
    const A = window.__AN, G = A.G;
    A.startGame([0, 1, 2, 3].map(i => ({ src: 'cpu' + i, cur: i, cos: i, cpu: true })), lv); A.Game.go('play');
    // genera in anticipo i frame come fa l'intro
    while (Prewarm.q.length) Prewarm.run(50);
    const L = G.level, types = [...new Set(L.def.extras.concat(L.zones[1].waves.flat().map(w => w[0])))];
    for (let i = 0; i < 12; i++) L.spawnNow(types[i % types.length], i % 2 ? 'L' : 'R');
    const T = { upd: [], draw: [] };
    for (let f = 0; f < 900; f++) {
      if (f % 120 === 0) for (let i = 0; i < 4; i++) if (L.alive() < 14) L.spawnNow(types[(f + i) % types.length], i % 2 ? 'L' : 'R');
      const t0 = performance.now(); Input.poll(); A.Game.update(); const t1 = performance.now();
      lctx.setTransform(RS, 0, 0, RS, 0, 0); A.Game.draw(lctx); dctx.drawImage(LC, 0, 0, DC.width, DC.height); const t2 = performance.now();
      if (f > 60) { T.upd.push(t1 - t0); T.draw.push(t2 - t1); }
      if (A.Game.name !== 'play') A.Game.go('play');
    }
    const st = a => { const s = a.slice().sort((x, y) => x - y); return { avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), max: +s[s.length - 1].toFixed(2) }; };
    return { upd: st(T.upd), draw: st(T.draw), enemies: G.enemies.length, fx: G.fx.length, decals: G.decals.length, cache: typeof _frameCache !== 'undefined' ? _frameCache.size : '?' };
  }, lv);
  console.log('livello', lv, JSON.stringify(r));
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'nessun errore');
  await browser.close();
})();
