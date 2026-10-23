// ============================================================
// THE ANABLES: ROCK 'N' BRAWL — configurazione e parametri
// Tutti i valori di gameplay sono qui, per bilanciare in un punto solo.
// Fonti dei valori di partenza: report di ricerca (hit-stop Final Fight /
// The Punisher misurati; il resto sono stime da calibrare con il playtest).
// ============================================================
'use strict';

const W = 384, H = 224;            // risoluzione logica del CP System (384x224)
const K = 1.6;                      // scala del mondo rispetto alla prima versione
const RS = 2;                       // pixel fini per unità del mondo (risoluzione interna 768x448)
const STEP_MS = 1000 / 60;          // update fisso a 60 Hz
const MAX_FRAME_MS = 250;           // limite anti "spirale della morte"

// Corsie: z = coordinata y dei piedi sullo schermo
const LANE_TOP = 140, LANE_BOTTOM = 216;

const TUNE = {
  gravity: 0.45,
  jumpV: 7.2,            // ~58 px di salto
  zTol: 11,              // tolleranza profondità colpi
  zTolGrab: 15,          // prese e speciali
  bufferFrames: 8,       // input buffer
  hsLight: 6,            // hit-stop colpo leggero (Final Fight)
  hsHeavy: 8,
  hsFinA: 9,             // finisher: attaccante
  hsFinV: 11,            // finisher: colpito (The Punisher)
  hsCap: 12,             // tetto massimo
  getupInv: 60,          // invincibilità al rialzo
  respawnInv: 150,
  maxAttackersPerPlayer: 2,
  doubleTap: 14,
  comboWindow: 40,       // frame per tenere viva la combo
  grabHold: 96,
  shakeSmall: 2, shakeBig: 3,
};

// Colori chiave dei giocatori (indicatori, cursori, HUD)
const PCOL = ['#ff4d6d', '#3ec5ff', '#ffd23e', '#62f08e', '#c58bff', '#ff9b45'];
const MAX_PLAYERS = 4;   // Chrome espone max 4 gamepad; architettura pronta per 6

const DIFFS = [
  { id: 'facile', name: 'FACILE', enemyDmg: 0.7, enemyHp: 0.85, aggro: 0.8 },
  { id: 'normale', name: 'NORMALE', enemyDmg: 1.0, enemyHp: 1.0, aggro: 1.0 },
  { id: 'difficile', name: 'DIFFICILE', enemyDmg: 1.35, enemyHp: 1.2, aggro: 1.25 },
];
