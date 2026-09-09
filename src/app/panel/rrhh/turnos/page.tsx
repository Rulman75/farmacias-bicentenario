import TurnosClient from '@/components/rrhh/TurnosClient';
import { getTurnos } from '@/app/rrhh_turnos_actions';
import Link from 'next/link';
import { ArrowLeft,  ChevronRight  } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TurnosPage() {
  const res = await getTurnos();
  const turnos = res.success ? res.data : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/panel/rrhh" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
          <ArrowLeft size={16} />
          <span className="font-medium text-sm">Volver</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Catálogo de Turnos</span>
        </div>
      </div>

      <TurnosClient turnosIniciales={turnos || []} />
    </div>
  );
}
