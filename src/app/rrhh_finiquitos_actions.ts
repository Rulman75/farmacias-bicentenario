'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getFiniquitos() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT f.*, t.nombres, t.apellidos, t.rut 
      FROM rrhh_finiquitos f
      JOIN rrhh_trabajadores t ON f.trabajador_id = t.id
      ORDER BY f.fecha_emision DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function calcularSimulacionFiniquito(trabajador_id: number, fecha_termino: string, causal: string) {
  const connection = await pool.getConnection();
  try {
    const [tRows] = await connection.query(`
      SELECT t.*, c.sueldo_base, c.fecha_inicio
      FROM rrhh_trabajadores t
      JOIN rrhh_contratos c ON t.id = c.trabajador_id AND c.estado = 'ACTIVO'
      WHERE t.id = ?
    `, [trabajador_id]);
    
    const trabajador = (tRows as any[])[0];
    if (!trabajador) throw new Error('Trabajador no encontrado o sin contrato activo');

    const fInicio = new Date(trabajador.fecha_inicio);
    const fTermino = new Date(fecha_termino);
    
    const diffTime = Math.abs(fTermino.getTime() - fInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const anosCompletos = Math.floor(diffDays / 365);
    const mesesRestantes = Math.floor((diffDays % 365) / 30);
    
    // Regla: Fracción superior a 6 meses se considera un año (tope 11)
    let anosServicio = anosCompletos;
    if (mesesRestantes > 6) {
      anosServicio += 1;
    }
    if (anosServicio > 11) anosServicio = 11; // Tope legal

    const sueldoBase = parseFloat(trabajador.sueldo_base || '0');
    // Para simplificar, Base + Gratificacion (25%)
    const baseCalculo = Math.round(sueldoBase * 1.25); 

    let monto_indemnizacion_anos = 0;
    let monto_mes_aviso = 0;

    // Solo el Art 161 tiene indemnización por años y mes de aviso
    if (causal.includes('161')) {
      monto_indemnizacion_anos = baseCalculo * anosServicio;
      // Asumimos que no hubo 30 días de aviso previo para la simulación
      monto_mes_aviso = baseCalculo;
    }

    // Vacaciones: 1.25 días por mes trabajado. Simplificación: asume 0 tomadas
    const mesesTotales = (anosCompletos * 12) + mesesRestantes;
    const diasVacaciones = mesesTotales * 1.25; 
    const valorDia = Math.round(sueldoBase / 30);
    const monto_vacaciones = Math.round(diasVacaciones * valorDia);

    const total = monto_indemnizacion_anos + monto_mes_aviso + monto_vacaciones;

    return { 
      success: true, 
      data: {
        anos_servicio: anosServicio,
        vacaciones_pendientes_dias: diasVacaciones.toFixed(2),
        monto_indemnizacion_anos,
        monto_mes_aviso,
        monto_vacaciones,
        total_a_pagar: total
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function createFiniquito(data: {
  trabajador_id: number;
  fecha_termino: string;
  causal_legal: string;
  anos_servicio: number;
  vacaciones_pendientes_dias: number;
  monto_indemnizacion_anos: number;
  monto_mes_aviso: number;
  monto_vacaciones: number;
  total_a_pagar: number;
  observacion?: string;
  estado: string;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const d = new Date();
    const fechaEmision = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const [result] = await connection.query(`
      INSERT INTO rrhh_finiquitos 
      (trabajador_id, fecha_emision, fecha_termino, causal_legal, anos_servicio, vacaciones_pendientes_dias, 
       monto_indemnizacion_anos, monto_mes_aviso, monto_vacaciones, total_a_pagar, estado, observacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.trabajador_id, fechaEmision, data.fecha_termino, data.causal_legal, data.anos_servicio, 
      data.vacaciones_pendientes_dias, data.monto_indemnizacion_anos, data.monto_mes_aviso, 
      data.monto_vacaciones, data.total_a_pagar, data.estado, data.observacion || null
    ]);

    // Si está firmado, dar de baja al trabajador
    if (data.estado === 'FIRMADO') {
      await connection.query(`UPDATE rrhh_trabajadores SET estado = 'INACTIVO' WHERE id = ?`, [data.trabajador_id]);
      await connection.query(`UPDATE rrhh_contratos SET estado = 'INACTIVO' WHERE trabajador_id = ?`, [data.trabajador_id]);
    }

    await connection.commit();
    revalidatePath('/panel/rrhh/finiquito');
    revalidatePath('/panel/rrhh/personal');
    revalidatePath(`/panel/rrhh/${data.trabajador_id}`);
    
    return { success: true, data: result };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

