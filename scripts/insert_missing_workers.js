const xlsx = require('xlsx');
const fs = require('fs');
const mysql = require('mysql2/promise');

async function insertMissingWorkers() {
  const filepath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\Planilla remuneraciones agosto 2026.xlsx';
  const buf = fs.readFileSync(filepath);
  const wb = xlsx.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

  const connection = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  let insertedCount = 0;

  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;
    
    let run = row[4];
    if (!run) continue;
    run = run.toString().trim();
    if (run.toUpperCase() === 'RUN' || run === '') continue;
    
    const dv = row[5] ? row[5].toString().trim() : '';
    const fullRut = `${run}-${dv}`;

    // Skip if already exists
    const [tRows] = await connection.query("SELECT id FROM rrhh_trabajadores WHERE rut LIKE ?", [`${run}%`]);
    if (tRows.length > 0) continue;

    // Data parsing
    const apellidoPaterno = row[0] ? row[0].toString().trim() : '';
    const apellidoMaterno = row[1] ? row[1].toString().trim() : '';
    const nombres = row[2] ? row[2].toString().trim() : 'Sin Nombre';
    const nacionalidad = row[3] ? row[3].toString().trim() : 'Chilena';
    
    // Excel dates
    let fechaContrato = null;
    if (typeof row[6] === 'number') {
      const date = new Date((row[6] - (25567 + 2)) * 86400 * 1000); 
      fechaContrato = date.toISOString().split('T')[0];
    } else {
      fechaContrato = new Date().toISOString().split('T')[0];
    }
    
    const cargoNombre = row[8] ? row[8].toString().trim() : 'Sin Cargo';
    const tipoContrato = row[9] ? row[9].toString().trim() : 'Indefinido';
    let sueldoBase = row[12] ? parseFloat(row[12]) : 0;
    if (Number.isNaN(sueldoBase)) sueldoBase = 0;
    
    const afpNombre = row[17] ? row[17].toString().trim() : '';
    const saludNombre = row[18] ? row[18].toString().trim() : '';
    let planUf = row[19] ? parseFloat(row[19]) : 0;
    if (Number.isNaN(planUf)) planUf = 0;
    let movilizacion = row[22] ? parseFloat(row[22]) : 0;
    if (Number.isNaN(movilizacion)) movilizacion = 0;
    let colacion = row[23] ? parseFloat(row[23]) : 0;
    if (Number.isNaN(colacion)) colacion = 0;

    // 1. Resolve AFP
    let afp_id = null;
    if (afpNombre) {
      const [aRows] = await connection.query("SELECT id FROM rrhh_afp WHERE nombre LIKE ?", [`%${afpNombre}%`]);
      if (aRows.length > 0) afp_id = aRows[0].id;
    }

    // 2. Resolve Salud
    let salud_id = null;
    if (saludNombre) {
       let sName = saludNombre;
       if (sName.toUpperCase() === 'FONASA') sName = 'Fonasa';
       const [sRows] = await connection.query("SELECT id FROM rrhh_salud WHERE nombre LIKE ?", [`%${sName}%`]);
       if (sRows.length > 0) salud_id = sRows[0].id;
    }

    // 3. Resolve Cargo
    let cargo_id = null;
    if (cargoNombre) {
      const [cRows] = await connection.query("SELECT id FROM rrhh_cargos WHERE nombre = ?", [cargoNombre]);
      if (cRows.length > 0) {
        cargo_id = cRows[0].id;
      } else {
        const [cIns] = await connection.query("INSERT INTO rrhh_cargos (nombre) VALUES (?)", [cargoNombre]);
        cargo_id = cIns.insertId;
      }
    }

    // 4. Insert Trabajador
    const [tIns] = await connection.query(
      "INSERT INTO rrhh_trabajadores (rut, nombres, apellido_paterno, apellido_materno, nacionalidad, afp_id, salud_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')",
      [fullRut, nombres, apellidoPaterno, apellidoMaterno, nacionalidad, afp_id, salud_id]
    );
    const trabajador_id = tIns.insertId;

    // 5. Insert Contrato
    await connection.query(
      "INSERT INTO rrhh_contratos (trabajador_id, cargo_id, tipo_contrato, sueldo_base, fecha_inicio, estado) VALUES (?, ?, ?, ?, ?, 'ACTIVO')",
      [trabajador_id, cargo_id, tipoContrato, sueldoBase, fechaContrato]
    );

    // 6. Insert Haberes Fijos
    await connection.query(
      "INSERT INTO rrhh_haberes_fijos (trabajador_id, movilizacion, colacion, plan_isapre_uf) VALUES (?, ?, ?, ?)",
      [trabajador_id, movilizacion, colacion, planUf]
    );

    insertedCount++;
    console.log(`Ingresado: ${nombres} ${apellidoPaterno} (RUT: ${fullRut})`);
  }
  
  await connection.end();
  console.log(`¡Proceso completado! Se agregaron ${insertedCount} trabajadores nuevos a la base de datos.`);
}

insertMissingWorkers().catch(console.error);
