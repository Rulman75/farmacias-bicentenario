const fs = require('fs');
const path = require('path');

// 1. Añadir Server Action para Consultor
let actionsCode = fs.readFileSync('src/app/actions.ts', 'utf8');

actionsCode += `
// CONSULTOR DE PRECIOS
export async function getConsultorProductos(params: { q?: string, minPrice?: number, maxPrice?: number, sort?: string, page?: number, limit?: number }) {
  const { q, minPrice, maxPrice, sort = 'default', page = 1, limit = 100 } = params;
  
  const offset = (page - 1) * limit;
  const connection = await pool.getConnection();

  try {
    let baseConditions = \`
      FROM productos
      INNER JOIN precios ON productos.cod_art = precios.cod_art
      LEFT JOIN marcas ON productos.cod_marca = marcas.cod_marca
      WHERE productos.cod_empresa = 1
      AND productos.estado <> 4
      AND productos.cod_art <> 1
    \`;
    
    let conditions = '';
    const queryParams: any[] = [];

    if (q) {
      conditions += ' AND productos.descripcion LIKE ?';
      queryParams.push(\`%\${q}%\`);
    }

    if (minPrice !== undefined) {
      conditions += ' AND precios.precio_final1 >= ?';
      queryParams.push(minPrice);
    }

    if (maxPrice !== undefined) {
      conditions += ' AND precios.precio_final1 <= ?';
      queryParams.push(maxPrice);
    }

    // Total Count
    const countQuery = \`SELECT COUNT(*) as total \${baseConditions} \${conditions}\`;
    const [countResult] = await connection.query(countQuery, queryParams);
    const totalItems = (countResult as any[])[0].total;

    // Fetch Products
    let query = \`
      SELECT 
        productos.cod_art, 
        productos.descripcion, 
        productos.piezas_caja as UnidadesCaja, 
        precios.precio_final1 as Precio, 
        ROUND(precios.precio_final1 / IF(productos.piezas_caja = 0, 1, productos.piezas_caja)) as PrecioFrac, 
        marcas.nombre as Marca, 
        productos.origen as Origen
      \${baseConditions} \${conditions}
    \`;

    if (sort === 'price_asc') {
      query += ' ORDER BY precios.precio_final1 ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY precios.precio_final1 DESC';
    } else {
      query += ' ORDER BY productos.descripcion ASC';
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await connection.query(query, queryParams);

    return {
      success: true,
      data: {
        products: rows as any[],
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      }
    };
  } catch (error: any) {
    console.error('Error fetching consultor products:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;
fs.writeFileSync('src/app/actions.ts', actionsCode);

// 2. Crear Consultor UI
const dir = 'src/app/consultor';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const pageCode = `'use client'

import React, { useState, useEffect } from 'react';
import { getConsultorProductos } from '@/app/actions';
import { Search, SlidersHorizontal, Loader2, Tag, Box, ArrowRight } from 'lucide-react';

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
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto || 0);
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

      {/* Panel de Filtros */}
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

      {/* Resultados */}
      {hasSearched && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Resultados de Búsqueda</h3>
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {totalItems} productos encontrados
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Descripción</th>
                  <th className="px-6 py-4 font-semibold">Marca / Origen</th>
                  <th className="px-6 py-4 font-semibold text-center">Formato</th>
                  <th className="px-6 py-4 font-semibold text-right">Precio Caja</th>
                  <th className="px-6 py-4 font-semibold text-right text-indigo-600">Precio Fracc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 size={32} className="animate-spin mx-auto mb-2 text-indigo-500" />
                      Buscando en la base de datos...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.cod_art} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">{p.cod_art}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.descripcion}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-600">{p.Marca || '-'}</div>
                        <div className="text-xs text-slate-400">{p.Origen || 'Sin origen'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1">
                          <Box size={14} /> {p.UnidadesCaja} un.
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700 text-lg">
                        {formatoMoneda(p.Precio)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-indigo-600 text-lg">
                        {formatoMoneda(p.PrecioFrac)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > limit && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <button 
                disabled={page === 1}
                onClick={() => fetchProducts(page - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm font-medium text-slate-500">
                Página {page} de {Math.ceil(totalItems / limit)}
              </span>
              <button 
                disabled={page >= Math.ceil(totalItems / limit)}
                onClick={() => fetchProducts(page + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}`;
fs.writeFileSync(path.join(dir, 'page.tsx'), pageCode);

// 3. Add to Sidebar (Comercial Menu)
let sidebarCode = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
if (!sidebarCode.includes('Consultor de Precios')) {
  sidebarCode = sidebarCode.replace(
    /<\/div>\s*<\/nav>/,
    `</div>
        
        <div>
          <div className="px-3 py-2 mt-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Comercial
          </div>
          <div className="space-y-1">
            <Link href="/consultor" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
              <Tag size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="font-medium text-slate-400 group-hover:text-white transition-colors">Consultor de Precios</span>
            </Link>
          </div>
        </div>
      </nav>`
  );
  
  sidebarCode = sidebarCode.replace(
    /import \{ LayoutDashboard.*?\} from 'lucide-react';/,
    `import { LayoutDashboard, Pill, LogOut, ChevronDown, ChevronRight, Clock, ArrowRightLeft, Tag, TrendingUp } from 'lucide-react';`
  );
  
  fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarCode);
}
