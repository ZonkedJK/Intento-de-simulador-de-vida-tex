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
    const slots = MV.slotsInfo().filter(Boolean).length;
    actions.append(h('div', { class: 'btn-row' },
      slots ? h('button', { class: 'btn', id: 'cover-slots', style: { flex: 1 }, onclick: () => UI.showSlots() }, `🗂️ Partidas guardadas (${slots})`) : null,
      h('button', { class: 'btn', id: 'cover-settings', style: { flex: 1 }, onclick: () => UI.showSettings() }, '⚙️ Ajustes')));
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
    const chal = h('select', { class: 'select', id: 'f-challenge' }, h('option', { value: '' }, 'Sin desafío'),
      MV.CHALLENGES.map((c) => h('option', { value: c.id }, `${c.icon} ${c.name}`)));
    const chalNote = h('p', { class: 'note', id: 'f-challenge-desc', style: { margin: '4px 0 0' } }, 'Una meta para esta vida. Si la cumples, ganas un logro.');
    chal.addEventListener('change', () => { const C = MV.CHALLENGES.find((c) => c.id === chal.value); chalNote.textContent = C ? C.desc : 'Una meta para esta vida. Si la cumples, ganas un logro.'; });
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
      opts.challenge = chal.value || null;
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
          h('div', { class: 'field' }, h('label', { for: 'f-challenge' }, 'Desafío (opcional)'), chal, chalNote),
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
    // Lápida, pasto, causa y epitafio
    root.append(h('div', { class: 'tomb' },
      h('div', { class: 'rip' }, 'Aquí yace'),
      h('h1', null, s.name),
      h('div', { class: 'dates' }, `${s.born} – ${s.died} · ${s.age} año${s.age === 1 ? '' : 's'}`),
      UI.avatar({ id: s.id, age: s.age, gender: s.gender, look: s.look, alive: false }, 62)));
    root.append(h('div', { class: 'grass', 'aria-hidden': 'true' }));
    root.append(h('p', { class: 'cause' }, 'Murió por ', UI.hl(s.cause, 'pink'), /[.!?…]$/.test(s.cause) ? '' : '.'));
    root.append(h('p', { class: 'epitaph' }, `«${s.epitaph}»`));
    root.append(h('div', { class: 'box verdict' }, h('span', { class: 'e', 'aria-hidden': 'true' }, s.verdict.icon), h('div', null, h('b', null, s.verdict.name), h('p', { style: { margin: 0 } }, s.verdict.text))));
    // Gráficos de la vida
    root.append(title('💰 Tu vida en gráficos'), UI.lifeCharts(g.p, 'death-charts'));
    // Herederos
    if (heirs.length) {
      const grandHeirs = (MV.relOf(g, heirs[0].id) || {}).type === 'nieto';
      root.append(title('👪 Continuar la dinastía'), note(`Juega como uno de tus ${grandHeirs ? 'nietos' : 'hijos'}. Heredará tu patrimonio (menos impuestos).`));
      const l = h('div', { class: 'list' });
      heirs.forEach((n) => l.append(UI.row(UI.avatar(n, 38), MV.fullName(n), `${MV.relLabel((MV.relOf(g, n.id) || {}).type || 'hijo', n)}, ${n.age} años${g.p.heirId === n.id ? ', heredero principal' : ''}`, h('span', { class: 'go' }, 'Continuar'), () => {
        const ng = MV.sys.legacy.continueAs(g, n.id);
        UI.startGame(ng);
      })));
      root.append(l);
    }
    // Datos, compartir y logros
    root.append(h('div', { class: 'box' },
      kv('Patrimonio', U.money(s.worth)), kv('Ocupación', s.job), kv('Estudios', s.edu), kv('Hijos', String(s.kids)), kv('Matrimonios', String(s.marriages)),
      kv('Delitos', String(s.crimes)), kv('Karma', String(s.karma)), kv('Fama', String(s.fame)), kv('Generación', `${s.generation} de la dinastía ${s.dynasty ? s.dynasty.name : ''}`),
      s.aspiration ? kv('Aspiración', `${s.aspiration.name || ''}: ${s.aspiration.done ? 'cumplida' : 'sin cumplir'}`) : null));
    const shareText = MV.sys.legacy.summaryText(g);
    root.append(h('div', { class: 'btn-row' },
      h('button', { class: 'btn', id: 'copy-summary', style: { flex: 1 }, onclick: () => UI.copyText(shareText) }, '📋 Copiar resumen'),
      typeof navigator !== 'undefined' && navigator.share ? h('button', { class: 'btn', style: { flex: 1 }, onclick: () => navigator.share({ title: 'Mil Vidas', text: shareText }).catch(() => {}) }, '📤 Compartir') : null));
    if (s.ach.length) {
      root.append(title('Logros de esta vida'));
      const grid = h('div', { class: 'ach-grid' });
      s.ach.forEach((id) => { const A = MV.ach.def(id); if (A) grid.append(h('div', { class: 'ach' }, h('span', { class: 'e' }, A.icon), h('div', null, h('b', null, A.name), A.desc))); });
      root.append(grid);
    }
    root.append(h('div', { class: 'btn-row' },
      h('button', { class: 'btn primary', style: { flex: 1 }, onclick: () => UI.showCreate() }, 'Una vida nueva'),
      h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showGraveyard() }, '⚰️ Cementerio'),
      h('button', { class: 'btn', style: { flex: 1 }, onclick: () => UI.showCover() }, 'Portada')));
    if (MV.slotsInfo().some(Boolean)) root.append(h('button', { class: 'btn block', id: 'death-slots', style: { marginTop: '8px' }, onclick: () => UI.showSlots() }, '🗂️ Volver a una partida guardada'));
    root.append(title('El diario completo'));
    const diary = h('details', { class: 'box' }, h('summary', null, 'Leer toda la vida'),
      g.log.map((y) => h('div', null, h('p', { class: 'hand', style: { fontWeight: 700, margin: '10px 0 2px' } }, `${y.age} años (${y.year})`), y.items.map((it) => h('div', { class: 'entry' }, h('span', { class: 'ic' }, it.i), h('span', { class: 'tx' }, it.t))))));
    root.append(diary);
    app.append(root);
    window.scrollTo(0, 0);
  };

  /** Copia un texto al portapapeles; si el navegador no deja, lo muestra para copiarlo a mano. */
  UI.copyText = function (text) {
    const manual = () => UI.sheet({ title: 'Resumen de la vida', icon: '📋', allowOver: true, render: (body) => {
      const ta = h('textarea', { class: 'input', id: 'summary-text', rows: '10', readonly: 'readonly', style: { width: '100%', fontFamily: 'inherit' } });
      ta.value = text;
      body.append(note('Tu navegador no dejó copiar automáticamente. Mantén presionado el texto para copiarlo.'), ta);
      setTimeout(() => { ta.focus(); ta.select(); }, 0);
    } });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Si el permiso nunca responde, a los 1,5 s se ofrece la copia manual.
        let done = false;
        const finish = (fn) => () => { if (done) return; done = true; clearTimeout(timer); fn(); };
        const timer = setTimeout(finish(manual), 1500);
        navigator.clipboard.writeText(text).then(finish(() => UI.toast('📋', 'Copiado', 'Pega el resumen donde quieras.')), finish(manual));
        return;
      }
    } catch (e) { /* sigue con la copia manual */ }
    manual();
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
        const wb = MV.sys.wellbeing.score(g);
        body.append(title('Tu vida en gráficos'));
        body.append(UI.lifeCharts(p, 'profile-charts'));
        body.append(title('Bienestar y rutina'));
        const wbox = h('div', { class: 'box', id: 'profile-wellbeing' });
        wbox.append(h('div', { class: 'skill-row' }, h('span', null, '💚'), h('span', null, `Bienestar: ${wb.label}`), UI.bar(wb.score), h('b', null, wb.score)));
        wbox.append(note('Mezcla tu felicidad (35 %), tu salud (30 %), tu calma (20 %) y tus vínculos cercanos (15 %).'));
        const routine = Object.assign({ exercise: 'ninguno', diet: 'libre' }, p.routine);
        [['exercise', '🏃 Ejercicio'], ['diet', '🥗 Dieta']].forEach(([part, lbl]) => {
          wbox.append(h('b', null, lbl));
          const row = h('div', { class: 'font-row', role: 'radiogroup', 'aria-label': lbl });
          Object.keys(MV.ROUTINES[part]).forEach((k) => {
            const R = MV.ROUTINES[part][k];
            row.append(h('button', { type: 'button', id: `routine-${part}-${k}`, class: 'chip-btn' + (routine[part] === k ? ' on' : ''), role: 'radio', 'aria-checked': String(routine[part] === k),
              title: R.cost ? `${U.money(R.cost)} al año` : 'Gratis', onclick: () => { MV.sys.wellbeing.setRoutine(g, part, k); UI.save(); UI.refreshSheets(); } }, `${R.name}${R.cost ? ' · ' + U.money(R.cost) : ''}`));
          });
          wbox.append(row);
        });
        const hob = Object.keys(p.hobbies || {}).filter((k) => p.hobbies[k].streak > 0 && MV.HOBBIES[k]);
        wbox.append(note(hob.length ? 'Rachas: ' + hob.map((k) => `${MV.HOBBIES[k].icon} ${MV.HOBBIES[k].name.toLowerCase()} ${p.hobbies[k].streak}`).join(', ') + '.' : 'Practica un hobby en Actividades → Mente y cuerpo para sumar rachas.'));
        body.append(wbox);
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
        body.append(title('Mis obras'));
        body.append(h('div', { class: 'box' }, UI.worksList()));
        body.append(title('Aspiración de vida'));
        const A = p.aspiration && MV.ASPIRATIONS.find((a) => a.id === p.aspiration.id);
        body.append(h('div', { class: 'box' }, A ? h('p', null, `${A.icon} ${A.name}: ${A.desc} ${p.aspiration.done ? '¡Cumplida!' : ''}`) : h('p', null, p.age < 14 ? 'La elegirás a los 14 años.' : 'Sin aspiración. Vives al día.')));
        const ch = MV.sys.challenge.status(g);
        if (ch) {
          body.append(title('Desafío'));
          body.append(h('div', { class: 'box', id: 'profile-challenge' }, h('p', { style: { margin: 0 } }, h('b', null, MV.sys.challenge.label(g))), h('p', { class: 'note', style: { margin: '4px 0 0' } }, ch.def.desc)));
        }
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
        body.append(h('div', { class: 'box' }, h('div', { class: 'kv', id: 'profile-licenses' }, h('span', null, 'Licencias'), h('span', null, MV.sys.license.held(UI.g).join(', ') || 'Ninguna')), kv('Seguidores', U.num(p.followers)), kv('Viajes', String(p.counters.viajes || 0)), kv('Delitos cometidos', String(p.counters.delitos || 0))));
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
        l.append(UI.row('⚙️', 'Ajustes', `Tema ${{ auto: 'automático', light: 'claro', dark: 'oscuro' }[theme]}, letra, animaciones y resumen del año`, '›', () => UI.showSettings()));
        l.append(UI.row('🗂️', 'Partidas guardadas', `${MV.slotsInfo().filter(Boolean).length} de ${MV.SLOTS} ranuras ocupadas`, '›', () => UI.showSlots()));
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

  // ——— Ajustes ———
  const FONTS = { normal: 'Normal', grande: 'Grande', muy_grande: 'Muy grande' };
  UI.showSettings = function () {
    UI.sheet({
      title: 'Ajustes', icon: '⚙️', allowOver: true,
      render: (body) => {
        const glob = MV.global(), st = glob.settings;
        const save = () => { MV.saveGlobal(); UI.applyTheme(); UI.refreshSheets(); };
        const theme = st.theme || 'auto';
        const l = h('div', { class: 'list' });
        l.append(UI.row('🌓', 'Tema', { auto: 'Automático', light: 'Cuaderno (claro)', dark: 'Pizarrón (oscuro)' }[theme], 'Cambiar', () => { st.theme = { auto: 'light', light: 'dark', dark: 'auto' }[theme]; save(); }));
        const anim = UI.row('✨', 'Animaciones', st.anim === false ? 'Apagadas' : 'Números que flotan, avatar que reacciona y dinero que cuenta', st.anim === false ? 'Encender' : 'Apagar', () => { st.anim = st.anim === false; save(); });
        anim.id = 'set-anim'; anim.setAttribute('aria-pressed', String(st.anim !== false));
        l.append(anim);
        const sum = UI.row('🗓️', 'Resumen del año', st.yearSummary === false ? 'No se muestra' : 'Una tarjeta con lo más importante después de cada año', st.yearSummary === false ? 'Encender' : 'Apagar', () => { st.yearSummary = st.yearSummary === false; save(); });
        sum.id = 'set-summary'; sum.setAttribute('aria-pressed', String(st.yearSummary !== false));
        l.append(sum);
        body.append(l);
        body.append(h('h3', { class: 'section-title' }, 'Tamaño de letra'));
        const fr = h('div', { class: 'font-row', role: 'radiogroup', 'aria-label': 'Tamaño de letra' });
        Object.keys(FONTS).forEach((k) => fr.append(h('button', { type: 'button', id: 'set-font-' + k, class: 'chip-btn' + ((st.font || 'normal') === k ? ' on' : ''), role: 'radio', 'aria-checked': String((st.font || 'normal') === k),
          onclick: () => { st.font = k; save(); } }, FONTS[k])));
        body.append(fr);
      }
    });
  };

  // ——— Partidas guardadas ———
  UI.showSlots = function () {
    UI.sheet({
      title: 'Partidas guardadas', icon: '🗂️', allowOver: true,
      render: (body) => {
        const g = UI.g;
        body.append(h('p', { class: 'note' }, 'Guarda tu vida en una ranura para volver a ella cuando quieras. La partida en curso se sigue guardando sola.'));
        MV.slotsInfo().forEach((info, i) => {
          const box = h('div', { class: 'box slot' }, h('b', null, `Ranura ${i + 1}`), h('div', { class: 'note', style: { margin: '2px 0 0' } },
            info ? `${info.name}, ${info.age} año${info.age === 1 ? '' : 's'} · ${info.year}${info.over ? ' · vida terminada' : ''}` : 'Vacía'));
          const doSave = () => { MV.saveSlot(i, g); UI.toast('💾', 'Guardada', `Tu vida quedó en la ranura ${i + 1}.`); UI.refreshSheets(); };
          const btns = h('div', { class: 'btn-row' },
            h('button', { type: 'button', id: 'slot-save-' + i, class: 'btn', disabled: !g || g.over, onclick: () => (info ? UI.confirm(`La ranura ${i + 1} ya tiene a ${info.name}. ¿La reemplazas por tu vida actual?`, doSave, 'Reemplazar') : doSave()) }, '💾 Guardar aquí'),
            h('button', { type: 'button', id: 'slot-load-' + i, class: 'btn', disabled: !info, onclick: () => UI.confirm('Vas a cargar esta partida. La vida actual se reemplaza (guárdala antes en otra ranura si la quieres).', () => {
              const ng = MV.loadSlot(i);
              if (!ng) { UI.toast('⚠️', 'No se pudo cargar', 'La ranura está vacía o dañada.'); UI.refreshSheets(); return; }
              UI.closeAll(); UI.g = ng; UI.diaryYears = 25; UI.save();
              if (ng.over) UI.showDeath(); else { UI.renderGame(); UI.flushQueue(); }
            }, 'Cargar') }, '📂 Cargar'),
            h('button', { type: 'button', id: 'slot-del-' + i, class: 'btn', disabled: !info, onclick: () => UI.confirm(`Se borra la ranura ${i + 1}. Tu vida actual no se toca.`, () => { MV.deleteSlot(i); UI.refreshSheets(); }, 'Borrar') }, '🗑️ Borrar'));
          box.append(btns);
          body.append(box);
        });
      }
    });
  };

  /** Aplica el tema y el tamaño de letra de los ajustes. */
  UI.applyTheme = function () {
    const f = MV.global().settings.font;
    if (f === 'grande' || f === 'muy_grande') document.documentElement.setAttribute('data-font', f);
    else document.documentElement.removeAttribute('data-font');
    const t = MV.global().settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  };
})(window.MV = window.MV || {});
