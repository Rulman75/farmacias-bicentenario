'use server'

import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'llave-secreta-bicentenario-123');

export async function login(rut: string, password: string) {
  if (!rut || !password) return { success: false, error: 'RUT y contraseña requeridos' };

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM usuarioCatalogo WHERE rut = ?', [rut]);
    if ((rows as any[]).length === 0) return { success: false, error: 'Credenciales incorrectas' };

    const user = (rows as any[])[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) return { success: false, error: 'Credenciales incorrectas' };

    // Buscar aplicaciones permitidas
    const [appRows] = await connection.query('SELECT a.ruta FROM aplicaciones a JOIN perfil_apli pa ON a.id_apli = pa.id_apli WHERE pa.id_perfil = ?', [user.id_perfil]);
    const rutas_apli = (appRows as any[]).map(r => r.ruta);

    if (user.debe_cambiar_pass) {
      return { success: false, requirePasswordChange: true, rut: user.rut };
    }

    const token = await new SignJWT({ rut: user.rut, nombre: user.nombre, id_perfil: user.id_perfil, rutas_apli })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 hours
    });

    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: 'Error del servidor' };
  } finally {
    connection.release();
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}

import { jwtVerify } from 'jose';
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload;
  } catch (e) {
    return null;
  }
}
