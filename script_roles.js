const fs = require('fs');

// --- 1. Modify middleware.ts ---
const middlewarePath = 'src/middleware.ts';
let middlewareCode = fs.readFileSync(middlewarePath, 'utf8');

const jwtVerifyLogic = `
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as any;
    
    if (isLoginPage) {
      if (payload.rol === 'visor') {
        return NextResponse.redirect(new URL('/consultor', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Redirect visors if they try to access home
    if (request.nextUrl.pathname === '/' && payload.rol === 'visor') {
      return NextResponse.redirect(new URL('/consultor', request.url));
    }

    return NextResponse.next();
  } catch (error) {
`;
middlewareCode = middlewareCode.replace(
  /try \{\s*await jwtVerify\(token, JWT_SECRET\);\s*if \(isLoginPage\) \{\s*return NextResponse\.redirect\(new URL\('\/', request\.url\)\);\s*\}\s*return NextResponse\.next\(\);\s*\} catch \(error\) \{/,
  jwtVerifyLogic
);
fs.writeFileSync(middlewarePath, middlewareCode);


// --- 2. Modify Sidebar.tsx ---
const sidebarPath = 'src/components/layout/Sidebar.tsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

// Hide Vencimiento if visor
sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Vencimiento \*\/\}\s*<div>/,
  `{/* Menu Vencimiento */}
        {user?.rol !== 'visor' && (
        <div>`
);
sidebarCode = sidebarCode.replace(
  /<\/Link>\s*<\/div>\s*\)\}\s*<\/div>\s*\{\/\* Menu Comercial \*\/\}/,
  `</Link>
            </div>
          )}
        </div>
        )}

        {/* Menu Comercial */}`
);

// Add Sugerencia Precio Público link to Gestion Comercial
const linkSugerencia = `<Link href="/sugerencia-precio" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Tag size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Sugerencia Precio</span>
              </Link>`;

sidebarCode = sidebarCode.replace(
  /<Link href="\/margenes".*?>\s*<TrendingUp.*?\/>\s*<span.*?>Análisis de Margen<\/span>\s*<\/Link>/s,
  `<Link href="/margenes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <TrendingUp size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Análisis de Margen</span>
              </Link>
              ${linkSugerencia}`
);

// Hide Gestion Comercial if visor
sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Gestion Comercial \*\/\}\s*<div>/,
  `{/* Menu Gestion Comercial */}
        {user?.rol !== 'visor' && (
        <div>`
);
sidebarCode = sidebarCode.replace(
  /<\/Link>\s*<\/div>\s*\)\}\s*<\/div>\s*\{\/\* Menu Administracion \*\/\}/s,
  `</Link>
            </div>
          )}
        </div>
        )}

        {/* Menu Administracion */}`
);

fs.writeFileSync(sidebarPath, sidebarCode);

// --- 3. Modify admin/usuarios/page.tsx ---
const adminUsuariosPath = 'src/app/admin/usuarios/page.tsx';
let adminUsuariosCode = fs.readFileSync(adminUsuariosPath, 'utf8');

// Replace the input type="text" for Rol with a select
adminUsuariosCode = adminUsuariosCode.replace(
  /<input\s*type="text"\s*value=\{formData\.rol\}\s*onChange=\{\(e\) => setFormData\(\{\.\.\.formData, rol: e\.target\.value\}\)\}\s*className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"\s*required\s*\/>/s,
  `<select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Seleccione un rol...</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                  <option value="comercial">Comercial (Sin Configuración)</option>
                  <option value="visor">Visor (Solo Consultor)</option>
                </select>`
);

// Also set the default state to empty string instead of 'usuario' if any
adminUsuariosCode = adminUsuariosCode.replace(
  /const \[formData, setFormData\] = useState\(\{ rut: '', nombre: '', rol: 'usuario' \}\);/,
  `const [formData, setFormData] = useState({ rut: '', nombre: '', rol: 'visor' });`
);

fs.writeFileSync(adminUsuariosPath, adminUsuariosCode);

console.log("Roles y perfiles implementados");
