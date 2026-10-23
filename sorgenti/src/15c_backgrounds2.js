// ============================================================
// FONDALI DEI LIVELLI 5–10 (stesso costruttore di 15b)
// ============================================================
function bgStoneBlocks(m, x, y0, w, y1, stone, R) {
  const [L, M, S, D] = T4(stone);
  BF(m, x, y0, w, y1 - y0, M);
  let row = 0;
  for (let y = y0; y < y1; y += 9, row++) {
    BF(m, x, y + 8, w, 1, D);
    for (let bx = x - (row % 2 ? 9 : 0); bx < x + w; bx += 18) {
      const cx = Math.max(x, bx), cw = Math.min(x + w, bx + 18) - cx; if (cw <= 0) continue;
      BF(m, bx, y, 1, 8, D); BF(m, cx + 1, y, cw - 1, 1, L);
      const r = R(); if (r < 0.25) BF(m, cx + 1, y + 1, cw - 2, 7, S); else if (r > 0.88) BF(m, cx + 1, y + 1, cw - 2, 7, mix(M, L, 0.4));
      if (R() < 0.15) BF(m, cx + 2 + R() * (cw - 4), y + 2 + R() * 5, 2, 1, D);
      if (R() < 0.08) BF(m, cx + 1, y + 6, cw - 2, 2, '#2a4a24');   // muschio
    }
  }
}
function bgDamask(m, x, y0, w, y1, base, R) {
  const [L, M, S, D] = T4(base);
  BF(m, x, y0, w, y1 - y0, S);
  for (let y = y0; y < y1; y += 16) for (let k = x + ((y / 16) % 2) * 10; k < x + w; k += 20) {
    m.fillStyle = M; m.beginPath(); m.moveTo(k, y); m.quadraticCurveTo(k + 5, y + 6, k, y + 12); m.quadraticCurveTo(k - 5, y + 6, k, y); m.fill();
    BF(m, k - 0.5, y + 4, 1, 4, L);
  }
}
function bgFrame(m, x, y, w, h, inner, R) {
  BF(m, x - 3, y - 3, w + 6, h + 6, '#8a6a1a'); BF(m, x - 3, y - 3, w + 6, 1, '#ffe08a'); BF(m, x - 2, y - 2, w + 4, h + 4, '#c9a43a'); BF(m, x - 1, y - 1, w + 2, h + 2, '#6a4a10');
  BF(m, x, y, w, h, inner);
}
// ritratto inquietante: figura scura con occhi che seguono (gli occhi sono animati)
function bgPortrait(m, x, y, w, h, R, B) {
  bgFrame(m, x, y, w, h, '#2a1a20', R);
  bgDither(m, x, y, w, h * 0.5, '#3a2430');
  m.fillStyle = '#e8d0c0'; m.beginPath(); m.ellipse(x + w / 2, y + h * 0.38, w * 0.18, h * 0.16, 0, 0, Math.PI * 2); m.fill();
  m.fillStyle = bgPick(R, ['#1a1418', '#5a3a1a', '#c9c4d0']); m.beginPath(); m.ellipse(x + w / 2, y + h * 0.3, w * 0.22, h * 0.13, 0, Math.PI, 0); m.fill();
  m.fillStyle = bgPick(R, ['#18161e', '#3a0a14', '#1a2a3a']); m.beginPath(); m.moveTo(x + w * 0.15, y + h); m.quadraticCurveTo(x + w / 2, y + h * 0.45, x + w * 0.85, y + h); m.fill();
  BF(m, x + w / 2 - w * 0.09, y + h * 0.37, w * 0.06, 1, '#08070c'); BF(m, x + w / 2 + w * 0.03, y + h * 0.37, w * 0.06, 1, '#08070c');
  B.anim.push({ t: 'eyes', x: x + w / 2, y: y + h * 0.37, c: '#ff3040' });
}
function bgCandelabra(m, x, y, B, arms = 3) {
  BF(m, x - 0.75, y, 1.5, 20, '#c9a43a'); BF(m, x - 4, y + 20, 8, 2, '#8a6a1a');
  for (let k = 0; k < arms; k++) { const dx = (k - (arms - 1) / 2) * 7; BF(m, x + Math.min(0, dx), y + 4, Math.abs(dx) + 1, 1, '#c9a43a'); BF(m, x + dx - 0.75, y - 2, 1.5, 6, '#c9a43a'); BF(m, x + dx - 1, y - 7, 2, 5, '#efe9dc'); B.anim.push({ t: 'flame', x: x + dx, y: y - 7, s: 0.8 }); }
  B.anim.push({ t: 'glow', x, y: y - 6, r: 26, c: '#ffb03a', a: 0.12, sp: 0.2 });
}
function bgFalseFront(m, x, w, R, wood, sign, signCol, topY) {
  const top = topY ?? (30 + R() * 10), [L, M, S, D] = T4(wood);
  bgPlanks(m, x, top + 16, w, BASE_Y, wood, R, true);
  BF(m, x + 6, top, w - 12, 18, M); BF(m, x + 6, top, w - 12, 1.5, L); BF(m, x + 4, top + 16, w - 8, 2, D);
  for (let k = x + 8; k < x + w - 8; k += 10) BF(m, k, top - 3, 6, 3, S);
  BF(m, x + 14, top + 3, w - 28, 11, '#efe3c4'); BF(m, x + 14, top + 3, w - 28, 1, '#ffffff'); drawText(m, sign, x + w / 2, top + 5, signCol || '#3a1a10', { align: 'center' });
  // portico
  BF(m, x, BASE_Y - 46, w, 4, D); BF(m, x, BASE_Y - 46, w, 1, L); for (let k = x + 4; k < x + w; k += 40) { BF(m, k, BASE_Y - 42, 3, 42, S); BF(m, k, BASE_Y - 42, 1, 42, L); }
  for (let k = x + 20; k < x + w - 30; k += 60) bgWindow(m, k, top + 26, 18, 22, { lit: R() < 0.5 ? '#ffb44a' : null, frame: shade(wood, 0.6), shadow: R() < 0.3 });
  return top;
}

Object.assign(BG_THEMES, {
  // ---------------- 5: METAL — magazzino dei flight case, cimitero dei fan ----------------
  warehouse: {
    seed: 666, bats: 6, batY: 26, shadeTop: 0.6, farPar: 0.35,
    sky(sc, R) { const g = sc.createLinearGradient(0, 0, 0, BASE_Y); g.addColorStop(0, '#06040a'); g.addColorStop(1, '#1a0608'); sc.fillStyle = g; sc.fillRect(0, 0, W, BASE_Y); },
    far(fc, fw, R) {
      for (let k = 0; k < fw; k += 90) { BF(fc, k, 0, 6, BASE_Y, '#100a0e'); for (let y = 30; y < BASE_Y; y += 30) { BF(fc, k, y, 80, 2, '#160e12'); for (let c = 0; c < 3; c++) if (R() < 0.7) BF(fc, k + 8 + c * 24, y - 16, 20, 16, bgPick(R, ['#1a1216', '#140e12', '#201418'])); } }
      for (let k = 40; k < fw; k += 160 + R() * 80) { const g = fc.createRadialGradient(k, 20, 1, k, 20, 30); g.addColorStop(0, 'rgba(255,30,30,0.5)'); g.addColorStop(1, 'rgba(255,30,30,0)'); fc.fillStyle = g; fc.fillRect(k - 30, 0, 60, 60); BF(fc, k - 2, 18, 4, 3, '#ff3a3a'); }
    },
    seq: ['racks', 'cases', 'hooks', 'graves', 'racks', 'dock'],
    segW: { racks: [170, 220], cases: [120, 160], hooks: [130, 160], graves: [180, 220], dock: [150, 180] },
    seg: {
      racks(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#24202a'); bgDither(m, x, 0, w, BASE_Y, '#2a2630');
        for (let k = x; k <= x + w - 4; k += Math.max(40, (w - 4) / 3)) { BF(m, k, 10, 4, BASE_Y - 10, '#c46a1a'); BF(m, k, 10, 1, BASE_Y - 10, '#e88a3a'); }
        for (let y = 36; y < BASE_Y; y += 32) { BF(m, x, y, w, 3, '#3a4a8a'); BF(m, x, y, w, 1, '#5a6aaa');
          for (let k = x + 6; k < x + w - 24; k += 26 + R() * 6) { if (R() < 0.2) continue; const h = 14 + R() * 10; BF(m, k, y - h, 22, h, bgPick(R, ['#3a3a46', '#2a2a34', '#8a6a3a'])); BF(m, k, y - h, 22, 1, '#6a6a7a'); BF(m, k + 1, y - h + 2, 2, h - 4, '#c9cdd6'); BF(m, k + 19, y - h + 2, 2, h - 4, '#c9cdd6'); if (R() < 0.3) drawText(m, 'FX', k + 6, y - h + 4, '#ffd23e'); } }
        if (R() < 0.6) bgSplat(m, x + R() * w, 110, 4, R);
        this.anim.push({ t: 'swing', x: x + w / 2, y: 0, len: 30, lamp: '#ff3a3a' });
      },
      cases(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#1e1a22');
        const sp = propSprite('flight', 0), cw = spW(sp), ch = spH(sp);
        for (let row = 0; row < 4; row++) for (let k = x + 4 + (row % 2) * cw * 0.4; k + cw < x + w; k += cw + 2) if (R() < 0.85) blitHi(m, sp, k, BASE_Y - ch * (row + 1) - row);
        bgGraffiti(m, x + 8, 20, bgPick(R, ['TOUR', 'FRAGILE', 'TESTE']), '#efe9dc', R);
      },
      hooks(m, x, w, R) {
        bgMetal(m, x, 0, w, BASE_Y, '#3a3036', R);
        for (let k = x + 16; k < x + w - 10; k += 30) { bgChain(m, k, 0, 30 + R() * 40); }
        BF(m, x + w / 2 - 22, 40, 44, BASE_Y - 40, '#0c0a10'); for (let k = x + w / 2 - 22; k <= x + w / 2 + 22; k += 5) BF(m, k, 40, 1, BASE_Y - 40, '#6a6a76'); BF(m, x + w / 2 - 22, 40, 44, 2, '#6a6a76');
        bgSkull(m, x + w / 2, BASE_Y - 30, 7); for (let r = 0; r < 4; r++) BF(m, x + w / 2 - 6, BASE_Y - 20 + r * 4, 12, 1.5, '#efe9dc'); BF(m, x + w / 2 - 1, BASE_Y - 22, 2, 18, '#efe9dc');
        for (let k = 0; k < 2; k++) this.anim.push({ t: 'swing', x: x + 30 + k * (w - 60), y: 0, len: 50 + k * 10 });
        bgSplat(m, x + w * 0.3, 70, 5, R);
      },
      graves(m, x, w, R) {
        bgStoneBlocks(m, x, 0, w, BASE_Y, '#3a3440', R);
        BF(m, x + 20, 18, w - 40, 22, '#0c0a10'); bgSkull(m, x + w / 2, 30, 7); drawText(m, 'R.I.P. FAN', x + w / 2, 42, '#c42032', { align: 'center' });
        for (let k = x + 12; k < x + w - 20; k += 28 + R() * 10) { bgTomb(m, k, BASE_Y, 16 + R() * 6, 24 + R() * 14, bgPick(R, ['#6a6a76', '#7a7a86', '#5a5a66']), R); if (R() < 0.5) bgCross(m, k + 30, BASE_Y, 20, '#5a4a3a'); }
        for (let k = 0; k < 4; k++) { const cx = x + 20 + R() * (w - 40); BF(m, cx - 1, BASE_Y - 10, 2.5, 8, '#efe9dc'); this.anim.push({ t: 'flame', x: cx, y: BASE_Y - 10, s: 0.7 }); }
        this.anim.push({ t: 'drip', x: x + w * 0.4, y: 40, len: 18 });
      },
      dock(m, x, w, R) {
        bgMetal(m, x, 0, w, BASE_Y, '#2e2a32', R);
        BF(m, x + 10, 24, w - 20, BASE_Y - 24, '#0a0608'); bgCaution(m, x + 10, 20, w - 20, 5);
        m.clearRect(x + 12, 60, w - 24, BASE_Y - 60);
        for (let y = 26; y < 60; y += 3) BF(m, x + 12, y, w - 24, 1.5, y % 6 ? '#5a5a66' : '#3a3a46');
        this.anim.push({ t: 'glow', x: x + w / 2, y: 100, r: 60, c: '#ff2020', a: 0.16, sp: 0.06 });
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      BF(m, x, 0, w, BASE_Y, '#120c10');
      for (let k = 0; k < 8; k++) { const ax = x + 8 + k * 54; for (let r = 0; r < 2; r++) { BF(m, ax, 46 + r * 42, 48, 40, '#16141a'); BF(m, ax, 46 + r * 42, 48, 4, '#c9a43a'); BF(m, ax + 2, 51 + r * 42, 44, 33, '#2a2630'); for (let g = 0; g < 33; g += 2) BF(m, ax + 2, 51 + r * 42 + g, 44, 0.5, '#1a181e'); drawText(m, 'VOX', ax + 24, 47 + r * 42, '#18161e', { align: 'center' }); } }
      // grande teschio con le corna
      const cx = x + w / 2, cy = 24;
      bgSkull(m, cx, cy, 14, '#efe9dc');
      m.fillStyle = '#d8d0c0'; for (const d of [-1, 1]) { m.beginPath(); m.moveTo(cx + d * 10, cy - 10); m.quadraticCurveTo(cx + d * 30, cy - 24, cx + d * 34, cy - 4); m.quadraticCurveTo(cx + d * 26, cy - 14, cx + d * 13, cy - 4); m.fill(); }
      this.bossDoor = cx;
      this.anim.push({ t: 'eyes', x: cx - 4, y: cy, c: '#ff2020' }, { t: 'eyes', x: cx + 4, y: cy, c: '#ff2020' });
      for (let k = 0; k < 4; k++) this.anim.push({ t: 'flame', x: x + 30 + k * (w - 60) / 3, y: 46, s: 3, big: true });
    },
    ground(g, w, gh, R) {
      BF(g, 0, 0, w, gh, '#34303a');
      for (let y = 0; y < gh; y += 6) for (let k = (y / 6 % 2) * 6; k < w; k += 12) { BF(g, k, y + 1, 4, 1, '#4a4652'); BF(g, k + 1, y + 2, 4, 1, '#26222c'); }
      for (let k = 0; k < w; k += 96) BF(g, k, 0, 1, gh, '#1a1820');
      bgDither(g, 0, 0, w, 4, '#0c0a10');
      if (goreOn()) for (let k = 200; k < w; k += 180 + R() * 300) { const y = 10 + R() * (gh - 20); g.fillStyle = 'rgba(122,12,20,0.8)'; g.beginPath(); g.ellipse(k, y, 8 + R() * 12, 2 + R() * 2, 0, 0, Math.PI * 2); g.fill(); }
      gndLitter(g, w, gh, R, 0.01);
    },
    front(ctx, camX) {
      for (let k = 640; k < this.worldEnd; k += 860) { const x = Math.round(k - camX * 1.25); if (x < -40 || x > W + 40) continue;
        ctx.fillStyle = '#060406'; ctx.fillRect(x, 0, 16, H); ctx.fillStyle = '#3a1a1a'; ctx.fillRect(x + 2, 0, 2, H); bgChain(ctx, x + 24, 0, 60, '#2a2830'); }
    },
  },

  // ---------------- 6: OPERA — teatro infestato ----------------
  opera: {
    seed: 1813, bats: 4, batY: 20, shadeTop: 0.5,
    sky(sc, R) { BF(sc, 0, 0, W, BASE_Y, '#0c0408'); },
    far(fc, fw, R) {
      // platea e palchi in lontananza, con spettatori fantasma
      BF(fc, 0, 0, fw, BASE_Y, '#1a060c');
      for (let tier = 0; tier < 4; tier++) { const y = 10 + tier * 26; BF(fc, 0, y + 18, fw, 3, '#8a6a1a'); BF(fc, 0, y + 18, fw, 1, '#ffe08a');
        for (let k = 0; k < fw; k += 22) { BF(fc, k, y, 20, 18, '#3a0a14'); BF(fc, k, y, 1, 18, '#5a1a24'); if (R() < 0.45) { fdisc(fc, k + 10, y + 11, 2.5, bgPick(R, ['#c9d4e0', '#e8e0f0', '#a8b8c8'])); BF(fc, k + 7, y + 13, 6, 5, '#2a3a4a'); } } }
      for (let k = 60; k < fw; k += 220) { BF(fc, k - 0.5, 0, 1, 12, '#5a4a2a'); for (let a = -2; a <= 2; a++) fdisc(fc, k + a * 6, 14 + Math.abs(a), 1.5, '#ffe08a'); BF(fc, k - 14, 15, 28, 2, '#c9a43a'); }
      bgNightShade(fc, fw, BASE_Y, 0.5, 0.3);
    },
    seq: ['damask', 'column', 'box', 'damask', 'arch', 'column', 'mirror'],
    segW: { damask: [170, 210], column: [70, 90], box: [150, 180], arch: [150, 180], mirror: [120, 150] },
    seg: {
      damask(m, x, w, R) {
        bgDamask(m, x, 0, w, BASE_Y - 30, '#8a1a2a', R);
        bgPlanks(m, x, BASE_Y - 30, w, BASE_Y, '#4a2416', R); BF(m, x, BASE_Y - 31, w, 2, '#c9a43a');
        BF(m, x, 0, w, 10, '#2a0a10'); BF(m, x, 10, w, 2, '#c9a43a');
        bgPortrait(m, x + w * 0.5 - 18, 26, 36, 46, R, this);
        bgCandelabra(m, x + 22, 70, this); bgCandelabra(m, x + w - 22, 70, this);
        bgCobweb(m, x, 12, 22, 1);
        if (R() < 0.5) this.anim.push({ t: 'drip', x: x + w * 0.5 - 10, y: 72, len: 14 });
      },
      column(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#2a0a10');
        bgPilaster(m, x + w / 2 - 10, 10, BASE_Y, 20, '#c8c0b8');
        BF(m, x + w / 2 - 14, BASE_Y - 34, 28, 34, '#8a8088'); BF(m, x + w / 2 - 14, BASE_Y - 34, 28, 2, '#c8c0b8');
        // busto
        m.fillStyle = '#d8d0c8'; m.beginPath(); m.ellipse(x + w / 2, BASE_Y - 48, 6, 7, 0, 0, Math.PI * 2); m.fill(); m.beginPath(); m.moveTo(x + w / 2 - 11, BASE_Y - 34); m.quadraticCurveTo(x + w / 2, BASE_Y - 46, x + w / 2 + 11, BASE_Y - 34); m.fill();
        BF(m, x + w / 2 - 3, BASE_Y - 49, 2, 1, '#3a3446'); BF(m, x + w / 2 + 1, BASE_Y - 49, 2, 1, '#3a3446');
        this.anim.push({ t: 'eyes', x: x + w / 2, y: BASE_Y - 49, c: '#9adfff' });
      },
      box(m, x, w, R) {
        bgDamask(m, x, 0, w, BASE_Y, '#6a1020', R);
        BF(m, x + 10, 20, w - 20, 60, '#0c0306');
        bgCurtain(m, x + 10, 20, 24, 60, '#a01828'); bgCurtain(m, x + w - 34, 20, 24, 60, '#a01828');
        BF(m, x + 6, 80, w - 12, 14, '#c9a43a'); BF(m, x + 6, 80, w - 12, 2, '#ffe08a'); for (let k = x + 10; k < x + w - 10; k += 8) BF(m, k, 84, 4, 8, '#8a6a1a');
        fdisc(m, x + w / 2, 60, 5, '#c9d4e0'); BF(m, x + w / 2 - 6, 64, 12, 16, '#2a3a4a');   // spettatore fantasma
        this.anim.push({ t: 'eyes', x: x + w / 2, y: 59, c: '#0c0306' });
        bgPlanks(m, x, 94, w, BASE_Y, '#4a2416', R);
      },
      arch(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#3a0c16');
        m.clearRect(x + 16, 30, w - 32, BASE_Y - 30); m.save(); m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.ellipse(x + w / 2, 30, w / 2 - 16, 22, 0, Math.PI, 0); m.fill(); m.restore();
        m.strokeStyle = '#c9a43a'; m.lineWidth = 3; m.beginPath(); m.moveTo(x + 16, BASE_Y); m.lineTo(x + 16, 30); m.ellipse(x + w / 2, 30, w / 2 - 16, 22, 0, Math.PI, 0); m.lineTo(x + w - 16, BASE_Y); m.stroke();
        bgCobweb(m, x + 18, 30, 16, 1); bgCobweb(m, x + w - 18, 30, 16, -1);
      },
      mirror(m, x, w, R) {
        bgDamask(m, x, 0, w, BASE_Y, '#7a1626', R);
        bgFrame(m, x + 20, 20, w - 40, 80, '#5a6a7a', R); bgGlassShine(m, x + 20, 20, w - 40, 80);
        m.strokeStyle = '#e8f0ff'; m.lineWidth = 0.5; m.beginPath(); const cx = x + w / 2 + 6, cy = 50; for (let k = 0; k < 7; k++) { const a = k * 0.9; m.moveTo(cx, cy); m.lineTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 26); } m.stroke();
        m.fillStyle = 'rgba(220,235,255,0.35)'; m.beginPath(); m.ellipse(x + w / 2 - 8, 54, 7, 14, 0, 0, Math.PI * 2); m.fill();     // fantasma nello specchio
        bgPlanks(m, x, BASE_Y - 30, w, BASE_Y, '#4a2416', R); BF(m, x, BASE_Y - 31, w, 2, '#c9a43a');
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      BF(m, x, 0, w, BASE_Y, '#140408');
      BF(m, x + 20, 8, w - 40, 14, '#c9a43a'); BF(m, x + 20, 8, w - 40, 2, '#ffe08a'); drawText(m, 'PRIMA ASSOLUTA', x + w / 2, 12, '#3a0a14', { align: 'center' });
      bgPilaster(m, x + 8, 8, BASE_Y, 16, '#c9a43a'); bgPilaster(m, x + w - 24, 8, BASE_Y, 16, '#c9a43a');
      bgCurtain(m, x + 26, 22, 90, BASE_Y - 22, '#b01828'); bgCurtain(m, x + w - 116, 22, 90, BASE_Y - 22, '#b01828');
      BF(m, x + 116, 22, w - 232, BASE_Y - 22, '#08020a');
      bgCurtain(m, x + 26, 22, w - 52, 12, '#901020');
      this.bossDoor = x + w / 2;
      for (let k = x + 30; k < x + w - 30; k += 22) this.anim.push({ t: 'glow', x: k, y: BASE_Y - 2, r: 12, c: '#ffe08a', a: 0.3, sp: 0.1 });
      this.anim.push({ t: 'spot', x: x + 80, y: 0, c: '#fff2c8', sweep: 40 }, { t: 'spot', x: x + w - 80, y: 0, c: '#ffb0c0', sweep: 40 });
    },
    ground(g, w, gh, R) {
      gndPlanks(g, w, gh, R, '#5a2e1a');
      BF(g, 0, 16, w, 30, '#8a1424'); BF(g, 0, 16, w, 1.5, '#c9a43a'); BF(g, 0, 44.5, w, 1.5, '#c9a43a'); bgDither(g, 0, 18, w, 26, '#9a1a2c');
      if (goreOn()) for (let k = 300; k < w; k += 300 + R() * 300) { g.fillStyle = 'rgba(90,8,14,0.8)'; g.beginPath(); g.ellipse(k, 30 + R() * 40, 6 + R() * 8, 2, 0, 0, Math.PI * 2); g.fill(); }
      for (let k = 120; k < w; k += 220 + R() * 160) { BF(g, k, 52 + R() * 30, 6, 1, '#ff4d6d'); BF(g, k + 2, 51 + R() * 30, 2, 2, '#62a04a'); }   // rose cadute
    },
    front(ctx, camX) {
      for (let k = 760; k < this.worldEnd; k += 920) { const x = Math.round(k - camX * 1.2); if (x < -40 || x > W + 40) continue;
        bgCurtain(ctx, x - 20, 0, 34, H, '#6a0c18'); }
    },
  },

  // ---------------- 7: COUNTRY — città fantasma al tramonto ----------------
  western: {
    seed: 1885, bats: 4, shade: true, shadeTop: 0.25, shadeBottom: 0.1, farPar: 0.2,
    sky(sc, R) {
      const g = sc.createLinearGradient(0, 0, 0, BASE_Y); g.addColorStop(0, '#2a1240'); g.addColorStop(0.4, '#8a2a4a'); g.addColorStop(0.7, '#e8603a'); g.addColorStop(1, '#ffb04a');
      sc.fillStyle = g; sc.fillRect(0, 0, W, BASE_Y);
      bgMoon(sc, 300, 70, 22, '#ff7a3a'); bgDither(sc, 0, 60, W, 30, 'rgba(255,170,90,0.25)');
      for (let k = 0; k < 6; k++) { const cx = R() * W, cy = 12 + R() * 40; sc.fillStyle = 'rgba(60,20,50,0.5)'; sc.beginPath(); sc.ellipse(cx, cy, 30 + R() * 30, 3 + R() * 2, 0, 0, Math.PI * 2); sc.fill(); }
    },
    far(fc, fw, R) {
      let y = 100; fc.fillStyle = '#5a2030'; fc.beginPath(); fc.moveTo(0, BASE_Y);
      for (let x = 0; x <= fw; x += 20) { y = clamp(y + (R() - 0.5) * 30, 66, 110); if (R() < 0.15) { fc.lineTo(x, y - 24); fc.lineTo(x + 40, y - 24); x += 40; } fc.lineTo(x, y); }
      fc.lineTo(fw, BASE_Y); fc.fill();
      for (let k = 120; k < fw; k += 400) { BF(fc, k, 74, 1.5, 30, '#2a0e1a'); for (let a = 0; a < 8; a++) { fc.strokeStyle = '#2a0e1a'; fc.lineWidth = 0.8; fc.beginPath(); fc.moveTo(k, 74); fc.lineTo(k + Math.cos(a * 0.8) * 8, 74 + Math.sin(a * 0.8) * 8); fc.stroke(); } }
      BF(fc, 0, 108, fw, BASE_Y - 108, '#3a1424');
    },
    seq: ['town', 'graveyard', 'town', 'corral', 'town', 'graveyard'],
    segW: { town: [150, 200], graveyard: [170, 220], corral: [150, 190] },
    seg: {
      town(m, x, w, R, i) {
        const signs = ['SALOON', 'EMPORIO', 'BANCA', 'HOTEL', 'BARBIERE', 'BECCHINO', 'MANISCALCO', 'POSTA'];
        const sign = signs[(i * 3 + Math.floor(R() * 2)) % signs.length], wood = bgPick(R, ['#7a4a2a', '#6a3a22', '#8a5a34', '#5a3a2a']);
        bgFalseFront(m, x, w, R, wood, sign, sign === 'BECCHINO' ? '#5a0a10' : '#3a1a10');
        BF(m, x + w / 2 - 12, BASE_Y - 38, 24, 38, '#1a0e0a');
        if (sign === 'SALOON') { BF(m, x + w / 2 - 12, BASE_Y - 30, 11, 18, '#a0703a'); BF(m, x + w / 2 + 1, BASE_Y - 30, 11, 18, '#a0703a'); for (let k = 0; k < 4; k++) BF(m, x + w / 2 - 11 + k * 6, BASE_Y - 28, 0.5, 14, '#5a3a1a'); }
        if (sign === 'BECCHINO') { m.fillStyle = '#3a2418'; m.beginPath(); m.moveTo(x + 10, BASE_Y); m.lineTo(x + 8, BASE_Y - 26); m.lineTo(x + 14, BASE_Y - 34); m.lineTo(x + 22, BASE_Y - 26); m.lineTo(x + 20, BASE_Y); m.fill(); }
        bgPoster(m, x + w - 40, BASE_Y - 40, 20, 24, '#efe3c4', '#3a1a10', 'TAGLIA', R, { skull: R() < 0.5 });
      },
      graveyard(m, x, w, R) {
        for (let k = x; k < x + w; k += 12) { BF(m, k, BASE_Y - 20, 2, 20, '#5a3a22'); BF(m, k + 1, BASE_Y - 22, 1, 2, '#5a3a22'); }
        BF(m, x, BASE_Y - 16, w, 1.5, '#5a3a22'); BF(m, x, BASE_Y - 8, w, 1.5, '#5a3a22');
        for (let k = x + 10; k < x + w - 10; k += 22 + R() * 10) { if (R() < 0.5) bgCross(m, k, BASE_Y - 4, 22 + R() * 8, '#6a4a2a'); else bgTomb(m, k - 6, BASE_Y - 2, 14, 20, '#8a7a6a', R); }
        // albero morto con i corvi
        const tx = x + w * 0.5; m.strokeStyle = '#1a0a10'; m.lineWidth = 4; m.beginPath(); m.moveTo(tx, BASE_Y); m.lineTo(tx - 2, 50); m.stroke();
        m.lineWidth = 2; m.beginPath(); m.moveTo(tx - 1, 70); m.lineTo(tx - 26, 46); m.moveTo(tx - 2, 58); m.lineTo(tx + 22, 36); m.moveTo(tx + 10, 47); m.lineTo(tx + 18, 52); m.moveTo(tx - 16, 56); m.lineTo(tx - 22, 64); m.stroke();
        for (const [cx, cy] of [[tx - 22, 47], [tx + 18, 38]]) { m.fillStyle = '#0a0408'; m.beginPath(); m.ellipse(cx, cy - 2, 2.5, 2, 0, 0, Math.PI * 2); m.fill(); BF(m, cx + 1.5, cy - 3, 2, 0.8, '#0a0408'); this.anim.push({ t: 'eyes', x: cx + 0.5, y: cy - 3, c: '#ff3040' }); }
        m.strokeStyle = '#3a2418'; m.lineWidth = 0.8; m.beginPath(); m.moveTo(tx + 14, 41); m.lineTo(tx + 14, 52); m.stroke(); BF(m, tx + 11, 52, 6, 8, '#2a1a10'); BF(m, tx + 12, 53, 4, 6, '#ffb03a');
        this.anim.push({ t: 'glow', x: tx + 14, y: 56, r: 14, c: '#ffb03a', a: 0.25, sp: 0.15 });
      },
      corral(m, x, w, R) {
        for (let r = 0; r < 3; r++) BF(m, x, BASE_Y - 28 + r * 9, w, 3, '#7a5a3a');
        for (let k = x; k < x + w; k += 34) { BF(m, k, BASE_Y - 34, 4, 34, '#5a3a22'); BF(m, k, BASE_Y - 34, 1, 34, '#8a6a4a'); }
        for (let k = 0; k < 2; k++) { const hx = x + 30 + k * 60; BF(m, hx, BASE_Y - 18, 30, 18, '#c9a050'); BF(m, hx, BASE_Y - 18, 30, 1, '#e8c870'); BF(m, hx, BASE_Y - 10, 30, 1, '#8a6a2a'); }
        bgCactus(m, x + w - 30, BASE_Y, 40, R);
        // teschio di bue sul palo
        const sx = x + w * 0.45; BF(m, sx - 1, BASE_Y - 50, 3, 50, '#5a3a22'); bgSkull(m, sx + 0.5, BASE_Y - 54, 5, '#efe9dc'); BF(m, sx - 10, BASE_Y - 60, 8, 2, '#efe9dc'); BF(m, sx + 3, BASE_Y - 60, 8, 2, '#efe9dc');
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      bgFalseFront(m, x + 40, w - 80, R, '#5a3a2a', 'UFFICIO DELLO SCERIFFO', '#5a0a10', 36);
      bgPlanks(m, x, 30, 40, BASE_Y, '#4a2a1a', R); bgPlanks(m, x + w - 40, 30, 40, BASE_Y, '#4a2a1a', R);
      for (const wx of [x + 80, x + w - 120]) { BF(m, wx, 60, 40, 30, '#0a0406'); for (let k = 0; k < 6; k++) BF(m, wx + 3 + k * 7, 60, 1.5, 30, '#8a90a0'); }
      m.fillStyle = '#ffd23e'; m.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 4 : 10; m.lineTo(x + w / 2 + Math.cos(a) * r, 56 + Math.sin(a) * r); } m.fill();
      this.bossDoor = x + w / 2;
      this.anim.push({ t: 'flame', x: x + 60, y: 74, s: 1.2 }, { t: 'flame', x: x + w - 60, y: 74, s: 1.2 });
    },
    ground(g, w, gh, R) {
      BF(g, 0, 0, w, gh, '#a0603a');
      for (let i = 0; i < w * gh * 0.05; i++) BF(g, R() * w, R() * gh, R() < 0.3 ? 1.5 : 0.5, 0.5, bgPick(R, ['#b8744a', '#8a5030', '#c88a5a']));
      for (const y of [30, 38, 60, 68]) for (let k = 0; k < w; k += 2) BF(g, k, y + Math.sin(k * 0.01) * 2, 2, 1, '#7a4428');
      for (let k = 50; k < w; k += 30 + R() * 50) { const rx = k, ry = 8 + R() * (gh - 12); BF(g, rx, ry, 3, 2, '#6a5a4a'); BF(g, rx, ry, 3, 0.5, '#9a8a7a'); }
      for (let k = 400; k < w; k += 600 + R() * 400) { bgSkull(g, k, 20 + R() * 50, 3, '#efe9dc'); }
      if (goreOn()) for (let k = 300; k < w; k += 400 + R() * 400) { g.fillStyle = 'rgba(110,14,18,0.75)'; g.beginPath(); g.ellipse(k, 20 + R() * 50, 6, 1.5, 0, 0, Math.PI * 2); g.fill(); }
      bgDither(g, 0, 0, w, 4, '#5a3020'); BF(g, 0, 0, w, 1, '#5a3020');
    },
    front(ctx, camX) {
      // rotolacampo che attraversa la strada
      const f = G.frame, x = W + 40 - ((f * 1.6) % (W + 120)), y = 206 - Math.abs(Math.sin(f * 0.08)) * 10;
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.8; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x, y, 9, 8, f * 0.1 + k, 0, Math.PI * 1.4); ctx.stroke(); }
      for (let k = 820; k < this.worldEnd; k += 980) { const px = Math.round(k - camX * 1.2); if (px < -30 || px > W + 30) continue; ctx.fillStyle = '#2a1408'; ctx.fillRect(px, 120, 8, H - 120); ctx.fillRect(px - 10, 150, 28, 4); ctx.fillStyle = '#5a3a22'; ctx.fillRect(px + 1, 120, 2, H - 120); }
    },
  },

  // ---------------- 8: POP — studio del talent show ----------------
  tvstudio: {
    seed: 2008, shadeTop: 0.4, farPar: 0.35,
    sky(sc, R) { BF(sc, 0, 0, W, BASE_Y, '#08060e'); },
    far(fc, fw, R) {
      BF(fc, 0, 0, fw, BASE_Y, '#0e0a18');
      for (let row = 0; row < 6; row++) { const y = 30 + row * 16; BF(fc, 0, y + 10, fw, 2, '#1e1a2c'); for (let k = (row % 2) * 6; k < fw; k += 12) { fdisc(fc, k + 6, y + 4, 2.6, bgPick(R, ['#e8d8c8', '#d8c8b8', '#c8b8a8'])); BF(fc, k + 3, y + 7, 6, 4, bgPick(R, ['#3a2a5a', '#5a2a3a', '#2a3a5a'])); } }
      for (let k = 100; k < fw; k += 260) { BF(fc, k, 8, 60, 14, '#1a0a0a'); drawText(fc, 'APPLAUSI', k + 30, 12, '#5a1a1a', { align: 'center' }); }
      bgNightShade(fc, fw, BASE_Y, 0.4, 0.4);
    },
    seq: ['set', 'cameras', 'backstage', 'set', 'screens', 'cameras'],
    segW: { set: [180, 220], cameras: [120, 160], backstage: [170, 210], screens: [150, 180] },
    post(m, R) { m.save(); m.globalCompositeOperation = 'source-atop'; for (let x = 80; x < this.worldEnd; x += 160 + R() * 60) { const c = bgPick(R, ['255,122,184', '58,224,255', '255,210,62']), g = m.createRadialGradient(x, 50, 4, x, 50, 80); g.addColorStop(0, `rgba(${c},0.25)`); g.addColorStop(1, `rgba(${c},0)`); m.fillStyle = g; m.fillRect(x - 80, 0, 160, BASE_Y); } m.restore(); },
    seg: {
      set(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#2a1a4a'); bgDither(m, x, 0, w, BASE_Y, '#3a2a5a');
        for (let i = 0; i < w * 0.8; i++) BF(m, x + R() * w, R() * BASE_Y, 0.5, 0.5, bgPick(R, ['#ffffff', '#ffd23e', '#ff9ad9']));
        const cx = x + w / 2, cy = 56; m.fillStyle = '#ffd23e'; m.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 12 : 28; m.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } m.fill();
        m.fillStyle = '#fff2a8'; m.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 6 : 16; m.lineTo(cx + Math.cos(a) * r - 2, cy + Math.sin(a) * r - 2); } m.fill();
        BF(m, x, BASE_Y - 16, w, 16, '#18102a'); for (let k = x; k < x + w; k += 6) this.anim.push({ t: 'bulb', x: k, y: BASE_Y - 14 });
        this.anim.push({ t: 'spot', x: x + 30, y: 0, c: '#ffb0d8', sweep: 30 });
      },
      cameras(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#120c1e');
        bgTruss(m, x, x + w, 8, '#5a5a6a');
        // gru della telecamera
        m.strokeStyle = '#2a2a34'; m.lineWidth = 3; m.beginPath(); m.moveTo(x + 20, BASE_Y); m.lineTo(x + 30, 70); m.lineTo(x + w - 30, 40); m.stroke();
        BF(m, x + w - 40, 32, 22, 14, '#2a2a34'); BF(m, x + w - 20, 36, 8, 6, '#18161e'); fdisc(m, x + w - 14, 39, 2, '#3ae0ff');
        BF(m, x + 10, BASE_Y - 12, 30, 12, '#2a2a34');
        for (let k = 0; k < 3; k++) { const sx = x + 20 + k * (w - 40) / 2; BF(m, sx - 4, 12, 8, 8, '#3a3a46'); fdisc(m, sx, 20, 3, '#fff2c8'); this.anim.push({ t: 'spot', x: sx, y: 20, c: bgPick(R, ['#fff2c8', '#c8e8ff', '#ffc8e8']), sweep: 20 }); }
        this.anim.push({ t: 'glow', x: x + w - 14, y: 39, r: 6, c: '#ff2020', a: 0.6, sp: 0.2 });
      },
      backstage(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#2a2030');
        bgFrame(m, x + 20, 26, w - 40, 50, '#3a4a5a', R); bgGlassShine(m, x + 20, 26, w - 40, 50);
        for (let k = x + 16; k < x + w - 16; k += 8) { this.anim.push({ t: 'glow', x: k + 2, y: 22, r: 5, c: '#fff2a8', a: 0.5, sp: 0.1 }); BF(m, k, 20, 4, 4, '#fff2a8'); }
        // manichini
        for (let k = 0; k < 3; k++) { const mx = x + 30 + k * (w - 60) / 2; m.fillStyle = '#e8d8c8'; m.beginPath(); m.ellipse(mx, BASE_Y - 46, 5, 6, 0, 0, Math.PI * 2); m.fill(); BF(m, mx - 8, BASE_Y - 40, 16, 22, bgPick(R, ['#ff7ab8', '#3ae0ff', '#ffd23e', '#e8d8c8'])); BF(m, mx - 1, BASE_Y - 18, 2, 16, '#8a8494'); BF(m, mx - 6, BASE_Y - 2, 12, 2, '#5a5a66'); if (R() < 0.5) { BF(m, mx - 2.5, BASE_Y - 47, 1.5, 1, '#3a3446'); BF(m, mx + 1, BASE_Y - 47, 1.5, 1, '#3a3446'); } }
        if (R() < 0.6) bgSplat(m, x + R() * w, 90, 3, R);
        drawText(m, 'SILENZIO', x + w / 2, 84, '#ff3040', { align: 'center' });
      },
      screens(m, x, w, R) {
        BF(m, x, 0, w, BASE_Y, '#0e0a18');
        const sw = (w - 30) / 2, sh = 34;
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { BF(m, x + 10 + c * (sw + 10) - 2, 20 + r * (sh + 8) - 2, sw + 4, sh + 4, '#2a2a34'); this.anim.push({ t: 'screen', x: x + 10 + c * (sw + 10), y: 20 + r * (sh + 8), w: sw, h: sh, pal: ['#ff7ab8', '#3ae0ff', '#ffd23e', '#c58bff'] }); }
        BF(m, x, BASE_Y - 16, w, 16, '#18102a');
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      BF(m, x, 0, w, BASE_Y, '#0e0818');
      for (let s = 0; s < 4; s++) BF(m, x + 40 + s * 10, BASE_Y - 8 - s * 6, w - 80 - s * 20, 6, s % 2 ? '#2a1a4a' : '#3a2a6a');
      BF(m, x + 50, 10, w - 100, 60, '#2a2a34');
      this.bossDoor = x + w / 2;
      this.anim.push({ t: 'screen', x: x + 54, y: 14, w: w - 108, h: 52, pal: ['#ff7ab8', '#3ae0ff', '#ffd23e', '#62f08e'] });
      this.anim.push({ t: 'neon', x: x + w / 2, y: 74, txt: 'TALENTI MOSTRUOSI', c: '#ff7ab8', w: textWidth('TALENTI MOSTRUOSI', 2), sc: 2 });
      for (let k = 0; k < 4; k++) this.anim.push({ t: 'spot', x: x + 40 + k * (w - 80) / 3, y: 0, c: ['#ffb0d8', '#c8e8ff', '#fff2c8', '#c8ffd8'][k], sweep: 50 });
      for (let k = x + 40; k < x + w - 40; k += 6) this.anim.push({ t: 'bulb', x: k, y: BASE_Y - 34 });
    },
    ground(g, w, gh, R) {
      BF(g, 0, 0, w, gh, '#0c0a12');
      for (let y = 2; y < gh; y += 3) bgDither(g, 0, y, w, 0.5, '#141220', y);
      for (let k = 60; k < w; k += 130 + R() * 80) { BF(g, k, 10 + R() * 60, 10, 1, '#ffd23e'); BF(g, k + 4.5, 6 + R() * 60, 1, 10, '#ffd23e'); }
      for (let k = 0; k < w; k += 3) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(k, 0, 1.5, 6); }
      if (goreOn()) for (let k = 400; k < w; k += 400 + R() * 400) { g.fillStyle = 'rgba(122,12,20,0.7)'; g.beginPath(); g.ellipse(k, 30 + R() * 40, 7, 1.5, 0, 0, Math.PI * 2); g.fill(); }
    },
    groundAnim(ctx, camX) {
      // riflessi delle luci sul pavimento lucido
      const f = G.frame;
      for (let k = 0; k < 4; k++) { const x = (k * 110 + Math.sin(f * 0.01 + k) * 40 + 40) % (W + 40); ctx.globalAlpha = 0.07; ctx.fillStyle = ['#ff7ab8', '#3ae0ff', '#ffd23e', '#ffffff'][k]; ctx.fillRect(x, BASE_Y + 4, 16, GND_H - 4); ctx.globalAlpha = 1; }
    },
    front(ctx, camX) {
      for (let k = 700; k < this.worldEnd; k += 900) { const x = Math.round(k - camX * 1.25); if (x < -40 || x > W + 40) continue;
        ctx.fillStyle = '#05040a'; ctx.fillRect(x, H - 60, 30, 60); ctx.fillRect(x + 12, H - 90, 6, 30); ctx.fillStyle = '#2a2a34'; ctx.fillRect(x + 6, H - 104, 18, 14); fdisc(ctx, x + 22, H - 97, 3, '#3ae0ff'); }
    },
  },

  // ---------------- 9: JAZZ — club sotterraneo dei vampiri ----------------
  speakeasy: {
    seed: 1927, bats: 7, batY: 22, shadeTop: 0.55, farPar: 0.3,
    sky(sc, R) { BF(sc, 0, 0, W, BASE_Y, '#0a0604'); },
    far(fc, fw, R) {
      BF(fc, 0, 0, fw, BASE_Y, '#140a08');
      for (let k = 0; k < fw; k += 80) { bgBricks(fc, k, 0, 12, BASE_Y, '#3a2018', R); fc.strokeStyle = '#3a2018'; fc.lineWidth = 6; fc.beginPath(); fc.ellipse(k + 46, 40, 34, 26, 0, Math.PI, 0); fc.stroke(); BF(fc, k + 45, 16, 2, 10, '#2a1a12'); fdisc(fc, k + 46, 28, 2, '#ffb03a'); }
      bgNightShade(fc, fw, BASE_Y, 0.55, 0.45);
    },
    seq: ['bar', 'deco', 'booth', 'coffins', 'deco', 'bar'],
    segW: { bar: [200, 240], deco: [120, 160], booth: [170, 210], coffins: [150, 180] },
    seg: {
      bar(m, x, w, R) {
        bgPlanks(m, x, 0, w, BASE_Y, '#3a2014', R);
        BF(m, x + 10, 16, w - 20, 60, '#1a0e0a'); bgFrame(m, x + 30, 22, w - 60, 26, '#3a4a5a', R); bgGlassShine(m, x + 30, 22, w - 60, 26);
        for (const y of [52, 66]) { BF(m, x + 12, y, w - 24, 2, '#c9a43a'); for (let k = x + 16; k < x + w - 20; k += 6 + R() * 3) { const h = 7 + R() * 5, c = bgPick(R, ['#2a8a3a', '#8a3a1a', '#c9a43a', '#3a2a5a', '#7a0c14']); BF(m, k, y - h, 3, h, c); BF(m, k + 1, y - h - 2, 1, 2, c); BF(m, k, y - h, 1, h, shade(c, 1.5)); } }
        BF(m, x, BASE_Y - 30, w, 30, '#4a2614'); BF(m, x, BASE_Y - 30, w, 3, '#c9a43a'); BF(m, x, BASE_Y - 27, w, 1, '#6a3a1a');
        for (let k = x + 10; k < x + w; k += 24) bgPlanks(m, k, BASE_Y - 24, 18, BASE_Y - 4, '#5a3018', R);
        for (let k = 0; k < 3; k++) { const gx = x + 20 + R() * (w - 40); BF(m, gx, BASE_Y - 36, 3, 6, 'rgba(200,220,255,0.5)'); if (goreOn()) BF(m, gx, BASE_Y - 33, 3, 3, '#a8141e'); }
        this.anim.push({ t: 'glow', x: x + w / 2, y: 40, r: 50, c: '#ffb03a', a: 0.1, sp: 0.03 });
      },
      deco(m, x, w, R) {
        bgPlanks(m, x, 0, w, BASE_Y, '#2a160e', R);
        const cx = x + w / 2, cy = 60;
        for (let k = 0; k < 11; k++) { const a = Math.PI + k * Math.PI / 10; m.strokeStyle = '#c9a43a'; m.lineWidth = 1.5; m.beginPath(); m.moveTo(cx, cy); m.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34); m.stroke(); }
        fdisc(m, cx, cy, 6, '#ffe08a'); BF(m, x + 10, cy, w - 20, 2, '#c9a43a');
        for (const sx of [x + 14, x + w - 14]) { BF(m, sx - 3, 70, 6, 10, '#c9a43a'); BF(m, sx - 1.5, 64, 3, 6, '#efe9dc'); this.anim.push({ t: 'flame', x: sx, y: 64, s: 0.9 }, { t: 'glow', x: sx, y: 62, r: 20, c: '#ffb03a', a: 0.14, sp: 0.2 }); }
        bgCobweb(m, x + w, 0, 20, -1);
      },
      booth(m, x, w, R) {
        bgDamask(m, x, 0, w, BASE_Y, '#5a0a14', R);
        for (let k = 0; k < 2; k++) { const bx = x + 10 + k * (w / 2); BF(m, bx, BASE_Y - 46, w / 2 - 20, 46, '#7a0c1a'); for (let s = 0; s < w / 2 - 20; s += 8) BF(m, bx + s, BASE_Y - 46, 1, 46, '#5a0812'); BF(m, bx, BASE_Y - 48, w / 2 - 20, 3, '#c9a43a'); }
        for (let k = 0; k < 3; k++) { const fx = x + 20 + k * (w - 40) / 2.5; bgFrame(m, fx, 22, 22, 26, '#d8c8a8', R); bgDither(m, fx, 22, 22, 26, '#a89878'); fdisc(m, fx + 11, 32, 4, '#3a2a1a'); BF(m, fx + 5, 37, 12, 11, '#2a1a10'); }
        this.anim.push({ t: 'swing', x: x + w / 2, y: 0, len: 20, lamp: '#ff6a3a' });
      },
      coffins(m, x, w, R) {
        bgStoneBlocks(m, x, 0, w, BASE_Y, '#3a2a28', R);
        for (let k = 0; k < 3; k++) { const cx = x + 20 + k * (w - 40) / 2.4; m.fillStyle = '#3a1a10'; m.beginPath(); m.moveTo(cx, BASE_Y); m.lineTo(cx - 4, BASE_Y - 40); m.lineTo(cx + 4, BASE_Y - 54); m.lineTo(cx + 20, BASE_Y - 54); m.lineTo(cx + 28, BASE_Y - 40); m.lineTo(cx + 24, BASE_Y); m.fill(); BF(m, cx + 11, BASE_Y - 46, 2, 22, '#c9a43a'); BF(m, cx + 6, BASE_Y - 40, 12, 2, '#c9a43a');
          if (k === 1) this.anim.push({ t: 'eyes', x: cx + 12, y: BASE_Y - 34, c: '#ff2030' }); }
        for (let k = 0; k < 5; k++) { const cx = x + 10 + R() * (w - 20); BF(m, cx - 1, BASE_Y - 8, 2.5, 8, '#efe9dc'); this.anim.push({ t: 'flame', x: cx, y: BASE_Y - 8, s: 0.6 }); }
        this.anim.push({ t: 'drip', x: x + w * 0.7, y: 30, len: 20 });
        bgCobweb(m, x, 0, 24, 1);
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      bgPlanks(m, x, 0, w, BASE_Y, '#2a160e', R);
      // finestra rotonda con la luna rossa
      const cx = x + w / 2, cy = 46; m.fillStyle = '#c9a43a'; m.beginPath(); m.arc(cx, cy, 36, 0, Math.PI * 2); m.fill(); m.fillStyle = '#2a0a14'; m.beginPath(); m.arc(cx, cy, 33, 0, Math.PI * 2); m.fill();
      bgMoon(m, cx + 8, cy - 6, 16, '#e83040'); BF(m, cx - 33, cy - 0.5, 66, 1.5, '#c9a43a'); BF(m, cx - 0.75, cy - 33, 1.5, 66, '#c9a43a');
      bgCurtain(m, x + 20, 0, 80, BASE_Y, '#7a0c1a'); bgCurtain(m, x + w - 100, 0, 80, BASE_Y, '#7a0c1a');
      BF(m, x + 100, BASE_Y - 18, w - 200, 18, '#3a1a0c'); BF(m, x + 100, BASE_Y - 18, w - 200, 2, '#c9a43a');
      this.bossDoor = cx;
      this.anim.push({ t: 'neon', x: cx, y: 90, txt: 'SWING', c: '#ffd23e', w: textWidth('SWING', 3), sc: 3 }, { t: 'glow', x: cx, y: cy, r: 60, c: '#ff2030', a: 0.14, sp: 0.03 });
    },
    ground(g, w, gh, R) {
      gndChecker(g, w, gh, R, '#8a8274', '#1a161c'); g.fillStyle = 'rgba(10,6,4,0.25)'; g.fillRect(0, 0, w, gh);
      for (let k = 200; k < w; k += 500) { BF(g, k, 20, 120, 40, '#5a0a14'); BF(g, k + 2, 22, 116, 36, '#7a1020'); for (let q = 0; q < 116; q += 6) BF(g, k + 2 + q, 22, 3, 36, '#6a0c18'); BF(g, k, 20, 120, 1, '#c9a43a'); BF(g, k, 59, 120, 1, '#c9a43a'); }
      if (goreOn()) for (let k = 300; k < w; k += 350 + R() * 300) { g.fillStyle = 'rgba(122,12,20,0.75)'; g.beginPath(); g.ellipse(k, 20 + R() * 50, 6 + R() * 6, 1.5, 0, 0, Math.PI * 2); g.fill(); }
    },
    front(ctx, camX) {
      for (let k = 720; k < this.worldEnd; k += 900) { const x = Math.round(k - camX * 1.22); if (x < -40 || x > W + 40) continue;
        ctx.fillStyle = '#080404'; ctx.fillRect(x, 0, 18, H); ctx.fillStyle = '#c9a43a'; ctx.fillRect(x, 40, 18, 2); ctx.fillRect(x, H - 50, 18, 2); ctx.fillStyle = '#2a160e'; ctx.fillRect(x + 3, 0, 2, H); }
    },
  },

  // ---------------- 10: IL COVO FINALE — castello-club sotto un cielo rosso ----------------
  finale: {
    seed: 9999, bats: 8, shadeTop: 0.35, farPar: 0.25,
    sky(sc, R) {
      const g = sc.createLinearGradient(0, 0, 0, BASE_Y); g.addColorStop(0, '#120206'); g.addColorStop(0.5, '#4a0a12'); g.addColorStop(1, '#8a1a1a');
      sc.fillStyle = g; sc.fillRect(0, 0, W, BASE_Y);
      for (let k = 0; k < 10; k++) { const cx = R() * W, cy = 8 + R() * 50; sc.fillStyle = 'rgba(10,2,6,0.6)'; sc.beginPath(); sc.ellipse(cx, cy, 30 + R() * 40, 5 + R() * 6, 0, 0, Math.PI * 2); sc.fill(); }
      bgMoon(sc, 70, 30, 14, '#ff4a3a');
    },
    skyAnim(ctx) {
      // lampi lontani (attenuati con l'opzione FLASH RIDOTTI)
      const f = G.frame, k = f % 420, calm = typeof Opts !== 'undefined' && Opts.flash === false;
      if (k < 8 && (k >> 1) % 2 === 0) { ctx.globalAlpha = calm ? 0.06 : 0.22; ctx.fillStyle = '#ffd8d8'; ctx.fillRect(0, 0, W, BASE_Y); ctx.globalAlpha = 1;
        if (!calm) { ctx.strokeStyle = '#fff0f0'; ctx.lineWidth = 1; ctx.beginPath(); let x = 120 + (f % 1260) / 6, y = 0; ctx.moveTo(x, y); while (y < 70) { x += (Math.sin(y * 7.1 + f) * 6); y += 8; ctx.lineTo(x, y); } ctx.stroke(); } }
    },
    far(fc, fw, R) {
      fc.fillStyle = '#1a0408';
      for (let x = 0; x < fw; x += 180) {
        const bx = x + 20; fc.fillRect(bx, 50, 120, BASE_Y - 50);
        for (const tx of [bx - 6, bx + 50, bx + 110]) { const th = 40 + R() * 30; fc.fillRect(tx, 50 - th, 16, th + 10); fc.beginPath(); fc.moveTo(tx - 4, 50 - th); fc.lineTo(tx + 8, 50 - th - 22); fc.lineTo(tx + 20, 50 - th); fc.fill(); BF(fc, tx + 6, 50 - th + 10, 4, 6, R() < 0.6 ? '#ff6a3a' : '#3a0a10'); }
        for (let wy = 60; wy < BASE_Y - 10; wy += 14) for (let wx = bx + 8; wx < bx + 110; wx += 16) if (R() < 0.3) BF(fc, wx, wy, 4, 6, bgPick(R, ['#ff6a3a', '#ffb03a', '#ff3a3a']));
        fc.fillStyle = '#1a0408';
      }
    },
    seq: ['stone', 'gate', 'banner', 'stone', 'gargoyle', 'gate'],
    segW: { stone: [180, 220], gate: [140, 170], banner: [150, 190], gargoyle: [80, 100] },
    seg: {
      stone(m, x, w, R) {
        // mura basse con merli: sopra si vedono il cielo rosso e il castello
        bgStoneBlocks(m, x, 36, w, BASE_Y, '#3a2a30', R);
        for (let k = x; k < x + w; k += 24) { bgStoneBlocks(m, k, 24, 12, 36, '#3a2a30', R); BF(m, k, 24, 12, 1, '#5a4a52'); }
        BF(m, x, 36, w, 1.5, '#5a4a52');
        for (let k = x + 20; k < x + w - 20; k += 60) { BF(m, k, 44, 26, 26, '#0c0608'); m.fillStyle = '#0c0608'; m.beginPath(); m.arc(k + 13, 44, 13, Math.PI, 0); m.fill(); bgSkull(m, k + 13, 56, 6); }
        for (const tx of [x + 10, x + w - 10]) { BF(m, tx - 2, 80, 4, 12, '#3a2a20'); BF(m, tx - 3, 78, 6, 3, '#5a4a3a'); this.anim.push({ t: 'flame', x: tx, y: 78, s: 1.6, big: true }, { t: 'glow', x: tx, y: 74, r: 30, c: '#ff6a2a', a: 0.16, sp: 0.25 }); }
        if (R() < 0.7) bgSplat(m, x + R() * w, 100, 4, R);
        this.anim.push({ t: 'drip', x: x + w * 0.5, y: 70, len: 16 });
      },
      gate(m, x, w, R) {
        bgStoneBlocks(m, x, 0, 16, BASE_Y, '#3a2a30', R); bgStoneBlocks(m, x + w - 16, 0, 16, BASE_Y, '#3a2a30', R);
        bgStoneBlocks(m, x, 0, w, 20, '#3a2a30', R);
        for (let k = x + 20; k < x + w - 16; k += 8) { BF(m, k, 20, 2, BASE_Y - 20, '#1a1418'); BF(m, k, 20, 0.5, BASE_Y - 20, '#4a4048'); m.fillStyle = '#1a1418'; m.beginPath(); m.moveTo(k - 1, 22); m.lineTo(k + 1, 16); m.lineTo(k + 3, 22); m.fill(); }
        BF(m, x + 16, 50, w - 32, 2, '#1a1418'); BF(m, x + 16, 100, w - 32, 2, '#1a1418');
        bgSkull(m, x + w / 2, 30, 7, '#c9c4d0');
      },
      banner(m, x, w, R) {
        bgStoneBlocks(m, x, 30, w, BASE_Y, '#2e2228', R);
        for (let k = x; k < x + w; k += 24) bgStoneBlocks(m, k, 18, 12, 30, '#2e2228', R);
        for (let k = 0; k < 2; k++) { const bx = x + 20 + k * (w / 2); BF(m, bx, 34, w / 2 - 40, 50, '#5a0a12'); m.fillStyle = '#5a0a12'; m.beginPath(); m.moveTo(bx, 84); m.lineTo(bx + (w / 2 - 40) / 2, 94); m.lineTo(bx + w / 2 - 40, 84); m.fill(); BF(m, bx - 2, 32, w / 2 - 36, 3, '#c9a43a');
          bgSkull(m, bx + (w / 2 - 40) / 2, 56, 9, '#c9a43a'); }
        bgPoster(m, x + w / 2 - 22, 94, 44, 30, '#efe3c4', '#18161e', 'ANABLES', R, { torn: true, wall: '#2e2228' });
        m.strokeStyle = '#c42032'; m.lineWidth = 2; m.beginPath(); m.moveTo(x + w / 2 - 24, 96); m.lineTo(x + w / 2 + 24, 122); m.moveTo(x + w / 2 + 24, 96); m.lineTo(x + w / 2 - 24, 122); m.stroke();
      },
      gargoyle(m, x, w, R) {
        bgStoneBlocks(m, x, 50, w, BASE_Y, '#3a2a30', R);
        bgPilaster(m, x + w / 2 - 12, 40, BASE_Y, 24, '#5a4a52');
        const cx = x + w / 2, cy = 30; m.fillStyle = '#4a3a42'; m.beginPath(); m.ellipse(cx, cy, 14, 10, 0, 0, Math.PI * 2); m.fill();
        m.beginPath(); m.moveTo(cx - 14, cy - 4); m.lineTo(cx - 26, cy - 16); m.lineTo(cx - 10, cy - 8); m.moveTo(cx + 14, cy - 4); m.lineTo(cx + 26, cy - 16); m.lineTo(cx + 10, cy - 8); m.fill();
        m.beginPath(); m.moveTo(cx - 6, cy - 9); m.lineTo(cx - 8, cy - 16); m.lineTo(cx - 2, cy - 10); m.moveTo(cx + 6, cy - 9); m.lineTo(cx + 8, cy - 16); m.lineTo(cx + 2, cy - 10); m.fill();
        BF(m, cx - 5, cy + 3, 10, 2, '#1a1014');
        this.anim.push({ t: 'eyes', x: cx, y: cy - 2, c: '#ff2020' });
      },
    },
    bossW: 440,
    boss(m, x, w, R) {
      bgStoneBlocks(m, x, 0, w, BASE_Y, '#24181e', R);
      const cx = x + w / 2;
      // gigantesco teschio con fulmini: l'insegna del covo
      bgSkull(m, cx, 50, 30, '#d8d0c8');
      for (const d of [-1, 1]) { m.fillStyle = '#ffd23e'; m.beginPath(); m.moveTo(cx + d * 44, 20); m.lineTo(cx + d * 60, 46); m.lineTo(cx + d * 52, 46); m.lineTo(cx + d * 66, 76); m.lineTo(cx + d * 46, 44); m.lineTo(cx + d * 54, 44); m.fill(); }
      BF(m, x + 30, BASE_Y - 20, w - 60, 20, '#1a0a0e'); BF(m, x + 30, BASE_Y - 20, w - 60, 2, '#c42032');
      for (let k = 0; k < 2; k++) bgSpeaker(m, x + 30 + k * (w - 100), 40, 40, 70);
      this.bossDoor = cx;
      this.anim.push({ t: 'eyes', x: cx - 12, y: 52, c: '#ff2020' }, { t: 'eyes', x: cx + 12, y: 52, c: '#ff2020' }, { t: 'glow', x: cx, y: 52, r: 50, c: '#ff2020', a: 0.16, sp: 0.06 });
      this.anim.push({ t: 'neon', x: cx, y: 96, txt: 'IL COVO', c: '#ff3040', w: textWidth('IL COVO', 3), sc: 3 });
      for (let k = 0; k < 4; k++) this.anim.push({ t: 'flame', x: x + 24 + k * (w - 48) / 3, y: BASE_Y - 20, s: 3, big: true });
    },
    ground(g, w, gh, R) {
      bgStoneBlocks(g, 0, 0, w, gh, '#2a2026', R);
      this.cracks = [];
      for (let k = 60; k < w; k += 90 + R() * 120) { let cx = k, cy = 10 + R() * (gh - 20); const pts = [[cx, cy]]; for (let s = 0; s < 12; s++) { cx += 2 + R() * 3; cy += (R() - 0.5) * 4; pts.push([cx, cy]); } this.cracks.push(pts);
        g.strokeStyle = '#120608'; g.lineWidth = 2; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); }
      bgDither(g, 0, 0, w, 4, '#0c0608'); BF(g, 0, 0, w, 1, '#0c0608');
      if (goreOn()) for (let k = 200; k < w; k += 260 + R() * 300) { g.fillStyle = 'rgba(122,12,20,0.8)'; g.beginPath(); g.ellipse(k, 20 + R() * 50, 8 + R() * 8, 2, 0, 0, Math.PI * 2); g.fill(); }
    },
    groundAnim(ctx, camX) {
      // crepe di lava che pulsano
      const k = 0.55 + 0.35 * Math.sin(G.frame * 0.06);
      ctx.strokeStyle = `rgba(255,${90 + Math.round(60 * k)},40,${0.6 * k + 0.3})`; ctx.lineWidth = 1;
      for (const pts of this.cracks) { if (pts[0][0] - camX > W + 60 || pts[pts.length - 1][0] - camX < -60) continue; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a - camX, BASE_Y + b) : ctx.moveTo(a - camX, BASE_Y + b)); ctx.stroke(); }
    },
    front(ctx, camX) {
      for (let k = 680; k < this.worldEnd; k += 880) { const x = Math.round(k - camX * 1.22); if (x < -40 || x > W + 40) continue;
        ctx.fillStyle = '#080206'; ctx.fillRect(x, 0, 20, H); ctx.fillStyle = '#3a1a20'; ctx.fillRect(x + 3, 0, 2, H); bgChain(ctx, x + 30, 0, 70, '#2a1a20'); }
    },
  },
});
registerBgThemes();
