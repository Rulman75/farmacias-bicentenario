const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Imports
code = code.replace(
  "import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Layers } from 'lucide-react';",
  "import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Layers, FileText, ChevronLeft, ChevronRight } from 'lucide-react';"
);

// 2. getLotes
code = code.replace(
  /async function getLotes\(sucursalId: number\) \{[\s\S]*?finally \{\s*connection\.release\(\);\s*\}\s*\}/,
  `async function getLotes(sucursalId: number, estado: string, page: number) {
  const connection = await pool.getConnection();
  try {
    const limit = 50;
    const offset = (page - 1) * limit;

    let baseQuery = \`
      FROM ingreso_vencimientos iv
      JOIN productos p ON iv.cod_art = p.cod_art
      JOIN sucursales s ON iv.cod_sucursal = s.cod_sucursal
      WHERE s.cod_empresa = 1 AND s.cod_sucursal NOT IN (1, 5)
    \`;
    const params = [];
    
    if (sucursalId > 0) {
      baseQuery += \` AND iv.cod_sucursal = ? \`;
      params.push(sucursalId);
    }

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

    const [countResult] = await connection.query(\`SELECT COUNT(*) as total \${baseQuery}\`, params);
    const total = countResult[0].total;

    const dataQuery = \`
      SELECT 
        iv.cod_art,
        (SELECT cod_barra FROM codigosdebarra WHERE cod_art = iv.cod_art LIMIT 1) as cod_barra,
        iv.fecha_vencimiento, 
        iv.cantidad, 
        p.descripcion,
        s.nombre as sucursal_nombre,
        DATEDIFF(iv.fecha_vencimiento, NOW()) as dias_restantes
      \${baseQuery}
      ORDER BY iv.fecha_vencimiento ASC
      LIMIT ? OFFSET ?
    \`;
    
    const [rows] = await connection.query(dataQuery, [...params, limit, offset]);
    
    return { data: rows, total, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Error consultando base de datos:', error);
    return { data: [], total: 0, totalPages: 0 };
  } finally {
    connection.release();
  }
}`
);

// 3. Dashboard signature
code = code.replace(
  /export default async function Dashboard[^\{]+\{[^\}]+sp = await searchParams;[^}]+sucursalId = [^;]+;/g,
  `export default async function Dashboard({ searchParams }: { searchParams: Promise<{ sucursal?: string, estado?: string, page?: string }> }) {
  const sp = await searchParams;
  const sucursalId = sp.sucursal ? parseInt(sp.sucursal) : 0;
  const estado = sp.estado || 'todos';
  const page = sp.page ? parseInt(sp.page) : 1;`
);

code = code.replace(
  /const \[lotes, sucursales, kpis\] = await Promise\.all\(\[\s*getLotes\(sucursalId\),\s*getSucursales\(\),\s*getKpis\(sucursalId\)\s*\]\);/g,
  `const [{ data: lotes, total, totalPages }, sucursales, kpis] = await Promise.all([
    getLotes(sucursalId, estado, page),
    getSucursales(),
    getKpis(sucursalId)
  ]);`
);

// 4. Cards wrapper
code = code.replace(
  /<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">\s*<div className="flex items-center gap-4 mb-4">\s*<div className="bg-\[#D9D9D9\] p-3 rounded-xl text-slate-700">\s*<XCircle size=\{24\} \/>\s*<\/div>\s*<h3 className="font-bold text-slate-700">Vencido<\/h3>\s*<\/div>\s*<p className="text-3xl font-black text-slate-800">\{kpis\.vencido\}<\/p>\s*<p className="text-sm text-slate-500 font-medium mt-1">&lt; 0 días<\/p>\s*<\/div>/g,
  `<Link href={\`/?sucursal=\${sucursalId}&estado=vencido\`} className={\`block bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md \${estado === 'vencido' ? 'border-[#D9D9D9] ring-2 ring-[#D9D9D9]/50' : 'border-slate-200'}\`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#D9D9D9] p-3 rounded-xl text-slate-700">
              <XCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Vencido</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.vencido}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">&lt; 0 días</p>
        </Link>`
);

code = code.replace(
  /<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">\s*<div className="flex items-center gap-4 mb-4">\s*<div className="bg-\[#FF0000\]\/20 p-3 rounded-xl text-\[#FF0000\]">\s*<AlertCircle size=\{24\} \/>\s*<\/div>\s*<h3 className="font-bold text-slate-700">Liquidar<\/h3>\s*<\/div>\s*<p className="text-3xl font-black text-slate-800">\{kpis\.liquidar\}<\/p>\s*<p className="text-sm text-slate-500 font-medium mt-1">0 a 60 días<\/p>\s*<\/div>/g,
  `<Link href={\`/?sucursal=\${sucursalId}&estado=liquidar\`} className={\`block bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md \${estado === 'liquidar' ? 'border-[#FF0000] ring-2 ring-[#FF0000]/50' : 'border-slate-200'}\`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#FF0000]/20 p-3 rounded-xl text-[#FF0000]">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Liquidar</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.liquidar}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">0 a 60 días</p>
        </Link>`
);

code = code.replace(
  /<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">\s*<div className="flex items-center gap-4 mb-4">\s*<div className="bg-\[#E97132\]\/20 p-3 rounded-xl text-\[#E97132\]">\s*<AlertCircle size=\{24\} \/>\s*<\/div>\s*<h3 className="font-bold text-slate-700">Próximo<\/h3>\s*<\/div>\s*<p className="text-3xl font-black text-slate-800">\{kpis\.proximo\}<\/p>\s*<p className="text-sm text-slate-500 font-medium mt-1">61 a 180 días<\/p>\s*<\/div>/g,
  `<Link href={\`/?sucursal=\${sucursalId}&estado=proximo\`} className={\`block bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md \${estado === 'proximo' ? 'border-[#E97132] ring-2 ring-[#E97132]/50' : 'border-slate-200'}\`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#E97132]/20 p-3 rounded-xl text-[#E97132]">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Próximo</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.proximo}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">61 a 180 días</p>
        </Link>`
);

code = code.replace(
  /<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">\s*<div className="flex items-center gap-4 mb-4">\s*<div className="bg-\[#FFC000\]\/20 p-3 rounded-xl text-\[#FFC000\]">\s*<AlertTriangle size=\{24\} \/>\s*<\/div>\s*<h3 className="font-bold text-slate-700">Precaución<\/h3>\s*<\/div>\s*<p className="text-3xl font-black text-slate-800">\{kpis\.precaucion\}<\/p>\s*<p className="text-sm text-slate-500 font-medium mt-1">181 a 270 días<\/p>\s*<\/div>/g,
  `<Link href={\`/?sucursal=\${sucursalId}&estado=precaucion\`} className={\`block bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md \${estado === 'precaucion' ? 'border-[#FFC000] ring-2 ring-[#FFC000]/50' : 'border-slate-200'}\`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#FFC000]/20 p-3 rounded-xl text-[#FFC000]">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Precaución</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.precaucion}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">181 a 270 días</p>
        </Link>`
);

code = code.replace(
  /<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">\s*<div className="flex items-center gap-4 mb-4">\s*<div className="bg-\[#00B050\]\/20 p-3 rounded-xl text-\[#00B050\]">\s*<CheckCircle size=\{24\} \/>\s*<\/div>\s*<h3 className="font-bold text-slate-700">Atención<\/h3>\s*<\/div>\s*<p className="text-3xl font-black text-slate-800">\{kpis\.atencion\}<\/p>\s*<p className="text-sm text-slate-500 font-medium mt-1\">&gt; 270 días<\/p>\s*<\/div>/g,
  `<Link href={\`/?sucursal=\${sucursalId}&estado=atencion\`} className={\`block bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md \${estado === 'atencion' ? 'border-[#00B050] ring-2 ring-[#00B050]/50' : 'border-slate-200'}\`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#00B050]/20 p-3 rounded-xl text-[#00B050]">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-700">Atención</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{kpis.atencion}</p>
          <p className="text-sm text-slate-500 font-medium mt-1\">&gt; 270 días</p>
        </Link>`
);

// 5. Header Reportes button
code = code.replace(
  /<Link href="\/vencidos" className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">/g,
  `<Link href="/reportes" className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <FileText size={16} /> Reportes
            </Link>
            <Link href="/vencidos" className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">`
);

// 6. Pagination
code = code.replace(
  /(\s*)\)\}\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/,
  `$1)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Mostrando página <span className="font-medium text-slate-900">{page}</span> de <span className="font-medium text-slate-900">{totalPages}</span> ({total} registros)
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={\`/?sucursal=\${sucursalId}&estado=\${estado}&page=\${page - 1}\`} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <ChevronLeft size={20} />
                </Link>
              )}
              {page < totalPages && (
                <Link href={\`/?sucursal=\${sucursalId}&estado=\${estado}&page=\${page + 1}\`} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <ChevronRight size={20} />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}`
);

fs.writeFileSync('src/app/page.tsx', code);
