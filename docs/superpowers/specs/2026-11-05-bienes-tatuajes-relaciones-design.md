# Mil Vidas — Barras, tatuajes, casas, relaciones, avatares y deporte (spec)

Fecha: 2026-11-05 · Estado: aprobado por el usuario (diseño en el chat)

## Lo que pidió el usuario
1. Barras de color junto a los porcentajes: rojo < 40, amarillo 40–70, verde 71–100.
2. Tatuaje como minijuego de dibujo, con efectos y álbum.
3. Mejoras en las casas (piscina, sauna, cancha de tenis…) que suban o bajen el valor, y
   vender eligiendo el precio.
4. Más acciones con la pareja y las relaciones.
5. Elegir con quién viajar (o ir solo).
6. Avatares mejorados.
7. Regalos con un menú desplegable de muchos objetos de distintos valores.
8. En el deporte: buscar un equipo mejor (sueldo o categoría) hasta ser campeón; volver del retiro.

## Decisiones
- Tatuaje: trazos a mano alzada guardados como puntos 0–100 (no PNG). Se califican y afectan
  Apariencia/Felicidad/Arte; álbum de hasta 12 en la ficha; láser para borrar.
- Mantenimiento de bienes: se muestra (anual por bien y en el balance); no se cambian los costos.
- Todo en el motor (sin DOM) para poder probarlo en Node; la interfaz solo dibuja.

## 1. Barras
- `UI.bar` usa umbrales 40/70 (antes 33/66) en todas las barras.
- Barra de estado en: mercado de casas/autos/lujos, lista de bienes y ficha del bien.
- Función pura `MV.barLevel(pct)` → `'lo' | 'mid' | 'hi'` (probada en Node).

## 2. Minijuego del tatuaje (`js/systems/tattoo.js`, `js/ui/tattoo.js`)
- Tatuadores: garaje ($150, temblor alto, 15% infección), estudio ($800, temblor bajo),
  artista famoso ($5.000, suaviza y mejora la nota).
- Lugares: brazo, espalda, pierna, cuello, cara (efecto ×1,6; flag `tatuajeCara` resta 0,08 en
  entrevistas).
- Lienzo: 6 tintas, 3 grosores, deshacer, borrar, plantillas para calcar (corazón, ancla,
  calavera, estrella) y sello de texto ("Mamá" o el nombre de la pareja).
- Formato: `{strokes:[{c, w, pts:[x,y,...]}], texts:[{t, x, y, c}]}`, puntos enteros 0–100,
  máximo 900 puntos por tatuaje (se simplifica al guardar).
- Nota 0–100 (`MV.sys.tattoo.score`): cobertura (celdas 10×10 tocadas), variedad de colores,
  cantidad de trazos, prolijidad (trazos muy cortos/caóticos restan), habilidad Arte y tatuador.
  Vacío → nota 0 y el tatuador se niega a cobrar.
- Efectos: Apariencia −6…+6 y Felicidad −4…+8 según la nota; Arte +1…+3; comentario con humor.
- Álbum: `p.tattoos` (máx. 12). Láser: $1.500, Felicidad −4, quita el tatuaje.
- Evento: si hay tatuaje con el nombre de una ex pareja → tapar (minijuego) o láser.
- El tatuaje en el cuello se ve en el avatar.

## 3. Casas: mejoras y venta con precio propio (`js/systems/money.js`, `js/data/world.js`)
- 14 mejoras con: costo fijo + % del valor, fracción del costo que suma al valor, mantenimiento
  anual, requisitos (casa vs. departamento; solo mansiones), efectos anuales si es tu hogar.
- Quitar una mejora: costo de demolición y el valor baja lo que había sumado.
- Alquiler a inquilinos considera el valor (con mejoras).
- Venta de cualquier bien con precio pedido (−20%…+50% del estimado): un comprador tiene una
  disposición a pagar ≈ estimado × azar (más si tiene mejoras "deseables"). Si el pedido ≤
  disposición → se vende al pedido; si no → contraoferta (evento con aceptar/rechazar).
- Transparencia: mantenimiento anual por bien en su ficha; el balance del año separa
  "mantenimiento de bienes".

## 4. Relaciones y pareja (`js/systems/rels.js`)
~18 acciones nuevas por tipo (pareja/cónyuge, familia, amigos, hijos, mayores), cada una con
límite anual, efectos en relación/estadísticas y textos con humor. "Mudarse juntos" activa
gastos compartidos; "Renovar votos" requiere cónyuge y dinero.

## 5. Viajes con compañía (`js/data/activities.js`, ejecutor de acciones)
- Las acciones admiten un segundo paso `opts2(g, opt)` y `run(g, opt, opt2)`.
- Vacaciones: destino → compañía (solo, pareja, familia, amigos vivos y de edad adecuada).
  Con compañía: doble costo, relación +8…+18, anécdota compartida. Solo: más chance de conocer
  gente.

## 6. Avatares (`js/ui/avatar.js`)
- 9 peinados, 3 barbas (bigote, candado, completa), expresiones de 5 niveles (lágrimas,
  sonrisa con dientes), ropa por ocupación (médico, policía, chef, deportista con número,
  presidente, presidiario, piloto con casco, estudiante con uniforme), accesorios (auriculares
  gamer, gorra de graduación, piercing, lentes de sol si fama ≥ 60), tatuaje de cuello.
- Compatibilidad: los aspectos viejos (`style` 0–4) siguen dibujándose.

## 7. Regalos (`js/data/gifts.js`)
- ~35 regalos en grupos por precio, con `likes` (rasgos y franjas de edad que los aman o
  rechazan). El efecto en la relación depende del valor relativo al dinero de la persona y de si
  le gusta. Algunos regalos tienen efecto especial (cachorro crea una mascota para el NPC, viaje
  sorpresa sube felicidad).
- UI: hoja con `<select>` agrupado (`<optgroup>`), vista previa (precio y "le va a encantar /
  no es lo suyo") y botón Regalar.

## 8. Deporte: buscar equipo y volver del retiro (`js/systems/sports.js`)
- Acción "Buscar equipo / escudería / patrocinador" (1 por año) para todos los deportes: genera
  3–4 ofertas: misma categoría con mejor sueldo, y la categoría superior si el nivel ≥ umbral−5
  (chance creciente). Elegir una → cambia club, categoría y sueldo.
- Volver del retiro: prueba abierta permitida si fuiste profesional de ese deporte y tu edad es
  menor al retiro obligatorio (empieza en categoría 1).

## Migración
- `MV.VERSION` 3: `p.tattoos = []`, `a.upgrades = []` en casas, `look.beardStyle`.

## Pruebas
- Nuevas: `barLevel`; tatuajes (nota de vacío/simple/rico, tamaño de guardado, efectos, láser);
  mejoras (requisitos, valor, quitar, efectos anuales, alquiler); venta con precio propio y
  contraoferta; regalos (catálogo, gustos, efectos); viajes con compañía; buscar equipo
  (ofertas y ascenso hasta la cima); volver del retiro; migración v2→v3; avatar renderiza todas
  las combinaciones sin `undefined`.
- Existentes: simulación masiva, cobertura de eventos y acciones (incluye las nuevas), interfaz
  con Playwright (incluye dibujar un tatuaje y regalar desde el menú desplegable).
