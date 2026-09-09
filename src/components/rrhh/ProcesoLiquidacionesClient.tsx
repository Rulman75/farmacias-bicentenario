'use client';

import { useState, useEffect } from 'react';
import { getNominaMasiva, generarNominaMasiva, enviarNominaMasiva } from '@/app/rrhh_liquidaciones_actions';
import { FileText, Loader2, Send, CheckCircle, RefreshCcw, Search, Eye } from 'lucide-react';

const formatoMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
};

export default function ProcesoLiquidacionesClient() {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [periodo, setPeriodo] = useState(currentPeriod);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, [periodo]);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getNominaMasiva(periodo);
      if (res.success) {
        setData(res.data || []);
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al cargar nómina' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
    setLoading(false);
  };

  const handleGenerar = async () => {
    if (!confirm(`¿Generar liquidaciones para todos los trabajadores activos en el período ${periodo}?`)) return;
    
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await generarNominaMasiva(periodo);
      if (res.success) {
        setMessage({ type: 'success', text: `Se generaron ${res.generadas} nuevas liquidaciones exitosamente.` });
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al generar liquidaciones.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
    setActionLoading(false);
  };

  const handleEnviar = async () => {
    if (data.length === 0) {
      setMessage({ type: 'error', text: 'No hay liquidaciones para enviar en este período.' });
      return;
    }
    
    if (!confirm(`¿Aprobar nómina y enviar por correo las liquidaciones a ${data.length} trabajadores?`)) return;
    
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await enviarNominaMasiva(periodo);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: (res as any).error || 'Error al enviar correos.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
    setActionLoading(false);
  };

  const totals = {
    imponible: data.reduce((acc, l) => acc + parseFloat(l.total_imponible), 0),
    descuentos: data.reduce((acc, l) => acc + parseFloat(l.total_descuentos), 0),
    liquido: data.reduce((acc, l) => acc + parseFloat(l.liquido_pagar), 0)
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE CONTROL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 flex flex-col md:flex-row gap-6 items-end justify-between">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-slate-700 mb-2">Período de Nómina</label>
          <input 
            type="month" 
            required
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleGenerar}
            disabled={actionLoading || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            1. Generar Faltantes
          </button>
          
          <button
            onClick={handleEnviar}
            disabled={actionLoading || loading || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
            2. Aprobar y Enviar ({data.length})
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* RESULTADOS / REVISIÓN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Search size={18} className="text-slate-400" /> 
            Revisión de Nómina: {periodo}
          </h3>
          <div className="text-sm font-medium text-slate-500">
            {data.length} Trabajadores procesados
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-slate-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No se han generado liquidaciones para este período. <br/>Haz clic en "Generar Faltantes".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-semibold">Trabajador</th>
                  <th className="px-6 py-3 font-semibold">Cargo</th>
                  <th className="px-6 py-3 font-semibold text-right">Días Trab.</th>
                  <th className="px-6 py-3 font-semibold text-right">T. Imponible</th>
                  <th className="px-6 py-3 font-semibold text-right">T. Descuentos</th>
                  <th className="px-6 py-3 font-semibold text-right text-emerald-700">Líquido a Pagar</th>
                  <th className="px-6 py-3 font-semibold text-center">Revisar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((liq) => (
                  <tr key={liq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{liq.nombres} {liq.apellido_paterno}</p>
                      <p className="text-xs text-slate-500">{liq.rut}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {liq.cargo_nombre || 'Sin cargo'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800 text-right font-medium">
                      {liq.dias_trabajados}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">
                      {formatoMoneda(liq.total_imponible)}
                    </td>
                    <td className="px-6 py-4 text-sm text-rose-600 text-right">
                      - {formatoMoneda(liq.total_descuentos)}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-600 text-right font-bold bg-emerald-50/30">
                      {formatoMoneda(liq.liquido_pagar)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a 
                        href={`/panel/rrhh/${liq.trabajador_id}/liquidacion/${liq.id}`}
                        target="_blank"
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800 text-white">
                <tr>
                  <td colSpan={3} className="px-6 py-4 font-bold text-right">TOTALES NÓMINA</td>
                  <td className="px-6 py-4 font-bold text-right">{formatoMoneda(totals.imponible)}</td>
                  <td className="px-6 py-4 font-bold text-right text-rose-300">- {formatoMoneda(totals.descuentos)}</td>
                  <td className="px-6 py-4 font-black text-right text-emerald-300 text-lg">{formatoMoneda(totals.liquido)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
