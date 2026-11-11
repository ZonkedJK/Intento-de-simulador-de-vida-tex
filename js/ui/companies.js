/* Mil Vidas — hojas de empresas propias: fundar, resumen, empleados, marketing, caja y opciones. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const title = (t) => h('h3', { class: 'section-title' }, t);
  const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('span', null, v));
  const note = (t) => h('p', { class: 'note' }, t);
  const C = () => MV.sys.company;
  /** Secciones propias de cada tipo (las agregan studio y agency): UI.companyExtras[type](body, g, c). */
  UI.companyExtras = UI.companyExtras || {};

  /** Bloque "Mis empresas" de Ocupación. */
  UI.companiesSection = function (body) {
    const g = UI.g, p = g.p, list = p.companies || [];
    if (p.age < 18 && !list.length) return;
    body.append(title(`Mis empresas (${C().count(p)}/${C().MAX})`));
    const l = h('div', { class: 'list' });
    list.forEach((c) => {
      const K = MV.COMPANY_TYPES[c.type];
      l.append(UI.row(K.icon, c.name, `${K.name} · caja ${U.money(c.cash)} · vale ${U.money(c.value)}`, '›', () => UI.showCompany(c.id)));
    });
    if (C().count(p) < C().MAX && p.age >= 18) l.append(UI.row('🏗️', 'Fundar una empresa', 'Estudio de juegos, apps, red social o agencias', '›', () => UI.showFoundCompany(), !!p.prison));
    else if (!list.length) l.append(UI.row('🏗️', 'Fundar una empresa', `Ya tienes ${C().MAX} (contando tu negocio)`, null, null, true));
    body.append(l);
  };

  UI.showFoundCompany = function () {
    UI.sheet({
      title: 'Fundar una empresa', icon: '🏗️',
      render: (body) => {
        const g = UI.g, p = g.p;
        body.append(note(`Tienes ${U.money(p.money)}. El costo inicial va a la caja de la empresa: de ahí salen sueldos y gastos.`));
        const inp = h('input', { id: 'co-name', class: 'act-search', type: 'text', maxlength: '40', placeholder: 'Nombre de tu empresa', 'aria-label': 'Nombre de tu empresa' });
        body.append(inp);
        const l = h('div', { class: 'list' });
        Object.keys(MV.COMPANY_TYPES).forEach((k) => {
          const K = MV.COMPANY_TYPES[k];
          l.append(UI.row(K.icon, K.name, `${U.money(K.cost)} · ${K.desc}`, null, () => { const name = inp.value; UI.popSheet(); UI.runSystem(K.icon, () => C().found(g, k, name)); }, p.money < K.cost));
        });
        body.append(l);
      }
    });
  };

  UI.showCompany = function (cid) {
    UI.sheet({
      title: 'Tu empresa', icon: '🏢',
      render: (body) => {
        const g = UI.g, p = g.p, c = C().get(g, cid);
        if (!c) { body.append(note('Esta empresa ya no es tuya.')); return; }
        const K = MV.COMPANY_TYPES[c.type], L = c.last;
        body.append(h('div', { class: 'box' }, h('p', null, h('b', null, `${K.icon} ${c.name}`)), kv('Tipo', K.name), kv('Caja', U.money(c.cash)),
          kv('Valuación', U.money(c.value)), kv('Último año', `${U.money(L.revenue)} de ingresos − ${U.money(L.costs)} de gastos = ${L.result >= 0 ? '+' : '−'}${U.money(Math.abs(L.result))}`),
          c.redYears ? h('p', { class: 'note' }, '⚠️ La caja está en rojo. Otro año así y quiebra.') : null));
        if ((c.hist || []).length >= 2) { const d = h('div', { class: 'viz-fig' }); d.innerHTML = UI.lineChart([{ key: 'v', name: 'Valuación', color: 'var(--series-1)', values: c.hist.map((x) => x.value) }], { xs: c.hist.map((x) => x.age), title: 'Valuación por edad', fmt: (v) => U.moneyShort(v), zero: true }); body.append(d); }
        if (p.prison) { body.append(note('Desde la cárcel no puedes manejarla. Sigue funcionando sola, como puede.')); return; }
        if (UI.companyExtras[c.type]) UI.companyExtras[c.type](body, g, c);
        // Empleados
        body.append(title(`Empleados (${c.staff.length})`));
        const sl = h('div', { class: 'list' });
        c.staff.forEach((e) => sl.append(UI.row(MV.COMPANY_ROLES[e.role].icon, `${e.first} ${e.last}`, `${C().roleName(e.role, e.gender)} · nivel ${e.level} · ${U.money(e.salary)} al año`, '›', () => showEmployee(cid, e.id))));
        sl.append(UI.row('➕', 'Contratar', 'Elige el puesto y entre 3 candidatos', '›', () => showHire(cid)));
        body.append(sl);
        // Marketing
        body.append(title('Marketing anual'));
        const mr = h('div', { class: 'font-row', role: 'radiogroup', 'aria-label': 'Marketing' });
        Object.keys(MV.MARKETING).forEach((k) => mr.append(h('button', { type: 'button', id: 'co-mkt-' + k, class: 'chip-btn' + (c.marketing === k ? ' on' : ''), role: 'radio', 'aria-checked': String(c.marketing === k),
          onclick: () => { C().setMarketing(g, cid, k); UI.save(); UI.refreshSheets(); } }, `${MV.MARKETING[k].name}${MV.MARKETING[k].cost ? ' · ' + U.money(MV.MARKETING[k].cost) : ''}`)));
        body.append(mr);
        // Bolsa
        body.append(title('Bolsa'));
        const bl = h('div', { class: 'list' });
        if (c.public) {
          bl.append(UI.row('📈', `Cotiza como ${c.public.ticker}`, `Tienes el ${Math.round(c.public.stake * 100)} %. Con dos años seguidos de pérdidas, la junta puede echarte.`, '›', () => UI.showStock(c.public.ticker)));
          bl.append(UI.row('🔁', 'Recomprar acciones', 'Cuesta 10 % más que su valor. Con el 100 % deja de cotizar', '›', () => showBuyback(cid)));
        } else {
          const can = MV.sys.market.canIpo(g, cid);
          bl.append(UI.row('🔔', 'Salir a bolsa', can.ok ? 'Vendes entre 20 % y 40 % y cobras ese dinero' : can.why, '›', () => showIpo(cid), !can.ok));
        }
        body.append(bl);
        // Caja y opciones
        body.append(title('Caja y opciones'));
        const ol = h('div', { class: 'list' });
        ol.append(UI.row('💸', 'Inyectar dinero', `De tu bolsillo (${U.money(p.money)}) a la caja`, '›', () => showMoney(cid, 'inject')));
        ol.append(UI.row('💰', 'Sacar dividendos', `De la caja (${U.money(c.cash)}) a tu bolsillo`, '›', () => showMoney(cid, 'withdraw'), c.cash <= 0));
        ol.append(UI.row('🏷️', 'Vender la empresa', `Un comprador ofrece entre 80 % y 120 % de ${U.money(c.value)}`, null, () => UI.confirm(`¿Vender ${c.name}?`, () => { UI.popSheet(); UI.runSystem('🏷️', () => C().sell(g, cid)); }, 'Vender')));
        ol.append(UI.row('🚪', 'Cerrar la empresa', 'Despides a todos y te quedas con lo que sobre en la caja', null, () => UI.confirm(`¿Cerrar ${c.name}? Se despide a todo el equipo.`, () => { UI.popSheet(); UI.runSystem('🚪', () => C().close(g, cid)); }, 'Cerrar')));
        body.append(ol);
      }
    });
  };

  function showEmployee(cid, eid) {
    UI.sheet({
      title: 'Empleado', icon: '🧑‍💼',
      render: (body) => {
        const g = UI.g, c = C().get(g, cid), e = c && c.staff.find((x) => x.id === eid);
        if (!e) { body.append(note('Ya no trabaja ahí.')); return; }
        body.append(h('div', { class: 'box' }, h('p', null, h('b', null, `${e.first} ${e.last}`)), kv('Puesto', C().roleName(e.role, e.gender)), kv('Nivel', `${'★'.repeat(e.level)}${'☆'.repeat(5 - e.level)}`), kv('Sueldo', U.money(e.salary) + ' al año'), kv('Ánimo', UI.bar(e.morale))));
        const l = h('div', { class: 'list' });
        l.append(UI.row('📈', 'Subir el sueldo 15 %', `Pasa a ${U.money(Math.round(e.salary * 1.15))}`, null, () => { UI.popSheet(); UI.runSystem('📈', () => C().raise(g, cid, eid)); }));
        l.append(UI.row('📦', 'Despedir', `Indemnización: ${U.money(Math.round(e.salary / 4))} desde la caja`, null, () => UI.confirm(`¿Despedir a ${e.first}?`, () => { UI.popSheet(); UI.runSystem('📦', () => C().fire(g, cid, eid)); }, 'Despedir')));
        body.append(l);
      }
    });
  }

  function showHire(cid) {
    UI.sheet({
      title: 'Contratar', icon: '➕',
      render: (body) => {
        const g = UI.g, c = C().get(g, cid);
        if (!c) { body.append(note('Esta empresa ya no es tuya.')); return; }
        body.append(note('¿Para qué puesto? Más nivel, más sueldo y más rendimiento.'));
        const l = h('div', { class: 'list' });
        MV.COMPANY_TYPES[c.type].roles.concat(['gerente']).forEach((r) => {
          const R = MV.COMPANY_ROLES[r], has = r === 'gerente' && c.staff.some((e) => e.role === 'gerente');
          l.append(UI.row(R.icon, R.name.split('|')[0], r === 'gerente' ? (has ? 'Ya tienes uno' : 'Baja el estrés que te da la empresa') : '', '›', () => showCandidates(cid, r), has));
        });
        body.append(l);
      }
    });
  }

  function showCandidates(cid, role) {
    UI.sheet({
      title: MV.COMPANY_ROLES[role].name.split('|')[0], icon: MV.COMPANY_ROLES[role].icon,
      render: (body) => {
        const g = UI.g, cands = C().candidates(g, cid, role);
        if (!cands.length) { body.append(note('No quedan candidatos para este puesto este año.')); return; }
        const l = h('div', { class: 'list' });
        cands.forEach((x, i) => l.append(UI.row('🙋', `${x.first} ${x.last}`, `Nivel ${'★'.repeat(x.level)}${'☆'.repeat(5 - x.level)} · ${U.money(x.salary)} al año`, null, () => { UI.popSheet(); UI.popSheet(); UI.runSystem('🤝', () => C().hire(g, cid, role, i)); })));
        body.append(l);
      }
    });
  }

  function showIpo(cid) {
    UI.sheet({
      title: 'Salir a bolsa', icon: '🔔',
      render: (body) => {
        const g = UI.g, c = C().get(g, cid);
        if (!c) { body.append(note('Esta empresa ya no es tuya.')); return; }
        body.append(note(`${c.name} vale ${U.money(c.value)}. ¿Qué parte vendes? Lo que vendas lo cobras ahora; con el resto sigues mandando.`));
        const l = h('div', { class: 'list' });
        [0.2, 0.3, 0.4].forEach((pct) => l.append(UI.row('🔔', `${Math.round(pct * 100)} %`, `Cobras ${U.money(Math.round(c.value * pct))} y te quedas con el ${Math.round((1 - pct) * 100)} %`, null, () => { UI.popSheet(); UI.runSystem('🔔', () => MV.sys.market.ipo(g, cid, pct)); })));
        body.append(l);
      }
    });
  }

  function showBuyback(cid) {
    UI.sheet({
      title: 'Recomprar acciones', icon: '🔁',
      render: (body) => {
        const g = UI.g, c = C().get(g, cid);
        if (!c || !c.public) { body.append(note('Esta empresa ya no cotiza.')); return; }
        const rest = Math.round((1 - c.public.stake) * 100) / 100;
        body.append(note(`Tienes el ${Math.round(c.public.stake * 100)} % de ${c.name}. Tienes ${U.money(g.p.money)}.`));
        const l = h('div', { class: 'list' });
        [0.05, 0.1, rest].filter((x, i, a) => x > 0 && x <= rest && a.indexOf(x) === i).forEach((pct) => {
          const cost = Math.round(c.value * pct * 1.1);
          l.append(UI.row('🔁', pct === rest ? `Todo lo que falta (${Math.round(pct * 100)} %)` : `${Math.round(pct * 100)} %`, `Cuesta ${U.money(cost)}`, null, () => { UI.popSheet(); UI.runSystem('🔁', () => MV.sys.market.buyback(g, cid, pct)); }, cost > g.p.money));
        });
        body.append(l);
      }
    });
  }

  function showMoney(cid, kind) {
    UI.sheet({
      title: kind === 'inject' ? 'Inyectar dinero' : 'Sacar dividendos', icon: kind === 'inject' ? '💸' : '💰',
      render: (body) => {
        const g = UI.g, p = g.p, c = C().get(g, cid);
        if (!c) { body.append(note('Esta empresa ya no es tuya.')); return; }
        const max = kind === 'inject' ? p.money : c.cash;
        const l = h('div', { class: 'list' });
        [10000, 50000, 100000, 1000000].forEach((amt) => l.append(UI.row('💵', U.money(amt), '', null, () => { UI.popSheet(); UI.runSystem('💵', () => (kind === 'inject' ? C().inject(g, cid, amt) : C().withdraw(g, cid, amt))); }, amt > max)));
        if (max > 0) l.append(UI.row('💵', kind === 'inject' ? 'Todo tu efectivo' : 'Toda la caja', U.money(max), null, () => { UI.popSheet(); UI.runSystem('💵', () => (kind === 'inject' ? C().inject(g, cid, max) : C().withdraw(g, cid, max))); }));
        body.append(l);
      }
    });
  }
})(window.MV = window.MV || {});
