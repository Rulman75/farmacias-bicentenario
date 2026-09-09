'use server';

import pool from '@/lib/db';

export async function getCartolaVacaciones(trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    const [cRows] = await connection.query(
      "SELECT fecha_inicio FROM rrhh_contratos WHERE trabajador_id = ? ORDER BY fecha_inicio ASC LIMIT 1",
      [trabajador_id]
    );
    
    if ((cRows as any[]).length === 0 || !(cRows as any[])[0].fecha_inicio) {
      return { success: false, error: 'No se encontró contrato válido.' };
    }
    
    const fechaInicio = new Date((cRows as any[])[0].fecha_inicio);
    const hoy = new Date();
    
    let diffTime = hoy.getTime() - fechaInicio.getTime();
    if (diffTime < 0) diffTime = 0; // If future start date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const diasGanados = parseFloat((diffDays * (15 / 365)).toFixed(2));
    
    const [aRows] = await connection.query(
      "SELECT SUM(dias) as total_tomados FROM rrhh_ausentismos WHERE trabajador_id = ? AND tipo = 'Vacaciones'",
      [trabajador_id]
    );
    
    const diasTomados = (aRows as any[])[0].total_tomados ? parseFloat((aRows as any[])[0].total_tomados) : 0;
    const saldo = parseFloat((diasGanados - diasTomados).toFixed(2));
    
    return {
      success: true,
      data: {
        fecha_ingreso: fechaInicio.toISOString().split('T')[0],
        dias_ganados: diasGanados,
        dias_tomados: diasTomados,
        saldo: saldo
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
