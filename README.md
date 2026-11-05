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
| Deporte profesional | 11 deportes (fútbol, básquet con draft en una liga norteamericana, tenis, vóley, béisbol, boxeo, golf, atletismo, natación, automovilismo y e-sports), con sueldos de hasta decenas de millones, contratos, lesiones, títulos y retiro; puedes buscar un equipo, escudería o patrocinador mejor para subir de categoría (hasta campeón de la Fórmula Mundial) y volver del retiro |
| Reclutamiento | Clubes por deporte desde la escuela, cazatalentos al terminar la secundaria, beca deportiva, reclutadores universitarios y pruebas abiertas; cuentan la habilidad Deporte, la salud, los años de práctica y un talento natural oculto |
| Fama | Actor/actriz, música, moda y política (con elecciones), más redes sociales con seguidores y patrocinios |
| Mafia | Carrera criminal con encargos, ascensos y riesgo de arresto |
| Dinero | Impuestos, gastos de vida, alquiler, hipotecas, préstamos, 4 tipos de inversión y 8 negocios propios |
| Noticias del mundo | Cada año puede traer uno de 15 titulares (recesión, fiebre cripto, burbuja inmobiliaria, pandemia, inflación, auge tecnológico…) que mueven inversiones, casas, costo de vida, empleo y salud |
| Bienes | Mercado anual de casas, autos y lujos con barras de estado (rojo, amarillo, verde), mantenimiento anual visible y venta eligiendo el precio (con contraofertas) |
| Casas | 14 mejoras (piscina, sauna, cancha de tenis, gimnasio, cine, paneles solares, búnker, tobogán…) que suben o bajan el valor, cuestan mantenimiento y dan beneficios si vives ahí |
| Tatuajes | Minijuego: elige tatuador y lugar, dibuja sobre la piel con 6 tintas, plantillas y texto; el tatuador lo califica y queda en tu álbum (se puede borrar con láser) |
| Relaciones | Padres, hermanos, abuelos, parejas, cónyuges, amantes, hijos, nietos, amigos, enemigos, ex y 12 especies de mascotas, con más de 40 acciones (cenas, poemas, mudarse juntos, renovar votos, tareas con los hijos, malcriar a los nietos, llevar a los mayores al médico…) |
| Familia | Los hijos adultos se casan (con boda incluida), cambian de trabajo y te dan nietos de verdad; si no quedan hijos, heredan los nietos |
| Mascotas | Trucos propios de cada especie y concursos con premios, trofeos y logro |
| Obras | Escribe libros, compone canciones y pinta cuadros con título y género propios; la crítica da estrellas, y los éxitos pagan regalías |
| Regalos | Menú desplegable con 37 regalos de $2 a $5 millones; cada persona tiene gustos según su edad y personalidad |
| Viajes | 10 destinos; eliges si vas solo o con tu pareja, familia o amigos |
| Salud | 21 enfermedades, 4 niveles de tratamiento (del curandero al tratamiento experimental), adicciones y rehabilitación |
| Crimen | 11 delitos, juicio con elección de abogado (o soborno), cárcel con pandillas, motines, fuga, apelación y libertad condicional |
| Actividades | 61: gimnasio, médico, cirugía estética, viajes a 10 destinos, citas, discoteca, casino, lotería, demandas, emigrar a 28 países y más |
| Países | 28 países de Latinoamérica, Norteamérica, Europa y Asia, cada uno con sus nombres, ciudades y un deporte popular |
| Eventos | 184 eventos al azar (131 con decisiones), más 24 encadenados o especiales (como ofertas, juicios y consecuencias que vuelven años después) |
| Metas | 16 aspiraciones de vida, 57 logros que se conservan entre vidas y 12 desafíos opcionales al nacer (millonario sin universidad, presidente antes de los 50, dinastía…) |
| Legado | Muerte con epitafio y veredicto, resumen para copiar o compartir, testamento, herencia, árbol genealógico y cementerio de todas tus vidas |
| Imágenes | Avatares SVG con 9 peinados, barbas, 5 expresiones, ropa según tu ocupación y accesorios; 16 escenas ilustradas; tema claro (cuaderno) y oscuro (pizarrón) |

## Estructura

```
index.html            carga los scripts en orden (sin compilación)
css/styles.css        estética de cuaderno cuadriculado y modo pizarrón
js/core/              utilidades y azar con semilla, estado, efectos, motor de eventos
js/data/              países, educación, empleos, deportes, mundo (bienes, salud, crimen...), noticias, obras, desafíos, logros, actividades
js/data/events/       eventos por etapa: infancia, adolescencia, adultez, vejez, generales y deportes
js/systems/           bucle anual: mundo, personas, salud, educación, trabajo, deportes, tatuajes, obras, desafíos, dinero, crimen, relaciones, legado, guardado
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
