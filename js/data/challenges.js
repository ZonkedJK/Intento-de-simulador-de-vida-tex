/* Mil Vidas — desafíos opcionales al crear la vida. check: se cumple; fail: se pierde sin vuelta atrás.
   dynasty: el desafío pasa al heredero. */
(function (MV) {
  'use strict';
  const nw = (g) => MV.sys.money.netWorth(g);
  const president = (p) => !!p.job && p.job.id === 'politico' && p.job.level >= MV.jobById('politico').titles.length - 1;
  const uni = (p) => MV.hasDegree(p, 'universidad') || p.edu.stage === 'universidad';
  const C = (id, icon, name, desc, check, fail, extra) => Object.assign({ id, icon, name, desc, check, fail: fail || null }, extra || {});
  MV.CHALLENGES = [
    C('millonario_sin_uni', '💰', 'Millonario sin universidad', 'Llega a $1.000.000 de patrimonio sin pisar la universidad.', (g) => nw(g) >= 1e6 && !uni(g.p), (g) => uni(g.p)),
    C('presidente_50', '🏛️', 'Presidente antes de los 50', 'Gana la presidencia antes de cumplir 50 años.', (g) => president(g.p) && g.p.age < 50, (g) => g.p.age >= 50 && !president(g.p)),
    C('diez_hijos', '👨‍👩‍👧‍👦', 'Un equipo de fútbol', 'Ten 10 hijos (biológicos o adoptados).', (g) => MV.rels(g, 'hijo', true).length >= 10),
    C('centenario', '💯', 'Cien años', 'Vive hasta los 100.', (g) => g.p.age >= 100),
    C('campeon', '🏆', 'Leyenda del deporte', 'Llega a lo más alto de un deporte profesional.', (g) => (g.achLife || []).includes('leyenda')),
    C('santo_rico', '😇', 'Santo y rico', 'Ten 80 de karma y $1.000.000 de patrimonio a la vez.', (g) => g.p.karma >= 80 && nw(g) >= 1e6),
    C('carcel_presidencia', '⛓️', 'De la cárcel a la presidencia', 'Pisa la cárcel y después llega a la presidencia.', (g) => g.p.record.length > 0 && president(g.p)),
    C('nunca_trabajar', '🛋️', 'Nunca trabajar', 'Llega a los 60 sin haber tenido nunca un trabajo.', (g) => g.p.age >= 60 && !g.p.job && !g.p.jobs.length, (g) => !!g.p.job || g.p.jobs.length > 0),
    C('trotamundos', '🌍', 'Ciudadano del mundo', 'Vive en 3 países distintos.', (g) => ((g.challenge && g.challenge.countries) || []).length >= 3),
    C('estrella', '🌟', 'Superestrella', 'Llega a 100 de fama.', (g) => g.p.fame >= 100),
    C('artista', '🎨', 'Artista total', 'Ten un éxito como escritor, músico y pintor en la misma vida.', (g) => ['libro', 'cancion', 'cuadro'].every((k) => (g.p.works || []).some((w) => w.kind === k && w.hit))),
    C('dinastia_3', '🌳', 'Dinastía', 'Llega a la 3.ª generación de tu familia (el desafío pasa a tu heredero).', (g) => g.generation - ((g.challenge && g.challenge.startGen) || g.generation) >= 2, null, { dynasty: true })
  ];
})(window.MV = window.MV || {});
