/* Mil Vidas — avatares SVG procedurales (cambian con la edad, el aspecto y el ánimo). */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});

  const BG = ['var(--hl-yellow)', 'var(--hl-blue)', 'var(--hl-green)', 'var(--hl-orange)', 'var(--hl-pink)'];
  const SHIRT = ['#3f63c8', '#d9534f', '#2e9e6a', '#8e5cc2', '#f0a030', '#2b2b2b', '#e86fa6', '#16a0b0'];
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

  function hairColor(look, age) {
    if (age >= 78) return '#eeeeee';
    if (age >= 62) return '#c9c9c9';
    if (age >= 50 && look.hair !== '#c9c9c9') return mix(look.hair, '#bdbdbd', 0.45);
    return look.hair;
  }
  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    try {
      const x = p(a), y = p(b);
      return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
    } catch (e) { return a; }
  }

  /**
   * Devuelve el SVG de una persona. o: {age, gender, look, id, mood (0-100), dead}
   */
  UI.avatarSVG = function (o) {
    const look = o.look || { skin: '#e0b089', hair: '#3a2618', eyes: '#3a2618', style: 0 };
    const age = o.age || 0;
    const id = String(o.id || 'x');
    const hh = hash(id);
    const stage = MV.stage(age);
    const skin = look.skin;
    const hair = hairColor(look, age);
    const ink = 'var(--ink)';
    const mood = o.mood == null ? 60 : o.mood;
    const baby = stage === 'bebe';
    const kid = stage === 'nino';
    const r = baby ? 30 : kid ? 29 : 27;
    const cy = baby ? 56 : 52;
    let style = look.style || 0;
    style = o.gender === 'f' ? [3, 4, 2, 3, 1][style] : [0, 1, 2, 0, 5][style];
    if (style === 5 && age < 35) style = 0;
    const parts = [];
    parts.push(`<rect width="100" height="100" fill="${BG[hh % BG.length]}"/>`);
    // Hombros / ropa
    parts.push(`<path d="M20 102 Q22 ${cy + 30} 50 ${cy + 28} Q78 ${cy + 30} 80 102 Z" fill="${SHIRT[hh % SHIRT.length]}" stroke="${ink}" stroke-width="2.2"/>`);
    // Pelo largo por detrás
    if (!baby && style === 3) parts.push(`<path d="M${50 - r - 4} ${cy} Q${50 - r - 6} ${cy - r - 10} 50 ${cy - r - 6} Q${50 + r + 6} ${cy - r - 10} ${50 + r + 4} ${cy} L${50 + r + 6} ${cy + 32} Q${50 + 18} ${cy + 26} ${50 + 14} ${cy + 18} L${50 - 14} ${cy + 18} Q${50 - 18} ${cy + 26} ${50 - r - 6} ${cy + 32} Z" fill="${hair}" stroke="${ink}" stroke-width="2"/>`);
    if (!baby && style === 4) parts.push(`<circle cx="50" cy="${cy - r - 6}" r="9" fill="${hair}" stroke="${ink}" stroke-width="2"/>`);
    // Orejas y cara
    parts.push(`<circle cx="${50 - r}" cy="${cy + 2}" r="5" fill="${skin}" stroke="${ink}" stroke-width="2"/><circle cx="${50 + r}" cy="${cy + 2}" r="5" fill="${skin}" stroke="${ink}" stroke-width="2"/>`);
    parts.push(`<circle cx="50" cy="${cy}" r="${r}" fill="${skin}" stroke="${ink}" stroke-width="2.4"/>`);
    // Pelo superior
    if (baby) parts.push(`<path d="M47 ${cy - r + 1} q3 -9 9 -6 q-6 1 -5 6" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`);
    else if (style === 0) parts.push(`<path d="M${50 - r + 1} ${cy - 4} Q${50 - r} ${cy - r - 4} 50 ${cy - r - 3} Q${50 + r} ${cy - r - 4} ${50 + r - 1} ${cy - 4} Q${50 + r - 6} ${cy - r + 10} 50 ${cy - r + 9} Q${50 - r + 6} ${cy - r + 10} ${50 - r + 1} ${cy - 4} Z" fill="${hair}" stroke="${ink}" stroke-width="2"/>`);
    else if (style === 1) parts.push(`<path d="M${50 - r + 1} ${cy - 2} Q${50 - r} ${cy - r - 5} 52 ${cy - r - 4} Q${50 + r + 2} ${cy - r - 2} ${50 + r - 1} ${cy - 2} Q${50 + r - 4} ${cy - r + 8} 58 ${cy - r + 10} Q44 ${cy - r + 4} ${50 - r + 1} ${cy - 2} Z" fill="${hair}" stroke="${ink}" stroke-width="2"/>`);
    else if (style === 2) {
      let c = '';
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.1375); c += `<circle cx="${(50 + Math.cos(a) * (r + 1)).toFixed(1)}" cy="${(cy + Math.sin(a) * (r + 1) - 2).toFixed(1)}" r="8" fill="${hair}" stroke="${ink}" stroke-width="1.8"/>`; }
      parts.push(c);
    } else if (style === 3 || style === 4) parts.push(`<path d="M${50 - r + 1} ${cy - 2} Q${50 - r + 2} ${cy - r - 4} 50 ${cy - r - 3} Q${50 + r - 2} ${cy - r - 4} ${50 + r - 1} ${cy - 2} Q${50 + 8} ${cy - r + 8} 50 ${cy - r + 12} Q${50 - 8} ${cy - r + 8} ${50 - r + 1} ${cy - 2} Z" fill="${hair}" stroke="${ink}" stroke-width="2"/>`);
    else if (style === 5) parts.push(`<path d="M${50 - r + 2} ${cy - 4} q2 -8 8 -10 M${50 + r - 2} ${cy - 4} q-2 -8 -8 -10" fill="none" stroke="${hair}" stroke-width="5" stroke-linecap="round"/>`);
    // Barba
    if (look.beard && o.gender === 'm' && age >= 18) parts.push(`<path d="M${50 - r + 3} ${cy + 4} Q${50 - r + 6} ${cy + r + 2} 50 ${cy + r + 1} Q${50 + r - 6} ${cy + r + 2} ${50 + r - 3} ${cy + 4} Q${50 + 12} ${cy + 18} 50 ${cy + 17} Q${50 - 12} ${cy + 18} ${50 - r + 3} ${cy + 4} Z" fill="${hair}" stroke="${ink}" stroke-width="1.8"/>`);
    // Ojos
    const ey = cy + (baby ? 2 : 0);
    if (o.dead) parts.push(`<path d="M37 ${ey - 3} l6 6 m0 -6 l-6 6 M57 ${ey - 3} l6 6 m0 -6 l-6 6" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`);
    else if (baby) parts.push(`<path d="M37 ${ey} q4 3 8 0 M55 ${ey} q4 3 8 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`);
    else parts.push(`<circle cx="40" cy="${ey}" r="3.4" fill="${look.eyes}"/><circle cx="60" cy="${ey}" r="3.4" fill="${look.eyes}"/><circle cx="40" cy="${ey}" r="1.5" fill="#111"/><circle cx="60" cy="${ey}" r="1.5" fill="#111"/><circle cx="41" cy="${ey - 1.2}" r="0.8" fill="#fff"/><circle cx="61" cy="${ey - 1.2}" r="0.8" fill="#fff"/>`);
    // Cejas (expresión)
    if (!baby) {
      const sad = mood < 33, angry = mood < 15;
      parts.push(`<path d="M35 ${ey - 8 + (sad ? 1 : 0)} q5 ${angry ? 3 : -3} 10 ${sad ? 2 : 0} M55 ${ey - 8 + (sad ? 2 : 0)} q5 ${angry ? 3 : -3} 10 ${sad ? -1 : 0}" fill="none" stroke="${mix(hair.startsWith('#') ? hair : '#333333', '#222222', 0.4)}" stroke-width="2.2" stroke-linecap="round"/>`);
    }
    // Mejillas y pecas
    parts.push(`<circle cx="34" cy="${ey + 9}" r="4.5" fill="var(--hl-pink)" opacity="0.45"/><circle cx="66" cy="${ey + 9}" r="4.5" fill="var(--hl-pink)" opacity="0.45"/>`);
    if (look.freckles) parts.push(`<g fill="#8a5a3b" opacity="0.7"><circle cx="36" cy="${ey + 6}" r="0.9"/><circle cx="39" cy="${ey + 8}" r="0.9"/><circle cx="33" cy="${ey + 8}" r="0.9"/><circle cx="64" cy="${ey + 6}" r="0.9"/><circle cx="61" cy="${ey + 8}" r="0.9"/><circle cx="67" cy="${ey + 8}" r="0.9"/></g>`);
    // Nariz y boca
    parts.push(`<path d="M50 ${ey + 3} q-3 6 1 7" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`);
    const my = ey + 14;
    let mouth;
    if (o.dead) mouth = `M42 ${my + 1} L58 ${my + 1}`;
    else if (mood >= 66) mouth = `M40 ${my - 1} Q50 ${my + 9} 60 ${my - 1}`;
    else if (mood >= 36) mouth = `M42 ${my + 1} Q50 ${my + 4} 58 ${my + 1}`;
    else mouth = `M41 ${my + 4} Q50 ${my - 3} 59 ${my + 4}`;
    parts.push(`<path d="${mouth}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`);
    if (baby) parts.push(`<circle cx="50" cy="${my + 2}" r="3" fill="var(--hl-blue)" stroke="${ink}" stroke-width="1.5"/>`);
    // Arrugas
    if (age >= 60) parts.push(`<path d="M31 ${ey - 2} l-4 -2 M31 ${ey + 1} l-4 0 M69 ${ey - 2} l4 -2 M69 ${ey + 1} l4 0 M43 ${cy - r + 14} q7 -3 14 0" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" opacity="0.6"/>`);
    // Lentes
    if (look.glasses && age >= 6) parts.push(`<g fill="none" stroke="${ink}" stroke-width="2"><circle cx="40" cy="${ey}" r="7.5"/><circle cx="60" cy="${ey}" r="7.5"/><path d="M47.5 ${ey} h5 M32.5 ${ey - 1} l-6 -3 M67.5 ${ey - 1} l6 -3"/></g>`);
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${parts.join('')}</svg>`;
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
    const el = h('span', { class: 'avatar' + (dead ? ' dead' : ''), style: { width: size + 'px', height: size + 'px', border: '2px solid var(--ink)' }, 'aria-hidden': 'true' });
    el.innerHTML = UI.avatarSVG({ age: n ? n.age : 0, gender: n ? n.gender : 'm', look: n ? n.look : null, id: n ? n.id : 'x', mood, dead });
    return el;
  };
})(window.MV = window.MV || {});
