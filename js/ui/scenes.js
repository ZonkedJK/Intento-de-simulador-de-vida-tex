/* Mil Vidas — escenas ilustradas (SVG en línea, estilo garabato de cuaderno; usan las variables de color del tema). */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});

  const K = 'stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const Y = 'var(--hl-yellow)', P = 'var(--hl-pink)', G = 'var(--hl-green)', B = 'var(--hl-blue)', O = 'var(--hl-orange)', W = 'var(--card)', N = 'none';
  const ground = `<path d="M0 104 H320" ${K}/>`;
  const sun = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${Y}" ${K}/>` +
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * Math.PI / 4; return `<path d="M${(x + Math.cos(a) * (r + 5)).toFixed(1)} ${(y + Math.sin(a) * (r + 5)).toFixed(1)} L${(x + Math.cos(a) * (r + 11)).toFixed(1)} ${(y + Math.sin(a) * (r + 11)).toFixed(1)}" ${K}/>`; }).join('');
  const tree = (x, y, s) => `<path d="M${x} ${y} V${y - 22 * s}" ${K}/><circle cx="${x}" cy="${y - 32 * s}" r="${15 * s}" fill="${G}" ${K}/>`;
  const cloud = (x, y) => `<path d="M${x} ${y} q-12 0 -10 -10 q2 -10 14 -8 q4 -10 16 -6 q12 -2 12 10 q8 2 6 10 Z" fill="${W}" ${K}/>`;
  const windows = (x, y, cols, rows, w, h, gap, fill) => {
    let s = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect x="${x + c * (w + gap)}" y="${y + r * (h + gap)}" width="${w}" height="${h}" fill="${fill || B}" ${K}/>`;
    return s;
  };
  const txt = (x, y, t, size, fill) => `<text x="${x}" y="${y}" font-family="var(--font-hand)" font-weight="700" font-size="${size || 14}" fill="${fill || 'var(--ink)'}" text-anchor="middle">${t}</text>`;

  const SCENES = {
    hogar: () => sun(270, 30, 13) + `<path d="M60 104 V60 L115 26 L170 60 V104 Z" fill="${W}" ${K}/><path d="M50 66 L115 20 L180 66" fill="${N}" ${K}/>` +
      `<rect x="98" y="72" width="26" height="32" fill="${O}" ${K}/><circle cx="118" cy="89" r="2" fill="var(--ink)"/>` +
      `<rect x="70" y="68" width="20" height="18" fill="${B}" ${K}/><path d="M80 68 V86 M70 77 H90" ${K}/><rect x="138" y="68" width="20" height="18" fill="${B}" ${K}/><path d="M148 68 V86 M138 77 H158" ${K}/>` +
      tree(220, 104, 1) + `<path d="M150 34 V24 h10 v18" fill="${P}" ${K}/>` + ground,
    escuela: () => cloud(40, 34) + `<rect x="80" y="44" width="160" height="60" fill="${W}" ${K}/><path d="M72 48 L160 20 L248 48 Z" fill="${O}" ${K}/>` +
      windows(92, 56, 4, 2, 18, 14, 22) + `<rect x="148" y="78" width="24" height="26" fill="${P}" ${K}/>` +
      `<path d="M160 20 V2" ${K}/><path d="M160 3 h22 l-6 6 l6 6 h-22" fill="${Y}" ${K}/>` + `<circle cx="160" cy="36" r="6" fill="${Y}" ${K}/>` +
      `<rect x="262" y="58" width="44" height="30" fill="${G}" ${K}/>` + txt(284, 79, 'A+', 15) + `<path d="M272 88 L268 104 M296 88 L300 104" ${K}/>` + ground,
    universidad: () => `<path d="M70 44 L160 14 L250 44 Z" fill="${Y}" ${K}/><rect x="74" y="44" width="172" height="8" fill="${W}" ${K}/>` +
      [92, 124, 156, 188, 220].map((x) => `<rect x="${x}" y="52" width="12" height="42" fill="${W}" ${K}/>`).join('') +
      `<rect x="66" y="94" width="188" height="5" fill="${W}" ${K}/><rect x="58" y="99" width="204" height="5" fill="${W}" ${K}/>` +
      `<path d="M262 36 l22 -9 l22 9 l-22 9 Z" fill="var(--ink)" ${K}/><path d="M270 40 v9 q14 7 28 0 v-9" fill="${B}" ${K}/><path d="M306 36 v14" ${K}/><circle cx="306" cy="52" r="3" fill="${P}" ${K}/>` + ground,
    trabajo: () => `<rect x="30" y="20" width="50" height="40" fill="${W}" ${K}/><circle cx="55" cy="40" r="13" fill="${Y}" ${K}/><path d="M55 40 V31 M55 40 h7" ${K}/>` +
      `<rect x="110" y="30" width="96" height="58" rx="4" fill="${B}" ${K}/><path d="M122 76 L142 60 L160 68 L192 42" fill="${N}" ${K}/><path d="M150 88 V96 M168 88 V96" ${K}/>` +
      `<path d="M90 98 H300" ${K}/><path d="M138 96 H180" ${K}/>` +
      `<path d="M222 76 h20 v18 q-10 6 -20 0 Z" fill="${O}" ${K}/><path d="M242 80 q8 0 6 6 q-2 4 -6 3" fill="${N}" ${K}/><path d="M228 70 q-3 -5 0 -10 M236 70 q-3 -5 0 -10" ${K}/>` +
      `<path d="M268 98 h22 l-3 -16 h-16 Z" fill="${P}" ${K}/><path d="M279 82 q-10 -16 -2 -26 q4 12 2 26 q6 -14 14 -16 q-2 10 -14 16" fill="${G}" ${K}/>` + `<path d="M100 98 V104 M290 98 V104" ${K}/>`,
    hospital: () => `<rect x="80" y="30" width="150" height="74" fill="${W}" ${K}/>` + windows(92, 66, 5, 1, 16, 14, 13) +
      `<rect x="138" y="34" width="34" height="28" fill="${W}" ${K}/><path d="M155 38 V58 M145 48 H165" stroke="var(--margin)" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="142" y="84" width="26" height="20" fill="${B}" ${K}/>` +
      `<path d="M0 22 H40 L48 8 L58 36 L66 22 H80" fill="${N}" stroke="var(--margin)" stroke-width="2.5" stroke-linejoin="round"/><path d="M230 22 H252 L260 8 L270 36 L278 22 H320" fill="${N}" stroke="var(--margin)" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M262 104 v-22 h34 l10 10 v12 Z" fill="${W}" ${K}/><circle cx="272" cy="104" r="6" fill="${O}" ${K}/><circle cx="298" cy="104" r="6" fill="${O}" ${K}/><path d="M276 88 h8 M280 84 v8" stroke="var(--margin)" stroke-width="3"/>` + ground,
    carcel: () => `<rect x="0" y="0" width="320" height="120" fill="${W}"/>` +
      [20, 44, 68, 92].map((y, i) => `<path d="M0 ${y} H320" stroke="var(--grid)" stroke-width="2"/>` + Array.from({ length: 8 }, (_, j) => `<path d="M${j * 44 + (i % 2) * 22} ${y} V${y + 24}" stroke="var(--grid)" stroke-width="2"/>`).join('')).join('') +
      `<rect x="130" y="16" width="60" height="40" fill="${B}" ${K}/><circle cx="168" cy="30" r="8" fill="${Y}" ${K}/><path d="M145 16 V56 M160 16 V56 M175 16 V56" ${K}/>` +
      Array.from({ length: 9 }, (_, i) => `<path d="M${16 + i * 36} 0 V120" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>`).join('') +
      `<path d="M0 66 H320" stroke="var(--ink)" stroke-width="5"/>` + `<path d="M232 96 q8 -12 16 0 q-8 10 -16 0 Z" fill="${O}" ${K}/>`,
    fiesta: () => [[60, 40, Y], [92, 30, P], [124, 44, B], [220, 34, G], [252, 42, O], [282, 30, P]].map(([x, y, f]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="17" fill="${f}" ${K}/><path d="M${x} ${y + 17} q-5 14 3 28 q-6 12 0 30" fill="${N}" ${K}/>`).join('') +
      `<path d="M170 0 V14" ${K}/><circle cx="170" cy="30" r="15" fill="${B}" ${K}/><path d="M156 30 H184 M170 15 V45 M159 21 H181 M159 39 H181" ${K}/>` +
      Array.from({ length: 16 }, (_, i) => `<rect x="${(i * 53) % 310 + 6}" y="${(i * 37) % 70 + 8}" width="6" height="3" fill="${[Y, P, G, B][i % 4]}" transform="rotate(${(i * 47) % 90} ${(i * 53) % 310 + 9} ${(i * 37) % 70 + 9})"/>`).join('') + ground,
    cementerio: () => `<rect width="320" height="120" fill="color-mix(in srgb, var(--hl-blue) 25%, transparent)"/><circle cx="262" cy="26" r="15" fill="${Y}" ${K}/><circle cx="256" cy="21" r="12" fill="var(--paper)" opacity="0.55"/>` +
      `<path d="M0 104 Q80 84 160 96 T320 92 V120 H0 Z" fill="${G}" ${K}/>` +
      [[60, 66], [130, 56], [200, 70]].map(([x, y]) => `<path d="M${x} 104 V${y + 14} q0 -18 20 -18 q20 0 20 18 V104 Z" fill="${W}" ${K}/>` + txt(x + 20, y + 26, 'RIP', 11)).join('') +
      `<path d="M270 104 V70 M258 80 H282" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>` + `<path d="M110 30 q6 -6 12 0 q6 -6 12 0 q-6 2 -12 8 q-6 -6 -12 -8" fill="var(--ink)"/>`,
    tribunal: () => `<path d="M70 40 L160 12 L250 40 Z" fill="${W}" ${K}/>` + [86, 118, 150, 182, 214].map((x) => `<rect x="${x}" y="40" width="14" height="56" fill="${W}" ${K}/>`).join('') + `<rect x="62" y="96" width="196" height="8" fill="${W}" ${K}/>` +
      `<path d="M285 30 V96 M265 96 h40 M262 40 h46" ${K}/><path d="M262 40 l-10 24 h20 Z M308 40 l-10 24 h20 Z" fill="${Y}" ${K}/>` +
      `<rect x="16" y="54" width="34" height="16" rx="3" fill="${O}" ${K} transform="rotate(-25 33 62)"/><path d="M40 70 L58 100" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><rect x="14" y="98" width="40" height="6" fill="${O}" ${K}/>` + ground,
    casino: () => `<rect x="100" y="16" width="120" height="84" rx="10" fill="${P}" ${K}/><rect x="112" y="34" width="96" height="34" fill="${W}" ${K}/><path d="M144 34 V68 M176 34 V68" ${K}/>` +
      txt(128, 58, '7', 20) + txt(160, 58, '7', 20) + txt(192, 58, '7', 20) + `<rect x="128" y="78" width="64" height="12" fill="${Y}" ${K}/>` +
      `<path d="M220 40 h12 v-22" ${K}/><circle cx="232" cy="14" r="7" fill="var(--margin)" ${K}/>` +
      [[40, 96], [58, 90], [48, 82], [268, 96], [284, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="5" fill="${Y}" ${K}/>`).join('') +
      `<rect x="250" y="40" width="30" height="42" rx="4" fill="${W}" ${K} transform="rotate(12 265 61)"/>` + txt(266, 68, '♠', 22) + ground,
    playa: () => sun(60, 34, 16) + `<path d="M0 76 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V96 H0 Z" fill="${B}" ${K}/>` +
      `<path d="M0 96 Q160 84 320 96 V120 H0 Z" fill="${Y}" ${K}/>` +
      `<path d="M210 104 L226 40" ${K}/><path d="M186 48 q40 -36 80 0 Z" fill="${P}" ${K}/><path d="M206 48 q20 -30 40 0" fill="${N}" ${K}/>` +
      `<path d="M286 102 q-4 -40 6 -64" ${K}/><path d="M292 38 q-22 -6 -32 10 M292 38 q20 -10 28 6 M292 38 q-6 -18 -24 -18 M292 38 q8 -20 24 -16" fill="${N}" stroke="var(--good)" stroke-width="4" stroke-linecap="round"/>` + cloud(150, 30),
    ciudad: () => `<circle cx="280" cy="24" r="12" fill="${Y}" ${K}/>` +
      [[10, 50, 40], [56, 30, 36], [98, 60, 30], [134, 20, 44], [184, 46, 34], [224, 36, 40], [270, 58, 40]].map(([x, y, w], i) => `<rect x="${x}" y="${y}" width="${w}" height="${104 - y}" fill="${i % 2 ? W : B}" ${K}/>` +
        Array.from({ length: Math.floor((96 - y) / 16) }, (_, r) => `<rect x="${x + 7}" y="${y + 8 + r * 16}" width="7" height="7" fill="${Y}"/><rect x="${x + w - 14}" y="${y + 8 + r * 16}" width="7" height="7" fill="${r % 2 ? Y : W}"/>`).join('')).join('') + ground,
    naturaleza: () => sun(268, 28, 12) + cloud(70, 30) +
      `<path d="M0 104 L70 36 L140 104 Z" fill="${B}" ${K}/><path d="M52 54 L70 36 L88 54 L78 50 L70 56 L62 50 Z" fill="${W}" ${K}/>` +
      `<path d="M100 104 L180 24 L260 104 Z" fill="${G}" ${K}/><path d="M160 44 L180 24 L200 44 L190 40 L180 48 L170 40 Z" fill="${W}" ${K}/>` +
      [[244, 1], [272, 0.8], [300, 1.1]].map(([x, s]) => `<path d="M${x} 104 V${104 - 10 * s}" ${K}/><path d="M${x - 14 * s} ${104 - 10 * s} L${x} ${104 - 44 * s} L${x + 14 * s} ${104 - 10 * s} Z" fill="${G}" ${K}/>`).join('') + ground,
    boda: () => `<path d="M90 104 V54 Q160 -6 230 54 V104" fill="${N}" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>` +
      [[96, 60], [108, 40], [128, 26], [160, 20], [192, 26], [212, 40], [224, 60]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${[P, Y, W][i % 3]}" ${K}/>`).join('') +
      `<circle cx="148" cy="74" r="14" fill="${N}" stroke="${Y}" stroke-width="6"/><circle cx="172" cy="74" r="14" fill="${N}" stroke="${Y}" stroke-width="6"/><circle cx="148" cy="74" r="14" fill="${N}" ${K}/><circle cx="172" cy="74" r="14" fill="${N}" ${K}/>` +
      `<path d="M40 40 c-8 -10 -22 0 -10 12 l10 10 l10 -10 c12 -12 -2 -22 -10 -12 Z" fill="${P}" ${K}/><path d="M280 40 c-8 -10 -22 0 -10 12 l10 10 l10 -10 c12 -12 -2 -22 -10 -12 Z" fill="${P}" ${K}/>` + ground,
    escenario: () => `<path d="M0 0 H320 V14 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 q-20 10 -40 0 Z" fill="${P}" ${K}/>` +
      `<path d="M0 14 Q30 60 18 104 H0 Z M320 14 Q290 60 302 104 H320 Z" fill="${P}" ${K}/>` +
      `<path d="M160 14 L110 96 H210 Z" fill="${Y}" opacity="0.55"/>` +
      `<path d="M160 96 V58" ${K}/><rect x="154" y="44" width="12" height="16" rx="6" fill="${W}" ${K}/><path d="M146 96 h28" ${K}/>` +
      `<path d="M40 96 H280 V104 H40 Z" fill="${O}" ${K}/>` + [[70, 40], [250, 44], [100, 66], [224, 70]].map(([x, y]) => txt(x, y, '★', 18)).join(''),
    espacio: () => `<rect width="320" height="120" fill="color-mix(in srgb, var(--hl-blue) 55%, var(--card))"/>` +
      Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 71) % 316 + 2}" cy="${(i * 29) % 110 + 4}" r="${i % 3 ? 1.4 : 2.4}" fill="var(--ink)"/>`).join('') +
      `<circle cx="80" cy="64" r="28" fill="${O}" ${K}/><ellipse cx="80" cy="64" rx="48" ry="11" fill="${N}" ${K} transform="rotate(-14 80 64)"/>` +
      `<g transform="rotate(35 230 60)"><path d="M230 20 q14 18 14 46 h-28 q0 -28 14 -46 Z" fill="${W}" ${K}/><circle cx="230" cy="46" r="6" fill="${B}" ${K}/><path d="M216 66 l-10 14 h10 Z M244 66 l10 14 h-10 Z" fill="${P}" ${K}/><path d="M224 66 q6 22 12 0" fill="${Y}" ${K}/></g>`
  };

  UI.sceneSVG = function (name) {
    const f = SCENES[name] || SCENES.hogar;
    return `<svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${f()}</svg>`;
  };
  UI.SCENE_NAMES = Object.keys(SCENES);
})(window.MV = window.MV || {});
