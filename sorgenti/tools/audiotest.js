// Verifica audio: ogni brano viene registrato con il motore vero (campioni + OfflineAudioContext),
// ogni effetto sonoro viene reso offline. Controlla che ci sia suono, niente NaN, niente saturazione.
// Uso: node tools/audiotest.js [brano1,brano2,...]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  const res = await page.evaluate(async (only) => {
    const out = {};
    const A = window.__AN.Audio2;
    A.unlock();
    const stats = d => { let sum = 0, peak = 0, nan = 0; for (let i = 0; i < d.length; i++) { if (Number.isNaN(d[i])) nan++; sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); } return { rms: +(Math.sqrt(sum / d.length)).toFixed(4), peak: +peak.toFixed(3), nan }; };
    for (const name of (only || Object.keys(SONGS))) {
      const t0 = performance.now();
      const b = await A._render(name);
      out['song:' + name] = Object.assign(stats(b.getChannelData(0)), { sec: +b.duration.toFixed(1), ms: Math.round(performance.now() - t0) });
    }
    if (only) return out;
    const sfx = ['hit', 'hitHeavy', 'swing', 'swingBig', 'jump', 'land', 'fall', 'hurt', 'ko', 'food', 'coin', 'power', 'oneup', 'break', 'metal', 'grab', 'throw', 'special', 'scream', 'zap', 'poof', 'drumroll', 'piano', 'vinyl', 'beamWarn', 'beam', 'spin', 'menu', 'confirm', 'back', 'go', 'count', 'boss', 'team', 'pause', 'pickup', 'confetti', 'saw', 'water', 'spray', 'groan', 'flame', 'explode', 'boom', 'shot', 'flash', 'bat', 'laser', 'squeak', 'splat', 'laugh', 'gong', 'drop'].concat(window.EXTRA_SFX || []);
    const real = { ctx: A.ctx, sfx: A.sfx, noiseBuf: A.noiseBuf };
    for (const n of sfx) {
      const oc = new OfflineAudioContext(1, 44100 * 1.4, 44100);
      Object.defineProperty(oc, 'state', { get: () => 'running', configurable: true });
      A.ctx = oc; A.sfx = oc.createGain(); A.sfx.gain.value = 0.8; A.sfx.connect(oc.destination);
      A.noiseBuf = oc.createBuffer(1, 44100, 44100); const nd = A.noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      A.sfxPlay(n);
      const b = await oc.startRendering();
      out['sfx:' + n] = stats(b.getChannelData(0));
    }
    Object.assign(A, real);
    return out;
  }, only);
  const bad = Object.entries(res).filter(([k, v]) => v.rms < 0.001 || v.nan > 0);
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(20), JSON.stringify(v));
  console.log('SILENZIOSI O NaN:', bad.map(b => b[0]).join(', ') || 'nessuno');
  console.log(errs.length ? 'ERRORI: ' + errs.join(' | ') : 'NESSUN ERRORE');
  await browser.close();
})();
