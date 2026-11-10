/* Mil Vidas — personas, relaciones y creación de partidas. */
(function (MV) {
  'use strict';
  const U = MV.U;

  MV.VERSION = 5;

  MV.LOOK = {
    SKIN: ['#f7dcc8', '#efc6a4', '#dfab84', '#c48b62', '#9c6644', '#6e4529', '#4a2e1c'],
    HAIR: ['#17130f', '#3a2618', '#5e3d22', '#8a5a2b', '#c89a5a', '#e6c88c', '#a8402a', '#2b2b2b'],
    EYES: ['#3a2618', '#24507a', '#3c7a4a', '#6b4a2f', '#5a5a5a', '#1d1a19']
  };

  MV.STATS = {
    happy: { name: 'Felicidad', icon: '😊' },
    health: { name: 'Salud', icon: '❤️' },
    smarts: { name: 'Inteligencia', icon: '🧠' },
    looks: { name: 'Apariencia', icon: '✨' },
    stress: { name: 'Estrés', icon: '😰' },
    karma: { name: 'Karma', icon: '☯️' },
    fame: { name: 'Fama', icon: '⭐' }
  };

  MV.SKILLS = {
    musica: { name: 'Música', icon: '🎸' },
    deporte: { name: 'Deporte', icon: '⚽' },
    cocina: { name: 'Cocina', icon: '🍳' },
    programacion: { name: 'Programación', icon: '💻' },
    arte: { name: 'Arte', icon: '🎨' },
    carisma: { name: 'Carisma', icon: '🗣️' },
    idiomas: { name: 'Idiomas', icon: '🌍' },
    crimen: { name: 'Crimen', icon: '🦹' }
  };

  MV.TRAITS = ['amable', 'tóxico', 'generoso', 'tacaño', 'chismoso', 'leal', 'celoso',
    'divertido', 'perezoso', 'ambicioso', 'religioso', 'fiestero', 'dramático', 'tranquilo'];

  const REL_LABEL = {
    padre: ['Padre', 'Madre'], hermano: ['Hermano', 'Hermana'], abuelo: ['Abuelo', 'Abuela'],
    pareja: ['Novio', 'Novia'], conyuge: ['Esposo', 'Esposa'], ex: ['Ex', 'Ex'],
    hijo: ['Hijo', 'Hija'], nieto: ['Nieto', 'Nieta'], amigo: ['Amigo', 'Amiga'], enemigo: ['Enemigo', 'Enemiga'],
    amante: ['Amante', 'Amante'], companero: ['Compañero', 'Compañera'], mascota: ['Mascota', 'Mascota']
  };
  MV.REL_ORDER = ['conyuge', 'pareja', 'amante', 'padre', 'hijo', 'nieto', 'hermano', 'abuelo', 'mascota', 'amigo', 'companero', 'enemigo', 'ex'];
  MV.FAMILY = ['padre', 'hermano', 'abuelo', 'hijo', 'nieto'];

  MV.relLabel = function (type, person) {
    if (type === 'mascota' && person) return MV.SPECIES[person.species] ? MV.SPECIES[person.species].name : 'Mascota';
    const l = REL_LABEL[type] || ['Conocido', 'Conocida'];
    return person && person.gender === 'f' ? l[1] : l[0];
  };

  MV.stage = function (age) {
    if (age < 3) return 'bebe';
    if (age < 13) return 'nino';
    if (age < 18) return 'adolescente';
    if (age < 65) return 'adulto';
    return 'mayor';
  };
  MV.stageName = function (age, gender) {
    const s = MV.stage(age);
    return {
      bebe: 'Bebé', nino: U.gw(gender, 'Niño', 'Niña'), adolescente: 'Adolescente',
      adulto: 'Adulto' + (gender === 'f' ? 'a' : ''), mayor: 'Persona mayor'
    }[s];
  };

  MV.fullName = (p) => (p ? (p.first + (p.last ? ' ' + p.last : '')) : '¿?');

  /** Genera un aspecto. Si se pasan padres, hereda piel y pelo. */
  MV.makeLook = function (gender, parents) {
    const L = MV.LOOK;
    const ps = (parents || []).filter(Boolean);
    let skin, hair;
    if (ps.length) {
      const a = U.pick(ps).look, b = U.pick(ps).look;
      const ia = Math.max(0, L.SKIN.indexOf(a.skin)), ib = Math.max(0, L.SKIN.indexOf(b.skin));
      skin = L.SKIN[Math.round((ia + ib) / 2)];
      hair = U.chance(0.85) ? U.pick(ps).look.hair : U.pick(L.HAIR);
    } else {
      skin = U.pick(L.SKIN);
      hair = U.pick(L.HAIR);
    }
    // Peinados 0-8: corto, raya, rulos, largo, rodete, calvo, cresta, coleta, melena.
    const styles = gender === 'f' ? [3, 3, 4, 8, 7, 2, 1, 0, 6] : [0, 0, 1, 2, 5, 6, 8, 3, 7];
    const beardStyle = gender === 'm' ? U.pickW([0, 1, 2, 3], (k) => [55, 15, 12, 18][k]) : 0;
    return {
      v: 2, skin, hair,
      eyes: ps.length && U.chance(0.7) ? U.pick(ps).look.eyes : U.pick(L.EYES),
      style: U.pick(styles),
      beardStyle, beard: beardStyle > 0,
      glasses: U.chance(0.18),
      piercing: U.chance(0.12),
      freckles: U.chance(0.12)
    };
  };

  function countryOf(code) {
    return (MV.COUNTRIES && MV.COUNTRIES[code]) || (MV.COUNTRIES && MV.COUNTRIES[Object.keys(MV.COUNTRIES)[0]]);
  }
  MV.countryOf = countryOf;

  MV.randomFirst = function (gender, country) {
    const C = countryOf(country);
    return U.pick(C.names[gender === 'f' ? 'f' : 'm']);
  };
  MV.randomLast = function (country) { return U.pick(countryOf(country).last); };

  /** Crea un NPC y lo registra en la partida. */
  MV.newNPC = function (g, o) {
    o = o || {};
    const gender = o.gender || U.pick(['m', 'f']);
    const country = o.country || (g.p ? g.p.country : 'AR');
    const age = o.age != null ? o.age : U.int(18, 40);
    const n = {
      id: U.uid('n'),
      first: o.first || MV.randomFirst(gender, country),
      last: o.last != null ? o.last : MV.randomLast(country),
      gender, age, alive: true,
      species: o.species || 'humano',
      look: o.look || MV.makeLook(gender, o.parents),
      looks: o.looks != null ? o.looks : U.int(10, 95),
      smarts: o.smarts != null ? o.smarts : U.int(10, 95),
      health: o.health != null ? o.health : U.int(55, 100),
      money: o.money != null ? o.money : (age >= 18 ? U.int(0, 30000) : 0),
      job: o.job || null,
      traits: o.traits || U.shuffle(MV.TRAITS).slice(0, 2),
      lifespan: o.lifespan || null
    };
    if (n.job == null && age >= 18 && age < 66 && MV.randomJobTitle) n.job = MV.randomJobTitle(n);
    if (age >= 66 && n.job == null) n.job = 'Jubilad' + (gender === 'f' ? 'a' : 'o');
    g.people[n.id] = n;
    return n;
  };

  MV.newPet = function (g, species, o) {
    o = o || {};
    const S = MV.SPECIES[species] || MV.SPECIES.perro;
    const pet = MV.newNPC(g, {
      gender: U.pick(['m', 'f']), age: o.age != null ? o.age : U.int(0, 3),
      first: o.first || U.pick(MV.PET_NAMES), last: '', species,
      looks: U.int(20, 100), smarts: U.int(5, 60), health: U.int(70, 100), money: 0, job: '-',
      lifespan: U.int(S.life[0], S.life[1]), traits: [U.pick(['juguetón', 'gruñón', 'cariñoso', 'destructor', 'perezoso', 'curioso'])]
    });
    return pet;
  };

  /** Marca o desmarca una actividad como favorita. Devuelve true si quedó marcada. */
  MV.toggleFav = function (g, id) {
    g.favs = Array.isArray(g.favs) ? g.favs : [];
    const i = g.favs.indexOf(id);
    if (i >= 0) { g.favs.splice(i, 1); return false; }
    g.favs.push(id);
    return true;
  };

  MV.person = (g, id) => g.people[id] || (g.p && g.p.id === id ? g.p : null);

  /** Relaciones del jugador; filtra por tipo(s). Por defecto solo vivos. */
  MV.rels = function (g, types, includeDead) {
    const ts = types == null ? null : (Array.isArray(types) ? types : [types]);
    return g.p.rels
      .filter((r) => (!ts || ts.includes(r.type)))
      .map((r) => ({ r, n: g.people[r.id] }))
      .filter((x) => x.n && (includeDead || x.n.alive));
  };
  MV.relOf = (g, id) => g.p.rels.find((r) => r.id === id);

  MV.addRel = function (g, person, type, rel) {
    const ex = MV.relOf(g, person.id);
    if (ex) { ex.type = type; if (rel != null) ex.rel = rel; return ex; }
    const r = { id: person.id, type, rel: rel != null ? rel : U.int(40, 80), since: g.p.age };
    g.p.rels.push(r);
    return r;
  };
  MV.removeRel = function (g, id) { g.p.rels = g.p.rels.filter((r) => r.id !== id); };

  MV.partner = function (g) {
    const x = MV.rels(g, ['conyuge', 'pareja'])[0];
    return x || null;
  };

  MV.log = function (g, text, icon, tone) {
    if (!g.log.length) g.log.push({ age: g.p ? g.p.age : 0, year: g.year, items: [] });
    g.log[g.log.length - 1].items.push({ t: text, i: icon || '•', tone: tone || '' });
  };

  MV.CLASSES = {
    pobre: { name: 'humilde', money: [0, 4000], w: 25 },
    media: { name: 'de clase media', money: [5000, 40000], w: 45 },
    acomodada: { name: 'acomodada', money: [50000, 250000], w: 22 },
    rica: { name: 'adinerada', money: [400000, 3000000], w: 8 }
  };

  function newPlayerBase(o) {
    return {
      id: U.uid('p'), first: o.first, last: o.last, gender: o.gender, age: o.age || 0,
      alive: true, country: o.country, city: o.city, look: o.look,
      stats: o.stats || { happy: U.int(55, 100), health: U.int(65, 100), smarts: U.int(5, 100), looks: U.int(5, 100) },
      stress: 10, karma: 0, fame: 0,
      skills: Object.keys(MV.SKILLS).reduce((a, k) => (a[k] = 0, a), {}),
      money: o.money || 0,
      edu: { stage: null, year: 0, perf: 50, major: null, done: [], degrees: [], dropped: false },
      job: null, jobs: [], retired: false, pension: 0,
      business: null,
      inv: { plazo: 0, indice: 0, acciones: 0, cripto: 0 },
      assets: [], housing: 'padres', rent: null, loans: [],
      conds: [], addic: { alcohol: 0, drogas: 0, apuestas: 0, tabaco: 0 },
      record: [], prison: null, wanted: 0,
      license: false, aspiration: null,
      counters: {}, flags: {}, yearActs: {},
      rels: [], heirId: null, followers: 0, club: null, sportsExp: {}, talent: MV.rollTalent ? MV.rollTalent() : {}, tattoos: [],
      hobbies: {}, routine: { exercise: 'ninguno', diet: 'libre' }, history: [],
      orientation: o.orientation || (U.chance(0.88) ? 'hetero' : U.pick(['homo', 'bi']))
    };
  }
  MV.newPlayerBase = newPlayerBase;

  /** Crea una partida nueva con el jugador recién nacido y su familia. */
  MV.newGame = function (opts) {
    opts = opts || {};
    if (opts.seed != null) MV.rng.seed(opts.seed);
    const codes = Object.keys(MV.COUNTRIES);
    const country = opts.country && MV.COUNTRIES[opts.country] ? opts.country : U.pick(codes);
    const C = MV.COUNTRIES[country];
    const gender = opts.gender === 'f' || opts.gender === 'm' ? opts.gender : U.pick(['m', 'f']);
    const year = opts.year || new Date().getFullYear();
    const g = {
      version: MV.VERSION, year, startYear: year, people: {}, log: [], queue: [], evDone: {},
      generation: opts.generation || 1, dynasty: opts.dynasty || null, over: false, rng: 0, favs: []
    };
    const clsKey = U.pickW(Object.keys(MV.CLASSES), (k) => MV.CLASSES[k].w);
    const cls = MV.CLASSES[clsKey];

    const momAge = U.int(18, 42);
    const mom = MV.newNPC(g, { gender: 'f', age: momAge, country, money: U.int(cls.money[0], cls.money[1]) });
    const dad = MV.newNPC(g, { gender: 'm', age: U.int(Math.max(18, momAge - 6), momAge + 10), country, money: U.int(cls.money[0], cls.money[1]) });
    const last = opts.last || dad.last;
    dad.last = last; // el apellido de la familia
    const look = opts.look || MV.makeLook(gender, [mom, dad]);
    if (opts.skin) look.skin = opts.skin;

    const p = newPlayerBase({
      first: opts.first || MV.randomFirst(gender, country), last, gender, country,
      city: U.pick(C.cities), look, stats: opts.stats
    });
    g.p = p;
    g.dynasty = g.dynasty || { id: U.uid('d'), name: last };
    p.flags.clase = clsKey;

    const dadAbsent = U.chance(0.1);
    MV.addRel(g, mom, 'padre', U.int(65, 100));
    if (!dadAbsent) MV.addRel(g, dad, 'padre', U.int(55, 100));
    else p.flags.padreAusente = dad.id;
    if (!dadAbsent && U.chance(0.12)) p.flags.padresDivorciados = true;

    // Hermanos mayores
    const nSib = U.pickW([0, 1, 2, 3], (k) => [40, 35, 17, 8][k]);
    for (let i = 0; i < nSib; i++) {
      const sg = U.pick(['m', 'f']);
      const sAge = U.int(1, Math.max(1, Math.min(16, momAge - 17)));
      const sib = MV.newNPC(g, { gender: sg, age: sAge, last, country, parents: [mom, dad], money: 0 });
      MV.addRel(g, sib, 'hermano', U.int(35, 90));
    }
    // Abuelos
    const nGp = U.pickW([0, 1, 2, 3], (k) => [20, 35, 30, 15][k]);
    for (let i = 0; i < nGp; i++) {
      const ga = MV.newNPC(g, { gender: U.pick(['m', 'f']), age: U.int(Math.max(55, momAge + 20), 92), country, health: U.int(30, 85), money: U.int(cls.money[0], cls.money[1] * 2) });
      MV.addRel(g, ga, 'abuelo', U.int(50, 100));
    }
    // Mascota familiar
    if (U.chance(0.2)) {
      const pet = MV.newPet(g, U.pick(['perro', 'gato', 'gato', 'perro', 'conejo', 'pez']), { age: U.int(0, 6) });
      MV.addRel(g, pet, 'mascota', U.int(50, 90));
    }

    g.log.push({ age: 0, year, items: [] });
    const dadTxt = dadAbsent ? 'Tu padre no aparece por ningún lado.' :
      `Tu padre es ${MV.fullName(dad)} (${dad.age}, ${dad.job || 'desempleado'}).`;
    MV.log(g, `Naciste en ${p.city}, ${C.name} ${C.flag}. Te llamaron ${p.first} ${p.last}.`, '👶');
    MV.log(g, `Tu madre es ${MV.fullName(mom)} (${mom.age}, ${mom.job || 'desempleada'}). ${dadTxt}`, '👪');
    MV.log(g, `Tu familia es ${cls.name}.`, clsKey === 'rica' ? '💎' : clsKey === 'pobre' ? '🪙' : '🏠');
    if (p.flags.padresDivorciados) MV.log(g, 'Tus padres ya hablan de divorcio. Empezamos bien.', '💔');
    if (nSib === 1) {
      const s = MV.rels(g, 'hermano')[0].n;
      MV.log(g, `Tienes ${U.gw(s.gender, 'un hermano mayor', 'una hermana mayor')}, ${s.first}, que ya te mira con desconfianza.`, '🧒');
    } else if (nSib > 1) MV.log(g, `Tienes ${nSib} hermanos mayores. Serás el último en elegir el postre.`, '🧒');
    MV.sys.challenge.start(g, opts.challenge);
    MV.sys.history.record(g);
    g.rng = MV.rng.getState();
    return g;
  };
})(window.MV = window.MV || {});
