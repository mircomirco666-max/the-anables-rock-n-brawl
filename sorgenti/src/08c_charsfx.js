// ============================================================
// SUONI DEI MUSICISTI
// Ogni colpo suona lo strumento di chi lo dà, intonato sull'accordo del brano
// che sta suonando in quel momento (Audio2.harmony()): una combo diventa un riff.
// Arrigo urla, Mike (chitarra solista) note singole distorte, Danny (chitarra ritmica) accordi,
// Mario il basso (con lo slap), Troy rullante, tom e piatti, Marvin accordi di piano.
// Le corde delle chitarre sono sintetizzate come corde pizzicate (Karplus-Strong).
// ============================================================
// formanti delle vocali (voce maschile, valori medi di Peterson e Barney, 1952)
const VOWELS = { a: [730, 1090, 2440], e: [530, 1840, 2480], i: [270, 2290, 3010], o: [570, 840, 2410], u: [300, 870, 2240] };
// volume misurato della voce sintetica da 90 a 340 Hz (passo 10) per vocale: serve a renderla uniforme a ogni altezza
const VOX_CAL = {
  a: [78, 96, 89, 94, 90, 120, 126, 101, 95, 115, 105, 95, 111, 145, 175, 211, 192, 146, 123, 107, 95, 92, 95, 104, 120, 146],
  e: [100, 121, 131, 110, 121, 118, 121, 150, 198, 208, 169, 138, 124, 120, 129, 145, 171, 197, 196, 174, 152, 139, 133, 128, 127, 130],
  o: [101, 106, 136, 133, 113, 127, 120, 127, 162, 197, 219, 184, 149, 128, 117, 119, 131, 156, 196, 232, 227, 196, 167, 148, 138, 134],
  u: [202, 233, 210, 193, 200, 218, 231, 224, 220, 219, 221, 234, 256, 284, 315, 354, 401, 454, 512, 568, 610, 620, 599, 559, 510, 461],
  i: [235, 216, 203, 214, 234, 237, 229, 226, 233, 250, 274, 305, 345, 391, 445, 503, 558, 597, 611, 596, 561, 515, 469, 427, 390, 356],
};
function voxGain(vw, f) { const T = VOX_CAL[vw] || VOX_CAL.a, x = clamp((f - 90) / 10, 0, T.length - 1), i = Math.floor(x), k = x - i; const r = (T[i] * (1 - k) + T[Math.min(T.length - 1, i + 1)] * k) / 1000; return 0.072 / r; }

const CSX = {
  // uscita con un volume proprio, collegata agli effetti
  bus(v) { const c = Audio2.ctx, g = c.createGain(); g.gain.value = v; g.connect(Audio2.sfx); return { ctx: c, out: g, noiseBuf: Audio2.noiseBuf }; },
  third(H) { return H.minor ? 3 : 4; },
  // n-esima nota della pentatonica (minore o maggiore secondo l'accordo) sopra "base"
  pent(H, base, n) { const sc = H.minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]; const o = Math.floor(n / 5), i = ((n % 5) + 5) % 5; return base + o * 12 + sc[i]; },
  env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); },
  tone(A, type, f0, f1, t, dur, peak, a = 0.003) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    CSX.env(g, t, a, peak, dur); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + a + dur + 0.05);
  },
  noise(A, t, dur, type, f, peak, q = 0.8, f1 = null) {
    const c = A.ctx, s = c.createBufferSource(); s.buffer = A.noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q;
    const g = c.createGain(); CSX.env(g, t, 0.002, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(A.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  // impatto fisico leggero sotto la nota, perché il colpo resti un colpo
  thump(A, t, big) {
    CSX.tone(A, 'sine', big ? 120 : 160, big ? 40 : 60, t, big ? 0.16 : 0.08, big ? 0.55 : 0.35);
    CSX.noise(A, t, big ? 0.09 : 0.04, 'bandpass', big ? 900 : 1600, big ? 0.35 : 0.25, 1);
  },
  // voce: dente di sega e onda quadra filtrate da tre formanti, con soffio iniziale ("H")
  vox(A, t, f0, f1, dur, vw, peak, breath = true) {
    const c = A.ctx, o1 = c.createOscillator(), o2 = c.createOscillator(), mixG = c.createGain(), g = c.createGain(), g2 = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; g2.gain.value = 0.35;
    for (const o of [o1, o2]) { o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur); }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6.2; lg.gain.value = 22; lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    o1.connect(mixG); o2.connect(g2); g2.connect(mixG);
    const F = VOWELS[vw] || VOWELS.a;
    [[F[0], 1], [F[1], 0.55], [F[2], 0.28]].forEach(([fr, v]) => { const bp = c.createBiquadFilter(), bg = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = fr / 90; bg.gain.value = v * 3.2; mixG.connect(bp); bp.connect(bg); bg.connect(g); });
    const pk = peak * voxGain(vw, Math.sqrt(f0 * f1));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.018); g.gain.setValueAtTime(pk, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(A.out);
    for (const o of [o1, o2, lfo]) { o.start(t); o.stop(t + dur + 0.05); }
    if (breath) CSX.noise(A, t, 0.05, 'bandpass', 1400, peak * 0.5, 1.2);
  },
  // corda pizzicata (Karplus-Strong): rumore che passa in un anello di ritardo lungo un periodo;
  // il buffer si calcola una volta per nota, l'intonazione esatta la dà playbackRate
  _ks: new Map(),
  ksBuf(m, bright) {
    const key = m + '|' + bright; let k = this._ks.get(key); if (k) return k;
    const sr = 44100, f = mtof(m), N = Math.max(2, Math.round(sr / f - 0.5)), len = Math.ceil(sr * 2.4);
    const buf = new AudioBuffer({ length: len, sampleRate: sr, numberOfChannels: 1 }), d = buf.getChannelData(0);
    let p = 0, mean = 0;
    for (let i = 0; i < N; i++) { p += bright * ((Math.random() * 2 - 1) - p); d[i] = p; mean += p; }
    mean /= N; for (let i = 0; i < N; i++) d[i] -= mean;
    const T60 = clamp(3.4 - (m - 40) * 0.065, 0.7, 3.4), rho = Math.pow(0.001, 1 / (f * T60));
    for (let i = N; i < len; i++) d[i] = rho * 0.5 * (d[i - N] + (i - N - 1 >= 0 ? d[i - N - 1] : 0));
    k = { buf, rate: f / (sr / (N + 0.5)) };
    if (this._ks.size > 400) this._ks.clear();
    this._ks.set(key, k); return k;
  },
  // una corda: o.bend (semitoni tirati), o.dive (picchiata con la leva), o.vib (vibrato), o.dest (catena d'effetti)
  string(A, t, m, dur, peak, o = {}) {
    const c = A.ctx, K = CSX.ksBuf(m, o.bright ?? 0.6), src = c.createBufferSource(), g = c.createGain();
    src.buffer = K.buf; src.playbackRate.setValueAtTime(K.rate, t);
    if (o.bend) { src.playbackRate.setValueAtTime(K.rate, t + 0.06); src.playbackRate.exponentialRampToValueAtTime(K.rate * Math.pow(2, o.bend / 12), t + 0.18); }
    if (o.dive) src.playbackRate.exponentialRampToValueAtTime(K.rate * Math.pow(2, o.dive / 12), t + dur);
    if (o.vib) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.8; lg.gain.value = K.rate * 0.014; lfo.connect(lg); lg.connect(src.playbackRate); lfo.start(t + 0.2); lfo.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(peak, t); g.gain.setValueAtTime(peak, t + Math.max(0.01, dur - 0.06)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g); g.connect(o.dest || A.out); src.start(t); src.stop(t + dur + 0.05);
  },
  // catena di distorsione: drive = 'lead' (saturazione piena, come Mike) o 'crunch' (leggera, come Danny)
  amp(A, drive, lvl = 1) {
    const c = A.ctx, pre = c.createGain(), ws = c.createWaveShaper(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), post = c.createGain();
    if (!CSX._crunch) { const n = 512, k = 5, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; cv[i] = (1 + k) * x / (1 + k * Math.abs(x)); } CSX._crunch = cv; }
    ws.curve = drive === 'lead' ? Audio2.distCurve : CSX._crunch;
    pre.gain.value = drive === 'lead' ? 3 : 1.6;
    hp.type = 'highpass'; hp.frequency.value = drive === 'lead' ? 160 : 90;
    lp.type = 'lowpass'; lp.frequency.value = drive === 'lead' ? 3800 : 4200; lp.Q.value = 0.9;
    post.gain.value = (drive === 'lead' ? 0.13 : 0.155) * lvl;
    pre.connect(ws); ws.connect(hp); hp.connect(lp); lp.connect(post); post.connect(A.out);
    return pre;
  },
  // accordo strappato su sei corde (voicing a barré): dir 1 = pennata in giù, -1 = in su; mute = stoppato
  strum(A, t, H, dir, dur, peak, o = {}) {
    const r = H.root, tr = CSX.third(H);
    let notes = [r, r + 7, r + 12, r + 12 + tr, r + 19, r + 24];
    if (dir < 0) notes = notes.slice(2).reverse();                 // in su: le corde alte per prime
    const dest = CSX.amp(A, 'crunch', o.lvl || 1), gap = o.gap ?? (dir < 0 ? 0.007 : 0.011);
    notes.forEach((m, i) => CSX.string(A, t + i * gap, m, o.mute ? 0.07 : dur, peak * (dir < 0 ? 0.8 : 1) * (1 - i * 0.04), { bright: o.mute ? 0.25 : 0.55, dest }));
    if (o.mute) CSX.noise(A, t, 0.05, 'bandpass', 1400, peak * 0.9, 1.2);   // il "ciak" della mano che stoppa
  },
  // basso elettrico; kind 'slap' (pollice, con schiocco) o 'pop' (corda tirata, ottava sopra); m1 = glissato
  bassNote(A, t, m, dur, peak, kind = '', m1 = null) {
    const c = A.ctx, o = c.createOscillator(), sub = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), gs = c.createGain();
    const mm = kind === 'pop' ? m + 12 : m;
    o.type = kind === 'pop' ? 'square' : 'sawtooth'; sub.type = 'sine'; gs.gain.value = kind === 'pop' ? 0.2 : 0.9;
    for (const x of [o, sub]) { x.frequency.setValueAtTime(mtof(mm), t); if (m1 !== null) x.frequency.exponentialRampToValueAtTime(mtof(m1), t + dur); }
    fl.type = 'lowpass'; fl.Q.value = kind ? 4 : 2;
    fl.frequency.setValueAtTime(kind ? 3200 : 1200, t); fl.frequency.exponentialRampToValueAtTime(kind ? 600 : 320, t + Math.min(0.25, dur));
    CSX.env(g, t, 0.003, peak, dur);
    o.connect(fl); sub.connect(gs); gs.connect(fl); fl.connect(g); g.connect(A.out);
    for (const x of [o, sub]) { x.start(t); x.stop(t + dur + 0.05); }
    if (kind) CSX.noise(A, t, 0.018, 'highpass', 3500, peak * 1.4, 0.7);
  },
  snare(A, t, v = 1) { CSX.noise(A, t, 0.15, 'highpass', 1300, 0.55 * v); CSX.tone(A, 'triangle', 230, 150, t, 0.08, 0.35 * v); },
  tom(A, t, f, v = 1) { CSX.tone(A, 'sine', f * 1.6, f, t, 0.24, 0.75 * v); CSX.tone(A, 'triangle', f * 1.6, f, t, 0.1, 0.25 * v); CSX.noise(A, t, 0.03, 'lowpass', 1400, 0.3 * v); },
  kick(A, t, v = 1) { CSX.tone(A, 'sine', 150, 45, t, 0.2, 0.95 * v); CSX.noise(A, t, 0.015, 'lowpass', 2500, 0.35 * v); },
  crash(A, t, v = 1, dur = 0.9) { CSX.noise(A, t, dur, 'highpass', 4500, 0.28 * v); CSX.noise(A, t, dur * 0.6, 'bandpass', 6500, 0.18 * v, 1.5); },
  hat(A, t, v = 1, open = false) { CSX.noise(A, t, open ? 0.22 : 0.04, 'highpass', 7500, 0.3 * v); },
  piano(A, t, notes, dur) { for (const m of notes) SYN.piano(A, t, m, dur); },
};

// tavolozza di ogni musicista. o = { mv, step, big, combo }, H = accordo del momento, t = istante
const CHAR_SFX = {
  arrigo: {
    swing(A, H, t, o) {
      CSX.noise(A, t, 0.12, 'bandpass', 800, 1.5, 1.3, 1800);                          // il cavo che frusta l'aria
      if (o.mv && o.mv.snd === 'lasso') for (let i = 1; i < 3; i++) CSX.noise(A, t + i * 0.09, 0.08, 'bandpass', 900, 0.4, 1.4, 1900);
      if (o.mv && o.mv.snd === 'lasso') CSX.tone(A, 'sine', mtof(H.root + 67), mtof(H.root + 69), t, 0.5, 0.05, 0.05);   // larsen
    },
    hit(A, H, t, o) {
      const r = H.root, tr = CSX.third(H), n = (o.mv.note || 0) + o.step;
      let m = r + 24 + [0, tr, 7, 12][n % 4]; while (m > 66) m -= 12;
      CSX.thump(A, t, o.big);
      if (o.big) { CSX.vox(A, t, mtof(m + 7), mtof(m), 0.34, 'e', 0.5); CSX.vox(A, t + 0.12, mtof(m), mtof(m - 2), 0.22, 'a', 0.38, false); }   // "YEAH!"
      else CSX.vox(A, t, mtof(m), mtof(m - 1), 0.15, ['a', 'e', 'o', 'a'][n % 4], 0.45);                                                  // "HA!", "HEY!", "HO!"
      if (o.mv.snd === 'lasso') CSX.tone(A, 'sine', 95, 50, t, 0.12, 0.5);               // il microfono che sbatte
    },
    jump(A, H, t) { CSX.vox(A, t, mtof(H.root + 24), mtof(H.root + 31), 0.12, 'u', 0.55); },
    hurt(A, H, t) { CSX.vox(A, t, mtof(H.root + 28), mtof(H.root + 20), 0.2, 'o', 0.42); },
    special(A, H, t) { for (let i = 0; i < 2; i++) { CSX.tone(A, 'sine', 110, 55, t + i * 0.13, 0.09, 0.6); CSX.noise(A, t + i * 0.13, 0.05, 'lowpass', 600, 0.4); } CSX.tone(A, 'sine', mtof(H.root + 64), mtof(H.root + 69), t + 0.2, 0.6, 0.06, 0.2); },
    die(A, H, t) { CSX.vox(A, t, mtof(H.root + 31), mtof(H.root + 12), 0.85, 'o', 0.42); },
  },
  mike: {   // chitarra solista: note singole distorte
    swing(A, H, t, o) {
      CSX.noise(A, t, 0.07, 'bandpass', 2600, 1.5, 2, 1200);                            // plettro sulle corde
      if (o.mv && o.mv.sfx === 'swingBig') CSX.noise(A, t, 0.14, 'bandpass', 600, 0.5, 1);
    },
    hit(A, H, t, o) {
      const r = H.root, n = (o.mv.note || 0) + o.step;
      CSX.thump(A, t, o.big);
      const amp = CSX.amp(A, 'lead');
      if (o.mv.snd === 'windmill') { CSX.string(A, t, r + 19, 0.9, 0.9, { dest: amp, dive: -12, bright: 0.8 }); return; }       // picchiata con la leva
      if (o.big) { const m = CSX.pent(H, r + 36, 2); CSX.string(A, t, m, 0.8, 0.9, { dest: CSX.amp(A, 'lead', 1.6), bend: 2, vib: true, bright: 0.8 }); CSX.tone(A, 'sine', mtof(m + 12), mtof(m + 14), t + 0.25, 0.5, 0.04, 0.1); return; }
      CSX.string(A, t, CSX.pent(H, r + 24, n * 2 + 1), 0.26, 0.85, { dest: amp, bright: 0.75 });   // la frase sale a ogni colpo
    },
    jump(A, H, t) { CSX.noise(A, t, 0.26, 'bandpass', 3800, 1.4, 3, 500); },               // plettro strisciato sulle corde
    hurt(A, H, t) { CSX.vox(A, t, mtof(H.root + 22), mtof(H.root + 16), 0.2, 'u', 0.45); },
    special(A, H, t) { const amp = CSX.amp(A, 'lead'); for (let i = 0; i < 8; i++) CSX.string(A, t + i * 0.055, CSX.pent(H, H.root + 24, 3 + i), i === 7 ? 0.5 : 0.09, 0.8, { dest: amp, bright: 0.8, bend: i === 7 ? 2 : 0, vib: i === 7 }); },
    die(A, H, t) { const amp = CSX.amp(A, 'lead'); CSX.string(A, t, H.root + 24, 1.1, 0.8, { dest: amp, dive: -19 }); CSX.vox(A, t + 0.05, mtof(H.root + 24), mtof(H.root + 10), 0.7, 'o', 0.35); },
  },
  danny: {   // chitarra ritmica: accordi
    swing(A, H, t, o) { CSX.noise(A, t, 0.05, 'bandpass', 1800, 0.9, 1.4); CSX.noise(A, t, 0.03, 'highpass', 3000, 0.4); if (o.mv && o.mv.sfx === 'swingBig') CSX.noise(A, t + 0.03, 0.1, 'bandpass', 900, 0.7, 1.1); },
    hit(A, H, t, o) {
      const n = (o.mv.note || 0) + o.step;
      CSX.thump(A, t, o.big);
      if (o.big) { CSX.strum(A, t, H, 1, 0.9, 0.75, { gap: 0.014, lvl: 1.3 }); return; }        // accordo lasciato suonare
      if (n === 3) { CSX.strum(A, t, H, 1, 0.1, 0.8, { mute: true }); return; }         // ginocchiata: pennata stoppata
      CSX.strum(A, t, H, n % 2 ? -1 : 1, 0.28, 0.7);                                    // pennate alternate giù e su
    },
    jump(A, H, t) { CSX.strum(A, t, H, -1, 0.15, 0.45, { lvl: 0.9 }); },
    hurt(A, H, t) { CSX.vox(A, t, mtof(H.root + 26), mtof(H.root + 21), 0.15, 'e', 0.42); },
    special(A, H, t) { for (let i = 0; i < 6; i++) CSX.strum(A, t + i * 0.07, H, i % 2 ? -1 : 1, 0.12, 0.6); },
    die(A, H, t) { CSX.strum(A, t, { root: H.root, minor: true }, 1, 1.2, 0.6, { gap: 0.04 }); CSX.strum(A, t + 0.35, { root: H.root - 1, minor: true }, 1, 1, 0.5, { gap: 0.05 }); },
  },
  mario: {
    swing(A, H, t, o) { CSX.noise(A, t, 0.16, 'lowpass', 420, 2.2); CSX.noise(A, t, 0.1, 'bandpass', 900, 0.5, 1); if (o.mv && o.mv.snd === 'slap') CSX.noise(A, t, 0.02, 'highpass', 3000, 0.5); },
    hit(A, H, t, o) {
      const r = H.root, n = (o.mv.note || 0) + o.step;
      CSX.thump(A, t, o.big);
      if (o.mv.snd === 'slap') { CSX.bassNote(A, t, r, 0.22, 0.55, o.step ? 'pop' : 'slap'); return; }
      if (o.big) { CSX.bassNote(A, t, r + 12, 0.45, 0.6, '', r); return; }              // scivolata d'ottava verso la radice
      CSX.bassNote(A, t, r + [0, 7, 12, 7][n % 4], 0.22, 0.55);
    },
    jump(A, H, t) { CSX.bassNote(A, t, H.root, 0.18, 0.4, '', H.root + 7); },
    hurt(A, H, t) { CSX.vox(A, t, mtof(H.root + 24), mtof(H.root + 19), 0.18, 'o', 0.42); },
    special(A, H, t) { CSX.bassNote(A, t, H.root + 12, 0.5, 0.5, '', H.root - 5); },
    die(A, H, t) { CSX.bassNote(A, t, H.root + 7, 0.9, 0.55, '', H.root - 12); },
  },
  troy: {
    swing(A, H, t, o) { CSX.tone(A, 'square', 1700, 1500, t, 0.02, 0.22); CSX.noise(A, t, 0.03, 'bandpass', 2700, 1.0, 3); CSX.noise(A, t, 0.06, 'bandpass', 1200, 0.5, 1.2); if (o.mv && o.mv.sfx === 'swingBig') CSX.hat(A, t, 1.6); },
    hit(A, H, t, o) {
      const r = H.root, n = (o.mv.note || 0) + o.step;
      CSX.thump(A, t, false);
      if (o.mv.snd === 'kick') { CSX.kick(A, t, 0.7); CSX.tone(A, 'sine', mtof(r), mtof(r) * 0.98, t, 0.3, 0.35); return; }   // cassa accordata sulla radice
      if (o.mv.snd === 'roll') { CSX.snare(A, t, 0.8); return; }
      if (o.big) { CSX.crash(A, t, 1, 0.9); CSX.kick(A, t, 0.9); CSX.snare(A, t + 0.01, 0.8); return; }
      // giro di tamburi accordati: rullante, tom alto (quinta), rullante, tom medio (radice), colpo doppio
      const seq = ['snare', 'tomH', 'snare', 'tomM', 'flam', 'tomF'];
      const d = seq[n % seq.length];
      if (d === 'snare') CSX.snare(A, t, 1.35);
      else if (d === 'flam') { CSX.snare(A, t, 0.6); CSX.snare(A, t + 0.022, 1); }
      else CSX.tom(A, t, mtof(r + (d === 'tomH' ? 19 : d === 'tomM' ? 12 : 7)));
    },
    jump(A, H, t) { CSX.hat(A, t, 2.2, true); },
    hurt(A, H, t) { CSX.vox(A, t, mtof(H.root + 26), mtof(H.root + 22), 0.15, 'a', 0.42); },
    special(A, H, t) { const r = H.root; [19, 16, 12, 7].forEach((k, i) => CSX.tom(A, t + i * 0.07, mtof(r + k), 0.8)); },
    die(A, H, t) { CSX.crash(A, t, 1, 1.2); CSX.kick(A, t); CSX.tom(A, t + 0.1, mtof(H.root + 7)); },
  },
  marvin: {
    swing(A, H, t, o) { CSX.noise(A, t, 0.06, 'lowpass', 500, 1.6); CSX.noise(A, t, 0.08, 'bandpass', 1000, 0.5, 1.1); CSX.tone(A, 'square', 3000, 2600, t, 0.01, 0.1); if (o.mv && o.mv.sfx === 'swingBig') CSX.noise(A, t, 0.14, 'bandpass', 700, 0.8, 1); },
    hit(A, H, t, o) {
      const r = H.root, tr = CSX.third(H), n = (o.mv.note || 0);
      CSX.thump(A, t, o.big);
      if (o.mv.snd === 'organ') { for (const m of [r + 24, r + 24 + tr, r + 31]) SYN.organ(A, t, m, 0.35); return; }
      if (o.mv.snd === 'gliss') { CSX.piano(A, t, [CSX.pent(H, r + 36, o.step * 2), CSX.pent(H, r + 36, o.step * 2 + 1)], 0.18); return; }
      if (o.big) { CSX.piano(A, t, [r + 12, r + 19, r + 24, r + 24 + tr, r + 31], 1.1); return; }   // accordo finale
      CSX.piano(A, t, n % 2 ? [r + 24 + tr, r + 31, r + 36] : [r + 24, r + 24 + tr, r + 31], 0.3);   // accordo e rivolto
    },
    jump(A, H, t) { for (let i = 0; i < 5; i++) SYN.piano(A, t + i * 0.022, CSX.pent(H, H.root + 36, i), 0.12); },
    hurt(A, H, t) { CSX.vox(A, t, mtof(H.root + 24), mtof(H.root + 19), 0.17, 'u', 0.45); },
    special(A, H, t) { for (let i = 0; i < 10; i++) SYN.piano(A, t + i * 0.025, CSX.pent(H, H.root + 48, -i), 0.14); },
    die(A, H, t) { CSX.piano(A, t, [H.root + 12, H.root + 13, H.root + 18, H.root + 19], 1.2); },
  },
};
// volume di ogni evento (tarato con tools/charsfx.js sul colpo generico)
const CHAR_SFX_VOL = { swing: 0.75, hit: 0.9, jump: 0.6, hurt: 0.8, special: 0.9, die: 0.85 };
const CHAR_SFX_GAIN = { arrigo: 1, mike: 1, danny: 1.1, mario: 0.8, troy: 0.95, marvin: 1.35 };

Audio2.charSfx = function (id, ev, o = {}) {
  if (!this.ctx || this.ctx.state !== 'running') return;
  const P = CHAR_SFX[id];
  if (!P || !P[ev]) { if (ev === 'hit') this.sfxPlay(o.big ? 'hitHeavy' : 'hit'); else if (ev === 'swing') this.sfxPlay(o.mv && o.mv.sfx || 'swing'); else if (ev === 'jump') this.sfxPlay('jump'); else if (ev === 'special') this.sfxPlay('special'); return; }
  try {
    const A = CSX.bus((CHAR_SFX_VOL[ev] || 0.8) * (CHAR_SFX_GAIN[id] || 1) * (o.vol || 1)), H = o.H || this.harmony(), t = (o.t ?? this.ctx.currentTime) + 0.004;
    P[ev](A, H, t, Object.assign({ mv: {}, step: 0, big: false }, o));
    setTimeout(() => { try { A.out.disconnect(); } catch (e) { } }, 2500);
  } catch (e) { if (!this._csxErr) { this._csxErr = true; console.error('charSfx', e); } }
};
