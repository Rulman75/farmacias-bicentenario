import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    // 1. Audit table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
        cod_sucursal INT NOT NULL,
        cod_art INT NOT NULL,
        tipo_movimiento VARCHAR(50) NOT NULL,
        cantidad_anterior DECIMAL(10,2) NOT NULL,
        cantidad_nueva DECIMAL(10,2) NOT NULL,
        id_referencia VARCHAR(50),
        usuario VARCHAR(100),
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        observacion TEXT,
        INDEX (cod_sucursal, cod_art),
        INDEX (fecha)
      )
    `);

    // 2. Zero table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ingreso_vencimiento_final LIKE ingreso_vencimientos
    `);

    // Add motivo_cierre if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE ingreso_vencimiento_final ADD COLUMN motivo_cierre VARCHAR(50) DEFAULT 'HISTORICO'
      `);
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    
    // Add fecha_cierre if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE ingreso_vencimiento_final ADD COLUMN fecha_cierre DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    // 3. Move existing zeros
    const [result] = await connection.execute(`
      INSERT INTO ingreso_vencimiento_final 
      (id, cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro)
      SELECT id, cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro 
      FROM ingreso_vencimientos 
      WHERE cantidad <= 0
    `);

    const [delResult] = await connection.execute(`
      DELETE FROM ingreso_vencimientos WHERE cantidad <= 0
    `);

    return NextResponse.json({ success: true, moved: (result as any).affectedRows, deleted: (delResult as any).affectedRows });
  } catch(e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
