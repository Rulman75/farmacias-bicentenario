'use client';

import React, { useState, useEffect } from 'react';
import { FileStack, FolderOpen, MapPin, User, Save, CheckCircle, Trash2, Loader2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';
import { guardarLineaProposicion, cerrarLineaProposicion, descartarLineaProposicion } from '@/app/actions';

export default function ProposicionClient({ traspasos: initialTraspasos }: { traspasos: any[] }) {
  const [traspasos, setTraspasos] = useState<any[]>(initialTraspasos);
  const router = useRouter();

  useEffect(() => {
    setTraspasos(initialTraspasos);
  }, [initialTraspasos]);

  // Agrupar por Destino y luego por Origen
  const destinations = [...new Set(traspasos.map(t => t.nombre_destino))].filter(Boolean).sort() as string[];
  const [activeTab, setActiveTab] = useState<string | null>(destinations[0] || null);

  useEffect(() => {
    if (activeTab && !destinations.includes(activeTab)) {
      setActiveTab(destinations[0] || null);
    } else if (!activeTab && destinations.length > 0) {
      setActiveTab(destinations[0]);
    }
  }, [destinations, activeTab]);

  // Filtrar los traspasos de la pestaña activa (Destino actual)
  const currentTraspasos = traspasos.filter(t => t.nombre_destino === activeTab);

  // Dentro de esa pestaña, agrupar por origen para visualización
  const itemsByOrigin = currentTraspasos.reduce((acc: any, t: any) => {
    const orig = t.nombre_origen || 'Sin Origen';
    if (!acc[orig]) acc[orig] = [];
    acc[orig].push(t);
    return acc;
  }, {});

  const handleLineUpdated = (id_detalle: number, newValues: Partial<any>) => {
    setTraspasos(prev => prev.map(t => t.id_detalle === id_detalle ? { ...t, ...newValues } : t));
    router.refresh();
  };

  const handleLineRemoved = (id_detalle: number) => {
    setTraspasos(prev => prev.filter(t => t.id_detalle !== id_detalle));
    router.refresh();
  };

  return (
    <div className="max-w-[96%] mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 md:p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileStack size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <Link href="/panel" className="bg-white/15 hover:bg-white/25 p-2.5 rounded-xl text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              <FileStack className="w-8 h-8" />
              Proposición de Traspasos
            </h1>
            <p className="text-blue-100 max-w-3xl text-sm md:text-base">
              Gestiona línea a línea las propuestas de traspaso vigentes. Puedes modificar la Cantidad Propuesta, la Cantidad Aceptada y anotar observaciones las veces que necesites; el stock solo se descontará cuando presiones <b>Cerrar Traspaso</b> en el registro.
            </p>
          </div>
        </div>
      </div>

      {destinations.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No hay proposiciones vigentes</h3>
          <p className="text-slate-500 mb-6">No se encontraron líneas de propuesta de traspaso pendientes.</p>
          <Link href="/panel/agrupado" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-block">
            Proponer un Traspaso en Vista Agrupada
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* TABS */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 p-2">
            {destinations.map(dest => (
              <button
                key={dest}
                onClick={() => setActiveTab(dest)}
                className={`whitespace-nowrap px-6 py-3.5 font-semibold text-sm rounded-xl transition-all mr-2 ${
                  activeTab === dest 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                Hacia: {dest}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="p-4 md:p-6">
            {Object.keys(itemsByOrigin).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(itemsByOrigin).map(([origen, items]: [string, any]) => (
                  <GroupedTable 
                    key={origen} 
                    origen={origen} 
                    items={items} 
                    onLineUpdated={handleLineUpdated}
                    onLineRemoved={handleLineRemoved}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">Selecciona un destino para ver las propuestas.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupedTable({ 
  origen, 
  items, 
  onLineUpdated, 
  onLineRemoved 
}: { 
  origen: string, 
  items: any[],
  onLineUpdated: (id: number, vals: Partial<any>) => void,
  onLineRemoved: (id: number) => void
}) {
  const { items: sortedItems, requestSort, sortConfig } = useSortableData(items);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="bg-slate-100 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-800">Desde: {origen}</span>
          <span className="bg-blue-100 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full ml-2">
            {items.length} {items.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <SortableHeader label="Correlativo" sortKey="correlativo" currentSort={sortConfig} requestSort={requestSort} className="px-4 py-3.5" />
              <SortableHeader label="Producto" sortKey="descripcion" currentSort={sortConfig} requestSort={requestSort} className="px-4 py-3.5 min-w-[200px]" />
              <SortableHeader label="Vencimiento" sortKey="fecha_vencimiento" currentSort={sortConfig} requestSort={requestSort} className="px-4 py-3.5 text-center" />
              <SortableHeader label="Cant. Propuesta" sortKey="cantidad" currentSort={sortConfig} requestSort={requestSort} className="px-4 py-3.5 text-center" />
              <SortableHeader label="Cant. Aceptada" sortKey="cantidad_aceptada" currentSort={sortConfig} requestSort={requestSort} className="px-4 py-3.5 text-center" />
              <th className="px-4 py-3.5 font-semibold min-w-[220px]">Observación</th>
              <SortableHeader label="Usuario / Fecha" sortKey="usuario_registro" currentSort={sortConfig} requestSort={requestSort} className="px-4 py-3.5" />
              <th className="px-4 py-3.5 font-semibold text-right min-w-[180px]">Acciones (Por Línea)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedItems.map((item: any) => (
              <PropuestaRow 
                key={item.id_detalle} 
                item={item} 
                onUpdated={onLineUpdated} 
                onRemoved={onLineRemoved} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PropuestaRow({ 
  item, 
  onUpdated, 
  onRemoved 
}: { 
  item: any, 
  onUpdated: (id: number, vals: Partial<any>) => void,
  onRemoved: (id: number) => void
}) {
  const [cantPropuesta, setCantPropuesta] = useState<number>(Number(item.cantidad) || 0);
  const [cantAceptada, setCantAceptada] = useState<number>(Number(item.cantidad_aceptada ?? item.cantidad) || 0);
  const [observacion, setObservacion] = useState<string>(item.observacion || '');
  const [loadingAction, setLoadingAction] = useState<'save' | 'close' | 'discard' | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setCantPropuesta(Number(item.cantidad) || 0);
    setCantAceptada(Number(item.cantidad_aceptada ?? item.cantidad) || 0);
    setObservacion(item.observacion || '');
  }, [item.cantidad, item.cantidad_aceptada, item.observacion]);

  const handleSave = async () => {
    setLoadingAction('save');
    setSavedSuccess(false);
    const res = await guardarLineaProposicion(item.id_detalle, cantPropuesta, cantAceptada, observacion);
    setLoadingAction(null);
    if (res.success) {
      setSavedSuccess(true);
      onUpdated(item.id_detalle, {
        cantidad: cantPropuesta,
        cantidad_aceptada: cantAceptada,
        observacion
      });
      setTimeout(() => setSavedSuccess(false), 2500);
    } else {
      alert('Error al guardar cambios: ' + res.error);
    }
  };

  const handleCerrar = async () => {
    const confirmMsg = `¿Cerrar esta propuesta de traspaso para "${item.descripcion || item.cod_art}"?\n\n` +
      `• Origen: ${item.nombre_origen}\n` +
      `• Destino: ${item.nombre_destino}\n` +
      `• Cantidad Propuesta: ${cantPropuesta} un.\n` +
      `• Cantidad Aceptada a Traspasar: ${cantAceptada} un.\n\n` +
      `Al confirmar se moverán las ${cantAceptada} unidades aceptadas en el inventario de ambas sucursales.`;

    if (!window.confirm(confirmMsg)) return;

    setLoadingAction('close');
    const res = await cerrarLineaProposicion(item.id_detalle, cantPropuesta, cantAceptada, observacion);
    setLoadingAction(null);
    if (res.success) {
      onRemoved(item.id_detalle);
    } else {
      alert('Error al cerrar traspaso: ' + res.error);
    }
  };

  const handleDescartar = async () => {
    if (!window.confirm(`¿Descartar esta propuesta de "${item.descripcion || item.cod_art}" sin mover stock?`)) return;

    setLoadingAction('discard');
    const res = await descartarLineaProposicion(item.id_detalle, observacion);
    setLoadingAction(null);
    if (res.success) {
      onRemoved(item.id_detalle);
    } else {
      alert('Error al descartar propuesta: ' + res.error);
    }
  };

  const fechaVencStr = item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toISOString().split('T')[0] : '-';

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
        {item.correlativo}
      </td>
      <td className="px-4 py-3.5">
        <div className="font-bold text-slate-800">{item.descripcion || 'Producto'}</div>
        <div className="text-xs font-mono text-slate-400">Cód: {item.cod_art}</div>
        {item.stock_origen !== null && item.stock_origen !== undefined && (
          <div className="text-[11px] text-slate-500 mt-0.5">
            Stock actual en origen: <b className="text-slate-700">{item.stock_origen} un.</b>
          </div>
        )}
      </td>
      <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
        {fechaVencStr}
      </td>
      <td className="px-4 py-3.5 text-center">
        <input
          type="number"
          min="0"
          value={cantPropuesta}
          onChange={e => setCantPropuesta(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 px-2.5 py-1.5 text-center font-bold text-blue-700 bg-blue-50/50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Cantidad Propuesta"
        />
      </td>
      <td className="px-4 py-3.5 text-center">
        <input
          type="number"
          min="0"
          value={cantAceptada}
          onChange={e => setCantAceptada(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 px-2.5 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Cantidad Aceptada a Traspasar"
        />
      </td>
      <td className="px-4 py-3.5">
        <input
          type="text"
          value={observacion}
          onChange={e => setObservacion(e.target.value)}
          placeholder="Anotar observación..."
          className="w-full px-3 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400" />
          {item.usuario_registro || 'SISTEMA'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {new Date(item.fecha).toLocaleString('es-CL')}
        </div>
      </td>
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={handleSave}
            disabled={loadingAction !== null}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
              savedSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Guardar cambios de cantidades y observación sin cerrar la propuesta"
          >
            {loadingAction === 'save' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {savedSuccess ? 'Guardado' : 'Guardar'}
          </button>

          <button
            onClick={handleCerrar}
            disabled={loadingAction !== null}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors shadow-sm"
            title="Cerrar esta propuesta y mover las unidades aceptadas en el inventario"
          >
            {loadingAction === 'close' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Cerrar Traspaso
          </button>

          <button
            onClick={handleDescartar}
            disabled={loadingAction !== null}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Descartar esta propuesta sin mover stock"
          >
            {loadingAction === 'discard' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
