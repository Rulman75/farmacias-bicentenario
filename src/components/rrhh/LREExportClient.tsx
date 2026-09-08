'use client';

import { useState } from 'react';
import { generarArchivoLRE } from '@/app/rrhh_reportes_actions';
import { Download, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';

export default function LREExportClient() {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [periodo, setPeriodo] = useState(currentPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generarArchivoLRE(periodo);
      if (!res.success) {
        setError(res.error || 'Ocurrió un error al generar el archivo LRE.');
      } else {
        const blob = new Blob([res.csv as string], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const [anio, mes] = periodo.split('-');
        link.setAttribute('download', `LRE_${anio}${mes}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 max-w-2xl">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
        <FileSpreadsheet size={24} className="text-emerald-600" />
        <div>
          <h3 className="font-bold text-slate-800">Libro de Remuneraciones Electrónico (LRE)</h3>
          <p className="text-xs text-slate-500">Reporte mensual exigido por la Dirección del Trabajo (DT).</p>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Período de Remuneraciones</label>
            <input 
              type="month" 
              required
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 h-10"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Descargar LRE (.csv)
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
          <h4 className="font-bold text-slate-700 mb-2">Pasos para subir el LRE:</h4>
          <ol className="list-decimal list-inside space-y-2">
            <li>Ingresa al portal <a href="https://midt.dirtrab.cl/" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">Mi DT</a> con clave tributaria.</li>
            <li>Ve a <strong>Empleador</strong> &gt; <strong>Libro de Remuneraciones Electrónico</strong>.</li>
            <li>Sube este archivo <code>.csv</code>. Contiene la distribución exacta de ingresos y deducciones.</li>
            <li>Recibirás un comprobante de cumplimiento por parte de la Dirección del Trabajo.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
