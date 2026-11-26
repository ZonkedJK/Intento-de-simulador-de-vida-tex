# A2 — Vida escolar — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** en primaria y secundaria tienes un curso con nombre (tutor y compañeros con papel), una barra de
popularidad, la opción de ser el abusón, y un promedio de egreso que pesa en la universidad. Además, las personas
reaccionan según su personalidad y en la universidad puede haber romance con un docente.

**Architecture:**
- Un sistema nuevo, `MV.sys.school`, con el molde de `MV.sys.workplace`. Guarda el curso en `p.edu.class` y la
  popularidad en `p.edu.pop`.
- Un sistema nuevo, `MV.sys.persona`, envuelve cada acción de relación. Mide cuánto cambió la relación, lo ajusta según
  los rasgos y suma una línea de reacción. Las 8 reacciones especiales viven en las acciones que las disparan.
- Las notas, el examen y la beca se tocan en `js/systems/edu.js`. Los eventos nuevos van en un archivo propio.

**Tech Stack:** JavaScript plano en scripts clásicos bajo `window.MV`, sin compilación. Pruebas con `node --test` y
prueba de humo con Playwright.

**Spec:** `docs/superpowers/specs/2026-11-25-vida-escolar-design.md`

## Global Constraints

- **Archivos y pruebas:**
  - Los archivos nuevos se agregan a `index.html`: `tests/load.js` carga los scripts que lista esa página.
  - Pruebas: `node --test tests/*.test.js` (nunca `node --test tests/`).
  - Humo: `node tests/ui-smoke.js`, que termina con "Interfaz OK". Tiene fallos al azar previos, así que ante un fallo
    se corre una vez más antes de concluir.
- **Datos:** `MV.VERSION` sigue en 9. Todos los datos nuevos son opcionales y el código funciona si faltan.
- **Contenido:**
  - Personas y negocios inventados. Humor sin contenido explícito.
  - Todos los compañeros son menores. Nada sexual, nunca.
  - El bullying es burla, exclusión, bromas pesadas, quitar la merienda y rumores: nada de golpes descritos, heridas,
    armas ni autolesiones.
  - **El tutor y los profesores de la escuela nunca pueden ser romance, a ninguna edad.** El romance con un docente
    existe solo en la universidad, la técnica o el posgrado, con 18 o más, y como mucho con un fundido a negro.
- **Textos:**
  - En español, con concordancia de género del jugador y de cada persona (`U.gw`, `MV.gt` para nombres "m|f").
  - Ningún texto muestra `undefined`, `null`, `NaN`, `[object` ni `{clave}`.
  - Ningún texto dice que eres popular con la barra por debajo de 70, ni que nadie te quiere con la barra por encima
    de 30.
- **Dinero:** ninguna opción deja `p.money` en negativo. Las que cuestan llevan `when`.
- **Commits:** terminan con las líneas de atribución de la sesión.

## Review Focus

1. **Un compañero muere o sale de tu vida con su evento en la cola:** el evento desaparece sin error, y el papel se
   llena en el año escolar siguiente. Prueba en la Tarea 4 (papel) y en la Tarea 8 (evento).
2. **Partida vieja a mitad de la escuela,** sin `p.edu.class` ni `p.edu.pop`: el año siguiente arma el curso, y la
   pestaña Ocupación se dibuja sin errores. Prueba en las Tareas 4 y 10.
3. **Jugador en el centro de menores durante la secundaria:** no hay eventos ni cambios del curso, y al salir sigue
   igual. Prueba en la Tarea 5.
4. **Personas con rasgos viejos,** o con `traits: []` (el jugador anterior muerto), y acciones sin grupo: el factor es
   1, no hay errores ni líneas rotas. Prueba en la Tarea 2.
5. **Un jugador que cumple 18 en la secundaria** no puede coquetear con su tutor, y el romance con un docente solo sale
   en estudios superiores. Prueba en las Tareas 4 y 9.

## Archivos

| Archivo | Qué |
|---|---|
| `js/data/personality.js` (nuevo) | `MV.TRAIT_INFO` y `MV.ACTION_TAGS` |
| `js/systems/personality.js` (nuevo) | `MV.sys.persona`: etiqueta, factor, ajuste, envoltura, umbral de perdón |
| `js/data/school.js` (nuevo) | `MV.TEACHER_KINDS`, `MV.CLASS_ROLES`, `MV.SCHOOL` |
| `js/systems/school.js` (nuevo) | `MV.sys.school`: curso, popularidad, abusón, romance universitario |
| `js/data/events/escuela.js` (nuevo) | 12 eventos de la escuela y 2 de la universidad |
| `js/core/state.js` | 4 rasgos nuevos; tipos de relación `curso` y `profe` |
| `js/systems/rels.js` | Envuelve las acciones; especiales; `canRomance` y "Coquetear" |
| `js/systems/edu.js` | Ganchos del curso, popularidad en acciones, `gpa`, examen y beca |
| `js/systems/memory.js` | Umbral de perdón y peso de rencor por rasgo |
| `js/data/events/infancia.js`, `adolescencia.js` | `abuson`, `pelea_patio` y `nerd_amigo` usan el curso |
| `js/data/goals.js` | 3 logros |
| `js/ui/sheets.js` | Etiquetas de rasgos, grupos nuevos, curso y popularidad en Estudios |
| `tests/personas.test.js`, `tests/escuela.test.js` (nuevos), `tests/agent.js`, `tests/ui-smoke.js`, `README.md` | Pruebas y documentación |

**Ayudantes de prueba** (al principio de los dos archivos de prueba nuevos):

```js
const BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/;
/** Partida con el jugador a esa edad, sin cola ni relaciones. */
function game(MV, seed, age) {
  const g = MV.newGame({ seed }); g.p.age = age == null ? 30 : age; g.queue = []; g.p.rels = [];
  return g;
}
/** Persona con esos rasgos y ese tipo de relación. */
function person(MV, g, type, traits, extra) {
  const n = MV.newNPC(g, Object.assign({ age: 30, traits: traits || [] }, extra || {}));
  return { n, r: MV.addRel(g, n, type || 'amigo', 50) };
}
/** Alumno de esa edad en la etapa dada, con su curso armado. */
function student(MV, seed, age, stage) {
  const g = game(MV, seed, age);
  MV.sys.edu.start(g, stage || (age < 12 ? 'primaria' : 'secundaria'));
  return g;
}
```

---

### Task 1: Rasgos que concuerdan y su tabla

**Files:**
- Create: `js/data/personality.js`, `tests/personas.test.js`
- Modify:
  - `js/core/state.js:35` (`MV.TRAITS`);
  - `js/ui/sheets.js:577` (etiquetas);
  - `index.html` (`js/data/personality.js` después de `js/data/companies.js`).

**Interfaces:**
- Produces:
  - **`MV.TRAITS`:** los 14 de hoy más `'rencoroso'`, `'tímido'`, `'competitivo'` y `'sensible'`, con los ids en
    masculino como hoy.
  - **`MV.TRAIT_INFO[id] = { f, up, down, flip?, forgive?, spite? }`:**
    - `f`: la etiqueta en femenino ("tóxica");
    - `up` y `down`: `{ tag: factor }`, donde el tag `'*'` vale para todos;
    - `flip`: los tags cuyas bajadas se vuelven +2;
    - `forgive`: el umbral de perdón;
    - `spite`: el peso de los recuerdos malos.
  - Los valores salen de la tabla de la sección 10 de la spec, con estos tags:

    | Tag | Acciones (`MV.ACTION_TAGS[id]`) |
    |---|---|
    | `carino` | conversar, tiempo, cumplido, escuchar, consejo, videollamada, historias, cuento, historias_nieto, desayuno, series, cena_casera |
    | `casa` | series, cena_casera, desayuno, tiempo |
    | `consejo` | consejo |
    | `regalo` | regalo, sorpresa |
    | `plata` | pedir_dinero, prestar, dar_dinero |
    | `ofensa` | discutir, insultar, broma, atacar, espiar_celular, burla, broma_pesada, merienda |
    | `broma` | broma, broma_pesada |
    | `romance` | cita, cita_teen, coquetear, poema, votos, bailar, sorpresa |
    | `salida` | fiesta_amigo, bailar, cine_juntos, comer_afuera, gym_juntos, parque, ensenar_deporte |
    | `fiesta` | fiesta_amigo, bailar |
    | `deporte` | gym_juntos, ensenar_deporte |

    - Las acciones que no están en la tabla no tienen tags.
    - Correspondencias desde la spec: "sorpresas" es `regalo` + `romance`; "cariño en casa" es `casa`; "salidas
      deportivas" es `deporte`; "toda bajada" es `down['*']`.
    - Divertido: `flip: ['broma']`.
    - Amable y leal: `forgive: 60`. Rencoroso: `forgive: 90`.
    - Tóxico, dramático y rencoroso: `spite: 1.5`.
  - **`MV.traitLabel(id, n) -> string`:** la etiqueta con el género de `n`. Con un id desconocido devuelve el id.

- [ ] **Step 1: Write the failing tests:**
  - **`'los rasgos concuerdan con el género'`:** `traitLabel('tóxico', mujer)` es `'tóxica'`, el de un hombre es
    `'tóxico'`, y `traitLabel('amable', mujer)` es `'amable'`. Ninguno de los 18 ids devuelve vacío ni `undefined`.
  - **`'hay 18 rasgos y todos tienen tabla'`:** `MV.TRAITS.length === 18`, y cada id está en `MV.TRAIT_INFO` con `f`,
    `up` y `down`.
  - **`'cada tag de la tabla existe'`:** todo tag usado en `up`, `down` y `flip` aparece en algún `MV.ACTION_TAGS`, o
    es `'*'`.
  - **`'las personas viejas conservan sus rasgos'`:** una persona creada con `traits: ['tóxico', 'leal']` los mantiene,
    y su ficha los muestra con la etiqueta de su género.
- [ ] **Step 2: Run** `node --test tests/personas.test.js`.
  Expected: FAIL, `traitLabel` no es una función.
- [ ] **Step 3: Implement** según la Interface. `sheets.js:577` usa `MV.traitLabel(t, n)`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Rasgos con género, cuatro nuevos y su tabla de reacciones"`.

---

### Task 2: El ajuste por personalidad

**Files:**
- Create: `js/systems/personality.js`
- Modify:
  - `index.html` (`js/systems/personality.js` después de `js/systems/people.js`);
  - `js/systems/rels.js:243` (el ayudante `A`);
  - `js/systems/rels.js:216` (el regalo);
  - `js/systems/memory.js` (`outcome` y `yearly`).
- Test: `tests/personas.test.js`

**Interfaces:**
- Consumes: `MV.TRAIT_INFO` y `MV.ACTION_TAGS` (Tarea 1).
- Produces, en `MV.sys.persona`:
  - **`has(n, id) -> boolean`.**
  - **`factor(n, tags, sign) -> number`:**
    - de cada rasgo toma un solo número de `up` (si `sign > 0`) o de `down` (si `sign < 0`): entre los tags que
      coinciden, y `'*'`, el más alejado de 1;
    - multiplica los números de los dos rasgos;
    - el resultado queda entre 0,5 y 2;
    - sin rasgos o sin tags devuelve 1.
  - **`adjust(g, r, n, actionId, before) -> string`:**
    - con `d = r.rel - before` distinto de 0, deja `r.rel = clamp(before + round(d × factor))`;
    - si un tag del `flip` coincide y `d < 0`, deja `before + 2`;
    - si el factor no es 1, devuelve una línea de reacción con un 50 % de chance; si no, `''`;
    - si se disparó una especial, no toca nada y devuelve `''`.
  - **`fire()`:** lo llaman las especiales (Tarea 3) para marcar que la acción ya tuvo su reacción propia.
  - **`wrap(g, r, n, action) -> action`:**
    - devuelve la misma acción con un `run` que guarda `r.rel`, borra la marca de `fire`, corre el `run` original,
      llama a `adjust` y suma la línea al texto;
    - no envuelve si `n.species !== 'humano'`.
  - **`forgiveAt(n) -> number`:** el `forgive` más alto entre los rasgos, o 70.
  - **`spite(n) -> number`:** 1,5 si algún rasgo tiene `spite`, o 1.
- En `rels.js`: `const A = (o) => list.push(MV.sys.persona.wrap(g, r, n, o));`.
- En `giveGift`: se quita el factor viejo `tacaño ? 1.3`, porque ahora la tabla lo cubre.
- En `memory.js`:
  - `outcome` usa `r.rel >= MV.sys.persona.forgiveAt(n)` en lugar de `>= 70`;
  - el peso del sorteo de `yearly` se multiplica por `spite(n)` en los recuerdos malos.

- [ ] **Step 1: Write the failing tests:**
  - **`'cada rasgo mueve la acción hacia su lado'`:** con la misma semilla, comparada con una persona sin rasgos:
    - "Escuchar sus problemas" sube más con `['amable']` y con `['sensible']`;
    - "Insultar" baja el doble con `['dramático']`, y con `['amable']` baja 0,75 veces;
    - "Hacerle una broma" que sale mal deja la relación en `before + 2` con `['divertido']`;
    - "Ir al gimnasio juntos" sube 1,5 veces con `['competitivo']`.
  - **`'el factor queda entre 0,5 y 2'`:** `factor(n, ['ofensa'], -1)` con `['dramático', 'sensible']` es 2, y
    `factor(n, ['salida', 'fiesta'], 1)` con `['tímido', 'tranquilo']` es 0,5.
  - **`'sin rasgos o sin grupo, nada cambia'`** (Foco 4):
    - una persona con `traits: []` y una con `traits: undefined` dan factor 1;
    - "Castigar", que no tiene tags, deja la relación igual que sin envoltura;
    - ningún texto tiene marcas prohibidas.
  - **`'la línea de reacción nombra a la persona'`:** en 200 semillas de "Insultar" a alguien dramático, alguna vez la
    respuesta trae una línea con `n.first`, sin marcas prohibidas, en ambos géneros.
  - **`'el perdón depende del rasgo'`:** un recuerdo malo con relación 62 da `mem_perdon` con `['leal']` y
    `mem_venganza` sin rasgos. Con relación 85, `['rencoroso']` da `mem_venganza`. Con `['leal', 'rencoroso']` gana
    90.
  - **`'los rencorosos se vengan más'`:** con dos personas iguales con un recuerdo malo cada una, una `['rencoroso']`
    y otra sin rasgos, en 600 semillas la rencorosa es elegida entre el 53 % y el 67 % de las veces.
- [ ] **Step 2: Run** `node --test tests/personas.test.js`.
  Expected: FAIL, `MV.sys.persona` no existe.
- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS. Si una prueba vieja de relaciones cambia por la tabla, se ajusta su número esperado solo si la nueva
  regla lo explica, y se anota en el informe.
- [ ] **Step 5: Commit**: `git commit -m "La personalidad cambia cuánto le afecta lo que haces"`.

---

### Task 3: Siete reacciones especiales

La octava, la burla a alguien sensible, va en la Tarea 6.

**Files:**
- Modify: `js/systems/rels.js` (las acciones nombradas abajo)
- Test: `tests/personas.test.js`

**Interfaces:**
- Consumes: `persona.has` y `persona.fire` (Tarea 2).
- Produces: cada especial llama a `MV.sys.persona.fire()` y devuelve su propio texto:

  | # | Dónde | Condición | Efecto |
  |---|---|---|---|
  | 1 | `giveGift` | `tacaño` y regalo de $1.000 o más | relación +5 extra; a veces "lo guarda sin abrir" |
  | 2 | `insultar` | `dramático` | otra persona viva con relación con los dos (ni mascota ni acosador) baja 5 |
  | 3 | `pedir_dinero` | `generoso` y te da plata | te da un 50 % más |
  | 4 | `coquetear` | `tímido` | la primera vez dice que no (`r.shy = p.age`); si `p.age === r.shy + 1`, la chance se duplica (tope 0,95) |
  | 5 | `broma` | `divertido` | felicidad +3, relación +5 |
  | 6 | `tiempo`, `cine_juntos`, `cena_casera` | `fiestero` | felicidad +4, estrés +3 |
  | 7 | `espiar_celular` | `celoso` | relación −5 extra; si tienes un `amante` vivo, encola `infiel_descubierto` con ese amante |

- [ ] **Step 1: Write the failing test** `'las siete especiales'`. Cada fila se da con su condición, hace su efecto
  exacto, no se da sin el rasgo y no suma la línea común. La 7 sin amante no encola nada.
- [ ] **Step 2: Run** `node --test tests/personas.test.js`.
  Expected: FAIL en la primera especial.
- [ ] **Step 3: Implement.** Para la 2, la persona que se entera sale de tus relaciones vivas humanas: alguien que la
  conoce, que sea familia de la persona insultada (`n.parentId` o un hermano) o, si no, una al azar de tus amistades.
  Así es "alguien que conocen los dos".
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Reacciones especiales según la personalidad"`.

---

### Task 4: El curso

**Files:**
- Create: `js/data/school.js`, `js/systems/school.js`, `tests/escuela.test.js`
- Modify:
  - `index.html`: `js/data/school.js` después de `js/data/personality.js`, y `js/systems/school.js` después de
    `js/systems/edu.js`;
  - `js/core/state.js:38-44`;
  - `js/systems/edu.js`: `start`, `graduate`, `drop` y la repetición en `yearly`;
  - `js/systems/rels.js`: `canRomance` y la lista de "Coquetear";
  - `js/ui/sheets.js:537` (`GROUP`).

**Interfaces:**
- Produces:
  - **`MV.TEACHER_KINDS`:**
    - `exigente { perf: -3, study: 2 }`;
    - `buena { perf: 3 }`;
    - `distraido { cheat: 0.15 }`;
    - `estricto { cheat: -0.15, catch: 0.15, stress: 2 }`;
    - `cansado {}`.
    Cada uno con `icon` y `name` en formato "m|f" ("Distraído|Distraída"; "Buena onda" sin barra).
  - **`MV.CLASS_ROLES`:**
    - `amigo { name: 'mejor amigo|mejor amiga', rel: [65, 80] }`;
    - `rival { rel: [35, 50] }`;
    - `abuson { name: 'abusón|abusona', rel: [20, 35], chance: 0.6 }`;
    - `payaso { name: 'payaso del curso|payasa del curso', rel: [50, 65] }`;
    - `crush { name: 'te gusta', rel: [45, 60], minAge: 14 }`.
    Cada uno con `icon`.
  - **`MV.SCHOOL = { CATCH: 0.25, EXPEL: 3, HIGH: 70, LOW: 30 }`.**
  - **Tipos de relación nuevos:**
    - `curso`, que se muestra como "Compañero de curso" / "Compañera de curso";
    - `profe`, que se muestra como "Profesor" / "Profesora".
    Los dos van después de `amigo` en `MV.REL_ORDER`. `GROUP.curso = 'Compañeros de curso'` y
    `GROUP.profe = 'Profesores'`.
  - **`p.edu.class = { teacher: { id, kind }, mates: [{ id, role }] }`**, donde `role` es una clave de
    `MV.CLASS_ROLES` o `'comun'`.
  - **En `MV.sys.school`:**
    - **`active(p) -> boolean`:** cursas `primaria` o `secundaria` sin `e.adult`, y no estás preso.
    - **`staff(g)`:**
      - si no hay tutor vivo, crea uno con `MV.newNPC` (25 a 60 años), relación `profe` de 50 a 65, y un carácter al
        azar;
      - completa los papeles que falten con la regla de la sección 1 de la spec (promoción del mejor amigo y abusón
        con 60 %, o payaso);
      - la persona que te gusta sale de `MV.sys.rels.candidate` cuando `p.age >= 14`;
      - los compañeros tienen tu edad ±1 y relación `curso`.
    - **`cleanup(g)`:** la regla de "Cuando termina el curso". Una relación que ya no es `curso` o `profe` se queda como
      está y sale del curso.
    - **`restaff(g)`:** `cleanup` más `staff`.
    - **`teacher(g) -> { n, r, kind, K } | null`.**
    - **`mate(g, role) -> { n, r, m } | null`.**
    - **`mates(g) -> [{ n, r, m }]`.**
- **Ganchos en `edu.js`:**
  - `start` de `primaria` y `secundaria` comunes llama a `school.restaff(g)`;
  - `graduate` (de primaria y de secundaria) y `drop` llaman a `school.cleanup(g)`;
  - cuando `yearly` repite el año, llama a `school.restaff(g)`.
- **`canRomance`:** devuelve `false` si `r && r.type === 'profe'`. "Coquetear" suma `'curso'` a su lista de tipos.
- **Perder un papel:** si el mejor amigo queda con relación < 30, su `role` pasa a `'comun'`. Se revisa en `staff`, y
  `staff` corre cada año escolar (Tarea 5).

- [ ] **Step 1: Write the failing tests:**
  - **`'al empezar la primaria hay curso'`:**
    - `student(MV, s, 6)` tiene un tutor `profe` vivo, un `amigo` y un `rival`, más un `abuson` o un `payaso`;
    - todos tienen 5 a 7 años, y las relaciones iniciales están dentro de sus rangos;
    - en 300 semillas, el abusón sale entre el 50 % y el 70 % de las veces.
  - **`'desde los 14, alguien que te gusta'`:** con `student(MV, s, 14)` y `staff`, existe `crush`, y
    `canRomance(g, n, r)` es verdadero. Con 13 no existe.
  - **`'al pasar a secundaria cambia el curso'`:** al egresar de primaria, los compañeros con relación 60 o más quedan
    `amigo`, el resto sale de `p.rels`, y hay un curso nuevo con otro tutor.
  - **`'quien deja de ser tu amigo pierde el papel'`:** con relación 25, en el `staff` siguiente queda `'comun'`. El
    compañero de mejor relación que no sea rival ni abusón pasa a `amigo`. Sin candidatos, llega alguien nuevo.
  - **`'si alguien muere, su papel se llena'`** (Foco 1): con el rival muerto por `MV.sys.people.die`, el `staff`
    siguiente pone otro rival, y no hay errores.
  - **`'nunca romance con un profesor de la escuela'`** (Foco 5): con un jugador de 18 en secundaria y un tutor de 25,
    `canRomance` es falso y "Coquetear" no aparece en sus acciones.
  - **`'la nocturna y la universidad no tienen curso'`:** con `enrollNight` y con `enrollUni`, `active` es falso y no
    se crea curso.
  - **`'partida vieja sin curso'`** (Foco 2): un alumno de 9 sin `p.edu.class` lo tiene después de `staff`, sin
    errores.
- [ ] **Step 2: Run** `node --test tests/escuela.test.js`.
  Expected: FAIL, `MV.sys.school` no existe.
- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Tu curso: tutor y compañeros con papel"`.

---

### Task 5: Popularidad y el año escolar

**Files:**
- Modify:
  - `js/systems/school.js`;
  - `js/systems/edu.js`: `yearly` y las acciones `estudiar`, `faltar`, `profesor`, `trampa`, `amigos`, `abuson` y
    `fiesta_uni`.
- Test: `tests/escuela.test.js`

**Interfaces:**
- Consumes: `active`, `staff`, `teacher` y `mate` (Tarea 4).
- Produces, en `MV.sys.school`:
  - **`basePop(p) -> number`:** `U.clamp(Math.round(30 + p.stats.looks * 0.2 + p.skills.carisma * 0.3), 15, 75)`.
  - **`pop(g, d) -> number`:** suma `d` a `p.edu.pop`, con un tope de 0 a 100. Si no hay barra, primero usa
    `basePop`.
  - **Cómo pasa la barra de un curso al siguiente** (en `restaff`):
    - de primaria a secundaria: `round((pop + basePop) / 2)`;
    - al repetir: `pop − 5`;
    - al expulsarte (Tarea 6): `pop − 10`;
    - sin barra: `basePop`.
  - **`yearly(g)`:** la llama `edu.yearly` justo después de `e.year++`, solo si `active`. Hace esto:
    1. corre `staff`;
    2. suma +2 por cada club;
    3. resta 4 si `acts.faltar >= 2`;
    4. acerca la barra un 10 % a 50;
    5. aplica el carácter del tutor: suma `K.perf` al rendimiento y `K.stress` al estrés.
- **Cambios en las acciones de `edu.js`:**

  | Acción | Cambio |
  |---|---|
  | `estudiar` | rendimiento +`K.study` extra |
  | `trampa` | chance +`K.cheat`; si te pillan, popularidad −4 |
  | `amigos` | si sale bien, +3; chance −0,10 con popularidad ≤ 30 |
  | `abuson` (enfrentar) | gana +10, pierde −5 |
  | `profesor` | nombra al tutor; su relación sube 5 si te ayuda y baja 3 si te habla de su divorcio |
  | `fiesta_uni` | sin cambios: la popularidad es de la escuela |
  | `coquetear` (en `rels.js`) | chance +0,10 si la persona es el `crush` del curso y la barra está en 70 o más |

  `K` es el carácter del tutor, o `{}` si no hay tutor.

- [ ] **Step 1: Write the failing tests:**
  - **`'la barra empieza según tu aspecto y tu carisma'`:** con looks 50 y carisma 20, el valor es 46; con looks 100 y
    carisma 100, 75; con looks 0 y carisma 0, 30.
  - **`'lo que hace un año'`:**
    - con 2 clubes, ninguna falta y la barra en 60, termina en 63 (60 + 4, y después un 10 % hacia 50 = 63);
    - con `faltar: 2`, y sin clubes, en 58.
  - **`'la barra pasa al curso siguiente'`:** con barra 80 y base 40, la secundaria empieza con 60; al repetir con 50,
    queda 45.
  - **`'el tutor pesa'`:** con `exigente`, el rendimiento del año es 3 menos que con `cansado` y la misma semilla, y
    cada "Estudiar más" da 2 más. Con `estricto`, el estrés sube 2.
  - **`'las acciones mueven la barra'`:** "Hacer amigos" que sale bien da +3; enfrentar al abusón y ganar da +10, y
    perder da −5; una trampa pillada da −4.
  - **`'ser popular ayuda con quien te gusta'`:** en 400 semillas, "Coquetear" con el `crush` sale bien entre 5 y 15
    puntos porcentuales más seguido con la barra en 75 que con la barra en 60.
  - **`'en el centro de menores el curso se congela'`** (Foco 3):
    - con `p.prison` puesto, `MV.ageUp` no cambia la barra ni el curso, y no sale ningún evento `esc_*` en 50 años de
      prueba (reiniciando la condena);
    - al salir, el curso es el mismo.
- [ ] **Step 2: Run** `node --test tests/escuela.test.js`.
  Expected: FAIL, `basePop` no es una función.
- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Popularidad y el carácter del tutor"`.

---

### Task 6: Ser el abusón

**Files:**
- Modify:
  - `js/systems/school.js`;
  - `js/systems/edu.js`: la lista de `actions` y la acción `abuson`;
  - `js/data/events/infancia.js:46`.
- Test: `tests/escuela.test.js`

**Interfaces:**
- Consumes: `pop` (Tarea 5); `persona.adjust`, `persona.has` y `persona.fire` (Tareas 2 y 3);
  `MV.sys.memory.remember`.
- Produces, en `MV.sys.school`:
  - **`actions(g) -> action[]`:** con `active` y compañeros, devuelve tres acciones.
    - Son `burla`, `broma_pesada` y `merienda` (esta solo en primaria).
    - Cada una tiene `limit: 1`, y sus `opts` son los compañeros vivos salvo el `amigo`.
    - Se suman al final de `edu.actions`.
    - Los efectos son los de la tabla de la sección 3 de la spec.
    - En el `run`: se guarda la relación, se aplica el efecto, se llama a `persona.adjust(g, r, n, id, before)` y se
      recuerda.
  - **Te pillan con chance `CATCH + K.catch`, y +0,15 si la persona es `sensible`.** Si te pillan:
    - la popularidad sube +2 en vez de +4;
    - corre `suspend(g)`: rendimiento −8, relación −6 con cada padre vivo, `e.susp++`;
    - con `e.susp >= 3` corre `expel(g)`: `restaff` con −10 de barra, `e.susp = 0` y un texto que lo cuenta.
  - **`e.bullied`** cuenta las veces en la etapa. Con 3 o más, `p.flags.abusador = true`.
  - **Especial 8:** si la persona es `sensible`, `fire()`, un texto propio y `remember(g, id, 'humillacion', null, 3)`.
- **El abusón de hoy:**
  - si hay `mate(g, 'abuson')`, `p.flags.abuson` guarda su id;
  - "Enfrentar al abusón" va contra esa persona y, si pierdes, su relación baja 5;
  - el evento `abuson` de `infancia.js` lleva en su `when` `!MV.sys.school.mate(g, 'abuson')`.

- [ ] **Step 1: Write the failing tests:**
  - **`'molestar a un compañero'`:** si no te pillan, "Burlarte" da popularidad +4, karma −3, relación −15 y un
    recuerdo `humillacion`. "Broma pesada" da +4, −2, −12 y `broma`. La merienda solo aparece en primaria.
  - **`'al mejor amigo no'`:** el `amigo` no está en las `opts`.
  - **`'te pillan'`:** con la chance forzada, la popularidad sube 2, el rendimiento baja 8, cada padre −6 y
    `e.susp === 1`.
  - **`'tres suspensiones y te cambian de escuela'`:** a la tercera, hay curso nuevo (otro tutor), la barra queda en
    `pop − 10`, `e.susp === 0`, no pierdes el año y el texto lo cuenta.
  - **`'abusón del curso'`:** a la tercera vez, `p.flags.abusador` es verdadero.
  - **`'burlarte de alguien sensible'`:** se `fire`, la chance de que te pillen sube 0,15 (en 400 semillas, entre 0,30
    y 0,50 con un tutor `cansado`) y el recuerdo pesa 3.
  - **`'el abusón con nombre'`:**
    - con abusón en el curso, el evento `abuson` no es elegible, y "Enfrentar al abusón" nombra a esa persona;
    - sin abusón, el evento sigue como hoy.
  - **`'ninguna acción de abusón describe violencia'`:** ningún texto de esas acciones contiene "golpe", "sangre",
    "pegó", "pegaste" ni "herid".
- [ ] **Step 2: Run** `node --test tests/escuela.test.js`.
  Expected: FAIL, `actions` no es una función.
- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Ser el abusón tiene su precio"`.

---

### Task 7: Notas que pesan

**Files:**
- Modify: `js/systems/edu.js`: `graduate`, `fin_secundaria`, `pagar_universidad` y la beca.
- Test: `tests/escuela.test.js`

**Interfaces:**
- Produces, en `MV.sys.edu`:
  - **`p.edu.gpa`:** el rendimiento final al egresar de cualquier secundaria, también la nocturna.
  - **`p.edu.popEgreso`:** la barra al egresar de la secundaria común.
  - **`examBonus(p) -> number`:** `p.edu.gpa == null ? 0 : Math.round((p.edu.gpa - 55) / 4)`. Se suma en el examen
    de la universidad pública.
  - **`canBeca(p) -> boolean`:** `p.stats.smarts >= 70 || (p.edu.gpa != null && p.edu.gpa >= 84)`.
  - **`becaChance(p) -> number`:** `Math.min(0.95, Math.max((smarts − 60) / 45, gpa != null ? (gpa − 75) / 30 : 0))`.
- **Textos:**
  - el de `fin_secundaria` dice el promedio y si alcanza para la beca;
  - el de `pagar_universidad` dice cuánto suma o resta el promedio en el examen.

- [ ] **Step 1: Write the failing tests:**
  - **`'se guarda el promedio de egreso'`:** al egresar con `perf: 89`, `gpa === 89` y `popEgreso` es la barra. Con la
    nocturna también hay `gpa`, pero no `popEgreso`.
  - **`'el promedio suma en el examen'`:** `examBonus` da 9 con gpa 89, −6 con 33, 0 sin `gpa` y 0 con 55.
  - **`'beca por promedio'`:**
    - con inteligencia 50 y gpa 84, `canBeca` es verdadero y `becaChance` es 0,3;
    - con gpa 83 e inteligencia 69 es falso;
    - con inteligencia 105 y gpa 100, la chance es 0,95.
    - La opción de beca de `pagar_universidad` aparece con inteligencia 50 y gpa 90.
  - **`'el texto dice tu promedio'`:** el de `fin_secundaria` incluye `MV.grade(gpa)` y, con gpa 84 o más, menciona la
    beca, sin marcas prohibidas.
- [ ] **Step 2: Run** `node --test tests/escuela.test.js`.
  Expected: FAIL, `examBonus` no es una función.
- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "El promedio de egreso pesa en la universidad y en la beca"`.

---

### Task 8: Eventos de la escuela y logros

**Files:**
- Create: `js/data/events/escuela.js`
- Modify:
  - `index.html`: `escuela.js` después de `memoria.js`;
  - `js/data/events/infancia.js:128` (`pelea_patio`);
  - `js/data/events/adolescencia.js:195` (`nerd_amigo`);
  - `js/data/goals.js`.
- Test: `tests/escuela.test.js`

**Interfaces:**
- Consumes: `active`, `mate`, `teacher` y `pop` (Tareas 4 y 5); las acciones de abusón (Tarea 6).
- Produces:
  - **12 eventos con decisiones:**
    - Ids: `esc_delegado`, `esc_cumple`, `esc_grupo`, `esc_rival`, `esc_abuson`, `esc_testigo`, `esc_crush`,
      `esc_pelea_amigo`, `esc_talento`, `esc_citacion`, `esc_copia` y `esc_foto`.
    - Temas y condiciones: los de la sección 5 de la spec.
    - Cada uno tiene `when: (g) => MV.sys.school.active(g.p) && …` y un `target` con el compañero o el tutor que
      corresponde.
    - `esc_abuson` pesa `3` con popularidad ≤ 30 y `1` si no.
    - Los cambios de popularidad van por `MV.sys.school.pop(g, d)`.
    - "Sumarte" en `esc_testigo` usa la misma lógica que la acción `burla`.
    - `esc_crush` puede llevar a pareja con las reglas de hoy (`canRomance`).
  - **Adaptaciones:** `pelea_patio` nombra al rival si lo hay, y `nerd_amigo` usa a un compañero `comun` o `payaso` si
    lo hay. Sin curso, los dos quedan como hoy.
  - **Logros:** `delegado` ("Delegado del curso"), `abanderado` (gpa ≥ 95 al egresar de la secundaria) y `recreo` ("Rey
    o reina del recreo", popularidad ≥ 90 en secundaria), con el formato de `MV.ACHIEVEMENTS`.

- [ ] **Step 1: Write the failing tests:**
  - **`'cada evento sale con su condición'`:** para cada id, `MV.EV.eligible` devuelve contexto en la situación que
    pide y `null` fuera de la escuela o en la cárcel.
    - `esc_delegado` necesita barra ≥ 70 y secundaria.
    - La spec dice 50 en la sección 5 y 70 en la sección 2. Gana 70, que es lo que se le mostró al usuario ("con 70 o
      más puedes ser delegado").
  - **`'si la persona se va, su evento desaparece'`** (Foco 1): con `esc_rival` y `esc_crush` en la cola, después de
    `MV.sys.people.die` o `MV.removeRel` de su persona, `MV.EV.view` no los muestra y no hay errores.
  - **`'los textos'`:** cada evento, con jugador hombre y mujer y con personas de ambos géneros, no tiene marcas
    prohibidas. Con barra 69, ningún texto contiene "popular", salvo una negación explícita como "no eres popular".
  - **`'todas las opciones funcionan'`:** cada opción de cada evento corre sin errores y deja el dinero ≥ 0.
  - **`'los logros'`:** ganar `esc_delegado` desbloquea `delegado`; egresar con gpa 95 desbloquea `abanderado`; la
    barra en 90 en secundaria desbloquea `recreo`.
  - **`'el viejo pelea_patio nombra al rival'`:** con curso, su texto incluye el nombre del rival.
- [ ] **Step 2: Run** `node --test tests/escuela.test.js`.
  Expected: FAIL, `esc_delegado` no existe.
- [ ] **Step 3: Implement.** Si `tests/events.test.js` baja de 95 % de cobertura, se agregan los eventos nuevos a su
  lista de eventos probados con contexto, como se hizo con `acoso`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Doce eventos de la escuela y tres logros"`.

---

### Task 9: Romance con un docente en la universidad

**Files:**
- Modify:
  - `js/data/events/escuela.js`;
  - `js/systems/school.js`;
  - `js/systems/edu.js`: `yearly` en estudios superiores, `graduate` y `drop`.
- Test: `tests/escuela.test.js`

**Interfaces:**
- Consumes: `MV.sys.rels.candidate`, `canRomance` y las reglas de infidelidad de hoy.
- Produces:
  - **Evento `uni_profe`:**
    - Sale al azar con `p.age >= 18`, `MV.sys.edu.inHigher(p)`, `looks >= 50 || carisma >= 50`, y sin
      `p.edu.profEv === p.edu.stage + p.edu.major`, que marca que ya salió en esta etapa.
    - Crea a la persona al mostrarse: `candidate` con edad de 28 a 60 y trabajo "Profesor" o "Profesora" (`ctx.prof`).
    - El texto nombra la materia: sale de la carrera, o es genérica.
    - Opciones:
      - **"Aceptar":** `addRel` como `pareja`, o como `amante` si ya tienes pareja o cónyuge, con `r.prof = true`;
      - **"Rechazar con amabilidad":** no pasa nada más;
      - **"Contárselo a la facultad":** karma +1, la persona no entra a tus relaciones, y su trabajo pasa a "Profesor
        sancionado" o "Profesora sancionada".
  - **`school.profYearly(g)`:**
    - La llama `edu.yearly` cuando `inHigher`.
    - Por cada relación viva con `r.prof`, con un 25 % encola `comite_etica` con `{ target }`.
  - **Evento `comite_etica`:**
    - Es `pushOnly`.
    - Al mostrarse, el trabajo de la persona pasa a "Profesor suspendido" o "Profesora suspendida", y el rendimiento
      baja 10.
    - Opciones:
      - **"Seguir juntos":** sin más cambios;
      - **"Terminar":** pasa a `ex` y se borra `r.prof`;
      - **"Pedir cambio de cátedra":** rendimiento +5 y se borra `r.prof`.
  - **Al terminar o dejar** un estudio superior, se borra `r.prof` de todas las relaciones.

- [ ] **Step 1: Write the failing tests:**
  - **`'el docente solo en estudios superiores'`** (Foco 5): `uni_profe` no es elegible en estos casos:
    - con 17 en la universidad;
    - en secundaria con 18;
    - con looks 40 y carisma 40.
    Sí es elegible con 20 en la universidad y looks 60. Después de salir una vez, ya no vuelve en esa etapa.
  - **`'aceptar'`:**
    - sin pareja queda `pareja` con `r.prof`;
    - con cónyuge queda `amante`, y valen las reglas de infidelidad;
    - el docente tiene 28 a 60 años y es del género que te atrae.
  - **`'contárselo a la facultad'`:** karma +1, sin relación nueva.
  - **`'el comité'`:**
    - en 400 semillas, `profYearly` encola `comite_etica` entre el 18 % y el 32 % de las veces;
    - al mostrarse, el rendimiento baja 10 y el trabajo dice "suspendid";
    - cada opción hace su efecto.
  - **`'al recibirte queda normal'`:** después de `graduate`, ninguna relación tiene `prof`.
  - **`'los textos'`:** con ambos géneros, sin marcas prohibidas y sin palabras explícitas ("sexo", "desnud", "cama").
- [ ] **Step 2: Run** `node --test tests/escuela.test.js`.
  Expected: FAIL, `uni_profe` no existe.
- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.
  Expected: PASS.
- [ ] **Step 5: Commit**: `git commit -m "Romance con un docente en la universidad, con comité de ética"`.

---

### Task 10: Interfaz, heredero, partidas, jugador automático y README

**Files:**
- Modify: `js/ui/sheets.js` (Estudios), `tests/agent.js`, `tests/ui-smoke.js`, `README.md`
- Test: `tests/escuela.test.js`, `tests/ui-smoke.js`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces:
  - **En la ficha de Estudios, con `school.active`:**
    - la fila "Popularidad" con `UI.bar(p.edu.pop)`;
    - un bloque "Tu curso", con el tutor (carácter) y cada compañero (papel), con el estilo de `workStaff`
      (`sheets.js:126`): tocar a alguien abre su ficha.
  - **Sin estudios en curso y con `p.edu.gpa`:** la fila "Promedio de egreso" con `MV.grade(gpa)`.
  - **`tests/agent.js`:** la opción `live(MV, g, { acts, school: 'amable' | 'abusona' })`.
    - Con `'amable'`, cada año escolar usa "Hacer amigos", se une a un club y estudia.
    - Con `'abusona'`, usa las tres acciones de abusón todo lo que pueda.
    - Sin la opción, `special()` saca del azar los mismos números que antes. Se compara con el commit base, como en
      la parte A1.

- [ ] **Step 1: Write the failing tests:**
  - **`'el heredero empieza su propio curso'`:** un jugador muere con un hijo de 10 años en primaria. Al continuar
    como ese hijo, después de un `MV.ageUp` tiene curso propio, y no tiene `pop`, `gpa` ni `susp` del jugador
    anterior.
  - **`'la partida guardada conserva todo'`:** `JSON.parse(JSON.stringify(g))` conserva el curso, la barra, `gpa`,
    `susp`, `r.prof` y `r.shy`, y `MV.ageUp` corre sobre la copia. Una partida sin esos campos tampoco falla (Foco 2).
  - **`'30 vidas con escuela'`:** `live(MV, g, { acts: 4 })` con las semillas 800 a 829 termina sin errores. En alguna,
    el jugador egresa de la secundaria con `gpa`.
  - **`'molestar no es la mejor manera de ser popular'`:**
    - 40 vidas con `'amable'` y 40 con `'abusona'`, semillas 900 a 939, cortadas al egresar de la secundaria;
    - el `popEgreso` promedio de la abusona no es mayor que el de la amable;
    - su karma promedio es menor;
    - más de la mitad de las abusonas tiene al menos una suspensión;
    - si falla, se ajustan los números de las Tareas 5 y 6 dentro de lo que la spec permite, y se anota en el informe.
  - **Humo:** un bloque "Vida escolar" antes de `// Avanzar 5 años` comprueba esto:
    - con un alumno de 13 años, la pestaña Ocupación muestra "Popularidad", "Tu curso", el nombre del mejor amigo y el
      del tutor;
    - al tocar al rival se abre su ficha, y no tiene "Coquetear" si el rival no le gusta;
    - ningún texto tiene "null", "undefined" ni "NaN".
- [ ] **Step 2: Run** `node --test tests/escuela.test.js && node tests/ui-smoke.js`.
  Expected: la de la partida guardada pasa si las tareas anteriores están bien, porque es de protección; las otras
  deciden qué falta.
- [ ] **Step 3: Implement** lo que falte.
  - **README:** una fila "Vida escolar" (curso, popularidad, abusón, notas que pesan, romance con un docente en la
    universidad) y una fila "Personalidades".
  - **Cantidades:** las de eventos y logros pasan a las reales, con la misma definición de la A1:
    - al azar: sin `manual` ni `pushOnly`;
    - especiales: con `manual` o `pushOnly`;
    - cuántos tienen decisiones.
- [ ] **Step 4: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.
  Expected: PASS y "Interfaz OK".
- [ ] **Step 5: Commit**: `git commit -m "Vida escolar: interfaz, heredero, partidas, jugador automático y README"`.
