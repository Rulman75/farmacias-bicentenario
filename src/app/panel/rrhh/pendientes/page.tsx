
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">RRHH</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Pendientes</span>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Módulo: Pendientes</h1>
        <p className="text-slate-500">Esta sección está en construcción.</p>
      </div>
    </div>
  );
}
