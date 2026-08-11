const fs = require('fs');
const path = require('path');

// 1. Crear Server Actions para Usuarios
const adminDir = 'src/app/admin';
if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
}

const actionsCode = `'use server'

import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getUsuarios() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT rut, nombre, rol, debe_cambiar_pass, created_at FROM usuarioCatalogo ORDER BY created_at DESC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function crearUsuario(data: { rut: string, nombre: string, rol: string }) {
  const connection = await pool.getConnection();
  try {
    const passPorDefecto = data.rut.substring(0, 4);
    const hash = await bcrypt.hash(passPorDefecto, 10);
    
    await connection.query(
      'INSERT INTO usuarioCatalogo (rut, nombre, password_hash, debe_cambiar_pass, rol) VALUES (?, ?, ?, TRUE, ?)',
      [data.rut, data.nombre, hash, data.rol]
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

export async function actualizarUsuario(rut: string, data: { nombre: string, rol: string, resetPass: boolean }) {
  const connection = await pool.getConnection();
  try {
    if (data.resetPass) {
      const passPorDefecto = rut.substring(0, 4);
      const hash = await bcrypt.hash(passPorDefecto, 10);
      await connection.query(
        'UPDATE usuarioCatalogo SET nombre = ?, rol = ?, password_hash = ?, debe_cambiar_pass = TRUE WHERE rut = ?',
        [data.nombre, data.rol, hash, rut]
      );
    } else {
      await connection.query(
        'UPDATE usuarioCatalogo SET nombre = ?, rol = ? WHERE rut = ?',
        [data.nombre, data.rol, rut]
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
`;
fs.writeFileSync(path.join(adminDir, 'actions.ts'), actionsCode);

// 2. Add getCurrentUser to auth/actions.ts to get role for Sidebar
let authActions = fs.readFileSync('src/app/auth/actions.ts', 'utf8');
if (!authActions.includes('getCurrentUser')) {
  authActions += `
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
`;
  fs.writeFileSync('src/app/auth/actions.ts', authActions);
}

// 3. Crear vista /admin/usuarios
const pageDir = 'src/app/admin/usuarios';
if (!fs.existsSync(pageDir)) {
  fs.mkdirSync(pageDir, { recursive: true });
}

const pageCode = `'use client'

import React, { useState, useEffect } from 'react';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '@/app/admin/actions';
import { getCurrentUser } from '@/app/auth/actions';
import { Users, UserPlus, Pencil, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRut, setEditingRut] = useState<string | null>(null);
  
  // Form State
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('usuario');
  const [resetPass, setResetPass] = useState(false);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'admin') {
      router.push('/');
      return;
    }
    setCurrentUser(user);
    await cargarUsuarios();
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    const res = await getUsuarios();
    if (res.success && res.data) {
      setUsuarios(res.data);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingRut(null);
    setRut('');
    setNombre('');
    setRol('usuario');
    setResetPass(false);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingRut(user.rut);
    setRut(user.rut);
    setNombre(user.nombre);
    setRol(user.rol);
    setResetPass(false);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    let res;
    if (editingRut) {
      res = await actualizarUsuario(editingRut, { nombre, rol, resetPass });
    } else {
      res = await crearUsuario({ rut, nombre, rol });
    }

    if (res.success) {
      setModalOpen(false);
      await cargarUsuarios();
    } else {
      setFormError(res.error || 'Ocurrió un error');
    }
    setFormLoading(false);
  };

  const handleDelete = async (userRut: string) => {
    if (userRut === currentUser?.rut) {
      alert("No puedes eliminarte a ti mismo.");
      return;
    }
    if (confirm(\`¿Estás seguro de que deseas eliminar al usuario \${userRut}?\`)) {
      const res = await eliminarUsuario(userRut);
      if (res.success) {
        await cargarUsuarios();
      } else {
        alert(res.error);
      }
    }
  };

  if (!currentUser) return null; // Prevent flicker

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-3 rounded-xl text-white shadow-lg shadow-amber-500/30">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <p className="text-slate-500">Crea, edita o elimina accesos al sistema</p>
          </div>
        </div>
        <button 
          onClick={openCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/20"
        >
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">RUT</th>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold text-center">Rol</th>
                <th className="px-6 py-4 font-semibold text-center">Estado Contraseña</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 size={32} className="animate-spin mx-auto mb-2 text-amber-500" /></td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No hay usuarios registrados.</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.rut} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{u.rut}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{u.nombre}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={\`px-3 py-1 rounded-full text-xs font-bold \${u.rol === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}\`}>
                        {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.debe_cambiar_pass === 1 ? (
                        <span className="text-amber-600 font-medium flex items-center justify-center gap-1"><AlertTriangle size={14}/> Pendiente Cambio</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Actualizada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(u.rut)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" disabled={u.rut === currentUser.rut}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingRut ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
                <input type="text" value={rut} onChange={e => setRut(e.target.value)} disabled={!!editingRut} placeholder="12345678-9" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="usuario">Usuario (Solo Catálogo y Operación)</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                </select>
              </div>

              {editingRut && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <input type="checkbox" id="resetPass" checked={resetPass} onChange={e => setResetPass(e.target.checked)} className="w-4 h-4 accent-amber-600 rounded" />
                  <label htmlFor="resetPass" className="text-sm font-medium text-amber-800 cursor-pointer">Restablecer contraseña (exigir cambio)</label>
                </div>
              )}

              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold">Info:</span> La contraseña inicial será los primeros 4 dígitos del RUT. El usuario deberá cambiarla al iniciar sesión.
              </p>

              <button type="submit" disabled={formLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors mt-6 flex justify-center items-center gap-2">
                {formLoading ? <Loader2 size={18} className="animate-spin" /> : (editingRut ? 'Guardar Cambios' : 'Crear Usuario')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageCode);

// 4. Update Sidebar to show user info and Admin link
let sidebarCode = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
if (!sidebarCode.includes('getCurrentUser')) {
  sidebarCode = sidebarCode.replace(
    /import \{ useState \} from 'react';/,
    `import { useState, useEffect } from 'react';\nimport { getCurrentUser } from '@/app/auth/actions';`
  );
  
  sidebarCode = sidebarCode.replace(
    /const \[vencimientoOpen, setVencimientoOpen\] = useState\(true\);/,
    `const [vencimientoOpen, setVencimientoOpen] = useState(true);\n  const [user, setUser] = useState<any>(null);\n\n  useEffect(() => {\n    getCurrentUser().then(u => setUser(u));\n  }, []);`
  );
  
  // Agregar enlace Admin si es admin
  sidebarCode = sidebarCode.replace(
    /<\/nav>\s*<div className="p-4 border-t border-slate-800">/,
    `
        {user?.rol === 'admin' && (
          <div>
            <div className="px-3 py-2 mt-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administración
            </div>
            <div className="space-y-1">
              <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Users size={18} className="text-amber-500 group-hover:text-amber-400 transition-colors" />
                <span className="font-medium text-slate-400 group-hover:text-white transition-colors">Gestión Usuarios</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {user && (
          <div className="px-3 mb-3 text-xs font-medium text-slate-500">
            {user.rol === 'admin' ? 'Admin: ' : 'Usuario: '} <span className="text-slate-300">{user.nombre}</span>
          </div>
        )}`
  );
  
  sidebarCode = sidebarCode.replace(
    /import \{ LayoutDashboard.*?\} from 'lucide-react';/,
    `import { LayoutDashboard, Pill, LogOut, ChevronDown, ChevronRight, Clock, ArrowRightLeft, Tag, TrendingUp, Users } from 'lucide-react';`
  );
  
  fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarCode);
}
