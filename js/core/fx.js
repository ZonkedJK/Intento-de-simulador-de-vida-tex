/* Mil Vidas — aplicación de efectos (estadísticas, dinero, habilidades...). */
(function (MV) {
  'use strict';
  const U = MV.U;

  const RANGE = {
    happy: [0, 100], health: [0, 100], smarts: [0, 100], looks: [0, 100],
    stress: [0, 100], fame: [0, 100], karma: [-100, 100]
  };

  const fx = {
    /** Cambios registrados desde el último `begin()` (para mostrar chips en la UI). */
    track: [],
    begin() { fx.track = []; },
    end() {
      const merged = {};
      fx.track.forEach((d) => { merged[d.k] = (merged[d.k] || 0) + d.d; });
      fx.track = [];
      return Object.keys(merged).filter((k) => Math.round(merged[k]) !== 0).map((k) => ({ k, d: Math.round(merged[k]) }));
    },

    get(p, key) {
      if (key in p.stats) return p.stats[key];
      return p[key] || 0;
    },

    /** Cambia una estadística del jugador, acotada. */
    stat(g, key, d) {
      const p = g.p;
      if (!d || !RANGE[key]) return 0;
      const [a, b] = RANGE[key];
      const before = fx.get(p, key);
      const after = U.clamp(Math.round(before + d), a, b);
      if (key in p.stats) p.stats[key] = after; else p[key] = after;
      if (after !== before) fx.track.push({ k: key, d: after - before });
      return after - before;
    },

    money(g, d) {
      d = Math.round(d || 0);
      if (!d) return;
      g.p.money += d;
      fx.track.push({ k: 'money', d });
    },

    skill(g, key, d) {
      const s = g.p.skills;
      if (!(key in s)) return;
      const before = s[key];
      // Rendimientos decrecientes: cuesta más subir cuando ya eres bueno.
      const eff = d > 0 ? d * (1 - before / 140) : d;
      s[key] = U.clamp(Math.round((before + eff) * 10) / 10, 0, 100);
      const real = Math.round(s[key] - before);
      if (real) fx.track.push({ k: 'skill:' + key, d: real });
    },

    addic(g, key, d) {
      const a = g.p.addic;
      a[key] = U.clamp((a[key] || 0) + d, 0, 100);
    },

    /** Sustituye {claves} en textos usando el contexto. */
    tpl(g, str, ctx) {
      if (typeof str !== 'string') return str;
      ctx = ctx || {};
      const t = ctx.target ? MV.person(g, ctx.target) : null;
      const r = t ? MV.relOf(g, t.id) : null;
      return str.replace(/\{(\w+)\}/g, (m, k) => {
        if (k === 'n') return g.p.first;
        if (k === 't') return t ? t.first : 'alguien';
        if (k === 'tl') return t ? MV.relLabel(r ? r.type : 'amigo', t).toLowerCase() : 'alguien';
        if (k === 'o') return U.gw(g.p.gender, 'o', 'a');
        if (k === 'to') return t ? U.gw(t.gender, 'o', 'a') : 'o';
        if (k === 'el') return t ? U.gw(t.gender, 'él', 'ella') : 'él';
        if (ctx[k] != null) return ctx[k];
        return m;
      });
    },

    /**
     * Aplica un efecto declarativo o una función. Devuelve el mensaje resultante.
     * Claves: happy, health, smarts, looks, stress, karma, fame, money, skills{}, addic{},
     * rel (cambia relación con ctx.target), cond (condición médica), flag, unflag,
     * count (contador), ach (logro), msg, then(g,ctx)->texto, p/ok/ko (azar).
     */
    apply(g, eff, ctx) {
      ctx = ctx || {};
      if (!eff) return '';
      if (typeof eff === 'function') {
        const r = eff(g, ctx);
        return typeof r === 'string' ? fx.tpl(g, r, ctx) : (r && typeof r === 'object' ? fx.apply(g, r, ctx) : '');
      }
      if (eff.p != null) {
        const prob = typeof eff.p === 'function' ? eff.p(g, ctx) : eff.p;
        const branch = U.chance(prob) ? eff.ok : eff.ko;
        const head = eff.msg ? fx.tpl(g, eff.msg, ctx) + ' ' : '';
        return (head + fx.apply(g, branch, ctx)).trim();
      }
      Object.keys(RANGE).forEach((k) => {
        if (eff[k] != null) {
          const v = Array.isArray(eff[k]) ? U.int(eff[k][0], eff[k][1]) : eff[k];
          fx.stat(g, k, v);
        }
      });
      if (eff.money != null) {
        const v = typeof eff.money === 'function' ? eff.money(g, ctx) :
          Array.isArray(eff.money) ? U.int(eff.money[0], eff.money[1]) : eff.money;
        fx.money(g, v);
        ctx.amount = U.money(Math.abs(v));
      }
      if (eff.skills) Object.keys(eff.skills).forEach((k) => {
        const v = eff.skills[k];
        fx.skill(g, k, Array.isArray(v) ? U.int(v[0], v[1]) : v);
      });
      if (eff.addic) Object.keys(eff.addic).forEach((k) => fx.addic(g, k, eff.addic[k]));
      if (eff.rel != null && ctx.target) {
        const r = MV.relOf(g, ctx.target);
        if (r) r.rel = U.clamp(r.rel + (Array.isArray(eff.rel) ? U.int(eff.rel[0], eff.rel[1]) : eff.rel), 0, 100);
      }
      if (eff.cond && MV.sys && MV.sys.health) MV.sys.health.add(g, eff.cond);
      if (eff.flag) g.p.flags[eff.flag] = true;
      if (eff.unflag) delete g.p.flags[eff.unflag];
      if (eff.count) g.p.counters[eff.count] = (g.p.counters[eff.count] || 0) + 1;
      if (eff.ach && MV.ach) MV.ach.unlock(g, eff.ach);
      let msg = eff.msg ? fx.tpl(g, Array.isArray(eff.msg) ? U.pick(eff.msg) : eff.msg, ctx) : '';
      if (eff.then) {
        const extra = eff.then(g, ctx);
        if (typeof extra === 'string' && extra) msg = (msg ? msg + ' ' : '') + fx.tpl(g, extra, ctx);
      }
      return msg;
    }
  };
  MV.fx = fx;
})(window.MV = window.MV || {});
