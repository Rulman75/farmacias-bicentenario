'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SucursalFilter({ sucursales }: { sucursales: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSucursal = searchParams.get('sucursal') || '0';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '0') {
      router.push('/panel');
    } else {
      router.push(`/panel?sucursal=${val}`);
    }
  };

  return (
    <select 
      value={currentSucursal} 
      onChange={handleChange}
      className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
    >
      <option value="0">Todas las Sucursales</option>
      {sucursales.map(s => (
        <option key={s.cod_sucursal} value={s.cod_sucursal}>{s.nombre}</option>
      ))}
    </select>
  );
}
