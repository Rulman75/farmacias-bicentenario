import PlanificadorTurnosClient from '@/components/rrhh/PlanificadorTurnosClient';
import { getPlanificacionMes } from '@/app/rrhh_planificacion_actions';
import { getTurnos } from '@/app/rrhh_turnos_actions';
import { getSucursalesRRHH } from '@/app/rrhh_actions';
import Link from 'next/link';
import { ChevronRight, CalendarDays } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlanificadorPage() {
  const hoy = new Date();
  
  const [planRes, turnosRes, sucursalesRes] = await Promise.all([
    getPlanificacionMes(hoy.getFullYear(), hoy.getMonth() + 1),
    getTurnos(),
    getSucursalesRRHH()
  ]);

  return (
    <div className="w-full mx-auto space-y-6 pb-20 flex flex-col h-[85vh]">
      <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
        <Link href="/panel/rrhh" className="hover:text-blue-600 transition-colors">Recursos Humanos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">Planificador de Turnos</span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-600/20">
          <CalendarDays size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planificador de Turnos (Honorarios / Part-Time)</h1>
          <p className="text-slate-500">Asigna los turnos por sucursal. Los cambios se guardan automáticamente.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PlanificadorTurnosClient 
          initialTrabajadores={planRes.success ? ((planRes as any).trabajadores || []) : []}
          initialAsignaciones={planRes.success ? ((planRes as any).asignaciones || []) : []}
          turnosCatalog={turnosRes.success ? (turnosRes.data as any[] || []) : []}
          sucursales={sucursalesRes.success ? (sucursalesRes.data as any[] || []) : []}
        />
      </div>
    </div>
  );
}
