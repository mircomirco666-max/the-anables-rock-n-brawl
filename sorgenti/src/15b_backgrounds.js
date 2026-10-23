// ============================================================
// FONDALI DEI LIVELLI 2–10 — un costruttore comune e un "tema" per livello.
// Tutto disegnato a codice (nessuna immagine esterna), ad alta risoluzione,
// con decorazioni horror da cartone (pipistrelli, ragnatele, teschi, schizzi).
// Insegne e nomi sono inventati.
// ============================================================
const GND_H = H - BASE_Y;
const bgPick = (R, arr) => arr[Math.floor(R() * arr.length)];

// ---------- pittori riutilizzabili ----------
function bgPlanks(m, x, y0, w, y1, wood, R, horiz = false) {
  const [L, M, S, D] = T4(wood);
  BF(m, x, y0, w, y1 - y0, M);
  if (horiz) {
    for (let y = y0; y < y1; y += 6) { BF(m, x, y + 5, w, 1, D); BF(m, x, y, w, 0.5, L); for (let k = x + R() * 30; k < x + w; k += 30 + R() * 40) { BF(m, k, y, 0.5, 5, S); if (R() < 0.3) BF(m, k + 4, y + 2, 2, 1, D); } if (R() < 0.3) BF(m, x, y + 1, w, 1, mix(M, S, 0.5)); }
  } else {
    for (let k = x; k < x + w; k += 7) { BF(m, k + 6, y0, 1, y1 - y0, D); BF(m, k, y0, 0.5, y1 - y0, L); if (R() < 0.4) BF(m, k + 2, y0, 2, y1 - y0, mix(M, S, 0.4)); for (let y = y0 + R() * 20; y < y1; y += 18 + R() * 30) BF(m, k + 2 + R() * 3, y, 1.5, 1, D); }
  }
}
function bgMetal(m, x, y0, w, y1, base, R) {
  const [L, M, S, D] = T4(base);
  BF(m, x, y0, w, y1 - y0, M);
  for (let k = x; k < x + w; k += 5) { BF(m, k, y0, 1.5, y1 - y0, L); BF(m, k + 3, y0, 1, y1 - y0, S); BF(m, k + 4, y0, 1, y1 - y0, D); }
  for (let y = y0 + 28; y < y1; y += 34) { BF(m, x, y, w, 1, D); BF(m, x, y + 1, w, 0.5, L); for (let k = x + 3; k < x + w; k += 12) BF(m, k, y - 2, 1, 1, L); }
  for (let i = 0; i < w * 0.25; i++) { const rx = x + R() * w, ry = y0 + R() * (y1 - y0); BF(m, rx, ry, 1 + R() * 2, 2 + R() * 6, rgbaHex('#5a2a10', 0.35)); }
}
function rgbaHex(h, a) { return 'rgba(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')'; }
// finestra: lit = luce calda, board = assi inchiodate, eyes = occhi nel buio (animati a parte)
function bgWindow(m, x, y, w, h, o = {}) {
  const fr = o.frame || '#2a2232';
  BF(m, x - 2, y - 2, w + 4, h + 4, shade(fr, 0.7)); BF(m, x - 2, y - 2, w + 4, 1, shade(fr, 1.4));
  BF(m, x, y, w, h, o.lit ? o.lit : '#0c0a16');
  if (o.lit) { bgDither(m, x, y + h * 0.5, w, h * 0.5, shade(o.lit, 0.8)); if (o.shadow) { BF(m, x + w * 0.3, y + h * 0.3, w * 0.25, h * 0.7, shade(o.lit, 0.45)); BF(m, x + w * 0.33, y + h * 0.18, w * 0.18, h * 0.16, shade(o.lit, 0.45)); } }
  else bgGlassShine(m, x, y, w, h);
  if (o.cross !== false) { BF(m, x + w / 2 - 0.5, y, 1, h, fr); BF(m, x, y + h / 2 - 0.5, w, 1, fr); }
  if (o.broken) { m.fillStyle = '#05040a'; m.beginPath(); m.moveTo(x + w * 0.2, y); m.lineTo(x + w * 0.55, y + h * 0.45); m.lineTo(x + w * 0.3, y + h * 0.6); m.lineTo(x + w * 0.7, y + h); m.lineTo(x, y + h); m.lineTo(x, y); m.fill(); }
  if (o.board) for (let k = 0; k < 3; k++) { const yy = y + 3 + k * (h - 6) / 2.4; m.save(); m.translate(x + w / 2, yy); m.rotate((k - 1) * 0.12); BF(m, -w / 2 - 3, -2, w + 6, 4, '#7a5a3a'); BF(m, -w / 2 - 3, -2, w + 6, 1, '#a07a4a'); BF(m, -w / 2 - 1, -0.5, 1, 1, '#c9cdd6'); BF(m, w / 2, -0.5, 1, 1, '#c9cdd6'); m.restore(); }
  BF(m, x - 3, y + h + 2, w + 6, 2, shade(fr, 1.2));
}
function bgPoster(m, x, y, w, h, bg, fg, txt, R, o = {}) {
  if (txt) w = Math.max(w, textWidth(txt) + 6);
  BF(m, x - 0.5, y - 0.5, w + 1, h + 1, 'rgba(8,4,16,0.5)'); BF(m, x, y, w, h, bg); BF(m, x, y, w, 1, shade(bg, 1.3)); BF(m, x + w - 1, y, 1, h, shade(bg, 0.7));
  if (o.skull) bgSkull(m, x + w / 2, y + h * 0.55, Math.min(w, h) * 0.28, fg);
  else { m.fillStyle = fg; m.beginPath(); m.arc(x + w / 2, y + h * 0.58, Math.min(w, h) * 0.24, 0, Math.PI * 2); m.fill(); bgDither(m, x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.36, shade(fg, 0.6)); }
  if (txt) drawText(m, txt, x + w / 2, y + 3, fg, { align: 'center' });
  if (o.torn) { m.fillStyle = o.wall || '#2a2232'; m.beginPath(); m.moveTo(x + w, y + h * 0.6); for (let k = 0; k <= 6; k++) m.lineTo(x + w - k * w * 0.08 - R() * 4, y + h * 0.6 + k * h * 0.07); m.lineTo(x + w, y + h); m.fill(); }
}
function bgGraffiti(m, x, y, txt, c, R, sc = 2) {
  drawText(m, txt, x, y, c, { scale: sc, outline: '#0c0a12' });
  const tw = textWidth(txt, sc);
  for (let k = 0; k < tw / 8; k++) { const dx = x + R() * tw, len = 2 + R() * 8; BF(m, dx, y + 7 * sc, 1, len, c); BF(m, dx - 0.5, y + 7 * sc + len, 2, 1, c); }
}
function bgCobweb(m, x, y, r, dir = 1) {
  m.strokeStyle = 'rgba(220,220,235,0.45)'; m.lineWidth = 0.5;
  for (let a = 0; a <= 4; a++) { const an = a / 4 * Math.PI / 2; m.beginPath(); m.moveTo(x, y); m.lineTo(x + dir * Math.cos(an) * r, y + Math.sin(an) * r); m.stroke(); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.4; m.beginPath(); for (let a = 0; a <= 4; a++) { const an = a / 4 * Math.PI / 2, sag = a % 4 ? 0.88 : 1; const px = x + dir * Math.cos(an) * rr * sag, py = y + Math.sin(an) * rr * sag; a ? m.lineTo(px, py) : m.moveTo(px, py); } m.stroke(); }
}
function bgSkull(m, x, y, s, c = '#efe9dc') {
  m.fillStyle = c; m.beginPath(); m.arc(x, y - s * 0.15, s, Math.PI, 0); m.lineTo(x + s, y + s * 0.3); m.lineTo(x + s * 0.55, y + s * 0.55); m.lineTo(x + s * 0.55, y + s * 0.9); m.lineTo(x - s * 0.55, y + s * 0.9); m.lineTo(x - s * 0.55, y + s * 0.55); m.lineTo(x - s, y + s * 0.3); m.fill();
  m.fillStyle = '#0c0a12'; m.beginPath(); m.arc(x - s * 0.42, y + s * 0.05, s * 0.3, 0, Math.PI * 2); m.arc(x + s * 0.42, y + s * 0.05, s * 0.3, 0, Math.PI * 2); m.fill();
  m.beginPath(); m.moveTo(x, y + s * 0.3); m.lineTo(x - s * 0.15, y + s * 0.55); m.lineTo(x + s * 0.15, y + s * 0.55); m.fill();
  for (let k = -2; k <= 2; k++) BF(m, x + k * s * 0.2 - 0.25, y + s * 0.62, 0.5, s * 0.26, '#0c0a12');
}
// schizzo di sangue sul muro (senza sangue: macchia di sporco)
function bgSplat(m, x, y, r, R) {
  const c = goreOn() ? '#7a0c14' : '#1e1a24', c2 = goreOn() ? '#a8141e' : '#26202c';
  m.fillStyle = c; m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); m.fill();
  for (let k = 0; k < 7; k++) { const a = R() * Math.PI * 2, d = r * (1.1 + R() * 1.2); m.beginPath(); m.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 0.6 + R() * r * 0.3, 0, Math.PI * 2); m.fill(); }
  for (let k = 0; k < 3 + R() * 3; k++) { const dx = x + (R() - 0.5) * r * 1.6, len = 4 + R() * 16; BF(m, dx, y, 1, len, c); BF(m, dx - 0.5, y + len, 2, 1.5, c); }
  m.fillStyle = c2; m.beginPath(); m.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, Math.PI * 2); m.fill();
}
function bgChain(m, x, y0, len, c = '#5a5a66') { for (let y = y0; y < y0 + len; y += 3) { BF(m, x - (y % 6 ? 1 : 0.5), y, y % 6 ? 2 : 1, 3, c); BF(m, x - 0.5, y + 1, 1, 1, shade(c, 1.5)); } }
function bgSpeaker(m, x, y, w, h) {
  BF(m, x, y, w, h, '#16141c'); BF(m, x, y, w, 1, '#3a3446'); BF(m, x, y, 1, h, '#2a2832');
  const n = Math.max(1, Math.round(h / w)), r = Math.min(w, h / n) * 0.36;
  for (let i = 0; i < n; i++) { const cx = x + w / 2, cy = y + h / n * (i + 0.5); m.fillStyle = '#2a2832'; m.beginPath(); m.arc(cx, cy, r + 1.2, 0, Math.PI * 2); m.fill(); m.fillStyle = '#08070c'; m.beginPath(); m.arc(cx, cy, r, 0, Math.PI * 2); m.fill(); m.fillStyle = '#3a3446'; m.beginPath(); m.arc(cx, cy, r * 0.35, 0, Math.PI * 2); m.fill(); BF(m, cx - r * 0.5, cy - r * 0.6, 1, 1, '#5a5a6a'); }
  for (let k = x + 2; k < x + w - 1; k += 3) BF(m, k, y + 1.5, 1, 0.5, '#4a4656');
}
function bgTruss(m, x0, x1, y, c = '#4a4a58') {
  BF(m, x0, y, x1 - x0, 1.5, c); BF(m, x0, y + 8, x1 - x0, 1.5, c);
  m.strokeStyle = shade(c, 0.8); m.lineWidth = 1; m.beginPath();
  for (let k = x0; k < x1; k += 8) { m.moveTo(k, y + 1); m.lineTo(k + 4, y + 8); m.lineTo(k + 8, y + 1); }
  m.stroke();
}
function bgCurtain(m, x, y, w, h, c) {
  const [L, M, S, D] = T4(c);
  for (let k = 0; k < w; k += 0.5) { const f = Math.sin(k * 0.55); BF(m, x + k, y, 0.5, h, f > 0.6 ? L : f > 0 ? M : f > -0.6 ? S : D); }
  BF(m, x, y + h - 3, w, 3, D); for (let k = 0; k < w; k += 4) BF(m, x + k, y + h - 1, 2, 2, '#c9a43a');
}
function bgCross(m, x, y, s, c = '#6a5a4a') { BF(m, x - 1, y - s, 2.5, s, c); BF(m, x - s * 0.35, y - s * 0.72, s * 0.7 + 1, 2, c); BF(m, x - 1, y - s, 1, s, shade(c, 1.3)); }
function bgTomb(m, x, y, w, h, c = '#7a7a86', R) {
  const [L, M, S, D] = T4(c);
  m.fillStyle = M; m.beginPath(); m.moveTo(x, y); m.lineTo(x, y - h + w / 2); m.arc(x + w / 2, y - h + w / 2, w / 2, Math.PI, 0); m.lineTo(x + w, y); m.fill();
  BF(m, x, y - h + w / 2, 1, h - w / 2, L); BF(m, x + w - 1.5, y - h + w / 2, 1.5, h - w / 2, S);
  BF(m, x + w * 0.3, y - h + w * 0.6, w * 0.4, 1, D); BF(m, x + w * 0.25, y - h + w * 0.6 + 3, w * 0.5, 1, D); BF(m, x + w * 0.5 - 0.5, y - h + w * 0.3, 1, w * 0.5, D);
  if (R) for (let k = 0; k < 4; k++) BF(m, x + R() * w, y - R() * h * 0.6, 2, 1, '#3a5a2a');
  BF(m, x - 1, y - 1, w + 2, 1.5, D);
}
function bgCactus(m, x, y, h, R) {
  const c = '#3a7a3a', L = '#5aa05a', D = '#1e4a24';
  const arm = (ax, ay, dir, len) => { BF(m, ax, ay, dir * 6, 3.5, c); BF(m, ax + dir * 5 - (dir < 0 ? 3.5 : 0), ay - len, 3.5, len + 3.5, c); BF(m, ax + dir * 5 - (dir < 0 ? 3.5 : 0), ay - len, 1, len, L); };
  BF(m, x - 3, y - h, 6, h, c); BF(m, x - 3, y - h, 1.5, h, L); BF(m, x + 2, y - h, 1, h, D);
  arm(x + 3, y - h * 0.55, 1, h * 0.25); if (R() < 0.7) arm(x - 3, y - h * 0.4, -1, h * 0.2);
  for (let k = y - h + 3; k < y; k += 4) BF(m, x - 4, k, 1, 0.5, '#e8e0c0');
}
function bgFence(m, x, y0, w, y1) {
  m.strokeStyle = 'rgba(160,165,180,0.55)'; m.lineWidth = 0.5; m.beginPath();
  for (let k = x - (y1 - y0); k < x + w; k += 4) { m.moveTo(Math.max(x, k), y0 + Math.max(0, x - k)); m.lineTo(Math.min(x + w, k + (y1 - y0)), y0 + Math.min(y1 - y0, x + w - k)); }
  for (let k = x; k < x + w + (y1 - y0); k += 4) { m.moveTo(Math.min(x + w, k), y0 + Math.max(0, k - x - w)); m.lineTo(Math.max(x, k - (y1 - y0)), y0 + Math.min(y1 - y0, k - x)); }
  m.stroke();
  for (let k = x; k <= x + w; k += 48) { BF(m, k - 1, y0 - 2, 2.5, y1 - y0 + 2, '#8a90a0'); BF(m, k - 1, y0 - 2, 1, y1 - y0 + 2, '#c9cdd6'); }
  BF(m, x, y0, w, 1.5, '#8a90a0');
}
function bgFireEscape(m, x, y0, y1, w) {
  const c = '#1a1620';
  for (let y = y0; y < y1; y += 34) { BF(m, x, y, w, 2, c); for (let k = x; k < x + w; k += 3) BF(m, k, y - 8, 0.5, 8, c); BF(m, x, y - 8, w, 1, c);
    m.strokeStyle = c; m.lineWidth = 1; m.beginPath(); m.moveTo(x + w * 0.2, y + 2); m.lineTo(x + w * 0.75, y + 32); m.stroke(); for (let s = 0; s < 6; s++) BF(m, x + w * 0.2 + s * (w * 0.55 / 6) - 2, y + 4 + s * 5, 4, 0.5, c); }
}
function bgPipe(m, x0, x1, y, r = 2, c = '#5a5a66') { const [L, M, S, D] = T4(c); BF(m, x0, y - r, x1 - x0, r * 2, M); BF(m, x0, y - r, x1 - x0, r * 0.6, L); BF(m, x0, y + r * 0.5, x1 - x0, r * 0.5, D); for (let k = x0 + 30; k < x1; k += 60) { BF(m, k, y - r - 1, 3, r * 2 + 2, S); BF(m, k, y - r - 1, 1, r * 2 + 2, L); } }
function bgCaution(m, x, y, w, h) { BF(m, x, y, w, h, '#ffd23e'); m.save(); m.beginPath(); m.rect(x, y, w, h); m.clip(); m.fillStyle = '#18161e'; for (let k = x - h; k < x + w; k += 8) { m.beginPath(); m.moveTo(k, y + h); m.lineTo(k + 4, y + h); m.lineTo(k + 4 + h, y); m.lineTo(k + h, y); m.fill(); } m.restore(); }
// tela piena con oscuramento in alto (notte)
function bgNightShade(m, w, h, top = 0.5, bottom = 0.15) {
  m.save(); m.globalCompositeOperation = 'source-atop';
  const g = m.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(8,4,24,${top})`); g.addColorStop(0.45, `rgba(8,4,24,${top * 0.35})`); g.addColorStop(1, `rgba(8,4,24,${bottom})`);
  m.fillStyle = g; m.fillRect(0, 0, w, h); m.restore();
}
function bgSkyBands(sc, bands, R, stars = 50) {
  bands.forEach((c, i) => BF(sc, 0, i * 10, W, 10, c));
  for (let i = 1; i < bands.length; i++) bgDither(sc, 0, i * 10 - 2, W, 2, bands[i], i);
  for (let i = 0; i < stars; i++) BF(sc, Math.floor(R() * W), Math.floor(R() * 44), 1, 1, R() < 0.2 ? '#fff4c0' : '#c8c0ff');
}
function bgMoon(sc, mx, my, r, c = '#f6efcc') { for (let y = -r; y <= r; y += 0.5) for (let x = -r; x <= r; x += 0.5) { const d = x * x + y * y; if (d <= r * r) BF(sc, mx + x, my + y, 0.5, 0.5, d > (r - 1.5) * (r - 1.5) ? shade(c, 0.85) : (x - y > r * 0.4 ? shade(c, 0.93) : c)); } }

// ============================================================
// Costruttore comune
// ============================================================
class BgTheme {
  constructor(L, d, key) { this.L = L; this.d = d; this.key = key; this.T = BG_THEMES[key]; this.worldEnd = L.worldEnd; this.anim = []; this.bats = []; this.build(); }
  get bossSpawn() { return { x: this.bossDoor + 40, z: 150, entryX: this.bossDoor - 30 }; }
  build() {
    const T = this.T, R = mulberry(T.seed || 1234), we = this.worldEnd;
    this.R = R;
    // cielo / buio di fondo
    const [sky, sc] = bgCanvas(W, BASE_Y); T.sky.call(this, sc, R); this.sky = sky;
    // piano lontano in parallasse
    const farW = Math.ceil(W + (we - W) * (T.farPar ?? 0.3)) + 40;
    const [far, fc] = bgCanvas(farW, BASE_Y); if (T.far) T.far.call(this, fc, farW, R); this.far = far;
    // facciate / pareti: sequenza di segmenti, poi la zona del boss
    const [mid, m] = bgCanvas(we, BASE_Y); this.mid = mid;
    const bw = T.bossW || 440, bx = we - bw; this.bossX = bx;
    let x = 0, i = 0;
    while (x < bx - 40) {
      const type = T.seq[i % T.seq.length], [a, b] = T.segW[type] || [180, 240];
      let w = Math.floor(a + R() * (b - a)); if (bx - (x + w) < 90) w = bx - x;
      T.seg[type].call(this, m, x, w, R, i); x += w; i++;
    }
    T.boss.call(this, m, bx, bw, R);
    if (this.bossDoor === undefined) this.bossDoor = bx + bw / 2;
    if (T.shade !== false) bgNightShade(m, we, BASE_Y, T.shadeTop ?? 0.45, T.shadeBottom ?? 0.15);
    if (T.post) T.post.call(this, m, R);
    // pavimento
    const [gr, g] = bgCanvas(we, GND_H); T.ground.call(this, g, we, GND_H, R); this.ground = gr;
    // pipistrelli
    for (let k = 0; k < (T.bats || 0); k++) this.bats.push({ x: R() * W, y: 10 + R() * (T.batY || 40), v: 0.3 + R() * 0.5, ph: R() * 6, a: R() * 6 });
  }
  // ---------- animazioni dal vivo ----------
  drawAnims(ctx, camX) {
    const f = G.frame, calm = typeof Opts !== 'undefined' && Opts.flash === false;
    for (const a of this.anim) {
      const x = a.x - camX * (a.par ?? 1); if (x < -80 || x > W + 80) continue;
      if (a.t === 'flame') {
        const s = a.s || 1, fl = Math.sin(f * 0.3 + a.x) * 0.5 + Math.sin(f * 0.71 + a.x * 2) * 0.5;
        const gr = (9 + fl) * s * 1.4, gg = ctx.createRadialGradient(x, a.y - 3 * s, 0, x, a.y - 3 * s, gr); gg.addColorStop(0, 'rgba(255,150,50,0.32)'); gg.addColorStop(1, 'rgba(255,150,50,0)'); ctx.fillStyle = gg; ctx.fillRect(x - gr, a.y - 3 * s - gr, gr * 2, gr * 2);
        fdisc(ctx, x, a.y - 2 * s, 2.6 * s, '#ff5a1a'); fdisc(ctx, x + fl * 0.4, a.y - 3.6 * s, 1.8 * s, '#ffb03a'); fdisc(ctx, x + fl * 0.6, a.y - 5 * s, 0.9 * s, '#fff2a8');
        if (a.big && f % 3 === 0) addFx('ember', a.x + rand(-3, 3), BASE_Y + 40, BASE_Y + 40 - a.y + 4, { life: 18, vx: rand(-0.3, 0.3), vy: rand(0.4, 1) });
      } else if (a.t === 'neon') {
        const flick = ((f + a.x) % 300 < 4) || ((f + a.x * 3) % 610 < 3);
        if (!flick) { ctx.globalAlpha = 0.16; ctx.fillStyle = a.c; ctx.fillRect(x - a.w / 2 - 2, a.y - 4, a.w + 4, 8 * (a.sc || 2) + 6); ctx.globalAlpha = 1; drawText(ctx, a.txt, x, a.y, a.c, { align: 'center', scale: a.sc || 2, outline: shade(a.c, 0.4) }); }
        else drawText(ctx, a.txt, x, a.y, shade(a.c, 0.32), { align: 'center', scale: a.sc || 2 });
      } else if (a.t === 'eyes') {
        const blink = (f + a.x * 7) % 400 < 8 || (f + a.x * 3) % 900 > 640;
        if (!blink) { BF(ctx, x - 2.5, a.y, 1.5, 1, a.c || '#ff3040'); BF(ctx, x + 1, a.y, 1.5, 1, a.c || '#ff3040'); }
      } else if (a.t === 'screen') {
        const ph = (f >> 3) + a.x;
        ctx.fillStyle = '#08070c'; ctx.fillRect(x, a.y, a.w, a.h);
        const mode = ((f >> 7) + Math.floor(a.x)) % 3;
        if (mode === 0) for (let k = 0; k < a.w; k += 2) { ctx.fillStyle = a.pal[(Math.floor(k / 6) + ph) % a.pal.length]; ctx.fillRect(x + k, a.y + a.h * 0.2 + Math.sin((k + f) * 0.1) * a.h * 0.15, 2, a.h * 0.6); }
        else if (mode === 1) { for (let k = 0; k < a.h; k += 1) { ctx.fillStyle = ((k + (f >> 1)) % 4 < 2) ? '#3a3a46' : '#9a9aa8'; ctx.globalAlpha = 0.4 + Math.random() * 0.3; ctx.fillRect(x, a.y + k, a.w, 1); } ctx.globalAlpha = 1; }
        else { ctx.fillStyle = '#e8e0d0'; const cx = x + a.w / 2, cy = a.y + a.h / 2; fdisc(ctx, cx, cy, a.h * 0.32, '#e8e0d0'); fdisc(ctx, cx + Math.sin(f * 0.02) * a.h * 0.12, cy, a.h * 0.16, a.pal[0]); fdisc(ctx, cx + Math.sin(f * 0.02) * a.h * 0.12, cy, a.h * 0.07, '#08070c'); }
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < a.h; k += 2) ctx.fillRect(x, a.y + k, a.w, 0.5);
      } else if (a.t === 'laser') {
        const sw = Math.sin(f * 0.02 * (a.sp || 1) + a.x) * 0.9, len = 150;
        if (calm && (f >> 4) % 2) continue;
        ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = a.c; ctx.lineWidth = 1;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x + Math.sin(sw + k * 0.25) * len, a.y + Math.cos(sw + k * 0.25) * len); ctx.stroke(); }
        ctx.restore(); fdisc(ctx, x, a.y, 1.5, '#ffffff');
      } else if (a.t === 'spot') {
        const on = calm ? 0.12 : 0.1 + 0.06 * Math.sin(f * 0.05 + a.x);
        ctx.save(); ctx.globalAlpha = on; ctx.fillStyle = a.c || '#fff2c8'; ctx.beginPath(); const sx = Math.sin(f * 0.012 + a.x) * (a.sweep || 0);
        ctx.moveTo(x - 2, a.y); ctx.lineTo(x + 2, a.y); ctx.lineTo(x + sx + 26, BASE_Y + 70); ctx.lineTo(x + sx - 26, BASE_Y + 70); ctx.fill(); ctx.restore();
      } else if (a.t === 'drip') {
        if (!goreOn()) continue;
        const per = a.per || 180, k = (f + a.x * 5) % per, len = Math.min(a.len, k * 0.15);
        BF(ctx, x, a.y, 1, len, '#8a1018');
        if (k > a.len / 0.15) { const dy = (k - a.len / 0.15) * 1.6; if (a.y + a.len + dy < BASE_Y + 20) BF(ctx, x - 0.25, a.y + a.len + dy, 1.5, 2, '#a8141e'); }
      } else if (a.t === 'swing') {
        const an = Math.sin(f * 0.03 + a.x) * 0.18, ex = x + Math.sin(an) * a.len, ey = a.y + Math.cos(an) * a.len;
        ctx.strokeStyle = '#3a3446'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
        if (a.lamp) { fdisc(ctx, ex, ey + 2, 3, '#2a2832'); ctx.globalAlpha = 0.18 + 0.06 * Math.sin(f * 0.2); fdisc(ctx, ex, ey + 6, 14, a.lamp); ctx.globalAlpha = 1; fdisc(ctx, ex, ey + 4, 1.5, '#fff2a8'); }
        else { BF(ctx, ex - 2, ey, 4, 2, '#8a90a0'); BF(ctx, ex - 0.5, ey + 2, 1, 4, '#8a90a0'); BF(ctx, ex - 2, ey + 6, 2, 1, '#8a90a0'); }
      } else if (a.t === 'glow') {
        // alone morbido (gradiente radiale), pulsa piano
        const k = (a.a || 0.2) * (0.7 + 0.3 * Math.sin(f * (a.sp || 0.05) + a.x));
        if (!a._rgb) a._rgb = [1, 3, 5].map(i => parseInt(a.c.slice(i, i + 2), 16)).join(',');
        const g = ctx.createRadialGradient(x, a.y, 0, x, a.y, a.r); g.addColorStop(0, `rgba(${a._rgb},${k * 1.6})`); g.addColorStop(1, `rgba(${a._rgb},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - a.r, a.y - a.r, a.r * 2, a.r * 2);
      } else if (a.t === 'band') {
        const k = (a.a || 0.2) * (0.75 + 0.25 * Math.sin(f * (a.sp || 0.05) + a.x));
        ctx.globalAlpha = k; ctx.fillStyle = a.c; ctx.fillRect(x - a.w / 2, a.y - 3, a.w, 6); ctx.globalAlpha = k * 0.5; ctx.fillRect(x - a.w / 2 - 3, a.y - 6, a.w + 6, 12); ctx.globalAlpha = 1;
      } else if (a.t === 'bulb') {
        const on = ((a.x / 7 + (this.L.marquee >> 3)) % 3 < 1);
        ctx.fillStyle = on ? '#fff2a8' : '#6a5a2a'; ctx.fillRect(Math.round(x), a.y, 2, 2);
      }
    }
    // pipistrelli che svolazzano
    for (const b of this.bats) {
      b.x -= b.v; b.a += 0.05; if (b.x < -20) { b.x = W + 20; b.y = 10 + Math.random() * (this.T.batY || 40); }
      blitHi(ctx, batSprite(((f + (b.ph * 10 | 0)) >> 3) % 2), b.x - 8, b.y + Math.sin(b.a) * 4);
    }
  }
  drawBack(ctx, camX) {
    ctx.drawImage(this.sky, 0, 0, this.sky.width / RS, this.sky.height / RS);
    if (this.T.skyAnim) this.T.skyAnim.call(this, ctx, camX);
    ctx.drawImage(this.far, -Math.round(camX * (this.T.farPar ?? 0.3) * RS) / RS, 0, this.far.width / RS, this.far.height / RS);
    ctx.drawImage(this.mid, -Math.round(camX * RS) / RS, 0, this.mid.width / RS, this.mid.height / RS);
    this.drawAnims(ctx, camX);
    if (this.T.bossAnim) this.T.bossAnim.call(this, ctx, camX);
    ctx.drawImage(this.ground, -Math.round(camX * RS) / RS, BASE_Y, this.ground.width / RS, this.ground.height / RS);
    if (this.T.groundAnim) this.T.groundAnim.call(this, ctx, camX);
  }
  drawFront(ctx, camX) { if (this.T.front) this.T.front.call(this, ctx, camX); }
  bossLit() { return this.L.bossPhase && this.L.bossPhase !== 'wait'; }
}

// pavimenti
function gndConcrete(g, w, gh, R, base, o = {}) {
  const [L, M, S, D] = T4(base);
  BF(g, 0, 0, w, gh, M); bgDither(g, 0, 0, w, 3, D); BF(g, 0, 0, w, 1, D);
  for (let i = 0; i < w * gh * 0.04; i++) BF(g, R() * w, R() * gh, R() < 0.3 ? 1.5 : 0.5, 0.5, R() < 0.5 ? S : L);
  for (let k = 0; k < w; k += o.slab || 64) BF(g, k, 4, 0.5, gh, S);
  for (let y = 22; y < gh; y += 26) BF(g, 0, y, w, 0.5, S);
  for (let k = 90; k < w; k += 120 + R() * 200) { let cx = k, cy = 6 + R() * (gh - 10); for (let s = 0; s < 16; s++) { BF(g, cx, cy, 1, 0.5, D); cx += bgPick(R, [0.5, 1, 1.5]); cy += bgPick(R, [-0.5, 0, 0, 0.5]); } }
  for (let k = 140; k < w; k += 160 + R() * 260) { g.fillStyle = 'rgba(10,6,16,0.3)'; g.beginPath(); g.ellipse(k, 14 + R() * (gh - 24), 10 + R() * 18, 2 + R() * 3, 0, 0, Math.PI * 2); g.fill(); }
  if (o.blood && goreOn()) for (let k = 300; k < w; k += 260 + R() * 400) { const y = 16 + R() * (gh - 30); g.fillStyle = 'rgba(122,12,20,0.75)'; g.beginPath(); g.ellipse(k, y, 6 + R() * 10, 1.5 + R() * 2.5, 0, 0, Math.PI * 2); g.fill(); for (let s = 0; s < 5; s++) { g.beginPath(); g.ellipse(k + (R() - 0.5) * 30, y + (R() - 0.5) * 6, 1 + R() * 1.5, 0.5 + R(), 0, 0, Math.PI * 2); g.fill(); } }
}
function gndLitter(g, w, gh, R, n = 0.02) {
  for (let i = 0; i < w * n; i++) {
    const x = R() * w, y = 8 + R() * (gh - 12), r = R();
    if (r < 0.3) { BF(g, x, y, 3, 1.5, bgPick(R, ['#c42032', '#3a6ae0', '#c9cdd6'])); BF(g, x, y, 3, 0.5, '#ffffff'); }        // lattina
    else if (r < 0.5) { BF(g, x, y, 4, 1.5, '#2a8a3a'); BF(g, x + 4, y + 0.25, 1.5, 1, '#2a8a3a'); }                          // bottiglia
    else if (r < 0.75) { BF(g, x, y, 1, 0.5, '#e8f4ff'); BF(g, x + 1.5, y + 0.5, 0.5, 0.5, '#e8f4ff'); }                       // vetri
    else { BF(g, x, y, 5, 3, bgPick(R, ['#efe3c4', '#d8d0c0', '#c9c4d0'])); BF(g, x + 1, y + 1, 3, 0.5, '#8a8494'); }         // carta
  }
}
function gndPlanks(g, w, gh, R, wood) {
  const [L, M, S, D] = T4(wood);
  BF(g, 0, 0, w, gh, M);
  for (let y = 0; y < gh; y += 5) { BF(g, 0, y + 4.5, w, 0.5, D); for (let k = (y * 7) % 50; k < w; k += 40 + ((y * 13) % 30)) { BF(g, k, y, 0.5, 4.5, D); BF(g, k + 0.5, y, 0.5, 4.5, L); } if (y % 10 === 0) bgDither(g, 0, y + 1, w, 1, S, y); }
  for (let i = 0; i < w * 0.08; i++) BF(g, R() * w, R() * gh, 2 + R() * 4, 0.5, S);
  bgDither(g, 0, 0, w, 4, D); BF(g, 0, 0, w, 1, D);
}
function gndChecker(g, w, gh, R, a, b) {
  for (let y = 0, r = 0; y < gh; y += 10, r++) for (let x = (r % 2) * 14; x < w; x += 28) BF(g, x, y, 14, 10, a);
  g.globalCompositeOperation = 'destination-over'; BF(g, 0, 0, w, gh, b); g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < w * 0.06; i++) BF(g, R() * w, R() * gh, 2, 0.5, 'rgba(255,255,255,0.08)');
  bgDither(g, 0, 0, w, 4, '#0c0a12'); BF(g, 0, 0, w, 1, '#0c0a12');
}

// ============================================================
// I TEMI
// ============================================================
const BG_THEMES = {
  // ---------------- 2: PUNK — locale occupato tra i capannoni ----------------
  squat: {
    seed: 77, bats: 5,
    sky(sc, R) { bgSkyBands(sc, ['#0a0612', '#120814', '#1c0a18', '#2a0e1c', '#3a1420', '#4a1a22', '#5a2026', '#6a2a2a', '#7a3a30', '#7a3a30', '#7a3a30', '#7a3a30', '#7a3a30', '#7a3a30'], R, 30); bgMoon(sc, 60, 22, 9, '#e8c8a8'); },
    far(fc, fw, R) {
      for (let x = 0; x < fw;) { const w = 40 + R() * 70, top = 30 + R() * 46, c = bgPick(R, ['#1a0c14', '#200e18', '#160a12']);
        BF(fc, x, top, w, BASE_Y - top, c); BF(fc, x, top, w, 1, '#3a1a24');
        if (R() < 0.5) { const cx = x + w * 0.3; BF(fc, cx, top - 34, 6, 34, c); BF(fc, cx - 1, top - 36, 8, 2, '#3a1a24'); for (let s = 0; s < 3; s++) BF(fc, cx + 1, top - 30 + s * 9, 4, 1, '#5a2a2a'); }
        for (let wy = top + 6; wy < BASE_Y - 8; wy += 9) for (let wx = x + 4; wx < x + w - 6; wx += 8) if (R() < 0.12) BF(fc, wx, wy, 3, 3, bgPick(R, ['#ffb44a', '#ff6a3a', '#ffd97a']));
        if (R() < 0.2) { BF(fc, x + w / 2 - 8, top - 22, 16, 12, c); BF(fc, x + w / 2 - 1, top - 10, 2, 10, c); }
        x += w + R() * 10; }
    },
    seq: ['wall', 'fence', 'wall', 'shutter', 'wall', 'fence', 'shutter'],
    segW: { wall: [200, 260], fence: [120, 170], shutter: [150, 190] },
    seg: {
      wall(m, x, w, R) {
        bgBricks(m, x, 0, w, BASE_Y, bgPick(R, ['#5a2a2a', '#4a2a30', '#5a3a34']), R);
        BF(m, x, 0, w, 6, '#1a1016'); BF(m, x, 6, w, 1, '#3a2a30');
        for (let k = x + 20; k < x + w - 40; k += 70) bgWindow(m, k, 20, 30, 34, { board: R() < 0.5, broken: R() < 0.4, lit: R() < 0.25 ? '#ff9a4a' : null });
        bgGraffiti(m, x + 10 + R() * (w - 120), 74 + R() * 10, bgPick(R, ['NO FUTURO', 'POGO!', 'OI OI', 'ZOMBI PUNK', 'CAOS']), bgPick(R, ['#62f08e', '#ff4fa0', '#ffd23e', '#3ae0ff']), R);
        for (let k = 0; k < 3; k++) bgPoster(m, x + 8 + R() * (w - 40), 92 + R() * 12, 22, 28, bgPick(R, ['#efe3c4', '#ffd23e', '#ff4fa0']), '#18161e', bgPick(R, ['LIVE', 'PUNK', 'RIOT', 'OI!']), R, { torn: R() < 0.6, skull: R() < 0.5, wall: '#4a2a2a' });
        if (R() < 0.7) bgSplat(m, x + R() * w, 90 + R() * 20, 3 + R() * 3, R);
        this.anim.push({ t: 'eyes', x: x + 35, y: 37, c: '#ffd23e' });
      },
      fence(m, x, w, R) {
        bgFence(m, x, 52, w, BASE_Y);
        for (let k = 0; k < 3; k++) { const px = x + 10 + R() * (w - 30); BF(m, px, 70 + R() * 30, 14, 10, bgPick(R, ['#c42032', '#efe3c4'])); }
        // bidone che brucia dietro la rete
        const bx = x + w * 0.5; BF(m, bx - 9, BASE_Y - 22, 18, 22, '#3a3a46'); BF(m, bx - 9, BASE_Y - 22, 18, 2, '#6a6a7a'); BF(m, bx - 9, BASE_Y - 12, 18, 1, '#22222a'); BF(m, bx - 9, BASE_Y - 22, 3, 22, '#5a5a66');
        this.anim.push({ t: 'flame', x: bx, y: BASE_Y - 22, s: 2.4, big: true }, { t: 'glow', x: bx, y: BASE_Y - 30, r: 30, c: '#ff7a2a', a: 0.12 });
      },
      shutter(m, x, w, R) {
        bgBricks(m, x, 0, w, BASE_Y, '#3a2a30', R);
        const sx = x + 16, sw = w - 32;
        BF(m, sx - 3, 40, sw + 6, BASE_Y - 40, '#22222a');
        bgMetal(m, sx, 44, sw, BASE_Y, '#6a6a76', R);
        for (let y = 48; y < BASE_Y; y += 4) BF(m, sx, y, sw, 0.5, '#3a3a46');
        bgGraffiti(m, sx + 8, 62, bgPick(R, ['SQUAT', 'OCCUPATO', 'PUNX']), bgPick(R, ['#ff4fa0', '#62f08e', '#ffd23e']), R, 3);
        bgSkull(m, sx + sw - 20, 100, 8, '#efe9dc');
        if (R() < 0.6) bgSplat(m, sx + R() * sw, 110, 4, R);
        BF(m, sx - 3, 38, sw + 6, 4, '#18161e');
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      bgBricks(m, x, 0, w, BASE_Y, '#2a1a20', R);
      // palco improvvisato: impalcature e amplificatori
      for (let k = x + 20; k < x + w; k += 60) { BF(m, k, 20, 3, BASE_Y - 20, '#8a90a0'); BF(m, k, 20, 1, BASE_Y - 20, '#c9cdd6'); }
      for (let y = 20; y < BASE_Y; y += 36) { BF(m, x + 20, y, w - 40, 2, '#8a90a0'); }
      BF(m, x + 40, 30, w - 80, 22, '#1a0a10'); BF(m, x + 40, 30, w - 80, 1, '#c42032');
      for (let k = 0; k < 4; k++) bgSpeaker(m, x + 50 + k * 90, 62, 34, 60);
      this.bossDoor = x + w / 2;
      this.anim.push({ t: 'neon', x: x + w / 2, y: 33, txt: 'POGO NIGHT', c: '#62f08e', w: textWidth('POGO NIGHT', 2), sc: 2 });
      for (let k = 0; k < 6; k++) this.anim.push({ t: 'flame', x: x + 40 + k * (w - 80) / 5, y: 26, s: 1.2 });
      bgSplat(m, x + 90, 100, 6, R); bgSplat(m, x + w - 80, 96, 5, R);
    },
    ground(g, w, gh, R) { gndConcrete(g, w, gh, R, '#4a4048', { blood: true }); gndLitter(g, w, gh, R, 0.03); },
    front(ctx, camX) {
      for (let k = 700; k < this.worldEnd; k += 900) { const x = Math.round(k - camX * 1.2); if (x < -30 || x > W + 30) continue;
        ctx.fillStyle = '#0a0608'; ctx.fillRect(x - 3, 0, 18, H); ctx.fillStyle = '#1a1014'; ctx.fillRect(x + 1, 0, 10, H); ctx.fillStyle = '#3a2420'; ctx.fillRect(x + 2, 0, 2, H);
        for (let y = 8; y < H; y += 16) { ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x - 2, y, 1.5, 1.5); ctx.fillRect(x + 12.5, y, 1.5, 1.5); }
        ctx.fillStyle = '#c42032'; ctx.fillRect(x - 3, 92, 18, 22); ctx.fillStyle = '#0a0608'; ctx.fillRect(x - 3, 92, 18, 1); drawText(ctx, 'NO', x + 6, 97, '#ffffff', { align: 'center' }); }
    },
  },

  // ---------------- 3: ELETTRONICA — officina abbandonata trasformata in rave ----------------
  rave: {
    seed: 303, shadeTop: 0.55,
    sky(sc, R) { BF(sc, 0, 0, W, BASE_Y, '#06050c'); for (let i = 0; i < 6; i++) { const g = sc.createRadialGradient(R() * W, 40 + R() * 60, 2, R() * W, 60, 90); g.addColorStop(0, bgPick(R, ['rgba(58,224,255,0.18)', 'rgba(255,79,160,0.16)', 'rgba(98,240,142,0.14)'])); g.addColorStop(1, 'rgba(0,0,0,0)'); sc.fillStyle = g; sc.fillRect(0, 0, W, BASE_Y); } },
    farPar: 0.4,
    far(fc, fw, R) {
      for (let k = 0; k < fw; k += 70) { BF(fc, k, 0, 8, BASE_Y, '#121018'); BF(fc, k, 0, 2, BASE_Y, '#1e1a28'); }
      bgTruss(fc, 0, fw, 12, '#22202c'); bgTruss(fc, 0, fw, 40, '#1a1822');
      for (let k = 20; k < fw; k += 140) { bgSpeaker(fc, k, 74, 22, 46); bgSpeaker(fc, k + 24, 74, 22, 46); }
      fc.save(); fc.globalAlpha = 0.5; for (let k = 0; k < fw; k += 3) BF(fc, k, 112 + Math.sin(k * 0.21) * 2, 2, 20, bgPick(R, ['#0a0810', '#120e1a', '#0e0c16'])); fc.restore();
    },
    seq: ['panels', 'opening', 'speakers', 'panels', 'drums', 'opening', 'cage'],
    segW: { panels: [180, 240], speakers: [120, 150], drums: [140, 180], cage: [130, 160], opening: [160, 200] },
    post(m, R) {
      // luci colorate che lavano le pareti e tubi al neon
      m.save(); m.globalCompositeOperation = 'source-atop';
      for (let x = 60; x < this.worldEnd; x += 120 + R() * 80) { const c = bgPick(R, ['58,224,255', '255,79,160', '98,240,142', '197,139,255']), g = m.createRadialGradient(x, 70, 4, x, 70, 90); g.addColorStop(0, `rgba(${c},0.32)`); g.addColorStop(1, `rgba(${c},0)`); m.fillStyle = g; m.fillRect(x - 90, 0, 180, BASE_Y); }
      m.restore();
    },
    seg: {
      opening(m, x, w, R) {
        // grande varco nel muro: si vede la sala con la folla
        BF(m, x, 0, w, 16, '#22242c'); BF(m, x, 16, w, 2, '#3a3e4a'); BF(m, x, 0, 8, BASE_Y, '#2a2e38'); BF(m, x + w - 8, 0, 8, BASE_Y, '#2a2e38');
        bgCaution(m, x, 16, w, 4);
        m.clearRect(x + 8, 20, w - 16, BASE_Y - 20);
        for (let k = x + 12; k < x + w - 12; k += 7 + R() * 5) { const hh = 26 + R() * 10, hx = k; m.fillStyle = '#05040a'; m.fillRect(hx, BASE_Y - hh, 6, hh); m.beginPath(); m.arc(hx + 3, BASE_Y - hh - 2, 3.5, 0, Math.PI * 2); m.fill(); if (R() < 0.4) m.fillRect(hx + (R() < 0.5 ? -2 : 6), BASE_Y - hh - 10, 2, 12); }
        this.anim.push({ t: 'laser', x: x + w * 0.5, y: 22, c: bgPick(R, ['#3ae0ff', '#ff4fa0', '#62f08e']), sp: 1.6 }, { t: 'glow', x: x + w / 2, y: 70, r: 50, c: bgPick(R, ['#ff4fa0', '#3ae0ff']), a: 0.18, sp: 0.3 });
      },
      panels(m, x, w, R) {
        bgMetal(m, x, 0, w, BASE_Y, bgPick(R, ['#3a4250', '#343a48', '#40404c']), R);
        bgPipe(m, x, x + w, 18, 2.5, '#6a6a76'); bgPipe(m, x, x + w, 26, 1.5, '#8a5a3a');
        const nc = bgPick(R, ['#3ae0ff', '#ff4fa0', '#62f08e']); BF(m, x + 6, 36, w - 12, 2, nc); BF(m, x + 6, 36, w - 12, 0.5, '#ffffff'); this.anim.push({ t: 'band', x: x + w / 2, y: 37, w: w - 12, c: nc, a: 0.14, sp: 0.04 });
        bgCaution(m, x, BASE_Y - 10, w, 6);
        const fx = x + w * 0.5, fy = 58; m.fillStyle = '#18161e'; m.beginPath(); m.arc(fx, fy, 18, 0, Math.PI * 2); m.fill(); m.fillStyle = '#3a3a46'; m.beginPath(); m.arc(fx, fy, 16, 0, Math.PI * 2); m.fill();
        m.fillStyle = '#22222a'; for (let a = 0; a < 3; a++) { m.beginPath(); m.ellipse(fx + Math.cos(a * 2.1) * 8, fy + Math.sin(a * 2.1) * 8, 9, 4, a * 2.1, 0, Math.PI * 2); m.fill(); }
        bgGraffiti(m, x + 14, 88, bgPick(R, ['ZONA RAVE', 'BASSO!', 'BPM 160', 'REPARTO 9']), bgPick(R, ['#ffd23e', '#ff4fa0', '#3ae0ff']), R);
        if (R() < 0.5) bgSplat(m, x + R() * w, 100, 3, R);
        this.anim.push({ t: 'laser', x: x + w * 0.25, y: 6, c: bgPick(R, ['#3ae0ff', '#ff4fa0', '#62f08e']), sp: 0.8 + R() });
      },
      speakers(m, x, w, R) {
        bgMetal(m, x, 0, w, BASE_Y, '#2a2e38', R);
        bgSpeaker(m, x + 6, 30, w / 2 - 9, 50); bgSpeaker(m, x + w / 2 + 3, 30, w / 2 - 9, 50); bgSpeaker(m, x + 6, 82, w - 12, BASE_Y - 84);
        this.anim.push({ t: 'glow', x: x + w / 2, y: 60, r: 40, c: '#3ae0ff', a: 0.1, sp: 0.25 });
      },
      drums(m, x, w, R) {
        bgMetal(m, x, 0, w, BASE_Y, '#3a3a40', R);
        bgPipe(m, x, x + w, 18, 2.5, '#6a6a76');
        for (let k = 0; k < 4; k++) { const dx = x + 12 + k * (w - 30) / 3, h = 30; BF(m, dx, BASE_Y - h, 20, h, '#2a5a2a'); BF(m, dx, BASE_Y - h, 20, 2, '#4a8a4a'); BF(m, dx, BASE_Y - h + 10, 20, 1, '#1a3a1a'); BF(m, dx, BASE_Y - h + 20, 20, 1, '#1a3a1a'); BF(m, dx, BASE_Y - h, 4, h, '#3a7a3a');
          m.fillStyle = '#c6f04a'; m.beginPath(); m.arc(dx + 10, BASE_Y - 16, 4, 0, Math.PI * 2); m.fill(); m.fillStyle = '#18161e'; m.beginPath(); m.arc(dx + 10, BASE_Y - 16, 1.2, 0, Math.PI * 2); m.fill();
          this.anim.push({ t: 'glow', x: dx + 10, y: BASE_Y - h, r: 14, c: '#7aff4a', a: 0.22, sp: 0.08 }); }
        drawText(m, 'TOSSICO', x + 20, 44, '#c6f04a');
      },
      cage(m, x, w, R) {
        bgMetal(m, x, 0, w, BASE_Y, '#2a2e38', R);
        BF(m, x + 10, 30, w - 20, BASE_Y - 30, '#0c0a12');
        for (let k = x + 10; k <= x + w - 10; k += 6) BF(m, k, 30, 1, BASE_Y - 30, '#6a6a76');
        for (let y = 30; y < BASE_Y; y += 24) BF(m, x + 10, y, w - 20, 1.5, '#6a6a76');
        bgSkull(m, x + w / 2, BASE_Y - 10, 6); BF(m, x + w / 2 - 10, BASE_Y - 4, 20, 2, '#efe9dc');
        this.anim.push({ t: 'eyes', x: x + w * 0.3, y: 70, c: '#62f08e' }, { t: 'swing', x: x + w / 2, y: 0, len: 26 });
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      bgMetal(m, x, 0, w, BASE_Y, '#1e2028', R);
      for (let k = 0; k < 6; k++) bgSpeaker(m, x + 10 + k * 72, 30, 60, 46);
      BF(m, x + w / 2 - 70, 80, 140, 40, '#18161e'); BF(m, x + w / 2 - 70, 80, 140, 2, '#3ae0ff');   // consolle
      for (let k = 0; k < 2; k++) { const cx = x + w / 2 - 36 + k * 72; m.fillStyle = '#2a2832'; m.beginPath(); m.arc(cx, 94, 12, 0, Math.PI * 2); m.fill(); m.fillStyle = '#08070c'; m.beginPath(); m.arc(cx, 94, 10, 0, Math.PI * 2); m.fill(); }
      this.bossDoor = x + w / 2;
      this.anim.push({ t: 'screen', x: x + w / 2 - 60, y: 6, w: 120, h: 20, pal: ['#3ae0ff', '#ff4fa0', '#62f08e', '#ffd23e'] });
      for (let k = 0; k < 5; k++) this.anim.push({ t: 'laser', x: x + 40 + k * 90, y: 4, c: ['#3ae0ff', '#ff4fa0', '#62f08e'][k % 3], sp: 1.4 });
    },
    ground(g, w, gh, R) {
      gndConcrete(g, w, gh, R, '#2a2a32', { blood: true });
      for (let i = 0; i < w / 50; i++) { const y = 10 + R() * (gh - 14); g.strokeStyle = '#0c0a12'; g.lineWidth = 1; g.beginPath(); g.moveTo(i * 50, y); g.bezierCurveTo(i * 50 + 20, y + 6, i * 50 + 30, y - 6, i * 50 + 60, y); g.stroke(); }
    },
    groundAnim(ctx, camX) {
      const f = G.frame, calm = typeof Opts !== 'undefined' && Opts.flash === false;
      for (let k = 0; k < 5; k++) { const x = ((k * 97 + f * (calm ? 0.2 : 0.6)) % (W + 80)) - 40, z = 150 + (k * 23) % 60; pixelShadow(ctx, x, z, 26, 5, ['rgba(58,224,255,0.12)', 'rgba(255,79,160,0.12)', 'rgba(98,240,142,0.12)'][k % 3]); }
    },
    front(ctx, camX) {
      for (let k = 600; k < this.worldEnd; k += 820) { const x = Math.round(k - camX * 1.25); if (x < -40 || x > W + 40) continue;
        ctx.fillStyle = '#05040a'; ctx.fillRect(x, 0, 14, H); ctx.fillStyle = '#2a2a36'; ctx.fillRect(x + 2, 0, 2, H); bgCaution(ctx, x, H - 30, 14, 8); }
    },
  },

  // ---------------- 4: HIP HOP — quartiere di palazzine con le scale antincendio ----------------
  block: {
    seed: 404, bats: 3,
    sky(sc, R) { bgSkyBands(sc, ['#0c0a24', '#141032', '#1c1440', '#26184c', '#341c58', '#462262', '#5a2a66', '#6a3466', '#6a3466', '#6a3466', '#6a3466', '#6a3466', '#6a3466', '#6a3466'], R, 40); },
    far(fc, fw, R) {
      for (let x = 0; x < fw;) { const w = 30 + R() * 60, top = 8 + R() * 40, c = bgPick(R, ['#1a1430', '#20183a', '#16122a']);
        BF(fc, x, top, w, BASE_Y - top, c); BF(fc, x, top, w, 1, '#3a2a5a');
        for (let wy = top + 4; wy < BASE_Y - 4; wy += 5) for (let wx = x + 3; wx < x + w - 4; wx += 5) if (R() < 0.25) BF(fc, wx, wy, 2, 2, bgPick(R, ['#ffd97a', '#ffb44a', '#ff9ad9']));
        if (R() < 0.25) { BF(fc, x + w / 2 - 5, top - 16, 10, 10, c); BF(fc, x + w / 2 - 6, top - 18, 12, 2, '#3a2a5a'); BF(fc, x + w / 2 - 4, top - 6, 1, 6, c); BF(fc, x + w / 2 + 3, top - 6, 1, 6, c); }
        x += w + R() * 6; }
    },
    seq: ['brown', 'brown', 'court', 'store', 'brown', 'graffiti'],
    segW: { brown: [170, 210], court: [190, 230], store: [180, 220], graffiti: [150, 190] },
    seg: {
      brown(m, x, w, R) {
        const wall = bgPick(R, ['#6a3a2a', '#5a3428', '#7a4432']);
        bgBricks(m, x, 0, w, BASE_Y, wall, R);
        BF(m, x, 0, w, 4, shade(wall, 0.6)); for (let k = x; k < x + w; k += 8) BF(m, k, 4, 6, 3, shade(wall, 0.75));
        for (let row = 0; row < 3; row++) for (let k = x + 16; k < x + w - 24; k += 44) bgWindow(m, k, 14 + row * 32, 18, 22, { lit: R() < 0.4 ? bgPick(R, ['#ffd97a', '#ffb44a', '#9ad0ff']) : null, shadow: R() < 0.3, broken: R() < 0.08, frame: '#e8dcc0' });
        bgFireEscape(m, x + w * 0.55, 40, BASE_Y - 30, 40);
        // scalinata d'ingresso
        BF(m, x + 14, BASE_Y - 30, 26, 30, '#2a1a14'); BF(m, x + 16, BASE_Y - 28, 22, 28, '#3a2418'); for (let s = 0; s < 5; s++) BF(m, x + 8 - s * 2, BASE_Y - 6 * s - 2, 38 + s * 4, 2, '#8a7a6a');
        if (R() < 0.5) this.anim.push({ t: 'eyes', x: x + 25 + 44 * Math.floor(R() * 2), y: 25, c: '#ff3040' });
      },
      court(m, x, w, R) {
        bgFence(m, x, 30, w, BASE_Y);
        const hx = x + w / 2; BF(m, hx - 1, 34, 3, BASE_Y - 34, '#5a5a66'); BF(m, hx - 16, 30, 32, 22, '#e8e8ea'); BF(m, hx - 15, 31, 30, 20, '#c9cdd6'); BF(m, hx - 7, 38, 14, 10, '#e8e8ea'); BF(m, hx - 7, 38, 14, 1, '#e03a3a'); BF(m, hx - 9, 52, 18, 1.5, '#ff7a2a');
        for (let k = 0; k < 6; k++) BF(m, hx - 8 + k * 3, 53, 0.5, 6, '#e8e8ea');
        bgGraffiti(m, x + 20, 96, bgPick(R, ['GIOCA DURO', 'IL BLOCCO', 'CAMPO 3']), '#ffd23e', R);
      },
      store(m, x, w, R) {
        bgStucco(m, x, 0, w, BASE_Y, '#4a5a4a', R);
        BF(m, x + 10, 30, w - 20, 16, '#18161e');
        BF(m, x + 14, 54, w - 28, 50, '#ffd97a'); bgDither(m, x + 14, 80, w - 28, 24, '#e8b85a'); BF(m, x + 14, 54, w - 28, 1, '#ffffff');
        for (let k = x + 18; k < x + w - 24; k += 14) { BF(m, k, 62, 10, 3, bgPick(R, ['#e03a3a', '#3a6ae0', '#62f08e', '#ff9b45'])); BF(m, k, 74, 10, 3, bgPick(R, ['#e03a3a', '#ffd23e', '#c58bff'])); }
        for (let k = x + 14; k < x + w - 14; k += 3) BF(m, k, 54, 0.5, 50, 'rgba(24,22,30,0.6)');
        BF(m, x + 10, 104, w - 20, 3, '#2a2a34');
        this.anim.push({ t: 'neon', x: x + w / 2, y: 33, txt: 'ALIMENTARI 24H', c: '#62f08e', w: textWidth('ALIMENTARI 24H', 1), sc: 1 });
      },
      graffiti(m, x, w, R) {
        bgBricks(m, x, 0, w, BASE_Y, '#4a3a3a', R);
        const cols = ['#ff4fa0', '#3ae0ff', '#ffd23e', '#62f08e', '#c58bff'];
        for (let k = 0; k < 5; k++) { m.fillStyle = bgPick(R, cols); m.strokeStyle = '#0c0a12'; m.lineWidth = 1.5; m.beginPath(); m.ellipse(x + 20 + R() * (w - 40), 50 + R() * 50, 12 + R() * 16, 7 + R() * 8, R(), 0, Math.PI * 2); m.stroke(); m.fill(); }
        bgGraffiti(m, x + 10, 40, bgPick(R, ['FRESCO', 'STILE', 'RIMA']), '#ffffff', R, 3);
        bgGraffiti(m, x + 18, 80, bgPick(R, ['YO!', 'BOOM', 'MIC CHECK']), '#18161e', R, 2);
        bgSkull(m, x + w - 30, 96, 9, '#efe9dc');
        if (R() < 0.6) bgSplat(m, x + R() * w, 108, 3, R);
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      bgBricks(m, x, 0, w, BASE_Y, '#3a2a2a', R);
      for (let row = 0; row < 2; row++) for (let k = x + 16; k < x + w - 24; k += 50) bgWindow(m, k, 10 + row * 28, 18, 20, { lit: R() < 0.6 ? '#ffd97a' : null, frame: '#e8dcc0' });
      BF(m, x + 20, 64, w - 40, 6, '#18161e');
      for (let k = 0; k < 2; k++) { bgSpeaker(m, x + 26 + k * (w - 92), 70, 40, 60); }
      BF(m, x + w / 2 - 60, 96, 120, 28, '#22222a'); BF(m, x + w / 2 - 60, 96, 120, 2, '#ffd23e');
      for (let k = 0; k < 2; k++) { const cx = x + w / 2 - 30 + k * 60; m.fillStyle = '#08070c'; m.beginPath(); m.arc(cx, 106, 9, 0, Math.PI * 2); m.fill(); BF(m, cx - 0.5, 106, 1, 1, '#ffd23e'); }
      this.bossDoor = x + w / 2;
      // festoni di lampadine
      for (let k = x + 4; k < x + w; k += 7) this.anim.push({ t: 'bulb', x: k, y: 60 + Math.sin((k - x) / w * Math.PI * 4) * 4 });
      this.anim.push({ t: 'neon', x: x + w / 2, y: 74, txt: 'BLOCK PARTY', c: '#ffd23e', w: textWidth('BLOCK PARTY', 2), sc: 2 });
    },
    ground(g, w, gh, R) {
      gndConcrete(g, w, 20, R, '#7a7486');
      const [cL, cM, cS, cD] = T4('#8e889a'); BF(g, 0, 20, w, 2, cL); BF(g, 0, 22, w, 2, cS); BF(g, 0, 24, w, 1, cD);
      BF(g, 0, 25, w, gh - 25, '#2e2a38');
      for (let i = 0; i < w * (gh - 25) * 0.04; i++) BF(g, R() * w, 25 + R() * (gh - 25), 1, 0.5, bgPick(R, ['#3a3646', '#24202e']));
      for (let k = 10; k < w; k += 76) BF(g, k, 58, 34, 2.5, '#e8e8ea');
      for (let k = 200; k < w; k += 300 + R() * 300) { const y = 4 + R() * 12; drawText(g, bgPick(R, ['♥', '★', 'OK']), k, y, bgPick(R, ['#ff9ad9', '#9ad0ff', '#ffd97a'])); }
      gndLitter(g, w, gh, R, 0.015);
      if (goreOn()) for (let k = 400; k < w; k += 500 + R() * 400) { g.fillStyle = 'rgba(122,12,20,0.7)'; g.beginPath(); g.ellipse(k, 40 + R() * 40, 8, 2, 0, 0, Math.PI * 2); g.fill(); }
    },
    front(ctx, camX) {
      for (let k = 800; k < this.worldEnd; k += 940) { const x = Math.round(k - camX * 1.2); if (x < -30 || x > W + 30) continue;
        ctx.fillStyle = '#0a0812'; ctx.fillRect(x, 0, 8, H); ctx.fillStyle = '#2a2440'; ctx.fillRect(x + 1, 0, 2, H);
        ctx.fillStyle = '#0a0812'; ctx.fillRect(x - 14, 24, 30, 4); const on = (G.frame + k) % 200 > 6; ctx.fillStyle = on ? '#fff2a8' : '#4a4030'; ctx.fillRect(x - 12, 28, 10, 2); }
    },
  },
};
const BG_EXTRA = {};
function registerBgThemes() { for (const k of Object.keys(BG_THEMES)) if (!BG_EXTRA[k]) BG_EXTRA[k] = class extends BgTheme { constructor(L, d) { super(L, d, k); } }; }
registerBgThemes();
