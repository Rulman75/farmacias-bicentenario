import pool from '@/lib/db';
import { getSucursales } from '@/app/actions';
import { Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AgrupadoTable from '@/components/agrupado/AgrupadoTable';

async function getTodosLosProductos(searchQuery: string, estado: string) {
  const connection = await pool.getConnection();
  try {
    let baseQuery = `
      FROM ingreso_vencimientos iv
      JOIN productos p ON iv.cod_art = p.cod_art
      JOIN sucursales s ON s.cod_sucursal = iv.cod_sucursal
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
    `;
    const params = [];

    if (searchQuery) {
      baseQuery += ` AND (p.descripcion LIKE ? OR iv.cod_art LIKE ?) `;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (estado && estado !== 'todos') {
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
    }

    const [rows] = await connection.query(`
      SELECT 
        iv.cod_art,
        iv.fecha_vencimiento,
        DATE_FORMAT(iv.fecha_vencimiento, '%Y-%m-%d') as fecha_ymd,
        iv.cantidad, 
        iv.cod_sucursal,
        p.descripcion,
        DATEDIFF(iv.fecha_vencimiento, NOW()) as dias_restantes
      ${baseQuery}
      ORDER BY p.descripcion ASC
    `, params);
    return rows as any[];
  } catch (error) {
    console.error("Error consultando base de datos:", error);
    return [];
  } finally {
    connection.release();
  }
}

async function getPropuestasVigentes() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        d.id_detalle,
        d.cod_art,
        d.cod_sucursal_origen,
        d.cod_sucursal_destino,
        (SELECT MAX(nombre) FROM sucursales WHERE cod_sucursal = d.cod_sucursal_destino AND cod_empresa = 1) as sucursal_destino,
        d.cantidad,
        COALESCE(d.cantidad_aceptada, d.cantidad) as cantidad_aceptada,
        DATE_FORMAT(d.fecha_vencimiento, '%Y-%m-%d') as fecha_ymd,
        c.correlativo,
        c.usuario_registro
      FROM traspasos_detalle d
      JOIN traspasos_cabecera c ON d.id_traspaso = c.id_traspaso
      WHERE COALESCE(d.estado_linea, 'PENDIENTE') = 'PENDIENTE'
        AND c.estado NOT IN ('ANULADO', 'NO_EJECUTADO')
    `);
    return rows as any[];
  } catch (error) {
    console.error("Error consultando propuestas vigentes:", error);
    return [];
  } finally {
    connection.release();
  }
}

export default async function AgrupadoPage({ searchParams }: { searchParams: Promise<{ query?: string, estado?: string }> }) {
  const sp = await searchParams;
  const searchQuery = sp.query || '';
  const estadoFilter = sp.estado || 'todos';

  const [lotes, sucursalesRes, propuestasVigentes] = await Promise.all([
    getTodosLosProductos(searchQuery, estadoFilter),
    getSucursales(),
    getPropuestasVigentes()
  ]);
  
  const sucursales = sucursalesRes.success ? (sucursalesRes.data || []) : [];

  // Transformar datos en tabla dinámica (Pivote)
  const productsMap = new Map();
  for (const lote of lotes) {
    if (!productsMap.has(lote.cod_art)) {
      productsMap.set(lote.cod_art, {
        cod_art: lote.cod_art,
        descripcion: lote.descripcion,
        sucursalData: {} // key = cod_sucursal
      });
    }
    
    // Formatear MM-YYYY
    const dt = new Date(lote.fecha_vencimiento);
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    const fechaStr = `${month}-${year}`;

    if (!productsMap.get(lote.cod_art).sucursalData[lote.cod_sucursal]) {
      productsMap.get(lote.cod_art).sucursalData[lote.cod_sucursal] = [];
    }

    // Buscar si este lote tiene propuestas de traspaso vigentes
    const propuestasLote = propuestasVigentes.filter(
      p => String(p.cod_art) === String(lote.cod_art) &&
           Number(p.cod_sucursal_origen) === Number(lote.cod_sucursal) &&
           p.fecha_ymd === lote.fecha_ymd
    );
    const cantidadPropuestaTotal = propuestasLote.reduce((sum, p) => sum + Number(p.cantidad || 0), 0);

    productsMap.get(lote.cod_art).sucursalData[lote.cod_sucursal].push({
      cantidad: lote.cantidad,
      fechaStr: fechaStr,
      fecha_completa: lote.fecha_vencimiento,
      fecha_ymd: lote.fecha_ymd,
      dias_restantes: lote.dias_restantes,
      propuestas: propuestasLote,
      cantidad_propuesta: cantidadPropuestaTotal
    });
  }

  const productsList = Array.from(productsMap.values()).sort((a, b) => a.descripcion.localeCompare(b.descripcion));

  return (
    <div className="max-w-[95%] mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/panel" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="bg-fuchsia-600 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-600/20">
          <Layers size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vista Agrupada</h1>
          <p className="text-slate-500">Distribución de productos y vencimientos por sucursal</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <form className="flex flex-col md:flex-row gap-4 items-center">
          <input 
            type="text" 
            name="query" 
            defaultValue={searchQuery} 
            placeholder="Buscar por código o descripción..." 
            className="border border-slate-200 rounded-lg px-4 py-2 w-full md:max-w-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500" 
          />
          <select 
            name="estado" 
            defaultValue={estadoFilter} 
            className="border border-slate-200 rounded-lg px-4 py-2 bg-white w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="vencido">Vencido</option>
            <option value="liquidar">Liquidar</option>
            <option value="proximo">Próximo</option>
            <option value="precaucion">Precaución</option>
            <option value="atencion">Atención</option>
          </select>
          <button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full md:w-auto">
            Filtrar
          </button>
          
          {(searchQuery || estadoFilter !== 'todos') && (
            <Link href="/panel/agrupado" className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <AgrupadoTable productsList={productsList} sucursales={sucursales} />
    </div>
  );
}
