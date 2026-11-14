/* Mil Vidas — el gato que habla: las tres voces (filósofo gruñón, diva dramática y aristócrata venido a menos).
   Cada frase es una función (c) => texto, con c = { g, p, n, d }: partida, jugador, gato y datos del caso.
   Las frases van sin comillas dobles y sin el nombre del gato delante: eso lo pone quien las usa. */
(function (MV) {
  'use strict';
  const U = MV.U;
  /** Según el género del gato (gn) o del jugador (gp). */
  const gn = (c, m, f) => U.gw(c.n.gender, m, f);
  const gp = (c, m, f) => U.gw(c.p.gender, m, f);
  const yrs = (c) => `${c.d.years} año${c.d.years === 1 ? '' : 's'}`;
  const $ = (c) => U.money(c.d.amount);

  MV.CAT_VOICES = {
    filosofo: {
      name: 'filósofo gruñón|filósofa gruñona',
      intro: (c) => `Sí, hablo. Llevo años oyéndote decir tonterías y alguien tenía que contestar. Como dice el refrán: ${gn(c, 'gato', 'gata')} que calla, piensa peor de ti.`,
      advice: {
        preso: (c) => `Te faltan ${yrs(c)} ahí adentro. Pórtate bien, lee en la biblioteca y no te metas en motines: preso que hace buena letra sale antes de la cena.`,
        profugo: (c) => `Te buscan y tú paseando. Tienes ${yrs(c)} pendientes y cada año afuera es una moneda al aire. No llames la atención: gato escondido no sale en la foto.`,
        salud: (c) => (c.d.cond ? `Esa ${c.d.cond} no se cura mirando el techo. Trátala este año: quien deja la salud para mañana amanece en el veterinario.`
          : `Estás ${gp(c, 'hecho', 'hecha')} un trapo. Médico, gimnasio o siesta, pero haz algo por tu salud antes de que sea tarde.`),
        deudas: (c) => `Las cuentas no cierran: debes ${$(c)} este año y en la billetera no hay con qué. Vende algo o gasta menos. Bolsillo roto no guarda sardinas.`,
        sucio: (c) => `Tienes ${$(c)} que no puedes explicar. Lávalos de a poco o un fiscal va a venir a preguntar. Plata sucia, sueño corto.`,
        pareja: (c) => `${c.d.name} está a un portazo de irse. Un regalo, tiempo juntos y una disculpa aunque tengas razón. Amor descuidado, sillón para uno.`,
        trabajo: (c) => `Como ${c.d.title} rindes tan poco que hasta yo lo noto, y yo duermo dieciséis horas. Esfuérzate o te echan.`,
        estres: (c) => `Tienes los nervios como cable pelado. Descansa, medita o tómate vacaciones. Quien no duerme la siesta, la paga con intereses.`,
        seguro: (c) => `A tu edad y sin seguro de salud. Un tratamiento serio te deja en la calle. Contrátalo en Bienes, y de paso me compras atún.`
      },
      idle: [
        (c) => `No veo ningún desastre a la vista. Aprovecha, que la calma es como la leche: se corta sola.`,
        (c) => `Todo en orden. Sospechoso. Pero como dice el refrán: a día tranquilo no se le mira el diente.`,
        (c) => `Hoy no tengo nada que reprocharte. Anótalo, que no pasa seguido.`,
        (c) => `Vas bien. No te agrandes: ${gn(c, 'gato', 'gata')} que presume, se cae del techo.`
      ]
    },
    diva: {
      name: 'divo dramático|diva dramática',
      intro: (c) => `¡Por fin! ¿Sabes lo que es pasar años sin poder decirte que ese sillón es MÍO? Siéntate, que tenemos mucho de qué hablar. Sobre mí, principalmente.`,
      advice: {
        preso: (c) => `¡${yrs(c)} más ahí adentro! ¿Y a mí quién me abre las latas? Pórtate como un ángel y apela si puedes, que este drama ya duró demasiados capítulos.`,
        profugo: (c) => `¡Vivo con ${gp(c, 'un prófugo', 'una prófuga')}! Te buscan por ${yrs(c)} y yo sin arreglar para la foto del diario. No llames la atención, te lo ruego.`,
        salud: (c) => (c.d.cond ? `¡Tu ${c.d.cond} me tiene con el corazón en la boca! Trátala YA. No pienso quedar ${gn(c, 'huérfano', 'huérfana')} en mitad de temporada.`
          : `¡Mírate! Tienes peor cara que yo después del baño. Descansa, cuídate, ve al médico. Hazlo por mí.`),
        deudas: (c) => `¡Estamos en la ruina! Debes ${$(c)} este año y no los tienes. Vende algo, lo que sea, menos mi rascador.`,
        sucio: (c) => `Hay ${$(c)} escondidos que huelen peor que mi arenero. Lávalos antes de que lleguen las cámaras, y yo sin peinar.`,
        pareja: (c) => `${c.d.name} te mira como yo miro al veterinario. Haz algo romántico hoy mismo o este capítulo termina con valijas en la puerta.`,
        trabajo: (c) => `Me contaron que como ${c.d.title} eres el hazmerreír del lugar. ¡Qué vergüenza para esta familia! Esfuérzate, que yo tengo una reputación.`,
        estres: (c) => `Estás insoportable de ${gp(c, 'nervioso', 'nerviosa')}, y aquí ${gn(c, 'el único', 'la única')} con derecho a un ataque soy yo. Tómate un descanso, por el bien de los dos.`,
        seguro: (c) => `¿Sin seguro de salud a tu edad? ¡Qué suspenso innecesario! Contrátalo en Bienes, que los finales trágicos no me favorecen.`
      },
      idle: [
        (c) => `Hoy no hay ninguna tragedia. Qué aburrido. Tendré que inventar una.`,
        (c) => `Todo va bien, o sea que nadie me presta atención. Tomo nota.`,
        (c) => `Tu vida está en orden. La mía no: hace tres horas que nadie me acaricia.`,
        (c) => `Sin novedades. Si quieres drama, mira mi plato: se le ve el fondo.`
      ]
    },
    aristocrata: {
      name: 'aristócrata venido a menos|aristócrata venida a menos',
      intro: (c) => `No te asustes. En mi otra vida fui ${gn(c, 'conde', 'condesa')} y me atendían mejor, pero contigo me conformo. Sigue sirviendo el atún: desde hoy te diré si está a la altura.`,
      advice: {
        preso: (c) => `Te quedan ${yrs(c)} de condena. En mi familia también hubo presos, pero en torres con vista. Compórtate y saldrás antes; yo te espero, aunque no lo diré en público.`,
        profugo: (c) => `Te buscan y tienes ${yrs(c)} por cumplir. Un noble no huye: se retira con elegancia. Tú huyes, así que al menos no llames la atención.`,
        salud: (c) => (c.d.cond ? `Esa ${c.d.cond} es impropia de esta casa. Hazte ver por un médico de verdad, no por el curandero del barrio.`
          : `Tu salud es una vergüenza para el apellido. Médico y reposo, y que no tenga que repetirlo.`),
        deudas: (c) => `Debes ${$(c)} este año y no los tienes. Mi familia perdió un castillo así. Vende algo antes de que vengan a tasar mis cosas.`,
        sucio: (c) => `Guardas ${$(c)} de procedencia dudosa. La nobleza siempre tuvo dinero raro, pero lo lavaba con discreción. Imítala.`,
        pareja: (c) => `${c.d.name} está a punto de dejarte. Un regalo, una cena, una disculpa: lo mínimo que se espera de alguien que vive conmigo.`,
        trabajo: (c) => `Tu desempeño como ${c.d.title} es lamentable. En mi otra vida te habría despedido yo. Esfuérzate antes de que lo haga otro.`,
        estres: (c) => `Te veo ${gp(c, 'alterado', 'alterada')}. Qué vulgar. La gente de clase descansa: tómate unos días y vuelve presentable.`,
        seguro: (c) => `A tu edad y sin seguro de salud. Hasta mis antepasados tenían médico de cabecera. Contrátalo en Bienes.`
      },
      idle: [
        (c) => `No hay nada que objetar hoy. Aprovecha: no acostumbro aprobar a nadie.`,
        (c) => `Todo en orden. Casi parece una casa decente.`,
        (c) => `No tengo consejos. En mi otra vida esto se celebraba con salmón; aquí me conformo con que no molestes.`,
        (c) => `Sin novedad. Sigue así y quizá algún día merezcas mi compañía.`
      ]
    }
  };
})(window.MV = window.MV || {});
