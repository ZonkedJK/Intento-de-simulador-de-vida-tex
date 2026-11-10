/* Mil Vidas — autos en pixel art (dibujo propio por categoría y modelo) y la concesionaria. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;

  /*
   * Siluetas de 32 × 16 píxeles mirando a la derecha. B carrocería, D sombra de la carrocería, W vidrio,
   * K negro, L faro, r luz trasera, C cromo, E faro eléctrico. Las ruedas se dibujan aparte.
   */
  const BODY = {
    hiperauto: { top: 6, wheels: [5, 22], rows: [
      '..........KWWWWWWK..............',
      '........BBWWWWWWWWBB............',
      '...rBBBBBBBBBBBBBBBBBBBBBB......',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBBB..',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBL.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    deportivo: { top: 5, wheels: [5, 22], rows: [
      '...........KWWWWWK..............',
      '.........BWWWWWWWWWB............',
      '......BBBBBBBBBBBBBBBBBB........',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBB...',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBL.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    sedan: { top: 4, wheels: [5, 22], rows: [
      '..........KWWWWWWWWWK...........',
      '.........BWWWWKWWWWWWB..........',
      '........BWWWWWKWWWWWWWB.........',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBB...',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBL.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    suv: { top: 2, wheels: [5, 22], rows: [
      '.......KKKKKKKKKKKKKKKKK........',
      '......BWWWWWKWWWWWKWWWWWB.......',
      '......BWWWWWKWWWWWKWWWWWWB......',
      '......BWWWWWKWWWWWKWWWWWWWB.....',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBL.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    pickup: { top: 3, wheels: [5, 22], rows: [
      '................KKKKKKKKK.......',
      '...............BWWWWKWWWWB......',
      '..B............BWWWWKWWWWWB.....',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBBBL.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    electrico: { top: 4, wheels: [5, 22], rows: [
      '...........KWWWWWWWWK...........',
      '.........BWWWWWWWWWWWWB.........',
      '.......BBWWWWWWWWWWWWWWBB.......',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBB...',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBE.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    clasico: { top: 4, wheels: [5, 22], rows: [
      '..........KWWWWWWWK.............',
      '.........BWWWWKWWWWB............',
      '.......BBBWWWWKWWWWWBB..........',
      '....BBBBBBBBBBBBBBBBBBBBBBB.....',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBBL..',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '.CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'] },
    lujo: { top: 3, wheels: [5, 22], rows: [
      '........KKKKKKKKKKKKK...........',
      '.......BWWWWWKWWWWWWWB..........',
      '......BWWWWWWKWWWWWWWWB.........',
      '..rBBBBBBBBBBBBBBBBBBBBBBBBBBC..',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBCL.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBC..',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDDDDDDDDDDDDDDDDDDD.'] },
    moto: { top: 5, wheels: [3, 20], rows: [
      '.....................KK.........',
      '.........BBBBBBB.....KK.........',
      '......rBBBBBBBBBBBBBBBBL........',
      '.......KKKKBBBBBBBBBBK..........',
      '...........KKKKKKKKK.K..........'] }
  };
  const WHEEL = ['.TTTT.', 'TTRRTT', 'TRRRRT', 'TRRRRT', 'TTRRTT', '.TTTT.'];
  const WHEEL_Y = 9;
  /** Silueta para los autos viejos (sin modelo), según su tipo. */
  const OLD_KIND = { 'Chatarra con ruedas': 'sedan', Moto: 'moto', Compacto: 'electrico', 'Sedán': 'sedan', 'Eléctrico': 'electrico', Camioneta: 'pickup',
    'Clásico restaurado': 'clasico', 'SUV de lujo': 'suv', Deportivo: 'deportivo', Superdeportivo: 'hiperauto' };
  const RIMS = ['#bfc5cc', '#2b2b2b', '#d4a72c', '#f4f4f4'];
  const TINTS = ['#9fd3f2', '#4a6f8c', '#b8e0d2'];

  function hash(s) { let x = 7; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  function grid(cat, art, seed) {
    const B = BODY[cat] || BODY.sedan;
    const g = [];
    for (let y = 0; y < 16; y++) g.push('.'.repeat(32).split(''));
    B.rows.forEach((row, i) => { row.split('').forEach((ch, x) => { if (ch !== '.') g[B.top + i][x] = ch; }); });
    // Rasgos del modelo
    if (art.open) g.forEach((row, y) => row.forEach((ch, x) => { if ((ch === 'W' || ch === 'K') && y < B.top + 3 && cat !== 'moto') row[x] = '.'; }));
    if (art.open && cat !== 'moto') { g[B.top + 2][12] = 'K'; g[B.top + 2][13] = 'K'; g[B.top + 2][18] = 'W'; g[B.top + 2][19] = 'W'; }
    if (art.stripe) { const y = B.top + B.rows.length - 3; for (let x = 4; x < 29; x++) if (g[y][x] === 'B') g[y][x] = 'S'; }
    // Alerón: placa arriba y soportes que bajan hasta tocar la carrocería
    const strut = (x, y) => { while (y < 15 && g[y][x] === '.') g[y++][x] = 'K'; };
    if (art.wing === 'big') { for (let x = 1; x < 9; x++) g[B.top - 3][x] = 'K'; strut(3, B.top - 2); strut(6, B.top - 2); }
    if (art.wing === 'small') { for (let x = 2; x < 7; x++) g[B.top - 1][x] = 'K'; strut(4, B.top); }
    // Detalles que distinguen modelos de la misma categoría
    const v = seed % 4;
    if ((cat === 'suv' || cat === 'pickup') && v === 1) for (let x = 9; x < 22; x += 2) g[B.top - 1][x] = 'K';
    if ((cat === 'sedan' || cat === 'lujo' || cat === 'electrico') && v === 2) g[B.top][14] = 'K';
    if (cat !== 'moto' && v === 3) g[B.top + B.rows.length - 1][1] = 'K';
    // Largo: repite la columna del medio (o la quita para autos chicos)
    const s = art.stretch || 0;
    if (s > 0) g.forEach((row) => { const mid = row[15]; row.splice(15, 0, ...Array(s).fill(mid)); });
    if (s < 0) g.forEach((row) => row.splice(14, -s));
    const front = B.wheels[1] + s;
    [B.wheels[0], front].forEach((wx) => WHEEL.forEach((r, dy) => r.split('').forEach((ch, dx) => { if (ch !== '.') g[WHEEL_Y + dy][wx + dx] = ch; })));
    return g;
  }

  function toSVG(g, color, rim, tint, label) {
    const pal = { B: color, D: shade(color, 0.62), W: tint, K: '#1b1b1b', L: '#ffe066', r: '#e23b3b', C: '#c8ccd2', E: '#7ef0ff', T: '#1b1b1b', R: rim, S: '#ffffff' };
    const w = g[0].length;
    let out = '';
    g.forEach((row, y) => {
      let x = 0;
      while (x < w) {
        const ch = row[x];
        if (ch === '.') { x++; continue; }
        let e = x; while (e < w && row[e] === ch) e++;
        out += `<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${pal[ch]}"/>`;
        x = e;
      }
    });
    return `<svg viewBox="0 0 ${w} 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="${label}">${out}</svg>`;
  }

  /** Dibujo de un auto: un modelo del catálogo (con color) o un bien (usa su modelo y color; los viejos, la silueta de su tipo). */
  UI.carSVG = function (x, colorId) {
    if (!x) return '';
    const model = x.cat ? x : MV.CAR_CATALOG.find((m) => m.id === x.model);
    const color = (MV.CAR_COLORS.find((c) => c.id === (colorId || x.color)) || null);
    const key = model ? model.id : String(x.id || x.kind || 'auto');
    const seed = hash(key);
    const hex = color ? color.hex : (x.kind === 'Chatarra con ruedas' ? '#8a6a4a' : MV.CAR_COLORS[seed % MV.CAR_COLORS.length].hex);
    const cat = model ? model.cat : OLD_KIND[x.kind] || 'sedan';
    const art = Object.assign({}, model ? model.art : {});
    if (x.tune && x.tune.aleron && !art.wing) art.wing = 'small';
    if (x.tune && x.tune.pintura) art.stripe = true;
    const label = model ? `${model.brand} ${model.model}` : 'Auto';
    return toSVG(grid(cat, art, seed), hex, RIMS[seed % RIMS.length], TINTS[(seed >>> 3) % TINTS.length], label);
  };

  // ——— Concesionaria ———
  const h = (...a) => UI.h(...a);
  const art = (m, color, cls) => { const d = h('div', { class: cls || 'car-art' }); d.innerHTML = UI.carSVG(m, color); return d; };

  UI.showDealer = function () {
    const st = { cat: 'hiperauto' };
    UI.sheet({
      title: 'Concesionaria', icon: '🚗',
      render: (body) => {
        const g = UI.g, p = g.p;
        body.append(h('p', { class: 'note' }, `Tienes ${U.money(p.money)}. Elige una categoría.`));
        const cats = h('div', { class: 'dealer-cats', role: 'tablist' });
        Object.keys(MV.CAR_CATS).forEach((k) => cats.append(h('button', { type: 'button', class: 'chip-btn' + (st.cat === k ? ' on' : ''), 'data-cat': k, role: 'tab', 'aria-selected': String(st.cat === k), onclick: () => { st.cat = k; UI.refreshSheets(); } },
          `${MV.CAR_CATS[k].icon} ${MV.CAR_CATS[k].name}`)));
        body.append(cats);
        const l = h('div', { class: 'list' });
        MV.CAR_CATALOG.filter((m) => m.cat === st.cat).sort((a, b) => a.price - b.price).forEach((m) => {
          l.append(UI.row(art(m, 'rojo', 'car-thumb'), `${m.brand} ${m.model}`, [`${U.money(m.price)} · ${m.speed} km/h · 0 a 100 en ${String(m.accel).replace('.', ',')} s`], p.money >= m.price ? '›' : '💸', () => showModel(m.id)));
        });
        body.append(l);
      }
    });
  };

  function showModel(id) {
    const m = MV.CAR_CATALOG.find((x) => x.id === id);
    const st = { color: 'rojo' };
    UI.sheet({
      title: `${m.brand} ${m.model}`, icon: MV.CAR_CATS[m.cat].icon,
      render: (body) => {
        const g = UI.g, p = g.p;
        body.append(art(m, st.color, 'car-art big'));
        body.append(h('p', { class: 'note' }, m.desc));
        const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('span', null, v));
        body.append(h('div', { class: 'box' }, kv('Precio', U.money(m.price)), kv('Velocidad máxima', `${m.speed} km/h`), kv('0 a 100', `${String(m.accel).replace('.', ',')} s`),
          kv('Consumo', m.fuel ? `${m.fuel} l cada 100 km` : 'Eléctrico'), kv('Prestigio', `${m.prestige}/100${m.prestige >= 70 ? ' (suma apariencia y fama)' : ''}`)));
        body.append(h('h3', { class: 'section-title' }, 'Color'));
        const sw = h('div', { class: 'color-row', role: 'radiogroup', 'aria-label': 'Color' });
        MV.CAR_COLORS.forEach((c) => sw.append(h('button', { type: 'button', class: 'color-swatch' + (st.color === c.id ? ' on' : ''), 'data-color': c.id, role: 'radio', 'aria-checked': String(st.color === c.id), title: c.name, 'aria-label': c.name, style: { background: c.hex },
          onclick: () => { st.color = c.id; UI.refreshSheets(); } })));
        body.append(sw);
        const can = p.money >= m.price && p.age >= 18;
        body.append(h('button', { type: 'button', id: 'dealer-buy', class: 'btn primary block', disabled: !can, onclick: () => { UI.popSheet(); UI.popSheet(); UI.runSystem(MV.CAR_CATS[m.cat].icon, () => MV.sys.money.buyCar(g, m.id, st.color)); } },
          p.age < 18 ? 'Eres menor de edad' : can ? `Comprar en ${MV.CAR_COLORS.find((c) => c.id === st.color).name.toLowerCase()} por ${U.money(m.price)}` : `No te alcanza (${U.money(m.price)})`));
      }
    });
  }
})(window.MV = window.MV || {});
