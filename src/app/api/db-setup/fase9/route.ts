import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    // Tabla de asistencia manual
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rrhh_asistencia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        fecha DATE NOT NULL,
        estado VARCHAR(5) NOT NULL,
        usuario_registro VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_asistencia (trabajador_id, fecha),
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      )
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Tabla rrhh_asistencia creada exitosamente (Fase 9).' 
    });
  } catch(e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
