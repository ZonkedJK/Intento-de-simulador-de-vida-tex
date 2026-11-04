# Mil Vidas — Diseño (spec)

Fecha: 2026-11-04 · Estado: aprobado por el usuario

## 1. Objetivo

Un simulador de vida de texto, original, jugable en el navegador, inspirado en las
mecánicas del género (vivir año a año, estadísticas, relaciones, carrera, crimen,
bienes, muerte y legado) pero con más contenido, más opciones e ilustraciones.

- Público: jugadores adultos (+18), humor negro.
- Idioma: español.
- Éxito: se puede vivir una vida completa (0 → muerte) sin errores, con decisiones
  que importan, y continuar la dinastía con un hijo.

### Lo que dijo el usuario
- Plataforma web (navegador), sin instalar nada.
- Imágenes: emojis + ilustraciones SVG generadas por código.
- Tono: humor negro +18.

### Supuestos (validados al aprobar el diseño)
- Sin contenido sexual explícito: lo íntimo es siempre implícito (fundido a negro).
- Identidad propia (nombre "Mil Vidas", estética "diario de vida"); no se copia
  marca, textos ni aspecto de ningún juego existente.

## 2. Tecnología

- HTML + CSS + JavaScript sin frameworks ni paso de compilación.
- Scripts clásicos (no módulos ES) con un espacio de nombres global `MV`, para que
  `index.html` funcione con doble clic (`file://`) y en GitHub Pages.
- Guardado automático en `localStorage`; exportar/importar partida como `.json`.
- RNG con semilla (mulberry32) guardada en la partida → pruebas deterministas.

## 3. Arquitectura

```
index.html            carga los scripts en orden (también lo usa el cargador de tests)
css/styles.css
js/core/              util (rng, formato), state (personas, partida), fx (efectos), events (motor)
js/data/              países y nombres, educación, carreras, bienes, salud, crímenes,
                      actividades, acciones de relación, logros, aspiraciones, eventos/*
js/systems/           year (bucle anual), people, health, edu, career, money, crime,
                      rels, legacy (muerte, herederos, cementerio, logros), save
js/ui/                dom, avatar (SVG), scenes (SVG), main, sheets, screens, app
tests/                cargador vm + pruebas con node --test
```

Reglas:
- `js/core`, `js/data` y `js/systems` no tocan el DOM → se prueban en Node.
- Los datos (eventos, carreras, etc.) son declarativos; agregar contenido = agregar
  objetos a un archivo de datos.

## 4. Modelo de datos (resumen)

- `game`: `{version, year, rng, p (jugador), people{id: NPC}, log[], queue[],
  evDone{}, generation, dynasty}`.
- Jugador: estadísticas (felicidad, salud, inteligencia, apariencia 0–100), estrés y
  fama (0–100), karma (−100..100), habilidades (música, deporte, cocina,
  programación, arte, carisma, idiomas, crimen), dinero, educación, trabajo,
  negocio, inversiones, bienes, vivienda, condiciones médicas, adicciones,
  antecedentes/cárcel, licencia, aspiración, contadores, banderas, relaciones.
- NPC: nombre, género, edad, aspecto, apariencia/inteligencia/salud, dinero,
  trabajo, rasgos de personalidad, especie (mascotas).
- Relación: `{id, type, rel 0–100}` con tipos padre, hermano, abuelo, pareja,
  cónyuge, ex, hijo, amigo, enemigo, amante, mascota.

## 5. Bucle anual (“+1 año”)

1. Bloqueado si hay eventos pendientes en la cola.
2. Año y edades +1; muertes de NPC por edad/salud.
3. Sistemas: salud (envejecimiento, enfermedades, adicciones, estrés) → educación →
   trabajo (sueldo, rendimiento, ascensos, despidos, jubilación) → dinero (gastos,
   impuestos, hipotecas, inversiones, negocio, bienes) → cárcel → relaciones
   (desgaste, embarazos, infidelidades) → aspiraciones.
4. Chequeo de muerte.
5. Eventos aleatorios: hasta 2 con decisiones (cola, modal) y hasta 2 automáticos
   (diario), filtrados por edad, condiciones, enfriamiento y “una sola vez”.

## 6. Mecánicas

Base del género: estadísticas, relaciones y acciones sociales, educación completa
(primaria, secundaria, técnica, universidad con carreras, posgrado), empleos con
requisitos, entrevistas, ascensos y jubilación; dinero, casas y autos (contado o
hipoteca); actividades (gimnasio, médico, cirugía, viajes, discoteca, citas,
casino, lotería, demandas, emigrar); crimen, juicio y cárcel (motín, fuga,
apelación); enfermedades, adicciones y muertes absurdas.

Mejoras: estrés/karma/fama visibles, habilidades que se entrenan, carreras de
fama (actor, músico, atleta, streamer, político, modelo, escritor), mafia, negocio
propio, inversiones, aspiraciones de vida, consecuencias encadenadas (banderas),
logros persistentes, árbol genealógico, cementerio de vidas, testamento y herencia,
límites por año para evitar exploits, 150+ eventos.

## 7. Imágenes y estética

- Avatar SVG procedural por etapa (bebé, niño, adolescente, adulto, anciano),
  piel, pelo, ojos, lentes, barba y ánimo (boca según felicidad).
- Escenas SVG por lugar (hogar, escuela, universidad, trabajo, hospital, cárcel,
  fiesta, cementerio, tribunal, casino, viaje, naturaleza, boda, ciudad).
- Estética “diario de vida”: papel, tinta, sellos; modo oscuro; mobile-first.

## 8. Errores y robustez

- Guardado versionado; si una partida guardada no se puede leer se ofrece empezar
  de nuevo sin romper la página.
- Todas las estadísticas se acotan en `fx`; el dinero puede ser negativo (deuda).
- Acceso a `localStorage` envuelto en try/catch.

## 9. Pruebas

- `node --test`: simulación de cientos de vidas completas con decisiones y
  acciones aleatorias (sin excepciones, valores acotados, causa de muerte),
  ida y vuelta de guardado, continuar como heredero, validación de datos
  (ids únicos, rangos de edad, referencias válidas, textos que se resuelven).
- Prueba de humo de la interfaz con Playwright (Chromium preinstalado).
