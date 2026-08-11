const fs = require('fs');
const path = require('path');

// 1. Crear el componente cliente
const tableComponentDir = 'src/components/vencidos';
if (!fs.existsSync(tableComponentDir)) {
  fs.mkdirSync(tableComponentDir, { recursive: true });
}

const tableCode = `'use client'

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function VencidosTable({ detalles, totalPerdidaGlobal }: { detalles: any[], totalPerdidaGlobal: number }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
          <th className="px-6 py-4 font-semibold">Sucursal</th>
          <th className="px-6 py-4 font-semibold text-center">Variedad de Productos</th>
          <th className="px-6 py-4 font-semibold text-center">Total Unidades Vencidas</th>
          <th className="px-6 py-4 font-semibold text-right text-red-700">Pérdida Total</th>
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
          detalles.map((d, i) => (
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
}`;
fs.writeFileSync(path.join(tableComponentDir, 'VencidosTable.tsx'), tableCode);


// 2. Modificar vencidos/page.tsx
let pageCode = fs.readFileSync('src/app/vencidos/page.tsx', 'utf8');

// Agregar query getMesesPorSucursal
pageCode = pageCode.replace(
  /async function getVencidosMensual/,
  `async function getMesesPorSucursal(mes?: string) {
  const connection = await pool.getConnection();
  try {
    let mesFilter = "";
    const params: any[] = [];
    if (mes) {
      mesFilter = "AND DATE_FORMAT(iv.fecha_vencimiento, '%m-%Y') = ?";
      params.push(mes);
    }
    const [rows] = await connection.query(\`
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
      \${mesFilter}
      GROUP BY s.cod_sucursal, mes_vencimiento
      ORDER BY mes_vencimiento ASC
    \`, params);
    return rows as any[];
  } catch (error) {
    console.error("Error fetching meses por sucursal:", error);
    return [];
  } finally {
    connection.release();
  }
}

async function getVencidosMensual`
);

// Agregar s.cod_sucursal en getVencidosDetalle
pageCode = pageCode.replace(
  /s\.nombre as sucursal,/,
  `s.cod_sucursal,\n        s.nombre as sucursal,`
);

// Importar VencidosTable
pageCode = pageCode.replace(
  /import Link from 'next\/link';/,
  `import Link from 'next/link';\nimport VencidosTable from '@/components/vencidos/VencidosTable';`
);

// Modificar llamadas Promise.all
pageCode = pageCode.replace(
  /const \[detalles, mensual\] = await Promise\.all\(\[\s*getVencidosDetalle\(mesSeleccionado\),\s*getVencidosMensual\(\)\s*\]\);/,
  `const [detallesRaw, mensual, mesesPorSucursal] = await Promise.all([
    getVencidosDetalle(mesSeleccionado),
    getVencidosMensual(),
    getMesesPorSucursal(mesSeleccionado)
  ]);

  const detalles = detallesRaw.map(d => ({
    ...d,
    meses: mesesPorSucursal.filter(m => m.cod_sucursal === d.cod_sucursal)
  }));`
);

// Reemplazar la tabla estática por el componente VencidosTable
const tableRegex = /<table className="w-full text-left border-collapse">[\s\S]*?<\/table>/;
pageCode = pageCode.replace(tableRegex, `<VencidosTable detalles={detalles} totalPerdidaGlobal={totalPerdidaGlobal} />`);

fs.writeFileSync('src/app/vencidos/page.tsx', pageCode);
