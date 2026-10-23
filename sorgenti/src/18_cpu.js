// ============================================================
// COMPAGNO CPU per la partita in solitario (attivabile nelle opzioni)
// Produce lo stesso tipo di input di un giocatore umano.
// ============================================================
class CPUBrain {
  constructor(p) { this.p = p; const id = 'cpu' + p.slot; this.src = Input.sources[id] = Input._blank(); p.src = id; this.t = 0; this.atkT = 0; this.lane = 0; this.retreatT = 0; }
  think() {
    const p = this.p, s = this.src;
    this.t++;
    const want = { left: false, right: false, up: false, down: false, atk: false, jump: false, heavy: false, spec: false, start: false, back: false };
    const goTo = (x, z, tol = 4) => {
      if (x < p.x - tol) want.left = true; else if (x > p.x + tol) want.right = true;
      if (z < p.z - 2) want.up = true; else if (z > p.z + 2) want.down = true;
    };
    if (p.out) { if (this.t % 180 === 0) want.start = true; }
    else if (p.state === 'grabbedE') { want.atk = this.t % 4 < 2; want.left = this.t % 8 < 4; want.right = !want.left; }
    else if (p.state === 'grab') { want.atk = this.t % 14 === 0; if (p.knees >= 2) { if (p.facing > 0) want.right = true; else want.left = true; } }
    else {
      // pericoli: raggi del boss e piroetta
      const beam = G.projs.find(o => o.danger && o.dodgeR && Math.abs(o.x - p.x) < o.dodgeR && Math.abs(o.z - p.z) < 18);
      const boss = G.bossRef && G.bossRef.isBoss ? G.bossRef : null;
      const spinning = boss && (boss.state === 'spinTele' || boss.state === 'spin') && Math.abs(boss.z - p.z) < 18;
      const ko = G.players.find(o => o !== p && o.state === 'ko');
      const leader = G.players.find(o => o !== p && o.active && !o.out && !o.cpu) || p;
      const foes = G.enemies.filter(e => e.alive && !['dead', 'down', 'intro'].includes(e.state) && e.x > G.cam.x - 10 && e.x < G.cam.x + W + 10);
      const disc = G.projs.find(o => o.danger && !o.dodgeR && o.vx && Math.abs(o.z - p.z) < 12 && sign(p.x - o.x) === sign(o.vx) && Math.abs(o.x - p.x) < 160);
      // anti-blocco: se resta fermo a lungo con dei nemici in giro, cambia corsia e salta
      const hpSum = foes.reduce((a, e) => a + e.hp, 0);
      if (foes.length && hpSum === this.lastHpSum && Math.abs(p.x - (this.lastX ?? p.x)) < 3 && Math.abs(p.z - (this.lastZ ?? p.z)) < 3) this.stuckT = (this.stuckT || 0) + 1; else { this.stuckT = 0; this.lastX = p.x; this.lastZ = p.z; this.lastHpSum = hpSum; }
      if (this.stuckT > 360) { this.unstickT = 40; this.stuckT = 0; this.unstickZ = clamp(p.z + (p.z > (LANE_TOP + LANE_BOTTOM) / 2 ? -40 : 40), LANE_TOP, LANE_BOTTOM); }
      if (this.unstickT > 0) { this.unstickT--; goTo(p.x + (this.unstickT > 20 ? 30 : -30), this.unstickZ); if (this.unstickT === 30) want.jump = true; }
      else if (disc && !beam && !spinning) { goTo(p.x, clamp(p.z + (p.z > (LANE_TOP + LANE_BOTTOM) / 2 ? -30 : 30), LANE_TOP, LANE_BOTTOM)); }
      else if (beam || spinning) {
        const away = (beam ? beam.z : boss.z) < p.z ? 1 : -1;
        goTo(p.x, clamp(p.z + away * 34, LANE_TOP, LANE_BOTTOM));
      } else if (ko) {
        goTo(ko.x + 22, ko.z, 8);
        if (Math.abs(ko.x - p.x) < 34 && Math.abs(ko.z - p.z) < 14 && this.t % 10 === 0) want.atk = true;
      } else if (foes.length) {
        const e = foes.sort((a, b) => (Math.abs(a.x - p.x) + Math.abs(a.z - p.z) * 2) - (Math.abs(b.x - p.x) + Math.abs(b.z - p.z) * 2))[0];
        if (this.tgt !== e) { this.tgt = e; this.side = sign(p.x - e.x) || 1; }
        let side = this.side;
        const range = p.wpn ? WEAPONS[p.wpn.kind].cpuRange : (20 + p.S.reach * 2) * K;
        if (e.x + side * range < G.cam.x + 18 || e.x + side * range > G.cam.x + W - 18) side = this.side = -side;
        if (p.hp < p.maxHp * 0.25 && Math.abs(e.x - p.x) < 60 && this.retreatT <= 0 && chance(0.02)) this.retreatT = 50;
        if (this.retreatT > 0) { this.retreatT--; goTo(e.x + side * 140, clamp(e.z + 34 * side, LANE_TOP, LANE_BOTTOM)); }
        else {
          goTo(e.x + side * range, e.z, 3);
          const inRange = Math.abs(Math.abs(e.x - p.x) - range) < (p.wpn ? 24 : 14) && Math.abs(e.z - p.z) < 6;
          if (inRange) {
            // guarda il nemico e attacca a ritmo di combo
            if (e.x > p.x && p.facing < 0) want.right = true;
            if (e.x < p.x && p.facing > 0) want.left = true;
            if (p.wpn && WEAPONS[p.wpn.kind].hold === 'saw') want.atk = true;
            else {
              // segue il ritmo della combo del musicista: preme appena il colpo successivo si può concatenare
              const mv = p.state === 'attack' && p.move && !p.wpn ? p.move : null;
              const ready = mv ? p.mvT >= mv.fr[0] + mv.fr[1] - 1 : true;
              if (ready && ++this.atkT >= (mv ? 3 : 9)) { want.atk = true; this.atkT = 0; }
            }
            const near = foes.filter(o => Math.abs(o.x - p.x) < 90 && Math.abs(o.z - p.z) < 28).length;
            if (p.meter >= 100 && (near >= 2 || e.isBoss) && chance(0.05)) want.spec = true;
            else if (!p.wpn && chance(0.01)) want.heavy = true;
          }
        }
      } else {
        const item = G.pickups.find(it => it.t > 12 && Math.abs(it.x - p.x) < 210 && it.x > G.cam.x + 18 && it.x < G.cam.x + W - 18 && (it.isWeapon ? !p.wpn : (p.hp < p.maxHp * 0.8 || !it.def.heal)));
        if (item) {
          this.dbg = 'item ' + item.kind + '@' + Math.round(item.x) + ',' + Math.round(item.z); goTo(item.x, item.z, 2);
          if (item.isWeapon && Math.abs(item.x - p.x) < 16 && Math.abs(item.z - p.z) < 8 && this.t % 8 === 0) want.atk = true;
        }
        else if (leader === p) {
          // da solo: avanza quando la telecamera è libera, rompe gli oggetti vicini
          this.skipProps = this.skipProps || new Set();
          const prop = G.props.find(o => o.alive && !o.rolling && !this.skipProps.has(o) && Math.abs(o.x - p.x) < 90 && o.x > G.cam.x + 14 && o.x < G.cam.x + W - 14);
          if (prop) {
            this.dbg = 'prop ' + prop.kind + '@' + Math.round(prop.x);
            if (this.tgt !== prop) { this.tgt = prop; this.side = p.x < prop.x ? -1 : 1; this.engaged = false; this.propT = 0; this.propHits = prop.hits; }
            // se dopo un po' non riesce a romperlo (arma che non lo colpisce, compagno in mezzo...), lo lascia stare
            if (prop.hits !== this.propHits) { this.propHits = prop.hits; this.propT = 0; }
            if (++this.propT > 420) { this.skipProps.add(prop); this.tgt = null; }
            let sx = prop.x + this.side * 30;
            if (sx < G.cam.x + 18 || sx > G.cam.x + W - 18) { this.side = -this.side; sx = prop.x + this.side * 30; }
            const d = Math.abs(sx - p.x), dz = Math.abs(prop.z - p.z);
            const faceOk = sign(prop.x - p.x) === p.facing;
            if (dz > 5 || d > 14 || (!faceOk && d > 5)) goTo(sx, prop.z, 2);
            else if (!faceOk) { if (prop.x > p.x) want.right = true; else want.left = true; }
            else if (this.t % 12 === 0) want.atk = true;
          }
          else if (G.cam.max > G.cam.x + 0.2 || G.goT > 0 || (G.level && G.level.pendingZone !== undefined)) {
            this.dbg = 'advance'; want.right = true; if (Math.abs(p.z - 178) > 8) goTo(p.x + 60, 178); }
        } else {
          // segui il compagno umano
          const fx = leader.x - leader.facing * 52;
          if (Math.abs(fx - p.x) > 27 || Math.abs(leader.z + 16 - p.z) > 14) goTo(fx, clamp(leader.z + 16, LANE_TOP, LANE_BOTTOM), 10);
          if (G.goT > 0 && leader.x > p.x - 15) want.right = true;
        }
      }
    }
    // se vuole muoversi ma resta fermo a lungo (bloccato da qualcosa), cambia corsia per un attimo
    if (!p.out && (want.left || want.right || want.up || want.down) && ['walk', 'idle', 'run'].includes(p.state)) {
      if (Math.abs(p.x - (this.mvX ?? -999)) < 1.5 && Math.abs(p.z - (this.mvZ ?? -999)) < 1.5) this.mvT = (this.mvT || 0) + 1; else { this.mvT = 0; this.mvX = p.x; this.mvZ = p.z; }
      if (this.mvT > 180 && !(this.unstickT > 0)) { this.mvT = 0; this.unstickT = 40; this.unstickZ = clamp(p.z + (p.z > (LANE_TOP + LANE_BOTTOM) / 2 ? -40 : 40), LANE_TOP, LANE_BOTTOM); }
    }
    for (const a of ACTIONS) { s.prev[a] = s.held[a]; s.held[a] = want[a]; s.pressed[a] = want[a] && !s.prev[a]; }
  }
}
