// ============================================================
// MOSSE DEI MUSICISTI: ognuno ha combo, colpo pesante, attacco in corsa e in volo propri,
// legati allo strumento. Pose qui (CHAR_ANIMS), dati dei colpi sotto (CHAR_MOVES).
// note = posizione nel "riff": il colpo suona la nota corrispondente (08c_charsfx.js)
// snd = suono speciale della mossa (lasso, windmill, slap, kick, roll, gliss, organ)
// ============================================================
const FXS = {
  spin: { a0: -170, a1: 170, r: 36, y: 40, x: 0, w: 3 },
  floor: { a0: 110, a1: 175, r: 34, y: 34, x: 4, w: 4 },
  up: { a0: -10, a1: 80, r: 34, y: 40, x: 0, w: 3 },
  low: { a0: 120, a1: 175, r: 38, y: 26, x: 6, w: 3 },
};
// microfono appeso al suo cavo (per il "lazo" di Arrigo)
INSTRUMENTS.miccord = { vr: 6, len: 46, grips: { end: 0 }, reach: 40, fn(u, v) {
  const w = Math.sin(u * 0.22) * 1.2;
  if (u >= 0 && u < 34 && Math.abs(v - w) < 0.7) return C(v - w < 0 ? '#3a3a46' : '#18161e');
  if (u >= 34 && u < 40 && Math.abs(v) < 1.3) return C(v < 0 ? '#5a5a66' : '#2a2a34');
  if (Math.hypot(u - 42.5, v) < 3.2) return C(((Math.floor(u * 2) + Math.floor(v * 2)) % 2) ? '#e6e8ee' : '#4a4e5c');
  return 0;
} };
const CHAR_ANIMS = {
  // ---------------- ARRIGO: asta del microfono e microfono sul cavo ----------------
  arrigo(A) {
    const H = (a, g, extra) => Object.assign({ m: 'hand', h: 'F', a, g: g || 'hold' }, extra || {});
    // microfono roteato sul cavo: l'asta resta nell'altra mano
    const L = (armF, a) => P({ lean: 4, legF: [20, 12], legB: [-18, 10], armF, armB: [18, 40], inst: { m: 'hand', h: 'B', a: -96, g: 'hold', k2: 'miccord', a2: a } });
    A.lasso = [
      P({ lean: -6, legF: [16, 10], legB: [-16, 8], armF: [-60, 20], armB: [18, 40], inst: { m: 'hand', h: 'B', a: -96, g: 'hold', k2: 'miccord', a2: 150 } }),
      L([100, 0], 0), L([170, 0], -80), L([-100, 0], 180), L([20, 0], 70),
      P({ lean: 6, legF: [18, 8], legB: [-16, 6], armF: [70, 20], armB: [18, 40], inst: { m: 'hand', h: 'B', a: -96, g: 'hold', k2: 'miccord', a2: 60 } }),
    ].map(p => ({ p }));
    A.lasso[1].p.fx = FXS.spin;
    // asta come lancia in corsa
    A.ratk = [{ p: P({ lean: 24, legF: [44, 30], legB: [-38, 22], armF: [86, 4], armB: [80, 8], inst: H(-2, 'pole'), fx: FX.stab }) }];
    // "pogo" sull'asta: si pianta sotto di lui
    A.jatk = [{ p: P({ air: true, lean: 6, legF: [70, 110], legB: [30, 100], armF: [30, 20], armB: [20, 30], inst: H(-88, 'hold'), fx: FXS.floor }) }];
    // calcio a due piedi in corsa
    A.rjatk = [{ p: P({ air: true, lean: -34, legF: [96, 4], legB: [86, 10], armF: [-40, 30], armB: [-60, 20], inst: H(-150, 'hold'), fx: FX.jab }) }];
  },

  // ---------------- MIKE: forza bruta con la chitarra ----------------
  mike(A) {
    const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'neck' }, extra || {});
    A.l1 = [   // spallata con il corpo della chitarra
      { p: P({ lean: -4, legF: [14, 8], legB: [-14, 6], armF: [10, 60], armB: [40, 40] }) },
      { p: P({ lean: 30, hip: [6, 0], legF: [34, 10], legB: [-30, 4], armF: [10, 80], armB: [70, 20], fx: FX.jab }) },
      { p: P({ lean: 12, legF: [20, 8], legB: [-18, 4], armF: [20, 70], armB: [50, 45] }) },
    ];
    A.l2 = [   // manicata: il manico spinto in avanti come un ariete
      { p: P({ lean: -6, legF: [12, 8], legB: [-14, 6], armF: [-20, 60], armB: [-10, 50], inst: H(170, { behind: true }) }) },
      { p: P({ lean: 16, legF: [26, 8], legB: [-22, 4], armF: [80, 6], armB: [70, 14], inst: H(-2), fx: FX.stab }) },
      { p: P({ lean: 10, legF: [20, 8], legB: [-16, 6], armF: [60, 20], armB: [55, 25], inst: H(10) }) },
    ];
    A.l3 = [   // SPACCACHITARRA: da sopra la testa fino a terra
      { p: P({ lean: -16, legF: [14, 10], legB: [-14, 8], armF: [178, -6], armB: [168, -6], inst: H(-96, { behind: true }) }) },
      { p: P({ lean: 34, hip: [2, 6], legF: [40, 40], legB: [-30, 14], armF: [110, 4], armB: [104, 6], inst: H(74), fx: FXS.floor }) },
      { p: P({ lean: 26, hip: [2, 4], legF: [36, 34], legB: [-28, 12], armF: [100, 8], armB: [96, 10], inst: H(84) }) },
    ];
    A.l4 = A.l3;
    // MULINELLO: il braccio gira sulle corde, poi l'accordo esplode in avanti
    const W = (armF, lean) => P({ lean, legF: [20, 10], legB: [-18, 8], armF, armB: [50, 45], inst: { m: 'worn' } });
    A.heavy = [
      { p: P({ lean: -10, legF: [16, 10], legB: [-16, 8], armF: [175, 0], armB: [50, 45], inst: { m: 'worn' } }) },
      { p: W([120, 0], -4) }, { p: W([40, 10], 2) }, { p: W([-40, 10], 4) }, { p: W([-150, 0], -2) },
      { p: P({ lean: 10, legF: [22, 8], legB: [-18, 4], armF: [30, 40], armB: [50, 45], inst: { m: 'worn' }, fx: FX.wide }) },
    ];
    // carica del toro, chitarra davanti come uno scudo
    A.ratk = [{ p: P({ lean: 30, hip: [4, 2], legF: [46, 34], legB: [-40, 24], armF: [40, 60], armB: [50, 40], fx: FX.jab }) }];
    A.jatk = [{ p: P({ air: true, lean: 20, legF: [40, 70], legB: [0, 50], armF: [130, -10], armB: [120, -6], inst: H(70), fx: FXS.floor }) }];
    A.rjatk = [{ p: P({ air: true, lean: 50, legF: [10, 30], legB: [-20, 30], armF: [100, 0], armB: [90, 0], inst: H(10), fx: FX.jab }) }];
  },

  // ---------------- DANNY: velocità, accordi e mosse da palco ----------------
  danny(A) {
    const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'neck' }, extra || {});
    A.l1 = [
      { p: P({ lean: 4, legF: [14, 8], legB: [-12, 6], armF: [-10, 100], armB: [50, 45] }) },
      { p: P({ lean: 10, legF: [18, 6], legB: [-16, 4], armF: [90, 0], armB: [48, 45], fx: FX.jab }) },
      { p: P({ lean: 6, legF: [14, 6], legB: [-12, 4], armF: [60, 30], armB: [50, 45] }) },
    ];
    A.l2 = [
      { p: P({ lean: 2, legF: [12, 8], legB: [-14, 6], armF: [20, 70], armB: [-30, 100] }) },
      { p: P({ lean: 12, legF: [20, 8], legB: [-18, 4], armF: [24, 70], armB: [92, 0], fx: FX.jab }) },
      { p: P({ lean: 6, legF: [16, 6], legB: [-14, 4], armF: [20, 70], armB: [60, 30] }) },
    ];
    A.l3 = [   // colpetto col manico
      { p: P({ lean: -2, legF: [12, 8], legB: [-14, 6], armF: [-10, 60], armB: [10, 50], inst: H(160, { behind: true }) }) },
      { p: P({ lean: 14, legF: [22, 8], legB: [-18, 4], armF: [86, 4], armB: [76, 14], inst: H(4), fx: FX.stab }) },
      { p: P({ lean: 8, legF: [18, 8], legB: [-14, 6], armF: [60, 20], armB: [55, 25], inst: H(20) }) },
    ];
    A.l4 = [   // ginocchiata
      { p: P({ lean: 0, legF: [30, 40], legB: [-10, 6], armF: [20, 70], armB: [50, 45] }) },
      { p: P({ lean: -8, legF: [96, 100], legB: [-6, 4], armF: [30, 60], armB: [-20, 40], fx: FX.low }) },
      { p: P({ lean: 0, legF: [40, 50], legB: [-10, 6], armF: [20, 70], armB: [50, 45] }) },
    ];
    // giravolta con la chitarra a braccio teso
    A.l5 = [
      { p: P({ lean: -6, legF: [14, 10], legB: [-16, 8], armF: [-60, 10], armB: [-50, 10], inst: H(-160, { behind: true }) }) },
      { p: P({ lean: 10, legF: [24, 8], legB: [-20, 4], armF: [96, 0], armB: [90, 0], inst: H(0), fx: FXS.spin }) },
      { p: P({ lean: 10, legF: [20, 8], legB: [-20, 4], armF: [-96, 0], armB: [-90, 0], inst: H(180) }) },
      { p: P({ lean: 8, legF: [20, 8], legB: [-16, 6], armF: [70, 20], armB: [60, 25], inst: H(30) }) },
    ];
    // DUCK WALK: saltella su una gamba e scalcia con l'altra
    const D = (legF, lean) => P({ lean, legF, legB: [-24, 96], armF: [20, 70], armB: [50, 45] });
    A.heavy = [
      { p: D([60, 100], 10, 8) },
      { p: Object.assign(D([92, 10], 14, 12), { fx: FX.low }) }, { p: D([70, 60], 14, 10) }, { p: Object.assign(D([92, 10], 14, 12), { fx: FX.low }) },
      { p: D([40, 40], 8, 6) },
    ];
    // scivolata in ginocchio con la chitarra alzata
    A.ratk = [{ p: P({ lean: -20, hip: [0, 22], legF: [80, 160], legB: [-60, 120], armF: [150, 20], armB: [130, 30], inst: H(-60), fx: FXS.low }) }];
    // doppio calcio in volo
    A.jatk = [
      { p: P({ air: true, lean: 4, legF: [98, 10], legB: [10, 70], armF: [20, 70], armB: [50, 45], fx: FX.jab }) },
      { p: P({ air: true, lean: -2, legF: [20, 70], legB: [98, 8], armF: [20, 70], armB: [-20, 50], fx: FX.low }) },
    ];
    // spaccata volante
    A.rjatk = [{ p: P({ air: true, lean: 6, legF: [100, 0], legB: [-100, 0], armF: [150, 20], armB: [140, 20], inst: H(-70), fx: FXS.spin }) }];
  },

  // ---------------- MARIO: portata lunghissima e slap ----------------
  mario(A) {
    const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'neck' }, extra || {});
    A.l1 = [   // il manico lungo spinto in avanti
      { p: P({ lean: -4, legF: [14, 8], legB: [-16, 6], armF: [-20, 50], armB: [-10, 40], inst: H(170, { behind: true }) }) },
      { p: P({ lean: 14, legF: [26, 6], legB: [-24, 4], armF: [88, 0], armB: [80, 4], inst: H(-4), fx: FX.stab }) },
      { p: P({ lean: 8, legF: [20, 6], legB: [-16, 4], armF: [70, 14], armB: [64, 20], inst: H(6) }) },
    ];
    A.l2 = [   // paletta verso il mento
      { p: P({ lean: 0, legF: [14, 8], legB: [-14, 6], armF: [40, 40], armB: [30, 40], inst: H(40) }) },
      { p: P({ lean: 6, legF: [22, 8], legB: [-18, 4], armF: [120, -10], armB: [110, -6], inst: H(-40), fx: FXS.up }) },
      { p: P({ lean: 4, legF: [18, 8], legB: [-14, 6], armF: [90, 10], armB: [80, 14], inst: H(-20) }) },
    ];
    A.l3 = [   // spazzata larga
      { p: P({ lean: -10, legF: [12, 8], legB: [-14, 6], armF: [-80, 0], armB: [-70, 0], inst: H(180, { behind: true }) }) },
      { p: P({ lean: 12, legF: [26, 8], legB: [-22, 4], armF: [96, 0], armB: [88, 0], inst: H(20), fx: FX.wide }) },
      { p: P({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [110, -10], armB: [100, -10], inst: H(-10) }) },
    ];
    // GIRO DI BASSO: giro completo a braccia tese
    A.l4 = [
      { p: P({ lean: -8, legF: [14, 10], legB: [-16, 8], armF: [-70, 0], armB: [-60, 0], inst: H(180, { behind: true }) }) },
      { p: P({ lean: 6, legF: [22, 8], legB: [-22, 6], armF: [94, 0], armB: [88, 0], inst: H(4), fx: FXS.spin }) },
      { p: P({ lean: 6, legF: [16, 8], legB: [-16, 8], armF: [-94, 0], armB: [-88, 0], inst: H(176) }) },
      { p: P({ lean: 6, legF: [22, 8], legB: [-22, 6], armF: [94, 0], armB: [88, 0], inst: H(4), fx: FXS.spin }) },
      { p: P({ lean: 8, legF: [22, 8], legB: [-18, 4], armF: [80, 10], armB: [74, 12], inst: H(16) }) },
    ];
    // SLAP & POP: schiaffo di pollice, poi la corda tirata verso l'alto
    A.heavy = [
      { p: P({ lean: -6, legF: [14, 10], legB: [-14, 8], armF: [20, 70], armB: [150, -20] }) },
      { p: P({ lean: 14, legF: [24, 8], legB: [-20, 4], armF: [20, 70], armB: [70, 10], fx: FX.jab }) },
      { p: P({ lean: 4, legF: [20, 8], legB: [-16, 6], armF: [20, 70], armB: [140, 10], fx: FXS.up }) },
      { p: P({ lean: 6, legF: [18, 8], legB: [-14, 6], armF: [20, 70], armB: [100, 20] }) },
    ];
    // sgambetto: il basso spazza il pavimento
    A.ratk = [{ p: P({ lean: 30, hip: [0, 10], legF: [50, 70], legB: [-50, 40], armF: [120, 0], armB: [110, 6], inst: H(70), fx: FXS.low }) }];
    // elicottero in volo
    A.jatk = [{ p: P({ air: true, lean: 6, legF: [40, 70], legB: [0, 60], armF: [90, 0], armB: [-90, 0], inst: H(0), fx: FXS.spin }) }];
    A.rjatk = [{ p: P({ air: true, lean: 40, legF: [10, 20], legB: [-24, 30], armF: [96, 0], armB: [90, 2], inst: H(6), fx: FX.stab }) }];
  },

  // ---------------- TROY: raffiche di bacchette e cassa ----------------
  troy(A) {
    const S = (a, a2, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'end', k2: 'sticks', a2 }, extra || {});
    const R = (fF, fB) => [   // colpo alternato: fF = braccio davanti che colpisce
      { p: P({ lean: 4, legF: [16, 8], legB: [-14, 6], armF: fF ? [140, -40] : [40, 40], armB: fF ? [30, 40] : [140, -40], inst: S(fF ? -70 : 30, fF ? 30 : -70) }) },
      { p: P({ lean: 10, legF: [18, 6], legB: [-16, 4], armF: fF ? [84, 10] : [40, 40], armB: fF ? [30, 40] : [84, 10], inst: S(fF ? 50 : 30, fF ? 30 : 50), fx: FX.jab }) },
      { p: P({ lean: 6, legF: [16, 6], legB: [-14, 4], armF: [50, 30], armB: [40, 30], inst: S(40, 40) }) },
    ];
    A.l1 = R(true); A.l2 = R(false); A.l3 = R(true); A.l4 = R(false);
    A.l5 = [   // tutte e due insieme
      { p: P({ lean: -2, legF: [14, 8], legB: [-14, 6], armF: [150, -30], armB: [140, -30], inst: S(-80, -90) }) },
      { p: P({ lean: 12, legF: [22, 8], legB: [-18, 4], armF: [86, 8], armB: [80, 12], inst: S(40, 46), fx: FX.jab }) },
      { p: P({ lean: 8, legF: [18, 8], legB: [-14, 6], armF: [60, 20], armB: [55, 25], inst: S(40, 45) }) },
    ];
    A.l6 = [   // PIATTO: doppio colpo dall'alto
      { p: P({ lean: -12, legF: [16, 10], legB: [-14, 8], armF: [178, -10], armB: [168, -10], inst: S(-100, -110) }) },
      { p: P({ lean: 24, legF: [28, 12], legB: [-24, 6], armF: [96, 6], armB: [90, 8], inst: S(70, 76), fx: FX.over }) },
      { p: P({ lean: 18, legF: [24, 10], legB: [-18, 6], armF: [70, 15], armB: [64, 15], inst: S(76, 80) }) },
    ];
    // CASSA: calcio frontale come il pedale della grancassa
    A.heavy = [
      { p: P({ lean: -10, legF: [60, 100], legB: [-6, 6], armF: [40, 40], armB: [20, 40], inst: S(30, 40) }) },
      { p: P({ lean: -20, legF: [92, 0], legB: [-8, 4], armF: [-20, 40], armB: [-40, 30], inst: S(-40, -60), fx: FX.low }) },
      { p: P({ lean: -6, legF: [40, 50], legB: [-10, 6], armF: [30, 40], armB: [20, 40], inst: S(30, 40) }) },
    ];
    // rullata in corsa: le bacchette si alternano a tutta velocità
    A.ratk = [
      { p: P({ lean: 18, legF: [40, 30], legB: [-34, 20], armF: [60, 20], armB: [60, 20], inst: S(30, 30) }) },
      { p: P({ lean: 22, legF: [40, 30], legB: [-34, 20], armF: [120, -30], armB: [80, 6], inst: S(-40, 50), fx: FX.jab }) },
      { p: P({ lean: 22, legF: [40, 30], legB: [-34, 20], armF: [80, 6], armB: [120, -30], inst: S(50, -40), fx: FX.jab }) },
      { p: P({ lean: 14, legF: [30, 20], legB: [-26, 14], armF: [60, 20], armB: [55, 25], inst: S(40, 45) }) },
    ];
    A.jatk = [{ p: P({ air: true, lean: 18, legF: [50, 80], legB: [0, 50], armF: [120, -6], armB: [112, -4], inst: S(80, 86), fx: FXS.floor }) }];
    A.rjatk = [{ p: P({ air: true, lean: 30, legF: [30, 40], legB: [-20, 40], armF: [100, 0], armB: [94, 2], inst: S(10, 16), fx: FX.jab }) }];
  },

  // ---------------- MARVIN: accordi, glissando e tastierata ----------------
  marvin(A) {
    const H = (a, extra) => Object.assign({ m: 'hand', h: 'F', a, g: 'end' }, extra || {});
    A.l1 = [   // pugno ad accordo (le dita tese come su un accordo)
      { p: P({ lean: 2, legF: [14, 8], legB: [-14, 6], armF: [24, 66], armB: [140, -60] }) },
      { p: P({ lean: 14, legF: [22, 8], legB: [-18, 4], armF: [24, 66], armB: [90, 6], fx: FX.jab }) },
      { p: P({ lean: 8, legF: [16, 6], legB: [-14, 4], armF: [24, 66], armB: [60, 30] }) },
    ];
    A.l2 = [   // tastierata di rovescio
      { p: P({ lean: -6, legF: [12, 8], legB: [-14, 6], armF: [-60, 30], armB: [-40, 30], inst: H(-170, { behind: true }) }) },
      { p: P({ lean: 14, legF: [24, 8], legB: [-20, 4], armF: [90, 6], armB: [80, 14], inst: H(6), fx: FX.wide }) },
      { p: P({ lean: 8, legF: [18, 8], legB: [-14, 6], armF: [70, 16], armB: [60, 25], inst: H(20) }) },
    ];
    // GLISSANDO: la mano scorre sui tasti, la tastiera spazza tre volte
    const G = (u, k) => P({ lean: 10, legF: [22, 8], legB: [-18, 4], armF: [24, 66], armB: [60 + u, 20 - u * 0.3], inst: { m: 'worn' }, fx: k ? FX.jab : null });
    A.l3 = [{ p: G(-30, 0) }, { p: G(0, 1) }, { p: G(25, 1) }, { p: G(50, 1) }, { p: G(20, 0) }];
    A.l4 = [   // ACCORDO FINALE: tastiera schiacciata dall'alto
      { p: P({ lean: -12, legF: [16, 10], legB: [-14, 8], armF: [174, -8], armB: [162, -8], inst: H(-100, { behind: true }) }) },
      { p: P({ lean: 26, legF: [28, 12], legB: [-24, 6], armF: [100, 6], armB: [94, 8], inst: H(60), fx: FX.over }) },
      { p: P({ lean: 20, legF: [24, 10], legB: [-18, 6], armF: [84, 12], armB: [78, 14], inst: H(72) }) },
    ];
    // SFORZANDO: la tastiera puntata avanti, l'accordo d'organo parte come un'onda
    A.heavy = [
      { p: P({ lean: -10, legF: [14, 10], legB: [-16, 8], armF: [40, 60], armB: [30, 60], inst: H(-30) }) },
      { p: P({ lean: 18, legF: [28, 8], legB: [-24, 4], armF: [88, 0], armB: [84, 4], inst: H(-4), fx: FX.stab }) },
      { p: P({ lean: 10, legF: [22, 8], legB: [-18, 4], armF: [80, 10], armB: [74, 12], inst: H(2) }) },
    ];
    // glissando in corsa
    A.ratk = [
      { p: P({ lean: 20, legF: [40, 30], legB: [-34, 20], armF: [80, 6], armB: [60, 20], inst: H(-4) }) },
      { p: P({ lean: 24, legF: [40, 30], legB: [-34, 20], armF: [86, 2], armB: [90, 0], inst: H(-2), fx: FX.stab }) },
      { p: P({ lean: 24, legF: [40, 30], legB: [-34, 20], armF: [86, 2], armB: [110, -10], inst: H(-2), fx: FX.jab }) },
      { p: P({ lean: 14, legF: [30, 20], legB: [-26, 14], armF: [70, 14], armB: [60, 25], inst: H(10) }) },
    ];
    // gomitata in picchiata, tastiera a tracolla
    A.jatk = [{ p: P({ air: true, lean: 30, legF: [40, 80], legB: [0, 60], armF: [120, -110], armB: [60, 40], inst: { m: 'worn' }, fx: FXS.floor }) }];
    A.rjatk = [{ p: P({ air: true, lean: 36, legF: [80, 110], legB: [-10, 40], armF: [96, 0], armB: [90, 2], inst: H(4), fx: FX.stab }) }];
  },
};

// ---------- dati dei colpi (hitbox in unità di base, come in makeMoves) ----------
const CHAR_MOVES = {
  arrigo(M, { f, R, sw, S_ }) {
    Object.assign(M.l1, { note: 0 });
    Object.assign(M.l2, { fr: [f(5), 3, f(10)], hb: S_({ x0: 4, x1: 24 + sw * 0.7 + R * 2, y0: 26, y1: 50 }), note: 1 });
    Object.assign(M.l3, { fr: [f(6), 4, f(12)], hb: S_({ x0: 0, x1: 16 + sw * 0.7 + R * 2, y0: 8, y1: 40 }), stun: 22, note: 2 });
    Object.assign(M.l4, { dmg: 10, note: 3 });
    M.heavy = { anim: 'lasso', fr: [f(9), 16, f(16)], dmg: 6, multi: 2, last: { dmg: 7, knock: 'down', launch: 1.2, hsA: TUNE.hsHeavy, hsV: 10, shake: 2 }, spin: 4, hb: S_({ x0: -(30 + R * 2), x1: 30 + R * 2, y0: 30, y1: 62 }), knock: 'light', stun: 20, push: 1.4, zTol: 16, snd: 'lasso', sfx: 'swingBig', meter: 6, note: 3 };
    Object.assign(M.ratk, { fr: [3, 12, f(16)], dash: 1.1, dmg: 9, hb: S_({ x0: 0, x1: 30 + sw * 0.5 + R * 2, y0: 24, y1: 52 }), note: 2 });
    Object.assign(M.jatk, { dmg: 9, hb: S_({ x0: -14, x1: 22, y0: -16, y1: 30 }), note: 1 });
    Object.assign(M.rjatk, { anim: 'rjatk', note: 3 });
  },
  mike(M, { f, R, sw, S_ }) {
    M.l1 = { anim: 'l1', fr: [f(6), 4, f(12)], dmg: 6, hb: S_({ x0: 2, x1: 26 + R * 2, y0: 20, y1: 54 }), knock: 'light', stun: 20, push: 1.6, next: 'l2', sfx: 'swing', note: 0 };
    M.l2 = { anim: 'l2', fr: [f(6), 4, f(12)], dmg: 6, hb: S_({ x0: 2, x1: 22 + sw * 0.6 + R * 2, y0: 30, y1: 56 }), knock: 'light', stun: 22, push: 1.8, next: 'l3', sfx: 'swing', note: 1 };
    M.l3 = { anim: 'l3', fr: [f(11), 5, f(22)], dmg: 12, hb: S_({ x0: -2, x1: 20 + sw * 0.8 + R * 2, y0: 0, y1: 62 }), knock: 'down', launch: 1.3, hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 3, sfx: 'swingBig', meter: 7, note: 2, shock: { dmg: 7, speed: 5, col: '#ffe08a', dx: 40, dust: 10 } };
    M.l4 = Object.assign({}, M.l3);
    M.heavy = { anim: 'heavy', fr: [f(10), 10, f(20)], cycle: 3, dmg: 8, hb: S_({ x0: -4, x1: 24 + sw * 0.6 + R * 2, y0: 20, y1: 70 }), knock: 'down', hsA: TUNE.hsHeavy, hsV: 10, shake: 2, sfx: 'swingBig', meter: 6, snd: 'windmill', note: 0, shock: { dmg: 8, speed: 6, col: '#ff9a3a', dx: 30 } };
    Object.assign(M.ratk, { fr: [3, 16, f(18)], dash: 1.15, fric: 0.95, armor: true, dmg: 11, launch: 1.3, hb: S_({ x0: 0, x1: 26 + R * 2, y0: 16, y1: 56 }), note: 0 });
    Object.assign(M.jatk, { dmg: 10, note: 2 });
    Object.assign(M.rjatk, { anim: 'rjatk', dmg: 14, launch: 1.4, note: 2 });
  },
  danny(M, { f, R, sw, S_ }) {
    const J = (anim, n, dmg, fr, hb, next, o) => Object.assign({ anim, fr, dmg, hb: S_(hb), knock: 'light', stun: 14, push: 0.6, next, sfx: 'swing', note: n, meter: 2.6 }, o || {});
    M.l1 = J('l1', 0, 3, [f(3), 2, f(7)], { x0: 4, x1: 24 + R * 2, y0: 30, y1: 52 }, 'l2');
    M.l2 = J('l2', 1, 3, [f(3), 2, f(7)], { x0: 4, x1: 24 + R * 2, y0: 30, y1: 52 }, 'l3');
    M.l3 = J('l3', 2, 3, [f(3), 3, f(8)], { x0: 4, x1: 20 + sw * 0.6 + R * 2, y0: 28, y1: 52 }, 'l4');
    M.l4 = J('l4', 3, 5, [f(4), 3, f(9)], { x0: 4, x1: 26 + R * 2, y0: 14, y1: 44 }, 'l5', { stun: 16 });
    M.l5 = J('l5', 4, 9, [f(6), 5, f(16)], { x0: -12, x1: 22 + sw * 0.7 + R * 2, y0: 10, y1: 58 }, null, { knock: 'down', launch: 1.25, spin: 3, hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 2, sfx: 'swingBig', meter: 6 });
    M.heavy = { anim: 'heavy', fr: [f(5), 14, f(14)], dash: 0.9, fric: 0.97, dmg: 4, multi: 2, last: { dmg: 6, knock: 'down', hsA: TUNE.hsHeavy, hsV: 10 }, hb: S_({ x0: 0, x1: 30 + R * 2, y0: 4, y1: 34 }), knock: 'light', stun: 18, push: 1, sfx: 'swingBig', meter: 6, note: 2 };
    Object.assign(M.ratk, { fr: [2, 20, f(14)], dash: 1.15, fric: 0.955, dmg: 8, hb: S_({ x0: -4, x1: 30 + R * 2, y0: 0, y1: 30 }), zTol: 14, note: 4 });
    Object.assign(M.jatk, { dmg: 5, knock: 'light', stun: 16, rehit: 10, last: { dmg: 6, knock: 'down' }, note: 2 });
    Object.assign(M.rjatk, { anim: 'rjatk', hb: S_({ x0: -22, x1: 26 + R * 2, y0: -6, y1: 44 }), note: 4 });
  },
  mario(M, { f, R, sw, S_ }) {
    M.l1 = { anim: 'l1', fr: [f(5), 3, f(10)], dmg: 4, hb: S_({ x0: 6, x1: 26 + sw * 0.9 + R * 2, y0: 32, y1: 54 }), knock: 'light', stun: 17, push: 1, next: 'l2', sfx: 'swing', note: 0 };
    M.l2 = { anim: 'l2', fr: [f(5), 3, f(10)], dmg: 4, hb: S_({ x0: 4, x1: 24 + sw * 0.8 + R * 2, y0: 40, y1: 70 }), knock: 'light', stun: 18, push: 1.1, next: 'l3', sfx: 'swing', note: 1 };
    M.l3 = { anim: 'l3', fr: [f(7), 5, f(14)], dmg: 6, hb: S_({ x0: -18, x1: 22 + sw * 0.9 + R * 2, y0: 14, y1: 46 }), knock: 'light', stun: 22, push: 1.6, next: 'l4', sfx: 'swingBig', note: 2 };
    M.l4 = { anim: 'l4', fr: [f(8), 8, f(20)], dmg: 9, spin: 4, hb: S_({ x0: -(20 + sw * 0.8 + R * 2), x1: 20 + sw * 0.8 + R * 2, y0: 16, y1: 56 }), knock: 'down', launch: 1.2, zTol: 14, hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 2, sfx: 'swingBig', meter: 6, note: 3 };
    M.heavy = { anim: 'heavy', fr: [f(8), 10, f(18)], dmg: 5, multi: 2, last: { dmg: 8, knock: 'down', launch: 1.35, hsA: TUNE.hsHeavy, hsV: 10, shake: 2 }, hb: S_({ x0: 2, x1: 28 + R * 2, y0: 30, y1: 60 }), knock: 'light', stun: 20, push: 0.8, snd: 'slap', sfx: 'swing', meter: 6, note: 0 };
    Object.assign(M.ratk, { fr: [3, 12, f(16)], dash: 0.9, dmg: 8, hb: S_({ x0: -6, x1: 26 + sw * 0.8 + R * 2, y0: 0, y1: 24 }), zTol: 14, note: 2 });
    Object.assign(M.jatk, { hb: S_({ x0: -26, x1: 26 + R * 2 + sw * 0.4, y0: -6, y1: 40 }), note: 3 });
    Object.assign(M.rjatk, { anim: 'rjatk', hb: S_({ x0: -4, x1: 30 + sw * 0.8 + R * 2, y0: -8, y1: 40 }), note: 3 });
  },
  troy(M, { f, R, sw, S_ }) {
    const T = (anim, n, next) => ({ anim, fr: [f(2), 2, f(6)], dmg: 3, hb: S_({ x0: 4, x1: 24 + R * 2 + sw * 0.3, y0: 34, y1: 58 }), knock: 'light', stun: 14, push: 0.5, next, sfx: 'swing', note: n, meter: 2.2, hsA: 3, hsV: 5 });
    M.l1 = T('l1', 0, 'l2'); M.l2 = T('l2', 1, 'l3'); M.l3 = T('l3', 2, 'l4'); M.l4 = T('l4', 3, 'l5');
    M.l5 = Object.assign(T('l5', 4, 'l6'), { fr: [f(3), 3, f(8)], dmg: 4, stun: 18 });
    M.l6 = { anim: 'l6', fr: [f(6), 4, f(16)], dmg: 8, hb: S_({ x0: -2, x1: 24 + R * 2 + sw * 0.4, y0: 10, y1: 60 }), knock: 'down', hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 2, sfx: 'swingBig', meter: 6, note: 5 };
    M.heavy = { anim: 'heavy', fr: [f(7), 4, f(16)], dmg: 10, hb: S_({ x0: 4, x1: 30 + R * 2, y0: 10, y1: 40 }), knock: 'down', launch: 1.4, hsA: TUNE.hsHeavy, hsV: 10, shake: 2, sfx: 'swingBig', meter: 6, snd: 'kick' };
    Object.assign(M.ratk, { fr: [3, 15, f(14)], dash: 1.0, multi: 3, cycle: 3, dmg: 3, knock: 'light', stun: 16, push: 0.6, last: { dmg: 5, knock: 'down' }, hb: S_({ x0: 0, x1: 26 + R * 2, y0: 26, y1: 56 }), snd: 'roll', note: 0 });
    Object.assign(M.jatk, { note: 4 });
    Object.assign(M.rjatk, { anim: 'rjatk', note: 5 });
  },
  marvin(M, { f, R, sw, S_ }) {
    M.l1 = { anim: 'l1', fr: [f(5), 3, f(10)], dmg: 4, hb: S_({ x0: 4, x1: 24 + R * 2, y0: 34, y1: 60 }), knock: 'light', stun: 18, push: 1, next: 'l2', sfx: 'swing', note: 0 };
    M.l2 = { anim: 'l2', fr: [f(5), 3, f(11)], dmg: 4, hb: S_({ x0: 2, x1: 20 + sw * 0.7 + R * 2, y0: 24, y1: 56 }), knock: 'light', stun: 18, push: 1.2, next: 'l3', sfx: 'swing', note: 1 };
    M.l3 = { anim: 'l3', fr: [f(6), 9, f(14)], dmg: 2, multi: 3, last: { dmg: 3, stun: 22, push: 1.4 }, hb: S_({ x0: 0, x1: 22 + sw * 0.7 + R * 2, y0: 14, y1: 50 }), knock: 'light', stun: 18, push: 0.6, next: 'l4', sfx: 'swing', snd: 'gliss', note: 2 };
    M.l4 = { anim: 'l4', fr: [f(9), 4, f(20)], dmg: 9, hb: S_({ x0: -2, x1: 18 + sw * 0.8 + R * 2, y0: 6, y1: 62 }), knock: 'down', hsA: TUNE.hsFinA, hsV: TUNE.hsFinV, shake: 2, sfx: 'swingBig', meter: 6, note: 3 };
    M.heavy = { anim: 'heavy', fr: [f(11), 4, f(20)], dmg: 9, hb: S_({ x0: 4, x1: 26 + sw * 0.6 + R * 2, y0: 26, y1: 62 }), knock: 'down', hsA: TUNE.hsHeavy, hsV: 10, shake: 2, sfx: 'swingBig', meter: 6, snd: 'organ', shock: { dmg: 7, speed: 6, col: '#ffd23e', dx: 44 } };
    Object.assign(M.ratk, { fr: [3, 14, f(16)], dash: 1.0, multi: 2, cycle: 4, dmg: 5, knock: 'light', stun: 18, last: { dmg: 6, knock: 'down' }, hb: S_({ x0: 0, x1: 26 + sw * 0.5 + R * 2, y0: 24, y1: 56 }), snd: 'gliss', note: 0 });
    Object.assign(M.jatk, { dmg: 9, hb: S_({ x0: -6, x1: 20 + R * 2, y0: -12, y1: 36 }), note: 3 });
    Object.assign(M.rjatk, { anim: 'rjatk', note: 3 });
  },
};
// il colpo che chiude la combo (per le schede dei personaggi)
const CHAR_FINISHER = { arrigo: 'l4', mike: 'l3', danny: 'l5', mario: 'l4', troy: 'l6', marvin: 'l4' };
// descrizione per la scheda del personaggio (max 41 caratteri per riga)
const CHAR_STYLE = {
  arrigo: { hits: 4, heavy: 'LAZO', lines: ['FORTE: MICROFONO A LAZO, GIRO COMPLETO', 'CORSA: ASTA-LANCIA · VOLO: POGO'], sound: 'URLA INTONATE E LARSEN' },
  mike: { hits: 3, heavy: 'MULINELLO', lines: ['3 COLPI PESANTI, CHITARRA SPACCATA', 'FORTE: MULINELLO · CORSA: CARICA'], sound: 'SOLISTA: NOTE DISTORTE E TIRATE' },
  danny: { hits: 5, heavy: 'DUCK WALK', lines: ['5 COLPI RAPIDI CON GIRAVOLTA FINALE', 'FORTE: DUCK WALK · CORSA: IN GINOCCHIO'], sound: 'RITMICA: ACCORDI IN PENNATA' },
  mario: { hits: 4, heavy: 'SLAP&POP', lines: ['COLPI LUNGHI E GIRO DI BASSO A 360', 'FORTE: SLAP & POP · CORSA: SGAMBETTO'], sound: 'NOTE DI BASSO E SLAP' },
  troy: { hits: 6, heavy: 'CASSA', lines: ['6 COLPI A RAFFICA, PIATTO FINALE', 'FORTE: CALCIO DI CASSA · CORSA: RULLATA'], sound: 'RULLANTE, TOM E PIATTI' },
  marvin: { hits: 4, heavy: 'SFORZANDO', lines: ['GLISSANDO A 3 COLPI, ACCORDO FINALE', 'FORTE: ONDA SONORA · CORSA: GLISSANDO'], sound: 'ACCORDI DI PIANO E ORGANO' },
};
