import { AlertTriangle, Clock, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function ContratosAlertWidget({ contratos }: { contratos: any[] }) {
  if (contratos.length === 0) {
    return null; // No alerts to show
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-4 text-amber-700">
        <AlertTriangle size={24} />
        <h3 className="text-lg font-bold">Atención: Contratos Próximos a Vencer</h3>
      </div>
      
      <p className="text-sm text-amber-800 mb-4">
        Los siguientes colaboradores tienen un contrato a plazo fijo que expira en los próximos 30 días.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contratos.map((c: any) => (
          <div key={c.id} className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <Link href={`/panel/rrhh/${c.trabajador_id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors">
                {c.nombres} {c.apellidos}
              </Link>
              <p className="text-xs text-slate-500 font-mono mt-1">{c.rut}</p>
              <p className="text-sm font-medium text-slate-700 mt-2 flex items-center gap-2">
                <BriefcaseIcon size={14} className="text-slate-400" /> {c.cargo}
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-amber-50 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <CalendarDays size={14} /> 
                {new Date(c.fecha_termino).toLocaleDateString()}
              </span>
              <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                c.dias_restantes <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <Clock size={12} />
                {c.dias_restantes} días
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BriefcaseIcon({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
