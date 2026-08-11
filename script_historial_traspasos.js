const fs = require('fs');
const path = require('path');

// 1. Update actions.ts
let actionsCode = fs.readFileSync('src/app/actions.ts', 'utf8');

actionsCode += `

export async function getHistorialTraspasos() {
  const connection = await pool.getConnection();
  try {
    const [cabeceras] = await connection.query(\`
      SELECT * FROM traspasos_cabecera ORDER BY fecha DESC
    \`);
    
    if ((cabeceras as any[]).length === 0) return { success: true, data: [] };

    const [detalles] = await connection.query(\`
      SELECT 
        d.*, 
        (SELECT nombre FROM sucursales WHERE cod_sucursal = d.cod_sucursal_origen LIMIT 1) as sucursal_origen,
        (SELECT nombre FROM sucursales WHERE cod_sucursal = d.cod_sucursal_destino LIMIT 1) as sucursal_destino,
        p.descripcion
      FROM traspasos_detalle d
      LEFT JOIN productos p ON d.cod_art = p.cod_art
    \`);

    const result = (cabeceras as any[]).map(c => ({
      ...c,
      detalles: (detalles as any[]).filter(d => d.id_traspaso === c.id_traspaso)
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error getHistorialTraspasos:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function anularTraspaso(id_traspaso: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [cabecera] = await connection.query(\`SELECT estado FROM traspasos_cabecera WHERE id_traspaso = ?\`, [id_traspaso]);
    if ((cabecera as any[]).length === 0) throw new Error("Traspaso no encontrado");
    if ((cabecera as any[])[0].estado === 'ANULADO') throw new Error("El traspaso ya se encuentra anulado");

    const [detalles] = await connection.query(\`SELECT * FROM traspasos_detalle WHERE id_traspaso = ?\`, [id_traspaso]);

    for (const item of (detalles as any[])) {
      const fechaVencDate = new Date(item.fecha_vencimiento);
      const yyyy = fechaVencDate.getFullYear();
      const mm = String(fechaVencDate.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaVencDate.getDate()).padStart(2, '0');
      const formattedFecha = \`\${yyyy}-\${mm}-\${dd}\`;

      // a. Devolver a Origen
      await connection.query(
        \`UPDATE ingreso_vencimientos 
         SET cantidad = cantidad + ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1\`,
        [item.cantidad, item.cod_sucursal_origen, item.cod_art, formattedFecha]
      );

      // b. Restar de Destino
      await connection.query(
        \`UPDATE ingreso_vencimientos 
         SET cantidad = cantidad - ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1\`,
        [item.cantidad, item.cod_sucursal_destino, item.cod_art, formattedFecha]
      );
    }

    await connection.query(\`UPDATE traspasos_cabecera SET estado = 'ANULADO' WHERE id_traspaso = ?\`, [id_traspaso]);

    await connection.commit();
    revalidatePath('/historial-traspasos');
    revalidatePath('/agrupado');
    revalidatePath('/vencidos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("Error anularTraspaso:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;
fs.writeFileSync('src/app/actions.ts', actionsCode);

// 2. Create Historial Page
const pageDir = 'src/app/historial-traspasos';
if (!fs.existsSync(pageDir)) {
  fs.mkdirSync(pageDir, { recursive: true });
}

const pageCode = `'use client'

import React, { useEffect, useState } from 'react';
import { getHistorialTraspasos, anularTraspaso } from '@/app/actions';
import { ArrowLeft, ArrowRightLeft, FileDown, Ban, ChevronDown, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HistorialTraspasosPage() {
  const [traspasos, setTraspasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [procesandoAnulacion, setProcesandoAnulacion] = useState<number | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    const res = await getHistorialTraspasos();
    if (res.success) {
      setTraspasos(res.data);
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

  const generarPDF = (traspaso: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("Informe de Traspaso de Inventario", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(\`Farmacias Bicentenario | \${traspaso.correlativo}\`, 14, 30);
    const fechaFormat = new Date(traspaso.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    doc.text(\`Fecha de Emisión: \${fechaFormat}\`, 14, 36);
    doc.text(\`Estado: \${traspaso.estado}\`, 14, 42);
    
    let currentY = 52;

    // Agrupar detalles por origen-destino para mantener el formato
    const groups = traspaso.detalles.reduce((acc: any, item: any) => {
      const key = \`\${item.sucursal_origen} -> \${item.sucursal_destino}\`;
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
      doc.setTextColor(236, 72, 153);
      doc.text(\`Ruta: \${key}\`, 14, currentY);
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
        head: [['Cod.', 'Medicamento', 'Vencimiento', 'Cant.']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: traspaso.estado === 'ANULADO' ? [156, 163, 175] : [219, 39, 119] },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(\`Traspaso_\${traspaso.correlativo}.pdf\`);
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
                <th className="px-6 py-4 font-semibold">Correlativo</th>
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold text-center">Líneas</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
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
                traspasos.map((t) => {
                  const isAnulado = t.estado === 'ANULADO';
                  return (
                    <React.Fragment key={t.id_traspaso}>
                      <tr className={\`hover:bg-slate-50 transition-colors \${isAnulado ? 'bg-slate-50/50' : ''}\`}>
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
                          <span className={\`px-3 py-1 rounded-full font-bold text-xs \${isAnulado ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}\`}>
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
                                    <tr key={det.id_detalle} className={\`hover:bg-slate-50 \${isAnulado ? 'opacity-60' : ''}\`}>
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
}`;
fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageCode);

// 3. Update Sidebar.tsx
let sidebarCode = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebarCode = sidebarCode.replace(
  /href="\/ingreso".*?Registrar Ingreso[\s\S]*?<\/Link>/,
  `$&
              <Link 
                href="/historial-traspasos"
                className="flex items-center gap-3 w-full p-2 rounded-lg text-left text-sm transition-colors text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-600 font-medium ml-4 pl-4 border-l-2 border-slate-100"
              >
                Historial Traspasos
              </Link>`
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarCode);
