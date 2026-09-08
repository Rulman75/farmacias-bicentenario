const fs = require('fs');

const lreCode = `

export async function generarArchivoLRE(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(\`
      SELECT 
        l.*,
        t.rut, t.nombres, t.apellido_paterno, t.apellido_materno,
        c.tipo_contrato
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      WHERE l.periodo = ? AND c.tipo_contrato != 'Honorarios'
    \`, [periodo]);

    const liquidaciones = rows as any[];

    if (liquidaciones.length === 0) {
      return { success: false, error: 'No hay liquidaciones generadas para el período seleccionado (excluyendo honorarios).' };
    }

    // Cabecera estándar sugerida referencialmente para análisis y LRE
    const headers = [
      "Mes", "RUT", "DV", "Nombres", "Apellido_Paterno", "Apellido_Materno",
      "Tipo_Contrato", "Dias_Trabajados", "Sueldo_Base", "Gratificacion",
      "Colacion", "Movilizacion", "Total_Imponible", "Total_No_Imponible",
      "Monto_AFP", "Monto_Salud", "Monto_Cesantia_Trabajador", "Monto_Impuesto",
      "Anticipos_Y_Otros_Descuentos", "Liquido_A_Pagar"
    ];

    let csvContent = headers.join(';') + '\\r\\n';

    for (const liq of liquidaciones) {
      const rutClean = liq.rut.replace(/[^0-9kK]/g, '').toUpperCase();
      const rutNum = rutClean.slice(0, -1);
      const rutDv = rutClean.slice(-1);
      const periodoLRE = periodo.replace('-', ''); // YYYYMM
      
      const anticiposYOtros = liq.total_descuentos - liq.monto_afp - liq.monto_salud - liq.monto_cesantia - liq.monto_impuesto;

      const row = [
        periodoLRE,
        rutNum,
        rutDv,
        liq.nombres,
        liq.apellido_paterno,
        liq.apellido_materno,
        liq.tipo_contrato,
        liq.dias_trabajados,
        Math.round(liq.sueldo_base || 0),
        Math.round(liq.gratificacion || 0),
        Math.round(liq.total_no_imponible / 2), 
        Math.round(liq.total_no_imponible / 2),
        Math.round(liq.total_imponible),
        Math.round(liq.total_no_imponible),
        Math.round(liq.monto_afp),
        Math.round(liq.monto_salud),
        Math.round(liq.monto_cesantia),
        Math.round(liq.monto_impuesto),
        Math.round(anticiposYOtros),
        Math.round(liq.liquido_pagar)
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

fs.appendFileSync('src/app/rrhh_reportes_actions.ts', lreCode);
console.log('Appended LRE');
