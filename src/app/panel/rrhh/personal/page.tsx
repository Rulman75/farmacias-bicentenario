import Link from 'next/link';
import { getTrabajadores } from '@/app/rrhh_actions';
import { Users, Plus, ChevronRight } from 'lucide-react';
import RRHHTableClient from '@/components/rrhh/RRHHTableClient';

export default async function PersonalPage({
  searchParams
}: {
  searchParams: { search?: string, estado?: string }
}) {
  const sp = await searchParams;
  const search = sp.search || '';
  const estado = sp.estado || 'ACTIVO';

  const res = await getTrabajadores(search, estado);
  const trabajadores = res.success ? (res.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <Link href="#" className="hover:text-blue-600 transition-colors">Contratación</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Ficha Personal</span>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-600/20 hidden md:block">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Ficha Personal</h1>
            <p className="text-slate-500">Directorio y gestión de trabajadores</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/panel/rrhh/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Empleado</span>
          </Link>
        </div>
      </div>

      <RRHHTableClient initialTrabajadores={trabajadores} search={search} estado={estado} />
    </div>
  );
}
