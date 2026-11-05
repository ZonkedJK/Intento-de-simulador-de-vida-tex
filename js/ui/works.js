/* Mil Vidas — hoja para crear una obra (título y género) y lista de "Mis obras". */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);

  UI.showWorkStudio = function (action) {
    const g = UI.g, K = MV.WORK_KINDS[action.work];
    if (MV.usesLeft(g, action) <= 0) { UI.toast('⏳', '', 'Ya hiciste una este año. La inspiración también descansa.'); return; }
    UI.sheet({
      title: action.label, icon: action.icon,
      render: (body) => {
        const input = h('input', { class: 'input', id: 'work-title', maxlength: String(MV.sys.works.MAX_TITLE), placeholder: `Título de ${K.noun}`, autocomplete: 'off' });
        const genre = h('select', { class: 'select', id: 'work-genre', 'aria-label': 'Género' }, K.genres.map((x) => h('option', { value: x.id }, x.name)));
        const dice = h('button', { type: 'button', class: 'btn', 'aria-label': 'Título al azar', onclick: () => { input.value = MV.sys.works.randomTitle(action.work); } }, '🎲');
        body.append(
          h('div', { class: 'field' }, h('label', { for: 'work-title' }, 'Título'), h('div', { class: 'input-row' }, input, dice)),
          h('div', { class: 'field' }, h('label', { for: 'work-genre' }, 'Género'), genre),
          h('p', { class: 'note' }, `La crítica mira tu ${MV.SKILLS[K.skill].name.toLowerCase()}, tu inteligencia y tu fama. Algunos géneros te favorecen más que otros.`),
          h('button', { type: 'button', class: 'btn primary block', id: 'work-go', onclick: () => {
            const title = input.value;
            UI.closeSheets();
            UI.execAction(action, { title, genre: genre.value });
          } }, K.action));
        setTimeout(() => input.focus(), 0);
      }
    });
  };

  /** Lista de obras del jugador para la ficha personal. */
  UI.worksList = function () {
    const ws = (UI.g.p.works || []).slice().reverse();
    if (!ws.length) return h('p', { class: 'note', id: 'works-list', style: { margin: 0 } }, 'Todavía no creaste nada. En Actividades → Ocio puedes escribir, componer o pintar.');
    const list = h('div', { class: 'list', id: 'works-list' });
    ws.forEach((w) => { const L = MV.sys.works.label(w); list.append(UI.row(L.icon, L.title, L.sub, null, null)); });
    return list;
  };
})(window.MV = window.MV || {});
