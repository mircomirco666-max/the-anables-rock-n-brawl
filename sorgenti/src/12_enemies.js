// ============================================================
// NEMICI — livello 1 "Notte al Neon" (genere: disco)
// Struttura dati modulare: ogni antagonista ha nome, aspetto, salute,
// velocità, comportamento, attacchi, punti deboli, animazioni, livello, ricompense.
// ============================================================
const ENEMY_HEAD_SPECS = {
  roller_a: { skin: '#e2a985', hair: { style: 'feather', col: '#e6bf5e' }, band: '#ff4fa0', brow: '#a8842a' },
  roller_b: { skin: '#c98d68', hair: { style: 'feather', col: '#6a3a24' }, band: '#3ae0ff', brow: '#3a2010' },
  roller_gold: { skin: '#e2a985', hair: { style: 'feather', col: '#fff3c0' }, band: '#ffd34a', brow: '#c9a050', glasses: 'wayfarer' },
  bouncer: { skin: '#d9a07a', hair: { style: 'flattop', col: '#1d1612' }, glasses: 'wayfarer', thickNeck: true },
  bouncer_boss: { skin: '#c48a64', hair: { style: 'flattop', col: '#e8e8ea' }, beard: { style: 'mustache', col: '#e8e8ea' }, glasses: 'wayfarer', thickNeck: true },
  dj: { skin: '#e9b48e', hair: { style: 'cap', col: '#2a1c16' }, capCol: '#e03a3a', capLogo: '#ffffff', headphones: true, phoneCol: '#ffd34a', brow: '#2a1c16' },
  dj_b: { skin: '#a8714f', hair: { style: 'cap', col: '#141010' }, capCol: '#3a6ae0', capLogo: '#ffd34a', headphones: true, phoneCol: '#3ae0ff', brow: '#141010' },
};

const ENEMY_LOOKS = {
  roller_a: {
    headSpec: ENEMY_HEAD_SPECS.roller_a, skin: '#e2a985', build: { h: 0.98, w: 0.95 }, shoes: 'skate', skateCol: '#ff4fa0', trousers: '#2b2e7a',
    costume: { kind: 'jacket', j: '#c2309f', lap: '#ffd34a', shirt: '#ffd34a', tie: '#ffd34a' },
  },
  roller_b: {
    headSpec: ENEMY_HEAD_SPECS.roller_b, skin: '#c98d68', build: { h: 0.98, w: 0.95 }, shoes: 'skate', skateCol: '#3ae0ff', trousers: '#5a1e5a',
    costume: { kind: 'jacket', j: '#1fa8c8', lap: '#ffffff', shirt: '#ffffff', tie: '#ffffff' },
  },
  roller_gold: {
    headSpec: ENEMY_HEAD_SPECS.roller_gold, skin: '#e2a985', build: { h: 1, w: 0.98 }, shoes: 'skate', skateCol: '#ffd34a', trousers: '#1a1a20',
    costume: { kind: 'jacket', j: '#d5a52b', lap: '#18161e', shirt: '#18161e', tie: '#18161e', sparkle: true },
  },
  bouncer: {
    headSpec: ENEMY_HEAD_SPECS.bouncer, skin: '#d9a07a', build: { h: 1.08, w: 1.42 }, shoes: 'black',
    costume: { kind: 'jacket', j: '#5b2b8c', lap: '#18161e', shirt: '#22222a', tie: '#ffd34a', flap: '#18161e' },
  },
  bouncer_boss: {
    headSpec: ENEMY_HEAD_SPECS.bouncer_boss, skin: '#c48a64', build: { h: 1.13, w: 1.55 }, shoes: 'black',
    costume: { kind: 'jacket', j: '#a01828', lap: '#18161e', shirt: '#22222a', tie: '#ffd34a', flap: '#18161e' },
  },
  dj: {
    headSpec: ENEMY_HEAD_SPECS.dj, skin: '#e9b48e', build: { h: 0.96, w: 1 }, shoes: 'sneaker', trousers: '#3a3a46',
    costume: { kind: 'jacket', j: '#1f8a7a', lap: '#efe3c4', shirt: '#ffd34a', tie: '#ffd34a' },
  },
  dj_b: {
    headSpec: ENEMY_HEAD_SPECS.dj_b, skin: '#a8714f', build: { h: 0.96, w: 1 }, shoes: 'sneaker', trousers: '#3a3a46',
    costume: { kind: 'jacket', j: '#d86a1a', lap: '#efe3c4', shirt: '#18161e', tie: '#18161e' },
  },
  duca: {
    headSpec: 'disco', skin: '#e9b48e', build: { h: 1.22, w: 1.18 }, shoes: 'platform', glove: '#ffffff', trousers: '#6a2ab8',
    costume: { kind: 'jacket', j: '#6a2ab8', lap: '#ffd34a', shirt: '#ffe27c', tie: '#ff4fa0', sparkle: true },
    cape(pb, P2, pose, seed) {
      const [sx, sy] = P2(-3, 1);
      const len = 74;
      pb.shape(sx, sy, (pose.lean * 0.5 + 8) * DEG, -3, 24, 0, len, (u, v) => {
        const w = 6 + v * 0.24;
        const flap = Math.sin(v * 0.18 + seed) * 2;
        if (u < -w * 0.4 + flap || u > w) return 0;
        if (u > w - 2.5) return col(u > w - 1 ? '#ffe27c' : '#d5a52b');
        const fold = Math.sin(v * 0.4 + u * 0.8) > 0.6;
        return col(fold ? '#4c1a80' : (v % 9 === 0 ? '#2a0e4a' : '#3b1466'));
      });
    },
    headFx(pb, P2, seed) {
      const [nx, ny] = P2(1.5, -1);
      const pts = [[-6, -20], [4, -15], [-2, -9], [7, -22], [-9, -13]];
      const [px, py] = pts[seed % pts.length];
      const W = col('#ffffff'), Y = col('#fff7b0');
      pb.set(nx + px, ny + py, W); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => pb.set(nx + px + a, ny + py + b, Y));
      pb.set(nx + px + 2, ny + py, Y); pb.set(nx + px - 2, ny + py, Y);
    },
  },
};
for (const k in ENEMY_LOOKS) ENEMY_LOOKS[k].id = 'e_' + k;

// ---------- Animazioni dei nemici (pugni, niente strumenti) ----------
function brawlerAnims(kind) {
  const none = { m: 'none' };
  const guard = { F: [62, 100], B: [44, 108] };
  const A = baseAnims(guard, none);
  const B = o => P(Object.assign({ inst: none }, o));
  A.idle = [
    { p: B({ lean: 4, legF: [12, 8], legB: [-10, 6], armF: guard.F, armB: guard.B }), d: 24 },
    { p: B({ lean: 5, legF: [13, 13], legB: [-9, 11], armF: [64, 104], armB: [46, 110] }), d: 24 },
  ];
  A.walk = walkFrames(8, { amp: 18, knee0: 4, knee: 16, d: 7, base: { lean: 6, armF: guard.F, armB: guard.B, inst: none }, armsFixed: true });
  A.skate = [
    { p: B({ lean: 14, legF: [26, 6], legB: [-26, 10], armF: [40, 30], armB: [-50, 20] }), d: 12 },
    { p: B({ lean: 14, legF: [16, 8], legB: [-34, 14], armF: [30, 30], armB: [-40, 20] }), d: 12 },
  ];
  A.l1 = [
    { p: B({ lean: 2, legF: [12, 8], legB: [-12, 6], armF: [40, 120], armB: guard.B }) },
    { p: B({ lean: 12, legF: [18, 6], legB: [-16, 4], armF: [92, 0], armB: guard.B, fx: FX.jab }) },
    { p: B({ lean: 6, legF: [14, 6], legB: [-12, 4], armF: [70, 40], armB: guard.B }) },
  ];
  A.l2 = [
    { p: B({ lean: -8, legF: [10, 8], legB: [-16, 6], armF: guard.F, armB: [-60, 80] }) },
    { p: B({ lean: 18, legF: [24, 8], legB: [-20, 4], armF: [50, 60], armB: [100, 0], fx: FX.low }) },
    { p: B({ lean: 12, legF: [18, 6], legB: [-14, 4], armF: guard.F, armB: [70, 30] }) },
  ];
  A.kick = [
    { p: B({ lean: -10, legF: [40, 80], legB: [-10, 6], armF: [30, 40], armB: [-30, 30] }) },
    { p: B({ lean: -16, legF: [96, 4], legB: [-12, 6], armF: [10, 50], armB: [-50, 30], fx: FX.low }) },
    { p: B({ lean: -6, legF: [40, 40], legB: [-10, 6], armF: [30, 40], armB: [-30, 30] }) },
  ];
  A.dash = [{ p: B({ lean: 22, legF: [70, 10], legB: [-30, 20], armF: [100, 0], armB: [-60, 10], fx: FX.stab }), d: 99 }];
  A.tele = [
    { p: B({ lean: 18, legF: [30, 50], legB: [-30, 40], armF: [-20, 60], armB: [-40, 50] }), d: 4 },
    { p: B({ lean: 16, legF: [32, 52], legB: [-28, 40], armF: [-24, 60], armB: [-44, 50] }), d: 4 },
  ];
  A.grabP = [{ p: B({ lean: 8, legF: [16, 8], legB: [-14, 6], armF: [84, 20], armB: [78, 24] }), d: 99 }];
  A.slam = [
    { p: B({ lean: -14, legF: [14, 8], legB: [-14, 6], armF: [170, -10], armB: [160, -10] }), d: 10 },
    { p: B({ lean: 22, legF: [26, 10], legB: [-22, 6], armF: [70, 0], armB: [64, 0] }), d: 14 },
  ];
  A.throwV = [
    { p: B({ lean: -8, legF: [12, 8], legB: [-14, 6], armF: guard.F, armB: [-70, 60], inst: { m: 'hand', h: 'B', a: 0, kThrow: true, g: 'mid' } }) },
    { p: B({ lean: 14, legF: [20, 8], legB: [-18, 4], armF: guard.F, armB: [100, 0] }) },
    { p: B({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: guard.F, armB: [60, 30] }) },
  ];
  A.grabbed = [{ p: B({ lean: -10, legF: [6, 10], legB: [-10, 8], armF: [-10, 30], armB: [-30, 30] }), d: 99 }];
  A.taunt = kind === 'dj' ? [
    { p: B({ lean: 0, legF: [16, 20], legB: [-10, 4], armF: [150, 30], armB: [-30, 40] }), d: 12 },
    { p: B({ lean: 0, legF: [10, 4], legB: [-16, 20], armF: [30, 40], armB: [150, 30] }), d: 12 },
  ] : [
    { p: B({ lean: -4, legF: [12, 4], legB: [-12, 4], armF: [40, 140], armB: [30, 150] }), d: 16 },
    { p: B({ lean: -2, legF: [12, 10], legB: [-12, 8], armF: [44, 136], armB: [26, 150] }), d: 16 },
  ];
  // pose aggiuntive per i nemici della tournée (l'oggetto in mano è look.instrument)
  const H = (a, g = 'end', extra) => Object.assign({ m: 'hand', h: 'F', a, g }, extra || {});
  A.whip = [
    { p: B({ lean: -10, legF: [14, 8], legB: [-14, 6], armF: [170, -10], armB: guard.B, inst: H(-130, 'end', { behind: true }) }) },
    { p: B({ lean: 16, legF: [24, 8], legB: [-20, 4], armF: [90, 0], armB: guard.B, inst: H(0), fx: FX.wide }) },
    { p: B({ lean: 10, legF: [18, 8], legB: [-16, 6], armF: [64, 20], armB: guard.B, inst: H(50) }) },
  ];
  A.crouch = [{ p: B({ lean: 22, legF: [60, 110], legB: [-30, 100], armF: [40, 40], armB: [20, 40] }), d: 99 }];
  A.leap = [{ p: B({ air: true, lean: 16, legF: [60, 90], legB: [10, 70], armF: [100, 0], armB: [80, 10], fx: FX.down }), d: 99 }];
  A.espin = [
    { p: B({ lean: 0, legF: [8, 4], legB: [-8, 4], armF: [96, 0], armB: [-96, 0], fx: FX.wide }), d: 3 },
    { p: B({ lean: 0, legF: [4, 4], legB: [-4, 4], armF: [60, 0], armB: [-60, 0] }), d: 3 },
  ];
  A.shoot = [
    { p: B({ lean: 2, legF: [14, 8], legB: [-14, 6], armF: [80, 10], armB: guard.B, inst: H(0, 'grip') }) },
    { p: B({ lean: -4, legF: [14, 8], legB: [-14, 6], armF: [94, -6], armB: guard.B, inst: H(-10, 'grip') }) },
    { p: B({ lean: 0, legF: [14, 8], legB: [-14, 6], armF: [88, 2], armB: guard.B, inst: H(-2, 'grip') }) },
  ];
  A.raise = [
    { p: B({ lean: -6, legF: [14, 8], legB: [-14, 6], armF: [150, -30], armB: [30, 40], inst: H(-70, 'grip') }) },
    { p: B({ lean: 4, legF: [16, 8], legB: [-14, 6], armF: [118, -20], armB: [30, 40], inst: H(-20, 'grip') }) },
    { p: B({ lean: 2, legF: [14, 8], legB: [-14, 6], armF: [100, -10], armB: [30, 40], inst: H(-6, 'grip') }) },
  ];
  A.headbang = [
    { p: B({ lean: -16, head: [-1, -2], legF: [14, 8], legB: [-14, 6], armF: guard.F, armB: guard.B }) },
    { p: B({ lean: 36, head: [3, 4], legF: [26, 10], legB: [-20, 6], armF: [40, 40], armB: [30, 50], fx: FX.low }) },
    { p: B({ lean: 20, head: [2, 2], legF: [20, 8], legB: [-16, 6], armF: guard.F, armB: guard.B }) },
  ];
  A.bite = [
    { p: B({ lean: 4, legF: [14, 8], legB: [-12, 6], armF: [80, 10], armB: [76, 14] }) },
    { p: B({ lean: 26, legF: [28, 8], legB: [-22, 4], armF: [98, 0], armB: [92, 4], fx: FX.jab }) },
    { p: B({ lean: 14, legF: [20, 8], legB: [-16, 6], armF: [84, 8], armB: [80, 10] }) },
  ];
  A.sing = [
    { p: B({ lean: -6, head: [0, -1], legF: [14, 6], legB: [-14, 6], armF: [110, 30], armB: [60, 60] }) },
    { p: B({ lean: -14, head: [-1, -2], legF: [16, 6], legB: [-16, 6], armF: [140, 10], armB: [130, 20] }) },
    { p: B({ lean: -8, head: [0, -1], legF: [14, 6], legB: [-14, 6], armF: [120, 20], armB: [90, 40] }) },
  ];
  A.walkZ = walkFrames(8, { amp: 10, knee0: 2, knee: 8, d: 9, base: { lean: 10, armF: [86, 6], armB: [80, 10], inst: none }, armsFixed: true });
  A.sway = A.idle;
  return A;
}

function bossAnims() {
  const A = brawlerAnims('boss');
  const B = o => P(Object.assign({ inst: { m: 'none' } }, o));
  A.idle = A.sway = [
    { p: B({ lean: 0, legF: [16, 10], legB: [-12, 4], armF: [160, 10], armB: [20, 30] }), d: 18 },
    { p: B({ lean: -2, legF: [10, 4], legB: [-16, 12], armF: [30, 30], armB: [-20, 30] }), d: 18 },
  ];
  A.spin = [
    { p: B({ lean: 0, legF: [8, 4], legB: [-8, 4], armF: [96, 0], armB: [-96, 0] }), d: 3 },
    { p: B({ lean: 0, legF: [4, 4], legB: [-4, 4], armF: [60, 0], armB: [-60, 0] }), d: 3 },
  ];
  A.beam = [
    { p: B({ lean: -8, legF: [16, 4], legB: [-16, 4], armF: [170, 0], armB: [190, 0] }), d: 10 },
    { p: B({ lean: -10, legF: [18, 8], legB: [-18, 8], armF: [160, 10], armB: [200, -10] }), d: 10 },
  ];
  A.point = [{ p: B({ lean: -4, legF: [14, 4], legB: [-14, 4], armF: [150, 0], armB: [30, 40] }), d: 99 }];
  return A;
}

// ---------- Definizioni (dati) ----------
const ENEMY_DEFS = {
  pattinatore: {
    name: 'PATTINATORE', tier: 'normal', looks: ['roller_a', 'roller_b'], anims: 'brawler', hp: 30, speed: { x: 1.5, z: 0.9 },
    behavior: { type: 'melee', range: 22, waitDist: [70, 110], aggro: 1.1, dashChance: 0.35 },
    attacks: {
      jab: { anim: 'l1', fr: [10, 3, 16], dmg: 4, hb: { x0: 4, x1: 26, y0: 26, y1: 50 }, knock: 'light', stun: 18, cd: 45 },
      dash: { anim: 'dash', tele: 22, speed: 4.6, dur: 40, dmg: 8, hb: { x0: -4, x1: 20, y0: 8, y1: 48 }, knock: 'down', cd: 90 },
    },
    weak: { back: 1.15 }, score: 100, drops: [['bibita', 0.12], ['disco', 0.18], ['nota', 0.06]], level: 1,
  },
  pattinatore_oro: {
    name: "PATTINATORE D'ORO", tier: 'elite', looks: ['roller_gold'], anims: 'brawler', hp: 52, speed: { x: 1.8, z: 1.05 },
    behavior: { type: 'melee', range: 22, waitDist: [60, 100], aggro: 1.4, dashChance: 0.5 },
    attacks: {
      jab: { anim: 'l1', fr: [8, 3, 14], dmg: 6, hb: { x0: 4, x1: 26, y0: 26, y1: 50 }, knock: 'light', stun: 18, cd: 36 },
      dash: { anim: 'dash', tele: 18, speed: 5.2, dur: 44, dmg: 10, hb: { x0: -4, x1: 20, y0: 8, y1: 48 }, knock: 'down', cd: 70 },
    },
    score: 400, drops: [['vinile', 0.3], ['panino', 0.3]], level: 1,
  },
  buttafuori: {
    name: 'BUTTAFUORI', tier: 'normal', looks: ['bouncer'], anims: 'brawler', hp: 80, speed: { x: 0.85, z: 0.6 }, heavy: true, armor: 3,
    behavior: { type: 'melee', range: 26, waitDist: [60, 90], aggro: 0.9, grabChance: 0.4 },
    attacks: {
      punch: { anim: 'l2', fr: [18, 4, 24], dmg: 11, hb: { x0: 4, x1: 34, y0: 20, y1: 56 }, knock: 'down', cd: 70, shake: 2 },
      grab: { anim: 'grabP', fr: [14, 6, 20], hb: { x0: 4, x1: 26, y0: 10, y1: 50 }, grab: true, cd: 90 },
    },
    weak: { back: 1.2 }, score: 300, drops: [['pizza', 0.25], ['panino', 0.25]], level: 1, radius: 13, hurtW: 26,
  },
  buttafuori_capo: {
    name: 'BUTTAFUORI CAPO', tier: 'miniboss', looks: ['bouncer_boss'], anims: 'brawler', hp: 210, speed: { x: 1.0, z: 0.7 }, heavy: true, armor: 4, noGrab: true,
    behavior: { type: 'melee', range: 28, waitDist: [50, 80], aggro: 1.3, grabChance: 0.45 },
    attacks: {
      punch: { anim: 'l2', fr: [14, 4, 20], dmg: 13, hb: { x0: 4, x1: 38, y0: 20, y1: 58 }, knock: 'down', cd: 50, shake: 2 },
      grab: { anim: 'grabP', fr: [12, 6, 18], hb: { x0: 4, x1: 28, y0: 10, y1: 52 }, grab: true, cd: 70 },
      slam: { anim: 'slam', fr: [22, 6, 26], dmg: 16, hb: { x0: -10, x1: 40, y0: 0, y1: 40 }, knock: 'down', cd: 120, shake: 4, zTol: 14 },
    },
    score: 3000, drops: [['pizza', 1]], level: 1, radius: 14, hurtW: 28,
  },
  lanciadischi: {
    name: 'LANCIADISCHI', tier: 'normal', looks: ['dj', 'dj_b'], anims: 'dj', hp: 38, speed: { x: 1.2, z: 0.9 },
    behavior: { type: 'ranged', range: 20, keep: [96, 150], aggro: 1 },
    attacks: {
      throwV: { anim: 'throwV', fr: [18, 4, 18], projectile: 'vinyl', dmg: 6, cd: 100 },
      shove: { anim: 'l1', fr: [10, 3, 16], dmg: 4, hb: { x0: 4, x1: 24, y0: 26, y1: 50 }, knock: 'light', stun: 14, push: 2.4, cd: 40 },
    },
    score: 150, drops: [['cassetta', 0.3], ['disco', 0.2]], level: 1,
  },
  duca_glitter: {
    name: 'DUCA GLITTER', title: 'IL RE DELLA PISTA', tier: 'boss', looks: ['duca'], anims: 'boss', hp: 580, speed: { x: 1.2, z: 0.8 }, noGrab: true, heavy: true,
    score: 10000, level: 1, radius: 14, hurtW: 26, cls: 'Duca',
  },
};

// Le definizioni sopra sono scritte nella scala della prima versione: qui passano alla scala del mondo
(function scaleDefs() {
  for (const k in ENEMY_DEFS) {
    const d = ENEMY_DEFS[k];
    d.speed = { x: d.speed.x * 1.45, z: d.speed.z * 1.35 };
    if (d.behavior) {
      const b = d.behavior;
      if (b.range) b.range *= K;
      if (b.waitDist) b.waitDist = b.waitDist.map(v => v * 1.5);
      if (b.keep) b.keep = b.keep.map(v => v * 1.5);
    }
    for (const a of Object.values(d.attacks || {})) {
      if (a.hb) a.hb = { x0: a.hb.x0 * K, x1: a.hb.x1 * K, y0: a.hb.y0 * K, y1: a.hb.y1 * K };
      if (a.speed) a.speed *= 1.45;
      if (a.push) a.push *= 1.4;
      if (a.zTol) a.zTol *= 1.4;
    }
    if (d.radius) d.radius *= 1.5;
    if (d.hurtW) d.hurtW *= 1.55;
  }
})();

const _enemyAnimCache = {};
function enemyAnims(kind) {
  if (!_enemyAnimCache[kind]) _enemyAnimCache[kind] = kind === 'boss' ? bossAnims() : brawlerAnims(kind);
  return _enemyAnimCache[kind];
}

// ---------- Nemico ----------
class Enemy extends Actor {
  constructor(type, x, z, o = {}) {
    const def = ENEMY_DEFS[type];
    super({ team: 'e' });
    this.type = type; this.def = def;
    this.look = ENEMY_LOOKS[o.look || pick(def.looks)];
    this.anims = enemyAnims(def.anims);
    const np = Math.max(1, G.players.filter(p => p.active).length);
    const hpMul = G.diff.enemyHp * (def.tier === 'boss' || def.tier === 'miniboss' ? 1 + 0.55 * (np - 1) : 1);
    this.maxHp = this.hp = Math.round(def.hp * hpMul);
    this.x = x; this.z = z; this.facing = -1;
    this.heavy = !!def.heavy; this.armor = def.armor || 0;
    this.radius = def.radius || 13; this.hurtW = def.hurtW || 28; this.hurtH = 90 * (this.look.build.h || 1);
    this.shadowW = 34 * (this.look.build.w || 1);
    this.target = null; this.cd = randi(20, 60); this.think = 0; this.ai = 'spawn';
    this.waitOff = rand(-22, 22); this.waitD = def.behavior ? rand(...(def.behavior.waitDist || def.behavior.keep || [105, 150])) : 120;
    this.entryX = o.entryX; this.isBoss = def.tier === 'boss';
    this.speedMul = 1;
    this.setState('spawn', 'walk');
    this.anger = 0;
    this.undead = !!def.undead; this.bloodCol = def.blood === undefined ? '#b0101a' : def.blood;
    // personalità: nome proprio, manie, frasi (dati in 05b_lines.js)
    this.persona = typeof PERSONAS !== 'undefined' ? PERSONAS[type] || null : null;
    this.nick = this.persona ? pick(this.persona.nicks) : null;
    this.quirks = new Set(this.persona ? this.persona.quirks : []);
    this.quirkCD = randi(150, 300);
    // varianti: colori diversi e qualche "ciccione" (solo truppa ed élite)
    if (!o.look && (def.tier === 'normal' || def.tier === 'elite') && typeof enemyVariant === 'function') {
      const fat = def.tier === 'normal' && !def.heavy && !def.undead && chance(0.15), v = !fat && chance(0.5) ? 1 + (this.type.length % 3) : 0;
      if (v || fat) this.look = enemyVariant(this.look, v, fat);
      if (fat) { this.fat = true; this.maxHp = this.hp = Math.round(this.hp * 1.3); this.speedMul = 0.88; this.radius += 3; this.hurtW += 8; if (this.nick) this.nick += ' ' + pick(['TRIPPA', 'LARDONE', 'CICCIO', 'PANZA']); this.quirks.add('fart'); }
    }
    this.baseLook = this.look;
    if (this.look.alpha) this.alpha = this.look.alpha;
    this.rangedKey = def.behavior && def.behavior.type !== 'ranged' ? Object.keys(def.attacks || {}).find(k => def.attacks[k].projectile) : null;
  }
  say(txt, t) { this.bubble = { txt, t: t || 40 + txt.length * 2 }; G.lastEnemyTalk = G.frame; }
  line(ev, prob = 1) {
    if (!this.persona || !chance(prob) || !enemyMayTalk()) return false;
    const s = pickLine(this.persona[ev]); if (!s) return false; this.say(s); return true;
  }
  grabbable() {
    return this.alive && !this.def.noGrab && ['idle', 'walk', 'approach', 'wait', 'hurt', 'taunt', 'spawn', 'cool'].includes(this.state) && this.y === 0 && !this.grabbedBy && this.inv <= 0;
  }
  pickTarget() {
    const ps = G.players.filter(p => p.active && !p.out && p.alive && !['dead', 'ko', 'enter'].includes(p.state));
    if (!ps.length) return null;
    if (this.target && ps.includes(this.target) && chance(0.985)) return this.target;
    ps.sort((a, b) => (Math.abs(a.x - this.x) + Math.abs(a.z - this.z) * 2) - (Math.abs(b.x - this.x) + Math.abs(b.z - this.z) * 2));
    return ps[0];
  }
  moveToward(tx, tz, mul = 1) {
    const sx = this.def.speed.x * mul * this.speedMul, sz = this.def.speed.z * mul * this.speedMul;
    const dx = tx - this.x, dz = tz - this.z;
    const mx = Math.abs(dx) > sx ? sign(dx) * sx : dx;
    const mz = Math.abs(dz) > sz ? sign(dz) * sz : dz;
    this.x += mx; this.z += mz;
    const moving = Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05;
    this.play(moving ? (this.look.shoes === 'skate' ? 'skate' : this.def.shamble ? 'walkZ' : 'walk') : 'idle');
    return Math.abs(dx) < 2 && Math.abs(dz) < 2;
  }
  update() {
    this.tickTimers();
    if (this.bubble && --this.bubble.t <= 0) this.bubble = null;
    if (this.hitstop > 0) { this.hitstop--; if (this.shakeT > 0) this.shakeT--; return; }
    if (this.shakeT > 0) this.shakeT--;
    this.st++; this.animT++;
    if (this.state === 'dead') { if (this.st > 46) this.alive = false; return; }
    if (this.state === 'thrown') { this.updateThrown(); this.commonUpdate(); this.keepOnScreen(); return; }
    if (this.state === 'knock' && this.flying) this.updateFlying(); else if (this.state !== 'knock') this.flying = null;
    if (this.state === 'getup' && this.st === 1 && this.quirks.has('fart') && chance(0.35)) this.doFart();
    if (this.commonUpdate()) { this.keepOnScreen(); return; }
    if (this.state === 'grabbed') { this.play('grabbed'); if (!this.grabbedBy) this.setState('idle', 'idle'); return; }
    this.updateAI();
    this.clampLane();
    this.keepOnScreen();
  }
  // una volta entrati, i nemici restano raggiungibili (come le "arene" dei classici)
  keepOnScreen() {
    const s = this.state, lo = G.cam.x + 20, hi = G.cam.x + W - 20;
    if (s === 'spawn' || s === 'dash' || s === 'spin' || s === 'intro' || s === 'drop') return;
    if (s === 'knock' || s === 'down' || s === 'getup' || s === 'dead' || s === 'thrown') { this.x = clamp(this.x, G.cam.x - 10, G.cam.x + W + 10); return; }
    if (this.x < lo) this.x = Math.min(lo, this.x + 3.5);
    else if (this.x > hi) this.x = Math.max(hi, this.x - 3.5);
  }
  updateThrown() {
    const th = this.thrower;
    for (const o of G.enemies) {
      if (o === this || !canBeHit(o) || this.hitList.has(o)) continue;
      if (Math.abs(o.x - this.x) < 26 && Math.abs(o.z - this.z) < 13 && this.y < 80) {
        this.hitList.add(o);
        applyHit(th || this, o, th ? th.moves.thrownHit : { dmg: 8, knock: 'down' }, { dir: sign(this.vx), noStopA: true });
      }
    }
  }
  // scagliato da un colpo forte: travolge gli altri nemici e rimbalza sul bordo dello schermo
  updateFlying() {
    const a = this.flying;
    if (Math.abs(this.vx) < 1.5 || this.y <= 0.5 && this.st > 4) return;
    for (const o of G.enemies) {
      if (this.flyHit.has(o) || !canBeHit(o) || o.isBoss) continue;
      if (Math.abs(o.x - this.x) < 26 && Math.abs(o.z - this.z) < 13 && this.y < 70) {
        this.flyHit.add(o); applyHit(a, o, { dmg: 7, knock: 'down', hsA: 0, hsV: 7, meter: 2 }, { dir: sign(this.vx), noStopA: true });
        if (!this._bowl) { this._bowl = true; popText(pickLine(['STRIKE!', '~STRIKE, STRONZI!']), o.x, o.z, 100, '#ffd23e', 36); }
      }
    }
    const lo = G.cam.x + 12, hi = G.cam.x + W - 12;
    if (!this.wallBounced && ((this.x < lo && this.vx < 0) || (this.x > hi && this.vx > 0))) {
      this.wallBounced = true; this.vx = -this.vx * 0.7; this.vy = Math.max(this.vy, 2.6); this.x = clamp(this.x, lo, hi);
      if (this.hp > 0) { this.hp -= 4; if (this.hp <= 0) this.willDie = true; }
      sparks(this.x, this.z, this.y + 30, true); G.shake(2, 6); Audio2.sfxPlay('hitHeavy');
      popText(pickLine(['RIMBALZO!', '~SPIACCICATO!']), this.x, this.z, this.y + 60, '#ff9ab0', 30);
    }
  }
  onThrownLand() {
    const th = this.thrower;
    this.state = 'knock';
    applyHit(th || null, this, th ? th.moves.throwLand : { dmg: 10, knock: 'down' }, { dir: sign(this.vx) || 1, noStopA: true });
    G.shake(2, 6);
  }
  onHurt() { Tokens.release(this); if (this.state === 'hurt' || this.state === 'knock') this.atk = null; this.anger++; }
  onDeath() {
    Tokens.release(this);
    G.stats.kills++;
    const killer = this.lastHitBy;
    if (killer && killer.onKill) killer.onKill(this);
    else G.players.filter(p => p.active).forEach(p => p.addScore(this.def.score / 2));
    Audio2.sfxPlay('ko');
    this.dropWeaponE();
    this.line('die', 0.45);
    if (this.bloodCol) { bloodPool(this.x, this.z, 13 * (this.look.build.w || 1), this.bloodCol); blood(this.x, this.z, 30, 10, 0, this.bloodCol); }
    else if (this.def.debris) chipsAt(this.x, this.z, 30, 14, this.def.debris, 3);
    if (this.def.smokeDeath) for (let i = 0; i < 6; i++) addFx('smoke', this.x + rand(-10, 10), this.z, 40, { life: 30 });
    if (this.def.drops) for (const [item, p] of this.def.drops) if (chance(p)) { G.pickups.push(new Pickup(item, this.x, this.z)); break; }
    if (this.onDeathExtra) this.onDeathExtra();
  }

  // i non morti a volte si rialzano una volta
  die() {
    if (this.def.revive && !this.revived && !this.isBoss && chance(this.def.revive * (G.diff.aggro || 1))) {
      this.revived = true; this.hp = Math.round(this.maxHp * 0.5); this.willDie = false;
      this.setState('down', 'down'); this.downTime = 80;
      popText('RISORGE!', this.x, this.z, 100, '#9adf6a', 50); Audio2.sfxPlay('groan');
      return;
    }
    super.die();
  }
  // ---------------- IA ----------------
  updateAI() {
    const b = this.def.behavior;
    const t = this.target = this.pickTarget();
    if (this.cd > 0) this.cd--;
    const s = this.state;
    if (s === 'drop') {
      this.play('leap'); this.vy -= 0.5; this.y = Math.max(0, this.y + this.vy);
      if (this.y <= 0) { dust(this.x, this.z, 8); G.shake(1, 6); Audio2.sfxPlay('land'); this.setState('idle', 'idle'); this.line('entry', 0.5); }
      return;
    }
    if (s === 'spawn') {
      const tx = this.entryX !== undefined ? this.entryX : (this.x < G.cam.x ? G.cam.x + 44 : G.cam.x + W - 44);
      this.facing = sign(tx - this.x) || this.facing;
      if (this.moveToward(tx, this.z, 1.2) || (this.x > G.cam.x + 30 && this.x < G.cam.x + W - 30 && this.st > 30)) { this.setState('idle', 'idle'); this.line('entry', 0.35); }
      return;
    }
    if (this.updateQuirkState(t)) return;
    if (s === 'attack') return this.updateAttack();
    if (s === 'dashTele') return this.updateDashTele();
    if (s === 'dash') return this.updateDash();
    if (s === 'grabP') return this.updateGrabP();
    if (s === 'leapTele' || s === 'leap') return this.updateLeap();
    if (s === 'espin') return this.updateESpin();
    if (s === 'blinkOut' || s === 'blinkIn') return this.updateBlink();
    if (!t) { this.play('taunt'); return; }
    this.facing = sign(t.x - this.x) || this.facing;
    if (s === 'cool') { this.play('idle'); if (this.st > 18) this.setState('idle', 'idle'); return; }
    if (s === 'taunt') { this.play('taunt'); if (this.st === 1) { this.line('taunt', 0.75); if (this.quirks.has('fart') && chance(0.4)) this.doFart(); } if (this.st > 50) this.setState('idle', 'idle'); return; }
    if (this.startQuirk(t)) return;
    if (b.type === 'ranged') return this.aiRanged(t, b);
    // mischia
    const side = sign(this.x - t.x) || (chance(0.5) ? 1 : -1);
    const hasTok = Tokens.request(this, t);
    if (hasTok) {
      // carica in pattini: da lontano, sulla stessa corsia
      if (b.dashChance && this.cd <= 0 && Math.abs(t.z - this.z) < 9 && Math.abs(t.x - this.x) > 105 && Math.abs(t.x - this.x) < 300 && chance(b.dashChance * 0.05)) {
        this.startDash(); return;
      }
      const dxT = Math.abs(t.x - this.x);
      if (b.leapChance && this.cd <= 0 && dxT > 70 && dxT < 190 && Math.abs(t.z - this.z) < 30 && chance(b.leapChance * 0.05)) { this.startLeap(); return; }
      if (b.spinChance && this.cd <= 0 && dxT < 90 && Math.abs(t.z - this.z) < 12 && chance(b.spinChance * 0.04)) { this.startESpin(); return; }
      if (b.blink && this.cd <= 0 && dxT > 60 && chance(0.012)) { this.startBlink(); return; }
      const pk = this.rangedKey;
      if (pk && this.cd <= 0 && dxT > 110 && dxT < 300 && Math.abs(t.z - this.z) < 12 && this.x > G.cam.x + 20 && this.x < G.cam.x + W - 20 && chance(0.025)) { this.startAttack(pk); return; }
      if (this.def.attacks.lasso && this.cd <= 0 && dxT > 60 && dxT < 130 && Math.abs(t.z - this.z) < 7 && chance(0.03)) { this.facing = sign(t.x - this.x) || this.facing; this.startAttack('lasso'); return; }
      const tx = t.x + side * b.range, tz = t.z;
      this.state = 'approach';
      this.moveToward(tx, tz, 1);
      if (Math.abs(this.x - tx) < 6 && Math.abs(this.z - tz) < 4 && this.cd <= 0 && canTargetPlayer(t)) {
        const atks = this.def.attacks;
        const melee = meleeKeys(atks);
        if (this.wpn && chance(0.75)) { this.startAttack('wpn', this.wpnAtk); return; }
        let key = Object.keys(atks).find(k => atks[k].grab && chance(b.grabChance || 0)) || pick(melee);
        if (atks.slam && chance(0.25)) key = 'slam';
        this.startAttack(key);
      }
    } else {
      // in attesa: gira attorno a distanza, ogni tanto provoca
      const tx = t.x + side * this.waitD, tz = clamp(t.z + this.waitOff, LANE_TOP, LANE_BOTTOM);
      this.state = 'wait';
      this.moveToward(tx, tz, 0.7);
      if (chance(0.004)) this.setState('taunt', 'taunt');
      if (chance(0.01)) { this.waitOff = rand(-26, 26); this.waitD = rand(...(b.waitDist || [105, 150])); }
    }
  }
  aiRanged(t, b) {
    const side = sign(this.x - t.x) || 1;
    const d = Math.abs(this.x - t.x);
    if (d < 54 && Math.abs(t.z - this.z) < 11 && this.cd <= 0 && canTargetPlayer(t)) { this.startAttack('shove'); return; }
    const want = clamp(d, b.keep[0], b.keep[1]);
    let tx = clamp(t.x + side * want, G.cam.x + 32, G.cam.x + W - 32);
    // spinto contro il bordo dello schermo e troppo vicino per lanciare: va a spingere
    if (d < 90 && Math.abs(tx - (t.x + side * want)) > 20) tx = t.x + side * 40;
    this.state = 'wait';
    const done = this.moveToward(tx, t.z, 0.9);
    const onScreen = this.x > G.cam.x + 16 && this.x < G.cam.x + W - 16;
    if (onScreen && Math.abs(this.z - t.z) < (this.def.attacks.throwV.arc ? 18 : 7) && d > 90 && this.cd <= 0 && canTargetPlayer(t)) this.startAttack('throwV');
    else if (done && chance(0.01)) this.setState('taunt', 'taunt');
  }
  startAttack(key, obj) {
    const a = obj || this.def.attacks[key];
    if (!a) return;
    this.atk = a; this.atkKey = key; this.hitList.clear();
    this.setState('attack', a.anim); this.frameIdx = 0;
  }
  updateAttack() {
    const a = this.atk;
    if (!a) { this.setState('idle', 'idle'); return; }
    const [su, ac, re] = a.fr, t = this.st;
    this.frameIdx = t < su ? 0 : t < su + ac ? 1 : 2;
    if (t === su) Audio2.sfxPlay(a.grab ? 'grab' : 'swing');
    if (t >= su && t < su + ac) {
      if (a.projectile && (t === su || (a.burst && (t - su) % 6 === 0 && (t - su) / 6 < a.burst))) {
        const n = a.spread || 1;
        for (let k = 0; k < n; k++) {
          const off = n > 1 ? (k - (n - 1) / 2) : 0;
          G.projs.push(new Proj(this, a.projectile, { tx: this.target ? this.target.x : undefined, vz: off * 0.9, col: a.col, y0: a.y0, mv: a.dmg ? { dmg: a.dmg } : undefined }));
        }
      } else if (a.lasso) {
        if (t === su) {
          const box = moveBox(this, a.hb);
          const p = G.players.find(p => canBeHit(p) && canTargetPlayer(p) && hurtOverlap(box, p, this.z, 12) && p.y < 10);
          if (p) { for (let k = 0; k < 6; k++) dust(p.x + (this.x - p.x) * k / 6, p.z, 1); p.x = this.x + this.facing * 26; p.z = this.z; this.grabPlayer(p); popText('PRESO!', p.x, p.z, 100, '#e8c088', 30); return; }
        }
      } else if (a.grab) {
        const box = moveBox(this, a.hb);
        const p = G.players.find(p => canBeHit(p) && canTargetPlayer(p) && hurtOverlap(box, p, this.z, 9) && p.y < 8);
        if (p) { this.grabPlayer(p); return; }
      } else if (a.hb) {
        const n = checkMove(this, Object.assign({ hsA: 6, hsV: 8 }, a), G.players);
        if (n && a === this.wpnAtk && this.wpn && --this.wpn.uses <= 0) { popText('ROTTO!', this.x + this.facing * 40, this.z, 100, '#ff9b45', 30); Audio2.sfxPlay('break', 0.7); this.wpn = null; this.look = this.baseLook; }
      }
    }
    if (t >= su + ac + re) { this.cd = (a.cd || 60) / G.diff.aggro + randi(0, 30); this.setState('cool', 'idle'); if (chance(0.5)) Tokens.release(this); }
  }
  // ---------------- manie ----------------
  startQuirk(t) {
    if (!this.quirks.size || --this.quirkCD > 0 || this.grabbedBy) return false;
    this.quirkCD = Math.round(randi(160, 330) / (G.diff.aggro || 1));
    const Q = this.quirks, dx = Math.abs(t.x - this.x), dz = Math.abs(t.z - this.z), onS = o => o.x > G.cam.x + 14 && o.x < G.cam.x + W - 14;
    if (Q.has('glutton')) { const f = G.pickups.find(o => o.alive && o.def && o.def.heal && o.t > 20 && onS(o)); if (f) { this.qT = f; Tokens.release(this); this.setState('qeat', 'walk'); this.line('eat', 1); return true; } }
    if (Q.has('arms') && !this.wpn) { const w = G.pickups.find(o => o.alive && o.isWeapon && o.y < 4 && o.t > 20 && onS(o) && ['club', 'heavy'].includes(WEAPONS[o.kind].hold) && Math.abs(o.x - this.x) < 260); if (w) { this.qT = w; Tokens.release(this); this.setState('qfetch', 'walk'); return true; } }
    if (Q.has('flee') && !this.fled && this.hp < this.maxHp * 0.35) { this.fled = true; Tokens.release(this); this.setState('qflee', 'walk'); this.say(pickLine(this.persona.flee) || 'AIUTO!'); return true; }
    if (Q.has('spit') && dx > 50 && dx < 180 && dz < 12 && canTargetPlayer(t)) { this.facing = sign(t.x - this.x) || this.facing; this.setState('qspit', 'bite'); return true; }
    if (Q.has('burp') && dx < 120 && dz < 20) { this.facing = sign(t.x - this.x) || this.facing; this.setState('qburp', 'sing'); return true; }
    if (Q.has('fart') && dx < 100 && dz < 20 && chance(0.5)) { this.doFart(); return false; }
    return false;
  }
  updateQuirkState(t) {
    const s = this.state;
    if (s === 'qeat' || s === 'qfetch') {
      const o = this.qT;
      if (!o || !o.alive || this.st > 300) { this.qT = null; this.setState('idle', 'idle'); return true; }
      const done = this.moveToward(o.x, o.z, 1.25);
      this.facing = sign(o.x - this.x) || this.facing;
      if (done || (Math.abs(o.x - this.x) < 10 && Math.abs(o.z - this.z) < 6)) {
        o.alive = false;
        if (s === 'qeat') { this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.5)); popText(pickLine(['GNAM!', '~GNAM! CHE SCHIFO, BUONISSIMO']), this.x, this.z, 110, '#62f08e', 40); Audio2.sfxPlay('food'); if (chance(0.5) && this.quirks.has('fart')) this.doFart(); }
        else this.takeWeapon(o);
        this.qT = null; this.setState('cool', 'idle');
      }
      return true;
    }
    if (s === 'qflee') {
      // scappa verso il bordo più vicino lontano dal giocatore, poi torna alla carica
      const dir = t ? (sign(this.x - t.x) || 1) : 1, tx = dir > 0 ? G.cam.x + W - 24 : G.cam.x + 24;
      this.speedMul = (this.fat ? 0.88 : 1) * 1.5; this.moveToward(tx, this.z, 1); this.speedMul = this.fat ? 0.88 : 1;
      this.facing = dir; if (this.st % 40 === 20) addFx('dust', this.x, this.z, 2);
      if (this.st > 110) { this.setState('idle', 'idle'); this.cd = 0; }
      return true;
    }
    if (s === 'qspit') {
      this.play('bite'); this.frameIdx = this.st < 14 ? 0 : this.st < 20 ? 1 : 2;
      if (this.st === 14) { G.projs.push(new Proj(this, 'spit', { tx: t ? t.x : undefined, vz: t ? clamp((t.z - this.z) / 30, -0.4, 0.4) : 0 })); Audio2.sfxPlay('spit'); this.line('spit', 0.6); }
      if (this.st >= 34) { this.cd = 40; this.setState('cool', 'idle'); }
      return true;
    }
    if (s === 'qburp') {
      this.play('sing'); this.frameIdx = this.st < 16 ? 0 : 1;
      if (this.st === 16) { G.projs.push(new Cloud(this, this.x + this.facing * 34, this.z, '#d8d070', { life: 80, dmg: 3 })); Audio2.sfxPlay('burp'); popText('BUUURP!', this.x, this.z, 110, '#e8e070', 40); this.line('burp', 0.7); }
      if (this.st >= 44) { this.cd = 40; this.setState('cool', 'idle'); }
      return true;
    }
    return false;
  }
  doFart() {
    if (G.frame - (this.lastFart || -999) < 120) return;
    this.lastFart = G.frame;
    G.projs.push(new Cloud(this, this.x - this.facing * 26, this.z, '#8aa84a', { life: 90, dmg: 2 }));
    Audio2.sfxPlay('fart'); popText('PRRRT!', this.x - this.facing * 20, this.z, 70, '#b8d060', 40);
    if (!this.line('fart', 0.7) && chance(0.3)) this.say(pickLine(['SCUSATE.', '~E CHE CAZZO, SCUSATE!']));
  }
  // raccoglie un'arma da terra e la usa (si vede in mano)
  takeWeapon(it) {
    const Wd = WEAPONS[it.kind]; if (!Wd) return;
    this.wpn = { kind: it.kind, uses: Math.min(it.uses ?? Wd.uses, 8) };
    const reach = Math.min(Wd.reach || 80, 96), dmg = Math.round((Wd.dmg ? Wd.dmg[0] : 9) * 0.8);
    this.wpnAtk = { anim: 'whip', fr: [14, 4, 20], dmg, hb: { x0: 10, x1: reach, y0: 30, y1: 96 }, knock: 'down', cd: 70, gore: Wd.gore || 0 };
    this.look = Object.assign({}, this.baseLook, { id: this.baseLook.id + '_w_' + it.kind, instrument: Wd.spr, carry: { a: -60, g: Wd.g } });
    popText(Wd.name + '!', this.x, this.z, 120, '#ff9ab0', 40); Audio2.sfxPlay('pickup');
    this.say(pickLine(['ROBA MIA, ADESSO!', '~GUARDA CHE GIOCATTOLO, STRONZO!', '~ADESSO TI APRO IL CULO!']));
  }
  dropWeaponE() {
    if (!this.wpn) return;
    const it = new WeaponItem(this.wpn.kind, this.x - this.facing * 10, this.z, this.wpn.uses, 30); it.vx = -this.facing * 1.2; it.vy = 3; G.pickups.push(it);
    this.wpn = null; this.look = this.baseLook;
  }
  knockDown(dir, launch = 1, dead = false) { this.dropWeaponE(); return super.knockDown(dir, launch, dead); }
  // balzo sul giocatore (con onda d'urto per i più grossi)
  startLeap() { this.setState('leapTele', 'crouch'); Tokens.release(this); Audio2.sfxPlay('beamWarn'); }
  updateLeap() {
    const a = this.def.attacks.leap || { dmg: 8 }, t = this.target;
    if (this.state === 'leapTele') {
      if (t) this.facing = sign(t.x - this.x) || this.facing;
      if (this.st >= (a.tele || 16)) {
        const tx = t ? t.x - this.facing * 10 : this.x + this.facing * 80, tz = t ? t.z : this.z, T = 32;
        this.vx = (tx - this.x) / T; this.vz = (tz - this.z) / T; this.vy = 0.45 * T / 2; this.y = 0.1;
        this.setState('leap', 'leap'); this.hitList.clear(); Audio2.sfxPlay('jump');
      }
      return;
    }
    this.x += this.vx; this.z = clamp(this.z + this.vz, LANE_TOP, LANE_BOTTOM); this.vy -= 0.45; this.y += this.vy;
    if (this.vy < 0) checkMove(this, { dmg: a.dmg || 8, hb: { x0: -24, x1: 30, y0: -10, y1: 50 }, knock: 'down', hsA: 6, hsV: 9, zTol: 14 }, G.players);
    if (this.y <= 0) {
      this.y = 0; dust(this.x, this.z, 8); G.shake(a.shock ? 3 : 1, 8); Audio2.sfxPlay('land');
      if (a.shock) { G.projs.push(new Shock(this, this.x, this.z, 1, { dmg: a.shockDmg || 8 })); G.projs.push(new Shock(this, this.x, this.z, -1, { dmg: a.shockDmg || 8 })); }
      this.cd = (a.cd || 90) / G.diff.aggro; this.setState('cool', 'idle');
    }
  }
  // trottola (breakdance, swing)
  startESpin() { this.setState('espin', 'espin'); this.hitList.clear(); Audio2.sfxPlay('spin'); Tokens.release(this); }
  updateESpin() {
    const a = this.def.attacks.spin || { dmg: 5 }, t = this.target;
    if (t) { this.x += sign(t.x - this.x) * 2.6; this.z = approach(this.z, t.z, 0.6); }
    if (this.st % 13 === 0) this.hitList.clear();
    checkMove(this, { dmg: a.dmg || 5, hb: { x0: -26, x1: 30, y0: 10, y1: 80 }, knock: this.st > 30 ? 'down' : 'light', stun: 16, push: 1.6, hsA: 2, hsV: 6 }, G.players);
    if (this.st >= 40) { this.cd = (a.cd || 80) / G.diff.aggro; this.setState('cool', 'idle'); }
  }
  // svanisce e ricompare alle spalle del giocatore (ombre)
  startBlink() { this.setState('blinkOut', 'idle'); this.untouchable = true; Audio2.sfxPlay('poof'); for (let i = 0; i < 3; i++) addFx('smoke', this.x, this.z, 40, { life: 24 }); }
  updateBlink() {
    const t = this.target;
    if (this.state === 'blinkOut') {
      this.alpha = Math.max(0, 1 - this.st / 14);
      if (this.st >= 14) { if (t) { this.x = clamp(t.x - (t.facing || 1) * 44, G.cam.x + 24, G.cam.x + W - 24); this.z = t.z; this.facing = sign(t.x - this.x) || 1; } this.setState('blinkIn', 'idle'); addFx('smoke', this.x, this.z, 40, { life: 24 }); }
      return;
    }
    this.alpha = Math.min(this.look.alpha || 1, this.st / 12);
    if (this.st >= 12) { this.untouchable = false; this.alpha = this.look.alpha; const melee = meleeKeys(this.def.attacks); if (melee.length) this.startAttack(pick(melee)); else this.setState('cool', 'idle'); }
  }
  startDash() {
    this.setState('dashTele', 'tele');
    Audio2.sfxPlay('beamWarn');
  }
  updateDashTele() {
    const a = this.def.attacks.dash;
    this.play('tele');
    if (this.target) this.facing = sign(this.target.x - this.x) || this.facing;
    if (this.st >= a.tele) { this.setState('dash', 'dash'); this.hitList.clear(); this.dashDir = this.facing; Audio2.sfxPlay('swingBig'); }
  }
  updateDash() {
    const a = this.def.attacks.dash;
    this.x += this.dashDir * a.speed;
    if (this.st % 4 === 0) addFx('streak', this.x - this.dashDir * 16, this.z, 32, { life: 10, dir: this.dashDir });
    checkMove(this, Object.assign({ hsA: 4, hsV: 9 }, a), G.players);
    const out = this.x < G.cam.x - 30 || this.x > G.cam.x + W + 30;
    if (this.st >= a.dur || out) { this.x = clamp(this.x, G.cam.x - 16, G.cam.x + W + 16); this.cd = a.cd / G.diff.aggro; this.setState('cool', 'idle'); Tokens.release(this); }
  }
  grabPlayer(p) {
    p.releaseGrab && p.releaseGrab();
    p.setState('grabbedE', 'hurt'); p.grabbedBy = this; p.escape = 0;
    if (p.line) p.line('grabbed', 0.8, 120);
    this.setState('grabP', 'grabP'); this.holding = p;
    Audio2.sfxPlay('grab');
  }
  breakGrab() {
    const p = this.holding; this.holding = null;
    if (p) p.grabbedBy = null;
    this.setState('cool', 'idle'); this.cd = 50; this.x -= this.facing * 9;
  }
  releaseGrab() { if (this.holding) { const p = this.holding; this.holding = null; p.grabbedBy = null; if (p.state === 'grabbedE') p.setState('idle', 'idle'); } }
  updateGrabP() {
    const p = this.holding;
    if (!p || p.state !== 'grabbedE') { this.holding = null; this.setState('cool', 'idle'); return; }
    p.x = this.x + this.facing * 26; p.z = this.z; p.facing = -this.facing;
    if (this.st % 30 === 15) { applyHit(this, p, { dmg: 3, knock: 'none', hsA: 4, hsV: 6 }); if (p.state !== 'grabbedE') { this.holding = null; this.setState('cool', 'idle'); return; } }
    if (this.st >= 84) {
      this.holding = null; p.grabbedBy = null;
      p.setState('idle', 'idle');
      applyHit(this, p, { dmg: 8, knock: 'down', hsA: 4, hsV: 8, launch: 1.2, shake: 2 }, { dir: this.facing });
      this.setState('cool', 'idle'); this.cd = 60;
    }
  }
}
// attacchi corpo a corpo "normali" (con fotogrammi e area di colpo), esclusi prese, cariche e proiettili
function meleeKeys(atks) { return Object.keys(atks).filter(k => { const a = atks[k]; return a.fr && a.hb && !a.grab && !a.tele && !a.projectile && !a.lasso; }); }
function canTargetPlayer(p) { return p && p.active && !p.out && p.alive && !['dead', 'ko', 'enter', 'down', 'getup'].includes(p.state) && !p.untouchable; }
