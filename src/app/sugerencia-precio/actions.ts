'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function guardarSugerencia(data: { rut_usuario: string, observacion: string, detalles: any[] }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [headerResult] = await connection.query(
      'INSERT INTO sugerencias_cabecera (rut_usuario, observacion) VALUES (?, ?)',
      [data.rut_usuario, data.observacion]
    );
    const id_sugerencia = (headerResult as any).insertId;

    if (data.detalles && data.detalles.length > 0) {
      const values = data.detalles.map(d => [
        id_sugerencia, 
        d.cod_art, 
        d.descripcion, 
        d.precio_final1 || d.precio_actual, 
        d.nuevoPrecio, 
        d.costo_neto1 || d.costo
      ]);
      await connection.query(
        'INSERT INTO sugerencias_detalle (id_sugerencia, cod_art, descripcion, precio_actual, precio_nuevo, costo) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    revalidatePath('/sugerencia-precio');
    return { success: true, id_sugerencia };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getHistorialSugerencias() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT c.*, u.nombre as nombre_usuario, 
      (SELECT COUNT(*) FROM sugerencias_detalle d WHERE d.id_sugerencia = c.id_sugerencia) as total_items
      FROM sugerencias_cabecera c
      LEFT JOIN usuarioCatalogo u ON c.rut_usuario = u.rut
      ORDER BY c.fecha DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getSugerenciaDetalle(id_sugerencia: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM sugerencias_detalle WHERE id_sugerencia = ?', [id_sugerencia]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function eliminarSugerencia(id_sugerencia: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM sugerencias_cabecera WHERE id_sugerencia = ?', [id_sugerencia]);
    revalidatePath('/sugerencia-precio');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
