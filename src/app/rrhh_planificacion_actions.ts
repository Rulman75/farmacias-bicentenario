'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Obtiene los trabajadores Part-Time / Honorarios y sus turnos asignados para un mes
export async function getPlanificacionMes(anio: number, mes: number) {
  const connection = await pool.getConnection();
  try {
    // 1. Obtener trabajadores Part-Time y Honorarios activos
    const [trabajadores] = await connection.query(`
      SELECT t.id, t.rut, t.nombres, t.apellido_paterno, t.apellido_materno, c.cod_sucursal, c.tipo_contrato
      FROM rrhh_trabajadores t
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      WHERE t.estado = 'ACTIVO' 
        AND c.tipo_contrato IN ('Honorarios', 'Part-Time')
      ORDER BY c.cod_sucursal ASC, t.apellido_paterno ASC
    `);

    // 2. Obtener los turnos asignados en el mes solicitado
    const mesStr = mes.toString().padStart(2, '0');
    const [asignaciones] = await connection.query(`
      SELECT trabajador_id, DAY(fecha) as dia, turno_id
      FROM rrhh_turnos_asignados
      WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
    `, [anio, mes]);

    return { 
      success: true, 
      trabajadores: trabajadores as any[], 
      asignaciones: asignaciones as any[] 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// Guarda o actualiza (Upsert) un turno para un trabajador en una fecha
export async function saveTurnoDia(trabajador_id: number, fecha: string, turno_id: number | null) {
  const connection = await pool.getConnection();
  try {
    if (turno_id === null) {
      // Si mandan null, significa borrar el turno de ese día
      await connection.query(`
        DELETE FROM rrhh_turnos_asignados 
        WHERE trabajador_id = ? AND fecha = ?
      `, [trabajador_id, fecha]);
    } else {
      // Insertar o actualizar (Upsert)
      await connection.query(`
        INSERT INTO rrhh_turnos_asignados (trabajador_id, fecha, turno_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE turno_id = VALUES(turno_id)
      `, [trabajador_id, fecha, turno_id]);
    }
    
    // revalidatePath('/panel/rrhh/planificador');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
