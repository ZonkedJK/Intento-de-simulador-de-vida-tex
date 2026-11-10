/* Mil Vidas — sección de la isla en la ficha del bien: desarrollar, mejorar y cerrar el proyecto. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const I = () => MV.sys.island;

  UI.islandSection = function (body, a) {
    const g = UI.g, p = g.p;
    body.append(h('h3', { class: 'section-title' }, 'Proyecto de la isla'));
    const pr = a.project;
    if (!pr) {
      body.append(h('div', { class: 'list' }, UI.row('🏗️', 'Desarrollar la isla', 'Resort, parque temático, casino o reserva natural', '›', () => showTypes(a.id))));
      return;
    }
    const T = MV.ISLAND_TYPES[pr.type];
    body.append(h('div', { class: 'box', id: 'island-project' },
      h('p', { style: { margin: 0 } }, h('b', null, `${T.icon} ${pr.name}`), ` · ${T.name}`),
      pr.mascot ? h('p', { class: 'note', style: { margin: '2px 0' } }, `Mascota: ${pr.mascot}`) : null,
      h('div', { class: 'kv' }, h('span', null, 'Nivel'), h('span', null, '★'.repeat(pr.level) + '☆'.repeat(I().MAX_LEVEL - pr.level))),
      h('div', { class: 'kv' }, h('span', null, 'Reputación'), h('span', { style: { width: '120px' } }, UI.bar(pr.rep))),
      h('div', { class: 'kv' }, h('span', null, 'Ganancia del último año'), h('span', null, pr.last ? U.money(pr.last) : 'Todavía nada'))));
    const l = h('div', { class: 'list' });
    if (pr.level < I().MAX_LEVEL) {
      const cost = I().upgradeCost(a);
      l.append(UI.row('⬆️', `Mejorar al nivel ${pr.level + 1}`, `${U.money(cost)}. Más ganancias y reputación`, null, () => UI.runSystem('⬆️', () => I().upgrade(g, a.id)), p.money < cost));
    } else l.append(UI.row('🏆', 'Nivel máximo', 'Ya no se puede mejorar más', null, null));
    l.append(UI.row('🚧', 'Cerrar el proyecto', 'Vuelve a ser una isla sola y pierde valor', null, () => UI.confirm(`¿Cerrar ${pr.name}?`, () => UI.runSystem('🚧', () => I().close(g, a.id)), 'Cerrar')));
    body.append(l);
  };

  function showTypes(assetId) {
    UI.sheet({
      title: 'Desarrollar la isla', icon: '🏗️',
      render: (body) => {
        const g = UI.g;
        body.append(h('p', { class: 'note' }, `Tienes ${U.money(g.p.money)}. Cada año gana según el nivel, la reputación y las noticias del mundo.`));
        const l = h('div', { class: 'list' });
        Object.keys(MV.ISLAND_TYPES).forEach((k) => {
          const T = MV.ISLAND_TYPES[k];
          l.append(UI.row(T.icon, T.name, `${U.money(T.cost)}. ${T.desc}`, '›', () => showName(assetId, k), g.p.money < T.cost));
        });
        body.append(l);
      }
    });
  }

  function showName(assetId, type) {
    const T = MV.ISLAND_TYPES[type];
    UI.sheet({
      title: T.name, icon: T.icon,
      render: (body) => {
        const name = h('input', { class: 'input', id: 'island-name', maxlength: '40', placeholder: 'Nombre del proyecto', autocomplete: 'off' });
        const field = (label, id, input, pool) => h('div', { class: 'field' }, h('label', { for: id }, label),
          h('div', { class: 'input-row' }, input, h('button', { type: 'button', class: 'btn', 'aria-label': 'Al azar', onclick: () => { input.value = U.pick(pool); } }, '🎲')));
        body.append(field('Nombre', 'island-name', name, T.names));
        let mascot = null;
        if (T.mascot) { mascot = h('input', { class: 'input', id: 'island-mascot', maxlength: '40', placeholder: 'Nombre de la mascota', autocomplete: 'off' }); body.append(field('Mascota', 'island-mascot', mascot, T.mascots)); }
        body.append(h('p', { class: 'note' }, T.desc),
          h('button', { type: 'button', class: 'btn primary block', id: 'island-go', onclick: () => {
            const n = name.value, m = mascot ? mascot.value : '';
            UI.closeSheets();
            UI.runSystem(T.icon, () => I().develop(UI.g, assetId, type, n, m));
          } }, `🏗️ Construir (${U.money(T.cost)})`));
      }
    });
  }
})(window.MV = window.MV || {});
