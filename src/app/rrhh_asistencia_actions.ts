'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAsistenciaMes(anio: number, mes: number) {
  const connection = await pool.getConnection();
  try {
    // 1. Obtener trabajadores activos
    const [trabajadores] = await connection.query(`
      SELECT id, rut, nombres, apellido_paterno, apellido_materno 
      FROM rrhh_trabajadores 
      WHERE estado = 'ACTIVO'
      ORDER BY apellido_paterno ASC, nombres ASC
    `);

    // 2. Obtener asistencia manual del mes
    const [asistencia] = await connection.query(`
      SELECT trabajador_id, DAY(fecha) as dia, estado 
      FROM rrhh_asistencia 
      WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
    `, [anio, mes]);

    // 3. Obtener ausentismos aprobados que toquen este mes
    // startDate = YYYY-MM-01, endDate = YYYY-MM-LAST
    const startStr = `${anio}-${mes.toString().padStart(2, '0')}-01`;
    const endStr = `${anio}-${mes.toString().padStart(2, '0')}-${new Date(anio, mes, 0).getDate()}`;
    
    const [ausentismos] = await connection.query(`
      SELECT trabajador_id, fecha_inicio, fecha_termino, tipo 
      FROM rrhh_ausentismos 
      WHERE estado = 'APROBADO' 
      AND fecha_inicio <= ? AND fecha_termino >= ?
    `, [endStr, startStr]);

    return { 
      success: true, 
      data: {
        trabajadores: trabajadores as any[],
        asistencia: asistencia as any[],
        ausentismos: ausentismos as any[]
      } 
    };
  } catch (error: any) {
    console.error('Error getAsistenciaMes:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function saveAsistenciaDia(trabajador_id: number, fechaStr: string, estado: string) {
  const connection = await pool.getConnection();
  try {
    // Si estado está vacío, podríamos querer borrar el registro manual
    if (!estado || estado.trim() === '') {
      await connection.query(`
        DELETE FROM rrhh_asistencia 
        WHERE trabajador_id = ? AND fecha = ?
      `, [trabajador_id, fechaStr]);
    } else {
      await connection.query(`
        INSERT INTO rrhh_asistencia (trabajador_id, fecha, estado)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE estado = VALUES(estado)
      `, [trabajador_id, fechaStr, estado.toUpperCase()]);
    }
    
    // No revalidamos aquí para no lentificar el tipado rápido, se confía en el estado del cliente
    return { success: true };
  } catch (error: any) {
    console.error('Error saveAsistenciaDia:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
