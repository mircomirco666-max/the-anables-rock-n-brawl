// Prova delle mosse di ogni musicista: combo fino al colpo finale, pesante, in corsa, in volo e in volo dopo la corsa.
// Per ogni mossa: sequenza di mosse eseguite, colpi a segno, danno totale, suoni richiesti.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(400);
  const out = await page.evaluate(() => {
    const A = window.__AN, G = A.G, R = [], src = Input.sources;
    src.test = Input._blank();
    const press = (held, pressed) => { const o = src.test; for (const a of ACTIONS) { o.prev[a] = o.held[a]; o.held[a] = !!held[a]; o.pressed[a] = !!pressed[a]; } };
    const step = (n, held = {}, pressed = {}) => { for (let i = 0; i < n; i++) { press(held, i === 0 ? pressed : {}); worldUpdate(); } };
    const snd = []; const orig = Audio2.charSfx; Audio2.charSfx = function (id, ev, o) { snd.push(ev + (o && o.mv && o.mv.snd ? ':' + o.mv.snd : '')); };
    const fresh = (ci) => {
      A.startGame([{ src: 'test', cur: ci, cos: 0 }]); A.Game.go('play');
      G.enemies.length = 0; G.level.queue.length = 0; G.level.zone = null; G.props.length = 0; G.pickups.length = 0; G.projs.length = 0;
      const p = G.players[0]; p.x = 120; p.z = 176; p.facing = 1; p.setState('idle', 'idle'); p.inv = 0; p.meter = 0; return p;
    };
    const dummies = (xs) => xs.map(([x, z]) => { const e = new Enemy('punk', x, z || 176); e.setState('idle', 'idle'); e.hp = e.maxHp = 999; e.updateAI = function () { this.play('idle'); }; e.cd = 9999; G.enemies.push(e); return e; });
    const total = es => es.reduce((a, e) => a + (999 - e.hp), 0);
    const watch = (p, n, fn) => { const seq = []; for (let i = 0; i < n; i++) { fn(i); if (p.state === 'attack' && seq[seq.length - 1] !== p.moveName) seq.push(p.moveName); if (p.state === 'jatk' && seq[seq.length - 1] !== 'jatk') seq.push(p.runJump ? 'rjatk' : 'jatk'); } return seq; };
    for (let ci = 0; ci < 6; ci++) {
      const c = CAST[ci], line = [c.name];
      // combo: tasto colpo premuto a ritmo, nemico davanti e uno dietro
      { const p = fresh(ci); const es = dummies([[p.x + 34], [p.x - 30]]); snd.length = 0;
        const seq = watch(p, 140, i => step(1, {}, i % 6 === 0 ? { atk: true } : {}));
        line.push('combo ' + seq.join('>') + ' danno ' + total([es[0]]) + (total([es[1]]) ? ' (dietro ' + total([es[1]]) + ')' : '') + ' note ' + snd.filter(s => s.startsWith('hit')).length); }
      // pesante su due nemici (davanti e dietro)
      { const p = fresh(ci); const es = dummies([[p.x + 40], [p.x - 34]]); snd.length = 0; const x0 = p.x;
        step(1, {}, { heavy: true }); step(70);
        line.push('pesante ' + (p.moves.heavy.anim) + ' danno ' + total([es[0]]) + '/' + total([es[1]]) + ' stato ' + es[0].state + ' spost ' + Math.round(p.x - x0) + ' onde ' + G.projs.filter(o => o instanceof Shock).length + ' suoni ' + [...new Set(snd)].join(',')); }
      // in corsa
      { const p = fresh(ci); p.x = 60; const es = dummies([[200], [230]]); snd.length = 0;
        step(1, { right: true }, { right: true }); step(2); step(1, { right: true }, { right: true }); step(8, { right: true });
        const run = p.running; step(1, { right: true }, { atk: true }); step(60);
        line.push('corsa=' + run + ' danno ' + total(es) + ' stati ' + es.map(e => e.state).join('/') + ' armatura ' + !!p.moves.ratk.armor); }
      // in volo
      { const p = fresh(ci); const es = dummies([[p.x + 30]]); step(1, {}, { jump: true }); step(6); step(1, {}, { atk: true }); step(50);
        line.push('volo danno ' + total(es) + ' stato ' + es[0].state); }
      // in volo dopo la corsa
      { const p = fresh(ci); p.x = 60; const es = dummies([[230]]); step(1, { right: true }, { right: true }); step(2); step(1, { right: true }, { right: true }); step(8, { right: true }); step(1, { right: true }, { jump: true }); step(4, { right: true }); step(1, { right: true }, { atk: true }); step(50, { right: true });
        line.push('volo in corsa ' + (p.moves.rjatk.anim) + ' danno ' + total(es)); }
      // colpo a terra, salto e danno: suoni
      { const p = fresh(ci); snd.length = 0; step(1, {}, { jump: true }); step(40); applyHit(null, p, { dmg: 3, knock: 'light' }); step(30);
        line.push('suoni salto/danno ' + snd.join(',')); }
      R.push(line.join('\n   '));
    }
    Audio2.charSfx = orig;
    return R;
  });
  console.log(out.join('\n'));
  console.log(errs.length ? 'ERRORI:\n' + errs.join('\n') : 'nessun errore');
  await browser.close();
})();
