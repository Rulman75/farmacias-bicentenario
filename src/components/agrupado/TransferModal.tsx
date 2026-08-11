'use client'

import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useTransferStore } from '@/store/transferStore';

export default function TransferModal({ isOpen, onClose, data, sucursales }: { isOpen: boolean, onClose: () => void, data: any, sucursales: any[] }) {
  const [destino, setDestino] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const addItem = useTransferStore(state => state.addItem);

  if (!isOpen) return null;

  const validSucursales = sucursales.filter(s => s.cod_sucursal !== data.cod_sucursal_origen);

  const handleSave = () => {
    if (!destino || cantidad <= 0 || cantidad > data.cantidad_disponible) return;
    
    const sucDestinoObj = validSucursales.find(s => s.cod_sucursal.toString() === destino);

    addItem({
      id: Date.now().toString(),
      cod_sucursal_origen: data.cod_sucursal_origen,
      sucursal_origen: data.sucursal_origen,
      cod_sucursal_destino: sucDestinoObj.cod_sucursal,
      sucursal_destino: sucDestinoObj.nombre,
      cod_art: data.cod_art,
      descripcion: data.descripcion,
      cantidad: cantidad,
      fecha_vencimiento: data.fecha_vencimiento
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <ArrowRightLeft size={20} className="text-fuchsia-600" />
            <h2 className="font-bold text-lg">Nuevo Traspaso</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-sm font-medium text-slate-500">Producto</div>
            <div className="font-bold text-slate-800">{data.descripcion} <span className="text-slate-400 font-mono text-sm ml-2">({data.cod_art})</span></div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
              <span className="text-sm text-slate-500">Origen: <span className="font-semibold text-slate-700">{data.sucursal_origen}</span></span>
              <span className="text-sm text-slate-500">Disponible: <span className="font-bold text-fuchsia-600">{data.cantidad_disponible} un.</span></span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Sucursal Destino</label>
            <select 
              value={destino} 
              onChange={e => setDestino(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
            >
              <option value="">Seleccione destino...</option>
              {validSucursales.map(s => (
                <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Cantidad a Traspasar</label>
            <input 
              type="number" 
              min="1" 
              max={data.cantidad_disponible}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!destino || cantidad <= 0 || cantidad > data.cantidad_disponible}
            className="px-6 py-2 bg-fuchsia-600 text-white font-medium rounded-lg hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar a Traspasos
          </button>
        </div>
      </div>
    </div>
  );
}