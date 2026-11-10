/* Mil Vidas — gráfico de líneas en SVG (patrimonio y estadísticas a lo largo de la vida). */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r1 = (v) => Math.round(v * 10) / 10;

  /**
   * series: [{ key, name, color, values: [número por cada x] }]; opts: { xs: [edades], title, fmt(v), yMin, yMax, zero }.
   * Líneas de 2px, una sola escala, etiquetas directas al final (en color de texto) y una franja por año con su tooltip.
   */
  UI.lineChart = function (series, opts) {
    opts = opts || {};
    const xs = opts.xs || [];
    if (!series.length || !xs.length) return '';
    const fmt = opts.fmt || ((v) => String(Math.round(v)));
    const W = 320, H = 150, L = 46, R = 78, T = 10, B = 22;
    const all = [];
    series.forEach((s) => s.values.forEach((v) => { if (Number.isFinite(v)) all.push(v); }));
    let lo = opts.yMin != null ? opts.yMin : Math.min(...all), hi = opts.yMax != null ? opts.yMax : Math.max(...all);
    if (opts.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (!(hi > lo)) { const pad = Math.abs(hi) * 0.1 || 1; lo -= pad; hi += pad; }
    const x0 = xs[0], x1 = xs[xs.length - 1];
    const X = (x) => r1(xs.length === 1 ? L + (W - L - R) / 2 : L + ((x - x0) / (x1 - x0)) * (W - L - R));
    const Y = (v) => r1(T + (1 - (v - lo) / (hi - lo)) * (H - T - B));
    let out = '';
    // Grilla y ejes (recesivos)
    out += `<line x1="${L}" y1="${Y(hi)}" x2="${W - R}" y2="${Y(hi)}" class="viz-grid"/><line x1="${L}" y1="${Y(lo)}" x2="${W - R}" y2="${Y(lo)}" class="viz-axis"/>`;
    if (lo < 0 && hi > 0) out += `<line x1="${L}" y1="${Y(0)}" x2="${W - R}" y2="${Y(0)}" class="viz-axis"/><text x="${L - 4}" y="${Y(0) + 3}" class="viz-tick" text-anchor="end">0</text>`;
    out += `<text x="${L - 4}" y="${Y(hi) + 3}" class="viz-tick" text-anchor="end">${esc(fmt(hi))}</text><text x="${L - 4}" y="${Y(lo) + 3}" class="viz-tick" text-anchor="end">${esc(fmt(lo))}</text>`;
    out += `<text x="${X(x0)}" y="${H - 6}" class="viz-tick" text-anchor="${xs.length === 1 ? 'middle' : 'start'}">${esc(x0)} años</text>`;
    if (xs.length > 1) out += `<text x="${X(x1)}" y="${H - 6}" class="viz-tick" text-anchor="end">${esc(x1)}</text>`;
    // Líneas (o un punto si hay un solo año)
    const ends = [];
    series.forEach((s) => {
      const pts = xs.map((x, i) => [X(x), Number.isFinite(s.values[i]) ? Y(s.values[i]) : null]).filter((p) => p[1] != null);
      if (!pts.length) return;
      if (pts.length === 1) out += `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="4" fill="${s.color}" class="viz-dot"/>`;
      else out += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const last = pts[pts.length - 1];
      ends.push({ y: last[1], x: last[0], s, v: s.values[s.values.length - 1] });
    });
    // Etiquetas directas al final, separadas para que no se pisen
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 11) ends[i].y = ends[i - 1].y + 11;
    ends.forEach((e) => {
      out += `<rect x="${W - R + 6}" y="${r1(e.y - 4)}" width="8" height="8" rx="2" fill="${e.s.color}"/>`;
      const txt = series.length === 1 ? fmt(e.v) : `${e.s.name} ${fmt(e.v)}`;
      out += `<text x="${W - R + 18}" y="${r1(e.y + 3)}" class="viz-label">${esc(txt)}</text>`;
    });
    // Capa de hover: una franja por año con su tooltip
    const band = xs.length > 1 ? (W - L - R) / (xs.length - 1) : W - L - R;
    xs.forEach((x, i) => {
      const tip = `${x} años: ` + series.map((s) => `${s.name} ${Number.isFinite(s.values[i]) ? fmt(s.values[i]) : '—'}`).join(', ');
      out += `<rect x="${r1(X(x) - band / 2)}" y="${T}" width="${r1(Math.max(band, 2))}" height="${H - T - B}" class="viz-hit"><title>${esc(tip)}</title></rect>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="viz" role="img" aria-label="${esc(opts.title || 'Gráfico')}">${out}</svg>`;
  };

  const h = (...a) => UI.h(...a);
  const STATS = [['happy', 'var(--series-1)'], ['health', 'var(--series-2)'], ['smarts', 'var(--series-3)'], ['looks', 'var(--series-4)']];

  /** Bloque con los dos gráficos de la vida (patrimonio y estadísticas) y su tabla. */
  UI.lifeCharts = function (p, id) {
    const rows = (p.history || []).filter((r) => r && Number.isFinite(r.age));
    const box = h('div', { class: 'box life-charts', id });
    if (!rows.length) { box.append(h('p', { class: 'note' }, 'Todavía no hay datos: los gráficos se llenan año a año.')); return box; }
    const xs = rows.map((r) => r.age);
    const chart = (title, svg) => { const d = h('figure', { class: 'viz-fig' }, h('figcaption', null, title)); const c = h('div'); c.innerHTML = svg; d.append(c); return d; };
    box.append(chart('💰 Patrimonio', UI.lineChart([{ key: 'worth', name: 'Patrimonio', color: 'var(--series-1)', values: rows.map((r) => r.worth) }], { xs, title: 'Patrimonio por edad', fmt: (v) => MV.U.moneyShort(v), zero: true })));
    box.append(chart('📈 Estadísticas', UI.lineChart(STATS.map(([k, c]) => ({ key: k, name: MV.STATS[k].name, color: c, values: rows.map((r) => r[k]) })), { xs, title: 'Estadísticas por edad', yMin: 0, yMax: 100 })));
    const legend = h('div', { class: 'viz-legend' }, STATS.map(([k, c]) => h('span', null, h('i', { style: { background: c } }), MV.STATS[k].name)));
    box.append(legend);
    const step = Math.max(1, Math.ceil(rows.length / 12));
    const tr = rows.filter((r, i) => i % step === 0 || i === rows.length - 1);
    box.append(h('details', { class: 'viz-table' }, h('summary', null, 'Ver como tabla'),
      h('table', null, h('thead', null, h('tr', null, h('th', null, 'Edad'), h('th', null, 'Patrimonio'), STATS.map(([k]) => h('th', null, MV.STATS[k].icon)))),
        h('tbody', null, tr.map((r) => h('tr', null, h('td', null, String(r.age)), h('td', null, MV.U.moneyShort(r.worth)), STATS.map(([k]) => h('td', null, String(r[k])))))))));
    return box;
  };
})(window.MV = window.MV || {});
