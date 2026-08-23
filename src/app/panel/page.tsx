import Link from 'next/link';
import pool from '@/lib/db';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Layers, FileText, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import SucursalFilter from '@/components/dashboard/SucursalFilter';
import LotesTableClient from '@/components/dashboard/LotesTableClient';
import FilterLink from '@/components/dashboard/FilterLink';

async function getLotes(sucursalId: number, estado: string, page: number) {
  const connection = await pool.getConnection();
  try {
    const limit = 50;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM ingreso_vencimientos iv
      JOIN productos p ON iv.cod_art = p.cod_art
      JOIN sucursales s ON iv.cod_sucursal = s.cod_sucursal
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
    `;
    const params = [];
    
    if (sucursalId > 0) {
      baseQuery += ` AND iv.cod_sucursal = ? `;
      params.push(sucursalId);
    }

    if (estado === 'vencido') {
      baseQuery += ` AND DATEDIFF(iv.fecha_vencimiento, NOW()) < 0 `;
    } else if (estado === 'liquidar') {
      baseQuery += ` AND DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 0 AND 60 `;
    } else if (estado === 'proximo') {
      baseQuery += ` AND DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 61 AND 180 `;
    } else if (estado === 'precaucion') {
      baseQuery += ` AND DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 181 AND 270 `;
    } else if (estado === 'atencion') {
      baseQuery += ` AND DATEDIFF(iv.fecha_vencimiento, NOW()) > 270 `;
    }

    const [countResult] = await connection.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = (countResult as any[])[0].total;

    const dataQuery = `
      SELECT 
        iv.id,
        iv.cod_art,
        (SELECT cod_barra FROM codigosdebarra WHERE cod_art = iv.cod_art LIMIT 1) as cod_barra,
        iv.fecha_vencimiento, 
        iv.cantidad, 
        p.descripcion,
        s.nombre as sucursal_nombre,
        DATEDIFF(iv.fecha_vencimiento, NOW()) as dias_restantes
      ${baseQuery}
      ORDER BY iv.fecha_vencimiento ASC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await connection.query(dataQuery, [...params, limit, offset]);
    
    return { data: rows as any[], total, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Error consultando base de datos:', error);
    return { data: [], total: 0, totalPages: 0 };
  } finally {
    connection.release();
  }
}

async function getSucursales() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT cod_sucursal, MAX(nombre) as nombre 
      FROM sucursales 
      WHERE cod_empresa = 1 AND cod_sucursal NOT IN (1, 5)
      GROUP BY cod_sucursal 
      ORDER BY nombre ASC
    `);
    return rows as any[];
  } catch (error) {
    return [];
  } finally {
    connection.release();
  }
}

async function getKpis(sucursalId: number) {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT 
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) < 0 THEN 1 ELSE 0 END) as vencido,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 0 AND 60 THEN 1 ELSE 0 END) as liquidar,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 61 AND 180 THEN 1 ELSE 0 END) as proximo,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 181 AND 270 THEN 1 ELSE 0 END) as precaucion,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) > 270 THEN 1 ELSE 0 END) as atencion
      FROM ingreso_vencimientos iv
      JOIN sucursales s ON iv.cod_sucursal = s.cod_sucursal
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
    `;
    const params: any[] = [];
    if (sucursalId > 0) {
      query += ` AND iv.cod_sucursal = ? `;
      params.push(sucursalId);
    }
    
    const [rows] = await connection.query(query, params);
    if ((rows as any[]).length > 0) {
      const row = (rows as any[])[0];
      return {
        vencido: Number(row.vencido) || 0,
        liquidar: Number(row.liquidar) || 0,
        proximo: Number(row.proximo) || 0,
        precaucion: Number(row.precaucion) || 0,
        atencion: Number(row.atencion) || 0,
      };
    }
    return { vencido: 0, liquidar: 0, proximo: 0, precaucion: 0, atencion: 0 };
  } catch (error) {
    return { vencido: 0, liquidar: 0, proximo: 0, precaucion: 0, atencion: 0 };
  } finally {
    connection.release();
  }
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ sucursal?: string, estado?: string, page?: string }> }) {
  const sp = await searchParams;
  const sucursalId = sp.sucursal ? parseInt(sp.sucursal) : 0;
  const estado = sp.estado || 'todos';
  const page = sp.page ? parseInt(sp.page) : 1;

  const [{ data: lotes, total, totalPages }, sucursales, kpis] = await Promise.all([
    getLotes(sucursalId, estado, page),
    getSucursales(),
    getKpis(sucursalId)
  ]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Tarjeta Vencido */}
        <FilterLink href={`/panel?sucursal=${sucursalId}&estado=vencido`} active={estado === 'vencido'} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${estado === 'vencido' ? 'border-[#D9D9D9] ring-2 ring-[#D9D9D9]/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#D9D9D9] p-3 rounded-xl text-slate-700">
              <XCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Vencido</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.vencido}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">&lt; 0 días</p>
        </FilterLink>

        {/* Tarjeta Liquidar */}
        <FilterLink href={`/panel?sucursal=${sucursalId}&estado=liquidar`} active={estado === 'liquidar'} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${estado === 'liquidar' ? 'border-[#FF0000] ring-2 ring-[#FF0000]/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#FF0000]/20 p-3 rounded-xl text-[#FF0000]">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Liquidar</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.liquidar}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">0 a 60 días</p>
        </FilterLink>

        {/* Tarjeta Próximo */}
        <FilterLink href={`/panel?sucursal=${sucursalId}&estado=proximo`} active={estado === 'proximo'} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${estado === 'proximo' ? 'border-[#E97132] ring-2 ring-[#E97132]/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#E97132]/20 p-3 rounded-xl text-[#E97132]">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Próximo</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.proximo}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">61 a 180 días</p>
        </FilterLink>

        {/* Tarjeta Precaucion */}
        <FilterLink href={`/panel?sucursal=${sucursalId}&estado=precaucion`} active={estado === 'precaucion'} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${estado === 'precaucion' ? 'border-[#FFC000] ring-2 ring-[#FFC000]/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#FFC000]/20 p-3 rounded-xl text-[#FFC000]">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Precaución</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.precaucion}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">181 a 270 días</p>
        </FilterLink>

        {/* Tarjeta Atencion */}
        <FilterLink href={`/panel?sucursal=${sucursalId}&estado=atencion`} active={estado === 'atencion'} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${estado === 'atencion' ? 'border-[#00B050] ring-2 ring-[#00B050]/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#00B050]/20 p-3 rounded-xl text-[#00B050]">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Atención</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.atencion}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">&gt; 270 días</p>
        </FilterLink>

      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-800">Productos Próximos a Vencer</h3>
            {estado !== 'todos' && (
              <Link href={`/panel?sucursal=${sucursalId}`} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
                Quitar filtro ({estado})
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <SucursalFilter sucursales={sucursales} />
            
            <Link href="/panel/agrupado" className="text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm border border-fuchsia-100">
              <Layers size={18} /> Agrupar
            </Link>
            
            <Link href="/panel/vencidos" className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm border border-red-100">
              <AlertCircle size={18} /> Vencidos
            </Link>
            
            <Link href="/panel/reportes" className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm border border-blue-100">
              <FileText size={18} /> Reportes
            </Link>
            
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm border border-emerald-100">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>
        
        <LotesTableClient initialLotes={lotes} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Mostrando página <span className="font-medium text-slate-900">{page}</span> de <span className="font-medium text-slate-900">{totalPages}</span> ({total} registros)
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/panel?sucursal=${sucursalId}&estado=${estado}&page=${page - 1}`} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <ChevronLeft size={20} />
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/panel?sucursal=${sucursalId}&estado=${estado}&page=${page + 1}`} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <ChevronRight size={20} />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
