const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || 'mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const connection = await pool.getConnection();
  try {
    console.log("Añadiendo columna cod_sucursal a usuarioCatalogo...");
    
    const [columns] = await connection.query("SHOW COLUMNS FROM usuarioCatalogo LIKE 'cod_sucursal'");
    if (columns.length === 0) {
      await connection.query("ALTER TABLE usuarioCatalogo ADD COLUMN cod_sucursal INT DEFAULT NULL");
      console.log("Columna añadida exitosamente.");
    } else {
      console.log("La columna ya existe.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    connection.release();
    pool.end();
  }
}

run();
