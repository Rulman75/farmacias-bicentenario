'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getTurnos() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM rrhh_turnos
      ORDER BY codigo ASC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function createTurno(data: {
  codigo: string;
  hora_entrada: string;
  hora_salida_colacion: string;
  hora_entrada_colacion: string;
  hora_salida: string;
  total_horas: number;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      INSERT INTO rrhh_turnos 
      (codigo, hora_entrada, hora_salida_colacion, hora_entrada_colacion, hora_salida, total_horas)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.codigo, 
      data.hora_entrada || null, 
      data.hora_salida_colacion || null, 
      data.hora_entrada_colacion || null, 
      data.hora_salida || null, 
      data.total_horas
    ]);
    
    revalidatePath('/panel/rrhh/turnos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function updateTurno(id: number, data: {
  codigo: string;
  hora_entrada: string;
  hora_salida_colacion: string;
  hora_entrada_colacion: string;
  hora_salida: string;
  total_horas: number;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      UPDATE rrhh_turnos 
      SET codigo=?, hora_entrada=?, hora_salida_colacion=?, hora_entrada_colacion=?, hora_salida=?, total_horas=?
      WHERE id = ?
    `, [
      data.codigo, 
      data.hora_entrada || null, 
      data.hora_salida_colacion || null, 
      data.hora_entrada_colacion || null, 
      data.hora_salida || null, 
      data.total_horas,
      id
    ]);
    
    revalidatePath('/panel/rrhh/turnos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteTurno(id: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM rrhh_turnos WHERE id = ?', [id]);
    revalidatePath('/panel/rrhh/turnos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
