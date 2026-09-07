const xlsx = require('xlsx');

try {
  const filePath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\BASE DE DATOS_TRABAJADA_RAUL.xlsx';
  const workbook = xlsx.readFile(filePath);
  
  console.log("Hojas encontradas:", workbook.SheetNames);
  
  // Analizar cada hoja
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Hoja: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    // Obtener en formato JSON array, leyendo los headers
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length > 0) {
      console.log("Columnas (Headers):");
      console.log(data[0]);
      if (data.length > 1) {
        console.log("Primera fila de datos:");
        console.log(data[1]);
      }
    } else {
      console.log("(Hoja vacía)");
    }
  });

} catch (error) {
  console.error("Error al leer el archivo:", error.message);
}
