const fs = require('fs');
const path = require('path');

// 1. Modificar actions.ts
let actionsCode = fs.readFileSync('src/app/actions.ts', 'utf8');

actionsCode += `

// TRASPASOS
export async function guardarTraspasosDB(items: any[]) {
  if (!items || items.length === 0) return { success: false, error: "No hay items para procesar" };
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Generate Correlativo
    const correlativo = \`TR-\${new Date().toISOString().slice(0,10).replace(/-/g, '')}-\${Math.floor(Math.random()*10000).toString().padStart(4, '0')}\`;

    // 1. Insert Cabecera
    const [cabResult] = await connection.query(
      'INSERT INTO traspasos_cabecera (correlativo, estado) VALUES (?, ?)',
      [correlativo, 'PROCESADO']
    );
    const id_traspaso = (cabResult as any).insertId;

    // 2. Process Items
    for (const item of items) {
      const fechaVencDate = new Date(item.fecha_vencimiento);
      const yyyy = fechaVencDate.getFullYear();
      const mm = String(fechaVencDate.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaVencDate.getDate()).padStart(2, '0');
      const formattedFecha = \`\${yyyy}-\${mm}-\${dd}\`;

      // a. Insert Detalle
      await connection.query(
        \`INSERT INTO traspasos_detalle 
         (id_traspaso, cod_sucursal_origen, cod_sucursal_destino, cod_art, cantidad, fecha_vencimiento) 
         VALUES (?, ?, ?, ?, ?, ?)\`,
        [id_traspaso, item.cod_sucursal_origen, item.cod_sucursal_destino, item.cod_art, item.cantidad, formattedFecha]
      );

      // b. Descontar de Origen
      await connection.query(
        \`UPDATE ingreso_vencimientos 
         SET cantidad = cantidad - ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1\`,
        [item.cantidad, item.cod_sucursal_origen, item.cod_art, formattedFecha]
      );

      // c. Aumentar en Destino
      const [existDestino] = await connection.query(
        \`SELECT id_ingreso FROM ingreso_vencimientos 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1\`,
        [item.cod_sucursal_destino, item.cod_art, formattedFecha]
      );

      if ((existDestino as any[]).length > 0) {
        await connection.query(
          \`UPDATE ingreso_vencimientos 
           SET cantidad = cantidad + ? 
           WHERE id_ingreso = ?\`,
          [item.cantidad, (existDestino as any[])[0].id_ingreso]
        );
      } else {
        await connection.query(
          \`INSERT INTO ingreso_vencimientos (cod_sucursal, cod_art, cantidad, fecha_vencimiento)
           VALUES (?, ?, ?, ?)\`,
          [item.cod_sucursal_destino, item.cod_art, item.cantidad, formattedFecha]
        );
      }
    }

    await connection.commit();
    revalidatePath('/agrupado');
    revalidatePath('/vencidos');
    revalidatePath('/');
    
    return { success: true, correlativo };
  } catch (error: any) {
    await connection.rollback();
    console.error("Error procesando traspaso:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;
fs.writeFileSync('src/app/actions.ts', actionsCode);

// 2. Crear página traspasos
const pageDir = 'src/app/traspasos';
if (!fs.existsSync(pageDir)) {
  fs.mkdirSync(pageDir, { recursive: true });
}

const pageCode = `'use client'

import React, { useState } from 'react';
import { useTransferStore } from '@/store/transferStore';
import { ArrowLeft, ArrowRightLeft, FileDown, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { guardarTraspasosDB } from '@/app/actions';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function TraspasosPage() {
  const { items, removeItem, clearCart } = useTransferStore();
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [correlativo, setCorrelativo] = useState('');

  // Agrupar por Origen -> Destino
  const groups = items.reduce((acc: any, item: any) => {
    const key = \`\${item.sucursal_origen} -> \${item.sucursal_destino}\`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleProcesar = async () => {
    if (items.length === 0) return;
    setProcesando(true);
    
    const result = await guardarTraspasosDB(items);
    
    if (result.success) {
      setCorrelativo(result.correlativo);
      setCompletado(true);
    } else {
      alert("Error al procesar traspasos: " + result.error);
    }
    
    setProcesando(false);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("Informe de Traspasos de Inventario", 14, 22);
    
    // Correlativo
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(\`Farmacias Bicentenario | \${correlativo || 'BORRADOR'}\`, 14, 30);
    doc.text(\`Fecha: \${new Date().toLocaleDateString('es-CL')}\`, 14, 36);
    
    let currentY = 45;

    // Generar tablas por cada grupo (Origen -> Destino)
    Object.keys(groups).forEach((key, index) => {
      if (index > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(236, 72, 153); // Fuchsia text for group header
      doc.text(\`Ruta: \${key}\`, 14, currentY);
      currentY += 5;

      const groupItems = groups[key];
      const tableData = groupItems.map((item: any) => [
        item.cod_art,
        item.descripcion,
        new Date(item.fecha_vencimiento).toLocaleDateString('es-CL', { month: '2-digit', year: 'numeric' }),
        item.cantidad.toString()
      ]);

      (doc as any).autoTable({
        startY: currentY,
        head: [['Cod.', 'Medicamento', 'Vencimiento', 'Cant.']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [219, 39, 119] }, // Fuchsia-600
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(\`Traspaso_\${correlativo || 'Borrador'}.pdf\`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/agrupado" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
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
            <Link href="/agrupado" onClick={() => clearCart()} className="bg-slate-100 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors">
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
                <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <span className="font-bold text-slate-700 text-lg">{key}</span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Cód.</th>
                        <th className="px-6 py-4 font-semibold">Producto</th>
                        <th className="px-6 py-4 font-semibold text-center">Cant.</th>
                        <th className="px-6 py-4 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {groups[key].map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono text-fuchsia-600 font-medium">{item.cod_art}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.descripcion}</td>
                          <td className="px-6 py-4 font-bold text-center text-slate-600">
                            <span className="bg-slate-100 px-3 py-1 rounded-lg">{item.cantidad} un.</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
}`;

fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageCode);
