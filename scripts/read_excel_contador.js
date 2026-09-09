const xlsx = require('xlsx');
const fs = require('fs');
const filepath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\Planilla remuneraciones agosto 2026.xlsx';
try {
  const buf = fs.readFileSync(filepath);
  const wb = xlsx.read(buf, { type: 'buffer' });
  const wsname = wb.SheetNames[0];
  const ws = wb.Sheets[wsname];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for(let i=0; i<15; i++) {
    console.log(`Row ${i+1}:`, data[i]);
  }
} catch (e) {
  console.error(e.message);
}
