// ---------------- avvio (compatibile con l'aggiornamento a caldo dell'artifact) ----------------
(function () {
  if (!document.getElementById('screen')) return; // pagine di test senza schermo
  const portraitCheck = () => document.body.classList.toggle('portrait', window.innerHeight > window.innerWidth * 1.05);
  window.addEventListener('resize', portraitCheck);
  portraitCheck();
  const _origResize = resize;
  resize = function () {
    portraitCheck();
    const stage = document.getElementById('stage');
    if (document.body.classList.contains('has-touch') && document.body.classList.contains('portrait')) {
      const w = document.body.clientWidth - 32;
      stage.style.height = Math.round(w * 9 / 16 + 16) + 'px';
    } else stage.style.height = '';
    _origResize();
  };
  const start = () => boot();
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start();
})();
