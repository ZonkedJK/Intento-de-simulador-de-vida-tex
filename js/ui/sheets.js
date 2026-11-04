/* Mil Vidas — pestañas: Ocupación, Bienes, Relaciones y Actividades. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const title = (t) => h('h3', { class: 'section-title' }, t);
  const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('span', null, v));
  const note = (t) => h('p', { class: 'note' }, t);

  /** Ejecuta una función del sistema que devuelve un texto y muestra el resultado. */
  UI.runSystem = function (icon, fn) {
    const g = UI.g;
    MV.fx.begin();
    let msg;
    try { msg = fn(); } catch (e) { console.error(e); msg = 'Algo falló. Prueba de nuevo.'; }
    const deltas = MV.fx.end();
    if (msg) MV.log(g, msg, icon);
    UI.save();
    UI.refreshGame(true);
    const finish = () => {
      if (g.over) { UI.closeSheets(); UI.showDeath(); return; }
      if (g.queue.length) UI.flushQueue(() => UI.refreshSheets());
      else UI.refreshSheets();
    };
    if (msg) UI.showResult({ msg, deltas, icon }, finish);
    else finish();
  };

  // ——————————————————— OCUPACIÓN ———————————————————
  UI.showWork = function () {
    UI.sheet({ title: 'Ocupación', icon: '💼', render: renderWork });
  };

  function renderWork(body) {
    const g = UI.g, p = g.p;
    if (p.prison) {
      const pr = p.prison;
      body.append(title(p.age < 18 ? 'Centro de menores' : 'Prisión'),
        h('div', { class: 'box' }, kv('Delito', pr.crime), kv('Condena', `${pr.total} año${pr.total === 1 ? '' : 's'}`), kv('Te faltan', `${pr.left} año${pr.left === 1 ? '' : 's'}`),
          h('div', { class: 'kv' }, h('span', null, 'Conducta'), h('span', { style: { width: '120px' } }, UI.bar(pr.behavior)))),
        UI.actionList(MV.sys.crime.prisonActions(g)));
      return;
    }
    if (p.age < 6) { body.append(h('p', { class: 'empty' }, 'Eres demasiado pequeñ' + U.gw(p.gender, 'o', 'a') + ' para trabajar o estudiar. Tu trabajo es crecer, comer y morder cosas.')); }
    // Estudios
    if (p.edu.stage) {
      const e = p.edu;
      body.append(title('Estudios'), h('div', { class: 'box' },
        kv('Dónde', MV.sys.edu.stageName(e)), kv('Año', `${e.year + 1} de ${MV.sys.edu.yearsOf(e)}`), kv('Promedio', MV.grade(e.perf) + ' / 10'),
        e.payer && e.cost ? kv('Pago', { padres: 'Tus padres', prestamo: 'Préstamo estudiantil', propio: 'Tu dinero' }[e.payer] || '-') : null),
      UI.actionList(MV.sys.edu.actions(g)));
    }
    // Trabajo
    if (p.job) {
      const J = MV.jobById(p.job.id);
      body.append(title('Trabajo'), h('div', { class: 'box' },
        kv('Puesto', MV.sys.career.title(p)), kv('Sector', J.sector), kv('Sueldo', U.money(p.job.salary) + ' al año'),
        kv('Años en la empresa', String(p.job.years)),
        h('div', { class: 'kv' }, h('span', null, 'Rendimiento'), h('span', { style: { width: '120px' } }, UI.bar(p.job.perf)))),
      UI.actionList(MV.sys.career.actions(g)));
    } else if (p.retired) {
      body.append(title('Jubilación'), h('div', { class: 'box' }, kv('Pensión', U.money(p.pension) + ' al año'), h('p', { class: 'note' }, 'Tu trabajo ahora es opinar sobre las obras de construcción.')));
    }
    // Negocio
    if (p.business) {
      const b = p.business, B = MV.BUSINESSES.find((x) => x.id === b.type);
      body.append(title('Tu negocio'), h('div', { class: 'box' }, kv('Negocio', `${B.icon} ${b.name}`), kv('Valor estimado', U.money(b.value)), kv('Resultado del último año', (b.last >= 0 ? '+' : '') + U.money(b.last)), kv('Gerente', b.manager ? 'Sí' : 'Lo manejas tú')));
      const list = h('div', { class: 'list' });
      list.append(UI.row('💸', 'Invertir $10.000 más', 'Aumenta el valor del negocio', null, () => UI.runSystem('💸', () => { if (p.money < 10000) return 'No tienes $10.000.'; MV.fx.money(g, -10000); b.value += 9000; return `Invertiste $10.000 en ${b.name}.`; })));
      list.append(UI.row('🧑‍💼', b.manager ? 'Despedir al gerente' : 'Contratar un gerente', b.manager ? 'Más ganancia, más estrés' : 'Menos estrés, un poco menos de ganancia', null, () => UI.runSystem('🧑‍💼', () => { b.manager = !b.manager; return b.manager ? 'Contrataste un gerente. Por fin duermes.' : 'Despediste al gerente. Vuelves a contestar correos a las 3 a.m.'; })));
      list.append(UI.row('🏷️', 'Vender el negocio', `Valor aproximado: ${U.money(b.value)}`, null, () => UI.confirm(`¿Vender ${b.name}?`, () => UI.runSystem('🏷️', () => MV.sys.money.sellBusiness(g)), 'Vender')));
      body.append(list);
    }
    if (p.age < 14) return;
    body.append(title('Buscar'));
    const opts = h('div', { class: 'list' });
    if (p.age >= 16) opts.append(UI.row('📰', 'Buscar empleo', 'Ofertas de trabajo a tiempo completo', null, () => UI.showJobs('full')));
    opts.append(UI.row('⏱️', 'Trabajos de medio tiempo', 'Compatibles con estudiar', null, () => UI.showJobs('part')));
    opts.append(UI.row('🌟', 'Carreras especiales', 'Actuación, música, deporte, moda y política', null, () => UI.showFame()));
    if (p.age >= 18 && !p.edu.stage) opts.append(UI.row('🎓', 'Estudiar', 'Universidad, técnica, posgrado o escuela nocturna', null, () => UI.showStudy()));
    if (p.age >= 18 && !p.business) opts.append(UI.row('🏪', 'Abrir un negocio', 'Sé tu propio jefe', null, () => UI.showBusiness()));
    body.append(opts);
  }

  UI.showJobs = function (type) {
    UI.sheet({
      title: type === 'part' ? 'Medio tiempo' : 'Bolsa de empleo', icon: '📰',
      render: (body) => {
        const g = UI.g;
        const src = type === 'part' ? MV.PARTTIME : MV.JOBS;
        const items = src.map((J) => ({ J, m: MV.sys.career.meets(g, J) })).sort((a, b) => (b.m.ok - a.m.ok) || (a.J.pay[0] - b.J.pay[0]));
        body.append(note('Postularte lleva a una entrevista. Tu inteligencia, apariencia y carisma ayudan.'));
        const list = h('div', { class: 'list' });
        items.forEach(({ J, m }) => {
          const t = MV.gt(J.titles[0], g.p.gender);
          const sub = m.ok ? `${J.sector}, ${U.money(J.pay[0])} al año` : 'Requiere: ' + m.why.join(', ');
          list.append(UI.row(J.icon, t, sub, m.ok ? 'Postular' : '', () => {
            const r = MV.sys.career.apply(g, J.id);
            if (r) { UI.toast('🚫', t, r); return; }
            UI.flushQueue(() => UI.refreshSheets());
          }, !m.ok));
        });
        body.append(list);
      }
    });
  };

  UI.showFame = function () {
    UI.sheet({
      title: 'Carreras especiales', icon: '🌟',
      render: (body) => {
        const g = UI.g;
        body.append(note('Sueldos variables y fama. Depende de tu talento: apariencia, carisma, música o deporte.'));
        const list = h('div', { class: 'list' });
        Object.values(MV.FAME).filter((J) => J.type === 'fame').forEach((J) => {
          const m = MV.sys.career.meets(g, J);
          const mine = g.p.job && g.p.job.id === J.id;
          list.append(UI.row(J.icon, J.sector, mine ? 'Ya es tu carrera' : m.ok ? `Empiezas como ${MV.gt(J.titles[0], g.p.gender).toLowerCase()}` : 'Requiere: ' + m.why.join(', '), m.ok && !mine ? (J.id === 'politico' ? 'Postularte' : 'Probar') : '', () => {
            const r = MV.sys.career.audition(g, J.id);
            if (r) UI.runSystem(J.icon, () => r);
            else UI.flushQueue(() => UI.refreshSheets());
          }, !m.ok || mine));
        });
        body.append(list);
      }
    });
  };

  UI.showStudy = function () {
    UI.sheet({
      title: 'Estudiar', icon: '🎓',
      render: (body) => {
        const g = UI.g, p = g.p;
        const list = h('div', { class: 'list' });
        if (!p.edu.done.includes('secundaria')) list.append(UI.row('🌙', 'Escuela nocturna', 'Termina la secundaria en 3 años', null, () => { UI.popSheet(); UI.runSystem('🌙', () => MV.sys.edu.enrollNight(g)); }));
        else {
          list.append(UI.row('🏛️', 'Universidad', 'Elige carrera y forma de pago', null, () => { UI.closeSheets(); MV.EV.push(g, 'elegir_carrera', {}, true); UI.flushQueue(); }));
          list.append(UI.row('🔧', 'Carrera técnica', 'Dos años, salida laboral', null, () => { UI.closeSheets(); MV.EV.push(g, 'elegir_tecnica', {}, true); UI.flushQueue(); }));
        }
        MV.sys.edu.postOptions(g).forEach((o) => list.append(UI.row(o.icon, o.label, o.sub, null, () => { UI.popSheet(); UI.runSystem(o.icon, () => MV.sys.edu.enrollPost(g, o.id)); }, !o.ok)));
        body.append(list);
      }
    });
  };

  UI.showBusiness = function () {
    UI.sheet({
      title: 'Abrir un negocio', icon: '🏪',
      render: (body) => {
        const g = UI.g;
        body.append(note('Cada año el negocio da ganancias o pérdidas según tus habilidades, tu inteligencia y la suerte.'));
        const list = h('div', { class: 'list' });
        MV.BUSINESSES.forEach((B) => list.append(UI.row(B.icon, B.name, `Inversión ${U.money(B.cost)}, habilidad clave: ${MV.SKILLS[B.skill].name.toLowerCase()}`, null,
          () => UI.confirm(`¿Abrir ${B.name.toLowerCase()} por ${U.money(B.cost)}?`, () => { UI.popSheet(); UI.runSystem(B.icon, () => MV.sys.money.openBusiness(g, B.id)); }, 'Abrir'), g.p.money < B.cost)));
        body.append(list);
      }
    });
  };

  // ——————————————————— BIENES ———————————————————
  UI.showAssets = function () { UI.sheet({ title: 'Bienes y dinero', icon: '🏠', render: renderAssets }); };

  const HOUSING = { padres: 'En casa de tus padres', alquiler: 'Alquilando', propia: 'En tu propia casa', calle: 'En la calle' };

  function renderAssets(body) {
    const g = UI.g, p = g.p;
    const debt = U.sum(p.loans, (l) => l.left);
    body.append(title('Dinero'), h('div', { class: 'box' }, kv('Efectivo', U.money(p.money)), kv('Patrimonio neto', U.money(MV.netWorth(g))), debt ? kv('Deudas', U.money(debt)) : null,
      p.loans.length ? h('div', null, p.loans.map((l) => h('p', { class: 'note' }, `${l.name}: debes ${U.money(l.left)} (${l.start > p.age ? 'empiezas a pagar a los ' + l.start : U.money(l.pay) + ' al año'})`))) : null));
    if (p.age < 18) { body.append(note('Eres menor de edad: todavía no puedes comprar casas, autos ni invertir.')); return; }
    // Vivienda
    body.append(title('Vivienda'));
    const home = p.home && p.assets.find((a) => a.id === p.home);
    body.append(h('div', { class: 'box' }, kv('Dónde vives', p.housing === 'alquiler' && p.rent ? p.rent.name : p.housing === 'propia' && home ? home.name : HOUSING[p.housing] || '-'),
      p.housing === 'alquiler' && p.rent ? kv('Alquiler', U.money(p.rent.cost) + ' al año') : null, kv('Gastos de vida', U.money(MV.sys.money.livingCost(g)) + ' al año')));
    const hl = h('div', { class: 'list' });
    hl.append(UI.row('🔑', 'Mudarte a un alquiler', 'Elige dónde vivir', null, () => UI.sheet({
      title: 'Alquileres', icon: '🔑',
      render: (b2) => { const l = h('div', { class: 'list' }); MV.RENTALS.forEach((r) => l.append(UI.row('🏢', r.name, U.money(r.cost) + ' al año', null, () => { UI.popSheet(); UI.runSystem('🔑', () => MV.sys.money.rent(g, r.id)); }))); b2.append(l); }
    })));
    const parents = MV.rels(g, 'padre').filter((x) => x.r.rel >= 30);
    if (p.housing !== 'padres' && parents.length) hl.append(UI.row('🏡', 'Volver a casa de tus padres', 'Ahorras, pero pierdes dignidad', null, () => UI.runSystem('🏡', () => { p.housing = 'padres'; p.rent = null; p.home = null; MV.fx.stat(g, 'happy', -4); return `Volviste a casa de tus padres. ${parents[0].n.first} ya te reorganizó el cuarto como en 2005.`; })));
    body.append(hl);
    // Bienes propios
    body.append(title('Tus bienes'));
    if (!p.assets.length) body.append(note('No tienes bienes. Lo bueno: nadie te los puede robar.'));
    else {
      const l = h('div', { class: 'list' });
      p.assets.forEach((a) => l.append(UI.row(a.icon, a.name, `Valor ${U.money(a.value)}, estado ${a.cond}%${a.rented ? ', alquilada' : ''}${p.home === a.id ? ', tu hogar' : ''}`, '›', () => showAsset(a.id))));
      body.append(l);
    }
    // Comprar
    body.append(title('Comprar'));
    const buy = h('div', { class: 'list' });
    [['casa', '🏡', 'Casas y departamentos'], ['auto', '🚗', 'Autos y motos'], ['lujo', '💎', 'Lujos y caprichos']].forEach(([k, i, t]) => buy.append(UI.row(i, t, 'El mercado cambia cada año', '›', () => showMarket(k))));
    body.append(buy);
    // Inversiones
    body.append(title('Inversiones'));
    const inv = h('div', { class: 'list' });
    Object.keys(MV.INVEST).forEach((k) => {
      const I = MV.INVEST[k];
      inv.append(UI.row(I.icon, I.name, `${I.desc}. Tienes ${U.money(p.inv[k])}`, '›', () => UI.sheet({
        title: I.name, icon: I.icon,
        render: (b2) => {
          b2.append(note(`Rinde entre ${Math.round(I.ret[0] * 100)}% y ${Math.round(I.ret[1] * 100)}% al año. Invertido: ${U.money(p.inv[k])}.`));
          const l = h('div', { class: 'list' });
          [0.1, 0.25, 0.5, 1].forEach((f) => l.append(UI.row('➕', `Invertir ${f === 1 ? 'todo tu efectivo' : Math.round(f * 100) + '% de tu efectivo'}`, U.money(Math.max(0, Math.round(p.money * f))), null, () => UI.runSystem(I.icon, () => MV.sys.money.invest(g, k, Math.round(p.money * f))), p.money <= 0)));
          l.append(UI.row('➖', 'Retirar todo', U.money(p.inv[k]), null, () => UI.runSystem(I.icon, () => MV.sys.money.withdraw(g, k)), !p.inv[k]));
          b2.append(l);
        }
      })));
    });
    body.append(inv);
  }

  function showAsset(id) {
    UI.sheet({
      title: 'Tu bien', icon: '🏷️',
      render: (body) => {
        const g = UI.g, p = g.p, a = p.assets.find((x) => x.id === id);
        if (!a) { body.append(note('Ya no tienes esto.')); return; }
        const loan = p.loans.find((l) => l.assetId === a.id);
        body.append(h('div', { class: 'box' }, h('p', null, h('b', null, `${a.icon} ${a.name}`)), kv('Valor', U.money(a.value)), kv('Estado', a.cond + '%'), loan ? kv('Hipoteca pendiente', U.money(loan.left)) : null, a.haunted ? h('p', { class: 'note' }, 'De noche se escuchan cadenas. Probablemente sean las cañerías.') : null));
        const l = h('div', { class: 'list' });
        l.append(UI.row('🏷️', 'Vender', `Te darían unos ${U.money(Math.round(a.value * (0.75 + a.cond / 400)))}`, null, () => UI.confirm(`¿Vender ${a.name}?`, () => { UI.popSheet(); UI.runSystem('🏷️', () => MV.sys.money.sell(g, a.id)); }, 'Vender')));
        if (a.cond < 100) l.append(UI.row('🛠️', 'Reparar', 'Dejarlo como nuevo', null, () => UI.runSystem('🛠️', () => MV.sys.money.repair(g, a.id))));
        if (a.type === 'casa' && p.home !== a.id) l.append(UI.row('📦', 'Mudarte aquí', 'Dejar de pagar alquiler', null, () => UI.runSystem('📦', () => { p.housing = 'propia'; p.home = a.id; p.rent = null; a.rented = false; MV.fx.stat(g, 'happy', 5); return `Te mudaste a ${a.name}.`; })));
        if (a.type === 'casa' && p.home !== a.id) l.append(UI.row('🧾', a.rented ? 'Dejar de alquilarla' : 'Alquilarla a inquilinos', a.rented ? '' : `Unos ${U.money(Math.round(a.value * 0.045))} al año`, null, () => UI.runSystem('🧾', () => { a.rented = !a.rented; return a.rented ? `Alquilaste ${a.name}. Tus inquilinos ya preguntan por la humedad.` : 'Echaste a tus inquilinos. Te dejaron una planta muerta.'; })));
        body.append(l);
      }
    });
  }

  function showMarket(kind) {
    UI.sheet({
      title: { casa: 'Casas en venta', auto: 'Autos en venta', lujo: 'Lujos' }[kind], icon: { casa: '🏡', auto: '🚗', lujo: '💎' }[kind],
      render: (body) => {
        const g = UI.g, p = g.p;
        const items = MV.sys.money.listings(g, kind);
        body.append(note(`Tienes ${U.money(p.money)}.${kind === 'casa' ? ' Con hipoteca pagas solo el 20% al contado.' : ''}`));
        if (!items.length) { body.append(note('No queda nada a la venta este año.')); return; }
        const l = h('div', { class: 'list' });
        items.forEach((it) => l.append(UI.row(it.icon, it.name, `${U.money(it.value)}, estado ${it.cond}%`, '›', () => UI.sheet({
          title: 'Comprar', icon: it.icon,
          render: (b2) => {
            b2.append(h('div', { class: 'box' }, h('p', null, h('b', null, it.name)), kv('Precio', U.money(it.value)), kv('Estado', it.cond + '%')));
            const ll = h('div', { class: 'list' });
            ll.append(UI.row('💵', 'Pagar al contado', U.money(it.value), null, () => { UI.popSheet(); UI.popSheet(); UI.runSystem(it.icon, () => MV.sys.money.buy(g, it, false)); }, p.money < it.value));
            if (kind === 'casa') ll.append(UI.row('🏦', 'Hipoteca a 25 años', `Entrada ${U.money(Math.round(it.value * 0.2))}`, null, () => { UI.popSheet(); UI.popSheet(); UI.runSystem(it.icon, () => MV.sys.money.buy(g, it, true)); }, p.money < it.value * 0.2));
            b2.append(ll);
          }
        }))));
        body.append(l);
      }
    });
  }

  // ——————————————————— RELACIONES ———————————————————
  const GROUP = { conyuge: 'Matrimonio', pareja: 'Pareja', amante: 'Amantes', padre: 'Padres', hijo: 'Hijos', hermano: 'Hermanos', abuelo: 'Abuelos', mascota: 'Mascotas', amigo: 'Amigos', companero: 'Compañeros', enemigo: 'Enemigos', ex: 'Ex' };

  UI.showRelations = function () {
    UI.sheet({
      title: 'Relaciones', icon: '👥',
      render: (body) => {
        const g = UI.g;
        const all = MV.rels(g);
        if (!all.length) body.append(h('p', { class: 'empty' }, 'No tienes a nadie. Las actividades te ayudan a conocer gente.'));
        MV.REL_ORDER.forEach((t) => {
          const xs = all.filter((x) => x.r.type === t);
          if (!xs.length) return;
          body.append(title(GROUP[t]));
          const l = h('div', { class: 'list' });
          xs.forEach(({ r, n }) => l.append(UI.row(UI.avatar(n, 40), MV.fullName(n), `${MV.relLabel(r.type, n)}, ${n.age} año${n.age === 1 ? '' : 's'}${n.species === 'humano' && n.job && n.job !== '-' ? ', ' + n.job.toLowerCase() : ''}`, h('span', { class: 'relbar' }, UI.bar(r.rel)), () => UI.showPerson(n.id))));
          body.append(l);
        });
        const dead = MV.rels(g, null, true).filter((x) => !x.n.alive);
        if (dead.length) {
          body.append(title('Recuerdos'));
          const l = h('div', { class: 'list' });
          dead.forEach(({ r, n }) => l.append(UI.row(UI.avatar(n, 40), MV.fullName(n), `${MV.relLabel(r.type, n)}, murió a los ${n.deathAge || n.age}${n.cause ? ' por ' + n.cause : ''}`)));
          body.append(l);
        }
      }
    });
  };

  UI.showPerson = function (id) {
    UI.sheet({
      title: 'Relación', icon: '💬',
      render: (body) => {
        const g = UI.g, n = g.people[id], r = MV.relOf(g, id);
        if (!n || !r || !n.alive) { body.append(note('Esta persona ya no forma parte de tu vida.')); return; }
        r.acts = r.acts || {};
        const human = n.species === 'humano';
        body.append(h('div', { class: 'box preview' }, UI.avatar(n, 84),
          h('div', null,
            h('p', null, h('b', { class: 'hand', style: { fontSize: '1.2rem' } }, MV.fullName(n))),
            h('p', { class: 'note', style: { margin: 0 } }, `${MV.relLabel(r.type, n)}, ${n.age} año${n.age === 1 ? '' : 's'}${human && n.job && n.job !== '-' ? '. ' + n.job : ''}`),
            human ? h('p', null, n.traits.map((t) => h('span', { class: 'tag' }, t))) : h('p', null, h('span', { class: 'tag' }, n.traits[0] || 'mascota')),
            h('div', { style: { maxWidth: '200px' } }, UI.bar(r.rel)))));
        body.append(UI.actionList(MV.sys.rels.actions(g, r, n), r.acts, r));
      }
    });
  };

  // ——————————————————— ACTIVIDADES ———————————————————
  UI.showActivities = function () {
    UI.sheet({
      title: 'Actividades', icon: '🎲',
      render: (body) => {
        const g = UI.g;
        if (g.p.prison) { body.append(note('Estás tras las rejas. Las opciones son... limitadas.'), UI.actionList(MV.sys.crime.prisonActions(g))); return; }
        const cats = MV.catsFor(g);
        if (!cats.length) { body.append(h('p', { class: 'empty' }, 'Eres un bebé. Tu única actividad es existir adorablemente. Toca "+1 año".')); return; }
        const grid = h('div', { class: 'grid-cats' });
        cats.forEach((c) => grid.append(h('button', { class: 'cat', onclick: () => showCat(c) }, h('span', { class: 'e', 'aria-hidden': 'true' }, c.icon), c.name)));
        body.append(grid);
        if (g.p.wanted) body.append(note('Eres prófug' + U.gw(g.p.gender, 'o', 'a') + '. Cada año existe la posibilidad de que te atrapen.'));
      }
    });
  };

  function showCat(c) {
    UI.sheet({ title: c.name, icon: c.icon, render: (body) => body.append(UI.actionList(MV.actsFor(UI.g, c.id))) });
  }
})(window.MV = window.MV || {});
