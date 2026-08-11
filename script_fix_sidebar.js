const fs = require('fs');

const sidebarPath = 'src/components/layout/Sidebar.tsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

sidebarCode = sidebarCode.replace(
  /\{\/\* Menu Administracion \*\/\}.*?(?=\{\/\*|<nav)/s,
  `{/* Menu Administracion */}
        {(user?.rutas_apli?.includes('/admin/usuarios') || user?.rutas_apli?.includes('/admin/perfiles') || user?.rutas_apli?.includes('/admin/aplicaciones')) && (
          <div>
            <button 
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={20} className="group-hover:text-amber-400 transition-colors text-amber-500" />
                <span className="font-medium group-hover:text-amber-400 transition-colors text-amber-500">Administración</span>
              </div>
              {adminOpen ? <ChevronDown size={16} className="text-amber-500/50" /> : <ChevronRight size={16} className="text-amber-500/50" />}
            </button>
            {adminOpen && (
              <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
                {user?.rutas_apli?.includes('/admin/usuarios') && (
                <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                  <Users size={18} className="text-slate-400 group-hover:text-white" />
                  <span className="font-medium text-slate-400 group-hover:text-white">Gestión Usuarios</span>
                </Link>
                )}
                {user?.rutas_apli?.includes('/admin/perfiles') && (
                <Link href="/admin/perfiles" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                  <ShieldAlert size={18} className="text-slate-400 group-hover:text-white" />
                  <span className="font-medium text-slate-400 group-hover:text-white">Gestión Perfiles</span>
                </Link>
                )}
                {user?.rutas_apli?.includes('/admin/aplicaciones') && (
                <Link href="/admin/aplicaciones" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                  <LayoutDashboard size={18} className="text-slate-400 group-hover:text-white" />
                  <span className="font-medium text-slate-400 group-hover:text-white">Gestión Aplicaciones</span>
                </Link>
                )}
              </div>
            )}
          </div>
        )}

      </nav>
`
);

fs.writeFileSync(sidebarPath, sidebarCode);
