'use client'

import { Bell, Search, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/app/auth/actions';

export default function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1">
        {/* Espacio reservado para pan de migas o titulo dinámico en el futuro */}
      </div>

      <div className="flex items-center gap-6">

        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={24} />
          {/* <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span> */}
        </button>

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
      </div>
    </header>
  );
}
