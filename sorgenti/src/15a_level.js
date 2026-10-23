// ============================================================
// LA TOURNÉE: i 10 livelli come dati (zone, ondate, oggetti, armi, boss, musica)
// e la classe Level che li fa girare. Ogni livello ha il suo costruttore di fondali.
// ============================================================
// Zona: x = punto in cui la telecamera si blocca; waves = ondate [tipo, lato]
const _R = (t, n = 1) => Array.from({ length: n }, () => [t, 'R']), _L = (t, n = 1) => Array.from({ length: n }, () => [t, 'L']);
const _W = (...g) => [].concat(...g);

const LEVELS = [
  {
    n: 1, key: 'disco', title: 'NOTTE AL NEON', genre: 'DISCO', place: 'STRADA NOTTURNA AL NEON', bg: 'street', length: 4164, song: 'level1', bossSong: 'boss1',
    zones: [
      { x: 0, waves: [_W(_R('pattinatore', 2)), _W(_L('pattinatore'), _R('lanciadischi'))] },
      { x: 780, waves: [_W(_R('buttafuori'), _L('pattinatore')), _W(_R('pattinatore', 2), _L('lanciadischi'))] },
      { x: 1560, waves: [_W(_R('lanciadischi'), _L('pattinatore'), _R('pattinatore')), _W(_R('buttafuori'), _L('lanciadischi'), _R('pattinatore'))] },
      { x: 2370, waves: [_W(_R('pattinatore_oro'), _L('pattinatore'), _R('pattinatore')), _W(_L('buttafuori'), _R('buttafuori'), _R('lanciadischi'))] },
      { x: 3120, mini: true, waves: [_W(_R('buttafuori_capo')), _W(_L('pattinatore'), _R('pattinatore'), _R('lanciadischi'))] },
      { x: 3780, boss: true },
    ],
    extras: ['pattinatore', 'pattinatore', 'lanciadischi', 'buttafuori'],
    props: [
      ['bidone', 375, 152, 'panino'], ['cassa', 510, 204, 'disco'],
      ['bidone', 975, 147, 'plettro'], ['bidone', 1155, 209, 'pizza'], ['cassa', 1245, 163, 'fenicottero'],
      ['jukebox', 1815, 146, 'vinile'], ['cassa', 2010, 200, 'bibita'],
      ['cassa', 2580, 152, 'ampli'], ['bidone', 2745, 207, 'pollo'], ['bidone', 2865, 152, 'coriandoli'],
      ['cassa', 3285, 204, 'nota'], ['bidone', 3465, 150, 'pizza'], ['bidone', 3690, 204, 'panino'],
    ],
    items: [['tubo', 300, 196], ['dischi', 1700, 190], ['coriandoli', 3170, 176]],
    boss: { name: 'DUCA GLITTER', title: 'IL RE DELLA PISTA', waves: [['duca_glitter']] },
  },
  {
    n: 2, key: 'punk', title: 'POGO SELVAGGIO', genre: 'PUNK', place: "LOCALE ROCK'N'ROLL OCCUPATO", bg: 'squat', length: 3900, song: 'lv2', bossSong: 'boss2',
    zones: [
      { x: 0, waves: [_W(_R('punk', 2)), _W(_L('punk'), _R('lanciabottiglie'))] },
      { x: 760, waves: [_W(_R('punk_catena'), _L('punk')), _W(_R('punk', 2), _L('lanciabottiglie'))] },
      { x: 1520, waves: [_W(_R('punk_borchie'), _L('punk'), _R('punk')), _W(_L('punk_catena'), _R('lanciabottiglie'), _R('punk'))] },
      { x: 2300, waves: [_W(_R('punk_catena'), _L('punk_catena'), _R('lanciabottiglie')), _W(_R('punk_borchie'), _L('punk', 2))] },
      { x: 2980, mini: true, waves: [_W(_R('gorilla_pogo')), _W(_L('punk'), _R('punk'), _R('lanciabottiglie'))] },
      { x: 3516, boss: true },
    ],
    extras: ['punk', 'punk', 'lanciabottiglie', 'punk_catena'],
    props: [
      ['bidone', 360, 150, 'panino'], ['cassa', 520, 204, 'mazza'], ['ampli', 900, 146, 'disco'], ['bidone', 1120, 206, 'pizza'],
      ['flight', 1380, 168, 'pesce'], ['cassa', 1760, 150, 'bibita'], ['ampli', 2050, 200, 'plettro'], ['bidone', 2440, 152, 'pollo'],
      ['cassa', 2650, 204, 'grancassa'], ['flight', 3100, 150, 'nota'], ['bidone', 3330, 204, 'pizza'],
    ],
    items: [['mazza', 300, 194], ['lacca', 1650, 186], ['grancassa', 3050, 176]],
    boss: { name: 'RE POGO', title: 'IL SOVRANO DEL MOSH', waves: [['re_pogo']] },
  },
  {
    n: 3, key: 'rave', title: 'BASS DROP', genre: 'ELETTRONICA', place: 'OFFICINA-RAVE', bg: 'rave', length: 3900, song: 'lv3', bossSong: 'boss3',
    zones: [
      { x: 0, waves: [_W(_R('raver', 2)), _W(_L('raver'), _R('robodj'))] },
      { x: 760, waves: [_W(_R('buttafuori_techno'), _L('raver')), _W(_R('raver', 2), _L('robodj'))] },
      { x: 1520, waves: [_W(_R('raver_neon'), _L('raver'), _R('robodj')), _W(_L('buttafuori_techno'), _R('raver'), _R('robodj'))] },
      { x: 2300, waves: [_W(_R('robodj'), _L('robodj'), _R('raver')), _W(_R('raver_neon'), _L('buttafuori_techno'), _L('raver'))] },
      { x: 2980, mini: true, waves: [_W(_R('subwoofer')), _W(_L('raver'), _R('raver'), _R('robodj'))] },
      { x: 3516, boss: true },
    ],
    extras: ['raver', 'raver', 'robodj', 'buttafuori_techno'],
    props: [
      ['flight', 380, 150, 'bibita'], ['ampli', 560, 204, 'theremin'], ['cassa', 920, 150, 'disco'], ['flight', 1180, 206, 'pizza'],
      ['ampli', 1460, 160, 'nota'], ['cassa', 1800, 204, 'fenicottero'], ['flight', 2100, 150, 'vinile'], ['ampli', 2480, 206, 'pollo'],
      ['cassa', 2720, 152, 'dischi'], ['flight', 3120, 204, 'panino'], ['ampli', 3360, 150, 'ampli'],
    ],
    items: [['theremin', 320, 192], ['coriandoli', 1640, 186], ['fenicottero', 2900, 176]],
    boss: { name: 'PROFESSOR DROP', title: 'IL CHIMICO DEL BASSO', waves: [['professor_drop']] },
  },
  {
    n: 4, key: 'hiphop', title: 'BLOCK PARTY', genre: 'HIP HOP', place: 'QUARTIERE VINTAGE', bg: 'block', length: 3900, song: 'lv4', bossSong: 'boss4',
    zones: [
      { x: 0, waves: [_W(_R('breaker', 2)), _W(_L('breaker'), _R('graffitaro'))] },
      { x: 760, waves: [_W(_R('bodyguard'), _L('breaker')), _W(_R('breaker', 2), _L('graffitaro'))] },
      { x: 1520, waves: [_W(_R('breaker_oro'), _L('breaker'), _R('graffitaro')), _W(_L('bodyguard'), _R('breaker'), _R('graffitaro'))] },
      { x: 2300, waves: [_W(_R('graffitaro'), _L('graffitaro'), _R('breaker')), _W(_R('breaker_oro'), _L('bodyguard'), _L('breaker'))] },
      { x: 2980, mini: true, waves: [_W(_R('beatboxer')), _W(_L('breaker'), _R('breaker'), _R('graffitaro'))] },
      { x: 3516, boss: true },
    ],
    extras: ['breaker', 'breaker', 'graffitaro', 'bodyguard'],
    props: [
      ['bidone', 360, 152, 'bibita'], ['cassa', 540, 204, 'tubo'], ['bidone', 900, 148, 'pizza'], ['cassa', 1150, 206, 'disco'],
      ['bidone', 1420, 164, 'lacca'], ['cassa', 1780, 150, 'plettro'], ['bidone', 2080, 204, 'pollo'], ['cassa', 2440, 152, 'mazza'],
      ['bidone', 2700, 206, 'nota'], ['cassa', 3120, 150, 'panino'], ['bidone', 3360, 204, 'pizza'],
    ],
    items: [['tubo', 310, 194], ['dischi', 1640, 186], ['lacca', 2920, 176]],
    boss: { name: 'MC BOOMBOX', title: 'LA VOCE DEL QUARTIERE', waves: [['mc_boombox']] },
  },
  {
    n: 5, key: 'metal', title: 'NOTTE DEI METALLARI MORTI', genre: 'HEAVY METAL', place: 'MAGAZZINO DEI FLIGHT CASE', bg: 'warehouse', length: 3900, song: 'lv5', bossSong: 'boss5',
    zones: [
      { x: 0, waves: [_W(_R('metallaro', 2)), _W(_L('zombie_fan'), _R('metallaro'))] },
      { x: 760, waves: [_W(_R('roadie'), _L('metallaro')), _W(_R('zombie_fan', 2), _L('metallaro'))] },
      { x: 1520, waves: [_W(_R('corpse'), _L('metallaro'), _R('zombie_fan')), _W(_L('roadie'), _R('metallaro'), _R('zombie_fan'))] },
      { x: 2300, waves: [_W(_R('zombie_fan', 2), _L('zombie_fan'), _R('roadie')), _W(_R('corpse'), _L('corpse'), _L('metallaro'))] },
      { x: 2980, mini: true, waves: [_W(_R('roadie_gigante')), _W(_L('zombie_fan'), _R('metallaro'), _R('zombie_fan'))] },
      { x: 3516, boss: true },
    ],
    extras: ['metallaro', 'zombie_fan', 'zombie_fan', 'roadie'],
    props: [
      ['flight', 360, 150, 'panino'], ['lapide', 560, 204, 'ascia'], ['ampli', 900, 146, 'disco'], ['bara', 1140, 206, 'acquasanta'],
      ['flight', 1400, 166, 'pizza'], ['lapide', 1760, 150, 'motosega'], ['ampli', 2060, 204, 'plettro'], ['bara', 2440, 152, 'pollo'],
      ['flight', 2700, 206, 'nota'], ['lapide', 3110, 150, 'pizza'], ['ampli', 3340, 204, 'bibita'],
    ],
    items: [['ascia', 320, 194], ['acquasanta', 1640, 186], ['motosega', 2920, 176]],
    boss: { name: 'LORD FEEDBACK', title: 'IL SIGNORE DEL LARSEN', waves: [['lord_feedback']] },
  },
  {
    n: 6, key: 'opera', title: "FANTASMI ALL'OPERA", genre: 'CLASSICA E OPERA', place: "TEATRO DELL'OPERA", bg: 'opera', length: 3900, song: 'lv6', bossSong: 'boss6',
    zones: [
      { x: 0, waves: [_W(_R('violinista', 2)), _W(_L('violinista'), _R('tenore'))] },
      { x: 760, waves: [_W(_R('maschera'), _L('violinista')), _W(_R('scheletro'), _L('tenore'), _R('violinista'))] },
      { x: 1520, waves: [_W(_R('scheletro', 2), _L('violinista')), _W(_L('maschera'), _R('tenore'), _R('violinista'))] },
      { x: 2300, waves: [_W(_R('tenore'), _L('tenore'), _R('scheletro')), _W(_R('maschera'), _L('scheletro'), _L('violinista'))] },
      { x: 2980, mini: true, waves: [_W(_R('primo_violino')), _W(_L('violinista'), _R('scheletro'), _R('tenore'))] },
      { x: 3516, boss: true },
    ],
    extras: ['violinista', 'violinista', 'tenore', 'scheletro'],
    props: [
      ['cassa', 360, 152, 'bibita'], ['bara', 560, 204, 'acquasanta'], ['cassa', 900, 148, 'disco'], ['flight', 1160, 206, 'pizza'],
      ['bara', 1420, 164, 'trombone'], ['cassa', 1780, 150, 'vinile'], ['flight', 2080, 204, 'pollo'], ['bara', 2440, 152, 'ascia'],
      ['cassa', 2720, 206, 'nota'], ['flight', 3110, 150, 'panino'], ['bara', 3360, 204, 'grancassa'],
    ],
    items: [['trombone', 320, 194], ['acquasanta', 1640, 186], ['ascia', 2920, 176]],
    boss: { name: 'MAESTRO FORTISSIMO E LA DIVA', title: 'IL DUETTO MALEDETTO', waves: [['maestro', 'diva']] },
  },
  {
    n: 7, key: 'country', title: 'IL WEST DEI DANNATI', genre: 'COUNTRY', place: 'SALOON E RANCH', bg: 'western', length: 3900, song: 'lv7', bossSong: 'boss7',
    zones: [
      { x: 0, waves: [_W(_R('cowboy', 2)), _W(_L('cowboy'), _R('pistolero'))] },
      { x: 760, waves: [_W(_R('mandriano'), _L('cowboy')), _W(_R('cowboy_zombie'), _L('pistolero'), _R('cowboy'))] },
      { x: 1520, waves: [_W(_R('cowboy_zombie', 2), _L('cowboy')), _W(_L('mandriano'), _R('pistolero'), _R('cowboy'))] },
      { x: 2300, waves: [_W(_R('pistolero'), _L('pistolero'), _R('cowboy_zombie')), _W(_R('mandriano'), _L('cowboy_zombie'), _L('cowboy'))] },
      { x: 2980, mini: true, waves: [_W(_R('becchino')), _W(_L('cowboy'), _R('cowboy_zombie'), _R('pistolero'))] },
      { x: 3516, boss: true },
    ],
    extras: ['cowboy', 'cowboy', 'pistolero', 'cowboy_zombie'],
    props: [
      ['botte', 360, 150, 'bibita'], ['cassa', 540, 204, 'pesce'], ['botte', 900, 146, 'disco'], ['lapide', 1150, 206, 'acquasanta'],
      ['botte', 1420, 166, 'pizza'], ['cassa', 1780, 150, 'motosega'], ['lapide', 2080, 204, 'plettro'], ['botte', 2440, 152, 'pollo'],
      ['cassa', 2700, 206, 'grancassa'], ['lapide', 3110, 150, 'nota'], ['botte', 3340, 204, 'panino'],
    ],
    items: [['pesce', 320, 194], ['grancassa', 1640, 186], ['motosega', 2920, 176]],
    boss: { name: 'SCERIFFO TWANG', title: 'LA LEGGE DEL TWANG', waves: [['sceriffo']] },
  },
  {
    n: 8, key: 'pop', title: 'TALENTI MOSTRUOSI', genre: 'POP', place: 'STUDIO DEL TALENT SHOW', bg: 'tvstudio', length: 3900, song: 'lv8', bossSong: 'boss8',
    zones: [
      { x: 0, waves: [_W(_R('ballerino', 2)), _W(_L('ballerino'), _R('paparazzo'))] },
      { x: 760, waves: [_W(_R('security'), _L('ballerino')), _W(_R('manichino_vivo'), _L('paparazzo'), _R('ballerino'))] },
      { x: 1520, waves: [_W(_R('manichino_vivo', 2), _L('ballerino')), _W(_L('security'), _R('paparazzo'), _R('ballerino'))] },
      { x: 2300, waves: [_W(_R('paparazzo'), _L('paparazzo'), _R('ballerino')), _W(_R('security'), _L('manichino_vivo'), _L('ballerino'))] },
      { x: 2980, mini: true, waves: [_W(_R('giudice')), _W(_L('ballerino'), _R('manichino_vivo'), _R('paparazzo'))] },
      { x: 3516, boss: true },
    ],
    extras: ['ballerino', 'ballerino', 'paparazzo', 'security'],
    props: [
      ['manichino', 360, 150, 'bibita'], ['flight', 540, 204, 'fenicottero'], ['cassa', 900, 146, 'disco'], ['manichino', 1150, 206, 'pizza'],
      ['flight', 1420, 166, 'theremin'], ['cassa', 1780, 150, 'vinile'], ['manichino', 2080, 204, 'pollo'], ['flight', 2440, 152, 'lacca'],
      ['cassa', 2700, 206, 'nota'], ['manichino', 3110, 150, 'panino'], ['flight', 3340, 204, 'coriandoli'],
    ],
    items: [['fenicottero', 320, 194], ['theremin', 1640, 186], ['lacca', 2920, 176]],
    boss: { name: 'I PERFETTI', title: 'LA BOY BAND SENZA ANIMA', waves: [['perfetto_a', 'perfetto_b', 'perfetto_c']] },
  },
  {
    n: 9, key: 'jazz', title: 'SWING DEI VAMPIRI', genre: 'JAZZ E SWING', place: 'CLUB SOTTERRANEO', bg: 'speakeasy', length: 3900, song: 'lv9', bossSong: 'boss9',
    zones: [
      { x: 0, waves: [_W(_R('zoot', 2)), _W(_L('zoot'), _R('trombettista'))] },
      { x: 760, waves: [_W(_R('portiere'), _L('zoot')), _W(_R('ombra'), _L('trombettista'), _R('zoot'))] },
      { x: 1520, waves: [_W(_R('ombra', 2), _L('zoot')), _W(_L('portiere'), _R('trombettista'), _R('zoot'))] },
      { x: 2300, waves: [_W(_R('trombettista'), _L('trombettista'), _R('ombra')), _W(_R('portiere'), _L('ombra'), _L('zoot'))] },
      { x: 2980, mini: true, waves: [_W(_R('croupier')), _W(_L('zoot'), _R('ombra'), _R('trombettista'))] },
      { x: 3516, boss: true },
    ],
    extras: ['zoot', 'zoot', 'trombettista', 'ombra'],
    props: [
      ['botte', 360, 150, 'bibita'], ['cassa', 540, 204, 'mazza'], ['bara', 900, 146, 'acquasanta'], ['botte', 1150, 206, 'pizza'],
      ['cassa', 1420, 166, 'trombone'], ['bara', 1780, 150, 'vinile'], ['botte', 2080, 204, 'pollo'], ['cassa', 2440, 152, 'pesce'],
      ['bara', 2700, 206, 'nota'], ['botte', 3110, 150, 'panino'], ['cassa', 3340, 204, 'acquasanta'],
    ],
    items: [['mazza', 320, 194], ['acquasanta', 1640, 186], ['trombone', 2920, 176]],
    boss: { name: 'CONTE SWING', title: 'IL VAMPIRO DELLO SWING', waves: [['conte_swing']] },
  },
  {
    n: 10, key: 'finale', title: 'IL COVO FINALE', genre: "ROCK'N'ROLL", place: 'IL COVO FINALE', bg: 'finale', length: 3900, song: 'lv10', bossSong: 'boss10',
    zones: [
      { x: 0, waves: [_W(_R('punk_borchie'), _R('raver_neon')), _W(_L('breaker_oro'), _R('corpse'))] },
      { x: 760, waves: [_W(_R('scheletro'), _L('cowboy_zombie')), _W(_R('ombra', 2), _L('manichino_vivo'))] },
      { x: 1520, waves: [_W(_R('roadie'), _L('punk_borchie'), _R('robodj')), _W(_L('corpse'), _R('scheletro'), _R('paparazzo'))] },
      { x: 2300, waves: [_W(_R('cowboy_zombie'), _L('ombra'), _R('trombettista')), _W(_R('raver_neon'), _L('breaker_oro'), _L('manichino_vivo'))] },
      { x: 2980, mini: true, waves: [_W(_R('gorilla_pogo'), _L('becchino')), _W(_L('corpse'), _R('ombra'), _R('scheletro'))] },
      { x: 3516, boss: true },
    ],
    extras: ['corpse', 'ombra', 'scheletro', 'punk_borchie', 'raver_neon'],
    props: [
      ['ampli', 360, 150, 'bibita'], ['flight', 540, 204, 'motosega'], ['bara', 900, 146, 'acquasanta'], ['ampli', 1150, 206, 'pizza'],
      ['flight', 1420, 166, 'trombone'], ['bara', 1780, 150, 'plettro'], ['ampli', 2080, 204, 'pollo'], ['flight', 2440, 152, 'ascia'],
      ['bara', 2700, 206, 'grancassa'], ['ampli', 3110, 150, 'pollo'], ['flight', 3340, 204, 'mazza'],
    ],
    items: [['ascia', 320, 194], ['motosega', 1640, 186], ['trombone', 2920, 176]],
    boss: { name: 'GLI ANABLES MALVAGI', title: 'I VOSTRI DOPPI OSCURI', waves: [['evil_troy', 'evil_marvin'], ['evil_danny', 'evil_mario'], ['evil_mike', 'evil_arrigo']] },
  },
];
// agguati dall'alto: in alcune ondate un nemico salta giù da sopra lo schermo (lato 'T')
LEVELS.forEach(l => { for (const zi of [2, 3]) { const z = l.zones[zi]; if (z && z.waves && z.waves[1] && z.waves[1].length > 1) z.waves[1][z.waves[1].length - 1][1] = 'T'; } });
// etichetta corta per gli elenchi (la tournée ha poco spazio a destra)
const BOSS_SHORT = { 6: 'MAESTRO E DIVA', 10: 'ANABLES MALVAGI' };
LEVELS.forEach(l => { l.boss.label = BOSS_SHORT[l.n] || l.boss.name; });
// compatibilità: la schermata della tournée legge TOUR
const TOUR = LEVELS.map(l => ({ n: l.n, genre: l.genre, place: l.place, boss: l.boss.name, get ready() { return LEVELS_READY(l.n); } }));
function LEVELS_READY(n) { return typeof bgBuilder === 'function' && !!bgBuilder(LEVELS[n - 1].bg); }

// costruttori dei fondali per chiave (risolti a runtime: le classi stanno in altri file)
function bgBuilder(key) {
  const T = { street: typeof BgStreet !== 'undefined' ? BgStreet : null };
  if (typeof BG_EXTRA !== 'undefined') Object.assign(T, BG_EXTRA);
  return T[key] || null;
}

class Level {
  constructor(n) {
    const d = this.def = LEVELS[n - 1]; this.n = n;
    this.worldEnd = d.length; this.zones = d.zones; this.zi = 0; this.zone = null; this.waveI = -1; this.queue = []; this.waveDelay = 0;
    this.bossPhase = null; this.bossT = 0; this.bossWave = 0; this.floor = null; this.clearT = -1; this.marquee = 0;
    this.title = d.title;
    const B = bgBuilder(d.bg) || BgStreet;
    this.bg = new B(this, d);
  }
  start() {
    const d = this.def;
    G.cam.x = 0; G.cam.max = 0;
    for (const [k, x, z, drop] of d.props) G.props.push(new Prop(k, x, z, drop));
    for (const [k, x, z] of d.items) { const it = new WeaponItem(k, x, z, undefined, 0); it.x = x; G.pickups.push(it); }
    this.placeExtras();
    SONGS.intro.next = d.song;
    Audio2.prerender([d.song, d.bossSong, 'clear']);
    this.startZone(0);
  }
  // potenziamenti (uno nel muro da sfondare, uno a terra, uno in un oggetto), fagioli e barili esplosivi
  placeExtras() {
    const n = this.n, Z = this.zones, K3 = [0, 1, 2].map(i => PERK_KEYS[(n * 3 + i) % PERK_KEYS.length]);
    const free = (kind, x, z) => { const p = new Pickup(kind, x, z, { y: 0, vy: 0 }); p.x = x; p.z = z; p.t = 20; G.pickups.push(p); };
    G.props.push(new Prop('muro', Z[1].x + 320, LANE_TOP + 1, 'perk_' + K3[0]));
    free('perk_' + K3[1], Z[2].x + 300, LANE_BOTTOM - 6);
    const host = G.props.find(pr => pr.kind !== 'muro' && pr.x > Z[3].x && pr.x < Z[4].x) || G.props.find(pr => pr.kind !== 'muro' && pr.x > Z[2].x);
    if (host) host.drop = 'perk_' + K3[2]; else free('perk_' + K3[2], Z[3].x + 200, 190);
    free('fagioli', Z[1].x + 140, 168);
    for (const [zi, dx, z] of [[2, 140, 164], [3, 240, 200], [4, 90, 176]]) if (Z[zi]) G.props.push(new Prop('esplosivo', Z[zi].x + dx, z));
  }
  np() { return Math.max(1, G.players.filter(p => p.active).length); }
  startZone(i) {
    this.zi = i; this.zone = this.zones[i];
    G.cam.max = this.zone.x;
    if (this.zone.boss) { this.bossPhase = 'wait'; return; }
    this.waveI = -1; this.nextWave();
  }
  nextWave() {
    this.waveI++;
    const w = this.zone.waves[this.waveI];
    if (!w) { this.zoneCleared(); return; }
    const extra = Math.round((this.np() - 1) * 0.6 * w.length);
    const list = w.slice();
    for (let i = 0; i < extra; i++) list.push([pick(this.def.extras), chance(0.5) ? 'L' : 'R']);
    list.forEach(([type, side], k) => this.queue.push({ type, side, delay: k * 26 }));
  }
  zoneCleared() {
    const nz = this.zones[this.zi + 1];
    if (!nz) return;
    this.zone = null;
    G.cam.max = nz.x; G.goT = 200; Audio2.sfxPlay('go');
    this.pendingZone = this.zi + 1;
  }
  spawnNow(type, side, o = {}) {
    if (side === 'T') return this.spawnDrop(type);
    const R = side === 'R';
    const x = R ? G.cam.x + W + 40 : G.cam.x - 40;
    const z = o.z !== undefined ? o.z : rand(LANE_TOP + 5, LANE_BOTTOM - 5);
    const def = ENEMY_DEFS[type];
    const Cls = def.cls ? bossClass(def.cls) : Enemy;
    const e = Cls === Enemy ? new Enemy(type, x, z) : new Cls(type, x, z, o);
    e.entryX = o.entryX !== undefined ? o.entryX : (R ? G.cam.x + W - rand(40, 130) : G.cam.x + rand(40, 130));
    e.facing = R ? -1 : 1;
    if (o.x !== undefined) e.x = o.x;
    G.enemies.push(e);
    if (def.tier === 'miniboss') { G.bossRef = e; G.bossGroup = null; popText(def.name + '!', e.entryX, e.z, 140, '#ff4d6d', 80); Audio2.sfxPlay('boss'); }
    return e;
  }
  // agguato: il nemico piomba dall'alto in un punto dello schermo
  spawnDrop(type) {
    const x = rand(G.cam.x + 70, G.cam.x + W - 70), z = rand(LANE_TOP + 8, LANE_BOTTOM - 8);
    const e = new Enemy(type, x, z); e.y = 210; e.vy = 0; e.entryX = x; e.setState('drop', 'leap');
    const p = G.players.find(q => q.active && !q.out); e.facing = p ? (sign(p.x - x) || -1) : -1;
    G.enemies.push(e);
    pixelShadow && addFx('dust', x, z, 1);
    popText(pickLine(['AGGUATO!', '~DALL\'ALTO, STRONZI!']), x, z, 150, '#ff4d6d', 50); Audio2.sfxPlay('beamWarn');
    return e;
  }
  alive() { return G.enemies.filter(e => e.alive && e.state !== 'dead').length; }
  update() {
    // attivazione della zona successiva quando la telecamera ci arriva
    if (this.pendingZone !== undefined && G.cam.x >= this.zones[this.pendingZone].x - 3) { const z = this.pendingZone; this.pendingZone = undefined; G.goT = 0; G.cam.x = this.zones[z].x; this.startZone(z); }
    if (this.queue.length) {
      const q = this.queue[0];
      if (q.delay > 0) q.delay--;
      else if (this.alive() < 6 + this.np()) { this.queue.shift(); this.spawnNow(q.type, q.side); }
    } else if (this.zone && !this.zone.boss && this.waveI >= 0 && this.alive() === 0) {
      if (++this.waveDelay > 40) { this.waveDelay = 0; this.nextWave(); }
    }
    if (G.bossRef && !G.bossRef.alive && !G.bossRef.isBoss) G.bossRef = null;
    this.updateBoss();
    if (this.floor) this.updateFloor();
    if (this.bg.update) this.bg.update();
    this.marquee++;
    if (this.clearT >= 0) this.clearT++;
  }
  // ---------- boss: ingresso, ondate (anche più boss insieme), fine ----------
  updateBoss() {
    if (!this.bossPhase) return;
    const bz = this.zones[this.zones.length - 1].x, B = this.def.boss;
    if (this.bossPhase === 'wait') {
      if (G.cam.x >= bz - 3) { G.cam.x = bz; this.bossPhase = 'intro'; this.bossT = 0; Audio2.stop(); Audio2.sfxPlay('boss'); G.bossIntro = true; }
      return;
    }
    if (this.bossPhase === 'intro') {
      this.bossT++;
      if (this.bossT === 40) this.spawnBossWave(0);
      if (this.bossT === 60) Audio2.play(this.def.bossSong);
      if (this.bossT >= 190) { this.bossPhase = 'fight'; G.bossIntro = false; for (const b of this.bosses) { b.untouchable = false; if (b.onFight) b.onFight(); } }
      return;
    }
    if (this.bossPhase === 'next') {
      if (++this.bossT === 50) { this.spawnBossWave(this.bossWave + 1); }
      if (this.bossT >= 110) { this.bossPhase = 'fight'; for (const b of this.bosses) { b.untouchable = false; if (b.onFight) b.onFight(); } }
    }
  }
  spawnBossWave(i) {
    const B = this.def.boss, list = B.waves[i], sp = this.bg.bossSpawn || {};
    this.bossWave = i;
    this.bosses = list.map((type, k) => {
      const n = list.length, side = k % 2 === 0 ? 'R' : 'L';
      const o = n === 1 ? { x: sp.x ?? G.cam.x + W + 40, z: sp.z ?? 170, entryX: sp.entryX ?? G.cam.x + W - 90 }
        : { x: side === 'R' ? G.cam.x + W + 40 + k * 10 : G.cam.x - 40 - k * 10, z: LANE_TOP + 14 + (k * 26) % 60, entryX: side === 'R' ? G.cam.x + W - 80 - k * 30 : G.cam.x + 80 + k * 30 };
      const e = this.spawnNow(type, side, o);
      e.untouchable = true; e.bossWaveIdx = i;
      return e;
    });
    G.bossRef = this.bosses[0];
    G.bossGroup = { name: B.name, list: this.bosses, wave: i, waves: B.waves.length };
  }
  onBossDefeated(boss) {
    const rest = (this.bosses || []).filter(b => b !== boss && b.alive && b.state !== 'dead' && b.hp > 0);
    if (rest.length) { if (G.bossRef === boss) G.bossRef = rest[0]; return; }
    if (this.bossWave + 1 < this.def.boss.waves.length) {
      this.bossPhase = 'next'; this.bossT = 0;
      popText('NON E\' FINITA!', boss.x, boss.z, 140, '#ff4d6d', 80);
      return;
    }
    this.bossPhase = 'done'; this.clearT = 0; G.bossIntro = false;
    Audio2.stop();
    for (const e of G.enemies) if (e !== boss && e.alive && e.state !== 'dead') { e.hp = 0; e.knockDown(sign(e.x - boss.x) || 1, 1, true); }
    G.projs = G.projs.filter(p => !p.danger);
  }
  updateFloor() {
    const f = this.floor; f.t++;
    const burnStart = 60, burnEnd = 100;
    if (f.t === burnStart) { Audio2.sfxPlay('beam'); G.shake(1, 6); }
    if (f.t >= burnStart && f.t < burnEnd) {
      for (const p of G.players) {
        if (f.hit.has(p) || !canBeHit(p) || !canTargetPlayer(p) || p.y > 3) continue;
        if (this.tileLit(p.x, p.z, f.parity)) { f.hit.add(p); applyHit(G.bossRef, p, { dmg: 7, knock: 'light', stun: 22, push: 0.5, hsA: 0, hsV: 6 }, { dir: 1, noStopA: true }); }
      }
    }
    if (f.t >= burnEnd + 10) this.floor = null;
  }
  tileLit(x, z, parity) {
    const tx = Math.floor((x - (this.worldEnd - W)) / 48), tz = Math.floor((z - LANE_TOP + 2) / 13);
    return ((tx + tz) % 2 + 2) % 2 === parity;
  }
  drawBack(ctx, camX) { this.bg.drawBack(ctx, camX); }
  drawFront(ctx, camX) { this.bg.drawFront(ctx, camX); }
}
// classi dei boss per nome (risolte a runtime)
function bossClass(name) { return (typeof BOSS_CLASSES !== 'undefined' && BOSS_CLASSES[name]) || Enemy; }
