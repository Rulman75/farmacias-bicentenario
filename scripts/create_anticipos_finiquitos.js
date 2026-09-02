const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');

  try {
    console.log('Iniciando creación de tablas para Anticipos y Finiquitos...');

    // Tabla Anticipos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rrhh_anticipos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        periodo VARCHAR(7) NOT NULL,
        fecha_emision DATE NOT NULL,
        monto INT NOT NULL,
        observacion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla rrhh_anticipos verificada/creada.');

    // Tabla Finiquitos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rrhh_finiquitos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        fecha_emision DATE NOT NULL,
        fecha_termino DATE NOT NULL,
        causal_legal VARCHAR(150) NOT NULL,
        anos_servicio INT DEFAULT 0,
        vacaciones_pendientes_dias DECIMAL(5,2) DEFAULT 0,
        monto_indemnizacion_anos INT DEFAULT 0,
        monto_mes_aviso INT DEFAULT 0,
        monto_vacaciones INT DEFAULT 0,
        total_a_pagar INT DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'BORRADOR',
        observacion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla rrhh_finiquitos verificada/creada.');

    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await connection.end();
  }
}

main();
