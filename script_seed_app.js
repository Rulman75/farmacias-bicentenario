const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ uri: 'mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia' });
  const connection = await pool.getConnection();
  try {
    await connection.query('INSERT IGNORE INTO aplicaciones (id_apli, nombre_apli, ruta) VALUES (7, "Gestión Aplicaciones", "/admin/aplicaciones")');
    await connection.query('INSERT IGNORE INTO perfil_apli (id_perfil, id_apli) VALUES (1, 7)');
    console.log("DB updated");
  } finally {
    connection.release();
    process.exit(0);
  }
}
run();
