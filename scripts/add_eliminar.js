const fs = require('fs');

const code = `
export async function eliminarNominaMasiva(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query("DELETE FROM rrhh_liquidaciones WHERE periodo = ?", [periodo]);
    revalidatePath('/panel/rrhh/reportes/liquidaciones');
    return { success: true, eliminadas: (result as any).affectedRows };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
`;

fs.appendFileSync('src/app/rrhh_liquidaciones_actions.ts', code);
console.log('Eliminar added');
