'use client'

import React, { useState, useEffect } from 'react';
import { getHistorialTraspasos, confirmarTraspaso, rechazarTraspaso, actualizarTraspaso } from '@/app/actions';
import { CheckCircle, XCircle, FileEdit, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RecepcionTraspasosPage() {
  const [traspasos, setTraspasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingTraspaso, setEditingTraspaso] = useState<number | null>(null);
  const [modifications, setModifications] = useState<Record<number, number>>({}); // id_detalle -> nueva_cantidad
  const router = useRouter();

  useEffect(() => {
    fetchTraspasos();
  }, []);

  const fetchTraspasos = async () => {
    setLoading(true);
    const res = await getHistorialTraspasos();
    if (res.success && res.data) {
      // Filtrar solo los generados
      setTraspasos(res.data.filter((t: any) => t.estado === 'GENERADO' || t.estado === 'PROCESADO'));
    }
    setLoading(false);
  };

  const handleConfirm = async (id: number) => {
    if (!confirm('¿Confirma la recepción íntegra de este traspaso?')) return;
    setProcessingId(id);
    const res = await confirmarTraspaso(id);
    if (res.success) {
      setTraspasos(t => t.filter(x => x.id_traspaso !== id));
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (id: number) => {
    if (!confirm('¿Desea RECHAZAR este traspaso? Se reversará todo el inventario.')) return;
    setProcessingId(id);
    const res = await rechazarTraspaso(id);
    if (res.success) {
      setTraspasos(t => t.filter(x => x.id_traspaso !== id));
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
    setProcessingId(null);
  };

  const startEdit = (t: any) => {
    setEditingTraspaso(t.id_traspaso);
    const initialMods: Record<number, number> = {};
    t.detalles.forEach((d: any) => {
      initialMods[d.id_detalle] = d.cantidad;
    });
    setModifications(initialMods);
  };

  const cancelEdit = () => {
    setEditingTraspaso(null);
    setModifications({});
  };

  const saveEdit = async (id: number) => {
    if (!confirm('¿Guardar las nuevas cantidades y confirmar traspaso?')) return;
    setProcessingId(id);
    
    const modsArray = Object.keys(modifications).map(key => ({
      id_detalle: parseInt(key),
      nueva_cantidad: modifications[parseInt(key)]
    }));

    const res = await actualizarTraspaso(id, modsArray);
    if (res.success) {
      setTraspasos(t => t.filter(x => x.id_traspaso !== id));
      setEditingTraspaso(null);
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
    setProcessingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowRight size={24} className="rotate-180" />
        </Link>
        <div className="bg-teal-600 p-3 rounded-xl text-white shadow-lg shadow-teal-600/20">
          <CheckCircle size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recepción de Traspasos</h1>
          <p className="text-slate-500">Revisión y confirmación por parte del Químico</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      ) : traspasos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Todo al día</h2>
          <p className="text-slate-500">No hay traspasos pendientes de confirmación.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {traspasos.map(t => (
            <div key={t.id_traspaso} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg text-slate-800 mr-4">{t.correlativo}</span>
                  <span className="text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">Pte. Confirmación</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {new Date(t.fecha).toLocaleString('es-CL')}
                </div>
              </div>
              
              <div className="p-6">
                <table className="w-full text-left border-collapse mb-6">
                  <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="pb-3 font-semibold">Producto</th>
                      <th className="pb-3 font-semibold">Origen</th>
                      <th className="pb-3 font-semibold">Destino</th>
                      <th className="pb-3 font-semibold text-center">Cantidad Enviada</th>
                      {editingTraspaso === t.id_traspaso && <th className="pb-3 font-semibold text-center text-indigo-600">Cant. Recibida</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {t.detalles.map((d: any) => (
                      <tr key={d.id_detalle}>
                        <td className="py-3">
                          <div className="font-bold text-slate-800">{d.descripcion}</div>
                          <div className="font-mono text-xs text-slate-400">Cod: {d.cod_art}</div>
                        </td>
                        <td className="py-3 text-slate-600">{d.sucursal_origen}</td>
                        <td className="py-3 text-slate-600">{d.sucursal_destino}</td>
                        <td className="py-3 text-center">
                          <span className="bg-slate-100 font-bold px-2 py-1 rounded text-slate-700">{d.cantidad}</span>
                        </td>
                        {editingTraspaso === t.id_traspaso && (
                          <td className="py-3 text-center">
                            <input 
                              type="number"
                              className="w-20 px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                              value={modifications[d.id_detalle] ?? d.cantidad}
                              onChange={(e) => setModifications({ ...modifications, [d.id_detalle]: parseInt(e.target.value) || 0 })}
                              min="0"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  {editingTraspaso === t.id_traspaso ? (
                    <>
                      <button onClick={cancelEdit} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                        Cancelar Edición
                      </button>
                      <button 
                        onClick={() => saveEdit(t.id_traspaso)} 
                        disabled={processingId === t.id_traspaso}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"
                      >
                        {processingId === t.id_traspaso ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Guardar y Confirmar
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleReject(t.id_traspaso)}
                        disabled={processingId === t.id_traspaso}
                        className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        Rechazar (No Recibido)
                      </button>
                      <button 
                        onClick={() => startEdit(t)}
                        disabled={processingId === t.id_traspaso}
                        className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FileEdit size={18} />
                        Modificar Cantidades
                      </button>
                      <button 
                        onClick={() => handleConfirm(t.id_traspaso)}
                        disabled={processingId === t.id_traspaso}
                        className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-md flex items-center gap-2"
                      >
                        {processingId === t.id_traspaso ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Confirmar Íntegro
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
