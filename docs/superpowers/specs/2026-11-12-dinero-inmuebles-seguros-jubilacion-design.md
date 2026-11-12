# Parte C2 — Dinero: inmuebles, seguros, jubilación y dinero sucio — diseño

**Fecha:** 2026-11-12

**Origen:** segunda mitad de la Parte C de la hoja de ruta: "dinero (inmuebles, seguros y jubilación, dinero sucio)".

**Respuestas del usuario:**
- Las 4 áreas, con detalle **liviano**.
- **Dinero sucio:** va a una bolsa aparte y hay que lavarlo para gastarlo.
- **Jubilación:** de 55 a 70 años, con pensión según lo aportado.
- **Inmuebles:** los 4 tipos nuevos (locales, terrenos, edificios y casas de vacaciones) y alquiler en **tres niveles**.
- **Enfoque aprobado:** un módulo por tema siguiendo el patrón del juego, con los eventos en su propio archivo.

**Límites:**
- Personas, negocios y empresas inventados.
- Humor negro sin contenido explícito.
- Textos en español con concordancia de género.

## 1. Inmuebles

**Tipos de propiedad.** A las casas de hoy (`type: 'casa'`) se suman 4 tipos, cada uno con su listado en "Comprar":

| Tipo (`type`) | Ícono | Precio | Renta | Mantenimiento al año |
|---|---|---|---|---|
| `local` (Local comercial) | 🏪 | $120.000–$900.000 | 1,5 × la de una casa | 1 % del valor |
| `terreno` | 🌾 | $25.000–$400.000 | No se alquila | 0,2 % |
| `edificio` (Edificio de departamentos) | 🏢 | $1.200.000–$6.000.000 | 6 unidades (ver abajo) | 1,5 % |
| `vacaciones` (Casa de vacaciones) | 🏖️ | $150.000–$1.500.000 | Por temporada (ver abajo) | 1 % |

- **Variantes con nombre** (en `js/data/realty.js`, como `MV.HOUSES`):
  - local: "Local en esquina", "Local en galería", "Local frente a la plaza";
  - terreno: "Terreno en las afueras", "Lote con vista", "Terreno junto a la ruta";
  - edificio: "Edificio de 6 departamentos", "Edificio con portero";
  - vacaciones: "Cabaña en la playa", "Casa en las sierras", "Bungalow junto al lago".
- **Compra:** como las casas: contado o hipoteca, desde los 18. Solo una `casa` puede ser tu hogar; los tipos nuevos nunca lo son.
- **Valor:** cambia cada año como el de las casas (`−4 % a +8 %` más la noticia del mundo) más el **mercado inmobiliario**. Los
  terrenos ganan además entre 2 % y 6 % extra al año.

**Mercado inmobiliario.**
- `g.realty = { phase, left }`. Las fases son `auge` (+6 % al año), `estable` (0) y `caida` (−6 %), y cada una dura de 2 a
  5 años. Al terminar sale otra al azar (no repite).
- Se ve en Bienes: "📈 Mercado inmobiliario: en auge", "➖ estable" o "📉 en caída".

**Alquiler en tres niveles.** Se puede alquilar una casa que no sea tu hogar, o un local:

| Nivel | Renta al año (casa) | Año sin inquilino | Puntual | Cuidadoso | Moroso | Fiestero |
|---|---|---|---|---|---|---|
| barato | 3,5 % del valor | 0 % | 40 % | 35 % | 10 % | 15 % |
| normal | 4,5 % | 5 % | 35 % | 25 % | 20 % | 20 % |
| caro | 6 % | 20 % | 25 % | 15 % | 35 % | 25 % |

- **Datos:** la propiedad guarda `rent: { level, tenant: { name, kind } | null }`.
- **Locales:** la renta es 1,5 veces la de la tabla.
- **Inquilino:** al alquilar, o cuando el anterior se va, llega uno de inmediato.
  - En una casa es una **persona** con nombre del país del jugador.
  - En un local es un **negocio** inventado de una lista ("Pizzería La Tía Coca", "Peluquería Tijeras Locas", "Ferretería
    El Tornillo Feliz", "Yoga Zen Total", "Mascotas y Más", "Panadería Doña Miga", "Lavadero Burbujas", "Kiosco El
    Insomne", "Verdulería Lechuga Feliz" y "Taller Tuerca Loca"; son 10 en total).
- **Tipos de inquilino:**
  - 😇 **Puntual:** siempre paga.
  - 🐌 **Moroso:** con 40 % de chance al año no paga, y se dispara la decisión `inquilino_no_paga`.
  - 🎉 **Fiestero:** paga, pero con 30 % de chance al año rompe algo y se dispara `inquilino_rompe`.
  - 🧹 **Cuidadoso:** la propiedad se desgasta la mitad.
- **Cambiar el nivel** se puede una vez por año. El inquilino actual se queda, y desde el año siguiente paga el nuevo
  nivel.
- **Dejar de alquilar** saca al inquilino.

**Edificio.**
- Tiene 6 unidades y un solo nivel de alquiler para todo el edificio.
- Cada año, cada unidad queda vacía con chance 2 % (barato), 8 % (normal) o 25 % (caro).
- Las ocupadas no pagan con chance 10 %, 15 % o 25 %.
- Renta = valor × 5 % ÷ 6 × unidades que pagan × factor de nivel (barato 0,8; normal 1; caro 1,3).
- Las unidades no tienen nombre. El diario cuenta "4 de 6 departamentos pagaron".

**Casa de vacaciones.**
- Se alquila por temporada: cada año rinde valor × entre 0 % y 12 %.
- **"Veranear ahí"** (1 por año): +6 de felicidad y −8 de estrés, y ese año rinde la mitad.

**Terreno: construir.**
- **"Construir una casa":** cuesta 1 × el valor del terreno, y el terreno pasa a ser una `casa` "Casa en tu terreno" que
  vale 2,2 × el valor anterior, en condición 100.
- **"Construir un local":** cuesta 1,2 × el valor, y pasa a ser un `local` que vale 2,5 × el valor anterior.

**Eventos de inquilinos** (en `js/data/events/dinero.js`):

1. **`inquilino_no_paga`:** el moroso no paga.
   - **Esperar:** mitad y mitad: al año siguiente paga el doble, o nada.
   - **Desalojarlo:** $3.000 de abogado, el inquilino se va y la propiedad queda vacía ese año.
   - **Perdonarlo:** +3 de karma; 50 % de que pase a puntual.
2. **`inquilino_rompe`:** el fiestero rompe algo. La reparación cuesta el 5 % del valor.
   - **Cobrarle:** 70 % paga; 30 % se va enojado.
   - **Pagarlo tú:** pagas la reparación.
   - **Usar el seguro de hogar** (solo si la propiedad está asegurada): no pagas nada.
   - Si nadie paga, la condición baja 15.
3. **`inquilino_compra`:** te ofrece comprar la propiedad a valor × 1,05.
   - **Vender:** se vende y cobras.
   - **No vender.**
4. **`inquilino_se_va`** (aviso): se va y llega otro.

## 2. Seguros

Los datos se guardan en `p.insurance = { vida: 0, salud: false, hogar: {} }` (`hogar` es `{ [idPropiedad]: true }`). Se
contratan desde los 18 años.

| Seguro | Opciones | Prima al año | Cubre |
|---|---|---|---|
| 💀 Vida | Suma de $100.000, $500.000 o $2.000.000 | suma × (0,002 + edad/10.000), × 2 con salud < 40 | Al morir, la suma se reparte entre los herederos además de la herencia |
| 🏥 Salud | Sí o no | $1.500 + edad × $40 | Los tratamientos médicos cuestan el 20 % |
| 🏠 Hogar | Por propiedad | 0,3 % del valor de esa propiedad | Robos en tu casa, incendio o inundación y destrozos de inquilinos |

- **Primas:** se cobran con los gastos del año. Si no alcanza la plata, la póliza se cancela con un aviso en el diario.
- **Vida:** con salud < 20 ninguna aseguradora la vende ("Ninguna aseguradora te quiere: dicen que eres un riesgo con
  patas").
- **Robo en casa** (`robo_casa`): si tu hogar está asegurado, el seguro devuelve lo robado y lo dice en el resultado.
- **Desastre en una propiedad** (evento nuevo `desastre_hogar`, aviso, peso bajo):
  - ocurre en una propiedad al azar: incendio, inundación o "el árbol del vecino";
  - la condición baja 40 y la reparación cuesta el 10 % del valor;
  - si la propiedad está asegurada, no pagas nada.

## 3. Jubilación

- **Ahorro previsional.**
  - Guardas `p.pensionFund` (el fondo) y `p.pensionRate` (el aporte: 0; 0,05; 0,10 o 0,15).
  - Cada año, con cualquier trabajo y sin estar jubilado, se aporta `sueldo × aporte`, que se descuenta del dinero.
  - El fondo crece entre 1 % y 6 % al año.
  - El aporte se elige en Ocupación.
- **Edad de retiro.**
  - "Jubilarte" pasa a estar disponible desde los 55 años (hoy es desde los 60).
  - **Factor por edad:**
    - antes de los 65: `1 − (65 − edad) × 0,03`, que da 0,70 a los 55 y 0,85 a los 60;
    - desde los 65: `1 + (min(edad, 70) − 65) × 0,04`, que da 1,20 a los 70 o más.
  - **Pensión:** `base × factor + renta del fondo`.
    - `base` es la cuenta de hoy: sueldo × 0,25, 0,45 o 0,65 según los años trabajados.
    - La renta del fondo es `fondo ÷ max(10, 85 − edad)`, y el fondo se vacía al jubilarte.
- **Sin trabajo, desde los 55 y con fondo:** "Retirarte con tu ahorro" te jubila con pensión igual a la renta del fondo.
- **Sacar el fondo antes de jubilarte:** cobras el 70 %; el resto se pierde.
- **Patrimonio:** el fondo suma al patrimonio y, al morir, a la herencia.

## 4. Dinero sucio

**Origen.**
- Va a `p.dirty`, no a `p.money`:
  - lo que dan los delitos (`MV.sys.crime`);
  - los encargos de la mafia;
  - los sobornos del político ("Aceptar un sobre").
- Los resultados lo dicen: "…conseguiste $X (dinero sucio)".
- **No suma** al patrimonio ni a los logros de dinero hasta lavarlo.
- No se puede gastar. En Bienes se ve "🧺 Dinero sucio: $X".

**Lavar dinero.** Es una acción en Bienes con 4 métodos. Cada método se usa una vez por año y lava hasta su límite:

| Método | Requisito | Límite por vez | Comisión | Riesgo |
|---|---|---|---|---|
| 🏪 Tu negocio o empresa | Tener negocio o empresa propia | $50.000 por negocio o empresa | 10 % | 5 % |
| 🎰 Casino | — | Todo | 25 % | 10 % |
| 🧮 Contador "creativo" | — | $200.000 | 20 % | 15 % |
| 🏘️ Compra y venta de un inmueble | — | $500.000 | 15 % | 20 % |

- Lo lavado, menos la comisión, pasa a `p.money`.
- Si sale el riesgo, se dispara la investigación.

**Investigación** (`investigacion_lavado`, decisión).
- **Cuándo:** cada año, con `p.dirty > $50.000`, hay chance `min(0,35, sucio / 1.000.000)` de que se abra. También se abre
  cuando un lavado sale mal.
- **Opciones:**
  - **Contratar un abogado:** $20.000. Con 60 % se archiva; con 40 % hay decomiso de todo el sucio y una multa del 20 %
    del dinero limpio.
  - **Confesar:** decomiso de todo el sucio y prisión por "Lavado de dinero", 2 años.
  - **Huir:** te vuelves prófugo, como en los delitos de hoy, y conservas el sucio.

**Al morir:** el dinero sucio no se hereda. El diario dice "La policía encontró $X escondidos".

## 5. Interfaz

- **Bienes:**
  - Línea del mercado inmobiliario.
  - "Comprar" ofrece casas, locales, terrenos, edificios y casas de vacaciones.
  - **Ficha de cada propiedad alquilable:**
    - nivel de alquiler (barato, normal o caro) con su renta;
    - inquilino con ícono, nombre y tipo, o "Vacía";
    - acciones: alquilar, dejar de alquilar, cambiar nivel y asegurar o quitar el seguro de hogar.
  - **Terreno:** "Construir una casa" y "Construir un local".
  - **Casa de vacaciones:** "Veranear ahí".
  - **"Seguros":** vida (elegir la suma o cancelar) y salud (contratar o cancelar), cada uno con su prima.
  - **"Dinero sucio"** (solo si hay): el monto y "Lavar dinero", que lista los métodos disponibles.
- **Ocupación, caja "Jubilación":**
  - fondo, aporte (0, 5, 10 o 15 %) y pensión estimada si te jubilaras hoy;
  - "Retirarte con tu ahorro" (sin trabajo, 55+) y "Sacar el fondo (−30 %)".
- **Ids para las pruebas:** `#realty-market`, `#insurance`, `#dirty-money` y `#pension-box`.

## 6. Partidas guardadas

- `MV.VERSION` pasa a 9. Migración v8 → v9:
  - `p.dirty = 0`;
  - `p.insurance = { vida: 0, salud: false, hogar: {} }`;
  - `p.pensionFund = 0` y `p.pensionRate = 0`;
  - `g.realty = { phase: 'estable', left: 3 }`.
- Cada casa ya alquilada (`rented: true`) recibe `rent: { level: 'normal', tenant }` con un inquilino nuevo. `rented` se
  mantiene como marca.

## 7. Pruebas

- **Inmuebles:**
  - Los 4 tipos se listan, se compran y nunca pasan a ser tu hogar.
  - Renta por nivel y tipo, y años vacíos según la tabla (con semillas).
  - Inquilinos por nivel según las proporciones.
  - El edificio y la casa de vacaciones rinden según su regla, y "Veranear" reduce la renta a la mitad.
  - Construir en un terreno lo convierte con el valor indicado.
  - El mercado alterna fases y mueve los valores.
  - Los 4 eventos de inquilinos hacen lo que dicen.
- **Seguros:**
  - Primas exactas.
  - Cancelación por falta de dinero.
  - Salud cobra el 20 % del tratamiento.
  - Hogar devuelve lo robado y paga el desastre y los destrozos.
  - Vida suma la herencia de los herederos, y no se vende con salud < 20.
- **Jubilación:**
  - Aportes, crecimiento del fondo y factor por edad (55 → 0,70; 60 → 0,85; 65 → 1; 70 → 1,2).
  - Pensión con fondo, retiro con ahorro y penalidad del 30 %.
  - No se puede jubilar antes de los 55.
- **Dinero sucio:**
  - Delitos, encargos y sobornos suman a `p.dirty` y no a `p.money`, y no suman al patrimonio.
  - Cada método respeta su límite, comisión y requisito.
  - La investigación se abre según la chance, y sus tres opciones hacen lo que dicen.
  - El sucio no se hereda.
- **Migración v8 → v9.**
- El jugador automático juega vidas sin errores.
- **Humo con navegador:** Bienes muestra mercado, seguros y dinero sucio; la ficha de una casa alquilada muestra al
  inquilino; Ocupación muestra la jubilación.
- **Suite completa:** `node --test tests/*.test.js` y `node tests/ui-smoke.js`.

## 8. Fuera de alcance

- Mascota nueva: el gato que habla queda como propuesta aparte.
- Hipotecas nuevas o refinanciar.
- Impuestos a la propiedad.
- Edificios con inquilinos individuales con nombre.
- Seguro de auto (ya existe).
- Una agencia de lavado propia.
