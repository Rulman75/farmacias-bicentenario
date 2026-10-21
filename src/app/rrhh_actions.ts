'use server'

import pool from '@/lib/db';
import { validateRut } from '@/lib/utils';
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
    const [rows] = await connection.query(`
      SELECT MIN(id) as id, TRIM(nombre) as nombre, MAX(descripcion) as descripcion, 'ACTIVO' as estado
      FROM rrhh_cargos
      WHERE estado = 'ACTIVO' AND TRIM(nombre) <> '[NINGUNO]'
      GROUP BY TRIM(nombre)
      ORDER BY TRIM(nombre) ASC
    `);
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
      query += ` AND (t.rut LIKE ? OR t.nombres LIKE ? OR t.apellido_paterno LIKE ? OR t.apellido_materno LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.apellido_paterno ASC, t.nombres ASC`;

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
    const { 
      rut, nombres, apellido_paterno, apellido_materno, nacionalidad, fecha_nacimiento, 
      direccion, telefono, email, nivel_educacional, estado_civil, afp_id, salud_id, cargas_familiares,
      banco, tipo_cuenta, numero_cuenta, entrega_riohs, es_representante_legal
    } = data;
    
    if (rut && !validateRut(rut)) {
      return { success: false, error: 'El RUT ingresado no es válido (Módulo 11).' };
    }

    // Check si rut existe
    const [exist] = await connection.query('SELECT id FROM rrhh_trabajadores WHERE rut = ?', [rut]);
    if ((exist as any[]).length > 0) {
      return { success: false, error: 'El RUT ya está registrado.' };
    }

    const [result] = await connection.query(`
      INSERT INTO rrhh_trabajadores (
        rut, nombres, apellido_paterno, apellido_materno, nacionalidad, fecha_nacimiento, 
        direccion, telefono, email, nivel_educacional, estado_civil, afp_id, salud_id, cargas_familiares,
        banco, tipo_cuenta, numero_cuenta, entrega_riohs, es_representante_legal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      rut, nombres, apellido_paterno, apellido_materno || null, nacionalidad || null, fecha_nacimiento || null, 
      direccion, telefono, email, nivel_educacional || null, estado_civil, afp_id || null, salud_id || null, cargas_familiares || 0,
      banco || null, tipo_cuenta || null, numero_cuenta || null, entrega_riohs ? 1 : 0, es_representante_legal ? 1 : 0
    ]);
    
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
    const { 
      rut, nombres, apellido_paterno, apellido_materno, nacionalidad, fecha_nacimiento, 
      direccion, telefono, email, nivel_educacional, estado_civil, afp_id, salud_id, cargas_familiares,
      banco, tipo_cuenta, numero_cuenta, entrega_riohs, es_representante_legal
    } = data;
    
    if (rut && !validateRut(rut)) {
      return { success: false, error: 'El RUT ingresado no es válido (Módulo 11).' };
    }

    // Verificar RUT si cambió
    const [exist] = await connection.query('SELECT id FROM rrhh_trabajadores WHERE rut = ? AND id != ?', [rut, id]);
    if ((exist as any[]).length > 0) {
      return { success: false, error: 'El RUT ya está registrado por otro trabajador.' };
    }

    await connection.query(`
      UPDATE rrhh_trabajadores 
      SET rut=?, nombres=?, apellido_paterno=?, apellido_materno=?, nacionalidad=?, fecha_nacimiento=?, 
          direccion=?, telefono=?, email=?, nivel_educacional=?, estado_civil=?, afp_id=?, salud_id=?, cargas_familiares=?,
          banco=?, tipo_cuenta=?, numero_cuenta=?, entrega_riohs=?, es_representante_legal=?
      WHERE id = ?
    `, [
      rut, nombres, apellido_paterno, apellido_materno || null, nacionalidad || null, fecha_nacimiento || null, 
      direccion, telefono, email, nivel_educacional || null, estado_civil, afp_id || null, salud_id || null, cargas_familiares || 0,
      banco || null, tipo_cuenta || null, numero_cuenta || null, entrega_riohs ? 1 : 0, es_representante_legal ? 1 : 0,
      id
    ]);
    
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
    revalidatePath('/panel/rrhh/pendientes');
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
    revalidatePath('/panel/rrhh/pendientes');
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

// -- ALERTAS Y GESTION DE CONTRATOS --
export async function getContratosPorVencer(dias: number = 30) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        c.id, c.fecha_termino, c.tipo_contrato,
        t.id as trabajador_id, t.rut, t.nombres, t.apellido_paterno, t.apellido_materno,
        CONCAT(t.apellido_paterno, ' ', COALESCE(t.apellido_materno, '')) as apellidos,
        ca.nombre as cargo,
        DATEDIFF(c.fecha_termino, NOW()) as dias_restantes
      FROM rrhh_contratos c
      JOIN rrhh_trabajadores t ON c.trabajador_id = t.id
      JOIN rrhh_cargos ca ON c.cargo_id = ca.id
      WHERE c.estado = 'ACTIVO' 
        AND t.estado = 'ACTIVO'
        AND c.tipo_contrato = 'Plazo Fijo'
        AND c.fecha_termino IS NOT NULL
        AND DATEDIFF(c.fecha_termino, NOW()) <= ?
      ORDER BY dias_restantes ASC
    `, [dias]);
    
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getGestionContratos() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        t.id as trabajador_id,
        t.rut,
        t.nombres,
        t.apellido_paterno,
        t.apellido_materno,
        t.estado as estado_trabajador,
        c.id as contrato_id,
        c.cargo_id,
        c.cod_sucursal,
        c.fecha_inicio,
        c.fecha_termino,
        c.tipo_contrato,
        c.sueldo_base,
        c.estado as estado_contrato,
        ca.nombre as cargo_nombre,
        (SELECT MAX(s.nombre) FROM sucursales s WHERE s.cod_sucursal = c.cod_sucursal AND s.cod_empresa = 1) as sucursal_nombre,
        CASE WHEN c.fecha_termino IS NOT NULL THEN DATEDIFF(c.fecha_termino, NOW()) ELSE NULL END as dias_restantes
      FROM rrhh_trabajadores t
      LEFT JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos ca ON c.cargo_id = ca.id
      WHERE t.estado = 'ACTIVO'
      ORDER BY 
        CASE WHEN c.id IS NULL THEN 0 ELSE 1 END ASC,
        CASE WHEN c.fecha_termino IS NOT NULL THEN DATEDIFF(c.fecha_termino, NOW()) ELSE 99999 END ASC,
        t.apellido_paterno ASC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- AUSENTISMOS --
export async function getAusentismosByTrabajador(trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM rrhh_ausentismos 
      WHERE trabajador_id = ? 
      ORDER BY fecha_inicio DESC
    `, [trabajador_id]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function createAusentismo(data: any) {
  const connection = await pool.getConnection();
  try {
    const { trabajador_id, tipo, fecha_inicio, fecha_termino, dias, motivo } = data;
    await connection.query(`
      INSERT INTO rrhh_ausentismos (trabajador_id, tipo, fecha_inicio, fecha_termino, dias, motivo, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'APROBADO')
    `, [trabajador_id, tipo, fecha_inicio, fecha_termino, dias, motivo]);
    
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- DOCUMENTOS --
export async function getDocumentosByTrabajador(trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM rrhh_documentos 
      WHERE trabajador_id = ? 
      ORDER BY fecha_subida DESC
    `, [trabajador_id]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteDocumento(id: number, trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    // Para ser limpio deberiamos borrar el archivo real, pero por ahora solo de DB
    await connection.query('DELETE FROM rrhh_documentos WHERE id = ?', [id]);
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function uploadDocumento(formData: FormData) {
  const file = formData.get('file') as File;
  const trabajador_id = formData.get('trabajador_id') as string;
  const nombre = formData.get('nombre') as string;
  const tipo_documento = formData.get('tipo_documento') as string;

  if (!file || !trabajador_id || !nombre || !tipo_documento) {
    return { success: false, error: 'Faltan datos requeridos.' };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save in public/uploads/rrhh
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rrhh');
    // Ensure dir exists
    try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${trabajador_id}_${Date.now()}_${safeName}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);
    const archivo_url = `/uploads/rrhh/${filename}`;

    const connection = await pool.getConnection();
    try {
      await connection.query(`
        INSERT INTO rrhh_documentos (trabajador_id, nombre, tipo_documento, archivo_url)
        VALUES (?, ?, ?, ?)
      `, [parseInt(trabajador_id), nombre, tipo_documento, archivo_url]);
    } finally {
      connection.release();
    }

    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -- REMUNERACIONES: PARAMETROS MENSUALES --
export async function getParametrosMensuales(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM rrhh_parametros_mensuales WHERE periodo = ?', [periodo]);
    return { success: true, data: (rows as any[])[0] || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function saveParametrosMensuales(data: any) {
  const connection = await pool.getConnection();
  try {
    const { periodo, uf, utm, sueldo_minimo, tope_afp, tope_cesantia } = data;
    
    // Check if exists
    const [exist] = await connection.query('SELECT id FROM rrhh_parametros_mensuales WHERE periodo = ?', [periodo]);
    
    if ((exist as any[]).length > 0) {
      await connection.query(`
        UPDATE rrhh_parametros_mensuales 
        SET uf=?, utm=?, sueldo_minimo=?, tope_afp=?, tope_cesantia=? 
        WHERE periodo=?
      `, [uf, utm, sueldo_minimo, tope_afp, tope_cesantia, periodo]);
    } else {
      await connection.query(`
        INSERT INTO rrhh_parametros_mensuales (periodo, uf, utm, sueldo_minimo, tope_afp, tope_cesantia) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [periodo, uf, utm, sueldo_minimo, tope_afp, tope_cesantia]);
    }
    
    revalidatePath('/panel/rrhh/parametros');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- REMUNERACIONES: HABERES FIJOS --
export async function getHaberesFijos(trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM rrhh_haberes_fijos WHERE trabajador_id = ?', [trabajador_id]);
    return { success: true, data: (rows as any[])[0] || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function saveHaberesFijos(trabajador_id: number, data: any) {
  const connection = await pool.getConnection();
  try {
    const { colacion, movilizacion, plan_isapre_uf, bono_cumplimiento, bono_responsabilidad } = data;
    
    const [exist] = await connection.query('SELECT id FROM rrhh_haberes_fijos WHERE trabajador_id = ?', [trabajador_id]);
    
    if ((exist as any[]).length > 0) {
      await connection.query(`
        UPDATE rrhh_haberes_fijos 
        SET colacion=?, movilizacion=?, plan_isapre_uf=?, bono_cumplimiento=?, bono_responsabilidad=? 
        WHERE trabajador_id=?
      `, [
        colacion || 0,
        movilizacion || 0,
        plan_isapre_uf || 0,
        bono_cumplimiento ?? 100000,
        bono_responsabilidad ?? 300000,
        trabajador_id
      ]);
    } else {
      await connection.query(`
        INSERT INTO rrhh_haberes_fijos (trabajador_id, colacion, movilizacion, plan_isapre_uf, bono_cumplimiento, bono_responsabilidad) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        trabajador_id,
        colacion || 0,
        movilizacion || 0,
        plan_isapre_uf || 0,
        bono_cumplimiento ?? 100000,
        bono_responsabilidad ?? 300000
      ]);
    }
    
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- REMUNERACIONES: HABERES Y DESCUENTOS MENSUALES (FIJOS + VARIABLES) --
export async function getHaberesDescuentosPeriodo(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        t.id as trabajador_id,
        t.rut,
        t.nombres,
        t.apellido_paterno,
        t.apellido_materno,
        c.tipo_contrato,
        c.sueldo_base,
        ca.nombre as cargo_nombre,
        s.tipo as salud_tipo,
        s.nombre as salud_nombre,
        COALESCE(hf.colacion, 0) as colacion,
        COALESCE(hf.movilizacion, 0) as movilizacion,
        COALESCE(hf.plan_isapre_uf, 0) as plan_isapre_uf,
        COALESCE(hm.bono_imponible, 0) as bono_imponible,
        COALESCE(hm.comisiones, 0) as comisiones,
        COALESCE(hm.horas_extras, 0) as horas_extras,
        COALESCE(hm.monto_horas_extras, 0) as monto_horas_extras,
        COALESCE(hm.asignacion_familiar, 0) as asignacion_familiar,
        COALESCE(hm.otros_no_imponibles, 0) as otros_no_imponibles,
        COALESCE(hm.prestamo_ccaf, 0) as prestamo_ccaf,
        COALESCE(hm.otros_descuentos, 0) as otros_descuentos,
        COALESCE(hm.observacion, '') as observacion
      FROM rrhh_trabajadores t
      LEFT JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos ca ON c.cargo_id = ca.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      LEFT JOIN rrhh_haberes_fijos hf ON hf.trabajador_id = t.id
      LEFT JOIN rrhh_haberes_descuentos_mes hm ON hm.trabajador_id = t.id AND hm.periodo = ?
      WHERE t.estado = 'ACTIVO'
      ORDER BY t.apellido_paterno ASC, t.nombres ASC
    `, [periodo]);

    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function saveHaberDescuentoPeriodo(trabajador_id: number, periodo: string, data: any) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      colacion,
      movilizacion,
      plan_isapre_uf,
      bono_imponible,
      comisiones,
      horas_extras,
      monto_horas_extras,
      asignacion_familiar,
      otros_no_imponibles,
      prestamo_ccaf,
      otros_descuentos,
      observacion
    } = data;

    // 1. Actualizar o insertar en rrhh_haberes_fijos
    const [existFijo] = await connection.query('SELECT id FROM rrhh_haberes_fijos WHERE trabajador_id = ?', [trabajador_id]);
    if ((existFijo as any[]).length > 0) {
      await connection.query(`
        UPDATE rrhh_haberes_fijos 
        SET colacion=?, movilizacion=?, plan_isapre_uf=? 
        WHERE trabajador_id=?
      `, [colacion || 0, movilizacion || 0, plan_isapre_uf || 0, trabajador_id]);
    } else {
      await connection.query(`
        INSERT INTO rrhh_haberes_fijos (trabajador_id, colacion, movilizacion, plan_isapre_uf) 
        VALUES (?, ?, ?, ?)
      `, [trabajador_id, colacion || 0, movilizacion || 0, plan_isapre_uf || 0]);
    }

    // 2. Actualizar o insertar en rrhh_haberes_descuentos_mes
    await connection.query(`
      INSERT INTO rrhh_haberes_descuentos_mes 
      (trabajador_id, periodo, bono_imponible, comisiones, horas_extras, monto_horas_extras, asignacion_familiar, otros_no_imponibles, prestamo_ccaf, otros_descuentos, observacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        bono_imponible = VALUES(bono_imponible),
        comisiones = VALUES(comisiones),
        horas_extras = VALUES(horas_extras),
        monto_horas_extras = VALUES(monto_horas_extras),
        asignacion_familiar = VALUES(asignacion_familiar),
        otros_no_imponibles = VALUES(otros_no_imponibles),
        prestamo_ccaf = VALUES(prestamo_ccaf),
        otros_descuentos = VALUES(otros_descuentos),
        observacion = VALUES(observacion)
    `, [
      trabajador_id,
      periodo,
      bono_imponible || 0,
      comisiones || 0,
      horas_extras || 0,
      monto_horas_extras || 0,
      asignacion_familiar || 0,
      otros_no_imponibles || 0,
      prestamo_ccaf || 0,
      otros_descuentos || 0,
      observacion || null
    ]);

    await connection.commit();
    revalidatePath('/panel/rrhh/haberes-descuentos');
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// -- CAPTURA AUTOMATICA DE INDICADORES PREVISIONALES DESDE LA WEB (Previred Oficial + BCCh/SII) --
export async function fetchIndicadoresWeb(periodo: string) {
  try {
    const [anioStr, mesStr] = periodo.split('-');
    const anio = parseInt(anioStr);
    const mes = parseInt(mesStr);
    const prefijoMes = `${anio}-${String(mes).padStart(2, '0')}`;

    let ufValor: number | null = null;
    let utmValor: number | null = null;
    let sueldo_minimo = 553553;
    let tope_afp = 90.0;
    let tope_cesantia = 135.2;
    let fuente = `Previred Oficial / Banco Central (${periodo})`;

    // 1. Extraer Sueldo Mínimo, Topes (UF) y UF de fin de mes directamente desde Previred Oficial
    try {
      const resPrevired = await fetch('https://www.previred.com/indicadores-previsionales/', {
        cache: 'no-store',
        signal: AbortSignal.timeout(6000)
      });
      if (resPrevired.ok) {
        const html = await resPrevired.text();

        // Sueldo Mínimo: "Trab. Dependientes e Independientes: ... $ 553.553"
        const matchImm = html.match(/Trab\.\s*Dependientes\s*e\s*Independientes:[\s\S]{0,180}?\$\s*([\d.]+)/i);
        if (matchImm && matchImm[1]) {
          const parsedImm = parseInt(matchImm[1].replace(/\./g, ''), 10);
          if (!isNaN(parsedImm) && parsedImm > 300000) {
            sueldo_minimo = parsedImm;
          }
        }

        // Tope AFP: "Para afiliados a una AFP (90 UF)"
        const matchTopeAfp = html.match(/Para\s+afiliados\s+a\s+una\s+AFP\s*\(([\d,]+)\s*UF\)/i);
        if (matchTopeAfp && matchTopeAfp[1]) {
          const parsedAfp = parseFloat(matchTopeAfp[1].replace(',', '.'));
          if (!isNaN(parsedAfp)) tope_afp = parsedAfp;
        }

        // Tope Seguro Cesantía: "Para Seguro de Cesantía (135,2 UF)"
        const matchTopeCes = html.match(/Para\s+Seguro\s+de\s+Cesant[ií]a\s*\(([\d,]+)\s*UF\)/i);
        if (matchTopeCes && matchTopeCes[1]) {
          const parsedCes = parseFloat(matchTopeCes[1].replace(',', '.'));
          if (!isNaN(parsedCes)) tope_cesantia = parsedCes;
        }

        // UF fin de mes publicada en Previred (primer valor de la tabla VALOR UF)
        const mesesNombres = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const nombreMes = mesesNombres[mes - 1];
        const regexUfMes = new RegExp(`Al\\s+\\d+\\s+de\\s+${nombreMes}\\s+del\\s+${anio}:[\\s\\S]{0,160}?\\$\\s*([\\d.,]+)`, 'i');
        const matchUfPrev = html.match(regexUfMes);
        if (matchUfPrev && matchUfPrev[1]) {
          const parsedUf = parseFloat(matchUfPrev[1].replace(/\./g, '').replace(',', '.'));
          if (!isNaN(parsedUf) && parsedUf > 20000) {
            ufValor = parsedUf;
            fuente = `Previred Oficial (UF al cierre de ${nombreMes} ${anio})`;
          }
        }

        // UTM publicada en Previred para ese mes
        const regexUtmMes = new RegExp(`${nombreMes}\\s+${anio}[\\s\\S]{0,160}?\\$\\s*([\\d.]+)`, 'i');
        const matchUtmPrev = html.match(regexUtmMes);
        if (matchUtmPrev && matchUtmPrev[1]) {
          const parsedUtm = parseInt(matchUtmPrev[1].replace(/\./g, ''), 10);
          if (!isNaN(parsedUtm) && parsedUtm > 30000) {
            utmValor = parsedUtm;
          }
        }
      }
    } catch (e) {}

    // 2. Si el usuario consulta un mes histórico que ya no aparece en la portada de Previred, usar series de findic.cl (BCCh / SII)
    if (!ufValor || !utmValor) {
      try {
        const [resUfAnio, resUtmAnio] = await Promise.all([
          fetch(`https://findic.cl/api/uf/${anio}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
          fetch(`https://findic.cl/api/utm/${anio}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
        ]);

        if (!ufValor && resUfAnio.ok) {
          const jsonUf = await resUfAnio.json();
          if (Array.isArray(jsonUf?.serie)) {
            const matchUf = jsonUf.serie.find((s: any) => String(s.fecha).startsWith(prefijoMes));
            if (matchUf) {
              ufValor = Number(matchUf.valor);
              fuente = `Previred Oficial + BCCh (UF al ${matchUf.fecha})`;
            }
          }
        }

        if (!utmValor && resUtmAnio.ok) {
          const jsonUtm = await resUtmAnio.json();
          if (Array.isArray(jsonUtm?.serie)) {
            const matchUtm = jsonUtm.serie.find((s: any) => String(s.fecha).startsWith(prefijoMes));
            if (matchUtm) {
              utmValor = Number(matchUtm.valor);
            }
          }
        }
      } catch (e) {}
    }

    // 3. Fallback a indicadores del día en findic.cl/api
    if (!ufValor || !utmValor) {
      try {
        const resActual = await fetch('https://findic.cl/api', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (resActual.ok) {
          const jsonActual = await resActual.json();
          if (!ufValor && jsonActual?.uf?.valor) ufValor = Number(jsonActual.uf.valor);
          if (!utmValor && jsonActual?.utm?.valor) utmValor = Number(jsonActual.utm.valor);
        }
      } catch (e) {}
    }

    if (!ufValor || !utmValor) {
      return { success: false, error: 'No fue posible conectar con el servicio de indicadores económicos.' };
    }

    return {
      success: true,
      data: {
        uf: ufValor,
        utm: utmValor,
        sueldo_minimo,
        tope_afp,
        tope_cesantia,
        fuente
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -- PLANTILLAS DE CONTRATOS Y GENERADOR DE CONTRATOS --
export async function getPlantillasContratos() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT p.*, c.nombre as cargo_nombre
      FROM rrhh_plantillas_contratos p
      LEFT JOIN rrhh_cargos c ON p.cargo_id = c.id
      WHERE p.activo = 1
      ORDER BY c.nombre ASC, p.tipo_contrato ASC, p.nombre ASC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function savePlantillaContrato(data: {
  id?: number;
  nombre: string;
  cargo_id: number | null;
  tipo_contrato: string;
  contenido: string;
}) {
  const connection = await pool.getConnection();
  try {
    const { id, nombre, cargo_id, tipo_contrato, contenido } = data;
    if (id) {
      await connection.query(
        `UPDATE rrhh_plantillas_contratos SET nombre = ?, cargo_id = ?, tipo_contrato = ?, contenido = ? WHERE id = ?`,
        [nombre, cargo_id || null, tipo_contrato, contenido, id]
      );
    } else {
      await connection.query(
        `INSERT INTO rrhh_plantillas_contratos (nombre, cargo_id, tipo_contrato, contenido) VALUES (?, ?, ?, ?)`,
        [nombre, cargo_id || null, tipo_contrato, contenido]
      );
    }
    revalidatePath('/panel/rrhh/plantillas-contratos');
    revalidatePath('/panel/rrhh/pendientes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deletePlantillaContrato(id: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`UPDATE rrhh_plantillas_contratos SET activo = 0 WHERE id = ?`, [id]);
    revalidatePath('/panel/rrhh/plantillas-contratos');
    revalidatePath('/panel/rrhh/pendientes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getDatosContratoParaPDF(trabajador_id: number, contrato_id?: number) {
  const connection = await pool.getConnection();
  try {
    const [tRows] = await connection.query(`SELECT * FROM rrhh_trabajadores WHERE id = ?`, [trabajador_id]);
    if ((tRows as any[]).length === 0) return { success: false, error: 'Trabajador no encontrado' };
    const trabajador = (tRows as any[])[0];

    let cQuery = `
      SELECT c.*, ca.nombre as cargo_nombre,
             (SELECT MAX(s.nombre) FROM sucursales s WHERE s.cod_sucursal = c.cod_sucursal AND s.cod_empresa = 1) as sucursal_nombre
      FROM rrhh_contratos c
      LEFT JOIN rrhh_cargos ca ON c.cargo_id = ca.id
      WHERE c.trabajador_id = ?
    `;
    const cParams: any[] = [trabajador_id];
    if (contrato_id) {
      cQuery += ` AND c.id = ?`;
      cParams.push(contrato_id);
    } else {
      cQuery += ` AND c.estado = 'ACTIVO' ORDER BY c.id DESC LIMIT 1`;
    }

    const [cRows] = await connection.query(cQuery, cParams);
    if ((cRows as any[]).length === 0) return { success: false, error: 'El trabajador no tiene un contrato activo' };
    const contrato = (cRows as any[])[0];

    const [hfRows] = await connection.query(`SELECT * FROM rrhh_haberes_fijos WHERE trabajador_id = ?`, [trabajador_id]);
    const haberesFijos = (hfRows as any[])[0] || {
      colacion: 0,
      movilizacion: 0,
      plan_isapre_uf: 0,
      bono_cumplimiento: 100000,
      bono_responsabilidad: 300000
    };

    const [plantillasRows] = await connection.query(`
      SELECT p.*, c.nombre as cargo_nombre
      FROM rrhh_plantillas_contratos p
      LEFT JOIN rrhh_cargos c ON p.cargo_id = c.id
      WHERE p.activo = 1
      ORDER BY p.id ASC
    `);
    const plantillas = plantillasRows as any[];

    // Buscar la plantilla que coincida con cargo_id + tipo_contrato (o por cargo_id, o por tipo_contrato, o la primera)
    let plantillaSugerida =
      plantillas.find((p) => p.cargo_id === contrato.cargo_id && p.tipo_contrato === contrato.tipo_contrato) ||
      plantillas.find((p) => p.cargo_id === contrato.cargo_id) ||
      plantillas.find((p) => p.tipo_contrato === contrato.tipo_contrato) ||
      plantillas[0] ||
      null;

    return {
      success: true,
      data: {
        trabajador,
        contrato,
        haberesFijos,
        plantillas,
        plantillaSugerida
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
