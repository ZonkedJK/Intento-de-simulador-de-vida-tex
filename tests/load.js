/* Carga los scripts del juego (en el mismo orden que index.html) dentro de un contexto vm de Node. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
}

/** Devuelve el espacio de nombres MV listo para usar. opts.seed fija la semilla. */
function load(opts) {
  opts = opts || {};
  const ctx = { console, Intl, Date, Math, JSON, setTimeout, clearTimeout };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const src of scriptList()) {
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) {
      if (opts.skipMissing) continue;
      throw new Error('Falta el script ' + src);
    }
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: src });
  }
  const MV = ctx.MV;
  if (opts.seed != null) MV.rng.seed(opts.seed);
  return MV;
}

module.exports = { load, scriptList, ROOT };
