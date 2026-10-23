// ============================================================
// OGGETTI v3: proiettili (dei giocatori e dei nemici), esplosioni, pericoli a terra,
// oggetti distruttibili, bonus e armi da raccogliere. Sprite a pixel fini (RS).
// ============================================================
const _procCache = new Map();
function procSprite(key, w, h, fn) {
  let c = _procCache.get(key);
  if (c) return c;
  const pb = new PixBuf(w + 2, h + 2, RS);
  fn(pb, 1, 1);
  pb.outlineSel(OUTLINE, 0.74);
  c = pb.toCanvas();
  _procCache.set(key, c);
  return c;
}
const spW = sp => sp.width / RS, spH = sp => sp.height / RS;
function shadedRect(pb, x, y, w, h, hex, vertical = false) {
  const T = tones(hex);
  pb.fill(x, y, w, h, (i, j) => bandTone(T, vertical ? 0.6 - (j / h) * 1.4 : (i / w) * 0.9 - 0.25 - (j / h) * 0.5));
}
// bersagli di chi attacca: i giocatori colpiscono i nemici e viceversa
function foesOf(o) { return o && o.team === 'e' ? G.players : G.enemies; }
function hitOk(t) { return canBeHit(t) && (t.team !== 'p' || canTargetPlayer(t)); }
// rettangoli fini per il disegno diretto (coordinate del mondo, passo 1/RS)
function frect(ctx, x, y, w, h, c) { if (c) ctx.fillStyle = c; ctx.fillRect(Math.round(x * RS) / RS, Math.round(y * RS) / RS, Math.max(1, Math.round(w * RS)) / RS, Math.max(1, Math.round(h * RS)) / RS); }
function fdisc(ctx, x, y, r, c) { ctx.fillStyle = c; for (let dy = -r; dy <= r; dy += 0.5) { const hw = Math.sqrt(Math.max(0, r * r - dy * dy)); ctx.fillRect(Math.round((x - hw) * RS) / RS, Math.round((y + dy) * RS) / RS, Math.round(hw * 2 * RS) / RS, 0.5); } }

// ================= PROIETTILE GENERICO =================
class Proj {
  constructor(owner, k, o = {}) {
    const K = PROJ_KINDS[k];
    this.owner = owner; this.team = owner ? owner.team : 'e'; this.k = k; this.K = K;
    this.alive = true; this.t = 0; this.hit = new Set();
    const f = o.dir || (owner ? owner.facing : 1); this.dir = f;
    this.x = o.x ?? (owner.x + f * (K.ox ?? 30)); this.z = o.z ?? owner.z; this.y = o.y ?? (K.oy ?? 60);
    this.vx = o.vx ?? f * (K.speed ?? 6); this.vy = o.vy ?? (K.vy || 0); this.vz = o.vz || 0;
    this.grav = K.grav || 0; this.life = o.life || K.life || 120; this.pierce = K.pierce || 1;
    this.mv = Object.assign({ hsA: 0, hsV: 8 }, K.mv, o.mv);
    this.r = K.r || 14; this.rz = K.rz || 12; this.o = o;
    if (K.init) K.init(this, o);
    if (K.sfx) Audio2.sfxPlay(K.sfx);
  }
  get danger() { return this.team === 'e'; }
  update() {
    this.t++; const K = this.K;
    if (K.upd && K.upd(this) === false) return;
    this.x += this.vx; this.z = clamp(this.z + this.vz, LANE_TOP - 6, LANE_BOTTOM + 6);
    if (this.grav) this.vy -= this.grav;
    this.y += this.vy;
    if (this.grav && this.y <= 0) { this.y = 0; this.end(false); return; }
    if (this.t > this.life || this.x < G.cam.x - 70 || this.x > G.cam.x + W + 70) { this.end(false); return; }
    if (K.noHit) return;
    // parata: un colpo del giocatore in fase attiva distrugge i proiettili nemici parabili
    if (this.team === 'e' && K.parry) for (const p of G.players) {
      if (p.state === 'attack' && p.move && p.move.hb && p.mvT > p.move.fr[0] && p.mvT <= p.move.fr[0] + p.move.fr[1]) {
        const box = moveBox(p, p.move.hb);
        if (Math.abs(p.z - this.z) < 14 && this.x > box.x0 - 6 && this.x < box.x1 + 6 && this.y > box.y0 - 4 && this.y < box.y1 + 8) {
          this.alive = false; sparks(this.x, this.z, this.y, false); p.addScore(50); popText('PARATO!', this.x, this.z, 100, '#3ec5ff', 30); Audio2.sfxPlay('metal'); return;
        }
      }
    }
    const reach = K.reach ? K.reach(this) : this.r;
    for (const e of foesOf(this.owner)) {
      if (this.hit.has(e) || !hitOk(e)) continue;
      if (Math.abs(e.x - this.x) < reach && Math.abs(e.z - this.z) < this.rz && this.y >= e.y - 10 && this.y <= e.y + e.hurtH + 8) {
        this.hit.add(e);
        const mv = K.mvFor ? K.mvFor(this, e) : this.mv;
        applyHit(this.owner, e, mv, { dir: sign(this.vx) || this.dir, noStopA: true });
        if (K.onHit) K.onHit(this, e);
        if (--this.pierce <= 0) { this.end(true); return; }
      }
    }
    if (this.team === 'p' && !K.noProps) for (const pr of G.props) {
      if (!pr.alive || this.hit.has(pr) || Math.abs(pr.z - this.z) > 14 || Math.abs(pr.x - this.x) > 16 || this.y > pr.h + 30) continue;
      this.hit.add(pr); pr.hit(this.owner, this.mv);
      if (!K.pierceProps) { this.end(true); return; }
    }
  }
  end(hit) { if (!this.alive) return; this.alive = false; if (this.K.end) this.K.end(this, hit); }
  draw(ctx, camX) {
    const x = this.x - camX, y = this.z - this.y;
    if (!this.K.noShadow) pixelShadow(ctx, x, this.z, this.K.shadow || 7, 2, 'rgba(8,4,16,0.3)');
    this.K.draw(this, ctx, x, y);
  }
}
const chipsAt = (x, z, y, n, cols, sp = 2.6) => { for (let i = 0; i < n; i++) addFx('chip', x, z, y, { life: 26, vx: rand(-sp, sp), vy: rand(1, 4), col: pick(cols) }); };
// traiettoria ad arco: velocità verticale per arrivare a terra dopo T frame
const arcVy = (y0, T, g) => (0.5 * g * T * T - y0) / T;

// sprite piccoli dei proiettili
function discSprite(label, ph) {
  return procSprite('disc_' + label + ph, 20, 10, (pb, ox, oy) => {
    pb.ellipse(ox + 10, oy + 5, 9.5, 4.5, col('#15151a')); pb.ellipse(ox + 10, oy + 5, 7, 3, col('#22222a'));
    pb.ellipse(ox + 10, oy + 5, 3, 1.6, col(label)); pb.dot(ox + 10.5, oy + 5.5, col('#15151a'));
    pb.rectF(ox + (ph ? 4 : 12), oy + 2, 4, 0.5, col('#7a7a88'));
  });
}
function bottleSprite() {
  return procSprite('bottle', 8, 20, (pb, ox, oy) => {
    const T = tones('#2a8a3a');
    pb.fill(ox, oy, 8, 20, (u, v) => { const r = v < 6 ? 1.3 : v < 9 ? 1.3 + (v - 6) : 3.8; if (Math.abs(u - 4) > r) return 0; if (v < 1.5) return col('#c9a43a'); return bandTone(T, (4 - u) / 4 * 0.9 - 0.1 + (u > 2 && u < 3 && v > 9 ? 0.8 : 0)); });
    pb.rectF(ox + 2.5, oy + 11, 3, 4, col('#efe3c4'));
  });
}
function noteSprite(c) {
  return procSprite('note_' + c, 12, 16, (pb, ox, oy) => {
    const T = tones(c);
    pb.ellipse(ox + 3, oy + 12, 3.5, 2.6, T.M); pb.dot(ox + 2, oy + 11, T.L); pb.dot(ox + 2.5, oy + 11, T.L);
    pb.rectF(ox + 6, oy + 1, 1.5, 12, T.M); pb.rectF(ox + 6, oy + 1, 0.5, 12, T.L);
    pb.line(ox + 6.5, oy + 1, ox + 11, oy + 5, T.M, 1.5);
  });
}
function batSprite(ph) {
  return procSprite('bat' + ph, 22, 12, (pb, ox, oy) => {
    const T = tones('#2a2036');
    pb.fill(ox, oy, 22, 12, (u, v) => {
      const body = Math.hypot((u - 11) / 2.4, (v - 6) / 3.2) < 1;
      const wy = ph ? -2 : 2;
      const wing = Math.abs(u - 11) < 10.5 && v > 3 + Math.abs(u - 11) * 0.3 * (ph ? -0.4 : 0.6) + (ph ? 0 : 0) && v < 6.5 + Math.abs(u - 11) * (ph ? -0.15 : 0.12) + (Math.abs(u - 11) > 6 && (Math.floor(u) % 3 === 0) ? -1.2 : 0) + wy * 0;
      if (body) return T.M;
      if (wing && Math.abs(u - 11) > 1.5) return Math.abs(u - 11) > 7 ? T.S : T.D;
      return 0;
    });
    pb.dot(ox + 10, oy + 5, col('#ff3030')); pb.dot(ox + 12, oy + 5, col('#ff3030'));
    pb.rectF(ox + 9.5, oy + 2, 0.5, 1.5, T.M); pb.rectF(ox + 12, oy + 2, 0.5, 1.5, T.M);
  });
}

// ================= TIPI DI PROIETTILE =================
const PROJ_KINDS = {
  // ---- nemici ----
  vinyl: { speed: 4.6, ox: 22, oy: 56, r: 13, rz: 10, life: 220, parry: true, sfx: 'vinyl', mv: { dmg: 6, knock: 'light', stun: 18, push: 2.2 },
    draw(p, ctx, x, y) { blitHi(ctx, discSprite('#e0423a', (p.t >> 2) % 2), x - 11, y - 6); } },
  bottle: { speed: 3.6, ox: 18, oy: 64, grav: 0.3, r: 13, rz: 11, parry: true, sfx: 'throw', mv: { dmg: 7, knock: 'light', stun: 20, push: 1.6 },
    init(p, o) { const T = Math.max(14, Math.abs((o.tx ?? p.x + p.vx * 30) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
    end(p) { chipsAt(p.x, p.z, Math.max(2, p.y), 10, ['#2a8a3a', '#7ad08a', '#e6f4ea']); Audio2.sfxPlay('break', 0.7); splat(p.x, p.z, 7, '#4a6a2a'); },
    draw(p, ctx, x, y) { const sp = bottleSprite(); ctx.save(); ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS); ctx.rotate(p.t * 0.35 * p.dir); ctx.drawImage(sp, -spW(sp) / 2, -spH(sp) / 2, spW(sp), spH(sp)); ctx.restore(); } },
  note: { speed: 3.6, ox: 24, oy: 64, r: 12, rz: 10, life: 200, parry: true, mv: { dmg: 5, knock: 'light', stun: 16, push: 1.4 },
    upd(p) { p.y = (p.o.y0 ?? 64) + Math.sin(p.t * 0.25) * 8; },
    draw(p, ctx, x, y) { blitHi(ctx, noteSprite(p.o.col || '#ffd34a'), x - 6, y - 10); } },
  wave: { speed: 5, ox: 30, oy: 50, r: 16, rz: 15, life: 160, pierce: 9, noProps: true, sfx: 'scream', mv: { dmg: 9, knock: 'down', hsV: 9 },
    draw(p, ctx, x, y) {
      const c = p.o.col || '#7ae8ff';
      for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.85 - k * 0.25; ctx.fillStyle = k ? c : '#ffffff'; const xx = x - p.dir * k * 6; for (let a = -1.1; a <= 1.1; a += 0.06) frect(ctx, xx + Math.cos(a) * 10 * p.dir, y + Math.sin(a) * 32, 1, 1); }
      ctx.globalAlpha = 1;
    } },
  fire: { speed: 4.4, ox: 26, oy: 58, r: 13, rz: 11, life: 170, sfx: 'flame', mv: { dmg: 8, knock: 'down', hsV: 8 },
    upd(p) { if (p.t % 2 === 0) addFx('ember', p.x - p.vx * 2, p.z, p.y + rand(-3, 3), { life: 14, vx: rand(-0.4, 0.4), vy: rand(0.2, 1) }); },
    draw(p, ctx, x, y) { fdisc(ctx, x, y, 7, '#ff5a1a'); fdisc(ctx, x + p.dir, y - 1, 5, '#ffb03a'); fdisc(ctx, x + p.dir * 1.5, y - 1.5, 2.5, '#fff2a8'); } },
  bat: { speed: 2.6, ox: 10, oy: 80, r: 12, rz: 12, life: 210, noProps: true, parry: true, sfx: 'bat', mv: { dmg: 4, knock: 'light', stun: 14, push: 1 },
    upd(p) {
      const t = foesOf(p.owner).filter(hitOk).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      if (t) { p.vx = approach(p.vx, sign(t.x - p.x) * 2.8, 0.08); p.vz = approach(p.vz, sign(t.z - p.z) * 0.9, 0.05); }
      p.y = 70 + Math.sin(p.t * 0.2 + p.o.ph) * 14;
    },
    end(p, hit) { if (!hit) return; for (let i = 0; i < 5; i++) addFx('smoke', p.x, p.z, p.y - 20, { life: 18 }); },
    draw(p, ctx, x, y) { blitHi(ctx, batSprite((p.t >> 2) % 2), x - 12, y - 7, p.vx < 0); } },
  shard: { speed: 5, ox: 0, oy: 74, r: 9, rz: 9, life: 70, noProps: true, mv: { dmg: 4, knock: 'light', stun: 12, push: 1 },
    draw(p, ctx, x, y) { frect(ctx, x - 2, y - 1, 4, 2, '#e8f4ff'); frect(ctx, x - 1, y - 1, 1, 1, '#ffffff'); } },
  can: { speed: 3.4, ox: 16, oy: 70, grav: 0.32, r: 10, rz: 10, noHit: true, sfx: 'throw',
    init(p, o) { const T = Math.max(14, Math.abs((o.tx ?? p.x + p.vx * 30) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
    end(p) { G.projs.push(new Cloud(p.owner, p.x, p.z, p.o.col || '#c58bff')); Audio2.sfxPlay('spray'); },
    draw(p, ctx, x, y) { frect(ctx, x - 2.5, y - 5, 5, 10, p.o.col || '#c58bff'); frect(ctx, x - 2.5, y - 5, 1.5, 10, '#ffffff'); frect(ctx, x - 1, y - 7, 2, 2, '#c9cdd6'); } },
  flash: { speed: 7, ox: 34, oy: 70, r: 24, rz: 16, life: 12, pierce: 9, noProps: true, sfx: 'flash', mv: { dmg: 2, knock: 'light', stun: 46, push: 0.4 },
    draw(p, ctx, x, y) { ctx.globalAlpha = 1 - p.t / 12; fdisc(ctx, x, y, 10 + p.t * 2, '#ffffff'); ctx.globalAlpha = 1; } },
  bone: { speed: 4, ox: 18, oy: 66, grav: 0.26, r: 12, rz: 10, parry: true, sfx: 'throw', mv: { dmg: 6, knock: 'light', stun: 18, push: 1.6 },
    init(p, o) { const T = Math.max(14, Math.abs((o.tx ?? p.x + p.vx * 30) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
    end(p) { chipsAt(p.x, p.z, 3, 5, ['#efe9dc', '#c6bfae']); },
    draw(p, ctx, x, y) { ctx.save(); ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS); ctx.rotate(p.t * 0.4); frect(ctx, -6, -1, 12, 2, '#efe9dc'); fdisc(ctx, -6, -1, 1.6, '#efe9dc'); fdisc(ctx, 6, -1, 1.6, '#efe9dc'); fdisc(ctx, -6, 1, 1.6, '#c6bfae'); fdisc(ctx, 6, 1, 1.6, '#c6bfae'); ctx.restore(); } },
  card: { speed: 5.4, ox: 22, oy: 66, r: 10, rz: 9, life: 110, parry: true, sfx: 'throw', mv: { dmg: 5, knock: 'light', stun: 14, push: 1.2 },
    draw(p, ctx, x, y) { const f = (p.t >> 2) % 4, w = [6, 4, 1.5, 4][f]; frect(ctx, x - w / 2, y - 4, w, 8, '#f4f2ea'); if (w > 2) { frect(ctx, x - w / 2, y - 4, w, 0.5, '#c42032'); fdisc(ctx, x, y, 1, f % 2 ? '#18161e' : '#c42032'); } } },
  boombox: { speed: 3.4, ox: 20, oy: 80, grav: 0.32, r: 16, rz: 13, sfx: 'throw', mv: { dmg: 10, knock: 'down', hsV: 10 },
    init(p, o) { const T = Math.max(16, Math.abs((o.tx ?? p.x + p.vx * 30) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
    end(p) { for (const d of [-1, 1]) G.projs.push(new Shock(p.owner, p.x, p.z, d, { dmg: 8, col: '#ffd34a' })); chipsAt(p.x, p.z, 8, 12, ['#2a2a34', '#c9cdd6', '#ffd34a'], 3); Audio2.sfxPlay('boom'); G.shake(2, 8); },
    draw(p, ctx, x, y) { const b = (p.t >> 2) % 2; frect(ctx, x - 10, y - 6, 20, 12, '#2a2a34'); frect(ctx, x - 10, y - 6, 20, 1, '#5a5a6a'); frect(ctx, x - 6, y - 9, 12, 1.5, '#8a90a0');
      fdisc(ctx, x - 5, y + 0.5, 3.5 + b * 0.5, '#18161e'); fdisc(ctx, x + 5, y + 0.5, 3.5 + b * 0.5, '#18161e'); fdisc(ctx, x - 5, y + 0.5, 1.2, '#c9cdd6'); fdisc(ctx, x + 5, y + 0.5, 1.2, '#c9cdd6'); frect(ctx, x - 2, y - 4.5, 4, 2, '#ffd34a'); } },
  dynamite: { speed: 3.6, ox: 18, oy: 76, grav: 0.3, r: 10, rz: 10, noHit: true, sfx: 'throw',
    init(p, o) { const T = Math.max(16, Math.abs((o.tx ?? p.x + p.vx * 30) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
    upd(p) { if (p.t % 2 === 0) addFx('ember', p.x, p.z, p.y + 8, { life: 10, vx: rand(-0.6, 0.6), vy: rand(0.4, 1.2) }); },
    end(p) { G.projs.push(new Explosion(p.owner, p.x, p.z, 44, { dmg: 12, knock: 'down', hsV: 10, launch: 1.1 })); },
    draw(p, ctx, x, y) { ctx.save(); ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS); ctx.rotate(p.t * 0.3 * p.dir); frect(ctx, -2, -7, 4, 13, '#c42032'); frect(ctx, -2, -7, 1.5, 13, '#ff5a5a'); frect(ctx, -2, -3, 4, 1, '#efe3c4'); frect(ctx, -0.5, -9.5, 1, 3, '#8a8494'); ctx.restore(); } },
  bullet: { speed: 8, ox: 30, oy: 66, r: 10, rz: 8, life: 90, parry: true, sfx: 'shot', mv: { dmg: 6, knock: 'light', stun: 16, push: 1.8 },
    draw(p, ctx, x, y) { const tx = p.dir > 0 ? x - 6 : x; frect(ctx, tx - 1, y - 1, 8, 2, '#3a1a08'); frect(ctx, tx, y - 0.5, 6, 1, '#ffe08a'); frect(ctx, x - 1.5, y - 1.5, 3, 3, '#3a1a08'); frect(ctx, x - 1, y - 1, 2, 2, '#ffffff'); } },
  crate: { speed: 3.2, ox: 20, oy: 80, grav: 0.34, r: 16, rz: 13, sfx: 'throw', mv: { dmg: 11, knock: 'down', hsV: 10, shake: 2 },
    init(p, o) { const T = Math.max(16, Math.abs((o.tx ?? p.x + p.vx * 30) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
    end(p) { chipsAt(p.x, p.z, 8, 12, ['#3a3a46', '#8a90a0', '#c9a43a']); Audio2.sfxPlay('break'); G.shake(2, 6); },
    draw(p, ctx, x, y) { const sp = propSprite('flight', 0); ctx.save(); ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS); ctx.rotate(p.t * 0.12 * p.dir); ctx.drawImage(sp, -spW(sp) / 2, -spH(sp) / 2, spW(sp), spH(sp)); ctx.restore(); } },
  // ---- armi dei giocatori ----
  confetti: { speed: 8.5, ox: 62, oy: 64, life: 26, pierce: 3, noShadow: true, pierceProps: true, mv: { dmg: 8, knock: 'down', launch: 0.8, meter: 2 },
    reach: p => 14 + p.t * 0.9,
    init(p) { p.bits = []; for (let i = 0; i < 30; i++) p.bits.push({ dx: rand(-4, 4), dy: rand(-6, 6), sx: rand(0.4, 1.4), sy: rand(-0.9, 0.9), c: pick(['#ff4d6d', '#3ec5ff', '#ffd23e', '#62f08e', '#c58bff', '#ffffff']) }); },
    draw(p, ctx, x, y) { for (const b of p.bits) frect(ctx, x - p.dir * p.t * b.sx * 0.9 + b.dx, y + b.dy + b.sy * p.t, 1.5, 1.5, b.c); } },
  disc: { speed: 7.4, ox: 36, oy: 62, life: 80, mv: { dmg: 9, knock: 'down', meter: 2 },
    end(p, hit) { if (hit) { chipsAt(p.x, p.z, p.y, 8, ['#15151a', '#3a3a46', '#ffd34a']); Audio2.sfxPlay('break', 0.6); } },
    draw(p, ctx, x, y) { blitHi(ctx, discSprite('#ffd34a', (p.t >> 2) % 2), x - 11, y - 6); } },
  toss: { speed: 8, ox: 30, oy: 70, life: 90, mv: { dmg: 14, knock: 'down', hsV: 10, launch: 1.1, meter: 3, shake: 2 },
    upd(p) { p.vy -= 0.08; if (p.y + p.vy < 8) p.vy = 8 - p.y; },
    end(p, hit) { chipsAt(p.x, p.z, p.y, 9, ['#b4bac6', '#7d8392', '#1c1c24']); if (hit) Audio2.sfxPlay('break', 0.7); },
    draw(p, ctx, x, y) { const sp = weaponSprite(p.o.wk || 'tubo'); ctx.save(); ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS); ctx.rotate(Math.round(p.t / 3) * Math.PI / 4 * p.dir); ctx.drawImage(sp, -spW(sp) / 2, -spH(sp) / 2, spW(sp), spH(sp)); ctx.restore(); } },
  notebomb: { speed: 5.6, ox: 58, oy: 68, life: 46, r: 14, rz: 13, sfx: 'boom', mv: { dmg: 4, knock: 'light' },
    upd(p) { if (p.t % 2 === 0) addFx('glit', p.x - p.vx * 2, p.z, p.y, { life: 16, col: pick(['#ffd34a', '#fff2a8']) }); },
    end(p) { G.projs.push(new Explosion(p.owner, p.x, p.z, 48, { dmg: 16, knock: 'down', hsV: 10, launch: 1.2, gore: 1 })); },
    draw(p, ctx, x, y) { blitHi(ctx, noteSprite('#ffd34a'), x - 6, y - 10); } },
  laser: { speed: 0, ox: 44, oy: 66, life: 14, noHit: true, noShadow: true, sfx: 'laser',
    init(p) {
      const x0 = p.x, x1 = p.x + p.dir * 240;
      for (const e of foesOf(p.owner)) if (hitOk(e) && Math.abs(e.z - p.z) < 14 && (e.x - x0) * p.dir > -8 && (e.x - x0) * p.dir < 240) applyHit(p.owner, e, { dmg: 10, knock: 'down', hsA: 0, hsV: 9, meter: 2 }, { dir: p.dir, noStopA: true });
      if (p.team === 'p') for (const pr of G.props) if (pr.alive && Math.abs(pr.z - p.z) < 14 && (pr.x - x0) * p.dir > 0 && (pr.x - x0) * p.dir < 240) pr.hit(p.owner, {});
      p.len = 240;
    },
    draw(p, ctx, x, y) {
      const w = p.t < 4 ? 4 : Math.max(0.5, 4 - (p.t - 4) * 0.4), x1 = x + p.dir * p.len;
      ctx.fillStyle = 'rgba(58,224,255,0.45)'; ctx.fillRect(Math.min(x, x1), y - w - 1, Math.abs(x1 - x), w * 2 + 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.min(x, x1), y - w / 2, Math.abs(x1 - x), Math.max(0.5, w));
    } },
  flame: { speed: 4.6, ox: 34, oy: 64, life: 16, pierce: 9, noShadow: true, pierceProps: true, mv: { dmg: 2, knock: 'light', stun: 10, push: 0.5, meter: 1, gore: 0 },
    reach: p => 8 + p.t * 0.9,
    upd(p) { p.vx *= 0.94; p.y += 0.25; },
    draw(p, ctx, x, y) { const k = p.t / 16, r = 3 + p.t * 0.7; ctx.globalAlpha = 1 - k * 0.7; fdisc(ctx, x, y, r, k < 0.4 ? '#fff2a8' : k < 0.7 ? '#ffb03a' : '#ff5a1a'); ctx.globalAlpha = 1; } },
  water: { speed: 7, ox: 30, oy: 62, life: 40, r: 11, rz: 10, mv: { dmg: 3, knock: 'light', stun: 12, push: 0.8 },
    mvFor(p, e) { return e.undead ? { dmg: 10, knock: 'down', hsA: 0, hsV: 9, meter: 3 } : p.mv; },
    onHit(p, e) { if (e.undead) { for (let i = 0; i < 6; i++) addFx('smoke', e.x, e.z, 60, { life: 24 }); popText('SSSS!', e.x, e.z, 110, '#9ad8ff', 24); } },
    end(p) { splat(p.x, p.z, 4, '#4ab0ff'); },
    draw(p, ctx, x, y) { fdisc(ctx, x, y, 2, '#4ab0ff'); frect(ctx, x - 1, y - 1, 1, 1, '#ffffff'); frect(ctx, x - p.dir * 5, y - 0.5, 4, 1, 'rgba(154,216,255,0.7)'); } },
  bomb: { speed: 4.8, ox: 22, oy: 74, grav: 0.32, r: 14, rz: 12, sfx: 'throw', mv: { dmg: 4, knock: 'light' },
    // mira il nemico più vicino davanti (sulla stessa corsia), altrimenti cade a ~110 px
    init(p) { const f = foesOf(p.owner).filter(e => hitOk(e) && (e.x - p.x) * p.dir > 10 && Math.abs(e.z - p.z) < 30).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      const dx = f ? Math.min(260, Math.abs(f.x - p.x)) : 90, T = clamp(dx / Math.abs(p.vx), 12, 54); p.vy = arcVy(p.y, T, p.grav); if (f) p.vz = clamp((f.z - p.z) / T, -1, 1); },
    end(p) { G.projs.push(new Explosion(p.owner, p.x, p.z, 56, { dmg: 18, knock: 'down', hsV: 10, launch: 1.3, gore: 1 })); },
    draw(p, ctx, x, y) { const sp = weaponSprite('grancassa'); ctx.save(); ctx.translate(Math.round(x * RS) / RS, Math.round(y * RS) / RS); ctx.rotate(p.t * 0.2 * p.dir); ctx.drawImage(sp, -spW(sp) / 2, -spH(sp) / 2, spW(sp), spH(sp)); ctx.restore(); if ((p.t >> 1) % 2) frect(ctx, x - 1, y - 14, 2, 2, '#fff2a8'); } },
};

// ================= ESPLOSIONE, NUVOLA, PERICOLI =================
class Explosion {
  constructor(owner, x, z, r, mv) {
    this.owner = owner; this.team = owner ? owner.team : 'e'; this.x = x; this.z = z; this.y = 0; this.r = r; this.t = 0; this.alive = true;
    for (const e of foesOf(owner)) if (hitOk(e) && Math.hypot((e.x - x) / r, (e.z - z) / (r * 0.5)) <= 1) applyHit(owner, e, Object.assign({ hsA: 0 }, mv), { dir: sign(e.x - x) || 1, noStopA: true });
    if (this.team === 'p') for (const pr of G.props) if (pr.alive && Math.hypot((pr.x - x) / r, (pr.z - z) / (r * 0.5)) <= 1) { pr.hits = pr.hp; pr.destroy(owner); }
    G.shake(4, 14); Audio2.sfxPlay('explode'); dust(x, z, 10);
    chipsAt(x, z, 10, 18, ['#ffd34a', '#ff7a2a', '#3a3446', '#fff2a8'], 4);
    if (typeof G.decals !== 'undefined') G.decals.push({ x, z, rx: r * 0.55, col: '#14101a', t: 20, a: 0.55 });
  }
  get danger() { return false; }
  update() { if (++this.t > 28) this.alive = false; }
  draw(ctx, camX) {
    const x = this.x - camX, k = this.t / 28, r = this.r * (0.35 + k * 0.7);
    ctx.globalAlpha = 1 - k;
    fdisc(ctx, x, this.z - r * 0.5, r * 0.9, k < 0.3 ? '#ffffff' : '#ff7a1a');
    fdisc(ctx, x, this.z - r * 0.55, r * 0.6, k < 0.5 ? '#fff2a8' : '#ffb03a');
    if (k > 0.4) fdisc(ctx, x, this.z - r * 0.9, r * 0.5, '#3a3446');
    ctx.globalAlpha = 1;
  }
}
// nuvola tossica (vernice spray, fumogeni): fa poco danno ma a lungo
class Cloud {
  constructor(owner, x, z, c, o = {}) { this.owner = owner; this.team = owner ? owner.team : 'e'; this.x = x; this.z = z; this.y = 0; this.t = 0; this.alive = true; this.c = c; this.hitT = new Map(); this.life = o.life || 150; this.dmg = o.dmg; this.knock = o.knock; }
  get danger() { return this.team === 'e'; }
  get dodgeR() { return 30; }
  update() {
    this.t++;
    for (const e of foesOf(this.owner)) {
      if (!hitOk(e) || Math.abs(e.x - this.x) > 28 || Math.abs(e.z - this.z) > 13 || e.y > 30) continue;
      const last = this.hitT.get(e) || -99; if (this.t - last < (this.team === 'e' ? 40 : 30)) continue;
      this.hitT.set(e, this.t); applyHit(this.owner, e, { dmg: this.dmg ?? (this.team === 'e' ? 2 : 3), knock: this.knock || 'light', stun: 22, push: 0.3, hsA: 0, hsV: 4 }, { dir: sign(e.x - this.x) || 1, noStopA: true });
    }
    if (this.t > this.life) this.alive = false;
  }
  draw(ctx, camX) {
    const x = this.x - camX, a = this.t < this.life - 30 ? 0.55 : 0.55 * (this.life - this.t) / 30;
    ctx.globalAlpha = a;
    for (let i = 0; i < 7; i++) { const an = i * 0.9 + this.t * 0.03; ctx.fillStyle = i % 2 ? this.c : shade(this.c, 0.7); ctx.beginPath(); ctx.arc(x + Math.cos(an) * 16, this.z - 10 + Math.sin(an * 1.3) * 6 - (i % 3) * 6, 9 + (i % 2) * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}
// pericolo annunciato a terra: colonna di fuoco, raggio di luce, getto di fumo...
class Beam {
  constructor(owner, x, z, delay = 0, o = {}) {
    this.owner = owner; this.team = owner ? owner.team : 'e'; this.x = x; this.z = clamp(z, LANE_TOP + 3, LANE_BOTTOM - 3); this.y = 0;
    this.t = -delay; this.alive = true; this.done = new Set(); this.warn = o.warn || 48; this.style = o.style || 'light'; this.dmg = o.dmg || 10; this.rx = o.rx || 18;
    this.col = o.col || null;
  }
  get danger() { return this.team === 'e' && this.t > 0 && this.t < this.warn + 5; }
  get dodgeR() { return this.rx + 8; }
  update() {
    this.t++;
    if (this.t > 0 && this.t < this.warn && this.t % 12 === 0) Audio2.sfxPlay('beamWarn');
    if (this.t === this.warn) { Audio2.sfxPlay(this.style === 'fire' ? 'flame' : 'beam'); G.shake(1, 4); }
    if (this.t >= this.warn && this.t < this.warn + 6) {
      for (const p of foesOf(this.owner)) {
        if (this.done.has(p) || !hitOk(p)) continue;
        if (Math.abs(p.x - this.x) < this.rx && Math.abs(p.z - this.z) < 13) { this.done.add(p); applyHit(this.owner, p, { dmg: this.dmg, knock: 'down', hsA: 0, hsV: 8 }, { dir: sign(p.x - this.x) || 1, noStopA: true }); }
      }
    }
    if (this.t > this.warn + 16) this.alive = false;
  }
  draw(ctx, camX) {
    if (this.t <= 0) return;
    const x = this.x - camX, fire = this.style === 'fire';
    const rgb = this.col ? [1, 3, 5].map(i => parseInt(this.col.slice(i, i + 2), 16)).join(',') : null;
    const warnC = rgb ? 'rgba(' + rgb + ',' : fire ? 'rgba(255,120,40,' : 'rgba(255,90,200,';
    if (this.t < this.warn) {
      const on = this.t > this.warn - 16 ? (this.t >> 1) % 2 : (this.t >> 3) % 2;
      pixelShadow(ctx, x, this.z, this.rx, 6, warnC + (on ? '0.75)' : '0.35)'));
      pixelShadow(ctx, x, this.z, this.rx * 0.45, 3, 'rgba(255,255,255,0.6)');
    } else {
      const k = this.t - this.warn, w = k < 4 ? this.rx * 0.72 : Math.max(1, this.rx * 0.72 - (k - 3) * 1.4);
      if (fire) {
        const top = this.z - 130 + Math.sin(k) * 4;
        ctx.fillStyle = 'rgba(255,90,20,0.75)'; ctx.fillRect(x - w - 3, top, w * 2 + 6, this.z - top);
        ctx.fillStyle = '#ffb03a'; ctx.fillRect(x - w * 0.7, top + 10, w * 1.4, this.z - top - 10);
        ctx.fillStyle = '#fff2a8'; ctx.fillRect(x - w * 0.3, top + 24, w * 0.6, this.z - top - 24);
        if (k % 2 === 0) addFx('ember', x + camX + rand(-w, w), this.z, rand(10, 120), { life: 16, vx: rand(-0.6, 0.6), vy: rand(0.5, 1.5) });
      } else {
        ctx.fillStyle = rgb ? 'rgba(' + rgb + ',0.55)' : 'rgba(255,120,220,0.55)'; ctx.fillRect(x - w - 3, 0, w * 2 + 6, this.z);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2, 0, Math.max(0.5, w), this.z);
      }
      pixelShadow(ctx, x, this.z, this.rx + 4, 6, 'rgba(255,255,255,0.8)');
    }
  }
}
// onda d'urto che corre a terra: si evita saltando
class Shock {
  constructor(owner, x, z, dir, o = {}) { this.owner = owner; this.team = owner ? owner.team : 'e'; this.x = x; this.z = z; this.y = 0; this.dir = dir; this.vx = dir * (o.speed || 5); this.t = 0; this.alive = true; this.hit = new Set(); this.col = o.col || '#ffd34a'; this.dmg = o.dmg || 9; this.rz = o.rz || 16; }
  get danger() { return this.team === 'e'; }
  get dodgeR() { return 20; }
  update() {
    this.t++; this.x += this.vx;
    if (this.t % 3 === 0) dust(this.x, this.z, 1);
    for (const p of foesOf(this.owner)) {
      if (this.hit.has(p) || !hitOk(p) || p.y > 14) continue;
      if (Math.abs(p.x - this.x) < 16 && Math.abs(p.z - this.z) < this.rz) { this.hit.add(p); applyHit(this.owner, p, { dmg: this.dmg, knock: 'down', hsA: 0, hsV: 8, launch: 1.2 }, { dir: this.dir, noStopA: true }); }
    }
    if (this.x < G.cam.x - 40 || this.x > G.cam.x + W + 40) this.alive = false;
  }
  draw(ctx, camX) {
    const x = this.x - camX;
    for (let k = 0; k < 4; k++) { const h = 22 - k * 5, xx = x - this.dir * k * 5; frect(ctx, xx - 2, this.z - h, 4, h, k ? shade(this.col, 1 - k * 0.15) : '#ffffff'); }
    pixelShadow(ctx, x, this.z, 16, 3, 'rgba(255,220,120,0.5)');
  }
}
// oggetto che cade dall'alto su un punto segnalato (lampadario, faro, cassa...)
class FallObj {
  constructor(owner, x, z, kind = 'chandelier', o = {}) { this.owner = owner; this.team = owner ? owner.team : 'e'; this.x = clamp(x, G.cam.x + 30, G.cam.x + W - 30); this.z = clamp(z, LANE_TOP + 4, LANE_BOTTOM - 4); this.y = 260; this.vy = 0; this.t = -(o.delay || 0); this.alive = true; this.kind = kind; this.warn = o.warn || 50; this.landed = false; this.dmg = o.dmg || 14; this.r = o.r || 34; }
  get danger() { return this.team === 'e' && !this.landed && this.t > 0; }
  get dodgeR() { return this.r + 10; }
  update() {
    this.t++; if (this.t <= 0) return;
    if (this.t === 1) Audio2.sfxPlay('beamWarn');
    if (!this.landed && this.t > this.warn) {
      this.vy -= 0.9; this.y += this.vy;
      if (this.y <= 0) {
        this.y = 0; this.landed = true; this.lt = 0;
        for (const p of foesOf(this.owner)) if (hitOk(p) && Math.hypot((p.x - this.x) / this.r, (p.z - this.z) / (this.r * 0.45)) <= 1) applyHit(this.owner, p, { dmg: this.dmg, knock: 'down', hsA: 0, hsV: 10, launch: 1.2 }, { dir: sign(p.x - this.x) || 1, noStopA: true });
        G.shake(4, 14); Audio2.sfxPlay('break'); dust(this.x, this.z, 12);
        chipsAt(this.x, this.z, 10, 18, this.kind === 'chandelier' ? ['#ffd34a', '#e8f4ff', '#ffffff'] : ['#3a3446', '#c9cdd6', '#ff4d6d'], 4);
      }
    }
    if (this.landed && ++this.lt > 30) this.alive = false;
  }
  draw(ctx, camX) {
    if (this.t <= 0) return;
    const x = this.x - camX;
    if (!this.landed) pixelShadow(ctx, x, this.z, clamp(this.r * (1 - this.y / 300), 8, this.r), 5, (this.t >> 2) % 2 ? 'rgba(255,60,60,0.55)' : 'rgba(8,4,16,0.5)');
    const y = this.z - this.y;
    if (this.kind === 'chandelier') {
      frect(ctx, x - 0.5, y - 80, 1, 50, '#3a3446');
      for (let k = -3; k <= 3; k++) { frect(ctx, x + k * 6 - 1, y - 26 + Math.abs(k) * 2, 2, 8, '#ffd34a'); fdisc(ctx, x + k * 6, y - 28 + Math.abs(k) * 2, 1.5, '#fff2a8'); }
      frect(ctx, x - 22, y - 18, 44, 4, '#c9a43a'); frect(ctx, x - 22, y - 18, 44, 1, '#fff0a8');
      for (let k = -4; k <= 4; k++) frect(ctx, x + k * 5 - 0.5, y - 14, 1, 6 + (k % 2 ? 3 : 0), '#e8f4ff');
    } else if (FALL_PROPS[this.kind]) {
      const sp = propSprite(FALL_PROPS[this.kind], 0);
      if (this.kind !== 'coffin') frect(ctx, x - 0.5, y - spH(sp) - 60, 1, 60, '#3a3446');
      blitHi(ctx, sp, x - spW(sp) / 2, y - spH(sp));
    } else {
      frect(ctx, x - 0.5, y - 80, 1, 54, '#3a3446');
      frect(ctx, x - 12, y - 26, 24, 18, '#2a2a34'); frect(ctx, x - 12, y - 26, 24, 2, '#5a5a6a'); fdisc(ctx, x, y - 14, 6, '#fff2a8'); fdisc(ctx, x, y - 14, 3, '#ffffff');
    }
  }
}

// oggetti che possono piovere dall'alto (usano gli sprite degli oggetti distruttibili)
const FALL_PROPS = { crate: 'flight', coffin: 'bara', barrel: 'botte', amp: 'ampli', tomb: 'lapide', dummy: 'manichino' };

// ================= COLPI SPECIALI DEI MUSICISTI (anche per i loro doppi malvagi) =================
class RingWave {
  constructor(owner) { this.owner = owner; this.team = owner.team; this.x = owner.x; this.z = owner.z; this.y = 48; this.t = 0; this.alive = true; this.hit = new Set(); }
  get danger() { return this.team === 'e'; }
  get dodgeR() { return 9 + this.t * 4.4 + 20; }
  update() {
    this.t++;
    const r = 9 + this.t * 4.4;
    for (const e of foesOf(this.owner)) {
      if (this.hit.has(e) || !hitOk(e)) continue;
      const dx = e.x - this.x, dz = e.z - this.z;
      if ((dx * dx) / (r * r) + (dz * dz) / ((r * 0.42) ** 2) <= 1) {
        this.hit.add(e);
        applyHit(this.owner, e, { dmg: this.team === 'e' ? 10 : 16, knock: 'down', hsA: 0, hsV: 10, launch: 1.1, meter: 0 }, { dir: sign(dx) || 1, noStopA: true });
      }
    }
    if (this.t > 26) this.alive = false;
  }
  draw(ctx, camX) {
    const r = 9 + this.t * 4.4;
    const cols = this.team === 'e' ? ['#ffffff', '#ff4040', '#9a1020'] : ['#ffffff', '#7ae8ff', '#ff7ad9'];
    for (let k = 0; k < 3; k++) {
      const rr = r - k * 11; if (rr < 4) continue;
      ctx.fillStyle = cols[(k + (this.t >> 1)) % 3];
      for (let a = 0; a < 140; a++) {
        const an = a / 140 * Math.PI * 2;
        frect(ctx, this.x - camX + Math.cos(an) * rr, this.z - 2 + Math.sin(an) * rr * 0.42, 1.5, 0.5);
        if (a % 2 === 0) frect(ctx, this.x - camX + Math.cos(an) * rr * 0.5, this.z - this.y - 30 + Math.sin(an) * rr * 0.5, 1, 1);
      }
    }
  }
}
class Bolt {
  constructor(owner, x, z) {
    this.owner = owner; this.team = owner.team; this.x = x; this.z = z; this.y = 0; this.t = 0; this.alive = true;
    this.pts = []; let px = 0;
    for (let yy = 0; yy <= z; yy += 8) { this.pts.push([px, yy]); px = clamp(px + randi(-6, 6), -12, 12); }
    this.pts.push([0, z]);
    Audio2.sfxPlay('zap'); G.doFlash(2, '#bfefff');
  }
  get danger() { return this.team === 'e' && this.t < 2; }
  get dodgeR() { return 30; }
  update() {
    this.t++;
    if (this.t === 2) {
      for (const e of foesOf(this.owner)) {
        if (!hitOk(e)) continue;
        if (Math.abs(e.x - this.x) < 22 && Math.abs(e.z - this.z) < 20) {
          this.owner.hitList && this.owner.hitList.clear();
          applyHit(this.owner, e, { dmg: this.team === 'e' ? 7 : 9, knock: 'down', hsA: 0, hsV: 10, meter: 0 }, { dir: this.owner.facing, noStopA: true });
        }
      }
      sparks(this.x, this.z, 3, true); G.shake(2, 5);
    }
    if (this.t > 12) this.alive = false;
  }
  draw(ctx, camX) {
    const x0 = this.x - camX, ev = this.team === 'e';
    const c = this.t < 4 ? '#ffffff' : (this.t < 8 ? (ev ? '#ffb0b0' : '#bfefff') : (ev ? '#ff3040' : '#3ec5ff'));
    for (let i = 0; i < this.pts.length - 1; i++) {
      const [ax, ay] = this.pts[i], [bx, by] = this.pts[i + 1];
      const steps = Math.max(1, Math.abs(by - ay) * 2);
      for (let s = 0; s <= steps; s++) {
        const xx = x0 + ax + (bx - ax) * s / steps, yy = ay + (by - ay) * s / steps;
        frect(ctx, xx - 4, yy, 9, 0.5, ev ? '#7a1020' : '#1f6fd0');
        frect(ctx, xx - 2.5, yy, 5, 0.5, ev ? '#ff3040' : '#3ec5ff');
        frect(ctx, xx - 1, yy, 2, 0.5, c);
      }
    }
    pixelShadow(ctx, x0, this.z, 20, 5, ev ? 'rgba(255,120,120,0.5)' : 'rgba(190,240,255,0.55)');
  }
}
class Cymbal {
  constructor(owner) { this.owner = owner; this.team = owner.team; this.x = owner.x + owner.facing * 18; this.z = owner.z; this.y = 56; this.vx = owner.facing * 7.2; this.t = 0; this.alive = true; this.hit = new Set(); }
  get danger() { return this.team === 'e'; }
  update() {
    this.t++; this.x += this.vx;
    for (const e of foesOf(this.owner)) {
      if (this.hit.has(e) || !hitOk(e)) continue;
      if (Math.abs(e.x - this.x) < 18 && Math.abs(e.z - this.z) < 13) { this.hit.add(e); applyHit(this.owner, e, { dmg: 9, knock: 'down', hsA: 0, hsV: 8, meter: 0 }, { dir: sign(this.vx), noStopA: true }); }
    }
    if (this.x < G.cam.x - 40 || this.x > G.cam.x + W + 40) this.alive = false;
  }
  draw(ctx, camX) {
    const x = this.x - camX, y = this.z - this.y;
    pixelShadow(ctx, x, this.z, 9, 2.5, 'rgba(8,4,16,0.3)');
    const w = [11, 8, 3, 8][(this.t >> 1) % 4];
    frect(ctx, x - w - 1, y - 3, w * 2 + 2, 6, OUTLINE);
    frect(ctx, x - w, y, w * 2, 2, '#a9801f');
    frect(ctx, x - w, y - 2, w * 2, 2, '#f2c94c');
    frect(ctx, x - w, y - 2, w, 0.5, '#fff0a8');
  }
}
function pianoSprite(evil) {
  return procSprite('piano' + (evil ? 'e' : ''), 80, 52, (pb, ox, oy) => {
    const T = tones(evil ? '#3a0a12' : '#1c1c24');
    pb.fill(ox + 6, oy, 68, 37, (u, v) => { const x = u + 6, top = 22 - Math.max(0, x - 46) * 0.32; if (v < top) return 0; return v < top + 0.5 ? T.L : v < top + 3 ? T.M : (x > 66 ? T.S : T.M); });
    pb.line(ox + 14, oy + 22, ox + 62, oy + 3, T.D, 2); pb.line(ox + 62, oy + 3, ox + 68, oy + 14, T.D, 2);
    pb.line(ox + 16, oy + 20, ox + 60, oy + 4, T.L, 0.5);
    pb.fill(ox + 6, oy + 19, 20, 3, (u, v) => v >= 1 ? (v < 2 ? col('#f4f2ea') : col('#d8d6ce')) : ((Math.floor(u) % 2) ? col('#15151a') : 0));
    for (const lx of [9, 40, 66]) { pb.fill(ox + lx, oy + 37, 3, 14, u => u < 1 ? T.M : u < 2 ? T.S : T.D); pb.rect(ox + lx - 1, oy + 49, 5, 2, col('#c9a43a')); }
    pb.rect(ox + 30, oy + 28, 10, 1, col('#ffd34a'));
  });
}
class PianoDrop {
  constructor(owner, x, z) { this.owner = owner; this.team = owner.team; this.x = clamp(x, G.cam.x + 36, G.cam.x + W - 36); this.z = z; this.y = 300; this.vy = -3; this.t = 0; this.alive = true; this.landed = false; }
  get danger() { return this.team === 'e' && !this.landed; }
  get dodgeR() { return 80; }
  update() {
    this.t++;
    if (!this.landed) {
      this.vy -= 0.8; this.y += this.vy;
      if (this.y <= 0) {
        this.y = 0; this.landed = true; this.lt = 0;
        for (const e of foesOf(this.owner)) {
          if (!hitOk(e)) continue;
          if (Math.abs(e.x - this.x) < 72 && Math.abs(e.z - this.z) < 28) applyHit(this.owner, e, { dmg: this.team === 'e' ? 14 : 26, knock: 'down', hsA: 0, hsV: 12, launch: 1.3, meter: 0, gore: 1 }, { dir: sign(e.x - this.x) || 1, noStopA: true });
        }
        G.shake(4, 16); G.doFlash(5); Audio2.sfxPlay('piano'); dust(this.x, this.z, 16);
        for (let i = 0; i < 7; i++) addFx('note', this.x + rand(-30, 30), this.z, 30, { life: 50, vx: rand(-1.4, 1.4), vy: rand(1.4, 2.8), col: pick(['#ffffff', '#ffd23e']) });
      }
    } else if (++this.lt > 40) {
      this.alive = false;
      chipsAt(this.x, this.z, 16, 14, ['#141418', '#f4f2ea', '#3a3a46'], 3.5);
      Audio2.sfxPlay('break');
    }
  }
  draw(ctx, camX) {
    const sp = pianoSprite(this.team === 'e');
    pixelShadow(ctx, this.x - camX, this.z, this.landed ? 40 : clamp(40 - this.y / 10, 12, 40), 6, this.team === 'e' && !this.landed ? 'rgba(255,40,40,0.5)' : 'rgba(8,4,16,0.4)');
    blitHi(ctx, sp, this.x - camX - 41, this.z - this.y - 52);
  }
}

// ================= OGGETTI DISTRUTTIBILI =================
const PROP_CFG = {
  bidone: { w: 24, h: 33, hp: 2, roll: true, sfx: 'metal', cols: ['#8d98a8', '#5a6272', '#c9d2de'] },
  botte: { w: 26, h: 30, hp: 2, roll: true, sfx: 'hit', cols: ['#8a5a30', '#5a3a1a', '#c9a43a'] },
  cassa: { w: 28, h: 26, hp: 2, sfx: 'hit', cols: ['#b07a3e', '#7a4f22', '#d9a564'] },
  jukebox: { w: 32, h: 54, hp: 3, sfx: 'hit', cols: ['#d23a5a', '#ffd34a', '#3ae0ff', '#f4f2ea'], score: 1000 },
  ampli: { w: 30, h: 44, hp: 3, sfx: 'metal', cols: ['#22222a', '#c9a43a', '#5a5a66'] },
  flight: { w: 34, h: 24, hp: 2, sfx: 'metal', cols: ['#3a3a46', '#8a90a0', '#c9a43a'] },
  lapide: { w: 24, h: 30, hp: 2, sfx: 'hit', cols: ['#8a8494', '#5a5466', '#c9c4d0'] },
  bara: { w: 22, h: 50, hp: 3, sfx: 'hit', cols: ['#5a3420', '#3a2010', '#c9a43a'], score: 600 },
  manichino: { w: 22, h: 60, hp: 2, sfx: 'hit', cols: ['#e8d8c8', '#c4b0a0', '#ff7ab8'] },
};
function propSprite(kind, stage) {
  const C_ = col;
  if (typeof PROP_SPRITES_EXTRA !== 'undefined' && PROP_SPRITES_EXTRA[kind]) return PROP_SPRITES_EXTRA[kind](stage);
  if (kind === 'bidone' || kind === 'botte') return procSprite(kind + stage, 26, 33, (pb, ox, oy) => {
    const barrel = kind === 'botte', T = tones(barrel ? '#8a5a30' : '#8d98a8'), Hp = tones(barrel ? '#3a3446' : '#8d98a8');
    pb.fill(ox + 1, oy + 4, 23, 28, (x, y) => {
      if (y > 25.5 && (x < 1 || x > 21.5)) return 0;
      const bulge = barrel ? Math.sin(y / 28 * Math.PI) * 1.4 : 0; if (x < 1 - bulge || x > 22 + bulge) return 0;
      const dent = stage && Math.hypot(x - 14, y - 12) < 4;
      const s = Math.cos((x - 7) / 11 * 1.6) * 0.9 - 0.3 + (dent ? -0.7 : 0);
      let c = bandTone(T, s);
      const hoopY = barrel ? [3, 13, 23] : [6, 18];
      for (const hy of hoopY) { if (y >= hy && y < hy + (barrel ? 1.5 : 1)) c = barrel ? bandTone(Hp, s) : T.D; if (!barrel && y >= hy + 1 && y < hy + 1.5) c = T.L; }
      if (barrel && Math.floor(x * 2) % 9 === 0) c = T.D;
      if (!barrel && Math.floor(x * 2) % 10 === 0 && !dent) c = T.S;
      return c;
    });
    pb.fill(ox, oy + 1, 25, 4, (x, y) => bandTone(T, y < 2 ? 0.6 : -0.3));
    if (!barrel) { pb.rect(ox + 9, oy, 6, 2, T.D); pb.rectF(ox + 10, oy, 4, 0.5, T.L); }
  });
  if (kind === 'cassa') return procSprite('cassa' + stage, 28, 26, (pb, ox, oy) => {
    const T = tones('#b07a3e'), F = tones('#d9a564');
    pb.fill(ox, oy, 28, 26, (x, y) => {
      let s = 0.3 - (y / 26) * 0.6 + (x / 28) * 0.3;
      if (y % 6 < 0.5) s -= 0.6;
      let c = bandTone(T, s);
      const frame = x < 3 || x > 25 || y < 3 || y > 23;
      const diag = Math.abs((x - 3) - (y - 3) * (22 / 20)) < 1.6 || Math.abs((25 - x) - (y - 3) * (22 / 20)) < 1.6;
      if (frame || diag) c = bandTone(F, 0.2 - y / 40);
      if (stage && _hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.06) c = T.D;
      if (stage && Math.abs(x - 14) < 0.8 && y > 8 && y < 20) c = C_('#2a1808');
      return c;
    });
  });
  if (kind === 'jukebox') return procSprite('jukebox' + stage, 32, 54, (pb, ox, oy) => {
    const R = tones('#c42040'), Y = tones('#ffd34a'), Cc = tones('#3ae0ff'), Wd = tones('#5a2a1a');
    pb.fill(ox, oy, 32, 54, (x, y) => {
      if (y < 12 && Math.hypot(x - 16, y - 12) > 16) return 0;
      const s = (x / 32) * 0.8 - 0.3;
      if (x < 3 || x > 29) return bandTone(R, s);
      if (y < 14) return (Math.hypot(x - 16, y - 12) > 12) ? bandTone(Y, s + 0.3) : (stage ? C_('#2a2a34') : bandTone(Cc, 0.5 - y / 14 + ((Math.floor(x * 2) + Math.floor(y * 2)) % 5 === 0 ? 0.6 : 0)));
      if (y < 26) return (y < 15 || y >= 25) ? Y.M : ((Math.floor(x) % 3 === 0) ? C_('#15151a') : C_('#f4f2ea'));
      if (y < 46) { if (Math.abs(x - 5.5) < 0.5 || Math.abs(x - 26.5) < 0.5) return Y.L; return (x > 5 && x < 27) ? (((Math.floor(x * 2) + Math.floor(y * 2)) % 2 === 0) ? Wd.S : Wd.D) : bandTone(R, s); }
      return bandTone(Wd, s - 0.2);
    });
    if (!stage) for (let i = 0; i < 6; i++) pb.rect(ox + 8 + i * 3, oy + 20, 1, 1, C_(['#ff4d6d', '#3ae0ff', '#62f08e', '#ffd34a', '#c58bff', '#ff9b45'][i]));
  });
  if (kind === 'ampli') return procSprite('ampli' + stage, 30, 44, (pb, ox, oy) => {
    const T = tones('#22222a'), Gr = tones('#3a3a46');
    pb.fill(ox, oy, 30, 44, (x, y) => {
      if (x < 1.5 || x > 28.5 || y < 1.5 || y > 42.5) return T.S;
      if (y < 7) { if (y > 2.5 && y < 5.5 && (Math.floor(x) % 4 === 1)) return C_('#c9cdd6'); return y < 3 ? C_('#c9a43a') : T.M; }
      if (y > 7 && y < 8) return T.D;
      for (const cy of [17, 33]) { const d = Math.hypot(x - 15, y - cy); if (d < 7.5) { if (stage && d < 6 && _hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.3) return C_('#0c0a10'); return d < 2.2 ? C_('#4a4a58') : d < 6.6 ? ((Math.floor(x * 2) + Math.floor(y * 2)) % 2 ? Gr.S : Gr.D) : Gr.M; } }
      return ((Math.floor(x * 2) + Math.floor(y * 2)) % 3 === 0) ? T.D : T.M;
    });
    pb.dot(ox + 26, oy + 4, C_('#ff4d6d'));
  });
  if (kind === 'flight') return procSprite('flight' + stage, 34, 24, (pb, ox, oy) => {
    const T = tones('#3a3a46');
    pb.fill(ox, oy, 34, 24, (x, y) => {
      if ((x < 3 || x > 31) && (y < 3 || y > 21)) return C_(y < 2 || x < 1 ? '#e6e9ef' : '#8a90a0');
      if (y < 1.5 || y > 22.5 || x < 1.5 || x > 32.5) return C_('#c9cdd6');
      if (Math.abs(y - 12) < 0.75) return C_('#8a90a0');
      if (x > 13 && x < 21 && y > 9 && y < 15) return C_(y < 10 ? '#e6e9ef' : '#5a5a66');
      if (stage && _hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.07) return T.D;
      if (x > 4 && x < 12 && y > 4 && y < 8) return C_('#ffffff');
      return bandTone(T, 0.3 - y / 30 + x / 80);
    });
    pb.fill(ox + 5, oy + 4.5, 6, 3, (x, y) => (Math.floor(x * 2) % 3 === 0 && y > 0.5 && y < 2.5) ? C_('#c42032') : 0);
  });
  if (kind === 'lapide') return procSprite('lapide' + stage, 24, 30, (pb, ox, oy) => {
    const T = tones('#8a8494');
    pb.fill(ox, oy, 24, 30, (x, y) => {
      if (y < 10 && Math.hypot(x - 12, y - 10) > 10.5) return 0;
      if (stage && Math.abs(x - 12 - (y - 15) * 0.3) < 0.8) return C_('#2a2632');
      if (y > 26) return T.D;
      if (Math.abs(x - 12) < 0.8 && y > 6 && y < 17) return T.D;
      if (Math.abs(y - 9.5) < 0.6 && x > 8 && x < 16) return T.D;
      if (y > 19 && y < 20 && x > 5 && x < 19 && Math.floor(x) % 2) return T.S;
      if (_hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.08) return T.S;
      if (_hash(Math.floor(x * 2) + 7, Math.floor(y * 2)) < 0.04 && y > 18) return C_('#3a6a2a');
      return bandTone(T, (x - 12) / -14 + 0.25 - y / 60);
    });
  });
  if (kind === 'bara') return procSprite('bara' + stage, 22, 50, (pb, ox, oy) => {
    const T = tones('#5a3420');
    const poly = [[5, 0], [17, 0], [22, 12], [17, 50], [5, 50], [0, 12]];
    pb.fill(ox, oy, 22, 50, (x, y) => {
      if (!inPoly(x, y, poly)) return 0;
      if (!inPoly(x, y, [[6.5, 1.5], [15.5, 1.5], [20.2, 12], [15.6, 48.5], [6.4, 48.5], [1.8, 12]])) return C_('#c9a43a');
      if ((Math.abs(x - 11) < 0.75 && y > 10 && y < 26) || (Math.abs(y - 15) < 0.75 && x > 7 && x < 15)) return C_(stage ? '#3a2010' : '#c9a43a');
      if (stage && Math.abs(x - 11 + (y - 30) * 0.2) < 0.6 && y > 20) return C_('#120a06');
      return bandTone(T, (11 - x) / 14 + 0.1 + ((Math.floor(y * 2) % 7 === 0) ? -0.4 : 0));
    });
  });
  if (kind === 'manichino') return procSprite('manichino' + stage, 22, 60, (pb, ox, oy) => {
    const T = tones('#e8d8c8');
    pb.fill(ox, oy, 22, 60, (x, y) => {
      if (Math.hypot((x - 11) / 4.2, (y - 6) / 5.2) < 1) return bandTone(T, (11 - x) / 6 + (6 - y) / 10);
      if (y > 10 && y < 13 && Math.abs(x - 11) < 1.5) return T.S;
      if (y >= 13 && y < 34 && Math.abs(x - 11) < 7 - Math.abs(y - 22) * 0.12) { if (stage && y > 26 && x > 13) return 0; return y < 26 ? C_(y < 15 ? '#ffb8d8' : '#ff7ab8') : bandTone(T, (11 - x) / 8); }
      if (y >= 34 && y < 56 && (Math.abs(x - 8.5) < 2 || Math.abs(x - 13.5) < 2)) return bandTone(T, (11 - x) / 8 - 0.2);
      if (y >= 56 && y < 60 && Math.abs(x - 11) < 7) return C_('#3a3446');
      if (y > 14 && y < 30 && (Math.abs(x - 3) < 1.4 - (y - 14) * 0.01 || (!stage && Math.abs(x - 19) < 1.4))) return bandTone(T, -0.1);
      return 0;
    });
    if (!stage) { pb.dot(ox + 12.5, oy + 5.5, col('#18161e')); pb.dot(ox + 14, oy + 5.5, col('#18161e')); }
  });
}

class Prop {
  constructor(kind, x, z, drop = null) {
    this.kind = kind; this.x = x; this.z = z; this.y = 0; this.drop = drop; this.alive = true;
    this.stage = 0; this.hits = 0; this.vx = 0; this.rolling = false; this.shake = 0; this.hitSet = new Set();
    Object.assign(this, PROP_CFG[kind]);
  }
  hit(a, mv) {
    this.hits++; this.shake = 6;
    sparks(this.x, this.z, this.h / 2, false);
    if (this.roll && this.hits === 1 && a && a.facing) {
      this.rolling = true; this.vx = a.facing * 6.4; this.stage = 1; this.hitSet.clear(); this.owner = a;
      Audio2.sfxPlay(this.sfx); return;
    }
    if (this.kind === 'jukebox' && this.hits < this.hp) { Audio2.sfxPlay('special', 0.6); notes(this.x, this.z, 46, 4); return; }
    Audio2.sfxPlay(this.sfx);
    if (this.hits >= this.hp) this.destroy(a);
    else this.stage = 1;
  }
  destroy(a) {
    if (!this.alive) return;
    this.alive = false;
    Audio2.sfxPlay('break');
    chipsAt(this.x, this.z, this.h / 2, 14, this.cols, 3.2);
    if (this.boom) { G.projs.push(new Explosion(a && a.team === 'p' ? a : null, this.x, this.z, 58, { dmg: 22, knock: 'down', hsV: 11, launch: 1.4, gore: 2 })); popText('KABOOM!', this.x, this.z, 90, '#ffd23e', 40); }
    if (this.kind === 'muro') { popText(pickLine(['SFONDATO!', '~CHE BUCO DI CULO!']), this.x, this.z, 100, '#ffd23e', 40); dust(this.x, this.z, 12); }
    if (this.kind === 'bara' && goreOn()) { for (let i = 0; i < 4; i++) addFx('chip', this.x, this.z, 30, { life: 40, vx: rand(-2, 2), vy: rand(2, 5), col: '#efe9dc' }); }
    if (this.drop) {
      G.pickups.push(WEAPONS[this.drop] ? new WeaponItem(this.drop, this.x, this.z) : new Pickup(this.drop, this.x, this.z));
      if (this.drop === 'vinile' || this.drop === 'plettro') { G.stats.secrets++; popText('SEGRETO!', this.x, this.z, 90, '#ffd23e'); }
    }
    if (a && a.addScore) a.addScore(this.score || 100);
  }
  update() {
    if (this.shake > 0) this.shake--;
    if (this.rolling) {
      this.x += this.vx; this.vx *= 0.975;
      for (const e of G.enemies) {
        if (this.hitSet.has(e) || !canBeHit(e)) continue;
        if (Math.abs(e.x - this.x) < 22 && Math.abs(e.z - this.z) < 13) { this.hitSet.add(e); applyHit(this.owner, e, { dmg: 9, knock: 'down', hsA: 0, hsV: 8, meter: 3 }, { dir: sign(this.vx), noStopA: true }); }
      }
      if (Math.abs(this.vx) < 0.5 || this.x < G.cam.x + 14 || this.x > G.cam.x + W - 14) { this.rolling = false; this.vx = 0; this.x = clamp(this.x, G.cam.x + 16, G.cam.x + W - 16); }
    }
  }
  draw(ctx, camX) {
    const sp = propSprite(this.kind, this.stage), w = spW(sp), h = spH(sp);
    let x = this.x - camX - w / 2; if (this.shake) x += this.shake % 2 ? 1 : -1;
    pixelShadow(ctx, this.x - camX, this.z, this.w / 2 + 3, 4);
    if (this.rolling) {
      ctx.save(); ctx.translate(Math.round((this.x - camX) * RS) / RS, Math.round((this.z - 12) * RS) / RS);
      ctx.rotate(Math.round((this.x / 8) % 4) * Math.PI / 2 * sign(this.vx));
      ctx.drawImage(sp, -w / 2, -h / 2, w, h); ctx.restore();
      return;
    }
    blitHi(ctx, sp, x, this.z - h + 2);
    if (this.kind === 'muro') drawWallTag(ctx, this.x - camX, this.z - h + 24, this.stage);
  }
}

// ================= BONUS =================
const PICKUPS = {
  pollo: { name: 'POLLO ARROSTO', heal: 0.7, w: 24, h: 16, draw(pb, ox, oy) {
    const T = tones('#c87a2a');
    pb.fill(ox, oy, 24, 16, (x, y) => {
      if (y > 13) return Math.abs(x - 11) < 11 ? col(y < 14 ? '#f4f2ea' : '#c9cdd6') : 0;                      // piatto
      if (Math.hypot((x - 10) / 9, (y - 8) / 6) < 1) return bandTone(T, (10 - x) / 12 + (8 - y) / 8 + (_hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.1 ? -0.4 : 0));
      if (x > 17 && x < 22 && Math.abs(y - 5 + (x - 17) * 0.5) < 1.2) return col(x > 20.5 ? '#f4f2ea' : '#e0a050');
      return 0;
    });
  } },
  pizza: { name: 'PIZZA', heal: 0.45, w: 22, h: 16, draw(pb, ox, oy) {
    pb.fill(ox, oy, 22, 16, (x, y) => {
      if (Math.abs(x - 11) > 11 - y * 0.66) return 0;
      if (y < 3) return col(y < 1 ? '#f0b860' : '#d68a32');
      if (y < 5) return col('#ffe680');
      if (Math.hypot(x - 7.5, y - 6.5) < 2 || Math.hypot(x - 14.5, y - 7.5) < 2 || Math.hypot(x - 10.5, y - 11.5) < 1.6) return col(Math.hypot(x - 7, y - 6) < 0.7 ? '#ff7a6a' : '#c8322a');
      return col(_hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.12 ? '#fff2b0' : '#ffd34a');
    });
  } },
  panino: { name: 'PANINO', heal: 0.25, w: 20, h: 13, draw(pb, ox, oy) {
    pb.fill(ox, oy, 20, 13, (x, y) => {
      if (y < 5 && Math.hypot(x - 10, (y - 5) * 2) > 10) return 0;
      if (y < 5) return col(_hash(Math.floor(x * 2), Math.floor(y * 2)) < 0.1 ? '#fff2c0' : y < 2 ? '#f0b060' : '#d9963a');
      if (y < 7) return col(Math.floor(x * 2) % 4 < 2 ? '#4ac05a' : '#3a9a4a');
      if (y < 9) return col('#c8323a');
      return col(y > 12 ? '#a86a2a' : '#d9963a');
    });
  } },
  bibita: { name: 'BIBITA', heal: 0.15, w: 10, h: 17, draw(pb, ox, oy) { shadedRect(pb, ox, oy + 2, 10, 14, '#e0303a'); pb.rect(ox, oy, 10, 2, col('#c9d2de')); pb.rectF(ox, oy, 10, 0.5, col('#ffffff')); pb.rect(ox, oy + 16, 10, 1, col('#8d98a8')); pb.rect(ox + 2, oy + 6, 6, 3, col('#ffffff')); pb.rectF(ox + 1, oy + 3, 0.5, 12, col('#ff8a8a')); } },
  disco: { name: 'DISCO', score: 500, w: 17, h: 17, draw(pb, ox, oy) { pb.disc(ox + 8, oy + 8, 7.6, col('#15151a')); pb.disc(ox + 8, oy + 8, 5, col('#2a2a34')); pb.disc(ox + 8, oy + 8, 2.4, col('#e0423a')); pb.dot(ox + 8.5, oy + 8.5, col('#15151a')); pb.line(ox + 4, oy + 3, ox + 6, oy + 2, col('#7a7a88'), 0.5); } },
  cassetta: { name: 'CASSETTA', score: 300, w: 20, h: 12, draw(pb, ox, oy) { shadedRect(pb, ox, oy, 20, 12, '#2a2a34'); pb.rect(ox + 2, oy + 2, 16, 5, col('#f2c94c')); pb.disc(ox + 6, oy + 4, 1.6, col('#15151a')); pb.disc(ox + 13, oy + 4, 1.6, col('#15151a')); pb.rect(ox + 5, oy + 9, 10, 2, col('#5a5a66')); } },
  vinile: { name: "VINILE D'ORO", score: 5000, w: 17, h: 17, draw(pb, ox, oy) { const T = tones('#ffd34a'); pb.fill(ox, oy, 17, 17, (x, y) => { const d = Math.hypot(x - 8.5, y - 8.5); if (d > 8.2) return 0; return d < 2.6 ? col('#e0423a') : bandTone(T, ((x - y) / 17) + ((Math.floor(d * 2) % 2) ? 0.2 : -0.1)); }); } },
  nota: { name: 'NOTA', meter: 50, w: 14, h: 16, draw(pb, ox, oy) { const T = tones('#3ec5ff'); pb.ellipse(ox + 4, oy + 13, 4, 2.6, T.M); pb.dot(ox + 3, oy + 12, T.L); pb.rect(ox + 7, oy + 1, 2, 13, T.M); pb.rectF(ox + 7, oy + 1, 0.5, 13, T.L); pb.line(ox + 8, oy + 1, ox + 13, oy + 5, T.M, 2); } },
  ampli: { name: 'AMPLIFICATORE', power: 600, w: 22, h: 17, draw(pb, ox, oy) { shadedRect(pb, ox, oy, 22, 17, '#22222a'); pb.rect(ox + 1, oy + 1, 20, 4, col('#ffd34a')); pb.rect(ox + 3, oy + 2, 2, 2, col('#15151a')); pb.rect(ox + 7, oy + 2, 2, 2, col('#15151a')); pb.disc(ox + 11, oy + 11, 4.6, col('#3a3a46')); pb.disc(ox + 11, oy + 11, 2, col('#15151a')); pb.dot(ox + 18, oy + 2, col('#ff4d6d')); } },
  plettro: { name: "PLETTRO D'ORO", life: 1, w: 14, h: 15, draw(pb, ox, oy) { const T = tones('#ffd34a'); pb.fill(ox, oy, 14, 15, (x, y) => { const half = y < 4 ? 7 - (4 - y) * 0.3 : 7 - (y - 4) * 0.62; if (Math.abs(x - 7) > half) return 0; return bandTone(T, 0.5 - y / 14 + (x < 6 ? 0.3 : -0.1)); }); } },
};
class Pickup {
  constructor(kind, x, z, o = {}) { this.kind = kind; this.def = PICKUPS[kind]; this.x = clamp(x, G.cam.x + 20, G.cam.x + W - 20); this.z = clamp(z, LANE_TOP + 3, LANE_BOTTOM - 3); this.y = o.y ?? 14; this.vy = o.vy ?? 3.2; this.vx = o.vx || 0; this.alive = true; this.t = 0; this.ttl = o.ttl || 0; this.dropped = !!o.ttl; }
  update() {
    this.t++;
    if (this.vx) { this.x = clamp(this.x + this.vx, G.cam.x + 14, G.cam.x + W - 14); this.vx *= 0.93; if (Math.abs(this.vx) < 0.05) this.vx = 0; }
    if (this.y > 0 || this.vy > 0) { this.vy -= 0.35; this.y = Math.max(0, this.y + this.vy); if (this.y === 0) this.vy = 0; }
    if (this.ttl && this.t > this.ttl) { this.alive = false; addFx('smoke', this.x, this.z, 10, { life: 20 }); return; }
    if (this.t < (this.dropped ? 40 : 12)) return;
    for (const p of G.players) {
      if (!p.active || p.out || !['idle', 'walk', 'land', 'attack'].includes(p.state)) continue;
      if (Math.abs(p.x - this.x) < 20 && Math.abs(p.z - this.z) < 11) { this.collect(p); return; }
    }
  }
  collect(p) {
    const d = this.def; this.alive = false;
    if (d.heal) { if (p.hp >= p.maxHp) p.addScore(200); p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * d.heal)); Audio2.sfxPlay('food'); popText(d.name + '!', this.x, this.z, 80, '#62f08e', 40); }
    if (d.score) { p.addScore(d.score); Audio2.sfxPlay('coin'); popText('+' + d.score, this.x, this.z, 70, '#ffd23e', 40); }
    if (d.meter) { p.gainMeter(d.meter); Audio2.sfxPlay('power'); popText('SPECIALE +', this.x, this.z, 80, '#3ec5ff', 40); }
    if (d.power) { p.powerT = d.power; Audio2.sfxPlay('power'); popText('VOLUME AL MASSIMO!', this.x, this.z, 90, '#ff9b45', 60); }
    if (d.life) { p.lives++; Audio2.sfxPlay('oneup'); popText('VITA EXTRA!', this.x, this.z, 90, '#ffd23e', 60); }
    if (d.perk) p.gainPerk(d.perk, this);
    if (d.beans) { p.fartT = 70; Audio2.sfxPlay('food'); popText(pickLine(['FAGIOLI ALLA DIAVOLA!', '~OH NO... I FAGIOLI...']), this.x, this.z, 90, '#c87a2a', 60); p.line('food', 1); }
    else if (d.heal) p.line('food', 0.6, 120);
  }
  draw(ctx, camX) {
    const d = this.def;
    const sp = procSprite('pk_' + this.kind, d.w, d.h, (pb, ox, oy) => d.draw(pb, ox, oy));
    const bob = this.y > 0 ? 0 : Math.round(Math.sin(this.t * 0.12) * 2) / 2;
    if (this.ttl && this.ttl - this.t < 180 && (this.t >> 2) % 2) return;   // sta per sparire: lampeggia
    pixelShadow(ctx, this.x - camX, this.z, spW(sp) / 2, 3);
    if (d.perk) { const k = 0.5 + 0.5 * Math.sin(this.t * 0.15); ctx.globalAlpha = 0.25 + 0.2 * k; fdisc(ctx, this.x - camX, this.z - this.y - spH(sp) / 2 - 1 + bob, 13, PERKS[d.perk].col); ctx.globalAlpha = 1; }
    blitHi(ctx, sp, this.x - camX - spW(sp) / 2, this.z - this.y - spH(sp) - 1 + bob);
    if (d.perk && (this.t >> 3) % 3 === 0) frect(ctx, this.x - camX - 6 + (this.t % 12), this.z - this.y - spH(sp) + 1, 1.5, 1.5, '#ffffff');
    if ((this.kind === 'vinile' || this.kind === 'plettro' || this.kind === 'ampli') && (this.t >> 3) % 2) frect(ctx, this.x - camX + 4, this.z - this.y - spH(sp) + 2, 1.5, 1.5, '#ffffff');
  }
}

// ================= ARMI A TERRA =================
function weaponSprite(kind) {
  const W_ = WEAPONS[kind], I = INSTRUMENTS[W_.spr];
  const w = I.len + 6, hh = Math.max(22, (I.vr || 9) * 2 + 4);
  return procSprite('wi_' + kind, w, hh, (pb, ox, oy) => {
    if (kind === 'dischi') { for (let i = 0; i < 3; i++) drawInstrument(pb, 'vinyl', ox + 2 + i * 2, oy + hh / 2 + 3 - i * 3, 0, 0); return; }
    drawInstrument(pb, W_.spr, ox + 3, oy + hh / 2, (I.len > 40 ? -6 : 0), 0);
  });
}
class WeaponItem {
  constructor(kind, x, z, uses, y = 14) {
    this.kind = kind; this.isWeapon = true; this.def = { weapon: true };
    this.uses = uses ?? WEAPONS[kind].uses;
    this.x = clamp(x, G.cam.x + 24, G.cam.x + W - 24); this.z = clamp(z, LANE_TOP + 3, LANE_BOTTOM - 3);
    this.y = y; this.vy = 3.4; this.vx = 0; this.alive = true; this.t = 0;
  }
  update() {
    this.t++;
    if (this.y > 0 || this.vy > 0) {
      this.vy -= 0.4; this.y = Math.max(0, this.y + this.vy); this.x += this.vx;
      if (this.y === 0) { if (this.vy < -2.5) { this.vy = -this.vy * 0.35; Audio2.sfxPlay('metal', 0.4); } else this.vy = 0; this.vx *= 0.5; }
    }
    if (this.x < G.cam.x - 60) this.alive = false;
  }
  draw(ctx, camX) {
    const sp = weaponSprite(this.kind), w = spW(sp), h = spH(sp);
    pixelShadow(ctx, this.x - camX, this.z, w / 2 - 2, 3);
    blitHi(ctx, sp, this.x - camX - w / 2, this.z - this.y - h + 6);
    // luccichio che scorre sull'arma: segnala che si può raccogliere
    const g = this.t % 50;
    if (g < 8) {
      const gx = this.x - camX - w / 2 + 4 + (g / 8) * (w - 8), gy = this.z - this.y - h / 2 + 3;
      frect(ctx, gx, gy - 2, 0.5, 4.5, '#ffffff'); frect(ctx, gx - 2, gy, 4.5, 0.5, '#ffffff');
    }
  }
}
