import Link from 'next/link';
import { getTrabajadores } from '@/app/rrhh_actions';
import { Users, Plus, Search } from 'lucide-react';
import RRHHTableClient from '@/components/rrhh/RRHHTableClient';

export default async function RRHHPage({
  searchParams
}: {
  searchParams: { search?: string, estado?: string }
}) {
  const search = searchParams.search || '';
  const estado = searchParams.estado || 'ACTIVO';

  const res = await getTrabajadores(search, estado);
  const trabajadores = res.success ? (res.data as any[]) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Recursos Humanos</h1>
            <p className="text-slate-500">Directorio del personal y colaboradores</p>
          </div>
        </div>
        
        <Link 
          href="/panel/rrhh/nuevo" 
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md"
        >
          <Plus size={20} />
          Nuevo Trabajador
        </Link>
      </div>

      <RRHHTableClient initialTrabajadores={trabajadores} search={search} estado={estado} />
    </div>
  );
}
