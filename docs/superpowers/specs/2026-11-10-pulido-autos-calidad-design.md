# Parte D — Animaciones, mascotas míticas, autos y calidad de vida — diseño

**Fecha:** 2026-11-10
**Origen:** pedidos del usuario: "alguna animación pequeña para cambios de estado", "poder tener de mascota
al lorax", "modelos de autos de lujo, deportivos, sedán, SUV, pick up, camionetas… pixelados y parecidos a
los de la vida real (un McLaren Senna, un Bugatti Chiron)", "más opciones y mayor calidad de vida".
Respuestas del usuario: animaciones con números flotantes, avatar que reacciona y dinero que cuenta;
las dos versiones de mascotas (un guardián del bosque con un guiño al Lorax y varias criaturas míticas);
autos con modelos por categoría, dibujo pixelado, tuneo y carreras, seguro y choques; calidad de vida en
sus tres sentidos (más cómodo de jugar, vivir mejor en el juego, resúmenes y gráficos); y más opciones.
Orden aprobado: D → B → C.

**Límites de propiedad intelectual (decididos con el usuario):** nada copia personajes ni marcas. El
guardián del bosque es una criatura original cuyo guiño está en la personalidad (pequeño, cascarrabias,
defensor de los árboles), no en el aspecto. Los autos usan nombres inventados que recuerdan a modelos
reales, como hacen los juegos de mundo abierto, y dibujos propios.

## 1. Animaciones de cambios de estado

- **Números flotantes:** al aplicar un resultado (acción, evento o año), por cada estadística que cambió
  sube un "+5 😊" verde o un "−3 ❤️" rojo desde su barra y se desvanece en ~1 s; la barra se llena o
  vacía con su transición y un destello breve del color de su nivel.
- **Avatar que reacciona:** salta si el saldo del cambio es bueno y tiembla si es malo (≈0,5 s); la
  cara ya cambia con el ánimo.
- **Dinero que cuenta:** la cifra de dinero de la tarjeta cuenta desde el valor viejo al nuevo en
  ~0,6 s, en verde o rojo.
- Todo se apaga en **Ajustes → Animaciones** y con la preferencia del sistema "reducir movimiento".

## 2. Mascotas míticas

Especies nuevas marcadas `mythic`: no aparecen en "Adoptar una mascota"; cada una se consigue de una
forma propia, tiene dibujo SVG propio, trucos propios y vida larga.

| Mascota | Cómo se consigue | Qué hace |
|---|---|---|
| Guardián del bosque | Al plantar árboles (actividad nueva, 8 %), en el voluntariado (3 %) o cada año con una reserva natural (10 %) | +1 karma por año mientras tu karma sea ≥ 0; se va ofendido si tu karma baja de −30 o cometes un delito ese año |
| Dragoncito de bolsillo | Un mercader misterioso en un viaje (5 %) te lo ofrece por $50.000 | A veces quema algo (pierdes dinero) o se hace viral (fama) |
| Unicornio gruñón | Una noche, si tu karma es ≥ 60 (3 % por año) | +felicidad; se va si tu karma baja de 40 |
| Fantasma doméstico | Si tienes una casa embrujada (10 % por año) | −estrés (te hace compañía) y asusta a las visitas |

**Gatos callejeros** (pedido del usuario al aprobar el plan): una actividad "Recoger un gato callejero"
(gratis, con un gasto de veterinario de $50 a $150; 12+, y si vives con tus padres pueden decir que no)
con cuatro edades para elegir: gatito (0 años), joven (1 a 3), adulto (4 a 9) y anciano (10 a 15). El
gato llega con un rasgo y una historia de la calle; recoger un anciano da más karma ("nadie adopta a
los viejitos") y su vida restante es corta pero nunca termina el mismo año. Además, un evento: un gato
callejero de edad al azar te sigue hasta casa (adoptarlo, darle de comer o seguir de largo).

## 3. Autos

- **Concesionaria por categorías** (reemplaza el mercado de autos actual): unos 40 modelos en 9
  categorías — hiperautos, deportivos, sedanes, SUV, pickups y camionetas, eléctricos, clásicos, motos y
  lujo. Cada modelo tiene marca y nombre inventados, precio, velocidad máxima, 0 a 100, consumo y
  prestigio. Ejemplos: un hiperauto de pista con alerón gigante (estilo del que pidió el usuario), un
  hiperauto largo de 1.500 CV, un sedán familiar, una pickup de trabajo. La lista se filtra por categoría.
- **Dibujo en pixel art** de cada modelo, a partir de la silueta de su categoría con rasgos propios
  (alerón, largo, altura, techo), en el **color que elijas al comprarlo** (8 colores).
- **Prestigio:** tener un auto de prestigio alto suma un poco de apariencia y fama por año.
- **Tuneo:** motor, llantas, pintura, alerón y nitro; cada uno con costo, suma de rendimiento y de valor.
- **Carreras:**
  - **Callejeras** (18+, licencia de conducir): apuesta; ganas según rendimiento del auto + tuneo +
    azar; riesgo de policía (multa o arresto) y de choque (daño al auto y salud).
  - **En circuito** (licencia de conducir): inscripción y premios; sin riesgo legal.
- **Seguro:** anual (3 % del valor); cubre choques y robos. **Eventos** de choque, multa y robo según
  el auto (los caros se roban más), el alcohol y las carreras callejeras; sin seguro pagas todo.

## 4. Calidad de vida

**Más cómodo de jugar**
- Buscador en Actividades y **favoritos** (⭐) fijados arriba.
- **Avanzar 5 años** (botón junto a "+1 año"): se detiene en cada decisión, en un aviso importante o si
  el personaje muere.
- **3 partidas guardadas** desde el menú (guardar, cargar y borrar cada ranura).
- **Ajustes:** tamaño de letra (normal, grande, muy grande), animaciones (sí o no) y resumen del año
  (sí o no), además del tema que ya existe.

**Vivir mejor en el juego**
- **Bienestar** (0 a 100) en la tarjeta y la ficha: 35 % felicidad, 30 % salud, 20 % calma (100 −
  estrés) y 15 % relaciones (promedio de tus vínculos cercanos), con una palabra: Floreciendo, Bien,
  Regular o Mal.
- **Hobbies con racha:** jardinería, pesca, yoga, cocina, lectura y fotografía; cada año que lo
  practicas la racha sube y baja más el estrés; si un año no lo practicas, la racha vuelve a cero.
- **Vacaciones de descanso** (retiro en un spa): mucho menos estrés y un poco de salud.
- **Rutina anual** en la ficha: ejercicio (ninguno, ligero, intenso) y dieta (libre, equilibrada,
  estricta), que se aplican solas cada año con su costo y sus efectos en salud, apariencia, estrés y
  felicidad.

**Resúmenes y gráficos**
- **Resumen del año:** al avanzar, una tarjeta "Tu año a los N" con lo más importante y cuánto cambió
  cada estadística y el dinero.
- **Gráficos** (SVG) del patrimonio y de las estadísticas a lo largo de la vida, en la ficha y en la
  pantalla de la muerte.

## 5. Más opciones

- **Actividades nuevas:** plantar árboles, hobbies (6), vacaciones de descanso, karaoke, escape room,
  voluntariado en un refugio de animales, clases (baile, idiomas, manejo, cocina), museo, picnic,
  observar las estrellas y un maratón (con Deporte 40+).
- **Una opción más** en los 15 eventos con decisiones que más aparecen (negociar, pedir ayuda o salir
  con humor).
- **Trabajo:** trabajar desde casa (menos estrés, un poco menos de rendimiento), año sabático (dejas el
  trabajo y lo recuperas al año siguiente si te va bien) y capacitarte para un ascenso (costo, más
  rendimiento y más chance de ascenso).

## Partidas guardadas

`MV.VERSION = 6`. Migración v5→v6: historia de estadísticas vacía, hobbies y rutina por defecto,
favoritos vacíos; los autos viejos siguen siendo autos (sin modelo, sin tuneo, sin seguro) y se dibujan
con la silueta de su tipo.

## Pruebas

Node por bloque (mascotas míticas y sus condiciones, catálogo de autos, tuneo, carreras, seguro y
eventos, bienestar, hobbies y racha, rutina, resumen del año, historia para gráficos, ranuras de
guardado, migración v5→v6); la prueba de interfaz recorre números flotantes, dinero que cuenta,
concesionaria con dibujo y color, buscador y favoritos, avanzar 5 años, ranuras, ajustes y gráficos;
barrido de 1.000 vidas sin errores ni textos rotos.
