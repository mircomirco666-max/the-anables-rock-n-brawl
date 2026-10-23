// ============================================================
// BRANI ORIGINALI DEI LIVELLI 2–10, DEI BOSS E DEL FINALE
// Melodie scritte per il gioco; ogni brano richiama il genere del livello
// solo con strumenti, tempo e ritmo (nessuna melodia esistente).
// ============================================================
const MIDI = { C: 48, 'C#': 49, Db: 49, D: 50, 'D#': 51, Eb: 51, E: 40, F: 41, 'F#': 42, Gb: 42, G: 43, 'G#': 44, Ab: 44, A: 45, 'A#': 46, Bb: 46, B: 47 };
// accordo: "Am", "F#m7", "G7", "Cmaj7", "E5"... -> { r: radice (registro chitarra/basso), iv: intervalli }
function chordOf(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(name), r = MIDI[m[1]], q = m[2];
  const iv = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m6: [0, 3, 7, 9], 5: [0, 7, 12], dim: [0, 3, 6] }[q] || [0, 4, 7];
  return { r, iv, minor: q.startsWith('m') && !q.startsWith('maj') };
}
const swing = (s, t, sd, k = 0.6) => (s % 4 === 2 ? t + sd * k : t);
const lead8 = (L, bar, s, per = 8) => (s % 2 === 0 ? L[bar * per + s / 2] : null);

Object.assign(SONGS, {
  // ---------------- 2 · PUNK ----------------
  lv2: {
    bpm: 188, len: 16 * 16,
    prog: ['E', 'E', 'A', 'B', 'E', 'E', 'A', 'B', 'C#m', 'C#m', 'A', 'A', 'E', 'E', 'B', 'B'],
    L: parseLine(`B4 - B4 - G#4 - E4 - | F#4 - G#4 - F#4 - E4 - | A4 - A4 - C#5 - A4 - | B4 - - - . . B4 C#5 |
      E5 - E5 - D#5 - B4 - | C#5 - B4 - G#4 - E4 - | F#4 - A4 - C#5 - E5 - | D#5 - - - B4 - - - |
      E5 - - E5 D#5 - C#5 - | G#4 - - - . . C#5 D#5 | E5 - C#5 - A4 - C#5 - | E5 - F#5 - E5 - C#5 - |
      B4 - G#4 - B4 - E5 - | G#5 - - - F#5 - E5 - | F#5 - - - D#5 - B4 - | F#5 - G#5 - A5 - B5 - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 44 ? c.r + 12 : c.r, B = bar >= 8;
      if (B ? s % 4 === 0 : (s === 0 || s === 8 || s === 10)) A.kick(t);
      if (B ? s % 4 === 2 : (s === 4 || s === 12)) A.snare(t, B ? 0.75 : 1);
      if (s % 2 === 0) A.hat(t, 0.6, false);
      if (s === 0 && bar % 4 === 0) A.crash(t);
      if (s % 2 === 0) A.bass(t, c.r - 12, sd * 1.7, 1);
      if (s % 2 === 0) A.guitar(t, [r, r + 7, r + 12], sd * 1.7, s === 0 ? 0.8 : 0.65, s !== 0 && s !== 8);
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.8, false, 'sawtooth');
    }
  },
  boss2: {
    bpm: 196, len: 8 * 16,
    prog: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'F', 'B'],
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 44 ? c.r + 12 : c.r, half = bar >= 4;
      if (half) { if (s === 0 || s === 3 || s === 6 || s === 10) A.kick(t, 1.1); if (s === 8) A.snare(t, 1); }
      else { if (s % 2 === 0) A.kick(t, 0.9); if (s % 4 === 2) A.snare(t, 0.8); }
      if (s % 2 === 0) A.hat(t, half ? 0.4 : 0.6, half && s % 4 === 2);
      if (s === 0) A.crash(t, 0.8);
      if (s % 2 === 0) A.bass(t, c.r - 12, sd * 1.6, 1.1);
      if (half) { if (s % 2 === 0 || s === 3) A.guitar(t, [r - 12 < 40 ? r : r - 12, (r - 12 < 40 ? r : r - 12) + 7], sd, 0.8, true); }
      else if (s % 2 === 0) A.guitar(t, [r, r + 7, r + 12], sd * 1.7, 0.7, s % 8 !== 0);
      if (s === 0) A.lead(t, r + 24 + (c.minor ? 3 : 4), sd * 6, 0.6, true, 'sawtooth');
      if (s === 8) A.lead(t, r + 24 + 7, sd * 6, 0.5, true, 'sawtooth');
    }
  },
  // ---------------- 3 · ELETTRONICA ----------------
  lv3: {
    bpm: 128, len: 16 * 16, gain: 0.23,
    prog: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'],
    ACID: [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 3, 0, 10, 0, 7, 0],
    L: parseLine(`A5 - E5 - A5 - C6 - | C6 - A5 - F5 - A5 - | G5 - E5 - C5 - E5 - | D5 - - - G5 - B5 - |
      A5 - C6 - E6 - C6 - | F5 - A5 - C6 - A5 - | E5 - G5 - C6 - B5 - | G5 - - - . . . . `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r, B = bar >= 8;
      if (s % 4 === 0) A.kick808(t, 1);
      if (s === 4 || s === 12) A.clap(t, 0.8);
      if (s % 4 === 2) A.hat(t, 0.7, true); else A.hat(t, 0.25);
      if (s === 0 && bar % 8 === 0) A.crash(t, 0.7);
      const a = this.ACID[s]; if (a || s % 4 === 0) A.acid(t, r - 12 + (c.minor ? a : a === 3 ? 4 : a), sd * 0.9, 0.8);
      if (!B && s === 0) A.strings(t, c.iv.map(i => r + 24 + i), sd * 15, 0.5);
      if (B && s % 2 === 0) A.pluck(t, r + 24 + c.iv[(s / 2) % c.iv.length] + (s >= 8 ? 12 : 0), sd * 1.5, 0.45);
      if (B) { const n = lead8(this.L, bar - 8, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.7, false, 'square'); }
    }
  },
  boss3: {
    bpm: 140, len: 8 * 16, gain: 0.09,
    prog: ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'A', 'A'],
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r;
      if (s % 4 === 0) A.kick808(t, 1.1);
      if (s === 4 || s === 12) { A.clap(t, 0.9); A.snare(t, 0.4); }
      if (bar === 7 && s >= 8) A.snare(t, 0.3 + (s - 8) * 0.08);
      if (s % 2 === 1) A.hat(t, 0.35); if (s % 4 === 2) A.hat(t, 0.6, true);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.8);
      if (s % 4 === 0) A.sub(t, r - 12, sd * 3.5, 1);
      A.acid(t, r + [0, 12, 0, 7, 0, 12, 3, 0][s % 8] - (s % 3 === 0 ? 0 : 12), sd * 0.8, 0.6);
      if (s === 0) A.choir(t, c.iv.map(i => r + 24 + i), sd * 15, 0.5);
      if (s === 0 || s === 8) A.lead(t, r + 36 + (s ? 7 : 0), sd * 7, 0.45, true, 'sawtooth');
      if (bar % 2 === 1 && s === 14) A.blip(t, 1800, 0.05, 0.6);
    }
  },
  // ---------------- 4 · HIP HOP ----------------
  lv4: {
    bpm: 90, len: 8 * 16, gain: 0.32,
    prog: ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Am7'],
    L: parseLine(`F5 - - - E5 - D5 - | . . B4 - D5 - - - | E5 - - - G5 - E5 - | C5 - - - . . . . |
      F5 - A5 - G5 - F5 - | D5 - - - B4 - D5 - | E5 - D5 - C5 - B4 - | A4 - - - . . . . `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r, ts = swing(s, t, sd);
      if (s === 0 || s === 7 || s === 10) A.kick(swing(s, t, sd), 1.1);
      if (s === 4 || s === 12) A.snare(t, 1);
      if (s % 2 === 0) A.hat(ts, s % 4 === 0 ? 0.6 : 0.35);
      if (s === 14 && bar % 2) A.rim(ts, 0.6);
      if (s === 0) A.upright(t, r - 12, sd * 5, 1.1);
      if (s === 6) A.upright(ts, r - 12 + 7, sd * 3, 0.9);
      if (s === 10) A.upright(ts, r - 12 + (c.minor ? 3 : 4) + 12, sd * 4, 0.8);
      if (s === 0 || s === 11) A.piano(swing(s, t, sd), c.iv.map(i => r + 12 + i), sd * 3, 0.45);
      const n = lead8(this.L, bar, s); if (n) A.lead(swing(s, t, sd), n.m, sd * 2 * n.len - 0.02, 0.5, false, 'triangle');
      if (bar === 3 && s === 14) { A.blip(t, 900, 0.05, 0.5); A.blip(t + sd * 0.5, 600, 0.05, 0.5); }
    }
  },
  boss4: {
    bpm: 96, len: 8 * 16, gain: 0.12,
    prog: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'G'],
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r, ts = swing(s, t, sd, 0.5);
      if (s === 0 || s === 3 || s === 10) A.kick808(t, 1.1);
      if (s === 4 || s === 12) { A.snare(t, 1); A.clap(t, 0.6); }
      if (s % 2 === 0) A.hat(ts, 0.5); if (bar % 2 && s >= 12) A.hat(t, 0.3);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.7);
      if (s === 0 || s === 3 || s === 10) A.sub(t, r - 12, sd * 2.5, 1);
      if (s === 0 || s === 3 || s === 6) A.brass(t, c.iv.map(i => r + 12 + i), sd * 1.2, 0.5);
      if (s === 8) A.brass(t, [r + 24 + (c.minor ? 3 : 4)], sd * 6, 0.45);
      if (s === 0) A.choir(t, [r + 12, r + 19], sd * 15, 0.35);
    }
  },
  // ---------------- 5 · HEAVY METAL ----------------
  lv5: {
    bpm: 168, len: 16 * 16, gain: 0.19,
    prog: ['E5', 'E5', 'C5', 'D5', 'E5', 'E5', 'F5', 'E5', 'A5', 'A5', 'G5', 'A5', 'F5', 'F5', 'E5', 'E5'],
    RIFF: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 5, 3],
    L: parseLine(`E5 - F5 - G#5 - A5 - | B5 - - - A5 - G#5 - | C6 - B5 - A5 - G#5 - | A5 - - - . . . . |
      F5 - E5 - D5 - C5 - | B4 - C5 - D5 - E5 - | F5 - - - E5 - D#5 - | E5 - - - - - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r, B = bar >= 8;
      if (B ? true : s % 2 === 0) A.kick(t, B ? 0.75 : 1);
      if (s === 4 || s === 12) A.snare(t, 1);
      if (s % 2 === 0) A.hat(t, 0.4);
      if (s === 0 && bar % 4 === 0) A.crash(t);
      if (r === 40) { const n = 40 + this.RIFF[s]; A.guitar(t, [n, n + 7], sd * 1.1, s % 4 === 0 ? 0.75 : 0.6, this.RIFF[s] === 0); A.bass(t, n - 12, sd, 0.9); }
      else { if (s % 2 === 0) A.guitar(t, [r, r + 7, r + 12], sd * 1.8, 0.7, s % 8 !== 0); if (s % 2 === 0) A.bass(t, r - 12, sd * 1.7, 0.9); }
      if (B) { const n = lead8(this.L, bar - 8, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.75, true, 'sawtooth'); }
    }
  },
  boss5: {
    bpm: 112, len: 8 * 16, gain: 0.23,
    prog: ['Em', 'Em', 'Bb', 'A', 'Em', 'Em', 'C', 'B'],
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r;
      if (s === 0 || s === 2 || s === 10) A.kick(t, 1.1);
      if (s === 8) A.snare(t, 1);
      if (s % 4 === 0) A.hat(t, 0.5, s === 12);
      if (s === 0) A.crash(t, 0.9);
      if (s === 0 || s === 8) A.guitar(t, [r, r + 7, r + 12], sd * 7.5, 0.8, false);
      if (s === 0) A.bass(t, r - 12, sd * 15, 1.1);
      if (s === 0) A.organ(t, c.iv.map(i => r + 24 + i), sd * 15, 0.45);
      if (s === 0 && bar % 2 === 0) A.choir(t, [r + 24, r + 31], sd * 30, 0.45);
      if (s === 4 || s === 12) A.lead(t, r + 36 + (s === 4 ? (c.minor ? 3 : 4) : 6), sd * 4, 0.45, true, 'sawtooth');
    }
  },
  // ---------------- 6 · CLASSICA / OPERA: valzer macabro ----------------
  lv6: {
    bpm: 168, len: 16 * 12, gain: 0.34,
    prog: ['Am', 'Am', 'E', 'E', 'Am', 'Am', 'Dm', 'E', 'F', 'F', 'C', 'C', 'Dm', 'Dm', 'E', 'E'],
    L: parseLine(`E5 - A5 - C6 - | B5 - A5 - G#5 - | B5 - - - E5 - | G#5 - - - . . | A5 - C6 - E6 - | D6 - C6 - B5 - | A5 - F5 - D5 - | E5 - - - - - |
      F5 - A5 - C6 - | E6 - - - D6 - | C6 - G5 - E5 - | G5 - - - C6 - | D6 - C6 - A5 - | F5 - - - D5 - | B4 - E5 - G#5 - | B5 - - - - - `),
    gen(step, t, sd, A) {
      const bar = Math.floor(step / 12), s = step % 12, c = chordOf(this.prog[bar]), r = c.r;
      if (s === 0) { A.kick(t, 0.7); A.upright(t, r - 12, sd * 3.5, 1); }
      if (s === 4 || s === 8) { A.strings(t, c.iv.map(i => r + 12 + i), sd * 2.5, 0.35); A.piano(t, c.iv.map(i => r + 12 + i), sd * 1.5, 0.3); }
      if (s === 0 && bar % 8 === 0) A.crash(t, 0.5);
      if (s % 4 === 0) A.hat(t, 0.15);
      const n = s % 2 === 0 ? this.L[bar * 6 + s / 2] : null;
      if (n) { A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.55, false, 'triangle'); A.strings(t, [n.m], sd * 2 * n.len, 0.25); }
    }
  },
  boss6: {
    bpm: 150, len: 8 * 16, gain: 0.25,
    prog: ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'A', 'A'],
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r;
      if (s === 0 || s === 8) A.kick(t, 1.1);
      if (s === 12 || (bar % 2 && s === 14)) A.snare(t, 0.6);
      if (s === 0 && bar % 2 === 0) A.crash(t, 0.8);
      if (s === 0) { A.organ(t, c.iv.map(i => r + 12 + i), sd * 15, 0.4); A.bass(t, r - 12, sd * 15, 1); }
      A.strings(t, [r + 24 + c.iv[(s >> 1) % 3]], sd * 0.9, 0.3);
      if (s === 0) A.choir(t, c.iv.map(i => r + 24 + i), sd * 15, 0.45);
      if (s === 0 || s === 6 || s === 12) A.brass(t, [r + 24 + (s === 6 ? 7 : s === 12 ? 12 : 0)], sd * (s === 12 ? 4 : 5), 0.45);
    }
  },
  // ---------------- 7 · COUNTRY ----------------
  lv7: {
    bpm: 152, len: 16 * 16, gain: 0.3,
    prog: ['G', 'G', 'C', 'G', 'D', 'D', 'G', 'G', 'Em', 'Em', 'C', 'G', 'D', 'D', 'G', 'D'],
    L: parseLine(`B4 - D5 - G5 - - - | F#5 - E5 - D5 - B4 - | C5 - E5 - G5 - E5 - | D5 - - - B4 - - - |
      A4 - B4 - C5 - D5 - | F#5 - - - E5 - D5 - | B4 - - - G4 - A4 - | G4 - - - . . . . |
      E5 - - - G5 - E5 - | B4 - - - E5 - G5 - | C5 - E5 - G5 - - - | B4 - D5 - G5 - - - |
      A4 - - - D5 - F#5 - | A5 - G5 - F#5 - E5 - | D5 - B4 - G4 - B4 - | A4 - - - D5 - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 43 ? c.r + 12 : c.r, B = bar >= 8;
      A.snare(t, s === 4 || s === 12 ? 0.8 : 0.18);
      if (s === 0 || s === 8) A.kick(t, 0.9);
      if (s === 0 && bar % 8 === 0) A.crash(t, 0.6);
      if (s === 0) A.upright(t, r - 12, sd * 3.5, 1); if (s === 8) A.upright(t, r - 12 + 7, sd * 3.5, 0.9);
      if (s === 4 || s === 12) A.guitar(t, c.iv.map(i => r + 12 + i), sd * 1.2, 0.5, true, true);
      if (B) A.pluck(t, r + 24 + [0, 7, 12, c.iv[1], 7, 12][s % 6], sd * 1.2, 0.3);
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.6, false, 'triangle');
    }
  },
  boss7: {
    bpm: 132, len: 8 * 16, gain: 0.27,
    prog: ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E'],
    L: parseLine(`A5 - - - E5 - - - | G5 - - - D5 - - - | F5 - E5 - D5 - C5 - | B4 - - - E5 - - - |
      A5 - C6 - B5 - A5 - | G5 - B5 - A5 - G5 - | F5 - A5 - G5 - F5 - | E5 - - - G#5 - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r;
      if (s === 0 || s === 3 || s === 8 || s === 11) A.kick(t, 0.9);
      if (s === 4 || s === 12) A.snare(t, 0.8);
      if (s % 2 === 0) A.shaker(t, 0.4);
      if (s === 0) { A.bell(t, r + 36, sd * 4, 0.35); A.upright(t, r - 12, sd * 7, 1); }
      if (s === 8) A.upright(t, r - 12 + 7, sd * 7, 0.9);
      if (s % 2 === 0) A.guitar(t, [r + 12 + c.iv[(s >> 1) % 3]], sd * 2, 0.4, false, true);
      if (s === 0 && bar % 2 === 0) A.choir(t, c.iv.map(i => r + 24 + i), sd * 30, 0.35);
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.55, true, 'sine');
    }
  },
  // ---------------- 8 · POP ----------------
  lv8: {
    bpm: 118, len: 16 * 16, gain: 0.22,
    prog: ['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'F', 'G', 'Em', 'Am', 'F', 'G', 'Em', 'Am'],
    L: parseLine(`E5 - G5 - E5 - D5 C5 | D5 - - - B4 - G4 - | C5 - E5 - A5 - G5 - | F5 - E5 - C5 - - - |
      E5 - G5 - E5 - D5 C5 | D5 - - - B4 - G4 - | C5 - E5 - A5 - G5 - | A5 - G5 - F5 - E5 D5 |
      F5 - - - A5 - C6 - | G5 - - - B5 - D6 - | E6 - D6 - B5 - G5 - | A5 - - - - - - - |
      F5 - - - A5 - C6 - | G5 - - - B5 - D6 - | E6 - D6 - B5 - G5 - | C6 - - - - - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r;
      if (s % 4 === 0) A.kick(t, 1);
      if (s === 4 || s === 12) A.clap(t, 0.8);
      A.hat(t, s % 4 === 2 ? 0.5 : 0.22, s % 4 === 2);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.6);
      if (s % 2 === 0) A.bass(t, r - 12 + (s % 4 === 2 ? 12 : 0), sd * 1.6, 0.9);
      if (s % 4 === 2) A.pluck(t, r + 24 + c.iv[1], sd * 1.4, 0.3), A.pluck(t, r + 24 + c.iv[2], sd * 1.4, 0.3);
      if (s === 0) A.strings(t, c.iv.map(i => r + 12 + i), sd * 15, 0.3);
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.7, false, 'square');
    }
  },
  boss8: {
    bpm: 126, len: 8 * 16, gain: 0.09,
    prog: ['Fm', 'Fm', 'Db', 'Db', 'Ab', 'Ab', 'Eb', 'Eb'],
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r;
      if (s % 4 === 0) A.kick808(t, 1.1);
      if (s === 4 || s === 12) { A.clap(t, 0.9); A.snare(t, 0.5); }
      A.hat(t, s % 2 ? 0.2 : 0.4);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.8);
      if (s % 2 === 0) A.sub(t, r - 12, sd * 1.8, 0.9);
      A.lead(t, r + 24 + [0, 7, 12, c.iv[1] + 12, 12, 7][step % 6], sd * 0.9, 0.35, false, 'square');
      if (s === 0) A.choir(t, c.iv.map(i => r + 24 + i), sd * 15, 0.45);
    }
  },
  // ---------------- 9 · JAZZ / SWING (blues minore) ----------------
  lv9: {
    bpm: 168, len: 12 * 16, gain: 0.22,
    prog: ['Cm7', 'Cm7', 'Cm7', 'Cm7', 'Fm7', 'Fm7', 'Cm7', 'Cm7', 'Ab7', 'G7', 'Cm7', 'G7'],
    L: parseLine(`C5 - Eb5 - G5 - Bb5 - | G5 - - - F5 - Eb5 - | C5 - - - . . G4 - | C5 - Eb5 - F5 - G5 - |
      Ab5 - - - G5 - F5 - | Eb5 - C5 - Ab4 - C5 - | G5 - - - Eb5 - C5 - | . . . . G4 - C5 - |
      Eb5 - - - D5 - C5 - | B4 - D5 - F5 - G5 - | C5 - - - - - - - | . . . . . . . . `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r, nx = chordOf(this.prog[(bar + 1) % 12]);
      const ts = swing(s, t, sd, 0.66);
      if (s % 4 === 0) { A.hat(t, 0.55, true); A.kick(t, 0.25); }
      if (s % 8 === 6) A.hat(ts, 0.45, true);
      if (s === 4 || s === 12) A.hat(t, 0.35);
      if ((step * 7) % 11 === 3 && s % 2 === 0) A.snare(ts, 0.25);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.4);
      if (s % 4 === 0) { const beat = s >> 2, walk = [0, c.iv[1], c.iv[2], (nx.r - r + 12) % 12 - 1]; A.upright(t, r - 12 + walk[beat], sd * 3.6, 1); }
      if (s === 6 || (s === 14 && bar % 2)) A.piano(ts, c.iv.map(i => r + 12 + i), sd * 2, 0.35);
      const n = lead8(this.L, bar, s); if (n) A.brass(swing(s, t, sd, 0.66), [n.m], sd * 2 * n.len - 0.02, 0.4);
    }
  },
  boss9: {
    bpm: 176, len: 8 * 16, gain: 0.2,
    prog: ['Dm6', 'Dm6', 'A7', 'A7', 'Gm6', 'Gm6', 'A7', 'Dm6'],
    L: parseLine(`D5 - F5 - A5 - - - | B5 - A5 - F5 - D5 - | C#5 - E5 - G5 - Bb5 - | A5 - - - . . . . |
      G5 - Bb5 - D6 - - - | E5 - - - G5 - Bb5 - | A5 - G5 - E5 - C#5 - | D5 - - - . . . . `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r, ts = swing(s, t, sd, 0.66);
      if (s % 4 === 0) { A.hat(t, 0.6, true); A.kick(t, 0.5); }
      if (s % 8 === 6) A.hat(ts, 0.5, true);
      if (s === 4 || s === 12) A.snare(t, 0.6);
      if (s === 0 && bar % 2 === 0) A.crash(t, 0.6);
      if (s % 4 === 0) A.upright(t, r - 12 + [0, c.iv[1], c.iv[2], c.iv[1]][s >> 2], sd * 3.6, 1);
      if (s === 0) A.organ(t, c.iv.map(i => r + 12 + i), sd * 15, 0.35);
      if (s === 6 || s === 14) A.brass(ts, c.iv.map(i => r + 12 + i), sd * 1.2, 0.35);
      const n = lead8(this.L, bar, s); if (n) A.lead(swing(s, t, sd, 0.66), n.m, sd * 2 * n.len - 0.02, 0.5, true, 'triangle');
      if (s === 0 && bar % 4 === 0) A.choir(t, [r + 24, r + 31], sd * 30, 0.3);
    }
  },
  // ---------------- 10 · ROCK'N'ROLL ----------------
  lv10: {
    bpm: 174, len: 12 * 16,
    prog: ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'],
    L: parseLine(`A4 - C5 - C#5 - E5 - | A5 - - - G5 - E5 - | . . C5 C#5 E5 - G5 - | A5 - - - - - . . |
      D5 - F5 - F#5 - A5 - | C6 - - - A5 - F#5 - | E5 - C#5 - A4 - C5 - | C#5 - - - . . . . |
      B4 - D5 - E5 - G#5 - | A5 - G5 - F#5 - D5 - | C#5 - E5 - A5 - E5 - | G#5 - - - B5 - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 44 ? c.r + 12 : c.r;
      if (s === 0 || s === 8 || s === 10) A.kick(t);
      if (s === 4 || s === 12) A.snare(t);
      if (s % 2 === 0) A.hat(t, 0.55, s % 4 === 2);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.8);
      if (s % 2 === 0) A.bass(t, c.r - 12 + [0, 4, 7, 9, 10, 9, 7, 4][s / 2], sd * 1.8, 1);
      if (s % 2 === 0) A.guitar(t, [r, r + ((s % 8) >= 4 ? 9 : 7)], sd * 1.7, 0.7, true);
      if (s % 4 === 2) A.piano(t, c.iv.map(i => r + 24 + i).concat([r + 24 + 10]), sd, 0.35);
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.8, true, 'sawtooth');
    }
  },
  boss10: {
    bpm: 168, len: 8 * 16, gain: 0.17,
    prog: ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'B'],
    L: parseLine(`E5 - G5 - B5 - E6 - | D6 - C6 - B5 - G5 - | B5 - D6 - G6 - F#6 - | F#6 - E6 - D6 - A5 - |
      E6 - - - D6 - B5 - | C6 - - - G5 - E5 - | D6 - B5 - G5 - B5 - | D#6 - - - F#6 - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 44 ? c.r + 12 : c.r;
      if (s % 2 === 0) A.kick(t, 0.9);
      if (s === 4 || s === 12) A.snare(t, 1);
      if (s % 2 === 0) A.hat(t, 0.45, s % 4 === 2);
      if (s === 0) A.crash(t, 0.9);
      if (s % 2 === 0) { A.bass(t, c.r - 12, sd * 1.7, 1.1); A.guitar(t, [r, r + 7, r + 12], sd * 1.7, 0.7, s % 8 !== 0); }
      if (s === 0) { A.organ(t, c.iv.map(i => r + 12 + i), sd * 15, 0.35); A.choir(t, c.iv.map(i => r + 24 + i), sd * 15, 0.4); }
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.75, true, 'sawtooth');
    }
  },
  // ---------------- in viaggio col furgone ----------------
  van: {
    bpm: 176, len: 8 * 16, gain: 0.2,
    prog: ['E', 'E', 'G', 'A', 'E', 'E', 'D', 'B'],
    L: parseLine(`B4 - E5 - G5 - E5 - | B4 - E5 - G5 - A5 - | B5 - - - A5 - G5 - | A5 - - - E5 - - - |
      B4 - E5 - G5 - B5 - | D6 - B5 - G5 - E5 - | F#5 - A5 - D6 - - - | D#6 - - - B5 - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 44 ? c.r + 12 : c.r;
      if (s % 4 === 0) A.kick(t); if (s === 4 || s === 12) A.snare(t); A.hat(t, s % 2 ? 0.25 : 0.5);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.7);
      if (s % 2 === 0) { A.bass(t, c.r - 12, sd * 1.7, 1); A.guitar(t, [r, r + 7, r + 12], sd * 1.7, 0.65, s % 8 !== 0); }
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.7, true, 'sawtooth');
    }
  },
  // ---------------- titoli di coda ----------------
  ending: {
    bpm: 132, len: 16 * 16, gain: 0.21,
    prog: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'G', 'C', 'F', 'G', 'Am', 'F', 'G', 'C', 'C'],
    L: parseLine(`G5 - E5 - G5 - C6 - | A5 - - - F5 - A5 - | B5 - D6 - G5 - B5 - | C6 - - - - - . . |
      A5 - C6 - E6 - C6 - | A5 - F5 - A5 - C6 - | D6 - - - B5 - G5 - | G5 - - - . . . . |
      E6 - D6 - C6 - G5 - | F5 - A5 - C6 - A5 - | B5 - G5 - D6 - B5 - | C6 - - - A5 - E5 - |
      F5 - A5 - C6 - F6 - | G6 - - - F6 - D6 - | E6 - - - - - - - | C6 - - - - - - - `),
    gen(step, t, sd, A) {
      const bar = step >> 4, s = step & 15, c = chordOf(this.prog[bar]), r = c.r < 44 ? c.r + 12 : c.r;
      if (s === 0 || s === 8 || s === 10) A.kick(t, 0.9);
      if (s === 4 || s === 12) A.snare(t, 0.9);
      if (s % 2 === 0) A.hat(t, 0.45);
      if (s === 0 && bar % 4 === 0) A.crash(t, 0.7);
      if (s % 2 === 0) A.bass(t, c.r - 12 + (s === 14 ? 7 : 0), sd * 1.7, 0.9);
      if (s % 4 === 0) A.guitar(t, c.iv.map(i => r + i).concat([r + 12]), sd * 3.5, 0.55, false);
      if (s === 0) { A.strings(t, c.iv.map(i => r + 12 + i), sd * 15, 0.35); A.piano(t, c.iv.map(i => r + 24 + i), sd * 4, 0.35); }
      if (s === 8) A.piano(t, c.iv.map(i => r + 24 + i), sd * 4, 0.3);
      const n = lead8(this.L, bar, s); if (n) A.lead(t, n.m, sd * 2 * n.len - 0.02, 0.75, false, 'square');
    }
  },
});
