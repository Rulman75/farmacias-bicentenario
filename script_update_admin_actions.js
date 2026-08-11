const fs = require('fs');

const adminPath = 'src/app/admin/actions.ts';
let adminCode = fs.readFileSync(adminPath, 'utf8');

adminCode = adminCode.replace(
  /'SELECT rut, nombre, rol, debe_cambiar_pass, created_at FROM usuarioCatalogo ORDER BY created_at DESC'/,
  `'SELECT u.rut, u.nombre, u.id_perfil, p.Descripcion as perfil_desc, u.debe_cambiar_pass, u.created_at FROM usuarioCatalogo u LEFT JOIN perfiles p ON u.id_perfil = p.Id_Perfil ORDER BY u.created_at DESC'`
);

adminCode = adminCode.replace(
  /export async function crearUsuario\(data: \{ rut: string, nombre: string, rol: string \}\) \{/,
  `export async function crearUsuario(data: { rut: string, nombre: string, id_perfil: number }) {`
);

adminCode = adminCode.replace(
  /'INSERT INTO usuarioCatalogo \(rut, nombre, password_hash, debe_cambiar_pass, rol\) VALUES \(\?, \?, \?, TRUE, \?\)',\s*\[data\.rut, data\.nombre, hash, data\.rol\]/m,
  `'INSERT INTO usuarioCatalogo (rut, nombre, password_hash, debe_cambiar_pass, id_perfil) VALUES (?, ?, ?, TRUE, ?)',\n      [data.rut, data.nombre, hash, data.id_perfil]`
);

adminCode = adminCode.replace(
  /export async function actualizarUsuario\(rut: string, data: \{ nombre: string, rol: string, resetPass: boolean \}\) \{/,
  `export async function actualizarUsuario(rut: string, data: { nombre: string, id_perfil: number, resetPass: boolean }) {`
);

adminCode = adminCode.replace(
  /'UPDATE usuarioCatalogo SET nombre = \?, rol = \?, password_hash = \?, debe_cambiar_pass = TRUE WHERE rut = \?',\s*\[data\.nombre, data\.rol, hash, rut\]/m,
  `'UPDATE usuarioCatalogo SET nombre = ?, id_perfil = ?, password_hash = ?, debe_cambiar_pass = TRUE WHERE rut = ?',\n        [data.nombre, data.id_perfil, hash, rut]`
);

adminCode = adminCode.replace(
  /'UPDATE usuarioCatalogo SET nombre = \?, rol = \? WHERE rut = \?',\s*\[data\.nombre, data\.rol, rut\]/m,
  `'UPDATE usuarioCatalogo SET nombre = ?, id_perfil = ? WHERE rut = ?',\n        [data.nombre, data.id_perfil, rut]`
);

fs.writeFileSync(adminPath, adminCode);
console.log("admin/actions.ts actualizado");
