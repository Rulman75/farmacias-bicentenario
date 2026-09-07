const xlsx = require('xlsx');
const fs = require('fs');

function excelDateToJSDate(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const parts = serial.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
      } else if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY-MM-DD
      }
    }
    return null;
  }
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  const year = date_info.getFullYear();
  const month = String(date_info.getMonth() + 1).padStart(2, '0');
  const day = String(date_info.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

try {
  const filePath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\BASE DE DATOS_TRABAJADA_RAUL.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets['FARMACIA'];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  let sqlStatements = [];
  
  for (const row of data) {
    if (!row['NOMBRES'] && !row['APELLIDO 1']) continue;
    
    let rutDoc = row['NUMERO'] || '';
    let digito = row['DIGITO'] || '';
    let rut = rutDoc ? `${rutDoc}-${digito}` : null;
    if (!rut) continue;
    
    const nombres = row['NOMBRES'] || '';
    const ap1 = row['APELLIDO 1'] || '';
    const ap2 = row['APELLIDO 2'] || '';
    const nacionalidad = row['NACIONALIDAD'] || 'CHILENA';
    const fechaNac = row['FECHA NACIMIENTO'] ? excelDateToJSDate(row['FECHA NACIMIENTO']) : null;
    const fechaContrato = row['FECHA CONTRATO'] ? excelDateToJSDate(row['FECHA CONTRATO']) : null;
    const direccion = row['DIRECCION'] || '';
    const celular = row['CELULAR'] ? `+56 ${row['CELULAR']}` : '';
    const correo = row['CORREO ELECTRONICO'] || '';
    const estadoCivil = row['ESTADO CIVIL'] || 'Soltero/a';
    const nivelEdu = row['NIVEL EDUCACIONAL'] || '';
    const banco = row['BANCO'] || '';
    const tipoCta = row['TIPO CUENTA'] || '';
    const numCta = row['NUMERO2'] || '';
    const afpName = row['REGIMEN PREVISIONAL'] || '';
    const saludName = row['REGIMEN SALUD'] || '';
    const esRepLegal = (row['REP. LEGAL'] === 'SI') ? 1 : 0;
    const entregaRiohs = (row['ENTREGA RIOHS'] === 'SI') ? 1 : 0;

    // Contract info
    const sueldoBase = row['SUELDO BASE'] || 0;
    const movCol = row['MOV Y COL'] || 0;
    const cargoNombre = row['CARGO'] || 'Trabajador';
    
    let qTrabajador = `
      INSERT INTO rrhh_trabajadores (
        rut, nombres, apellido_paterno, apellido_materno, nacionalidad, fecha_nacimiento, 
        direccion, telefono, email, nivel_educacional, estado_civil, 
        afp_id, salud_id, cargas_familiares, banco, tipo_cuenta, numero_cuenta, entrega_riohs, es_representante_legal
      ) VALUES (
        '${rut}', '${nombres.replace(/'/g, "''")}', '${ap1.replace(/'/g, "''")}', '${ap2.replace(/'/g, "''")}', 
        '${nacionalidad.replace(/'/g, "''")}', ${fechaNac ? `'${fechaNac}'` : 'NULL'}, 
        '${direccion.replace(/'/g, "''")}', '${celular.replace(/'/g, "''")}', '${correo.replace(/'/g, "''")}', 
        '${nivelEdu.replace(/'/g, "''")}', '${estadoCivil.replace(/'/g, "''")}', 
        (SELECT id FROM rrhh_afp WHERE nombre LIKE '%${afpName.substring(0,4)}%' LIMIT 1), 
        (SELECT id FROM rrhh_salud WHERE nombre LIKE '%${saludName.substring(0,4)}%' LIMIT 1), 
        0, '${banco.replace(/'/g, "''")}', '${tipoCta.replace(/'/g, "''")}', '${numCta}', 
        ${entregaRiohs}, ${esRepLegal}
      )
      ON DUPLICATE KEY UPDATE 
        nombres=VALUES(nombres), apellido_paterno=VALUES(apellido_paterno), apellido_materno=VALUES(apellido_materno),
        banco=VALUES(banco), tipo_cuenta=VALUES(tipo_cuenta), numero_cuenta=VALUES(numero_cuenta),
        nacionalidad=VALUES(nacionalidad), nivel_educacional=VALUES(nivel_educacional);
    `;
    sqlStatements.push(qTrabajador.trim().replace(/\n/g, ' '));

    // Contract mapping
    if (sueldoBase > 0) {
      // First ensure cargo exists
      sqlStatements.push(`INSERT IGNORE INTO rrhh_cargos (nombre, sueldo_base_referencial) VALUES ('${cargoNombre.replace(/'/g, "''")}', ${sueldoBase});`);
      
      // Update or insert contract
      let qContrato = `
        INSERT INTO rrhh_contratos (trabajador_id, cargo_id, sueldo_base, fecha_inicio, tipo_contrato, estado)
        SELECT t.id, c.id, ${sueldoBase}, ${fechaContrato ? `'${fechaContrato}'` : 'CURRENT_DATE'}, 'Indefinido', 'ACTIVO'
        FROM rrhh_trabajadores t, rrhh_cargos c
        WHERE t.rut = '${rut}' AND c.nombre = '${cargoNombre.replace(/'/g, "''")}'
        ON DUPLICATE KEY UPDATE sueldo_base=${sueldoBase}, cargo_id=VALUES(cargo_id);
      `;
      sqlStatements.push(qContrato.trim().replace(/\n/g, ' '));
      
      // Fixed haberes
      let colacion = Math.floor(movCol / 2);
      let movilizacion = Math.floor(movCol / 2);
      let qHaberes = `
        INSERT INTO rrhh_haberes_fijos (trabajador_id, colacion, movilizacion)
        SELECT id, ${colacion}, ${movilizacion} FROM rrhh_trabajadores WHERE rut = '${rut}'
        ON DUPLICATE KEY UPDATE colacion=${colacion}, movilizacion=${movilizacion};
      `;
      sqlStatements.push(qHaberes.trim().replace(/\n/g, ' '));
    }
  }
  
  const fileContent = `
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const queries = [
      ${sqlStatements.map(q => '`' + q + '`').join(',\n      ')}
    ];

    let count = 0;
    for (const q of queries) {
      if(q.trim() !== '') {
        await connection.query(q);
        count++;
      }
    }

    return NextResponse.json({ success: true, message: \`\${count} instrucciones SQL ejecutadas para importar datos.\` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
  `;

  fs.writeFileSync('src/app/api/db-setup/import-excel/route.ts', fileContent.trim());
} catch (error) {
  console.error("Error al leer el archivo:", error);
}
