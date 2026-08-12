'use server'

import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getUsuarios() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT u.rut, u.nombre, u.id_perfil, u.cod_sucursal, p.Descripcion as perfil_desc, u.debe_cambiar_pass, u.created_at, s.nombre as sucursal_nombre
      FROM usuarioCatalogo u 
      LEFT JOIN perfiles p ON u.id_perfil = p.Id_Perfil 
      LEFT JOIN sucursales s ON u.cod_sucursal = s.cod_sucursal
      ORDER BY u.created_at DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function crearUsuario(data: { rut: string, nombre: string, id_perfil: number, cod_sucursal: number | null }) {
  const connection = await pool.getConnection();
  try {
    const passPorDefecto = data.rut.substring(0, 4);
    const hash = await bcrypt.hash(passPorDefecto, 10);
    
    await connection.query(
      'INSERT INTO usuarioCatalogo (rut, nombre, password_hash, debe_cambiar_pass, id_perfil, cod_sucursal) VALUES (?, ?, ?, TRUE, ?, ?)',
      [data.rut, data.nombre, hash, data.id_perfil, data.cod_sucursal]
    );
    
    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') return { success: false, error: 'El RUT ya existe en el sistema' };
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function actualizarUsuario(rut: string, data: { nombre: string, id_perfil: number, resetPass: boolean, cod_sucursal: number | null }) {
  const connection = await pool.getConnection();
  try {
    if (data.resetPass) {
      const passPorDefecto = rut.substring(0, 4);
      const hash = await bcrypt.hash(passPorDefecto, 10);
      await connection.query(
        'UPDATE usuarioCatalogo SET nombre = ?, id_perfil = ?, cod_sucursal = ?, password_hash = ?, debe_cambiar_pass = TRUE WHERE rut = ?',
        [data.nombre, data.id_perfil, data.cod_sucursal, hash, rut]
      );
    } else {
      await connection.query(
        'UPDATE usuarioCatalogo SET nombre = ?, id_perfil = ?, cod_sucursal = ? WHERE rut = ?',
        [data.nombre, data.id_perfil, data.cod_sucursal, rut]
      );
    }
    
    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function eliminarUsuario(rut: string) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM usuarioCatalogo WHERE rut = ?', [rut]);
    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
