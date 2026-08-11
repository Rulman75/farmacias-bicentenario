const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function importCsv() {
  const connection = await mysql.createConnection({
    host: 'mysqlfarmab.acdata.cl',
    user: 'adm',
    password: 'admsoftware143',
    database: 'farmacia'
  });

  try {
    const files = ['MASIVO_HUAMACHUCO.csv'];
    
    for (const fileName of files) {
      const filePath = path.join(__dirname, 'public', fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`Archivo ${fileName} no encontrado, saltando...`);
        continue;
      }
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      
      console.log(`Encontradas ${lines.length} líneas en ${fileName}...`);
      let inserted = 0;
      
      for (const line of lines) {
        const parts = line.split(';');
        if (parts.length >= 5) {
          const cod_sucursal = parseInt(parts[0]);
          const cod_art = parseInt(parts[1]);
          const codigo_ingresado = parts[2];
          const cantidad = parseFloat(parts[3]);
          
          const dateParts = parts[4].split('-');
          let fecha_vencimiento = parts[4];
          if (dateParts.length === 3) {
             fecha_vencimiento = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          }
          
          await connection.execute(`
            INSERT INTO ingreso_vencimientos 
            (cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro) 
            VALUES (?, ?, ?, ?, ?, ?)
          `, [cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, 'Carga Masiva ' + fileName]);
          
          inserted++;
        }
      }
      console.log(`Carga exitosa: ${inserted} registros insertados desde ${fileName}.`);
    }
  } catch (error) {
    console.error("Error importando el archivo:", error);
  } finally {
    await connection.end();
  }
}

importCsv();
