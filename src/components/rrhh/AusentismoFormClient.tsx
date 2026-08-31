'use client'

import React, { useState } from 'react';
import { createAusentismo } from '@/app/rrhh_actions';
import { Plus, X, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AusentismoFormClient({ trabajadorId }: { trabajadorId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    tipo: 'Vacaciones',
    fecha_inicio: '',
    fecha_termino: '',
    dias: '',
    motivo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      trabajador_id: trabajadorId,
      tipo: formData.tipo,
      fecha_inicio: formData.fecha_inicio,
      fecha_termino: formData.fecha_termino,
      dias: parseInt(formData.dias) || 0,
      motivo: formData.motivo
    };

    const res = await createAusentismo(payload);
    if (res.success) {
      setIsOpen(false);
      setFormData({
        tipo: 'Vacaciones',
        fecha_inicio: '',
        fecha_termino: '',
        dias: '',
        motivo: ''
      });
      router.refresh();
    } else {
      alert(res.error || 'Error al guardar el registro');
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      >
        <Plus size={16} />
        Registrar Ausentismo
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Registrar Ausentismo</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ausentismo *</label>
                <select 
                  name="tipo"
                  required
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Permiso Administrativo">Permiso Administrativo</option>
                  <option value="Falla Injustificada">Falla Injustificada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio *</label>
                  <input 
                    type="date" 
                    name="fecha_inicio"
                    required
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Término *</label>
                  <input 
                    type="date" 
                    name="fecha_termino"
                    required
                    value={formData.fecha_termino}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Días Hábiles (Efectivos) *</label>
                <input 
                  type="number" 
                  name="dias"
                  required
                  min="1"
                  value={formData.dias}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Observaciones</label>
                <textarea 
                  name="motivo"
                  rows={3}
                  value={formData.motivo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Detalles de la licencia, vacaciones, etc."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
