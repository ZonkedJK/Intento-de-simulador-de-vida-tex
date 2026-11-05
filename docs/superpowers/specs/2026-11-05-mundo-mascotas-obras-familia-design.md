# Mundo, mascotas, obras, familia, resumen y desafíos — diseño

**Fecha:** 2026-11-05
**Origen:** el usuario pidió seguir agregando mejoras por mi cuenta mientras está en pabellón
("¿podrías continuar tú? Añadiendo mejoras y otras cositas"). Las decisiones de este documento
las tomé yo con esa autorización; el usuario las revisa en el pull request y puede pedir cambios.
Se toman de la lista "¿Qué más podríamos añadir?" del cierre anterior, más los detalles menores
que quedaron pendientes en la revisión final.

## Objetivo

Más contenido y más vida en cada partida, sin cambiar el estilo (texto, emojis, SVG, humor negro
sin contenido explícito) ni la arquitectura (scripts clásicos bajo `MV`, motor sin DOM probado en
Node, sin compilación).

## 0. Pendientes menores de la revisión anterior

1. El láser exige tener $1.500; si no alcanza, no se cobra ni se borra.
2. Toda ruptura directa (`type = 'ex'` al huir del país o desde el crimen) borra `convive`.
3. Partidas viejas con tatuajes de cárcel (sin álbum) muestran un tatuaje "de la cárcel" en el álbum.
4. Regalar un cachorro crea una mascota real (perro) para la persona que lo recibe, o para ti si conviven.
5. El piloto lleva casco; la banda presidencial es solo para Presidente (nivel máximo de política).
6. Vender la casa donde vives te muda a otra casa propia **que no esté alquilada**; si no hay, a un alquiler.
7. Una casa que ya trae piscina ("Casa con piscina") no ofrece instalar otra.
8. Se quita la condición `grown` redundante.

## 1. Noticias del mundo

Cada año el mundo tiene un clima: tranquilo (sin titular) o un titular de una lista de ~14
(recesión, auge económico, burbuja cripto, desplome cripto, auge inmobiliario, crisis inmobiliaria,
pandemia, inflación, auge tecnológico, guerra lejana, ola de calor, elecciones caóticas,
furor por el deporte, escándalo financiero). Cada titular tiene modificadores para ese año:

- `inv`: corrimiento del rendimiento de cada inversión (por ejemplo, recesión: acciones −0,25).
- `house`: corrimiento del cambio de valor de las casas.
- `living`: multiplicador del costo de vida (inflación ×1,15).
- `hire`: cambio de la probabilidad de conseguir trabajo; `layoff`: probabilidad extra de despido.
- `sick`: probabilidad de contagio (pandemia) con su condición.
- Un titular no se repite dos años seguidos; la probabilidad de año tranquilo es 45 %.

El titular aparece al inicio del año en el diario (📰) y en "Bienes y dinero" como "Clima
económico". Se guarda en `g.world = { age, id }` y la historia en `g.world.past` (últimos 10).

## 2. Mascotas con trucos y concursos

- **Enseñar un truco** (1 por año, mascota de 1 año o más): aprende uno de su especie con
  probabilidad según relación y salud. Los trucos se guardan en la mascota (`n.tricks`).
- **Concurso de mascotas** (1 por año, $50 de inscripción): el puntaje sale de trucos, salud,
  relación y azar. Puestos 1-3 dan premio ($300 a $5.000), trofeo (`n.trophies`) y un poco de fama
  si es el primero. Logro "Mascota campeona" al ganar un primer puesto.
- La ficha de la mascota muestra sus trucos y trofeos.

## 3. Obras con nombre y críticas

- Tres actividades: **Escribir un libro** (ya existe, ahora con nombre), **Componer una canción**
  (música) y **Pintar un cuadro** (arte).
- Se abre una hoja para escribir el título (máx. 40 letras, hay botón 🎲 de título al azar) y
  elegir el género. Sin título, se usa uno al azar.
- La calidad depende de la habilidad, la inteligencia, el género y el azar. La crítica da
  estrellas (1 a 5) y una cita; 5 estrellas con suerte es un éxito: dinero, fama, logro y
  regalías que bajan año a año (`p.works`).
- "Mis obras" aparece en la ficha personal con título, año, estrellas y si fue un éxito.

## 4. Hijos con vida propia y nietos de verdad

- Los hijos adultos vivos, cada año: pueden conseguir pareja y casarse (`n.spouseName`), cambiar
  de trabajo y tener hijos.
- Un nieto es una persona real con relación `nieto` (Nieto/Nieta), con su avatar, edad y acciones
  (pasar tiempo, regalo, consentir, contar historias). El evento viejo de nieto pasa a crear uno real.
- Eventos nuevos: la boda de tu hijo/a, te pide dinero, consigue un gran trabajo, te hace abuelo/a.
- Si al morir no hay hijos vivos, los nietos pueden heredar y continuar la dinastía.

## 5. Resumen de la vida para compartir

En la pantalla de muerte: **📋 Copiar resumen** (texto al portapapeles) y **📤 Compartir** (si el
navegador lo permite). El texto lo arma el motor (`MV.sys.legacy.summaryText(g)`): nombre, años,
país, causa, ocupación, patrimonio, hijos, logros y epitafio.

## 6. Modo desafío

Al crear una vida se puede elegir un desafío opcional (unos 10): millonario sin universidad,
presidente antes de los 50, diez hijos, vivir 100 años, campeón del mundo, santo y rico,
de la cárcel a la presidencia, nunca trabajar hasta los 60, cinco países distintos, dinastía de 3.
Se revisa cada año; si se cumple, aviso y logro "Desafío cumplido". Algunos se pueden perder
(por ejemplo, si entras a la universidad en "millonario sin universidad"). El desafío se ve en la
ficha personal y en la pantalla de muerte.

## Partidas guardadas

`MV.VERSION = 4`. La migración v3→v4 agrega `p.works = []`, `g.world = null`, `g.challenge = null`
y trucos vacíos en las mascotas. Las partidas v1, v2 y v3 siguen cargando.

## Pruebas

Una prueba de Node por bloque, el jugador automático cubre las acciones nuevas y valida los textos,
la prueba de interfaz recorre las hojas nuevas, y un barrido de 1.000 vidas sin errores ni textos rotos.

## Fuera de alcance (para preguntar al usuario)

Decisiones de gobierno como presidente, niveles de dificultad y costo de vida por país: cambian
el equilibrio de todo el juego y conviene que el usuario los elija.
