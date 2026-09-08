'use client';

import { useState } from 'react';
import { createAusentismo, deleteAusentismo } from '@/app/rrhh_ausentismos_actions';
import { Loader2, Plus, Trash2, CalendarDays, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AusentismosClient({ ausentismos, trabajadores }: { ausentismos: any[], trabajadores: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trabajador_id: '',
    tipo: 'Vacaciones',
    fecha_inicio: '',
    fecha_termino: '',
    motivo: ''
  });

  const calcularDias = (inicio: string, termino: string) => {
    if (!inicio || !termino) return 0;
    const d1 = new Date(inicio + 'T12:00:00');
    const d2 = new Date(termino + 'T12:00:00');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const dias = calcularDias(formData.fecha_inicio, formData.fecha_termino);
    
    const res = await createAusentismo({
      trabajador_id: parseInt(formData.trabajador_id),
      tipo: formData.tipo,
      fecha_inicio: formData.fecha_inicio,
      fecha_termino: formData.fecha_termino,
      dias,
      motivo: formData.motivo
    });

    if (res.success) {
      setShowModal(false);
      setFormData({
        trabajador_id: '',
        tipo: 'Vacaciones',
        fecha_inicio: '',
        fecha_termino: '',
        motivo: ''
      });
      // Page should refresh data because of revalidatePath
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro? La asistencia se desbloqueará.')) return;
    setLoading(true);
    await deleteAusentismo(id);
    setLoading(false);
  };

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('Vacaciones')) return 'bg-sky-100 text-sky-700';
    if (tipo.includes('Licencia')) return 'bg-rose-100 text-rose-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarDays size={32} className="text-sky-600" />
            Control de Ausentismos
          </h1>
          <p className="text-slate-500 mt-1">Registra Vacaciones, Licencias y Permisos. Estos bloquearán la planilla de asistencia automáticamente.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Registrar Ausentismo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-bold">Trabajador</th>
              <th className="px-6 py-4 font-bold">Tipo</th>
              <th className="px-6 py-4 font-bold">Inicio</th>
              <th className="px-6 py-4 font-bold">Término</th>
              <th className="px-6 py-4 font-bold">Días</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ausentismos.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No hay ausentismos registrados.</td></tr>
            )}
            {ausentismos.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {a.rut}<br/>
                  <span className="text-slate-500">{a.nombres} {a.apellido_paterno}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${getTipoColor(a.tipo)}`}>
                    {a.tipo}
                  </span>
                </td>
                <td className="px-6 py-4">{formatDate(a.fecha_inicio)}</td>
                <td className="px-6 py-4">{formatDate(a.fecha_termino)}</td>
                <td className="px-6 py-4 font-bold">{a.dias}</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                    {a.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Registrar Ausentismo</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Trabajador</label>
                <select 
                  required
                  value={formData.trabajador_id}
                  onChange={e => setFormData({...formData, trabajador_id: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecciona un trabajador...</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.id}>{t.rut} - {t.nombres} {t.apellido_paterno}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Ausentismo</label>
                <select 
                  required
                  value={formData.tipo}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Permiso con goce de sueldo">Permiso con goce de sueldo</option>
                  <option value="Permiso sin goce de sueldo">Permiso sin goce de sueldo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Inicio</label>
                  <input 
                    type="date" required
                    value={formData.fecha_inicio}
                    onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Término</label>
                  <input 
                    type="date" required
                    value={formData.fecha_termino}
                    onChange={e => setFormData({...formData, fecha_termino: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="text-right text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded">
                Días a contabilizar: {calcularDias(formData.fecha_inicio, formData.fecha_termino)}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Observación (Opcional)</label>
                <textarea 
                  value={formData.motivo}
                  onChange={e => setFormData({...formData, motivo: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin"/> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
