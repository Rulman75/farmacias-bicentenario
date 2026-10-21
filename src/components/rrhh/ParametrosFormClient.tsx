'use client';

import React, { useState, useEffect } from 'react';
import { saveParametrosMensuales, fetchIndicadoresWeb } from '@/app/rrhh_actions';
import { Loader2, Save, Globe, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ParametrosFormClient({
  initialPeriodo,
  initialData
}: {
  initialPeriodo: string;
  initialData: any;
}) {
  const [loading, setLoading] = useState(false);
  const [fetchingWeb, setFetchingWeb] = useState(false);
  const [fuenteWeb, setFuenteWeb] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    periodo: initialPeriodo,
    uf: initialData?.uf || '',
    utm: initialData?.utm || '',
    sueldo_minimo: initialData?.sueldo_minimo || '',
    tope_afp: initialData?.tope_afp || '87.8',
    tope_cesantia: initialData?.tope_cesantia || '131.9'
  });

  useEffect(() => {
    setFormData({
      periodo: initialPeriodo,
      uf: initialData?.uf || '',
      utm: initialData?.utm || '',
      sueldo_minimo: initialData?.sueldo_minimo || '',
      tope_afp: initialData?.tope_afp || '87.8',
      tope_cesantia: initialData?.tope_cesantia || '131.9'
    });
    setFuenteWeb(null);
  }, [initialPeriodo, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/panel/rrhh/parametros?periodo=${e.target.value}`);
  };

  const handleCapturarWeb = async () => {
    setFetchingWeb(true);
    setFuenteWeb(null);
    const res = await fetchIndicadoresWeb(formData.periodo);
    setFetchingWeb(false);

    if (res.success && res.data) {
      setFormData((prev) => ({
        ...prev,
        uf: String(res.data.uf),
        utm: String(res.data.utm),
        sueldo_minimo: String(res.data.sueldo_minimo),
        tope_afp: String(res.data.tope_afp),
        tope_cesantia: String(res.data.tope_cesantia)
      }));
      setFuenteWeb(res.data.fuente);
    } else {
      alert(res.error || 'No se pudieron obtener los indicadores automáticamente.');
    }
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
      alert('Parámetros guardados con éxito.');
      router.refresh();
    } else {
      alert(res.error || 'Error al guardar los parámetros');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="font-bold text-slate-700 whitespace-nowrap">Mes de Cálculo:</label>
          <input
            type="month"
            name="periodo"
            value={formData.periodo}
            onChange={handlePeriodoChange}
            className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg bg-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleCapturarWeb}
            disabled={fetchingWeb}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm disabled:opacity-50"
          >
            {fetchingWeb ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
            Obtener Automáticamente desde la Web (BCCh / SII)
          </button>
        </div>
      </div>

      {fuenteWeb && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>
            Valores cargados desde <strong>{fuenteWeb}</strong>. Revisa y presiona{' '}
            <strong>Guardar Parámetros</strong> para confirmarlos en el período.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Valores Económicos</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor UF ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor UTM ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                name="utm"
                value={formData.utm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sueldo Mínimo Mensual ($) *</label>
              <input
                type="number"
                required
                name="sueldo_minimo"
                value={formData.sueldo_minimo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
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
                type="number"
                step="0.1"
                required
                name="tope_afp"
                value={formData.tope_afp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tope Seguro Cesantía (UF) *</label>
              <input
                type="number"
                step="0.1"
                required
                name="tope_cesantia"
                value={formData.tope_cesantia}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
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
