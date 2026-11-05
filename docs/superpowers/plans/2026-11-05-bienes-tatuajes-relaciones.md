# Barras, tatuajes, casas, relaciones, avatares y deporte — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el spec aprobado: barras 40/70, minijuego de tatuaje, mejoras de casas y venta con precio propio, acciones nuevas de relaciones, viajes con compañía, regalos con menú desplegable, avatares mejorados y búsqueda de equipo en el deporte.

**Architecture:** Toda la lógica vive en `js/core`, `js/data` y `js/systems` (sin DOM, probada con `node --test`); `js/ui` solo dibuja y llama al motor. Los datos nuevos son declarativos. Las partidas guardadas migran a la versión 3.

**Tech Stack:** HTML/CSS/JS sin compilación, scripts clásicos con espacio de nombres `MV`, `node --test`, Playwright (Chromium preinstalado) para la interfaz.

**Spec:** `docs/superpowers/specs/2026-11-05-bienes-tatuajes-relaciones-design.md`

## Global Constraints
- Español en toda la interfaz; humor negro +18 sin contenido sexual explícito.
- Sin dependencias nuevas ni paso de compilación; `index.html` debe seguir abriendo con doble clic.
- Todo texto visible debe pasar `BAD_TEXT = /undefined|NaN|\[object|\{\w+\}|null/` (lo comprueban las pruebas).
- Umbrales de barras: rojo < 40, amarillo 40–70, verde 71–100.
- Tatuaje: puntos enteros 0–100, máximo 900 puntos, álbum máximo 12.
- Venta con precio propio: factor de −20% a +50% del estimado.

## Review Focus
- Dibujo vacío o con un solo punto: el tatuador no cobra y no se crea tatuaje (test en Task 2).
- Casa vendida o perdida con mejoras: las mejoras desaparecen con la casa y el hogar se reasigna (test en Task 4).
- Regalar algo que cuesta más que tu efectivo: la opción no aparece; NPC sin dinero también reacciona (test en Task 6).
- Viaje con un compañero que muere o se va antes de confirmar: el viaje sigue como "solo" (test en Task 8).
- Buscar equipo estando lesionado o fuera de la edad de inicio: ofertas solo de tu categoría o ninguna, con texto claro (test en Task 9).

---

### Task 1: Barras con umbrales 40/70
**Files:** Modify `js/core/util.js`, `js/ui/main.js`, `js/ui/sheets.js`, `css/styles.css`. Test: `tests/ui-logic.test.js` (crear).
**Interfaces:** Produces `MV.barLevel(pct: number) → 'lo'|'mid'|'hi'`; `UI.condBar(cond)` (barra compacta para estado).
- [ ] Test `barLevel` con 0→lo, 39→lo, 40→mid, 70→mid, 71→hi, 100→hi.
- [ ] Implementar `MV.barLevel` en util; `UI.bar` la usa.
- [ ] Barra de estado en mercado, lista de bienes y ficha del bien (clase `.cond-row`).
- [ ] `node --test tests/ui-logic.test.js` pasa; commit.

### Task 2: Motor del tatuaje
**Files:** Create `js/systems/tattoo.js`; modify `js/data/world.js` (TATTOO_ARTISTS, TATTOO_PLACES, TATTOO_INKS, TATTOO_TEMPLATES), `index.html`. Test: `tests/tattoo.test.js`.
**Interfaces:** Produces `MV.sys.tattoo.normalize(design) → design` (enteros 0–100, ≤900 puntos), `score(design, artistId, artSkill) → {score, coverage, colors, strokes}`, `apply(g, design, artistId, placeId) → string`, `laser(g, tattooId) → string`, `render(design, size) → svgString`.
- [ ] Tests: diseño vacío → score 0 y `apply` devuelve texto de rechazo sin cobrar; diseño rico (≥25% cobertura, 3 colores) con estudio → score ≥ 55; garaje < estudio < famoso para el mismo diseño (media de 50 tiradas); `normalize` limita a 900 puntos; `apply` agrega a `p.tattoos`, cobra el precio y cambia looks/happy; álbum no supera 12; `laser` quita y cobra $1.500; `render` sin `BAD_TEXT`.
- [ ] Implementar; `node --test tests/tattoo.test.js` pasa; commit.

### Task 3: Interfaz del tatuaje y álbum
**Files:** Create `js/ui/tattoo.js`; modify `js/data/activities.js` (acción `tatuaje` con `ui: 'tattoo'`), `js/ui/main.js` (`runAction` deriva a `UI.showTattooStudio` si `a.ui === 'tattoo'`), `js/ui/screens.js` (álbum en la ficha), `js/data/events/general.js` (evento `tatuaje_ex`), `css/styles.css`.
**Interfaces:** Consumes Task 2. Produces `UI.showTattooStudio(opts?: {cover?: tattooId})`.
- [ ] Lienzo con pointer events, 6 tintas, 3 grosores, deshacer, borrar, plantillas, sello de texto; pasos tatuador → lugar → dibujo → resultado.
- [ ] Evento `tatuaje_ex` (aleatorio, `when` hay tatuaje con nombre de una ex): tapar → abre estudio (en motor: marca `cover`), láser → `laser`.
- [ ] Prueba de interfaz (Task 11) dibuja trazos y confirma un tatuaje en el álbum; commit.

### Task 4: Mejoras de casas, mantenimiento y venta con precio propio
**Files:** Modify `js/data/world.js` (HOUSE_UPGRADES), `js/systems/money.js`, `js/data/events/general.js` (evento manual `contraoferta`). Test: `tests/assets.test.js`.
**Interfaces:** Produces `money.upkeep(g, asset) → number`, `money.upgradeOptions(g, assetId) → [{id, icon, label, sub, cost, ok, why}]`, `money.addUpgrade(g, assetId, upId) → string`, `money.removeUpgrade(g, assetId, upId) → string`, `money.estimate(asset) → number`, `money.sellAt(g, assetId, factor) → string` (puede encolar `contraoferta` con `{asset, offer}`).
- [ ] Tests: piscina no disponible en departamento; agregar sube valor ≈ costo×fracción y cobra; quitar baja el valor y cobra demolición; efectos anuales solo si es tu hogar (sauna baja estrés; cancha de tenis suma `sportsExp.tenis`); mantenimiento de mejoras en `upkeep`; `sellAt` con −20% siempre vende; con +50% encola contraoferta casi siempre; aceptar contraoferta vende al monto ofrecido; vender casa con mejoras reasigna hogar.
- [ ] Implementar; balance anual separa mantenimiento; pruebas pasan; commit.

### Task 5: Interfaz de bienes
**Files:** Modify `js/ui/sheets.js`.
**Interfaces:** Consumes Task 4.
- [ ] Ficha del bien: valor, estado con barra, mantenimiento anual, mejoras instaladas (quitar), "Agregar mejora" (lista con requisitos), "Vender" → hoja con precios −20/−10/0/+10/+25/+50%.
- [ ] Verificado en Task 11; commit.

### Task 6: Regalos con menú desplegable
**Files:** Create `js/data/gifts.js`; modify `js/systems/rels.js` (acción `regalo` con `ui: 'gift'`, función `giveGift`), `js/ui/sheets.js` (`UI.showGiftPicker`), `index.html`. Test: `tests/social.test.js`.
**Interfaces:** Produces `MV.GIFTS: [{id, name, icon, price, group, likes?: string[], hates?: string[], age?: [min,max], special?: string}]`, `MV.giftReaction(n, gift) → 'love'|'like'|'meh'|'hate'`, `MV.sys.rels.giveGift(g, relId, giftId) → string`, `MV.sys.rels.giftOptions(g, relId) → gifts asequibles`.
- [ ] Tests: ≥35 regalos con ids únicos y 4+ grupos; `giftOptions` excluye los que no puedes pagar; juguete a un niño → love; regalo caro sube más la relación que uno barato; `hate` baja la relación; cachorro crea mascota del NPC sin romper; textos sin `BAD_TEXT`.
- [ ] UI con `<select>` + `<optgroup>`, vista previa y botón; commit.

### Task 7: Acciones nuevas de relaciones
**Files:** Modify `js/systems/rels.js`. Test: cubierto por `tests/events.test.js` (todas las acciones) + `tests/social.test.js` (mudarse juntos, renovar votos).
**Interfaces:** Produces ids `cena_casera, poema, bailar, series, sorpresa, desayuno, convivir, votos, espiar_celular, comer_afuera, cine_juntos, gym_juntos, consejo, escuchar, prestar, videollamada, medico_familiar, tarea, parque, ensenar_deporte`. `convivir` pone `p.flags.convive = relId` (gastos de vida ×0,8 en `livingCost`).
- [ ] Implementar; `node --test` pasa (cobertura de acciones); commit.

### Task 8: Viajes con compañía
**Files:** Modify `js/systems/year.js` (`MV.doAction(g, action, opt, scope, opt2)`), `js/ui/main.js` (segundo paso si `a.opts2`), `js/data/activities.js` (vacaciones con `opts2`), `tests/agent.js` (elige `opts2`). Test: `tests/social.test.js`.
**Interfaces:** `action.opts2(g, opt) → [{id, icon, label, sub}]`; `run(g, opt, opt2)`; `opt2 === 'solo'` para ir solo.
- [ ] Tests: viaje con pareja cobra doble y sube la relación ≥ 8; viaje solo cobra simple; compañero inexistente → como solo.
- [ ] Implementar; commit.

### Task 9: Deporte — buscar equipo y volver del retiro
**Files:** Modify `js/systems/sports.js`, `js/systems/career.js` (requisito de edad de prueba para exprofesionales). Test: `tests/sports.test.js`.
**Interfaces:** Produces `sports.teamOffers(g) → [{sport, club, level, salary}]` (cacheado por año en `p.job.offersAge/offers`), `sports.joinTeam(g, offer) → string`, `sports.canTryout(g, id) → {ok, why[]}`.
- [ ] Tests: con nivel alto aparecen ofertas de la categoría superior; con nivel bajo solo de la misma; aceptar sube categoría/sueldo; un piloto puede llegar a "Campeón de la Fórmula Mundial" usando solo `teamOffers`/`joinTeam` en ≤ 12 temporadas con nivel 95; exprofesional de 34 años puede volver al fútbol; lesionado → ofertas solo de su categoría.
- [ ] Implementar acción `buscar_equipo` (límite 1); commit.

### Task 10: Avatares mejorados
**Files:** Modify `js/ui/avatar.js`, `js/core/state.js` (`makeLook` con `style` 0–8, `beardStyle` 0–3, `piercing`). Test: `tests/ui-logic.test.js`.
**Interfaces:** `UI.avatarSVG({age, gender, look, id, mood, dead, outfit, acc})` → string; `UI.outfitFor(p) → string|null`.
- [ ] Test: renderiza 9 peinados × 4 barbas × 5 ánimos × 9 ropas sin `BAD_TEXT` y con `<svg`; aspecto viejo (`style` 4, sin `beardStyle`) sigue funcionando; con un tatuaje en el cuello (`p.tattoos[].place === 'cuello'`) el SVG incluye la marca `data-neck-tattoo`.
- [ ] Implementar; commit.

### Task 11: Migración, verificación completa y entrega
**Files:** Modify `js/core/state.js` (`MV.VERSION = 3`), `js/systems/save.js` (v2→v3), `tests/ui-smoke.js`, `tests/events.test.js` (variantes), `README.md`.
- [ ] Test de migración v2→v3 (`p.tattoos`, `asset.upgrades`).
- [ ] `node --test tests/*.test.js` pasa; barrido de 1.000 vidas sin errores; `node tests/ui-smoke.js` dibuja un tatuaje, regala desde el `<select>` y viaja con compañía sin errores de consola.
- [ ] Revisión de código (superpowers:requesting-code-review) y correcciones.
- [ ] Commit, push y republicar el Artifact.
