'use client'

import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import TransferModal from './TransferModal';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';

export default function AgrupadoTable({ productsList, sucursales }: { productsList: any[], sucursales: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  
  const { items: sortedProducts, requestSort, sortConfig } = useSortableData(productsList);

  const openTransfer = (producto: any, sucursal: any, cellData: any) => {
    setSelectedData({
      cod_art: producto.cod_art,
      descripcion: producto.descripcion,
      cod_sucursal_origen: sucursal.cod_sucursal,
      sucursal_origen: sucursal.nombre,
      cantidad_disponible: cellData.cantidad,
      fecha_vencimiento: cellData.fecha_completa // Necesitamos la fecha completa para el DB
    });
    setModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <SortableHeader 
                label="Producto" 
                sortKey="descripcion" 
                currentSort={sortConfig as any} 
                requestSort={requestSort as any} 
                className="px-6 py-4 whitespace-nowrap sticky left-0 bg-slate-50 z-10 border-r border-slate-200" 
              />
              {sucursales.map(suc => (
                <SortableHeader 
                  key={suc.cod_sucursal}
                  label={suc.nombre} 
                  sortKey={`sucursalData.${suc.cod_sucursal}.cantidad`} 
                  currentSort={sortConfig as any} 
                  requestSort={requestSort as any} 
                  className="px-6 py-4 whitespace-nowrap border-r border-slate-100 last:border-0 text-center" 
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {productsList.length === 0 ? (
              <tr>
                <td colSpan={sucursales.length + 1} className="px-6 py-12 text-center text-slate-400">
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              sortedProducts.map((prod, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="font-bold text-slate-800">{prod.descripcion}</div>
                    <div className="text-xs font-mono text-slate-500 mt-1">{prod.cod_art}</div>
                  </td>
                  {sucursales.map(suc => {
                    const data = prod.sucursalData[suc.cod_sucursal];
                    
                    if (!data) {
                      return (
                        <td key={suc.cod_sucursal} className="px-6 py-4 text-center border-r border-slate-100 last:border-0">
                          <span className="text-slate-300">-</span>
                        </td>
                      );
                    }

                    const isVencido = data.dias_restantes < 0;
                    const isLiquidar = data.dias_restantes >= 0 && data.dias_restantes <= 60;
                    const isProximo = data.dias_restantes > 60 && data.dias_restantes <= 180;
                    const isPrecaucion = data.dias_restantes > 180 && data.dias_restantes <= 270;
                    
                    let bgClass = "bg-[#00B050]/20 text-[#00B050]";
                    if (isVencido) bgClass = "bg-[#D9D9D9] text-slate-700";
                    else if (isLiquidar) bgClass = "bg-[#FF0000]/20 text-[#FF0000]";
                    else if (isProximo) bgClass = "bg-[#E97132]/20 text-[#E97132]";
                    else if (isPrecaucion) bgClass = "bg-[#FFC000]/20 text-[#FFC000]";

                    return (
                      <td key={suc.cod_sucursal} className="px-6 py-4 text-center border-r border-slate-100 last:border-0 relative group">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`px-3 py-1 rounded-full font-bold ${bgClass}`}>
                            {data.cantidad} un.
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {data.fechaStr}
                          </span>
                        </div>
                        {/* Hover Overlay Button for Transfer */}
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button 
                            onClick={() => openTransfer(prod, suc, data)}
                            className="bg-fuchsia-600 text-white p-2 rounded-lg shadow-md hover:bg-fuchsia-700 transition-colors"
                            title="Traspasar"
                          >
                            <ArrowRightLeft size={16} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && selectedData && (
        <TransferModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          data={selectedData} 
          sucursales={sucursales}
        />
      )}
    </div>
  );
}