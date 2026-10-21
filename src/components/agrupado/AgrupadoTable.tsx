'use client'

import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import TransferModal from './TransferModal';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';
import { useTransferStore } from '@/store/transferStore';

export default function AgrupadoTable({ productsList, sucursales }: { productsList: any[], sucursales: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const cartItems = useTransferStore(state => state.items);
  
  const { items: sortedProducts, requestSort, sortConfig } = useSortableData(productsList);

  const openTransfer = (producto: any, sucursal: any, cellData: any, allPropuestas: any[], totalPropuesto: number) => {
    setSelectedData({
      cod_art: producto.cod_art,
      descripcion: producto.descripcion,
      cod_sucursal_origen: sucursal.cod_sucursal,
      sucursal_origen: sucursal.nombre,
      cantidad_disponible: cellData.cantidad,
      fecha_vencimiento: cellData.fecha_completa,
      fecha_ymd: cellData.fecha_ymd,
      propuestas: allPropuestas,
      cantidad_propuesta: totalPropuesto
    });
    setModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-250px)]">
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
                    const dataList = prod.sucursalData[suc.cod_sucursal];
                    
                    if (!dataList || dataList.length === 0) {
                      return (
                        <td key={suc.cod_sucursal} className="px-6 py-4 text-center border-r border-slate-100 last:border-0">
                          <span className="text-slate-300">-</span>
                        </td>
                      );
                    }

                    return (
                      <td key={suc.cod_sucursal} className="px-2 py-4 align-top border-r border-slate-100 last:border-0">
                        <div className="flex flex-col gap-2">
                          {dataList.map((data: any, i: number) => {
                            const isVencido = data.dias_restantes < 0;
                            const isLiquidar = data.dias_restantes >= 0 && data.dias_restantes <= 60;
                            const isProximo = data.dias_restantes > 60 && data.dias_restantes <= 180;
                            const isPrecaucion = data.dias_restantes > 180 && data.dias_restantes <= 270;
                            
                            let bgClass = "bg-[#00B050]/20 text-[#00B050]";
                            if (isVencido) bgClass = "bg-[#D9D9D9] text-slate-700";
                            else if (isLiquidar) bgClass = "bg-[#FF0000]/20 text-[#FF0000]";
                            else if (isProximo) bgClass = "bg-[#E97132]/20 text-[#E97132]";
                            else if (isPrecaucion) bgClass = "bg-[#FFC000]/20 text-[#FFC000]";

                            // Combinar propuestas guardadas en BD con las pendientes en carrito local
                            const dbPropuestas = data.propuestas || [];
                            const localPropuestas = cartItems
                              .filter(ci => {
                                const ciDate = new Date(ci.fecha_vencimiento);
                                const ciYmd = `${ciDate.getFullYear()}-${String(ciDate.getMonth() + 1).padStart(2, '0')}-${String(ciDate.getDate()).padStart(2, '0')}`;
                                return String(ci.cod_art) === String(prod.cod_art) &&
                                       Number(ci.cod_sucursal_origen) === Number(suc.cod_sucursal) &&
                                       ciYmd === data.fecha_ymd;
                              })
                              .map(ci => ({
                                sucursal_destino: ci.sucursal_destino,
                                cantidad: ci.cantidad,
                                en_carrito: true
                              }));

                            const allPropuestas = [...dbPropuestas, ...localPropuestas];
                            const totalPropuesto = allPropuestas.reduce((acc, p) => acc + Number(p.cantidad || 0), 0);

                            const tooltipText = allPropuestas.length > 0
                              ? `Propuesto a traspaso:\n` + allPropuestas.map((p: any) => `• Hacia ${p.sucursal_destino}: ${p.cantidad} un.${p.en_carrito ? ' (en borrador)' : ''}`).join('\n')
                              : 'Proponer traspaso';

                            return (
                              <div 
                                key={i} 
                                title={tooltipText}
                                className={`relative group p-2 border rounded-lg transition-colors flex flex-col items-center justify-center gap-1 ${
                                  totalPropuesto > 0 ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-100 hover:border-fuchsia-200'
                                }`}
                              >
                                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${bgClass}`}>
                                  {data.cantidad} un.
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {data.fechaStr}
                                </span>
                                {totalPropuesto > 0 && (
                                  <span className="px-2 py-0.5 text-[10px] rounded-md font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 leading-tight">
                                    Propuesto: {totalPropuesto} un.
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 p-1 transition-opacity rounded-lg z-20">
                                  {allPropuestas.length > 0 && (
                                    <div className="text-[10px] leading-tight text-indigo-700 font-semibold text-center max-h-12 overflow-y-auto w-full px-1">
                                      {allPropuestas.map((p: any, idx: number) => (
                                        <div key={idx} className="truncate">
                                          ➔ {p.sucursal_destino}: <b>{p.cantidad}</b>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => openTransfer(prod, suc, data, allPropuestas, totalPropuesto)}
                                    className="bg-fuchsia-600 text-white px-2.5 py-1 rounded-lg shadow-md hover:bg-fuchsia-700 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                                    title="Proponer Traspaso"
                                  >
                                    <ArrowRightLeft size={12} />
                                    Proponer
                                  </button>
                                </div>
                              </div>
                            );
                          })}
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