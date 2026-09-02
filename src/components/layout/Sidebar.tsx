'use client'

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/app/auth/actions';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Pill, LogOut, ChevronDown, ChevronRight, Clock, ArrowRightLeft, Tag, TrendingUp, Users, ShoppingCart, Briefcase, ShieldAlert, Home, X, CheckCircle } from 'lucide-react';
import { logout } from '@/app/auth/actions';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (v: boolean) => void }) {
  const [vencimientoOpen, setVencimientoOpen] = useState(false);
  const [comercialOpen, setComercialOpen] = useState(false);
  const [gestionComercialOpen, setGestionComercialOpen] = useState(false);
  const [rrhhOpen, setRrhhOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [contratacionOpen, setContratacionOpen] = useState(false);
  const [remuneracionesOpen, setRemuneracionesOpen] = useState(false);
  const [reportesRrhhOpen, setReportesRrhhOpen] = useState(false);
  const [mantenedoresRrhhOpen, setMantenedoresRrhhOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u && !u.rutas_apli) {
        // Token antiguo sin perfiles, forzar cierre
        logout();
      } else {
        setUser(u);
      }
    });
  }, []);

  return (
    <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="h-20 flex items-center justify-between border-b border-slate-700 bg-white px-4">
        <Image 
          src="/logo-bicentenario.png" 
          alt="Farmacias Bicentenario" 
          width={150} 
          height={45} 
          className="object-contain" 
          priority 
        />
        <button onClick={() => setIsOpen?.(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-2 rounded-lg bg-slate-100">
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        
        {/* Menu Inicio */}
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group mb-4"
        >
          <Home size={20} className="text-slate-300 group-hover:text-white transition-colors" />
          <span className="font-medium text-slate-300 group-hover:text-white transition-colors">Inicio</span>
        </Link>
        
        {/* Menu Vencimiento */}
        {user?.rutas_apli?.includes('/panel') && (
        <div>
          <button 
            onClick={() => setVencimientoOpen(!vencimientoOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="group-hover:text-white transition-colors text-slate-300" />
              <span className="font-medium group-hover:text-white transition-colors text-slate-300">Vencimiento</span>
            </div>
            {vencimientoOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {vencimientoOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              <Link href="/panel" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <LayoutDashboard size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Panel Principal</span>
              </Link>
              <Link href="/panel/ingreso" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Pill size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Registrar Ingreso</span>
              </Link>
              <Link href="/panel/historial-traspasos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <ArrowRightLeft size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Historial Traspasos</span>
              </Link>
              <Link href="/panel/recepcion-traspasos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <CheckCircle size={18} className="text-slate-400 group-hover:text-teal-400" />
                <span className="font-medium text-slate-400 group-hover:text-white">Recepción Traspasos</span>
              </Link>
            </div>
          )}
        </div>
        )}

        {/* Menu Comercial */}
        {user?.rutas_apli?.includes('/consultor') && (
        <div>
          <button 
            onClick={() => setComercialOpen(!comercialOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} className="group-hover:text-white transition-colors text-slate-300" />
              <span className="font-medium group-hover:text-white transition-colors text-slate-300">Comercial</span>
            </div>
            {comercialOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {comercialOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              <Link href="/consultor" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Tag size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Consultor Precio</span>
              </Link>
            </div>
          )}
        </div>
        )}

        {/* Menu Gestion Comercial */}
        {(user?.rutas_apli?.includes('/margenes') || user?.rutas_apli?.includes('/sugerencia-precio')) && (
        <div>
          <button 
            onClick={() => setGestionComercialOpen(!gestionComercialOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="group-hover:text-white transition-colors text-slate-300" />
              <span className="font-medium group-hover:text-white transition-colors text-slate-300">Gestión Comercial</span>
            </div>
            {gestionComercialOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {gestionComercialOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              {user?.rutas_apli?.includes('/margenes') && (
              <Link href="/margenes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <TrendingUp size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Análisis de Margen</span>
              </Link>
              )}
              {user?.rutas_apli?.includes('/sugerencia-precio') && (
              <Link href="/sugerencia-precio" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <Tag size={18} className="text-slate-400 group-hover:text-white" />
                <span className="font-medium text-slate-400 group-hover:text-white">Sugerencia Precio</span>
              </Link>
              )}
            </div>
          )}
        </div>
        )}

        {/* Menu Recursos Humanos */}
        <div>
          <button 
            onClick={() => setRrhhOpen(!rrhhOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Users size={20} className="group-hover:text-blue-400 transition-colors text-blue-500" />
              <span className="font-medium group-hover:text-blue-400 transition-colors text-blue-500">Recursos Humanos</span>
            </div>
            {rrhhOpen ? <ChevronDown size={16} className="text-blue-500/50" /> : <ChevronRight size={16} className="text-blue-500/50" />}
          </button>
          
          {rrhhOpen && (
            <div className="mt-1 ml-4 border-l border-slate-700 pl-3 space-y-1">
              
              {/* Dashboard */}
              <Link href="/panel/rrhh" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group text-sm">
                <span className="font-medium text-slate-400 group-hover:text-white">Panel Principal</span>
              </Link>

              {/* Personal */}
              <div>
                <button 
                  onClick={() => setPersonalOpen(!personalOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group text-sm"
                >
                  <span className="font-medium text-slate-400 group-hover:text-white">Personal</span>
                  {personalOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                </button>
                {personalOpen && (
                  <div className="mt-1 ml-3 border-l border-slate-700 pl-3 space-y-1">
                    {/* Contratación */}
                    <div>
                      <button 
                        onClick={() => setContratacionOpen(!contratacionOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group text-sm"
                      >
                        <span className="font-medium text-slate-400 group-hover:text-white">Contratación</span>
                        {contratacionOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                      </button>
                      {contratacionOpen && (
                        <div className="mt-1 ml-3 border-l border-slate-700 pl-3 space-y-1">
                          <Link href="/panel/rrhh/personal" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Ficha Personal
                          </Link>
                          <Link href="/panel/rrhh/pendientes" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Contratos Pendientes
                          </Link>
                          <Link href="/panel/rrhh/termino" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Carta Término
                          </Link>
                        </div>
                      )}
                    </div>
                    {/* Otros de Personal */}
                    <Link href="/panel/rrhh/finiquito" className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Finiquito</Link>
                    <Link href="/panel/rrhh/licencias" className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Licencias - Reposo</Link>
                    <Link href="/panel/rrhh/permisos" className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Permisos</Link>
                    <Link href="/panel/rrhh/vacaciones" className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Vacaciones</Link>
                    <Link href="/panel/rrhh/bienestar" className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Bienestar</Link>
                  </div>
                )}
              </div>

              {/* Remuneraciones */}
              <div>
                <button 
                  onClick={() => setRemuneracionesOpen(!remuneracionesOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group text-sm"
                >
                  <span className="font-medium text-slate-400 group-hover:text-white">Remuneraciones</span>
                  {remuneracionesOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                </button>
                {remuneracionesOpen && (
                  <div className="mt-1 ml-3 border-l border-slate-700 pl-3 space-y-1">
                    <Link href="/panel/rrhh/anticipos" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Anticipo</Link>
                    <Link href="/panel/rrhh/periodo" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Periodo</Link>
                    <Link href="/panel/rrhh/haberes-descuentos" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Haberes y Descuentos</Link>
                  </div>
                )}
              </div>

              {/* Reportes */}
              <div>
                <button 
                  onClick={() => setReportesRrhhOpen(!reportesRrhhOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group text-sm"
                >
                  <span className="font-medium text-slate-400 group-hover:text-white">Reportes</span>
                  {reportesRrhhOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                </button>
                {reportesRrhhOpen && (
                  <div className="mt-1 ml-3 border-l border-slate-700 pl-3 space-y-1">
                    <Link href="/panel/rrhh/reportes/liquidaciones" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Liquidaciones de Sueldo</Link>
                    <Link href="/panel/rrhh/reportes/certificados" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Certificados de Renta</Link>
                    <Link href="/panel/rrhh/reportes/lre" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Libro de Remuneraciones</Link>
                    <Link href="/panel/rrhh/reportes/previred" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Libro Previred</Link>
                    <Link href="/panel/rrhh/reportes/resumen" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Resumen Proceso</Link>
                    <Link href="/panel/rrhh/reportes/periodo" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Liq. por Periodo</Link>
                  </div>
                )}
              </div>

              {/* Mantenedores */}
              <div>
                <button 
                  onClick={() => setMantenedoresRrhhOpen(!mantenedoresRrhhOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group text-sm"
                >
                  <span className="font-medium text-slate-400 group-hover:text-white">Mantenedores</span>
                  {mantenedoresRrhhOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                </button>
                {mantenedoresRrhhOpen && (
                  <div className="mt-1 ml-3 border-l border-slate-700 pl-3 space-y-1">
                    <Link href="/panel/rrhh/parametros" className="block px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors">Parámetros</Link>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Menu Administracion */}
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

      <div className="p-4 border-t border-slate-800 bg-slate-900 z-50">
        <button onClick={() => logout()} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
