import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    // Tabla Anticipos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rrhh_anticipos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        periodo VARCHAR(7) NOT NULL,
        fecha_emision DATE NOT NULL,
        monto INT NOT NULL,
        observacion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabla Finiquitos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rrhh_finiquitos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        fecha_emision DATE NOT NULL,
        fecha_termino DATE NOT NULL,
        causal_legal VARCHAR(150) NOT NULL,
        anos_servicio INT DEFAULT 0,
        vacaciones_pendientes_dias DECIMAL(5,2) DEFAULT 0,
        monto_indemnizacion_anos INT DEFAULT 0,
        monto_mes_aviso INT DEFAULT 0,
        monto_vacaciones INT DEFAULT 0,
        total_a_pagar INT DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'BORRADOR',
        observacion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES rrhh_trabajadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    return NextResponse.json({ success: true, message: 'Fase 6 tables created successfully using db.ts pool' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
