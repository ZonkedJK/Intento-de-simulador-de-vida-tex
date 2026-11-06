# Parte A — Licencias e islas — diseño

**Fecha:** 2026-11-06
**Origen:** pedido del usuario: "cuando cumplas 16, sacar la licencia de conducir con preguntas tipo
'si ves este símbolo, ¿qué significa?'; licencias de avión, helicóptero y yate; islas privadas que se
puedan convertir en resort o en un parque temático corporativo (estilo Disney, con otro nombre)".
Respuestas del usuario: examen **solo teórico** de señales; las licencias de vehículos dan **vehículos y
trabajos**; las islas pueden ser **resort, parque temático, casino y club privado, y reserva natural**.
Es la primera de tres partes aprobadas (A: licencias e islas; B: programación, empresa y bolsa;
C: trabajos y dinero).

## Objetivo

Que conseguir una licencia sea un pequeño examen jugable con dibujos, que las licencias abran vehículos y
carreras, y que una isla privada deje de ser solo un bien caro y pase a ser un proyecto con nombre que
crece, gana dinero y genera historias. Sin cambiar el estilo (texto, emojis, SVG, humor negro sin
contenido explícito) ni la arquitectura (scripts clásicos bajo `MV`, motor sin DOM probado en Node).

## 1. Examen de licencia (motor común)

- `MV.LICENSES`: `auto` (licencia de conducir), `avion`, `helicoptero`, `yate`, cada una con nombre,
  icono, costo por intento, edad mínima, requisito previo, cantidad de preguntas (10) y mínimo para
  aprobar (7).

  | Licencia | Edad | Costo | Requisito |
  |---|---|---|---|
  | Conducir | 16 | $150 | — |
  | Yate | 18 | $3.000 | Conducir |
  | Avión | 18 | $8.000 | Conducir |
  | Helicóptero | 18 | $12.000 | Conducir |

- Bancos de preguntas `MV.QUIZ[kind]`: cada pregunta tiene el texto, la respuesta correcta, varias
  incorrectas y, si corresponde, un dibujo (`sign`). Conducir tiene 20 señales dibujadas; cada una de las
  otras tiene al menos 12 preguntas reales (instrumentos y luces en aviación, controles del helicóptero y
  señales del señalero, lados del barco, banderas del código internacional, luces y llamadas de socorro).
- `MV.sys.license.exam(kind)` arma 10 preguntas al azar con 3 opciones mezcladas;
  `grade(g, kind, exam, answers)` devuelve aciertos, si aprobó y los errores con la respuesta correcta.
  Aprobar guarda `p.licenses[kind] = true` (y `p.license = true` para conducir, que ya usa el resto del juego).
- Actividades en Trámites: una por licencia, 2 intentos por año, aparecen solo si cumples la edad y el
  requisito y aún no la tienes. Se cobra al rendir. El jugador automático responde al azar con una
  probabilidad que sube con la inteligencia.

## 2. Hoja del examen (interfaz)

- Una pregunta por pantalla: dibujo (si tiene), pregunta, 3 botones de respuesta, progreso
  "Pregunta 3 de 10 · ✔ 2 · ✘ 0". Al terminar: aprobado o reprobado, aciertos y la lista de errores
  con la respuesta correcta.
- Las 20 señales son dibujos SVG propios (PARE, ceda el paso, contramano, velocidad máxima, curva
  peligrosa, cruce peatonal, prohibido estacionar, prohibido girar a la izquierda, rotonda, zona escolar,
  paso a nivel, obras, calzada resbaladiza, prohibido adelantar, doble mano, hospital, estacionamiento,
  semáforo, animales sueltos, prohibido tocar bocina). Las banderas náuticas también se dibujan.

## 3. Vehículos

- Se agrega el **helicóptero** a los lujos (entre $700.000 y $9.000.000, con mantenimiento).
- En la ficha de cada vehículo aparecen acciones (2 por año cada una):
  - **Avión privado:** "Volar a un destino" (los destinos de las vacaciones a un 25 % del precio: solo
    combustible; cuenta como viaje).
  - **Helicóptero:** "Paseo sobre la ciudad" y "Llegar en helicóptero a una fiesta" (fama y seguidores).
  - **Yate:** "Paseo en yate" (menos estrés) y "Fiesta en el yate" (fama, amigos nuevos y algún desastre).
- Sin la licencia correspondiente, cada uso cobra además un piloto o capitán ($5.000 avión,
  $3.000 helicóptero, $1.500 yate), y el texto lo dice.

## 4. Trabajos nuevos

- **Piloto comercial** (licencia de avión, 21+ años, secundaria): Copiloto → Primer oficial →
  Comandante → Comandante de vuelos internacionales ($60.000 a $240.000).
- **Piloto de helicóptero** (licencia de helicóptero, 20+): turístico → de rescate → ejecutivo
  ($50.000 a $140.000).
- **Capitán de yate** (licencia de yate, 18+): Patrón de lancha → Capitán de yate → Capitán de
  superyate ($32.000 a $150.000).
- Los requisitos de licencia se agregan a `career.meets` (`req.lic`), con su texto en la lista de
  requisitos que faltan.

## 5. Islas privadas

- En la ficha de una isla: **"Desarrollar la isla"**. Eliges el tipo y escribes el nombre (40 letras,
  con 🎲 al azar); el parque también lleva el nombre de su mascota.

  | Tipo | Inversión inicial | Ganancia base por nivel | Además |
  |---|---|---|---|
  | Resort de lujo | $5.000.000 | $600.000 | Reseñas que suben o bajan la reputación |
  | Parque temático | $8.000.000 | $1.000.000 | Escándalos de la mascota y las atracciones |
  | Casino y club privado | $6.000.000 | $1.400.000 | Celebridades, y riesgo de redada |
  | Reserva natural | $1.000.000 | $100.000 | +karma y +fama cada año, documentales |

- **5 niveles**: mejorar al nivel N cuesta la inversión inicial × 0,6 × N. El 70 % de lo invertido
  suma al valor de la isla.
- **Cada año**: ganancia = base × nivel × reputación/50 × turismo × azar (0,8 a 1,2). El turismo
  depende de las noticias del mundo (pandemia 0,3; recesión 0,75; guerra 0,85; auge 1,2; ola de calor 1,1).
  La ganancia queda en el diario.
- **Eventos** (1 de cada 4 años, según el tipo, con decisiones): la mascota del parque muerde a un
  niño, la montaña rusa se traba, una reseña viral del resort, una redada en el casino (sobornar,
  abogado o cerrar; el casino puede terminar en arresto), un documental en la reserva.
- Se puede **cerrar el proyecto** (vuelve a ser una isla sola y pierde parte del valor agregado) y
  **vender la isla** con el proyecto incluido.

## 6. Herencia de la casa (agregado aprobado)

- El heredero con el que sigues jugando recibe **siempre la casa familiar**: la casa donde vivías o, si
  alquilabas, tu casa más valiosa. Conserva sus mejoras. Su valor se descuenta de su parte en dinero
  (si vale más que su parte, recibe la casa igual y $0 en efectivo).
- Si es el **único heredero o el heredero nombrado**, recibe además todos los demás bienes (otras casas,
  autos, lujos, instrumentos e islas con su proyecto), también descontados de su parte.
- La parte total sigue siendo patrimonio × 0,9 (impuesto) × su porcentaje; los bienes se heredan sin deudas.
- Si es mayor de edad, se muda a la casa heredada.

## 7. Instrumentos y carrera de músico (agregado aprobado)

- **Tienda de música** en Bienes con 10 instrumentos de precio fijo: guitarra criolla $150, guitarra
  eléctrica $900, bajo $700, teclado $400, violín $600, saxofón $1.200, batería $1.500, equipo de DJ
  $2.000, piano de cola $25.000, micrófono profesional $300. Cada uno tiene una calidad de 1 a 3.
- Son bienes (pierden un poco de valor por año y se pueden vender). En su ficha, 1 vez por año cada una:
  - **Practicar**: +4 a +8 de Música, más la calidad del instrumento.
  - **Tocar en la calle**: algo de dinero según tu Música; a veces, un poco de fama.
  - **Tocar en un bar** (Música 30+, 16+ años): más dinero y fama; con suerte aparece un
    **representante** que te ofrece un contrato en la carrera musical que ya existe (Músico de bar o
    Artista con contrato según tu Música). Si ya eres músico, sube tu rendimiento.
- Tener un instrumento suma en las audiciones de música y en la calidad de las canciones que compones.
- En la cárcel no se usan.

## 8. Hasta 3 clubes o talleres a la vez (agregado aprobado)

- En la escuela o la universidad puedes estar en **hasta 3 clubes o talleres a la vez**, mezclando deportes
  y talleres (por ejemplo, fútbol, básquet y robótica). Para entrar a un cuarto, primero dejas uno
  ("Dejar un club").
- Cada año, cada deporte suma sus años de práctica y habilidad (con su cuota), y cada taller suma su
  habilidad y su estadística. Los cazatalentos y reclutadores miran tu mejor deporte, así que te pueden
  fichar en cualquiera.
- Los talleres terminan cuando dejas de estudiar; los deportes siguen.

## Partidas guardadas

`MV.VERSION = 5`. Migración v4→v5: `p.licenses = { auto: !!p.license }` y `p.clubs` a partir de `p.club`. El resto de los campos nuevos
se leen con valores por defecto.

## Pruebas

- Node: bancos de preguntas válidos (cada señal tiene dibujo, opciones distintas), examen y
  corrección, requisitos y edades, licencia de conducir compatible con el resto del juego, usos de
  vehículos con y sin licencia, trabajos con requisito de licencia, islas (desarrollar, mejorar,
  ganancias con noticias, eventos, cerrar, vender), migración v4→v5.
- Interfaz (Playwright): rendir el examen de conducir respondiendo en pantalla, ver el resultado,
  desarrollar una isla con nombre y mejorarla.
- Barrido de 1.000 vidas sin errores ni textos rotos.
