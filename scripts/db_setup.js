const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'mysqlfarmab.acdata.cl',
    user: 'adm',
    password: 'admsoftware143',
    database: 'farmacia',
    port: 3306
  });

  try {
    // 1. Audit table
    console.log("Creating movimientos_inventario...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
        cod_sucursal INT NOT NULL,
        cod_art INT NOT NULL,
        tipo_movimiento VARCHAR(50) NOT NULL,
        cantidad_anterior DECIMAL(10,2) NOT NULL,
        cantidad_nueva DECIMAL(10,2) NOT NULL,
        id_referencia VARCHAR(50),
        usuario VARCHAR(100),
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        observacion TEXT,
        INDEX (cod_sucursal, cod_art),
        INDEX (fecha)
      )
    `);

    // 2. Zero table
    console.log("Creating ingreso_vencimiento_final...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ingreso_vencimiento_final LIKE ingreso_vencimientos
    `);

    // Add motivo_cierre if it doesn't exist (handle error if already exists)
    try {
      await connection.execute(`
        ALTER TABLE ingreso_vencimiento_final ADD COLUMN motivo_cierre VARCHAR(50) DEFAULT 'HISTORICO'
      `);
      console.log("Added column motivo_cierre.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("motivo_cierre column already exists.");
      } else {
        throw e;
      }
    }
    
    // Add fecha_cierre if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE ingreso_vencimiento_final ADD COLUMN fecha_cierre DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
      console.log("Added column fecha_cierre.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("fecha_cierre column already exists.");
      } else {
        throw e;
      }
    }

    // 3. Move existing zeros
    console.log("Moving existing zeros...");
    const [result] = await connection.execute(`
      INSERT INTO ingreso_vencimiento_final 
      (id, cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro)
      SELECT id, cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro 
      FROM ingreso_vencimientos 
      WHERE cantidad <= 0
    `);
    console.log(`Moved ${result.affectedRows} rows.`);

    const [delResult] = await connection.execute(`
      DELETE FROM ingreso_vencimientos WHERE cantidad <= 0
    `);
    console.log(`Deleted ${delResult.affectedRows} rows from main table.`);

    // 4. Update traspaso states if needed (not needed since we will handle it in app logic, but let's make sure the table can hold 'GENERADO' etc, wait, estado is just VARCHAR probably. Let's check.)
    
    console.log("Done.");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}

run();
