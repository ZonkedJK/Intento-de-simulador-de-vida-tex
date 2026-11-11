/* Mil Vidas — utilidades mínimas de DOM. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});

  /** h('div', {class, onclick, ...}, hijos...) */
  UI.h = function (tag, props) {
    const el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        const v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (typeof v === 'boolean') { if (k in el) el[k] = v; else el.setAttribute(k, ''); }
        else el.setAttribute(k, v);
      });
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(add); return; }
      el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    };
    for (let i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  };
  UI.$ = (s, r) => (r || document).querySelector(s);
  UI.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  UI.svgEl = (markup) => { const d = document.createElement('div'); d.innerHTML = markup; return d.firstElementChild; };
  /** Texto con resaltador de marcador: color 'yellow' | 'green' | 'pink' | 'blue'. */
  UI.hl = (content, color) => UI.h('span', { class: 'hl hl-' + (color || 'yellow') }, content);
})(window.MV = window.MV || {});
