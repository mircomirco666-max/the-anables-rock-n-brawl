const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  const out = await page.evaluate(() => {
    const A = window.__AN, G = A.G, R = [];
    const src = Input.sources;
    // input finto per il giocatore 1 (sorgente "test")
    src.test = Input._blank(); src.test2 = Input._blank();
    const press = (s, held, pressed) => { const o = src[s]; for (const a of ACTIONS) { o.prev[a] = o.held[a]; o.held[a] = !!held[a]; o.pressed[a] = !!pressed[a]; } };
    const step = (n, s = 'test', held = {}, pressed = {}) => { for (let i = 0; i < n; i++) { press(s, held, i === 0 ? pressed : {}); worldUpdate(); } };
    const fresh = (charI, enemyType = 'pattinatore', ex = 150) => {
      A.startGame([{ src: 'test', cur: charI, cos: 0 }]); A.Game.go('play');
      G.enemies.length = 0; G.level.queue.length = 0; G.level.zone = null; G.props.length = 0;
      const p = G.players[0]; p.x = 120; p.z = 176; p.facing = 1; p.state = 'idle';
      const e = new Enemy(enemyType, ex, 176); e.setState('idle', 'idle'); e.cd = 9999; e.def = Object.assign({}, e.def, { behavior: Object.assign({}, e.def.behavior, { type: 'none' }) });
      e.updateAI = function () { this.play('idle'); };
      G.enemies.push(e); return { p, e };
    };
    // 1) presa camminando contro + ginocchiate + lancio
    for (const et of ['pattinatore', 'buttafuori']) {
      let { p, e } = fresh(1, et, 160);
      let grabbed = false;
      for (let i = 0; i < 60 && !grabbed; i++) { step(1, 'test', { right: true }); if (p.state === 'grab') grabbed = true; }
      R.push(et + ' presa: ' + grabbed + ' (stato ' + p.state + ', dx ' + Math.round(e.x - p.x) + ')');
      if (grabbed) {
        const hp0 = e.hp;
        step(1, 'test', {}, { atk: true }); step(22); step(1, 'test', {}, { atk: true }); step(24);
        R.push('  ginocchiate: hp ' + hp0 + ' -> ' + e.hp + ', stato giocatore ' + p.state);
        step(1, 'test', { left: true }, { atk: true, left: true }); step(60);
        R.push('  lancio all\'indietro: nemico ' + e.state + ' x ' + Math.round(e.x) + ' hp ' + e.hp + ', giocatore ' + p.state + ' facing ' + p.facing);
      }
    }
    // 2) corsa (doppio tocco) + carica
    { const { p, e } = fresh(4, 'pattinatore', 260);
      step(1, 'test', { right: true }, { right: true }); step(3); step(1, 'test', { right: true }, { right: true });
      step(6, 'test', { right: true }); const running = p.running; const x0 = p.x;
      step(10, 'test', { right: true }); const sp = (p.x - x0) / 10;
      step(1, 'test', { right: true }, { atk: true }); step(30);
      R.push('corsa: ' + running + ' vel ' + sp.toFixed(2) + ' px/f; carica -> nemico ' + e.state + ' hp ' + e.hp); }
    // 3) salto + attacco in volo
    { const { p, e } = fresh(0, 'pattinatore', 150);
      step(1, 'test', {}, { jump: true }); step(6); step(1, 'test', {}, { atk: true }); let maxY = 0; for (let i = 0; i < 40; i++) { step(1); maxY = Math.max(maxY, p.y); }
      R.push('salto: altezza max ' + maxY.toFixed(1) + ', nemico ' + e.state + ' hp ' + e.hp + ', giocatore ' + p.state); }
    // 4) combo completa a 4 colpi e pesante
    { const { p, e } = fresh(2, 'buttafuori', 150);
      const hp0 = e.hp; let hits = 0;
      for (let k = 0; k < 4; k++) { step(1, 'test', {}, { atk: true }); step(14); }
      R.push('combo 4 colpi su buttafuori: hp ' + hp0 + ' -> ' + e.hp + ', combo ' + p.bestCombo + ', stato nemico ' + e.state);
      step(80); e.x = p.x + 30; e.z = p.z; e.setState('idle', 'idle'); p.facing = 1; const h1 = e.hp; step(1, 'test', {}, { heavy: true }); step(40);
      R.push('pesante: hp ' + h1 + ' -> ' + e.hp + ' stato ' + e.state); }
    // 5) colpo di squadra + rianimazione
    { A.startGame([{ src: 'test', cur: 0, cos: 0 }, { src: 'test2', cur: 1, cos: 1 }]); A.Game.go('play');
      G.level.queue.length = 0; G.level.zone = null; G.props.length = 0; G.enemies.length = 0;
      const [a, b] = G.players; a.x = 120; b.x = 140; a.z = b.z = 176; a.meter = b.meter = 100;
      for (let i = 0; i < 3; i++) { const e = new Enemy('pattinatore', 220 + i * 30, 170 + i * 8); e.setState('idle', 'idle'); e.cd = 9999; G.enemies.push(e); }
      step(1, 'test', {}, { spec: true }); press('test2', {}, { spec: true }); worldUpdate(); press('test2', {}, {}); step(5);
      R.push('colpo di squadra: stati ' + a.state + '/' + b.state + ', nemici ' + G.enemies.map(e => e.state + ':' + e.hp).join(' '));
      step(120);
      // b va KO senza vite
      b.lives = 1; b.hp = 0; b.knockDown(1, 1, true); step(160);
      R.push('KO compagno: stato ' + b.state + ' koT ' + b.koT);
      a.x = b.x - 10; a.z = b.z; a.setState('idle', 'idle');
      for (let i = 0; i < 9 && b.state === 'ko'; i++) { step(1, 'test', {}, { atk: true }); step(8); }
      step(30);
      R.push('rianimazione: stato ' + b.state + ' hp ' + b.hp + ' vite ' + b.lives);
    }
    return R;
  });
  console.log(out.join('\n'));
  console.log(errs.length ? 'ERRORI: ' + errs.join(' | ') : 'NESSUN ERRORE');
  await browser.close();
})();
