// ============================================================
// BOSS LIVELLO 1: DUCA GLITTER, "il re della pista"
// Fase 1: piroetta, raggi stroboscopici, calcio a zeppa, richiamo dei pattinatori
// Fase 2 (sotto metà salute): più veloce, più raggi, la pista da ballo scotta
// ============================================================
class Duca extends Enemy {
  constructor(type, x, z, o = {}) {
    super('duca_glitter', x, z, { look: 'duca' });
    this.bossArmor = 48; this.phase = 1; this.animSeed = () => (G.frame >> 2) % 4;
    this.summoned = { a: false, b: false }; this.next = 60; this.floorCD = 200;
    this.setState('intro', 'walk'); this.untouchable = true; this.radius = 20;
    this.kickAtk = { anim: 'kick', fr: [16, 5, 22], dmg: 10, hb: { x0: 0, x1: 74, y0: 6, y1: 74 }, knock: 'down', hsA: 8, hsV: 10, shake: 2 };
  }
  grabbable() { return false; }
  onDamaged(a, dmg, dead) {
    if (!dead && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2; this.speedMul = 1.2;
      popText('LA PISTA SI SCALDA!', this.x, this.z, 134, '#ff7ad9', 90);
      { const l = pickLine(BOSS_LINES.duca_glitter.taunt); if (l) this.say(l, 80); }
      G.doFlash(8, '#ff7ad9'); Audio2.setTempo(1.08); Audio2.sfxPlay('boss');
      glitter(this.x, this.z, 64, 20);
    }
  }
  onDeath() {
    Tokens.release(this);
    G.stats.kills++;
    const k = this.lastHitBy; if (k && k.onKill) k.onKill(this);
    Audio2.sfxPlay('boss'); G.slowmo = 90; G.doFlash(14); G.shake(5, 40);
    { const l = pickLine(BOSS_LINES.duca_glitter.die); if (l) this.say(l, 100); }
    for (let i = 0; i < 4; i++) glitter(this.x, this.z, 48 + i * 16, 18);
    if (G.level) G.level.floor = null;
    if (G.level && G.level.onBossDefeated) G.level.onBossDefeated(this);
  }
  update() {
    // il boss si muove anche durante lo stagger con la logica comune
    super.update();
  }
  updateAI() {
    const t = this.target = this.pickTarget();
    const s = this.state;
    if (s === 'intro') {
      this.facing = -1;
      if (this.st < 80) { this.moveToward(this.entryX, this.z, 1.3); if (this.st % 6 === 0) glitter(this.x, this.z, 48, 1); }
      else this.frameIdx = 0, this.play('point');
      if (this.st === 82) { Audio2.sfxPlay('boss'); G.shake(2, 20); const l = pickLine(BOSS_LINES.duca_glitter.intro); if (l) this.say(l, 90); }
      if (this.st >= 150) { this.untouchable = false; this.setState('idle', 'idle'); this.next = 30; }
      return;
    }
    if (!t) { this.play('sway'); return; }
    if (s === 'idle' || s === 'walk') {
      this.facing = sign(t.x - this.x) || this.facing;
      this.next--;
      // avvicinamento leggero mentre balla
      const tx = t.x + sign(this.x - t.x || 1) * 64;
      this.moveToward(tx, t.z, 0.9);
      if (this.next > 0) return;
      const pct = this.hp / this.maxHp;
      const close = Math.abs(t.x - this.x) < 80 && Math.abs(t.z - this.z) < 14;
      if (pct < 0.72 && !this.summoned.a) { this.summoned.a = true; return this.startSummon(); }
      if (pct < 0.36 && !this.summoned.b) { this.summoned.b = true; return this.startSummon(); }
      if (this.phase === 2 && this.floorCD <= 0 && chance(0.4)) return this.startFloor();
      if (close && chance(0.65)) return this.startKick();
      const r = Math.random();
      if (r < 0.42) return this.startSpin();
      if (r < 0.84) return this.startBeams();
      this.next = 40;
      return;
    }
    if (this.floorCD > 0) this.floorCD--;
    if (s === 'spinTele') {
      this.play('spin'); this.noInterrupt = true;
      if (this.st % 3 === 0) glitter(this.x, this.z, 64, 1);
      if (t) this.z = approach(this.z, t.z, 0.5);
      if (this.st >= (this.phase === 2 ? 26 : 34)) { this.setState('spin', 'spin'); this.dashDir = sign(t.x - this.x) || -this.facing; this.hitList.clear(); Audio2.sfxPlay('spin'); }
      return;
    }
    if (s === 'spin') {
      this.noInterrupt = true;
      this.x += this.dashDir * (this.phase === 2 ? 7.6 : 6.6);
      if (this.phase === 2 && t) this.z = approach(this.z, t.z, 0.35);
      if (this.st % 9 === 0) Audio2.sfxPlay('spin', 0.6);
      if (this.st % 3 === 0) addFx('streak', this.x - this.dashDir * 20, this.z, 48, { life: 12, dir: this.dashDir, col: '#ff7ad9' });
      checkMove(this, { dmg: 11, hb: { x0: -26, x1: 29, y0: 0, y1: 100 }, knock: 'down', hsA: 0, hsV: 9, zTol: 14 }, G.players);
      const edge = this.dashDir > 0 ? this.x > G.cam.x + W - 36 : this.x < G.cam.x + 36;
      if (edge || this.st > 110) { this.noInterrupt = false; this.setState('dizzy', 'hurt'); G.shake(2, 8); Audio2.sfxPlay('fall'); }
      return;
    }
    if (s === 'dizzy') {
      this.play('hurt2');
      if (this.st % 10 === 0) addFx('star', this.x + rand(-12, 12), this.z, 120, { life: 20 });
      if (this.st >= (this.phase === 2 ? 34 : 50)) { this.setState('idle', 'idle'); this.next = randi(20, 50); }
      return;
    }
    if (s === 'beam') {
      this.play('beam');
      if (this.st === 12) {
        const n = this.phase === 2 ? 5 : 3;
        const targets = G.players.filter(canTargetPlayer);
        for (let i = 0; i < n; i++) {
          const p = targets[i % Math.max(1, targets.length)];
          const bx = p && i < targets.length ? p.x : rand(G.cam.x + 40, G.cam.x + W - 40);
          const bz = p && i < targets.length ? p.z : rand(LANE_TOP, LANE_BOTTOM);
          G.projs.push(new Beam(this, bx + (i >= targets.length ? 0 : rand(-9, 9)), bz, i * 12));
        }
        G.doFlash(3, '#ff7ad9');
      }
      if (this.st % 8 === 0) glitter(this.x, this.z, 110, 2);
      if (this.st >= 80) { this.setState('idle', 'idle'); this.next = randi(30, 60); }
      return;
    }
    if (s === 'kick') {
      const a = this.kickAtk, [su, ac, re] = a.fr;
      this.frameIdx = this.st < su ? 0 : this.st < su + ac ? 1 : 2;
      if (this.st === su) Audio2.sfxPlay('swingBig');
      if (this.st >= su && this.st < su + ac) checkMove(this, a, G.players);
      if (this.st >= su + ac + re) { this.setState('idle', 'idle'); this.next = randi(20, 50); }
      return;
    }
    if (s === 'summon') {
      this.play('point');
      if (this.st === 20) {
        popText('BALLERINI, IN PISTA!', this.x, this.z, 134, '#ffd23e', 70);
        G.level.spawnNow('pattinatore', 'L'); G.level.spawnNow('pattinatore', 'R');
        if (this.phase === 2 || G.players.filter(p => p.active).length > 1) G.level.spawnNow('lanciadischi', 'R');
      }
      if (this.st >= 60) { this.setState('idle', 'idle'); this.next = 90; }
      return;
    }
    if (s === 'floor') {
      this.play('sway');
      if (this.st === 1) { G.level.floor = { t: 0, parity: randi(0, 1), hit: new Set() }; popText('PISTA BOLLENTE!', this.x, this.z, 134, '#ff7ad9', 60); }
      if (this.st >= 110) { this.setState('idle', 'idle'); this.next = 30; this.floorCD = 420; }
      return;
    }
  }
  startSpin() { this.setState('spinTele', 'spin'); this.facing = sign(this.target.x - this.x) || this.facing; Tokens.release(this); }
  startBeams() { this.setState('beam', 'beam'); Audio2.sfxPlay('boss'); }
  startKick() { this.setState('kick', 'kick'); this.hitList.clear(); }
  startSummon() { this.setState('summon', 'point'); }
  startFloor() { this.setState('floor', 'sway'); }
}

const BOSS_CLASSES = { Duca };
