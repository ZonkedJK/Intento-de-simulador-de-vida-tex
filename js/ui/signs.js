/* Mil Vidas — dibujos de los exámenes: señales de tránsito, banderas náuticas y más (SVG propio). */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const INK = '#1b1b1b', RED = '#d62828', YEL = '#f6c90e', BLUE = '#1f5fbf', WHITE = '#ffffff', GREEN = '#2e9e44';
  const svg = (inner) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${inner}</svg>`;
  const txt = (x, y, size, color, t) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${size}" fill="${color}">${t}</text>`;
  const diamond = (inner) => `<path d="M50 4 L96 50 L50 96 L4 50 Z" fill="${YEL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${inner}`;
  const ring = (inner, slash) => `<circle cx="50" cy="50" r="43" fill="${WHITE}" stroke="${RED}" stroke-width="9"/>${inner}${slash ? `<path d="M21 21 L79 79" stroke="${RED}" stroke-width="9" stroke-linecap="round"/>` : ''}`;
  const blueSq = (inner) => `<rect x="8" y="8" width="84" height="84" rx="8" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>${inner}`;
  const line = (d, w, color) => `<path d="${d}" fill="none" stroke="${color || INK}" stroke-width="${w || 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const person = (x, y, s) => `<circle cx="${x}" cy="${y}" r="${5 * s}" fill="${INK}"/>${line(`M${x} ${y + 6 * s} L${x - 2 * s} ${y + 24 * s} L${x - 9 * s} ${y + 38 * s} M${x - 2 * s} ${y + 24 * s} L${x + 7 * s} ${y + 38 * s} M${x - 1 * s} ${y + 11 * s} L${x - 10 * s} ${y + 20 * s} M${x - 1 * s} ${y + 11 * s} L${x + 9 * s} ${y + 18 * s}`, 5 * s)}`;
  const car = (x, y, color) => `<rect x="${x}" y="${y}" width="16" height="26" rx="4" fill="${color}" stroke="${INK}" stroke-width="2"/><rect x="${x + 3}" y="${y + 5}" width="10" height="6" fill="${WHITE}"/>`;
  const flagPole = `<path d="M12 8 V94" stroke="${INK}" stroke-width="3"/>`;

  const SIGNS = {
    pare: `<path d="M33 5 H67 L95 33 V67 L67 95 H33 L5 67 V33 Z" fill="${RED}" stroke="${WHITE}" stroke-width="4"/><path d="M33 5 H67 L95 33 V67 L67 95 H33 L5 67 V33 Z" fill="none" stroke="${INK}" stroke-width="1.5"/>${txt(50, 60, 26, WHITE, 'PARE')}`,
    ceda: `<path d="M8 12 H92 L50 90 Z" fill="${WHITE}" stroke="${RED}" stroke-width="9" stroke-linejoin="round"/>`,
    contramano: `<circle cx="50" cy="50" r="44" fill="${RED}" stroke="${INK}" stroke-width="2"/><rect x="18" y="41" width="64" height="18" rx="2" fill="${WHITE}"/>`,
    velocidad: ring(txt(50, 62, 34, INK, '60')),
    curva: diamond(`${line('M44 78 V58 Q44 40 62 40', 8)}<path d="M60 28 L76 40 L60 52 Z" fill="${INK}"/>`),
    peatones: diamond(`${person(50, 26, 1)}<path d="M28 74 H72" stroke="${INK}" stroke-width="3" stroke-dasharray="6 4"/>`),
    no_estacionar: ring(txt(50, 64, 40, INK, 'E'), true),
    no_izquierda: ring(`${line('M60 74 V50 Q60 40 50 40 H40', 8)}<path d="M42 28 L26 40 L42 52 Z" fill="${INK}"/>`, true),
    rotonda: `<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>${line('M50 24 A26 26 0 1 1 26 60', 8, WHITE)}<path d="M15 54 L26 72 L37 56 Z" fill="${WHITE}"/>`,
    escuela: diamond(`${person(40, 30, 0.9)}${person(60, 40, 0.65)}`),
    paso_nivel: `<g transform="rotate(45 50 50)"><rect x="6" y="42" width="88" height="16" fill="${WHITE}" stroke="${RED}" stroke-width="4"/></g><g transform="rotate(-45 50 50)"><rect x="6" y="42" width="88" height="16" fill="${WHITE}" stroke="${RED}" stroke-width="4"/></g>`,
    obras: diamond(`${person(42, 30, 0.85)}${line('M52 46 L66 70', 4)}<path d="M62 70 L72 70 L68 76 Z" fill="${INK}"/><path d="M28 76 Q40 64 52 76 Z" fill="${INK}"/>`),
    resbaladizo: diamond(`${car(42, 22, INK)}${line('M38 56 Q46 62 38 68 Q30 74 38 80', 3)}${line('M62 56 Q70 62 62 68 Q54 74 62 80', 3)}`),
    no_adelantar: ring(`${car(28, 36, RED)}${car(54, 36, INK)}`),
    doble_mano: diamond(`${line('M42 76 V34', 6)}<path d="M32 38 L42 22 L52 38 Z" fill="${INK}"/>${line('M58 24 V66', 6)}<path d="M48 62 L58 78 L68 62 Z" fill="${INK}"/>`),
    hospital: blueSq(`<rect x="24" y="20" width="52" height="52" rx="4" fill="${WHITE}"/>${line('M50 28 V64 M32 46 H68', 11, RED)}`),
    estacionamiento: blueSq(txt(50, 70, 56, WHITE, 'E')),
    semaforo: diamond(`<rect x="38" y="22" width="24" height="56" rx="6" fill="${INK}"/><circle cx="50" cy="32" r="6" fill="${RED}"/><circle cx="50" cy="50" r="6" fill="${YEL}" stroke="${WHITE}" stroke-width="1"/><circle cx="50" cy="68" r="6" fill="${GREEN}"/>`),
    animales: diamond(`<ellipse cx="48" cy="52" rx="18" ry="11" fill="${INK}"/><circle cx="70" cy="44" r="7" fill="${INK}"/>${line('M66 37 L64 32 M74 37 L77 32', 3)}${line('M36 60 V74 M44 62 V74 M54 62 V74 M60 60 V74', 4)}${line('M30 50 Q24 56 26 64', 3)}`),
    no_bocina: ring(`<path d="M28 44 H40 L62 30 V70 L40 56 H28 Z" fill="${INK}"/>${line('M68 40 Q74 50 68 60', 3)}`, true),
    luces_barco: `<rect x="0" y="0" width="100" height="100" fill="#cfe8f7"/>${txt(50, 13, 10, INK, 'PROA ▲')}<path d="M50 18 Q72 38 70 94 H30 Q28 38 50 18 Z" fill="${WHITE}" stroke="${INK}" stroke-width="3"/><circle cx="33" cy="56" r="7" fill="${RED}" stroke="${INK}" stroke-width="2"/><circle cx="67" cy="56" r="7" fill="${GREEN}" stroke="${INK}" stroke-width="2"/><circle cx="50" cy="88" r="4" fill="${WHITE}" stroke="${INK}" stroke-width="2"/>`,
    bandera_a: `${flagPole}<path d="M14 14 H50 V86 H14 Z" fill="${WHITE}" stroke="${INK}" stroke-width="2"/><path d="M50 14 H92 L72 50 L92 86 H50 Z" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>`,
    bandera_b: `${flagPole}<path d="M14 14 H92 L72 50 L92 86 H14 Z" fill="${RED}" stroke="${INK}" stroke-width="2"/>`,
    bandera_o: `${flagPole}<path d="M14 14 H88 V86 Z" fill="${RED}" stroke="${INK}" stroke-width="2"/><path d="M14 14 V86 H88 Z" fill="${YEL}" stroke="${INK}" stroke-width="2"/>`,
    senalero: `<rect x="0" y="0" width="100" height="100" fill="#e7e2d4"/>${line('M40 58 L62 14 M60 58 L38 14', 6, '#f28c28')}<circle cx="50" cy="46" r="8" fill="#c48b62" stroke="${INK}" stroke-width="2"/><path d="M38 56 H62 L66 94 H34 Z" fill="#f28c28" stroke="${INK}" stroke-width="2"/>`,
    helipuerto: `<rect x="0" y="0" width="100" height="100" fill="#3a3f45"/><circle cx="50" cy="50" r="40" fill="none" stroke="${WHITE}" stroke-width="5"/>${txt(50, 68, 50, WHITE, 'H')}`
  };

  /** SVG de un dibujo de examen ('' si no existe). */
  UI.signSVG = function (key) { return SIGNS[key] ? svg(SIGNS[key]) : ''; };
})(window.MV = window.MV || {});
