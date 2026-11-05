/* Mil Vidas — arranque de la aplicación. */
(function (MV) {
  'use strict';
  if (typeof document === 'undefined') return; // en Node (pruebas) no hay interfaz
  const UI = MV.UI;

  MV.onAch = (A) => UI.toast(A.icon, 'Logro desbloqueado', `${A.name}: ${A.desc}`, 4200);

  function boot() {
    UI.applyTheme();
    let g = null;
    try { g = MV.loadGame(); } catch (e) { console.error(e); }
    if (g && !g.over) { UI.g = g; UI.renderGame(); UI.flushQueue(); }
    else UI.showCover();
  }

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') {
      const top = UI.topLayer();
      if (top && top.kind === 'sheet') { e.preventDefault(); UI.popSheet(); }
      return;
    }
    if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && UI.g && !UI.g.over && !UI.anyLayer() && UI.refs && document.body.contains(UI.refs.nav)) {
      e.preventDefault();
      UI.ageUp();
    }
  });

  window.addEventListener('error', (e) => { if (MV.debug) console.error(e.error || e.message); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.MV = window.MV || {});
