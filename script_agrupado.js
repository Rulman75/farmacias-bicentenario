const fs = require('fs');
let code = fs.readFileSync('src/app/agrupado/page.tsx', 'utf8');

// 1. Rewrite getTodosLosProductos
code = code.replace(
  /async function getTodosLosProductos\(\) \{[\s\S]*?finally \{\s*connection\.release\(\);\s*\}\s*\}/,
  `async function getTodosLosProductos(searchQuery: string, estado: string) {
  const connection = await pool.getConnection();
  try {
    let baseQuery = \`
      FROM ingreso_vencimientos iv
      JOIN productos p ON iv.cod_art = p.cod_art
      JOIN sucursales s ON s.cod_sucursal = iv.cod_sucursal
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
    \`;
    const params = [];

    if (searchQuery) {
      baseQuery += \` AND (p.descripcion LIKE ? OR iv.cod_art LIKE ?) \`;
      params.push(\`%\${searchQuery}%\`, \`%\${searchQuery}%\`);
    }

    if (estado && estado !== 'todos') {
      if (estado === 'vencido') {
        baseQuery += \` AND DATEDIFF(iv.fecha_vencimiento, NOW()) < 0 \`;
      } else if (estado === 'liquidar') {
        baseQuery += \` AND DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 0 AND 60 \`;
      } else if (estado === 'proximo') {
        baseQuery += \` AND DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 61 AND 180 \`;
      } else if (estado === 'precaucion') {
        baseQuery += \` AND DATEDIFF(iv.fecha_vencimiento, NOW()) BETWEEN 181 AND 270 \`;
      } else if (estado === 'atencion') {
        baseQuery += \` AND DATEDIFF(iv.fecha_vencimiento, NOW()) > 270 \`;
      }
    }

    const [rows] = await connection.query(\`
      SELECT 
        iv.cod_art,
        iv.fecha_vencimiento, 
        iv.cantidad, 
        iv.cod_sucursal,
        p.descripcion,
        DATEDIFF(iv.fecha_vencimiento, NOW()) as dias_restantes
      \${baseQuery}
      ORDER BY p.descripcion ASC
    \`, params);
    return rows as any[];
  } catch (error) {
    console.error("Error consultando base de datos:", error);
    return [];
  } finally {
    connection.release();
  }
}`
);

// 2. Rewrite AgrupadoPage signature and logic
code = code.replace(
  /export default async function AgrupadoPage\(\) \{[\s\S]*?const \[lotes, sucursalesRes\] = await Promise\.all\(\[\s*getTodosLosProductos\(\),\s*getSucursales\(\)\s*\]\);/,
  `export default async function AgrupadoPage({ searchParams }: { searchParams: Promise<{ query?: string, estado?: string }> }) {
  const sp = await searchParams;
  const searchQuery = sp.query || '';
  const estadoFilter = sp.estado || 'todos';

  const [lotes, sucursalesRes] = await Promise.all([
    getTodosLosProductos(searchQuery, estadoFilter),
    getSucursales()
  ]);`
);

// 3. Insert filter UI
code = code.replace(
  /<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">/,
  `{/* Filtros */}
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
            <Link href="/agrupado" className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">`
);

fs.writeFileSync('src/app/agrupado/page.tsx', code);
