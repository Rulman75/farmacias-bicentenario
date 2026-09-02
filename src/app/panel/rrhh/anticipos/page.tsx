
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ChevronRight, Banknote } from 'lucide-react';
import AnticiposFormClient from '@/components/rrhh/AnticiposFormClient';
import { getTrabajadores } from '@/app/rrhh_actions';
import { getAnticiposByPeriodo } from '@/app/rrhh_anticipos_actions';

export default async function AnticiposPage() {
  const d = new Date();
  const periodoActual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const [tRes, aRes] = await Promise.all([
    getTrabajadores('', 'ACTIVO'),
    getAnticiposByPeriodo(periodoActual)
  ]);

  const trabajadores = tRes.success ? (tRes.data as any[]) : [];
  const anticipos = aRes.success ? (aRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-emerald-600 transition-colors">RRHH</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Anticipos de Sueldo</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg shadow-emerald-600/20">
          <Banknote size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Anticipos de Sueldo</h1>
          <p className="text-slate-500">Gestión de adelantos descontables por planilla ({periodoActual})</p>
        </div>
      </div>

      <AnticiposFormClient 
        trabajadores={trabajadores} 
        anticiposHoy={anticipos} 
        periodoActual={periodoActual} 
      />
    </div>
  );
}
