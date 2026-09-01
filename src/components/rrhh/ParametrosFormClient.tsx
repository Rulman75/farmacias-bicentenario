'use client'

import React, { useState, useEffect } from 'react';
import { saveParametrosMensuales } from '@/app/rrhh_actions';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ParametrosFormClient({ 
  initialPeriodo, 
  initialData 
}: { 
  initialPeriodo: string, 
  initialData: any 
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    periodo: initialPeriodo,
    uf: initialData?.uf || '',
    utm: initialData?.utm || '',
    sueldo_minimo: initialData?.sueldo_minimo || '',
    tope_afp: initialData?.tope_afp || '84.3',
    tope_cesantia: initialData?.tope_cesantia || '126.6'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/panel/rrhh/parametros?periodo=${e.target.value}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      periodo: formData.periodo,
      uf: parseFloat(formData.uf),
      utm: parseFloat(formData.utm),
      sueldo_minimo: parseInt(formData.sueldo_minimo),
      tope_afp: parseFloat(formData.tope_afp),
      tope_cesantia: parseFloat(formData.tope_cesantia)
    };

    const res = await saveParametrosMensuales(payload);
    
    if (res.success) {
      alert("Parámetros guardados con éxito.");
      router.refresh();
    } else {
      alert(res.error || 'Error al guardar los parámetros');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <label className="font-bold text-slate-700 whitespace-nowrap">Mes de Cálculo:</label>
        <input 
          type="month" 
          name="periodo"
          value={formData.periodo}
          onChange={handlePeriodoChange}
          className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
        />
        <p className="text-sm text-slate-500 md:ml-auto">
          Cambia el mes para ver o editar sus valores históricos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Valores Económicos</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor UF ($) *</label>
              <input 
                type="number" step="0.01" required name="uf"
                value={formData.uf} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor UTM ($) *</label>
              <input 
                type="number" step="0.01" required name="utm"
                value={formData.utm} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sueldo Mínimo Mensual ($) *</label>
              <input 
                type="number" required name="sueldo_minimo"
                value={formData.sueldo_minimo} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Topes Imponibles</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tope AFP / Salud (UF) *</label>
              <input 
                type="number" step="0.1" required name="tope_afp"
                value={formData.tope_afp} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tope Seguro Cesantía (UF) *</label>
              <input 
                type="number" step="0.1" required name="tope_cesantia"
                value={formData.tope_cesantia} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Guardar Parámetros de {formData.periodo}
        </button>
      </div>
    </form>
  );
}
