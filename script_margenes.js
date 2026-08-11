const fs = require('fs');
const path = require('path');

// 1. Añadir Server Action para Análisis de Margen
let actionsCode = fs.readFileSync('src/app/actions.ts', 'utf8');

actionsCode += `
// ANALISIS DE MARGEN
export async function getMarginAnalysis(params: { startDate?: string, endDate?: string, numero?: string }) {
  const { startDate, endDate, numero } = params;
  
  if (!numero && (!startDate || !endDate)) {
    return { success: false, error: 'Se requieren fechas o un número de factura/documento' };
  }

  const connection = await pool.getConnection();
  try {
    let query = \`
      SELECT
        variacioncostos.tipo,
        variacioncostos.numero,
        DATE_FORMAT(variacioncostos.fecha, '%d-%m-%Y') as fecha,
        variacioncostos.cod_art,
        variacioncostos.descripcion,
        (variacioncostos.costo_actual * 1.19) as COSTO_ACTUAL,
        (variacioncostos.costo_nuevo * 1.19) as COSTO_NUEVO,
        precios.precio_final1 as PRECIO_VENTA,
        IF(variacioncostos.costo_actual = 0, NULL, (((precios.precio_final1 - (variacioncostos.costo_actual * 1.19))/ (variacioncostos.costo_actual * 1.19)) * 100)) as MARGEN_ACTUAL,
        IF(variacioncostos.costo_nuevo = 0, NULL, (((precios.precio_final1 - (variacioncostos.costo_nuevo * 1.19))/ (variacioncostos.costo_nuevo * 1.19)) * 100)) as MARGEN_NUEVO,
        IF(variacioncostos.costo_actual = 0, 1, 0) as es_nuevo
      FROM variacioncostos
      INNER JOIN precios ON variacioncostos.cod_art = precios.cod_art
      WHERE 1=1
    \`;
    
    const queryParams: any[] = [];
    
    if (startDate && endDate) {
      query += ' AND variacioncostos.fecha >= ? AND variacioncostos.fecha <= ?';
      queryParams.push(startDate, endDate);
    }
    
    if (numero && numero.trim() !== '') {
      query += ' AND variacioncostos.numero = ?';
      queryParams.push(numero.trim());
    }

    query += ' ORDER BY variacioncostos.fecha DESC';

    const [rows] = await connection.query(query, queryParams);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching margin analysis:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;
fs.writeFileSync('src/app/actions.ts', actionsCode);

// 2. Crear Margenes UI
const dir = 'src/app/margenes';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const pageCode = `'use client'

import React, { useState } from 'react';
import { getMarginAnalysis } from '@/app/actions';
import { TrendingUp, Calendar, FileText, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';

export default function MargenesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Date default values (1st day of current month to today)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [numero, setNumero] = useState('');
  
  const [hasSearched, setHasSearched] = useState(false);

  const fetchAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setError('');
    
    const res = await getMarginAnalysis({ startDate, endDate, numero });
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.error || 'Error desconocido');
    }
    setLoading(false);
  };

  const formatoMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto || 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-3 rounded-xl text-white shadow-lg shadow-teal-500/30">
          <TrendingUp size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Análisis de Márgenes</h1>
          <p className="text-slate-500">Evalúa la rentabilidad y las variaciones de costo</p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 font-medium text-sm border border-red-100">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        
        <form onSubmit={fetchAnalysis} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Desde</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Hasta</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center font-bold text-slate-300 pb-3 hidden md:block">O</div>

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nº Documento / Factura</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText size={18} />
              </div>
              <input
                type="text"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="Ignora fechas si usas esto"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Analizar'}
          </button>
        </form>
      </div>

      {/* Resultados */}
      {hasSearched && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Variaciones de Costo y Rentabilidad</h3>
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {data.length} movimientos
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-white text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold">Fecha / Doc</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold text-right border-l border-slate-100">Costo Ant.</th>
                  <th className="px-4 py-3 font-semibold text-right bg-slate-50/50">Costo Nuevo</th>
                  <th className="px-4 py-3 font-semibold text-right border-l border-slate-100">P. Venta</th>
                  <th className="px-4 py-3 font-semibold text-right border-l border-slate-100">Margen Ant.</th>
                  <th className="px-4 py-3 font-semibold text-right bg-teal-50/50 text-teal-700">Margen Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 size={32} className="animate-spin mx-auto mb-2 text-teal-500" />
                      Calculando márgenes...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron variaciones para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  data.map((d, i) => {
                    const diffMargen = d.es_nuevo === 1 ? 0 : (d.MARGEN_NUEVO - d.MARGEN_ACTUAL);
                    let margenClass = "text-slate-600";
                    if (diffMargen > 0) margenClass = "text-emerald-600";
                    if (diffMargen < 0) margenClass = "text-red-600";

                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{d.fecha}</div>
                          <div className="text-xs font-mono text-slate-400">{d.tipo} {d.numero}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 line-clamp-1" title={d.descripcion}>{d.descripcion}</div>
                          <div className="text-xs font-mono text-slate-500">{d.cod_art}</div>
                        </td>
                        
                        <td className="px-4 py-3 text-right font-medium text-slate-500 border-l border-slate-100">
                          {d.es_nuevo === 1 ? '-' : formatoMoneda(d.COSTO_ACTUAL)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800 bg-slate-50/50">
                          {formatoMoneda(d.COSTO_NUEVO)}
                        </td>
                        
                        <td className="px-4 py-3 text-right font-bold text-indigo-600 border-l border-slate-100">
                          {formatoMoneda(d.PRECIO_VENTA)}
                        </td>
                        
                        <td className="px-4 py-3 text-right font-medium text-slate-500 border-l border-slate-100">
                          {d.es_nuevo === 1 ? 'N/A' : (
                            <span className={d.MARGEN_ACTUAL < 30 ? 'text-red-500' : ''}>
                              {Number(d.MARGEN_ACTUAL).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-black bg-teal-50/50">
                          <div className="flex items-center justify-end gap-2">
                            {d.es_nuevo === 0 && (
                              <span className={\`text-[10px] px-1.5 py-0.5 rounded \${diffMargen > 0 ? 'bg-emerald-100 text-emerald-700' : diffMargen < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}\`}>
                                {diffMargen > 0 ? '+' : ''}{diffMargen.toFixed(1)}%
                              </span>
                            )}
                            <span className={d.MARGEN_NUEVO < 30 ? 'text-red-600' : 'text-teal-700'}>
                              {Number(d.MARGEN_NUEVO).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}`;
fs.writeFileSync(path.join(dir, 'page.tsx'), pageCode);

// 3. Add to Sidebar (Comercial Menu)
let sidebarCode = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
if (!sidebarCode.includes('/margenes')) {
  sidebarCode = sidebarCode.replace(
    /<\/div>\s*<\/div>\s*<\/nav>/,
    `
            <Link href="/margenes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
              <TrendingUp size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="font-medium text-slate-400 group-hover:text-white transition-colors">Análisis de Margen</span>
            </Link>
          </div>
        </div>
      </nav>`
  );
  
  fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarCode);
}
