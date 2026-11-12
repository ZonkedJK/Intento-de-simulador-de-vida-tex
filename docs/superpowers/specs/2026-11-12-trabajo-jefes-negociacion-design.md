# Parte C1 — Trabajo: jefe, compañeros, negociación, más empleos y decisiones — diseño

**Fecha:** 2026-11-12

**Origen:** la hoja de ruta pide, para la Parte C, "trabajos (jefe y compañeros, más empleos, negociar sueldo,
decisiones laborales) y dinero (inmuebles, seguros y jubilación, dinero sucio)".

**Respuestas del usuario:**
- Dividir en C1 (trabajo) y después C2 (dinero), cada una con su especificación y su PR.
- En trabajo, las 4 cosas: jefe y compañeros, negociar el sueldo, más empleos y decisiones laborales.
- Detalle **liviano**: más decisiones con consecuencias y pocos números a la vista.
- Enfoque aprobado: un módulo nuevo de "lugar de trabajo" apoyado en lo que ya existe. El jefe y los compañeros son
  relaciones normales, y los eventos de trabajo van en su propio archivo.

**Límites:**
- Personas, empresas y lugares inventados.
- Humor negro sin contenido explícito.
- Textos en español con concordancia de género.

## 1. Alcance

Todo lo de esta parte aplica solo a los trabajos de **tiempo completo** (`type: 'full'`). Los de medio tiempo,
fama, deportes y la mafia siguen como ahora. La única excepción es el freelance (§5), que está disponible tengas
o no trabajo.

## 2. Tu jefe

- **Al empezar un trabajo** de tiempo completo se crea una persona con nombre del país del jugador, entre 30 y
  65 años, con relación nueva de tipo `jefe` (etiqueta "Jefe" o "Jefa"). La relación empieza entre 45 y 60.
  El trabajo guarda `boss: { id, kind }`.
- **Carácter** (`kind`), elegido al azar:

| Carácter | Ícono | Efecto |
|---|---|---|
| Buenazo/Buenaza | 🙂 | +0,10 a la chance de ascenso y +0,15 a la de aumento |
| Controlador/Controladora | 🔍 | +2 de estrés al año. El rendimiento se mueve más: el 50 % viene de lo que hiciste ese año (ahora es el 40 %) |
| Gritón/Gritona | 📢 | +3 de estrés al año. "Esforzarte más" da +3 extra de rendimiento |
| Ausente | 👻 | Sin efectos: solo cuenta el rendimiento |
| Trepador/Trepadora | 🧗 | Con relación < 50, −0,20 a la chance de ascenso. En "Pedir un aumento", −0,10 |

- **La relación con el jefe pesa en todo:**
  - Ascenso: la chance suma `(relación − 50) / 200`, o sea entre −0,25 y +0,25.
  - Aumento: entra en las chances de cada pedido (§4).
  - Despido: con relación < 25, el umbral por bajo rendimiento sube de 22 a 30 y la chance de 0,40 a 0,55.
- **"Hablar con tu jefe"** (la acción existente, 1 por año) pasa a depender del carácter:

| Carácter | Resultado |
|---|---|
| Buenazo | +5 de relación |
| Controlador | +6 de estrés y +4 de rendimiento |
| Gritón | 50 % de que te grite: −4 de felicidad |
| Ausente | "No estaba" (nada) |
| Trepador | +3 de relación y −3 de rendimiento: te robó una idea en la misma charla |

- **"Caerle bien al jefe"** (nueva, 1 por año): +4 a +10 de relación, −1 de karma y −2 de relación con cada
  compañero de ese trabajo.
- **Jefe nuevo:** evento `trabajo_jefe_nuevo`. El jefe actual deja de ser relación y llega otro con carácter nuevo.
  Se avisa con su nombre y su carácter.

## 3. Compañeros

- **Al empezar** un trabajo de tiempo completo se crean 2 compañeros con nombre, de entre 18 y 70 años y como
  mucho 15 años de diferencia con el jugador. Son relaciones de tipo `companero` con relación entre 40 y 65.
  Cada uno tiene un **rol**, al azar y sin repetir entre los dos: `aliado` (te cubre), `rival` (compite por tu
  ascenso) o `chismoso`.
- El trabajo guarda `mates: [{ id, role }]`. Las personas que suma "Socializar con compañeros" no entran en
  `mates`; siguen como ahora.
- **Al dejar ese trabajo** (renuncia, despido, cambio, jubilación, traslado):
  - el jefe deja de ser relación, salvo que la relación sea ≥ 80: entonces pasa a `amigo`;
  - cada compañero de `mates` pasa a `amigo` si la relación es > 60, o deja de ser relación si no.
- **Rival en los ascensos:** si el rival tiene relación ≥ 60 con el jefe (dato que se guarda en el compañero,
  entre 30 y 70), la chance de ascenso baja 0,10.

## 4. Negociar el sueldo

**Oferta al ser contratado.** Al pasar la entrevista de un trabajo de tiempo completo ya no se contrata directo.
Llega la decisión `oferta_trabajo` con el sueldo ofrecido (la misma cuenta de hoy: `pay[nivel] × 0,9–1,1`).
Los medio tiempo se contratan como ahora.

| Opción | Resultado |
|---|---|
| Aceptar $X | Te contratan con X |
| Pedir $X×1,10 | Chance 0,80 + carisma/500 + modificador de contratación del mundo. Si sale, X×1,10; si no, X |
| Pedir $X×1,25 | Chance 0,40 + carisma/250 + modificador del mundo. Si sale, X×1,25. Si no, mitad y mitad: te quedas con X, o retiran la oferta y no te contratan |

**Pedir un aumento** (la acción existente, 1 por año) abre la decisión `pedir_aumento`. Cada chance se limita
entre 0,05 y 0,95. "rel" es la relación con el jefe y "carácter" es el +0,15 o −0,10 de la tabla del §2.

| Opción | Chance | Si sale | Si no |
|---|---|---|---|
| Pedir un 5 % | 0,55 + rendimiento/250 + (rel−50)/200 + carácter | +5 % | −2 de relación |
| Pedir un 15 % | 0,15 + rendimiento/200 + (rel−50)/150 + carácter | +15 % | −5 de relación y −3 de felicidad |
| Amenazar con irte | 0,10 + rendimiento/180 + (rel−50)/150 | +20 % | Mitad y mitad: "aceptan tu renuncia" (dejas el trabajo) o −15 de relación |

**Bono de fin de año.** Si el rendimiento es ≥ 80 y no hay crisis (`MV.sys.world.mods(g).hire >= 0`), hay un 60 %
de chance de cobrar entre el 5 % y el 15 % del sueldo. Queda en el diario.

## 5. Más empleos

**15 trabajos nuevos de tiempo completo**, en `js/data/careers.js` junto a los otros:

| id | Rubro | Escalera | Sueldos | Requisitos |
|---|---|---|---|---|
| jardinero 🌿 | Jardinería | Jardinero · Paisajista · Diseñador de jardines | 16k · 28k · 52k | Salud 40 |
| cartero ✉️ | Correo | Cartero · Jefe de reparto · Director de sucursal postal | 17k · 25k · 40k | Primaria, salud 45 |
| pescador 🎣 | Pesca | Pescador · Patrón de barco · Dueño de flota pesquera | 15k · 32k · 70k | Salud 50, 16 años |
| bibliotecario 📚 | Biblioteca | Auxiliar de biblioteca · Bibliotecario · Director de biblioteca | 16k · 27k · 45k | Secundaria, inteligencia 55 |
| barista ☕ | Cafetería | Barista · Barista campeón · Tostador de café | 14k · 24k · 46k | Secundaria |
| tatuador 🖋️ | Tatuajes | Aprendiz de tatuador · Tatuador · Tatuador de culto | 12k · 30k · 85k | Arte 30, 18 años |
| crupier 🎰 | Casino | Crupier · Jefe de mesa · Gerente de casino | 18k · 30k · 70k | Secundaria, 18 años, sin antecedentes |
| detective 🕵️ | Investigaciones | Detective privado · Detective estrella · Dueño de agencia de detectives | 22k · 45k · 90k | Secundaria, inteligencia 60, 21 años |
| paramedico 🚑 | Emergencias | Paramédico · Paramédico jefe · Coordinador de emergencias | 26k · 38k · 56k | Secundaria, salud 55, inteligencia 50, 18 años |
| farmaceutico 💊 | Farmacia | Farmacéutico · Farmacéutico jefe · Dueño de cadena de farmacias | 36k · 55k · 120k | Título en Biología o Medicina |
| dentista 🦷 | Odontología | Dentista · Ortodoncista · Dentista de celebridades | 42k · 75k · 140k | Título en Medicina |
| sommelier 🍷 | Vinos | Ayudante de sommelier · Sommelier · Sommelier internacional | 18k · 34k · 80k | Secundaria, cocina 25, 18 años |
| controlador 🛫 | Aeropuerto | Controlador aéreo en práctica · Controlador aéreo · Jefe de torre | 38k · 70k · 105k | Técnica en Aviación, inteligencia 65 |
| diplomatico 🌐 | Cancillería | Agregado · Cónsul · Embajador | 40k · 75k · 150k | Título en Derecho, Idiomas o Economía; idiomas 40 |
| guardaparques 🏞️ | Parques nacionales | Guardaparques · Guardaparques jefe · Director de parque nacional | 20k · 32k · 52k | Secundaria, salud 55, 18 años |

- Todos los títulos tienen forma masculina y femenina ("Jardinero|Jardinera").
- Estrés de 1 a 9 según el rubro (el controlador aéreo, 9).
- Habilidad que se entrena: tatuador → arte; barista y sommelier → cocina; diplomático → idiomas.

**Encargos freelance.** Es una acción nueva en la hoja de Ocupación, 2 por año, desde los 16 años. Se puede hacer
con o sin trabajo. Ofrece un encargo por cada habilidad con nivel 10 o más:

| Habilidad | Encargo |
|---|---|
| Programación | 💻 Arreglar la web de un cliente |
| Arte | 🎨 Diseñar un logo |
| Idiomas | 🌐 Traducir un documento |
| Cocina | 🍰 Cocinar para un evento |
| Música | 🎸 Tocar en un casamiento |
| Carisma | 🎙️ Animar una fiesta |

- **Pago:** nivel × $150 a $400.
- **Efectos:** +3 de estrés y +1 en esa habilidad.
- **Riesgo:** 15 % de que el cliente pague la mitad ("te pagó en exposición"). Si no hay ninguna habilidad en 10, la
  acción explica qué falta.

## 6. Decisiones laborales

Son 12 eventos nuevos en `js/data/events/trabajo.js`. Todos exigen un trabajo de tiempo completo con jefe. Los que
nombran a un compañero exigen uno vivo con ese rol. Aparecen en el sorteo anual normal con los pesos y
enfriamientos por defecto, salvo que se diga otra cosa.

1. **`trabajo_maquillar`:** tu jefe te pide maquillar números.
   - **Hacerlo:** bono del 10 % del sueldo y −6 de karma. Al año siguiente, 35 % de que salga a la luz: despido y
     un antecedente por "Fraude contable".
   - **Negarte:** −15 de relación con el jefe y +2 de karma.
   - **Denunciarlo** (50 / 50):
     - héroe: +8 de karma, +3 de fama y llega un jefe nuevo;
     - despido "por reestructuración", con +8 de karma.
2. **`trabajo_huelga`:** huelga en tu trabajo.
   - **Sumarte:** pierdes el 10 % del sueldo de ese año y +10 de relación con los compañeros. Hay 60 % de que
     consigan +8 % de sueldo.
   - **Cruzar el piquete:** +10 de relación con el jefe, −15 con los compañeros y −2 de karma.
   - **Quedarte en casa:** +3 de felicidad y −5 de rendimiento.
3. **`trabajo_traslado`:** te ofrecen trasladarte a otro país con +30 % de sueldo.
   - **Aceptar:** `p.country` pasa a ser otro país al azar y `p.city`, una ciudad de ese país. El sueldo sube 30 %
     y llegan jefe y compañeros nuevos. +5 de felicidad y +5 de estrés. Pareja e hijos no cambian.
   - **Rechazar:** −5 de relación con el jefe.
4. **`trabajo_romance`:** un compañero aliado o chismoso de edad compatible (18+) coquetea contigo.
   - **Salir:** pasa a `pareja` si no tienes pareja ni cónyuge, o a `amante` si los tienes. Hay 25 % de que se
     entere Recursos Humanos: −10 de rendimiento y +5 de estrés.
   - **Rechazar con amabilidad:** −5 de relación.
   - **Contárselo a todos:** −3 de karma y esa persona pasa a enemigo.
5. **`trabajo_credito`:** el rival presenta tu idea como suya.
   - **Reclamar ante el jefe:** con chance relación-con-el-jefe / 100, +8 de rendimiento y −10 con el rival; si
     no, −5 con el jefe.
   - **Dejarlo pasar:** −4 de felicidad.
   - **Vengarte:** −4 de karma y el rival pasa a enemigo. Hay 30 % de que el jefe se entere: −10.
6. **`trabajo_fiesta`:** fiesta de fin de año.
   - **Emborracharte:** +6 de felicidad. Hay 40 % de que el chismoso lo cuente: −8 con el jefe.
   - **Dar un discurso:** +2 de carisma. Mitad y mitad: +6 con el jefe, o −3 de felicidad.
   - **Irte temprano:** −3 de estrés.
7. **`trabajo_reestructuracion`:** desde nivel 2 y con al menos un compañero de `mates`, te piden despedir a
   alguien.
   - **Despedir al rival:** −2 de karma y el rival pasa a enemigo y sale de `mates`.
   - **Despedir al aliado:** −6 de karma, −5 de felicidad y el aliado pasa a enemigo.
   - **Renunciar en protesta:** dejas el trabajo con +5 de karma.
8. **`trabajo_competencia`:** otra empresa del mismo rubro te ofrece +20 %.
   - **Aceptar:** mismo puesto y nivel con +20 %; jefe y compañeros nuevos; `lvlYears` a 0.
   - **Usarla para negociar:** chance 0,5 + (rel−50)/200 de +12 %; si no, −10 con el jefe ("¿y entonces por qué
     no te vas?").
   - **Rechazar:** +3 con el jefe.
9. **`trabajo_ascenso_trampa`:** si no estás en el nivel máximo, te ofrecen ascender a cambio de trabajar los
   fines de semana.
   - **Aceptar:** ascenso, y mientras sigas en ese trabajo, +4 de estrés al año (`job.weekends`).
   - **Rechazar:** −3 con el jefe.
10. **`trabajo_error`:** cometiste un error grave.
    - **Confesar:** −10 de rendimiento. La relación con el jefe sube 5 con Buenazo o Ausente y baja 5 con el resto.
    - **Culpar a un compañero:** −6 de karma.
      - Con 60 % sale bien y ese compañero pasa a enemigo.
      - Con 40 % te descubren: −20 de rendimiento y −15 con el jefe.
    - **Esconderlo:** mitad y mitad: no pasa nada, o al año siguiente sale a la luz y pierdes 25 de rendimiento.
11. **`trabajo_jefe_nuevo`** (automático, aviso): cambia el jefe (§2).
12. **`trabajo_aliado`** (automático): faltaste un día y tu aliado te cubrió: +6 de rendimiento y +5 de relación
    con el aliado.

## 7. Interfaz

- **Hoja de Ocupación**, en la caja del trabajo actual:
  - "👔 Tu jefe/jefa: Nombre · ícono y carácter", con la barra de relación. Tocarlo abre su ficha (`UI.showPerson`).
  - "Compañeros": cada uno con su rol (🤝 aliado, ⚔️ rival, 🗣️ chismoso), también con su ficha.
  - Abajo, la lista "💼 Encargos freelance".
- La oferta y el pedido de aumento son decisiones normales: tarjeta con opciones y subtítulos que dicen qué se
  arriesga.
- En Relaciones, el jefe aparece en su propio grupo, "Jefe", después de Compañeros.

## 8. Partidas guardadas

- `MV.VERSION` pasa a 8.
- Migración v7 → v8: si la partida tiene un trabajo de tiempo completo sin `boss`, se crean jefe y 2 compañeros
  (§2 y §3).
- Las partidas sin trabajo, o con otro tipo de trabajo, no cambian.

## 9. Pruebas

- **Lógica (Node):**
  - Al contratar se crean jefe y 2 compañeros con roles distintos.
  - La relación con el jefe y su carácter mueven las chances de ascenso, aumento y despido, en la dirección de
    las tablas.
  - Las tres opciones de la oferta y del aumento hacen lo que dicen, con semillas fijas.
  - El bono no se paga en crisis.
  - Dejar el trabajo limpia jefe y compañeros como dice el §3.
  - Los 15 empleos cumplen la forma de los datos existentes.
  - El freelance paga según la habilidad, respeta su límite y avisa si falta habilidad.
  - Cada uno de los 12 eventos se puede disparar, sus textos no tienen "undefined", "NaN" ni llaves, y sus efectos
    principales ocurren.
  - El traslado cambia de país y de ciudad.
  - La migración v7 → v8.
  - El jugador automático (`tests/agent.js`) sigue terminando vidas sin errores.
- **Humo con navegador:**
  - Buscar empleo → entrevista → oferta → aceptar deja trabajo con jefe.
  - La hoja de Ocupación muestra jefe, compañeros y freelance.
  - "Pedir un aumento" abre la decisión.
- **Suite completa:** `node --test tests/*.test.js` y `node tests/ui-smoke.js`.

## 10. Fuera de alcance

- Jefes para trabajos de fama, deportes, mafia o empresas propias.
- Una ficha de la empresa empleadora.
- Sindicatos permanentes.
- Todo lo de dinero: inmuebles, seguros, jubilación y dinero sucio van en la C2.
