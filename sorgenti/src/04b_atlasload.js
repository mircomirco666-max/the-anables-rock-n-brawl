// ============================================================
// Atlanti "digitalizzati": decodifica delle immagini (base64) in buffer di pixel fini,
// come faceva Mortal Kombat con le foto degli attori. Le parti (testa, busto, maniche,
// gambe, scarpe) vestono la marionetta di 04_sprites.js quando look.tex è impostato.
// ============================================================
const Atlas = {
  ready: false, _cache: new Map(), _parts: new Map(),
  load() {
    const ids = typeof ATLAS_DATA === 'undefined' ? [] : Object.keys(ATLAS_DATA);
    if (!ids.length) { this.ready = true; return Promise.resolve(); }
    return Promise.all(ids.map(id => new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const [cv, cx] = makeCanvas(img.width, img.height);
        cx.drawImage(img, 0, 0);
        const d = new Uint32Array(cx.getImageData(0, 0, img.width, img.height).data.buffer);
        // i pixel con alpha bassa diventano trasparenti (0)
        for (let i = 0; i < d.length; i++) if ((d[i] >>> 24) < 120) d[i] = 0; else d[i] = (d[i] | 0xff000000) >>> 0;
        this._cache.set(id, { d, W: img.width, H: img.height, meta: (typeof ATLAS_META === 'undefined' ? {} : ATLAS_META)[id] });
        res();
      };
      img.onerror = () => res();
      img.src = ATLAS_DATA[id];
    }))).then(() => { this.ready = true; });
  },
  has(id) { return this._cache.has(id); },
  // parte di un atlante: campionamento px(i, j) in pixel fini, 0 = trasparente
  part(id, name) {
    const k = id + '/' + name;
    let p = this._parts.get(k);
    if (p) return p;
    const a = this._cache.get(id); if (!a || !a.meta[name]) return null;
    const m = a.meta[name], d = a.d, W = a.W, x0 = m.x, y0 = m.y, w = m.w, h = m.h;
    p = Object.assign({}, m, { px(i, j) { if (i < 0 || j < 0 || i >= w || j >= h) return 0; return d[(y0 + j) * W + x0 + i]; } });
    this._parts.set(k, p);
    return p;
  },
  skin(id) { const a = this._cache.get(id); return a && a.meta.skin || null; },
};
// scurisce / schiarisce un colore ABGR impacchettato
function tint32(c, f) {
  if (!c || f === 1) return c;
  let r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
  r = Math.max(0, Math.min(255, Math.round(r * f))); g = Math.max(0, Math.min(255, Math.round(g * f))); b = Math.max(0, Math.min(255, Math.round(b * f)));
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

// ---------- varianti di colore (costumi della band, nemici di colore diverso) ----------
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function hueDist(a, b) { const d = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(d, 360 - d); }
Object.assign(Atlas, {
  // copia dell'atlante con i pixel delle parti indicate trasformati da fn(h, s, l, i) -> [h, s, l] | null
  _derive(id, newId, parts, fn) {
    if (this._cache.has(newId)) return newId;
    const a = this._cache.get(id); if (!a) return id;
    const d = new Uint32Array(a.d); const W = a.W;
    for (const pn of parts) {
      const m = a.meta[pn]; if (!m) continue;
      for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
        const k = (m.y + j) * W + m.x + i, c = d[k]; if (!c) continue;
        const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
        const [h, s, l] = rgb2hsl(r, g, b);
        const out = fn(h, s, l, (i * 7 + j * 13) % 11); if (!out) continue;
        const [R, G, B] = hsl2rgb(out[0], Math.max(0, Math.min(1, out[1])), Math.max(0, Math.min(1, out[2])));
        d[k] = ((255 << 24) | (B << 16) | (G << 8) | R) >>> 0;
      }
    }
    this._cache.set(newId, { d, W, H: a.H, meta: a.meta });
    return newId;
  },
  // costume della band: la giacca (busto e maniche) cambia colore, il resto resta fotografico
  costumed(id, costume) {
    const a = this._cache.get(id); if (!a || !a.meta.jacket) return id;
    const base = a.meta.base || 'rossa';
    if (!costume || costume === base || costume === 'own') return id;
    const jh = a.meta.jacket, isJ = (h, s, l) => hueDist(h, jh) < 28 && s > 0.28 && l > 0.08 && l < 0.9;
    const lap = (h, s, l) => s < 0.2 && l < 0.3;    // revers neri: restano
    const F = {
      rossa: (h, s, l) => isJ(h, s, l) ? [354, Math.max(0.75, s), l * 0.85] : null,
      bianca: (h, s, l) => isJ(h, s, l) ? [40, 0.08, 0.55 + l * 0.42] : null,
      azzurra: (h, s, l) => isJ(h, s, l) ? [192, Math.max(0.55, s), l * 0.95] : null,
      oro: (h, s, l, n) => isJ(h, s, l) ? (n === 0 ? [48, 0.9, 0.9] : [44, Math.max(0.7, s), l * 0.95]) : null,
    }[costume];
    if (!F) return id;
    return this._derive(id, id + '~' + costume, ['torso', 'upArm', 'foreArm'], (h, s, l, n) => lap(h, s, l) ? null : F(h, s, l, n));
  },
  // doppio oscuro: giacca nera, pelle cadaverica, lenti e ombre rosse
  evil(id) {
    const a = this._cache.get(id); if (!a) return id;
    const jh = a.meta.jacket ?? 355;
    const sk = a.meta.skin ? rgb2hsl(parseInt(a.meta.skin.slice(1, 3), 16), parseInt(a.meta.skin.slice(3, 5), 16), parseInt(a.meta.skin.slice(5, 7), 16)) : [20, 0.5, 0.6];
    return this._derive(id, id + '~evil', ['head', 'face', 'torso', 'upArm', 'foreArm'], (h, s, l) => {
      if (hueDist(h, jh) < 28 && s > 0.28 && l > 0.08 && l < 0.9) return [340, 0.35, l * 0.3];
      if (hueDist(h, sk[0]) < 24 && s < 0.8 && l > 0.25) return [200, s * 0.18, Math.min(0.95, l * 1.12)];
      if (l < 0.16) return [352, 0.85, 0.3];
      return null;
    });
  },
  // nemico di colore diverso: ruota la tinta di tutto tranne la pelle
  hued(id, deg) {
    const a = this._cache.get(id); if (!a || !deg) return id;
    const sk = a.meta.skin ? rgb2hsl(parseInt(a.meta.skin.slice(1, 3), 16), parseInt(a.meta.skin.slice(3, 5), 16), parseInt(a.meta.skin.slice(5, 7), 16)) : [20, 0.5, 0.6];
    return this._derive(id, id + '~h' + deg, ['head', 'torso', 'upArm', 'foreArm', 'thigh', 'shin', 'shoe'], (h, s, l) => (hueDist(h, sk[0]) < 22 && s < 0.75 && l > 0.2) || s < 0.12 ? null : [h + deg, s, l]);
  },
});
