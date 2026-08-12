'use client'

import React, { useState, useEffect } from 'react';
import { getPerfiles, crearPerfil, eliminarPerfil, getAplicaciones, getPerfilAplicaciones, asignarAplicaciones } from './actions';
import { ShieldAlert, Plus, Trash2, Settings, Loader2, Check, X, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GestionPerfiles() {
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newDesc, setNewDesc] = useState('');

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activePerfil, setActivePerfil] = useState<any>(null);
  const [selectedApps, setSelectedApps] = useState<number[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [resPer, resApp] = await Promise.all([getPerfiles(), getAplicaciones()]);
    if (resPer.success) setPerfiles(resPer.data || []);
    if (resApp.success) setAplicaciones(resApp.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setActionLoading(true);
    const res = await crearPerfil(newDesc);
    if (res.success) {
      setNewDesc('');
      setIsNewOpen(false);
      loadData();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este perfil? (Usuarios con este perfil perderán acceso)')) {
      const res = await eliminarPerfil(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const openConfig = async (perfil: any) => {
    setActivePerfil(perfil);
    setIsConfigOpen(true);
    const res = await getPerfilAplicaciones(perfil.Id_Perfil);
    if (res.success) {
      setSelectedApps(res.data || []);
    } else {
      setSelectedApps([]);
    }
  };

  const handleToggleApp = (id_apli: number) => {
    if (selectedApps.includes(id_apli)) {
      setSelectedApps(selectedApps.filter(id => id !== id_apli));
    } else {
      setSelectedApps([...selectedApps, id_apli]);
    }
  };

  const handleSaveConfig = async () => {
    setActionLoading(true);
    const res = await asignarAplicaciones(activePerfil.Id_Perfil, selectedApps);
    if (res.success) {
      setIsConfigOpen(false);
      alert('Accesos actualizados exitosamente');
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-3 rounded-xl text-white shadow-lg shadow-amber-500/30">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Perfiles</h1>
            <p className="text-slate-500">Crea perfiles dinámicos y asigna acceso a los módulos</p>
          </div>
        </div>
        <button 
          onClick={() => setIsNewOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <Plus size={18} /> Nuevo Perfil
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-semibold w-24 text-center">ID</th>
              <th className="px-6 py-4 font-semibold">Descripción del Perfil</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {perfiles.map(p => (
              <tr key={p.Id_Perfil} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-center font-mono text-slate-500">{p.Id_Perfil}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{p.Descripcion}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openConfig(p)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Settings size={16} /> Configurar Accesos
                    </button>
                    {p.Id_Perfil !== 1 && (
                      <button 
                        onClick={() => handleEliminar(p.Id_Perfil)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Perfil"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Perfil */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Crear Nuevo Perfil</h3>
              <button onClick={() => setIsNewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Perfil</label>
                <input 
                  type="text" 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Ej. Gerente Comercial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Perfil'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Configurar Accesos */}
      {isConfigOpen && activePerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Configurar Accesos</h3>
                <p className="text-xs text-slate-500 mt-1">Perfil: <strong className="text-indigo-600">{activePerfil.Descripcion}</strong></p>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {aplicaciones.map(app => {
                const isSelected = selectedApps.includes(app.id_apli);
                return (
                  <label 
                    key={app.id_apli} 
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div>
                      <div className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{app.nombre_apli}</div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{app.ruta}</div>
                    </div>
                    <div className={`w-6 h-6 rounded flex items-center justify-center border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                      {isSelected && <Check size={16} />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => handleToggleApp(app.id_apli)}
                    />
                  </label>
                )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
