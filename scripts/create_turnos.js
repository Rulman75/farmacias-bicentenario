const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  await c.query(`
    CREATE TABLE IF NOT EXISTS rrhh_turnos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo VARCHAR(20) NOT NULL,
      hora_entrada TIME,
      hora_salida_colacion TIME,
      hora_entrada_colacion TIME,
      hora_salida TIME,
      total_horas DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      estado VARCHAR(20) DEFAULT 'ACTIVO',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created rrhh_turnos');
  c.end();
}
run().catch(console.error);
