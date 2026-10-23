// ============================================================
// INPUT: tastiera (1 o 2 giocatori), gamepad (fino a 4), touch
// Ogni "sorgente" produce lo stesso stato: direzioni + 4 azioni + start
// ============================================================
const ACTIONS = ['left', 'right', 'up', 'down', 'atk', 'jump', 'heavy', 'spec', 'start', 'back'];

const KEYMAP = {
  // tastiera unica (un solo giocatore su tastiera): tutti i tasti valgono
  solo: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    atk: ['KeyJ', 'KeyZ', 'KeyF', 'Numpad1'], jump: ['KeyK', 'KeyX', 'KeyG', 'Space', 'Numpad2'],
    heavy: ['KeyL', 'KeyC', 'KeyH', 'Numpad3'], spec: ['KeyI', 'KeyV', 'KeyT', 'Numpad0'],
    start: ['Enter', 'KeyP', 'NumpadEnter'], back: ['Escape', 'Backspace'],
  },
  // due giocatori sulla stessa tastiera
  kbA: {
    left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
    atk: ['KeyF'], jump: ['KeyG'], heavy: ['KeyH'], spec: ['KeyT'], start: ['Digit1'], back: ['Escape'],
  },
  kbB: {
    left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
    atk: ['Numpad1', 'Comma', 'KeyJ'], jump: ['Numpad2', 'Period', 'KeyK'], heavy: ['Numpad3', 'Slash', 'KeyL'],
    spec: ['Numpad0', 'KeyI'], start: ['Enter', 'NumpadEnter'], back: ['Backspace'],
  },
};
const PREVENT = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);

const Input = {
  keys: new Set(),
  touch: { left: false, right: false, up: false, down: false, atk: false, jump: false, heavy: false, spec: false, start: false, back: false },
  tapped: new Set(), touchTap: new Set(),
  touchSeen: false,
  splitKeyboard: false,      // true quando ci sono 2 giocatori su tastiera
  sources: {},               // id -> {held, prev, pressed}
  anyPressedSource: null,
  lastKeyCode: null,

  init() {
    window.addEventListener('keydown', e => {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!e.repeat) { this.lastKeyCode = e.code; this.tapped.add(e.code); }
      this.keys.add(e.code);
      Audio2.unlock();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('pointerdown', () => Audio2.unlock(), true);
    // tocco o clic sullo schermo di gioco = START (titolo e menu)
    const scr = document.getElementById('screen');
    if (scr) scr.addEventListener('pointerdown', e => { e.preventDefault(); if (typeof Game !== 'undefined' && Game.name !== 'play') this.touchTap.add('start'); if (e.pointerType === 'touch') { this.touchSeen = true; Touch.update(); } });
    window.addEventListener('blur', () => this.keys.clear());
    ['kb', 'kbA', 'kbB', 'touch', 'pad0', 'pad1', 'pad2', 'pad3'].forEach(id => this.sources[id] = this._blank());
  },
  _blank() { const o = { held: {}, prev: {}, pressed: {} }; ACTIONS.forEach(a => { o.held[a] = false; o.prev[a] = false; o.pressed[a] = false; }); return o; },

  _setFrom(src, getter) {
    for (const a of ACTIONS) { src.prev[a] = src.held[a]; src.held[a] = !!getter(a); src.pressed[a] = src.held[a] && !src.prev[a]; }
  },

  poll() {
    const k = this.keys;
    const tp = this.tapped;
    const kdown = (map, a) => (map[a] || []).some(c => k.has(c) || tp.has(c));
    this._setFrom(this.sources.kb, a => kdown(KEYMAP.solo, a));
    this._setFrom(this.sources.kbA, a => kdown(KEYMAP.kbA, a));
    this._setFrom(this.sources.kbB, a => kdown(KEYMAP.kbB, a));
    this._setFrom(this.sources.touch, a => this.touch[a] || this.touchTap.has(a));
    this.tapped.clear(); this.touchTap.clear();
    let pads = [];
    try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; } catch (e) { pads = []; }
    for (let i = 0; i < 4; i++) {
      const gp = pads[i];
      const src = this.sources['pad' + i];
      if (!gp || !gp.connected) { this._setFrom(src, () => false); src.connected = false; continue; }
      src.connected = true;
      const b = n => gp.buttons[n] && (gp.buttons[n].pressed || gp.buttons[n].value > 0.5);
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, dz = 0.42;
      this._setFrom(src, a => {
        switch (a) {
          case 'left': return ax < -dz || b(14);
          case 'right': return ax > dz || b(15);
          case 'up': return ay < -dz || b(12);
          case 'down': return ay > dz || b(13);
          case 'atk': return b(2);
          case 'jump': return b(0);
          case 'heavy': return b(3) || b(5);
          case 'spec': return b(1) || b(4);
          case 'start': return b(9);
          case 'back': return b(8);
        }
      });
    }
  },

  // Sorgente "menu": qualsiasi dispositivo
  menu() {
    const o = { left: false, right: false, up: false, down: false, atk: false, jump: false, heavy: false, spec: false, start: false, back: false };
    for (const id in this.sources) { if (id.startsWith('cpu')) continue; const s = this.sources[id]; for (const a of ACTIONS) if (s.pressed[a]) o[a] = true; }
    return o;
  },
  // Quale sorgente ha appena premuto un pulsante di conferma (per entrare in partita)
  joinPress(excluded) {
    const order = ['kb', 'pad0', 'pad1', 'pad2', 'pad3', 'touch'];
    for (const id of order) {
      if (excluded.includes(id)) continue;
      const s = this.sources[id];
      if (s.pressed.atk || s.pressed.start || s.pressed.jump) return id;
    }
    // secondo giocatore su tastiera: tasto 2
    if (!excluded.includes('kbB') && excluded.includes('kb') && this.keys.has('Digit2')) return 'kbB';
    return null;
  },
  // Stato da usare per un giocatore legato a una sorgente
  state(id) {
    if (id === 'kb' && this.splitKeyboard) return this.sources.kbA;
    return this.sources[id] || this.sources.kb;
  },
  clearEdges() { for (const id in this.sources) if (!id.startsWith('cpu')) for (const a of ACTIONS) this.sources[id].pressed[a] = false; },
};

// ---------- Controlli touch (HTML sopra il canvas) ----------
const Touch = {
  el: null, stick: null, knob: null, active: false, stickId: null, stickOrigin: null, mode: 'auto',
  init() {
    this.el = document.getElementById('touch');
    this.stick = document.getElementById('stick');
    this.knob = document.getElementById('knob');
    const btns = this.el.querySelectorAll('[data-act]');
    btns.forEach(b => {
      const act = b.dataset.act;
      const down = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) { } Input.touch[act] = true; Input.touchTap.add(act); b.classList.add('on'); Audio2.unlock(); };
      const up = e => { e.preventDefault(); Input.touch[act] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    });
    const zone = document.getElementById('stickzone');
    zone.addEventListener('pointerdown', e => {
      e.preventDefault(); Audio2.unlock();
      if (this.stickId !== null) return;
      this.stickId = e.pointerId; try { zone.setPointerCapture(e.pointerId); } catch (er) { }
      const r = zone.getBoundingClientRect();
      this.stickOrigin = [e.clientX, e.clientY];
      this.stick.style.left = (e.clientX - r.left) + 'px'; this.stick.style.top = (e.clientY - r.top) + 'px';
      this.stick.classList.add('on');
      this._move(e.clientX, e.clientY);
    });
    zone.addEventListener('pointermove', e => { if (e.pointerId === this.stickId) { e.preventDefault(); this._move(e.clientX, e.clientY); } });
    const end = e => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null; this.stick.classList.remove('on');
      Input.touch.left = Input.touch.right = Input.touch.up = Input.touch.down = false;
      this.knob.style.transform = 'translate(-50%,-50%)';
    };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
    window.addEventListener('touchstart', () => { if (!Input.touchSeen) { Input.touchSeen = true; this.update(); } }, { passive: true });
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) Input.touchSeen = true;
    this.update();
  },
  _move(x, y) {
    const [ox, oy] = this.stickOrigin;
    let dx = x - ox, dy = y - oy;
    const max = 38, d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const t = 13;
    Input.touch.left = dx < -t; Input.touch.right = dx > t; Input.touch.up = dy < -t; Input.touch.down = dy > t;
  },
  update() {
    const show = this.mode === 'sempre' || (this.mode === 'auto' && Input.touchSeen);
    this.active = show;
    document.body.classList.toggle('has-touch', show);
    if (typeof resize === 'function') resize();
  },
};
