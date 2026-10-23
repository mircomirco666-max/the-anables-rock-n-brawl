// ============================================================
// LIVELLI: sistema generico guidato dai dati (zone, ondate, oggetti, boss)
// e kit di disegno per i fondali procedurali ad alta risoluzione.
// Livello 1 "Notte al Neon": strada di negozi inventati e GLITTER CLUB.
// ============================================================
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const BASE_Y = 132;   // base delle facciate = inizio del marciapiede
// Negozi inventati (nessun marchio reale)
const SHOPS = {
  bar: { sign: 'BAR ORBITA', neon: '#3ae0ff', wall: '#3e2c52', awn: ['#8a3ad2', '#f1ead8'], tall: true },
  pizza: { sign: 'PIZZERIA', neon: '#ff5a4a', wall: '#7a3a2c', awn: ['#c8302c', '#f1ead8'], tall: false },
  dischi: { sign: 'DISCHI', neon: '#62f08e', wall: '#34465e', awn: ['#22a060', '#f1ead8'], tall: true },
  sala: { sign: 'SALA GIOCHI', neon: '#ffd23e', wall: '#2c2a48', awn: null, tall: true },
  diner: { sign: 'DINER 24H', neon: '#ff7ad9', wall: '#b8ae98', awn: ['#2a7ac8', '#f1ead8'], tall: false, stucco: true },
  barbiere: { sign: 'BARBIERE', neon: '#3ae0ff', wall: '#5e4232', awn: ['#c8302c', '#f1ead8'], tall: true },
  garage: { sign: 'AUTORIMESSA', neon: '#ff9b45', wall: '#4e4e5a', awn: null, tall: false, stucco: true },
  tabacchi: { sign: 'TABACCHI', neon: '#7aa8ff', wall: '#54402c', awn: ['#2a4a9a', '#f1ead8'], tall: true },
  motel: { sign: 'MOTEL LUNA', neon: '#ffd23e', wall: '#2c4a44', awn: ['#c8902a', '#3a2410'], tall: true },
  cinema: { sign: 'CINEMA', neon: '#ff5a4a', wall: '#5a2a3a', awn: null, tall: true },
  gelati: { sign: 'GELATERIA', neon: '#ff9ad9', wall: '#c89aa8', awn: ['#e86a9a', '#f1ead8'], tall: false, stucco: true },
  strumenti: { sign: 'STRUMENTI', neon: '#ffd23e', wall: '#3a2a22', awn: ['#1a1a22', '#c9a43a'], tall: true },
  lavanderia: { sign: 'LAVANDERIA', neon: '#3ae0ff', wall: '#2a5a5a', awn: null, tall: false, stucco: true },
};
const L1_STREET = ['bar', 'pizza', 'vicolo', 'dischi', 'sala', 'diner', 'vicolo', 'barbiere', 'garage', 'tabacchi', 'vicolo', 'motel', 'cinema', 'gelati', 'vicolo', 'strumenti', 'lavanderia', 'vicolo', 'bar'];

// ---------- strumenti di disegno per i fondali ----------
const _bgTones = new Map();
function T4(hex) {
  let t = _bgTones.get(hex);
  if (!t) { t = [mix(shade(hex, 1.28), '#fff0d8', 0.1), hex, mix(shade(hex, 0.72), '#2a1446', 0.2), mix(shade(hex, 0.46), '#120822', 0.34)]; _bgTones.set(hex, t); }
  return t;
}
const BF = (m, x, y, w, h, c) => { m.fillStyle = c; m.fillRect(Math.round(x * RS) / RS, Math.round(y * RS) / RS, Math.round(w * RS) / RS, Math.round(h * RS) / RS); };
// tela per i fondali: alta risoluzione, si disegna in unità del mondo
function bgCanvas(w, h) { const [c, x] = makeCanvas(Math.ceil(w * RS), Math.ceil(h * RS)); x.setTransform(RS, 0, 0, RS, 0, 0); x.imageSmoothingEnabled = false; return [c, x]; }
function bgDither(m, x, y, w, h, c, ph = 0) { m.fillStyle = c; const s = 1 / RS; x = Math.round(x * RS) / RS; y = Math.round(y * RS) / RS; for (let j = 0, r = 0; j < h; j += s, r++) for (let i = ((r + ph) & 1) * s; i < w; i += 2 * s) m.fillRect(x + i, y + j, s, s); }
// colonna di pietra con luce da sinistra
function bgPilaster(m, x, y0, y1, w, stone) {
  const [L, M, S, D] = T4(stone);
  BF(m, x, y0, w, y1 - y0, M); BF(m, x, y0, 2, y1 - y0, L); BF(m, x + w - 3, y0, 2, y1 - y0, S); BF(m, x + w - 1, y0, 1, y1 - y0, D);
  BF(m, x - 1, y0, w + 2, 4, L); BF(m, x - 1, y0 + 4, w + 2, 1, D);          // capitello
  BF(m, x - 1, y1 - 7, w + 2, 7, S); BF(m, x - 1, y1 - 7, w + 2, 1, L);       // zoccolo
  for (let y = y0 + 9; y < y1 - 9; y += 11) BF(m, x + 2, y, w - 4, 1, S);     // giunti
}
// muro di mattoni
function bgBricks(m, x, y0, w, y1, wall, rnd) {
  const [L, M, S, D] = T4(wall);
  BF(m, x, y0, w, y1 - y0, M);
  let row = 0;
  for (let y = y0; y < y1; y += 5, row++) {
    BF(m, x, y + 4, w, 1, D); BF(m, x, y + 4, w, 0.5, S);
    const off = row % 2 ? 6 : 0;
    for (let bx = x - off; bx < x + w; bx += 12) {
      const cx = Math.max(x, bx), cw = Math.min(x + w, bx + 12) - cx;
      if (cw <= 0) continue;
      BF(m, bx, y, 0.5, 4, D); BF(m, bx + 0.5, y, 0.5, 4, S);
      const r = rnd();
      if (r < 0.22) BF(m, cx + 1, y + 1, cw - 1, 3, S); else if (r > 0.9) BF(m, cx + 1, y + 1, cw - 1, 3, mix(M, L, 0.5));
      BF(m, cx + 1, y, cw - 1, 0.5, L);
    }
  }
}
// intonaco con grana
function bgStucco(m, x, y0, w, y1, wall, rnd) {
  const [L, M, S] = T4(wall);
  BF(m, x, y0, w, y1 - y0, M);
  for (let i = 0; i < w * (y1 - y0) * 0.3; i++) BF(m, x + Math.floor(rnd() * w * 2) / 2, y0 + Math.floor(rnd() * (y1 - y0) * 2) / 2, 0.5, 0.5, rnd() < 0.5 ? S : L);
}
// vetro con riflessi diagonali
function bgGlassShine(m, x, y, w, h) {
  m.save(); m.beginPath(); m.rect(x, y, w, h); m.clip();
  m.fillStyle = 'rgba(255,255,255,0.10)';
  for (let k = 0; k < h; k += 0.5) { m.fillRect(Math.round((x + w * 0.2 + k * 0.7) * 2) / 2, y + k, 8, 0.5); m.fillRect(Math.round((x + w * 0.62 + k * 0.7) * 2) / 2, y + k, 3, 0.5); }
  m.fillStyle = 'rgba(255,255,255,0.22)';
  for (let k = 0; k < h; k += 0.5) m.fillRect(Math.round((x + w * 0.2 + k * 0.7 + 9) * 2) / 2, y + k, 0.5, 0.5);
  m.restore();
}

// Auto anni '50 generica (vista di lato, muso a sinistra): pinne posteriori, cromature, gomme a fascia bianca
function carSprite(body = '#3ab8b0', roof = '#f1ead8') {
  const Wc = 152, Hc = 48;
  const pb = new PixBuf(Wc + 2, Hc + 2, RS);
  const [bL, bM, bS, bD] = T4(body).map(c => col(c)), [rL, rM, rS] = T4(roof).map(c => col(c));
  const CHL = col('#f4f6fa'), CHM = col('#b8bec9'), CHS = col('#6c7280'), GL = col('#22304c'), GLL = col('#5a78a8');
  const wheels = [[31, 39], [119, 39]];
  pb.fill(1, 1, Wc, Hc, (u, v) => {
    const uc = u + 0.25, vc = v + 0.25;
    for (const [wx, wy] of wheels) {
      const d = Math.hypot(uc - wx, vc - wy);
      if (d <= 9) return d > 7 ? col('#141418') : d > 4.8 ? col(v < wy ? '#f4efe0' : '#cfc8b4') : (d > 3.6 ? CHS : (u < wx && v < wy ? CHL : CHM));
    }
    let c = 0;
    const inWell = wheels.some(([wx, wy]) => v > 27 && Math.hypot(uc - wx, vc - wy) < 11.5);
    const top = 22 - Math.max(0, u - 116) * 0.36;
    const front = u >= 3 || (v > 24 && v < 37);
    if (!inWell && front && u < 149 && v >= top && v < 39 && !(u < 6 && v < 24)) {
      if (v <= top + 1.5) c = bL; else if (v < 29) c = bM; else if (v < 34) c = bS; else c = bD;
      if (v >= 28 && v < 30 && u > 18 && u < 142) c = v < 28.5 ? CHL : v < 29.5 ? CHM : CHS;
      if ((Math.abs(u - 60) < 0.5 || Math.abs(u - 93) < 0.5) && v > 22 && v < 36) c = bD;
      if ((u >= 70 && u < 74 || u >= 101 && u < 105) && v >= 25 && v < 26) c = CHL;
      if (u > 140 && v > top && v < top + 4) c = col(v < top + 1 ? '#ff8080' : '#e0303a');
    }
    if ((u < 7 && v >= 30 && v < 37) || (u > 143 && u < 152 && v >= 30 && v < 37)) c = v < 31.5 ? CHL : v < 35 ? CHM : CHS;
    const dh = Math.hypot(uc - 6, vc - 26);
    if (dh < 3.2) c = dh < 2 ? col(dh < 0.8 ? '#ffffff' : '#fff2a8') : CHM;
    if (!c && v >= 6 && v < 22 && u >= 42 && u <= 118) {
      const left = 56 - (v - 6) * 0.86, right = 104 + (v - 6) * 0.86;
      if (u >= left && u <= right) {
        if (v < 9) c = v < 6.5 ? rL : rM;
        else if (u < left + 1.5 || u > right - 1.5 || (u >= 79 && u < 82)) c = rS;
        else c = ((u - v * 0.6) % 22 < 4) ? GLL : GL;
      }
    }
    return c;
  });
  pb.outlineSel(OUTLINE, 0.74);
  return pb.toCanvas();
}

// ---------------- LIVELLO 1: strada notturna al neon ----------------
class BgStreet {
  constructor(L) { this.L = L; this.worldEnd = L.worldEnd; this.build(); }
  get bossSpawn() { return { x: this.clubDoor + 38, z: 146, entryX: this.clubDoor - 40 }; }
  build() {
    const rnd = mulberry(1977);
    const R = (a, b) => a + rnd() * (b - a);
    const rp = arr => arr[Math.floor(rnd() * arr.length)];
    this.signs = []; this.poles = []; this.bulbs = []; this.lights = []; this.vents = []; this.eyes = [];
    this.bats = []; for (let k = 0; k < 4; k++) this.bats.push({ x: rnd() * W, y: 8 + rnd() * 30, v: 0.3 + rnd() * 0.4, a: rnd() * 6 });

    // ---- cielo (si vede sopra i negozi a un piano) ----
    const [sky, sc] = bgCanvas(W, 70);
    const bands = ['#0b0720', '#110a2a', '#170c34', '#1f0f3e', '#2a1248', '#381552', '#4a1a5a'];
    bands.forEach((c, i) => BF(sc, 0, i * 10, W, 10, c));
    for (let i = 1; i < bands.length; i++) bgDither(sc, 0, i * 10 - 2, W, 2, bands[i], i);
    for (let i = 0; i < 60; i++) BF(sc, Math.floor(R(0, W)), Math.floor(R(0, 44)), 1, 1, rnd() < 0.2 ? '#fff4c0' : '#c8c0ff');
    const mx = 330, my = 20;
    for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) { const d = x * x + y * y; if (d <= 121) BF(sc, mx + x, my + y, 1, 1, d > 100 ? '#d9cfa8' : (x - y > 4 ? '#e6dcb4' : '#f6efcc')); }
    [[-4, -3, 2.5], [4, 4, 2], [-1, 5, 1.5]].forEach(([x, y, r]) => { for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (xx * xx + yy * yy <= r * r) BF(sc, mx + x + xx, my + y + yy, 1, 1, '#d8cda0'); });
    this.sky = sky;

    // ---- skyline lontano (parallasse 0.3) ----
    const farW = Math.ceil(W + (this.worldEnd - W) * 0.3) + 40;
    const [far, fc] = bgCanvas(farW, 70);
    let x = 0;
    while (x < farW) {
      const w = Math.floor(R(30, 70)), top = Math.floor(R(4, 40));
      const c = rp(['#1c1236', '#22153f', '#191030']);
      BF(fc, x, top, w, 70 - top, c); BF(fc, x, top, w, 1, '#33205a'); BF(fc, x + w - 2, top, 2, 70 - top, shade(c, 0.8));
      for (let wy = top + 4; wy < 68; wy += 5) for (let wx = x + 3; wx < x + w - 4; wx += 5) if (rnd() < 0.28) BF(fc, wx, wy, 2, 2, rp(['#ffd97a', '#ffb44a', '#7ae8ff', '#ff9ad9']));
      if (rnd() < 0.3) { BF(fc, x + (w >> 1), top - 12, 1, 12, c); BF(fc, x + (w >> 1), top - 13, 1, 1, '#ff3a5a'); }
      if (rnd() < 0.25) { BF(fc, x + 6, top - 9, 12, 9, c); BF(fc, x + 5, top - 10, 14, 2, '#2a1a48'); for (let k = 0; k < 3; k++) BF(fc, x + 7 + k * 4, top, 1, 3, c); }
      x += w + Math.floor(R(0, 8));
    }
    this.far = far;

    // ---- facciate (parallasse 1) ----
    const [mid, m] = bgCanvas(this.worldEnd, BASE_Y);
    this.mid = mid;
    const clubX = this.worldEnd - 430;
    this.clubX = clubX;
    x = 0; let si = 0;
    while (x < clubX - 60) {
      let type = L1_STREET[si % L1_STREET.length];
      let w = type === 'vicolo' ? Math.floor(R(52, 66)) : type === 'cinema' ? 300 : type === 'garage' ? 270 : Math.floor(R(220, 268));
      if (clubX - (x + w) < 120) { w = clubX - x; if (type === 'vicolo' && w > 100) type = 'bar'; }     // l'ultimo edificio arriva fino al club
      if (type === 'vicolo') this.drawAlley(m, x, w, rnd);
      else this.drawShop(m, x, w, type, rnd, si);
      x += w; si++;
    }
    this.drawClub(m, clubX, this.worldEnd - clubX, rnd);
    // luce notturna: più buio in alto, solo sopra i pixel già disegnati
    m.save(); m.globalCompositeOperation = 'source-atop';
    const gdn = m.createLinearGradient(0, 0, 0, BASE_Y);
    gdn.addColorStop(0, 'rgba(8,4,30,0.55)'); gdn.addColorStop(0.32, 'rgba(8,4,30,0.25)'); gdn.addColorStop(0.6, 'rgba(8,4,30,0.05)'); gdn.addColorStop(1, 'rgba(8,4,30,0.18)');
    m.fillStyle = gdn; m.fillRect(0, 0, this.worldEnd, BASE_Y);
    // alone delle insegne al neon sul muro
    for (const s of this.signs) {
      const rg = m.createRadialGradient(s.x, s.y + 7, 4, s.x, s.y + 7, s.w * 0.75);
      rg.addColorStop(0, s.c + '55'); rg.addColorStop(1, s.c + '00');
      m.fillStyle = rg; m.fillRect(s.x - s.w, s.y - 30, s.w * 2, 70);
    }
    m.restore();

    // ---- marciapiede e strada ----
    const GH = H - BASE_Y;
    const [gr, g] = bgCanvas(this.worldEnd, GH);
    const SW = 20;  // profondità del marciapiede
    const [pL, pM, pS, pD] = T4('#6e6878');
    BF(g, 0, 0, this.worldEnd, SW, pM);
    bgDither(g, 0, 0, this.worldEnd, 2, pD); BF(g, 0, 0, this.worldEnd, 1, pD); bgDither(g, 0, 2, this.worldEnd, 2, pS, 1);
    BF(g, 0, 10, this.worldEnd, 1, pS); BF(g, 0, 11, this.worldEnd, 1, pL);
    for (let k = 0; k < this.worldEnd + 40; k += 44) for (let r = 2; r < SW; r++) { const xx = Math.round(k + r * 0.55); BF(g, xx, r, 1, 1, pS); BF(g, xx + 1, r, 1, 1, pL); }
    for (let i = 0; i < this.worldEnd * 0.12; i++) BF(g, Math.floor(R(0, this.worldEnd)), Math.floor(R(3, SW)), 1, 1, rnd() < 0.5 ? pS : pL);
    for (let k = 120; k < this.worldEnd; k += Math.floor(R(90, 200))) { const yy = Math.floor(R(4, SW - 3)); BF(g, k, yy, 2, 1, pD); BF(g, k + 2, yy + 1, 3, 1, pD); BF(g, k + 5, yy + 1, 1, 1, pS); }
    // cordolo e canalina
    const [cL, cM, cS, cD] = T4('#8e889a');
    BF(g, 0, SW, this.worldEnd, 2, cL); BF(g, 0, SW + 2, this.worldEnd, 1, cM); BF(g, 0, SW + 3, this.worldEnd, 2, cS); BF(g, 0, SW + 5, this.worldEnd, 1, cD);
    BF(g, 0, SW + 6, this.worldEnd, 3, '#16121e');
    for (let k = 200; k < this.worldEnd; k += Math.floor(R(300, 460))) { BF(g, k, SW + 3, 22, 4, '#0c0a12'); for (let q = 2; q < 22; q += 3) BF(g, k + q, SW + 3, 1, 4, '#4a4656'); }
    // asfalto
    const RD = SW + 9;
    BF(g, 0, RD, this.worldEnd, GH - RD, '#2a2633');
    for (let i = 0; i < this.worldEnd * (GH - RD) * 0.05; i++) BF(g, Math.floor(R(0, this.worldEnd)), Math.floor(R(RD, GH)), rnd() < 0.3 ? 2 : 1, 1, rp(['#332f3d', '#232030', '#3a3546']));
    bgDither(g, 0, RD, this.worldEnd, 3, '#16121e');
    // macchie d'olio, crepe, tombini, strisce
    for (let k = 140; k < this.worldEnd; k += Math.floor(R(160, 320))) { g.fillStyle = 'rgba(10,6,16,0.35)'; g.beginPath(); g.ellipse(k, R(RD + 12, GH - 8), R(10, 22), R(2, 4), 0, 0, Math.PI * 2); g.fill(); }
    for (let k = 90; k < this.worldEnd; k += Math.floor(R(120, 260))) { let cx = k, cy = Math.floor(R(RD + 6, GH - 6)); for (let s = 0; s < 14; s++) { BF(g, cx, cy, 1, 1, '#18141f'); cx += rp([1, 1, 2]); cy += rp([-1, 0, 0, 1]); } }
    const lane = 60;
    for (let k = 10; k < this.worldEnd; k += 76) { BF(g, k, lane, 34, 3, '#c9a43a'); BF(g, k, lane, 34, 1, '#e8c860'); for (let q = 0; q < 6; q++) BF(g, k + Math.floor(R(0, 34)), lane + Math.floor(R(0, 3)), 1, 1, '#8a7030'); }
    for (let k = 360; k < this.worldEnd - 500; k += Math.floor(R(420, 640))) {
      const yy = Math.floor(R(RD + 22, GH - 14));
      g.fillStyle = '#121018'; g.beginPath(); g.ellipse(k, yy, 15, 5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a4656'; g.beginPath(); g.ellipse(k, yy, 13, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2e2a38'; g.beginPath(); g.ellipse(k, yy + 0.5, 11, 3.2, 0, 0, Math.PI * 2); g.fill();
      for (let q = -8; q <= 8; q += 4) BF(g, k + q, yy - 2, 1, 4, '#4a4656');
    }
    // luce delle vetrine sul marciapiede
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      g.fillStyle = l.c;
      for (let r = 0; r < SW; r++) { const a = 0.13 * (1 - r / SW); g.globalAlpha = a; g.fillRect(Math.round(l.x0 - r * 0.4), r, Math.round(l.x1 - l.x0 + r * 0.8), 1); }
    }
    g.restore();
    // tappeto rosso davanti al club
    const cd = this.clubDoor;
    BF(g, cd - 6, 0, 88, SW - 1, '#9a1830'); BF(g, cd - 6, 0, 88, 2, '#6a0c20'); BF(g, cd - 6, 0, 2, SW - 1, '#ffd34a'); BF(g, cd + 80, 0, 2, SW - 1, '#ffd34a');
    bgDither(g, cd - 4, 2, 84, SW - 3, '#b02440');
    this.ground = gr;
    this.puddles = [];
    for (let k = 260; k < this.worldEnd - 500; k += Math.floor(R(380, 620))) this.puddles.push({ x: k, z: R(178, 210), w: R(22, 40) });
  }

  // ---------- negozio ----------
  drawShop(m, x, w, type, rnd, idx) {
    const S = SHOPS[type];
    const R = (a, b) => a + rnd() * (b - a);
    const stone = '#8a8094';
    const top = S.tall ? 0 : Math.floor(R(8, 16));
    // muro
    if (S.stucco) bgStucco(m, x, top, w, BASE_Y, S.wall, rnd); else bgBricks(m, x, top, w, BASE_Y, S.wall, rnd);
    const [wL, wM, wS, wD] = T4(S.wall);
    BF(m, x + w - 1, top, 1, BASE_Y - top, '#0c0812'); BF(m, x, top, 1, BASE_Y - top, wS);
    if (S.tall) {
      // finestre del primo piano (si vede la parte bassa)
      for (let wx = x + 16; wx < x + w - 36; wx += 46) {
        const lit = rnd() < 0.5;
        BF(m, wx - 2, -4, 30, 26, T4(stone)[2]); BF(m, wx - 1, -4, 28, 25, T4(stone)[1]);
        BF(m, wx + 1, -4, 24, 22, lit ? '#ffd27a' : '#1e2c4a');
        if (lit) { bgDither(m, wx + 1, -4, 24, 22, '#f0b050'); BF(m, wx + 1, 10, 24, 8, '#c88a3a'); if (rnd() < 0.5) { BF(m, wx + 8, 4, 6, 14, '#3a2418'); BF(m, wx + 9, 0, 4, 4, '#3a2418'); } }
        else { BF(m, wx + 3, -2, 3, 8, '#3a5078'); bgGlassShine(m, wx + 1, -4, 24, 22); }
        BF(m, wx + 12, -4, 2, 22, T4(stone)[2]);
        BF(m, wx - 4, 18, 34, 3, T4(stone)[0]); BF(m, wx - 4, 21, 34, 1, T4(stone)[3]); bgDither(m, wx - 2, 22, 30, 2, wD);
      }
    } else {
      // parapetto del negozio a un piano, con qualcosa sul tetto
      BF(m, x - 1, top, w + 2, 3, T4(stone)[0]); BF(m, x - 1, top + 3, w + 2, 2, T4(stone)[2]); BF(m, x - 1, top + 5, w + 2, 1, T4(stone)[3]);
      if (rnd() < 0.6) { const tx = x + Math.floor(R(20, w - 50)); BF(m, tx, top - 8, 26, 8, '#3a3446'); BF(m, tx, top - 8, 26, 1, '#5a5468'); BF(m, tx + 4, top - 12, 2, 4, '#3a3446'); BF(m, tx + 18, top - 12, 2, 4, '#3a3446'); }
    }
    // cornicione
    const cy = 24;
    BF(m, x, cy, w, 6, T4(stone)[1]); BF(m, x, cy, w, 1, T4(stone)[0]); BF(m, x, cy + 4, w, 1, T4(stone)[2]); BF(m, x, cy + 5, w, 1, T4(stone)[3]);
    for (let k = x + 2; k < x + w - 2; k += 5) { BF(m, k, cy + 6, 3, 2, T4(stone)[2]); BF(m, k, cy + 6, 1, 2, T4(stone)[1]); }
    bgDither(m, x, cy + 8, w, 2, wD);
    // insegna (il testo al neon è disegnato dal vivo)
    const tw = textWidth(S.sign, 2), bw = Math.min(w - 20, tw + 22), bx = Math.round(x + (w - bw) / 2);
    BF(m, bx - 2, 33, bw + 4, 18, '#0a0612'); BF(m, bx, 35, bw, 14, '#170e22'); BF(m, bx - 2, 33, bw + 4, 1, T4(stone)[0]);
    for (const k of [bx + 1, bx + bw - 3]) { BF(m, k, 36, 2, 2, '#8a8094'); BF(m, k, 45, 2, 2, '#8a8094'); }
    this.signs.push({ x: x + w / 2, y: 35, t: S.sign, c: S.neon, w: bw });
    // piano terra
    const gy = 52;
    bgPilaster(m, x + 2, gy, BASE_Y, 10, stone);
    bgPilaster(m, x + w - 12, gy, BASE_Y, 10, stone);
    if (type === 'garage') return this.drawGarage(m, x, w, gy, rnd);
    if (type === 'cinema') return this.drawCinema(m, x, w, gy, rnd);
    const doorW = 30, doorLeft = idx % 2 === 0;
    const dx = doorLeft ? x + 16 : x + w - 16 - doorW;
    const wx = doorLeft ? dx + doorW + 6 : x + 16, ww = w - 32 - doorW - 6, wy = gy + 8, wh = BASE_Y - 16 - wy;
    // porta incassata
    BF(m, dx - 2, gy + 2, doorW + 4, BASE_Y - gy - 2, '#0c0812');
    BF(m, dx, gy + 4, doorW, BASE_Y - gy - 4, '#5a3420'); BF(m, dx, gy + 4, 2, BASE_Y - gy - 4, '#7a4a2c'); BF(m, dx + doorW - 3, gy + 4, 3, BASE_Y - gy - 4, '#3a2014');
    BF(m, dx + 4, gy + 8, doorW - 8, 36, '#ffd27a'); bgDither(m, dx + 4, gy + 8, doorW - 8, 36, '#e8a850'); bgGlassShine(m, dx + 4, gy + 8, doorW - 8, 36);
    BF(m, dx + 4, gy + 48, doorW - 8, 18, '#4a2a18'); BF(m, dx + 4, gy + 48, doorW - 8, 1, '#7a4a2c');
    BF(m, dx + 2, BASE_Y - 8, doorW - 4, 6, '#c9a43a'); BF(m, dx + 2, BASE_Y - 8, doorW - 4, 1, '#ffe08a');
    BF(m, doorLeft ? dx + doorW - 7 : dx + 4, gy + 46, 3, 3, '#ffd34a');
    BF(m, dx + doorW / 2 - 6, gy - 4, 12, 4, '#2a2232'); BF(m, dx + doorW / 2 - 3, gy, 6, 2, '#fff2a8');   // lampada sulla porta
    this.lights.push({ x0: dx + 2, x1: dx + doorW - 2, c: '#ffcc66' });
    // vetrina
    BF(m, wx - 2, wy - 2, ww + 4, wh + 4, '#1a1622'); BF(m, wx - 2, wy - 2, ww + 4, 1, '#6a6478');
    this.drawInterior(m, type, wx, wy, ww, wh, rnd);
    bgGlassShine(m, wx, wy, ww, wh);
    for (let k = wx + Math.floor(ww / 3); k < wx + ww - 4; k += Math.floor(ww / 3)) BF(m, k, wy, 2, wh, '#1a1622');
    this.lights.push({ x0: wx, x1: wx + ww, c: type === 'sala' ? '#7a8cff' : (type === 'barbiere' || type === 'lavanderia') ? '#bfefff' : '#ffcc66' });
    // zoccolo sotto la vetrina
    BF(m, wx - 2, wy + wh + 2, ww + 4, BASE_Y - (wy + wh + 2), wS); BF(m, wx - 2, wy + wh + 2, ww + 4, 1, wL);
    for (let k = wx + 2; k < wx + ww - 10; k += Math.floor(ww / 3)) { BF(m, k, wy + wh + 5, Math.floor(ww / 3) - 6, BASE_Y - (wy + wh + 8), wD); BF(m, k, wy + wh + 5, Math.floor(ww / 3) - 6, 1, wM); }
    // tenda a strisce con bordo smerlato
    if (S.awn) {
      const [a1, a2] = S.awn, ax = x + 12, aw = w - 24, ay = gy - 2;
      BF(m, ax - 1, ay - 1, aw + 2, 2, '#0c0812');
      for (let k = 0; k < aw; k++) {
        const base = (Math.floor(k / 9) % 2) ? a1 : a2, T = T4(base);
        BF(m, ax + k, ay + 1, 1, 2, T[0]); BF(m, ax + k, ay + 3, 1, 7, T[1]); BF(m, ax + k, ay + 10, 1, 3, T[2]);
        const kk = k % 9, sc = 3 - Math.round(Math.abs(kk - 4) * 0.7);
        BF(m, ax + k, ay + 13, 1, Math.max(1, sc), T[2]); BF(m, ax + k, ay + 13 + Math.max(1, sc), 1, 1, T[3]);
      }
      bgDither(m, wx, wy, ww, 6, 'rgba(10,6,20,0.55)');
    }
    // dettagli: grondaia, manifesto, numero civico
    BF(m, x + w - 8, top + 2, 3, BASE_Y - top - 2, '#3a3446'); BF(m, x + w - 8, top + 2, 1, BASE_Y - top - 2, '#5a5468');
    for (let y = top + 14; y < BASE_Y; y += 26) BF(m, x + w - 9, y, 5, 2, '#22202a');
    if (type === 'barbiere') this.poles.push({ x: doorLeft ? dx + doorW + 2 : dx - 10, y: gy + 18 });
  }

  drawInterior(m, type, x, y, w, h, rnd) {
    const R = (a, b) => a + rnd() * (b - a);
    const rp = arr => arr[Math.floor(rnd() * arr.length)];
    const back = { bar: '#3a1e1a', pizza: '#6a3420', dischi: '#283048', sala: '#0e0c22', diner: '#e2d6b8', barbiere: '#cfe0dc', tabacchi: '#4a3424', motel: '#3a2a1c', gelati: '#f0d8e0', strumenti: '#5a3a26', lavanderia: '#cfe6e6' }[type] || '#3a2a2a';
    const [bL, bM, bS, bD] = T4(back);
    BF(m, x, y, w, h, bM); bgDither(m, x, y, w, Math.floor(h * 0.3), bS);
    BF(m, x, y + h - 9, w, 9, bD); BF(m, x, y + h - 9, w, 1, bS);
    if (type === 'bar') {
      for (const sy of [y + 10, y + 24]) { BF(m, x + 4, sy + 9, w - 8, 2, '#6a4020'); for (let k = x + 6; k < x + w - 8; k += 5) { const c = rp(['#3aa860', '#c89a3a', '#d04040', '#e8e0c0', '#5a7ad0']); BF(m, k, sy, 3, 9, c); BF(m, k + 1, sy - 2, 1, 2, c); BF(m, k, sy + 1, 1, 6, mix(c, '#ffffff', 0.4)); } }
      BF(m, x, y + h - 20, w, 12, '#4a2a18'); BF(m, x, y + h - 20, w, 2, '#8a5a30');
      for (let k = x + 14; k < x + w; k += 40) { BF(m, k, y, 1, 6, '#2a1a14'); BF(m, k - 4, y + 6, 9, 3, '#ffd34a'); m.fillStyle = 'rgba(255,210,120,0.18)'; m.fillRect(k - 10, y + 9, 21, 20); }
    } else if (type === 'pizza') {
      for (let ty = y + 2; ty < y + h - 22; ty += 6) for (let tx = x + ((ty >> 1) % 2) * 3; tx < x + w; tx += 6) BF(m, tx, ty, 5, 5, mix(bM, '#f1ead8', 0.15));
      const ox = x + w - 46, oy = y + 10;
      BF(m, ox, oy, 40, 30, '#7a3a2c'); for (let r = 0; r < 30; r += 4) BF(m, ox, oy + r, 40, 1, '#4a2018');
      m.fillStyle = '#1a0a08'; m.beginPath(); m.ellipse(ox + 20, oy + 24, 12, 10, 0, Math.PI, 0); m.fill();
      m.fillStyle = '#ff8a2a'; m.beginPath(); m.ellipse(ox + 20, oy + 25, 9, 7, 0, Math.PI, 0); m.fill();
      m.fillStyle = '#ffe08a'; m.beginPath(); m.ellipse(ox + 20, oy + 25, 5, 4, 0, Math.PI, 0); m.fill();
      BF(m, x, y + h - 20, w, 12, '#e8e0c8'); BF(m, x, y + h - 20, w, 2, '#ffffff'); BF(m, x, y + h - 12, w, 2, '#c8302c');
      for (let k = 0; k < 4; k++) { BF(m, x + 10, y + h - 30 - k * 4, 22, 4, '#efe3c4'); BF(m, x + 10, y + h - 30 - k * 4, 22, 1, '#c8302c'); }
    } else if (type === 'dischi') {
      for (const ry of [y + 6, y + 28]) { BF(m, x + 3, ry + 16, w - 6, 3, '#1a1626'); for (let k = x + 5; k < x + w - 6; k += 4) { const c = rp(['#ff4d6d', '#3ec5ff', '#ffd23e', '#62f08e', '#c58bff', '#f1ead8', '#ff9b45']); BF(m, k, ry + R(0, 4), 3, 16, c); BF(m, k, ry + 4, 1, 12, shade(c, 0.7)); } }
      const px = x + Math.floor(w / 2) - 14; BF(m, px, y + h - 30, 28, 20, '#f1ead8'); m.fillStyle = '#15151a'; m.beginPath(); m.arc(px + 14, y + h - 20, 8, 0, Math.PI * 2); m.fill(); BF(m, px + 12, y + h - 22, 4, 4, '#ff4d6d');
    } else if (type === 'sala') {
      for (let k = x + 6; k < x + w - 20; k += 26) {
        BF(m, k, y + 8, 20, h - 14, '#1e1a3a'); BF(m, k, y + 8, 20, 6, rp(['#ff4d6d', '#ffd23e', '#3ec5ff', '#c58bff'])); BF(m, k + 18, y + 8, 2, h - 14, '#120e26');
        const sc = rp(['#3ae0ff', '#62f08e', '#ff7ad9', '#ffd34a']); BF(m, k + 3, y + 17, 14, 12, '#0a0814'); BF(m, k + 4, y + 18, 12, 10, sc); bgDither(m, k + 4, y + 18, 12, 10, shade(sc, 0.6));
        BF(m, k + 2, y + 32, 16, 4, '#2a2448'); BF(m, k + 5, y + 31, 2, 2, '#ff4d6d'); BF(m, k + 11, y + 32, 2, 2, '#ffd34a'); BF(m, k + 14, y + 32, 2, 2, '#3ae0ff');
        m.fillStyle = sc + '33'; m.fillRect(k - 4, y + 12, 28, 30);
      }
    } else if (type === 'diner') {
      for (let k = x; k < x + w; k += 6) BF(m, k, y + 18, 3, 3, (k / 3) % 2 ? '#15151a' : '#f1ead8');
      BF(m, x + 6, y + 4, 34, 12, '#15151a'); for (let r = 0; r < 3; r++) BF(m, x + 9, y + 6 + r * 3, 20 + (r * 7) % 9, 1, '#f1ead8');
      BF(m, x, y + h - 26, w, 8, '#c9cdd6'); BF(m, x, y + h - 26, w, 2, '#ffffff'); BF(m, x, y + h - 18, w, 9, '#8a1a2a');
      for (let k = x + 10; k < x + w - 6; k += 18) { BF(m, k - 4, y + h - 13, 10, 3, '#e0303a'); BF(m, k - 4, y + h - 13, 10, 1, '#ff7a7a'); BF(m, k, y + h - 10, 2, 9, '#c9cdd6'); }
      BF(m, x + w - 40, y + 26, 30, 16, '#d8e8f0'); for (let k = 0; k < 3; k++) { m.fillStyle = '#e8a646'; m.beginPath(); m.arc(x + w - 33 + k * 9, y + 36, 3.5, Math.PI, 0); m.fill(); }
    } else if (type === 'barbiere') {
      for (let k = x + 6; k < x + w - 24; k += 34) { BF(m, k, y + 6, 24, 24, '#9ac8d8'); BF(m, k + 1, y + 7, 22, 22, '#bfe4ee'); bgGlassShine(m, k + 1, y + 7, 22, 22); BF(m, k - 1, y + 5, 26, 1, '#c9a43a'); }
      for (let k = x + 14; k < x + w - 20; k += 34) { BF(m, k, y + h - 28, 14, 10, '#c42032'); BF(m, k, y + h - 28, 14, 2, '#ff6a7a'); BF(m, k - 2, y + h - 20, 18, 3, '#c42032'); BF(m, k + 6, y + h - 17, 3, 8, '#c9cdd6'); BF(m, k + 2, y + h - 10, 11, 2, '#8a90a0'); }
    } else if (type === 'tabacchi') {
      for (const ry of [y + 6, y + 20, y + 34]) { BF(m, x + 3, ry + 9, w - 6, 2, '#6a4020'); for (let k = x + 5; k < x + w - 8; k += 6) BF(m, k, ry + 2, 5, 7, rp(['#e0303a', '#f1ead8', '#3e6ad0', '#ffd34a', '#2a2a34'])); }
      BF(m, x, y + h - 18, w, 10, '#5a3a20'); BF(m, x, y + h - 18, w, 2, '#9a6a3a');
    } else if (type === 'gelati') {
      BF(m, x, y + h - 30, w, 22, '#d8e8f0'); BF(m, x, y + h - 30, w, 2, '#ffffff'); BF(m, x, y + h - 10, w, 2, '#8a90a0');
      for (let k = x + 6; k < x + w - 14; k += 14) { const c = rp(['#ff9ad9', '#fff2a8', '#7a4a2a', '#62f08e', '#f1ead8', '#ff6a5a']); BF(m, k, y + h - 24, 12, 8, '#c9cdd6'); BF(m, k + 1, y + h - 25, 10, 6, c); BF(m, k + 2, y + h - 26, 6, 2, mix(c, '#ffffff', 0.4)); }
      for (let k = 0; k < 3; k++) { const cx = x + 16 + k * 26, cy = y + 10; m.fillStyle = rp(['#ff9ad9', '#fff2a8', '#7a4a2a']); m.beginPath(); m.arc(cx, cy + 6, 6, 0, Math.PI * 2); m.fill(); m.fillStyle = '#d8a050'; m.beginPath(); m.moveTo(cx - 5, cy + 9); m.lineTo(cx + 5, cy + 9); m.lineTo(cx, cy + 22); m.fill(); }
    } else if (type === 'strumenti') {
      // chitarre generiche appese al muro e un amplificatore
      for (let k = x + 10; k < x + w - 16; k += 22) {
        const c = rp(['#c8302c', '#e8a646', '#15151a', '#3ec5ff', '#f1ead8']);
        BF(m, k + 4, y + 4, 3, 20, '#8a5a30'); BF(m, k + 3, y + 2, 5, 4, '#2a1a14');
        m.fillStyle = c; m.beginPath(); m.ellipse(k + 5.5, y + 30, 7, 6, 0, 0, Math.PI * 2); m.fill(); m.beginPath(); m.ellipse(k + 5.5, y + 22, 5, 4, 0, 0, Math.PI * 2); m.fill();
        BF(m, k + 3, y + 29, 6, 2, '#15151a'); BF(m, k + 5, y + 4, 1, 26, '#e6e9ef');
      }
      BF(m, x + w - 40, y + h - 32, 30, 23, '#22222a'); BF(m, x + w - 38, y + h - 30, 26, 5, '#c9a43a'); m.fillStyle = '#3a3a46'; m.beginPath(); m.arc(x + w - 25, y + h - 16, 7, 0, Math.PI * 2); m.fill();
    } else if (type === 'lavanderia') {
      for (let k = x + 4; k < x + w - 24; k += 26) {
        BF(m, k, y + h - 38, 24, 29, '#f1f4f6'); BF(m, k, y + h - 38, 24, 5, '#d8dee4'); BF(m, k + 22, y + h - 38, 2, 29, '#b8c2cc');
        m.fillStyle = '#5a6a7a'; m.beginPath(); m.arc(k + 12, y + h - 21, 8, 0, Math.PI * 2); m.fill();
        m.fillStyle = rp(['#3ec5ff', '#7aa8ff', '#9ad0ff']); m.beginPath(); m.arc(k + 12, y + h - 21, 6, 0, Math.PI * 2); m.fill();
        BF(m, k + 8, y + h - 25, 3, 2, '#ffffff'); BF(m, k + 3, y + h - 36, 4, 2, '#62f08e');
      }
    } else if (type === 'motel') {
      BF(m, x + 8, y + 8, 30, 20, '#5a3a20'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) BF(m, x + 11 + c * 4, y + 11 + r * 4, 2, 2, '#ffd34a');
      m.fillStyle = '#3a8a4a'; m.beginPath(); m.ellipse(x + w - 20, y + h - 26, 9, 12, 0, 0, Math.PI * 2); m.fill(); BF(m, x + w - 25, y + h - 16, 10, 7, '#8a4a2a');
      BF(m, x, y + h - 18, w * 0.6, 10, '#6a4020'); BF(m, x, y + h - 18, w * 0.6, 2, '#9a6a3a');
      BF(m, x + Math.floor(w / 2), y, 1, 8, '#2a1a14'); BF(m, x + Math.floor(w / 2) - 6, y + 8, 13, 5, '#ffd34a'); m.fillStyle = 'rgba(255,210,120,0.2)'; m.fillRect(x + Math.floor(w / 2) - 14, y + 13, 29, 24);
    }
  }

  drawGarage(m, x, w, gy, rnd) {
    const ox = x + 16, ow = w - 32, oy = gy + 4;
    BF(m, ox - 2, oy - 2, ow + 4, BASE_Y - oy + 2, '#0c0812');
    BF(m, ox, oy, ow, BASE_Y - oy, '#1a1824'); bgDither(m, ox, oy + 30, ow, BASE_Y - oy - 30, '#22202e');
    for (let k = 0; k < 4; k++) { BF(m, ox, oy + k * 4, ow, 3, '#7a7a88'); BF(m, ox, oy + k * 4, ow, 1, '#a8a8b8'); BF(m, ox, oy + k * 4 + 3, ow, 1, '#3a3a46'); }   // serranda alzata
    BF(m, ox + 8, oy + 20, 40, 26, '#3a3446'); for (let k = 0; k < 6; k++) BF(m, ox + 11 + k * 6, oy + 24, 2, 10 + (k % 3) * 4, '#8a90a0');            // pannello attrezzi
    m.fillStyle = 'rgba(255,220,150,0.16)'; m.beginPath(); m.moveTo(ox + ow / 2 - 6, oy + 16); m.lineTo(ox + ow / 2 + 6, oy + 16); m.lineTo(ox + ow / 2 + 70, BASE_Y); m.lineTo(ox + ow / 2 - 70, BASE_Y); m.fill();
    BF(m, ox + ow / 2 - 8, oy + 14, 16, 3, '#ffd34a');
    const car = carSprite();
    m.drawImage(car, Math.round(ox + ow / 2 - car.width / RS / 2), BASE_Y - car.height / RS - 1, car.width / RS, car.height / RS);
    this.lights.push({ x0: ox + 20, x1: ox + ow - 20, c: '#ffcc66' });
  }

  drawCinema(m, x, w, gy, rnd) {
    // pensilina con lampadine a rincorsa
    const mx = x + 10, mw = w - 20, my = gy - 4;
    BF(m, mx, my, mw, 22, '#f1ead8'); BF(m, mx, my, mw, 2, '#ffffff'); BF(m, mx, my + 20, mw, 2, '#b8ae98');
    BF(m, mx + 6, my + 4, mw - 12, 14, '#15151a');
    drawText(m, "STASERA: ROCK 'N' BRAWL", x + w / 2, my + 7, '#ffd34a', { align: 'center' });
    BF(m, mx, my + 22, mw, 3, '#2a2232');
    for (let k = mx + 3; k < mx + mw - 2; k += 6) { this.bulbs.push({ x: k, y: my - 2 }); this.bulbs.push({ x: k, y: my + 24 }); }
    // biglietteria e locandine inventate
    const bx = x + w / 2 - 22, by = gy + 30;
    BF(m, bx, by, 44, BASE_Y - by, '#8a1a2a'); BF(m, bx, by, 44, 2, '#c9a43a'); BF(m, bx + 6, by + 6, 32, 22, '#ffd27a'); bgGlassShine(m, bx + 6, by + 6, 32, 22);
    BF(m, bx + 18, by + 14, 8, 10, '#3a2418'); BF(m, bx + 19, by + 10, 6, 5, '#3a2418');
    BF(m, bx - 4, by - 4, 52, 4, '#c9a43a');
    const posters = [['#1a2a6a', 'rocket'], ['#5a1a1a', 'guitar'], ['#0e0a12', 'skull'], ['#4a1a5a', 'note']];
    posters.forEach(([c, k], i) => {
      const px = i < 2 ? x + 22 + i * 40 : x + w - 22 - 34 - (i - 2) * 40, py = gy + 34;
      BF(m, px - 3, py - 3, 40, 58, '#c9a43a'); BF(m, px - 2, py - 2, 38, 56, '#6a4a1a'); BF(m, px, py, 34, 52, c);
      if (k === 'rocket') { BF(m, px + 15, py + 10, 5, 22, '#e6e9ef'); BF(m, px + 16, py + 6, 3, 4, '#e0303a'); BF(m, px + 12, py + 28, 11, 4, '#e0303a'); BF(m, px + 15, py + 32, 5, 6, '#ffd34a'); }
      if (k === 'guitar') { m.fillStyle = '#ffd34a'; m.beginPath(); m.ellipse(px + 17, py + 34, 9, 8, 0, 0, Math.PI * 2); m.fill(); BF(m, px + 16, py + 6, 3, 22, '#8a5a30'); BF(m, px + 15, py + 33, 5, 2, '#15151a'); }
      if (k === 'skull') { bgSkull(m, px + 17, py + 22, 9, '#efe9dc'); if (goreOn()) for (let q = 0; q < 4; q++) BF(m, px + 8 + q * 6, py + 30 + q % 2 * 3, 1, 6 + q * 2, '#a8141e'); this.eyes.push({ x: px + 17, y: py + 22 }); }
      if (k === 'planet') { m.fillStyle = '#62f08e'; m.beginPath(); m.arc(px + 17, py + 24, 9, 0, Math.PI * 2); m.fill(); BF(m, px + 4, py + 24, 26, 2, '#f1ead8'); }
      if (k === 'note') { m.fillStyle = '#ff7ad9'; m.beginPath(); m.ellipse(px + 13, py + 34, 5, 4, -0.4, 0, Math.PI * 2); m.fill(); BF(m, px + 17, py + 12, 2, 22, '#ff7ad9'); BF(m, px + 17, py + 12, 8, 3, '#ff7ad9'); }
      BF(m, px + 3, py + 44, 28, 2, '#f1ead8'); BF(m, px + 7, py + 48, 20, 1, '#f1ead8');
    });
    this.lights.push({ x0: x + 10, x1: x + w - 10, c: '#ffd27a' });
  }

  drawAlley(m, x, w, rnd) {
    bgBricks(m, x, 0, w, BASE_Y, '#2a2036', rnd);
    m.fillStyle = 'rgba(6,2,14,0.55)'; m.fillRect(x, 0, w, BASE_Y);
    BF(m, x, 0, 4, BASE_Y, '#06030c'); BF(m, x + w - 4, 0, 4, BASE_Y, '#06030c');
    // scala antincendio
    for (let y = 18; y < 100; y += 30) { BF(m, x + 6, y, w - 12, 2, '#120c1c'); for (let k = x + 6; k < x + w - 6; k += 3) BF(m, k, y - 8, 1, 8, '#120c1c'); BF(m, x + 6, y - 8, w - 12, 1, '#2a2238'); }
    for (let y = 20; y < 92; y += 30) for (let k = 0; k < 22; k++) BF(m, x + 10 + k, y + k * 1.3, 2, 1, '#120c1c');
    // porta sul retro con lampadina
    const dx = x + Math.floor(w / 2) - 10;
    BF(m, dx, 84, 20, BASE_Y - 84, '#1a1424'); BF(m, dx + 2, 86, 16, BASE_Y - 86, '#3a3446'); BF(m, dx + 14, 106, 2, 3, '#8a8094');
    BF(m, dx + 8, 78, 4, 3, '#fff2a8');
    m.fillStyle = 'rgba(255,230,160,0.14)'; m.beginPath(); m.moveTo(dx + 8, 81); m.lineTo(dx + 12, 81); m.lineTo(dx + 30, BASE_Y); m.lineTo(dx - 10, BASE_Y); m.fill();
    // sacchi della spazzatura
    for (let k = 0; k < 3; k++) { const sx = x + 6 + k * 9, sy = BASE_Y - 8; m.fillStyle = '#16141e'; m.beginPath(); m.ellipse(sx + 5, sy + 3, 6, 5, 0, 0, Math.PI * 2); m.fill(); BF(m, sx + 3, sy - 1, 2, 1, '#4a4858'); }
    this.vents.push({ x: x + w - 14, y: 70 });
    // tocco horror: occhi nel buio del vicolo e uno schizzo sul muro
    this.eyes.push({ x: x + 14 + rnd() * (w - 28), y: 40 + rnd() * 30 });
    if (rnd() < 0.6) bgSplat(m, x + 8 + rnd() * (w - 16), 60 + rnd() * 30, 3, rnd);
  }

  drawClub(m, x, w, rnd) {
    // facciata art déco viola con piastrelle a rombi
    BF(m, x, 0, w, BASE_Y, '#1c0c30');
    for (let y = 0; y < BASE_Y; y += 8) for (let k = x + ((y >> 3) % 2) * 8; k < x + w; k += 16) { m.fillStyle = '#26123e'; m.beginPath(); m.moveTo(k + 8, y); m.lineTo(k + 16, y + 4); m.lineTo(k + 8, y + 8); m.lineTo(k, y + 4); m.fill(); }
    BF(m, x, 0, w, 2, '#0a0414');
    BF(m, x, 22, w, 32, '#0a0414'); BF(m, x, 22, w, 1, '#5a2a7a'); BF(m, x, 53, w, 1, '#5a2a7a');   // fascia dell'insegna
    for (let k = x + 8; k < x + w; k += 64) { bgPilaster(m, k, 56, BASE_Y, 12, '#5a3a7a'); }
    this.clubDoor = this.worldEnd - 152;
    const cd = this.clubDoor;
    BF(m, cd - 8, 58, 92, BASE_Y - 58, '#c9a43a'); BF(m, cd - 6, 60, 88, BASE_Y - 60, '#05030a');
    BF(m, cd - 8, 58, 92, 2, '#ffe08a');
    for (const dx of [cd, cd + 40]) { BF(m, dx, 64, 36, BASE_Y - 64, '#2a1438'); BF(m, dx + 1, 64, 2, BASE_Y - 64, '#4a2a5a'); m.fillStyle = '#5a3a7a'; m.beginPath(); m.arc(dx + 18, 82, 9, 0, Math.PI * 2); m.fill(); m.fillStyle = '#1a0a24'; m.beginPath(); m.arc(dx + 18, 82, 7, 0, Math.PI * 2); m.fill(); BF(m, dx + (dx === cd ? 31 : 3), 98, 2, 10, '#ffd34a'); }
    // locandine
    [['DISCO', '#ff7ad9'], ['STASERA', '#3ae0ff']].forEach(([t, c], i) => {
      const px = i === 0 ? cd - 80 : cd + 104, py = 66;
      BF(m, px - 2, py - 2, 52, 50, '#c9a43a'); BF(m, px, py, 48, 46, '#12081e');
      drawText(m, t, px + 24, py + 8, c, { align: 'center' }); m.fillStyle = c; m.beginPath(); m.arc(px + 24, py + 30, 9, 0, Math.PI * 2); m.fill(); bgDither(m, px + 16, py + 22, 16, 16, '#ffffff');
    });
    for (let k = x + 4; k < x + w - 2; k += 7) { this.bulbs.push({ x: k, y: 18, club: true }); this.bulbs.push({ x: k, y: 56, club: true }); }
  }

  // ======================= disegno dal vivo =======================
  drawBack(ctx, camX) {
    ctx.drawImage(this.sky, 0, 0, this.sky.width / RS, this.sky.height / RS);
    for (const b of this.bats) { b.x -= b.v; b.a += 0.05; if (b.x < -20) b.x = W + 20; blitHi(ctx, batSprite(((G.frame + (b.a * 10 | 0)) >> 3) % 2), b.x - 8, b.y + Math.sin(b.a) * 4); }
    ctx.drawImage(this.far, -Math.round(camX * 0.3 * RS) / RS, 0, this.far.width / RS, this.far.height / RS);
    ctx.drawImage(this.mid, -Math.round(camX * RS) / RS, 0, this.mid.width / RS, this.mid.height / RS);
    for (const e of this.eyes) { const x = e.x - camX; if (x < -10 || x > W + 10) continue; if ((G.frame + e.x * 7) % 400 < 8 || (G.frame + e.x * 3) % 900 > 640) continue; BF(ctx, x - 2.5, e.y, 1.5, 1, '#ff3040'); BF(ctx, x + 1, e.y, 1.5, 1, '#ff3040'); }
    // insegne al neon (sfarfallano)
    for (const s of this.signs) {
      const sx = Math.round(s.x - camX); if (sx < -150 || sx > W + 150) continue;
      const flick = ((G.frame + s.x) % 260 < 5) || ((G.frame + s.x * 3) % 520 < 3);
      if (!flick) {
        ctx.globalAlpha = 0.16; ctx.fillStyle = s.c; ctx.fillRect(sx - s.w / 2 - 2, s.y - 4, s.w + 4, 22); ctx.globalAlpha = 1;
        drawText(ctx, s.t, sx, s.y, s.c, { align: 'center', scale: 2, outline: shade(s.c, 0.4) });
      } else drawText(ctx, s.t, sx, s.y, shade(s.c, 0.32), { align: 'center', scale: 2 });
    }
    // pali del barbiere che girano
    for (const p of this.poles) {
      const x = Math.round(p.x - camX); if (x < -20 || x > W + 20) continue;
      ctx.fillStyle = '#c9cdd6'; ctx.fillRect(x - 1, p.y - 4, 10, 3); ctx.fillRect(x - 1, p.y + 31, 10, 3);
      for (let y = 0; y < 31; y++) for (let k = 0; k < 8; k++) {
        const s = ((k + y + (G.frame >> 2)) % 9);
        ctx.fillStyle = s < 3 ? '#e0303a' : s < 6 ? '#ffffff' : '#2a5ad0';
        if (k === 0 || k === 7) ctx.fillStyle = shade(ctx.fillStyle, 0.7);
        ctx.fillRect(x + k, p.y - 1 + y, 1, 1);
      }
    }
    // lampadine a rincorsa (cinema e club)
    const clubOn = this.L.bossPhase && this.L.bossPhase !== 'wait';
    for (const b of this.bulbs) {
      const x = Math.round(b.x - camX); if (x < -4 || x > W + 4) continue;
      const on = b.club ? (clubOn || G.cam.x > this.clubX - 500) && ((b.x / 7 + (this.L.marquee >> 3)) % 3 < 1) : ((b.x / 6 + (this.L.marquee >> 3)) % 3 < 1);
      ctx.fillStyle = on ? '#fff2a8' : '#6a5a2a'; ctx.fillRect(x, b.y, 2, 2);
      if (on) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffd34a'; ctx.fillRect(x - 1, b.y - 1, 4, 4); ctx.globalAlpha = 1; }
    }
    // vapore dai vicoli
    for (const v of this.vents) {
      const x = v.x - camX; if (x < -30 || x > W + 30) continue;
      ctx.fillStyle = 'rgba(200,190,230,0.12)';
      for (let i = 0; i < 4; i++) { const t = ((G.frame * 0.5 + i * 30) % 120) / 120; const r = 3 + t * 8; ctx.beginPath(); ctx.arc(Math.round(x + Math.sin(t * 6 + i) * 3), Math.round(v.y - t * 60), r, 0, Math.PI * 2); ctx.fill(); }
    }
    // insegna del GLITTER CLUB
    const tx0 = this.clubX - camX;
    if (tx0 < W + 10) {
      const lit = this.L.bossPhase && this.L.bossPhase !== 'wait' ? Math.min(12, Math.floor(this.L.bossT / 6)) : (G.cam.x > this.clubX - 300 ? 12 : 0);
      const txt = 'GLITTER CLUB', tw = textWidth(txt, 3), tx = Math.round(this.clubX + (this.worldEnd - this.clubX) / 2 - tw / 2 - camX), ty = 28;
      for (let i = 0; i < txt.length; i++) {
        const on = i < lit && !(this.L.bossPhase === 'intro' && (G.frame >> 2) % 9 === i);
        drawText(ctx, txt[i], tx + i * 18, ty, on ? (i % 2 ? '#ff7ad9' : '#ffd34a') : '#3a2448', { scale: 3, outline: on ? '#6a1a50' : null });
      }
      if (lit) { ctx.globalAlpha = 0.12; ctx.fillStyle = '#ff7ad9'; ctx.fillRect(tx - 8, ty - 6, tw + 16, 34); ctx.globalAlpha = 1; }
      // porta che si apre durante l'introduzione del boss
      if (this.L.bossPhase === 'intro' || this.L.bossPhase === 'fight') {
        const op = Math.min(1, this.L.bossT / 40), dx = Math.round(this.clubDoor - camX);
        ctx.fillStyle = `rgba(255,120,220,${0.55 * op})`; ctx.fillRect(dx, 64, 76, BASE_Y - 64);
        ctx.fillStyle = `rgba(255,255,255,${0.35 * op})`; ctx.fillRect(dx + 16, 70, 44, BASE_Y - 70);
      }
    }
    ctx.drawImage(this.ground, -Math.round(camX * RS) / RS, BASE_Y, this.ground.width / RS, this.ground.height / RS);
    // pozzanghere che riflettono i neon
    for (const p of this.puddles) {
      const px = p.x - camX; if (px < -50 || px > W + 50) continue;
      pixelShadow(ctx, px, p.z, p.w, 3, 'rgba(60,34,100,0.8)');
      const c = ['#ff7ad9', '#3ae0ff', '#ffd34a'][Math.floor((G.frame / 20 + p.x) % 3)];
      ctx.fillStyle = c; ctx.globalAlpha = 0.5; ctx.fillRect(Math.round(px - p.w * 0.5), Math.round(p.z - 1), Math.round(p.w * 0.6), 1); ctx.fillRect(Math.round(px + p.w * 0.2), Math.round(p.z + 1), Math.round(p.w * 0.3), 1); ctx.globalAlpha = 1;
    }
    this.drawDanceFloor(ctx, camX);
  }
  drawDanceFloor(ctx, camX) {
    if (!this.L.bossPhase || this.L.bossPhase === 'wait') return;
    const x0 = this.worldEnd - W - camX;
    const reveal = this.L.bossPhase === 'intro' ? Math.min(1, this.L.bossT / 120) : 1;
    const f = this.L.floor;
    const colsT = ['#ff4fa0', '#3ae0ff', '#ffd34a', '#8a4cf0'];
    for (let tz = 0; tz < 6; tz++) for (let tx = 0; tx < 8; tx++) {
      if ((tx + tz * 0.5) / 8 > reveal) continue;
      const x = Math.round(x0 + tx * 48), y = LANE_TOP - 2 + tz * 13;
      let a = 0.16 + 0.08 * Math.sin((G.frame + tx * 13 + tz * 29) * 0.05);
      let c = colsT[(tx + tz + (G.frame >> 5)) % 4];
      if (f) {
        const lit = ((tx + tz) % 2 + 2) % 2 === f.parity;
        if (lit && f.t < 60) { a = (f.t >> 2) % 2 ? 0.5 : 0.25; c = '#ff4fa0'; }
        if (lit && f.t >= 60 && f.t < 100) { a = 0.8; c = (G.frame >> 1) % 2 ? '#ffffff' : '#ff4fa0'; }
      }
      ctx.globalAlpha = a; ctx.fillStyle = c; ctx.fillRect(x + 1, y + 1, 46, 11); ctx.globalAlpha = 1;
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y + 1, 44, 1); ctx.globalAlpha = 1;
    }
  }
  drawFront(ctx, camX) {
    // lampioni in ghisa in primo piano (parallasse 1.2)
    for (let k = 900; k < this.worldEnd; k += 960) {
      const x = Math.round(k - camX * 1.2); if (x < -20 || x > W + 20) continue;
      ctx.fillStyle = '#08050e'; ctx.fillRect(x - 1, 0, 11, H);
      ctx.fillStyle = '#2a2040'; ctx.fillRect(x + 1, 0, 2, H);
      ctx.fillStyle = '#16102a'; ctx.fillRect(x + 6, 0, 2, H);
      for (let y = 30; y < H - 40; y += 46) { ctx.fillStyle = '#08050e'; ctx.fillRect(x - 3, y, 15, 4); ctx.fillStyle = '#2a2040'; ctx.fillRect(x - 2, y, 13, 1); }
      ctx.fillStyle = '#08050e'; ctx.fillRect(x - 7, H - 34, 23, 34); ctx.fillRect(x - 5, H - 40, 19, 6);
      ctx.fillStyle = '#2a2040'; ctx.fillRect(x - 6, H - 33, 2, 32); ctx.fillRect(x - 4, H - 39, 2, 5);
      ctx.fillStyle = '#16102a'; ctx.fillRect(x + 12, H - 33, 3, 32);
    }
  }
}
