// ============================================================
// IN VIAGGIO: la band guida il furgone del tour tra un locale e l'altro
// (come la sezione in auto dei picchiaduro Capcom). Si sterza su e giù,
// COLPO = speronata in avanti; si investono motociclisti e zombi, si evitano gli ostacoli.
// ============================================================
const VAN_RIDES = {
  3: { title: 'IN VIAGGIO: TANGENZIALE DI NOTTE', theme: 'city', len: 9000, bikers: 'punk', walkers: 'zombie_fan' },
  6: { title: 'IN VIAGGIO: LA STRADA DEL DESERTO', theme: 'desert', len: 9800, bikers: 'cowboy', walkers: 'cowboy_zombie' },
  9: { title: 'IN VIAGGIO: VERSO IL COVO', theme: 'hell', len: 10500, bikers: 'metallaro', walkers: 'scheletro' },
};
const ROAD_TOP = 150, ROAD_BOT = 214;

// ---------- sprite ----------
const VAN_SC = 1.42, BIKE_SC = 1.3;
function vanSprite(ph) {
  return procSprite('van' + ph, Math.ceil(120 * VAN_SC), Math.ceil(58 * VAN_SC), (pb, ox, oy) => {
    const B = tones('#3a1a5a'), S = tones('#c42032'), C_ = col, GL = C_('#22304c'), GLL = C_('#5a78a8');
    pb.fill(ox, oy, 120 * VAN_SC, 58 * VAN_SC, (U, V) => { const u = U / VAN_SC, v = V / VAN_SC;
      // ruote
      for (const wx of [26, 94]) { const d = Math.hypot(u - wx, v - 47); if (d <= 10) { if (d > 7.5) return C_('#141418'); if (d > 3) { const a = Math.atan2(v - 47, u - wx) + ph * 0.8; return C_(Math.floor(a / 0.7) % 2 ? '#8a90a0' : '#5a5a66'); } return C_('#c9cdd6'); } }
      const inWell = [26, 94].some(wx => v > 34 && Math.hypot(u - wx, v - 47) < 12.5);
      if (inWell) return v > 38 ? C_('#0c0a10') : 0;
      // carrozzeria: muso a destra con parabrezza inclinato
      const front = 120 - Math.max(0, (22 - v) * 0.7);
      if (u < 2 || u > front || v < 6 || v > 46) return 0;
      if (v < 8) return B.L;
      if (u > front - 16 && v < 24 && u < front - 2 && v > 9) return ((u - v * 0.5) % 9 < 2) ? GLL : GL;   // parabrezza
      if (v > 10 && v < 22 && u > 8 && u < 92 && (u - 8) % 28 < 22) return ((u - v * 0.6) % 14 < 2) ? GLL : GL; // finestrini
      if (v > 28 && v < 32) return S.M;                                                                          // fascia rossa
      if (v > 42) return B.D;
      if (u > front - 3 && v > 30) return C_('#c9cdd6');                                                         // paraurti
      if (u > 112 && v > 25 && v < 29) return C_('#fff2a8');                                                     // faro
      return v < 26 ? B.M : B.S;
    });
    // portapacchi con casse e flight case
    pb.fill(ox + 10 * VAN_SC, oy, 80 * VAN_SC, 7 * VAN_SC, (U, V) => { const u = U / VAN_SC, v = V / VAN_SC; if (v > 5) return col('#5a5a66'); if (u > 4 && u < 26) return col(v < 1 ? '#5a5a66' : '#2a2a34'); if (u > 32 && u < 60) return col(v < 1 ? '#e6e9ef' : '#8a90a0'); return 0; });
  });
}
function bikeSprite(c) {
  return procSprite('bike' + c, Math.ceil(58 * BIKE_SC), Math.ceil(30 * BIKE_SC), (pb, ox, oy) => {
    const C_ = col, T = tones(c);
    pb.fill(ox, oy, 58 * BIKE_SC, 30 * BIKE_SC, (U, V) => { const u = U / BIKE_SC, v = V / BIKE_SC;
      for (const wx of [10, 47]) { const d = Math.hypot(u - wx, v - 21); if (d <= 8.5) return d > 6 ? C_('#141418') : d > 2 ? C_('#5a5a66') : C_('#c9cdd6'); }
      if (v > 9 && v < 15 && u > 14 && u < 42) return v < 11 ? T.L : T.M;            // serbatoio e telaio
      if (v > 14 && v < 18 && u > 18 && u < 38) return C_('#8a90a0');                  // motore
      if (v > 15 && v < 18 && u > 2 && u < 16) return C_('#c9cdd6');                   // marmitta
      if (Math.abs(u - 44 + v * 0.35) < 1.2 && v > 4 && v < 20) return C_('#c9cdd6');   // forcella
      if (v > 3 && v < 5 && u > 40 && u < 50) return C_('#18161e');                    // manubrio
      return 0;
    });
  });
}
const RIDE_POSE = P({ air: true, hip: [0, 22], lean: 14, legF: [72, 92], legB: [58, 96], armF: [84, 8], armB: [78, 14], inst: { m: 'none' } });

// ---------- la corsa ----------
class VanRide {
  constructor(n) {
    const d = this.d = VAN_RIDES[n]; this.n = n;
    this.dist = 0; this.speed = 5; this.vx = 0; this.x = 110; this.z = 182; this.hp = this.maxHp = 100; this.t = 0;
    this.ramT = 0; this.ramCD = 0; this.hurtT = 0; this.done = false; this.endT = 0; this.kills = 0; this.wheel = 0;
    this.things = []; this.nextSpawn = 60; this.R = mulberry(n * 77);
    this.buildBg();
  }
  buildBg() {
    const th = this.d.theme, R = this.R;
    const [sky, sc] = bgCanvas(W, 150), [far, fc] = bgCanvas(W * 2, 150);
    if (th === 'city') { bgSkyBands(sc, ['#0b0720', '#120a2c', '#1a0e38', '#241244', '#30164e', '#3c1a56', '#4a1e5a', '#4a1e5a', '#4a1e5a', '#4a1e5a', '#4a1e5a', '#4a1e5a', '#4a1e5a', '#4a1e5a', '#4a1e5a'], R, 60); bgMoon(sc, 320, 24, 10);
      for (let x = 0; x < W * 2;) { const w = 24 + R() * 50, top = 40 + R() * 70; BF(fc, x, top, w, 150 - top, bgPick(R, ['#1a1236', '#20173f', '#16102e'])); for (let wy = top + 4; wy < 146; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (R() < 0.3) BF(fc, wx, wy, 2, 2, bgPick(R, ['#ffd97a', '#ffb44a', '#7ae8ff'])); x += w + R() * 4; } }
    else if (th === 'desert') { const g = sc.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, '#2a1240'); g.addColorStop(0.5, '#a03a4a'); g.addColorStop(1, '#ffb04a'); sc.fillStyle = g; sc.fillRect(0, 0, W, 150); bgMoon(sc, 90, 96, 20, '#ff7a3a');
      fc.fillStyle = '#5a2030'; fc.beginPath(); fc.moveTo(0, 150); let y = 120; for (let x = 0; x <= W * 2; x += 16) { y = clamp(y + (R() - 0.5) * 24, 92, 132); if (R() < 0.12) { fc.lineTo(x, y - 26); fc.lineTo(x + 36, y - 26); x += 36; } fc.lineTo(x, y); } fc.lineTo(W * 2, 150); fc.fill();
      for (let k = 30; k < W * 2; k += 70 + R() * 60) bgCactus(fc, k, 146, 20 + R() * 16, R); }
    else { const g = sc.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, '#120206'); g.addColorStop(0.6, '#5a0a12'); g.addColorStop(1, '#a02a1a'); sc.fillStyle = g; sc.fillRect(0, 0, W, 150); bgMoon(sc, 300, 30, 13, '#ff4a3a');
      fc.fillStyle = '#1a0408'; for (let x = 0; x < W * 2; x += 110) { fc.fillRect(x + 10, 90, 70, 60); for (const tx of [x + 6, x + 40, x + 74]) { const th2 = 26 + R() * 30; fc.fillRect(tx, 90 - th2, 12, th2 + 4); fc.beginPath(); fc.moveTo(tx - 3, 90 - th2); fc.lineTo(tx + 6, 74 - th2); fc.lineTo(tx + 15, 90 - th2); fc.fill(); } } }
    this.sky = sky; this.far = far;
  }
  get players() { return G.players.filter(p => p.active && !p.out); }
  input() {
    // tutti i giocatori umani guidano insieme; senza umani guida il pilota automatico
    const hum = this.players.filter(p => !p.cpu), w = { up: false, down: false, left: false, right: false, atk: false };
    for (const p of hum) { const s = Input.state(p.src); w.up ||= s.held.up; w.down ||= s.held.down; w.left ||= s.held.left; w.right ||= s.held.right; w.atk ||= s.pressed.atk || s.pressed.heavy; }
    if (!hum.length) {
      const ahead = this.things.filter(o => o.x > this.x && o.x < this.x + 200 && o.alive);
      const threat = ahead.find(o => o.kind === 'obst' && Math.abs(o.z - this.z) < 18);
      const prey = ahead.concat(this.things.filter(o => o.kind === 'bike' && o.alive)).find(o => o.kind !== 'obst');
      if (threat) { if (threat.z > this.z || this.z > ROAD_BOT - 14) w.up = true; else w.down = true; }
      else if (prey) { if (prey.z < this.z - 4) w.up = true; else if (prey.z > this.z + 4) w.down = true; if (Math.abs(prey.z - this.z) < 10 && prey.x - this.x < 90) w.atk = true; }
      w.right = this.t % 300 < 150;
    }
    return w;
  }
  spawn() {
    const R = this.R, prog = this.dist / this.d.len, r = R();
    const lane = () => ROAD_TOP + 8 + R() * (ROAD_BOT - ROAD_TOP - 16);
    if (r < 0.38) {   // motociclista che arriva da dietro o da davanti
      const back = R() < 0.5, type = this.d.bikers, look = ENEMY_LOOKS[pick(ENEMY_DEFS[type].looks)];
      this.things.push({ kind: 'bike', x: back ? -60 : W + 70, z: lane(), vx: back ? 1.6 : -1.2, hp: 2, alive: true, look: enemyVariant(look, randi(0, 3), false), bc: pick(['#c42032', '#3a6ae0', '#18161e', '#ffd23e']), atkT: randi(40, 90), nick: PERSONAS[type] ? pick(PERSONAS[type].nicks) : '' });
    } else if (r < 0.7) {   // ostacolo sulla strada
      this.things.push({ kind: 'obst', x: W + 40, z: lane(), alive: true, sub: pick(['cono', 'bidone', 'gomme', 'cassa']) });
    } else {   // zombi che attraversano
      const type = this.d.walkers, look = ENEMY_LOOKS[pick(ENEMY_DEFS[type].looks)], top = R() < 0.5;
      this.things.push({ kind: 'walker', x: W + 20 + R() * 80, z: top ? ROAD_TOP - 6 : ROAD_BOT + 6, vz: top ? 0.55 : -0.55, alive: true, look, anims: enemyAnims('brawler'), t: 0 });
    }
    this.nextSpawn = Math.round((70 - prog * 30) * (0.7 + R() * 0.6) / (G.diff.aggro || 1));
  }
  hitVan(dmg, x, z) {
    if (this.hurtT > 0 || this.ramT > 0) return;
    this.hp = Math.max(0, this.hp - Math.round(dmg * (G.diff.enemyDmg || 1))); this.hurtT = 40; G.shake(3, 10); Audio2.sfxPlay('hitHeavy'); sparks(x, z, 30, true);
    const p = pick(this.players); if (p && chance(0.5)) p.line('hit', 1);
  }
  score(v, x, z, txt) { const ps = this.players; for (const p of ps) p.addScore(v / Math.max(1, ps.length)); popText(txt || '+' + v, x, z, 60, '#ffd23e', 40); }
  update() {
    this.t++; G.frame++;
    if (this.hurtT > 0) this.hurtT--; if (this.ramT > 0) this.ramT--; if (this.ramCD > 0) this.ramCD--;
    for (const p of G.players) if (p.bubble && --p.bubble.t <= 0) p.bubble = null;
    if (this.done) { this.endT++; this.speed = approach(this.speed, 2, 0.05); this.dist += this.speed; return; }
    const w = this.input();
    if (w.up) this.z -= 1.6; if (w.down) this.z += 1.6; this.z = clamp(this.z, ROAD_TOP + 6, ROAD_BOT - 4);
    const tgtX = w.right ? 210 : w.left ? 70 : 120; this.x = approach(this.x, tgtX, 1.2);
    this.speed = approach(this.speed, w.right ? 7.5 : w.left ? 4 : 5.5, 0.08);
    if (w.atk && this.ramCD <= 0) { this.ramT = 22; this.ramCD = 46; Audio2.sfxPlay('swingBig'); popText(pickLine(['SPERONATA!', '~SPOSTATI, STRONZO!']), this.x + 50, this.z, 70, '#ff9b45', 24); }
    if (this.ramT > 0) this.x = Math.min(this.x + 2.6, 250);
    this.dist += this.speed + (this.ramT > 0 ? 2 : 0); this.wheel += this.speed * 0.06;
    if (--this.nextSpawn <= 0 && this.dist < this.d.len - 300) this.spawn();
    const vx0 = this.x - 78, vx1 = this.x + 84;
    for (const o of this.things) {
      if (!o.alive) continue;
      if (o.kind === 'obst') { o.x -= this.speed; if (o.x < -60) o.alive = false;
        if (o.x > vx0 && o.x < vx1 && Math.abs(o.z - this.z) < 14) { o.alive = false; chipsAt(o.x, o.z, 10, 12, ['#ff9b45', '#c9cdd6', '#3a3446'], 3.5); Audio2.sfxPlay('break');
          if (this.ramT > 0) this.score(200, o.x, o.z, 'BOOM! +200'); else this.hitVan(9, o.x, o.z); } }
      else if (o.kind === 'walker') { o.t++; o.x -= this.speed * 0.9; o.z += o.vz; if (o.x < -40 || o.z < ROAD_TOP - 20 || o.z > ROAD_BOT + 20) o.alive = false;
        if (o.x > vx0 && o.x < vx1 && Math.abs(o.z - this.z) < 13) { o.alive = false; this.kills++; this.score(300, o.x, o.z, pickLine(['SPLAT! +300', '~SPIACCICATO! +300']));
          if (goreOn()) { bloodPool(o.x, o.z, 12, '#5a8a1a'); blood(o.x, o.z, 30, 14, 1, '#5a8a1a'); } else chipsAt(o.x, o.z, 30, 12, ['#efe9dc', '#c6bfae'], 3); Audio2.sfxPlay('splat'); } }
      else if (o.kind === 'bike') {
        // il motociclista si affianca al furgone e lo colpisce
        const side = o.z < this.z ? -1 : 1, tz = clamp(this.z + side * 22, ROAD_TOP + 4, ROAD_BOT - 4), tx = this.x + (o.vx > 0 ? -10 : 30);
        o.x += clamp(tx - o.x, -2.4, 2.4) + (o.flung ? 0 : 0); o.z = approach(o.z, tz, 0.7);
        if (o.flung) { o.x += o.fvx; o.z += o.fvz; o.y = (o.y || 0) + o.fvy; o.fvy -= 0.4; if (o.y < 0 || o.x > W + 80 || o.x < -80) { o.alive = false; if (goreOn()) bloodPool(o.x, clamp(o.z, ROAD_TOP, ROAD_BOT), 10, '#a8141e'); } continue; }
        if (--o.atkT <= 0 && Math.abs(o.x - this.x) < 70 && Math.abs(o.z - this.z) < 30) { o.atkT = randi(70, 120); this.hitVan(5, this.x, this.z); if (chance(0.5)) o.say = { txt: pickLine(PERSONAS[this.d.bikers] ? PERSONAS[this.d.bikers].taunt : ['AH AH!']), t: 70 }; }
        if (o.say && --o.say.t <= 0) o.say = null;
        // il furgone lo travolge se gli sterza addosso o lo sperona
        if (o.x > vx0 && o.x < vx1 && Math.abs(o.z - this.z) < (this.ramT > 0 ? 18 : 11)) { o.flung = true; o.fvx = 4 + rand(0, 2); o.fvz = sign(o.z - this.z || 1) * 1.2; o.fvy = 5; o.y = 1; this.kills++;
          this.score(500, o.x, o.z, pickLine(['INVESTITO! +500', '~VOLA, STRONZO! +500'])); Audio2.sfxPlay('hitHeavy'); G.shake(2, 8); if (goreOn()) blood(o.x, o.z, 30, 16, 1, '#a8141e'); }
      }
    }
    this.things = this.things.filter(o => o.alive);
    // fine della corsa
    if (this.hp <= 0 && !this.done) { this.done = 'rotto'; Audio2.sfxPlay('explode'); G.shake(5, 30); for (const p of this.players) p.score = Math.max(0, p.score - 1000); popText(pickLine(['IL FURGONE E\' ANDATO!', '~IL FURGONE E\' ANDATO A PUTTANE!']), this.x, this.z, 120, '#ff4d6d', 120); }
    if (this.dist >= this.d.len && !this.done) { this.done = 'arrivo'; Audio2.sfxPlay('oneup'); const bonus = this.hp * 50; this.score(bonus, this.x, this.z, 'ARRIVATI! +' + bonus); const p = this.players[0]; if (p) p.line('win', 1); }
    if (this.t % 600 === 300) { const p = pick(this.players); if (p) p.say(pickLine(['CHI GUIDA?', '~CHI HA SCOREGGIATO IN FURGONE?', '~FERMATI, DEVO PISCIARE!', 'SIAMO QUASI ARRIVATI?', '~CHE PUZZA DI PIEDI QUI DENTRO']), 100); }
    G.texts.forEach(t => t.t++); G.texts = G.texts.filter(t => t.t < t.life);
    for (const f of G.fx) { f.t++; f.x += f.vx - this.speed * 0.5; f.y = Math.max(0, f.y + f.vy); if (f.type === 'chip' || f.type === 'blood') f.vy -= 0.22; }
    G.fx = G.fx.filter(f => f.t < f.life);
    for (const dc of G.decals) dc.x -= this.speed; G.decals = G.decals.filter(dc => dc.x > -60);
  }
  draw(ctx) {
    const sc = this.dist;
    ctx.drawImage(this.sky, 0, 0, W, 150);
    const fx = -((sc * 0.15) % W); ctx.drawImage(this.far, fx, 0, W * 2, 150);
    // guardrail e lampioni
    ctx.fillStyle = '#2a2632'; ctx.fillRect(0, 138, W, 12); ctx.fillStyle = '#8a90a0'; ctx.fillRect(0, 140, W, 2); ctx.fillRect(0, 145, W, 1.5);
    for (let k = -((sc) % 48); k < W; k += 48) { ctx.fillStyle = '#5a5a66'; ctx.fillRect(k, 140, 2, 10); }
    for (let k = -((sc * 1.0) % 160); k < W; k += 160) { ctx.fillStyle = '#16121e'; ctx.fillRect(k, 60, 3, 80); ctx.fillRect(k, 60, 18, 3); ctx.fillStyle = this.d.theme === 'hell' ? '#ff5a3a' : '#fff2a8'; ctx.fillRect(k + 14, 63, 6, 2); }
    // strada
    ctx.fillStyle = this.d.theme === 'desert' ? '#4a3a34' : '#2a2633'; ctx.fillRect(0, 150, W, H - 150);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 150, W, 3);
    for (const lz of [172, 194]) for (let k = -((sc * 1.0) % 60); k < W; k += 60) { ctx.fillStyle = '#c9a43a'; ctx.fillRect(k, lz, 30, 2); }
    ctx.fillStyle = '#e8e8ea'; ctx.fillRect(0, 218, W, 2);
    drawDecals(ctx, 0);
    // oggetti in ordine di profondità
    const list = this.things.map(o => [o.z, o]); list.push([this.z, this]);
    list.sort((a, b) => a[0] - b[0]);
    for (const [, o] of list) {
      if (o === this) { this.drawVan(ctx); continue; }
      if (o.kind === 'obst') { pixelShadow(ctx, o.x, o.z, 12, 3);
        if (o.sub === 'cono') { ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(o.x - 7, o.z); ctx.lineTo(o.x, o.z - 18); ctx.lineTo(o.x + 7, o.z); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x - 4, o.z - 9, 8, 2); }
        else if (o.sub === 'gomme') { for (let k = 0; k < 3; k++) { fdisc(ctx, o.x, o.z - 4 - k * 6, 7, '#18161e'); fdisc(ctx, o.x, o.z - 4 - k * 6, 3, '#3a3a46'); } }
        else blitHi(ctx, propSprite(o.sub === 'cassa' ? 'cassa' : 'bidone', 0), o.x - 13, o.z - 31); }
      else if (o.kind === 'walker') { const fr = o.anims.walkZ || o.anims.walk, f = fr[(o.t >> 3) % fr.length]; pixelShadow(ctx, o.x, o.z, 12, 3); drawSprite(ctx, getFrame(o.look, 'own', f.p, 'walkZ' + ((o.t >> 3) % fr.length)), o.x, o.z, -1); }
      else if (o.kind === 'bike') {
        const y = o.z - (o.y || 0), dir = 1;
        if (!o.flung) pixelShadow(ctx, o.x, o.z, 26, 4);
        blitHi(ctx, bikeSprite(o.bc), o.x - 38, y - 39);
        drawSprite(ctx, getFrame(o.look, 'own', RIDE_POSE, 'ride'), o.x - 6, y + 2, dir);
        if (o.say) queueBubble(o.say.txt, o.x, y - 96, '#ff4d6d');
      }
    }
    flushBubbles(ctx);
    drawTexts(ctx, 0);
    for (const f of G.fx) drawFxOne(ctx, f, 0);
    // HUD: giocatori, barra del furgone, distanza
    drawHud(ctx);
    const bw = 200, bx = (W - bw) / 2, by = 208;
    drawPanel(ctx, bx - 4, by - 11, bw + 8, 22, 'rgba(12,6,20,0.85)', '#3ec5ff');
    drawText(ctx, 'FURGONE DEL TOUR', bx, by - 9, '#3ec5ff', { outline: '#0a0610' });
    drawText(ctx, Math.max(0, Math.round((this.d.len - this.dist) / 10)) + ' M', bx + bw, by - 9, '#ffffff', { align: 'right' });
    drawLifeBar(ctx, bx, by + 1, bw, 6, this.hp / this.maxHp, hpColor(this.hp / this.maxHp));
    if (this.t < 150) { drawText(ctx, this.d.title, W / 2, 62, '#ffd23e', { align: 'center', scale: textWidth(this.d.title, 2) > W - 10 ? 1 : 2, outline: '#3a1a00' }); drawText(ctx, 'SU/GIU\' STERZA · COLPO SPERONA · AVANTI ACCELERA', W / 2, 84, '#ffffff', { align: 'center', outline: '#0a0610' }); }
    if (this.done) drawText(ctx, this.done === 'rotto' ? 'FURGONE DISTRUTTO!' : 'ARRIVATI!', W / 2, 90, this.done === 'rotto' ? '#ff4d6d' : '#62f08e', { align: 'center', scale: 3, outline: '#0a0610' });
  }
  drawVan(ctx) {
    const x = this.x, z = this.z, bump = (this.t >> 2) % 2 && this.speed > 3 ? 0.5 : 0, blink = this.hurtT > 0 && (this.t >> 2) % 2;
    pixelShadow(ctx, x, z, 84, 7);
    if (blink) ctx.globalAlpha = 0.55;
    blitHi(ctx, vanSprite(Math.floor(this.wheel) % 4), x - 85, z - 83 + bump);
    // la band ai finestrini
    const ps = this.players.slice(0, 4);
    ps.forEach((p, i) => { const cv = portrait(p.char), wx = i === 0 ? x + 46 : x - 70 + (i - 1) * 40; ctx.drawImage(cv, wx, z - 69 + bump, cv.width / RS * 0.72, cv.height / RS * 0.72); });
    drawText(ctx, 'THE ANABLES', x - 6, z - 33 + bump, '#ffd23e', { align: 'center', scale: 2, outline: '#3a0a14' });
    ctx.globalAlpha = 1;
    if (this.ramT > 0) for (let k = 0; k < 3; k++) addFx('streak', x + 70, z, 40 + k * 10, { life: 8, dir: 1, col: '#ff9b45' });
    if (this.t % 6 === 0) addFx('smoke', x - 88, z, 14, { life: 24, vx: -1 });
    for (const p of ps) if (p.bubble) queueBubble(p.bubble.txt, x - 10 + p.slot * 14, z - 88, p.color);
  }
}

// ---------- scena ----------
SCENES.van = {
  enter(arg) { this.next = arg.next; G.projs = []; G.fx = []; G.texts = []; G.decals = []; G.enemies = []; G.bossRef = null; G.bossGroup = null; G.cam = { x: 0, max: 0, shake: 0, shakeT: 0 }; this.ride = new VanRide(arg.after); Audio2.play('van'); },
  update() {
    const r = this.ride; r.update();
    if (G.cam.shakeT > 0) G.cam.shakeT--; else G.cam.shake = 0;
    if (r.done && r.endT > 150) startLevel(this.next);
  },
  draw(ctx) {
    const sh = G.cam.shakeT > 0 ? G.cam.shake : 0;
    ctx.save(); if (sh) ctx.translate(Math.round(rand(-sh, sh)), Math.round(rand(-sh, sh) * 0.5));
    this.ride.draw(ctx); ctx.restore();
  },
};
