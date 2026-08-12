'use client'

import React, { useState, useEffect } from 'react';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '@/app/admin/actions';
import { getPerfiles } from '@/app/admin/perfiles/actions';
import { getSucursales } from '@/app/actions';
import { Users, UserPlus, Pencil, Trash2, KeyRound, Loader2, Save, X, AlertCircle } from 'lucide-react';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{rut: string, nombre: string, id_perfil: number, resetPass: boolean, cod_sucursal: number | null}>({ rut: '', nombre: '', id_perfil: 2, resetPass: false, cod_sucursal: null });

  const loadData = async () => {
    setLoading(true);
    const [resUsers, resPerfiles, resSucursales] = await Promise.all([getUsuarios(), getPerfiles(), getSucursales()]);
    if (resUsers.success) setUsuarios(resUsers.data || []);
    else setError(resUsers.error || 'Error al cargar usuarios');
    
    if (resPerfiles.success) setPerfiles(resPerfiles.data || []);
    if (resSucursales.success) setSucursales(resSucursales.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    let res;
    if (isEditing) {
      res = await actualizarUsuario(formData.rut, { 
        nombre: formData.nombre, 
        id_perfil: formData.id_perfil, 
        resetPass: formData.resetPass,
        cod_sucursal: formData.cod_sucursal
      });
    } else {
      res = await crearUsuario({ 
        rut: formData.rut, 
        nombre: formData.nombre, 
        id_perfil: formData.id_perfil,
        cod_sucursal: formData.cod_sucursal
      });
    }

    if (res.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setError(res.error || 'Ocurrió un error al guardar');
    }
    setActionLoading(false);
  };

  const handleDelete = async (rut: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${rut}?`)) {
      setActionLoading(true);
      const res = await eliminarUsuario(rut);
      if (res.success) {
        loadData();
      } else {
        setError(res.error || 'Error al eliminar');
      }
      setActionLoading(false);
    }
  };

  const openNew = () => {
    setFormData({ rut: '', nombre: '', id_perfil: 2, resetPass: false, cod_sucursal: null });
    setIsEditing(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: any) => {
    setFormData({ rut: user.rut, nombre: user.nombre, id_perfil: user.id_perfil, resetPass: false, cod_sucursal: user.cod_sucursal || null });
    setIsEditing(true);
    setError(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <p className="text-slate-500">Administra los accesos y perfiles del sistema</p>
          </div>
        </div>
        <button 
          onClick={openNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={18} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">RUT</th>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Perfil</th>
                <th className="px-6 py-4 font-semibold">Sucursal Fija</th>
                <th className="px-6 py-4 font-semibold text-center">Estado Pass</th>
                <th className="px-6 py-4 font-semibold text-center">Fecha Creación</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {usuarios.map((u) => (
                <tr key={u.rut} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">{u.rut}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{u.nombre}</td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold text-xs">
                      {u.perfil_desc || 'Sin Perfil'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.cod_sucursal ? (
                      <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">
                        {u.sucursal_nombre}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Ninguna (Libre)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.debe_cambiar_pass ? (
                      <span className="text-amber-500 font-bold flex items-center justify-center gap-1 text-xs">
                        <KeyRound size={14} /> Debe Cambiar
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-bold text-xs">Ok</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500">
                    {new Date(u.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEdit(u)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar Usuario"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.rut)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay usuarios registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">RUT</label>
                <input 
                  type="text" 
                  value={formData.rut}
                  onChange={(e) => setFormData({...formData, rut: e.target.value})}
                  disabled={isEditing}
                  placeholder="Ej: 12345678-9"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 font-mono"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Perfil de Acceso</label>
                <select
                  value={formData.id_perfil}
                  onChange={(e) => setFormData({...formData, id_perfil: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  required
                >
                  <option value="" disabled>Seleccione un perfil...</option>
                  {perfiles.map(p => (
                    <option key={p.Id_Perfil} value={p.Id_Perfil}>{p.Descripcion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sucursal Asignada</label>
                <select
                  value={formData.cod_sucursal || ''}
                  onChange={(e) => setFormData({...formData, cod_sucursal: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="">Ninguna (Puede elegir libremente)</option>
                  {sucursales.map(s => (
                    <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Fija la sucursal por defecto para este usuario.</p>
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <input 
                    type="checkbox" 
                    id="resetPass"
                    checked={formData.resetPass}
                    onChange={(e) => setFormData({...formData, resetPass: e.target.checked})}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <label htmlFor="resetPass" className="text-sm font-medium text-amber-800 cursor-pointer">
                    Restablecer contraseña (RUT primeros 4 dígitos)
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
