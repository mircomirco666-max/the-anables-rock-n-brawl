// ============================================================
// AUDIO: sintesi Web Audio, nessun file. Brani originali composti qui.
// L'AudioContext nasce sospeso finché l'utente non preme un tasto (autoplay).
//
// Musica senza scatti: ogni brano viene prima "registrato" in un
// OfflineAudioContext e poi suonato come buffer in loop, indipendente dal gioco.
// Per registrare in fretta, ogni strumento è a sua volta un campione
// (generato una volta sola con la sintesi qui sotto) suonato a diverse altezze.
// ============================================================
const NOTE = (() => {
  const names = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  return s => { const m = /^([A-G][#b]?)(-?\d)$/.exec(s); return m ? 12 * (+m[2] + 1) + names[m[1]] : null; };
})();
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const OAC_ = () => window.OfflineAudioContext || window.webkitOfflineAudioContext;
const SR = 44100;

// ---------- sintesi degli strumenti (usata solo per creare i campioni) ----------
// "A" è un contesto: A.ctx (AudioContext o Offline), A.out (uscita), A.noiseBuf
const SYN = {
  env(g, t, a, peak, dec, sus = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + dec);
  },
  noise(A, t, dur, type, freq, gainV, q = 0.7) {
    const c = A.ctx, s = c.createBufferSource(); s.buffer = A.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); SYN.env(g, t, 0.002, gainV, dur);
    s.connect(f); f.connect(g); g.connect(A.out);
    s.start(t, 0.1); s.stop(t + dur + 0.05);
  },
  osc(A, type, f, t, dur, peak, a = 0.004, sus = 0.0001, dest = null) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    SYN.env(g, t, a, peak, dur, sus);
    o.connect(g); g.connect(dest || A.out); o.start(t); o.stop(t + dur + a + 0.05);
    return o;
  },
  kick(A, t) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    SYN.env(g, t, 0.003, 0.95, 0.2); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 0.25);
  },
  kick808(A, t) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
    SYN.env(g, t, 0.003, 1, 0.75); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 0.9);
    SYN.noise(A, t, 0.02, 'lowpass', 2000, 0.3);
  },
  snare(A, t) {
    SYN.noise(A, t, 0.16, 'highpass', 1300, 0.5);
    const c = A.ctx, o = c.createOscillator(), og = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    SYN.env(og, t, 0.002, 0.35, 0.09); o.connect(og); og.connect(A.out); o.start(t); o.stop(t + 0.15);
  },
  rim(A, t) { SYN.noise(A, t, 0.03, 'bandpass', 2600, 0.6, 3); SYN.osc(A, 'square', 1700, t, 0.03, 0.12); },
  clap(A, t) { for (let i = 0; i < 3; i++) SYN.noise(A, t + i * 0.012, 0.09, 'bandpass', 1500, 0.35, 1.2); },
  hat(A, t, open) { SYN.noise(A, t, open ? 0.22 : 0.045, 'highpass', 7500, 0.16); },
  shaker(A, t) { SYN.noise(A, t, 0.06, 'bandpass', 6000, 0.12, 1.5); },
  crash(A, t) { SYN.noise(A, t, 1.1, 'highpass', 4500, 0.22); },
  // basso elettrico (dente di sega filtrato)
  bass(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(320, t + dur); f.Q.value = 3;
    SYN.env(g, t, 0.005, 0.5, dur * 0.95, 0.14);
    o.connect(f); f.connect(g); g.connect(A.out); o.start(t); o.stop(t + dur + 0.06);
  },
  // contrabbasso pizzicato (jazz, country)
  upright(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 2;
    f.type = 'lowpass'; f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(380, t + 0.25);
    const g2 = c.createGain(); g2.gain.value = 0.25;
    SYN.env(g, t, 0.004, 0.75, dur, 0.0001);
    o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(A.out); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  },
  // sub dell'hip hop
  sub(A, t, m, dur) { SYN.osc(A, 'sine', mtof(m), t, dur, 0.9, 0.01, 0.5); },
  // chitarra distorta: accordo di sega leggermente scordate, saturate e filtrate
  guitar(A, t, notes, dur, mute, clean) {
    const c = A.ctx, mixG = c.createGain(), ws = c.createWaveShaper(), f = c.createBiquadFilter(), g = c.createGain();
    ws.curve = Audio2.distCurve; f.type = 'lowpass'; f.frequency.value = clean ? 2600 : mute ? 1500 : 3200; f.Q.value = 0.8;
    mixG.gain.value = clean ? 0.9 : 0.4;
    for (const m of notes) for (const det of (clean ? [0] : [-7, 7])) {
      const o = c.createOscillator(); o.type = clean ? 'triangle' : 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(mixG); o.start(t); o.stop(t + dur + 0.08);
    }
    const d = mute ? Math.min(dur, 0.1) : dur;
    SYN.env(g, t, 0.004, clean ? 0.3 : 0.2, d, mute ? 0.0001 : (clean ? 0.02 : 0.06));
    if (clean) mixG.connect(f); else { mixG.connect(ws); ws.connect(f); }
    f.connect(g); g.connect(A.out);
  },
  // banjo / chitarra pizzicata
  pluck(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'square'; o2.type = 'sawtooth'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 1.003;
    f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.18); f.Q.value = 2;
    SYN.env(g, t, 0.002, 0.22, Math.min(dur, 0.5));
    o.connect(f); o2.connect(f); f.connect(g); g.connect(A.out); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  },
  lead(A, t, m, dur, trem, wave, tremHz) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = wave; o.frequency.value = mtof(m);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 7;
    lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.1);
    f.type = 'lowpass'; f.frequency.value = 3400;
    SYN.env(g, t, 0.006, 0.14, Math.max(0.05, dur * 0.9), 0.05);
    if (trem) {
      const tl = c.createOscillator(), tg = c.createGain(); tl.type = 'square'; tl.frequency.value = tremHz; tg.gain.value = 0.06;
      tl.connect(tg); tg.connect(g.gain); tl.start(t); tl.stop(t + dur + 0.05);
    }
    o.connect(f); f.connect(g); g.connect(A.out); o.start(t); o.stop(t + dur + 0.1);
  },
  piano(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 2;
    SYN.env(g, t, 0.003, 0.11, Math.min(0.9, dur * 1.3));
    o.connect(g); o2.connect(g); g.connect(A.out); o.start(t); o2.start(t); o.stop(t + dur + 0.7); o2.stop(t + dur + 0.7);
  },
  organ(A, t, m, dur) {
    const c = A.ctx, g = c.createGain();
    SYN.env(g, t, 0.01, 0.07, 0.05, 0.06);
    for (const [mul, v] of [[1, 1], [2, 0.6], [3, 0.35], [4, 0.25], [0.5, 0.5]]) { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(m) * mul; og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.1); }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6.2; lg.gain.value = 0.015; lfo.connect(lg); lg.connect(g.gain); lfo.start(t); lfo.stop(t + dur + 0.1);
    g.connect(A.out);
  },
  // archi / pad: denti di sega lenti e morbidi
  strings(A, t, m, dur) {
    const c = A.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.25); g.gain.setValueAtTime(0.06, t + dur);
    for (const det of [-9, 0, 9]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.1); }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5; lg.gain.value = 0.006; lfo.connect(lg); lg.connect(g.gain); lfo.start(t); lfo.stop(t + dur);
    f.connect(g); g.connect(A.out);
  },
  // coro "aah" (opera): formanti su un'onda ricca
  choir(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), mixG = c.createGain();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m); o2.detune.value = 12;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune);
    o.connect(mixG); o2.connect(mixG); mixG.gain.value = 0.5;
    for (const [fr, q, v] of [[730, 8, 1], [1090, 9, 0.5], [2440, 10, 0.25]]) { const bp = c.createBiquadFilter(), bg = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q; bg.gain.value = v; mixG.connect(bp); bp.connect(bg); bg.connect(g); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.2); g.gain.setValueAtTime(0.5, t + dur);
    g.connect(A.out); o.start(t); o2.start(t); lfo.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
  },
  brass(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m); o2.detune.value = 6;
    f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2600, t + 0.06); f.frequency.exponentialRampToValueAtTime(1400, t + 0.3); f.Q.value = 1.5;
    SYN.env(g, t, 0.03, 0.12, Math.max(0.1, dur), 0.07);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(A.out); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  },
  bell(A, t, m, dur) {
    const c = A.ctx, g = c.createGain(); SYN.env(g, t, 0.002, 0.12, Math.min(1.6, dur + 0.8));
    for (const [mul, v] of [[1, 1], [2.76, 0.5], [5.4, 0.25]]) { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(m) * mul; og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 1); }
    g.connect(A.out);
  },
  // synth techno: dente di sega con filtro risonante
  acid(A, t, m, dur) {
    const c = A.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.Q.value = 12; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(300, t + Math.max(0.08, dur));
    SYN.env(g, t, 0.003, 0.22, Math.max(0.06, dur), 0.0001);
    o.connect(f); f.connect(g); g.connect(A.out); o.start(t); o.stop(t + dur + 0.08);
  },
};

const Audio2 = {
  ctx: null, master: null, music: null, sfx: null, noiseBuf: null, distCurve: null,
  musicVol: 0.7, sfxVol: 0.8, unlocked: false,
  songName: null, tempoMul: 1, cache: new Map(), pending: new Map(), cur: null, want: null,
  samples: new Map(), smpPending: new Map(),

  init() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      this.master.connect(comp); comp.connect(c.destination);
      this.music = c.createGain(); this.music.gain.value = this.musicVol * 0.9; this.music.connect(this.master);
      this.sfx = c.createGain(); this.sfx.gain.value = this.sfxVol * 1.4; this.sfx.connect(this.master);
      this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const nd = this.noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const n = 512, curve = new Float32Array(n), k = 60;
      for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
      this.distCurve = curve;
    } catch (e) { this.ctx = null; }
  },
  unlock() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state !== 'running') { this.ctx.resume().catch(() => { }); }
    this.unlocked = true;
  },
  setVolumes(m, s) {
    this.musicVol = m; this.sfxVol = s;
    if (this.music) this.music.gain.value = m * 0.9;
    if (this.sfx) this.sfx.gain.value = s * 1.4;
  },
  _env(g, t, a, peak, dec, sus = 0.0001) {
    g.gain.cancelScheduledValues(t);
    SYN.env(g, t, a, peak, dec, sus);
  },
  _noise(t, dur, type, freq, gainV, dest, q = 0.7) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); this._env(g, t, 0.002, gainV, dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    return g;
  },

  // ---------- brani ----------
  play(name, force = false) {
    if (!this.ctx) return;
    if (this.songName === name && !force) return;
    this.stop();
    const s = SONGS[name]; if (!s) return;
    this.songName = name; this.want = name; this.tempoMul = 1;
    this.getSong(name).then(buf => {
      if (!buf || this.want !== name) return;
      const c = this.ctx, src = c.createBufferSource(), g = c.createGain();
      src.buffer = buf; src.loop = !s.once;
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(1, c.currentTime + 0.05);
      src.connect(g); g.connect(this.music);
      src.start(c.currentTime + 0.02);
      this._pos = { t0: c.currentTime + 0.02, pos0: 0, rate: 1, len: buf.duration, once: !!s.once, name };
      if (s.once) src.onended = () => { if (this.cur && this.cur.src === src) { this.cur = null; const nx = s.next; this.songName = null; if (nx) this.play(nx); } };
      this.cur = { src, g, name };
      this.setTempo(this.tempoMul);
    });
  },
  stop() {
    this.want = null; this.songName = null;
    const cu = this.cur; this.cur = null;
    if (cu && this.ctx) {
      const t = this.ctx.currentTime;
      try { cu.src.onended = null; cu.g.gain.cancelScheduledValues(t); cu.g.gain.setValueAtTime(Math.max(0.0001, cu.g.gain.value), t); cu.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); cu.src.stop(t + 0.1); } catch (e) { }
    }
  },
  setTempo(m) {
    if (this._pos && this.ctx) { const p = this._pos; p.pos0 = this.songPos(); p.t0 = this.ctx.currentTime; p.rate = m; }
    this.tempoMul = m; if (this.cur) this.cur.src.playbackRate.value = m;
  },
  // secondi dall'inizio del giro del brano che sta suonando
  songPos() {
    const p = this._pos; if (!p || !this.ctx) return 0;
    const x = p.pos0 + Math.max(0, this.ctx.currentTime - p.t0) * p.rate;
    return p.once ? x : x % p.len;
  },
  // accordo del momento { root (MIDI, registro basso), minor }: i colpi dei musicisti suonano in tonalità
  harmony() {
    const p = this._pos, s = p && SONGS[p.name];
    if (s && s._harm && s._harm.length) {
      const sd = 60 / s.bpm / 4, step = Math.floor(this.songPos() / sd), H = s._harm[Math.min(s._harm.length - 1, step >> 2)];
      if (H) { this._lastHarm = H; return H; }
    }
    return this._lastHarm || { root: 40, minor: true };
  },
  // prepara in sottofondo i brani che serviranno a breve
  prerender(names) { if (!this.ctx) return; for (const n of names) if (SONGS[n]) this.getSong(n); },
  getSong(name) {
    if (this.cache.has(name)) { const b = this.cache.get(name); this.cache.delete(name); this.cache.set(name, b); return Promise.resolve(b); }
    if (this.pending.has(name)) return this.pending.get(name);
    // un brano alla volta, per non intasare
    const prev = this._queue || Promise.resolve();
    const pr = prev.then(() => this._render(name)).then(buf => {
      this.pending.delete(name);
      if (buf) { this.cache.set(name, buf); while (this.cache.size > 5) this.cache.delete(this.cache.keys().next().value); }
      return buf;
    }).catch(e => { this.pending.delete(name); console.error('audio render', e); return null; });
    this._queue = pr.catch(() => null);
    this.pending.set(name, pr);
    return pr;
  },

  // 1) le note del brano vengono raccolte come "voci" (campione, istante, altezza, durata)
  _collect(s) {
    const V = [], sd = 60 / s.bpm / 4, tremHz = Math.round(1 / sd * 10) / 10;
    const oct = m => 12 * Math.floor(m / 12) + 6;
    const pitched = (kind, m, extra = '') => { const b = oct(m); return { key: kind + extra + ':' + b, rate: Math.pow(2, (m - b) / 12) }; };
    const add = (o) => V.push(o);
    const R = {
      kick: (t, v = 1) => add({ key: 'kick', t, gain: v }),
      kick808: (t, v = 1) => add({ key: 'kick808', t, gain: v }),
      snare: (t, v = 1) => add({ key: 'snare', t, gain: v, rev: 1 }),
      rim: (t, v = 1) => add({ key: 'rim', t, gain: v }),
      clap: (t, v = 1) => add({ key: 'clap', t, gain: v, rev: 0.6 }),
      hat: (t, v = 1, open = false) => add({ key: open ? 'hatO' : 'hat', t, gain: v }),
      shaker: (t, v = 1) => add({ key: 'shaker', t, gain: v }),
      crash: (t, v = 1) => add({ key: 'crash', t, gain: v, rev: 1 }),
      bass: (t, m, dur, v = 1) => add(Object.assign(pitched('bass', m), { t, gain: v, cut: t + dur, rel: 0.04 })),
      upright: (t, m, dur, v = 1) => add(Object.assign(pitched('upright', m), { t, gain: v, cut: t + dur + 0.05, rel: 0.06 })),
      sub: (t, m, dur, v = 1) => add(Object.assign(pitched('sub', m), { t, gain: v, cut: t + dur, rel: 0.05 })),
      guitar: (t, notes, dur, v = 1, mute = false, clean = false) => { const iv = notes.map(n => n - notes[0]).join('.'); add(Object.assign(pitched('gtr', notes[0], '/' + iv + (mute ? 'm' : 'o') + (clean ? 'c' : '')), { t, gain: v, cut: t + (mute ? Math.min(dur, 0.14) : dur), rel: 0.07, rev: mute ? 0 : 1 })); },
      pluck: (t, m, dur, v = 1) => add(Object.assign(pitched('pluck', m), { t, gain: v, cut: t + Math.min(dur, 0.6), rel: 0.05 })),
      lead: (t, m, dur, v = 1, trem = false, wave = 'square') => add(Object.assign(pitched('lead', m, '/' + wave + (trem ? tremHz : 0)), { t, gain: v, cut: t + dur, rel: 0.08, rev: 1 })),
      piano: (t, notes, dur, v = 1) => { for (const m of notes) add(Object.assign(pitched('piano', m), { t, gain: v, cut: t + dur + 0.6, rel: 0.1 })); },
      organ: (t, notes, dur, v = 1) => { for (const m of notes) add(Object.assign(pitched('organ', m), { t, gain: v, cut: t + dur, rel: 0.06, rev: 0.6 })); },
      strings: (t, notes, dur, v = 1) => { for (const m of notes) add(Object.assign(pitched('strings', m), { t, gain: v, cut: t + dur, rel: 0.3, rev: 1 })); },
      choir: (t, notes, dur, v = 1) => { for (const m of notes) add(Object.assign(pitched('choir', m), { t, gain: v, cut: t + dur, rel: 0.25, rev: 1 })); },
      brass: (t, notes, dur, v = 1) => { for (const m of notes) add(Object.assign(pitched('brass', m), { t, gain: v, cut: t + dur, rel: 0.08, rev: 0.6 })); },
      bell: (t, m, dur, v = 1) => add(Object.assign(pitched('bell', m), { t, gain: v, cut: t + dur + 0.8, rel: 0.3, rev: 1 })),
      acid: (t, m, dur, v = 1) => add(Object.assign(pitched('acid', m), { t, gain: v, cut: t + dur, rel: 0.04 })),
      blip: (t, f, dur, v = 1) => add({ key: 'blip' + Math.round(f), t, gain: v }),
    };
    // armonia: per ogni tempo (4 passi), nota più grave del basso e peso delle classi di altezza
    const beats = [], stepOf = t => Math.floor((t - 0.004) / sd + 0.02);
    const rec = (t, m, bass) => {
      if (!Number.isFinite(m)) return;
      const b = Math.max(0, stepOf(t) >> 2), B = beats[b] || (beats[b] = { bass: null, bt: 1e9, pc: new Array(12).fill(0) });
      if (bass && t < B.bt) { B.bt = t; B.bass = m; }
      B.pc[((m % 12) + 12) % 12] += bass ? 2 : 1;
    };
    const wrap = (k, bass, many) => { const f = R[k]; R[k] = (t, m, ...a) => { if (many) for (const x of m) rec(t, x, bass); else rec(t, m, bass); return f(t, m, ...a); }; };
    for (const k of ['bass', 'upright', 'sub']) wrap(k, true, false);
    for (const k of ['pluck', 'lead', 'bell', 'acid']) wrap(k, false, false);
    for (const k of ['guitar', 'piano', 'organ', 'strings', 'choir', 'brass']) wrap(k, false, true);
    const done = () => {
      const n = Math.ceil(s.len / 4);
      // battute: dagli accordi scritti del brano (prog) se ci sono, altrimenti blocchi di 16 passi
      const barBeats = s.prog ? Math.max(1, Math.round(s.len / s.prog.length / 4)) : 4;
      const nb = Math.ceil(n / barBeats), bars = [];
      let prev = null;
      for (let b = 0; b < nb; b++) {
        const pc = new Array(12).fill(0); let bass = null, bt = 1e9;
        for (let i = b * barBeats; i < Math.min(n, (b + 1) * barBeats); i++) { const B = beats[i]; if (!B) continue; B.pc.forEach((v, k) => pc[k] += v); if (B.bass !== null && B.bt < bt) { bt = B.bt; bass = B.bass; } }
        let r = null, symMinor = null;
        if (s.prog) { const ch = chordOf(s.prog[b % s.prog.length]); r = ch.r; const q = s.prog[b % s.prog.length].replace(/^[A-G][#b]?/, ''); if (q !== '5') symMinor = ch.minor; }
        else if (bass !== null) r = bass;
        else if (pc.some(v => v)) { let best = -1; pc.forEach((v, k) => { if (v > best) { best = v; r = 40 + ((k - 4 + 12) % 12); } }); }
        if (r === null) r = prev ? prev.root : 40;
        while (r < 36) r += 12; while (r > 47) r -= 12;
        // maggiore o minore: decide ciò che suona davvero (la terza più presente), poi il nome dell'accordo
        const q = ((r % 12) + 12) % 12, m3 = pc[(q + 3) % 12], M3 = pc[(q + 4) % 12];
        const minor = m3 !== M3 ? m3 > M3 : (symMinor ?? (prev ? prev.minor : true));
        bars.push(prev = { root: r, minor });
      }
      s._harm = new Array(n);
      for (let i = 0; i < n; i++) s._harm[i] = bars[Math.min(bars.length - 1, Math.floor(i / barBeats))];
    };
    return { V, R, done };
  },
  // 2) ogni campione serve una volta: lo generiamo con la sintesi in un breve OfflineAudioContext
  _sampleLen(key) {
    const k = key.split(/[:/]/)[0];
    return { kick: 0.3, kick808: 1, snare: 0.25, rim: 0.08, clap: 0.15, hat: 0.08, hatO: 0.3, shaker: 0.1, crash: 1.2, bass: 2.2, upright: 1.6, sub: 2.5, gtr: 2.6, pluck: 0.8, lead: 2.6, piano: 1.8, organ: 2.6, strings: 4, choir: 4, brass: 2.4, bell: 2.2, acid: 0.6 }[k] || (k.startsWith('blip') ? 0.12 : 1);
  },
  async _sample(key) {
    if (this.samples.has(key)) return this.samples.get(key);
    const OAC = OAC_(); if (!OAC) return null;
    const len = this._sampleLen(key), oc = new OAC(1, Math.ceil((len + 0.05) * SR), SR);
    const A = { ctx: oc, out: oc.destination };
    A.noiseBuf = oc.createBuffer(1, SR, SR); const nd = A.noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const [head, base] = key.split(':'), m = +base, t = 0.001;
    const [kind, opt] = head.split('/');
    const hold = len - 0.1;
    if (kind === 'kick') SYN.kick(A, t); else if (kind === 'kick808') SYN.kick808(A, t); else if (kind === 'snare') SYN.snare(A, t);
    else if (kind === 'rim') SYN.rim(A, t); else if (kind === 'clap') SYN.clap(A, t); else if (kind === 'hat') SYN.hat(A, t, false); else if (kind === 'hatO') SYN.hat(A, t, true);
    else if (kind === 'shaker') SYN.shaker(A, t); else if (kind === 'crash') SYN.crash(A, t);
    else if (kind === 'bass') SYN.bass(A, t, m, hold); else if (kind === 'upright') SYN.upright(A, t, m, hold); else if (kind === 'sub') SYN.sub(A, t, m, hold);
    else if (kind === 'gtr') { const mute = opt.includes('m'), clean = opt.includes('c'); const iv = opt.replace(/[moc]/g, '').split('.').map(Number); SYN.guitar(A, t, iv.map(i => m + i), mute ? 0.14 : hold, mute, clean); }
    else if (kind === 'pluck') SYN.pluck(A, t, m, hold);
    else if (kind === 'lead') { const wave = opt.replace(/[\d.]+$/, ''), hz = parseFloat(opt.slice(wave.length)) || 0; SYN.lead(A, t, m, hold, hz > 0, wave, hz); }
    else if (kind === 'piano') SYN.piano(A, t, m, 0.8); else if (kind === 'organ') SYN.organ(A, t, m, hold);
    else if (kind === 'strings') SYN.strings(A, t, m, hold); else if (kind === 'choir') SYN.choir(A, t, m, hold);
    else if (kind === 'brass') SYN.brass(A, t, m, hold); else if (kind === 'bell') SYN.bell(A, t, m, 1.2); else if (kind === 'acid') SYN.acid(A, t, m, 0.4);
    else if (kind.startsWith('blip')) { const f = +kind.slice(4); SYN.osc(A, 'square', f, t, 0.05, 0.3); SYN.noise(A, t, 0.03, 'highpass', 3000, 0.4); }
    const buf = await new Promise((res, rej) => { oc.oncomplete = e => res(e.renderedBuffer); const p = oc.startRendering(); if (p && p.then) p.then(res, rej); });
    this.samples.set(key, buf);
    return buf;
  },
  // 3) il brano: un OfflineAudioContext con una sorgente per voce, poi l'anello senza giunte
  async _render(name) {
    const OAC = OAC_();
    if (!OAC) return null;
    const s = SONGS[name];
    const sd = 60 / s.bpm / 4, loop = s.len * sd, tail = 1.8;
    const { V, R, done } = this._collect(s);
    for (let st = 0; st < s.len; st++) { try { s.gen(st, st * sd + 0.004, sd, R); } catch (e) { if (!this._errLogged) { this._errLogged = true; console.error('audio', e); } } }
    done();
    const keys = [...new Set(V.map(v => v.key))];
    for (const k of keys) { if (!this.samples.has(k)) { await this._sample(k); await new Promise(r => setTimeout(r, 0)); } }
    const total = Math.ceil((loop + tail) * SR);
    const oc = new OAC(1, total, SR);
    const comp = oc.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5;
    const bus = oc.createGain(); bus.gain.value = s.gain || 0.2; bus.connect(comp); comp.connect(oc.destination);
    const rev = oc.createConvolver(); rev.buffer = this._ir(oc); const rg = oc.createGain(); rg.gain.value = 0.22; rev.connect(rg); rg.connect(bus);
    let n = 0;
    for (const v of V) {
      const buf = this.samples.get(v.key); if (!buf) continue;
      const src = oc.createBufferSource(), g = oc.createGain();
      src.buffer = buf; if (v.rate && v.rate !== 1) src.playbackRate.value = v.rate;
      g.gain.setValueAtTime(v.gain, v.t);
      src.connect(g); g.connect(bus); if (v.rev) g.connect(rev);
      src.start(v.t);
      if (v.cut) { g.gain.setValueAtTime(v.gain, v.cut); g.gain.exponentialRampToValueAtTime(0.0001, v.cut + v.rel); src.stop(v.cut + v.rel + 0.01); }
      if (++n % 400 === 0) await new Promise(r => setTimeout(r, 0));
    }
    const buf = await new Promise((res, rej) => { oc.oncomplete = e => res(e.renderedBuffer); const p = oc.startRendering(); if (p && p.then) p.then(res, rej); });
    if (s.once) return buf;
    // anello senza giunte: la coda (riverbero, note lunghe) si somma all'inizio
    const N = Math.round(loop * SR), out = this.ctx.createBuffer(1, N, SR), d = buf.getChannelData(0), o = out.getChannelData(0);
    o.set(d.subarray(0, N));
    for (let i = 0; i < total - N && i < N; i++) o[i] += d[N + i];
    return out;
  },
  _ir(c) {
    const len = Math.floor(c.sampleRate * 1.1), ir = c.createBuffer(1, len, c.sampleRate), d = ir.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i % 1200 < 600 ? 1 : 0.7);
    return ir;
  },

  // ---------- effetti sonori ----------
  sfxPlay(name, v = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, t = c.currentTime, out = this.sfx;
    const tone = (type, f0, f1, dur, gain, delay = 0) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type;
      o.frequency.setValueAtTime(f0, t + delay); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + delay + dur);
      this._env(g, t + delay, 0.003, gain * v, dur); o.connect(g); g.connect(out); o.start(t + delay); o.stop(t + delay + dur + 0.05);
    };
    const nz = (type, f, dur, gain, delay = 0, q = 0.8) => this._noise(t + delay, dur, type, f, gain * v, out, q);
    switch (name) {
      case 'hit': nz('bandpass', 1800, 0.07, 0.9, 0, 1.0); tone('square', 220, 70, 0.07, 0.4); tone('sine', 140, 60, 0.08, 0.5); break;
      case 'hitHeavy': nz('lowpass', 1200, 0.16, 0.7); tone('sawtooth', 160, 40, 0.18, 0.4); tone('sine', 90, 35, 0.2, 0.6); break;
      case 'swing': nz('bandpass', 1100, 0.09, 0.9, 0, 1.1); break;
      case 'swingBig': nz('bandpass', 700, 0.16, 1.0, 0, 1.0); break;
      case 'jump': tone('square', 260, 520, 0.09, 0.12); break;
      case 'land': tone('sine', 120, 50, 0.08, 0.35); break;
      case 'fall': tone('sine', 110, 40, 0.14, 0.6); nz('lowpass', 500, 0.14, 0.4); break;
      case 'hurt': tone('sawtooth', 300, 140, 0.15, 0.25); break;
      case 'ko': tone('square', 600, 90, 0.35, 0.18); break;
      case 'food': [0, 4, 7, 12].forEach((n, i) => tone('square', mtof(72 + n), mtof(72 + n), 0.06, 0.13, i * 0.05)); break;
      case 'coin': tone('square', 988, 988, 0.05, 0.13); tone('square', 1319, 1319, 0.16, 0.13, 0.05); break;
      case 'power': [0, 7, 12, 19, 24].forEach((n, i) => tone('sawtooth', mtof(60 + n), mtof(60 + n), 0.08, 0.1, i * 0.04)); break;
      case 'oneup': [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone('square', mtof(76 + n), mtof(76 + n), 0.06, 0.11, i * 0.06)); break;
      case 'break': nz('highpass', 3000, 0.25, 0.4); nz('bandpass', 800, 0.12, 0.4); break;
      case 'metal': tone('square', 1400, 1100, 0.2, 0.08); tone('square', 2100, 1700, 0.25, 0.06); nz('highpass', 5000, 0.2, 0.2); break;
      case 'grab': tone('square', 180, 240, 0.05, 0.15); break;
      case 'throw': nz('bandpass', 500, 0.2, 0.35, 0, 1); break;
      case 'special': SYN.guitar({ ctx: c, out: out, noiseBuf: this.noiseBuf }, t, [52, 59, 64], 0.6, false, false); nz('highpass', 4000, 0.5, 0.25); break;
      case 'scream': tone('sawtooth', 520, 380, 0.7, 0.22); tone('sawtooth', 780, 560, 0.7, 0.12); break;
      case 'zap': for (let i = 0; i < 4; i++) { tone('sawtooth', 1800 - i * 200, 120, 0.09, 0.15, i * 0.05); nz('highpass', 3000, 0.05, 0.3, i * 0.05); } break;
      case 'poof': nz('lowpass', 900, 0.3, 0.5); tone('sine', 400, 900, 0.2, 0.15); break;
      case 'drumroll': for (let i = 0; i < 10; i++) nz('highpass', 1400, 0.05, 0.35, i * 0.035); break;
      case 'piano': [36, 40, 43, 47, 48].forEach(n => tone('triangle', mtof(n), mtof(n) * 0.98, 0.9, 0.22)); nz('lowpass', 600, 0.5, 0.6); break;
      case 'vinyl': tone('square', 900, 300, 0.12, 0.08); break;
      case 'beamWarn': tone('sine', 880, 880, 0.08, 0.1); break;
      case 'beam': tone('sawtooth', 1200, 300, 0.3, 0.15); nz('highpass', 2000, 0.3, 0.2); break;
      case 'spin': nz('bandpass', 1200, 0.3, 0.3, 0, 3); tone('triangle', 400, 800, 0.3, 0.1); break;
      case 'menu': tone('square', 660, 660, 0.04, 0.1); break;
      case 'confirm': tone('square', 660, 660, 0.05, 0.12); tone('square', 990, 990, 0.1, 0.12, 0.05); break;
      case 'back': tone('square', 440, 330, 0.08, 0.1); break;
      case 'go': tone('square', 880, 880, 0.06, 0.1); tone('square', 880, 880, 0.06, 0.1, 0.12); break;
      case 'count': tone('square', 1200, 1200, 0.03, 0.2); nz('highpass', 3000, 0.03, 0.3); break;
      case 'boss': tone('sawtooth', 70, 50, 0.9, 0.4); tone('sawtooth', 105, 75, 0.9, 0.25); break;
      case 'team': [0, 7, 12].forEach((n, i) => tone('sawtooth', mtof(52 + n), mtof(52 + n), 0.5, 0.12, i * 0.02)); break;
      case 'pause': tone('square', 520, 520, 0.05, 0.1); break;
      case 'pickup': tone('square', 520, 520, 0.04, 0.12); tone('square', 780, 780, 0.06, 0.12, 0.04); nz('highpass', 4000, 0.06, 0.15, 0.02); break;
      // ---- armi pazze, orrore e boss ----
      case 'saw': for (let i = 0; i < 6; i++) tone('sawtooth', 150 + (i % 2) * 40, 140 + (i % 2) * 40, 0.05, 0.1, i * 0.045); nz('bandpass', 2400, 0.28, 0.25, 0, 2); break;
      case 'water': nz('bandpass', 2600, 0.2, 0.4, 0, 1.6); tone('sine', 900, 1500, 0.08, 0.08); break;
      case 'spray': nz('highpass', 4500, 0.35, 0.35); break;
      case 'groan': tone('sawtooth', 110, 80, 0.7, 0.2); tone('sawtooth', 116, 84, 0.7, 0.14); nz('lowpass', 400, 0.5, 0.25); break;
      case 'flame': nz('lowpass', 900, 0.45, 0.8); nz('bandpass', 300, 0.4, 0.4, 0.02, 0.7); break;
      case 'explode': nz('lowpass', 700, 0.6, 1.0); tone('sine', 120, 30, 0.5, 0.7); tone('sawtooth', 80, 30, 0.4, 0.25); break;
      case 'boom': nz('lowpass', 500, 0.4, 0.8); tone('sine', 90, 30, 0.35, 0.7); break;
      case 'shot': nz('bandpass', 2200, 0.06, 1.0, 0, 0.9); tone('square', 700, 90, 0.07, 0.25); nz('lowpass', 800, 0.18, 0.4, 0.02); break;
      case 'flash': tone('sine', 2400, 4000, 0.06, 0.08); nz('highpass', 6000, 0.12, 0.3, 0.04); break;
      case 'bat': tone('square', 2600, 1900, 0.04, 0.05); tone('square', 2900, 2200, 0.04, 0.04, 0.06); break;
      case 'laser': tone('sawtooth', 2200, 180, 0.32, 0.16); tone('square', 1100, 90, 0.32, 0.06); break;
      case 'squeak': tone('square', 1400, 2100, 0.07, 0.12); tone('square', 2100, 1300, 0.08, 0.1, 0.07); break;
      case 'splat': nz('lowpass', 700, 0.18, 0.9); tone('sine', 220, 60, 0.12, 0.3); break;
      case 'laugh': for (let i = 0; i < 5; i++) tone('sawtooth', 300 - i * 18, 220 - i * 18, 0.1, 0.16, i * 0.13); break;
      case 'gong': tone('sine', 110, 104, 1.4, 0.35); tone('sine', 166, 160, 1.2, 0.2); tone('triangle', 233, 220, 1.0, 0.12); nz('bandpass', 1500, 0.6, 0.15); break;
      case 'drop': tone('sine', 220, 30, 0.9, 0.7); tone('sawtooth', 110, 28, 0.9, 0.2); break;
      case 'fart': for (let i = 0; i < 7; i++) tone('sawtooth', 95 - i * 4 + (i % 2) * 14, 80 - i * 4, 0.07, 0.3, i * 0.06); nz('lowpass', 260, 0.5, 0.6); break;
      case 'burp': for (let i = 0; i < 5; i++) tone('sawtooth', 150 - i * 10 + (i % 2) * 20, 130 - i * 10, 0.09, 0.28, i * 0.08); nz('bandpass', 300, 0.45, 0.4, 0, 1.2); break;
      case 'spit': nz('bandpass', 1800, 0.08, 0.6, 0, 2); tone('square', 300, 120, 0.06, 0.12); break;
      case 'confetti': nz('lowpass', 1600, 0.12, 0.8); tone('sine', 300, 90, 0.12, 0.4); nz('highpass', 6000, 0.35, 0.18, 0.04); break;
    }
  },
};


// ---------- Brani originali ----------
function parseLine(str) {
  // note per ottavi: "A4 . - C5" ('-' = tieni, '.' = pausa)
  const toks = str.trim().split(/\s+|\|/).filter(Boolean);
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === '-' || t === '.') { out.push(null); continue; }
    let len = 1; while (toks[i + len] === '-') len++;
    out.push({ m: NOTE(t), len });
  }
  return out;
}

const TITLE_LEAD = parseLine(`
A4 C5 D5 D#5 E5 - . A4 | G5 - E5 - C5 D5 C5 A4 | A4 C5 D5 D#5 E5 - G5 E5 | A5 - - - G5 E5 D5 C5 |
D5 - F#5 A5 C6 A5 F#5 D5 | F5 F#5 A5 - C6 - A5 - | A4 C5 D5 D#5 E5 - . A4 | G5 - E5 - C5 D5 C5 A4 |
E5 - G#5 B5 D6 B5 G#5 E5 | D5 - F#5 A5 C6 A5 F#5 D5 | A5 G5 E5 D#5 D5 C5 A4 - | E5 - - - B4 - D5 - `);
const TITLE_CH = ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'];

const L1_LEAD = parseLine(`
E5 - - - G5 - F#5 E5 | D5 - E5 - B4 - - - | C5 - E5 - G5 - E5 C5 | D5 - F#5 - A5 - F#5 D5 |
E5 - - - B5 - A5 G5 | F#5 - G5 - E5 - - - | E5 - D5 C5 B4 - A4 - | B4 - D#5 - F#5 - B5 - |
A5 - G5 - E5 - C5 - | D5 E5 C5 - A4 - - - | B4 - E5 - G5 - B5 - | A5 G5 F#5 - E5 - - - |
G5 - E5 - C5 - E5 G5 | A5 - F#5 - D5 - F#5 A5 | B5 - - - A5 - F#5 - | D#5 - F#5 - B4 - - - `);
const L1_CH = ['E', 'E', 'C', 'D', 'E', 'E', 'C', 'B', 'A', 'A', 'E', 'E', 'C', 'D', 'B', 'B'];
const ROOT = { A: 45, D: 50, E: 40, C: 48, B: 47, G: 43, F: 41 };

const SONGS = {
  title: {
    bpm: 172, len: 12 * 16,
    gen(step, t, sd, A) {
      const bar = Math.floor(step / 16), s = step % 16, ch = TITLE_CH[bar], r = ROOT[ch];
      if (s % 8 === 0) A.kick(t);
      if (s % 8 === 4) A.snare(t);
      if (s % 2 === 0) A.hat(t, s % 4 === 0 ? 1 : 0.6);
      if (bar === 0 && s === 0) A.crash(t);
      if (s % 2 === 0) { const iv = [0, 4, 7, 9, 10, 9, 7, 4][s / 2]; A.bass(t, r - 12 + iv, sd * 1.8); }
      if (s % 2 === 0) { const six = (s % 8) >= 4; A.guitar(t, [r, r + (six ? 9 : 7)], sd * 1.7, 0.75, true); }
      if (s % 2 === 0) { const n = TITLE_LEAD[bar * 8 + s / 2]; if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.9); }
      if (s % 4 === 2) A.piano(t, [r + 12 + 4, r + 12 + 7, r + 12 + 10].map(x => x + (ch === 'A' ? 0 : 0)), sd, 0.7);
    }
  },
  level1: {
    bpm: 160, len: 16 * 16,
    gen(step, t, sd, A) {
      const bar = Math.floor(step / 16), s = step % 16, ch = L1_CH[bar], r = ROOT[ch];
      if (s === 0 || s === 8 || s === 10) A.kick(t);
      if (s === 4 || s === 12) A.snare(t);
      if (s % 2 === 0) A.hat(t, 0.7, s % 4 === 2);
      if ((bar === 0 || bar === 8) && s === 0) A.crash(t);
      if (s % 2 === 0) A.bass(t, r - 12 + (s === 14 ? 12 : 0), sd * 1.6);
      if (s % 2 === 0) A.guitar(t, [r, r + 7, r + 12], sd * 1.6, 0.7, s !== 0);
      if (s % 2 === 0) { const n = L1_LEAD[bar * 8 + s / 2]; if (n) A.lead(t, n.m + 0, sd * 2 * n.len - 0.02, 0.85, true, 'sawtooth'); }
    }
  },
  boss1: {
    bpm: 134, len: 8 * 16,
    gen(step, t, sd, A) {
      const prog = ['E', 'E', 'G', 'A', 'E', 'E', 'C', 'B'];
      const bar = Math.floor(step / 16), s = step % 16, ch = prog[bar], r = ROOT[ch] + (ch === 'E' ? 0 : 0);
      const minor = ch === 'E' || ch === 'A' || ch === 'B';
      if (s % 4 === 0) A.kick(t);
      if (s === 4 || s === 12) { A.clap(t); A.snare(t, 0.6); }
      if (s % 4 === 2) A.hat(t, 0.9, true); else if (s % 2 === 1) A.hat(t, 0.4);
      if (bar === 0 && s === 0) A.crash(t);
      if (s % 2 === 0) A.bass(t, r - 12 + ((s / 2) % 2 ? 12 : 0), sd * 1.5, 1.1);
      if (s % 4 === 2) A.guitar(t, [r + 12, r + 19, r + 24], sd * 1.2, 0.6, false);
      const arp = [0, minor ? 3 : 4, 7, 12, 7, minor ? 3 : 4];
      A.lead(t, r + 24 + arp[step % arp.length], sd * 0.9, 0.5, false, 'square');
    }
  },
  select: {
    bpm: 150, len: 4 * 16,
    gen(step, t, sd, A) {
      const prog = ['A', 'A', 'D', 'E'];
      const bar = Math.floor(step / 16), s = step % 16, r = ROOT[prog[bar]];
      if (s === 0 || s === 6 || s === 8) A.kick(t, 0.8);
      if (s === 4 || s === 12) A.snare(t, 0.7);
      if (s % 2 === 0) A.hat(t, 0.5);
      if (s % 2 === 0) A.bass(t, r - 12 + [0, 0, 7, 7, 9, 9, 7, 5][s / 2], sd * 1.7, 0.9);
      if (s === 2 || s === 10) A.guitar(t, [r, r + 7, r + 12], sd * 2, 0.55, false);
    }
  },
  clear: {
    bpm: 150, len: 4 * 16, once: true,
    gen(step, t, sd, A) {
      const mel = ['E5', '', 'G5', '', 'A5', '', 'B5', 'D6', '', 'B5', '', 'E6', '', '', '', '', 'D6', '', 'B5', '', 'A5', '', 'G5', 'A5', '', '', '', '', '', '', '', '', 'E5', 'G5', 'A5', 'B5', 'D6', 'E6', '', '', '', '', '', '', '', '', '', ''];
      if (step < mel.length && mel[step]) A.lead(t, NOTE(mel[step]), sd * 2.5, 1);
      if (step % 4 === 0 && step < 48) A.kick(t, 0.8);
      if (step % 8 === 4 && step < 48) A.snare(t, 0.7);
      if (step === 0 || step === 32) A.crash(t);
      if (step === 32) A.guitar(t, [40, 47, 52], sd * 14, 0.8);
      if (step % 4 === 0 && step < 32) A.guitar(t, [40, 47, 52], sd * 2, 0.6, true);
    }
  },
  gameover: {
    bpm: 100, len: 2 * 16, once: true,
    gen(step, t, sd, A) {
      const mel = { 0: 'E5', 4: 'D#5', 8: 'D5', 12: 'C#5', 16: 'C5' };
      if (mel[step]) A.lead(t, NOTE(mel[step]), sd * (step === 16 ? 12 : 3.5), 0.9, false, 'triangle');
      if (step === 16) { A.guitar(t, [36, 43, 48], sd * 12, 0.6); A.crash(t, 0.6); }
    }
  },
  intro: {
    bpm: 172, len: 16 + 2, once: true, next: 'level1',
    gen(step, t, sd, A) { if (step % 4 === 0 && step < 16) A.blip(t, step === 12 ? 1760 : 1200, 0.05, 0.8); }
  },
};
