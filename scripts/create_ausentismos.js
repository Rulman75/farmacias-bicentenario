const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rrhh_ausentismos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_termino DATE NOT NULL,
        dias INT NOT NULL DEFAULT 0,
        motivo TEXT,
        estado VARCHAR(20) DEFAULT 'APROBADO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla rrhh_ausentismos creada con éxito.');
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

run();
