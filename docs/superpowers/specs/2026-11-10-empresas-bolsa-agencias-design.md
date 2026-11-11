# Parte B — Programación, empresas propias, bolsa de valores y agencias — diseño

**Fecha:** 2026-11-10
**Origen:** pedidos del usuario: "programación, que te deje crear tu propia empresa o crear tus propios juegos";
"si soy deportista, tener un negocio, o si soy trabajador, armar mi propio negocio, mi agencia de eSports, juegos,
etcétera, o ser manager". Respuestas: juegos y apps tanto solo como dentro de una empresa; hasta 3 empresas a la vez;
gestión media; bolsa con empresas inventadas, salida a bolsa propia, dividendos y crash, e información privilegiada;
agencias con fichajes, torneos y temporadas, negociación de contratos y mánager para tu propia carrera.
Enfoque aprobado: un motor de empresas común con módulos por tipo. Orden: B → C; después, 3 diseños de interfaz en Figma.

**Límites:** todas las empresas, marcas, cotizantes y jugadores son inventados. Humor negro sin contenido explícito.
Textos en español con concordancia de género.

## 1. Programación solo: juegos y apps

"Mis obras" suma dos clases nuevas, con el mismo flujo que libros, canciones y cuadros (título propio, género,
crítica de 1 a 5 estrellas, éxito con fama y regalías):

| Obra | Habilidad | Edad | Géneros |
|---|---|---|---|
| Juego | Programación (y un poco de Arte) | 12+ | Plataformas, Terror, Estrategia, Mundo abierto, Simulador de vida, Battle royale |
| App | Programación | 14+ | Productividad, Citas, Fitness, Finanzas, Red social de nicho, App que no hace nada |

Un juego exitoso vende entre $60.000 y $1.200.000 y da de 8 a 18 de fama; una app, entre $40.000 y $800.000 y de 4 a 10
de fama. Las regalías siguen los años siguientes, como en las obras actuales.

## 2. Motor de empresas

- **Límite:** hasta 3 empresas propias; el negocio clásico (food truck, cafetería…) cuenta como una.
- **Fundar** (18+): eliges el tipo y escribes el nombre. Costo inicial: estudio $50.000, apps $30.000, red social
  $80.000, agencia de eSports $100.000, agencia de representación $40.000. El costo va a la **caja** de la empresa.
- **Caja propia:** los ingresos y gastos de la empresa entran y salen de su caja, no de tu bolsillo. Puedes
  **inyectar** dinero o **sacar dividendos**. Si la caja queda negativa dos años seguidos, la empresa quiebra.
- **Empleados** con nombre, puesto, nivel (1 a 5) y sueldo (unos $20.000 por nivel al año). Contratar eligiendo entre
  3 candidatos, despedir (indemnización de un cuarto de su sueldo) y subir el sueldo. Los puestos dependen del tipo.
  Un **gerente general** baja el estrés que te da la empresa. Eventos: un empleado pide aumento, la competencia lo
  quiere robar, renuncia, o hace algo que se vuelve viral.
- **Marketing anual:** ninguno, bajo ($10.000), medio ($50.000) o alto ($200.000).
- **Cada año:** resultado = ingresos − sueldos − marketing − costos fijos. **Valuación** = ingresos del año × un
  múltiplo por tipo (3 a 8) + caja. Cada empresa suma 3 de estrés al año (1 con gerente general).
- **Vender** (un comprador ofrece entre 80 % y 120 % de la valuación) o **cerrar** (despide a todos).

## 3. Tipos de empresa

| Tipo | Lo propio | Puestos |
|---|---|---|
| Estudio de videojuegos | **Próximo juego:** nombre, género y presupuesto (chico $50.000 o mediano $300.000: un año; AAA $3.000.000: dos años). La calidad sale del equipo, de tu Programación y Arte y del azar; la crítica da estrellas; vende un pico el año de salida y una cola de 3 años. Evento de *crunch* con decisión. | Programador, artista, diseñador, marketing |
| Empresa de apps | Cada app nueva cuesta $30.000 y tarda un año. Cada app tiene suscriptores que pagan $30 al año, crecen por calidad y marketing y se van si la app envejece. | Programador, diseñador, marketing |
| Red social | Usuarios (empieza con 1.000) que crecen según el equipo y el marketing; la publicidad paga $2 por usuario al año. Escándalos con decisión: filtración de datos, moderación, un político que pide favores. Logro a los 100 millones de usuarios. | Programador, moderador, marketing, abogado |
| Agencia de eSports | Plantel de hasta 5 jugadores inventados (nombre, alias, habilidad 30 a 95, sueldo). Cada temporada juega una liga (regional, internacional o mundial según la reputación) con premios de $20.000 a $2.000.000 y patrocinadores. Fichajes y ventas a otros equipos. Si eres jugador profesional de e-sports, puedes jugar en tu propio equipo. | Entrenador, analista, community manager |
| Agencia de representación | Hasta 10 clientes inventados: deportistas, actores o músicos con nivel y sueldo. Cobras la comisión pactada al firmar (10 % a 20 %) sobre lo que ganan. Un *scout* encuentra talentos. Si les va mal, se van. | Scout, abogado, relaciones públicas |

## 4. Negociar contratos y tu propia carrera

- **Renovación de un representado:** evento con decisión: **pedir más** (más sueldo y comisión, riesgo de que la otra
  parte se levante), **aceptar** (seguro) o **amenazar con irse** (gran subida o pérdida del contrato). Pesan tu
  Carisma, tu abogado y el nivel del cliente.
- **Tu carrera:** si eres deportista, gamer profesional o famoso, puedes **contratar un mánager** (cobra 10 % de tu
  sueldo y tus ofertas y renovaciones mejoran entre 10 % y 25 %) o **representarte a ti mismo** (sin comisión;
  negocias con la misma decisión de arriba, según tu Carisma).

## 5. Bolsa de valores

- **12 empresas inventadas** con sigla, sector, precio, volatilidad y dividendo; por ejemplo Volta Motors (VOLT),
  Okami Electrónica (OKAM), Banco del Sur (BSUR), Petrolera Austral (PETR), Farmacéutica Vitalis (VITA),
  Supermercados Supermax (SMAX), Aerolínea Cóndor (COND), Minera Andina (MINA), Bananín Coin (BNNA, muy volátil),
  Inmobiliaria Torres (TORR), Streaming Nube (NUBE) y Pollo Feliz (POLL).
- **Precio anual:** tendencia del sector + efecto de las noticias del mundo de ese año (recesión, auge tecnológico,
  pandemia, fiebre cripto, burbuja inmobiliaria…) + azar según la volatilidad. **Crash** (3 % por año): todas caen
  entre 30 % y 60 %. **Burbuja** de un sector: sube fuerte unos años y después revienta.
- **Dividendos:** algunas pagan entre 2 % y 5 % del precio cada año.
- **Comprar y vender** de a 10, 100, 1.000 o todas, con 1 % de comisión. Gráfico del precio en la ficha de cada acción.
- **Salida a bolsa** de una empresa tuya con valuación de $5.000.000 o más y al menos 3 años: vendes entre 20 % y 40 %
  (eliges) y cobras ese dinero; la empresa cotiza con su propia sigla y su precio sigue sus resultados. Cada año hay
  **junta de accionistas**: tras dos años seguidos con pérdidas, votan si te echan como director; si te echan, dejas
  de manejarla y te quedan tus acciones. Puedes **recomprar** acciones.
- **Información privilegiada:** a veces alguien (un amigo, un empleado, tu propia empresa) te pasa un dato. Si compras,
  ganas mucho, pero hay 25 % de investigación: juicio por "uso de información privilegiada" y karma negativo.

## 6. Interfaz

- **Ocupación → Mis empresas (n/3):** una fila por empresa y una hoja con resumen (caja, valuación, resultado del año
  y gráfico), empleados, lo propio del tipo (juego en desarrollo, apps, usuarios, plantel o clientes), marketing y
  opciones (inyectar, sacar dividendos, salir a bolsa, vender, cerrar).
- **Bienes y dinero → Bolsa de valores:** lista con precio, variación del año y tus acciones; ficha de cada una con
  gráfico, comprar y vender. Tus empresas cotizantes aparecen ahí.
- **Mis obras:** juegos y apps con el estudio de obras actual.

## Partidas guardadas

`MV.VERSION = 7`. Migración v6→v7: `p.companies = []`, `p.portfolio = {}`, `p.manager = null` y el mercado se crea
cuando hace falta. El negocio clásico y la inversión "acciones" siguen como están; v1–v6 siguen cargando.

## Pruebas

Node por bloque (juegos y apps en obras, límite de 3 empresas, caja e inyección, empleados, quiebra, cada tipo,
salida a bolsa y junta, precios con noticias del mundo y crash, dividendos, comprar y vender con comisión, información
privilegiada, negociación, mánager, migración v6→v7). La prueba de interfaz recorre fundar una empresa, contratar,
lanzar un juego, comprar y vender acciones, salir a bolsa, fichar en la agencia y negociar. Barrido de 1.000 vidas sin
errores ni textos rotos.
