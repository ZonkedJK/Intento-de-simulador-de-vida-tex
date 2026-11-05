# Mundo, mascotas, obras, familia, resumen y desafíos — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar noticias del mundo, mascotas con trucos, obras con nombre, familia que crece, resumen compartible y desafíos, y cerrar los menores pendientes.

**Architecture:** Cada bloque es un sistema o datos nuevos bajo `MV` (motor sin DOM) más su hoja de interfaz; los ganchos en sistemas existentes son pequeños y probados. Partidas versión 4 con migración.

**Tech Stack:** HTML/CSS/JS clásico sin compilación; `node --test`; Playwright para la prueba de humo.

**Spec:** `docs/superpowers/specs/2026-11-05-mundo-mascotas-obras-familia-design.md`

## Global Constraints

- Scripts clásicos bajo `window.MV`; cada archivo nuevo se agrega a `index.html` y a `tests/load.js` si carga por lista.
- El motor (`js/core`, `js/data`, `js/systems`) no toca el DOM.
- Textos en español con concordancia de género (`U.gw`), humor negro sin contenido explícito.
- Todo texto que llega al diario pasa el filtro BAD_TEXT del jugador automático (sin `undefined`, `NaN`, `${`).
- `MV.VERSION = 4`; v1, v2 y v3 siguen cargando.

## Review Focus

1. Partidas v3 guardadas en el navegador del usuario (con mascotas, hijos adultos y bienes) cargan y siguen jugando.
2. Personas muertas (mascotas, hijos, nietos) no reciben acciones ni eventos de vida.
3. Heredar como nieto menor de edad: la partida nueva es coherente (padres, hermanos, dinero).
4. Textos nuevos con género del jugador y del NPC (nieto/nieta, casado/casada, abuelo/abuela).
5. Dinero negativo o justo: inscripción de concurso, láser, obras sin dinero no rompen nada.

---

### Task 1: Pendientes menores

**Files:** `js/systems/tattoo.js`, `js/systems/rels.js`, `js/systems/crime.js`, `js/systems/money.js`, `js/systems/save.js`, `js/ui/avatar.js`, `js/ui/tattoo.js`, `js/ui/sheets.js`, `js/data/gifts.js` · Test: `tests/minors.test.js`

- [ ] Pruebas: `laser sin dinero no cobra ni borra`; `huir del país borra convive`; `regalar un cachorro crea un perro`; `vender tu casa no te muda a una alquilada`; `casa con piscina no ofrece otra piscina`; `UI.outfitFor da casco al piloto y banda solo al presidente` (en `tests/ui-logic.test.js`); `migración: tatuaje de cárcel aparece en el álbum`.
- [ ] Verlas fallar, implementar, verlas pasar, suite completa, commit.

### Task 2: Noticias del mundo

**Files:** Create `js/data/news.js` (`MV.WORLD_NEWS`), `js/systems/world.js` (`MV.sys.world`); Modify `js/systems/year.js`, `js/systems/money.js`, `js/systems/career.js`, `js/systems/health.js`, `js/ui/sheets.js`, `index.html` · Test: `tests/world.test.js`

**Interfaces:** Produces `MV.sys.world.yearly(g)`, `MV.sys.world.mods(g) → {inv:{k:n}, house:n, living:n, hire:n, layoff:n, sick:{cond,p}|null}`, `MV.sys.world.current(g) → news|null`.

- [ ] Pruebas: `cada titular tiene id, icono, texto y modificadores válidos`; `el mismo titular no sale dos años seguidos`; `una recesión baja el rendimiento de las acciones` (comparar 200 años con y sin); `la inflación sube el costo de vida`; `el auge tecnológico ayuda a conseguir trabajo`; `el titular queda en el diario`.
- [ ] Implementar; el gancho anual va antes de `career.yearly` y `money.yearly`.

### Task 3: Mascotas con trucos y concursos

**Files:** `js/data/world.js` (`MV.PET_TRICKS`), `js/systems/rels.js`, `js/data/goals.js`, `js/ui/sheets.js` · Test: `tests/pets.test.js`

- [ ] Pruebas: `enseñar trucos agrega trucos de su especie sin repetir`; `un cachorro de 0 años no aprende`; `el concurso cobra la inscripción y con muchos trucos gana premios`; `sin $50 no aparece el concurso`; `ganar da el logro mascota_campeona`.

### Task 4: Obras con nombre y críticas

**Files:** Create `js/systems/works.js` (`MV.sys.works`), `js/ui/works.js`; Modify `js/data/activities.js`, `js/data/world.js` (`MV.WORK_KINDS`), `js/data/goals.js`, `js/ui/main.js` (ruta `ui:'work'`), `js/ui/screens.js` (Mis obras), `js/systems/year.js` o `money.yearly` (regalías), `index.html`, `css/styles.css` · Test: `tests/works.test.js`

**Interfaces:** `MV.sys.works.create(g, kind, title, genre) → msg`, `MV.sys.works.randomTitle(kind) → string`, `MV.sys.works.clean(title) → string`, `MV.sys.works.yearly(g)`.

- [ ] Pruebas: `el título se limpia y se recorta a 40`; `sin título se usa uno al azar`; `más habilidad da mejores estrellas en promedio`; `un éxito paga y deja regalías que bajan`; `las tres actividades guardan la obra`; prueba de humo: escribir un libro con título propio y verlo en Mis obras.

### Task 5: Hijos con vida propia y nietos

**Files:** `js/core/state.js` (REL_LABEL `nieto`, REL_ORDER, FAMILY), `js/systems/people.js` (vida de hijos adultos), `js/systems/rels.js` (acciones con nietos), `js/data/events/general.js` (eventos), `js/systems/legacy.js` (herederos y continuar como nieto) · Test: `tests/family.test.js`

- [ ] Pruebas: `un hijo adulto con los años se casa y tiene hijos que son nietos reales`; `nieto_nace crea un nieto`; `un hijo muerto no se casa ni tiene hijos`; `sin hijos vivos los nietos son herederos`; `continuar como nieto deja al hijo como padre y al jugador como abuelo fallecido`; `las acciones con nietos existen y concuerdan en género`.

### Task 6: Resumen para compartir

**Files:** `js/systems/legacy.js` (`summaryText(g)`), `js/ui/screens.js` · Test: `tests/summary.test.js`

- [ ] Pruebas: `el resumen tiene nombre, edad, causa, patrimonio y epitafio sin textos rotos`; prueba de humo: el botón Copiar resumen existe en la pantalla de muerte.

### Task 7: Modo desafío

**Files:** Create `js/data/challenges.js` (`MV.CHALLENGES`), `js/systems/challenge.js` (`MV.sys.challenge`); Modify `js/core/state.js` (`newGame` acepta `challenge`), `js/systems/year.js`, `js/systems/legacy.js`, `js/data/goals.js`, `js/ui/screens.js`, `index.html` · Test: `tests/challenge.test.js`

**Interfaces:** `MV.sys.challenge.yearly(g)`, `MV.sys.challenge.status(g) → {def, done, failed}|null`.

- [ ] Pruebas: `cada desafío tiene check válido`; `cumplir millonario sin universidad lo marca y da el logro`; `entrar a la universidad lo pierde`; `newGame con desafío lo guarda`; prueba de humo: elegir un desafío al crear la vida.

### Task 8: Versión 4, verificación, revisión y PR

**Files:** `js/core/state.js`, `js/systems/save.js`, `tests/save.test.js`, `tests/agent.js`, `tests/ui-smoke.js`, `README.md`

- [ ] Prueba: `una partida v3 con mascotas e hijos se migra a v4 y sigue jugando`.
- [ ] Jugador automático usa las acciones nuevas; barrido de 1.000 vidas; prueba de humo; README; revisión independiente; PR.
