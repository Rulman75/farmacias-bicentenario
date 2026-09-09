
import { ArrowLeft,  ChevronRight, Calculator  } from 'lucide-react';
import Link from 'next/link';
import ProcesoLiquidacionesClient from '@/components/rrhh/ProcesoLiquidacionesClient';

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
        <span className="font-medium text-slate-800">Centro de Nómina</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg shadow-emerald-600/20">
          <Calculator size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centro de Nómina y Liquidaciones</h1>
          <p className="text-slate-500">Generación masiva, revisión de cuadratura y envío por correo</p>
        </div>
      </div>

      <ProcesoLiquidacionesClient />
    </div>
  );
}
