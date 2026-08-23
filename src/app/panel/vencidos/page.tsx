import pool from '@/lib/db';
import { AlertCircle, ArrowLeft, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import VencidosTable from '@/components/vencidos/VencidosTable';

async function getVencidosDetalle(mes?: string) {
  const connection = await pool.getConnection();
  try {
    let mesFilter = "";
    const params: any[] = [];
    if (mes) {
      mesFilter = "AND DATE_FORMAT(iv.fecha_vencimiento, '%m-%Y') = ?";
      params.push(mes);
    }

    const [rows] = await connection.query(`
      SELECT 
        s.cod_sucursal,
        s.nombre as sucursal,
        COUNT(DISTINCT iv.cod_art) as tipos_productos,
        SUM(iv.cantidad) as cantidad_vencida,
        SUM(iv.cantidad * COALESCE(pr.precio_final1, 0)) as perdida_total
      FROM ingreso_vencimientos iv
      JOIN sucursales s ON s.cod_sucursal = iv.cod_sucursal
      LEFT JOIN precios pr ON pr.cod_art = iv.cod_art AND pr.cod_empresa = 1
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
      AND DATEDIFF(iv.fecha_vencimiento, NOW()) < 0
      ${mesFilter}
      GROUP BY s.cod_sucursal, s.nombre
      ORDER BY perdida_total DESC
    `, params);
    return rows as any[];
  } catch (error) {
    console.error("Error fetching vencidos detalle:", error);
    return [];
  } finally {
    connection.release();
  }
}

async function getMesesPorSucursal(mes?: string) {
  const connection = await pool.getConnection();
  try {
    let mesFilter = "";
    const params: any[] = [];
    if (mes) {
      mesFilter = "AND DATE_FORMAT(iv.fecha_vencimiento, '%m-%Y') = ?";
      params.push(mes);
    }
    const [rows] = await connection.query(`
      SELECT 
        s.cod_sucursal,
        DATE_FORMAT(iv.fecha_vencimiento, '%m-%Y') as mes_vencimiento,
        SUM(iv.cantidad) as cantidad_vencida,
        SUM(iv.cantidad * COALESCE(pr.precio_final1, 0)) as perdida_total
      FROM ingreso_vencimientos iv
      JOIN sucursales s ON s.cod_sucursal = iv.cod_sucursal
      LEFT JOIN precios pr ON pr.cod_art = iv.cod_art AND pr.cod_empresa = 1
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
      AND DATEDIFF(iv.fecha_vencimiento, NOW()) < 0
      ${mesFilter}
      GROUP BY s.cod_sucursal, mes_vencimiento
      ORDER BY mes_vencimiento ASC
    `, params);
    return rows as any[];
  } catch (error) {
    console.error("Error fetching meses por sucursal:", error);
    return [];
  } finally {
    connection.release();
  }
}

async function getVencidosMensual() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        DATE_FORMAT(iv.fecha_vencimiento, '%m-%Y') as mes_vencimiento,
        SUM(iv.cantidad * COALESCE(pr.precio_final1, 0)) as perdida_mensual
      FROM ingreso_vencimientos iv
      JOIN sucursales s ON s.cod_sucursal = iv.cod_sucursal
      LEFT JOIN precios pr ON pr.cod_art = iv.cod_art AND pr.cod_empresa = 1
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
      AND DATEDIFF(iv.fecha_vencimiento, NOW()) < 0
      GROUP BY mes_vencimiento
      ORDER BY mes_vencimiento ASC
    `);
    return rows as any[];
  } catch (error) {
    console.error("Error fetching vencidos mensual:", error);
    return [];
  } finally {
    connection.release();
  }
}

export default async function VencidosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const mesSeleccionado = sp?.mes;
  const [detallesRaw, mensual, mesesPorSucursal] = await Promise.all([
    getVencidosDetalle(mesSeleccionado),
    getVencidosMensual(),
    getMesesPorSucursal(mesSeleccionado)
  ]);

  const detalles = detallesRaw.map(d => ({
    ...d,
    meses: mesesPorSucursal.filter(m => m.cod_sucursal === d.cod_sucursal)
  }));

  const formatoMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
  };

  const totalPerdidaGlobal = detalles.reduce((acc, curr) => acc + Number(curr.perdida_total), 0);

  return (
    <div className="max-w-[95%] mx-auto space-y-8 pb-10">
      
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <Link href="/panel" className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="bg-[#D9D9D9] p-3 rounded-xl text-slate-800 shadow-lg shadow-slate-200">
          <AlertCircle size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Impacto Financiero de Vencidos</h1>
          <p className="text-slate-500">Pérdidas calculadas en base a productos expirados y su precio final</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KPI Gran Total */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between h-40">
          <div className="flex items-center gap-3">
            <DollarSign className="opacity-80" size={24} />
            <h3 className="font-medium text-red-100 text-lg">Pérdida Global Total</h3>
          </div>
          <div>
            <div className="text-4xl font-black">{formatoMoneda(totalPerdidaGlobal)}</div>
            <div className="text-sm text-red-200 mt-1">Acumulado en todas las sucursales</div>
          </div>
        </div>

        {/* Resumen Mensual */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
            <Calendar className="text-slate-500" size={20} />
            <h3 className="font-bold text-slate-700">Resumen por Mes de Vencimiento</h3>
          </div>
          <div className="overflow-x-auto p-4 flex-1 flex items-center">
            {mensual.length === 0 ? (
              <p className="text-center w-full text-slate-400">No hay pérdidas registradas.</p>
            ) : (
              <div className="flex gap-4 w-full justify-around flex-wrap">
                {mensual.map(m => {
                  const isSelected = mesSeleccionado === m.mes_vencimiento;
                  return (
                    <Link href={isSelected ? "/vencidos" : `?mes=${m.mes_vencimiento}`} key={m.mes_vencimiento}>
                      <div className={`rounded-xl p-4 text-center min-w-[150px] transition-colors cursor-pointer border ${isSelected ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : 'bg-slate-50 border-slate-100 hover:border-red-300'}`}>
                        <div className="text-sm font-bold text-slate-500 mb-1 uppercase">{m.mes_vencimiento}</div>
                        <div className="text-xl font-bold text-red-600">{formatoMoneda(Number(m.perdida_mensual))}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grilla Detalle */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">
            Resumen Total por Sucursal {mesSeleccionado ? <span className="text-red-600 font-bold ml-2">(Filtrado por: {mesSeleccionado})</span> : ''}
          </h3>
          {mesSeleccionado && (
            <Link href="/panel/vencidos" className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
              Quitar filtro
            </Link>
          )}
        </div>
        <div className="overflow-auto max-h-[calc(100vh-250px)]">
          <VencidosTable detalles={detalles} totalPerdidaGlobal={totalPerdidaGlobal} />
        </div>
      </div>

    </div>
  );
}
