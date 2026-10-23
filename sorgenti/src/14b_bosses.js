// ============================================================
// BOSS DEI LIVELLI 2–10 — un'unica classe guidata dai dati.
// Ogni boss ha un elenco di mosse con un peso (alcune solo vicino, lontano o in fase 2),
// richiami di scagnozzi a soglie di salute e una seconda fase sotto metà vita.
// Personaggi inventati: nessun riferimento a persone o marchi reali.
// ============================================================

// ---------- accessori disegnati sulla testa ----------
const HX = {
  crown(c = '#ffd34a') {
    return ({ each }) => {
      const G1 = col(c), D = col(shade(c, 0.7)), R = col('#c42032'), Wt = col('#fff6c8');
      each(6, -7, 22, 2, (x, y) => {
        if (y > -0.5) return (x > 6.5 && x < 21) ? (Math.abs(x - 13.75) < 0.8 && y < 1.2 ? R : y > 1 ? D : G1) : 0;
        for (const s of [7.5, 10.5, 13.75, 17, 20]) { const hw = (y + 7) / 6.5 * 1.5; if (Math.abs(x - s) < hw) return y < -5.5 ? Wt : G1; }
        return 0;
      });
    };
  },
  horns(c = '#e8e0d0') {
    return ({ each }) => {
      const H = col(c), S = col(shade(c, 0.72)), D = col(shade(c, 0.5));
      const horn = (x, y, bx, by, dir) => { const v = (by - y) / 11; if (v < 0 || v > 1) return 0; const cx = bx + dir * Math.pow(v, 1.6) * 6; const w = 1.9 * (1 - v) + 0.35; const d = x - cx; return Math.abs(d) < w ? (v > 0.8 ? H : d * dir > 0 ? S : H) : 0; };
      each(2, -8, 27, 5, (x, y) => horn(x, y, 9, 4, -1) || horn(x, y, 19, 3, 1) || 0);
      each(7, 3, 21, 5, (x, y) => ((Math.abs(x - 9) < 1.4 || Math.abs(x - 19) < 1.4) && y < 4.5) ? D : 0);
    };
  },
  fangs() { return ({ px }) => { const Wt = col('#ffffff'); px(17.25, 21, Wt); px(17.25, 21.5, Wt); px(18.75, 21, Wt); px(18.75, 21.5, Wt); }; },
  goggles(c = '#62f08e') {
    return ({ each }) => { const F = col('#3a3446'), L = col(c), Wt = col('#ffffff'); each(8, 10.5, 23, 16, (x, y) => { if (y > 11 && y < 15.5 && x > 13 && x < 22.5) { const d = Math.hypot(x - 17.5, y - 13.25); return d < 2 ? (d < 0.8 ? Wt : L) : F; } return (y > 12.5 && y < 13.75 && x < 13) ? F : 0; }); };
  },
};
// mantello (come quello del Duca) con colori a scelta
function makeCape(outer, inner, edge) {
  return function (pb, P2, pose, seed) {
    const [sx, sy] = P2(-3, 1);
    pb.shape(sx, sy, (pose.lean * 0.5 + 8) * DEG, -3, 24, 0, 76, (u, v) => {
      const w = 6 + v * 0.25, flap = Math.sin(v * 0.18 + seed) * 2;
      if (u < -w * 0.4 + flap || u > w) return 0;
      if (u > w - 2.5) return col(u > w - 1 ? edge : inner);
      const fold = Math.sin(v * 0.4 + u * 0.8) > 0.6;
      return col(fold ? shade(outer, 1.35) : (v % 9 === 0 ? shade(outer, 0.7) : outer));
    });
  };
}

// ---------- aspetto dei boss ----------
Object.assign(ENEMY_HEAD_SPECS, {
  re_pogo: { skin: '#e2a985', hair: { style: 'spiky', col: '#62f08e' }, beard: { style: 'full', col: '#3a2418' }, scar: true, earring: '#ffd34a', thickNeck: true, grin: true, brow: '#2a1a10', extra: HX.crown('#ffd34a') },
  prof_drop: { skin: '#eedcc8', hair: { style: 'spiky', col: '#f0f0f4' }, grin: true, brow: '#c9c4d0', extra: HX.goggles('#62f08e') },
  mc_boombox: { skin: '#8a5a3a', hair: { style: 'cap', col: '#18161e' }, capCol: '#ffd34a', capLogo: '#18161e', glasses: 'wayfarer', beard: { style: 'goatee', col: '#18161e' }, thickNeck: true },
  lord_feedback: { skin: '#eeeae2', face: 'corpse', hair: { style: 'long', col: '#0c0a10' }, eyeGlow: '#ff3040', extra: HX.horns() },
  maestro: { skin: '#eedcc8', hair: { style: 'wig', col: '#f0f0f4' }, beard: { style: 'mustache', col: '#c9c4d0' }, brow: '#8a8494', eyeCol: '#c42032' },
  diva: { skin: '#f0d0c0', hair: { style: 'long', col: '#c42032' }, earring: '#ffd34a', smile: true, brow: '#5a1a1a', eyeCol: '#3a0a14' },
  sceriffo: { skin: '#d49a74', hair: { style: 'cowboy', col: '#c9c4d0' }, capCol: '#efe3c4', bandCol: '#18161e', beard: { style: 'mustache', col: '#e8e8ea' }, scar: true, eyeCol: '#c42032' },
  perfetto_a: { skin: '#f0c8a8', hair: { style: 'pompadour', col: '#ffd34a', hi: '#fff6c8' }, smile: true, eyeGlow: '#bfefff' },
  perfetto_b: { skin: '#e2a985', hair: { style: 'spiky', col: '#ff7ab8' }, smile: true, eyeGlow: '#bfefff' },
  perfetto_c: { skin: '#c48a64', hair: { style: 'quiff', col: '#3ae0ff' }, smile: true, eyeGlow: '#bfefff' },
  conte: { skin: '#d8d0d8', hair: { style: 'slicked', col: '#0c0a10' }, eyeGlow: '#ff2030', smile: true, extra: HX.fangs() },
});
Object.assign(ENEMY_LOOKS, {
  re_pogo: { headSpec: ENEMY_HEAD_SPECS.re_pogo, skin: '#e2a985', build: { h: 1.24, w: 1.68 }, shoes: 'black', throwItem: 'bottleH', trousers: '#7a1a2a', tie: 'none', costume: { kind: 'jacket', j: '#18161e', lap: '#2a2832', shirt: '#c42032', pat: 'studs', long: true } },
  prof_drop: { headSpec: ENEMY_HEAD_SPECS.prof_drop, skin: '#eedcc8', build: { h: 1.2, w: 1.1 }, shoes: 'sneaker', trousers: '#2a2a34', glove: '#62f08e', instrument: 'glowstick', carry: { a: -40, g: 'end' }, costume: { kind: 'jacket', j: '#e8ecf0', lap: '#c9cdd6', shirt: '#18161e', tie: '#62f08e', long: true, pat: 'led' } },
  mc_boombox: { headSpec: ENEMY_HEAD_SPECS.mc_boombox, skin: '#8a5a3a', build: { h: 1.2, w: 1.6 }, shoes: 'sneaker', trousers: '#3a5aa8', instrument: 'boombox', carry: { a: 0, g: 'mid' }, throwItem: 'boombox', costume: { kind: 'tee', j: '#e03a3a', pat: 'stripes', stripe: '#ffd34a', sparkle: true } },
  lord_feedback: { headSpec: ENEMY_HEAD_SPECS.lord_feedback, skin: '#eeeae2', build: { h: 1.24, w: 1.3 }, shoes: 'boot', boots: '#18161e', trousers: '#0c0a10', glove: '#18161e', instrument: 'flyingV', carry: { a: 60, g: 'neck' }, costume: { kind: 'jacket', j: '#0c0a10', lap: '#5a0c18', shirt: '#0c0a10', tie: '#5a0c18', pat: 'studs', long: true }, cape: makeCape('#1a0a10', '#5a0c18', '#c42032') },
  maestro: { headSpec: ENEMY_HEAD_SPECS.maestro, skin: '#eedcc8', build: { h: 1.16, w: 1.06 }, shoes: 'black', trousers: '#18161e', instrument: 'baton', carry: { a: -50, g: 'grip' }, costume: { kind: 'jacket', j: '#18161e', lap: '#3a3446', shirt: '#f4f2ea', tie: '#f4f2ea', long: true } },
  diva: { headSpec: ENEMY_HEAD_SPECS.diva, skin: '#f0d0c0', build: { h: 1.14, w: 1.18 }, shoes: 'black', trousers: '#7a0c2a', glove: '#f4f2ea', tie: 'none', costume: { kind: 'jacket', j: '#a0103a', lap: '#ffd34a', shirt: '#f0d0c0', long: true, sparkle: true } },
  sceriffo: { headSpec: ENEMY_HEAD_SPECS.sceriffo, skin: '#d49a74', build: { h: 1.2, w: 1.4 }, shoes: 'boot', boots: '#5a3a1a', trousers: '#3a3a46', instrument: 'revolver', carry: { a: 70, g: 'grip' }, throwItem: 'dynamite', costume: { kind: 'tee', j: '#3a2418', pat: 'vest', shirt: '#efe3c4', sleeve: '#efe3c4' } },
  perfetto_a: { headSpec: ENEMY_HEAD_SPECS.perfetto_a, skin: '#f0c8a8', build: { h: 1.08, w: 1.04 }, shoes: 'twotone', trousers: '#f4f2ea', glove: '#ffffff', costume: { kind: 'jacket', j: '#f4f2ea', lap: '#ffd34a', shirt: '#ffd34a', tie: '#18161e', sparkle: true } },
  perfetto_b: { headSpec: ENEMY_HEAD_SPECS.perfetto_b, skin: '#e2a985', build: { h: 1.08, w: 1.02 }, shoes: 'twotone', trousers: '#f4f2ea', glove: '#ffffff', costume: { kind: 'jacket', j: '#f4f2ea', lap: '#ff7ab8', shirt: '#ff7ab8', tie: '#18161e', sparkle: true } },
  perfetto_c: { headSpec: ENEMY_HEAD_SPECS.perfetto_c, skin: '#c48a64', build: { h: 1.08, w: 1.02 }, shoes: 'twotone', trousers: '#f4f2ea', glove: '#ffffff', costume: { kind: 'jacket', j: '#f4f2ea', lap: '#3ae0ff', shirt: '#3ae0ff', tie: '#18161e', sparkle: true } },
  conte: { headSpec: ENEMY_HEAD_SPECS.conte, skin: '#d8d0d8', build: { h: 1.22, w: 1.12 }, shoes: 'black', trousers: '#0c0a10', glove: '#f4f2ea', instrument: 'cane', carry: { a: 80, g: 'grip' }, costume: { kind: 'jacket', j: '#0c0a10', lap: '#5a0c18', shirt: '#f4f2ea', tie: '#c42032', long: true }, cape: makeCape('#0c0a10', '#7a0c1a', '#c42032') },
});
for (const k of ['re_pogo', 'prof_drop', 'mc_boombox', 'lord_feedback', 'maestro', 'diva', 'sceriffo', 'perfetto_a', 'perfetto_b', 'perfetto_c', 'conte']) ENEMY_LOOKS[k].id = 'e_' + k;

// ---------- i doppi oscuri della band (livello 10) ----------
const EVIL_SKIN = '#c9b4b0';
for (const c of CAST) {
  const hs = Object.assign({}, HEAD_SPECS[c.id], { skin: EVIL_SKIN });
  if (hs.glasses) hs.lensGlow = '#ff2a3a'; else hs.eyeGlow = '#ff2a3a';
  ENEMY_HEAD_SPECS['evil_' + c.id] = hs;
  ENEMY_LOOKS['evil_' + c.id] = Object.assign({}, c.look, {
    id: 'e_evil_' + c.id, headSpec: hs, skin: EVIL_SKIN, texMode: 'evil',
    costume: { kind: 'jacket', j: '#1c0a12', lap: '#000000', shirt: '#3a0a14', tie: '#c42032', flap: '#000000' },
  });
}

// i doppi oscuri suonano lo strumento del musicista che imitano, un tritono sopra: stonati apposta
function evilHarmony() { const h = Audio2.harmony(); return { root: h.root + 6 > 47 ? h.root - 6 : h.root + 6, minor: !h.minor }; }
// ---------- attacchi dei boss ----------
const BA = {
  punch: (dmg = 13, x1 = 62) => ({ anim: 'l2', fr: [14, 4, 18], dmg, hb: { x0: 6, x1, y0: 30, y1: 96 }, knock: 'down', shake: 2, hsA: 8, hsV: 10 }),
  jab: (dmg = 7, x1 = 50) => ({ anim: 'l1', fr: [9, 3, 12], dmg, hb: { x0: 6, x1, y0: 40, y1: 92 }, knock: 'light', stun: 18 }),
  kick: (dmg = 10) => ({ anim: 'kick', fr: [14, 5, 18], dmg, hb: { x0: 0, x1: 74, y0: 6, y1: 74 }, knock: 'down', hsA: 8, hsV: 10, shake: 2 }),
  whip: (dmg = 12, x1 = 96) => ({ anim: 'whip', fr: [16, 4, 20], dmg, hb: { x0: 10, x1, y0: 30, y1: 96 }, knock: 'down', hsA: 6, hsV: 10 }),
  slam: (dmg = 16) => ({ anim: 'slam', fr: [20, 6, 24], dmg, hb: { x0: -18, x1: 70, y0: 0, y1: 70 }, knock: 'down', shake: 4, zTol: 22 }),
  grab: () => ({ anim: 'grabP', fr: [12, 6, 18], hb: { x0: 6, x1: 46, y0: 16, y1: 84 }, grab: true }),
  lasso: () => ({ anim: 'whip', fr: [18, 4, 22], hb: { x0: 10, x1: 150, y0: 30, y1: 96 }, lasso: true }),
  bite: (dmg = 9) => ({ anim: 'bite', fr: [12, 4, 18], dmg, hb: { x0: 6, x1: 48, y0: 50, y1: 100 }, knock: 'light', stun: 26 }),
  // per i doppi oscuri (pose dei musicisti)
  p1: (dmg = 5) => ({ anim: 'l1', fr: [7, 3, 10], dmg, hb: { x0: 6, x1: 58, y0: 34, y1: 92 }, knock: 'light', stun: 16 }),
  p2: (dmg = 6) => ({ anim: 'l2', fr: [7, 3, 11], dmg, hb: { x0: 6, x1: 60, y0: 34, y1: 92 }, knock: 'light', stun: 18 }),
  p3: (dmg = 9) => ({ anim: 'l3', fr: [9, 4, 14], dmg, hb: { x0: 6, x1: 64, y0: 20, y1: 96 }, knock: 'down', hsA: 7, hsV: 9 }),
  ph: (dmg = 12) => ({ anim: 'heavy', fr: [16, 4, 20], dmg, hb: { x0: 6, x1: 70, y0: 10, y1: 100 }, knock: 'down', shake: 2, hsA: 8, hsV: 10 }),
};
const M = (k, w, o = {}, f = {}) => Object.assign({ k, w, o }, f);   // mossa: tipo, peso, opzioni, filtri (close/far/p1/p2/cd)
const BOSS_BASE = { tier: 'boss', anims: 'boss', noGrab: true, heavy: true, radius: 21, hurtW: 42, cls: 'BossX' };
const _B = (o) => Object.assign({}, BOSS_BASE, o);

Object.assign(ENEMY_DEFS, {
  re_pogo: _B({ name: 'RE POGO', title: 'IL SOVRANO DEL MOSH', looks: ['re_pogo'], hp: 600, speed: { x: 1.75, z: 1.05 }, score: 12000, level: 2, radius: 24, hurtW: 48,
    boss: { col: '#62f08e', p2text: 'IL POGO SI SCATENA!', dist: 80,
      summon: { at: [0.7, 0.35], text: 'TUTTI SOTTO IL PALCO!', list: [['punk', 'L'], ['punk', 'R']], extra: [['lanciabottiglie', 'R']] },
      moves: [M('melee', 3, { atk: BA.punch(13) }, { close: true }), M('melee', 2, { atk: BA.grab() }, { close: true }), M('melee', 1, { atk: BA.slam(16) }, { close: true }),
        M('leap', 3, { dmg: 12, shock: true, shockDmg: 10, n: 1, n2: 2, text: 'STAGE DIVING!' }), M('charge', 2, { anim: 'dash', tele: 26, speed: 6.4, dmg: 12, track: 0.3, col: '#62f08e', dizzy: 42, text: 'MOSH!' }, { far: true }),
        M('volley', 2, { kind: 'bottle', n: 4, n2: 6, every: 12, anim: 'throwV' }, { far: true })] } }),
  professor_drop: _B({ name: 'PROFESSOR DROP', title: 'IL CHIMICO DEL BASSO', looks: ['prof_drop'], hp: 560, speed: { x: 1.8, z: 1.1 }, score: 12000, level: 3,
    boss: { col: '#62f08e', p2text: 'ESPERIMENTO FUORI CONTROLLO!', dist: 110,
      summon: { at: [0.7, 0.35], text: 'CAVIE, A ME!', list: [['raver', 'L'], ['raver', 'R']], extra: [['robodj', 'R']] },
      moves: [M('teleport', 2, { then: { k: 'melee', o: { atk: BA.jab(8) } } }), M('beams', 3, { n: 3, n2: 4, col: '#62f08e', dmg: 9, text: 'LASER!' }),
        M('beams', 2, { n: 6, n2: 8, pattern: 'line', step: 7, col: '#3ae0ff', dmg: 10, rx: 16 }, { far: true }), M('ring', 2, { sfx: 'drop', text: 'BASS DROP!' }, { close: true }),
        M('volley', 2, { kind: 'wave', n: 2, n2: 3, every: 26, anim: 'raise', col: '#3ae0ff', dmg: 7 }), M('clouds', 2, { col: '#7ad04a', n: 2, n2: 3 }, { p2: true })] } }),
  mc_boombox: _B({ name: 'MC BOOMBOX', title: 'LA VOCE DEL QUARTIERE', looks: ['mc_boombox'], hp: 580, speed: { x: 1.8, z: 1.1 }, score: 12000, level: 4, radius: 23, hurtW: 46,
    boss: { col: '#ffd34a', p2text: 'ALZA IL VOLUME!', dist: 100,
      summon: { at: [0.7, 0.35], text: 'CREW, FATEVI SOTTO!', list: [['breaker', 'L'], ['breaker', 'R']], extra: [['graffitaro', 'R']] },
      moves: [M('volley', 3, { kind: 'wave', n: 1, n2: 2, every: 30, anim: 'sing', col: '#ffd34a', text: 'YO!', dmg: 7 }), M('volley', 2, { kind: 'boombox', n: 1, n2: 2, every: 30, anim: 'throwV' }, { far: true }),
        M('charge', 2, { anim: 'espin', tele: 22, speed: 5.4, dmg: 5, spin: true, track: 0.45, col: '#ffd34a', dizzy: 36, text: 'WINDMILL!' }),
        M('melee', 3, { atk: BA.jab(6), chain: [BA.jab(6), BA.punch(10)] }, { close: true })] } }),
  lord_feedback: _B({ name: 'LORD FEEDBACK', title: 'IL SIGNORE DEL LARSEN', looks: ['lord_feedback'], hp: 620, speed: { x: 1.7, z: 1.05 }, score: 12000, level: 5,
    boss: { col: '#ff3040', p2text: 'LARSEN INFERNALE!', dist: 90,
      summon: { at: [0.7, 0.35], text: 'ALZATEVI, MIEI FAN!', list: [['zombie_fan', 'L'], ['zombie_fan', 'R']], extra: [['corpse', 'R']] },
      moves: [M('beams', 3, { n: 3, n2: 5, style: 'fire', dmg: 11, text: 'FUOCO!' }), M('beams', 2, { n: 5, n2: 7, pattern: 'line', step: 8, style: 'fire', dmg: 11, rx: 16 }, { far: true }),
        M('volley', 2, { kind: 'wave', n: 1, n2: 2, every: 28, anim: 'raise', col: '#ff3040', sfx: 'scream', dmg: 7 }), M('melee', 3, { atk: BA.whip(11, 100) }, { close: true }),
        M('leap', 2, { dmg: 12, shock: true, shockDmg: 9, n: 1 })] } }),
  maestro: _B({ name: 'MAESTRO FORTISSIMO', title: 'IL DIRETTORE DANNATO', looks: ['maestro'], hp: 320, speed: { x: 1.8, z: 1.1 }, score: 9000, level: 6, radius: 20, hurtW: 40,
    boss: { col: '#ffd34a', p2text: 'FORTISSIMO!', dist: 110,
      summon: { at: [0.5], text: 'ORCHESTRA!', list: [['violinista', 'L'], ['scheletro', 'R']] },
      moves: [M('volley', 3, { kind: 'note', n: 2, n2: 3, every: 22, spread: 3, anim: 'raise', col: '#ffffff', dmg: 4 }), M('rain', 2, { kind: 'chandelier', n: 2, n2: 3, text: 'CHE CADA IL LAMPADARIO!' }),
        M('teleport', 1, { then: { k: 'melee', o: { atk: BA.whip(9, 72) } } }), M('melee', 2, { atk: BA.whip(9, 72) }, { close: true })] } }),
  diva: _B({ name: 'LA DIVA', title: 'LA VOCE CHE SPEZZA I VETRI', looks: ['diva'], hp: 320, speed: { x: 1.7, z: 1.05 }, score: 9000, level: 6, radius: 20, hurtW: 40,
    boss: { col: '#ff7ad9', p2text: 'DO DI PETTO!', dist: 100,
      moves: [M('ring', 2, { text: 'AAAAAH!', sfx: 'scream' }, { close: true }), M('volley', 2, { kind: 'shard', n: 1, n2: 2, every: 24, spread: 4, vz: 0.8, anim: 'sing', sfx: 'scream', dmg: 3 }),
        M('volley', 2, { kind: 'wave', n: 1, n2: 2, every: 28, anim: 'sing', col: '#ff7ad9', dmg: 7 }), M('melee', 2, { atk: BA.jab(8, 52) }, { close: true }),
        M('rain', 1, { kind: 'chandelier', n: 2 }, { p2: true })] } }),
  sceriffo: _B({ name: 'SCERIFFO TWANG', title: 'LA LEGGE DEL TWANG', looks: ['sceriffo'], hp: 600, speed: { x: 1.75, z: 1.05 }, score: 12000, level: 7, radius: 22, hurtW: 44,
    boss: { col: '#ffd34a', p2text: 'MEZZOGIORNO DI FUOCO!', dist: 120,
      summon: { at: [0.7, 0.35], text: 'VICESCERIFFI!', list: [['cowboy', 'L'], ['cowboy_zombie', 'R']], extra: [['pistolero', 'R']] },
      moves: [M('volley', 3, { kind: 'bullet', n: 3, n2: 5, every: 8, anim: 'shoot', aimZ: true }, { far: true }), M('melee', 2, { atk: BA.lasso() }),
        M('leap', 2, { dmg: 12, shock: true, shockDmg: 9, n: 1, n2: 2 }), M('volley', 2, { kind: 'dynamite', n: 2, n2: 3, every: 18, anim: 'throwV', text: 'DINAMITE!' }),
        M('melee', 2, { atk: BA.punch(12) }, { close: true }), M('rain', 1, { kind: 'barrel', n: 3 }, { p2: true })] } }),
  perfetto_a: _B({ name: 'PERFETTO UNO', title: 'IL LEADER', looks: ['perfetto_a'], hp: 250, speed: { x: 2.2, z: 1.25 }, score: 7000, level: 8, radius: 20, hurtW: 40, blood: null, debris: ['#f4f2ea', '#ffd34a', '#e8d8c8'],
    boss: { col: '#ffd34a', p2text: 'SORRIDETE!', dist: 90,
      moves: [M('charge', 3, { anim: 'dash', tele: 26, speed: 6.4, dmg: 8, col: '#ffd34a', dizzy: 34, sync: true, text: 'COREOGRAFIA!' }), M('volley', 2, { kind: 'wave', n: 1, every: 24, anim: 'sing', col: '#ffd34a' }),
        M('melee', 2, { atk: BA.kick(9) }, { close: true })] } }),
  perfetto_b: _B({ name: 'PERFETTO DUE', title: 'IL BALLERINO', looks: ['perfetto_b'], hp: 250, speed: { x: 2.3, z: 1.3 }, score: 7000, level: 8, radius: 20, hurtW: 40, blood: null, debris: ['#f4f2ea', '#ff7ab8', '#e8d8c8'],
    boss: { col: '#ff7ab8', p2text: 'PASSO A DUE!', dist: 80,
      moves: [M('charge', 2, { anim: 'dash', tele: 26, speed: 6.4, dmg: 8, col: '#ff7ab8', dizzy: 34 }), M('charge', 2, { anim: 'espin', tele: 20, speed: 5, dmg: 4, spin: true, track: 0.5, col: '#ff7ab8', dizzy: 26 }),
        M('leap', 1, { dmg: 10, n: 1 }), M('melee', 2, { atk: BA.kick(9) }, { close: true })] } }),
  perfetto_c: _B({ name: 'PERFETTO TRE', title: 'IL ROMANTICO', looks: ['perfetto_c'], hp: 250, speed: { x: 2.2, z: 1.25 }, score: 7000, level: 8, radius: 20, hurtW: 40, blood: null, debris: ['#f4f2ea', '#3ae0ff', '#c48a64'],
    boss: { col: '#3ae0ff', p2text: 'ACUTO FINALE!', dist: 110,
      moves: [M('charge', 1, { anim: 'dash', tele: 26, speed: 6.4, dmg: 8, col: '#3ae0ff', dizzy: 34 }), M('volley', 3, { kind: 'note', n: 2, n2: 3, every: 18, spread: 3, anim: 'sing', col: '#3ae0ff', dmg: 4 }),
        M('melee', 2, { atk: BA.jab(7) }, { close: true })] } }),
  conte_swing: _B({ name: 'CONTE SWING', title: 'IL VAMPIRO DELLO SWING', looks: ['conte'], hp: 600, speed: { x: 1.9, z: 1.15 }, score: 12000, level: 9,
    boss: { col: '#ff2030', p2text: 'LA NOTTE E\' MIA!', dist: 100,
      summon: { at: [0.7, 0.35], text: 'FIGLI DELLA NOTTE!', list: [['ombra', 'L'], ['ombra', 'R']], extra: [['zoot', 'R']] },
      moves: [M('volley', 3, { kind: 'bat', n: 3, n2: 4, every: 12, anim: 'raise', sfx: 'bat', dmg: 3 }), M('teleport', 3, { mist: true, then: { k: 'melee', o: { atk: BA.bite(9), drain: 1 } } }),
        M('melee', 2, { atk: BA.whip(11, 84), drain: 0.5 }, { close: true }), M('beams', 2, { n: 3, n2: 5, col: '#c42032', dmg: 10, text: 'LUNA DI SANGUE!' })] } }),
});
// doppi oscuri: ognuno ha i suoi colpi e il suo speciale
const EVIL_NAMES = { arrigo: 'ARRIGO OSCURO', mike: 'MIKE OSCURO', danny: 'DANNY OSCURO', mario: 'MARIO OSCURO', troy: 'TROY OSCURO', marvin: 'MARVIN OSCURO' };
for (const c of CAST) {
  const sp = c.special.id, st = c.stats;
  ENEMY_DEFS['evil_' + c.id] = _B({
    name: EVIL_NAMES[c.id], title: 'IL DOPPIO OSCURO', looks: ['evil_' + c.id], cls: 'EvilTwin', castId: c.id, hp: 180 + st.end * 10, level: 10, radius: 20, hurtW: 40, score: 8000,
    speed: { x: 1.9 + st.spd * 0.12, z: 1.1 + st.spd * 0.06 }, blood: '#3a0a14',
    boss: { col: '#ff2a3a', p2text: c.quotes.special, dist: 70 + st.rch * 6, armor: 36,
      moves: [M('melee', 4, { atk: BA.p1(Math.round(3 + st.str * 0.6)), chain: [BA.p2(Math.round(3 + st.str * 0.6)), BA.p3(Math.round(5 + st.str * 0.8))] }, { close: true }), M('melee', 2, { atk: BA.ph(Math.round(8 + st.str * 0.8)) }, { close: true }),
        M('leap', 1, { dmg: 7 + st.str, n: 1, teleAnim: 'land', airAnim: 'jatk' }), M('special', 3, { id: sp }, { cd: 300 })] },
  });
}

// ---------- le mosse ----------
const BOSS_MOVES = {
  // corpo a corpo: si avvicina, poi colpisce (anche in sequenza); drain = si cura col danno inflitto
  melee(o, t, T) {
    const a = this.mi === 0 ? o.atk : o.chain[this.mi - 1];
    if (this.mp === 0) {
      if (!T) return true;
      const reach = a.lasso ? 110 : Math.max(30, (a.hb.x1 || 50) - 16);
      const tx = T.x + (sign(this.x - T.x) || 1) * reach;
      this.moveToward(tx, T.z, 1.25);
      this.facing = sign(T.x - this.x) || this.facing;
      if ((Math.abs(this.x - tx) < 9 && Math.abs(this.z - T.z) < 6) || this.mt++ > 70) { this.mp = 1; this.mt = 0; this.hitList.clear(); }
      return false;
    }
    const [su, ac, re] = a.fr, k = this.mt++;
    this.play(a.anim); const nfr = (this.anims[a.anim] || []).length; this.frameIdx = k < su ? 0 : k < su + ac ? 1 : (nfr > 3 ? nfr - 1 : 2);
    if (k === su) { if (this.def.castId && !a.grab) Audio2.charSfx(this.def.castId, 'swing', { mv: a, H: evilHarmony() }); else Audio2.sfxPlay(a.grab ? 'grab' : a.lasso ? 'swing' : 'swingBig'); }
    if (k >= su && k < su + ac) {
      if (a.lasso) {
        if (k === su) {
          const box = moveBox(this, a.hb);
          const p = G.players.find(p => canBeHit(p) && canTargetPlayer(p) && hurtOverlap(box, p, this.z, 14) && p.y < 10);
          if (p) { for (let i = 0; i < 6; i++) dust(p.x + (this.x - p.x) * i / 6, p.z, 1); p.x = this.x + this.facing * 26; p.z = this.z; this.grabPlayer(p); popText('PRESO!', p.x, p.z, 100, '#e8c088', 30); return true; }
        }
      } else if (a.grab) {
        const box = moveBox(this, a.hb);
        const p = G.players.find(p => canBeHit(p) && canTargetPlayer(p) && hurtOverlap(box, p, this.z, 10) && p.y < 8);
        if (p) { this.grabPlayer(p); return true; }
      } else if (a.hb) {
        const n = checkMove(this, Object.assign({ hsA: 6, hsV: 9 }, a), G.players);
        if (n && o.drain) this.heal(Math.round(a.dmg * o.drain * n));
      }
    }
    if (k >= su + ac + re) {
      if (o.chain && this.mi < o.chain.length && T && Math.abs(T.x - this.x) < 110 && Math.abs(T.z - this.z) < 16) { this.mi++; this.mt = 0; this.hitList.clear(); this.facing = sign(T.x - this.x) || this.facing; return false; }
      return true;
    }
    return false;
  },
  // carica in linea retta fino al bordo dello schermo, poi resta stordito un attimo
  charge(o, t, T) {
    if (this.mp === 0) {
      this.noInterrupt = true; this.play(o.anim === 'espin' ? 'espin' : 'tele');
      if (T) { this.facing = sign(T.x - this.x) || this.facing; this.z = approach(this.z, T.z, 0.6); }
      if (this.mt === 0 && o.text) popText(o.text, this.x, this.z, 130, this.S.col, 50);
      if (this.mt % 4 === 0) glitter(this.x, this.z, 70, 1);
      if (++this.mt >= (this.phase === 2 ? o.tele * 0.75 : o.tele)) { this.mp = 1; this.mt = 0; this.dashDir = this.facing; this.hitList.clear(); Audio2.sfxPlay(o.spin ? 'spin' : 'swingBig'); }
      return false;
    }
    if (this.mp === 1) {
      this.play(o.anim || 'dash'); this.mt++;
      this.x += this.dashDir * o.speed * (this.phase === 2 ? 1.12 : 1);
      if (o.track && T) this.z = approach(this.z, T.z, o.track);
      if (o.spin && this.mt % 9 === 0) { this.hitList.clear(); Audio2.sfxPlay('spin', 0.6); }
      if (this.mt % 3 === 0) addFx('streak', this.x - this.dashDir * 20, this.z, 48, { life: 12, dir: this.dashDir, col: o.col });
      checkMove(this, { dmg: o.dmg, hb: { x0: -26, x1: 34, y0: 0, y1: 100 }, knock: o.spin && this.mt < 30 ? 'light' : 'down', stun: 18, push: 1.6, hsA: 0, hsV: 9, zTol: 14 }, G.players);
      const edge = this.dashDir > 0 ? this.x > G.cam.x + W - 36 : this.x < G.cam.x + 36;
      if (edge || this.mt > 120) { this.noInterrupt = false; this.mp = 2; this.mt = 0; G.shake(2, 8); Audio2.sfxPlay('fall'); }
      return false;
    }
    this.play('hurt2');
    if (++this.mt % 10 === 0) addFx('star', this.x + rand(-12, 12), this.z, 120, { life: 20 });
    return this.mt >= (o.dizzy ?? 40) * (this.phase === 2 ? 0.7 : 1);
  },
  // balzo sul giocatore; all'atterraggio onde d'urto a terra (si saltano)
  leap(o, t, T) {
    if (this.mp === 0) {
      this.play(o.teleAnim || 'crouch');
      if (T) this.facing = sign(T.x - this.x) || this.facing;
      if (this.mt === 0) { Audio2.sfxPlay('beamWarn'); if (o.text && this.mi === 0) popText(o.text, this.x, this.z, 130, this.S.col, 50); }
      if (++this.mt >= (o.tele || 20)) {
        const tx = T ? T.x - this.facing * 12 : this.x + this.facing * 90, tz = T ? T.z : this.z, D = o.air || 34;
        this.lx = clamp(tx, G.cam.x + 30, G.cam.x + W - 30); this.lz = tz;
        this.vx = (this.lx - this.x) / D; this.vz = (tz - this.z) / D; this.vy = 0.45 * D / 2; this.y = 0.1;
        this.mp = 1; this.mt = 0; this.hitList.clear(); this.noInterrupt = true; Audio2.sfxPlay('jump');
      }
      return false;
    }
    if (this.mp === 1) {
      this.play(o.airAnim || 'leap');
      this.x += this.vx; this.z = clamp(this.z + this.vz, LANE_TOP, LANE_BOTTOM); this.vy -= 0.45; this.y += this.vy;
      if (this.vy < 0) checkMove(this, { dmg: o.dmg || 10, hb: { x0: -28, x1: 34, y0: -10, y1: 60 }, knock: 'down', hsA: 6, hsV: 9, zTol: 16 }, G.players);
      if (this.y <= 0) {
        this.y = 0; this.noInterrupt = false; dust(this.x, this.z, 10); G.shake(o.shock ? 4 : 2, 10); Audio2.sfxPlay('land');
        if (o.shock) for (const d of [-1, 1]) G.projs.push(new Shock(this, this.x, this.z, d, { dmg: o.shockDmg || 9, col: this.S.col }));
        this.mi++;
        if (this.mi < (this.phase === 2 ? (o.n2 || o.n || 1) : (o.n || 1))) { this.mp = 0; this.mt = 6; }
        else { this.mp = 2; this.mt = 0; }
      }
      return false;
    }
    this.play('idle');
    return ++this.mt > (o.rec || 22);
  },
  // colonne di luce/fuoco annunciate a terra
  beams(o, t, T) {
    this.play('beam');
    if (t === 0) Audio2.sfxPlay('boss');
    if (t === (o.at || 12)) {
      const n = this.phase === 2 ? (o.n2 || o.n + 2) : o.n, targets = G.players.filter(canTargetPlayer);
      for (let i = 0; i < n; i++) {
        let bx, bz;
        if (o.pattern === 'line') { bx = this.x + this.facing * (44 + i * 34); bz = T ? T.z : this.z; }
        else if (i < targets.length) { bx = targets[i].x + rand(-9, 9); bz = targets[i].z; }
        else { bx = rand(G.cam.x + 40, G.cam.x + W - 40); bz = rand(LANE_TOP, LANE_BOTTOM); }
        if (bx < G.cam.x + 10 || bx > G.cam.x + W - 10) continue;
        G.projs.push(new Beam(this, bx, bz, i * (o.step ?? 12), { style: o.style, dmg: o.dmg, rx: o.rx, warn: o.warn, col: o.col }));
      }
      if (o.text) popText(o.text, this.x, this.z, 134, this.S.col, 60);
      G.doFlash(3, o.col || (o.style === 'fire' ? '#ff7a2a' : this.S.col));
    }
    if (t % 8 === 0) glitter(this.x, this.z, 110, 2);
    return t >= (o.dur || 84);
  },
  // raffica di proiettili (con mira, a ventaglio, a ripetizione)
  volley(o, t, T) {
    this.play(o.anim || 'throwV');
    const shots = this.phase === 2 ? (o.n2 || o.n) : o.n, every = o.every || 14, t0 = o.at || 16, k = t - t0;
    this.frameIdx = k < 0 ? 0 : (k % every < 6 ? 1 : 2);
    if (T) { this.facing = sign(T.x - this.x) || this.facing; if (o.aimZ && k < 0) this.z = approach(this.z, T.z, 0.8); }
    if (t === 0 && o.text) popText(o.text, this.x, this.z, 130, this.S.col, 50);
    if (k >= 0 && k % every === 0 && k / every < shots) {
      const n = o.spread || 1;
      for (let j = 0; j < n; j++) {
        const off = n > 1 ? j - (n - 1) / 2 : 0;
        G.projs.push(new Proj(this, o.kind, { tx: T ? T.x + rand(-16, 16) : undefined, vz: off * (o.vz || 0.9) + (o.aimZ && T ? clamp((T.z - this.z) / 40, -0.6, 0.6) : 0), col: o.col, y0: o.y0, mv: o.dmg ? { dmg: o.dmg } : undefined, ph: rand(0, 6) }));
      }
      if (o.sfx) Audio2.sfxPlay(o.sfx);
    }
    return k >= every * shots + (o.rec || 16);
  },
  // oggetti che piovono dall'alto sui giocatori
  rain(o, t, T) {
    this.play('point');
    if (t === 10) {
      const n = this.phase === 2 ? (o.n2 || o.n + 1) : o.n, targets = G.players.filter(canTargetPlayer);
      for (let i = 0; i < n; i++) {
        const p = targets[i % Math.max(1, targets.length)];
        const x = p && i < targets.length ? p.x : rand(G.cam.x + 40, G.cam.x + W - 40), z = p && i < targets.length ? p.z : rand(LANE_TOP, LANE_BOTTOM);
        G.projs.push(new FallObj(this, x + (i >= targets.length ? 0 : rand(-8, 8)), z, o.kind || 'chandelier', { delay: i * 14, dmg: o.dmg || 13 }));
      }
      if (o.text) popText(o.text, this.x, this.z, 134, this.S.col, 60);
    }
    return t >= 70;
  },
  // onda d'urto circolare (urlo, bass drop)
  ring(o, t, T) {
    this.play('sing'); this.frameIdx = t < 18 ? 0 : 1;
    if (t === 0 && o.text) popText(o.text, this.x, this.z, 134, this.S.col, 50);
    if (t === 18) { G.projs.push(new RingWave(this)); Audio2.sfxPlay(o.sfx || 'scream'); G.shake(3, 20); G.doFlash(3, this.S.col); }
    if (this.phase === 2 && t === 40) G.projs.push(new RingWave(this));
    return t >= (this.phase === 2 ? 70 : 54);
  },
  // nuvole tossiche sui giocatori
  clouds(o, t, T) {
    this.play('raise'); this.frameIdx = t < 14 ? 0 : 1;
    if (t === 14) {
      const n = this.phase === 2 ? (o.n2 || o.n) : o.n, targets = G.players.filter(canTargetPlayer);
      for (let i = 0; i < n; i++) { const p = targets[i % Math.max(1, targets.length)]; const x = p ? p.x + rand(-30, 30) : rand(G.cam.x + 40, G.cam.x + W - 40); G.projs.push(new Cloud(this, clamp(x, G.cam.x + 30, G.cam.x + W - 30), p ? clamp(p.z + rand(-10, 10), LANE_TOP, LANE_BOTTOM) : rand(LANE_TOP, LANE_BOTTOM), o.col)); }
      Audio2.sfxPlay('spray');
    }
    return t >= 44;
  },
  // sparisce e ricompare alle spalle del giocatore, poi attacca
  teleport(o, t, T) {
    if (this.mp === 0) {
      if (this.mt === 0) { this.untouchable = true; Audio2.sfxPlay('poof'); for (let i = 0; i < 3; i++) addFx('smoke', this.x + rand(-8, 8), this.z, 40, { life: 26, col: o.mist ? '#c9c4d0' : undefined }); if (o.mist) G.projs.push(new Proj(this, 'bat', { ph: rand(0, 6), mv: { dmg: 3 } })); }
      this.alpha = Math.max(0, 1 - this.mt / 14);
      if (++this.mt >= 18) {
        if (T) { const side = -(T.facing || 1); this.x = clamp(T.x + side * 50, G.cam.x + 28, G.cam.x + W - 28); this.z = T.z; this.facing = sign(T.x - this.x) || 1; }
        addFx('smoke', this.x, this.z, 40, { life: 24 }); Audio2.sfxPlay('poof'); this.mp = 1; this.mt = 0;
      }
      return false;
    }
    if (this.mp === 1) {
      this.alpha = Math.min(this.look.alpha || 1, this.mt / 10);
      if (++this.mt >= 10) {
        this.untouchable = false; this.alpha = this.look.alpha;
        if (o.then) { this.cur = { k: o.then.k, o: o.then.o, t: 0 }; this.mp = 0; this.mt = 0; this.mi = 0; return false; }
        return true;
      }
      return false;
    }
    return true;
  },
  // speciali dei doppi oscuri (gli stessi colpi dei musicisti, ma rossi)
  special(o, t, T) {
    const id = o.id;
    this.play('sp');
    if (t === 0) { G.doFlash(4, '#ff2a3a'); Audio2.sfxPlay('special'); this.noInterrupt = true; popText(this.char.special.name, this.x, this.z, 130, '#ff2a3a', 60); }
    if (id === 'urlo') {
      this.frameIdx = t < 16 ? 0 : 1;
      if (t === 16) { G.projs.push(new RingWave(this)); Audio2.sfxPlay('scream'); G.shake(2, 20); }
      if (t >= 56) return this.endSpecialE();
    } else if (id === 'assolo') {
      this.frameIdx = t < 16 ? 0 : 1;
      if (t >= 16 && t <= 56 && (t - 16) % 8 === 0) { const k = (t - 16) / 8; G.projs.push(new Bolt(this, this.x + this.facing * (40 + k * 38), this.z)); }
      if (t >= 62) return this.endSpecialE();
    } else if (id === 'vortice') {
      this.frameIdx = (t >> 2) % 2; this.drawFacing = ((t >> 3) % 2) ? -this.facing : this.facing;
      this.x += this.facing * 3; if (T) this.z = approach(this.z, T.z, 0.8);
      if (t % 8 === 0) { this.hitList.clear(); Audio2.sfxPlay('spin', 0.7); }
      checkMove(this, { dmg: 4, hb: { x0: -48, x1: 51, y0: 10, y1: 84 }, knock: t > 30 ? 'down' : 'light', stun: 22, push: 1.5, hsA: 2, hsV: 6 }, G.players, { noStopA: true });
      if (t >= 40 || this.x < G.cam.x + 30 || this.x > G.cam.x + W - 30) return this.endSpecialE();
    } else if (id === 'truffa') {
      if (t === 0) { this.hidden = true; this.untouchable = true; addFx('smoke', this.x, this.z + 1, 20, { life: 30 }); Audio2.sfxPlay('poof'); }
      this.frameIdx = t < 26 ? 0 : t < 34 ? 1 : 2;
      if (t === 25) {
        if (T) { const side = -(T.facing || 1); this.x = clamp(T.x + side * 36, G.cam.x + 20, G.cam.x + W - 20); this.z = T.z; this.facing = sign(T.x - this.x) || 1; }
        this.hidden = false; this.untouchable = false; addFx('smoke', this.x, this.z + 1, 20, { life: 26 }); Audio2.sfxPlay('poof');
      }
      if (t === 34 && checkMove(this, { dmg: 16, hb: { x0: -13, x1: 70, y0: 0, y1: 99 }, knock: 'down', zTol: 20, shake: 3, hsA: 10, hsV: 12, launch: 1.3 }, G.players)) popText('TRUFFATO!', this.x + this.facing * 30, this.z, 110, '#ff2a3a');
      if (t >= 54) return this.endSpecialE();
    } else if (id === 'rullo') {
      if (t === 0) Audio2.sfxPlay('drumroll');
      if (t < 60) { this.frameIdx = (t / 3 | 0) % 2; if (t % 6 === 0) { this.hitList.clear(); checkMove(this, { dmg: 2, hb: { x0: 0, x1: 48, y0: 19, y1: 83 }, knock: 'light', stun: 16, push: 0.5, hsA: 1, hsV: 3 }, G.players, { noStopA: true }); } if (T && t % 4 === 0) this.x += sign(T.x - this.x) * 2; }
      else this.frameIdx = 2;
      if (t === 60) { G.projs.push(new Cymbal(this)); Audio2.sfxPlay('metal'); }
      if (t >= 78) return this.endSpecialE();
    } else if (id === 'grancoda') {
      this.frameIdx = t < 20 ? 0 : 1;
      if (t === 6) notes(this.x, this.z, 50, 6);
      if (t === 20) G.projs.push(new PianoDrop(this, T ? T.x : this.x + this.facing * 92, T ? T.z : this.z));
      if (t >= 60) return this.endSpecialE();
    } else return this.endSpecialE();
    return false;
  },
};

class BossX extends Enemy {
  constructor(type, x, z, o = {}) {
    super(type, x, z, o);
    this.S = this.def.boss || { moves: [] };
    this.bossArmor = this.S.armor ?? 46; this.phase = 1; this.next = 50; this.used = {}; this.summoned = 0;
    this.radius = this.def.radius || 20;
    this.cur = null; this.mp = 0; this.mt = 0; this.mi = 0;
    this.setState('intro', 'walk'); this.untouchable = true;
  }
  grabbable() { return false; }
  // se viene stordito a metà mossa, la mossa si annulla e tutto torna a posto
  onHurt() {
    super.onHurt();
    this.cur = null; this.noInterrupt = false; this.untouchable = false; this.hidden = false; this.drawFacing = undefined; this.alpha = this.look.alpha;
    this.next = Math.max(this.next, 20);
  }
  heal(n) { if (n <= 0 || this.hp <= 0) return; this.hp = Math.min(this.maxHp, this.hp + n); popText('+' + n, this.x, this.z, 120, '#ff2030', 30); if (goreOn()) for (let i = 0; i < 4; i++) addFx('blood', this.x + rand(-10, 10), this.z, 70 + rand(0, 30), { life: 24, vx: rand(-0.5, 0.5), vy: rand(0.4, 1.2), col: '#c42032' }); }
  bossLine(ev, prob = 1) {
    if (!chance(prob)) return;
    const L = this.def.castId ? EVIL_LINES : BOSS_LINES[this.type]; const s = L && pickLine(L[ev]);
    if (s) this.say(s, 50 + s.length * 2);
  }
  onFight() { if (this.state === 'intro') { this.setState('idle', 'idle'); this.next = randi(20, 50); } this.bossLine('intro', this.def.castId ? 0.5 : 1); }
  onDamaged(a, dmg, dead) {
    if (!dead && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2; this.speedMul = this.S.p2speed || 1.18;
      popText(this.S.p2text || 'FASE 2!', this.x, this.z, 134, this.S.col || '#ff4d6d', 90);
      this.bossLine('p2', 0.8);
      G.doFlash(8, this.S.col); Audio2.sfxPlay('boss');
      if (G.level && !G.level.tempoUp) { G.level.tempoUp = true; Audio2.setTempo(1.08); }
      glitter(this.x, this.z, 64, 16);
    }
  }
  onDeath() {
    Tokens.release(this);
    G.stats.kills++;
    const k = this.lastHitBy; if (k && k.onKill) k.onKill(this);
    Audio2.sfxPlay('boss'); G.slowmo = 90; G.doFlash(14, this.S.col); G.shake(5, 40);
    this.untouchable = false; this.hidden = false; this.alpha = this.look.alpha; this.noInterrupt = false;
    this.bossLine('die');
    if (this.bloodCol) { bloodPool(this.x, this.z, 22, this.bloodCol); blood(this.x, this.z, 50, 30, 0, this.bloodCol); blood(this.x, this.z, 80, 20, 0, this.bloodCol); }
    else if (this.def.debris) chipsAt(this.x, this.z, 40, 26, this.def.debris, 4);
    for (let i = 0; i < 3; i++) glitter(this.x, this.z, 48 + i * 18, 14);
    if (this.def.drops) for (const [item, p] of this.def.drops) if (chance(p)) { G.pickups.push(new Pickup(item, this.x, this.z)); break; }
    if (G.level && G.level.onBossDefeated) G.level.onBossDefeated(this);
  }
  pickMove(T) {
    const dx = Math.abs(T.x - this.x), dz = Math.abs(T.z - this.z), close = dx < 100 && dz < 18, far = dx > 120;
    const ok = this.S.moves.filter(m => (!m.close || close) && (!m.far || far) && (!m.p2 || this.phase === 2) && (!m.p1 || this.phase === 1) && (!m.cd || G.frame - (this.used[m.k + m.w] ?? -1e9) > m.cd));
    if (!ok.length) return this.S.moves.find(m => m.k === 'melee') || this.S.moves[0];
    let tot = ok.reduce((s, m) => s + m.w, 0), r = Math.random() * tot;
    for (const m of ok) { r -= m.w; if (r <= 0) return m; }
    return ok[ok.length - 1];
  }
  startMove(m) {
    this.used[m.k + m.w] = G.frame;
    if (!this.bubble && G.frame - (this.lastTaunt || -999) > 400) { this.lastTaunt = G.frame; this.bossLine('taunt', 0.5); }
    this.cur = { k: m.k, o: m.o, t: 0 }; this.mp = 0; this.mt = 0; this.mi = 0;
    this.setState('move', 'idle'); this.hitList.clear(); Tokens.release(this);
    // coreografie: chi è libero nel gruppo esegue la stessa mossa insieme
    if (m.o.sync && G.level && G.level.bosses) for (const b of G.level.bosses) {
      if (b === this || !b.alive || b.hp <= 0 || !(b instanceof BossX) || !['idle', 'walk', 'cool'].includes(b.state)) continue;
      const bm = b.S.moves.find(x => x.k === m.k); if (bm) b.startMove(Object.assign({}, bm, { o: Object.assign({}, bm.o, { sync: false }) }));
    }
  }
  endMove() {
    this.noInterrupt = false; this.untouchable = false; this.hidden = false; this.drawFacing = undefined;
    this.alpha = this.look.alpha; this.cur = null;
    this.setState('idle', 'idle');
    const r = this.S.rest || [26, 56];
    this.next = Math.round(randi(r[0], r[1]) / (this.phase === 2 ? 1.35 : 1) / (G.diff.aggro || 1));
  }
  updateAI() {
    const T = this.target = this.pickTarget(), s = this.state;
    if (s === 'intro') {
      if (this.entryX !== undefined && this.st < 90) { this.facing = sign(this.entryX - this.x) || this.facing; this.moveToward(this.entryX, this.z, 1.3); }
      else { if (T) this.facing = sign(T.x - this.x) || this.facing; this.play('taunt'); }
      if (this.st === 92) { Audio2.sfxPlay(this.def.castId ? 'laugh' : 'boss'); G.shake(2, 20); }
      if (this.st >= 320) { this.untouchable = false; this.setState('idle', 'idle'); }
      return;
    }
    if (s === 'move') {
      const m = this.cur; if (!m) { this.endMove(); return; }
      const done = BOSS_MOVES[m.k].call(this, m.o, m.t++, T);
      if (done && this.state === 'move') this.endMove();
      return;
    }
    if (s === 'grabP') return this.updateGrabP();
    if (s === 'cool') { this.play('idle'); if (this.st > 16) this.setState('idle', 'idle'); return; }
    if (!T) { this.play('taunt'); return; }
    this.facing = sign(T.x - this.x) || this.facing;
    const dist = this.S.dist ?? 80;
    const tx = clamp(T.x + (sign(this.x - T.x) || 1) * dist, G.cam.x + 30, G.cam.x + W - 30);
    this.state = 'idle'; this.moveToward(tx, T.z, 0.85);
    if (--this.next > 0) return;
    // richiamo degli scagnozzi a soglie di salute
    const sm = this.S.summon;
    if (sm && this.summoned < sm.at.length && this.hp / this.maxHp < sm.at[this.summoned]) { this.summoned++; this.startSummon(sm); return; }
    this.startMove(this.pickMove(T));
  }
  startSummon(sm) {
    this.cur = { k: '_summon', o: sm, t: 0 }; this.setState('move', 'point');
  }
}
BOSS_MOVES._summon = function (o, t) {
  this.play('point');
  if (t === 16) {
    popText(o.text || 'A ME!', this.x, this.z, 134, '#ffd23e', 70); Audio2.sfxPlay('boss');
    for (const [type, side] of o.list) G.level.spawnNow(type, side);
    if (o.extra && (this.phase === 2 || G.players.filter(p => p.active).length > 1)) for (const [type, side] of o.extra) G.level.spawnNow(type, side);
  }
  return t >= 56;
};

// ---------- i doppi oscuri usano le pose dei musicisti ----------
const _evilAnimCache = {};
function evilAnims(id) {
  if (_evilAnimCache[id]) return _evilAnimCache[id];
  const c = CAST.find(c => c.id === id), base = animsFor(c), A = Object.assign({}, base);
  const fill = { grabbed: 'hurt', grabP: 'grab', crouch: 'land', tele: 'land', dash: 'ratk', beam: 'taunt', point: 'taunt', sway: 'idle', leap: 'jatk', spin: 'sp', sing: 'taunt', raise: 'taunt', throwV: 'heavy', espin: 'sp', kick: 'l3', slam: 'heavy', whip: 'l2', shoot: 'l1', bite: 'l1', headbang: 'heavy', walkZ: 'walk', skate: 'walk' };
  for (const k in fill) if (!A[k]) A[k] = base[fill[k]] || base.idle;
  _evilAnimCache[id] = A;
  return A;
}
class EvilTwin extends BossX {
  constructor(type, x, z, o = {}) {
    super(type, x, z, o);
    this.char = CAST.find(c => c.id === this.def.castId);
    this.anims = evilAnims(this.def.castId);
    this.hurtH = 90;
  }
  endSpecialE() { this.noInterrupt = false; this.hidden = false; this.untouchable = false; this.drawFacing = undefined; return true; }
  onFight() { super.onFight(); if (!this.bubble && chance(0.6)) { const s = pickLine(BAND_LINES[this.char.id].boss); if (s) this.say(s); } }
}
BOSS_CLASSES.BossX = BossX;
BOSS_CLASSES.EvilTwin = EvilTwin;
