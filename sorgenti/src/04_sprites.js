// ============================================================
// SPRITE v2 — stile CPS-1: marionetta a giunture con arti cilindrici
// ombreggiati a 4 toni, contorno selettivo, frame ritagliati in cache.
// Altezza tipica di un personaggio: ~100 px su 224 righe.
// ============================================================
const FRAME_W = 230, FRAME_H = 190, FOOT_X = 115, FOOT_Y = 178;
const BODY = { thigh: 22, shin: 22, torso: 30, upArm: 15, foreArm: 14 };
const FIG_SCALE = 1;      // 1.12 nella v5 (grafica fotografica, accantonata)
const OUTLINE = '#120a1c';
const TROUSERS = '#2a2a38';

const COSTUMES = {
  rossa: { name: 'GIACCA ROSSA', short: 'ROSSA', kind: 'jacket', j: '#c42032', lap: '#18161e', shirt: '#f1efe8', tie: '#18161e', flap: '#18161e' },
  bianca: { name: 'GIACCA BIANCA', short: 'BIANCA', kind: 'jacket', j: '#e9e7e0', lap: '#18161e', shirt: '#dad9d3', tie: '#18161e', flap: '#18161e' },
  oro: { name: 'PAILLETTES ORO', short: 'ORO', kind: 'jacket', j: '#d4a22c', lap: '#18161e', shirt: '#f1efe8', tie: '#18161e', sparkle: true },
  azzurra: { name: 'CAMICIA RAZZI', short: 'RAZZI', kind: 'shirt', j: '#4cb6c1', yoke: '#efe3c4', rocket: '#d8473a', planet: '#3b7ed2', btn: '#f4f2ea', belt: '#18161e', pipe: '#18161e' },
};
const COSTUME_ORDER = ['rossa', 'oro', 'bianca', 'azzurra'];

// ---------------- primitive ombreggiate ----------------
// ombreggiatura: continua a 8 livelli (aspetto "digitalizzato", come i corpi fotografici) invece dei 4 toni piatti
const SMOOTH_SHADE = false;   // true nella v5
const _bandCache = new Map();
function shadeBand(T, s) {
  if (!SMOOTH_SHADE) return s > 0.45 ? T.L : s > -0.2 ? T.M : s > -0.62 ? T.S : T.D;
  const q = Math.max(-5, Math.min(5, Math.round(s * 4.5)));
  const k = T.M * 16 + (q + 5);
  let c = _bandCache.get(k);
  if (c === undefined) {
    const f = q >= 0 ? 1 + q * 0.07 : 1 + q * 0.1;
    c = q >= 4 ? T.L : q <= -4 ? T.D : tint32(T.M, f);
    if (_bandCache.size > 4000) _bandCache.clear();
    _bandCache.set(k, c);
  }
  return c;
}

// Arto affusolato con estremità arrotondate e luce in base all'orientamento
// strip: parte di atlante fotografico (righe = larghezza, colonne = lunghezza) che veste l'arto al posto dei 4 toni
function drawLimb(pb, x0, y0, x1, y1, w0, w1, T, lightBias = 0, crease = false, strip = null) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.max(0.01, Math.hypot(dx, dy));
  const ang = Math.atan2(dy, dx);
  const nx = -dy / len, ny = dx / len;
  const ndl = nx * LIGHT[0] + ny * LIGHT[1];
  const hwMax = Math.max(w0, w1) / 2 + 1;
  const sw = strip ? strip.w : 0, sh = strip ? strip.h : 0, sdim = strip ? (strip.dim || 1) : 1;
  pb.shape(x0, y0, ang, -w0 / 2 - 1, len + w1 / 2 + 1, -hwMax, hwMax, (u, v) => {
    const uc = u + 0.5, vc = v + 0.5;
    const t = clamp(uc / len, 0, 1), hw = (w0 + (w1 - w0) * t) / 2;
    if (uc < 0) { if (uc * uc + vc * vc > (w0 / 2) ** 2) return 0; }
    else if (uc > len) { if ((uc - len) ** 2 + vc * vc > (w1 / 2) ** 2) return 0; }
    else if (Math.abs(vc) > hw) return 0;
    const s = (vc / Math.max(1, hw)) * ndl * 1.1 + lightBias;
    if (strip) {
      const i = Math.min(sw - 1, Math.max(0, Math.floor(t * sw))), j = Math.min(sh - 1, Math.max(0, Math.floor(((vc / Math.max(1, hw)) * 0.5 + 0.5) * sh)));
      let c = strip.px(i, j); if (!c) c = strip.px(i, sh >> 1); if (!c) return 0;
      return tint32(c, (1 + s * 0.2) * sdim);
    }
    if (crease && uc > 2 && uc < len - 1 && Math.abs(vc - hw * 0.35 * Math.sign(ndl || 1)) < 0.6) return T.L;
    return shadeBand(T, s);
  });
}
function drawFist(pb, x, y, ang, T) {
  // pugno 6x6 ruotato con le nocche illuminate
  pb.shape(x, y, ang, -3, 4, -3, 4, (u, v) => {
    const d = Math.hypot(u + 0.5 - 0.5, v + 0.5 - 0.5);
    if (d > 3.1) return 0;
    const s = ((u + 0.5) / 3) * 0.4 - ((v + 0.5) / 3) * 0.5;
    return s > 0.35 ? T.L : s > -0.25 ? T.M : T.S;
  });
}
function inCircle(u, v, cu, cv, r) { const du = u + 0.5 - cu, dv = v + 0.5 - cv; return du * du + dv * dv <= r * r; }

// ---------------- strumenti (forme locali: u lungo il manico, v perpendicolare) ----------------
const _hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const C = hex => col(hex);
const CHROME = { L: '#ffffff', M: '#cfd4dd', S: '#8a90a0', D: '#4a4e5e' };
const MAPLE = { L: '#f6d79a', M: '#e2b66c', S: '#b88a44', D: '#7c5a2a' };
const ROSE = { L: '#6a4030', M: '#4a2a1e', S: '#321a12', D: '#1e0f0a' };

function neckPix(u, v, u0, u1, fret, wood) {
  if (u < u0 || u >= u1 || v < -2 || v > 1) return 0;
  if (v === -2) return C(wood.L);
  if ((u - u0) % 4 === 3) return C('#d9dde6');            // tasti
  if (v === 1) return C(wood.S);
  if ((u - u0 === 10 || u - u0 === 14) && v === 0 && fret) return C('#f4f2ea');
  return C(fret ? fret : wood.M);
}
function chromeAt(v) { return C(v < 0 ? CHROME.L : v < 1 ? CHROME.M : CHROME.S); }

const INSTRUMENTS = {
  // Chitarra crema a doppia spalla mancante, manico in acero (Mike)
  strat: {
    len: 50, grips: { neck: 9, body: 37 }, reach: 38,
    fn(u, v) {
      if (u >= 0 && u < 8 && v >= -3 && v <= 1) { if (v === -3 && u % 2 === 1 && u < 7) return C('#e6e8ee'); return C(v === -2 ? MAPLE.L : v === 1 ? MAPLE.S : MAPLE.M); }
      const n = neckPix(u, v, 8, 28, null, MAPLE); if (n) return n;
      const a = inCircle(u, v, 31, -1, 5.6), b = inCircle(u, v, 40, 0.6, 8.6), h1 = inCircle(u, v, 27.6, -5.8, 2.6), h2 = inCircle(u, v, 29, 5.4, 2.2);
      if (!(a || b || h1 || h2)) return 0;
      if ((u === 31 || u === 35 || u === 39) && v >= -2 && v <= 2) return C(v === -2 ? '#3a3a44' : '#15151a');
      if (u >= 43 && u <= 44 && v >= -2 && v <= 2) return chromeAt(v);
      if ((u === 42 && v === 5) || (u === 44 && v === 6) || (u === 40 && v === 6)) return C('#f4f2ea');
      const inner = inCircle(u, v, 31, -1, 3.8) || inCircle(u, v, 40, 0.6, 6.8);
      if (inner && u >= 28 && u <= 42 && v >= -4 && v <= 3) return C(v < -2 ? '#ffffff' : '#f4f2ea'); // battipenna
      const s = -(v + 0.5) / 8;
      if (v <= -6 && v >= -7 && u > 32 && u < 44) return C('#fffbea');                              // riflesso lucido
      return C(s > 0.3 ? '#faf2d6' : s > -0.25 ? '#ece0bc' : s > -0.6 ? '#c9b78e' : '#9c8a62');
    }
  },
  // Chitarra nera single-cut (Danny)
  tele: {
    len: 49, grips: { neck: 9, body: 36 }, reach: 38,
    fn(u, v) {
      if (u >= 0 && u < 8 && v >= -3 && v <= 1) { if (v === -3 && u % 2 === 0 && u < 7) return C('#e6e8ee'); return C(v === -2 ? MAPLE.L : v === 1 ? MAPLE.S : MAPLE.M); }
      const n = neckPix(u, v, 8, 28, null, MAPLE); if (n) return n;
      if (u < 27 || u >= 49 || v < -8 || v > 8) return 0;
      if (u < 31 && v > 2) return 0;                                       // spalla mancante
      if (u > 45 && Math.abs(v) > 5 && !inCircle(u, v, 45, Math.sign(v) * 5, 3.5)) return 0;
      if (u < 29 && v < -6) return 0;
      if ((u >= 31 && u <= 33) || (u >= 38 && u <= 40)) { if (v >= -3 && v <= 3) return (v % 2 === 0) ? C('#8a90a0') : chromeAt(v); }
      if ((u === 42 || u === 44) && (v === 5 || v === 6)) return C('#e6e8ee');
      if (u >= 43 && u <= 44 && v >= -2 && v <= 2) return chromeAt(v);
      if (u >= 29 && u <= 42 && v >= -5 && v <= 4) return C(v < -3 ? '#33333d' : '#24242c');   // battipenna
      if (v === -8 || (v === -7 && u > 30 && u < 46)) return C('#5a5a66');
      return C(v < -2 ? '#2a2a32' : v < 3 ? '#1c1c22' : '#111116');
    }
  },
  // Violin bass (Mario): cassa a violino sunburst, manico in palissandro, meccaniche 2+2
  violin: {
    len: 52, grips: { neck: 9, body: 38 }, reach: 42,
    fn(u, v) {
      if (u >= 0 && u < 8 && v >= -3 && v <= 2) {
        if ((v === -3 || v === 2) && (u === 2 || u === 5)) return C('#e6e8ee');
        if (u < 1 && (v < -2 || v > 1)) return 0;
        return C(v === -2 ? '#6a4030' : v >= 1 ? '#2a160e' : '#4a2a1e');
      }
      const n = neckPix(u, v, 8, 31, ROSE.M, ROSE); if (n) return n;
      const a = inCircle(u, v, 34, 0, 5.8), w = inCircle(u, v, 39, 0, 4.4), b = inCircle(u, v, 45, 0, 7.4);
      if (!(a || w || b)) return 0;
      const edge = !(inCircle(u, v, 34, 0, 4.9) || inCircle(u, v, 39, 0, 3.5) || inCircle(u, v, 45, 0, 6.5));
      if (edge) return C('#efe3c4');                                                  // filetto crema
      if ((u >= 33 && u <= 34) || (u >= 37 && u <= 38)) { if (v >= -3 && v <= 3) return v === -3 ? C('#8a90a0') : C(v % 2 ? '#15151a' : '#cfd4dd'); }
      if (u >= 43 && u <= 47 && v >= 3 && v <= 5) return (u % 2 === 0 && v === 4) ? C('#f4f2ea') : C('#18161e'); // pannello controlli
      if (u >= 48 && u <= 50 && v >= -2 && v <= 2) return chromeAt(v);
      if (u >= 40 && u <= 45 && v >= -6 && v <= -4) return C('#18161e');               // battipenna
      const d = Math.hypot(u + 0.5 - 41, (v + 0.5) * 1.2) / 7.5;
      const s = -(v + 0.5) / 7;
      let c = d < 0.45 ? '#e8a646' : d < 0.75 ? '#c06a22' : d < 0.95 ? '#7a3a16' : '#4a2410';
      if (s > 0.55 && d < 0.9) c = mix(c, '#fff0c8', 0.35);
      return C(c);
    }
  },
  // Asta del microfono (Arrigo): base, asta cromata, clip, testina a griglia
  micstand: {
    len: 88, grips: { pole: 28, hold: 60 }, reach: 44,
    fn(u, v) {
      if (u >= 0 && u < 3 && v >= -5 && v <= 5) return C(Math.abs(v) > 3 ? '#2a2a34' : '#18161e');
      if (u >= 3 && u < 79 && v >= -1 && v <= 0) return C(v === -1 ? (u % 9 < 2 ? '#ffffff' : '#dfe3ea') : '#8a90a0');
      if (u >= 77 && u < 81 && v >= -1 && v <= 1) return C('#18161e');
      if (inCircle(u, v, 84, 0, 3.4)) { const s = -(v + 0.5) * 0.4 + (u - 84) * 0.1; return C(((u + v) % 2 === 0) ? (s > 0 ? '#ffffff' : '#c9cdd6') : (s > 0 ? '#9aa0ae' : '#4a4e5c')); }
      return 0;
    }
  },
  mic: {
    len: 14, grips: { end: 2 }, reach: 10,
    fn(u, v) {
      if (u >= 0 && u < 9 && v >= -1 && v <= 1) return C(v === -1 ? '#3a3a44' : '#18161e');
      if (inCircle(u, v, 11, 0, 3)) return C(((u + v) % 2 === 0) ? '#e6e8ee' : '#4a4e5c');
      return 0;
    }
  },
  sticks: {
    len: 25, grips: { end: 3 }, reach: 18,
    fn(u, v) {
      if (u < 0 || u >= 25 || v < -1 || v > 0) return 0;
      if (u >= 22) return C(v < 0 ? '#fff6dc' : '#f0dcb0');
      return C(v < 0 ? (u < 5 ? '#c9a066' : '#f0d49a') : (u < 5 ? '#94703e' : '#c9a066'));
    }
  },
  keys: {
    len: 46, grips: { end: 5, mid: 24 }, reach: 34,
    fn(u, v) {
      if (u < 0 || u >= 46 || v < -6 || v > 5) return 0;
      if (u < 9) { if (v < -2 || v > 2) return 0; return C(v < 0 ? '#3a3a44' : '#18161e'); }  // impugnatura
      if (u >= 44 || v <= -4 || v >= 4 || u < 11) {
        if (v <= -5) return C('#e0405a');
        if (v >= 4) return C('#640c18');
        return C(v < 0 ? '#c42032' : '#9a1424');
      }
      if (v <= -3) { if (u > 13 && u < 17) return C('#3ae0ff'); if (u > 18 && u < 21) return C('#ffd34a'); return C('#c42032'); }
      if (v <= 0 && (u % 4 === 1 || u % 4 === 2) && u % 14 !== 13) return C('#18161e');
      return C(u % 2 === 0 ? '#c9c6bb' : (v < 2 ? '#ffffff' : '#ecebe4'));
    }
  },
  vinyl: {
    len: 13, grips: { mid: 6 }, reach: 8,
    fn(u, v) {
      if (!inCircle(u, v, 6.5, 0.5, 6.4)) return 0;
      if (inCircle(u, v, 6.5, 0.5, 2.3)) return (u === 6 && v === 0) ? C('#15151a') : C(v < 0 ? '#ff6a5a' : '#e0423a');
      if (!inCircle(u, v, 6.5, 0.5, 5.3)) return C(v < 0 ? '#8a8a9a' : '#4a4a58');            // bordo lucido
      return C(((u + v) % 3 === 0) ? '#4a4a58' : (v < -3 ? '#3a3a46' : '#15151a'));
    }
  },
  cymbal: {
    len: 18, grips: { mid: 9 }, reach: 12,
    fn(u, v) {
      if (u < 0 || u >= 18 || v < -1 || v > 1) return 0;
      if (u === 9 && v === -1) return C('#a9801f');
      return C(v === -1 ? '#fff0a8' : v === 1 ? '#a9801f' : '#f2c94c');
    }
  },
  // ---- armi da raccogliere ----
  // Tubo di ferro con gomito filettato e nastro isolante sull'impugnatura
  pipe: {
    len: 48, grips: { end: 4 }, reach: 40,
    fn(u, v) {
      if (u < 0 || u >= 48) return 0;
      if (u >= 41) {                                                     // raccordo a gomito
        if (v < -3 || v > 3) return 0;
        if (u === 41 || u === 47) return C('#4a4e5c');
        return C(v <= -2 ? '#c9cdd6' : v <= 0 ? '#8d93a2' : v <= 2 ? '#5f6574' : '#3a3e4a');
      }
      if (v < -2 || v > 2) return 0;
      if (u < 10) return C(v <= -2 ? '#3a3a46' : (u % 3 === 0 ? '#101016' : '#1c1c24'));   // nastro
      if ((u * 7 + v * 3) % 23 === 0 && v >= 0) return C('#8a4a22');                   // ruggine
      return C(v <= -2 ? '#e6e9ef' : v <= -1 ? '#b4bac6' : v <= 1 ? '#7d8392' : '#4e5362');
    }
  },
  // Sparacoriandoli: cannone da festa a strisce con impugnatura
  confetti: {
    len: 36, grips: { grip: 6 }, reach: 30,
    fn(u, v) {
      if (u < 0 || u >= 36) return 0;
      if (u < 9) {                                                       // impugnatura e grilletto
        if (u >= 3 && u <= 5 && v >= 2 && v <= 5) return C('#18161e');
        if (v < -2 || v > 1) return 0;
        return C(v <= -2 ? '#5a3a8a' : v <= 0 ? '#3e2468' : '#26143e');
      }
      const r = 2.6 + (u - 9) * 0.12;
      if (Math.abs(v + 0.5) > r) return 0;
      if (u >= 33) return C(Math.abs(v + 0.5) > r - 1 ? '#ffd34a' : '#15151a');          // bocca
      const stripe = Math.floor((u + v * 0.6) / 3) % 3;
      const base = ['#ff4d6d', '#ffffff', '#3ec5ff'][stripe];
      const s = -(v + 0.5) / r;
      return C(s > 0.45 ? mix(base, '#ffffff', 0.45) : s > -0.3 ? base : shade(base, 0.62));
    }
  },
  // mazza da baseball chiodata
  bat: {
    len: 48, grips: { end: 4 }, reach: 42,
    fn(u, v) {
      if (u < 0 || u >= 48) return 0;
      const R = Math.min(4.3, u < 12 ? 1.6 : 1.6 + (u - 12) * 0.075);
      if (u > 22 && u < 46) { const k = Math.floor((u - 22) / 4); if ((u - 22) % 4 < 1 && Math.abs(v + 0.25) > R && Math.abs(v + 0.25) < R + 2.2 && (k % 2 === 0 ? v < 0 : v > 0)) return C(Math.abs(v + 0.25) > R + 1.4 ? '#e6e9ef' : '#8a90a0'); }
      if (Math.abs(v + 0.25) > R) return 0;
      if (u >= 46.5) return C('#7a4a22');
      if (u < 11) return C((Math.floor(u * 2) % 3 === 0) ? '#101016' : (v < -0.5 ? '#3a3a46' : '#1c1c24'));
      if (_hash(Math.floor(u * 2), Math.floor(v * 2) + 9) < 0.05 && u > 26) return C('#8a1010');
      const s = -(v + 0.25) / R;
      return C(s > 0.45 ? '#e8c088' : s > -0.2 ? '#c8935a' : s > -0.65 ? '#9a6a3a' : '#6a4422');
    }
  },
  // fenicottero di plastica sul suo paletto
  flamingo: {
    len: 57, grips: { end: 3 }, reach: 50,
    fn(u, v) {
      const P = ['#ffc8e2', '#ff7ab8', '#e0508e', '#a8306a'];
      if (u >= 0 && u < 26 && Math.abs(v + 0.25) < 0.75) return C(v < 0 ? '#e6e9ef' : '#8a90a0');
      const bx = (u - 33) / 9, by = (v - 1) / 5.2;
      if (bx * bx + by * by <= 1) { const s = -by * 0.8 + bx * 0.3; return C(s > 0.5 ? P[0] : s > -0.1 ? P[1] : s > -0.6 ? P[2] : P[3]); }
      if (u > 22 && u < 27 && v > -1 && v < 3 && (u - 22) < (v + 1) * 1.5) return C(P[2]);
      const ny = -4 - Math.sin((u - 40) / 10 * Math.PI) * 4.5;
      if (u >= 39 && u < 50 && Math.abs(v - ny) < 1.1) return C(v - ny < 0 ? P[1] : P[2]);
      if (Math.hypot(u - 50.8, v + 7.2) < 0.6) return C('#18161e');
      if (Math.hypot(u - 50.5, v + 6.5) < 2.2) return C(P[1]);
      if (u >= 51.5 && u < 56.5 && v > -7.5 && v < -4.5 + (u - 51.5) * 0.4) return C(u > 54 ? '#18161e' : '#f4f2ea');
      return 0;
    }
  },
  // pesce surgelato (si impugna dalla coda)
  fish: {
    len: 40, grips: { end: 2 }, reach: 36,
    fn(u, v) {
      if (u >= 0 && u < 6) return Math.abs(v) < 0.6 + (6 - u) * 0.8 ? C(u < 3 ? '#6a8aa8' : '#8aaccc') : 0;
      const t = (u - 6) / 32; if (t < 0 || t > 1) return 0;
      const R = Math.sin(Math.min(1, t * 1.15) * Math.PI) * 5 + 0.8;
      if (Math.abs(v) > R) return 0;
      if (Math.hypot(u - 32.5, v + 1.5) < 1.3) return C(Math.hypot(u - 32.7, v + 1.7) < 0.55 ? '#ffffff' : '#18161e');
      if (u > 36.5 && Math.abs(v - 0.8) < 0.5) return C('#3a4a5a');
      if (_hash(Math.floor(u * 2), Math.floor(v * 2)) < 0.08) return C('#ffffff');
      const s = -v / R;
      if ((Math.floor(u * 2) + Math.floor(v * 2)) % 6 === 0 && s < 0.4) return C('#7c9ab8');
      return C(s > 0.5 ? '#e8f4ff' : s > 0 ? '#b8d4ee' : s > -0.5 ? '#8aaccc' : '#5a7a98');
    }
  },
  // ascia-basso: manico da basso e testa d'ascia al posto del corpo
  axe: {
    vr: 13, len: 62, grips: { end: 5 }, reach: 56,
    fn(u, v) {
      if (u >= 0 && u < 40 && Math.abs(v + 0.25) < 1.6) { if (u < 6) return C('#18161e'); if ((Math.floor(u) % 4 === 0) && v > -1) return C('#c9cdd6'); return C(v < -0.8 ? '#6a4030' : v < 0.7 ? '#4a2a1e' : '#2a160e'); }
      if (u >= 38 && u < 62) {
        const du = u - 47, top = -12 + Math.abs(du) * 0.35, bot = 7 - Math.abs(du) * 0.2;
        if (v < top || v > bot) return 0;
        if (du > 8.5 - Math.abs(v + 2) * 0.12) return C(du > 11 - Math.abs(v + 2) * 0.12 ? '#ffffff' : v < -3 ? '#e6e9ef' : '#a8aebb');
        if (Math.abs(du - 0.5) < 3 && v > -3 && v < 3) return C((Math.floor(v * 2) % 2) ? '#18161e' : '#cfd4dd');
        const s = -(v + 2) / 9;
        return C(s > 0.4 ? '#ff6a5a' : s > -0.2 ? '#d0302c' : s > -0.6 ? '#9a1c1c' : '#5a0c10');
      }
      return 0;
    }
  },
  // motosega-chitarra: corpo con motore e lama dentata
  saw: {
    len: 60, grips: { grip: 8 }, reach: 54,
    fn(u, v) {
      if (u >= 0 && u < 20 && v > -6 && v < 6) {
        if (u >= 4 && u < 12 && v > 3) return C('#18161e');
        if (Math.hypot(u - 10, v + 1) < 2.2) return C('#18161e');
        const s = -(v + 1) / 6 + (u - 10) / 30;
        return C(s > 0.4 ? '#ffb05a' : s > -0.2 ? '#f07a1a' : s > -0.6 ? '#b84e0e' : '#6a2a08');
      }
      if (u >= 20 && u < 60) {
        const R = 3.2 - (u > 54 ? (u - 54) * 0.4 : 0), dv = Math.abs(v + 0.5);
        if (dv > R + 1) return 0;
        if (dv > R) return (Math.floor(u * 2) % 3 === 0) ? C('#e6e9ef') : 0;
        if (dv > R - 0.6) return C('#3a3a46');
        if (_hash(Math.floor(u * 2), Math.floor(v * 2) + 3) < 0.06) return C('#8a1010');
        return C(v < -1.5 ? '#e6e9ef' : v < 0.5 ? '#b4bac6' : '#7d8392');
      }
      return 0;
    }
  },
  // bazooka-trombone: coulisse e campana d'ottone
  trombone: {
    vr: 12, len: 58, grips: { grip: 10 }, reach: 52,
    fn(u, v) {
      const G4 = ['#fff0a8', '#f2c94c', '#c99a2a', '#7a5a14'];
      const tube = vc => Math.abs(v - vc) < 0.9 ? C(v - vc < -0.3 ? G4[0] : v - vc < 0.4 ? G4[1] : G4[2]) : 0;
      if (u >= 0 && u < 42) { const a = tube(-2.5) || tube(2.5); if (a) return a; if (u < 2 && v > -3.4 && v < 3.4) return C(G4[2]); if (u > 6 && u < 10 && v > 2 && v < 7) return C('#18161e'); }
      if (u >= 40 && u < 58) { const R = 1.2 + Math.pow((u - 40) / 18, 2.2) * 7.2; if (Math.abs(v + 2.5) < R) { if (u > 56.5) return C('#18161e'); const s = -(v + 2.5) / R; return C(s > 0.45 ? G4[0] : s > -0.15 ? G4[1] : s > -0.6 ? G4[2] : G4[3]); } }
      return 0;
    }
  },
  // laser-theremin: cassetta di legno con antenna luminosa
  theremin: {
    len: 44, grips: { grip: 6 }, reach: 40,
    fn(u, v) {
      if (u >= 0 && u < 18 && v > -4.5 && v < 4.5) { if (u > 4 && u < 8 && v > 2) return C('#18161e'); if (u > 13 && u < 16 && v > -3 && v < -1.5) return C('#ff4d6d'); const s = -v / 5; return C(s > 0.4 ? '#c8935a' : s > -0.2 ? '#9a6a3a' : '#6a4422'); }
      if (u >= 4 && u < 8 && v >= 4.5 && v < 7) return C('#18161e');
      if (u >= 18 && u < 40 && Math.abs(v + 0.25) < 0.6) return C(v < 0 ? '#ffffff' : '#a8aebb');
      const d = Math.hypot(u - 41, v);
      if (d < 2.4) return C(d < 1.2 ? '#ffffff' : '#3ae0ff');
      return 0;
    }
  },
  // lacca + accendino
  spray: {
    len: 23, grips: { grip: 5 }, reach: 20,
    fn(u, v) {
      if (u >= 0 && u < 15 && Math.abs(v) < 3.5) { if (u > 12) return C('#c9cdd6'); const s = -v / 3.5; return C(s > 0.4 ? '#ffb8e0' : s > -0.3 ? '#ff5aa8' : '#b02a6a'); }
      if (u >= 15 && u < 18 && Math.abs(v + 1.5) < 1) return C('#18161e');
      const d = Math.hypot(u - 19.5, v + 2.2);
      if (u >= 17 && d < 2.2) return C(d < 1 ? '#fff2a8' : '#ff9a3a');
      return 0;
    }
  },
  // pistola ad acqua (santa)
  watergun: {
    len: 30, grips: { grip: 5 }, reach: 26,
    fn(u, v) {
      if (u > 3 && u < 9 && v > 1 && v < 8) return C(v > 6 ? '#1a7ac8' : '#2a9ae0');
      if (u >= 8 && u < 18 && v > -7 && v < -3) { if ((u > 11.5 && u < 13.5 && v > -6.5 && v < -3.5) || (u > 10 && u < 15 && v > -5.5 && v < -4.5)) return C('#ffffff'); return C('#7ad0ff'); }
      if (u >= 0 && u < 22 && v > -3 && v < 2) { const s = -v / 3; return C(s > 0.3 ? '#9ad8ff' : s > -0.3 ? '#4ab0ff' : '#1a7ac8'); }
      if (u >= 22 && u < 28 && Math.abs(v + 0.5) < 0.8) return C('#ffd34a');
      return 0;
    }
  },
  // grancassa-bomba con miccia accesa
  drumbomb: {
    vr: 13, len: 20, grips: { mid: 10 }, reach: 12,
    fn(u, v) {
      const d = Math.hypot(u - 10, v);
      if (d < 8) { if (d > 7) return C('#c9a43a'); if (Math.abs(u - 10) < 6.5 && Math.abs(v) < 1) return C('#ffffff'); const s = -v / 8; return C(s > 0.3 ? '#ff6a5a' : s > -0.3 ? '#c42032' : '#7a0c18'); }
      if (u >= 9.5 && u < 10.5 && v >= -11 && v < -8) return C('#3a3446');
      if (Math.hypot(u - 10, v + 11.5) < 1.2) return C('#fff2a8');
      return 0;
    }
  },
  // ---- oggetti dei nemici ----
  chain: { len: 44, grips: { end: 2 }, reach: 40, fn(u, v) { if (u < 0 || u >= 44) return 0; const wv = Math.sin(u * 0.35) * 1.2; if (u < 5) return Math.abs(v) < 1.6 ? C('#18161e') : 0; const k = Math.floor(u / 2.2) % 2; if (k ? Math.abs(v - wv) < 1.1 : (Math.abs(v - wv) < 1.6 && Math.abs(v - wv) > 0.6)) return C(v - wv < 0 ? '#e6e9ef' : '#8a90a0'); return 0; } },
  lasso: { vr: 12, len: 40, grips: { end: 2 }, reach: 36, fn(u, v) { if (u >= 0 && u < 22 && Math.abs(v - Math.sin(u * 0.3)) < 0.75) return C(v < 0 ? '#e8c088' : '#b8935a'); const d = Math.hypot((u - 31) / 9, (v + 1) / 8); if (Math.abs(d - 1) < 0.1) return C(v < 0 ? '#e8c088' : '#9a6a3a'); return 0; } },
  revolver: { len: 22, grips: { grip: 4 }, reach: 18, fn(u, v) { if (u >= 1 && u < 7 && v > 0 && v < 7 && u - 1 > (v - 0) * 0.3) return C(v > 4 ? '#5a3a20' : '#7a4a26'); if (u >= 4 && u < 11 && v > -3 && v < 1.5) { if (Math.hypot(u - 7.5, v + 0.8) < 1.6) return C('#3a3a46'); return C(v < -1.5 ? '#e6e9ef' : '#a8aebb'); } if (u >= 11 && u < 22 && v > -2.4 && v < -0.2) return C(v < -1.6 ? '#ffffff' : '#a8aebb'); if (u >= 20 && u < 22 && v >= -3.4 && v < -2.4) return C('#a8aebb'); return 0; } },
  camera: { len: 18, grips: { grip: 4 }, reach: 14, fn(u, v) { if (u >= 0 && u < 14 && v > -5 && v < 4) { if (u > 2 && u < 6 && v < -3.4) return C('#c9cdd6'); return C(v < -3 ? '#4a4a58' : '#22222a'); } const d = Math.hypot(u - 15, v + 0.5); if (u >= 13 && d < 3.6) return C(d < 1.6 ? '#9fb4d8' : d < 2.4 ? '#18161e' : '#3a3a46'); if (u > 9 && u < 13 && v >= -8 && v < -5) return C('#e8f4ff'); return 0; } },
  spraycan: { len: 12, grips: { mid: 5 }, reach: 8, fn(u, v) { if (u >= 0 && u < 11 && Math.abs(v) < 2.8) { if (u > 9) return C('#c9cdd6'); const s = -v / 2.8; return C(s > 0.4 ? '#d8b8ff' : s > -0.3 ? '#a06ae0' : '#5a3a8a'); } if (u >= 11 && u < 12.5 && Math.abs(v + 1) < 0.8) return C('#18161e'); return 0; } },
  bottleH: { len: 18, grips: { end: 3 }, reach: 14, fn(u, v) { const r = u < 6 ? 1.2 : u < 9 ? 1.2 + (u - 6) * 0.8 : 3.6; if (u < 0 || u >= 18 || Math.abs(v) > r) return 0; if (u < 1.2) return C('#c9a43a'); if (u > 10 && u < 14 && Math.abs(v) < 2.6) return C('#efe3c4'); return C(v < -1 ? '#7ad08a' : v < 1 ? '#2a8a3a' : '#1a5a24'); } },
  violinE: { vr: 11, len: 46, grips: { mid: 14 }, reach: 40, fn(u, v) { if (u >= 0 && u < 40 && Math.abs(v + 6 - u * 0.05) < 0.5) return C('#e8e0c0'); if (u >= 2 && u < 12 && Math.abs(v) < 0.9) return C('#2a160e'); const a = Math.hypot((u - 15) / 3.4, v / 3.4), b = Math.hypot((u - 21) / 4.6, v / 4.4); if (a < 1 || b < 1 || (u > 15 && u < 21 && Math.abs(v) < 2.6)) { if (Math.abs(v) < 0.4 && u > 13 && u < 23) return C('#18161e'); const s = -v / 4.4; return C(s > 0.3 ? '#e8a646' : s > -0.3 ? '#c06a22' : '#7a3a16'); } return 0; } },
  baton: { len: 26, grips: { end: 2 }, reach: 22, fn(u, v) { if (u < 0 || u >= 26) return 0; if (u < 5) return Math.abs(v) < 1.4 ? C(v < 0 ? '#5a3420' : '#3a2010') : 0; return Math.abs(v + 0.2) < 0.55 ? C(v < 0 ? '#ffffff' : '#c9cdd6') : 0; } },
  shovel: { vr: 10, len: 50, grips: { mid: 16 }, reach: 44, fn(u, v) { if (u >= 0 && u < 38 && Math.abs(v) < 1.1) return C(v < 0 ? '#9a6a3a' : '#6a4422'); if (u >= 0 && u < 3 && Math.abs(v) < 2.6) return C('#3a2010'); if (u >= 37 && u < 50) { const half = 5.2 - Math.max(0, u - 45) * 0.9; if (Math.abs(v) < half) return C(v < -1.5 ? '#c9cdd6' : v < 2 ? '#8a90a0' : '#5a5a66'); } return 0; } },
  glowstick: { len: 18, grips: { end: 3 }, reach: 14, fn(u, v) { if (u < 0 || u >= 18 || Math.abs(v) > 1.4) return 0; if (u < 3) return C('#18161e'); return C(Math.abs(v) < 0.5 ? '#ffffff' : '#62f08e'); } },
  trumpet: { vr: 10, len: 34, grips: { grip: 8 }, reach: 30, fn(u, v) { const G4 = ['#fff0a8', '#f2c94c', '#c99a2a']; if (u >= 0 && u < 24 && Math.abs(v) < 0.9) return C(v < 0 ? G4[0] : G4[1]); if (u >= 6 && u < 14 && v > -4 && v < -1 && (Math.floor(u) % 3 !== 0)) return C(G4[2]); if (u >= 8 && u < 13 && v >= 0.9 && v < 3) return C(G4[2]); if (u >= 22 && u < 34) { const R = 1 + Math.pow((u - 22) / 12, 2) * 5.6; if (Math.abs(v) < R) return C(u > 33 ? '#7a5a14' : v < -R * 0.3 ? G4[0] : G4[1]); } return 0; } },
  boneH: { len: 14, grips: { mid: 7 }, reach: 10, fn(u, v) { if (u >= 2 && u < 12 && Math.abs(v) < 0.9) return C(v < 0 ? '#efe9dc' : '#c6bfae'); for (const [cu, cv] of [[1.5, -1.2], [1.5, 1.2], [12.5, -1.2], [12.5, 1.2]]) if (Math.hypot(u - cu, v - cv) < 1.4) return C(cv < 0 ? '#efe9dc' : '#c6bfae'); return 0; } },
  crateH: { vr: 10, len: 22, grips: { mid: 11 }, reach: 16, fn(u, v) { if (u < 0 || u >= 22 || Math.abs(v) > 8) return 0; if (Math.abs(v) > 7 || u < 1 || u > 21) return C('#c9cdd6'); if (Math.abs(v) < 0.6) return C('#8a90a0'); return C(v < 0 ? '#4a4a58' : '#3a3a46'); } },
  cards: { len: 14, grips: { mid: 4 }, reach: 10, fn(u, v) { if (u < 2 || u >= 14) return 0; for (let k = -1; k <= 1; k++) { const vv = v - k * 2.2 - (u - 2) * k * 0.35; if (Math.abs(vv) < 1.8) return C(Math.abs(vv) > 1.3 ? '#18161e' : (k === 0 && u > 7 && u < 9 ? '#c42032' : '#f4f2ea')); } return 0; } },
  mic2: { len: 16, grips: { end: 2 }, reach: 12, fn(u, v) { if (u >= 0 && u < 10 && Math.abs(v) < 1.3) return C(v < 0 ? '#5a5a66' : '#2a2a34'); if (Math.hypot(u - 12, v) < 3) return C(((Math.floor(u * 2) + Math.floor(v * 2)) % 2) ? '#e6e8ee' : '#4a4e5c'); return 0; } },
  gavel: { vr: 8, len: 24, grips: { end: 2 }, reach: 20, fn(u, v) { if (u >= 0 && u < 18 && Math.abs(v) < 0.9) return C(v < 0 ? '#9a6a3a' : '#6a4422'); if (u >= 16 && u < 24 && Math.abs(v) < 4) return C(Math.abs(v) > 3 ? '#c9a43a' : v < -1 ? '#9a6a3a' : '#5a3420'); return 0; } },
  boombox: { vr: 12, len: 40, grips: { mid: 20 }, reach: 30, fn(u, v) { if (u < 0 || u >= 40 || v < -11 || v > 10) return 0; if (v < -8) return (u > 6 && u < 34 && v > -10.5 && (u < 8 || u > 32)) || (v > -10.5 && v < -9.5 && u >= 8 && u <= 32) ? C('#c9cdd6') : 0; for (const cu of [9, 31]) { const d = Math.hypot(u - cu, v - 1); if (d < 7) return C(d < 2 ? '#4a4a58' : d < 2.6 ? '#c9cdd6' : (Math.floor(d * 2) % 2 ? '#2a2a34' : '#1c1c24')); } if (u > 16 && u < 24 && v > -6 && v < -2) return C('#3ae0ff'); if (u > 16 && u < 24 && v > 0 && v < 6) return C((Math.floor(u) % 2) ? '#ff4d6d' : '#ffd34a'); return C(v < -6 ? '#e6e9ef' : '#a8aebb'); } },
  flyingV: { vr: 13, len: 58, grips: { neck: 9, body: 40 }, reach: 46, fn(u, v) { if (u >= 0 && u < 7 && Math.abs(v) < 2.4) return C('#18161e'); const n = neckPix(u, v, 7, 32, ROSE.M, ROSE); if (n) return n; if (u >= 30 && u < 58) { const a = Math.abs(v + (u - 30) * 0.42) < 3.4 + (u - 30) * 0.05, b = Math.abs(v - (u - 30) * 0.42) < 3.4 + (u - 30) * 0.05; if ((a || b) && !(u > 52 && Math.abs(v) < 6)) { if (u > 34 && u < 38 && Math.abs(v) < 2.5) return C(Math.floor(v * 2) % 2 ? '#18161e' : '#cfd4dd'); return C(v < -4 ? '#ff6a5a' : v < 3 ? '#d0302c' : '#7a0c18'); } } return 0; } },
  dynamite: { len: 16, grips: { mid: 6 }, reach: 10, fn(u, v) { if (u >= 0 && u < 12 && Math.abs(v) < 2) return C(Math.abs(v) < 0.6 && u > 4 && u < 7 ? '#efe3c4' : v < -0.8 ? '#ff5a5a' : '#c42032'); if (u >= 12 && u < 16 && Math.abs(v - (u - 12) * 0.3) < 0.5) return C(u > 15 ? '#fff2a8' : '#8a8494'); return 0; } },
  cane: { len: 46, grips: { end: 4 }, reach: 40, fn(u, v) { if (u >= 0 && u < 42 && Math.abs(v) < 0.8) return C(v < 0 ? '#3a3a46' : '#18161e'); const d = Math.hypot(u - 43, v); if (d < 2.6) return C(d < 1.2 ? '#ffffff' : '#c9a43a'); return 0; } },
};
INSTRUMENTS.bass = INSTRUMENTS.violin;

function drawInstrument(pb, key, x, y, angDeg, grip) {
  const I = INSTRUMENTS[key];
  if (!I) return;
  const g = typeof grip === 'number' ? grip : (I.grips[grip] ?? 0);
  const vr = I.vr || 9;
  pb.shape(x, y, angDeg * DEG, -g, I.len - g, -vr, vr, (u, v) => I.fn(u + g, v));
}

// ---------------- pose ----------------
const P = o => Object.assign({
  lean: 0, hip: [0, 0], legF: [6, 6], legB: [-6, 6], armF: [10, 30], armB: [-8, 20],
  head: [0, 0], inst: { m: 'worn' }, air: false, fx: null, hide: false, lie: false,
}, o);
function limbEnd(x, y, len, ang) { return [x + Math.sin(ang * DEG) * len, y + Math.cos(ang * DEG) * len]; }

// Teste in cache per personaggio
const _headCache = new Map();
function headBuf(look) {
  let h = _headCache.get(look.id);
  if (!h) { h = look.headSpec === 'disco' ? buildDiscoHead() : buildHead(look.headSpec); _headCache.set(look.id, h); }
  return h;
}

// Motivi sui vestiti (giacca o camicia): restituiscono un colore o 0
const TORSO_PAT = {
  studs(uu, vv, tw, to, du, vo) { return ((vv < 7 || Math.abs(du) < vo + 3.2) && (Math.floor(uu * 2) + Math.floor(vv * 2) * 3) % 7 === 0) ? C(vv < 3 ? '#ffffff' : '#c9cdd6') : 0; },
  stripes(uu, vv, tw, to, du, vo, cos) { return (Math.floor((uu + 30) * 2) % 6 === 0) ? C(cos.stripe || '#f4f2ea') : 0; },
  torn(uu, vv, tw, to, du, vo, cos, seed, s, look) { const h = _hash(Math.floor(uu * 1.4) + 17, Math.floor(vv * 0.8) + 5); if (h < 0.1) return C(shade(look.skin || '#8aa86a', 0.8)); if (h < 0.16) return C('#6a1010'); if (vv > to - 3 && Math.floor(uu * 2) % 3 === 0) return 0; return 0; },
  led(uu, vv, tw, to, du, vo, cos, seed) { const h = _hash(Math.floor(uu * 0.7), Math.floor(vv * 0.7) + seed * 13); return h < 0.12 ? C(['#3ae0ff', '#ff4fa0', '#62f08e', '#ffd34a'][Math.floor(h * 33) % 4]) : 0; },
  speaker(uu, vv, tw, to, du) { const d = Math.hypot(du + 1, vv - 14); if (d < 7) return C(d < 2 ? '#4a4a58' : d < 2.6 ? '#18161e' : d < 6.2 ? ((Math.floor(d * 2) % 2) ? '#2a2a34' : '#22222a') : '#c9cdd6'); return 0; },
  vest(uu, vv, tw, to, du, vo, cos, seed, s) { if (Math.abs(du) < 3.4 && vv > 0.5) { if (Math.abs(du) < 0.4) return C('#cfd4dd'); return shadeBand(tones(cos.shirt || '#efe3c4'), s + 0.2); } if (vv > to - 4 && Math.floor(uu * 2) % 2 === 0) return C(shade(cos.j, 0.6)); return 0; },
  sash(uu, vv, tw, to, du) { return Math.abs((uu - vv * 0.45) - 2) < 1.6 ? C(vv % 6 < 3 ? '#c42032' : '#9a1424') : 0; },
  ribs: () => 0,
};
function drawFigure(pb, look, pose, costumeKey, seed = 0) {
  const cos = COSTUMES[costumeKey] || look.costume || COSTUMES.rossa;
  const b = look.build || { h: 1, w: 1 };
  const bh = b.h * FIG_SCALE;
  const thigh = BODY.thigh * bh, shin = BODY.shin * bh, torso = BODY.torso * bh, upArm = BODY.upArm * bh, foreArm = BODY.foreArm * bh;
  const W_ = b.w * FIG_SCALE;
  // atlante fotografico ("digitalizzato"): le parti vestono la marionetta
  let TX = look.tex && Atlas.has(look.tex) ? Atlas.costumed(look.tex, costumeKey) : null;
  if (TX && look.texMode === 'evil') TX = Atlas.evil(TX);
  const S_ = (n, back) => { if (!TX) return null; const p = Atlas.part(TX, n); if (!p) return null; return back ? Object.assign(Object.create(p), { dim: 0.72 }) : p; };
  const SKIN = tones(look.skin || (TX && Atlas.skin(TX)) || '#e9b38c');
  const TR = tones(look.trousers || TROUSERS);
  const JK = tones(cos.j);
  const SH = tones(cos.shirt || '#f1efe8');
  const ox = FOOT_X, oy = FOOT_Y;

  const legPts = (leg, hx, hy) => {
    const [kx, ky] = limbEnd(hx, hy, thigh, leg[0]);
    const [fx, fy] = limbEnd(kx, ky, shin, leg[0] - leg[1]);
    return { kx, ky, fx, fy };
  };
  let hipX = ox + pose.hip[0], hipY;
  if (pose.air || pose.lie) hipY = oy - (pose.lie ? 7 : 50 * b.h) + pose.hip[1];
  else {
    const a = legPts(pose.legF, 0, 0), c2 = legPts(pose.legB, 0, 0);
    hipY = oy - 2 - Math.max(a.fy, c2.fy) + pose.hip[1];
  }
  const L = pose.lean * DEG;
  const ux = Math.cos(L), uy = Math.sin(L), vx = -Math.sin(L), vy = Math.cos(L);
  const shX = hipX - vx * torso, shY = hipY - vy * torso;
  const P2 = (u, v) => [shX + ux * u + vx * v, shY + uy * u + vy * v];

  // ---- gambe e scarpe ----
  const drawShoe = (fx, fy, sa, back) => {
    const shoe = look.shoes || 'black';
    const sp = S_('shoe', back);
    if (sp) {
      const s = pb.s, dim = back ? 0.72 : 1;
      pb.shape(fx, fy, -sa, -5, 11, -9, 2, (u, v) => { const c = sp.px(Math.floor((u + 4.5) * s), Math.floor(sp.bottom + (v - 1.5) * s)); return c ? tint32(c, dim) : 0; });
      return;
    }
    pb.shape(fx, fy, -sa, -5, 11, -4, 4, (u, v) => {
      if (v < -3 || v > 2) return 0;
      if (u > 8 && v < -1) return 0;
      if (u > 9 && v < 0) return 0;
      if (u < -3 && v < -2) return 0;
      let c;
      const top = v <= -2;
      if (shoe === 'twotone') c = (u >= 4 && v < 2) ? (top ? '#ffffff' : '#e4e2da') : (top ? '#3a3a44' : '#16161c');
      else if (shoe === 'sneaker') c = v >= 1 ? '#f0f0ea' : (top ? '#4a5068' : '#2b2f3e');
      else if (shoe === 'skate') c = v >= 1 ? '#e6e6e6' : (top ? shade(look.skateCol || '#e23b8a', 1.2) : (look.skateCol || '#e23b8a'));
      else if (shoe === 'platform') c = v >= 1 ? '#ffe27c' : (top ? '#e04aa8' : '#b8318a');
      else if (shoe === 'boot') { const bc = look.boots || '#6a3a1a'; c = v >= 1 && u < -1 ? '#18161e' : (top ? shade(bc, 1.25) : bc); if (u > 6 && v < 0) c = shade(bc, 0.8); }
      else if (shoe === 'bone') c = top ? '#efe9dc' : '#c6bfae';
      else c = top ? '#3a3a44' : '#16161c';
      if (v === 2) c = shoe === 'sneaker' ? '#d4d4cc' : '#0c0c10';
      if (shoe === 'black' && look.tassel && u === 5 && v === -2) c = '#b88a44';
      if (back) c = shade(c, 0.72);
      return C(c);
    });
    if (shoe === 'skate') { const k = back ? '#a8901e' : '#ffd34a'; pb.disc(fx - 2 + Math.sin(sa) * 4, fy + 4, 1.6, C(k)); pb.disc(fx + 6 + Math.sin(sa) * 4, fy + 4 - Math.sin(sa) * 6, 1.6, C(k)); }
    if (shoe === 'platform') pb.shape(fx, fy, -sa, -4, 10, 2, 6, (u, v) => C(v < 4 ? '#ffe27c' : '#c99a1e'));
  };
  const drawLeg = (leg, back) => {
    const [hx, hy] = [hipX + ux * (back ? -3 : 3), hipY + uy * (back ? -3 : 3)];
    const { kx, ky, fx, fy } = legPts(leg, hx, hy);
    const T = back ? { L: TR.M, M: TR.S, S: TR.D, D: TR.D } : TR;
    drawLimb(pb, hx, hy, kx, ky, 12 * W_, 10 * W_, T, back ? -0.2 : 0, !back && !TX, S_('thigh', back));
    drawLimb(pb, kx, ky, fx, fy, 10 * W_, 8, T, back ? -0.2 : 0, !back && !TX, S_('shin', back));
    if (look.boots && !TX) { const BT = tones(look.boots), bt = back ? { L: BT.M, M: BT.S, S: BT.D, D: BT.D } : BT; drawLimb(pb, kx + (fx - kx) * 0.45, ky + (fy - ky) * 0.45, fx, fy, 10.5 * W_, 9, bt, back ? -0.2 : 0, false); }
    if (look.socks && !back) { pb.set(fx - 1, fy - 1, C(look.socks)); pb.set(fx, fy - 1, C('#a8a8b0')); }
    drawShoe(fx, fy, (leg[0] - leg[1]) * DEG, back);
  };

  // ---- braccia ----
  const handAt = {};
  const armGeo = (arm, back) => {
    const [sx, sy] = P2(back ? -3 : 2, 3);
    const [ex, ey] = limbEnd(sx, sy, upArm, arm[0]);
    const [hx, hy] = limbEnd(ex, ey, foreArm, arm[0] + arm[1]);
    handAt[back ? 'B' : 'F'] = [hx, hy];
    return { sx, sy, ex, ey, hx, hy, arm };
  };
  const geoB = armGeo(pose.armB, true), geoF = armGeo(pose.armF, false);
  const drawArm = (g, back) => {
    const { sx, sy, ex, ey, hx, hy, arm } = g;
    const dim = T => back ? { L: T.M, M: T.S, S: T.D, D: T.D } : T;
    const sk = dim(SKIN), jk = dim(JK);
    const fAng = (arm[0] + arm[1]) * DEG;
    const fdx = Math.sin(fAng), fdy = Math.cos(fAng);
    if (TX) {
      drawLimb(pb, sx, sy, ex, ey, 10 * W_, 8.5, jk, 0, false, S_('upArm', back));
      drawLimb(pb, ex, ey, hx - fdx * 2.5, hy - fdy * 2.5, 8.5, 7, jk, 0, false, S_('foreArm', back));
    } else if ((cos.kind === 'shirt' || cos.kind === 'tee') && look.shortSleeve !== false) {
      const [mx, my] = limbEnd(sx, sy, upArm * 0.62, arm[0]);
      drawLimb(pb, mx, my, ex, ey, 6.5, 6, sk);
      drawLimb(pb, ex, ey, hx - fdx * 2, hy - fdy * 2, 6, 5, sk);
      drawLimb(pb, sx, sy, mx, my, 9 * W_, 8.5, cos.sleeve ? dim(tones(cos.sleeve)) : jk);
    } else {
      drawLimb(pb, sx, sy, ex, ey, 10 * W_, 8.5, jk);
      drawLimb(pb, ex, ey, hx - fdx * 3, hy - fdy * 3, 8.5, 7.5, jk);
      if (cos.kind === 'jacket') { const c = dim(SH); drawLimb(pb, hx - fdx * 3, hy - fdy * 3, hx - fdx * 1.5, hy - fdy * 1.5, 6, 6, c); }
    }
    const glove = look.glove ? dim(tones(look.glove)) : sk;
    drawFist(pb, hx, hy, Math.atan2(fdy, fdx), glove);
  };

  // ---- busto ----
  const drawTorso = () => {
    const tw = 11.5 * W_, uc = tw * 0.3;
    const tp = S_('torso');
    const hem = tp ? (look.hem ?? 8) : cos.kind === 'jacket' ? (cos.long ? 16 : 3) : 0;
    const belly = look.belly || 0;   // pancia: la sagoma si allarga a metà busto
    pb.shape(shX, shY, L, -tw - 1 - belly, tw + 1 + belly, -3, torso + hem + 1, (u, v) => {
      const uu = u + 0.5, vv = v + 0.5;
      // sagoma: spalle arrotondate, vita stretta
      let half = tw;
      if (vv < 4) half = tw - (4 - vv) * 1.1;
      else if (cos.long && vv > torso) half = tw - torso * 0.45 * 0.12 * 0.4 + (vv - torso) * 0.3;
      else if (vv > torso * 0.55) half = tw - (vv - torso * 0.55) * 0.12 * (cos.kind === 'jacket' ? 0.4 : 1);
      if (belly && vv > 6) half += belly * Math.sin(Math.PI * clamp((vv - 6) / (torso + hem - 6), 0, 1)) ** 1.3;
      if (Math.abs(uu - 0.3) > half) return 0;
      if (vv < -2) return 0;
      if (look.body) return look.body(u, v, tw, torso, cos, seed);
      // luce: davanti e in alto
      const s = (uu / tw) * 0.75 - (vv / torso) * 0.25 + 0.05;
      if (tp) {
        const hh = Math.max(half, 1);
        const i = Math.min(tp.w - 1, Math.max(0, Math.floor(((uu - 0.3) / hh * 0.5 + 0.5) * tp.w))), j = Math.min(tp.h - 1, Math.max(0, Math.floor(vv / (torso + hem) * tp.h)));
        const c = tp.px(i, j); return c ? tint32(c, 1 + s * 0.15) : 0;
      }
      if (cos.kind === 'tee') {
        // maglietta / camicia semplice dei nemici: girocollo, cintura, eventuale motivo
        const du = uu - uc;
        if (vv > torso - 2) return C(Math.abs(du) < 1.5 ? '#cfd4dd' : (vv > torso - 1 ? '#0c0c10' : (cos.belt || '#18161e')));
        if (vv < 2.4 && Math.abs(du) < 3.4 - vv * 0.7) return vv < 1.4 ? SKIN.M : JK.D;
        let c = shadeBand(JK, s);
        if (cos.sparkle) { const h = _hash(Math.round(uu * 2) + seed * 7, Math.round(vv) + seed * 3); if (h < 0.09) c = C('#fff6c8'); else if (h < 0.2) c = JK.L; }
        if (cos.pat) { const r = TORSO_PAT[cos.pat](uu, vv, tw, torso, du, 0, cos, seed, s, look); if (r) c = r; }
        return c;
      }
      if (cos.kind === 'shirt') {
        if (vv > torso - 2) return C(Math.abs(uu - uc) < 1.5 ? '#cfd4dd' : (vv > torso - 1 ? '#0c0c10' : cos.belt));
        const yokeEdge = 9 - Math.max(0, 3 - Math.abs(uu - uc) * 0.9) * -1 + (Math.abs(uu - uc) < 3 ? 3 - Math.abs(uu - uc) : 0);
        if (Math.abs(uu - uc) < 0.6 && vv > 1) return C(Math.round(vv) % 5 === 0 ? cos.btn : '#2c818c');
        if (vv < yokeEdge) {
          if (vv > yokeEdge - 1) return C(cos.pipe);
          // stampa: razzo e pianeta
          if (uu > uc + 1.5 && uu < uc + 6.5 && vv > 3 && vv < 5.2) return C(uu > uc + 5.5 ? '#ffffff' : cos.rocket);
          if (uu > uc + 0.5 && uu < uc + 1.6 && vv > 3.4 && vv < 4.8) return C('#ffd34a');
          if (Math.hypot(uu - (-4), vv - 4.2) < 1.7) return C(cos.planet);
          if (vv > 3.8 && vv < 4.6 && uu > -6.8 && uu < -1.4) return C('#8a5ad0');
          if ((Math.round(uu * 3 + vv * 7) % 23 === 0)) return C('#ffffff');
          const Y = tones(cos.yoke || cos.j); return shadeBand(Y, s);
        }
        let c = shadeBand(JK, s);
        if (cos.pat) { const r = TORSO_PAT[cos.pat](uu, vv, tw, torso, uu - uc, 0, cos, seed, s, look); if (r) c = r; }
        return c;
      }
      // giacca: apertura a V con camicia e cravatta, revers neri
      const vOpen = vv < 17 ? (1 - vv / 17) * 4.2 + 0.4 : 0;
      const du = uu - uc;
      if (vOpen > 0 && Math.abs(du) < vOpen) {
        if (cos.pat === 'ribs') return C((Math.floor(vv * 2) % 3 === 0 && Math.abs(du) < vOpen - 0.4) ? '#efe9dc' : (Math.abs(du) < 0.5 ? '#c6bfae' : '#1a1418'));
        if (look.tie === 'none') return shadeBand(SH, s + 0.2);
        if (look.tie === 'bolo') { if (Math.abs(du) < 0.6 && vv > 2) return C(vv > 4 && vv < 6 ? '#cfd4dd' : '#18161e'); }
        else if (look.tie === 'check') { if (Math.abs(du) < 1.1 && vv > 1) return C(((Math.round(vv) + (du > 0 ? 1 : 0)) % 2) ? '#f4f2ea' : '#18161e'); }
        else if (Math.abs(du) < (vv < 3 ? 1.4 : 0.95) && vv > 0.5) return C(du < -0.3 ? '#3a3a44' : cos.tie);
        return shadeBand(SH, s + 0.2);
      }
      if (vOpen > 0 && Math.abs(du) < vOpen + 2.2) return C(Math.abs(du) < vOpen + 0.8 ? '#4a4a58' : cos.lap); // revers in raso
      if (vv > 16.5 && vv < 18.5 && Math.abs(du) < 1.2) return C('#18161e');                         // bottone
      if (cos.flap && vv > 21 && vv < 22.6 && uu > -5 && uu < 2) return C(cos.flap);                  // tasca
      let c = shadeBand(JK, s);
      if (vv > torso + hem - 1.5) c = JK.D;
      if (cos.sparkle) { const h = _hash(Math.round(uu * 2) + seed * 7, Math.round(vv) + seed * 3); if (h < 0.09) c = C('#fff6c8'); else if (h < 0.2) c = JK.L; else if (h > 0.9) c = JK.S; }
      if (cos.pat) { const r = TORSO_PAT[cos.pat](uu, vv, tw, torso, du, vOpen, cos, seed, s, look); if (r) c = r; }
      return c;
    });
  };

  // ---- testa ----
  const drawHead = () => {
    const [nx, ny] = P2(1.5, -1);
    const hp = S_('head');
    if (hp) {
      const s = pb.s;
      if (pose.lie) pb.shape(nx, ny, L, -hp.ax / s, (hp.w - hp.ax) / s, -hp.ay / s, (hp.h - hp.ay) / s, (u, v) => hp.px(Math.floor(u * s + hp.ax), Math.floor(v * s + hp.ay)));
      else {
        const X0 = Math.round((nx + pose.head[0]) * s - hp.ax), Y0 = Math.round((ny + pose.head[1]) * s - hp.ay);
        for (let j = 0; j < hp.h; j++) for (let i = 0; i < hp.w; i++) { const c = hp.px(i, j); if (c) pb.setHi(X0 + i, Y0 + j, c); }
      }
      return;
    }
    const hb = headBuf(look);
    if (pose.lie) {
      pb.shape(nx, ny, L, -HEAD_AX, HEAD_W - HEAD_AX, -HEAD_AY, HEAD_H - HEAD_AY, (u, v) => hb.get(u + HEAD_AX, v + HEAD_AY));
    } else {
      const s = pb.s;
      pb.blitBuf(hb, Math.round((nx - HEAD_AX + pose.head[0]) * s), Math.round((ny - HEAD_AY + pose.head[1]) * s));
    }
  };

  const instKey = look.instrument;
  const inst = pose.inst || { m: 'worn' };
  const drawInst = () => {
    if (inst.m === 'none') {
      // i nemici armati tengono il loro oggetto in mano anche quando non attaccano
      if (look.carry && instKey) { const h = handAt[look.carry.h || 'F']; if (h) drawInstrument(pb, instKey, h[0], h[1], look.carry.a + (pose.lean || 0) * 0.3, look.carry.g ?? 0); }
      return;
    }
    if (inst.kThrow) { const h = handAt[inst.h || 'B']; if (h) drawInstrument(pb, look.throwItem || 'vinyl', h[0], h[1], inst.a, 'mid'); return; }
    if (!instKey) return;
    if (inst.m === 'worn') {
      const w = look.worn || { u: 3, v: 18, a: 162, g: 'body' };
      const [x, y] = P2(w.u, w.v);
      drawInstrument(pb, instKey, x, y, w.a + pose.lean * 0.5, w.g);
    } else if (inst.m === 'hand') {
      const h = handAt[inst.h || 'F'];
      if (!h) return;
      drawInstrument(pb, inst.k || instKey, h[0], h[1], inst.a, inst.g ?? 0);
      if (inst.k2) { const h2 = handAt[inst.h === 'B' ? 'F' : 'B']; if (h2) drawInstrument(pb, inst.k2, h2[0], h2[1], inst.a2 ?? inst.a, inst.g ?? 0); }
    } else if (inst.m === 'at') {
      drawInstrument(pb, inst.k || instKey, ox + inst.x, oy + inst.y, inst.a, inst.g ?? 0);
    }
  };

  // arma raccolta nella mano davanti (lo strumento resta a tracolla)
  const wpn = pose.wpn;
  const drawWpn = () => { const h = handAt[wpn.h || 'F']; if (h) drawInstrument(pb, wpn.k, h[0], h[1], wpn.a, wpn.g ?? 0); };

  if (pose.hide) return;
  if (look.cape) look.cape(pb, P2, pose, seed);
  if (wpn && wpn.behind) drawWpn();
  drawArm(geoB, true);
  drawLeg(pose.legB, true);
  drawLeg(pose.legF, false);
  drawTorso();
  if (inst.behind) drawInst();
  drawHead();
  if (look.headFx) look.headFx(pb, P2, seed);
  if (!inst.behind && !inst.front) drawInst();
  if (wpn && !wpn.behind) drawWpn();
  drawArm(geoF, false);
  if (inst.front) drawInst();
}

// ---------------- scie dei colpi (dopo il contorno) ----------------
function drawFx(pb, fx, b = 1) {
  if (!fx) return;
  const c1 = col('#fffbe6', 240), c2 = col('#ffe08a', 200), c3 = col('#ff9a3a', 130);
  const k = 1.6 * b, s = pb.s;
  const cx = FOOT_X + (fx.x || 4) * k, cy = FOOT_Y - (fx.y || 34) * k;
  const r = (fx.r || 26) * k;
  for (let a = fx.a0; a <= fx.a1; a += 0.5) {
    const ar = a * DEG, prog = (a - fx.a0) / Math.max(1, fx.a1 - fx.a0);
    const w = Math.max(1, (fx.w || 3) * 1.4 * Math.sin(prog * Math.PI) + 1);
    for (let t = 0; t < w; t += 1 / s) {
      const rr = r - t;
      pb.dot(cx + Math.sin(ar) * rr, cy - Math.cos(ar) * rr, t < 0.6 ? c1 : t < w - 1 ? c2 : c3);
    }
  }
}

// ---------------- cache dei frame (ritagliati) ----------------
const _frameCache = new Map();
function getFrame(look, costume, pose, key, seed = 0) {
  const k = look.id + '|' + costume + '|' + key;
  let f = _frameCache.get(k);
  if (f) return f;
  const pb = new PixBuf(FRAME_W, FRAME_H, RS);
  drawFigure(pb, look, pose, costume, seed);
  pb.outlineSel(OUTLINE, 0.74);
  drawFx(pb, pose.fx, (look.build && look.build.h) || 1);
  const bb = pb.bbox() || { x0: FOOT_X * RS, y0: FOOT_Y * RS, x1: FOOT_X * RS, y1: FOOT_Y * RS };
  const cp = pb.crop(bb);
  const cv = cp.toCanvas();
  f = { cv, ox: FOOT_X * RS - bb.x0, oy: FOOT_Y * RS - bb.y0, flash: null, _w: cp };
  _frameCache.set(k, f);
  _frameTouch(k);
  return f;
}
function frameFlash(f) { if (!f.flash) { const w = PixBuf.hi(f._w.W, f._w.H, RS); w.d.set(f._w.d); w.silhouette(col('#ffffff')); f.flash = w.toCanvas(); f._w = null; } return f.flash; }
// limite di memoria: i frame usati meno di recente vengono scartati (e rigenerati se servono)
let _frameTick = 0;
const FRAME_CACHE_MAX = 1000;
function _frameTouch(k) {
  const f = _frameCache.get(k); if (f) f.t = ++_frameTick;
  if (_frameCache.size > FRAME_CACHE_MAX) {
    const arr = [..._frameCache.entries()].sort((a, b) => a[1].t - b[1].t);
    for (let i = 0; i < 150; i++) _frameCache.delete(arr[i][0]);
  }
}

function drawSprite(ctx, frame, sx, sy, facing, opts = {}) {
  const img = opts.flash ? frameFlash(frame) : frame.cv;
  frame.t = ++_frameTick;
  const x = Math.round(sx * RS) / RS, y = Math.round(sy * RS) / RS;
  const w = img.width / RS, h = img.height / RS, ox = frame.ox / RS, oy = frame.oy / RS;
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  if (facing < 0) {
    ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1);
    ctx.drawImage(img, -ox, y - oy, w, h);
    ctx.restore();
  } else ctx.drawImage(img, x - ox, y - oy, w, h);
  if (opts.alpha !== undefined) ctx.globalAlpha = 1;
}
