const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  try {
    console.log('Agregando tasa a rrhh_afp...');
    try {
      await conn.query('ALTER TABLE rrhh_afp ADD COLUMN tasa_comision DECIMAL(5,2) DEFAULT 0 AFTER nombre');
    } catch (e) {
      // Ignore if already exists
    }

    // Set some defaults based on 2024 roughly
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 1.44 WHERE nombre LIKE '%Capital%'`);
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 1.45 WHERE nombre LIKE '%Cuprum%'`);
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 1.44 WHERE nombre LIKE '%Habitat%'`);
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 0.58 WHERE nombre LIKE '%Modelo%'`);
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 1.45 WHERE nombre LIKE '%Provida%'`);
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 1.16 WHERE nombre LIKE '%Planvital%'`);
    await conn.query(`UPDATE rrhh_afp SET tasa_comision = 0.49 WHERE nombre LIKE '%Uno%'`);

    console.log('Creando rrhh_parametros_mensuales...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rrhh_parametros_mensuales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        periodo VARCHAR(7) NOT NULL UNIQUE,
        uf DECIMAL(10,2) NOT NULL,
        utm DECIMAL(10,2) NOT NULL,
        sueldo_minimo INT NOT NULL,
        tope_afp DECIMAL(10,2) NOT NULL DEFAULT 84.3,
        tope_cesantia DECIMAL(10,2) NOT NULL DEFAULT 126.6,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert current month just as example (August 2024 values approx)
    await conn.query(`
      INSERT IGNORE INTO rrhh_parametros_mensuales (periodo, uf, utm, sueldo_minimo, tope_afp, tope_cesantia)
      VALUES ('2024-08', 37600.00, 65901.00, 500000, 84.3, 126.6)
    `);

    console.log('Creando rrhh_haberes_fijos...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rrhh_haberes_fijos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL UNIQUE,
        colacion INT DEFAULT 0,
        movilizacion INT DEFAULT 0,
        plan_isapre_uf DECIMAL(10,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Migración de Fase A (Remuneraciones) exitosa.');
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

run();
