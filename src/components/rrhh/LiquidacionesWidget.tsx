'use client'

import React, { useState } from 'react';
import { generarLiquidacion } from '@/app/rrhh_liquidaciones_actions';
import { Calculator, FileText, Loader2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LiquidacionesWidget({ 
  trabajadorId, 
  liquidaciones 
}: { 
  trabajadorId: number, 
  liquidaciones: any[] 
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Default to previous month or current month depending on the date. 
  // Let's use current month.
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [periodo, setPeriodo] = useState(currentPeriod);
  const [dias, setDias] = useState(30);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await generarLiquidacion(trabajadorId, periodo, dias);
    if (res.success) {
      alert("Liquidación generada con éxito.");
      router.refresh();
    } else {
      alert(res.error || 'Error al generar liquidación');
    }
    setLoading(false);
  };

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
        <Calculator size={20} className="text-purple-600" />
        <h3 className="font-bold text-slate-800">Liquidaciones de Sueldo</h3>
      </div>
      
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
            <input 
              type="month" 
              required
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Días Trabajados</label>
            <input 
              type="number" 
              required
              min="1"
              max="30"
              value={dias}
              onChange={(e) => setDias(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Calcular y Generar
          </button>
        </form>
      </div>

      <div className="p-0">
        {liquidaciones && liquidaciones.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {liquidaciones.map((liq: any) => (
              <div key={liq.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Período {liq.periodo}</h4>
                    <p className="text-xs text-slate-500">
                      Emitida el {new Date(liq.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Líquido a Pagar</p>
                    <p className="font-bold text-slate-800">{formatoMoneda(liq.liquido_pagar)}</p>
                  </div>
                  <Link 
                    href={`/panel/rrhh/${trabajadorId}/liquidacion/${liq.id}`}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 bg-white"
                    title="Ver Colilla"
                  >
                    Ver PDF
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p>No se han generado liquidaciones para este trabajador.</p>
          </div>
        )}
      </div>
    </div>
  );
}
