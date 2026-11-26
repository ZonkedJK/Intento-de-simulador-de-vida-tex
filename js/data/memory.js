/* Mil Vidas — la memoria: los quince tipos de recuerdo de lo que le hiciste a alguien.
   good: si es un recuerdo bueno; w: su peso (número o función del dato); did(n, d): la frase en pasado, en segunda
   persona y con el género de la persona n. Si falta el dato, la frase se lee bien sin él.
   Las frases van sin comillas dobles: quien las usa las envuelve. */
(function (MV) {
  'use strict';
  const U = MV.U;
  /** lo/la según el género de la persona. */
  const lo = (n) => U.gw(n.gender, 'lo', 'la');
  const num = (d) => typeof d === 'number' && isFinite(d);
  const low = (d) => { const s = String(d); return s.charAt(0).toLowerCase() + s.slice(1); };

  MV.MEMORY_KINDS = {
    prestamo: { good: true, w: 2, did: (n, d) => (num(d) ? `le prestaste ${U.money(d)}` : 'le prestaste plata') },
    dinero: {
      good: true, w: (d) => (!num(d) ? 1 : d < 1000 ? 1 : d < 20000 ? 2 : 3),
      did: (n, d) => (num(d) ? `le diste ${U.money(d)}` : 'le diste plata')
    },
    regalo: { good: true, w: 1, did: (n, d) => (d ? `le regalaste ${low(d)}` : 'le hiciste un regalo') },
    apoyo: { good: true, w: 1, did: (n) => `${lo(n)} escuchaste cuando lo necesitaba` },
    inversion: {
      good: true, w: 2,
      did: (n, d) => (num(d) ? `invertiste ${U.money(d)} en su idea` : 'invertiste en su idea')
    },
    discurso: { good: true, w: 1, did: () => 'diste el discurso en su boda' },
    insulto: { good: false, w: 1, did: (n, d) => (d ? `le dijiste que ${d}` : `${lo(n)} insultaste`) },
    golpe: { good: false, w: 3, did: () => 'le pegaste' },
    espiar: { good: false, w: 2, did: (n) => `${lo(n)} espiaste` },
    broma: { good: false, w: 1, did: () => 'le hiciste una broma que salió mal' },
    infidelidad: { good: false, w: 3, did: (n, d) => (d ? `${lo(n)} engañaste con ${d}` : `${lo(n)} engañaste`) },
    ruptura: { good: false, w: 2, did: (n) => `${lo(n)} dejaste` },
    divorcio: { good: false, w: 3, did: () => 'le pediste el divorcio' },
    humillacion: { good: false, w: 2, did: (n) => `${lo(n)} dejaste en ridículo delante de todos` },
    revancha: { good: false, w: 2, did: () => 'le devolviste el golpe' }
  };
})(window.MV = window.MV || {});
