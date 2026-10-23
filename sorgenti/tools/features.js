// Prova delle novità: potenziamenti persi e ritrovati, fagioli, colpo a terra, calcio volante, nemici scagliati,
// rimbalzo sul bordo, liberarsi con lo speciale, barile esplosivo, muro con segreto, manie dei nemici, battute
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
    const press = (held, pressed) => { const o = src.test; for (const a of ACTIONS) { o.prev[a] = o.held[a]; o.held[a] = !!held[a]; o.pressed[a] = !!pressed[a]; } };
    const step = (n, held = {}, pressed = {}) => { for (let i = 0; i < n; i++) { press(held, i === 0 ? pressed : {}); worldUpdate(); } };
    const fresh = (ci = 0) => { A.startGame([{ src: 'test', cur: ci, cos: 0 }]); A.Game.go('play'); G.enemies.length = 0; G.level.queue.length = 0; G.level.zone = null; G.props.length = 0; G.pickups.length = 0; const p = G.players[0]; p.x = 120; p.z = 176; p.facing = 1; p.state = 'idle'; p.inv = 0; return p; };
    const dummy = (type, x, z = 176) => { const e = new Enemy(type, x, z); e.setState('idle', 'idle'); e.updateAI = function () { this.play('idle'); }; e.cd = 9999; G.enemies.push(e); return e; };
    // potenziamenti
    { const p = fresh(1); const hp0 = p.maxHp, d0 = p.dmgMul;
      for (const k of ['forza', 'forza', 'vita', 'velocita', 'portata']) { const it = new Pickup('perk_' + k, p.x, p.z, { y: 0, vy: 0 }); it.t = 30; G.pickups.push(it); step(3); }
      R.push('potenziamenti: forza=' + p.perks.forza + ' vita=' + p.perks.vita + ' maxHp ' + hp0 + '->' + p.maxHp + ' danno x' + d0.toFixed(2) + '->' + p.dmgMul.toFixed(2) + ' portata+' + p.reachBonus);
      p.lives = 3; applyHit(null, p, { dmg: 999, knock: 'down' }); step(140);
      const dropped = G.pickups.filter(o => o.def && o.def.perk).length;
      R.push('morte: potenziamenti a terra=' + dropped + ' rimasti al giocatore=' + Object.values(p.perks).reduce((a, b) => a + b, 0) + ' vite=' + p.lives + ' stato=' + p.state);
      for (const it of G.pickups.filter(o => o.def && o.def.perk)) { it.x = p.x; it.z = p.z; it.vx = 0; }
      step(20); R.push('ripresi: ' + JSON.stringify(p.perks));
      for (const it of G.pickups.filter(o => o.def && o.def.perk)) it.x += 200; step(620); R.push('quelli non ripresi spariscono: a terra=' + G.pickups.filter(o => o.def && o.def.perk).length); }
    // fagioli
    { const p = fresh(2); const e = dummy('punk', 160); const hp = e.hp; const it = new Pickup('fagioli', p.x, p.z, { y: 0, vy: 0 }); it.t = 30; G.pickups.push(it); step(90);
      R.push('fagioli: nemico vicino ' + hp + '->' + e.hp + ' stato=' + e.state + ' nuvole=' + G.projs.filter(o => o instanceof Cloud).length); }
    // calcio volante in corsa
    { const p = fresh(3); const e = dummy('punk', 240); step(1, { right: true }, { right: true }); step(2); step(1, { right: true }, { right: true }); step(6, { right: true }); const run = p.running; step(1, { right: true }, { jump: true }); step(4, { right: true }); step(1, { right: true }, { atk: true }); step(40, { right: true });
      R.push('calcio volante: correva=' + run + ' runJump=' + p.runJump + ' nemico hp ' + e.maxHp + '->' + e.hp + ' stato=' + e.state); }
    // colpo a terra
    { const p = fresh(0); const e = dummy('punk', 150); e.hp = 30; e.knockDown(1, 1); for (let i = 0; i < 80 && e.state !== 'down'; i++) step(1); p.x = e.x - 30; p.facing = 1; const s0 = e.state, hp0 = e.hp; step(1, {}, { atk: true }); step(16); step(1, {}, { atk: true }); step(16);
      R.push('colpo a terra: stato prima=' + s0 + ' hp ' + hp0 + '->' + e.hp + ' calci=' + e.stomps); }
    // nemico scagliato che travolge gli altri + rimbalzo
    { const p = fresh(1); const a = dummy('punk', 160), b = dummy('punk', 200), c = dummy('punk', 240); const hb = b.hp, hc = c.hp;
      applyHit(p, a, { dmg: 12, knock: 'down', launch: 1.4 }, { dir: 1 }); step(40);
      R.push('scagliato: travolti b ' + hb + '->' + b.hp + ' (' + b.state + ') c ' + hc + '->' + c.hp + ' (' + c.state + ')');
      const d = dummy('punk', G.cam.x + W - 40); const hd = d.hp; applyHit(p, d, { dmg: 12, knock: 'down', launch: 1.4 }, { dir: 1 }); step(30); R.push('rimbalzo sul bordo: ' + d.wallBounced + ' hp ' + hd + '->' + d.hp); }
    // liberarsi con lo speciale quando si è presi
    { const p = fresh(0); p.meter = 100; const e = dummy('buttafuori', 150); e.updateAI = Enemy.prototype.updateAI; e.grabPlayer(p); step(2); step(1, {}, { atk: true, jump: true }); step(2);
      R.push('presa: speciale per liberarsi -> stato giocatore=' + p.state + ' nemico=' + e.state); }
    // barile esplosivo e muro
    { const p = fresh(1); const bar = new Prop('esplosivo', 160, 176); G.props.push(bar); const e = dummy('punk', 190); const he = e.hp; step(1, {}, { atk: true }); step(30);
      R.push('barile: distrutto=' + !bar.alive + ' nemico ' + he + '->' + e.hp + ' (' + e.state + ')');
      const wall = new Prop('muro', 165, 176, 'perk_difesa'); G.props.push(wall); for (let i = 0; i < 6; i++) { step(1, {}, { atk: true }); step(24); }
      R.push('muro: distrutto=' + !wall.alive + ' segreto a terra=' + G.pickups.some(o => o.kind === 'perk_difesa')); }
    // manie: arma raccolta, cibo rubato, sputo, rutto
    { const p = fresh(0); p.x = 60; const e = new Enemy('punk_catena', 200, 176); e.setState('idle', 'idle'); G.enemies.push(e); const w = new WeaponItem('mazza', 240, 176, undefined, 0); w.x = 240; w.t = 30; G.pickups.push(w); e.quirkCD = 0;
      for (let i = 0; i < 300 && !e.wpn; i++) { step(1); if (e.state === 'idle') e.quirkCD = Math.min(e.quirkCD, 1); }
      R.push('nemico raccoglie l\'arma: ' + (e.wpn ? e.wpn.kind : 'no') + ' look=' + e.look.id);
      applyHit(p, e, { dmg: 3, knock: 'down' }); step(10); R.push('  cadendo la perde: ' + !e.wpn + ' arma a terra=' + G.pickups.some(o => o.isWeapon)); }
    { const p = fresh(0); p.x = 40; const e = new Enemy('zombie_fan', 200, 176); e.setState('idle', 'idle'); G.enemies.push(e); e.hp = 10; const f = new Pickup('pizza', 260, 180, { y: 0, vy: 0 }); f.x = 260; f.t = 30; G.pickups.push(f); e.quirkCD = 0;
      for (let i = 0; i < 400 && f.alive; i++) { step(1); if (e.state === 'idle') e.quirkCD = Math.min(e.quirkCD, 1); }
      R.push('zombie goloso mangia la pizza: ' + !f.alive + ' hp 10->' + e.hp); }
    { let spit = 0, burp = 0; for (const [type, q] of [['punk', 'spit'], ['lanciabottiglie', 'burp']]) { const p = fresh(0); p.x = 100; const e = new Enemy(type, 200, 176); e.setState('idle', 'idle'); G.enemies.push(e);
        for (let i = 0; i < 600; i++) { step(1); if (e.state === 'q' + q) { if (q === 'spit') spit++; else burp++; break; } if (i % 50 === 0) e.quirkCD = 0; } }
      R.push('sputo=' + (spit > 0) + ' rutto=' + (burp > 0)); }
    // nomi e varianti
    { fresh(0); const names = new Set(), looks = new Set(); for (let i = 0; i < 40; i++) { const e = new Enemy('punk', 200, 176); names.add(e.nick); looks.add(e.look.id); } R.push('punk: nomi diversi=' + names.size + ' aspetti diversi=' + looks.size + ' es. ' + [...names].slice(0, 5).join(', ')); }
    // battute
    { Opts.lines = 'volgari'; const v = new Set(); for (let i = 0; i < 60; i++) v.add(pickLine(BAND_LINES.arrigo.kill)); Opts.lines = 'pulite'; const c = new Set(); for (let i = 0; i < 60; i++) c.add(pickLine(BAND_LINES.arrigo.kill)); Opts.lines = 'volgari';
      R.push('battute volgari=' + [...v].length + ' pulite=' + [...c].length + ' (pulite senza parolacce: ' + [...c].every(s => !/CAZZ|STRONZ|MERDA|COGLION|CULO|VAFFA/.test(s)) + ')'); }
    return R;
  });
  console.log(out.join('\n'));
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'nessun errore');
  await browser.close();
})();
