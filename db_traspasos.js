const mysql = require('mysql2/promise');
process.loadEnvFile('.env');
async function run() {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS traspasos_cabecera (
        id_traspaso INT AUTO_INCREMENT PRIMARY KEY,
        correlativo VARCHAR(50) NOT NULL UNIQUE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(20) DEFAULT 'PROCESADO'
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS traspasos_detalle (
        id_detalle INT AUTO_INCREMENT PRIMARY KEY,
        id_traspaso INT,
        cod_sucursal_origen INT,
        cod_sucursal_destino INT,
        cod_art VARCHAR(50),
        cantidad INT,
        fecha_vencimiento DATE,
        FOREIGN KEY (id_traspaso) REFERENCES traspasos_cabecera(id_traspaso)
      )
    `);

    console.log("Tablas creadas");
    conn.end();
  } catch(e) {
    console.error(e);
  }
}
run();
