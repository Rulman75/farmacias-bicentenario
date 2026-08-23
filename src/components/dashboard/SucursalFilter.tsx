'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export default function SucursalFilter({ sucursales }: { sucursales: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSucursal = searchParams.get('sucursal') || '0';
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    startTransition(() => {
      if (val === '0') {
        router.push('/panel');
      } else {
        router.push(`/panel?sucursal=${val}`);
      }
    });
  };

  return (
    <div className="relative flex items-center">
      <select 
        value={currentSucursal} 
        onChange={handleChange}
        disabled={isPending}
        className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer disabled:opacity-50"
      >
        <option value="0">Todas las Sucursales</option>
        {sucursales.map(s => (
          <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
        ))}
      </select>
      {isPending && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-600">
          <Loader2 className="animate-spin" size={16} />
        </div>
      )}
    </div>
  );
}
