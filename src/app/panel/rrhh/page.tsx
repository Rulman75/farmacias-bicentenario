export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { getContratosPorVencer } from '@/app/rrhh_actions';
import { Users, FileText, Calculator, ChevronRight, Activity, CalendarDays, FileSignature, DollarSign, PieChart, Landmark } from 'lucide-react';
import ContratosAlertWidget from '@/components/rrhh/ContratosAlertWidget';

export default async function RRHHDashboardPage() {
  const alertRes = await getContratosPorVencer(30);
  const contratosVencer = alertRes.success ? (alertRes.data as any[]) : [];

  return (
    <div className="w-full mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Recursos Humanos</h1>
          <p className="text-slate-500 mt-1">Panel de control y resúmenes</p>
        </div>
      </div>

      <ContratosAlertWidget contratos={contratosVencer} />

      {/* Tarjetas de Acceso Rápido / Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* PERSONAL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-blue-100 p-2 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Personal</h2>
          </div>
          <div className="p-2 space-y-1 bg-slate-50">
            <Link href="/panel/rrhh/personal" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-blue-600">Ficha Personal</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
            </Link>
            <Link href="/panel/rrhh/pendientes" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-blue-600">Contratos Pendientes</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
            </Link>
            <Link href="/panel/rrhh/vacaciones" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-blue-600">Vacaciones</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
            </Link>
          </div>
        </div>

        {/* REMUNERACIONES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 text-emerald-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Remuneraciones</h2>
          </div>
          <div className="p-2 space-y-1 bg-slate-50">
            <Link href="/panel/rrhh/periodo" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-emerald-600">Proceso Mensual</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600" />
            </Link>
            <Link href="/panel/rrhh/haberes-descuentos" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-emerald-600">Haberes / Descuentos</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600" />
            </Link>
            <Link href="/panel/rrhh/anticipos" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-emerald-600">Anticipos</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600" />
            </Link>
          </div>
        </div>

        {/* REPORTES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-purple-100 p-2 text-purple-600 rounded-lg">
              <PieChart size={24} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Reportes</h2>
          </div>
          <div className="p-2 space-y-1 bg-slate-50">
            <Link href="/panel/rrhh/reportes/lre" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-purple-600">Libro Remuneraciones</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-600" />
            </Link>
            <Link href="/panel/rrhh/reportes/previred" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-purple-600">Libro Previred</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-600" />
            </Link>
            <Link href="/panel/rrhh/reportes/liquidaciones" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-purple-600">Emisión Masiva</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-600" />
            </Link>
          </div>
        </div>

        {/* MANTENEDORES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-amber-100 p-2 text-amber-600 rounded-lg">
              <Landmark size={24} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Mantenedores</h2>
          </div>
          <div className="p-2 space-y-1 bg-slate-50 h-full">
            <Link href="/panel/rrhh/parametros" className="flex items-center justify-between px-4 py-2 hover:bg-white rounded-lg transition-colors group">
              <span className="text-slate-600 font-medium group-hover:text-amber-600">Parámetros Mensuales</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-600" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
