'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAnticiposByPeriodo(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT a.*, t.nombres, t.apellidos, t.rut 
      FROM rrhh_anticipos a
      JOIN rrhh_trabajadores t ON a.trabajador_id = t.id
      WHERE a.periodo = ?
      ORDER BY a.fecha_emision DESC
    `, [periodo]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getAnticiposByTrabajador(trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM rrhh_anticipos 
      WHERE trabajador_id = ?
      ORDER BY fecha_emision DESC
    `, [trabajador_id]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function createAnticipo(data: {
  trabajador_id: number;
  periodo: string;
  fecha_emision: string;
  monto: number;
  observacion?: string;
}) {
  const connection = await pool.getConnection();
  try {
    const { trabajador_id, periodo, fecha_emision, monto, observacion } = data;
    
    // Validar si existe la liquidación de ese periodo (no se puede dar anticipo si ya se pagó el sueldo)
    const [liqRows] = await connection.query(`
      SELECT id FROM rrhh_liquidaciones WHERE trabajador_id = ? AND periodo = ?
    `, [trabajador_id, periodo]);
    
    if ((liqRows as any[]).length > 0) {
      return { success: false, error: 'Ya existe una liquidación cerrada para este periodo. Debe anular la liquidación primero.' };
    }

    const [result] = await connection.query(`
      INSERT INTO rrhh_anticipos (trabajador_id, periodo, fecha_emision, monto, observacion)
      VALUES (?, ?, ?, ?, ?)
    `, [trabajador_id, periodo, fecha_emision, monto, observacion || null]);

    revalidatePath('/panel/rrhh/anticipos');
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteAnticipo(id: number, trabajador_id: number, periodo: string) {
  const connection = await pool.getConnection();
  try {
    // Validar si existe la liquidación
    const [liqRows] = await connection.query(`
      SELECT id FROM rrhh_liquidaciones WHERE trabajador_id = ? AND periodo = ?
    `, [trabajador_id, periodo]);
    
    if ((liqRows as any[]).length > 0) {
      return { success: false, error: 'Ya existe una liquidación cerrada para este periodo. Debe anular la liquidación para eliminar este anticipo.' };
    }

    await connection.query('DELETE FROM rrhh_anticipos WHERE id = ?', [id]);
    
    revalidatePath('/panel/rrhh/anticipos');
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

