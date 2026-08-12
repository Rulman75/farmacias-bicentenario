import pool from '@/lib/db';
import { FileBarChart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ChartWrapper from '@/components/reportes/ChartWrapper';
import SucursalFilter from '@/components/dashboard/SucursalFilter';

async function getReporteSucursales(sucursalId: number) {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT 
        s.nombre as sucursal,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) < 0 THEN 1 ELSE 0 END) as vencido,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 0 AND 60 THEN 1 ELSE 0 END) as liquidar,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 61 AND 180 THEN 1 ELSE 0 END) as proximo,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 181 AND 270 THEN 1 ELSE 0 END) as precaucion,
        SUM(CASE WHEN DATEDIFF(iv.fecha_vencimiento, NOW()) > 270 THEN 1 ELSE 0 END) as atencion
      FROM sucursales s
      LEFT JOIN ingreso_vencimientos iv ON s.cod_sucursal = iv.cod_sucursal
    `;
    
    const params: any[] = [];
    query += ` WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5) `;
    
    if (sucursalId > 0) {
      query += ` AND s.cod_sucursal = ? `;
      params.push(sucursalId);
    }
    
    query += `
      GROUP BY s.cod_sucursal, s.nombre
      HAVING (vencido + liquidar + proximo + precaucion + atencion) > 0
      ORDER BY s.nombre ASC
    `;
    
    const [rows] = await connection.query(query, params);
    
    return (rows as any[]).map(row => ({
      sucursal: row.sucursal,
      vencido: Number(row.vencido) || 0,
      liquidar: Number(row.liquidar) || 0,
      proximo: Number(row.proximo) || 0,
      precaucion: Number(row.precaucion) || 0,
      atencion: Number(row.atencion) || 0,
    }));
  } catch (error) {
    console.error("Error fetching report:", error);
    return [];
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

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ sucursal?: string }> }) {
  const sp = await searchParams;
  const sucursalId = sp.sucursal ? parseInt(sp.sucursal) : 0;

  const [data, sucursales] = await Promise.all([
    getReporteSucursales(sucursalId),
    getSucursales()
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/panel" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="bg-fuchsia-600 p-3 rounded-xl text-white shadow-lg shadow-fuchsia-600/20">
            <FileBarChart size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reportes de Vencimiento</h1>
            <p className="text-slate-500">Métricas globales y estado del inventario agrupado por sucursal</p>
          </div>
        </div>
        <div>
          <SucursalFilter sucursales={sucursales} />
        </div>
      </div>

      {data.length > 0 ? (
        <ChartWrapper data={data} />
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-lg">Aún no hay datos de ingresos registrados para generar gráficos en esta sucursal.</p>
        </div>
      )}
    </div>
  );
}
