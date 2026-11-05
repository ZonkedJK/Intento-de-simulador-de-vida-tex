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
      region: 'Latinoamérica', sport: 'futbol', name: 'Argentina', flag: '🇦🇷', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Mar del Plata', 'Salta', 'Bariloche'],
      names: { m: HISP_M.concat(['Ezequiel', 'Lisandro', 'Nahuel', 'Gastón']), f: HISP_F.concat(['Lourdes', 'Ailén', 'Micaela']) },
      last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Romero',
        'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Aguirre',
        'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rossi', 'Ferrari', 'Bianchi']
    },
    MX: {
      region: 'Latinoamérica', sport: 'boxeo', name: 'México', flag: '🇲🇽', cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Oaxaca', 'Mérida', 'Tijuana'],
      names: { m: HISP_M.concat(['Emiliano', 'Iker', 'Alonso', 'Jesús']), f: HISP_F.concat(['Itzel', 'Citlali', 'Frida']) },
      last: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz',
        'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Ruiz', 'Mendoza',
        'Aguilar', 'Ortiz', 'Moreno', 'Castillo', 'Romero', 'Álvarez', 'Chávez', 'Rivera', 'Juárez']
    },
    ES: {
      region: 'Europa', sport: 'futbol', name: 'España', flag: '🇪🇸', cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza'],
      names: { m: HISP_M.concat(['Álvaro', 'Iker', 'Unai', 'Pau', 'Jordi']), f: HISP_F.concat(['Ainhoa', 'Nerea', 'Leire', 'Montse']) },
      last: ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
        'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
        'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco', 'Molina', 'Castro']
    },
    CO: {
      region: 'Latinoamérica', sport: 'futbol', name: 'Colombia', flag: '🇨🇴', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
      names: { m: HISP_M.concat(['Juan Pablo', 'Juan David', 'Andrés Felipe']), f: HISP_F.concat(['Manuela', 'Salomé', 'Juliana']) },
      last: ['Rodríguez', 'Gómez', 'González', 'Martínez', 'García', 'López', 'Hernández', 'Sánchez', 'Ramírez', 'Pérez',
        'Díaz', 'Muñoz', 'Rojas', 'Moreno', 'Jiménez', 'Vargas', 'Castro', 'Ortiz', 'Gutiérrez', 'Ospina', 'Restrepo',
        'Cárdenas', 'Mejía', 'Zapata', 'Quintero']
    },
    CL: {
      region: 'Latinoamérica', sport: 'tenis', name: 'Chile', flag: '🇨🇱', cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco'],
      names: { m: HISP_M.concat(['Vicente', 'Cristóbal', 'Maximiliano']), f: HISP_F.concat(['Javiera', 'Constanza', 'Trinidad']) },
      last: ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda',
        'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela',
        'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro']
    },
    PE: {
      region: 'Latinoamérica', sport: 'voley', name: 'Perú', flag: '🇵🇪', cities: ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Piura', 'Iquitos'],
      names: { m: HISP_M.concat(['Piero', 'Renzo', 'Jhon']), f: HISP_F.concat(['Kiara', 'Yesenia', 'Fiorella']) },
      last: ['Quispe', 'Flores', 'Sánchez', 'Rodríguez', 'García', 'Rojas', 'Mamani', 'Huamán', 'Díaz', 'Chávez',
        'Torres', 'Ramírez', 'Mendoza', 'Vargas', 'Castillo', 'Gutiérrez', 'Cruz', 'Espinoza', 'Ramos', 'Romero']
    },
    UY: {
      region: 'Latinoamérica', sport: 'futbol', name: 'Uruguay', flag: '🇺🇾', cities: ['Montevideo', 'Salto', 'Paysandú', 'Punta del Este', 'Colonia'],
      names: { m: HISP_M, f: HISP_F },
      last: ['Rodríguez', 'González', 'Martínez', 'García', 'Fernández', 'López', 'Pérez', 'Sosa', 'Silva', 'Pereira',
        'Suárez', 'Núñez', 'Méndez', 'Cabrera', 'Olivera', 'Techera', 'De León', 'Acosta', 'Ramos', 'Díaz']
    },
    VE: {
      region: 'Latinoamérica', sport: 'beisbol', name: 'Venezuela', flag: '🇻🇪', cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Mérida'],
      names: { m: HISP_M.concat(['Yorman', 'Wilmer', 'Jesús']), f: HISP_F.concat(['Yuleisy', 'Mariángel', 'Oriana']) },
      last: ['González', 'Rodríguez', 'Pérez', 'Hernández', 'García', 'Martínez', 'López', 'Díaz', 'Sánchez', 'Romero',
        'Rojas', 'Morales', 'Ramírez', 'Medina', 'Torres', 'Castillo', 'Contreras', 'Briceño', 'Guerrero', 'Mendoza']
    },
    US: {
      region: 'América del Norte', sport: 'basquet', name: 'Estados Unidos', flag: '🇺🇸', cities: ['Nueva York', 'Los Ángeles', 'Miami', 'Chicago', 'Houston', 'Seattle', 'Las Vegas'],
      names: {
        m: ['James', 'Michael', 'John', 'David', 'Daniel', 'Ethan', 'Noah', 'Liam', 'Mason', 'Logan', 'Tyler', 'Jake', 'Ryan', 'Kevin', 'Brandon', 'Austin', 'Chase', 'Carlos', 'Luis'],
        f: ['Emily', 'Olivia', 'Emma', 'Ava', 'Madison', 'Ashley', 'Jessica', 'Hannah', 'Taylor', 'Brittany', 'Chloe', 'Megan', 'Kayla', 'Sophia', 'Lily', 'Grace', 'María', 'Sofía']
      },
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas',
        'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'García', 'Martínez', 'López']
    },
    BR: {
      region: 'Latinoamérica', sport: 'futbol', name: 'Brasil', flag: '🇧🇷', cities: ['São Paulo', 'Río de Janeiro', 'Salvador', 'Brasilia', 'Fortaleza', 'Recife'],
      names: {
        m: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Thiago', 'Bruno', 'Felipe', 'Gustavo', 'Matheus', 'Caio', 'Vinícius', 'Rodrigo', 'Leandro'],
        f: ['Ana', 'Beatriz', 'Júlia', 'Larissa', 'Fernanda', 'Camila', 'Letícia', 'Gabriela', 'Mariana', 'Bruna', 'Isabela', 'Rafaela', 'Thaís']
      },
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',
        'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Barbosa', 'Moura', 'Teixeira']
    },
    IT: {
      region: 'Europa', sport: 'futbol', name: 'Italia', flag: '🇮🇹', cities: ['Roma', 'Milán', 'Nápoles', 'Turín', 'Florencia', 'Palermo', 'Venecia'],
      names: {
        m: ['Lorenzo', 'Matteo', 'Alessandro', 'Leonardo', 'Francesco', 'Riccardo', 'Giuseppe', 'Marco', 'Luca', 'Giovanni', 'Antonio', 'Enzo'],
        f: ['Giulia', 'Sofia', 'Aurora', 'Alice', 'Ginevra', 'Chiara', 'Francesca', 'Martina', 'Giorgia', 'Valentina', 'Bianca', 'Elena']
      },
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
        'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti']
    },
    JP: {
      region: 'Asia', sport: 'beisbol', name: 'Japón', flag: '🇯🇵', cities: ['Tokio', 'Osaka', 'Kioto', 'Sapporo', 'Nagoya', 'Fukuoka'],
      names: {
        m: ['Haruto', 'Yuto', 'Sota', 'Riku', 'Ren', 'Hiroshi', 'Kenji', 'Takumi', 'Daiki', 'Kaito', 'Yuki', 'Sora'],
        f: ['Yui', 'Hina', 'Sakura', 'Aoi', 'Mei', 'Rin', 'Yuna', 'Akari', 'Hana', 'Emi', 'Keiko', 'Naomi']
      },
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
        'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu']
    },
    // — Europa —
    FR: {
      region: 'Europa', sport: 'futbol', name: 'Francia', flag: '🇫🇷', cities: ['París', 'Marsella', 'Lyon', 'Toulouse', 'Niza', 'Burdeos'],
      names: { m: ['Lucas', 'Hugo', 'Louis', 'Gabriel', 'Arthur', 'Jules', 'Léo', 'Raphaël', 'Nathan', 'Théo', 'Antoine', 'Mathis'], f: ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Léa', 'Manon', 'Inès', 'Camille', 'Juliette', 'Zoé', 'Margaux'] },
      last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Fontaine', 'Girard']
    },
    DE: {
      region: 'Europa', sport: 'futbol', name: 'Alemania', flag: '🇩🇪', cities: ['Berlín', 'Múnich', 'Hamburgo', 'Colonia', 'Fráncfort', 'Stuttgart'],
      names: { m: ['Ben', 'Paul', 'Leon', 'Finn', 'Elias', 'Jonas', 'Luis', 'Noah', 'Felix', 'Lukas', 'Max', 'Moritz'], f: ['Emma', 'Mia', 'Hannah', 'Sofia', 'Lina', 'Lea', 'Marie', 'Anna', 'Clara', 'Lena', 'Greta', 'Frieda'] },
      last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf']
    },
    GB: {
      region: 'Europa', sport: 'futbol', name: 'Reino Unido', flag: '🇬🇧', cities: ['Londres', 'Mánchester', 'Liverpool', 'Edimburgo', 'Birmingham', 'Cardiff'],
      names: { m: ['Oliver', 'George', 'Harry', 'Jack', 'Charlie', 'Thomas', 'William', 'James', 'Alfie', 'Freddie', 'Arthur', 'Leo'], f: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Emily', 'Grace', 'Poppy', 'Lily', 'Sophie', 'Ella', 'Freya', 'Charlotte'] },
      last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Evans', 'Roberts', 'Walker', 'Wright', 'Hughes', 'Green']
    },
    PT: {
      region: 'Europa', sport: 'futbol', name: 'Portugal', flag: '🇵🇹', cities: ['Lisboa', 'Oporto', 'Coímbra', 'Braga', 'Faro', 'Funchal'],
      names: { m: ['João', 'Rodrigo', 'Martim', 'Francisco', 'Santiago', 'Tomás', 'Afonso', 'Duarte', 'Miguel', 'Gonçalo', 'Diogo', 'Rafael'], f: ['Maria', 'Leonor', 'Matilde', 'Beatriz', 'Carolina', 'Inês', 'Mariana', 'Ana', 'Sofia', 'Margarida', 'Francisca', 'Joana'] },
      last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques']
    },
    NL: {
      region: 'Europa', sport: 'natacion', name: 'Países Bajos', flag: '🇳🇱', cities: ['Ámsterdam', 'Róterdam', 'La Haya', 'Utrecht', 'Eindhoven'],
      names: { m: ['Noah', 'Sem', 'Liam', 'Lucas', 'Daan', 'Finn', 'Levi', 'Milan', 'Bram', 'Jesse', 'Thijs', 'Ruben'], f: ['Emma', 'Julia', 'Mila', 'Tess', 'Sophie', 'Zoë', 'Sara', 'Nora', 'Yara', 'Eva', 'Lotte', 'Fenna'] },
      last: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos']
    },
    SE: {
      region: 'Europa', sport: 'golf', name: 'Suecia', flag: '🇸🇪', cities: ['Estocolmo', 'Gotemburgo', 'Malmö', 'Uppsala', 'Kiruna'],
      names: { m: ['William', 'Noah', 'Hugo', 'Lucas', 'Liam', 'Oliver', 'Elias', 'Alexander', 'Adam', 'Axel', 'Erik', 'Oscar'], f: ['Alice', 'Maja', 'Vera', 'Elsa', 'Astrid', 'Wilma', 'Freja', 'Ebba', 'Ella', 'Saga', 'Selma', 'Agnes'] },
      last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Lindberg', 'Lindqvist']
    },
    GR: {
      region: 'Europa', sport: 'basquet', name: 'Grecia', flag: '🇬🇷', cities: ['Atenas', 'Salónica', 'Patras', 'Heraclión', 'Rodas'],
      names: { m: ['Giorgos', 'Dimitris', 'Konstantinos', 'Nikos', 'Yannis', 'Kostas', 'Christos', 'Panagiotis', 'Vasilis', 'Alexandros', 'Stavros', 'Spyros'], f: ['Maria', 'Eleni', 'Katerina', 'Sofia', 'Georgia', 'Anna', 'Despina', 'Ioanna', 'Dimitra', 'Vasiliki', 'Christina', 'Athina'] },
      last: ['Papadopoulos', 'Pappas', 'Georgiou', 'Nikolaidis', 'Dimitriou', 'Konstantinou', 'Papageorgiou', 'Ioannou', 'Vlachos', 'Karagiannis', 'Oikonomou', 'Makris']
    },
    PL: {
      region: 'Europa', sport: 'voley', name: 'Polonia', flag: '🇵🇱', cities: ['Varsovia', 'Cracovia', 'Gdansk', 'Breslavia', 'Poznan'],
      names: { m: ['Antoni', 'Jan', 'Jakub', 'Aleksander', 'Franciszek', 'Szymon', 'Filip', 'Mikołaj', 'Wojciech', 'Kacper', 'Piotr', 'Marek'], f: ['Zuzanna', 'Julia', 'Zofia', 'Hanna', 'Maja', 'Lena', 'Alicja', 'Maria', 'Oliwia', 'Amelia', 'Wiktoria', 'Natalia'] },
      last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski']
    },
    // — Asia —
    CN: {
      region: 'Asia', sport: 'basquet', name: 'China', flag: '🇨🇳', cities: ['Pekín', 'Shanghái', 'Cantón', 'Shenzhen', 'Chengdú', 'Wuhan'],
      names: { m: ['Wei', 'Hao', 'Jun', 'Lei', 'Ming', 'Yang', 'Jie', 'Tao', 'Chen', 'Bo', 'Zhi', 'Yu'], f: ['Li', 'Mei', 'Xiu', 'Ying', 'Lan', 'Hui', 'Jing', 'Fang', 'Na', 'Xin', 'Yan', 'Ling'] },
      last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu']
    },
    KR: {
      region: 'Asia', sport: 'esports', name: 'Corea del Sur', flag: '🇰🇷', cities: ['Seúl', 'Busan', 'Incheon', 'Daegu', 'Gwangju'],
      names: { m: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ji-ho', 'Joon-young', 'Hyun-woo', 'Jae-won', 'Sung-min', 'Tae-yang', 'Woo-jin'], f: ['Seo-yeon', 'Ji-woo', 'Ha-eun', 'Min-seo', 'Su-ah', 'Ji-min', 'Yu-na', 'Da-eun', 'Chae-won', 'Hye-jin'] },
      last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Shin']
    },
    IN: {
      region: 'Asia', sport: 'tenis', name: 'India', flag: '🇮🇳', cities: ['Bombay', 'Delhi', 'Bangalore', 'Chennai', 'Calcuta', 'Jaipur'],
      names: { m: ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Rahul', 'Vikram', 'Karan', 'Ishaan', 'Sai', 'Ravi', 'Amit'], f: ['Aanya', 'Diya', 'Ananya', 'Priya', 'Isha', 'Kavya', 'Neha', 'Pooja', 'Riya', 'Saanvi', 'Meera', 'Divya'] },
      last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Rao', 'Iyer', 'Nair', 'Mehta', 'Joshi', 'Das', 'Chopra', 'Verma']
    },
    PH: {
      region: 'Asia', sport: 'basquet', name: 'Filipinas', flag: '🇵🇭', cities: ['Manila', 'Cebú', 'Dávao', 'Quezón', 'Iloílo'],
      names: { m: ['José', 'Juan', 'Mark', 'John Paul', 'Miguel', 'Carlo', 'Paolo', 'Rafael', 'Joshua', 'Angelo', 'Jericho', 'Kenneth'], f: ['María', 'Angel', 'Princess', 'Kristine', 'Jasmine', 'Nicole', 'Andrea', 'Bea', 'Camille', 'Joy', 'Liza', 'Kathryn'] },
      last: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'García', 'Mendoza', 'Torres', 'Tomas', 'Andrada', 'Castillo', 'Flores', 'Villanueva', 'Ramos']
    },
    TH: {
      region: 'Asia', sport: 'boxeo', name: 'Tailandia', flag: '🇹🇭', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Khon Kaen'],
      names: { m: ['Somchai', 'Anan', 'Chai', 'Krit', 'Niran', 'Prasert', 'Thanawat', 'Kittisak', 'Wichai', 'Pong'], f: ['Malee', 'Siriporn', 'Pim', 'Nok', 'Ploy', 'Kanya', 'Dao', 'Ratana', 'Suda', 'Nida'] },
      last: ['Saetang', 'Srisuk', 'Chaiyaporn', 'Wongsa', 'Sukjai', 'Rattanakul', 'Boonmee', 'Kaewmanee', 'Thongdee', 'Phromma', 'Sombat', 'Jaidee']
    },
    VN: {
      region: 'Asia', sport: 'futbol', name: 'Vietnam', flag: '🇻🇳', cities: ['Hanói', 'Ho Chi Minh', 'Da Nang', 'Hue', 'Hai Phong'],
      names: { m: ['Minh', 'Anh', 'Huy', 'Khang', 'Bao', 'Duc', 'Long', 'Nam', 'Phuc', 'Quang', 'Tuan', 'Hieu'], f: ['Linh', 'Mai', 'Lan', 'Ngoc', 'Thao', 'Trang', 'Huong', 'Hoa', 'Vy', 'Nhi', 'Thu', 'Yen'] },
      last: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong']
    },
    ID: {
      region: 'Asia', sport: 'voley', name: 'Indonesia', flag: '🇮🇩', cities: ['Yakarta', 'Surabaya', 'Bandung', 'Bali', 'Medan'],
      names: { m: ['Budi', 'Agus', 'Rizky', 'Dimas', 'Andi', 'Fajar', 'Arif', 'Bayu', 'Hendra', 'Wahyu', 'Yoga', 'Eko'], f: ['Siti', 'Dewi', 'Putri', 'Ayu', 'Rina', 'Sri', 'Indah', 'Nur', 'Fitri', 'Wulan', 'Lestari', 'Ratna'] },
      last: ['Santoso', 'Wijaya', 'Saputra', 'Hidayat', 'Kusuma', 'Pratama', 'Setiawan', 'Gunawan', 'Halim', 'Susanto', 'Nugroho', 'Wibowo', 'Rahman']
    },
    TR: {
      region: 'Asia', sport: 'futbol', name: 'Turquía', flag: '🇹🇷', cities: ['Estambul', 'Ankara', 'Esmirna', 'Antalya', 'Bursa'],
      names: { m: ['Yusuf', 'Eymen', 'Ömer', 'Mustafa', 'Emir', 'Ahmet', 'Mehmet', 'Ali', 'Burak', 'Can', 'Kerem', 'Arda'], f: ['Zeynep', 'Elif', 'Defne', 'Asel', 'Ecrin', 'Azra', 'Ayşe', 'Fatma', 'Ebru', 'Selin', 'Deniz', 'Melis'] },
      last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan']
    }
  };

  MV.REGIONS = ['Latinoamérica', 'América del Norte', 'Europa', 'Asia'];

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
