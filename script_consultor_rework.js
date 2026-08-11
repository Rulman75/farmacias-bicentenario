const fs = require('fs');
const path = require('path');

const pageCode = `'use client'

import React, { useState } from 'react';
import { getConsultorProductos } from '@/app/actions';
import { Search, Loader2, Tag, Box, ArrowRight, X, Info } from 'lucide-react';

export default function ConsultorPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const limit = 50;
  
  const [hasSearched, setHasSearched] = useState(false);
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const fetchProducts = async (currentPage = 1) => {
    setLoading(true);
    setHasSearched(true);
    
    const params = {
      q: query || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page: currentPage,
      limit
    };
    
    const res = await getConsultorProductos(params);
    if (res.success && res.data) {
      setProducts(res.data.products);
      setTotalItems(res.data.totalItems);
      setPage(res.data.currentPage);
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const formatoMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto || 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/30">
          <Tag size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Consultor de Precios</h1>
          <p className="text-slate-500">Busca medicamentos y verifica precios actuales</p>
        </div>
      </div>

      {/* Panel de Filtros Superiores */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Producto</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ej. Paracetamol..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Mín.</label>
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Máx.</label>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="99999"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ordenar por</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="default">Relevancia / Nombre</option>
              <option value="price_asc">Menor Precio</option>
              <option value="price_desc">Mayor Precio</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Consultar'}
          </button>
        </form>
      </div>

      {/* Resultados: Grilla de Tarjetas */}
      {hasSearched && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold text-slate-700 text-lg">Resultados de Búsqueda</h3>
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {totalItems} productos encontrados
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="font-medium text-slate-500">Cargando catálogo...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Search size={40} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">No se encontraron resultados</h2>
              <p className="text-slate-500 max-w-md">Intenta ajustar tus filtros de búsqueda o prueba con otro nombre de medicamento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <div 
                  key={p.cod_art} 
                  onClick={() => setSelectedProduct(p)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col h-full relative group"
                >
                  <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <Info size={20} />
                  </div>
                  
                  <div className="mb-auto pr-8">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block mb-3">
                      {p.cod_art}
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-3">
                      {p.descripcion}
                    </h3>
                    <p className="text-sm text-slate-500 mb-1">{p.Marca || 'Sin marca'}</p>
                    <p className="text-xs text-slate-400">{p.Origen || 'N/A'}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-slate-500">Caja ({p.UnidadesCaja}u)</span>
                      <span className="text-xl font-bold text-slate-800">{formatoMoneda(p.Precio)}</span>
                    </div>
                    {p.UnidadesCaja > 1 && (
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-medium text-indigo-400">Por Unidad</span>
                        <span className="text-base font-black text-indigo-600">{formatoMoneda(p.PrecioFrac)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalItems > limit && !loading && (
            <div className="flex justify-center items-center gap-4 py-6">
              <button 
                disabled={page === 1}
                onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); fetchProducts(page - 1); }}
                className="px-6 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                {page} / {Math.ceil(totalItems / limit)}
              </span>
              <button 
                disabled={page >= Math.ceil(totalItems / limit)}
                onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); fetchProducts(page + 1); }}
                className="px-6 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-indigo-700 p-6 flex flex-col justify-end">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              <span className="bg-white/20 text-white backdrop-blur-md w-fit px-3 py-1 rounded-lg text-sm font-mono font-bold mb-2">
                Código: {selectedProduct.cod_art}
              </span>
            </div>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 leading-tight">
                {selectedProduct.descripcion}
              </h2>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Laboratorio / Marca</p>
                  <p className="font-bold text-slate-700">{selectedProduct.Marca || 'Sin registro'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Origen</p>
                  <p className="font-bold text-slate-700">{selectedProduct.Origen || 'Sin registro'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Formato</p>
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold">
                    <Box size={16} /> {selectedProduct.UnidadesCaja} unidades
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-600 font-medium">Precio por Caja</span>
                  <span className="text-2xl font-bold text-slate-800">{formatoMoneda(selectedProduct.Precio)}</span>
                </div>
                {selectedProduct.UnidadesCaja > 1 && (
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-indigo-500 font-medium flex items-center gap-2">
                      <ArrowRight size={16} /> Precio Fraccionado
                    </span>
                    <span className="text-xl font-black text-indigo-600">{formatoMoneda(selectedProduct.PrecioFrac)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}`;

fs.writeFileSync('src/app/consultor/page.tsx', pageCode);
