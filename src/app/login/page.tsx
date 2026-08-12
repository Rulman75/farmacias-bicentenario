'use client'

import { useState } from 'react';
import { login, updatePassword } from '@/app/auth/actions';
import Image from 'next/image';
import { Loader2, Lock, User, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isChangingPassword) {
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }
      
      const res = await updatePassword(rut, password, newPassword);
      if (res.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(res.error || 'Error al cambiar contraseña');
        setLoading(false);
      }
      return;
    }

    const res = await login(rut, password);
    
    if (res.success) {
      router.push('/');
      router.refresh();
    } else if (res.requirePasswordChange) {
      setIsChangingPassword(true);
      setError('');
      setLoading(false);
    } else {
      setError(res.error || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-8">
          <Image src="/logo-bicentenario.png" alt="Farmacias Bicentenario" width={220} height={70} className="object-contain" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Sistema de Gestión Farmacias Bicentenario</h2>
        
        {isChangingPassword && (
          <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-amber-200">
            Debes cambiar tu contraseña por seguridad para poder continuar.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isChangingPassword ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={rut}
                    onChange={e => setRut(e.target.value)}
                    placeholder="12345678-9"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 caracteres"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirma la contraseña"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-fuchsia-600/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : isChangingPassword ? 'Actualizar y Entrar' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
