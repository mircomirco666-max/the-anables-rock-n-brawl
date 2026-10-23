// Suoni dei musicisti resi offline: livello (rms, picco) di ogni evento rispetto al colpo generico,
// e un file WAV dimostrativo: ogni musicista fa la sua combo sopra il brano del livello 2.
// Uso: node tools/charsfx.js [out.wav]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const outWav = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(400);
  const res = await page.evaluate(async (wantWav) => {
    const A = window.__AN.Audio2; A.unlock();
    const stats = d => { let s = 0, pk = 0, nan = 0; for (let i = 0; i < d.length; i++) { if (Number.isNaN(d[i])) nan++; s += d[i] * d[i]; pk = Math.max(pk, Math.abs(d[i])); } return { rms: +(Math.sqrt(s / d.length)).toFixed(4), peak: +pk.toFixed(3), nan }; };
    const real = { ctx: A.ctx, sfx: A.sfx, noiseBuf: A.noiseBuf };
    const offline = (sec) => {
      const oc = new OfflineAudioContext(1, Math.ceil(44100 * sec), 44100);
      Object.defineProperty(oc, 'state', { get: () => 'running', configurable: true });
      A.ctx = oc; A.sfx = oc.createGain(); A.sfx.gain.value = 0.8 * 1.4; A.sfx.connect(oc.destination);
      A.noiseBuf = oc.createBuffer(1, 44100, 44100); const nd = A.noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      return oc;
    };
    const out = {};
    const H = { root: 40, minor: true };
    // riferimento: colpo generico
    for (const n of ['hit', 'hitHeavy', 'swing']) { const oc = offline(1); A.sfxPlay(n); out['generico:' + n] = stats((await oc.startRendering()).getChannelData(0)); }
    for (const c of CAST) {
      const M = makeMoves(c);
      const evs = [['swing', { mv: M.l1 }], ['hit', { mv: M.l1, step: 0 }], ['hit', { mv: M.l2, step: 0 }], ['hit', { mv: M[CHAR_FINISHER[c.id]], big: true }], ['hit', { mv: M.heavy, step: 0, big: M.heavy.knock === 'down' }], ['jump', {}], ['hurt', {}], ['special', {}], ['die', {}]];
      for (const [ev, o] of evs) {
        const oc = offline(1.6); A.charSfx(c.id, ev, Object.assign({ H }, o));
        const k = c.id + ':' + ev + (o.mv ? ':' + (o.mv.snd || o.mv.anim) + (o.big ? '!' : '') : '');
        out[k] = stats((await oc.startRendering()).getChannelData(0));
      }
    }
    let wav = null;
    if (wantWav) {
      // brano del livello 2 come sottofondo, poi le combo dei sei a ritmo di gioco
      const song = SONGS.lv2; Object.assign(A, real);
      const sbuf = await A._render('lv2');
      const per = 4.2, sec = per * 6 + 0.5, oc = offline(sec);
      // stessa catena del gioco: musica e effetti nel master con il compressore
      const master = oc.createGain(); master.gain.value = 0.9; const comp = oc.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; master.connect(comp); comp.connect(oc.destination);
      A.sfx.disconnect(); A.sfx.connect(master);
      const src = oc.createBufferSource(); src.buffer = sbuf; src.loop = true; const sg = oc.createGain(); sg.gain.value = 0.7 * 0.9; src.connect(sg); sg.connect(master); src.start(0);
      const sd = 60 / song.bpm / 4, harmAt = t => song._harm[Math.min(song._harm.length - 1, (Math.floor((t % sbuf.duration) / sd)) >> 2)];
      CAST.forEach((c, ci) => {
        const M = makeMoves(c); let t = ci * per + 0.2;
        const chain = []; let k = 'l1'; while (k && M[k] && chain.length < 8) { chain.push(k); k = M[k].next; }
        for (const name of chain) {
          const m = M[name], fps = 60, dt = (m.fr[0] + m.fr[1]) / fps;
          A.charSfx(c.id, 'swing', { mv: m, t, H: harmAt(t) });
          const n = m.multi || 1;
          for (let i = 0; i < n; i++) { const th = t + m.fr[0] / fps + i * m.fr[1] / n / fps; A.charSfx(c.id, 'hit', { mv: m, step: i, t: th, H: harmAt(th), big: m.knock === 'down' || (m.lastMv && i === n - 1 && m.lastMv.knock === 'down') }); }
          t += dt + 0.05;
        }
        t += 0.45;
        const h = M.heavy, nh = h.multi || 1;
        A.charSfx(c.id, 'swing', { mv: h, t, H: harmAt(t) });
        for (let i = 0; i < nh; i++) { const th = t + h.fr[0] / 60 + i * h.fr[1] / nh / 60; A.charSfx(c.id, 'hit', { mv: h, step: i, t: th, H: harmAt(th), big: i === nh - 1 && (h.knock === 'down' || (h.lastMv && h.lastMv.knock === 'down')) }); }
        t += 0.8; A.charSfx(c.id, 'jump', { t, H: harmAt(t) }); t += 0.5; A.charSfx(c.id, 'hurt', { t, H: harmAt(t) });
      });
      const b = await oc.startRendering(), d = b.getChannelData(0);
      out['demo'] = stats(d);
      // WAV 16 bit
      const n = d.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
      let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); const g = pk > 0.98 ? 0.98 / pk : 1;
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * g)) * 32767, true);
      let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      wav = btoa(bin);
    }
    Object.assign(A, real);
    return { out, wav };
  }, !!outWav);
  for (const [k, v] of Object.entries(res.out)) console.log(k.padEnd(34), JSON.stringify(v));
  const bad = Object.entries(res.out).filter(([k, v]) => v.rms < 0.002 || v.nan > 0 || v.peak > 1.6);
  console.log('PROBLEMI (muti, NaN o saturi):', bad.map(b => b[0]).join(', ') || 'nessuno');
  if (outWav && res.wav) { fs.writeFileSync(outWav, Buffer.from(res.wav, 'base64')); console.log('scritto', outWav); }
  console.log(errs.length ? 'ERRORI: ' + errs.join(' | ') : 'nessun errore');
  await browser.close();
})();
