'use client'

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X, Loader2, XCircle, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { updateIngresoVencimiento, deleteIngresoVencimiento } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function LotesTableClient({ initialLotes }: { initialLotes: any[] }) {
  const [lotes, setLotes] = useState(initialLotes);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCantidad, setEditCantidad] = useState<number>(0);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  // Sync with props when server data changes
  React.useEffect(() => {
    setLotes(initialLotes);
  }, [initialLotes]);

  const handleEdit = (lote: any) => {
    setEditingId(lote.id);
    setEditCantidad(lote.cantidad);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (id: number) => {
    setLoadingId(id);
    const res = await updateIngresoVencimiento(id, editCantidad);
    if (res.success) {
      setLotes(lotes.map(l => l.id === id ? { ...l, cantidad: editCantidad } : l));
      setEditingId(null);
      router.refresh(); // Refresh server state
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      setLoadingId(id);
      const res = await deleteIngresoVencimiento(id);
      if (res.success) {
        setLotes(lotes.filter(l => l.id !== id));
        router.refresh();
      } else {
        alert(res.error);
      }
      setLoadingId(null);
    }
  };

  const getSemaforoInfo = (dias: number) => {
    if (dias < 0) return { icon: XCircle, color: 'text-[#D9D9D9]', bg: 'bg-[#D9D9D9]', border: 'border-[#D9D9D9]', text: 'text-slate-800' };
    if (dias <= 60) return { icon: AlertCircle, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]', border: 'border-[#FF0000]', text: 'text-white' };
    if (dias <= 180) return { icon: AlertCircle, color: 'text-[#E97132]', bg: 'bg-[#E97132]', border: 'border-[#E97132]', text: 'text-white' };
    if (dias <= 270) return { icon: AlertTriangle, color: 'text-[#FFC000]', bg: 'bg-[#FFC000]', border: 'border-[#FFC000]', text: 'text-white' };
    return { icon: CheckCircle, color: 'text-[#00B050]', bg: 'bg-[#00B050]', border: 'border-[#00B050]', text: 'text-white' };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4 font-semibold w-16">Semáforo</th>
            <th className="px-6 py-4 font-semibold">Sucursal</th>
            <th className="px-6 py-4 font-semibold">Cod Artículo</th>
            <th className="px-6 py-4 font-semibold">Cód. Barras</th>
            <th className="px-6 py-4 font-semibold min-w-[200px]">Medicamento</th>
            <th className="px-6 py-4 font-semibold text-center w-32">Cantidad</th>
            <th className="px-6 py-4 font-semibold">Vencimiento</th>
            <th className="px-6 py-4 font-semibold text-center">Días Restantes</th>
            <th className="px-6 py-4 font-semibold text-right w-24">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {lotes.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                No se encontraron registros para los filtros seleccionados.
              </td>
            </tr>
          ) : (
            lotes.map((lote) => {
              const semaforo = getSemaforoInfo(lote.dias_restantes);
              const isEditing = editingId === lote.id;
              const isProcessing = loadingId === lote.id;
              
              const fechaDate = new Date(lote.fecha_vencimiento);
              const fechaStr = isNaN(fechaDate.getTime()) ? '' : fechaDate.toISOString().split('T')[0];

              return (
                <tr key={lote.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    {React.createElement(semaforo.icon, { size: 24, className: `mx-auto ${semaforo.color}` })}
                  </td>
                  <td className="px-6 py-4 font-medium">{lote.sucursal_nombre}</td>
                  <td className="px-6 py-4 font-mono text-xs">{lote.cod_art}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{lote.cod_barra || '-'}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{lote.descripcion}</td>
                  
                  <td className="px-6 py-4 text-center font-bold">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editCantidad} 
                        onChange={(e) => setEditCantidad(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        autoFocus
                      />
                    ) : (
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700 text-base">{lote.cantidad}</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 font-mono text-slate-600">{fechaStr}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold px-3 py-1.5 rounded-lg ${semaforo.bg} ${semaforo.text} shadow-sm`}>
                      {lote.dias_restantes}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {isProcessing ? (
                        <Loader2 size={18} className="animate-spin text-slate-400" />
                      ) : isEditing ? (
                        <>
                          <button onClick={() => handleSave(lote.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Guardar">
                            <Check size={18} />
                          </button>
                          <button onClick={handleCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded" title="Cancelar">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(lote)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Editar Cantidad">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(lote.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar Registro">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
