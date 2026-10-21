export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { getPlantillasContratos, getCargos } from '@/app/rrhh_actions';
import PlantillasContratosClient from '@/components/rrhh/PlantillasContratosClient';

export default async function PlantillasContratosPage() {
  const [plantillasRes, cargosRes] = await Promise.all([
    getPlantillasContratos(),
    getCargos()
  ]);

  const plantillas = plantillasRes.success ? (plantillasRes.data as any[]) : [];
  const cargos = cargosRes.success ? (cargosRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/panel/rrhh/pendientes"
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span className="font-medium text-sm">Volver a Contratos</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
          <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">
            Recursos Humanos
          </Link>
          <ChevronRight size={14} />
          <Link href="/panel/rrhh/pendientes" className="hover:text-blue-600 transition-colors">
            Contratos
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-800">Plantillas de Contratos</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-600/20">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plantillas de Contratos por Cargo y Modalidad</h1>
          <p className="text-slate-500">
            Configura los modelos de contratos (Auxiliar Plazo Fijo, Químico Plazo Fijo, Indefinidos, etc.) con etiquetas dinámicas
          </p>
        </div>
      </div>

      <PlantillasContratosClient plantillas={plantillas} cargos={cargos} />
    </div>
  );
}
