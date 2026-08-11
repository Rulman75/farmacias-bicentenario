const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || 'mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const connection = await pool.getConnection();
  try {
    console.log("Iniciando migración de DB...");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS perfiles (
        Id_Perfil INT AUTO_INCREMENT PRIMARY KEY,
        Descripcion VARCHAR(100) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS aplicaciones (
        id_apli INT AUTO_INCREMENT PRIMARY KEY,
        nombre_apli VARCHAR(100) NOT NULL,
        ruta VARCHAR(100) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS perfil_apli (
        id_perfil INT NOT NULL,
        id_apli INT NOT NULL,
        PRIMARY KEY (id_perfil, id_apli),
        FOREIGN KEY (id_perfil) REFERENCES perfiles(Id_Perfil) ON DELETE CASCADE,
        FOREIGN KEY (id_apli) REFERENCES aplicaciones(id_apli) ON DELETE CASCADE
      )
    `);

    // Comprobar si existe id_perfil
    const [columns] = await connection.query("SHOW COLUMNS FROM usuarioCatalogo LIKE 'id_perfil'");
    if (columns.length === 0) {
      console.log("Añadiendo columna id_perfil...");
      await connection.query("ALTER TABLE usuarioCatalogo ADD COLUMN id_perfil INT DEFAULT 1");
    }

    // Insertar datos
    await connection.query("INSERT INTO perfiles (Id_Perfil, Descripcion) VALUES (1, 'Administrador'), (2, 'Visor') ON DUPLICATE KEY UPDATE Descripcion=VALUES(Descripcion)");
    
    await connection.query(`
      INSERT INTO aplicaciones (id_apli, nombre_apli, ruta) VALUES 
      (1, 'Panel de Control', '/'),
      (2, 'Consultor de Precios', '/consultor'),
      (3, 'Análisis de Margen', '/margenes'),
      (4, 'Sugerencia Precio Público', '/sugerencia-precio'),
      (5, 'Gestión Usuarios', '/admin/usuarios'),
      (6, 'Gestión Perfiles', '/admin/perfiles')
      ON DUPLICATE KEY UPDATE nombre_apli=VALUES(nombre_apli), ruta=VALUES(ruta)
    `);

    await connection.query("INSERT IGNORE INTO perfil_apli (id_perfil, id_apli) VALUES (1,1), (1,2), (1,3), (1,4), (1,5), (1,6)");
    await connection.query("INSERT IGNORE INTO perfil_apli (id_perfil, id_apli) VALUES (2,2)");

    // Migrar usuarios
    const [userCols] = await connection.query("SHOW COLUMNS FROM usuarioCatalogo LIKE 'rol'");
    if (userCols.length > 0) {
      await connection.query("UPDATE usuarioCatalogo SET id_perfil = 1 WHERE rol = 'admin'");
      await connection.query("UPDATE usuarioCatalogo SET id_perfil = 2 WHERE rol = 'visor'");
      await connection.query("UPDATE usuarioCatalogo SET id_perfil = 1 WHERE rol NOT IN ('admin', 'visor')");
      // Ya no dropeo la columna 'rol' inmediatamente para evitar errores en otras partes hasta que actualice el código, pero en el futuro se borraría.
    }

    console.log("Migración completada exitosamente.");
  } catch (err) {
    console.error("Error durante migración:", err);
  } finally {
    connection.release();
    pool.end();
  }
}

run();
