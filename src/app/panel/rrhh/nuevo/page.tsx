import { getAfps, getSalud } from '@/app/rrhh_actions';
import TrabajadorForm from '@/components/rrhh/TrabajadorForm';
import { Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function NuevoTrabajadorPage() {
  const [afpRes, saludRes] = await Promise.all([
    getAfps(),
    getSalud()
  ]);

  const afps = afpRes.success ? (afpRes.data as any[]) : [];
  const salud = saludRes.success ? (saludRes.data as any[]) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Nuevo Trabajador</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-600/20">
          <Users size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ficha de Ingreso</h1>
          <p className="text-slate-500">Registrar un nuevo colaborador en el sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
        <TrabajadorForm afps={afps} salud={salud} />
      </div>
    </div>
  );
}
