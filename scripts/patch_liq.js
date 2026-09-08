const fs = require('fs');
let content = fs.readFileSync('src/app/rrhh_liquidaciones_actions.ts', 'utf8');

const searchTarget = `    // A. Haberes Imponibles
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

    const [liqResult] = await connection.query(\`
      INSERT INTO rrhh_liquidaciones 
      (trabajador_id, periodo, dias_trabajados, sueldo_base, gratificacion, total_imponible, total_no_imponible, 
       monto_afp, monto_salud, monto_cesantia, monto_impuesto, total_descuentos, liquido_pagar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`, [
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
    detalles.push([liquidacionId, 'DESCUENTO_LEGAL', \`AFP \${trabajador.afp_nombre} (\${tasaAfpTotal}%)\`, descuentoAfp]);
    
    if (adicionalIsapre > 0) {
      detalles.push([liquidacionId, 'DESCUENTO_LEGAL', \`Salud 7% Obligatorio\`, descuentoSalud - adicionalIsapre]);
      detalles.push([liquidacionId, 'DESCUENTO_LEGAL', \`Adicional Isapre \${trabajador.salud_nombre}\`, adicionalIsapre]);
    } else {
      detalles.push([liquidacionId, 'DESCUENTO_LEGAL', \`Salud \${trabajador.salud_nombre} (7%)\`, descuentoSalud]);
    }

    if (descuentoCesantia > 0) detalles.push([liquidacionId, 'DESCUENTO_LEGAL', 'Seguro de Cesantía (0.6%)', descuentoCesantia]);
    if (impuestoUnico > 0) detalles.push([liquidacionId, 'DESCUENTO_LEGAL', 'Impuesto Único 2da Cat.', impuestoUnico]);
    if (anticipos > 0) detalles.push([liquidacionId, 'DESCUENTO', 'Anticipo de Sueldo', anticipos]);

    for (let d of detalles) {
      await connection.query('INSERT INTO rrhh_liquidaciones_detalle (liquidacion_id, tipo, concepto, monto) VALUES (?, ?, ?, ?)', d);
    }`;

const replacement = `    // --- HORAS TRABAJADAS PARA PART-TIME / HONORARIOS ---
    let horasTrabajadas = 0;
    if (contrato.tipo_contrato === 'Honorarios' || contrato.tipo_contrato === 'Part-Time') {
      const [turnosRows] = await connection.query(\`
        SELECT SUM(t.total_horas) as total_horas
        FROM rrhh_turnos_asignados a
        JOIN rrhh_turnos t ON a.turno_id = t.id
        WHERE a.trabajador_id = ? AND DATE_FORMAT(a.fecha, '%Y-%m') = ?
      \`, [trabajador_id, periodo]);
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

    if (contrato.tipo_contrato === 'Honorarios') {
      const valorHora = parseFloat(contrato.sueldo_base) || 0;
      const totalBruto = Math.round(horasTrabajadas * valorHora);
      retencionHonorarios = Math.round(totalBruto * 0.1375); // 13.75% SII 2024
      liquidoPagar = totalBruto - retencionHonorarios - anticipos;
      
      sueldoBaseProporcional = totalBruto;
      totalNoImponible = totalBruto;
      totalDescuentos = retencionHonorarios + anticipos;
      
      detalles_calculados.push(['HABER_NO_IMPONIBLE', \`Honorarios por \${horasTrabajadas} hrs\`, totalBruto]);
      detalles_calculados.push(['DESCUENTO_LEGAL', 'Retención SII (13.75%)', retencionHonorarios]);
      if (anticipos > 0) detalles_calculados.push(['DESCUENTO', 'Anticipos', anticipos]);

    } else {
      // PLANTA O PART-TIME (Lógica de Código del Trabajo)
      
      if (contrato.tipo_contrato === 'Part-Time') {
        const valorHora = parseFloat(contrato.sueldo_base) || 0;
        sueldoBaseProporcional = Math.round(horasTrabajadas * valorHora);
        // Colacion prop. a las horas, ej asumiendo 180 hrs mes normal. Simplificado: o se da integro o por hrs
        colacionProporcional = Math.round((haberesFijos.colacion || 0) * (horasTrabajadas / 180));
        movilizacionProporcional = Math.round((haberesFijos.movilizacion || 0) * (horasTrabajadas / 180));
      } else {
        const sueldoBaseMensual = parseFloat(contrato.sueldo_base);
        sueldoBaseProporcional = Math.round(sueldoBaseMensual * (dias_trabajados / 30));
        colacionProporcional = Math.round((haberesFijos.colacion || 0) * (dias_trabajados / 30));
        movilizacionProporcional = Math.round((haberesFijos.movilizacion || 0) * (dias_trabajados / 30));
      }

      // Gratificación Legal Art 50
      const topeGratificacionMensual = Math.round((4.75 * params.sueldo_minimo) / 12);
      gratificacion = Math.round(sueldoBaseProporcional * 0.25);
      if (gratificacion > topeGratificacionMensual) {
        gratificacion = topeGratificacionMensual;
      }

      totalImponible = sueldoBaseProporcional + gratificacion;
      totalNoImponible = colacionProporcional + movilizacionProporcional;

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
      totalDescuentos = totalDescuentosLegales + anticipos;
      liquidoPagar = totalImponible + totalNoImponible - totalDescuentos;

      detalles_calculados.push(['HABER_IMPONIBLE', contrato.tipo_contrato === 'Part-Time' ? \`Sueldo Base (\${horasTrabajadas} hrs)\` : 'Sueldo Base', sueldoBaseProporcional]);
      detalles_calculados.push(['HABER_IMPONIBLE', 'Gratificación Legal (Art 50)', gratificacion]);
      if (colacionProporcional > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Colación', colacionProporcional]);
      if (movilizacionProporcional > 0) detalles_calculados.push(['HABER_NO_IMPONIBLE', 'Movilización', movilizacionProporcional]);
      
      detalles_calculados.push(['DESCUENTO_LEGAL', \`AFP \${trabajador.afp_nombre} (\${tasaAfpTotal}%)\`, descuentoAfp]);
      if (adicionalIsapre > 0) {
        detalles_calculados.push(['DESCUENTO_LEGAL', \`Salud 7% Obligatorio\`, descuentoSalud - adicionalIsapre]);
        detalles_calculados.push(['DESCUENTO_LEGAL', \`Adicional Isapre \${trabajador.salud_nombre}\`, adicionalIsapre]);
      } else {
        detalles_calculados.push(['DESCUENTO_LEGAL', \`Salud \${trabajador.salud_nombre} (7%)\`, descuentoSalud]);
      }
      
      if (descuentoCesantia > 0) detalles_calculados.push(['DESCUENTO_LEGAL', 'Seguro de Cesantía (0.6%)', descuentoCesantia]);
      if (impuestoUnico > 0) detalles_calculados.push(['DESCUENTO_LEGAL', 'Impuesto Único 2da Cat.', impuestoUnico]);
      if (anticipos > 0) detalles_calculados.push(['DESCUENTO', 'Anticipo de Sueldo', anticipos]);
    }

    // --- GUARDAR EN BASE DE DATOS ---
    await connection.beginTransaction();

    await connection.query('DELETE FROM rrhh_liquidaciones WHERE trabajador_id = ? AND periodo = ?', [trabajador_id, periodo]);

    const [liqResult] = await connection.query(\`
      INSERT INTO rrhh_liquidaciones 
      (trabajador_id, periodo, dias_trabajados, sueldo_base, gratificacion, total_imponible, total_no_imponible, 
       monto_afp, monto_salud, monto_cesantia, monto_impuesto, total_descuentos, liquido_pagar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`, [
      trabajador_id, periodo, dias_trabajados, sueldoBaseProporcional, gratificacion, totalImponible, totalNoImponible,
      descuentoAfp, descuentoSalud, descuentoCesantia, impuestoUnico || retencionHonorarios, totalDescuentos, liquidoPagar
    ]);
    
    const liquidacionId = (liqResult as any).insertId;

    for (let d of detalles_calculados) {
      await connection.query('INSERT INTO rrhh_liquidaciones_detalle (liquidacion_id, tipo, concepto, monto) VALUES (?, ?, ?, ?)', [liquidacionId, d[0], d[1], d[2]]);
    }`;

if(content.includes('const sueldoBaseMensual = parseFloat(contrato.sueldo_base);')) {
  content = content.replace(searchTarget, replacement);
  fs.writeFileSync('src/app/rrhh_liquidaciones_actions.ts', content);
  console.log('Patched correctly');
} else {
  console.log('Not found');
}
