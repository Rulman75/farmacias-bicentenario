'use client';

import { useState } from 'react';
import { createTurno, updateTurno, deleteTurno } from '@/app/rrhh_turnos_actions';
import { Clock, Plus, Trash2, Edit2, Loader2, X } from 'lucide-react';

export default function TurnosClient({ turnosIniciales }: { turnosIniciales: any[] }) {
  const [turnos, setTurnos] = useState(turnosIniciales);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    hora_entrada: '',
    hora_salida_colacion: '',
    hora_entrada_colacion: '',
    hora_salida: '',
    total_horas: ''
  });

  const handleOpenModal = (turno?: any) => {
    if (turno) {
      setEditingId(turno.id);
      setFormData({
        codigo: turno.codigo,
        hora_entrada: turno.hora_entrada?.substring(0, 5) || '',
        hora_salida_colacion: turno.hora_salida_colacion?.substring(0, 5) || '',
        hora_entrada_colacion: turno.hora_entrada_colacion?.substring(0, 5) || '',
        hora_salida: turno.hora_salida?.substring(0, 5) || '',
        total_horas: turno.total_horas?.toString() || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        codigo: '',
        hora_entrada: '',
        hora_salida_colacion: '',
        hora_entrada_colacion: '',
        hora_salida: '',
        total_horas: ''
      });
    }
    setShowModal(true);
  };

  const calcularHoras = () => {
    // Basic calculator
    if (!formData.hora_entrada || !formData.hora_salida) return;
    const t1 = new Date(`2000-01-01T${formData.hora_entrada}:00`);
    const t4 = new Date(`2000-01-01T${formData.hora_salida}:00`);
    let diffTotal = (t4.getTime() - t1.getTime()) / (1000 * 60 * 60);

    if (formData.hora_salida_colacion && formData.hora_entrada_colacion) {
      const t2 = new Date(`2000-01-01T${formData.hora_salida_colacion}:00`);
      const t3 = new Date(`2000-01-01T${formData.hora_entrada_colacion}:00`);
      const diffColacion = (t3.getTime() - t2.getTime()) / (1000 * 60 * 60);
      diffTotal -= diffColacion;
    }

    setFormData(prev => ({ ...prev, total_horas: diffTotal > 0 ? diffTotal.toFixed(2) : '0' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      codigo: formData.codigo,
      hora_entrada: formData.hora_entrada,
      hora_salida_colacion: formData.hora_salida_colacion,
      hora_entrada_colacion: formData.hora_entrada_colacion,
      hora_salida: formData.hora_salida,
      total_horas: parseFloat(formData.total_horas) || 0
    };

    const res = editingId 
      ? await updateTurno(editingId, payload)
      : await createTurno(payload);

    if (res.success) {
      window.location.reload(); // Quick refresh for now
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este turno?')) return;
    setLoading(true);
    await deleteTurno(id);
    window.location.reload();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Clock size={32} className="text-blue-600" />
            Catálogo de Turnos
          </h1>
          <p className="text-slate-500 mt-1">Define los horarios base para usar en el planificador (Part-Time / Honorarios).</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Turno
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-bold">Código</th>
              <th className="px-6 py-4 font-bold">Entrada</th>
              <th className="px-6 py-4 font-bold">Colación (Salida)</th>
              <th className="px-6 py-4 font-bold">Colación (Regreso)</th>
              <th className="px-6 py-4 font-bold">Salida</th>
              <th className="px-6 py-4 font-bold">Total Horas</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {turnos.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No hay turnos registrados. Crea uno.</td></tr>
            )}
            {turnos.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-xs">{t.codigo}</span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">{t.hora_entrada?.substring(0, 5) || '-'}</td>
                <td className="px-6 py-4 text-slate-500">{t.hora_salida_colacion?.substring(0, 5) || '-'}</td>
                <td className="px-6 py-4 text-slate-500">{t.hora_entrada_colacion?.substring(0, 5) || '-'}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{t.hora_salida?.substring(0, 5) || '-'}</td>
                <td className="px-6 py-4 font-bold text-emerald-600">{t.total_horas} hrs</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenModal(t)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 ml-1">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Turno' : 'Nuevo Turno'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Código (Ej: T1, T2, TURNO 8)</label>
                <input 
                  type="text" required
                  value={formData.codigo}
                  onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  placeholder="Ej: T1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Entrada</label>
                  <input 
                    type="time" 
                    value={formData.hora_entrada}
                    onChange={e => setFormData({...formData, hora_entrada: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Salida</label>
                  <input 
                    type="time" 
                    value={formData.hora_salida}
                    onChange={e => setFormData({...formData, hora_salida: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Inicio Colación</label>
                  <input 
                    type="time" 
                    value={formData.hora_salida_colacion}
                    onChange={e => setFormData({...formData, hora_salida_colacion: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Fin Colación</label>
                  <input 
                    type="time" 
                    value={formData.hora_entrada_colacion}
                    onChange={e => setFormData({...formData, hora_entrada_colacion: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total Horas Trabajadas</label>
                  <input 
                    type="number" step="0.01" required
                    value={formData.total_horas}
                    onChange={e => setFormData({...formData, total_horas: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-600 bg-emerald-50"
                  />
                </div>
                <button type="button" onClick={calcularHoras} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium h-10">
                  Calcular
                </button>
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
