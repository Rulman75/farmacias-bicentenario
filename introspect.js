const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  try {
    const connection = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
    const [tables] = await connection.query('SHOW TABLES');
    let schemaStr = 'Estructura de Base de Datos: farmacia\n===================================\n';
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      schemaStr += `\nTabla: ${tableName}\n`;
      schemaStr += `-----------------------------------\n`;
      columns.forEach(col => {
        schemaStr += `- ${col.Field} (${col.Type}) | Null: ${col.Null} | Key: ${col.Key}\n`;
      });
    }
    
    fs.writeFileSync('schema_dump.txt', schemaStr);
    console.log('Schema extracted to schema_dump.txt');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
