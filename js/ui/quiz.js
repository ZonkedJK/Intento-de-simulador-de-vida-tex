/* Mil Vidas — hoja del examen de licencia: una pregunta por vez, con dibujo, y resultado con los errores. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const h = (...a) => UI.h(...a);

  UI.showQuiz = function (action) {
    const g = UI.g, kind = action.license, L = MV.LICENSES[kind];
    if (MV.usesLeft(g, action) <= 0) { UI.toast('⏳', '', 'Ya rendiste dos veces este año. El examinador necesita vacaciones.'); return; }
    const can = MV.sys.license.canTake(g, kind);
    if (!can.ok) { UI.toast(L.icon, L.name, `No puedes rendir: ${can.why.join(', ').toLowerCase()}.`); return; }
    const exam = MV.sys.license.exam(kind);
    const st = { answers: [] };
    UI.sheet({
      title: L.name, icon: L.icon,
      render: (body) => {
        const i = st.answers.length, q = exam.questions[i];
        const ok = st.answers.filter((a, k) => a === exam.questions[k].answer).length;
        body.append(h('p', { class: 'note', id: 'quiz-progress', 'aria-live': 'polite' }, `Pregunta ${i + 1} de ${exam.questions.length} · ✔ ${ok} · ✘ ${i - ok} · Apruebas con ${L.pass}. Cuesta ${MV.U.money(L.cost)} al terminar.`));
        if (q.sign) { const pic = h('div', { class: 'quiz-sign' }); pic.innerHTML = UI.signSVG(q.sign); body.append(pic); }
        body.append(h('p', { class: 'hand quiz-q', id: 'quiz-q' }, q.q));
        const list = h('div', { class: 'list' });
        q.options.forEach((opt, k) => list.append(h('button', { type: 'button', class: 'btn block quiz-opt', onclick: () => {
          st.answers.push(k);
          if (st.answers.length < exam.questions.length) { UI.refreshSheets(); return; }
          UI.closeSheets();
          UI.execAction(action, { exam, answers: st.answers.slice() }, undefined, undefined, undefined, () => mistakesBox(exam, st.answers));
        } }, opt)));
        body.append(list);
      }
    });
  };

  function mistakesBox(exam, answers) {
    const wrong = exam.questions.map((q, i) => ({ q, given: answers[i] })).filter((x) => x.given !== x.q.answer);
    if (!wrong.length) return null;
    return h('div', { class: 'quiz-mistakes' }, h('b', null, 'Tus errores:'), wrong.map(({ q, given }) => {
      const row = h('div', { class: 'quiz-mistake' });
      if (q.sign) { const pic = h('span', { class: 'quiz-mini' }); pic.innerHTML = UI.signSVG(q.sign); row.append(pic); }
      row.append(h('span', null, h('span', null, q.q), h('br'), h('small', null, `Respondiste: ${q.options[given]} · Correcta: ${q.options[q.answer]}`)));
      return row;
    }));
  }
})(window.MV = window.MV || {});
