/* Mil Vidas — guardado en localStorage (con respaldo en memoria), exportar e importar. */
(function (MV) {
  'use strict';

  const KEY_GAME = 'milvidas.partida';
  const KEY_GLOBAL = 'milvidas.global';

  const store = {
    mem: {},
    get(k) {
      try {
        const v = window.localStorage.getItem(k);
        return v == null ? null : JSON.parse(v);
      } catch (e) {
        return k in store.mem ? JSON.parse(store.mem[k]) : null;
      }
    },
    set(k, v) {
      const s = JSON.stringify(v);
      try { window.localStorage.setItem(k, s); } catch (e) { store.mem[k] = s; }
    },
    del(k) {
      try { window.localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ }
      delete store.mem[k];
    }
  };
  MV.store = store;

  let globalCache = null;
  MV.global = function () {
    if (!globalCache) {
      const g = store.get(KEY_GLOBAL);
      globalCache = Object.assign({ ach: {}, graveyard: [], lives: 0, settings: {} }, g && typeof g === 'object' ? g : {});
    }
    return globalCache;
  };
  MV.saveGlobal = function () { store.set(KEY_GLOBAL, MV.global()); };
  MV.resetGlobal = function () { globalCache = null; store.del(KEY_GLOBAL); };

  MV.saveGame = function (g) {
    if (!g) return;
    g.rng = MV.rng.getState();
    store.set(KEY_GAME, g);
  };

  /** Actualiza partidas de versiones anteriores. */
  MV.migrate = function (g) {
    if (!g || typeof g !== 'object' || !g.p) return g;
    if (g.version === 1) {
      const p = g.p;
      p.club = p.club || null;
      p.sportsExp = p.sportsExp || {};
      p.talent = p.talent || MV.rollTalent();
      if (p.job && p.job.id === 'atleta') {
        p.job.id = 'sport_futbol'; p.job.type = 'sport'; p.job.club = MV.U.pick(MV.SPORTS.futbol.clubs);
        p.job.level = Math.min(p.job.level, MV.SPORTS.futbol.titles.length - 1);
        p.club = 'futbol'; p.sportsExp.futbol = Math.max(3, p.job.years || 0); p.flags.exAtleta = 'futbol';
      }
      (p.jobs || []).forEach((j) => { if (j.id === 'atleta') j.id = 'sport_futbol'; });
      g.version = 2;
    }
    if (g.version === 2) {
      const p = g.p;
      p.tattoos = p.tattoos || [];
      p.talent = p.talent || MV.rollTalent();
      (p.assets || []).forEach((a) => { if (a.type === 'casa') a.upgrades = a.upgrades || []; });
      // La v2 solo guardaba el último deporte profesional: así se puede volver del retiro.
      if (p.flags.exAtleta && MV.SPORTS[p.flags.exAtleta]) p.flags.proSports = Object.assign({ [p.flags.exAtleta]: true }, p.flags.proSports);
      g.version = 3;
    }
    if (g.version === 3) {
      // v4: obras, noticias del mundo y desafíos.
      g.p.works = g.p.works || [];
      g.world = g.world || null;
      g.challenge = g.challenge || null;
      g.version = 4;
    }
    if (g.version === 4) {
      // v5: licencias de vehículos y hasta 3 clubes o talleres.
      const p = g.p;
      p.licenses = Object.assign({ auto: !!p.license }, p.licenses);
      if (!Array.isArray(p.clubs)) p.clubs = p.club ? ['sport:' + p.club] : [];
      g.version = 5;
    }
    if (g.version === 5) {
      // v6: historia para gráficos, hobbies, rutina, favoritos; los autos viejos siguen siendo autos (sin modelo, tuneo ni seguro).
      const p = g.p;
      g.favs = Array.isArray(g.favs) ? g.favs : [];
      p.history = Array.isArray(p.history) ? p.history : [];
      p.hobbies = p.hobbies && typeof p.hobbies === 'object' ? p.hobbies : {};
      p.routine = Object.assign({ exercise: 'ninguno', diet: 'libre' }, p.routine);
      (p.assets || []).forEach((a) => { if (a.type === 'auto') { a.tune = a.tune || {}; a.insured = !!a.insured; } });
      g.version = 6;
    }
    return g;
  };

  MV.validGame = (g) => !!(g && typeof g === 'object' && g.version === MV.VERSION && g.p && g.people && Array.isArray(g.log) && Array.isArray(g.queue));

  MV.loadGame = function () {
    const g = MV.migrate(store.get(KEY_GAME));
    if (!MV.validGame(g)) return null;
    MV.rng.setState(g.rng || 1);
    return g;
  };
  MV.deleteGame = function () { store.del(KEY_GAME); };

  // — Ranuras de guardado (3) —
  MV.SLOTS = 3;
  const slotKey = (i) => {
    if (!(Number.isInteger(i) && i >= 0 && i < MV.SLOTS)) throw new Error('Ranura inválida: ' + i);
    return 'milvidas.ranura.' + i;
  };
  MV.saveSlot = function (i, g) {
    const k = slotKey(i);
    g.rng = MV.rng.getState();
    store.set(k, g);
  };
  /** Partida de una ranura (migrada a la versión actual) o null si está vacía o rota. */
  MV.loadSlot = function (i) {
    let k;
    try { k = slotKey(i); } catch (e) { return null; }
    const g = MV.migrate(store.get(k));
    if (!MV.validGame(g)) return null;
    MV.rng.setState(g.rng || 1);
    return g;
  };
  MV.deleteSlot = function (i) { store.del(slotKey(i)); };
  MV.slotsInfo = function () {
    const out = [];
    for (let i = 0; i < MV.SLOTS; i++) {
      const g = store.get(slotKey(i));
      out.push(g && g.p && g.p.first ? { i, name: MV.fullName(g.p), age: g.p.age, year: g.year, over: !!g.over } : null);
    }
    return out;
  };

  MV.exportData = function (g) {
    return JSON.stringify({ type: 'milvidas', v: MV.VERSION, date: new Date().toISOString(), game: g || null, global: MV.global() }, null, 1);
  };

  /** Importa un archivo exportado. Devuelve la partida (o null) y reemplaza el progreso global. */
  MV.importData = function (text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { throw new Error('El archivo no es un JSON válido.'); }
    if (!d || d.type !== 'milvidas') throw new Error('Este archivo no es una partida de Mil Vidas.');
    if (d.game) MV.migrate(d.game);
    if (d.game && !MV.validGame(d.game)) throw new Error('La partida del archivo está dañada o es de otra versión.');
    if (d.global && typeof d.global === 'object') {
      globalCache = Object.assign({ ach: {}, graveyard: [], lives: 0, settings: {} }, d.global);
      MV.saveGlobal();
    }
    if (d.game) { MV.rng.setState(d.game.rng || 1); MV.saveGame(d.game); }
    return d.game || null;
  };
})(window.MV = window.MV || {});
