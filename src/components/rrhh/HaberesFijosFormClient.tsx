'use client'

import React, { useState } from 'react';
import { saveHaberesFijos } from '@/app/rrhh_actions';
import { Loader2, Save, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HaberesFijosFormClient({ 
  trabajadorId, 
  initialData 
}: { 
  trabajadorId: number, 
  initialData: any 
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    colacion: initialData?.colacion || 0,
    movilizacion: initialData?.movilizacion || 0,
    plan_isapre_uf: initialData?.plan_isapre_uf || 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      colacion: parseInt(formData.colacion as any) || 0,
      movilizacion: parseInt(formData.movilizacion as any) || 0,
      plan_isapre_uf: parseFloat(formData.plan_isapre_uf as any) || 0
    };

    const res = await saveHaberesFijos(trabajadorId, payload);
    
    if (res.success) {
      alert("Condiciones guardadas con éxito.");
      router.refresh();
    } else {
      alert(res.error || 'Error al guardar');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Colación Mensual ($)</label>
          <input 
            type="number" name="colacion"
            value={formData.colacion} onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Movilización Mensual ($)</label>
          <input 
            type="number" name="movilizacion"
            value={formData.movilizacion} onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plan Isapre Pactado (UF)</label>
          <input 
            type="number" step="0.0001" name="plan_isapre_uf"
            value={formData.plan_isapre_uf} onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 2.5000"
          />
          <p className="text-xs text-slate-500 mt-1">Solo aplica si tiene Isapre. Deje 0 para pagar solo el 7% legal.</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Valores
        </button>
      </div>
    </form>
  );
}
