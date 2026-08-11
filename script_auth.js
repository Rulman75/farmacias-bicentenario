const fs = require('fs');
const path = require('path');

// 1. auth/actions.ts
const authDir = 'src/app/auth';
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const actionsCode = `'use server'

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

    if (user.debe_cambiar_pass) {
      return { success: false, requirePasswordChange: true, rut: user.rut };
    }

    const token = await new SignJWT({ rut: user.rut, nombre: user.nombre, rol: user.rol })
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
`;
fs.writeFileSync(path.join(authDir, 'actions.ts'), actionsCode);

// 2. middleware.ts
const middlewareCode = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'llave-secreta-bicentenario-123');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/logo')
  ) {
    return NextResponse.next();
  }

  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } catch (error) {
    if (isLoginPage) return NextResponse.next();
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`;
fs.writeFileSync('src/middleware.ts', middlewareCode);

// 3. /login/page.tsx
const loginDir = 'src/app/login';
if (!fs.existsSync(loginDir)) {
  fs.mkdirSync(loginDir, { recursive: true });
}

const loginCode = `'use client'

import { useState } from 'react';
import { login } from '@/app/auth/actions';
import Image from 'next/image';
import { Loader2, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(rut, password);
    
    if (res.success) {
      router.push('/');
      router.refresh();
    } else if (res.requirePasswordChange) {
      setError('Debes cambiar tu contraseña (Aún no implementado en esta vista)');
      setLoading(false);
    } else {
      setError(res.error || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-8">
          <Image src="/logo-bicentenario.png" alt="Farmacias Bicentenario" width={220} height={70} className="object-contain" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Acceso al Sistema</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={rut}
                onChange={e => setRut(e.target.value)}
                placeholder="12345678-9"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-fuchsia-600/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(path.join(loginDir, 'page.tsx'), loginCode);
