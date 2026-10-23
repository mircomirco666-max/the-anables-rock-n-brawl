// ============================================================
// POTENZIAMENTI, FAGIOLI, NUOVI OGGETTI (muro da sfondare, barile esplosivo),
// SPUTO e VARIANTI DI COLORE dei nemici
// ============================================================

// ---------- colori: rotazione della tinta ----------
function hexToHsl(h) {
  let r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let hh = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh /= 6; }
  return [hh * 360, s, l];
}
function hslToHex(hh, s, l) {
  hh = ((hh % 360) + 360) % 360 / 360;
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  let r, g, b; if (s === 0) r = g = b = l; else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, hh + 1 / 3); g = f(p, q, hh); b = f(p, q, hh - 1 / 3); }
  return '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
function hueShift(hex, deg) { if (typeof hex !== 'string' || hex[0] !== '#' || hex.length !== 7) return hex; const [h, s, l] = hexToHsl(hex); if (s < 0.18) return hex; return hslToHex(h + deg, s, l); }

// ---------- varianti dei nemici: colori diversi e "ciccioni" ----------
const _variantCache = new Map();
function enemyVariant(look, v, fat) {
  const key = look.id + '_v' + v + (fat ? 'f' : '');
  if (_variantCache.has(key)) return _variantCache.get(key);
  const deg = [0, 55, 150, 235][v] || 0;
  const L = Object.assign({}, look, { id: key });
  if (look.costume) { L.costume = Object.assign({}, look.costume); for (const k of ['j', 'lap', 'shirt', 'tie', 'stripe', 'sleeve', 'yoke']) if (L.costume[k]) L.costume[k] = hueShift(L.costume[k], deg); }
  if (look.trousers) L.trousers = hueShift(look.trousers, deg * 0.6);
  if (look.skateCol) L.skateCol = hueShift(look.skateCol, deg);
  if (look.headSpec && typeof look.headSpec === 'object' && look.headSpec.hair && !look.headSpec.face) {
    L.headSpec = Object.assign({}, look.headSpec, { hair: Object.assign({}, look.headSpec.hair, { col: hueShift(look.headSpec.hair.col, deg) }) });
    if (look.headSpec.capCol) L.headSpec.capCol = hueShift(look.headSpec.capCol, deg);
  }
  if (look.tex && typeof Atlas !== 'undefined') L.tex = Atlas.hued(look.tex, deg);
  if (fat) { L.build = { h: (look.build.h || 1) * 0.98, w: (look.build.w || 1) * 1.24 }; if (look.tex) L.belly = (look.belly || 0) + 5; }
  _variantCache.set(key, L);
  return L;
}

// ---------- i potenziamenti ----------
// cumulabili fino al livello 3; si perdono morendo (cadono a terra e si possono riprendere)
const PERKS = {
  forza: { name: 'PEPERONCINO BRUCIACULO', clean: 'PEPERONCINO DEL DIAVOLO', short: 'FORZA', col: '#ff4d3a', desc: 'COLPI PIU\' FORTI' },
  velocita: { name: 'SCARPE PUZZOLENTI', clean: 'SCARPE TURBO', short: 'VELOCITA\'', col: '#62f08e', desc: 'PIU\' VELOCE' },
  difesa: { name: 'MUTANDE DI GHISA', clean: 'MUTANDE DI GHISA', short: 'DIFESA', col: '#c9cdd6', desc: 'MENO DANNI' },
  vita: { name: 'PANCIA DA BIRRA', clean: 'PANCIA DA BIRRA', short: 'VITA', col: '#ffb03a', desc: 'PIU\' SALUTE' },
  carica: { name: 'PEDALE FUZZ', clean: 'PEDALE FUZZ', short: 'CARICA', col: '#3ec5ff', desc: 'SPECIALE PIU\' RAPIDA' },
  portata: { name: 'CAVO JACK LUNGO', clean: 'CAVO JACK LUNGO', short: 'PORTATA', col: '#c58bff', desc: 'COLPI PIU\' LUNGHI' },
};
const PERK_KEYS = Object.keys(PERKS);
const PERK_MAX = 3;
function perkName(k) { return (typeof Opts !== 'undefined' && Opts.lines === 'pulite') ? PERKS[k].clean : PERKS[k].name; }

// icone (sprite procedurali ad alta risoluzione)
function perkIcon(pb, ox, oy, k) {
  const C_ = col, P = PERKS[k], T = tones(P.col);
  // medaglione con bordo dorato
  pb.fill(ox, oy, 20, 20, (x, y) => { const d = Math.hypot(x - 10, y - 10); if (d > 9.8) return 0; if (d > 8.6) return C_(y < 10 ? '#ffe08a' : '#a8801a'); return C_(d < 6 && x + y < 14 ? '#2a2034' : '#1a1424'); });
  if (k === 'forza') pb.fill(ox + 3, oy + 3, 14, 14, (x, y) => { const cx = 7 + Math.sin(y * 0.3) * 1.2, w = 3.2 - Math.abs(y - 7) * 0.22; if (y < 2) return Math.abs(x - 7) < 1 ? C_('#3a8a3a') : 0; if (y > 13 || Math.abs(x - cx) > w) return 0; return x < cx - 1 ? T.L : T.M; });
  if (k === 'velocita') pb.fill(ox + 3, oy + 4, 14, 12, (x, y) => { if (y > 9) return x < 13 ? C_('#f4f2ea') : 0; if (y > 3 && x < 12 - (y < 6 ? 4 : 0)) return (Math.floor(x) % 3 === 0 && y < 8) ? C_('#ffffff') : T.M; if (y > 6 && x < 13) return T.S; return 0; });
  if (k === 'difesa') pb.fill(ox + 3, oy + 4, 14, 12, (x, y) => { if (y < 3) return T.L; const leg = (x < 5.5 || x > 8.5) || y < 5; if (y < 9 && leg && !(Math.abs(x - 7) < 1.5 + (y - 3) * 0.4 && y > 5)) return (Math.floor(x + y) % 4 === 0) ? T.D : T.M; return 0; });
  if (k === 'vita') pb.fill(ox + 4, oy + 3, 13, 14, (x, y) => { if (x > 8.5 && x < 11.5 && y > 4 && y < 10) return (x > 9.5 && x < 10.5 && y > 5 && y < 9) ? 0 : C_('#f4f2ea'); if (x > 8.5) return 0; if (y < 3) return C_('#ffffff'); if (y > 13) return 0; return x < 2 ? T.L : (y % 4 < 0.6 ? T.S : T.M); });
  if (k === 'carica') pb.fill(ox + 3, oy + 5, 14, 10, (x, y) => { if (Math.hypot(x - 4, y - 3) < 1.6) return C_('#ffffff'); if (Math.hypot(x - 10, y - 3) < 1.6) return C_('#ffffff'); if (y > 6.5 && y < 9.5 && x > 4 && x < 10) return C_('#c9cdd6'); return y < 1 ? T.L : T.M; });
  if (k === 'portata') pb.fill(ox + 3, oy + 3, 14, 14, (x, y) => { const d = Math.hypot(x - 7, y - 7); if (d > 2.6 && d < 6.4 && Math.floor(d * 1.4) % 2 === 0) return T.M; if (x > 9 && x < 14 && Math.abs(y - 11) < 1) return C_('#c9cdd6'); return 0; });
}
// fagioli: scatola di latta
function beansIcon(pb, ox, oy) {
  const C_ = col, T = tones('#8a4a2a');
  pb.fill(ox, oy, 16, 18, (x, y) => { if (x < 1 || x > 15) return 0; if (y < 2 || y > 16) return C_(y < 1 || y > 17 ? '#5a5a66' : '#c9cdd6'); if (y > 5 && y < 13) { if (Math.hypot(x - 8, y - 9) < 2.6) return C_(Math.hypot(x - 7.4, y - 8.4) < 0.8 ? '#ffffff' : '#a05028'); return C_(x < 4 ? '#ffd34a' : '#e8b030'); } return x < 4 ? T.L : T.M; });
}
for (const k of PERK_KEYS) PICKUPS['perk_' + k] = { name: PERKS[k].name, perk: k, w: 20, h: 20, draw(pb, ox, oy) { perkIcon(pb, ox, oy, k); } };
PICKUPS.fagioli = { name: 'FAGIOLI ALLA DIAVOLA', beans: true, w: 16, h: 18, draw(pb, ox, oy) { beansIcon(pb, ox, oy); } };

// ---------- nuovi oggetti: muro crepato (nasconde segreti) e barile esplosivo ----------
Object.assign(PROP_CFG, {
  muro: { w: 46, h: 60, hp: 4, sfx: 'hit', cols: ['#7a4a3a', '#5a3428', '#c9b8a8', '#2a1a14'], score: 300, back: true },
  esplosivo: { w: 24, h: 33, hp: 1, sfx: 'metal', cols: ['#c42032', '#ffd34a', '#3a3446'], boom: true },
});
const PROP_SPRITES_EXTRA = {
  muro(stage) {
    return procSprite('muro' + stage, 48, 62, (pb, ox, oy) => {
      const B = tones('#7a4a3a'), M = col('#3a241c'), C_ = col;
      pb.fill(ox, oy, 48, 62, (x, y) => {
        const top = 6 + Math.sin(x * 0.7) * 2 + (x % 7 < 3 ? 2 : 0); if (y < top) return 0;
        const row = Math.floor(y / 5), off = row % 2 ? 6 : 0;
        if (y % 5 < 0.8 || (x + off) % 12 < 0.8) return M;
        const h = _hash(Math.floor((x + off) / 12) + row * 9, row);
        // crepe (più grandi se già colpito)
        const crack = Math.abs(x - 24 - Math.sin(y * 0.35) * 5) < (stage ? 1.4 : 0.7) || (stage && Math.abs(y - 30 - (x - 24) * 0.4) < 0.9 && x > 14 && x < 40);
        if (crack) return C_('#140a08');
        return bandTone(B, 0.4 - y / 80 + (h - 0.5) * 0.5);
      });
    });
  },
  esplosivo(stage) {
    return procSprite('esplosivo' + stage, 26, 33, (pb, ox, oy) => {
      const T = tones('#c42032'), C_ = col;
      pb.fill(ox + 1, oy + 4, 23, 28, (x, y) => {
        if (x < 1 || x > 22) return 0;
        const s = Math.cos((x - 7) / 11 * 1.6) * 0.9 - 0.3;
        if (y >= 6 && y < 7 || y >= 18 && y < 19) return T.D;
        if (y > 9 && y < 16 && x > 5 && x < 18) { const d = Math.hypot(x - 11.5, y - 12.5); if (d < 3.2) return C_(d < 1.2 ? '#18161e' : '#efe9dc'); return C_((Math.floor(x + y) % 4 < 2) ? '#ffd34a' : '#18161e'); }
        return bandTone(T, s);
      });
      pb.fill(ox, oy + 1, 25, 4, (x, y) => bandTone(T, y < 2 ? 0.6 : -0.3));
    });
  },
};
// scritta del muro (disegnata a parte: il font usa un canvas normale)
function drawWallTag(ctx, x, y, stage) { drawText(ctx, (typeof Opts !== 'undefined' && Opts.lines === 'pulite') ? 'SFONDAMI' : 'SFONDAMI!', x, y, stage ? '#ff9ab0' : '#ffd23e', { align: 'center' }); }

// ---------- sputo (punk, cowboy, zombie...) ----------
PROJ_KINDS.spit = { speed: 4.2, ox: 20, oy: 80, grav: 0.22, r: 10, rz: 9, parry: true, mv: { dmg: 3, knock: 'light', stun: 34, push: 0.4 },
  init(p, o) { const T = Math.max(12, Math.abs((o.tx ?? p.x + p.vx * 24) - p.x) / Math.abs(p.vx)); p.vy = arcVy(p.y, T, p.grav); },
  onHit(p, e) { popText(pickLine(['BLEAH!', '~CHE SCHIFO!', '~MI HA SPUTATO, STRONZO!']), e.x, e.z, 110, '#9adf6a', 30); },
  end(p) { splat(p.x, p.z, 3, '#8ac04a'); },
  draw(p, ctx, x, y) { fdisc(ctx, x, y, 2.6, '#8ac04a'); fdisc(ctx, x - 0.8, y - 0.8, 1, '#e8ffd0'); frect(ctx, x - p.dir * 4, y - 0.5, 3, 1, '#6a9a3a'); } };
