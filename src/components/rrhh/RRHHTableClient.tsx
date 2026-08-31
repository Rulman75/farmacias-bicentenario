'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSortableData } from '@/hooks/useSortableData';
import SortableHeader from '@/components/SortableHeader';
import { Search, Loader2, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RRHHTableClient({ 
  initialTrabajadores, 
  search, 
  estado 
}: { 
  initialTrabajadores: any[],
  search: string,
  estado: string
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(search);
  const [isPending, startTransition] = useTransition();

  const { items: sortedTrabajadores, requestSort, sortConfig } = useSortableData(initialTrabajadores);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (estado !== 'ACTIVO') params.set('estado', estado);
      router.push(`/panel/rrhh?${params.toString()}`);
    });
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    startTransition(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (val !== 'ACTIVO') params.set('estado', val);
      router.push(`/panel/rrhh?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
        
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por RUT o Nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-500">Estado:</label>
          <select 
            value={estado} 
            onChange={handleEstadoChange}
            disabled={isPending}
            className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-300px)] relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
             <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-0">
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <SortableHeader label="RUT" sortKey="rut" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
              <SortableHeader label="Nombres" sortKey="nombres" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
              <SortableHeader label="Apellidos" sortKey="apellidos" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
              <SortableHeader label="Teléfono" sortKey="telefono" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
              <SortableHeader label="Previsión" sortKey="afp_nombre" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
              <SortableHeader label="Salud" sortKey="salud_nombre" currentSort={sortConfig} requestSort={requestSort} className="px-6 py-4" />
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {sortedTrabajadores.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No se encontraron trabajadores registrados.
                </td>
              </tr>
            ) : (
              sortedTrabajadores.map((trabajador) => (
                <tr key={trabajador.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{trabajador.rut}</td>
                  <td className="px-6 py-4">{trabajador.nombres}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{trabajador.apellidos}</td>
                  <td className="px-6 py-4">{trabajador.telefono || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {trabajador.afp_nombre || 'No asignada'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {trabajador.salud_nombre || 'No asignada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/panel/rrhh/${trabajador.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <FileText size={16} />
                      Ver Ficha
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
