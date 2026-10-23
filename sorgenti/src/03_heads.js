// ============================================================
// TESTE v3 (alta risoluzione): generate da parametri e campionate a RS pixel
// fini per unità. Vista di 3/4 rivolta a destra, luce dall'alto-avanti.
// Coordinate del viso in unità (0..28 x 0..36, come nella v2); la tela ha
// HEAD_TOP unità in più in alto per creste, cappelli e capigliature alte.
// ============================================================
const HEAD_TOP = 8;
const HEAD_W = 28, HEAD_H = 36 + HEAD_TOP, HEAD_AX = 12, HEAD_AY = 26 + HEAD_TOP;
const LIGHT = [0.55, -0.83];

const _toneCache = new Map();
function tones(hex) {
  let t = _toneCache.get(hex);
  if (t) return t;
  t = {
    L: col(mix(shade(hex, 1.22), '#fff4e0', 0.12)),
    M: col(hex),
    S: col(mix(shade(hex, 0.74), '#3a1a5a', 0.16)),
    D: col(mix(shade(hex, 0.5), '#1a0c2e', 0.28)),
    W: col(mix(hex, '#ffffff', 0.62)),
  };
  _toneCache.set(hex, t);
  return t;
}
function bandTone(T, s) { return s > 0.42 ? T.L : s > -0.18 ? T.M : s > -0.62 ? T.S : T.D; }
// come bandTone ma con retinatura a scacchiera vicino ai confini tra i toni (passaggi più morbidi)
function ditherTone(T, s, X, Y, th = [0.42, -0.18, -0.62], w = 0.07) {
  const ck = ((X + Y) & 1) ? w : -w;
  return bandTone2(T, s + ck, th);
}
function bandTone2(T, s, th) { return s > th[0] ? T.L : s > th[1] ? T.M : s > th[2] ? T.S : T.D; }

function inPoly(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
const FACE_POLY = [[6, 6], [8, 4], [12, 3], [15, 4], [17, 6], [18, 8], [19, 11], [19, 13], [20, 14], [21, 16], [20.5, 17], [19.4, 17.4], [19.4, 18.6], [19.4, 19.4], [18.6, 20.4], [18.6, 21.4], [17.6, 22.4], [16.4, 23.4], [14, 24.4], [11, 24.4], [8.6, 23.4], [7, 21.4], [6, 19.4], [5, 16], [4, 13], [4, 9]];
const _hh = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function buildHead(sp) {
  const pb = new PixBuf(HEAD_W, HEAD_H, RS), S = RS, TOPF = HEAD_TOP * S;
  const C_ = h => col(h);
  const skinHex = sp.skin;
  const SK = tones(skinHex);
  const H = sp.hair ? tones(sp.hair.col) : null;
  const HH = sp.hair && sp.hair.hi ? col(sp.hair.hi) : (H ? H.W : 0);
  const B = sp.beard ? tones(sp.beard.col) : null;
  const BH = sp.beard && sp.beard.hi ? col(sp.beard.hi) : null;
  // ogni pixel fine dell'area (in coordinate del viso); fn(x, y, X, Y) con x, y = centro continuo
  const each = (x0, y0, x1, y1, fn) => {
    const Ya = Math.max(-TOPF, Math.floor(y0 * S)), Yb = Math.min(pb.H - TOPF, Math.ceil(y1 * S));
    const Xa = Math.max(0, Math.floor(x0 * S)), Xb = Math.min(pb.W, Math.ceil(x1 * S));
    for (let Y = Ya; Y < Yb; Y++) for (let X = Xa; X < Xb; X++) { const c = fn((X + 0.5) / S, (Y + 0.5) / S, X, Y); if (c) pb.setHi(X, Y + TOPF, c); }
  };
  const px = (x, y, c) => { if (c) pb.setHi(Math.floor(x * S), Math.floor(y * S) + TOPF, c); };
  const get = (x, y) => pb.getHi(Math.floor(x * S), Math.floor(y * S) + TOPF);
  const box = (x, y, w, h, c) => each(x, y, x + w, y + h, () => c);
  const inFace = (x, y) => inPoly(x, y, FACE_POLY);
  const skinTone = (x, y, X, Y) => {
    const dx = (x - 12.5) / 8, dy = (y - 13.5) / 11;
    let s = dx * 0.55 - dy * 0.42;
    if (y > 22.5 && x < 16.5) s -= 0.45;
    if (x <= 6.5) s -= 0.3;
    if (sp.face === 'zombie' && _hh(X, Y) < 0.08) s -= 0.5;
    return ditherTone(SK, s, X, Y, [0.42, -0.48, -0.85], 0.025);
  };
  const hairT = (s, X, Y) => ditherTone(H, s, X, Y, [0.42, -0.18, -0.62], 0.08);
  const shadeAt = (x, y, cx = 12.5, cy = 10.5, k = 9) => ((x - cx) / k) * 0.55 - ((y - cy) / k) * 0.8;
  const hs = sp.hair ? sp.hair.style : null;

  // ---------------- capelli dietro la testa (lunghi, coda, parrucca) ----------------
  if (hs === 'long') {
    each(1, 2, 14, 34, (x, y, X, Y) => {
      const edge = 2.2 + Math.sin(y * 0.55) * 0.8 + (y > 22 ? (y - 22) * 0.12 : 0);
      if (x < edge || x > 13.5 - Math.max(0, y - 26) * 0.35) return 0;
      if (y < 4 && Math.hypot(x - 10, y - 9) > 8.5) return 0;
      const strand = ((X * 3 + Math.floor(Y / 4)) % 9 < 1) ? 0.45 : 0;
      return hairT(shadeAt(x, y, 9, 10, 12) - 0.35 + strand + (_hh(X, Y >> 2) - 0.5) * 0.25, X, Y);
    });
  }
  if (hs === 'ponytail' || hs === 'wig') {
    const tail = hs === 'wig' ? [[4, 9], [1.5, 12], [1, 18], [2.4, 22], [4.6, 19], [5.2, 13]] : [[4, 8], [0.6, 11], [0.2, 19], [1.6, 25], [3.6, 20], [5, 12]];
    each(0, 7, 7, 26, (x, y, X, Y) => inPoly(x, y, tail) ? hairT(shadeAt(x, y, 3, 12, 6) - 0.2 + (((X + Y * 2) % 7 < 1) ? 0.45 : 0), X, Y) : 0);
    if (hs === 'wig') { const bow = tones('#1a1a24'); each(1.5, 11, 6, 14.5, (x, y) => (Math.abs(x - 3.7) * 0.8 + Math.abs(y - 12.6) * 1.2 < 2.2) ? (y < 12.4 ? bow.L : bow.M) : 0); }
  }

  // ---------------- collo ----------------
  const nk = sp.thickNeck ? 2 : 0;
  each(8 - nk, 20, 15 + nk, 30, (x, y, X, Y) => {
    if (y > 28 && (x < 9 - nk || x > 14 + nk)) return 0;
    return x < 10 ? SK.D : x < 13 ? SK.S : SK.M;
  });
  // ---------------- viso e cranio ----------------
  each(3, 2, 22, 25, (x, y, X, Y) => inFace(x, y) ? skinTone(x, y, X, Y) : 0);
  // guancia e mandibola: un filo d'ombra fine sotto lo zigomo
  each(13, 18.6, 18, 19.2, (x, y) => inFace(x, y) && x > 13.5 && x < 17.2 ? SK.S : 0);
  // orecchio
  each(8, 13, 12, 19.5, (x, y) => {
    const d = ((x - 10) / 1.7) ** 2 + ((y - 16) / 2.6) ** 2;
    if (d > 1) return 0;
    if (d < 0.22) return SK.S;
    if (d < 0.5 && x > 10 && y > 14.5) return SK.S;
    if (d > 0.72 && x < 9.6) return SK.D;
    return x > 9.5 ? SK.M : SK.S;
  });
  if (sp.earring) px(9.75, 18.75, C_(sp.earring)), px(10.25, 18.75, C_(sp.earring)), px(9.75, 19.25, C_('#fff4c0'));

  // ---------------- trucco / maschere sul viso ----------------
  if (sp.face === 'corpse') {
    const W1 = C_('#eeeae2'), W2 = C_('#c9c4bc'), K = C_('#0c0a10');
    each(4, 3, 22, 25, (x, y, X, Y) => inFace(x, y) && !(Math.hypot(x - 10, y - 16) < 2.6) ? (x - y * 0.3 > 4 ? W1 : W2) : 0);
    each(14, 11, 21, 16.4, (x, y) => (Math.abs(x - 17.2) < 2.4 - (y - 13.5) * 0.25 && y > 11.5) ? K : 0);
    each(15.5, 19.6, 19, 24, (x, y) => (Math.abs(x - 17.2) < 0.5 || (y < 20.4 && Math.abs(x - 17.2) < 1.6)) ? K : 0);
  }
  if (sp.face === 'skull') {
    const W1 = C_('#efe9dc'), W2 = C_('#c6bfae'), K = C_('#0c0a10');
    each(4, 2, 22, 25, (x, y, X, Y) => inFace(x, y) && !(Math.hypot(x - 10, y - 16) < 2.4) ? (shadeAt(x, y, 13, 12, 8) > -0.2 ? W1 : W2) : 0);
    each(14, 11.5, 20, 16, (x, y) => Math.hypot((x - 17) / 1.4, (y - 13.8) / 1.25) < 1.2 ? K : 0);
    each(19.4, 16, 21, 18, (x, y) => (y > 16.4 && x > 19.6 && x < 20.6) ? K : 0);
    each(14.5, 19.4, 19.5, 22.6, (x, y, X) => (y < 19.9 || y > 22.1 || (X % 3 === 0)) ? K : (y < 21 ? W1 : W2));
  }

  if (sp.face === 'halfmask') {
    const W1 = C_('#f4f2ea'), W2 = C_('#c9c4bc');
    each(14.6, 9.5, 22, 19, (x, y) => inFace(x, y) && x > 15 + (y - 9.5) * 0.08 && y < 18.6 ? (x > 18.5 ? W1 : W2) : 0);
  }
  if (sp.face === 'mannequin') {
    each(4, 3, 22, 25, (x, y, X, Y) => inFace(x, y) ? ditherTone(SK, ((x - 12.5) / 8) * 0.6 - ((y - 13.5) / 11) * 0.5, X, Y, [0.3, -0.4, -0.8], 0.03) : 0);
  }
  if (sp.face === 'shadow') {
    const K1 = C_('#1a1226'), K2 = C_('#2a2040');
    each(3, 2, 22, 25, (x, y, X, Y) => inFace(x, y) ? (((X + Y) & 1) && x > 14 ? K2 : K1) : 0);
    box(16, 13.5, 2, 1, C_(sp.eyeGlow || '#ff3040')); box(19, 13.5, 1, 1, C_(sp.eyeGlow || '#ff3040'));
  }
  // ---------------- naso, bocca, occhi ----------------
  if (sp.face !== 'skull' && sp.face !== 'mannequin' && sp.face !== 'shadow') {
    px(20.25, 15.25, SK.L); px(20.75, 15.25, SK.L); px(20.25, 15.75, SK.L);
    each(18.6, 13.2, 19.2, 16.6, (x, y) => (y > 13.8 && inFace(x, y)) ? SK.S : 0);
    px(19.75, 17.25, SK.D); px(20.25, 17.25, SK.D); px(19.25, 17.75, SK.S); px(19.75, 17.75, SK.S);
    const lip = C_(mix(skinHex, '#9a3a3a', 0.35));
    if (sp.smile || sp.grin) {
      px(16.25, 19.75, SK.D); px(16.75, 20.25, SK.D);
      box(17, 20, 2, 0.5, C_('#ffffff')); if (sp.grin) { box(16.5, 20, 3, 1, C_('#f4f0e2')); for (let k = 0; k < 6; k++) px(16.75 + k * 0.5, 20.75, k % 2 ? C_('#b8b0a0') : 0); }
      box(17, 20.5, 2, 0.5, SK.D); px(19.25, 19.75, SK.D);
      box(17, 21, 1.5, 0.5, lip);
    } else {
      box(16.5, 20, 2.5, 0.5, SK.D); px(16.25, 20.25, SK.S);
      box(17, 20.5, 1.5, 0.5, lip);
    }
    if (sp.face === 'zombie') { box(16.5, 20, 2.5, 1, C_('#1a0a10')); for (let k = 0; k < 4; k++) px(16.75 + k * 0.6, 20.25, C_('#e8e0c0')); }
  }
  const eyeWhite = C_(sp.face === 'zombie' ? '#d8e0b0' : '#ffffff'), pupil = C_(sp.eyeCol || '#1a1018');
  if (!sp.glasses && sp.face !== 'skull' && sp.face !== 'corpse' && sp.face !== 'mannequin' && sp.face !== 'shadow') {
    const brow = sp.brow ? C_(sp.brow) : SK.D;
    // occhio vicino: palpebra, bianco, iride, riflesso
    box(15.75, 13, 2.75, 0.5, SK.D);
    box(16, 13.5, 2, 1, eyeWhite);
    if (sp.face !== 'zombie') { box(17, 13.5, 1, 1, pupil); px(17.25, 13.75, C_('#ffffff')); }
    else px(17.25, 14.25, C_('#5a2a2a'));
    box(16, 14.5, 2, 0.5, SK.S);
    // occhio lontano, più stretto
    box(19, 13.5, 1, 1, eyeWhite); if (sp.face !== 'zombie') box(19.5, 13.5, 0.5, 1, pupil);
    box(19, 13, 1, 0.5, SK.D);
    // sopracciglia leggermente arcuate
    each(15, 11.6, 19, 12.8, (x, y) => (y > 11.9 - (x > 17 ? 0 : (17 - x) * 0.15) && y < 12.6 - (x > 17 ? 0 : (17 - x) * 0.15)) ? brow : 0);
    box(19.25, 12, 0.75, 0.5, brow);
    if (sp.eyeGlow) { box(16, 13.5, 2, 1, C_(sp.eyeGlow)); box(19, 13.5, 1, 1, C_(sp.eyeGlow)); }
  }
  if (sp.scar) { for (let k = 0; k < 6; k++) px(15 + k * 0.5, 15 + k * 0.6, C_('#8a3030')); }
  if (sp.face === 'zombie') { for (let k = 0; k < 5; k++) { px(8 + k * 0.6, 8 + k * 0.2, C_('#3a1a1a')); px(8.25 + k * 0.6, 7.6 + k * 0.2, C_('#d8d0c0')); } }

  // ---------------- capelli ----------------
  const curl = (cx, cy, r, base = 0, rough = 0.8, light = true) => {
    each(cx - r - 0.5, cy - r - 0.5, cx + r + 0.5, cy + r + 0.5, (x, y, X, Y) => {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d > r) return 0;
      if (sp.faceClear && x >= 17 && y >= 9) return 0;
      if (sp.faceClear && x >= 15 && y >= 11) return 0;
      const local = (dx * 0.6 - dy * 0.8) / r + base;
      let c = hairT(local, X, Y);
      const a = Math.atan2(dy, dx);
      if (light && d > r * 0.38 && d < r * 0.62 && a > -2.7 && a < -0.7) c = HH || H.L;
      if (d > r - rough && local < 0.1) c = H.D;
      return c;
    });
  };
  if (hs === 'curlyBig') {
    // grande massa di ricci stretti (Arrigo): base scura + tanti piccoli ricci
    sp.faceClear = true;
    const inMass = (x, y) => {
      if (x >= 16.5 && y >= 9) return false;
      if (x >= 14.5 && y >= 11) return false;
      return Math.hypot((x - 11) / 10.4, (y - 8.6) / 10.6) < 1 || Math.hypot((x - 5) / 4.6, (y - 17) / 5.4) < 1;
    };
    each(0, -3, 23, 24, (x, y, X, Y) => inMass(x, y) && !(inFace(x, y) && x > 12 && y > 8) ? hairT(shadeAt(x, y, 11, 6, 11) - 0.45 + (_hh(X >> 1, Y >> 1) - 0.5) * 0.3, X, Y) : 0);
    const curls = [];
    for (let gy = -1.5, row = 0; gy < 23; gy += 2.3, row++) for (let gx = 0.5 + (row % 2) * 1.3; gx < 22.5; gx += 2.6) {
      const jx = (_hh(row * 7 + 1, Math.round(gx * 3)) - 0.5) * 1.2, jy = (_hh(Math.round(gx * 5), row * 3 + 2) - 0.5) * 1.0;
      if (inMass(gx + jx, gy + jy)) curls.push([gx + jx, gy + jy, 1.75 + _hh(row, Math.round(gx)) * 0.7]);
    }
    for (const [cx, cy, r] of curls) {
      each(cx - r - 0.5, cy - r - 0.5, cx + r + 0.5, cy + r + 0.5, (x, y, X, Y) => {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d > r || !inMass(x, y)) return 0;
        const local = (dx * 0.6 - dy * 0.8) / r;
        const a = Math.atan2(dy, dx);
        if (d > r * 0.45 && d < r * 0.75 && a > -2.6 && a < -0.9) return HH;
        if (d > r - 0.5 && local < 0.2) return H.D;
        return hairT(local * 0.8 - 0.1, X, Y);
      });
    }
  } else if (hs === 'baldSides') {
    // cranio lucido + ricci ai lati con punte chiare (Mike)
    each(11.5, 4, 17.5, 7.5, (x, y) => { const d = ((x - 14.6) / 2.4) ** 2 + ((y - 5.6) / 1.1) ** 2; return d < 0.35 ? SK.W : d < 1 ? SK.L : 0; });
    const curls = [[5.5, 12.5], [4.5, 15.5], [6.5, 17.5], [7.5, 10.5], [3.5, 12.5], [6.5, 14.5], [8.5, 17.5], [4.2, 9.8]];
    for (const [cx, cy] of curls) {
      each(cx - 2.4, cy - 2.4, cx + 2.4, cy + 2.4, (x, y, X, Y) => {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d > 2.3) return 0;
        const local = (dx * 0.6 - dy * 0.8) / 2.3;
        if (local > 0.5) return HH;
        if (d > 1.7 && local < -0.1) return H.D;
        return local > 0.1 ? H.M : local > -0.35 ? H.S : H.D;
      });
    }
  } else if (hs === 'sidePart' || hs === 'curlyTied' || hs === 'slicked' || hs === 'quiff' || hs === 'pompadour' || hs === 'mohawk' || hs === 'bob' || hs === 'spiky' || hs === 'long' || hs === 'ponytail' || hs === 'wig' || hs === 'bandana') {
    const hl = x => {
      if (hs === 'slicked' || hs === 'pompadour' || hs === 'ponytail' || hs === 'wig') return x <= 9 ? 19 - (x - 4) * 1.4 : x <= 15 ? 12 - (x - 9) * 1.0 : 5.5;
      if (hs === 'quiff' || hs === 'mohawk') return x <= 9 ? 15 - (x - 4) * 1.0 : x <= 16 ? 10.5 - (x - 9) * 0.45 : 7;
      if (hs === 'bob') return x <= 15 ? 24 : x <= 17 ? 10 : 9;
      if (hs === 'long') return x <= 10 ? 24 : x <= 16 ? 10.5 - (x - 10) * 0.4 : 7.5;
      return x <= 9 ? 19 - (x - 4) * 1.6 : x <= 16 ? 11 - (x - 9) * 0.5 : 7.5;
    };
    each(0, -2, HEAD_W, 26, (x, y, X, Y) => {
      const inside = inFace(x, y) || (hs !== 'quiff' && hs !== 'mohawk' && Math.hypot(x - 11.5, y - 9) < 9.2 && x < 18 && y < 14) || (hs === 'bob' && x > 3.5 && x < 16.5 && y < 24.5 && Math.hypot((x - 10.5) / 7.4, (y - 12) / 12.4) < 1);
      if (!inside || y - 0.5 >= hl(x - 0.5)) return 0;
      if ((hs === 'quiff' || hs === 'mohawk') && x < 13.5 && y > 6.5) { // lati rasati
        return _hh(X, Y) < 0.35 ? H.S : C_(mix(sp.hair.col, skinHex, 0.5));
      }
      if (hs === 'mohawk' && y > 3 && x > 13.5) return C_(mix(sp.hair.col, skinHex, 0.5));
      let tex = 0;
      const n = _hh(X, Y);
      if (hs === 'curlyTied') tex = (n - 0.5) * 0.7;
      if (hs === 'slicked' || hs === 'pompadour' || hs === 'ponytail' || hs === 'wig') tex = ((X + Y * 2) % 12 < 2) ? 0.45 : (n - 0.5) * 0.15;
      if (hs === 'sidePart' || hs === 'bob' || hs === 'spiky' || hs === 'long' || hs === 'bandana') tex = (n - 0.5) * 0.35 + (((X * 2 + Y) % 11) < 1 ? 0.35 : 0);
      if (hs === 'quiff') tex = (n - 0.5) * 0.3;
      return hairT(shadeAt(x, y) - 0.25 + tex, X, Y);
    });
    if (hs === 'sidePart') { each(10.5, 3.6, 17.2, 4.4, (x, y) => y > 3.9 - (x - 10.5) * 0.04 ? H.L : 0); px(17.25, 5.25, H.M); px(17.25, 6.25, H.M); px(16.25, 3.25, H.M); }
    if (hs === 'slicked' || hs === 'ponytail') { for (let x = 7; x <= 14.5; x += 0.5) px(x, 3.2 + Math.sin(x * 2.1) * 0.4, H.L); for (let x = 6; x <= 12; x += 0.5) px(x, 5.6 + Math.sin(x * 1.7) * 0.4, H.L); }
    if (hs === 'curlyTied') {
      // ricci spettinati sopra e chignon sulla nuca (Mario)
      for (const [cx, cy] of [[9.5, 2.5], [12.5, 1.5], [15.5, 2.5], [7.5, 3.5], [17.5, 4.5], [11, 3.6], [14, 3.8]]) curl(cx, cy, 1.95, -0.05, 0.55);
      for (const [cx, cy] of [[3.5, 10.5], [2.6, 8.8], [4.4, 12.2]]) curl(cx, cy, 2.1, -0.15, 0.6);
      box(5, 9, 1, 2, C_('#c9202f')); box(5, 9, 0.5, 2, C_('#ff5a5a'));
    }
    if (hs === 'quiff' || hs === 'pompadour') {
      // ciuffo alzato sulla fronte
      const Q = hs === 'quiff' ? [[11, 6], [13, 2], [16, 0], [19, 1], [20, 3], [19, 6], [17, 7], [14, 8]] : [[8, 5], [10, 0], [14, -2.6], [19, -2.2], [22.4, 0.6], [21.6, 3.6], [19, 5.6], [15, 6.6], [11, 7]];
      each(7, -3, 23, 10, (x, y, X, Y) => inPoly(x, y, Q) ? hairT(shadeAt(x, y, 16, 1, 6) - 0.1 + (((X + Y) % 8 < 1) ? 0.55 : 0), X, Y) : 0);
      if (hs === 'pompadour') for (let x = 12; x < 20; x += 0.5) px(x, -0.4 + (x - 16) ** 2 * 0.05, HH || H.W);
    }
    if (hs === 'mohawk') {
      // cresta a punte
      const spikes = [[8, 3], [10, 1], [12.5, 0], [15, 0.6], [17.4, 2.2]];
      for (const [bx, by] of spikes) {
        const tipX = bx - 1.6, tipY = by - 7.5;
        each(bx - 4, tipY, bx + 2.5, by + 1.5, (x, y, X, Y) => {
          const t = (y - tipY) / (by + 1 - tipY); if (t < 0 || t > 1) return 0;
          const cx = tipX + (bx - tipX) * t, hw = 1.7 * t;
          if (Math.abs(x - cx) > hw) return 0;
          return hairT(0.5 - (x - cx < 0 ? 0.6 : 0) - t * 0.4, X, Y);
        });
      }
    }
    if (hs === 'spiky') {
      for (const [bx, by, ang] of [[7, 5, -2.4], [10, 3, -1.9], [13, 2.6, -1.4], [16, 3.4, -1.0], [18.4, 6, -0.5], [5.4, 8, -2.8]]) {
        const tx = bx + Math.cos(ang) * 5, ty = by + Math.sin(ang) * 5;
        each(Math.min(bx, tx) - 2, Math.min(by, ty) - 2, Math.max(bx, tx) + 2, Math.max(by, ty) + 2, (x, y, X, Y) => {
          const vx = tx - bx, vy = ty - by, L2 = vx * vx + vy * vy; let t = ((x - bx) * vx + (y - by) * vy) / L2; if (t < 0 || t > 1) return 0;
          const d = Math.abs((x - bx) * vy - (y - by) * vx) / Math.sqrt(L2); if (d > 1.6 * (1 - t)) return 0;
          return hairT(0.3 - t * 0.2 + ((x - bx) * vy - (y - by) * vx > 0 ? 0.3 : -0.4), X, Y);
        });
      }
    }
    if (hs === 'bandana') {
      const BT = tones(sp.bandCol || '#c42032');
      each(4, 5, 20, 9.2, (x, y, X, Y) => (get(x, y) && y > 5.6 + (x - 4) * 0.05 && y < 8.8 + (x - 4) * 0.02) ? ((((X >> 1) + (Y >> 1)) % 5 === 0) ? C_('#ffffff') : (y < 6.6 ? BT.L : BT.M)) : 0);
      each(0.5, 7, 5, 13, (x, y) => (Math.abs(x - 3) < 1.8 - Math.abs(y - 9) * 0.25 && y < 12.5) ? (x < 3 ? BT.S : BT.M) : 0);
    }
  } else if (hs === 'feather') {
    // capelli cotonati anni '70 con fascia (pattinatori)
    each(0, 0, HEAD_W, 26, (x, y, X, Y) => {
      const e = ((x - 10.5) / 9.6) ** 2 + ((y - 9) / 8.6) ** 2;
      const back = x < 10.5 && y >= 9.5 && y < 23.5 && x > 1.5 + (y - 9.5) * 0.12;
      if (!(e <= 1 || back)) return 0;
      if (inFace(x, y) && x >= 13.5 && y >= 9.5) return 0;
      if (x >= 16.5 && y >= 8.5) return 0;
      const n = _hh(X, Y);
      const streak = ((X * 2 + Y * 3) % 13 < 2) ? 0.5 : 0;
      return hairT(shadeAt(x, y, 11.5, 8.5, 10) - 0.15 + streak + (n - 0.5) * 0.25, X, Y);
    });
    if (sp.band) { const BT = tones(sp.band); each(5, 7, 20, 9, (x, y) => get(x, y) ? (y < 8 ? BT.L : BT.M) : 0); }
  } else if (hs === 'flattop') {
    each(3, 0.5, 19, 16, (x, y, X, Y) => {
      const top = y >= 1 && y < 7 && x >= 6 && x < 18;
      const side = x < 10 && y >= 7 && y < 15 && inFace(x, y);
      if (!top && !side) return 0;
      return hairT(top ? (y < 3 ? 0.5 : -0.1) : -0.6 + (_hh(X, Y) - 0.5) * 0.3, X, Y);
    });
    for (let x = 6.25; x < 18; x += 1) px(x, 1.25, H.W);
  } else if (hs === 'bald') {
    each(10, 3.2, 18, 7.4, (x, y) => { const d = ((x - 14.2) / 2.8) ** 2 + ((y - 5.2) / 1.2) ** 2; return d < 0.3 ? SK.W : d < 1 ? SK.L : 0; });
    each(4, 9, 9, 16, (x, y, X, Y) => inFace(x, y) && _hh(X, Y) < 0.25 ? SK.S : 0);
  } else if (hs === 'afro') {
    each(-1, -6, 24, 20, (x, y, X, Y) => {
      const d = Math.hypot((x - 11) / 11.2, (y - 6) / 10.4); if (d > 1) return 0;
      if (inFace(x, y) && x > 13.5 && y > 9) return 0;
      const bump = Math.sin(Math.atan2(y - 6, x - 11) * 14) * 0.03; if (d > 0.97 + bump) return 0;
      const s = shadeAt(x, y, 12, 2, 11) + (_hh(X >> 1, Y >> 1) - 0.5) * 0.6;
      return hairT(s - 0.1, X, Y);
    });
  } else if (hs === 'cap') {
    const CT = tones(sp.capCol || '#e03a3a');
    each(2, 0, 24, 12, (x, y, X, Y) => {
      const dome = ((x - 11.5) / 8.4) ** 2 + ((y - 8) / 6.2) ** 2 <= 1 && y < 9;
      const brim = y >= 8 && y < 10 && x >= 14 && x < 24;
      if (dome) return ditherTone(CT, shadeAt(x, y, 11.5, 5.5, 7), X, Y);
      if (brim) return y < 9 ? CT.M : CT.D;
      return 0;
    });
    each(10.5, 0.8, 13.5, 1.6, () => CT.L);
    if (sp.capLogo) { box(14, 5, 2, 1, C_(sp.capLogo)); box(14, 6, 1, 1, C_(sp.capLogo)); }
    each(4, 9, 8, 16, (x, y, X, Y) => inFace(x, y) ? hairT(-0.4 + (_hh(X, Y) - 0.5) * 0.3, X, Y) : 0);
  } else if (hs === 'beanie') {
    const CT = tones(sp.capCol || '#2a2a34');
    each(2.5, -0.5, 20, 10.5, (x, y, X, Y) => {
      const dome = ((x - 11.3) / 8.6) ** 2 + ((y - 8.4) / 8.6) ** 2 <= 1 && y < 10.2;
      if (!dome) return 0;
      if (y > 7.6) return ((X >> 1) % 2) ? CT.S : CT.M;
      return ditherTone(CT, shadeAt(x, y, 11.5, 3.5, 7) + (((X >> 1) % 3 === 0) ? -0.3 : 0), X, Y);
    });
    if (sp.pompom) each(9, -2.5, 14, 1.5, (x, y, X, Y) => Math.hypot(x - 11.5, y + 0.6) < 1.9 ? (_hh(X, Y) < 0.5 ? C_(sp.pompom) : C_(mix(sp.pompom, '#ffffff', 0.4))) : 0);
    each(4, 10, 8, 16, (x, y, X, Y) => (H && inFace(x, y)) ? hairT(-0.4 + (_hh(X, Y) - 0.5) * 0.3, X, Y) : 0);
  } else if (hs === 'cowboy') {
    const CT = tones(sp.capCol || '#7a4a26');
    each(0, -6, 27, 9, (x, y, X, Y) => {
      const crown = y < 6 && y > -4.6 + Math.abs(x - 12) * 0.12 && Math.abs(x - 12) < 6.8 - (y < -2 ? (-2 - y) * 0.5 : 0) && !(y < -3.4 && Math.abs(x - 12) < 1.2);
      const brim = Math.abs(y - (5.6 + ((x - 12) / 13) ** 2 * -2.2)) < 1 && x > 0.5 && x < 25.5;
      if (crown) return ditherTone(CT, shadeAt(x, y, 13, -3, 6), X, Y);
      if (brim) return y < 5.4 + ((x - 12) / 13) ** 2 * -2.2 ? CT.L : CT.S;
      return 0;
    });
    each(5.4, 3.4, 18.8, 5, (x, y) => (Math.abs(x - 12) < 6.6) ? C_(sp.bandCol || '#18161e') : 0);
    each(4, 9, 8, 16, (x, y, X, Y) => (H && inFace(x, y)) ? hairT(-0.4 + (_hh(X, Y) - 0.5) * 0.3, X, Y) : 0);
  } else if (hs === 'fedora') {
    const CT = tones(sp.capCol || '#3a2a20');
    each(1, -3, 25, 9, (x, y, X, Y) => {
      const crown = y < 5.4 && y > -1.6 + Math.abs(x - 12) * 0.1 && Math.abs(x - 12) < 6.2 && !(y < 0.4 && Math.abs(x - 12.4) < 1.4);
      const brim = Math.abs(y - (5.4 - (x - 12) * 0.08)) < 0.9 && x > 2.5 && x < 23;
      if (crown) return ditherTone(CT, shadeAt(x, y, 13, -1, 5), X, Y);
      if (brim) return y < 5.2 - (x - 12) * 0.08 ? CT.L : CT.S;
      return 0;
    });
    each(5.8, 3.2, 18.2, 4.6, () => C_(sp.bandCol || '#18161e'));
    each(4, 9, 8, 16, (x, y, X, Y) => (H && inFace(x, y)) ? hairT(-0.4 + (_hh(X, Y) - 0.5) * 0.3, X, Y) : 0);
  } else if (hs === 'tophat') {
    const CT = tones(sp.capCol || '#18161e');
    each(3, -8, 22, 7.5, (x, y, X, Y) => {
      const crown = y >= -7.6 && y < 4.6 && x > 5.4 && x < 18.2;
      const brim = y >= 4.4 && y < 6.2 && x > 2.6 && x < 21.4;
      if (crown) return (y < -7) ? CT.L : ditherTone(CT, (x - 11.8) / 7 * 0.7 + 0.1, X, Y);
      if (brim) return y < 5 ? CT.L : CT.S;
      return 0;
    });
    each(5.4, 2, 18.2, 3.8, () => C_(sp.bandCol || '#8a1a2a'));
    each(4, 9, 8, 16, (x, y, X, Y) => (H && inFace(x, y)) ? hairT(-0.4 + (_hh(X, Y) - 0.5) * 0.3, X, Y) : 0);
  }
  if (hs === 'wig') {
    // parrucca incipriata: boccoli ai lati
    for (const [cx, cy] of [[5.5, 13], [5.8, 16.2], [6.4, 19.2]]) each(cx - 2, cy - 1.8, cx + 2.4, cy + 1.8, (x, y, X, Y) => Math.hypot((x - cx) / 1.9, (y - cy) / 1.5) < 1 ? hairT(0.3 - (y - cy) * 0.35, X, Y) : 0);
  }
  if (sp.headphones) {
    box(5, 25, 13, 0.5, C_('#18161e')); box(5, 25.5, 13, 1, C_('#2a2a34'));
    for (const cx of [6.5, 16.5]) each(cx - 2.6, 23.4, cx + 2.6, 28.6, (x, y) => { const d = Math.hypot(x - cx, y - 26); return d <= 2.4 ? (d < 1.2 ? C_(sp.phoneCol || '#e03a3a') : C_('#18161e')) : 0; });
  }
  if (sp.visor) {
    const VC = sp.visor;
    each(12, 11.4, 22, 15.6, (x, y, X) => (x < 21 && y > 11.8 + (x - 12) * 0.02 && y < 15.2) ? ((y < 12.4) ? C_('#ffffff') : (((X >> 1) + Math.floor(y * 2)) % 4 === 0 ? C_(mix(VC, '#ffffff', 0.5)) : C_(VC))) : 0);
    box(8, 13, 4, 0.5, C_('#18161e'));
  }

  // ---------------- barba ----------------
  const bs = sp.beard ? sp.beard.style : null;
  if (bs === 'short' || bs === 'long' || bs === 'full') {
    const poly = bs === 'long'
      ? [[7.5, 17], [10, 18.5], [13, 19.5], [16, 19.8], [19.6, 19.4], [19.4, 21.5], [18.6, 24], [17.6, 27.5], [16, 31], [13, 34], [10.5, 33], [8.5, 29.5], [7, 25], [6.5, 21]]
      : bs === 'full'
        ? [[7.5, 16], [10, 18], [13, 19.2], [16, 19.6], [19.6, 19.2], [19.6, 22], [18.6, 25], [16, 27.4], [12.5, 28], [9.6, 26.4], [7.4, 23], [6.6, 19]]
        : [[7.5, 17], [10, 18.5], [13, 19.5], [16, 19.8], [19.6, 19.4], [19.2, 21.2], [18.4, 22.6], [17, 24], [14, 25.2], [11, 25], [8.6, 23.6], [7, 21.4]];
    each(3, 14, HEAD_W, 36, (x, y, X, Y) => {
      if (!inPoly(x, y, poly)) return 0;
      const n = _hh(X, bs === 'long' ? Math.floor(Y / 4) : Y);
      const strand = (n - 0.5) * 0.5;
      const s = ((x - 13.5) / 8) * 0.45 - ((y - 20.5) / 12) * 0.35 + strand;
      let c = ditherTone(B, s, X, Y, [0.42, -0.18, -0.62], 0.08);
      if (BH && _hh(X + 31, bs === 'long' ? Math.floor(Y / 5) : Y) < (bs === 'long' ? 0.07 : 0.14)) c = BH;
      return c;
    });
    // la bocca resta visibile nella barba corta
    if (bs === 'short' && !sp.smile) { box(17, 20, 2, 0.5, B.D); box(17.5, 20.5, 1, 0.5, C_(mix(skinHex, '#9a3a3a', 0.35))); }
    if (bs === 'short' && sp.smile) { box(17, 20, 2, 0.5, C_('#ffffff')); box(16.5, 20.5, 1, 0.5, B.D); box(17, 20.5, 2, 0.5, SK.D); }
    // baffi sopra
    each(14.8, 18.4, 20.2, 20, (x, y) => inPoly(x, y, [[14.8, 18.9], [19.8, 18.5], [20.2, 19.4], [18.6, 19.9], [15, 19.8]]) ? (y < 19.1 ? B.M : B.S) : 0);
  }
  if (bs === 'mustache') {
    const M = [[14.6, 18.4], [19.8, 18], [20, 19.6], [18.4, 20.6], [16.4, 21], [14.8, 20.4]];
    each(14, 17, 21, 22, (x, y) => inPoly(x, y, M) ? (y < 19 ? B.M : y < 20 ? B.S : B.D) : 0);
    each(15.4, 18.3, 19.4, 18.8, () => B.L);
    if (sp.stubble) each(7, 19, 19, 25, (x, y, X, Y) => (inFace(x, y) && !inPoly(x, y, M) && _hh(X, Y) < 0.22) ? SK.S : 0);
  }
  if (bs === 'goatee') {
    each(14, 20.5, 19.6, 25, (x, y, X, Y) => inPoly(x, y, [[15, 21], [18.8, 21], [18.4, 23.6], [16.6, 24.6], [15.4, 23.4]]) ? ditherTone(B, (x - 17) / 3 - (y - 22) / 6, X, Y) : 0);
  }

  // ---------------- occhiali ----------------
  const gl = sp.glasses;
  if (gl) {
    const red = sp.lensGlow;
    const lens = C_(red || '#14101e'), lens2 = C_(red ? mix(red, '#ffffff', 0.25) : '#2c2a44'), shine = C_(red ? '#ffffff' : '#9fb4d8'), shine2 = C_('#e8f0ff');
    const frame = C_(gl === 'roundMetal' ? '#c8cdd6' : '#0d0a12');
    const fill = (pts, c) => each(10, 8, 23, 20, (x, y) => inPoly(x, y, pts) ? c : 0);
    if (gl === 'wayfarer' || gl === 'rect' || gl === 'narrow') {
      const top = gl === 'narrow' ? 13 : 12, bot = gl === 'narrow' ? 15 : gl === 'rect' ? 15 : 15.6;
      fill([[13, top], [19, top], [19, bot - 0.6], [18.2, bot], [14, bot], [13, bot - 1]], lens);
      fill([[13.6, top + 1], [18.4, top + 1], [18.4, bot - 0.8], [14.2, bot - 0.6]], lens2);
      if (gl === 'wayfarer') box(13, top, 6.5, 1, frame);
      else box(13, top, 6, 0.5, frame);
      // riflesso diagonale fine
      px(14.25, top + 1.25, shine2); px(14.75, top + 1.25, shine2); px(14.75, top + 1.75, shine); px(15.25, top + 1.75, shine); px(15.25, top + 2.25, shine);
      // lente lontana dietro il naso
      box(20, top + 0.5, 1.5, Math.max(1, bot - top - 1), lens); box(19, top + 0.5, 1, 0.5, frame);
    } else {
      const r = gl === 'roundSmall' ? 1.9 : gl === 'roundMetal' ? 2.0 : 2.4;
      const cx = 16.5, cy = 14.5, ring = 0.55;
      each(12, 10, 21, 19, (x, y) => {
        const d = Math.hypot(x - cx, y - cy);
        if (d > r + ring) return 0;
        if (d > r) return frame;
        return (d < r * 0.55 && x < cx && y < cy) ? shine : lens;
      });
      px(cx - 1.25, cy - 1.25, shine2);
      each(19.4, 13, 22, 16, (x, y) => Math.hypot(x - 20.8, y - 14.5) <= 1.2 ? lens : 0);
      box(19, 13.5, 1, 0.5, frame);
    }
    // stanghetta verso l'orecchio (sottile)
    for (let x = 9; x <= 13; x += 0.5) px(x, 13.25 + (x < 11 ? 0.75 : 0), frame);
  }
  if (sp.extra) sp.extra({ each, px, box, get }, SK, tones);
  return pb;
}

// ---------------- palla da discoteca (boss) ----------------
function buildDiscoHead() {
  const pb = new PixBuf(HEAD_W, HEAD_H, RS), S = RS, TOPF = HEAD_TOP * S;
  const cx = 13, cy = 11.5, r = 10.6;
  const T = { W: col('#ffffff'), L: col('#e4ecf8'), M: col('#a7b3c9'), S: col('#6c7892'), D: col('#3c4462') };
  for (let Y = 0; Y < 36 * S; Y++) for (let X = 0; X < HEAD_W * S; X++) {
    const x = (X + 0.5) / S, y = (Y + 0.5) / S;
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (y >= 21 && y < 30 && x >= 9 && x < 16) { pb.setHi(X, Y + TOPF, col(x < 11 ? '#5a2a8a' : '#7d46b6')); continue; }
    if (d > r) continue;
    const tile = ((Math.floor(x / 1.8) + Math.floor(y / 1.8)) % 2);
    const s = (dx / r) * 0.6 - (dy / r) * 0.8;
    let c = s > 0.45 ? T.L : s > -0.1 ? T.M : s > -0.55 ? T.S : T.D;
    if (tile && s > -0.3) c = s > 0.45 ? T.W : T.L;
    if (X % 4 === 0 || Y % 4 === 0) c = s > 0.2 ? T.M : T.D; // fughe tra le tessere
    pb.setHi(X, Y + TOPF, c);
  }
  return pb;
}

// Specifiche delle teste dei sei membri (dalle foto confermate)
const HEAD_SPECS = {
  arrigo: { skin: '#e9b38c', hair: { style: 'curlyBig', col: '#18151c', hi: '#40384a' }, beard: { style: 'short', col: '#5a545e', hi: '#a8a2b0' }, glasses: 'wayfarer' },
  mike: { skin: '#efc29f', hair: { style: 'baldSides', col: '#7b6045', hi: '#e2cd92' }, beard: { style: 'long', col: '#4e3b2d', hi: '#a39890' }, glasses: 'rect' },
  danny: { skin: '#e7b089', hair: { style: 'sidePart', col: '#2e2523' }, beard: { style: 'mustache', col: '#22180f' }, glasses: 'narrow', stubble: true },
  mario: { skin: '#e8b28b', hair: { style: 'curlyTied', col: '#2e221d' }, beard: { style: 'mustache', col: '#22180f' }, glasses: 'roundSmall' },
  troy: { skin: '#e9b28b', hair: { style: 'quiff', col: '#2e231e' }, beard: { style: 'short', col: '#3b2d25', hi: '#5e4c42' }, glasses: 'roundBlack', smile: true },
  marvin: { skin: '#eab48d', hair: { style: 'slicked', col: '#2a1f1b' }, beard: { style: 'short', col: '#3b2c24', hi: '#5f4d42' }, glasses: 'roundMetal' },
};
