'use client'

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';

export default function VencidosTable({ detalles, totalPerdidaGlobal }: { detalles: any[], totalPerdidaGlobal: number }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { items: sortedDetalles, requestSort, sortConfig } = useSortableData(detalles);

  const toggle = (sucursal: string) => {
    setExpanded(prev => ({ ...prev, [sucursal]: !prev[sucursal] }));
  };

  const formatoMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
  };

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
          <SortableHeader label="Sucursal" sortKey="sucursal" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
          <SortableHeader label="Variedad de Productos" sortKey="tipos_productos" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4 text-center" />
          <SortableHeader label="Total Unidades Vencidas" sortKey="cantidad_vencida" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4 text-center" />
          <SortableHeader label="Pérdida Total" sortKey="perdida_total" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4 text-right text-red-700" />
          <th className="px-6 py-4 font-semibold text-right">% Part.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {detalles.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
              No hay productos vencidos en el sistema.
            </td>
          </tr>
        ) : (
          sortedDetalles.map((d, i) => (
            <React.Fragment key={d.cod_sucursal || i}>
              <tr 
                className="hover:bg-slate-50 transition-colors cursor-pointer" 
                onClick={() => toggle(d.cod_sucursal)}
              >
                <td className="px-6 py-4 font-medium text-slate-700 text-lg flex items-center gap-2">
                  {d.meses && d.meses.length > 0 ? (
                    expanded[d.cod_sucursal] ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />
                  ) : <div className="w-[18px]"></div>}
                  {d.sucursal}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-slate-500 font-medium">{d.tipos_productos} tipos</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-[#D9D9D9]/30 text-slate-700 px-3 py-1 rounded-lg font-bold">
                    {d.cantidad_vencida} un.
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black text-red-600 text-lg">
                  {formatoMoneda(Number(d.perdida_total))}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-500">
                  {totalPerdidaGlobal > 0 ? ((Number(d.perdida_total) / totalPerdidaGlobal) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
              {expanded[d.cod_sucursal] && d.meses && d.meses.length > 0 && (
                <tr className="bg-slate-50/50">
                  <td colSpan={5} className="p-0 border-b border-slate-200">
                    <div className="px-14 py-4 bg-slate-50/50 inset-shadow-sm">
                      <h4 className="font-bold text-slate-600 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-red-400 rounded-full"></div>
                        Desglose por Mes (Vencidos):
                      </h4>
                      <table className="w-full max-w-lg bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <thead className="bg-slate-100/80 text-slate-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Mes / Año</th>
                            <th className="px-4 py-2 text-center font-semibold">Unidades</th>
                            <th className="px-4 py-2 text-right font-semibold">Pérdida Monetaria</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {d.meses.map((m: any) => (
                            <tr key={m.mes_vencimiento} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-semibold text-slate-600">{m.mes_vencimiento}</td>
                              <td className="px-4 py-2.5 text-center font-medium text-slate-500">{m.cantidad_vencida}</td>
                              <td className="px-4 py-2.5 text-right text-red-600 font-bold">{formatoMoneda(Number(m.perdida_total))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))
        )}
      </tbody>
    </table>
  );
}