const fs = require('fs');

const actionsPath = 'src/app/actions.ts';
let actionsCode = fs.readFileSync(actionsPath, 'utf8');

if (!actionsCode.includes('export async function getProductoParaSugerencia')) {
  actionsCode += `
export async function getProductoParaSugerencia(query: string) {
  if (!query) return { success: false, error: 'Término de búsqueda vacío' };
  
  const connection = await pool.getConnection();
  try {
    const isNumber = !isNaN(Number(query));
    let finalQuery = query;
    
    if (isNumber) {
       const [barras] = await connection.query('SELECT cod_art FROM codigosdebarra WHERE cod_barra = ? LIMIT 1', [query]);
       if ((barras as any[]).length > 0) {
          finalQuery = (barras as any[])[0].cod_art.toString();
       }
    }

    let sql = \`
      SELECT 
        p.cod_art, 
        (SELECT cod_barra FROM codigosdebarra WHERE cod_art = p.cod_art LIMIT 1) as cod_barra, 
        p.descripcion, 
        p.Marca, 
        p.Origen, 
        p.UnidadesCaja, 
        pr.precio_final1, 
        pr.costo_neto1
      FROM productos p
      LEFT JOIN precios pr ON p.cod_art = pr.cod_art
    \`;

    let params = [];
    if (!isNaN(Number(finalQuery))) {
      sql += \` WHERE p.cod_art = ? \`;
      params.push(Number(finalQuery));
    } else {
      sql += \` WHERE p.descripcion LIKE ? LIMIT 50\`;
      params.push(\`%\${query}%\`);
    }

    const [rows] = await connection.query(sql, params);

    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;
  fs.writeFileSync(actionsPath, actionsCode);
}
console.log("Action added");
