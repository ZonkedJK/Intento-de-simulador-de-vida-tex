# El gato que habla — diseño

**Fecha:** 2026-11-14

**Origen:** el usuario pidió una mascota que hable. Se descartó usar un personaje de otra obra: el gato es propio del
juego.

## Para qué

- **Qué es:** un compañero con carácter. Tu propio gato un día empieza a hablarte, opina sobre tu vida, te avisa de los
  problemas y te mete en líos.
- **Por qué:** darle al juego un personaje que reacciona a lo que haces, para que una vida con él se sienta distinta de
  una vida sin él.
- **Éxito:** quien lo consigue recibe cada año algo útil (un aviso) y algo gracioso (un comentario o una travesura), y
  recuerda a su gato por su manera de hablar.

**Respuestas del usuario:**
- **Papel:** consejero, cómplice de travesuras y mascota con eventos propios.
- **Cómo llega:** con una meta. Sirve cualquiera de tres: cuidar bien a un gato, rescatar gatos callejeros, o buen
  karma con un gato.
- **Personalidad:** una de tres al azar: filósofo gruñón, diva dramática o aristócrata venido a menos.
- **Funciones:** consejo del año, comentarios en el diario, travesuras juntos y eventos propios.
- **Final:** vive más que un gato común, se despide con un último mensaje y un logro, y no pasa al heredero.
- **Enfoque aprobado:** el 1 de la sección "Enfoques".

## Metas, límites y lo que no es

**Metas:**
- Hay un solo gato que habla por vida, y es uno de tus gatos de siempre.
- Lo que dice depende de tu partida: nombra montos, personas y hechos reales de tu vida.
- Cada personalidad se reconoce al leerla.

**No es parte de esto:**
- Dibujos o sprites nuevos: el gato se ve como cualquier mascota del juego.
- Otras especies que hablen.
- Conversación libre o árboles de diálogo.
- Cambios en la pantalla principal.
- Una versión nueva de partidas guardadas.

**Lo que lo haría fallar aunque funcione:**
- Que se parezca a un personaje de otra obra. No lleva nombres, frases, aspecto ni rasgos tomados de ninguna.
- Que sus consejos sean adorno. Cada consejo dice algo cierto y accionable sobre tu partida.
- Que canse: habla una vez por año en el diario, no en cada acción.

**Límites del proyecto:**
- Personas y negocios inventados.
- Humor negro sin contenido explícito.
- Textos en español con concordancia de género: el del jugador y el del gato (gato o gata).
- Ningún texto muestra "undefined", "null", "NaN" ni claves sin reemplazar.
- Ninguna opción deja el dinero en negativo: las que cuestan solo aparecen si alcanza.

## Enfoques

1. **Tu gato aprende a hablar (elegido).** El mismo gato recibe una marca con su personalidad. Sus acciones van en su
   ficha y sus eventos funcionan como los de las mascotas míticas.
   - A favor: conserva su nombre, su historia y su relación contigo, y sigue el patrón del juego.
   - En contra: muchos textos, porque casi todo va en tres voces.
2. **Una mascota mítica nueva.** Reusa el código de las míticas, pero sería otro personaje: pierde la historia contigo
   y tendrías dos gatos en la lista.
3. **Un narrador en la pantalla principal.** Se ve mucho, pero pide una interfaz nueva y queda desconectado de la
   relación con tu mascota.

El usuario eligió el 1 porque es el único donde el gato que habla es el que tú criaste.

## 1. Cómo llega

Solo hablan los gatos (`species: 'gato'`). El gato elegido recibe `talk = { kind, since, how }`:
- `kind`: `filosofo`, `diva` o `aristocrata`, al azar con la misma chance;
- `since`: tu edad cuando empezó a hablar;
- `how`: `lealtad`, `rescate` o `karma`.

**Uno por vida.** Cuando un gato habla, la partida lo recuerda. Aunque después muera o lo des en adopción, ningún otro
gato habla en esa vida.

**Las tres metas.** Se revisan al cerrar cada año, cuando las relaciones ya se actualizaron. Si se cumple más de una,
gana la primera de esta lista:

1. **Lealtad:** un mismo gato vivo lleva 5 cierres de año seguidos con relación de 80 o más. Si un año cierra por
   debajo de 80, su cuenta vuelve a cero.
2. **Rescate:** adoptaste 3 gatos callejeros en esta vida. Cuentan las tres formas de hoy: la actividad "Recoger un
   gato callejero", el voluntariado en el refugio y el gato que te sigue hasta casa. Cuentan aunque ya no estén
   contigo. Habla el rescatado más reciente que siga vivo y contigo; si no queda ninguno, la meta espera al próximo
   rescate.
3. **Karma:** tienes karma de 60 o más y al menos un gato vivo. Habla el gato con mejor relación.

**Edad mínima:** tu gato no habla antes de que cumplas 6 años.

**Para siempre:** una vez que habla, no deja de hablar ni se va, aunque la relación baje.

**La primera vez:**
- Aparece un aviso con título "Tu gato habló" (o "Tu gata habló") y una presentación según su personalidad, que
  también queda en el diario.
- Se desbloquea el logro **"Me lo dijo el gato"** (🗨️): "Tu gato empezó a hablarte."
- Su vida se alarga: pasa a vivir entre 24 y 30 años en total, y nunca menos de 3 años más desde que habla.
- Deja de correr el riesgo anual de "accidente misterioso" de las mascotas comunes.

**Personalidades** (`MV.CAT_VOICES`), con nombre según el género del gato:

| `kind` | Nombre | Cómo habla |
|---|---|---|
| `filosofo` | filósofo gruñón / filósofa gruñona | Sentencioso y quejoso. Refranes inventados: "gato que madruga, duerme la siesta antes". |
| `diva` | divo dramático / diva dramática | Todo es una telenovela y todo le pasa a él. Exige atención, pero te defiende a muerte. |
| `aristocrata` | aristócrata venido a menos / venida a menos | Se cree noble caído en desgracia: "en mi otra vida fui conde". Desprecia todo, pero es leal. |

## 2. Consejo del año

Acción **"Pedirle consejo"** en la ficha del gato, una vez por año. No cambia ninguna estadística: es información.
También funciona si estás preso: se cuela entre los barrotes.

Revisa esta lista en orden y habla del primer riesgo que encuentre. Cada riesgo tiene una frase por personalidad, y
la frase incluye el dato concreto.

| # | Riesgo | Condición | Dato que nombra |
|---|---|---|---|
| 1 | Preso o prófugo | estás en prisión, o te buscan | años que te faltan, o que te buscan |
| 2 | Salud | salud menor que 35, o tienes una enfermedad que el juego ya trata como grave (las que abren el aviso de diagnóstico) o urgente | la enfermedad, si la hay |
| 3 | Deudas | dinero negativo, o las cuotas de este año de tus préstamos superan tu efectivo | el monto de las cuotas |
| 4 | Dinero sucio | más de $50.000 sucios | el monto |
| 5 | Pareja enojada | tu pareja o cónyuge tiene relación menor que 35 | su nombre |
| 6 | Trabajo | rendimiento menor que 30 | tu puesto |
| 7 | Estrés | estrés mayor que 70 | — |
| 8 | Sin seguro de salud | tienes 50 años o más y no tienes seguro de salud | — |

Si no hay ningún riesgo, dice una frase suelta de su personalidad (al menos 4 por personalidad).

## 3. Comentario en el diario

Al cerrar cada año, el gato deja como mucho un comentario en el diario, con el ícono 🐈 y su nombre delante:
`Michi: "…"`.

Comenta lo más notable que pasó desde el cierre anterior. Si pasaron varias cosas, gana la primera de esta lista:

1. entraste a la cárcel;
2. murió alguien cercano: padre o madre, hijo, nieto, hermano, abuelo, pareja, cónyuge u otra mascota;
3. te casaste;
4. te divorciaste;
5. tuviste un hijo;
6. te despidieron;
7. te ascendieron;
8. tienes una casa más que antes.

- Cada hecho tiene una frase por personalidad.
- Si no pasó nada de la lista, con 25 % de chance suelta una frase de su personalidad; si no, ese año calla.
- El año en que empieza a hablar no comenta: ya habló en su presentación.

## 4. Travesuras

Acción **"Planear algo con tu gato"** (o "con tu gata") en su ficha, una vez por año, desde tus 12 años. No aparece
si estás preso. Se elige una de tres. Ninguna cuenta como delito ni termina en arresto.

| Travesura | Si sale bien | Si sale mal |
|---|---|---|
| **Asaltar la pescadería** | 65 %: +6 de felicidad y +3 de relación con el gato | 35 %: −1 de karma y una multa de $300. Si no alcanza o eres menor, no hay multa y pierdes 3 de felicidad |
| **Desordenarle la casa al vecino** | siempre: +5 de felicidad y −3 de karma | además, 30 %: el vecino pasa a ser tu enemigo (una persona nueva con relación 15) |
| **Espiar a alguien** | 50 %: descubres algo bueno, +8 de relación con esa persona | 30 %: descubres algo feo, −8 de relación. 20 %: te descubren, −12 de relación y −2 de felicidad |

- **Espiar** pide elegir a una persona viva de tus relaciones (no mascotas). Si no tienes ninguna, esa travesura no se
  ofrece.
- Cada resultado tiene su texto, y el gato participa en él.

## 5. Eventos propios

Siete decisiones en `js/data/events/gato.js`. Todas piden que tu gato que habla esté vivo y contigo, y lo llevan como
protagonista. No aparecen en prisión. El texto de cada evento tiene una versión por personalidad; los resultados de
las opciones son comunes.

| Evento | Cuándo | Opciones y efectos |
|---|---|---|
| **Celos** (`gato_celos`): tu gato no soporta a tu pareja | tienes pareja o cónyuge | **Darle la razón:** pareja −6, gato +6. **Defender a tu pareja:** gato −6, pareja +5. **Sobornarlo con atún ($40):** gato +3 |
| **El regalo** (`gato_regalo`): te trae algo raro | siempre | **Quedártelo:** 50 % vale algo (+$50 a $500); 30 % era del vecino (−2 de karma); 20 % estaba vivo (−3 de felicidad). **Devolverlo:** +3 de karma, gato −3. **Agradecer y tirarlo a escondidas:** gato +4 |
| **Desaparece** (`gato_desaparece`): hace días que no vuelve | siempre | **Buscarlo por el barrio:** +5 de estrés, gato +8. **Pegar carteles ($60):** gato +4. **Esperar:** 70 % vuelve ofendido (gato −4); 30 % vuelve con una historia (+4 de felicidad). Siempre vuelve |
| **El amigo** (`gato_amigo`): conoció a otro gato del barrio, que no habla | siempre | **Invitarlo a comer ($80):** gato +5. **Adoptarlo también:** llega un gato callejero común con relación 60; cuenta como rescate. **Decirle que no:** gato −5 |
| **Famoso** (`gato_famoso`): quiere una cuenta en redes | tienes 13 años o más | **Abrirle una cuenta:** +200 a 5.000 seguidores; nadie cree que habla. **"La fama corrompe":** gato −3, +2 de karma. **Cobrar por las fotos:** +$100 a $1.500, gato −4 |
| **Las 3 de la mañana** (`gato_madrugada`): se pone filosófico | siempre | **Escucharlo hasta el amanecer:** +2 de inteligencia, +4 de estrés, gato +6. **Taparte con la almohada:** gato −3, −3 de estrés. **Discutirle:** 50 % ganas (+3 de inteligencia); 50 % te gana (−2 de felicidad); gato +2 |
| **El veterinario** (`gato_veterinario`): se niega a ir | siempre | **Llevarlo igual ($250):** su salud +15, gato −5. **Negociar ($250):** según tu carisma, acepta (salud +15, gato +2) o te araña (−2 de salud, sin costo). **Dejarlo por este año:** gato +3, su salud −5 |

"gato +N" es la relación con tu gato; "pareja +N", la relación con tu pareja. Las opciones con precio solo aparecen si
te alcanza el dinero.

## 6. Su final

- **Muere:** en lugar del aviso común de las mascotas aparece "Últimas palabras", con su despedida según la
  personalidad. La pérdida de felicidad es la de cualquier mascota. Se desbloquea el logro **"Últimas palabras"**
  (🕯️): "Tu gato que habla se despidió de ti."
- **Lo das en adopción:** se puede, como con cualquier mascota. La confirmación avisa que no volverá a hablarte nadie,
  y se va con una frase de su personalidad. No hay logro.
- **Mueres tú primero:** no pasa al heredero. Si el heredero iba a recibir tus mascotas, recibe las demás, y su diario
  dice que el gato se fue el día del funeral.

## 7. Interfaz

- **Ficha del gato:** una etiqueta con id `pet-talk`: "🗨️ Habla · filósofo gruñón" (con el nombre de la personalidad
  según su género). Debajo, en sus acciones, "Pedirle consejo" y "Planear algo con tu gato".
- **Lista de Relaciones:** su línea agrega "habla".
- **Resto:** sin cambios.

## 8. Partidas guardadas

No cambia la versión. Todos los datos nuevos son opcionales y el código funciona si faltan. En una partida vieja, la
cuenta de lealtad empieza en cero y la de rescates empieza contando los gatos callejeros que ya adoptaste y siguen en
tus relaciones.

## 9. Pruebas

- **Llegada:**
  - cada meta por separado hace hablar a un gato, con `how` correcto;
  - con dos metas cumplidas el mismo año gana la primera de la lista;
  - la lealtad vuelve a cero si un año cierra por debajo de 80;
  - antes de tus 6 años no habla;
  - después del primero, ningún otro gato habla, ni tras su muerte ni tras darlo en adopción;
  - en muchas semillas salen las tres personalidades;
  - su vida queda entre 24 y 30 años, o 3 más si ya era viejo, y no muere por accidente.
- **Consejo:** cada riesgo aislado produce su frase con el dato concreto; con dos riesgos gana el de menor número; sin
  riesgos sale una frase suelta; funciona en prisión; una vez por año.
- **Comentario:** cada hecho de la lista produce su comentario; con dos hechos gana el primero; como mucho uno por
  año; ninguno el año en que empieza a hablar.
- **Travesuras:** los efectos de cada resultado; la multa nunca deja el dinero en negativo; espiar no se ofrece sin
  personas; no aparece en prisión ni antes de los 12; una vez por año.
- **Eventos:** cada opción de los 7 hace lo que dice; las opciones con precio no aparecen sin dinero; el evento no
  aparece sin gato que habla.
- **Final:** la despedida y su logro al morir; la adopción; el heredero no lo recibe y su diario lo dice.
- **Textos:** todas las frases de las tres personalidades, con jugador y gato de ambos géneros, sin marcas prohibidas.
- **Interfaz** (prueba de humo): la etiqueta `#pet-talk`, las dos acciones en la ficha y "habla" en Relaciones.
- **Jugador automático:** en 30 vidas, sin errores, y en alguna aparece el gato que habla y alguno de sus eventos.

## 10. Lo que queda a criterio de quien lo construye

- La redacción de cada frase, dentro del tono de cada personalidad y de los límites del proyecto.
- Cómo se guarda lo necesario para comparar un año con el anterior y para contar la lealtad y los rescates.
- El peso y la frecuencia de los 7 eventos, para que con un gato que habla aparezca alguno cada pocos años.
- La organización del código. Se propone seguir el patrón del juego: datos y voces en `js/data/talkcat.js`, la lógica
  en `js/systems/talkcat.js` y los eventos en `js/data/events/gato.js`.
- El README suma una línea sobre el gato que habla.
