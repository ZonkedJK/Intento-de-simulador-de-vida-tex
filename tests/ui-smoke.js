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
  await page.click('text=Nacer');
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
  if (!/Memorias de un mapache/.test(worksText)) errors.push('Mis obras no muestra el libro: ' + worksText);
  await page.evaluate(() => MV.UI.closeSheets());
  // Noticias del mundo en Bienes y dinero
  await page.evaluate(() => { const g = MV.UI.g; g.log.push({ age: g.p.age, year: g.year, items: [] }); MV.sys.world.set(g, 'recesion'); MV.UI.showAssets(); });
  const newsText = await page.$eval('#world-news', (e) => e.textContent).catch(() => '');
  if (!/Recesión mundial/.test(newsText)) errors.push('Bienes y dinero no muestra el clima económico: ' + newsText);
  await page.evaluate(() => MV.UI.closeSheets());

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
  await shot('muerte');
  await page.click('#copy-summary');
  await page.waitForTimeout(1900);
  const copied = await page.evaluate(() => { const ta = document.getElementById('summary-text'); return ta ? ta.value : (document.getElementById('toasts').textContent || ''); });
  if (!/Copiado|Mil Vidas/.test(copied)) errors.push('Copiar resumen no copió ni mostró el texto: ' + copied.slice(0, 80));
  await page.evaluate(() => MV.UI.closeSheets());
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
  await browser.close();
  if (errors.length) { console.error('Errores en la interfaz:\n' + errors.join('\n')); process.exit(1); }
  console.log('Interfaz OK');
})().catch(async (e) => {
  console.error(e.message.split('\n')[0]);
  if (global.__page) {
    try {
      console.error('Pantalla:', (await global.__page.evaluate(() => document.getElementById('app').innerText.slice(0, 200))).replace(/\n/g, ' | '));
      console.error('Errores:', global.__errors.join(' || ') || 'ninguno');
    } catch (err) { /* página cerrada */ }
  }
  process.exit(1);
});
