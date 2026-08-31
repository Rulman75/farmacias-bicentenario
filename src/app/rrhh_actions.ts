'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// -- CATALOGOS --

export async function getAfps() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM rrhh_afp WHERE estado = "ACTIVO" ORDER BY nombre ASC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getSalud() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM rrhh_salud WHERE estado = "ACTIVO" ORDER BY tipo DESC, nombre ASC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getCargos() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM rrhh_cargos WHERE estado = "ACTIVO" ORDER BY nombre ASC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- TRABAJADORES --

export async function getTrabajadores(search?: string, estado = 'ACTIVO') {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT t.*, a.nombre as afp_nombre, s.nombre as salud_nombre, s.tipo as salud_tipo 
      FROM rrhh_trabajadores t
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      WHERE t.estado = ?
    `;
    const params: any[] = [estado];

    if (search) {
      query += ` AND (t.rut LIKE ? OR t.nombres LIKE ? OR t.apellidos LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.apellidos ASC, t.nombres ASC`;

    const [rows] = await connection.query(query, params);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getTrabajadorById(id: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT t.*, a.nombre as afp_nombre, s.nombre as salud_nombre 
      FROM rrhh_trabajadores t
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      WHERE t.id = ?
    `, [id]);
    
    if ((rows as any[]).length === 0) return { success: false, error: 'Trabajador no encontrado' };

    // Get contratos
    const [contratos] = await connection.query(`
      SELECT c.*, ca.nombre as cargo_nombre, suc.nombre as sucursal_nombre
      FROM rrhh_contratos c
      JOIN rrhh_cargos ca ON c.cargo_id = ca.id
      LEFT JOIN sucursales suc ON c.cod_sucursal = suc.cod_sucursal
      WHERE c.trabajador_id = ?
      ORDER BY c.fecha_inicio DESC
    `, [id]);

    const data = {
      ...((rows as any[])[0]),
      contratos: contratos as any[]
    };

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function createTrabajador(data: any) {
  const connection = await pool.getConnection();
  try {
    const { rut, nombres, apellidos, fecha_nacimiento, direccion, telefono, email, estado_civil, afp_id, salud_id, cargas_familiares } = data;
    
    // Check si rut existe
    const [exist] = await connection.query('SELECT id FROM rrhh_trabajadores WHERE rut = ?', [rut]);
    if ((exist as any[]).length > 0) {
      throw new Error("El RUT ingresado ya está registrado.");
    }

    const [result] = await connection.query(`
      INSERT INTO rrhh_trabajadores (rut, nombres, apellidos, fecha_nacimiento, direccion, telefono, email, estado_civil, afp_id, salud_id, cargas_familiares)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [rut, nombres, apellidos, fecha_nacimiento || null, direccion, telefono, email, estado_civil, afp_id || null, salud_id || null, cargas_familiares || 0]);
    
    revalidatePath('/panel/rrhh');
    return { success: true, data: { id: (result as any).insertId } };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function updateTrabajador(id: number, data: any) {
  const connection = await pool.getConnection();
  try {
    const { rut, nombres, apellidos, fecha_nacimiento, direccion, telefono, email, estado_civil, afp_id, salud_id, cargas_familiares } = data;
    
    // Verificar RUT si cambió
    const [exist] = await connection.query('SELECT id FROM rrhh_trabajadores WHERE rut = ? AND id != ?', [rut, id]);
    if ((exist as any[]).length > 0) {
      throw new Error("El RUT ingresado ya está registrado en otro trabajador.");
    }

    await connection.query(`
      UPDATE rrhh_trabajadores 
      SET rut=?, nombres=?, apellidos=?, fecha_nacimiento=?, direccion=?, telefono=?, email=?, estado_civil=?, afp_id=?, salud_id=?, cargas_familiares=?
      WHERE id = ?
    `, [rut, nombres, apellidos, fecha_nacimiento || null, direccion, telefono, email, estado_civil, afp_id || null, salud_id || null, cargas_familiares || 0, id]);
    
    revalidatePath(`/panel/rrhh/${id}`);
    revalidatePath('/panel/rrhh');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- CONTRATOS --
export async function createContrato(data: any) {
  const connection = await pool.getConnection();
  try {
    const { trabajador_id, cargo_id, cod_sucursal, fecha_inicio, fecha_termino, tipo_contrato, sueldo_base } = data;
    
    // Podriamos desactivar los contratos anteriores para dejar solo uno activo
    await connection.query('UPDATE rrhh_contratos SET estado = "INACTIVO" WHERE trabajador_id = ?', [trabajador_id]);

    await connection.query(`
      INSERT INTO rrhh_contratos (trabajador_id, cargo_id, cod_sucursal, fecha_inicio, fecha_termino, tipo_contrato, sueldo_base)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [trabajador_id, cargo_id, cod_sucursal, fecha_inicio, fecha_termino || null, tipo_contrato, sueldo_base]);
    
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    revalidatePath('/panel/rrhh');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function updateContrato(id: number, data: any) {
  const connection = await pool.getConnection();
  try {
    const { cargo_id, cod_sucursal, fecha_inicio, fecha_termino, tipo_contrato, sueldo_base, trabajador_id } = data;

    await connection.query(`
      UPDATE rrhh_contratos 
      SET cargo_id=?, cod_sucursal=?, fecha_inicio=?, fecha_termino=?, tipo_contrato=?, sueldo_base=?
      WHERE id = ?
    `, [cargo_id, cod_sucursal || null, fecha_inicio, fecha_termino || null, tipo_contrato, sueldo_base, id]);
    
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    revalidatePath('/panel/rrhh');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- SUCURSALES (Helper para selectores) --
export async function getSucursalesRRHH() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT cod_sucursal, nombre FROM sucursales WHERE cod_empresa = 1 AND cod_sucursal NOT IN (1, 5) ORDER BY nombre ASC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- ALERTAS --
export async function getContratosPorVencer(dias: number = 30) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        c.id, c.fecha_termino, c.tipo_contrato,
        t.id as trabajador_id, t.rut, t.nombres, t.apellidos,
        ca.nombre as cargo,
        DATEDIFF(c.fecha_termino, NOW()) as dias_restantes
      FROM rrhh_contratos c
      JOIN rrhh_trabajadores t ON c.trabajador_id = t.id
      JOIN rrhh_cargos ca ON c.cargo_id = ca.id
      WHERE c.estado = 'ACTIVO' 
        AND c.tipo_contrato = 'Plazo Fijo'
        AND c.fecha_termino IS NOT NULL
        AND DATEDIFF(c.fecha_termino, NOW()) BETWEEN 0 AND ?
      ORDER BY dias_restantes ASC
    `, [dias]);
    
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
