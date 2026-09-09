const xlsx = require('xlsx');
const fs = require('fs');
const mysql = require('mysql2/promise');

async function syncContadorData() {
  const filepath = 'C:\\Users\\raulh\\OneDrive\\Escritorio\\FARMCIAS BICENTENARIO\\PROYECTO SISTEMA DE GESTIÓN\\PLANILLAS JUAN LUIS\\Planilla remuneraciones agosto 2026.xlsx';
  const buf = fs.readFileSync(filepath);
  const wb = xlsx.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

  const connection = await mysql.createConnection('mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia');
  
  let updatedCount = 0;

  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;
    
    let run = row[4];
    if (!run) continue;
    
    // Normalize RUN to string without dots
    run = run.toString().trim();
    
    // Excel dates are numbers (days since 1900-01-01)
    let fechaContrato = null;
    if (typeof row[6] === 'number') {
      const date = new Date((row[6] - (25567 + 2)) * 86400 * 1000); // 25567 is offset, +2 for excel leap year bug
      fechaContrato = date.toISOString().split('T')[0];
    } else if (typeof row[6] === 'string') {
       // if it's string format dd/mm/yyyy
       // omitted for brevity, assuming excel number
    }
    
    const cargoNombre = row[8] ? row[8].toString().trim() : '';
    const tipoContrato = row[9] ? row[9].toString().trim() : 'Indefinido';
    const sueldoBase = row[12] ? parseFloat(row[12]) : 0;
    
    const afpNombre = row[17] ? row[17].toString().trim() : '';
    const saludNombre = row[18] ? row[18].toString().trim() : '';
    const planUf = row[19] ? parseFloat(row[19]) : 0;
    const movilizacion = row[22] ? parseFloat(row[22]) : 0;
    const colacion = row[23] ? parseFloat(row[23]) : 0;

    // 1. Find Trabajador by RUT Prefix
    const [tRows] = await connection.query("SELECT id FROM rrhh_trabajadores WHERE rut LIKE ?", [`${run}%`]);
    if (tRows.length === 0) {
      console.log(`No encontrado trabajador con RUN ${run}`);
      continue;
    }
    const trabajador_id = tRows[0].id;

    // 2. Resolve AFP
    let afp_id = null;
    if (afpNombre) {
      const [aRows] = await connection.query("SELECT id FROM rrhh_afp WHERE nombre LIKE ?", [`%${afpNombre}%`]);
      if (aRows.length > 0) afp_id = aRows[0].id;
    }

    // 3. Resolve Salud
    let salud_id = null;
    if (saludNombre) {
       // FONASA vs Isapres
       let sName = saludNombre;
       if (sName.toUpperCase() === 'FONASA') sName = 'Fonasa';
       const [sRows] = await connection.query("SELECT id FROM rrhh_salud WHERE nombre LIKE ?", [`%${sName}%`]);
       if (sRows.length > 0) salud_id = sRows[0].id;
    }

    // Update Trabajador (AFP, Salud)
    if (afp_id || salud_id) {
       let updates = [];
       let params = [];
       if (afp_id) { updates.push('afp_id = ?'); params.push(afp_id); }
       if (salud_id) { updates.push('salud_id = ?'); params.push(salud_id); }
       params.push(trabajador_id);
       await connection.query(`UPDATE rrhh_trabajadores SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // 4. Resolve Cargo
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

    // 5. Update Contrato (sueldo_base, tipo_contrato, fecha_inicio, cargo_id)
    const [conRows] = await connection.query("SELECT id FROM rrhh_contratos WHERE trabajador_id = ? AND estado = 'ACTIVO'", [trabajador_id]);
    if (conRows.length > 0) {
       let cUpdates = ['sueldo_base = ?', 'tipo_contrato = ?'];
       let cParams = [sueldoBase, tipoContrato];
       if (fechaContrato) { cUpdates.push('fecha_inicio = ?'); cParams.push(fechaContrato); }
       if (cargo_id) { cUpdates.push('cargo_id = ?'); cParams.push(cargo_id); }
       cParams.push(conRows[0].id);
       await connection.query(`UPDATE rrhh_contratos SET ${cUpdates.join(', ')} WHERE id = ?`, cParams);
    } else {
       // Insert new contrato
       if (cargo_id) {
         await connection.query("INSERT INTO rrhh_contratos (trabajador_id, cargo_id, tipo_contrato, sueldo_base, fecha_inicio) VALUES (?, ?, ?, ?, ?)", 
           [trabajador_id, cargo_id, tipoContrato, sueldoBase, fechaContrato || new Date()]);
       }
    }

    // 6. Update Haberes Fijos (movilizacion, colacion, plan_isapre_uf)
    const [hfRows] = await connection.query("SELECT id FROM rrhh_haberes_fijos WHERE trabajador_id = ?", [trabajador_id]);
    if (hfRows.length > 0) {
       await connection.query("UPDATE rrhh_haberes_fijos SET movilizacion = ?, colacion = ?, plan_isapre_uf = ? WHERE id = ?", 
         [movilizacion, colacion, planUf || 0, hfRows[0].id]);
    } else {
       await connection.query("INSERT INTO rrhh_haberes_fijos (trabajador_id, movilizacion, colacion, plan_isapre_uf) VALUES (?, ?, ?, ?)", 
         [trabajador_id, movilizacion, colacion, planUf || 0]);
    }

    updatedCount++;
    console.log(`Actualizado ${row[2]} ${row[0]} (RUT: ${run})`);
  }
  
  await connection.end();
  console.log(`¡Proceso completado! Se actualizaron ${updatedCount} trabajadores.`);
}

syncContadorData().catch(console.error);
