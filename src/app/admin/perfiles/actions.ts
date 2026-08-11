'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPerfiles() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT Id_Perfil, Descripcion FROM perfiles ORDER BY Id_Perfil ASC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function crearPerfil(descripcion: string) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query('INSERT INTO perfiles (Descripcion) VALUES (?)', [descripcion]);
    revalidatePath('/admin/perfiles');
    return { success: true, insertId: (result as any).insertId };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function eliminarPerfil(id: number) {
  const connection = await pool.getConnection();
  try {
    if (id === 1) return { success: false, error: 'No se puede eliminar el perfil Administrador base' };
    await connection.query('DELETE FROM perfiles WHERE Id_Perfil = ?', [id]);
    revalidatePath('/admin/perfiles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getAplicaciones() {
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

export async function getPerfilAplicaciones(id_perfil: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT id_apli FROM perfil_apli WHERE id_perfil = ?', [id_perfil]);
    return { success: true, data: (rows as any[]).map(r => r.id_apli) };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function asignarAplicaciones(id_perfil: number, ids_apli: number[]) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Borrar actuales
    await connection.query('DELETE FROM perfil_apli WHERE id_perfil = ?', [id_perfil]);
    // Insertar nuevos
    if (ids_apli.length > 0) {
      const values = ids_apli.map(id => [id_perfil, id]);
      await connection.query('INSERT INTO perfil_apli (id_perfil, id_apli) VALUES ?', [values]);
    }
    await connection.commit();
    revalidatePath('/admin/perfiles');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
