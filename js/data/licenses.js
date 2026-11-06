/* Mil Vidas — licencias (conducir, yate, avión, helicóptero) y sus bancos de preguntas.
   Cada pregunta: { id, q, a (correcta), wrong: [incorrectas], sign?: dibujo de js/ui/signs.js }. */
(function (MV) {
  'use strict';
  MV.LICENSES = {
    auto: { name: 'Licencia de conducir', label: 'Sacar la licencia de conducir', icon: '🚗', cost: 150, minAge: 16, requires: null, n: 10, pass: 7 },
    yate: { name: 'Licencia de yate', label: 'Sacar la licencia de yate', icon: '⛵', cost: 3000, minAge: 18, requires: 'auto', n: 10, pass: 7 },
    avion: { name: 'Licencia de avión', label: 'Sacar la licencia de piloto de avión', icon: '✈️', cost: 8000, minAge: 18, requires: 'auto', n: 10, pass: 7 },
    helicoptero: { name: 'Licencia de helicóptero', label: 'Sacar la licencia de piloto de helicóptero', icon: '🚁', cost: 12000, minAge: 18, requires: 'auto', n: 10, pass: 7 }
  };

  const Q = (id, q, a, wrong, sign) => ({ id, q, a, wrong, sign });
  const SIGN = '¿Qué significa esta señal?';
  MV.QUIZ = {
    auto: [
      Q('pare', SIGN, 'Detenerse por completo antes de seguir', ['Bajar la velocidad sin detenerse', 'Prohibido estacionar', 'Fin de la zona urbana'], 'pare'),
      Q('ceda', SIGN, 'Ceder el paso a los vehículos de la otra calle', ['Detenerse siempre durante 10 segundos', 'Calle sin salida', 'Prohibido girar'], 'ceda'),
      Q('contramano', SIGN, 'Prohibido entrar: es contramano', ['Fin de la autopista', 'Calle cortada por obras más adelante', 'Estacionamiento exclusivo'], 'contramano'),
      Q('velocidad', SIGN, 'Velocidad máxima de 60 km/h', ['Velocidad mínima de 60 km/h', 'Faltan 60 metros para el próximo cruce', 'Ruta número 60'], 'velocidad'),
      Q('curva', SIGN, 'Curva peligrosa hacia la derecha', ['Desvío obligatorio a la derecha', 'Prohibido girar a la derecha', 'Calle de una sola mano'], 'curva'),
      Q('peatones', SIGN, 'Cruce de peatones más adelante', ['Prohibido el paso de peatones', 'Zona de juegos infantiles', 'Parada de colectivo'], 'peatones'),
      Q('no_estacionar', SIGN, 'Prohibido estacionar', ['Estacionamiento permitido', 'Prohibido detenerse en la estación de servicio', 'Entrada a una autopista'], 'no_estacionar'),
      Q('no_izquierda', SIGN, 'Prohibido girar a la izquierda', ['Giro obligatorio a la izquierda', 'Curva peligrosa a la izquierda', 'Carril exclusivo para girar'], 'no_izquierda'),
      Q('rotonda', SIGN, 'Rotonda: circular en el sentido de las flechas', ['Prohibido dar la vuelta en U', 'Lavadero de autos', 'Punto de reciclaje'], 'rotonda'),
      Q('escuela', SIGN, 'Zona escolar: cuidado con los niños', ['Parque de diversiones', 'Prohibido el paso de menores', 'Guardería para conductores'], 'escuela'),
      Q('paso_nivel', SIGN, 'Paso a nivel: cruce con las vías del tren', ['Cruce de dos autopistas', 'Prohibido todo', 'Cementerio cercano'], 'paso_nivel'),
      Q('obras', SIGN, 'Hombres trabajando: obras en el camino', ['Alguien busca un tesoro enterrado', 'Zona de camping', 'Fábrica cercana'], 'obras'),
      Q('resbaladizo', SIGN, 'Calzada resbaladiza', ['Pista de carreras', 'Zona de autos chocadores', 'Curvas en zigzag más adelante'], 'resbaladizo'),
      Q('no_adelantar', SIGN, 'Prohibido adelantar', ['Carril exclusivo para autos rojos', 'Prohibido estacionar en doble fila', 'Venta de autos usados'], 'no_adelantar'),
      Q('doble_mano', SIGN, 'Doble mano: se circula en los dos sentidos', ['Calle de una sola mano', 'Prohibido dar marcha atrás', 'Zona de ascensores'], 'doble_mano'),
      Q('hospital', SIGN, 'Hospital cercano', ['Cruce de caminos', 'Iglesia cercana', 'Fin de la zona urbana'], 'hospital'),
      Q('estacionamiento', SIGN, 'Estacionamiento permitido', ['Estación de tren', 'Entrada a la autopista', 'Escuela cercana'], 'estacionamiento'),
      Q('semaforo', SIGN, 'Semáforo más adelante', ['Luces de Navidad en la ruta', 'Discoteca cercana', 'Prohibido el paso a vehículos de colores'], 'semaforo'),
      Q('animales', SIGN, 'Animales sueltos en el camino', ['Feria de ganado', 'Zoológico cercano', 'Prohibido llevar animales'], 'animales'),
      Q('no_bocina', SIGN, 'Prohibido tocar bocina', ['Zona de conciertos', 'Prohibido escuchar música en el auto', 'Bocina obligatoria'], 'no_bocina')
    ],
    yate: [
      Q('babor', '¿Cómo se llama el lado izquierdo del barco, mirando hacia la proa?', 'Babor', ['Estribor', 'Popa', 'Quilla']),
      Q('estribor', '¿Cómo se llama el lado derecho del barco, mirando hacia la proa?', 'Estribor', ['Babor', 'Proa', 'Eslora']),
      Q('proa', '¿Qué es la proa?', 'La parte delantera del barco', ['La parte trasera del barco', 'El mástil principal', 'El fondo del casco']),
      Q('popa', '¿Qué es la popa?', 'La parte trasera del barco', ['La parte delantera del barco', 'La cocina del barco', 'El ancla']),
      Q('luz_babor', 'Mira las luces de navegación del barco. ¿De qué color es la luz de babor?', 'Roja', ['Verde', 'Blanca', 'Azul'], 'luces_barco'),
      Q('luz_estribor', '¿De qué color es la luz de navegación de estribor?', 'Verde', ['Roja', 'Amarilla', 'Violeta'], 'luces_barco'),
      Q('bandera_a', '¿Qué significa esta bandera del código internacional (letra A)?', 'Tengo un buzo sumergido: manténgase alejado y despacio', ['¡Hombre al agua!', 'Llevo mercancías peligrosas', 'Todo en orden a bordo'], 'bandera_a'),
      Q('bandera_o', '¿Qué significa esta bandera del código internacional (letra O)?', '¡Hombre al agua!', ['Todo en orden a bordo', 'Fiesta a bordo', 'Tengo un buzo sumergido'], 'bandera_o'),
      Q('bandera_b', '¿Qué avisa esta bandera roja del código internacional (letra B)?', 'El barco carga o descarga mercancías peligrosas', ['El barco está en venta', 'Hay un buzo sumergido', 'El capitán está de cumpleaños'], 'bandera_b'),
      Q('canal16', '¿Qué canal de radio VHF se usa para llamadas de socorro en el mar?', 'Canal 16', ['Canal 1', 'Canal 99', 'Canal 42']),
      Q('mayday', '¿Qué significa decir "Mayday" tres veces por radio?', 'Hay un peligro grave e inminente: socorro', ['Un saludo de buenos días entre barcos', 'Un pedido de combustible', 'Que llega el 1 de mayo']),
      Q('panpan', '¿Qué indica la llamada "Pan-pan" por radio?', 'Urgencia, pero sin peligro inminente', ['La hora del almuerzo', 'Peligro grave e inminente', 'Fin de la comunicación']),
      Q('nudo_vel', 'Un nudo de velocidad equivale a…', 'Una milla náutica por hora', ['Un kilómetro por hora', 'Diez metros por segundo', 'Una vuelta del ancla por minuto']),
      Q('as_de_guia', '¿Para qué sirve el nudo "as de guía"?', 'Para hacer un lazo firme que no se corre', ['Para decorar el barco', 'Para medir la profundidad', 'Para que la cuerda se suelte sola'])
    ],
    avion: [
      Q('altimetro', '¿Qué mide el altímetro?', 'La altitud del avión', ['La velocidad', 'La temperatura de la cabina', 'La cantidad de combustible']),
      Q('anemometro', '¿Qué indica el anemómetro (velocímetro) del avión?', 'La velocidad respecto del aire', ['La altitud', 'La dirección del viento en tierra', 'La presión de las ruedas']),
      Q('horizonte', '¿Para qué sirve el horizonte artificial?', 'Para ver la inclinación del avión respecto del horizonte', ['Para mirar el atardecer', 'Para medir el combustible', 'Para hablar con la torre']),
      Q('ala_izq', '¿De qué color es la luz de navegación del ala izquierda?', 'Roja', ['Verde', 'Blanca', 'Amarilla']),
      Q('ala_der', '¿De qué color es la luz de navegación del ala derecha?', 'Verde', ['Roja', 'Azul', 'Blanca']),
      Q('luz_verde', 'Estás en vuelo y la torre te apunta con una luz verde fija. ¿Qué significa?', 'Autorizado a aterrizar', ['Vuelva al aeropuerto de origen', 'El aeropuerto está cerrado', 'Aumente la velocidad']),
      Q('luz_roja', 'En vuelo, la torre te muestra una luz roja fija. ¿Qué significa?', 'Ceda el paso y siga dando vueltas en el circuito', ['Autorizado a aterrizar', 'Aterrice de inmediato', 'Puede apagar los motores']),
      Q('sq7700', '¿Qué código del transponder indica una emergencia general?', '7700', ['1234', '7600', '0000']),
      Q('sq7600', '¿Qué significa poner el transponder en 7600?', 'Falla de la radio', ['Emergencia médica a bordo', 'Vuelo de práctica', 'Pedido de café']),
      Q('alfa_b', 'En el alfabeto aeronáutico, ¿cómo se dice la letra B?', 'Bravo', ['Beta', 'Barco', 'Buenos']),
      Q('alfa_m', 'En el alfabeto aeronáutico, ¿cómo se dice la letra M?', 'Mike', ['Mamá', 'Marte', 'Metro']),
      Q('roger', '¿Qué significa "Roger" por radio?', 'Mensaje recibido', ['Me llamo Roger', 'Repita, por favor', 'Emergencia']),
      Q('umbral', '¿De qué color son las luces que marcan el inicio (umbral) de la pista?', 'Verdes', ['Violetas', 'Naranjas', 'Rosadas'])
    ],
    helicoptero: [
      Q('rotor_cola', '¿Para qué sirve el rotor de cola?', 'Para contrarrestar el giro que produce el rotor principal', ['Para enfriar el motor', 'Para ir más rápido marcha atrás', 'Para que se vea más lindo']),
      Q('rotor_principal', '¿Qué parte genera la sustentación del helicóptero?', 'El rotor principal', ['El rotor de cola', 'Los patines', 'La cabina']),
      Q('colectivo', '¿Qué hace la palanca del colectivo?', 'Cambia el ángulo de todas las palas a la vez: sube o baja el helicóptero', ['Abre las puertas', 'Llama a un colectivo', 'Cambia la estación de radio']),
      Q('ciclico', '¿Qué controla el cíclico?', 'Inclina el rotor para avanzar, retroceder o ir de costado', ['La calefacción', 'Solo el aterrizaje', 'El nivel de combustible']),
      Q('pedales', '¿Qué hacen los pedales en un helicóptero?', 'Giran la nariz a izquierda o derecha, controlando el rotor de cola', ['Frenan las ruedas', 'Aceleran el motor', 'Encienden las luces']),
      Q('autorrotacion', '¿Qué es la autorrotación?', 'Una maniobra para aterrizar si falla el motor', ['Girar sobre sí mismo para una foto', 'Un piloto automático para dormir', 'Lavar las palas en vuelo']),
      Q('efecto_suelo', '¿Qué es el efecto suelo?', 'Más sustentación cuando vuelas muy cerca del suelo', ['Que el suelo atrae al helicóptero', 'Una alfombra especial de la cabina', 'La sombra del helicóptero']),
      Q('senalero', 'El señalero cruza los brazos sobre la cabeza una y otra vez. ¿Qué significa?', 'Parada de emergencia', ['Todo bien, siga', 'Aterrice aquí', 'Un saludo amistoso'], 'senalero'),
      Q('helipuerto', '¿Qué indica una gran "H" pintada en el suelo dentro de un círculo?', 'Un helipuerto: lugar para aterrizar', ['Un hotel', 'Un hospital para helicópteros', 'Una cancha de handball'], 'helipuerto'),
      Q('mayday_h', '¿Qué palabra se dice tres veces por radio en una emergencia grave?', 'Mayday', ['Hola hola hola', 'Roger', 'Bingo']),
      Q('wilco', '¿Qué significa "Wilco" por radio?', 'Recibido y lo cumpliré', ['No entendí', 'Me llamo Wilco', 'Repita más lento']),
      Q('sq7500', '¿Qué indica el código 7500 en el transponder?', 'Interferencia ilícita (un secuestro)', ['Falla de la radio', 'Todo normal', 'Pedido de combustible'])
    ]
  };
})(window.MV = window.MV || {});
