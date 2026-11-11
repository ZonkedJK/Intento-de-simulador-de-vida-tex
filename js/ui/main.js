/* Mil Vidas — pantalla principal, capas (hojas y tarjetas), eventos y ejecución de acciones. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);

  UI.g = null;
  UI.diaryYears = 25;
  UI.save = () => { try { if (UI.g) MV.saveGame(UI.g); } catch (e) { console.error(e); } };

  // ——— Capas ———
  const layer = () => document.getElementById('layer');
  const stack = [];

  function pushLayer(node, kind, onClose) {
    const veil = h('div', { class: 'veil', onclick: () => { if (kind === 'sheet') UI.popSheet(); } });
    const wrap = h('div', { class: 'layer-item', 'data-kind': kind }, veil, node);
    layer().appendChild(wrap);
    const item = { wrap, node, kind, onClose };
    stack.push(item);
    return item;
  }
  function removeItem(item) {
    const i = stack.indexOf(item);
    if (i >= 0) stack.splice(i, 1);
    if (item.wrap.parentNode) item.wrap.parentNode.removeChild(item.wrap);
  }
  UI.topLayer = () => stack[stack.length - 1] || null;
  UI.anyLayer = () => stack.length > 0;

  /** Hoja inferior. o: {title, icon, render(body, api)} */
  UI.sheet = function (o) {
    const body = h('div', { class: 'sheet-body' });
    const back = stack.some((x) => x.kind === 'sheet');
    const head = h('div', { class: 'sheet-head' },
      back ? h('button', { class: 'icon-btn', 'aria-label': 'Volver', onclick: () => UI.popSheet() }, '‹') : null,
      h('h2', null, (o.icon ? o.icon + ' ' : '') + o.title),
      h('button', { class: 'icon-btn', 'aria-label': 'Cerrar', onclick: () => UI.closeSheets() }, '✕'));
    const node = h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title }, head, body);
    const item = pushLayer(node, 'sheet');
    item.render = () => {
      const scroll = body.scrollTop;
      UI.clear(body);
      if (UI.g && UI.g.over && !o.allowOver) { UI.closeSheets(); return; }
      o.render(body, { refresh: item.render, close: () => UI.popSheet() });
      body.scrollTop = scroll;
    };
    item.render();
    const f = node.querySelector('button.row, .cat, .choice, .btn');
    if (f) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) { /* */ } }, 30);
    return item;
  };
  UI.popSheet = function () {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].kind === 'sheet') { removeItem(stack[i]); break; }
    UI.refreshSheets();
  };
  UI.closeSheets = function () { stack.filter((x) => x.kind === 'sheet').forEach(removeItem); };
  UI.closeAll = function () { stack.slice().forEach(removeItem); };
  UI.refreshSheets = function () {
    const top = stack.filter((x) => x.kind === 'sheet').pop();
    if (top && top.render) top.render();
  };

  /** Tarjeta centrada (eventos, resultados, confirmaciones). */
  UI.card = function (content, opts) {
    opts = opts || {};
    const node = h('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'card' }, content));
    const item = pushLayer(node, 'card', opts.onClose);
    const f = node.querySelector('.choice, .btn');
    if (f) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) { /* */ } }, 30);
    return { close: () => removeItem(item), item };
  };

  UI.toast = function (icon, title, text, ms) {
    const box = document.getElementById('toasts');
    const t = h('div', { class: 'toast', role: 'status' }, h('span', { class: 'e' }, icon), h('div', null, title ? h('b', null, title) : null, title && text ? h('br') : null, text || ''));
    box.appendChild(t);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, ms || 3200);
  };

  UI.confirm = function (text, onYes, yesLabel) {
    const c = UI.card([
      h('h2', null, '🤔 ¿Seguro?'),
      h('p', { class: 'text' }, text),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn danger', onclick: () => { c.close(); onYes(); } }, yesLabel || 'Sí, hacerlo'),
        h('button', { class: 'btn', onclick: () => c.close() }, 'Mejor no'))
    ]);
  };

  // ——— Pantalla principal ———
  UI.occupation = function (p) {
    if (!p.alive) return 'Fallecid' + U.gw(p.gender, 'o', 'a');
    if (p.prison) return p.age < 18 ? 'En un centro de menores' : 'En prisión';
    if (p.wanted) return 'Prófug' + U.gw(p.gender, 'o', 'a');
    if (p.job) return MV.sys.career.title(p);
    if (p.edu.stage) return MV.sys.edu.stageName(p.edu);
    if (p.retired) return U.gw(p.gender, 'Jubilado', 'Jubilada');
    if (p.age < 3) return 'Bebé';
    if (p.age < 6) return 'Todavía no va a la escuela';
    if (p.age < 18) return 'No estudia';
    return 'Sin trabajo';
  };

  const lvl = (v) => 'lvl-' + MV.barLevel(v);
  UI.bar = function (v, max, invert) {
    const pct = U.clamp(Math.round((v / (max || 100)) * 100), 0, 100);
    return h('div', { class: 'bar', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(max || 100), 'aria-valuenow': String(Math.round(v)) },
      h('i', { class: lvl(invert ? 100 - pct : pct), style: { width: pct + '%' } }));
  };

  /** Barra compacta con el porcentaje (estado de bienes). */
  UI.condBar = function (cond) {
    const c = U.clamp(Math.round(cond), 0, 100);
    return h('span', { class: 'cond' }, h('span', { class: 'bar cond-bar', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(c), 'aria-label': 'Estado' },
      h('i', { class: lvl(c), style: { width: c + '%' } })), h('span', { class: 'cond-val' }, c + '%'));
  };

  UI.renderGame = function () {
    const app = UI.clear(document.getElementById('app'));
    const g = UI.g;
    const root = h('main', { class: 'screen-main' });
    UI.refs = {
      idcard: h('header', { class: 'idcard' }),
      diary: h('section', { class: 'diary', 'aria-label': 'Diario de vida' }),
      stats: h('section', { class: 'stats', 'aria-label': 'Estadísticas' }),
      nav: h('nav', { class: 'nav', 'aria-label': 'Acciones' })
    };
    root.append(h('div', { class: 'topbar' }, UI.refs.idcard), UI.refs.diary, h('div', { class: 'dock' }, UI.refs.stats));
    app.append(root, UI.refs.nav);
    UI.refs.lastCount = 0;
    UI.refreshGame();
    if (g) setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 20);
  };

  UI.refreshGame = function (fresh) {
    const g = UI.g, p = g.p, R = UI.refs;
    if (!R) return;
    const before = R.snap;
    // Carnet
    UI.clear(R.idcard);
    const C = MV.COUNTRIES[p.country] || { flag: '' };
    R.idcard.append(
      h('button', { class: 'who', onclick: () => UI.showProfile(), 'aria-label': 'Ver ficha personal' },
        UI.avatar(p, 56),
        h('span', { class: 'who-text' },
          h('span', { class: 'name' }, MV.fullName(p)),
          h('span', { class: 'sub', style: { display: 'block' } }, `${p.age} año${p.age === 1 ? '' : 's'}, ${UI.occupation(p).toLowerCase()} ${C.flag}`))),
      h('span', { class: 'right' },
        h('span', { class: 'money' + (p.money < 0 ? ' neg' : ''), title: 'Dinero en efectivo', 'data-money': '' }, U.moneyShort(p.money)),
        h('button', { class: 'icon-btn', 'aria-label': 'Menú', onclick: () => UI.showMenu() }, '☰')));
    // Diario
    renderDiary(fresh);
    // Estadísticas
    UI.clear(R.stats);
    ['happy', 'health', 'smarts', 'looks'].forEach((k) => {
      const v = p.stats[k];
      R.stats.append(h('div', { class: 'stat', 'data-stat': k },
        h('span', { 'aria-hidden': 'true' }, MV.STATS[k].icon),
        h('div', null, h('div', { class: 'lbl' }, MV.STATS[k].name), UI.bar(v)),
        h('span', { class: 'val' }, v)));
    });
    const chips = h('div', { class: 'chips' });
    const wb = MV.sys.wellbeing.score(g);
    chips.append(h('span', { class: 'chip' + (wb.score < 40 ? ' warn' : wb.score >= 60 ? ' ok' : ''), id: 'wellbeing-chip', title: 'Bienestar: felicidad, salud, calma y vínculos' }, `💚 Bienestar ${wb.score} · ${wb.label}`));
    chips.append(h('span', { class: 'chip' + (p.stress >= 70 ? ' warn' : '') }, `😰 Estrés ${p.stress}`));
    chips.append(h('span', { class: 'chip' }, `☯️ Karma ${p.karma > 0 ? '+' : ''}${p.karma}`));
    if (p.fame > 0) chips.append(h('span', { class: 'chip' }, `⭐ Fama ${p.fame}`));
    if (p.followers > 0) chips.append(h('span', { class: 'chip' }, `📱 ${U.num(p.followers)}`));
    if (p.conds.length) chips.append(h('span', { class: 'chip warn' }, `🤒 ${p.conds.map((c) => (MV.CONDITIONS[c.id] || {}).name).join(', ')}`));
    if (p.prison) chips.append(h('span', { class: 'chip warn' }, `🔒 ${p.prison.left} año${p.prison.left === 1 ? '' : 's'} de condena`));
    R.stats.append(chips);
    // Navegación
    renderNav();
    R.snap = UI.snap();
    if (fresh && before) UI.animateChange(before);
  };

  function renderDiary(fresh) {
    const g = UI.g, R = UI.refs;
    UI.clear(R.diary);
    const start = Math.max(0, g.log.length - UI.diaryYears);
    if (start > 0) R.diary.append(h('button', { class: 'more-years', onclick: () => { UI.diaryYears += 30; renderDiary(); } }, `Ver ${Math.min(30, start)} años anteriores`));
    let total = 0;
    g.log.forEach((y) => { total += y.items.length; });
    const prevCount = R.lastCount || 0;
    let idx = 0;
    g.log.forEach((y, yi) => {
      if (yi < start) { idx += y.items.length; return; }
      const isCur = yi === g.log.length - 1;
      const sec = h('article', { class: 'year' + (isCur ? ' current' : '') },
        h('h3', null, h('span', { class: 'age' }, y.age === 0 ? 'Nacimiento' : `${y.age} año${y.age === 1 ? '' : 's'}`), h('span', { class: 'cal' }, String(y.year))));
      y.items.forEach((it) => {
        const isNew = fresh && idx >= prevCount;
        sec.append(h('div', { class: 'entry' + (it.tone ? ' ' + it.tone : '') + (isNew ? ' fresh' : '') }, h('span', { class: 'ic', 'aria-hidden': 'true' }, it.i), h('span', { class: 'tx' }, it.tone === 'good' ? UI.hl(it.t, 'green') : it.tone === 'bad' ? UI.hl(it.t, 'pink') : it.t)));
        idx++;
      });
      if (!y.items.length) sec.append(h('div', { class: 'entry' }, h('span', { class: 'ic' }, '·'), h('span', { class: 'tx', style: { color: 'var(--pencil)' } }, 'Un año tranquilo. Demasiado tranquilo.')));
      R.diary.append(sec);
    });
    R.lastCount = total;
  }

  function renderNav() {
    const g = UI.g, R = UI.refs;
    UI.clear(R.nav);
    const btn = (e, label, fn, dis) => h('button', { class: 'nav-btn', onclick: fn, disabled: !!dis }, h('span', { class: 'e', 'aria-hidden': 'true' }, e), label);
    const pending = g.queue.length > 0;
    R.nav.append(
      btn('💼', 'Ocupación', () => UI.showWork()),
      btn('🏠', 'Bienes', () => UI.showAssets()),
      h('button', { class: 'ageup' + (pending ? ' pending' : ''), onclick: () => UI.ageUp(), 'aria-label': pending ? 'Ver evento pendiente' : 'Avanzar un año' },
        h('span', { class: 'big' }, pending ? '¡!' : '+1'), h('span', { class: 'small' }, pending ? 'evento' : 'año')),
      btn('👥', 'Relaciones', () => UI.showRelations()),
      btn('🎲', 'Actividades', () => UI.showActivities()),
      h('button', { class: 'ageup5', onclick: () => UI.ageUpMany(5), disabled: pending || g.over, 'aria-label': 'Avanzar hasta 5 años', title: 'Avanzar hasta 5 años: se detiene en cada decisión o aviso' }, '⏩ 5'));
  }

  // ——— Flujo de juego ———
  UI.ageUp = function () {
    const g = UI.g;
    if (!g || g.over) return;
    if (g.queue.length) { UI.flushQueue(); return; }
    UI.closeSheets();
    const before = MV.sys.history.snapshot(g);
    try {
      MV.ageUp(g);
    } catch (e) {
      console.error(e);
      UI.toast('⚠️', 'Algo falló al avanzar el año', 'La partida se guardó igual. Si se repite, exporta la partida desde el menú.');
    }
    UI.save();
    UI.refreshGame(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (g.over) { setTimeout(() => { if (UI.g === g) UI.showDeath(); }, 650); return; }
    UI.flushQueue(() => UI.showYearSummary(before));
  };

  /** Avanza hasta `n` años seguidos; se detiene ante una decisión, un aviso o la muerte. */
  UI.ageUpMany = function (n) {
    const g = UI.g;
    if (!g || g.over) return;
    if (g.queue.length) { UI.flushQueue(); return; }
    UI.closeSheets();
    const before = MV.sys.history.snapshot(g);
    for (let i = 0; i < n; i++) {
      const prev = MV.sys.history.snapshot(g);
      let ok = false;
      try { ok = MV.ageUp(g); } catch (e) {
        console.error(e);
        UI.toast('⚠️', 'Algo falló al avanzar el año', 'La partida se guardó igual. Si se repite, exporta la partida desde el menú.');
        break;
      }
      if (!ok || g.over || g.queue.length || MV.sys.history.shouldPause(prev, g)) break;
    }
    UI.save();
    UI.refreshGame(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (g.over) { setTimeout(() => { if (UI.g === g) UI.showDeath(); }, 650); return; }
    UI.flushQueue(() => UI.showYearSummary(before));
  };

  /** Tarjeta "Tu año a los N": cuánto cambió cada estadística y el dinero, y lo más importante del diario. */
  UI.showYearSummary = function (before) {
    const g = UI.g;
    if (!g || g.over || !before || MV.global().settings.yearSummary === false) return;
    const s = MV.sys.history.yearSummary(before, g);
    if (s.age <= before.age) return;
    const c = UI.card([h('div', { id: 'year-summary' },
      h('h2', null, h('span', { 'aria-hidden': 'true' }, '🗓️ '), s.title),
      s.changes.length ? UI.deltas(s.changes) : h('p', { class: 'note' }, 'Nada cambió. Un año de esos que no se cuentan.'),
      s.highlights.length ? h('ul', { class: 'year-highlights' }, s.highlights.map((t) => h('li', null, t))) : null,
      h('button', { class: 'btn primary block', onclick: () => c.close() }, 'Seguir'))]);
  };

  const STAT_NAME = (k) => {
    if (k === 'money') return 'Dinero';
    if (k === 'rel') return 'Relación';
    if (k.startsWith('skill:')) return MV.SKILLS[k.slice(6)].name;
    return MV.STATS[k] ? MV.STATS[k].name : k;
  };
  const STAT_ICON = (k) => (k === 'money' ? '💵' : k === 'rel' ? '💞' : k.startsWith('skill:') ? MV.SKILLS[k.slice(6)].icon : (MV.STATS[k] || {}).icon || '');
  UI.deltas = function (ds) {
    if (!ds || !ds.length) return null;
    const box = h('div', { class: 'deltas' });
    ds.forEach((d) => {
      const bad = d.k === 'stress' ? d.d > 0 : d.d < 0;
      const val = d.k === 'money' ? (d.d > 0 ? '+' : '−') + U.money(Math.abs(d.d)) : (d.d > 0 ? '+' : '') + d.d;
      box.append(h('span', { class: 'delta ' + (bad ? 'down' : 'up') }, `${STAT_ICON(d.k)} ${val} ${d.k === 'money' ? '' : STAT_NAME(d.k)}`.trim()));
    });
    return box;
  };

  function afterChange() {
    UI.save();
    UI.refreshGame(true);
    UI.refreshSheets();
  }

  /** Muestra en orden los eventos pendientes. */
  UI.flushQueue = function (done) {
    const g = UI.g;
    if (g.over) { afterChange(); UI.closeSheets(); UI.showDeath(); return; }
    const v = MV.EV.view(g);
    if (!v) { afterChange(); if (done) done(); return; }
    UI.closeSheets();
    const content = [];
    if (v.scene) content.push(h('div', { class: 'scene', html: UI.sceneSVG(v.scene) }));
    if (v.target) content.push(h('div', { class: 'who-line' }, UI.avatar(v.target, 40), h('span', null, `${MV.fullName(v.target)}, ${v.target.age} años`)));
    content.push(h('h2', null, h('span', { 'aria-hidden': 'true' }, v.icon), v.title || 'Este año'));
    content.push(h('p', { class: 'text' }, v.text));
    const choices = h('div', { class: 'choices' });
    let card;
    v.choices.forEach((c) => choices.append(h('button', {
      class: 'choice', onclick: () => {
        let res;
        try { res = MV.EV.choose(g, c.i); } catch (e) { console.error(e); res = { msg: 'Algo raro pasó (error del juego). Seguimos adelante.', deltas: [] }; }
        card.close();
        afterChange();
        if (v.info || !res || (!res.msg && !(res.deltas || []).length)) { UI.flushQueue(done); return; }
        UI.showResult(res, () => UI.flushQueue(done), v.icon);
      }
    }, c.label)));
    content.push(choices);
    card = UI.card(content);
  };

  UI.showResult = function (res, next, icon, extra) {
    const c = UI.card([
      extra || null,
      h('p', { class: 'result' }, h('span', { 'aria-hidden': 'true' }, (res.icon || icon || '📖') + ' '), res.msg),
      UI.deltas(res.deltas),
      h('button', { class: 'btn primary block', onclick: () => { c.close(); if (next) next(); } }, 'Continuar')
    ]);
  };

  /** Ejecuta una acción con opciones, confirmación y resultado. */
  /** Ejecuta una acción ya elegida y muestra el resultado (lo usan las listas, el estudio de tatuajes, etc.). */
  UI.execAction = function (a, opt, scope, relRef, opt2, extra) {
    const g = UI.g;
    let res;
    const before = relRef ? relRef.rel : 0;
    try { res = MV.doAction(g, a, opt, scope, opt2); } catch (e) { console.error(e); UI.toast('⚠️', 'Error', 'Esa acción falló. Prueba otra.'); return null; }
    if (res.blocked) { UI.toast(res.icon || '⏳', '', res.msg); UI.refreshSheets(); return res; }
    if (relRef && Math.round(relRef.rel - before)) res.deltas.unshift({ k: 'rel', d: Math.round(relRef.rel - before) });
    afterChange();
    const finish = () => {
      if (g.over) { UI.closeSheets(); UI.showDeath(); return; }
      if (g.queue.length) UI.flushQueue(() => UI.refreshSheets());
      else UI.refreshSheets();
    };
    if (res.msg) UI.showResult(res, finish, a.icon, typeof extra === 'function' ? extra(res) : extra);
    else finish();
    return res;
  };

  /** Ejecuta una acción con opciones, confirmación y resultado. */
  UI.runAction = function (a, scope, relRef) {
    const g = UI.g;
    if (a.ui === 'tattoo') { UI.showTattooStudio(a); return; }
    if (a.ui === 'work') { UI.showWorkStudio(a); return; }
    if (a.ui === 'quiz') { UI.showQuiz(a); return; }
    if (a.ui === 'gift' && UI.showGiftPicker) { UI.showGiftPicker(a, scope, relRef); return; }
    const go = (opt, opt2) => (a.confirm ? UI.confirm(a.confirm, () => UI.execAction(a, opt, scope, relRef, opt2)) : UI.execAction(a, opt, scope, relRef, opt2));
    const pickList = (title, os, onPick) => UI.sheet({
      title, icon: a.icon,
      render: (body) => {
        const list = h('div', { class: 'list' });
        os.forEach((o) => list.append(UI.row(o.icon || a.icon, o.label, o.sub, null, () => onPick(o))));
        body.append(list);
      }
    });
    if (a.opts) {
      const os = a.opts(g) || [];
      if (!os.length) { UI.toast('🤷', a.label, 'Ahora mismo no tienes opciones para esto (¿falta dinero?).'); return; }
      pickList(a.label, os, (o) => {
        if (a.opts2) {
          const os2 = a.opts2(g, o.id) || [];
          pickList(a.opts2Title || a.label, os2, (o2) => { UI.popSheet(); UI.popSheet(); go(o.id, o2.id); });
          return;
        }
        UI.popSheet(); go(o.id);
      });
      return;
    }
    go();
  };

  /** Fila de lista. */
  UI.row = function (icon, label, sub, right, onClick, disabled) {
    const kids = [h('span', { class: 'ri', 'aria-hidden': 'true' }, icon || '•'), h('span', { class: 'rt' }, h('span', { class: 'rl' }, label), sub ? h('span', { class: 'rs' }, sub) : null), right != null ? (typeof right === 'object' ? right : h('span', { class: 'rx' }, right)) : h('span')];
    return onClick ? h('button', { class: 'row', onclick: onClick, disabled: !!disabled }, kids) : h('div', { class: 'row' }, kids);
  };

  /** Lista de acciones (con usos restantes). */
  UI.actionList = function (actions, scope, relRef, opts) {
    const list = h('div', { class: 'list' });
    actions.forEach((a) => {
      const left = MV.usesLeft(UI.g, a, scope);
      const right = a.limit ? (left > 0 ? `${left}/${a.limit}` : 'Hecho') : '';
      const row = UI.row(a.icon, a.label, a.sub, right, () => UI.runAction(a, scope, relRef), left <= 0);
      if (!(opts && opts.fav)) { list.append(row); return; }
      const on = (UI.g.favs || []).includes(a.id);
      list.append(h('div', { class: 'row-fav' }, row, h('button', { type: 'button', class: 'fav-btn' + (on ? ' on' : ''), 'aria-pressed': String(on),
        'aria-label': on ? `Quitar ${a.label} de favoritas` : `Marcar ${a.label} como favorita`, title: on ? 'Quitar de favoritas' : 'Marcar como favorita',
        onclick: () => { MV.toggleFav(UI.g, a.id); UI.save(); UI.refreshSheets(); } }, on ? '★' : '☆')));
    });
    return list;
  };
})(window.MV = window.MV || {});
