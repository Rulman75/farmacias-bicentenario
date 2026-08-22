'use client'

import React, { useState } from 'react';
import { useTransferStore } from '@/store/transferStore';
import { ArrowLeft, ArrowRightLeft, FileDown, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { guardarTraspasosDB } from '@/app/actions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';

function GroupTable({ groupKey, items, onRemove }: { groupKey: string, items: any[], onRemove: (id: string) => void }) {
  const { items: sortedItems, requestSort, sortConfig } = useSortableData(items);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <span className="font-bold text-slate-700 text-lg">{groupKey}</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
          <tr>
            <SortableHeader label="Cód." sortKey="cod_art" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
            <SortableHeader label="Producto" sortKey="descripcion" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
            <SortableHeader label="Cant." sortKey="cantidad" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4 text-center" />
            <th className="px-6 py-4 font-semibold text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {sortedItems.map((item: any) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-mono text-fuchsia-600 font-medium">{item.cod_art}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{item.descripcion}</td>
              <td className="px-6 py-4 font-bold text-center text-slate-600">
                <span className="bg-slate-100 px-3 py-1 rounded-lg">{item.cantidad} un.</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TraspasosPage() {
  const { items, removeItem, clearCart } = useTransferStore();
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [correlativo, setCorrelativo] = useState('');

  // Agrupar por Origen -> Destino
  const groups = items.reduce((acc: any, item: any) => {
    const key = `${item.sucursal_origen} -> ${item.sucursal_destino}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleProcesar = async () => {
    if (items.length === 0) return;
    setProcesando(true);
    
    const result = await guardarTraspasosDB(items);
    
    if (result.success) {
      setCorrelativo(result.correlativo || '');
      setCompletado(true);
    } else {
      alert("Error al procesar traspasos: " + result.error);
    }
    
    setProcesando(false);
  };

  const generarPDF = async () => {
    const doc = new jsPDF();
    const { applyCorporateHeader, applyCorporateFooter, formatDate } = await import('@/lib/pdfUtils');
    
    await applyCorporateHeader(
      doc, 
      "Informe de Traspasos de Inventario", 
      correlativo || 'BORRADOR', 
      formatDate(new Date())
    );
    
    let currentY = 55;

    // Generar tablas por cada grupo (Origen -> Destino)
    Object.keys(groups).forEach((key, index) => {
      if (index > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(5, 150, 105); // Emerald green for group header
      doc.text(`Ruta: ${key}`, 14, currentY);
      currentY += 5;

      const groupItems = groups[key];
      const tableData = groupItems.map((item: any) => [
        item.cod_art,
        item.descripcion,
        new Date(item.fecha_vencimiento).toLocaleDateString('es-CL', { month: '2-digit', year: 'numeric' }),
        item.cantidad.toString()
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Cód.', 'Medicamento', 'Vencimiento', 'Cant.']],
        body: tableData,
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
          fillColor: [250, 250, 250]
        },
        columnStyles: { 
          0: { halign: 'center', fontStyle: 'bold' }, 
          1: { halign: 'left' },
          2: { halign: 'center' },
          3: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }
        },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    applyCorporateFooter(doc);

    doc.save(`Traspasos_${correlativo || 'BORRADOR'}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/panel/agrupado" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="bg-fuchsia-600 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-600/20">
          <ArrowRightLeft size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finalizar Traspasos</h1>
          <p className="text-slate-500">Verifica los movimientos antes de procesarlos</p>
        </div>
      </div>

      {completado ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Traspasos Procesados Exitosamente!</h2>
          <p className="text-slate-500 mb-8">El inventario ha sido modificado y los traspasos registrados bajo el correlativo <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{correlativo}</span>.</p>
          
          <div className="flex justify-center gap-4">
            <button onClick={generarPDF} className="bg-fuchsia-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-fuchsia-700 transition-colors flex items-center gap-2">
              <FileDown size={20} />
              Descargar Informe PDF
            </button>
            <Link href="/panel/agrupado" onClick={() => clearCart()} className="bg-slate-100 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors">
              Volver a Agrupación
            </Link>
          </div>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 text-slate-500">
              No tienes artículos seleccionados para traspaso.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(groups).map(key => (
                <GroupTable 
                  key={key} 
                  groupKey={key} 
                  items={groups[key]} 
                  onRemove={removeItem} 
                />
              ))}

              <div className="flex justify-end gap-4 mt-8">
                <button 
                  onClick={generarPDF} 
                  className="bg-slate-800 text-white font-medium px-6 py-3 rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <FileDown size={20} />
                  Borrador PDF
                </button>
                <button 
                  onClick={handleProcesar}
                  disabled={procesando}
                  className="bg-fuchsia-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-fuchsia-700 transition-colors shadow-lg shadow-fuchsia-600/30 flex items-center gap-2"
                >
                  {procesando ? (
                    <><Loader2 className="animate-spin" size={20} /> Procesando...</>
                  ) : (
                    <><CheckCircle size={20} /> Procesar Traspasos y Guardar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}