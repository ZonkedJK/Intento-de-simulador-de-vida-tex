# Parte C1 — Trabajo: jefe, compañeros, negociación, más empleos y decisiones — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Los trabajos de tiempo completo tienen jefe y compañeros con nombre, se negocia el sueldo al entrar y al pedir aumento, hay 15 empleos nuevos y encargos freelance, y aparecen 12 decisiones laborales.

**Architecture:**
- **Lógica:** un módulo nuevo, `js/systems/workplace.js` (`MV.sys.workplace`), guarda y consulta jefe y compañeros. Son relaciones normales: tipo nuevo `jefe` y el `companero` existente. `career.js` lo llama al contratar, al dejar el trabajo y en el año.
- **Datos:** caracteres, roles y encargos van en `js/data/work.js`; los empleos, en `careers.js`.
- **Eventos:** oferta, aumento y las 12 decisiones van en `js/data/events/trabajo.js`.

**Tech Stack:**
- JavaScript clásico bajo `window.MV`, sin compilación.
- Pruebas con `node --test` y Playwright.

**Spec:** `docs/superpowers/specs/2026-11-12-trabajo-jefes-negociacion-design.md`

## Global Constraints

- **Alcance:** todo aplica solo a trabajos `type: 'full'`. Medio tiempo, fama, deportes y mafia no cambian. El
  freelance se puede hacer con o sin trabajo.
- **Contenido:**
  - Personas, empresas y lugares inventados, sin marcas.
  - Humor negro sin contenido explícito.
  - Textos en español con concordancia de género (`MV.gt`, `U.gw`, `{o}`).
  - Ningún texto puede contener `undefined`, `NaN`, `[object` ni `{clave}` sin reemplazar.
- **Partidas:** `MV.VERSION` pasa de 7 a 8, con migración v7 → v8.
- **Scripts nuevos en `index.html`** (y por eso en `tests/load.js`):
  - `js/data/work.js`, después de `js/data/careers.js`;
  - `js/systems/workplace.js`, después de `js/systems/career.js`;
  - `js/data/events/trabajo.js`, después de `js/data/events/deportes.js`.
- **Probabilidades:** se limitan con `U.clamp(x, 0.05, 0.95)` donde la especificación lo pide.
- **Pruebas:** `node --test tests/*.test.js` (nunca `node --test tests/`) y `node tests/ui-smoke.js`.
- **Commits:** terminan con las líneas `Co-Authored-By` y `Claude-Session` de la sesión.
- **Después de la revisión final:** PR, fusión a `main` y republicar el artifact del juego (patrón del usuario).

## Review Focus

1. **El jefe o un compañero muere, o el jugador los saca de su vida:** el trabajo sigue andando. Sin jefe cuenta
   como relación 50 y carácter Ausente, y al año siguiente llega un jefe nuevo. Prueba en la Tarea 3.
2. **Aceptar una oferta teniendo ya otro trabajo:** el jefe y los compañeros viejos se limpian y llegan los del
   trabajo nuevo. Si la oferta se retira, el trabajo viejo sigue intacto. Prueba en la Tarea 4.
3. **Volver de un año sabático:** el trabajo recuperado no apunta a un jefe o compañeros que ya no son
   relación; recibe gente nueva. Prueba en la Tarea 2.
4. **Trasladarse con casa, pareja e hijos:** cambian país y ciudad, la ciudad es de ese país y nada más se rompe.
   Prueba en la Tarea 6.
5. **Trabajos que no son de tiempo completo** (medio tiempo, fama, deportes) y herederos: nunca reciben jefe ni las
   acciones nuevas. Prueba en la Tarea 2.

---

### Task 1: Datos — caracteres, roles, encargos, tipo de relación "jefe" y 15 empleos

**Files:**
- Create: `js/data/work.js`
- Modify: `js/core/state.js:38-44` (`REL_LABEL.jefe`, `REL_ORDER`)
- Modify: `js/data/careers.js` (15 `J(...)` nuevos antes de `// — Técnicos —` o en la sección que les corresponda)
- Modify: `index.html` (scripts de las Global Constraints; `workplace.js` y `trabajo.js` se agregan en sus tareas)
- Test: `tests/trabajo.test.js` (nuevo)

**Interfaces:**
- **`MV.BOSS_KINDS`:** objeto con las claves `buenazo`, `controlador`, `griton`, `ausente` y `trepador`. Cada valor
  es `{ icon, name: 'Buenazo|Buenaza', promo, raise, stress }`, con:
  - `promo`: buenazo 0,10 y el resto 0;
  - `raise`: buenazo 0,15, trepador −0,10 y el resto 0;
  - `stress`: controlador 2, gritón 3 y el resto 0.
- **`MV.MATE_ROLES`:** `{ aliado: { icon: '🤝', name: 'aliado' }, rival: { icon: '⚔️', name: 'rival' },
  chismoso: { icon: '🗣️', name: 'chismoso' } }`.
- **`MV.FREELANCE`:** arreglo de `{ skill, icon, label }`, en este orden:
  - programacion 💻 "Arreglar la web de un cliente"
  - arte 🎨 "Diseñar un logo"
  - idiomas 🌐 "Traducir un documento"
  - cocina 🍰 "Cocinar para un evento"
  - musica 🎸 "Tocar en un casamiento"
  - carisma 🎙️ "Animar una fiesta"
- **Relaciones:** `MV.relLabel('jefe', n)` devuelve "Jefe" o "Jefa", y `'jefe'` va en `MV.REL_ORDER` justo después
  de `'companero'`.
- **Empleos:** `MV.jobById(id)` encuentra los 15 empleos nuevos.

- [ ] **Step 1: Write the failing tests** en `tests/trabajo.test.js`:
  - **`'datos: caracteres de jefe, roles y encargos'`:**
    - Las claves de `BOSS_KINDS` son exactamente las 5.
    - `BOSS_KINDS.buenazo.raise === 0.15` y `BOSS_KINDS.trepador.raise === -0.1`.
    - Los `stress` son `{controlador: 2, griton: 3}`, y 0 en el resto.
    - `MATE_ROLES` tiene 3 claves.
    - `FREELANCE.map(f => f.skill)` es igual a
      `['programacion','arte','idiomas','cocina','musica','carisma']`, y cada `skill` existe en `MV.SKILLS`.
  - **`'relación jefe'`:**
    - `MV.relLabel('jefe', {gender:'f'}) === 'Jefa'`.
    - `MV.REL_ORDER.indexOf('jefe') === MV.REL_ORDER.indexOf('companero') + 1`.
  - **`'15 empleos nuevos con la forma de los demás'`:**
    - Cada id de `['jardinero','cartero','pescador','bibliotecario','barista','tatuador','crupier','detective',`
      `'paramedico','farmaceutico','dentista','sommelier','controlador','diplomatico','guardaparques']` existe con
      `type === 'full'`.
    - Tiene 3 títulos y 3 sueldos estrictamente crecientes, y los sueldos son exactamente los de la tabla §5 de la
      especificación (`jardinero` `[16000, 28000, 52000]`, …, `guardaparques` `[20000, 32000, 52000]`).
    - Cada título trae la forma femenina cuando difiere (`MV.gt(t,'f')` sin `|`).
    - `tatuador.skillUp === 'arte'`, `barista` y `sommelier` → `'cocina'`, `diplomatico` → `'idiomas'`,
      `controlador.stress === 9`.
  - **`'requisitos de los empleos nuevos'`:** con un `g` de 30 años sin estudios, `meets(g, dentista).ok === false`
    y las razones incluyen "Título en Medicina". Con un título de medicina (`p.edu.degrees.push({ kind:
    'universidad', major: 'medicina' })`), `ok === true`.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js`.

  Expected: FAIL, `MV.BOSS_KINDS` undefined.

- [ ] **Step 3: Implement**
  - Crear `work.js` con esos tres objetos.
  - Agregar `jefe: ['Jefe', 'Jefa']` y `'jefe'` en `REL_ORDER`.
  - Agregar los 15 `J(...)` con títulos, sueldos y requisitos de la tabla §5. Rangos de estrés de 1 a 9:
    - jardinero, bibliotecario, guardaparques: 1;
    - cartero, tatuador, sommelier: 2;
    - pescador, barista, farmacéutico: 3;
    - crupier, dentista: 4;
    - detective, diplomático: 5;
    - paramédico: 6;
    - controlador: 9.
  - Sumar el `<script>` de `work.js` a `index.html`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: todo PASS. `tests/data.test.js` sigue verde con los empleos nuevos.

- [ ] **Step 5: Commit** — `git commit -m "Datos del trabajo: caracteres de jefe, roles, encargos y 15 empleos nuevos"`.

### Task 2: Motor del lugar de trabajo — jefe y compañeros al contratar y al dejar el trabajo

**Files:**
- Create: `js/systems/workplace.js`
- Modify: `js/systems/career.js`:
  - `hire` (53–61): llama a `staff` después de crear el trabajo;
  - `leave` (63–68): llama a `cleanup` antes de borrar `p.job`;
  - vuelta del sabático (117–126).
- Modify: `index.html` (script de `workplace.js`)
- Test: `tests/trabajo.test.js`

**Interfaces:**
- Consumes: `MV.BOSS_KINDS`, `MV.MATE_ROLES` (Tarea 1); `MV.newNPC`, `MV.addRel`, `MV.relOf` y `MV.removeRel`
  (existentes).
- Produces en `MV.sys.workplace`:
  - **`staff(g) -> void`:**
    - Si `p.job.type === 'full'` y no hay un jefe vivo que sea relación, crea el jefe (30–65 años, país del jugador,
      relación `jefe` 45–60, `kind` al azar) y guarda `p.job.boss = { id, kind }`.
    - Si `p.job.mates` no tiene 2 compañeros vivos que sean relación, completa hasta 2. Cada uno es
      `{ id, role, bossRel }`, con un rol distinto de los que ya estén, edad
      `U.clamp(p.age + U.int(-15, 15), 18, 70)`, relación `companero` 40–65 y `bossRel` 30–70.
  - **`cleanup(g) -> void`:** sobre el trabajo actual:
    - el jefe con relación ≥ 80 pasa a `amigo`; si no, `removeRel`;
    - cada compañero de `mates` con relación > 60 pasa a `amigo`; si no, `removeRel`;
    - después, `p.job.boss = null` y `p.job.mates = []`.
  - **`restaff(g) -> void`:** `cleanup` y después `staff`.
  - **`boss(g) -> { n, r, kind, K } | null`:** jefe vivo que sigue siendo relación, o `null`.
  - **`mate(g, role) -> { n, r, m } | null`:** compañero vivo de ese rol que sigue siendo relación, o `null`.

- [ ] **Step 1: Write the failing tests:**
  - **`'contratar crea jefe y 2 compañeros de roles distintos'`:**
    - `career.hire(g, MV.jobById('cajero'))`.
    - `boss(g).r.type === 'jefe'` y `kind` está en `BOSS_KINDS`.
    - `p.job.mates.length === 2`, con roles distintos, cada `relOf` de tipo `companero`, y `bossRel` entre 30 y 70.
  - **`'dejar el trabajo limpia jefe y compañeros según la relación'`:**
    - Se fijan: relación del jefe 85, compañero A 70 y compañero B 30.
    - Tras `career.leave(g, 'renuncia')`: el jefe es `amigo`, A es `amigo` y B ya no es relación.
  - **`'cambiar de trabajo trae gente nueva'`:**
    - Contratar `cajero` y después `cartero`.
    - El jefe viejo (relación 50) ya no es relación, y el nuevo `boss(g).n.id` es distinto.
  - **`'el sabático vuelve con gente nueva'`** (Foco 3):
    - Con trabajo y staff, fijar `p.flags.sabbatical` como lo hace la acción `sabatico`, llamar
      `career.leave(g,'año sabático')` y avanzar la edad.
    - Forzar el regreso: `U.chance` sale con semilla, o se iteran semillas hasta que vuelva.
    - Llamar `career.yearly(g)`.
    - Si el trabajo volvió, `boss(g)` no es `null` y cada `mates[i].id` tiene `relOf`.
  - **`'medio tiempo, fama y deporte no tienen jefe'`** (Foco 5): `career.hire` con `repartidor`, con
    `MV.FAME.actor` y con un `MV.SPORT_JOBS` cualquiera. Ninguno deja `p.job.boss` ni crea relaciones `jefe`.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js`.

  Expected: FAIL, `MV.sys.workplace` undefined.

- [ ] **Step 3: Implement** el módulo y los tres puntos de enganche en `career.js`. En la vuelta del sabático:
  `p.job.boss = null; p.job.mates = []; MV.sys.workplace.staff(g)`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Lugar de trabajo: jefe y compañeros con nombre al contratar y al irse"`.

### Task 3: El jefe en el año laboral — ascensos, despidos, estrés, bono y acciones

**Files:**
- Modify: `js/systems/workplace.js` (funciones nuevas)
- Modify: `js/systems/career.js`:
  - `yearly` (111–150): peso del rendimiento, chance de ascenso, regla de despido y llamada a `workplace.yearly`;
  - `actions` (190–233): `esforzarse`, `jefe` y la nueva `adular`.
- Test: `tests/trabajo.test.js`

**Interfaces:**
- Consumes: `boss`, `mate` y `staff` (Tarea 2).
- Produces en `MV.sys.workplace`:
  - **`promoMod(g) -> number`:**
    - `(rel − 50)/200` (sin jefe, rel = 50);
    - `+ K.promo`;
    - `− 0.20` si es trepador con rel < 50;
    - `− 0.10` si el rival tiene `bossRel ≥ 60`.
  - **`raiseMod(g) -> number`:** `K.raise`, o 0 sin jefe.
  - **`fireRule(g) -> { perf, chance }`:** `{ 30, 0.55 }` si rel < 25; si no, `{ 22, 0.4 }`.
  - **`yearly(g) -> void`:**
    - suma el `K.stress` del carácter, y +4 si `job.weekends`;
    - paga el bono;
    - resuelve `job.cooked` y `job.hidden` del año anterior (Tarea 6);
    - si falta el jefe, llama `newBoss(g, true)`;
    - completa compañeros con `staff`.
  - **`bonus(g) -> number`:** paga y devuelve el bono, o 0. Hay bono si `perf ≥ 80`,
    `MV.sys.world.mods(g).hire >= 0` y `U.chance(0.6)`; es `salary × U.float(0.05, 0.15)`, redondeado.
  - **`newBoss(g, info: boolean) -> void`:** quita la relación del jefe actual, crea otro con `staff` y, si `info`,
    encola `trabajo_jefe_nuevo` (Tarea 6) o un `MV.EV.info` con su nombre, ícono y carácter.

- [ ] **Step 1: Write the failing tests:**
  - **`'la relación con el jefe mueve el ascenso'`:**
    - Con jefe `ausente`, rel 100 da `promoMod === 0.25` y rel 0 da −0,25.
    - Con `trepador` y rel 40: −0,05 − 0,20 = −0,25.
    - Con `buenazo` y rel 50: +0,10.
    - Un rival con `bossRel` 70 resta 0,10.
  - **`'regla de despido'`:** con rel 20, `fireRule` da `{perf:30, chance:0.55}`; con rel 50, `{perf:22, chance:0.4}`.
  - **`'estrés por carácter y fines de semana'`:**
    - Con todo igual, `controlador` suma 2 de estrés más que `ausente` en `workplace.yearly`.
    - `griton` suma 3, y `job.weekends` suma 4.
  - **`'bono: solo con buen rendimiento y sin crisis'`:**
    - Con `perf` 90 y 50 semillas, al menos uno paga entre 5 y 15 % del sueldo.
    - Con `perf` 70, nunca paga.
    - Con `g.world` en una noticia con `mods.hire < 0` (se toma de `MV.NEWS`), nunca paga.
  - **`'sin jefe el trabajo sigue y llega otro'`** (Foco 1):
    - `MV.removeRel` del jefe (o `n.alive = false`).
    - `promoMod` usa rel 50, `career.actions(g)` no lanza error y `workplace.yearly(g)` deja un `boss(g)` nuevo.
  - **`'hablar con el jefe según su carácter'`:** para cada `kind`, se fija el jefe y se corre la acción `jefe` con
    `MV.doAction`:
    - buenazo: +5 de relación;
    - controlador: +4 de rendimiento;
    - ausente: sin cambios de rendimiento ni relación;
    - trepador: +3 de relación y −3 de rendimiento;
    - gritón: semillas hasta ver ambos casos, −4 de felicidad o nada.
  - **`'caerle bien al jefe'`:** la acción `adular` existe solo en trabajos `full`. Sube la relación del jefe entre
    4 y 10, baja 1 de karma y baja 2 la relación de cada compañero de `mates`. Límite 1.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js`.

  Expected: FAIL, `promoMod` undefined.

- [ ] **Step 3: Implement**
  - **En `career.yearly`:**
    - Si el carácter es `controlador`, el rendimiento usa pesos 0,5 / 0,5 en lugar de 0,6 / 0,4.
    - La chance de ascenso suma `workplace.promoMod(g)`.
    - El despido usa `fireRule` (umbral y chance).
    - Llama `workplace.yearly(g)` si el trabajo es `full`.
  - **`esforzarse`:** con jefe `griton`, +3 extra de rendimiento.
  - **`jefe` y `adular`:** según la especificación §2, con textos nuevos que nombran al jefe (`n.first`).
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS. `simulate.test.js` y el resto, verdes.

- [ ] **Step 5: Commit** — `git commit -m "El jefe pesa en ascensos, despidos, estrés y bonos; hablar y caerle bien"`.

### Task 4: Negociar el sueldo — oferta al entrar y pedido de aumento

**Files:**
- Create: `js/data/events/trabajo.js` (eventos manuales `oferta_trabajo` y `pedir_aumento`)
- Modify: `js/systems/career.js`:
  - `hire(g, J, level, salary?)`: el `salary` opcional reemplaza al sorteado;
  - entrevista (295–298): si es `full`, encola la oferta;
  - acción `aumento` (201–206): encola `pedir_aumento` y devuelve `''`.
- Modify: `index.html` (script de `trabajo.js`)
- Test: `tests/trabajo.test.js`

**Interfaces:**
- Consumes: `raiseMod` y `boss` (Tareas 2–3).
- Produces:
  - **`oferta_trabajo`:** contexto `{ job, level, salary }`. Las opciones tienen la `sub` de la Interfaz A con el
    riesgo, en este orden: `[Aceptar, Pedir 10 %, Pedir 25 %]`.
  - **`pedir_aumento`:** opciones `[5 %, 15 %, Amenazar con irte]`.

- [ ] **Step 1: Write the failing tests:**
  - **`'pasar la entrevista de tiempo completo trae una oferta'`:**
    - Se fuerza el éxito de la entrevista (semilla o `chance` alta: inteligencia 100 y respuesta 0).
    - En la cola queda `oferta_trabajo`, `p.job` sigue igual y `ctx.salary` está entre `pay[0] × 0,9` y × 1,1.
  - **`'medio tiempo se contrata directo'`:** la entrevista de `repartidor` deja `p.job.id === 'repartidor'`.
  - **`'oferta: aceptar, pedir 10 % y pedir 25 %'`:**
    - Aceptar deja `p.job.salary === ctx.salary`.
    - Con 200 semillas y carisma 0, pedir 10 % termina con 10 % más o igual, y nunca sin trabajo.
    - Pedir 25 % produce los tres resultados: 25 % más, igual, y sin contratar (el trabajo anterior intacto,
      Foco 2).
    - La tasa de éxito de pedir 25 % queda entre 0,30 y 0,50.
  - **`'aceptar una oferta con trabajo previo cambia la gente'`** (Foco 2): con `cajero` y su jefe, aceptar la
    oferta de `cartero` deja el jefe viejo fuera de las relaciones y uno nuevo.
  - **`'pedir aumento: tres opciones'`:**
    - La acción `aumento` encola `pedir_aumento`.
    - Con rendimiento 100, rel 100 y `buenazo`, el 5 % sale en ≥ 90 % de 100 semillas (+5 %).
    - Con rendimiento 0, rel 0 y `trepador`, el 15 % sale en ≤ 10 %.
    - Amenazar con irte, en 200 semillas, da +20 %, sin trabajo ("aceptan tu renuncia", con limpieza del jefe) o
      −15 de relación.
    - Ningún texto tiene marcas prohibidas.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js`.

  Expected: FAIL, el evento `oferta_trabajo` es desconocido.

- [ ] **Step 3: Implement** con las fórmulas exactas de la especificación §4:
  - Chances: 0,80 + carisma/500 + `mods.hire`, y 0,40 + carisma/250 + `mods.hire`, limitadas.
  - El fracaso de pedir 25 % es mitad y mitad.
  - Las etiquetas muestran el monto (`Pedir ${U.money(...)}`).
  - El aumento usa las fórmulas de la tabla, con `raiseMod` solo en las dos primeras opciones.
  - "Amenazar con irte" que sale mal y "acepta la renuncia" llama `career.leave(g, 'renuncia')`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Negociar el sueldo: oferta al entrar y pedido de aumento con el jefe"`.

### Task 5: Encargos freelance

**Files:**
- Modify: `js/systems/workplace.js`
- Test: `tests/trabajo.test.js`

**Interfaces:**
- Consumes: `MV.FREELANCE` (Tarea 1).
- Produces en `MV.sys.workplace`:
  - **`freelanceOptions(g) -> Array<{ id, icon, label, sub }>`:** un encargo por cada habilidad ≥ 10, con
    `id = skill`.
  - **`freelance(g, skill) -> string`:**
    - paga `p.skills[skill] × U.int(150, 400)`;
    - con 15 % de chance paga la mitad, con el texto "en exposición";
    - +3 de estrés y +1 en esa habilidad.
  - **`freelanceAction(g) -> action`:**
    - `id 'freelance'`, `icon '💼'`, `limit 2`, `label 'Hacer un encargo freelance'`;
    - con opciones, trae `opts: freelanceOptions`;
    - sin opciones, trae `check` que devuelve `'Para tomar encargos necesitas alguna habilidad en 10 o más
      (programación, arte, idiomas, cocina, música o carisma).'`;
    - con menos de 16 años, `check` devuelve `'Los encargos freelance son desde los 16 años.'`.

- [ ] **Step 1: Write the failing tests:**
  - **`'freelance: opciones según habilidades'`:** con programación 30 y arte 5, `freelanceOptions` da solo
    `programacion`.
  - **`'freelance: pago, mitad y límite'`:**
    - Con programación 40 y 300 semillas, el pago queda entre 40 × 75 y 40 × 400.
    - Aparece al menos una vez el texto "exposición" con la mitad del pago.
    - `MV.doAction` con la acción y `opt 'programacion'` funciona 2 veces y la tercera queda `blocked`.
  - **`'freelance: sin habilidad o muy joven explica qué falta'`:** sin habilidad en 10, el `check` devuelve el texto
    exacto; con 15 años, el otro.
  - **`'freelance con o sin trabajo'`:** funciona con `p.job = null` y también con un trabajo `full`.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js`.

  Expected: FAIL, `freelanceOptions` undefined.

- [ ] **Step 3: Implement** según la Interface.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Encargos freelance según tu mejor habilidad"`.

### Task 6: Las 12 decisiones laborales y el traslado

**Files:**
- Modify: `js/data/events/trabajo.js` (12 eventos de la especificación §6)
- Modify: `js/systems/workplace.js` (`move`, `newBoss` y los seguimientos de `cooked`/`hidden` en `yearly`)
- Test: `tests/trabajo.test.js`

**Interfaces:**
- Consumes: `boss`, `mate`, `restaff`, `newBoss`, `career.promote`, `career.fire` y `career.leave`.
- Produces:
  - **`workplace.move(g) -> string`:**
    - elige un país al azar distinto del actual y una ciudad de `MV.COUNTRIES[país].cities`;
    - sube el sueldo × 1,3, llama `restaff` y aplica +5 de felicidad y +5 de estrés;
    - no toca pareja, hijos ni bienes.
  - **Ids de los eventos:** `trabajo_maquillar`, `trabajo_huelga`, `trabajo_traslado`, `trabajo_romance`,
    `trabajo_credito`, `trabajo_fiesta`, `trabajo_reestructuracion`, `trabajo_competencia`,
    `trabajo_ascenso_trampa`, `trabajo_error`, `trabajo_jefe_nuevo` y `trabajo_aliado`.
  - **Elegibilidad:** todos usan `when: (g) => trabajo full con boss(g)`, más lo propio de cada uno:
    - `romance` y `credito` piden el compañero de su rol: `mate(g,'aliado')` o `mate(g,'chismoso')`, o
      `mate(g,'rival')`;
    - `reestructuracion` pide `level ≥ 2` y algún compañero;
    - `ascenso_trampa` pide no estar en el nivel máximo.
  - **Seguimientos en `p.job`:**
    - `cooked` (edad de "Hacerlo" en `maquillar`): al año siguiente, 35 %: `career.fire` y
      `p.record.push({ crime: 'Fraude contable', age, years: 0 })`;
    - `hidden` (edad de "Esconderlo" en `error`): al año siguiente, 50 %: −25 de rendimiento.

- [ ] **Step 1: Write the failing tests:**
  - **`'los 12 eventos se disparan con textos limpios'`:**
    - Para cada id: armar `g` con trabajo `cajero` nivel 2 (escalera de 3), staff y dinero 100.000.
    - Hacer `MV.EV.push(g, id, {}, true)`. En los automáticos, verificar el registro del diario.
    - `MV.EV.view(g)` no es `null`, no tiene `BAD_TEXT` en título, texto, etiquetas y `sub`, y cada opción se puede
      elegir sin lanzar error (copiando `g` con `JSON.parse(JSON.stringify(g))`).
  - **`'efectos principales'`** (una aserción por evento, con semillas cuando hay azar):
    - maquillar: "Hacerlo" deja `job.cooked === p.age`, y a los 35 % del año siguiente el jugador queda sin
      trabajo y con un antecedente "Fraude contable".
    - huelga: "Sumarte" resta el 10 % del sueldo en dinero.
    - traslado: "Aceptar" cambia `p.country`, la ciudad está en `cities` del país nuevo y el sueldo es × 1,3
      (± 1).
    - romance: "Salir" sin pareja deja a ese compañero como `pareja`, y con cónyuge como `amante`.
    - crédito: "Vengarte" deja al rival como `enemigo`.
    - fiesta: "Irte temprano" da −3 de estrés.
    - reestructuración: "Despedir al rival" lo saca de `mates` y lo deja `enemigo`; "Renunciar en protesta" deja
      `p.job === null`.
    - competencia: "Aceptar" da sueldo × 1,2, jefe nuevo y `lvlYears 0`.
    - ascenso con trampa: "Aceptar" sube el nivel y fija `job.weekends`.
    - error: "Culpar" con semilla de éxito deja a ese compañero como `enemigo`.
    - jefe nuevo: cambia `boss(g).n.id`.
    - aliado: +6 de rendimiento.
  - **`'traslado con casa, pareja e hijos'`** (Foco 4):
    - Con casa propia, cónyuge e hijo, aceptar el traslado deja casa, cónyuge e hijo iguales.
    - `p.city` está en las ciudades del país nuevo y `MV.sys.year` sigue avanzando (un `MV.ageUp(g)` sin errores).
  - **`'los eventos no salen sin trabajo de tiempo completo'`:** con `p.job = null` o un trabajo de medio tiempo,
    `MV.EV.eligible(g, MV.EV.byId[id])` es `null` para los 12.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js`.

  Expected: FAIL, evento desconocido `trabajo_maquillar`.

- [ ] **Step 3: Implement** los 12 eventos con las opciones y números de la especificación §6, y `move`.
  - Escenas: `'trabajo'`.
  - Íconos: maquillar 🧮, huelga ✊, traslado ✈️, romance 💘, crédito 💡, fiesta 🥂, reestructuración ✂️,
    competencia 🕵️, ascenso con trampa 🪤, error 💥, jefe nuevo 👔, aliado 🤝.
  - Los textos nombran al jefe o al compañero con `{t}` y `ctx.target`, o con `n.first`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`.

  Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Doce decisiones laborales y el traslado a otro país"`.

### Task 7: Interfaz y partidas versión 8

**Files:**
- Modify: `js/ui/sheets.js`:
  - caja de Trabajo (69–78): jefe, compañeros y freelance, más la sección freelance aunque no haya trabajo;
  - `GROUP` (418): `jefe: 'Jefe'`.
- Modify: `js/core/state.js` (`MV.VERSION = 8`)
- Modify: `js/systems/save.js` (paso `g.version === 7`)
- Test: `tests/trabajo.test.js`, `tests/save.test.js` (si fija la versión) y `tests/ui-smoke.js`

**Interfaces:**
- Consumes: `boss`, `mate` y `freelanceAction` (Tareas 2–5).
- **Ids de la interfaz:**
  - `#work-boss`: fila del jefe, que abre `UI.showPerson`;
  - `#work-mates`: lista de compañeros con su rol;
  - `#work-freelance`: lista con la acción freelance.

- [ ] **Step 1: Write the failing tests:**
  - **`'migración v7 → v8'`:**
    - Una partida v7 con `p.job` `full` sin `boss` y `g.version = 7`, pasada por `MV.migrate`, sale con
      `version === 8`, `boss(g)` presente y 2 `mates`.
    - Una v7 sin trabajo sale con versión 8 y sin relaciones `jefe`.
  - **Smoke** (bloque "Parte C1" antes de `// Avanzar 5 años`):
    - Con `MV.sys.career.hire(g, MV.jobById('cajero'))`, abrir `UI.showWork()`.
    - `#work-boss` muestra "Jefe" o "Jefa", el ícono del carácter y una barra. `#work-mates` tiene 2 filas con
      rol. Existe `#work-freelance`.
    - Tocar `#work-boss` abre la ficha de la persona.
    - "Pedir un aumento" abre una tarjeta con 3 `.choice`. Se cierra con `resolve()`.
    - `MV.EV.push(g,'oferta_trabajo',{job:'cartero',level:0,salary:20000},true)` y `flushQueue`. La tarjeta muestra
      3 opciones con `.sub`, y elegir "Aceptar" deja `p.job.id === 'cartero'` con jefe.
- [ ] **Step 2: Run** `node --test tests/trabajo.test.js && node tests/ui-smoke.js`.

  Expected: FAIL, la versión es 7 y no existe `#work-boss`.

- [ ] **Step 3: Implement**
  - **Caja del trabajo** (solo con `full` y jefe):
    - `kv` "👔 Tu jefe/jefa" con nombre, ícono y nombre del carácter (`MV.gt(K.name, gender)`), más `UI.bar(r.rel)`;
    - "Compañeros" con `UI.row(avatar, nombre, '🤝 aliado' …, barra, () => UI.showPerson(id))`.
  - **Freelance:** debajo de "Buscar", `title('Encargos freelance')` y
    `UI.actionList([MV.sys.workplace.freelanceAction(g)])`, envuelto en `div#work-freelance`, desde los 16 años.
  - **Migración y versión:** paso de migración y `MV.VERSION = 8`.
- [ ] **Step 4: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.

  Expected: PASS y "Interfaz OK".

- [ ] **Step 5: Commit** — `git commit -m "Ocupación muestra jefe, compañeros y freelance; partidas versión 8"`.

### Task 8: Jugador automático, README y verificación

**Files:**
- Modify: `README.md` (fila de trabajo de la tabla de funciones)
- Test: `tests/agent.js`

- [ ] **Step 1: Run** `node tests/agent.js`.

  Expected: termina las vidas sin excepciones. Si una decisión nueva rompe al jugador automático, se corrige el
  evento, no el jugador.

- [ ] **Step 2: README.** La fila de trabajo suma "jefe y compañeros con nombre y carácter, negociación de sueldo
  y aumentos, 15 empleos nuevos, encargos freelance y 12 decisiones laborales".
- [ ] **Step 3: Run** `node --test tests/*.test.js && node tests/ui-smoke.js`.

  Expected: PASS y "Interfaz OK".

- [ ] **Step 4: Commit** — `git commit -m "README: trabajo con jefe, compañeros, negociación y decisiones"`.
