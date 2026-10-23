// ============================================================
// INTERFACCIA: HUD da cabinato, logo, effetti, pannelli
// ============================================================
let _logo = null;
function logoCanvas() {
  if (_logo) return _logo;
  const t1 = 'THE', t2 = 'ANABLES';
  const [c, x] = makeCanvas(300, 80);
  const [m, mx] = makeCanvas(300, 80);
  // maschera del testo
  drawText(mx, t1, 150, 2, '#ffffff', { align: 'center', scale: 2 });
  drawText(mx, t2, 150, 22, '#ffffff', { align: 'center', scale: 5 });
  // riempimento a bande cromate
  const [f, fx] = makeCanvas(300, 80);
  const bands = [['#fff6c8', 0], ['#ffe27c', 22], ['#ffd34a', 30], ['#ffb03a', 40], ['#ff7a2a', 48], ['#ff4d6d', 54], ['#ffd34a', 58]];
  bands.forEach(([cc, y], i) => { fx.fillStyle = cc; fx.fillRect(0, y, 300, (bands[i + 1] ? bands[i + 1][1] : 80) - y); });
  fx.fillStyle = '#fff6c8'; fx.fillRect(0, 0, 300, 18);
  fx.globalCompositeOperation = 'destination-in'; fx.drawImage(m, 0, 0);
  // contorno spesso e ombra
  const [o, ox] = makeCanvas(300, 80);
  ox.drawImage(m, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#1a0a24'; ox.fillRect(0, 0, 300, 80);
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2], [-2, 2], [2, -2], [3, 4], [4, 5], [2, 4]]) x.drawImage(o, dx, dy);
  x.drawImage(f, 0, 0);
  // riga luminosa
  x.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 300; k += 2) x.fillRect(k, 26, 1, 1);
  return (_logo = c);
}

function drawPanel(ctx, x, y, w, h, fill = 'rgba(12,6,20,0.88)', border = '#ffd23e') {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = border; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 1, y + 1, w - 2, 1);
}

function drawBar(ctx, x, y, w, h, pct, col1, trailPct = null, bg = '#2a1a30') {
  ctx.fillStyle = '#0a0610'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  if (trailPct !== null && trailPct > pct) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, Math.round(w * clamp(trailPct, 0, 1)), h); }
  ctx.fillStyle = col1; ctx.fillRect(x, y, Math.round(w * clamp(pct, 0, 1)), h);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x, y, Math.round(w * clamp(pct, 0, 1)), 1);
}

// Ritratto: la testa v2 del personaggio (26x28), con contorno, a scala intera
const PORTRAIT_W = 26, PORTRAIT_H = 28;
const _portraits = {};
function portrait(c, scale = 1) {
  const key = c.id + '_' + scale;
  if (_portraits[key]) return _portraits[key];
  const pb = new PixBuf(PORTRAIT_W, PORTRAIT_H, RS);
  const hp = c.look.tex && Atlas.has(c.look.tex) ? Atlas.part(c.look.tex, 'head') : null;
  if (hp) {
    // testa fotografica: centrata e scalata per entrare nel riquadro (viso in alto, il mento verso il bordo)
    const k = Math.min((pb.W - 2 * RS) / hp.w, (pb.H - RS) / hp.h);
    const ox = Math.round((pb.W - hp.w * k) / 2), oy = Math.round((pb.H - RS - hp.h * k) / 2);
    for (let Y = 0; Y < pb.H; Y++) for (let X = 0; X < pb.W; X++) { const v = hp.px(Math.floor((X - ox) / k), Math.floor((Y - oy) / k)); if (v) pb.setHi(X, Y, v); }
  } else {
    const hb = headBuf(c.look);
    const oy = HEAD_TOP * RS;
    for (let Y = 0; Y < pb.H - RS; Y++) for (let X = 0; X < pb.W - RS; X++) { const v = hb.getHi(X + RS, Y + RS + oy); if (v) pb.setHi(X + RS, Y, v); }
  }
  pb.outlineSel(OUTLINE, 0.74);
  const cv = pb.toCanvas();
  if (scale === 1) return (_portraits[key] = cv);
  const [s, sx] = makeCanvas(cv.width * scale, cv.height * scale);
  sx.imageSmoothingEnabled = false;
  sx.drawImage(cv, 0, 0, cv.width * scale, cv.height * scale);
  return (_portraits[key] = s);
}

function hpColor(p) { return p > 0.5 ? '#ffd23e' : p > 0.25 ? '#ff9b45' : '#ff4d6d'; }

// Barra vita in stile sala giochi: riempimento a 3 toni, scia bianca del danno, fondo rosso scuro
function drawLifeBar(ctx, x, y, w, h, pct, c, trail) {
  const T = T4(c);
  ctx.fillStyle = '#0a0610'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#5a1020'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#3a0814'; ctx.fillRect(x, y + h - 1, w, 1);
  if (trail !== undefined && trail > pct) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, Math.round(w * clamp(trail, 0, 1)), h); }
  const fw = Math.round(w * clamp(pct, 0, 1));
  ctx.fillStyle = T[1]; ctx.fillRect(x, y, fw, h);
  ctx.fillStyle = T[0]; ctx.fillRect(x, y, fw, 1);
  ctx.fillStyle = T[2]; ctx.fillRect(x, y + h - 2, fw, 2);
  for (let k = x + 8; k < x + w; k += 8) { ctx.fillStyle = 'rgba(10,6,16,0.35)'; ctx.fillRect(k, y, 1, h); }
}

function drawHud(ctx) {
  const ps = G.players;
  const n = Math.max(2, ps.length);
  const pw = Math.floor(W / n);
  const compact = pw < 130;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], x = i * pw + 2;
    if (!p.active) continue;
    const bw = pw - 38;
    // ritratto con cornice nel colore del giocatore
    ctx.fillStyle = '#0a0610'; ctx.fillRect(x, 2, PORTRAIT_W + 4, PORTRAIT_H + 4);
    ctx.fillStyle = p.color; ctx.fillRect(x + 1, 3, PORTRAIT_W + 2, PORTRAIT_H + 2);
    ctx.fillStyle = shade(p.color, 0.35); ctx.fillRect(x + 2, 4, PORTRAIT_W, PORTRAIT_H);
    ctx.fillStyle = shade(p.color, 0.5); ctx.fillRect(x + 2, 4 + PORTRAIT_H - 8, PORTRAIT_W, 8);
    blitHi(ctx, portrait(p.char), x + 2, 4);
    const tx = x + PORTRAIT_W + 6;
    drawText(ctx, (p.slot + 1) + 'P', tx, 2, p.color, { outline: '#0a0610' });
    drawText(ctx, p.char.name + (p.cpu && !compact ? ' CPU' : ''), tx + 16, 2, '#ffffff', { outline: '#0a0610' });
    if (!compact) drawText(ctx, String(p.score).padStart(7, '0'), x + pw - 6, 2, '#ffd23e', { align: 'right', outline: '#0a0610' });
    if (p.out) { if ((G.frame >> 4) % 2) drawText(ctx, 'PREMI START', tx, 14, '#ffd23e', { outline: '#0a0610' }); continue; }
    if (p.state === 'ko') { drawText(ctx, 'AIUTO!', tx, 13, (G.frame >> 3) % 2 ? '#ff4d6d' : '#ffffff', { outline: '#0a0610' }); drawBar(ctx, tx, 24, bw, 3, p.reviveP / 100, '#ffd23e'); continue; }
    const hpP = p.hp / p.maxHp;
    p._trail = p._trail === undefined ? hpP : approach(p._trail, hpP, 0.006);
    drawLifeBar(ctx, tx, 12, bw, 7, hpP, hpColor(hpP), p._trail);
    const full = p.meter >= 100;
    drawBar(ctx, tx, 22, bw, 2, p.meter / 100, full ? ((G.frame >> 2) % 2 ? '#ffffff' : '#3ec5ff') : '#3ec5ff');
    drawText(ctx, 'x' + Math.max(0, p.lives), tx, 26, '#ffffff', { outline: '#0a0610' });
    let ix = tx + 18;
    if (p.wpn) { const wt = compact ? String(p.wpn.uses) : WEAPONS[p.wpn.kind].short + ' ' + (p.wpn.uses > 0 ? p.wpn.uses : 'VUOTA'); drawText(ctx, wt, ix, 26, '#3ae0ff', { outline: '#0a0610' }); ix += textWidth(wt) + 6; }
    else if (full && !compact) { drawText(ctx, 'SPECIALE!', ix, 26, (G.frame >> 2) % 2 ? '#ffffff' : '#3ec5ff', { outline: '#0a0610' }); ix += 60; }
    if (p.powerT > 0 && !compact) drawText(ctx, 'AMP', ix, 26, (G.frame >> 2) % 2 ? '#ff9b45' : '#ffd23e', { outline: '#0a0610' });
    if (p.comboCount >= 3 && !compact) drawText(ctx, p.comboCount + ' COLPI', x + pw - 6, 26, '#ffd23e', { align: 'right', outline: '#0a0610' });
    // potenziamenti raccolti: icone colorate sotto il ritratto, un puntino per livello
    let px0 = x + 1;
    for (const k of PERK_KEYS) { const lv = p.perks[k] || 0; if (!lv) continue;
      ctx.fillStyle = '#0a0610'; ctx.fillRect(px0 - 0.5, 36.5, 5, 7); ctx.fillStyle = PERKS[k].col; ctx.fillRect(px0, 37, 4, 4);
      for (let q = 0; q < lv; q++) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px0 + q * 1.5, 41.5, 1, 1); } px0 += 5.5; }
    // nemico colpito per ultimo: nome e vita sotto la barra del giocatore (stile sala giochi)
    const e = p.lastTarget;
    if (e && G.frame - p.lastTargetT < 150 && !e.isBoss && e !== G.bossRef && (e.alive || G.frame - p.lastTargetT < 40)) {
      const ehp = Math.max(0, e.hp) / e.maxHp;
      e._trailH = e._trailH === undefined ? ehp : approach(e._trailH, ehp, 0.01);
      ctx.fillStyle = 'rgba(8,4,16,0.55)'; ctx.fillRect(tx - 2, 35, bw + 4, 18);
      drawText(ctx, e.nick || e.def.name, tx, 37, '#ff9ab0', { outline: '#0a0610' });
      drawLifeBar(ctx, tx, 46, bw, 4, ehp, '#ff4d6d', e._trailH);
    }
  }
  // barra del boss / miniboss
  const b = G.bossRef, grp = G.bossGroup;
  if (b && (b.alive || (grp && b.isBoss)) && b.state !== 'intro' && !(G.level && G.level.bossPhase === 'done')) {
    const bw = 240, bx = Math.round((W - bw) / 2), by = 206;
    let name = b.def.name, hp = b.hp / b.maxHp, right = b.isBoss && b.phase ? 'FASE ' + b.phase : '';
    if (grp && b.isBoss) {
      const L = grp.list, mh = L.reduce((a, e) => a + e.maxHp, 0), h = L.reduce((a, e) => a + Math.max(0, e.alive ? e.hp : 0), 0);
      name = grp.name; hp = h / mh; if (grp.waves > 1) right = (grp.wave + 1) + ' / ' + grp.waves;
    }
    const c = b.isBoss ? '#ff7ad9' : '#ff4d6d';
    drawPanel(ctx, bx - 4, by - 11, bw + 8, 22, 'rgba(12,6,20,0.85)', c);
    drawText(ctx, name.length > 30 ? name.slice(0, 30) : name, bx, by - 9, c, { outline: '#0a0610' });
    if (right) drawText(ctx, right, bx + bw, by - 9, '#ffffff', { align: 'right' });
    const key = grp && b.isBoss ? grp : b;
    key._trail = key._trail === undefined ? 1 : approach(key._trail, hp, 0.004);
    drawLifeBar(ctx, bx, by + 1, bw, 6, hp, c, key._trail);
  }
  // freccia GO
  if (G.goT > 0 && (G.frame >> 4) % 2) {
    drawText(ctx, 'GO', W - 56, 100, '#ffd23e', { scale: 3, outline: '#3a1a00' });
    drawText(ctx, '→', W - 18, 106, '#ffd23e', { scale: 2, outline: '#3a1a00' });
  }
}

// fumetti: si dispongono senza sovrapporsi e restano sotto l'HUD
const _bubbleQ = [];
function queueBubble(txt, x, y, color) { _bubbleQ.push({ txt, x, y, color }); }
function flushBubbles(ctx) {
  const placed = [];
  _bubbleQ.sort((a, b) => b.y - a.y);
  for (const q of _bubbleQ) {
    const w = textWidth(q.txt) + 8, bx = clamp(q.x - w / 2, 2, W - w - 2);
    let by = Math.max(70, q.y) - 13;
    for (let it = 0; it < 6; it++) { const hit = placed.find(r => bx < r.x + r.w + 2 && bx + w + 2 > r.x && by < r.y + 15 && by + 15 > r.y); if (!hit) break; by = hit.y - 16; }
    if (by < 57) by = 57;
    placed.push({ x: bx, y: by, w });
    drawBubble(ctx, q.txt, q.x, by + 13, q.color, q.y);
  }
  _bubbleQ.length = 0;
}
function drawBubble(ctx, txt, x, y, color, anchorY) {
  const w = textWidth(txt) + 8, h = 13;
  let bx = Math.round(clamp(x - w / 2, 2, W - w - 2)), by = Math.round(y - h);
  if (anchorY !== undefined && anchorY > y + 3) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x) - 0.5, y, 1, anchorY - y); }
  ctx.fillStyle = '#0a0610'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = color; ctx.fillRect(bx, by + h - 2, w, 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x) - 2, by + h, 4, 2); ctx.fillRect(Math.round(x) - 1, by + h + 2, 2, 1);
  drawText(ctx, txt, bx + 4, by + 3, '#15151b');
}

function drawFxOne(ctx, f, camX) {
  const x = f.x - camX, y = f.z - f.y;
  const k = f.t / f.life;
  switch (f.type) {
    case 'spark': case 'sparkBig': {
      const big = f.type === 'sparkBig', r = (big ? 10 : 7) * (0.5 + k);
      ctx.fillStyle = k < 0.4 ? '#ffffff' : '#ffd34a';
      for (let a = 0; a < 8; a++) {
        const an = a * Math.PI / 4 + (big ? 0.2 : 0), rr = a % 2 ? r * 0.55 : r;
        for (let q = rr * 0.45; q <= rr; q += 0.5) frect(ctx, x + Math.cos(an) * q, y + Math.sin(an) * q, 1, 1);
      }
      if (k < 0.5) frect(ctx, x - 2, y - 2, 4, 4, '#ffffff');
      break;
    }
    case 'chip': frect(ctx, x, y, 1.5, 1.5, f.col); break;
    case 'blood': frect(ctx, x, y, f.sz || 1, f.sz || 1, f.col); if (f.vy > 0.5) frect(ctx, x, y + (f.sz || 1), 0.5, 1, f.col); break;
    case 'ember': ctx.globalAlpha = 1 - k; frect(ctx, x, y, 1, 1, k < 0.5 ? '#fff2a8' : '#ff7a1a'); ctx.globalAlpha = 1; break;
    case 'dust': { ctx.fillStyle = `rgba(200,190,220,${0.5 * (1 - k)})`; const s = 2 + k * 3; frect(ctx, x - s, y - s, s * 2, s); break; }
    case 'note': drawText(ctx, '♪', x - 2, y - 7, f.col); break;
    case 'glit': if ((f.t >> 1) % 2) { ctx.fillStyle = f.col; frect(ctx, x, y - 1, 0.5, 2.5); frect(ctx, x - 1, y, 2.5, 0.5); } break;
    case 'smoke': {
      ctx.fillStyle = `rgba(200,200,215,${0.8 * (1 - k)})`;
      for (let i = 0; i < 6; i++) { const an = i * 1.05 + f.t * 0.05, rr = 6 + k * 14; fdisc(ctx, x + Math.cos(an) * rr, y - 14 + Math.sin(an) * rr * 0.7, 4, ctx.fillStyle); }
      break;
    }
    case 'streak': ctx.globalAlpha = 1 - k; frect(ctx, x - (f.dir > 0 ? 14 : 0), y - 30 + (f.t % 3) * 8, 14, 0.5, f.col || '#ffffff'); frect(ctx, x - (f.dir > 0 ? 10 : 0), y - 18, 10, 0.5, f.col || '#ffffff'); ctx.globalAlpha = 1; break;
    case 'star': drawText(ctx, '★', x - 2, y - 4, (f.t >> 2) % 2 ? '#ffd23e' : '#ffffff'); break;
  }
}

function drawTexts(ctx, camX) {
  for (const t of G.texts) {
    const y = t.z - t.y - Math.min(14, t.t * 0.5);
    if (t.t > t.life - 10 && (t.t >> 1) % 2) continue;
    drawText(ctx, t.txt, t.x - camX, y, t.color, { align: 'center', outline: '#0a0610' });
  }
}

function drawLetterbox(ctx, a) {
  const h = Math.round(22 * a);
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
}

// a capo automatico per il font 5x7 (n = caratteri per riga)
function wrapText(str, n) {
  const words = normText(str).split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur ? cur.length + 1 : 0) + w.length > n) { if (cur) lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
