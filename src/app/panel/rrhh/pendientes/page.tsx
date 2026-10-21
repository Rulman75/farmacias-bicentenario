export const dynamic = 'force-dynamic';

import { ArrowLeft, ChevronRight, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { getGestionContratos, getContratosPorVencer, getCargos, getSucursalesRRHH } from '@/app/rrhh_actions';
import ContratosAlertWidget from '@/components/rrhh/ContratosAlertWidget';
import GestionContratosClient from '@/components/rrhh/GestionContratosClient';

export default async function ContratosPage() {
  const [contratosRes, alertasRes, cargosRes, sucursalesRes] = await Promise.all([
    getGestionContratos(),
    getContratosPorVencer(30),
    getCargos(),
    getSucursalesRRHH()
  ]);

  const registros = contratosRes.success ? (contratosRes.data as any[]) : [];
  const alertas = alertasRes.success ? (alertasRes.data as any[]) : [];
  const cargos = cargosRes.success ? (cargosRes.data as any[]) : [];
  const sucursales = sucursalesRes.success ? (sucursalesRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/panel/rrhh"
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span className="font-medium text-sm">Volver</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
          <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">
            Recursos Humanos
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-800">Gestión de Contratos y Alertas</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <FileSignature size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Contratos y Anexos</h1>
            <p className="text-slate-500">Control de vigencias, renovaciones de plazo fijo y emisión de contratos en PDF</p>
          </div>
        </div>

        <Link
          href="/panel/rrhh/plantillas-contratos"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 w-fit"
        >
          <FileSignature size={16} />
          Gestionar Plantillas de Contratos
        </Link>
      </div>

      <ContratosAlertWidget contratos={alertas} />

      <GestionContratosClient registros={registros} cargos={cargos} sucursales={sucursales} />
    </div>
  );
}
