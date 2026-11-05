/* Mil Vidas — tatuajes: normalizar el dibujo, calificarlo, aplicarlo a la piel, láser y dibujo en SVG. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const MAX_POINTS = 900;
  const MAX_ALBUM = 12;
  const LASER_COST = 1500;

  const clampInt = (v) => U.clamp(Math.round(Number(v) || 0), 0, 100);

  const tattoo = {
    MAX_POINTS, MAX_ALBUM, LASER_COST,

    /** Limpia un diseño: enteros 0-100, colores/grosores válidos, textos cortos, como máximo 900 puntos. */
    normalize(design) {
      const src = design || {};
      let strokes = (Array.isArray(src.strokes) ? src.strokes : []).map((s) => {
        const pts = Array.isArray(s.pts) ? s.pts : [];
        const out = [];
        for (let i = 0; i + 1 < pts.length; i += 2) out.push(clampInt(pts[i]), clampInt(pts[i + 1]));
        return { c: U.clamp(Math.round(s.c) || 0, 0, MV.TATTOO_INKS.length - 1), w: U.clamp(Math.round(s.w) || 1, 1, MV.TATTOO_WIDTHS.length), pts: out };
      }).filter((s) => s.pts.length >= 2);
      const total = U.sum(strokes, (s) => s.pts.length / 2);
      if (total > MAX_POINTS) {
        const step = Math.ceil(total / MAX_POINTS);
        strokes = strokes.map((s) => {
          const pts = [];
          for (let i = 0; i < s.pts.length; i += 2 * step) pts.push(s.pts[i], s.pts[i + 1]);
          const n = s.pts.length; // conservar el último punto del trazo
          if (pts[pts.length - 2] !== s.pts[n - 2] || pts[pts.length - 1] !== s.pts[n - 1]) pts.push(s.pts[n - 2], s.pts[n - 1]);
          return Object.assign({}, s, { pts });
        });
        // Si aún sobran (muchos trazos cortos), recortar por el final.
        let left = MAX_POINTS;
        strokes = strokes.map((s) => { const take = Math.max(0, Math.min(s.pts.length / 2, left)); left -= take; return Object.assign({}, s, { pts: s.pts.slice(0, take * 2) }); }).filter((s) => s.pts.length >= 2);
      }
      const texts = (Array.isArray(src.texts) ? src.texts : []).slice(0, 3).map((t) => ({
        t: String(t.t || '').replace(/<[^>]*>/g, '').replace(/[<>{}]/g, '').trim().slice(0, 16),
        x: clampInt(t.x), y: clampInt(t.y), c: U.clamp(Math.round(t.c) || 0, 0, MV.TATTOO_INKS.length - 1)
      })).filter((t) => t.t);
      return { strokes, texts };
    },

    isEmpty(d) { return U.sum(d.strokes, (s) => s.pts.length / 2) < 3 && !d.texts.length; },

    /** Nota 0-100 del tatuador: cobertura, colores, detalle, prolijidad, Arte y tatuador. */
    score(design, artistId, art) {
      const d = tattoo.normalize(design);
      const A = MV.TATTOO_ARTISTS[artistId] || MV.TATTOO_ARTISTS.estudio;
      if (tattoo.isEmpty(d)) return { score: 0, coverage: 0, colors: 0, strokes: 0 };
      const cells = new Set();
      d.strokes.forEach((s) => { for (let i = 0; i < s.pts.length; i += 2) cells.add(Math.min(9, Math.floor(s.pts[i] / 10)) * 10 + Math.min(9, Math.floor(s.pts[i + 1] / 10))); });
      d.texts.forEach((t) => { for (let k = 0; k < Math.ceil(t.t.length / 3); k++) cells.add(Math.min(9, Math.floor(t.x / 10) + k) * 10 + Math.min(9, Math.floor(t.y / 10))); });
      const coverage = cells.size / 100;
      const colors = new Set(d.strokes.map((s) => s.c).concat(d.texts.map((t) => t.c))).size;
      const n = d.strokes.length;
      const dots = d.strokes.filter((s) => s.pts.length < 6).length;
      const cov = coverage < 0.03 ? coverage * 400 : coverage <= 0.5 ? 30 + coverage * 60 : 60 - (coverage - 0.5) * 80;
      let total = cov + Math.min(colors, 4) * 5 + Math.min(n, 12) * 1.5 + (d.texts.length ? 5 : 0) -
        (n ? (dots / n) * 15 : 0) + U.clamp(art || 0, 0, 100) * 0.15 + A.bonus + U.int(-5, 5);
      return { score: U.clamp(Math.round(total), 1, 100), coverage, colors, strokes: n };
    },

    comment(score) {
      if (score < 20) return 'Parece que lo dibujó un gato con hipo.';
      if (score < 40) return 'El tatuador dijo "es arte moderno" y no te miró a los ojos.';
      if (score < 60) return 'Quedó decente. Tu abuela lo odia: buena señal.';
      if (score < 80) return '¡Quedó muy bien! Te piden fotos en la playa.';
      return 'Es una obra maestra. Un museo quiere fotografiar tu piel.';
    },

    /** Aplica un diseño a la piel. opts.cover: id de un tatuaje que se tapa. Devuelve el texto del resultado. */
    apply(g, design, artistId, placeId, opts) {
      opts = opts || {};
      const p = g.p;
      p.tattoos = p.tattoos || [];
      const A = MV.TATTOO_ARTISTS[artistId] || MV.TATTOO_ARTISTS.estudio;
      const P = MV.TATTOO_PLACES[placeId] || MV.TATTOO_PLACES.brazo;
      const d = tattoo.normalize(design);
      if (tattoo.isEmpty(d)) return 'El tatuador miró tu papel casi en blanco y te devolvió el dinero: "vuelve cuando sepas qué quieres".';
      const covered = opts.cover ? p.tattoos.find((t) => t.id === opts.cover) : null;
      if (!covered && p.tattoos.length >= MAX_ALBUM) return 'Ya no te queda piel libre. Ni el tatuador encontró un hueco.';
      MV.fx.money(g, -A.cost);
      const sc = tattoo.score(d, artistId, p.skills.arte).score;
      const names = MV.rels(g, ['pareja', 'conyuge', 'amante']).map((x) => x.n.first);
      const partnerText = d.texts.find((t) => names.includes(t.t));
      const tat = {
        id: U.uid('t'), age: p.age, place: placeId in MV.TATTOO_PLACES ? placeId : 'brazo', artist: artistId in MV.TATTOO_ARTISTS ? artistId : 'estudio',
        design: d, score: sc, seed: U.int(1, 1e6), partnerName: partnerText ? partnerText.t : null
      };
      if (covered) p.tattoos = p.tattoos.filter((t) => t !== covered);
      p.tattoos.push(tat);
      if (tat.partnerName) p.flags.tatuajePareja = tat.partnerName;
      if (P.flag) p.flags[P.flag] = true;
      MV.fx.stat(g, 'looks', U.clamp(Math.round(((sc - 50) / 50) * 6 * P.mult), -10, 10));
      MV.fx.stat(g, 'happy', U.clamp(Math.round(((sc - 40) / 60) * 8), -4, 8));
      MV.fx.skill(g, 'arte', U.int(1, 3));
      let extra = '';
      if (U.chance(A.infect)) { MV.sys.health.add(g, 'infeccion_tatuaje'); extra = ' Días después, la zona se puso roja y caliente. Infección.'; }
      if (artistId === 'famoso') { p.followers += U.int(500, 5000); extra += ' El artista lo subió a sus redes y ganaste seguidores.'; }
      const where = P.name.toLowerCase();
      return `${covered ? 'Tapaste tu viejo tatuaje con un diseño nuevo en ' : 'Te tatuaste tu diseño en '}${P.art} ${where} (${A.name.toLowerCase()}). ${tattoo.comment(sc)} Nota del tatuador: ${sc}/100.${extra}`;
    },

    laser(g, id) {
      const p = g.p;
      const t = (p.tattoos || []).find((x) => x.id === id);
      if (!t) return 'Ese tatuaje ya no existe.';
      MV.fx.money(g, -LASER_COST);
      MV.fx.stat(g, 'happy', -4);
      p.tattoos = p.tattoos.filter((x) => x !== t);
      if (t.partnerName && p.flags.tatuajePareja === t.partnerName) delete p.flags.tatuajePareja;
      if (t.place === 'cara' && !p.tattoos.some((x) => x.place === 'cara')) delete p.flags.tatuajeCara;
      return `Te borraste el tatuaje con láser (${U.money(LASER_COST)}). Dolió como diez tatuajes juntos.`;
    },

    /** Diseño al azar a partir de las plantillas (para jugadores automáticos y pruebas). */
    randomDesign() {
      const T = U.pick(Object.values(MV.TATTOO_TEMPLATES));
      return { strokes: T.pts.map((pts) => ({ c: U.int(0, MV.TATTOO_INKS.length - 1), w: U.int(1, 3), pts: pts.slice() })), texts: U.chance(0.3) ? [{ t: 'Mamá', x: 50, y: 92, c: 1 }] : [] };
    },

    /** Dibuja un diseño como SVG. o: {wobble, seed, bg} */
    render(design, o) {
      o = o || {};
      const d = tattoo.normalize(design);
      let s = (o.seed >>> 0) || 7;
      const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
      const w = o.wobble || 0;
      const jit = (v) => (w ? (v + (rnd() - 0.5) * w).toFixed(1) : v);
      const paths = d.strokes.map((st) => {
        let path = '';
        for (let i = 0; i < st.pts.length; i += 2) path += (i ? ' L' : 'M') + jit(st.pts[i]) + ' ' + jit(st.pts[i + 1]);
        if (st.pts.length === 2) path += ' l0.1 0';
        return `<path d="${path}" fill="none" stroke="${MV.TATTOO_INKS[st.c]}" stroke-width="${MV.TATTOO_WIDTHS[st.w - 1]}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join('');
      const texts = d.texts.map((t) => `<text x="${t.x}" y="${t.y}" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="11" text-anchor="middle" fill="${MV.TATTOO_INKS[t.c]}">${U.esc(t.t)}</text>`).join('');
      const bg = o.bg ? `<rect width="100" height="100" fill="${o.bg}"/>` : '';
      return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bg}${paths}${texts}</svg>`;
    }
  };
  MV.sys.tattoo = tattoo;
})(window.MV = window.MV || {});
