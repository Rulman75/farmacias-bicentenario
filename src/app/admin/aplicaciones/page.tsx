'use client'

import React, { useState, useEffect } from 'react';
import { getAplicacionesFull, crearAplicacion, actualizarAplicacion, eliminarAplicacion } from './actions';
import { LayoutGrid, Plus, Pencil, Trash2, Loader2, Save, X, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';

export default function GestionAplicaciones() {
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id_apli: 0, nombre_apli: '', ruta: '' });

  const { items: sortedApps, requestSort, sortConfig } = useSortableData(aplicaciones);

  const loadData = async () => {
    setLoading(true);
    const res = await getAplicacionesFull();
    if (res.success) setAplicaciones(res.data || []);
    else setError(res.error || 'Error al cargar aplicaciones');
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
      res = await actualizarAplicacion(formData.id_apli, formData.nombre_apli, formData.ruta);
    } else {
      res = await crearAplicacion(formData.nombre_apli, formData.ruta);
    }

    if (res.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setError(res.error || 'Ocurrió un error al guardar');
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta aplicación? (Se quitará de todos los perfiles)')) {
      setActionLoading(true);
      const res = await eliminarAplicacion(id);
      if (res.success) {
        loadData();
      } else {
        setError(res.error || 'Error al eliminar');
      }
      setActionLoading(false);
    }
  };

  const openNew = () => {
    setFormData({ id_apli: 0, nombre_apli: '', ruta: '' });
    setIsEditing(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (app: any) => {
    setFormData({ id_apli: app.id_apli, nombre_apli: app.nombre_apli, ruta: app.ruta });
    setIsEditing(true);
    setError(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-fuchsia-500" size={32} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-500/30">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Aplicaciones</h1>
            <p className="text-slate-500">Registra y modifica los módulos bloqueables del sistema</p>
          </div>
        </div>
        <button 
          onClick={openNew}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-fuchsia-600/20"
        >
          <Plus size={18} /> Nueva Aplicación
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
                <SortableHeader label="ID" sortKey="id_apli" currentSort={sortConfig} requestSort={requestSort} className="w-24 text-center" />
                <SortableHeader label="Módulo (Aplicación)" sortKey="nombre_apli" currentSort={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Ruta (Path)" sortKey="ruta" currentSort={sortConfig} requestSort={requestSort} />
                <th className="px-6 py-4 font-semibold text-right sticky top-0 z-10 bg-slate-50 border-b border-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedApps.map((a) => (
                <tr key={a.id_apli} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500">{a.id_apli}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{a.nombre_apli}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{a.ruta}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEdit(a)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar Aplicación"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id_apli)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Aplicación"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {aplicaciones.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No hay aplicaciones registradas.
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
                {isEditing ? 'Editar Aplicación' : 'Nueva Aplicación'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre (Visible en menús/mantenedores)</label>
                <input 
                  type="text" 
                  value={formData.nombre_apli}
                  onChange={(e) => setFormData({...formData, nombre_apli: e.target.value})}
                  placeholder="Ej: Reporte de Ventas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ruta Interna (URL)</label>
                <input 
                  type="text" 
                  value={formData.ruta}
                  onChange={(e) => setFormData({...formData, ruta: e.target.value})}
                  placeholder="Ej: /reporte-ventas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">Esta ruta es la que el sistema bloqueará si el usuario no tiene permisos. Debe comenzar con <strong>/</strong></p>
              </div>

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
                  className="flex-1 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
