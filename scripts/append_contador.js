const fs = require('fs');
const code = `
export async function generarPlanillaContador(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(\`
      SELECT 
        l.*,
        t.rut, t.nombres, t.apellido_paterno, t.apellido_materno, t.nacionalidad,
        c.fecha_inicio, c.horas_semanales, c.cargo_id, cg.nombre as cargo_nombre, c.tipo_contrato,
        a.nombre as afp_nombre,
        s.nombre as salud_nombre,
        t.salud_monto_uf
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos cg ON c.cargo_id = cg.id
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      WHERE l.periodo = ?
    \`, [periodo]);

    const liquidaciones = rows as any[];

    if (liquidaciones.length === 0) {
      return { success: false, error: 'No hay datos para el período seleccionado.' };
    }

    const headers = [
      "APELLIDO 1", "APELLIDO 2", "NOMBRES", "NACIONALIDAD", "RUN", "DV",
      "FECHA CONTRATO", "Horas Semana", "CARGO", "TIPO CONTRATO", 
      "DÍAS L. MÉDICA", "DÍAS DE FALLA", "SUELDO BASE", "BONO CUMPLIMIENTO", 
      "BONO DE GESTION", "AGUINALDO", "HORAS EXTRAS", "AFP", "SALUD", "UF", 
      "ANTICIPO", "ASIGNACIÓN FAMILIAR", "MOVILIZACIÓN", "COLACIÓN", "LÍQUIDO A PAGAR (MONTO ACTUAL)"
    ];

    let csvContent = headers.join(';') + '\\r\\n';

    for (const liq of liquidaciones) {
      const rutClean = liq.rut.replace(/[^0-9kK]/g, '').toUpperCase();
      const rutNum = rutClean.slice(0, -1);
      const rutDv = rutClean.slice(-1);
      
      const fechaContrato = liq.fecha_inicio ? new Date(liq.fecha_inicio).toLocaleDateString('es-CL') : '';
      
      let diasFalla = 30 - (liq.dias_trabajados || 30);
      if (diasFalla < 0) diasFalla = 0;

      const row = [
        liq.apellido_paterno || '',
        liq.apellido_materno || '',
        liq.nombres || '',
        liq.nacionalidad || 'Chilena',
        rutNum,
        rutDv,
        fechaContrato,
        liq.horas_semanales || 40,
        liq.cargo_nombre || 'Sin Cargo',
        liq.tipo_contrato,
        0,
        diasFalla, 
        Math.round(liq.sueldo_base || 0),
        0, 
        0, 
        0, 
        0, 
        liq.afp_nombre || '',
        liq.salud_nombre || '',
        liq.salud_monto_uf ? liq.salud_monto_uf.toString().replace('.', ',') : '',
        0, 
        0, 
        Math.round((liq.total_no_imponible || 0) / 2),
        Math.round((liq.total_no_imponible || 0) / 2),
        Math.round(liq.liquido_pagar || 0)
      ];

      csvContent += row.join(';') + '\\r\\n';
    }

    return { success: true, csv: csvContent };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;
fs.appendFileSync('src/app/rrhh_reportes_actions.ts', code);
console.log('Appended');
