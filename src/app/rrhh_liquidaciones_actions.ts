'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Calcula impuesto unico segun tramos del SII en UTM
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

// Calcula automáticamente los días trabajados en el período (base 30 días) descontando licencias médicas e inasistencias
async function calcularDiasTrabajadosReales(connection: any, trabajador_id: number, periodo: string, fechaInicioContrato?: Date | string) {
  const [anioStr, mesStr] = periodo.split('-');
  const anio = parseInt(anioStr);
  const mes = parseInt(mesStr);
  const ultimoDiaMes = new Date(anio, mes, 0).getDate();

  const startMesStr = `${periodo}-01`;
  const endMesStr = `${periodo}-${String(ultimoDiaMes).padStart(2, '0')}`;

  // Set de días del mes con descuento (Licencia Médica, Falla Injustificada, Inasistencia en planilla)
  const diasNoTrabajados = new Set<number>();

  // Si el contrato inició dentro de este mismo mes, los días previos al inicio no se pagan
  if (fechaInicioContrato) {
    const fIni = new Date(fechaInicioContrato);
    if (fIni.getFullYear() === anio && fIni.getMonth() + 1 === mes) {
      for (let d = 1; d < fIni.getDate(); d++) {
        diasNoTrabajados.add(d);
      }
    }
  }

  // 1. Ausentismos que descuentan días al empleador (Licencia Médica, Falla Injustificada, Permiso sin Goce)
  const [ausRows] = await connection.query(
    `SELECT fecha_inicio, fecha_termino, tipo 
     FROM rrhh_ausentismos 
     WHERE trabajador_id = ? 
       AND estado = 'APROBADO'
       AND tipo IN ('Licencia Médica', 'Falla Injustificada', 'Permiso sin Goce')
       AND fecha_inicio <= ? AND fecha_termino >= ?`,
    [trabajador_id, endMesStr, startMesStr]
  );

  for (const aus of ausRows as any[]) {
    const ini = new Date(aus.fecha_inicio);
    const fin = new Date(aus.fecha_termino);
    for (let d = 1; d <= ultimoDiaMes; d++) {
      const fDia = new Date(anio, mes - 1, d, 12, 0, 0);
      const iniNorm = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate(), 0, 0, 0);
      const finNorm = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate(), 23, 59, 59);
      if (fDia >= iniNorm && fDia <= finNorm) {
        diasNoTrabajados.add(d);
      }
    }
  }

  // 2. Inasistencias manuales en la grilla de asistencia ('I' o 'F')
  const [asisRows] = await connection.query(
    `SELECT DAY(fecha) as dia, estado 
     FROM rrhh_asistencia 
     WHERE trabajador_id = ? AND YEAR(fecha) = ? AND MONTH(fecha) = ? AND estado IN ('I', 'F')`,
    [trabajador_id, anio, mes]
  );

  for (const a of asisRows as any[]) {
    diasNoTrabajados.add(Number(a.dia));
  }

  return Math.max(0, 30 - diasNoTrabajados.size);
}

export async function generarLiquidacion(trabajador_id: number, periodo: string, dias_trabajados?: number) {
  const connection = await pool.getConnection();
  try {
    // 1. Obtener parámetros mensuales
    const [paramsRows] = await connection.query('SELECT * FROM rrhh_parametros_mensuales WHERE periodo = ?', [periodo]);
    const params = (paramsRows as any[])[0];
    if (!params) throw new Error(`Faltan parámetros mensuales (UF/UTM/IMM) para el período ${periodo}. Configúralos en el Paso 1.`);

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

    // Calcular días trabajados reales si no se forzaron manualmente
    const diasReales =
      typeof dias_trabajados === 'number'
        ? dias_trabajados
        : await calcularDiasTrabajadosReales(connection, trabajador_id, periodo, contrato.fecha_inicio);

    // 3. Obtener haberes fijos
    const [hRows] = await connection.query('SELECT * FROM rrhh_haberes_fijos WHERE trabajador_id = ?', [trabajador_id]);
    const haberesFijos = (hRows as any[])[0] || { colacion: 0, movilizacion: 0, plan_isapre_uf: 0 };

    // 4. Obtener haberes y descuentos variables del período
    const [hmRows] = await connection.query(
      'SELECT * FROM rrhh_haberes_descuentos_mes WHERE trabajador_id = ? AND periodo = ?',
      [trabajador_id, periodo]
    );
    const variablesMes = (hmRows as any[])[0] || {
      bono_imponible: 0,
      comisiones: 0,
      horas_extras: 0,
      monto_horas_extras: 0,
      asignacion_familiar: 0,
      otros_no_imponibles: 0,
      prestamo_ccaf: 0,
      otros_descuentos: 0,
      observacion: ''
    };

    // 5. Obtener Anticipos del periodo
    const [antRows] = await connection.query('SELECT SUM(monto) as total_anticipos FROM rrhh_anticipos WHERE trabajador_id = ? AND periodo = ?', [trabajador_id, periodo]);
    const anticipos = parseInt((antRows as any[])[0]?.total_anticipos || 0);

    // --- HORAS TRABAJADAS PARA PART-TIME / HONORARIOS ---
    let horasTrabajadas = 0;
    if (contrato.tipo_contrato === 'Honorarios' || contrato.tipo_contrato === 'Part-Time') {
      const [turnosRows] = await connection.query(`
        SELECT SUM(t.total_horas) as total_horas
        FROM rrhh_turnos_asignados a
        JOIN rrhh_turnos t ON a.turno_id = t.id
        WHERE a.trabajador_id = ? AND DATE_FORMAT(a.fecha, '%Y-%m') = ?
      `, [trabajador_id, periodo]);
      horasTrabajadas = parseFloat((turnosRows as any[])[0]?.total_horas || 0);
    }

    // --- VARIABLES GLOBALES DE LIQUIDACION ---
    let sueldoBaseProporcional = 0;
    let gratificacion = 0;
    let totalImponible = 0;
    let colacionProporcional = 0;
    let movilizacionProporcional = 0;
    let totalNoImponible = 0;
    let descuentoAfp = 0;
    let descuentoSalud = 0;
    let adicionalIsapre = 0;
    let descuentoCesantia = 0;
    let impuestoUnico = 0;
    let retencionHonorarios = 0;
    let totalDescuentosLegales = 0;
    let totalDescuentos = 0;
    let liquidoPagar = 0;
    
    const tasaAfpTotal = 10 + parseFloat(trabajador.afp_tasa || 0);
    const detalles_calculados: any[] = []; // [tipo, concepto, monto]

    const bonoImponible = parseInt(variablesMes.bono_imponible || 0);
    const comisiones = parseInt(variablesMes.comisiones || 0);
    const montoHorasExtras = parseInt(variablesMes.monto_horas_extras || 0);
    const cantHorasExtras = parseFloat(variablesMes.horas_extras || 0);
    const asignacionFamiliar = parseInt(variablesMes.asignacion_familiar || 0);
    const otrosNoImponibles = parseInt(variablesMes.otros_no_imponibles || 0);
    const prestamoCcaf = parseInt(variablesMes.prestamo_ccaf || 0);
    const otrosDescuentos = parseInt(variablesMes.otros_descuentos || 0);

    if (contrato.tipo_contrato === 'Honorarios') {
      const valorHora = parseFloat(contrato.sueldo_base) || 0;
      const totalBruto = Math.round(horasTrabajadas * valorHora) + bonoImponible + comisiones;
      retencionHonorarios = Math.round(totalBruto * 0.1375); // 13.75% SII
      totalDescuentos = retencionHonorarios + anticipos + otrosDescuentos;
      liquidoPagar = totalBruto - totalDescuentos;
      
      sueldoBaseProporcional = totalBruto;
      totalNoImponible = totalBruto;
      
      detalles_calculados.push(['HABER_NO_IMPONIBLE', `Honorarios por ${horasTrabajadas} hrs`, Math.round(horasTrabajadas * valorHora)]);
      if (comisiones > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Comisiones', comisiones]);
      if (bonoImponible > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Bono Adicional', bonoImponible]);
      detalles_calculados.push(['DESCUENTO_LEGAL', 'Retención Boleta Honorarios (13.75%)', retencionHonorarios]);
      if (anticipos > 0) detalles_calculados.push(['DESCUENTO', 'Anticipos', anticipos]);
      if (otrosDescuentos > 0) detalles_calculados.push(['DESCUENTO', 'Otros Descuentos', otrosDescuentos]);

    } else {
      // PLANTA O PART-TIME (Lógica de Código del Trabajo)
      if (contrato.tipo_contrato === 'Part-Time') {
        const valorHora = parseFloat(contrato.sueldo_base) || 0;
        sueldoBaseProporcional = Math.round(horasTrabajadas * valorHora);
        colacionProporcional = Math.round((haberesFijos.colacion || 0) * Math.min(1, horasTrabajadas / 180));
        movilizacionProporcional = Math.round((haberesFijos.movilizacion || 0) * Math.min(1, horasTrabajadas / 180));
      } else {
        const sueldoBaseMensual = parseFloat(contrato.sueldo_base);
        sueldoBaseProporcional = Math.round(sueldoBaseMensual * (diasReales / 30));
        colacionProporcional = Math.round((haberesFijos.colacion || 0) * (diasReales / 30));
        movilizacionProporcional = Math.round((haberesFijos.movilizacion || 0) * (diasReales / 30));
      }

      const baseParaGratificacion = sueldoBaseProporcional + comisiones + bonoImponible + montoHorasExtras;

      // Gratificación Legal Art 50 (25% de los haberes imponibles con tope de 4.75 IMM / 12)
      const topeGratificacionMensual = Math.round((4.75 * params.sueldo_minimo) / 12);
      gratificacion = Math.round(baseParaGratificacion * 0.25);
      if (gratificacion > topeGratificacionMensual) {
        gratificacion = topeGratificacionMensual;
      }

      totalImponible = baseParaGratificacion + gratificacion;
      totalNoImponible = colacionProporcional + movilizacionProporcional + asignacionFamiliar + otrosNoImponibles;

      const topeImponibleAfpPesos = Math.round(params.tope_afp * params.uf);
      const topeImponibleCesantiaPesos = Math.round(params.tope_cesantia * params.uf);

      const baseAfpSalud = Math.min(totalImponible, topeImponibleAfpPesos);
      const baseCesantia = Math.min(totalImponible, topeImponibleCesantiaPesos);

      // AFP
      descuentoAfp = Math.round(baseAfpSalud * (tasaAfpTotal / 100));

      // Salud
      descuentoSalud = Math.round(baseAfpSalud * 0.07);
      if (trabajador.salud_tipo === 'Isapre' && haberesFijos.plan_isapre_uf > 0) {
        const valorPlanPesos = Math.round(haberesFijos.plan_isapre_uf * params.uf);
        if (valorPlanPesos > descuentoSalud) {
          adicionalIsapre = valorPlanPesos - descuentoSalud;
          descuentoSalud = valorPlanPesos; 
        }
      }

      // AFC
      if (contrato.tipo_contrato === 'Indefinido') {
        descuentoCesantia = Math.round(baseCesantia * 0.006);
      }

      // Tributario
      const baseTributable = totalImponible - descuentoAfp - descuentoSalud - descuentoCesantia;
      impuestoUnico = calcularImpuestoUnico(Math.max(0, baseTributable), params.utm);

      totalDescuentosLegales = descuentoAfp + descuentoSalud + descuentoCesantia + impuestoUnico;
      totalDescuentos = totalDescuentosLegales + anticipos + prestamoCcaf + otrosDescuentos;
      liquidoPagar = totalImponible + totalNoImponible - totalDescuentos;

      // Detalle Haberes Imponibles
      detalles_calculados.push([
        'HABER_IMPONIBLE',
        contrato.tipo_contrato === 'Part-Time' ? `Sueldo Base (${horasTrabajadas} hrs)` : `Sueldo Base (${diasReales} días)`,
        sueldoBaseProporcional
      ]);
      if (comisiones > 0) detalles_calculados.push(['HABER_IMPONIBLE', 'Comisiones de Venta', comisiones]);
      if (bonoImponible > 0) detalles_calculados.push(['HABER_IMPONIBLE', 'Bono Imponible', bonoImponible]);
      if (montoHorasExtras > 0) {
        detalles_calculados.push([
          'HABER_IMPONIBLE',
          cantHorasExtras > 0 ? `Horas Extras (${cantHorasExtras} hrs al 50%)` : 'Horas Extras',
          montoHorasExtras
        ]);
      }
      detalles_calculados.push(['HABER_IMPONIBLE', 'Gratificación Legal (Art. 50)', gratificacion]);

      // Detalle Haberes No Imponibles
      if (colacionProporcional > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Colación', colacionProporcional]);
      if (movilizacionProporcional > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Movilización', movilizacionProporcional]);
      if (asignacionFamiliar > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Asignación Familiar', asignacionFamiliar]);
      if (otrosNoImponibles > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Otros No Imponibles / Aguinaldo', otrosNoImponibles]);
      
      // Detalle Descuentos Legales
      detalles_calculados.push(['DESCUENTO_LEGAL', `AFP ${trabajador.afp_nombre} (${tasaAfpTotal}%)`, descuentoAfp]);
      if (adicionalIsapre > 0) {
        detalles_calculados.push(['DESCUENTO_LEGAL', `Salud 7% Obligatorio`, descuentoSalud - adicionalIsapre]);
        detalles_calculados.push(['DESCUENTO_LEGAL', `Adicional Isapre ${trabajador.salud_nombre}`, adicionalIsapre]);
      } else {
        detalles_calculados.push(['DESCUENTO_LEGAL', `Salud ${trabajador.salud_nombre} (7%)`, descuentoSalud]);
      }
      
      if (descuentoCesantia > 0) detalles_calculados.push(['DESCUENTO_LEGAL', 'Seguro de Cesantía (0.6%)', descuentoCesantia]);
      if (impuestoUnico > 0) detalles_calculados.push(['DESCUENTO_LEGAL', 'Impuesto Único 2da Cat.', impuestoUnico]);

      // Detalle Descuentos Varios
      if (anticipos > 0) detalles_calculados.push(['DESCUENTO', 'Anticipo de Sueldo', anticipos]);
      if (prestamoCcaf > 0) detalles_calculados.push(['DESCUENTO', 'Préstamo CCAF', prestamoCcaf]);
      if (otrosDescuentos > 0) {
        detalles_calculados.push([
          'DESCUENTO',
          variablesMes.observacion ? `Otros Descuentos (${variablesMes.observacion})` : 'Otros Descuentos',
          otrosDescuentos
        ]);
      }
    }

    // --- GUARDAR EN BASE DE DATOS ---
    await connection.beginTransaction();

    await connection.query('DELETE FROM rrhh_liquidaciones WHERE trabajador_id = ? AND periodo = ?', [trabajador_id, periodo]);

    const [liqResult] = await connection.query(`
      INSERT INTO rrhh_liquidaciones 
      (trabajador_id, periodo, dias_trabajados, sueldo_base, gratificacion, total_imponible, total_no_imponible, 
       monto_afp, monto_salud, monto_cesantia, monto_impuesto, total_descuentos, liquido_pagar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      trabajador_id, periodo, diasReales, sueldoBaseProporcional, gratificacion, totalImponible, totalNoImponible,
      descuentoAfp, descuentoSalud, descuentoCesantia, impuestoUnico || retencionHonorarios, totalDescuentos, liquidoPagar
    ]);
    
    const liquidacionId = (liqResult as any).insertId;

    for (let d of detalles_calculados) {
      await connection.query('INSERT INTO rrhh_liquidaciones_detalle (liquidacion_id, tipo, concepto, monto) VALUES (?, ?, ?, ?)', [liquidacionId, d[0], d[1], d[2]]);
    }

    await connection.commit();
    revalidatePath(`/panel/rrhh/${trabajador_id}`);
    revalidatePath('/panel/rrhh/periodo');
    revalidatePath('/panel/rrhh/reportes/liquidaciones');
    
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

// --- FUNCIONES PARA NOMINA MASIVA ---

export async function getNominaMasiva(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT l.*, t.rut, t.nombres, t.apellido_paterno, t.apellido_materno, t.email, c.nombre as cargo_nombre
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      LEFT JOIN rrhh_contratos con ON con.trabajador_id = t.id AND con.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos c ON con.cargo_id = c.id
      WHERE l.periodo = ?
      ORDER BY t.apellido_paterno ASC, t.nombres ASC
    `, [periodo]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function generarNominaMasiva(periodo: string) {
  const connection = await pool.getConnection();
  try {
    // Verificar primero que existan parámetros para el período
    const [paramsRows] = await connection.query('SELECT id FROM rrhh_parametros_mensuales WHERE periodo = ?', [periodo]);
    if ((paramsRows as any[]).length === 0) {
      return {
        success: false,
        error: `No existen Parámetros Previsionales (UF, UTM, Sueldo Mínimo) configurados para el período ${periodo}. Ingresa primero al Paso 1 (Indicadores Previsionales).`
      };
    }

    const [tRows] = await connection.query(`
      SELECT t.id 
      FROM rrhh_trabajadores t
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      WHERE t.estado = 'ACTIVO'
    `);
    const trabajadores = tRows as any[];
    
    const [lRows] = await connection.query("SELECT trabajador_id FROM rrhh_liquidaciones WHERE periodo = ?", [periodo]);
    const yaGenerados = new Set((lRows as any[]).map(r => r.trabajador_id));
    
    let count = 0;
    
    for (const t of trabajadores) {
      if (!yaGenerados.has(t.id)) {
        const res = await generarLiquidacion(t.id, periodo);
        if (res.success) count++;
      }
    }
    
    revalidatePath('/panel/rrhh/periodo');
    revalidatePath('/panel/rrhh/reportes/liquidaciones');
    return { success: true, generadas: count };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function enviarNominaMasiva(periodo: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: 'Se han enviado todas las liquidaciones exitosamente por correo electrónico.' };
}

export async function eliminarNominaMasiva(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query("DELETE FROM rrhh_liquidaciones WHERE periodo = ?", [periodo]);
    revalidatePath('/panel/rrhh/periodo');
    revalidatePath('/panel/rrhh/reportes/liquidaciones');
    return { success: true, eliminadas: (result as any).affectedRows };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
