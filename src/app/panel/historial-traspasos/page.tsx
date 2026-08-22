'use client'

import React, { useEffect, useState } from 'react';
import { getHistorialTraspasos, anularTraspaso } from '@/app/actions';
import { ArrowLeft, ArrowRightLeft, FileDown, Ban, ChevronDown, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';

export default function HistorialTraspasosPage() {
  const [traspasos, setTraspasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [procesandoAnulacion, setProcesandoAnulacion] = useState<number | null>(null);

  const { items: sortedTraspasos, requestSort, sortConfig } = useSortableData(traspasos);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    const res = await getHistorialTraspasos();
    if (res.success) {
      setTraspasos(res.data || []);
    } else {
      alert("Error al cargar historial: " + res.error);
    }
    setLoading(false);
  };

  const toggle = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAnular = async (id_traspaso: number) => {
    if (!confirm("¿Estás seguro de que deseas anular este traspaso? Las cantidades serán devueltas a sus sucursales de origen.")) return;
    
    setProcesandoAnulacion(id_traspaso);
    const res = await anularTraspaso(id_traspaso);
    if (res.success) {
      await cargarHistorial();
    } else {
      alert("Error al anular: " + res.error);
    }
    setProcesandoAnulacion(null);
  };

  const generarPDF = async (traspaso: any) => {
    const doc = new jsPDF();
    const { applyCorporateHeader, applyCorporateFooter, formatDate } = await import('@/lib/pdfUtils');
    
    const fechaFormat = new Date(traspaso.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    
    await applyCorporateHeader(
      doc, 
      "Informe de Traspaso de Inventario", 
      traspaso.correlativo || '000000', 
      fechaFormat
    );
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Estado: ${traspaso.estado}`, 14, 50);
    
    let currentY = 60;

    // Agrupar detalles por origen-destino para mantener el formato
    const groups = traspaso.detalles.reduce((acc: any, item: any) => {
      const key = `${item.sucursal_origen} -> ${item.sucursal_destino}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    Object.keys(groups).forEach((key, index) => {
      if (index > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(5, 150, 105);
      doc.text(`Ruta: ${key}`, 14, currentY);
      currentY += 5;

      const groupItems = groups[key];
      const tableData = groupItems.map((item: any) => [
        item.cod_art,
        item.descripcion,
        new Date(item.fecha_vencimiento).toLocaleDateString('es-CL', { month: '2-digit', year: 'numeric' }),
        item.cantidad.toString()
      ]);

      const isAnulado = traspaso.estado === 'ANULADO';
      autoTable(doc, {
        startY: currentY,
        head: [['Cód.', 'Medicamento', 'Vencimiento', 'Cant.']],
        body: tableData,
        headStyles: { 
          fillColor: isAnulado ? [254, 226, 226] : [241, 245, 249], // red-50 if anulado, else slate-100
          textColor: isAnulado ? [153, 27, 27] : [15, 23, 42], // red-800 if anulado, else slate-900
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 10,
          cellPadding: 5,
          lineColor: isAnulado ? [252, 165, 165] : [226, 232, 240], // red-300 if anulado
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
          fillColor: [250, 250, 250]
        },
        columnStyles: { 
          0: { halign: 'center', fontStyle: 'bold' }, 
          1: { halign: 'left' },
          2: { halign: 'center' },
          3: { halign: 'right', fontStyle: 'bold', textColor: isAnulado ? [153, 27, 27] : [5, 150, 105] } // Red if annulled, else Emerald
        },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    applyCorporateFooter(doc);

    doc.save(`Traspaso_${traspaso.correlativo}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="bg-fuchsia-600 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-600/20">
          <ArrowRightLeft size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial de Traspasos</h1>
          <p className="text-slate-500">Gestión, impresión y anulación de transferencias de inventario</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <SortableHeader label="Correlativo" sortKey="correlativo" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
                <SortableHeader label="Fecha y Hora" sortKey="fecha" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
                <th className="px-6 py-4 font-semibold text-center">Líneas</th>
                <SortableHeader label="Estado" sortKey="estado" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4 text-center" />
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2 text-fuchsia-600" size={32} />
                    Cargando historial...
                  </td>
                </tr>
              ) : traspasos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No se han registrado traspasos en el sistema.
                  </td>
                </tr>
              ) : (
                sortedTraspasos.map((t) => {
                  const isAnulado = t.estado === 'ANULADO';
                  return (
                    <React.Fragment key={t.id_traspaso}>
                      <tr className={`hover:bg-slate-50 transition-colors ${isAnulado ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <button onClick={() => toggle(t.id_traspaso)} className="flex items-center gap-2 font-bold text-fuchsia-600 hover:text-fuchsia-800">
                            {expanded[t.id_traspaso] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            {t.correlativo}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {new Date(t.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold">
                            {t.detalles?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${isAnulado ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                            {t.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => generarPDF(t)} 
                              className="p-2 text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors tooltip"
                              title="Imprimir PDF"
                            >
                              <FileDown size={20} />
                            </button>
                            {!isAnulado && (
                              <button 
                                onClick={() => handleAnular(t.id_traspaso)}
                                disabled={procesandoAnulacion === t.id_traspaso}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                                title="Anular Traspaso"
                              >
                                {procesandoAnulacion === t.id_traspaso ? <Loader2 className="animate-spin" size={20} /> : <Ban size={20} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded[t.id_traspaso] && (
                        <tr className="bg-slate-50/80 inset-shadow-sm">
                          <td colSpan={5} className="p-0 border-b border-slate-200">
                            <div className="px-14 py-6">
                              <h4 className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-fuchsia-400 rounded-full"></div>
                                Detalle de Medicamentos Traspasados
                              </h4>
                              <table className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <thead className="bg-slate-100/80 text-slate-500 text-xs">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold">Producto</th>
                                    <th className="px-4 py-3 font-semibold">Origen</th>
                                    <th className="px-4 py-3 font-semibold">Destino</th>
                                    <th className="px-4 py-3 font-semibold text-center">Cant.</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {t.detalles?.map((det: any) => (
                                    <tr key={det.id_detalle} className={`hover:bg-slate-50 ${isAnulado ? 'opacity-60' : ''}`}>
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-slate-700">{det.descripcion}</div>
                                        <div className="text-xs font-mono text-slate-400">{det.cod_art}</div>
                                      </td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{det.sucursal_origen}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{det.sucursal_destino}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded">{det.cantidad}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {isAnulado && (
                                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-500 bg-red-50 w-fit px-4 py-2 rounded-lg border border-red-100">
                                  <AlertTriangle size={16} /> Este traspaso fue revertido en el inventario.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}