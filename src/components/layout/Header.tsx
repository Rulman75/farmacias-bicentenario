'use client'

import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '@/app/auth/actions';
import Image from 'next/image';

export default function Header({ isVisor }: { isVisor?: boolean }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 flex items-center">
        {isVisor && (
          <div className="flex items-center gap-4">
            <Image 
              src="/logo-bicentenario.png" 
              alt="Farmacias Bicentenario" 
              width={140} 
              height={45} 
              className="object-contain" 
            />
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <span className="font-bold text-slate-700 text-lg">Consultor de Precios</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">

        {!isVisor && (
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell size={24} />
          </button>
        )}

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              {user ? user.nombre : 'Cargando...'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.id_perfil === 1 ? 'Administrador' : user?.id_perfil === 2 ? 'Visor' : 'Usuario'}
            </p>
          </div>
          <UserCircle size={36} className="text-slate-400" />
        </div>

        {isVisor && (
          <div className="pl-6 border-l border-slate-200">
            <button 
              onClick={() => logout()} 
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
