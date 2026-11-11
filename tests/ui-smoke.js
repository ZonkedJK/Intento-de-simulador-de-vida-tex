/* Prueba de humo de la interfaz con Playwright (opcional): node tests/ui-smoke.js [carpeta-capturas] */
'use strict';
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright no está instalado: se omite la prueba de interfaz.'); process.exit(0); }

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const SHOTS = process.argv[2] || null;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  global.__page = page; global.__errors = errors;
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('Excepción: ' + e.message));
  const shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const tryClick = async (sel) => { try { await page.click(sel, { timeout: 1500 }); return true; } catch (e) { return false; } };
  const resolve = async () => {
    for (let k = 0; k < 25; k++) {
      if (await page.$('#layer .choice')) { await tryClick('#layer .choice >> nth=0'); continue; }
      if (await page.$('#layer .card .btn.primary')) { await tryClick('#layer .card .btn.primary'); continue; }
      break;
    }
  };

  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('text=Empezar una vida nueva');
  await page.fill('#f-first', 'Probeta');
  await page.selectOption('#f-challenge', 'centenario');
  if (!/100/.test(await page.$eval('#f-challenge-desc', (e) => e.textContent))) errors.push('El desafío no muestra su descripción');
  await page.click('text=Nacer');
  if (await page.evaluate(() => (MV.UI.g.challenge || {}).id) !== 'centenario') errors.push('El desafío elegido no quedó en la partida');
  for (let y = 0; y < 22; y++) { await tryClick('.ageup'); await page.waitForTimeout(30); await resolve(); }
  await page.waitForTimeout(800);
  if (await page.evaluate(() => !MV.UI.g || MV.UI.g.over)) { // murió joven: otra vida para seguir probando
    await page.evaluate(() => { const g = MV.newGame({ seed: 77 }); MV.UI.startGame(g); for (let i = 0; i < 20; i++) { while (g.queue.length) MV.EV.choose(g, MV.EV.view(g).choices[0].i); MV.ageUp(g); } while (g.queue.length) MV.EV.choose(g, MV.EV.view(g).choices[0].i); MV.UI.save(); MV.UI.renderGame(); });
  }
  await shot('diario');
  // Recorrer las pestañas
  for (const tab of ['Ocupación', 'Bienes', 'Relaciones', 'Actividades']) {
    await page.click(`.nav-btn:has-text("${tab}")`);
    await page.waitForSelector('.sheet');
    await shot('tab-' + tab);
    if (tab === 'Actividades') {
      await tryClick('.sheet .cat >> nth=0');
      await tryClick('#layer .layer-item:last-child button.row:not([disabled]) >> nth=0');
      await page.waitForTimeout(100);
      if (await page.$('#layer .layer-item:last-child .sheet button.row')) await tryClick('#layer .layer-item:last-child button.row:not([disabled]) >> nth=0');
      await resolve();
    }
    if (tab === 'Ocupación') {
      if (await tryClick('text=Buscar empleo')) {
        await tryClick('#layer .layer-item:last-child button.row:not([disabled]) >> nth=0');
        await resolve();
      }
    }
    await page.evaluate(() => MV.UI.closeSheets());
  }
  // Minijuego del tatuaje, regalos y viaje con compañía
  await page.evaluate(() => {
    const g = MV.UI.g; g.over = false; g.queue = []; g.p.age = 25; g.p.money = 100000; g.p.yearActs = {};
    if (!MV.partner(g)) { const n = MV.sys.rels.candidate(g); MV.addRel(g, n, 'pareja', 60); }
    MV.UI.save(); MV.UI.renderGame();
  });
  await page.evaluate(() => MV.UI.runAction(MV.ACTS.find((a) => a.id === 'tatuaje')));
  await page.click('text=Empezar a dibujar');
  if (!(await page.$eval('#tat-go', (b) => b.disabled))) errors.push('Tatuar debería estar desactivado con el lienzo vacío');
  const box = await (await page.$('.tat-canvas')).boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3); await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + box.width * (0.2 + i * 0.05), box.y + box.height * (0.3 + (i % 2) * 0.2), { steps: 3 });
  await page.mouse.up();
  await page.click('button:has-text("Tatuar")');
  await page.waitForSelector('#layer .card');
  if (await page.evaluate(() => MV.UI.g.p.tattoos.length) !== 1) errors.push('El minijuego no creó el tatuaje');
  await resolve();
  // Álbum lleno: elegir uno para tapar habilita el botón y fija el lugar
  await page.evaluate(() => {
    const g = MV.UI.g, t = g.p.tattoos[0]; g.p.yearActs = {};
    for (let i = 1; i < MV.sys.tattoo.MAX_ALBUM; i++) g.p.tattoos.push(Object.assign({}, t, { id: 'tx' + i, place: i === 3 ? 'pierna' : t.place }));
    MV.UI.closeSheets(); MV.UI.runAction(MV.ACTS.find((a) => a.id === 'tatuaje'));
  });
  if (!(await page.$eval('#layer button:has-text("Empezar a dibujar")', (b) => b.disabled))) errors.push('Con el álbum lleno, Empezar a dibujar debería estar desactivado');
  await page.selectOption('#tat-cover', 'tx3');
  if (await page.$eval('#layer button:has-text("Empezar a dibujar")', (b) => b.disabled)) errors.push('Elegir un tatuaje para tapar no habilitó Empezar a dibujar');
  if (!(await page.$eval('#layer .seg button[aria-pressed="true"]', (b) => /Pierna/.test(b.textContent)))) errors.push('Tapar no fijó el lugar del tatuaje viejo');
  await page.evaluate(() => { const g = MV.UI.g; g.p.tattoos = g.p.tattoos.slice(0, 1); MV.UI.closeSheets(); });
  const partnerId = await page.evaluate(() => MV.partner(MV.UI.g).n.id);
  await page.evaluate((id) => { MV.UI.closeSheets(); MV.UI.showPerson(id); }, partnerId);
  await page.click('#layer button.row:has-text("Hacer un regalo")');
  await page.waitForSelector('#gift-select');
  const firstGift = await page.$eval('#gift-select option', (o) => o.value);
  await page.selectOption('#gift-select', firstGift);
  const moneyBefore = await page.evaluate(() => MV.UI.g.p.money);
  await page.click('button:has-text("Regalar")');
  await page.waitForSelector('#layer .card');
  if (await page.evaluate(() => MV.UI.g.p.money) >= moneyBefore) errors.push('Regalar no cobró nada');
  await resolve();
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.runAction(MV.ACTS.find((a) => a.id === 'vacaciones')); });
  await page.click('#layer .layer-item:last-child button.row >> nth=0');
  await page.waitForTimeout(100);
  await page.click('#layer .layer-item:last-child button.row >> nth=1'); // la fila 0 es "Ir solo"
  await page.waitForSelector('#layer .card');
  const tripMsg = await page.$eval('#layer .card .result', (e) => e.textContent);
  if (!/con /i.test(tripMsg)) errors.push('El viaje no fue con compañía: ' + tripMsg);
  await resolve();
  await shot('novedades');
  await page.evaluate(() => MV.UI.closeSheets());
  // Mascota con trucos y concurso
  const petId = await page.evaluate(() => { const g = MV.UI.g; g.p.money = Math.max(g.p.money, 1000); const pet = MV.newPet(g, 'perro', { age: 3 }); pet.tricks = ['sentarse', 'dar la pata']; MV.addRel(g, pet, 'mascota', 80); MV.UI.closeSheets(); MV.UI.showPerson(pet.id); return pet.id; });
  const tricksText = await page.$eval('#pet-tricks', (e) => e.textContent).catch(() => '');
  if (!/dar la pata/.test(tricksText)) errors.push('La ficha de la mascota no muestra sus trucos');
  await page.click('#layer button.row:has-text("concurso")');
  await page.waitForSelector('#layer .card');
  await resolve();
  if (await page.evaluate((id) => !MV.relOf(MV.UI.g, id), petId)) errors.push('La mascota desapareció tras el concurso');
  await page.evaluate(() => MV.UI.closeSheets());
  // Obras: escribir un libro con título propio y verlo en Mis obras
  await page.evaluate(() => { const g = MV.UI.g; g.p.yearActs = {}; MV.UI.closeSheets(); MV.UI.runAction(MV.ACTS.find((a) => a.id === 'libro')); });
  await page.fill('#work-title', 'Memorias de un <mapache>');
  await page.selectOption('#work-genre', 'memorias');
  await page.click('#work-go');
  await page.waitForSelector('#layer .card');
  const workMsg = await page.$eval('#layer .card .result', (e) => e.textContent);
  if (!/Memorias de un mapache/.test(workMsg)) errors.push('El resultado del libro no usa el título: ' + workMsg);
  await resolve();
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showProfile(); });
  const worksText = await page.$eval('#works-list', (e) => e.textContent).catch(() => '');
  if (await page.evaluate(() => MV.UI.g.challenge && !document.getElementById('profile-challenge'))) errors.push('La ficha no muestra el desafío');
  if (!/Memorias de un mapache/.test(worksText)) errors.push('Mis obras no muestra el libro: ' + worksText);
  await page.evaluate(() => MV.UI.closeSheets());
  // Examen de conducir: cerrar a mitad no cobra; terminarlo muestra el resultado
  await page.evaluate(() => { const g = MV.UI.g; g.p.age = Math.max(g.p.age, 16); g.p.money = Math.max(g.p.money, 5000); g.p.license = false; g.p.licenses = {}; g.p.yearActs = {}; MV.UI.closeSheets(); MV.UI.runAction(MV.ACTS.find((a) => a.id === 'lic_auto')); });
  await page.waitForSelector('#quiz-q');
  const money0 = await page.evaluate(() => MV.UI.g.p.money);
  for (let i = 0; i < 3; i++) await page.click('.quiz-opt >> nth=0');
  if (!/Pregunta 4 de 10/.test(await page.$eval('#quiz-progress', (e) => e.textContent))) errors.push('El examen no avanzó de pregunta');
  await page.evaluate(() => MV.UI.closeSheets());
  if (await page.evaluate((m) => MV.UI.g.p.money !== m || MV.usesLeft(MV.UI.g, MV.ACTS.find((a) => a.id === 'lic_auto')) !== 2, money0)) errors.push('Cerrar el examen a mitad cobró o gastó el intento');
  await page.evaluate(() => MV.UI.runAction(MV.ACTS.find((a) => a.id === 'lic_auto')));
  for (let i = 0; i < 10; i++) { await page.waitForSelector('.quiz-opt'); if (i === 0 && !(await page.$('.quiz-sign svg'))) errors.push('La pregunta no muestra el dibujo de la señal'); await page.click('.quiz-opt >> nth=1'); }
  await page.waitForSelector('#layer .card');
  const quizMsg = await page.$eval('#layer .card', (e) => e.textContent);
  if (!/de 10 correctas/.test(quizMsg)) errors.push('El resultado del examen no dice los aciertos: ' + quizMsg.slice(0, 120));
  if (!/Aprobaste/.test(quizMsg) && !(await page.$('#layer .card .quiz-mistakes'))) errors.push('Al reprobar no se ven los errores');
  await resolve();
  await page.evaluate(() => MV.UI.closeSheets());
  // Vehículos: usar el yate desde su ficha
  await page.evaluate(() => { const g = MV.UI.g; g.p.age = Math.max(g.p.age, 20); g.p.money = Math.max(g.p.money, 50000); g.p.yearActs = {}; g.p.assets.push({ id: 'yate1', type: 'lujo', kind: 'Yate', icon: '🛥️', name: 'Yate de prueba', value: 500000, cond: 100 }); MV.UI.closeSheets(); MV.UI.showAssets(); });
  await page.click('#layer button.row:has-text("Yate de prueba")');
  await page.click('#layer button.row:has-text("Paseo en yate")');
  await page.waitForSelector('#layer .card');
  if (!/yate/i.test(await page.$eval('#layer .card', (e) => e.textContent))) errors.push('Usar el yate no mostró el resultado');
  await resolve();
  await page.evaluate(() => { const g = MV.UI.g; g.p.assets = g.p.assets.filter((a) => a.id !== 'yate1'); MV.UI.closeSheets(); });
  // Isla: desarrollar un parque con nombre y mascota, y mejorarlo
  await page.evaluate(() => { const g = MV.UI.g; g.p.money = Math.max(g.p.money, 3e7); g.p.assets.push({ id: 'isla1', type: 'lujo', kind: 'Isla privada', icon: '🏝️', name: 'Isla de prueba', value: 2e7, cond: 100 }); MV.UI.closeSheets(); MV.UI.showAssets(); });
  await page.click('#layer button.row:has-text("Isla de prueba")');
  await page.click('#layer button.row:has-text("Desarrollar la isla")');
  await page.click('#layer .layer-item:last-child button.row:has-text("Parque temático")');
  await page.fill('#island-name', 'Mundo Mapache');
  await page.fill('#island-mascot', 'Mapache Pepe');
  await page.click('#island-go');
  await page.waitForSelector('#layer .card');
  if (!/Mundo Mapache/.test(await page.$eval('#layer .card', (e) => e.textContent))) errors.push('Desarrollar la isla no usó el nombre');
  await resolve();
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showAssets(); });
  await page.click('#layer button.row:has-text("Isla de prueba")');
  if (!/Mapache Pepe/.test(await page.$eval('#island-project', (e) => e.textContent).catch(() => ''))) errors.push('La ficha de la isla no muestra el proyecto');
  await page.click('#layer button.row:has-text("Mejorar al nivel 2")');
  await page.waitForSelector('#layer .card');
  await resolve();
  if (await page.evaluate(() => MV.UI.g.p.assets.find((a) => a.id === 'isla1').project.level) !== 2) errors.push('Mejorar la isla no subió el nivel');
  await page.evaluate(() => { const g = MV.UI.g; g.p.assets = g.p.assets.filter((a) => a.id !== 'isla1'); MV.UI.closeSheets(); });
  // Instrumentos: comprar una guitarra y practicar desde su ficha
  await page.evaluate(() => { const g = MV.UI.g; g.p.money = Math.max(g.p.money, 5000); g.p.yearActs = {}; MV.UI.closeSheets(); MV.UI.showMusicShop(); });
  await page.click('#layer button.row:has-text("Guitarra criolla")');
  await page.waitForSelector('#layer .card');
  await resolve();
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showAssets(); });
  await page.click('#layer button.row:has-text("Guitarra criolla")');
  const mus0 = await page.evaluate(() => MV.UI.g.p.skills.musica);
  await page.click('#layer button.row:has-text("Practicar con tu guitarra criolla")');
  await page.waitForSelector('#layer .card');
  await resolve();
  if (await page.evaluate((m) => MV.UI.g.p.skills.musica <= m, mus0)) errors.push('Practicar con el instrumento no subió Música');
  await page.evaluate(() => MV.UI.closeSheets());
  // Clubes y talleres: varios a la vez en Ocupación
  const clubRows = await page.evaluate(() => { const g = MV.UI.g; if (MV.sys.sports.isPro(g.p)) return 2; g.p.clubs = []; MV.sys.edu.joinClub(g, 'sport:futbol'); MV.sys.edu.joinClub(g, 'robotica'); MV.UI.closeSheets(); MV.UI.showWork(); return document.querySelectorAll('#my-clubs .row').length; });
  if (clubRows !== 2) errors.push('Ocupación no muestra los clubes y talleres: ' + clubRows);
  await page.evaluate(() => MV.UI.closeSheets());
  // Relaciones con nietos: su propio encabezado
  await page.evaluate(() => { const g = MV.UI.g; const kid = MV.newNPC(g, { age: 30, last: g.p.last }); MV.addRel(g, kid, 'hijo', 80); kid.married = true; kid.spouseName = 'Ana Pérez'; MV.sys.people.grandchild(g, kid); g.queue = []; MV.UI.closeSheets(); MV.UI.showRelations(); });
  const relHeads = await page.$$eval('#layer .section-title', (els) => els.map((e) => e.textContent.trim()));
  if (!relHeads.includes('Nietos') || relHeads.includes('')) errors.push('Relaciones no muestra el encabezado Nietos: ' + relHeads.join(' | '));
  await page.evaluate(() => MV.UI.closeSheets());
  // Intimidad: la protección se elige en pantalla y después decides qué son
  await page.evaluate(() => { const g = MV.UI.g; g.p.age = Math.max(g.p.age, 20); const n = MV.newNPC(g, { age: 25, gender: g.p.gender === 'm' ? 'f' : 'm' }); MV.UI.closeSheets(); g.queue = []; MV.EV.push(g, 'proteccion', { target: n.id, casual: true }, true); MV.UI.flushQueue(); });
  await page.waitForSelector('#layer .choice');
  const protLabels = await page.$$eval('#layer .choice', (els) => els.map((e) => e.textContent).join(' | '));
  if (!/Con protección \(0 % de embarazo\)/.test(protLabels) || !/Sin protección \(60 % de embarazo\)/.test(protLabels)) errors.push('La pregunta de protección no muestra los porcentajes: ' + protLabels);
  await page.click('#layer .choice:has-text("Con protección")');
  await page.waitForTimeout(150);
  if (await page.$('#layer .card .btn.primary')) await page.click('#layer .card .btn.primary');
  await page.waitForSelector('#layer .choice');
  const morning = await page.$$eval('#layer .choice', (els) => els.map((e) => e.textContent).join(' | '));
  if (!/Quedar como amigos/.test(morning)) errors.push('No apareció la decisión de la mañana siguiente: ' + morning);
  await resolve();
  await page.evaluate(() => MV.UI.closeSheets());
  // Noticias del mundo en Bienes y dinero
  await page.evaluate(() => { const g = MV.UI.g; g.log.push({ age: g.p.age, year: g.year, items: [] }); MV.sys.world.set(g, 'recesion'); MV.UI.showAssets(); });
  const newsText = await page.$eval('#world-news', (e) => e.textContent).catch(() => '');
  if (!/Recesión mundial/.test(newsText)) errors.push('Bienes y dinero no muestra el clima económico: ' + newsText);
  await page.evaluate(() => MV.UI.closeSheets());

  // Empresas: fundar un estudio con nombre propio, contratar, marketing e inyectar dinero
  await page.evaluate(() => { MV.UI.closeSheets(); const g = MV.UI.g; g.queue = []; g.p.prison = null; g.p.age = Math.max(g.p.age, 20); g.p.money = Math.max(g.p.money, 5e6); g.p.companies = []; g.p.business = null; MV.UI.showWork(); });
  await page.click('#layer .layer-item:last-child button.row:has-text("Fundar una empresa")');
  await page.fill('#co-name', 'Pixel Pantano');
  await page.click('#layer .layer-item:last-child button.row:has-text("Estudio de videojuegos")');
  await resolve();
  const coName = await page.evaluate(() => (MV.UI.g.p.companies[0] || {}).name);
  if (coName !== 'Pixel Pantano') errors.push('Fundar una empresa no la creó con su nombre: ' + coName);
  else {
    await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showCompany(MV.UI.g.p.companies[0].id); });
    await page.click('#layer .layer-item:last-child button.row:has-text("Contratar")');
    await page.click('#layer .layer-item:last-child button.row:has-text("Programador")');
    await page.click('#layer .layer-item:last-child .list button.row >> nth=0');
    await resolve();
    await page.click('#co-mkt-medio');
    await page.click('#layer .layer-item:last-child button.row:has-text("Inyectar dinero")');
    await page.click('#layer .layer-item:last-child button.row:has-text("$10.000")');
    await resolve();
    const coState = await page.evaluate(() => { const c = MV.UI.g.p.companies[0]; return { staff: c.staff.length, mkt: c.marketing, cash: c.cash }; });
    if (coState.staff !== 1 || coState.mkt !== 'medio' || coState.cash !== 60000) errors.push('La hoja de la empresa no contrató, no cambió el marketing o no inyectó: ' + JSON.stringify(coState));
    // Estudio: lanzar un juego (nombre, género y tamaño) y verlo en desarrollo
    await page.click('#layer .layer-item:last-child button.row:has-text("Empezar un juego")');
    await page.fill('#game-name', 'Noche en la Oficina');
    await page.click('#game-genre-terror');
    await page.click('#layer .layer-item:last-child button.row:has-text("Chico")');
    await resolve();
    const proj = await page.evaluate(() => MV.UI.g.p.companies[0].project);
    if (!proj || proj.name !== 'Noche en la Oficina' || proj.genre !== 'terror' || proj.size !== 'chico') errors.push('El juego no quedó en desarrollo: ' + JSON.stringify(proj));
    if (!/En desarrollo/.test(await page.$eval('#layer .layer-item:last-child', (e) => e.textContent))) errors.push('La hoja del estudio no muestra el juego en desarrollo');
    // Agencias: fichar un jugador de eSports y firmar un cliente
    const ag = await page.evaluate(() => { const g = MV.UI.g, C = MV.sys.company; C.found(g, 'esports', 'Los Mapaches'); C.found(g, 'representacion', 'Estrellas SA'); const r = g.p.companies[2]; r.rep = 100; MV.UI.closeSheets(); MV.UI.showCompany(g.p.companies[1].id); return [g.p.companies[1].id, r.id]; });
    await page.click('#layer .layer-item:last-child button.row:has-text("Fichar un jugador")');
    await page.click('#layer .layer-item:last-child .list button.row >> nth=0');
    await resolve();
    await page.evaluate((id) => { MV.UI.closeSheets(); MV.UI.showCompany(id); }, ag[1]);
    await page.click('#layer .layer-item:last-child button.row:has-text("Buscar talentos")');
    await page.click('#rep-com-15');
    await page.click('#layer .layer-item:last-child .list button.row >> nth=0');
    await resolve();
    const agState = await page.evaluate((ids) => ids.map((id) => { const c = MV.sys.company.get(MV.UI.g, id); return c.roster ? c.roster.length : c.clients.length; }), ag);
    if (agState[0] !== 1 || agState[1] !== 1) errors.push('Las agencias no ficharon jugador o cliente: ' + agState.join(','));
  }
  await page.evaluate(() => MV.UI.closeSheets());

  // Bolsa de valores: comprar y vender 10 acciones de VOLT; la ficha tiene gráfico
  await page.evaluate(() => { MV.UI.closeSheets(); const g = MV.UI.g; g.queue = []; g.p.money = Math.max(g.p.money, 1e6); MV.sys.market.ensure(g); MV.sys.market.yearly(g, { quiet: true }); MV.UI.showAssets(); });
  await page.click('#layer .layer-item:last-child button.row:has-text("Bolsa de valores")');
  await page.click('#layer .layer-item:last-child button.row:has-text("VOLT")');
  if (!(await page.$('#layer .layer-item:last-child svg.viz'))) errors.push('La ficha de la acción no tiene gráfico');
  await page.click('#buy-10');
  await resolve();
  const held = await page.evaluate(() => (MV.UI.g.p.portfolio.VOLT || { shares: 0 }).shares);
  if (held !== 10) errors.push('Comprar 10 acciones dejó ' + held);
  await page.click('#sell-all');
  await resolve();
  if (await page.evaluate(() => (MV.UI.g.p.portfolio.VOLT || { shares: 0 }).shares) !== 0) errors.push('Vender todas no vendió');
  await page.evaluate(() => MV.UI.closeSheets());

  // Concesionaria: filtrar por categoría, elegir color y comprar
  await page.evaluate(() => { MV.UI.closeSheets(); const g = MV.UI.g; g.queue = []; g.p.prison = null; g.p.age = Math.max(g.p.age, 20); g.p.money = Math.max(g.p.money, 5e6); MV.UI.showAssets(); });
  await page.click('#layer .layer-item:last-child button.row:has-text("Concesionaria")');
  await page.click('.dealer-cats [data-cat="suv"]');
  const suvNames = await page.$$eval('#layer .layer-item:last-child .list button.row .rl', (els) => els.map((e) => e.textContent));
  const suvModels = await page.evaluate(() => MV.CAR_CATALOG.filter((m) => m.cat === 'suv').map((m) => `${m.brand} ${m.model}`));
  if (!suvNames.length || suvNames.some((n) => !suvModels.includes(n))) errors.push('El filtro de SUV muestra otros autos: ' + suvNames.join(', '));
  if (!(await page.$('#layer .layer-item:last-child .car-thumb svg'))) errors.push('La concesionaria no dibuja los autos');
  await page.click('#layer .layer-item:last-child .list button.row >> nth=0');
  await page.click('.color-swatch[data-color="verde"]');
  const buyLabel = await page.$eval('#dealer-buy', (e) => e.textContent);
  if (!/verde/.test(buyLabel)) errors.push('El botón de compra no muestra el color elegido: ' + buyLabel);
  await page.click('#dealer-buy');
  await resolve();
  const bought = await page.evaluate(() => { const a = MV.UI.g.p.assets.filter((x) => x.type === 'auto').pop(); return a ? { model: a.model, color: a.color } : null; });
  if (!bought || bought.color !== 'verde' || !/okami_trekker|aurora_xl|tundra_montaraz|kaiserwerk_gelande|vellano_toro/.test(bought.model)) errors.push('La compra en la concesionaria no guardó modelo y color: ' + JSON.stringify(bought));
  // Ficha del auto: dibujo, tuneo, carreras y seguro
  await page.evaluate(() => { const g = MV.UI.g; g.p.licenses = Object.assign({}, g.p.licenses, { auto: true }); g.p.license = true; MV.UI.closeSheets(); MV.UI.showAssets(); });
  const carName = await page.evaluate(() => MV.UI.g.p.assets.filter((x) => x.type === 'auto').pop().name);
  await page.click(`#layer .layer-item:last-child button.row:has-text("${carName}")`);
  if (!(await page.$('#layer .layer-item:last-child .car-art svg'))) errors.push('La ficha del auto no tiene dibujo');
  await page.click('#layer .layer-item:last-child button.row:has-text("Motor preparado")');
  await resolve();
  await page.click('#layer .layer-item:last-child button.row:has-text("Asegurar")');
  await resolve();
  await page.click('#layer .layer-item:last-child button.row:has-text("Correr en circuito")');
  await resolve();
  const carState = await page.evaluate(() => { const a = MV.UI.g.p.assets.filter((x) => x.type === 'auto').pop(); return { motor: !!(a.tune || {}).motor, insured: a.insured }; });
  if (!carState.motor || !carState.insured) errors.push('Tunear o asegurar desde la ficha no funcionó: ' + JSON.stringify(carState));
  await page.evaluate(() => MV.UI.closeSheets());

  // Animaciones: números flotantes, avatar que reacciona y dinero que cuenta (y nada si se apagan)
  const animRun = () => page.evaluate(() => { MV.UI.closeSheets(); const g = MV.UI.g; g.queue = []; g.p.prison = null; g.p.yearActs = {}; g.p.age = Math.max(g.p.age, 20); g.p.stats.health = 50; MV.UI.execAction(MV.ACTS.find((x) => x.id === 'gimnasio')); });
  await animRun();
  await page.waitForTimeout(120);
  const anim = await page.evaluate(() => ({ floats: document.querySelectorAll('.float-num').length, av: !!document.querySelector('.idcard .avatar.jump, .idcard .avatar.shake') }));
  if (!anim.floats || !anim.av) errors.push('Una acción con cambios no animó: ' + JSON.stringify(anim));
  const zs = await page.evaluate(() => [Number(getComputedStyle(document.getElementById('float-layer')).zIndex), Number(getComputedStyle(document.getElementById('layer')).zIndex)]);
  if (!(zs[0] < zs[1])) errors.push('Los números flotantes se dibujan encima de las hojas abiertas: ' + zs.join(' vs '));
  await resolve();
  const moneyAnim = await page.evaluate(() => { MV.UI.g.p.money += 1000; MV.UI.refreshGame(true); return document.querySelector('[data-money]').className; });
  if (!/count-up/.test(moneyAnim)) errors.push('El dinero no cuenta al subir: ' + moneyAnim);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { MV.global().settings.anim = false; });
  await animRun();
  await page.waitForTimeout(120);
  const off = await page.evaluate(() => document.querySelectorAll('.float-num, .avatar.jump, .avatar.shake, .count-up, .count-down').length);
  if (off) errors.push('Con las animaciones apagadas igual se animó (' + off + ')');
  await resolve();
  await page.evaluate(() => { delete MV.global().settings.anim; MV.UI.closeSheets(); });

  // Resumen del año (y que no aparezca si se apaga) y gráficos de la ficha
  const yearCards = async () => {
    let seen = false;
    await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.g.queue = []; });
    await page.click('.ageup');
    for (let k = 0; k < 25; k++) {
      await page.waitForTimeout(40);
      if (await page.$('#year-summary')) { seen = true; await page.click('#year-summary .btn.primary'); continue; }
      if (await page.$('#layer .choice')) { await tryClick('#layer .choice >> nth=0'); continue; }
      if (await page.$('#layer .card .btn.primary')) { await tryClick('#layer .card .btn.primary'); continue; }
      break;
    }
    return seen;
  };
  if (!(await yearCards())) errors.push('No apareció el resumen del año');
  await page.evaluate(() => { MV.global().settings.yearSummary = false; });
  if (await yearCards()) errors.push('El resumen del año apareció con el ajuste apagado');
  await page.evaluate(() => { MV.global().settings.yearSummary = true; });
  await page.waitForTimeout(800); // si murió, la tumba aparece a los 650 ms
  if (await page.evaluate(() => MV.UI.g.over)) await page.evaluate(() => { const g = MV.newGame({ seed: 7 }); g.p.age = 25; MV.UI.startGame(g); });
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showProfile(); });
  const charts = await page.$$eval('#profile-charts svg.viz', (els) => els.length);
  if (charts !== 2) errors.push('La ficha no muestra los 2 gráficos: ' + charts);
  await page.evaluate(() => MV.UI.closeSheets());

  // Bienestar en la tarjeta y rutina en la ficha
  const wbChip = await page.$eval('#wellbeing-chip', (e) => e.textContent).catch(() => '');
  if (!/Bienestar \d+ · (Floreciendo|Bien|Regular|Mal)/.test(wbChip)) errors.push('Falta el chip de bienestar: ' + wbChip);
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showProfile(); });
  await page.click('#routine-exercise-ligero');
  await page.click('#routine-diet-equilibrada');
  const routine = await page.evaluate(() => MV.UI.g.p.routine);
  if (routine.exercise !== 'ligero' || routine.diet !== 'equilibrada') errors.push('La rutina no se guardó desde la ficha: ' + JSON.stringify(routine));
  if (!/Bienestar/.test(await page.$eval('#profile-wellbeing', (e) => e.textContent).catch(() => ''))) errors.push('La ficha no muestra el bienestar');
  await page.evaluate(() => MV.UI.closeSheets());

  // Comodidad: buscador y favoritos en Actividades
  await page.evaluate(() => { MV.UI.closeSheets(); const g = MV.UI.g; g.queue = []; g.p.prison = null; g.favs = []; MV.UI.showActivities(); });
  await page.fill('#act-search', 'gim');
  const found = await page.$$eval('#act-results button.row .rl', (els) => els.map((e) => e.textContent));
  if (!found.includes('Ir al gimnasio')) errors.push('Buscar "gim" no muestra Ir al gimnasio: ' + found.join(', '));
  await page.click('#act-results .row-fav:has-text("Ir al gimnasio") .fav-btn');
  if (!(await page.evaluate(() => MV.UI.g.favs.includes('gimnasio')))) errors.push('La estrella no marcó el favorito');
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showActivities(); });
  const favTop = await page.$eval('#act-favs', (e) => e.textContent).catch(() => '');
  if (!/Ir al gimnasio/.test(favTop)) errors.push('El favorito no aparece arriba en Actividades');
  await page.evaluate(() => MV.UI.closeSheets());
  // Avanzar 5 años: se detiene en cada decisión o aviso (nunca saltea una)
  let stopped = 0;
  for (let t = 0; t < 4; t++) {
    await resolve();
    const before5 = await page.evaluate(() => { const g = MV.UI.g; if (g.over) return null; g.queue = []; return g.p.age; });
    if (before5 == null) break;
    await page.click('.ageup5');
    await page.waitForTimeout(80);
    const st5 = await page.evaluate(() => ({ age: MV.UI.g.p.age, q: MV.UI.g.queue.length, over: MV.UI.g.over, sick: MV.UI.g.p.stats.health < 30, card: !!document.querySelector('#layer .card') }));
    const adv = st5.age - before5;
    if (adv < 1 || adv > 5) errors.push('⏩ avanzó ' + adv + ' años');
    if (adv < 5 && !st5.q && !st5.over && !st5.sick) errors.push('⏩ se detuvo sin una decisión ni un aviso');
    if (st5.q && !st5.card) errors.push('⏩ se detuvo pero no mostró la decisión');
    if (adv < 5) stopped++;
  }
  await resolve();
  if (!stopped) errors.push('⏩ nunca se detuvo en una decisión en 4 intentos');
  await page.waitForTimeout(800); // si murió, la tumba aparece a los 650 ms
  if (await page.evaluate(() => MV.UI.g.over)) await page.evaluate(() => { const g = MV.newGame({ seed: 7 }); g.p.age = 25; MV.UI.startGame(g); });
  // Ajustes: tamaño de letra y animaciones
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showMenu(); });
  await page.click('#layer .layer-item:last-child button.row:has-text("Ajustes")');
  await page.click('#set-font-muy_grande');
  const fontState = await page.evaluate(() => ({ attr: document.documentElement.getAttribute('data-font'), px: parseFloat(getComputedStyle(document.documentElement).fontSize), saved: MV.global().settings.font }));
  if (fontState.attr !== 'muy_grande' || fontState.px < 18 || fontState.saved !== 'muy_grande') errors.push('El tamaño de letra no cambió: ' + JSON.stringify(fontState));
  await page.click('#set-anim');
  if (await page.evaluate(() => MV.global().settings.anim) !== false) errors.push('El ajuste no apagó las animaciones');
  await page.click('#set-anim');
  await page.click('#set-font-normal');
  await page.evaluate(() => MV.UI.closeSheets());
  // Partidas guardadas: guardar en una ranura y volver a cargarla
  await page.evaluate(() => { MV.UI.closeSheets(); MV.UI.showMenu(); });
  await page.click('#layer .layer-item:last-child button.row:has-text("Partidas guardadas")');
  await page.click('#slot-save-0');
  const savedAge = await page.evaluate(() => MV.UI.g.p.age);
  if (!(await page.evaluate(() => MV.slotsInfo()[0]))) errors.push('Guardar en la ranura 1 no guardó');
  await page.evaluate(() => { MV.UI.closeSheets(); const g = MV.UI.g; g.queue = []; MV.ageUp(g); g.queue = []; MV.UI.save(); MV.UI.renderGame(); MV.UI.showMenu(); });
  await page.click('#layer .layer-item:last-child button.row:has-text("Partidas guardadas")');
  await page.click('#slot-load-0');
  await page.click('#layer .card .btn.danger');
  await page.waitForTimeout(100);
  const loadedAge = await page.evaluate(() => MV.UI.g.p.age);
  if (loadedAge !== savedAge) errors.push(`Cargar la ranura no volvió a la edad guardada (${savedAge} → ${loadedAge})`);
  await page.evaluate(() => { MV.deleteSlot(0); MV.UI.closeSheets(); });

  // Recargar: la partida debe continuar
  const state = await page.evaluate(() => ({ age: MV.UI.g.p.age, over: MV.UI.g.over }));
  if (state.over) { console.log('El personaje murió joven durante la prueba; se empieza otra vida.'); await page.evaluate(() => MV.UI.startGame(MV.newGame({ seed: 7 }))); }
  const before = await page.evaluate(() => MV.UI.g.p.age);
  await page.reload();
  try { await page.waitForSelector('.idcard', { timeout: 5000 }); } catch (e) {
    console.error('Tras recargar no hay partida. Pantalla:', await page.evaluate(() => document.getElementById('app').innerText.slice(0, 300)));
    throw e;
  }
  const after = await page.evaluate(() => MV.UI.g.p.age);
  if (before !== after) errors.push(`La partida no se restauró al recargar (${before} → ${after})`);
  // Darle hijos y morir para probar la herencia
  await page.evaluate(() => { const g = MV.UI.g; const k = MV.newNPC(g, { age: 3, last: g.p.last, money: 0 }); MV.addRel(g, k, 'hijo', 80); MV.sys.legacy.die(g, 'una prueba automatizada'); MV.UI.save(); MV.UI.showDeath(); });
  await page.waitForSelector('.tomb');
  if ((await page.$$('#death-charts svg.viz')).length !== 2) errors.push('La pantalla de la muerte no muestra los gráficos de la vida');
  await shot('muerte');
  await page.click('#copy-summary');
  await page.waitForTimeout(1900);
  const copied = await page.evaluate(() => { const ta = document.getElementById('summary-text'); return ta ? ta.value : (document.getElementById('toasts').textContent || ''); });
  if (!/Copiado|Mil Vidas/.test(copied)) errors.push('Copiar resumen no copió ni mostró el texto: ' + copied.slice(0, 80));
  await page.evaluate(() => MV.UI.closeSheets());
  // Partidas guardadas desde la pantalla de la muerte
  await page.evaluate(() => { MV.saveSlot(1, JSON.parse(JSON.stringify(MV.UI.g))); MV.UI.showDeath(); });
  await page.waitForSelector('.tomb');
  if (!(await tryClick('#death-slots'))) errors.push('La pantalla de la muerte no ofrece las partidas guardadas');
  else { if (!(await page.$('#slot-load-1'))) errors.push('Desde la muerte no se ven las ranuras'); await page.evaluate(() => MV.UI.closeSheets()); }
  await page.click('.death button.row >> nth=0');
  await page.waitForSelector('.idcard');
  const gen = await page.evaluate(() => MV.UI.g.generation);
  if (gen !== 2) errors.push('Continuar como heredero no creó la generación 2');
  for (let y = 0; y < 5; y++) { await tryClick('.ageup'); await resolve(); }
  // Menú y pantallas secundarias
  await page.click('.idcard button[aria-label="Menú"]');
  await page.click('text=Logros'); await page.waitForTimeout(100); await page.evaluate(() => MV.UI.popSheet());
  await page.click('text=Cementerio'); await page.waitForTimeout(100); await page.evaluate(() => MV.UI.popSheet());
  await page.click('text=Árbol de la dinastía'); await page.waitForTimeout(100);
  await shot('arbol');
  // Portada: cargar una partida guardada sin crear un personaje
  await page.evaluate(() => { const g = MV.UI.g; g.queue = []; MV.saveSlot(0, g); MV.UI.closeAll(); MV.UI.showCover(); });
  if (!(await tryClick('#cover-slots'))) errors.push('La portada no ofrece las partidas guardadas');
  else {
    await page.click('#slot-load-0');
    await page.click('#layer .card .btn.danger');
    try { await page.waitForSelector('.idcard', { timeout: 3000 }); } catch (e) { errors.push('Cargar una ranura desde la portada no abrió la partida'); }
  }
  await browser.close();
  if (errors.length) { console.error('Errores en la interfaz:\n' + errors.join('\n')); process.exit(1); }
  console.log('Interfaz OK');
})().catch(async (e) => {
  console.error(e.message.split('\n').slice(0, 3).join(' | '));
  if (global.__page) {
    try {
      console.error('Pantalla:', (await global.__page.evaluate(() => document.getElementById('app').innerText.slice(0, 200))).replace(/\n/g, ' | '));
      console.error('Errores:', global.__errors.join(' || ') || 'ninguno');
    } catch (err) { /* página cerrada */ }
  }
  process.exit(1);
});
