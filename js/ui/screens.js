/* Mil Vidas — portada, creación de personaje, muerte, ficha, menú, logros, cementerio y árbol. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const title = (t) => h('h3', { class: 'section-title' }, t);
  const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('span', null, v));
  const note = (t) => h('p', { class: 'note' }, t);

  // ——— Portada ———
  UI.showCover = function () {
    UI.closeSheets();
    const app = UI.clear(document.getElementById('app'));
    const saved = MV.loadGame();
    const glob = MV.global();
    const achCount = Object.keys(glob.ach).length;
    const actions = h('div', { class: 'cover-actions' });
    if (saved && !saved.over) actions.append(h('button', { class: 'btn primary block', onclick: () => { UI.g = saved; UI.renderGame(); UI.flushQueue(); } }, `Continuar con ${saved.p.first} (${saved.p.age} años)`));
    if (saved && saved.over) actions.append(h('button', { class: 'btn primary block', onclick: () => { UI.g = saved; UI.showDeath(); } }, `Ver el final de ${saved.p.first}`));
    actions.append(h('button', { class: 'btn block' + (saved ? '' : ' primary'), onclick: () => UI.showCreate() }, 'Empezar una vida nueva'));
    actions.append(h('div', { class: 'btn-row' },
      h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showGraveyard() }, `⚰️ Cementerio (${glob.graveyard.length})`),
      h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showAchievements() }, `🏆 Logros ${achCount}/${MV.ACHIEVEMENTS.length}`)));
    app.append(h('main', { class: 'cover' },
      h('div', { class: 'notebook' },
        h('h1', { class: 'title-mark' }, 'Mil', h('br'), h('span', { class: 'stroke' }, 'Vidas')),
        h('p', { class: 'tagline' }, 'Un diario para vivir una vida entera, año por año. Estudia, ama, delinque, envejece y deja herederos. Después, otra vida.')),
      actions,
      h('p', { class: 'cover-meta' }, 'Tu progreso se guarda en este navegador. Contenido para mayores de 18: humor negro.')));
  };

  // ——— Creación ———
  UI.showCreate = function () {
    UI.closeSheets();
    const app = UI.clear(document.getElementById('app'));
    const st = { gender: U.pick(['m', 'f']), country: U.pick(Object.keys(MV.COUNTRIES)), skin: U.pick(MV.LOOK.SKIN), first: '', last: '' };
    st.first = MV.randomFirst(st.gender, st.country); st.last = MV.randomLast(st.country);
    const look = MV.makeLook(st.gender);
    const preview = h('div', { class: 'preview' });
    const first = h('input', { class: 'input', id: 'f-first', value: st.first, maxlength: '24', autocomplete: 'off' });
    const last = h('input', { class: 'input', id: 'f-last', value: st.last, maxlength: '24', autocomplete: 'off' });
    first.addEventListener('input', () => { st.first = first.value; drawPreview(); });
    last.addEventListener('input', () => { st.last = last.value; drawPreview(); });
    const country = h('select', { class: 'select', id: 'f-country' }, MV.REGIONS.map((reg) => h('optgroup', { label: reg },
      Object.keys(MV.COUNTRIES).filter((k) => MV.COUNTRIES[k].region === reg).sort((a, b) => MV.COUNTRIES[a].name.localeCompare(MV.COUNTRIES[b].name, 'es'))
        .map((k) => h('option', { value: k }, `${MV.COUNTRIES[k].flag} ${MV.COUNTRIES[k].name}`)))));
    country.value = st.country;
    country.addEventListener('change', () => { st.country = country.value; });
    const segG = h('div', { class: 'seg', role: 'group', 'aria-label': 'Género' });
    const drawSeg = () => {
      UI.clear(segG);
      [['m', 'Hombre'], ['f', 'Mujer']].forEach(([k, l]) => segG.append(h('button', { type: 'button', 'aria-pressed': String(st.gender === k), onclick: () => { st.gender = k; look.beard = k === 'm' && look.beard; drawSeg(); drawPreview(); } }, l)));
    };
    const sw = h('div', { class: 'swatches', role: 'group', 'aria-label': 'Tono de piel' });
    const drawSw = () => {
      UI.clear(sw);
      MV.LOOK.SKIN.forEach((c, i) => sw.append(h('button', { type: 'button', class: 'swatch', style: { background: c }, 'aria-label': 'Tono ' + (i + 1), 'aria-pressed': String(st.skin === c), onclick: () => { st.skin = c; drawSw(); drawPreview(); } })));
    };
    function drawPreview() {
      UI.clear(preview);
      look.skin = st.skin;
      preview.append(UI.avatar({ id: 'preview', age: 0, gender: st.gender, look, alive: true }, 72),
        h('div', null, h('p', { class: 'hand', style: { fontSize: '1.2rem', fontWeight: 700, margin: 0 } }, `${st.first || '¿?'} ${st.last}`), h('p', { class: 'note', style: { margin: 0 } }, 'Recién nacid' + U.gw(st.gender, 'o', 'a') + '. Sin deudas (todavía).')));
    }
    const rnd = (fn) => h('button', { type: 'button', class: 'btn', 'aria-label': 'Al azar', onclick: fn }, '🎲');
    const born = (random) => {
      const opts = random ? {} : { first: (st.first || '').trim() || MV.randomFirst(st.gender, st.country), last: (st.last || '').trim() || MV.randomLast(st.country), gender: st.gender, country: st.country, look: Object.assign({}, look) };
      UI.startGame(MV.newGame(opts));
    };
    drawSeg(); drawSw(); drawPreview();
    app.append(h('main', { class: 'cover', style: { justifyContent: 'flex-start' } },
      h('div', { class: 'notebook' },
        h('h1', { class: 'hand', style: { margin: '0 0 14px', fontSize: '2rem' } }, 'Una vida nueva'),
        h('div', { class: 'form' },
          preview,
          h('div', { class: 'field' }, h('label', { for: 'f-first' }, 'Nombre'), h('div', { class: 'input-row' }, first, rnd(() => { first.value = st.first = MV.randomFirst(st.gender, st.country); drawPreview(); }))),
          h('div', { class: 'field' }, h('label', { for: 'f-last' }, 'Apellido'), h('div', { class: 'input-row' }, last, rnd(() => { last.value = st.last = MV.randomLast(st.country); drawPreview(); }))),
          h('div', { class: 'field' }, h('span', { class: 'label' }, 'Género'), segG),
          h('div', { class: 'field' }, h('label', { for: 'f-country' }, 'País de nacimiento'), country),
          h('div', { class: 'field' }, h('span', { class: 'label' }, 'Tono de piel'), sw),
          note('La familia, la clase social, la inteligencia y la apariencia te tocan por sorteo. Como en la vida.'))),
      h('div', { class: 'cover-actions' },
        h('button', { class: 'btn primary block', onclick: () => born(false) }, '👶 Nacer'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', style: { flex: 1 }, onclick: () => born(true) }, '🎲 Todo al azar'),
          h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showCover() }, 'Volver')))));
    first.focus();
  };

  UI.startGame = function (g) {
    UI.g = g;
    MV.ach.unlock(g, 'nacer');
    UI.diaryYears = 25;
    UI.save();
    UI.renderGame();
  };

  // ——— Muerte ———
  UI.showDeath = function () {
    const g = UI.g, s = g.summary;
    if (!s) { UI.showCover(); return; }
    UI.closeAll();
    const app = UI.clear(document.getElementById('app'));
    const heirs = MV.sys.legacy.heirs(g);
    const root = h('main', { class: 'death' });
    root.append(h('div', { class: 'tomb' },
      UI.avatar({ id: s.id, age: s.age, gender: s.gender, look: s.look, alive: false }, 88),
      h('div', { class: 'rip' }, 'Aquí yace'),
      h('h1', null, s.name),
      h('div', { class: 'dates' }, `${s.born} – ${s.died}, ${s.age} año${s.age === 1 ? '' : 's'}`),
      h('p', null, `Murió por ${s.cause}`),
      h('p', { class: 'epitaph' }, `«${s.epitaph}»`)));
    root.append(h('div', { class: 'box verdict' }, h('span', { class: 'e', 'aria-hidden': 'true' }, s.verdict.icon), h('div', null, h('b', null, s.verdict.name), h('p', { style: { margin: 0 } }, s.verdict.text))));
    root.append(h('div', { class: 'box' },
      kv('Patrimonio', U.money(s.worth)), kv('Ocupación', s.job), kv('Estudios', s.edu), kv('Hijos', String(s.kids)), kv('Matrimonios', String(s.marriages)),
      kv('Delitos', String(s.crimes)), kv('Karma', String(s.karma)), kv('Fama', String(s.fame)), kv('Generación', `${s.generation} de la dinastía ${s.dynasty ? s.dynasty.name : ''}`),
      s.aspiration ? kv('Aspiración', `${s.aspiration.name || ''}: ${s.aspiration.done ? 'cumplida' : 'sin cumplir'}`) : null));
    if (s.ach.length) {
      root.append(title('Logros de esta vida'));
      const grid = h('div', { class: 'ach-grid' });
      s.ach.forEach((id) => { const A = MV.ach.def(id); if (A) grid.append(h('div', { class: 'ach' }, h('span', { class: 'e' }, A.icon), h('div', null, h('b', null, A.name), A.desc))); });
      root.append(grid);
    }
    if (heirs.length) {
      root.append(title('Continuar la dinastía'), note('Juega como uno de tus hijos. Heredará tu patrimonio (menos impuestos).'));
      const l = h('div', { class: 'list' });
      heirs.forEach((n) => l.append(UI.row(UI.avatar(n, 40), MV.fullName(n), `${MV.relLabel('hijo', n)}, ${n.age} años${g.p.heirId === n.id ? ', heredero principal' : ''}`, 'Continuar', () => {
        const ng = MV.sys.legacy.continueAs(g, n.id);
        UI.startGame(ng);
      })));
      root.append(l);
    }
    root.append(h('div', { class: 'btn-row' },
      h('button', { class: 'btn primary', style: { flex: 1 }, onclick: () => UI.showCreate() }, 'Una vida nueva'),
      h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showGraveyard() }, '⚰️ Cementerio'),
      h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showCover() }, 'Portada')));
    root.append(title('El diario completo'));
    const diary = h('details', { class: 'box' }, h('summary', null, 'Leer toda la vida'),
      g.log.map((y) => h('div', null, h('p', { class: 'hand', style: { fontWeight: 700, margin: '10px 0 2px' } }, `${y.age} años (${y.year})`), y.items.map((it) => h('div', { class: 'entry' }, h('span', { class: 'ic' }, it.i), h('span', { class: 'tx' }, it.t))))));
    root.append(diary);
    app.append(root);
    window.scrollTo(0, 0);
  };

  // ——— Ficha personal ———
  UI.showProfile = function () {
    UI.sheet({
      title: 'Ficha personal', icon: '🪪',
      render: (body) => {
        const g = UI.g, p = g.p;
        const C = MV.COUNTRIES[p.country];
        body.append(h('div', { class: 'box preview' }, UI.avatar(p, 84), h('div', null,
          h('p', null, h('b', { class: 'hand', style: { fontSize: '1.25rem' } }, MV.fullName(p))),
          h('p', { class: 'note', style: { margin: 0 } }, `${MV.stageName(p.age, p.gender)}, ${p.age} años. Vive en ${p.city}, ${C.name} ${C.flag}.`),
          h('p', { class: 'note', style: { margin: 0 } }, `Generación ${g.generation} de la dinastía ${g.dynasty.name}. Orientación: ${{ hetero: 'heterosexual', homo: 'homosexual', bi: 'bisexual' }[p.orientation]}.`))));
        body.append(title('Estadísticas'));
        const sb = h('div', { class: 'box' });
        ['happy', 'health', 'smarts', 'looks'].forEach((k) => sb.append(h('div', { class: 'skill-row' }, h('span', null, MV.STATS[k].icon), h('span', null, MV.STATS[k].name), UI.bar(p.stats[k]), h('b', null, p.stats[k]))));
        sb.append(h('div', { class: 'skill-row' }, h('span', null, '😰'), h('span', null, 'Estrés'), UI.bar(p.stress, 100, true), h('b', null, p.stress)));
        sb.append(h('div', { class: 'skill-row' }, h('span', null, '☯️'), h('span', null, 'Karma'), UI.bar(p.karma + 100, 200), h('b', null, p.karma)));
        sb.append(h('div', { class: 'skill-row' }, h('span', null, '⭐'), h('span', null, 'Fama'), UI.bar(p.fame), h('b', null, p.fame)));
        body.append(sb);
        body.append(title('Habilidades'));
        const sk = h('div', { class: 'box' });
        Object.keys(MV.SKILLS).forEach((k) => sk.append(h('div', { class: 'skill-row' }, h('span', null, MV.SKILLS[k].icon), h('span', null, MV.SKILLS[k].name), UI.bar(p.skills[k]), h('b', null, Math.round(p.skills[k])))));
        body.append(sk, note('Las habilidades suben practicando en Actividades, en clubes, en el trabajo y con algunos eventos.'));
        const played = Object.keys(p.sportsExp || {}).filter((k) => p.sportsExp[k] > 0 && MV.SPORTS[k]);
        if (played.length || p.club) {
          body.append(title('Deportes'));
          body.append(h('div', { class: 'box' }, (played.length ? played : [p.club]).map((k) => h('div', { class: 'skill-row' }, h('span', null, MV.SPORTS[k].icon), h('span', null, MV.SPORTS[k].name), UI.bar(MV.sys.sports.rating(g, k)), h('b', null, MV.sys.sports.rating(g, k)))),
            note(`Años de práctica: ${played.map((k) => `${MV.SPORTS[k].name.toLowerCase()} ${p.sportsExp[k]}`).join(', ') || 'recién empiezas'}.`)));
        }
        body.append(title('Salud'));
        const hb = h('div', { class: 'box' });
        hb.append(p.conds.length ? h('p', null, p.conds.map((c) => { const Cd = MV.CONDITIONS[c.id]; return h('span', { class: 'tag' }, `${Cd.icon} ${Cd.name}`); })) : h('p', null, 'Sin enfermedades conocidas.'));
        Object.keys(p.addic).forEach((k) => { if (p.addic[k] >= 5) hb.append(h('div', { class: 'skill-row' }, h('span', null, { alcohol: '🍺', drogas: '💊', apuestas: '🎰', tabaco: '🚬' }[k]), h('span', null, 'Adicción: ' + k), UI.bar(p.addic[k], 100, true), h('b', null, Math.round(p.addic[k])))); });
        body.append(hb);
        body.append(title('Tatuajes'));
        body.append(h('div', { class: 'box' }, UI.tattooAlbum()));
        body.append(title('Aspiración de vida'));
        const A = p.aspiration && MV.ASPIRATIONS.find((a) => a.id === p.aspiration.id);
        body.append(h('div', { class: 'box' }, A ? h('p', null, `${A.icon} ${A.name}: ${A.desc} ${p.aspiration.done ? '¡Cumplida!' : ''}`) : h('p', null, p.age < 14 ? 'La elegirás a los 14 años.' : 'Sin aspiración. Vives al día.')));
        body.append(title('Educación'));
        const eb = h('div', { class: 'box' });
        eb.append(kv('Nivel', MV.EDU.names[MV.EDU.order[MV.eduLevel(p)]]));
        p.edu.degrees.forEach((d) => eb.append(kv(d.kind === 'universidad' ? 'Universidad' : d.kind === 'tecnica' ? 'Técnica' : 'Posgrado', d.kind === 'universidad' ? MV.EDU.majors[d.major].name + (d.honors ? ' (con honores)' : '') : d.kind === 'tecnica' ? MV.EDU.tech[d.major].name : MV.EDU.post[d.type].name)));
        body.append(eb);
        if (p.jobs.length) {
          body.append(title('Historial laboral'));
          body.append(h('div', { class: 'box' }, p.jobs.slice(-8).map((j) => kv(j.title, `${j.from}–${j.to} años`))));
        }
        if (p.record.length) {
          body.append(title('Antecedentes penales'));
          body.append(h('div', { class: 'box' }, p.record.map((r) => kv(r.crime, `${r.age} años, ${r.years ? r.years + ' año' + (r.years > 1 ? 's' : '') : 'multa'}`))));
        }
        body.append(title('Otros datos'));
        body.append(h('div', { class: 'box' }, kv('Licencia de conducir', p.license ? 'Sí' : 'No'), kv('Seguidores', U.num(p.followers)), kv('Viajes', String(p.counters.viajes || 0)), kv('Delitos cometidos', String(p.counters.delitos || 0))));
      }
    });
  };

  // ——— Menú ———
  UI.showMenu = function () {
    UI.sheet({
      title: 'Menú', icon: '☰',
      render: (body) => {
        const glob = MV.global();
        const theme = glob.settings.theme || 'auto';
        const l = h('div', { class: 'list' });
        l.append(UI.row('📖', 'Cómo se juega', 'Lo básico en un minuto', null, () => UI.showHelp()));
        l.append(UI.row('🏆', 'Logros', `${Object.keys(glob.ach).length} de ${MV.ACHIEVEMENTS.length}`, '›', () => UI.showAchievements()));
        l.append(UI.row('⚰️', 'Cementerio', glob.graveyard.length === 1 ? '1 vida vivida' : `${glob.graveyard.length} vidas vividas`, '›', () => UI.showGraveyard()));
        l.append(UI.row('🌳', 'Árbol de la dinastía', UI.g ? `Familia ${UI.g.dynasty.name}` : '', '›', () => UI.showTree(), !UI.g));
        l.append(UI.row('🌓', 'Tema', { auto: 'Automático', light: 'Cuaderno (claro)', dark: 'Pizarrón (oscuro)' }[theme], 'Cambiar', () => {
          glob.settings.theme = { auto: 'light', light: 'dark', dark: 'auto' }[theme];
          MV.saveGlobal(); UI.applyTheme(); UI.refreshSheets();
        }));
        l.append(UI.row('💾', 'Exportar partida', 'Descarga un archivo para guardar o pasar a otro dispositivo', null, () => UI.exportFile()));
        l.append(UI.row('📂', 'Importar partida', 'Carga un archivo exportado', null, () => UI.importFile()));
        l.append(UI.row('👶', 'Empezar una vida nueva', 'Abandonas la vida actual', null, () => UI.confirm('Tu vida actual se perderá (no irá al cementerio).', () => { MV.deleteGame(); UI.showCreate(); }, 'Empezar de nuevo')));
        l.append(UI.row('🗑️', 'Borrar todo el progreso', 'Partida, logros y cementerio', null, () => UI.confirm('Se borrará absolutamente todo: partida, logros y cementerio.', () => { MV.deleteGame(); MV.resetGlobal(); UI.g = null; UI.showCover(); }, 'Borrar todo')));
        body.append(l);
      }
    });
  };

  UI.showHelp = function () {
    UI.sheet({
      title: 'Cómo se juega', icon: '📖',
      render: (body) => {
        const p = (t) => h('p', null, t);
        body.append(h('div', { class: 'box' },
          p('Cada vez que tocas "+1 año" cumples años: pasan cosas, aparecen decisiones y tu vida se anota en el diario.'),
          p('Ocupación: escuela, universidad, empleos, carreras de fama, negocio propio y la cárcel si te portas mal.'),
          p('Bienes: dinero, vivienda, casas, autos, lujos, inversiones y deudas.'),
          p('Relaciones: familia, parejas, hijos, amigos, enemigos y mascotas. Cada persona tiene acciones propias.'),
          p('Actividades: gimnasio, médico, viajes, citas, casino, crimen, trámites y mucho más. Algunas tienen usos limitados por año.'),
          p('Estadísticas: felicidad, salud, inteligencia y apariencia, más estrés, karma y fama. Las habilidades se entrenan.'),
          p('A los 14 eliges una aspiración de vida. Cumplirla da una gran recompensa.'),
          p('Cuando mueres, puedes seguir como uno de tus hijos y heredar. Los logros y el cementerio se guardan entre vidas.'),
          p('Atajos de teclado: A para cumplir un año y Esc para cerrar una hoja.')));
      }
    });
  };

  UI.showAchievements = function () {
    UI.sheet({
      title: 'Logros', icon: '🏆', allowOver: true,
      render: (body) => {
        const glob = MV.global();
        body.append(note(`Desbloqueaste ${Object.keys(glob.ach).length} de ${MV.ACHIEVEMENTS.length}. Se conservan entre vidas.`));
        const grid = h('div', { class: 'ach-grid' });
        MV.ACHIEVEMENTS.forEach((A) => {
          const got = glob.ach[A.id];
          grid.append(h('div', { class: 'ach' + (got ? '' : ' locked') }, h('span', { class: 'e', 'aria-hidden': 'true' }, A.icon), h('div', null, h('b', null, A.name), A.desc, got && got.who ? h('div', { class: 'note', style: { margin: '2px 0 0' } }, got.who) : null)));
        });
        body.append(grid);
      }
    });
  };

  UI.showGraveyard = function () {
    UI.sheet({
      title: 'Cementerio', icon: '⚰️', allowOver: true,
      render: (body) => {
        const gy = MV.global().graveyard;
        if (!gy.length) { body.append(h('p', { class: 'empty' }, 'Todavía no murió nadie. Dale tiempo.')); return; }
        const l = h('div', { class: 'list' });
        gy.forEach((s) => l.append(UI.row(UI.avatar({ id: s.id, age: s.age, gender: s.gender, look: s.look, alive: false }, 40), s.name, `${s.born}–${s.died}, ${s.age} años. ${s.cause}. «${s.epitaph}»`, s.verdict ? s.verdict.icon : '')));
        body.append(l);
      }
    });
  };

  UI.showTree = function () {
    UI.sheet({
      title: 'Árbol de la dinastía', icon: '🌳',
      render: (body) => {
        const g = UI.g;
        const past = MV.global().graveyard.filter((s) => s.dynasty && s.dynasty.id === g.dynasty.id).sort((a, b) => a.generation - b.generation);
        const tree = h('div', { class: 'tree' });
        past.forEach((s) => tree.append(h('div', { class: 'tree-node' }, UI.avatar({ id: s.id, age: s.age, gender: s.gender, look: s.look, alive: false }, 48),
          h('div', null, h('div', { class: 'gen' }, `Generación ${s.generation}`), h('b', null, s.name), h('div', { class: 'note', style: { margin: 0 } }, `${s.born}–${s.died}. ${s.job}. Patrimonio ${U.moneyShort(s.worth)}.`)))));
        if (!g.over) tree.append(h('div', { class: 'tree-node current' }, UI.avatar(g.p, 48), h('div', null, h('div', { class: 'gen' }, `Generación ${g.generation} (ahora)`), h('b', null, MV.fullName(g.p)), h('div', { class: 'note', style: { margin: 0 } }, `${g.p.age} años. ${UI.occupation(g.p)}.`))));
        const kids = MV.rels(g, 'hijo', true);
        if (kids.length) {
          tree.append(h('div', { class: 'tree-node' }, h('span', { style: { fontSize: '1.6rem' } }, '🌱'), h('div', null, h('div', { class: 'gen' }, `Generación ${g.generation + 1}`), h('div', null, kids.map((x) => h('span', { class: 'tag' }, `${x.n.first}${x.n.alive ? ` (${x.n.age})` : ' ✝'}`))))));
        }
        body.append(tree);
      }
    });
  };

  // ——— Exportar / importar ———
  UI.exportFile = function () {
    try {
      const blob = new Blob([MV.exportData(UI.g)], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `mil-vidas-${UI.g ? UI.g.p.first.toLowerCase() : 'progreso'}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      UI.toast('💾', 'Partida exportada', 'Guarda el archivo en un lugar seguro.');
    } catch (e) { UI.toast('⚠️', 'No se pudo exportar', String(e.message || e)); }
  };
  UI.importFile = function () {
    const input = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const g = MV.importData(String(rd.result));
          UI.closeSheets();
          if (g) { UI.g = g; if (g.over) UI.showDeath(); else UI.renderGame(); } else UI.showCover();
          UI.toast('📂', 'Partida importada', '');
        } catch (e) { UI.toast('⚠️', 'No se pudo importar', e.message); }
      };
      rd.readAsText(f);
    });
    document.body.appendChild(input); input.click(); setTimeout(() => input.remove(), 60000);
  };

  UI.applyTheme = function () {
    const t = MV.global().settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  };
})(window.MV = window.MV || {});
