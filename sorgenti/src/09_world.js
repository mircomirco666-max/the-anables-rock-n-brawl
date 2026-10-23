// ============================================================
// MONDO: stato di partita, telecamera, collisioni, risoluzione dei colpi
// Coordinate: x orizzontale, z profondità (= y dei piedi a schermo), y altezza
// ============================================================
const G = {
  players: [], enemies: [], projs: [], props: [], pickups: [], fx: [], texts: [], decals: [],
  cam: { x: 0, max: 0, shake: 0, shakeT: 0 },
  level: null, frame: 0, flash: 0, flashCol: '#ffffff', slowmo: 0,
  tokens: new Map(), diff: DIFFS[1], stats: null, bossRef: null, goT: 0, paused: false,
  reset() {
    this.players = []; this.enemies = []; this.projs = []; this.props = []; this.pickups = []; this.fx = []; this.texts = []; this.decals = [];
    this.cam = { x: 0, max: 0, shake: 0, shakeT: 0 }; this.frame = 0; this.flash = 0; this.slowmo = 0;
    this.tokens = new Map(); this.bossRef = null; this.bossGroup = null; this.bossIntro = false; this.goT = 0;
    this.stats = { kills: 0, maxCombo: 0, time: 0, dmgTaken: 0, teamHits: 0, secrets: 0 };
  },
  alivePlayers() { return this.players.filter(p => p.active && !p.out); },
  shake(amt, t) { this.cam.shake = Math.max(this.cam.shake, amt); this.cam.shakeT = Math.max(this.cam.shakeT, t); },
  doFlash(f, c = '#ffffff') { if (typeof Opts !== 'undefined' && Opts.flash === false) f = Math.min(f, 2) * 0.4; this.flash = Math.max(this.flash, f); this.flashCol = c; },
};

// ---------- Token d'attacco: max N attaccanti per giocatore ----------
const Tokens = {
  holders(p) { let s = G.tokens.get(p); if (!s) { s = new Set(); G.tokens.set(p, s); } return s; },
  request(e, p) {
    const s = this.holders(p);
    for (const h of s) if (!h.alive || h.target !== p) s.delete(h);
    if (s.has(e)) return true;
    const max = TUNE.maxAttackersPerPlayer + (G.diff.id === 'difficile' ? 1 : 0);
    if (s.size < max) { s.add(e); return true; }
    return false;
  },
  release(e) { for (const s of G.tokens.values()) s.delete(e); },
};

// ---------- Particelle ed effetti ----------
function addFx(type, x, z, y, o = {}) {
  const f = Object.assign({ type, x, z, y, t: 0, life: 12, vx: 0, vy: 0, vz: 0 }, o);
  G.fx.push(f);
  return f;
}
function sparks(x, z, y, big) {
  addFx(big ? 'sparkBig' : 'spark', x, z + 0.5, y, { life: big ? 10 : 7 });
  for (let i = 0; i < (big ? 7 : 4); i++) addFx('chip', x, z + 0.5, y, { life: 14 + randi(0, 8), vx: rand(-3, 3), vy: rand(0.8, 3.8), col: pick(['#fff3b0', '#ffd34a', '#ffffff']) });
}
function dust(x, z, n = 4) { for (let i = 0; i < n; i++) addFx('dust', x + rand(-10, 10), z, 1, { life: 18 + randi(0, 8), vx: rand(-1.1, 1.1), vy: rand(0.1, 0.8) }); }
function popText(txt, x, z, y, color = '#ffffff', life = 50) { G.texts.push({ txt, x, z, y, color, t: 0, life }); }
function notes(x, z, y, n = 5) { for (let i = 0; i < n; i++) addFx('note', x + rand(-16, 16), z + 0.5, y + rand(0, 32), { life: 40 + randi(0, 20), vx: rand(-0.6, 0.6), vy: rand(0.6, 1.2), col: pick(['#ff4d6d', '#3ec5ff', '#ffd23e', '#62f08e']) }); }
// ---------- Sangue e macchie (horror cartoon, disattivabile nelle opzioni) ----------
function goreOn() { return typeof Opts === 'undefined' || Opts.blood !== false; }
function blood(x, z, y, n = 6, dir = 0, colr = '#b0101a') {
  if (!goreOn() || !colr) return;
  const c2 = shade(colr, 0.68), c3 = mix(colr, '#ff5050', 0.35);
  for (let i = 0; i < n; i++) addFx('blood', x + rand(-3, 3), z + 0.4, y + rand(-4, 4), { life: 60, vx: dir * rand(0.5, 2.8) + rand(-0.9, 0.9), vy: rand(0.6, 3.8), col: pick([colr, colr, c2, c3]), sz: pick([0.5, 1, 1, 1.5]) });
}
function bloodPool(x, z, r = 10, colr = '#7a0a12') {
  if (!goreOn() || !colr) return;
  G.decals.push({ x, z, rx: r, col: shade(colr, 0.75), t: 0, a: 0.85 });
  if (G.decals.length > 110) G.decals.shift();
}
function splat(x, z, r, colr) { if (!goreOn() || !colr) return; G.decals.push({ x, z, rx: r, col: colr, t: 6, a: 0.8, small: true }); if (G.decals.length > 110) G.decals.shift(); }
function drawDecals(ctx, camX) {
  for (const d of G.decals) {
    const x = d.x - camX; if (x < -40 || x > W + 40) continue;
    const k = Math.min(1, (d.t + 1) / 14), rx = d.rx * (d.small ? 1 : (0.3 + 0.7 * k)), ry = rx * 0.32;
    ctx.globalAlpha = d.a; ctx.fillStyle = d.col;
    for (let dy = -ry; dy <= ry; dy += 0.5) { const hw = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.2))); ctx.fillRect(Math.round((x - hw) * RS) / RS, Math.round((d.z + dy) * RS) / RS, Math.round(hw * 2 * RS) / RS, 0.5); }
    if (!d.small) { ctx.globalAlpha = d.a * 0.6; ctx.fillStyle = shade(d.col, 1.4); ctx.fillRect(Math.round((x - rx * 0.3) * RS) / RS, Math.round((d.z - ry * 0.5) * RS) / RS, Math.round(rx * 0.4 * RS) / RS, 0.5); }
    ctx.globalAlpha = 1;
  }
}
function glitter(x, z, y, n = 8) { for (let i = 0; i < n; i++) addFx('glit', x + rand(-22, 22), z + 0.5, y + rand(0, 64), { life: 30 + randi(0, 30), vx: rand(-1.2, 1.2), vy: rand(-0.5, 1.8), col: pick(['#ffe27c', '#ffffff', '#ff7ad9', '#7ae8ff']) }); }

// ---------- Hitbox ----------
// mossa.hb = {x0,x1,y0,y1}: avanti rispetto allo sguardo, altezza rispetto ai piedi dell'attaccante
function moveBox(a, hb) {
  const r = a.reachBonus || 0;   // potenziamento CAVO JACK LUNGO
  const x0 = a.facing > 0 ? a.x + hb.x0 : a.x - hb.x1 - r;
  const x1 = a.facing > 0 ? a.x + hb.x1 + r : a.x - hb.x0;
  return { x0, x1, y0: a.y + hb.y0, y1: a.y + hb.y1 };
}
function hurtOverlap(box, t, zA, zTol) {
  if (Math.abs(zA - t.z) > zTol) return false;
  const hw = t.hurtW / 2;
  if (box.x1 < t.x - hw || box.x0 > t.x + hw) return false;
  if (box.y1 < t.y || box.y0 > t.y + t.hurtH) return false;
  return true;
}
function canBeHit(t) {
  return t.alive && t.inv <= 0 && !t.untouchable && !(t.willDie && t.state === 'knock') && t.state !== 'down' && t.state !== 'dead' && t.state !== 'getup' && t.state !== 'thrown' && t.state !== 'enter' && t.state !== 'special_inv';
}

// Applica un colpo: a = attaccante (può essere null per ambiente), t = bersaglio
function applyHit(a, t, mv, opt = {}) {
  const diffMul = (a && a.team === 'e') ? G.diff.enemyDmg : 1;
  let dmg = mv.dmg * (a && a.dmgMul ? a.dmgMul : 1) * diffMul * (opt.mul || 1);
  if (a && a.powerT > 0) dmg *= 1.5;
  if (t.defense) dmg *= t.defense;
  const back = a && sign(t.x - a.x) === t.facing; // colpito alle spalle
  if (back && t.team === 'e') dmg *= 1.15;
  dmg = Math.max(1, Math.round(dmg));
  if (!Number.isFinite(dmg)) dmg = 1;   // protezione: un attacco senza danno non deve mai rendere la salute NaN
  t.hp -= dmg;
  t.flashT = 4;
  if (t.team === 'p') { G.stats.dmgTaken += dmg; t.gainMeter(dmg * 1.2); t.comboCount = 0; const src = (a ? (a.type || 'p') : 'amb') + ':' + (mv.anim || (mv.dmg + 'dmg')); G.stats.dmgBy = G.stats.dmgBy || {}; G.stats.dmgBy[src] = (G.stats.dmgBy[src] || 0) + dmg; }
  const dir = opt.dir !== undefined ? opt.dir : (a ? (sign(t.x - a.x) || a.facing) : 1);
  const hsA = Math.min(mv.hsA ?? (mv.knock === 'down' ? TUNE.hsHeavy : TUNE.hsLight), TUNE.hsCap);
  // chi è già in aria non va congelato di nuovo: colpi a raffica lo terrebbero sospeso per sempre
  const inAir = t.state === 'knock' && t.y > 0;
  const hsV = inAir ? Math.min(t.hitstop > 0 ? 0 : 2, TUNE.hsCap) : Math.min(mv.hsV ?? (mv.knock === 'down' ? TUNE.hsHeavy + 2 : TUNE.hsLight + 2), TUNE.hsCap);
  if (a && !opt.noStopA) a.hitstop = Math.max(a.hitstop, hsA);
  t.hitstop = Math.max(t.hitstop, hsV);
  t.shakeT = hsV;
  const hx = t.x - dir * 7, hy = t.y + (mv.hb ? clamp((mv.hb.y0 + mv.hb.y1) / 2, 22, 74) : 54);
  sparks(hx, t.z, hy, mv.knock === 'down' || dmg >= 10);
  if (t.bloodCol !== null) {
    const big = mv.knock === 'down' || dmg >= 10;
    blood(hx, t.z, hy, Math.round(((big ? 8 : 4) + (mv.gore || 0) * 4) * (t.team === 'p' ? 0.5 : 1)), dir, t.bloodCol || '#b0101a');
  }
  if (a && a.team === 'p' && mv.inst && a.hitSfx) a.hitSfx(mv, dmg);
  else if (a && a.def && a.def.castId && typeof evilHarmony === 'function') Audio2.charSfx(a.def.castId, 'hit', { mv, big: mv.knock === 'down' || dmg >= 10, H: evilHarmony() });
  else Audio2.sfxPlay(mv.knock === 'down' || dmg >= 10 ? 'hitHeavy' : 'hit');
  if (mv.shake) G.shake(mv.shake, 8);
  // chi tiene un nemico per la gola lo lascia se viene colpito
  if (t.grabbing) t.releaseGrab && t.releaseGrab();
  if (t.grabbedBy && t.grabbedBy !== a) { const g = t.grabbedBy; g.grabbing = null; if (g.holding === t) g.holding = null; g.setState && g.setState('idle', 'idle'); t.grabbedBy = null; if (t.state === 'grabbed' || t.state === 'grabbedE') t.setState('idle', 'idle'); }
  const dead = t.hp <= 0;
  let knock = mv.knock || 'light';
  if (t.armor && knock === 'light' && !dead) {
    t.armorHits = (t.armorHits || 0) + 1;
    if (t.armorHits < t.armor) knock = 'none'; else t.armorHits = 0;
  }
  if (t.superArmor && !dead && knock !== 'down') knock = 'none';
  if (t.noInterrupt && !dead) knock = 'none';
  if (t.bossArmor && !dead && !t.noInterrupt) { t.staggerDmg = (t.staggerDmg || 0) + dmg; if (t.staggerDmg < t.bossArmor) knock = 'none'; else { t.staggerDmg = 0; knock = 'stagger'; } }
  if (dead) knock = 'down';
  let launched = false;
  if (knock === 'down') launched = t.knockDown(dir, mv.launch || 1, dead);
  // colpi forti: il nemico vola e travolge chi incontra (e rimbalza sui bordi dello schermo)
  if (launched && a && a.team === 'p' && t.team === 'e' && !t.isBoss && (dmg >= 9 || (mv.launch || 1) >= 1.2)) { t.flying = a; t.flyHit = new Set([t]); t.wallBounced = false; }
  else if (knock === 'light') t.hurt(dir, mv.stun || 16, mv.push ?? 1.2);
  else if (knock === 'stagger') t.hurt(dir, 26, 2);
  if (a && a.team === 'p') a.onHit(t, mv, dmg);
  if (t.onDamaged) t.onDamaged(a, dmg, dead);
  return dmg;
}

// Controlla una mossa attiva contro una lista di bersagli
function checkMove(a, mv, targets, opt = {}) {
  const box = moveBox(a, mv.hb);
  const ztol = mv.zTol || TUNE.zTol;
  let hits = 0;
  for (const t of targets) {
    if (t === a || a.hitList.has(t) || !canBeHit(t)) continue;
    if (!hurtOverlap(box, t, a.z, ztol)) continue;
    a.hitList.add(t);
    applyHit(a, t, mv, opt);
    hits++;
    if (mv.single) break;
  }
  // oggetti distruttibili
  if (a.team === 'p') for (const pr of G.props) {
    if (!pr.alive || a.hitList.has(pr)) continue;
    if (Math.abs(a.z - pr.z) > ztol + 6) continue;
    if (box.x1 < pr.x - pr.w / 2 || box.x0 > pr.x + pr.w / 2 || box.y0 > pr.h + 64) continue;
    a.hitList.add(pr); pr.hit(a, mv); hits++;
  }
  return hits;
}

// Separazione morbida: i corpi non si attraversano
function separate(list) {
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a.alive || !a.solid()) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (!b.alive || !b.solid()) continue;
      if (a.team === 'p' && b.team === 'p') continue;   // i compagni si possono sovrapporre, come nei classici
      const dz = a.z - b.z;
      if (Math.abs(dz) > 10) continue;
      const dx = a.x - b.x, min = (a.radius + b.radius);
      if (Math.abs(dx) >= min) continue;
      const push = (min - Math.abs(dx)) * 0.25, s = dx === 0 ? (i % 2 ? 1 : -1) : sign(dx);
      const wa = a.heavy ? 0.3 : 1, wb = b.heavy ? 0.3 : 1;
      a.x += s * push * wa; b.x -= s * push * wb;
      const zs = dz === 0 ? 1 : sign(dz);
      a.z = clamp(a.z + zs * 0.2, LANE_TOP, LANE_BOTTOM); b.z = clamp(b.z - zs * 0.2, LANE_TOP, LANE_BOTTOM);
    }
  }
}

// Telecamera: segue la media dei giocatori, non torna indietro, si blocca nelle arene
function updateCamera() {
  const ps = G.alivePlayers().filter(p => p.alive && p.state !== 'dead');
  const cam = G.cam;
  if (ps.length) {
    const minX = Math.min(...ps.map(p => p.x)), maxX = Math.max(...ps.map(p => p.x));
    let target = (minX + maxX) / 2 - W * 0.42;
    target = Math.min(target, minX - 30);           // nessuno resta fuori a sinistra
    target = Math.max(target, maxX - W + 60);
    target = clamp(target, cam.x, cam.max);
    cam.x = approach(cam.x, target, 3.6);
  }
  if (cam.shakeT > 0) cam.shakeT--; else cam.shake = 0;
}
