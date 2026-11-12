# Parte C2 — Dinero: inmuebles, seguros, jubilación y dinero sucio — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inmuebles con inquilinos y 4 tipos nuevos, seguros de vida, salud y hogar, jubilación de 55 a 70 con ahorro
previsional, y dinero sucio que hay que lavar.

**Architecture:** Un módulo por tema bajo `MV.sys`: `realty`, `insurance`, `retirement` y `dirty`. Los enganches en
`money.js`, `career.js`, `crime.js`, `health.js` y `legacy.js` son mínimos. Los datos van en `js/data/realty.js` y
los eventos en `js/data/events/dinero.js`. Los campos nuevos del jugador nacen en `MV.newPlayerBase`; las partidas
viejas los reciben en la migración v8 → v9.

**Tech Stack:**
- JavaScript clásico bajo `window.MV`, sin compilación.
- Pruebas con `node --test` y Playwright.

**Spec:** `docs/superpowers/specs/2026-11-12-dinero-inmuebles-seguros-jubilacion-design.md`

## Global Constraints

- **Valores:** exactamente los de la especificación (tablas de §1–§4). Ningún texto contiene `undefined`, `NaN`,
  `[object` ni `{clave}`.
- **Contenido:**
  - Personas, negocios y empresas inventados.
  - Humor negro sin contenido explícito.
  - Textos en español con concordancia de género (`U.gw`, `MV.gt`).
- **Scripts nuevos en `index.html`** (y por eso en `tests/load.js`):
  - `js/data/realty.js`, después de `js/data/world.js`;
  - `js/systems/realty.js`, `js/systems/insurance.js`, `js/systems/retirement.js` y `js/systems/dirty.js`, antes de
    `js/systems/money.js`;
  - `js/data/events/dinero.js`, después de `js/data/events/trabajo.js`.
- **Dinero del jugador:** nada de esta parte deja `p.money` negativo por sí solo. Si no alcanza, una prima o un aporte
  no se cobran.
- **Partidas:** `MV.VERSION` pasa de 8 a 9.
- **Pruebas:** `node --test tests/*.test.js` (nunca `node --test tests/`) y `node tests/ui-smoke.js`.
- **Commits:** terminan con las líneas `Co-Authored-By` y `Claude-Session` de la sesión.
- **Después de la revisión final:** PR, fusión a `main` y republicar el artifact del juego (patrón del usuario).

## Review Focus

1. **Vender o perder una propiedad alquilada o asegurada** (vender, venta al inquilino, herencia): su seguro de hogar
   deja de existir y no se cobra más prima. Prueba en la Tarea 3.
2. **Mudarte a una propiedad que alquilas:** el inquilino se va y la renta se corta. Prueba en la Tarea 2.
3. **Investigación o lavado con el jugador preso o prófugo:** no hay errores ni doble arresto, y la investigación no
   se abre en prisión. Prueba en la Tarea 6.
4. **Poco dinero:** las primas y los aportes no dejan el dinero en negativo; la póliza se cancela o el aporte se
   saltea. Pruebas en las Tareas 3 y 5.
5. **Continuar como heredero:** empieza sin pólizas, sin fondo y sin dinero sucio; la herencia suma el seguro de vida
   y no el dinero sucio. Pruebas en las Tareas 3 y 6.

---

### Task 1: Datos, compra y mercado inmobiliario

**Files:**
- Create: `js/data/realty.js`
- Create: `js/systems/realty.js`
- Modify: `js/systems/money.js`:
  - `listings` (196–212): fuente por tipo nuevo;
  - `upkeep` (313–318): porcentajes por tipo;
  - bucle de bienes de `yearly` (125–140): valor y desgaste de todos los inmuebles.
- Modify: `js/systems/year.js` (llama `MV.sys.realty.yearly(g)` justo antes de `MV.sys.money.yearly(g)`)
- Modify: `index.html`
- Test: `tests/dinero.test.js` (nuevo)

**Interfaces:**
- Produces:
  - **`MV.REALTY`:** `{ local, terreno, edificio, vacaciones }`. Cada uno es un arreglo de
    `{ kind, icon, price: [min, max] }` con los nombres y rangos de la especificación §1.
  - **`MV.REALTY_NAMES`:** `{ local: 'Locales comerciales', terreno: 'Terrenos', edificio: 'Edificios de departamentos',
    vacaciones: 'Casas de vacaciones' }`.
  - **`MV.RENT_LEVELS`:** `{ barato, normal, caro }`, cada uno
    `{ name, pct, vacancy, mix: { puntual, cuidadoso, moroso, fiestero }, unitVacancy, unitMoroso, factor }`, con
    los valores de las tablas §1:
    - barato: `0.035, 0, {40,35,10,15}, 0.02, 0.10, 0.8`;
    - normal: `0.045, 0.05, {35,25,20,20}, 0.08, 0.15, 1`;
    - caro: `0.06, 0.2, {25,15,35,25}, 0.25, 0.25, 1.3`.
  - **`MV.TENANT_KINDS`:** `{ puntual: { icon: '😇', name: 'puntual' }, moroso: { icon: '🐌', name: 'moroso|morosa' },
    fiestero: { icon: '🎉', name: 'fiestero|fiestera' }, cuidadoso: { icon: '🧹', name: 'cuidadoso|cuidadosa' } }`.
  - **`MV.SHOP_TENANTS`:** los 10 negocios de la especificación.
  - **`MV.sys.realty`:**
    - `isRealty(a) -> boolean`: tipo `casa`, `local`, `terreno`, `edificio` o `vacaciones`;
    - `market(g) -> { phase, left }`: crea `g.realty = { phase: 'estable', left: 3 }` si falta;
    - `marketMod(g) -> number`: auge 0,06; estable 0; caída −0,06;
    - `yearly(g) -> void`: baja `left`; en 0 elige otra fase distinta al azar con `left = U.int(2, 5)`.

- [ ] **Step 1: Write the failing tests** en `tests/dinero.test.js` (con `load` y `BAD_TEXT`, como en
  `trabajo.test.js`):
  - **`'listados de los 4 tipos nuevos'`:** para cada tipo, `MV.sys.money.listings(g, tipo)` devuelve hasta 6
    elementos con `type === tipo` y valor dentro del rango de su variante.
  - **`'un inmueble que no es casa nunca es tu hogar'`:**
    - Con `p.housing = 'alquiler'`, comprar un `local` al contado deja `p.housing === 'alquiler'` y `p.home` igual.
    - Lo mismo con `terreno`, `edificio` y `vacaciones`.
  - **`'mantenimiento por tipo'`:** con valor 100.000, `upkeep` da local 1.000, terreno 200, edificio 1.500 y
    vacaciones 1.000.
  - **`'el mercado alterna fases y mueve los valores'`:**
    - Con 60 llamadas a `realty.yearly`, cada tramo dura de 2 a 5 años y nunca se repite la misma fase seguida.
    - Con 200 semillas, el promedio del cambio de valor de una casa en `auge` supera al de `caida` por 0,10 a 0,14.
      Se fija `g.realty.phase`, se llama `money.yearly` y se compara.
  - **`'los terrenos se valorizan más'`:** en fase estable y 300 semillas, el cambio promedio del terreno supera al de
    la casa por 0,02 a 0,06.
- [ ] **Step 2: Run** `node --test tests/dinero.test.js`.

  Expected: FAIL, `listings` para `local` devuelve lujos o falla.

- [ ] **Step 3: Implement**
  - **`listings`:** si `MV.REALTY[kind]`, usa esa fuente y nombra `"${kind} en ${calle}"` como las casas.
  - **`buy`:** sin cambios (solo `casa` toca la vivienda).
  - **`upkeep`:** suma los porcentajes por tipo.
  - **En `money.yearly`, todo inmueble (`isRealty`):**
    - valor × `(1 + U.float(-0.04, 0.08) + mods.house + marketMod)`, y el terreno suma además `U.float(0.02, 0.06)`;
    - desgaste: el terreno no se desgasta; el resto, como la casa;
    - los tipos nuevos ya no caen en la rama de lujos.
  - **Renta:** la vieja (`a.rented`) se mantiene en esta tarea solo para las casas.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Inmuebles: locales, terrenos, edificios y casas de vacaciones; mercado inmobiliario"`.

### Task 2: Alquiler en tres niveles, inquilinos, edificio, vacaciones y construir

**Files:**
- Modify: `js/systems/realty.js`
- Modify: `js/systems/money.js` (reemplaza `if (a.rented) income += …` por `realty.income(g)`; el desgaste se reduce a
  la mitad con inquilino cuidadoso)
- Test: `tests/dinero.test.js`

**Interfaces:**
- Consumes: `MV.RENT_LEVELS`, `MV.TENANT_KINDS` y `MV.SHOP_TENANTS` (Tarea 1).
- Produces en `MV.sys.realty`:
  - **`rentable(a) -> boolean`:** `casa` que no es el hogar, `local` o `edificio`.
  - **`newTenant(g, a, level) -> { name, kind, gender? }`:** en `casa`, persona con nombre del país del jugador; en
    `local`, un negocio de `SHOP_TENANTS`. El tipo sale sorteado con `mix`.
  - **`rentOut(g, id, level) -> string`:** pone `a.rent = { level, tenant, since: edad }` (en `edificio`,
    `tenant: null`) y `a.rented = true`.
  - **`stopRent(g, id) -> string`:** borra `a.rent` y pone `a.rented = false`.
  - **`setLevel(g, id, level) -> string`:** una vez por año (`a.rent.changed === edad` → rechaza).
  - **`moveIn(g, id) -> string`:** solo `casa`. Primero `stopRent`, después la hace tu hogar.
  - **`income(g) -> { amount, lines }`:** por cada inmueble alquilado o casa de vacaciones.
    - **Casa y local:** renta = valor × `pct` × (1,5 si es local).
      - Año vacío con chance `vacancy`: sin renta y llega un inquilino nuevo.
      - Moroso: 40 % sin renta y marca `a.rent.unpaid = edad`.
      - Fiestero: 30 % marca `a.rent.broke = edad`.
      - Si `a.rent.owed`, paga el doble una vez y lo borra.
    - **Edificio:** la regla de las unidades, y la línea "N de 6 departamentos pagaron".
    - **Vacaciones:** valor × `U.float(0, 0.12)`, a la mitad si `a.summer === edad`.
  - **`summerAction(g, id) -> action`:** "Veranear ahí", límite 1, scope por propiedad. Da +6 de felicidad y −8 de
    estrés, y marca `a.summer`.
  - **`build(g, id, what: 'casa'|'local') -> string`:**
    - casa: cuesta 1 × el valor y pasa a `type 'casa'`, nombre `'Casa en tu terreno'`, valor × 2,2, condición 100;
    - local: cuesta 1,2 × el valor y pasa a `type 'local'`, valor × 2,5;
    - si no alcanza, lo explica.

- [ ] **Step 1: Write the failing tests:**
  - **`'renta por nivel y tipo'`:** con valor 100.000, nivel barato y tipo de inquilino forzado a `puntual`, `income`
    da 3.500 para una casa y 5.250 para un local.
  - **`'años vacíos según el nivel'`:**
    - Con 400 semillas en caro, la tasa de años vacíos queda entre 0,13 y 0,27.
    - En barato es 0.
  - **`'inquilinos según el nivel'`:** con 2.000 sorteos de `newTenant` en caro, los morosos son entre 30 y 40 %. Los
    locales tienen nombre de `SHOP_TENANTS`.
  - **`'moroso, fiestero y cuidadoso'`:**
    - Moroso: entre 30 y 50 % de los años sin renta, con `unpaid`.
    - Fiestero: entre 20 y 40 % con `broke`.
    - Cuidadoso: la condición promedio baja la mitad que sin inquilino (± 0,7 puntos).
  - **`'edificio'`:**
    - En 200 semillas, la renta nunca pasa de valor × 0,05 × 1,3.
    - La línea dice "de 6 departamentos pagaron".
  - **`'vacaciones y veranear'`:**
    - La renta queda entre 0 y 12 % del valor; después de veranear, ≤ 6 %.
    - Veranear tiene límite 1 y da +6 de felicidad y −8 de estrés.
  - **`'construir en un terreno'`:**
    - Casa: cuesta el valor, queda con valor × 2,2 y condición 100.
    - Local: cuesta 1,2 × el valor y queda con valor × 2,5.
    - Sin dinero suficiente: mensaje y nada cambia.
  - **`'cambiar el nivel una vez por año'`.**
  - **`'mudarte a tu casa alquilada saca al inquilino'`** (Foco 2): `moveIn` deja `a.rent` sin definir,
    `a.rented === false` y `p.home === id`, y `income` ya no la cuenta.
- [ ] **Step 2: Run** `node --test tests/dinero.test.js`.

  Expected: FAIL, `rentOut` no existe.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Alquiler en tres niveles con inquilinos; edificio, casa de vacaciones y construir"`.

### Task 3: Seguros de vida, salud y hogar

**Files:**
- Create: `js/systems/insurance.js`
- Modify: `js/core/state.js` (`newPlayerBase`: `insurance: { vida: 0, salud: false, hogar: {} }`)
- Modify: `js/systems/health.js:27` (costo × `insurance.healthFactor(g)`)
- Modify: `js/systems/legacy.js`:
  - `die`: `summary.lifeIns`;
  - `estateFor`: `total += round(lifeIns × share)`.
- Modify: `js/systems/money.js` (`sellFor` llama `insurance.forget(g, id)`)
- Modify: `js/systems/year.js` (`MV.sys.insurance.yearly(g)` justo después de `money.yearly`)
- Modify: `index.html`
- Test: `tests/dinero.test.js`

**Interfaces:**
- Produces en `MV.sys.insurance`:
  - **`premium(g, kind, arg?) -> number`:**
    - vida: `suma × (0.002 + edad/10000) × (salud < 40 ? 2 : 1)`;
    - salud: `1500 + edad × 40`;
    - hogar: `0.003 × valor`, con `arg = idPropiedad`.
    - Redondeado.
  - **`buy(g, kind, arg) -> string`:**
    - desde los 18;
    - vida: `arg` es la suma (100.000, 500.000 o 2.000.000); con salud < 20 rechaza con el texto exacto de la
      especificación;
    - hogar: `arg` es el id de una propiedad tuya.
  - **`cancel(g, kind, arg?) -> string`.**
  - **`covered(g, kind, arg?) -> boolean`.**
  - **`healthFactor(g) -> 0.2 | 1`.**
  - **`forget(g, assetId) -> void`:** quita la póliza de hogar de esa propiedad.
  - **`yearly(g) -> void`:** cobra cada póliza. Si `p.money < prima`, la cancela con un registro en el diario: "Se
    canceló tu seguro de … por falta de pago".

- [ ] **Step 1: Write the failing tests:**
  - **`'primas exactas'`:**
    - Vida de 500.000 a los 40 años con salud 80: 3.000; con salud 30: 6.000.
    - Salud a los 40: 3.100.
    - Hogar de una propiedad de 200.000: 600.
  - **`'quién puede contratar'`:**
    - Con 17 años, rechazado.
    - Vida con salud 15: el texto exacto "Ninguna aseguradora te quiere: dicen que eres un riesgo con patas".
  - **`'cobro anual y cancelación por falta de pago'`** (Foco 4): con $100 y seguro de vida, `yearly` cancela, el
    dinero queda en 100 y aparece la línea en el diario.
  - **`'salud paga el 80 % de los tratamientos'`:** con seguro de salud, `health.treat` descuenta
    `round(C.cost × T.cost × 0.2)`.
  - **`'vida suma la herencia de los herederos'`:**
    - Con un hijo como único heredero, `estateFor(...).total` con vida de 500.000 es exactamente 500.000 más que sin
      seguro.
    - Al continuar como el heredero, su `insurance` empieza vacío (Foco 5).
  - **`'vender una propiedad asegurada borra su póliza'`** (Foco 1): asegurar una casa, venderla con
    `money.sellFor`, `covered(...,'hogar', id) === false`, y `yearly` no cobra esa prima.
- [ ] **Step 2: Run** `node --test tests/dinero.test.js`.

  Expected: FAIL, `MV.sys.insurance` undefined.

- [ ] **Step 3: Implement** según la Interface, con los enganches indicados.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Seguros de vida, salud y hogar"`.

### Task 4: Eventos de inquilinos, desastres y robos asegurados

**Files:**
- Create: `js/data/events/dinero.js`
- Modify: `js/systems/realty.js` (`income` encola `inquilino_no_paga` y `inquilino_rompe`; cada propiedad alquilada
  tiene 5 % al año de `inquilino_compra` y 8 % de `inquilino_se_va`)
- Modify: `js/data/events/adultez.js:43-48` (`robo_casa`: si tu hogar está asegurado, se devuelve lo robado)
- Modify: `index.html`
- Test: `tests/dinero.test.js`

**Interfaces:**
- Consumes: `realty.newTenant`, `realty.stopRent`, `insurance.covered` y `money.sellFor`.
- Produces:
  - **Eventos con contexto `{ asset: id }`:** `inquilino_no_paga`, `inquilino_rompe`, `inquilino_compra` e
    `inquilino_se_va` (este último, aviso).
  - **`desastre_hogar`:** evento automático con peso 0,3. Solo aparece si tienes inmuebles y elige uno al azar.
  - **Opciones**, en el orden de la especificación §1:
    - **no paga:**
      - Esperar marca `a.rent.owed` con 50 %; si no, el inquilino se va.
      - Desalojar cuesta $3.000, pone un inquilino nuevo y deja la propiedad vacía ese año (`a.rent.vacant = edad`).
      - Perdonar da +3 de karma y, con 50 %, el inquilino pasa a `puntual`.
    - **rompe:**
      - Cobrarle: 70 % paga; 30 % se va.
      - Pagarlo tú cuesta el 5 % del valor.
      - "Usar el seguro de hogar" solo aparece si está asegurada; no pagas nada.
      - Si nadie paga, la condición baja 15.
    - **compra:**
      - Vender: `sellFor(valor × 1,05)`.
      - No vender.
    - **desastre:** condición −40; si no está asegurada, cuesta el 10 % del valor.

- [ ] **Step 1: Write the failing tests:**
  - **`'los eventos de inquilinos tienen textos limpios y hacen lo que dicen'`:** para cada evento, con una casa
    alquilada, verificar cada opción:
    - desalojar: −3.000 y vacía;
    - perdonar: +3 de karma;
    - pagarlo tú: −5 % del valor;
    - usar el seguro: sin costo, y solo aparece con póliza;
    - vender: la propiedad ya no está y el dinero sube valor × 1,05 (± 1);
    - desastre: condición −40, y −10 % del valor sin seguro.
  - **`'esperar al moroso puede traer el doble'`:** con `a.rent.owed`, la renta siguiente se duplica una vez.
  - **`'el robo en tu casa asegurada no te cuesta'`:** `robo_casa` con la opción "Llamar a la policía" deja el dinero
    igual si el hogar está asegurado, y el texto lo dice.
  - **`'income encola los eventos'`:** con un moroso sin pagar, la cola tiene `inquilino_no_paga` con `ctx.asset`.
- [ ] **Step 2: Run** `node --test tests/dinero.test.js`.

  Expected: FAIL, evento desconocido `inquilino_no_paga`.

- [ ] **Step 3: Implement** los eventos (íconos: no paga 🐌, rompe 💥, compra 🤝, se va 📦, desastre 🔥) y los
  enganches.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Eventos de inquilinos, desastres en tus propiedades y robos asegurados"`.

### Task 5: Jubilación de 55 a 70 con ahorro previsional

**Files:**
- Create: `js/systems/retirement.js`
- Modify: `js/core/state.js` (`newPlayerBase`: `pensionFund: 0, pensionRate: 0`)
- Modify: `js/systems/career.js`:
  - `retire` (96–109): desde los 55 y pensión con `pensionFor`;
  - acción `jubilarse` (`p.age >= 55`).
- Modify: `js/systems/money.js` (`netWorth` suma `p.pensionFund`)
- Modify: `js/systems/year.js` (`MV.sys.retirement.yearly(g)` después de `money.yearly`)
- Modify: `index.html`
- Test: `tests/dinero.test.js`

**Interfaces:**
- Produces en `MV.sys.retirement`:
  - **`RATES = [0, 0.05, 0.10, 0.15]`.**
  - **`setRate(g, rate) -> string`.**
  - **`ageFactor(age) -> number`:** `age < 65 ? 1 − (65 − age) × 0.03 : 1 + (min(age, 70) − 65) × 0.04`.
  - **`pensionFor(g) -> { base, factor, annuity, total }`:**
    - `base` es la cuenta de hoy;
    - `annuity = fondo / max(10, 85 − edad)`;
    - `total = round(base × factor + annuity)`.
  - **`yearly(g) -> void`:**
    - aporta `round(sueldo × rate)` si hay trabajo, no está jubilado y `p.money ≥ aporte`;
    - el fondo crece `× (1 + U.float(0.01, 0.06))`.
  - **`retireWithSavings(g) -> string`:** sin trabajo, 55 años o más y fondo > 0.
  - **`withdraw(g) -> string`:** cobras el 70 % del fondo; el fondo queda en 0.

- [ ] **Step 1: Write the failing tests:**
  - **`'factor por edad'`:** 55 → 0,70; 60 → 0,85; 65 → 1; 70 → 1,2; 75 → 1,2 (con `assert.ok(Math.abs(...) < 1e-9)`).
  - **`'aportes y crecimiento del fondo'`:**
    - Con sueldo 50.000 y 10 %, el fondo sube entre 5.000 × 1,01 y 5.000 × 1,06, y el dinero baja 5.000.
    - Con dinero menor que el aporte, no aporta y el dinero no cambia (Foco 4).
  - **`'pensión con fondo y edad'`:**
    - A los 60 con fondo de 250.000, `pensionFor` da `total = round(base × 0.85 + 250000 / 25)`.
    - `career.retire` a los 60 usa ese total y deja el fondo en 0.
  - **`'jubilarse desde los 55'`:**
    - A los 54, `retire` dice "Aún no puedes jubilarte." y la acción `jubilarse` no aparece.
    - A los 55 aparece y funciona.
  - **`'retirarte con tu ahorro y sacar el fondo'`:**
    - Sin trabajo, a los 56 con fondo 290.000, la pensión es `round(290000 / 29)` y queda jubilado.
    - `withdraw` con fondo 100.000 cobra 70.000.
  - **`'el fondo suma al patrimonio'`.**
  - **`'el heredero empieza sin fondo'`** (Foco 5).
- [ ] **Step 2: Run** `node --test tests/dinero.test.js`.

  Expected: FAIL, `MV.sys.retirement` undefined.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS. Ajustar las pruebas viejas que fijan "60 años" con un `Ruling:`.

- [ ] **Step 5: Commit** — `git commit -m "Jubilación de 55 a 70 años con ahorro previsional"`.

### Task 6: Dinero sucio, lavado e investigación

**Files:**
- Create: `js/systems/dirty.js`
- Modify: `js/core/state.js` (`newPlayerBase`: `dirty: 0`)
- Modify:
  - `js/systems/crime.js:22,26` (el botín va a `dirty.add` y el texto dice "(dinero sucio)");
  - `js/systems/career.js` (encargo de la mafia y "Aceptar un sobre" van a `dirty.add`);
  - `js/systems/legacy.js` (`die`: registra el decomiso y pone `p.dirty = 0` antes del resumen).
- Modify: `js/data/events/dinero.js` (`investigacion_lavado`)
- Modify: `js/systems/year.js` (`MV.sys.dirty.yearly(g)` después de `crime.yearly`)
- Modify: `index.html`
- Test: `tests/dinero.test.js`

**Interfaces:**
- Produces en `MV.sys.dirty`:
  - **`add(g, amount) -> void`.**
  - **`METHODS`:** objeto con `negocio`, `casino`, `contador` e `inmueble`, cada uno `{ icon, label, fee, risk, cap }`:
    - negocio: 0,10 / 0,05 / 50.000 por negocio o empresa;
    - casino: 0,25 / 0,10 / sin tope;
    - contador: 0,20 / 0,15 / 200.000;
    - inmueble: 0,15 / 0,20 / 500.000.
  - **`limit(g, method) -> number`:** negocio = 50.000 × (negocio + empresas), y 0 si no hay ninguno.
  - **`launder(g, method) -> string`:** lava `min(p.dirty, limit)` y cobra la comisión. Con chance `risk` encola
    `investigacion_lavado`.
  - **`actions(g) -> action[]`:** una por método con `limit: 1`, `id 'lavar_' + método` y un `check` que explica qué
    falta.
  - **`yearly(g) -> void`:** si `!p.prison && p.dirty > 50000`, con chance `min(0.35, dirty / 1000000)` encola la
    investigación.
  - **`investigacion_lavado`:** decisión con `when: !p.prison && p.dirty > 0`:
    - **Abogado:** $20.000. Con 60 % se archiva; con 40 %, `dirty = 0` y una multa del 20 % del dinero limpio.
    - **Confesar:** `dirty = 0` y `crime.arrest(g, 'Lavado de dinero', 2)`.
    - **Huir:** `p.wanted = max(p.wanted, 3)`, conservando el sucio.

- [ ] **Step 1: Write the failing tests:**
  - **`'los delitos, la mafia y los sobornos dan dinero sucio'`:**
    - Con semilla de éxito en `crime.commit` de un delito con botín, `p.dirty` sube, `p.money` no cambia y el texto
      dice "dinero sucio".
    - El encargo de la mafia y "Aceptar un sobre" también suben `dirty`.
    - `netWorth` no lo cuenta.
  - **`'lavar respeta límite, comisión y requisito'`:**
    - Con 300.000 sucios, el contador lava 200.000 y suma 160.000 limpios.
    - El casino lava todo con 25 % de comisión.
    - El negocio sin negocio ni empresa queda bloqueado con un mensaje.
    - Con una empresa lava 50.000.
    - Cada método va una vez por año (`doAction` bloquea el segundo).
  - **`'la investigación se abre según el sucio'`:**
    - Con 40.000 sucios, nunca en 200 semillas.
    - Con 1.000.000, entre 25 y 45 %.
    - En prisión, nunca (Foco 3).
  - **`'las tres salidas de la investigación'`:**
    - Abogado: se ven ambos resultados con semillas.
    - Confesar: preso, con antecedente "Lavado de dinero".
    - Huir: `wanted ≥ 3`.
    - Ningún texto con marcas prohibidas.
  - **`'el dinero sucio no se hereda'`** (Foco 5):
    - Al morir con 80.000 sucios, `summary.worth` no los incluye y el diario registra el decomiso.
    - El heredero empieza con `dirty === 0`.
- [ ] **Step 2: Run** `node --test tests/dinero.test.js`.

  Expected: FAIL, `MV.sys.dirty` undefined.

- [ ] **Step 3: Implement** según la Interface y los enganches.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS. Ajustar las pruebas viejas que esperaban el botín en `p.money` con un `Ruling:`.

- [ ] **Step 5: Commit** — `git commit -m "Dinero sucio: lavado con cuatro métodos e investigaciones"`.

### Task 7: Interfaz y partidas versión 9

**Files:**
- Modify: `js/ui/sheets.js`:
  - `renderAssets` (227–288): mercado, comprar, seguros y dinero sucio;
  - `showAsset` (308+): alquiler, inquilino, construir, veranear, asegurar y "Mudarte aquí" con `realty.moveIn`;
  - `showMarket` (412–430): títulos de los tipos nuevos e hipoteca para todo inmueble;
  - `showWork`: caja `#pension-box`.
- Modify: `js/core/state.js` (`MV.VERSION = 9`)
- Modify: `js/systems/save.js` (paso `g.version === 8`)
- Test: `tests/dinero.test.js`, `tests/save.test.js` (si fija la versión) y `tests/ui-smoke.js`

**Interfaces:**
- Consumes: todo lo de las Tareas 1–6.
- **Ids de la interfaz:**
  - `#realty-market`: línea del mercado;
  - `#insurance`: sección de seguros;
  - `#dirty-money`: sección del dinero sucio, solo si `p.dirty > 0`;
  - `#pension-box`: caja de jubilación;
  - `#rent-panel`: caja de alquiler en la ficha de una propiedad.

- [ ] **Step 1: Write the failing tests:**
  - **`'migración v8 → v9'`:**
    - Una partida v8 con una casa `rented: true` y sin los campos nuevos sale con `version 9`, `dirty 0`,
      `insurance` vacío, fondo 0, `g.realty.phase 'estable'` y esa casa con `rent.level 'normal'` e inquilino.
    - `MV.VERSION === 9`.
  - **Smoke** (bloque "Parte C2" antes de `// Avanzar 5 años`):
    - Abrir Bienes: existen `#realty-market` y `#insurance`, y "Comprar" lista locales, terrenos, edificios y casas de
      vacaciones.
    - Con `p.dirty = 120000`, existe `#dirty-money` con 4 métodos.
    - Comprar una casa extra por código, alquilarla con `rentOut` y abrir su ficha: `#rent-panel` muestra el nivel y el
      ícono y nombre del inquilino.
    - Ocupación muestra `#pension-box` con las 4 opciones de aporte.
    - Ningún texto "null" ni "undefined" en esas hojas.
- [ ] **Step 2: Run** `node --test tests/dinero.test.js && node tests/ui-smoke.js`.

  Expected: FAIL, la versión es 8 y no existe `#realty-market`.

- [ ] **Step 3: Implement** la interfaz de la especificación §5, el paso de migración y `MV.VERSION = 9`.
- [ ] **Step 4: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Bienes muestra mercado, seguros, inquilinos y dinero sucio; jubilación en Ocupación; partidas versión 9"`.

### Task 8: Jugador automático, README y verificación

**Files:**
- Modify: `tests/agent.js` (suma `dirty.actions(g)`, veranear y construir a sus acciones posibles)
- Modify: `README.md` (filas de Bienes, Dinero y Crimen)

- [ ] **Step 1: Agente.** Sumar las acciones. Con 20 vidas `live(MV, g, { acts: 4 })` (semillas 300–319): 0 errores.
  Algún evento de inquilino y alguna investigación aparecen en `g.evDone`.
- [ ] **Step 2: README.** Sumar:
  - locales, terrenos, edificios y casas de vacaciones, con inquilinos y tres niveles de alquiler;
  - seguros de vida, salud y hogar;
  - jubilación de 55 a 70 con ahorro previsional;
  - dinero sucio que hay que lavar.
- [ ] **Step 3: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.

  Expected: PASS y "Interfaz OK".

- [ ] **Step 4: Commit** — `git commit -m "README: inmuebles, seguros, jubilación y dinero sucio; el jugador automático los usa"`.
