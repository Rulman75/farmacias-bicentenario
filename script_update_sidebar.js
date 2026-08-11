const fs = require('fs');

const sidebarPath = 'src/components/layout/Sidebar.tsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

// Replace Vencimiento condition
sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Vencimiento \*\/\}\s*\{user\?\.rol !== 'visor' && \(/,
  `{/* Menu Vencimiento */}\n        {user?.rutas_apli?.includes('/') && (`
);

// Replace Comercial condition
sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Comercial \*\/\}\s*<div>/,
  `{/* Menu Comercial */}\n        {user?.rutas_apli?.includes('/consultor') && (\n        <div>`
);

// Close Comercial div
sidebarCode = sidebarCode.replace(
  /<\/Link>\s*<\/div>\s*\)\}\s*<\/div>\s*\{\/\* Menu Gestion Comercial \*\/\}/s,
  `</Link>
            </div>
          )}
        </div>
        )}

        {/* Menu Gestion Comercial */}`
);

// Replace Gestion Comercial condition
sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Gestion Comercial \*\/\}\s*\{user\?\.rol !== 'visor' && \(/,
  `{/* Menu Gestion Comercial */}\n        {(user?.rutas_apli?.includes('/margenes') || user?.rutas_apli?.includes('/sugerencia-precio')) && (`
);

// Hide specific links in Gestion Comercial
sidebarCode = sidebarCode.replace(
  /<Link href="\/margenes"/,
  `{user?.rutas_apli?.includes('/margenes') && (
              <Link href="/margenes"`
);
sidebarCode = sidebarCode.replace(
  /<\/Link>\s*<Link href="\/sugerencia-precio"/,
  `</Link>\n              )}\n              {user?.rutas_apli?.includes('/sugerencia-precio') && (\n              <Link href="/sugerencia-precio"`
);
sidebarCode = sidebarCode.replace(
  /<\/Link>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*\{\/\* Menu Administracion \*\/\}/s,
  `</Link>\n              )}\n            </div>\n          )}\n        </div>\n        )}\n\n        {/* Menu Administracion */}`
);

// Replace Administracion condition
sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Administracion \*\/\}\s*\{user\?\.rol === 'admin' && \(/,
  `{/* Menu Administracion */}\n        {(user?.rutas_apli?.includes('/admin/usuarios') || user?.rutas_apli?.includes('/admin/perfiles')) && (`
);

// Add /admin/perfiles link to Administracion and hide specific links
sidebarCode = sidebarCode.replace(
  /<Link href="\/admin\/usuarios"/,
  `{user?.rutas_apli?.includes('/admin/usuarios') && (
                <Link href="/admin/usuarios"`
);
sidebarCode = sidebarCode.replace(
  /<\/Link>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}/s,
  `</Link>
                )}
                {user?.rutas_apli?.includes('/admin/perfiles') && (
                <Link href="/admin/perfiles" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                  <ShieldAlert size={18} className="text-slate-400 group-hover:text-white" />
                  <span className="font-medium text-slate-400 group-hover:text-white">Gestión Perfiles</span>
                </Link>
                )}
              </div>
            )}
          </div>
        )}`
);

// Bottom part user status
sidebarCode = sidebarCode.replace(
  /\{user\.rol === 'admin' \? 'Admin: ' : 'Usuario: '\}/,
  `{'Usuario: '}`
);

fs.writeFileSync(sidebarPath, sidebarCode);
console.log("Sidebar.tsx actualizado");
