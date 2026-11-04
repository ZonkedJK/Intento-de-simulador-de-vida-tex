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
})().catch((e) => { console.error(e); process.exit(1); });
