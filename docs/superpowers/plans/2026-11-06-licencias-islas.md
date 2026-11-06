# Parte A — Licencias e islas — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exámenes de licencia jugables (conducir, yate, avión, helicóptero), vehículos y trabajos que dependen de ellas, islas privadas que se desarrollan como resort, parque temático, casino o reserva natural, herencia de la casa y los bienes, instrumentos con carrera de músico y hasta 3 clubes o talleres a la vez.

**Architecture:** Datos en `js/data` (licencias, preguntas, tipos de isla) y lógica en `js/systems` sin DOM (`license`, `vehicles`, `island`), con hojas de interfaz propias (`js/ui/quiz.js`, `js/ui/signs.js`, `js/ui/island.js`). Los ganchos en sistemas existentes son chicos: actividades, `career.meets`, la ficha de bienes, el año y el guardado.

**Tech Stack:** HTML/CSS/JS clásico sin compilación; `node --test`; Playwright para la prueba de humo.

**Spec:** `docs/superpowers/specs/2026-11-06-licencias-islas-design.md`

## Global Constraints

- Scripts clásicos bajo `window.MV`; cada archivo nuevo va en `index.html` (y así lo carga `tests/load.js`).
- El motor (`js/core`, `js/data`, `js/systems`) no toca el DOM.
- Textos en español con concordancia de género (`U.gw`), humor negro sin contenido explícito; nada de marcas reales (el parque es "estilo Disney, con otro nombre").
- Todo texto que llega al diario pasa BAD_TEXT del jugador automático.
- Licencias: conducir 16 años $150; yate 18 $3.000; avión 18 $8.000; helicóptero 18 $12.000; las de vehículos piden conducir; 10 preguntas, aprueba con 7, 2 intentos por año.
- `MV.VERSION = 5`; v1–v4 siguen cargando.

## Review Focus

1. Partidas guardadas con `p.license = true` (sin `p.licenses`): la licencia de conducir cuenta como aprobada y su examen no vuelve a aparecer.
2. Cerrar la hoja del examen a mitad de camino: no se cobra ni se gasta el intento del año.
3. Vender o cerrar una isla con un evento pendiente de esa isla: el evento se descarta sin romper nada.
4. Dinero justo o negativo: desarrollar o mejorar una isla, usar un vehículo y pagar un piloto no dejan rendir ni usar sin el dinero.
5. En la cárcel: no se usan vehículos ni se rinden exámenes; las islas siguen dando ganancia.

---

### Task 1: Motor de licencias y exámenes

**Files:** Create `js/data/licenses.js` (`MV.LICENSES`, `MV.QUIZ`), `js/systems/license.js` (`MV.sys.license`); Modify `js/data/activities.js` (reemplaza `licencia` por las 4 acciones), `js/systems/career.js` (`req.lic`), `index.html` · Test: `tests/license.test.js`

**Interfaces — Produces:**
- `MV.LICENSES[kind] = { name, icon, cost, minAge, requires: kind|null, n: 10, pass: 7 }` para `auto`, `yate`, `avion`, `helicoptero`.
- `MV.QUIZ[kind] = [{ id, q, a, wrong: [string, ...], sign?: string }]` (20 para `auto`, todas con `sign`; ≥12 para las otras).
- `MV.sys.license.has(g, kind) → bool` (para `auto` también acepta `p.license`).
- `MV.sys.license.canTake(g, kind) → { ok, why: [string] }`.
- `MV.sys.license.exam(kind) → { kind, questions: [{ id, q, sign?, options: [string × 3], answer: 0..2 }] }`.
- `MV.sys.license.grade(g, kind, exam, answers: number[]) → { correct, total, passed, mistakes: [{ q, given, right }] }` (cobra el costo; si aprueba guarda `p.licenses[kind]`; para `auto` también `p.license = true`).
- Acciones `lic_auto`, `lic_yate`, `lic_avion`, `lic_helicoptero` en Trámites con `ui: 'quiz'`, `license: kind`, `limit: 2`, `check` que rechaza sin dinero o sin requisito; `run(g, o)` con `o = { exam, answers }` usa `grade`, sin `o` simula respuestas (acierto 0,55 + inteligencia/250).
- `career.meets`: `req.lic: [kind]` agrega "Licencia de avión" (etc.) a `why`.

- [ ] Pruebas: `los bancos tienen preguntas válidas` (a no está en wrong, ≥2 incorrectas distintas, auto 20 con sign); `el examen tiene 10 preguntas con 3 opciones y una correcta`; `aprobar con 7 guarda la licencia y cobra`; `reprobar con 6 no la guarda y cobra igual`; `conducir se rinde desde los 16 y las de vehículos piden conducir y 18`; `una partida con p.license cuenta como licencia de conducir`; `sin dinero el intento se rechaza sin gastar el año`; `en la cárcel no aparecen los exámenes`; `el jugador automático aprueba más con más inteligencia`.
- [ ] Verlas fallar, implementar, verlas pasar, suite completa, commit.

### Task 2: Hoja del examen y dibujos

**Files:** Create `js/ui/signs.js` (`UI.signSVG(key) → string` SVG, 20 señales + banderas `bandera_a`, `bandera_b`, `bandera_o` y luces `luces_barco`), `js/ui/quiz.js` (`UI.showQuiz(action)`); Modify `js/ui/main.js` (ruta `ui:'quiz'`), `css/styles.css`, `tests/ui-logic.test.js`, `tests/ui-smoke.js`

- [ ] Prueba Node: `cada pregunta con dibujo tiene su SVG` (todas las `sign` de `MV.QUIZ` dan un `<svg` sin BAD_TEXT).
- [ ] Prueba de humo: rendir el examen de conducir eligiendo respuestas en pantalla (`#quiz-q`, botones `.quiz-opt`, progreso `#quiz-progress`), ver el resultado con aciertos y errores, y que cerrar a mitad no cobre.
- [ ] La hoja muestra una pregunta por vez, avanza al tocar una opción y al final llama `UI.execAction(action, { exam, answers })`.

### Task 3: Vehículos

**Files:** Create `js/systems/vehicles.js` (`MV.sys.vehicles`); Modify `js/data/world.js` (helicóptero en `MV.LUXURY`: $700.000–$9.000.000, vol 0.07, upkeep 0.07), `js/ui/sheets.js` (acciones en la ficha del bien), `index.html` · Test: `tests/vehicles.test.js`

**Interfaces — Produces:** `MV.sys.vehicles.actions(g, asset) → [action]` (avión: `volar` con `opts` = destinos al 25 %; helicóptero: `paseo_heli`, `fiesta_heli`; yate: `paseo_yate`, `fiesta_yate`; `limit: 2` con contador en `asset.acts`; sin licencia suman piloto/capitán $5.000 / $3.000 / $1.500 y lo dicen en `sub`; nada en la cárcel).

- [ ] Pruebas: `volar a un destino cuesta el 25 % y cuenta como viaje`; `sin licencia se paga el piloto`; `sin dinero no aparecen`; `en la cárcel no hay acciones`; `la fiesta en el yate da fama`.

### Task 4: Trabajos con licencia

**Files:** Modify `js/data/careers.js` (`piloto_comercial`, `piloto_heli`, `capitan_yate`) · Test: `tests/license.test.js`

- [ ] Datos: Piloto comercial (Copiloto → Primer oficial → Comandante → Comandante de vuelos internacionales, $60.000/$95.000/$160.000/$240.000, 21+, secundaria, `lic: ['avion']`); Piloto de helicóptero (turístico → de rescate → ejecutivo, $50.000/$85.000/$140.000, 20+, `lic: ['helicoptero']`); Capitán de yate (Patrón de lancha → Capitán de yate → Capitán de superyate, $32.000/$70.000/$150.000, 18+, `lic: ['yate']`), títulos con femenino.
- [ ] Pruebas: `los trabajos de piloto piden su licencia` (falta → `why` con "Licencia de avión"; con licencia → ok).

### Task 5: Islas desarrollables

**Files:** Create `js/data/islands.js` (`MV.ISLAND_TYPES`), `js/systems/island.js` (`MV.sys.island`), `js/ui/island.js`; Modify `js/systems/year.js`, `js/ui/sheets.js`, `js/data/goals.js` (logro `magnate_isla`: "Lleva un proyecto de isla al nivel 5"), `index.html`, `css/styles.css` · Test: `tests/island.test.js`

**Interfaces — Produces:**
- `MV.ISLAND_TYPES[type] = { name, icon, cost, base, karma?, fame?, mascot?: bool, desc }` con resort 5.000.000/600.000; parque 8.000.000/1.000.000 (`mascot`); casino 6.000.000/1.400.000; reserva 1.000.000/100.000 (+karma, +fama).
- `MV.sys.island.isIsland(a)`, `develop(g, assetId, type, name, mascot) → msg`, `upgradeCost(a) → number` (cost × 0,6 × nivel actual), `upgrade(g, assetId) → msg`, `close(g, assetId) → msg`, `tourism(g) → number` (pandemia 0,3; recesion 0,75; guerra 0,85; auge 1,2; ola_calor 1,1; si no, 1), `yearly(g)`.
- `a.project = { type, name, mascot, level: 1..5, rep: 0..100, invested, last }`; el 70 % de lo invertido suma a `a.value`; cerrar resta ese 70 %.
- Eventos manuales con `ctx.asset`: `isla_mascota`, `isla_montana`, `isla_resena`, `isla_redada`, `isla_documental` (1 de cada 4 años, según el tipo); se descartan si el bien ya no existe.

- [ ] Pruebas: `desarrollar cobra, guarda nombre y sube el valor`; `sin dinero no se desarrolla ni se mejora`; `mejorar hasta el nivel 5 y no más`; `la ganancia sube con el nivel y baja en una pandemia`; `la reserva da karma y fama`; `un evento de una isla vendida se descarta`; `cerrar el proyecto deja la isla sola y baja el valor`; `en la cárcel la isla sigue dando ganancia`; prueba de humo: desarrollar una isla con nombre y mascota y mejorarla.

### Task 7: Herencia de la casa y de los bienes

**Files:** Modify `js/systems/legacy.js` (`continueAs`) · Test: `tests/inheritance.test.js`

**Interfaces — Produces:** `MV.sys.legacy.estateFor(g, heirId) → { assets: [asset], cash: number }` (usada por `continueAs`): casa familiar siempre; todos los bienes si es único o nombrado; `cash = max(0, total − valor de los bienes)` con `total = patrimonio × 0,9 × parte`.

- [ ] Pruebas: `el heredero recibe la casa familiar con sus mejoras aunque valga más que su parte`; `si alquilabas, recibe tu casa más valiosa`; `el único heredero recibe todos los bienes y la isla con su proyecto`; `con varios herederos, uno que no es el nombrado recibe la casa solo si es el que juegas`; `un heredero adulto vive en la casa heredada`.

### Task 8: Instrumentos y carrera de músico

**Files:** Create `js/systems/music.js` (`MV.sys.music`); Modify `js/data/world.js` (`MV.INSTRUMENTS`), `js/systems/money.js` (comprar instrumentos, valor anual), `js/ui/sheets.js` (Tienda de música y acciones en la ficha), `js/systems/career.js` (bonus en audición de música), `js/systems/works.js` (bonus en canciones), eventos `representante` · Test: `tests/music.test.js`

**Interfaces — Produces:** `MV.INSTRUMENTS = [{ id, name, icon, price, quality }]` (10, precios del spec); `MV.sys.music.buy(g, id) → msg` (bien `type: 'instrumento'`); `MV.sys.music.best(p) → quality 0..3`; `MV.sys.music.actions(g, asset) → [action]` (`practicar_inst`, `tocar_calle`, `tocar_bar`).

- [ ] Pruebas: `comprar un instrumento cobra y lo deja en tus bienes`; `practicar con instrumento sube más Música que practicar sin él`; `tocar en un bar pide Música 30 y 16 años`; `el representante ofrece un contrato en la carrera musical`; `un instrumento mejora las canciones y las audiciones`; `en la cárcel no hay acciones`; `sin dinero no se compra`.

### Task 9: Hasta 3 clubes o talleres

**Files:** Modify `js/systems/edu.js` (acción de club y "Dejar un club"), `js/systems/sports.js` (`yearly`, `joinClub`, cazatalentos con el mejor deporte), `js/ui/sheets.js` (lista de clubes en Ocupación) · Test: `tests/clubs.test.js`

**Interfaces — Produces:** `p.clubs = ['sport:futbol', 'robotica', ...]` (máx. 3); `p.club` sigue siendo el deporte principal (el de mejor nivel) para el resto del juego; `MV.sys.edu.joinClub(g, id) → msg`, `MV.sys.edu.leaveClub(g, id) → msg`, `MV.sys.edu.clubsYearly(g)`.

- [ ] Pruebas: `se puede estar en 3 clubes y el cuarto pide dejar uno`; `cada deporte suma sus años de práctica cada año`; `cada taller sube su habilidad cada año`; `los talleres terminan al dejar de estudiar y los deportes siguen`; `el cazatalentos mira el mejor deporte`; `partidas con p.club se migran a p.clubs`.

### Task 10: Versión 5, verificación, revisión y PR

**Files:** `js/core/state.js`, `js/systems/save.js`, `tests/save.test.js`, `tests/agent.js`, `README.md`

- [ ] Prueba: `una partida v4 con licencia de conducir y club se migra a v5` (`p.licenses.auto === true`, `p.clubs` con el club, sigue jugando).
- [ ] Jugador automático: rinde exámenes (sin opciones), usa vehículos y desarrolla islas; barrido de 1.000 vidas; prueba de humo; README; revisión independiente; PR; actualizar el juego publicado.
