# A1 — Personas con memoria, rencores y acosadores — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** las personas recuerdan lo que les hiciste, y años después eso vuelve como favor, giro de la vida, perdón o
venganza. Además, alguien puede volverse tu acosador o acosadora.

**Architecture:**
- Un sistema nuevo, `MV.sys.memory`, guarda recuerdos en cada relación (`r.mem`) y cada año elige uno viejo para que
  vuelva.
- Los favores, giros y venganzas son tablas de variantes con condición y efecto, en el archivo de eventos.
- El acosador es un tipo de relación nuevo (`acosador`), con su propia decisión anual y su ficha.

**Tech Stack:** JavaScript plano en scripts clásicos bajo `window.MV`, sin compilación. Pruebas con `node --test` y
prueba de humo con Playwright.

**Spec:** `docs/superpowers/specs/2026-11-23-memoria-y-rencores-design.md`

## Global Constraints

- Los archivos nuevos se agregan a `index.html`: `tests/load.js` carga los scripts que lista esa página.
- Pruebas: `node --test tests/*.test.js` (nunca `node --test tests/`). Humo: `node tests/ui-smoke.js`, que termina con
  "Interfaz OK"; tiene fallos al azar previos, así que ante un fallo se corre una vez más antes de concluir.
- `MV.VERSION` sigue en 9. Todos los datos nuevos son opcionales y el código funciona si faltan.
- Personas y negocios inventados. Humor negro sin contenido explícito.
- Textos en español con concordancia de género del jugador y de cada persona (`U.gw`).
- Ningún texto muestra `undefined`, `null`, `NaN`, `[object` ni `{clave}`.
- Ninguna opción deja `p.money` en negativo: las que cuestan llevan `when` y solo aparecen si alcanza.
- Ninguna venganza ni etapa del acosador mata, encarcela, quita dinero ni toca a tus hijos. Nada de violencia sexual.
- Los recuerdos son siempre de lo que el jugador le hizo a la otra persona.
- Las mascotas y los acosadores no guardan recuerdos.
- Los commits terminan con las líneas de atribución de la sesión.

## Review Focus

1. **La persona muere o sale de tu vida con su decisión en la cola:** la decisión desaparece sin error. Prueba en la
   Tarea 6.
2. **Recuerdos sin dato** (`d` ausente: partidas viejas o fuentes sin monto): los textos se leen bien, sin marcas
   prohibidas. Prueba en la Tarea 1.
3. **Venganza contra alguien sin pareja, sin trabajo, sin auto, sin fama o sin casa, o con el dinero en rojo:** solo
   salen las que encajan, y el dinero nunca baja por una venganza. Prueba en la Tarea 5.
4. **Acosador con el jugador preso, o en la etapa 3 sin pareja:** en prisión no hay decisión de acoso; sin pareja, la
   etapa 3 hace el daño de la etapa 2. Prueba en la Tarea 7.
5. **Partida guardada y cargada:** `mem`, `memNext` y `stalk` sobreviven a JSON; una partida sin esos campos no falla.
   Prueba en la Tarea 8.

---

## Estructura de archivos

| Archivo | Qué hace |
|---|---|
| `js/data/memory.js` (nuevo) | `MV.MEMORY_KINDS`: los tipos de recuerdo, su signo, su peso y cómo se cuentan |
| `js/systems/memory.js` (nuevo) | `MV.sys.memory`: guardar, recordar, elegir qué vuelve y el acosador |
| `js/data/events/memoria.js` (nuevo) | Favores, giros, perdón, venganzas y acoso: tablas y eventos |
| `js/core/events.js` (`stillValid`) | Pasa `ctx` a `when` |
| `js/core/state.js` (`REL_LABEL`, `MV.REL_ORDER`) | Tipo `acosador` |
| `js/systems/money.js` | `money.dues(g)` e `money.income(g)` |
| `js/systems/talkcat.js` | Usa `money.dues` y `money.income` en el riesgo de deudas |
| `js/systems/rels.js`, `js/data/events/adultez.js`, `general.js`, `trabajo.js` | Dejan recuerdos y crean acosadores |
| `js/systems/year.js` | Llama a `memory.yearly(g)` después de `talkcat.yearly(g)` |
| `js/ui/sheets.js` (`GROUP`) | Grupo "Acoso" en Relaciones |
| `tests/memoria.test.js` (nuevo), `tests/ui-smoke.js`, `tests/agent.js`, `README.md` | Pruebas y documentación |

**Ayudantes de prueba** (al principio de `tests/memoria.test.js`):

```js
const MEM = (MV) => MV.sys.memory;
/** Partida adulta (30 años por defecto), sin cola ni relaciones salvo las que se agreguen. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = []; g.p.rels = [];
  return g;
}
/** Agrega una persona de 30 años con ese tipo de relación. */
function person(MV, g, type, rel, extra) {
  const n = MV.newNPC(g, Object.assign({ age: 30 }, extra || {}));
  return { n, r: MV.addRel(g, n, type, rel == null ? 50 : rel) };
}
```

---

### Task 1: Tipos de recuerdo y cómo se guardan

**Files:**
- Create: `js/data/memory.js`, `js/systems/memory.js`, `tests/memoria.test.js`
- Modify: `index.html` (`js/data/memory.js` después de `js/data/talkcat.js`; `js/systems/memory.js` después de
  `js/systems/talkcat.js`)

**Interfaces:**
- Produces:
  - **`MV.MEMORY_KINDS[k] = { good: boolean, w: number | (d) => number, did: (n, d) => string }`.** `did` arma la
    frase en pasado, en segunda persona y con el género de la persona `n` ("le prestaste $5.000", "lo insultaste"). Si
    `d` falta, la frase se lee bien sin el dato.

    | `k` | `good` | `w` | `did` con dato / sin dato |
    |---|---|---|---|
    | `prestamo` | sí | 2 | "le prestaste $5.000" / "le prestaste plata" |
    | `dinero` | sí | `d < 1000 ? 1 : d < 20000 ? 2 : 3` (1 sin dato) | "le diste $20.000" / "le diste plata" |
    | `regalo` | sí | 1 (quien lo guarda puede pasar 2) | "le regalaste {d en minúsculas}" / "le hiciste un regalo" |
    | `apoyo` | sí | 1 | "lo escuchaste cuando lo necesitaba" (la escuchaste…) |
    | `inversion` | sí | 2 | "invertiste $5.000 en su idea" / "invertiste en su idea" |
    | `discurso` | sí | 1 | "diste el discurso en su boda" |
    | `insulto` | no | 1 | "le dijiste que {d}" / "lo insultaste" |
    | `golpe` | no | 3 | "le pegaste" |
    | `espiar` | no | 2 | "lo espiaste" |
    | `broma` | no | 1 | "le hiciste una broma que salió mal" |
    | `infidelidad` | no | 3 | "lo engañaste con {d}" / "lo engañaste" |
    | `ruptura` | no | 2 | "lo dejaste" |
    | `divorcio` | no | 3 | "le pediste el divorcio" |
    | `humillacion` | no | 2 | "lo dejaste en ridículo en el trabajo" |
    | `revancha` | no | 2 | "le devolviste el golpe" |

    `revancha` es el "recuerdo malo nuevo" de la especificación §2 cuando devuelves el golpe. Los montos van con
    `U.money`.
  - En `MV.sys.memory`:
    - **`remember(g, id, k, d?, w?) -> recuerdo | null`:**
      - devuelve `null` sin hacer nada si: el jugador no vive, la relación no existe, es `mascota` o `acosador`, o la
        persona no es humana;
      - si ya hay un recuerdo `k` sin `done`, lo refuerza: `|v|` sube 1 hasta 3, `d` se suma si es número (si no, se
        reemplaza) y `a` pasa a la edad actual;
      - si no, agrega `{ k, a: p.age, v: (good ? 1 : -1) * peso, d }`, con `peso = w ?? (typeof K.w === 'function' ?
        K.w(d) : K.w)`;
      - con más de 6, descarta: primero los `done` (el más viejo); si no hay, el de menor `|v|` y, a igualdad, el de
        menor `a`.
    - **`said(g, n, m) -> string`:** `MV.MEMORY_KINDS[m.k].did(n, m.d)`.
    - **`ago(g, m) -> string`:** `` `hace ${p.age - m.a} años` `` ("hace 1 año" con 1).

- [ ] **Step 1: Write the failing tests** en `tests/memoria.test.js`, con los ayudantes de arriba:
  - **`'guardar un recuerdo'`:** `remember(g, n.id, 'prestamo', 5000)` deja `r.mem = [{ k: 'prestamo', a: 30, v: 2,
    d: 5000 }]` y devuelve ese recuerdo.
  - **`'repetir refuerza el mismo recuerdo'`:**
    - tres `prestamo` de 1.000 a los 30, 31 y 32 años dejan uno solo con `v === 3`, `d === 3000` y `a === 32`;
    - dos `insulto` con textos distintos dejan uno con `v === -2` y el último texto;
    - con el primero marcado `done`, un nuevo `prestamo` crea otro.
  - **`'el peso del dinero depende del monto'`:** 500 → 1, 1.000 → 2, 20.000 → 3; y `remember(..., 'regalo', 'Reloj',
    2)` deja `v === 2`.
  - **`'nunca más de 6, y el orden de descarte'`:**
    - con 6 recuerdos sin `done`, el séptimo descarta el de menor `|v|` y, a igualdad, el más viejo;
    - con uno `done` entre los 6, el séptimo descarta ese.
  - **`'quiénes no guardan recuerdos'`:** devuelve `null` y no crea `mem` con una mascota, con un acosador, con un id
    que no está en tus relaciones y con el jugador muerto.
  - **`'cada tipo se lee bien con y sin dato'`** (Foco 2): para los 15 tipos, con persona de ambos géneros, con dato y
    con `d` ausente, `said` devuelve texto sin marcas prohibidas; con dato, el texto incluye el monto con `U.money` o
    el dato; `ago` da "hace 1 año" y "hace 15 años".
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, `MV.sys.memory` no existe.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Las personas guardan recuerdos de lo que les hiciste"`.

---

### Task 2: De dónde salen los recuerdos

**Files:**
- Modify: `js/systems/rels.js`, `js/data/events/adultez.js`, `js/data/events/trabajo.js`, `js/systems/talkcat.js`
- Test: `tests/memoria.test.js`

**Interfaces:**
- Consumes: `remember` (Tarea 1).
- Produces: cada fuente llama a `MV.sys.memory.remember` con la persona correcta:

  | Fuente | Dónde | Llamada |
  |---|---|---|
  | "Prestarle dinero" | `rels.js` acción `prestar` | `'prestamo', 1000` |
  | "Prestarle" | `adultez.js` `amigo_prestamo` | `'prestamo', 1000` |
  | "Darle dinero" | `rels.js` acción `dar_dinero` | `'dinero', amt` |
  | "Hacer un regalo" | `rels.giveGift`, cuando el regalo se entrega | `'regalo', gift.name, gift.price >= 500 ? 2 : 1` |
  | "Escuchar" | `rels.js` acción `escuchar` | `'apoyo'` |
  | "Invertir $5.000" | `adultez.js` `inversion_amigo` | `'inversion', 5000` (salga bien o mal) |
  | "Discurso emotivo" | `adultez.js` `discurso_boda`, solo si sale bien | `'discurso'` |
  | "Insultar" | `rels.js` acción `insultar` | `'insulto', lo que le dijiste` |
  | "Atacar" | `rels.js` acción `atacar` | `'golpe'` |
  | "Revisar su celular" | `rels.js` `espiar_celular`, solo si te descubre | `'espiar'` |
  | Espiar con tu gato | `talkcat.prank`, solo si te descubren | `'espiar'` |
  | "Hacerle una broma" | `rels.js` `broma`, solo si sale mal | `'broma'` |
  | Infidelidad descubierta | `rels.yearly`, al encolar `infiel_descubierto` | `'infidelidad', nombre del amante` (a tu pareja) |
  | Terminar la relación | `rels.breakUp` | `'ruptura'` |
  | Divorcio | `rels.divorce` con `theyLeft` falso | `'divorcio'` |
  | "Culpar a un compañero" | `trabajo.js` `trabajo_error` | `'humillacion'` (al compañero culpado, te crean o no) |
  | "Reclamar ante el jefe" | `trabajo.js` `trabajo_credito`, solo si el jefe te da la razón | `'humillacion'` (al rival) |

  Las opciones de evento escritas como objeto (`inversion_amigo`, `discurso_boda`) pasan a función, con las mismas
  probabilidades y efectos, y llaman a `MV.fx.apply` con el objeto de siempre. "Insultar" elige primero la frase, la
  usa en su texto y la guarda como dato.

- [ ] **Step 1: Write the failing tests:**
  - **`'cada fuente deja su recuerdo'`:** para cada fila de la tabla, con la persona en tus relaciones, se ejecuta la
    acción con `MV.doAction` o la opción del evento con `MV.EV.push` + `MV.EV.view` + `MV.EV.choose`. Las que dependen
    del azar se recorren con semillas hasta ver el caso. Se comprueba que esa persona tiene un recuerdo con el `k`, el
    signo y el dato de la tabla.
  - **`'lo que no deja recuerdo'`:**
    - un espionaje del celular que no te descubren;
    - una broma que sale bien;
    - un discurso emotivo que sale mal;
    - un divorcio que pide tu ex (`rels.divorce(g, n, true)`);
    - "Pedir un consejo".
  - **`'los efectos de siempre no cambian'`:** `inversion_amigo` sigue costando $5.000 y, en 400 semillas, sale bien
    entre el 22 % y el 38 %; `discurso_boda` mantiene sus resultados.
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, la persona no tiene `mem`.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Prestar, regalar, insultar, engañar y más dejan recuerdos"`.

---

### Task 3: Favores

**Files:**
- Create: `js/data/events/memoria.js`
- Modify: `js/systems/money.js`, `js/systems/talkcat.js`, `js/core/events.js` (`stillValid`), `index.html`
  (`js/data/events/memoria.js` después de `js/data/events/gato.js`)
- Test: `tests/memoria.test.js`

**Interfaces:**
- Consumes: `said`, `ago` (Tarea 1).
- Produces:
  - **`MV.sys.money.dues(g) -> number`:** la suma de `Math.min(l.pay, l.left)` de los préstamos con
    `l.start <= p.age` y `l.left > 0`.
  - **`MV.sys.money.income(g) -> number`:** sueldo más pensión. `talkcat.risk` pasa a usar las dos, sin cambiar su
    resultado.
  - **`EV.stillValid`** llama a `d.when(g, ctx)`, así los eventos con `pushOnly` pueden comprobar su persona.
  - **`MV.MEMORY_FAVORS`:** lista ordenada de `{ id, when(g, r, n, ctx), ok(g, r, n, ctx) -> string }`. El orden es la
    prioridad de la especificación §2:

    | `id` | `when` | `ok` |
    |---|---|---|
    | `abogado` | `p.prison` | `p.prison.left = max(1, left - 1)` |
    | `plata` | `p.money < 0` o `dues(g) > p.money + income(g)` | dinero `+ clamp(max(falta, base), 2000, 50000)`; `falta = max(0, dues - p.money, -p.money)`; `base = 2 × (d numérico o 1000)` |
    | `entrevista` | sin trabajo, 18 a 64 años, sin estudiar, sin jubilar, no preso, y algún `J` de `MV.JOBS` con `career.meets(g, J).ok` | encola al frente `oferta_trabajo` con `{ job: J.id, level: 0, salary: round(J.pay[0] × U.float(0.9, 1.1)) }` |
    | `cuidado` | salud menor que 40, o una enfermedad con `drain[1] >= 8` o `urgent` | salud +10, felicidad +6, estrés −5 |
    | `pareja` | tienes pareja o cónyuge, que no es esta persona, con relación menor que 40 | relación con tu pareja +15 |
    | `regalo` | siempre | 50 %: un viaje (felicidad +10, estrés −8, `counters.viajes` +1); si no, `+U.int(300, 2000)` de dinero y felicidad +4 |

  - **`memory.favorFor(g, r, n, ctx) -> id`:** el primero cuyo `when` se cumple (siempre hay uno).
  - **Evento `mem_favor`:** `pushOnly`, `prison: 'any'`, `when: (g, ctx) => !!MV.relOf(g, ctx.target)`, `target` en
    `ctx`. Su `ctx` es `{ target, k, a, d, v }`, con `v` el id del favor.
    - `title`: "Un favor de vuelta".
    - `text`: nombra a la persona, lo que hiciste (`said`), hace cuánto (`ago`) y qué te ofrece.
    - Opciones:
      - "Aceptar": `ok` del favor;
      - "Rechazarlo con orgullo": relación −2.

- [ ] **Step 1: Write the failing tests** (ayudante `favor(MV, g, n, k, d, v)` que encola `mem_favor` y devuelve la
  vista):
  - **`'cada favor encaja con tu situación'`:** para cada fila, una partida armada para que solo esa condición se
    cumpla: `favorFor` devuelve ese id, y "Aceptar" hace su efecto exacto:
    - `abogado` con 4 años por cumplir deja 3; con 1, sigue en 1;
    - `plata` en rojo por $700 da $2.000 con un préstamo de dato 500, y $10.000 con dato 5.000; nunca más de $50.000;
    - `entrevista` encola `oferta_trabajo` al frente, con un trabajo para el que cumples requisitos;
    - `cuidado`, `pareja` y `regalo` con sus valores.
  - **`'el orden de los favores'`:** preso y en rojo da `abogado`; en rojo y sin trabajo da `plata`.
  - **`'el texto nombra a la persona, el hecho y los años'`:** con ambos géneros y con y sin dato, el texto incluye
    `n.first`, `said` y `ago`, sin marcas prohibidas.
  - **`'rechazar con orgullo'`:** baja la relación 2 y no cambia nada más.
  - **`'el favor también llega a la cárcel'`:** con `p.prison`, la vista de `mem_favor` se muestra.
  - **`'el riesgo de deudas del gato no cambia'`:** las pruebas de deudas de `tests/gato.test.js` siguen pasando.
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, "Evento desconocido: mem_favor".

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Los favores vuelven según lo que te pasa"`.

---

### Task 4: Vueltas de la vida y "Ya te perdoné"

**Files:**
- Modify: `js/data/events/memoria.js`
- Test: `tests/memoria.test.js`

**Interfaces:**
- Consumes: `said`, `ago` (Tarea 1); `favorFor` (Tarea 3).
- Produces:
  - **`MV.MEMORY_TWISTS`:** `{ id, kinds, when(g, r, n, ctx), ok(g, r, n, ctx) -> string }`:

    | `id` | `kinds` | `when` | `ok` |
    |---|---|---|---|
    | `empresa` | prestamo, inversion, dinero | la persona tiene 25 años o más | dinero `+ min(100000, max(5000, 5 × (d numérico o 1000)))` |
    | `devuelve` | prestamo | — | dinero `+ 2 × (d numérico o 1000)` |
    | `medico` | apoyo | la persona tiene 25 años o más | cura tu primera enfermedad; si no tienes, salud +8 |
    | `padrino` | discurso | la persona tiene entre 22 y 50 años | felicidad +8, relación +10, karma +2 |
    | `recomienda` | todos los buenos | tienes trabajo | rendimiento +15 (hasta 100) |

    Ninguna sale si estás preso.
  - **`memory.twistFor(g, r, n, ctx) -> id | null`:** uno al azar entre los que encajan con `ctx.k` y su `when`.
  - **Evento `mem_vuelta`:** igual que `mem_favor` pero sin `prison: 'any'`. `title`: "Vueltas de la vida". Opciones:
    "Aceptar" (`ok`) y "Decirle que no hacía falta" (relación +5).
  - **Evento `mem_perdon`:** `pushOnly`, `prison: 'any'`, mismo `when` y `ctx`. `title`: "Ya te perdoné". El texto
    nombra lo que hiciste y que ya lo superó. Opciones: "Agradecer" (relación +8, felicidad +3) y "Hacerte el
    distraído" (relación −2).

- [ ] **Step 1: Write the failing tests:**
  - **`'cada vuelta de la vida'`:** para cada fila, `twistFor` la ofrece con su tipo y su condición, no la ofrece con
    otro tipo, y "Aceptar" hace el efecto exacto (con y sin dato).
  - **`'sin vuelta posible devuelve null'`:** un recuerdo `regalo` sin trabajo da `null`; estando preso, siempre
    `null`.
  - **`'ya te perdoné'`:** "Agradecer" sube la relación 8 y la felicidad 3; "Hacerte el distraído" baja la relación 2.
  - **`'los textos nombran a la persona, el hecho y los años'`:** los de `mem_vuelta` y `mem_perdon`, con ambos géneros
    y con y sin dato, sin marcas prohibidas.
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, `twistFor` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Vueltas de la vida y perdones"`.

---

### Task 5: Venganzas

**Files:**
- Modify: `js/data/events/memoria.js`
- Test: `tests/memoria.test.js`

**Interfaces:**
- Consumes: `remember`, `said`, `ago` (Tarea 1).
- Produces:
  - **`MV.MEMORY_REVENGES`:** `{ id, when(g, r, n), hit(g, r, n) -> string }`. Ninguna toca el dinero:

    | `id` | `when` | `hit` |
    |---|---|---|
    | `pareja` | tienes pareja o cónyuge que no es esta persona | relación con tu pareja −15 |
    | `jefe` | tienes trabajo | rendimiento −15 (hasta 0); relación con tu jefe −10 si hay jefe |
    | `auto` | tienes un auto | ese auto pierde 20 de condición (hasta 0) |
    | `escrache` | fama 20 o más | fama −5, felicidad −6 |
    | `fiesta` | vives en una casa propia | felicidad −8 |
    | `chismes` | siempre | felicidad −5 |

  - **`memory.revengesFor(g, r, n) -> id[]`:** todas las que encajan (`chismes` siempre está).
  - **Evento `mem_venganza`:** `pushOnly`, sin `prison: 'any'`, mismo `when` y `ctx` (`v` = id de la venganza).
    `title`: "Te la tenía guardada". El texto nombra a la persona, lo que hiciste, hace cuánto y qué hizo. Opciones:
    - **"Disculparte":** con chance `0.4`, la acepta: relación +10 y no hay daño; si no, `hit`;
    - **"Devolver el golpe":** `hit`, felicidad +3 y `remember(g, n.id, 'revancha')`. Si la persona no es de tu familia
      (`MV.FAMILY`) ni tu pareja, cónyuge o amante, su relación pasa a `enemigo`; si lo es, la relación baja 25;
    - **"Ignorarlo":** `hit`.

- [ ] **Step 1: Write the failing tests:**
  - **`'cada venganza encaja con tu situación'`:** con todas las condiciones, `revengesFor` da las 6; sin pareja, sin
    trabajo, sin auto, con fama 0 y alquilando, solo `chismes`. Cada `hit` hace su efecto exacto.
  - **`'las tres respuestas'`:** con 300 semillas, "Disculparte" es aceptada entre 30 % y 50 % (relación +10, sin daño)
    y si no, hay daño; "Ignorarlo" siempre hace daño.
  - **`'devolver el golpe'`:** con un amigo, pasa a enemigo y guarda `revancha`; con un hermano y con tu cónyuge,
    siguen siendo hermano y cónyuge, con la relación 25 más baja, y guardan `revancha`.
  - **`'una venganza nunca quita dinero ni mata'`** (Foco 3): con el dinero en $−500, en $0 y en $100.000, cada
    venganza con cada respuesta deja el dinero igual, el jugador vivo, sin `p.prison` y sin `juicio` en la cola.
  - **`'los textos nombran a la persona, el hecho y los años'`:** con ambos géneros y con y sin dato, sin marcas
    prohibidas.
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, `revengesFor` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Rencores que se cobran, con disculpas y revanchas"`.

---

### Task 6: Cuándo vuelve un recuerdo

**Files:**
- Modify: `js/systems/memory.js`, `js/systems/year.js`
- Test: `tests/memoria.test.js`

**Interfaces:**
- Consumes: `favorFor` (Tarea 3); `twistFor` (Tarea 4); `revengesFor` (Tarea 5).
- Produces en `MV.sys.memory`:
  - **`recall(g) -> [{ r, n, m }]`:** recuerdos sin `done`, de hace 3 años o más, de personas humanas vivas que siguen
    en tus relaciones (no `mascota` ni `acosador`), con `r.memNext` ausente o `p.age >= r.memNext`.
  - **`outcome(g, r, n, m) -> { ev, v }`:**
    - bueno: con `twistFor` no nulo y `U.chance(0.3)`, `{ ev: 'mem_vuelta', v: twist }`; si no,
      `{ ev: 'mem_favor', v: favorFor(...) }`;
    - malo con `r.rel >= 70`: `{ ev: 'mem_perdon', v: null }`;
    - malo con menos: `{ ev: 'mem_venganza', v: U.pick(revengesFor(...)) }`.
  - **`yearly(g) -> void`:**
    - nada si el jugador no vive, la partida terminó o tiene menos de 8 años;
    - toma `recall(g)`; en prisión, solo los buenos;
    - si hay alguno, con `U.chance(0.2)`, sortea uno con peso `|m.v| × (p.age - m.a)`;
    - marca `m.done = true` y `r.memNext = p.age + 5`;
    - encola `outcome.ev` con `{ target: n.id, k: m.k, a: m.a, d: m.d, v: outcome.v }`.
  - `year.js`: `MV.sys.memory.yearly(g);` después de `MV.sys.talkcat.yearly(g);`.

- [ ] **Step 1: Write the failing tests:**
  - **`'nada vuelve antes de 3 años'`:** un recuerdo de hace 2 años no está en `recall`; de hace 3, sí.
  - **`'uno por año, cerca del 20 %'`:** con 5 personas con recuerdos viejos, en 500 semillas `yearly` encola un evento
    de memoria entre el 15 % y el 25 % de las veces, y nunca más de uno.
  - **`'cada recuerdo vuelve una vez, y la persona espera 5 años'`:** tras volver, ese recuerdo queda `done` y los
    otros de la misma persona no están en `recall` hasta `p.age + 5`.
  - **`'el evento correcto'`:** bueno → `mem_favor` o `mem_vuelta`, y en 400 semillas con una vuelta posible, entre
    20 % y 40 % es `mem_vuelta`; malo con relación 70 → `mem_perdon`; malo con 69 → `mem_venganza`.
  - **`'desde la cárcel, solo favores'`:** preso, con un recuerdo bueno y uno malo, `yearly` solo encola `mem_favor`.
  - **`'los que se fueron no vuelven'`:** recuerdos de una persona muerta, de una sacada de tu vida y de una mascota no
    están en `recall`.
  - **`'si la persona ya no está, su decisión desaparece'`** (Foco 1): con `mem_favor` y `mem_venganza` en la cola, tras
    `MV.sys.people.die` de la persona, y aparte tras `MV.removeRel`, `MV.EV.view` no los muestra y no hay error.
  - **`'el cierre del año lo usa'`:** con un recuerdo viejo y `U.chance` forzado por semilla, `MV.ageUp` encola un
    evento de memoria en alguna de 200 semillas.
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, `recall` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Cada año puede volver un recuerdo viejo"`.

---

### Task 7: Acosadora o acosador

**Files:**
- Modify: `js/systems/memory.js`, `js/data/events/memoria.js`, `js/core/state.js`, `js/systems/rels.js`,
  `js/data/events/general.js` (`fan_obsesivo`), `js/ui/sheets.js` (`GROUP`)
- Test: `tests/memoria.test.js`

**Interfaces:**
- Consumes: `yearly` (Tarea 6).
- Produces:
  - **Tipo `acosador`:** `REL_LABEL.acosador = ['Acosador', 'Acosadora']`; `MV.REL_ORDER` lo suma antes de
    `'enemigo'`; `GROUP.acosador = 'Acoso'`.
  - En `MV.sys.memory`:
    - **`makeStalker(g, n, from) -> boolean`:** solo si no hay otro acosador activo y `p.counters.acosadores` es menor
      que 2. Hace `MV.addRel(g, n, 'acosador', 40)`, pone `r.stalk = { stage: 1, since: p.age }`, suma el contador y
      deja una línea en el diario. `from` es `'noche'`, `'ruptura'` o `'fan'`.
    - **`stalkRespond(g, id, how) -> string`:** `how` es `hablar`, `bloquear`, `policia`, `orden`, `mudarte` o
      `ignorar`:

      | `how` | Costo | Termina |
      |---|---|---|
      | `hablar` | — | 25 % |
      | `bloquear` | — | 50 % en la etapa 1; en otras etapas no funciona |
      | `policia` | — | 40 % |
      | `orden` | $5.000 | siempre; 20 % antes la viola una vez (estrés +10) |
      | `mudarte` | $2.000 | 70 % |
      | `ignorar` | — | nunca: hace el daño de su etapa y sube una etapa (hasta 3) |

      Si un intento falla: estrés +3 y la etapa no cambia. El daño por etapa: 1 → estrés +6; 2 → estrés +8 y
      felicidad −5; 3 → relación con tu pareja −10 y estrés +8, o el daño de la etapa 2 si no tienes pareja. Al
      terminar: `MV.removeRel`, una línea de cierre en el diario y un texto de resultado.
    - **`stalkActions(g, r, n) -> action[]`:** `acoso_hablar`, `acoso_bloquear` (solo en la etapa 1), `acoso_policia`,
      `acoso_orden` (con `$5.000`), `acoso_mudarte` (con `$2.000`). Todas con `limit: 1` y un `check` que las bloquea
      si `r.stalk.acted === p.age`; al usarlas, `r.stalk.acted = p.age`.
    - **`stalkYearly(g) -> void`:** la llama `yearly`. Con un acosador vivo, sin estar preso y sin
      `r.stalk.acted === p.age - 1`, con 60 % encola `acoso` con `{ target: n.id }`.
  - **Evento `acoso`:** `pushOnly`, `when: (g, ctx) => (MV.relOf(g, ctx.target) || {}).type === 'acosador'`. El texto
    depende de la etapa (mensajes, aparece, tu pareja). Opciones: las cinco respuestas con sus condiciones, más
    "Ignorarla" o "Ignorarlo".
  - `rels.actions`: para `t === 'acosador'` devuelve solo `stalkActions(g, r, n)`.
  - **Cómo empieza:**

    | Dónde | Chance |
    |---|---|
    | `despues_noche`, "👋 Solo fue una noche" | 6 % |
    | `rels.breakUp` | 8 % |
    | `rels.divorce` con `theyLeft` falso | 8 % |
    | `fan_obsesivo`, "Responderle con amabilidad" cuando sale mal | 30 %, con un fan nuevo (`MV.newNPC`, 18 a 45 años) |

    "Responderle con amabilidad" pasa a función con su 70 % y sus efectos de siempre.

- [ ] **Step 1: Write the failing tests:**
  - **`'cómo empieza'`:** cada fuente, recorrida con semillas, crea un acosador con su chance: entre 3 % y 9 % para la
    noche (1.000 semillas), entre 5 % y 11 % para ruptura y divorcio, y entre 20 % y 40 % de los fallos del fan. El
    divorcio que pide tu ex nunca.
  - **`'uno a la vez y dos por vida'`:** con uno activo, `makeStalker` devuelve `false`; tras terminar dos, el tercero
    también.
  - **`'cada respuesta'`:** con 400 semillas por respuesta, la eficacia queda dentro de ±10 puntos de la tabla:
    - `bloquear` en la etapa 2 nunca termina;
    - `orden` siempre termina y cobra $5.000;
    - `mudarte` cobra $2.000;
    - un fallo deja la etapa igual con estrés +3;
    - `ignorar` sube de etapa con su daño y se queda en 3.
  - **`'el daño de la etapa 3'`** (Foco 4): con pareja, baja esa relación 10; sin pareja, hace el daño de la etapa 2.
  - **`'la decisión anual'`** (Foco 4): con un acosador, `stalkYearly` encola `acoso` entre el 50 % y el 70 % de 400
    semillas; nunca preso; nunca si respondiste desde la ficha el año anterior.
  - **`'su ficha'`:** `rels.actions` de un acosador da solo las acciones `acoso_*` (sin conversar, regalos ni "Sacar de
    tu vida"); la segunda en el mismo año queda bloqueada; `acoso_orden` no aparece con $4.999.
  - **`'no guarda recuerdos ni le vuelven'`:** `remember` con un acosador devuelve `null`; si era tu ex con recuerdos,
    al volverse acosador no aparece en `recall`.
  - **`'los textos'`:** el evento `acoso` en sus tres etapas, con ambos géneros y con y sin pareja, sin marcas
    prohibidas; nada de contenido sexual.
- [ ] **Step 2: Run** `node --test tests/memoria.test.js`.

  Expected: FAIL, `makeStalker` no es una función.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Acosadores: cómo empiezan, cómo escalan y cómo se terminan"`.

---

### Task 8: Heredero, partidas, interfaz, jugador automático y README

**Files:**
- Modify: `tests/ui-smoke.js`, `tests/agent.js` (si hace falta), `README.md`
- Test: `tests/memoria.test.js`, `tests/ui-smoke.js`

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Write the failing tests:**
  - **`'el heredero empieza sin recuerdos'`:** un jugador de 70 con recuerdos en sus hijos, su pareja y un amigo muere;
    en la partida del heredero ninguna relación tiene `mem`, `memNext` ni `stalk`, y `counters.acosadores` es 0.
  - **`'la partida guardada conserva todo'`** (Foco 5): `JSON.parse(JSON.stringify(g))` conserva `mem`, `memNext` y
    `stalk`, y `MV.sys.memory.yearly` y `MV.ageUp` corren sobre la copia. Una partida sin esos campos tampoco falla.
  - **`'el jugador automático vive 30 vidas con memoria'`:** `live(MV, g, { acts: 4 })` con semillas 600–629 termina
    sin errores; en alguna vuelve un recuerdo (`g.evDone` tiene un `mem_*`). Además, en 40 vidas con semillas
    700–739, alguna tiene un acosador.
  - **Humo** (bloque "Memoria y acoso" antes de `// Avanzar 5 años`):
    - se crea un acosador con `makeStalker` y se abre Relaciones: aparece el grupo "Acoso" con su nombre;
    - en su ficha están las respuestas y no "Conversar";
    - se encola `mem_favor` para un amigo y aparece la tarjeta con su nombre;
    - ningún texto tiene "null", "undefined" ni "NaN".
- [ ] **Step 2: Run** `node --test tests/memoria.test.js && node tests/ui-smoke.js`.

  Expected: la prueba del heredero y la de la partida guardada pasan si las tareas anteriores están bien (son de
  protección). Las del jugador automático y el humo deciden si hace falta tocar `tests/agent.js` o la interfaz.

- [ ] **Step 3: Implement** lo que falte:
  - si las vidas no muestran acosadores ni recuerdos, `special()` de `tests/agent.js` suma una rama chica que use
    `prestar`, `insultar`, `dar_dinero` y termine relaciones;
  - **README:** una fila "Memoria" (recuerdos, favores, vueltas de la vida, perdones y venganzas) y la mención de los
    acosadores; las cantidades de eventos y logros pasan a las reales.
- [ ] **Step 4: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Memoria y acosadores: heredero, partidas, interfaz, jugador automático y README"`.
