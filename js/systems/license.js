/* Mil Vidas — licencias: requisitos, armado del examen, corrección y simulación. */
(function (MV) {
  'use strict';
  const U = MV.U;
  MV.sys = MV.sys || {};

  const license = {
    /** ¿Tiene la licencia? Para conducir también vale el campo viejo p.license. */
    has(g, kind) {
      const p = g.p;
      return !!((p.licenses && p.licenses[kind]) || (kind === 'auto' && p.license));
    },

    /** Nombres de las licencias que tienes. */
    held(g) { return Object.keys(MV.LICENSES).filter((k) => license.has(g, k)).map((k) => MV.LICENSES[k].name); },

    /** ¿Puede rendir ahora? why: motivos que faltan. */
    canTake(g, kind) {
      const L = MV.LICENSES[kind], p = g.p, why = [];
      if (!L) return { ok: false, why: ['Esa licencia no existe'] };
      if (license.has(g, kind)) why.push('Ya la tienes');
      if (p.prison) why.push('Estás en la cárcel');
      if (p.age < L.minAge) why.push(`Edad mínima ${L.minAge}`);
      if (L.requires && !license.has(g, L.requires)) why.push(MV.LICENSES[L.requires].name);
      if (p.money < L.cost) why.push(`Cuesta ${U.money(L.cost)}`);
      return { ok: !why.length, why };
    },

    /** Arma un examen: preguntas al azar sin repetir, 3 opciones mezcladas. */
    exam(kind) {
      const L = MV.LICENSES[kind];
      const questions = U.shuffle(MV.QUIZ[kind].slice()).slice(0, L.n).map((Q) => {
        const options = U.shuffle([Q.a].concat(U.shuffle(Q.wrong.slice()).slice(0, 2)));
        return { id: Q.id, q: Q.q, sign: Q.sign, options, answer: options.indexOf(Q.a) };
      });
      return { kind, questions };
    },

    /** Corrige el examen: cobra el intento y, si aprueba, guarda la licencia. */
    grade(g, kind, exam, answers) {
      const L = MV.LICENSES[kind], p = g.p;
      MV.fx.money(g, -L.cost);
      const mistakes = [];
      let correct = 0;
      exam.questions.forEach((q, i) => {
        const given = answers[i];
        if (given === q.answer) correct++;
        else mistakes.push({ q: q.q, sign: q.sign, given: given == null ? 'Sin responder' : q.options[given], right: q.options[q.answer] });
      });
      const passed = correct >= L.pass;
      if (passed) {
        p.licenses = Object.assign({}, p.licenses, { [kind]: true });
        if (kind === 'auto') p.license = true;
      }
      return { correct, total: exam.questions.length, passed, mistakes };
    },

    /** Rinde el examen (con las respuestas de la hoja o simuladas) y devuelve el texto. */
    take(g, kind, o) {
      const L = MV.LICENSES[kind], p = g.p;
      const exam = (o && o.exam) || license.exam(kind);
      const hit = U.clamp(0.55 + p.stats.smarts / 250, 0.05, 0.98);
      const answers = (o && o.answers) || exam.questions.map((q) => (U.chance(hit) ? q.answer : (q.answer + U.int(1, 2)) % 3));
      const r = license.grade(g, kind, exam, answers);
      if (r.passed) {
        MV.fx.stat(g, 'happy', 6);
        MV.ach.unlock(g, L.ach);
        return `¡Aprobaste el examen de la ${L.name.toLowerCase()}! ${r.correct} de ${r.total} correctas. ${U.pick(['El examinador respiró aliviado.', 'Te sacaste la peor foto de tu vida para el carnet.', 'Ya puedes presumirlo en el grupo de la familia.'])}`;
      }
      MV.fx.stat(g, 'happy', -4);
      const m = r.mistakes[0];
      return `Reprobaste el examen de la ${L.name.toLowerCase()}: ${r.correct} de ${r.total} correctas (necesitabas ${L.pass}).${m ? ` Por ejemplo, la respuesta era "${m.right}".` : ''}`;
    }
  };
  MV.sys.license = license;
})(window.MV = window.MV || {});
