# Parte D — Animaciones, mascotas míticas, autos y calidad de vida — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animaciones de cambios de estado, cuatro mascotas míticas originales, una concesionaria con modelos pixelados, tuneo, carreras y seguro, y calidad de vida (comodidad, bienestar, resúmenes y gráficos) con más opciones.

**Architecture:** Datos en `js/data` (catálogo de autos, tuneos), lógica en `js/systems` sin DOM (`mythic`, `cars`, `wellbeing`, `history`) y hojas o efectos de interfaz propios (`js/ui/anim.js`, `js/ui/cars.js`, `js/ui/charts.js`). Los ganchos en sistemas existentes son chicos: año, dinero, actividades, eventos, guardado y fichas.

**Tech Stack:** HTML/CSS/JS clásico sin compilación; `node --test`; Playwright para la prueba de humo.

**Spec:** `docs/superpowers/specs/2026-11-10-pulido-autos-calidad-design.md`

## Global Constraints

- Scripts clásicos bajo `window.MV`; cada archivo nuevo va en `index.html` (así lo carga `tests/load.js`).
- El motor (`js/core`, `js/data`, `js/systems`) no toca el DOM.
- Textos en español con concordancia de género (`U.gw`) y artículos; humor negro sin contenido explícito.
- Nada copia personajes ni marcas: el guardián del bosque es original (el guiño está en su personalidad) y los autos tienen marcas y modelos inventados.
- Las animaciones se apagan con Ajustes → Animaciones y con `prefers-reduced-motion`.
- Todo texto que llega al diario pasa BAD_TEXT del jugador automático.
- `MV.VERSION = 6`; v1–v5 siguen cargando.

## Review Focus

1. Partidas v5 con autos viejos (sin modelo): se ven, se venden, se dibujan con la silueta de su tipo y no rompen tuneo, carreras ni seguro.
2. Avanzar 5 años con eventos que piden decisión, avisos o la muerte en el medio: se detiene en el lugar correcto y nunca saltea una decisión.
3. Una mascota mítica que se va o muere con eventos pendientes: no rompe la cola ni deja la relación colgada.
4. Ranuras de guardado: cargar una ranura vacía o de una versión vieja, y borrar la partida en curso.
5. Animaciones apagadas o "reducir movimiento": no aparece ningún número flotante ni sacudida, y el juego funciona igual.

---

### Task 1: Animaciones de cambios de estado

**Files:** Create `js/ui/anim.js`; Modify `js/ui/main.js` (filas de estadística con `data-stat`, dinero con `data-money`, instantánea antes de cada cambio), `css/styles.css` · Test: `tests/ui-logic.test.js`, `tests/ui-smoke.js`

**Interfaces — Produces:** `UI.snap() → { happy, health, smarts, looks, money }`; `UI.diffSnap(a, b) → [{ k, d }]` (solo cambios ≠ 0); `UI.animOn() → bool` (ajuste `settings.anim !== false` y sin `prefers-reduced-motion`); `UI.animateChange(before)` (números flotantes `.float-num` junto a cada fila, avatar `.jump`/`.shake` según el saldo, dinero que cuenta en ~0,6 s).

- [ ] Prueba Node: `diffSnap devuelve solo los cambios con su signo`.
- [ ] Prueba de humo: después de una acción con cambios aparecen `.float-num` y el avatar tiene `.jump` o `.shake`; con animaciones apagadas no aparece ninguno.

### Task 2: Mascotas míticas

**Files:** Create `js/systems/mythic.js` (`MV.sys.mythic`); Modify `js/data/countries.js` (especies `guardian`, `dragon`, `unicornio`, `fantasma` con `mythic: true` y trucos), `js/data/activities.js` (`plantar_arboles`, filtrar míticas en "Adoptar"), `js/systems/year.js`, `js/ui/avatar.js` (dibujo SVG de cada mítica) · Test: `tests/mythic.test.js`

**Interfaces — Produces:** `MV.sys.mythic.has(g, sp) → bool`; `MV.sys.mythic.grant(g, sp) → pet|null` (una de cada especie); `MV.sys.mythic.yearly(g)` (reserva 10 % guardián, karma ≥ 60 3 % unicornio, casa embrujada 10 % fantasma, el guardián da +1 karma con karma ≥ 0 y se va con karma < −30 o un delito ese año, el unicornio se va con karma < 40, el dragón a veces quema dinero o da fama); evento `mercader` (5 % de los viajes, $50.000 por el dragón); `plantar_arboles` ($200, +karma, 8 % guardián); voluntariado 3 % guardián.

- **Gatos callejeros:** actividad `gato_callejero` (12+, `limit: 2`, opciones `gatito` 0 años, `joven` 1–3, `adulto` 4–9, `anciano` 10–15; veterinario $50–150; con padres, 40 % dicen que no; anciano +6 karma, los demás +3; `lifespan ≥ edad + 1`) y evento `gato_sigue` (6+, edad al azar; adoptarlo, darle de comer, seguir de largo). Helper `MV.sys.mythic.strayCat(g, group) → pet`.
- [ ] Pruebas: `recoger un gato callejero de cada edad le da esa edad y vida restante`; `el gato anciano da más karma`; `el evento del gato que te sigue lo agrega a tus mascotas`; `las míticas no se adoptan en la tienda`; `plantar árboles a veces trae al guardián y nunca dos`; `el guardián da karma y se va con karma muy bajo o un delito`; `el unicornio aparece solo con karma 60 y se va con karma bajo`; `el fantasma viene con una casa embrujada`; `el mercader vende el dragón por $50.000`; `cada mítica tiene dibujo propio sin textos rotos`; `si una mítica se va con un evento suyo pendiente, la cola sigue sin errores`.

### Task 3: Concesionaria y autos pixelados

**Files:** Create `js/data/cars.js` (`MV.CAR_CATS`, `MV.CAR_CATALOG`, `MV.CAR_COLORS`), `js/ui/cars.js` (`UI.carSVG`, `UI.showDealer`); Modify `js/systems/money.js` (`buyCar`, prestigio anual), `js/ui/sheets.js` (Comprar → Concesionaria; dibujo en la ficha del auto) · Test: `tests/cars.test.js`

**Interfaces — Produces:**
- `MV.CAR_CATS` = hiperauto, deportivo, sedan, suv, pickup, electrico, clasico, moto, lujo (nombre e icono).
- `MV.CAR_CATALOG = [{ id, brand, model, cat, price, speed, accel, fuel, prestige }]` con al menos 40 modelos (≥ 3 por categoría), marcas inventadas.
- `MV.CAR_COLORS` (8, con nombre y color).
- `MV.sys.money.buyCar(g, modelId, colorId) → msg` (bien `type: 'auto'`, `model`, `color`, `tune: {}`, `insured: false`).
- `MV.sys.money.carPrestige(p) → number` (máximo prestigio de tus autos); cada año, prestigio ≥ 70 suma +1 apariencia y +1 fama.
- `UI.carSVG(asset|model, colorId) → string` (pixel art con `shape-rendering="crispEdges"`, silueta por categoría con rasgos del modelo; un auto viejo sin modelo usa la silueta de su tipo).

- [ ] Pruebas: `el catálogo tiene 9 categorías y al menos 40 modelos con datos válidos`; `comprar un modelo cobra y guarda modelo y color`; `sin dinero no se compra`; `un auto de prestigio alto suma apariencia y fama cada año`; `cada modelo, color y auto viejo se dibuja sin textos rotos`; prueba de humo: filtrar por categoría, elegir color y comprar.

### Task 4: Tuneo, carreras, seguro y choques

**Files:** Create `js/systems/cars.js` (`MV.sys.cars`); Modify `js/data/cars.js` (`MV.CAR_TUNES`), `js/systems/year.js`, `js/ui/sheets.js` (secciones de la ficha del auto) · Test: `tests/cars.test.js`

**Interfaces — Produces:** `MV.CAR_TUNES` (motor, llantas, pintura, alerón, nitro: `{ cost, perf, back }`); `MV.sys.cars.perf(a) → number`; `tune(g, assetId, part) → msg`; `race(g, assetId, kind: 'calle'|'circuito', bet) → msg` (calle: 18+, licencia, apuesta, riesgo de policía y choque; circuito: licencia, inscripción $500, premios); `insure(g, assetId, on) → msg` (3 % del valor por año); `yearly(g)` (cobra seguros; eventos de choque, robo y multa según valor, alcohol y carreras del año; con seguro no pagas daños ni pierdes el valor).

- [ ] Pruebas: `tunear cobra, sube el rendimiento y no repite pieza`; `ganar una carrera depende del rendimiento`; `carrera callejera pide 18 y licencia, y a veces trae policía o choque`; `el seguro se cobra cada año y cubre un robo`; `sin seguro un robo te deja sin auto`; `un auto viejo sin modelo también se tunea y corre`.

### Task 5: Comodidad — buscador, favoritos, avanzar 5 años, ranuras y ajustes

**Files:** Modify `js/ui/sheets.js` (Actividades: `#act-search`, favoritos ⭐), `js/ui/main.js` (botón ⏩ y `UI.ageUpMany`), `js/systems/save.js` (ranuras), `js/ui/screens.js` (menú: Partidas guardadas y Ajustes), `css/styles.css` · Test: `tests/save.test.js`, `tests/ui-smoke.js`

**Interfaces — Produces:** `g.favs = [actionId]`, `MV.toggleFav(g, id)`; `MV.saveSlot(i, g)`, `MV.loadSlot(i) → g|null` (migra versiones viejas), `MV.deleteSlot(i)`, `MV.slotsInfo() → [{ i, name, age, year }|null] × 3`; `UI.ageUpMany(5)` (avanza hasta 5 años y se detiene ante un evento con decisión, un aviso o la muerte); ajustes `settings.font` ('normal'|'grande'|'muy_grande'), `settings.anim`, `settings.yearSummary`.

- [ ] Pruebas Node: `guardar, cargar y borrar las 3 ranuras`; `una ranura vacía devuelve null`; `una ranura con una partida v5 se migra al cargar`; `marcar favorito y desmarcar`.
- [ ] Prueba de humo: buscar "gim" muestra Ir al gimnasio; un favorito aparece arriba; ⏩ avanza y se detiene en una decisión; ajustes cambian la letra y apagan animaciones; guardar y cargar una ranura.

### Task 6: Vivir mejor — bienestar, hobbies, descanso y rutina

**Files:** Create `js/systems/wellbeing.js` (`MV.sys.wellbeing`); Modify `js/data/activities.js` (`hobby` con 6 opciones, `retiro_descanso`), `js/systems/year.js`, `js/ui/main.js` (chip de bienestar), `js/ui/screens.js` (bienestar y rutina en la ficha) · Test: `tests/wellbeing.test.js`

**Interfaces — Produces:** `MV.sys.wellbeing.score(g) → { score: 0..100, label }` (35 % felicidad, 30 % salud, 20 % 100 − estrés, 15 % promedio de relación de padres, pareja o cónyuge, hijos y amigos; sin vínculos cuenta 50; Floreciendo ≥ 80, Bien ≥ 60, Regular ≥ 40, Mal); `p.hobbies[k] = { streak, last }` y `hobbyYearly(g)` (racha vuelve a 0 si no se practicó el año anterior); `p.routine = { exercise: 'ninguno'|'ligero'|'intenso', diet: 'libre'|'equilibrada'|'estricta' }` y `routineYearly(g)` con costos y efectos.

- [ ] Pruebas: `el bienestar usa los pesos del diseño y su palabra`; `practicar un hobby varios años sube la racha y baja más el estrés`; `saltear un año reinicia la racha`; `la rutina intensa con dieta estricta sube la salud y cuesta`; `el retiro de descanso baja mucho el estrés`.

### Task 7: Resumen del año y gráficos

**Files:** Create `js/systems/history.js` (`MV.sys.history`), `js/ui/charts.js` (`UI.lineChart`); Modify `js/systems/year.js`, `js/ui/main.js` (tarjeta del resumen tras avanzar), `js/ui/screens.js` (gráficos en la ficha y la muerte) · Test: `tests/history.test.js`, `tests/ui-smoke.js`

**Interfaces — Produces:** `p.history = [{ age, worth, happy, health, smarts, looks }]` (una por año, máx. 130); `MV.sys.history.record(g)`; `MV.sys.history.yearSummary(before, g) → { age, changes: [{ k, d }], highlights: [texto × ≤3] }`; `UI.lineChart(series, opts) → svg string`.

- [ ] Pruebas: `cada año se guarda una fila de historia`; `el resumen tiene los cambios y hasta 3 momentos destacados`; `el gráfico se dibuja con una o muchas filas sin textos rotos`; prueba de humo: la tarjeta del año aparece (y no aparece si se apaga en Ajustes); la ficha muestra el gráfico.

### Task 8: Más opciones

**Files:** Modify `js/data/activities.js` (karaoke, escape room, refugio de animales, clases de baile/idiomas/manejo/cocina, museo, picnic, observar las estrellas, maratón con Deporte 40+), eventos con una opción nueva, `js/systems/career.js` (trabajar desde casa, año sabático, capacitación) · Test: `tests/options.test.js`

- [ ] Eventos con una opción más (negociar, pedir ayuda o salir con humor): `vecino_nuevo`, `vecino_ruidoso`, `donar_sangre`, `bunker`, `principe_correo`, `vida_calle`, `reunion_familiar`, `padre_enfermo`, `discurso_boda`, `amigo_prestamo`, `perro_puerta`, `carcel_estudio`, `prestamista`, `auditoria`, `carcel_guardia`.
- [ ] Pruebas: `las actividades nuevas existen y sus textos están bien`; `los 15 eventos tienen una opción más que funciona`; `trabajar desde casa baja el estrés`; `el año sabático deja el trabajo y lo puedes recuperar al año siguiente`; `la capacitación cuesta y sube el rendimiento`.

### Task 9: Versión 6, verificación, revisión y PR

**Files:** `js/core/state.js`, `js/systems/save.js`, `tests/save.test.js`, `tests/agent.js`, `README.md`

- [ ] Prueba: `una partida v5 con autos viejos y mascotas se migra a v6 y sigue jugando`.
- [ ] Jugador automático: compra autos del catálogo, los tunea, corre, asegura, practica hobbies y cambia la rutina; barrido de 1.000 vidas; prueba de humo; README; revisión independiente; PR; actualizar el juego publicado.
