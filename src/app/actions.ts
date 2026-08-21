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
      [correlativo, 'PROCESADO']
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
      await connection.query(
        `UPDATE ingreso_vencimientos 
         SET cantidad = cantidad - ? 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ?
         LIMIT 1`,
        [item.cantidad, item.cod_sucursal_origen, item.cod_art, formattedFecha]
      );

      // c. Aumentar en Destino
      const [existDestino] = await connection.query(
        `SELECT id FROM ingreso_vencimientos 
         WHERE cod_sucursal = ? AND cod_art = ? AND DATE(fecha_vencimiento) = ? LIMIT 1`,
        [item.cod_sucursal_destino, item.cod_art, formattedFecha]
      );

      if ((existDestino as any[]).length > 0) {
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

export async function updateIngresoVencimiento(id: number, nuevaCantidad: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('UPDATE ingreso_vencimientos SET cantidad = ? WHERE id = ?', [nuevaCantidad, id]);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteIngresoVencimiento(id: number) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM ingreso_vencimientos WHERE id = ?', [id]);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
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
