/* Mil Vidas — bolsa de valores: precios con noticias, crash, burbujas, dividendos, compra y venta. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const DRIFT = 0.06, COMMISSION = 0.01, MAX_HIST = 60, MIN_PRICE = 0.5;
  const round2 = (v) => Math.round(v * 100) / 100;
  const stockOf = (id) => MV.STOCKS.find((s) => s.id === id) || null;

  const market = {
    /** Crea el mercado la primera vez que hace falta. */
    ensure(g) {
      if (!g.market) {
        g.market = { prices: {}, last: {}, hist: {}, bubble: null, custom: {} };
        MV.STOCKS.forEach((s) => { g.market.prices[s.id] = s.price; g.market.last[s.id] = s.price; g.market.hist[s.id] = [s.price]; });
      }
      g.p.portfolio = g.p.portfolio || {};
      return g.market;
    },

    /** Datos de una acción: las 12 de la bolsa o las que se suman después (custom). */
    info(g, id) { const s = stockOf(id); return s || (g.market && g.market.custom[id]) || null; },
    price(g, id) { market.ensure(g); return g.market.prices[id] || 0; },

    list(g) {
      const m = market.ensure(g);
      return Object.keys(m.prices).map((id) => {
        const I = market.info(g, id) || { name: id, sector: 'tech', icon: '📈' };
        const last = m.last[id] || m.prices[id];
        return { id, name: I.name, sector: I.sector, icon: I.icon || '📈', price: m.prices[id], change: last ? m.prices[id] / last - 1 : 0, shares: (g.p.portfolio[id] || {}).shares || 0 };
      });
    },

    /** Corrimiento por la noticia del año para un sector. */
    newsShift(g, sector) {
      const N = MV.sys.world.current(g), E = N ? MV.MARKET_NEWS[N.id] || {} : {};
      return (E.all || 0) + (E[sector] || 0);
    },

    crash(g) {
      const m = market.ensure(g);
      Object.keys(m.prices).forEach((id) => { m.prices[id] = Math.max(MIN_PRICE, round2(m.prices[id] * U.float(0.4, 0.7))); });
      return 'Crash en la bolsa: todas las acciones se desplomaron. Los corredores lloran en el piso de la bolsa.';
    },

    /** Un año de bolsa. opts.quiet: sin crash ni burbujas nuevas al azar (pruebas). */
    yearly(g, opts) {
      opts = opts || {};
      const m = market.ensure(g), p = g.p;
      let bubbleShift = 0, bubbleSector = null;
      if (m.bubble) {
        bubbleSector = m.bubble.sector;
        if (m.bubble.years > 0) { bubbleShift = 0.3; m.bubble.years--; } else { bubbleShift = -0.5; m.bubble = null; MV.log(g, `📉 Reventó la burbuja de ${bubbleSector}. Los que entraron último salen en pijama.`, '🫧', 'bad'); }
      }
      Object.keys(m.prices).forEach((id) => {
        const I = market.info(g, id);
        if (!I || I.own) return;
        m.last[id] = m.prices[id];
        const r = DRIFT + market.newsShift(g, I.sector) + (I.sector === bubbleSector ? bubbleShift : 0) + U.gauss(0, I.vol != null ? I.vol : 0.3);
        m.prices[id] = Math.max(MIN_PRICE, round2(m.prices[id] * (1 + r)));
      });
      if (!opts.quiet) {
        if (U.chance(0.03)) MV.log(g, market.crash(g), '💥', 'bad');
        if (!m.bubble && U.chance(0.04)) { m.bubble = { sector: U.pick(MV.STOCKS).sector, years: U.int(2, 3) }; MV.log(g, `🫧 Todos hablan de las acciones de ${m.bubble.sector}. Hasta tu peluquero compró.`, '🫧'); }
      }
      Object.keys(m.prices).forEach((id) => { m.hist[id] = (m.hist[id] || []).concat([m.prices[id]]).slice(-MAX_HIST); });
      // Dividendos
      let div = 0;
      Object.keys(p.portfolio || {}).forEach((id) => { const I = market.info(g, id), h = p.portfolio[id]; if (I && I.div && h.shares > 0) div += Math.round(h.shares * m.prices[id] * I.div); });
      if (div) { MV.fx.money(g, div); MV.log(g, `Dividendos de tus acciones: ${U.money(div)}.`, '💵', 'good'); }
    },

    buy(g, id, qty) {
      const m = market.ensure(g), p = g.p, I = market.info(g, id);
      if (!I || !m.prices[id]) return 'Esa acción no existe (todavía).';
      const price = m.prices[id];
      if (qty === 'all') qty = Math.floor(p.money / (price * (1 + COMMISSION)));
      qty = Math.floor(qty);
      if (!(qty > 0)) return 'No te alcanza ni para una acción.';
      const cost = Math.round(price * qty * (1 + COMMISSION));
      if (cost > p.money) return `No te alcanza: ${qty} acciones de ${id} cuestan ${U.money(cost)} con la comisión.`;
      MV.fx.money(g, -cost);
      const h = p.portfolio[id] || (p.portfolio[id] = { shares: 0, cost: 0 });
      h.shares += qty; h.cost += cost;
      return `Compraste ${U.num(qty)} acciones de ${I.name} (${id}) a ${U.money(price)} cada una. Total con comisión: ${U.money(cost)}.`;
    },

    sell(g, id, qty) {
      const m = market.ensure(g), p = g.p, h = p.portfolio[id], I = market.info(g, id);
      if (!h || !h.shares) return `No tienes acciones de ${id}.`;
      if (qty === 'all') qty = h.shares;
      qty = Math.floor(qty);
      if (!(qty > 0)) return 'Elige cuántas acciones vender.';
      if (qty > h.shares) return `No tienes tantas: tienes ${U.num(h.shares)} acciones de ${id}.`;
      const got = Math.round(m.prices[id] * qty * (1 - COMMISSION));
      const costPart = Math.round(h.cost * qty / h.shares);
      h.shares -= qty; h.cost -= costPart;
      if (!h.shares) delete p.portfolio[id];
      MV.fx.money(g, got);
      const gain = got - costPart;
      return `Vendiste ${U.num(qty)} acciones de ${(I || { name: id }).name} por ${U.money(got)}. ${gain >= 0 ? `Ganaste ${U.money(gain)}.` : `Perdiste ${U.money(-gain)}. Comprar caro, vender barato: un clásico.`}`;
    },

    /** Valor de tu cartera a precios de hoy. */
    portfolioValue(g) {
      const p = g.p;
      if (!p.portfolio || !g.market) return 0;
      return Object.keys(p.portfolio).reduce((s, id) => s + Math.round((p.portfolio[id].shares || 0) * (g.market.prices[id] || 0)), 0);
    }
  };
  MV.sys.market = market;
})(window.MV = window.MV || {});
