# Interfaz A — "El cuaderno, mejorado" — diseño

**Fecha:** 2026-11-11
**Origen:** de las tres versiones de `docs/interfaz/prompts-figma.md`, el usuario eligió la A ("es la que más me
gustó") y aprobó el diseño en Figma: https://www.figma.com/design/0OerMNOffrKvA4EnYNkrVP (página "Interfaz A":
pantalla principal, decisión, actividades, muerte, hoja de estilo y 8 componentes). Pedido: llevarla al juego
"manteniendo todo lo que ya funciona".

**Límites:** solo cambia la capa visual (`css/styles.css` y `js/ui/*`), más un campo opcional en las opciones de los
eventos (§5). El motor, el guardado y la versión de las partidas (7) no cambian. Textos en español con concordancia
de género.

## 1. Objetivo y criterio de éxito

En un celular de 390 × 844, las 4 pantallas del juego se ven como en Figma: carnet y panel de estadísticas como
tarjetas flotantes con sombra dura, el dinero como etiqueta pegada, diario con resaltadores, barras con colores de
semáforo, tarjetas de decisión con clip, hojas con agarradera y la lápida con pasto. El resto de la interfaz (portada,
creación, fichas, menús, minijuegos) usa los mismos colores, bordes y sombras para que nada desentone. Todo lo que
hoy funciona (botones, atajos, animaciones, modo oscuro, tamaño de letra, prueba de humo) sigue funcionando.

## 2. Enfoque

**Elegido: rediseño en el lugar.** Se reescriben las variables y las reglas de `css/styles.css`, y se agregan unos
pocos elementos en el DOM donde el diseño los necesita (agarradera, resaltadores, subtítulo de opción, pasto,
botón "Continuar"). Los nombres de clases, ids y atributos `data-*` actuales se mantienen, porque la prueba de humo
y las animaciones dependen de ellos.

Descartados:
- **Un tema nuevo elegible junto al actual.** Habría que mantener dos estilos para siempre.
- **Reescribir los renderizadores como componentes, igual que en Figma.** Mucho cambio de código para el mismo
  resultado visual, con riesgo de romper flujos que hoy andan.

## 3. Variables de estilo

Valores tomados de la hoja de estilo de Figma. Claro = "cuaderno"; oscuro = "pizarrón" (lo pide el prompt A).

| Variable | Claro | Oscuro | Uso |
|---|---|---|---|
| `--paper` | `#fffdf7` | `#1e2a26` | Fondo de hoja |
| `--grid` | `#dbe6f6` | `#283832` | Cuadrícula de 22 px |
| `--margin` | `#f2a0a6` | `#ff8080` (60 %) | Margen rojo |
| `--card` | `#ffffff` | `#25332e` | Tarjetas, listas, campos |
| `--ink` | `#1f3a93` | `#eef1e8` | Tinta, bordes, texto |
| `--copy` (nueva) | `#26345f` | `#dfe5dc` | Texto largo de las tarjetas |
| `--pencil` | `#5b6270` | `#a3afa6` | Notas y subtítulos |
| `--hl-yellow` / `--hl-green` / `--hl-pink` / `--hl-blue` | `#ffe066` / `#b8f2a0` / `#ffb3c7` / `#a8d8ff` | los oscuros actuales | Resaltadores |
| `--on-hl` | `#1b2a5e` | `#1b211e` | Texto sobre resaltador |
| `--lvl-lo` / `--lvl-mid` / `--lvl-hi` (nuevas) | `#e25c5c` / `#f0b429` / `#3fae5a` | `#ff8a80` / `#f2c14e` / `#6fd08a` | Barras < 40 / 40–70 / > 70 |
| `--stone` (nueva) | `#eef0f4` | `#34433d` | Lápida |
| `--hard` (nueva) | `#1f3a93` | `#0f1714` | Color de las sombras duras |

Formas:
- **Esquinas apenas irregulares:** tarjetas grandes `16px 11px 17px 10px`; cajas, listas y botones
  `13px 9px 14px 8px`; barras `8px 4px 8px 5px`.
- **Sombras duras sin desenfoque:** `3px 4px 0 var(--hard)` en tarjetas y `2px 3px 0` en mosaicos y etiquetas.
- **Bordes:** 2 px de tinta.
- **Letras:** las de ahora, Shantell Sans (títulos, 700–800) y Atkinson Hyperlegible (texto). Ya se cargan en
  `index.html`.

## 4. Pantalla principal

- **Carnet (`.idcard`):**
  - Deja de ser una franja de borde a borde. Pasa a ser una tarjeta flotante con 12 px de margen, borde, esquinas
    irregulares y sombra dura.
  - Sigue fija arriba. Detrás lleva una franja de papel liso que se desvanece hacia abajo, para que el diario no se
    lea a través del hueco.
  - Avatar de 56 px con borde, nombre en Shantell 800 (1,25 rem, una línea con "…") y debajo "edad, ocupación
    bandera".
- **Dinero (`.money`):**
  - Es una etiqueta pegada sobre el borde superior del carnet: 13 px arriba del borde, a 46 px de la derecha.
  - Lleva giro de 3°, borde de 1,5 px y sombra dura de 2 px.
  - Es verde si es positivo y rosa si es negativo. Las animaciones de conteo siguen igual.
- **Diario:**
  - Mantiene el margen rojo y la sangría de 58 px. Las entradas van a 0,9375 rem con interlineado 1,38.
  - El encabezado del año es "N años" en Shantell 800 con resaltador rosa en la mitad inferior, más el año
    calendario en gris. Los años anteriores llevan el rosa al 45 %; el actual, pleno.
  - **Entradas buenas:** el texto lleva resaltador verde (reemplaza al subrayado ondulado).
  - **Entradas malas:** el texto lleva resaltador rosa (reemplaza al círculo detrás del emoji).
- **Panel de estadísticas (`.stats`):**
  - Tarjeta flotante como el carnet, fija sobre la barra inferior con 20 px de aire. Lleva un trozo de cinta
    amarilla en la esquina superior izquierda.
  - Muestra las 4 estadísticas en 2 × 2 (4 en fila desde 700 px, como ahora). Cada barra mide 12 px, tiene fondo de
    tarjeta y se rellena con `--lvl-*` según `MV.barLevel`.
  - El valor va en Shantell 800.
  - **Chips** en una sola fila si entran, a 0,72 rem:
    - Bienestar: verde si el puntaje es 60 o más ("Bien" o "Floreciendo"), rosa si es menos de 40.
    - Los demás chips, como ahora.
- **Barra inferior (`.nav`):**
  - Mide 92 px. Los íconos van a 24 px y las etiquetas a 0,75 rem.
  - El botón **+1 año** mide 88 px, sobresale 24 px, va girado −6° y lleva sombra dura. Sigue con su estado
    "¡! evento".
  - La píldora **⏩ 5** se apoya sobre el borde, a la derecha del botón.

## 5. Tarjeta de evento (decisión)

Aplica a todas las tarjetas de `UI.card`: eventos, resultados, resumen del año y confirmaciones.

- **Tarjeta:** borde, esquinas `18px 12px 19px 13px` y sombra dura de `4px 5px`. Un **clip** gris (22 × 46 px)
  asoma arriba a la derecha y reemplaza las dos cintas actuales.
- **Ilustración:** marco con borde y esquinas irregulares, sobre fondo de tarjeta. Mantiene la proporción actual
  (no se recorta).
- **Título:** Shantell 800 a 1,55 rem, con el texto sobre resaltador amarillo. El texto del evento va a 1 rem en
  `--copy`.
- **Opciones (`.choice`):** fondo de tarjeta, borde, esquinas irregulares y sombra dura de 3 px. Al pasar el mouse
  se pintan de amarillo. Al tocarlas se hunden 2 px.
- **Subtítulo opcional:**
  - Una opción puede definir `sub` (texto o función, como `t`, con las mismas plantillas `{o}`, etc.).
  - `MV.EV.view` lo devuelve como `sub`, y la interfaz lo muestra debajo, en gris y más chico.
  - Solo se agrega a la **Inspección fiscal** (evento `auditoria`):
    - Pagar todo en regla: "Pagas las diferencias y dormirás tranquil{o}".
    - Contador "creativo": "Puede salir muy bien… o muy mal".
    - Colchón: "Una moneda al aire con tu plata".
    - Plan de pagos: "En cómodas cuotas".
  - El resultado "Dormirás tranquilo." pasa a "tranquil{o}" con concordancia.
  - Los demás eventos pueden sumar subtítulos más adelante.

## 6. Hojas inferiores (Actividades y todas las demás)

- **Hoja:** papel cuadriculado, esquinas superiores de 22 px y borde de tinta arriba y a los costados.
- **Encabezado:** arriba va una **agarradera** (46 × 5 px, gris). El encabezado deja de ser una franja blanca con
  línea: el título ("🎲 Actividades") va sobre el papel, en Shantell 800 a 1,5 rem, con ‹ volver y ✕ cerrar de
  44 px.
- **Buscador y campos de texto (`.act-search`):** fondo de tarjeta, borde y esquinas irregulares. El buscador lleva
  "🔎 Buscar actividad…".
- **Títulos de sección:** Shantell 800.
- **Listas:** tarjeta con borde y esquinas irregulares, y separadores punteados como ahora. La estrella de favorita
  sigue siendo dorada.
- **Mosaicos de categoría (`.cat`):**
  - Miden 86 px de alto como mínimo, con emoji de 1,9 rem, esquinas irregulares y sombra dura de `2px 3px`.
  - Llevan un tinte de fondo que rota amarillo, verde, rosa y celeste: el resaltador al 25 % sobre la tarjeta, así
    funciona también en oscuro.

## 7. Pantalla de muerte

Orden nuevo, como en Figma, sin quitar nada:
1. **Lápida:**
   - Piedra `--stone` de unos 260 px de ancho, arco arriba, borde de 2,5 px y sombra dura.
   - Dentro van "Aquí yace" (Shantell, gris), el nombre en Shantell 800 y "nacimiento – muerte · N años".
   - Abajo va el avatar de 62 px con los ojos en cruz y **en color**: dentro de la lápida no se aplica el gris
     que usa `.avatar.dead`.
2. **Pasto:** franja verde rayada de 300 px pegada a la base de la lápida.
3. **Causa y epitafio:**
   - "Murió por *causa*." con la causa sobre resaltador rosa.
   - El epitafio sigue debajo, en cursiva.
4. **Veredicto:** caja con emoji grande, nombre en Shantell y su texto, con sombra dura.
5. **Gráficos de la vida:** los de ahora, con el título "💰 Tu vida en gráficos", dentro de una caja.
6. **Herederos** ("👪 Continuar la dinastía"):
   - Cada heredero es una fila con avatar de 38 px, nombre, parentesco y edad.
   - A la derecha va una píldora amarilla **Continuar** con sombra dura. La fila entera sigue siendo el botón.
   - Si el texto no entra, se parte en dos líneas.
7. **El resto, en el mismo orden de ahora:** la caja de datos (patrimonio, ocupación…), copiar o compartir, logros,
   los botones finales y el diario completo.

## 8. El resto de la interfaz

Con las mismas variables:
- Cajas (`.box`), botones (`.btn`, ya con sombra dura), campos (`.input`, `.select`) y botones segmentados.
- Toasts, logros, árbol familiar, chips de filtro, etiquetas y deltas.
- La portada (el cuaderno de la portada ya usa sombra dura).

Ninguna pantalla cambia de estructura fuera de las de §4–§7.

## 9. Accesibilidad

- **Tamaño táctil:** todos los botones miden 44 px o más; los íconos del carnet y de las hojas pasan de 40 a 44 px.
- **Contraste AA del texto en claro y oscuro:**
  - `--pencil` sobre `--paper` ≈ 6:1.
  - Tinta sobre cualquier resaltador ≥ 6:1 (rosa 6,0; celeste 6,7; verde 7,8; amarillo 7,9).
- **Barras:** además del color tienen borde, número y `role="meter"` (como ahora).
- **Resaltadores de entradas buenas y malas:** acompañan al emoji, que ya indica el tono.
- **Movimiento reducido:** se sigue respetando `prefers-reduced-motion`.
- **Tamaño de letra:** los tamaños van en `rem`, para que el ajuste de letra grande siga funcionando.

## 10. Lo que no cambia

- El motor y los datos, salvo `sub` en `MV.EV.view` y en el evento `auditoria`.
- Las partidas guardadas.
- `MV.VERSION`.
- La lista de scripts de `index.html`.
- Los nombres de clases, ids y `data-*` existentes.
- El comportamiento de capas, hojas, atajos y animaciones.

## 11. Pruebas

- **Lógica (Node):**
  - `MV.EV.view` devuelve `sub` con la plantilla aplicada y concordancia de género.
  - Las opciones sin `sub` no lo traen.
  - Los textos de `auditoria` no contienen "undefined", "NaN" ni llaves sin reemplazar.
- **Humo con Playwright (`tests/ui-smoke.js`, 390 × 844):** se agregan comprobaciones de estilo calculado. Las que
  ya existen se mantienen.
  - El carnet y el panel tienen sombra dura y no ocupan el ancho completo.
  - La etiqueta de dinero sobresale del carnet.
  - El color de cada barra coincide con su nivel.
  - La hoja de Actividades tiene agarradera y mosaicos con tinte.
  - La tarjeta de la Inspección fiscal muestra subtítulos.
  - La lápida tiene pasto y los herederos muestran la píldora "Continuar".
  - En modo oscuro (`data-theme="dark"`) el papel es el del pizarrón.
  - Sin errores de consola.
- **Revisión visual:** capturas de las 4 pantallas en claro y oscuro, comparadas a ojo contra Figma.
- **Suite completa:** `node --test tests/*.test.js` y `node tests/ui-smoke.js` en verde.

## 12. Fuera de alcance

- Subtítulos para el resto de los eventos.
- Cambios de contenido o de reglas del juego.
- Reemplazar emojis por íconos dibujados.
- Una versión para escritorio distinta: se mantiene la columna de 620 px de ahora.
