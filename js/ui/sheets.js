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
    // Club deportivo (amateur)
    const clubs = MV.sys.edu.clubsOf(p);
    if (clubs.length && !MV.sys.sports.isPro(p)) {
      body.append(title(`Clubes y talleres (${clubs.length}/3)`));
      const cl = h('div', { class: 'list', id: 'my-clubs' });
      clubs.forEach((id) => {
        const c = MV.sys.edu.clubInfo(id);
        if (!c) return;
        const sub = c.sport ? [`Años de práctica: ${MV.sys.sports.exp(p, c.sport)}`, UI.bar(MV.sys.sports.rating(g, c.sport))] : `Taller: sube ${MV.SKILLS[c.workshop.skill].name.toLowerCase()} cada año`;
        cl.append(UI.row(c.icon, c.name, sub, 'Dejar', () => UI.runSystem('🚪', () => MV.sys.edu.leaveClub(g, id))));
      });
      body.append(cl);
      if (p.club) { const S = MV.SPORTS[p.club]; body.append(h('p', { class: 'note' }, p.age < S.start[0] ? `Los profesionales empiezan desde los ${S.start[0]} años. Sigue entrenando: los cazatalentos miran tu mejor deporte.` : 'Cuanto más alto tu nivel, más probable que te recluten. Los cazatalentos miran tu mejor deporte.')); }
    }
    // Trabajo
    if (p.job) {
      const J = MV.jobById(p.job.id);
      body.append(title('Trabajo'), h('div', { class: 'box' },
        kv('Puesto', MV.sys.career.title(p)), kv(J.type === 'sport' ? 'Deporte' : 'Sector', J.sector),
        p.job.club ? kv(MV.SPORTS[J.sport] && MV.SPORTS[J.sport].team ? 'Club' : 'Representante', p.job.club + (p.job.abroad ? ' (extranjero)' : '')) : null,
        J.type === 'sport' ? kv('Nivel deportivo', MV.sys.sports.rating(g, J.sport) + ' / 100') : null,
        kv(J.type === 'sport' && MV.SPORTS[J.sport].prize ? 'Premios del último año' : 'Sueldo', U.money(p.job.salary) + ' al año'),
        kv(J.type === 'sport' ? 'Temporadas' : 'Años en la empresa', String(p.job.years)),
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
    if (p.age >= 14) opts.append(UI.row('🏟️', 'Deporte profesional', 'Fútbol, básquet, tenis, vóley y más', null, () => UI.showSports()));
    opts.append(UI.row('🌟', 'Carreras especiales', 'Actuación, música, moda y política', null, () => UI.showFame()));
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

  UI.showSports = function () {
    UI.sheet({
      title: 'Deporte profesional', icon: '🏟️',
      render: (body) => {
        const g = UI.g, p = g.p;
        body.append(note('Haz una prueba abierta o entrena en un club (Actividades o la escuela) para que te recluten. Cuenta tu habilidad Deporte, tu salud y tus años de práctica.'));
        const list = h('div', { class: 'list' });
        Object.keys(MV.SPORTS).forEach((k) => {
          const S = MV.SPORTS[k], J = MV.SPORT_JOBS['sport_' + k];
          const m = MV.sys.sports.canTryout(g, k);
          const pro = MV.sys.sports.isPro(p);
          const top = U.money(S.pay[S.pay.length - 1]);
          const sub = pro ? `Nivel ${MV.sys.sports.rating(g, k)}/100` : m.ok ? `Tu nivel: ${MV.sys.sports.rating(g, k)}/100. Las estrellas cobran hasta ${top} al año` : 'Requiere: ' + m.why.join(', ');
          list.append(UI.row(S.icon, S.name, sub, m.ok && !pro ? 'Probar' : '', () => {
            const r = MV.sys.sports.tryout(g, k);
            if (r) UI.toast(S.icon, S.name, r); else UI.flushQueue(() => UI.refreshSheets());
          }, !m.ok || pro));
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
    const news = MV.sys.world.current(g);
    body.append(h('div', { class: 'box news', id: 'world-news' }, h('b', null, `${news ? news.icon : '🌤️'} Clima económico: ${news ? news.title : 'año tranquilo'}`), h('p', { class: 'note', style: { margin: '4px 0 0' } }, MV.sys.world.describe(news))));
    if (p.age < 18) {
      body.append(note('Eres menor de edad: todavía no puedes comprar casas, autos ni invertir.'));
      if (p.age >= 8) {
        const mine = MV.sys.music.owned(p);
        const ml = h('div', { class: 'list' });
        mine.forEach((a) => ml.append(UI.row(a.icon, a.name, `Valor ${U.money(a.value)}`, '›', () => showAsset(a.id))));
        ml.append(UI.row('🎸', 'Tienda de música', 'Con tus ahorros sí puedes comprar un instrumento', '›', () => UI.showMusicShop()));
        body.append(title('Música'), ml);
      }
      return;
    }
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
      p.assets.forEach((a) => l.append(UI.row(a.icon, a.name, [`Valor ${U.money(a.value)}${a.rented ? ', alquilada' : ''}${p.home === a.id ? ', tu hogar' : ''}`, UI.condBar(a.cond)], '›', () => showAsset(a.id))));
      body.append(l);
    }
    // Comprar
    body.append(title('Comprar'));
    const buy = h('div', { class: 'list' });
    [['casa', '🏡', 'Casas y departamentos'], ['lujo', '💎', 'Lujos y caprichos']].forEach(([k, i, t]) => buy.append(UI.row(i, t, 'El mercado cambia cada año', '›', () => showMarket(k))));
    buy.append(UI.row('🚗', 'Concesionaria', `${MV.CAR_CATALOG.length} modelos 0 km en 9 categorías, en el color que quieras`, '›', () => UI.showDealer()));
    buy.append(UI.row('🎸', 'Tienda de música', 'Instrumentos para practicar, tocar y hacer carrera', '›', () => UI.showMusicShop()));
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

  /** Tienda de música: instrumentos de precio fijo. */
  UI.showMusicShop = function () {
    UI.sheet({
      title: 'Tienda de música', icon: '🎸',
      render: (body) => {
        const g = UI.g;
        body.append(note(`Tienes ${U.money(g.p.money)}. Los mejores instrumentos suben más tu Música y ayudan en audiciones y canciones.`));
        const l = h('div', { class: 'list' });
        MV.INSTRUMENTS.forEach((I) => l.append(UI.row(I.icon, I.name, `${U.money(I.price)} · calidad ${'★'.repeat(I.quality)}${'☆'.repeat(3 - I.quality)}`, g.p.money >= I.price ? 'Comprar' : '',
          () => UI.runSystem(I.icon, () => MV.sys.music.buy(g, I.id)), g.p.money < I.price)));
        body.append(l);
      }
    });
  };

  function showAsset(id) {
    UI.sheet({
      title: 'Tu bien', icon: '🏷️',
      render: (body) => {
        const g = UI.g, p = g.p, a = p.assets.find((x) => x.id === id);
        if (!a) { body.append(note('Ya no tienes esto.')); return; }
        const M = MV.sys.money;
        const loan = p.loans.find((l) => l.assetId === a.id);
        if (a.type === 'auto') { const pic = h('div', { class: 'car-art big' }); pic.innerHTML = UI.carSVG(a); body.append(pic); }
        body.append(h('div', { class: 'box' }, h('p', null, h('b', null, `${a.icon} ${a.name}`)), kv('Valor', U.money(a.value)), kv('Estado', UI.condBar(a.cond)),
          kv('Mantenimiento', U.money(M.upkeep(g, a)) + ' al año'),
          loan ? kv('Hipoteca pendiente', U.money(loan.left)) : null,
          a.haunted ? h('p', { class: 'note' }, 'De noche se escuchan cadenas. Probablemente sean las cañerías.') : null));
        if (a.type === 'casa') {
          body.append(h('h3', { class: 'section-title' }, 'Mejoras'));
          const ups = a.upgrades || [];
          const ul = h('div', { class: 'list' });
          if (!ups.length) ul.append(UI.row('🏚️', 'Sin mejoras', p.home === a.id ? 'Las mejoras dan beneficios cada año mientras vivas aquí.' : 'Suman valor y alquiler. Sus beneficios son para quien vive aquí.'));
          ups.forEach((u) => {
            const U2 = MV.HOUSE_UPGRADES.find((x) => x.id === u.id) || { icon: '🔧', name: u.id, desc: '' };
            ul.append(UI.row(U2.icon, U2.name, `${U2.desc}. ${u.added >= 0 ? 'Suma' : 'Resta'} ${U.money(Math.abs(u.added))} al valor`, 'Quitar',
              () => UI.confirm(`¿Quitar ${U2.name.toLowerCase()}? La demolición cuesta ${U.money(Math.round((u.cost || 5000) * 0.2))}.`, () => UI.runSystem(U2.icon, () => M.removeUpgrade(g, a.id, u.id)), 'Quitar')));
          });
          ul.append(UI.row('➕', 'Agregar una mejora', 'Piscina, sauna, cancha de tenis y más', '›', () => UI.sheet({
            title: 'Mejoras para tu casa', icon: '🛠️',
            render: (b2) => {
              b2.append(note(`Tienes ${U.money(p.money)}. Algunas mejoras suman más valor del que cuestan; otras, casi nada.`));
              const l2 = h('div', { class: 'list' });
              M.upgradeOptions(g, a.id).forEach((o) => l2.append(UI.row(o.icon, o.label, o.sub, o.ok ? 'Instalar' : '', () => { UI.popSheet(); UI.runSystem(o.icon, () => M.addUpgrade(g, a.id, o.id)); }, !o.ok)));
              b2.append(l2);
            }
          })));
          body.append(ul);
        }
        if (MV.sys.island.isIsland(a)) UI.islandSection(body, a);
        if (a.type === 'instrumento') {
          const ma = MV.sys.music.actions(g, a);
          body.append(h('h3', { class: 'section-title' }, 'Tocar'));
          body.append(ma.length ? UI.actionList(ma) : note('Desde la cárcel solo puedes tocar la armónica imaginaria.'));
        }
        if (a.type === 'auto') {
          const C = MV.sys.cars;
          body.append(title(`Tuneo · rendimiento ${C.perf(a)}`));
          const tl = h('div', { class: 'list' });
          Object.keys(MV.CAR_TUNES).forEach((k) => {
            const T = MV.CAR_TUNES[k], has = !!(a.tune || {})[k];
            tl.append(UI.row(T.icon, T.name, has ? 'Instalado' : `${U.money(T.cost)} · +${T.perf} de rendimiento`, has ? '✓' : null, has ? null : () => UI.runSystem(T.icon, () => C.tune(g, a.id, k)), !has && p.money < T.cost));
          });
          body.append(tl);
          body.append(title('Carreras'));
          const rl = h('div', { class: 'list' });
          const noLic = MV.sys.license.has(g, 'auto') ? '' : ' · necesitas licencia';
          rl.append(UI.row('🏁', 'Correr en circuito', `Inscripción $500. Premios hasta $8.000, sin riesgo legal${noLic}`, null, () => UI.runSystem('🏁', () => C.race(g, a.id, 'circuito')), p.money < 500));
          rl.append(UI.row('🌃', 'Picada callejera', `18+. Apuestas plata; puede venir la policía o terminar en choque${noLic}`, '›', () => UI.sheet({
            title: 'Picada callejera', icon: '🌃',
            render: (b2) => {
              b2.append(note(`Tu ${a.name} tiene rendimiento ${C.perf(a)}. ¿Cuánto apuestas?`));
              const bl = h('div', { class: 'list' });
              [0, 500, 2000, 10000, 50000].forEach((bet) => bl.append(UI.row('💵', bet ? `Apostar ${U.money(bet)}` : 'Correr por el honor', bet ? 'Si ganas, lo duplicas' : 'Sin apuesta', null, () => { UI.popSheet(); UI.runSystem('🌃', () => C.race(g, a.id, 'calle', bet)); }, p.money < bet)));
              b2.append(bl);
            }
          })));
          body.append(rl);
          body.append(title('Seguro'));
          const sl = h('div', { class: 'list' });
          sl.append(a.insured ? UI.row('🛡️', 'Asegurado', `Cubre choques y robos. ${U.money(C.premium(a))} al año`, 'Cancelar', () => UI.runSystem('🛡️', () => C.insure(g, a.id, false)))
            : UI.row('🛡️', 'Asegurar', `${U.money(C.premium(a))} al año (3 % del valor). Cubre choques y robos`, null, () => UI.runSystem('🛡️', () => C.insure(g, a.id, true)), p.money < C.premium(a)));
          body.append(sl);
        }
        if (MV.sys.vehicles.kindOf(a)) {
          const va = MV.sys.vehicles.actions(g, a);
          body.append(h('h3', { class: 'section-title' }, 'Usar'));
          body.append(va.length ? UI.actionList(va) : note(p.prison ? 'Desde la cárcel no puedes usarlo.' : 'Ahora no te alcanza el dinero para usarlo.'));
        }
        body.append(h('h3', { class: 'section-title' }, 'Opciones'));
        const l = h('div', { class: 'list' });
        l.append(UI.row('🏷️', 'Vender', `Valor estimado ${U.money(M.estimate(a))}. Elige cuánto pedir`, '›', () => showSell(a.id)));
        if (a.cond < 100) l.append(UI.row('🛠️', 'Reparar', 'Dejarlo como nuevo', null, () => UI.runSystem('🛠️', () => M.repair(g, a.id))));
        if (a.type === 'casa' && p.home !== a.id) l.append(UI.row('📦', 'Mudarte aquí', 'Dejar de pagar alquiler', null, () => UI.runSystem('📦', () => { p.housing = 'propia'; p.home = a.id; p.rent = null; a.rented = false; MV.fx.stat(g, 'happy', 5); return `Te mudaste a ${a.name}.`; })));
        if (a.type === 'casa' && p.home !== a.id) l.append(UI.row('🧾', a.rented ? 'Dejar de alquilarla' : 'Alquilarla a inquilinos', a.rented ? '' : `Unos ${U.money(Math.round(a.value * 0.045))} al año (las mejoras suben el alquiler)`, null, () => UI.runSystem('🧾', () => { a.rented = !a.rented; return a.rented ? `Alquilaste ${a.name}. Tus inquilinos ya preguntan por la humedad.` : 'Echaste a tus inquilinos. Te dejaron una planta muerta.'; })));
        body.append(l);
      }
    });
  }

  function showSell(id) {
    UI.sheet({
      title: 'Poner precio', icon: '🏷️',
      render: (body) => {
        const g = UI.g, a = g.p.assets.find((x) => x.id === id);
        if (!a) { body.append(note('Ya no tienes esto.')); return; }
        const est = MV.sys.money.estimate(a);
        body.append(note(`Valor estimado: ${U.money(est)}. Si pides de más, puede llegar una contraoferta; si pides poco, se vende seguro.`));
        const l = h('div', { class: 'list' });
        [[-0.2, 'Venta rápida', 'Se vende seguro'], [-0.1, 'Un poco por debajo', 'Muy probable'], [0, 'Al valor estimado', 'Probable'], [0.1, 'Un poco más', 'Puede haber contraoferta'], [0.25, 'Bastante más', 'Seguramente regateen'], [0.5, 'Precio de sueño', 'Casi seguro regatean']].forEach(([f, label, sub]) => {
          const ask = Math.round(est * (1 + f));
          l.append(UI.row(f < 0 ? '⬇️' : f > 0 ? '⬆️' : '⚖️', `${label}: ${U.money(ask)}`, `${f > 0 ? '+' : ''}${Math.round(f * 100)}%. ${sub}`, null,
            () => { UI.popSheet(); UI.popSheet(); UI.runSystem('🏷️', () => MV.sys.money.sellAt(g, a.id, f)); }));
        });
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
        items.forEach((it) => l.append(UI.row(it.icon, it.name, [U.money(it.value), UI.condBar(it.cond)], '›', () => UI.sheet({
          title: 'Comprar', icon: it.icon,
          render: (b2) => {
            b2.append(h('div', { class: 'box' }, h('p', null, h('b', null, it.name)), kv('Precio', U.money(it.value)), kv('Estado', UI.condBar(it.cond))));
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
  const GROUP = { conyuge: 'Matrimonio', pareja: 'Pareja', amante: 'Amantes', padre: 'Padres', hijo: 'Hijos', nieto: 'Nietos', hermano: 'Hermanos', abuelo: 'Abuelos', mascota: 'Mascotas', amigo: 'Amigos', companero: 'Compañeros', enemigo: 'Enemigos', ex: 'Ex' };

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
        if (!human && ((n.tricks || []).length || n.trophies)) {
          body.append(h('div', { class: 'box', id: 'pet-tricks' },
            n.tricks && n.tricks.length ? h('p', { style: { margin: 0 } }, h('b', null, '🎓 Trucos: '), n.tricks.join(', ') + '.') : null,
            n.trophies ? h('p', { style: { margin: n.tricks && n.tricks.length ? '6px 0 0' : 0 } }, h('b', null, '🏆 Trofeos: '), `${n.trophies}${n.wins ? ` (${n.wins} primer${n.wins === 1 ? '' : 'os'} puesto${n.wins === 1 ? '' : 's'})` : ''}`) : null));
        }
        body.append(UI.actionList(MV.sys.rels.actions(g, r, n), r.acts, r));
      }
    });
  };

  /** Menú desplegable de regalos (con vista previa de la reacción). */
  UI.showGiftPicker = function (a, scope, relRef) {
    const g = UI.g, n = g.people[a.relId], r = MV.relOf(g, a.relId);
    if (!n || !r) return;
    if (MV.usesLeft(g, a, scope) <= 0) { UI.toast('⏳', '', 'Ya le hiciste un regalo este año.'); return; }
    const opts = MV.sys.rels.giftOptions(g, n.id);
    if (!opts.length) { UI.toast('🎁', 'Regalos', 'No te alcanza ni para una carta.'); return; }
    UI.sheet({
      title: `Regalo para ${n.first}`, icon: '🎁',
      render: (body) => {
        const sel = h('select', { class: 'select', id: 'gift-select', 'aria-label': 'Elige un regalo' },
          MV.GIFT_GROUPS.map((grp) => {
            const items = opts.filter((x) => x.group === grp);
            return items.length ? h('optgroup', { label: grp }, items.map((x) => h('option', { value: x.id }, `${x.icon} ${x.name}, ${U.money(x.price)}`))) : null;
          }));
        const preview = h('div', { class: 'box gift-preview', 'aria-live': 'polite' });
        const HINT = { love: ['💖', 'Le va a encantar'], like: ['🙂', 'Le va a gustar'], meh: ['😐', 'No le va a emocionar mucho'], hate: ['😬', 'No es lo suyo']};
        const update = () => {
          const gift = MV.GIFTS.find((x) => x.id === sel.value);
          UI.clear(preview);
          if (!gift) return;
          const [ic, tx] = HINT[MV.giftReaction(n, gift, r.type)];
          preview.append(h('p', { style: { margin: 0, fontSize: '1.6rem' } }, gift.icon), h('p', null, h('b', null, gift.name)), h('p', { class: 'note', style: { margin: 0 } }, `${U.money(gift.price)}. ${ic} ${tx}.`));
        };
        sel.addEventListener('change', update);
        body.append(h('p', { class: 'note' }, `Tienes ${U.money(g.p.money)}. A cada persona le gustan cosas distintas según su edad y su forma de ser.`),
          sel, preview,
          h('button', { type: 'button', class: 'btn primary block', onclick: () => { const id = sel.value; UI.popSheet(); UI.execAction(a, id, scope, relRef); } }, '🎁 Regalar'));
        update();
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
