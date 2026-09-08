'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAusentismos() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT a.*, t.nombres, t.apellido_paterno, t.rut 
      FROM rrhh_ausentismos a
      JOIN rrhh_trabajadores t ON a.trabajador_id = t.id
      ORDER BY a.fecha_inicio DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function createAusentismo(data: {
  trabajador_id: number;
  tipo: string;
  fecha_inicio: string;
  fecha_termino: string;
  dias: number;
  motivo?: string;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      INSERT INTO rrhh_ausentismos (trabajador_id, tipo, fecha_inicio, fecha_termino, dias, motivo, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'APROBADO')
    `, [
      data.trabajador_id, data.tipo, data.fecha_inicio, data.fecha_termino, 
      data.dias, data.motivo || ''
    ]);
    
    revalidatePath('/panel/rrhh/ausentismos');
    revalidatePath('/panel/rrhh/asistencia');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteAusentismo(id: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM rrhh_ausentismos WHERE id = ?', [id]);
    revalidatePath('/panel/rrhh/ausentismos');
    revalidatePath('/panel/rrhh/asistencia');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
