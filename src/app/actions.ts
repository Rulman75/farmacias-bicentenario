'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSucursales() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT cod_sucursal, MAX(nombre) as nombre 
      FROM sucursales 
      WHERE cod_empresa = 1 AND cod_sucursal NOT IN (1, 5)
      GROUP BY cod_sucursal 
      ORDER BY nombre ASC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error("Error fetching sucursales:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function searchProducto(codigo: string) {
  if (!codigo) return { success: false, error: "Código vacío" };
  
  const connection = await pool.getConnection();
  try {
    // Primero buscar en codigosdebarra
    const [barras] = await connection.query(`SELECT cod_art FROM codigosdebarra WHERE cod_barra = ? LIMIT 1`, [codigo]);
    
    let cod_art = null;
    if ((barras as any[]).length > 0) {
      cod_art = (barras as any[])[0].cod_art;
    } else {
      // Si no es codigo de barra, tal vez es el codigo interno (cod_art)
      cod_art = parseInt(codigo);
      if (isNaN(cod_art)) {
        return { success: false, error: "Producto no encontrado." };
      }
    }

    // Buscar descripcion en productos
    const [productos] = await connection.query(`SELECT cod_art, descripcion FROM productos WHERE cod_art = ? LIMIT 1`, [cod_art]);
    
    if ((productos as any[]).length > 0) {
      return { success: true, data: (productos as any[])[0] };
    } else {
      return { success: false, error: "Producto no encontrado en catálogo." };
    }
  } catch (error: any) {
    console.error("Error searching product:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function checkIngresoExistente(cod_sucursal: number, cod_art: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT id, cantidad, fecha_vencimiento 
      FROM ingreso_vencimientos 
      WHERE cod_sucursal = ? AND cod_art = ?
    `, [cod_sucursal, cod_art]);
    return { success: true, exists: (rows as any[]).length > 0, data: (rows as any[])[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function registrarIngreso(formData: FormData) {
  const cod_sucursal = formData.get('cod_sucursal');
  const codigo_ingresado = formData.get('codigo_ingresado');
  const cod_art = formData.get('cod_art');
  const cantidad = formData.get('cantidad');
  const fecha_vencimiento = formData.get('fecha_vencimiento');
  const usuario_registro = formData.get('usuario_registro') || 'Admin Farmacia'; 

  if (!cod_sucursal || !codigo_ingresado || !cod_art || !cantidad || !fecha_vencimiento) {
    return { success: false, error: "Todos los campos son obligatorios" };
  }

  const isUpdate = formData.get('isUpdate') === 'true';

  const connection = await pool.getConnection();
  try {
    if (isUpdate) {
      await connection.query(`
        UPDATE ingreso_vencimientos 
        SET cantidad = ?, fecha_vencimiento = ?, codigo_ingresado = ?, usuario_registro = ?
        WHERE cod_sucursal = ? AND cod_art = ?
      `, [cantidad, fecha_vencimiento, codigo_ingresado, usuario_registro, cod_sucursal, cod_art]);
    } else {
      await connection.query(`
        INSERT INTO ingreso_vencimientos 
        (cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro]);
    }
    
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Error inserting record:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}


// TRASPASOS
export async function guardarTraspasosDB(items: any[]) {
  if (!items || items.length === 0) return { success: false, error: "No hay items para procesar" };
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Generate Correlativo
    const correlativo = `TR-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;

    // 1. Insert Cabecera
    const [cabResult] = await connection.query(
      'INSERT INTO traspasos_cabecera (correlativo, estado) VALUES (?, ?)',
      [correlativo, 'GENERADO']
    );
    const id_traspaso = (cabResult as any).insertId;

    // 2. Process Items
    for (const item of items) {
      const fechaVencDate = new Date(item.fecha_vencimiento);
      const yyyy = fechaVencDate.getFullYear();
      const mm = String(fechaVencDate.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaVencDate.getDate()).padStart(2, '0');
      const formattedFecha = `${yyyy}-${mm}-${dd}`;

      // a. Insert Detalle
      await connection.query(
        `INSERT INTO traspasos_detalle 
         (id_traspaso, cod_sucursal_origen, cod_sucursal_destino, cod_art, cantidad, fecha_vencimiento) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_traspaso, item.cod_sucursal_origen, item.cod_sucursal_destino, item.cod_art, item.cantidad, formattedFecha]
      );

      // b. Descontar de Origen
      const [origenCurrent] = await connection.query(`SELECT cantidad FROM ingreso_vencimientos WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`, [item.cod_sucursal_origen, item.cod_art, formattedFecha]);
      let cantOrigenAnt = 0;
      if ((origenCurrent as any[]).length > 0) cantOrigenAnt = (origenCurrent as any[])[0].cantidad;

      await connection.query(
        `UPDATE ingreso_vencimientos 
         SET cantidad = cantidad - ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1`,
        [item.cantidad, item.cod_sucursal_origen, item.cod_art, formattedFecha]
      );
      
      // Log origen
      try {
        await connection.query(`INSERT INTO movimientos_inventario (cod_sucursal, cod_art, tipo_movimiento, cantidad_anterior, cantidad_nueva, id_referencia, usuario, observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.cod_sucursal_origen, item.cod_art, 'TRASPASO_SALIDA', cantOrigenAnt, cantOrigenAnt - item.cantidad, correlativo, 'SISTEMA_TRASPASOS', `Traspaso a ${item.cod_sucursal_destino}`]);
      } catch(e) {}

      // c. Aumentar en Destino
      const [existDestino] = await connection.query(
        `SELECT id, cantidad FROM ingreso_vencimientos 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`,
        [item.cod_sucursal_destino, item.cod_art, formattedFecha]
      );

      let cantDestinoAnt = 0;
      if ((existDestino as any[]).length > 0) {
        cantDestinoAnt = (existDestino as any[])[0].cantidad;
        await connection.query(
          `UPDATE ingreso_vencimientos 
           SET cantidad = cantidad + ? 
           WHERE id = ?`,
          [item.cantidad, (existDestino as any[])[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO ingreso_vencimientos (cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.cod_sucursal_destino, item.cod_art, item.cod_art, item.cantidad, formattedFecha, 'SISTEMA_TRASPASOS']
        );
      }
      
      // Log destino
      try {
        await connection.query(`INSERT INTO movimientos_inventario (cod_sucursal, cod_art, tipo_movimiento, cantidad_anterior, cantidad_nueva, id_referencia, usuario, observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.cod_sucursal_destino, item.cod_art, 'TRASPASO_ENTRADA', cantDestinoAnt, cantDestinoAnt + item.cantidad, correlativo, 'SISTEMA_TRASPASOS', `Recepción de ${item.cod_sucursal_origen}`]);
      } catch(e) {}
    }

    await connection.commit();
    revalidatePath('/agrupado');
    revalidatePath('/vencidos');
    revalidatePath('/');
    
    return { success: true, correlativo };
  } catch (error: any) {
    await connection.rollback();
    console.error("Error procesando traspaso:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}


export async function getHistorialTraspasos() {
  const connection = await pool.getConnection();
  try {
    const [cabeceras] = await connection.query(`
      SELECT * FROM traspasos_cabecera ORDER BY fecha DESC
    `);
    
    if ((cabeceras as any[]).length === 0) return { success: true, data: [] };

    const [detalles] = await connection.query(`
      SELECT 
        d.*, 
        (SELECT nombre FROM sucursales WHERE cod_sucursal = d.cod_sucursal_origen LIMIT 1) as sucursal_origen,
        (SELECT nombre FROM sucursales WHERE cod_sucursal = d.cod_sucursal_destino LIMIT 1) as sucursal_destino,
        p.descripcion
      FROM traspasos_detalle d
      LEFT JOIN productos p ON d.cod_art = p.cod_art
    `);

    const result = (cabeceras as any[]).map(c => ({
      ...c,
      detalles: (detalles as any[]).filter(d => d.id_traspaso === c.id_traspaso)
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error getHistorialTraspasos:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function anularTraspaso(id_traspaso: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [cabecera] = await connection.query(`SELECT estado FROM traspasos_cabecera WHERE id_traspaso = ?`, [id_traspaso]);
    if ((cabecera as any[]).length === 0) throw new Error("Traspaso no encontrado");
    if ((cabecera as any[])[0].estado === 'ANULADO') throw new Error("El traspaso ya se encuentra anulado");

    const [detalles] = await connection.query(`SELECT * FROM traspasos_detalle WHERE id_traspaso = ?`, [id_traspaso]);

    for (const item of (detalles as any[])) {
      const fechaVencDate = new Date(item.fecha_vencimiento);
      const yyyy = fechaVencDate.getFullYear();
      const mm = String(fechaVencDate.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaVencDate.getDate()).padStart(2, '0');
      const formattedFecha = `${yyyy}-${mm}-${dd}`;

      // a. Devolver a Origen
      await connection.query(
        `UPDATE ingreso_vencimientos 
         SET cantidad = cantidad + ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1`,
        [item.cantidad, item.cod_sucursal_origen, item.cod_art, formattedFecha]
      );

      // b. Restar de Destino
      await connection.query(
        `UPDATE ingreso_vencimientos 
         SET cantidad = cantidad - ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1`,
        [item.cantidad, item.cod_sucursal_destino, item.cod_art, formattedFecha]
      );
    }

    await connection.query(`UPDATE traspasos_cabecera SET estado = 'ANULADO' WHERE id_traspaso = ?`, [id_traspaso]);

    await connection.commit();
    revalidatePath('/historial-traspasos');
    revalidatePath('/agrupado');
    revalidatePath('/vencidos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("Error anularTraspaso:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
// NEW WORKFLOW ACTIONS FOR TRASPASOS
export async function confirmarTraspaso(id_traspaso: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('UPDATE traspasos_cabecera SET estado = ? WHERE id_traspaso = ?', ['EJECUTADO', id_traspaso]);
    revalidatePath('/panel/recepcion-traspasos');
    revalidatePath('/panel/historial-traspasos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function rechazarTraspaso(id_traspaso: number) {
  // This is essentially the same as anularTraspaso, but sets state to NO_EJECUTADO
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [cabecera] = await connection.query(`SELECT estado FROM traspasos_cabecera WHERE id_traspaso = ?`, [id_traspaso]);
    if ((cabecera as any[]).length === 0) throw new Error("Traspaso no encontrado");
    if (['ANULADO', 'NO_EJECUTADO'].includes((cabecera as any[])[0].estado)) throw new Error("El traspaso ya está anulado o rechazado");

    const [detalles] = await connection.query(`SELECT * FROM traspasos_detalle WHERE id_traspaso = ?`, [id_traspaso]);

    for (const item of (detalles as any[])) {
      const fechaVencDate = new Date(item.fecha_vencimiento);
      const yyyy = fechaVencDate.getFullYear();
      const mm = String(fechaVencDate.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaVencDate.getDate()).padStart(2, '0');
      const formattedFecha = `${yyyy}-${mm}-${dd}`;

      // a. Devolver a Origen
      await connection.query(
        `UPDATE ingreso_vencimientos SET cantidad = cantidad + ? WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`,
        [item.cantidad, item.cod_sucursal_origen, item.cod_art, formattedFecha]
      );

      // b. Quitar de Destino
      await connection.query(
        `UPDATE ingreso_vencimientos SET cantidad = cantidad - ? WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`,
        [item.cantidad, item.cod_sucursal_destino, item.cod_art, formattedFecha]
      );
    }

    await connection.query(`UPDATE traspasos_cabecera SET estado = 'NO_EJECUTADO' WHERE id_traspaso = ?`, [id_traspaso]);

    await connection.commit();
    revalidatePath('/panel/recepcion-traspasos');
    revalidatePath('/panel/historial-traspasos');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function actualizarTraspaso(id_traspaso: number, modificaciones: { id_detalle: number, nueva_cantidad: number }[]) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [cabecera] = await connection.query(`SELECT estado FROM traspasos_cabecera WHERE id_traspaso = ?`, [id_traspaso]);
    if ((cabecera as any[]).length === 0) throw new Error("Traspaso no encontrado");
    
    // For each modification, find difference
    for (const mod of modificaciones) {
      const [detalles] = await connection.query(`SELECT * FROM traspasos_detalle WHERE id_detalle = ? AND id_traspaso = ?`, [mod.id_detalle, id_traspaso]);
      if ((detalles as any[]).length > 0) {
        const item = (detalles as any[])[0];
        const diff = item.cantidad - mod.nueva_cantidad; // e.g. original 10, nueva 8. Diff = 2.
        
        if (diff !== 0) {
          const fechaVencDate = new Date(item.fecha_vencimiento);
          const formattedFecha = `${fechaVencDate.getFullYear()}-${String(fechaVencDate.getMonth() + 1).padStart(2, '0')}-${String(fechaVencDate.getDate()).padStart(2, '0')}`;
          
          // If original 10, new 8 -> we need to reverse 2. Meaning add 2 to origin, subtract 2 from destination.
          await connection.query(
            `UPDATE ingreso_vencimientos SET cantidad = cantidad + ? WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`,
            [diff, item.cod_sucursal_origen, item.cod_art, formattedFecha]
          );
          
          await connection.query(
            `UPDATE ingreso_vencimientos SET cantidad = cantidad - ? WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`,
            [diff, item.cod_sucursal_destino, item.cod_art, formattedFecha]
          );
          
          // Update the traspaso_detalle to reflect new quantity
          await connection.query(`UPDATE traspasos_detalle SET cantidad = ? WHERE id_detalle = ?`, [mod.nueva_cantidad, mod.id_detalle]);
        }
      }
    }

    await connection.query(`UPDATE traspasos_cabecera SET estado = 'EJECUTADO_ACTUALIZADO' WHERE id_traspaso = ?`, [id_traspaso]);

    await connection.commit();
    revalidatePath('/panel/recepcion-traspasos');
    revalidatePath('/panel/historial-traspasos');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
// CONSULTOR DE PRECIOS
export async function getConsultorProductos(params: { q?: string, minPrice?: number, maxPrice?: number, sort?: string, page?: number, limit?: number }) {
  const { q, minPrice, maxPrice, sort = 'default', page = 1, limit = 100 } = params;
  
  const offset = (page - 1) * limit;
  const connection = await pool.getConnection();

  try {
    let baseConditions = `
      FROM productos
      INNER JOIN precios ON productos.cod_art = precios.cod_art
      LEFT JOIN marcas ON productos.cod_marca = marcas.cod_marca
      WHERE productos.cod_empresa = 1
      AND productos.estado <> 4
      AND productos.cod_art <> 1
    `;
    
    let conditions = '';
    const queryParams: any[] = [];

    if (q) {
      conditions += ' AND productos.descripcion LIKE ?';
      queryParams.push(`%${q}%`);
    }

    if (minPrice !== undefined) {
      conditions += ' AND precios.precio_final1 >= ?';
      queryParams.push(minPrice);
    }

    if (maxPrice !== undefined) {
      conditions += ' AND precios.precio_final1 <= ?';
      queryParams.push(maxPrice);
    }

    // Total Count
    const countQuery = `SELECT COUNT(*) as total ${baseConditions} ${conditions}`;
    const [countResult] = await connection.query(countQuery, queryParams);
    const totalItems = (countResult as any[])[0].total;

    // Fetch Products
    let query = `
      SELECT 
        productos.cod_art, 
        productos.descripcion, 
        productos.piezas_caja as UnidadesCaja, 
        precios.precio_final1 as Precio, 
        ROUND(precios.precio_final1 / IF(productos.piezas_caja = 0, 1, productos.piezas_caja)) as PrecioFrac, 
        marcas.nombre as Marca, 
        productos.origen as Origen
      ${baseConditions} ${conditions}
    `;

    if (sort === 'price_asc') {
      query += ' ORDER BY precios.precio_final1 ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY precios.precio_final1 DESC';
    } else {
      query += ' ORDER BY productos.descripcion ASC';
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await connection.query(query, queryParams);

    return {
      success: true,
      data: {
        products: rows as any[],
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      }
    };
  } catch (error: any) {
    console.error('Error fetching consultor products:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// ANALISIS DE MARGEN
export async function getMarginAnalysis(params: { startDate?: string, endDate?: string, numero?: string }) {
  const { startDate, endDate, numero } = params;
  
  if (!numero && (!startDate || !endDate)) {
    return { success: false, error: 'Se requieren fechas o un número de factura/documento' };
  }

  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT
        variacioncostos.tipo,
        variacioncostos.numero,
        DATE_FORMAT(variacioncostos.fecha, '%d-%m-%Y') as fecha,
        variacioncostos.cod_art,
        variacioncostos.descripcion,
        (variacioncostos.costo_actual) as COSTO_ACTUAL_NETO,
        (variacioncostos.costo_nuevo) as COSTO_NUEVO_NETO,
        (variacioncostos.costo_actual * 1.19) as COSTO_ACTUAL_BRUTO,
        (variacioncostos.costo_nuevo * 1.19) as COSTO_NUEVO_BRUTO,
        precios.precio_final1 as PRECIO_VENTA,
        IF(variacioncostos.costo_actual = 0, NULL, (((precios.precio_final1 / 1.19) - variacioncostos.costo_actual)/ variacioncostos.costo_actual) * 100) as MARGEN_ACTUAL_NETO,
        IF(variacioncostos.costo_actual = 0, NULL, ((precios.precio_final1 - variacioncostos.costo_actual)/ variacioncostos.costo_actual) * 100) as MARGEN_ACTUAL_BRUTO,
        IF(variacioncostos.costo_nuevo = 0, NULL, (((precios.precio_final1 / 1.19) - variacioncostos.costo_nuevo)/ variacioncostos.costo_nuevo) * 100) as MARGEN_NUEVO_NETO,
        IF(variacioncostos.costo_nuevo = 0, NULL, ((precios.precio_final1 - variacioncostos.costo_nuevo)/ variacioncostos.costo_nuevo) * 100) as MARGEN_NUEVO_BRUTO,
        IF(variacioncostos.costo_actual = 0, 1, 0) as es_nuevo
      FROM variacioncostos
      INNER JOIN precios ON variacioncostos.cod_art = precios.cod_art
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    if (startDate && endDate) {
      query += ' AND variacioncostos.fecha >= ? AND variacioncostos.fecha <= ?';
      queryParams.push(startDate, endDate);
    }
    
    if (numero && numero.trim() !== '') {
      query += ' AND variacioncostos.numero = ?';
      queryParams.push(numero.trim());
    }

    query += ' ORDER BY variacioncostos.fecha DESC';

    const [rows] = await connection.query(query, queryParams);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching margin analysis:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function updateIngresoVencimiento(id: number, nuevaCantidad: number, motivo: string = 'AJUSTE_MANUAL', usuario: string = 'SISTEMA') {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [current] = await connection.query('SELECT * FROM ingreso_vencimientos WHERE id = ?', [id]);
    if ((current as any[]).length === 0) throw new Error("Registro no encontrado");
    
    const currData = (current as any[])[0];

    // Log auditoría (si la tabla no existe aún, fallará, por eso usamos TRY/CATCH para que siga si la BD aún no está migrada)
    try {
      await connection.query(`
        INSERT INTO movimientos_inventario 
        (cod_sucursal, cod_art, tipo_movimiento, cantidad_anterior, cantidad_nueva, id_referencia, usuario, observacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [currData.cod_sucursal, currData.cod_art, motivo, currData.cantidad, nuevaCantidad, id.toString(), usuario, 'Actualización manual panel']);
    } catch (e) {
      console.warn("Tabla de auditoría no disponible o error al registrar log:", e);
    }

    if (nuevaCantidad <= 0) {
      // Intentar mover a la tabla de ceros
      try {
        await connection.query(`
          INSERT INTO ingreso_vencimientos_final 
          (id, cod_sucursal, cod_art, codigo_ingresado, cantidad, fecha_vencimiento, usuario_registro, motivo_cierre)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [currData.id, currData.cod_sucursal, currData.cod_art, currData.codigo_ingresado, nuevaCantidad, currData.fecha_vencimiento, currData.usuario_registro, motivo]);
      } catch (e) {
        console.warn("Tabla final no disponible o error al mover registro:", e);
      }
      
      await connection.query('DELETE FROM ingreso_vencimientos WHERE id = ?', [id]);
    } else {
      await connection.query('UPDATE ingreso_vencimientos SET cantidad = ? WHERE id = ?', [nuevaCantidad, id]);
    }

    await connection.commit();
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteIngresoVencimiento(id: number, usuario: string = 'SISTEMA') {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [current] = await connection.query('SELECT * FROM ingreso_vencimientos WHERE id = ?', [id]);
    if ((current as any[]).length > 0) {
      const currData = (current as any[])[0];
      try {
        await connection.query(`
          INSERT INTO movimientos_inventario 
          (cod_sucursal, cod_art, tipo_movimiento, cantidad_anterior, cantidad_nueva, id_referencia, usuario, observacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [currData.cod_sucursal, currData.cod_art, 'ELIMINACION', currData.cantidad, 0, id.toString(), usuario, 'Registro eliminado desde panel']);
      } catch (e) {
        console.warn("Auditoría no disponible:", e);
      }
    }

    await connection.query('DELETE FROM ingreso_vencimientos WHERE id = ?', [id]);
    await connection.commit();
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getProductoParaSugerencia(query: string) {
  if (!query) return { success: false, error: 'Término de búsqueda vacío' };
  
  const connection = await pool.getConnection();
  try {
    const isNumber = !isNaN(Number(query));
    let finalQuery = query;
    
    if (isNumber) {
       const [barras] = await connection.query('SELECT cod_art FROM codigosdebarra WHERE cod_barra = ? LIMIT 1', [query]);
       if ((barras as any[]).length > 0) {
          finalQuery = (barras as any[])[0].cod_art.toString();
       }
    }

    let sql = `
      SELECT 
        p.cod_art, 
        (SELECT cod_barra FROM codigosdebarra WHERE cod_art = p.cod_art LIMIT 1) as cod_barra, 
        p.descripcion, 
        pr.precio_final1, 
        (p.ultimo_costo * 1.19) as costo_neto1
      FROM productos p
      LEFT JOIN precios pr ON p.cod_art = pr.cod_art
    `;

    let params = [];
    if (!isNaN(Number(finalQuery))) {
      sql += ` WHERE p.cod_art = ? `;
      params.push(Number(finalQuery));
    } else {
      sql += ` WHERE p.descripcion LIKE ? LIMIT 50`;
      params.push(`%${query}%`);
    }

    const [rows] = await connection.query(sql, params);

    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
