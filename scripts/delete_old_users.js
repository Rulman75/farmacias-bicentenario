const xlsx = require('xlsx');
const mysql = require('mysql2/promise');

async function run() {
  try {
    const filePath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\BASE DE DATOS_TRABAJADA_RAUL.xlsx';
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['FARMACIA'];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    let excelRuts = [];
    
    for (const row of data) {
      if (!row['NOMBRES'] && !row['APELLIDO 1']) continue;
      
      let rutDoc = row['NUMERO'] || '';
      let digito = row['DIGITO'] || '';
      let rut = rutDoc ? `${rutDoc}-${digito}` : null;
      if (rut) {
        excelRuts.push(rut);
      }
    }

    console.log(`RUTs encontrados en Excel: ${excelRuts.length}`);
    
    const connection = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
    
    // Buscar los IDs de los trabajadores que NO estan en el Excel
    const placeholders = excelRuts.map(() => '?').join(',');
    const [rows] = await connection.query(`SELECT id, rut, nombres, apellido_paterno FROM rrhh_trabajadores WHERE rut NOT IN (${placeholders})`, excelRuts);
    
    console.log(`Trabajadores a eliminar (no están en Excel): ${rows.length}`);
    
    if (rows.length > 0) {
      const idsToDelete = rows.map(r => r.id);
      console.log('Eliminando trabajadores:', rows.map(r => `${r.rut} - ${r.nombres} ${r.apellido_paterno}`));
      
      const idPlaceholders = idsToDelete.map(() => '?').join(',');
      
      // Eliminar dependencias
      const tables = [
        'rrhh_contratos', 
        'rrhh_haberes_fijos', 
        'rrhh_anticipos', 
        'rrhh_finiquitos', 
        'rrhh_liquidaciones', 
        'rrhh_ausentismos', 
        'rrhh_documentos'
      ];
      
      for (const table of tables) {
        try {
           await connection.query(`DELETE FROM ${table} WHERE trabajador_id IN (${idPlaceholders})`, idsToDelete);
           console.log(`Limpiado: ${table}`);
        } catch (e) {
           console.log(`No se pudo limpiar ${table} (quizas no existe o no tiene trabajador_id):`, e.message);
        }
      }
      
      // Finalmente, eliminar trabajadores
      const [delResult] = await connection.query(`DELETE FROM rrhh_trabajadores WHERE id IN (${idPlaceholders})`, idsToDelete);
      console.log(`Trabajadores eliminados: ${delResult.affectedRows}`);
    } else {
      console.log('No hay trabajadores para eliminar.');
    }
    
    await connection.end();
  } catch (error) {
    console.error("Error general:", error);
  }
}

run();
