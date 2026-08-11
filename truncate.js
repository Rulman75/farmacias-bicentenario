const mysql = require('mysql2/promise');

async function truncateTable() {
  const connection = await mysql.createConnection({
    host: 'mysqlfarmab.acdata.cl',
    user: 'adm',
    password: 'admsoftware143',
    database: 'farmacia'
  });

  try {
    await connection.execute('TRUNCATE TABLE ingreso_vencimientos');
    console.log("Tabla ingreso_vencimientos vaciada exitosamente.");
  } catch (error) {
    console.error("Error al vaciar la tabla:", error);
  } finally {
    await connection.end();
  }
}

truncateTable();
