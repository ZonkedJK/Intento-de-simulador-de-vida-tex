# Interfaz A — "El cuaderno, mejorado" — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar al juego la Interfaz A aprobada en Figma: cuaderno cálido, tarjetas flotantes con sombra dura,
resaltadores, barras en semáforo, tarjeta de decisión con clip, hojas con agarradera y lápida con pasto, en claro y
en pizarrón.

**Architecture:** Rediseño en el lugar. Las variables y reglas de `css/styles.css` se reescriben, y unos pocos
renderizadores de `js/ui/` suman elementos nuevos. Los nombres de clases, ids y `data-*` existentes no cambian. El
único cambio de motor es un campo opcional `sub` en las opciones de los eventos.

**Tech Stack:**
- JavaScript clásico bajo `window.MV`, sin compilación.
- CSS con variables y `color-mix`.
- Pruebas con `node --test` y Playwright (Chromium preinstalado).

**Spec:** `docs/superpowers/specs/2026-11-11-interfaz-a-cuaderno-design.md`
**Diseño de referencia:** https://www.figma.com/design/0OerMNOffrKvA4EnYNkrVP (página "Interfaz A")

## Global Constraints

- **Código:** sin archivos de script nuevos, y la lista de `<script>` de `index.html` no cambia.
- **Nombres existentes:** clases, ids y atributos `data-*` se mantienen. Solo se agregan nuevos.
- **Motor y guardado:** sin cambios, salvo `sub` en `MV.EV.view` y en el evento `auditoria`. `MV.VERSION` sigue en 7.
- **Tamaños:** los de letra y espacios de texto van en `rem`, para que el ajuste de letra grande siga funcionando.
  Bordes, sombras y esquinas van en `px`.
- **Variables:** exactamente los valores de la tabla del §3 de la especificación, en claro y oscuro.
- **Formas:**
  - Esquinas: tarjetas `16px 11px 17px 10px`, cajas/listas/botones `13px 9px 14px 8px`, barras
    `8px 4px 8px 5px`, tarjeta de evento `18px 12px 19px 13px`.
  - Sombras duras sin desenfoque: `3px 4px 0`, `2px 3px 0` y `4px 5px 0`, del color `--hard`.
- **Accesibilidad:** objetivos táctiles de 44 px o más, y se respeta `prefers-reduced-motion`.
- **Textos:** en español, con concordancia de género.
- **Pruebas:** `node --test tests/*.test.js` (nunca `node --test tests/`) y `node tests/ui-smoke.js`.
- **Commits:** terminan con las líneas `Co-Authored-By` y `Claude-Session` de la sesión.
- **Después de la revisión final:** PR, fusión a `main` y republicar el artifact del juego (patrón del usuario).

## Review Focus

1. **Nombre larguísimo, dinero enorme y letra "muy grande":** el nombre se corta con "…" dentro del carnet y la
   etiqueta de dinero no tapa el menú. Prueba en la Tarea 3.
2. **Diario largo con muchos chips:** al bajar hasta el final, la última entrada queda visible por encima del panel
   de estadísticas. Prueba en la Tarea 3.
3. **Modo oscuro:** el texto resaltado sigue legible (oscuro sobre resaltador pleno) y el fondo es el pizarrón.
   Prueba en la Tarea 3.
4. **Escritorio a 1024 px:** el carnet queda dentro de la columna y ⏩ 5 no pisa el botón +1 año, tampoco a 390 px.
   Prueba en la Tarea 3.
5. **Tarjetas que no son eventos** (confirmación): también llevan el clip y se pueden cerrar. Prueba en la Tarea 4.

---

### Task 1: Subtítulo opcional en las opciones de los eventos

**Files:**
- Modify: `js/core/events.js:153-155` (`EV.view`)
- Modify: `js/data/events/adultez.js:204-210` (evento `auditoria`)
- Create: `tests/interfaz-a.test.js`

**Interfaces:**
- Produces: cada elemento de `MV.EV.view(g).choices` es `{ label, i }`. Tiene además `sub: string` solo si la opción
  define `sub` (texto o `(g, ctx) => texto`), pasado por `MV.fx.tpl`.

- [ ] **Step 1: Write the failing tests** en `tests/interfaz-a.test.js` (con `load` de `./load`,
  `BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/`):

```js
test('auditoría: subtítulos con concordancia y resultado tranquilo/tranquila', () => {
  const MV = load({ seed: 1 });
  for (const [gender, word] of [['m', 'tranquilo'], ['f', 'tranquila']]) {
    const g = MV.newGame({ seed: 1 }); g.p.age = 40; g.p.gender = gender; g.p.money = 100000; g.queue = [];
    g.p.job = { id: 'actor', level: 1, salary: 100000, perf: 60, years: 1, lvlYears: 1, type: 'fame', start: 39 };
    MV.EV.push(g, 'auditoria', {}, true);
    const v = MV.EV.view(g);
    assert.deepEqual(v.choices.map((c) => c.sub), [`Pagas las diferencias y dormirás ${word}`, 'Puede salir muy bien… o muy mal', 'Una moneda al aire con tu plata', 'En cómodas cuotas']);
    v.choices.forEach((c) => assert.ok(!BAD_TEXT.test(c.label + c.sub), c.label));
    assert.match(MV.EV.choose(g, 0).msg, new RegExp(`Dormirás ${word}\\.`));
  }
});

test('las opciones sin sub no lo traen; sub acepta función y plantillas', () => {
  const MV = load({ seed: 2 });
  MV.ev({ id: 'prueba_sub', manual: true, icon: '🧪', title: 'Prueba', text: 'x', choices: [{ t: 'A', eff: {} }, { t: 'B', sub: () => 'Lista{o}', eff: {} }] });
  const g = MV.newGame({ seed: 2 }); g.p.gender = 'f'; g.queue = [];
  MV.EV.push(g, 'prueba_sub', {}, true);
  const [a, b] = MV.EV.view(g).choices;
  assert.ok(!('sub' in a));
  assert.equal(b.sub, 'Lista');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

  Run: `node --test tests/interfaz-a.test.js`

  Expected: 2 FAIL:
  - `sub` is `undefined`.
  - "Dormirás tranquila." doesn't match for `f`.

- [ ] **Step 3: Implement**
  - En `EV.view`, el `.map` de opciones suma `sub` solo cuando `x.c.sub != null`: el texto, o el resultado de la
    función con `(g, ctx)`, pasado por `MV.fx.tpl(g, …, ctx)`.
  - En `auditoria`, agregar las 4 `sub` exactas de la prueba (la primera como
    `'Pagas las diferencias y dormirás tranquil{o}'`).
  - En el resultado de "Pagar todo en regla", "Dormirás tranquilo." pasa a `tranquil${U.gw(g.p.gender, 'o', 'a')}.`

- [ ] **Step 4: Run the tests to verify they pass**

  Run: `node --test tests/*.test.js`

  Expected: todo PASS (323 + 2).

- [ ] **Step 5: Commit** — `git add js/core/events.js js/data/events/adultez.js tests/interfaz-a.test.js` y
  `git commit -m "Subtítulo opcional en las opciones de los eventos (Inspección fiscal)"`.

### Task 2: Variables y formas del cuaderno

**Files:**
- Modify: `css/styles.css`:
  - variables, líneas 3–70;
  - reglas globales de superficies: `.box`, `.btn`, `.toast`, `.input`/`.select`, `.seg button`, `.ach`,
    `.tree-node`, `.notebook`, `.icon-btn`.
- Modify: `index.html:7` (`theme-color` → `#fffdf7`)
- Test: `tests/interfaz-a.test.js`

**Interfaces:**
- Produces: las variables CSS de la especificación y estas otras, que usan las tareas 3–6:
  - `--hl-stop`: `55%` en claro, `0%` en oscuro (dónde empieza el resaltador).
  - `--hl-ink`: `var(--ink)` en claro, `var(--on-hl)` en oscuro (color del texto resaltado).
  - `--clip`: `#8a94a6` en claro, `#9aa6b8` en oscuro.
  - Esquinas: `--r-card: 16px 11px 17px 10px`, `--r-box: 13px 9px 14px 8px`, `--r-bar: 8px 4px 8px 5px`,
    `--r-modal: 18px 12px 19px 13px`.
  - Sombras: `--sh: 3px 4px 0 var(--hard)`, `--sh-sm: 2px 3px 0 var(--hard)`, `--sh-lg: 4px 5px 0 var(--hard)`.
  - `--nav-h: 92px`.

- [ ] **Step 1: Write the failing test** `'las variables del cuaderno y del pizarrón tienen los valores de Figma'`:
  - Lee `css/styles.css` y extrae `--nombre: valor;` de dos bloques: el primer `:root {` y `:root[data-theme="dark"] {`.
  - Comprueba con `assert.equal` cada par:
    - **Claro:** `paper #fffdf7`, `grid #dbe6f6`, `margin #f2a0a6`, `card #ffffff`, `ink #1f3a93`,
      `copy #26345f`, `pencil #5b6270`, `hl-yellow #ffe066`, `hl-green #b8f2a0`, `hl-pink #ffb3c7`,
      `hl-blue #a8d8ff`, `on-hl #1b2a5e`, `lvl-lo #e25c5c`, `lvl-mid #f0b429`, `lvl-hi #3fae5a`, `stone #eef0f4`,
      `hard #1f3a93`, `clip #8a94a6`, `hl-stop 55%`, `nav-h 92px`.
    - **Oscuro:** `paper #1e2a26`, `grid #283832`, `margin rgba(255, 128, 128, 0.6)`, `card #25332e`,
      `ink #eef1e8`, `copy #dfe5dc`, `pencil #a3afa6`, `hl-yellow #f2dc68`, `hl-green #98e0a3`,
      `hl-pink #f09ac6`, `hl-blue #96cdee`, `on-hl #1b211e`, `lvl-lo #ff8a80`, `lvl-mid #f2c14e`,
      `lvl-hi #6fd08a`, `stone #34433d`, `hard #0f1714`, `clip #9aa6b8`, `hl-stop 0%`.
  - Además: el bloque oscuro de `@media (prefers-color-scheme: dark)` declara exactamente las mismas variables que
    `:root[data-theme="dark"]`, y `index.html` tiene `content="#fffdf7"` en `theme-color`.

- [ ] **Step 2: Run it to verify it fails**

  Run: `node --test tests/interfaz-a.test.js`

  Expected: FAIL en `--paper` (`#f7f9fc` ≠ `#fffdf7`).

- [ ] **Step 3: Implement**
  - Reescribir las variables en los tres bloques (claro, media oscuro y `data-theme` oscuro), con las nuevas
    `--copy`, `--lvl-*`, `--stone`, `--hard`, `--clip`, `--hl-stop`, `--hl-ink` y las de esquinas y sombras.
  - Reemplazar `var(--shadow)` y las sombras `… var(--ink)` por `--sh`, `--sh-sm` o `--sh-lg`:
    - `.btn` y `.toast` llevan `--sh-sm`;
    - `.notebook` mantiene `6px 8px 0 var(--hard)`;
    - `.sheet` no lleva sombra.
  - Aplicar `--r-box` a `.box`, `.list`, `.btn`, `.toast`, `.input`, `.select`, `.seg button`, `.ach` y
    `.tree-node`.
  - `.icon-btn` pasa a 44 × 44.
  - Cambiar `theme-color`.

- [ ] **Step 4: Run all tests**

  Run: `node --test tests/*.test.js && node tests/ui-smoke.js`

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Variables y formas del cuaderno mejorado y del pizarrón"`
  (`css/styles.css index.html tests/interfaz-a.test.js`).

### Task 3: Pantalla principal

**Files:**
- Modify: `js/ui/dom.js` (nuevo `UI.hl`)
- Modify: `js/ui/main.js:121-219` (`renderGame`, `refreshGame`, `renderDiary`, `renderNav`)
- Modify: `css/styles.css`: carnet, avatares, diario, barras, chips y navegación (líneas 94–193)
- Test: `tests/ui-smoke.js` (bloque nuevo "Interfaz A", después del bloque de favoritos, línea 384)

**Interfaces:**
- Consumes: las variables de la Tarea 2.
- Produces:
  - `UI.hl(content: string|Node, color: 'yellow'|'green'|'pink'|'blue' = 'yellow') -> HTMLSpanElement`. Crea
    `<span class="hl hl-COLOR">`; lo usan las tareas 4 y 6.
  - En `tests/ui-smoke.js`, los ayudantes `css(sel, prop, pseudo?) -> Promise<string>` (estilo calculado) y
    `rect(sel) -> Promise<{l,t,r,b,w,h}>`, definidos junto a `tryClick`. Los usan las tareas 4–6.

- [ ] **Step 1: Write the failing smoke checks.** El bloque "Interfaz A — pantalla principal" hace esto:
  1. Prepara la pantalla:
     - Cierra las capas y vacía la cola.
     - Agrega `MV.log(g, 'Te ascendieron.', '📈', 'good')` y `MV.log(g, 'Te rompiste una muela.', '🦷', 'bad')`.
     - Llama `MV.UI.refreshGame()` y baja hasta el final.
  2. Comprueba (con `errors.push` en cada falla):
     - El carnet flota: `rect('.idcard').l >= 10`, ancho ≤ 370, y `boxShadow` contiene `3px 4px 0px`.
     - La etiqueta de dinero sobresale: `rect('.idcard .money').t < rect('.idcard').t`.
     - El panel `.stats` flota: `l >= 10` y sombra `3px 4px 0px`.
     - Cada `.stats .bar > i` tiene el color de su clase: `lvl-lo` → `rgb(226, 92, 92)`,
       `lvl-mid` → `rgb(240, 180, 41)`, `lvl-hi` → `rgb(63, 174, 90)`.
     - Existen `.entry.good .hl-green` y `.entry.bad .hl-pink`.
     - `#wellbeing-chip` tiene `ok` si y solo si el puntaje es ≥ 60, y `warn` si y solo si es < 40.
     - `.ageup` mide `offsetWidth === 88` y `.nav` mide `offsetHeight === 92`.
     - La última `.diary .entry` termina por encima de `rect('.stats').t + 1`.
  3. Pruebas de la Review Focus:
     - **Foco 1:** con nombre "Maximiliana Guadalupe de los Santos Echeverría", dinero `1234567890123` y
       `data-font="muy_grande"`:
       - `.idcard .name` tiene `scrollWidth > clientWidth` y su borde derecho ≤ el del carnet.
       - El rectángulo de `.money` no se cruza con el de `button[aria-label="Menú"]`.
       - Al terminar se restauran nombre, dinero y letra.
     - **Foco 3:** con `data-theme="dark"`:
       - `css('body','backgroundColor') === 'rgb(30, 42, 38)'`.
       - `css('.entry.good .hl-green','color') === 'rgb(27, 33, 30)'`.
       - Al terminar, `MV.UI.applyTheme()`.
     - **Foco 4:**
       - Con `setViewportSize({width:1024,height:800})`, el carnet queda dentro de `rect('#app')`.
       - El rectángulo de `.ageup5` no se cruza con el de `.ageup`. Esto se comprueba también a 390 × 844, y al
         terminar se vuelve a 390 × 844.

- [ ] **Step 2: Run to verify it fails**

  Run: `node tests/ui-smoke.js`

  Expected: exit 1, con "El carnet no flota" y "Barra lvl-…" entre los errores.

- [ ] **Step 3: Implement**
  - **`UI.hl`** en `dom.js`.
  - **`renderGame`:**
    - Mete el carnet en `h('div', {class:'topbar'}, idcard)`: fijo arriba, padding `12px 12px 8px`, fondo
      `linear-gradient(var(--paper) 75%, transparent)`.
    - Mete `stats` en `h('div', {class:'dock'}, stats)`: fijo abajo sobre la barra, padding `8px 12px 20px`, fondo
      `linear-gradient(transparent, var(--paper) 25%)`.
  - **Carnet:**
    - Tarjeta con `--r-card` y `--sh`, `position: relative`, sin `position: sticky` propio.
    - Avatar de 56 px con borde de 2 px.
    - `.money`: absoluta en `top:-13px; right:46px`, giro de 3°, borde de 1,5 px y sombra `2px 2px 0 var(--hard)`.
  - **Diario:**
    - Entradas a `0.9375rem` con interlineado `1.38`.
    - Si `it.tone` es `good` o `bad`, el texto va envuelto en `UI.hl(it.t, 'green'|'pink')`, dentro de `.tx`.
  - **Clase `.hl`:**
    - Fondo `linear-gradient(transparent var(--hl-stop), var(--hl-COLOR) var(--hl-stop))`.
    - `color: var(--hl-ink)`, `box-decoration-break: clone` (más `-webkit-`).
    - En oscuro, padding de `0 2px` y radio de 3 px.
  - **Año del diario:** el `.age` usa el rosa al 45 % (`color-mix`) desde `--hl-stop`; el año actual, rosa pleno.
  - **Barras:**
    - `.bar` mide 12 px, con fondo `var(--card)` y `--r-bar`.
    - `.lvl-lo`, `.lvl-mid` y `.lvl-hi` usan `--lvl-*`.
    - `.stat .val` va en Shantell 800.
  - **Panel `.stats`:**
    - Tarjeta con `--r-card` y `--sh`, en 2 columnas; desde 700 px, 4 columnas como ahora.
    - Cinta con `::before`: 56 × 18, amarillo al 80 %, en `left:-14px; top:-8px`, girada −24°.
  - **Chips:** `0.72rem`. El chip de bienestar suma la clase `ok` si el puntaje es ≥ 60, con
    `.chip.ok { background: var(--hl-green); color: var(--on-hl) }`.
  - **Navegación:**
    - `.ageup`: 88 px, `top:-24px`, sombra `--sh`.
    - `.ageup5`: `left: calc(50% + 56px); top:-14px`.
    - Íconos de 1,5 rem.

- [ ] **Step 4: Run all tests**

  Run: `node --test tests/*.test.js && node tests/ui-smoke.js`

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Pantalla principal del cuaderno mejorado: carnet y panel flotantes, resaltadores y semáforo"`.

### Task 4: Tarjeta de decisión

**Files:**
- Modify: `js/ui/main.js:303-328` (`UI.flushQueue`)
- Modify: `css/styles.css`, reglas de `.card`, `.scene` y `.choice` (líneas 263–292)
- Test: `tests/ui-smoke.js` (bloque "Interfaz A — decisión", a continuación del de la Tarea 3)

**Interfaces:**
- Consumes: `UI.hl` (Tarea 3), `choice.sub` (Tarea 1), y `css`/`rect` (Tarea 3).

- [ ] **Step 1: Write the failing smoke checks**
  1. Preparar la decisión:
     - Guardar `g.p.job` y poner un trabajo de prueba:
       `{ id:'actor', level:1, salary:100000, perf:60, years:1, lvlYears:1, type:'fame', start:g.p.age }`.
     - Poner `g.p.money ≥ 100000`, vaciar la cola, hacer `MV.EV.push(g,'auditoria',{},true)` y llamar
       `MV.UI.flushQueue()`.
  2. Comprobar:
     - `#layer .card h2 .hl-yellow` contiene "Inspección fiscal".
     - Hay exactamente 4 `#layer .card .choice .sub`.
     - `css('#layer .card','width','::after') === '22px'`.
     - `css('#layer .card','content','::before') === 'none'`.
     - `css('#layer .card .text','color') === 'rgb(38, 52, 95)'`.
  3. Cerrar: elegir la primera opción, llamar `resolve()` y restaurar el trabajo guardado.
  4. **Foco 5:** `MV.UI.confirm('¿Probar?', () => {})` también tiene `::after` de 22 px. Se cierra con
     `#layer .card .btn:not(.danger)`.

- [ ] **Step 2: Run to verify it fails**

  Run: `node tests/ui-smoke.js`

  Expected: exit 1, con "El título de la decisión no lleva resaltador" y "La tarjeta no tiene el clip".

- [ ] **Step 3: Implement**
  - **`flushQueue`:**
    - El título pasa a `h('h2', null, icono, UI.hl(v.title || 'Este año', 'yellow'))`.
    - Cada opción muestra `c.label` y, si existe, `h('span', {class:'sub'}, c.sub)`.
  - **`.card`:**
    - `--r-modal` y `--sh-lg`.
    - `::before` con `content: none`.
    - `::after` es el clip: 22 × 46, `top:-14px; right:34px`, borde de 3 px `var(--clip)`, radio de 11 px, sin
      fondo ni giro.
  - **`.scene`:** fondo `var(--card)` y esquinas `12px 8px 13px 9px`.
  - **`.card h2`:** Shantell 800 a 1,55 rem.
  - **`.card .text`:** `color: var(--copy)`.
  - **`.choice`:**
    - `--r-box`, `--sh-sm` y padding de `0.8rem 0.875rem`.
    - Al tocarla, `translate(2px,2px)` con sombra `1px 1px 0`.
    - `.choice .sub`: bloque, peso 400, `0.8125rem`, `--pencil`.

- [ ] **Step 4: Run all tests**

  Run: `node --test tests/*.test.js && node tests/ui-smoke.js`

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Tarjeta de decisión con clip, título resaltado y subtítulos"`.

### Task 5: Hojas inferiores

**Files:**
- Modify: `js/ui/main.js:33-53` (`UI.sheet`: agarradera)
- Modify: `js/ui/sheets.js:526` (placeholder del buscador)
- Modify: `css/styles.css`: `.sheet`, `.sheet-head`, `.act-search`, `.grid-cats` y `.cat`
- Test: `tests/ui-smoke.js` (bloque "Interfaz A — hojas")

**Interfaces:**
- Consumes: `css`/`rect` (Tarea 3).

- [ ] **Step 1: Write the failing smoke checks**
  1. Preparar: cerrar las capas, poner `g.p.prison = null` y llamar `MV.UI.showActivities()`.
  2. Comprobar:
     - Existe `.sheet .grab`.
     - `.sheet-head` tiene fondo `rgba(0, 0, 0, 0)` y `borderBottomWidth` de `0px`.
     - El placeholder de `#act-search` empieza con "🔎".
     - Los 4 primeros `.sheet .cat` tienen 4 fondos distintos, ninguno `rgb(255, 255, 255)`.
     - Todos los `.sheet .icon-btn` miden `offsetWidth >= 44`.

- [ ] **Step 2: Run to verify it fails**

  Run: `node tests/ui-smoke.js`

  Expected: exit 1, con "La hoja no tiene agarradera".

- [ ] **Step 3: Implement**
  - **`UI.sheet`:** antes del encabezado agrega `h('div', {class:'grab', 'aria-hidden':'true'})`. La agarradera
    mide 46 × 5, con radio de 3 px, color `--pencil` al 40 % y margen `8px auto 0`.
  - **`.sheet`:** esquinas superiores de 22 px y sin sombra.
  - **`.sheet-head`:** fondo transparente y sin borde inferior. El `h2` va en Shantell 800 a 1,5 rem.
  - **`.act-search`:** fondo de tarjeta, `--r-box`, padding de `0.625rem 0.75rem`.
  - **Placeholder:** `'🔎 Buscar actividad…'`.
  - **`.cat`:**
    - Alto mínimo de 86 px, `--r-box`, `--sh-sm`, emoji de 1,9 rem.
    - Tintes con `.grid-cats .cat:nth-child(4n+1|2|3|4)`, en el orden amarillo, verde, rosa y celeste, como
      `color-mix(in srgb, var(--hl-X) 25%, var(--card))`.
    - El hover amarillo actual se mantiene por encima de los tintes.

- [ ] **Step 4: Run all tests**

  Run: `node --test tests/*.test.js && node tests/ui-smoke.js`

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Hojas con agarradera, encabezado sobre el papel y categorías con tinte"`.

### Task 6: Pantalla de muerte

**Files:**
- Modify: `js/ui/screens.js:110-161` (`UI.showDeath`)
- Modify: `css/styles.css`: `.tomb`, `.verdict` y los nuevos `.grass`, `.cause` y `.go` (líneas 336–352)
- Test: `tests/ui-smoke.js` (después de `await page.waitForSelector('.tomb');`, línea 443)

**Interfaces:**
- Consumes: `UI.hl` (Tarea 3), `UI.row(icon, label, sub, right: Node, onClick)` (ya existe) y `css` (Tarea 3).

- [ ] **Step 1: Write the failing smoke checks.** Un `page.evaluate` recorre los hijos directos de `.death` y
  devuelve los datos para comprobar:
  - El elemento siguiente a `.tomb` tiene la clase `grass`.
  - Existe `.death .cause .hl-pink`.
  - El `filter` calculado de `.tomb .avatar svg` es `none`.
  - El orden es veredicto < bloque que contiene `#death-charts` < lista con `button.row`.
  - `.death button.row .go` dice "Continuar".
  - `.tomb .dates` termina en ` · N año(s)` (regex `/ · \d+ años?$/`).

- [ ] **Step 2: Run to verify it fails**

  Run: `node tests/ui-smoke.js`

  Expected: exit 1, con "La lápida no tiene pasto".

- [ ] **Step 3: Implement** el orden del §7 de la especificación.
  1. **`.tomb`:**
     - Contenido: `.rip`, `h1`, `.dates` (`${born} – ${died} · ${age} año(s)`) y el avatar de 62 px al final.
     - Estilo: fondo `--stone`, ancho de 100 % hasta 260 px, centrada, borde de 2,5 px y `--sh-lg`.
  2. **Pasto:** `h('div', {class:'grass', 'aria-hidden':'true'})`. Mide 300 px como máximo por 12 px, con radio de
     6 px y `repeating-linear-gradient(90deg, #7cc56a 0 6px, #5aa84a 6px 9px)`. Va pegado a la lápida con margen
     superior de −2 px.
  3. **Causa y epitafio:**
     - `h('p', {class:'cause'}, 'Murió por ', UI.hl(s.cause, 'pink'), '.')`, centrada.
     - Debajo, el `.epitaph` de siempre.
  4. **Veredicto:** se mantiene la caja `box verdict`, con `--sh-sm` y el nombre en Shantell.
  5. **Gráficos:** título `'💰 Tu vida en gráficos'` y `h('div', {class:'box'}, UI.lifeCharts(g.p, 'death-charts'))`.
  6. **Herederos:**
     - Título `'👪 Continuar la dinastía'` y la nota de siempre.
     - En cada fila, `right` pasa a ser `h('span', {class:'go'}, 'Continuar')`: píldora amarilla con borde de 2 px,
       Shantell 800 a 0,875 rem, sombra `2px 2px 0 var(--hard)` y color `--on-hl`.
  7. **El resto, en este orden:** caja de datos, copiar/compartir, logros, botones finales, partidas guardadas y
     diario completo.
  - **Avatar en color:** regla `.tomb .avatar.dead svg { filter: none; opacity: 1; }`. Solo dentro de la lápida.

- [ ] **Step 4: Run all tests**

  Run: `node --test tests/*.test.js && node tests/ui-smoke.js`

  Expected: PASS y "Interfaz OK". La prueba existente "Continuar como heredero" sigue creando la generación 2.

- [ ] **Step 5: Commit** — `git commit -m "Pantalla de muerte con lápida, pasto, causa resaltada y herederos con Continuar"`.

### Task 7: Revisión visual y README

**Files:**
- Modify: `README.md:57` (fila "Imágenes")
- Script de capturas en el scratchpad (no va al repo)

- [ ] **Step 1: Capturar las 4 pantallas** con Playwright a 390 × 844, `deviceScaleFactor: 1`, en claro y oscuro:
  principal, Inspección fiscal, Actividades y muerte con un heredero. Comparar a ojo con la captura del tablero de
  Figma.
  Expected: misma estructura, colores y formas que en Figma. Una diferencia que no sea de contenido se arregla en la
  regla CSS que corresponde y se vuelve a correr la suite completa.
- [ ] **Step 2: README:** la fila "Imágenes" suma "interfaz de cuaderno mejorado (tarjetas flotantes con sombra
  dura, resaltadores y barras en semáforo) diseñada en Figma".
- [ ] **Step 3: Run all tests**

  Run: `node --test tests/*.test.js && node tests/ui-smoke.js`

  Expected: PASS y "Interfaz OK".

- [ ] **Step 4: Commit** — `git commit -m "README: interfaz de cuaderno mejorado"` (y los ajustes de CSS, si los hubo).
