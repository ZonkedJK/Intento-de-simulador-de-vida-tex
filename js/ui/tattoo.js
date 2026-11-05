/* Mil Vidas — estudio de tatuajes: elegir tatuador y lugar, dibujar sobre la piel y ver el resultado. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const h = (...a) => UI.h(...a);

  /** Dibujo del tatuaje sobre un recuadro del color de la piel. */
  UI.tattooArt = function (t, size, skin) {
    const A = MV.TATTOO_ARTISTS[t.artist] || {};
    const el = h('span', { class: 'tattoo-art', style: { width: size + 'px', height: size + 'px', background: skin || 'var(--hl-orange)' } });
    el.innerHTML = MV.sys.tattoo.render(t.design, { wobble: A.wobble || 0, seed: t.seed });
    return el;
  };

  UI.showTattooStudio = function (action) {
    const g = UI.g, p = g.p;
    if (MV.usesLeft(g, action) <= 0) { UI.toast('⏳', '', 'Ya te tatuaste este año. La piel necesita descansar.'); return; }
    const st = {
      artist: p.money >= MV.TATTOO_ARTISTS.estudio.cost ? 'estudio' : 'garaje', place: 'brazo',
      cover: p.flags.taparTatuaje && (p.tattoos || []).some((t) => t.id === p.flags.taparTatuaje) ? p.flags.taparTatuaje : null,
      ink: 0, width: 2, template: null, design: { strokes: [], texts: [] }, textMode: null, history: []
    };
    const old = st.cover && p.tattoos.find((t) => t.id === st.cover);
    if (old) st.place = old.place;
    UI.sheet({ title: 'Estudio de tatuajes', icon: '🖋️', render: (body) => renderSetup(body, st, action) });
  };

  function renderSetup(body, st, action) {
    const g = UI.g, p = g.p;
    body.append(h('h3', { class: 'section-title' }, '1. Elige al tatuador'));
    const al = h('div', { class: 'list' });
    Object.keys(MV.TATTOO_ARTISTS).filter((k) => !MV.TATTOO_ARTISTS[k].hidden).forEach((k) => {
      const A = MV.TATTOO_ARTISTS[k];
      al.append(UI.row(A.icon, A.name, `${A.desc}. ${U.money(A.cost)}`, st.artist === k ? '✓' : '', () => { st.artist = k; UI.refreshSheets(); }, p.money < A.cost));
    });
    body.append(al);
    body.append(h('h3', { class: 'section-title' }, '2. ¿Dónde?'));
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Lugar del tatuaje' });
    Object.keys(MV.TATTOO_PLACES).forEach((k) => {
      const P = MV.TATTOO_PLACES[k];
      seg.append(h('button', { type: 'button', 'aria-pressed': String(st.place === k), disabled: !!st.cover && st.place !== k, onclick: () => { st.place = k; UI.refreshSheets(); } }, `${P.icon} ${P.name}`));
    });
    body.append(seg);
    if (st.place === 'cara') body.append(h('p', { class: 'note' }, 'En la cara el efecto es mayor (para bien o para mal) y algunas entrevistas de trabajo se complican.'));
    if ((p.tattoos || []).length) {
      body.append(h('h3', { class: 'section-title' }, '¿Tapar uno que ya tienes?'));
      const sel = h('select', { class: 'select', id: 'tat-cover' }, h('option', { value: '' }, 'No, es un tatuaje nuevo'),
        p.tattoos.map((t) => h('option', { value: t.id }, `${MV.TATTOO_PLACES[t.place].name}, a los ${t.age} años${t.partnerName ? ` ("${t.partnerName}")` : ''}`)));
      sel.value = st.cover || '';
      sel.addEventListener('change', () => {
        st.cover = sel.value || null;
        const t = st.cover && p.tattoos.find((x) => x.id === st.cover);
        if (t) st.place = t.place;
        UI.refreshSheets();
      });
      body.append(sel);
      if (st.cover) body.append(h('p', { class: 'note' }, 'El diseño nuevo va encima del viejo, en el mismo lugar.'));
    }
    if ((p.tattoos || []).length >= MV.sys.tattoo.MAX_ALBUM && !st.cover) body.append(h('p', { class: 'note' }, 'Ya tienes 12 tatuajes: elige uno para tapar.'));
    body.append(h('div', { class: 'btn-row' }, h('button', {
      class: 'btn primary block', disabled: p.money < MV.TATTOO_ARTISTS[st.artist].cost || ((p.tattoos || []).length >= MV.sys.tattoo.MAX_ALBUM && !st.cover),
      onclick: () => { UI.popSheet(); openCanvas(st, action); }
    }, '✏️ Empezar a dibujar')));
  }

  function openCanvas(st, action) {
    UI.sheet({ title: 'Dibuja tu tatuaje', icon: '✏️', render: (body) => renderCanvas(body, st, action) });
  }

  function renderCanvas(body, st, action) {
    const g = UI.g, p = g.p;
    const wrap = h('div', { class: 'tat-wrap' });
    const canvas = h('canvas', { class: 'tat-canvas', width: '600', height: '600', 'aria-label': 'Lienzo para dibujar el tatuaje', role: 'img' });
    wrap.style.background = p.look.skin;
    wrap.append(canvas);
    const ctx = canvas.getContext('2d');
    const toCanvas = (v) => v * 6;
    const redraw = () => {
      ctx.clearRect(0, 0, 600, 600);
      // poros y textura de piel
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc((i * 97) % 600, (i * 53) % 600, 2, 0, 6.3); ctx.fill(); }
      if (st.template) {
        ctx.save(); ctx.strokeStyle = 'rgba(30,40,90,0.28)'; ctx.setLineDash([10, 10]); ctx.lineWidth = 4;
        MV.TATTOO_TEMPLATES[st.template].pts.forEach((pts) => { ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) (i ? ctx.lineTo : ctx.moveTo).call(ctx, toCanvas(pts[i]), toCanvas(pts[i + 1])); ctx.stroke(); });
        ctx.restore();
      }
      st.design.strokes.forEach((s) => {
        ctx.strokeStyle = MV.TATTOO_INKS[s.c]; ctx.lineWidth = MV.TATTOO_WIDTHS[s.w - 1] * 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < s.pts.length; i += 2) (i ? ctx.lineTo : ctx.moveTo).call(ctx, toCanvas(s.pts[i]), toCanvas(s.pts[i + 1]));
        if (s.pts.length === 2) ctx.lineTo(toCanvas(s.pts[0]) + 0.5, toCanvas(s.pts[1]));
        ctx.stroke();
      });
      st.design.texts.forEach((t) => {
        ctx.fillStyle = MV.TATTOO_INKS[t.c]; ctx.font = 'italic 700 66px Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillText(t.t, toCanvas(t.x), toCanvas(t.y));
      });
    };
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [U.clamp(Math.round(((e.clientX - r.left) / r.width) * 100), 0, 100), U.clamp(Math.round(((e.clientY - r.top) / r.height) * 100), 0, 100)];
    };
    let cur = null;
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const [x, y] = pos(e);
      if (st.textMode) { st.design.texts.push({ t: st.textMode, x, y, c: st.ink }); st.history.push('t'); st.textMode = null; redraw(); updateHint(); return; }
      cur = { c: st.ink, w: st.width, pts: [x, y] };
      st.design.strokes.push(cur);
      st.history.push('s');
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const [x, y] = pos(e);
      const n = cur.pts.length;
      if (Math.abs(x - cur.pts[n - 2]) + Math.abs(y - cur.pts[n - 1]) >= 1) { cur.pts.push(x, y); redraw(); }
    });
    const end = () => { cur = null; updateHint(); };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    // Herramientas
    const inks = h('div', { class: 'tat-tools', role: 'group', 'aria-label': 'Tinta' });
    MV.TATTOO_INKS.forEach((c, i) => inks.append(h('button', { type: 'button', class: 'swatch', style: { background: c }, 'aria-label': 'Tinta ' + (i + 1), 'aria-pressed': String(st.ink === i), onclick: () => { st.ink = i; inks.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); } })));
    const widths = h('div', { class: 'seg', role: 'group', 'aria-label': 'Grosor' });
    ['Fino', 'Medio', 'Grueso'].forEach((l, i) => widths.append(h('button', { type: 'button', 'aria-pressed': String(st.width === i + 1), onclick: () => { st.width = i + 1; widths.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); } }, l)));
    const tmpl = h('select', { class: 'select', id: 'tat-template', 'aria-label': 'Plantilla para calcar' }, h('option', { value: '' }, 'Sin plantilla'),
      Object.keys(MV.TATTOO_TEMPLATES).map((k) => h('option', { value: k }, `${MV.TATTOO_TEMPLATES[k].icon} Calcar: ${MV.TATTOO_TEMPLATES[k].name}`)));
    tmpl.value = st.template || '';
    tmpl.addEventListener('change', () => { st.template = tmpl.value || null; redraw(); });
    const partner = MV.partner(g);
    const textSel = h('select', { class: 'select', id: 'tat-text', 'aria-label': 'Sello de texto' }, h('option', { value: '' }, 'Agregar texto…'),
      h('option', { value: 'Mamá' }, 'Mamá'), partner ? h('option', { value: partner.n.first }, partner.n.first) : null,
      h('option', { value: '__otro' }, 'Otro texto…'));
    const textIn = h('input', { class: 'input', id: 'tat-custom', maxlength: '16', placeholder: 'Escribe hasta 16 letras', style: { display: 'none' } });
    textSel.addEventListener('change', () => {
      if (textSel.value === '__otro') { textIn.style.display = ''; textIn.focus(); return; }
      textIn.style.display = 'none';
      if (textSel.value) { st.textMode = textSel.value; updateHint(); }
    });
    textIn.addEventListener('change', () => { const v = textIn.value.trim(); if (v) { st.textMode = v; updateHint(); } });
    const hint = h('p', { class: 'note', 'aria-live': 'polite' });
    const updateHint = () => {
      const pts = U.sum(st.design.strokes, (s) => s.pts.length / 2);
      if (go) go.disabled = !!MV.sys.tattoo.refusal(g, st.design, st.cover);
      hint.textContent = st.textMode ? `Toca el lienzo donde quieras poner "${st.textMode}".` : pts ? `${st.design.strokes.length} trazos. El tatuador mira por encima de tu hombro.` : 'Dibuja con el dedo o el mouse sobre la piel.';
    };
    const A = MV.TATTOO_ARTISTS[st.artist];
    let go;
    body.append(wrap, hint, inks, widths, h('div', { class: 'tat-row' }, tmpl, textSel), textIn,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn', onclick: () => { const last = st.history.pop(); if (last === 't') st.design.texts.pop(); else if (last === 's') st.design.strokes.pop(); redraw(); updateHint(); } }, '↩️ Deshacer'),
        h('button', { type: 'button', class: 'btn', onclick: () => { st.design = { strokes: [], texts: [] }; st.history = []; redraw(); updateHint(); } }, '🧽 Borrar todo')),
      go = h('button', {
        type: 'button', class: 'btn primary block', id: 'tat-go', onclick: () => {
          if (MV.sys.tattoo.refusal(UI.g, st.design, st.cover)) return;
          UI.closeSheets();
          const lastBefore = ((p.tattoos || []).slice(-1)[0] || {}).id;
          UI.execAction(action, { design: st.design, artist: st.artist, place: st.place, cover: st.cover }, undefined, undefined, undefined, () => {
            const t = (UI.g.p.tattoos || []).slice(-1)[0];
            return t && t.id !== lastBefore ? h('div', { class: 'tat-result' }, UI.tattooArt(t, 140, UI.g.p.look.skin)) : null;
          });
        }
      }, `🖋️ Tatuar (${U.money(A.cost)})`));
    redraw();
    updateHint();
  }

  /** Álbum de tatuajes para la ficha personal. */
  UI.tattooAlbum = function () {
    const g = UI.g, p = g.p;
    const list = p.tattoos || [];
    if (!list.length) return h('p', { class: 'note' }, 'Sin tatuajes. Tu piel es un lienzo en blanco (en Actividades → Ocio y vicios).');
    const grid = h('div', { class: 'tat-album' });
    list.forEach((t) => grid.append(h('div', { class: 'tat-item' },
      UI.tattooArt(t, 96, p.look.skin),
      h('div', { class: 'note', style: { margin: '4px 0' } }, `${MV.TATTOO_PLACES[t.place].name}, ${t.age} años. Nota ${t.score}/100.`),
      h('button', { type: 'button', class: 'btn', style: { minHeight: '36px', padding: '4px 10px' }, onclick: () => UI.confirm(`¿Borrar este tatuaje con láser por ${U.money(MV.sys.tattoo.LASER_COST)}?`, () => UI.runSystem('💥', () => MV.sys.tattoo.laser(g, t.id)), 'Borrar con láser') }, '💥 Láser'))));
    return grid;
  };
})(window.MV = window.MV || {});
