// ============================================================
// ATTORE BASE: fisica, stati comuni (colpito, a terra, rialzo), disegno
// ============================================================
const LOOP_ANIMS = new Set(['idle', 'walk', 'run', 'taunt', 'victory', 'skate', 'spin', 'sway', 'cheer']);
for (const k in WEAPONS) for (const n of ['_idle', '_walk', '_run']) LOOP_ANIMS.add(k + n);

class Actor {
  constructor(o) {
    Object.assign(this, {
      x: 0, z: 175, y: 0, vx: 0, vz: 0, vy: 0, facing: 1, hp: 50, maxHp: 50, alive: true, team: 'e',
      state: 'idle', st: 0, anim: 'idle', animT: 0, frameIdx: null, hitstop: 0, shakeT: 0, flashT: 0, inv: 0,
      radius: 13, hurtW: 28, hurtH: 88, hitList: new Set(), grabbing: null, grabbedBy: null,
      dmgMul: 1, defense: 1, costume: 'own', heavy: false, hidden: false, removeT: -1,
    }, o);
  }
  solid() { return !['knock', 'down', 'dead', 'thrown', 'grabbed', 'grabbedE', 'enter', 'ko'].includes(this.state) && this.y < 4 && !this.hidden; }
  setState(s, anim) { this.state = s; this.st = 0; this.frameIdx = null; if (anim) this.play(anim); }
  play(anim) { if (this.anim !== anim) { this.anim = anim; this.animT = 0; } }
  restart(anim) { this.anim = anim; this.animT = 0; }

  hurt(dir, stun, push) {
    if (this.state === 'dead') return;
    this.releaseGrab && this.releaseGrab();
    this.setState('hurt', this._hurtAlt ? 'hurt2' : 'hurt');
    this._hurtAlt = !this._hurtAlt;
    this.hurtT = stun;
    this.vx = dir * push;
    this.facing = -dir || this.facing;
    this.onHurt && this.onHurt();
  }
  // ritorna false se il bersaglio era già in aria da troppo (massimo 2 rilanci): il danno resta, il volo no
  knockDown(dir, launch = 1, dead = false) {
    this.releaseGrab && this.releaseGrab();
    if (this.state === 'knock' && this.y > 0) {
      this.juggle = (this.juggle || 0) + 1;
      if (this.juggle > 2) { this.willDie = this.willDie || dead; this.vy = Math.min(this.vy, 0); this.onHurt && this.onHurt(); return false; }
    } else this.juggle = 0;
    this.setState('knock', 'knock');
    this.vy = 4.7 * launch; this.vx = dir * 3.1 * launch; this.y = Math.max(this.y, 1);
    this.facing = -dir || this.facing;
    this.bounced = false; this.willDie = dead;
    this.onHurt && this.onHurt();
    return true;
  }
  // stati comuni; ritorna true se gestito
  commonUpdate() {
    const s = this.state;
    if (s === 'hurt') {
      this.x += this.vx; this.vx *= 0.82;
      if (this.y > 0) { this.vy -= TUNE.gravity; this.y = Math.max(0, this.y + this.vy); }
      if (this.st >= this.hurtT) { this.setState('idle', 'idle'); }
      return true;
    }
    if (s === 'knock' || s === 'thrown') {
      this.x += this.vx; this.vy -= TUNE.gravity; this.y += this.vy;
      if (this.y <= 0) {
        this.y = 0;
        if (s === 'thrown') { this.onThrownLand && this.onThrownLand(); return true; }
        if (!this.bounced && Math.abs(this.vy) > 3) {
          this.bounced = true; this.vy = 2.3; this.y = 0.1; this.vx *= 0.5;
          Audio2.sfxPlay('fall'); dust(this.x, this.z, 5); G.shake(1, 4);
        } else { this.setState('down', 'down'); this.vx = 0; dust(this.x, this.z, 3); }
      }
      return true;
    }
    if (s === 'down') {
      if (this.st >= (this.downTime || 34)) {
        if (this.hp <= 0 || this.willDie) this.die();
        else { this.setState('getup', 'getup'); }
      }
      return true;
    }
    if (s === 'getup') {
      if (this.st >= 18) { this.inv = Math.max(this.inv, this.team === 'p' ? TUNE.getupInv : 16); this.setState('idle', 'idle'); }
      return true;
    }
    if (s === 'dead') { return true; }
    return false;
  }
  die() { this.setState('dead', 'dead'); this.onDeath && this.onDeath(); }

  tickTimers() {
    if (this.inv > 0) this.inv--;
    if (this.flashT > 0) this.flashT--;
  }
  clampLane() { this.z = clamp(this.z, LANE_TOP, LANE_BOTTOM); }

  currentFrame() {
    const A = this.anims;
    const fr = A[this.anim] || A.idle;
    if (this.frameIdx !== null && this.frameIdx !== undefined) return { f: fr[Math.min(this.frameIdx, fr.length - 1)], i: Math.min(this.frameIdx, fr.length - 1) };
    let t = this.animT, total = 0;
    for (const f of fr) total += (f.d || 6);
    if (LOOP_ANIMS.has(this.anim)) t = t % total;
    let acc = 0;
    for (let i = 0; i < fr.length; i++) { acc += (fr[i].d || 6); if (t < acc) return { f: fr[i], i }; }
    return { f: fr[fr.length - 1], i: fr.length - 1 };
  }
  draw(ctx, camX) {
    if (this.hidden) return;
    if (this.state === 'dead' && this.team === 'e' && this.st > 12 && (G.frame >> 1) % 2) return;
    const { f, i } = this.currentFrame();
    const sparkle = this.animSeed ? this.animSeed() : (this.costume === 'oro' ? ((G.frame >> 3) % 3) : 0);
    const frame = getFrame(this.look, this.costume, f.p, this.anim + i + (sparkle ? '_' + sparkle : ''), sparkle);
    let sx = this.x - camX, sy = this.z - this.y;
    if (this.shakeT > 0) sx += (this.shakeT % 2 ? 1 : -1);
    const blink = this.inv > 0 && this.state !== 'special' && (G.frame >> 2) % 2 === 0;
    if (blink && this.inv < 200) return;
    const face = this.drawFacing !== undefined ? this.drawFacing : this.facing;
    drawSprite(ctx, frame, sx, sy, face, { flash: this.flashT > 0, alpha: this.alpha });
  }
  drawShadow(ctx, camX) {
    if (this.hidden) return;
    const s = clamp(1 - this.y / 140, 0.4, 1);
    const w = (this.shadowW || 34) * s;
    pixelShadow(ctx, this.x - camX, this.z, w / 2, 4 * s);
  }
}
function pixelShadow(ctx, x, z, rx, ry, color = 'rgba(8,4,16,0.42)') {
  ctx.fillStyle = color;
  const st = 1 / RS, cx = Math.round(x * RS) / RS, cy = Math.round(z * RS) / RS;
  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy += st) {
    const k = 1 - (dy * dy) / (ry * ry + 0.5);
    if (k <= 0) continue;
    const hw = Math.round(rx * Math.sqrt(k) * RS) / RS;
    ctx.fillRect(cx - hw, cy + dy, hw * 2, st);
  }
}
