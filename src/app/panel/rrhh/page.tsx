import Link from 'next/link';
import { getTrabajadores, getContratosPorVencer } from '@/app/rrhh_actions';
import { Users, Plus, Search, Calculator } from 'lucide-react';
import RRHHTableClient from '@/components/rrhh/RRHHTableClient';
import ContratosAlertWidget from '@/components/rrhh/ContratosAlertWidget';

export default async function RRHHPage({
  searchParams
}: {
  searchParams: { search?: string, estado?: string }
}) {
  const search = searchParams.search || '';
  const estado = searchParams.estado || 'ACTIVO';

  const [res, alertRes] = await Promise.all([
    getTrabajadores(search, estado),
    getContratosPorVencer(30)
  ]);
  
  const trabajadores = res.success ? (res.data as any[]) : [];
  const contratosVencer = alertRes.success ? (alertRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recursos Humanos</h1>
          <p className="text-slate-500">Gestión de personal y contratos</p>
        </div>
        <div className="flex gap-3">
          <Link href="/panel/rrhh/parametros" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
            <Calculator size={18} />
            <span className="hidden sm:inline">Parámetros</span>
          </Link>
          <Link href="/panel/rrhh/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Empleado</span>
          </Link>
        </div>
      </div>

      <ContratosAlertWidget contratos={contratosVencer} />

      <RRHHTableClient initialTrabajadores={trabajadores} search={search} estado={estado} />
    </div>
  );
}
