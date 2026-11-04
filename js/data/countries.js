/* Mil Vidas — países, nombres y especies de mascotas. */
(function (MV) {
  'use strict';

  const HISP_M = ['Mateo', 'Santiago', 'Sebastián', 'Matías', 'Nicolás', 'Diego', 'Joaquín', 'Lucas', 'Benjamín',
    'Tomás', 'Martín', 'Facundo', 'Emiliano', 'Alejandro', 'Gabriel', 'Daniel', 'Pablo', 'Javier', 'Andrés',
    'Felipe', 'Rodrigo', 'Ignacio', 'Agustín', 'Bruno', 'Thiago', 'Lautaro', 'Hugo', 'Leo', 'Valentín', 'Julián',
    'Franco', 'Gonzalo', 'Esteban', 'Raúl', 'Ramiro', 'Fernando', 'Ricardo', 'Héctor', 'Omar', 'Luis', 'Jorge',
    'Carlos', 'Manuel', 'Kevin', 'Brian', 'Cristian', 'Maximiliano', 'Ezequiel', 'Elías', 'Simón', 'Renato', 'Dante'];
  const HISP_F = ['Sofía', 'Valentina', 'Isabella', 'Camila', 'Martina', 'Lucía', 'Emma', 'Mía', 'Catalina',
    'Victoria', 'Julieta', 'Florencia', 'Agustina', 'Abril', 'Renata', 'Antonella', 'Paula', 'Daniela', 'Gabriela',
    'Carolina', 'Mariana', 'Natalia', 'Ximena', 'Fernanda', 'Regina', 'Alba', 'Carla', 'Elena', 'Sara', 'Valeria',
    'Lola', 'Rocío', 'Milagros', 'Belén', 'Ana', 'María', 'Laura', 'Andrea', 'Paola', 'Romina', 'Brenda', 'Jazmín',
    'Luciana', 'Aitana', 'Noa', 'Guadalupe', 'Pilar', 'Celeste', 'Olivia', 'Bianca', 'Josefina', 'Zoe'];

  MV.COUNTRIES = {
    AR: {
      name: 'Argentina', flag: '🇦🇷', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Mar del Plata', 'Salta', 'Bariloche'],
      names: { m: HISP_M.concat(['Ezequiel', 'Lisandro', 'Nahuel', 'Gastón']), f: HISP_F.concat(['Lourdes', 'Ailén', 'Micaela']) },
      last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Romero',
        'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Aguirre',
        'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rossi', 'Ferrari', 'Bianchi']
    },
    MX: {
      name: 'México', flag: '🇲🇽', cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Oaxaca', 'Mérida', 'Tijuana'],
      names: { m: HISP_M.concat(['Emiliano', 'Iker', 'Alonso', 'Jesús']), f: HISP_F.concat(['Itzel', 'Citlali', 'Frida']) },
      last: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz',
        'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Ruiz', 'Mendoza',
        'Aguilar', 'Ortiz', 'Moreno', 'Castillo', 'Romero', 'Álvarez', 'Chávez', 'Rivera', 'Juárez']
    },
    ES: {
      name: 'España', flag: '🇪🇸', cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza'],
      names: { m: HISP_M.concat(['Álvaro', 'Iker', 'Unai', 'Pau', 'Jordi']), f: HISP_F.concat(['Ainhoa', 'Nerea', 'Leire', 'Montse']) },
      last: ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
        'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
        'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco', 'Molina', 'Castro']
    },
    CO: {
      name: 'Colombia', flag: '🇨🇴', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
      names: { m: HISP_M.concat(['Juan Pablo', 'Juan David', 'Andrés Felipe']), f: HISP_F.concat(['Manuela', 'Salomé', 'Juliana']) },
      last: ['Rodríguez', 'Gómez', 'González', 'Martínez', 'García', 'López', 'Hernández', 'Sánchez', 'Ramírez', 'Pérez',
        'Díaz', 'Muñoz', 'Rojas', 'Moreno', 'Jiménez', 'Vargas', 'Castro', 'Ortiz', 'Gutiérrez', 'Ospina', 'Restrepo',
        'Cárdenas', 'Mejía', 'Zapata', 'Quintero']
    },
    CL: {
      name: 'Chile', flag: '🇨🇱', cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco'],
      names: { m: HISP_M.concat(['Vicente', 'Cristóbal', 'Maximiliano']), f: HISP_F.concat(['Javiera', 'Constanza', 'Trinidad']) },
      last: ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda',
        'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela',
        'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro']
    },
    PE: {
      name: 'Perú', flag: '🇵🇪', cities: ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Piura', 'Iquitos'],
      names: { m: HISP_M.concat(['Piero', 'Renzo', 'Jhon']), f: HISP_F.concat(['Kiara', 'Yesenia', 'Fiorella']) },
      last: ['Quispe', 'Flores', 'Sánchez', 'Rodríguez', 'García', 'Rojas', 'Mamani', 'Huamán', 'Díaz', 'Chávez',
        'Torres', 'Ramírez', 'Mendoza', 'Vargas', 'Castillo', 'Gutiérrez', 'Cruz', 'Espinoza', 'Ramos', 'Romero']
    },
    UY: {
      name: 'Uruguay', flag: '🇺🇾', cities: ['Montevideo', 'Salto', 'Paysandú', 'Punta del Este', 'Colonia'],
      names: { m: HISP_M, f: HISP_F },
      last: ['Rodríguez', 'González', 'Martínez', 'García', 'Fernández', 'López', 'Pérez', 'Sosa', 'Silva', 'Pereira',
        'Suárez', 'Núñez', 'Méndez', 'Cabrera', 'Olivera', 'Techera', 'De León', 'Acosta', 'Ramos', 'Díaz']
    },
    VE: {
      name: 'Venezuela', flag: '🇻🇪', cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Mérida'],
      names: { m: HISP_M.concat(['Yorman', 'Wilmer', 'Jesús']), f: HISP_F.concat(['Yuleisy', 'Mariángel', 'Oriana']) },
      last: ['González', 'Rodríguez', 'Pérez', 'Hernández', 'García', 'Martínez', 'López', 'Díaz', 'Sánchez', 'Romero',
        'Rojas', 'Morales', 'Ramírez', 'Medina', 'Torres', 'Castillo', 'Contreras', 'Briceño', 'Guerrero', 'Mendoza']
    },
    US: {
      name: 'Estados Unidos', flag: '🇺🇸', cities: ['Nueva York', 'Los Ángeles', 'Miami', 'Chicago', 'Houston', 'Seattle', 'Las Vegas'],
      names: {
        m: ['James', 'Michael', 'John', 'David', 'Daniel', 'Ethan', 'Noah', 'Liam', 'Mason', 'Logan', 'Tyler', 'Jake', 'Ryan', 'Kevin', 'Brandon', 'Austin', 'Chase', 'Carlos', 'Luis'],
        f: ['Emily', 'Olivia', 'Emma', 'Ava', 'Madison', 'Ashley', 'Jessica', 'Hannah', 'Taylor', 'Brittany', 'Chloe', 'Megan', 'Kayla', 'Sophia', 'Lily', 'Grace', 'María', 'Sofía']
      },
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas',
        'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'García', 'Martínez', 'López']
    },
    BR: {
      name: 'Brasil', flag: '🇧🇷', cities: ['São Paulo', 'Río de Janeiro', 'Salvador', 'Brasilia', 'Fortaleza', 'Recife'],
      names: {
        m: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Thiago', 'Bruno', 'Felipe', 'Gustavo', 'Matheus', 'Caio', 'Vinícius', 'Rodrigo', 'Leandro'],
        f: ['Ana', 'Beatriz', 'Júlia', 'Larissa', 'Fernanda', 'Camila', 'Letícia', 'Gabriela', 'Mariana', 'Bruna', 'Isabela', 'Rafaela', 'Thaís']
      },
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',
        'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Barbosa', 'Moura', 'Teixeira']
    },
    IT: {
      name: 'Italia', flag: '🇮🇹', cities: ['Roma', 'Milán', 'Nápoles', 'Turín', 'Florencia', 'Palermo', 'Venecia'],
      names: {
        m: ['Lorenzo', 'Matteo', 'Alessandro', 'Leonardo', 'Francesco', 'Riccardo', 'Giuseppe', 'Marco', 'Luca', 'Giovanni', 'Antonio', 'Enzo'],
        f: ['Giulia', 'Sofia', 'Aurora', 'Alice', 'Ginevra', 'Chiara', 'Francesca', 'Martina', 'Giorgia', 'Valentina', 'Bianca', 'Elena']
      },
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
        'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti']
    },
    JP: {
      name: 'Japón', flag: '🇯🇵', cities: ['Tokio', 'Osaka', 'Kioto', 'Sapporo', 'Nagoya', 'Fukuoka'],
      names: {
        m: ['Haruto', 'Yuto', 'Sota', 'Riku', 'Ren', 'Hiroshi', 'Kenji', 'Takumi', 'Daiki', 'Kaito', 'Yuki', 'Sora'],
        f: ['Yui', 'Hina', 'Sakura', 'Aoi', 'Mei', 'Rin', 'Yuna', 'Akari', 'Hana', 'Emi', 'Keiko', 'Naomi']
      },
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
        'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu']
    }
  };

  MV.PET_NAMES = ['Firulais', 'Michi', 'Toby', 'Luna', 'Rocky', 'Pelusa', 'Chispa', 'Manchas', 'Bigotes', 'Max', 'Nala',
    'Simba', 'Coco', 'Pancho', 'Lola', 'Chocolate', 'Canela', 'Copito', 'Sr. Pelusa', 'Duquesa', 'Tornado', 'Pochoclo',
    'Milanesa', 'Empanada', 'Tito', 'Kira', 'Zeus', 'Thor', 'Pirata', 'Morcilla', 'Dr. Ladridos', 'Bombón', 'Fideo',
    'Gordo', 'Princesa', 'Satanás', 'Galleta', 'Churro', 'Ramón', 'Turrón'];

  MV.SPECIES = {
    perro: { name: 'Perro', icon: '🐕', life: [10, 16], price: 300 },
    gato: { name: 'Gato', icon: '🐈', life: [12, 20], price: 150 },
    conejo: { name: 'Conejo', icon: '🐇', life: [7, 12], price: 80 },
    hamster: { name: 'Hámster', icon: '🐹', life: [2, 3], price: 30 },
    pez: { name: 'Pez', icon: '🐠', life: [2, 7], price: 15 },
    loro: { name: 'Loro', icon: '🦜', life: [25, 60], price: 900 },
    tortuga: { name: 'Tortuga', icon: '🐢', life: [30, 90], price: 200 },
    serpiente: { name: 'Serpiente', icon: '🐍', life: [15, 25], price: 400 },
    caballo: { name: 'Caballo', icon: '🐎', life: [25, 32], price: 8000 },
    cerdo: { name: 'Cerdito', icon: '🐖', life: [12, 18], price: 500 },
    iguana: { name: 'Iguana', icon: '🦎', life: [10, 20], price: 250 },
    huron: { name: 'Hurón', icon: '🦦', life: [6, 10], price: 350 }
  };
})(window.MV = window.MV || {});
