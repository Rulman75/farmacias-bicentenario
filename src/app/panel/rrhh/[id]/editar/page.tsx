import { getAfps, getSalud, getTrabajadorById } from '@/app/rrhh_actions';
import TrabajadorForm from '@/components/rrhh/TrabajadorForm';
import { UserCog, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditarTrabajadorPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const [tRes, afpRes, saludRes] = await Promise.all([
    getTrabajadorById(parseInt(id)),
    getAfps(),
    getSalud()
  ]);

  if (!tRes.success) {
    notFound();
  }

  const afps = afpRes.success ? (afpRes.data as any[]) : [];
  const salud = saludRes.success ? (saludRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <Link href={`/panel/rrhh/${id}`} className="hover:text-blue-600 transition-colors">Ficha</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Editar</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-500 p-3 rounded-xl text-white shadow-lg shadow-amber-500/20">
          <UserCog size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Perfil</h1>
          <p className="text-slate-500">Actualizar información de {tRes.data.nombres} {tRes.data.apellidos}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
        <TrabajadorForm afps={afps} salud={salud} initialData={tRes.data} />
      </div>
    </div>
  );
}
