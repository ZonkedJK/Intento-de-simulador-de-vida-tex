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

## Partidas guardadas

`MV.VERSION = 5`. Migración v4→v5: `p.licenses = { auto: !!p.license }`. El resto de los campos nuevos
se leen con valores por defecto.

## Pruebas

- Node: bancos de preguntas válidos (cada señal tiene dibujo, opciones distintas), examen y
  corrección, requisitos y edades, licencia de conducir compatible con el resto del juego, usos de
  vehículos con y sin licencia, trabajos con requisito de licencia, islas (desarrollar, mejorar,
  ganancias con noticias, eventos, cerrar, vender), migración v4→v5.
- Interfaz (Playwright): rendir el examen de conducir respondiendo en pantalla, ver el resultado,
  desarrollar una isla con nombre y mejorarla.
- Barrido de 1.000 vidas sin errores ni textos rotos.
