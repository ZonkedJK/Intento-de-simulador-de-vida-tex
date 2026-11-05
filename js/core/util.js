/* Mil Vidas — utilidades básicas y generador aleatorio con semilla. */
(function (MV) {
  'use strict';

  // mulberry32: rápido, reproducible y con estado serializable (un entero).
  let seed = ((Date.now() ^ 0x9e3779b9) >>> 0) || 1;
  const rng = {
    seed(n) { seed = (n >>> 0) || 1; },
    getState() { return seed; },
    setState(v) { seed = (v >>> 0) || 1; },
    next() {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };
  MV.rng = rng;

  let uidCounter = 0;
  const numFmt = (() => {
    try { return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }); } catch (e) { return null; }
  })();

  const U = {
    rand: () => rng.next(),
    chance: (p) => rng.next() < p,
    int: (a, b) => a + Math.floor(rng.next() * (b - a + 1)),
    float: (a, b) => a + rng.next() * (b - a),
    pick: (arr) => (arr && arr.length ? arr[Math.floor(rng.next() * arr.length)] : undefined),
    /** Elige un elemento según pesos. `w` puede ser función o nombre de propiedad. */
    pickW(arr, w) {
      if (!arr || !arr.length) return undefined;
      const weight = typeof w === 'function' ? w : (x) => (w ? x[w] : x.w) || 1;
      let total = 0;
      const ws = arr.map((x) => { const v = Math.max(0, weight(x) || 0); total += v; return v; });
      if (total <= 0) return undefined;
      let r = rng.next() * total;
      for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r < 0) return arr[i]; }
      return arr[arr.length - 1];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** Normal aproximada (suma de uniformes). */
    gauss(mean, sd) {
      let s = 0;
      for (let i = 0; i < 6; i++) s += rng.next();
      return mean + (s - 3) * sd * 1.41;
    },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    uid(prefix) {
      uidCounter = (uidCounter + 1) % 1e6;
      return (prefix || 'x') + Math.floor(rng.next() * 1e9).toString(36) + uidCounter.toString(36);
    },
    num(n) {
      n = Math.round(n);
      return numFmt ? numFmt.format(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    money(n) {
      n = Math.round(n || 0);
      return (n < 0 ? '-$' : '$') + U.num(Math.abs(n));
    },
    /** Dinero abreviado: $1,2 M */
    moneyShort(n) {
      const a = Math.abs(n), s = n < 0 ? '-$' : '$';
      if (a >= 1e9) return s + (a / 1e9).toFixed(1).replace('.', ',') + ' MM';
      if (a >= 1e6) return s + (a / 1e6).toFixed(1).replace('.', ',') + ' M';
      if (a >= 1e4) return s + Math.round(a / 1e3) + ' mil';
      return U.money(n);
    },
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    cap: (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),
    /** Nivel de color de una barra: rojo < 40, amarillo 40-70, verde 71-100. */
    barLevel: (pct) => (pct >= 71 ? 'hi' : pct >= 40 ? 'mid' : 'lo'),
    /** Elige palabra según género: g('m'|'f'|'n'), masculino, femenino. */
    gw: (gender, m, f) => (gender === 'f' ? f : m),
    sum: (arr, fn) => arr.reduce((a, x) => a + (fn ? fn(x) : x), 0),
    deepClone: (o) => JSON.parse(JSON.stringify(o))
  };
  MV.U = U;
  MV.barLevel = U.barLevel;
})(window.MV = window.MV || {});
