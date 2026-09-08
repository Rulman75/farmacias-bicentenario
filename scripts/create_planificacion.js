const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  await c.query(`
    CREATE TABLE IF NOT EXISTS rrhh_turnos_asignados (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trabajador_id INT NOT NULL,
      fecha DATE NOT NULL,
      turno_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY worker_date (trabajador_id, fecha)
    )
  `);
  console.log('Created rrhh_turnos_asignados');
  c.end();
}
run().catch(console.error);
