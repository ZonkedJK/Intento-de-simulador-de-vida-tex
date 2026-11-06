# Parte A — Licencias e islas — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exámenes de licencia jugables (conducir, yate, avión, helicóptero), vehículos y trabajos que dependen de ellas, e islas privadas que se desarrollan como resort, parque temático, casino o reserva natural.

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

### Task 6: Versión 5, verificación, revisión y PR

**Files:** `js/core/state.js`, `js/systems/save.js`, `tests/save.test.js`, `tests/agent.js`, `README.md`

- [ ] Prueba: `una partida v4 con licencia de conducir se migra a v5` (`p.licenses.auto === true`, sigue jugando).
- [ ] Jugador automático: rinde exámenes (sin opciones), usa vehículos y desarrolla islas; barrido de 1.000 vidas; prueba de humo; README; revisión independiente; PR; actualizar el juego publicado.
