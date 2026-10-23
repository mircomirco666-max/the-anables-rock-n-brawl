// ============================================================
// GIOCATORE: movimento libero sulle corsie, combo a catena, attacco pesante,
// salto e attacco in salto, corsa (doppio tocco), presa e lancio, speciali.
// ============================================================
function makeMoves(c) {
  const S = deriveStats(c), R = S.reach, sp = S.atkSpeed;
  const f = a => Math.max(1, Math.round(a / sp));
  const I = INSTRUMENTS[c.look.instrument] || { reach: 12 };
  const sw = I.reach / K;
  const fist = c.family === 'mic' ? 8 : 0; // il microfono allunga i primi colpi
  const S_ = hb => ({ x0: hb.x0 * K, x1: hb.x1 * K, y0: hb.y0 * K, y1: hb.y1 * K });
  const M = {
    l1: { anim: 'l1', fr: [f(4), 3, f(9)], dmg: 4, hb: S_({ x0: 4, x1: 22 + R * 2, y0: 28, y1: 52 }), knock: 'light', stun: 17, push: 0.98, next: 'l2', sfx: 'swing' },
    l2: { anim: 'l2', fr: [f(4), 3, f(10)], dmg: 4, hb: S_({ x0: 4, x1: 22 + R * 2 + fist * 2, y0: 28, y1: 52 }), knock: 'light', stun: 18, push: 1.12, next: 'l3', sfx: 'swing' },
    l3: { anim: 'l3', fr: [f(5), 4, f(12)], dmg: 5, hb: S_({ x0: 2, x1: 16 + sw * 0.6 + R * 2, y0: 12, y1: 48 }), knock: 'light', stun: 20, push: 1.54, next: 'l4', sfx: 'swing' },
    l4: { anim: 'l4', fr: [f(8), 4, f(18)], dmg: 9, hb: S_({ x0: -2, x1: 18 + sw * 0.7 + R * 2, y0: 6, y1: 58 }), knock: 'down', hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 2, sfx: 'swingBig', meter: 6 },
    heavy: { anim: 'heavy', fr: [f(12), 4, f(20)], dmg: 12, hb: S_({ x0: -6, x1: 20 + sw * 0.8 + R * 2, y0: 10, y1: 52 }), knock: 'down', hsA: TUNE.hsHeavy, hsV: 10, shake: 2, sfx: 'swingBig', meter: 6 },
    jatk: { anim: 'jatk', dmg: 8, hb: S_({ x0: -2, x1: 18 + R * 2 + sw * 0.4, y0: -10, y1: 40 }), knock: 'down', hsA: 7, hsV: 9, sfx: 'swing' },
    rjatk: { anim: 'jatk', dmg: 12, hb: S_({ x0: -4, x1: 22 + R * 2 + sw * 0.4, y0: -12, y1: 44 }), knock: 'down', launch: 1.35, hsA: 8, hsV: 10, shake: 2, sfx: 'swingBig', meter: 5 },
    stomp: { dmg: 5, hsA: 5, hsV: 6, meter: 2 },
    ratk: { anim: 'ratk', fr: [3, 12, f(16)], dmg: 9, hb: S_({ x0: 0, x1: 24 + R * 2, y0: 12, y1: 50 }), knock: 'down', shake: 2, sfx: 'swingBig', hsA: 8, hsV: 10 },
    grabhit: { dmg: 4, hb: S_({ x0: 0, x1: 26, y0: 10, y1: 44 }), knock: 'none', hsA: 6, hsV: 8, meter: 3 },
    throwLand: { dmg: 12, knock: 'down', hsA: 0, hsV: 8, shake: 3 },
    thrownHit: { dmg: 10, knock: 'down', hsA: 0, hsV: 8, hb: S_({ x0: -12, x1: 12, y0: -10, y1: 50 }) },
    // lancio dell'arma impugnata (tasto FORTE)
    wtoss: { anim: 'toss', fr: [f(9), 3, f(14)], shoot: 'toss', sfx: 'throw' },
  };
  // ogni musicista ha la sua combo, il suo colpo pesante, in corsa e in volo (06b_movesets.js)
  if (typeof CHAR_MOVES !== 'undefined' && CHAR_MOVES[c.id]) CHAR_MOVES[c.id](M, { f, R, sw, S_, K });
  for (const k in M) {
    const m = M[k];
    if (k.startsWith('w:') || k === 'wtoss' || k === 'throwLand' || k === 'thrownHit') continue;
    m.inst = true;                                    // suona lo strumento del musicista
    if (m.last) m.lastMv = Object.assign({}, m, m.last, { multi: 0, last: null });
  }
  // armi raccolte (le hitbox sono già in scala mondo)
  for (const k in WEAPONS) {
    const Wd = WEAPONS[k], d = Wd.dmg || [8], R = Wd.reach || 80, gore = Wd.gore || 0;
    if (Wd.hold === 'club') {
      const fast = !!Wd.fast;
      M['w:' + k + ':1'] = { anim: k + '_s1', fr: fast ? [f(4), 3, f(9)] : [f(7), 4, f(14)], dmg: d[0], hb: { x0: -4, x1: R, y0: 20, y1: 104 }, knock: 'light', stun: Wd.stun || 22, push: (Wd.push || 1.8) * 0.7, next: 'w:' + k + ':2', sfx: 'swingBig', wsfx: Wd.sfx, melee: true, meter: 4, gore };
      M['w:' + k + ':2'] = { anim: k + '_s2', fr: fast ? [f(5), 3, f(10)] : [f(8), 4, f(16)], dmg: d[1], hb: { x0: -8, x1: R + 2, y0: 16, y1: 86 }, knock: fast ? 'light' : 'down', stun: Wd.stun || 22, push: Wd.push || 1.8, next: fast ? 'w:' + k + ':3' : null, hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 2, sfx: 'swingBig', wsfx: Wd.sfx, melee: true, meter: 5, gore, launch: Wd.push ? 1.5 : 1 };
      if (fast) M['w:' + k + ':3'] = Object.assign({}, M['w:' + k + ':1'], { dmg: d[2] || d[1], knock: 'down', next: null, hsA: TUNE.hsFinA, hsV: TUNE.hsFinV });
    } else if (Wd.hold === 'heavy') {
      M['w:' + k + ':1'] = { anim: k + '_slam', fr: [f(16), 5, f(24)], dmg: d[0], hb: { x0: -6, x1: R, y0: 0, y1: 112 }, knock: 'down', hsA: 11, hsV: 12, shake: 4, sfx: 'swingBig', melee: true, meter: 6, gore, launch: 1.3, crack: true };
    } else if (Wd.hold === 'saw') {
      M['w:' + k + ':1'] = { anim: k + '_saw', fr: [6, 12, 12], dmg: d[0], hb: { x0: 0, x1: R, y0: 24, y1: 92 }, knock: 'light', stun: 16, push: 0.35, hsA: 1, hsV: 3, saw: true, gore, meter: 1 };
    } else {
      const gun = Wd.hold === 'gun';
      M['w:' + k + ':1'] = { anim: k + (gun ? '_shoot' : '_throw'), fr: Wd.shot === 'flame' ? [4, 24, f(12)] : Wd.shot === 'water' ? [4, 10, f(10)] : gun ? [5, 4, f(14)] : [f(7), 3, f(12)], shoot: Wd.shot, sfx: Wd.shot === 'confetti' ? 'confetti' : gun ? 'none' : 'throw' };
    }
  }
  return M;
}

class Player extends Actor {
  constructor(slot, src, char, costume) {
    super({ team: 'p' });
    this.slot = slot; this.src = src; this.char = char; this.look = char.look; this.costume = costume;
    this.anims = animsFor(char);
    this.S0 = deriveStats(char); this.S = Object.assign({}, this.S0);
    this.moves = makeMoves(char);
    this.maxHp = this.hp = this.S.maxHp;
    this.dmgMul = this.S.dmg; this.defense = this.S.defense;
    this.perks = {}; this.lineCD = {}; this.fartT = 0; this.recalcPerks();
    this.lives = 3; this.score = 0; this.meter = 40;
    this.comboCount = 0; this.comboT = 0; this.bestCombo = 0;
    this.buf = { atk: 99, jump: 99, heavy: 99, spec: 99 };
    this.tap = { dir: 0, t: 99, held: 0 };
    this.running = false; this.grabCand = null; this.grabCandT = 0; this.knees = 0;
    this.move = null; this.mvT = 0; this.mvHit = false;
    this.active = true; this.out = false; this.koT = 0; this.reviveP = 0;
    this.powerT = 0; this.color = PCOL[slot]; this.bubble = null;
    this.radius = 13; this.hurtW = 28; this.hurtH = 90 * (char.look.build.h || 1);
    this.kills = 0; this.jAtkUsed = false; this.specialStartFrame = -99;
    this.wpn = null;   // arma raccolta: { kind, uses }
  }
  // con un'arma in mano le animazioni hanno una variante dedicata (es. tubo_walk)
  play(anim) { if (this.wpn) { const a2 = this.wpn.kind + '_' + anim; if (this.anims[a2]) anim = a2; } super.play(anim); }
  restart(anim) { if (this.wpn) { const a2 = this.wpn.kind + '_' + anim; if (this.anims[a2]) anim = a2; } super.restart(anim); }
  get input() { return Input.state(this.src); }
  setState(s, anim) {
    if (s !== 'attack' && s !== 'special' && s !== 'team') { if (this.spinning) { this.drawFacing = undefined; this.spinning = false; } this.superArmor = false; }
    super.setState(s, anim);
  }
  resetForLevel(i) {
    this.x = 60 + i * 40; this.z = 156 + i * 16; this.y = 0; this.vx = this.vy = 0; this.facing = 1;
    this.hp = this.maxHp; this.wpn = null; this.grabbing = null; this.grabbedBy = null; this.bubble = null;
    this.comboCount = 0; this.comboT = 0; this.powerT = 0; this.inv = 60; this.untouchable = false; this.hidden = false;
    if (this.state === 'ko' || this.state === 'dead') this.lives = Math.max(1, this.lives);
    if (!this.out) this.setState('idle', 'idle');
    this.hitList.clear(); this.lastTarget = null; this.specCost = 0; this.drawFacing = undefined;
  }
  gainMeter(v) { this.meter = Math.min(100, this.meter + v * (this.meterMul || 1)); }
  addScore(v) { this.score += Math.round(v); }
  say(txt, t = 80) { this.bubble = { txt, t }; }
  // battuta del musicista per un evento (con probabilità e tempo di ricarica in frame)
  line(ev, prob = 1, cd = 0) {
    if (!chance(prob) || (cd && G.frame - (this.lineCD[ev] ?? -1e9) < cd)) return false;
    const L = BAND_LINES[this.char.id]; const s = L && pickLine(L[ev]); if (!s) return false;
    this.lineCD[ev] = G.frame; this.say(s, 40 + s.length * 2); return true;
  }
  // ---------------- potenziamenti ----------------
  recalcPerks() {
    const P = this.perks, S0 = this.S0, v = k => P[k] || 0;
    this.S = Object.assign({}, S0, { walkX: S0.walkX * (1 + 0.08 * v('velocita')), walkZ: S0.walkZ * (1 + 0.08 * v('velocita')), run: S0.run * (1 + 0.08 * v('velocita')) });
    this.dmgMul = S0.dmg * (1 + 0.15 * v('forza'));
    this.defense = S0.defense * (1 - 0.12 * v('difesa'));
    const old = this.maxHp || S0.maxHp; this.maxHp = S0.maxHp + 15 * v('vita');
    if (this.maxHp > old) this.hp += this.maxHp - old; this.hp = Math.min(this.hp, this.maxHp);
    this.meterMul = 1 + 0.35 * v('carica');
    this.reachBonus = 8 * v('portata');
  }
  gainPerk(k, at) {
    const lv = this.perks[k] || 0;
    if (lv >= PERK_MAX) { this.addScore(1000); popText('+1000', at.x, at.z, 80, '#ffd23e', 40); Audio2.sfxPlay('coin'); return; }
    this.perks[k] = lv + 1; this.recalcPerks();
    Audio2.sfxPlay('power'); glitter(this.x, this.z, 60, 8);
    popText(perkName(k) + (lv ? ' LV' + (lv + 1) : '') + '!', at.x, at.z, 96, PERKS[k].col, 70);
    popText(PERKS[k].desc, at.x, at.z, 84, '#ffffff', 70);
    this.line('power', 0.8);
  }
  // morendo i potenziamenti volano via: restano a terra per qualche secondo
  dropPerks() {
    let n = 0;
    for (const k of PERK_KEYS) for (let i = 0; i < (this.perks[k] || 0); i++) {
      const a = rand(-1, 1) * Math.PI;
      G.pickups.push(new Pickup('perk_' + k, this.x + Math.cos(a) * 10, this.z + Math.sin(a) * 6, { vx: Math.cos(a) * 3.2, vy: 5 + rand(0, 2), y: 30, ttl: 600 }));
      n++;
    }
    this.perks = {}; this.recalcPerks();
    if (n) popText('POTENZIAMENTI PERSI!', this.x, this.z, 120, '#ff9b45', 80);
  }
  // fagioli alla diavola: dopo un attimo... scoreggia devastante
  updateFart() {
    if (this.fartT <= 0 || --this.fartT > 0) return;
    const dir = -this.facing;
    G.projs.push(new Cloud(this, this.x + dir * 26, this.z, '#9ab04a', { life: 110, dmg: 4 }));
    for (const e of G.enemies) if (canBeHit(e) && Math.abs(e.z - this.z) < 22 && Math.abs(e.x - this.x) < 80) applyHit(this, e, { dmg: 10, knock: 'down', hsA: 0, hsV: 8, launch: 1.2, meter: 2 }, { dir: sign(e.x - this.x) || dir, noStopA: true });
    for (let i = 0; i < 8; i++) addFx('smoke', this.x + dir * rand(10, 40), this.z, rand(10, 50), { life: 40, col: '#9ab04a' });
    Audio2.sfxPlay('fart'); G.shake(2, 10);
    popText(pickLine(['PRRRRRRT!', '~PRRRRRRT! SCUSATE!']), this.x, this.z, 120, '#b8d060', 60);
    this.line('food', 0.5);
  }
  onHurt() {
    if (G.frame - (this._hurtSnd ?? -99) > 24) { this._hurtSnd = G.frame; Audio2.charSfx(this.char.id, 'hurt'); }
    this.line('hit', 0.18, 300);
    if (this.hp > 0 && this.hp < this.maxHp * 0.25 && !this.saidLow) { this.saidLow = true; this.line('low', 1); }
  }
  comboMult() { return 1 + Math.min(3, Math.floor(this.comboCount / 5) * 0.5); }

  onHit(t, mv, dmg) {
    if (t.team !== 'e') return;
    if (this.state === 'attack' && this.move && this.move.melee && !this.mvHit) {
      if (this.move.wsfx) { Audio2.sfxPlay(this.move.wsfx); if (this.move.wsfx === 'splat') popText('SPLAT!', t.x, t.z, 110, '#9ad8ff', 22); if (this.move.wsfx === 'squeak') popText('SQUIT!', t.x, t.z, 110, '#ff7ab8', 22); }
      this.useWeapon();
    }
    this.comboCount++; this.comboT = TUNE.comboWindow; this.mvHit = true;
    this.bestCombo = Math.max(this.bestCombo, this.comboCount);
    G.stats.maxCombo = Math.max(G.stats.maxCombo, this.comboCount);
    this.addScore(10 * this.comboMult());
    this.gainMeter(mv.meter ?? 3.2);
    if (t.lastHitBy && t.lastHitBy !== this && G.frame - t.lastHitT < 60) {
      this.addScore(50); G.stats.teamHits++;
      if (!t._teamPop || G.frame - t._teamPop > 90) { popText('COMBO DI SQUADRA!', t.x, t.z, 110, '#ffd23e'); t._teamPop = G.frame; }
    }
    t.lastHitBy = this; t.lastHitT = G.frame;
    this.lastTarget = t; this.lastTargetT = G.frame;
    if (this.specCost && G.frame < this.specCostUntil) { this.hp = Math.max(1, this.hp - this.specCost); this.specCost = 0; }
  }
  onKill(e) {
    this.kills++; this.addScore(e.def.score * this.comboMult());
    if (e.isBoss) this.line('win', 1); else this.line('kill', 0.3, 240);
    // commenti sulle combo lunghe
    const c = this.comboCount;
    if (c >= 10 && c % 10 === 0) popText(pickLine(c >= 30 ? ['MACELLERIA!', '~CHE CARNEFICINA DEL CAZZO!'] : c >= 20 ? ['BRUTALE!', '~CHE MAZZATE DI MERDA!'] : ['SPACCATUTTO!', '~CHE BOTTE, CAZZO!']), this.x, this.z, 130, '#ffd23e', 60);
  }

  // ---------------- aggiornamento ----------------
  update() {
    if (!this.active) return;
    const inp = this.input;
    for (const k of ['atk', 'jump', 'heavy', 'spec']) this.buf[k] = inp.pressed[k] ? 0 : Math.min(99, this.buf[k] + 1);
    // COLPO + SALTO quasi insieme (entro 2 frame) = speciale, come nei picchiaduro Capcom
    if (inp.pressed.atk) this.pAtk = G.frame;
    if (inp.pressed.jump) this.pJump = G.frame;
    this.comboSpec = (inp.pressed.atk || inp.pressed.jump) && Math.abs((this.pAtk ?? -99) - (this.pJump ?? -99)) <= 2;
    const dx = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0);
    const dz = (inp.held.down ? 1 : 0) - (inp.held.up ? 1 : 0);
    // doppio tocco per correre
    this.tap.t++;
    if ((inp.pressed.left || inp.pressed.right)) {
      const d = inp.pressed.right ? 1 : -1;
      if (this.tap.dir === d && this.tap.t < TUNE.doubleTap) this.running = true;
      this.tap.dir = d; this.tap.t = 0;
    }
    if (dx === 0 || (this.running && dx !== this.facing)) this.running = false;

    this.tickTimers();
    if (this.powerT > 0) this.powerT--;
    if (this.bubble && --this.bubble.t <= 0) this.bubble = null;
    if (this.fartT > 0 && !this.out && this.hp > 0) this.updateFart();
    if (this.comboT > 0 && --this.comboT === 0) this.comboCount = 0;
    if (this.hitstop > 0) { this.hitstop--; if (this.shakeT > 0) this.shakeT--; return; }
    if (this.shakeT > 0) this.shakeT--;
    this.st++; this.animT++;

    if (this.out) return;
    const s = this.state;
    if (s === 'idle' || s === 'walk') this.updateFree(inp, dx, dz);
    else if (s === 'jump') this.updateJump(inp, dx, dz);
    else if (s === 'jatk') this.updateJatk(dx, dz);
    else if (s === 'land') { if (this.st >= 6) this.setState('idle', 'idle'); }
    else if (s === 'attack') this.updateAttack(inp, dx, dz);
    else if (s === 'grab') this.updateGrab(inp, dx);
    else if (s === 'grabhit') this.updateGrabHit();
    else if (s === 'throw') this.updateThrow();
    else if (s === 'special') this.updateSpecial(dx, dz);
    else if (s === 'grabbedE') this.updateGrabbedE(inp);
    else if (s === 'dead') this.updateDead();
    else if (s === 'ko') this.updateKO();
    else if (s === 'enter') this.updateEnter();
    else if (s === 'victory') { this.play('victory'); }
    else if (s === 'team') { this.play('victory'); if (this.st >= 46) { this.inv = 20; this.untouchable = false; this.setState('idle', 'idle'); } }
    else this.commonUpdate();

    if (!['dead', 'ko', 'enter'].includes(this.state)) {
      this.x = clamp(this.x, G.cam.x + 16, G.cam.x + W - 16);
      if (G.level && G.level.worldEnd) this.x = Math.min(this.x, G.level.worldEnd - 20);
    }
    this.clampLane();
  }

  updateFree(inp, dx, dz) {
    if (this.buf.spec <= TUNE.bufferFrames) { this.buf.spec = 99; if (this.doSpecial()) return; }
    if (this.comboSpec) { this.comboSpec = false; this.buf.atk = this.buf.jump = 99; if (this.doSpecial()) return; }
    if (this.buf.jump <= 3) { this.buf.jump = 99; this.doJump(dx); return; }
    if (this.buf.heavy <= TUNE.bufferFrames) { this.buf.heavy = 99; this.startMove(this.wpn ? 'wtoss' : 'heavy'); return; }
    if (this.buf.atk <= TUNE.bufferFrames) {
      this.buf.atk = 99;
      if (this.tryRevive()) return;
      if (!this.wpn && this.tryPickWeapon()) return;
      if (this.wpn && this.wpn.uses <= 0) { this.startMove('wtoss'); return; }   // arma scarica: si lancia
      if (this.wpn) { this.startMove('w:' + this.wpn.kind + ':1'); return; }
      if (this.tryStomp()) return;
      this.startMove(this.running ? 'ratk' : 'l1'); return;
    }
    const spd = this.running ? this.S.run : this.S.walkX;
    this.x += dx * spd; this.z += dz * this.S.walkZ;
    if (dx) this.facing = dx;
    const moving = dx || dz;
    this.state = moving ? 'walk' : 'idle';
    this.play(moving ? (this.running ? 'run' : 'walk') : 'idle');
    // presa: camminando contro un nemico
    if (dx && !this.running && !this.wpn) {
      const e = G.enemies.find(e => e.grabbable() && Math.abs(e.z - this.z) < 7 && (e.x - this.x) * this.facing > 6 && (e.x - this.x) * this.facing < this.radius + e.radius + 8);
      if (e && e === this.grabCand) { if (++this.grabCandT >= 5) this.startGrab(e); }
      else { this.grabCand = e || null; this.grabCandT = 0; }
    } else this.grabCandT = 0;
  }
  doJump(dx) {
    this.setState('jump', 'jump');
    this.vy = TUNE.jumpV; this.vx = dx * (this.running ? this.S.run * 0.9 : this.S.walkX * 1.1);
    this.runJump = this.running && dx !== 0;   // salto in corsa: il colpo in volo diventa un calcio volante
    this.jAtkUsed = false; this.running = false;
    Audio2.charSfx(this.char.id, 'jump');
  }
  airPhysics(dx, dz) {
    this.x += this.vx; this.z += dz * this.S.walkZ * 0.6;
    if (dx && Math.sign(dx) !== Math.sign(this.vx)) this.vx = approach(this.vx, dx * this.S.walkX, 0.08);
    this.vy -= TUNE.gravity; this.y += this.vy;
    if (this.vy < 0 && this.state === 'jump') this.play('fall');
    if (this.y <= 0) { this.y = 0; this.vy = 0; Audio2.sfxPlay('land'); dust(this.x, this.z, 3); this.setState('land', 'land'); return true; }
    return false;
  }
  updateJump(inp, dx, dz) {
    if (this.st <= 3 && this.comboSpec) { this.comboSpec = false; this.buf.atk = this.buf.jump = 99; if (this.doSpecial()) return; }
    if (this.buf.atk <= 4 && !this.jAtkUsed) {
      this.buf.atk = 99; this.jAtkUsed = true; const jm = this.runJump ? this.moves.rjatk : this.moves.jatk;
      this.setState('jatk', jm.anim || 'jatk'); this.hitList.clear(); this.noteStep = 0; this.swingSfx(jm); return;
    }
    if (this.buf.spec <= 2) { this.buf.spec = 99; if (this.doSpecial()) return; }
    this.airPhysics(dx, dz);
  }
  updateJatk(dx, dz) {
    const jm = this.runJump ? this.moves.rjatk : this.moves.jatk;
    const nf = (this.anims[this.anim] || [0]).length;
    this.frameIdx = jm.rehit && this.st >= jm.rehit ? Math.min(1, nf - 1) : 0;
    if (jm.rehit && this.st === jm.rehit) { this.hitList.clear(); this.noteStep = 1; this.swingSfx(jm); }
    if (this.st > 3) checkMove(this, jm.rehit && this.st >= jm.rehit && jm.lastMv ? jm.lastMv : jm, G.enemies);
    if (this.runJump && this.st % 3 === 0) addFx('streak', this.x - this.facing * 14, this.z, this.y + 40, { life: 10, dir: this.facing, col: this.color });
    this.airPhysics(dx, dz);
  }
  startMove(name) {
    const m = this.moves[name];
    this.move = m; this.moveName = name; this.mvT = 0; this.mvHit = false; this.hitList.clear();
    this.setState('attack', m.anim); this.frameIdx = 0; this.noteStep = 0;
    if (m.dash) this.vx = this.facing * this.S.run * m.dash;
    else if (name === 'ratk') { this.vx = this.facing * this.S.run; }
    else this.vx = 0;
    this.superArmor = !!m.armor;
  }
  // fruscio del colpo: lo strumento del musicista per le sue mosse, il suono dell'arma per le armi
  swingSfx(m) { if (m.inst) Audio2.charSfx(this.char.id, 'swing', { mv: m }); else Audio2.sfxPlay(m.sfx || 'swing'); }
  // suono del colpo a segno: una sola nota per fotogramma anche se colpisce più nemici
  hitSfx(mv, dmg) {
    if (this._hitSndF === G.frame) return; this._hitSndF = G.frame;
    Audio2.charSfx(this.char.id, 'hit', { mv, dmg, step: this.noteStep || 0, combo: this.comboCount, big: mv.knock === 'down' || dmg >= 10 });
  }
  updateAttack(inp, dx, dz) {
    const m = this.move, [su, ac, re] = m.fr, t = this.mvT++;
    if (t <= 3 && this.comboSpec && !m.shoot && !m.saw) { this.comboSpec = false; this.buf.atk = this.buf.jump = 99; if (this.doSpecial()) return; }
    if (m.saw) return this.updateSaw(inp, m, su, t);
    // armi a getto continuo: lacca (fiamme) e acqua santa (gocce)
    if (m.shoot === 'flame' || m.shoot === 'water') {
      const every = m.shoot === 'flame' ? 3 : 4;
      this.frameIdx = t < su ? 0 : t < su + ac ? 1 : 2;
      if (t >= su && t < su + ac && (t - su) % every === 0) this.fireWeapon(m.shoot, t === su);
      if (t >= su + ac + re) this.setState('idle', 'idle');
      return;
    }
    const nf = (this.anims[this.anim] || [0, 0, 0]).length;
    if (nf > 3) {
      // pose intermedie durante il colpo attivo (giri, raffiche, glissando)
      const k = m.cycle ? 1 + Math.floor((t - su) / m.cycle) % (nf - 2) : 1 + Math.min(nf - 3, Math.floor((t - su) * (nf - 2) / Math.max(1, ac)));
      this.frameIdx = t < su ? 0 : t < su + ac ? k : nf - 1;
    } else this.frameIdx = t < su ? 0 : t < su + ac ? 1 : 2;
    if (t === su) this.swingSfx(m);
    if (m.dash || this.moveName === 'ratk') { this.x += this.vx; this.vx *= m.fric ?? 0.93; }
    else if (t >= su && t < su + ac) this.x += this.facing * (m.shoot ? 0 : (m.lunge ?? 0.8));
    if (m.spin && t >= su && t < su + ac) { this.spinning = true; this.drawFacing = Math.floor((t - su) / m.spin) % 2 ? -this.facing : this.facing; }
    else if (this.spinning && t >= su + ac) { this.spinning = false; this.drawFacing = undefined; }
    if (m.shock && t === su + 1) { const o = m.shock, sh = new Shock(this, this.x + this.facing * (o.dx || 40), this.z, this.facing, { dmg: o.dmg, speed: o.speed, col: o.col }); for (const e of this.hitList) sh.hit.add(e); G.projs.push(sh); if (o.dust) dust(this.x + this.facing * 50, this.z, o.dust); }
    if (m.shoot && t === su) this.fireWeapon(m.shoot, true);
    if (this.moveName === 'stomp' && t === su) this.doStompHit();
    if (m.crack && t === su + 1) { dust(this.x + this.facing * 60, this.z, 14); G.shake(4, 10); G.projs.push(new Shock(this, this.x + this.facing * 50, this.z, this.facing, { dmg: 8, speed: 5.5, col: '#ff6a5a' })); }
    if (m.shoot === 'confetti' && t === su + 1) this.x -= this.facing * 3;  // rinculo
    if (m.hb && t >= su && t < su + ac) {
      if (m.multi) {
        // colpi multipli nello stesso attacco: la lista dei colpiti si azzera a ogni battuta
        const iv = Math.max(1, Math.ceil(ac / m.multi)), hi = Math.min(m.multi - 1, Math.floor((t - su) / iv));
        if ((t - su) % iv === 0 && t > su) { this.hitList.clear(); }
        this.noteStep = hi;
        checkMove(this, hi === m.multi - 1 && m.lastMv ? m.lastMv : m, G.enemies);
      } else checkMove(this, m, G.enemies);
    }
    // catena di combo: solo se il colpo è andato a segno
    if (t >= su + ac) {
      if (this.mvHit && m.next && this.buf.atk <= TUNE.bufferFrames) { this.buf.atk = 99; this.startMove(m.next); return; }
      if (this.mvHit && this.buf.heavy <= TUNE.bufferFrames && this.moveName !== 'heavy') { this.buf.heavy = 99; this.startMove('heavy'); return; }
      if (this.buf.spec <= TUNE.bufferFrames) { this.buf.spec = 99; if (this.doSpecial()) return; }
    }
    if (t >= su + ac + re) { this.setState('idle', 'idle'); }
  }

  // calcio a chi è a terra (al massimo due volte per caduta)
  tryStomp() {
    const standing = G.enemies.some(e => canBeHit(e) && Math.abs(e.z - this.z) < 12 && (e.x - this.x) * this.facing > -6 && (e.x - this.x) * this.facing < 60);
    if (standing) return false;
    const e = G.enemies.find(e => e.alive && e.hp > 0 && e.state === 'down' && !e.isBoss && (e.stomps || 0) < 2 && Math.abs(e.z - this.z) < 12 && Math.abs(e.x - this.x) < 46);
    if (!e) return false;
    this.facing = sign(e.x - this.x) || this.facing;
    this.move = { anim: 'stomp', fr: [5, 3, 12] }; this.moveName = 'stomp'; this.mvT = 0; this.mvHit = true; this.hitList.clear();
    this.setState('attack', 'stomp'); this.frameIdx = 0; this.stompT = e;
    return true;
  }
  doStompHit() {
    const e = this.stompT; this.stompT = null;
    if (!e || !e.alive || e.state !== 'down') return;
    e.stomps = (e.stomps || 0) + 1;
    const dmg = Math.max(1, Math.round(this.moves.stomp.dmg * this.dmgMul * (e.defense || 1)));
    e.hp -= dmg; e.flashT = 4; e.downTime = Math.max(e.downTime || 34, e.st + 20); if (e.hp <= 0) e.willDie = true;
    sparks(e.x, e.z, 10, false); if (e.bloodCol && goreOn()) blood(e.x, e.z, 8, 4, this.facing, e.bloodCol);
    Audio2.sfxPlay('hit'); G.shake(1, 4); this.hitstop = 4; e.hitstop = 5; this.addScore(30); this.gainMeter(2);
    if (chance(0.4)) popText(pickLine(['E STAI GIU\'!', '~E STAI GIU\', STRONZO!', '~BECCATI QUESTO, MERDA!']), e.x, e.z, 60, '#ffd23e', 30);
  }
  // ---------------- armi raccolte ----------------
  tryPickWeapon() {
    const it = G.pickups.find(o => o.isWeapon && o.alive && o.y < 6 && Math.abs(o.x - this.x) < 26 && Math.abs(o.z - this.z) < 12);
    if (!it) return false;
    it.alive = false;
    this.wpn = { kind: it.kind, uses: it.uses };
    Audio2.sfxPlay('pickup');
    popText(WEAPONS[it.kind].name + '!', this.x, this.z, 120, '#ffffff', 40);
    this.line('weapon', 0.5, 300);
    this.setState('land', 'land'); this.st = 0;   // si china a raccoglierla
    return true;
  }
  useWeapon() {
    if (!this.wpn) return;
    const Wd = WEAPONS[this.wpn.kind];
    if (Wd.hold === 'gun' && this.wpn.uses > 0 && --this.wpn.uses <= 0) { popText(pickLine(['SCARICO!', '~SCARICO, CAZZO!']), this.x, this.z, 110, '#ff9b45', 40); return; }
    if (Wd.hold === 'gun') return;
    if (--this.wpn.uses <= 0) {
      const k = this.wpn.kind; this.wpn = null;
      popText('ROTTO!', this.x + this.facing * 40, this.z, 100, '#ff9b45', 36);
      const cols = k === 'tubo' ? ['#b4bac6', '#7d8392', '#1c1c24'] : k === 'coriandoli' ? ['#ff4d6d', '#ffffff', '#3ec5ff'] : ['#15151a', '#e0423a'];
      for (let i = 0; i < 8; i++) addFx('chip', this.x + this.facing * 30, this.z, 60, { life: 24, vx: rand(-2.4, 2.4), vy: rand(1, 3.6), col: pick(cols) });
      Audio2.sfxPlay('break', 0.7);
    }
  }
  fireWeapon(kind, first = true) {
    if (!this.wpn && kind !== 'toss') return;
    const wk = this.wpn ? this.wpn.kind : 'tubo';
    if (kind === 'toss') { G.projs.push(new Proj(this, 'toss', { wk })); this.wpn = null; return; }
    if (kind === 'flame') G.projs.push(new Proj(this, 'flame', { vz: rand(-0.3, 0.3), y: 64 + rand(-3, 3) }));
    else if (kind === 'water') G.projs.push(new Proj(this, 'water', { y: 62 + rand(-2, 2) }));
    else G.projs.push(new Proj(this, kind));
    if (kind === 'confetti') { G.shake(1, 4); glitter(this.x + this.facing * 60, this.z, 50, 4); }
    if (kind === 'notebomb') { G.shake(2, 6); this.x -= this.facing * 4; }
    if (kind === 'flame' && first) Audio2.sfxPlay('flame');
    if (kind === 'water' && first) Audio2.sfxPlay('water');
    if (first) this.useWeapon();
  }
  // motosega: resta accesa finché tieni premuto COLPO
  updateSaw(inp, m, su, t) {
    if (t < su) { this.frameIdx = 0; return; }
    if (t === su) { Audio2.sfxPlay('saw'); this.sawEnd = null; }
    if (this.sawEnd === null && inp.held.atk && this.wpn && t < su + 80) {
      this.frameIdx = 1 + ((t >> 1) & 1);
      if ((t - su) % 5 === 0) { this.hitList.clear(); const n = checkMove(this, m, G.enemies, { noStopA: true }); if (n) { this.useWeapon(); this.mvHit = true; } }
      if ((t - su) % 14 === 13) Audio2.sfxPlay('saw');
      this.x += this.facing * 0.25;
      return;
    }
    if (this.sawEnd === null) this.sawEnd = t;
    this.frameIdx = 0;
    if (t - this.sawEnd > 12) { this.sawEnd = null; this.setState('idle', 'idle'); }
  }
  dropWeapon() {
    if (!this.wpn) return;
    const it = new WeaponItem(this.wpn.kind, this.x - this.facing * 10, this.z, this.wpn.uses, 30);
    it.vx = -this.facing * 1.2; it.vy = 3;
    G.pickups.push(it);
    this.wpn = null;
  }
  knockDown(dir, launch = 1, dead = false) { this.dropWeapon(); return super.knockDown(dir, launch, dead); }

  // ---------------- prese ----------------
  startGrab(e) {
    this.grabbing = e; e.grabbedBy = this; e.setState('grabbed', 'grabbed'); e.facing = -this.facing;
    Tokens.release(e);
    this.setState('grab', 'grab'); this.knees = 0; this.grabCandT = 0;
    Audio2.sfxPlay('grab');
  }
  releaseGrab() {
    const e = this.grabbing;
    if (e) { e.grabbedBy = null; if (e.state === 'grabbed') { e.setState('idle', 'idle'); e.x += this.facing * 9; } }
    this.grabbing = null;
  }
  holdGrabbed() {
    const e = this.grabbing; if (!e) return;
    e.x = this.x + this.facing * 24; e.z = this.z; e.y = 0; e.facing = -this.facing;
  }
  updateGrab(inp, dx) {
    const e = this.grabbing;
    if (!e || !e.alive || e.state !== 'grabbed') { this.grabbing = null; this.setState('idle', 'idle'); return; }
    this.holdGrabbed();
    if (this.buf.jump <= 2) { this.buf.jump = 99; this.releaseGrab(); this.doJump(-this.facing); return; }
    if (this.buf.atk <= TUNE.bufferFrames) {
      this.buf.atk = 99;
      if (dx !== 0 || this.knees >= 3) { this.startThrow(dx || this.facing); return; }
      this.setState('grabhit', 'grabhit'); return;
    }
    if (this.st > TUNE.grabHold) { this.releaseGrab(); this.setState('idle', 'idle'); }
  }
  updateGrabHit() {
    const e = this.grabbing;
    this.holdGrabbed();
    if (this.st === 5 && e) {
      this.hitList.clear();
      applyHit(this, e, this.moves.grabhit, { dir: this.facing });
      this.knees++;
      if (e.hp <= 0) { this.grabbing = null; }
    }
    if (this.st >= 13) { if (this.grabbing) this.setState('grab', 'grab'); else this.setState('idle', 'idle'); this.st = 30; }
  }
  startThrow(dir) {
    this.facing = dir;
    this.setState('throw', 'throw');
    this.holdGrabbed();
    Audio2.sfxPlay('throw');
  }
  updateThrow() {
    const e = this.grabbing;
    if (e && this.st < 8) { e.x = this.x - this.facing * 6; e.y = 32 + this.st * 3; e.z = this.z; }
    if (this.st === 8 && e) {
      e.grabbedBy = null; this.grabbing = null;
      e.setState('thrown', 'knock');
      e.thrower = this; e.vx = this.facing * 6.2; e.vy = 3.7; e.y = Math.max(e.y, 38); e.facing = -this.facing;
      e.hitList.clear();
      G.shake(1, 4);
    }
    if (this.st >= 22) this.setState('idle', 'idle');
  }
  updateGrabbedE(inp) {
    // tenuto da un nemico: lo speciale ti libera subito (costa salute come sempre)
    if ((this.comboSpec || this.buf.spec <= 2) && this.grabbedBy && (this.meter >= 100 || this.hp > this.maxHp * 0.16)) {
      const g = this.grabbedBy; this.comboSpec = false; this.buf.spec = this.buf.atk = this.buf.jump = 99;
      g.breakGrab && g.breakGrab(); this.grabbedBy = null; this.setState('idle', 'idle');
      if (this.doSpecial()) return;
    }
    // tenuto da un nemico: premi i tasti per liberarti
    if (inp.pressed.atk || inp.pressed.jump || inp.pressed.heavy || inp.pressed.left || inp.pressed.right) this.escape = (this.escape || 0) + 7;
    this.play('hurt');
    if (!this.grabbedBy || !this.grabbedBy.alive) { this.grabbedBy = null; this.setState('idle', 'idle'); return; }
    if (this.escape >= 60) { const g = this.grabbedBy; g.breakGrab && g.breakGrab(); this.grabbedBy = null; this.escape = 0; this.inv = 30; this.setState('idle', 'idle'); this.x += this.facing * -12; this.line('free', 0.9); }
  }

  // ---------------- speciali ----------------
  doSpecial() {
    const now = G.frame;
    // colpo di squadra: due giocatori vicini premono lo speciale quasi insieme
    const partner = G.players.find(p => p !== this && p.active && !p.out && p.state === 'special' && now - p.specialStartFrame < 14 && Math.abs(p.x - this.x) < 84 && Math.abs(p.z - this.z) < 26);
    if (partner && (this.meter >= 50 || this.hp > this.maxHp * 0.2)) {
      if (this.meter >= 50) this.meter -= 50; else this.hp -= Math.round(this.maxHp * 0.05);
      partner.meter = Math.max(partner.meter, 50);  // rimborso parziale al compagno
      teamAttack(this, partner);
      return true;
    }
    // barra piena: gratis; altrimenti costa un po' di vita, ma solo se colpisce (come nei picchiaduro Capcom)
    this.specCost = 0;
    if (this.meter >= 100) this.meter = 0;
    else if (this.hp > this.maxHp * 0.16) { this.specCost = Math.round(this.maxHp * 0.1); this.specCostUntil = now + 120; }
    else return false;
    this.releaseGrab();
    this.setState('special', 'sp');
    this.specialStartFrame = now;
    this.hitList.clear(); this.y = 0; this.vy = 0;
    this.untouchable = true;
    const SL = BAND_LINES[this.char.id]; this.say((SL && pickLine(SL.special)) || this.char.quotes.special, 60);
    Audio2.charSfx(this.char.id, 'special');
    G.doFlash(4, this.color);
    return true;
  }
  endSpecial() { this.untouchable = false; this.hidden = false; this.drawFacing = undefined; this.inv = 24; this.setState('idle', 'idle'); }
  updateSpecial(dx, dz) {
    const id = this.char.special.id, t = this.st;
    const A = this.anims.sp;
    if (id === 'urlo') {
      this.frameIdx = t < 16 ? 0 : 1;
      if (t === 16) { G.projs.push(new RingWave(this)); Audio2.sfxPlay('scream'); G.shake(2, 20); }
      if (t >= 56) this.endSpecial();
    } else if (id === 'assolo') {
      this.frameIdx = t < 16 ? 0 : 1;
      if (t === 16) notes(this.x, this.z, 40, 8);
      if (t >= 16 && t <= 56 && (t - 16) % 8 === 0) {
        const k = (t - 16) / 8;
        G.projs.push(new Bolt(this, this.x + this.facing * (40 + k * 38), this.z));
      }
      if (t >= 62) this.endSpecial();
    } else if (id === 'vortice') {
      this.frameIdx = (t >> 2) % 2;
      this.drawFacing = ((t >> 3) % 2) ? -this.facing : this.facing;
      this.x += this.facing * 3.0; this.z += dz * 1.1;
      if (t % 8 === 0) this.hitList.clear();
      checkMove(this, { dmg: 5, hb: { x0: -48, x1: 51, y0: 10, y1: 84 }, knock: t > 30 ? 'down' : 'light', stun: 22, push: 1.5, hsA: 2, hsV: 6, noStopA: true, meter: 0 }, G.enemies, { noStopA: true });
      if (t % 10 === 0) Audio2.sfxPlay('spin');
      if (t >= 40) this.endSpecial();
    } else if (id === 'truffa') {
      if (t === 0) { this.hidden = true; addFx('smoke', this.x, this.z + 1, 20, { life: 30 }); Audio2.sfxPlay('poof'); }
      this.frameIdx = t < 26 ? 0 : t < 34 ? 1 : 2;
      if (t === 25) {
        const cand = G.enemies.filter(e => e.alive && e.state !== 'dead' && Math.abs(e.x - this.x) < 270).sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0];
        if (cand) { const side = sign(cand.x - this.x) || 1; this.x = clamp(cand.x + side * 36, G.cam.x + 20, G.cam.x + W - 20); this.z = cand.z; this.facing = sign(cand.x - this.x) || -side; }
        this.hidden = false; addFx('smoke', this.x, this.z + 1, 20, { life: 26 }); Audio2.sfxPlay('poof');
      }
      if (t === 34) {
        const n = checkMove(this, { dmg: 22, hb: { x0: -13, x1: 70, y0: 0, y1: 99 }, knock: 'down', zTol: 20, shake: 3, hsA: 10, hsV: 12, launch: 1.3, meter: 0 }, G.enemies);
        if (n) popText('TRUFFATO!', this.x + this.facing * 30, this.z, 110, '#62f08e');
      }
      if (t >= 54) this.endSpecial();
    } else if (id === 'rullo') {
      if (t === 0) Audio2.sfxPlay('drumroll');
      if (t < 60) {
        this.frameIdx = (t / 3 | 0) % 2;
        if (t % 6 === 0) { this.hitList.clear(); checkMove(this, { dmg: 2, hb: { x0: 0, x1: 45, y0: 19, y1: 83 }, knock: 'light', stun: 16, push: 0.5, hsA: 1, hsV: 3, meter: 0 }, G.enemies, { noStopA: true }); }
        if (t % 12 === 0) Audio2.sfxPlay('hit', 0.5);
      } else this.frameIdx = 2;
      if (t === 60) { G.projs.push(new Cymbal(this)); Audio2.sfxPlay('metal'); }
      if (t >= 78) this.endSpecial();
    } else if (id === 'grancoda') {
      this.frameIdx = t < 20 ? 0 : 1;
      if (t === 6) notes(this.x, this.z, 50, 6);
      if (t === 20) G.projs.push(new PianoDrop(this, this.x + this.facing * 92, this.z));
      if (t >= 60) this.endSpecial();
    } else this.endSpecial();
  }

  // ---------------- vite, KO, rientro ----------------
  onDeath() {
    this.untouchable = false; this.hidden = false;
    this.releaseGrab();
    Tokens.holders(this).clear();
    this.dropPerks(); this.fartT = 0; this.saidLow = false;
    Audio2.charSfx(this.char.id, 'die');
    this.line('die', 0.9);
  }
  updateDead() {
    this.play('dead');
    if (this.st === 50) {
      if (this.lives > 1) { this.lives--; this.respawn(); }
      else {
        this.lives = 0;
        const mates = G.players.some(p => p !== this && p.active && !p.out && p.state !== 'ko' && p.state !== 'dead');
        if (mates) { this.setState('ko', 'dead'); this.koT = 600; this.reviveP = 0; }
        else { this.out = true; this.outT = 0; }
      }
    }
  }
  updateKO() {
    this.play('dead');
    if (--this.koT <= 0) { this.out = true; this.outT = 0; }
    if (!G.players.some(p => p !== this && p.active && !p.out && p.state !== 'ko' && p.state !== 'dead')) { this.out = true; }
  }
  tryRevive() {
    const ko = G.players.find(p => p !== this && p.state === 'ko' && Math.abs(p.x - this.x) < 40 && Math.abs(p.z - this.z) < 16);
    if (!ko) return false;
    ko.reviveP += 14;
    notes(ko.x, ko.z, 10, 1);
    if (ko.reviveP >= 100) { ko.lives = 1; ko.hp = Math.round(ko.maxHp * 0.5); ko.inv = 120; ko.setState('getup', 'getup'); popText('RIANIMATO!', ko.x, ko.z, 100, ko.color); Audio2.sfxPlay('oneup'); this.addScore(500); }
    this.setState('land', 'grab');
    return true;
  }
  respawn(full = false) {
    this.wpn = null;
    this.hp = this.maxHp; this.out = false; this.y = 210; this.vy = 0; this.inv = TUNE.respawnInv;
    this.x = clamp(this.x, G.cam.x + 50, G.cam.x + W - 50);
    if (full) { this.x = G.cam.x + 60 + this.slot * 40; this.z = 168 + this.slot * 10; }
    this.setState('enter', 'jump');
    if (!full) this.line('respawn', 0.8);
  }
  continueGame() { this.lives = 3; this.score = 0; this.meter = 40; this.out = false; this.respawn(true); }
  updateEnter() {
    this.y = Math.max(0, this.y - 6);
    if (this.y <= 0) { Audio2.sfxPlay('land'); dust(this.x, this.z, 5); this.setState('land', 'land'); }
  }
  draw(ctx, camX) {
    if (this.out) return;
    super.draw(ctx, camX);
  }
}

// Colpo di squadra: tutti i nemici a schermo
function teamAttack(a, b) {
  for (const p of [a, b]) {
    p.endSpecial(); p.setState('team', 'victory'); p.untouchable = true; p.inv = 60;
  }
  a.say('COLPO DI SQUADRA!', 70);
  G.doFlash(10, '#ffffff'); G.shake(4, 24);
  Audio2.sfxPlay('team');
  notes((a.x + b.x) / 2, (a.z + b.z) / 2, 40, 14);
  for (const e of G.enemies) {
    if (!e.alive || e.state === 'dead' || e.x < G.cam.x - 10 || e.x > G.cam.x + W + 10) continue;
    e.hitList && e.hitList.clear();
    a.hitList.clear();
    applyHit(a, e, { dmg: e.isBoss ? 34 : 22, knock: 'down', hsA: 0, hsV: 10, launch: 1.2, meter: 0 }, { noStopA: true });
  }
  popText('COLPO DI SQUADRA!', (a.x + b.x) / 2, Math.min(a.z, b.z), 120, '#ffd23e', 70);
}
