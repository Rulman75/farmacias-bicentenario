'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { getMarginAnalysis } from '@/app/actions';
import { TrendingUp, Calendar, FileText, Loader2, AlertTriangle, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import Link from 'next/link';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MargenesPage() {
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [simulatedData, setSimulatedData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [numero, setNumero] = useState('');
  
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filters
  const [comportamiento, setComportamiento] = useState('todos');
  const [chartView, setChartView] = useState('top20');
  
  // Seleccionados para el gráfico
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const fetchAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setError('');
    setSelectedRows(new Set());
    
    const res = await getMarginAnalysis({ startDate, endDate, numero });
    if (res.success && res.data) {
      setOriginalData(res.data);
      // Initialize simulations
      const initSims = res.data.map(d => ({
        ...d,
        simCostoNuevoNeto: d.COSTO_NUEVO_NETO || d.COSTO_ACTUAL_NETO,
        simCostoNuevoBruto: d.COSTO_NUEVO_BRUTO || d.COSTO_ACTUAL_BRUTO,
        simPrecioVenta: d.PRECIO_VENTA
      }));
      setSimulatedData(initSims);
    } else {
      setError(res.error || 'Error desconocido');
    }
    setLoading(false);
  };

  const handleSimulate = (index: number, field: 'costo_neto' | 'precio', value: string) => {
    const val = parseFloat(value) || 0;
    setSimulatedData(prev => {
      const copy = [...prev];
      if (field === 'costo_neto') {
        copy[index].simCostoNuevoNeto = val;
        copy[index].simCostoNuevoBruto = val * 1.19;
      }
      if (field === 'precio') copy[index].simPrecioVenta = val;
      
      const isNew = copy[index].es_nuevo === 1;
      const costoNuevoNeto = copy[index].simCostoNuevoNeto;
      const precioVenta = copy[index].simPrecioVenta;
      
      if (costoNuevoNeto > 0) {
        copy[index].MARGEN_NUEVO_NETO = (((precioVenta / 1.19) - costoNuevoNeto) / costoNuevoNeto) * 100;
        copy[index].MARGEN_NUEVO_BRUTO = ((precioVenta - costoNuevoNeto) / costoNuevoNeto) * 100;
      } else {
        copy[index].MARGEN_NUEVO_NETO = null;
        copy[index].MARGEN_NUEVO_BRUTO = null;
      }
      return copy;
    });
  };

  const toggleRowSelection = (index: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedRows(newSet);
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    
    const excelData = filteredData.map(item => ({
      'Fecha': item.fecha,
      'Tipo': item.tipo,
      'Número': item.numero,
      'Código Artículo': item.cod_art,
      'Descripción': item.descripcion,
      'Costo Actual (Neto)': item.COSTO_ACTUAL_NETO,
      'Costo Nuevo Simulado (Neto)': item.simCostoNuevoNeto,
      'Precio Simulado (Bruto)': item.simPrecioVenta,
      'Margen Real Actual (%)': item.MARGEN_ACTUAL_NETO,
      'Margen Real Nuevo (%)': item.MARGEN_NUEVO_NETO,
      'Margen c/IVA Actual (%)': item.MARGEN_ACTUAL_BRUTO,
      'Margen c/IVA Nuevo (%)': item.MARGEN_NUEVO_BRUTO,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Simulación Margen");
    XLSX.writeFile(wb, `Margenes_${startDate}_${endDate}.xlsx`);
  };

  // Filtrado de la tabla y datos base
  const filteredData = useMemo(() => {
    return simulatedData.filter((item) => {
      const isNew = item.es_nuevo === 1;
      const mNuevo = item.MARGEN_NUEVO_NETO;
      const mActual = item.MARGEN_ACTUAL_NETO;
      
      let colorStatus = '';
      if (!isNew && mNuevo !== null && mActual !== null) {
        if (mNuevo > mActual) colorStatus = 'improved';
        else if (mNuevo < mActual) colorStatus = 'worsened';
      }

      if (comportamiento === 'nuevos' && !isNew) return false;
      if (comportamiento !== 'todos' && comportamiento !== 'nuevos' && isNew) return false;
      if (comportamiento === 'aumentaron' && colorStatus !== 'improved') return false;
      if (comportamiento === 'disminuyeron' && colorStatus !== 'worsened') return false;
      if (comportamiento === 'sin_cambio' && colorStatus !== '') return false;
      
      return true;
    });
  }, [simulatedData, comportamiento]);

  const { items: sortedFilteredData, requestSort, sortConfig } = useSortableData(filteredData);

  // Datos para el gráfico
  const chartDataObj = useMemo(() => {
    let dataToGraph = [];
    if (selectedRows.size > 0) {
      dataToGraph = simulatedData.filter((_, i) => selectedRows.has(i));
    } else {
      dataToGraph = [...filteredData];
      if (chartView === 'top20') {
        dataToGraph.sort((a, b) => Math.abs((b.MARGEN_NUEVO || 0) - (b.MARGEN_ACTUAL || 0)) - Math.abs((a.MARGEN_NUEVO || 0) - (a.MARGEN_ACTUAL || 0)));
        dataToGraph = dataToGraph.slice(0, 20);
      }
    }

    return {
      labels: dataToGraph.map(d => d.descripcion.substring(0, 15) + '...'),
      datasets: [
        {
          label: 'Margen Actual (%)',
          data: dataToGraph.map(d => d.MARGEN_ACTUAL_NETO || 0),
          backgroundColor: 'rgba(94, 234, 212, 0.4)', // teal-300
          borderColor: 'rgb(20, 184, 166)', // teal-500
          borderWidth: 1,
        },
        {
          label: 'Margen Simulado (%)',
          data: dataToGraph.map(d => d.MARGEN_NUEVO_NETO || 0),
          backgroundColor: 'rgba(99, 102, 241, 0.4)', // indigo-500
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 1,
        }
      ]
    };
  }, [filteredData, selectedRows, chartView, simulatedData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false }
    }
  };

  const formatoMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto || 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-3 rounded-xl text-white shadow-lg shadow-teal-500/30">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Análisis de Margen (Simulador)</h1>
            <p className="text-slate-500">Consulta variaciones de costo y simula el impacto.</p>
          </div>
        </div>
        <button 
          onClick={exportToExcel}
          disabled={filteredData.length === 0}
          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 border border-emerald-300 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FileSpreadsheet size={18} /> Exportar a Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 font-medium text-sm border border-red-100">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        
        <form onSubmit={fetchAnalysis} className="flex flex-col lg:flex-row gap-4 items-end flex-wrap">
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Fin</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-slate-700 mb-1">Nº Factura</label>
            <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ej: 1234" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-slate-700 mb-1">Comportamiento</label>
            <select value={comportamiento} onChange={e => setComportamiento(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="todos">Todos</option>
              <option value="aumentaron">Aumentaron</option>
              <option value="disminuyeron">Disminuyeron</option>
              <option value="sin_cambio">Sin Cambios</option>
              <option value="nuevos">Nuevos</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full lg:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-2 rounded-xl transition-colors shadow-lg shadow-teal-600/20">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Consultar'}
          </button>
        </form>
      </div>

      {hasSearched && !error && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700">Variación de Margen</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Mostrar:</span>
                <select value={chartView} onChange={e => setChartView(e.target.value)} className="text-sm px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                  <option value="top20">Top 20 Productos</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>
            
            <div className="h-80 w-full overflow-x-auto">
              <div style={{ minWidth: chartView === 'all' && chartDataObj.labels.length > 20 ? `${chartDataObj.labels.length * 40}px` : '100%', height: '100%' }}>
                <Bar options={chartOptions} data={chartDataObj} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-center w-12 sticky top-0 z-10 bg-slate-50">Graf.</th>
                    <SortableHeader label="Fecha / Doc" sortKey="fecha" currentSort={sortConfig} requestSort={requestSort} className="w-36" />
                    <SortableHeader label="Producto" sortKey="descripcion" currentSort={sortConfig} requestSort={requestSort} />
                    <SortableHeader label="Costo Ant. (Neto)" sortKey="COSTO_ACTUAL_NETO" currentSort={sortConfig} requestSort={requestSort} className="text-right border-l border-slate-100 w-28" />
                    <SortableHeader label="Costo Sim. (Neto)" sortKey="simCostoNuevoNeto" currentSort={sortConfig} requestSort={requestSort} className="text-right bg-slate-50 w-32" />
                    <SortableHeader label="P. Venta Sim (Bruto)" sortKey="simPrecioVenta" currentSort={sortConfig} requestSort={requestSort} className="text-right border-l border-slate-100 w-32" />
                    <SortableHeader label="Margen Ant. (Neto)" sortKey="MARGEN_ACTUAL_NETO" currentSort={sortConfig} requestSort={requestSort} className="text-right border-l border-slate-100 w-28" />
                    <SortableHeader label="Margen Sim. (Neto)" sortKey="MARGEN_NUEVO_NETO" currentSort={sortConfig} requestSort={requestSort} className="text-right bg-teal-50/30 text-teal-700 w-28" />
                    <SortableHeader label="Margen Sim. c/IVA" sortKey="MARGEN_NUEVO_BRUTO" currentSort={sortConfig} requestSort={requestSort} className="text-right bg-teal-100 text-teal-800 w-28" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400"><Loader2 size={32} className="animate-spin mx-auto mb-2 text-teal-500" /></td></tr>
                  ) : sortedFilteredData.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">No se encontraron variaciones.</td></tr>
                  ) : (
                    sortedFilteredData.map((d, index) => {
                      const realIndex = simulatedData.findIndex(sd => sd.id === d.id && sd.cod_art === d.cod_art && sd.fecha === d.fecha);
                      const originalIndex = realIndex >= 0 ? realIndex : index;
                      
                      const diffMargen = d.es_nuevo === 1 ? 0 : ((d.MARGEN_NUEVO_NETO || 0) - (d.MARGEN_ACTUAL_NETO || 0));
                      let margenColor = "text-slate-600";
                      let badge = null;
                      
                      if (!d.es_nuevo && d.MARGEN_NUEVO_NETO !== null) {
                        if (diffMargen > 0) {
                          margenColor = "text-emerald-600";
                          badge = <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded ml-1">+{diffMargen.toFixed(1)}%</span>;
                        } else if (diffMargen < 0) {
                          if (d.MARGEN_NUEVO_NETO >= 0) {
                            margenColor = "text-blue-600";
                          } else {
                            margenColor = "text-red-600";
                          }
                          badge = <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded ml-1">{diffMargen.toFixed(1)}%</span>;
                        }
                      }

                      return (
                        <tr key={originalIndex} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={selectedRows.has(originalIndex)} onChange={() => toggleRowSelection(originalIndex)} className="w-4 h-4 cursor-pointer accent-teal-500" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-700">{d.fecha}</div>
                            <div className="text-xs font-mono text-slate-400 mt-1">{d.tipo === '33' ? 'FE' : d.tipo} {d.numero}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 line-clamp-1">{d.descripcion}</div>
                            <div className="flex gap-2 items-center text-xs text-slate-500 mt-1">
                              <span className="font-semibold text-slate-400">COD:</span>
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{d.cod_art}</span>
                              {d.es_nuevo === 1 && <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-sm">NUEVO</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-500 border-l border-slate-100">
                            {d.es_nuevo === 1 ? '-' : formatoMoneda(d.COSTO_ACTUAL_NETO)}
                          </td>
                          <td className="px-4 py-3 text-right bg-slate-50">
                            <div className="relative inline-block w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none pointer-events-none">$</span>
                              <input 
                                type="number" 
                                value={d.simCostoNuevoNeto} 
                                onChange={(e) => handleSimulate(originalIndex, 'costo_neto', e.target.value)}
                                className="w-full pl-6 pr-2 py-1 rounded bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-bold text-slate-800 shadow-sm text-right"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right border-l border-slate-100">
                            <div className="relative inline-block w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 font-medium select-none pointer-events-none">$</span>
                              <input 
                                type="number" 
                                value={d.simPrecioVenta} 
                                onChange={(e) => handleSimulate(originalIndex, 'precio', e.target.value)}
                                className="w-full pl-6 pr-2 py-1 rounded bg-indigo-50 border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 shadow-sm text-right"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-500 border-l border-slate-100">
                            {d.es_nuevo === 1 || d.MARGEN_ACTUAL_NETO === null ? '-' : <span className={d.MARGEN_ACTUAL_NETO < 30 ? 'text-red-500' : ''}>{Number(d.MARGEN_ACTUAL_NETO).toFixed(1)}%</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-black bg-teal-50/30">
                            <div className="flex flex-col items-end">
                              <span className={d.MARGEN_NUEVO_NETO !== null && d.MARGEN_NUEVO_NETO < 0 ? 'text-red-600' : margenColor}>{d.MARGEN_NUEVO_NETO === null ? '-' : Number(d.MARGEN_NUEVO_NETO).toFixed(1) + '%'}</span>
                              {badge}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-black bg-teal-100 text-teal-800">
                             {d.MARGEN_NUEVO_BRUTO === null ? '-' : Number(d.MARGEN_NUEVO_BRUTO).toFixed(1) + '%'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
