# El gato que habla — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** uno de tus gatos empieza a hablar al cumplir una meta, y desde entonces aconseja, comenta el año, planea
travesuras, protagoniza 7 decisiones y se despide al morir.

**Architecture:** un sistema nuevo `MV.sys.talkcat` con la lógica, un archivo de datos con las tres voces
(`MV.CAT_VOICES`) y un archivo de eventos, siguiendo el patrón datos / sistemas / eventos del juego. El gato que habla
es el mismo personaje de siempre con una marca `talk`; el resto del juego lo consulta con `talkcat.cat(g)`.

**Tech Stack:** JavaScript plano en scripts clásicos bajo `window.MV`, sin compilación. Pruebas con `node --test` y
prueba de humo con Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-gato-que-habla-design.md`

## Global Constraints

- Los archivos nuevos se agregan a `index.html`: `tests/load.js` carga los scripts que lista esa página.
- Pruebas: `node --test tests/*.test.js` (nunca `node --test tests/`). Humo: `node tests/ui-smoke.js`, que termina con
  "Interfaz OK"; tiene fallos al azar previos, así que ante un fallo se corre una vez más antes de concluir.
- `MV.VERSION` sigue en 9. Todos los datos nuevos son opcionales y el código funciona si faltan.
- Textos en español con concordancia de género del jugador y del gato (`U.gw`, `MV.gt`).
- Ningún texto muestra `undefined`, `null`, `NaN`, `[object` ni `{clave}`.
- Ninguna opción deja `p.money` en negativo: las que cuestan llevan `when` y solo aparecen si alcanza.
- Nada tomado de otras obras: ni nombres, ni frases, ni rasgos. El gato usa su nombre de `MV.PET_NAMES`.
- Solo hablan los gatos (`species: 'gato'`). Uno por vida.
- Las travesuras no suman a `counters.delitos` ni llaman a `crime.arrest`.
- Los commits terminan con las líneas de atribución de la sesión.

## Review Focus

1. **El gato muere o se da en adopción con un evento suyo en la cola:** el evento desaparece sin error. Prueba en la
   Tarea 5.
2. **Partida vieja o datos incompletos** (gato con `talk` sin `snap`, sin contadores ni `flags.gatoHabla`): el cierre
   del año no falla y ese año no comenta. Prueba en la Tarea 3.
3. **Espiar a alguien que ya no está** (murió, es una mascota o el id no existe): devuelve un mensaje y nada cambia.
   Prueba en la Tarea 4.
4. **Dos gatos cumplen la meta a la vez:** habla exactamente uno, y con la misma semilla siempre el mismo. El heredero
   empieza sin marca y puede tener su propio gato que habla. Pruebas en las Tareas 1 y 6.
5. **Tras darlo en adopción, `MV.gcPeople` borra a ese personaje** y `flags.gatoHabla` apunta a nadie: no hay error y
   ningún otro gato habla. Prueba en la Tarea 6.

---

## Estructura de archivos

| Archivo | Qué hace |
|---|---|
| `js/data/talkcat.js` (nuevo) | `MV.CAT_VOICES`: las tres voces con todas sus frases |
| `js/systems/talkcat.js` (nuevo) | `MV.sys.talkcat`: llegada, consejo, comentario, travesuras y final |
| `js/data/events/gato.js` (nuevo) | Las 7 decisiones |
| `js/systems/year.js` | Llama a `talkcat.yearly(g)` justo después de `rels.yearly(g)` |
| `js/systems/people.js:31,103-107` | Sin accidente al azar y despedida propia |
| `js/systems/rels.js` (acciones de mascotas) | Suma las acciones del gato y el texto de adopción |
| `js/data/activities.js:243,268`, `js/systems/mythic.js` (`gato_sigue`) | Cuentan cada rescate |
| `js/systems/legacy.js:213` | El heredero no lo recibe |
| `js/data/goals.js` | Dos logros |
| `js/ui/sheets.js` (`showPerson`, `showRelations`) | Etiqueta `#pet-talk` y "habla" |
| `tests/gato.test.js` (nuevo), `tests/ui-smoke.js`, `tests/agent.js` | Pruebas |

**Forma de las voces.** `MV.CAT_VOICES[kind]` con `kind` en `filosofo`, `diva`, `aristocrata`. Toda frase es una
función `(c) => string` que recibe `c = { g, p, n, d }`: la partida, el jugador, el gato y los datos del caso. Las
frases van sin comillas dobles ni el nombre del gato delante: eso lo pone quien las usa.

```js
{ name: 'filósofo gruñón|filósofa gruñona',   // se resuelve con MV.gt(name, n.gender)
  intro, farewell, adopted,                   // (c) => string
  idle: [/* 4 o más */],
  advice: { preso, profugo, salud, deudas, sucio, pareja, trabajo, estres, seguro },
  facts: { carcel, muerte, boda, divorcio, hijo, despido, ascenso, casa },
  events: { gato_celos, gato_regalo, gato_desaparece, gato_amigo, gato_famoso, gato_madrugada, gato_veterinario } }
```

Los nombres: `'filósofo gruñón|filósofa gruñona'`, `'divo dramático|diva dramática'` y
`'aristócrata venido a menos|aristócrata venida a menos'`.

**Ayudantes de prueba** (al principio de `tests/gato.test.js`; los usan todas las tareas):

```js
const T = (MV) => MV.sys.talkcat;
/** Partida con el jugador a esa edad, sin cola y sin mascotas. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = [];
  g.p.rels = g.p.rels.filter((r) => r.type !== 'mascota');
  return g;
}
/** Agrega un gato con esa relación. */
function cat(MV, g, rel, extra) {
  const n = MV.newPet(g, 'gato', { age: 3 }); Object.assign(n, extra || {});
  return { n, r: MV.addRel(g, n, 'mascota', rel == null ? 70 : rel) };
}
/** Partida con un gato que ya habla, de la personalidad pedida. */
function talker(MV, seed, kind, age) {
  const g = game(MV, seed, age); const c = cat(MV, g, 90);
  T(MV).grant(g, c.n, 'karma'); if (kind) c.n.talk.kind = kind;
  g.queue = [];
  return { g, n: c.n, r: c.r };
}
```

---

### Task 1: Voces, llegada y vida

**Files:**
- Create: `js/data/talkcat.js`, `js/systems/talkcat.js`, `tests/gato.test.js`
- Modify: `js/systems/year.js`, `js/systems/people.js:31`, `js/data/activities.js:243,268`, `js/systems/mythic.js`
  (`gato_sigue`), `js/data/goals.js`, `index.html`

**Interfaces:**
- Produces en `MV.sys.talkcat`:
  - **`cat(g) -> persona | null`:** el gato de `p.flags.gatoHabla` si existe, vive, tiene `talk` y sigue en tus
    relaciones como mascota.
  - **`kindName(n) -> string`:** `MV.gt(MV.CAT_VOICES[n.talk.kind].name, n.gender)`.
  - **`ctx(g, n, d) -> { g, p, n, d }`:** el argumento de las frases (`d` es `{}` si falta).
  - **`rescued(g) -> number`:** `p.counters.gatosRescatados`; si falta, cuenta tus mascotas gato con `street`, vivas
    o muertas, que sigan en `p.rels`.
  - **`noteRescue(g) -> void`:** se llama justo **después** del `MV.addRel` de un gato callejero. Si el contador
    falta, lo inicia con `rescued(g)` (que ya incluye al nuevo); si existe, le suma 1.
  - **`candidate(g) -> { n, how } | null`**, en este orden:
    1. `lealtad`: gato vivo con `r.loyal >= 5`; si hay varios, el de mayor `r.loyal` y después mayor `r.rel`;
    2. `rescate`: `rescued(g) >= 3`; entre tus gatos vivos con `street`, el de mayor `r.since` y, a igualdad, el
       último de `p.rels`;
    3. `karma`: `p.karma >= 60`; el gato vivo de mayor `r.rel` y, a igualdad, el primero de `p.rels`.
  - **`grant(g, n, how) -> n`:**
    - `n.talk = { kind: U.pick(['filosofo', 'diva', 'aristocrata']), since: p.age, how }`;
    - `p.flags.gatoHabla = n.id`;
    - `n.lifespan = Math.max(U.int(24, 30), n.age + 3)`;
    - logro `gato_habla`;
    - `MV.EV.info` con título "Tu gato habló" o "Tu gata habló", ícono 🗨️ y texto `` `${n.first}: "${intro(c)}"` ``.
  - **`yearly(g) -> void`:**
    - para cada gato vivo tuyo: `r.loyal = r.rel >= 80 ? (r.loyal || 0) + 1 : 0`;
    - si `p.flags.gatoHabla` ya está puesto, termina (la Tarea 3 agrega aquí el comentario);
    - si `p.age < 6`, termina;
    - si `candidate(g)` devuelve algo, `grant`.
- `MV.CAT_VOICES` con `name` e `intro` de las tres voces (las demás claves llegan en las tareas siguientes).
- Logro en `MV.ACHIEVEMENTS`: `{ id: 'gato_habla', name: 'Me lo dijo el gato', icon: '🗨️', desc: 'Tu gato empezó a
  hablarte.' }`.

- [ ] **Step 1: Write the failing tests** en `tests/gato.test.js`, con los ayudantes de arriba:
  - **`'la lealtad hace hablar a tu gato a los 5 años seguidos'`:** gato con relación 85; 4 llamadas a `yearly` no
    alcanzan; la quinta deja `n.talk.how === 'lealtad'`, `p.flags.gatoHabla === n.id`, el logro `gato_habla` y un
    aviso en la cola cuyo texto incluye `n.first`.
  - **`'la lealtad vuelve a cero si un año cierra por debajo de 80'`:** 4 cierres con 85, uno con 79 (`r.loyal`
    queda en 0) y 4 más con 85: todavía no habla.
  - **`'el tercer rescate hace hablar al rescatado más reciente'`:** tres gatos con `street` agregados con
    `r.since` 20, 25 y 30 y `noteRescue` tras cada uno; `yearly` deja hablando al de `since` 30 con
    `how === 'rescate'`. Con solo dos rescates, nadie habla.
  - **`'los tres caminos de rescate cuentan'`:** la actividad `gato_callejero` (con el jugador de 30 años viviendo
    solo), el evento `gato_sigue` con "Adoptarlo" y `noteRescue` directo dejan `rescued(g) === 3`.
  - **`'en una partida sin contador, los rescates se cuentan desde tus gatos'`:** sin `counters.gatosRescatados` y
    con dos gatos con `street` ya en tus relaciones, `rescued(g) === 2`; tras agregar un tercero y `noteRescue`,
    `rescued(g) === 3` y el contador queda guardado.
  - **`'con buen karma habla el gato que más te quiere'`:** `p.karma = 60`, gatos con relación 50 y 70: habla el
    de 70, `how === 'karma'`. Con karma 59, nadie.
  - **`'si se cumplen varias metas gana la primera'`:** un gato con `r.loyal = 4` y relación 85, karma 60 y otro gato
    con relación 95: tras `yearly`, habla el primero con `how === 'lealtad'`.
  - **`'dos gatos igual de leales: habla uno solo y siempre el mismo'`** (Foco 4): dos gatos con `r.loyal = 4` y
    relación 85; con la misma semilla, dos partidas dan el mismo `flags.gatoHabla`, y solo un gato tiene `talk`.
  - **`'antes de los 6 años no habla'`:** jugador de 4 años con karma 80 y un gato: `yearly` no lo hace hablar; con 6
    años, sí.
  - **`'uno por vida'`:** con un gato que ya habla, otro gato con `r.loyal = 10` no habla tras `yearly`. Tampoco
    después de `MV.sys.people.die` del primero.
  - **`'salen las tres personalidades'`:** en 60 semillas de `grant`, aparecen los tres `kind`, y `kindName` da
    "filósofa gruñona" para una gata `filosofo`.
  - **`'vive más y no muere por accidente'`:** `grant` a un gato de 3 años deja `lifespan` entre 24 y 30; a uno de
    29, en 32. En 400 semillas de `MV.sys.people.yearly` con un gato que habla de 5 años, sigue vivo.
  - **`'todas las frases de las tres voces salen limpias'`:** recorre `MV.CAT_VOICES` en profundidad y llama a cada
    función con `ctx` armado para jugador y gato de ambos géneros y
    `d = { years: 3, cond: 'gripe', amount: 12345, name: 'Ana', title: 'Cajera', label: 'hermana' }`. Ningún
    resultado coincide con `/undefined|NaN|\[object|\{\w+\}|null/`, ninguno lleva comillas dobles y las tres voces
    tienen las mismas claves.
- [ ] **Step 2: Run** `node --test tests/gato.test.js`.

  Expected: FAIL, `MV.sys.talkcat` no existe.

- [ ] **Step 3: Implement** según la Interface:
  - `year.js`: `MV.sys.talkcat.yearly(g);` justo después de `MV.sys.rels.yearly(g);`.
  - `people.js:31`: el accidente al azar no corre si `n.talk`.
  - `noteRescue(g)` después del `addRel` en `activities.js:243`, `activities.js:268` y "Adoptarlo" de `gato_sigue`.
  - `index.html`: `js/data/talkcat.js` después de `js/data/realty.js`; `js/systems/talkcat.js` después de
    `js/systems/mythic.js`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Tu gato aprende a hablar: tres metas, tres personalidades y una vida más larga"`.

---

### Task 2: Consejo del año

**Files:**
- Modify: `js/systems/talkcat.js`, `js/data/talkcat.js` (`advice`, `idle`), `js/systems/rels.js` (rama de mascotas
  de `actions`)
- Test: `tests/gato.test.js`

**Interfaces:**
- Consumes: `cat`, `ctx`, `grant` (Tarea 1).
- Produces:
  - **`risk(g) -> { id, d } | null`**, el primero que se cumpla:

    | `id` | Condición | `d` |
    |---|---|---|
    | `preso` | `p.prison` | `{ years: p.prison.left }` |
    | `profugo` | `p.wanted > 0` | `{ years: p.wanted }` |
    | `salud` | `p.stats.health < 35`, o una condición con `drain[1] >= 8` o `urgent` | `{ cond }`: su nombre en minúsculas, o `null` |
    | `deudas` | `p.money < 0`, o `cuotas > p.money` con `cuotas > 0` | `{ amount }`: las cuotas, o `-p.money` si no hay |
    | `sucio` | `p.dirty > 50000` | `{ amount: p.dirty }` |
    | `pareja` | `MV.partner(g)` con `r.rel < 35` | `{ name: n.first }` |
    | `trabajo` | `p.job && p.job.perf < 30` | `{ title: MV.sys.career.title(p) }` |
    | `estres` | `p.stress > 70` | `{}` |
    | `seguro` | `p.age >= 50` y sin seguro de salud | `{}` |

    `cuotas` es la suma de `l.pay` de los préstamos con `l.start <= p.age` y `l.left > 0`.
  - **`advise(g) -> string`:** `` `${n.first}: "${frase}"` ``, con la frase de `advice[id]` o una de `idle` al azar.
    Las frases con dato lo muestran: los montos con `U.money`.
  - **`actions(g, r, n) -> action[]`:** vacío si `n` no es `cat(g)`. Por ahora una acción:
    `{ id: 'gato_consejo', icon: '🗨️', label: 'Pedirle consejo', sub: 'Te dice qué anda mal en tu vida', limit: 1,
    run: (g) => advise(g) }`.
  - `rels.actions`, en la rama de mascotas, agrega `talkcat.actions(g, r, n)` antes de "Dar en adopción".

- [ ] **Step 1: Write the failing tests:**
  - **`'cada riesgo aislado da su consejo con el dato'`:** partida sin riesgos (salud 80, estrés 10, sin préstamos,
    sin pareja, sin trabajo, 30 años). Para cada fila se arma solo ese riesgo y se comprueba el `id` de `risk` y que
    `advise` incluye el dato:
    - `preso` con 4 años por cumplir: incluye "4";
    - `profugo` con `wanted = 3`;
    - `salud` con salud 20, y aparte con salud 80 y la condición `apendicitis`: incluye su nombre;
    - `deudas` con un préstamo de cuota 9.000 y $5.000: incluye `U.money(9000)`; y con `money = -700` sin préstamos:
      incluye `U.money(700)`;
    - `sucio` con 80.000: incluye `U.money(80000)`;
    - `pareja` con relación 20: incluye su nombre;
    - `trabajo` con rendimiento 10: incluye el puesto;
    - `estres` con 80;
    - `seguro` con 55 años.
  - **`'una hipoteca que puedes pagar no es un riesgo'`:** préstamo con `left` 300.000 y cuota 9.000 con $50.000:
    `risk` no devuelve `deudas`.
  - **`'con dos riesgos gana el primero de la lista'`:** estrés 80 y dinero sucio 80.000 dan `sucio`; preso y salud
    20 dan `preso`.
  - **`'sin riesgos dice una frase suya'`:** `risk` es `null` y `advise` devuelve una de las `idle` de su voz. Cada
    voz tiene 4 o más `idle` y las 9 claves de `advice`.
  - **`'el consejo está en su ficha, una vez por año, también en prisión'`:** `rels.actions` del gato que habla
    incluye `gato_consejo`, y la de un gato común no. `MV.doAction(g, act, undefined, r.acts)` funciona una vez y la
    segunda queda bloqueada. Con `p.prison` puesto, la acción sigue y el consejo es el de `preso`. Ninguna
    estadística ni el dinero cambian.
- [ ] **Step 2: Run** `node --test tests/gato.test.js`.

  Expected: FAIL, `risk` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "El gato que habla te da un consejo por año"`.

---

### Task 3: Comentario en el diario

**Files:**
- Modify: `js/systems/talkcat.js`, `js/data/talkcat.js` (`facts`)
- Test: `tests/gato.test.js`

**Interfaces:**
- Consumes: `cat`, `ctx`, `grant`, `yearly` (Tarea 1); `idle` (Tarea 2).
- Produces:
  - **`snapshot(g) -> objeto`:**
    `{ prison, dead, bodas, divorcios, hijos, despidos, job, level, casas }`, donde:
    - `prison`: `!!p.prison`;
    - `dead`: los ids de tus relaciones muertas de tipo padre, hijo, nieto, hermano, abuelo, pareja, cónyuge o
      mascota;
    - `bodas` y `divorcios`: los contadores (0 si faltan);
    - `hijos`: los ids de tus hijos, vivos o muertos;
    - `despidos`: cuántas entradas de `p.jobs` tienen `why === 'despido'`;
    - `job` y `level`: los del trabajo actual, o `null` y `-1`;
    - `casas`: cuántos bienes `type === 'casa'` tienes.
  - **`fact(g, old) -> { id, d } | null`**, el primero que se cumpla comparando con `old`:
    `carcel`, `muerte` (`d = { name, label }` de la primera muerte nueva, con `label` en minúsculas), `boda`
    (`d = { name }` de tu cónyuge, si hay), `divorcio`, `hijo` (`d = { name }` del hijo nuevo), `despido`,
    `ascenso` (mismo `job` y `level` mayor; `d = { title }`), `casa`.
  - **`comment(g) -> void`:** si `cat(g)` existe:
    - si `n.talk.snap` falta, solo lo guarda y no comenta;
    - si no, toma `fact`; si no hay hecho, con 25 % usa una `idle`;
    - si hay texto, `MV.log(g, `` `${n.first}: "${frase}"` ``, '🐈')`;
    - siempre guarda `n.talk.snap = snapshot(g)`.
  - `grant` guarda `snap: snapshot(g)` en `n.talk`. `yearly` llama a `comment(g)` cuando `flags.gatoHabla` ya estaba
    puesto.

- [ ] **Step 1: Write the failing tests** (ayudante local `said(g)`: los textos del diario del último año que
  empiezan con el nombre del gato):
  - **`'comenta cada hecho del año'`:** para cada hecho, con un gato que habla recién llegado, se provoca el hecho y
    `yearly` deja exactamente un comentario que no es una `idle`:
    - `carcel`: `MV.sys.crime.jail(g, 3, 'Robo')`;
    - `muerte`: `MV.sys.people.die` de un hermano; el comentario incluye su nombre;
    - `boda`: `counters.bodas` sube a 1 y hay cónyuge;
    - `divorcio`: `counters.divorcios` sube a 1;
    - `hijo`: un hijo nuevo; incluye su nombre;
    - `despido`: `MV.sys.career.fire` con un trabajo de tiempo completo;
    - `ascenso`: `p.job.level` sube 1; incluye el puesto;
    - `casa`: un bien `casa` más.
  - **`'con dos hechos gana el primero'`:** cárcel y boda el mismo año: un solo comentario, igual a
    `facts.carcel` de su voz.
  - **`'un año tranquilo calla casi siempre'`:** en 400 semillas sin hechos, comenta entre el 17 % y el 33 % de las
    veces, y nunca más de una vez por año.
  - **`'el año en que empieza a hablar no comenta'`:** el `yearly` que hace el `grant` no deja comentario, aunque
    ese año haya habido una boda.
  - **`'un gato de una partida vieja no rompe el cierre del año'`** (Foco 2): gato con `talk = { kind: 'diva' }` sin
    `snap`, `flags.gatoHabla` puesto, y `p.counters = {}`: `yearly` no falla, no comenta y deja `snap` guardado. Sin
    `flags.gatoHabla` pero con un gato con `talk`, `cat(g)` es `null` y `yearly` no falla.
  - Cada voz tiene las 8 claves de `facts`.
- [ ] **Step 2: Run** `node --test tests/gato.test.js`.

  Expected: FAIL, `snapshot` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "El gato que habla comenta tu año en el diario"`.

---

### Task 4: Travesuras

**Files:**
- Modify: `js/systems/talkcat.js`, `js/data/talkcat.js` (textos de resultados, si se guardan ahí)
- Test: `tests/gato.test.js`

**Interfaces:**
- Consumes: `cat`, `actions` (Tareas 1 y 2).
- Produces:
  - **`prank(g, kind, targetId?) -> string`**, con los valores de la especificación §4:
    - `pescaderia`: 65 % da +6 de felicidad y +3 de relación con el gato. Si falla, −1 de karma y multa de $300;
      si `p.age < 18` o `p.money < 300`, no hay multa y pierdes 3 de felicidad.
    - `vecino`: +5 de felicidad y −3 de karma; con 30 %, una persona nueva queda como `enemigo` con relación 15.
    - `espiar`: 50 % +8 de relación con esa persona; 30 % −8; 20 % −12 y −2 de felicidad. Si `targetId` no es una
      persona humana viva de tus relaciones, devuelve un mensaje y no cambia nada.
  - `actions` suma `{ id: 'gato_travesura', icon: '😼', label: 'Planear algo con tu gato' | '… con tu gata',
    sub: 'Una vez por año. Puede salir mal', limit: 1, when, opts, run }`:
    - `when`: `p.age >= 12 && !p.prison`;
    - `opts(g)`: `pescaderia`, `vecino` y una opción `'espiar:' + id` ("Espiar a Nombre") por cada persona humana
      viva de tus relaciones;
    - `run(g, o)`: separa `kind` y `targetId` de `o` y llama a `prank`.
  - La acción usa la lista plana porque la interfaz no admite un segundo paso solo para algunas opciones.

- [ ] **Step 1: Write the failing tests:**
  - **`'asaltar la pescadería'`:** en 300 semillas con $1.000 y 30 años, el éxito queda entre 55 % y 75 %; en cada
    éxito, felicidad +6 y relación con el gato +3; en cada fallo, karma −1 y dinero −300. `counters.delitos` no
    cambia y no hay `juicio` en la cola.
  - **`'la multa nunca deja el dinero en negativo'`:** con $100, y aparte con 15 años y $1.000: en los fallos el
    dinero no cambia y la felicidad baja 3.
  - **`'desordenarle la casa al vecino'`:** siempre +5 de felicidad y −3 de karma; en 300 semillas, entre 20 % y
    40 % suman un `enemigo` nuevo con relación 15.
  - **`'espiar a alguien'`:** con un amigo de relación 50, en 400 semillas los resultados son +8 (40–60 %), −8
    (20–40 %) y −12 con −2 de felicidad (12–28 %).
  - **`'espiar a quien ya no está no hace nada'`** (Foco 3): con un id inexistente, con el id de una persona muerta y
    con el id del propio gato, `prank` devuelve un texto limpio y no cambian relaciones, felicidad ni karma.
  - **`'la acción de travesuras'`:**
    - no aparece con 11 años ni con `p.prison`;
    - sin personas en tus relaciones, `opts` tiene solo `pescaderia` y `vecino`;
    - con una gata, la etiqueta dice "con tu gata";
    - `MV.doAction(g, act, 'vecino', r.acts)` funciona una vez por año.
  - Todos los textos devueltos, con jugador y gato de ambos géneros, nombran al gato y no tienen marcas prohibidas.
- [ ] **Step 2: Run** `node --test tests/gato.test.js`.

  Expected: FAIL, `prank` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Travesuras con tu gato: pescadería, vecino y espionaje"`.

---

### Task 5: Las 7 decisiones

**Files:**
- Create: `js/data/events/gato.js`
- Modify: `js/data/talkcat.js` (`events`), `index.html`
- Test: `tests/gato.test.js`

**Interfaces:**
- Consumes: `cat`, `ctx`, `noteRescue` (Tarea 1); `MV.sys.mythic.strayCat`.
- Produces: 7 eventos con decisiones, todos con:
  - `when`: `cat(g)` existe, más la condición propia;
  - `target`: el id del gato (así el motor los descarta si muere);
  - `w: 3` e ícono 🐈;
  - `text`: una frase común que cuenta la situación y nombra al gato, seguida de lo que dice según su voz
    (`events[id](c)`, entre comillas; en `gato_desaparece` es la nota que dejó);
  - opciones y efectos de la tabla de la especificación §5, con estos ids y condiciones:

  | `id` | Condición extra | Notas |
  |---|---|---|
  | `gato_celos` | `MV.partner(g)` | el soborno pide `p.money >= 40` |
  | `gato_regalo` | — | |
  | `gato_desaparece` | — | los carteles piden `p.money >= 60`; el gato siempre sigue contigo |
  | `gato_amigo` | — | invitar pide `p.money >= 80`; adoptar usa `strayCat(g, 'joven')`, relación 60 y `noteRescue` |
  | `gato_famoso` | `p.age >= 13` | suma a `p.followers` |
  | `gato_madrugada` | — | |
  | `gato_veterinario` | — | "Llevarlo igual" y "Negociar" piden `p.money >= 250`; negociar acierta con `0.4 + carisma / 200` y solo cobra si acepta |

- [ ] **Step 1: Write the failing tests** (cada evento se encola con
  `MV.EV.push(g, id, { target: n.id }, true)` y se resuelve con `MV.EV.view` y `MV.EV.choose`):
  - **`'cada opción de los 7 eventos hace lo que dice'`:** con $10.000, pareja de relación 50 y gato de relación 50
    y salud 50, se comprueba cada opción con sus valores exactos. Las que tienen azar se recorren con semillas hasta
    ver todos sus resultados. En particular:
    - celos: −6 y +6; −6 y +5; −$40 y +3;
    - regalo: los tres resultados de "Quedártelo" (dinero entre +50 y +500, karma −2, felicidad −3); +3 de karma y
      −3; +4;
    - desaparece: +5 de estrés y +8; −$60 y +4; los dos resultados de "Esperar"; el gato sigue en tus relaciones;
    - amigo: −$80 y +5; una mascota gato nueva con relación 60 y `rescued` +1; −5;
    - famoso: seguidores entre +200 y +5.000; −3 y +2 de karma; dinero entre +100 y +1.500 y −4;
    - madrugada: +2 de inteligencia, +4 de estrés y +6; −3 y −3 de estrés; los dos resultados de "Discutirle";
    - veterinario: −$250, salud del gato +15 y −5; los dos resultados de "Negociar" (el arañazo no cobra); +3 y
      salud del gato −5.
  - **`'las opciones con precio no aparecen sin dinero'`:** con $0, la vista de `gato_celos`, `gato_desaparece`,
    `gato_amigo` y `gato_veterinario` no muestra las opciones pagas, y todas conservan al menos una opción.
  - **`'el texto del evento cambia con la personalidad'`:** para cada evento, las tres voces dan tres textos
    distintos, limpios y que nombran al gato.
  - **`'sin gato que habla no aparecen'`:** `MV.EV.eligible` es `null` para los 7 sin gato que habla, y también con
    gato pero con `p.prison` puesto; `gato_celos` también sin pareja y `gato_famoso` con 12 años.
  - **`'si el gato ya no está, su evento en cola desaparece'`** (Foco 1): con `gato_regalo` en la cola,
    `MV.sys.people.die` del gato y, aparte, `MV.removeRel`: en ambos casos `MV.EV.view` no muestra ese evento y no
    hay error.
  - **`'aparece alguno cada pocos años'`:** en 40 semillas, con un gato que habla y el jugador de 30 años, 20
    pasadas de `MV.EV.runYear`. En cada pasada se cuentan los eventos `gato_*` que quedaron en la cola, se vacía la
    cola y se suma 1 a `p.age`. El total de las 800 pasadas queda entre 80 y 400.
- [ ] **Step 2: Run** `node --test tests/gato.test.js`.

  Expected: FAIL, "Evento desconocido: gato_celos".

- [ ] **Step 3: Implement** los 7 eventos y sus textos. `index.html`: `js/data/events/gato.js` después de
  `js/data/events/dinero.js`. Si la frecuencia no entra en el rango, ajustar `w` y anotarlo.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Siete decisiones con tu gato que habla"`.

---

### Task 6: Su final

**Files:**
- Modify: `js/systems/talkcat.js`, `js/data/talkcat.js` (`farewell`, `adopted`), `js/systems/people.js:103-107`,
  `js/systems/rels.js` (`regalar_mascota`), `js/systems/legacy.js:213`, `js/data/goals.js`
- Test: `tests/gato.test.js`

**Interfaces:**
- Consumes: `cat`, `ctx` (Tarea 1).
- Produces:
  - **`farewell(g, n) -> void`:** `MV.EV.info` con título "Últimas palabras", ícono 🕯️, escena `cementerio` y texto
    `` `${n.first}: "${farewell(c)}"` ``, más el logro `ultimas_palabras`.
  - `people.die`, rama de mascotas: conserva la pérdida de felicidad; si `n.talk`, llama a `farewell` en lugar del
    aviso "Adiós, compañero".
  - Logro: `{ id: 'ultimas_palabras', name: 'Últimas palabras', icon: '🕯️', desc: 'Tu gato que habla se despidió de
    ti.' }`.
  - "Dar en adopción" de un gato que habla:
    - confirmación: `` `¿Dar en adopción a ${n.first}? Ningún otro gato volverá a hablarte.` ``;
    - resultado: `` `${n.first}: "${adopted(c)}"` ``;
    - mismos efectos que hoy, sin logro.
  - `legacy.continueAs`: las mascotas con `talk` no se copian. Si el heredero iba a recibir mascotas
    (`c.age < 30`) y el gato estaba vivo, su diario suma una línea con ícono 🐈 que nombra al gato y dice que se fue
    el día del funeral, con "de tu padre/madre" o "de tu abuelo/abuela" según corresponda.

- [ ] **Step 1: Write the failing tests:**
  - **`'se despide al morir'`:** `MV.sys.people.die(g, n, 'vejez')` deja en la cola un aviso "Últimas palabras" con
    el nombre del gato y la frase `farewell` de su voz, desbloquea `ultimas_palabras` y baja la felicidad como con
    cualquier mascota (igual que un gato común con la misma relación). Un gato común sigue con "Adiós, compañero" y
    sin ese logro. Las tres voces dan despedidas distintas.
  - **`'darlo en adopción'`:** la acción `regalar_mascota` del gato que habla tiene la confirmación con "Ningún otro
    gato volverá a hablarte"; al correrla, el texto es la frase `adopted` de su voz, el gato sale de tus relaciones,
    `cat(g)` es `null` y no se desbloquea `ultimas_palabras`.
  - **`'después de la adopción nadie más habla'`** (Foco 5): tras la adopción se llama a `MV.gcPeople(g)`, se agrega
    otro gato con `r.loyal = 10` y karma 80, y 3 llamadas a `yearly` no fallan y no hacen hablar a nadie.
  - **`'el heredero no lo recibe'`:** jugador de 70 con un gato que habla y un perro, e hijo de 25 años. Tras
    `legacy.die` y `continueAs`:
    - el heredero tiene al perro y no al gato;
    - su diario tiene una línea con el nombre del gato y "funeral";
    - `ng.p.flags.gatoHabla` es `undefined`.

    Con un hijo de 40 años (que no recibe mascotas), no hay línea.
  - **`'el heredero puede tener su propio gato que habla'`** (Foco 4): en la partida del heredero, un gato con
    `r.loyal = 4` y relación 85 habla tras `yearly`.
- [ ] **Step 2: Run** `node --test tests/gato.test.js`.

  Expected: FAIL, el aviso es "Adiós, compañero".

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "El gato que habla se despide; no pasa al heredero"`.

---

### Task 7: Interfaz, jugador automático y README

**Files:**
- Modify: `js/ui/sheets.js` (`showPerson`, `showRelations`), `tests/ui-smoke.js`, `tests/agent.js`, `README.md`
- Test: `tests/gato.test.js`, `tests/ui-smoke.js`

**Interfaces:**
- Consumes: `cat`, `kindName`, `grant`, `actions` (Tareas 1, 2 y 4).
- Produces:
  - En la ficha de una mascota con `talk`: una etiqueta más junto a su rasgo, con id `pet-talk` y texto
    `` `🗨️ Habla · ${kindName(n)}` ``.
  - En la lista de Relaciones: la línea del gato que habla termina en ", habla".

- [ ] **Step 1: Write the failing tests:**
  - **Humo** (bloque "El gato que habla" antes de `// Avanzar 5 años`): se agrega un gato, se le da `grant` con
    `kind = 'diva'` y género `f`, y se abre su ficha:
    - existe `#pet-talk` con "Habla" y "diva dramática";
    - la ficha tiene las filas "Pedirle consejo" y "Planear algo con tu gata";
    - al tocar "Pedirle consejo" aparece un resultado con el nombre de la gata;
    - Relaciones muestra su línea con "habla";
    - ningún texto de esas hojas tiene "null", "undefined" ni "NaN".
  - **`'el jugador automático vive 30 vidas con gatos que hablan'`** en `tests/gato.test.js`: 30 vidas
    `live(MV, g, { acts: 4 })` con semillas 500–529 terminan sin errores; en al menos una hay un gato con `talk`, y en
    `g.evDone` de alguna aparece un evento `gato_*`.
- [ ] **Step 2: Run** `node --test tests/gato.test.js && node tests/ui-smoke.js`.

  Expected: FAIL, no existe `#pet-talk`.

- [ ] **Step 3: Implement:**
  - La etiqueta y el texto de Relaciones.
  - **Agente:** si las 30 vidas no encuentran un gato que habla, `special()` de `tests/agent.js` suma una rama
    pequeña que a veces recoge un gato callejero y juega con sus gatos. Las acciones del gato ya le llegan por
    `rels.actions`.
  - **README:**
    - la fila de mascotas menciona al gato que habla: sus tres metas, sus tres personalidades y lo que hace;
    - la cantidad de logros pasa a la real (`MV.ACHIEVEMENTS.length`);
    - las cantidades de eventos pasan a las reales: los que salen al azar, cuántos de ellos tienen decisiones, y los
      `manual` o `pushOnly`.
- [ ] **Step 4: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "El gato que habla en su ficha y en Relaciones; README y jugador automático"`.
