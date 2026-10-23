// ============================================================
// SCENE E CICLO PRINCIPALE (timestep fisso 60 Hz)
// ============================================================
const [LC, lctx] = makeCanvas(W * RS, H * RS);
let DC = null, dctx = null;
const SAVE = Store.load();
const Opts = Object.assign({ music: 7, sfx: 8, diff: 1, scale: 'adatta', touch: 'auto', cpu: false, blood: true, flash: true, lines: 'volgari' }, SAVE.options || {});
function saveAll() { SAVE.options = Opts; Store.save(SAVE); }
function applyOpts() { Audio2.setVolumes(Opts.music / 10, Opts.sfx / 10); Touch.mode = Opts.touch; Touch.update(); resize(); }

function resize() {
  if (!DC) return;
  const stage = document.getElementById('stage');
  const aw = Math.max(50, stage.clientWidth), ah = Math.max(50, stage.clientHeight);
  const dpr = window.devicePixelRatio || 1;
  let s = Math.min(aw / W, ah / H);
  if (Opts.scale === 'intera') { const si = Math.floor(Math.min(aw * dpr / (W * RS), ah * dpr / (H * RS))); if (si >= 1) s = si * RS / dpr; }
  const cw = Math.max(1, Math.floor(W * s)), ch = Math.max(1, Math.floor(H * s));
  DC.style.width = cw + 'px'; DC.style.height = ch + 'px';
  DC.width = Math.round(cw * dpr); DC.height = Math.round(ch * dpr);
  dctx.imageSmoothingEnabled = false;
}

const CONFIRM = m => m.atk || m.start || m.jump;
const BACK = m => m.heavy || m.spec || m.back;

// ---------------- Sfondo animato condiviso (titolo e menu) ----------------
let BG_LEVEL = null;
function drawBgStreet(ctx, t, dim = 0.55) {
  if (!BG_LEVEL) BG_LEVEL = new Level(1);
  const span = BG_LEVEL.worldEnd - W - 340;
  const camX = (t * 0.35) % span;
  BG_LEVEL.drawBack(ctx, camX);
  ctx.fillStyle = `rgba(8,4,18,${dim})`; ctx.fillRect(0, 0, W, H);
}
const TITLE_COSTUMES = ['rossa', 'oro', 'bianca', 'azzurra', 'rossa', 'oro'];
function drawBandRow(ctx, y, t, costumes = TITLE_COSTUMES, anim = 'idle') {
  CAST.forEach((c, i) => {
    const A = animsFor(c);
    const fr = A[anim] || A.idle;
    const fi = Math.floor((t + i * 9) / 24) % fr.length;
    const f = getFrame(c.look, costumes[i], fr[fi].p, anim + fi + (costumes[i] === 'oro' ? '_' + ((t >> 3) % 3) : ''), costumes[i] === 'oro' ? (t >> 3) % 3 : 0);
    const x = 38 + i * 62;
    pixelShadow(ctx, x, y, 11, 2.5);
    drawSprite(ctx, f, x, y, 1);
  });
}

// ---------------- Gestore di scene ----------------
const Game = {
  scene: null, name: '', t: 0,
  go(name, arg) { this.name = name; this.scene = SCENES[name]; this.t = 0; if (this.scene.enter) this.scene.enter(arg); },
  update() { this.t++; this.scene.update(); },
  draw(ctx) { this.scene.draw(ctx); },
};

function menuList(ctx, items, sel, x, y, opts = {}) {
  items.forEach((it, i) => {
    const on = i === sel;
    const label = typeof it === 'string' ? it : it.label;
    if (on) { ctx.fillStyle = 'rgba(255,77,109,0.85)'; ctx.fillRect(x - 6, y + i * 14 - 3, opts.w || 160, 13); drawText(ctx, '>', x - 4, y + i * 14, '#ffffff'); }
    drawText(ctx, label, x + 6, y + i * 14, on ? '#ffffff' : (opts.dim || '#c9b8e8'));
    if (it.value !== undefined) drawText(ctx, '< ' + it.value + ' >', x + (opts.w || 160) - 12, y + i * 14, on ? '#ffd23e' : '#8a7aa8', { align: 'right' });
  });
}

const SCENES = {};

// ---------------- TITOLO ----------------
SCENES.title = {
  enter() { Audio2.stop(); if (Audio2.unlocked) Audio2.play('title'); },
  update() {
    const m = Input.menu();
    if (m.atk || m.start || m.jump || m.heavy || m.spec || m.back) {
      Audio2.unlock(); Audio2.play('title'); Audio2.sfxPlay('confirm'); Game.go('menu');
    }
  },
  draw(ctx) {
    const t = Game.t;
    drawBgStreet(ctx, t, 0.5);
    const lg = logoCanvas();
    const bob = Math.round(Math.sin(t * 0.04) * 2);
    ctx.drawImage(lg, Math.round((W - lg.width) / 2), 2 + bob);
    const flick = (t % 180) < 4 || (t % 333) < 2;
    drawBandRow(ctx, 214, t);
    drawText(ctx, "ROCK 'N' BRAWL", W / 2, 80, flick ? '#5a1a40' : '#ff7ad9', { align: 'center', scale: 2, outline: '#3a0a2a' });
    if ((t >> 5) % 2 === 0) drawText(ctx, 'PREMI UN TASTO PER INIZIARE', W / 2, 98, '#ffffff', { align: 'center', outline: '#0a0610' });
  },
};

// ---------------- MENU PRINCIPALE ----------------
SCENES.menu = {
  items: ['GIOCA', 'SCHEDE PERSONAGGI', 'CLASSIFICA', 'OPZIONI', 'COMANDI', 'CREDITI'],
  sel: 0,
  enter() { Audio2.play('title'); },
  update() {
    const m = Input.menu();
    if (m.up) { this.sel = (this.sel + this.items.length - 1) % this.items.length; Audio2.sfxPlay('menu'); }
    if (m.down) { this.sel = (this.sel + 1) % this.items.length; Audio2.sfxPlay('menu'); }
    if (BACK(m)) { Audio2.sfxPlay('back'); Game.go('title'); return; }
    if (CONFIRM(m)) {
      Audio2.sfxPlay('confirm');
      const src = Input.joinPress([]) || (Input.sources.touch.pressed.atk || Input.sources.touch.pressed.start || Input.sources.touch.pressed.jump ? 'touch' : 'kb');
      const go = ['select', 'cast', 'scores', 'options', 'controls', 'credits'][this.sel];
      Game.go(go, { src });
    }
  },
  draw(ctx) {
    drawBgStreet(ctx, Game.t + 400, 0.62);
    const lg = logoCanvas();
    ctx.drawImage(lg, Math.round((W - lg.width) / 2), 2, lg.width, lg.height);
    drawPanel(ctx, 108, 92, 168, 100);
    menuList(ctx, this.items, this.sel, 122, 102, { w: 148 });
    drawText(ctx, 'CONFERMA: J / Z / INVIO   ·   INDIETRO: L / C / ESC', W / 2, 202, '#8a7aa8', { align: 'center' });
  },
};

// ---------------- SELEZIONE PERSONAGGI ----------------
SCENES.select = {
  enter(arg) {
    Audio2.play('select');
    Input.splitKeyboard = false;
    this.slots = [{ src: (arg && arg.src) || 'kb', cur: 0, cos: 0, ready: false }];
    this.countdown = -1; this.focus = 0;
  },
  taken(ci, except) { return this.slots.some(s => s !== except && s.ready && s.cur === ci); },
  update() {
    // nuovi giocatori
    if (this.slots.length < MAX_PLAYERS && this.countdown < 0) {
      const src = Input.joinPress(this.slots.map(s => s.src));
      if (src) {
        if (src === 'kbB') Input.splitKeyboard = true;
        let cur = 0; while (this.slots.some(s => s.cur === cur) && cur < 5) cur++;
        this.slots.push({ src, cur, cos: this.slots.length % COSTUME_ORDER.length, ready: false, joinT: 0 });
        Audio2.sfxPlay('confirm');
        this.focus = this.slots.length - 1;
        Input.clearEdges();
        return;
      }
    }
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      const inp = Input.state(s.src).pressed;
      if (s.joinT !== undefined && s.joinT < 4) { s.joinT++; continue; }
      if (!s.ready) {
        if (inp.left) { s.cur = (s.cur + 5) % 6; Audio2.sfxPlay('menu'); this.focus = i; }
        if (inp.right) { s.cur = (s.cur + 1) % 6; Audio2.sfxPlay('menu'); this.focus = i; }
        if (inp.up) { s.cos = (s.cos + COSTUME_ORDER.length - 1) % COSTUME_ORDER.length; Audio2.sfxPlay('menu'); this.focus = i; }
        if (inp.down) { s.cos = (s.cos + 1) % COSTUME_ORDER.length; Audio2.sfxPlay('menu'); this.focus = i; }
        if (inp.atk || inp.start || inp.jump) {
          if (this.taken(s.cur, s)) Audio2.sfxPlay('back');
          else { s.ready = true; Audio2.sfxPlay('confirm'); this.focus = i; s.readyT = 0; }
        }
        if (inp.heavy || inp.spec || inp.back) {
          if (i === 0) { Audio2.sfxPlay('back'); Input.splitKeyboard = false; Game.go('menu'); return; }
          this.slots.splice(i, 1); if (s.src === 'kbB') Input.splitKeyboard = false; Audio2.sfxPlay('back'); this.countdown = -1; return;
        }
      } else {
        s.readyT++;
        if (inp.heavy || inp.spec || inp.back) { s.ready = false; this.countdown = -1; Audio2.sfxPlay('back'); }
      }
    }
    if (this.slots.every(s => s.ready)) {
      if (this.countdown < 0) this.countdown = 70;
      else if (--this.countdown === 0) { if ((SAVE.unlocked || 1) > 1) Game.go('stage', this.slots); else startGame(this.slots, 1); }
    }
  },
  draw(ctx) {
    const t = Game.t;
    ctx.fillStyle = '#100820'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { ctx.fillStyle = (y / 4) % 2 ? '#140a28' : '#120926'; ctx.fillRect(0, y, W, 4); }
    drawText(ctx, 'SCEGLI IL TUO MUSICISTA', W / 2, 3, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    const cw = 61, x0 = 3, y = 20, ch = 116;
    CAST.forEach((c, ci) => {
      const x = x0 + ci * (cw + 2);
      const owners = this.slots.map((s, si) => ({ s, si })).filter(o => o.s.cur === ci);
      const readyO = owners.find(o => o.s.ready);
      drawPanel(ctx, x, y, cw, ch, readyO ? 'rgba(40,20,50,0.95)' : 'rgba(20,10,32,0.9)', owners.length ? PCOL[owners[0].si] : '#3a2a5a');
      const cosKey = owners.length ? COSTUME_ORDER[owners[0].s.cos] : 'rossa';
      const A = animsFor(c);
      const anim = readyO ? 'victory' : 'idle';
      const fr = A[anim];
      const fi = Math.floor(t / 20) % fr.length;
      const seed = cosKey === 'oro' ? (t >> 3) % 3 : 0;
      const f = getFrame(c.look, cosKey, fr[fi].p, anim + fi + (seed ? '_' + seed : ''), seed);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 11, cw - 2, ch - 22); ctx.clip();
      pixelShadow(ctx, x + cw / 2, y + 104, 15, 3);
      drawSprite(ctx, f, x + cw / 2 - 3, y + 104, 1, { alpha: owners.length ? 1 : 0.5 });
      ctx.restore();
      drawText(ctx, c.name, x + cw / 2, y + ch - 10, owners.length ? '#ffffff' : '#8a7aa8', { align: 'center', outline: '#0a0610' });
      drawText(ctx, c.role, x + cw / 2, y + 2, '#ffd23e', { align: 'center' });
      owners.forEach((o, k) => {
        const tag = (o.si + 1) + 'P';
        ctx.fillStyle = PCOL[o.si]; ctx.fillRect(x + 2 + k * 14, y + 12, 13, 9);
        drawText(ctx, tag, x + 3 + k * 14, y + 13, '#0a0610');
        if (o.s.ready && (t >> 3) % 2) drawText(ctx, 'OK!', x + cw - 3, y + 13, PCOL[o.si], { align: 'right', outline: '#0a0610' });
      });
    });
    // scheda del personaggio sotto il cursore attivo
    const fs = this.slots[Math.min(this.focus, this.slots.length - 1)];
    const c = CAST[fs.cur], pc = PCOL[this.slots.indexOf(fs)];
    const py = 140;
    drawPanel(ctx, 3, py, 254, 81, 'rgba(12,6,20,0.92)', pc);
    ctx.fillStyle = shade(pc, 0.35); ctx.fillRect(7, py + 4, PORTRAIT_W * 2, PORTRAIT_H * 2);
    blitHi(ctx, portrait(c, 2), 7, py + 4);
    const tx = 66;
    drawText(ctx, c.name + (c.nick ? ' "' + c.nick + '"' : ''), tx, py + 4, '#ffffff', { outline: '#0a0610' });
    drawText(ctx, c.role + ' · ' + c.instName, tx, py + 14, '#ffd23e');
    const stats = [['FORZA', c.stats.str], ['VELOCITA\'', c.stats.spd], ['PORTATA', c.stats.rch], ['RESISTENZA', c.stats.end]];
    stats.forEach(([n, v], i) => {
      drawText(ctx, n, tx, py + 25 + i * 9, '#c9b8e8');
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k < v ? pc : '#3a2a4a'; ctx.fillRect(tx + 66 + k * 9, py + 25 + i * 9, 7, 6); }
    });
    drawText(ctx, 'COSTUME', 196, py + 25, '#8a7aa8');
    drawText(ctx, '↑↓ ' + COSTUMES[COSTUME_ORDER[fs.cos]].short, 196, py + 34, '#ffffff');
    drawText(ctx, 'SPECIALE: ' + c.special.name, 7, py + 63, '#3ec5ff');
    drawText(ctx, c.special.desc, 7, py + 72, '#8a7aa8');
    // stato giocatori
    drawPanel(ctx, 261, py, 120, 81, 'rgba(12,6,20,0.92)', '#3a2a5a');
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const s = this.slots[i], yy = py + 5 + i * 12;
      if (s) {
        const dev = s.src === 'kb' ? (Input.splitKeyboard ? 'TASTIERA A' : 'TASTIERA') : s.src === 'kbB' ? 'TASTIERA B' : s.src === 'touch' ? 'TOUCH' : 'PAD ' + (+s.src.slice(3) + 1);
        drawText(ctx, (i + 1) + 'P', 267, yy, PCOL[i]);
        drawText(ctx, s.ready ? 'PRONTO' : dev, 287, yy, s.ready ? '#62f08e' : '#ffffff');
      } else if ((t >> 4) % 2) drawText(ctx, (i + 1) + 'P PREMI START', 267, yy, '#5a4a7a');
      else drawText(ctx, (i + 1) + 'P', 267, yy, '#3a2a5a');
    }
    drawText(ctx, '2P TASTIERA: 2', 267, py + 55, '#8a7aa8');
    if (this.countdown > 0) drawText(ctx, 'SI PARTE!', 267, py + 67, (t >> 2) % 2 ? '#ffd23e' : '#ffffff');
    else drawText(ctx, '←→ SCEGLI · J OK', 267, py + 67, '#8a7aa8');
  },
};

function startGame(slots, levelN = 1) {
  G.reset();
  G.diff = DIFFS[Opts.diff];
  BG_LEVEL = null;   // libera la memoria del fondale del titolo
  slots = slots.slice();
  if (Opts.cpu && slots.length === 1 && !slots[0].cpu) {
    const free = [0, 1, 2, 3, 4, 5].filter(c => c !== slots[0].cur);
    slots.push({ src: 'cpu1', cur: pick(free), cos: randi(0, 3), cpu: true });
  }
  const ps = slots.map((s, i) => {
    const p = new Player(i, s.src, CAST[s.cur], COSTUME_ORDER[s.cos] || 'rossa');
    if (s.cpu) { p.cpu = true; p.brain = new CPUBrain(p); }
    return p;
  });
  G.runScore = 0;
  startLevel(levelN, ps);
}
// Avvia un livello tenendo giocatori, vite e punteggi
function startLevel(n, players) {
  const ps = players || G.players;
  G.reset(); G.players = ps; G.diff = DIFFS[Opts.diff];
  ps.forEach((p, i) => { p.resetForLevel(i); p.score0 = p.score; });
  G.level = new Level(n);
  G.level.start();
  Prewarm.level(G.level);
  Game.go('intro');
}

// Genera in anticipo i frame che serviranno (a piccoli blocchi, senza scatti)
const Prewarm = {
  q: [],
  add(look, costume, A, names, seedFn) {
    for (const an of names) { const fr = A[an]; if (!fr) continue; fr.forEach((f, i) => this.q.push(() => getFrame(look, costume, f.p, an + i))); }
  },
  level(L) {
    this.q.length = 0;
    const base = ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'hurt', 'hurt2', 'knock', 'down', 'getup', 'l1', 'l2', 'l3', 'l4', 'heavy', 'jatk', 'ratk', 'grab', 'grabhit', 'throw', 'victory', 'sp'];
    for (const p of G.players) this.add(p.look, p.costume, p.anims, [...new Set(base.concat(['stomp', 'rjatk'], Object.values(p.moves).map(m => m.anim).filter(a => a && p.anims[a])))]);
    const types = new Set(L.def.extras);
    for (const z of L.zones) for (const w of (z.waves || [])) for (const [t] of w) types.add(t);
    for (const w of L.def.boss.waves) for (const t of w) types.add(t);
    for (const t of types) {
      const d = ENEMY_DEFS[t]; if (!d) continue;
      const bossAn = ['beam', 'point', 'spin', 'dash', 'tele', 'crouch', 'leap', 'throwV', 'sing', 'raise', 'shoot', 'whip', 'kick', 'l1', 'l2', 'l3', 'heavy', 'jatk', 'land', 'sp', 'slam', 'grabP', 'bite', 'espin', 'taunt', 'sway'];
      for (const lk of d.looks) { const look0 = ENEMY_LOOKS[lk]; if (!look0) continue;
        const A = d.castId && typeof evilAnims === 'function' ? evilAnims(d.castId) : enemyAnims(d.anims);
        const P_ = PERSONAS[t], q = P_ ? P_.quirks : [];
        const names = ['idle', 'walk', 'hurt', 'hurt2', 'knock', 'down', 'getup', 'taunt', ...Object.values(d.attacks || {}).map(a => a.anim).filter(Boolean), ...(d.tier === 'boss' ? bossAn : [])];
        if (look0.shoes === 'skate') names.push('skate'); if (d.shamble) names.push('walkZ'); if (q.includes('spit')) names.push('bite'); if (q.includes('burp')) names.push('sing');
        // anche la variante di colore (stessa regola del costruttore del nemico); i "ciccioni" si generano al volo
        const vars = [look0];
        if (d.tier === 'normal' || d.tier === 'elite') vars.push(enemyVariant(look0, 1 + (t.length % 3), false));
        for (const look of vars) this.add(look, 'own', A, names); }
    }
  },
  run(budgetMs) {
    const t0 = performance.now();
    while (this.q.length && performance.now() - t0 < budgetMs) { try { this.q.shift()(); } catch (e) { } }
  },
};

// ---------------- INTRO DEL LIVELLO ----------------
SCENES.intro = {
  enter() { Audio2.play('intro', true); },
  update() {
    Prewarm.run(10);
    if (Game.t > 130 || (Game.t > 30 && CONFIRM(Input.menu()))) {
      Game.go('play'); const p = G.players.find(q => q.active && !q.out); if (p) { if (!p.line('start', 1)) p.say(p.char.quotes.start, 110); }
      const song = G.level.def.song; if (Audio2.songName !== song) Audio2.play(song);
    }
  },
  draw(ctx) {
    ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
    const t = Game.t, lv = G.level.def;
    for (let y = 0; y < H; y += 2) { ctx.fillStyle = (y / 2) % 2 ? '#07040e' : '#05030a'; ctx.fillRect(0, y, W, 1); }
    drawText(ctx, 'LIVELLO ' + lv.n + ' / 10', W / 2, 48, '#ffd23e', { align: 'center', scale: 2 });
    const sc = textWidth(lv.title, 3) > W - 20 ? 2 : 3;
    drawText(ctx, lv.title, W / 2, 74, '#ff7ad9', { align: 'center', scale: sc, outline: '#3a0a2a' });
    drawText(ctx, 'GENERE: ' + lv.genre + '   ·   ' + lv.place, W / 2, 112, '#c9b8e8', { align: 'center' });
    if (t > 40) drawText(ctx, 'BOSS: ' + lv.boss.name, W / 2, 128, '#ffffff', { align: 'center' });
    const n = Math.min(4, Math.floor(t / 24) + 1);
    if (t < 100) drawText(ctx, ['UN', 'DUE', 'TRE', 'QUATTRO!'][n - 1], W / 2, 160, '#3ec5ff', { align: 'center', scale: 2 });
  },
};

// ---------------- PARTITA ----------------
function worldUpdate() {
  G.frame++; G.stats.time++;
  if (G.goT > 0) G.goT--;
  G.level.update();
  for (const p of G.players) if (p.brain) p.brain.think();
  for (const p of G.players) p.update();
  for (const p of G.players) if (p.cpu && p.out && ++p.outT > 150) p.continueGame();
  for (const e of G.enemies) e.update();
  for (const o of G.props) o.update();
  for (const o of G.pickups) o.update();
  for (const o of G.projs) o.update();
  for (const f of G.fx) {
    f.t++; f.x += f.vx; f.y = Math.max(0, f.y + f.vy);
    if (f.type === 'chip') f.vy -= 0.22;
    else if (f.type === 'note' || f.type === 'glit' || f.type === 'ember') f.vy *= 0.97;
    else if (f.type === 'blood') { f.vy -= 0.24; f.vx *= 0.98; if (f.y <= 0 && f.t > 2) { if (chance(0.4)) splat(f.x, f.z + rand(-2, 2), rand(1.2, 3.2), f.col); f.t = f.life; } }
  }
  for (const d of G.decals) d.t++;
  if (G.frame % 30 === 0) G.decals = G.decals.filter(d => d.x > G.cam.x - 100);
  for (const t of G.texts) t.t++;
  separate([...G.players.filter(p => p.active && !p.out), ...G.enemies]);
  updateCamera();
  G.enemies = G.enemies.filter(e => e.alive);
  G.props = G.props.filter(o => o.alive);
  G.pickups = G.pickups.filter(o => o.alive);
  G.projs = G.projs.filter(o => o.alive);
  G.fx = G.fx.filter(f => f.t < f.life);
  if (G.fx.length > 300) G.fx.splice(0, G.fx.length - 300);
  G.texts = G.texts.filter(t => t.t < t.life);
  if (G.flash > 0) G.flash--;
}

function drawWorld(ctx) {
  const sh = G.cam.shakeT > 0 ? G.cam.shake : 0;
  const camX = Math.round(G.cam.x + (sh ? rand(-sh, sh) : 0));
  const oy = sh ? Math.round(rand(-sh, sh) * 0.5) : 0;
  ctx.save(); ctx.translate(0, oy);
  G.level.drawBack(ctx, camX);
  drawDecals(ctx, camX);
  const actors = [...G.players.filter(p => p.active && !p.out), ...G.enemies];
  for (const a of actors) a.drawShadow(ctx, camX);
  const list = [];
  for (const a of actors) list.push([a.z, 2, a]);
  for (const o of G.props) list.push([o.z, 1, o]);
  for (const o of G.pickups) list.push([o.z - 0.5, 0, o]);
  for (const o of G.projs) list.push([o.z + 0.2, 3, o]);
  for (const f of G.fx) list.push([f.z + 0.3, 4, f]);
  list.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [, k, o] of list) { if (k === 4) drawFxOne(ctx, o, camX); else o.draw(ctx, camX); }
  // indicatori e fumetti
  const multi = G.players.filter(p => p.active).length > 1;
  for (const p of G.players) {
    if (!p.active || p.out) continue;
    const top = p.z - p.y - p.hurtH - 8;
    if (p.bubble) queueBubble(p.bubble.txt, p.x - camX, top - 2, p.color);
    else if (multi || p.state === 'enter') { drawText(ctx, (p.slot + 1) + 'P', p.x - camX, top - 6, p.color, { align: 'center', outline: '#0a0610' }); }
    if (p.state === 'ko') drawText(ctx, (G.frame >> 4) % 2 ? 'AIUTO!' : 'ATTACCO VICINO', p.x - camX, p.z - 26, '#ffd23e', { align: 'center', outline: '#0a0610' });
  }
  for (const e of G.enemies) if (e.bubble && e.x - camX > -20 && e.x - camX < W + 20) queueBubble(e.bubble.txt, e.x - camX, e.z - e.y - e.hurtH - 8, e.isBoss ? '#ff7ad9' : '#ff4d6d');
  flushBubbles(ctx);
  drawTexts(ctx, camX);
  G.level.drawFront(ctx, camX);
  ctx.restore();
  if (G.flash > 0) { ctx.globalAlpha = Math.min(0.75, G.flash / 10); ctx.fillStyle = G.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // introduzione del boss
  const lv = G.level;
  if (G.bossIntro) {
    drawLetterbox(ctx, Math.min(1, lv.bossT / 20));
    if (lv.bossT > 80 && lv.bossT < 186) {
      const k = Math.min(1, (lv.bossT - 80) / 12);
      const bx = Math.round(W - (W + 20) * k);
      ctx.fillStyle = 'rgba(30,8,40,0.88)'; ctx.fillRect(bx, 150, W + 20, 34);
      ctx.fillStyle = '#ff7ad9'; ctx.fillRect(bx, 150, W + 20, 1); ctx.fillRect(bx, 183, W + 20, 1);
      const BD = lv.def.boss, bsc = textWidth(BD.name, 2) > W - 40 ? 1 : 2;
      drawText(ctx, BD.name, bx + 24, bsc === 2 ? 154 : 158, '#ffd23e', { scale: bsc, outline: '#3a1a00' });
      drawText(ctx, BD.title, bx + 26, 172, '#ff7ad9');
    }
  }
  drawHud(ctx);
}

SCENES.play = {
  update() {
    const m = Input.menu();
    if ((m.start || m.back) && !this.allOut()) {
      // START su un giocatore fuori gioco = rientra (continua)
      const outP = G.players.find(p => p.out && Input.state(p.src).pressed.start);
      if (outP) { outP.continueGame(); Audio2.sfxPlay('confirm'); }
      else { Audio2.sfxPlay('pause'); Game.go('pause'); return; }
    }
    if (G.slowmo > 0) { G.slowmo--; if (G.slowmo % 3 !== 0) return; }
    worldUpdate();
    if (this.allOut()) { Game.go('continue'); return; }
    const lv = G.level;
    if (lv.clearT === 120) { for (const p of G.players) if (p.active && !p.out && p.alive) { p.setState('victory', 'victory'); p.untouchable = true; if (!p.line('win', 1)) p.say(p.char.quotes.win, 140); } Audio2.play('clear', true); }
    if (lv.clearT >= 330) Game.go('results');
  },
  allOut() { const h = G.players.filter(p => !p.cpu); const list = h.length ? h : G.players; return list.length > 0 && list.every(p => p.out); },
  draw(ctx) {
    drawWorld(ctx);
    const lv = G.level;
    if (lv.clearT >= 120) {
      const k = Math.min(1, (lv.clearT - 120) / 16);
      ctx.fillStyle = `rgba(8,4,18,${0.5 * k})`; ctx.fillRect(0, 70, W, 40);
      drawText(ctx, 'LIVELLO SUPERATO!', W / 2, 80, (G.frame >> 3) % 2 ? '#ffd23e' : '#ffffff', { align: 'center', scale: 2, outline: '#3a1a00' });
    }
  },
};

SCENES.pause = {
  items: ['CONTINUA', 'COMANDI', 'ESCI AL MENU'], sel: 0,
  enter() { this.sel = 0; this.showCtrl = false; },
  update() {
    const m = Input.menu();
    if (this.showCtrl) { if (CONFIRM(m) || BACK(m)) this.showCtrl = false; return; }
    if (m.up) { this.sel = (this.sel + 2) % 3; Audio2.sfxPlay('menu'); }
    if (m.down) { this.sel = (this.sel + 1) % 3; Audio2.sfxPlay('menu'); }
    if (m.start || m.back || BACK(m)) { Game.go('playResume'); return; }
    if (m.atk || m.jump) {
      Audio2.sfxPlay('confirm');
      if (this.sel === 0) Game.go('playResume');
      else if (this.sel === 1) this.showCtrl = true;
      else { Audio2.stop(); Game.go('menu'); }
    }
  },
  draw(ctx) {
    drawWorld(ctx);
    ctx.fillStyle = 'rgba(8,4,18,0.7)'; ctx.fillRect(0, 0, W, H);
    if (this.showCtrl) { drawControls(ctx); return; }
    drawText(ctx, 'PAUSA', W / 2, 60, '#ffd23e', { align: 'center', scale: 3, outline: '#3a1a00' });
    drawPanel(ctx, 120, 96, 144, 52);
    menuList(ctx, this.items, this.sel, 134, 104, { w: 124 });
  },
};
SCENES.playResume = { enter() { Game.scene = SCENES.play; Game.name = 'play'; }, update() { }, draw() { } };

// ---------------- CONTINUA / GAME OVER ----------------
SCENES.continue = {
  enter() { this.n = 9; this.tt = 0; Audio2.play('gameover', true); },
  update() {
    const m = Input.menu();
    if (Game.t > 20 && (m.start || m.atk || m.jump)) {
      for (const p of G.players) if (p.out) p.continueGame();
      Audio2.sfxPlay('confirm'); Audio2.play(G.level.bossPhase === 'fight' ? G.level.def.bossSong : G.level.def.song, true);
      Game.go('playResume'); return;
    }
    if (++this.tt >= 60) { this.tt = 0; this.n--; Audio2.sfxPlay('count'); if (this.n < 0) Game.go('gameover'); }
  },
  draw(ctx) {
    drawWorld(ctx);
    ctx.fillStyle = 'rgba(8,4,18,0.72)'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'CONTINUI?', W / 2, 60, '#ffffff', { align: 'center', scale: 3, outline: '#3a1a00' });
    drawText(ctx, String(Math.max(0, this.n)), W / 2, 96, '#ffd23e', { align: 'center', scale: 5, outline: '#3a1a00' });
    if ((Game.t >> 4) % 2) drawText(ctx, 'PREMI START PER CONTINUARE', W / 2, 150, '#ff7ad9', { align: 'center' });
    drawText(ctx, 'IL PUNTEGGIO RIPARTE DA ZERO', W / 2, 164, '#8a7aa8', { align: 'center' });
  },
};
SCENES.gameover = {
  enter() { this.best = Math.max(...G.players.map(p => p.score)); },
  update() { if (Game.t > 160 || (Game.t > 50 && CONFIRM(Input.menu()))) toInitialsOrScores(); },
  draw(ctx) {
    ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'GAME OVER', W / 2, 80, '#ff4d6d', { align: 'center', scale: 4, outline: '#3a0a10' });
    drawText(ctx, 'PUNTEGGIO MIGLIORE: ' + this.best, W / 2, 130, '#ffffff', { align: 'center' });
  },
};

function qualifies(score) { const s = SAVE.scores || []; return score > 0 && (s.length < 10 || score > s[s.length - 1].score); }
function toInitialsOrScores() {
  const q = G.players.filter(p => p.active && !p.cpu && qualifies(p.score)).sort((a, b) => b.score - a.score);
  if (q.length) Game.go('initials', q); else Game.go('scores', { back: 'title' });
}

// ---------------- RISULTATI ----------------
SCENES.results = {
  enter() {
    const sec = Math.floor(G.stats.time / 60);
    this.timeBonus = Math.max(0, (360 - sec) * 40);
    this.noDmg = G.stats.dmgTaken === 0 ? 10000 : 0;
    const act = G.players.filter(p => p.active);
    for (const p of act) p.addScore((this.timeBonus + this.noDmg) / act.length);
    const total = act.reduce((a, p) => a + p.score - (p.score0 || 0), 0) / act.length;   // valutazione sul solo livello appena giocato
    this.rank = total >= 42000 ? 'S' : total >= 30000 ? 'A' : total >= 20000 ? 'B' : 'C';
    this.sec = sec;
  },
  update() {
    if (Game.t === 1) { const n = G.level.n; SAVE.unlocked = Math.max(SAVE.unlocked || 1, Math.min(10, n + 1)); saveAll(); if (n < 10) Audio2.prerender([LEVELS[n].song]); }
    if (Game.t > 60 && CONFIRM(Input.menu())) { Audio2.sfxPlay('confirm'); Game.go(G.level.n >= 10 ? 'ending' : 'tour', { next: G.level.n + 1 }); }
  },
  draw(ctx) {
    ctx.fillStyle = '#0c0618'; ctx.fillRect(0, 0, W, H);
    const t = Game.t;
    drawBandRow(ctx, 220, t, G.players.length ? CAST.map((c, i) => (G.players.find(p => p.char === c) || {}).costume || TITLE_COSTUMES[i]) : TITLE_COSTUMES, 'victory');
    drawText(ctx, 'RISULTATI · LIVELLO ' + G.level.n, W / 2, 4, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    drawPanel(ctx, 6, 22, 234, 92, 'rgba(12,6,24,0.9)', '#3a2a5a');
    drawPanel(ctx, 244, 22, 134, 92, 'rgba(12,6,24,0.9)', '#3a2a5a');
    const rows = [
      ['TEMPO', Math.floor(this.sec / 60) + ':' + String(this.sec % 60).padStart(2, '0')],
      ['NEMICI SCONFITTI', G.stats.kills],
      ['COMBO MASSIMA', G.stats.maxCombo],
      ['COMBO DI SQUADRA', G.stats.teamHits],
      ['SEGRETI TROVATI', G.stats.secrets + ' / 3'],
      ['BONUS TEMPO', '+' + this.timeBonus],
      ['BONUS SENZA DANNI', '+' + this.noDmg],
    ];
    rows.forEach(([a, b], i) => { if (t > 10 + i * 8) { drawText(ctx, a, 14, 27 + i * 9, '#c9b8e8'); drawText(ctx, String(b), 232, 27 + i * 9, '#ffffff', { align: 'right' }); } });
    if (t > 100) { drawText(ctx, 'VALUTAZIONE', 14, 98, '#c9b8e8'); drawText(ctx, this.rank, 90, 92, this.rank === 'S' ? '#ffd23e' : '#ffffff', { scale: 2, outline: '#3a1a00' }); }
    G.players.filter(p => p.active).forEach((p, i) => {
      if (t < 80) return;
      const y = 26 + i * 21;
      ctx.fillStyle = shade(p.color, 0.35); ctx.fillRect(248, y, PORTRAIT_W, 19);
      ctx.drawImage(portrait(p.char), 0, 5 * RS, PORTRAIT_W * RS, 19 * RS, 248, y, PORTRAIT_W, 19);
      drawText(ctx, p.char.name, 278, y + 2, p.color);
      drawText(ctx, String(p.score).padStart(7, '0'), 278, y + 11, '#ffffff');
    });
    if (t > 60 && (t >> 4) % 2) drawText(ctx, 'PREMI UN TASTO', W - 8, 214, '#ff7ad9', { align: 'right', outline: '#0a0610' });
  },
};

// ---------------- LA TOURNÉE (i 10 livelli) ----------------
SCENES.tour = {
  enter(arg) { this.next = (arg && arg.next) || 1; this.done = this.next - 1; Audio2.play('select'); },
  update() {
    if (Game.t > 40 && CONFIRM(Input.menu())) { Audio2.sfxPlay('confirm'); if (typeof VAN_RIDES !== 'undefined' && VAN_RIDES[this.next - 1]) Game.go('van', { next: this.next, after: this.next - 1 }); else startLevel(this.next); }
  },
  draw(ctx) {
    ctx.fillStyle = '#0c0618'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'LA TOURNEE', W / 2, 6, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    LEVELS.forEach((lv, i) => {
      const y = 26 + i * 17, done = lv.n <= this.done, next = lv.n === this.next;
      ctx.fillStyle = next ? ((Game.t >> 3) % 2 ? 'rgba(255,77,109,0.35)' : 'rgba(255,77,109,0.2)') : done ? 'rgba(98,240,142,0.15)' : 'rgba(255,255,255,0.04)'; ctx.fillRect(10, y - 2, W - 20, 15);
      drawText(ctx, String(lv.n).padStart(2, ' '), 16, y + 2, done ? '#62f08e' : next ? '#ffffff' : '#5a4a7a');
      drawText(ctx, lv.genre, 34, y + 2, done || next ? '#ffffff' : '#8a7aa8');
      drawText(ctx, done || next ? lv.boss.label : '???', W - 16, y + 2, done ? '#ffd23e' : next ? '#ff9ab0' : '#5a4a7a', { align: 'right' });
      if (done) drawText(ctx, 'SUPERATO ★', 150, y + 2, '#62f08e'); else if (next) drawText(ctx, 'PROSSIMA TAPPA', 150, y + 2, '#ff7ad9');
    });
    if ((Game.t >> 4) % 2) drawText(ctx, 'PREMI UN TASTO PER PARTIRE', W / 2, 202, '#ff7ad9', { align: 'center' });
  },
};

// ---------------- SCELTA DELLA TAPPA (livelli già sbloccati) ----------------
SCENES.stage = {
  enter(slots) { this.slots = slots; this.max = Math.min(10, SAVE.unlocked || 1); this.sel = this.max - 1; },
  update() {
    const m = Input.menu();
    if (m.up) { this.sel = (this.sel + this.max - 1) % this.max; Audio2.sfxPlay('menu'); }
    if (m.down) { this.sel = (this.sel + 1) % this.max; Audio2.sfxPlay('menu'); }
    if (BACK(m)) { Audio2.sfxPlay('back'); Game.go('select'); return; }
    if (Game.t > 10 && CONFIRM(m)) { Audio2.sfxPlay('confirm'); startGame(this.slots, this.sel + 1); }
  },
  draw(ctx) {
    ctx.fillStyle = '#0c0618'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'DA DOVE PARTIAMO?', W / 2, 6, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    LEVELS.forEach((lv, i) => {
      const y = 26 + i * 17, open = i < this.max, on = i === this.sel;
      ctx.fillStyle = on ? 'rgba(255,77,109,0.85)' : open ? 'rgba(98,240,142,0.12)' : 'rgba(255,255,255,0.04)'; ctx.fillRect(10, y - 2, W - 20, 15);
      drawText(ctx, String(lv.n).padStart(2, ' '), 16, y + 2, open ? '#ffffff' : '#5a4a7a');
      drawText(ctx, open ? lv.title : '???', 34, y + 2, open ? '#ffffff' : '#5a4a7a');
      drawText(ctx, open ? lv.genre : 'BLOCCATO', W - 16, y + 2, open ? (on ? '#ffffff' : '#ffd23e') : '#5a4a7a', { align: 'right' });
    });
    drawText(ctx, '↑↓ SCEGLI · J CONFERMA · L INDIETRO', W / 2, 202, '#8a7aa8', { align: 'center' });
  },
};

// ---------------- FINALE ----------------
SCENES.ending = {
  enter() { Audio2.play('ending'); this.lines = ['GLI ANABLES MALVAGI SONO SCONFITTI.', 'LE OMBRE TORNANO NEGLI AMPLIFICATORI.', 'LA TOURNEE E\' FINITA: DIECI LOCALI,', 'DIECI GENERI, NEMMENO UN CONCERTO SALTATO.', '', 'MA IN FONDO AL COVO, UN JACK', 'RONZA ANCORA NEL BUIO...']; },
  update() { if (Game.t > 200 && CONFIRM(Input.menu())) { Audio2.sfxPlay('confirm'); Game.go('credits', { after: 'scores' }); } },
  draw(ctx) {
    ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
    const t = Game.t;
    drawBandRow(ctx, 214, t, CAST.map((c, i) => (G.players.find(p => p.char === c) || {}).costume || TITLE_COSTUMES[i]), 'victory');
    drawText(ctx, 'FINE DELLA TOURNEE', W / 2, 6, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    this.lines.forEach((l, i) => { if (t > 30 + i * 22) drawText(ctx, l, W / 2, 26 + i * 9, i >= 5 ? '#ff4d6d' : '#c9b8e8', { align: 'center', outline: '#0a0610' }); });
    if (t > 200 && (t >> 4) % 2) drawText(ctx, 'PREMI UN TASTO', W - 6, 216, '#ff7ad9', { align: 'right', outline: '#0a0610' });
  },
};

// ---------------- INIZIALI E CLASSIFICA ----------------
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789★ '.split('');
SCENES.initials = {
  enter(list) { this.list = list; this.i = 0; this.setup(); },
  setup() { const p = this.list[this.i]; this.p = p; this.pos = 0; this.letters = [p.char.name[0], p.char.name[1], p.char.name[2]].map(ch => LETTERS.indexOf(ch)); },
  update() {
    const inp = Input.state(this.p.src).pressed, m = Input.menu();
    const up = inp.up || m.up, down = inp.down || m.down;
    if (up) { this.letters[this.pos] = (this.letters[this.pos] + 1) % LETTERS.length; Audio2.sfxPlay('menu'); }
    if (down) { this.letters[this.pos] = (this.letters[this.pos] + LETTERS.length - 1) % LETTERS.length; Audio2.sfxPlay('menu'); }
    if (inp.left || m.left) this.pos = Math.max(0, this.pos - 1);
    if (inp.right || m.right) this.pos = Math.min(2, this.pos + 1);
    if (CONFIRM(m)) {
      Audio2.sfxPlay('confirm');
      if (this.pos < 2) { this.pos++; return; }
      const name = this.letters.map(i => LETTERS[i]).join('');
      SAVE.scores = (SAVE.scores || []).concat([{ name, score: this.p.score, char: this.p.char.name, d: new Date().toISOString().slice(0, 10) }]).sort((a, b) => b.score - a.score).slice(0, 10);
      saveAll();
      this.i++;
      if (this.i < this.list.length) this.setup(); else Game.go('scores', { back: 'title', hl: name });
    }
    if (BACK(m) && this.pos > 0) this.pos--;
  },
  draw(ctx) {
    ctx.fillStyle = '#0c0618'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'NUOVO RECORD!', W / 2, 30, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    ctx.fillStyle = shade(this.p.color, 0.35); ctx.fillRect(W / 2 - PORTRAIT_W, 46, PORTRAIT_W * 2, PORTRAIT_H * 2);
    blitHi(ctx, portrait(this.p.char, 2), W / 2 - PORTRAIT_W, 46);
    drawText(ctx, this.p.char.name + ' · ' + this.p.score, W / 2, 106, this.p.color, { align: 'center' });
    drawText(ctx, 'INSERISCI LE INIZIALI', W / 2, 118, '#c9b8e8', { align: 'center' });
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 36 + i * 26;
      if (i === this.pos && (Game.t >> 3) % 2) { ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x - 2, 154, 22, 2); }
      drawText(ctx, LETTERS[this.letters[i]], x, 132, i === this.pos ? '#ffffff' : '#8a7aa8', { scale: 3 });
    }
    drawText(ctx, '↑↓ LETTERA · CONFERMA PER AVANZARE', W / 2, 176, '#8a7aa8', { align: 'center' });
  },
};
SCENES.scores = {
  enter(arg) { this.back = (arg && arg.back) || 'menu'; this.hl = arg && arg.hl; if (this.back === 'title') Audio2.play('title'); },
  update() { const m = Input.menu(); if (Game.t > 20 && (CONFIRM(m) || BACK(m))) { Audio2.sfxPlay('back'); Game.go(this.back); } },
  draw(ctx) {
    drawBgStreet(ctx, Game.t + 900, 0.72);
    drawText(ctx, 'CLASSIFICA', W / 2, 8, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    const s = SAVE.scores || [];
    drawPanel(ctx, 60, 30, 264, 168);
    if (!s.length) drawText(ctx, 'ANCORA NESSUN PUNTEGGIO: TOCCA A TE!', W / 2, 106, '#c9b8e8', { align: 'center' });
    s.forEach((r, i) => {
      const y = 38 + i * 15, on = r.name === this.hl && (Game.t >> 3) % 2;
      drawText(ctx, String(i + 1).padStart(2, ' ') + '.', 72, y, i === 0 ? '#ffd23e' : '#c9b8e8');
      drawText(ctx, r.name, 100, y, on ? '#ff4d6d' : '#ffffff');
      drawText(ctx, r.char || '', 140, y, '#8a7aa8');
      drawText(ctx, String(r.score).padStart(7, '0'), 312, y, '#ffffff', { align: 'right' });
    });
  },
};

// ---------------- OPZIONI ----------------
SCENES.options = {
  sel: 0,
  rows() {
    return [
      { label: 'MUSICA', value: Opts.music }, { label: 'EFFETTI', value: Opts.sfx },
      { label: 'DIFFICOLTA\'', value: DIFFS[Opts.diff].name }, { label: 'SCALA PIXEL', value: Opts.scale === 'intera' ? 'INTERA' : 'ADATTA' },
      { label: 'COMANDI TOUCH', value: Opts.touch.toUpperCase() }, { label: 'COMPAGNO CPU (IN 1P)', value: Opts.cpu ? 'SI\'' : 'NO' },
      { label: 'SANGUE', value: Opts.blood ? 'SI\'' : 'NO' }, { label: 'FLASH RIDOTTI', value: Opts.flash ? 'NO' : 'SI\'' },
      { label: 'BATTUTE', value: Opts.lines === 'pulite' ? 'PULITE' : 'VOLGARI' },
      { label: 'AZZERA CLASSIFICA' }, { label: 'INDIETRO' },
    ];
  },
  update() {
    const m = Input.menu(), n = 11;
    if (m.up) { this.sel = (this.sel + n - 1) % n; Audio2.sfxPlay('menu'); }
    if (m.down) { this.sel = (this.sel + 1) % n; Audio2.sfxPlay('menu'); }
    const d = m.left ? -1 : m.right ? 1 : 0;
    if (d) {
      Audio2.sfxPlay('menu');
      if (this.sel === 0) Opts.music = clamp(Opts.music + d, 0, 10);
      if (this.sel === 1) Opts.sfx = clamp(Opts.sfx + d, 0, 10);
      if (this.sel === 2) Opts.diff = clamp(Opts.diff + d, 0, 2);
      if (this.sel === 3) Opts.scale = Opts.scale === 'intera' ? 'adatta' : 'intera';
      if (this.sel === 4) { const L = ['auto', 'sempre', 'mai']; Opts.touch = L[(L.indexOf(Opts.touch) + d + 3) % 3]; }
      if (this.sel === 5) Opts.cpu = !Opts.cpu;
      if (this.sel === 6) Opts.blood = !Opts.blood;
      if (this.sel === 7) Opts.flash = !Opts.flash;
      if (this.sel === 8) Opts.lines = Opts.lines === 'pulite' ? 'volgari' : 'pulite';
      applyOpts(); saveAll();
    }
    if (CONFIRM(m)) {
      if (this.sel === 5) { Opts.cpu = !Opts.cpu; saveAll(); Audio2.sfxPlay('menu'); }
      if (this.sel === 6) { Opts.blood = !Opts.blood; saveAll(); Audio2.sfxPlay('menu'); }
      if (this.sel === 7) { Opts.flash = !Opts.flash; saveAll(); Audio2.sfxPlay('menu'); }
      if (this.sel === 8) { Opts.lines = Opts.lines === 'pulite' ? 'volgari' : 'pulite'; saveAll(); Audio2.sfxPlay('menu'); }
      if (this.sel === 9) { if (this.confirmReset) { SAVE.scores = []; saveAll(); this.confirmReset = false; Audio2.sfxPlay('break'); } else { this.confirmReset = true; Audio2.sfxPlay('menu'); } }
      if (this.sel === 10) { Audio2.sfxPlay('back'); Game.go('menu'); }
    }
    if (this.sel !== 9) this.confirmReset = false;
    if (BACK(m)) { Audio2.sfxPlay('back'); Game.go('menu'); }
  },
  draw(ctx) {
    drawBgStreet(ctx, Game.t + 1300, 0.72);
    drawText(ctx, 'OPZIONI', W / 2, 14, '#ffd23e', { align: 'center', scale: 2, outline: '#3a1a00' });
    drawPanel(ctx, 70, 32, 244, 166);
    const r = this.rows();
    if (this.confirmReset) r[9].label = 'CONFERMI? PREMI DI NUOVO';
    menuList(ctx, r, this.sel, 84, 40, { w: 224 });
    const tip = this.sel === 6 ? 'SPENTO: NIENTE SCHIZZI, SOLO SCINTILLE' : this.sel === 7 ? 'MENO LAMPI E LUCI STROBOSCOPICHE' : this.sel === 8 ? 'VOLGARI: PAROLACCE E UMORISMO BECERO' : '←→ CAMBIA VALORE';
    drawText(ctx, tip, W / 2, 204, '#8a7aa8', { align: 'center' });
  },
};

// ---------------- COMANDI ----------------
function drawControls(ctx) {
  drawPanel(ctx, 12, 10, W - 24, H - 20, 'rgba(12,6,20,0.95)');
  drawText(ctx, 'COMANDI', W / 2, 16, '#ffd23e', { align: 'center', scale: 2 });
  const L = [
    ['', 'TASTIERA', 'GAMEPAD'],
    ['MUOVITI', 'FRECCE / WASD', 'LEVETTA / CROCE'],
    ['ATTACCO (COMBO)', 'J / Z', 'X  ·  QUADRATO'],
    ['SALTO', 'K / X / SPAZIO', 'A  ·  CROCE'],
    ['ATTACCO PESANTE', 'L / C', 'Y  ·  TRIANGOLO'],
    ['SPECIALE', 'I / V', 'B  ·  CERCHIO'],
    ['PAUSA', 'INVIO / ESC', 'START'],
  ];
  L.forEach((r, i) => { const y = 40 + i * 12; drawText(ctx, r[0], 22, y, i ? '#c9b8e8' : '#ffd23e'); drawText(ctx, r[1], 140, y, i ? '#ffffff' : '#ffd23e'); drawText(ctx, r[2], 262, y, i ? '#ffffff' : '#ffd23e'); });
  const T = [
    'CORSA: DOPPIO TOCCO AVANTI · CORSA+ATTACCO = CARICA',
    'PRESA: CAMMINA CONTRO UN NEMICO, POI ATTACCO O LANCIO',
    'SALTO E POI ATTACCO = COLPO IN VOLO',
    'SPECIALE: TASTO SPECIALE OPPURE ATTACCO+SALTO INSIEME',
    'BARRA PIENA: GRATIS · SENNO\' COSTA VITA SE COLPISCE',
    'ARMI: ATTACCO LE RACCOGLIE E LE USA · PESANTE LE LANCIA',
    'IN DUE VICINI, SPECIALE INSIEME = COLPO DI SQUADRA',
    '2P SU TASTIERA (TASTO 2): 1P WASD+FGHT, 2P FRECCE+1230',
  ];
  T.forEach((s, i) => drawText(ctx, s, W / 2, 122 + i * 11, (i === 3 || i === 5) ? '#ffd23e' : '#8a7aa8', { align: 'center' }));
}
SCENES.controls = {
  update() { const m = Input.menu(); if (Game.t > 10 && (CONFIRM(m) || BACK(m))) { Audio2.sfxPlay('back'); Game.go('menu'); } },
  draw(ctx) { drawBgStreet(ctx, Game.t + 1700, 0.8); drawControls(ctx); },
};

// ---------------- CREDITI ----------------
SCENES.credits = {
  lines: [
    ['THE ANABLES: ROCK \'N\' BRAWL', '#ffd23e', 2], ['', ''],
    ['LA BAND', '#ff7ad9'], ['ARRIGO · VOCE', '#ffffff'], ['MIKE · CHITARRA', '#ffffff'], ['DANNY · CHITARRA', '#ffffff'],
    ['MARIO "LA TRUFFA" · BASSO', '#ffffff'], ['TROY · BATTERIA', '#ffffff'], ['MARVIN · PIANO', '#ffffff'], ['', ''],
    ['I BOSS DELLA TOURNEE', '#ff7ad9'], ...LEVELS.map(l => [l.boss.name, '#ffffff']), ['', ''],
    ['ALLEATI IN ARRIVO', '#ff7ad9'], ['RAY E BENEDICT · BASSO', '#ffffff'], ['', ''],
    ['IDEA', '#ff7ad9'], ['MIRCO', '#ffffff'], ['', ''],
    ['GIOCO, PIXEL ART E MUSICA ORIGINALI', '#ff7ad9'], ['REALIZZATI CON CLAUDE', '#ffffff'], ['NESSUNA RISORSA DI TERZE PARTI', '#8a7aa8'], ['', ''],
    ['I PERSONAGGI SONO ISPIRATI', '#8a7aa8'], ['AI MEMBRI REALI DELLA BAND', '#8a7aa8'], ['', ''],
    ['GRAZIE PER AVER GIOCATO!', '#ffd23e'],
  ],
  enter(arg) { this.after = arg && arg.after; },
  update() {
    const m = Input.menu(), end = Game.t * 0.4 > this.lines.length * 13 + H + 20;
    if ((Game.t > 20 && (CONFIRM(m) || BACK(m))) || (this.after && end)) { Audio2.sfxPlay('back'); if (this.after) toInitialsOrScores(); else Game.go('menu'); }
  },
  draw(ctx) {
    drawBgStreet(ctx, Game.t + 2100, 0.78);
    const y0 = H - (Game.t * 0.4) % (this.lines.length * 13 + H + 20);
    this.lines.forEach(([s, c, sc], i) => { if (s) drawText(ctx, s, W / 2, y0 + i * 13, c, { align: 'center', scale: sc || 1, outline: '#0a0610' }); });
  },
};

// ---------------- SCHEDE PERSONAGGI ----------------
SCENES.cast = {
  i: 0, cos: 0,
  update() {
    const m = Input.menu();
    if (m.left) { this.i = (this.i + 5) % 6; Audio2.sfxPlay('menu'); }
    if (m.right) { this.i = (this.i + 1) % 6; Audio2.sfxPlay('menu'); }
    if (m.up) { this.cos = (this.cos + 3) % 4; Audio2.sfxPlay('menu'); }
    if (m.down) { this.cos = (this.cos + 1) % 4; Audio2.sfxPlay('menu'); }
    if (BACK(m) || m.start) { Audio2.sfxPlay('back'); Game.go('menu'); }
  },
  draw(ctx) {
    const c = CAST[this.i], ck = COSTUME_ORDER[this.cos], t = Game.t;
    ctx.fillStyle = '#100820'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { ctx.fillStyle = (y / 4) % 2 ? '#140a28' : '#120926'; ctx.fillRect(0, y, W, 4); }
    drawText(ctx, '< ' + c.name + (c.nick ? ' "' + c.nick + '"' : '') + ' >', W / 2, 4, c.color, { align: 'center', scale: 2, outline: '#0a0610' });
    const A = animsFor(c);
    const seed = ck === 'oro' ? (t >> 3) % 3 : 0;
    // posa principale a sinistra, su un piccolo palco
    drawPanel(ctx, 4, 22, 118, 198, 'rgba(20,10,32,0.9)', c.color);
    ctx.fillStyle = '#1e1236'; ctx.fillRect(5, 168, 116, 51); ctx.fillStyle = '#2e1a50'; ctx.fillRect(5, 168, 116, 1);
    const fi = Math.floor(t / 24) % A.idle.length;
    const f = getFrame(c.look, ck, A.idle[fi].p, 'idle' + fi + (seed ? '_' + seed : ''), seed);
    ctx.save(); ctx.beginPath(); ctx.rect(5, 23, 116, 196); ctx.clip();
    pixelShadow(ctx, 62, 182, 18, 4);
    drawSprite(ctx, f, 60, 182, 1);
    ctx.restore();
    const ql = wrapText(c.quotes.start, 18);
    ql.forEach((ln, i) => drawText(ctx, ln, 63, 192 + i * 9, '#c9b8e8', { align: 'center' }));
    // pose chiave
    const st = CHAR_STYLE[c.id] || { hits: 4, heavy: 'PESANTE', lines: [], sound: '' };
    const poses = [[CHAR_FINISHER[c.id] || 'l4', 1, 'COMBO X' + st.hits], [c.id === 'arrigo' ? 'lasso' : 'heavy', 1, st.heavy], ['sp', A.sp.length > 2 ? 2 : 1, 'SPECIALE'], ['victory', 0, 'VITTORIA']];
    poses.forEach(([an, idx, lab], k) => {
      const fr = A[an][Math.min(idx, A[an].length - 1)];
      const g = getFrame(c.look, ck, fr.p, an + idx);
      const x = 158 + k * 64;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 32, 20, 64, 100); ctx.clip();
      pixelShadow(ctx, x, 114, 13, 3);
      drawSprite(ctx, g, x, 114, 1);
      ctx.restore();
      drawText(ctx, lab, x, 116, '#8a7aa8', { align: 'center' });
    });
    drawPanel(ctx, 126, 126, 254, 94, 'rgba(12,6,20,0.92)', c.color);
    drawText(ctx, c.role + ' · ' + c.instName, 132, 131, '#ffd23e');
    const stats = [['FORZA', c.stats.str], ['VELOCITA\'', c.stats.spd], ['PORTATA', c.stats.rch], ['RESISTENZA', c.stats.end]];
    stats.forEach(([n, v], i) => { drawText(ctx, n, 132, 142 + i * 9, '#c9b8e8'); for (let k = 0; k < 5; k++) { ctx.fillStyle = k < v ? c.color : '#3a2a4a'; ctx.fillRect(204 + k * 8, 142 + i * 9, 6, 6); } });
    drawText(ctx, 'COSTUME ↑↓', 284, 142, '#8a7aa8');
    drawText(ctx, COSTUMES[ck].short, 284, 151, '#ffffff');
    drawText(ctx, 'SUONO: ' + st.sound, 132, 179, '#ffd23e');
    drawText(ctx, 'SPECIALE: ' + c.special.name, 132, 188, '#3ec5ff');
    st.lines.forEach((ln, i) => drawText(ctx, ln, 132, 198 + i * 9, '#c9b8e8'));
  },
};

// ---------------- AVVIO E CICLO ----------------
let _acc = 0, _last = 0;
function frame(ts) {
  if (!_last) _last = ts;
  let dt = ts - _last; _last = ts;
  if (dt > MAX_FRAME_MS) dt = MAX_FRAME_MS;
  _acc += dt;
  let steps = 0;
  while (_acc >= STEP_MS && steps < 8) {
    Input.poll();
    try { Game.update(); } catch (e) { console.error(e); }
    _acc -= STEP_MS; steps++;
  }
  lctx.setTransform(RS, 0, 0, RS, 0, 0); lctx.imageSmoothingEnabled = false;
  try { Game.draw(lctx); } catch (e) { console.error(e); }
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(LC, 0, 0, DC.width, DC.height);
  requestAnimationFrame(frame);
}

function boot() {
  DC = document.getElementById('screen');
  dctx = DC.getContext('2d');
  Input.init();
  Touch.init();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  applyOpts();
  resize();
  // le parti fotografiche dei personaggi vanno decodificate prima di disegnare qualsiasi sprite
  Atlas.load().then(() => {
    Game.go('title');
    // unico punto di accesso per i test automatici
    window.__AN = { G, Game, Input, CAST, SCENES, startGame, startLevel, Audio2, Atlas };
    requestAnimationFrame(frame);
  });
}
