# A2 — Vida escolar — diseño

**Fecha:** 2026-11-25

**Origen:** segunda parte de la opción A, para darle profundidad al juego antes de publicarlo en la tienda de Android.
Orden acordado: A1 memoria (hecha) → A2 vida escolar → A3 fechas del año → A4 logros y pendientes → A5 contenido para
adultos → publicación.

## Para qué

- **Qué es:**
  - En primaria y secundaria tienes un curso con nombre y apellido: un profesor o una profesora tutor y compañeros,
    cada uno con su papel.
  - Una barra de popularidad decide a qué te invitan y quién te molesta.
  - El promedio con el que egresas pesa en la universidad.
- **Por qué:** hoy la escuela es una barra de promedio y unas acciones sueltas. Nadie tiene nombre y nada de lo que
  pasa ahí importa después. Los años de escuela son una buena parte de cada vida, y con gente propia cuentan una
  historia.
- **Éxito:**
  - Al terminar la secundaria, el jugador puede nombrar a su mejor amigo, a su rival y al abusón del curso.
  - Sabe si fue popular.
  - Ve que su promedio le abrió o le cerró la universidad que quería.

**Respuestas del usuario:**
- **Lo que quiere:** compañeros con nombre, popularidad y notas que importen después.
- **Popularidad:** una barra de 0 a 100.
- **Dónde pesan las notas:** en la universidad y en las becas. No pesan en el primer trabajo, no hay boletín con
  reacción de los padres y no hay materias separadas.
- **Abusón:** el jugador también puede serlo, con consecuencias.
- **Enfoque elegido:** un sistema escolar propio con el mismo molde que el lugar de trabajo (el A de "Enfoques").
- **Compañeros:** el usuario aprobó la propuesta de 4 compañeros con papel (mejor amigo o amiga, rival, abusón o
  abusona no siempre, y desde los 14 alguien que te gusta), un tutor con carácter y el grupo propio en Relaciones.

## Metas, límites y lo que no es

**Metas:**
- Cada curso tiene gente con nombre que crece contigo y aparece en tu vida: eventos, acciones y Relaciones.
- La popularidad se mueve por lo que haces y cambia lo que te pasa.
- El promedio de egreso de la secundaria cambia tu examen de ingreso a la universidad pública y tu acceso a una beca.
- Ser abusón da popularidad rápida y se paga: karma, suspensiones y, por la A1, rencores que vuelven de adulto.

**Límites (tienda de Android):**
- Todos los compañeros son menores de edad. Nada sexual, nunca.
- El romance escolar sigue las reglas que ya existen: 14 años o más y como mucho 2 años de diferencia, siempre entre
  menores.
- El bullying es burla, exclusión, bromas pesadas, quitar la merienda y rumores. Nada de golpes descritos con detalle,
  heridas, armas ni autolesiones.
- Nada de fotos íntimas ni nada parecido. Una "foto vergonzosa" es algo como dormirte con la boca abierta en clase.

**No es:**
- No hay compañeros en la universidad, la técnica, el posgrado ni la escuela nocturna para adultos. El curso es solo de
  primaria y secundaria comunes.
- No hay notas por materia, ni boletín anual con premio o castigo de los padres.
- Las notas no pesan en el primer trabajo.
- No hay cambio de escuela a mitad de etapa por mudanza.
- No hay reencuentro de egresados. Eso le toca a la A3; esta parte solo guarda los datos que A3 necesitará.

**Lo que haría que esto fracase aunque funcione:**
- Que molestar a otros salga gratis, o que sea la mejor estrategia para tener popularidad.
- Que la escuela se vuelva una lluvia de ventanas: los eventos nuevos compiten en el mismo sorteo anual, no se suman
  aparte.
- Que un texto nombre a un compañero que ya no está, o diga algo falso, como que eres popular con la barra en 20.

## Enfoques

- **A. Un sistema escolar propio, con el mismo molde que el lugar de trabajo (elegido).**
  - Archivos nuevos para los datos, el sistema y los eventos de la escuela.
  - El curso se arma al empezar primaria y otra vez en secundaria.
  - A la educación de hoy solo se le tocan el examen, la beca y el promedio guardado.
  - Elegido porque suma sin tocar lo que ya funciona y se prueba por separado.
- **B. Meterlo todo en la educación de hoy (`js/systems/edu.js`).** Son menos archivos, pero ese archivo ya mezcla
  escuela, universidad y clubes, y cuesta más de probar.
- **C. Un motor común de "lugar con gente" para el trabajo y la escuela.** No repite código, pero obliga a rehacer el
  lugar de trabajo de la parte C1, que ya funciona y tiene sus pruebas.

## Cómo funciona hoy (lo que hay que respetar)

**Escuela:**
- `js/systems/edu.js`:
  - Primaria empieza a los 6 y dura 6 años. Secundaria la sigue y dura 6 años.
  - `p.edu.perf` (0–100) es el rendimiento. `MV.grade(perf)` lo muestra de 1 a 10: 1 + perf × 0,09.
  - Si el rendimiento es muy bajo, repites el año.
- Acciones de estudiante (`edu.actions`): estudiar, faltar, hablar con el profesor, hacer trampa, clubes, hacer amigos,
  enfrentar al abusón (con la bandera `p.flags.abuson`) y abandonar desde los 16.
- `edu.yearly` no corre si estás en prisión o en el centro de menores.
- Al terminar la secundaria sale la decisión `fin_secundaria`, con el promedio solo en el texto.

**Universidad:**
- Examen de la universidad pública: `smarts + U.int(-15, 15) + estudiar × 3 >= exigencia de la carrera`.
- La beca de hoy pide inteligencia 70 o más y sale con chance `(smarts − 60) / 45`.

**Lugar de trabajo:**
- El molde es `js/systems/workplace.js` y `js/data/work.js`. Un jefe con carácter (`MV.BOSS_KINDS`) y compañeros con
  papel (`MV.MATE_ROLES`) se crean con `MV.newNPC` y `MV.addRel`.
- Al irte, el jefe y los compañeros queridos quedan como amigos y el resto sale de tu vida.

**Romance y memoria:**
- `rels.canRomance` pone las reglas de edad del romance.
- `MV.sys.memory.remember` guarda recuerdos de la A1. Los tipos `humillacion` y `broma` ya existen.

**Eventos de escuela:**
- Ya hay unos 14 eventos sueltos, entre ellos `abuson`, `examen_final`, `olimpiada` y `viaje_egresados`.
- El evento `abuson` usa un abusón sin nombre.

## Diseño

### 1. El curso

**Cuándo existe:**
- Mientras cursas primaria o secundaria comunes (no la escuela nocturna para adultos) y no estás preso.
- Se arma al empezar la etapa. En partidas viejas, o si falta alguien, se arma o se completa en el año escolar
  siguiente.

**El tutor:**
- Una persona adulta nueva, de 25 a 60 años, con relación de tipo nuevo `profe` ("Profesor" o "Profesora").
- Tiene un carácter de una tabla nueva, `MV.TEACHER_KINDS`. Cada carácter tiene un efecto chico en números:

  | Carácter | Efecto |
  |---|---|
  | exigente | rendimiento −3 al año; cada "Estudiar más" suma +2 extra |
  | buena onda | rendimiento +3 al año |
  | distraído o distraída | hacer trampa sale bien un 15 % más seguido |
  | estricto o estricta | hacer trampa sale bien un 15 % menos; te pillan molestando un 15 % más; estrés +2 al año |
  | cansado o cansada | sin efecto en notas; sus textos son de humor |

- "Hablar con el profesor" pasa a ser con el tutor: su relación sube o baja con el resultado, y los textos lo nombran.

**Los compañeros**, con relación de tipo nuevo `curso` ("Compañero de curso" o "Compañera de curso"):

| Papel | Quién | Relación inicial |
|---|---|---|
| mejor amigo o amiga | siempre | 65 a 80 |
| rival | siempre | 35 a 50 |
| abusón o abusona | 60 % de los cursos | 20 a 35 |
| payaso o payasa del curso | cuando no hay abusón | 50 a 65 |
| alguien que te gusta | desde los 14, si hay alguien con quien `canRomance` lo permite | 45 a 60 |

- Todos tienen tu edad o un año de diferencia.
- La persona que te gusta se suma al cumplir 14 años o al empezar un curso con 14 o más. Su género sigue tu atracción.
- En Relaciones forman dos grupos nuevos: "Compañeros de curso" y "Profesores". Cada persona muestra su papel ("tu
  rival", "te gusta").
- Si una de esas relaciones pasa a otro tipo, deja el curso y conserva su nuevo tipo: si te pones de novio con quien te
  gusta, o si el rival se vuelve tu enemigo.

**Cuando termina el curso** (al egresar de primaria o secundaria, al abandonar o al repetir y cambiar de grupo):
- Los compañeros con relación 60 o más quedan como amigos y el resto sale de tu vida.
- El tutor con relación 80 o más queda como amigo y el resto sale.
- Repetir el año arma un curso nuevo. Los amigos de verdad quedan como amigos por la regla de arriba.

### 2. Popularidad

- `p.edu.pop`, de 0 a 100. Se ve con una barra en la ficha de Estudios.
- **Al armar cada curso:** `clamp(30 + looks × 0,2 + carisma × 0,3, 15, 75)`.
- **Cada año escolar:**
  - +2 por cada club o equipo en el que estés;
  - −4 si faltaste a clases 2 veces o más ese año;
  - y se acerca un 10 % a 50.

**Lo que la mueve en el año:**

| Qué | Cambio |
|---|---|
| hacer un amigo nuevo (sale bien) | +3 |
| plantarle cara al abusón y ganar | +10 |
| plantarle cara al abusón y perder | −5 |
| que te pillen haciendo trampa | −4 |
| acusar a alguien con el profesor | −6 |
| molestar a un compañero | +4 (+2 si te pillan) |
| ir a una fiesta o cumpleaños | +3 |
| ganar la elección de delegado | +5 |
| foto vergonzosa (evento) | −8 |

**Qué hace:**
- **70 o más:**
  - te invitan a cumpleaños y fiestas (eventos);
  - puedes presentarte a delegado o delegada;
  - coquetear con quien te gusta tiene un 10 % más de chance.
- **30 o menos:**
  - los eventos del abusón salen tres veces más seguido;
  - "Hacer amigos" tiene un 10 % menos de chance.
- **Ningún texto dice que eres popular** si la barra está por debajo de 70, ni que nadie te quiere si está por encima
  de 30.
- **Al egresar de la secundaria** se guarda la última popularidad en `p.edu.popEgreso` para la A3.

### 3. Ser el abusón o la abusona

Hay acciones nuevas de estudiante mientras tienes compañeros, con un uso por año cada una. Eliges a qué compañero:

| Acción | Efecto en ti | Efecto en el compañero |
|---|---|---|
| Burlarte de un compañero | popularidad +4, karma −3 | relación −15, recuerdo `humillacion` |
| Hacerle una broma pesada | popularidad +4, karma −2 | relación −12, recuerdo `broma` |
| Quitarle la merienda (solo primaria) | felicidad +2, karma −2 | relación −10, recuerdo `humillacion` |

**Si te pillan:**
- La chance es 25 %, más el carácter del tutor.
- La popularidad sube solo +2 en vez de +4.
- Te **suspenden**: rendimiento −8, relación con tus padres −6 y `p.edu.susp` +1.
- Con 3 suspensiones en la misma etapa te **expulsan y cambias de escuela**: curso nuevo, popularidad −10 y un texto
  que lo cuenta. No pierdes el año.

**Otros efectos:**
- Molestar a alguien 3 veces o más te marca como abusón del curso (`p.flags.abusador`). Algunos eventos cambian: el
  tutor te cita, un compañero te enfrenta.
- Al mejor amigo o amiga no lo puedes elegir de víctima. Si quieres hacerlo, primero tiene que dejar de ser tu mejor
  amigo.
- Lo que más pesa está en la A1: la víctima guarda el recuerdo y años después, ya de adulto, te lo puede cobrar.

### 4. Notas que importan después

- **Al egresar de cualquier secundaria**, también la nocturna, se guarda `p.edu.gpa`: el rendimiento final (0–100).
- **Examen de la universidad pública:** suma `Math.round((gpa − 55) / 4)`. Con un 9 (gpa 89) da +8 o +9; con un 4
  (gpa 33) da −5 o −6. Sin `gpa` (partidas viejas o sin secundaria registrada) suma 0.
- **Beca por mérito:**
  - Se puede pedir con inteligencia 70 o más, o con promedio de egreso 8,5 o más (gpa ≥ 84).
  - La chance es la mayor entre `(smarts − 60) / 45` y `(gpa − 75) / 30`, con un tope de 95 %.
- **En la pantalla:** el texto de `fin_secundaria` y el de la decisión de cómo pagar la universidad dicen tu promedio y
  si te alcanza para la beca. Tu ficha de estudios muestra el "Promedio de egreso" después de terminar.

### 5. Eventos nuevos de la escuela

- Van en `js/data/events/escuela.js`, con unos 12 eventos con decisiones.
- Entran en el mismo sorteo anual que todos: no hay un sorteo aparte.
- Cada uno nombra a la persona del curso que corresponde y desaparece si esa persona ya no está.
- Los temas, con su condición principal:
  1. **Elección de delegado:** secundaria, popularidad 50 o más. Compites con tu rival y la chance sale de la
     popularidad. Si ganas, popularidad +5 y un logro.
  2. **Cumpleaños o fiesta del curso:** con popularidad 70 o más te invitan. Con 30 o menos, te enteras de que no te
     invitaron.
  3. **Trabajo en grupo:** te toca con el rival o con el mejor amigo. Puedes hacer todo tú, repartir o dejar que lo
     haga otro.
  4. **El rival te desafía:** quién saca mejor nota, o una carrera en el recreo.
  5. **El abusón te elige:** necesita un abusón en el curso. Sale tres veces más con popularidad baja. Opciones:
     contárselo al tutor, plantarle cara, ignorarlo o hacerte su amigo. Reemplaza al uso del evento `abuson` de hoy
     cuando hay curso.
  6. **Ves al abusón molestar a otro:** defenderlo, mirar para otro lado o sumarte. Sumarte cuenta como molestar.
  7. **Quien te gusta te escribe:** 14 o más. Abre "Coquetear" o pone a esa persona como pareja, con las reglas de hoy.
  8. **Pelea con tu mejor amigo o amiga:** pedir perdón, esperar o romper la amistad.
  9. **El tutor ve tu talento:** con un taller o una habilidad alta. Te propone un concurso o una olimpíada.
  10. **Citación a tus padres:** si molestaste a alguien este año o te suspendieron.
  11. **Viste a alguien copiarse:** acusarlo (popularidad −6, karma +1), callarte, o pedirle que te pase las
      respuestas.
  12. **Foto vergonzosa:** desde los 12. Circula una foto tuya dormido o dormida en clase (popularidad −8). Puedes
      reírte de ti (recupera la mitad si tienes carisma), enojarte o ignorarlo.

- **Los eventos sueltos de hoy que nombran a un compañero sin nombre** (`abuson`, `nerd_amigo`, `pelea_patio`) usan a
  la persona del curso cuando hay curso, y siguen como hoy cuando no hay.
- **Todos tienen texto para ambos géneros**, del jugador y de la otra persona.

### 6. Logros nuevos

- **Delegado o delegada del curso:** ganar la elección.
- **Abanderado o abanderada:** egresar de la secundaria con 9,5 o más (gpa ≥ 95).
- **Rey o reina del recreo:** popularidad 90 o más en secundaria.

### 7. Interfaz

En la ficha de Estudios (pestaña Ocupación), mientras haya curso:
- la barra de "Popularidad";
- "Tu tutor" con su carácter;
- "Tu curso", con cada compañero y su papel. Tocar a alguien abre su ficha de relación.

Las acciones de abusón van con las de estudiante. En Relaciones salen los dos grupos nuevos.

### 8. Partidas, heredero y jugador automático

- **`MV.VERSION` sigue en 9.**
  - Todo lo nuevo es opcional: `p.edu.pop`, `p.edu.gpa`, `p.edu.popEgreso`, `p.edu.susp`, `p.edu.class` (tutor y
    compañeros) y `p.flags.abusador`.
  - Una partida vieja a mitad de la escuela arma su curso en el año siguiente sin errores.
- **El heredero:**
  - Empieza con su propio curso si está en edad escolar.
  - No hereda la popularidad, el `gpa` ni las suspensiones del jugador anterior.
- **El jugador automático:**
  - En 30 vidas, alguna vida termina la secundaria con curso y `gpa`, y alguna usa una acción de abusón.
  - Ninguna vida tiene errores.
- **El README** suma la fila de "Vida escolar" y las cantidades reales de eventos y logros.

## Lo que queda al constructor

- Los nombres internos de archivos, funciones y campos, salvo los que este documento nombra.
- Los textos de cada evento y acción, con humor y los límites de arriba.
- Cuántas opciones tiene cada evento (2 a 4) y sus números finos, siempre que respeten las tablas de arriba.
- El orden exacto de las llamadas en el año (`MV.ageUp`).
- Cómo se ven los grupos nuevos en Relaciones, siguiendo el estilo de hoy.
- Si la persona que te gusta sale de los compañeros que ya tienes o es alguien nuevo.
