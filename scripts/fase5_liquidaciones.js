const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  try {
    console.log('Creando rrhh_liquidaciones...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rrhh_liquidaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        periodo VARCHAR(7) NOT NULL,
        dias_trabajados INT NOT NULL DEFAULT 30,
        
        sueldo_base DECIMAL(10,2) NOT NULL DEFAULT 0,
        gratificacion DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_imponible DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_no_imponible DECIMAL(10,2) NOT NULL DEFAULT 0,
        
        monto_afp DECIMAL(10,2) NOT NULL DEFAULT 0,
        monto_salud DECIMAL(10,2) NOT NULL DEFAULT 0,
        monto_cesantia DECIMAL(10,2) NOT NULL DEFAULT 0,
        monto_impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_descuentos DECIMAL(10,2) NOT NULL DEFAULT 0,
        
        liquido_pagar DECIMAL(10,2) NOT NULL DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_trabajador_periodo (trabajador_id, periodo),
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creando rrhh_liquidaciones_detalle...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rrhh_liquidaciones_detalle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        liquidacion_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL, -- 'HABER_IMPONIBLE', 'HABER_NO_IMPONIBLE', 'DESCUENTO_LEGAL', 'DESCUENTO_VARIO'
        concepto VARCHAR(255) NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (liquidacion_id) REFERENCES rrhh_liquidaciones(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Migración de Fase B y C exitosa.');
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

run();
