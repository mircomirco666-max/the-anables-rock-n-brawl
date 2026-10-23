// ============================================================
// IL CAST — dati dei sei membri giocabili (formazione fissa confermata)
// Aspetto ricavato dalle foto fornite da Mirco. Le battute sono provvisorie,
// legate solo a ruolo e strumento (nessun tratto personale inventato).
// ============================================================
const GLASS = { g: '#0f0f15', G: '#5f6a80', f: '#0f0f15' };

// Statistiche 1–5: forza, velocità, portata, resistenza (somma 13 per tutti)
const CAST = [
  {
    id: 'arrigo', name: 'ARRIGO', role: 'VOCE', instName: 'ASTA DEL MICROFONO', family: 'mic',
    stats: { str: 3, spd: 3, rch: 4, end: 3 }, color: '#ff4d6d',
    look: { headSpec: HEAD_SPECS.arrigo, skin: '#e9b38c', build: { h: 1, w: 1.08 }, shoes: 'twotone', tie: 'black', instrument: 'micstand' },
    special: { id: 'urlo', name: 'URLO SUPERSONICO', desc: 'ONDA D\'URTO TUTTO INTORNO' },
    quotes: { start: '1, 2, 6, 9!', special: 'AAAAAAH!', win: 'GRAZIE, SIETE STATI FANTASTICI!' },
    traits: ['CAPELLI RICCI NERI', 'BARBA BRIZZOLATA', 'WAYFARER NERI', 'SCARPE BICOLORI'],
  },
  {
    id: 'mike', name: 'MIKE', role: 'CHITARRA', instName: 'CHITARRA CREMA', family: 'guitar',
    stats: { str: 5, spd: 2, rch: 3, end: 3 }, color: '#3ec5ff',
    look: { headSpec: HEAD_SPECS.mike, skin: '#efc29f', build: { h: 1, w: 1.05 }, shoes: 'black', tassel: true, socks: '#d9c24a', tie: 'black', instrument: 'strat' },
    special: { id: 'assolo', name: 'ASSOLO FULMINANTE', desc: 'FULMINI IN AVANTI SULLA CORSIA' },
    quotes: { start: 'ACCORDATI E PRONTI!', special: 'ASSOLO!', win: 'BIS! BIS!' },
    traits: ['BARBA LUNGA', 'RICCI AI LATI', 'CHITARRA CREMA', 'CALZINI PATATINE'],
  },
  {
    id: 'danny', name: 'DANNY', role: 'CHITARRA', instName: 'CHITARRA NERA', family: 'guitar',
    stats: { str: 2, spd: 5, rch: 3, end: 3 }, color: '#ffd23e',
    look: { headSpec: HEAD_SPECS.danny, skin: '#e7b089', build: { h: 1, w: 0.98 }, shoes: 'twotone', tie: 'bolo', instrument: 'tele' },
    special: { id: 'vortice', name: 'VORTICE', desc: 'GIRA E AVANZA COLPENDO PIU\' VOLTE' },
    quotes: { start: 'ORA MOLLAMI!', special: 'ORA MOLLAMI!', win: 'ANCORA UN GIRO!' },
    traits: ['BAFFI', 'OCCHIALI STRETTI', 'CRAVATTA WESTERN', 'CHITARRA NERA'],
  },
  {
    id: 'mario', name: 'MARIO', nick: 'LA TRUFFA', role: 'BASSO', instName: 'VIOLIN BASS', family: 'guitar',
    stats: { str: 3, spd: 3, rch: 5, end: 2 }, color: '#62f08e',
    look: { headSpec: HEAD_SPECS.mario, skin: '#e8b28b', build: { h: 1, w: 0.96 }, shoes: 'black', tie: 'black', instrument: 'violin', worn: { u: 3, v: 18, a: 164, g: 'body' } },
    special: { id: 'truffa', name: 'LA TRUFFA', desc: 'SPARISCE E RICOMPARE ALLE SPALLE' },
    quotes: { start: 'FIDATI DI ME...', special: 'E\' TUTTA UNA TRUFFA!', win: 'NESSUNO SE N\'E\' ACCORTO.' },
    traits: ['RICCI RACCOLTI', 'BAFFI', 'OCCHIALINI TONDI', 'VIOLIN BASS'],
  },
  {
    id: 'troy', name: 'TROY', role: 'BATTERIA', instName: 'BACCHETTE', family: 'sticks',
    stats: { str: 2, spd: 5, rch: 2, end: 4 }, color: '#c58bff',
    look: { headSpec: HEAD_SPECS.troy, skin: '#e9b28b', build: { h: 1, w: 1 }, shoes: 'sneaker', tie: 'black', instrument: 'sticks' },
    special: { id: 'rullo', name: 'RULLO DI TAMBURI', desc: 'RAFFICA DI COLPI E PIATTO VOLANTE' },
    quotes: { start: 'TENGO IO IL TEMPO!', special: 'RULLO!', win: 'E QUESTO ERA IL FINALE.' },
    traits: ['CIUFFO', 'BARBA CORTA', 'OCCHIALINI TONDI NERI', 'BACCHETTE'],
  },
  {
    id: 'marvin', name: 'MARVIN', role: 'PIANO', instName: 'TASTIERA', family: 'keys',
    stats: { str: 4, spd: 2, rch: 4, end: 3 }, color: '#ff9b45',
    look: { headSpec: HEAD_SPECS.marvin, skin: '#eab48d', build: { h: 1.06, w: 0.92 }, shoes: 'sneaker', tie: 'black', instrument: 'keys', worn: { u: 5, v: 19, a: -8, g: 'mid' } },
    special: { id: 'grancoda', name: 'GRAN CODA', desc: 'UN PIANOFORTE CADE DAL CIELO' },
    quotes: { start: 'IN DO MAGGIORE!', special: 'FORTISSIMO!', win: 'APPLAUSI, PREGO.' },
    traits: ['CAPELLI ALL\'INDIETRO', 'BARBA', 'OCCHIALI TONDI', 'ALTO E SLANCIATO'],
  },
];
CAST.forEach(c => { c.look.id = c.id; });

// Alleati: da completare quando arrivano le informazioni (non giocabili)
const ALLIES = [
  { id: 'ray', name: 'RAY', role: 'BASSO (SOSTITUTO)', status: 'da confermare' },
  { id: 'benedict', name: 'BENEDICT', role: 'BASSO (SOSTITUTO)', status: 'da confermare' },
  { id: 'ally3', name: '???', role: 'DA DEFINIRE', status: 'segnaposto' },
  { id: 'ally4', name: '???', role: 'DA DEFINIRE', status: 'segnaposto' },
];

// Le statistiche diventano valori concreti qui: bilanciare = cambiare un numero
function deriveStats(c) {
  const s = c.stats;
  return {
    walkX: 1.65 + s.spd * 0.16,
    walkZ: 1.05 + s.spd * 0.1,
    run: 3.6 + s.spd * 0.26,
    atkSpeed: 0.86 + s.spd * 0.05,      // moltiplicatore della velocità di animazione
    dmg: 0.74 + s.str * 0.12,
    reach: s.rch,
    maxHp: 70 + s.end * 12,
    defense: 1.12 - s.end * 0.06,       // moltiplicatore del danno subito
  };
}
