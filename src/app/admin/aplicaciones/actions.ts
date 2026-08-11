'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAplicacionesFull() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT id_apli, nombre_apli, ruta FROM aplicaciones ORDER BY id_apli ASC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function crearAplicacion(nombre_apli: string, ruta: string) {
  const connection = await pool.getConnection();
  try {
    await connection.query('INSERT INTO aplicaciones (nombre_apli, ruta) VALUES (?, ?)', [nombre_apli, ruta]);
    revalidatePath('/admin/aplicaciones');
    revalidatePath('/admin/perfiles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function actualizarAplicacion(id_apli: number, nombre_apli: string, ruta: string) {
  const connection = await pool.getConnection();
  try {
    await connection.query('UPDATE aplicaciones SET nombre_apli = ?, ruta = ? WHERE id_apli = ?', [nombre_apli, ruta, id_apli]);
    revalidatePath('/admin/aplicaciones');
    revalidatePath('/admin/perfiles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function eliminarAplicacion(id_apli: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM aplicaciones WHERE id_apli = ?', [id_apli]);
    revalidatePath('/admin/aplicaciones');
    revalidatePath('/admin/perfiles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
