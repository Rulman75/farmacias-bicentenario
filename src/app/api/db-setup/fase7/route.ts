import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    // Modify rrhh_trabajadores table
    await connection.query(`
      ALTER TABLE rrhh_trabajadores
      CHANGE apellidos apellido_paterno VARCHAR(100) NOT NULL,
      ADD COLUMN apellido_materno VARCHAR(100) AFTER apellido_paterno,
      ADD COLUMN nacionalidad VARCHAR(50) AFTER rut,
      ADD COLUMN nivel_educacional VARCHAR(100) AFTER email,
      ADD COLUMN banco VARCHAR(100),
      ADD COLUMN tipo_cuenta VARCHAR(50),
      ADD COLUMN numero_cuenta VARCHAR(100),
      ADD COLUMN entrega_riohs BOOLEAN DEFAULT false,
      ADD COLUMN es_representante_legal BOOLEAN DEFAULT false
    `);

    // We also need to update the queries in other places that used 'apellidos'.
    // But for now, just the schema update.

    return NextResponse.json({ success: true, message: 'Tabla rrhh_trabajadores actualizada con éxito (Fase 7)' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
