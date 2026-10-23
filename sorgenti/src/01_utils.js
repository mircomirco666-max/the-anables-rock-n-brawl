// ============================================================
// Utilità: matematica, colori, rasterizzatore pixel-perfect
// ============================================================
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const chance = p => Math.random() < p;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
const DEG = Math.PI / 180;

// Colore esadecimale -> Uint32 little-endian per ImageData
const _colCache = new Map();
function col(hex, alpha = 255) {
  const key = hex + alpha;
  let c = _colCache.get(key);
  if (c !== undefined) return c;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  c = ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0;
  _colCache.set(key, c);
  return c;
}
function shade(hex, f) { // f<1 scurisce, f>1 schiarisce
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const ch = i => clamp(Math.round(parseInt(h.slice(i, i + 2), 16) * f), 0, 255).toString(16).padStart(2, '0');
  return '#' + ch(0) + ch(2) + ch(4);
}
function mix(h1, h2, t) {
  const p = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const a = p(h1), b = p(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// ---------- Rasterizzatore su buffer: niente antialiasing, pixel netti ----------
// Le coordinate dei metodi sono nelle unità del mondo; il buffer interno ha "s" pixel
// fini per unità (s = RS = 2 per gli sprite): le forme geometriche vengono campionate
// alla risoluzione fine, così contorni e curve diventano più dettagliati.
class PixBuf {
  constructor(w, h, s = 1) { this.s = s; this.w = w; this.h = h; this.W = Math.max(1, Math.ceil(w * s)); this.H = Math.max(1, Math.ceil(h * s)); this.d = new Uint32Array(this.W * this.H); }
  static hi(W, H, s) { const p = new PixBuf(W / s, H / s, s); if (p.W !== W || p.H !== H) { p.W = W; p.H = H; p.d = new Uint32Array(W * H); } return p; }
  setHi(X, Y, c) {
    if (X < 0 || Y < 0 || X >= this.W || Y >= this.H || !c) return;
    this.d[Y * this.W + X] = c;
  }
  getHi(X, Y) { if (X < 0 || Y < 0 || X >= this.W || Y >= this.H) return 0; return this.d[Y * this.W + X]; }
  // pixel "grosso" (un'unità del mondo)
  set(x, y, c) {
    const s = this.s;
    if (s === 1) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.W || y >= this.H || !c) return; this.d[y * this.W + x] = c; return; }
    const X0 = Math.floor(x * s), Y0 = Math.floor(y * s);
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) this.setHi(X0 + i, Y0 + j, c);
  }
  // punto fine (un pixel ad alta risoluzione)
  dot(x, y, c) { this.setHi(Math.floor(x * this.s), Math.floor(y * this.s), c); }
  get(x, y) { return this.getHi(Math.floor(x * this.s), Math.floor(y * this.s)); }
  rect(x, y, w, h, c) {
    const s = this.s, X0 = Math.floor(Math.floor(x) * s), Y0 = Math.floor(Math.floor(y) * s), X1 = X0 + Math.round(w * s), Y1 = Y0 + Math.round(h * s);
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) this.setHi(X, Y, c);
  }
  // rettangolo con coordinate libere (anche mezze unità)
  rectF(x, y, w, h, c) {
    const s = this.s, X0 = Math.round(x * s), Y0 = Math.round(y * s), X1 = Math.round((x + w) * s), Y1 = Math.round((y + h) * s);
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) this.setHi(X, Y, c);
  }
  disc(cx, cy, r, c) {
    const s = this.s, rr = r * r + r * 0.6, ox = Math.floor(cx) + 0.5, oy = Math.floor(cy) + 0.5;
    const X0 = Math.floor((ox - r - 1.5) * s), X1 = Math.ceil((ox + r + 1.5) * s), Y0 = Math.floor((oy - r - 1.5) * s), Y1 = Math.ceil((oy + r + 1.5) * s);
    for (let Y = Y0; Y < Y1; Y++) { const dy = (Y + 0.5) / s - oy; for (let X = X0; X < X1; X++) { const dx = (X + 0.5) / s - ox; if (dx * dx + dy * dy <= rr) this.setHi(X, Y, c); } }
  }
  ellipse(cx, cy, rx, ry, c) {
    const s = this.s, ox = Math.floor(cx) + 0.5, oy = Math.floor(cy) + 0.5, ax = rx * rx + 0.3, ay = ry * ry + 0.3;
    const X0 = Math.floor((ox - rx - 1.5) * s), X1 = Math.ceil((ox + rx + 1.5) * s), Y0 = Math.floor((oy - ry - 1.5) * s), Y1 = Math.ceil((oy + ry + 1.5) * s);
    for (let Y = Y0; Y < Y1; Y++) { const dy = (Y + 0.5) / s - oy; for (let X = X0; X < X1; X++) { const dx = (X + 0.5) / s - ox; if (dx * dx / ax + dy * dy / ay <= 1) this.setHi(X, Y, c); } }
  }
  stampHi(X, Y, w, c) {
    const o = Math.floor((w - 1) / 2);
    for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) {
      if (w >= 4 && (i === 0 || i === w - 1) && (j === 0 || j === w - 1)) continue;
      this.setHi(X - o + i, Y - o + j, c);
    }
  }
  stamp(x, y, w, c) { const s = this.s; this.stampHi(Math.floor(x * s) + (s >> 1), Math.floor(y * s) + (s >> 1), Math.max(1, Math.round(w * s)), c); }
  line(x0, y0, x1, y1, c, w = 1) {
    const s = this.s, sw = Math.max(1, Math.round(w * s));
    let X0 = Math.round(x0 * s + (s >> 1)), Y0 = Math.round(y0 * s + (s >> 1)); const X1 = Math.round(x1 * s + (s >> 1)), Y1 = Math.round(y1 * s + (s >> 1));
    const dx = Math.abs(X1 - X0), dy = -Math.abs(Y1 - Y0);
    const sx = X0 < X1 ? 1 : -1, sy = Y0 < Y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 2400; guard++) {
      this.stampHi(X0, Y0, sw, c);
      if (X0 === X1 && Y0 === Y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; X0 += sx; }
      if (e2 <= dx) { err += dx; Y0 += sy; }
    }
  }
  // Forma ruotata definita da una funzione locale (u lungo l'asse, v perpendicolare).
  // fn riceve u, v nelle unità del mondo, quantizzate al passo del pixel fine (1/s).
  shape(cx, cy, ang, u0, u1, v0, v1, fn) {
    const s = this.s, c = Math.cos(ang), sn = Math.sin(ang);
    const pts = [[u0, v0], [u1, v0], [u0, v1], [u1, v1]].map(([u, v]) => [cx + u * c - v * sn, cy + u * sn + v * c]);
    const minX = Math.floor((Math.min(...pts.map(p => p[0])) - 1) * s), maxX = Math.ceil((Math.max(...pts.map(p => p[0])) + 1) * s);
    const minY = Math.floor((Math.min(...pts.map(p => p[1])) - 1) * s), maxY = Math.ceil((Math.max(...pts.map(p => p[1])) + 1) * s);
    for (let Y = minY; Y <= maxY; Y++) for (let X = minX; X <= maxX; X++) {
      const dx = (X + 0.5) / s - cx, dy = (Y + 0.5) / s - cy;
      const u = dx * c + dy * sn, v = -dx * sn + dy * c;
      if (u < u0 || u >= u1 || v < v0 || v >= v1) continue;
      const cc = fn(Math.floor(u * s) / s, Math.floor(v * s) / s);
      if (cc) this.setHi(X, Y, cc);
    }
  }
  // Riempie un rettangolo chiedendo il colore di ogni pixel fine: fn(u, v) con u, v locali in unità del mondo
  fill(x, y, w, h, fn) {
    const s = this.s, X0 = Math.round(x * s), Y0 = Math.round(y * s), WW = Math.round(w * s), HH = Math.round(h * s);
    for (let j = 0; j < HH; j++) for (let i = 0; i < WW; i++) { const c = fn(i / s, j / s); if (c) this.setHi(X0 + i, Y0 + j, c); }
  }
  // Mappa di caratteri -> pixel (con flip orizzontale opzionale)
  blit(map, pal, x, y, flip = false) {
    for (let j = 0; j < map.length; j++) {
      const row = map[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c) this.set(flip ? x + row.length - 1 - i : x + i, y + j, c);
      }
    }
  }
  // copia un altro buffer (stessa scala) con offset in pixel fini
  blitBuf(src, X0, Y0) { for (let Y = 0; Y < src.H; Y++) for (let X = 0; X < src.W; X++) { const c = src.d[Y * src.W + X]; if (c) this.setHi(X0 + X, Y0 + Y, c); } }
  // Contorno scuro di 1 pixel fine attorno alla sagoma
  outline(c) {
    const w = this.W, h = this.H, d = this.d;
    const src = d.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      if ((x > 0 && src[y * w + x - 1]) || (x < w - 1 && src[y * w + x + 1]) ||
        (y > 0 && src[(y - 1) * w + x]) || (y < h - 1 && src[(y + 1) * w + x])) d[y * w + x] = c;
    }
  }
  // Contorno selettivo (stile CPS): ogni bordo prende una versione scura del colore vicino
  outlineSel(base = '#0d0a12', k = 0.58) {
    const w = this.W, h = this.H, d = this.d;
    const src = d.slice();
    const br = (base.replace('#', '').match(/../g) || ['0d', '0a', '12']).map(v => parseInt(v, 16));
    const cache = new Map();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      let n = 0;
      if (y < h - 1 && src[(y + 1) * w + x]) n = src[(y + 1) * w + x];
      else if (x > 0 && src[y * w + x - 1]) n = src[y * w + x - 1];
      else if (x < w - 1 && src[y * w + x + 1]) n = src[y * w + x + 1];
      else if (y > 0 && src[(y - 1) * w + x]) n = src[(y - 1) * w + x];
      if (!n) continue;
      let c = cache.get(n);
      if (c === undefined) {
        const r = n & 255, g = (n >> 8) & 255, b = (n >> 16) & 255;
        const R = Math.round(r * (1 - k) * 0.55 + br[0] * k), Gg = Math.round(g * (1 - k) * 0.55 + br[1] * k), B = Math.round(b * (1 - k) * 0.55 + br[2] * k);
        c = ((255 << 24) | (B << 16) | (Gg << 8) | R) >>> 0;
        cache.set(n, c);
      }
      d[y * w + x] = c;
    }
  }
  bbox() {
    const w = this.W, h = this.H, d = this.d; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) if (d[row + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }
  // ritaglio in pixel fini
  crop(b) {
    const out = PixBuf.hi(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, this.s);
    for (let y = 0; y < out.H; y++) out.d.set(this.d.subarray((y + b.y0) * this.W + b.x0, (y + b.y0) * this.W + b.x0 + out.W), y * out.W);
    return out;
  }
  silhouette(c) { for (let i = 0; i < this.d.length; i++) if (this.d[i]) this.d[i] = c; }
  toCanvas() {
    const [cv, ctx] = makeCanvas(this.W, this.H);
    const img = new ImageData(new Uint8ClampedArray(this.d.buffer.slice(0)), this.W, this.H);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}
// Disegna una tela ad alta risoluzione nelle coordinate del mondo (1 unità = RS pixel fini)
function blitHi(ctx, cv, x, y, flip = false) {
  const w = cv.width / RS, h = cv.height / RS;
  x = Math.round(x * RS) / RS; y = Math.round(y * RS) / RS;
  if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(cv, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(cv, x, y, w, h);
}

// Palette da oggetto {chiave: '#hex'} a {chiave: u32}
function palU32(p) { const o = {}; for (const k in p) o[k] = p[k] ? col(p[k]) : 0; return o; }

// Archiviazione sicura (localStorage può fallire in modalità privata o anteprima)
const Store = {
  key: 'anables_rnb_v1',
  load() {
    try { const s = localStorage.getItem(this.key); if (s) { const o = JSON.parse(s); if (o && o.version === 1) return o; } } catch (e) { }
    return { version: 1, scores: [], options: {} };
  },
  save(o) { try { localStorage.setItem(this.key, JSON.stringify(o)); } catch (e) { } },
};
