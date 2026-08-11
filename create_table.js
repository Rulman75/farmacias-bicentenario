const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ingreso_vencimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cod_sucursal SMALLINT(4) UNSIGNED NOT NULL,
        cod_art INT(7) UNSIGNED NOT NULL,
        codigo_ingresado VARCHAR(20) NOT NULL,
        cantidad DOUBLE(12,2) NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        usuario_registro VARCHAR(60) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (cod_sucursal),
        INDEX (cod_art),
        INDEX (fecha_vencimiento)
      )
    `);
    
    console.log('Tabla ingreso_vencimientos creada correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
