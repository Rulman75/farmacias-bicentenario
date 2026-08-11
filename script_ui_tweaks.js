const fs = require('fs');

// --- 1. Modify Sidebar.tsx ---
const sidebarPath = 'src/components/layout/Sidebar.tsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

// Replace the entire nav with the new menu structure
sidebarCode = `
'use client'

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/app/auth/actions';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Pill, LogOut, ChevronDown, ChevronRight, Clock, ArrowRightLeft, Tag, TrendingUp, Users, ShoppingCart, Briefcase, ShieldAlert } from 'lucide-react';
import { logout } from '@/app/auth/actions';

export default function Sidebar() {
  const [vencimientoOpen, setVencimientoOpen] = useState(false);
  const [comercialOpen, setComercialOpen] = useState(false);
  const [gestionComercialOpen, setGestionComercialOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
  }, []);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen fixed left-0 top-0 z-40">
      <div className="h-20 flex items-center justify-center border-b border-slate-200 bg-white px-4">
        <Image 
          src="/logo-bicentenario.png" 
          alt="Farmacias Bicentenario" 
          width={180} 
          height={55} 
          className="object-contain" 
          priority 
        />
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        
        {/* Menu Vencimiento */}
        <div>
          <button 
            onClick={() => setVencimientoOpen(!vencimientoOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="group-hover:text-white transition-colors text-slate-300" />
              <span className="font-medium group-hover:text-white transition-colors text-slate-300">Vencimiento</span>
            </div>
            {vencimientoOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {vencimientoOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <LayoutDashboard size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Panel Principal</span>
              </Link>
              <Link href="/ingreso" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Pill size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Registrar Ingreso</span>
              </Link>
              <Link href="/historial-traspasos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <ArrowRightLeft size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Historial Traspasos</span>
              </Link>
            </div>
          )}
        </div>

        {/* Menu Comercial */}
        <div>
          <button 
            onClick={() => setComercialOpen(!comercialOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} className="group-hover:text-white transition-colors text-slate-300" />
              <span className="font-medium group-hover:text-white transition-colors text-slate-300">Comercial</span>
            </div>
            {comercialOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {comercialOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              <Link href="/consultor" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Tag size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Consultor Precio</span>
              </Link>
            </div>
          )}
        </div>

        {/* Menu Gestion Comercial */}
        <div>
          <button 
            onClick={() => setGestionComercialOpen(!gestionComercialOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="group-hover:text-white transition-colors text-slate-300" />
              <span className="font-medium group-hover:text-white transition-colors text-slate-300">Gestión Comercial</span>
            </div>
            {gestionComercialOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {gestionComercialOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              <Link href="/margenes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <TrendingUp size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Análisis de Margen</span>
              </Link>
            </div>
          )}
        </div>

        {/* Menu Administracion */}
        {user?.rol === 'admin' && (
          <div>
            <button 
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={20} className="group-hover:text-amber-400 transition-colors text-amber-500" />
                <span className="font-medium group-hover:text-amber-400 transition-colors text-amber-500">Administración</span>
              </div>
              {adminOpen ? <ChevronDown size={16} className="text-amber-500/50" /> : <ChevronRight size={16} className="text-amber-500/50" />}
            </button>
            {adminOpen && (
              <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
                <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                  <Users size={18} className="text-slate-400 group-hover:text-white" />
                  <span className="font-medium text-slate-400 group-hover:text-white">Gestión Usuarios</span>
                </Link>
              </div>
            )}
          </div>
        )}

      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900 z-50">
        {user && (
          <div className="px-3 mb-3 text-xs font-medium text-slate-500">
            {user.rol === 'admin' ? 'Admin: ' : 'Usuario: '} <span className="text-slate-300">{user.nombre}</span>
          </div>
        )}
        <button onClick={() => logout()} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
`;
fs.writeFileSync(sidebarPath, sidebarCode);


// --- 2. Modify Consultor Page ---
const consultorPath = 'src/app/consultor/page.tsx';
let consultorCode = fs.readFileSync(consultorPath, 'utf8');

consultorCode = `
'use client'

import React, { useState, useEffect } from 'react';
import { getConsultorProductos } from '@/app/actions';
import { Search, Loader2, Tag, Box, ArrowRight, X, Info } from 'lucide-react';

export default function ConsultorPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const limit = 50;
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Initial load
  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = async (currentPage = 1) => {
    setLoading(true);
    
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
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-xl text-white shadow-lg shadow-emerald-500/30">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Máx.</label>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="99999"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ordenar por</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="default">Relevancia / Nombre</option>
              <option value="price_asc">Menor Precio</option>
              <option value="price_desc">Mayor Precio</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Consultar'}
          </button>
        </form>
      </div>

      {/* Resultados: Grilla de Tarjetas */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-slate-700 text-lg">Catálogo de Productos</h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            {totalItems} productos
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
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
                className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col h-full relative group"
              >
                <div className="absolute top-4 right-4 text-emerald-200 group-hover:text-emerald-400 transition-colors">
                  <Info size={20} />
                </div>
                
                <div className="mb-auto pr-8">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-3 group-hover:text-emerald-700 transition-colors">
                    {p.descripcion}
                  </h3>
                  
                  <div className="text-sm text-slate-600 mb-4 space-y-1">
                    <p><span className="font-semibold text-slate-400">COD:</span> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{p.cod_art}</span></p>
                    <p><span className="font-semibold text-slate-400">Laboratorio:</span> {p.Marca || 'Sin marca'}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Unidades x Caja:</span>
                    <span className="text-sm font-bold text-slate-700">{p.UnidadesCaja}</span>
                  </div>
                  
                  {p.UnidadesCaja > 1 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-emerald-600 uppercase">Precio Frac.:</span>
                      <span className="text-sm font-black text-emerald-600">{formatoMoneda(p.PrecioFrac)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-200 border-dashed">
                    <span className="text-sm font-bold text-slate-600">Precio Total:</span>
                    <span className="text-xl font-black text-slate-800">{formatoMoneda(p.Precio)}</span>
                  </div>
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
              className="px-6 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
              {page} / {Math.ceil(totalItems / limit)}
            </span>
            <button 
              disabled={page >= Math.ceil(totalItems / limit)}
              onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); fetchProducts(page + 1); }}
              className="px-6 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-emerald-700 p-6 flex flex-col justify-end">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              <span className="bg-white/20 text-white backdrop-blur-md w-fit px-3 py-1 rounded-lg text-sm font-mono font-bold mb-2">
                COD: {selectedProduct.cod_art}
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

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-emerald-800 font-bold">Precio Total</span>
                  <span className="text-2xl font-black text-emerald-700">{formatoMoneda(selectedProduct.Precio)}</span>
                </div>
                {selectedProduct.UnidadesCaja > 1 && (
                  <div className="flex justify-between items-center pt-3 border-t border-emerald-200/50">
                    <span className="text-emerald-600 font-medium flex items-center gap-2">
                      <ArrowRight size={16} /> Precio Fraccionado
                    </span>
                    <span className="text-xl font-black text-emerald-600">{formatoMoneda(selectedProduct.PrecioFrac)}</span>
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
}
`;
fs.writeFileSync(consultorPath, consultorCode);

console.log("Modificaciones completadas");
