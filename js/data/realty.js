/* Mil Vidas — inmuebles: tipos nuevos de propiedad, niveles de alquiler, inquilinos y negocios que alquilan. */
(function (MV) {
  'use strict';

  /** Variantes con nombre de cada tipo nuevo (las casas siguen en MV.HOUSES). */
  MV.REALTY = {
    local: [
      { kind: 'Local en esquina', icon: '🏪', price: [150000, 600000] },
      { kind: 'Local en galería', icon: '🏪', price: [120000, 380000] },
      { kind: 'Local frente a la plaza', icon: '🏪', price: [300000, 900000] }
    ],
    terreno: [
      { kind: 'Terreno en las afueras', icon: '🌾', price: [25000, 120000] },
      { kind: 'Lote con vista', icon: '🌾', price: [80000, 400000] },
      { kind: 'Terreno junto a la ruta', icon: '🌾', price: [40000, 200000] }
    ],
    edificio: [
      { kind: 'Edificio de 6 departamentos', icon: '🏢', price: [1200000, 4000000] },
      { kind: 'Edificio con portero', icon: '🏢', price: [2500000, 6000000] }
    ],
    vacaciones: [
      { kind: 'Cabaña en la playa', icon: '🏖️', price: [150000, 700000] },
      { kind: 'Casa en las sierras', icon: '🏖️', price: [200000, 900000] },
      { kind: 'Bungalow junto al lago', icon: '🏖️', price: [400000, 1500000] }
    ]
  };

  MV.REALTY_NAMES = { local: 'Locales comerciales', terreno: 'Terrenos', edificio: 'Edificios de departamentos', vacaciones: 'Casas de vacaciones' };

  /** Niveles de alquiler: renta anual (% del valor), años vacíos, mezcla de inquilinos y reglas del edificio. */
  MV.RENT_LEVELS = {
    barato: { name: 'barato', pct: 0.035, vacancy: 0, mix: { puntual: 40, cuidadoso: 35, moroso: 10, fiestero: 15 }, unitVacancy: 0.02, unitMoroso: 0.10, factor: 0.8 },
    normal: { name: 'normal', pct: 0.045, vacancy: 0.05, mix: { puntual: 35, cuidadoso: 25, moroso: 20, fiestero: 20 }, unitVacancy: 0.08, unitMoroso: 0.15, factor: 1 },
    caro: { name: 'caro', pct: 0.06, vacancy: 0.2, mix: { puntual: 25, cuidadoso: 15, moroso: 35, fiestero: 25 }, unitVacancy: 0.25, unitMoroso: 0.25, factor: 1.3 }
  };

  MV.TENANT_KINDS = {
    puntual: { icon: '😇', name: 'puntual' },
    moroso: { icon: '🐌', name: 'moroso|morosa' },
    fiestero: { icon: '🎉', name: 'fiestero|fiestera' },
    cuidadoso: { icon: '🧹', name: 'cuidadoso|cuidadosa' }
  };

  /** Negocios inventados que alquilan locales. */
  MV.SHOP_TENANTS = ['Pizzería La Tía Coca', 'Peluquería Tijeras Locas', 'Ferretería El Tornillo Feliz', 'Yoga Zen Total', 'Mascotas y Más',
    'Panadería Doña Miga', 'Lavadero Burbujas', 'Kiosco El Insomne', 'Verdulería Lechuga Feliz', 'Taller Tuerca Loca'];
})(window.MV = window.MV || {});
