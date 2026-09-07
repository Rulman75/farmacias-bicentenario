const xlsx = require('xlsx');

try {
  const filePath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\ASISTENCIA 2026.xlsx';
  const workbook = xlsx.readFile(filePath);
  
  console.log("Hojas disponibles:", workbook.SheetNames);
  
  if (workbook.SheetNames.includes('ASISTENCIA 2026')) {
    const sheet = workbook.Sheets['ASISTENCIA 2026'];
    
    // Convert to JSON, showing the raw headers (range 0 to get header row)
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Total filas:", data.length);
    console.log("Muestra de las primeras 15 filas:");
    for (let i = 0; i < Math.min(15, data.length); i++) {
      console.log(`Fila ${i + 1}:`, data[i]);
    }
  } else {
    console.log("No se encontró la hoja 'ASISTENCIA 2026'.");
  }
} catch (error) {
  console.error("Error al leer el archivo:", error);
}
