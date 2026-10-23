// Scenari di test: node tools/run.js <scenario>
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const OUT = '/tmp/claude-0/-home-claude/2efd8b6f-aefc-5423-b438-90520b982e06/scratchpad';
const scen = process.argv[2] || 'level';
let window_cam_target = 0;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); else if (m.text().startsWith('LOG')) console.log(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + path.resolve('dist/index.html'));
  const wait = ms => page.waitForTimeout(ms);
  const shot = async n => { await page.screenshot({ path: `${OUT}/${scen}_${n}.png` }); };
  const ev = (f, a) => page.evaluate(f, a);
  await wait(300);
  // avvio diretto della partita con N giocatori
  const chars = (process.env.CHARS || '0').split(',').map(Number);
  const cos = (process.env.COS || '0').split(',').map(Number);
  await ev(([chars, cos]) => { window.__AN.Audio2.unlock(); window.__AN.startGame(chars.map((c, i) => ({ src: i === 0 ? 'kb' : 'pad' + (i - 1), cur: c, cos: cos[i] || 0 }))); window.__AN.Game.go('play'); }, [chars, cos]);
  // utilità di avanzamento: elimina i nemici e porta i giocatori in avanti
  const clearZone = () => ev(() => { const G = window.__AN.G; for (const e of G.enemies) { if (!e.isBoss) { e.hp = 0; e.lastHitBy = G.players[0]; e.knockDown(1, 1, true); } } G.level.queue.length = 0; });
  const advance = (x) => ev((x) => { const G = window.__AN.G; for (const p of G.players) { p.x = Math.min(x, G.cam.max + 300); } }, x);
  const info = () => ev(() => { const G = window.__AN.G; return JSON.stringify({ scene: window.__AN.Game.name, cam: Math.round(G.cam.x), max: G.cam.max, zi: G.level.zi, wave: G.level.waveI, q: G.level.queue.length, boss: G.level.bossPhase, en: G.enemies.map(e => e.type[0] + e.type.slice(-3) + ':' + e.state + ':' + e.hp), pl: G.players.map(p => p.char.id + ':' + p.state + ':' + p.hp + ':' + p.score) }); });
  const L1_ZX = await ev(() => LEVELS[0].zones.slice(1).map(z => z.x));
  if (scen === 'level') {
    await wait(1500); await shot('a_start');
    for (let z = 0; z < 5; z++) {
      // pulisci la zona finché non viene sbloccata
      for (let k = 0; k < 40; k++) {
        const st = await ev(() => { const L = window.__AN.G.level; return { zone: !!L.zone, zi: L.zi, pend: L.pendingZone }; });
        if (!st.zone) break;
        if (k === 3 && z === 2) await shot('z3_jukebox_fight');
        if (k === 3 && z === 4) await shot('z5_miniboss');
        await clearZone(); await wait(500);
      }
      console.log('zona', z, 'sbloccata', await info());
      const nx = L1_ZX[z];
      for (let k = 0; k < 60; k++) {
        const st = await ev(() => { const L = window.__AN.G.level; return { zi: L.zi, zone: !!L.zone, boss: L.bossPhase }; });
        if (st.zi > z) break;
        await advance(window_cam_target = nx + 260); await wait(120);
      }
      await wait(500);
      await shot('z' + (z + 2));
    }
    await wait(2500); await shot('boss_intro');
    await wait(1200); await shot('boss_card');
    await wait(2000); console.log('boss', await info()); await shot('boss_fight');
  }
  if (scen === 'boss') {
    await ev(() => { const G = window.__AN.G; G.level.zi = 5; G.enemies.length = 0; G.level.queue.length = 0; const bx = LEVELS[0].zones[5].x; G.cam.x = bx; G.cam.max = bx; G.level.startZone(5); for (const p of G.players) p.x = bx + 90; });
    await wait(4200); await shot('a_card');
    await wait(2000); await shot('b_fight');
    // forza i vari attacchi del boss
    for (const atk of ['startSpin', 'startBeams', 'startKick', 'startSummon']) {
      await ev((a) => { const b = window.__AN.G.bossRef; b.target = window.__AN.G.players[0]; b[a](); }, atk);
      await wait(700); await shot('c_' + atk);
      await wait(1200);
    }
    await ev(() => { const b = window.__AN.G.bossRef; b.hp = Math.floor(b.maxHp * 0.45); b.onDamaged(null, 1, false); b.target = window.__AN.G.players[0]; b.startFloor(); });
    await wait(1200); await shot('d_floor_warn'); await wait(500); await shot('d_floor_burn');
    console.log(await info());
    await ev(() => { const b = window.__AN.G.bossRef; b.hp = 0; b.lastHitBy = window.__AN.G.players[0]; b.knockDown(1, 1, true); });
    await wait(2500); await shot('e_defeat');
    await wait(5000); await shot('f_clear');
    await wait(3000); console.log(await info()); await shot('g_results');
    await page.keyboard.press('KeyJ'); await wait(800); await shot('h_tour');
    await page.keyboard.press('KeyJ'); await wait(800); await shot('i_initials');
  }
  if (scen === 'specials') {
    await wait(1200);
    const n = await ev(() => window.__AN.G.players.length);
    for (let i = 0; i < 6; i++) {
      await ev((i) => { const G = window.__AN.G; G.players.length = 0; const P = window.__AN.CAST[i]; const pl = new Player(0, 'kb', P, 'rossa'); pl.x = 100; pl.z = 176; pl.meter = 100; G.players.push(pl); G.enemies.length = 0; G.level.queue.length = 0; for (let k = 0; k < 3; k++) { const e = new Enemy('pattinatore', 180 + k * 48, 170 + k * 8); e.setState('idle', 'idle'); e.cd = 999; G.enemies.push(e); } pl.doSpecial(); }, i);
      await wait(380); await shot('sp' + i + '_a');
      await wait(420); await shot('sp' + i + '_b');
      console.log('speciale', i, await info());
      await wait(800);
    }
  }
  if (scen === 'screens') {
    // ritorna al titolo e percorri i menu con la tastiera
    await ev(() => { window.__AN.G.reset(); window.__AN.Game.go('title'); });
    const k = async (c, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(c); await wait(90); } };
    await wait(400); await k('Enter'); await wait(300); await shot('menu');
    await k('ArrowDown'); await k('Enter'); await wait(500); await shot('cast');
    await k('ArrowRight', 3); await k('ArrowDown'); await wait(300); await shot('cast2');
    await k('Escape'); await k('ArrowDown'); await k('Enter'); await wait(400); await shot('scores');
    await k('Escape'); await k('ArrowDown'); await k('Enter'); await wait(400); await shot('options');
    await k('Escape'); await k('ArrowDown'); await k('Enter'); await wait(400); await shot('controls');
    await k('Escape'); await k('ArrowDown'); await k('Enter'); await wait(2500); await shot('credits');
    await k('Escape'); await k('ArrowUp', 5); await k('Enter'); await wait(400);
    await page.keyboard.down('Digit2'); await wait(120); await page.keyboard.up('Digit2'); await wait(200);
    await k('ArrowRight'); await k('ArrowDown');
    await k('ArrowLeft'); await k('ArrowLeft');
    await wait(200); await shot('select2p');
    await k('ArrowRight'); await k('KeyF'); await k('Numpad1'); await wait(300); await shot('select_ready');
    await wait(1500); await shot('intro');
    await wait(2600); await shot('play2p');
    await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowRight'); await wait(700); await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowRight');
    await k('KeyF'); await k('Numpad1'); await k('KeyF'); await k('Numpad1');
    await shot('play2p_b');
    console.log(await info());
    await k('Escape'); await wait(300); await shot('pause');
    await k('Escape'); await wait(200);
    await ev(() => { for (const p of window.__AN.G.players) { p.lives = 1; p.hp = 0; p.knockDown(1, 1, true); } });
    await wait(4500); await shot('continue');
    console.log(await info());
  }
  console.log(errs.length ? errs.join('\n') : 'NESSUN ERRORE');
  await browser.close();
})();
