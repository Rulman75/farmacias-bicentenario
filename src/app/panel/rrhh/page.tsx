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

      {/* PERSONAL */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Users size={20} /></div>
          Gestión de Personal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/panel/rrhh/personal" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Ficha Personal</span>
          </Link>
          <Link href="/panel/rrhh/asistencia" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarDays size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Asistencia</span>
          </Link>
          <Link href="/panel/rrhh/pendientes" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileSignature size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Contratos</span>
          </Link>
          <Link href="/panel/rrhh/finiquito" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Finiquitos</span>
          </Link>
          <Link href="/panel/rrhh/vacaciones" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarDays size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Ausentismos</span>
          </Link>
        </div>
      </div>

      {/* REMUNERACIONES */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><DollarSign size={20} /></div>
          Remuneraciones
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/panel/rrhh/periodo" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Proceso Mensual</span>
          </Link>
          <Link href="/panel/rrhh/haberes-descuentos" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calculator size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Haberes Extras</span>
          </Link>
          <Link href="/panel/rrhh/anticipos" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Anticipos</span>
          </Link>
        </div>
      </div>

      {/* REPORTES Y CONFIG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg"><PieChart size={20} /></div>
            Reportes Legales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/panel/rrhh/reportes/lre" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <span className="font-bold text-slate-700 text-sm">LRE (DT)</span>
            </Link>
            <Link href="/panel/rrhh/reportes/previred" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PieChart size={28} />
              </div>
              <span className="font-bold text-slate-700 text-sm">Previred</span>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg"><Landmark size={20} /></div>
            Configuración
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/panel/rrhh/parametros" className="flex flex-col items-center text-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-amber-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Landmark size={28} />
              </div>
              <span className="font-bold text-slate-700 text-sm">Indicadores Prev.</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
