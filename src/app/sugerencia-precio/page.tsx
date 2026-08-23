'use client'

import React, { useState, useEffect } from 'react';
import { getProductoParaSugerencia } from '@/app/actions';
import { guardarSugerencia, getHistorialSugerencias, getSugerenciaDetalle, eliminarSugerencia } from './actions';
import { getCurrentUser } from '@/app/auth/actions';
import { Tag, Search, Plus, Trash2, Printer, Loader2, Save, FileText, Check, AlertCircle, TrendingUp, ChevronDown, ChevronUp, History, Download, PenBox, ArrowLeft, FileDown, Eye } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';
import { applyCorporateHeader, applyCorporateFooter, formatDate } from '@/lib/pdfUtils';

export default function SugerenciaPrecioPage() {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial'>('nueva');
  const [currentUser, setCurrentUser] = useState<any>(null);
  // --- TAB NUEVA SUGERENCIA ---
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [proposedPrices, setProposedPrices] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [observacion, setObservacion] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- TAB HISTORIAL ---
  const [historial, setHistorial] = useState<any[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  const { items: sortedSearchResults, requestSort: requestSortSearch, sortConfig: sortSearch } = useSortableData(searchResults);
  const { items: sortedAddedItems, requestSort: requestSortAdded, sortConfig: sortAdded } = useSortableData(addedItems);
  const { items: sortedHistorial, requestSort: requestSortHistorial, sortConfig: sortHistorial } = useSortableData(historial);

  useEffect(() => {
    getCurrentUser().then(u => setCurrentUser(u));
  }, []);

  const loadHistorial = async () => {
    setHistorialLoading(true);
    const res = await getHistorialSugerencias();
    if (res.success) {
      setHistorial(res.data || []);
    }
    setHistorialLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'historial') {
      loadHistorial();
    }
  }, [activeTab]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    const res = await getProductoParaSugerencia(query);
    if (res.success) {
      setSearchResults(res.data || []);
      const initProps: Record<string, number> = {};
      (res.data || []).forEach((p: any) => {
        initProps[p.cod_art] = p.precio_final1 || 0;
      });
      setProposedPrices(initProps);
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  const handleAdd = (product: any) => {
    const proposed = proposedPrices[product.cod_art];
    const existingIdx = addedItems.findIndex(i => i.cod_art === product.cod_art);
    if (existingIdx >= 0) {
      const newItems = [...addedItems];
      newItems[existingIdx] = { ...product, nuevoPrecio: proposed };
      setAddedItems(newItems);
    } else {
      setAddedItems([...addedItems, { ...product, nuevoPrecio: proposed }]);
    }
  };

  const handleRemove = (cod_art: number) => {
    setAddedItems(addedItems.filter(i => i.cod_art !== cod_art));
  };

  const handleGuardar = async () => {
    if (addedItems.length === 0) return alert('Debes agregar productos a la sugerencia');
    if (!currentUser) return alert('Usuario no identificado');

    setActionLoading(true);
    const res = await guardarSugerencia({
      rut_usuario: currentUser.rut,
      observacion,
      detalles: addedItems
    });
    
    if (res.success) {
      alert('Sugerencia guardada correctamente');
      setAddedItems([]);
      setObservacion('');
      setSearchResults([]);
      setQuery('');
    } else {
      alert('Error al guardar: ' + res.error);
    }
    setActionLoading(false);
  };
  const generatePDF = async (items: any[], obs: string, correlativo: number, dateStr: string) => {
    if (items.length === 0) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    await applyCorporateHeader(doc, 'Documento Oficial de Sugerencia de Precios', correlativo.toString().padStart(6, '0'), dateStr);

    let currentY = 48;
    if (obs) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, currentY, pageWidth - 28, 20, 'FD');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Observación:', 18, currentY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(obs, 18, currentY + 14, { maxWidth: pageWidth - 36 });
      currentY += 28;
    }

    autoTable(doc, {
      startY: currentY,
      head: [['Código', 'Descripción del Producto', 'Precio Público']],
      body: items.map(item => [
        item.cod_art, 
        item.descripcion, 
        `$ ${new Intl.NumberFormat('es-CL').format(item.nuevoPrecio || item.precio_nuevo)}`
      ]),
      headStyles: { 
        fillColor: [241, 245, 249], // slate-100
        textColor: [15, 23, 42], // slate-900
        fontStyle: 'bold', 
        halign: 'center',
        fontSize: 10,
        cellPadding: 5,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.1
      },
      bodyStyles: { 
        textColor: [51, 65, 85], // slate-700
        fontSize: 9,
        cellPadding: 4,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250] // muy sutil
      },
      columnStyles: { 
        0: { halign: 'center', fontStyle: 'bold' }, 
        1: { halign: 'left' },
        2: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] } // Precio en verde
      },
      theme: 'grid'
    });
    
    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.text('Sistema de Gestión Farmacias Bicentenario', 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Sugerencia_Precios_${correlativo}.pdf`);
  };

  const handlePrintCurrent = () => {
    generatePDF(
      addedItems, 
      observacion, 
      Math.floor(Math.random() * 1000) + 100, 
      formatDate(new Date())
    );
  };

  const handlePrintHistorial = async (sugerencia: any) => {
    const res = await getSugerenciaDetalle(sugerencia.id_sugerencia);
    if (res.success) {
      generatePDF(
        res.data || [], 
        sugerencia.observacion, 
        sugerencia.id_sugerencia, 
        formatDate(new Date(sugerencia.fecha))
      );
    } else {
      alert('Error cargando detalles');
    }
  };

  const handleDeleteHistorial = async (id: number) => {
    if (confirm('¿Eliminar esta sugerencia del historial?')) {
      const res = await eliminarSugerencia(id);
      if (res.success) loadHistorial();
      else alert(res.error);
    }
  };

  const handleEditHistorial = async (sugerencia: any) => {
    const res = await getSugerenciaDetalle(sugerencia.id_sugerencia);
    if (res.success) {
      setAddedItems((res.data || []).map((d: any) => ({
        cod_art: d.cod_art,
        descripcion: d.descripcion,
        precio_final1: d.precio_actual,
        costo_neto1: d.costo,
        nuevoPrecio: d.precio_nuevo
      })));
      setObservacion(sugerencia.observacion || '');
      setActiveTab('nueva');
    }
  };

  const formatoMoneda = (monto: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto || 0);
  const calculateMargen = (precioVenta: number, costo: number) => {
    if (!precioVenta || precioVenta <= 0) return 0;
    return ((precioVenta - costo) / precioVenta) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-xl text-white shadow-lg shadow-emerald-500/30">
          <Tag size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sugerencia Precio Público</h1>
          <p className="text-slate-500">Crea sugerencias, simula precios y revisa el historial</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('nueva')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'nueva' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Nueva Sugerencia / Simulador
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'historial' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Historial de Sugerencias
        </button>
      </div>

      {activeTab === 'nueva' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar por código, código de barras o descripción..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
              </button>
            </form>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Resultados de Búsqueda</h3>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-400px)]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <SortableHeader label="Cód." sortKey="cod_art" currentSort={sortSearch} requestSort={requestSortSearch} className="px-6 py-3" />
                    <SortableHeader label="Descripción" sortKey="descripcion" currentSort={sortSearch} requestSort={requestSortSearch} className="px-6 py-3" />
                    <SortableHeader label="Precio Actual" sortKey="precio_final1" currentSort={sortSearch} requestSort={requestSortSearch} className="px-6 py-3" />
                    <SortableHeader label="Costo Bruto" sortKey="costo_neto1" currentSort={sortSearch} requestSort={requestSortSearch} className="px-6 py-3" />
                    <th className="px-6 py-3">Margen Act.</th>
                    <th className="px-6 py-3 text-emerald-700 font-bold">Precio Sugerido</th>
                    <th className="px-6 py-3 text-emerald-700 font-bold">Margen Sug.</th>
                    <th className="px-6 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedSearchResults.map((p) => {
                    const proposed = proposedPrices[p.cod_art] || 0;
                    const isAdded = addedItems.some(i => i.cod_art === p.cod_art);
                    return (
                      <tr key={p.cod_art} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-mono text-slate-500">{p.cod_art}</td>
                        <td className="px-6 py-3 font-bold text-slate-800">{p.descripcion}</td>
                        <td className="px-6 py-3">{formatoMoneda(p.precio_final1)}</td>
                        <td className="px-6 py-3 text-slate-500">{formatoMoneda(p.costo_neto1)}</td>
                        <td className="px-6 py-3 font-semibold text-slate-600">
                          {calculateMargen(p.precio_final1, p.costo_neto1).toFixed(1)}%
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="number" 
                            className="w-28 px-3 py-1.5 border border-emerald-300 rounded-lg text-emerald-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            value={proposed}
                            onChange={(e) => setProposedPrices({...proposedPrices, [p.cod_art]: Number(e.target.value)})}
                          />
                        </td>
                        <td className="px-6 py-3 font-bold text-emerald-600">
                          {calculateMargen(proposed, p.costo_neto1).toFixed(1)}%
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button 
                            onClick={() => handleAdd(p)}
                            className={`p-2 rounded-lg transition-colors ${isAdded ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            <Plus size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {addedItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden ring-1 ring-emerald-500/10">
              <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex justify-between items-center">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                  <FileText size={18} /> Sugerencia en Curso
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePrintCurrent}
                    className="px-4 py-2 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 font-semibold rounded-lg flex items-center gap-2 transition-colors text-sm shadow-sm"
                  >
                    <FileDown size={16} /> Imprimir PDF
                  </button>
                  <button 
                    onClick={handleGuardar}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg flex items-center gap-2 transition-colors text-sm shadow-sm"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar Base de Datos
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <input 
                  type="text" 
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Observación para esta sugerencia (opcional)"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="overflow-auto max-h-[calc(100vh-400px)]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <SortableHeader label="Cód." sortKey="cod_art" currentSort={sortAdded} requestSort={requestSortAdded} className="px-6 py-3" />
                    <SortableHeader label="Descripción" sortKey="descripcion" currentSort={sortAdded} requestSort={requestSortAdded} className="px-6 py-3" />
                    <SortableHeader label="Precio Anterior" sortKey="precio_final1" currentSort={sortAdded} requestSort={requestSortAdded} className="px-6 py-3" />
                    <SortableHeader label="Nuevo Precio" sortKey="nuevoPrecio" currentSort={sortAdded} requestSort={requestSortAdded} className="px-6 py-3 text-emerald-700 font-bold" />
                    <th className="px-6 py-3 text-emerald-700 font-bold">Nuevo Margen</th>
                    <th className="px-6 py-3 text-center">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedAddedItems.map((p) => (
                    <tr key={p.cod_art} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-slate-500">{p.cod_art}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{p.descripcion}</td>
                      <td className="px-6 py-3 line-through text-slate-400">{formatoMoneda(p.precio_final1)}</td>
                      <td className="px-6 py-3 font-bold text-emerald-700">{formatoMoneda(p.nuevoPrecio)}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">
                        {calculateMargen(p.nuevoPrecio, p.costo_neto1).toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button 
                          onClick={() => handleRemove(p.cod_art)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {historialLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <SortableHeader label="Nº" sortKey="id_sugerencia" currentSort={sortHistorial} requestSort={requestSortHistorial} className="px-6 py-4 text-center" />
                  <SortableHeader label="Fecha" sortKey="fecha" currentSort={sortHistorial} requestSort={requestSortHistorial} className="px-6 py-4" />
                  <SortableHeader label="Usuario" sortKey="nombre_usuario" currentSort={sortHistorial} requestSort={requestSortHistorial} className="px-6 py-4" />
                  <SortableHeader label="Ítems" sortKey="total_items" currentSort={sortHistorial} requestSort={requestSortHistorial} className="px-6 py-4" />
                  <th className="px-6 py-4 font-semibold">Observación</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedHistorial.map(h => (
                  <tr key={h.id_sugerencia} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600">#{h.id_sugerencia}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {new Date(h.fecha).toLocaleDateString('es-CL')} <span className="text-slate-400 text-xs">{new Date(h.fecha).toLocaleTimeString('es-CL')}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{h.nombre_usuario || h.rut_usuario}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold text-xs">{h.total_items} productos</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate" title={h.observacion}>
                      {h.observacion || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handlePrintHistorial(h)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Imprimir PDF"
                        >
                          <FileDown size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditHistorial(h)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Cargar y Editar"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteHistorial(h.id_sugerencia)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay historial de sugerencias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
