const mysql = require('mysql2/promise');

async function deleteHuamachuco() {
  const connection = await mysql.createConnection({
    host: 'mysqlfarmab.acdata.cl',
    user: 'adm',
    password: 'admsoftware143',
    database: 'farmacia'
  });
  try {
    const [result] = await connection.execute('DELETE FROM ingreso_vencimientos WHERE cod_sucursal = 3');
    console.log(`Borrados ${result.affectedRows} registros de Huamachuco (sucursal 3).`);
  } catch (error) {
    console.error("Error borrando:", error);
  } finally {
    await connection.end();
  }
}

deleteHuamachuco();
