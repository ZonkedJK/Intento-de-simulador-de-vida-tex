/* Mil Vidas — secciones de la hoja de empresa: estudio de videojuegos, empresa de apps y red social. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const title = (t) => h('h3', { class: 'section-title' }, t);
  const note = (t) => h('p', { class: 'note' }, t);
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  UI.companyExtras = UI.companyExtras || {};

  /** Hoja de nombre + género + opciones finales (tamaños de juego o crear app). */
  function showMaker(kind, cid) {
    const st = { genre: MV.WORK_KINDS[kind].genres[0].id, name: '' };
    UI.sheet({
      title: kind === 'juego' ? 'Nuevo juego' : 'Nueva app', icon: MV.WORK_KINDS[kind].icon,
      render: (body) => {
        const g = UI.g, c = MV.sys.company.get(g, cid);
        if (!c) { body.append(note('Esta empresa ya no es tuya.')); return; }
        body.append(note(`Caja de ${c.name}: ${U.money(c.cash)}.`));
        const inp = h('input', { id: kind === 'juego' ? 'game-name' : 'app-name', class: 'act-search', type: 'text', maxlength: '40', value: st.name, placeholder: kind === 'juego' ? 'Nombre del juego' : 'Nombre de la app', 'aria-label': 'Nombre', oninput: (e) => { st.name = e.target.value; } });
        body.append(inp, title('Género'));
        const gr = h('div', { class: 'font-row', role: 'radiogroup', 'aria-label': 'Género' });
        MV.WORK_KINDS[kind].genres.forEach((x) => gr.append(h('button', { type: 'button', id: `${kind === 'juego' ? 'game' : 'app'}-genre-${x.id}`, class: 'chip-btn' + (st.genre === x.id ? ' on' : ''), role: 'radio', 'aria-checked': String(st.genre === x.id), onclick: () => { st.genre = x.id; UI.refreshSheets(); } }, x.name)));
        body.append(gr);
        const l = h('div', { class: 'list' });
        if (kind === 'juego') {
          body.append(title('Tamaño'));
          Object.keys(MV.STUDIO_SIZES).forEach((k) => { const Z = MV.STUDIO_SIZES[k]; l.append(UI.row('🎮', Z.name, `${U.money(Z.cost)} · ${Z.years} año${Z.years === 1 ? '' : 's'} de desarrollo`, null, () => { UI.popSheet(); UI.runSystem('🎮', () => MV.sys.studio.startGame(g, cid, st.name, st.genre, k)); }, c.cash < Z.cost)); });
        } else l.append(UI.row('📱', 'Programar la app', '$30.000 de la caja · sale el año que viene', null, () => { UI.popSheet(); UI.runSystem('📱', () => MV.sys.studio.newApp(g, cid, st.name, st.genre)); }, c.cash < 30000));
        body.append(l);
      }
    });
  }

  UI.companyExtras.estudio = function (body, g, c) {
    body.append(title('Juegos'));
    const l = h('div', { class: 'list' });
    if (c.project) { const Z = MV.STUDIO_SIZES[c.project.size]; l.append(UI.row('🛠️', `En desarrollo: "${c.project.name}"`, `${Z.name} · sale en ${c.project.left} año${c.project.left === 1 ? '' : 's'}`, null, null)); }
    else l.append(UI.row('🚀', 'Empezar un juego', 'Chico, mediano o AAA, pagado desde la caja', '›', () => showMaker('juego', c.id)));
    (c.games || []).slice().reverse().slice(0, 6).forEach((x) => l.append(UI.row('🎮', x.name, `${stars(x.stars)} · lanzamiento ${U.money(x.launch)}`, null, null)));
    body.append(l);
  };

  UI.companyExtras.apps = function (body, g, c) {
    body.append(title('Apps'));
    const l = h('div', { class: 'list' });
    const dev = (c.apps || []).find((a) => a.age < 0);
    if (dev) l.append(UI.row('🛠️', `En desarrollo: "${dev.name}"`, 'Sale el año que viene', null, null));
    else l.append(UI.row('➕', 'Crear una app', '$30.000 de la caja', '›', () => showMaker('app', c.id)));
    (c.apps || []).filter((a) => a.age >= 0).forEach((a) => l.append(UI.row('📱', a.name, `${stars(a.stars)} · ${U.num(a.subs)} suscriptores · ${U.money(a.subs * 30)} al año`, null, null)));
    body.append(l);
  };

  UI.companyExtras.social = function (body, g, c) {
    body.append(title('Usuarios'));
    const users = c.users == null ? 1000 : c.users;
    body.append(h('div', { class: 'box' }, h('p', null, h('b', null, `🌐 ${U.num(users)} usuarios`)), note(`La publicidad paga $2 por usuario al año: ${U.money(users * 2)}. Crecen con programadores, marketing y suerte.`)));
  };
})(window.MV = window.MV || {});
