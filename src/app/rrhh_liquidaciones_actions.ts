'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Calcula impuesto unico segun tramos del SII en UTM
// Tramos 2024:
// 0 a 13.5: Exento
// 13.5 a 30: 0.04 (rebaja 0.54 UTM)
// 30 a 50: 0.08 (rebaja 1.74 UTM)
// 50 a 70: 0.135 (rebaja 4.49 UTM)
// 70 a 90: 0.23 (rebaja 11.14 UTM)
// 90 a 120: 0.304 (rebaja 17.80 UTM)
// 120 a 150: 0.35 (rebaja 23.32 UTM)
// > 150: 0.40 (rebaja 30.82 UTM)
function calcularImpuestoUnico(baseTributable: number, utm: number) {
  const baseUtm = baseTributable / utm;
  let factor = 0;
  let rebajaUtm = 0;

  if (baseUtm <= 13.5) { factor = 0; rebajaUtm = 0; }
  else if (baseUtm <= 30) { factor = 0.04; rebajaUtm = 0.54; }
  else if (baseUtm <= 50) { factor = 0.08; rebajaUtm = 1.74; }
  else if (baseUtm <= 70) { factor = 0.135; rebajaUtm = 4.49; }
  else if (baseUtm <= 90) { factor = 0.23; rebajaUtm = 11.14; }
  else if (baseUtm <= 120) { factor = 0.304; rebajaUtm = 17.80; }
  else if (baseUtm <= 150) { factor = 0.35; rebajaUtm = 23.32; }
  else { factor = 0.40; rebajaUtm = 30.82; }

  const impuestoBase = baseTributable * factor;
  const rebajaPesos = rebajaUtm * utm;
  return Math.max(0, Math.round(impuestoBase - rebajaPesos));
}

export async function generarLiquidacion(trabajador_id: number, periodo: string, dias_trabajados: number = 30) {
  const connection = await pool.getConnection();
  try {
    // 1. Obtener parámetros mensuales
    const [paramsRows] = await connection.query('SELECT * FROM rrhh_parametros_mensuales WHERE periodo = ?', [periodo]);
    const params = (paramsRows as any[])[0];
    if (!params) throw new Error(`Faltan parámetros mensuales para el período ${periodo}`);

    // 2. Obtener datos del trabajador y su contrato activo
    const [tRows] = await connection.query(`
      SELECT t.*, a.nombre as afp_nombre, a.tasa_comision as afp_tasa, s.nombre as salud_nombre, s.tipo as salud_tipo 
      FROM rrhh_trabajadores t
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      WHERE t.id = ?
    `, [trabajador_id]);
    const trabajador = (tRows as any[])[0];
    if (!trabajador) throw new Error('Trabajador no encontrado');

    const [cRows] = await connection.query(`
      SELECT * FROM rrhh_contratos 
      WHERE trabajador_id = ? AND estado = 'ACTIVO'
    `, [trabajador_id]);
    const contrato = (cRows as any[])[0];
    if (!contrato) throw new Error('El trabajador no tiene un contrato activo');

    // 3. Obtener haberes fijos
    const [hRows] = await connection.query('SELECT * FROM rrhh_haberes_fijos WHERE trabajador_id = ?', [trabajador_id]);
    const haberesFijos = (hRows as any[])[0] || { colacion: 0, movilizacion: 0, plan_isapre_uf: 0 };

    // 4. Obtener Anticipos del periodo
    const [antRows] = await connection.query('SELECT SUM(monto) as total_anticipos FROM rrhh_anticipos WHERE trabajador_id = ? AND periodo = ?', [trabajador_id, periodo]);
    const anticipos = (antRows as any[])[0]?.total_anticipos || 0;

    // --- CÁLCULOS MATEMÁTICOS (CÓDIGO DEL TRABAJO CHILE) ---

    // A. Haberes Imponibles
    const sueldoBaseMensual = parseFloat(contrato.sueldo_base);
    const sueldoBaseProporcional = Math.round(sueldoBaseMensual * (dias_trabajados / 30));

    // Gratificación Legal Art 50 (25% del base con tope de 4.75 ingresos minimos al año / 12)
    const topeGratificacionMensual = Math.round((4.75 * params.sueldo_minimo) / 12);
    let gratificacion = Math.round(sueldoBaseProporcional * 0.25);
    if (gratificacion > topeGratificacionMensual) {
      gratificacion = topeGratificacionMensual;
    }

    const totalImponible = sueldoBaseProporcional + gratificacion;

    // B. Haberes No Imponibles (proporcionales a dias trabajados)
    const colacionProporcional = Math.round((haberesFijos.colacion || 0) * (dias_trabajados / 30));
    const movilizacionProporcional = Math.round((haberesFijos.movilizacion || 0) * (dias_trabajados / 30));
    const totalNoImponible = colacionProporcional + movilizacionProporcional;

    // C. Descuentos Legales
    const topeImponibleAfpPesos = Math.round(params.tope_afp * params.uf);
    const topeImponibleCesantiaPesos = Math.round(params.tope_cesantia * params.uf);

    const baseAfpSalud = Math.min(totalImponible, topeImponibleAfpPesos);
    const baseCesantia = Math.min(totalImponible, topeImponibleCesantiaPesos);

    // AFP: 10% obligatorio + tasa AFP
    const tasaAfpTotal = 10 + parseFloat(trabajador.afp_tasa || 0);
    const descuentoAfp = Math.round(baseAfpSalud * (tasaAfpTotal / 100));

    // Salud: Fonasa (7%) o Isapre (Mínimo 7%, o el Plan Pactado en UF)
    let descuentoSalud = Math.round(baseAfpSalud * 0.07);
    let adicionalIsapre = 0;
    if (trabajador.salud_tipo === 'Isapre' && haberesFijos.plan_isapre_uf > 0) {
      const valorPlanPesos = Math.round(haberesFijos.plan_isapre_uf * params.uf);
      if (valorPlanPesos > descuentoSalud) {
        adicionalIsapre = valorPlanPesos - descuentoSalud;
        descuentoSalud = valorPlanPesos; // Total cobrado por salud
      }
    }

    // Seguro de Cesantía (AFC)
    let descuentoCesantia = 0;
    if (contrato.tipo_contrato === 'Indefinido') {
      descuentoCesantia = Math.round(baseCesantia * 0.006); // 0.6% a cargo del trabajador
    } // Si es Plazo Fijo, el trabajador paga 0%.

    // Impuesto Único
    const baseTributable = totalImponible - descuentoAfp - descuentoSalud - descuentoCesantia;
    const impuestoUnico = calcularImpuestoUnico(Math.max(0, baseTributable), params.utm);

    const totalDescuentosLegales = descuentoAfp + descuentoSalud + descuentoCesantia + impuestoUnico;
    const totalDescuentos = totalDescuentosLegales + anticipos;
    
    // D. Líquido a Pagar
    const liquidoPagar = totalImponible + totalNoImponible - totalDescuentos;

    // --- GUARDAR EN BASE DE DATOS ---

    // Iniciar Transacción
    await connection.beginTransaction();

    // Eliminar si ya existe liquidación para este mes y trabajador
    await connection.query('DELETE FROM rrhh_liquidaciones WHERE trabajador_id = ? AND periodo = ?', [trabajador_id, periodo]);

    const [liqResult] = await connection.query(`
      INSERT INTO rrhh_liquidaciones 
      (trabajador_id, periodo, dias_trabajados, sueldo_base, gratificacion, total_imponible, total_no_imponible, 
       monto_afp, monto_salud, monto_cesantia, monto_impuesto, total_descuentos, liquido_pagar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      trabajador_id, periodo, dias_trabajados, sueldoBaseProporcional, gratificacion, totalImponible, totalNoImponible,
      descuentoAfp, descuentoSalud, descuentoCesantia, impuestoUnico, totalDescuentos, liquidoPagar
    ]);
    
    const liquidacionId = (liqResult as any).insertId;

    // Guardar Detalle
    const detalles = [];
    detalles.push([liquidacionId, 'HABER_IMPONIBLE', 'Sueldo Base', sueldoBaseProporcional]);
    detalles.push([liquidacionId, 'HABER_IMPONIBLE', 'Gratificación Legal (Art 50)', gratificacion]);
    if (colacionProporcional > 0) detalles.push([liquidacionId, 'HABER_NO_IMPONIBLE', 'Colación', colacionProporcional]);
    if (movilizacionProporcional > 0) detalles.push([liquidacionId, 'HABER_NO_IMPONIBLE', 'Movilización', movilizacionProporcional]);
    detalles.push([liquidacionId, 'DESCUENTO_LEGAL', `AFP ${trabajador.afp_nombre} (${tasaAfpTotal}%)`, descuentoAfp]);
    
    if (adicionalIsapre > 0) {
      detalles.push([liquidacionId, 'DESCUENTO_LEGAL', `Salud 7% Obligatorio`, descuentoSalud - adicionalIsapre]);
      detalles.push([liquidacionId, 'DESCUENTO_LEGAL', `Adicional Isapre ${trabajador.salud_nombre}`, adicionalIsapre]);
    } else {
      detalles.push([liquidacionId, 'DESCUENTO_LEGAL', `Salud ${trabajador.salud_nombre} (7%)`, descuentoSalud]);
    }

    if (descuentoCesantia > 0) detalles.push([liquidacionId, 'DESCUENTO_LEGAL', 'Seguro de Cesantía (0.6%)', descuentoCesantia]);
    if (impuestoUnico > 0) detalles.push([liquidacionId, 'DESCUENTO_LEGAL', 'Impuesto Único 2da Cat.', impuestoUnico]);
    if (anticipos > 0) detalles.push([liquidacionId, 'DESCUENTO', 'Anticipo de Sueldo', anticipos]);

    for (let d of detalles) {
      await connection.query('INSERT INTO rrhh_liquidaciones_detalle (liquidacion_id, tipo, concepto, monto) VALUES (?, ?, ?, ?)', d);
    }

    await connection.commit();
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    
    return { success: true, data: { id: liquidacionId } };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getLiquidacionesByTrabajador(trabajador_id: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM rrhh_liquidaciones 
      WHERE trabajador_id = ? 
      ORDER BY periodo DESC
    `, [trabajador_id]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getLiquidacionCompleta(id: number) {
  const connection = await pool.getConnection();
  try {
    const [lRows] = await connection.query('SELECT * FROM rrhh_liquidaciones WHERE id = ?', [id]);
    const liquidacion = (lRows as any[])[0];
    if (!liquidacion) throw new Error('No encontrada');

    const [dRows] = await connection.query('SELECT * FROM rrhh_liquidaciones_detalle WHERE liquidacion_id = ?', [id]);
    
    // Obtener info del trabajador
    const [tRows] = await connection.query(`
      SELECT t.*, a.nombre as afp_nombre, s.nombre as salud_nombre, c.nombre as cargo_nombre 
      FROM rrhh_trabajadores t
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      LEFT JOIN rrhh_contratos con ON con.trabajador_id = t.id AND con.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos c ON con.cargo_id = c.id
      WHERE t.id = ?
    `, [liquidacion.trabajador_id]);
    
    return { 
      success: true, 
      data: { 
        ...liquidacion, 
        detalles: dRows as any[], 
        trabajador: (tRows as any[])[0] 
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
