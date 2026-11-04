# Mil Vidas

Un simulador de vida de texto, en español, que se juega en el navegador. Naces, creces, estudias, trabajas, te enamoras, delinques (o no), envejeces y mueres. Después puedes seguir jugando como uno de tus hijos y construir una dinastía.

Contenido para mayores de 18: humor negro, crimen, drogas, apuestas y muertes absurdas. Lo íntimo es siempre implícito.

## Cómo jugar

- **Sin instalar nada:** abre `index.html` en el navegador (con doble clic funciona).
- **En internet:** activa GitHub Pages en el repositorio (Settings → Pages → rama principal, carpeta raíz) y comparte el enlace.

La partida se guarda sola en el navegador. Desde el menú (☰) puedes exportarla a un archivo e importarla en otro dispositivo.

Toca **+1 año** para cumplir años. Cada año pasan cosas, aparecen decisiones y todo queda anotado en tu diario. Atajos de teclado: `A` avanza un año y `Esc` cierra una hoja.

## Qué incluye

| Sistema | Detalle |
|---|---|
| Estadísticas | Felicidad, salud, inteligencia y apariencia, más estrés, karma y fama visibles |
| Habilidades | Música, deporte, cocina, programación, arte, carisma, idiomas y crimen; suben con la práctica |
| Educación | Primaria, secundaria, 17 carreras universitarias, 6 técnicas, 4 posgrados, escuela nocturna, clubes, becas y préstamos estudiantiles |
| Trabajo | 46 empleos con requisitos y ascensos (incluye entrenador y comentarista para exdeportistas), 10 de medio tiempo, entrevistas con preguntas, jubilación y pensión |
| Deporte profesional | 11 deportes (fútbol, básquet con draft en una liga norteamericana, tenis, vóley, béisbol, boxeo, golf, atletismo, natación, automovilismo y e-sports), con sueldos de hasta decenas de millones, contratos, traspasos, lesiones, títulos y retiro |
| Reclutamiento | Clubes por deporte desde la escuela, cazatalentos al terminar la secundaria, beca deportiva, reclutadores universitarios y pruebas abiertas; cuentan la habilidad Deporte, la salud, los años de práctica y un talento natural oculto |
| Fama | Actor/actriz, música, moda y política (con elecciones), más redes sociales con seguidores y patrocinios |
| Mafia | Carrera criminal con encargos, ascensos y riesgo de arresto |
| Dinero | Impuestos, gastos de vida, alquiler, hipotecas, préstamos, 4 tipos de inversión y 8 negocios propios |
| Bienes | Mercado anual de casas, autos y lujos (con estado, mantenimiento y valorización) |
| Relaciones | Padres, hermanos, abuelos, parejas, cónyuges, amantes, hijos, amigos, enemigos, ex y 12 especies de mascotas, cada uno con sus acciones |
| Salud | 21 enfermedades, 4 niveles de tratamiento (del curandero al tratamiento experimental), adicciones y rehabilitación |
| Crimen | 11 delitos, juicio con elección de abogado (o soborno), cárcel con pandillas, motines, fuga, apelación y libertad condicional |
| Actividades | 58: gimnasio, médico, cirugía estética, viajes a 10 destinos, citas, discoteca, casino, lotería, demandas, emigrar a 28 países y más |
| Países | 28 países de Latinoamérica, Norteamérica, Europa y Asia, cada uno con sus nombres, ciudades y un deporte popular |
| Eventos | 184 eventos al azar (132 con decisiones), más 22 encadenados o especiales (como ofertas, juicios y consecuencias que vuelven años después) |
| Metas | 16 aspiraciones de vida y 53 logros que se conservan entre vidas |
| Legado | Muerte con epitafio y veredicto, testamento, herencia, árbol genealógico y cementerio de todas tus vidas |
| Imágenes | Avatares SVG que cambian con la edad, el aspecto y el ánimo, y 16 escenas ilustradas; tema claro (cuaderno) y oscuro (pizarrón) |

## Estructura

```
index.html            carga los scripts en orden (sin compilación)
css/styles.css        estética de cuaderno cuadriculado y modo pizarrón
js/core/              utilidades y azar con semilla, estado, efectos, motor de eventos
js/data/              países, educación, empleos, deportes, mundo (bienes, salud, crimen...), logros, actividades
js/data/events/       eventos por etapa: infancia, adolescencia, adultez, vejez, generales y deportes
js/systems/           bucle anual: personas, salud, educación, trabajo, deportes, dinero, crimen, relaciones, legado, guardado
js/ui/                interfaz: avatares, escenas, pantalla principal, pestañas y pantallas
tests/                pruebas con node --test y prueba de interfaz con Playwright
```

El motor (`core`, `data`, `systems`) no toca el DOM, así que se puede probar en Node.

## Agregar contenido

Los eventos son objetos declarativos. Por ejemplo, en `js/data/events/general.js`:

```js
ev({
  id: 'gato_negro', age: [10, 90], icon: '🐈‍⬛', title: 'Mala suerte',
  text: 'Un gato negro se cruza en tu camino y te mira fijo.',
  choices: [
    { t: 'Saludarlo', eff: { happy: 3, karma: 1, msg: 'El gato aceptó tu saludo. Ahora te sigue a todas partes.' } },
    { t: 'Cruzar la calle', eff: { p: 0.5, ok: { msg: 'Esquivaste la mala suerte.' }, ko: { health: -5, msg: 'Al cruzar te chocó una bicicleta.' } } }
  ]
});
```

- **Efectos disponibles:** `happy`, `health`, `smarts`, `looks`, `stress`, `karma`, `fame`, `money`, `skills: {...}`, `addic: {...}`, `rel`, `cond`, `flag`, `ach` y `msg`.
- **Azar:** `p` / `ok` / `ko` elige un resultado según una probabilidad.
- **Efectos más complejos:** se puede pasar una función `(g, ctx) => 'texto'`.
- **Personas en el texto:** con `target` el evento elige a alguien de tu vida, y `{t}` en el texto muestra su nombre.

## Pruebas

```
npm test          # motor: miles de años simulados, guardado, herencia y validación de datos
npm run test:ui   # interfaz en Chromium (requiere Playwright)
```

Las pruebas simulan cientos de vidas completas con un jugador automático que usa todas las pestañas. También ejecutan cada opción de cada evento y comprueban que no haya errores, valores fuera de rango ni textos rotos.
