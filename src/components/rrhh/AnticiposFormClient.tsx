'use client'

import { useState } from 'react';
import { createAnticipo, deleteAnticipo } from '@/app/rrhh_anticipos_actions';
import { Search, Plus, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AnticiposFormClient({ trabajadores, anticiposHoy, periodoActual }: { trabajadores: any[], anticiposHoy: any[], periodoActual: string }) {
  const [monto, setMonto] = useState('');
  const [trabajadorId, setTrabajadorId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observacion, setObservacion] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!trabajadorId || !monto) {
      setError('Trabajador y Monto son obligatorios.');
      setLoading(false);
      return;
    }

    const res = await createAnticipo({
      trabajador_id: parseInt(trabajadorId),
      periodo: periodoActual,
      fecha_emision: fecha,
      monto: parseInt(monto),
      observacion
    });

    if (!res.success) {
      setError(res.error || 'Error al guardar');
    } else {
      setMonto('');
      setObservacion('');
      setTrabajadorId('');
    }
    setLoading(false);
  };

  const handleDelete = async (id: number, tId: number, per: string) => {
    if (!confirm('¿Eliminar este anticipo?')) return;
    const res = await deleteAnticipo(id, tId, per);
    if (!res.success) alert(res.error);
  };

  return (
    <div className="space-y-8">
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" />
          Registrar Nuevo Anticipo
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trabajador *</label>
            <select 
              value={trabajadorId} 
              onChange={e => setTrabajadorId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione...</option>
              {trabajadores.map(t => (
                <option key={t.id} value={t.id}>{t.rut} - {t.nombres} {t.apellidos}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input 
              type="date" 
              value={fecha} 
              onChange={e => setFecha(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto ($) *</label>
            <input 
              type="number" 
              value={monto} 
              onChange={e => setMonto(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-colors">
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Anticipos del Periodo {periodoActual}</h3>
          <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
            {anticiposHoy.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">RUT</th>
                <th className="p-4 font-medium">Trabajador</th>
                <th className="p-4 font-medium text-right">Monto</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {anticiposHoy.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No hay anticipos registrados en este periodo.</td>
                </tr>
              ) : (
                anticiposHoy.map(ant => (
                  <tr key={ant.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4">{formatDate(ant.fecha_emision)}</td>
                    <td className="p-4 font-medium">{ant.rut}</td>
                    <td className="p-4">{ant.nombres} {ant.apellidos}</td>
                    <td className="p-4 text-right font-bold text-slate-700">${Number(ant.monto).toLocaleString('es-CL')}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(ant.id, ant.trabajador_id, ant.periodo)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
