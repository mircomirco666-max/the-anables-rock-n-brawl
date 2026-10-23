// ============================================================
// Animazioni: pose chiave per famiglia di strumento
// Ogni animazione è una lista di {p: posa, d: durata in frame}
// Gli attacchi hanno 3 pose: caricamento (w), colpo attivo (a), recupero (r)
// ============================================================
function walkFrames(n, o) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const ph = (i / n) * Math.PI * 2;
    const aF = o.amp * Math.sin(ph), aB = -o.amp * Math.sin(ph);
    const kF = o.knee0 + o.knee * Math.max(0, Math.cos(ph));
    const kB = o.knee0 + o.knee * Math.max(0, -Math.cos(ph));
    const sw = Math.sin(ph) * (o.armSwing || 0);
    out.push({
      p: P(Object.assign({}, o.base, {
        legF: [aF, kF], legB: [aB, kB],
        armF: o.armsFixed ? o.base.armF : [o.base.armF[0] - sw, o.base.armF[1]],
        armB: o.armsFixed ? o.base.armB : [o.base.armB[0] + sw, o.base.armB[1]],
      })), d: o.d
    });
  }
  return out;
}

const FX = {
  jab: { a0: 70, a1: 105, r: 20, y: 38, x: 2, w: 2 },
  low: { a0: 40, a1: 130, r: 30, y: 30, x: 0, w: 3 },
  over: { a0: -30, a1: 140, r: 34, y: 36, x: 0, w: 4 },
  wide: { a0: 15, a1: 165, r: 38, y: 32, x: -2, w: 4 },
  down: { a0: 50, a1: 160, r: 30, y: 30, x: 0, w: 3 },
  stab: { a0: 80, a1: 100, r: 40, y: 34, x: 0, w: 2 },
};

function baseAnims(arms, worn) {
  const A = {};
  const B = (o) => P(Object.assign({ armF: arms.F, armB: arms.B, inst: worn }, o));
  A.idle = [
    { p: B({ lean: 3, legF: [16, 16], legB: [-13, 10] }), d: 16 },
    { p: B({ lean: 4, legF: [17, 20], legB: [-12, 14], armF: [arms.F[0] + 2, arms.F[1] + 2] }), d: 16 },
    { p: B({ lean: 4, legF: [17, 22], legB: [-12, 16], armF: [arms.F[0] + 3, arms.F[1] + 3] }), d: 16 },
    { p: B({ lean: 3, legF: [16, 18], legB: [-13, 12], armF: [arms.F[0] + 1, arms.F[1] + 1] }), d: 16 },
  ];
  A.walk = walkFrames(8, { amp: 20, knee0: 4, knee: 18, d: 6, base: { lean: 4, armF: arms.F, armB: arms.B, inst: worn }, armsFixed: true });
  A.run = walkFrames(8, { amp: 34, knee0: 8, knee: 42, d: 4, base: { lean: 14, armF: [arms.F[0] + 10, arms.F[1]], armB: [arms.B[0] + 10, arms.B[1]], inst: worn }, armsFixed: true });
  A.jump = [{ p: B({ air: true, lean: 6, legF: [42, 75], legB: [-4, 62] }), d: 99 }];
  A.fall = [{ p: B({ air: true, lean: 2, legF: [22, 32], legB: [-10, 24] }), d: 99 }];
  A.land = [{ p: B({ lean: 8, legF: [36, 64], legB: [-24, 44] }), d: 6 }];
  A.grab = [{ p: B({ lean: 6, legF: [14, 8], legB: [-12, 6], armF: [78, 14], armB: [72, 20] }), d: 99 }];
  A.grabhit = [
    { p: B({ lean: 4, legF: [30, 40], legB: [-8, 4], armF: [76, 18], armB: [70, 22] }), d: 5 },
    { p: B({ lean: 10, legF: [82, 112], legB: [-6, 4], armF: [72, 30], armB: [66, 30] }), d: 8 },
  ];
  A.throw = [
    { p: B({ lean: -16, legF: [16, 10], legB: [-14, 8], armF: [165, 0], armB: [152, 0] }), d: 8 },
    { p: B({ lean: 18, legF: [24, 10], legB: [-22, 6], armF: [62, 0], armB: [56, 0] }), d: 14 },
  ];
  A.hurt = [{ p: B({ lean: -16, legF: [4, 10], legB: [-14, 8], armF: [-22, 40], armB: [-42, 30] }), d: 99 }];
  A.hurt2 = [{ p: B({ lean: 22, legF: [10, 14], legB: [-8, 10], armF: [30, 30], armB: [10, 40] }), d: 99 }];
  A.knock = [{ p: B({ air: true, lean: -58, legF: [72, 30], legB: [52, 42], armF: [-120, 20], armB: [-142, 20] }), d: 99 }];
  A.down = [{ p: B({ lie: true, lean: -90, legF: [88, 8], legB: [80, 14], armF: [-150, 10], armB: [-172, 10] }), d: 99 }];
  A.getup = [{ p: B({ lean: 16, legF: [76, 98], legB: [-20, 102], armF: [60, 40], armB: [30, 40] }), d: 99 }];
  A.taunt = [
    { p: B({ lean: -4, legF: [12, 4], legB: [-12, 4], armF: [arms.F[0] + 20, arms.F[1]] }), d: 16 },
    { p: B({ lean: -2, legF: [12, 10], legB: [-12, 8] }), d: 16 },
  ];
  A.dead = A.down;
  // calcio a chi è a terra
  A.stomp = [
    { p: B({ lean: -4, legF: [70, 100], legB: [-10, 6] }) },
    { p: B({ lean: 10, legF: [34, 4], legB: [-14, 8], fx: { a0: 150, a1: 175, r: 26, y: 20, x: 8, w: 3 } }) },
    { p: B({ lean: 4, legF: [24, 20], legB: [-12, 8] }) },
  ];
  return A;
}

// ---------- Famiglia CORDE: chitarre e basso ----------
function guitarAnims() {
  const worn = { m: 'worn' };
  const A = baseAnims({ F: [20, 70], B: [50, 45] }, worn);
  const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'neck' }, extra || {});
  A.l1 = [
    { p: P({ lean: 4, legF: [14, 8], legB: [-12, 6], armF: [-12, 95], armB: [50, 45] }) },
    { p: P({ lean: 10, legF: [18, 6], legB: [-16, 4], armF: [88, 2], armB: [48, 45], fx: FX.jab }) },
    { p: P({ lean: 6, legF: [14, 6], legB: [-12, 4], armF: [60, 30], armB: [50, 45] }) },
  ];
  A.l2 = [
    { p: P({ lean: 2, legF: [12, 8], legB: [-14, 6], armF: [20, 70], armB: [-30, 90] }) },
    { p: P({ lean: 14, legF: [20, 8], legB: [-18, 4], armF: [24, 70], armB: [92, 0], fx: FX.jab }) },
    { p: P({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: [20, 70], armB: [60, 30] }) },
  ];
  A.l3 = [
    { p: P({ lean: -6, legF: [10, 8], legB: [-14, 6], armF: [-40, 20], armB: [-30, 20], inst: H(-150) }) },
    { p: P({ lean: 16, legF: [24, 8], legB: [-20, 4], armF: [70, 10], armB: [64, 16], inst: H(8), fx: FX.low }) },
    { p: P({ lean: 10, legF: [18, 8], legB: [-14, 6], armF: [60, 20], armB: [55, 25], inst: H(30) }) },
  ];
  A.l4 = [
    { p: P({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [172, -8], armB: [160, -8], inst: H(-100, { behind: true }) }) },
    { p: P({ lean: 20, legF: [26, 10], legB: [-22, 6], armF: [76, 10], armB: [70, 10], inst: H(42), fx: FX.over }) },
    { p: P({ lean: 18, legF: [22, 10], legB: [-18, 6], armF: [60, 15], armB: [55, 15], inst: H(62) }) },
  ];
  A.heavy = [
    { p: P({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [-72, 0], armB: [-62, 0], inst: H(180, { behind: true }) }) },
    { p: P({ lean: 12, legF: [26, 8], legB: [-22, 4], armF: [95, 0], armB: [88, 0], inst: H(0), fx: FX.wide }) },
    { p: P({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [110, -10], armB: [100, -10], inst: H(-22) }) },
  ];
  A.jatk = [{ p: P({ air: true, lean: 14, legF: [50, 80], legB: [0, 50], armF: [110, 0], armB: [100, 0], inst: H(50), fx: FX.down }) }];
  A.ratk = [{ p: P({ lean: 22, legF: [40, 30], legB: [-35, 20], armF: [80, 10], armB: [75, 15], inst: H(-4), fx: FX.stab }) }];
  A.victory = [
    { p: P({ lean: -6, legF: [14, 4], legB: [-14, 4], armF: [165, 10], armB: [150, 10], inst: H(-82) }), d: 20 },
    { p: P({ lean: -4, legF: [18, 12], legB: [-16, 10], armF: [160, 15], armB: [146, 15], inst: H(-76) }), d: 20 },
  ];
  return A;
}

// ---------- Famiglia VOCE: asta del microfono ----------
function micAnims() {
  const worn = { m: 'hand', h: 'F', a: -100, g: 'hold' };
  const A = baseAnims({ F: [42, 42], B: [-10, 25] }, worn);
  const H = (a, g, extra) => Object.assign({ m: 'hand', h: 'F', a, g: g || 'hold' }, extra || {});
  A.walk = walkFrames(8, { amp: 20, knee0: 4, knee: 18, d: 6, base: { lean: 4, armF: [48, 40], armB: [-10, 25], inst: H(-60) }, armsFixed: true });
  A.run = walkFrames(8, { amp: 34, knee0: 8, knee: 42, d: 4, base: { lean: 14, armF: [60, 30], armB: [-30, 40], inst: H(-20) }, armsFixed: true });
  A.l1 = [
    { p: P({ lean: 2, legF: [12, 8], legB: [-14, 6], armF: [42, 42], armB: [-40, 90], inst: worn }) },
    { p: P({ lean: 12, legF: [20, 8], legB: [-18, 4], armF: [44, 40], armB: [94, 0], inst: worn, fx: FX.jab }) },
    { p: P({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: [42, 42], armB: [60, 30], inst: worn }) },
  ];
  A.l2 = [
    { p: P({ lean: -2, legF: [12, 8], legB: [-14, 6], armF: [10, 80], armB: [0, 90], inst: H(-2, 'pole') }) },
    { p: P({ lean: 12, legF: [20, 8], legB: [-18, 4], armF: [84, 4], armB: [80, 6], inst: H(-2, 'pole'), fx: FX.stab }) },
    { p: P({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: [60, 30], armB: [55, 30], inst: H(-10, 'pole') }) },
  ];
  A.l3 = [
    { p: P({ lean: -6, legF: [10, 8], legB: [-14, 6], armF: [-40, 20], armB: [-30, 20], inst: H(-160, 'pole', { behind: true }) }) },
    { p: P({ lean: 16, legF: [24, 8], legB: [-20, 4], armF: [70, 10], armB: [64, 16], inst: H(18, 'pole'), fx: FX.low }) },
    { p: P({ lean: 10, legF: [18, 8], legB: [-14, 6], armF: [60, 20], armB: [55, 25], inst: H(36, 'pole') }) },
  ];
  A.l4 = [
    { p: P({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [170, -8], armB: [158, -8], inst: H(-130, 'pole', { behind: true }) }) },
    { p: P({ lean: 20, legF: [26, 10], legB: [-22, 6], armF: [80, 10], armB: [74, 10], inst: H(36, 'pole'), fx: FX.over }) },
    { p: P({ lean: 16, legF: [22, 10], legB: [-18, 6], armF: [62, 15], armB: [56, 15], inst: H(60, 'pole') }) },
  ];
  A.heavy = [
    { p: P({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [-70, 0], armB: [-60, 0], inst: H(180, 'pole', { behind: true }) }) },
    { p: P({ lean: 12, legF: [26, 8], legB: [-22, 4], armF: [96, 0], armB: [88, 0], inst: H(4, 'pole'), fx: FX.wide }) },
    { p: P({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [112, -10], armB: [100, -10], inst: H(-20, 'pole') }) },
  ];
  A.jatk = [{ p: P({ air: true, lean: 14, legF: [50, 80], legB: [0, 50], armF: [108, 0], armB: [98, 0], inst: H(48, 'pole'), fx: FX.down }) }];
  A.ratk = [{ p: P({ lean: 22, legF: [40, 30], legB: [-35, 20], armF: [82, 8], armB: [76, 12], inst: H(-2, 'pole'), fx: FX.stab }) }];
  A.victory = [
    { p: P({ lean: -8, legF: [14, 4], legB: [-14, 4], armF: [150, 20], armB: [165, 0], inst: H(-95) }), d: 20 },
    { p: P({ lean: -4, legF: [18, 12], legB: [-16, 10], armF: [146, 24], armB: [160, 5], inst: H(-90) }), d: 20 },
  ];
  return A;
}

// ---------- Famiglia BATTERIA: due bacchette ----------
function stickAnims() {
  const S = (a, a2, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'end', k2: 'sticks', a2 }, extra || {});
  const worn = S(30, 40);
  const A = baseAnims({ F: [28, 34], B: [22, 40] }, worn);
  A.l1 = [
    { p: P({ lean: 2, legF: [14, 8], legB: [-12, 6], armF: [130, -40], armB: [22, 40], inst: S(-60, 40) }) },
    { p: P({ lean: 10, legF: [18, 6], legB: [-16, 4], armF: [80, 10], armB: [22, 40], inst: S(40, 40), fx: FX.jab }) },
    { p: P({ lean: 6, legF: [14, 6], legB: [-12, 4], armF: [50, 30], armB: [22, 40], inst: S(30, 40) }) },
  ];
  A.l2 = [
    { p: P({ lean: 2, legF: [12, 8], legB: [-14, 6], armF: [28, 34], armB: [130, -40], inst: S(30, -60) }) },
    { p: P({ lean: 12, legF: [20, 8], legB: [-18, 4], armF: [28, 34], armB: [84, 10], inst: S(30, 40), fx: FX.jab }) },
    { p: P({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: [28, 34], armB: [50, 30], inst: S(30, 30) }) },
  ];
  A.l3 = [
    { p: P({ lean: -4, legF: [10, 8], legB: [-14, 6], armF: [150, -30], armB: [140, -30], inst: S(-70, -80) }) },
    { p: P({ lean: 14, legF: [24, 8], legB: [-20, 4], armF: [82, 10], armB: [76, 14], inst: S(30, 35), fx: FX.low }) },
    { p: P({ lean: 8, legF: [18, 8], legB: [-14, 6], armF: [60, 20], armB: [55, 25], inst: S(40, 45) }) },
  ];
  A.l4 = [
    { p: P({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [175, -10], armB: [165, -10], inst: S(-95, -105) }) },
    { p: P({ lean: 20, legF: [26, 10], legB: [-22, 6], armF: [82, 10], armB: [76, 10], inst: S(60, 66), fx: FX.over }) },
    { p: P({ lean: 16, legF: [22, 10], legB: [-18, 6], armF: [60, 15], armB: [55, 15], inst: S(70, 74) }) },
  ];
  A.heavy = [
    { p: P({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [-80, 0], armB: [-70, 0], inst: S(190, 200) }) },
    { p: P({ lean: 12, legF: [26, 8], legB: [-22, 4], armF: [96, 0], armB: [90, 0], inst: S(6, 12), fx: FX.wide }) },
    { p: P({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [112, -10], armB: [104, -10], inst: S(-16, -10) }) },
  ];
  A.jatk = [{ p: P({ air: true, lean: 14, legF: [50, 80], legB: [0, 50], armF: [110, 0], armB: [100, 0], inst: S(60, 66), fx: FX.down }) }];
  A.ratk = [{ p: P({ lean: 22, legF: [40, 30], legB: [-35, 20], armF: [86, 6], armB: [80, 10], inst: S(-4, 2), fx: FX.stab }) }];
  A.victory = [
    { p: P({ lean: -6, legF: [14, 4], legB: [-14, 4], armF: [165, 10], armB: [150, 10], inst: S(-80, -100) }), d: 12 },
    { p: P({ lean: -4, legF: [18, 12], legB: [-16, 10], armF: [150, 20], armB: [165, 5], inst: S(-60, -120) }), d: 12 },
  ];
  return A;
}

// ---------- Famiglia PIANO: tastiera ----------
function keysAnims() {
  const worn = { m: 'worn' };
  const A = baseAnims({ F: [24, 66], B: [44, 52] }, worn);
  const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'end' }, extra || {});
  A.l1 = [
    { p: P({ lean: 4, legF: [14, 8], legB: [-12, 6], armF: [140, -50], armB: [44, 52] }) },
    { p: P({ lean: 10, legF: [18, 6], legB: [-16, 4], armF: [80, 20], armB: [44, 52], fx: FX.jab }) },
    { p: P({ lean: 6, legF: [14, 6], legB: [-12, 4], armF: [50, 40], armB: [44, 52] }) },
  ];
  A.l2 = [
    { p: P({ lean: 2, legF: [12, 8], legB: [-14, 6], armF: [24, 66], armB: [140, -50] }) },
    { p: P({ lean: 14, legF: [20, 8], legB: [-18, 4], armF: [24, 66], armB: [86, 16], fx: FX.jab }) },
    { p: P({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: [24, 66], armB: [60, 30] }) },
  ];
  A.l3 = [
    { p: P({ lean: -6, legF: [10, 8], legB: [-14, 6], armF: [-40, 20], armB: [-30, 20], inst: H(-150) }) },
    { p: P({ lean: 16, legF: [24, 8], legB: [-20, 4], armF: [72, 10], armB: [66, 16], inst: H(6), fx: FX.low }) },
    { p: P({ lean: 10, legF: [18, 8], legB: [-14, 6], armF: [60, 20], armB: [55, 25], inst: H(28) }) },
  ];
  A.l4 = [
    { p: P({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [172, -8], armB: [160, -8], inst: H(-100, { behind: true }) }) },
    { p: P({ lean: 20, legF: [26, 10], legB: [-22, 6], armF: [76, 10], armB: [70, 10], inst: H(44), fx: FX.over }) },
    { p: P({ lean: 18, legF: [22, 10], legB: [-18, 6], armF: [60, 15], armB: [55, 15], inst: H(64) }) },
  ];
  A.heavy = [
    { p: P({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [-72, 0], armB: [-62, 0], inst: H(180, { behind: true }) }) },
    { p: P({ lean: 12, legF: [26, 8], legB: [-22, 4], armF: [95, 0], armB: [88, 0], inst: H(0), fx: FX.wide }) },
    { p: P({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [110, -10], armB: [100, -10], inst: H(-22) }) },
  ];
  A.jatk = [{ p: P({ air: true, lean: 14, legF: [50, 80], legB: [0, 50], armF: [110, 0], armB: [100, 0], inst: H(50), fx: FX.down }) }];
  A.ratk = [{ p: P({ lean: 22, legF: [40, 30], legB: [-35, 20], armF: [80, 10], armB: [75, 15], inst: H(-4), fx: FX.stab }) }];
  A.victory = [
    { p: P({ lean: -4, legF: [14, 4], legB: [-14, 4], armF: [150, 10], armB: [160, 10], inst: H(-90) }), d: 20 },
    { p: P({ lean: -2, legF: [18, 12], legB: [-16, 10], armF: [146, 15], armB: [156, 15], inst: H(-86) }), d: 20 },
  ];
  return A;
}

// ---------- Mosse speciali (pose) ----------
function addSpecialAnims(A, id) {
  const worn = A.idle[0].p.inst;
  if (id === 'urlo') {
    A.sp = [
      { p: P({ lean: 8, legF: [16, 14], legB: [-14, 10], armF: [30, 60], armB: [-40, 30], inst: worn }), d: 16 },
      { p: P({ lean: -16, head: [-1, -1], legF: [22, 6], legB: [-22, 6], armF: [112, 0], armB: [-112, 0], inst: { m: 'hand', h: 'F', a: -40, g: 'hold' } }), d: 40 },
    ];
  } else if (id === 'assolo') {
    A.sp = [
      { p: P({ lean: -6, legF: [20, 10], legB: [-18, 8], armF: [150, 20], armB: [170, 10], inst: { m: 'hand', h: 'F', a: -90, g: 'body' } }), d: 16 },
      { p: P({ lean: -12, legF: [26, 4], legB: [-26, 4], armF: [60, 40], armB: [110, 20], inst: { m: 'worn' } }), d: 44 },
    ];
  } else if (id === 'vortice') {
    const H = (a) => ({ m: 'hand', h: 'F', a, g: 'neck' });
    A.sp = [
      { p: P({ lean: 4, legF: [18, 8], legB: [-18, 8], armF: [96, 0], armB: [86, 0], inst: H(0), fx: FX.wide }), d: 4 },
      { p: P({ lean: 4, legF: [10, 8], legB: [-10, 8], armF: [-96, 0], armB: [-86, 0], inst: H(180) }), d: 4 },
    ];
  } else if (id === 'truffa') {
    const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'neck' }, extra || {});
    A.sp = [
      { p: P({ hide: true }), d: 26 },
      { p: P({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [172, -8], armB: [160, -8], inst: H(-100, { behind: true }) }), d: 8 },
      { p: P({ lean: 22, legF: [28, 10], legB: [-24, 6], armF: [76, 10], armB: [70, 10], inst: H(46), fx: FX.over }), d: 20 },
    ];
  } else if (id === 'rullo') {
    const S = (a, a2) => ({ m: 'hand', h: 'F', a, g: 'end', k2: 'sticks', a2 });
    A.sp = [
      { p: P({ lean: 10, legF: [18, 8], legB: [-16, 6], armF: [84, 8], armB: [130, -40], inst: S(36, -60), fx: FX.jab }), d: 3 },
      { p: P({ lean: 10, legF: [18, 8], legB: [-16, 6], armF: [130, -40], armB: [84, 8], inst: S(-60, 36), fx: FX.jab }), d: 3 },
      { p: P({ lean: 16, legF: [26, 10], legB: [-22, 6], armF: [92, 0], armB: [40, 30], inst: S(0, 40) }), d: 18 },
    ];
  } else if (id === 'grancoda') {
    A.sp = [
      { p: P({ lean: -8, legF: [16, 6], legB: [-16, 6], armF: [150, -20], armB: [140, -10], inst: { m: 'worn' } }), d: 20 },
      { p: P({ lean: 6, legF: [16, 6], legB: [-16, 6], armF: [90, 10], armB: [80, 10], inst: { m: 'worn' } }), d: 40 },
    ];
  }
}

// ---------- ARMI DA RACCOGLIERE (dati) ----------
// hold = come si impugna (club, heavy, saw, gun, throw); spr = sprite in INSTRUMENTS; g = punto di presa;
// rest = angolo a riposo; act = tipo di attacco; uses = colpi/munizioni; lv = livelli dove compare
const WEAPONS = {
  tubo: { name: 'TUBO', short: 'TUBO', uses: 12, hold: 'club', spr: 'pipe', g: 'end', rest: -62, dmg: [9, 12], reach: 82, cpuRange: 62, lv: [1, 4, 5, 10] },
  mazza: { name: 'MAZZA CHIODATA', short: 'MAZZA', uses: 10, hold: 'club', spr: 'bat', g: 'end', rest: -62, dmg: [11, 15], reach: 84, gore: 2, cpuRange: 62, lv: [2, 4, 5, 9, 10] },
  fenicottero: { name: 'FENICOTTERO DI PLASTICA', short: 'FENICOTTERO', uses: 14, hold: 'club', spr: 'flamingo', g: 'end', rest: -72, dmg: [6, 8], reach: 104, push: 3.4, sfx: 'squeak', cpuRange: 84, lv: [1, 3, 8] },
  pesce: { name: 'PESCE SURGELATO', short: 'PESCE', uses: 16, hold: 'club', spr: 'fish', g: 'end', rest: -55, dmg: [5, 6, 9], reach: 74, fast: true, stun: 30, sfx: 'splat', cpuRange: 56, lv: [2, 7, 9] },
  ascia: { name: 'ASCIA-BASSO', short: 'ASCIA', uses: 8, hold: 'heavy', spr: 'axe', g: 'end', rest: -128, dmg: [22], reach: 98, gore: 3, cpuRange: 66, lv: [5, 6, 10] },
  motosega: { name: 'MOTOSEGA-CHITARRA', short: 'MOTOSEGA', uses: 40, hold: 'saw', spr: 'saw', g: 'grip', rest: 4, dmg: [3], reach: 94, gore: 3, cpuRange: 58, lv: [5, 7, 10] },
  coriandoli: { name: 'SPARACORIANDOLI', short: 'CORIANDOLI', uses: 8, hold: 'gun', spr: 'confetti', g: 'grip', rest: 0, shot: 'confetti', cpuRange: 120, lv: [1, 3, 8] },
  trombone: { name: 'BAZOOKA-TROMBONE', short: 'TROMBONE', uses: 5, hold: 'gun', spr: 'trombone', g: 'grip', rest: -4, shot: 'notebomb', cpuRange: 160, lv: [6, 9, 10] },
  theremin: { name: 'LASER-THEREMIN', short: 'THEREMIN', uses: 6, hold: 'gun', spr: 'theremin', g: 'grip', rest: 0, shot: 'laser', cpuRange: 150, lv: [3, 8] },
  lacca: { name: 'LACCA LANCIAFIAMME', short: 'LACCA', uses: 6, hold: 'gun', spr: 'spray', g: 'grip', rest: 0, shot: 'flame', cpuRange: 72, lv: [2, 4, 8] },
  acquasanta: { name: 'PISTOLA AD ACQUA SANTA', short: 'ACQUA SANTA', uses: 18, hold: 'gun', spr: 'watergun', g: 'grip', rest: 0, shot: 'water', cpuRange: 130, lv: [5, 6, 9, 10] },
  dischi: { name: 'PILA DI DISCHI', short: 'DISCHI', uses: 6, hold: 'throw', spr: 'vinyl', g: 'mid', rest: 0, shot: 'disc', cpuRange: 130, lv: [1, 3, 4] },
  grancassa: { name: 'GRANCASSA-BOMBA', short: 'GRANCASSA', uses: 3, hold: 'throw', spr: 'drumbomb', g: 'mid', rest: 0, shot: 'bomb', cpuRange: 110, lv: [2, 6, 7, 10] },
};
const WPN_HOLDS = {
  club: { armF: [38, 52] },
  heavy: { armF: [56, 60], armB: [64, 50] },
  saw: { armF: [70, 18], armB: [62, 30] },
  gun: { armF: [72, 16], armB: [64, 28] },
  throw: { armF: [30, 62] },
};

function addWeaponAnims(A, family) {
  const keep = (family === 'guitar' || family === 'keys') ? { m: 'worn' } : { m: 'none' };
  const Q = o => P(Object.assign({ inst: keep }, o));
  for (const k in WEAPONS) {
    const W = WEAPONS[k], h = WPN_HOLDS[W.hold];
    const wp = (a, extra) => Object.assign({ k: W.spr, g: W.g, a: a ?? W.rest }, extra || {});
    const conv = (fr, o = {}) => fr.map(f => ({ d: f.d, p: P(Object.assign({}, f.p, { inst: keep, fx: null },
      o.keepArm ? {} : { armF: h.armF }, (!o.keepArm && h.armB) ? { armB: h.armB } : {}, { wpn: wp(o.a) })) }));
    A[k + '_idle'] = conv(A.idle);
    A[k + '_walk'] = conv(A.walk);
    A[k + '_run'] = conv(A.run);
    A[k + '_jump'] = conv(A.jump);
    A[k + '_fall'] = conv(A.fall);
    A[k + '_land'] = conv(A.land);
    A[k + '_hurt'] = conv(A.hurt, { keepArm: true, a: -120 });
    A[k + '_hurt2'] = conv(A.hurt2, { keepArm: true, a: 40 });
    // lancio dell'arma (tasto FORTE)
    A[k + '_toss'] = [
      { p: Q({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [165, 0], armB: [120, 20], wpn: wp(-140, { behind: true }) }) },
      { p: Q({ lean: 18, legF: [24, 10], legB: [-22, 6], armF: [70, 0], armB: [40, 30], fx: FX.jab }) },
      { p: Q({ lean: 10, legF: [20, 10], legB: [-18, 6], armF: [60, 20], armB: [30, 30] }) },
    ];
    // calcio volante con l'arma in mano
    A[k + '_jatk'] = [{ p: Q({ air: true, lean: 10, legF: [96, 12], legB: [8, 60], armF: h.armF, armB: h.armB || [20, 40], wpn: wp(), fx: FX.jab }) }];
    if (W.hold === 'club') {
      A[k + '_s1'] = [
        { p: Q({ lean: -10, legF: [16, 10], legB: [-14, 8], armF: [172, -8], armB: [150, 0], wpn: wp(-110, { behind: true }) }) },
        { p: Q({ lean: 20, legF: [26, 10], legB: [-22, 6], armF: [84, 8], armB: [60, 30], wpn: wp(36), fx: FX.over }) },
        { p: Q({ lean: 16, legF: [22, 10], legB: [-18, 6], armF: [62, 15], armB: [50, 30], wpn: wp(64) }) },
      ];
      A[k + '_s2'] = [
        { p: Q({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [-72, 0], armB: [-40, 20], wpn: wp(180, { behind: true }) }) },
        { p: Q({ lean: 12, legF: [26, 8], legB: [-22, 4], armF: [95, 0], armB: [60, 30], wpn: wp(0), fx: FX.wide }) },
        { p: Q({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [110, -10], armB: [50, 40], wpn: wp(-22) }) },
      ];
      A[k + '_jatk'] = [{ p: Q({ air: true, lean: 14, legF: [50, 80], legB: [0, 50], armF: [110, 0], armB: [60, 30], wpn: wp(50), fx: FX.down }) }];
    } else if (W.hold === 'heavy') {
      A[k + '_slam'] = [
        { p: Q({ lean: -16, legF: [18, 10], legB: [-16, 8], armF: [176, -6], armB: [168, -4], wpn: wp(-150, { behind: true }) }) },
        { p: Q({ lean: 26, legF: [32, 14], legB: [-26, 6], armF: [96, 4], armB: [88, 8], wpn: wp(64), fx: FX.over }) },
        { p: Q({ lean: 22, legF: [30, 14], legB: [-24, 6], armF: [84, 10], armB: [78, 14], wpn: wp(80) }) },
      ];
    } else if (W.hold === 'saw') {
      A[k + '_saw'] = [
        { p: Q({ lean: 6, legF: [18, 10], legB: [-16, 8], armF: [80, 14], armB: [72, 24], wpn: wp(2) }) },
        { p: Q({ lean: 14, legF: [24, 10], legB: [-20, 6], armF: [90, 4], armB: [82, 12], wpn: wp(-2), fx: FX.stab }) },
        { p: Q({ lean: 15, legF: [24, 10], legB: [-20, 6], armF: [91, 2], armB: [83, 10], wpn: wp(3), fx: FX.jab }) },
      ];
    } else if (W.hold === 'gun') {
      A[k + '_shoot'] = [
        { p: Q({ lean: 4, legF: [16, 8], legB: [-14, 6], armF: [88, 4], armB: [76, 16], wpn: wp(0) }) },
        { p: Q({ lean: -6, legF: [14, 8], legB: [-16, 6], armF: [98, -10], armB: [84, 6], wpn: wp(-12) }) },
        { p: Q({ lean: 2, legF: [16, 8], legB: [-14, 6], armF: [88, 4], armB: [76, 16], wpn: wp(-2) }) },
      ];
    } else if (W.hold === 'throw') {
      A[k + '_throw'] = [
        { p: Q({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [20, 128], armB: [40, 30], wpn: wp(0) }) },
        { p: Q({ lean: 14, legF: [24, 8], legB: [-20, 4], armF: [96, -4], armB: [-20, 30], fx: FX.jab }) },
        { p: Q({ lean: 8, legF: [18, 8], legB: [-16, 6], armF: [80, 10], armB: [10, 30] }) },
      ];
    }
  }
}

const _animCache = {};
function animsFor(c) {
  if (_animCache[c.id]) return _animCache[c.id];
  const fam = { guitar: guitarAnims, mic: micAnims, sticks: stickAnims, keys: keysAnims }[c.family];
  const A = fam();
  if (typeof CHAR_ANIMS !== 'undefined' && CHAR_ANIMS[c.id]) CHAR_ANIMS[c.id](A);   // mosse proprie del musicista
  if (!A.rjatk) A.rjatk = A.jatk;
  addSpecialAnims(A, c.special.id);
  addWeaponAnims(A, c.family);
  _animCache[c.id] = A;
  return A;
}
