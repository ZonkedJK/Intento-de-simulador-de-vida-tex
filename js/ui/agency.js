/* Mil Vidas — secciones de la hoja de empresa: agencia de eSports y agencia de representación. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const title = (t) => h('h3', { class: 'section-title' }, t);
  const note = (t) => h('p', { class: 'note' }, t);
  const A = () => MV.sys.agency;
  UI.companyExtras = UI.companyExtras || {};

  UI.companyExtras.esports = function (body, g, c) {
    const s = c.lastSeason;
    body.append(title(`Equipo (${A().size(c, g.p)}/5) · reputación ${c.rep || 0}`));
    if (s && s.league) body.append(note(`Última temporada: ${s.place}.º en la ${MV.ESPORTS_LEAGUES[s.league].name.toLowerCase()}${s.prize ? `, premio ${U.money(s.prize)}` : ''}.`));
    else body.append(note('Con 3 jugadores o más, el equipo compite cada temporada. La liga depende de la reputación.'));
    const l = h('div', { class: 'list' });
    if (c.selfPlay) l.append(UI.row('😎', 'Tú', 'Juegas en tu propio equipo', null, null));
    (c.roster || []).forEach((x) => l.append(UI.row('🎧', `"${x.alias}"`, `${x.first} ${x.last} · habilidad ${x.skill} · ${U.money(x.salary)} al año`, 'Vender', () => UI.confirm(`¿Vender a "${x.alias}" por ${U.money(A().fee(x.skill))}?`, () => UI.runSystem('💸', () => A().sellPlayer(g, c.id, x.id)), 'Vender'))));
    if (A().size(c, g.p) < 5) l.append(UI.row('➕', 'Fichar un jugador', '3 jugadores libres este año', '›', () => showPlayers(c.id)));
    const p = g.p;
    if (!c.selfPlay && p.job && p.job.id === 'sport_esports' && A().size(c, g.p) < 5) l.append(UI.row('😎', 'Jugar en tu propio equipo', 'Eres gamer profesional: súmate al plantel', null, () => UI.runSystem('😎', () => A().joinOwnTeam(g, c.id))));
    body.append(l);
  };

  function showPlayers(cid) {
    UI.sheet({
      title: 'Fichar un jugador', icon: '🕹️',
      render: (body) => {
        const g = UI.g, list = A().players(g, cid);
        if (!list.length) { body.append(note('No quedan jugadores libres este año.')); return; }
        const l = h('div', { class: 'list' });
        const c = MV.sys.company.get(g, cid);
        body.append(note(`Caja: ${U.money(c ? c.cash : 0)}. El pase se paga al fichar y lo recuperas si lo vendes.`));
        list.forEach((x, i) => l.append(UI.row('🎧', `"${x.alias}"`, `${x.first} ${x.last}, ${x.age} años · habilidad ${x.skill} · pase ${U.money(A().fee(x.skill))} · ${U.money(x.salary)} al año`, null, () => { UI.popSheet(); UI.runSystem('🕹️', () => A().sign(g, cid, i)); }, !c || c.cash < A().fee(x.skill))));
        body.append(l);
      }
    });
  }

  UI.companyExtras.representacion = function (body, g, c) {
    const list = c.clients || [];
    body.append(title(`Clientes (${list.length}/10) · reputación ${c.rep || 0}`));
    const l = h('div', { class: 'list' });
    list.forEach((x) => {
      const P = MV.AGENCY_PROFS[x.prof], n = P.name.split('|')[x.gender === 'f' ? 1 : 0];
      l.append(UI.row(P.icon, `${x.first} ${x.last}`, `${n} · nivel ${x.level} · gana ${U.money(x.salary)} · te deja ${U.money(Math.round(x.salary * x.commission))} (${Math.round(x.commission * 100)} %)`, null, null));
    });
    if (list.length < 10) l.append(UI.row('🔭', 'Buscar talentos', '3 talentos sin agencia este año', '›', () => showTalents(c.id)));
    body.append(l);
  };

  function showTalents(cid) {
    const st = { com: 0.15 };
    UI.sheet({
      title: 'Buscar talentos', icon: '🔭',
      render: (body) => {
        const g = UI.g, list = A().talents(g, cid);
        body.append(note('Elige tu comisión: más alta, más ganas, pero menos talentos aceptan.'));
        const cr = h('div', { class: 'font-row', role: 'radiogroup', 'aria-label': 'Comisión' });
        [0.1, 0.15, 0.2].forEach((v) => cr.append(h('button', { type: 'button', id: 'rep-com-' + Math.round(v * 100), class: 'chip-btn' + (st.com === v ? ' on' : ''), role: 'radio', 'aria-checked': String(st.com === v), onclick: () => { st.com = v; UI.refreshSheets(); } }, `${Math.round(v * 100)} %`)));
        body.append(cr);
        if (!list.length) { body.append(note('No quedan talentos libres este año.')); return; }
        const l = h('div', { class: 'list' });
        list.forEach((x, i) => {
          const P = MV.AGENCY_PROFS[x.prof], n = P.name.split('|')[x.gender === 'f' ? 1 : 0];
          l.append(UI.row(P.icon, `${x.first} ${x.last}`, `${n} · nivel ${x.level} · gana ${U.money(x.salary)} al año`, null, () => { UI.popSheet(); UI.runSystem('✍️', () => A().signClient(g, cid, i, st.com)); }));
        });
        body.append(l);
      }
    });
  }
})(window.MV = window.MV || {});
