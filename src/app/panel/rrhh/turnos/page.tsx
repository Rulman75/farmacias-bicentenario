import TurnosClient from '@/components/rrhh/TurnosClient';
import { getTurnos } from '@/app/rrhh_turnos_actions';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TurnosPage() {
  const res = await getTurnos();
  const turnos = res.success ? res.data : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Catálogo de Turnos</span>
      </div>

      <TurnosClient turnosIniciales={turnos || []} />
    </div>
  );
}
