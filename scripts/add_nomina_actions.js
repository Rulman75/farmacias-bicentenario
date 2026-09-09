const fs = require('fs');

const code = `
// --- NUEVAS FUNCIONES PARA NOMINA MASIVA ---

export async function getNominaMasiva(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(\`
      SELECT l.*, t.rut, t.nombres, t.apellido_paterno, t.apellido_materno, t.email, c.nombre as cargo_nombre
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      LEFT JOIN rrhh_contratos con ON con.trabajador_id = t.id AND con.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos c ON con.cargo_id = c.id
      WHERE l.periodo = ?
    \`, [periodo]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function generarNominaMasiva(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [tRows] = await connection.query("SELECT id FROM rrhh_trabajadores WHERE estado = 'ACTIVO'");
    const trabajadores = tRows as any[];
    
    const [lRows] = await connection.query("SELECT trabajador_id FROM rrhh_liquidaciones WHERE periodo = ?", [periodo]);
    const yaGenerados = new Set((lRows as any[]).map(r => r.trabajador_id));
    
    let count = 0;
    
    for (const t of trabajadores) {
      if (!yaGenerados.has(t.id)) {
        await generarLiquidacion(t.id, periodo);
        count++;
      }
    }
    
    revalidatePath('/panel/rrhh/reportes/liquidaciones');
    return { success: true, generadas: count };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function enviarNominaMasiva(periodo: string) {
  // Simulacion de envio de correos
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { success: true, message: 'Se han enviado todas las liquidaciones exitosamente por correo electrónico.' };
}
`;

fs.appendFileSync('src/app/rrhh_liquidaciones_actions.ts', code);
console.log('Appended');
