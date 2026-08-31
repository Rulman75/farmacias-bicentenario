'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createContrato } from '@/app/rrhh_actions';
import { Plus, X, Loader2, Save } from 'lucide-react';

export default function ContratoFormClient({ 
  trabajadorId, 
  cargos, 
  sucursales 
}: { 
  trabajadorId: number, 
  cargos: any[], 
  sucursales: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    cargo_id: '',
    cod_sucursal: '',
    fecha_inicio: '',
    fecha_termino: '',
    tipo_contrato: 'Plazo Fijo',
    sueldo_base: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      trabajador_id: trabajadorId,
      cargo_id: parseInt(formData.cargo_id),
      cod_sucursal: formData.cod_sucursal ? parseInt(formData.cod_sucursal) : null,
      fecha_inicio: formData.fecha_inicio,
      fecha_termino: formData.fecha_termino || null,
      tipo_contrato: formData.tipo_contrato,
      sueldo_base: parseFloat(formData.sueldo_base) || 0
    };

    const res = await createContrato(payload);
    if (res.success) {
      setIsOpen(false);
      setFormData({
        cargo_id: '',
        cod_sucursal: '',
        fecha_inicio: '',
        fecha_termino: '',
        tipo_contrato: 'Plazo Fijo',
        sueldo_base: ''
      });
    } else {
      alert(res.error || 'Error al guardar contrato');
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      >
        <Plus size={16} />
        Nuevo Contrato
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Registrar Contrato</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
                <select 
                  name="cargo_id"
                  required
                  value={formData.cargo_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione un cargo...</option>
                  {cargos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                <select 
                  name="cod_sucursal"
                  value={formData.cod_sucursal}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Asignar sucursal (opcional)...</option>
                  {sucursales.map(s => (
                    <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                  <select 
                    name="tipo_contrato"
                    required
                    value={formData.tipo_contrato}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Indefinido">Indefinido</option>
                    <option value="Plazo Fijo">Plazo Fijo</option>
                    <option value="Honorarios">Honorarios</option>
                    <option value="Práctica">Práctica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sueldo Base ($) *</label>
                  <input 
                    type="number" 
                    name="sueldo_base"
                    required
                    value={formData.sueldo_base}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Término</label>
                  <input 
                    type="date" 
                    name="fecha_termino"
                    value={formData.fecha_termino}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Contrato
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
