/* Mil Vidas — datos del lugar de trabajo: caracteres de jefe, roles de compañeros y encargos freelance. */
(function (MV) {
  'use strict';

  /** Carácter del jefe: promo/raise suman a las chances de ascenso y aumento; stress se suma cada año. */
  MV.BOSS_KINDS = {
    buenazo: { icon: '🙂', name: 'Buenazo|Buenaza', promo: 0.1, raise: 0.15, stress: 0 },
    controlador: { icon: '🔍', name: 'Controlador|Controladora', promo: 0, raise: 0, stress: 2 },
    griton: { icon: '📢', name: 'Gritón|Gritona', promo: 0, raise: 0, stress: 3 },
    ausente: { icon: '👻', name: 'Ausente', promo: 0, raise: 0, stress: 0 },
    trepador: { icon: '🧗', name: 'Trepador|Trepadora', promo: 0, raise: -0.1, stress: 0 }
  };

  MV.MATE_ROLES = {
    aliado: { icon: '🤝', name: 'aliado' },
    rival: { icon: '⚔️', name: 'rival' },
    chismoso: { icon: '🗣️', name: 'chismoso' }
  };

  /** Encargos freelance: uno por habilidad (se ofrecen con nivel 10 o más). */
  MV.FREELANCE = [
    { skill: 'programacion', icon: '💻', label: 'Arreglar la web de un cliente' },
    { skill: 'arte', icon: '🎨', label: 'Diseñar un logo' },
    { skill: 'idiomas', icon: '🌐', label: 'Traducir un documento' },
    { skill: 'cocina', icon: '🍰', label: 'Cocinar para un evento' },
    { skill: 'musica', icon: '🎸', label: 'Tocar en un casamiento' },
    { skill: 'carisma', icon: '🎙️', label: 'Animar una fiesta' }
  ];
})(window.MV = window.MV || {});
