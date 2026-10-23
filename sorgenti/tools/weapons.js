// Test armi raccolte + speciale COLPO+SALTO
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
    src.test = Input._blank();
    const press = (s, held, pressed) => { const o = src[s]; for (const a of ACTIONS) { o.prev[a] = o.held[a]; o.held[a] = !!held[a]; o.pressed[a] = !!pressed[a]; } };
    const step = (n, held = {}, pressed = {}) => { for (let i = 0; i < n; i++) { press('test', held, i === 0 ? pressed : {}); worldUpdate(); } };
    const fresh = (charI, ex = 200) => {
      A.startGame([{ src: 'test', cur: charI, cos: 0 }]); A.Game.go('play');
      G.enemies.length = 0; G.level.queue.length = 0; G.level.zone = null; G.props.length = 0; G.pickups.length = 0;
      const p = G.players[0]; p.x = 120; p.z = 176; p.facing = 1; p.state = 'idle'; p.inv = 0;
      const e = new Enemy('buttafuori', ex, 176); e.setState('idle', 'idle'); e.updateAI = function () { this.play('idle'); };
      e.hp = e.maxHp = 999; e.armor = 0;
      G.enemies.push(e); return { p, e };
    };
    Object.keys(WEAPONS).forEach((k, idx) => {
      const W_ = WEAPONS[k], dist = Math.max(40, (W_.cpuRange || 50));
      const { p, e } = fresh(idx % 6, 128 + dist + 40);
      G.pickups.push(new WeaponItem(k, 128, 178, undefined, 0));
      step(20);
      step(1, {}, { atk: true }); step(10);
      const got = !!p.wpn, uses = p.wpn && p.wpn.uses;
      step(10, { right: true }); const walkAnim = p.anim;
      let hits = 0, dmg = 0;
      for (let i = 0; i < 20 && p.wpn; i++) { e.setState('idle', 'idle'); e.x = p.x + dist; e.z = p.z; e.inv = 0; e.y = 0; p.facing = 1; const hp = e.hp;
        if (W_.hold === 'saw') step(40, { atk: true }, { atk: true }); else { step(1, {}, { atk: true }); step(45); } if (e.hp < hp) { hits++; dmg += hp - e.hp; } }
      R.push(k.padEnd(12) + ' presa=' + got + ' usi=' + uses + ' cammina=' + walkAnim + ' colpi=' + hits + ' danno=' + dmg + ' rimasta=' + (p.wpn ? p.wpn.uses : 'rotta') + ' proiettili=' + G.projs.length);
    });
    // caduta dell'arma quando si va a terra
    { const { p, e } = fresh(2); p.wpn = { kind: 'tubo', uses: 5 }; applyHit(e, p, { dmg: 5, knock: 'down' }); step(60);
      const it = G.pickups.find(o => o.isWeapon); R.push('caduta: arma a terra=' + !!it + ' usi=' + (it && it.uses) + ' y=' + (it && it.y.toFixed(1)) + ' giocatore wpn=' + p.wpn); }
    // lancio dell'arma con FORTE
    { const { p, e } = fresh(3, 230); p.wpn = { kind: 'tubo', uses: 5 }; const hp = e.hp; step(1, {}, { heavy: true }); step(50);
      R.push('lancio: wpn=' + p.wpn + ' danno=' + (hp - e.hp) + ' stato nemico=' + e.state); }
    // speciale COLPO+SALTO (stesso frame e a 1 frame di distanza)
    for (const gap of [0, 1, 2, 4]) {
      const { p } = fresh(5); p.meter = 100;
      if (gap === 0) step(1, {}, { atk: true, jump: true });
      else { step(1, {}, { atk: true }); step(gap - 1); step(1, {}, { jump: true }); }
      R.push('COLPO+SALTO a ' + gap + ' frame: stato=' + p.state + ' meter=' + p.meter);
    }
    { const { p } = fresh(5); p.meter = 0; const hp = p.hp; step(1, {}, { jump: true }); step(1, {}, { atk: true });
      R.push('SALTO poi COLPO (1 frame), senza barra: stato=' + p.state + ' hp ' + hp + '->' + p.hp); }
    { const { p } = fresh(5); step(1, {}, { jump: true }); step(8); step(1, {}, { atk: true }); step(2);
      R.push('salto poi colpo dopo 9 frame: stato=' + p.state + ' (atteso jatk)'); }
    return R;
  });
  console.log(out.join('\n'));
  console.log('ERRORI:', errs.length ? errs.join('\n') : 'nessuno');
  await browser.close();
})();
