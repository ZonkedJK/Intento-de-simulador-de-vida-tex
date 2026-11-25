# A1 — Personas con memoria, rencores y acosadores — diseño

**Fecha:** 2026-11-23

**Origen:** primera parte de la opción A ("otras mejoras"), elegida para darle profundidad al juego antes de
publicarlo en la tienda de Android. Orden acordado: A1 memoria → A2 vida escolar → A3 fechas del año → A4 logros y
pendientes → A5 contenido para adultos → publicación.

## Para qué

- **Qué es:** las personas de tu vida recuerdan lo que les hiciste, y años después eso vuelve. Un favor se devuelve,
  una ofensa se cobra, y a veces la vida da vueltas: el amigo al que le prestaste plata hoy tiene una empresa.
- **Por qué:** hoy las relaciones son un solo número que sube y baja. Nada de lo que haces con alguien tiene
  consecuencias más allá del momento. Con memoria, cada vida cuenta una historia propia, y eso es lo que hace volver a
  un jugador de la tienda.
- **Éxito:** en una vida larga, el jugador ve volver varias cosas que hizo años antes, nombradas con su detalle ("hace
  15 años le prestaste $5.000"), y las reconoce.

**Respuestas del usuario:**
- **Qué hacen los recuerdos:** vuelven años después, los favores se devuelven y los rencores se cobran.
- **No se muestran** en la ficha de la persona: se descubren cuando vuelven.
- **Quiénes recuerdan:** todas las personas (familia, parejas, ex, amigos, compañeros, jefes, enemigos). Las mascotas
  no.
- **Enfoque elegido:** cada persona guarda sus recuerdos (el 1 de la sección "Enfoques").
- **Acosadora o acosador:** entra en esta parte, como alguien que no te olvida.

## Metas, límites y lo que no es

**Metas:**
- Lo que vuelve nombra el hecho, quién y hace cuánto.
- Lo que vuelve encaja con tu vida de hoy: un favor de plata llega cuando te falta plata, una venganza contra tu
  ascenso solo si tienes trabajo.
- Las partes siguientes (escuela, fechas, contenido para adultos) solo tienen que dejar recuerdos para sumarse.

**No es parte de esto:**
- Mostrar los recuerdos en la ficha.
- Que los recuerdos pasen al heredero.
- Recuerdos de las mascotas, incluido el gato que habla.
- Volver a traer a alguien que sacaste de tu vida.
- Cambios en la versión de las partidas guardadas.

**Lo que lo haría fallar aunque funcione:**
- Que vuelva demasiado seguido y tape el resto del juego, o que castigue tan fuerte que jugar mal una vez arruine la
  vida.
- Que un texto nombre algo que no pasó, a una persona muerta o un dato equivocado.
- Que la acosadora sea gratuitamente cruel: hay tensión y humor negro, pero nada de violencia sexual, nada contra
  niños y nunca te mata.

**Límites del proyecto:**
- Personas y negocios inventados.
- Humor negro sin contenido explícito.
- Textos en español con concordancia de género del jugador y de cada persona.
- Ningún texto muestra "undefined", "null", "NaN" ni claves sin reemplazar.
- Ninguna opción deja el dinero en negativo: las que cuestan solo aparecen si alcanza.

## Enfoques

1. **Cada persona guarda sus recuerdos (elegido).** Cada relación lleva una lista corta de recuerdos con qué pasó,
   cuándo y cuánto pesó. Cada año, con poca chance, uno viejo vuelve como decisión.
   - A favor: los textos nombran el hecho concreto; si después se reconciliaron, la venganza se ablanda; las partes
     siguientes se suman dejando recuerdos.
   - En contra: unas 25 decisiones nuevas.
2. **Consecuencias agendadas en el momento.** Cada acción agenda su consecuencia para dentro de unos años.
   - A favor: lo más simple; el juego ya tiene ese mecanismo.
   - En contra: rígido; no tiene en cuenta reconciliaciones y cinco insultos dan cinco venganzas.
3. **Una cuenta de favores por persona.** Un solo número por relación que dispara algo al pasar un límite.
   - A favor: simple.
   - En contra: no sabe qué pasó ni cuándo, así que no puede nombrarlo.

El usuario eligió el 1 porque es el único que permite decir exactamente qué pasó y cuándo.

## 1. Qué se recuerda

Cada relación con una persona (no mascota) guarda `mem`: una lista de recuerdos, cada uno con:
- `k`: el tipo de recuerdo (tabla de abajo);
- `a`: tu edad cuando pasó;
- `v`: el peso, positivo si fue bueno y negativo si fue malo (de 1 a 3 en valor absoluto);
- `d`: un dato concreto cuando lo hay, por ejemplo el monto prestado o el regalo;
- `done`: si ya volvió.

**Un recuerdo por tipo y persona** (decisión mía). Repetir lo mismo con la misma persona no crea otro recuerdo:
refuerza el que ya está, mientras no haya vuelto todavía.
- El peso sube 1, hasta 3 en valor absoluto.
- El dato se suma cuando es un monto (dos préstamos de $1.000 son "$2.000"); si no, queda el último.
- `a` pasa a ser la edad de la última vez.

Así, cinco insultos dan un solo rencor más fuerte, y repetir una acción gratis todos los años no acumula favores. Si el
recuerdo ya volvió, la vez siguiente empieza uno nuevo.

**Hasta 6 recuerdos por persona.** Al guardar el séptimo se descarta el de menor peso; a igual peso, el más viejo.
Los que ya volvieron se descartan antes que cualquier otro.

**Tipos y de dónde salen:**

| `k` | Bueno o malo | Peso | Lo deja | Dato |
|---|---|---|---|---|
| `prestamo` | bueno | 2 | "Prestarle dinero", y "Prestar" en el evento del amigo que pide plata | monto |
| `dinero` | bueno | 1 si es menos de $1.000, 2 si es $1.000 o más, 3 si es $20.000 o más | "Darle dinero" | monto |
| `regalo` | bueno | 1, o 2 si cuesta $500 o más | "Hacer un regalo" | nombre del regalo |
| `apoyo` | bueno | 1 | "Escuchar" (pedirle un consejo no cuenta: ahí la ayuda la recibes tú) | — |
| `inversion` | bueno | 2 | invertir en la idea de un amigo | monto |
| `discurso` | bueno | 1 | un buen discurso en la boda de un amigo | — |
| `insulto` | malo | 1 | "Insultar" | lo que le dijiste, si el texto lo tiene |
| `golpe` | malo | 3 | "Atacar" | — |
| `espiar` | malo | 2 | te descubre revisando su celular; o te descubre espiándolo con tu gato | — |
| `broma` | malo | 1 | una broma que salió mal | — |
| `infidelidad` | malo | 3 | tu pareja descubre tu infidelidad (el recuerdo es de tu pareja) | nombre del amante |
| `ruptura` | malo | 2 | terminas con tu pareja (el recuerdo es de tu ex) | — |
| `divorcio` | malo | 3 | pides tú el divorcio (el recuerdo es de tu ex); si lo pide tu ex, no deja recuerdo | — |
| `humillacion` | malo | 2 | en el trabajo: culpas a un compañero por un error, o reclamas ante el jefe que el rival te robó la idea y el jefe te da la razón | — |

Quien construye puede sumar otras fuentes donde una acción o un evento claramente ayuda o daña a una persona
concreta, con el mismo formato.

## 2. Cómo vuelven

Al cerrar cada año (con el jugador vivo, sin la partida terminada y con 8 años o más):

- **Recuerdos que pueden volver:** de personas vivas que siguen en tus relaciones, no mascotas, con `done` falso y de
  hace 3 años o más.
- **Chance:** si hay alguno, 20 % de que uno vuelva ese año. Como mucho uno por año.
- **Una persona por vez** (decisión mía): cuando le vuelve un recuerdo a alguien, sus otros recuerdos esperan 5 años
  antes de poder volver.
- **Cuál:** se sortea con peso según su `v` en valor absoluto y los años que pasaron (los más pesados y los más
  viejos salen antes).
- **Al volver** se marca `done` y se encola una decisión según la tabla de abajo.
- **Desde la cárcel:** solo pueden volver favores (la persona te visita o te paga un abogado), no venganzas.

**Qué decisión sale:**

| Recuerdo | Relación hoy | Decisión |
|---|---|---|
| bueno | cualquiera | un **favor** según tu situación; con 30 % de chance, o si ningún favor encaja, una **vuelta de la vida** |
| malo | 70 o más | **"Ya te perdoné"**: la persona lo saca a relucir y te lo perdona |
| malo | menos de 70 | una **venganza** según tu situación |

Cada decisión nombra a la persona, el hecho y hace cuántos años fue ("Hace 15 años le prestaste $5.000 a Ana").

### Favores

Se elige el primero que encaje con tu situación de hoy:

| Situación | Favor | Efecto aproximado |
|---|---|---|
| estás preso | te paga un buen abogado | la condena baja 1 año (nunca menos de 1) |
| dinero negativo o deudas que no puedes pagar | te presta o te regala plata | entre $2.000 y $50.000, según el recuerdo |
| sin trabajo, entre 18 y 64 años, sin estudiar ni jubilado | te consigue una entrevista | una oferta de trabajo para la que cumples requisitos |
| salud menor que 40 o una enfermedad grave | te cuida | más salud y felicidad |
| tienes pareja con relación menor que 40 | los ayuda a reconciliarse | sube la relación con tu pareja |
| ninguna de las anteriores | te invita a un viaje o te hace un regalo | más felicidad |

Cada favor ofrece aceptarlo y, cuando tiene sentido, rechazarlo con orgullo. Aceptarlo no deja un recuerdo nuevo
(decisión mía): los recuerdos son siempre de lo que tú le hiciste a la otra persona.

### Vueltas de la vida

Unas 5 situaciones que nombran el recuerdo y dan un giro, cada una con su condición. Por ejemplo:
- el amigo al que le prestaste o en cuya idea invertiste hoy tiene una empresa y te ofrece un puesto o una parte;
- alguien a quien apoyaste hoy es médico y te atiende gratis;
- el amigo de la boda donde diste el discurso te pide que seas padrino o madrina de su hijo.

### "Ya te perdoné"

Un evento corto: la persona recuerda lo que hiciste y te dice que ya lo superó. Puedes agradecer (sube la relación) o
hacerte el distraído.

### Venganzas

Se elige al azar entre las que encajen con tu situación:

| Condición | Venganza | Daño aproximado |
|---|---|---|
| tienes pareja | intenta separarte de tu pareja | baja la relación con tu pareja |
| tienes trabajo | le habla mal de ti a tu jefe | baja tu rendimiento o la relación con tu jefe |
| tienes auto | te raya el auto | baja la condición del auto |
| tienes 20 o más de fama | publica algo vergonzoso sobre ti | baja tu fama y tu felicidad |
| tienes una casa | le arruina tu fiesta a tus invitados | baja tu felicidad |
| siempre | inventa chismes en el barrio | baja tu felicidad |

En cada venganza puedes:
- **disculparte:** a veces lo acepta; la relación sube y la venganza no hace daño;
- **devolver el golpe:** la persona te guarda un recuerdo malo nuevo. Si no es de tu familia ni tu pareja, pasa a ser
  tu enemiga; si lo es, solo baja mucho la relación (decisión mía: así no se rompen la herencia ni la familia);
- **ignorarlo:** recibes el daño.

**Límites de las venganzas:** nunca matan, nunca te mandan preso, nunca te quitan más del 10 % de tu dinero y nunca
tocan a tus hijos.

## 3. La acosadora o el acosador

**Quién puede serlo**, con estas chances:
- alguien con quien pasaste una noche y elegiste "Solo fue una noche": 6 %;
- tu pareja cuando la dejas tú (ruptura o divorcio): 8 %;
- un fan, cuando en el evento del fan número uno le respondes y sale mal (acampa en tu puerta): 30 %.

Como mucho un acosador activo a la vez y dos por vida. Puede ser mujer u hombre.

**Qué cambia:** la persona pasa a tu lista de relaciones como "Acosador" o "Acosadora", en un grupo propio en
Relaciones.

**Cómo escala.** Cada año, mientras esté activo, hay 60 % de chance de una decisión de su etapa. Si la ignoras, sube
de etapa; si pruebas algo y no funciona, queda en la misma etapa (decisión mía). En la etapa 3, ignorarla la deja ahí y
vuelve a hacer daño cada año:
1. **Mensajes:** te escribe sin parar. Más estrés.
2. **Aparece:** en tu trabajo o en tu casa. Más estrés y menos felicidad.
3. **Tu pareja:** se mete con tu pareja. Baja esa relación.

**Qué puedes hacer** (en todas las etapas, con distinta eficacia):

| Opción | Costo | Funciona |
|---|---|---|
| hablar con la persona | — | 25 % |
| bloquearla | — | 50 % en la etapa 1; después no sirve |
| ir a la policía | — | 40 % |
| pedir una orden de alejamiento | $5.000 de abogado | siempre termina: 80 % sin más; 20 % la viola una vez, te da un susto (más estrés) y la arrestan |
| mudarte | $2.000 | 70 % |
| ignorarla | — | no termina y sube de etapa |

Cuando funciona, la persona sale de tu vida con un cierre en el diario y no vuelve a acosarte.

**Su ficha** (decisión mía): en lugar de las acciones de siempre (conversar, regalos, insultar, "Sacar de tu vida"),
muestra solo estas respuestas, para que puedas actuar sin esperar a que aparezca. Comparten un único uso por año con
la decisión anual: si ya respondiste ese año, la decisión de ese año no sale.

## 4. Partidas y heredero

- Todos los datos nuevos son opcionales. Una partida vieja empieza sin recuerdos y sin acosadores. No cambia la
  versión.
- El heredero empieza sin recuerdos: las personas recuerdan al jugador anterior, no a su hijo.
- Una persona que sale de tu vida (por "Sacar de tu vida", porque muere o porque el juego la limpia) se lleva sus
  recuerdos.

## 5. Pruebas

- **Recuerdos:** cada fuente deja su recuerdo con tipo, edad, peso y dato; nunca más de 6; el orden de descarte.
- **Vuelta:** nada vuelve antes de 3 años; la chance anual ronda el 20 %; nunca más de uno por año; cada recuerdo vuelve
  una sola vez; los de personas muertas o fuera de tu vida no vuelven.
- **Decisión correcta:** recuerdo bueno → favor que encaja con la situación o vuelta de la vida; malo con relación 70 o
  más → "Ya te perdoné"; malo con menos → venganza que encaja; en la cárcel, solo favores.
- **Textos:** cada decisión nombra a la persona, el hecho y los años, con ambos géneros y sin marcas prohibidas.
- **Límites:** ninguna venganza mata, encarcela, quita más del 10 % del dinero ni deja el dinero en negativo.
- **Acosador:** las tres formas de empezar con sus chances; uno a la vez y dos por vida; las etapas; cada opción con
  su eficacia y su costo; el cierre.
- **Heredero:** empieza sin recuerdos.
- **Jugador automático:** muchas vidas sin errores, y en alguna vuelve un recuerdo y aparece un acosador.
- **Interfaz** (prueba de humo): el acosador aparece en su grupo en Relaciones.

## 6. Lo que queda a criterio de quien lo construye

- Las cifras exactas de cada favor, venganza y vuelta de la vida, dentro de los rangos y límites de arriba.
- Casos raros como un favor que viene de tu propia pareja, o una venganza de alguien que vive contigo.
- La redacción de cada texto.
- Las condiciones exactas de las vueltas de la vida y cuáles son, mientras haya unas 5.
- La organización del código. Se propone seguir el patrón del juego: datos en `js/data/memory.js`, lógica en
  `js/systems/memory.js` y decisiones en `js/data/events/memoria.js`.
- El README suma una línea sobre la memoria de las personas y los acosadores.
