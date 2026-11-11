/* Mil Vidas — hojas de la bolsa de valores: lista de acciones y ficha con gráfico, compra y venta. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);
  const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('span', null, v));
  const note = (t) => h('p', { class: 'note' }, t);
  const M = () => MV.sys.market;
  const pct = (x) => `${x >= 0 ? '▲ +' : '▼ −'}${Math.abs(Math.round(x * 1000) / 10).toString().replace('.', ',')} %`;
  /** Precio por acción: con centavos si vale menos de $100. */
  const price = (v) => (v < 100 ? '$' + v.toFixed(2).replace('.', ',') : U.money(v));

  UI.showStocks = function () {
    UI.sheet({
      title: 'Bolsa de valores', icon: '📈',
      render: (body) => {
        const g = UI.g, list = M().list(g);
        body.append(note(`Tienes ${U.money(g.p.money)} en efectivo y ${U.money(M().portfolioValue(g))} en acciones. Cada compra o venta paga 1 % de comisión.`));
        const l = h('div', { class: 'list' });
        list.forEach((x) => l.append(UI.row(x.icon, `${x.id} · ${x.name}`, `${price(x.price)} por acción · ${pct(x.change)} este año${x.shares ? ` · tienes ${U.num(x.shares)}` : ''}`, '›', () => UI.showStock(x.id))));
        body.append(l);
      }
    });
  };

  UI.showStock = function (id) {
    UI.sheet({
      title: id, icon: '📈',
      render: (body) => {
        const g = UI.g, p = g.p, m = M().ensure(g), I = M().info(g, id) || { name: id, sector: 'tech', div: 0 };
        const cur = m.prices[id], last = m.last[id] || cur, held = (p.portfolio[id] || {}).shares || 0;
        body.append(h('div', { class: 'box' }, h('p', null, h('b', null, `${I.icon || '📈'} ${I.name} (${id})`)), kv('Precio', price(cur)), kv('Este año', pct(cur / last - 1)),
          kv('Dividendo', I.div ? `${Math.round(I.div * 100)} % al año` : 'No paga'), kv('Tienes', held ? `${U.num(held)} acciones (${U.money(Math.round(held * cur))})` : 'Ninguna')));
        const hist = m.hist[id] || [cur];
        const xs = hist.map((_, i) => p.age - (hist.length - 1 - i));
        const d = h('div', { class: 'viz-fig' });
        d.innerHTML = UI.lineChart([{ key: id, name: id, color: 'var(--series-1)', values: hist }], { xs, title: `Precio de ${id} por edad`, fmt: (v) => price(v) });
        body.append(d);
        const trade = (kind, q, label) => h('button', { type: 'button', id: `${kind}-${q}`, class: 'btn', disabled: kind === 'sell' ? !held || (q !== 'all' && q > held) : (q === 'all' ? p.money < cur * 1.01 : p.money < cur * q * 1.01),
          onclick: () => UI.runSystem(kind === 'buy' ? '🛒' : '💵', () => (kind === 'buy' ? M().buy(g, id, q) : M().sell(g, id, q))) }, label);
        body.append(h('h3', { class: 'section-title' }, 'Comprar'), h('div', { class: 'btn-row trade-row' }, [10, 100, 1000].map((q) => trade('buy', q, `+${U.num(q)}`)), trade('buy', 'all', 'Todo lo que alcance')));
        body.append(h('h3', { class: 'section-title' }, 'Vender'), h('div', { class: 'btn-row trade-row' }, [10, 100, 1000].map((q) => trade('sell', q, `−${U.num(q)}`)), trade('sell', 'all', 'Todas')));
      }
    });
  };
})(window.MV = window.MV || {});
