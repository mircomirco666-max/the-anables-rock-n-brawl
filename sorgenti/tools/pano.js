// Panorama del livello: node tools/pano.js livello out.png [scala] [fase boss]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [lv = 1, out, sc = 1, phase = 'fight'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.stack)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(300);
  const url = await page.evaluate(([lv, sc, phase]) => {
    const A = window.__AN, G = A.G;
    const L = new Level(lv); G.level = L; G.frame = 30;
    L.bossPhase = phase === 'none' ? null : phase; L.bossT = 200;
    const [c, x] = makeCanvas(L.worldEnd * sc, H * sc); x.imageSmoothingEnabled = false;
    const [f, fx] = makeCanvas(W * RS, H * RS); fx.imageSmoothingEnabled = false;
    for (let cam = 0; cam < L.worldEnd; cam += W) {
      const cx = Math.min(cam, L.worldEnd - W);
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, W * RS, H * RS); fx.setTransform(RS, 0, 0, RS, 0, 0);
      L.drawBack(fx, cx); L.drawFront(fx, cx);
      x.drawImage(f, cx * sc, 0, W * sc, H * sc);
    }
    return c.toDataURL();
  }, [+lv, +sc, phase]);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(errs.length ? errs.join('\n') : 'nessun errore');
  await browser.close();
})();
