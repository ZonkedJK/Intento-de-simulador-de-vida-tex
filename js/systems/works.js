/* Mil Vidas — obras con nombre: calidad, crítica, éxitos y regalías. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const MAX_TITLE = 40;
  const MAX_WORKS = 30;
  const stars = (n) => '⭐'.repeat(n) + '☆'.repeat(5 - n);

  const works = {
    MAX_TITLE,
    /** Título seguro: sin <>{}$, sin espacios repetidos y con 40 letras como máximo. */
    clean(title) {
      return String(title == null ? '' : title).replace(/[<>{}$`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE).trim();
    },

    /** "Título del libro", "Título de la canción". */
    titleHint(kind) {
      const K = MV.WORK_KINDS[kind] || MV.WORK_KINDS.libro;
      return `Título ${K.noun.startsWith('el ') ? 'del ' + K.noun.slice(3) : 'de ' + K.noun}`;
    },

    randomTitle(kind) {
      const K = MV.WORK_KINDS[kind] || MV.WORK_KINDS.libro;
      return `${U.pick(K.a)} ${U.pick(K.b)}`;
    },

    /** Crea una obra y devuelve el texto del resultado. */
    create(g, kind, title, genre) {
      const p = g.p, K = MV.WORK_KINDS[kind] || MV.WORK_KINDS.libro;
      kind = MV.WORK_KINDS[kind] ? kind : 'libro';
      const name = works.clean(title) || works.randomTitle(kind);
      const Gn = K.genres.find((x) => x.id === genre) || K.genres[0];
      const q = 8 + p.skills[K.skill] * 0.6 + p.stats.smarts * 0.2 + p.fame * 0.15 + Gn.bonus(p) + U.int(-10, 30) + (kind === 'cancion' ? MV.sys.music.best(p) * 4 : 0) + (kind === 'juego' ? p.skills.arte * 0.15 : 0);
      const st = U.clamp(Math.round(q / 18), 1, 5);
      const hit = U.chance(st === 5 ? 0.4 + p.fame / 250 : st === 4 ? 0.1 + p.fame / 300 : st === 3 ? 0.02 : 0);
      MV.fx.stat(g, 'stress', K.stress);
      MV.fx.skill(g, K.skill, 2);
      let earned, extra;
      if (hit) {
        earned = U.int(K.hit[0], K.hit[1]);
        MV.fx.stat(g, 'fame', U.int(K.fame[0], K.fame[1]));
        MV.fx.stat(g, 'happy', 12);
        MV.ach.unlock(g, K.ach);
        extra = `${K.hitText} Ganaste ${U.money(earned)}.`;
      } else {
        earned = Math.round(Math.pow(st, 3) * U.int(8, 40) * (1 + p.fame / 40));
        MV.fx.stat(g, 'happy', st >= 3 ? 3 : -2);
        extra = earned > 1500 ? `Te dejó ${U.money(earned)}.` : st <= 2 ? `${K.pron} compraron tu madre y dos primos.` : `Te dejó ${U.money(earned)}. Para un café y medio.`;
      }
      MV.fx.money(g, earned);
      p.works = (p.works || []).concat([{ id: U.uid('w'), kind, title: name, genre: Gn.id, age: p.age, stars: st, hit, earned, royalty: hit ? Math.round(earned * K.royalty) : 0 }]).slice(-MAX_WORKS);
      return `${K.verb} "${name}" (${Gn.name.toLowerCase()}). ${stars(st)} La crítica: ${U.pick(MV.WORK_REVIEWS[st])} ${extra}`;
    },

    /** Regalías anuales de los éxitos: bajan cada año hasta desaparecer. */
    yearly(g) {
      let total = 0;
      const best = [];
      (g.p.works || []).forEach((w) => {
        if (!w.royalty) return;
        total += w.royalty;
        best.push(w.title);
        w.royalty = Math.round(w.royalty * 0.6);
        if (w.royalty < 300) w.royalty = 0;
      });
      if (!total) return;
      MV.fx.money(g, total);
      MV.log(g, `Regalías por ${best.slice(0, 2).map((t) => `"${t}"`).join(' y ')}${best.length > 2 ? ' y otras' : ''}: ${U.money(total)}.`, '💿', 'good');
    },

    label(w) {
      const K = MV.WORK_KINDS[w.kind] || MV.WORK_KINDS.libro;
      const Gn = K.genres.find((x) => x.id === w.genre) || K.genres[0];
      return { icon: K.icon, title: `"${w.title}"`, sub: `${Gn.name}, a los ${w.age} años · ${stars(w.stars)}${w.hit ? ' · 🏆 Éxito' : ''}` };
    }
  };
  MV.sys.works = works;
})(window.MV = window.MV || {});
