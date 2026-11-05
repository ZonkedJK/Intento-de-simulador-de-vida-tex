/* Mil Vidas — avatares SVG procedurales: edad, peinado, barba, ánimo, ropa según la ocupación y accesorios. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});

  const BG = ['var(--hl-yellow)', 'var(--hl-blue)', 'var(--hl-green)', 'var(--hl-orange)', 'var(--hl-pink)'];
  const SHIRT = ['#3f63c8', '#d9534f', '#2e9e6a', '#8e5cc2', '#f0a030', '#2b2b2b', '#e86fa6', '#16a0b0'];
  const INK = 'var(--ink)';
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    try {
      const x = p(a), y = p(b);
      if (x.some(isNaN) || y.some(isNaN)) return a;
      return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
    } catch (e) { return a; }
  }
  function hairColor(look, age) {
    if (age >= 78) return '#eeeeee';
    if (age >= 62) return '#c9c9c9';
    if (age >= 50) return mix(look.hair, '#bdbdbd', 0.45);
    return look.hair;
  }

  /** Estilo de peinado 0-8. Los aspectos viejos (sin v: 2) usan el mapeo anterior por género. */
  function hairStyle(look, gender, age) {
    let s = look.style || 0;
    if (look.v !== 2) s = gender === 'f' ? [3, 4, 2, 3, 1][s] : [0, 1, 2, 0, 5][s];
    if (s === 5 && age < 35) s = 0;
    return s == null ? 0 : s;
  }
  const beardOf = (look) => (look.beardStyle != null ? look.beardStyle : look.beard ? 3 : 0);

  function shirt(cy, fill, extra) {
    return `<path d="M18 102 Q20 ${cy + 30} 50 ${cy + 27} Q80 ${cy + 30} 82 102 Z" fill="${fill}" stroke="${INK}" stroke-width="2.2"/>` + (extra || '');
  }

  const OUTFITS = {
    medico: (cy) => shirt(cy, '#f4f4f4', `<path d="M40 ${cy + 28} q-4 14 4 20 M60 ${cy + 28} q4 14 -4 20" fill="none" stroke="#7a7a7a" stroke-width="2"/><circle cx="56" cy="${cy + 49}" r="3" fill="#bdbdbd" stroke="${INK}" stroke-width="1.5"/><path d="M50 ${cy + 28} V102" stroke="#cfcfcf" stroke-width="1.5"/>`),
    policia: (cy) => shirt(cy, '#1d3557', `<path d="M42 ${cy + 28} L50 ${cy + 38} L58 ${cy + 28}" fill="none" stroke="#a8dadc" stroke-width="2"/><path d="M36 ${cy + 40} l3 -4 l3 4 l-3 4 Z" fill="#f2c94c" stroke="${INK}" stroke-width="1.2"/>`),
    chef: (cy) => shirt(cy, '#fafafa', `<circle cx="44" cy="${cy + 40}" r="1.6" fill="${INK}"/><circle cx="44" cy="${cy + 48}" r="1.6" fill="${INK}"/><circle cx="56" cy="${cy + 40}" r="1.6" fill="${INK}"/><circle cx="56" cy="${cy + 48}" r="1.6" fill="${INK}"/>`),
    deporte: (cy, id) => shirt(cy, SHIRT[(hash(id) + 3) % SHIRT.length], `<text x="50" y="${cy + 46}" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle" fill="#ffffff" stroke="${INK}" stroke-width="0.6">${(hash(id) % 98) + 1}</text>`),
    presidente: (cy) => shirt(cy, '#23253a', `<path d="M43 ${cy + 28} L50 ${cy + 44} L57 ${cy + 28} Z" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/><path d="M50 ${cy + 31} l-2.5 4 l2.5 12 l2.5 -12 Z" fill="#c0392b" stroke="${INK}" stroke-width="1"/><path d="M22 ${cy + 44} L78 ${cy + 60}" stroke="#2e86de" stroke-width="5" opacity="0.85"/>`),
    preso: (cy) => shirt(cy, '#f08a24', [cy + 36, cy + 44, cy + 52, cy + 60].map((y) => `<path d="M21 ${y} H79" stroke="#7a3b00" stroke-width="2.4" opacity="0.6"/>`).join('')),
    piloto: (cy) => shirt(cy, '#d62828', `<path d="M38 ${cy + 29} V102 M62 ${cy + 29} V102" stroke="#ffffff" stroke-width="3"/><rect x="44" y="${cy + 38}" width="10" height="7" fill="#ffffff" stroke="${INK}" stroke-width="1"/><path d="M44 ${cy + 38} h2.5 v3.5 h-2.5 Z M49 ${cy + 38} h2.5 v3.5 h-2.5 Z M46.5 ${cy + 41.5} h2.5 v3.5 h-2.5 Z M51.5 ${cy + 41.5} h2.5 v3.5 h-2.5 Z" fill="${INK}"/>`),
    estudiante: (cy) => shirt(cy, '#ffffff', `<path d="M50 ${cy + 29} l-3 4 l3 15 l3 -15 Z" fill="#1f5fbf" stroke="${INK}" stroke-width="1"/><path d="M42 ${cy + 28} L50 ${cy + 33} L58 ${cy + 28}" fill="none" stroke="${INK}" stroke-width="1.4"/>`),
    traje: (cy) => shirt(cy, '#2b2d42', `<path d="M43 ${cy + 28} L50 ${cy + 44} L57 ${cy + 28} Z" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/><path d="M50 ${cy + 31} l-2.5 4 l2.5 12 l2.5 -12 Z" fill="#111111" stroke="${INK}" stroke-width="1"/>`)
  };

  /**
   * SVG de una persona. o: {age, gender, look, id, mood (0-100), dead, outfit, acc: [], neckTattoo}
   */
  UI.avatarSVG = function (o) {
    const look = o.look || { skin: '#e0b089', hair: '#3a2618', eyes: '#3a2618', style: 0 };
    const age = o.age || 0;
    const id = String(o.id || 'x');
    const hh = hash(id);
    const stage = MV.stage(age);
    const skin = look.skin || '#e0b089';
    const hair = hairColor(look, age) || '#3a2618';
    const eyes = look.eyes || '#3a2618';
    const mood = o.mood == null ? 60 : o.mood;
    const acc = o.acc || [];
    const baby = stage === 'bebe';
    const kid = stage === 'nino';
    const r = baby ? 30 : kid ? 29 : 27;
    const cy = baby ? 56 : 52;
    const style = hairStyle(look, o.gender, age);
    const beard = o.gender === 'm' && age >= 16 ? beardOf(look) : 0;
    const P = [];
    P.push(`<rect width="100" height="100" fill="${BG[hh % BG.length]}"/>`);
    // Pelo por detrás (largo, coleta, melena)
    if (!baby && style === 3) P.push(`<path d="M${50 - r - 4} ${cy} Q${50 - r - 6} ${cy - r - 10} 50 ${cy - r - 6} Q${50 + r + 6} ${cy - r - 10} ${50 + r + 4} ${cy} L${50 + r + 6} ${cy + 32} Q${50 + 18} ${cy + 26} ${50 + 14} ${cy + 18} L${50 - 14} ${cy + 18} Q${50 - 18} ${cy + 26} ${50 - r - 6} ${cy + 32} Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
    if (!baby && style === 8) P.push(`<path d="M${50 - r - 4} ${cy + 2} Q${50 - r - 5} ${cy - r - 8} 50 ${cy - r - 5} Q${50 + r + 5} ${cy - r - 8} ${50 + r + 4} ${cy + 2} L${50 + r + 3} ${cy + 14} L${50 - r - 3} ${cy + 14} Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
    if (!baby && style === 7) P.push(`<path d="M${50 + r - 6} ${cy - r + 4} q16 2 14 22 q-2 10 -8 14 q2 -14 -10 -26 Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
    // Ropa (según la ocupación) y cuello
    P.push((OUTFITS[o.outfit] || ((c) => shirt(c, SHIRT[hh % SHIRT.length])))(cy, id));
    P.push(`<path d="M43 ${cy + r - 8} V${cy + 29} Q50 ${cy + 33} 57 ${cy + 29} V${cy + r - 8} Z" fill="${skin}" stroke="${INK}" stroke-width="2"/>`);
    if (o.neckTattoo && !baby) P.push(`<g data-neck-tattoo="1" fill="none" stroke="#1b1b1b" stroke-width="1.4" stroke-linecap="round"><path d="M46 ${cy + r - 1} q4 -4 8 0 q-4 4 -8 0"/><path d="M50 ${cy + r + 2} v3"/></g>`);
    // Orejas y cara
    P.push(`<circle cx="${50 - r}" cy="${cy + 2}" r="5" fill="${skin}" stroke="${INK}" stroke-width="2"/><circle cx="${50 + r}" cy="${cy + 2}" r="5" fill="${skin}" stroke="${INK}" stroke-width="2"/>`);
    if (acc.includes('piercing') && !baby) P.push(`<circle cx="${50 - r - 1}" cy="${cy + 7}" r="2.2" fill="none" stroke="#c9a227" stroke-width="1.6"/>`);
    P.push(`<circle cx="50" cy="${cy}" r="${r}" fill="${skin}" stroke="${INK}" stroke-width="2.4"/>`);
    // Pelo por delante
    const top = cy - r;
    if (baby) P.push(`<path d="M47 ${top + 1} q3 -9 9 -6 q-6 1 -5 6" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
    else if (style === 0) P.push(`<path d="M${50 - r + 1} ${cy - 4} Q${50 - r} ${top - 4} 50 ${top - 3} Q${50 + r} ${top - 4} ${50 + r - 1} ${cy - 4} Q${50 + r - 6} ${top + 10} 50 ${top + 9} Q${50 - r + 6} ${top + 10} ${50 - r + 1} ${cy - 4} Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
    else if (style === 1) P.push(`<path d="M${50 - r + 1} ${cy - 2} Q${50 - r} ${top - 5} 52 ${top - 4} Q${50 + r + 2} ${top - 2} ${50 + r - 1} ${cy - 2} Q${50 + r - 4} ${top + 8} 58 ${top + 10} Q44 ${top + 4} ${50 - r + 1} ${cy - 2} Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
    else if (style === 2) {
      let c = '';
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.1375); c += `<circle cx="${(50 + Math.cos(a) * (r + 1)).toFixed(1)}" cy="${(cy + Math.sin(a) * (r + 1) - 2).toFixed(1)}" r="8" fill="${hair}" stroke="${INK}" stroke-width="1.8"/>`; }
      P.push(c);
    } else if (style === 3 || style === 4 || style === 7 || style === 8) {
      P.push(`<path d="M${50 - r + 1} ${cy - 2} Q${50 - r + 2} ${top - 4} 50 ${top - 3} Q${50 + r - 2} ${top - 4} ${50 + r - 1} ${cy - 2} Q${50 + 8} ${top + 8} 50 ${top + 12} Q${50 - 8} ${top + 8} ${50 - r + 1} ${cy - 2} Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
      if (style === 4) P.push(`<circle cx="50" cy="${top - 6}" r="9" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
      if (style === 8) P.push(`<path d="M${50 - r + 2} ${cy - 2} q10 -6 22 -3 M${50 + r - 2} ${cy - 2} q-8 -6 -16 -4" fill="none" stroke="${INK}" stroke-width="1.4" opacity="0.6"/>`);
    } else if (style === 5) P.push(`<path d="M${50 - r + 2} ${cy - 4} q2 -8 8 -10 M${50 + r - 2} ${cy - 4} q-2 -8 -8 -10" fill="none" stroke="${hair}" stroke-width="5" stroke-linecap="round"/>`);
    else if (style === 6) P.push(`<path d="M42 ${top + 4} L44 ${top - 12} L48 ${top - 2} L50 ${top - 16} L52 ${top - 2} L56 ${top - 12} L58 ${top + 4} Q50 ${top + 8} 42 ${top + 4} Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>`);
    // Barba
    if (beard === 3) P.push(`<path d="M${50 - r + 3} ${cy + 4} Q${50 - r + 6} ${cy + r + 2} 50 ${cy + r + 1} Q${50 + r - 6} ${cy + r + 2} ${50 + r - 3} ${cy + 4} Q${50 + 12} ${cy + 18} 50 ${cy + 17} Q${50 - 12} ${cy + 18} ${50 - r + 3} ${cy + 4} Z" fill="${hair}" stroke="${INK}" stroke-width="1.8"/>`);
    // Ojos
    const ey = cy + (baby ? 2 : 0);
    if (o.dead) P.push(`<path d="M37 ${ey - 3} l6 6 m0 -6 l-6 6 M57 ${ey - 3} l6 6 m0 -6 l-6 6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
    else if (baby) P.push(`<path d="M37 ${ey} q4 3 8 0 M55 ${ey} q4 3 8 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
    else P.push(`<circle cx="40" cy="${ey}" r="3.4" fill="${eyes}"/><circle cx="60" cy="${ey}" r="3.4" fill="${eyes}"/><circle cx="40" cy="${ey}" r="1.5" fill="#111"/><circle cx="60" cy="${ey}" r="1.5" fill="#111"/><circle cx="41" cy="${ey - 1.2}" r="0.8" fill="#fff"/><circle cx="61" cy="${ey - 1.2}" r="0.8" fill="#fff"/>`);
    // Cejas según el ánimo
    if (!baby) {
      const sad = mood < 35, angry = mood < 15;
      const brow = mix(/^#[0-9a-f]{6}$/i.test(hair) ? hair : '#333333', '#222222', 0.4);
      P.push(`<path d="M35 ${ey - 8 + (sad ? 1 : 0)} q5 ${angry ? 3 : -3} 10 ${sad ? 2 : 0} M55 ${ey - 8 + (sad ? 2 : 0)} q5 ${angry ? 3 : -3} 10 ${sad ? -1 : 0}" fill="none" stroke="${brow}" stroke-width="2.2" stroke-linecap="round"/>`);
    }
    // Mejillas, pecas y nariz
    P.push(`<circle cx="34" cy="${ey + 9}" r="4.5" fill="var(--hl-pink)" opacity="0.45"/><circle cx="66" cy="${ey + 9}" r="4.5" fill="var(--hl-pink)" opacity="0.45"/>`);
    if (look.freckles) P.push(`<g fill="#8a5a3b" opacity="0.7"><circle cx="36" cy="${ey + 6}" r="0.9"/><circle cx="39" cy="${ey + 8}" r="0.9"/><circle cx="33" cy="${ey + 8}" r="0.9"/><circle cx="64" cy="${ey + 6}" r="0.9"/><circle cx="61" cy="${ey + 8}" r="0.9"/><circle cx="67" cy="${ey + 8}" r="0.9"/></g>`);
    P.push(`<path d="M50 ${ey + 3} q-3 6 1 7" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`);
    // Bigote y candado
    const my = ey + 14;
    if (beard === 1 || beard === 2) P.push(`<path d="M41 ${my - 3} q4 -4 9 -1 q5 -3 9 1 q-4 3 -9 1 q-5 2 -9 -1 Z" fill="${hair}" stroke="${INK}" stroke-width="1.4"/>`);
    if (beard === 2) P.push(`<path d="M45 ${my + 5} q5 7 10 0 q-1 5 -5 6 q-4 -1 -5 -6 Z" fill="${hair}" stroke="${INK}" stroke-width="1.4"/>`);
    // Boca (5 niveles de ánimo)
    if (o.dead) P.push(`<path d="M42 ${my + 1} L58 ${my + 1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
    else if (baby) P.push(`<path d="M42 ${my + 1} Q50 ${my + 4} 58 ${my + 1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><circle cx="50" cy="${my + 2}" r="3" fill="var(--hl-blue)" stroke="${INK}" stroke-width="1.5"/>`);
    else if (mood >= 85) P.push(`<path data-teeth="1" d="M39 ${my - 2} Q50 ${my + 12} 61 ${my - 2} Z" fill="#ffffff" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M41 ${my + 1} H59" stroke="#d8d8d8" stroke-width="1"/>`);
    else if (mood >= 60) P.push(`<path d="M40 ${my - 1} Q50 ${my + 9} 60 ${my - 1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
    else if (mood >= 35) P.push(`<path d="M42 ${my + 1} Q50 ${my + 4} 58 ${my + 1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
    else P.push(`<path d="M41 ${my + 4} Q50 ${my - 3} 59 ${my + 4}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
    if (!o.dead && !baby && mood < 15) P.push(`<g data-tears="1" fill="var(--hl-blue)" stroke="${INK}" stroke-width="1"><path d="M38 ${ey + 4} q-2 5 0 7 q2 -2 0 -7 Z"/><path d="M62 ${ey + 4} q-2 5 0 7 q2 -2 0 -7 Z"/></g>`);
    // Arrugas
    if (age >= 60) P.push(`<path d="M31 ${ey - 2} l-4 -2 M31 ${ey + 1} l-4 0 M69 ${ey - 2} l4 -2 M69 ${ey + 1} l4 0 M43 ${top + 14} q7 -3 14 0" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity="0.6"/>`);
    // Lentes (de sol si eres famoso)
    if (acc.includes('lentes_sol') && age >= 12) P.push(`<g stroke="${INK}" stroke-width="2"><path d="M31 ${ey - 4} h18 v4 q0 6 -9 6 q-9 0 -9 -6 Z M51 ${ey - 4} h18 v4 q0 6 -9 6 q-9 0 -9 -6 Z" fill="#111111"/><path d="M49 ${ey - 3} h2" fill="none"/></g>`);
    else if (look.glasses && age >= 6) P.push(`<g fill="none" stroke="${INK}" stroke-width="2"><circle cx="40" cy="${ey}" r="7.5"/><circle cx="60" cy="${ey}" r="7.5"/><path d="M47.5 ${ey} h5 M32.5 ${ey - 1} l-6 -3 M67.5 ${ey - 1} l6 -3"/></g>`);
    // Accesorios de la cabeza
    if (o.outfit === 'chef' && !baby) P.push(`<path d="M36 ${top + 2} h28 v-8 h-28 Z" fill="#ffffff" stroke="${INK}" stroke-width="2"/><path d="M34 ${top - 6} q-4 -14 8 -14 q4 -10 16 -4 q12 -4 10 10 q2 6 -2 8 Z" fill="#ffffff" stroke="${INK}" stroke-width="2"/>`);
    if (acc.includes('gorra_grad') && !baby && o.outfit !== 'chef') P.push(`<path d="M26 ${top + 2} l24 -10 l24 10 l-24 10 Z" fill="#1b1b1b" stroke="${INK}" stroke-width="1.6"/><path d="M36 ${top + 6} v6 q14 7 28 0 v-6" fill="#2b2b2b" stroke="${INK}" stroke-width="1.6"/><path d="M74 ${top + 2} v10" stroke="#f2c94c" stroke-width="2"/><circle cx="74" cy="${top + 13}" r="2" fill="#f2c94c"/>`);
    if (acc.includes('casco') && !baby) P.push(`<g data-helmet="1"><path d="M${50 - r - 3} ${cy + 3} Q${50 - r - 4} ${top - 11} 50 ${top - 11} Q${50 + r + 4} ${top - 11} ${50 + r + 3} ${cy + 3} L${50 + r - 3} ${cy + 3} Q${50 + r - 3} ${top + 2} 50 ${top + 2} Q${50 - r + 3} ${top + 2} ${50 - r + 3} ${cy + 3} Z" fill="#d62828" stroke="${INK}" stroke-width="2"/><path d="M50 ${top - 11} V${top + 2}" stroke="#ffffff" stroke-width="3"/></g>`);
    if (acc.includes('auriculares') && !baby) P.push(`<path d="M${50 - r - 2} ${cy} Q${50 - r} ${top - 8} 50 ${top - 8} Q${50 + r} ${top - 8} ${50 + r + 2} ${cy}" fill="none" stroke="#1b1b1b" stroke-width="4"/><rect x="${50 - r - 7}" y="${cy - 5}" width="9" height="13" rx="3" fill="#e63946" stroke="${INK}" stroke-width="1.6"/><rect x="${50 + r - 2}" y="${cy - 5}" width="9" height="13" rx="3" fill="#e63946" stroke="${INK}" stroke-width="1.6"/>`);
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${P.join('')}</svg>`;
  };

  /** Ropa según la ocupación del jugador. */
  UI.outfitFor = function (p) {
    if (!p || p.alive === false) return null;
    if (p.prison) return 'preso';
    if (p.job) {
      const J = MV.jobById(p.job.id) || {};
      if (J.type === 'sport') return J.sport === 'automovilismo' ? 'piloto' : J.sport === 'esports' ? null : 'deporte';
      if (['medico', 'cirujano', 'enfermero', 'veterinario', 'cientifico'].includes(J.id)) return 'medico';
      if (['policia', 'guardia', 'militar', 'bombero'].includes(J.id)) return 'policia';
      if (J.id === 'cocinero') return 'chef';
      if (J.id === 'politico') return p.job.level >= J.titles.length - 1 ? 'presidente' : 'traje';
      if (['gerente', 'financiero', 'abogado', 'juez', 'mafia', 'inmobiliario', 'arquitecto'].includes(J.id)) return 'traje';
    }
    if (p.edu && ['primaria', 'secundaria'].includes(p.edu.stage) && !p.edu.adult) return 'estudiante';
    return null;
  };

  /** Accesorios según la vida del jugador. */
  UI.accFor = function (p) {
    const acc = [];
    if (!p) return acc;
    const J = p.job && MV.jobById(p.job.id);
    if ((J && J.sport === 'esports') || (p.skills && p.skills.programacion >= 70)) acc.push('auriculares');
    if (p.fame >= 60) acc.push('lentes_sol');
    if (p.edu && MV.hasDegree(p, 'universidad') && p.age <= 26) acc.push('gorra_grad');
    if (p.look && p.look.piercing && p.age >= 14) acc.push('piercing');
    if (J && J.sport === 'automovilismo' && !p.prison) acc.push('casco');
    return acc;
  };

  /** Elemento avatar listo para insertar. n: persona (jugador o NPC). */
  UI.avatar = function (n, size, extra) {
    size = size || 48;
    extra = extra || {};
    const h = UI.h;
    if (n && n.species && n.species !== 'humano') {
      const S = MV.SPECIES[n.species] || { icon: '🐾' };
      return h('span', { class: 'avatar pet' + (n.alive === false ? ' dead' : ''), style: { width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.55) + 'px' }, 'aria-hidden': 'true' }, S.icon);
    }
    const dead = extra.dead != null ? extra.dead : n && n.alive === false;
    const mood = extra.mood != null ? extra.mood : n && n.stats ? n.stats.happy : 60;
    const isPlayer = !!(n && n.stats && n.skills);
    const el = h('span', { class: 'avatar' + (dead ? ' dead' : ''), style: { width: size + 'px', height: size + 'px', border: '2px solid var(--ink)' }, 'aria-hidden': 'true' });
    el.innerHTML = UI.avatarSVG({
      age: n ? n.age : 0, gender: n ? n.gender : 'm', look: n ? n.look : null, id: n ? n.id : 'x', mood, dead,
      outfit: isPlayer && !dead ? UI.outfitFor(n) : null, acc: isPlayer && !dead ? UI.accFor(n) : [],
      neckTattoo: !!(n && (n.tattoos || []).some((t) => t.place === 'cuello'))
    });
    return el;
  };
})(window.MV = window.MV || {});
