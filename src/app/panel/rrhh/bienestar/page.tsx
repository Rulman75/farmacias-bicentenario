
import { ArrowLeft,  ChevronRight  } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/panel/rrhh" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
          <ArrowLeft size={16} />
          <span className="font-medium text-sm">Volver</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">RRHH</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Bienestar</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Módulo: Bienestar</h1>
        <p className="text-slate-500">Esta sección está en construcción.</p>
      </div>
    </div>
  );
}
