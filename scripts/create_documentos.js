const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rrhh_documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        tipo_documento VARCHAR(50) NOT NULL,
        archivo_url VARCHAR(500) NOT NULL,
        fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla rrhh_documentos creada con éxito.');
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

run();
