'use client'

import { Bell, Search, UserCircle, LogOut, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '@/app/auth/actions';
import Image from 'next/image';

export default function Header({ isVisor, toggleMenu }: { isVisor?: boolean, toggleMenu?: () => void }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 flex items-center gap-4">
        {!isVisor && (
          <button 
            onClick={toggleMenu} 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 md:hidden transition-colors rounded-lg bg-slate-50"
          >
            <Menu size={24} />
          </button>
        )}
        
        {isVisor && (
          <div className="flex items-center gap-4">
            <Image 
              src="/logo-bicentenario.png" 
              alt="Farmacias Bicentenario" 
              width={140} 
              height={45} 
              className="object-contain" 
            />
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <span className="font-bold text-slate-700 text-lg hidden sm:block">Consultor de Precios</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">

        {!isVisor && (
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors hidden sm:block">
            <Bell size={24} />
          </button>
        )}

        <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              {user ? user.nombre : 'Cargando...'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.id_perfil === 1 ? 'Administrador' : user?.id_perfil === 2 ? 'Visor' : 'Usuario'}
            </p>
          </div>
          <UserCircle size={32} className="text-slate-400 sm:w-9 sm:h-9" />
        </div>

        {isVisor && (
          <div className="pl-4 sm:pl-6 border-l border-slate-200">
            <button 
              onClick={() => logout()} 
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
