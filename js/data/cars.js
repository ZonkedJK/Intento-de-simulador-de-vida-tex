/* Mil Vidas — concesionaria: categorías, modelos (marcas y nombres inventados) y colores. */
(function (MV) {
  'use strict';

  MV.CAR_CATS = {
    hiperauto: { name: 'Hiperautos', icon: '🏎️' },
    deportivo: { name: 'Deportivos', icon: '🏁' },
    sedan: { name: 'Sedanes', icon: '🚗' },
    suv: { name: 'SUV', icon: '🚙' },
    pickup: { name: 'Pickups y camionetas', icon: '🛻' },
    electrico: { name: 'Eléctricos', icon: '🔋' },
    clasico: { name: 'Clásicos', icon: '🚘' },
    moto: { name: 'Motos', icon: '🏍️' },
    lujo: { name: 'Lujo', icon: '🎩' }
  };

  /**
   * Modelos: { id, brand, model, cat, price, speed (km/h), accel (0 a 100 en s), fuel (litros cada 100 km; 0 = eléctrico),
   * prestige (0 a 100), desc, art: rasgos del dibujo (wing: 'big'|'small', stretch: columnas extra, open: descapotable, stripe) }.
   * Marcas y nombres inventados: recuerdan a autos reales sin copiar ninguno.
   */
  const M = (id, brand, model, cat, price, speed, accel, fuel, prestige, desc, art) => ({ id, brand, model, cat, price, speed, accel, fuel, prestige, desc, art: art || {} });
  MV.CAR_CATALOG = [
    // Hiperautos
    M('vellano_sentinella', 'Vellano', 'Sentinella', 'hiperauto', 1100000, 340, 2.8, 22, 98, 'Hiperauto de pista con un alerón gigante. Pega al piso como una ventosa.', { wing: 'big' }),
    M('ardenne_quimera', 'Ardenne', 'Quimera 16', 'hiperauto', 3200000, 420, 2.4, 30, 100, 'Largo, ancho y con 1.500 caballos. Gasta como un avión chico.', { stretch: 3 }),
    M('okami_raijin', 'Okami', 'Raijin', 'hiperauto', 1600000, 355, 2.6, 18, 95, 'Híbrido japonés que suena como una tormenta eléctrica.', { wing: 'small' }),
    M('kaiserwerk_blitz', 'Kaiserwerk', 'Blitz R', 'hiperauto', 1250000, 330, 2.9, 20, 94, 'Precisión alemana, puertas que se abren hacia arriba y un precio que se abre hacia abajo.', { wing: 'small', stretch: 1 }),
    M('fenix_inferno', 'Fénix', 'Inferno V12', 'hiperauto', 2400000, 370, 2.7, 26, 97, 'Rojo de nacimiento. Si lo pintas de otro color se ofende.', { wing: 'big', stretch: 2 }),
    // Deportivos
    M('torino_furia', 'Torino', 'Furia GT', 'deportivo', 210000, 315, 3.4, 16, 85, 'Gran turismo italiano: rápido, hermoso y siempre en el taller.'),
    M('halcon_coupe', 'Halcón', 'Coupé V8', 'deportivo', 95000, 280, 4.1, 14, 70, 'Motor delantero, tracción trasera y cero lugar para el equipaje.', { stripe: true }),
    M('okami_kaze', 'Okami', 'Kaze RS', 'deportivo', 120000, 290, 3.8, 11, 74, 'El favorito de los que tunean: japonés, liviano y con alerón de fábrica.', { wing: 'small' }),
    M('brava_spider', 'Brava', 'Mistral Spider', 'deportivo', 160000, 300, 3.6, 13, 80, 'Descapotable para lucirte en la costanera (y quemarte la cabeza).', { open: true }),
    M('pampa_potro', 'Pampa', 'Potro V8', 'deportivo', 55000, 250, 4.8, 15, 58, 'Músculo americano a la criolla: ruge, derrapa y no dobla.', { stripe: true, stretch: 1 }),
    // Sedanes
    M('fenix_compacto', 'Fénix', 'Compacto', 'sedan', 16000, 175, 11.5, 6, 15, 'Chiquito, barato y estaciona en cualquier lado.', { stretch: -2 }),
    M('okami_sereno', 'Okami', 'Sereno', 'sedan', 24000, 190, 9.8, 6, 25, 'Indestructible. Lo heredarán tus nietos.'),
    M('aurora_familiar', 'Aurora', 'Familiar LX', 'sedan', 28000, 195, 9.5, 7, 28, 'Entra la familia, el perro y la suegra (apretada).'),
    M('torino_berlina', 'Torino', 'Berlina', 'sedan', 34000, 210, 8.2, 7, 35, 'Elegante sin exagerar. El auto de tu dentista.'),
    M('kaiserwerk_500', 'Kaiserwerk', 'Ejecutivo 500', 'sedan', 62000, 250, 5.6, 8, 60, 'Asientos con masajes y gerentes adentro.', { stretch: 1 }),
    // SUV
    M('okami_trekker', 'Okami', 'Trekker', 'suv', 36000, 185, 9.9, 8, 30, 'Para ir al supermercado como si fuera una expedición.'),
    M('aurora_xl', 'Aurora', 'Familiar XL', 'suv', 42000, 190, 9.2, 9, 32, 'Siete asientos y catorce portavasos.'),
    M('tundra_montaraz', 'Tundra', 'Montaraz', 'suv', 48000, 180, 9.0, 10, 40, 'Barro hasta las rodillas y orgullo hasta el techo.'),
    M('kaiserwerk_gelande', 'Kaiserwerk', 'Gelände', 'suv', 140000, 210, 6.0, 14, 78, 'Cuadrado, carísimo y con puertas que cierran como una bóveda.'),
    M('vellano_toro', 'Vellano', 'Toro SUV', 'suv', 230000, 305, 3.6, 15, 88, 'Una camioneta con alma de superdeportivo. Para llevar a los chicos a la escuela a 300.'),
    // Pickups y camionetas
    M('pampa_gaucha', 'Pampa', 'Gaucha', 'pickup', 30000, 170, 11.0, 10, 22, 'Caja amplia y un mate en la guantera.'),
    M('okami_hilo', 'Okami', 'Hilo 4x4', 'pickup', 33000, 175, 10.5, 9, 28, 'No se rompe ni aunque la tires de un edificio (no lo intentes).'),
    M('titan_ranchera', 'Titán', 'Ranchera', 'pickup', 38000, 180, 9.8, 12, 30, 'Para el campo, la obra y la mudanza de todos tus amigos.'),
    M('tundra_mula', 'Tundra', 'Mula HD', 'pickup', 55000, 175, 8.9, 15, 42, 'Remolca un barco, una casa rodante o tu ego.', { stretch: 2 }),
    M('titan_bestia', 'Titán', 'Bestia 6x6', 'pickup', 380000, 160, 7.5, 30, 72, 'Seis ruedas, cero sentido común.', { stretch: 4 }),
    // Eléctricos
    M('volta_chispa', 'Volta', 'Chispa', 'electrico', 35000, 160, 8.0, 0, 30, 'Silencioso, barato de cargar y con aplicación que te reta.', { stretch: -2 }),
    M('okami_zen', 'Okami', 'Zen-E', 'electrico', 40000, 170, 7.4, 0, 32, 'Tan zen que te pide respirar antes de arrancar.'),
    M('volta_rayo', 'Volta', 'Rayo S', 'electrico', 85000, 260, 2.9, 0, 66, 'Acelera más que tu ansiedad. Se maneja solo (a veces mal).'),
    M('volta_cuna', 'Volta', 'Cuña', 'electrico', 70000, 210, 4.5, 0, 55, 'Diseñado con regla y sin ganas. Lo amas o lo odias.', { wing: 'small' }),
    // Clásicos
    M('zorzal_burbuja', 'Zorzal', 'Burbuja 1963', 'clasico', 18000, 115, 22.0, 8, 35, 'Redondito, ruidoso y con olor a nafta y nostalgia.', { stretch: -3 }),
    M('pampa_coupe69', 'Pampa', 'Coupé 1969', 'clasico', 85000, 210, 6.5, 20, 62, 'Músculo de época con franjas de carrera.', { stripe: true }),
    M('torino_gt57', 'Torino', 'Gran Turismo 1957', 'clasico', 320000, 230, 7.0, 18, 86, 'Pieza de museo que todavía arranca (con paciencia).'),
    M('brava_barchetta', 'Brava', 'Barchetta 1961', 'clasico', 650000, 240, 6.8, 17, 92, 'Ganó carreras cuando tu abuelo era joven. Ahora gana subastas.', { open: true }),
    // Motos
    M('halcon_rayo125', 'Halcón', 'Rayo 125', 'moto', 3000, 110, 12.0, 2, 8, 'Para hacer delivery o escapar del tráfico.'),
    M('okami_tsubame', 'Okami', 'Tsubame 600', 'moto', 11000, 250, 3.4, 5, 45, 'Deportiva liviana: te convierte en un rayo con casco.'),
    M('kaiserwerk_boxer', 'Kaiserwerk', 'Bóxer 1250', 'moto', 22000, 220, 3.8, 5, 52, 'Para cruzar continentes y contarlo en todas las cenas.'),
    M('halcon_chopper', 'Halcón', 'Chopper V-Twin', 'moto', 28000, 190, 4.6, 6, 60, 'Cromo, cuero y barba opcional (pero recomendada).'),
    M('torino_saeta', 'Torino', 'Saeta 1000', 'moto', 35000, 300, 2.9, 7, 70, 'Superbike italiana. Hay que firmar un testamento para comprarla.'),
    // Lujo
    M('kaiserwerk_imperial', 'Kaiserwerk', 'Imperial', 'lujo', 150000, 250, 4.9, 11, 76, 'Limusina para los que todavía manejan ellos mismos.'),
    M('windsor_corcel', 'Windsor', 'Corcel', 'lujo', 280000, 280, 4.6, 15, 90, 'Gran turismo británico: madera, cuero y silencio absoluto.'),
    M('windsor_majestad', 'Windsor', 'Majestad', 'lujo', 480000, 250, 5.3, 18, 99, 'Tan lujoso que viene con un paraguas escondido en la puerta.', { stretch: 2 }),
    M('monterrey_presidencial', 'Monterrey', 'Limusina Presidencial', 'lujo', 900000, 200, 8.0, 25, 96, 'Blindada, larguísima y con minibar. El tráfico se abre a tu paso.', { stretch: 6 })
  ];

  /** Piezas de tuneo: costo, puntos de rendimiento y fracción del costo que suma al valor del auto. */
  MV.CAR_TUNES = {
    motor: { name: 'Motor preparado', icon: '🔧', cost: 8000, perf: 12, back: 0.5 },
    llantas: { name: 'Llantas y neumáticos de competición', icon: '🛞', cost: 2500, perf: 5, back: 0.4 },
    pintura: { name: 'Pintura de carreras', icon: '🎨', cost: 1500, perf: 2, back: 0.6 },
    aleron: { name: 'Alerón', icon: '🪽', cost: 3000, perf: 6, back: 0.3 },
    nitro: { name: 'Nitro', icon: '🧯', cost: 5000, perf: 10, back: 0.2 }
  };

  MV.CAR_COLORS = [
    { id: 'rojo', name: 'Rojo', hex: '#d62828' },
    { id: 'azul', name: 'Azul', hex: '#1f5fbf' },
    { id: 'negro', name: 'Negro', hex: '#2b2b2b' },
    { id: 'blanco', name: 'Blanco', hex: '#f2f2ee' },
    { id: 'plata', name: 'Plata', hex: '#a9b0b8' },
    { id: 'amarillo', name: 'Amarillo', hex: '#f6c90e' },
    { id: 'verde', name: 'Verde', hex: '#2e9e44' },
    { id: 'naranja', name: 'Naranja', hex: '#f28c28' }
  ];
})(window.MV = window.MV || {});
