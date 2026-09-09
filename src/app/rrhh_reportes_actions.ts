'use server';

import pool from '@/lib/db';

const AFP_CODES: Record<string, string> = {
  'Cuprum': '03',
  'Habitat': '33',
  'PlanVital': '05',
  'Provida': '32',
  'Capital': '09',
  'Modelo': '34',
  'Uno': '35',
  'NO APLICA': '00'
};

const SALUD_CODES: Record<string, string> = {
  'Fonasa': '07',
  'Banmédica': '99',
  'Colmena': '67',
  'Consalud': '71',
  'Cruz Blanca': '78',
  'Nueva Masvida': '81',
  'Vida Tres': '80',
  'Esencial': '107', // Código referencial
  'NO APLICA': '00'
};

export async function generarArchivoPrevired(periodo: string) {
  const connection = await pool.getConnection();
  try {
    // Buscar liquidaciones del periodo de trabajadores con contratos vigentes (NO honorarios)
    const [rows] = await connection.query(`
      SELECT 
        l.*,
        t.rut, t.nombres, t.apellido_paterno, t.apellido_materno, t.genero,
        a.nombre as afp_nombre,
        s.nombre as salud_nombre,
        c.tipo_contrato
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      WHERE l.periodo = ? AND c.tipo_contrato != 'Honorarios'
    `, [periodo]);

    const liquidaciones = rows as any[];

    if (liquidaciones.length === 0) {
      return { success: false, error: 'No hay liquidaciones generadas para el período seleccionado (excluyendo honorarios).' };
    }

    let csvContent = "";

    for (const liq of liquidaciones) {
      // Previred exige 105 campos separados por punto y coma (;)
      const row = new Array(105).fill('');

      const rutClean = liq.rut.replace(/[^0-9kK]/g, '').toUpperCase();
      const rutNum = rutClean.slice(0, -1);
      const rutDv = rutClean.slice(-1);
      
      const periodoNum = periodo.replace('-', ''); // 2024-05 -> 202405 (Previred usa MMYYYY, lo ajustamos abajo)
      const mes = periodo.split('-')[1];
      const anio = periodo.split('-')[0];
      const periodoPrevired = `${mes}${anio}`; // MMYYYY

      // Asignación de Campos Principales (Estructura referencial 105 campos Previred CSV)
      row[0] = rutNum;                                       // 1. RUT
      row[1] = rutDv;                                        // 2. DV
      row[2] = (liq.apellido_paterno || '').substring(0, 30);// 3. Apellido Paterno
      row[3] = (liq.apellido_materno || '').substring(0, 30);// 4. Apellido Materno
      row[4] = (liq.nombres || '').substring(0, 30);         // 5. Nombres
      row[5] = liq.genero === 'F' ? 'F' : 'M';               // 6. Sexo
      row[6] = rutNum.startsWith('EXT') ? '1' : '0';         // 7. Nacionalidad (0 Chileno, 1 Extranjero)
      row[7] = '01';                                         // 8. Tipo Pago (01 = Remuneraciones)
      row[8] = periodoPrevired;                              // 9. Periodo (MMYYYY)
      row[9] = liq.tipo_contrato === 'Indefinido' ? '1' : '2';// 10. Tipo Contrato
      
      // 11 a 14: Movimientos de Personal (Ingresos, Retiros, Licencias) - Simplificado a vacío por defecto
      row[10] = '0'; // Sin movimiento
      
      // PREVISION (AFP)
      row[14] = AFP_CODES[liq.afp_nombre] || '00';           // 15. Código AFP
      row[15] = Math.round(liq.total_imponible);             // 16. Imponible AFP
      row[16] = Math.round(liq.monto_afp);                   // 17. Cotización Obligatoria AFP
      row[17] = '0'; // SIS (Seguro Invalidez) asumido por empleador aparte en totales
      row[18] = '0'; // Cuenta Ahorro Voluntario
      row[19] = '0'; // Renta Imponible Sustitutiva
      row[20] = '0'; // Tasa Pactada
      row[21] = '0'; // Aporte Indemnizatorio
      
      // SALUD
      row[29] = SALUD_CODES[liq.salud_nombre] || '00';       // 30. Código Isapre/Fonasa
      // row[31] en el CSV oficial de 105 (El índice exacto varía ligeramente según versión manual, pondremos en los típicos)
      row[30] = '0'; // Nro FUN
      row[31] = Math.round(liq.total_imponible);             // 32. Imponible Salud
      row[32] = Math.round(liq.monto_salud);                 // 33. Cotización Salud (Pactada + Obligatoria)
      row[33] = '0'; // Cotización Salud Voluntaria
      
      // SEGURO DE CESANTÍA (AFC)
      row[51] = Math.round(liq.total_imponible);             // 52. Imponible AFC
      row[52] = Math.round(liq.monto_cesantia);              // 53. Cotización Trabajador (0.6% o 0%)
      row[53] = liq.tipo_contrato === 'Indefinido' 
                  ? Math.round(liq.total_imponible * 0.024)  // 2.4% Empleador Indef
                  : Math.round(liq.total_imponible * 0.03);  // 3.0% Empleador Plazo Fijo/Part-Time
      
      // MUTUALIDAD Y CAJAS
      row[57] = Math.round(liq.total_imponible);             // 58. Imponible Mutual
      
      // CCAF (Caja Compensación)
      row[60] = Math.round(liq.total_imponible);             // 61. Imponible Caja
      
      // ASIGNACIÓN FAMILIAR
      row[76] = '0';                                         // 77. Tramo Asig. Familiar
      row[77] = '0';                                         // 78. Nro Cargas Simples

      // Completar los vacíos con '0' o vacío según estándar Previred (usaremos 0 para numéricos simplificado)
      for(let i = 0; i < 105; i++) {
        if(row[i] === '') row[i] = '0';
      }

      csvContent += row.join(';') + '\r\n';
    }

    return { success: true, csv: csvContent };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}


export async function generarArchivoLRE(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        l.*,
        t.rut, t.nombres, t.apellido_paterno, t.apellido_materno,
        c.tipo_contrato
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      WHERE l.periodo = ? AND c.tipo_contrato != 'Honorarios'
    `, [periodo]);

    const liquidaciones = rows as any[];

    if (liquidaciones.length === 0) {
      return { success: false, error: 'No hay liquidaciones generadas para el período seleccionado (excluyendo honorarios).' };
    }

    // Cabecera estándar sugerida referencialmente para análisis y LRE
    const headers = [
      "Mes", "RUT", "DV", "Nombres", "Apellido_Paterno", "Apellido_Materno",
      "Tipo_Contrato", "Dias_Trabajados", "Sueldo_Base", "Gratificacion",
      "Colacion", "Movilizacion", "Total_Imponible", "Total_No_Imponible",
      "Monto_AFP", "Monto_Salud", "Monto_Cesantia_Trabajador", "Monto_Impuesto",
      "Anticipos_Y_Otros_Descuentos", "Liquido_A_Pagar"
    ];

    let csvContent = headers.join(';') + '\r\n';

    for (const liq of liquidaciones) {
      const rutClean = liq.rut.replace(/[^0-9kK]/g, '').toUpperCase();
      const rutNum = rutClean.slice(0, -1);
      const rutDv = rutClean.slice(-1);
      const periodoLRE = periodo.replace('-', ''); // YYYYMM
      
      const anticiposYOtros = liq.total_descuentos - liq.monto_afp - liq.monto_salud - liq.monto_cesantia - liq.monto_impuesto;

      const row = [
        periodoLRE,
        rutNum,
        rutDv,
        liq.nombres,
        liq.apellido_paterno,
        liq.apellido_materno,
        liq.tipo_contrato,
        liq.dias_trabajados,
        Math.round(liq.sueldo_base || 0),
        Math.round(liq.gratificacion || 0),
        Math.round(liq.total_no_imponible / 2), 
        Math.round(liq.total_no_imponible / 2),
        Math.round(liq.total_imponible),
        Math.round(liq.total_no_imponible),
        Math.round(liq.monto_afp),
        Math.round(liq.monto_salud),
        Math.round(liq.monto_cesantia),
        Math.round(liq.monto_impuesto),
        Math.round(anticiposYOtros),
        Math.round(liq.liquido_pagar)
      ];

      csvContent += row.join(';') + '\r\n';
    }

    return { success: true, csv: csvContent };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function generarPlanillaContador(periodo: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        l.*,
        t.rut, t.nombres, t.apellido_paterno, t.apellido_materno, t.nacionalidad,
        c.fecha_inicio, c.cargo_id, cg.nombre as cargo_nombre, c.tipo_contrato,
        a.nombre as afp_nombre,
        s.nombre as salud_nombre,
        t.salud_monto_uf
      FROM rrhh_liquidaciones l
      JOIN rrhh_trabajadores t ON l.trabajador_id = t.id
      JOIN rrhh_contratos c ON c.trabajador_id = t.id AND c.estado = 'ACTIVO'
      LEFT JOIN rrhh_cargos cg ON c.cargo_id = cg.id
      LEFT JOIN rrhh_afp a ON t.afp_id = a.id
      LEFT JOIN rrhh_salud s ON t.salud_id = s.id
      WHERE l.periodo = ?
    `, [periodo]);

    const liquidaciones = rows as any[];

    if (liquidaciones.length === 0) {
      return { success: false, error: 'No hay datos para el período seleccionado.' };
    }

    const headers = [
      "APELLIDO 1", "APELLIDO 2", "NOMBRES", "NACIONALIDAD", "RUN", "DV",
      "FECHA CONTRATO", "Horas Semana", "CARGO", "TIPO CONTRATO", 
      "DÍAS L. MÉDICA", "DÍAS DE FALLA", "SUELDO BASE", "BONO CUMPLIMIENTO", 
      "BONO DE GESTION", "AGUINALDO", "HORAS EXTRAS", "AFP", "SALUD", "UF", 
      "ANTICIPO", "ASIGNACIÓN FAMILIAR", "MOVILIZACIÓN", "COLACIÓN", "LÍQUIDO A PAGAR (MONTO ACTUAL)"
    ];

    let csvContent = headers.join(';') + '\r\n';

    for (const liq of liquidaciones) {
      const rutClean = liq.rut.replace(/[^0-9kK]/g, '').toUpperCase();
      const rutNum = rutClean.slice(0, -1);
      const rutDv = rutClean.slice(-1);
      
      const fechaContrato = liq.fecha_inicio ? new Date(liq.fecha_inicio).toLocaleDateString('es-CL') : '';
      
      let diasFalla = 30 - (liq.dias_trabajados || 30);
      if (diasFalla < 0) diasFalla = 0;

      const row = [
        liq.apellido_paterno || '',
        liq.apellido_materno || '',
        liq.nombres || '',
        liq.nacionalidad || 'Chilena',
        rutNum,
        rutDv,
        fechaContrato,
        liq.horas_semanales || 40,
        liq.cargo_nombre || 'Sin Cargo',
        liq.tipo_contrato,
        0,
        diasFalla, 
        Math.round(liq.sueldo_base || 0),
        0, 
        0, 
        0, 
        0, 
        liq.afp_nombre || '',
        liq.salud_nombre || '',
        liq.salud_monto_uf ? liq.salud_monto_uf.toString().replace('.', ',') : '',
        0, 
        0, 
        Math.round((liq.total_no_imponible || 0) / 2),
        Math.round((liq.total_no_imponible || 0) / 2),
        Math.round(liq.liquido_pagar || 0)
      ];

      csvContent += row.join(';') + '\r\n';
    }

    return { success: true, csv: csvContent };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
