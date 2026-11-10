/* Mil Vidas — animaciones de cambios de estado: números flotantes, avatar que reacciona y dinero que cuenta. */
(function (MV) {
  'use strict';
  const UI = (MV.UI = MV.UI || {});
  const U = MV.U;
  const KEYS = ['happy', 'health', 'smarts', 'looks', 'money'];

  /** Instantánea de lo que se anima (estadísticas principales y dinero). */
  UI.snap = function () {
    const g = UI.g, p = g && g.p;
    if (!p) return null;
    return { id: p.id, happy: p.stats.happy, health: p.stats.health, smarts: p.stats.smarts, looks: p.stats.looks, money: Math.round(p.money) };
  };

  /** Diferencias entre dos instantáneas de la misma persona (solo las distintas de 0). */
  UI.diffSnap = function (a, b) {
    if (!a || !b || a.id !== b.id) return [];
    return KEYS.map((k) => ({ k, d: Math.round(b[k] - a[k]) })).filter((x) => x.d !== 0);
  };

  /** ¿Se muestran animaciones? (Ajustes → Animaciones y "reducir movimiento" del sistema). */
  UI.animOn = function () {
    let st = {};
    try { st = (MV.global && MV.global().settings) || {}; } catch (e) { st = {}; }
    if (st.anim === false) return false;
    try { if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { /* sin matchMedia */ }
    return typeof document !== 'undefined';
  };

  function layer() {
    let l = document.getElementById('float-layer');
    if (!l) { l = document.createElement('div'); l.id = 'float-layer'; l.setAttribute('aria-hidden', 'true'); document.body.append(l); }
    return l;
  }

  /** Número que sube desde `el` (centrado sobre él y siempre dentro de la pantalla). */
  function floatAt(el, text, up) {
    const r = el.getBoundingClientRect();
    const f = document.createElement('span');
    f.className = 'float-num ' + (up ? 'up' : 'down');
    f.textContent = text;
    layer().append(f);
    const w = f.offsetWidth, vw = document.documentElement.clientWidth || window.innerWidth;
    f.style.left = Math.round(U.clamp(r.left + r.width / 2 - w / 2, 4, vw - w - 4)) + 'px';
    f.style.top = Math.round(r.top - 14) + 'px';
    setTimeout(() => f.remove(), 1100);
  }

  function countMoney(el, from, to) {
    const t0 = performance.now(), dur = 600;
    el.classList.add(to > from ? 'count-up' : 'count-down');
    const step = (t) => {
      if (!el.isConnected) return;
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = U.moneyShort(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
      else { el.textContent = U.moneyShort(to); setTimeout(() => el.classList.remove('count-up', 'count-down'), 300); }
    };
    requestAnimationFrame(step);
  }

  /** Anima lo que cambió desde `before` (lo llama refreshGame tras cada cambio). */
  UI.animateChange = function (before) {
    if (!UI.animOn()) return;
    const now = UI.snap(), ds = UI.diffSnap(before, now);
    if (!ds.length) return;
    let score = 0;
    ds.forEach(({ k, d }) => {
      if (k === 'money') {
        score += Math.sign(d) * 3;
        const el = document.querySelector('[data-money]');
        if (el) countMoney(el, before.money, now.money);
        return;
      }
      score += d;
      const row = document.querySelector(`[data-stat="${k}"]`);
      if (!row) return;
      floatAt(row.querySelector('.val') || row, `${d > 0 ? '+' : '−'}${Math.abs(d)} ${MV.STATS[k].icon}`, d > 0);
      const bar = row.querySelector('.bar > i');
      if (bar) {
        const to = bar.style.width;
        bar.style.transition = 'none';
        bar.style.width = U.clamp(before[k], 0, 100) + '%';
        void bar.offsetWidth;
        bar.style.transition = '';
        bar.style.width = to;
      }
      row.classList.add('flash');
      setTimeout(() => row.classList.remove('flash'), 700);
    });
    const av = document.querySelector('.idcard .who .avatar, .idcard .who svg');
    if (av && score !== 0) {
      av.classList.remove('jump', 'shake');
      void av.getBoundingClientRect();
      av.classList.add(score > 0 ? 'jump' : 'shake');
      setTimeout(() => av.classList.remove('jump', 'shake'), 600);
    }
  };
})(window.MV = window.MV || {});
