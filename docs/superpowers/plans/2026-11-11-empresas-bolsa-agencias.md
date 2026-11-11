# Parte B — Programación, empresas propias, bolsa de valores y agencias — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Juegos y apps propios, hasta 3 empresas con un motor común (estudio, apps, red social, agencia de eSports, agencia de representación), negociación de contratos y mánager, y una bolsa de valores con salida a bolsa e información privilegiada.

**Architecture:** Datos en `js/data/companies.js` (tipos, puestos, acciones de bolsa, efectos de las noticias). Motor sin DOM: `js/systems/company.js` (núcleo común), `js/systems/studio.js` (estudio, apps, red social), `js/systems/agency.js` (eSports, representación, negociación, mánager) y `js/systems/market.js` (bolsa, salida a bolsa, junta, información privilegiada). Interfaz en `js/ui/companies.js` y `js/ui/market.js`. Cada tipo registra en el núcleo un gancho `revenue(g, c)`.

**Tech Stack:** HTML/CSS/JS clásico sin compilación; `node --test`; Playwright para la prueba de humo.

**Spec:** `docs/superpowers/specs/2026-11-10-empresas-bolsa-agencias-design.md`

## Global Constraints

- Scripts clásicos bajo `window.MV`; cada archivo nuevo va en `index.html` (así lo carga `tests/load.js`); el motor no toca el DOM.
- Empresas, marcas, cotizantes, jugadores y clientes inventados; humor negro sin contenido explícito; concordancia de género (`U.gw`).
- Todo texto que llega al diario pasa BAD_TEXT del jugador automático; los nombres que escribe el jugador pasan por `MV.sys.works.clean`.
- Las empresas guardan su dinero en su caja (`c.cash`), no en `p.money`; solo inyectar, sacar dividendos, vender y la salida a bolsa mueven dinero entre ambas.
- `MV.VERSION = 7`; v1–v6 siguen cargando.

## Review Focus

1. Una empresa que quiebra, se vende, se cierra o deja de ser tuya con un evento suyo pendiente: la cola sigue sin errores y no queda nada colgado.
2. Patrimonio sin contar dos veces: empresa privada, empresa cotizante (solo tu parte), acciones de la bolsa y empresa de la que te echaron.
3. Muerte y herencia con empresas y acciones: el valor llega al heredero (como efectivo) y la partida del heredero arranca sin empresas rotas.
4. Cárcel con empresas: siguen funcionando solas (sin decisiones) y las acciones de su hoja no se ofrecen.
5. Caja sin dinero: un sueldo o un proyecto que no se puede pagar, un intento de inyectar o sacar más de lo que hay, y la quiebra a los dos años en rojo.

---

### Task 1: Juegos y apps en "Mis obras"

**Files:** Modify `js/data/works.js` (clases `juego` y `app`), `js/systems/works.js` (bonus de Arte en juegos) · Test: `tests/works.test.js`

**Interfaces — Produces:** `MV.WORK_KINDS.juego = { name: 'Juego', icon: '🎮', skill: 'programacion', minAge: 12, hit: [60000, 1200000], fame: [8, 18], royalty: 0.3, ach: 'gamedev', genres: plataformas, terror, estrategia, mundo_abierto, simulador_vida, battle_royale }`; `MV.WORK_KINDS.app = { name: 'App', icon: '📱', skill: 'programacion', minAge: 14, hit: [40000, 800000], fame: [4, 10], royalty: 0.35, ach: 'appdev', genres: productividad, citas, fitness, finanzas, red_nicho, inutil }`; logros `gamedev` y `appdev`. La calidad de un juego suma `p.skills.arte * 0.15`.

- [ ] Pruebas: `juegos y apps aparecen como obras con 6 géneros cada una`; `crear un juego usa Programación y da textos sin errores`; `un juego con mucha Programación y Arte saca más estrellas en promedio que uno sin habilidad`; `un éxito da fama y regalías los años siguientes`.

### Task 2: Motor de empresas y su hoja

**Files:** Create `js/data/companies.js` (tipos y puestos), `js/systems/company.js` (`MV.sys.company`), `js/ui/companies.js`; Modify `js/systems/year.js`, `js/systems/money.js` (`netWorth` suma empresas), `js/ui/sheets.js` (Ocupación → "Mis empresas (n/3)" y "Fundar una empresa"), `css/styles.css` · Test: `tests/company.test.js`, `tests/ui-smoke.js`

**Interfaces — Produces:**
- `MV.COMPANY_TYPES` = estudio (🎮, costo 50.000, múltiplo 4, fijo 20.000, puestos programador/artista/disenador/marketing), apps (📱, 30.000, 5, 10.000, programador/disenador/marketing), social (🌐, 80.000, 8, 30.000, programador/moderador/marketing/abogado), esports (🕹️, 100.000, 3, 25.000, entrenador/analista/community), representacion (🤝, 40.000, 3, 8.000, scout/abogado/rrpp). Todos admiten `gerente`.
- `MV.COMPANY_ROLES[role] = { name: 'Programador|Programadora', icon }`; `MV.MARKETING = { ninguno: 0, bajo: 10000, medio: 50000, alto: 200000 }` con impulso 0 / 0,1 / 0,25 / 0,5.
- Empresa: `{ id, type, name, cash, since, staff: [], marketing: 'ninguno', redYears: 0, last: { revenue, costs, result }, value, hist: [{ age, value }], public: null }`.
- `MV.sys.company`: `MAX = 3`; `count(p)` (incluye `p.business`); `found(g, type, name) → msg`; `get(g, cid)`; `candidates(g, cid, role) → [{ first, last, gender, level, salary }] × 3` (fijos por empresa y año); `hire(g, cid, role, i) → msg`; `fire(g, cid, eid) → msg` (indemnización de un cuarto del sueldo, desde la caja); `raise(g, cid, eid) → msg` (+15 %); `setMarketing(g, cid, level) → msg`; `inject(g, cid, amount) → msg`; `withdraw(g, cid, amount) → msg`; `power(c, roles) → 0..100` (suma de niveles × 8, tope 100); `boost(c) → número` (impulso del marketing); `sell(g, cid) → msg` (80 %–120 % de la valuación); `close(g, cid) → msg`; `remove(g, cid)` (saca la empresa y filtra `g.queue`/`g.later` con `ctx.company === cid`); `register(type, { revenue(g, c) })`; `yearly(g)`.
- Cada año, por empresa: ingresos del gancho del tipo; costos = sueldos + marketing + fijo; `cash += result`; `value = max(0, round(revenue × múltiplo + cash))`; `redYears` sube con caja negativa y a los 2 quiebra; +3 de estrés (1 con gerente). Evento `empleado_aumento` (10 % por empresa y año): dar aumento, negarlo (puede renunciar) o despedir.

- [ ] Pruebas: `fundar cobra el costo y lo pone en la caja`; `no se puede tener más de 3 empresas contando el negocio clásico`; `contratar elige entre 3 candidatos fijos del año y despedir paga indemnización desde la caja`; `inyectar y sacar dinero mueve entre tu bolsillo y la caja, nunca más de lo que hay`; `el año cobra sueldos, marketing y costo fijo y calcula la valuación`; `dos años con caja negativa quiebran la empresa y su evento pendiente desaparece de la cola`; `el gerente general baja el estrés`; `el patrimonio suma el valor de las empresas`; `en la cárcel las empresas siguen sin errores`; `al morir, el valor de las empresas llega al heredero como efectivo`.
- [ ] Prueba de humo: Ocupación → fundar un estudio con nombre propio, contratar un programador, poner marketing medio, inyectar $10.000.

### Task 3: Estudio de videojuegos, empresa de apps y red social

**Files:** Create `js/systems/studio.js`; Modify `js/ui/companies.js` (secciones propias de cada tipo) · Test: `tests/studio.test.js`, `tests/ui-smoke.js`

**Interfaces — Consumes:** `company.register`, `company.power`, `company.boost`, `company.get`, `company.remove`. **Produces:** `MV.STUDIO_SIZES = { chico: { cost: 50000, years: 1, base: 150000 }, mediano: { cost: 300000, years: 1, base: 900000 }, aaa: { cost: 3000000, years: 2, base: 12000000 } }`; `MV.sys.studio.startGame(g, cid, name, genre, size) → msg` (paga desde la caja; uno por vez); juegos lanzados en `c.games = [{ name, genre, stars, sales: [] }]` con ventas de lanzamiento = base × [0,2; 0,5; 1; 2; 4][estrellas−1] × (1 + impulso) y cola de 50 %, 25 % y 10 % los 3 años siguientes; evento `crunch` (30 % por año durante un AAA: crunch, retrasar un año pagando 20 % más, o lanzar igual); `newApp(g, cid, name, genre) → msg` ($30.000, lista al año siguiente; `c.apps = [{ name, stars, subs, age }]`, suscriptores iniciales 1.000 × estrellas², pagan $30 al año, crecen 30 % × estrellas/5 + impulso y se van 10 % + 5 % por año de antigüedad); red social con `c.users` (empieza en 1.000; crece × (1 + poder de programadores y marketing / 100 × 1,5 + impulso × 2 + azar −0,2..0,3), tope 2.000 millones), $2 por usuario al año, evento `social_escandalo` (15 % por año: filtración de datos, moderación, político que pide favores, con decisiones) y logro `red_social` a los 100 millones.

- [ ] Pruebas: `un juego tarda lo que dice su tamaño y después vende pico y cola`; `mejor equipo y más marketing venden más en promedio`; `no se puede empezar un juego sin caja ni dos a la vez`; `el crunch cambia calidad o plazo según la decisión`; `las apps ganan y pierden suscriptores y pagan $30 cada uno`; `la red social crece con el equipo y cobra $2 por usuario`; `un escándalo con la empresa cerrada no rompe la cola`.
- [ ] Prueba de humo: lanzar un juego (nombre, género, tamaño) y ver "En desarrollo" en la hoja.

### Task 4: Agencias de eSports y de representación, y negociación

**Files:** Create `js/systems/agency.js`; Modify `js/data/companies.js` (alias de gamers, ligas, profesiones), `js/ui/companies.js` · Test: `tests/agency.test.js`, `tests/ui-smoke.js`

**Interfaces — Consumes:** `company.register`, `company.power`, `company.get`. **Produces:**
- eSports: `c.roster = [{ id, first, last, alias, skill, salary, age }]` (máx. 5; sueldo = habilidad × 1.500 al año, pagado desde la caja junto con el personal); `MV.sys.agency.players(g, cid) → 3 jugadores libres del año`; `sign(g, cid, i) → msg`; `sellPlayer(g, cid, id) → msg` (cobra habilidad × 3.000); `joinOwnTeam(g, cid) → msg` (solo si tu trabajo es e-sports profesional); `season(g, c) → { league, place, prize }` con liga por reputación (`rep` < 40 regional 5.000–20.000; < 75 internacional 50.000–300.000; mundial 500.000–2.000.000), puesto del 1 al 8 según promedio de habilidad (mínimo 3 jugadores) + poder del entrenador/10 + azar; premio 100 % / 50 % / 25 % para 1.º/2.º/3.º; `rep += (5 − puesto) × 3`; patrocinio = `rep × 2.000` al año.
- Representación: `c.clients = [{ id, first, last, gender, prof: 'deportista'|'actor'|'musico', level, salary, commission, left }]` (máx. 10); `talents(g, cid) → 3 talentos del año` (el poder del scout sube el nivel); `signClient(g, cid, i, commission) → msg` (comisión 0,1–0,2; aceptan con chance 0,9 − (comisión − 0,1) × 4 + rep/200); cada año el sueldo cambia × 0,9–1,3 y cobras `salary × commission`; `left−−` y en 0 llega el evento `renovar_contrato`; un cliente se va con 5 % por año o tras dos años bajando.
- `MV.sys.agency.negotiate(g, how: 'mas'|'aceptar'|'amenazar', who: { level, carisma, lawyer }) → { ok, factor }`: más (chance 0,45 + carisma/250 + abogado × 0,05 + nivel × 0,03 → ×1,15–1,35; si falla ×0,9); aceptar (×1,05); amenazar (chance 0,3 + carisma/300 + nivel × 0,05 → ×1,4–1,8; si falla ×0,3 por un año). La usa `renovar_contrato`.

- [ ] Pruebas: `fichar y vender jugadores cobra y paga lo justo y no pasa de 5`; `un plantel mejor sale mejor ubicado en promedio`; `la reputación sube con buenos puestos y cambia la liga`; `el gamer profesional puede jugar en su propio equipo`; `firmar un cliente depende de la comisión`; `la agencia cobra la comisión de sus clientes cada año`; `negociar: amenazar sube más pero puede perder el contrato; aceptar siempre sube un poco`; `renovar_contrato con el cliente que ya se fue no rompe la cola`.
- [ ] Prueba de humo: fichar un jugador en la agencia de eSports y firmar un cliente en la de representación.

### Task 5: Tu carrera: mánager o representarte a ti mismo

**Files:** Modify `js/systems/agency.js`, `js/systems/sports.js` (ofertas con mánager), `js/systems/career.js` (sueldos de fama con mánager y acciones), `js/systems/money.js` (comisión anual) · Test: `tests/agency.test.js`

**Interfaces — Produces:** `p.manager = { first, last, gender, fee: 0.1 } | null`; `MV.sys.agency.hireManager(g) → msg` y `fireManager(g) → msg` (solo con trabajo de deporte o de fama); con mánager, las ofertas de `sports.offers` y los sueldos anuales de las carreras de fama se multiplican × 1,10–1,25 y pagas 10 % de tu sueldo al año; sin mánager, acción `negociar_propio` (1 por año) que abre el evento `negociar_propio` con las tres decisiones de `negotiate` usando tu Carisma y tu nivel.

- [ ] Pruebas: `el mánager cobra 10 % y mejora las ofertas en promedio`; `sin trabajo de deporte o fama no se contrata mánager`; `negociar tu propio contrato cambia tu sueldo según la decisión`.

### Task 6: Bolsa de valores

**Files:** Modify `js/data/companies.js` (`MV.STOCKS`, `MV.MARKET_NEWS`); Create `js/systems/market.js` (`MV.sys.market`), `js/ui/market.js`; Modify `js/systems/year.js`, `js/systems/money.js` (`netWorth` suma acciones), `js/ui/sheets.js` (Bienes → "Bolsa de valores") · Test: `tests/market.test.js`, `tests/ui-smoke.js`

**Interfaces — Produces:**
- `MV.STOCKS` = VOLT Volta Motors (autos), OKAM Okami Electrónica (tech), BSUR Banco del Sur (banca), PETR Petrolera Austral (energia), VITA Farmacéutica Vitalis (salud), SMAX Supermercados Supermax (consumo), COND Aerolínea Cóndor (viajes), MINA Minera Andina (mineria), BNNA Bananín Coin (cripto, volatilidad 0,8), TORR Inmobiliaria Torres (inmobiliario), NUBE Streaming Nube (entretenimiento), POLL Pollo Feliz (comida); cada una `{ id, name, sector, price, vol, div }` con dividendo 0–0,05.
- `MV.MARKET_NEWS[newsId] = { all?, [sector]? }` (corrimientos que se suman), con los 15 titulares de `MV.WORLD_NEWS`.
- `g.market = { prices: {id: n}, hist: {id: [n]}, bubble: { sector, years, up } | null, custom: {} }`; `market.ensure(g)`; `market.price(g, id)`; `market.list(g) → [{ id, name, sector, price, change }]` (incluye cotizantes propias y `custom`).
- `market.yearly(g)`: r = 0,06 + noticia (all + sector) + gauss(0, vol); crash 3 % por año (todas −30 % a −60 %); burbuja 4 % por año (sector +30 % por año durante 2–3 años y después −50 %); precio mínimo 0,5; historia de hasta 60; dividendos a `p.money`.
- `p.portfolio = { id: { shares, cost } }`; `buy(g, id, qty | 'all') → msg` (precio × cantidad × 1,01); `sell(g, id, qty | 'all') → msg` (× 0,99).

- [ ] Pruebas: `hay 12 empresas inventadas con datos válidos`; `una recesión baja el mercado y el auge tecnológico sube la tecnología en promedio`; `el crash baja todas las acciones entre 30 % y 60 %`; `la burbuja sube y después revienta`; `comprar y vender cobra 1 % de comisión y no vende lo que no tienes`; `los dividendos se pagan cada año`; `el patrimonio suma las acciones`.
- [ ] Prueba de humo: Bienes → Bolsa de valores → comprar 10 acciones de VOLT y venderlas; la ficha muestra el gráfico.

### Task 7: Salida a bolsa, junta de accionistas e información privilegiada

**Files:** Modify `js/systems/market.js`, `js/ui/companies.js` (salir a bolsa y recomprar), `js/ui/market.js` · Test: `tests/market.test.js`, `tests/ui-smoke.js`

**Interfaces — Consumes:** `company.get`, `company.remove`, `market.ensure`. **Produces:** `market.canIpo(g, cid) → { ok, why }` (valuación ≥ $5.000.000 y 3 años o más); `ipo(g, cid, pct 0.2..0.4) → msg` (te paga `value × pct`; `c.public = { ticker, stake: 1 − pct, badYears: 0 }`; sigla de 4 letras desde el nombre, sin repetir); precio por acción = valuación / 1.000.000; `buyback(g, cid, pct) → msg` (cuesta `value × pct × 1,1`; con `stake` 1 deja de cotizar); junta anual: con dos años seguidos de pérdida, evento `junta_accionistas` (prometer resultados con 50 %, recortar la mitad del personal, o renunciar con indemnización de 5 % de la valuación); si te echan, `company.remove` y la empresa pasa a `g.market.custom[ticker]` con tus acciones en `p.portfolio`; `netWorth` cuenta solo tu parte (`value × stake`). Evento `dato_privilegiado` (4 % por año con 18+ y $10.000+; o tu propia cotizante): comprar ya (hasta la mitad de tu dinero; esa acción sube 40 %–120 % el año siguiente), no hacer nada (+1 karma) o denunciarlo (+4 karma); si compras, −6 de karma y 25 % de evento `investigacion_bolsa` uno o dos años después (arresto "Uso de información privilegiada", gravedad 2, y multa igual a la ganancia).

- [ ] Pruebas: `no se sale a bolsa sin valuación ni antigüedad`; `salir a bolsa paga tu parte y la empresa cotiza con su propia sigla`; `el patrimonio cuenta solo tu parte`; `dos años de pérdidas llaman a la junta y si te echan te quedan las acciones`; `recomprar todo deja de cotizar`; `el dato privilegiado hace ganar y a veces termina en juicio`.
- [ ] Prueba de humo: salir a bolsa con una empresa grande y verla en la bolsa.

### Task 8: Versión 7, verificación, revisión y PR

**Files:** `js/core/state.js`, `js/systems/save.js`, `tests/save.test.js`, `tests/agent.js`, `README.md`

- [ ] Prueba: `una partida v6 se migra a v7 (empresas, cartera y mánager vacíos) y sigue jugando`.
- [ ] Jugador automático: escribe juegos y apps, funda empresas de cada tipo, contrata, lanza juegos y apps, ficha jugadores y clientes, compra y vende acciones, sale a bolsa y responde las decisiones; barrido de 1.000 vidas; prueba de humo; README; revisión independiente; PR; actualizar el juego publicado.
