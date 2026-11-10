/* Mil Vidas — bucle anual (“+1 año”) y ejecutor genérico de acciones. */
(function (MV) {
  'use strict';
  const U = MV.U;

  /** Avanza un año. Devuelve false si no se puede (eventos pendientes o vida terminada). */
  MV.ageUp = function (g) {
    if (!g || g.over || g.queue.length) return false;
    const p = g.p;
    g.year++;
    p.age++;
    p.yearActs = {};
    g.log.push({ age: p.age, year: g.year, items: [] });
    MV.sys.world.yearly(g);
    MV.sys.people.yearly(g);
    MV.sys.health.yearly(g);
    if (!p.prison) MV.sys.edu.yearly(g);
    MV.sys.career.yearly(g);
    MV.sys.sports.yearly(g);
    MV.sys.money.yearly(g);
    MV.sys.cars.yearly(g);
    MV.sys.works.yearly(g);
    MV.sys.island.yearly(g);
    MV.sys.mythic.yearly(g);
    MV.sys.crime.yearly(g);
    MV.sys.rels.yearly(g);
    MV.sys.legacy.yearly(g);
    MV.sys.challenge.yearly(g);
    const cause = MV.sys.health.deathCheck(g);
    if (cause) { MV.sys.legacy.die(g, cause); return true; }
    MV.EV.runYear(g);
    MV.gcPeople(g);
    g.rng = MV.rng.getState();
    return true;
  };

  /** Borra NPC que ya no tienen relación con el jugador (candidatos rechazados, etc.). */
  MV.gcPeople = function (g) {
    const keep = new Set(g.p.rels.map((r) => r.id));
    if (g.p.flags.padreAusente) keep.add(g.p.flags.padreAusente);
    g.p.rels.forEach((r) => { const n = g.people[r.id]; if (n && n.otherParent) keep.add(n.otherParent); });
    g.queue.concat(g.later || []).forEach((it) => { if (it.ctx && it.ctx.target) keep.add(it.ctx.target); });
    Object.keys(g.people).forEach((id) => { if (!keep.has(id)) delete g.people[id]; });
  };

  const TIRED = ['Ya hiciste eso suficiente este año.', 'Tranquilo, el año tiene un límite. Prueba el próximo.', 'Tu cuerpo dice basta por este año.'];

  /**
   * Ejecuta una acción {id, icon, run(g,opt), limit, check?}. `check` devuelve un motivo para
   * rechazarla sin gastar el uso del año. `scope` guarda los usos por año
   * (por defecto, el año del jugador; las relaciones usan su propio contador).
   */
  MV.doAction = function (g, action, opt, scope, opt2) {
    if (g.over) return { msg: '', deltas: [] };
    const p = g.p;
    const sc = scope || p.yearActs;
    const used = sc[action.id] || 0;
    if (action.limit && used >= action.limit) return { msg: U.pick(TIRED), deltas: [], blocked: true, icon: '⏳' };
    const why = action.check && action.check(g, opt, opt2);
    if (why) return { msg: why, deltas: [], blocked: true, icon: action.icon };
    sc[action.id] = used + 1;
    if (sc !== p.yearActs) p.yearActs[action.id] = (p.yearActs[action.id] || 0) + 1;
    MV.fx.begin();
    let msg;
    try {
      msg = action.run(g, opt, opt2);
    } catch (e) {
      MV.fx.end();
      throw e;
    }
    const deltas = MV.fx.end();
    if (msg && !g.over) MV.log(g, msg, action.icon);
    g.rng = MV.rng.getState();
    return { msg: msg || '', deltas, icon: action.icon };
  };

  /** Uso restante de una acción en el año. */
  MV.usesLeft = function (g, action, scope) {
    if (!action.limit) return Infinity;
    return action.limit - ((scope || g.p.yearActs)[action.id] || 0);
  };
})(window.MV = window.MV || {});
